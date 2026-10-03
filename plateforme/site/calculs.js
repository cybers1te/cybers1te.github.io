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

/* ---------- Immobilier ---------- */

// Mensualité d'un prêt à taux fixe (sans assurance). r : taux par mois, n : nombre de mois.
const annuity = (amount, r, n) => (r === 0 ? amount / n : (amount * r) / (1 - (1 + r) ** -n));

/*
  Un crédit immobilier à taux fixe.
    amount    : montant emprunté
    rate      : taux nominal, en % par an
    years     : durée, en années entières
    insurance : assurance, en % du montant emprunté par an
  → mensualité, coût total, et une ligne par année : capital remboursé, intérêts, reste dû.
*/
export function mortgage({ amount, rate, years, insurance = 0 }) {
  amount = num(amount); rate = num(rate); years = num(years); insurance = num(insurance);
  if (!(amount > 0) || !(rate >= 0) || rate > 30 || !(years >= 1) || years > 40 || !Number.isInteger(years) || !(insurance >= 0) || insurance > 5) return null;
  const n = years * 12;
  const r = rate / 100 / 12;
  const payment = annuity(amount, r, n);
  const ins = (amount * insurance) / 100 / 12;
  if (!Number.isFinite(payment)) return null;
  const series = [];
  let balance = amount;
  let yp = 0;
  let yi = 0;
  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    const principal = payment - interest;
    balance -= principal;
    yp += principal; yi += interest;
    if (m % 12 === 0) { series.push({ year: m / 12, principal: round(yp), interest: round(yi), balance: round(Math.max(0, balance)) }); yp = 0; yi = 0; }
  }
  const totalInterest = payment * n - amount;
  return { payment: round(payment), insurance: round(ins), monthly: round(payment + ins), totalInterest: round(totalInterest),
    totalInsurance: round(ins * n), totalCost: round(totalInterest + ins * n), totalPaid: round((payment + ins) * n),
    firstInterest: round(amount * r), series };
}

/*
  Combien emprunter avec ses revenus.
    income : revenus nets du foyer, par mois
    debts  : crédits en cours, par mois
    ratio  : part maximale des revenus consacrée aux crédits, en %
    rate   : taux, en % par an (assurance comprise, pour simplifier)
    years  : durée, en années entières
*/
export function borrowingCapacity({ income, debts = 0, ratio, rate, years }) {
  income = num(income); debts = num(debts); ratio = num(ratio); rate = num(rate); years = num(years);
  if (!(income > 0) || !(debts >= 0) || !(ratio > 0) || ratio > 100 || !(rate >= 0) || rate > 30 || !(years >= 1) || years > 40 || !Number.isInteger(years)) return null;
  const n = years * 12;
  const r = rate / 100 / 12;
  const room = income * (ratio / 100);
  const maxMonthly = Math.max(0, room - debts);
  const loan = r === 0 ? maxMonthly * n : (maxMonthly * (1 - (1 + r) ** -n)) / r;
  if (!Number.isFinite(loan)) return null;
  return { room: round(room), maxMonthly: round(maxMonthly), loan: round(loan), totalPaid: round(maxMonthly * n),
    interest: round(maxMonthly * n - loan), used: round((debts / income) * 100, 1) };
}

/*
  Rendement d'un logement mis en location.
    price   : prix d'achat
    costs   : frais d'achat et travaux
    rent    : loyer par mois, hors charges
    charges : dépenses par an à ta charge (taxe foncière, copropriété, assurance, entretien)
    vacancy : mois sans locataire par an
*/
export function rentalYield({ price, costs = 0, rent, charges = 0, vacancy = 0 }) {
  price = num(price); costs = num(costs); rent = num(rent); charges = num(charges); vacancy = num(vacancy);
  if (!(price > 0) || !(costs >= 0) || !(rent >= 0) || !(charges >= 0) || !(vacancy >= 0) || vacancy > 12) return null;
  const total = price + costs;
  const yearRent = rent * (12 - vacancy);
  const netIncome = yearRent - charges;
  return { total: round(total), yearRent: round(yearRent), netIncome: round(netIncome),
    gross: round(((rent * 12) / price) * 100, 2), net: round((netIncome / total) * 100, 2),
    payback: netIncome > 0 ? round(total / netIncome, 1) : null };
}

/*
  Ce qu'un logement loué laisse (ou coûte) chaque mois.
    rent    : loyer par mois
    vacancy : part de l'année sans locataire, en %
    charges : dépenses par mois à ta charge
    loan    : mensualité du crédit
    works   : réserve pour les travaux, en % du loyer
*/
export function rentalCashflow({ rent, vacancy = 0, charges = 0, loan = 0, works = 0 }) {
  rent = num(rent); vacancy = num(vacancy); charges = num(charges); loan = num(loan); works = num(works);
  if (!(rent >= 0) || !(vacancy >= 0) || vacancy > 100 || !(charges >= 0) || !(loan >= 0) || !(works >= 0) || works > 100) return null;
  const income = rent * (1 - vacancy / 100);
  const reserve = rent * (works / 100);
  const cash = income - charges - loan - reserve;
  return { income: round(income), reserve: round(reserve), out: round(charges + loan + reserve), cash: round(cash), yearly: round(cash * 12),
    cover: loan > 0 ? round((income / loan) * 100, 0) : null };
}

/*
  Louer ou acheter : le patrimoine de chacun, année après année.
    price    : prix du logement ;  buyCosts : frais d'achat, en % du prix
    deposit  : apport ;  rate, years : le crédit
    rent     : loyer par mois pour un logement équivalent
    growth   : hausse par an des prix et des loyers, en %
    invest   : rendement par an de l'argent placé, en %
    horizon  : années avant de comparer
  Conventions : le propriétaire paie aussi 1 % du prix par an (taxe, entretien) ;
  chaque mois, celui qui dépense le moins place la différence ; le locataire
  place l'apport dès le départ. Pas de frais de revente ni d'impôts.
*/
export const OWNER_COSTS = 1;
export function rentOrBuy({ price, buyCosts = 0, deposit = 0, rate, years, rent, growth = 0, invest = 0, horizon }) {
  price = num(price); buyCosts = num(buyCosts); deposit = num(deposit); rate = num(rate); years = num(years);
  rent = num(rent); growth = num(growth); invest = num(invest); horizon = num(horizon);
  if (!(price > 0) || !(buyCosts >= 0) || buyCosts > 30 || !(deposit >= 0) || !(rate >= 0) || rate > 30 || !(years >= 1) || years > 40 || !Number.isInteger(years)
    || !(rent >= 0) || !(growth >= -20) || growth > 20 || !(invest >= -50) || invest > 50 || !(horizon >= 1) || horizon > 40 || !Number.isInteger(horizon)) return null;
  const cost = price * (1 + buyCosts / 100);
  const used = Math.min(deposit, cost);
  const loan = cost - used;
  const r = rate / 100 / 12;
  const n = years * 12;
  const payment = loan > 0 ? annuity(loan, r, n) : 0;
  const g = (1 + growth / 100) ** (1 / 12);
  const k = (1 + invest / 100) ** (1 / 12);
  let balance = loan;
  let home = price;
  let monthRent = rent;
  let renter = deposit; // l'apport, placé
  let owner = deposit - used; // ce qui dépasse le coût d'achat, placé aussi
  const series = [{ year: 0, buy: round(price - loan + owner), rent: round(renter) }];
  let breakEven = null;
  for (let m = 1; m <= horizon * 12; m++) {
    const pay = m <= n ? payment : 0;
    if (m <= n) balance -= pay - balance * r;
    const ownerOut = pay + (home * OWNER_COSTS) / 100 / 12;
    renter *= k; owner *= k;
    if (ownerOut > monthRent) renter += ownerOut - monthRent; else owner += monthRent - ownerOut;
    home *= g; monthRent *= g;
    if (m % 12 === 0) {
      const buy = home - Math.max(0, balance) + owner;
      series.push({ year: m / 12, buy: round(buy), rent: round(renter) });
      if (breakEven == null && buy >= renter) breakEven = m / 12;
    }
  }
  const last = series[series.length - 1];
  if (!Number.isFinite(last.buy) || !Number.isFinite(last.rent)) return null;
  return { loan: round(loan), payment: round(payment), cost: round(cost), buy: last.buy, rent: last.rent, gap: round(last.buy - last.rent),
    breakEven, series, firstOwnerOut: round(payment + (price * OWNER_COSTS) / 100 / 12), home: round(home) };
}

/* ---------- E-commerce ---------- */

/*
  Ce que rapportent les publicités.
    basket   : panier moyen, TVA déduite
    cogs     : coût des produits d'une commande
    shipping : livraison payée par toi, par commande
    fees     : frais de paiement, en % du panier
    spend    : budget de publicité sur la période
    orders   : commandes venues de ces publicités
*/
export function adsProfit({ basket, cogs = 0, shipping = 0, fees = 0, spend = 0, orders = 0 }) {
  basket = num(basket); cogs = num(cogs); shipping = num(shipping); fees = num(fees); spend = num(spend); orders = num(orders);
  if (!(basket > 0) || !(cogs >= 0) || !(shipping >= 0) || !(fees >= 0) || fees > 100 || !(spend >= 0) || !(orders >= 0)) return null;
  const margin = basket - cogs - shipping - basket * (fees / 100);
  const revenue = orders * basket;
  return { margin: round(margin), revenue: round(revenue), profit: round(orders * margin - spend),
    breakEvenRoas: margin > 0 ? round(basket / margin, 2) : null,
    roas: spend > 0 ? round(revenue / spend, 2) : null,
    cpa: orders > 0 ? round(spend / orders) : null, maxCpa: round(Math.max(0, margin)),
    ordersNeeded: margin > 0 ? Math.ceil(round(spend / margin, 6)) : null };
}

/*
  Livraison offerte : à partir de quel panier elle se paie toute seule.
    basket   : panier moyen aujourd'hui
    margin   : marge sur les produits, en % du prix
    shipping : coût d'un envoi
    orders   : commandes par mois
*/
export function freeShipping({ basket, margin, shipping, orders = 0 }) {
  basket = num(basket); margin = num(margin); shipping = num(shipping); orders = num(orders);
  if (!(basket > 0) || !(margin > 0) || margin > 100 || !(shipping >= 0) || !(orders >= 0)) return null;
  const extra = shipping / (margin / 100);
  return { extra: round(extra), threshold: round(basket + extra), monthly: round(orders * shipping),
    eaten: round((shipping / (basket * (margin / 100))) * 100, 1) };
}

/*
  Quand recommander du stock.
    daily  : ventes par jour
    lead   : jours entre la commande et la livraison du fournisseur
    safety : jours de stock de sécurité
    stock  : unités en stock aujourd'hui
    cost   : coût d'achat d'une unité
*/
export function reorder({ daily, lead, safety = 0, stock, cost = 0 }) {
  daily = num(daily); lead = num(lead); safety = num(safety); stock = num(stock); cost = num(cost);
  if (!(daily > 0) || !(lead >= 0) || !(safety >= 0) || !(stock >= 0) || !(cost >= 0)) return null;
  const point = daily * (lead + safety);
  const daysLeft = stock / daily;
  return { point: Math.ceil(round(point, 6)), daysLeft: round(daysLeft, 1), orderIn: Math.max(0, Math.floor(round((stock - point) / daily, 6))),
    late: stock < point, gap: round(Math.max(0, lead - daysLeft), 1), value: round(stock * cost), pointValue: round(Math.ceil(point) * cost) };
}

/*
  Ce que coûtent les retours, par mois.
    orders : commandes par mois ;  rate : part retournée, en %
    basket : panier moyen remboursé ;  cogs : coût des produits d'une commande
    back   : frais de retour payés par toi, par colis
    lost   : part des produits retournés qu'on ne peut plus vendre, en %
  Un retour coûte la marge de la vente perdue, les frais de retour, et le coût
  des produits qui ne se revendent pas.
*/
export function returnsCost({ orders, rate, basket, cogs = 0, back = 0, lost = 0 }) {
  orders = num(orders); rate = num(rate); basket = num(basket); cogs = num(cogs); back = num(back); lost = num(lost);
  if (!(orders >= 0) || !(rate >= 0) || rate > 100 || !(basket > 0) || !(cogs >= 0) || !(back >= 0) || !(lost >= 0) || lost > 100) return null;
  const returned = orders * (rate / 100);
  const marginLost = basket - cogs;
  const perReturn = marginLost + back + cogs * (lost / 100);
  const total = returned * perReturn;
  const margin = orders * (basket - cogs);
  return { returned: round(returned, 1), perReturn: round(perReturn), total: round(total), yearly: round(total * 12),
    margin: round(margin), share: margin > 0 ? round((total / margin) * 100, 1) : null, after: round(margin - total) };
}

/*
  Vendre sur une place de marché ou sur ta propre boutique : ce qui reste par vente.
    price      : prix de vente, TVA déduite ;  cogs : coût du produit
    commission : commission de la place de marché, en % ;  fixedFee : frais fixes par vente
    siteFees   : frais de paiement sur ta boutique, en % ;  siteAds : publicité par vente sur ta boutique
*/
export function marketplace({ price, cogs = 0, commission = 0, fixedFee = 0, siteFees = 0, siteAds = 0 }) {
  price = num(price); cogs = num(cogs); commission = num(commission); fixedFee = num(fixedFee); siteFees = num(siteFees); siteAds = num(siteAds);
  if (!(price > 0) || !(cogs >= 0) || !(commission >= 0) || commission > 100 || !(fixedFee >= 0) || !(siteFees >= 0) || siteFees > 100 || !(siteAds >= 0)) return null;
  const mpCost = price * (commission / 100) + fixedFee;
  const siteCost = price * (siteFees / 100) + siteAds;
  const mp = price - cogs - mpCost;
  const site = price - cogs - siteCost;
  return { mp: round(mp), site: round(site), gap: round(site - mp), mpCost: round(mpCost), siteCost: round(siteCost),
    // Publicité par vente à partir de laquelle ta boutique ne rapporte plus davantage.
    adsLimit: round(Math.max(0, mpCost - price * (siteFees / 100))) };
}

/* ---------- Budget ---------- */

/*
  Le budget d'un mois, comparé au repère 50 / 30 / 20.
    income : revenus nets du mois ;  needs : dépenses obligatoires ;  wants : envies
*/
export const BUDGET_RULE = { needs: 50, wants: 30, savings: 20 };
export function budgetSplit({ income, needs = 0, wants = 0 }) {
  income = num(income); needs = num(needs); wants = num(wants);
  if (!(income > 0) || !(needs >= 0) || !(wants >= 0)) return null;
  const savings = income - needs - wants;
  const pct = (x) => round((x / income) * 100, 1);
  return { savings: round(savings), needsPct: pct(needs), wantsPct: pct(wants), savingsPct: pct(savings),
    target: { needs: round((income * BUDGET_RULE.needs) / 100), wants: round((income * BUDGET_RULE.wants) / 100), savings: round((income * BUDGET_RULE.savings) / 100) },
    yearly: round(savings * 12) };
}

/*
  Rembourser une dette (carte, crédit renouvelable…) avec un versement fixe.
    balance : reste dû ;  rate : taux, en % par an ;  payment : versement par mois
    extra   : versement en plus chaque mois, pour comparer
  → months (null = le versement ne couvre pas les intérêts), intérêts payés, série par année.
*/
function payDown(balance, r, payment) {
  let b = balance;
  let interest = 0;
  const series = [{ year: 0, balance: round(b) }];
  for (let m = 1; m <= 600; m++) {
    const i = b * r;
    if (payment <= i + 1e-9) return { months: null, interest: null, series };
    interest += i;
    b = b + i - payment;
    if (b <= 0) { series.push({ year: Math.ceil(m / 12), balance: 0 }); return { months: m, interest: round(interest), series, last: round(payment + b) }; }
    if (m % 12 === 0) series.push({ year: m / 12, balance: round(b) });
  }
  return { months: null, interest: null, series };
}
export function debtPayoff({ balance, rate, payment, extra = 0 }) {
  balance = num(balance); rate = num(rate); payment = num(payment); extra = num(extra);
  if (!(balance > 0) || !(rate >= 0) || rate > 100 || !(payment > 0) || !(extra >= 0)) return null;
  const r = rate / 100 / 12;
  const base = payDown(balance, r, payment);
  const more = extra > 0 ? payDown(balance, r, payment + extra) : null;
  return { months: base.months, interest: base.interest, series: base.series, firstInterest: round(balance * r),
    moreMonths: more ? more.months : null, moreInterest: more ? more.interest : null,
    saved: more && base.interest != null && more.interest != null ? round(base.interest - more.interest) : null,
    minPayment: round(balance * r + 0.01) };
}

/*
  Un achat, compté en heures de travail, et ce qu'il deviendrait s'il était placé.
    price  : prix de l'achat ;  income : revenu net par mois ;  hours : heures travaillées par mois
    years, rate : durée et rendement par an si la somme était placée à la place
*/
export function workHours({ price, income, hours, years = 0, rate = 0 }) {
  price = num(price); income = num(income); hours = num(hours); years = num(years); rate = num(rate);
  if (!(price > 0) || !(income > 0) || !(hours > 0) || hours > 744 || !(years >= 0) || years > 60 || !(rate > -100) || rate > 100) return null;
  const hourly = income / hours;
  const worked = price / hourly;
  return { hourly: round(hourly), hours: round(worked, 1), days: round(worked / 7, 1), share: round((price / income) * 100, 1),
    later: round(price * (1 + rate / 100) ** years) };
}

/*
  Ce que coûte vraiment une voiture.
    price   : prix d'achat ;  years : années de garde ;  resale : valeur de revente, en % du prix
    km      : kilomètres par an ;  use : consommation pour 100 km (litres ou kWh)
    energy  : prix d'un litre ou d'un kWh ;  fixed : assurance, entretien, stationnement… par an
*/
export function carCost({ price, years, resale = 0, km, use = 0, energy = 0, fixed = 0 }) {
  price = num(price); years = num(years); resale = num(resale); km = num(km); use = num(use); energy = num(energy); fixed = num(fixed);
  if (!(price >= 0) || !(years > 0) || years > 40 || !(resale >= 0) || resale > 100 || !(km >= 0) || !(use >= 0) || !(energy >= 0) || !(fixed >= 0)) return null;
  const loss = (price * (1 - resale / 100)) / years;
  const fuel = (km * use * energy) / 100;
  const year = loss + fuel + fixed;
  return { loss: round(loss), fuel: round(fuel), fixed: round(fixed), year: round(year), month: round(year / 12),
    perKm: km > 0 ? round(year / km, 2) : null, total: round(year * years) };
}

/* ---------- Studio Start-Up ---------- */

const clamp = (x, lo, hi, fallback = lo) => { const n = num(x); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback; };

/*
  Le plan financier d'une start-up, mois par mois.
    cash        : trésorerie au départ
    price       : revenu par client et par mois
    start       : clients au départ
    newPerMonth : nouveaux clients le premier mois ;  growth : leur hausse, en % par mois
    churn       : clients qui partent, en % par mois
    costs       : dépenses fixes par mois [{ amount }]
    hires       : embauches [{ month, salary }] : le coût complet à partir de ce mois-là
  → series (mois 1 à `months`), breakEven (mois à partir duquel les revenus
    couvrent les dépenses jusqu'à la fin du plan, null sinon), runway (mois entiers avant de passer sous zéro,
    null = tient tout le plan), need (argent qui manque au plus bas).
*/
export function startupPlan({ cash = 0, price = 0, start = 0, newPerMonth = 0, growth = 0, churn = 0, costs = [], hires = [] } = {}, months = 24) {
  cash = num(cash); price = num(price); start = num(start); newPerMonth = num(newPerMonth); growth = num(growth); churn = num(churn);
  if (!(cash >= 0) || !(price >= 0) || !(start >= 0) || !(newPerMonth >= 0) || !(growth >= -50) || growth > 100 || !(churn >= 0) || churn > 100) return null;
  if (!Array.isArray(costs) || !Array.isArray(hires)) return null;
  const fixed = costs.reduce((s, c) => s + (num(c && c.amount) >= 0 ? num(c.amount) : NaN), 0);
  if (!Number.isFinite(fixed)) return null;
  for (const x of hires) if (!(num(x && x.salary) >= 0) || !(num(x && x.month) >= 1)) return null;
  const series = [];
  let customers = start;
  let balance = cash;
  let breakEven = null;
  let runway = null;
  let min = cash;
  for (let m = 1; m <= months; m++) {
    customers = customers * (1 - churn / 100) + newPerMonth * (1 + growth / 100) ** (m - 1);
    const revenue = customers * price;
    const out = fixed + hires.reduce((s, x) => s + (num(x.month) <= m ? num(x.salary) : 0), 0);
    balance += revenue - out;
    if (!Number.isFinite(balance)) return null;
    if (runway == null && balance < 0) runway = m - 1;
    min = Math.min(min, balance);
    series.push({ month: m, customers: round(customers, 1), revenue: round(revenue), costs: round(out), cash: round(balance) });
  }
  // L'équilibre : le mois à partir duquel les revenus couvrent les dépenses jusqu'à la fin du plan.
  for (let m = months; m >= 1 && series[m - 1].revenue >= series[m - 1].costs && series[m - 1].costs > 0; m--) breakEven = m;
  const at = (m) => series[Math.min(m, months) - 1];
  return { series, breakEven, runway, need: round(Math.max(0, -min)), lowest: round(min), months,
    burn: round(series[0].costs - series[0].revenue), revenue12: at(12).revenue, customers12: at(12).customers,
    totalRevenue: round(series.reduce((s, p) => s + p.revenue, 0)), totalCosts: round(series.reduce((s, p) => s + p.costs, 0)) };
}

/*
  La table de capitalisation : la part de chaque associé et la réserve pour
  les salariés, en % du capital. `free` : ce qui n'est attribué à personne.
*/
export function capTable({ founders = [], pool = 0 } = {}) {
  pool = num(pool);
  if (!Array.isArray(founders) || !(pool >= 0) || pool > 50) return null;
  const shares = founders.map((f) => num(f && f.share));
  if (shares.some((s) => !(s >= 0))) return null;
  const total = shares.reduce((s, x) => s + x, 0);
  const free = 100 - pool - total;
  return { shares: shares.map((s) => round(s, 2)), total: round(total, 2), pool: round(pool, 2), free: round(free, 2), ok: free > -0.005 };
}

/*
  Le suivi des vrais chiffres, mois par mois : [{ month: 'AAAA-MM', revenue, customers, spend }].
  → les lignes triées, avec la croissance du revenu sur le mois d'avant et la
    perte du mois (dépenses − revenus), et la croissance moyenne des trois derniers mois.
*/
export function kpiTrend(rows = []) {
  if (!Array.isArray(rows)) return null;
  const list = rows.filter((r) => r && typeof r.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(r.month))
    .map((r) => ({ month: r.month, revenue: Math.max(0, num(r.revenue) || 0), customers: Math.max(0, num(r.customers) || 0), spend: Math.max(0, num(r.spend) || 0) }))
    .sort((a, b) => a.month.localeCompare(b.month));
  const out = list.map((r, i) => {
    const prev = list[i - 1];
    return { ...r, burn: round(r.spend - r.revenue), growth: prev && prev.revenue > 0 ? round((r.revenue / prev.revenue - 1) * 100, 1) : null };
  });
  const recent = out.slice(-3).map((r) => r.growth).filter((g) => g != null);
  return { rows: out, last: out[out.length - 1] || null, avgGrowth: recent.length ? round(recent.reduce((s, g) => s + g, 0) / recent.length, 1) : null };
}

/*
  Une start-up lue depuis le navigateur ou depuis un fichier importé : tout ce
  qui n'a pas la bonne forme est corrigé ou retiré. `null` si ce n'est pas une start-up.
*/
export const STARTUP_LIMITS = { name: 60, text: 160, founders: 8, costs: 20, hires: 20, tasks: 80, kpis: 60 };
export function cleanStartup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const L = STARTUP_LIMITS;
  const str = (x, max = L.text) => String(typeof x === 'string' ? x : '').replace(/\s+/g, ' ').trim().slice(0, max);
  const name = str(data.name, L.name);
  if (!name) return null;
  const list = (x, max) => (Array.isArray(x) ? x.slice(0, max) : []);
  const plan = data.plan && typeof data.plan === 'object' ? data.plan : {};
  return {
    id: typeof data.id === 'string' && /^[a-z0-9]{4,24}$/.test(data.id) ? data.id : 's' + Math.random().toString(36).slice(2, 10),
    name,
    pitch: str(data.pitch),
    sector: str(data.sector, L.name),
    stage: Math.round(clamp(data.stage, 0, 5, 0)),
    founders: list(data.founders, L.founders).map((f) => ({ name: str(f && f.name, L.name), role: str(f && f.role, L.name), share: clamp(f && f.share, 0, 100, 0) })),
    pool: clamp(data.pool, 0, 50, 0),
    plan: {
      cash: clamp(plan.cash, 0, 1e12, 0), price: clamp(plan.price, 0, 1e9, 0), start: clamp(plan.start, 0, 1e9, 0),
      newPerMonth: clamp(plan.newPerMonth, 0, 1e9, 0), growth: clamp(plan.growth, -50, 100, 0), churn: clamp(plan.churn, 0, 100, 0),
      costs: list(plan.costs, L.costs).map((c) => ({ label: str(c && c.label, L.name), amount: clamp(c && c.amount, 0, 1e9, 0) })),
      hires: list(plan.hires, L.hires).map((x) => ({ label: str(x && x.label, L.name), month: Math.round(clamp(x && x.month, 1, 24, 1)), salary: clamp(x && x.salary, 0, 1e9, 0) })),
    },
    tasks: list(data.tasks, L.tasks).map((t) => ({ text: str(t && t.text), state: ['todo', 'doing', 'done'].includes(t && t.state) ? t.state : 'todo', tool: t && typeof t.tool === 'string' && /^[a-z]{2,20}$/.test(t.tool) ? t.tool : '' }))
      .filter((t) => t.text),
    kpis: list(data.kpis, L.kpis).filter((k) => k && typeof k.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(k.month))
      .map((k) => ({ month: k.month, revenue: clamp(k.revenue, 0, 1e12, 0), customers: clamp(k.customers, 0, 1e9, 0), spend: clamp(k.spend, 0, 1e12, 0) })),
  };
}
