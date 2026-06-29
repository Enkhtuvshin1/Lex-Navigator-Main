"""User ORM model aligned with the Neon PostgreSQL schema."""
from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Column, DateTime, String, func, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
        index=True,
    )
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column("password_hash", String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String(20), server_default="user", default="user", nullable=False)
    bar_number = Column(String(100), nullable=True)
    specialization = Column(String(255), nullable=True)
    law_firm = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
