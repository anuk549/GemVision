"""Gemstone identification API endpoints."""

from __future__ import annotations

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from app.api.deps import SettingsDep
from app.schemas.gemstone import GemIdentificationResult
from app.services.gem_classifier import GemClassifier

router = APIRouter(prefix="/gemstones", tags=["gemstones"])


def get_gem_classifier(request: Request) -> GemClassifier:
    if not hasattr(request.app.state, "gem_classifier"):
        request.app.state.gem_classifier = GemClassifier(request.app.state.settings)
    return request.app.state.gem_classifier


GemClassifierDep = Annotated[GemClassifier, Depends(get_gem_classifier)]


@router.post(
    "/identify",
    response_model=GemIdentificationResult,
    summary="Identify gemstone type from photo",
    description="Classifies gemstone using the native Keras model and saves input to backend assets.",
)
async def identify_gemstone(
    file: Annotated[UploadFile, File(description="Gemstone image file")],
    classifier: GemClassifierDep,
    settings: SettingsDep,
) -> GemIdentificationResult:
    content_type = file.content_type or ""
    if content_type and not content_type.startswith("image/") and content_type != "application/octet-stream":
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image exceeds the {settings.max_upload_mb} MB limit.",
        )

    try:
        return classifier.identify(image_bytes, filename=file.filename or "gemstone.jpg")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Identification error: {exc}") from exc


@router.get(
    "/history",
    summary="Get recent gemstone identifications",
    description="Returns all previous identification records saved in backend assets.",
)
def get_identification_history(classifier: GemClassifierDep) -> list[dict]:
    return classifier.get_history()


@router.get(
    "/images/{folder_id}/{filename}",
    summary="Get saved gemstone image",
    description="Serves an uploaded gemstone image from backend assets.",
)
def get_saved_image(folder_id: str, filename: str, classifier: GemClassifierDep) -> FileResponse:
    target_path = classifier.assets_dir / folder_id / filename
    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(str(target_path))
