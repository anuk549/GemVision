"""HSV based gemstone region detection.

The sapphire datasets contain blue and yellow stones on mostly neutral
backgrounds.  This module isolates the largest coloured blob so that the rest of
the pipeline (cropping, Grad-CAM masking, defect localization) can focus on the
gem itself.
"""

from __future__ import annotations

import cv2
import numpy as np

BLUE_LOWER = np.array([95, 30, 30])
BLUE_UPPER = np.array([135, 255, 255])

BLUE_DARK_LOWER = np.array([90, 20, 15])
BLUE_DARK_UPPER = np.array([140, 255, 200])

YELLOW_LOWER = np.array([15, 30, 30])
YELLOW_UPPER = np.array([40, 255, 255])

_KERNEL = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))


def detect_gem_mask(img_bgr: np.ndarray) -> np.ndarray:
    """Return a uint8 mask (0/255) covering the largest gemstone region.

    Falls back to a centred rectangle when no coloured blob is found so callers
    always receive a usable mask.
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    mask_blue = cv2.inRange(hsv, BLUE_LOWER, BLUE_UPPER)
    mask_dark = cv2.inRange(hsv, BLUE_DARK_LOWER, BLUE_DARK_UPPER)
    mask_yellow = cv2.inRange(hsv, YELLOW_LOWER, YELLOW_UPPER)

    mask = cv2.bitwise_or(cv2.bitwise_or(mask_blue, mask_dark), mask_yellow)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, _KERNEL, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, _KERNEL, iterations=1)

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if num_labels <= 1:
        h, w = mask.shape
        mask = np.zeros_like(mask)
        margin_h, margin_w = int(h * 0.2), int(w * 0.2)
        mask[margin_h : h - margin_h, margin_w : w - margin_w] = 255
        return mask

    largest_label = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    mask = np.where(labels == largest_label, 255, 0).astype(np.uint8)
    mask = cv2.dilate(mask, _KERNEL, iterations=2)
    return mask


def mask_bounding_box(
    mask: np.ndarray, threshold: float = 0.5
) -> tuple[int, int, int, int] | None:
    """Return ``(x_min, y_min, x_max, y_max)`` in pixels for a binary mask.

    ``None`` is returned when the mask has no pixel above ``threshold``.
    """
    binary = (np.asarray(mask, dtype=np.float32) / 255.0) > threshold
    if not binary.any():
        return None
    ys, xs = np.where(binary)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
