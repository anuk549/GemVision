import logging
from typing import Optional, Tuple
from PIL import Image
from ..core.config import settings
from ..schemas.pipeline import CanvasStagingRequest, CanvasStagingResponse
from ...reusable_components.image_utils import (
    load_gemstone_from_assets,
    base64_to_pil,
    pil_to_base64,
    stage_gemstone_on_canvas,
)

logger = logging.getLogger(__name__)


class CanvasStagingService:
    """
    Executes Step 1 (Segmentation) & Step 2 (1024x1024 Canvas Staging)
    for Option A, Option B, and Hybrid Inpainting pipelines.
    """

    def stage_gemstone(self, request: CanvasStagingRequest) -> CanvasStagingResponse:
        gem_image: Optional[Image.Image] = None

        # 1. Try loading from assets catalog
        if request.gemstone_asset_id:
            gem_image = load_gemstone_from_assets(request.gemstone_asset_id, settings.GEMSTONES_DIR)

        # 2. Try loading from base64 input
        if not gem_image and request.gemstone_image_base64:
            try:
                gem_image = base64_to_pil(request.gemstone_image_base64)
            except Exception as ex:
                logger.error(f"Failed to decode base64 gemstone image: {ex}")

        # 3. Fallback to default catalog stone
        if not gem_image:
            gem_image = load_gemstone_from_assets("blue_sapphire_cushion_2.5ct.png", settings.GEMSTONES_DIR)

        if not gem_image:
            raise ValueError("No valid loose gemstone image found or provided.")

        canvas, inpainting_mask, bbox = stage_gemstone_on_canvas(
            gem_image=gem_image,
            canvas_size=request.target_canvas_size,
            gem_scale_ratio=request.gem_scale_ratio,
            prong_overlap_margin=request.prong_overlap_pixels,
        )

        return CanvasStagingResponse(
            canvas_image_base64=pil_to_base64(canvas, format="PNG"),
            mask_image_base64=pil_to_base64(inpainting_mask, format="PNG"),
            gem_bounding_box=list(bbox),
            overlap_margin=request.prong_overlap_pixels,
            pipeline_mode="staged_transparent_1024",
        )


canvas_stager = CanvasStagingService()
