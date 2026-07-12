"""User administration logic: listing, creation, role assignment, safeguards.

Kept separate from ``auth_service`` (self-service auth) — this is the admin
side. Password hashing and role resolution live here so the route stays thin.
Safeguards prevent an admin from locking everyone out (no self-delete, always
keep one active super-admin).
"""
from __future__ import annotations

from app.extensions import db
from app.models.user import Role, User
from app.services.crud_service import CRUDService
from app.utils.errors import APIException

_service = CRUDService(
    User,
    searchable=("email", "first_name", "last_name"),
    sortable=("created_at", "email", "last_login_at"),
    filterable=("is_active", "is_superadmin"),
    default_sort="-created_at",
)


def list_query(**kwargs):
    return _service.list_query(**kwargs)


def get_or_404(user_id: int) -> User:
    return _service.get_or_404(user_id)


def _resolve_roles(role_ids: list[int] | None) -> list[Role]:
    if not role_ids:
        return []
    roles = Role.query.filter(Role.id.in_(role_ids)).all()
    found = {r.id for r in roles}
    missing = set(role_ids) - found
    if missing:
        raise APIException(f"Rôle(s) introuvable(s) : {sorted(missing)}", status_code=422)
    return roles


def _active_superadmin_count(exclude_id: int | None = None) -> int:
    query = User.query_active().filter(
        User.is_superadmin.is_(True), User.is_active.is_(True))
    if exclude_id is not None:
        query = query.filter(User.id != exclude_id)
    return query.count()


def create_user(data: dict) -> User:
    email = data["email"].strip().lower()
    if User.query.filter_by(email=email).first():
        raise APIException("Un compte existe déjà avec cet email", status_code=409)

    user = User(
        email=email,
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        is_active=data.get("is_active", True),
        is_superadmin=data.get("is_superadmin", False),
    )
    user.set_password(data["password"])
    user.roles = _resolve_roles(data.get("role_ids"))
    db.session.add(user)
    db.session.commit()
    return user


def update_user(user_id: int, data: dict, *, acting_user_id: int) -> User:
    user = get_or_404(user_id)

    if "email" in data:
        email = data["email"].strip().lower()
        clash = User.query.filter(User.email == email, User.id != user.id).first()
        if clash is not None:
            raise APIException("Un compte existe déjà avec cet email", status_code=409)
        user.email = email

    for field in ("first_name", "last_name"):
        if field in data:
            setattr(user, field, data[field])

    # Guard: never drop the last active super-admin (self-lockout protection).
    would_demote = (
        ("is_superadmin" in data and not data["is_superadmin"])
        or ("is_active" in data and not data["is_active"])
    )
    if user.is_superadmin and would_demote and _active_superadmin_count(exclude_id=user.id) == 0:
        raise APIException(
            "Impossible : cet utilisateur est le dernier super-administrateur actif.",
            status_code=409)

    if "is_active" in data:
        user.is_active = data["is_active"]
    if "is_superadmin" in data:
        user.is_superadmin = data["is_superadmin"]
    if "role_ids" in data:
        user.roles = _resolve_roles(data["role_ids"])
    if data.get("password"):
        user.set_password(data["password"])

    db.session.commit()
    return user


def delete_user(user_id: int, *, acting_user_id: int) -> None:
    if user_id == acting_user_id:
        raise APIException("Vous ne pouvez pas supprimer votre propre compte.", status_code=409)
    user = get_or_404(user_id)
    if user.is_superadmin and _active_superadmin_count(exclude_id=user.id) == 0:
        raise APIException(
            "Impossible : cet utilisateur est le dernier super-administrateur actif.",
            status_code=409)
    user.soft_delete()
