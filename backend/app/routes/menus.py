"""Public menu read (admin CRUD is the generic blueprint)."""
from __future__ import annotations

from flask import Blueprint

from app.models.menu import Menu
from app.utils.errors import APIException
from app.utils.responses import ok

public_menus_bp = Blueprint("public_menus", __name__)


@public_menus_bp.get("/menus/<location>")
def public_menu(location):
    menu = Menu.query_active().filter(Menu.location == location).first()
    if menu is None:
        raise APIException("Menu introuvable", status_code=404)
    return ok(menu.to_dict())
