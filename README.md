# cybers1te.github.io

Le site publié sur <https://cybers1te.github.io/> est **Trueware**, une boutique
de matériel informatique.

| Projet | Emplacement | Nature |
| --- | --- | --- |
| **Trueware** — version navigateur (le site publié) | `index.html`, `trueware.{js,css}`, `trueware-catalog.js` | Site statique |
| **Trueware** — version serveur complète | `trueware/` | Application Flask + SQLite |
| **Fiche de révision** *L'Appel de la forêt* | `london.html`, `styles.css`, `app.js` | Site statique |
| **Cowrie Watch** — tableau de bord de honeypot | `backend/`, `frontend/` | Application Flask + SQLite |
| **Page Auditor** — analyse défensive de la page courante | `page-auditor/` | Extension Chrome (Manifest V3), voir [`page-auditor/README.md`](page-auditor/README.md) |

## Trueware

Catalogue de 26 produits en 6 familles, recherche et filtres, fiches détaillées
avec caractéristiques et avis, panier, **inscription et connexion**, commande
avec décrémentation du stock, compte client et administration.

### Deux versions, un seul catalogue

GitHub Pages ne sert que des fichiers statiques : il ne peut exécuter ni Python
ni base de données. Le dépôt contient donc deux versions du même magasin.

**Version navigateur** — celle qui est en ligne. Tout s'exécute côté client et
les données (comptes, panier, commandes, avis, stocks) vivent dans le
`localStorage` de l'appareil. Rien n'est envoyé nulle part. Les mots de passe
sont dérivés par PBKDF2-SHA256 via WebCrypto avant stockage, mais **un compte
local ne protège rien** : quiconque a accès à l'appareil peut le lire. Le site
l'affiche clairement.

**Version serveur** (`trueware/`) — Flask + SQLite, avec sessions signées,
jetons anti-CSRF, limitation des tentatives de connexion, vraie base partagée
et administration réservée aux comptes administrateurs. Voir
[`trueware/README.md`](trueware/README.md).

```bash
pip install -r trueware/requirements.txt
python -m trueware.app          # http://127.0.0.1:5001
python -m pytest trueware/tests -q
```

### Génération des fichiers statiques

Le catalogue et la feuille de style du site statique sont **dérivés** du paquet
Python, pour éviter toute divergence :

```bash
python3 tools/build-static.py   # écrit trueware-catalog.js, trueware.css, favicon.svg
```

Le workflow GitHub Pages relance cette commande et la suite de tests à chaque
déploiement : le site publié est toujours construit depuis la source.

---

## Cowrie Watch

Dashboard de surveillance pour les logs JSON Lines de [Cowrie](https://github.com/cowrie/cowrie). Le dépôt contient à la fois une version complète Flask/SQLite et une version frontend statique publiable sur GitHub Pages.

## Version site GitHub Pages

Le dépôt est nommé `cybers1te.github.io`. GitHub publie automatiquement les fichiers statiques placés à la racine du dépôt utilisateur ; les fichiers `index.html`, `styles.css` et `app.js` sont donc également présents à la racine.

GitHub Pages est un hébergement **statique** : il ne peut pas exécuter le backend Flask, lire `cowrie.json` ni écrire dans SQLite. Lorsque l’API n’est pas disponible, le site affiche automatiquement des données de démonstration afin que l’interface reste visible. Pour les données Cowrie réelles, il faut lancer le backend sur un serveur Python séparé puis adapter l’URL d’API dans `frontend/app.js`.

Le site visé est : `https://cybers1te.github.io/`.

### Activation Pages

Pour un dépôt utilisateur public nommé `cybers1te.github.io`, GitHub Pages sert automatiquement la branche principale depuis sa racine. Il suffit de conserver `index.html` à la racine et d’attendre quelques secondes après un push.

## Fonctionnalités MVP

- Lecture en continu de `cowrie.json` côté backend.
- Stockage local léger dans SQLite avec déduplication des lignes.
- API Flask : `/api/stats`, `/api/recent-sessions`, `/api/sessions/<id>`, `/api/top-attackers`, `/api/timeline` et `/api/map-points`.
- Compteurs des tentatives, IP uniques, commandes et uploads.
- Carte mondiale Leaflet avec géolocalisation via `ip-api.com` et cache en mémoire.
- Table des sessions récentes et détail des commandes capturées.
- Timeline 24 heures et top 10 des sources les plus actives.
- Rafraîchissement côté navigateur configurable, 15 secondes par défaut.

## Arborescence

```text
backend/app.py              API, ingestion tail et schéma SQLite
frontend/index.html         Structure du dashboard
frontend/styles.css         Thème et responsive design
frontend/app.js             Appels API, carte, fallback démo et interactions
.github/workflows/pages.yml Déploiement automatique GitHub Pages
.env.example                Variables de configuration backend
```

## Installation du backend complet

Python 3.10+ est recommandé.

```bash
git clone https://github.com/cybers1te/cybers1te.github.io.git
cd cybers1te.github.io
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env
```

Modifiez ensuite `.env` :

```dotenv
COWRIE_LOG_PATH=/var/log/cowrie/cowrie.json
DATABASE_PATH=./data/cowrie.db
HOST=0.0.0.0
PORT=5000
REFRESH_SECONDS=15
DEMO_MODE=0
```

Lancement :

```bash
source .venv/bin/activate
python backend/app.py
```

Ouvrir [http://localhost:5000](http://localhost:5000). Pour tester sans log Cowrie :

```bash
DEMO_MODE=1 python backend/app.py
```

Le processus suit uniquement les nouvelles lignes ajoutées au fichier après son lancement. Pour importer un fichier historique, positionnez temporairement le curseur au début de `tail_log()` (`handle.seek(0)`) ou copiez son contenu dans un nouveau fichier puis relancez l’application.

## Production

Placez le backend derrière un reverse proxy HTTPS et utilisez un service systemd ou supervisord. Le compte système de l’application doit avoir accès en lecture au fichier Cowrie, mais pas d’accès en écriture à son répertoire de logs. Pour de gros volumes, remplacez la géolocalisation distante par GeoLite2 local afin d’éviter les limites de l’API publique.

Si le frontend GitHub Pages doit appeler un backend distant, configurez CORS côté Flask et remplacez les appels relatifs de `frontend/app.js` par l’URL HTTPS du backend. Ne rendez pas publics les identifiants, commandes ou IP de logs Cowrie sans authentification et filtrage réseau.

## Prochaines évolutions

La structure permet d’ajouter un replay terminal plus riche, une timeline 7 jours, les graphiques Chart.js, WebSocket/SSE, export CSV, authentification et GeoLite2 local sans changer le contrat principal de l’API.
