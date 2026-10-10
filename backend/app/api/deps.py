"""Reusable FastAPI dependencies backed by ``app.state``."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request

from app.core.config import Settings
from app.services.defect_detector import DefectDetector
from app.services.model_registry import ModelRegistry


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_registry(request: Request) -> ModelRegistry:
    return request.app.state.registry


def get_detector(request: Request) -> DefectDetector:
    return request.app.state.detector


SettingsDep = Annotated[Settings, Depends(get_settings)]
RegistryDep = Annotated[ModelRegistry, Depends(get_registry)]
DetectorDep = Annotated[DefectDetector, Depends(get_detector)]
