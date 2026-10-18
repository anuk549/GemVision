"""Gem cutting pattern recommendation API schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CuttingPattern(BaseModel):
    """A cutting pattern definition loaded from config."""

    id: str
    name: str
    designer: str
    facets: int = Field(..., ge=1)
    index: int = Field(..., ge=1)
    angles: dict[str, float] = Field(default_factory=dict)


class PatternRenderInfo(BaseModel):
    """Metadata returned alongside a rendered pattern image."""

    pattern_id: str
    name: str
    content_type: str = "image/png"


class PatternRecommendation(BaseModel):
    """Result of recommending a cutting pattern for a gem image."""

    gem_type: str
    state: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    recommended_pattern: CuttingPattern
