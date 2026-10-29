"""Pydantic schemas for gem identification."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ClassProbability(BaseModel):
    class_name: str = Field(..., alias="class", description="Model class label (e.g. blue_sapphire)")
    label: str = Field(..., description="Human-readable gemstone name")
    confidence: float = Field(..., description="Confidence percentage (0-100)")

    model_config = {"populate_by_name": True}


class GemIdentificationResult(BaseModel):
    id: str = Field(..., description="Folder identifier, e.g. i-001")
    folder: str = Field(..., description="Folder name in backend assets")
    raw_class: str = Field(..., description="Model class output (e.g. blue_sapphire)")
    gem: str = Field(..., description="Human-readable gemstone name (e.g. Blue Sapphire)")
    confidence: float = Field(..., description="Primary confidence percentage (0-100)")
    formatted_prediction: str = Field(..., description="e.g. Prediction: blue_sapphire (99.80% confidence)")
    can_proceed_to_pricing: bool = Field(..., description="True if blue_sapphire or yellow_sapphire")
    probabilities: list[ClassProbability] = Field(default_factory=list, description="All 4 class probabilities")
    saved_path: str = Field(..., description="Relative path in backend assets")
    image_url: str = Field(..., description="URL or endpoint to fetch the image")
    created_at: int = Field(..., description="Timestamp in milliseconds")
