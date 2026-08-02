# app/routers/auth.py
# ============================================================================
# Login endpoint returns JWT token on success (email + password).
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.middleware.auth import create_access_token, verify_password, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.email == payload.email, User.is_active == True).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password.")
    token_data = {"sub": str(user.id), "email": user.email,
                  "role": user.role, "name": user.name}
    token = create_access_token(token_data)
    return TokenResponse(
        access_token=token, token_type="bearer", user_id=str(user.id),
        name=user.name, email=user.email, role=user.role,
        business_unit=user.business_unit)


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id), "name": current_user.name,
        "email": current_user.email, "role": current_user.role,
        "business_unit": current_user.business_unit,
    }
