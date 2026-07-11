"""Brand model — a bike/equipment brand carried by the shop (module Marques)."""
from __future__ import annotations

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Brand(BaseModel):
    __tablename__ = "brand"

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    logo: Mapped[str] = mapped_column(String(400), nullable=True)
    url: Mapped[str] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
