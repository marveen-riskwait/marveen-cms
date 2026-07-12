"""PageRevision model — an immutable snapshot of a page's content.

A revision is captured before each content-changing update, so an editor can
review history and restore any earlier state. Snapshots store the title, blocks
and SEO exactly as they were.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, utcnow


class PageRevision(BaseModel):
    __tablename__ = "page_revision"

    page_id: Mapped[int] = mapped_column(
        ForeignKey("page.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id: Mapped[int | None] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"), nullable=True)

    title: Mapped[str] = mapped_column(String(200), nullable=True)
    blocks: Mapped[list] = mapped_column(JSON, default=list)
    seo: Mapped[dict] = mapped_column(JSON, default=dict)
    # Monotonic per-page revision number (1, 2, 3…), for display.
    number: Mapped[int] = mapped_column(Integer, default=1)
    snapshot_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    author = relationship("User", lazy="joined")

    def to_dict(self, **kw) -> dict:
        data = super().to_dict(**kw)
        author = self.author
        data.update(
            page_id=self.page_id, number=self.number,
            author_id=self.author_id,
            author_name=(
                " ".join(filter(None, [author.first_name, author.last_name])) or author.email
                if author else None),
            title=self.title, blocks=self.blocks or [], seo=self.seo or {},
            snapshot_at=self.snapshot_at.isoformat() if self.snapshot_at else None,
        )
        return data
