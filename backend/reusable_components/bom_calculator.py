import math
import os
from pathlib import Path
from typing import Dict, Any, Optional

# Empirical sapphire pricing coefficients
EMPIRICAL_BASE_INTERCEPT = 11.387
EMPIRICAL_CARAT_SLOPE = 0.909

TREATMENT_EFFECTS = {
    "Unheated": 0.841,
    "Natural Unheated": 0.841,
    "Heated": 0.000,
    "Standard Heated": 0.000,
    "Commercial / Treated": -0.511,
}

COLOR_EFFECTS = {
    "Royal Blue": 0.601,
    "Cornflower Blue": 0.250,
    "Vivid Yellow": 0.207,
    "Golden Yellow": -0.046,
    "Blue": 0.000,
    "Pigeon Blood": 0.720,
    "Pigeon Blood Red": 0.720,
    "Yellow": -0.388,
    "Sunset Lotus Pink-Orange": 0.650,
}

GRADE_MULTIPLIERS = {
    "A (Commercial)": 0.35,
    "AA (Fine Jewelry)": 1.00,
    "AAA (Extra Fine)": 2.85,
    "AAAA (Investment)": 8.50,
}

LABOR_MATRIX = {
    ("Ring", "Simple"): 3500.0,
    ("Ring", "Complex"): 4500.0,
    ("Earring", "Simple"): 4000.0,
    ("Earring", "Complex"): 5000.0,
    ("Necklace", "Simple"): 12500.0,
    ("Necklace", "Complex"): 14000.0,
    ("Bracelet", "Simple"): 6000.0,
    ("Bracelet", "Complex"): 8500.0,
}

DEFAULT_SPOT_RATES = {
    "24KT Gold": 36500.0,
    "22KT Gold": 33500.0,
    "18K Yellow Gold": 27500.0,
    "18K White Gold": 28200.0,
    "18K Rose Gold": 28000.0,
    "925 Sterling Silver": 950.0,
    "Platinum": 19500.0,
}


def calculate_empirical_gemstone_price(
    carats: float,
    color: str = "Royal Blue",
    treatment: str = "Heated",
    stone_grade: str = "AA (Fine Jewelry)",
) -> float:
    """Computes empirical baseline price (LKR) fitted on 286 authentic Ceylon sapphires."""
    if carats <= 0:
        return 0.0

    color_eff = COLOR_EFFECTS.get(color, 0.0)
    treat_eff = TREATMENT_EFFECTS.get(treatment, 0.0)
    grade_mult = GRADE_MULTIPLIERS.get(stone_grade, 1.0)

    log_price = EMPIRICAL_BASE_INTERCEPT + EMPIRICAL_CARAT_SLOPE * math.log(max(carats, 0.1)) + color_eff + treat_eff
    base_price = math.exp(log_price)
    return round(base_price * grade_mult, 2)


def compute_jewelry_bom_and_valuation(
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
    metal_spot_rates: Optional[Dict[str, float]] = None,
    team_member_gemstone_price: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Computes itemized BOM and market valuation intervals.
    Incorporates loose gemstone price directly from other team member's component if provided.
    """
    rates = metal_spot_rates or DEFAULT_SPOT_RATES
    rate = rates.get(metal, 33500.0)

    # 1. Precious metal cost with 10% wastage
    metal_cost = round(metal_weight_g * rate * 1.10)

    # 2. Gemstone cost: Use team member's predicted price if provided; otherwise use empirical curve
    if team_member_gemstone_price is not None and team_member_gemstone_price > 0:
        gemstone_cost = round(team_member_gemstone_price)
    else:
        gemstone_cost = round(
            calculate_empirical_gemstone_price(
                carats=gemstone_weight_ct,
                color=color_grade,
                treatment=treatment,
                stone_grade=stone_grade,
            )
        )

    # 3. Verified Wadakuliya artisan labor
    complexity_key = "Complex" if (number_of_accent_stones > 12 or design_complexity == "Complex") else "Simple"
    cat_norm = (category or "Ring").strip().capitalize()
    if cat_norm in ["Earrings", "Earring"]:
        cat_key = "Earring"
    elif cat_norm in ["Necklace", "Necklaces", "Pendant", "Pendants"]:
        cat_key = "Necklace"
    elif cat_norm in ["Bracelet", "Bracelets", "Bangle", "Bangles"]:
        cat_key = "Bracelet"
    else:
        cat_key = "Ring"

    labor_cost = round(LABOR_MATRIX.get((cat_key, complexity_key), 4000.0))

    # 4. Stone setting & finishing
    setting_cost = round((number_of_accent_stones + 1) * 800.0 + 3500.0)

    # 5. Melee accent stones
    accent_cost = round(number_of_accent_stones * 4200.0)

    # Total manufacturing cost
    total_cost = metal_cost + gemstone_cost + labor_cost + setting_cost + accent_cost

    # 6. Quantile Commercial Valuation (LKR)
    # P10 Wholesale Liquidation Floor (+6%)
    # P50 Fair Market Appraisal (+22%)
    # P90 Boutique Showroom Ceiling (+42%)
    p10 = round(total_cost * 1.06)
    p50 = round(total_cost * 1.22)
    p90 = round(total_cost * 1.42)

    return {
        "bom_breakdown": {
            "metal_cost_lkr": metal_cost,
            "gemstone_cost_lkr": gemstone_cost,
            "labor_cost_lkr": labor_cost,
            "setting_cost_lkr": setting_cost,
            "accent_cost_lkr": accent_cost,
            "total_manufacturing_cost_lkr": total_cost,
        },
        "valuation": {
            "p10_wholesale_floor_lkr": p10,
            "p50_fair_market_price_lkr": p50,
            "p90_showroom_ceiling_lkr": p90,
        },
        "pricing_source": "team_member_component" if team_member_gemstone_price else "empirical_sapphire_curve",
    }
