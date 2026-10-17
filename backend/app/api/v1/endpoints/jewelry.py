"""Jewelry recommendation API endpoint."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.deps import SettingsDep
from app.schemas.jewelry import JewelryRecommendationRequest, JewelryRecommendationResponse
from app.services.jewelry_recommender import JewelryRecommender

router = APIRouter(prefix="/jewelry", tags=["jewelry"])


def get_jewelry_recommender(request: Request) -> JewelryRecommender:
    if not hasattr(request.app.state, "jewelry_recommender"):
        request.app.state.jewelry_recommender = JewelryRecommender(request.app.state.settings)
    return request.app.state.jewelry_recommender


JewelryRecommenderDep = Annotated[JewelryRecommender, Depends(get_jewelry_recommender)]


@router.post(
    "/recommend",
    response_model=JewelryRecommendationResponse,
    summary="Recommend jewelry type for sapphire gemstone",
    description="Calculates suitability scores for Ring, Earring, and Necklace using domain rules.",
)
def recommend_jewelry_type(
    request: JewelryRecommendationRequest,
    recommender: JewelryRecommenderDep,
    settings: SettingsDep,
) -> JewelryRecommendationResponse:
    try:
        return recommender.recommend(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Jewelry recommendation error: {exc}") from exc
