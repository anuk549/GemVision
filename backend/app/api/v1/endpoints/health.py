"""Health and readiness probes."""

from __future__ import annotations

import tensorflow as tf
from fastapi import APIRouter

from app.api.deps import RegistryDep, SettingsDep
from app.core.exceptions import ModelNotAvailableError
from app.schemas.common import Message
from app.schemas.defect import HealthResponse, VisionStatus
from app.services.model_registry import MODEL_SPECS

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Liveness and model status")
def health(registry: RegistryDep, settings: SettingsDep) -> HealthResponse:
    loaded = registry.loaded_count
    return HealthResponse(
        status="ok" if loaded > 0 else "degraded",
        version=settings.version,
        vision=VisionStatus(
            tensorflow=tf.__version__,
            models_loaded=loaded,
            models_total=len(MODEL_SPECS),
            model_dir=str(registry.model_dir),
        ),
    )


@router.get("/ready", response_model=Message, summary="Readiness probe")
def ready(registry: RegistryDep) -> Message:
    if registry.loaded_count == 0:
        raise ModelNotAvailableError("No defect detection models are loaded")
    return Message(detail="ready")
