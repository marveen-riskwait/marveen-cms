"""Webhook dispatch: sign and POST event payloads to subscribers.

Delivery is best-effort and synchronous (swap for a queue at scale). Failures
are recorded on the webhook, never raised into the request that triggered them.
``_post`` is the network boundary — tests monkeypatch it.
"""
from __future__ import annotations

import hashlib
import hmac
import json

from app.extensions import db
from app.models.base import utcnow
from app.models.webhook import Webhook


def sign(secret: str, body: bytes) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def _post(url: str, body: bytes, headers: dict) -> int:
    import httpx

    resp = httpx.post(url, content=body, headers=headers, timeout=5.0)
    return resp.status_code


def dispatch(event: str, payload: dict) -> int:
    """Deliver ``event`` to every subscribed webhook. Returns the count sent."""
    hooks = [h for h in Webhook.query_active().all() if h.subscribes_to(event)]
    if not hooks:
        return 0
    body = json.dumps({"event": event, "data": payload},
                      default=str, ensure_ascii=False).encode()
    sent = 0
    for hook in hooks:
        headers = {
            "Content-Type": "application/json",
            "X-Marveen-Event": event,
            "X-Marveen-Signature": sign(hook.secret, body),
        }
        try:
            status = _post(hook.url, body, headers)
        except Exception:  # noqa: BLE001 — delivery must never break the request
            status = 0
        hook.last_status = status
        hook.last_delivered_at = utcnow()
        sent += 1
    db.session.commit()
    return sent
