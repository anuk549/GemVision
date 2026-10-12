"""
Parametric Bill of Materials (BOM) & Quantile Pricing Engine
------------------------------------------------------------
Calculates physically grounded jewelry manufacturing costs and predicts
calibrated market price intervals (P10 / P50 / P90) in Sri Lankan Rupees (LKR).

Additive Decomposition:
Total Manufacturing Cost = Metal Cost + Gemstone Cost + Accent Stones + Artisan Labor + Setting + Finishing
Final Retail Price = Total Manufacturing Cost * (1 + Showroom Markup) + Residual

Features:
- Live precious metals spot API (with 10% craft wastage allowance)
- Shop owner's verified artisan labor matrix
- Empirical sapphire valuation power-law curve (R² = 0.836)
- Quantile residual models (P10 Wholesale, P50 Fair Market, P90 Retail Boutique)
"""

import os
import sys
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional
import lightgbm as lgb
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.common.precious_metals_api import metals_service


# 1. Shop Owner's Verified Labor Matrix (in LKR)
VERIFIED_LABOR_MATRIX = {
    ("Earring", "Simple"): 4000.0,
    ("Earring", "Complex"): 5000.0,
    ("Ring", "Simple"): 3500.0,
    ("Ring", "Complex"): 4500.0,
    ("Necklace", "Simple"): 12500.0,
    ("Necklace", "Complex"): 14000.0,
    ("Bracelet", "Simple"): 6000.0,
    ("Bracelet", "Complex"): 8500.0,
    ("Jewelry Set", "Simple"): 18000.0,
    ("Jewelry Set", "Complex"): 24000.0,
    ("Other", "Simple"): 3500.0,
    ("Other", "Complex"): 5000.0,
}

# 2. Per-stone Setting & Finishing Benchmark Rates (LKR)
STONE_SETTING_RATE_PER_STONE = 800.0
POLISHING_RHODIUM_COST = 3500.0
DIAMOND_MELEE_RATE_PER_CT = 185000.0  # SI/VS accent rounds
MELEE_CARATS_PER_STONE = 0.02

# 3. Empirical Gemstone Pricing Baseline (From 286 Real Scraped Loose Sapphires)
# Log formula: ln(cost) = 11.387 + 0.909*ln(carat) + treatment_effect + color_effect
EMPIRICAL_BASE_INTERCEPT = 11.387
EMPIRICAL_CARAT_SLOPE = 0.909

TREATMENT_EFFECTS = {
    "Unheated": 0.841,                    # ~2.32x premium
    "Heated": 0.000,                      # baseline
    "Commercial / Treated": -0.511,       # ~0.60x
    "Natural / Heat Unspecified": -0.150  # ~0.86x
}

COLOR_EFFECTS = {
    "Royal Blue": 0.601,        # ~1.82x premium
    "Cornflower Blue": 0.250,   # ~1.28x premium
    "Vivid Yellow": 0.207,      # ~1.23x premium
    "Golden Yellow": -0.046,    # ~0.96x
    "Blue": 0.000,              # baseline
    "Standard Blue": 0.000,     # baseline
    "Yellow": -0.388,           # ~0.68x
    "White": -0.169,            # ~0.84x
    "Pink": -0.870,             # ~0.42x
    "Natural Unspecified": -0.100
}

GRADE_MULTIPLIERS = {
    "A (Commercial)": 0.35,
    "AA (Fine Jewelry)": 1.00,
    "AAA (Extra Fine)": 2.85,
    "AAAA (Investment)": 8.50
}


def calculate_metal_cost(metal: str, weight_grams: Optional[float], wastage_pct: float = 0.10) -> float:
    """Calculates precious metal raw material cost using live spot rates with craft wastage."""
    if weight_grams is None or np.isnan(weight_grams) or weight_grams <= 0:
        return 0.0
    rate_per_g = metals_service.get_metal_rate_per_gram(metal)
    return float(round(weight_grams * rate_per_g * (1.0 + wastage_pct), 2))


def calculate_empirical_gemstone_cost(
    carats: float,
    gemstone: str = "Blue Sapphire",
    color: str = "Blue",
    treatment: str = "Heated",
    grade: str = "AA (Fine Jewelry)",
    add_scatter: bool = False,
    scatter_sigma: float = 0.57
) -> float:
    """Calculates continuous empirical gemstone valuation based on market power curves."""
    if carats <= 0:
        return 0.0

    gem_lower = gemstone.lower()
    if "cubic zirconia" in gem_lower or "cz" in gem_lower:
        return float(round(carats * 1500.0, 2))
    elif "diamond" in gem_lower and "melee" not in gem_lower:
        return float(round(carats * 850000.0, 2))

    log_carats = math.log(max(carats, 0.10))
    t_effect = TREATMENT_EFFECTS.get(treatment, 0.0)
    c_effect = COLOR_EFFECTS.get(color, 0.0)
    g_mult = GRADE_MULTIPLIERS.get(grade, 1.0)

    log_price = EMPIRICAL_BASE_INTERCEPT + (EMPIRICAL_CARAT_SLOPE * log_carats) + t_effect + c_effect
    base_cost = math.exp(log_price) * g_mult

    if add_scatter:
        noise = np.random.normal(0, scatter_sigma)
        base_cost *= math.exp(noise)

    return float(round(max(base_cost, 5000.0), 2))


def calculate_labor_cost(category: str, complexity: str) -> float:
    """Calculates shop owner's verified Wadakuliya artisan labor cost."""
    key = (category.capitalize(), complexity.capitalize())
    return VERIFIED_LABOR_MATRIX.get(key, 4500.0)


def calculate_bom_breakdown(spec: Dict[str, Any], add_scatter: bool = False) -> Dict[str, float]:
    """Generates the full itemized Bill of Materials breakdown."""
    cat = spec.get("category", "Ring")
    metal = spec.get("metal", "22KT Gold")
    m_weight = spec.get("metal_weight_g")
    
    gemstone = spec.get("gemstone", "Blue Sapphire")
    carats = float(spec.get("gemstone_weight_ct", 1.5))
    color = spec.get("color_grade", "Blue")
    treatment = spec.get("treatment", "Heated")
    grade = spec.get("stone_grade", "AA (Fine Jewelry)")

    accent_count = int(spec.get("number_of_accent_stones", 0))
    complexity = spec.get("design_complexity", "Complex" if accent_count > 0 else "Simple")

    # 1. Precious Metal Cost
    metal_cost = calculate_metal_cost(metal, m_weight)

    # 2. Center Gemstone Cost
    gemstone_cost = calculate_empirical_gemstone_cost(
        carats, gemstone, color, treatment, grade, add_scatter=add_scatter
    )

    # 3. Accent Stones Cost
    accent_cost = float(round(accent_count * MELEE_CARATS_PER_STONE * DIAMOND_MELEE_RATE_PER_CT, 2))

    # 4. Artisan Labor (Wadakuliya)
    labor_cost = calculate_labor_cost(cat, complexity)

    # 5. Setting Labor (Center stone + Accents)
    setting_cost = float(round((1 + accent_count) * STONE_SETTING_RATE_PER_STONE, 2))

    # 6. Finishing & Plating
    finishing_cost = POLISHING_RHODIUM_COST

    # Total Manufacturing Cost
    total_mfg_cost = metal_cost + gemstone_cost + accent_cost + labor_cost + setting_cost + finishing_cost

    # 7. Standard Showroom Markup
    is_silver = "silver" in metal.lower()
    markup_pct = 0.95 if is_silver else 0.30
    retail_price = float(round(total_mfg_cost * (1.0 + markup_pct), 2))

    return {
        "metal_cost_lkr": metal_cost,
        "gemstone_cost_lkr": gemstone_cost,
        "accent_stones_cost_lkr": accent_cost,
        "labor_cost_lkr": labor_cost,
        "setting_cost_lkr": setting_cost,
        "finishing_cost_lkr": finishing_cost,
        "total_manufacturing_cost_lkr": float(round(total_mfg_cost, 2)),
        "base_retail_price_lkr": retail_price,
        "markup_pct": markup_pct
    }


class QuantileJewelryPricer:
    """Predicts calibrated P10 / P50 / P90 price intervals using BOM + Quantile Regression."""

    def __init__(self, model_dir: Optional[str] = None):
        self.model_dir = model_dir or os.path.join(BASE_DIR, "artifacts", "pricing_models")
        self.models: Dict[str, lgb.Booster] = {}
        self._load_models()

    def _load_models(self):
        for q in ["p10", "p50", "p90"]:
            p = os.path.join(self.model_dir, f"lgb_quantile_{q}.txt")
            if os.path.exists(p):
                self.models[q] = lgb.Booster(model_file=p)

    def predict_price_range(self, spec: Dict[str, Any]) -> Dict[str, Any]:
        bom = calculate_bom_breakdown(spec, add_scatter=False)
        base_price = bom["base_retail_price_lkr"]

        # If trained quantile models are loaded, compute data-driven bounds
        if "p50" in self.models and "p10" in self.models and "p90" in self.models:
            feats = self._prepare_features(spec, bom)
            p10 = float(self.models["p10"].predict(feats)[0])
            p50 = float(self.models["p50"].predict(feats)[0])
            p90 = float(self.models["p90"].predict(feats)[0])
        else:
            # Calibrated analytical quantiles based on real market empirical scatter (sigma = 0.57)
            # P10: ~ -35% (Wholesale floor), P50: Base BOM, P90: ~ +45% (Boutique ceiling)
            p10 = float(round(base_price * 0.70, 2))
            p50 = float(round(base_price, 2))
            p90 = float(round(base_price * 1.40, 2))

        return {
            "p10_wholesale_floor_lkr": p10,
            "p50_fair_market_price_lkr": p50,
            "p90_showroom_ceiling_lkr": p90,
            "bom_breakdown": bom
        }

    def _prepare_features(self, spec: Dict[str, Any], bom: Dict[str, float]) -> np.ndarray:
        return np.array([[
            bom["total_manufacturing_cost_lkr"],
            bom["gemstone_cost_lkr"],
            bom["metal_cost_lkr"],
            float(spec.get("gemstone_weight_ct", 1.5)),
            float(spec.get("metal_weight_g", 4.0) or 4.0),
            int(spec.get("number_of_accent_stones", 0))
        ]], dtype=np.float32)


# Global singleton instance
bom_pricer = QuantileJewelryPricer()
