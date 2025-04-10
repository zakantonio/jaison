"""
Validation endpoints for OCR API to validate API keys and record usage
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from jaison.admin_api.utils.logger import logger
from jaison.admin_api.database.repository import APIKeyRepository, UsageStatisticsRepository
from jaison.admin_api.database.models import APIKey

router = APIRouter(
    prefix="/validation",
    tags=["validation"],
)

# Models
class APIKeyValidationRequest(BaseModel):
    """API key validation request"""
    api_key: str

class APIKeyValidationResponse(BaseModel):
    """API key validation response"""
    valid: bool
    key_id: Optional[str] = None
    user_id: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None

class UsageRecordRequest(BaseModel):
    """Usage record request"""
    user_id: str
    api_key_id: Optional[str] = None
    endpoint: str
    status_code: int
    processing_time_ms: int
    request_size_bytes: Optional[int] = None
    response_size_bytes: Optional[int] = None
    document_type: Optional[str] = None
    model_used: str = "default"
    credits_used: float = 1.0

class UsageRecordResponse(BaseModel):
    """Usage record response"""
    success: bool
    usage_id: Optional[str] = None
    error: Optional[str] = None

# Repositories
api_key_repo = APIKeyRepository()
usage_stats_repo = UsageStatisticsRepository()

@router.post("/api-key", response_model=APIKeyValidationResponse)
async def validate_api_key(request: APIKeyValidationRequest):
    """
    Validate an API key

    This endpoint is called by the OCR API to validate API keys
    """
    try:
        # Get API key from database
        api_key = await api_key_repo.get_by_key(request.api_key)

        if not api_key:
            logger.info(f"API key validation failed: Key not found")
            return APIKeyValidationResponse(valid=False)

        # Check if key is active
        if not api_key.is_active:
            logger.info(f"API key validation failed: Key inactive")
            return APIKeyValidationResponse(valid=False)

        # Check if key is expired
        if api_key.expires_at and api_key.expires_at < datetime.now(timezone.utc):
            logger.info(f"API key validation failed: Key expired")
            return APIKeyValidationResponse(valid=False)

        # Update last used timestamp
        await api_key_repo.update_last_used(api_key.id)

        # Return validation response
        return APIKeyValidationResponse(
            valid=True,
            key_id=api_key.id,
            user_id=api_key.user_id,
            is_active=api_key.is_active,
            expires_at=api_key.expires_at
        )

    except Exception as e:
        logger.error(f"Error validating API key: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating API key: {str(e)}"
        )

@router.post("/record-usage", response_model=UsageRecordResponse)
async def record_usage(request: UsageRecordRequest):
    """
    Record API usage

    This endpoint is called by the OCR API to record usage statistics
    """
    try:
        # Record usage
        usage_stats = await usage_stats_repo.record_api_usage(
            user_id=request.user_id,
            api_key_id=request.api_key_id,
            endpoint=request.endpoint,
            status_code=request.status_code,
            processing_time_ms=request.processing_time_ms,
            request_size_bytes=request.request_size_bytes,
            response_size_bytes=request.response_size_bytes,
            document_type=request.document_type,
            model_used=request.model_used,
            credits_used=request.credits_used
        )

        if usage_stats:
            return UsageRecordResponse(success=True, usage_id=usage_stats.id)
        else:
            return UsageRecordResponse(success=False, error="Failed to record usage")

    except Exception as e:
        logger.error(f"Error recording usage: {e}")
        return UsageRecordResponse(success=False, error=str(e))
