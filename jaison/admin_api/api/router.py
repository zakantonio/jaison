"""
Admin API router
"""
from fastapi import APIRouter
from jaison.admin_api.api.endpoints.auth import router as auth_router
from jaison.admin_api.api.endpoints.api_keys import router as api_keys_router
from jaison.admin_api.api.endpoints.validation import router as validation_router

# Create main router
router = APIRouter(prefix="/api/v1")

# Include routers
router.include_router(auth_router, prefix="/auth")
router.include_router(api_keys_router, prefix="/api-keys")
router.include_router(validation_router)

# Add additional routers here if needed
