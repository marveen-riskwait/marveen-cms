"""Authentication endpoints.

Access + refresh JWTs are delivered in httpOnly cookies with CSRF double-submit
protection; the CSRF token is returned in the body so the SPA can echo it in
``X-CSRF-TOKEN`` on writes. Logout and refresh rotation revoke old tokens.
"""
from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token, get_csrf_token, get_jwt,
    jwt_required, set_access_cookies, set_refresh_cookies, unset_jwt_cookies,
)

from app.extensions import db, limiter
from app.permissions.decorators import current_user
from app.schemas.auth import login_schema, register_schema
from app.services import auth_service
from app.utils.errors import APIException

auth_bp = Blueprint("auth", __name__)


def _issue_session(user, status: int = 200):
    """Set access+refresh cookies and return the user + CSRF token."""
    access = create_access_token(identity=str(user.id))
    refresh = create_refresh_token(identity=str(user.id))
    resp = jsonify({
        "ok": True,
        "user": user.to_dict(with_permissions=True),
        "csrf_token": get_csrf_token(access),
    })
    set_access_cookies(resp, access)
    set_refresh_cookies(resp, refresh)
    return resp, status


@auth_bp.post("/register")
@limiter.limit("10 per minute")
def register():
    # Closed by default on an admin CMS — accounts are created via the Users
    # screen. Enable ALLOW_PUBLIC_REGISTRATION to open public sign-up.
    if not current_app.config.get("ALLOW_PUBLIC_REGISTRATION"):
        raise APIException("L'inscription publique est désactivée", status_code=403)
    data = register_schema.load(request.get_json(silent=True) or {})
    user = auth_service.register_user(**data)  # public sign-up: no roles, not admin
    return _issue_session(user, status=201)


@auth_bp.post("/login")
@limiter.limit("10 per minute")
def login():
    data = login_schema.load(request.get_json(silent=True) or {})
    user = auth_service.authenticate(**data)
    return _issue_session(user)


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user = current_user()
    auth_service.revoke(get_jwt())  # rotate: kill the used refresh token
    db.session.commit()
    return _issue_session(user)


@auth_bp.post("/logout")
@jwt_required(verify_type=False)
def logout():
    auth_service.revoke(get_jwt())
    db.session.commit()
    resp = jsonify({"ok": True, "message": "Déconnecté"})
    unset_jwt_cookies(resp)
    return resp


@auth_bp.get("/me")
@jwt_required()
def me():
    return jsonify({"ok": True, "user": current_user().to_dict(with_permissions=True)})
