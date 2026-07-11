"""Partner schema (marshmallow-sqlalchemy auto-schema)."""
from __future__ import annotations

from app.extensions import ma
from app.models.partner import Partner


class PartnerSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Partner
        load_instance = False
        exclude = ("deleted_at",)

    id = ma.auto_field(dump_only=True)
    created_at = ma.auto_field(dump_only=True)
    updated_at = ma.auto_field(dump_only=True)


partner_schema = PartnerSchema()
