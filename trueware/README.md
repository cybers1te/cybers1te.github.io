# Trueware

Boutique de vente en ligne complète : catalogue, fiches produits, panier,
**inscription / connexion**, commande, compte client et back-office.

Flask + SQLite, sans service externe. Les seules dépendances sont Flask et,
en production, gunicorn.

## Démarrage

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r trueware/requirements.txt
python -m trueware.app
```

Le site est alors sur <http://127.0.0.1:5001>. La base est créée et le
catalogue semé au premier lancement (26 produits, 6 familles).

## Compte administrateur

Au premier démarrage, un compte administrateur est créé :

- si `TRUEWARE_ADMIN_EMAIL` et `TRUEWARE_ADMIN_PASSWORD` sont définis, ce sont
  ces identifiants qui sont utilisés ;
- sinon l'adresse est `admin@trueware.local` et **un mot de passe est tiré au
  hasard** puis écrit dans `data/trueware_admin.txt` (permissions 600).
  Changez-le depuis `/compte`, puis supprimez le fichier.

Aucun mot de passe n'est codé en dur dans le dépôt.

## Variables d'environnement

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `TRUEWARE_DB` | `data/trueware.db` | Fichier SQLite |
| `TRUEWARE_DATA_DIR` | `data` | Dossier de la clé de session et du fichier admin |
| `TRUEWARE_SECRET_KEY` | générée et persistée | Signature des cookies de session |
| `TRUEWARE_ADMIN_EMAIL` | `admin@trueware.local` | Compte admin initial |
| `TRUEWARE_ADMIN_PASSWORD` | aléatoire | Mot de passe admin initial |
| `TRUEWARE_HTTPS` | `0` | `1` pose le drapeau `Secure` sur le cookie de session |
| `HOST` / `PORT` | `127.0.0.1` / `5001` | Serveur de développement |

## Fonctionnalités

**Boutique** — accueil (mises en avant, promotions, nouveautés), catalogue
filtrable par famille, recherche nom/marque, cinq tris, pagination, fiche
produit avec caractéristiques et avis, produits similaires.

**Compte** — inscription avec validation, connexion, déconnexion, édition des
coordonnées, changement de mot de passe, historique des commandes et des avis.

**Panier** — fonctionne sans compte (en session) puis **fusionne dans le panier
du compte à la connexion**, quantités bornées par le stock réel, livraison
offerte au-delà de 100 €.

**Commande** — adresse de livraison, création de la commande et décrémentation
du stock dans une seule transaction SQLite (`BEGIN IMMEDIATE`), référence
unique `TW-AAAAMMJJ-XXXXXX`, page de confirmation réservée au client concerné.

**Administration** (`/admin`, réservée aux comptes `is_admin`) — chiffre
d'affaires, commandes à préparer, stocks faibles, meilleures ventes, création
et modification de produits, mise en vente ou retrait, changement de statut des
commandes.

## Sécurité

- Mots de passe hachés (PBKDF2-SHA256 via Werkzeug), jamais stockés en clair.
- Jeton anti-CSRF vérifié sur **toutes** les requêtes POST.
- Cookie de session `HttpOnly`, `SameSite=Lax`, `Secure` si `TRUEWARE_HTTPS=1`.
- Limitation des tentatives de connexion : 10 échecs par IP sur 5 minutes.
- Redirection post-connexion restreinte aux chemins internes.
- En-têtes `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`.
- Requêtes SQL exclusivement paramétrées.
- Autorisation vérifiée côté serveur : une commande n'est lisible que par son
  auteur ou un administrateur.

**Ce n'est pas une boutique réelle** : aucun moyen de paiement n'est demandé ni
traité, et aucune donnée bancaire n'est manipulée.

## Tests

```bash
pip install pytest
python -m pytest trueware/tests -q
```

40 tests couvrent les pages publiques, l'inscription, la connexion et ses
refus, le hachage des mots de passe, le CSRF, la limitation de tentatives, le
panier (fusion, bornes de stock, rupture), la commande (création, transaction,
adresse incomplète, cloisonnement entre clients), les avis et l'administration.

## Structure

```text
trueware/
├── app.py              routes, authentification, panier, commande, admin
├── db.py               connexion SQLite, schéma, clé de session
├── schema.sql          tables users, products, orders, reviews…
├── catalog.py          catalogue initial et compte admin
├── imagery.py          visuels produits générés en SVG
├── wsgi.py             point d'entrée gunicorn
├── templates/          gabarits Jinja (dont admin/)
├── static/             feuille de style, script, favicon
└── tests/              suite pytest
```

Aucune image n'est téléchargée : chaque produit reçoit une illustration SVG
déterministe dérivée de son identifiant. Le site fonctionne donc hors ligne,
seules les polices Google Fonts sont distantes (avec repli système).

## Déploiement

`render.yaml` à la racine décrit le service `trueware` :

```yaml
buildCommand: pip install -r trueware/requirements.txt
startCommand: gunicorn --bind 0.0.0.0:$PORT trueware.wsgi:app
```

Le disque monté sur `/var/data` conserve la base entre deux déploiements.
Sur une offre sans disque persistant, la base est recréée et resemée à chaque
redéploiement.

> GitHub Pages ne peut pas héberger Trueware : Pages sert uniquement des
> fichiers statiques, sans Python ni base de données. Il faut un hébergeur
> capable d'exécuter l'application (Render, Fly.io, un VPS…).
