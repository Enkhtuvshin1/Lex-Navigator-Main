"""Authentication service orchestrating registration and login flows."""
from __future__ import annotations

from typing import Tuple

from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserPublic


class AuthError(Exception):
    """Base class for auth-specific domain errors."""


class UserAlreadyExists(AuthError):
    """Raised when attempting to create an account for an existing email."""


class InvalidCredentials(AuthError):
    """Raised when login credentials cannot be validated."""


class AuthService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    async def register_user(self, payload: UserCreate) -> Tuple[UserPublic, str]:
        existing = await self.repository.get_by_email(payload.email)
        if existing is not None:
            raise UserAlreadyExists

        hashed_password = get_password_hash(payload.password)
        user = await self.repository.create(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hashed_password,
            role=payload.role,
            bar_number=payload.bar_number,
            specialization=payload.specialization,
            law_firm=payload.law_firm,
        )
        token = create_access_token(subject=user.id)
        return UserPublic.model_validate(user), token

    async def login(self, *, email: str, password: str) -> Tuple[UserPublic, str]:
        user = await self.repository.get_by_email(email)
        if user is None or not user.is_active or not verify_password(password, user.hashed_password):
            raise InvalidCredentials

        token = create_access_token(subject=user.id)
        return UserPublic.model_validate(user), token
