"""Document model — a downloadable file (usually a PDF) in the doc space."""
from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Document(BaseModel):
    __tablename__ = "document"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    file_url: Mapped[str] = mapped_column(String(400), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=True, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
