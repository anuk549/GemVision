from __future__ import annotations

import pytest
from app.core.config import Settings
from app.main import create_app
from app.schemas.defect import DefectInfo, DetectionResult, DetectionVisuals
from fastapi import FastAPI
from fastapi.testclient import TestClient


@pytest.fixture
def app_no_models(tmp_path) -> FastAPI:
    """App whose model directory is empty (starts in degraded mode)."""
    return create_app(Settings(model_dir=tmp_path))


@pytest.fixture
def client_no_models(app_no_models: FastAPI):
    with TestClient(app_no_models) as client:
        yield client


@pytest.fixture
def sample_result() -> DetectionResult:
    return DetectionResult(
        model_name="EfficientNetV2-S",
        backbone="efficientnetv2-s",
        predicted_class="crack",
        predicted_index=0,
        confidence=0.9,
        probabilities={"crack": 0.9, "inclusion": 0.05, "normal": 0.05},
        defect=DefectInfo(
            name="Crack", severity="HIGH", description="fracture", location="surface"
        ),
        gem_coverage_pct=40.0,
        defect_coverage_pct=5.0,
        bounding_box=None,
        visuals=DetectionVisuals(),
    )
