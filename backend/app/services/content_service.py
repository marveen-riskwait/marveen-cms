"""Content engine: user-defined types and their validated entries.

Types are schemas (fields); entries are JSON validated dynamically against those
fields. No per-type tables or migrations — one ``content_entry`` table holds
everything, keyed by type.
"""
from __future__ import annotations

from datetime import date, datetime

from app.extensions import db
from app.models.content_entry import ContentEntry
from app.models.content_type import FIELD_TYPES, ContentType, FieldDefinition
from app.services.blocks import sanitize_html
from app.utils.errors import APIException
from app.utils.text import slugify


# ── Content types ───────────────────────────────────────────────────
def _apply_fields(ct: ContentType, fields: list[dict]) -> None:
    seen: set[str] = set()
    ct.fields.clear()
    for i, f in enumerate(fields or []):
        key = slugify(f.get("key") or f.get("label") or "").replace("-", "_")
        if not key:
            raise APIException("Chaque champ doit avoir une clé", status_code=422)
        if key in seen:
            raise APIException(f"Clé de champ dupliquée : {key}", status_code=422)
        if f.get("field_type", "text") not in FIELD_TYPES:
            raise APIException(f"Type de champ inconnu : {f.get('field_type')}", status_code=422)
        seen.add(key)
        ct.fields.append(FieldDefinition(
            key=key, label=f.get("label") or key, field_type=f.get("field_type", "text"),
            required=bool(f.get("required")), is_title=bool(f.get("is_title")),
            sort_order=f.get("sort_order", i), config=f.get("config") or {}))
    # Ensure at most one title field; default to the first text field.
    titles = [f for f in ct.fields if f.is_title]
    if not titles:
        text_like = next((f for f in ct.fields if f.field_type in ("text", "textarea")), None)
        if text_like:
            text_like.is_title = True


def get_type_or_404(type_id: int) -> ContentType:
    ct = ContentType.query_active().filter(ContentType.id == type_id).first()
    if ct is None:
        raise APIException("Type de contenu introuvable", status_code=404)
    return ct


def get_type_by_slug(slug: str) -> ContentType:
    ct = ContentType.query_active().filter(ContentType.slug == slug).first()
    if ct is None:
        raise APIException("Type de contenu introuvable", status_code=404)
    return ct


def create_type(data: dict) -> ContentType:
    slug = slugify(data.get("slug") or data["name"])
    if ContentType.query_active().filter(ContentType.slug == slug).first():
        raise APIException(f"Le slug « {slug} » est déjà utilisé", status_code=409)
    ct = ContentType(name=data["name"], slug=slug, icon=data.get("icon") or "bi-collection",
                     description=data.get("description"),
                     is_singleton=bool(data.get("is_singleton")))
    _apply_fields(ct, data.get("fields", []))
    return ct.save()


def update_type(type_id: int, data: dict) -> ContentType:
    ct = get_type_or_404(type_id)
    if "name" in data:
        ct.name = data["name"]
    if "icon" in data:
        ct.icon = data["icon"]
    if "description" in data:
        ct.description = data["description"]
    if "is_singleton" in data:
        ct.is_singleton = bool(data["is_singleton"])
    if data.get("slug"):
        slug = slugify(data["slug"])
        clash = ContentType.query_active().filter(
            ContentType.slug == slug, ContentType.id != ct.id).first()
        if clash:
            raise APIException(f"Le slug « {slug} » est déjà utilisé", status_code=409)
        ct.slug = slug
    if "fields" in data:
        _apply_fields(ct, data["fields"])
    db.session.commit()
    return ct


# ── Entry validation ────────────────────────────────────────────────
def _coerce(field: FieldDefinition, value):
    ftype = field.field_type
    if value is None or value == "":
        return None
    if ftype == "number":
        try:
            num = float(value)
        except (TypeError, ValueError):
            raise APIException("Valeur numérique invalide", status_code=422,
                               payload={"errors": {field.key: "Nombre attendu"}})
        return int(num) if num.is_integer() else num
    if ftype == "boolean":
        return bool(value)
    if ftype == "richtext":
        return sanitize_html(str(value))
    if ftype == "select":
        allowed = {o["value"] if isinstance(o, dict) else o[0]
                   for o in field.config.get("options", [])}
        if allowed and value not in allowed:
            raise APIException("Valeur non autorisée", status_code=422,
                               payload={"errors": {field.key: "Choix invalide"}})
        return value
    if ftype == "relation":
        try:
            return int(value)
        except (TypeError, ValueError):
            raise APIException("Relation invalide", status_code=422,
                               payload={"errors": {field.key: "Identifiant attendu"}})
    if ftype == "date":
        if isinstance(value, (date, datetime)):
            return value.isoformat()
        return str(value)
    return str(value)


def validate_entry_data(ct: ContentType, data: dict) -> tuple[dict, str | None]:
    """Validate/coerce a payload against a type's fields; return (clean, title)."""
    clean: dict = {}
    errors: dict[str, str] = {}
    title = None
    for field in ct.fields:
        value = _coerce(field, (data or {}).get(field.key))
        if field.required and (value is None or value == ""):
            errors[field.key] = "Ce champ est requis"
            continue
        clean[field.key] = value
        if field.is_title and value is not None:
            title = str(value)
    if errors:
        raise APIException("Validation échouée", status_code=422, payload={"errors": errors})
    return clean, title


# ── Entries ─────────────────────────────────────────────────────────
def entries_query(ct: ContentType, *, trashed: bool = False):
    base = ContentEntry.query_trashed() if trashed else ContentEntry.query_active()
    return base.filter(ContentEntry.content_type_id == ct.id)


def get_entry_or_404(ct: ContentType, entry_id: int) -> ContentEntry:
    entry = entries_query(ct).filter(ContentEntry.id == entry_id).first()
    if entry is None:
        raise APIException("Entrée introuvable", status_code=404)
    return entry


def _notify_published(ct: ContentType, entry: ContentEntry) -> None:
    from app.services import webhook_service
    webhook_service.dispatch("entry.published", {"type": ct.slug, **entry.to_dict()})


def create_entry(ct: ContentType, payload: dict) -> ContentEntry:
    clean, title = validate_entry_data(ct, payload.get("data") or {})
    entry = ContentEntry(
        content_type_id=ct.id, title=title, data=clean,
        status=payload.get("status", "draft"), locale=payload.get("locale", "fr"),
        seo=payload.get("seo") or {})
    entry.save()
    if entry.status == "published":
        _notify_published(ct, entry)
    return entry


def update_entry(ct: ContentType, entry_id: int, payload: dict) -> ContentEntry:
    entry = get_entry_or_404(ct, entry_id)
    was_published = entry.status == "published"
    if "data" in payload:
        clean, title = validate_entry_data(ct, payload["data"] or {})
        entry.data = clean
        entry.title = title
    for key in ("status", "locale", "seo"):
        if key in payload:
            setattr(entry, key, payload[key])
    db.session.commit()
    if entry.status == "published" and not was_published:
        _notify_published(ct, entry)
    return entry
