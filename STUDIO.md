# Lancer Studio en 30 minutes

**Studio** est une activité de création de **sites vitrines pour commerces et
artisans** (boulangeries, salons de coiffure, restaurants, garages…) : ceux qui
n'ont qu'une fiche Google ou une page Facebook. Le principe qui la fait tourner
vite : tu envoies à chaque commerce **une maquette de son futur site, déjà
prête**, et il ne paie qu'après l'avoir validée.

Le dépôt contient tout ce qu'il faut :

| Fichier | Rôle | Adresse une fois publié |
| --- | --- | --- |
| `studio/index.html` | Page de vente : offre, tarifs, questions, formulaire de demande | `/studio/` |
| `studio/exemple/` | Maquette de site, personnalisée par l'URL (métier, nom, ville) | `/studio/exemple/?metier=…&nom=…&ville=…` |
| `studio/prospection.html` | Outil privé : trouve des commerces, génère le lien de maquette et le message à envoyer, suit tes contacts | `/studio/prospection.html` |
| `studio/config.js` | **Le seul fichier à remplir** : ton nom, ton e-mail, tes prix | — |
| `studio/metiers.js` | Contenu type de chaque métier (textes, horaires, couleurs) | — |

Soyons clairs sur ce que « 30 minutes » veut dire : c'est le temps pour que
l'activité soit **en ligne, crédible, et que tes 10 premières propositions
soient parties**. Le moment où un commerçant répond oui ne dépend pas de toi :
compte plutôt quelques jours, et beaucoup de contacts pour une vente. La
régularité fait tout : 10 commerces par jour.

| Minutes | Étape |
| --- | --- |
| 0 → 5 | [Remplir la configuration](#minute-0-à-5--remplir-la-configuration) |
| 5 → 10 | [Publier](#minute-5-à-10--publier) |
| 10 → 25 | [Contacter tes 10 premiers commerces](#minute-10-à-25--contacter-tes-10-premiers-commerces) |
| 25 → 30 | [Déclarer ton activité](#minute-25-à-30--déclarer-ton-activité) |

---

## Minute 0 à 5 — Remplir la configuration

Ouvre [`studio/config.js`](studio/config.js) et remplis :

- **`email`** (obligatoire) : l'adresse qui reçoit les demandes. Elle est
  affichée publiquement : crée plutôt une adresse dédiée à l'activité que
  d'utiliser ton adresse personnelle.
- **`owner`** et **`city`** : ton prénom et ton nom, ta ville ou ta zone.
- **`phone`** (facultatif) au format `+33612345678`, et `whatsapp: true` si tu
  veux un bouton WhatsApp.
- **`name`** : le nom commercial (par défaut « Cybersite Studio »).

Les formules (`offers`) sont prêtes : Express 290 €, Vitrine 590 €, Sérénité
29 €/mois. Change les prix, les délais ou le contenu si tu veux : la page de
vente et l'outil de prospection suivent automatiquement. Annonce des délais
que tu peux tenir avec ton emploi du temps réel.

## Minute 5 à 10 — Publier

Fusionne la branche dans `main`. Le workflow GitHub Actions lance les tests
puis publie le site ; au bout de deux ou trois minutes :

1. <https://cybers1te.github.io/studio/> affiche la page de vente, **sans** le
   bandeau jaune « Configuration requise ».
2. Clique sur les métiers sous le téléphone : la maquette change.
3. Ouvre <https://cybers1te.github.io/studio/prospection.html> et
   **ajoute-la à tes favoris** : elle n'est liée nulle part sur le site.

## Minute 10 à 25 — Contacter tes 10 premiers commerces

Tout se passe dans l'outil de prospection :

1. **Trouver.** Choisis un métier et ta ville, puis « Chercher sur Google
   Maps ». Ouvre les fiches une à une : celles **sans bouton « Site Web »**
   (ou avec seulement une page Facebook) sont tes prospects.
2. **Personnaliser.** Tape le nom du commerce : le lien de maquette et trois
   messages (e-mail, SMS/réseaux sociaux, discours oral) se remplissent seuls.
   Ouvre le lien pour vérifier ce que le commerçant verra.
3. **Envoyer.** Par l'e-mail de la fiche, en message Instagram ou Facebook, ou
   — le plus efficace — **en passant au magasin** en dehors des heures
   d'affluence, maquette ouverte sur ton téléphone.
4. **Suivre.** « Ajouter ce commerce au suivi », puis mets à jour le statut
   quand il répond. Le tableau calcule tes réponses, tes clients et ce que tu
   as encaissé. (Il est gardé dans ce navigateur uniquement.)

Quelques règles :

- Une seule relance, trois ou quatre jours plus tard. Pas plus.
- La prospection par e-mail auprès de professionnels est autorisée si elle
  concerne leur activité et permet de refuser la suite : c'est le rôle de la
  ligne « Répondez simplement STOP » du modèle. Respecte chaque STOP.
- Ajoute une phrase à toi quand tu peux (« j'adore vos éclairs ») : un message
  qui sent le copier-coller finit à la corbeille.

### Réponses aux objections courantes

| On te dit… | Tu réponds… |
| --- | --- |
| « J'ai déjà une page Facebook. » | « Elle est très bien pour vos habitués. Le site, c'est pour ceux qui vous cherchent sur Google sans être sur Facebook, et il vous appartient. » |
| « C'est trop cher. » | « C'est un paiement unique, sans abonnement. S'il vous amène quelques nouveaux clients, il est rentabilisé. » |
| « Je n'ai pas le temps. » | « Vous n'avez rien à faire : l'aperçu est prêt, il me faut juste vos photos et vos horaires. » |
| « Je vais réfléchir. » | « Bien sûr. L'aperçu reste en ligne, je vous recontacte dans quelques jours ? » |

## Minute 25 à 30 — Déclarer ton activité

Pour encaisser légalement, déclare une **micro-entreprise** sur le guichet
unique <https://formalites.entreprises.gouv.fr/> (gratuit, en ligne). Activité
à déclarer : création de sites internet (prestation de services).

- Le **SIRET** arrive par courrier ou e-mail quelques jours à quelques
  semaines plus tard. En attendant, les mentions légales du site affichent
  « en cours d'attribution » ; reporte-le ensuite dans `legal.siret` de
  `config.js`, avec ton adresse dans `legal.address`.
- Tu paies des **cotisations sociales** en pourcentage de ce que tu encaisses
  (de l'ordre de 20 à 25 % pour ce type d'activité) : rien si tu n'encaisses
  rien.
- **TVA** : en micro-entreprise, tu bénéficies en général de la franchise en
  base, d'où la mention « TVA non applicable, art. 293 B du CGI » sur la page
  et les factures, tant que ton chiffre d'affaires reste sous le seuil.
- **Mineur ?** C'est possible, mais avec l'autorisation écrite de tes parents
  (ou de ton tuteur). Vérifie les conditions sur <https://www.service-public.fr/>
  avant de te lancer. Les services de paiement en ligne (Stripe, PayPal)
  exigent en général d'être majeur : le virement bancaire reste possible.

---

## Quand un commerçant dit oui

1. **Récupère le contenu** : 5 à 10 photos, les horaires exacts, l'adresse, le
   téléphone, les textes ou produits à mettre en avant.
2. **Encaisse l'acompte de 50 %** : lien de paiement (Stripe Payment Links,
   PayPal, SumUp…) ou virement. Si tu crées un lien de paiement, colle-le dans
   `paymentLink` de la formule : la carte des tarifs affichera « Maquette
   validée ? Payer l'acompte ».
3. **Construis le vrai site** à partir de `studio/exemple/` : remplace les
   textes, ajoute les photos, et rends les boutons réels (ils sont inertes
   dans la maquette, repérés par `data-demo`) :
   - Appeler : `href="tel:+33612345678"`
   - Itinéraire : `href="https://www.google.com/maps/search/?api=1&query=ADRESSE"`
   - E-mail : `href="mailto:contact@commerce.fr"`
   - Retire le bandeau de maquette et ajoute les mentions légales du commerce.
4. **Héberge-le** sur Cloudflare Pages (offre gratuite) plutôt que sur
   GitHub Pages, dont les conditions d'utilisation ne visent pas les sites
   commerciaux de tiers.
5. **Nom de domaine** : achète-le **au nom du client** chez un registraire
   (OVHcloud, Gandi…), environ 10 à 15 € par an pour un `.fr`, et relie-le au
   site.
6. **Facture le solde** à la mise en ligne. Une facture doit notamment porter
   un numéro unique et chronologique, la date, ton nom suivi de « EI », ton
   adresse et ton SIRET, le nom et l'adresse du client, la désignation et le
   prix de la prestation, la mention de TVA ci-dessus, la date d'échéance, le
   taux des pénalités de retard et, entre professionnels, l'indemnité
   forfaitaire de 40 € pour frais de recouvrement. Ces règles évoluent avec la
   réforme de la facturation électronique : vérifie la liste à jour sur
   <https://entreprendre.service-public.fr/>.
7. **Propose la formule Sérénité** : c'est elle qui transforme des ventes
   ponctuelles en revenu régulier.

## Personnaliser l'offre

- **Prix, formules, textes des cartes** : `offers` dans `studio/config.js`.
- **Ajouter un métier** : copie un bloc de `studio/metiers.js`, change sa clé
  (sans accents, elle apparaît dans l'URL), ses textes, ses horaires et ses
  couleurs. Il apparaît aussitôt dans la page de vente, la maquette et
  l'outil de prospection.
- **Tester en local** : `python3 -m http.server` à la racine du dépôt, puis
  <http://localhost:8000/studio/>.
