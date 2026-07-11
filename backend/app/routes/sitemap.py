"""SEO endpoints: sitemap.xml and robots.txt (public, non-JSON).

The sitemap lists published pages, articles (blog + news) and events. The base
URL is taken from the request host so it works in any environment.
"""
from __future__ import annotations

from flask import Blueprint, Response, request

from app.models.article import Article
from app.models.event import Event
from app.models.page import Page

seo_bp = Blueprint("seo", __name__)


def _url(base: str, path: str) -> str:
    return f"{base.rstrip('/')}{path}"


@seo_bp.get("/sitemap.xml")
def sitemap():
    base = request.host_url.rstrip("/")
    entries: list[str] = []

    def add(path: str):
        entries.append(f"<url><loc>{_url(base, path)}</loc></url>")

    for page in Page.query_active().filter(Page.status == "published"):
        add("/" if page.is_home else f"/{page.slug}")
    for article in Article.query_active().filter(Article.status == "published"):
        prefix = "actualites" if article.section == "news" else "blog"
        add(f"/{prefix}/{article.slug or article.id}")
    for event in Event.query_active().filter(Event.status == "published"):
        add(f"/evenements/{event.slug or event.id}")

    xml = ('<?xml version="1.0" encoding="UTF-8"?>'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
           + "".join(entries) + "</urlset>")
    return Response(xml, mimetype="application/xml")


@seo_bp.get("/robots.txt")
def robots():
    base = request.host_url.rstrip("/")
    body = f"User-agent: *\nAllow: /\nSitemap: {base}/sitemap.xml\n"
    return Response(body, mimetype="text/plain")
