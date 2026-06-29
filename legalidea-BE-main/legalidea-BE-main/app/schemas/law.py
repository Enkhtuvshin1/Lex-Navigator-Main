"""Law-related Pydantic schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class LawCategoryPublic(BaseModel):
    id: int
    name: str
    description: str | None

    model_config = {"from_attributes": True}


class LawArticlePublic(BaseModel):
    id: int
    category_id: int
    number: str
    title: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LawArticleSummary(BaseModel):
    id: int
    category_id: int
    number: str
    title: str

    model_config = {"from_attributes": True}


class LawCategoryCreate(BaseModel):
    name: str
    description: str | None = None


class LawArticleCreate(BaseModel):
    category_id: int
    number: str
    title: str
    content: str


class LawArticleUpdate(BaseModel):
    number: str
    title: str
    content: str
