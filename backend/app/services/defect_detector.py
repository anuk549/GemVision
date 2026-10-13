"""Image -> defect detection result orchestration."""

from __future__ import annotations

import base64
import io

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError
from reusable_components.gradcam import make_gradcam_heatmap, overlay_heatmap
from reusable_components.image_preprocessing import preprocess_rgb_array

from app.core.exceptions import InvalidImageError
from app.domain.defects import DefectClass, profile_for
from app.schemas.defect import (
    BoundingBox,
    DefectInfo,
    DetectionResult,
    DetectionVisuals,
)
from app.services.model_registry import LoadedModel, ModelRegistry

_DEFECT_THRESHOLD = 0.5
_MIN_IMAGE_SIDE = 8


def _encode_png(rgb_uint8: np.ndarray) -> str:
    bgr = cv2.cvtColor(np.asarray(rgb_uint8, dtype=np.uint8), cv2.COLOR_RGB2BGR)
    ok, buffer = cv2.imencode(".png", bgr)
    if not ok:
        raise RuntimeError("Failed to encode image")
    encoded = base64.b64encode(buffer.tobytes()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def _heatmap_to_rgb(heatmap: np.ndarray) -> np.ndarray:
    heat = np.asarray(heatmap, dtype=np.float32)
    if heat.max() > 0:
        heat = heat / heat.max()
    heat_uint8 = np.uint8(np.clip(heat, 0, 1) * 255)
    colored = cv2.applyColorMap(heat_uint8, cv2.COLORMAP_JET)
    return cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)


class DefectDetector:
    """Runs classification + Grad-CAM against a registry of models."""

    def __init__(self, registry: ModelRegistry) -> None:
        self.registry = registry

    # -- public API ------------------------------------------------------
    def detect(
        self,
        image_bytes: bytes,
        model_key: str | None = None,
        include_visuals: bool = True,
    ) -> DetectionResult:
        loaded = self.registry.get(self.registry.resolve_key(model_key))
        rgb = self.decode_image(image_bytes)
        return self._run(loaded, rgb, include_visuals)

    def detect_all(
        self, image_bytes: bytes, include_visuals: bool = True
    ) -> list[DetectionResult]:
        rgb = self.decode_image(image_bytes)
        return [
            self._run(self.registry.get(key), rgb, include_visuals)
            for key in self.registry.available_keys()
        ]

    @staticmethod
    def decode_image(image_bytes: bytes) -> np.ndarray:
        """Decode raw bytes into an ``(H, W, 3)`` uint8 RGB array."""
        try:
            with Image.open(io.BytesIO(image_bytes)) as image:
                rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
        except (UnidentifiedImageError, OSError) as exc:
            raise InvalidImageError("Uploaded file is not a valid image") from exc
        if rgb.ndim != 3 or min(rgb.shape[:2]) < _MIN_IMAGE_SIDE:
            raise InvalidImageError("Image is too small to analyse")
        return rgb

    # -- internals -------------------------------------------------------
    def _run(
        self, loaded: LoadedModel, rgb: np.ndarray, include_visuals: bool
    ) -> DetectionResult:
        processed, gem_mask = preprocess_rgb_array(rgb, loaded.image_size)
        class_names = loaded.class_names

        batch = np.expand_dims(processed, axis=0).astype(np.float32)
        probabilities = loaded.model.predict(batch, verbose=0)[0]

        top_index = int(np.argmax(probabilities))
        top_class = (
            class_names[top_index] if top_index < len(class_names) else DefectClass.NORMAL.value
        )

        heatmap = make_gradcam_heatmap(
            batch,
            loaded.model,
            loaded.base_model,
            loaded.last_conv_layer,
            pred_index=top_index,
            preprocess_fn=loaded.preprocess_fn,
        )

        height, width = processed.shape[:2]
        heatmap = cv2.resize(heatmap, (width, height), interpolation=cv2.INTER_LINEAR)
        gem_binary = (gem_mask > 127).astype(np.float32)
        masked_heatmap = heatmap * gem_binary

        defect_pixels = masked_heatmap > _DEFECT_THRESHOLD
        profile = profile_for(top_class)
        visuals = (
            self._visuals(processed, gem_mask, masked_heatmap)
            if include_visuals
            else DetectionVisuals()
        )

        return DetectionResult(
            model_name=loaded.spec.name,
            backbone=loaded.spec.backbone,
            predicted_class=top_class,
            predicted_index=top_index,
            confidence=float(probabilities[top_index]),
            probabilities=self._probability_map(class_names, probabilities),
            defect=DefectInfo(
                name=profile.name,
                severity=profile.severity.value,
                description=profile.description,
                location=profile.location,
            ),
            gem_coverage_pct=round(float(gem_binary.mean()) * 100.0, 2),
            defect_coverage_pct=round(float(defect_pixels.mean()) * 100.0, 2),
            bounding_box=self._bounding_box(defect_pixels, width, height),
            visuals=visuals,
        )

    @staticmethod
    def _probability_map(
        class_names: list[str], probabilities: np.ndarray
    ) -> dict[str, float]:
        return {
            class_names[i] if i < len(class_names) else f"class_{i}": float(prob)
            for i, prob in enumerate(probabilities)
        }

    @staticmethod
    def _visuals(
        processed: np.ndarray, gem_mask: np.ndarray, masked_heatmap: np.ndarray
    ) -> DetectionVisuals:
        base_rgb = processed.astype(np.uint8)
        return DetectionVisuals(
            heatmap=_encode_png(_heatmap_to_rgb(masked_heatmap)),
            overlay=_encode_png(overlay_heatmap(base_rgb, masked_heatmap, mask=gem_mask)),
            gem_mask=_encode_png(np.dstack([gem_mask] * 3).astype(np.uint8)),
        )

    @staticmethod
    def _bounding_box(
        defect_pixels: np.ndarray, width: int, height: int
    ) -> BoundingBox | None:
        if not defect_pixels.any():
            return None
        ys, xs = np.where(defect_pixels)
        x_min, x_max = int(xs.min()), int(xs.max())
        y_min, y_max = int(ys.min()), int(ys.max())
        center_x = (x_min + x_max) // 2
        center_y = (y_min + y_max) // 2
        return BoundingBox(
            x_min=x_min,
            y_min=y_min,
            x_max=x_max,
            y_max=y_max,
            center_x=center_x,
            center_y=center_y,
            x_min_pct=round(x_min / width * 100, 2),
            y_min_pct=round(y_min / height * 100, 2),
            x_max_pct=round(x_max / width * 100, 2),
            y_max_pct=round(y_max / height * 100, 2),
            center_x_pct=round(center_x / width * 100, 2),
            center_y_pct=round(center_y / height * 100, 2),
        )
