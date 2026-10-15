import os
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "GemVision - AI Jewelry Design & Dynamic Valuation API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # RunPod Serverless Infrastructure
    RUNPOD_API_KEY: str = ""
    RUNPOD_FLUX_ENDPOINT_ID: str = ""
    RUNPOD_INPAINTING_ENDPOINT_ID: str = ""
    RUNPOD_IPADAPTER_ENDPOINT_ID: str = ""
    RUNPOD_TIMEOUT_SECONDS: int = 120
    RUNPOD_POLL_INTERVAL_SECONDS: float = 2.5
    RUNPOD_MOCK_FALLBACK: bool = True

    # Black Forest Labs (BFL) FLUX API
    BFL_API_KEY: str = ""
    BFL_BASE_URL: str = "https://api.bfl.ml/v1"
    BFL_FLUX_MODEL: str = "flux-pro-1.1"
    BFL_INPAINTING_MODEL: str = "flux-pro-1.0-fill"
    BFL_POLL_INTERVAL_SECONDS: float = 2.0
    BFL_TIMEOUT_SECONDS: int = 120

    # Directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    ASSETS_DIR: Path = BASE_DIR / "assets"
    GEMSTONES_DIR: Path = ASSETS_DIR / "gemstones"
    DESIGNS_DIR: Path = ASSETS_DIR / "designs"
    ML_MODELS_DIR: Path = BASE_DIR.parent / "ml" / "jewelrydesigngeneration" / "artifacts" / "pricing_models"

    # Precious Metal Rates (LKR per gram, spot + Sea Street benchmark)
    DEFAULT_METAL_RATES: dict = {
        "24KT Gold": 36500.0,
        "22KT Gold": 33500.0,
        "18K Yellow Gold": 27500.0,
        "18K White Gold": 28200.0,
        "18K Rose Gold": 28000.0,
        "925 Sterling Silver": 950.0,
        "Platinum": 19500.0,
    }
    CASTING_WASTAGE_PCT: float = 0.10

    # Artisan Labor (Wadakuliya Matrix in LKR)
    LABOR_RATES: dict = {
        ("Ring", "Simple"): 3500.0,
        ("Ring", "Complex"): 4500.0,
        ("Necklace", "Simple"): 12500.0,
        ("Necklace", "Complex"): 14000.0,
        ("Earring", "Simple"): 4000.0,
        ("Earring", "Complex"): 5000.0,
        ("Bracelet", "Simple"): 6000.0,
        ("Bracelet", "Complex"): 8500.0,
    }
    STONE_SETTING_RATE_PER_STONE: float = 800.0
    POLISHING_RHODIUM_COST: float = 3500.0
    ACCENT_MELEE_RATE_LKR: float = 4200.0

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
