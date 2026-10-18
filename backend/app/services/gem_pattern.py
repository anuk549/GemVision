"""Gem image -> cutting pattern recommendation and 2D pattern rendering."""

from __future__ import annotations

import io
import json
import logging
import math

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from PIL import Image, UnidentifiedImageError

from app.core.config import Settings
from app.core.exceptions import InvalidImageError, ModelNotAvailableError, PatternNotFoundError
from app.schemas.gem import CuttingPattern

logger = logging.getLogger(__name__)

_MIN_IMAGE_SIDE = 8


class GemPatternRecommender:
    """Loads the gem pattern classifier and renders pattern diagrams."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.model: tf.keras.Model | None = None
        self.class_names: list[str] = []
        self.image_size: tuple[int, int] = settings.image_size
        self.patterns: list[dict] = self._load_patterns()
        self._load_labels()

    # -- loading ---------------------------------------------------------
    def load(self) -> None:
        path = self.settings.gem_model_path
        if not path.exists():
            logger.warning("Gem pattern model not found, skipping: %s", path)
            return
        try:
            self.model = tf.keras.models.load_model(str(path))
            logger.info("Loaded gem pattern model from %s", path.name)
        except Exception:  # noqa: BLE001 - keep service usable without the model
            logger.exception("Failed to load gem pattern model")

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    def _load_patterns(self) -> list[dict]:
        path = self.settings.pattern_config_path
        if not path.exists():
            logger.warning("Pattern config not found: %s", path)
            return []
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return list(data.get("patterns", []))
        except (OSError, ValueError, TypeError) as exc:
            logger.warning("Failed to read pattern config: %s", exc)
            return []

    def _load_labels(self) -> None:
        path = self.settings.gem_labels_path
        if not path.exists():
            logger.warning("Gem pattern labels not found: %s", path)
            return
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            names = data.get("class_names")
            if isinstance(names, list) and names and isinstance(names[0], dict):
                self.class_names = [str(item.get("name", item)) for item in names]
            elif isinstance(names, list):
                self.class_names = [str(name) for name in names]
            size = data.get("image_size")
            if size and len(size) == 2:
                self.image_size = (int(size[0]), int(size[1]))
        except (OSError, ValueError, TypeError) as exc:
            logger.warning("Failed to read gem pattern labels: %s", exc)

    # -- inference -------------------------------------------------------
    def recommend(self, image_bytes: bytes) -> dict:
        if self.model is None:
            raise ModelNotAvailableError("Gem pattern model is not loaded")
        if not self.class_names:
            raise ModelNotAvailableError("Gem pattern labels are not loaded")

        rgb = self._decode_image(image_bytes)
        resized = np.asarray(
            Image.fromarray(rgb).resize(self.image_size[::-1], Image.BILINEAR), dtype=np.float32
        )
        batch = np.expand_dims(resized, axis=0)

        probabilities = self.model.predict(batch, verbose=0)[0]
        top_index = int(np.argmax(probabilities))
        label = (
            self.class_names[top_index]
            if top_index < len(self.class_names)
            else self.class_names[0]
        )
        gem_type, state = self._split_label(label)

        pattern = self._default_pattern()
        return {
            "gem_type": gem_type,
            "state": state,
            "confidence": float(probabilities[top_index]),
            "recommended_pattern": self._pattern_to_schema(pattern),
        }

    def _decode_image(self, image_bytes: bytes) -> np.ndarray:
        try:
            with Image.open(io.BytesIO(image_bytes)) as image:
                rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
        except (UnidentifiedImageError, OSError) as exc:
            raise InvalidImageError("Uploaded file is not a valid image") from exc
        if rgb.ndim != 3 or min(rgb.shape[:2]) < _MIN_IMAGE_SIDE:
            raise InvalidImageError("Image is too small to analyse")
        return rgb

    @staticmethod
    def _split_label(label: str) -> tuple[str, str]:
        if "__" in label:
            state, gem_type = label.split("__", 1)
            return gem_type, state
        if label.endswith("_rough"):
            return label[: -len("_rough")], "rough"
        if label.endswith("_cut"):
            return label[: -len("_cut")], "cut"
        if label.endswith("_faceted"):
            return label[: -len("_faceted")], "cut"
        return label, "unknown"

    def _default_pattern(self) -> dict:
        if not self.patterns:
            raise PatternNotFoundError("No cutting patterns are configured")
        return self.patterns[0]

    def get_pattern(self, pattern_id: str) -> dict:
        for pattern in self.patterns:
            if pattern.get("id") == pattern_id:
                return pattern
        raise PatternNotFoundError(f"Unknown pattern: {pattern_id}")

    @staticmethod
    def _pattern_to_schema(pattern: dict) -> CuttingPattern:
        return CuttingPattern(
            id=str(pattern["id"]),
            name=str(pattern["name"]),
            designer=str(pattern["designer"]),
            facets=int(pattern["facets"]),
            index=int(pattern["index"]),
            angles=dict(pattern.get("angles", {})),
        )

    # -- rendering -------------------------------------------------------
    def render_pattern(self, pattern_id: str) -> bytes:
        pattern = self.get_pattern(pattern_id)
        symmetry = int(pattern.get("symmetry", 6))
        facets = int(pattern.get("facets", 0))
        index = int(pattern.get("index", 0))
        name = str(pattern.get("name", pattern_id))
        designer = str(pattern.get("designer", ""))

        fig, axes = plt.subplots(1, 2, figsize=(10, 5))
        for ax, title in zip(axes, ("Top view", "Pavilion view"), strict=False):
            ax.set_aspect("equal")
            ax.set_xlim(-1.25, 1.25)
            ax.set_ylim(-1.25, 1.25)
            ax.axis("off")
            ax.set_title(title, fontsize=11)

        self._draw_top_view(axes[0], symmetry)
        self._draw_pavilion_view(axes[1], symmetry)

        fig.suptitle(
            f"{name} - {designer}\n{facets} facets | {index} index | {symmetry}-fold symmetry",
            fontsize=12,
        )
        fig.tight_layout()

        buffer = io.BytesIO()
        fig.savefig(buffer, format="png", dpi=150)
        plt.close(fig)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def _draw_top_view(ax, symmetry: int) -> None:
        circle = plt.Circle((0, 0), 1.0, fill=False, linewidth=1.5, color="#222222")
        ax.add_patch(circle)
        for i in range(symmetry):
            angle = 2 * math.pi * i / symmetry
            x = math.cos(angle)
            y = math.sin(angle)
            ax.plot([0, x], [0, y], color="#444444", linewidth=1.0)
            ax.plot([0.55 * x, x], [0.55 * y, y], color="#888888", linewidth=0.7)

        # Inner facet ring.
        for i in range(symmetry):
            a0 = 2 * math.pi * i / symmetry
            a1 = 2 * math.pi * (i + 0.5) / symmetry
            ax.plot(
                [0.55 * math.cos(a0), 0.55 * math.cos(a1)],
                [0.55 * math.sin(a0), 0.55 * math.sin(a1)],
                color="#1f77b4",
                linewidth=1.0,
            )

    @staticmethod
    def _draw_pavilion_view(ax, symmetry: int) -> None:
        # Simple pavilion silhouette: inverted cone with keel line.
        for i in range(symmetry):
            angle = 2 * math.pi * i / symmetry
            x = math.cos(angle)
            y = math.sin(angle)
            ax.plot([x, 0], [y, -1.0], color="#444444", linewidth=1.0)
        ax.plot([0, 0], [1.0, -1.0], color="#1f77b4", linewidth=1.2)
        keel = plt.Circle((0, -1.0), 0.05, color="#1f77b4")
        ax.add_patch(keel)
