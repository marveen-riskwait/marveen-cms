"""Headless integrations: API tokens and outbound webhooks (admin-managed)."""
from __future__ import annotations

from flask import Blueprint, request

from app.extensions import db
from app.models.webhook import WEBHOOK_EVENTS, Webhook
from app.permissions.decorators import current_user, require_permission
from app.services import token_service
from app.utils.errors import APIException
from app.utils.responses import ok, paginate

api_tokens_bp = Blueprint("api_tokens", __name__)
webhooks_bp = Blueprint("webhooks", __name__)

_VALID_SCOPES = {"read", "write"}


# ── API tokens ──────────────────────────────────────────────────────
@api_tokens_bp.get("")
@require_permission("api_tokens.view")
def list_tokens():
    from app.models.api_token import ApiToken
    return paginate(ApiToken.query_active().order_by(ApiToken.created_at.desc()),
                    serialize=lambda t: t.to_dict())


@api_tokens_bp.post("")
@require_permission("api_tokens.create")
def create_token():
    body = request.get_json(silent=True) or {}
    if not body.get("name"):
        raise APIException("Le nom est requis", status_code=422)
    scopes = [s for s in body.get("scopes", ["read"]) if s in _VALID_SCOPES] or ["read"]
    token, raw = token_service.create_token(
        name=body["name"], scopes=scopes, user_id=current_user().id)
    # The plaintext is returned exactly once.
    return ok({**token.to_dict(), "token": raw}, status=201)


@api_tokens_bp.delete("/<int:token_id>")
@require_permission("api_tokens.delete")
def revoke_token(token_id):
    from app.models.api_token import ApiToken
    token = ApiToken.query_active().filter(ApiToken.id == token_id).first()
    if token is None:
        raise APIException("Jeton introuvable", status_code=404)
    token.soft_delete()
    return ok(message="Jeton révoqué")


# ── Webhooks ────────────────────────────────────────────────────────
@webhooks_bp.get("")
@require_permission("webhooks.view")
def list_webhooks():
    return paginate(Webhook.query_active().order_by(Webhook.created_at.desc()),
                    serialize=lambda h: h.to_dict())


@webhooks_bp.get("/events")
@require_permission("webhooks.view")
def list_events():
    return ok(list(WEBHOOK_EVENTS))


@webhooks_bp.post("")
@require_permission("webhooks.create")
def create_webhook():
    body = request.get_json(silent=True) or {}
    if not body.get("url") or not body.get("name"):
        raise APIException("Nom et URL requis", status_code=422)
    events = [e for e in body.get("events", []) if e in WEBHOOK_EVENTS]
    hook = Webhook(name=body["name"], url=body["url"], events=events,
                   secret=Webhook.generate_secret(), is_active=body.get("is_active", True))
    hook.save()
    # Secret shown once so receivers can verify signatures.
    return ok(hook.to_dict(with_secret=True), status=201)


@webhooks_bp.patch("/<int:hook_id>")
@require_permission("webhooks.update")
def update_webhook(hook_id):
    hook = Webhook.query_active().filter(Webhook.id == hook_id).first()
    if hook is None:
        raise APIException("Webhook introuvable", status_code=404)
    body = request.get_json(silent=True) or {}
    if "name" in body:
        hook.name = body["name"]
    if "url" in body:
        hook.url = body["url"]
    if "is_active" in body:
        hook.is_active = bool(body["is_active"])
    if "events" in body:
        hook.events = [e for e in body["events"] if e in WEBHOOK_EVENTS]
    db.session.commit()
    return ok(hook.to_dict())


@webhooks_bp.delete("/<int:hook_id>")
@require_permission("webhooks.delete")
def delete_webhook(hook_id):
    hook = Webhook.query_active().filter(Webhook.id == hook_id).first()
    if hook is None:
        raise APIException("Webhook introuvable", status_code=404)
    hook.soft_delete()
    return ok(message="Webhook supprimé")
