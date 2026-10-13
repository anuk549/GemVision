import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "runpod" in data


def test_gemstones_catalog():
    response = client.get("/api/v1/gemstones")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 5
    first = items[0]
    assert "species" in first
    assert "carat" in first
    assert "predicted_price_lkr" in first


def test_team_member_gemstone_ingestion():
    payload = {
        "gemstone_name": "Blue Sapphire",
        "carat": 2.8,
        "color": "Royal Blue",
        "shape": "Cushion",
        "size": "8.5 x 7.0 mm",
        "price": 1050000.0,
    }
    response = client.post("/api/v1/gemstones/from-team-member", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert (data.get("carat") or data.get("gemstone_weight_ct")) == 2.8
    assert (data.get("price") or data.get("gemstone_price")) == 1050000.0


def test_price_estimate():
    payload = {
        "category": "Ring",
        "metal": "22KT Gold",
        "metal_weight_g": 5.0,
        "gemstone": "Blue Sapphire",
        "gemstone_weight_ct": 2.5,
        "setting_type": "Prong",
        "number_of_accent_stones": 8,
    }
    response = client.post("/api/v1/jewelry/price-estimate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "bom_breakdown" in data
    assert "valuation" in data
    assert data["valuation"]["p50_fair_market_price_lkr"] > 0


def test_generate_design_with_hybrid_pipeline():
    payload = {
        "prompt": "A modern 22KT gold ring with four prongs holding this blue sapphire",
        "aesthetic_style": "Modern",
        "pipeline_option": "hybrid",
        "category": "Ring",
        "metal": "22KT Gold",
        "metal_weight_g": 5.0,
        "gemstone": "Blue Sapphire",
        "gemstone_weight_ct": 2.5,
        "setting_type": "Prong",
        "gemstone_asset_id": "gem-bs-cushion-25",
        "team_member_gemstone": {
            "gemstone_name": "Blue Sapphire",
            "carat": 2.5,
            "color": "Royal Blue",
            "shape": "Cushion",
            "price": 945000.0,
        },
    }
    response = client.post("/api/v1/jewelry/generate-design", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["pipeline_used"] == "hybrid"
    assert data["image_base64"] is not None
    assert data["bom_breakdown"]["gemstone_cost_lkr"] == 945000
    assert data["audited_attributes"]["setting_type"] is not None
    assert data["valuation"]["p50_fair_market_price_lkr"] > 0
