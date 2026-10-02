// Répondeur IA — le moteur de la démonstration.
//
// La démo de la page de présentation tourne entièrement dans le navigateur,
// avec des commerces fictifs et des réponses préparées. Elle montre le genre
// d'échange qu'un répondeur réglé pour un commerce peut tenir : horaires,
// prix, réservations. Fonctions pures, sans DOM : tout se teste avec Node.

const H = (h, m = 0) => h * 60 + m;
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/* Commerces fictifs. `hours` : pour chaque jour (0 = dimanche), les
   créneaux d'ouverture en minutes depuis minuit. */
export const SHOPS = [
  {
    id: 'restaurant', type: 'Restaurant', name: 'Le Petit Quai', of: 'du Petit Quai', article: 'le restaurant',
    hours: [[[H(12), H(15)]], [], [[H(12), H(14, 30)], [H(18, 30), H(22, 30)]], [[H(12), H(14, 30)], [H(18, 30), H(22, 30)]],
      [[H(12), H(14, 30)], [H(18, 30), H(22, 30)]], [[H(12), H(14, 30)], [H(18, 30), H(22, 30)]], [[H(12), H(14, 30)], [H(18, 30), H(22, 30)]]],
    prices: 'Le plat du jour est à 14 €, le menu trois services à 32 € et le menu enfant à 9 €.',
    booking: 'Vous pouvez réserver en ligne depuis la page du restaurant, ou par téléphone pendant le service. Pour plus de 8 personnes, appelez-nous : on prépare une table à part.',
    place: 'Nous sommes sur le quai, à deux minutes à pied de la place du marché. Un parking gratuit se trouve juste derrière.',
    payment: 'Nous acceptons la carte, Bancontact et les espèces.',
    extras: [
      { keys: ['vegetarien', 'vegan', 'vegetalien', 'sans viande'], text: 'Oui : il y a toujours deux plats végétariens à la carte, dont un végétalien.' },
      { keys: ['allergene', 'allergie', 'gluten', 'lactose'], text: 'La liste des allergènes est disponible sur demande, et la cuisine peut adapter la plupart des plats sans gluten.' },
      { keys: ['terrasse', 'dehors', 'exterieur'], text: 'Oui, la terrasse au bord de l\'eau est ouverte dès qu\'il fait beau.' },
      { keys: ['emporter', 'livraison', 'livrez'], text: 'Nous faisons des plats à emporter, à commander sur place ou par téléphone. Nous ne livrons pas.' },
    ],
    questions: ['Êtes-vous ouverts dimanche ?', 'Combien coûte le menu ?', 'Comment réserver une table ?', 'Avez-vous des plats végétariens ?'],
  },
  {
    id: 'salon', type: 'Salon de coiffure', name: 'Salon Maëlle', of: 'du Salon Maëlle', article: 'le salon',
    hours: [[], [], [[H(9), H(18, 30)]], [[H(9), H(18, 30)]], [[H(9), H(18, 30)]], [[H(9), H(18, 30)]], [[H(9), H(17)]]],
    prices: 'La coupe femme est à 38 €, la coupe homme à 22 €, la coupe enfant à 16 €. Le brushing est à 25 € et la couleur commence à 55 €.',
    booking: 'Le rendez-vous se prend en ligne depuis la page du salon, ou sur place. Le mardi matin, nous prenons aussi sans rendez-vous.',
    place: 'Le salon est dans la rue commerçante, en face de la pharmacie. On peut se garer sur la place, à une minute.',
    payment: 'Nous acceptons la carte, Bancontact et les espèces.',
    extras: [
      { keys: ['couleur', 'coloration', 'meche', 'balayage'], text: 'La couleur commence à 55 € et le balayage à 75 €. Pour une première couleur, comptez deux heures.' },
      { keys: ['barbe'], text: 'Oui, la taille de barbe est à 12 €, ou 30 € avec la coupe.' },
      { keys: ['enfant', 'fils', 'fille', 'bebe'], text: 'Oui, nous coiffons les enfants : la coupe est à 16 € jusqu\'à 12 ans.' },
      { keys: ['sans rendez', 'sans rdv'], text: 'Sans rendez-vous, c\'est possible le mardi matin. Les autres jours, il vaut mieux réserver.' },
    ],
    questions: ['Quels sont vos horaires ?', 'Combien coûte une coupe ?', 'Comment prendre rendez-vous ?', 'Vous coiffez les enfants ?'],
  },
  {
    id: 'sport', type: 'Salle de sport', name: 'Studio Forme', of: 'du Studio Forme', article: 'la salle',
    hours: [[[H(8), H(18)]], [[H(6, 30), H(22)]], [[H(6, 30), H(22)]], [[H(6, 30), H(22)]], [[H(6, 30), H(22)]], [[H(6, 30), H(22)]], [[H(8), H(18)]]],
    prices: 'L\'abonnement est à 34 € par mois, sans engagement, cours collectifs compris. Une séance avec un coach est à 35 €.',
    booking: 'L\'inscription se fait à l\'accueil ou en ligne, en cinq minutes. Les cours collectifs se réservent depuis votre espace membre.',
    place: 'La salle est à côté de la gare, avec un parking gratuit pour les membres et un abri à vélos.',
    payment: 'L\'abonnement se paie par domiciliation ; à l\'accueil, nous acceptons la carte et Bancontact.',
    extras: [
      { keys: ['essai', 'essayer', 'tester', 'decouverte'], text: 'Oui : la première séance d\'essai est gratuite. Passez à l\'accueil avec une pièce d\'identité.' },
      { keys: ['cours', 'yoga', 'pilates', 'collectif'], text: 'Il y a des cours collectifs tous les jours : yoga, pilates, renforcement et vélo. Ils sont compris dans l\'abonnement.' },
      { keys: ['engagement', 'resilier', 'arreter', 'annuler'], text: 'L\'abonnement est sans engagement : vous pouvez l\'arrêter à la fin de chaque mois.' },
      { keys: ['douche', 'vestiaire', 'casier'], text: 'Oui, il y a des vestiaires avec douches et des casiers. Pensez à apporter un cadenas.' },
    ],
    questions: ['À quelle heure fermez-vous ce soir ?', 'Combien coûte l\'abonnement ?', 'Peut-on faire une séance d\'essai ?', 'Comment s\'inscrire ?'],
  },
  {
    id: 'institut', type: 'Institut de beauté', name: 'Institut Capucine', of: 'de l\'Institut Capucine', article: 'l\'institut',
    hours: [[], [], [[H(9, 30), H(18, 30)]], [[H(9, 30), H(18, 30)]], [[H(9, 30), H(20)]], [[H(9, 30), H(18, 30)]], [[H(9, 30), H(17)]]],
    prices: 'Le soin du visage est à 60 €, la manucure à 30 € et les épilations commencent à 12 €.',
    booking: 'Le rendez-vous se prend en ligne depuis la page de l\'institut, ou par téléphone pendant les heures d\'ouverture.',
    place: 'L\'institut est au premier étage, au-dessus de la librairie, avec un ascenseur. Parking payant en face.',
    payment: 'Nous acceptons la carte, Bancontact, les espèces et les chèques-cadeaux de l\'institut.',
    extras: [
      { keys: ['cadeau', 'offrir'], text: 'Oui, nous faisons des bons cadeaux, du montant de votre choix, valables un an.' },
      { keys: ['epilation', 'cire'], text: 'Les épilations commencent à 12 € (sourcils) ; les demi-jambes sont à 24 €.' },
      { keys: ['massage'], text: 'Le massage relaxant d\'une heure est à 65 €.' },
      { keys: ['homme', 'monsieur', 'mari'], text: 'Oui, les soins du visage et les épilations sont aussi proposés aux hommes.' },
    ],
    questions: ['Êtes-vous ouverts le lundi ?', 'Combien coûte un soin du visage ?', 'Comment prendre rendez-vous ?', 'Faites-vous des bons cadeaux ?'],
  },
];

/* « Végétarien ? » → « vegetarien » : sans accent, sans majuscule. */
export const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const hm = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
};
const slotsText = (slots) => slots.map(([a, b]) => `de ${hm(a)} à ${hm(b)}`).join(' et ');

/* Le commerce est-il ouvert à cette date ? */
export function isOpen(shop, date) {
  const now = date.getHours() * 60 + date.getMinutes();
  return shop.hours[date.getDay()].some(([a, b]) => now >= a && now < b);
}

/* Prochaine ouverture : « aujourd'hui à 18 h 30 », « demain à 9 h », « mardi à 12 h ». */
export function nextOpening(shop, date) {
  const now = date.getHours() * 60 + date.getMinutes();
  for (let i = 0; i < 8; i++) {
    const day = (date.getDay() + i) % 7;
    const slot = shop.hours[day].find(([a]) => i > 0 || a > now);
    if (!slot) continue;
    const when = i === 0 ? 'aujourd\'hui' : i === 1 ? 'demain' : DAYS[day];
    return `${when} à ${hm(slot[0])}`;
  }
  return null;
}

/* Les horaires de la semaine, jours identiques regroupés. */
export function weekText(shop) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const groups = [];
  for (const d of order) {
    const key = JSON.stringify(shop.hours[d]);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.days.push(d);
    else groups.push({ key, days: [d] });
  }
  return groups.map(({ days, key }) => {
    const label = days.length === 1 ? DAYS[days[0]] : days.length === 2 ? `${DAYS[days[0]]} et ${DAYS[days[1]]}`
      : `du ${DAYS[days[0]]} au ${DAYS[days[days.length - 1]]}`;
    const slots = JSON.parse(key);
    return slots.length ? `${label} ${slotsText(slots)}` : `${label} : fermé`;
  }).join(' ; ') + '.';
}

function hoursAnswer(shop, q, date) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  let day = DAYS.findIndex((d) => q.includes(d));
  let label = day >= 0 ? `le ${DAYS[day]}` : null;
  if (day < 0 && /\bdemain\b/.test(q)) { day = (date.getDay() + 1) % 7; label = 'demain'; }
  if (day < 0 && /(aujourd|ce soir|ce midi|maintenant|la tout de suite|en ce moment)/.test(q)) { day = date.getDay(); label = 'aujourd\'hui'; }
  if (day < 0) return `Voici nos horaires : ${weekText(shop)}`;
  const slots = shop.hours[day];
  if (label === 'aujourd\'hui') {
    if (isOpen(shop, date)) {
      const now = date.getHours() * 60 + date.getMinutes();
      const slot = slots.find(([a, b]) => now >= a && now < b);
      return `Oui, nous sommes ouverts en ce moment, jusqu'à ${hm(slot[1])}.`;
    }
    const next = nextOpening(shop, date);
    const now = date.getHours() * 60 + date.getMinutes();
    if (!slots.length) return `Nous sommes fermés aujourd'hui. Prochaine ouverture : ${next}.`;
    // Après la dernière fermeture du jour, on le dit plutôt que de réciter les horaires.
    const lastClose = slots[slots.length - 1][1];
    if (now >= lastClose) return `Nous avons fermé à ${hm(lastClose)}. Prochaine ouverture : ${next}.`;
    return `Nous sommes fermés en ce moment. Aujourd'hui, nous ouvrons ${slotsText(slots)} : prochaine ouverture ${next}.`;
  }
  return slots.length ? `${cap(label)}, nous sommes ouverts ${slotsText(slots)}.` : `${cap(label)}, nous sommes fermés. Voici nos horaires : ${weekText(shop)}`;
}

const INTENTS = [
  { topic: 'reservation', re: /(reserv|rendez|rdv|inscri|\btable\b|booking)/ },
  { topic: 'horaires', re: /(horaire|ouvert|ouvre|ouvrez|ferme|fermez|fermeture|quelle heure|dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi|ce soir|aujourd|demain)/ },
  { topic: 'prix', re: /(prix|tarif|combien|coute|cout\b|\bcher\b|abonnement|\bmenu\b)/ },
  { topic: 'paiement', re: /(carte|payer|paiement|espece|liquide|bancontact|cheque)/ },
  { topic: 'adresse', re: /(adresse|\bou (etes|est|sont|se trouve|se situe|vous trouv)|(etes|trouvez|situez) vous ou\b|vous etes ou\b|c est ou\b|situe|parking|garer|comment venir|acces)/ },
];

/*
  La réponse du répondeur à une question, pour un commerce et une date.
  Renvoie { text, topic } ; `topic` vaut « inconnu » quand la question sort
  de ce que le commerce a préparé : le répondeur le dit, il n'invente rien.
*/
export function answer(shop, question, date = new Date()) {
  const q = fold(question).replace(/['’]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!q) return { topic: 'vide', text: 'Posez-moi votre question : horaires, prix, réservation…' };

  // Les précisions propres au commerce passent avant les réponses générales.
  for (const extra of shop.extras) {
    if (extra.keys.some((k) => q.includes(k))) return { topic: 'precision', text: extra.text };
  }
  for (const intent of INTENTS) {
    if (!intent.re.test(q)) continue;
    if (intent.topic === 'horaires') return { topic: 'horaires', text: hoursAnswer(shop, q, date) };
    if (intent.topic === 'reservation') return { topic: 'reservation', text: shop.booking };
    if (intent.topic === 'prix') return { topic: 'prix', text: shop.prices };
    if (intent.topic === 'paiement') return { topic: 'paiement', text: shop.payment };
    if (intent.topic === 'adresse') return { topic: 'adresse', text: shop.place };
  }
  if (/^(bonjour|bonsoir|salut|hello|coucou)\b/.test(q)) {
    return { topic: 'salut', text: `Bonjour ! Je réponds aux questions sur ${shop.name} : horaires, prix, réservation. Que voulez-vous savoir ?` };
  }
  if (/(merci|super|parfait|top|genial)/.test(q)) return { topic: 'merci', text: 'Avec plaisir. À bientôt !' };

  const next = nextOpening(shop, date);
  return {
    topic: 'inconnu',
    text: `Je n'ai pas cette information, et je préfère ne pas vous dire de bêtise. Le plus sûr est de poser la question directement à l'équipe`
      + (isOpen(shop, date) ? ', qui est là en ce moment.' : next ? ` : ${shop.article} rouvre ${next}.` : '.'),
  };
}

/* Le message d'accueil, selon l'heure. */
export function greeting(shop, date = new Date()) {
  const open = isOpen(shop, date);
  const next = nextOpening(shop, date);
  return `Bonjour ! Je suis le répondeur ${shop.of}. `
    + (open ? 'Nous sommes ouverts en ce moment. ' : `Nous sommes fermés pour l'instant${next ? ` (réouverture ${next})` : ''}, mais je peux vous répondre. `)
    + 'Que voulez-vous savoir ?';
}
