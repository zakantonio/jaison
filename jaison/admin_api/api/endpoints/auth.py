"""
Authentication API endpoints for Admin API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime

from jaison.admin_api.utils.logger import logger
from jaison.admin_api.api.models.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    UserUpdate
)
from jaison.admin_api.database.models import User
from jaison.admin_api.database.repository import UserRepository
from jaison.admin_api.services.auth_service import AuthService, oauth2_scheme, get_current_user

# Create router
router = APIRouter(tags=["auth"])

# Dependencies
def get_user_repository():
    """Get user repository"""
    return UserRepository()

def get_auth_service(user_repository: UserRepository = Depends(get_user_repository)):
    """Get auth service"""
    return AuthService(user_repository)

# Routes
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new user"""
    user = await auth_service.register_user(user_data)
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Login a user"""
    token_data = await auth_service.authenticate_user(
        login_data.email, 
        login_data.password,
        remember_me=login_data.remember_me
    )
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return token_data

@router.post("/login/oauth", response_model=TokenResponse)
async def login_oauth(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service)
):
    """OAuth2 compatible login endpoint"""
    token_data = await auth_service.authenticate_user(
        form_data.username,  # OAuth2 uses username field for email
        form_data.password,
        remember_me=False
    )
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return token_data

@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(
    request: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Request a password reset"""
    await auth_service.request_password_reset(request.email)
    return {"message": "If the email exists, a password reset link has been sent"}

@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
async def confirm_password_reset(
    request: PasswordResetConfirm,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Confirm a password reset"""
    success = await auth_service.reset_password(request.token, request.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    return {"message": "Password has been reset successfully"}

@router.get("/me", response_model=UserResponse)
async def get_user_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        created_at=current_user.created_at
    )

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Update current user information"""
    updated_user = await auth_service.update_user(current_user.id, user_data)
    
    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        name=updated_user.name,
        created_at=updated_user.created_at
    )
