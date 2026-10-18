"""Gem cutting pattern recommendation endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import Response

from app.api.deps import GemRecommenderDep, SettingsDep
from app.core.config import Settings
from app.core.exceptions import (
    ImageTooLargeError,
    InvalidImageError,
    UnsupportedMediaTypeError,
)
from app.schemas.gem import PatternRecommendation

router = APIRouter(prefix="/gem", tags=["gem"])

ImageFile = Annotated[UploadFile, File(description="Gemstone image (jpg/png/webp)")]


async def _read_upload(file: UploadFile, settings: Settings) -> bytes:
    if file.content_type and not file.content_type.startswith("image/"):
        raise UnsupportedMediaTypeError(f"Unsupported content type: {file.content_type}")
    data = await file.read()
    if not data:
        raise InvalidImageError("Uploaded file is empty")
    if len(data) > settings.max_upload_bytes:
        raise ImageTooLargeError(f"Image exceeds {settings.max_upload_mb} MB limit")
    return data


@router.post(
    "/recommend-pattern",
    response_model=PatternRecommendation,
    summary="Recommend a cutting pattern for a gem image",
)
async def recommend_pattern(
    file: ImageFile,
    recommender: GemRecommenderDep,
    settings: SettingsDep,
) -> PatternRecommendation:
    data = await _read_upload(file, settings)
    result = recommender.recommend(data)
    return PatternRecommendation(**result)


@router.get(
    "/pattern/{pattern_id}/render",
    summary="Render a 2D visualization of a cutting pattern",
)
def render_pattern(pattern_id: str, recommender: GemRecommenderDep) -> Response:
    content = recommender.render_pattern(pattern_id)
    return Response(content=content, media_type="image/png")
