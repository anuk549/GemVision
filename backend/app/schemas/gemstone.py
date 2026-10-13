from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class GemstoneAsset(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    filename: str
    species: str
    carat: float
    color: str
    shape: str
    size_mm: str
    treatment: str
    stone_grade: str
    predicted_price_lkr: float
    color_hex: str
    image_url: Optional[str] = None


class TeamMemberGemstoneInput(BaseModel):
    """
    Data passed from other team member's component (gemstone classification,
    measurement, defect analysis, or valuation module).
    """
    model_config = ConfigDict(populate_by_name=True)

    gemstone_name: Optional[str] = Field("Blue Sapphire", description="Species/Type (e.g. Blue Sapphire, Ruby, Emerald)")
    gemstone_weight_ct: Optional[float] = Field(None, alias="carat", description="Weight in carats")
    gemstone_color: Optional[str] = Field(None, alias="color", description="Color grade (e.g. Royal Blue, Cornflower Blue)")
    gemstone_shape: Optional[str] = Field(None, alias="shape", description="Cut/Shape (e.g. Cushion, Oval, Round, Emerald, Pear)")
    gemstone_size_mm: Optional[str] = Field(None, alias="size", description="Physical dimensions e.g. 8.2x6.8mm")
    gemstone_price: Optional[float] = Field(None, alias="price", description="Pre-calculated loose gemstone valuation in LKR from team member model")
    gemstone_asset_id: Optional[str] = Field(None, description="ID or filename of loose gemstone from assets catalog")
    treatment: Optional[str] = Field("Heated", description="Treatment: Unheated, Heated, etc.")
    stone_grade: Optional[str] = Field("AA (Fine Jewelry)", description="Grade: A, AA, AAA, AAAA")
