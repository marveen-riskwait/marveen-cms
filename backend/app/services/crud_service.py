"""Generic CRUD service — the reusable engine behind every content module.

Given a model, it builds list queries with **search**, **filters**, **sort**
and pagination (all from the query string), plus get/create/update and
soft-delete / restore / purge (the trash). Modules stay a few lines: a model,
a schema and one blueprint registration.
"""
from __future__ import annotations

from typing import Iterable

from flask import request
from sqlalchemy import asc, desc, or_

from app.extensions import db
from app.models.base import BaseModel
from app.utils.errors import APIException


def _coerce(value: str):
    """Coerce a query-string value to bool/int when it obviously is one."""
    low = value.lower()
    if low in ("true", "false"):
        return low == "true"
    if value.lstrip("-").isdigit():
        return int(value)
    return value


class CRUDService:
    def __init__(self, model: type[BaseModel], *,
                 searchable: Iterable[str] = (), sortable: Iterable[str] = (),
                 filterable: Iterable[str] = (), default_sort: str = "id",
                 base_filters: dict | None = None, defaults: dict | None = None) -> None:
        self.model = model
        self.searchable = tuple(searchable)
        self.sortable = tuple(sortable) + ("id",)
        self.filterable = tuple(filterable)
        self.default_sort = default_sort
        # Fixed equality filters applied to every query (e.g. section="blog"),
        # and column defaults injected on create — lets several views share a table.
        self.base_filters = dict(base_filters or {})
        self.defaults = dict(defaults or {})

    def _scope(self, *, trashed: bool):
        query = self.model.query_trashed() if trashed else self.model.query_active()
        for field, value in self.base_filters.items():
            query = query.filter(getattr(self.model, field) == value)
        return query

    # ── Query building (list endpoint) ──────────────────────────────
    def _search(self, query):
        term = (request.args.get("q") or "").strip()
        if term and self.searchable:
            like = f"%{term}%"
            query = query.filter(or_(*[getattr(self.model, f).ilike(like)
                                       for f in self.searchable]))
        return query

    def _filter(self, query):
        for field in self.filterable:
            if field in request.args:
                query = query.filter(
                    getattr(self.model, field) == _coerce(request.args[field]))
        return query

    def _sort(self, query):
        raw = request.args.get("sort") or self.default_sort
        field = raw.lstrip("-")
        if field not in self.sortable:
            field = self.default_sort
        direction = desc if raw.startswith("-") else asc
        return query.order_by(direction(getattr(self.model, field)))

    def list_query(self, *, trashed: bool = False):
        return self._sort(self._filter(self._search(self._scope(trashed=trashed))))

    # ── Single-item operations ──────────────────────────────────────
    def get_or_404(self, item_id: int, *, trashed: bool = False):
        obj = self._scope(trashed=trashed).filter(self.model.id == item_id).first()
        if obj is None:
            raise APIException("Ressource introuvable", status_code=404)
        return obj

    def create(self, data: dict):
        return self.model(**{**self.defaults, **data}).save()

    def update(self, item_id: int, data: dict):
        obj = self.get_or_404(item_id)
        for key, value in data.items():
            setattr(obj, key, value)
        db.session.commit()
        return obj

    def soft_delete(self, item_id: int) -> None:
        self.get_or_404(item_id).soft_delete()

    def restore(self, item_id: int):
        return self.get_or_404(item_id, trashed=True).restore()

    def purge(self, item_id: int) -> None:
        self.get_or_404(item_id, trashed=True).hard_delete()
