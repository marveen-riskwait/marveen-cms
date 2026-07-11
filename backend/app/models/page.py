"""Page model — the Page Builder content unit.

Content is an ordered list of blocks (JSON); SEO metadata is a JSON object.
Publication state: draft / published / scheduled / archived. ``is_public``
decides whether the public endpoint may serve it.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, ensure_aware, utcnow

STATUSES = ("draft", "published", "scheduled", "archived")


class Page(BaseModel):
    __tablename__ = "page"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    locale: Mapped[str] = mapped_column(String(5), default="fr", index=True)
    is_home: Mapped[bool] = mapped_column(Boolean, default=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    blocks: Mapped[list] = mapped_column(JSON, default=list)
    seo: Mapped[dict] = mapped_column(JSON, default=dict)

    def is_public(self) -> bool:
        """Whether this page may be served publicly right now."""
        if self.status == "published":
            return True
        if self.status == "scheduled" and self.published_at is not None:
            return ensure_aware(self.published_at) <= utcnow()
        return False

    def to_dict(self, **kw) -> dict:
        data = super().to_dict(**kw)
        data.update(
            title=self.title, slug=self.slug, status=self.status, locale=self.locale,
            is_home=self.is_home,
            published_at=self.published_at.isoformat() if self.published_at else None,
            scheduled_at=self.scheduled_at.isoformat() if self.scheduled_at else None,
            blocks=self.blocks or [], seo=self.seo or {},
        )
        return data
