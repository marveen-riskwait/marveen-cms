"""FAQ schema (marshmallow-sqlalchemy auto-schema)."""
from __future__ import annotations

from app.extensions import ma
from app.models.faq import Faq


class FaqSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Faq
        load_instance = False
        exclude = ("deleted_at",)

    id = ma.auto_field(dump_only=True)
    created_at = ma.auto_field(dump_only=True)
    updated_at = ma.auto_field(dump_only=True)


faq_schema = FaqSchema()
