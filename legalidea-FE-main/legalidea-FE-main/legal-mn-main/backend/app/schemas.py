from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Literal


# ── Auth ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    role: Literal["user", "lawyer"] = "user"
    bar_number: str | None = None
    specialization: str | None = None
    law_firm: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    role: str
    is_active: bool = True
    bar_number: str | None = None
    specialization: str | None = None
    law_firm: str | None = None
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ── Chat ──────────────────────────────────────────────

class ChatMessageRequest(BaseModel):
    case_id: str
    content: str


class LawRef(BaseModel):
    id: int
    number: str
    title: str


class CaseCreate(BaseModel):
    title: str | None = None


class CaseOut(BaseModel):
    id: str
    user_id: str
    title: str | None = None
    status: str = "open"
    created_at: datetime


class MessageOut(BaseModel):
    id: str
    case_id: str
    role: Literal["user", "assistant"]
    content: str
    law_references: list[LawRef] = []
    created_at: datetime


# ── Law ───────────────────────────────────────────────

class LawArticle(BaseModel):
    code: str
    title: str


class LawCategory(BaseModel):
    id: str
    title: str
    description: str
    articles: list[LawArticle]


class LawArticleDetail(BaseModel):
    id: str
    category_id: str
    code: str
    title: str
    content: str


class LawSearchResult(BaseModel):
    id: str
    code: str
    title: str
    excerpt: str
    category: str


# ── Profile ───────────────────────────────────────────

class ProfileOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    specialty: str | None = None
    license_number: str | None = None
    years_of_experience: int | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    specialty: str | None = None
    license_number: str | None = None
    years_of_experience: int | None = None
