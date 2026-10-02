// marketbuss — les mots du site, en français (langue d'origine).
//
// Les trois fichiers de langue ont exactement la même forme (vérifié par
// plateforme/tests/langues.test.js). Rien ici n'est un conseil financier,
// juridique ou fiscal : ce sont des explications générales.
//
// F : les formats de la langue (F.money, F.pct, F.nf, F.times, F.ord, F.plural).

const lower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
// Un groupe de mots : la majuscule ne saute que devant un petit mot courant (pas devant un nom propre).
const soft = (s) => (/^(le|la|les|un|une|des|du|de|nos|vos|mes|tes|ses|leurs?|ce|cet|cette|ces|tous|toutes|chaque|on|il|elle|ils|elles|nous|vous)(\s|$)/i.test(s) || /^[ld]['’]/i.test(s) ? lower(s) : s);
// « à le » → « au », « à les » → « aux ».
const after = (s) => { const x = soft(s); return /^les\s/.test(x) ? 'aux ' + x.slice(4) : /^le\s/.test(x) ? 'au ' + x.slice(3) : 'à ' + x; };

export default {
  code: 'fr',
  name: 'Français',
  locale: 'fr-FR',

  money(n, nf) {
    const a = Math.abs(n);
    if (a >= 1e9) return nf(n / 1e9, 2) + ' Md €';
    if (a >= 1e6) return nf(n / 1e6, 2) + ' M €';
    if (a >= 100 || Number.isInteger(n)) return nf(Math.round(n)) + ' €';
    return nf(n, 2) + ' €';
  },
  pct: (text) => text + ' %',
  times: (text) => text + ' ×',
  ord: (n) => (n === 1 ? '1er' : n + 'e'),
  plural: (n, one, many) => (n > 1 ? many || one + 's' : one),

  /* Le pitch en une phrase : `p` = les morceaux déjà nettoyés. */
  pitch(p) {
    const who = soft(p.who);
    const short = `${p.name} aide ${who} à ${lower(p.solution)}.`;
    const first = p.problem ? `${p.name} aide ${who}, qui ${lower(p.problem)}, à ${lower(p.solution)}.` : short;
    let second = '';
    if (p.unlike && p.edge) second = `Contrairement ${after(p.unlike)}, ${soft(p.edge)}.`;
    else if (p.edge) second = `Notre différence : ${soft(p.edge)}.`;
    return { short, text: first + (second ? ' ' + second : '') };
  },

  ui: {
    title: 'marketbuss — outils pour entrepreneurs et investisseurs',
    description: 'marketbuss : des bornes gratuites pour entrepreneurs, indépendants, investisseurs et épargnants, et les vrais outils du moment. Sans compte.',
    skip: 'Aller au contenu',
    loading: 'Chargement…',
    language: 'Langue',
    nav: { outils: 'Bornes', arsenal: 'Arsenal', parcours: 'Parcours', pitch: 'Pitch', lexique: 'Lexique', 'a-propos': 'À propos' },
    foot: {
      blurb: 'Des outils gratuits pour entrepreneurs, indépendants, investisseurs et épargnants. Sans compte : tout se calcule dans ton navigateur.',
      links: { outils: 'Toutes les bornes', arsenal: "L'arsenal", parcours: 'Le parcours', pitch: 'Carte de pitch', lexique: 'Le lexique', 'a-propos': 'À propos' },
      note: "Les outils servent à comprendre et à s'entraîner. Ce ne sont pas des conseils financiers, juridiques ou fiscaux. Investir est risqué : on peut perdre toute sa mise.",
    },
    all: 'Tous',
    player: 'Joueur',
    result: 'Résultat',
    yourNumbers: 'Tes chiffres',
    reset: "Remettre l'exemple",
    copyLink: 'Copier le lien',
    linkCopied: 'Lien copié, avec tes chiffres.',
    copy: 'Copier',
    copied: 'Copié.',
    copyFail: 'Copie impossible : sélectionne le texte et copie-le à la main.',
    clear: 'Tout effacer',
    seeValues: 'Voir les valeurs',
    steps: 'Le calcul, pas à pas',
    stepsSub: 'Avec tes chiffres, arrondis.',
    levers: 'Ce qui fait bouger le résultat',
    leversSub: "Chaque bouton change un chiffre d'un cran et montre le résultat qu'il donnerait. La barre jaune montre ceux qui pèsent le plus.",
    leverTry: (label, step, result) => `${label} ${step} : le résultat deviendrait ${result}`,
    slider: (label) => `${label} (curseur)`,
    highest: (v) => `Le plus haut : ${v}`,
    newTab: '(nouvel onglet)',
    nTools: (n) => `${n} borne${n > 1 ? 's' : ''}`,
    nItems: (n) => `${n} outil${n > 1 ? 's' : ''}`,
    nWords: (n) => `${n} mot${n > 1 ? 's' : ''}`,
    fineprint: "Ces outils servent à comprendre et à s'entraîner. Ce ne sont pas des conseils financiers, juridiques ou fiscaux.",

    home: {
      insert: 'Outils gratuits, sans compte',
      tagline: "La salle d'arcade des entrepreneurs et des investisseurs.",
      lead: 'Chiffrer un projet, fixer un prix, préparer une levée, juger un placement : des bornes qui calculent, et les vrais outils du moment.',
      choose: 'Choisis ton joueur',
      tools: 'Les bornes',
      toolsSub: (n) => `${n} bornes qui répondent chacune à une question. Les chiffres de départ sont des exemples : remplace-les par les tiens.`,
      arsenal: "L'arsenal",
      arsenalSub: (n, date) => `Les vrais outils du moment, rangés par besoin : ${n} outils et services publics, vérifiés le ${date}. Aucun lien sponsorisé.`,
      arsenalOpen: "Ouvrir l'arsenal",
      guides: 'Les guides',
      guidesSub: "Des personnages inventés. Sur chaque borne, l'un d'eux te donne un conseil.",
      path: 'Le parcours',
      pathSub: "De l'idée à la série A, en six niveaux : quoi faire, et ce que regarde un investisseur à chaque étape.",
      card: 'Ta carte de pitch',
      cardText: "Résume ton projet sur une carte, et partage-la avec un simple lien. Rien n'est enregistré chez nous.",
      cardOpen: 'Créer ma carte',
      glossary: 'Le lexique',
      glossaryText: (n) => `Pre-money, TVA, runway, ETF… ${n} mots de l'entreprise et de l'argent, expliqués simplement.`,
      glossaryOpen: 'Ouvrir le lexique',
      lab: 'Le labo',
      labSub: 'Les projets lancés par marketbuss.',
      labName: 'Répondeur IA',
      labText: "Un assistant qui répond tout seul aux questions des clients d'un commerce : horaires, prix, réservations. Première version, avec une démonstration à essayer.",
      labOpen: 'Voir le Répondeur IA',
    },

    tools: {
      all: 'Toutes les bornes',
      allSub: (n) => `${n} bornes, pour quatre joueurs.`,
      crumb: 'Bornes',
      howRead: 'Comment lire le résultat',
      howUse: "Comment s'en servir",
      inArsenal: "Dans l'arsenal",
      inArsenalSub: 'Les vrais outils qui vont avec cette borne.',
      others: 'Les autres bornes du joueur',
    },

    check: {
      label: 'points cochés',
      done: "Tout est coché. Fais relire par quelqu'un qui connaît le sujet.",
      none: 'Coche au fur et à mesure : ta progression reste enregistrée dans ce navigateur.',
      left: (n) => `Il te reste ${n} point${n > 1 ? 's' : ''} à traiter.`,
      progress: (a, b) => `${a} sur ${b}`,
      clear: 'Tout décocher',
    },

    writer: {
      words: 'Tes mots',
      out: 'Ton pitch',
      short: 'La phrase courte',
      full: 'La phrase complète',
      chars: (n) => `${n} caractères`,
      charsFull: (n) => `${n} caractères. Plus c'est court, mieux on s'en souvient.`,
      empty: 'Remplis au moins le nom, les personnes que tu aides et ce que tu leur permets de faire.',
      copied: 'Phrase copiée.',
      fields: {
        name: ['Nom du projet', 'Nordlys'],
        who: ['Tu aides qui ?', 'les boulangeries de quartier'],
        problem: ['Leur problème', 'jettent leurs invendus chaque soir', 'Facultatif. La suite de « qui… ».'],
        solution: ['Ce que tu leur permets de faire', 'vendre leurs invendus avant la fermeture', 'La suite de « à… ». Commence par un verbe.'],
        unlike: ["Ce qu'ils utilisent aujourd'hui", 'une remise en vitrine', 'Facultatif.'],
        edge: ['Ce qui change avec toi', 'les clients du quartier sont prévenus sur leur téléphone', 'Facultatif.'],
      },
    },

    canvas: {
      label: 'cases remplies',
      note: "Les numéros donnent l'ordre conseillé. Ton brouillon reste dans ce navigateur.",
      copy: 'Copier en texte',
      copied: 'Canvas copié en texte.',
      empty: "Remplis d'abord une case.",
      boxes: {
        problem: ['Problème', 'Les trois problèmes principaux de tes clients.'],
        segments: ['Clients', 'Qui exactement ? Et qui achètera en premier ?'],
        uvp: ['Promesse', 'En une phrase : pourquoi toi, et pas autre chose.'],
        solution: ['Solution', 'Ce que tu proposes face à chaque problème.'],
        channels: ['Canaux', 'Comment tes clients te découvrent et achètent.'],
        revenue: ['Revenus', 'Qui paie, combien, à quelle fréquence.'],
        costs: ['Coûts', 'Tes principales dépenses, fixes et par vente.'],
        metrics: ['Indicateurs', 'Les deux ou trois chiffres qui disent si ça marche.'],
        edge: ['Avantage', "Ce qu'un concurrent ne peut pas copier facilement."],
      },
    },

    levels: {
      title: 'Le parcours',
      sub: "Six niveaux, de l'idée à la série A. Chaque projet avance à son rythme : certains sautent des niveaux, beaucoup n'ont jamais besoin de lever des fonds.",
      level: 'Niveau',
      founder: 'Côté entrepreneur',
      investor: 'Côté investisseur',
      tools: 'Bornes utiles :',
      arsenal: "Dans l'arsenal :",
    },

    pitch: {
      title: 'Ta carte de pitch',
      sub: "Remplis les cases, la carte se met à jour. Le lien contient toute la carte : rien n'est enregistré sur un serveur.",
      shared: 'Carte de pitch',
      sharedSub: "Cette carte a été créée par un visiteur. marketbuss n'a pas vérifié ce qu'elle contient.",
      broken: 'Carte illisible',
      brokenSub: 'Le lien est incomplet ou abîmé. Demande à son auteur de te le renvoyer.',
      create: 'Créer ma carte',
      copy: 'Copier le lien de ma carte',
      copied: 'Lien de ta carte copié.',
      needName: "Donne d'abord un nom à ton projet.",
      warn: "N'écris que des chiffres vrais et vérifiables. Tout ce que tu mets sur la carte sera visible par ceux qui reçoivent le lien.",
      choose: 'Choisir',
      fields: {
        name: ['Nom du projet', 'Nordlys'],
        tagline: ["Ce qu'il fait, en une phrase", 'Aide les boulangeries à réduire leurs invendus'],
        stage: ['Stade', ''],
        sector: ['Secteur', 'Alimentation'],
        t1: ['Traction : un chiffre vrai', '38 boulangeries clientes'],
        t2: ['Un deuxième', '9 400 € de revenu par mois'],
        t3: ['Un troisième', '+14 % par mois depuis 6 mois'],
        ask: ['Ce que tu cherches', '800 000 €'],
        contact: ['Comment te joindre', 'Une adresse créée pour le projet'],
        use: ["À quoi servira l'argent", 'Recruter deux développeurs et ouvrir trois villes'],
      },
      card: { project: 'Projet', name: 'Nom du projet', tagline: 'Ce que fait ton projet, en une phrase.', traction: 'Traction', ask: 'Recherche', contact: 'Contact', foot: 'Carte de pitch, faite sur marketbuss' },
    },

    arsenal: {
      title: "L'arsenal",
      sub: (n, k) => `Les vrais outils du moment, rangés par besoin : ${n} outils et services publics, en ${k} rayons.`,
      notice: (date) => `Sélection vérifiée le ${date}. Aucun lien sponsorisé : marketbuss ne touche rien. L'ordre n'est pas un classement. Les offres changent vite : regarde les conditions sur le site officiel avant de t'engager.`,
      search: 'Chercher un outil ou un besoin',
      empty: 'Aucun outil ne correspond. Essaie un autre mot, ou retire le filtre.',
      fineprint: "« Sans abonnement » : une commission est prise sur chaque paiement. « Gratuit, limité » : l'offre gratuite existe mais se remplit vite. Les noms cités appartiennent à leurs propriétaires ; marketbuss n'a aucun lien avec eux.",
    },

    glossary: {
      title: 'Le lexique',
      sub: (n) => `${n} mots de l'entreprise et de l'argent, expliqués simplement.`,
      search: 'Chercher un mot',
      empty: 'Aucun mot ne correspond. Essaie un autre terme, ou retire le filtre.',
      useful: (name) => `Utile au joueur ${name}`,
    },

    about: {
      title: 'À propos',
      sub: "Ce qu'est marketbuss, et ce que ce n'est pas.",
      sections: (n) => [
        ['Ce que tu trouves ici', [
          `${n.tools} bornes pour chiffrer un projet, fixer un prix, évaluer un investissement ou comprendre un placement.`,
          `Un arsenal de ${n.arsenal} vrais outils et services publics, un parcours en six niveaux, un lexique de ${n.words} mots et une carte de pitch à partager.`,
          'Tout est gratuit et sans compte.',
          'Tout se calcule dans ton navigateur : tes chiffres ne sont envoyés nulle part. Les listes cochées et tes brouillons restent dans ce navigateur.',
        ]],
        ["Ce que marketbuss n'est pas", [
          "Pas un conseil financier, juridique ou fiscal : les outils servent à comprendre et à s'entraîner. Avant de signer ou d'investir, fais-toi accompagner par un professionnel.",
          'Pas une promesse : investir est risqué, et on peut perdre toute sa mise.',
          'Pas un annuaire : marketbuss ne met personne en relation et ne vérifie pas les cartes de pitch créées par les visiteurs.',
        ]],
        ["Comment l'arsenal est choisi", [
          `Chaque outil a été vérifié le ${n.date} : il est actif, l'adresse est celle de son site officiel, et l'offre gratuite annoncée existe.`,
          "La sélection s'appuie sur des comparatifs récents et sur les sites officiels. Ce n'est pas un classement, et elle n'est pas complète.",
          "Aucun lien sponsorisé ni affilié : marketbuss ne touche rien. Aucun courtier ni vendeur de placements n'est listé.",
          'Les offres et les prix changent vite : le site officiel fait foi.',
        ]],
        ['Les personnages et les exemples', [
          'Les joueurs et les guides (Mira, Noé, Sam, Max, Lou, Ada, Iris, Bit) sont des personnages inventés. Leurs conseils sont des repères généraux.',
          "Les valeurs affichées à l'ouverture de chaque borne sont des exemples inventés pour montrer le calcul. Elles ne décrivent aucune entreprise réelle.",
        ]],
        ['Fabrication', [
          'Le site est une page statique, sans dépendance. Les dessins sont en pixel art, tracés à la main dans le code.',
          'Les polices Press Start 2P et Jersey 15 sont sous licence libre OFL et hébergées avec le site.',
          'Le site existe en français, en anglais et en néerlandais. La langue choisie reste enregistrée dans ce navigateur.',
        ]],
      ],
    },

    missing: { title: 'Page introuvable', sub: "Cette page n'existe pas, ou le lien est incomplet.", home: "Retour à l'accueil", tools: 'Voir les bornes' },
  },

  roles: {
    entrepreneur: { name: 'Entrepreneur', pitch: 'Je lance un projet', about: 'Les outils pour chiffrer ton projet, le raconter et préparer une levée.' },
    independant: { name: 'Indépendant', pitch: 'Je vends mon travail', about: "Les outils pour fixer tes prix, trouver tes clients et savoir ce qu'il te reste." },
    investisseur: { name: 'Investisseur', pitch: 'Je finance des projets', about: 'Les outils pour évaluer un investissement et tester des scénarios.' },
    epargnant: { name: 'Épargnant', pitch: "Je m'occupe de mon épargne", about: "Les outils pour voir l'effet du temps, des frais et de la hausse des prix." },
  },

  guides: {
    mentor: { name: 'Mira', job: 'la mentore', line: 'Pose les questions qui fâchent, avant que les investisseurs ne les posent.' },
    accountant: { name: 'Noé', job: 'le comptable', line: "Aime les chiffres qui tombent juste et les factures envoyées à l'heure." },
    dev: { name: 'Sam', job: 'la dev', line: 'Construit vite, teste tôt, jette sans regret ce qui ne sert pas.' },
    designer: { name: 'Max', job: 'le designer', line: "Enlève tout ce qui n'aide pas le client à comprendre." },
    client: { name: 'Lou', job: 'la cliente', line: "Achète quand c'est clair, utile et au bon prix. Sinon, elle s'en va." },
    banker: { name: 'Ada', job: 'la banquière', line: "Regarde la trésorerie d'abord, les promesses ensuite." },
    angel: { name: 'Iris', job: 'la business angel', line: 'Investit tôt, perd souvent, et compte sur quelques gros succès.' },
    robot: { name: 'Bit', job: 'le robot', line: "Garde l'arsenal à jour et fait les calculs sans se fatiguer." },
  },

  /* Une borne : nom, question, présentation, champs {clé: [libellé, unité, aide]}, lecture, limites, conseil du guide. */
  tools: {
    runway: {
      name: 'Mois de survie',
      question: 'Combien de mois je tiens avec ma trésorerie ?',
      lead: "Ta trésorerie, ce que tu dépenses, ce que tu encaisses : l'outil compte les mois qu'il te reste avant d'être à sec.",
      fields: {
        cash: ["Trésorerie aujourd'hui", '€'],
        burn: ['Dépenses par mois', '€'],
        revenue: ['Revenus par mois', '€'],
        growth: ['Croissance des revenus', '% par mois'],
      },
      read: [
        "Chaque colonne est ta trésorerie à la fin d'un mois. Quand elle passe sous zéro, il n'y a plus d'argent.",
        'Si tes revenus rattrapent tes dépenses avant ce moment-là, tu es rentable et la trésorerie remonte.',
        'Une levée de fonds prend souvent plusieurs mois : mieux vaut la commencer bien avant le dernier mois.',
      ],
      limits: 'Le calcul suppose des dépenses constantes et une croissance régulière. En vrai, les mois ne se ressemblent pas : garde une marge.',
      tip: 'Regarde ce chiffre chaque mois, pas seulement quand ça va mal. Sous six mois, il faut agir.',
    },
    lever: {
      name: 'Plein de carburant',
      question: "Combien lever pour tenir jusqu'à la prochaine étape ?",
      lead: "Ce que tu dépenses, ce que tu encaisses, le nombre de mois à financer : l'outil donne le montant, et la part du capital à céder.",
      fields: {
        burn: ['Dépenses par mois, après la levée', '€', 'Avec les recrutements prévus.'],
        revenue: ['Revenus par mois', '€'],
        months: ['Mois à financer', 'mois'],
        buffer: ['Marge de sécurité', '%', 'Pour les retards et les imprévus.'],
        pre: ['Valorisation avant la levée', '€', 'Facultatif : pour connaître la part à céder.'],
      },
      read: [
        'Besoin = (dépenses − revenus) × nombre de mois, plus la marge de sécurité.',
        "Un repère souvent cité : de quoi tenir 18 à 24 mois, parce qu'une levée prend du temps et qu'il faut avoir avancé avant la suivante.",
        'Part cédée = montant levé ÷ (valorisation avant la levée + montant levé).',
      ],
      limits: 'Le calcul suppose des dépenses et des revenus constants. Si tes revenus grandissent, le besoin réel est plus faible : compare avec la borne « Mois de survie ».',
      tip: "Lève pour atteindre une étape précise, pas pour « tenir ». Un investisseur veut savoir ce que l'argent va prouver.",
    },
    dilution: {
      name: 'Partage du gâteau',
      question: 'Quelle part je garde après une levée de fonds ?',
      lead: "Quand des investisseurs entrent, ta part du capital diminue. L'outil montre qui possède quoi après la levée.",
      fields: {
        pre: ['Valorisation avant la levée', '€', "Ce que vaut l'entreprise avant l'argent des investisseurs (pre-money)."],
        raise: ['Montant levé', '€'],
        pool: ['Réserve pour les futurs salariés', '%', 'Des parts mises de côté pour recruter, en % du capital après la levée.'],
        founders: ['Part des fondateurs avant la levée', '%'],
      },
      read: [
        'Valorisation après la levée (post-money) = valorisation avant + montant levé.',
        'La part des investisseurs = montant levé ÷ valorisation après la levée.',
        'Ici, la réserve pour les salariés est prise sur la part de ceux qui étaient déjà là, comme les investisseurs le demandent souvent.',
      ],
      limits: "Une vraie levée peut contenir d'autres mécanismes (obligations convertibles, actions de préférence…) qui changent le partage. Fais relire les documents par un professionnel.",
      tip: "Une valorisation trop haute aujourd'hui rend la levée suivante plus difficile. Le bon prix est celui que tu sauras dépasser.",
    },
    vesting: {
      name: 'Sablier',
      question: 'Combien de mes parts sont vraiment à moi ?',
      lead: "Avec le vesting, les parts s'acquièrent avec le temps. L'outil montre ce qui est déjà acquis, et ce qui serait perdu en partant aujourd'hui.",
      fields: {
        stake: ['Part attribuée', '% du capital'],
        years: ["Durée d'acquisition", 'ans'],
        cliff: ['Période sans rien (cliff)', 'mois', "Avant cette date, rien n'est acquis."],
        elapsed: ['Temps écoulé', 'mois'],
      },
      read: [
        "Avant la fin du cliff, rien n'est acquis. À la fin du cliff, tout le temps écoulé compte d'un coup.",
        "Ensuite, les parts s'acquièrent mois après mois, jusqu'à la fin de la durée.",
        "Un schéma courant : 4 ans, dont un an de cliff.",
      ],
      limits: "Le calendrier exact, et ce qui se passe en cas de départ ou de vente de l'entreprise, sont écrits dans le pacte d'associés ou le plan d'attribution : c'est lui qui compte.",
      tip: "Le vesting protège ceux qui restent. Mets-le en place entre fondateurs dès le début : un investisseur le demandera de toute façon.",
    },
    marche: {
      name: 'Carte du monde',
      question: 'Quelle est la taille de mon marché ?',
      lead: "Tu pars du nombre de clients possibles et de ce que chacun rapporte : l'outil donne le marché total, la part que tu peux servir et celle que tu vises.",
      fields: {
        customers: ['Clients possibles en tout', 'clients', 'Tous ceux qui ont le problème que tu résous.'],
        price: ['Revenu par client', '€ par an'],
        reachable: ['Part que tu peux servir', '%', 'Ton pays, ta langue, ton type de client.'],
        share: ['Part que tu vises', '%', "Parmi ceux que tu peux servir, d'ici quelques années."],
      },
      read: [
        'Marché total (TAM) = clients possibles × revenu par client.',
        'Marché que tu peux servir (SAM) = le marché total × la part accessible.',
        "Marché que tu vises (SOM) = le marché que tu peux servir × la part visée. C'est le chiffre le plus utile pour ton plan.",
      ],
      limits: "Les deux pourcentages sont des hypothèses : dis d'où ils viennent. Une part de marché se gagne client par client.",
      tip: "Un investisseur croit plus volontiers un calcul parti des clients qu'un gros chiffre tiré d'une étude.",
    },
    client: {
      name: 'Chasse au client',
      question: "Un client me rapporte-t-il plus qu'il ne me coûte ?",
      lead: "Ce que tu dépenses pour gagner un client (CAC), et ce qu'il te rapporte tant qu'il reste (LTV).",
      fields: {
        spend: ['Dépenses pour trouver des clients', '€', 'Publicité, salons, outils, sur une période donnée.'],
        customers: ['Nouveaux clients sur la même période', 'clients'],
        arpu: ['Revenu par client', '€ par mois'],
        margin: ['Marge brute', '%', "Ce qu'il reste du revenu une fois le service rendu."],
        churn: ['Clients qui partent', '% par mois'],
      },
      read: [
        'CAC = dépenses ÷ nouveaux clients.',
        'LTV = revenu par mois × marge ÷ part des clients qui partent chaque mois.',
        "Repères souvent cités : une LTV d'au moins 3 fois le CAC, et un CAC remboursé en moins de 12 mois.",
      ],
      limits: 'Avec peu de clients ou peu de mois de recul, le taux de départ est très incertain : la LTV aussi.',
      tip: 'Je reste quand le produit me sert chaque semaine. Me garder coûte moins cher que me remplacer.',
    },
    objectif: {
      name: "Cap sur l'objectif",
      question: 'Combien de clients gagner chaque mois pour atteindre mon objectif ?',
      lead: "Un revenu par mois à atteindre, un prix, des clients qui partent : l'outil donne le nombre de nouveaux clients à gagner chaque mois.",
      fields: {
        target: ['Revenu visé', '€ par mois'],
        price: ['Revenu par client', '€ par mois'],
        current: ["Clients aujourd'hui", 'clients'],
        churn: ['Clients qui partent', '% par mois'],
        months: ['Délai', 'mois'],
      },
      read: [
        'Clients nécessaires = revenu visé ÷ revenu par client.',
        'Chaque mois, une partie de tes clients part : il faut les remplacer en plus de grandir.',
        'Baisser le taux de départ réduit le nombre de clients à trouver, tous les mois.',
      ],
      limits: 'Le calcul suppose un prix unique et un taux de départ constant. Il ne dit pas si ton marché contient assez de clients : regarde la borne « Carte du monde ».',
      tip: "Avant d'aller chercher de nouveaux clients, demande-toi pourquoi les anciens partent.",
    },
    croissance: {
      name: 'Turbo',
      question: 'Quelle croissance par mois pour atteindre mon objectif ?',
      lead: "D'un chiffre de départ à un chiffre visé, en un nombre de mois : l'outil donne la croissance nécessaire, mois après mois.",
      fields: {
        from: ["Chiffre d'aujourd'hui", '', 'Revenu, clients, utilisateurs : ce que tu veux faire grandir.'],
        to: ['Chiffre visé', ''],
        months: ['Délai', 'mois'],
      },
      read: [
        'La croissance par mois est celle qui, répétée chaque mois, mène du départ à l\'objectif.',
        'Une croissance régulière se cumule : avec 10 % par mois, le chiffre est multiplié par plus de 3 en un an.',
      ],
      limits: "Tenir la même croissance pendant longtemps devient de plus en plus dur à mesure que les chiffres grossissent.",
      tip: 'Choisis un seul chiffre à faire grandir, et regarde-le chaque semaine.',
    },
    canvas: {
      name: 'Plan de jeu',
      question: 'Mon projet tient-il sur une page ?',
      lead: 'Le lean canvas : neuf cases pour décrire un projet. Écris court. Ce que tu tapes reste dans ce navigateur.',
      read: [
        'Commence par le problème et les clients : le reste en dépend.',
        'Une case vide ou floue montre ce que tu ne sais pas encore.',
        "Refais-le après chaque série d'échanges avec des clients : c'est un brouillon, pas un contrat.",
      ],
      limits: 'Le lean canvas a été créé par Ash Maurya, à partir du Business Model Canvas. Il décrit des hypothèses : seuls les clients peuvent les confirmer.',
      tip: 'Remplis-le en vingt minutes, puis va vérifier la case la plus risquée auprès de vrais clients.',
    },
    phrase: {
      name: 'Pitch éclair',
      question: 'Comment dire mon projet en une phrase ?',
      lead: "Quelques morceaux à remplir : l'outil les assemble en une phrase courte et une phrase complète, prêtes à dire.",
      read: [
        "La phrase courte doit suffire à quelqu'un qui ne connaît pas ton secteur.",
        'Dis-la à voix haute à trois personnes. Si elles la répètent mal, simplifie.',
        'Pas de mots creux : « innovant », « révolutionnaire », « solution globale » ne disent rien.',
      ],
      limits: "L'outil assemble tes mots, il ne les améliore pas. Relis l'accord des phrases avant de t'en servir.",
      tip: 'Si je ne comprends pas en dix secondes ce que tu vends, je passe à autre chose.',
    },
    deck: {
      name: 'Les 10 diapos',
      question: 'Mon pitch deck est-il complet ?',
      lead: "Les dix diapos qu'un investisseur s'attend à trouver. Coche ce que tu as déjà.",
      limits: 'Une liste ne remplace pas une histoire claire : une idée par diapo, et des chiffres vrais.',
      tip: "Une idée par diapo. Si tu dois l'expliquer à l'oral, c'est qu'elle n'est pas encore claire.",
    },
    tarif: {
      name: 'Prix du temps',
      question: 'Quel tarif par jour pour vivre de mon activité ?',
      lead: "Tu pars de ce que tu veux garder chaque mois : l'outil remonte au tarif à facturer par jour.",
      fields: {
        net: ['Ce que tu veux garder', '€ par mois', 'Une fois cotisations, impôts et frais payés.'],
        days: ['Jours facturés', 'par mois', 'Rarement tous les jours ouvrés : il faut aussi trouver les clients.'],
        weeks: ['Semaines sans facturer', 'par an', 'Congés, maladie, périodes creuses.'],
        charges: ['Cotisations et impôts', '%', 'La part de ce que tu gagnes qui repart. Elle dépend du pays, du statut et du revenu.'],
        costs: ['Frais professionnels', '€ par mois', 'Logiciels, matériel, assurance, comptable, déplacements.'],
      },
      read: [
        "À facturer sur l'année = 12 × (ce que tu veux garder par mois ÷ (1 − cotisations et impôts) + frais par mois).",
        "Jours facturés sur l'année = jours par mois × 12, moins les semaines sans facturer.",
        "Tarif par jour = à facturer ÷ jours facturés. C'est un tarif hors taxe.",
      ],
      limits: "L'outil ne calcule pas tes impôts : le pourcentage est à remplir avec ton comptable, selon ton pays et ton statut. Regarde aussi les tarifs pratiqués dans ton métier.",
      tip: "N'oublie pas les jours où tu ne factures pas : prospection, administratif, congés, maladie.",
    },
    devis: {
      name: 'Devis express',
      question: 'Combien facturer ce projet ?',
      lead: "Des jours de travail, un tarif, une marge pour les imprévus, des frais : l'outil donne le montant du devis et l'acompte à demander.",
      fields: {
        days: ['Jours de travail estimés', 'jours'],
        rate: ['Tarif par jour', '€'],
        buffer: ['Marge pour les imprévus', '%', 'Un projet prend presque toujours plus de temps que prévu.'],
        expenses: ['Frais à refacturer', '€', 'Déplacements, licences, achats pour le client.'],
        vat: ['TVA', '%', 'Taux normal : 21 % en Belgique, 20 % en France. 0 si tu en es dispensé.'],
        deposit: ['Acompte demandé', '%', 'À payer avant de commencer.'],
      },
      read: [
        'Hors taxe = jours × tarif, plus la marge pour les imprévus, plus les frais.',
        'Total = hors taxe + TVA.',
        "L'acompte te protège si le client disparaît en cours de route.",
      ],
      limits: "Un devis signé t'engage : écris clairement ce qui est compris, ce qui ne l'est pas, et les délais de paiement. Les mentions obligatoires dépendent de ton pays.",
      tip: "Écris ce qui n'est pas compris dans le prix : c'est là que naissent les disputes.",
    },
    prix: {
      name: 'Étiquette',
      question: 'À quel prix vendre pour garder ma marge ?',
      lead: "Le coût de ton produit, la marge que tu veux garder, la TVA : l'outil donne le prix hors taxe et le prix affiché.",
      fields: {
        cost: ['Coût du produit', '€', "Tout ce qu'une vente te coûte : matière, emballage, livraison, commission."],
        margin: ['Marge visée', '% du prix', 'La part du prix hors taxe qui te reste.'],
        vat: ['TVA', '%', 'Taux normal : 21 % en Belgique, 20 % en France. Certains produits ont un taux réduit.'],
      },
      read: [
        'Prix hors taxe = coût ÷ (1 − marge visée).',
        "La marge est comptée ici en % du prix de vente. Comptée en % du coût, c'est un chiffre plus grand : l'outil donne les deux.",
        'Prix affiché (TTC) = prix hors taxe + TVA.',
      ],
      limits: 'Un prix se teste : regarde ce que demandent les concurrents et ce que tes clients acceptent de payer. Si tu es dispensé de TVA, mets 0.',
      tip: "La marge se calcule hors taxe : la TVA n'est pas à toi, tu la reverses.",
    },
    remise: {
      name: 'Soldes',
      question: 'Que me coûte vraiment une remise ?',
      lead: "Une remise se prend entièrement sur ta marge. L'outil montre combien de ventes en plus il faut pour gagner autant qu'avant.",
      fields: {
        price: ['Prix de vente', '€', 'Hors taxe.'],
        margin: ['Marge', '% du prix'],
        discount: ['Remise', '%'],
      },
      read: [
        'La remise baisse le prix, mais pas ton coût : elle est retirée de ta marge.',
        "Ventes en plus nécessaires = marge d'avant ÷ marge d'après − 1.",
        'Plus ta marge est faible, plus une remise coûte cher.',
      ],
      limits: "Le calcul ne dit pas si la remise attire vraiment plus de clients : c'est à mesurer. Une remise peut aussi servir à vider un stock ou à faire essayer.",
      tip: "Une remise m'attire une fois. Si le produit me plaît, je reviens au prix normal.",
    },
    seuil: {
      name: "Ligne d'arrivée",
      question: "Combien de ventes pour ne plus perdre d'argent ?",
      lead: 'Le seuil de rentabilité : le nombre de ventes par mois à partir duquel tes charges sont couvertes.',
      fields: {
        price: ['Prix de vente', '€'],
        variable: ['Coût par vente', '€', 'Ce que chaque vente te coûte : matière, livraison, commission…'],
        fixed: ['Charges fixes par mois', '€', 'Ce que tu paies même sans vendre : loyer, salaires, abonnements…'],
      },
      read: [
        'Marge par vente = prix de vente − coût par vente.',
        'Seuil = charges fixes ÷ marge par vente, arrondi à la vente du dessus.',
        'Au-dessus du seuil, chaque vente ajoute sa marge à ton bénéfice.',
      ],
      limits: 'Le calcul suppose un seul produit et un prix fixe. Avec plusieurs produits, raisonne sur le panier moyen.',
      tip: 'Tant que tu es sous le seuil, chaque mois grignote ta trésorerie. Sache à quelle date tu comptes le passer.',
    },
    tunnel: {
      name: 'Entonnoir',
      question: 'Combien de visiteurs deviennent clients ?',
      lead: "Des visiteurs, une part qui laisse un contact, une part qui achète : l'outil donne les ventes, le chiffre d'affaires et ce que coûte un client.",
      fields: {
        visitors: ['Visiteurs', 'par mois'],
        signup: ['Visiteurs qui laissent un contact', '%', 'Inscription, demande de devis, panier commencé.'],
        purchase: ['Contacts qui achètent', '%'],
        basket: ["Montant moyen d'un achat", '€'],
        spend: ['Dépenses pour faire venir les visiteurs', '€ par mois', 'Publicité, contenus, partenariats. 0 si tu ne dépenses rien.'],
      },
      read: [
        'Clients = visiteurs × part qui laisse un contact × part qui achète.',
        "Coût d'un client = dépenses ÷ clients.",
        'Doubler un taux a le même effet que doubler les visiteurs, et coûte souvent moins cher.',
      ],
      limits: "Les taux varient beaucoup d'un métier à l'autre : mesure les tiens au lieu de reprendre ceux des autres.",
      tip: "Améliore d'abord l'étape où tu perds le plus de monde : c'est là que l'effort rapporte le plus.",
    },
    tirelire: {
      name: 'Tirelire',
      question: 'Combien mettre de côté sur chaque facture ?',
      lead: "Quand un client te paie, tout n'est pas à toi. L'outil sépare la TVA, les cotisations et les impôts, et ce qui te reste vraiment.",
      fields: {
        amount: ['Montant de la facture', '€', 'Hors taxe.'],
        vat: ['TVA', '%', '0 si tu en es dispensé.'],
        charges: ['Cotisations et impôts', '%', 'La part du montant hors taxe qui repartira. Elle dépend du pays, du statut et du revenu.'],
      },
      read: [
        "La TVA encaissée n'est pas un revenu : elle est reversée à l'État.",
        'Cotisations et impôts se paient plus tard, parfois un an après : sans réserve, la facture arrive quand l\'argent est déjà dépensé.',
        'Le plus simple : virer la somme à mettre de côté sur un autre compte, le jour où le client paie.',
      ],
      limits: "L'outil ne calcule pas tes impôts : le pourcentage est une estimation à fixer avec ton comptable. Tes frais professionnels ne sont pas comptés.",
      tip: "Ouvre un deuxième compte pour l'argent qui n'est pas à toi. Ce que tu ne vois pas, tu ne le dépenses pas.",
    },
    lancement: {
      name: 'Top départ',
      question: 'Suis-je prêt à facturer mon premier client ?',
      lead: "Dix points à régler avant d'envoyer ta première facture. Coche ce qui est fait.",
      limits: "Une liste générale : les démarches exactes dépendent de ton pays et de ton métier. Les organismes publics de l'arsenal renseignent gratuitement.",
      tip: 'Les règles changent selon le pays et le statut. Une heure avec un comptable au départ évite bien des soucis.',
    },
    ticket: {
      name: 'Retour de pièce',
      question: "Que vaut mon ticket si l'entreprise est revendue ?",
      lead: "Un montant investi, une valorisation à l'entrée, une à la sortie : l'outil donne le multiple et le rendement par an.",
      fields: {
        ticket: ['Montant investi', '€'],
        post: ["Valorisation à l'entrée, après la levée", '€'],
        dilution: ['Dilution lors des tours suivants', '%', 'À chaque nouvelle levée, ta part diminue.'],
        exit: ['Valorisation à la sortie', '€'],
        years: ['Durée', 'ans'],
      },
      read: [
        "Ta part à l'entrée = montant investi ÷ valorisation après la levée.",
        'Ce que tu récupères = ta part à la sortie × valorisation à la sortie.',
        'Le rendement par an (TRI) est le taux qui, répété chaque année, donne ce multiple.',
      ],
      limits: "C'est un scénario, pas une prévision. Beaucoup de jeunes entreprises ne rendent pas la mise, et une sortie peut prendre bien plus longtemps que prévu.",
      tip: 'Je pars du principe que chaque ticket peut valoir zéro. Je ne mets que ce que je peux perdre.',
    },
    valo: {
      name: "Prix d'entrée",
      question: 'À quelle valorisation entrer pour viser mon multiple ?',
      lead: "Tu pars de la sortie que tu espères et du multiple que tu vises : l'outil remonte à la valorisation maximale à l'entrée.",
      fields: {
        exit: ['Valorisation espérée à la sortie', '€'],
        multiple: ['Multiple visé', 'fois la mise'],
        dilution: ['Dilution lors des tours suivants', '%'],
        ticket: ['Montant investi', '€', 'Facultatif : pour connaître ta part.'],
      },
      read: [
        'Valorisation maximale après la levée = valorisation de sortie × (1 − dilution) ÷ multiple visé.',
        'Au-dessus de cette valorisation, il faudrait une sortie plus grosse pour atteindre le même multiple.',
      ],
      limits: "Tout repose sur la sortie espérée, que personne ne connaît à l'avance. Teste plusieurs scénarios.",
      tip: "Le prix d'entrée est la seule chose que tu maîtrises. La sortie, personne ne la connaît.",
    },
    portefeuille: {
      name: 'Lancer de dés',
      question: 'Que rapporte un portefeuille de jeunes entreprises ?',
      lead: "Beaucoup d'échecs, quelques résultats moyens, de rares gros succès : l'outil montre ce que ça donne sur l'ensemble.",
      fields: {
        count: ['Entreprises dans le portefeuille', 'entreprises'],
        ticket: ['Montant mis dans chacune', '€'],
        fail: ['Celles qui ne rendent rien', '%'],
        mid: ['Celles qui rendent un peu', '%'],
        midMultiple: ["Ce qu'elles rendent", 'fois la mise'],
        winMultiple: ['Ce que rendent les gros succès', 'fois la mise', 'Les gros succès : tout ce qui reste une fois les deux autres familles retirées.'],
      },
      read: [
        "Multiple du portefeuille = la somme, pour chaque famille, de sa part × ce qu'elle rend.",
        "Regarde la ligne « sans les gros succès » : c'est ce qu'il reste si aucun gagnant n'arrive.",
        "Avec peu d'entreprises, il est fréquent de n'avoir aucun gros succès.",
      ],
      limits: "Ces pourcentages sont tes hypothèses, pas des statistiques. En vrai, le résultat tient à quelques entreprises, l'argent est bloqué de nombreuses années, et on peut tout perdre.",
      tip: "Un seul ticket, c'est un pari. Il en faut beaucoup pour avoir une chance de tomber sur un gagnant.",
    },
    suivre: {
      name: 'Rester dans la course',
      question: 'Combien remettre pour garder ma part ?',
      lead: "À chaque nouvelle levée, ta part diminue, sauf si tu remets de l'argent. L'outil donne le montant, et ce que devient ta part si tu ne suis pas.",
      fields: {
        stake: ["Ta part aujourd'hui", '% du capital'],
        pre: ['Valorisation avant la levée', '€'],
        raise: ['Montant de la levée', '€'],
      },
      read: [
        'Pour garder la même part, il faut apporter ta part du montant levé.',
        'Si tu ne suis pas, ta part = part actuelle × valorisation avant ÷ valorisation après.',
        'Ta part baisse en pourcentage, mais elle peut valoir plus si la valorisation a monté.',
      ],
      limits: "Le droit de suivre (pro rata) doit être prévu dans les documents signés : il n'est pas automatique. Le calcul ignore les réserves créées pour les salariés.",
      tip: "Suivre, c'est remettre de l'argent sur une entreprise que tu connais déjà : c'est souvent là que se joue le résultat, et le risque aussi.",
    },
    fonte: {
      name: 'Glaçon',
      question: 'Que devient ma part après plusieurs levées ?',
      lead: "À chaque levée, de nouvelles actions sont créées et ta part fond un peu. L'outil montre l'effet de plusieurs tours.",
      fields: {
        stake: ["Ta part aujourd'hui", '% du capital'],
        rounds: ['Nombre de levées à venir', 'levées'],
        dilution: ['Dilution à chaque levée', '%', 'La part du capital cédée aux nouveaux à chaque tour.'],
      },
      read: [
        'À chaque levée, ta part est multipliée par (1 − dilution).',
        'Les dilutions se cumulent : trois tours à 20 % retirent près de la moitié.',
      ],
      limits: "La dilution n'est jamais la même d'un tour à l'autre, et une part plus petite peut valoir plus si la valorisation monte.",
      tip: "Une petite part d'une grande entreprise peut valoir plus qu'une grosse part d'une petite. Regarde la valeur, pas seulement le pourcentage.",
    },
    convertible: {
      name: "Bon d'entrée",
      question: 'Quelle part donne un BSA-AIR à la prochaine levée ?',
      lead: "De l'argent maintenant, des actions plus tard. L'outil montre la part obtenue quand la levée suivante arrive, selon le plafond et la décote.",
      fields: {
        amount: ['Montant apporté', '€'],
        cap: ['Plafond de valorisation', '€', "0 s'il n'y en a pas."],
        discount: ['Décote', '%'],
        pre: ['Valorisation avant la levée suivante', '€'],
        raise: ['Montant de la levée suivante', '€'],
      },
      read: [
        'Le porteur convertit au prix le plus bas : celui du plafond, ou celui du tour moins la décote.',
        'Plus le plafond est bas par rapport à la valorisation du tour, plus sa part est grande.',
        'Convention utilisée ici : le prix du tour est fixé sur les actions qui existent déjà, avant la conversion.',
      ],
      limits: 'Chaque contrat a ses règles de calcul (base avant ou après la levée, réserve pour les salariés, intérêts…). Seul le texte signé compte : fais-le relire par un professionnel.',
      tip: 'Lis bien le plafond et la décote : ce sont eux qui fixent la part, pas seulement le montant.',
    },
    cascade: {
      name: 'Cascade',
      question: 'Qui touche quoi le jour de la vente ?',
      lead: "Quand l'entreprise est vendue, les investisseurs passent souvent en premier. L'outil montre le partage selon le prix de vente.",
      fields: {
        exit: ["Prix de vente de l'entreprise", '€'],
        invested: ['Montant investi par les investisseurs', '€'],
        stake: ['Part des investisseurs', '% du capital'],
        multiple: ['Préférence de liquidation', 'fois la mise', "1 : ils récupèrent d'abord leur mise. 0 : aucune préférence."],
      },
      read: [
        'Les investisseurs prennent le plus grand des deux montants : leur mise (fois la préférence), ou leur part du prix de vente.',
        'Sous le prix seuil, ils prennent la préférence : les autres associés touchent moins que leur part du capital.',
        'Au-dessus du prix seuil, tout le monde est payé selon sa part.',
      ],
      limits: "Un cas simple : une seule catégorie d'investisseurs, une préférence « non participative », ni dettes ni frais de vente. La vraie répartition suit le pacte et les statuts, tour par tour.",
      tip: "Le pourcentage du capital ne dit pas tout. Demande toujours dans quel ordre l'argent est distribué.",
    },
    note: {
      name: 'Carnet de notes',
      question: 'Quelle note donner à cette startup ?',
      lead: "Cinq critères, notés de 0 à 10. L'outil calcule une note sur 100 et montre le point le plus faible.",
      fields: {
        team: ['Équipe', 'sur 10', 'Complémentaire, à plein temps, capable de vendre et de construire.'],
        market: ['Marché', 'sur 10', 'Assez grand, et qui grandit.'],
        traction: ['Traction', 'sur 10', 'Des clients, des revenus, une croissance prouvée.'],
        product: ['Produit', 'sur 10', 'Il marche, et il est difficile à copier.'],
        terms: ['Conditions', 'sur 10', 'Valorisation et droits raisonnables.'],
      },
      read: [
        "Chaque critère pèse un poids différent : l'équipe 30, le marché 25, la traction 20, le produit 15, les conditions 10.",
        'La note sert à comparer plusieurs dossiers avec la même grille, pas à décider à ta place.',
        'Regarde surtout le point le plus faible : une très mauvaise note sur un critère ne se rattrape pas ailleurs.',
      ],
      limits: "Les poids sont un exemple, à adapter à ta façon d'investir. Une note ne remplace ni les vérifications, ni les échanges avec les fondateurs et leurs clients.",
      tip: 'Note le dossier avant la réunion, puis après. Si la note monte beaucoup, demande-toi si ce sont les faits ou le charme.',
    },
    diligence: {
      name: 'La loupe',
      question: "Ai-je vérifié l'essentiel avant d'investir ?",
      lead: 'Douze questions à se poser avant de signer. Coche celles auxquelles tu as une réponse solide.',
      limits: "Une liste de questions ne remplace pas l'avis d'un avocat ou d'un expert-comptable sur les documents.",
      tip: "Ce qui n'est pas écrit et prouvé n'existe pas. Demande les documents.",
    },
    composes: {
      name: 'Boule de neige',
      question: 'Que deviennent mes versements avec les intérêts composés ?',
      lead: "Les gains d'une année produisent eux-mêmes des gains l'année suivante. Sur la durée, l'effet devient visible.",
      fields: {
        initial: ['Capital de départ', '€'],
        monthly: ['Versement', '€ par mois'],
        rate: ['Rendement', '% par an'],
        years: ['Durée', 'ans'],
      },
      read: [
        'En jaune, ce que tu as versé. En vert, ce que les intérêts ont ajouté.',
        "Plus la durée est longue, plus la partie verte grandit vite : c'est l'effet boule de neige.",
      ],
      limits: "Le rendement est supposé constant. En vrai il varie d'une année à l'autre et peut être négatif ; frais, impôts et inflation ne sont pas comptés.",
      tip: 'Le temps fait une grande part du travail : plus tu commences tôt, plus chaque versement a le temps de grandir.',
    },
    cible: {
      name: 'Dans le mille',
      question: 'Combien verser chaque mois pour atteindre mon objectif ?',
      lead: "Une somme à atteindre, une durée, un rendement : l'outil donne le versement mensuel nécessaire.",
      fields: {
        target: ['Somme à atteindre', '€'],
        years: ['Durée', 'ans'],
        rate: ['Rendement', '% par an', '0 pour un compte qui ne rapporte rien.'],
        initial: ['Déjà de côté', '€'],
      },
      read: [
        "Plus tu as de temps, plus les intérêts font une part du chemin à ta place.",
        'Sans rendement, le versement est simplement la somme manquante divisée par le nombre de mois.',
      ],
      limits: "Le rendement est supposé constant ; frais, impôts et inflation ne sont pas comptés. Dans dix ans, la somme visée achètera moins qu'aujourd'hui.",
      tip: 'Programme le virement le jour où tu es payé. Ce qui part tout seul ne demande plus de volonté.',
    },
    frais: {
      name: 'Grignoteur',
      question: 'Combien me coûtent les frais sur la durée ?',
      lead: "Le même placement, avec deux niveaux de frais annuels : l'outil montre l'écart à la fin.",
      fields: {
        initial: ['Capital de départ', '€'],
        monthly: ['Versement', '€ par mois'],
        rate: ['Rendement avant frais', '% par an'],
        feeA: ['Frais du placement A', '% par an'],
        feeB: ['Frais du placement B', '% par an'],
        years: ['Durée', 'ans'],
      },
      read: [
        'Les frais annuels sont retirés du rendement, chaque année.',
        "L'écart grandit avec le temps : l'argent parti en frais ne produit plus d'intérêts.",
      ],
      limits: "Rendement supposé constant ; frais d'entrée et de sortie, impôts et inflation non comptés. Les frais réels d'un produit sont écrits dans son document d'informations clés.",
      tip: "Un ou deux points de frais ont l'air de rien sur un an. Sur trente ans, c'est une grosse part du résultat.",
    },
    inflation: {
      name: 'Ballon qui fuit',
      question: 'Que vaudra mon argent dans vingt ans ?',
      lead: "Quand les prix montent, la même somme achète moins. L'outil montre ce qu'elle vaudra vraiment, avec ou sans rendement.",
      fields: {
        amount: ["Somme aujourd'hui", '€'],
        inflation: ['Hausse des prix', '% par an'],
        years: ['Durée', 'ans'],
        rate: ['Rendement du placement', '% par an', "0 si l'argent dort sur un compte qui ne rapporte rien."],
      },
      read: [
        'Valeur réelle = somme affichée ÷ hausse des prix cumulée.',
        'Rendement réel = rendement du placement, une fois la hausse des prix retirée.',
        "Un rendement égal à la hausse des prix garde ton pouvoir d'achat, sans l'augmenter.",
      ],
      limits: "La hausse des prix change d'une année à l'autre : personne ne connaît celle des vingt prochaines années.",
      tip: 'Un compte qui ne rapporte rien perd de la valeur chaque année, sans que le chiffre affiché ne bouge.',
    },
    reserve: {
      name: 'Réservoir',
      question: 'Combien de temps mon épargne peut-elle me verser un revenu ?',
      lead: "Un capital, un retrait chaque mois, un rendement : l'outil compte les années avant que le capital soit vide.",
      fields: {
        capital: ['Capital', '€'],
        monthly: ['Retrait', '€ par mois'],
        rate: ['Rendement', '% par an'],
      },
      read: [
        'Chaque mois, le capital gagne son rendement, puis tu retires ta somme.',
        'Si le retrait est plus petit que ce que le capital rapporte, il ne se vide jamais.',
      ],
      limits: "Le rendement est supposé constant. En vrai il varie, et une mauvaise année au début vide le capital plus vite. Impôts, frais et inflation ne sont pas comptés.",
      tip: 'Retirer 500 € par mois dans vingt ans ne paiera pas ce que 500 € paient aujourd\'hui : pense à la hausse des prix.',
    },
    coussin: {
      name: 'Matelas',
      question: "Ai-je assez d'épargne de précaution ?",
      lead: "L'épargne de précaution, c'est de quoi tenir plusieurs mois sans revenu. L'outil donne la somme à viser, et le temps pour y arriver.",
      fields: {
        expenses: ['Tes dépenses', '€ par mois', 'Loyer, courses, transports, abonnements : ce qui part chaque mois.'],
        months: ['Mois à couvrir', 'mois', 'Souvent 3 à 6 mois. Plus si tes revenus sont irréguliers.'],
        saved: ['Déjà de côté', '€'],
        monthly: ['Ce que tu peux épargner', '€ par mois'],
      },
      read: [
        'Somme à viser = dépenses par mois × mois à couvrir.',
        "Cette épargne doit rester disponible tout de suite, sans risque de perte : ce n'est pas un placement.",
      ],
      limits: "Le bon nombre de mois dépend de ta situation : stabilité de tes revenus, personnes à charge, logement. C'est un repère, pas une règle.",
      tip: "Constitue ce matelas avant de placer quoi que ce soit : c'est lui qui t'évite de vendre au pire moment.",
    },
    avant: {
      name: 'Bouclier',
      question: 'Suis-je prêt à placer mon argent ?',
      lead: "Dix points à vérifier avant de placer de l'argent. Coche ceux qui sont réglés.",
      limits: 'Une liste pour réfléchir, pas un conseil personnalisé : ta situation, tes impôts et tes projets comptent. En cas de doute, demande à un conseiller autorisé.',
      tip: "Rendement élevé, sans risque et urgent : les trois ensemble, c'est le signe d'une arnaque.",
    },
  },

  checklists: {
    deck: [
      ['Le problème', "Qui souffre de quoi, et combien ça lui coûte aujourd'hui."],
      ['La solution', "Ce que tu fais, en une phrase qu'un enfant de 12 ans comprend."],
      ['Le produit', 'Une démo, des captures : montrer vaut mieux que décrire.'],
      ['Le marché', 'Combien de clients possibles, et lesquels en premier.'],
      ['Le modèle économique', 'Qui paie, combien, et à quelle fréquence.'],
      ['La traction', 'Clients, revenus, croissance : uniquement des chiffres vrais et vérifiables.'],
      ['La concurrence', 'Les autres solutions, et pourquoi un client te choisirait.'],
      ["L'équipe", 'Pourquoi vous êtes les bonnes personnes pour ce projet.'],
      ['La levée', "Le montant, ce qu'il finance, et jusqu'à quelle étape il vous mène."],
      ['La suite', 'Les prochains objectifs, datés, et comment te joindre.'],
    ],
    lancement: [
      ['Un statut choisi', 'Entreprise individuelle ou société : tu sais lequel, et ce que ça change pour tes cotisations.'],
      ['Une activité déclarée', "Tu as ton numéro d'entreprise et tu sais où il doit figurer."],
      ['La TVA réglée', "Tu sais si tu dois la facturer ou si tu en es dispensé, et tu l'écris sur tes factures."],
      ['Un compte séparé', "L'argent de l'activité ne se mélange pas avec ton argent personnel."],
      ['Des factures conformes', 'Mentions obligatoires, numérotation, et envoi électronique là où il est obligatoire.'],
      ['Un prix testé', "Ton tarif couvre tes charges, tes jours sans facturer et ton revenu. Un client l'a déjà accepté."],
      ['Un devis ou un contrat', 'Ce que tu fais, pour quand, pour combien, et quand tu es payé : par écrit, avant de commencer.'],
      ['Les assurances', 'Tu sais lesquelles sont obligatoires dans ton métier, et lesquelles sont utiles.'],
      ['Une réserve pour les impôts', 'Tu mets de côté chaque mois ce que tu devras en cotisations et en impôts.'],
      ["Trois mois d'avance", 'De quoi vivre si un client paie en retard ou si un mois est vide.'],
    ],
    diligence: [
      ["L'équipe", 'Qui sont les fondateurs, que font-ils à plein temps, se connaissent-ils depuis longtemps ?'],
      ['Le problème', "Des clients confirment-ils qu'il est réel et pénible ?"],
      ['Le produit', "L'ai-je vu fonctionner moi-même ?"],
      ['Les clients', 'Puis-je parler à deux ou trois clients ?'],
      ['Les chiffres', 'Revenus et croissance sont-ils prouvés par des documents ?'],
      ['Le marché', 'Est-il assez grand pour la sortie espérée ?'],
      ['La concurrence', "Qui d'autre résout ce problème, et avec quels moyens ?"],
      ['Le modèle économique', "Un client rapporte-t-il plus qu'il ne coûte ?"],
      ['Le capital', "Qui possède quoi aujourd'hui, et qu'est-ce qui a déjà été promis ?"],
      ['Le juridique', "Marque, code, contrats : tout appartient-il bien à l'entreprise ?"],
      ["L'usage des fonds", 'Que finance la levée, et pour combien de mois ?'],
      ['Les conditions', 'Valorisation, droits et documents : relus par un professionnel ?'],
    ],
    avant: [
      ['Une épargne de précaution', 'De quoi tenir plusieurs mois de dépenses, disponible tout de suite, avant de placer le reste.'],
      ['Pas de dette chère', "Un crédit à taux élevé coûte souvent plus que ce qu'un placement rapporte."],
      ['Un horizon', "Tu sais dans combien d'années tu auras besoin de cet argent."],
      ['Tu comprends le produit', "Tu peux expliquer en deux phrases d'où vient le rendement, et ce qui peut le faire baisser."],
      ['Tu connais les frais', "Frais d'entrée, frais annuels, frais de sortie : tu les as lus dans le document d'informations clés."],
      ['Le risque est écrit', 'Tu sais combien tu peux perdre, et tu peux le supporter.'],
      ['Le vendeur est autorisé', "Tu as vérifié son nom auprès du régulateur de ton pays : la FSMA en Belgique, l'AMF en France."],
      ['Aucune promesse miracle', "Personne ne t'a promis un rendement élevé, garanti, à saisir tout de suite."],
      ['Plusieurs paniers', "Ton argent ne dépend pas d'une seule entreprise, d'un seul secteur ou d'un seul pays."],
      ['Les impôts', 'Tu sais comment les gains seront taxés dans ton pays.'],
    ],
  },

  /* Le parcours : six niveaux, dans l'ordre de contenu.js. */
  levels: [
    { name: "L'idée", goal: 'Vérifier que le problème existe.',
      todo: ['Parler à des clients possibles avant de construire', 'Écrire le problème en une phrase', "Regarder comment les gens se débrouillent aujourd'hui"],
      investor: "À ce stade, presque personne n'investit : il n'y a que toi et ton idée.",
      tip: "Ne demande pas « est-ce que tu achèterais ? ». Demande « comment tu fais aujourd'hui ? »." },
    { name: 'Le MVP', goal: 'Construire la plus petite version qui rend service.',
      todo: ['Garder une seule fonction : celle qui résout le problème', 'La mettre entre les mains de vrais utilisateurs', "Noter ce qu'ils font, pas seulement ce qu'ils disent"],
      investor: 'Les proches et les premiers soutiens regardent surtout les fondateurs.',
      tip: "Si tu n'as pas un peu honte de ta première version, tu l'as sortie trop tard." },
    { name: 'Les premiers clients', goal: "Faire payer quelqu'un.",
      todo: ['Fixer un prix et le tester', "Mesurer ce que coûte un client et ce qu'il rapporte", 'Demander des avis écrits'],
      investor: "Un premier revenu, même petit, prouve que le problème vaut de l'argent.",
      tip: "Un « c'est super » ne vaut rien. Un paiement, si." },
    { name: 'Le pré-seed', goal: 'Financer le passage du prototype au produit.',
      todo: ['Préparer le pitch deck', 'Calculer combien lever et pour combien de mois', 'Rencontrer des business angels'],
      investor: "Les business angels regardent l'équipe, le marché et les premiers signes de traction.",
      tip: "Je dis non à la plupart des dossiers. Ce n'est pas contre toi : demande-moi pourquoi, et reviens avec des preuves." },
    { name: 'Le seed', goal: 'Prouver que le produit trouve son marché.',
      todo: ['Montrer une croissance régulière', 'Recruter les premières personnes clés', 'Suivre ses chiffres chaque mois'],
      investor: "Les fonds d'amorçage veulent voir des clients qui restent et un coût d'acquisition maîtrisé.",
      tip: 'La croissance consomme de la trésorerie. Surveille les deux en même temps.' },
    { name: 'La série A', goal: "Passer à l'échelle ce qui marche déjà.",
      todo: ['Répéter la vente de façon prévisible', "Structurer l'équipe", 'Préparer des comptes solides'],
      investor: 'Les fonds de capital-risque regardent la croissance, les marges et la taille du marché.',
      tip: "À ce niveau, on ne finance plus une idée mais une machine. Montre qu'elle tourne sans toi." },
  ],

  stages: ['Idée', 'MVP', 'Premiers clients', 'Pré-seed', 'Seed', 'Série A'],

  /* Le lexique. Lettres : e = entrepreneur, d = indépendant, i = investisseur, s = épargnant. */
  glossary: [
    ['Amorçage (seed)', 'ei', "Premier vrai tour de financement, pour passer d'un produit qui marche chez quelques clients à une croissance régulière."],
    ['ARR', 'ei', 'Revenu récurrent annuel : le MRR multiplié par 12.'],
    ['Bénéfice', 'ed', "Ce qu'il reste du chiffre d'affaires une fois toutes les charges payées."],
    ['Bootstrapping', 'e', 'Développer son entreprise sans investisseurs, avec ses propres revenus.'],
    ['BSA-AIR', 'ei', "En France, un accord d'investissement rapide : l'investisseur verse l'argent maintenant et reçoit ses actions lors de la prochaine levée, souvent avec une décote."],
    ['Burn rate', 'e', "L'argent que l'entreprise dépense chaque mois. Le burn net retire les revenus."],
    ['Business angel', 'ei', 'Une personne qui investit son propre argent dans de jeunes entreprises, souvent très tôt.'],
    ['CAC', 'ed', "Coût d'acquisition client : ce que tu dépenses en moyenne pour gagner un client."],
    ['Capital-risque (VC)', 'ei', "Des fonds qui investissent l'argent de tiers dans des entreprises jeunes et risquées, en visant quelques très gros succès."],
    ['Charges fixes', 'ed', 'Ce que tu paies chaque mois même sans rien vendre : loyer, abonnements, salaires.'],
    ["Chiffre d'affaires", 'ed', 'Tout ce que tu factures sur une période, avant de retirer les coûts.'],
    ['Churn', 'e', 'La part des clients qui partent sur une période, souvent par mois.'],
    ['Cliff', 'ei', "Dans un vesting, la période du début pendant laquelle rien n'est encore acquis."],
    ['Closing', 'ei', "Le moment où les documents sont signés et l'argent versé."],
    ['Data room', 'ei', "L'espace partagé où l'entreprise range les documents que les investisseurs veulent vérifier."],
    ['Décote', 'ei', 'Une réduction sur le prix des actions, accordée à ceux qui ont investi plus tôt.'],
    ['Devis', 'd', 'Le document qui décrit la prestation et son prix avant de commencer. Signé, il engage les deux parties.'],
    ['Dilution', 'ei', 'La baisse de ta part du capital quand de nouvelles actions sont créées pour de nouveaux investisseurs.'],
    ['Diversification', 'is', "Répartir son argent sur plusieurs placements pour ne pas dépendre d'un seul."],
    ['Due diligence', 'i', "Les vérifications faites avant d'investir : chiffres, contrats, capital, juridique."],
    ['Épargne de précaution', 's', 'Une réserve disponible tout de suite, pour les imprévus, avant de placer le reste.'],
    ['ETF', 's', 'Un fonds coté en bourse qui suit un indice, souvent avec des frais faibles.'],
    ['Facture électronique', 'd', 'Une facture envoyée dans un format lisible par les logiciels, par un réseau prévu pour ça, comme Peppol.'],
    ['Frais courants', 's', "Ce qu'un placement prélève chaque année, en % du montant placé."],
    ['HT / TTC', 'd', 'Hors taxe : le prix sans la TVA. Toutes taxes comprises : le prix que paie le client final.'],
    ['Inflation', 's', "La hausse générale des prix : avec la même somme, on achète moins qu'avant."],
    ['Intérêts composés', 's', "Les gains d'une année produisent à leur tour des gains les années suivantes."],
    ['Lead investor', 'ei', "L'investisseur qui mène le tour : il négocie les conditions et les autres le suivent."],
    ['Lean canvas', 'e', 'Une page en neuf cases pour décrire un projet : problème, clients, solution, revenus, coûts…'],
    ['Loi de puissance', 'i', "Dans un portefeuille de jeunes entreprises, quelques gros succès font l'essentiel du résultat."],
    ['Love money', 'e', "L'argent apporté par la famille et les amis au tout début."],
    ['LTV', 'e', "Valeur vie client : ce qu'un client rapporte en moyenne pendant tout le temps où il reste."],
    ['Marge brute', 'ed', "Ce qu'il reste du revenu après le coût direct du produit ou du service."],
    ['MRR', 'ei', 'Revenu récurrent mensuel : ce que les abonnements rapportent chaque mois.'],
    ['Multiple', 'i', 'Ce que tu récupères divisé par ce que tu as investi. Un multiple de 3 : trois fois la mise.'],
    ['MVP', 'e', 'Produit minimum viable : la plus petite version qui rend déjà service à un vrai utilisateur.'],
    ["Pacte d'associés", 'ei', "Le contrat qui fixe les règles entre associés : décisions, sortie, départ d'un fondateur."],
    ['Panier moyen', 'd', "Le montant moyen d'un achat."],
    ['Pitch deck', 'e', 'La présentation, en une dizaine de diapos, qui raconte le projet à un investisseur.'],
    ['Plafond de valorisation (cap)', 'ei', "Dans un BSA-AIR, la valorisation maximale utilisée pour calculer la part de l'investisseur."],
    ['Post-money', 'ei', 'La valorisation juste après la levée : pre-money + montant levé.'],
    ['Pre-money', 'ei', "La valorisation de l'entreprise juste avant l'argent des nouveaux investisseurs."],
    ['Préférence de liquidation', 'ei', "Le droit, pour un investisseur, d'être remboursé avant les autres quand l'entreprise est vendue."],
    ['Pro rata', 'i', "Le droit, pour un investisseur, de remettre de l'argent à la levée suivante pour garder sa part."],
    ['Product-market fit', 'e', "Le moment où le produit répond si bien à un besoin que les clients viennent et restent sans qu'on les pousse."],
    ['Régulateur', 'is', "L'autorité qui surveille les vendeurs de produits financiers : la FSMA en Belgique, l'AMF en France."],
    ['Rendement réel', 's', "Le rendement d'un placement une fois l'inflation retirée."],
    ['Runway', 'e', 'Le nombre de mois que la trésorerie permet de tenir au rythme actuel.'],
    ['SAFE', 'ei', "Le contrat américain dont s'inspire le BSA-AIR : de l'argent maintenant, des actions à la prochaine levée."],
    ['Série A', 'ei', "Le tour qui suit l'amorçage, pour passer à l'échelle un modèle qui marche déjà."],
    ['Seuil de rentabilité', 'ed', "Le niveau de ventes à partir duquel tu ne perds plus d'argent."],
    ['Table de capitalisation', 'ei', "Le tableau qui dit qui possède combien de l'entreprise."],
    ['TAM, SAM, SOM', 'e', 'Le marché total, la part que tu peux servir, et la part que tu vises vraiment.'],
    ['Tarif journalier (TJM)', 'd', "Le prix d'une journée de travail d'un indépendant, hors taxe."],
    ['Taux de conversion', 'ed', "La part des visiteurs qui font ce que tu attends d'eux : s'inscrire, acheter."],
    ['Taux de marge', 'd', 'La marge rapportée au coût. À ne pas confondre avec le taux de marque, rapporté au prix de vente.'],
    ['Term sheet', 'ei', 'La lettre qui résume les conditions proposées par un investisseur, avant les contrats définitifs.'],
    ['Ticket', 'i', "Le montant qu'un investisseur met dans une entreprise."],
    ['Traction', 'ei', 'Les preuves que ça marche : clients, revenus, croissance, usage.'],
    ['Trésorerie', 'ed', "L'argent réellement disponible sur les comptes de l'entreprise aujourd'hui."],
    ['TRI', 'i', "Taux de rendement interne : le rendement par an d'un investissement, en tenant compte de sa durée."],
    ['TVA', 'd', "Taxe ajoutée au prix de vente, que l'entreprise encaisse pour l'État puis lui reverse."],
    ['Valorisation', 'ei', "Le prix auquel on estime toute l'entreprise lors d'une levée."],
    ['Vesting', 'ei', "L'acquisition progressive de ses parts : un fondateur ou un salarié qui part tôt n'en garde qu'une partie."],
  ],

  arsenal: {
    access: { free: 'Offre gratuite', limited: 'Gratuit, limité', trial: 'Essai gratuit', paid: 'Payant', fee: 'Sans abonnement', open: 'Logiciel libre', public: 'Service public' },
    places: { BE: 'Belgique', FR: 'France', BXL: 'Bruxelles', WAL: 'Wallonie', VLA: 'Flandre' },
    /* Un rayon : nom, besoin, descriptions des outils (dans l'ordre d'arsenal.js), conseil du guide. */
    cats: {
      construire: { name: 'Créer une app sans coder', need: "Tu décris ce que tu veux, une IA construit l'application.",
        tools: [
          "Construit une application web complète à partir d'une description : pages, base de données, comptes.",
          'Crée un site, une app ou un prototype depuis une phrase, directement dans le navigateur.',
          'Crée une app complète depuis une description, avec base de données, comptes et paiements inclus. Appartient à Wix.',
          'Un agent IA construit, héberge et publie ton app, sans rien installer.',
        ],
        note: "Pratique pour un premier prototype à montrer à des clients. Pour un produit qui grandit, il faudra tôt ou tard quelqu'un qui lit le code." },
      design: { name: 'Design et visuels', need: "Un logo, des visuels, la maquette d'une app.",
        tools: [
          "Visuels, présentations et documents à partir de modèles, avec des outils d'IA.",
          "Maquettes et prototypes d'applications et de sites, à plusieurs en même temps.",
          'Visuels, vidéos courtes et PDF à partir de modèles.',
        ],
        note: "Un visuel simple et lisible vaut mieux qu'un visuel chargé. Garde deux couleurs et une police." },
      boutique: { name: 'Site et boutique en ligne', need: 'Un site pour te présenter, ou une boutique pour vendre.',
        tools: [
          'Créateur de sites par glisser-déposer, avec hébergement. La vente en ligne demande une offre payante.',
          'Boutique en ligne clé en main : catalogue, panier, paiement, stocks.',
          "Logiciels libres pour un site et sa boutique. Le logiciel est gratuit, l'hébergement se paie.",
          'Créateur de sites soignés à partir de modèles, avec vente en ligne dans les offres payantes.',
        ],
        note: 'Avant de construire une boutique, vends une première fois à la main : un lien de paiement suffit pour tester.' },
      ia: { name: 'Assistants IA', need: 'Rédiger, résumer, chercher, analyser un document, préparer un pitch.',
        tools: [
          "L'assistant d'OpenAI : rédaction, recherche, analyse, images.",
          "L'assistant d'Anthropic : rédaction, analyse de documents, code.",
          "L'assistant de Google, relié à ses services.",
          "L'assistant de l'entreprise française Mistral AI. Il s'appelait Le Chat jusqu'en 2026.",
        ],
        note: "Une IA peut se tromper avec aplomb : vérifie les chiffres, les lois et les noms qu'elle te donne. N'y colle pas de données confidentielles sans avoir lu ses réglages." },
      organiser: { name: "S'organiser", need: "Notes, tâches, discussions d'équipe.",
        tools: [
          'Notes, documents, bases de données et suivi de tâches au même endroit.',
          'Des tâches en tableaux et en cartes, à déplacer de colonne en colonne.',
          "Messagerie d'équipe organisée en canaux.",
          'E-mail à ton nom de domaine, documents, stockage et visio.',
        ],
        note: "Un seul outil bien tenu vaut mieux que cinq à moitié remplis. Choisis-en un et tiens-t'y." },
      crm: { name: 'Suivre ses clients', need: 'Savoir à qui tu as parlé, où en est chaque vente, qui relancer.',
        tools: [
          'Contacts, ventes en cours et tâches, avec des outils marketing autour.',
          'Un fichier clients à ta façon, qui se remplit depuis tes e-mails et ton agenda.',
          'Un fichier clients léger, centré sur les relations.',
          'Le suivi des ventes sous forme de colonnes, étape par étape.',
        ],
        note: 'Au tout début, un simple tableau suffit. Passe à un outil quand tu commences à oublier des relances.' },
      emails: { name: 'E-mails et newsletter', need: 'Écrire régulièrement à tes clients et à ceux qui te suivent.',
        tools: [
          'E-mails, SMS et envois automatiques. Entreprise française, ex-Sendinblue.',
          "Newsletter, formulaires et pages d'inscription pour créateurs. S'appelait ConvertKit.",
          'Créer, envoyer et faire payer une newsletter, avec un site intégré.',
          "E-mails et envois automatiques. L'offre gratuite est très limitée.",
        ],
        note: "N'écris qu'aux personnes qui ont accepté de recevoir tes messages, et laisse toujours un lien pour se désinscrire. En Europe, la loi protège les particuliers contre les envois non demandés." },
      automatiser: { name: 'Automatiser', need: 'Relier tes outils entre eux pour ne plus recopier à la main.',
        tools: [
          'Relie des applications entre elles : « quand ceci arrive, fais cela ». Le plus simple pour commencer.',
          "Des scénarios en plusieurs étapes, dessinés à l'écran.",
          "Des automatisations pour les profils techniques. Gratuit si tu l'héberges toi-même ; la version en ligne est payante après un essai.",
        ],
        note: "Fais la tâche à la main dix fois avant de l'automatiser : tu sauras exactement ce qu'il faut." },
      sondages: { name: 'Questionner ses clients', need: 'Un formulaire ou un sondage pour vérifier une idée.',
        tools: [
          "Des formulaires qui s'écrivent comme un document.",
          'Formulaires et sondages simples, dont les réponses arrivent dans un tableur.',
          "Des formulaires qui posent une question à la fois. L'offre gratuite est très limitée.",
        ],
        note: "Un sondage dit ce que les gens déclarent. Pour savoir ce qu'ils font vraiment, parle-leur et propose-leur d'acheter." },
      mesurer: { name: 'Mesurer', need: "Combien de visiteurs, d'où ils viennent, où ils s'arrêtent.",
        tools: [
          "La mesure d'audience de Google pour les sites et les applications.",
          'Ce que font les utilisateurs dans ton produit : parcours, entonnoirs, enregistrements de sessions.',
          "Une mesure d'audience légère, sans cookies, hébergée en Europe.",
          "Une mesure d'audience libre, gratuite si tu l'héberges toi-même.",
        ],
        note: "Mesurer des visiteurs touche à leur vie privée : selon l'outil, il te faut leur accord (bandeau de cookies)." },
      presenter: { name: 'Présentations et pitch deck', need: 'Les diapos pour convaincre un client ou un investisseur.',
        tools: [
          "Génère une présentation, un document ou un petit site à partir d'un texte.",
          'Des présentations faites à plusieurs, pensées pour les équipes.',
          'Des présentations à partir de modèles, dans le même outil que tes visuels.',
        ],
        note: "L'outil ne fait pas l'histoire. Écris d'abord tes dix phrases, une par diapo, puis seulement ouvre l'outil." },
      banque: { name: 'Compte pro', need: "Un compte séparé pour l'argent de ton activité.",
        tools: [
          'Compte professionnel en ligne avec cartes, virements et outils de facturation.',
          'Compte professionnel en ligne pour indépendants et petites entreprises, avec facturation.',
          'Compte professionnel en plusieurs devises, avec cartes.',
          "Compte pour envoyer et recevoir de l'argent en plusieurs devises. Utile avec des clients hors zone euro.",
        ],
        note: 'Les banques classiques ont aussi des comptes professionnels. Compare les frais, et vérifie que le compte convient à ton statut.' },
      compta: { name: 'Factures et comptabilité', need: 'Faire des factures conformes et suivre tes comptes.',
        tools: [
          'Factures, comptabilité et déclarations pour indépendants, avec envoi par Peppol.',
          'Factures envoyées et reçues, avec accès au réseau Peppol.',
          'Factures, comptabilité et suivi de trésorerie, en lien avec ton comptable.',
          'Comptabilité, factures et déclarations pour indépendants.',
        ],
        note: 'La facture électronique devient la règle. En Belgique, les factures entre entreprises soumises à la TVA passent par le réseau Peppol depuis le 1er janvier 2026. En France, depuis le 1er septembre 2026, toute entreprise doit pouvoir en recevoir ; les petites entreprises devront en émettre à partir du 1er septembre 2027. Vérifie ta situation avec ton comptable.' },
      paiements: { name: 'Encaisser des paiements', need: 'Être payé en ligne ou par carte.',
        tools: [
          'Paiements en ligne par carte et par moyens locaux comme Bancontact.',
          'Paiements en ligne et en boutique. Entreprise européenne.',
          'Petit terminal de carte et liens de paiement pour commerçants et indépendants.',
          'Compte marchand pour recevoir des paiements en ligne.',
        ],
        note: '« Sans abonnement » ne veut pas dire gratuit : une commission est prise sur chaque paiement. Compte-la dans ton prix.' },
      captable: { name: 'Table de capitalisation', need: 'Savoir qui possède quoi, et simuler une levée.',
        tools: [
          "Table de capitalisation et plans d'intéressement des salariés. Entreprise suisse, tournée vers l'Europe.",
          "Table de capitalisation et gestion des titres. Entreprise américaine ; l'offre gratuite vise les toutes jeunes sociétés.",
          'Table de capitalisation, registres légaux et actionnariat salarié. Entreprise française.',
        ],
        note: "Avec deux ou trois associés et aucune levée, un tableur bien tenu suffit. L'outil devient utile dès qu'il y a des investisseurs ou des parts pour les salariés." },
      dossier: { name: 'Partager son dossier', need: "Envoyer ton deck et tes documents, et savoir s'ils sont lus.",
        tools: [
          'Partage de documents avec statistiques de lecture, page par page. Logiciel libre.',
          'Partage sécurisé de documents avec suivi de lecture. Appartient à Dropbox.',
          'Un dossier partagé, avec des droits de lecture ou de modification. Sans statistiques de lecture.',
        ],
        note: "Envoie un lien plutôt qu'une pièce jointe : tu peux corriger le document après coup, et couper l'accès." },
      donnees: { name: 'Données sur les startups', need: 'Qui a levé combien, auprès de qui, dans quel secteur.',
        tools: [
          'Base de données sur les entreprises, les investisseurs et les levées de fonds.',
          'Base de données sur les startups et leurs financements, très présente en Europe.',
          'La base de données des professionnels du capital-risque. Sur abonnement.',
        ],
        note: 'Ces bases sont incomplètes sur les petites levées. Recoupe toujours avec le registre officiel et avec les fondateurs.' },
      verifier: { name: 'Vérifier une entreprise', need: 'Existe-t-elle vraiment ? Qui la dirige ? Que disent ses comptes ?',
        tools: [
          'Le registre officiel des entreprises belges : numéro, adresse, activités, dirigeants.',
          'Les comptes annuels déposés par les entreprises belges, à la Banque nationale de Belgique.',
          'Le moteur de recherche public des entreprises françaises.',
          'Les données publiques des entreprises françaises, réunies par un service privé.',
        ],
        note: 'Avant de signer avec un client, un fournisseur ou une entreprise où tu investis : deux minutes de recherche évitent de mauvaises surprises.' },
      arnaques: { name: 'Repérer les arnaques', need: "Vérifier qu'un vendeur de placements est autorisé.",
        tools: [
          "L'outil du régulateur belge : le vendeur est-il autorisé ? Fait-il l'objet d'une mise en garde ?",
          'Les listes du régulateur français des sociétés et des sites non autorisés.',
          "Un service de l'AMF pour vérifier un acteur, tester une offre et signaler une fraude.",
          'Les alertes des régulateurs du monde entier, réunies sur un seul portail (en anglais).',
        ],
        note: "Un nom absent d'une liste noire n'est pas une preuve de sérieux : les fraudeurs changent de nom sans arrêt. Vérifie que le vendeur est bien autorisé." },
      marches: { name: 'Suivre les marchés', need: 'Comprendre un placement et suivre ton portefeuille.',
        tools: [
          "Un moteur de recherche d'ETF, avec des guides pour comprendre.",
          'Un logiciel libre à installer, qui calcule la performance réelle de ton portefeuille.',
          'Graphiques, cours et alertes sur les marchés.',
          'Suivi de portefeuille en ligne (en anglais).',
        ],
        note: "Ces outils informent, ils ne conseillent pas. Aucun courtier ni vendeur de placements n'est listé ici, par choix." },
      aides: { name: 'Aides publiques', need: 'Des organismes publics qui renseignent et accompagnent.',
        tools: [
          "L'agence bruxelloise pour l'entrepreneuriat. Son service d'information hub.info a remplacé le site 1819 ; le numéro 1819 reste en service.",
          "Le point d'information des entrepreneurs wallons, lié à Wallonie Entreprendre.",
          "L'agence flamande pour l'innovation et l'entrepreneuriat (site en néerlandais).",
          'Le portail fédéral des démarches pour créer ou développer une entreprise en Belgique.',
          'Guides, modèles et outils pour créer ou reprendre une entreprise.',
          "Le site officiel pour déclarer la création, la modification ou l'arrêt d'une entreprise.",
        ],
        note: 'Ces organismes existent pour répondre à tes questions. Commence par eux avant de payer un service privé.' },
    },
  },

  /* Le calcul, pas à pas : [ce qu'on calcule, l'opération avec les chiffres saisis].
     Même ordre et mêmes cas dans les trois langues. */
  steps: {
    runway(v, r, F) {
      const g = r.series[12];
      return [
        ['Ce que tu perds chaque mois', `${F.money(v.burn)} − ${F.money(v.revenue)} = ${F.money(r.netBurn)}`],
        r.netBurn > 0 ? ['Sans croissance, la trésorerie tiendrait', `${F.money(v.cash)} ÷ ${F.money(r.netBurn)} ≈ ${F.nf(v.cash / r.netBurn, 1)} mois`] : null,
        v.growth !== 0 && g ? [`Tes revenus au mois 12, avec ${F.pct(v.growth)} par mois`, `${F.money(v.revenue)} × (1 + ${F.pct(v.growth)})^11 = ${F.money(g.revenue)}`] : null,
        r.netBurn > 0 ? ['En clair, chaque jour te coûte', `${F.money(r.netBurn)} ÷ 30 ≈ ${F.money(r.netBurn / 30)}`] : null,
      ];
    },
    lever(v, r, F) {
      return [
        ['Perte par mois', `${F.money(v.burn)} − ${F.money(v.revenue)} = ${F.money(r.netBurn)}`],
        ['Besoin sur la durée', `${F.money(Math.max(0, r.netBurn))} × ${v.months} mois = ${F.money(r.base)}`],
        v.buffer > 0 ? ['Avec la marge de sécurité', `${F.money(r.base)} × (1 + ${F.pct(v.buffer)}) = ${F.money(r.raise)}`] : null,
        r.investors != null ? ['Part cédée aux investisseurs', `${F.money(r.raise)} ÷ (${F.money(v.pre)} + ${F.money(r.raise)}) = ${F.pct(r.investors)}`] : null,
        r.raise > 0 ? ['En clair, chaque mois financé coûte', `${F.money(r.raise)} ÷ ${v.months} = ${F.money(r.raise / v.months)}`] : null,
      ];
    },
    dilution(v, r, F) {
      return [
        ['Valorisation après la levée', `${F.money(v.pre)} + ${F.money(v.raise)} = ${F.money(r.post)}`],
        ['Part des nouveaux investisseurs', `${F.money(v.raise)} ÷ ${F.money(r.post)} = ${F.pct(r.investors)}`],
        ['Ce que gardent ceux qui étaient là', `100 % − ${F.pct(r.investors)} − ${F.pct(r.pool)} = ${F.pct(100 - r.investors - r.pool)}`],
        ['Part des fondateurs', `${F.pct(v.founders)} × ${F.pct(100 - r.investors - r.pool)} = ${F.pct(r.founders)}`],
        ['En clair, leur part vaut aujourd\'hui', `${F.pct(r.founders)} × ${F.money(r.post)} = ${F.money((r.founders / 100) * r.post)}`],
      ];
    },
    vesting(v, r, F) {
      const total = v.years * 12;
      return [
        ['Durée totale', `${v.years} ans × 12 = ${total} mois`],
        r.toCliff > 0 ? ['Le cliff', `${F.nf(v.elapsed)} mois < ${F.nf(v.cliff)} mois : rien n'est acquis`]
          : ['Part du temps écoulé', `${F.nf(Math.min(v.elapsed, total))} ÷ ${total} = ${F.pct(r.ratio)}`],
        ['Capital acquis', `${F.pct(v.stake, 2)} × ${F.pct(r.ratio)} = ${F.pct(r.vested, 2)}`],
        ['En clair, chaque mois t\'apporte', `${F.pct(v.stake, 2)} ÷ ${total} = ${F.pct(v.stake / total, 3)}`],
      ];
    },
    marche(v, r, F) {
      return [
        ['Marché total (TAM)', `${F.nf(v.customers)} × ${F.money(v.price)} = ${F.money(r.tam)}`],
        ['Clients que tu peux servir', `${F.nf(v.customers)} × ${F.pct(v.reachable)} = ${F.nf(r.samCustomers)}`],
        ['Clients que tu vises', `${F.nf(r.samCustomers)} × ${F.pct(v.share)} = ${F.nf(r.somCustomers)}`],
        ['Revenus visés (SOM)', `${F.nf(r.somCustomers)} × ${F.money(v.price)} = ${F.money(r.som)}`],
        ['En clair, par mois', `${F.money(r.som)} ÷ 12 = ${F.money(r.som / 12)}`],
      ];
    },
    client(v, r, F) {
      const monthly = v.arpu * (v.margin / 100);
      return [
        ["Coût d'un client (CAC)", `${F.money(v.spend)} ÷ ${F.nf(v.customers)} = ${F.money(r.cac)}`],
        ['Marge par client et par mois', `${F.money(v.arpu)} × ${F.pct(v.margin)} = ${F.money(monthly)}`],
        ['Un client reste en moyenne', `100 % ÷ ${F.pct(v.churn)} = ${F.nf(r.lifetime, 1)} mois`],
        ["Valeur d'un client (LTV)", `${F.money(monthly)} × ${F.nf(r.lifetime, 1)} = ${F.money(r.ltv)}`],
        r.ratio != null ? ['Rapport LTV ÷ CAC', `${F.money(r.ltv)} ÷ ${F.money(r.cac)} = ${F.nf(r.ratio, 1)}`] : null,
      ];
    },
    objectif(v, r, F) {
      const still = v.current * (1 - v.churn / 100) ** v.months;
      return [
        ['Clients nécessaires', `${F.money(v.target)} ÷ ${F.money(v.price)} = ${F.nf(r.needed)}`],
        v.current > 0 && v.churn > 0 ? [`Tes clients encore là dans ${v.months} mois`, `${F.nf(v.current)} × (1 − ${F.pct(v.churn)})^${v.months} ≈ ${F.nf(still)}`] : null,
        ['Clients à gagner en tout', `${F.nf(r.perMonth, 1)} × ${v.months} mois ≈ ${F.nf(r.total)}`],
        r.perMonth > 0 ? ['En clair, par semaine', `${F.nf(r.perMonth, 1)} × 12 ÷ 52 ≈ ${F.nf((r.perMonth * 12) / 52, 1)}`] : null,
      ];
    },
    croissance(v, r, F) {
      return [
        ['Multiplication visée', `${F.nf(v.to)} ÷ ${F.nf(v.from)} = ${F.nf(r.multiple, 2)}`],
        ['Croissance par mois', `${F.nf(r.multiple, 2)}^(1/${v.months}) − 1 = ${F.pct(r.monthly, 2)}`],
        ['Sur un an', `(1 + ${F.pct(r.monthly, 2)})^12 − 1 = ${F.pct(r.yearly, 0)}`],
        r.monthly > 0 ? ['En clair, le mois prochain', `${F.nf(v.from)} × (1 + ${F.pct(r.monthly, 2)}) = ${F.nf(v.from * (1 + r.monthly / 100), 1)}`] : null,
      ];
    },
    tarif(v, r, F) {
      const gross = (v.net * 12) / (1 - v.charges / 100);
      return [
        ["Jours facturés sur l'année", `${F.nf(v.days)} × 12 × (52 − ${F.nf(v.weeks)}) ÷ 52 = ${F.nf(r.billable, 0)}`],
        [`Pour garder ${F.money(v.net)} par mois`, `${F.money(v.net)} × 12 ÷ (1 − ${F.pct(v.charges)}) = ${F.money(gross)}`],
        v.costs > 0 ? ['Plus les frais de l\'année', `${F.money(gross)} + ${F.money(v.costs)} × 12 = ${F.money(r.revenue)}`] : null,
        ['Tarif par jour', `${F.money(r.revenue)} ÷ ${F.nf(r.billable, 0)} = ${F.money(r.rate)}`],
        [`En clair, un mois à ${F.nf(v.days)} jours facturés`, `${F.nf(v.days)} × ${F.money(r.rate)} = ${F.money(v.days * r.rate)}`],
      ];
    },
    devis(v, r, F) {
      return [
        ['Travail', `${F.nf(v.days, 1)} jours × ${F.money(v.rate)} = ${F.money(r.work)}`],
        v.buffer > 0 ? ['Marge pour les imprévus', `${F.money(r.work)} × ${F.pct(v.buffer)} = ${F.money(r.safety)}`] : null,
        ['Total hors taxe', `${F.money(r.work)} + ${F.money(r.safety)} + ${F.money(v.expenses)} = ${F.money(r.ht)}`],
        v.vat > 0 ? ['TVA', `${F.money(r.ht)} × ${F.pct(v.vat)} = ${F.money(r.vatAmount)}`] : null,
        v.deposit > 0 ? ['Acompte', `${F.money(r.ttc)} × ${F.pct(v.deposit)} = ${F.money(r.depositAmount)}`] : null,
        ['En clair, un jour prévu te rapporte', `(${F.money(r.ht)} − ${F.money(v.expenses)}) ÷ ${F.nf(v.days, 1)} = ${F.money((r.ht - v.expenses) / v.days)}`],
      ];
    },
    prix(v, r, F) {
      return [
        ['Prix hors taxe', `${F.money(v.cost)} ÷ (1 − ${F.pct(v.margin)}) = ${F.money(r.ht)}`],
        ['Ta marge', `${F.money(r.ht)} − ${F.money(v.cost)} = ${F.money(r.marginAmount)}`],
        v.vat > 0 ? ['Prix affiché', `${F.money(r.ht)} × (1 + ${F.pct(v.vat)}) = ${F.money(r.ttc)}`] : null,
        r.marginAmount > 0 ? [`En clair, pour gagner ${F.money(1000)} de marge`, `${F.money(1000)} ÷ ${F.money(r.marginAmount)} → ${F.nf(Math.ceil(1000 / r.marginAmount))} ventes`] : null,
      ];
    },
    remise(v, r, F) {
      return [
        ['Marge par vente, avant', `${F.money(v.price)} × ${F.pct(v.margin)} = ${F.money(r.before)}`],
        ['Marge par vente, après', `${F.money(v.price)} × (${F.pct(v.margin)} − ${F.pct(v.discount)}) = ${F.money(r.after)}`],
        r.extra != null ? ['Ventes en plus', `${F.money(r.before)} ÷ ${F.money(r.after)} − 1 = ${F.pct(r.extra)}`] : null,
        r.extra != null ? ['En clair, 100 ventes avant valent', `100 × ${F.money(r.before)} ÷ ${F.money(r.after)} → ${F.nf(Math.ceil(100 + r.extra))} ventes après`] : null,
      ];
    },
    seuil(v, r, F) {
      return [
        ['Marge par vente', `${F.money(v.price)} − ${F.money(v.variable)} = ${F.money(r.margin)}`],
        r.units != null ? ['Ventes pour couvrir les charges', `${F.money(v.fixed)} ÷ ${F.money(r.margin)} = ${F.nf(v.fixed / r.margin, 1)} → ${F.nf(r.units)}`] : null,
        r.units != null ? ["Chiffre d'affaires au seuil", `${F.nf(r.units)} × ${F.money(v.price)} = ${F.money(r.revenue)}`] : null,
        r.units != null ? ['En clair, par jour ouvré (22 par mois)', `${F.nf(r.units)} ÷ 22 ≈ ${F.nf(r.units / 22, 1)} vente${r.units / 22 >= 2 ? 's' : ''}`] : null,
      ];
    },
    tunnel(v, r, F) {
      return [
        ['Contacts', `${F.nf(v.visitors)} × ${F.pct(v.signup)} = ${F.nf(r.leads, 1)}`],
        ['Clients', `${F.nf(r.leads, 1)} × ${F.pct(v.purchase)} = ${F.nf(r.customers, 1)}`],
        ["Chiffre d'affaires", `${F.nf(r.customers, 1)} × ${F.money(v.basket)} = ${F.money(r.revenue)}`],
        r.costPerCustomer != null ? ["Coût d'un client", `${F.money(v.spend)} ÷ ${F.nf(r.customers, 1)} = ${F.money(r.costPerCustomer)}`] : null,
        r.customers > 0 ? ['En clair, visiteurs pour un client', `${F.nf(v.visitors)} ÷ ${F.nf(r.customers, 1)} ≈ ${F.nf(v.visitors / r.customers)}`] : null,
      ];
    },
    tirelire(v, r, F) {
      return [
        ['TVA, à reverser', `${F.money(v.amount)} × ${F.pct(v.vat)} = ${F.money(r.vatAmount)}`],
        ['Cotisations et impôts', `${F.money(v.amount)} × ${F.pct(v.charges)} = ${F.money(r.chargesAmount)}`],
        ['À mettre de côté', `${F.money(r.vatAmount)} + ${F.money(r.chargesAmount)} = ${F.money(r.aside)}`],
        ['Vraiment à toi', `${F.money(v.amount)} − ${F.money(r.chargesAmount)} = ${F.money(r.yours)}`],
        [`En clair, sur ${F.money(100)} encaissés`, `${F.money(r.yoursShare)} sont à toi`],
      ];
    },
    ticket(v, r, F) {
      return [
        ["Ta part à l'entrée", `${F.money(v.ticket)} ÷ ${F.money(v.post)} = ${F.pct(r.stake, 2)}`],
        v.dilution > 0 ? ['Après les levées suivantes', `${F.pct(r.stake, 2)} × (1 − ${F.pct(v.dilution)}) = ${F.pct(r.stakeExit, 2)}`] : null,
        ['Ce que tu récupères', `${F.pct(r.stakeExit, 2)} × ${F.money(v.exit)} = ${F.money(r.proceeds)}`],
        ['Multiple', `${F.money(r.proceeds)} ÷ ${F.money(v.ticket)} = ${F.times(r.multiple)}`],
        r.multiple > 0 ? ['Rendement par an (TRI)', `${F.nf(r.multiple, 2)}^(1/${v.years}) − 1 = ${F.pct(r.irr)}`] : null,
      ];
    },
    valo(v, r, F) {
      const kept = v.exit * (1 - v.dilution / 100);
      return [
        ['Sortie, une fois ta part diluée', `${F.money(v.exit)} × (1 − ${F.pct(v.dilution)}) = ${F.money(kept)}`],
        ['Valorisation maximale', `${F.money(kept)} ÷ ${F.nf(v.multiple, 1)} = ${F.money(r.post)}`],
        r.stake != null ? ["Ta part à l'entrée", `${F.money(v.ticket)} ÷ ${F.money(r.post)} = ${F.pct(r.stake, 2)}`] : null,
        r.stake != null ? ['En clair, à la sortie tu toucherais', `${F.money(v.ticket)} × ${F.nf(v.multiple, 1)} = ${F.money(v.ticket * v.multiple)}`] : null,
      ];
    },
    portefeuille(v, r, F) {
      return [
        ['Investi en tout', `${F.nf(v.count)} × ${F.money(v.ticket)} = ${F.money(r.invested)}`],
        ['Multiple moyen', `${F.pct(v.mid)} × ${F.nf(v.midMultiple, 1)} + ${F.pct(r.win)} × ${F.nf(v.winMultiple, 1)} = ${F.times(r.multiple)}`],
        ['Retour attendu', `${F.money(r.invested)} × ${F.nf(r.multiple, 2)} = ${F.money(r.proceeds)}`],
        ['En clair, un seul gros succès rend', `${F.money(v.ticket)} × ${F.nf(v.winMultiple, 1)} = ${F.money(v.ticket * v.winMultiple)}`],
      ];
    },
    suivre(v, r, F) {
      return [
        ['Valorisation après la levée', `${F.money(v.pre)} + ${F.money(v.raise)} = ${F.money(r.post)}`],
        ['Pour garder ta part', `${F.money(v.raise)} × ${F.pct(v.stake, 2)} = ${F.money(r.invest)}`],
        ['Si tu ne suis pas', `${F.pct(v.stake, 2)} × ${F.money(v.pre)} ÷ ${F.money(r.post)} = ${F.pct(r.without, 2)}`],
      ];
    },
    fonte(v, r, F) {
      return [
        ['Chaque levée te laisse', `100 % − ${F.pct(v.dilution)} = ${F.pct(100 - v.dilution)}`],
        [`Après ${v.rounds} levée${v.rounds > 1 ? 's' : ''}`, `${F.pct(v.stake, 2)} × ${F.nf(1 - v.dilution / 100, 2)}^${v.rounds} = ${F.pct(r.final, 2)}`],
        [`En clair, pour une vente à ${F.money(1e7)}`, `${F.pct(r.final, 2)} × ${F.money(1e7)} = ${F.money((r.final / 100) * 1e7)}`],
      ];
    },
    convertible(v, r, F) {
      const discounted = v.pre * (1 - v.discount / 100);
      return [
        ['Valorisation avec la décote', `${F.money(v.pre)} × (1 − ${F.pct(v.discount)}) = ${F.money(discounted)}`],
        v.cap > 0 ? ['Valorisation retenue : la plus basse', `min(${F.money(v.cap)} ; ${F.money(discounted)}) = ${F.money(r.effective)}`] : null,
        ['Le porteur achète comme si', `${F.money(v.amount)} ÷ ${F.money(r.effective)} = ${F.pct((v.amount / r.effective) * 100, 2)} du capital d'avant`],
        ['Sa part après la levée', F.pct(r.stake, 2)],
      ];
    },
    cascade(v, r, F) {
      return [
        ['Préférence des investisseurs', `${F.money(v.invested)} × ${F.nf(v.multiple, 1)} = ${F.money(v.invested * v.multiple)}`],
        ['Leur part du prix', `${F.money(v.exit)} × ${F.pct(v.stake)} = ${F.money(r.asShares)}`],
        ['Ils prennent le plus grand', `max(${F.money(r.preference)} ; ${F.money(r.asShares)}) = ${F.money(r.investors)}`],
        ['Reste aux autres associés', `${F.money(v.exit)} − ${F.money(r.investors)} = ${F.money(r.others)}`],
      ];
    },
    note(v, r, F) {
      const names = { team: 'Équipe', market: 'Marché', traction: 'Traction', product: 'Produit', terms: 'Conditions' };
      return [
        ...r.parts.map((p) => [`${names[p.key]} (poids ${p.weight})`, `${F.nf(p.note, 1)} ÷ 10 × ${p.weight} = ${F.nf(p.points, 1)}`]),
        ['Total', `${r.parts.map((p) => F.nf(p.points, 1)).join(' + ')} = ${F.nf(r.score, 1)}`],
      ];
    },
    composes(v, r, F) {
      return [
        ['Versé en tout', `${F.money(v.initial)} + ${F.money(v.monthly)} × ${v.years * 12} mois = ${F.money(r.paid)}`],
        ['Ce que les intérêts ajoutent', `${F.money(r.value)} − ${F.money(r.paid)} = ${F.money(r.gain)}`],
        v.rate > 0 ? ['Temps pour doubler (règle de 72)', `72 ÷ ${F.nf(v.rate, 1)} ≈ ${F.nf(72 / v.rate, 1)} ans`] : null,
        r.value > 0 ? ['En clair, en retirant ensuite 4 % par an', `${F.money(r.value)} × 4 % ÷ 12 = ${F.money((r.value * 0.04) / 12)} par mois`] : null,
      ];
    },
    cible(v, r, F) {
      return [
        [`Ton capital de départ, dans ${v.years} an${v.years > 1 ? 's' : ''}`, `${F.money(v.initial)} → ${F.money(r.grown)}`],
        ['Reste à constituer', `${F.money(v.target)} − ${F.money(r.grown)} = ${F.money(Math.max(0, v.target - r.grown))}`],
        ['Versé en tout', `${F.money(v.initial)} + ${F.money(r.monthly)} × ${v.years * 12} = ${F.money(r.paid)}`],
        r.monthly > 0 ? ['En clair, par jour', `${F.money(r.monthly)} × 12 ÷ 365 ≈ ${F.money((r.monthly * 12) / 365)}`] : null,
      ];
    },
    frais(v, r, F) {
      const [low, high] = v.feeA <= v.feeB ? [r.a, r.b] : [r.b, r.a];
      return [
        ['Rendement net du placement A', `${F.pct(v.rate)} − ${F.pct(v.feeA, 2)} = ${F.pct(v.rate - v.feeA, 2)}`],
        ['Rendement net du placement B', `${F.pct(v.rate)} − ${F.pct(v.feeB, 2)} = ${F.pct(v.rate - v.feeB, 2)}`],
        ['Écart à la fin', `${F.money(low)} − ${F.money(high)} = ${F.money(r.gap)}`],
        v.monthly > 0 && r.gap > 0 ? ['En clair, cet écart vaut', `${F.money(r.gap)} ÷ ${F.money(v.monthly)} ≈ ${F.nf(r.gap / v.monthly)} mois de versements`] : null,
      ];
    },
    inflation(v, r, F) {
      const prices = (1 + v.inflation / 100) ** v.years;
      return [
        [`Les prix, en ${v.years} an${v.years > 1 ? 's' : ''}`, `(1 + ${F.pct(v.inflation)})^${v.years} = × ${F.nf(prices, 2)}`],
        v.rate !== 0 ? ['Somme affichée', `${F.money(v.amount)} × (1 + ${F.pct(v.rate)})^${v.years} = ${F.money(r.nominal)}`] : null,
        ["Valeur d'aujourd'hui", `${F.money(r.nominal)} ÷ ${F.nf(prices, 2)} = ${F.money(r.real)}`],
        [`En clair, un plein de courses à ${F.money(100)} coûterait`, `${F.money(100)} × ${F.nf(prices, 2)} = ${F.money(100 * prices)}`],
      ];
    },
    reserve(v, r, F) {
      const monthly = ((1 + v.rate / 100) ** (1 / 12) - 1) * 100;
      return [
        ['Rendement par mois', `(1 + ${F.pct(v.rate)})^(1/12) − 1 = ${F.pct(monthly, 3)}`],
        ['Ce que le capital rapporte par mois', `${F.money(v.capital)} × ${F.pct(monthly, 3)} = ${F.money(r.sustainable)}`],
        r.forever ? ['Tu retires moins que ça', `${F.money(v.monthly)} ≤ ${F.money(r.sustainable)}`]
          : ['Tu puises dans le capital, au départ', `${F.money(v.monthly)} − ${F.money(r.sustainable)} = ${F.money(v.monthly - r.sustainable)} par mois`],
        r.total != null ? ['Retiré en tout', `${F.money(v.monthly)} × ${F.nf(r.months)} mois = ${F.money(r.total)}`] : null,
      ];
    },
    coussin(v, r, F) {
      return [
        ['Objectif', `${F.money(v.expenses)} × ${F.nf(v.months)} mois = ${F.money(r.target)}`],
        ['Déjà couvert', `${F.money(v.saved)} ÷ ${F.money(v.expenses)} = ${F.nf(r.covered, 1)} mois`],
        r.missing > 0 ? ['Il manque', `${F.money(r.target)} − ${F.money(v.saved)} = ${F.money(r.missing)}`] : null,
        r.missing > 0 && v.monthly > 0 ? ['Temps pour y arriver', `${F.money(r.missing)} ÷ ${F.money(v.monthly)} = ${F.nf(r.missing / v.monthly, 1)} → ${r.wait} mois`] : null,
      ];
    },
  },

  /* Les résultats des bornes. v = ce que tu as saisi, r = le calcul, F = les formats. */
  res: {
    runway: {
      invalid: 'Vérifie tes chiffres : la trésorerie, les dépenses et les revenus ne peuvent pas être négatifs.',
      label: () => 'mois de survie',
      verdict(v, r, F) {
        // Des revenus qui couvrent les dépenses aujourd'hui, mais qui baissent : ce n'est pas un point d'équilibre.
        const shrinking = r.breakEven === 1 && v.growth < 0;
        if (shrinking) {
          return r.months == null ? `Tes revenus couvrent tes dépenses aujourd'hui, mais ils baissent. La trésorerie tient quand même plus de ${r.horizon} mois.`
            : `Tes revenus couvrent tes dépenses aujourd'hui, mais ils baissent : la trésorerie passe sous zéro au cours du ${F.ord(r.months + 1)} mois.`;
        }
        if (r.months == null && r.breakEven) return r.breakEven === 1 ? 'Tes revenus couvrent déjà tes dépenses : la trésorerie ne baisse pas.'
          : `Tes revenus rattrapent tes dépenses au ${F.ord(r.breakEven)} mois : la trésorerie ne passe jamais sous zéro.`;
        if (r.months == null) return `Tu tiens plus de ${r.horizon} mois à ce rythme.`;
        let t = r.months === 0 ? 'À ce rythme, la trésorerie passe sous zéro dès le premier mois.'
          : `À ce rythme, la trésorerie passe sous zéro au cours du ${F.ord(r.months + 1)} mois.`;
        if (r.breakEven) t += ` Tes revenus ne couvriraient tes dépenses qu'au ${F.ord(r.breakEven)} mois : trop tard, sauf à lever des fonds ou à réduire les dépenses.`;
        return t;
      },
      hearts: (n) => `${n} cœur${n > 1 ? 's' : ''} sur 12`,
      heartsNote: 'Un cœur par mois, douze au plus.',
      facts: (v, r, F) => [
        ["Tu perds chaque mois, aujourd'hui", r.netBurn > 0 ? F.money(r.netBurn) : 'rien'],
        ['Revenus qui couvrent les dépenses', r.breakEven === 1 ? (v.growth < 0 ? "aujourd'hui, mais en baisse" : "dès aujourd'hui") : r.breakEven ? `au ${F.ord(r.breakEven)} mois` : `pas avant ${r.horizon} mois`],
      ],
      chart: 'Ta trésorerie, mois par mois',
      tick: (n) => 'M' + n,
      bar: (p, F) => `Mois ${p.month} : ${F.money(p.cash)}`,
      legend: ['Trésorerie positive', 'Sous zéro'],
      table: ['Mois', 'Revenus', 'Trésorerie'],
      row: (p, F) => [p.month === 0 ? "Aujourd'hui" : 'Mois ' + p.month, p.month === 0 ? '' : F.money(p.revenue), F.money(p.cash)],
    },
    lever: {
      invalid: 'Vérifie tes chiffres : il faut au moins un mois à financer, et des montants qui ne sont pas négatifs.',
      none: 'Rien',
      noneLabel: 'à lever pour tenir',
      noneVerdict: 'Tes revenus couvrent déjà tes dépenses. Une levée ne servirait pas à tenir, mais à aller plus vite : dis précisément à quoi.',
      label: (v) => `à lever pour tenir ${v.months} mois`,
      verdict: (v, r, F) => `Tu perds ${F.money(r.netBurn)} par mois : ${F.money(r.base)} sur ${v.months} mois`
        + (v.buffer > 0 ? `, plus ${F.pct(v.buffer, 0)} de marge de sécurité.` : '.')
        + (r.investors != null ? ` À ${F.money(v.pre)} de valorisation, tu cèdes ${F.pct(r.investors)} du capital.` : ''),
      rows: ['Besoin sans marge', 'Marge de sécurité'],
      facts: (v, r, F) => [
        ['Perte par mois', F.money(r.netBurn)],
        r.post != null ? ['Valorisation après la levée', F.money(r.post)] : null,
        ['Part cédée aux investisseurs', r.investors != null ? F.pct(r.investors) : 'indique une valorisation'],
      ],
    },
    dilution: {
      invalid: 'Avec ces chiffres, il ne reste plus rien à partager : la levée et la réserve prennent 100 % du capital ou plus. Vérifie la valorisation.',
      label: 'pour les fondateurs après la levée',
      verdict: (v, r, F) => `Les fondateurs passent de ${F.pct(v.founders)} à ${F.pct(r.founders)} : ils cèdent ${F.nf(r.lost, 1)} points. L'entreprise vaut ${F.money(r.post)} après la levée.`,
      parts: ['Fondateurs', 'Autres associés déjà là', 'Réserve pour les salariés', 'Nouveaux investisseurs'],
      facts: (v, r, F) => [
        ['Valorisation avant la levée', F.money(v.pre)],
        ['Valorisation après la levée', F.money(r.post)],
        ['Part des nouveaux investisseurs', F.pct(r.investors)],
      ],
    },
    vesting: {
      invalid: "Vérifie tes chiffres : une part entre 0 et 100 %, une durée d'au moins un an, et un cliff plus court que la durée.",
      label: 'du capital déjà acquis',
      verdict(v, r, F) {
        if (r.toCliff > 0) return `Le cliff n'est pas passé : rien n'est encore acquis. Encore ${r.toCliff} mois avant la première acquisition.`;
        if (r.left === 0) return `Tout est acquis : les ${F.pct(v.stake, 2)} sont à toi.`;
        return `${F.pct(r.ratio)} de ton attribution est acquis. En partant aujourd'hui, tu garderais ${F.pct(r.vested, 2)} du capital et tu laisserais ${F.pct(r.unvested, 2)}.`;
      },
      parts: ['Déjà acquis', 'Pas encore acquis'],
      facts: (v, r, F) => [
        ['Acquis', F.pct(r.vested, 2)],
        ['Pas encore acquis', F.pct(r.unvested, 2)],
        ['Mois avant la fin', r.left === 0 ? 'terminé' : String(r.left)],
      ],
    },
    marche: {
      invalid: 'Vérifie tes chiffres : il faut au moins un client et un revenu par client, et des parts entre 0 et 100 %.',
      label: 'par an : le marché que tu vises',
      verdict: (v, r, F) => `Sur ${F.nf(v.customers)} clients possibles, tu peux en servir ${F.nf(r.samCustomers)} et tu en vises ${F.nf(r.somCustomers)}. À ${F.money(v.price)} par an chacun, cela fait ${F.money(r.som)} de revenus par an.`,
      rows: ['Marché total (TAM)', 'Marché que tu peux servir (SAM)', 'Marché que tu vises (SOM)'],
      facts: (v, r, F) => [
        ['Clients que tu peux servir', F.nf(r.samCustomers)],
        ['Clients que tu vises', F.nf(r.somCustomers)],
        ['Part du marché total', F.pct(r.tam > 0 ? (r.som / r.tam) * 100 : 0, 2)],
      ],
    },
    client: {
      invalid: 'Vérifie tes chiffres : il faut au moins un client, un revenu, une marge entre 1 et 100 % et un taux de départ au-dessus de zéro.',
      free: 'Gratuit',
      label: 'ce que rapporte un client, comparé à son coût',
      verdict(v, r, F) {
        if (r.ratio == null) return 'Tes clients ne te coûtent rien à trouver : chacun rapporte sa marge dès le premier mois.';
        if (r.ratio >= 3) return `Un client te rapporte ${F.nf(r.ratio, 1)} fois ce qu'il te coûte : au-dessus du repère de 3.`;
        if (r.ratio >= 1) return `Un client te rapporte ${F.nf(r.ratio, 1)} fois ce qu'il te coûte : en dessous du repère de 3. Baisse le coût d'acquisition, ou garde tes clients plus longtemps.`;
        return `Un client te coûte plus qu'il ne rapporte (${F.nf(r.ratio, 1)} fois son coût) : chaque nouveau client creuse la perte.`;
      },
      rows: ["Coût d'un client (CAC)", "Valeur d'un client (LTV)"],
      facts: (v, r, F) => [
        ['Un client reste en moyenne', `${F.nf(r.lifetime, 1)} mois`],
        ['Son coût est remboursé en', r.payback ? `${F.nf(r.payback, 1)} mois` : 'tout de suite'],
      ],
    },
    objectif: {
      invalid: 'Vérifie tes chiffres : un revenu visé et un prix au-dessus de zéro, un taux de départ en dessous de 100 %, et au moins un mois.',
      label: (r) => (r.perMonth > 1 ? 'nouveaux clients à gagner chaque mois' : 'nouveau client à gagner chaque mois'),
      verdict(v, r, F) {
        if (r.perMonth === 0) return `Tu as déjà assez de clients pour atteindre ${F.money(v.target)} par mois dans ${v.months} mois, même avec les départs.`;
        let t = `Pour atteindre ${F.money(v.target)} par mois, il te faut ${F.nf(r.needed)} client${r.needed > 1 ? 's' : ''}. En ${v.months} mois, cela demande ${F.nf(r.perMonth, 1)} nouveaux clients par mois.`;
        if (r.lost > 0) t += ` Dont ${F.nf(r.lost)} en tout pour remplacer ceux qui partent.`;
        return t;
      },
      rows: ["Clients aujourd'hui", 'Clients nécessaires', 'Clients à gagner en tout'],
      facts: (v, r, F) => [
        ["Revenu par mois aujourd'hui", F.money(r.currentRevenue)],
        ['Clients à gagner en tout', F.nf(r.total)],
        ['Dont pour remplacer les départs', F.nf(Math.max(0, r.lost))],
      ],
    },
    croissance: {
      invalid: 'Vérifie tes chiffres : deux chiffres au-dessus de zéro, et au moins un mois.',
      label: 'de croissance par mois',
      verdict(v, r, F) {
        if (r.monthly === 0) return "Départ et objectif sont égaux : aucune croissance n'est nécessaire.";
        if (r.monthly < 0) return `L'objectif est plus bas que le départ : une baisse de ${F.pct(-r.monthly, 2)} par mois.`;
        return `Pour passer de ${F.nf(v.from)} à ${F.nf(v.to)} en ${v.months} mois, il faut grandir de ${F.pct(r.monthly, 2)} chaque mois, pour arriver à ${F.nf(r.multiple, 1)} fois le chiffre de départ.`;
      },
      facts: (v, r, F) => [
        ['Sur un an, au même rythme', F.pct(r.yearly, 0)],
        ['Temps pour doubler', r.doubling != null ? `${F.nf(r.doubling, 1)} mois` : '—'],
        ['Multiplié par', F.nf(r.multiple, 2)],
      ],
    },
    tarif: {
      invalid: 'Vérifie tes chiffres : il faut un revenu visé, au moins un jour facturé par mois, moins de 52 semaines sans facturer et moins de 100 % de cotisations.',
      label: 'par jour, hors taxe',
      verdict: (v, r, F) => `Pour garder ${F.money(v.net)} par mois, il te faut facturer ${F.money(r.revenue)} sur l'année, en ${F.nf(r.billable, 0)} jours.`,
      chart: 'Où part ce que tu factures',
      rows: ['Ce que tu gardes', 'Cotisations et impôts', 'Frais professionnels'],
      facts: (v, r, F) => [
        ['Par heure, pour 8 heures par jour', F.money(r.hourly)],
        ["Jours facturés sur l'année", F.nf(r.billable, 0)],
        ['À facturer par mois, en moyenne', F.money(r.revenue / 12)],
      ],
    },
    devis: {
      invalid: 'Vérifie tes chiffres : il faut des jours et un tarif au-dessus de zéro, et des pourcentages entre 0 et 100.',
      label: (v) => (v.vat > 0 ? 'à payer par le client, TVA comprise' : 'à payer par le client'),
      verdict: (v, r, F) => `Ton devis : ${F.money(r.ht)} hors taxe, pour ${F.nf(r.days, 1)} jours prévus avec les imprévus.`
        + (v.deposit > 0 ? ` Acompte de ${F.pct(v.deposit, 0)} : ${F.money(r.depositAmount)} avant de commencer, puis ${F.money(r.balance)} à la fin.` : ''),
      chart: 'Ce que contient le devis',
      rows: ['Travail', 'Marge pour les imprévus', 'Frais', 'TVA'],
      facts: (v, r, F) => [
        ['Total hors taxe', F.money(r.ht)],
        ['Acompte', F.money(r.depositAmount)],
        ['Solde à la fin', F.money(r.balance)],
      ],
    },
    prix: {
      invalid: 'Vérifie tes chiffres : il faut un coût au-dessus de zéro et une marge en dessous de 100 % du prix.',
      label: (v) => (v.vat > 0 ? 'prix affiché, TVA comprise' : 'prix de vente'),
      verdict: (v, r, F) => `Vendu ${F.money(r.ht)} hors taxe, ton produit te laisse ${F.money(r.marginAmount)} : ${F.pct(v.margin, 0)} du prix, ou ${F.pct(r.markup, 0)} du coût.`,
      chart: 'Ce que contient le prix',
      rows: ['Coût', 'Ta marge', 'TVA, à reverser'],
      facts: (v, r, F) => [
        ['Prix hors taxe', F.money(r.ht)],
        ['Marge en % du coût', F.pct(r.markup, 0)],
        ['Prix affiché ÷ coût', F.nf(r.coefficient, 2)],
      ],
    },
    remise: {
      invalid: 'Vérifie tes chiffres : un prix et une marge au-dessus de zéro, et une remise en dessous de 100 %.',
      never: 'Perte',
      neverLabel: 'sur chaque vente',
      neverVerdict: (v, r, F) => `Avec ${F.pct(v.discount, 0)} de remise, tu vends à ${F.money(r.newPrice)} et tu ${r.after === 0 ? 'ne gagnes plus rien' : `perds ${F.money(-r.after)}`} sur chaque vente : aucun volume ne rattrape ça.`,
      label: "de ventes en plus pour gagner autant qu'avant",
      verdict: (v, r, F) => (v.discount === 0 ? 'Sans remise, rien ne change. Entre un pourcentage pour voir son effet.'
        : `Une remise de ${F.pct(v.discount, 0)} retire ${F.pct(r.lostShare, 0)} de ta marge : tu gagnes ${F.money(r.after)} par vente au lieu de ${F.money(r.before)}. Il faut vendre ${F.pct(r.extra, 0)} de plus pour gagner autant.`),
      rows: ['Marge par vente, avant', 'Marge par vente, après'],
      facts: (v, r, F) => [
        ['Prix après remise', F.money(r.newPrice)],
        ['Part de la marge perdue', F.pct(r.lostShare, 0)],
        ["Ventes pour gagner autant qu'avec 100 ventes", r.extra != null ? F.nf(Math.ceil(100 + r.extra)) : '—'],
      ],
    },
    seuil: {
      invalid: 'Vérifie tes chiffres : il faut un prix de vente au-dessus de zéro.',
      never: 'Jamais',
      neverLabel: 'aucun nombre de ventes ne suffit',
      neverVerdict: (v, r, F) => `Chaque vente te fait perdre ${F.money(-r.margin)} : aucun volume ne rattrape ça. Monte le prix ou baisse le coût par vente.`,
      label: (r) => `vente${r.units > 1 ? 's' : ''} par mois pour être à l'équilibre`,
      verdict: (v, r, F) => `Chaque vente te laisse ${F.money(r.margin)} (${F.pct(r.marginRate)} du prix). Il en faut ${F.nf(r.units)} par mois, soit ${F.money(r.revenue)} de chiffre d'affaires, pour couvrir ${F.money(v.fixed)} de charges fixes.`,
      facts: (v, r, F) => [
        ['Marge par vente', F.money(r.margin)],
        ["Chiffre d'affaires au seuil", F.money(r.revenue)],
        ['Ventes par jour ouvré, environ', F.nf(r.units / 22, 1)],
      ],
      chart: 'Trois scénarios',
      table: ['Ventes par mois', "Chiffre d'affaires", 'Résultat du mois'],
    },
    tunnel: {
      invalid: 'Vérifie tes chiffres : les taux vont de 0 à 100 %, et les montants ne peuvent pas être négatifs.',
      label: (r) => `client${r.customers > 1 ? 's' : ''} par mois`,
      verdict: (v, r, F) => `Sur ${F.nf(v.visitors)} visiteurs, ${F.nf(r.customers, 1)} achètent : ${F.pct(r.rate, 2)}. `
        + (v.signup <= v.purchase ? "L'étape la plus faible : laisser un contact. Améliore-la en premier." : "L'étape la plus faible : l'achat. Améliore-la en premier."),
      rows: ['Visiteurs', 'Contacts', 'Clients'],
      facts: (v, r, F) => [
        ["Chiffre d'affaires par mois", F.money(r.revenue)],
        ["Coût d'un client", r.costPerCustomer != null ? F.money(r.costPerCustomer) : v.spend > 0 ? 'aucun client' : 'rien'],
        v.spend > 0 ? ['Pour 1 € dépensé, tu encaisses', F.money(r.perEuro)] : null,
        v.spend > 0 ? ["Chiffre d'affaires moins dépenses", F.money(r.result)] : null,
      ],
    },
    tirelire: {
      invalid: 'Vérifie tes chiffres : un montant au-dessus de zéro, et des pourcentages entre 0 et 100.',
      label: 'à mettre de côté sur cette facture',
      verdict: (v, r, F) => `Ton client te verse ${F.money(r.ttc)}. Mets ${F.money(r.aside)} de côté : il te reste vraiment ${F.money(r.yours)}, soit ${F.pct(r.yoursShare, 0)} de ce que tu as encaissé.`,
      chart: "Où va l'argent encaissé",
      rows: ['Ce qui est à toi', 'Cotisations et impôts', 'TVA, à reverser'],
      facts: (v, r, F) => [
        ['Encaissé', F.money(r.ttc)],
        ['À mettre de côté', F.money(r.aside)],
        ['Vraiment à toi', F.money(r.yours)],
      ],
    },
    ticket: {
      invalid: "Vérifie tes chiffres : le montant investi ne peut pas dépasser la valorisation à l'entrée, et la durée doit être d'au moins un an.",
      label: 'la mise',
      verdict: (v, r, F) => (r.multiple >= 1
        ? `Dans ce scénario, ${F.money(v.ticket)} deviennent ${F.money(r.proceeds)} en ${v.years} an${v.years > 1 ? 's' : ''} : ${F.pct(r.irr)} par an.`
        : `Dans ce scénario, tu récupères ${F.money(r.proceeds)} sur ${F.money(v.ticket)} investis : une perte de ${F.money(-r.gain)}.`),
      rows: ['Investi', 'Récupéré'],
      facts: (v, r, F) => [
        ["Ta part à l'entrée", F.pct(r.stake, 2)],
        ['Ta part à la sortie', F.pct(r.stakeExit, 2)],
        ['Rendement par an (TRI)', F.pct(r.irr)],
      ],
    },
    valo: {
      invalid: 'Vérifie tes chiffres : il faut une valorisation de sortie et un multiple au-dessus de zéro.',
      label: 'de valorisation maximale après la levée',
      verdict: (v, r, F) => `Pour récupérer ${F.nf(v.multiple, 1)} fois ta mise avec une sortie à ${F.money(v.exit)} et ${F.pct(v.dilution, 0)} de dilution d'ici là, l'entreprise ne doit pas valoir plus de ${F.money(r.post)} après la levée.`,
      facts: (v, r, F) => [
        r.pre != null ? ['Soit, avant ta mise', F.money(r.pre)] : null,
        r.stake != null ? ["Ta part à l'entrée", F.pct(r.stake, 2)] : ['Ta part', v.ticket > 0 ? 'ton montant dépasse cette valorisation' : 'indique un montant pour la connaître'],
      ],
    },
    portefeuille: {
      invalid: "Vérifie tes chiffres : un nombre entier d'entreprises (500 au plus), et deux parts dont la somme ne dépasse pas 100 %.",
      label: "la mise, sur l'ensemble",
      verdict(v, r, F) {
        let t = `Sur ${v.count} entreprise${v.count > 1 ? 's' : ''} : ${r.fails} sans retour, ${r.mids} qui ${r.mids > 1 ? 'rendent' : 'rend'} un peu, ${r.winners} gros succès. En moyenne, avec ces hypothèses, ${F.money(r.invested)} investis rendraient ${F.money(r.proceeds)}.`;
        if (r.win > 0 && r.winners === 0) t += " Avec si peu d'entreprises, tu peux très bien n'avoir aucun gros succès.";
        return t;
      },
      aria: (r) => `${r.fails} sans retour, ${r.mids} qui rendent un peu, ${r.winners} gros succès`,
      legend: ['Ne rend rien', 'Rend un peu', 'Gros succès'],
      facts: (v, r, F) => [
        ['Sans les gros succès', F.times(r.withoutWinners)],
        ['Part des gros succès', F.pct(r.win, 0)],
        ['Gain ou perte', F.money(r.proceeds - r.invested)],
      ],
    },
    suivre: {
      invalid: 'Vérifie tes chiffres : une part entre 0 et 100 %, et une valorisation au-dessus de zéro.',
      label: 'à remettre pour garder ta part',
      verdict: (v, r, F) => (v.raise === 0 ? "Sans levée, ta part ne bouge pas."
        : `Pour rester à ${F.pct(v.stake, 2)}, il faut apporter ${F.money(r.invest)} à cette levée. Si tu ne suis pas, ta part passe à ${F.pct(r.without, 2)}.`),
      rows: ['Ta part si tu suis', 'Ta part si tu ne suis pas'],
      facts: (v, r, F) => [
        ['Valorisation après la levée', F.money(r.post)],
        ['Points perdus sans suivre', F.nf(r.lost, 2)],
        ['Valeur de ta part si tu suis', F.money(r.value)],
      ],
    },
    fonte: {
      invalid: 'Vérifie tes chiffres : une part entre 0 et 100 %, de 1 à 12 levées, et une dilution en dessous de 100 %.',
      label: (v) => `du capital après ${v.rounds} levée${v.rounds > 1 ? 's' : ''}`,
      verdict: (v, r, F) => `Ta part passe de ${F.pct(v.stake, 2)} à ${F.pct(r.final, 2)} : il t'en reste ${F.pct(r.kept, 0)}.`,
      chart: 'Ta part, levée après levée',
      tick: (n) => (n === 0 ? 'Auj.' : 'L' + n),
      bar: (p, F) => (p.round === 0 ? `Aujourd'hui : ${F.pct(p.stake, 2)}` : `Après la levée ${p.round} : ${F.pct(p.stake, 2)}`),
      top: (F, max) => F.pct(max, 2),
      facts: (v, r, F) => [
        ['Part de départ', F.pct(v.stake, 2)],
        ['Part à la fin', F.pct(r.final, 2)],
        ['Ce qui a fondu', F.pct(100 - r.kept, 0)],
      ],
    },
    convertible: {
      invalid: 'Vérifie tes chiffres : il faut un montant, une valorisation au-dessus de zéro et une décote en dessous de 100 %.',
      label: 'du capital pour le porteur, après la levée',
      verdict(v, r, F) {
        if (r.rule === 'cap') return `Le plafond joue : le porteur convertit comme si l'entreprise valait ${F.money(r.effective)}, au lieu de ${F.money(v.pre)}. Pour le même montant, il obtient ${F.nf(r.bonus, 2)} fois la part d'un investisseur du tour.`;
        if (r.rule === 'discount') return `La décote joue : le porteur convertit sur une valorisation de ${F.money(r.effective)}, au lieu de ${F.money(v.pre)}. Pour le même montant, il obtient ${F.nf(r.bonus, 2)} fois la part d'un investisseur du tour.`;
        return 'Ni le plafond ni la décote ne jouent : le porteur convertit au même prix que les investisseurs du tour.';
      },
      parts: ['Associés déjà là', 'Porteur du BSA-AIR', 'Investisseurs du tour'],
      facts: (v, r, F) => [
        ['Valorisation utilisée pour convertir', F.money(r.effective)],
        ['Sa part au prix du tour, sans avantage', F.pct(r.atRound, 2)],
      ],
    },
    cascade: {
      invalid: 'Vérifie tes chiffres : la part des investisseurs va de 0 à 100 %, et la préférence de 0 à 10 fois la mise.',
      label: 'pour les fondateurs et les autres associés',
      verdict(v, r, F) {
        if (v.exit === 0) return "À ce prix, il n'y a rien à partager.";
        if (r.converts) return `À ce prix, la part du capital rapporte plus que la préférence : chacun est payé selon sa part. Les investisseurs touchent ${F.money(r.investors)}, les autres associés ${F.money(r.others)}.`;
        return `Les investisseurs prennent leur préférence : ${F.money(r.investors)}, soit ${F.pct(r.investorsShare)} du prix alors qu'ils ont ${F.pct(v.stake, 1)} du capital. Il reste ${F.money(r.others)} aux autres associés.`;
      },
      rows: ['Investisseurs', 'Autres associés'],
      facts: (v, r, F) => [
        ['Prix seuil', r.threshold > 0 ? F.money(r.threshold) : 'aucun'],
        ['Part du prix pour les investisseurs', F.pct(r.investorsShare)],
        ['Leur part du capital', F.pct(v.stake, 1)],
      ],
    },
    note: {
      invalid: 'Vérifie tes notes : chacune va de 0 à 10.',
      label: 'sur 100',
      criteria: { team: 'Équipe', market: 'Marché', traction: 'Traction', product: 'Produit', terms: 'Conditions' },
      verdict(v, r, F) {
        const weak = this.criteria[r.weakest].toLowerCase();
        const level = r.score >= 75 ? 'Un dossier solide sur cette grille.' : r.score >= 50 ? 'Un dossier moyen sur cette grille.' : 'Un dossier faible sur cette grille.';
        return `${level} Le point le plus faible : ${weak}. C'est la première question à creuser.`;
      },
      points: (p, F) => `${F.nf(p.points, 1)} / ${p.weight}`,
      facts: (v, r, F) => [
        ['Point le plus faible', r.parts.find((p) => p.key === r.weakest).note + ' / 10'],
        ['Points gagnés', `${F.nf(r.score, 1)} / 100`],
      ],
    },
    composes: {
      invalid: "Vérifie tes chiffres : la durée doit être un nombre entier d'années, entre 1 et 60.",
      label: (v) => `au bout de ${v.years} an${v.years > 1 ? 's' : ''}`,
      verdict: (v, r, F) => (r.gain >= 0
        ? `À ce rendement, tu aurais versé ${F.money(r.paid)} et les intérêts auraient ajouté ${F.money(r.gain)}${r.paid > 0 ? `, soit ${F.pct((r.gain / r.paid) * 100, 0)} de plus` : ''}.`
        : `Tu aurais versé ${F.money(r.paid)} ; avec un rendement négatif, il resterait ${F.money(r.value)}.`),
      chart: 'Année après année',
      aria: 'Valeur année par année',
      bar: (p, F) => `Année ${p.year} : ${F.money(p.value)}, dont ${F.money(p.paid)} versés`,
      legend: ['Ce que tu as versé', 'Ce que les intérêts ont ajouté'],
      table: ['Année', 'Versé', 'Valeur'],
      row: (p, F) => [p.year === 0 ? 'Départ' : 'Année ' + p.year, F.money(p.paid), F.money(p.value)],
    },
    cible: {
      invalid: "Vérifie tes chiffres : une somme au-dessus de zéro, et une durée entière entre 1 et 60 ans.",
      label: 'à verser chaque mois',
      verdict(v, r, F) {
        const years = `${v.years} an${v.years > 1 ? 's' : ''}`;
        if (r.enough) return `Ce que tu as déjà suffit : sans rien verser, tu aurais ${F.money(r.grown)} dans ${years}.`;
        return `En versant ${F.money(r.monthly)} par mois pendant ${years}, tu atteindrais ${F.money(v.target)} à ce rendement. Tu aurais versé ${F.money(r.paid)} ; les intérêts feraient le reste : ${F.money(r.interest)}.`;
      },
      rows: ['Ce que tu verses', 'Ce que les intérêts ajoutent'],
      facts: (v, r, F) => [
        ['Versé en tout', F.money(r.paid)],
        ['Apporté par les intérêts', F.money(Math.max(0, r.interest))],
        ['Par an', F.money(r.monthly * 12)],
      ],
    },
    frais: {
      invalid: 'Vérifie tes chiffres : des frais entre 0 et 20 % par an, et une durée entière entre 1 et 60 ans.',
      label: (v) => `d'écart au bout de ${v.years} an${v.years > 1 ? 's' : ''}`,
      verdict: (v, r, F, x) => (r.gap === 0 ? "Mêmes frais, même résultat. Change l'un des deux pour voir l'écart."
        : `Avec ${F.pct(x.lowFee, 2)} de frais par an, tu finirais avec ${F.money(x.low)}. Avec ${F.pct(x.highFee, 2)}, ${F.money(x.high)} : ${F.money(r.gap)} de moins, pour ${F.money(r.paid)} versés.`),
      chart: 'Année après année',
      aria: 'Valeur des deux placements, année par année',
      bar: (p, F) => `Année ${p.year} : A ${F.money(p.a)}, B ${F.money(p.b)}`,
      legend: (x) => [`Placement ${x.highName}, le plus cher`, `Ce que le placement ${x.lowName} laisse en plus`],
      facts: (v, r, F) => [
        ['Sans aucun frais', F.money(r.free)],
        ['Coût des frais du placement A', F.money(r.costA)],
        ['Coût des frais du placement B', F.money(r.costB)],
      ],
      table: ['Année', 'Placement A', 'Placement B'],
      row: (p, F) => [p.year === 0 ? 'Départ' : 'Année ' + p.year, F.money(p.a), F.money(p.b)],
    },
    inflation: {
      invalid: 'Vérifie tes chiffres : une somme au-dessus de zéro, et une durée entière entre 1 et 60 ans.',
      label: (v) => `de pouvoir d'achat dans ${v.years} an${v.years > 1 ? 's' : ''}`,
      verdict(v, r, F) {
        const years = `${v.years} an${v.years > 1 ? 's' : ''}`;
        return v.rate === 0
          ? `Dans ${years}, tes ${F.money(v.amount)} afficheront toujours ${F.money(r.nominal)}, mais n'achèteront plus que ce qu'achètent ${F.money(r.real)} aujourd'hui${r.lost > 0 ? ` : ${F.pct(r.lost)} de pouvoir d'achat en moins` : ''}.`
          : `Dans ${years}, ton placement affichera ${F.money(r.nominal)}. Une fois la hausse des prix retirée, cela vaut ${F.money(r.real)} d'aujourd'hui : un rendement réel de ${F.pct(r.realRate, 2)} par an.`;
      },
      chart: 'Ce que la somme vaut vraiment, année après année',
      bar: (p, F) => `Année ${p.year} : ${F.money(p.real)} d'aujourd'hui`,
      facts: (v, r, F) => [
        ['Somme affichée à la fin', F.money(r.nominal)],
        ['Rendement réel par an', F.pct(r.realRate, 2)],
        ["Pouvoir d'achat", r.lost > 0 ? `${F.pct(r.lost)} en moins` : `${F.pct(-r.lost)} en plus`],
      ],
      table: ['Année', 'Somme affichée', "Valeur d'aujourd'hui"],
      row: (p, F) => [p.year === 0 ? "Aujourd'hui" : 'Année ' + p.year, F.money(p.nominal), F.money(p.real)],
    },
    reserve: {
      invalid: 'Vérifie tes chiffres : un capital et un retrait au-dessus de zéro.',
      forever: 'Sans fin',
      foreverLabel: 'le capital ne se vide pas',
      label: (r) => `an${r.years >= 2 ? 's' : ''} avant que le capital soit vide`,
      verdict(v, r, F) {
        if (r.forever) return `Tu retires ${F.money(v.monthly)} par mois, et le capital rapporte environ ${F.money(r.sustainable)} par mois : il ne se viderait pas, à ce rendement.`;
        return `En retirant ${F.money(v.monthly)} par mois, le capital serait vide au bout de ${F.nf(r.years, 1)} an${r.years >= 2 ? 's' : ''}. Tu aurais retiré ${F.money(r.total)} en tout, pour ${F.money(v.capital)} au départ.`;
      },
      chart: 'Le capital, année après année',
      bar: (p, F) => `Année ${p.year} : ${F.money(p.value)}`,
      facts: (v, r, F) => [
        ['Ce que le capital rapporte par mois, au départ', F.money(r.sustainable)],
        ['Retiré en tout', r.total != null ? F.money(r.total) : '—'],
        ['Mois de retrait', r.months != null ? F.nf(r.months) : '—'],
      ],
    },
    coussin: {
      invalid: 'Vérifie tes chiffres : des dépenses au-dessus de zéro, et de 1 à 60 mois à couvrir.',
      label: 'à avoir de côté',
      verdict(v, r, F) {
        if (r.missing === 0) return `Ton matelas est complet : tu as de quoi tenir ${F.nf(r.covered, 1)} mois.`;
        let t = `Tu as de quoi tenir ${F.nf(r.covered, 1)} mois. Il te manque ${F.money(r.missing)}.`;
        t += r.wait != null ? ` En mettant ${F.money(v.monthly)} de côté par mois, tu y es dans ${r.wait} mois.` : ' Indique ce que tu peux épargner chaque mois pour savoir quand tu y seras.';
        return t;
      },
      aria: (r, F) => `${F.pct(r.progress, 0)} de l'objectif`,
      facts: (v, r, F) => [
        ['Déjà couvert', `${F.nf(r.covered, 1)} mois`],
        ['Il manque', F.money(r.missing)],
        ["Mois avant d'y être", r.wait === 0 ? 'atteint' : r.wait != null ? String(r.wait) : '—'],
      ],
    },
  },
};
