"""Defect detection endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

from app.api.deps import DetectorDep, RegistryDep, SettingsDep
from app.core.config import Settings
from app.core.exceptions import (
    ImageTooLargeError,
    InvalidImageError,
    UnsupportedMediaTypeError,
)
from app.schemas.defect import DetectionResult, ModelsResponse

router = APIRouter(prefix="/defects", tags=["defects"])

ImageFile = Annotated[UploadFile, File(description="Gemstone image (jpg/png/webp)")]
ModelKey = Annotated[
    str | None, Form(description="Model key: efficientnet | mobilenet")
]
IncludeVisuals = Annotated[
    bool, Form(description="Return Grad-CAM heatmap/overlay images")
]


async def _read_upload(file: UploadFile, settings: Settings) -> bytes:
    if file.content_type and not file.content_type.startswith("image/"):
        raise UnsupportedMediaTypeError(f"Unsupported content type: {file.content_type}")
    data = await file.read()
    if not data:
        raise InvalidImageError("Uploaded file is empty")
    if len(data) > settings.max_upload_bytes:
        raise ImageTooLargeError(f"Image exceeds {settings.max_upload_mb} MB limit")
    return data


@router.get("/models", response_model=ModelsResponse, summary="Available models")
def list_models(registry: RegistryDep, settings: SettingsDep) -> ModelsResponse:
    return ModelsResponse(default=settings.default_model, models=registry.describe())


@router.post(
    "/detect",
    response_model=DetectionResult,
    summary="Detect defects in a single gemstone image",
)
async def detect(
    file: ImageFile,
    detector: DetectorDep,
    settings: SettingsDep,
    model: ModelKey = None,
    include_visuals: IncludeVisuals = True,
) -> DetectionResult:
    data = await _read_upload(file, settings)
    return detector.detect(data, model_key=model, include_visuals=include_visuals)


@router.post(
    "/detect/compare",
    response_model=list[DetectionResult],
    summary="Run every loaded model on one image",
)
async def detect_compare(
    file: ImageFile,
    detector: DetectorDep,
    settings: SettingsDep,
    include_visuals: IncludeVisuals = False,
) -> list[DetectionResult]:
    data = await _read_upload(file, settings)
    return detector.detect_all(data, include_visuals=include_visuals)
