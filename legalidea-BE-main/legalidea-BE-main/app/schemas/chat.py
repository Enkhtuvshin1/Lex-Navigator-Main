"""Chat / case-related Pydantic schemas."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CaseCreate(BaseModel):
    title: str | None = None


class CasePublic(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageSend(BaseModel):
    case_id: UUID
    content: str


class LawRef(BaseModel):
    id: int
    number: str
    title: str

    model_config = {"from_attributes": True}


class MessagePublic(BaseModel):
    id: UUID
    case_id: UUID
    role: str
    content: str
    law_references: list[LawRef] = []
    created_at: datetime

    model_config = {"from_attributes": True}
