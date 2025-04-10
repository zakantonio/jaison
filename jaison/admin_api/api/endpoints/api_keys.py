"""
API Key management endpoints for Admin API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import secrets
import string

from jaison.admin_api.utils.logger import logger
from jaison.admin_api.api.models.auth import APIKeyRequest, APIKeyResponse
from jaison.admin_api.database.models import User
from jaison.admin_api.database.repository import APIKeyRepository
from jaison.admin_api.services.auth_service import get_current_user

router = APIRouter(tags=["api-keys"])

def generate_api_key() -> str:
    """Generate a secure API key"""
    # Generate a 32-character random string
    alphabet = string.ascii_letters + string.digits
    return 'sk_' + ''.join(secrets.choice(alphabet) for _ in range(32))

@router.post("", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    request: APIKeyRequest,
    current_user: User = Depends(get_current_user),
    repo: APIKeyRepository = Depends(APIKeyRepository)
):
    """Create a new API key for the current user"""
    # Generate API key
    key = generate_api_key()

    # Calculate expiration date if provided
    expires_at = None
    if request.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=request.expires_in_days)

    # Create API key in database
    api_key = await repo.create({
        "user_id": current_user.id,
        "key": key,
        "name": request.name,
        "is_active": True,
        "expires_at": expires_at.isoformat() if expires_at else None
    })

    logger.info(f"API key created: {api_key.id} for user {current_user.id}")

    # Return the API key (including the secret key)
    return APIKeyResponse(
        id=api_key.id,
        key=key,  # Include the key in the response
        name=api_key.name,
        created_at=api_key.created_at,
        expires_at=api_key.expires_at,
        is_active=api_key.is_active,
        last_used=api_key.last_used
    )

@router.get("", response_model=List[APIKeyResponse])
async def get_api_keys(
    current_user: User = Depends(get_current_user),
    repo: APIKeyRepository = Depends(APIKeyRepository),
    active_only: bool = False
):
    """Get all API keys for the current user"""
    # Get API keys from database
    api_keys = await repo.get_user_keys(current_user.id)

    # Filter by active status if requested
    if active_only:
        api_keys = [k for k in api_keys if k.is_active]

    # Return API keys (without the secret key)
    return [
        APIKeyResponse(
            id=api_key.id,
            key=None,  # Don't include the key in the response
            name=api_key.name,
            created_at=api_key.created_at,
            expires_at=api_key.expires_at,
            is_active=api_key.is_active,
            last_used=api_key.last_used
        )
        for api_key in api_keys
    ]

@router.get("/{api_key_id}", response_model=APIKeyResponse)
async def get_api_key(
    api_key_id: str,
    current_user: User = Depends(get_current_user),
    repo: APIKeyRepository = Depends(APIKeyRepository)
):
    """Get a specific API key"""
    # Get API key from database
    api_key = await repo.get_by_id(api_key_id)

    # Check if API key exists
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    # Check if API key belongs to current user
    if api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key does not belong to current user"
        )

    # Return API key (without the secret key)
    return APIKeyResponse(
        id=api_key.id,
        key=None,  # Don't include the key in the response
        name=api_key.name,
        created_at=api_key.created_at,
        expires_at=api_key.expires_at,
        is_active=api_key.is_active,
        last_used=api_key.last_used
    )

@router.delete("/{api_key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    api_key_id: str,
    current_user: User = Depends(get_current_user),
    repo: APIKeyRepository = Depends(APIKeyRepository)
):
    """Delete an API key"""
    # Get API key from database
    api_key = await repo.get_by_id(api_key_id)

    # Check if API key exists
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    # Check if API key belongs to current user
    if api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key does not belong to current user"
        )

    # Delete API key
    await repo.delete(api_key_id)

    logger.info(f"API key deleted: {api_key_id} for user {current_user.id}")

@router.patch("/{api_key_id}/deactivate", response_model=APIKeyResponse)
async def deactivate_api_key(
    api_key_id: str,
    current_user: User = Depends(get_current_user),
    repo: APIKeyRepository = Depends(APIKeyRepository)
):
    """Deactivate an API key"""
    # Get API key from database
    api_key = await repo.get_by_id(api_key_id)

    # Check if API key exists
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    # Check if API key belongs to current user
    if api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key does not belong to current user"
        )

    # Deactivate API key
    updated_api_key = await repo.update(api_key_id, {"is_active": False})

    logger.info(f"API key deactivated: {api_key_id} for user {current_user.id}")

    # Return updated API key
    return APIKeyResponse(
        id=updated_api_key.id,
        key=None,  # Don't include the key in the response
        name=updated_api_key.name,
        created_at=updated_api_key.created_at,
        expires_at=updated_api_key.expires_at,
        is_active=updated_api_key.is_active,
        last_used=updated_api_key.last_used
    )

@router.patch("/{api_key_id}/activate", response_model=APIKeyResponse)
async def activate_api_key(
    api_key_id: str,
    current_user: User = Depends(get_current_user),
    repo: APIKeyRepository = Depends(APIKeyRepository)
):
    """Activate an API key"""
    # Get API key from database
    api_key = await repo.get_by_id(api_key_id)

    # Check if API key exists
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    # Check if API key belongs to current user
    if api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key does not belong to current user"
        )

    # Check if API key is expired
    if api_key.expires_at and api_key.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key is expired and cannot be activated"
        )

    # Activate API key
    updated_api_key = await repo.update(api_key_id, {"is_active": True})

    logger.info(f"API key activated: {api_key_id} for user {current_user.id}")

    # Return updated API key
    return APIKeyResponse(
        id=updated_api_key.id,
        key=None,  # Don't include the key in the response
        name=updated_api_key.name,
        created_at=updated_api_key.created_at,
        expires_at=updated_api_key.expires_at,
        is_active=updated_api_key.is_active,
        last_used=updated_api_key.last_used
    )
