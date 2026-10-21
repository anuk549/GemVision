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
from .currency_service import currency_service
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

        # Decouple carats into qualitative scale tokens (prevents diffusion 2D scaling artifacts and text on gems)
        if carat >= 3.5:
            scale_cue = "commanding centerpiece"
        elif carat >= 1.8:
            scale_cue = "prominent centerpiece"
        else:
            scale_cue = "delicate centerpiece"

        if not user_p:
            user_p = f"A bespoke {aesthetic.lower()} fine jewelry {cat.lower()} showcasing a {scale_cue} natural {gem} handcrafted in lustrous {metal}"

        # Normalize raw numbers and units to prevent diffusion model from rendering typography on gemstone
        clean_user_p = re.sub(r"\b\d+(\.\d+)?\s*(ct|carats?|carat)\b", scale_cue, user_p, flags=re.IGNORECASE)
        clean_user_p = re.sub(r"\b\d+(\.\d+)?\s*(g|grams?|gram)\b", "fine precious metal", clean_user_p, flags=re.IGNORECASE)

        has_accent_request = bool(re.search(
            r"\b(accent|accents|side\s*stones?|side\s*diamonds?|halo|pav[eé]|melee|cluster|flanking|three[-\s]stone|surrounding\s*diamonds?|channel[-\s]set\s*diamonds?|shoulder\s*diamonds?)\b",
            clean_user_p,
            re.IGNORECASE
        ))

        if "macro" in clean_user_p.lower() and "studio" in clean_user_p.lower():
            if not has_accent_request:
                clean_user_p = re.sub(
                    r"\b(micro-?pav[eé](\s*diamonds?)?|pave\s*diamonds?|halo\s*of\s*diamonds?|accent\s*diamonds?|melee\s*diamonds?|side\s*diamonds?|flanking\s*diamonds?)\b",
                    "solid polished metal",
                    clean_user_p,
                    flags=re.IGNORECASE
                )
                if "zero accent stones" not in clean_user_p.lower():
                    clean_user_p += ", pure solitaire, single centerpiece gemstone only, strictly zero accent stones, no side diamonds, no halo stones, no pave"
            if "no text" not in clean_user_p.lower():
                clean_user_p += ", no text, no watermark, no typography, no labels, pristine fine jewelry render"
            return clean_user_p

        core_vision = clean_user_p
        if has_accent_request:
            if re.search(r"multiple lines|lines of|several lines|multi line|multi-line", core_vision, re.IGNORECASE):
                core_vision = re.sub(
                    r"with multiple lines of this gem|with multiple lines|multiple lines of this gem|multiple lines",
                    "featuring multiple intertwining fluid bands encrusted with micro-pavé melee lines",
                    core_vision,
                    flags=re.IGNORECASE
                )
            elif re.search(r"\bhalo\b", core_vision, re.IGNORECASE) and not re.search(r"micro-pavé halo", core_vision, re.IGNORECASE):
                core_vision = re.sub(r"\bhalo\b", "delicate micro-pavé brilliant-cut diamond halo", core_vision, flags=re.IGNORECASE)
        else:
            # Strictly prohibited: remove any accidental accent words
            core_vision = re.sub(
                r"\b(micro-?pav[eé](\s*diamonds?)?|pave\s*diamonds?|halo\s*of\s*diamonds?|accent\s*diamonds?|melee\s*diamonds?|side\s*diamonds?|flanking\s*diamonds?)\b",
                "polished solid metal",
                core_vision,
                flags=re.IGNORECASE
            )
            if re.search(r"multiple lines|lines of|several lines|multi line|multi-line", core_vision, re.IGNORECASE):
                core_vision = re.sub(
                    r"with multiple lines of this gem|with multiple lines|multiple lines of this gem|multiple lines",
                    "featuring multiple intertwining fluid polished solid metal bands",
                    core_vision,
                    flags=re.IGNORECASE
                )

        core_vision = core_vision[0].upper() + core_vision[1:] if core_vision else core_vision

        has_gem = "sapphire" in core_vision.lower() or "gem" in core_vision.lower()
        has_metal = bool(re.search(r"gold|silver|platinum", core_vision, re.IGNORECASE))
        has_setting = bool(re.search(r"prong|bezel|pave|channel|halo", core_vision, re.IGNORECASE))

        # Dynamically sanitize color grade to avoid contradictory color tokens (e.g. "Royal Blue Ceylon Yellow Sapphire")
        resolved_color = (request.color_grade or "").strip()
        if not resolved_color:
            resolved_color = "Vivid Yellow" if "yellow" in gem.lower() else "Royal Blue"
        elif "yellow" in gem.lower() and "blue" in resolved_color.lower():
            resolved_color = "Vivid Yellow"
        elif "blue" in gem.lower() and "yellow" in resolved_color.lower():
            resolved_color = "Royal Blue"

        color_str = f"{resolved_color} " if resolved_color else ""
        stone_clause = (
            f"highlighting the {scale_cue} {color_str}Ceylon {gem}"
            if has_gem else
            f"featuring a {scale_cue} {color_str}Ceylon {gem}"
        )
        setting_clause = "" if has_setting else f"secured in a refined {setting.lower()} mount"
        metal_clause = "" if has_metal else f"crafted in lustrous {metal}"

        studio_tokens = [
            f"{aesthetic.lower()} aesthetic contours",
            "macro studio jewelry product photography",
            "sharp facet reflections",
            "high refraction dispersion",
            "specular caustic highlights",
            "neutral luxury studio lighting",
            "8k resolution fine jewelry render",
            "no text, no watermark, no typography, no labels, pristine clean jewelry"
        ]

        clauses = [core_vision]
        if resolved_color and resolved_color.lower() not in core_vision.lower():
            clauses.append(stone_clause)
        if setting_clause:
            clauses.append(setting_clause)
        if metal_clause:
            clauses.append(metal_clause)

        # Multi-object bilateral symmetry for earrings
        if cat.lower() in ["earring", "earrings"] or "earring" in core_vision.lower():
            clauses.append(f"a perfectly matching pair of identical earrings, matching bilateral symmetry, identical {color_str}{gem} gemstones on both earrings, strictly uniform color across both earrings")

        # 3D Perspective angle directives to reveal full jewelry architecture instead of flat front-facing stones
        if cat.lower() == "ring":
            clauses.append("dynamic three-quarter isometric perspective angle view showcasing the elevated crown setting, openwork pavilion gallery rail, goldsmith prongs, and fluid curvature of the ring shank")
        elif cat.lower() in ["earring", "earrings"] or "earring" in core_vision.lower():
            clauses.append("angled three-quarter studio perspective showcasing both matching earrings, secure mountings, and dimensional depth")
        elif cat.lower() == "necklace":
            clauses.append("three-quarter drape perspective view showcasing pendant focal setting, bail attachment, and chain contour")
        else:
            clauses.append("dynamic three-quarter elevated perspective view showcasing three-dimensional jewelry architecture")

        if not has_accent_request:
            clauses.append("pure solitaire setting, single solitary centerpiece gemstone only, completely smooth solid metal, strictly zero accent stones, absolutely no side stones, no halo stones, no pave diamonds, no melee gems, no secondary stones")
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
        raw_prompt = (request.prompt or "").strip()
        if not raw_prompt:
            raw_prompt = f"A bespoke {aesthetic.lower()} fine jewelry {(request.category or 'Ring').lower()} showcasing a natural {request.gemstone or 'Blue Sapphire'} set in lustrous {request.metal or '22KT Gold'}"
            request.prompt = raw_prompt
        aesthetic = request.aesthetic_style.value if hasattr(request.aesthetic_style, "value") else str(request.aesthetic_style)

        # Synthesize base prompt with studio conditioning instructions
        conditioned_prompt = self.build_studio_conditioned_prompt(request)
        staging_data = None

        # 1. Multi-image conditioning references (uploaded gem photo and/or sketch)
        gem_b64 = request.image_base64 if request.reference_type != "sketch" else None
        sketch_b64 = request.sketch_base64 or (request.image_base64 if request.reference_type == "sketch" else None)

        input_img_1 = gem_b64 or sketch_b64
        input_img_2 = sketch_b64 if (gem_b64 and sketch_b64) else None

        sketch_cue = ""
        if sketch_b64:
            sketch_cue = ", adhering precisely to the structural geometry, shank curves, and prong positions of the uploaded jewelry design sketch"
        gem_cue = ""
        if gem_b64:
            gem_cue = ", seamlessly setting and showcasing the uploaded loose gemstone with its natural crystal clarity, facet reflections, and vivid color saturation"

        full_prompt = conditioned_prompt + gem_cue + sketch_cue

        # 2. Dispatch Priority:
        # Priority 1: Official Black Forest Labs FLUX.2 Klein 9B API (if BFL_API_KEY is configured in .env)
        # Priority 2: RunPod Serverless Infrastructure (if configured)
        # Priority 3: High-Res Local Design Sample (Offline fallback)
        rendered_image_b64: Optional[str] = None
        rendered_image_url: Optional[str] = None
        execution_source = "black_forest_labs"
        last_error: Optional[str] = None

        if bfl_client.is_configured():
            try:
                logger.info("Dispatching synthesis to Black Forest Labs FLUX 2 Klein 9B...")
                bfl_res = await bfl_client.generate_image(
                    prompt=full_prompt,
                    input_image=input_img_1,
                    input_image_2=input_img_2,
                )
                rendered_image_b64 = bfl_res.get("image_base64")
                rendered_image_url = bfl_res.get("image_url")
                execution_source = "black_forest_labs"
            except Exception as ex:
                last_error = f"Black Forest Labs FLUX dispatch error: {ex}"
                logger.error(last_error)

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
                    last_error = f"RunPod dispatch error: {ex}"
                    logger.error(last_error)

        # When image generation fails, DO NOT fall back to images in the assets folder!
        sample_index = 1
        if not rendered_image_b64:
            from fastapi import HTTPException
            err_msg = last_error or "Image generation failed: Could not obtain generated image from Black Forest Labs FLUX API."
            logger.error(err_msg)
            raise HTTPException(status_code=502, detail=err_msg)

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
        live_usd_rate = await currency_service.get_live_usd_to_lkr_rate()
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
            usd_rate=live_usd_rate,
        )

        # Check for non-sapphire calibration notice
        non_sapphire = self.detect_non_sapphire(raw_prompt, request.gemstone or "")

        return JewelryDesignResponse(
            status="success",
            prompt=raw_prompt,
            aesthetic_style=aesthetic,
            pipeline_used=pipeline.value,
            image_url=rendered_image_url,
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
