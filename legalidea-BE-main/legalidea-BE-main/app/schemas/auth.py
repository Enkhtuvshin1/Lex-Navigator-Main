"""Authentication-related schemas."""
from pydantic import BaseModel, EmailStr

from app.schemas.user import UserPublic


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(Token):
    user: UserPublic


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminAuthResponse(Token):
    username: str
