"""Generic REST blueprint builder.

``build_crud_blueprint`` wires the standard endpoints (list, get, create,
update, soft-delete, restore, trash, purge) for a model, each guarded by the
matching ``module.action`` permission. A new module is one call.
"""
from __future__ import annotations

from flask import Blueprint, request

from app.permissions.decorators import require_permission
from app.services.crud_service import CRUDService
from app.utils.responses import ok, paginate


def build_crud_blueprint(*, name: str, model, schema, module: str,
                         searchable=(), sortable=(), filterable=(),
                         default_sort: str = "id",
                         base_filters: dict | None = None,
                         defaults: dict | None = None) -> Blueprint:
    bp = Blueprint(name, __name__)
    service = CRUDService(model, searchable=searchable, sortable=sortable,
                          filterable=filterable, default_sort=default_sort,
                          base_filters=base_filters, defaults=defaults)

    @bp.get("")
    @require_permission(f"{module}.view")
    def list_items():
        return paginate(service.list_query(), schema=schema)

    @bp.get("/trash")
    @require_permission(f"{module}.view")
    def list_trash():
        return paginate(service.list_query(trashed=True), schema=schema)

    @bp.get("/<int:item_id>")
    @require_permission(f"{module}.view")
    def get_item(item_id):
        return ok(schema.dump(service.get_or_404(item_id)))

    @bp.post("")
    @require_permission(f"{module}.create")
    def create_item():
        data = schema.load(request.get_json(silent=True) or {})
        return ok(schema.dump(service.create(data)), status=201)

    @bp.patch("/<int:item_id>")
    @require_permission(f"{module}.update")
    def update_item(item_id):
        data = schema.load(request.get_json(silent=True) or {}, partial=True)
        return ok(schema.dump(service.update(item_id, data)))

    @bp.delete("/<int:item_id>")
    @require_permission(f"{module}.delete")
    def delete_item(item_id):
        service.soft_delete(item_id)
        return ok(message="Déplacé dans la corbeille")

    @bp.post("/<int:item_id>/restore")
    @require_permission(f"{module}.update")
    def restore_item(item_id):
        return ok(schema.dump(service.restore(item_id)))

    @bp.delete("/<int:item_id>/purge")
    @require_permission(f"{module}.delete")
    def purge_item(item_id):
        service.purge(item_id)
        return ok(message="Supprimé définitivement")

    return bp
