"""Blueprint registry.

Every module exposes a blueprint registered here under ``/api/...``. Content
modules reuse :func:`build_crud_blueprint` — one entry each.
"""
from __future__ import annotations

from flask import Flask


def register_blueprints(app: Flask) -> None:
    from app.routes.auth import auth_bp
    from app.routes.crud import build_crud_blueprint

    from app.models.faq import Faq
    from app.models.partner import Partner
    from app.schemas.faq import faq_schema
    from app.schemas.partner import partner_schema

    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    app.register_blueprint(
        build_crud_blueprint(
            name="faq", model=Faq, schema=faq_schema, module="faq",
            searchable=("question", "answer", "category"),
            sortable=("sort_order", "created_at"),
            filterable=("category", "is_published"),
            default_sort="sort_order",
        ),
        url_prefix="/api/faq",
    )

    app.register_blueprint(
        build_crud_blueprint(
            name="partners", model=Partner, schema=partner_schema, module="partners",
            searchable=("name",),
            sortable=("sort_order", "created_at"),
            filterable=("is_published",),
            default_sort="sort_order",
        ),
        url_prefix="/api/partners",
    )
