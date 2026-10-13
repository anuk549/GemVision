"""FastAPI application factory and entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.deps import RegistryDep, SettingsDep
from app.api.v1.router import router as v1_router
from app.core.config import Settings, get_settings
from app.core.exceptions import GemVisionError
from app.core.logging import configure_logging
from app.schemas.common import ErrorDetail, ErrorResponse
from app.services.defect_detector import DefectDetector
from app.services.model_registry import MODEL_SPECS, ModelRegistry

logger = logging.getLogger("gemvision")

DESCRIPTION = (
    "Classifies sapphire gemstone defects (crack, inclusion, normal) with the "
    "trained Keras models and returns Grad-CAM defect localization."
)


def _lifespan(settings: Settings):
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        logger.info("Loading models from %s", settings.model_dir)
        registry = ModelRegistry(settings)
        registry.load()

        app.state.settings = settings
        app.state.registry = registry
        app.state.detector = DefectDetector(registry)

        logger.info("Loaded %d/%d model(s)", registry.loaded_count, len(MODEL_SPECS))
        yield
        logger.info("Shutting down %s", settings.app_name)

    return lifespan


def _error_response(status_code: int, error_type: str, message: str) -> JSONResponse:
    payload = ErrorResponse(error=ErrorDetail(type=error_type, message=message))
    return JSONResponse(status_code=status_code, content=payload.model_dump())


def _register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(GemVisionError)
    async def _handle_domain(_: Request, exc: GemVisionError) -> JSONResponse:
        return _error_response(exc.status_code, exc.error_type, exc.message)

    @app.exception_handler(RequestValidationError)
    async def _handle_validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        errors = exc.errors()
        message = errors[0].get("msg", "Request validation failed") if errors else "Invalid request"
        return _error_response(422, "validation_error", message)


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the FastAPI application (factory allows test-time overrides)."""
    settings = settings or get_settings()
    configure_logging(settings)

    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description=DESCRIPTION,
        lifespan=_lifespan(settings),
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    _register_exception_handlers(app)
    app.include_router(v1_router, prefix=settings.api_prefix)

    @app.get("/", tags=["root"], summary="Service metadata")
    def root(registry: RegistryDep, settings: SettingsDep) -> dict[str, object]:
        return {
            "service": settings.app_name,
            "version": settings.version,
            "docs": "/docs",
            "api_prefix": settings.api_prefix,
            "models_loaded": registry.loaded_count,
        }

    return app


app = create_app()
