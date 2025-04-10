"""
Authentication service for the Admin API
"""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from jaison.admin_api.utils.logger import logger
from jaison.admin_api.api.models.auth import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate
from jaison.admin_api.database.models import User
from jaison.admin_api.database.repository import UserRepository
from jaison.admin_api.config.settings import settings

# Security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login/oauth", auto_error=False)


class AuthService:
    """Authentication service"""

    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        # Simple SHA-256 hashing for demonstration purposes
        # In production, use a proper password hashing library like bcrypt
        hashed = hashlib.sha256(plain_password.encode()).hexdigest()
        return hashed == hashed_password

    def get_password_hash(self, password: str) -> str:
        """Hash password"""
        # Simple SHA-256 hashing for demonstration purposes
        # In production, use a proper password hashing library like bcrypt
        return hashlib.sha256(password.encode()).hexdigest()

    async def authenticate_user(self, email: str, password: str, remember_me: bool = False) -> Optional[TokenResponse]:
        """Authenticate user with email and password"""
        user = await self.user_repository.get_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.password):
            return None
        
        # Create access token with remember_me option
        access_token = self.create_access_token(user.id, remember_me)
        
        # Calculate token expiration time
        if remember_me:
            expires_delta = timedelta(days=settings.REMEMBER_ME_EXPIRE_DAYS)
        else:
            expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        expires_at = datetime.now(timezone.utc) + expires_delta
        
        # Return token response
        return TokenResponse(
            access_token=access_token,
            expires_at=expires_at,
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                created_at=user.created_at
            )
        )

    def create_access_token(self, user_id: str, remember_me: bool = False) -> str:
        """Create JWT access token"""
        if remember_me:
            # Longer expiration for remember me
            expires_delta = timedelta(days=settings.REMEMBER_ME_EXPIRE_DAYS)
        else:
            # Standard expiration
            expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        expire = datetime.now(timezone.utc) + expires_delta
        to_encode = {"sub": str(user_id), "exp": expire}
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt

    async def register_user(self, user_data: UserCreate) -> User:
        """Register a new user"""
        # Check if user already exists
        existing_user = await self.user_repository.get_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Hash password
        hashed_password = self.get_password_hash(user_data.password)

        # Create user
        user = User(
            email=user_data.email,
            password=hashed_password,
            name=user_data.name
        )

        # Save user to database
        created_user = await self.user_repository.create(user)
        return created_user

    async def update_user(self, user_id: str, user_data: UserUpdate) -> User:
        """Update user information"""
        # Get current user
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare update data
        update_data: Dict[str, Any] = {}
        
        # Update email if provided
        if user_data.email is not None and user_data.email != user.email:
            # Check if email is already taken
            existing_user = await self.user_repository.get_by_email(user_data.email)
            if existing_user and existing_user.id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            update_data["email"] = user_data.email
        
        # Update name if provided
        if user_data.name is not None:
            update_data["name"] = user_data.name
        
        # Update password if provided
        if user_data.password is not None:
            update_data["password"] = self.get_password_hash(user_data.password)
        
        # If no updates, return current user
        if not update_data:
            return user
        
        # Update user in database
        updated_user = await self.user_repository.update(user_id, update_data)
        return updated_user

    async def request_password_reset(self, email: str) -> bool:
        """Request password reset"""
        user = await self.user_repository.get_by_email(email)
        if not user:
            # Don't reveal that the user doesn't exist
            return False

        # In a real implementation, you would:
        # 1. Generate a reset token
        # 2. Store it in the database with an expiration
        # 3. Send an email with a reset link

        # For now, we'll just return True
        return True

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password with token"""
        # In a real implementation, you would:
        # 1. Validate the token
        # 2. Find the user associated with the token
        # 3. Update the password
        # 4. Invalidate the token

        # For now, we'll just return True
        return True


# Dependency to get the current user
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(UserRepository)
) -> User:
    """Get current user from token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # If no token is provided, raise exception
    if token is None:
        raise credentials_exception

    try:
        # Decode token
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    # Get user from database
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise credentials_exception

    return user
