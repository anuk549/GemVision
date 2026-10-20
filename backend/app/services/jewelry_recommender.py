"""Service wrapping the rule-based jewelry recommendation engine."""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any

from app.core.config import Settings
from app.schemas.jewelry import JewelryRecommendationRequest, JewelryRecommendationResponse

logger = logging.getLogger(__name__)


class JewelryRecommender:
    """Invokes the rule-based jewelry recommendation engine from ml-research."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.project_root = Path(settings.model_dir).parents[2]
        self._module = self._load_module()

    def _load_module(self) -> Any:
        candidates = [
            self.project_root / "ml-research" / "jewelry-recommendation",
            Path("ml-research/jewelry-recommendation").resolve(),
            Path("../ml-research/jewelry-recommendation").resolve(),
        ]
        for p in candidates:
            if (p / "jewelry_recommender.py").exists():
                logger.info("Found jewelry recommendation module at %s", p)
                if str(p) not in sys.path:
                    sys.path.insert(0, str(p))
                try:
                    import jewelry_recommender as jr
                    return jr
                except Exception as exc:
                    logger.error("Failed to import jewelry_recommender from %s: %s", p, exc)
                    raise
        logger.warning("jewelry_recommender.py not found in candidate paths.")
        return None

    def recommend(self, req: JewelryRecommendationRequest) -> JewelryRecommendationResponse:
        if self._module is None:
            self._module = self._load_module()
            if self._module is None:
                raise RuntimeError("Jewelry recommendation engine is not available.")

        stone_dict = {
            "Weight": req.weight,
            "Shape": req.shape,
            "Treatment": req.treatment,
            "Clarity": req.clarity,
            "Cut": req.cut,
        }
        if req.length is not None:
            stone_dict["Length"] = req.length
        if req.width is not None:
            stone_dict["Width"] = req.width
        if req.height is not None:
            stone_dict["Height"] = req.height
        if req.color is not None:
            stone_dict["Color"] = req.color
        if req.intensity is not None:
            stone_dict["Intensity"] = req.intensity
        if req.origin is not None:
            stone_dict["Origin"] = req.origin

        try:
            raw_result = self._module.recommend_jewelry(stone_dict)
        except ValueError as exc:
            # Re-raise validation errors (e.g. weight out of 0.50-5.00 range)
            raise ValueError(str(exc)) from exc
        except Exception as exc:
            logger.error("Jewelry recommendation error: %s", exc)
            raise RuntimeError(f"Error calculating jewelry recommendation: {exc}") from exc

        return JewelryRecommendationResponse(
            recommended=raw_result["recommended"],
            scores=raw_result["scores"],
            recommendation_explanation=raw_result["recommendation_explanation"],
            factor_breakdown=raw_result.get("factor_breakdown"),
            reasons=raw_result.get("reasons"),
            method=raw_result.get("method", "rule_based_weighted_suitability"),
            disclaimer=raw_result.get("disclaimer", ""),
        )
