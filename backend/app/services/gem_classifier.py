"""Service for Gemstone Classification and Input Asset Management."""

from __future__ import annotations

import io
import json
import logging
import os
import time
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

import tensorflow as tf

from app.core.config import Settings
from app.schemas.gemstone import ClassProbability, GemIdentificationResult

logger = logging.getLogger(__name__)

GEM_CLASSES = [
    "blue_sapphire",
    "not_gemstone",
    "other_gemstone",
    "yellow_sapphire",
]

DISPLAY_NAMES = {
    "blue_sapphire": "Blue Sapphire",
    "yellow_sapphire": "Yellow Sapphire",
    "other_gemstone": "Other Gemstone",
    "not_gemstone": "Not a Gemstone",
}


class GemClassifier:
    """Loads the native Keras gemstone classifier model and handles input asset storage."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.project_root = Path(settings.model_dir).parents[2]  # Research root / GemVision root
        self.model_path = self._resolve_model_path()
        self.assets_dir = self._resolve_assets_dir()
        self.model: tf.keras.Model | None = None
        self._load_model()

    def _resolve_model_path(self) -> Path:
        # Check standard path in ml-research/saved_models
        #when model puts into production, change the path to the production path
        candidates = [
            self.project_root / "ml-research" / "saved_models" / "gemstone_classifier_model_best.keras",
            self.project_root / "ml-research" / "saved_models" / "gemstone_classifier_model.keras",
            Path("ml-research/saved_models/gemstone_classifier_model_best.keras"),
        ]
        for candidate in candidates:
            if candidate.exists():
                return candidate.resolve()
        # Fallback
        return candidates[0]

    def _resolve_assets_dir(self) -> Path:
        # Save in backend/assets/gem_inputs
        backend_dir = Path(__file__).resolve().parents[2]
        target = backend_dir / "assets" / "gem_inputs"
        target.mkdir(parents=True, exist_ok=True)
        return target

    def _load_model(self) -> None:
        logger.info("Loading native Gemstone Classifier from %s", self.model_path)
        if not self.model_path.exists():
            logger.error("Gemstone model file not found at %s", self.model_path)
            return
        try:
            self.model = tf.keras.models.load_model(str(self.model_path))
            logger.info("Successfully loaded Gemstone Classifier Keras model.")
        except Exception as exc:
            logger.exception("Failed to load Gemstone Classifier model: %s", exc)

    def get_next_input_id(self) -> str:
        """Determines the next sequential folder ID like i-001, i-002."""
        max_num = 0
        if self.assets_dir.exists():
            for entry in os.listdir(self.assets_dir):
                if entry.startswith("i-") and os.path.isdir(self.assets_dir / entry):
                    try:
                        num = int(entry.replace("i-", ""))
                        if num > max_num:
                            max_num = num
                    except ValueError:
                        pass
        return f"i-{max_num + 1:03d}"

    def get_history(self) -> list[dict[str, Any]]:
        """Reads all previously saved identification records from backend assets."""
        records = []
        if not self.assets_dir.exists():
            return records

        folders = sorted(
            [f for f in os.listdir(self.assets_dir) if f.startswith("i-") and os.path.isdir(self.assets_dir / f)],
            key=lambda x: int(x.replace("i-", "")) if x.replace("i-", "").isdigit() else 0,
            reverse=True,
        )

        for folder in folders:
            meta_path = self.assets_dir / folder / "metadata.json"
            if meta_path.exists():
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        records.append(data)
                except Exception:
                    continue
        return records

    def identify(self, image_bytes: bytes, filename: str = "gemstone.jpg") -> GemIdentificationResult:
        if self.model is None:
            self._load_model()
            if self.model is None:
                raise RuntimeError("Gemstone classifier model is not available.")

        # 1. Decode and preprocess image
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            raise ValueError(f"Invalid image format: {exc}") from exc

        # Resize to input shape (224, 224)
        resized_img = pil_img.resize((224, 224))
        img_array = np.array(resized_img, dtype=np.float32)
        # Note: MobileNetV2 preprocessing (rescaling -1 to 1) was baked into the Sequential model
        img_batch = np.expand_dims(img_array, axis=0)

        # 2. Run inference on native Keras model
        preds = self.model.predict(img_batch, verbose=0)[0]

        top_idx = int(np.argmax(preds))
        raw_class = GEM_CLASSES[top_idx]
        confidence = round(float(preds[top_idx] * 100), 2)
        gem_name = DISPLAY_NAMES.get(raw_class, raw_class)
        formatted_pred = f"Prediction: {raw_class} ({confidence:.2f}% confidence)"
        can_price = raw_class in ("blue_sapphire", "yellow_sapphire")

        # Probability distribution across all 4 classes
        probs = []
        for idx, cls_name in enumerate(GEM_CLASSES):
            probs.append(
                ClassProbability(
                    class_name=cls_name,
                    label=DISPLAY_NAMES.get(cls_name, cls_name),
                    confidence=round(float(preds[idx] * 100), 2),
                )
            )
        probs.sort(key=lambda x: x.confidence, reverse=True)

        # 3. Save into backend assets folder (backend/assets/gem_inputs/i-001/)
        input_id = self.get_next_input_id()
        folder_path = self.assets_dir / input_id
        folder_path.mkdir(parents=True, exist_ok=True)

        ext = Path(filename).suffix.lower() or ".jpg"
        image_save_name = f"gemstone{ext}"
        saved_image_path = folder_path / image_save_name

        try:
            with open(saved_image_path, "wb") as f:
                f.write(image_bytes)
        except Exception as exc:
            logger.error("Failed to save image into %s: %s", saved_image_path, exc)

        created_at = int(time.time() * 1000)
        rel_path = f"assets/gem_inputs/{input_id}/{image_save_name}"
        image_url = f"/api/v1/gemstones/images/{input_id}/{image_save_name}"

        result = GemIdentificationResult(
            id=input_id,
            folder=input_id,
            raw_class=raw_class,
            gem=gem_name,
            confidence=confidence,
            formatted_prediction=formatted_pred,
            can_proceed_to_pricing=can_price,
            probabilities=probs,
            saved_path=rel_path,
            image_url=image_url,
            created_at=created_at,
        )

        # Save metadata.json
        meta_path = folder_path / "metadata.json"
        try:
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(result.model_dump(by_alias=True), f, indent=2)
        except Exception as exc:
            logger.error("Failed to write metadata.json to %s: %s", meta_path, exc)

        return result
