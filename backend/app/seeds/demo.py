"""Demo dataset — a ready-to-browse "RDV Cycles" site (theme + data).

Idempotent: safe to run repeatedly (existing rows are left untouched). Populates
settings, menus, pages (incl. a published home), blog, FAQ, testimonials,
partners/brands and a custom "Vélo" content type with entries — so the public
site and admin are full straight away.

Run with:  ``flask seed-demo``
"""
from __future__ import annotations

from app.extensions import db
from app.models.article import Article
from app.models.brand import Brand
from app.models.faq import Faq
from app.models.menu import Menu
from app.models.page import Page
from app.models.partner import Partner
from app.models.testimonial import Testimonial
from app.services import content_service, page_service, settings_service
from app.utils.text import slugify


def _settings() -> None:
    values = {
        "site_name": ("RDV Cycles", "general"),
        "site_tagline": ("Location de vélos au lac du Salagou", "general"),
        "primary_color": ("#2f9e63", "general"),
        "contact_email": ("contact@rdv-cycles.fr", "contact"),
        "contact_phone": ("+33 4 67 00 00 00", "contact"),
        "contact_address": ("Lac du Salagou, 34800 Clermont-l'Hérault", "contact"),
        "social_facebook": ("https://facebook.com/rdvcycles", "social"),
        "social_instagram": ("https://instagram.com/rdvcycles", "social"),
        "default_meta_description": (
            "Louez un vélo électrique ou musculaire au lac du Salagou, à l'heure, "
            "à la journée ou à la semaine.", "seo"),
        # Global theme (see config/theme.js) — restyles the whole public site.
        "theme_color_primary": ("#2f9e63", "theme"),
        "theme_color_secondary": ("#29abe2", "theme"),
        "theme_color_accent": ("#f59e0b", "theme"),
        "theme_color_bg": ("#ffffff", "theme"),
        "theme_color_text": ("#16181d", "theme"),
        "theme_font_heading": ("Poppins", "theme"),
        "theme_font_body": ("Inter", "theme"),
        "theme_radius": ("14", "theme"),
        "theme_button_style": ("pill", "theme"),
        "theme_container": ("1120", "theme"),
    }
    for key, (value, group) in values.items():
        settings_service.upsert(key, value, group=group, is_public=True)


def _menus() -> None:
    if Menu.query_active().filter_by(location="header").first() is None:
        Menu(name="Menu principal", location="header", items=[
            {"label": "Accueil", "url": "/", "children": []},
            {"label": "Nos vélos", "url": "/nos-velos", "children": [
                {"label": "Électriques", "url": "/nos-velos#electriques", "children": []},
                {"label": "Musculaires", "url": "/nos-velos#musculaires", "children": []},
            ]},
            {"label": "Parcours", "url": "/parcours", "children": []},
            {"label": "Blog", "url": "/blog", "children": []},
            {"label": "Contact", "url": "/contact", "children": []},
        ]).save()
    if Menu.query_active().filter_by(location="footer").first() is None:
        Menu(name="Pied de page", location="footer", items=[
            {"label": "Mentions légales", "url": "/mentions-legales", "children": []},
            {"label": "Contact", "url": "/contact", "children": []},
        ]).save()


def _page(slug: str, data: dict) -> None:
    if Page.query_active().filter_by(slug=slug).first() is None:
        page_service.create_page({**data, "slug": slug})


def _pages() -> None:
    _page("accueil", {
        "title": "Accueil", "status": "published", "is_home": True,
        "seo": {"meta_title": "RDV Cycles — Location de vélos au lac du Salagou",
                "meta_description": "Vélos électriques et musculaires à louer autour du lac du Salagou."},
        "blocks": [
            {"type": "hero", "data": {
                "title": "Roulez au lac du Salagou",
                "subtitle": "Vélos électriques et musculaires, à la demi-journée, journée ou semaine.",
                "cta_label": "Réserver un vélo", "cta_url": "/nos-velos"}},
            {"type": "text", "data": {"html": (
                "<h2>Bienvenue chez RDV Cycles</h2><p>Notre flotte est entretenue "
                "quotidiennement pour vous garantir des balades en toute sérénité. "
                "Électrique ou musculaire, il y a un vélo pour chaque envie.</p>")}},
            {"type": "quote", "data": {
                "text": "Une expérience inoubliable autour du lac, matériel impeccable.",
                "author": "Client vérifié"}},
            {"type": "cta", "data": {"label": "Voir la grille tarifaire",
                                     "url": "/tarifs", "style": "secondary"}},
        ]})
    _page("nos-velos", {
        "title": "Nos vélos", "status": "published",
        "blocks": [
            {"type": "hero", "data": {"title": "Nos vélos", "subtitle": "Électriques et musculaires"}},
            {"type": "text", "data": {"html": (
                "<h2 id='electriques'>Vélos électriques</h2><p>Assistance jusqu'à 25 km/h, "
                "autonomie confortable pour faire le tour du lac.</p>"
                "<h2 id='musculaires'>Vélos musculaires</h2><p>Légers et robustes, "
                "parfaits pour les sportifs.</p>")}},
        ]})
    _page("contact", {
        "title": "Contact", "status": "published",
        "blocks": [
            {"type": "hero", "data": {"title": "Nous contacter"}},
            {"type": "text", "data": {"html": (
                "<p>Lac du Salagou, 34800 Clermont-l'Hérault<br>"
                "Téléphone : +33 4 67 00 00 00<br>Email : contact@rdv-cycles.fr</p>")}},
        ]})


def _article(title: str, category: str, excerpt: str, featured: bool = False) -> None:
    slug = slugify(title)
    if Article.query_active().filter_by(slug=slug, section="blog").first() is None:
        Article(section="blog", title=title, slug=slug, category=category,
                excerpt=excerpt, status="published", is_featured=featured,
                content=f"<p>{excerpt}</p><p>Contenu de démonstration pour l'article.</p>",
                tags=[category]).save()


def _blog() -> None:
    _article("5 parcours à vélo autour du lac du Salagou", "Parcours",
             "Nos itinéraires préférés pour découvrir le lac, du plus facile au plus sportif.", True)
    _article("Électrique ou musculaire : lequel choisir ?", "Conseils",
             "Tout dépend de votre condition physique et du dénivelé prévu.")
    _article("Bien préparer sa sortie vélo en été", "Conseils",
             "Eau, crème solaire, casque : nos recommandations pour rouler serein.")


def _faq() -> None:
    faqs = [
        ("Faut-il réserver à l'avance ?", "C'est conseillé en haute saison, mais les réservations de dernière minute restent possibles selon disponibilité.", "Réservation"),
        ("Quels moyens de paiement acceptez-vous ?", "Carte bancaire et espèces. Une empreinte CB est demandée en caution.", "Paiement"),
        ("Le casque est-il fourni ?", "Oui, un casque est fourni gratuitement avec chaque location.", "Équipement"),
        ("Peut-on annuler une réservation ?", "Oui, jusqu'à 24h avant sans frais.", "Réservation"),
    ]
    for i, (q, a, cat) in enumerate(faqs):
        if Faq.query_active().filter_by(question=q).first() is None:
            Faq(question=q, answer=a, category=cat, sort_order=i, is_published=True).save()


def _testimonials() -> None:
    rows = [
        ("Julie M.", "Clermont-l'Hérault", "Super accueil et vélos nickel. On a adoré le tour du lac !", 5),
        ("Marc D.", "Montpellier", "Vélos électriques au top, parfaits pour les enfants.", 5),
        ("Sophie L.", "Béziers", "Réservation simple, tarifs honnêtes. Je recommande.", 4),
    ]
    for i, (author, role, quote, rating) in enumerate(rows):
        if Testimonial.query_active().filter_by(author_name=author).first() is None:
            Testimonial(author_name=author, role=role, quote=quote, rating=rating,
                        sort_order=i, is_published=True).save()


def _partners_brands() -> None:
    for i, name in enumerate(["Office de Tourisme du Salagou", "Camping du Lac"]):
        if Partner.query_active().filter_by(name=name).first() is None:
            Partner(name=name, sort_order=i, is_published=True).save()
    for i, name in enumerate(["Moustache Bikes", "Decathlon"]):
        if Brand.query_active().filter_by(name=name).first() is None:
            Brand(name=name, sort_order=i, is_published=True).save()


def _velo_type() -> None:
    try:
        content_service.get_type_by_slug("velo")
        return  # already present
    except Exception:  # noqa: BLE001
        pass
    ct = content_service.create_type({
        "name": "Vélo", "slug": "velo", "icon": "bi-bicycle",
        "description": "Le catalogue de vélos à la location.",
        "fields": [
            {"key": "nom", "label": "Nom", "field_type": "text", "required": True, "is_title": True},
            {"key": "prix_jour", "label": "Prix / jour (€)", "field_type": "number"},
            {"key": "electrique", "label": "Électrique", "field_type": "boolean"},
            {"key": "categorie", "label": "Catégorie", "field_type": "select",
             "config": {"options": [{"value": "vtt", "label": "VTT"},
                                    {"value": "route", "label": "Route"},
                                    {"value": "ville", "label": "Ville"}]}},
            {"key": "description", "label": "Description", "field_type": "textarea"},
        ]})
    entries = [
        {"nom": "Turbo Lac (électrique)", "prix_jour": 45, "electrique": True, "categorie": "vtt",
         "description": "VTT électrique tout-terrain, idéal pour le dénivelé."},
        {"nom": "Balade Confort", "prix_jour": 25, "electrique": False, "categorie": "ville",
         "description": "Vélo de ville confortable pour les promenades tranquilles."},
        {"nom": "Route Pro", "prix_jour": 35, "electrique": False, "categorie": "route",
         "description": "Vélo de route léger pour les sportifs."},
        {"nom": "Kid 24", "prix_jour": 15, "electrique": False, "categorie": "ville",
         "description": "Vélo enfant 24 pouces."},
    ]
    for data in entries:
        content_service.create_entry(ct, {"status": "published", "data": data})


def seed_demo() -> None:
    _settings()
    _menus()
    _pages()
    _blog()
    _faq()
    _testimonials()
    _partners_brands()
    _velo_type()
    db.session.commit()
