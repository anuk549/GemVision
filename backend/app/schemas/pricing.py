"""Pydantic schemas for sapphire price prediction."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SapphirePricingRequest(BaseModel):
    weight: float = Field(..., gt=0, description="Carat weight (e.g. 2.10)")
    length: float = Field(..., gt=0, description="Length in mm (e.g. 8.4)")
    width: float = Field(..., gt=0, description="Width in mm (e.g. 6.9)")
    height: float = Field(..., gt=0, description="Height in mm (e.g. 4.6)")
    color: str = Field(..., description="Sapphire color (e.g. Blue, Yellow)")
    intensity: str = Field(default="Medium", description="Color intensity (e.g. Vivid, Intense)")
    clarity: str = Field(default="Eye Clean", description="Clarity rating (e.g. Eye Clean)")
    shape: str = Field(default="Oval", description="Cut shape (e.g. Oval, Cushion, Round)")
    cut: str = Field(default="Mixed Brilliant Cut", description="Faceting style")
    treatment: str = Field(default="Heat Treated", description="Treatment status")
    origin: str = Field(default="Ceylon (Sri Lanka)", description="Origin country / locality")
    coverage: float = Field(default=0.5, description="Confidence interval coverage (0.5, 0.6, 0.8, 0.9)")


class SapphirePricingResponse(BaseModel):
    weight: float
    price_per_carat_low: float
    price_per_carat_mid: float
    price_per_carat_high: float
    total_price_low: float
    total_price_mid: float
    total_price_high: float
    currency: str = "USD"
    coverage: float = 0.5
    formatted_price_per_carat_range: str
    formatted_total_price_range: str
