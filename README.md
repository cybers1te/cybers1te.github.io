# Cowrie Watch

Dashboard de surveillance pour les logs JSON Lines de [Cowrie](https://github.com/cowrie/cowrie). Cette première version fournit une base fonctionnelle : ingestion continue vers SQLite, compteurs, sessions récentes détaillables, carte des IP géolocalisées et rafraîchissement automatique.

## Fonctionnalités MVP

- Lecture en continu de `cowrie.json` sans recharger la page.
- Stockage local léger dans SQLite avec déduplication des lignes.
- API Flask : `/api/stats`, `/api/recent-sessions`, `/api/sessions/<id>`, `/api/top-attackers`, `/api/timeline` et `/api/map-points`.
- Compteurs des tentatives, IP uniques, commandes et uploads.
- Carte mondiale Leaflet avec géolocalisation via `ip-api.com` et cache en mémoire.
- Table des sessions récentes et détail des commandes capturées.
- Timeline 24 heures et top 10 des sources les plus actives.
- Rafraîchissement côté navigateur configurable, 15 secondes par défaut.

## Arborescence

```text
backend/app.py          API, ingestion tail et schéma SQLite
frontend/index.html     Structure du dashboard
frontend/styles.css     Thème et responsive design
frontend/app.js         Appels API, carte et interactions
.env.example            Variables de configuration
```

## Installation

Python 3.10+ est recommandé.

```bash
git clone <URL_DU_DEPOT>
cd cowrie-dashboard
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

## Lancement

```bash
source .venv/bin/activate
python backend/app.py
```

Ouvrir [http://localhost:5000](http://localhost:5000).

Pour lancer une démonstration sans log Cowrie :

```bash
DEMO_MODE=1 python backend/app.py
```

Le processus suit uniquement les nouvelles lignes ajoutées au fichier après son lancement. Pour importer un fichier historique, positionnez temporairement le curseur au début de `tail_log()` (`handle.seek(0)`) ou copiez son contenu dans un nouveau fichier puis relancez l’application.

## Production

Placez l’application derrière un reverse proxy HTTPS et utilisez un service systemd ou supervisord. Le compte système de l’application doit avoir accès en lecture au fichier Cowrie, mais pas d’accès en écriture à son répertoire de logs. Pour de gros volumes, remplacez la géolocalisation distante par GeoLite2 local afin d’éviter les limites de l’API publique.

## Notes sécurité et données

Les logs Cowrie contiennent potentiellement des identifiants et commandes sensibles. Le dashboard ne doit pas être exposé directement sur Internet sans authentification et contrôle réseau. `ip-api.com` est utilisé uniquement pour la MVP ; ses conditions et limites doivent être vérifiées avant un usage intensif.

## Prochaines évolutions

La structure permet d’ajouter un replay terminal plus riche, une timeline 7 jours, les graphiques Chart.js, WebSocket/SSE, export CSV, authentification et GeoLite2 local sans changer le contrat principal de l’API.
