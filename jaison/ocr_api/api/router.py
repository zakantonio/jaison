"""
OCR API router
"""
from fastapi import APIRouter
from jaison.ocr_api.api.endpoints import router as ocr_router

# Create main router
router = APIRouter()

# Include OCR router
router.include_router(ocr_router)

# Add additional routers here if needed
