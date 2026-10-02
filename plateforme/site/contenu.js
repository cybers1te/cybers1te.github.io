// marketbuss — la structure du site : joueurs, guides, bornes, parcours.
//
// Aucun texte ici : les mots sont dans lang/fr.js, lang/en.js et lang/nl.js,
// rangés sous les mêmes identifiants. Les valeurs de départ des bornes sont
// des exemples inventés ; elles ne décrivent aucune entreprise réelle.

/* Les quatre joueurs. `letter` : leur lettre dans le lexique. */
export const ROLES = {
  entrepreneur: { id: 'entrepreneur', sprite: 'founder', color: 'p1', letter: 'e' },
  independant: { id: 'independant', sprite: 'freelance', color: 'p3', letter: 'd' },
  investisseur: { id: 'investisseur', sprite: 'investor', color: 'p2', letter: 'i' },
  epargnant: { id: 'epargnant', sprite: 'saver', color: 'p4', letter: 's' },
  immobilier: { id: 'immobilier', sprite: 'owner', color: 'p5', letter: 'm' },
  ecommerce: { id: 'ecommerce', sprite: 'merchant', color: 'p6', letter: 'c' },
  budget: { id: 'budget', sprite: 'household', color: 'p7', letter: 'b' },
};

/* Les guides : des personnages inventés, qui donnent un conseil sur chaque borne. */
export const GUIDES = {
  mentor: { sprite: 'mentor' },
  accountant: { sprite: 'accountant' },
  dev: { sprite: 'dev' },
  designer: { sprite: 'designer' },
  client: { sprite: 'client' },
  banker: { sprite: 'banker' },
  angel: { sprite: 'angel' },
  robot: { sprite: 'robot' },
  agent: { sprite: 'agent' },
  shopkeeper: { sprite: 'shopkeeper' },
};

// Un champ : clé, valeur de départ (un exemple), pas, minimum, maximum.
const f = (key, value, step, min, max) => ({ key, value, step, min, max });

/*
  Les bornes, dans l'ordre d'affichage. `kind` : calc (calculateur),
  checklist (liste à cocher, `size` points), writer (pitch en une phrase),
  canvas (lean canvas). `arsenal` : les rayons de l'arsenal qui vont avec.
*/
export const TOOLS = [
  // ----- Entrepreneur -----
  { id: 'runway', role: 'entrepreneur', sprite: 'heart', kind: 'calc', guide: 'banker', arsenal: ['banque', 'compta'],
    fields: [f('cash', 60000, 1000, 0), f('burn', 9000, 500, 0), f('revenue', 3000, 500, 0), f('growth', 4, 1, -99, 200)] },
  { id: 'lever', role: 'entrepreneur', sprite: 'bag', kind: 'calc', guide: 'mentor', arsenal: ['captable', 'dossier'],
    fields: [f('burn', 25000, 1000, 0), f('revenue', 5000, 500, 0), f('months', 18, 1, 1, 120), f('buffer', 20, 5, 0, 500), f('pre', 2000000, 100000, 0)] },
  { id: 'dilution', role: 'entrepreneur', sprite: 'pie', kind: 'calc', guide: 'angel', arsenal: ['captable'],
    fields: [f('pre', 2000000, 100000, 1), f('raise', 500000, 50000, 0), f('pool', 10, 1, 0, 50), f('founders', 100, 1, 0, 100)] },
  { id: 'vesting', role: 'entrepreneur', sprite: 'hourglass', kind: 'calc', guide: 'mentor', arsenal: ['captable'],
    fields: [f('stake', 25, 1, 0.1, 100), f('years', 4, 1, 1, 20), f('cliff', 12, 1, 0, 240), f('elapsed', 18, 1, 0)] },
  { id: 'marche', role: 'entrepreneur', sprite: 'globe', kind: 'calc', guide: 'mentor', arsenal: ['donnees', 'sondages'],
    fields: [f('customers', 200000, 1000, 1), f('price', 600, 10, 0.01), f('reachable', 20, 1, 0, 100), f('share', 5, 1, 0, 100)] },
  { id: 'client', role: 'entrepreneur', sprite: 'target', kind: 'calc', guide: 'client', arsenal: ['crm', 'mesurer'],
    fields: [f('spend', 4000, 100, 0), f('customers', 40, 1, 1), f('arpu', 39, 1, 0.01), f('margin', 80, 1, 1, 100), f('churn', 4, 0.5, 0.1, 100)] },
  { id: 'objectif', role: 'entrepreneur', sprite: 'star', kind: 'calc', guide: 'client', arsenal: ['crm', 'emails'],
    fields: [f('target', 10000, 500, 1), f('price', 50, 1, 0.01), f('current', 40, 1, 0), f('churn', 3, 0.5, 0, 99), f('months', 12, 1, 1, 120)] },
  { id: 'croissance', role: 'entrepreneur', sprite: 'bolt', kind: 'calc', guide: 'dev', arsenal: ['mesurer'],
    fields: [f('from', 2000, 100, 0.01), f('to', 10000, 500, 0.01), f('months', 12, 1, 1, 600)] },
  { id: 'canvas', role: 'entrepreneur', sprite: 'board', kind: 'canvas', guide: 'dev', arsenal: ['sondages', 'construire'] },
  { id: 'phrase', role: 'entrepreneur', sprite: 'bubble', kind: 'writer', guide: 'client', arsenal: ['presenter', 'ia'] },
  { id: 'deck', role: 'entrepreneur', sprite: 'card', kind: 'checklist', list: 'deck', size: 10, guide: 'designer', arsenal: ['presenter', 'dossier'] },

  // ----- Indépendant -----
  { id: 'tarif', role: 'independant', sprite: 'clock', kind: 'calc', guide: 'accountant', arsenal: ['compta', 'banque'],
    fields: [f('net', 2500, 100, 1), f('days', 14, 1, 1, 31), f('weeks', 6, 1, 0, 51), f('charges', 40, 1, 0, 99), f('costs', 300, 50, 0)] },
  { id: 'devis', role: 'independant', sprite: 'invoice', kind: 'calc', guide: 'accountant', arsenal: ['compta', 'paiements'],
    fields: [f('days', 8, 0.5, 0.5), f('rate', 400, 10, 1), f('buffer', 15, 5, 0, 500), f('expenses', 120, 10, 0), f('vat', 21, 1, 0, 100), f('deposit', 30, 5, 0, 100)] },
  { id: 'prix', role: 'independant', sprite: 'tag', kind: 'calc', guide: 'accountant', arsenal: ['paiements', 'boutique'],
    fields: [f('cost', 12, 0.5, 0.01), f('margin', 60, 1, 0, 99), f('vat', 21, 1, 0, 100)] },
  { id: 'remise', role: 'independant', sprite: 'scissors', kind: 'calc', guide: 'client', arsenal: ['boutique', 'emails'],
    fields: [f('price', 50, 1, 0.01), f('margin', 40, 1, 1, 100), f('discount', 10, 1, 0, 99)] },
  { id: 'seuil', role: 'independant', sprite: 'flag', kind: 'calc', guide: 'banker', arsenal: ['compta'],
    fields: [f('price', 49, 1, 0.01), f('variable', 12, 1, 0), f('fixed', 3500, 100, 0)] },
  { id: 'tunnel', role: 'independant', sprite: 'funnel', kind: 'calc', guide: 'designer', arsenal: ['mesurer', 'emails'],
    fields: [f('visitors', 5000, 100, 0), f('signup', 4, 0.5, 0, 100), f('purchase', 20, 1, 0, 100), f('basket', 60, 1, 0), f('spend', 1500, 100, 0)] },
  { id: 'tirelire', role: 'independant', sprite: 'piggy', kind: 'calc', guide: 'accountant', arsenal: ['banque', 'compta'],
    fields: [f('amount', 2000, 100, 1), f('vat', 21, 1, 0, 100), f('charges', 40, 1, 0, 100)] },
  { id: 'lancement', role: 'independant', sprite: 'clip', kind: 'checklist', list: 'lancement', size: 10, guide: 'accountant', arsenal: ['aides', 'compta', 'banque'] },

  // ----- Investisseur -----
  { id: 'ticket', role: 'investisseur', sprite: 'coin', kind: 'calc', guide: 'angel', arsenal: ['donnees', 'verifier'],
    fields: [f('ticket', 25000, 1000, 1), f('post', 2500000, 100000, 1), f('dilution', 50, 5, 0, 99), f('exit', 40000000, 1000000, 0), f('years', 7, 1, 1, 30)] },
  { id: 'valo', role: 'investisseur', sprite: 'gem', kind: 'calc', guide: 'angel', arsenal: ['donnees'],
    fields: [f('exit', 50000000, 1000000, 1), f('multiple', 10, 1, 0.1), f('dilution', 50, 5, 0, 99), f('ticket', 50000, 5000, 0)] },
  { id: 'portefeuille', role: 'investisseur', sprite: 'dice', kind: 'calc', guide: 'angel', arsenal: ['donnees', 'verifier'],
    fields: [f('count', 20, 1, 1, 500), f('ticket', 5000, 500, 1), f('fail', 70, 5, 0, 100), f('mid', 25, 5, 0, 100), f('midMultiple', 1.5, 0.5, 0), f('winMultiple', 20, 1, 0)] },
  { id: 'suivre', role: 'investisseur', sprite: 'up', kind: 'calc', guide: 'angel', arsenal: ['captable'],
    fields: [f('stake', 2, 0.5, 0.01, 100), f('pre', 8000000, 500000, 1), f('raise', 2000000, 100000, 0)] },
  { id: 'fonte', role: 'investisseur', sprite: 'ice', kind: 'calc', guide: 'mentor', arsenal: ['captable'],
    fields: [f('stake', 10, 1, 0.01, 100), f('rounds', 3, 1, 1, 12), f('dilution', 20, 1, 0, 99)] },
  { id: 'convertible', role: 'investisseur', sprite: 'scroll', kind: 'calc', guide: 'mentor', arsenal: ['captable'],
    fields: [f('amount', 100000, 5000, 1), f('cap', 3000000, 100000, 0), f('discount', 20, 5, 0, 99), f('pre', 5000000, 100000, 1), f('raise', 1000000, 100000, 0)] },
  { id: 'cascade', role: 'investisseur', sprite: 'cascade', kind: 'calc', guide: 'mentor', arsenal: ['captable'],
    fields: [f('exit', 4000000, 500000, 0), f('invested', 2000000, 100000, 0), f('stake', 25, 1, 0.1, 100), f('multiple', 1, 0.5, 0, 10)] },
  { id: 'note', role: 'investisseur', sprite: 'book', kind: 'calc', guide: 'banker', arsenal: ['verifier', 'donnees'],
    fields: [f('team', 7, 1, 0, 10), f('market', 6, 1, 0, 10), f('traction', 4, 1, 0, 10), f('product', 7, 1, 0, 10), f('terms', 5, 1, 0, 10)] },
  { id: 'diligence', role: 'investisseur', sprite: 'lens', kind: 'checklist', list: 'diligence', size: 12, guide: 'banker', arsenal: ['verifier', 'arnaques'] },

  // ----- Épargnant -----
  { id: 'composes', role: 'epargnant', sprite: 'chart', kind: 'calc', guide: 'robot', arsenal: ['marches'],
    fields: [f('initial', 1000, 100, 0), f('monthly', 100, 10, 0), f('rate', 6, 0.5, -50, 50), f('years', 20, 1, 1, 60)] },
  { id: 'cible', role: 'epargnant', sprite: 'medal', kind: 'calc', guide: 'robot', arsenal: ['marches'],
    fields: [f('target', 20000, 1000, 1), f('years', 10, 1, 1, 60), f('rate', 4, 0.5, -50, 50), f('initial', 1000, 100, 0)] },
  { id: 'frais', role: 'epargnant', sprite: 'percent', kind: 'calc', guide: 'robot', arsenal: ['marches'],
    fields: [f('initial', 1000, 100, 0), f('monthly', 100, 10, 0), f('rate', 6, 0.5, -50, 50), f('feeA', 0.3, 0.1, 0, 20), f('feeB', 2, 0.1, 0, 20), f('years', 30, 1, 1, 60)] },
  { id: 'inflation', role: 'epargnant', sprite: 'balloon', kind: 'calc', guide: 'banker', arsenal: ['marches'],
    fields: [f('amount', 10000, 500, 1), f('inflation', 2, 0.5, -10, 100), f('years', 20, 1, 1, 60), f('rate', 0, 0.5, -50, 100)] },
  { id: 'reserve', role: 'epargnant', sprite: 'drop', kind: 'calc', guide: 'banker', arsenal: ['marches'],
    fields: [f('capital', 100000, 5000, 1), f('monthly', 500, 50, 1), f('rate', 3, 0.5, -50, 50)] },
  { id: 'coussin', role: 'epargnant', sprite: 'umbrella', kind: 'calc', guide: 'banker', arsenal: ['banque'],
    fields: [f('expenses', 1500, 50, 1), f('months', 4, 1, 1, 60), f('saved', 1000, 100, 0), f('monthly', 200, 10, 0)] },
  { id: 'avant', role: 'epargnant', sprite: 'shield', kind: 'checklist', list: 'avant', size: 10, guide: 'robot', arsenal: ['arnaques', 'marches'] },

  // ----- Immobilier -----
  { id: 'credit', role: 'immobilier', sprite: 'key', kind: 'calc', guide: 'banker', arsenal: ['banque', 'verifier'],
    fields: [f('amount', 200000, 5000, 1), f('rate', 3.5, 0.1, 0, 30), f('years', 20, 1, 1, 40), f('insurance', 0.3, 0.05, 0, 5)] },
  { id: 'capacite', role: 'immobilier', sprite: 'bank', kind: 'calc', guide: 'banker', arsenal: ['banque'],
    fields: [f('income', 4000, 100, 1), f('debts', 200, 50, 0), f('ratio', 35, 1, 1, 100), f('rate', 3.5, 0.1, 0, 30), f('years', 25, 1, 1, 40)] },
  { id: 'rendement', role: 'immobilier', sprite: 'house', kind: 'calc', guide: 'agent', arsenal: ['verifier'],
    fields: [f('price', 200000, 5000, 1), f('costs', 20000, 1000, 0), f('rent', 900, 25, 0), f('charges', 2000, 100, 0), f('vacancy', 1, 0.5, 0, 12)] },
  { id: 'cashflow', role: 'immobilier', sprite: 'drop', kind: 'calc', guide: 'agent', arsenal: ['banque', 'compta'],
    fields: [f('rent', 900, 25, 0), f('vacancy', 5, 1, 0, 100), f('charges', 180, 10, 0), f('loan', 750, 25, 0), f('works', 5, 1, 0, 100)] },
  { id: 'louer', role: 'immobilier', sprite: 'scale', kind: 'calc', guide: 'agent', arsenal: ['banque', 'marches'],
    fields: [f('price', 300000, 10000, 1), f('buyCosts', 8, 0.5, 0, 30), f('deposit', 60000, 5000, 0), f('rate', 3.5, 0.1, 0, 30), f('years', 25, 1, 1, 40),
      f('rent', 1100, 50, 0), f('growth', 2, 0.5, -20, 20), f('invest', 5, 0.5, -50, 50), f('horizon', 15, 1, 1, 40)] },
  { id: 'visite', role: 'immobilier', sprite: 'lens', kind: 'checklist', list: 'visite', size: 10, guide: 'agent', arsenal: ['verifier', 'arnaques'] },

  // ----- E-commerce -----
  { id: 'pub', role: 'ecommerce', sprite: 'megaphone', kind: 'calc', guide: 'shopkeeper', arsenal: ['mesurer', 'boutique'],
    fields: [f('basket', 50, 1, 0.01), f('cogs', 15, 1, 0), f('shipping', 5, 0.5, 0), f('fees', 2, 0.5, 0, 100), f('spend', 1000, 100, 0), f('orders', 40, 1, 0)] },
  { id: 'livraison', role: 'ecommerce', sprite: 'truck', kind: 'calc', guide: 'shopkeeper', arsenal: ['boutique', 'paiements'],
    fields: [f('basket', 40, 1, 0.01), f('margin', 50, 1, 1, 100), f('shipping', 6, 0.5, 0), f('orders', 300, 10, 0)] },
  { id: 'stock', role: 'ecommerce', sprite: 'box', kind: 'calc', guide: 'dev', arsenal: ['organiser', 'boutique'],
    fields: [f('daily', 4, 1, 0.1), f('lead', 10, 1, 0), f('safety', 5, 1, 0), f('stock', 100, 10, 0), f('cost', 8, 1, 0)] },
  { id: 'retours', role: 'ecommerce', sprite: 'return', kind: 'calc', guide: 'client', arsenal: ['boutique', 'crm'],
    fields: [f('orders', 300, 10, 0), f('rate', 15, 1, 0, 100), f('basket', 60, 1, 0.01), f('cogs', 20, 1, 0), f('back', 6, 0.5, 0), f('lost', 20, 5, 0, 100)] },
  { id: 'marketplace', role: 'ecommerce', sprite: 'cart', kind: 'calc', guide: 'shopkeeper', arsenal: ['boutique', 'paiements'],
    fields: [f('price', 40, 1, 0.01), f('cogs', 12, 1, 0), f('commission', 15, 1, 0, 100), f('fixedFee', 1, 0.5, 0), f('siteFees', 2, 0.5, 0, 100), f('siteAds', 6, 0.5, 0)] },
  { id: 'boutique', role: 'ecommerce', sprite: 'shop', kind: 'checklist', list: 'boutique', size: 10, guide: 'shopkeeper', arsenal: ['boutique', 'paiements', 'compta'] },

  // ----- Budget -----
  { id: 'budget', role: 'budget', sprite: 'wallet', kind: 'calc', guide: 'banker', arsenal: ['banque'],
    fields: [f('income', 2200, 50, 1), f('needs', 1200, 50, 0), f('wants', 650, 50, 0)] },
  { id: 'dette', role: 'budget', sprite: 'creditcard', kind: 'calc', guide: 'banker', arsenal: ['banque', 'arnaques'],
    fields: [f('balance', 3000, 100, 1), f('rate', 19, 0.5, 0, 100), f('payment', 120, 10, 1), f('extra', 50, 10, 0)] },
  { id: 'heures', role: 'budget', sprite: 'clock', kind: 'calc', guide: 'robot', arsenal: ['marches'],
    fields: [f('price', 300, 10, 1), f('income', 2000, 50, 1), f('hours', 151, 1, 1, 744), f('years', 10, 1, 0, 60), f('rate', 5, 0.5, -50, 100)] },
  { id: 'voiture', role: 'budget', sprite: 'car', kind: 'calc', guide: 'robot', arsenal: ['banque'],
    fields: [f('price', 20000, 1000, 0), f('years', 6, 1, 1, 40), f('resale', 35, 5, 0, 100), f('km', 12000, 1000, 0), f('use', 6, 0.5, 0), f('energy', 1.8, 0.05, 0), f('fixed', 1500, 100, 0)] },
  { id: 'menage', role: 'budget', sprite: 'clip', kind: 'checklist', list: 'menage', size: 10, guide: 'banker', arsenal: ['banque', 'arnaques'] },
];

/* Le parcours : six niveaux. Les textes sont dans les fichiers de langue, dans le même ordre. */
export const LEVELS = [
  { guide: 'mentor', tools: ['canvas', 'marche'], arsenal: ['sondages', 'ia'] },
  { guide: 'dev', tools: ['phrase', 'runway'], arsenal: ['construire', 'design'] },
  { guide: 'client', tools: ['prix', 'seuil', 'tunnel', 'client'], arsenal: ['paiements', 'compta', 'crm'] },
  { guide: 'angel', tools: ['deck', 'lever', 'dilution', 'convertible'], arsenal: ['presenter', 'dossier', 'captable'] },
  { guide: 'banker', tools: ['objectif', 'croissance', 'vesting'], arsenal: ['mesurer', 'organiser'] },
  { guide: 'mentor', tools: ['ticket', 'valo', 'cascade'], arsenal: ['donnees'] },
];

/* Les neuf cases du lean canvas, dans l'ordre où on les remplit. */
export const CANVAS = ['problem', 'segments', 'uvp', 'solution', 'channels', 'revenue', 'costs', 'metrics', 'edge'];
