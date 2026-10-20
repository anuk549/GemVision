"""Sapphire price range prediction endpoint."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.deps import SettingsDep
from app.schemas.pricing import SapphirePricingRequest, SapphirePricingResponse
from app.services.sapphire_pricer import SapphirePricer

router = APIRouter(prefix="/pricing", tags=["pricing"])


def get_sapphire_pricer(request: Request) -> SapphirePricer:
    if not hasattr(request.app.state, "sapphire_pricer"):
        request.app.state.sapphire_pricer = SapphirePricer(request.app.state.settings)
    return request.app.state.sapphire_pricer


SapphirePricerDep = Annotated[SapphirePricer, Depends(get_sapphire_pricer)]


@router.post(
    "/predict",
    response_model=SapphirePricingResponse,
    summary="Predict sapphire price range",
    description="Calculates price per carat and total price ranges using the trained ensemble model.",
)
def predict_sapphire_price(
    request: SapphirePricingRequest,
    pricer: SapphirePricerDep,
    settings: SettingsDep,
) -> SapphirePricingResponse:
    try:
        return pricer.predict(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Price prediction error: {exc}") from exc
