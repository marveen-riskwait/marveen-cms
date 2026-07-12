"""Page domain logic: slug handling, block validation, publication, revisions."""
from __future__ import annotations

from app.extensions import db
from app.models.page import Page
from app.models.page_revision import PageRevision
from app.services.blocks import validate_blocks
from app.utils.errors import APIException
from app.utils.text import slugify

# Fields whose change is worth snapshotting into history.
_CONTENT_FIELDS = ("title", "blocks", "seo")


def _snapshot(page: Page, author_id: int | None) -> PageRevision:
    """Capture the page's current content as a new numbered revision."""
    last = (PageRevision.query.filter_by(page_id=page.id)
            .order_by(PageRevision.number.desc()).first())
    revision = PageRevision(
        page_id=page.id, author_id=author_id, number=(last.number + 1 if last else 1),
        title=page.title, blocks=page.blocks or [], seo=page.seo or {},
    )
    db.session.add(revision)
    return revision


def _content_changes(page: Page, data: dict) -> bool:
    return any(field in data and data[field] != getattr(page, field) for field in _CONTENT_FIELDS)


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


def update_page(page_id: int, data: dict, *, author_id: int | None = None) -> Page:
    page = Page.query_active().filter(Page.id == page_id).first()
    if page is None:
        raise APIException("Page introuvable", status_code=404)

    data = dict(data)
    if "blocks" in data:
        data["blocks"] = validate_blocks(data["blocks"])
    if data.get("slug"):
        data["slug"] = slugify(data["slug"])
        _ensure_unique_slug(data["slug"], data.get("locale", page.locale), exclude_id=page.id)

    # Snapshot the pre-update content before overwriting it.
    if _content_changes(page, data):
        _snapshot(page, author_id)

    for key, value in data.items():
        setattr(page, key, value)
    db.session.commit()
    return page


def list_revisions(page_id: int):
    """Query of a page's revisions, newest first."""
    get_page_or_404(page_id)
    return PageRevision.query.filter_by(page_id=page_id).order_by(PageRevision.number.desc())


def get_page_or_404(page_id: int) -> Page:
    page = Page.query_active().filter(Page.id == page_id).first()
    if page is None:
        raise APIException("Page introuvable", status_code=404)
    return page


def restore_revision(page_id: int, revision_id: int, *, author_id: int | None = None) -> Page:
    """Restore a revision's snapshot as the page's current content.

    The current state is snapshotted first, so a restore is itself undoable.
    """
    page = get_page_or_404(page_id)
    revision = PageRevision.query.filter_by(id=revision_id, page_id=page_id).first()
    if revision is None:
        raise APIException("Révision introuvable", status_code=404)

    _snapshot(page, author_id)
    page.title = revision.title
    page.blocks = revision.blocks or []
    page.seo = revision.seo or {}
    db.session.commit()
    return page


def get_public_by_slug(slug: str, locale: str = "fr") -> Page:
    page = Page.query_active().filter(Page.slug == slug, Page.locale == locale).first()
    if page is None or not page.is_public():
        raise APIException("Page introuvable", status_code=404)
    return page


def get_public_home(locale: str = "fr") -> Page:
    """The public home page (``is_home``) for a locale."""
    page = Page.query_active().filter(Page.is_home.is_(True), Page.locale == locale).first()
    if page is None or not page.is_public():
        raise APIException("Page d'accueil introuvable", status_code=404)
    return page
