"""
Admin API Client for OCR API
Handles communication with the Admin API for validation and usage recording
"""
import httpx
from typing import Dict, Any, Optional
from datetime import datetime
import time
from cachetools import TTLCache

from jaison.ocr_api.utils.logger import logger
from jaison.ocr_api.config.settings import settings

class AdminAPIClient:
    """Client for Admin API"""
    
    def __init__(self):
        """Initialize Admin API client"""
        self.base_url = settings.ADMIN_API_URL
        self.timeout = settings.ADMIN_API_TIMEOUT
        
        # Cache for API key validation results
        # Using TTL cache to automatically expire entries
        self.api_key_cache = TTLCache(
            maxsize=1000,  # Maximum number of cached keys
            ttl=settings.API_KEY_CACHE_TTL  # Time-to-live in seconds
        )
    
    async def validate_api_key(self, api_key: str) -> Dict[str, Any]:
        """
        Validate an API key with the Admin API
        
        Args:
            api_key: API key to validate
            
        Returns:
            Dictionary with validation results
        """
        # Check cache first
        cache_key = f"api_key:{api_key}"
        if cache_key in self.api_key_cache:
            logger.debug(f"API key validation cache hit")
            return self.api_key_cache[cache_key]
        
        try:
            # Prepare request
            url = f"{self.base_url}/api/v1/validation/api-key"
            payload = {"api_key": api_key}
            
            # Make request
            start_time = time.time()
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
            
            # Parse response
            result = response.json()
            
            # Cache result if valid
            if result.get("valid", False):
                self.api_key_cache[cache_key] = result
            
            logger.debug(f"API key validation took {(time.time() - start_time) * 1000:.2f}ms")
            return result
        
        except httpx.TimeoutException:
            logger.error(f"API key validation request timed out after {self.timeout} seconds")
            # Return invalid result on timeout
            return {"valid": False, "error": "Validation request timed out"}
        
        except httpx.HTTPStatusError as e:
            logger.error(f"API key validation HTTP error: {e.response.status_code} - {e.response.text}")
            # Return invalid result on HTTP error
            return {"valid": False, "error": f"HTTP error: {e.response.status_code}"}
        
        except Exception as e:
            logger.error(f"API key validation error: {e}")
            # Return invalid result on any other error
            return {"valid": False, "error": str(e)}
    
    async def record_usage(
        self,
        user_id: str,
        api_key_id: Optional[str],
        endpoint: str,
        status_code: int,
        processing_time_ms: int,
        request_size_bytes: Optional[int] = None,
        response_size_bytes: Optional[int] = None,
        document_type: Optional[str] = None,
        model_used: str = "default",
        credits_used: float = 1.0
    ) -> Dict[str, Any]:
        """
        Record API usage with the Admin API
        
        Args:
            user_id: User ID
            api_key_id: API key ID
            endpoint: API endpoint
            status_code: HTTP status code
            processing_time_ms: Processing time in milliseconds
            request_size_bytes: Request size in bytes
            response_size_bytes: Response size in bytes
            document_type: Document type
            model_used: Model used
            credits_used: Credits used
            
        Returns:
            Dictionary with recording results
        """
        try:
            # Prepare request
            url = f"{self.base_url}/api/v1/validation/record-usage"
            payload = {
                "user_id": user_id,
                "api_key_id": api_key_id,
                "endpoint": endpoint,
                "status_code": status_code,
                "processing_time_ms": processing_time_ms,
                "request_size_bytes": request_size_bytes,
                "response_size_bytes": response_size_bytes,
                "document_type": document_type,
                "model_used": model_used,
                "credits_used": credits_used
            }
            
            # Make request
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
            
            # Parse response
            return response.json()
        
        except Exception as e:
            logger.error(f"Error recording usage: {e}")
            # Don't fail the request if recording usage fails
            # Just log the error and return a failure response
            return {"success": False, "error": str(e)}

# Create a singleton instance
admin_client = AdminAPIClient()
