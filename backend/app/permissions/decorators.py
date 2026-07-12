"""RBAC decorators and the current-user accessor.

Usage on a route::

    @bp.post("/pages")
    @require_permission("pages.create")
    def create_page():
        ...

Each decorator verifies the JWT (from the httpOnly cookie), loads the user and
enforces the rule, raising :class:`APIException` (401/403) otherwise.
"""
from __future__ import annotations

from functools import wraps
from typing import Callable

from flask import g, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.models.user import User
from app.utils.errors import APIException

_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def _bearer_token() -> str | None:
    auth = request.headers.get("Authorization", "")
    return auth[7:].strip() if auth.startswith("Bearer ") else None


def _authenticate() -> User:
    """Resolve the caller via API token (Bearer) or JWT cookie; store token on g."""
    g.api_token = None  # clear any prior value (defensive; g is per-request in prod)
    raw = _bearer_token()
    if raw:
        from app.services import token_service

        token = token_service.verify(raw)
        if token is None or token.user is None or not token.user.is_active:
            raise APIException("Jeton d'API invalide ou expiré", status_code=401)
        need = "read" if request.method in _SAFE_METHODS else "write"
        if not token.has_scope(need):
            raise APIException(f"Le jeton n'a pas la portée « {need} »", status_code=403)
        g.api_token = token
        return token.user
    verify_jwt_in_request()
    return current_user()


def current_user() -> User:
    """The authenticated, active user, or raise 401."""
    token = getattr(g, "api_token", None)
    if token is not None:
        return token.user
    identity = get_jwt_identity()
    user = User.query.get(int(identity)) if identity is not None else None
    if user is None or not user.is_active or user.is_deleted:
        raise APIException("Session invalide ou expirée", status_code=401)
    return user


def login_required(fn: Callable) -> Callable:
    @wraps(fn)
    def wrapper(*args, **kwargs):
        _authenticate()
        return fn(*args, **kwargs)
    return wrapper


def require_permission(*codes: str, require_all: bool = True) -> Callable:
    """Require one/all of the given permission codes (superadmin always passes)."""
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = _authenticate()
            if not user.is_superadmin:
                check = all if require_all else any
                if not check(user.has_permission(code) for code in codes):
                    raise APIException("Permission insuffisante", status_code=403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def require_role(*names: str) -> Callable:
    """Require at least one of the given roles (superadmin always passes)."""
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = current_user()
            if not user.is_superadmin and not any(user.has_role(n) for n in names):
                raise APIException("Rôle insuffisant", status_code=403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator
