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

/* ---------- Entrepreneur : marché, levée ---------- */

/*
  Taille du marché, en partant des clients (méthode « du bas vers le haut »).
    customers : clients possibles en tout
    price     : ce qu'un client rapporte par an
    reachable : part des clients que tu peux vraiment servir, en %
    share     : part de ceux-là que tu vises, en %
*/
export function marketSize({ customers, price, reachable, share }) {
  customers = num(customers); price = num(price); reachable = num(reachable); share = num(share);
  if (!(customers > 0) || !(price > 0) || !(reachable >= 0) || reachable > 100 || !(share >= 0) || share > 100) return null;
  const samCustomers = customers * (reachable / 100);
  const somCustomers = samCustomers * (share / 100);
  const out = { tam: round(customers * price), sam: round(samCustomers * price), som: round(somCustomers * price),
    samCustomers: Math.round(samCustomers), somCustomers: Math.round(somCustomers) };
  return Number.isFinite(out.tam) ? out : null;
}

/*
  Combien lever pour tenir un nombre de mois.
    burn, revenue : dépenses et revenus par mois
    months        : mois à financer
    buffer        : marge de sécurité, en %
    pre           : valorisation avant la levée (facultatif, pour la part cédée)
*/
export function raiseNeed({ burn, revenue = 0, months, buffer = 0, pre = null }) {
  burn = num(burn); revenue = num(revenue); months = num(months); buffer = num(buffer);
  if (!(burn >= 0) || !(revenue >= 0) || !(months > 0) || months > 120 || !(buffer >= 0) || buffer > 500) return null;
  const netBurn = burn - revenue;
  const base = Math.max(0, netBurn) * months;
  const raise = base * (1 + buffer / 100);
  const p = pre == null || pre === '' ? null : num(pre);
  const ok = p != null && p > 0 && raise > 0;
  const out = { netBurn: round(netBurn), base: round(base), raise: round(raise),
    post: ok ? round(p + raise) : null, investors: ok ? round((raise / (p + raise)) * 100) : null };
  return Number.isFinite(out.raise) ? out : null;
}

/* ---------- Indépendant ---------- */

/*
  Prix de vente à partir du coût et de la marge visée.
    cost   : ce que le produit te coûte
    margin : marge visée, en % du prix de vente hors taxe
    vat    : TVA, en %
  → ht, ttc, marge en argent, markup (marge en % du coût), coefficient (ttc ÷ coût).
*/
export function pricing({ cost, margin, vat = 0 }) {
  cost = num(cost); margin = num(margin); vat = num(vat);
  if (!(cost > 0) || !(margin >= 0) || margin >= 100 || !(vat >= 0) || vat > 100) return null;
  const ht = cost / (1 - margin / 100);
  const ttc = ht * (1 + vat / 100);
  if (!Number.isFinite(ttc)) return null;
  return { ht: round(ht), ttc: round(ttc), vatAmount: round(ttc - ht), marginAmount: round(ht - cost),
    markup: round(((ht - cost) / cost) * 100, 1), coefficient: round(ttc / cost) };
}

/*
  Tarif journalier d'un indépendant.
    net     : ce que tu veux garder par mois, une fois tout payé
    days    : jours facturés par mois travaillé
    weeks   : semaines sans facturer dans l'année (congés, maladie, creux)
    charges : part de ce que tu gagnes qui part en cotisations et impôts, en %
    costs   : frais professionnels par mois
*/
export function dayRate({ net, days, weeks = 0, charges = 0, costs = 0 }) {
  net = num(net); days = num(days); weeks = num(weeks); charges = num(charges); costs = num(costs);
  if (!(net > 0) || !(days > 0) || days > 31 || !(weeks >= 0) || weeks >= 52 || !(charges >= 0) || charges >= 100 || !(costs >= 0)) return null;
  const billable = days * 12 * ((52 - weeks) / 52);
  const revenue = (net * 12) / (1 - charges / 100) + costs * 12;
  const rate = revenue / billable;
  if (!Number.isFinite(rate)) return null;
  return { rate: round(rate), hourly: round(rate / 8), billable: round(billable, 1), revenue: round(revenue),
    chargesAmount: round(revenue - costs * 12 - net * 12), costsAmount: round(costs * 12), netYear: round(net * 12) };
}

/*
  Tunnel de vente : des visiteurs aux clients.
    visitors : visiteurs sur la période
    signup   : part des visiteurs qui laissent un contact ou s'inscrivent, en %
    purchase : part de ceux-là qui achètent, en %
    basket   : montant moyen d'un achat
    spend    : dépenses pour faire venir ces visiteurs
*/
export function funnel({ visitors, signup, purchase, basket, spend = 0 }) {
  visitors = num(visitors); signup = num(signup); purchase = num(purchase); basket = num(basket); spend = num(spend);
  if (!(visitors >= 0) || !(signup >= 0) || signup > 100 || !(purchase >= 0) || purchase > 100 || !(basket >= 0) || !(spend >= 0)) return null;
  const leads = visitors * (signup / 100);
  const customers = leads * (purchase / 100);
  const revenue = customers * basket;
  if (!Number.isFinite(revenue)) return null;
  return { leads: round(leads, 1), customers: round(customers, 1), revenue: round(revenue),
    rate: visitors > 0 ? round((customers / visitors) * 100, 2) : 0,
    costPerCustomer: customers > 0 && spend > 0 ? round(spend / customers) : null,
    perEuro: spend > 0 ? round(revenue / spend) : null,
    result: round(revenue - spend) };
}

/* ---------- Investisseur : portefeuille, conversion, sortie ---------- */

/*
  Un portefeuille de jeunes entreprises, en trois familles.
    count       : nombre d'entreprises
    ticket      : montant mis dans chacune
    fail        : part qui ne rend rien, en %
    mid         : part qui rend un peu, en %, avec son multiple midMultiple
    winMultiple : multiple du reste (les gros succès)
*/
export function portfolio({ count, ticket, fail, mid, midMultiple, winMultiple }) {
  count = num(count); ticket = num(ticket); fail = num(fail); mid = num(mid); midMultiple = num(midMultiple); winMultiple = num(winMultiple);
  if (!(count >= 1) || count > 500 || !Number.isInteger(count) || !(ticket > 0) || !(fail >= 0) || !(mid >= 0) || fail + mid > 100
    || !(midMultiple >= 0) || !(winMultiple >= 0)) return null;
  const win = 100 - fail - mid;
  const invested = count * ticket;
  const multiple = (mid * midMultiple + win * winMultiple) / 100;
  if (!Number.isFinite(multiple * invested)) return null;
  // Entreprises entières par famille : les arrondis vont aux échecs.
  const winners = Math.round((count * win) / 100);
  const mids = Math.min(count - winners, Math.round((count * mid) / 100));
  return { win: round(win), invested: round(invested), multiple: round(multiple), proceeds: round(invested * multiple),
    withoutWinners: round((mid * midMultiple) / 100), winners, mids, fails: count - winners - mids };
}

/*
  Conversion d'un BSA-AIR (ou d'un SAFE) lors de la levée suivante.
    amount   : montant apporté par le porteur
    cap      : plafond de valorisation (0 = pas de plafond)
    discount : décote sur le prix du tour, en %
    pre      : valorisation avant la levée suivante, hors conversion
    raise    : argent frais apporté par les nouveaux investisseurs
  Convention : le prix du tour est fixé sur les actions qui existent déjà ;
  le porteur convertit au plus bas des deux prix (plafond ou décote).
*/
export function convertible({ amount, cap = 0, discount = 0, pre, raise = 0 }) {
  amount = num(amount); cap = num(cap); discount = num(discount); pre = num(pre); raise = num(raise);
  if (!(amount > 0) || !(cap >= 0) || !(discount >= 0) || discount >= 100 || !(pre > 0) || !(raise >= 0)) return null;
  const discounted = pre * (1 - discount / 100);
  const effective = cap > 0 ? Math.min(cap, discounted) : discounted;
  const noteShares = amount / effective; // en parts du capital d'avant la levée
  const newShares = raise / pre;
  const total = 1 + noteShares + newShares;
  const stake = (noteShares / total) * 100;
  const atRound = ((amount / pre) / (1 + amount / pre + newShares)) * 100;
  if (!Number.isFinite(stake)) return null;
  return { effective: round(effective), rule: cap > 0 && cap < discounted ? 'cap' : discount > 0 ? 'discount' : 'none',
    stake: round(stake), atRound: round(atRound), bonus: round(stake / atRound),
    existing: round((1 / total) * 100), newInvestors: round((newShares / total) * 100) };
}

/*
  Qui touche quoi à la vente, avec une préférence de liquidation non
  participative : les investisseurs prennent le plus grand des deux montants
  (leur mise × multiple, ou leur part du prix).
    exit     : prix de vente de l'entreprise
    invested : montant investi par les investisseurs
    stake    : part du capital détenue par les investisseurs, en %
    multiple : multiple de la préférence (1 = récupérer sa mise d'abord)
*/
export function waterfall({ exit, invested, stake, multiple = 1 }) {
  exit = num(exit); invested = num(invested); stake = num(stake); multiple = num(multiple);
  if (!(exit >= 0) || !(invested >= 0) || !(stake > 0) || stake > 100 || !(multiple >= 0) || multiple > 10) return null;
  const preference = Math.min(exit, invested * multiple);
  const asShares = exit * (stake / 100);
  const investors = Math.max(preference, asShares);
  if (!Number.isFinite(investors)) return null;
  return { preference: round(preference), asShares: round(asShares), investors: round(investors), others: round(exit - investors),
    converts: asShares >= preference, investorsShare: exit > 0 ? round((investors / exit) * 100, 1) : 0,
    threshold: round((invested * multiple) / (stake / 100)) };
}

/* ---------- Épargnant ---------- */

/*
  Ce que coûtent les frais sur la durée : le même placement avec deux
  niveaux de frais annuels (en % du montant placé).
*/
export function fees({ initial = 0, monthly = 0, rate, feeA, feeB, years }) {
  feeA = num(feeA); feeB = num(feeB);
  if (!(feeA >= 0) || !(feeB >= 0) || feeA > 20 || feeB > 20) return null;
  const free = compound({ initial, monthly, rate, years });
  const a = compound({ initial, monthly, rate: num(rate) - feeA, years });
  const b = compound({ initial, monthly, rate: num(rate) - feeB, years });
  if (!free || !a || !b) return null;
  return { paid: free.paid, free: free.value, a: a.value, b: b.value, gap: round(Math.abs(a.value - b.value)),
    costA: round(free.value - a.value), costB: round(free.value - b.value),
    series: a.series.map((p, i) => ({ year: p.year, a: p.value, b: b.series[i].value })) };
}

/*
  Ce que vaut une somme plus tard, une fois la hausse des prix retirée.
    amount    : la somme aujourd'hui
    inflation : hausse des prix, en % par an
    years     : durée
    rate      : rendement du placement, en % par an (0 si l'argent dort)
*/
export function inflation({ amount, inflation: inf, years, rate = 0 }) {
  amount = num(amount); inf = num(inf); years = num(years); rate = num(rate);
  if (!(amount > 0) || !(inf > -50) || inf > 100 || !(years >= 1) || years > 60 || !Number.isInteger(years) || !(rate > -100) || rate > 100) return null;
  const series = [];
  for (let y = 0; y <= years; y++) {
    const nominal = amount * (1 + rate / 100) ** y;
    series.push({ year: y, nominal: round(nominal), real: round(nominal / (1 + inf / 100) ** y) });
  }
  const last = series[series.length - 1];
  if (!Number.isFinite(last.real)) return null;
  return { series, nominal: last.nominal, real: last.real, lost: round(100 - (last.real / amount) * 100, 1),
    realRate: round(((1 + rate / 100) / (1 + inf / 100) - 1) * 100, 2) };
}

/* ---------- Bornes supplémentaires ---------- */

/*
  Vesting : la part déjà acquise d'une attribution.
    stake   : part du capital attribuée, en %
    years   : durée totale d'acquisition
    cliff   : mois avant la première acquisition
    elapsed : mois écoulés depuis le départ
*/
export function vesting({ stake, years, cliff = 0, elapsed }) {
  stake = num(stake); years = num(years); cliff = num(cliff); elapsed = num(elapsed);
  if (!(stake > 0) || stake > 100 || !(years > 0) || years > 20 || !(cliff >= 0) || cliff > years * 12 || !(elapsed >= 0)) return null;
  const total = years * 12;
  const ratio = elapsed < cliff ? 0 : Math.min(1, elapsed / total);
  return { ratio: round(ratio * 100, 1), vested: round(stake * ratio), unvested: round(stake * (1 - ratio)),
    left: Math.max(0, Math.ceil(total - elapsed)), toCliff: Math.max(0, Math.ceil(cliff - elapsed)) };
}

/*
  Objectif de revenu récurrent : combien de nouveaux clients par mois.
    target  : revenu par mois visé
    price   : revenu par client et par mois
    current : clients aujourd'hui
    churn   : clients qui partent, en % par mois
    months  : délai
*/
export function revenueTarget({ target, price, current = 0, churn = 0, months }) {
  target = num(target); price = num(price); current = num(current); churn = num(churn); months = num(months);
  if (!(target > 0) || !(price > 0) || !(current >= 0) || !(churn >= 0) || churn >= 100 || !(months >= 1) || months > 120) return null;
  const needed = target / price;
  const keep = (1 - churn / 100) ** months;
  const gap = needed - current * keep;
  const perMonth = gap <= 0 ? 0 : churn === 0 ? gap / months : (gap * (churn / 100)) / (1 - keep);
  if (!Number.isFinite(perMonth)) return null;
  return { needed: Math.ceil(needed), perMonth: round(perMonth, 1), total: Math.ceil(perMonth * months),
    lost: Math.round(perMonth * months - (needed - current)), currentRevenue: round(current * price) };
}

/* Croissance par mois pour passer de `from` à `to` en `months` mois. */
export function growthRate({ from, to, months }) {
  from = num(from); to = num(to); months = num(months);
  if (!(from > 0) || !(to > 0) || !(months >= 1) || months > 600) return null;
  const monthly = (to / from) ** (1 / months) - 1;
  if (!Number.isFinite(monthly)) return null;
  return { monthly: round(monthly * 100, 2), yearly: round(((1 + monthly) ** 12 - 1) * 100, 1), multiple: round(to / from),
    doubling: monthly > 0 ? round(Math.log(2) / Math.log(1 + monthly), 1) : null };
}

/*
  Ce que coûte une remise.
    price    : prix de vente hors taxe
    margin   : marge, en % du prix
    discount : remise, en % du prix
  → extra : ventes en plus nécessaires pour gagner autant qu'avant, en % (null si la remise mange toute la marge).
*/
export function discount({ price, margin, discount: d }) {
  price = num(price); margin = num(margin); d = num(d);
  if (!(price > 0) || !(margin > 0) || margin > 100 || !(d >= 0) || d >= 100) return null;
  const before = price * (margin / 100);
  const after = price * ((margin - d) / 100);
  return { newPrice: round(price * (1 - d / 100)), before: round(before), after: round(after),
    extra: after > 0 ? round((before / after - 1) * 100, 1) : null, lostShare: round((d / margin) * 100, 1) };
}

/*
  Un devis : jours × tarif, plus une marge pour les imprévus, plus les frais.
    deposit : acompte demandé, en % du total
*/
export function quote({ days, rate, buffer = 0, expenses = 0, vat = 0, deposit = 0 }) {
  days = num(days); rate = num(rate); buffer = num(buffer); expenses = num(expenses); vat = num(vat); deposit = num(deposit);
  if (!(days > 0) || !(rate > 0) || !(buffer >= 0) || buffer > 500 || !(expenses >= 0) || !(vat >= 0) || vat > 100 || !(deposit >= 0) || deposit > 100) return null;
  const work = days * rate;
  const safety = work * (buffer / 100);
  const ht = work + safety + expenses;
  const ttc = ht * (1 + vat / 100);
  if (!Number.isFinite(ttc)) return null;
  return { work: round(work), safety: round(safety), ht: round(ht), vatAmount: round(ttc - ht), ttc: round(ttc),
    depositAmount: round(ttc * (deposit / 100)), balance: round(ttc * (1 - deposit / 100)), days: round(days * (1 + buffer / 100), 1) };
}

/*
  Ce qu'il faut mettre de côté sur une facture.
    amount  : montant hors taxe
    vat     : TVA, en %
    charges : cotisations et impôts, en % du montant hors taxe
*/
export function setAside({ amount, vat = 0, charges = 0 }) {
  amount = num(amount); vat = num(vat); charges = num(charges);
  if (!(amount > 0) || !(vat >= 0) || vat > 100 || !(charges >= 0) || charges > 100) return null;
  const vatAmount = amount * (vat / 100);
  const chargesAmount = amount * (charges / 100);
  if (!Number.isFinite(vatAmount)) return null;
  return { ttc: round(amount + vatAmount), vatAmount: round(vatAmount), chargesAmount: round(chargesAmount),
    aside: round(vatAmount + chargesAmount), yours: round(amount - chargesAmount),
    yoursShare: round(((amount - chargesAmount) / (amount + vatAmount)) * 100, 1) };
}

/*
  Suivre à la levée suivante pour garder sa part.
    stake : part actuelle, en %
    pre   : valorisation avant la levée
    raise : montant de la levée
*/
export function proRata({ stake, pre, raise }) {
  stake = num(stake); pre = num(pre); raise = num(raise);
  if (!(stake > 0) || stake > 100 || !(pre > 0) || !(raise >= 0)) return null;
  const post = pre + raise;
  if (!Number.isFinite(post)) return null;
  return { invest: round(raise * (stake / 100)), without: round(stake * (pre / post), 2), post: round(post),
    lost: round(stake - stake * (pre / post), 2), value: round(post * (stake / 100)) };
}

/* Ce que devient une part après plusieurs levées qui diluent chacune de `dilution` %. */
export function rounds({ stake, rounds: n, dilution: d }) {
  stake = num(stake); n = num(n); d = num(d);
  if (!(stake > 0) || stake > 100 || !(n >= 1) || n > 12 || !Number.isInteger(n) || !(d >= 0) || d >= 100) return null;
  const series = [{ round: 0, stake: round(stake, 2) }];
  let s = stake;
  for (let i = 1; i <= n; i++) { s *= 1 - d / 100; series.push({ round: i, stake: round(s, 2) }); }
  return { series, final: round(s, 2), kept: round((s / stake) * 100, 1) };
}

/* Une grille de notation : cinq critères notés de 0 à 10, avec des poids d'exemple (total 100). */
export const SCORE_WEIGHTS = { team: 30, market: 25, traction: 20, product: 15, terms: 10 };
export function scorecard(notes) {
  const parts = [];
  let score = 0;
  for (const [key, weight] of Object.entries(SCORE_WEIGHTS)) {
    const n = num(notes && notes[key]);
    if (!(n >= 0) || n > 10) return null;
    const points = (n / 10) * weight;
    score += points;
    parts.push({ key, note: n, weight, points: round(points, 1) });
  }
  const weakest = parts.reduce((a, b) => (b.note < a.note ? b : a));
  return { score: round(score, 1), parts, weakest: weakest.key };
}

/* ---------- Épargnant : objectif, durée, précaution ---------- */

/* Versement mensuel pour atteindre `target` en `years` ans, avec un capital de départ. */
export function savingsGoal({ target, years, rate = 0, initial = 0 }) {
  target = num(target); years = num(years); rate = num(rate); initial = num(initial);
  if (!(target > 0) || !(years >= 1) || years > 60 || !Number.isInteger(years) || !(rate > -100) || rate > 100 || !(initial >= 0)) return null;
  const months = years * 12;
  const r = (1 + rate / 100) ** (1 / 12) - 1;
  const grown = initial * (1 + r) ** months;
  const gap = target - grown;
  const monthly = gap <= 0 ? 0 : r === 0 ? gap / months : (gap * r) / ((1 + r) ** months - 1);
  if (!Number.isFinite(monthly)) return null;
  const paid = initial + monthly * months;
  return { monthly: round(monthly), paid: round(paid), interest: round(Math.max(target, grown) - paid), enough: gap <= 0, grown: round(grown) };
}

/*
  Combien de temps un capital peut verser un revenu.
    capital : somme de départ
    monthly : retrait par mois
    rate    : rendement, en % par an
  → months (null = le capital ne s'épuise pas), série par année.
*/
export function drawdown({ capital, monthly, rate = 0 }) {
  capital = num(capital); monthly = num(monthly); rate = num(rate);
  if (!(capital > 0) || !(monthly > 0) || !(rate > -100) || rate > 100) return null;
  const r = (1 + rate / 100) ** (1 / 12) - 1;
  const series = [{ year: 0, value: round(capital) }];
  let value = capital;
  let months = null;
  for (let m = 1; m <= 1200; m++) {
    value = value * (1 + r) - monthly;
    if (value <= 0) { months = m; series.push({ year: Math.ceil(m / 12), value: 0 }); break; }
    if (m % 12 === 0) series.push({ year: m / 12, value: round(value) });
    if (!Number.isFinite(value)) return null;
  }
  const forever = months == null;
  return { months, years: months == null ? null : round(months / 12, 1), forever, series: series.slice(0, forever ? 41 : series.length),
    sustainable: round(capital * r), total: months == null ? null : round(monthly * months) };
}

/*
  Épargne de précaution.
    expenses : dépenses par mois
    months   : mois de dépenses à couvrir
    saved    : déjà mis de côté
    monthly  : ce que tu peux épargner par mois
*/
export function cushion({ expenses, months, saved = 0, monthly = 0 }) {
  expenses = num(expenses); months = num(months); saved = num(saved); monthly = num(monthly);
  if (!(expenses > 0) || !(months > 0) || months > 60 || !(saved >= 0) || !(monthly >= 0)) return null;
  const target = expenses * months;
  const missing = Math.max(0, target - saved);
  if (!Number.isFinite(target)) return null;
  return { target: round(target), missing: round(missing), covered: round(saved / expenses, 1),
    progress: round(Math.min(100, (saved / target) * 100), 1), wait: missing === 0 ? 0 : monthly > 0 ? Math.ceil(missing / monthly) : null };
}

/* ---------- Pitch en une phrase ---------- */

// Champs du pitch et longueur maximale de chacun.
export const PHRASE_FIELDS = { name: 40, who: 80, problem: 120, solution: 120, unlike: 80, edge: 120 };

/* Les morceaux saisis → morceaux nettoyés (espaces, ponctuation finale, longueur).
   `null` s'il manque le nom, les personnes aidées ou ce qu'on leur permet.
   L'assemblage en phrases dépend de la langue : il est dans lang/<langue>.js. */
export function phraseParts(parts) {
  const p = {};
  for (const [key, max] of Object.entries(PHRASE_FIELDS)) {
    p[key] = String(parts && parts[key] != null ? parts[key] : '').replace(/\s+/g, ' ').trim().replace(/[.!?…]+$/, '').slice(0, max);
  }
  return p.name && p.who && p.solution ? p : null;
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
