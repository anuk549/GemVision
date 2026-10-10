"""Aggregates all v1 endpoint routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import defects, health

router = APIRouter()
router.include_router(health.router)
router.include_router(defects.router)
