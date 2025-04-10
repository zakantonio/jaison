"""
Authentication models for Admin API
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """User creation model"""
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str
    remember_me: bool = False


class UserResponse(BaseModel):
    """User response model"""
    id: str
    email: str
    name: Optional[str] = None
    created_at: datetime


class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: UserResponse


class PasswordResetRequest(BaseModel):
    """Password reset request model"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation model"""
    token: str
    new_password: str


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class APIKeyRequest(BaseModel):
    """API Key creation request"""
    name: str
    expires_in_days: Optional[int] = None


class APIKeyResponse(BaseModel):
    """API Key response"""
    id: str
    key: Optional[str] = None
    name: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool
    last_used: Optional[datetime] = None

    class Config:
        orm_mode = True
