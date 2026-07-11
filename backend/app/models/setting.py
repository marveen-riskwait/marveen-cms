"""Setting model — a typed key/value site setting (hours, contact, banner…).

``value`` is JSON so a setting can hold a string, number, list or object
(e.g. opening hours). ``is_public`` exposes it on the public settings endpoint.
"""
from __future__ import annotations

from sqlalchemy import JSON, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Setting(BaseModel):
    __tablename__ = "setting"

    key: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    value: Mapped[object] = mapped_column(JSON, default=None)
    group: Mapped[str] = mapped_column(String(60), nullable=True, index=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)

    def to_dict(self, **kw) -> dict:
        data = super().to_dict(**kw)
        data.update(key=self.key, value=self.value, group=self.group,
                    is_public=self.is_public)
        return data
