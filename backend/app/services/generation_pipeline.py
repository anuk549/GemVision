import logging
from typing import Dict, Any, Optional
from PIL import Image
from ..core.config import settings
from ..schemas.pipeline import PipelineOptionEnum, CanvasStagingRequest
from ..schemas.jewelry import JewelryDesignRequest, JewelryDesignResponse, AuditedAttributes
from .canvas_stager import canvas_stager
from .runpod_client import runpod_client
from .gemini_bridge import gemini_bridge
from .valuation_engine import valuation_engine
from ...reusable_components.image_utils import (
    load_gemstone_from_assets,
    base64_to_pil,
    pil_to_base64,
)

logger = logging.getLogger(__name__)


class GenerationPipelineCoordinator:
    """
    Coordinates Generative Design Synthesis across:
    - Option A: FLUX.2 Inpainting / Outpainting (Canvas Extension)
    - Option B: FLUX.2 Redux / IP-Adapter (Conditioning via Vision Encoder)
    - Hybrid Production Pipeline (A + B):
        Step 1: Background Removal / Segmentation of loose stone
        Step 2: Canvas Staging on 1024x1024 transparent canvas
        Step 3: FLUX Inpainting with realistic prong overlap
    """

    async def generate_design_and_valuation(
        self,
        request: JewelryDesignRequest,
    ) -> JewelryDesignResponse:
        pipeline = request.pipeline_option or PipelineOptionEnum.HYBRID
        prompt = request.prompt or f"A bespoke luxury {request.category} in {request.metal} with {request.setting_type} setting"
        aesthetic = request.aesthetic_style.value if hasattr(request.aesthetic_style, "value") else str(request.aesthetic_style or "Modern")

        # 1. Execute Canvas Staging (Steps 1 & 2) if pipeline requires loose stone preservation
        staging_data = None
        gemstone_asset_id = request.gemstone_asset_id
        if request.team_member_gemstone and request.team_member_gemstone.gemstone_asset_id:
            gemstone_asset_id = request.team_member_gemstone.gemstone_asset_id

        try:
            staging_req = CanvasStagingRequest(
                gemstone_asset_id=gemstone_asset_id,
                gemstone_image_base64=request.image_base64,
                target_canvas_size=1024,
                prong_overlap_pixels=14 if pipeline == PipelineOptionEnum.HYBRID else 0,
            )
            staging_data = canvas_stager.stage_gemstone(staging_req)
        except Exception as ex:
            logger.warning(f"Canvas staging notice: {ex}")

        # 2. RunPod Serverless Dispatch or Local High-Res Mock Synthesis
        rendered_image_b64: Optional[str] = None
        execution_source = "mock_local"

        endpoint_id = (
            settings.RUNPOD_INPAINTING_ENDPOINT_ID
            if pipeline in [PipelineOptionEnum.OPTION_A_INPAINTING, PipelineOptionEnum.HYBRID]
            else settings.RUNPOD_IPADAPTER_ENDPOINT_ID or settings.RUNPOD_FLUX_ENDPOINT_ID
        )

        if runpod_client.is_configured(endpoint_id):
            runpod_payload = {
                "pipeline": pipeline.value,
                "prompt": prompt,
                "aesthetic_style": aesthetic,
                "category": request.category,
                "metal": request.metal,
                "setting_type": request.setting_type,
                "canvas_image_base64": staging_data.canvas_image_base64 if staging_data else None,
                "mask_image_base64": staging_data.mask_image_base64 if staging_data else None,
            }
            try:
                runpod_res = await runpod_client.execute_job(endpoint_id, runpod_payload)
                if runpod_res.get("status") == "COMPLETED":
                    output = runpod_res.get("output", {})
                    rendered_image_b64 = output.get("image_base64")
                    execution_source = "runpod"
            except Exception as ex:
                logger.error(f"RunPod dispatch encountered an issue: {ex}. Using local mock render.")

        # Local fallback if RunPod not yet configured / offline
        sample_index = 1
        if not rendered_image_b64:
            # Pick sample render from backend/assets/designs
            if "vintage" in aesthetic.lower():
                sample_index = 2
            elif "minimal" in aesthetic.lower():
                sample_index = 3
            else:
                sample_index = 1

            sample_path = settings.DESIGNS_DIR / f"generated_design_{sample_index}.png"
            if sample_path.exists():
                try:
                    img = Image.open(sample_path)
                    rendered_image_b64 = pil_to_base64(img, format="PNG")
                except Exception as ex:
                    logger.error(f"Could not load sample render: {ex}")

        # 3. Visual Feature Audit (Gemini Vision)
        audit_raw = gemini_bridge.audit_features(
            image_path_or_base64=rendered_image_b64,
            user_specs={
                "prompt": prompt,
                "setting_type": request.setting_type,
                "number_of_accent_stones": request.number_of_accent_stones,
                "metal": request.metal,
            },
        )
        audited_attributes = AuditedAttributes(
            setting_type=audit_raw["setting_type"],
            number_of_accent_stones=audit_raw["number_of_accent_stones"],
            metal_tone=audit_raw["metal_tone"],
            design_complexity=audit_raw["design_complexity"],
        )

        # 4. Dynamic BOM & Quantile Valuation (Incorporating Team Member Gemstone Variables)
        val_result = valuation_engine.evaluate_quotation(
            category=request.category,
            metal=request.metal,
            metal_weight_g=request.metal_weight_g,
            gemstone=request.gemstone or "Blue Sapphire",
            gemstone_weight_ct=request.gemstone_weight_ct or 2.5,
            color_grade=request.color_grade or "Royal Blue",
            stone_grade=request.stone_grade or "AA (Fine Jewelry)",
            treatment=request.treatment or "Heated",
            setting_type=audited_attributes.setting_type,
            number_of_accent_stones=audited_attributes.number_of_accent_stones,
            design_complexity=audited_attributes.design_complexity,
            team_member_gemstone=request.team_member_gemstone,
        )

        return JewelryDesignResponse(
            status="success",
            prompt=prompt,
            aesthetic_style=aesthetic,
            pipeline_used=pipeline.value,
            image_base64=rendered_image_b64,
            design_sample=sample_index,
            audited_attributes=audited_attributes,
            bom_breakdown=val_result["bom_breakdown"],
            valuation=val_result["valuation"],
            execution_source=execution_source,
            metadata={
                "prong_overlap_pixels": staging_data.overlap_margin if staging_data else 0,
                "staged_gem_bbox": staging_data.gem_bounding_box if staging_data else None,
                "reconciled_gemstone_inputs": val_result["reconciled_inputs"],
            },
        )


generation_pipeline = GenerationPipelineCoordinator()
