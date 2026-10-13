import pytest
from backend.reusable_components.bom_calculator import (
    compute_jewelry_bom_and_valuation,
    calculate_empirical_gemstone_price,
)


def test_empirical_gemstone_pricing():
    price_1ct = calculate_empirical_gemstone_price(1.0, "Royal Blue", "Heated", "AA (Fine Jewelry)")
    price_2ct = calculate_empirical_gemstone_price(2.0, "Royal Blue", "Heated", "AA (Fine Jewelry)")
    assert price_1ct > 0
    assert price_2ct > price_1ct


def test_team_member_price_override():
    # If other team member component provides gemstone price (e.g. 850,000 LKR), it overrides empirical calculation
    override_price = 850000.0
    result = compute_jewelry_bom_and_valuation(
        category="Ring",
        metal="22KT Gold",
        metal_weight_g=5.0,
        gemstone="Blue Sapphire",
        gemstone_weight_ct=2.0,
        team_member_gemstone_price=override_price,
    )

    bom = result["bom_breakdown"]
    val = result["valuation"]

    assert bom["gemstone_cost_lkr"] == 850000
    assert result["pricing_source"] == "team_member_component"
    assert val["p10_wholesale_floor_lkr"] > bom["total_manufacturing_cost_lkr"]
    assert val["p50_fair_market_price_lkr"] > val["p10_wholesale_floor_lkr"]
    assert val["p90_showroom_ceiling_lkr"] > val["p50_fair_market_price_lkr"]


def test_bom_breakdown_elements():
    result = compute_jewelry_bom_and_valuation(
        category="Ring",
        metal="22KT Gold",
        metal_weight_g=5.0,
        gemstone="Blue Sapphire",
        gemstone_weight_ct=2.5,
        number_of_accent_stones=16,
    )
    bom = result["bom_breakdown"]
    assert bom["metal_cost_lkr"] > 0
    assert bom["gemstone_cost_lkr"] > 0
    assert bom["labor_cost_lkr"] > 0
    assert bom["setting_cost_lkr"] > 0
    assert bom["accent_cost_lkr"] > 0
    assert bom["total_manufacturing_cost_lkr"] == (
        bom["metal_cost_lkr"]
        + bom["gemstone_cost_lkr"]
        + bom["labor_cost_lkr"]
        + bom["setting_cost_lkr"]
        + bom["accent_cost_lkr"]
    )
