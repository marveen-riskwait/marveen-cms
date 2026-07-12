"""User input validation (marshmallow). Output uses ``User.to_dict()``.

Create requires an email + password; update is partial and may include a new
password. ``role_ids`` assigns roles by id; the service resolves them.
"""
from __future__ import annotations

from marshmallow import EXCLUDE, Schema, fields, validate


class UserCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))
    first_name = fields.String(load_default=None, allow_none=True)
    last_name = fields.String(load_default=None, allow_none=True)
    is_active = fields.Boolean(load_default=True)
    is_superadmin = fields.Boolean(load_default=False)
    role_ids = fields.List(fields.Integer(), load_default=list)


class UserUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email()
    password = fields.String(validate=validate.Length(min=8, max=128))
    first_name = fields.String(allow_none=True)
    last_name = fields.String(allow_none=True)
    is_active = fields.Boolean()
    is_superadmin = fields.Boolean()
    role_ids = fields.List(fields.Integer())


user_create_schema = UserCreateSchema()
user_update_schema = UserUpdateSchema()
