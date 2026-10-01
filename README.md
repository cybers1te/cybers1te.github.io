# marketbuss.github.io

Le site publié par GitHub Pages est **marketbuss**, un micro-SaaS gratuit qui
classe les meilleures IA du moment et se met à jour tout seul. La messagerie
**message-me**, publiée avant lui, est gardée intacte dans le dépôt et se
remet en ligne en changeant une ligne (voir
[Remettre message-me](#remettre-message-me)).

> **Adresse du site.** GitHub Pages publie un dépôt nommé
> `<compte>.github.io` à la racine de `https://<compte>.github.io/`. Le compte
> s'appelle désormais `marketbuss` : pour que le site soit à
> <https://marketbuss.github.io/>, le dépôt doit s'appeler
> `marketbuss.github.io` (Settings → General → Repository name). Le
> déploiement suit tout seul l'adresse donnée par GitHub.

| Projet | Emplacement | Nature |
| --- | --- | --- |
| **marketbuss** — le site publié | `marketbuss/` | Site statique + robot de collecte (GitHub Actions) |
| **message-me** — en réserve | `public/`, `firestore.rules`, `firebase.json`, `android/` | Site statique + Firebase (Auth, Firestore) |
| **Fiche de révision** *L'Appel de la forêt* | `london.html`, `styles.css`, `app.js` | Site statique, publié à côté |
| **Trueware** — boutique | `trueware/` | Application Flask + SQLite |
| **Cowrie Watch** — tableau de bord de honeypot | `backend/`, `frontend/` | Application Flask + SQLite |

## marketbuss

Les meilleures IA du moment, classées en continu.

- **Classement général** : l'indice marketbuss (sur 100) résume la qualité
  mesurée dans les arènes Texte, Code, Vision et Documents d'Arena AI, avec
  la variation sur 7 jours, les prix et la taille du contexte.
- **Classements par usage** : texte, code, vision, documents, recherche web,
  agents, images, retouche, vidéo, image → vidéo, montage vidéo (score Elo,
  intervalle de confiance, votes).
- **Fiche de chaque modèle** : résultats par arène, courbe sur 30 jours,
  prix (entrée, sortie, cache), capacités, alternatives moins chères.
- **Comparateur** (jusqu'à 4 modèles, lien partageable), **calculateur de
  coût** mensuel, **« Trouver mon IA »** (usage, budget, exigences), graphique
  **qualité / prix** avec la frontière des meilleurs rapports.
- **Nouveautés** : nouveaux n° 1, entrées dans les classements, sorties,
  changements de prix ; « depuis ta dernière visite », favoris, flux Atom
  (`data/feed.xml`), données ouvertes (`data/latest.json`), export CSV.
- Thème clair/sombre, pensé pour le téléphone, sans compte ni dépendance.

### Mise à jour automatique

```text
GitHub Actions (toutes les 3 h, et à chaque push sur main)
  └─ marketbuss/tools/update.mjs
       ├─ Arena AI      classements du jour + 30 jours d'historique
       ├─ LiteLLM       prix publics des fournisseurs, contextes, capacités
       ├─ OpenRouter    sorties récentes, versions gratuites
       └─ instantané en ligne précédent (changements de prix, secours)
     → _site/data/latest.json + feed.xml → GitHub Pages
```

- Les sources sont publiques et gratuites, sans clé : la copie quotidienne
  en JSON des classements [Arena AI](https://arena.ai/leaderboard) par
  [arena-ai-leaderboards](https://github.com/oolong-tea-2026/arena-ai-leaderboards)
  (MIT), la base de prix de [LiteLLM](https://github.com/BerriAI/litellm) et
  l'API publique d'[OpenRouter](https://openrouter.ai/models).
- Si Arena AI est injoignable, l'instantané en ligne est republié tel quel
  (marqué « données anciennes ») ; si la base de prix l'est, les prix
  précédents sont gardés. Le site n'est jamais publié sans données.
- Une page ouverte relit `data/latest.json` toutes les 5 minutes et se met
  à jour sans rechargement.
- Le passage programmé réactive lui-même la tâche, que GitHub suspend
  sinon après 60 jours sans activité sur un dépôt public.

```text
marketbuss/site/index.html     Page unique
marketbuss/site/marketbuss.js  Application (classements, fiche, comparateur, graphiques SVG…)
marketbuss/site/marketbuss.css Thème clair/sombre, mise en page responsive
marketbuss/site/sw.js          Retire le service worker de l'ancienne messagerie
marketbuss/site/data/          Instantané de secours (remplacé à chaque publication)
marketbuss/lib/engine.js       Calcul : regroupement des réglages, prix, indice, frontière, événements
marketbuss/lib/sources.js      Téléchargement des sources
marketbuss/tools/update.mjs    Le robot de collecte
marketbuss/tools/serve.mjs     Serveur local
marketbuss/tests/              Tests du moteur (node:test, données inventées)
```

```bash
npm run marketbuss:update   # collecte réelle → marketbuss/site/data/
npm run marketbuss:dev      # http://127.0.0.1:5100/
npm run test:marketbuss     # tests du moteur
```

### Remettre message-me

Dans `.github/workflows/pages.yml`, remplacer `SITE: marketbuss` par
`SITE: message-me`, puis pousser sur `main` : le workflow republie `public/`
tel quel, sans collecte programmée. Les comptes, messages et réglages sont
dans Firebase et n'ont pas bougé. Si l'adresse du site a changé depuis (nom
du compte ou du dépôt), l'ajouter dans Firebase : Authentication →
Paramètres → Domaines autorisés ; l'application Android, elle, vise
`cybers1te.github.io` et devra être reconstruite pour la nouvelle adresse.

## message-me (en réserve)

Inscription par e-mail (adresse à confirmer) ou avec **Google**, **pseudo**
unique, discussions à deux ou en **groupe** (jusqu'à 20 membres), messages
synchronisés en temps réel et chiffrés de bout en bout.

- **Messages** : répondre en citant, **réactions** 👍 ❤️ 😂, **modifier**
  (48 h) et **supprimer pour tout le monde**, @**mentions** dans les groupes,
  **recherche** dans une conversation, **sondages**, **photos**, **fichiers**
  (PDF, documents…), **messages vocaux**, **messages éphémères** (24 h ou
  7 jours), « … écrit », « Vu » et « Vu par N » dans les groupes, appui long
  ou clic droit pour le menu d'un message, glisser pour y répondre.
- **Conversations** : épingler, archiver, sourdine (1 h, 8 h, 1 semaine,
  toujours), photo de profil et de groupe, **lien d'invitation** pour
  rejoindre un groupe, « en ligne » / « vu à » (masquable).
- **Appels** audio et vidéo à deux, avec **partage d'écran** ; **appels de
  groupe** jusqu'à 4 personnes ; notifications des messages et des appels.
- **Groupes** : admins (propriétaire, nommer ou retirer un admin), ajout et
  retrait de membres, **privation de parole temporaire**, réglages « qui peut
  écrire / modifier les infos / ajouter des membres », événements dans la
  conversation (« Alice a ajouté Bob »).
- **Sécurité** : **vérification du chiffrement** (numéro de sécurité et code
  QR), alerte si la clé d'un contact change, **blocage**, suppression du
  compte.
- **Application** : **installable** (écran d'accueil, plein écran),
  **hors ligne**, thème clair/sombre/auto, interface pensée pour le mobile.

### Configuration : [FIREBASE.md](FIREBASE.md)

Le site a besoin d'un projet Firebase. Le guide [FIREBASE.md](FIREBASE.md)
explique pas à pas comment le créer, activer la connexion par e-mail (et, si
on veut, avec Google), créer la
base Firestore, y publier les règles et coller la configuration dans
`public/firebase-config.js`. Tant que ce n'est pas fait, le site affiche un
écran d'aide au lieu de la messagerie.

### Fonctionnement

GitHub Pages ne sert que des fichiers statiques : tout s'exécute dans le
navigateur, qui parle directement à Firebase.

- **Firebase Authentication** gère les comptes (e-mail + mot de passe, ou
  Google).
- **Cloud Firestore** stocke les profils, les conversations et les messages ;
  le site s'y abonne et se met à jour dès qu'un message arrive.
- **`firestore.rules`** est la vraie barrière de sécurité : la configuration
  web de Firebase est publique par conception, ce sont ces règles qui
  décident qui lit et écrit quoi (membres seuls, pas d'usurpation d'auteur,
  pseudos uniques, seul l'auteur modifie son message…).
- **`public/e2e.js`** chiffre les messages de bout en bout dans le navigateur
  (Web Crypto : ECDH P-256, HKDF, AES-GCM) : Firestore ne stocke que du texte
  chiffré, illisible même pour le propriétaire du projet. La clé privée de
  chaque compte est scellée par son mot de passe et par un code de secours
  (PBKDF2-SHA-256), affiché une seule fois à l'inscription. Les noms, pseudos,
  photos de profil, ainsi que les titres, descriptions, photos et membres des
  groupes restent en clair. Réactions et votes sont chiffrés avec la clé du
  message ; le numéro de sécurité (60 chiffres, ou code QR) permet de vérifier
  la clé d'un contact.

```text
usernames/{pseudo}                   { uid }
users/{uid}                          { name, username, createdAt, publicKey, photo }
avatars/{uid}                        { data, updatedAt }   (photo de profil)
presence/{uid}                       { at }                (« en ligne », « vu à »)
keys/{uid}                           { v, publicKey, byPassword, byRecovery, updatedAt }
settings/{uid}                       { blocked, muted, pinned, archived, keys, verified, hidePresence }
invites/{code}                       { cid, title, by, createdAt }   (lien d'invitation)
conversations/{cid}                  { type, members, title, createdBy,
                                       createdAt, updatedAt, lastMessage, lastRead, typing, ttl,
                                       admins, perms, description, photo, invite, room }   (groupes)
conversations/{cid}/messages/{mid}   { uid, enc, createdAt, exp, editedAt, notes, deleted… }
conversations/{cid}/media/{mid}      { uid, data, createdAt }   (photo ou vocal chiffré)
conversations/{cid}/restrictions/{uid} { until, by, at }   (membre privé de parole)
conversations/{cid}/photo/current    { data, updatedAt }   (photo du groupe)
calls/{callId}                       { cid, caller, callee, video, status, offer, answer, … }
calls/{callId}/callerCandidates/*    candidats ICE (WebRTC)
calls/{callId}/calleeCandidates/*
rooms/{rid}                          { cid, by, video, participants, beats }   (appel de groupe)
rooms/{rid}/links/{lid}              { from, to, offer, answer } + candidats
```

- **Photos et messages vocaux** (`public/media.js`) : redimensionnés ou
  limités dans le navigateur, chiffrés avec leur propre clé AES-GCM, puis
  rangés dans Firestore (≤ 1 Mo par document, sans Cloud Storage payant). La
  clé du fichier ne voyage que dans l'enveloppe chiffrée du message (`enc` v2).
- **Appels** (`public/calls.js`) : WebRTC de navigateur à navigateur ;
  Firestore ne sert qu'à la mise en relation (offre, réponse, candidats ICE).
  Serveurs STUN publics par défaut, relais TURN facultatif (`iceServers`).
  Les appels de groupe (`public/groupcall.js`) relient chaque participant à
  chacun des autres (4 au plus) via `rooms/{rid}/links`.
- **Notifications** (`public/notify.js`, `public/sw.js`) : notifications du
  navigateur et sonneries synthétisées, tant qu'un onglet est ouvert.
- **Hors ligne** : le service worker garde une copie du site et du SDK
  Firebase, et Firestore conserve les données déjà lues dans le navigateur
  (IndexedDB, effacé à la déconnexion) ; les messages écrits sans réseau
  partent à son retour.
- **Groupes** : un groupe naît avec son seul créateur, qui y ajoute les
  membres un par un ; les règles vérifient ainsi, à chaque ajout, que la
  personne n'a pas bloqué celle qui l'ajoute.

### Application Android : [`android/`](android/)

Une *Trusted Web Activity* : l'application ouvre <https://cybers1te.github.io/>
en plein écran dans Chrome, sans barre d'adresse. Le site reste son seul code,
donc chaque mise à jour du site arrive dans l'application sans nouvel APK.
Chrome lui confie les notifications du site, et les liens du site (invitations
à un groupe) l'ouvrent directement.

- `public/.well-known/assetlinks.json` prouve à Chrome que l'application et le
  site vont ensemble (empreinte SHA-256 de la clé de signature). Sans lui, ou
  avec une autre clé, l'application affiche une barre d'adresse.
- `public/message-me.apk` est l'APK signé, proposé dans Paramètres →
  Application sur Android.
- Le workflow `.github/workflows/android.yml` construit l'APK avec les outils
  Android de GitHub, l'essaie sur un émulateur et dépose l'APK **non signé**
  dans `android/dist/`. La clé de signature n'est jamais publiée : l'APK est
  signé à part (v1 + v2, `apksig`), puis copié dans `public/`.

Pour une nouvelle version (nom, icône, couleurs), augmenter `versionCode` dans
`android/app/build.gradle` et signer avec **la même clé**, sinon Android refuse
la mise à jour.

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
puis publie depuis `main` le site choisi par `SITE` (marketbuss, ou `public/`
pour message-me), avec la fiche de révision.

```text
public/index.html            Page unique de la messagerie
public/main.js               Application (Auth, Firestore, interface)
public/e2e.js                Chiffrement de bout en bout (Web Crypto)
public/media.js              Photos (compression), messages vocaux (enregistrement, lecture)
public/calls.js              Appels audio/vidéo à deux, partage d'écran (WebRTC)
public/groupcall.js          Appels de groupe (4 personnes, maillage WebRTC)
public/qr.js                 Générateur de codes QR (qrcode-generator, MIT)
public/sw.js                 Service worker : copie hors ligne, notifications
public/manifest.webmanifest  Application installable (nom, icônes)
public/.well-known/          Lien entre le site et l'application Android
android/                     Application Android (Trusted Web Activity)
public/notify.js             Notifications du navigateur et sonneries
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
