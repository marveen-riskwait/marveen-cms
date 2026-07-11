"""Event model — a dated happening (sortie, randonnée, stage…)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Event(BaseModel):
    __tablename__ = "event"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    location: Mapped[str] = mapped_column(String(200), nullable=True)
    cover_image: Mapped[str] = mapped_column(String(400), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
