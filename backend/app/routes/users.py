"""Users administration (RBAC-guarded) + a read-only roles listing.

Distinct from ``auth`` (self-service): these endpoints manage other accounts.
The roles listing feeds the user editor's role picker.
"""
from __future__ import annotations

from flask import Blueprint, request

from app.models.user import Role
from app.permissions.decorators import current_user, require_permission
from app.schemas.user import user_create_schema, user_update_schema
from app.services import user_service
from app.utils.responses import ok, paginate

users_bp = Blueprint("users", __name__)
roles_bp = Blueprint("roles", __name__)


# ── Users ───────────────────────────────────────────────────────────
@users_bp.get("")
@require_permission("users.view")
def list_users():
    return paginate(user_service.list_query(), serialize=lambda u: u.to_dict())


@users_bp.get("/<int:user_id>")
@require_permission("users.view")
def get_user(user_id):
    return ok(user_service.get_or_404(user_id).to_dict(with_permissions=True))


@users_bp.post("")
@require_permission("users.create")
def create_user():
    data = user_create_schema.load(request.get_json(silent=True) or {})
    return ok(user_service.create_user(data).to_dict(), status=201)


@users_bp.patch("/<int:user_id>")
@require_permission("users.update")
def update_user(user_id):
    data = user_update_schema.load(request.get_json(silent=True) or {}, partial=True)
    user = user_service.update_user(user_id, data, acting_user_id=current_user().id)
    return ok(user.to_dict())


@users_bp.delete("/<int:user_id>")
@require_permission("users.delete")
def delete_user(user_id):
    user_service.delete_user(user_id, acting_user_id=current_user().id)
    return ok(message="Utilisateur supprimé")


# ── Roles (read-only listing for the editor) ────────────────────────
@roles_bp.get("")
@require_permission("users.view", "roles.view", require_all=False)
def list_roles():
    roles = Role.query.order_by(Role.name).all()
    return ok([r.to_dict(with_permissions=True) for r in roles])
