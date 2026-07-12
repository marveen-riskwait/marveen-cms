# Tutoriel complet — Marveen CMS

Ce guide fait le tour de **toute l'application** : installation, back‑office
(chaque écran), site public, API pour développeurs et sécurité. Les captures
sont de vraies vues de l'admin.

> **En bref** — Marveen CMS est un CMS générique : un back‑office (React) piloté
> par une API (Flask), et un site public (Next.js, SSR) qui consomme cette API.
> « RDV Cycles » n'est qu'un thème + des données.

## Sommaire

1. [Architecture en 30 secondes](#1-architecture-en-30-secondes)
2. [Installation & lancement](#2-installation--lancement)
3. [Connexion](#3-connexion)
4. [Tableau de bord](#4-tableau-de-bord)
5. [Pages & Page Builder](#5-pages--page-builder)
6. [Médiathèque & sélecteur de média](#6-médiathèque--sélecteur-de-média)
7. [Modules de contenu (Blog, FAQ, Événements…)](#7-modules-de-contenu)
8. [Types de contenu personnalisés](#8-types-de-contenu-personnalisés)
9. [Menus](#9-menus)
10. [Paramètres](#10-paramètres)
11. [Utilisateurs & rôles](#11-utilisateurs--rôles)
12. [Assistant IA](#12-assistant-ia)
13. [Intégrations : jetons d'API & webhooks](#13-intégrations--jetons-dapi--webhooks)
14. [Corbeille](#14-corbeille)
15. [Le site public](#15-le-site-public)
16. [API pour développeurs](#16-api-pour-développeurs)
17. [Sécurité](#17-sécurité)
18. [Dépannage](#18-dépannage)

---

## 1. Architecture en 30 secondes

```
backend/   API Flask (REST, /api/…)  ──►  PostgreSQL (ou SQLite en dev)
frontend/  Back-office React (port 5173)  ──► parle à l'API
web/       Site public Next.js SSR (port 3000)  ──► lit /api/public/…
```

- **Le back‑office** ne stocke rien : il pilote l'API.
- **Le site public** affiche les pages publiées et les contenus.
- **Trois briques indépendantes** : on peut remplacer le site public par
  n'importe quel front (mobile, autre framework) via l'API.

---

## 2. Installation & lancement

L'admin appelle l'API via un proxy : **lancer le backend en premier**.

### Backend (port 3001)
```bash
cd backend
cp .env.example .env
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=wsgi.py APP_ENV=development
flask db upgrade      # crée les tables
flask seed            # permissions, rôles, super-admin
python wsgi.py        # API sur http://localhost:3001
```

### Back‑office (port 5173) — dans un 2ᵉ terminal
```bash
cd frontend
npm install
npm run dev           # http://localhost:5173
```

### Site public (port 3000) — optionnel, 3ᵉ terminal
```bash
cd web
npm install
CMS_API_URL=http://localhost:3001 npm run dev   # http://localhost:3000
```

> Raccourcis : `make install`, `make test`, `make up` (stack Docker complète).

---

## 3. Connexion

Ouvre **http://localhost:5173** → tu es redirigé vers `/login`.

- Identifiants du super‑administrateur (créés par `flask seed`) :
  **`admin@marveen.cms`** / **`ChangeMe123!`** — *à changer immédiatement*
  (écran Utilisateurs).
- La session est un **cookie httpOnly** (JWT), avec protection **CSRF** et
  **rafraîchissement** automatique. Rien à gérer côté navigateur.

---

## 4. Tableau de bord

Après connexion, le **Tableau de bord** affiche les compteurs (pages, articles,
médias, utilisateurs…) et les éléments récents. La **barre latérale** à gauche
regroupe tous les modules ; elle n'affiche que ce que ton rôle autorise.

---

## 5. Pages & Page Builder

C'est le cœur du CMS. **Contenu → Pages → Nouvelle page**.

![Page Builder avec aperçu en direct](images/page-builder.png)

L'éditeur a **trois onglets** + un historique :

- **Contenu** — la page est un empilement de **blocs** :
  - Types : bannière, texte, image, galerie, citation, appel à l'action, vidéo,
    HTML libre.
  - **Ajouter un bloc** ouvre la palette ; chaque bloc s'édite en place.
  - **Glisser‑déposer** pour réordonner (poignée à gauche), ou flèches ↑/↓.
  - Le bloc **Texte** utilise un **éditeur riche (WYSIWYG)** : gras, italique,
    titres, listes, citation, lien — et un bouton **IA** (voir §12).

  ![Éditeur WYSIWYG et poignées de glisser-déposer](images/editeur-wysiwyg.png)
- **Réglages** — titre, slug (auto si vide), statut (brouillon / publié /
  programmé / archivé), langue, page d'accueil, date de publication.
- **SEO** — titre SEO, description, URL canonique, robots, image de partage
  (Open Graph). Bouton **« Générer la description SEO »** si l'IA est activée.

Deux confforts d'édition :

- **Enregistrement automatique** : dès que tu modifies, l'état passe à
  « Modifié… » puis « Enregistré » (~1,2 s après ta dernière frappe). Le bouton
  **Enregistrer** reste disponible pour forcer.
- **Aperçu en direct** : le bouton **Aperçu** ouvre un volet à droite qui rend
  la page telle qu'elle sera en ligne (le vrai site SSR), **rafraîchi à chaque
  enregistrement**. Un bandeau indique « cette page n'est pas encore publiée ».

**Historique** — l'onglet liste chaque version enregistrée (numéro, auteur,
date). **Restaurer** ramène une version antérieure ; l'opération est elle‑même
annulable (l'état courant est sauvegardé avant restauration).

**Prévisualiser un brouillon hors admin** : depuis l'aperçu, « ouvrir dans un
onglet » génère un **lien signé** (`/preview?token=…`) qui affiche le brouillon
sur le site public — pratique pour le faire valider par un client.

---

## 6. Médiathèque & sélecteur de média

**Médias & vitrine → Médiathèque.**

![Médiathèque](images/mediatheque.png)

- **Glisser‑déposer** des fichiers (ou bouton **Importer**). Les images sont
  **converties en WebP** avec une **miniature** générée automatiquement.
- Recherche + filtre par type (image / document / vidéo). Chaque média :
  **copier l'URL**, ouvrir, supprimer (corbeille).

Partout où un champ attend une image (couverture d'article, logo, avatar…), un
bouton **« Choisir »** ouvre le **sélecteur de média** : on pioche une image
existante ou on en importe une à la volée.

![Sélecteur de média](images/selecteur-media.png)

---

## 7. Modules de contenu

Les modules **Blog, Actualités, Catégories, FAQ, Témoignages, Événements,
Documents, Partenaires, Marques, Équipe** partagent la même mécanique :

![Tables CRUD génériques](images/tables-crud.png)

- Une **table** avec recherche, filtres, tri par colonne, pagination.
- **Nouveau** / **crayon** ouvrent un **formulaire** adapté au module (champs
  texte, riche, image, cases, listes…).
- Blog et Actualités sont deux vues du même moteur (section différente).

---

## 8. Types de contenu personnalisés

Le saut « plateforme » : **crée tes propres types de contenu, sans code**.

![Type de contenu Parcours créé sans code](images/types-contenu.png)

**Contenus → Types de contenu → Nouveau type** :

1. Donne un **nom** (ex. « Vélo », « Parcours »), un slug, une icône.
2. **Ajoute des champs** : pour chacun, une **clé**, un **libellé**, un **type**
   (texte, texte long, texte riche, nombre, oui/non, date, média, liste de
   choix, relation), et des options (requis, champ‑titre, valeurs de liste,
   type lié pour une relation).
3. **Enregistrer.**

Aussitôt :
- Le type apparaît dans une **section « Contenus »** de la barre latérale.
- Tu obtiens un **écran CRUD complet** (table + formulaire) construit à partir
  de tes champs.
- Une **API** est disponible : `/api/content/<slug>` (privé) et
  `/api/public/content/<slug>` (entrées publiées).

> Exemple : un type « Vélo » avec *nom, prix, électrique, catégorie* → gestion
> immédiate des vélos + API pour le site public. Aucune migration, aucun
> redéploiement.

---

## 9. Menus

**Configuration → Menus.** Construis l'**arborescence de navigation** :

![Éditeur de menus](images/menus.png)

- Un menu a un **nom** et un **emplacement** (`header`, `footer`…).
- Ajoute des **liens** (libellé + URL), imbrique des **sous‑liens**, réordonne,
  supprime.
- Le site public lit le menu par emplacement (`/api/public/menus/header`).

---

## 10. Paramètres

**Configuration → Paramètres.** Réglages du site, groupés :

![Paramètres](images/parametres.png)

- **Général** : nom du site, slogan, logo, favicon, couleur principale.
- **Coordonnées** : email, téléphone, adresse.
- **Réseaux sociaux**, **Référencement** (description SEO par défaut, analytics),
  mode maintenance.
- Le bouton **Enregistrer** n'écrit **que les valeurs modifiées** (compteur). Un
  badge « privé » marque les réglages non exposés publiquement.

---

## 11. Utilisateurs & rôles

**Configuration → Utilisateurs.**

![Formulaire utilisateur avec rôles](images/utilisateurs.png)

- Table des comptes : nom, email, **rôles**, statut actif, dernière connexion.
- **Nouvel utilisateur** : prénom/nom, email, mot de passe, **rôles** (cases à
  cocher avec le nombre de permissions), interrupteurs *actif* /
  *super‑administrateur*.
- **Rôles par défaut** (créés au seed) :
  - **Administrateur** — toutes les permissions.
  - **Éditeur** — les modules de contenu.
  - **Employé** — réservations + lecture d'événements/médias.
- **Garde‑fous** : impossible de supprimer son propre compte ni de retirer le
  dernier super‑administrateur actif.

Le modèle d'autorisations est **RBAC** : `Utilisateur → Rôles → Permissions`
(code `module.action`). Un super‑administrateur court‑circuite toute
vérification.

---

## 12. Assistant IA

Si une clé Anthropic est configurée (`ANTHROPIC_API_KEY`) — ou le mode démo
`AI_FAKE=1` — l'IA apparaît dans l'éditeur.

![Assistant IA dans l'éditeur](images/assistant-ia.png)

- **Dans un bloc Texte** : le bouton **IA** propose *Améliorer, Réécrire,
  Raccourcir, Développer, Ton professionnel, Ton chaleureux* — le texte du bloc
  est transformé sur place.
- **Onglet SEO d'une page** : **« Générer la description SEO »** rédige une
  méta‑description à partir du titre et du contenu.
- Côté API : `/api/ai/assist`, `/api/ai/seo-description`, `/api/ai/translate`.

> Sans clé et sans mode démo, les boutons IA sont simplement masqués.

---

## 13. Intégrations : jetons d'API & webhooks

**Configuration → Intégrations.** Pour consommer le CMS depuis l'extérieur.

![Intégrations](images/integrations.png)

- **Jetons d'API** : génère un jeton (portée **Lecture** et/ou **Écriture**). Le
  jeton en clair n'est **affiché qu'une fois** — copie‑le. Utilise‑le en en‑tête
  `Authorization: Bearer <jeton>` pour appeler l'API sans cookie (idéal pour un
  front headless). La portée est respectée : un jeton *Lecture* ne peut pas
  écrire.
- **Webhooks** : sur un événement (`page.published`, `entry.published`…), le CMS
  **POST** ta URL avec une **signature HMAC** (`X-Marveen-Signature`) calculée
  depuis un secret montré une fois. Parfait pour déclencher un déploiement à la
  publication.

---

## 14. Corbeille

**Configuration → Corbeille.** Les suppressions sont **douces** (rien n'est
perdu tout de suite).

![Corbeille](images/corbeille.png)

- Choisis un **module** ; la liste montre ses éléments supprimés et la date.
- **Restaurer** remet l'élément en ligne ; **Supprimer** l'efface
  définitivement (irréversible, avec confirmation).

---

## 15. Le site public

Le dossier `web/` est un site **Next.js (SSR)** qui rend les pages du CMS.

![Site public rendu en SSR](images/site-public.png)

- **Accueil** = la page marquée « page d'accueil » et publiée.
- Les autres pages sont servies par leur **slug**.
- **SEO natif** : `<title>`, description, Open Graph et **JSON‑LD** sont générés
  côté serveur.
- L'en‑tête et le pied de page se remplissent depuis les **menus** et les
  **paramètres** (nom, logo, couleur, coordonnées, réseaux).
- **Brouillons** : visibles uniquement via un **lien de prévisualisation signé**.

---

## 16. API pour développeurs

Toutes les réponses suivent une forme stable :
`{ ok, data }` pour une ressource, `{ items, meta }` pour une liste,
`{ ok:false, message }` en erreur.

**Endpoints publics (sans authentification)** :
```
GET /api/public/pages/<slug>        une page publiée
GET /api/public/home                la page d'accueil
GET /api/public/menus/<emplacement> un menu
GET /api/public/settings            les réglages publics
GET /api/public/content/<slug>      les entrées publiées d'un type
```

**Accès programmatique privé (jeton Bearer)** :
```bash
curl -H "Authorization: Bearer mvn_xxx" http://localhost:3001/api/faq
# écriture possible seulement si le jeton a la portée "write"
```

**Session navigateur (back‑office)** : cookie httpOnly + en‑tête `X-CSRF-TOKEN`
sur les écritures (le SPA s'en charge).

---

## 17. Sécurité

- **JWT en cookies httpOnly** (accès court + rafraîchissement rotatif) +
  **CSRF** double‑submit ; jetons révoqués à la déconnexion.
- **RBAC** sur chaque endpoint ; `is_superadmin` court‑circuite.
- **Inscription publique désactivée par défaut** : `/api/auth/register` renvoie
  `403`. Les comptes se créent via l'écran Utilisateurs. (Réversible avec
  `ALLOW_PUBLIC_REGISTRATION=1` si un jour tu veux ouvrir l'inscription.)
- **Suppression douce** (Corbeille) partout ; **HTML des blocs assaini**
  (allowlist) ; **jetons/secret** stockés hachés, montrés une seule fois.
- **Mot de passe** : minimum 8 caractères ; change le mot de passe du
  super‑admin par défaut dès la première connexion.

---

## 18. Dépannage

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| Login échoue, `/api/...` en erreur | backend non lancé | démarrer le backend (port 3001) avant l'admin |
| Aperçu en direct vide | site public non lancé | lancer `web/` (port 3000) ; régler `VITE_WEB_URL` |
| Boutons IA absents | pas de clé IA | définir `ANTHROPIC_API_KEY` ou `AI_FAKE=1` |
| « role does not exist » au démarrage | `DATABASE_URL` invalide | vider `DATABASE_URL` (SQLite) ou corriger l'URL Postgres |
| 403 sur une action | permission manquante | vérifier le rôle de l'utilisateur (écran Utilisateurs) |

---

Bon voyage dans Marveen CMS ! Pour la vision produit et la feuille de route, voir
[`../ROADMAP.md`](../ROADMAP.md) ; pour l'installation résumée,
[`../README.md`](../README.md).
