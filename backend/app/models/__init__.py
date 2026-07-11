"""Models package.

Import every model here as it is added so that ``from app import models``
exposes them and Alembic autogenerate sees the complete metadata.
"""
from app.models.base import BaseModel, ensure_aware, utcnow
from app.models.faq import Faq
from app.models.page import Page
from app.models.partner import Partner
from app.models.user import Permission, Role, TokenBlocklist, User

__all__ = [
    "BaseModel", "utcnow", "ensure_aware",
    "User", "Role", "Permission", "TokenBlocklist",
    "Faq", "Partner", "Page",
]
