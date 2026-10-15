"""
jewelry_recommender.py
======================

Deterministic RULE-BASED jewellery recommendation for sapphire gemstones.

This module is NOT machine learning. Nothing is trained and no model files are
produced. It implements an explainable weighted suitability calculation whose
configuration lives in jewelry_rules.py.

Scoring formula (per category):

    final score =
          weight suitability    x 30
        + shape suitability     x 25
        + treatment suitability x 20
        + clarity suitability   x 15
        + cut suitability       x 10

Each raw suitability value is in [0, 1]. The final score is clamped to
[0, 100] and rounded to 1 decimal place using deterministic ROUND_HALF_UP
rounding (e.g. 98.25 -> 98.3, 97.05 -> 97.1). The three category scores are
independent suitability scores and do NOT need to sum to 100%.
"""

from __future__ import annotations

import math
import re
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Dict, List, Optional, Tuple

import jewelry_rules as rules

# Precompiled normalizer: lowercase, strip, collapse separators/whitespace.
_SEPARATOR_RE = re.compile(r"[\-_/,.]+")
_WHITESPACE_RE = re.compile(r"\s+")


def round_half_up(value: float, places: int = 1) -> float:
    """
    Deterministic ROUND_HALF_UP rounding (ties round away from zero).

    Python's built-in round() uses banker's rounding, so an exact score such
    as 98.25 would become 98.2. User-facing Jewellery Suitability Scores use
    ROUND_HALF_UP instead:

        98.25 -> 98.3
        97.04 -> 97.0
        97.05 -> 97.1
    """
    quantize_exp = Decimal(1).scaleb(-places)
    return float(Decimal(str(value)).quantize(quantize_exp, rounding=ROUND_HALF_UP))


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    """Clamp a value between low and high."""
    return max(low, min(high, value))


def _normalize(value: Any) -> str:
    """
    Normalize a categorical value for alias lookup.

    Examples:
        "Mixed Brilliant Cut"  -> "mixed brilliant cut"
        "Asscher - Octagon"    -> "asscher octagon"
        "Near Eye-Clean"       -> "near eye clean"
        "Faceted / Superior"   -> "faceted superior"
    """
    if value is None:
        return ""
    text = str(value).strip().lower()
    text = _SEPARATOR_RE.sub(" ", text)
    text = _WHITESPACE_RE.sub(" ", text).strip()
    return text


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

def _validate_input(stone: Any) -> None:
    """Ensure the input is a dictionary with a usable numeric Weight."""
    if not isinstance(stone, dict):
        raise ValueError(rules.INPUT_TYPE_ERROR)

    if "Weight" not in stone or stone["Weight"] is None:
        raise ValueError(rules.WEIGHT_RANGE_ERROR)

    weight = stone["Weight"]

    # bool is a subclass of int in Python; reject it explicitly.
    if isinstance(weight, bool) or not isinstance(weight, (int, float)):
        raise ValueError(rules.WEIGHT_TYPE_ERROR)

    if math.isnan(weight) or math.isinf(weight):
        raise ValueError(rules.WEIGHT_TYPE_ERROR)

    if weight < rules.WEIGHT_MIN or weight > rules.WEIGHT_MAX:
        raise ValueError(rules.WEIGHT_RANGE_ERROR)


# ---------------------------------------------------------------------------
# Normalization of categorical fields
# ---------------------------------------------------------------------------

def normalize_shape(value: Any) -> str:
    """Map a raw shape string to a canonical shape group key."""
    key = _normalize(value)
    return rules.SHAPE_ALIASES.get(key, rules.DEFAULT_SHAPE_GROUP)


def normalize_treatment(value: Any) -> str:
    """Map a raw treatment string to a canonical treatment group key."""
    key = _normalize(value)
    return rules.TREATMENT_ALIASES.get(key, rules.DEFAULT_TREATMENT_GROUP)


def normalize_clarity(value: Any) -> str:
    """Map a raw clarity string to a canonical clarity group key."""
    key = _normalize(value)
    return rules.CLARITY_ALIASES.get(key, rules.DEFAULT_CLARITY_GROUP)


def normalize_cut(value: Any) -> str:
    """Map a raw cut string to a canonical cut group key."""
    key = _normalize(value)
    return rules.CUT_ALIASES.get(key, rules.DEFAULT_CUT_GROUP)



# Raw suitability lookups (each value is in [0, 1])


def _weight_band(weight: float) -> Dict[str, Any]:
    """Find the configured weight band containing `weight`."""
    for band in rules.WEIGHT_BANDS:
        if band["min_inclusive"] < weight <= band["max_inclusive"]:
            return band
    # weight == 0.50 exactly falls in the first band (inclusive lower bound).
    if weight == rules.WEIGHT_MIN:
        return rules.WEIGHT_BANDS[0]
    raise ValueError(rules.WEIGHT_RANGE_ERROR)


def get_raw_suitabilities(stone: Dict[str, Any]) -> Dict[str, Dict[str, float]]:
    """
    Return raw suitability values in [0, 1] for every category and factor.

    Only Weight, Shape, Treatment, Clarity and Cut affect the score.
    Length/Width/Height/Color/Intensity/Origin are intentionally ignored.
    """
    weight = float(stone["Weight"])
    band = _weight_band(weight)

    shape_group = normalize_shape(stone.get("Shape"))
    treatment_group = normalize_treatment(stone.get("Treatment"))
    clarity_group = normalize_clarity(stone.get("Clarity"))
    cut_group = normalize_cut(stone.get("Cut"))

    raw: Dict[str, Dict[str, float]] = {}
    for category_key, category_name in (
        ("ring", "Ring"),
        ("earring", "Earring"),
        ("necklace", "Necklace"),
    ):
        raw[category_key] = {
            "weight": band["scores"][category_key],
            "shape": rules.SHAPE_SCORES[shape_group][category_key],
            "treatment": rules.TREATMENT_SCORES[treatment_group][category_key],
            "clarity": rules.CLARITY_SCORES[clarity_group][category_key],
            "cut": rules.CUT_SCORES[cut_group][category_key],
        }

    # Expose the resolved groups so the recommender can build explanations.
    raw["_groups"] = {
        "weight_band": band,
        "shape": shape_group,
        "treatment": treatment_group,
        "clarity": clarity_group,
        "cut": cut_group,
    }
    return raw



# Explanations 

_CATEGORY_LABELS = {"ring": "Ring", "earring": "Earring", "necklace": "Necklace"}


def _factor_reason(
    factor: str, raw_score: float, category: str, groups: Dict[str, Any]
) -> str:
    """Build a short human-readable reason for one factor of one category."""
    label = _CATEGORY_LABELS[category]

    if factor == "weight":
        band = groups["weight_band"]
        return (
            f"The {band['label']} weight band has a raw suitability of "
            f"{raw_score:.2f} for {label}."
        )

    if factor == "shape":
        shape = groups["shape"]
        reason = (
            f"The '{shape}' shape group has a raw suitability of "
            f"{raw_score:.2f} for {label}."
        )
        if shape in rules.POINTED_SHAPES:
            reason += " " + rules.POINTED_SHAPE_NOTE
        return reason

    if factor == "treatment":
        treatment = groups["treatment"]
        if treatment == rules.DEFAULT_TREATMENT_GROUP:
            return (
                "Treatment information is incomplete or unrecognized; the "
                f"conservative default suitability of {raw_score:.2f} was "
                f"applied for {label}."
            )
        return (
            f"The '{treatment.replace('_', ' ')}' treatment group has a raw "
            f"suitability of {raw_score:.2f} for {label}."
        )

    if factor == "clarity":
        clarity = groups["clarity"]
        if clarity == rules.DEFAULT_CLARITY_GROUP:
            return (
                "Clarity information is incomplete or unrecognized; a "
                f"documented conservative fallback suitability of "
                f"{raw_score:.2f} was applied for {label}."
            )
        reason = (
            f"The '{clarity.replace('_', ' ')}' clarity group has a raw "
            f"suitability of {raw_score:.2f} for {label}."
        )
        if clarity == "more_included":
            reason += (
                " Significant inclusions or fractures may introduce "
                "additional durability considerations, particularly for "
                "jewellery exposed to greater impact."
            )
        return reason

    if factor == "cut":
        cut = groups["cut"]
        if cut == rules.DEFAULT_CUT_GROUP:
            return (
                "Cut information is incomplete or unrecognized; a "
                f"conservative default suitability of {raw_score:.2f} was "
                f"applied for {label}."
            )
        return (
            f"The '{cut.replace('_', ' ')}' cut group has a raw suitability "
            f"of {raw_score:.2f} for {label}."
        )

    return f"{factor} raw suitability is {raw_score:.2f} for {label}."



# Main recommendation function


def recommend_jewelry(stone: dict) -> dict:
    """
    Recommend the most suitable jewellery category for a sapphire.

    Parameters
    ----------
    stone : dict
        Gemstone attributes. Required: "Weight" (numeric, 0.50-5.00 ct).
        Optional factors that influence the score: "Shape", "Treatment",
        "Clarity", "Cut". Optional fields accepted but unused in v1:
        "Length", "Width", "Height", "Color", "Intensity", "Origin".

    Returns
    -------
    dict
        Scores per category, recommended category, per-factor breakdown,
        reasons, a recommendation explanation, the method name and a
        disclaimer.

    Raises
    ------
    ValueError
        If the input is not a dictionary, if Weight is not numeric
        (bool/NaN/inf rejected), or if Weight is outside 0.50-5.00 ct.
    """
    _validate_input(stone)

    raw = get_raw_suitabilities(stone)
    groups = raw["_groups"]

    scores: Dict[str, float] = {}
    factor_breakdown: Dict[str, Dict[str, Dict[str, float]]] = {}
    reasons: Dict[str, List[str]] = {}

    for category in ("ring", "earring", "necklace"):
        breakdown: Dict[str, Dict[str, float]] = {}
        total = Decimal("0")
        category_reasons: List[str] = []

        for factor in rules.FACTOR_ORDER:
            raw_score = round_half_up(raw[category][factor], 2)
            factor_weight = rules.FACTOR_PERCENTAGES[factor]  # 30, 25, 20, 15, 10
            # The displayed factor contributions sum to the pre-rounded
            # total. The final Jewellery Suitability Score is then obtained
            # by applying ROUND_HALF_UP to that total to one decimal place.
            # Example: 27.00 + 25.00 + 19.00 + 17.25 + 10.00 = 98.25
            #          final displayed score = 98.3%
            contribution = round_half_up(raw_score * factor_weight, 2)
            total += Decimal(str(contribution))

            breakdown[factor] = {
                "raw_score": raw_score,
                "factor_weight": factor_weight,
                "contribution": contribution,
            }
            category_reasons.append(_factor_reason(factor, raw_score, category, groups))

        final_score = _clamp(float(total), 0.0, 100.0)
        scores[category] = round_half_up(final_score, 1)
        factor_breakdown[category] = breakdown
        reasons[category] = category_reasons

    recommended = _select_recommended(scores, raw)

    return {
        "scores": {
            "ring": scores["ring"],
            "earring": scores["earring"],
            "necklace": scores["necklace"],
        },
        "recommended": _CATEGORY_LABELS[recommended],
        "factor_breakdown": factor_breakdown,
        "reasons": reasons,
        "recommendation_explanation": _recommendation_explanation(
            recommended, scores, raw, groups
        ),
        "method": rules.METHOD,
        "disclaimer": rules.DISCLAIMER,
    }



# Category selection with documented tie handling


def _select_recommended(
    scores: Dict[str, float], raw: Dict[str, Dict[str, float]]
) -> str:
    """
    Select the recommended category.

    Tie handling (documented behavior):
      1. Prefer the category with the higher weight suitability.
      2. If still tied, prefer the category with the higher shape suitability.
      3. If still tied, use the deterministic order: Ring, Necklace, Earring.
    """
    order_index = {name: i for i, name in enumerate(rules.TIE_BREAK_ORDER)}
    return min(
        ("ring", "earring", "necklace"),
        key=lambda c: (
            -scores[c],
            -raw[c]["weight"],
            -raw[c]["shape"],
            order_index[_CATEGORY_LABELS[c]],
        ),
    )


def _recommendation_explanation(
    recommended: str,
    scores: Dict[str, float],
    raw: Dict[str, Dict[str, float]],
    groups: Dict[str, Any],
) -> str:
    """Generate a short natural-language explanation of the recommendation."""
    label = _CATEGORY_LABELS[recommended]
    band = groups["weight_band"]
    shape = groups["shape"].replace("_", " ")
    treatment = groups["treatment"].replace("_", " ")

    if groups["treatment"] == rules.DEFAULT_TREATMENT_GROUP:
        treatment_phrase = (
            "its treatment information is incomplete, so a conservative "
            "value was applied"
        )
    elif groups["treatment"] in ("lattice_diffused", "fracture_filled"):
        treatment_phrase = (
            f"its {treatment} treatment introduces an additional durability "
            "consideration"
        )
    else:
        treatment_phrase = (
            f"its {treatment} status does not introduce an additional "
            "durability penalty"
        )

    return (
        f"{label} received the highest suitability score "
        f"({scores[recommended]:.1f}%) because the sapphire's weight falls "
        f"within the {band['label']} range, its {shape} shape is suitable "
        f"for secure mounting, and {treatment_phrase}."
    )



# Convenience demo


if __name__ == "__main__":
    example_stone = {
        "Weight": 2.10,
        "Length": 8.4,
        "Width": 6.9,
        "Height": 4.6,
        "Color": "Blue",
        "Intensity": "Vivid",
        "Clarity": "Eye Clean",
        "Shape": "Oval",
        "Cut": "Mixed Brilliant Cut",
        "Treatment": "Heat Treated",
        "Origin": "Ceylon (Sri Lanka)",
    }

    import json

    result = recommend_jewelry(example_stone)
    print(json.dumps(result, indent=2))
