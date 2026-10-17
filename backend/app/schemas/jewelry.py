"""Pydantic schemas for rule-based jewelry recommendation."""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class JewelryRecommendationRequest(BaseModel):
    weight: float = Field(..., gt=0, description="Carat weight (0.50 - 5.00 ct)")
    shape: str = Field(default="Oval", description="Gemstone cut shape (e.g. Oval, Round, Cushion)")
    treatment: str = Field(default="Heat Treated", description="Treatment status (e.g. Heat Treated, Unheated)")
    clarity: str = Field(default="Eye Clean", description="Clarity rating (e.g. Eye Clean, Slightly Included)")
    cut: str = Field(default="Mixed Brilliant Cut", description="Faceting cut style")

    # Auxiliary attributes accepted from price prediction form without rejection
    length: float | None = Field(default=None, description="Length in mm")
    width: float | None = Field(default=None, description="Width in mm")
    height: float | None = Field(default=None, description="Height in mm")
    color: str | None = Field(default=None, description="Color name")
    intensity: str | None = Field(default=None, description="Color intensity")
    origin: str | None = Field(default=None, description="Gemstone origin")


class JewelryRecommendationResponse(BaseModel):
    recommended: str = Field(..., description="Top recommended jewelry type: Ring, Earring, or Necklace")
    scores: dict[str, float] = Field(..., description="Suitability scores for ring, earring, and necklace (0-100%)")
    recommendation_explanation: str = Field(..., description="Natural language explanation of the recommendation")
    factor_breakdown: dict[str, Any] | None = Field(default=None, description="Per-factor contribution breakdown")
    reasons: dict[str, list[str]] | None = Field(default=None, description="Detailed reasons per category")
    method: str = Field(default="rule_based_weighted_suitability", description="Recommendation algorithm")
    disclaimer: str = Field(default="", description="Research disclaimer")
