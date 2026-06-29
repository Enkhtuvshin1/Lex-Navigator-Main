"""User-related Pydantic schemas."""
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None


class UserCreate(UserBase):
    password: str
    role: Literal["user", "lawyer"] = "user"
    # Lawyer-specific fields (required when role == "lawyer")
    bar_number: str | None = None
    specialization: str | None = None
    law_firm: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    bar_number: str | None = None
    specialization: str | None = None
    law_firm: str | None = None


class AdminUserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    role: Literal["user", "lawyer"] | None = None
    is_active: bool | None = None
    bar_number: str | None = None
    specialization: str | None = None
    law_firm: str | None = None


class UserPublic(UserBase):
    id: UUID
    role: str = "user"
    is_active: bool = True
    bar_number: str | None = None
    specialization: str | None = None
    law_firm: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
