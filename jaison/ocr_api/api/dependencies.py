"""
API dependencies for OCR API
"""
import time
from typing import Dict, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel

from jaison.ocr_api.utils.logger import logger
from jaison.ocr_api.config.settings import settings
from jaison.ocr_api.services.admin_client import admin_client

# API key header
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

# API key model
class APIKeyInfo(BaseModel):
    """API key information"""
    key: str
    key_id: str
    user_id: str
    is_active: bool
    expires_at: Optional[str] = None

async def get_api_key(api_key_str: str = Security(API_KEY_HEADER)) -> APIKeyInfo:
    """
    Validate API key from header and return the API key information
    
    Args:
        api_key_str: API key string from header
        
    Returns:
        Validated API key information
        
    Raises:
        HTTPException: If API key is invalid or missing
    """
    # In development mode, make API key optional
    if settings.DEBUG and not api_key_str:
        # Create a development API key
        return APIKeyInfo(
            key="development-key",
            key_id="development-key-id",
            user_id="development-user",
            is_active=True
        )
    
    # In production, require API key
    if not api_key_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is missing",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    # Validate API key with Admin API
    validation_result = await admin_client.validate_api_key(api_key_str)
    
    if not validation_result.get("valid", False):
        error_detail = validation_result.get("error", "Invalid API key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_detail,
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    # Return API key information
    return APIKeyInfo(
        key=api_key_str,
        key_id=validation_result.get("key_id"),
        user_id=validation_result.get("user_id"),
        is_active=validation_result.get("is_active", True),
        expires_at=validation_result.get("expires_at")
    )

class RateLimiter:
    """Rate limiter for API endpoints"""
    
    def __init__(self, requests_per_minute: int = 60):
        """
        Initialize rate limiter
        
        Args:
            requests_per_minute: Maximum number of requests per minute
        """
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # 1 minute window
        self.max_requests = requests_per_minute
        self.requests: Dict[str, list] = {}  # API key -> list of timestamps
    
    async def __call__(self, api_key_info: APIKeyInfo = Depends(get_api_key)):
        """
        Check if request is within rate limits
        
        Args:
            api_key_info: API key information for the request
            
        Raises:
            HTTPException: If rate limit is exceeded
        """
        # Skip rate limiting in debug mode
        if settings.DEBUG:
            return
        
        # Get the API key string
        api_key = api_key_info.key
        
        # Initialize request list for this API key if it doesn't exist
        if api_key not in self.requests:
            self.requests[api_key] = []
        
        # Get current time
        now = time.time()
        
        # Remove timestamps outside the window
        self.requests[api_key] = [ts for ts in self.requests[api_key] if now - ts < self.window_size]
        
        # Check if rate limit is exceeded
        if len(self.requests[api_key]) >= self.max_requests:
            # Calculate time until next request is allowed
            oldest = min(self.requests[api_key])
            reset_time = oldest + self.window_size
            retry_after = int(reset_time - now) + 1
            
            logger.warning(f"Rate limit exceeded for API key: {api_key}")
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
                headers={
                    "Retry-After": str(retry_after),
                    "X-Rate-Limit-Limit": str(self.max_requests),
                    "X-Rate-Limit-Remaining": "0",
                    "X-Rate-Limit-Reset": str(int(reset_time)),
                },
            )
        
        # Add current timestamp to the list
        self.requests[api_key].append(now)
        
        # For debugging and monitoring
        remaining = self.max_requests - len(self.requests[api_key])
        logger.debug(f"Rate limit: {remaining} requests remaining for API key {api_key}")

# Create rate limiter instance
rate_limiter = RateLimiter(requests_per_minute=60)
