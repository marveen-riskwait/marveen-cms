"""Menu model — a named navigation menu bound to a location.

``items`` is a JSON tree of nodes ``{"label", "url", "children": [...]}``,
editable from the admin and rendered by the frontend.
"""
from __future__ import annotations

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Menu(BaseModel):
    __tablename__ = "menu"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[str] = mapped_column(String(60), nullable=True, index=True)
    items: Mapped[list] = mapped_column(JSON, default=list)

    def to_dict(self, **kw) -> dict:
        data = super().to_dict(**kw)
        data.update(name=self.name, location=self.location, items=self.items or [])
        return data
