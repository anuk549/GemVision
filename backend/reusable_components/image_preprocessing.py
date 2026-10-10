"""Shared image preprocessing for sapphire defect detection.

Pipeline (kept identical between training and inference):

1. bilateral denoise to remove sensor noise while keeping defect edges,
2. HSV gemstone crop so the network always sees the stone close-up,
3. resize to a fixed square the backbone expects (224x224).

``preprocess_rgb_array`` returns ``(processed_rgb, gem_mask)`` where
``processed_rgb`` is float32 in the ``[0, 255]`` range (the same range the Keras
backbones' ``preprocess_input`` expects) and ``gem_mask`` is a uint8 ``0/255``
mask aligned to the processed image.
"""

from __future__ import annotations

import cv2
import numpy as np

from reusable_components.gem_mask import detect_gem_mask, mask_bounding_box

DEFAULT_IMAGE_SIZE: tuple[int, int] = (224, 224)

_BILATERAL_D = 7
_BILATERAL_SIGMA_COLOR = 50
_BILATERAL_SIGMA_SPACE = 50

_CROP_MARGIN = 0.05


def _as_uint8(image: np.ndarray) -> np.ndarray:
    if image.dtype == np.uint8:
        return image
    return np.clip(image, 0, 255).astype(np.uint8)


def _bilateral_denoise(img_bgr: np.ndarray) -> np.ndarray:
    return cv2.bilateralFilter(
        img_bgr,
        d=_BILATERAL_D,
        sigmaColor=_BILATERAL_SIGMA_COLOR,
        sigmaSpace=_BILATERAL_SIGMA_SPACE,
    )


def crop_to_gem(
    img_bgr: np.ndarray, mask: np.ndarray, margin: float = _CROP_MARGIN
) -> tuple[np.ndarray, np.ndarray]:
    """Crop ``img_bgr`` (and ``mask``) to the gem bounding box plus a margin."""
    box = mask_bounding_box(mask)
    if box is None:
        return img_bgr, mask

    x_min, y_min, x_max, y_max = box
    h, w = img_bgr.shape[:2]
    pad_x = max(1, int((x_max - x_min) * margin))
    pad_y = max(1, int((y_max - y_min) * margin))

    x_min = max(0, x_min - pad_x)
    y_min = max(0, y_min - pad_y)
    x_max = min(w, x_max + pad_x)
    y_max = min(h, y_max + pad_y)

    return img_bgr[y_min:y_max, x_min:x_max], mask[y_min:y_max, x_min:x_max]


def preprocess_rgb_array(
    rgb_array: np.ndarray,
    image_size: tuple[int, int] = DEFAULT_IMAGE_SIZE,
) -> tuple[np.ndarray, np.ndarray]:
    """Preprocess a single RGB image.

    Args:
        rgb_array: ``(H, W, 3)`` RGB image, uint8 or float in ``[0, 255]``.
        image_size: output ``(height, width)``.

    Returns:
        ``(processed_rgb, gem_mask)`` where ``processed_rgb`` is float32
        ``(H, W, 3)`` in ``[0, 255]`` and ``gem_mask`` is uint8 ``(H, W)``.
    """
    if rgb_array.ndim != 3 or rgb_array.shape[2] != 3:
        raise ValueError(f"Expected an (H, W, 3) RGB image, got {rgb_array.shape}")

    rgb_uint8 = _as_uint8(rgb_array)
    img_bgr = cv2.cvtColor(rgb_uint8, cv2.COLOR_RGB2BGR)

    denoised = _bilateral_denoise(img_bgr)
    mask = detect_gem_mask(denoised)

    cropped_bgr, cropped_mask = crop_to_gem(denoised, mask)

    resized_bgr = cv2.resize(cropped_bgr, image_size, interpolation=cv2.INTER_AREA)
    resized_mask = cv2.resize(cropped_mask, image_size, interpolation=cv2.INTER_NEAREST)

    processed_rgb = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    return processed_rgb, resized_mask
