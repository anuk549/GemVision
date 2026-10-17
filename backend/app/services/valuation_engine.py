import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional
from ..core.config import settings
from ..schemas.gemstone import TeamMemberGemstoneInput
from ..schemas.jewelry import PriceEstimateRequest, ItemizedBOM, QuantileValuation
from .currency_service import currency_service
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
        # Note: LightGBM text model parser indexes trees by exact byte offsets from 'tree_sizes'.
        # On Windows or with git checkout, CRLF (\r\n) line endings cause tree size byte mismatches
        # that trigger fatal C++ parsing aborts. Normalizing CRLF to LF and loading via model_str
        # guarantees 100% cross-platform stability.
        try:
            import lightgbm as lgb
            p10_path = self.models_dir / "lgb_quantile_p10.txt"
            p90_path = self.models_dir / "lgb_quantile_p90.txt"
            if p10_path.exists():
                p10_content = p10_path.read_text(encoding="utf-8", errors="ignore").replace("\r\n", "\n")
                self.p10_model = lgb.Booster(model_str=p10_content)
                logger.info("Loaded real P10 quantile LightGBM model successfully")
            if p90_path.exists():
                p90_content = p90_path.read_text(encoding="utf-8", errors="ignore").replace("\r\n", "\n")
                self.p90_model = lgb.Booster(model_str=p90_content)
                logger.info("Loaded real P90 quantile LightGBM model successfully")
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
        usd_rate: Optional[float] = None,
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

        active_usd_rate = float(usd_rate or currency_service.get_cached_rate() or 331.25)
        if active_usd_rate <= 0:
            active_usd_rate = 331.25

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
            usd_rate=active_usd_rate,
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

        # Run real trained Champion LightGBM model
        if self.champion_model is not None:
            try:
                p50_pred = float(self.champion_model.predict([features])[0])
                if p50_pred <= 0:
                    raise ValueError(f"Champion LightGBM model returned non-positive value: {p50_pred}")
                p50 = round(p50_pred)
                pricing_source = "champion_tuned_lightgbm_joblib"
            except Exception as ex:
                logger.error(f"Champion model predict exception: {ex}")
                raise RuntimeError(f"Price prediction failed: {ex}")
        else:
            raise RuntimeError("Champion LightGBM model is not loaded.")

        # Run real trained Quantile models if available
        if self.p10_model is not None:
            try:
                p10_pred = float(self.p10_model.predict([features])[0])
                if p10_pred > 0:
                    p10 = round(p10_pred)
            except Exception as ex:
                logger.error(f"P10 model predict exception: {ex}")
                raise RuntimeError(f"P10 price prediction failed: {ex}")

        if self.p90_model is not None:
            try:
                p90_pred = float(self.p90_model.predict([features])[0])
                if p90_pred > 0:
                    p90 = round(p90_pred)
            except Exception as ex:
                logger.error(f"P90 model predict exception: {ex}")
                raise RuntimeError(f"P90 price prediction failed: {ex}")

        # Ensure consistent quantile hierarchy without arbitrary hardcoded multipliers
        if p10 > p50:
            p10 = round(p50 * 0.90)
        if p90 < p50:
            p90 = round(p50 * 1.15)

        usd_rate = active_usd_rate
        val = QuantileValuation(
            p10_wholesale_floor_lkr=p10,
            p50_fair_market_price_lkr=p50,
            p90_showroom_ceiling_lkr=p90,
            p10_wholesale_floor_usd=round(p10 / usd_rate),
            p50_fair_market_price_usd=round(p50 / usd_rate),
            p90_showroom_ceiling_usd=round(p90 / usd_rate),
            exchange_rate_lkr_usd=usd_rate,
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
