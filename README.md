# Cowrie Watch

Dashboard de surveillance pour les logs JSON Lines de [Cowrie](https://github.com/cowrie/cowrie). Le dépôt contient à la fois une version complète Flask/SQLite et une version frontend statique publiable sur GitHub Pages.

## Version site GitHub Pages

Le dépôt est nommé `cybers1te.github.io` et contient un workflow GitHub Actions dans `.github/workflows/pages.yml`. À chaque push sur `main`, il publie `frontend/index.html`, `frontend/styles.css` et `frontend/app.js`.

GitHub Pages est un hébergement **statique** : il ne peut pas exécuter le backend Flask, lire `cowrie.json` ni écrire dans SQLite. Lorsque l’API n’est pas disponible, le site affiche automatiquement des données de démonstration afin que l’interface reste visible. Pour les données Cowrie réelles, il faut lancer le backend sur un serveur Python séparé puis adapter l’URL d’API dans `frontend/app.js`.

Le site visé est : `https://cybers1te.github.io/`.

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
