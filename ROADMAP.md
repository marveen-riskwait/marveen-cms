# Marveen CMS — Plan de développement « Révolution »

> **North star** — Le CMS **AI-native, headless et multi-site** où créer *et
> livrer* un site est plus rapide, plus intelligent et plus sûr que partout
> ailleurs. RDV Cycles reste le premier **thème + jeu de données**, jamais le
> produit.

Ce document est le plan **exact** : chaque phase a un objectif, un périmètre
(fichiers/tables/endpoints), des tâches concrètes, des critères d'acceptation et
des tests. On avance par **incréments livrables** : chaque incrément est codé
(code de production, pas de pseudo-code), testé de bout en bout, puis poussé.

## Principes transverses (non négociables)

- **Code de production uniquement** — typé, propre, documenté, modulaire, DRY /
  KISS / SOLID.
- **Descriptif d'abord** — un module = une entrée de config (`resources.js`),
  un bloc = une entrée (`blocks.js`), un réglage = une entrée (`settings.js`).
  On étend le *registre*, pas le *code*.
- **Definition of Done** par incrément : (1) code, (2) migration si schéma,
  (3) test automatisé vert, (4) build front vert, (5) drive E2E réel + capture,
  (6) commit + push.
- **Compat ascendante** de l'API publique (`/api/public/*`) une fois figée.

## État actuel (point de départ)

✅ Auth + RBAC · Dashboard · Pages + Page Builder (blocs JSON, SEO) · Blog ·
Actualités · Catégories · FAQ · Témoignages · Événements · Documents ·
Médiathèque (WebP + miniatures) + sélecteur · Partenaires · Marques · Équipe ·
Menus · Paramètres · Utilisateurs & rôles.

❌ Pas de site public rendu · pas de tests committés/CI · contenu codé en dur ·
pas d'édition riche/versionnée · pas d'IA · Corbeille/Logs/Historique/Sauvegardes
non matérialisés.

---

## Phase 0 — Filet de sécurité & industrialisation

*But : rendre tout le reste sûr. Rien de visible, tout de crédible.*

**Backend — tests (`backend/tests/`)**
- `conftest.py` : fixtures `app` (config test, SQLite mémoire), `db`, `client`,
  `auth_client` (login + helper d'extraction CSRF), `as_role(role)`.
- Suites : `test_auth.py` (login/refresh/logout/blocklist), `test_rbac.py`
  (require_permission, superadmin bypass), `test_crud_engine.py` (search/sort/
  filter/pagination, base_filters/defaults), `test_blocks.py` (validate_blocks,
  types stricts + inconnus), `test_media.py` (upload WebP + miniature),
  `test_settings.py` (upsert + public), `test_users.py` (garde-fous : self,
  dernier super-admin), `test_menus.py` (arbre round-trip), `test_pages.py`
  (slug unique, publication).
- Outillage : `pytest`, `pytest-cov`. Cible **≥ 80 %** sur `services/` et
  `routes/`.

**Frontend — E2E (`frontend/tests/e2e/`)**
- Formaliser les drives Playwright déjà écrits (login, CRUD FAQ, médiathèque,
  page builder, users, settings, menus) en une suite `@playwright/test`.
- `playwright.config.ts` (webServer : backend + vite), exécutable en CI.

**CI (`.github/workflows/ci.yml`)**
- Job **backend** : setup Python 3.13 → `pip install` → `flask db upgrade` →
  `flask seed` → `pytest --cov`.
- Job **frontend** : `npm ci` → `npm run build` → `npx playwright test`.
- Statuts requis sur PR.

**DX / reproductibilité**
- `docker-compose.yml` : `db` (Postgres 16), `api` (Flask/Gunicorn), `admin`
  (build Vite servi en statique). `make up` / `make seed` / `make test`.
- `config.validate()` appelée au boot ; `.env.example` complété + documenté.

**Acceptation** : CI verte sur une PR ; `docker compose up` donne une stack
fonctionnelle ; couverture publiée.

---

## Phase 1 — Livraison publique + Preview

*But : enfin **voir** un site produit par le CMS. Un CMS se juge à ses vitrines.*

**Nouveau paquet `web/` (site public, SSR/SSG)**
- **Next.js** (App Router) consommant l'API publique — SSR/SSG pour un SEO
  irréprochable (aligné avec la vision d'origine Next + headless).
- **Renderer de blocs** 1:1 avec le registre : `components/blocks/{Hero,Text,
  Image,Gallery,Quote,Cta,Video,Html}.tsx`. Un mappe `type -> composant`.
- Data layer : `getPage(slug, locale)` → `/api/public/pages/:slug`,
  `getMenu(location)`, `getSettings()`.
- **Thème RDV Cycles** comme premier consommateur (couleurs, logo, typo depuis
  les Paramètres).

**Backend — preview des brouillons**
- Endpoint signé : `GET /api/public/preview/<slug>?token=...` — un JWT court
  (scope `preview`, id de page) qui **bypass `is_public`**.
- Bouton « Prévisualiser » dans le Page Builder → ouvre l'URL preview.

**SEO natif**
- `sitemap.xml` / `robots.txt` (déjà en place) branchés sur les pages publiées.
- **JSON-LD** structuré par page (`Organization`, `BreadcrumbList`, `Article`).
- Balises `meta` + Open Graph depuis `page.seo` et les réglages.
- Gestionnaire de **redirections** (`redirect` table : from/to/status).

**Acceptation** : une page publiée s'affiche publiquement avec meta+OG+JSON-LD
corrects ; un brouillon n'est visible **que** via son lien de preview signé ;
Lighthouse SEO ≥ 95 sur une page de démo.

---

## Phase 2 — Expérience d'édition de niveau Webflow

*But : l'effet « waouh » ressenti par l'éditeur.*

- **WYSIWYG** (TipTap) pour les blocs riches (text/quote) — sortie HTML
  assainie côté serveur (`bleach`), stockage inchangé.
- **Drag & drop** des blocs (dnd-kit) en remplacement des flèches ; poignée +
  réordonnancement fluide, dnd aussi pour la médiathèque et la galerie.
- **Auto-save** : PATCH debouncé (indicateur « Enregistré / Modifié »).
- **Historique de versions** : table `page_revision` (page_id, author_id,
  snapshot JSON, created_at) ; panneau « Historique » avec **diff** et
  **restauration**. Matérialise le module « Historique » du cahier des charges.
- **Preview live** : volet latéral rendant le renderer public en temps réel
  (split view édition / aperçu).

**Acceptation** : une modification est auto-sauvegardée ; on restaure une
version antérieure ; on réordonne les blocs au drag ; l'aperçu reflète l'état
courant.

---

## Phase 3 — Modèle de contenu ouvert (le saut plateforme)

*But : l'utilisateur définit ses **propres** types de contenu, sans code.*

- **Content-Type Builder** : tables `content_type` (name, slug, icon,
  is_singleton) et `field_definition` (type_id, key, label, field_type,
  config JSON, required, order).
- Types de champs : `text`, `richtext`, `number`, `boolean`, `date`, `media`,
  `select`, `relation` (vers un autre type), `component` répétable.
- **Stockage** : entrées génériques `content_entry` (type_id, locale, status,
  data JSONB, seo JSONB) — flexible, indexable (GIN sur `data`).
- **Admin auto-généré** : on **réutilise** l'UI pilotée par descriptifs — le
  Content-Type builder produit dynamiquement le descriptif `resources`-like.
- **API auto** : `/api/content/:type` (CRUD + filtres) générée à partir des
  définitions ; validation dynamique (marshmallow construit à la volée).
- **Relations** résolues à la lecture (expand configurable).

**Acceptation** : créer un type « Vélo » avec champs (nom, prix, photos,
catégorie=relation) dans l'UI → CRUD admin + endpoints API disponibles
**sans redéploiement**.

---

## Phase 4 — AI-native (le différenciateur)

*But : l'IA tissée dans le flux d'édition, pas bolt-on.*

- **Service Claude** (`services/ai_service.py`, SDK Anthropic) — clé via
  Paramètres/env, streaming, garde-fous, plafond de coût, logs d'usage.
- **Assistant de bloc** : rédiger / réécrire / raccourcir / changer de ton au
  niveau d'un bloc riche.
- **Alt d'images** auto à l'upload (vision) + **meta description SEO** suggérée.
- **Traduction** multilingue en un clic (exploite `locale`) — workflow
  brouillon traduit à valider.
- **Recherche sémantique** back-office : embeddings + **pgvector**, index sur
  `content_entry` / pages / médias.
- **Suggestions SEO** contextuelles (titre, densité, lisibilité).

**Acceptation** : depuis un bloc, « Améliorer » / « Traduire » produit un
résultat streamé et appliquable ; un upload image propose un `alt` pertinent ;
la recherche back-office trouve par le sens, pas seulement par mot-clé.

---

## Phase 5 — Headless, échelle & écosystème

*But : une plateforme sur laquelle d'autres construisent.*

- **Tokens d'API** (`api_token` : hash, scopes, expiration) pour consommateurs
  externes (Next, mobile, partenaires) — auth Bearer en plus des cookies.
- **Webhooks** (`webhook` : url, events, secret HMAC) déclenchés sur
  publish/update/delete ; file d'attente + retries.
- **Cache & CDN** : Redis (réponses publiques + invalidation à la publication) ;
  dérivés d'images à la demande + en-têtes cache longue durée.
- **GraphQL** (optionnel) en lecture sur le modèle de contenu.
- **Système de plugins** : hooks serveur (`before_save`, `after_publish`) +
  enregistrement de blocs/champs côté front — le registre de blocs en est déjà
  la semence.
- **Observabilité** : logs structurés, Sentry, **journal d'audit** (module
  « Logs ») ; **Corbeille** transversale (UI sur le soft-delete existant).
- **Multi-site / multi-tenant** : scoping `site_id` sur le contenu, sélecteur de
  site, domaines mappés.

**Acceptation** : un site externe lit le contenu via token + webhooks reçus et
signés ; un cache invalidé à la publication ; audit consultable ; deux sites
servis depuis une seule instance.

---

## Phase 6 — Finition & lancement

*But : le vernis qui fait un produit, pas un projet.*

- **Sauvegardes** : export/import (dump structuré + médias), planification.
- **Accessibilité** : audit a11y (axe), thème / design tokens, dark mode public.
- **Perf** : budget Core Web Vitals, images `srcset`, code-splitting.
- **Docs & démo** : site de doc, quickstart « 5 minutes », seed de démo RDV
  Cycles, vidéo de prise en main.

**Acceptation** : restauration d'une sauvegarde vérifiée ; score a11y/perf sur
cibles ; un nouvel utilisateur monte un site en < 15 min via la doc.

---

## Séquencement & dépendances

```
Phase 0  ──►  Phase 1  ──►  Phase 2  ──►  Phase 3  ──►  Phase 4  ──►  Phase 5  ──►  Phase 6
(sûreté)     (visible)    (édition)    (plateforme)   (IA)       (échelle)    (lancement)
```

- **0 débloque tout** (on ne construit pas la révolution sur du sable).
- **1 rend le produit démontrable** (site + preview).
- **2 et 3 sont le cœur produit** ; 3 peut démarrer en parallèle de 2 une fois
  la Phase 1 stable.
- **4 s'appuie sur 3** (l'IA opère sur un modèle de contenu riche).
- **5 et 6** industrialisent et lancent.

## Priorité immédiate recommandée

1. **Phase 0** — tests + CI (le plus gros levier de crédibilité).
2. **Phase 1** — site public RDV Cycles + preview (le plus gros levier de
   démonstration).

Le reste suit l'ordre ci-dessus, incrément par incrément, testé et poussé.
