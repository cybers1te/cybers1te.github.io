// marketbuss — le contenu : outils, parcours, lexique, listes de contrôle.
//
// Des explications générales pour comprendre et s'entraîner. Rien ici n'est
// un conseil financier, juridique ou fiscal, et aucun chiffre ne décrit une
// entreprise réelle : les valeurs de départ sont des exemples.

export const ROLES = {
  entrepreneur: { id: 'entrepreneur', player: 'Joueur 1', name: 'Entrepreneur', sprite: 'founder', pitch: 'Je lance un projet', color: 'p1' },
  investisseur: { id: 'investisseur', player: 'Joueur 2', name: 'Investisseur', sprite: 'investor', pitch: 'Je finance des projets', color: 'p2' },
};

/* Les outils. `fields` : les cases à remplir (valeur de départ = un exemple). */
export const TOOLS = [
  {
    id: 'runway', role: 'entrepreneur', sprite: 'heart', kind: 'calc',
    name: 'Mois de survie',
    question: 'Combien de mois je tiens avec ma trésorerie ?',
    lead: 'Ta trésorerie, ce que tu dépenses, ce que tu encaisses : l\'outil compte les mois qu\'il te reste avant d\'être à sec.',
    fields: [
      { key: 'cash', label: 'Trésorerie aujourd\'hui', unit: '€', value: 60000, step: 1000, min: 0 },
      { key: 'burn', label: 'Dépenses par mois', unit: '€', value: 9000, step: 500, min: 0 },
      { key: 'revenue', label: 'Revenus par mois', unit: '€', value: 3000, step: 500, min: 0 },
      { key: 'growth', label: 'Croissance des revenus', unit: '% par mois', value: 4, step: 1, min: -99, max: 200 },
    ],
    read: [
      'Chaque colonne est ta trésorerie à la fin d\'un mois. Quand elle passe sous zéro, il n\'y a plus d\'argent.',
      'Si tes revenus rattrapent tes dépenses avant ce moment-là, tu es rentable et la trésorerie remonte.',
      'Une levée de fonds prend souvent plusieurs mois : mieux vaut la commencer bien avant le dernier mois.',
    ],
    limits: 'Le calcul suppose des dépenses constantes et une croissance régulière. En vrai, les mois ne se ressemblent pas : garde une marge.',
  },
  {
    id: 'dilution', role: 'entrepreneur', sprite: 'pie', kind: 'calc',
    name: 'Partage du gâteau',
    question: 'Quelle part je garde après une levée de fonds ?',
    lead: 'Quand des investisseurs entrent, ta part du capital diminue. L\'outil montre qui possède quoi après la levée.',
    fields: [
      { key: 'pre', label: 'Valorisation avant la levée', unit: '€', value: 2000000, step: 100000, min: 1, hint: 'Ce que vaut l\'entreprise avant l\'argent des investisseurs (pre-money).' },
      { key: 'raise', label: 'Montant levé', unit: '€', value: 500000, step: 50000, min: 0 },
      { key: 'pool', label: 'Réserve pour les futurs salariés', unit: '%', value: 10, step: 1, min: 0, max: 50, hint: 'Des parts mises de côté pour recruter, en % du capital après la levée.' },
      { key: 'founders', label: 'Part des fondateurs avant la levée', unit: '%', value: 100, step: 1, min: 0, max: 100 },
    ],
    read: [
      'Valorisation après la levée (post-money) = valorisation avant + montant levé.',
      'La part des investisseurs = montant levé ÷ valorisation après la levée.',
      'Ici, la réserve pour les salariés est prise sur la part de ceux qui étaient déjà là, comme les investisseurs le demandent souvent.',
    ],
    limits: 'Une vraie levée peut contenir d\'autres mécanismes (obligations convertibles, actions de préférence…) qui changent le partage. Fais relire les documents par un professionnel.',
  },
  {
    id: 'seuil', role: 'entrepreneur', sprite: 'flag', kind: 'calc',
    name: 'Ligne d\'arrivée',
    question: 'Combien de ventes pour ne plus perdre d\'argent ?',
    lead: 'Le seuil de rentabilité : le nombre de ventes par mois à partir duquel tes charges sont couvertes.',
    fields: [
      { key: 'price', label: 'Prix de vente', unit: '€', value: 49, step: 1, min: 0.01 },
      { key: 'variable', label: 'Coût par vente', unit: '€', value: 12, step: 1, min: 0, hint: 'Ce que chaque vente te coûte : matière, livraison, commission…' },
      { key: 'fixed', label: 'Charges fixes par mois', unit: '€', value: 3500, step: 100, min: 0, hint: 'Ce que tu paies même sans vendre : loyer, salaires, abonnements…' },
    ],
    read: [
      'Marge par vente = prix de vente − coût par vente.',
      'Seuil = charges fixes ÷ marge par vente, arrondi à la vente du dessus.',
      'Au-dessus du seuil, chaque vente ajoute sa marge à ton bénéfice.',
    ],
    limits: 'Le calcul suppose un seul produit et un prix fixe. Avec plusieurs produits, raisonne sur le panier moyen.',
  },
  {
    id: 'client', role: 'entrepreneur', sprite: 'target', kind: 'calc',
    name: 'Chasse au client',
    question: 'Un client me rapporte-t-il plus qu\'il ne me coûte ?',
    lead: 'Ce que tu dépenses pour gagner un client (CAC), et ce qu\'il te rapporte tant qu\'il reste (LTV).',
    fields: [
      { key: 'spend', label: 'Dépenses pour trouver des clients', unit: '€', value: 4000, step: 100, min: 0, hint: 'Publicité, salons, outils, sur une période donnée.' },
      { key: 'customers', label: 'Nouveaux clients sur la même période', unit: 'clients', value: 40, step: 1, min: 1 },
      { key: 'arpu', label: 'Revenu par client', unit: '€ par mois', value: 39, step: 1, min: 0.01 },
      { key: 'margin', label: 'Marge brute', unit: '%', value: 80, step: 1, min: 1, max: 100, hint: 'Ce qu\'il reste du revenu une fois le service rendu.' },
      { key: 'churn', label: 'Clients qui partent', unit: '% par mois', value: 4, step: 0.5, min: 0.1, max: 100 },
    ],
    read: [
      'CAC = dépenses ÷ nouveaux clients.',
      'LTV = revenu par mois × marge ÷ part des clients qui partent chaque mois.',
      'Repères souvent cités : une LTV d\'au moins 3 fois le CAC, et un CAC remboursé en moins de 12 mois.',
    ],
    limits: 'Avec peu de clients ou peu de mois de recul, le taux de départ est très incertain : la LTV aussi.',
  },
  {
    id: 'deck', role: 'entrepreneur', sprite: 'card', kind: 'checklist', list: 'deck',
    name: 'Les 10 diapos',
    question: 'Mon pitch deck est-il complet ?',
    lead: 'Les dix diapos qu\'un investisseur s\'attend à trouver. Coche ce que tu as déjà.',
    limits: 'Une liste ne remplace pas une histoire claire : une idée par diapo, et des chiffres vrais.',
  },
  {
    id: 'ticket', role: 'investisseur', sprite: 'coin', kind: 'calc',
    name: 'Retour de pièce',
    question: 'Que vaut mon ticket si l\'entreprise est revendue ?',
    lead: 'Un montant investi, une valorisation à l\'entrée, une à la sortie : l\'outil donne le multiple et le rendement par an.',
    fields: [
      { key: 'ticket', label: 'Montant investi', unit: '€', value: 25000, step: 1000, min: 1 },
      { key: 'post', label: 'Valorisation à l\'entrée, après la levée', unit: '€', value: 2500000, step: 100000, min: 1 },
      { key: 'dilution', label: 'Dilution lors des tours suivants', unit: '%', value: 50, step: 5, min: 0, max: 99, hint: 'À chaque nouvelle levée, ta part diminue.' },
      { key: 'exit', label: 'Valorisation à la sortie', unit: '€', value: 40000000, step: 1000000, min: 0 },
      { key: 'years', label: 'Durée', unit: 'ans', value: 7, step: 1, min: 1, max: 30 },
    ],
    read: [
      'Ta part à l\'entrée = montant investi ÷ valorisation après la levée.',
      'Ce que tu récupères = ta part à la sortie × valorisation à la sortie.',
      'Le rendement par an (TRI) est le taux qui, répété chaque année, donne ce multiple.',
    ],
    limits: 'C\'est un scénario, pas une prévision. Beaucoup de jeunes entreprises ne rendent pas la mise, et une sortie peut prendre bien plus longtemps que prévu.',
  },
  {
    id: 'composes', role: 'investisseur', sprite: 'chart', kind: 'calc',
    name: 'Boule de neige',
    question: 'Que deviennent mes versements avec les intérêts composés ?',
    lead: 'Les gains d\'une année produisent eux-mêmes des gains l\'année suivante. Sur la durée, l\'effet devient visible.',
    fields: [
      { key: 'initial', label: 'Capital de départ', unit: '€', value: 1000, step: 100, min: 0 },
      { key: 'monthly', label: 'Versement', unit: '€ par mois', value: 100, step: 10, min: 0 },
      { key: 'rate', label: 'Rendement', unit: '% par an', value: 6, step: 0.5, min: -50, max: 50 },
      { key: 'years', label: 'Durée', unit: 'ans', value: 20, step: 1, min: 1, max: 60 },
    ],
    read: [
      'En jaune, ce que tu as versé. En vert, ce que les intérêts ont ajouté.',
      'Plus la durée est longue, plus la partie verte grandit vite : c\'est l\'effet boule de neige.',
    ],
    limits: 'Le rendement est supposé constant. En vrai il varie d\'une année à l\'autre et peut être négatif ; frais, impôts et inflation ne sont pas comptés.',
  },
  {
    id: 'valo', role: 'investisseur', sprite: 'gem', kind: 'calc',
    name: 'Prix d\'entrée',
    question: 'À quelle valorisation entrer pour viser mon multiple ?',
    lead: 'Tu pars de la sortie que tu espères et du multiple que tu vises : l\'outil remonte à la valorisation maximale à l\'entrée.',
    fields: [
      { key: 'exit', label: 'Valorisation espérée à la sortie', unit: '€', value: 50000000, step: 1000000, min: 1 },
      { key: 'multiple', label: 'Multiple visé', unit: 'fois la mise', value: 10, step: 1, min: 0.1 },
      { key: 'dilution', label: 'Dilution lors des tours suivants', unit: '%', value: 50, step: 5, min: 0, max: 99 },
      { key: 'ticket', label: 'Montant investi', unit: '€', value: 50000, step: 5000, min: 0, hint: 'Facultatif : pour connaître ta part.' },
    ],
    read: [
      'Valorisation maximale après la levée = valorisation de sortie × (1 − dilution) ÷ multiple visé.',
      'Au-dessus de cette valorisation, il faudrait une sortie plus grosse pour atteindre le même multiple.',
    ],
    limits: 'Tout repose sur la sortie espérée, que personne ne connaît à l\'avance. Teste plusieurs scénarios.',
  },
  {
    id: 'diligence', role: 'investisseur', sprite: 'lens', kind: 'checklist', list: 'diligence',
    name: 'La loupe',
    question: 'Ai-je vérifié l\'essentiel avant d\'investir ?',
    lead: 'Douze questions à se poser avant de signer. Coche celles auxquelles tu as une réponse solide.',
    limits: 'Une liste de questions ne remplace pas l\'avis d\'un avocat ou d\'un expert-comptable sur les documents.',
  },
];

export const CHECKLISTS = {
  deck: [
    ['Le problème', 'Qui souffre de quoi, et combien ça lui coûte aujourd\'hui.'],
    ['La solution', 'Ce que tu fais, en une phrase qu\'un enfant de 12 ans comprend.'],
    ['Le produit', 'Une démo, des captures : montrer vaut mieux que décrire.'],
    ['Le marché', 'Combien de clients possibles, et lesquels en premier.'],
    ['Le modèle économique', 'Qui paie, combien, et à quelle fréquence.'],
    ['La traction', 'Clients, revenus, croissance : uniquement des chiffres vrais et vérifiables.'],
    ['La concurrence', 'Les autres solutions, et pourquoi un client te choisirait.'],
    ['L\'équipe', 'Pourquoi vous êtes les bonnes personnes pour ce projet.'],
    ['La levée', 'Le montant, ce qu\'il finance, et jusqu\'à quelle étape il vous mène.'],
    ['La suite', 'Les prochains objectifs, datés, et comment te joindre.'],
  ],
  diligence: [
    ['L\'équipe', 'Qui sont les fondateurs, que font-ils à plein temps, se connaissent-ils depuis longtemps ?'],
    ['Le problème', 'Des clients confirment-ils qu\'il est réel et pénible ?'],
    ['Le produit', 'L\'ai-je vu fonctionner moi-même ?'],
    ['Les clients', 'Puis-je parler à deux ou trois clients ?'],
    ['Les chiffres', 'Revenus et croissance sont-ils prouvés par des documents ?'],
    ['Le marché', 'Est-il assez grand pour la sortie espérée ?'],
    ['La concurrence', 'Qui d\'autre résout ce problème, et avec quels moyens ?'],
    ['Le modèle économique', 'Un client rapporte-t-il plus qu\'il ne coûte ?'],
    ['Le capital', 'Qui possède quoi aujourd\'hui, et qu\'est-ce qui a déjà été promis ?'],
    ['Le juridique', 'Marque, code, contrats : tout appartient-il bien à l\'entreprise ?'],
    ['L\'usage des fonds', 'Que finance la levée, et pour combien de mois ?'],
    ['Les conditions', 'Valorisation, droits et documents : relus par un professionnel ?'],
  ],
};

/* Le parcours : six niveaux, de l'idée à la série A. */
export const LEVELS = [
  { name: 'L\'idée', goal: 'Vérifier que le problème existe.',
    todo: ['Parler à des clients possibles avant de construire', 'Écrire le problème en une phrase', 'Regarder comment les gens se débrouillent aujourd\'hui'],
    investor: 'À ce stade, presque personne n\'investit : il n\'y a que toi et ton idée.', tools: ['seuil'] },
  { name: 'Le MVP', goal: 'Construire la plus petite version qui rend service.',
    todo: ['Garder une seule fonction : celle qui résout le problème', 'La mettre entre les mains de vrais utilisateurs', 'Noter ce qu\'ils font, pas seulement ce qu\'ils disent'],
    investor: 'Les proches et les premiers soutiens regardent surtout les fondateurs.', tools: ['runway'] },
  { name: 'Les premiers clients', goal: 'Faire payer quelqu\'un.',
    todo: ['Fixer un prix et le tester', 'Mesurer ce que coûte un client et ce qu\'il rapporte', 'Demander des avis écrits'],
    investor: 'Un premier revenu, même petit, prouve que le problème vaut de l\'argent.', tools: ['client', 'seuil'] },
  { name: 'Le pré-seed', goal: 'Financer le passage du prototype au produit.',
    todo: ['Préparer le pitch deck', 'Calculer combien lever et pour combien de mois', 'Rencontrer des business angels'],
    investor: 'Les business angels regardent l\'équipe, le marché et les premiers signes de traction.', tools: ['deck', 'dilution', 'runway'] },
  { name: 'Le seed', goal: 'Prouver que le produit trouve son marché.',
    todo: ['Montrer une croissance régulière', 'Recruter les premières personnes clés', 'Suivre ses chiffres chaque mois'],
    investor: 'Les fonds d\'amorçage veulent voir des clients qui restent et un coût d\'acquisition maîtrisé.', tools: ['client', 'dilution'] },
  { name: 'La série A', goal: 'Passer à l\'échelle ce qui marche déjà.',
    todo: ['Répéter la vente de façon prévisible', 'Structurer l\'équipe', 'Préparer des comptes solides'],
    investor: 'Les fonds de capital-risque regardent la croissance, les marges et la taille du marché.', tools: ['ticket', 'valo'] },
];

/* Le lexique. `who` : e = entrepreneur, i = investisseur, ei = les deux. */
export const GLOSSARY = [
  ['Amorçage (seed)', 'ei', 'Premier vrai tour de financement, pour passer d\'un produit qui marche chez quelques clients à une croissance régulière.'],
  ['ARR', 'ei', 'Revenu récurrent annuel : le MRR multiplié par 12.'],
  ['Bootstrapping', 'e', 'Développer son entreprise sans investisseurs, avec ses propres revenus.'],
  ['BSA-AIR', 'ei', 'En France, un accord d\'investissement rapide : l\'investisseur verse l\'argent maintenant et reçoit ses actions lors de la prochaine levée, souvent avec une décote.'],
  ['Burn rate', 'e', 'L\'argent que l\'entreprise dépense chaque mois. Le burn net retire les revenus.'],
  ['Business angel', 'ei', 'Une personne qui investit son propre argent dans de jeunes entreprises, souvent très tôt.'],
  ['CAC', 'e', 'Coût d\'acquisition client : ce que tu dépenses en moyenne pour gagner un client.'],
  ['Capital-risque (VC)', 'ei', 'Des fonds qui investissent l\'argent de tiers dans des entreprises jeunes et risquées, en visant quelques très gros succès.'],
  ['Churn', 'e', 'La part des clients qui partent sur une période, souvent par mois.'],
  ['Closing', 'ei', 'Le moment où les documents sont signés et l\'argent versé.'],
  ['Décote', 'ei', 'Une réduction sur le prix des actions, accordée à ceux qui ont investi plus tôt.'],
  ['Dilution', 'ei', 'La baisse de ta part du capital quand de nouvelles actions sont créées pour de nouveaux investisseurs.'],
  ['Due diligence', 'i', 'Les vérifications faites avant d\'investir : chiffres, contrats, capital, juridique.'],
  ['Lead investor', 'ei', 'L\'investisseur qui mène le tour : il négocie les conditions et les autres le suivent.'],
  ['Love money', 'e', 'L\'argent apporté par la famille et les amis au tout début.'],
  ['LTV', 'e', 'Valeur vie client : ce qu\'un client rapporte en moyenne pendant tout le temps où il reste.'],
  ['Marge brute', 'ei', 'Ce qu\'il reste du revenu après le coût direct du produit ou du service.'],
  ['MRR', 'ei', 'Revenu récurrent mensuel : ce que les abonnements rapportent chaque mois.'],
  ['Multiple', 'i', 'Ce que tu récupères divisé par ce que tu as investi. Un multiple de 3 : trois fois la mise.'],
  ['MVP', 'e', 'Produit minimum viable : la plus petite version qui rend déjà service à un vrai utilisateur.'],
  ['Pacte d\'associés', 'ei', 'Le contrat qui fixe les règles entre associés : décisions, sortie, départ d\'un fondateur.'],
  ['Pitch deck', 'e', 'La présentation, en une dizaine de diapos, qui raconte le projet à un investisseur.'],
  ['Post-money', 'ei', 'La valorisation juste après la levée : pre-money + montant levé.'],
  ['Pre-money', 'ei', 'La valorisation de l\'entreprise juste avant l\'argent des nouveaux investisseurs.'],
  ['Product-market fit', 'e', 'Le moment où le produit répond si bien à un besoin que les clients viennent et restent sans qu\'on les pousse.'],
  ['Runway', 'e', 'Le nombre de mois que la trésorerie permet de tenir au rythme actuel.'],
  ['Série A', 'ei', 'Le tour qui suit l\'amorçage, pour passer à l\'échelle un modèle qui marche déjà.'],
  ['Table de capitalisation', 'ei', 'Le tableau qui dit qui possède combien de l\'entreprise.'],
  ['Term sheet', 'ei', 'La lettre qui résume les conditions proposées par un investisseur, avant les contrats définitifs.'],
  ['Ticket', 'i', 'Le montant qu\'un investisseur met dans une entreprise.'],
  ['Traction', 'ei', 'Les preuves que ça marche : clients, revenus, croissance, usage.'],
  ['TRI', 'i', 'Taux de rendement interne : le rendement par an d\'un investissement, en tenant compte de sa durée.'],
  ['Valorisation', 'ei', 'Le prix auquel on estime toute l\'entreprise lors d\'une levée.'],
  ['Vesting', 'ei', 'L\'acquisition progressive de ses parts : un fondateur ou un salarié qui part tôt n\'en garde qu\'une partie.'],
];

export const STAGES = ['Idée', 'MVP', 'Premiers clients', 'Pré-seed', 'Seed', 'Série A'];
