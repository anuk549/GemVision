import json
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from ....core.config import settings
from ....schemas.gemstone import GemstoneAsset, TeamMemberGemstoneInput

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=List[GemstoneAsset])
async def list_gemstones():
    """
    Returns the collection of authentic loose gemstones available in the assets folder.
    Includes cut, carat, color, dimensions, and estimated market price.
    """
    catalog_path = settings.GEMSTONES_DIR / "catalog.json"
    if not catalog_path.exists():
        return []

    with open(catalog_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Attach endpoint relative image URL
    result = []
    for item in data:
        asset = GemstoneAsset(**item)
        asset.image_url = f"/api/v1/gemstones/{asset.id}/image"
        result.append(asset)
    return result


@router.get("/{gem_id}", response_model=GemstoneAsset)
async def get_gemstone(gem_id: str):
    """Retrieves metadata for a specific loose gemstone from assets."""
    catalog_path = settings.GEMSTONES_DIR / "catalog.json"
    if not catalog_path.exists():
        raise HTTPException(status_code=404, detail="Gemstone catalog not found")

    with open(catalog_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for item in data:
        if item.get("id") == gem_id or item.get("filename") == gem_id:
            asset = GemstoneAsset(**item)
            asset.image_url = f"/api/v1/gemstones/{asset.id}/image"
            return asset

    raise HTTPException(status_code=404, detail=f"Gemstone {gem_id} not found")


@router.get("/{gem_id}/image")
async def get_gemstone_image(gem_id: str):
    """Streams the loose gemstone image from the assets directory."""
    from fastapi.responses import FileResponse
    catalog_path = settings.GEMSTONES_DIR / "catalog.json"
    target_file = None

    if catalog_path.exists():
        with open(catalog_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            if item.get("id") == gem_id or item.get("filename") == gem_id:
                target_file = settings.GEMSTONES_DIR / item["filename"]
                break

    if not target_file or not target_file.exists():
        # Fallback check direct file name
        direct_file = settings.GEMSTONES_DIR / f"{gem_id}.png"
        if direct_file.exists():
            target_file = direct_file

    if not target_file or not target_file.exists():
        raise HTTPException(status_code=404, detail="Gemstone image not found on disk")

    return FileResponse(target_file, media_type="image/png")


@router.post("/from-team-member", response_model=TeamMemberGemstoneInput)
async def receive_team_member_gemstone_data(payload: TeamMemberGemstoneInput):
    """
    Ingests gemstone variables passed from other team member's component:
    - Gemstone weight (carat)
    - Color grade
    - Shape / Cut
    - Physical size (mm)
    - Pre-calculated loose gemstone valuation (LKR)
    """
    logger.info(
        f"Received gemstone parameters from team member: "
        f"{payload.gemstone_name} ({payload.gemstone_weight_ct} ct, {payload.gemstone_shape}, price: LKR {payload.gemstone_price})"
    )
    return payload
