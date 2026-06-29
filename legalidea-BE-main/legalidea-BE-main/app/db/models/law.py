"""Law category and article ORM models."""
from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class LawCategory(Base):
    __tablename__ = "law_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    articles = relationship("LawArticle", back_populates="category", cascade="all, delete-orphan")


class LawArticle(Base):
    __tablename__ = "law_articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(
        Integer,
        ForeignKey("law_categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    number = Column(String(50), nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    category = relationship("LawCategory", back_populates="articles")
