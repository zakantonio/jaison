"""
Database models and schema definitions for Admin API
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
import uuid

# Base model with common fields
class BaseDBModel(BaseModel):
    """Base model with common fields"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        """Pydantic config"""
        orm_mode = True

# User model
class User(BaseDBModel):
    """User model"""
    email: str
    password: str
    name: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False

# API Key model
class APIKey(BaseDBModel):
    """API Key model"""
    user_id: str
    key: str
    name: str
    is_active: bool = True
    last_used: Optional[datetime] = None
    expires_at: Optional[datetime] = None

# Transaction model
class Transaction(BaseDBModel):
    """Transaction model for payment tracking"""
    user_id: str
    amount: float
    currency: str = "USD"
    status: str  # "pending", "completed", "failed"
    provider: str = "stripe"
    provider_transaction_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

# Usage Statistics model
class UsageStatistics(BaseDBModel):
    """Usage statistics model"""
    user_id: str
    api_key_id: Optional[str] = None
    endpoint: str
    status_code: int
    processing_time_ms: int
    request_size_bytes: Optional[int] = None
    response_size_bytes: Optional[int] = None
    document_type: Optional[str] = None
    model_used: str
    credits_used: float
