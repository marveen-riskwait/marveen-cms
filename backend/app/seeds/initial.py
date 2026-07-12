"""Initial seed: permission catalog, system roles and the super-admin.

Idempotent — safe to run repeatedly. Permissions follow the ``module.action``
convention; system roles are non-deletable. Super-admin credentials come from
``ADMIN_EMAIL`` / ``ADMIN_PASSWORD`` (defaults printed on first creation).
"""
from __future__ import annotations

import os

from app.extensions import db
from app.models.user import Permission, Role, User

CONTENT_MODULES = [
    "pages", "menus", "media", "blog", "news", "categories", "galleries",
    "faq", "partners", "brands", "team", "documents", "events",
    "testimonials", "seo", "content",
]
ADMIN_MODULES = ["users", "roles", "settings", "logs", "trash", "backups",
                 "content_types", "api_tokens", "webhooks"]
RESERVATION_MODULES = ["reservations"]
ACTIONS = ["view", "create", "update", "delete"]
PUBLISHABLE = {"pages", "blog", "news", "events"}


def _permission_specs() -> list[tuple[str, str, str]]:
    specs: list[tuple[str, str, str]] = []
    for module in CONTENT_MODULES + ADMIN_MODULES + RESERVATION_MODULES:
        actions = ACTIONS + (["publish"] if module in PUBLISHABLE else [])
        for action in actions:
            specs.append((f"{module}.{action}", module, f"{action.title()} {module}"))
    return specs


def seed_permissions() -> int:
    existing = {p.code for p in Permission.query.all()}
    created = 0
    for code, module, label in _permission_specs():
        if code not in existing:
            db.session.add(Permission(code=code, module=module, label=label))
            created += 1
    db.session.commit()
    return created


def seed_roles() -> None:
    def upsert(name: str, label: str, perms: list[Permission]) -> Role:
        role = Role.query.filter_by(name=name).first()
        if role is None:
            role = Role(name=name, label=label, is_system=True)
            db.session.add(role)
        role.permissions = perms
        return role

    all_perms = Permission.query.all()
    content_perms = [p for p in all_perms
                     if p.module in CONTENT_MODULES + RESERVATION_MODULES]
    employe_perms = [p for p in all_perms if (
        p.module == "reservations"
        or (p.module in {"events", "media"} and p.code.endswith(".view"))
    )]

    upsert("administrateur", "Administrateur", all_perms)
    upsert("editeur", "Éditeur", content_perms)
    upsert("employe", "Employé", employe_perms)
    db.session.commit()


def seed_superadmin() -> tuple[User, str | None]:
    email = os.getenv("ADMIN_EMAIL", "admin@marveen.cms")
    password = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")
    user = User.query.filter_by(email=email).first()
    if user is not None:
        return user, None

    user = User(email=email, first_name="Super", last_name="Admin",
                is_superadmin=True, is_active=True)
    user.set_password(password)
    admin_role = Role.query.filter_by(name="administrateur").first()
    if admin_role:
        user.roles = [admin_role]
    db.session.add(user)
    db.session.commit()
    return user, password


def seed_all() -> None:
    created = seed_permissions()
    seed_roles()
    user, password = seed_superadmin()

    print("Seed terminé :")
    print(f"  Permissions   : {Permission.query.count()} ({created} nouvelles)")
    print(f"  Rôles         : {Role.query.count()}")
    if password:
        print(f"  Super-admin   : {user.email} / {password}  (à changer !)")
    else:
        print(f"  Super-admin   : {user.email} (déjà présent)")
