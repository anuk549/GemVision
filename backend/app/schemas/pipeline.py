from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class PipelineOptionEnum(str, Enum):
    OPTION_A_INPAINTING = "option_a_inpainting"    # Canvas Extension with 100% mask-protected stone pixels
    OPTION_B_IPADAPTER = "option_b_ipadapter"      # Vision Encoder conditioning (SigLIP/CLIP) + T5 text prompt
    HYBRID = "hybrid"                              # Production Pipeline: Segmentation -> 1024x1024 Staging -> FLUX Inpainting
    TEXT_TO_IMAGE = "text_to_image"                # Direct LoRA diffusion synthesis


class AestheticStyleEnum(str, Enum):
    MODERN = "Modern"
    VINTAGE = "Vintage"
    MINIMAL = "Minimal"
    ART_DECO = "Art Deco"
    SOLITAIRE = "Solitaire"


class CanvasStagingRequest(BaseModel):
    gemstone_asset_id: Optional[str] = Field(None, description="Catalog ID or filename from assets")
    gemstone_image_base64: Optional[str] = Field(None, description="Base64 encoded loose stone image")
    target_canvas_size: int = Field(1024, description="Target square canvas dimension (default 1024)")
    gem_scale_ratio: float = Field(0.38, description="Proportion of canvas the gem occupies")
    prong_overlap_pixels: int = Field(16, description="Margin allowing prongs to naturally overlap gem edges")


class CanvasStagingResponse(BaseModel):
    canvas_image_base64: str = Field(..., description="1024x1024 staged image with gem centered on transparent/dark canvas")
    mask_image_base64: str = Field(..., description="Inpainting binary mask (0 = protected gem, 255 = inpaint band & setting)")
    gem_bounding_box: List[int] = Field(..., description="[x_min, y_min, x_max, y_max]")
    overlap_margin: int
    pipeline_mode: str
