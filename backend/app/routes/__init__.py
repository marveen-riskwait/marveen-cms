"""Blueprint registry.

Every module is registered here under ``/api/...``. Content modules reuse
:func:`build_crud_blueprint` (one entry each); Blog and Actualités are two
views over the ``Article`` table via ``base_filters`` / ``defaults``.
"""
from __future__ import annotations

from flask import Flask


def register_blueprints(app: Flask) -> None:
    from app.routes.auth import auth_bp
    from app.routes.crud import build_crud_blueprint
    from app.routes.dashboard import dashboard_bp
    from app.routes.media import media_bp, media_files_bp
    from app.routes.menus import public_menus_bp
    from app.routes.pages import pages_bp, public_pages_bp
    from app.routes.settings import public_settings_bp, settings_bp
    from app.routes.sitemap import seo_bp

    from app.models.article import Article
    from app.models.brand import Brand
    from app.models.category import Category
    from app.models.document import Document
    from app.models.event import Event
    from app.models.faq import Faq
    from app.models.menu import Menu
    from app.models.partner import Partner
    from app.models.team_member import TeamMember
    from app.models.testimonial import Testimonial
    from app.schemas.factory import make_schema

    # ── Auth, pages, media, settings, dashboard, SEO ────────────────
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(pages_bp, url_prefix="/api/pages")
    app.register_blueprint(public_pages_bp, url_prefix="/api/public")
    app.register_blueprint(media_bp, url_prefix="/api/media")
    app.register_blueprint(media_files_bp, url_prefix="/media")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")
    app.register_blueprint(public_settings_bp, url_prefix="/api/public")
    app.register_blueprint(public_menus_bp, url_prefix="/api/public")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(seo_bp)  # /sitemap.xml, /robots.txt at the root

    # ── Content modules (generic CRUD) ──────────────────────────────
    article_exclude = ("deleted_at", "section")  # section is server-controlled

    modules = [
        dict(name="faq", model=Faq, module="faq", url="/api/faq",
             searchable=("question", "answer", "category"),
             sortable=("sort_order", "created_at"),
             filterable=("category", "is_published"), default_sort="sort_order"),
        dict(name="categories", model=Category, module="categories", url="/api/categories",
             searchable=("name", "slug"), sortable=("sort_order", "created_at"),
             filterable=("is_published",), default_sort="sort_order"),
        dict(name="partners", model=Partner, module="partners", url="/api/partners",
             searchable=("name",), sortable=("sort_order", "created_at"),
             filterable=("is_published",), default_sort="sort_order"),
        dict(name="brands", model=Brand, module="brands", url="/api/brands",
             searchable=("name",), sortable=("sort_order", "created_at"),
             filterable=("is_published",), default_sort="sort_order"),
        dict(name="testimonials", model=Testimonial, module="testimonials",
             url="/api/testimonials", searchable=("author_name", "quote"),
             sortable=("sort_order", "created_at", "rating"),
             filterable=("is_published", "rating"), default_sort="sort_order"),
        dict(name="team", model=TeamMember, module="team", url="/api/team",
             searchable=("name", "role"), sortable=("sort_order", "created_at"),
             filterable=("is_published",), default_sort="sort_order"),
        dict(name="documents", model=Document, module="documents", url="/api/documents",
             searchable=("title", "description", "category"),
             sortable=("sort_order", "created_at"),
             filterable=("category", "is_published"), default_sort="sort_order"),
        dict(name="events", model=Event, module="events", url="/api/events",
             searchable=("title", "location"),
             sortable=("starts_at", "created_at", "title"),
             filterable=("status", "is_featured"), default_sort="-starts_at"),
        dict(name="menus", model=Menu, module="menus", url="/api/menus",
             searchable=("name", "location"), sortable=("name", "created_at"),
             filterable=("location",), default_sort="name"),
        dict(name="blog", model=Article, module="blog", url="/api/blog",
             schema=make_schema(Article, exclude=article_exclude),
             searchable=("title", "excerpt", "category"),
             sortable=("published_at", "created_at", "title"),
             filterable=("status", "category", "is_featured"), default_sort="-created_at",
             base_filters={"section": "blog"}, defaults={"section": "blog"}),
        dict(name="news", model=Article, module="news", url="/api/news",
             schema=make_schema(Article, exclude=article_exclude),
             searchable=("title", "excerpt", "category"),
             sortable=("published_at", "created_at", "title"),
             filterable=("status", "category", "is_featured"), default_sort="-created_at",
             base_filters={"section": "news"}, defaults={"section": "news"}),
    ]

    for cfg in modules:
        url = cfg.pop("url")
        cfg.setdefault("schema", make_schema(cfg["model"]))
        app.register_blueprint(build_crud_blueprint(**cfg), url_prefix=url)
