"""
Admin API Service Settings
Configuration settings specific to the Admin API service
"""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Admin API Service settings"""

    # Base settings
    APP_NAME: str = "jaison-admin-api"
    DEBUG: bool = os.getenv("ADMIN_DEBUG", "False").lower() in ("true", "1", "t")

    # Server settings
    HOST: str = os.getenv("ADMIN_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("ADMIN_PORT", "8421"))
    CORS_ORIGINS: List[str] = os.getenv("ADMIN_CORS_ORIGINS", "*").split(",")

    # Supabase settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    # JWT settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REMEMBER_ME_EXPIRE_DAYS: int = int(os.getenv("REMEMBER_ME_EXPIRE_DAYS", "30"))

    # Logging settings
    LOG_LEVEL: str = os.getenv("ADMIN_LOG_LEVEL", "INFO")
    SENTRY_DSN: str = os.getenv("ADMIN_SENTRY_DSN", "")

    # API settings
    API_TIMEOUT: int = int(os.getenv("API_TIMEOUT", "30"))

# Create settings instance
settings = Settings()
