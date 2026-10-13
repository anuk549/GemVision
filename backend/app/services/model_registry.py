"""Loads and exposes the trained Keras defect models."""

from __future__ import annotations

import json
import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

import tensorflow as tf
from reusable_components.gradcam import (
    find_last_conv_layer,
    preprocess_for_model,
    resolve_base_model,
)

from app.core.config import Settings
from app.core.exceptions import ModelNotAvailableError, UnknownModelError
from app.domain.defects import DEFAULT_CLASS_NAMES

logger = logging.getLogger(__name__)

METADATA_FILENAME = "model_metadata.json"


@dataclass(frozen=True)
class ModelSpec:
    """Static description of a bundled model."""

    key: str
    name: str
    backbone: str
    filename: str


MODEL_SPECS: tuple[ModelSpec, ...] = (
    ModelSpec("efficientnet", "EfficientNetV2-S", "efficientnetv2-s", "sapphire_model.keras"),
    ModelSpec(
        "mobilenet",
        "MobileNetV2",
        "mobilenetv2_1.00_224",
        "sapphire_model_mobilenet.keras",
    ),
)


@dataclass
class LoadedModel:
    """A model ready for inference, with the pieces Grad-CAM needs."""

    spec: ModelSpec
    model: tf.keras.Model
    base_model: tf.keras.Model
    last_conv_layer: str
    preprocess_fn: Callable
    class_names: list[str] = field(default_factory=lambda: list(DEFAULT_CLASS_NAMES))
    image_size: tuple[int, int] = (224, 224)


class ModelRegistry:
    """Owns the loaded models and the class contract from ``model_metadata``."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.model_dir = Path(settings.model_dir)
        self.class_names: list[str] = list(DEFAULT_CLASS_NAMES)
        self.image_size: tuple[int, int] = settings.image_size
        self._models: dict[str, LoadedModel] = {}
        self._load_metadata()

    # -- loading ---------------------------------------------------------
    def load(self) -> None:
        """Load every model available on disk; missing files are skipped."""
        for spec in MODEL_SPECS:
            path = self.model_dir / spec.filename
            if not path.exists():
                logger.warning("Model file not found, skipping: %s", path)
                continue
            try:
                self._models[spec.key] = self._load_one(spec, path)
                logger.info("Loaded model '%s' from %s", spec.key, path.name)
            except Exception:  # noqa: BLE001 - one bad model must not stop the rest
                logger.exception("Failed to load model '%s'", spec.key)

    def _load_one(self, spec: ModelSpec, path: Path) -> LoadedModel:
        model = tf.keras.models.load_model(str(path))
        base_model = resolve_base_model(model)
        return LoadedModel(
            spec=spec,
            model=model,
            base_model=base_model,
            last_conv_layer=find_last_conv_layer(base_model),
            preprocess_fn=preprocess_for_model(base_model.name),
            class_names=list(self.class_names),
            image_size=self.image_size,
        )

    def _load_metadata(self) -> None:
        metadata_path = self.model_dir / METADATA_FILENAME
        if not metadata_path.exists():
            logger.warning("No model metadata at %s; using defaults", metadata_path)
            return
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.class_names = list(metadata.get("class_names", DEFAULT_CLASS_NAMES))
            size = metadata.get("image_size")
            if size and len(size) == 2:
                self.image_size = (int(size[0]), int(size[1]))
        except (OSError, ValueError, TypeError) as exc:
            logger.warning("Failed to read model metadata: %s", exc)

    # -- access ----------------------------------------------------------
    @property
    def loaded_count(self) -> int:
        return len(self._models)

    def available_keys(self) -> list[str]:
        return [spec.key for spec in MODEL_SPECS if spec.key in self._models]

    def resolve_key(self, key: str | None) -> str:
        """Resolve a user supplied key/alias to a loaded model key."""
        if not self._models:
            raise ModelNotAvailableError("No defect detection models are loaded")

        candidate = (key or self.settings.default_model).strip().lower()
        if candidate in {"", "default"}:
            candidate = self.settings.default_model

        aliases = {
            "efficientnet": "efficientnet",
            "efficientnetv2": "efficientnet",
            "efficientnetv2-s": "efficientnet",
            "mobilenet": "mobilenet",
            "mobilenetv2": "mobilenet",
        }
        resolved = aliases.get(candidate, candidate)

        if resolved not in self._models:
            available = ", ".join(self.available_keys())
            raise UnknownModelError(f"Unknown model '{key}'. Available: {available}")
        return resolved

    def get(self, key: str) -> LoadedModel:
        return self._models[key]

    def describe(self) -> list[dict[str, object]]:
        return [
            {
                "key": spec.key,
                "name": spec.name,
                "backbone": spec.backbone,
                "file": spec.filename,
                "loaded": spec.key in self._models,
                "class_names": list(self.class_names),
                "image_size": list(self.image_size),
            }
            for spec in MODEL_SPECS
        ]
