"""Pages — admin CRUD (block-validated) + a public read-by-slug endpoint.

Admin routes are permission-guarded; the public route serves only pages whose
publication state allows it (``Page.is_public``), for the frontend renderer.
"""
from __future__ import annotations

from flask import Blueprint, request

from app.models.page import Page
from app.models.page_revision import PageRevision
from app.permissions.decorators import current_user, require_permission
from app.schemas.page import page_schema
from app.services import page_service, preview_service
from app.services.crud_service import CRUDService
from app.utils.errors import APIException
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
    page = page_service.update_page(page_id, data, author_id=current_user().id)
    return ok(page.to_dict())


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


@pages_bp.get("/<int:page_id>/revisions")
@require_permission("pages.view")
def list_revisions(page_id):
    return paginate(page_service.list_revisions(page_id),
                    serialize=lambda r: {k: v for k, v in r.to_dict().items()
                                         if k not in ("blocks", "seo")})


@pages_bp.get("/<int:page_id>/revisions/<int:revision_id>")
@require_permission("pages.view")
def get_revision(page_id, revision_id):
    revision = PageRevision.query.filter_by(id=revision_id, page_id=page_id).first()
    if revision is None:
        raise APIException("Révision introuvable", status_code=404)
    return ok(revision.to_dict())


@pages_bp.post("/<int:page_id>/revisions/<int:revision_id>/restore")
@require_permission("pages.update")
def restore_revision(page_id, revision_id):
    page = page_service.restore_revision(page_id, revision_id, author_id=current_user().id)
    return ok(page.to_dict())


@pages_bp.get("/<int:page_id>/preview")
@require_permission("pages.view")
def preview_token(page_id):
    """Mint a signed preview token (and its public path) for a page."""
    page = _service.get_or_404(page_id)
    token = preview_service.make_preview_token(page.id)
    return ok({"token": token, "path": f"/api/public/preview?token={token}",
               "slug": page.slug, "locale": page.locale})


# ── Public (no auth) ────────────────────────────────────────────────
@public_pages_bp.get("/home")
def public_home():
    locale = request.args.get("locale", "fr")
    return ok(page_service.get_public_home(locale).to_dict())


@public_pages_bp.get("/pages/<slug>")
def public_page(slug):
    locale = request.args.get("locale", "fr")
    return ok(page_service.get_public_by_slug(slug, locale).to_dict())


@public_pages_bp.get("/preview")
def preview_page():
    """Render any page (incl. drafts) given a valid signed preview token."""
    token = request.args.get("token", "")
    page_id = preview_service.read_preview_token(token)
    if page_id is None:
        raise APIException("Lien de prévisualisation invalide ou expiré", status_code=403)
    page = Page.query_active().filter(Page.id == page_id).first()
    if page is None:
        raise APIException("Page introuvable", status_code=404)
    return ok({**page.to_dict(), "is_preview": True})
