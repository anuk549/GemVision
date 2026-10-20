"""
test_recommender.py
===================

Unit tests for the rule-based jewellery recommendation component.

Uses the standard-library `unittest` framework (pytest is not required).

Run from this directory:

    python -m unittest test_recommender.py -v

or:

    python test_recommender.py
"""

import unittest

from jewelry_recommender import (
    recommend_jewelry,
    round_half_up,
    normalize_shape,
    normalize_treatment,
    normalize_clarity,
    normalize_cut,
)
import jewelry_rules as rules


def make_stone(
    weight=2.10,
    shape="Oval",
    treatment="Heat Treated",
    clarity="Eye Clean",
    cut="Mixed Brilliant Cut",
    **extra,
):
    """Build a stone dictionary with sensible defaults."""
    stone = {
        "Weight": weight,
        "Shape": shape,
        "Treatment": treatment,
        "Clarity": clarity,
        "Cut": cut,
    }
    stone.update(extra)
    return stone


# Scenario tests 


class TestScenarios(unittest.TestCase):
    """The 12 requested research scenarios."""

    TOL = 0.051  # finals are rounded to 1 decimal; tolerate the exact half

    def assert_valid_result(self, result):
        """Shared assertions for every valid recommendation result."""
        # All scores between 0 and 100.
        for category, score in result["scores"].items():
            self.assertGreaterEqual(score, 0.0, f"{category} score < 0")
            self.assertLessEqual(score, 100.0, f"{category} score > 100")

        # Recommended is one of the three categories.
        self.assertIn(result["recommended"], ("Ring", "Earring", "Necklace"))

        # Recommendation matches the highest score.
        highest = max(result["scores"], key=result["scores"].get)
        expected = {"ring": "Ring", "earring": "Earring", "necklace": "Necklace"}[highest]
        self.assertEqual(result["recommended"], expected)

        # Method and disclaimer present.
        self.assertEqual(result["method"], "rule_based_weighted_suitability")
        self.assertIn("Suitability scores", result["disclaimer"])

        # Weighted contributions add up to the final score (ROUND_HALF_UP).
        for category, breakdown in result["factor_breakdown"].items():
            total = sum(f["contribution"] for f in breakdown.values())
            self.assertEqual(
                round_half_up(total, 1),
                result["scores"][category],
                msg=f"contributions do not add to final score for {category}",
            )

    def test_scenario_1_small_round_eye_clean_heated(self):
        """0.75 ct Round, Eye Clean, Heat Treated."""
        result = recommend_jewelry(make_stone(weight=0.75, shape="Round"))
        self.assert_valid_result(result)
        # 0.50-1.00 band: weight ring=1.00 earring=1.00 necklace=0.75
        self.assertAlmostEqual(result["scores"]["ring"], 100.0, delta=self.TOL)
        # Small round stones suit both Ring and Earring perfectly: a tie is
        # resolved by tie-break step 3 (Ring before Earring).
        self.assertAlmostEqual(result["scores"]["earring"], 100.0, delta=self.TOL)
        self.assertAlmostEqual(result["scores"]["necklace"], 90.0, delta=self.TOL)
        self.assertEqual(result["recommended"], "Ring")

    def test_scenario_2_oval_eye_clean(self):
        """2.20 ct Oval, Eye Clean (heat treated default)."""
        result = recommend_jewelry(make_stone(weight=2.20, shape="Oval"))
        self.assert_valid_result(result)
        # ring: 0.90*30 + 1.00*25 + 1.00*20 + 1.00*15 + 1.00*10 = 97.0
        self.assertAlmostEqual(result["scores"]["ring"], 97.0, delta=self.TOL)
        # earring: 0.80*30(24) + 1.00*25 + 1.00*20 + 1.00*15 + 1.00*10 = 94.0
        self.assertAlmostEqual(result["scores"]["earring"], 94.0, delta=self.TOL)
        # necklace: 1.00*30 + 1.00*25 + 1.00*20 + 1.00*15 + 1.00*10 = 100.0
        self.assertAlmostEqual(result["scores"]["necklace"], 100.0, delta=self.TOL)
        self.assertEqual(result["recommended"], "Necklace")

    def test_scenario_3_cushion_slightly_included(self):
        """2.80 ct Cushion, Slightly Included."""
        result = recommend_jewelry(make_stone(weight=2.80, shape="Cushion",
                                              clarity="Slightly Included"))
        self.assert_valid_result(result)
        # ring: 27 + 25 + 20 + 0.90*15(13.5) + 10 = 95.5
        self.assertAlmostEqual(result["scores"]["ring"], 95.5, delta=self.TOL)
        # earring: 0.80*30(24) + 0.95*25(23.75) + 20 + 0.95*15(14.25) + 10 = 92.0
        self.assertEqual(result["scores"]["earring"], 92.0)
        # necklace: 30 + 23.75 + 20 + 0.95*15(14.25) + 10 = 98.0
        self.assertAlmostEqual(result["scores"]["necklace"], 98.0, delta=self.TOL)
        self.assertEqual(result["recommended"], "Necklace")

    def test_scenario_4_large_oval(self):
        """4.50 ct Oval (unknown treatment/clarity fall back conservatively)."""
        result = recommend_jewelry(make_stone(weight=4.50, shape="Oval",
                                              treatment=None, clarity=None))
        self.assert_valid_result(result)
        # ring: 0.55*30(16.5) + 25 + 0.75*20(15) + 0.65*15(9.75) + 10 = 76.25 -> 76.3 (HALF_UP)
        self.assertEqual(result["scores"]["ring"], 76.3)
        # earring: 0.40*30(12) + 25 + 15 + 0.75*15(11.25) + 10 = 73.25 -> 73.3 (HALF_UP)
        self.assertEqual(result["scores"]["earring"], 73.3)
        # necklace: 30 + 25 + 15 + 0.85*15(12.75) + 10 = 92.75 -> 92.8 (HALF_UP)
        self.assertEqual(result["scores"]["necklace"], 92.8)
        self.assertEqual(result["recommended"], "Necklace")

    def test_scenario_5_pear(self):
        """3.50 ct Pear."""
        result = recommend_jewelry(make_stone(weight=3.50, shape="Pear"))
        self.assert_valid_result(result)
        # ring: 0.70*30(21) + 0.80*25(20) + 20 + 15 + 10 = 86.0
        self.assertAlmostEqual(result["scores"]["ring"], 86.0, delta=self.TOL)
        # earring: 0.60*30(18) + 0.90*25(22.5) + 20 + 15 + 10 = 85.5
        self.assertEqual(result["scores"]["earring"], 85.5)
        # necklace: 30 + 25 + 20 + 15 + 10 = 100.0
        self.assertAlmostEqual(result["scores"]["necklace"], 100.0, delta=self.TOL)
        self.assertEqual(result["recommended"], "Necklace")
        # Pointed-shape protective-setting caveat must appear for every category.
        for category_reasons in result["reasons"].values():
            joined = " ".join(category_reasons)
            self.assertIn("protective setting considerations", joined)

    def test_scenario_6_marquise(self):
        """Marquise shape (2.00 ct)."""
        result = recommend_jewelry(make_stone(weight=2.00, shape="Marquise"))
        self.assert_valid_result(result)
        # ring: 30 + 0.75*25(18.75) + 20 + 15 + 10 = 93.75 -> 93.8 (HALF_UP)
        self.assertEqual(result["scores"]["ring"], 93.8)
        # earring: 0.95*30(28.5) + 0.85*25(21.25) + 20 + 15 + 10 = 94.75 -> 94.8 (HALF_UP)
        self.assertEqual(result["scores"]["earring"], 94.8)
        # necklace: 25.5 + 25 + 20 + 15 + 10 = 95.5 (weight band >1.00-2.00 = 0.85)
        self.assertAlmostEqual(result["scores"]["necklace"], 95.5, delta=self.TOL)

    def test_scenario_7_heavily_included(self):
        """Heavily Included clarity (1.50 ct Round)."""
        result = recommend_jewelry(make_stone(weight=1.50, shape="Round",
                                              clarity="Heavily Included"))
        self.assert_valid_result(result)
        # ring: 30 + 25 + 20 + 0.65*15(9.75) + 10 = 94.75 -> 94.8 (HALF_UP)
        self.assertEqual(result["scores"]["ring"], 94.8)
        # earring: 0.95*30(28.5) + 25 + 20 + 0.75*15(11.25) + 10 = 94.75 -> 94.8 (HALF_UP)
        self.assertEqual(result["scores"]["earring"], 94.8)
        # necklace: 25.5 + 22.5 + 20 + 0.85*15(12.75) + 10 = 90.75 -> 90.8 (HALF_UP)
        self.assertEqual(result["scores"]["necklace"], 90.8)
        self.assertEqual(result["recommended"], "Ring")
        # Durability wording must be careful (no "all inclusions weaken").
        joined = " ".join(result["reasons"]["ring"])
        self.assertIn("additional durability considerations", joined)

    def test_scenario_8_lattice_diffused(self):
        """Lattice Diffused treatment (2.00 ct Round)."""
        result = recommend_jewelry(make_stone(weight=2.00, shape="Round",
                                              treatment="Lattice Diffused"))
        self.assert_valid_result(result)
        # ring: 30 + 25 + 0.85*20(17) + 15 + 10 = 97.0
        self.assertEqual(result["scores"]["ring"], 97.0)
        # earring: 28.5 + 25 + 0.90*20(18) + 15 + 10 = 96.5
        self.assertEqual(result["scores"]["earring"], 96.5)
        # necklace: 0.85*30(25.5) + 0.90*25(22.5) + 0.95*20(19) + 15 + 10 = 92.0
        self.assertAlmostEqual(result["scores"]["necklace"], 92.0, delta=self.TOL)
        self.assertEqual(result["recommended"], "Ring")

    def test_scenario_9_emerald_step_cut(self):
        """Emerald / Step Cut (1.50 ct Emerald shape)."""
        result = recommend_jewelry(make_stone(weight=1.50, shape="Emerald",
                                              cut="Emerald / Step Cut"))
        self.assert_valid_result(result)
        # ring: 30 + 0.85*25(21.25) + 20 + 15 + 0.90*10(9) = 95.25 -> 95.3 (HALF_UP)
        self.assertEqual(result["scores"]["ring"], 95.3)
        # necklace: 0.85*30(25.5) + 25 + 20 + 15 + 10 = 95.5
        self.assertAlmostEqual(result["scores"]["necklace"], 95.5, delta=self.TOL)
        # earring: 0.95*30(28.5) + 0.95*25(23.75) + 20 + 15 + 0.95*10(9.5) = 96.75 -> 96.8
        self.assertEqual(result["scores"]["earring"], 96.8)
        # A step-cut emerald stone in a medium weight band suits earrings best.
        self.assertEqual(result["recommended"], "Earring")

    def test_scenario_10_unknown_treatment(self):
        """Unknown treatment must not crash and must explain the fallback."""
        result = recommend_jewelry(make_stone(weight=1.50, shape="Round",
                                              treatment="Unknown"))
        self.assert_valid_result(result)
        joined = " ".join(result["reasons"]["ring"])
        self.assertIn("Treatment information is incomplete", joined)

    def test_scenario_10b_missing_treatment_and_all_categoricals(self):
        """Completely missing categorical fields must not crash."""
        result = recommend_jewelry({"Weight": 1.50})
        self.assert_valid_result(result)
        joined = " ".join(result["reasons"]["ring"])
        self.assertIn("Treatment information is incomplete", joined)
        self.assertIn("Clarity information is incomplete", joined)
        self.assertIn("Cut information is incomplete", joined)

    def test_scenario_11_weight_below_minimum(self):
        """Weight below 0.50 ct raises the documented error."""
        with self.assertRaises(ValueError) as ctx:
            recommend_jewelry(make_stone(weight=0.49))
        self.assertEqual(
            str(ctx.exception),
            "Jewelry recommendation currently supports gemstones between "
            "0.50 and 5.00 carats.",
        )

    def test_scenario_12_weight_above_maximum(self):
        """Weight above 5.00 ct raises the documented error."""
        with self.assertRaises(ValueError) as ctx:
            recommend_jewelry(make_stone(weight=5.01))
        self.assertEqual(
            str(ctx.exception),
            "Jewelry recommendation currently supports gemstones between "
            "0.50 and 5.00 carats.",
        )



# Alias normalization tests


class TestAliases(unittest.TestCase):
    """Normalization aliases must map to the documented groups."""

    def test_heated_maps_to_heat_treated(self):
        self.assertEqual(normalize_treatment("Heated"), "heat_treated")

    def test_no_enhancement_maps_to_unheated(self):
        self.assertEqual(normalize_treatment("No Enhancement"), "unheated")

    def test_diffused_maps_to_lattice_diffused(self):
        self.assertEqual(normalize_treatment("Diffused"), "lattice_diffused")

    def test_si_maps_to_slightly_included(self):
        self.assertEqual(normalize_clarity("SI"), "slightly_included")

    def test_vs_maps_to_eye_clean_group(self):
        self.assertEqual(normalize_clarity("VS"), "eye_clean")

    def test_asscher_octagon_maps_to_emerald_group(self):
        self.assertEqual(normalize_shape("Asscher - Octagon"), "emerald")

    def test_rectangular_octagon_maps_to_emerald_group(self):
        self.assertEqual(normalize_shape("Rectangular Octagon"), "emerald")

    def test_step_cut_maps_to_emerald_step_group(self):
        self.assertEqual(normalize_cut("Step Cut"), "emerald_step")

    def test_mixed_brilliant_cut_alias(self):
        self.assertEqual(normalize_cut("Mixed Brilliant Cut"), "mixed_brilliant")

    def test_faceted_superior_alias(self):
        self.assertEqual(normalize_cut("Faceted / Superior"), "mixed_brilliant")

    def test_near_eye_clean_alias(self):
        self.assertEqual(normalize_clarity("Near Eye-Clean"), "eye_clean")

    def test_vvs_alias(self):
        self.assertEqual(normalize_clarity("VVS"), "eye_clean")

    def test_unknown_shape_falls_back_to_fancy(self):
        self.assertEqual(normalize_shape("Some Exotic Shape"), "fancy")

    def test_none_values_use_conservative_defaults(self):
        self.assertEqual(normalize_treatment(None), "unknown")
        self.assertEqual(normalize_clarity(None), "unknown")
        self.assertEqual(normalize_cut(None), "other")

    def test_alias_score_equivalence(self):
        """Alias and canonical value must give identical final scores."""
        base = make_stone(weight=2.00, shape="Round")
        a = recommend_jewelry(dict(base, Treatment="Heated"))
        b = recommend_jewelry(dict(base, Treatment="Heat Treated"))
        self.assertEqual(a["scores"], b["scores"])

        c = recommend_jewelry(dict(base, Clarity="SI"))
        d = recommend_jewelry(dict(base, Clarity="Slightly Included"))
        self.assertEqual(c["scores"], d["scores"])



# Weight band edge tests


class TestWeightBandEdges(unittest.TestCase):
    """Band boundary behavior: bands are inclusive of their upper bound."""

    def band_weight_raw(self, weight):
        stone = make_stone(weight=weight, shape="Round")
        result = recommend_jewelry(stone)
        return result["factor_breakdown"]["ring"]["weight"]["raw_score"]

    def test_1_00_and_1_01(self):
        self.assertEqual(self.band_weight_raw(1.00), 1.00)  # band 1
        self.assertEqual(self.band_weight_raw(1.01), 1.00)  # band 2
        # necklace differentiates the two bands (0.75 vs 0.85)
        r100 = recommend_jewelry(make_stone(weight=1.00))
        r101 = recommend_jewelry(make_stone(weight=1.01))
        self.assertEqual(r100["factor_breakdown"]["necklace"]["weight"]["raw_score"], 0.75)
        self.assertEqual(r101["factor_breakdown"]["necklace"]["weight"]["raw_score"], 0.85)

    def test_2_00_and_2_01(self):
        # 2.00 -> band 2 (ring 1.00), 2.01 -> band 3 (ring 0.90)
        self.assertEqual(self.band_weight_raw(2.00), 1.00)
        self.assertEqual(self.band_weight_raw(2.01), 0.90)

    def test_3_00_and_3_01(self):
        self.assertEqual(self.band_weight_raw(3.00), 0.90)
        self.assertEqual(self.band_weight_raw(3.01), 0.70)

    def test_4_00_and_4_01(self):
        self.assertEqual(self.band_weight_raw(4.00), 0.70)
        self.assertEqual(self.band_weight_raw(4.01), 0.55)

    def test_exact_boundaries_are_valid(self):
        for weight in (0.50, 1.00, 2.00, 3.00, 4.00, 5.00):
            result = recommend_jewelry(make_stone(weight=weight))
            self.assert_valid_result_like(result)

    def assert_valid_result_like(self, result):
        for score in result["scores"].values():
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 100.0)


# Input validation tests


class TestValidation(unittest.TestCase):
    """Invalid inputs raise ValueError; unknown categoricals never crash."""

    def test_rejects_bool_weight(self):
        with self.assertRaises(ValueError):
            recommend_jewelry({"Weight": True})
        with self.assertRaises(ValueError):
            recommend_jewelry({"Weight": False})

    def test_rejects_nan_weight(self):
        with self.assertRaises(ValueError):
            recommend_jewelry({"Weight": float("nan")})

    def test_rejects_inf_weight(self):
        with self.assertRaises(ValueError):
            recommend_jewelry({"Weight": float("inf")})

    def test_rejects_string_weight(self):
        with self.assertRaises(ValueError):
            recommend_jewelry({"Weight": "2.1"})

    def test_rejects_missing_weight(self):
        with self.assertRaises(ValueError):
            recommend_jewelry({"Shape": "Oval"})

    def test_rejects_non_dict_input(self):
        with self.assertRaises(ValueError):
            recommend_jewelry("not a dict")
        with self.assertRaises(ValueError):
            recommend_jewelry(None)
        with self.assertRaises(ValueError):
            recommend_jewelry([])

    def test_unknown_categorical_values_do_not_crash(self):
        result = recommend_jewelry(
            make_stone(shape="Blob", treatment="Mystery Goo",
                       clarity="??? ", cut="Weird")
        )
        for score in result["scores"].values():
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 100.0)

    def test_missing_categorical_keys_do_not_crash(self):
        result = recommend_jewelry({"Weight": 2.0})
        self.assertIn(result["recommended"], ("Ring", "Earring", "Necklace"))



# Score-independence tests (unused fields must not change the score)

class TestUnusedFieldsDoNotAffectScore(unittest.TestCase):
    """Color, Intensity, Origin, Length, Width, Height must not change scores."""

    def test_irrelevant_fields_ignored(self):
        plain = recommend_jewelry(make_stone(weight=2.10))
        enriched = recommend_jewelry(
            make_stone(
                weight=2.10,
                Length=8.4,
                Width=6.9,
                Height=4.6,
                Color="Blue",
                Intensity="Vivid",
                Origin="Ceylon (Sri Lanka)",
            )
        )
        self.assertEqual(plain["scores"], enriched["scores"])
        self.assertEqual(plain["recommended"], enriched["recommended"])

    def test_different_irrelevant_values_same_score(self):
        a = recommend_jewelry(make_stone(weight=2.10, Color="Pink",
                                         Origin="Madagascar"))
        b = recommend_jewelry(make_stone(weight=2.10, Color="Yellow",
                                         Origin="Burma"))
        self.assertEqual(a["scores"], b["scores"])



# Structural / academic assertions


class TestResultStructure(unittest.TestCase):
    """The result exposes the full explainable breakdown."""

    def setUp(self):
        self.stone = make_stone(weight=2.10, shape="Oval")
        self.result = recommend_jewelry(self.stone)

    def test_scores_need_not_sum_to_100(self):
        total = sum(self.result["scores"].values())
        # Documented behavior: scores are independent, not a distribution.
        self.assertNotEqual(round(total, 1), 100.0)

    def test_all_factor_breakdowns_present(self):
        for category in ("ring", "earring", "necklace"):
            breakdown = self.result["factor_breakdown"][category]
            self.assertEqual(
                set(breakdown.keys()),
                {"weight", "shape", "treatment", "clarity", "cut"},
            )
            for factor, entry in breakdown.items():
                self.assertIn("raw_score", entry)
                self.assertIn("factor_weight", entry)
                self.assertIn("contribution", entry)
                self.assertGreaterEqual(entry["raw_score"], 0.0)
                self.assertLessEqual(entry["raw_score"], 1.0)
                expected = round(entry["raw_score"] * entry["factor_weight"], 2)
                self.assertAlmostEqual(entry["contribution"], expected, places=2)

    def test_reasons_present_for_every_category(self):
        for category in ("ring", "earring", "necklace"):
            self.assertEqual(len(self.result["reasons"][category]), 5)

    def test_recommendation_explanation_wording(self):
        explanation = self.result["recommendation_explanation"]
        self.assertIn("suitability", explanation.lower())
        # Methodological/disclaimer wording belongs in the README only,
        # not in every user-facing explanation.
        self.assertNotIn("under the current rule set", explanation)
        self.assertNotIn("universal design rule", explanation)
        # Must not claim probability/confidence language.
        self.assertNotIn("probability", explanation.lower())
        self.assertNotIn("confidence", explanation.lower())

    def test_method_and_disclaimer(self):
        self.assertEqual(self.result["method"], "rule_based_weighted_suitability")
        self.assertIn("not professional jewelry design", self.result["disclaimer"])

    def test_factor_weights_sum_to_1(self):
        self.assertAlmostEqual(sum(rules.FACTOR_WEIGHTS.values()), 1.0, places=10)
        self.assertAlmostEqual(sum(rules.FACTOR_PERCENTAGES.values()), 100.0, places=10)



# Tie-handling tests

class TestTieHandling(unittest.TestCase):
    """Documented tie-break: weight, then shape, then Ring > Necklace > Earring."""

    def test_identical_treatment_unknown_tie_prefers_weight_then_shape(self):
        # A stone where treatment and clarity and cut are all neutral/unknown
        # can create ties; verify deterministic output across repeated calls.
        stone = make_stone(weight=1.00, shape="Round", treatment="Unheated",
                           clarity="Eye Clean", cut="Faceted")
        first = recommend_jewelry(stone)
        for _ in range(10):
            self.assertEqual(first, recommend_jewelry(stone))

    def test_tie_break_order_constant(self):
        self.assertEqual(rules.TIE_BREAK_ORDER, ("Ring", "Necklace", "Earring"))



# Rounding tests

class TestRounding(unittest.TestCase):
    """User-facing suitability scores use deterministic ROUND_HALF_UP."""

    def test_round_half_up_examples(self):
        self.assertEqual(round_half_up(98.25, 1), 98.3)
        self.assertEqual(round_half_up(97.04, 1), 97.0)
        self.assertEqual(round_half_up(97.05, 1), 97.1)

    def test_round_half_up_two_places(self):
        self.assertEqual(round_half_up(12.755, 2), 12.76)
        self.assertEqual(round_half_up(12.754, 2), 12.75)

    def test_exact_half_score_rounds_up_not_even(self):
        """A .X5 total must round up (away from zero), not to even."""
        # 4.50 ct Pear, Slightly Included, Lattice Diffused, Step Cut:
        # necklace = 30 + 25 + 19 + 14.25 + 10 = 98.25 -> 98.3 (not 98.2)
        result = recommend_jewelry(
            make_stone(weight=4.50, shape="Pear", clarity="Slightly Included",
                       treatment="Lattice Diffused", cut="Emerald / Step Cut")
        )
        self.assertEqual(result["scores"]["necklace"], 98.3)

    def test_contributions_match_score_after_half_up(self):
        """Displayed contributions must sum to the displayed score."""
        result = recommend_jewelry(
            make_stone(weight=4.50, shape="Pear", clarity="Slightly Included",
                       treatment="Lattice Diffused", cut="Emerald / Step Cut")
        )
        for category, breakdown in result["factor_breakdown"].items():
            total = sum(f["contribution"] for f in breakdown.values())
            self.assertEqual(round_half_up(total, 1), result["scores"][category])


# Earring-specific suitability tests


class TestEarringSuitability(unittest.TestCase):
    """Earrings favour small/medium stones; oversized stones suit them less."""

    def test_earring_score_decreases_as_weight_grows(self):
        # Otherwise identical stone; only weight changes.
        scores = [
            recommend_jewelry(make_stone(weight=w, shape="Round"))["scores"]["earring"]
            for w in (0.75, 1.50, 2.50, 3.50, 4.50)
        ]
        for lighter, heavier in zip(scores, scores[1:]):
            self.assertGreater(lighter, heavier,
                               f"earring score did not decrease: {scores}")

    def test_small_stone_suits_earring_at_least_as_well_as_necklace(self):
        result = recommend_jewelry(make_stone(weight=0.75, shape="Round"))
        self.assertGreaterEqual(result["scores"]["earring"],
                                result["scores"]["necklace"])

    def test_large_stone_earring_scores_below_necklace(self):
        result = recommend_jewelry(make_stone(weight=4.50, shape="Oval",
                                              treatment=None, clarity=None))
        self.assertLess(result["scores"]["earring"], result["scores"]["necklace"])

    def test_ring_and_necklace_weight_rules_unchanged_by_earring_focus(self):
        # Ring/Necklace bands must keep their original research values.
        expected_ring = [1.00, 1.00, 0.90, 0.70, 0.55]
        expected_necklace = [0.75, 0.85, 1.00, 1.00, 1.00]
        for band, ring_v, neck_v in zip(
            rules.WEIGHT_BANDS, expected_ring, expected_necklace
        ):
            self.assertEqual(band["scores"]["ring"], ring_v)
            self.assertEqual(band["scores"]["necklace"], neck_v)


if __name__ == "__main__":
    unittest.main(verbosity=2)
