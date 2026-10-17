"""Service for predicting Sapphire price per carat and total price range."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.core.config import Settings
from app.schemas.pricing import SapphirePricingRequest, SapphirePricingResponse

logger = logging.getLogger(__name__)


class SapphirePricer:
    """Loads sapphire_model_v1.joblib and computes low/mid/high price ranges."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.project_root = Path(settings.model_dir).parents[2]
        self.model_path = self._resolve_model_path()
        self.bundle: dict[str, Any] | None = None
        self._load_model()

    def _resolve_model_path(self) -> Path:
        candidates = [
            self.project_root / "ml-research" / "saved_models" / "sapphire_model_v1.joblib",
            Path("ml-research/saved_models/sapphire_model_v1.joblib").resolve(),
            Path("../ml-research/saved_models/sapphire_model_v1.joblib").resolve(),
        ]
        for p in candidates:
            if p.exists():
                return p
        return candidates[0]

    def _load_model(self) -> None:
        if not self.model_path.exists():
            logger.warning("Sapphire price model not found at %s", self.model_path)
            return

        try:
            logger.info("Loading sapphire price model from %s", self.model_path)
            self.bundle = joblib.load(str(self.model_path))
            logger.info(
                "Sapphire price model loaded successfully with models: %s",
                list(self.bundle.get("models", {}).keys()),
            )
        except Exception as exc:
            logger.error("Failed to load sapphire price model from %s: %s", self.model_path, exc)
            self.bundle = None

    def _prepare(self, df: pd.DataFrame) -> pd.DataFrame:
        if self.bundle is None:
            raise RuntimeError("Model bundle is not loaded")
        num_cols = self.bundle["num"]
        cat_cols = self.bundle["cat"]
        d = df.copy()
        d["HueGroup"] = d["Color"].map(self.bundle["hue"]).fillna("blue_other")
        d["Shape"] = d["Shape"].replace({"Asscher - Octagon": "Asscher"})
        d["Origin"] = d["Origin"].where(d["Origin"].isin(self.bundle["keep_origin"]), "Other")
        d["Cut"] = d["Cut"].where(d["Cut"].isin(self.bundle["cut_keep"]), "Other")
        for c in cat_cols:
            if c in self.bundle.get("cat_levels", {}):
                valid_levels = self.bundle["cat_levels"][c]
                d[c] = d[c].where(d[c].isin(valid_levels), valid_levels[0])
        return d[num_cols + cat_cols]

    def _inputs(self, name: str, X: pd.DataFrame) -> Any:
        if self.bundle is None:
            raise RuntimeError("Model bundle is not loaded")
        cat_cols = self.bundle["cat"]
        if name == "xgb":
            Z = pd.get_dummies(X, columns=[c for c in cat_cols if c != "HueGroup"], drop_first=False)
            if "HueGroup" in Z.columns:
                Z = Z.drop(columns="HueGroup")
            return Z.reindex(columns=self.bundle["onehot_cols"], fill_value=0).astype(float)
        if name == "lgb":
            Z = X.copy()
            for c in cat_cols:
                Z[c] = pd.Categorical(Z[c], categories=self.bundle["cat_levels"][c])
            return Z
        return X  # CatBoost reads the categorical text columns directly

    def predict(self, req: SapphirePricingRequest) -> SapphirePricingResponse:
        if self.bundle is None:
            self._load_model()
            if self.bundle is None:
                raise RuntimeError("Sapphire price prediction model is not available.")

        factors = self.bundle.get("factor", {})
        default_cov = self.bundle.get("default_coverage", 0.5)
        coverage = req.coverage if req.coverage in factors else default_cov

        raw_dict = {
            "Weight": req.weight,
            "Length": req.length,
            "Width": req.width,
            "Height": req.height,
            "Color": req.color,
            "Intensity": req.intensity,
            "Clarity": req.clarity,
            "Shape": req.shape,
            "Cut": req.cut,
            "Treatment": req.treatment,
            "Origin": req.origin,
        }
        df = pd.DataFrame([raw_dict])
        X = self._prepare(df)

        preds = [m.predict(self._inputs(n, X)) for n, m in self.bundle["models"].items()]
        mid = float(np.exp(np.mean(preds, axis=0))[0])
        factor = float(factors[coverage])

        price_per_carat_low = round(mid / factor, 0)
        price_per_carat_mid = round(mid, 0)
        price_per_carat_high = round(mid * factor, 0)

        total_price_low = round(price_per_carat_low * req.weight, 0)
        total_price_mid = round(price_per_carat_mid * req.weight, 0)
        total_price_high = round(price_per_carat_high * req.weight, 0)

        return SapphirePricingResponse(
            weight=req.weight,
            price_per_carat_low=price_per_carat_low,
            price_per_carat_mid=price_per_carat_mid,
            price_per_carat_high=price_per_carat_high,
            total_price_low=total_price_low,
            total_price_mid=total_price_mid,
            total_price_high=total_price_high,
            currency="USD",
            coverage=coverage,
            formatted_price_per_carat_range=f"${price_per_carat_low:,.0f} - ${price_per_carat_high:,.0f} / ct",
            formatted_total_price_range=f"${total_price_low:,.0f} - ${total_price_high:,.0f}",
        )
