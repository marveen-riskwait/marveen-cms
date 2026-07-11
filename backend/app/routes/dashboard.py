"""Admin dashboard — counters and recent activity for the home screen."""
from __future__ import annotations

from app.models.article import Article
from app.models.document import Document
from app.models.event import Event
from app.models.faq import Faq
from app.models.media import Media
from app.models.page import Page
from app.models.testimonial import Testimonial
from app.models.user import User
from app.permissions.decorators import login_required
from app.utils.responses import ok
from flask import Blueprint

dashboard_bp = Blueprint("dashboard", __name__)


def _recent(model, fields: list[str], limit: int = 5) -> list[dict]:
    rows = model.query_active().order_by(model.created_at.desc()).limit(limit).all()
    out = []
    for row in rows:
        item = {"id": row.id,
                "created_at": row.created_at.isoformat() if row.created_at else None}
        for field in fields:
            item[field] = getattr(row, field, None)
        out.append(item)
    return out


@dashboard_bp.get("/stats")
@login_required
def stats():
    counts = {
        "pages": Page.query_active().count(),
        "blog": Article.query_active().filter(Article.section == "blog").count(),
        "news": Article.query_active().filter(Article.section == "news").count(),
        "media": Media.query_active().count(),
        "events": Event.query_active().count(),
        "testimonials": Testimonial.query_active().count(),
        "faq": Faq.query_active().count(),
        "documents": Document.query_active().count(),
        "users": User.query_active().count(),
    }
    recent = {
        "pages": _recent(Page, ["title", "status", "slug"]),
        "articles": _recent(Article, ["title", "status", "section"]),
        "media": _recent(Media, ["original_filename", "kind"]),
    }
    return ok({"counts": counts, "recent": recent})
