import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional
from ..core.config import settings
from ..schemas.gemstone import TeamMemberGemstoneInput
from ..schemas.jewelry import PriceEstimateRequest, ItemizedBOM, QuantileValuation
try:
    from reusable_components.bom_calculator import compute_jewelry_bom_and_valuation
except (ImportError, ValueError):
    from backend.reusable_components.bom_calculator import compute_jewelry_bom_and_valuation

logger = logging.getLogger(__name__)


class ValuationEngine:

    def __init__(self):
        self.models_dir = settings.ML_MODELS_DIR
        self._load_lightgbm_models()

    def _load_lightgbm_models(self):
        self.champion_model = None
        self.p10_model = None
        self.p90_model = None

        champion_path = self.models_dir / "champion_tuned_lightgbm.joblib"
        if champion_path.exists():
            try:
                import joblib
                self.champion_model = joblib.load(champion_path)
                logger.info(f"Loaded real champion LightGBM model from {champion_path}")
            except Exception as ex:
                logger.warning(f"Could not load champion LightGBM model: {ex}")

        # Load quantile boosters if available
        try:
            import lightgbm as lgb
            p10_path = self.models_dir / "lgb_quantile_p10.txt"
            p90_path = self.models_dir / "lgb_quantile_p90.txt"
            if p10_path.exists():
                self.p10_model = lgb.Booster(model_file=str(p10_path))
            if p90_path.exists():
                self.p90_model = lgb.Booster(model_file=str(p90_path))
        except Exception as ex:
            logger.warning(f"Could not load quantile models: {ex}")

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
        Calculates BOM and valuation using the real Champion LightGBM (.joblib) model
        trained on authentic Mallika Hemachandra showroom items.
        Prioritizes gemstone variables passed from other team member's component.
        """
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

        bom_dict = raw_result["bom_breakdown"]
        bom = ItemizedBOM(**bom_dict)

        # 6-D Feature Vector expected by champion model:
        # [total_mfg_cost, gem_cost, metal_cost, carats, grams, accents]
        features = [
            float(bom_dict["total_manufacturing_cost_lkr"]),
            float(bom_dict["gemstone_cost_lkr"]),
            float(bom_dict["metal_cost_lkr"]),
            float(active_gem_weight),
            float(metal_weight_g),
            float(number_of_accent_stones),
        ]

        p50 = raw_result["valuation"]["p50_fair_market_price_lkr"]
        p10 = raw_result["valuation"]["p10_wholesale_floor_lkr"]
        p90 = raw_result["valuation"]["p90_showroom_ceiling_lkr"]
        pricing_source = raw_result["pricing_source"]

        # Run real trained Champion LightGBM model if available
        if self.champion_model is not None:
            try:
                p50_pred = float(self.champion_model.predict([features])[0])
                if p50_pred > 0:
                    p50 = round(p50_pred)
                    pricing_source = "champion_tuned_lightgbm_joblib"
            except Exception as ex:
                logger.warning(f"Champion model predict exception: {ex}")

        # Run real trained Quantile models if available
        if self.p10_model is not None:
            try:
                p10_pred = float(self.p10_model.predict([features])[0])
                if p10_pred > 0:
                    p10 = round(p10_pred)
            except Exception as ex:
                logger.warning(f"P10 model predict exception: {ex}")

        if self.p90_model is not None:
            try:
                p90_pred = float(self.p90_model.predict([features])[0])
                if p90_pred > 0:
                    p90 = round(p90_pred)
            except Exception as ex:
                logger.warning(f"P90 model predict exception: {ex}")

        # Physical BOM floor anchoring
        total_mfg = bom_dict["total_manufacturing_cost_lkr"]
        if p10 <= 0 or p10 < total_mfg:
            p10 = round(total_mfg * 1.06)
        if p50 <= 0 or p50 < p10:
            p50 = round(total_mfg * 1.20)
        if p90 <= 0 or p90 < p50:
            p90 = round(total_mfg * 1.40)

        val = QuantileValuation(
            p10_wholesale_floor_lkr=p10,
            p50_fair_market_price_lkr=p50,
            p90_showroom_ceiling_lkr=p90,
        )

        return {
            "bom_breakdown": bom,
            "valuation": val,
            "reconciled_inputs": {
                "carats": active_gem_weight,
                "color": active_color,
                "stone_grade": active_stone_grade,
                "treatment": active_treatment,
                "gemstone_price_override": team_gem_price is not None,
                "pricing_source": pricing_source,
            },
        }


valuation_engine = ValuationEngine()
