"""API tokens (+ Bearer auth) and webhooks (dispatch + signature)."""
from __future__ import annotations

import json

import pytest

from app.services import webhook_service


# ── API tokens & Bearer auth ────────────────────────────────────────
def test_create_token_returns_plaintext_once(admin):
    resp = admin.post("/api/api-tokens", json={"name": "CI", "scopes": ["read"]})
    assert resp.status_code == 201
    data = resp.get_json()["data"]
    assert data["token"].startswith("mvn_")
    assert data["scopes"] == ["read"]
    # Listing never exposes the plaintext.
    listed = admin.get("/api/api-tokens").get_json()["items"]
    assert all("token" not in t for t in listed)


def test_bearer_read_token_can_read_not_write(app, admin):
    raw = admin.post("/api/api-tokens", json={"name": "RO", "scopes": ["read"]}).get_json()["data"]["token"]
    c = app.test_client()
    h = {"Authorization": f"Bearer {raw}"}
    # Read works…
    assert c.get("/api/faq", headers=h).status_code == 200
    # …write is refused (missing 'write' scope).
    assert c.post("/api/faq", json={"question": "q", "answer": "a"}, headers=h).status_code == 403


def test_bearer_write_token_can_write(app, admin):
    raw = admin.post("/api/api-tokens", json={"name": "RW", "scopes": ["read", "write"]}).get_json()["data"]["token"]
    c = app.test_client()
    h = {"Authorization": f"Bearer {raw}"}
    assert c.post("/api/faq", json={"question": "via token", "answer": "a"}, headers=h).status_code == 201


def test_invalid_bearer_rejected(app):
    c = app.test_client()
    assert c.get("/api/faq", headers={"Authorization": "Bearer mvn_nope"}).status_code == 401


def test_revoked_token_stops_working(app, admin):
    created = admin.post("/api/api-tokens", json={"name": "temp", "scopes": ["read"]}).get_json()["data"]
    raw = created["token"]
    c = app.test_client()
    assert c.get("/api/faq", headers={"Authorization": f"Bearer {raw}"}).status_code == 200
    admin.delete(f"/api/api-tokens/{created['id']}")
    assert c.get("/api/faq", headers={"Authorization": f"Bearer {raw}"}).status_code == 401


# ── Webhooks ────────────────────────────────────────────────────────
def test_webhook_crud_and_secret_shown_once(admin):
    resp = admin.post("/api/webhooks", json={
        "name": "Netlify", "url": "https://example.com/hook", "events": ["page.published"]})
    assert resp.status_code == 201
    data = resp.get_json()["data"]
    assert data["secret"]                         # shown once
    listed = admin.get("/api/webhooks").get_json()["items"]
    assert all("secret" not in h for h in listed)  # never listed


def test_publishing_page_dispatches_signed_webhook(admin, monkeypatch):
    calls = []
    monkeypatch.setattr(webhook_service, "_post",
                        lambda url, body, headers: calls.append((url, body, headers)) or 200)

    admin.post("/api/webhooks", json={
        "name": "Deploy", "url": "https://example.com/deploy", "events": ["page.published"]})

    page = admin.post("/api/pages", json={"title": "À publier", "slug": "a-publier", "status": "draft"})
    pid = page.get_json()["data"]["id"]
    # Draft -> published triggers the webhook.
    admin.patch(f"/api/pages/{pid}", json={"status": "published"})

    # At least our deploy hook was called (other committed hooks may also fire).
    mine = [c for c in calls if c[0] == "https://example.com/deploy"]
    assert len(mine) == 1
    _, body, headers = mine[0]
    assert headers["X-Marveen-Event"] == "page.published"
    payload = json.loads(body)
    assert payload["event"] == "page.published"
    assert payload["data"]["slug"] == "a-publier"
    # Signature is a hex HMAC-SHA256 digest.
    assert len(headers["X-Marveen-Signature"]) == 64


def test_no_webhook_when_not_subscribed(admin, monkeypatch):
    calls = []
    monkeypatch.setattr(webhook_service, "_post", lambda *a, **k: calls.append(a) or 200)
    # Subscribed to a different event.
    admin.post("/api/webhooks", json={"name": "X", "url": "https://e.com", "events": ["entry.published"]})
    page = admin.post("/api/pages", json={"title": "P", "slug": "p-nohook", "status": "published"})
    assert page.status_code == 201
    # Creating a published page does not emit page.published (only transitions do).
    assert len(calls) == 0
