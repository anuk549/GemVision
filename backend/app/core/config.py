"""Application settings.

Values are read from environment variables prefixed with ``GEMVISION_`` (and
from a local ``.env`` file when present). See ``.env.example`` for the full set.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


def _project_root(start: Path = BACKEND_DIR) -> Path:
    for candidate in (start, *start.parents):
        if (candidate / ".git").exists():
            return candidate
    return start.parent


def _default_model_dir() -> Path:
    return _project_root() / "ml" / "defect-detection" / "keras"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="GEMVISION_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "GemVision Defect Detection API"
    version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    debug: bool = False

    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False

    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=lambda: ["*"])

    model_dir: Path = Field(default_factory=_default_model_dir)
    default_model: str = "efficientnet"
    image_size: tuple[int, int] = (224, 224)
    max_upload_mb: int = 10

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Return the cached application settings."""
    return Settings()
