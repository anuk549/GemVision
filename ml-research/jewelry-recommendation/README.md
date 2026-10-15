# Jewelry Recommendation

This folder contains the rule-based jewelry recommendation component of the GemVision project.

The system recommends the most suitable jewelry type for a sapphire from:

- Ring
- Earring
- Necklace

It also gives a suitability score for each option.

## How It Works

This component is not a machine learning model.

It uses a simple weighted rule-based method based on five gemstone features:

| Factor | Weight |
|---|---:|
| Weight | 30% |
| Shape | 25% |
| Treatment | 20% |
| Clarity | 15% |
| Cut | 10% |

The score for each jewelry type is calculated as:

```text
Score =
(Weight score × 30)
+ (Shape score × 25)
+ (Treatment score × 20)
+ (Clarity score × 15)
+ (Cut score × 10)
```

The final score is shown between 0 and 100.

These percentages are Jewelry Suitability Scores. They are not machine learning confidence values or probabilities.

The three scores do not need to add up to 100%.

---

## Input

The recommender accepts gemstone information in a dictionary.

Example:

```python
stone = {
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
    "Origin": "Ceylon (Sri Lanka)"
}
```

For the current version, only these five fields affect the jewelry recommendation:

- Weight
- Shape
- Treatment
- Clarity
- Cut

The following fields are accepted but are not currently used for jewelry scoring:

- Length
- Width
- Height
- Color
- Intensity
- Origin
- Market price

---

## Weight Rules

The current research scope is from 0.50 ct to 5.00 ct.

Earrings favour small to medium stones because the stone hangs from the ear,
so suitability falls as the stone gets larger.

| Weight | Ring | Earring | Necklace |
|---|---:|---:|---:|
| 0.50–1.00 ct | 1.00 | 1.00 | 0.75 |
| >1.00–2.00 ct | 1.00 | 0.95 | 0.85 |
| >2.00–3.00 ct | 0.90 | 0.80 | 1.00 |
| >3.00–4.00 ct | 0.70 | 0.60 | 1.00 |
| >4.00–5.00 ct | 0.55 | 0.40 | 1.00 |

If the weight is below 0.50 ct or above 5.00 ct, the system returns a validation error.

---

## Shape Rules

| Shape | Ring | Earring | Necklace |
|---|---:|---:|---:|
| Round | 1.00 | 1.00 | 0.90 |
| Oval | 1.00 | 1.00 | 1.00 |
| Cushion | 1.00 | 0.95 | 0.95 |
| Emerald / Asscher | 0.85 | 0.95 | 1.00 |
| Pear | 0.80 | 0.90 | 1.00 |
| Marquise | 0.75 | 0.85 | 1.00 |
| Trillion | 0.80 | 0.85 | 0.95 |
| Other / Unknown | 0.75 | 0.80 | 0.90 |

Pointed or cornered shapes may need more protective setting considerations because they can be more exposed to impact.

---

## Treatment Rules

| Treatment | Ring | Earring | Necklace |
|---|---:|---:|---:|
| Unheated | 1.00 | 1.00 | 1.00 |
| Heat Treated | 1.00 | 1.00 | 1.00 |
| Lattice Diffused | 0.85 | 0.90 | 0.95 |
| Fracture Filled | 0.55 | 0.70 | 0.85 |
| Unknown | 0.75 | 0.75 | 0.75 |

Different names such as `Heated`, `Heat`, `No Treatment`, `No Enhancement`, and `Diffused` are normalized before scoring.

---

## Clarity Rules

| Clarity | Ring | Earring | Necklace |
|---|---:|---:|---:|
| Eye Clean / VVS / VS | 1.00 | 1.00 | 1.00 |
| Slightly Included / SI | 0.90 | 0.95 | 0.95 |
| Moderately / Heavily Included | 0.65 | 0.75 | 0.85 |
| Unknown | 0.65 | 0.75 | 0.85 |

The system does not assume that every inclusion makes a sapphire weak.

However, significant inclusions or fractures may require additional durability consideration, especially for jewelry that is more exposed to impact.

---

## Cut Rules

Cut has the smallest influence in the current recommendation system.

| Cut | Ring | Earring | Necklace |
|---|---:|---:|---:|
| Mixed Brilliant / Oval / Cushion / Faceted Superior | 1.00 | 1.00 | 1.00 |
| Emerald / Step Cut | 0.90 | 0.95 | 1.00 |
| Trillion Cut | 0.90 | 0.95 | 0.95 |
| Other / Unknown | 0.85 | 0.85 | 0.90 |

---

## Input Normalization

The system accepts different names for the same gemstone feature.

Examples:

| User Input | Used As |
|---|---|
| Heated | Heat Treated |
| No Enhancement | Unheated |
| Diffused | Lattice Diffused |
| SI | Slightly Included |
| VS | Eye Clean |
| Asscher - Octagon | Emerald / Asscher |
| Step Cut | Emerald / Step Cut |
| Faceted / Superior | Mixed Brilliant group |

This helps the system handle slightly different input values without failing.

---

## Recommendation Selection

The jewelry category with the highest suitability score is selected as the recommendation.

If two categories receive the same score, the system checks:

1. Higher weight suitability
2. Higher shape suitability
3. If still equal: Ring → Necklace → Earring

This keeps the recommendation consistent.

---

## Example

```python
from jewelry_recommender import recommend_jewelry

stone = {
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
    "Origin": "Ceylon (Sri Lanka)"
}

result = recommend_jewelry(stone)

print(result["scores"])
print(result["recommended"])
```

Example output:

```python
{
    "ring": 97.0,
    "earring": 94.0,
    "necklace": 100.0
}
```

Recommended jewelry:

```text
Necklace
```

---

## Example Score Calculation

For the Ring score:

```text
Weight     = 0.90 × 30 = 27.0
Shape      = 1.00 × 25 = 25.0
Treatment  = 1.00 × 20 = 20.0
Clarity    = 1.00 × 15 = 15.0
Cut        = 1.00 × 10 = 10.0

Total = 97.0%
```

This factor breakdown makes the recommendation easy to understand and explain.

---

## Rounding

Final suitability scores are rounded to one decimal place using `ROUND_HALF_UP`.

Examples:

```text
98.25 -> 98.3
97.04 -> 97.0
97.05 -> 97.1
```

---

## Validation

The function checks that:

- the input is a dictionary
- Weight is provided
- Weight is numeric
- Weight is between 0.50 and 5.00 ct

Missing or unknown values for Shape, Treatment, Clarity, and Cut use safe fallback values instead of crashing the program.

---

## Testing

Run the tests using:

```bash
python -m unittest test_recommender.py -v
```

The test file checks:

- normal recommendation cases
- aliases
- weight boundaries
- invalid input
- missing values
- score calculations
- tie handling
- rounding behavior

---

## Files

| File | Purpose |
|---|---|
| `jewelry_rules.py` | Stores scoring rules, aliases, weights and fallback values |
| `jewelry_recommender.py` | Contains the recommendation logic |
| `test_recommender.py` | Contains automated tests |
| `README.md` | Explains how the component works |

---

## Research Note

There is no universal international standard that states that a sapphire with a specific weight, shape, clarity or treatment must be used in a Ring, Earring or Necklace.

The rules used in this component are research-defined heuristics based on gemological considerations such as durability, wearability, treatment effects and setting requirements.

The exact numerical weights and suitability values are not official GIA values.

For stronger research validation, these rules should later be reviewed by gemologists or jewelry professionals.

---

## Future Work

This component can later be connected to the FastAPI backend together with:

- Gemstone identification
- Market value prediction
- Jewelry recommendation

This will allow the application to provide all results through one complete gemstone analysis workflow.