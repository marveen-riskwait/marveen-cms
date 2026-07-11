"""Page domain logic: slug handling, block validation, publication."""
from __future__ import annotations

from app.extensions import db
from app.models.page import Page
from app.services.blocks import validate_blocks
from app.utils.errors import APIException
from app.utils.text import slugify


def _ensure_unique_slug(slug: str, locale: str, exclude_id: int | None = None) -> None:
    query = Page.query_active().filter(Page.slug == slug, Page.locale == locale)
    if exclude_id is not None:
        query = query.filter(Page.id != exclude_id)
    if query.first() is not None:
        raise APIException(f"Le slug « {slug} » est déjà utilisé", status_code=409)


def create_page(data: dict) -> Page:
    data = dict(data)
    data["slug"] = slugify(data.get("slug") or data["title"])
    _ensure_unique_slug(data["slug"], data.get("locale", "fr"))
    data["blocks"] = validate_blocks(data.get("blocks") or [])
    return Page(**data).save()


def update_page(page_id: int, data: dict) -> Page:
    page = Page.query_active().filter(Page.id == page_id).first()
    if page is None:
        raise APIException("Page introuvable", status_code=404)

    data = dict(data)
    if "blocks" in data:
        data["blocks"] = validate_blocks(data["blocks"])
    if data.get("slug"):
        data["slug"] = slugify(data["slug"])
        _ensure_unique_slug(data["slug"], data.get("locale", page.locale), exclude_id=page.id)

    for key, value in data.items():
        setattr(page, key, value)
    db.session.commit()
    return page


def get_public_by_slug(slug: str, locale: str = "fr") -> Page:
    page = Page.query_active().filter(Page.slug == slug, Page.locale == locale).first()
    if page is None or not page.is_public():
        raise APIException("Page introuvable", status_code=404)
    return page
