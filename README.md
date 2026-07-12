# Marveen CMS

CMS moderne et générique (Flask + React) pour créer n'importe quel site
vitrine en quelques minutes. RDV Cycles n'est qu'un **thème + des données**,
pas le produit.

## Stack

- **Backend** : Python 3.13 · Flask (app factory) · SQLAlchemy · Alembic
  (Flask-Migrate) · Flask-JWT-Extended (cookies httpOnly + refresh + CSRF) ·
  Marshmallow · Flask-Limiter · PostgreSQL (repli SQLite en dev) · Gunicorn
- **Frontend admin** : React 19 · React Router 7 · Context API · Axios ·
  Bootstrap 5.3 · Vite 6

## Architecture

```
backend/
  app/
    __init__.py        # app factory (create_app) + commande CLI `seed`
    config.py          # configuration typée par environnement
    extensions.py      # singletons (db, migrate, jwt, cors, ma, limiter)
    models/            # BaseModel (soft-delete) + modèles par module
    routes/            # blueprints REST, montés sous /api
    services/          # logique métier (sans HTTP)
    schemas/           # validation / sérialisation (marshmallow)
    permissions/       # RBAC (décorateurs require_permission / require_role)
    utils/             # erreurs JSON, réponses paginées
    seeds/             # permissions, rôles, super-admin
  migrations/          # Alembic
  wsgi.py              # point d'entrée (gunicorn wsgi:app)
frontend/
  src/
    api/               # client Axios (cookies + CSRF) + clients de ressources
    contexts/          # AuthContext, ToastContext
    components/        # ProtectedRoute, Sidebar, Topbar, FieldInput, formulaires
    layouts/           # AdminLayout
    pages/             # écrans admin (Dashboard, Pages/PageBuilder, Médiathèque…)
    config/            # descriptifs déclaratifs (ressources, blocs, réglages, nav)
    styles/            # thème admin (Bootstrap + surcharges)
  vite.config.js       # dev server (port 5173) + proxy /api & /media -> 3001
```

## Démarrer en local

L'admin (front) ne contient aucune donnée en propre : il appelle l'API via un
proxy Vite (`/api` et `/media` → `http://localhost:3001`). **Lancez donc le
backend en premier**, puis le front.

### 1. Backend (port 3001)

```bash
cd backend
cp .env.example .env                      # ajuster si besoin
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=wsgi.py APP_ENV=development
flask db upgrade                          # applique les migrations
flask seed                                # permissions, rôles, super-admin
python wsgi.py                            # API sur http://localhost:3001
```

### 2. Frontend admin (port 5173)

Dans un **second terminal** (le backend doit tourner) :

```bash
cd frontend
npm install                               # une seule fois
npm run dev                               # admin sur http://localhost:5173
```

Ouvrez ensuite **http://localhost:5173** (redirection vers `/login`).

Super-admin par défaut : `admin@marveen.cms` / `ChangeMe123!` (à changer).

### Scripts frontend

| Commande          | Effet                                              |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | serveur de dev avec hot-reload (port 5173)         |
| `npm run build`   | build de production dans `frontend/dist/`          |
| `npm run preview` | sert le build de production localement             |

### GitHub Codespaces

Le proxy vise `localhost:3001` et `allowedHosts` autorise `.app.github.dev` :
ça fonctionne tel quel. Assurez-vous seulement que le **port 3001** est démarré
(le front en 5173 l'appelle en interne) ; rendez le port 5173 visible pour
ouvrir l'admin dans le navigateur.

## Sécurité & conventions

- JWT en **cookies httpOnly** (access court + refresh rotatif) + **CSRF**,
  révocation via `token_blocklist`.
- **RBAC** : `User` → `Role` → `Permission` (code `module.action`).
  `is_superadmin` court-circuite toute vérification.
- **Soft-delete** généralisé (`deleted_at`) pour la Corbeille.
- Réponses JSON normalisées : `{ ok, data }` / `{ items, meta }` /
  `{ ok:false, message }`.
- Front **piloté par descriptifs** : un module de contenu = une entrée dans
  `config/resources.js` (table + formulaire génériques), un type de bloc = une
  entrée dans `config/blocks.js`, un réglage = une entrée dans
  `config/settings.js`.

## État des modules

**Disponibles** — Auth + RBAC · Dashboard · Pages + Page Builder (blocs JSON,
SEO) · Blog · Actualités · Catégories · FAQ · Témoignages · Événements ·
Documents · Médiathèque (WebP + miniatures) + sélecteur de média · Partenaires ·
Marques · Équipe · Menus (arborescence) · Paramètres · Utilisateurs & rôles.

**À venir** — Corbeille (écran transversal ; soft-delete déjà en place) · Logs ·
Historique · Sauvegardes · Réservations · Site public (thème RDV Cycles
consommant l'API).
