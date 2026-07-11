"""Settings domain logic: read-as-map and upsert-by-key."""
from __future__ import annotations

from app.extensions import db
from app.models.setting import Setting


def get_all() -> dict:
    return {s.key: s.value for s in Setting.query_active().all()}


def get_public() -> dict:
    rows = Setting.query_active().filter(Setting.is_public.is_(True)).all()
    return {s.key: s.value for s in rows}


def upsert(key: str, value, *, group: str | None = None,
           is_public: bool | None = None) -> Setting:
    setting = Setting.query_active().filter(Setting.key == key).first()
    if setting is None:
        setting = Setting(key=key, value=value, group=group,
                          is_public=bool(is_public))
        db.session.add(setting)
    else:
        setting.value = value
        if group is not None:
            setting.group = group
        if is_public is not None:
            setting.is_public = is_public
    db.session.commit()
    return setting
