"""Page input validation (marshmallow). Output uses ``Page.to_dict()``."""
from __future__ import annotations

from marshmallow import EXCLUDE, Schema, fields, validate

from app.models.page import STATUSES


class SeoSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    meta_title = fields.String(load_default=None, allow_none=True)
    meta_description = fields.String(load_default=None, allow_none=True)
    canonical = fields.String(load_default=None, allow_none=True)
    robots = fields.String(load_default="index,follow")
    og_title = fields.String(load_default=None, allow_none=True)
    og_description = fields.String(load_default=None, allow_none=True)
    og_image = fields.String(load_default=None, allow_none=True)
    twitter_card = fields.String(load_default="summary_large_image")


class PageSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    title = fields.String(required=True, validate=validate.Length(min=1, max=200))
    slug = fields.String(load_default=None, allow_none=True)
    status = fields.String(load_default="draft", validate=validate.OneOf(STATUSES))
    locale = fields.String(load_default="fr")
    is_home = fields.Boolean(load_default=False)
    published_at = fields.DateTime(load_default=None, allow_none=True)
    scheduled_at = fields.DateTime(load_default=None, allow_none=True)
    seo = fields.Nested(SeoSchema, load_default=dict)
    # Blocks are validated by app.services.blocks.validate_blocks in the service.
    blocks = fields.List(fields.Dict(), load_default=list)


page_schema = PageSchema()
