# schemas/auth.py
# Defines what the login request and response should look like.
# Pydantic validates incoming data automatically.

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    role: str
    business_unit: str | None = None