# cybers1te.github.io

Le site publié sur <https://cybers1te.github.io/> est **message-me**, une
messagerie en temps réel construite sur Firebase.

| Projet | Emplacement | Nature |
| --- | --- | --- |
| **message-me** — le site publié | `public/`, `firestore.rules`, `firebase.json` | Site statique + Firebase (Auth, Firestore) |
| **Fiche de révision** *L'Appel de la forêt* | `london.html`, `styles.css`, `app.js` | Site statique |
| **Trueware** — boutique | `trueware/` | Application Flask + SQLite |
| **Cowrie Watch** — tableau de bord de honeypot | `backend/`, `frontend/` | Application Flask + SQLite |

## message-me

Inscription par e-mail avec un **pseudo** unique, discussions à deux ou en
**groupe** (jusqu'à 20 membres), messages synchronisés en temps réel,
**photos** et **messages vocaux**, **appels audio et vidéo** (discussions à
deux), **notifications** du navigateur pour les messages et les appels,
indicateur « … écrit », non-lus et accusé de lecture « Vu », liens cliquables,
thème clair/sombre, interface adaptée au mobile. Messages, photos et vocaux
sont chiffrés de bout en bout.

### Configuration : [FIREBASE.md](FIREBASE.md)

Le site a besoin d'un projet Firebase. Le guide [FIREBASE.md](FIREBASE.md)
explique pas à pas comment le créer, activer la connexion par e-mail, créer la
base Firestore, y publier les règles et coller la configuration dans
`public/firebase-config.js`. Tant que ce n'est pas fait, le site affiche un
écran d'aide au lieu de la messagerie.

### Fonctionnement

GitHub Pages ne sert que des fichiers statiques : tout s'exécute dans le
navigateur, qui parle directement à Firebase.

- **Firebase Authentication** gère les comptes (e-mail + mot de passe).
- **Cloud Firestore** stocke les profils, les conversations et les messages ;
  le site s'y abonne et se met à jour dès qu'un message arrive.
- **`firestore.rules`** est la vraie barrière de sécurité : la configuration
  web de Firebase est publique par conception, ce sont ces règles qui
  décident qui lit et écrit quoi (membres seuls, pas d'usurpation d'auteur,
  pseudos uniques, messages non modifiables…).
- **`public/e2e.js`** chiffre les messages de bout en bout dans le navigateur
  (Web Crypto : ECDH P-256, HKDF, AES-GCM) : Firestore ne stocke que du texte
  chiffré, illisible même pour le propriétaire du projet. La clé privée de
  chaque compte est scellée par son mot de passe et par un code de secours
  (PBKDF2-SHA-256), affiché une seule fois à l'inscription. Les noms, pseudos
  et titres de groupe restent en clair.

```text
usernames/{pseudo}                   { uid }
users/{uid}                          { name, username, createdAt, publicKey }
keys/{uid}                           { v, publicKey, byPassword, byRecovery, updatedAt }
conversations/{cid}                  { type, members, title, createdBy,
                                       createdAt, updatedAt, lastMessage, lastRead, typing }
conversations/{cid}/messages/{mid}   { uid, enc, createdAt }
conversations/{cid}/media/{mid}      { uid, data, createdAt }   (photo ou vocal chiffré)
calls/{callId}                       { cid, caller, callee, video, status, offer, answer, … }
calls/{callId}/callerCandidates/*    candidats ICE (WebRTC)
calls/{callId}/calleeCandidates/*
```

- **Photos et messages vocaux** (`public/media.js`) : redimensionnés ou
  limités dans le navigateur, chiffrés avec leur propre clé AES-GCM, puis
  rangés dans Firestore (≤ 1 Mo par document, sans Cloud Storage payant). La
  clé du fichier ne voyage que dans l'enveloppe chiffrée du message (`enc` v2).
- **Appels** (`public/calls.js`) : WebRTC de navigateur à navigateur ;
  Firestore ne sert qu'à la mise en relation (offre, réponse, candidats ICE).
  Serveurs STUN publics par défaut, relais TURN facultatif (`iceServers`).
- **Notifications** (`public/notify.js`, `public/sw.js`) : notifications du
  navigateur et sonneries synthétisées, tant qu'un onglet est ouvert.

### Développement local et tests

Node.js 20+ et Java 21 (pour les émulateurs Firebase) :

```bash
npm install
npm run dev     # émulateurs Auth + Firestore + site sur http://127.0.0.1:5000/?emulateurs
npm test        # tests des règles Firestore contre l'émulateur
```

Avec `?emulateurs` (uniquement sur `localhost`/`127.0.0.1`), le site se
connecte aux émulateurs d'un projet fictif `demo-message-me` : aucun vrai
projet n'est touché, et il n'est pas nécessaire de remplir
`public/firebase-config.js`.

Le workflow GitHub Actions lance ces tests à chaque push et pull request,
puis publie `public/` (et la fiche de révision) sur GitHub Pages depuis `main`.

```text
public/index.html            Page unique de la messagerie
public/main.js               Application (Auth, Firestore, interface)
public/e2e.js                Chiffrement de bout en bout (Web Crypto)
public/media.js              Photos (compression), messages vocaux (enregistrement, lecture)
public/calls.js              Appels audio/vidéo (WebRTC + signalisation Firestore)
public/notify.js, sw.js      Notifications du navigateur et sonneries
public/style.css             Thème clair/sombre et mise en page responsive
public/firebase-config.js    Configuration web du projet Firebase (à remplir)
firestore.rules              Règles de sécurité de la base
firebase.json                Configuration Firebase CLI (règles, hébergement, émulateurs)
tests/                       Tests des règles (node:test + @firebase/rules-unit-testing)
```

## Trueware

Boutique de matériel informatique en Flask + SQLite (sessions signées, jetons
anti-CSRF, administration). Sa version navigateur, qui était publiée ici, a été
remplacée par message-me ; l'application serveur reste disponible. Voir
[`trueware/README.md`](trueware/README.md).

```bash
pip install -r trueware/requirements.txt
python -m trueware.app          # http://127.0.0.1:5001
python -m pytest trueware/tests -q
```

---

## Cowrie Watch

Dashboard de surveillance pour les logs JSON Lines de [Cowrie](https://github.com/cowrie/cowrie). Le dépôt contient à la fois une version complète Flask/SQLite et une version frontend statique publiable sur GitHub Pages.

## Version statique

`frontend/` contient une version statique du tableau de bord. Lorsque l'API
n'est pas disponible, elle affiche automatiquement des données de
démonstration afin que l'interface reste visible. Pour les données Cowrie
réelles, il faut lancer le backend sur un serveur Python séparé puis adapter
l'URL d'API dans `frontend/app.js`.

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
