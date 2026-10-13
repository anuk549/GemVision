import base64
import io
import os
from pathlib import Path
from typing import Tuple, Optional, Union
from PIL import Image, ImageOps, ImageFilter
import numpy as np


def pil_to_base64(image: Image.Image, format: str = "PNG") -> str:
    buffered = io.BytesIO()
    image.save(buffered, format=format)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def base64_to_pil(b64_string: str) -> Image.Image:
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    image_bytes = base64.b64decode(b64_string)
    return Image.open(io.BytesIO(image_bytes)).convert("RGBA")


def load_gemstone_from_assets(filename_or_id: str, assets_dir: Path) -> Optional[Image.Image]:
    """Loads a gemstone image from assets directory by filename or catalog ID."""
    candidate_paths = [
        assets_dir / filename_or_id,
        assets_dir / f"{filename_or_id}.png",
        assets_dir / f"{filename_or_id}.jpg",
    ]
    for path in candidate_paths:
        if path.exists():
            return Image.open(path).convert("RGBA")
    
    # Try searching catalog
    catalog_path = assets_dir / "catalog.json"
    if catalog_path.exists():
        import json
        with open(catalog_path, "r", encoding="utf-8") as f:
            catalog = json.load(f)
        for item in catalog:
            if item.get("id") == filename_or_id or item.get("filename") == filename_or_id:
                target = assets_dir / item["filename"]
                if target.exists():
                    return Image.open(target).convert("RGBA")
    return None


def segment_loose_gemstone(image: Image.Image) -> Image.Image:
    """
    Cuts out the loose gemstone from its background.
    Uses rembg if installed; otherwise performs robust alpha/contour segmentation.
    """
    try:
        import rembg
        return rembg.remove(image)
    except Exception:
        # Fallback: Intelligent alpha & luminance background removal
        rgba = image.convert("RGBA")
        np_img = np.array(rgba)

        # Check if already has transparent background
        alpha = np_img[:, :, 3]
        if np.any(alpha < 250):
            return rgba

        # Extract by contrast against standard studio white / black background
        rgb = np_img[:, :, :3]
        luminance = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]

        # Detect if background is bright white or pure black
        corner_pixels = [luminance[0, 0], luminance[0, -1], luminance[-1, 0], luminance[-1, -1]]
        avg_corner = np.mean(corner_pixels)

        if avg_corner > 220:  # White studio background
            mask = luminance < 235
        elif avg_corner < 35:  # Black background
            mask = luminance > 30
        else:
            mask = np.ones_like(luminance, dtype=bool)

        new_alpha = np.where(mask, 255, 0).astype(np.uint8)
        np_img[:, :, 3] = new_alpha
        cutout = Image.fromarray(np_img)

        # Smooth mask edges
        alpha_channel = cutout.split()[3].filter(ImageFilter.GaussianBlur(radius=1))
        cutout.putalpha(alpha_channel)
        return cutout


def stage_gemstone_on_canvas(
    gem_image: Image.Image,
    canvas_size: int = 1024,
    gem_scale_ratio: float = 0.38,
    prong_overlap_margin: int = 14,
) -> Tuple[Image.Image, Image.Image, Tuple[int, int, int, int]]:
    """
    Step 1 & Step 2 of the Production Pipeline:
    - Centers loose stone on target 1024x1024 canvas.
    - Scales stone proportionally to realistic jewelry centerpiece size.
    - Generates binary inpainting mask:
        0 (Black) = 100% Protected original gemstone pixels.
        255 (White) = Inpaint area (metal band, prongs, halo, setting, background).
        Prong overlap margin allows prongs to naturally overlap edges and cast shadows.
    """
    gem = segment_loose_gemstone(gem_image)

    # Get non-zero bounding box of stone
    bbox = gem.getbbox()
    if bbox:
        gem = gem.crop(bbox)

    # Scale stone proportionally
    target_gem_dim = int(canvas_size * gem_scale_ratio)
    gem.thumbnail((target_gem_dim, target_gem_dim), Image.Resampling.LANCZOS)
    gw, gh = gem.size

    # Position stone at center of 1024x1024 canvas
    cx = (canvas_size - gw) // 2
    cy = (canvas_size - gh) // 2

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    canvas.paste(gem, (cx, cy), mask=gem)

    # Generate inpainting mask
    # All background is 255 (generate), stone area is 0 (protected)
    stone_alpha = canvas.split()[3]
    
    # Erode the stone alpha slightly by prong_overlap_margin to allow prongs to overlap edges
    if prong_overlap_margin > 0:
        kernel_size = max(3, prong_overlap_margin // 2 * 2 + 1)
        eroded_stone = stone_alpha.filter(ImageFilter.MinFilter(size=kernel_size))
    else:
        eroded_stone = stone_alpha

    # Invert so 255 = inpaint band/setting, 0 = protect stone
    inpainting_mask = ImageOps.invert(eroded_stone.convert("L"))

    bounding_box = (cx, cy, cx + gw, cy + gh)
    return canvas, inpainting_mask, bounding_box
