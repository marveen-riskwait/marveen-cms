"""Article model — powers both Blog and Actualités via the ``section`` field."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

SECTIONS = ("blog", "news")
STATUSES = ("draft", "published", "scheduled", "archived")


class Article(BaseModel):
    __tablename__ = "article"

    section: Mapped[str] = mapped_column(String(10), default="blog", index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=True, index=True)
    excerpt: Mapped[str] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=True)  # HTML
    cover_image: Mapped[str] = mapped_column(String(400), nullable=True)
    category: Mapped[str] = mapped_column(String(120), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    tags: Mapped[list] = mapped_column(JSON, default=list)
