import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional
from ..core.config import settings
from ..schemas.gemstone import TeamMemberGemstoneInput
from ..schemas.jewelry import PriceEstimateRequest, ItemizedBOM, QuantileValuation
from ...reusable_components.bom_calculator import compute_jewelry_bom_and_valuation

logger = logging.getLogger(__name__)


class ValuationEngine:
    """
    Dynamic BOM & Quantile Valuation Engine:
    Seamlessly incorporates loose gemstone variables from other team members'
    components (carat, color, shape, size, and predicted price) alongside
    precious metal spot benchmarks and verified Wadakuliya artisan labor.
    """

    def __init__(self):
        self.models_dir = settings.ML_MODELS_DIR
        self._load_lightgbm_models()

    def _load_lightgbm_models(self):
        self.champion_model = None
        champion_path = self.models_dir / "champion_tuned_lightgbm.joblib"
        if champion_path.exists():
            try:
                import joblib
                self.champion_model = joblib.load(champion_path)
                logger.info(f"Loaded champion LightGBM model from {champion_path}")
            except Exception as ex:
                logger.warning(f"Could not load champion LightGBM model: {ex}")

    def evaluate_quotation(
        self,
        category: str,
        metal: str,
        metal_weight_g: float,
        gemstone: str,
        gemstone_weight_ct: float,
        color_grade: str = "Royal Blue",
        stone_grade: str = "AA (Fine Jewelry)",
        treatment: str = "Heated",
        setting_type: str = "Prong",
        number_of_accent_stones: int = 0,
        design_complexity: str = "Simple",
        team_member_gemstone: Optional[TeamMemberGemstoneInput] = None,
    ) -> Dict[str, Any]:
        """
        Calculates BOM and valuation.
        Prioritizes gemstone variables passed from other team member's component.
        """
        # Override specs with team member inputs if available
        active_gem_weight = gemstone_weight_ct
        active_color = color_grade
        active_treatment = treatment
        active_stone_grade = stone_grade
        team_gem_price = None

        if team_member_gemstone:
            if team_member_gemstone.gemstone_weight_ct is not None:
                active_gem_weight = team_member_gemstone.gemstone_weight_ct
            if team_member_gemstone.gemstone_color:
                active_color = team_member_gemstone.gemstone_color
            if team_member_gemstone.treatment:
                active_treatment = team_member_gemstone.treatment
            if team_member_gemstone.stone_grade:
                active_stone_grade = team_member_gemstone.stone_grade
            if team_member_gemstone.gemstone_price is not None:
                team_gem_price = team_member_gemstone.gemstone_price

        raw_result = compute_jewelry_bom_and_valuation(
            category=category,
            metal=metal,
            metal_weight_g=metal_weight_g,
            gemstone=gemstone,
            gemstone_weight_ct=active_gem_weight,
            color_grade=active_color,
            stone_grade=active_stone_grade,
            treatment=active_treatment,
            setting_type=setting_type,
            number_of_accent_stones=number_of_accent_stones,
            design_complexity=design_complexity,
            team_member_gemstone_price=team_gem_price,
        )

        bom = ItemizedBOM(**raw_result["bom_breakdown"])
        val = QuantileValuation(**raw_result["valuation"])

        return {
            "bom_breakdown": bom,
            "valuation": val,
            "reconciled_inputs": {
                "carats": active_gem_weight,
                "color": active_color,
                "stone_grade": active_stone_grade,
                "treatment": active_treatment,
                "gemstone_price_override": team_gem_price is not None,
                "pricing_source": raw_result["pricing_source"],
            },
        }


valuation_engine = ValuationEngine()
