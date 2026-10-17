from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from .gemstone import TeamMemberGemstoneInput
from .pipeline import PipelineOptionEnum, AestheticStyleEnum


class ItemizedBOM(BaseModel):
    metal_cost_lkr: int = Field(..., description="Precious metal cost (grams * spot rate * 1.10 wastage)")
    gemstone_cost_lkr: int = Field(..., description="Center gemstone cost (from team member input or empirical power-law curve)")
    labor_cost_lkr: int = Field(..., description="Verified Wadakuliya artisan labor")
    setting_cost_lkr: int = Field(..., description="Stone setting & prong labor")
    accent_cost_lkr: int = Field(..., description="Accent melee stones cost")
    total_manufacturing_cost_lkr: int = Field(..., description="Total manufacturing cost")
    metal_cost_usd: Optional[int] = Field(None, description="Precious metal cost in USD")
    gemstone_cost_usd: Optional[int] = Field(None, description="Center gemstone cost in USD")
    labor_cost_usd: Optional[int] = Field(None, description="Artisan labor in USD")
    setting_cost_usd: Optional[int] = Field(None, description="Stone setting in USD")
    accent_cost_usd: Optional[int] = Field(None, description="Accent stones in USD")
    total_manufacturing_cost_usd: Optional[int] = Field(None, description="Total manufacturing cost in USD")


class QuantileValuation(BaseModel):
    p10_wholesale_floor_lkr: int = Field(..., description="Wholesale liquidation baseline (LKR)")
    p50_fair_market_price_lkr: int = Field(..., description="Fair market appraised value (LKR)")
    p90_showroom_ceiling_lkr: int = Field(..., description="Boutique showroom retail price (LKR)")
    p10_wholesale_floor_usd: Optional[int] = Field(None, description="Wholesale liquidation baseline (USD)")
    p50_fair_market_price_usd: Optional[int] = Field(None, description="Fair market appraised value (USD)")
    p90_showroom_ceiling_usd: Optional[int] = Field(None, description="Boutique showroom retail price (USD)")
    exchange_rate_lkr_usd: float = Field(300.0, description="Exchange rate (LKR per 1 USD)")


class AuditedAttributes(BaseModel):
    setting_type: str = "Prong"
    number_of_accent_stones: int = 0
    metal_tone: str = "Yellow"
    design_complexity: str = "Simple"


class JewelryDesignRequest(BaseModel):
    # Generative prompt & aesthetics - MANDATORY (No default fallback)
    prompt: str = Field(..., min_length=3, description="Creative vision prompt entered by user")
    aesthetic_style: AestheticStyleEnum = Field(..., description="Aesthetic style selected by user")
    pipeline_option: Optional[PipelineOptionEnum] = Field(PipelineOptionEnum.HYBRID, description="Pipeline architecture")

    # Jewelry structure - MANDATORY (No default fallback)
    category: str = Field(..., min_length=2, description="Ring, Necklace, Earrings, Bracelet, Pendant")
    metal: str = Field(..., min_length=2, description="Precious metal alloy")
    metal_weight_g: float = Field(..., ge=0.5, description="Metal mass in grams")
    setting_type: str = Field("Prong", description="Prong, Bezel, Halo, Pave, Channel")
    number_of_accent_stones: int = Field(0, description="Count of melee accent stones")

    # Loose gemstone variables - MANDATORY (No default fallback)
    gemstone: str = Field(..., min_length=2, description="Center gemstone species/type")
    gemstone_weight_ct: float = Field(..., ge=0.1, description="Weight in carats")
    color_grade: Optional[str] = Field("Royal Blue", description="Color grade")
    stone_grade: Optional[str] = Field("AA (Fine Jewelry)", description="Quality grade")
    treatment: Optional[str] = Field("Heated", description="Treatment")

    # Team member integration block
    team_member_gemstone: Optional[TeamMemberGemstoneInput] = Field(None, description="Detailed attributes from gemstone team member module")

    # Reference asset
    gemstone_asset_id: Optional[str] = Field(None, description="ID from assets/gemstones/catalog.json")
    image_base64: Optional[str] = Field(None, description="Uploaded reference or loose stone image")
    sketch_base64: Optional[str] = Field(None, description="Uploaded concept sketch image")
    reference_type: Optional[str] = Field("gemstone", description="Type of uploaded reference: 'gemstone' (real stone preservation) or 'sketch' (hand sketch/wireframe layout)")


class PriceEstimateRequest(BaseModel):
    category: str = "Ring"
    metal: str = "22KT Gold"
    metal_weight_g: float = 5.0
    gemstone: str = "Blue Sapphire"
    gemstone_weight_ct: float = 2.5
    setting_type: str = "Prong"
    color_grade: str = "Royal Blue"
    stone_grade: str = "AA (Fine Jewelry)"
    treatment: str = "Heated"
    number_of_accent_stones: int = 0
    design_complexity: Optional[str] = "Simple"

    # Team member gemstone variables
    team_member_gemstone: Optional[TeamMemberGemstoneInput] = None


class JewelryDesignResponse(BaseModel):
    status: str = "success"
    prompt: str
    aesthetic_style: str
    pipeline_used: str
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    design_sample: int = 1
    audited_attributes: AuditedAttributes
    bom_breakdown: ItemizedBOM
    valuation: QuantileValuation
    execution_source: str = Field("mock_local", description="'runpod' or 'mock_local'")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EnhancePromptRequest(BaseModel):
    prompt: str = Field(..., description="User original prompt or concept")
    gemstone: Optional[str] = Field("Blue Sapphire", description="Center gemstone type")
    gemstone_weight_ct: Optional[float] = Field(2.5, description="Gemstone carat weight")
    metal: Optional[str] = Field("22KT Gold", description="Precious metal alloy")
    metal_weight_g: Optional[float] = Field(5.0, description="Metal weight in grams")
    aesthetic_style: Optional[str] = Field("Modern", description="Aesthetic style (e.g. Modern, Vintage, Minimal, Royal Halo)")


class EnhancePromptResponse(BaseModel):
    original_prompt: str
    enhanced_prompt: str
    gemini_applied: bool = False
    model_used: Optional[str] = None

