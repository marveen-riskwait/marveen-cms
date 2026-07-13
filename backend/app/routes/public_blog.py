"""Public read endpoints for Blog and Actualités (published articles only)."""
from __future__ import annotations

from app.models.article import Article
from app.utils.errors import APIException
from app.utils.responses import ok, paginate
from flask import Blueprint

public_blog_bp = Blueprint("public_blog", __name__)


def _date(a: Article):
    d = a.published_at or a.created_at
    return d.isoformat() if d else None


def _card(a: Article) -> dict:
    return {"title": a.title, "slug": a.slug, "excerpt": a.excerpt,
            "cover_image": a.cover_image, "category": a.category,
            "tags": a.tags or [], "date": _date(a)}


def _full(a: Article) -> dict:
    return {**_card(a), "content": a.content}


def _published(section: str):
    return (Article.query_active()
            .filter(Article.section == section, Article.status == "published")
            .order_by(Article.created_at.desc()))


def _register(section: str) -> None:
    @public_blog_bp.get(f"/{section}", endpoint=f"list_{section}")
    def _list():
        return paginate(_published(section), serialize=_card)

    @public_blog_bp.get(f"/{section}/<slug>", endpoint=f"get_{section}")
    def _get(slug):
        article = _published(section).filter(Article.slug == slug).first()
        if article is None:
            raise APIException("Article introuvable", status_code=404)
        return ok(_full(article))


_register("blog")
_register("news")
