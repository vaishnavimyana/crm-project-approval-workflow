# middleware/auth.py
# JWT token validation — runs on every protected API endpoint.
# Any route that needs authentication imports get_current_user
# from here and adds it as a dependency.

import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.config import get_settings

settings = get_settings()

# HTTPBearer reads the Authorization: Bearer <token> header
bearer_scheme = HTTPBearer()


def create_access_token(data: dict) -> str:
    """
    Creates a JWT token with user info embedded.
    Token expires after JWT_EXPIRY_HOURS (set in .env).
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiry_hours)
    to_encode.update({"exp": expire})

    token = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    return token


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Checks if entered password matches the stored hash.
    Using bcrypt directly because of passlib/bcrypt version mismatch.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency injected into every protected route.
    Reads the Bearer token, decodes it, returns the User object.
    Raises 401 if token is missing, invalid, or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. Please login again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Fetch user from DB to make sure they still exist and are active
    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True
    ).first()

    if user is None:
        raise credentials_exception

    return user


def require_crm(current_user: User = Depends(get_current_user)) -> User:
    """
    Use this dependency on routes that only CRM users can access.
    Approvers hitting a CRM-only route will get 403.
    """
    if current_user.role != "crm":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only CRM users can perform this action."
        )
    return current_user


def require_approver(current_user: User = Depends(get_current_user)) -> User:
    """
    Use this dependency on routes that only Approvers can access.
    """
    if current_user.role != "approver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only approvers can perform this action."
        )
    return current_user