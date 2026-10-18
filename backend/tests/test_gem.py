from __future__ import annotations

from app.api.deps import get_gem_recommender
from fastapi.testclient import TestClient


def _files(data: bytes = b"fake-image-bytes", name: str = "stone.png", ctype: str = "image/png"):
    return {"file": (name, data, ctype)}


def test_gem_render_available_without_model(client_no_models):
    response = client_no_models.get("/api/gem/pattern/glass-shard-vortex/render")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/png")


def test_gem_render_unknown_pattern_returns_404(client_no_models):
    response = client_no_models.get("/api/gem/pattern/does-not-exist/render")
    assert response.status_code == 404
    assert response.json()["error"]["type"] == "pattern_not_found"


def test_gem_recommend_requires_model(client_no_models):
    response = client_no_models.post("/api/gem/recommend-pattern", files=_files())
    assert response.status_code == 503
    assert response.json()["error"]["type"] == "model_unavailable"


def test_gem_recommend_rejects_non_image(client_no_models):
    response = client_no_models.post(
        "/api/gem/recommend-pattern", files=_files(b"hi", "notes.txt", "text/plain")
    )
    assert response.status_code == 415


def test_gem_recommend_success_with_stubbed_recommender(app_no_models, sample_result):
    class StubRecommender:
        def recommend(self, data):
            return {
                "gem_type": "sapphire",
                "state": "rough",
                "confidence": 0.9,
                "recommended_pattern": {
                    "id": "glass-shard-vortex",
                    "name": "Glass Shard Vortex",
                    "designer": "Arya Akhavan",
                    "facets": 67,
                    "index": 96,
                    "angles": {"crown": 34.0},
                },
            }

        def render_pattern(self, pattern_id):
            return b"png-bytes"

    app_no_models.dependency_overrides[get_gem_recommender] = lambda: StubRecommender()
    with TestClient(app_no_models) as client:
        response = client.post("/api/gem/recommend-pattern", files=_files())
    assert response.status_code == 200
    body = response.json()
    assert body["gem_type"] == "sapphire"
    assert body["recommended_pattern"]["id"] == "glass-shard-vortex"
