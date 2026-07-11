"""Site settings — admin read/upsert and a public read of exposed settings."""
from __future__ import annotations

from flask import Blueprint, request

from app.extensions import db
from app.models.setting import Setting
from app.permissions.decorators import require_permission
from app.services import settings_service
from app.utils.errors import APIException
from app.utils.responses import ok

settings_bp = Blueprint("settings", __name__)
public_settings_bp = Blueprint("public_settings", __name__)


@settings_bp.get("")
@require_permission("settings.view")
def list_settings():
    items = [s.to_dict() for s in Setting.query_active().order_by(Setting.group, Setting.key)]
    return ok({"items": items, "map": settings_service.get_all()})


@settings_bp.put("/<key>")
@require_permission("settings.update")
def upsert_setting(key):
    body = request.get_json(silent=True) or {}
    if "value" not in body:
        raise APIException("Champ 'value' requis", status_code=422)
    setting = settings_service.upsert(
        key, body["value"], group=body.get("group"), is_public=body.get("is_public"))
    return ok(setting.to_dict())


@settings_bp.delete("/<key>")
@require_permission("settings.update")
def delete_setting(key):
    setting = Setting.query_active().filter(Setting.key == key).first()
    if setting is None:
        raise APIException("Paramètre introuvable", status_code=404)
    db.session.delete(setting)
    db.session.commit()
    return ok(message="Paramètre supprimé")


@public_settings_bp.get("/settings")
def public_settings():
    return ok(settings_service.get_public())
