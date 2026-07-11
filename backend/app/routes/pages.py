"""Pages — admin CRUD (block-validated) + a public read-by-slug endpoint.

Admin routes are permission-guarded; the public route serves only pages whose
publication state allows it (``Page.is_public``), for the frontend renderer.
"""
from __future__ import annotations

from flask import Blueprint, request

from app.models.page import Page
from app.permissions.decorators import require_permission
from app.schemas.page import page_schema
from app.services import page_service
from app.services.crud_service import CRUDService
from app.utils.responses import ok, paginate

pages_bp = Blueprint("pages", __name__)
public_pages_bp = Blueprint("public_pages", __name__)

_service = CRUDService(
    Page, searchable=("title", "slug"),
    sortable=("title", "created_at", "published_at", "status"),
    filterable=("status", "locale", "is_home"),
    default_sort="-created_at",
)


def _dump(page: Page) -> dict:
    return page.to_dict()


# ── Admin ───────────────────────────────────────────────────────────
@pages_bp.get("")
@require_permission("pages.view")
def list_pages():
    return paginate(_service.list_query(), serialize=_dump)


@pages_bp.get("/trash")
@require_permission("pages.view")
def list_trash():
    return paginate(_service.list_query(trashed=True), serialize=_dump)


@pages_bp.get("/<int:page_id>")
@require_permission("pages.view")
def get_page(page_id):
    return ok(_service.get_or_404(page_id).to_dict())


@pages_bp.post("")
@require_permission("pages.create")
def create_page():
    data = page_schema.load(request.get_json(silent=True) or {})
    return ok(page_service.create_page(data).to_dict(), status=201)


@pages_bp.patch("/<int:page_id>")
@require_permission("pages.update")
def update_page(page_id):
    data = page_schema.load(request.get_json(silent=True) or {}, partial=True)
    return ok(page_service.update_page(page_id, data).to_dict())


@pages_bp.delete("/<int:page_id>")
@require_permission("pages.delete")
def delete_page(page_id):
    _service.soft_delete(page_id)
    return ok(message="Déplacée dans la corbeille")


@pages_bp.post("/<int:page_id>/restore")
@require_permission("pages.update")
def restore_page(page_id):
    return ok(_service.restore(page_id).to_dict())


@pages_bp.delete("/<int:page_id>/purge")
@require_permission("pages.delete")
def purge_page(page_id):
    _service.purge(page_id)
    return ok(message="Supprimée définitivement")


# ── Public (no auth) ────────────────────────────────────────────────
@public_pages_bp.get("/pages/<slug>")
def public_page(slug):
    locale = request.args.get("locale", "fr")
    return ok(page_service.get_public_by_slug(slug, locale).to_dict())
