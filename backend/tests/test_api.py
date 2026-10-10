from __future__ import annotations

from app.api.deps import get_detector
from fastapi import FastAPI
from fastapi.testclient import TestClient


def _files(data: bytes = b"fake-image-bytes", name: str = "stone.png", ctype: str = "image/png"):
    return {"file": (name, data, ctype)}


def test_root(client_no_models):
    response = client_no_models.get("/")
    assert response.status_code == 200
    assert response.json()["models_loaded"] == 0


def test_health_degraded_without_models(client_no_models):
    response = client_no_models.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "degraded"
    assert body["vision"]["models_loaded"] == 0
    assert body["vision"]["models_total"] == 2


def test_ready_returns_503_without_models(client_no_models):
    response = client_no_models.get("/api/v1/ready")
    assert response.status_code == 503
    assert response.json()["error"]["type"] == "model_unavailable"


def test_models_lists_specs(client_no_models):
    response = client_no_models.get("/api/v1/defects/models")
    assert response.status_code == 200
    models = response.json()["models"]
    assert {m["key"] for m in models} == {"efficientnet", "mobilenet"}
    assert all(m["loaded"] is False for m in models)


def test_detect_requires_models(client_no_models):
    response = client_no_models.post("/api/v1/defects/detect", files=_files())
    assert response.status_code == 503
    assert response.json()["error"]["type"] == "model_unavailable"


def test_detect_rejects_non_image(client_no_models):
    response = client_no_models.post(
        "/api/v1/defects/detect", files=_files(b"hi", "notes.txt", "text/plain")
    )
    assert response.status_code == 415
    assert response.json()["error"]["type"] == "unsupported_media_type"


def test_detect_rejects_empty_file(client_no_models):
    response = client_no_models.post("/api/v1/defects/detect", files=_files(b""))
    assert response.status_code == 400
    assert response.json()["error"]["type"] == "invalid_image"


def test_detect_success_with_stubbed_detector(app_no_models: FastAPI, sample_result):
    class StubDetector:
        def detect(self, data, model_key=None, include_visuals=True):
            return sample_result

        def detect_all(self, data, include_visuals=True):
            return [sample_result]

    app_no_models.dependency_overrides[get_detector] = lambda: StubDetector()
    with TestClient(app_no_models) as client:
        response = client.post("/api/v1/defects/detect", files=_files())
    assert response.status_code == 200
    assert response.json()["predicted_class"] == "crack"


def test_validation_error_envelope(app_no_models: FastAPI):
    with TestClient(app_no_models) as client:
        response = client.post("/api/v1/defects/detect")  # missing file
    assert response.status_code == 422
    assert response.json()["error"]["type"] == "validation_error"
