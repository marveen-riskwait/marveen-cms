"""Webhook — an outbound HTTP notification on content events.

On a subscribed event the payload is POSTed to ``url`` with an HMAC-SHA256
signature (``X-Marveen-Signature``) computed from ``secret`` so receivers can
verify authenticity.
"""
from __future__ import annotations

import secrets
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

# Events a webhook may subscribe to.
WEBHOOK_EVENTS = (
    "page.published", "page.updated", "page.deleted",
    "entry.published", "entry.updated", "entry.deleted",
)


class Webhook(BaseModel):
    __tablename__ = "webhook"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    events: Mapped[list] = mapped_column(JSON, default=list)
    secret: Mapped[str] = mapped_column(String(64), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    @staticmethod
    def generate_secret() -> str:
        return secrets.token_hex(24)

    def subscribes_to(self, event: str) -> bool:
        return self.is_active and event in (self.events or [])

    def to_dict(self, *, with_secret: bool = False, **kw) -> dict:
        data = super().to_dict(**kw)
        data.update(
            name=self.name, url=self.url, events=self.events or [],
            is_active=self.is_active, last_status=self.last_status,
            last_delivered_at=self.last_delivered_at.isoformat() if self.last_delivered_at else None,
        )
        if with_secret:
            data["secret"] = self.secret
        return data
