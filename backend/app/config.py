"""Application configuration for Marveen CMS.

Central, typed configuration loaded from environment variables. A single base
class holds every setting with a sensible default; the environment-specific
subclasses override only what differs. ``get_config()`` resolves the right one
from ``APP_ENV`` / ``FLASK_ENV``.

Security stance: no production secret is ever hard-coded. In production the
app refuses to boot unless ``SECRET_KEY`` (and, if set apart, the JWT key) come
from the environment — see :meth:`Config.validate`.
"""
from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path

# backend/ (this file is backend/app/config.py → parents[1] == backend/)
BASE_DIR: Path = Path(__file__).resolve().parents[1]


def _bool(name: str, default: bool = False) -> bool:
    """Read a truthy/falsy environment variable."""
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _list(name: str, default: list[str] | None = None) -> list[str]:
    """Read a comma-separated environment variable into a list."""
    raw = os.getenv(name)
    if not raw:
        return list(default or [])
    return [item.strip() for item in raw.split(",") if item.strip()]


def _normalize_db_url(url: str | None) -> str | None:
    """Normalize a Postgres URL (``postgres://`` → ``postgresql://``)."""
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    """Base configuration shared by every environment."""

    # ── Core ────────────────────────────────────────────────────────
    ENV: str = "production"
    DEBUG: bool = False
    TESTING: bool = False
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-insecure-change-me")

    # ── Database (PostgreSQL; SQLite fallback for local/dev only) ────
    SQLALCHEMY_DATABASE_URI: str = (
        _normalize_db_url(os.getenv("DATABASE_URL"))
        or f"sqlite:///{BASE_DIR / 'marveen_dev.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ENGINE_OPTIONS: dict = {
        "pool_pre_ping": True,  # drop dead connections instead of erroring
    }

    # ── JWT (access + refresh in httpOnly cookies, with CSRF) ────────
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY") or SECRET_KEY
    JWT_TOKEN_LOCATION: list[str] = ["cookies"]
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_MINUTES", "15")))
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(
        days=int(os.getenv("JWT_REFRESH_DAYS", "30")))
    JWT_COOKIE_SECURE: bool = _bool("JWT_COOKIE_SECURE", default=True)  # HTTPS only
    JWT_COOKIE_SAMESITE: str = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
    JWT_COOKIE_CSRF_PROTECT: bool = True
    JWT_ACCESS_COOKIE_PATH: str = "/"
    JWT_REFRESH_COOKIE_PATH: str = "/api/auth/refresh"

    # ── CORS (cookies require an explicit origin list, never "*") ────
    CORS_ORIGINS: list[str] = _list(
        "CORS_ORIGINS", ["http://localhost:5173", "http://localhost:3000"])

    # ── Media / uploads ─────────────────────────────────────────────
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads")))
    MEDIA_DIR: Path = Path(os.getenv("MEDIA_DIR", str(BASE_DIR / "media")))
    MAX_CONTENT_LENGTH: int = int(os.getenv("MAX_CONTENT_MB", "50")) * 1024 * 1024
    ALLOWED_IMAGE_EXTENSIONS: set[str] = {"jpg", "jpeg", "png", "webp", "gif", "svg"}
    ALLOWED_DOC_EXTENSIONS: set[str] = {"pdf"}
    ALLOWED_VIDEO_EXTENSIONS: set[str] = {"mp4", "webm"}

    # ── API conventions ─────────────────────────────────────────────
    PAGINATION_DEFAULT: int = 20
    PAGINATION_MAX: int = 100

    # ── i18n ────────────────────────────────────────────────────────
    DEFAULT_LOCALE: str = os.getenv("DEFAULT_LOCALE", "fr")
    SUPPORTED_LOCALES: list[str] = _list("SUPPORTED_LOCALES", ["fr", "en"])

    @classmethod
    def validate(cls) -> None:
        """Fail fast on unsafe production configuration."""
        if cls.ENV == "production":
            if cls.SECRET_KEY == "dev-insecure-change-me":
                raise RuntimeError(
                    "SECRET_KEY must be set from the environment in production.")
            if not os.getenv("DATABASE_URL"):
                raise RuntimeError(
                    "DATABASE_URL (PostgreSQL) is required in production.")

    @classmethod
    def init_dirs(cls) -> None:
        """Ensure upload/media directories exist."""
        cls.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cls.MEDIA_DIR.mkdir(parents=True, exist_ok=True)


class DevelopmentConfig(Config):
    ENV = "development"
    DEBUG = True
    JWT_COOKIE_SECURE = False  # allow http://localhost


class TestingConfig(Config):
    ENV = "testing"
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_COOKIE_SECURE = False


class ProductionConfig(Config):
    ENV = "production"
    # Larger pool for concurrent traffic; recycle stale connections.
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
        "pool_recycle": 1800,
    }


_CONFIGS: dict[str, type[Config]] = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config() -> type[Config]:
    """Select the configuration class from APP_ENV / FLASK_ENV (default: development)."""
    env = (os.getenv("APP_ENV") or os.getenv("FLASK_ENV") or "development").lower()
    return _CONFIGS.get(env, DevelopmentConfig)
