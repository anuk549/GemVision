import logging
from typing import Dict, Any, Optional
from PIL import Image
from ..core.config import settings
from ..schemas.pipeline import PipelineOptionEnum, CanvasStagingRequest
from ..schemas.jewelry import JewelryDesignRequest, JewelryDesignResponse, AuditedAttributes
from .canvas_stager import canvas_stager
from .runpod_client import runpod_client
from .bfl_client import bfl_client
from .gemini_bridge import gemini_bridge
from .valuation_engine import valuation_engine
try:
    from reusable_components.image_utils import (
        load_gemstone_from_assets,
        base64_to_pil,
        pil_to_base64,
    )
except (ImportError, ValueError):
    from backend.reusable_components.image_utils import (
        load_gemstone_from_assets,
        base64_to_pil,
        pil_to_base64,
    )

logger = logging.getLogger(__name__)

NON_SAPPHIRE_KEYWORDS = [
    "ruby", "emerald", "diamond", "tanzanite", "alexandrite", "opal",
    "garnet", "amethyst", "tourmaline", "topaz", "aquamarine", "peridot",
    "spinel", "pearl", "zircon", "quartz", "jade", "tsavorite"
]


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

    def build_studio_conditioned_prompt(self, request: JewelryDesignRequest) -> str:
        """
        Base Prompt Instruction Engine:
        Enriches user prompts with decoupled qualitative scale tokens,
        fine jewelry craftsmanship standards, and studio macro photography rules.
        """
        import re
        user_p = (request.prompt or "").strip()
        gem = request.gemstone or "Blue Sapphire"
        cat = request.category or "Ring"
        metal = request.metal or "22KT Gold"
        setting = request.setting_type or "Prong"
        aesthetic = request.aesthetic_style.value if hasattr(request.aesthetic_style, "value") else str(request.aesthetic_style or "Modern")
        carat = float(request.gemstone_weight_ct or 2.5)

        # Decouple carats into qualitative scale tokens (prevents diffusion 2D scaling artifacts)
        if carat >= 3.5:
            scale_cue = "commanding centerpiece"
        elif carat >= 1.8:
            scale_cue = "prominent centerpiece"
        else:
            scale_cue = "delicate centerpiece"

        if not user_p:
            return (
                f"A bespoke luxury {cat.lower()} featuring a {scale_cue} {carat:.2f}ct {request.color_grade or 'Royal Blue'} Ceylon {gem} "
                f"held securely in an exquisite {setting.lower()} setting crafted in polished {metal}, "
                f"{aesthetic.lower()} architectural contours, macro studio jewelry photography, "
                f"sharp facet reflections, high refraction dispersion, specular highlights, dark neutral studio backdrop, 8k resolution"
            )

        if "macro" in user_p.lower() and "studio" in user_p.lower():
            return user_p

        core_vision = user_p
        if re.search(r"multiple lines|lines of|several lines|multi line|multi-line", core_vision, re.IGNORECASE):
            core_vision = re.sub(
                r"with multiple lines of this gem|with multiple lines|multiple lines of this gem|multiple lines",
                "featuring multiple intertwining fluid bands encrusted with micro-pavé melee lines",
                core_vision,
                flags=re.IGNORECASE
            )
        elif re.search(r"\bhalo\b", core_vision, re.IGNORECASE) and not re.search(r"micro-pavé halo", core_vision, re.IGNORECASE):
            core_vision = re.sub(r"\bhalo\b", "delicate micro-pavé brilliant-cut diamond halo", core_vision, flags=re.IGNORECASE)

        core_vision = core_vision[0].upper() + core_vision[1:] if core_vision else core_vision

        has_gem = "sapphire" in core_vision.lower() or "gem" in core_vision.lower()
        has_metal = bool(re.search(r"gold|silver|platinum", core_vision, re.IGNORECASE))
        has_setting = bool(re.search(r"prong|bezel|pave|channel|halo", core_vision, re.IGNORECASE))

        color_str = f"{request.color_grade} " if request.color_grade else ""
        stone_clause = (
            f"highlighting the {scale_cue} {carat:.2f}ct {color_str}Ceylon {gem}"
            if has_gem else
            f"featuring a {scale_cue} {carat:.2f}ct {color_str}Ceylon {gem}"
        )
        setting_clause = "" if has_setting else f"secured in a refined {setting.lower()} mount"
        metal_clause = "" if has_metal else f"crafted in lustrous {metal}"

        studio_tokens = [
            f"{aesthetic.lower()} aesthetic contours",
            "macro studio jewelry product photography",
            "sharp facet reflections",
            "high refraction dispersion",
            "specular highlights",
            "neutral studio lighting",
            "8k resolution fine jewelry render"
        ]

        clauses = [core_vision]
        if request.color_grade and request.color_grade.lower() not in core_vision.lower():
            clauses.append(stone_clause)
        if setting_clause:
            clauses.append(setting_clause)
        if metal_clause:
            clauses.append(metal_clause)
        clauses.extend(studio_tokens)

        return ", ".join([c for c in clauses if c])

    def detect_non_sapphire(self, prompt: str, gemstone: str) -> Optional[str]:
        p_lower = prompt.lower()
        for keyword in NON_SAPPHIRE_KEYWORDS:
            if keyword in p_lower:
                return keyword.capitalize()
        if gemstone and not any(s in gemstone.lower() for s in ["sapphire", "padparadscha"]):
            return gemstone
        return None

    async def generate_design_and_valuation(
        self,
        request: JewelryDesignRequest,
    ) -> JewelryDesignResponse:
        pipeline = request.pipeline_option or PipelineOptionEnum.HYBRID
        raw_prompt = request.prompt or f"A bespoke luxury {request.category} in {request.metal} with {request.setting_type} setting"
        aesthetic = request.aesthetic_style.value if hasattr(request.aesthetic_style, "value") else str(request.aesthetic_style or "Modern")

        # Synthesize base prompt with studio conditioning instructions
        conditioned_prompt = self.build_studio_conditioned_prompt(request)

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

        # 2. Dispatch Priority:
        # Priority 1: Official Black Forest Labs FLUX API (if BFL_API_KEY is configured in .env)
        # Priority 2: RunPod Serverless Infrastructure (if configured)
        # Priority 3: High-Res Local Design Sample (Offline fallback)
        rendered_image_b64: Optional[str] = None
        execution_source = "mock_local"

        if bfl_client.is_configured():
            try:
                # If Option A or Hybrid Inpainting with loose gemstone canvas staging:
                if (
                    pipeline in [PipelineOptionEnum.OPTION_A_INPAINTING, PipelineOptionEnum.HYBRID]
                    and staging_data
                    and request.reference_type != "sketch"
                ):
                    logger.info("Dispatching Inpainting to Black Forest Labs flux-pro-1.0-fill (preserving loose gem)...")
                    bfl_res = await bfl_client.inpaint_image(
                        image_base64=staging_data.canvas_image_base64,
                        mask_base64=staging_data.mask_image_base64,
                        prompt=conditioned_prompt,
                    )
                    rendered_image_b64 = bfl_res.get("image_base64")
                    execution_source = "black_forest_labs"
                else:
                    # Text-to-Image / Option B / Jewelry Sketch guidance:
                    logger.info("Dispatching Text-to-Image to Black Forest Labs FLUX...")
                    sketch_cue = ""
                    if request.reference_type == "sketch" and request.image_base64:
                        sketch_cue = ", adhering precisely to the structural geometry, shank curves, and prong positions of the uploaded jewelry design sketch"
                    bfl_res = await bfl_client.generate_image(
                        prompt=conditioned_prompt + sketch_cue,
                    )
                    rendered_image_b64 = bfl_res.get("image_base64")
                    execution_source = "black_forest_labs"
            except Exception as ex:
                logger.error(f"Black Forest Labs FLUX dispatch encountered an issue: {ex}. Checking RunPod/local fallback.")

        # Priority 2: RunPod Serverless Dispatch
        if not rendered_image_b64:
            endpoint_id = (
                settings.RUNPOD_INPAINTING_ENDPOINT_ID
                if pipeline in [PipelineOptionEnum.OPTION_A_INPAINTING, PipelineOptionEnum.HYBRID]
                else settings.RUNPOD_IPADAPTER_ENDPOINT_ID or settings.RUNPOD_FLUX_ENDPOINT_ID
            )

            if runpod_client.is_configured(endpoint_id):
                runpod_payload = {
                    "pipeline": pipeline.value,
                    "prompt": conditioned_prompt,
                    "raw_user_prompt": raw_prompt,
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
                "prompt": raw_prompt,
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

        # Check for non-sapphire calibration notice
        non_sapphire = self.detect_non_sapphire(raw_prompt, request.gemstone or "")

        return JewelryDesignResponse(
            status="success",
            prompt=raw_prompt,
            aesthetic_style=aesthetic,
            pipeline_used=pipeline.value,
            image_base64=rendered_image_b64,
            design_sample=sample_index,
            audited_attributes=audited_attributes,
            bom_breakdown=val_result["bom_breakdown"],
            valuation=val_result["valuation"],
            execution_source=execution_source,
            metadata={
                "conditioned_diffusion_prompt": conditioned_prompt,
                "prong_overlap_pixels": staging_data.overlap_margin if staging_data else 0,
                "staged_gem_bbox": staging_data.gem_bounding_box if staging_data else None,
                "reconciled_gemstone_inputs": val_result["reconciled_inputs"],
                "non_sapphire_detected": non_sapphire,
                "pricing_calibration_note": (
                    f"Pricing engine calibrated on Ceylon Sapphires (Blue & Yellow) (R²=0.836). Quotation for {non_sapphire} is an approximate baseline."
                    if non_sapphire
                    else "Calibrated Ceylon Sapphire dynamic valuation"
                ),
            },
        )


generation_pipeline = GenerationPipelineCoordinator()
