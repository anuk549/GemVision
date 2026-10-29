"""
jewelry_rules.py
================

Configuration ONLY for the jewellery recommendation component.

This module contains no business logic. All rule tables, aliases, weights and
fallback scores live here so that gemologists / jewellery experts can review
and modify them independently of the recommendation logic
(jewelry_recommender.py).

IMPORTANT RESEARCH NOTES
------------------------
* These numerical weights and suitability values are research-defined initial
  heuristics. They are NOT international standards and NOT official GIA
  percentages.
* They are intended for later validation by domain experts (gemologists,
  jewellers).
* Every raw suitability value is bounded to the range [0, 1].
* Final category scores are a weighted sum and are NOT probabilities; the three
  category scores do not need to add up to 100%.
"""



# Supported jewellery categories


CATEGORIES = ("Ring", "Earring", "Necklace")

# Deterministic tie-break order (documented in README.md):
# 1) higher weight suitability, 2) higher shape suitability, 3) this order.
TIE_BREAK_ORDER = ("Ring", "Necklace", "Earring")


# Factor weights (research-defined initial heuristics, total = 1.00)


FACTOR_WEIGHTS = {
    "weight": 0.30,
    "shape": 0.25,
    "treatment": 0.20,
    "clarity": 0.15,
    "cut": 0.10,
}

# Percentage multipliers used by the scoring formula, e.g.
# final = raw*30 + raw*25 + raw*20 + raw*15 + raw*10
FACTOR_PERCENTAGES = {
    "weight": FACTOR_WEIGHTS["weight"] * 100,  # 30
    "shape": FACTOR_WEIGHTS["shape"] * 100,  # 25
    "treatment": FACTOR_WEIGHTS["treatment"] * 100,  # 20
    "clarity": FACTOR_WEIGHTS["clarity"] * 100,  # 15
    "cut": FACTOR_WEIGHTS["cut"] * 100,  # 10
}

FACTOR_ORDER = ("weight", "shape", "treatment", "clarity", "cut")

# ---------------------------------------------------------------------------
# Validation constants
# ---------------------------------------------------------------------------

WEIGHT_MIN = 0.50
WEIGHT_MAX = 5.00

WEIGHT_RANGE_ERROR = (
    "Jewelry recommendation currently supports gemstones between "
    "0.50 and 5.00 carats."
)

WEIGHT_TYPE_ERROR = (
    "Weight must be a numeric value in carats (float or int, not bool)."
)

INPUT_TYPE_ERROR = "stone must be a dictionary of gemstone attributes."

# ---------------------------------------------------------------------------
# 1) WEIGHT RULES  (current research scope: 0.50 ct to 5.00 ct)
# Bands are contiguous and inclusive of their upper bound:
#   0.50 <= w <= 1.00, 1.00 < w <= 2.00, 2.00 < w <= 3.00, ...
# ---------------------------------------------------------------------------

# Earring weight suitability favours small-to-medium stones (worn in a pair,
# weight hanging from the ear) and declines for oversized stones.
WEIGHT_BANDS = [
    {
        "label": "0.50-1.00 ct",
        "min_inclusive": 0.50,
        "max_inclusive": 1.00,
        "scores": {"ring": 1.00, "earring": 1.00, "necklace": 0.75},
    },
    {
        "label": ">1.00-2.00 ct",
        "min_inclusive": 1.00,
        "max_inclusive": 2.00,
        "scores": {"ring": 1.00, "earring": 0.95, "necklace": 0.85},
    },
    {
        "label": ">2.00-3.00 ct",
        "min_inclusive": 2.00,
        "max_inclusive": 3.00,
        "scores": {"ring": 0.90, "earring": 0.80, "necklace": 1.00},
    },
    {
        "label": ">3.00-4.00 ct",
        "min_inclusive": 3.00,
        "max_inclusive": 4.00,
        "scores": {"ring": 0.70, "earring": 0.60, "necklace": 1.00},
    },
    {
        "label": ">4.00-5.00 ct",
        "min_inclusive": 4.00,
        "max_inclusive": 5.00,
        "scores": {"ring": 0.55, "earring": 0.40, "necklace": 1.00},
    },
]

# ---------------------------------------------------------------------------
# 2) SHAPE RULES
# SHAPE_ALIASES maps a *normalized* shape string (lowercase, punctuation and
# extra whitespace removed) to a canonical shape group key.
# ---------------------------------------------------------------------------

SHAPE_ALIASES = {
    # ROUND
    "round": "round",
    "round cut": "round",
    "round brilliant": "round",
    "round brilliant cut": "round",
    # OVAL
    "oval": "oval",
    # CUSHION
    "cushion": "cushion",
    # EMERALD / RECTANGULAR OCTAGON / ASSCHER group
    "emerald": "emerald",
    "emerald cut": "emerald",
    "rectangular octagon": "emerald",
    "octagon": "emerald",
    "asscher": "emerald",
    "asscher octagon": "emerald",
    # PEAR
    "pear": "pear",
    "teardrop": "pear",
    # MARQUISE
    "marquise": "marquise",
    "navette": "marquise",
    # TRILLION
    "trillion": "trillion",
    "trilliant": "trillion",
    "triangle": "trillion",
    # FANCY / OTHER / UNKNOWN (fallback group)
    "fancy": "fancy",
    "other": "fancy",
    "unknown": "fancy",
}

# Earring shape suitability: symmetrical/versatile shapes suit studs well,
# and drop-style shapes (pear, marquise) also wear nicely as earrings.
SHAPE_SCORES = {
    "round": {"ring": 1.00, "earring": 1.00, "necklace": 0.90},
    "oval": {"ring": 1.00, "earring": 1.00, "necklace": 1.00},
    "cushion": {"ring": 1.00, "earring": 0.95, "necklace": 0.95},
    "emerald": {"ring": 0.85, "earring": 0.95, "necklace": 1.00},
    "pear": {"ring": 0.80, "earring": 0.90, "necklace": 1.00},
    "marquise": {"ring": 0.75, "earring": 0.85, "necklace": 1.00},
    "trillion": {"ring": 0.80, "earring": 0.85, "necklace": 0.95},
    "fancy": {"ring": 0.75, "earring": 0.80, "necklace": 0.90},
}

# Fallback used when Shape is missing or cannot be recognized.
DEFAULT_SHAPE_GROUP = "fancy"

# Pointed / cornered shapes: explanation caveat only. These shapes are NOT
# excluded from any jewellery category.
POINTED_SHAPES = ("pear", "marquise", "trillion")

POINTED_SHAPE_NOTE = (
    "These shapes may require additional protective setting considerations "
    "in jewellery exposed to impact."
)

# ---------------------------------------------------------------------------
# 3) TREATMENT RULES
# ---------------------------------------------------------------------------

TREATMENT_ALIASES = {
    # UNHEATED
    "unheated": "unheated",
    "no treatment": "unheated",
    "no enhancement": "unheated",
    "none": "unheated",
    # HEAT TREATED
    "heat treated": "heat_treated",
    "heated": "heat_treated",
    "heat": "heat_treated",
    "heat treatment": "heat_treated",
    # LATTICE DIFFUSED
    "lattice diffused": "lattice_diffused",
    "diffusion treated": "lattice_diffused",
    "diffused": "lattice_diffused",
    "diffusion": "lattice_diffused",
    "lattice diffusion": "lattice_diffused",
    # FRACTURE FILLED
    "fracture filled": "fracture_filled",
    "fracture fill": "fracture_filled",
    "fracture filling": "fracture_filled",
    # UNKNOWN
    "unknown": "unknown",
}

# Earrings are less exposed to hard impact than rings, so treated stones keep
# a comparatively higher suitability than they would in a ring.
TREATMENT_SCORES = {
    "unheated": {"ring": 1.00, "earring": 1.00, "necklace": 1.00},
    "heat_treated": {"ring": 1.00, "earring": 1.00, "necklace": 1.00},
    "lattice_diffused": {"ring": 0.85, "earring": 0.90, "necklace": 0.95},
    "fracture_filled": {"ring": 0.55, "earring": 0.70, "necklace": 0.85},
    "unknown": {"ring": 0.75, "earring": 0.75, "necklace": 0.75},
}

# Conservative default used when Treatment is missing or unrecognized.
DEFAULT_TREATMENT_GROUP = "unknown"

# ---------------------------------------------------------------------------
# 4) CLARITY RULES
# ---------------------------------------------------------------------------

CLARITY_ALIASES = {
    # EYE CLEAN GROUP
    "eye clean": "eye_clean",
    "near eye clean": "eye_clean",
    "vvs": "eye_clean",
    "vvs1": "eye_clean",
    "vvs2": "eye_clean",
    "vs": "eye_clean",
    "vs1": "eye_clean",
    "vs2": "eye_clean",
    # SLIGHTLY INCLUDED GROUP
    "slightly included": "slightly_included",
    "si": "slightly_included",
    "si1": "slightly_included",
    "si2": "slightly_included",
    # MORE INCLUDED GROUP
    "moderately included": "more_included",
    "heavily included": "more_included",
    "included": "more_included",
    "i1": "more_included",
    "i2": "more_included",
    "i3": "more_included",
    # UNKNOWN
    "unknown": "unknown",
}

CLARITY_SCORES = {
    "eye_clean": {"ring": 1.00, "earring": 1.00, "necklace": 1.00},
    "slightly_included": {"ring": 0.90, "earring": 0.95, "necklace": 0.95},
    "more_included": {"ring": 0.65, "earring": 0.75, "necklace": 0.85},
    # Documented conservative fallback: mirror the "more included" group
    # rather than assuming high clarity when the field is missing.
    "unknown": {"ring": 0.65, "earring": 0.75, "necklace": 0.85},
}

# Conservative default used when Clarity is missing or unrecognized.
DEFAULT_CLARITY_GROUP = "unknown"

# ---------------------------------------------------------------------------
# 5) CUT RULES  (smallest influence: 10%)
# ---------------------------------------------------------------------------

CUT_ALIASES = {
    # MIXED BRILLIANT / OVAL / CUSHION / FACETED SUPERIOR group
    "mixed brilliant cut": "mixed_brilliant",
    "mixed brilliant": "mixed_brilliant",
    "brilliant cut": "mixed_brilliant",
    "oval cut": "mixed_brilliant",
    "cushion cut": "mixed_brilliant",
    "faceted": "mixed_brilliant",
    "faceted superior": "mixed_brilliant",
    # EMERALD / STEP CUT group
    "emerald cut": "emerald_step",
    "emerald step cut": "emerald_step",
    "step cut": "emerald_step",
    "step": "emerald_step",
    "emerald": "emerald_step",
    # TRILLION CUT group
    "trillion cut": "trillion",
    "trillion": "trillion",
    # OTHER / UNKNOWN group
    "other": "other",
    "unknown": "other",
}

CUT_SCORES = {
    "mixed_brilliant": {"ring": 1.00, "earring": 1.00, "necklace": 1.00},
    "emerald_step": {"ring": 0.90, "earring": 0.95, "necklace": 1.00},
    "trillion": {"ring": 0.90, "earring": 0.95, "necklace": 0.95},
    "other": {"ring": 0.85, "earring": 0.85, "necklace": 0.90},
}

# Conservative default used when Cut is missing or unrecognized.
DEFAULT_CUT_GROUP = "other"

# ---------------------------------------------------------------------------
# Result metadata
# ---------------------------------------------------------------------------

METHOD = "rule_based_weighted_suitability"

DISCLAIMER = (
    "Suitability scores are research-based recommendations and not "
    "professional jewelry design or gemological certification."
)

# Fields that are accepted as optional input but intentionally do NOT affect
# the v1 score.
UNUSED_INPUT_FIELDS = (
    "Length",
    "Width",
    "Height",
    "Color",
    "Intensity",
    "Origin",
)
