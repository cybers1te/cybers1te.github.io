# Configurer Firebase pour message-me

Ce guide relie le site à **ton** projet Firebase. Compte une dizaine de
minutes. Aucune carte bancaire n'est demandée : la formule gratuite (Spark)
suffit largement pour un petit groupe d'amis.

Tant que ces étapes ne sont pas faites, <https://cybers1te.github.io/> affiche
un écran « Il ne manque plus que Firebase » : c'est normal.

## En deux mots : c'est quoi Firebase ?

Un service de Google qui fournit ce qu'un site statique comme GitHub Pages ne
sait pas faire :

| Service | Rôle dans message-me |
| --- | --- |
| **Authentication** | Crée les comptes (e-mail + mot de passe) et vérifie les connexions. |
| **Cloud Firestore** | La base de données : profils, conversations et messages, synchronisés en temps réel. |
| **Règles de sécurité** | Le fichier [`firestore.rules`](firestore.rules) : qui peut lire ou écrire quoi. |

Le site (sur GitHub Pages) parle directement à Firebase depuis le navigateur
de chaque visiteur. Il n'y a pas de serveur à faire tourner.

---

## Étape 1 — Créer le projet

1. Va sur <https://console.firebase.google.com/> et connecte-toi avec un compte Google.
2. Clique sur **Créer un projet** (ou **Ajouter un projet**).
3. Nom du projet : par exemple `message-me`. Firebase y ajoute parfois un
   suffixe (`message-me-3f2a1`) : c'est l'**identifiant du projet**.
4. Google Analytics n'est pas utile ici : tu peux le désactiver.
5. Clique sur **Créer le projet**, attends quelques secondes, puis **Continuer**.

## Étape 2 — Ajouter une application Web

C'est ce qui donne la « configuration » à coller dans le site.

1. Sur la page d'accueil du projet, clique sur l'icône **Web** (`</>`).
   Si tu ne la vois pas : ⚙ **Paramètres du projet** → onglet **Général** →
   section **Vos applications** → **Ajouter une application** → **Web**.
2. Surnom de l'application : `message-me`.
3. **Ne coche pas** « Configurer Firebase Hosting » (le site est déjà hébergé
   par GitHub Pages).
4. Clique sur **Enregistrer l'application**.
5. Firebase affiche un bloc de code contenant `const firebaseConfig = { … }`.
   **Garde cette page ouverte** : tu en auras besoin à l'étape 5. (Tu la
   retrouveras plus tard dans ⚙ Paramètres du projet → Général → Vos
   applications → Configuration du SDK → **Config**.)

## Étape 3 — Activer la connexion par e-mail

1. Menu de gauche : **Créer** (ou **Build**) → **Authentication** → **Commencer**.
2. Onglet **Méthode de connexion** (Sign-in method).
3. Clique sur **Adresse e-mail/Mot de passe**, active le **premier**
   interrupteur (pas besoin de « Lien envoyé par e-mail »), puis **Enregistrer**.

## Étape 4 — Créer la base de données et publier les règles

1. Menu de gauche : **Créer** → **Firestore Database** → **Créer une base de données**.
2. Si on te demande une édition, choisis **Standard**.
3. Emplacement : une région européenne, par exemple `eur3 (Europe)` ou
   `europe-west9 (Paris)`. **Ce choix est définitif.**
4. Mode : **Démarrer en mode production** (tout est bloqué par défaut ; on
   ouvre juste ce qu'il faut à l'étape suivante). Clique sur **Créer**.
5. Une fois la base créée, ouvre l'onglet **Règles**.
6. **Efface tout** le contenu de l'éditeur, puis colle **l'intégralité** du
   fichier [`firestore.rules`](firestore.rules) de ce dépôt
   (sur GitHub : ouvre le fichier → bouton **Copy raw file**).
7. Clique sur **Publier**.

> ⚠️ Ne choisis jamais le « mode test » et ne remplace pas les règles par
> `allow read, write: if true;` : n'importe qui pourrait alors lire et
> effacer tous les messages.

Aucun index n'est à créer : les requêtes du site n'en ont pas besoin.

## Étape 5 — Coller la configuration dans le site

1. Sur GitHub, ouvre le fichier [`public/firebase-config.js`](public/firebase-config.js).
2. Clique sur le **crayon** (Edit this file).
3. Recopie chaque valeur de l'étape 2 entre les guillemets correspondants.
   Le résultat ressemble à ceci (avec tes valeurs) :

   ```js
   export const firebaseConfig = {
     apiKey: "AIzaSyD…",
     authDomain: "message-me-3f2a1.firebaseapp.com",
     projectId: "message-me-3f2a1",
     storageBucket: "message-me-3f2a1.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abc123…"
   };
   ```

4. Clique sur **Commit changes…** puis valide sur la branche `main`.
5. L'onglet **Actions** du dépôt montre le déploiement en cours ; au bout
   d'une à deux minutes il passe au vert et le site est à jour.

> **Est-ce grave que la clé soit publique ?** Non. Ces valeurs identifient le
> projet, elles ne donnent aucun droit : elles finissent de toute façon dans
> le navigateur de chaque visiteur. Ce qui protège les données, ce sont les
> règles publiées à l'étape 4.

## Étape 6 — Autoriser le domaine du site

Firebase refuse les connexions venant d'un site qu'il ne connaît pas.

1. **Authentication** → onglet **Paramètres** → **Domaines autorisés**.
2. **Ajouter un domaine** : `cybers1te.github.io` → **Ajouter**.

(`localhost` et `<ton-projet>.web.app` sont autorisés d'office.)

## Étape 7 — Essayer

1. Ouvre <https://cybers1te.github.io/> (au besoin, recharge avec Ctrl+F5).
2. Onglet **Inscription** : nom affiché, pseudo, e-mail, mot de passe.
3. Crée un deuxième compte dans une fenêtre de navigation privée (ou demande
   à un ami), puis **+** → tape son `@pseudo` → **Démarrer**.
4. Les messages arrivent instantanément des deux côtés.

Dans la console, **Firestore Database → Données** montre ce qui est stocké,
et **Authentication → Utilisateurs** la liste des comptes (c'est là que tu
peux en supprimer un ou le désactiver).

---

## En cas de problème

Le site affiche un message clair qui renvoie à l'étape concernée :

| Message affiché | À vérifier |
| --- | --- |
| « Il ne manque plus que Firebase » | Étape 5 : `apiKey` et `projectId` sont-ils remplis ? Le déploiement est-il terminé ? |
| « La connexion par e-mail n'est pas activée » | Étape 3. |
| « Accès refusé par les règles Firestore » | Étape 4 : les règles ont-elles été collées en entier et **publiées** ? |
| « Base Firestore introuvable » | Étape 4 : la base a-t-elle été créée ? |
| « La clé d'API … est invalide » | Étape 5 : une valeur mal recopiée (guillemet en trop, espace…). |
| « Ce site n'est pas un domaine autorisé » | Étape 6. |
| « Impossible de charger Firebase » | Un bloqueur de publicités filtre `www.gstatic.com`, ou pas de connexion. |

Pour voir le détail d'une erreur : touche **F12** → onglet **Console**.

## Ce que protègent les règles

[`firestore.rules`](firestore.rules) garantit notamment que :

- il faut être connecté pour lire quoi que ce soit ;
- un pseudo appartient à une seule personne et ne peut pas être volé ;
- seuls les membres d'une conversation en lisent les messages ;
- personne ne peut envoyer un message au nom d'un autre, ni antidater un
  message, ni modifier ou supprimer un message envoyé ;
- on ne peut que se retirer soi-même d'un groupe, jamais ajouter ou exclure
  quelqu'un après coup ;
- les listes complètes (tous les comptes, tous les pseudos, toutes les
  conversations) ne sont jamais lisibles.

Ces règles sont testées automatiquement (`npm test`, et à chaque push par
GitHub Actions). **Si tu modifies `firestore.rules` dans le dépôt, republie-le
dans la console (étape 4)** : GitHub ne l'envoie pas à Firebase tout seul.

Les messages ne sont **pas** chiffrés de bout en bout : en tant que
propriétaire du projet, tu peux les lire dans la console. Le site le signale
sur son écran de connexion.

## Pour aller plus loin (facultatif)

Ces commandes demandent [Node.js](https://nodejs.org/) 20+ et, pour les
émulateurs, Java 21.

```bash
npm install

# Essayer le site en local, sans toucher à ton vrai projet :
npm run dev                 # puis ouvre http://127.0.0.1:5000/?emulateurs

# Lancer les tests des règles de sécurité :
npm test

# Publier les règles depuis le terminal plutôt que par copier-coller :
npx firebase login
npx firebase deploy --only firestore --project <identifiant-du-projet>

# Héberger aussi le site sur Firebase (https://<identifiant>.web.app) :
npx firebase deploy --only hosting --project <identifiant-du-projet>
```

**Restreindre la clé d'API** (protection supplémentaire contre l'usage de ta
clé par d'autres sites) : dans la [console Google Cloud](https://console.cloud.google.com/apis/credentials)
du projet, ouvre la clé « Browser key », choisis **Sites web** comme
restriction d'application et ajoute `https://cybers1te.github.io/*` ainsi que
`https://<identifiant-du-projet>.firebaseapp.com/*` (la page de
réinitialisation de mot de passe envoyée par e-mail est hébergée là). Les
émulateurs locaux n'utilisent pas cette clé.
