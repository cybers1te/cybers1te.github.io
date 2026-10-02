// marketbuss — les calculs des outils.
//
// Fonctions pures, sans DOM : tout se teste avec Node (plateforme/tests/).
// Les montants sont dans la devise de l'utilisateur, les pourcentages sont
// saisis en « 20 » pour 20 %. Une entrée absurde donne `null`, jamais un
// faux résultat.

const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : NaN);
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/* ---------- Entrepreneur ---------- */

/*
  Combien de mois la trésorerie tient.
    cash    : trésorerie aujourd'hui
    burn    : dépenses par mois
    revenue : revenus par mois aujourd'hui
    growth  : croissance des revenus, en % par mois
  → months : mois entiers avant de passer sous zéro (null = tient au moins
    `horizon` mois), breakEven : premier mois où les revenus couvrent les
    dépenses (null = jamais dans l'horizon), series : trésorerie fin de mois.
*/
export function runway({ cash, burn, revenue = 0, growth = 0 }, horizon = 36) {
  cash = num(cash); burn = num(burn); revenue = num(revenue); growth = num(growth);
  if (!(cash >= 0) || !(burn >= 0) || !(revenue >= 0) || !(growth > -100) || growth > 1000) return null;
  const series = [{ month: 0, cash: round(cash), revenue: round(revenue) }];
  let months = null;
  let breakEven = null;
  let balance = cash;
  for (let m = 1; m <= horizon; m++) {
    const rev = revenue * (1 + growth / 100) ** (m - 1);
    if (breakEven == null && rev >= burn) breakEven = m;
    balance += rev - burn;
    if (!Number.isFinite(balance)) return null;
    series.push({ month: m, cash: round(balance), revenue: round(rev) });
    if (months == null && balance < 0) months = m - 1;
  }
  return { months, breakEven, series, netBurn: round(burn - revenue), horizon };
}

/*
  Ce qu'il reste aux fondateurs après une levée.
    pre      : valorisation avant la levée (pre-money)
    raise    : montant levé
    pool     : réserve d'actions pour les futurs salariés, en % du capital après la levée
    founders : part des fondateurs avant la levée, en %
*/
export function dilution({ pre, raise, pool = 0, founders = 100 }) {
  pre = num(pre); raise = num(raise); pool = num(pool); founders = num(founders);
  if (!(pre > 0) || !(raise >= 0) || !(pool >= 0) || !(founders >= 0) || founders > 100) return null;
  const post = pre + raise;
  const investors = (raise / post) * 100;
  if (investors + pool >= 100) return null;
  const keep = (100 - investors - pool) / 100; // ce que gardent ceux qui étaient déjà là
  return {
    post: round(post),
    investors: round(investors),
    pool: round(pool),
    founders: round(founders * keep),
    others: round((100 - founders) * keep),
    lost: round(founders - founders * keep),
  };
}

/*
  Seuil de rentabilité : combien de ventes par mois pour couvrir les charges.
    price : prix de vente, variable : coût par vente, fixed : charges fixes par mois
*/
export function breakEven({ price, variable = 0, fixed }) {
  price = num(price); variable = num(variable); fixed = num(fixed);
  if (!(price > 0) || !(variable >= 0) || !(fixed >= 0)) return null;
  const margin = price - variable;
  if (margin <= 0) return { margin: round(margin), marginRate: round((margin / price) * 100, 1), units: null, revenue: null };
  const units = Math.ceil(round(fixed / margin, 6));
  return { margin: round(margin), marginRate: round((margin / price) * 100, 1), units, revenue: round(units * price) };
}

/*
  Ce qu'un client coûte et rapporte.
    spend     : dépenses pour trouver des clients sur la période
    customers : nouveaux clients gagnés sur la même période
    arpu      : revenu par client et par mois
    margin    : marge brute, en %
    churn     : part des clients qui partent chaque mois, en %
*/
export function unitEconomics({ spend, customers, arpu, margin = 100, churn }) {
  spend = num(spend); customers = num(customers); arpu = num(arpu); margin = num(margin); churn = num(churn);
  if (!(spend >= 0) || !(customers > 0) || !(arpu > 0) || !(margin > 0) || margin > 100 || !(churn > 0) || churn > 100) return null;
  const cac = spend / customers;
  const monthly = arpu * (margin / 100); // marge par client et par mois
  const lifetime = 100 / churn; // durée de vie moyenne, en mois
  const ltv = monthly * lifetime;
  return {
    cac: round(cac),
    lifetime: round(lifetime, 1),
    ltv: round(ltv),
    ratio: cac > 0 ? round(ltv / cac, 1) : null,
    payback: cac > 0 ? round(cac / monthly, 1) : 0,
  };
}

/* ---------- Investisseur ---------- */

/*
  Ce que vaut un ticket à la sortie.
    ticket   : montant investi
    post     : valorisation après la levée (post-money) à l'entrée
    dilution : dilution subie lors des tours suivants, en %
    exit     : valorisation à la sortie
    years    : années entre l'entrée et la sortie
*/
export function exitReturn({ ticket, post, dilution: dil = 0, exit, years }) {
  ticket = num(ticket); post = num(post); dil = num(dil); exit = num(exit); years = num(years);
  if (!(ticket > 0) || !(post >= ticket) || !(dil >= 0) || dil >= 100 || !(exit >= 0) || !(years >= 1) || years > 100) return null;
  const stake = (ticket / post) * 100;
  const stakeExit = stake * (1 - dil / 100);
  const proceeds = (stakeExit / 100) * exit;
  const multiple = proceeds / ticket;
  return {
    stake: round(stake),
    stakeExit: round(stakeExit),
    proceeds: round(proceeds),
    gain: round(proceeds - ticket),
    multiple: round(multiple),
    irr: multiple > 0 ? round((multiple ** (1 / years) - 1) * 100, 1) : -100,
  };
}

/*
  Intérêts composés : un capital, un versement chaque mois, un rendement par an.
  → une ligne par année : versé (cumul), valeur.
*/
export function compound({ initial = 0, monthly = 0, rate, years }) {
  initial = num(initial); monthly = num(monthly); rate = num(rate); years = num(years);
  if (!(initial >= 0) || !(monthly >= 0) || !(rate > -100) || rate > 1000 || !(years >= 1) || years > 60 || !Number.isInteger(years)) return null;
  const r = (1 + rate / 100) ** (1 / 12) - 1; // taux par mois équivalent
  const series = [{ year: 0, paid: round(initial), value: round(initial) }];
  let value = initial;
  let paid = initial;
  for (let m = 1; m <= years * 12; m++) {
    value = value * (1 + r) + monthly;
    if (!Number.isFinite(value)) return null;
    paid += monthly;
    if (m % 12 === 0) series.push({ year: m / 12, paid: round(paid), value: round(value) });
  }
  return { series, paid: round(paid), value: round(value), gain: round(value - paid) };
}

/*
  Valorisation maximale à l'entrée pour viser un multiple.
    exit     : valorisation espérée à la sortie
    multiple : multiple visé sur le ticket
    dilution : dilution attendue lors des tours suivants, en %
    ticket   : montant investi (facultatif, pour la part obtenue)
*/
export function maxValuation({ exit, multiple, dilution: dil = 0, ticket = null }) {
  exit = num(exit); multiple = num(multiple); dil = num(dil);
  if (!(exit > 0) || !(multiple > 0) || !(dil >= 0) || dil >= 100) return null;
  const post = (exit * (1 - dil / 100)) / multiple;
  const t = ticket == null || ticket === '' ? null : num(ticket);
  const ok = t != null && t > 0 && t <= post;
  return { post: round(post), pre: ok ? round(post - t) : null, stake: ok ? round((t / post) * 100) : null };
}

/* ---------- Carte de pitch partageable ---------- */

// Champs d'une carte et longueur maximale de chacun. Tout le reste est ignoré.
export const CARD_FIELDS = { name: 40, tagline: 120, stage: 30, sector: 40, t1: 60, t2: 60, t3: 60, ask: 40, use: 140, contact: 80 };

/* Carte → texte court pour l'adresse de la page (base64 « url-safe » de JSON). */
export function encodeCard(card) {
  const clean = {};
  for (const [key, max] of Object.entries(CARD_FIELDS)) {
    const v = String(card && card[key] != null ? card[key] : '').replace(/\s+/g, ' ').trim().slice(0, max);
    if (v) clean[key] = v;
  }
  const bytes = new TextEncoder().encode(JSON.stringify(clean));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* Texte de l'adresse → carte. Tout ce qui n'est pas une carte valable donne null. */
export function decodeCard(text) {
  try {
    const s = String(text || '');
    if (!s || s.length > 2000 || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const card = {};
    for (const [key, max] of Object.entries(CARD_FIELDS)) {
      if (typeof data[key] === 'string') {
        const v = data[key].replace(/\s+/g, ' ').trim().slice(0, max);
        if (v) card[key] = v;
      }
    }
    return card.name ? card : null;
  } catch {
    return null;
  }
}
