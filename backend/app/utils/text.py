"""Small text helpers."""
from __future__ import annotations

import re
import unicodedata


def slugify(value: str) -> str:
    """URL-friendly slug: ascii, lowercase, hyphen-separated."""
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode()
    value = re.sub(r"[^\w\s-]", "", value).strip().lower()
    return re.sub(r"[-\s]+", "-", value) or "page"
