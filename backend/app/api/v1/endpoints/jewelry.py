import json
import logging
from typing import Optional
from fastapi import APIRouter, Request, HTTPException
from ....core.config import settings
from ....schemas.jewelry import (
    JewelryDesignRequest,
    JewelryDesignResponse,
    PriceEstimateRequest,
)
from ....schemas.pipeline import (
    PipelineOptionEnum,
    AestheticStyleEnum,
    CanvasStagingRequest,
    CanvasStagingResponse,
)
from ....schemas.gemstone import TeamMemberGemstoneInput
from ....services.generation_pipeline import generation_pipeline
from ....services.canvas_stager import canvas_stager
from ....services.valuation_engine import valuation_engine

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate-design", response_model=JewelryDesignResponse)
async def generate_jewelry_design(request: Request):
    """
    Synthesizes bespoke jewelry design and computes itemized BOM + LKR valuation.
    Supports Option A (Inpainting), Option B (IP-Adapter), and Hybrid Production Pipeline (A + B).
    Seamlessly integrates loose gemstone metadata from other team member components.
    Accepts application/json OR multipart/form-data.
    """
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        body_dict = await request.json()
        req = JewelryDesignRequest.model_validate(body_dict)
    else:
        form = await request.form()

        team_gem = None
        team_gem_raw = form.get("team_member_gemstone_json") or form.get("team_member_gemstone")
        if team_gem_raw:
            try:
                if isinstance(team_gem_raw, str):
                    team_gem = TeamMemberGemstoneInput.model_validate(json.loads(team_gem_raw))
                elif isinstance(team_gem_raw, dict):
                    team_gem = TeamMemberGemstoneInput.model_validate(team_gem_raw)
            except Exception as ex:
                logger.warning(f"Could not parse team member gemstone: {ex}")

        image_b64 = form.get("image_base64")
        image_file = form.get("image") or form.get("file")
        if image_file and hasattr(image_file, "read"):
            import base64
            contents = await image_file.read()
            image_b64 = base64.b64encode(contents).decode("utf-8")

        pipeline_raw = form.get("pipeline_option")
        pipeline_enum = PipelineOptionEnum.HYBRID
        if pipeline_raw:
            try:
                pipeline_enum = PipelineOptionEnum(pipeline_raw)
            except ValueError:
                pass

        aesthetic_raw = form.get("aesthetic_style")
        aesthetic_enum = AestheticStyleEnum.MODERN
        if aesthetic_raw:
            try:
                aesthetic_enum = AestheticStyleEnum(aesthetic_raw)
            except ValueError:
                pass

        req = JewelryDesignRequest(
            category=form.get("category") or "Ring",
            metal=form.get("metal") or "22KT Gold",
            metal_weight_g=float(form.get("metal_weight_g") or 5.0),
            gemstone=form.get("gemstone") or "Blue Sapphire",
            gemstone_weight_ct=float(form.get("gemstone_weight_ct") or 2.5),
            setting_type=form.get("setting_type") or "Prong",
            color_grade=form.get("color_grade") or "Royal Blue",
            stone_grade=form.get("stone_grade") or "AA (Fine Jewelry)",
            treatment=form.get("treatment") or "Heated",
            number_of_accent_stones=int(form.get("number_of_accent_stones") or 0),
            prompt=form.get("prompt") or "A ring with multiple lines of this gem",
            aesthetic_style=aesthetic_enum,
            pipeline_option=pipeline_enum,
            gemstone_asset_id=form.get("gemstone_asset_id"),
            team_member_gemstone=team_gem,
            image_base64=image_b64,
        )

    return await generation_pipeline.generate_design_and_valuation(req)


@router.post("/price-estimate")
async def estimate_jewelry_pricing(request: PriceEstimateRequest):
    """
    Fast pricing engine: Calculates BOM breakdown and P10/P50/P90 market valuation intervals.
    Incorporates loose gemstone variables (weight, color, shape, size, price) from other team members.
    """
    result = valuation_engine.evaluate_quotation(
        category=request.category,
        metal=request.metal,
        metal_weight_g=request.metal_weight_g,
        gemstone=request.gemstone,
        gemstone_weight_ct=request.gemstone_weight_ct,
        color_grade=request.color_grade,
        stone_grade=request.stone_grade,
        treatment=request.treatment,
        setting_type=request.setting_type,
        number_of_accent_stones=request.number_of_accent_stones,
        design_complexity=request.design_complexity or "Simple",
        team_member_gemstone=request.team_member_gemstone,
    )
    return result


@router.post("/stage-canvas", response_model=CanvasStagingResponse)
async def stage_loose_stone_canvas(request: CanvasStagingRequest):
    """
    Executes Steps 1 & 2 of the production pipeline:
    - Segments loose stone (rembg/alpha cutout)
    - Stages stone onto 1024x1024 canvas
    - Generates binary inpainting mask (with prong overlap margin)
    """
    try:
        return canvas_stager.stage_gemstone(request)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.get("/pipeline-options")
async def get_pipeline_options():
    """Returns details on supported generative diffusion and inpainting architectures."""
    return {
        "options": [
            {
                "id": PipelineOptionEnum.OPTION_A_INPAINTING.value,
                "name": "Option A: FLUX.2 Inpainting / Outpainting",
                "description": "Protects 100% exact original gemstone pixels via mask; generates metal band and setting outward.",
            },
            {
                "id": PipelineOptionEnum.OPTION_B_IPADAPTER.value,
                "name": "Option B: FLUX.2 Redux / IP-Adapter",
                "description": "Vision encoder (SigLIP/CLIP) image conditioning + T5-XXL text prompt for setting style.",
            },
            {
                "id": PipelineOptionEnum.HYBRID.value,
                "name": "Production Pipeline (Hybrid A + B)",
                "description": "Step 1 Background Removal -> Step 2 1024x1024 Staging -> Step 3 Inpainting with realistic prong overlap and cast shadows.",
            },
            {
                "id": PipelineOptionEnum.TEXT_TO_IMAGE.value,
                "name": "Direct FLUX.2 LoRA Generative Synthesis",
                "description": "Text-prompt driven studio jewelry synthesis using fine-tuned PEFT LoRA adapter.",
            },
        ]
    }
