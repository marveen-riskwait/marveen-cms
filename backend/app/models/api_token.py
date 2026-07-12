"""ApiToken — a personal access token for headless / external API consumers.

The plaintext token is shown once at creation; only its SHA-256 hash is stored.
A token inherits its creator's permissions, narrowed by ``scopes`` (``read`` →
GET only, ``write`` → mutations too).
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, ensure_aware, utcnow

TOKEN_PREFIX = "mvn_"


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


class ApiToken(BaseModel):
    __tablename__ = "api_token"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    prefix: Mapped[str] = mapped_column(String(16), nullable=False)  # for display
    scopes: Mapped[list] = mapped_column(JSON, default=list)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", lazy="joined")

    @staticmethod
    def generate() -> str:
        return TOKEN_PREFIX + secrets.token_urlsafe(32)

    def is_valid(self) -> bool:
        if self.is_deleted:
            return False
        if self.expires_at and ensure_aware(self.expires_at) <= utcnow():
            return False
        return True

    def has_scope(self, scope: str) -> bool:
        return scope in (self.scopes or [])

    def to_dict(self, **kw) -> dict:
        data = super().to_dict(**kw)
        data.update(
            name=self.name, prefix=self.prefix, scopes=self.scopes or [],
            user_id=self.user_id,
            last_used_at=self.last_used_at.isoformat() if self.last_used_at else None,
            expires_at=self.expires_at.isoformat() if self.expires_at else None,
        )
        return data
