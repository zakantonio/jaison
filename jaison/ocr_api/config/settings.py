"""
OCR API Service Settings
Configuration settings specific to the OCR API service
"""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """OCR API Service settings"""

    # Base settings
    APP_NAME: str = "jaison-ocr-api"
    DEBUG: bool = os.getenv("OCR_DEBUG", "False").lower() in ("true", "1", "t")

    # Server settings
    HOST: str = os.getenv("OCR_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("OCR_PORT", "8420"))
    CORS_ORIGINS: List[str] = os.getenv("OCR_CORS_ORIGINS", "*").split(",")

    # Admin API settings
    ADMIN_API_URL: str = os.getenv("ADMIN_API_URL", "http://localhost:8421")
    ADMIN_API_TIMEOUT: int = int(os.getenv("ADMIN_API_TIMEOUT", "5"))

    # API key validation cache settings
    API_KEY_CACHE_TTL: int = int(os.getenv("API_KEY_CACHE_TTL", "300"))  # 5 minutes

    # OpenRouter settings
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-4-maverick:free")

    # Logging settings
    LOG_LEVEL: str = os.getenv("OCR_LOG_LEVEL", "INFO")
    SENTRY_DSN: str = os.getenv("OCR_SENTRY_DSN", "")

    # File upload settings
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", str(10 * 1024 * 1024)))  # 10MB
    ALLOWED_EXTENSIONS: List[str] = os.getenv("ALLOWED_EXTENSIONS", "jpg,jpeg,png,pdf").split(",")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    RESULTS_DIR: str = os.getenv("RESULTS_DIR", "results")

    # API settings
    API_TIMEOUT: int = int(os.getenv("API_TIMEOUT", "30"))

# Create settings instance
settings = Settings()
