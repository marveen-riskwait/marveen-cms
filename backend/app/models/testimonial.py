"""Testimonial model — a customer review shown on the site."""
from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Testimonial(BaseModel):
    __tablename__ = "testimonial"

    author_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(String(120), nullable=True)
    avatar: Mapped[str] = mapped_column(String(400), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, default=5)
    quote: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
