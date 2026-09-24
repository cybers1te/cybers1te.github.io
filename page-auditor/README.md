# Page Auditor — extension Chrome

Analyse **défensive** de la page que vous êtes en train de consulter. Un clic sur
l'icône inspecte ce qui est chargé dans l'onglet, signale les éléments suspects
et permet de les neutraliser.

## Ce qu'elle détecte

| Sévérité | Signal | Pourquoi c'est suspect |
| --- | --- | --- |
| Élevée | **Mineur de crypto** | Script qui fait référence à une famille de mineurs connue (coinhive, cryptoloot…) |
| Élevée | **Formulaire détourné** | Formulaire avec mot de passe ou carte bancaire envoyé à un **autre** domaine, par son `action` ou le `formaction` d'un bouton : hameçonnage |
| Élevée | **Capture clavier** | Champ mot de passe avec un gestionnaire clavier écrit dans la page |
| Moyenne | **Iframe masquée** | Iframe de 1 px, invisible ou rejetée hors de l'écran : clickjacking, publicité malveillante |
| Moyenne | **Code obfusqué** | Script qui combine plusieurs techniques de camouflage (`eval`, `atob`, `fromCharCode`…) |
| Moyenne | **Gestionnaire suspect** | Attribut `on…` qui exécute du code dynamique |
| Moyenne | **Redirection** | `meta refresh` vers un domaine tiers |
| Faible | **Script tiers** | Script externe au nom aléatoire |

## Ce qu'elle ne fait pas

Lisez ceci avant de vous y fier :

- **C'est un détecteur heuristique, pas un antivirus.** Il repère des *signaux*
  typiques. Un code malveillant bien écrit peut passer inaperçu, et un site
  honnête peut déclencher une alerte. Une page « sans signal » n'est pas pour
  autant garantie saine.
- **Le site n'est pas modifié.** « Neutraliser » agit uniquement sur la page
  affichée dans *votre* onglet. Au rechargement, tout revient, et les autres
  visiteurs ne voient aucune différence.
- **Retirer un script n'arrête pas un code déjà lancé.** Un mineur qui tourne
  déjà continue. Seules les iframes, les formulaires et les attributs `on…`
  sont réellement désarmés. En cas de mineur : **fermez l'onglet**.
- **Les écouteurs ajoutés en JavaScript sont invisibles.** Le navigateur ne
  permet pas de les lister ; seuls les attributs écrits dans le HTML le sont.

Pour une protection permanente, gardez un bloqueur à listes à jour (uBlock
Origin Lite) et la Protection renforcée de Chrome. Cette extension sert à
*comprendre* ce que contient une page.

## Installation

1. Ouvrez `chrome://extensions`.
2. Activez le **Mode développeur** (en haut à droite).
3. Cliquez sur **Charger l'extension non empaquetée** et choisissez le dossier
   `page-auditor/`.
4. Épinglez l'icône en forme de bouclier, puis cliquez dessus sur n'importe
   quelle page.

## Sécurité de l'extension elle-même

- **Permissions minimales** : `activeTab` + `scripting`. L'extension n'accède à
  une page **que** lorsque vous cliquez sur son icône ; elle ne lit rien en
  arrière-plan et n'envoie rien nulle part.
- **Monde isolé** : le moteur tourne dans le contexte isolé des extensions. La
  page analysée ne peut ni le voir ni falsifier son rapport, ce qu'un simple
  bookmarklet ne garantit pas.
- **Aucun HTML injecté** : les textes venus de la page (URL, extraits de code)
  sont affichés via `textContent`, jamais `innerHTML`. Une page hostile ne peut
  donc pas exécuter de code dans le popup.

## Fichiers

```text
manifest.json         Manifest V3, permissions activeTab + scripting
scanner.js            Moteur : détecteurs, rapport, neutralisation locale
popup.html / .js      Interface : compteurs, liste des alertes, boutons
icons/                Icônes 48 et 128 px
tests/engine.test.js  Tests du moteur dans Chromium (Playwright)
```

## Tests

```bash
NODE_PATH=$(npm root -g) node page-auditor/tests/engine.test.js
```

Le test sert une page piège (motifs inertes qui imitent des menaces) et une page
saine, et vérifie que chaque signal est détecté, que la neutralisation retire
toutes les alertes sans toucher au contenu légitime, et que la page saine ne
déclenche **aucun** faux positif. Aucune requête ne sort sur le réseau.
