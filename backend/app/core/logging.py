"""Logging configuration."""

from __future__ import annotations

import logging

from app.core.config import Settings

_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FORMAT = "%H:%M:%S"


def configure_logging(settings: Settings) -> None:
    """Configure root logging once, based on the debug flag."""
    logging.basicConfig(
        level=logging.DEBUG if settings.debug else logging.INFO,
        format=_LOG_FORMAT,
        datefmt=_DATE_FORMAT,
        force=True,
    )
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
