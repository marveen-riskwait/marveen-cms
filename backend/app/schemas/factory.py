"""Schema factory — build a marshmallow auto-schema for a model in one call.

Keeps simple content modules DRY: ``make_schema(Model)`` yields a schema with
id/timestamps dump-only and ``deleted_at`` excluded.
"""
from __future__ import annotations

from app.extensions import ma


def make_schema(model_cls, *, exclude: tuple[str, ...] = ("deleted_at",)):
    class _AutoSchema(ma.SQLAlchemyAutoSchema):
        class Meta:
            model = model_cls
            load_instance = False

        id = ma.auto_field(dump_only=True)
        created_at = ma.auto_field(dump_only=True)
        updated_at = ma.auto_field(dump_only=True)

    _AutoSchema.Meta.exclude = exclude
    return _AutoSchema()
