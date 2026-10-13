from fastapi import APIRouter
from ....core.config import settings
from ....services.runpod_client import runpod_client

router = APIRouter()


@router.get("/health")
@router.get("")
async def check_health():
    """Returns service health status and RunPod infrastructure readiness."""
    catalog_exists = (settings.GEMSTONES_DIR / "catalog.json").exists()
    models_dir_exists = settings.ML_MODELS_DIR.exists()

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "runpod": {
            "configured": runpod_client.is_configured(),
            "flux_endpoint": bool(settings.RUNPOD_FLUX_ENDPOINT_ID),
            "inpainting_endpoint": bool(settings.RUNPOD_INPAINTING_ENDPOINT_ID),
            "mock_fallback_enabled": settings.RUNPOD_MOCK_FALLBACK,
        },
        "assets": {
            "gemstones_catalog_available": catalog_exists,
            "pricing_models_directory_available": models_dir_exists,
        },
    }
