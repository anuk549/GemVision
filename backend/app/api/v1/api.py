from fastapi import APIRouter
from .endpoints import jewelry, gemstones, health, defects

api_router = APIRouter()

api_router.include_router(jewelry.router, prefix="/jewelry", tags=["Jewelry Design & Valuation"])
api_router.include_router(gemstones.router, prefix="/gemstones", tags=["Loose Gemstone Catalog & Team Integration"])
api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(defects.router, prefix="/defects", tags=["Defect Detection"])
