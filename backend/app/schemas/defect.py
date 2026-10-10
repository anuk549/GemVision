"""Defect detection API schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """Defect region reported in pixels and as a percentage of the image."""

    x_min: int
    y_min: int
    x_max: int
    y_max: int
    center_x: int
    center_y: int
    x_min_pct: float
    y_min_pct: float
    x_max_pct: float
    y_max_pct: float
    center_x_pct: float
    center_y_pct: float


class DefectInfo(BaseModel):
    """Human-readable interpretation of the predicted class."""

    name: str
    severity: str
    description: str
    location: str


class DetectionVisuals(BaseModel):
    """PNG images encoded as ``data:image/png;base64,...`` strings."""

    heatmap: str | None = Field(None, description="Grad-CAM heatmap")
    overlay: str | None = Field(None, description="Heatmap blended over the image")
    gem_mask: str | None = Field(None, description="Detected gemstone mask")


class DetectionResult(BaseModel):
    """Result of analysing a single image with a single model."""

    model_name: str
    backbone: str
    predicted_class: str
    predicted_index: int
    confidence: float = Field(..., ge=0.0, le=1.0)
    probabilities: dict[str, float]
    defect: DefectInfo
    gem_coverage_pct: float = Field(..., description="Gemstone area as % of image")
    defect_coverage_pct: float = Field(..., description="Defect region as % of image")
    bounding_box: BoundingBox | None = None
    visuals: DetectionVisuals


class ModelInfo(BaseModel):
    key: str
    name: str
    backbone: str
    file: str
    loaded: bool
    class_names: list[str]
    image_size: list[int]


class ModelsResponse(BaseModel):
    default: str
    models: list[ModelInfo]


class VisionStatus(BaseModel):
    tensorflow: str
    models_loaded: int
    models_total: int
    model_dir: str


class HealthResponse(BaseModel):
    status: str
    version: str
    vision: VisionStatus
