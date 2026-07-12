"""API token issuance and verification."""
from __future__ import annotations

from datetime import datetime

from app.extensions import db
from app.models.api_token import ApiToken, hash_token
from app.models.base import utcnow


def create_token(*, name: str, scopes: list[str], user_id: int,
                 expires_at: datetime | None = None) -> tuple[ApiToken, str]:
    """Create a token; returns (record, plaintext). The plaintext is shown once."""
    raw = ApiToken.generate()
    token = ApiToken(
        name=name, token_hash=hash_token(raw), prefix=raw[:12],
        scopes=scopes or ["read"], user_id=user_id, expires_at=expires_at)
    token.save()
    return token, raw


def verify(raw: str) -> ApiToken | None:
    """Return a valid token for the given plaintext, else None. Touches last_used."""
    if not raw:
        return None
    token = ApiToken.query.filter_by(token_hash=hash_token(raw)).first()
    if token is None or not token.is_valid():
        return None
    token.last_used_at = utcnow()
    db.session.commit()
    return token
