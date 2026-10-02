// Tests des calculs de la plateforme marketbuss (aucune dépendance, aucun réseau).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  breakEven, compound, convertible, dayRate, decodeCard, dilution, encodeCard, exitReturn, fees, funnel, inflation, marketSize, maxValuation,
  phraseParts, portfolio, pricing, raiseNeed, runway, unitEconomics, waterfall,
  cushion, discount, drawdown, growthRate, proRata, quote, revenueTarget, rounds, savingsGoal, scorecard, setAside, vesting,
  mortgage, borrowingCapacity, rentalYield, rentalCashflow, rentOrBuy, adsProfit, freeShipping, reorder, returnsCost, marketplace,
  budgetSplit, debtPayoff, workHours, carCost,
} from '../site/calculs.js';

describe('entrepreneur', () => {
  it('runway : mois avant de passer sous zéro', () => {
    const r = runway({ cash: 60000, burn: 10000, revenue: 0, growth: 0 });
    assert.equal(r.months, 6, '60 000 / 10 000 : six mois pleins, le septième passe sous zéro');
    assert.equal(r.series[6].cash, 0);
    assert.equal(r.series[7].cash, -10000);
    assert.equal(r.breakEven, null);
    assert.equal(r.netBurn, 10000);
  });

  it('runway : des revenus qui grandissent peuvent sauver la mise', () => {
    const r = runway({ cash: 30000, burn: 10000, revenue: 6000, growth: 10 });
    assert.equal(r.months, null, 'ne passe jamais sous zéro');
    assert.equal(r.breakEven, 7, '6 000 × 1,1^6 = 10 629 : rentable au 7e mois');
    assert.ok(Math.min(...r.series.map((p) => p.cash)) > 0);
    // Sans croissance, la même entreprise tient 7 mois.
    assert.equal(runway({ cash: 30000, burn: 10000, revenue: 6000, growth: 0 }).months, 7);
  });

  it('runway : entrées absurdes', () => {
    assert.equal(runway({ cash: -1, burn: 10 }), null);
    assert.equal(runway({ cash: 10, burn: NaN }), null);
    assert.equal(runway({ cash: 0, burn: 0 }).months, null);
  });

  it('dilution : part des fondateurs après la levée', () => {
    const d = dilution({ pre: 2000000, raise: 500000, pool: 10, founders: 100 });
    assert.equal(d.post, 2500000);
    assert.equal(d.investors, 20);
    assert.equal(d.founders, 70, '100 % − 20 % d\'investisseurs − 10 % de réserve');
    assert.equal(d.lost, 30);
    assert.equal(d.investors + d.pool + d.founders + d.others, 100);
    const e = dilution({ pre: 3000000, raise: 1000000, pool: 0, founders: 80 });
    assert.equal(e.investors, 25);
    assert.equal(e.founders, 60);
    assert.equal(e.others, 15);
    assert.equal(dilution({ pre: 100, raise: 900, pool: 10 }), null, 'plus rien à partager');
    assert.equal(dilution({ pre: 0, raise: 100 }), null);
  });

  it('seuil de rentabilité', () => {
    const b = breakEven({ price: 50, variable: 20, fixed: 3000 });
    assert.deepEqual(b, { margin: 30, marginRate: 60, units: 100, revenue: 5000 });
    assert.equal(breakEven({ price: 50, variable: 20, fixed: 3010 }).units, 101, 'arrondi à la vente du dessus');
    assert.equal(breakEven({ price: 10, variable: 12, fixed: 100 }).units, null, 'chaque vente perd de l\'argent');
    assert.equal(breakEven({ price: 0, fixed: 100 }), null);
  });

  it('coût et valeur d\'un client', () => {
    const u = unitEconomics({ spend: 5000, customers: 50, arpu: 40, margin: 75, churn: 5 });
    assert.deepEqual(u, { cac: 100, lifetime: 20, ltv: 600, ratio: 6, payback: 3.3 });
    assert.equal(unitEconomics({ spend: 100, customers: 0, arpu: 10, churn: 5 }), null);
    assert.equal(unitEconomics({ spend: 0, customers: 10, arpu: 10, churn: 10 }).ratio, null, 'clients gratuits : pas de ratio');
  });
});

describe('investisseur', () => {
  it('retour sur un ticket', () => {
    const r = exitReturn({ ticket: 50000, post: 2500000, dilution: 50, exit: 30000000, years: 6 });
    assert.equal(r.stake, 2);
    assert.equal(r.stakeExit, 1);
    assert.equal(r.proceeds, 300000);
    assert.equal(r.multiple, 6);
    assert.equal(r.irr, 34.8, '6^(1/6) − 1');
    assert.equal(exitReturn({ ticket: 100, post: 1000, exit: 0, years: 5 }).irr, -100);
    assert.equal(exitReturn({ ticket: 100, post: 50, exit: 10, years: 5 }), null, 'ticket plus gros que la société');
    assert.equal(exitReturn({ ticket: 100, post: 1000, exit: 100000, years: 0.0001 }), null, 'durée trop courte : rendement annuel sans sens');
    assert.equal(runway({ cash: 1, burn: 1, revenue: 1e300, growth: 1000 }), null, 'chiffres qui débordent');
    assert.equal(compound({ initial: 1e308, monthly: 1e308, rate: 1000, years: 60 }), null, 'chiffres qui débordent');
    assert.equal(compound({ initial: 1, monthly: 1, rate: 999999999999, years: 5 }), null, 'rendement absurde');
  });

  it('intérêts composés', () => {
    const c = compound({ initial: 1000, monthly: 0, rate: 10, years: 2 });
    assert.equal(c.value, 1210);
    assert.equal(c.gain, 210);
    assert.deepEqual(c.series.map((p) => p.value), [1000, 1100, 1210]);
    const d = compound({ initial: 0, monthly: 100, rate: 0, years: 3 });
    assert.equal(d.value, 3600);
    assert.equal(d.paid, 3600);
    const e = compound({ initial: 0, monthly: 100, rate: 7, years: 10 });
    assert.ok(e.value > 17000 && e.value < 17400, String(e.value));
    assert.equal(compound({ rate: 5, years: 0 }), null);
  });

  it('valorisation maximale pour viser un multiple', () => {
    const v = maxValuation({ exit: 50000000, multiple: 10, dilution: 50, ticket: 100000 });
    assert.deepEqual(v, { post: 2500000, pre: 2400000, stake: 4 });
    // Cohérent avec le retour sur ticket : à cette valorisation, on obtient bien le multiple visé.
    assert.equal(exitReturn({ ticket: 100000, post: v.post, dilution: 50, exit: 50000000, years: 7 }).multiple, 10);
    assert.equal(maxValuation({ exit: 1000, multiple: 2 }).pre, null);
    assert.equal(maxValuation({ exit: 1000, multiple: 0 }), null);
  });
});

describe('carte de pitch', () => {
  it('aller-retour, accents compris', () => {
    const card = { name: 'Nordlys', tagline: 'Aide les boulangeries à réduire leurs invendus', stage: 'Pré-seed', t1: '38 clients', ask: '800 k€' };
    const text = encodeCard(card);
    assert.match(text, /^[A-Za-z0-9_-]+$/);
    assert.deepEqual(decodeCard(text), card);
  });

  it('nettoie : champs inconnus, longueurs, espaces', () => {
    const text = encodeCard({ name: '  Mon   projet  ', tagline: 'x'.repeat(500), evil: '<script>', stage: '' });
    const card = decodeCard(text);
    assert.equal(card.name, 'Mon projet');
    assert.equal(card.tagline.length, 120);
    assert.equal('evil' in card, false);
    assert.equal('stage' in card, false);
  });

  it('refuse ce qui n\'est pas une carte', () => {
    assert.equal(decodeCard(''), null);
    assert.equal(decodeCard('pas du base64 !'), null);
    assert.equal(decodeCard(btoa('[1,2]')), null);
    assert.equal(decodeCard(btoa('{"tagline":"sans nom"}')), null);
    assert.equal(decodeCard(btoa(JSON.stringify({ name: 42 }))), null);
    assert.equal(decodeCard('A'.repeat(3000)), null);
  });
});

describe('nouvelles bornes', () => {
  it('marketSize : du marché total à la part visée', () => {
    const r = marketSize({ customers: 200000, price: 600, reachable: 20, share: 5 });
    assert.deepEqual([r.tam, r.sam, r.som], [120000000, 24000000, 1200000]);
    assert.equal(r.somCustomers, 2000);
    assert.equal(marketSize({ customers: 100, price: 10, reachable: 120, share: 5 }), null, 'plus de 100 %');
  });

  it('raiseNeed : montant à lever et part cédée', () => {
    const r = raiseNeed({ burn: 25000, revenue: 5000, months: 18, buffer: 20, pre: 2000000 });
    assert.equal(r.raise, 432000, '20 000 × 18 mois, plus 20 %');
    assert.equal(r.post, 2432000);
    assert.equal(r.investors, 17.76);
    const rentable = raiseNeed({ burn: 5000, revenue: 9000, months: 18, buffer: 20, pre: 2000000 });
    assert.equal(rentable.raise, 0, 'déjà rentable : rien à lever pour tenir');
    assert.equal(rentable.investors, null);
    assert.equal(raiseNeed({ burn: 1, revenue: 0, months: 0 }), null);
  });

  it('pricing : la marge se compte sur le prix de vente', () => {
    const r = pricing({ cost: 12, margin: 60, vat: 21 });
    assert.equal(r.ht, 30, '12 € de coût = 40 % du prix : 30 €');
    assert.equal(r.ttc, 36.3);
    assert.equal(r.marginAmount, 18);
    assert.equal(r.markup, 150, '18 € de marge pour 12 € de coût');
    assert.equal(pricing({ cost: 12, margin: 100, vat: 21 }), null, 'une marge de 100 % est impossible');
    assert.equal(pricing({ cost: 0, margin: 10 }), null);
  });

  it('dayRate : du revenu net visé au tarif par jour', () => {
    const r = dayRate({ net: 2000, days: 10, weeks: 0, charges: 50, costs: 0 });
    assert.equal(r.revenue, 48000, '24 000 € nets : le double à facturer avec 50 % de charges');
    assert.equal(r.billable, 120);
    assert.equal(r.rate, 400);
    assert.equal(r.hourly, 50);
    assert.equal(dayRate({ net: 2000, days: 10, weeks: 52, charges: 50 }), null, 'aucune semaine travaillée');
    assert.equal(dayRate({ net: 2000, days: 10, charges: 100 }), null);
  });

  it('funnel : des visiteurs aux clients', () => {
    const r = funnel({ visitors: 5000, signup: 4, purchase: 20, basket: 60, spend: 1500 });
    assert.deepEqual([r.leads, r.customers, r.revenue], [200, 40, 2400]);
    assert.equal(r.rate, 0.8);
    assert.equal(r.costPerCustomer, 37.5);
    assert.equal(r.result, 900);
    const vide = funnel({ visitors: 0, signup: 4, purchase: 20, basket: 60, spend: 100 });
    assert.equal(vide.costPerCustomer, null, 'aucun client : pas de coût par client');
    assert.equal(funnel({ visitors: 10, signup: 101, purchase: 20, basket: 60 }), null);
  });

  it('portfolio : le résultat dépend de quelques gagnants', () => {
    const r = portfolio({ count: 20, ticket: 5000, fail: 70, mid: 25, midMultiple: 1.5, winMultiple: 20 });
    assert.equal(r.invested, 100000);
    assert.equal(r.multiple, 1.38);
    assert.equal(r.withoutWinners, 0.38);
    assert.deepEqual([r.fails, r.mids, r.winners], [14, 5, 1]);
    assert.equal(portfolio({ count: 20, ticket: 5000, fail: 80, mid: 30, midMultiple: 1, winMultiple: 10 }), null, 'plus de 100 %');
    assert.equal(portfolio({ count: 2.5, ticket: 5000, fail: 50, mid: 30, midMultiple: 1, winMultiple: 10 }), null);
  });

  it('convertible : le plafond ou la décote, au plus avantageux', () => {
    const cap = convertible({ amount: 100000, cap: 3000000, discount: 20, pre: 5000000, raise: 1000000 });
    assert.equal(cap.rule, 'cap');
    assert.equal(cap.effective, 3000000);
    assert.equal(cap.stake, 2.7);
    assert.ok(Math.abs(cap.stake + cap.existing + cap.newInvestors - 100) < 0.05, 'les parts font 100 %');
    const decote = convertible({ amount: 100000, cap: 0, discount: 20, pre: 5000000, raise: 1000000 });
    assert.equal(decote.rule, 'discount');
    assert.equal(decote.effective, 4000000);
    const rien = convertible({ amount: 100000, cap: 9000000, discount: 0, pre: 5000000, raise: 0 });
    assert.equal(rien.rule, 'none');
    assert.equal(rien.stake, rien.atRound, 'ni plafond utile ni décote : même prix que le tour');
    assert.equal(convertible({ amount: 100000, cap: 0, discount: 100, pre: 5000000 }), null);
  });

  it('waterfall : la préférence passe avant le partage', () => {
    const petit = waterfall({ exit: 4000000, invested: 2000000, stake: 25, multiple: 1 });
    assert.equal(petit.investors, 2000000, 'la mise d\'abord : mieux que 25 % de 4 M');
    assert.equal(petit.others, 2000000);
    assert.equal(petit.converts, false);
    assert.equal(petit.threshold, 8000000);
    const gros = waterfall({ exit: 20000000, invested: 2000000, stake: 25, multiple: 1 });
    assert.equal(gros.investors, 5000000);
    assert.equal(gros.converts, true);
    const maigre = waterfall({ exit: 1000000, invested: 2000000, stake: 25, multiple: 1 });
    assert.deepEqual([maigre.investors, maigre.others], [1000000, 0], 'jamais plus que le prix de vente');
    assert.equal(waterfall({ exit: 1, invested: 1, stake: 0 }), null);
  });

  it('fees : les frais se paient sur toute la durée', () => {
    const r = fees({ initial: 1000, monthly: 100, rate: 6, feeA: 0.3, feeB: 2, years: 30 });
    assert.equal(r.paid, 37000);
    assert.ok(r.free > r.a && r.a > r.b);
    assert.equal(r.gap, Math.round((r.a - r.b) * 100) / 100);
    assert.equal(r.series.length, 31);
    const egal = fees({ initial: 1000, monthly: 0, rate: 5, feeA: 1, feeB: 1, years: 10 });
    assert.equal(egal.gap, 0);
    assert.equal(fees({ initial: 1000, monthly: 0, rate: 5, feeA: -1, feeB: 1, years: 10 }), null);
  });

  it('inflation : ce que la somme vaut vraiment plus tard', () => {
    const r = inflation({ amount: 10000, inflation: 2, years: 20, rate: 0 });
    assert.equal(r.real, 6729.71);
    assert.equal(r.lost, 32.7);
    const suit = inflation({ amount: 10000, inflation: 2, years: 20, rate: 2 });
    assert.equal(suit.real, 10000, 'un rendement égal à l\'inflation garde le pouvoir d\'achat');
    assert.equal(suit.realRate, 0);
    assert.equal(inflation({ amount: 10000, inflation: 2, years: 2.5 }), null);
  });

  it('phraseParts : nettoie les morceaux du pitch', () => {
    const p = phraseParts({ name: '  Nordlys ', who: 'Les   boulangeries', solution: 'Vendre leurs invendus.', edge: 'x'.repeat(500) });
    assert.equal(p.name, 'Nordlys');
    assert.equal(p.who, 'Les boulangeries');
    assert.equal(p.solution, 'Vendre leurs invendus', 'la ponctuation finale saute');
    assert.equal(p.edge.length, 120, 'coupé à la longueur maximale');
    assert.equal(phraseParts({ name: '', who: 'x', solution: 'y' }), null);
    assert.equal(phraseParts(null), null);
  });
});

describe('bornes supplémentaires', () => {
  it('vesting : rien avant le cliff, puis au prorata du temps', () => {
    assert.equal(vesting({ stake: 25, years: 4, cliff: 12, elapsed: 11 }).vested, 0);
    assert.equal(vesting({ stake: 25, years: 4, cliff: 12, elapsed: 11 }).toCliff, 1);
    const r = vesting({ stake: 24, years: 4, cliff: 12, elapsed: 12 });
    assert.equal(r.vested, 6, 'un quart au bout d\'un an');
    assert.equal(r.left, 36);
    assert.equal(vesting({ stake: 24, years: 4, cliff: 12, elapsed: 400 }).vested, 24, 'jamais plus que l\'attribution');
    assert.equal(vesting({ stake: 24, years: 1, cliff: 13, elapsed: 2 }), null, 'cliff plus long que la durée');
  });

  it('revenueTarget : nouveaux clients par mois, départs compris', () => {
    const sansDepart = revenueTarget({ target: 10000, price: 50, current: 80, churn: 0, months: 12 });
    assert.equal(sansDepart.needed, 200);
    assert.equal(sansDepart.perMonth, 10, '120 clients à gagner en 12 mois');
    const avec = revenueTarget({ target: 10000, price: 50, current: 40, churn: 3, months: 12 });
    assert.ok(avec.perMonth > 160 / 12, 'il faut aussi remplacer ceux qui partent');
    assert.equal(revenueTarget({ target: 1000, price: 50, current: 500, churn: 0, months: 6 }).perMonth, 0, 'objectif déjà atteint');
    assert.equal(revenueTarget({ target: 1000, price: 0, months: 6 }), null);
  });

  it('growthRate : croissance par mois', () => {
    const r = growthRate({ from: 1000, to: 2000, months: 12 });
    assert.equal(r.monthly, 5.95);
    assert.equal(r.yearly, 100);
    assert.equal(r.doubling, 12);
    assert.equal(growthRate({ from: 2000, to: 1000, months: 12 }).doubling, null, 'en baisse : pas de doublement');
    assert.equal(growthRate({ from: 0, to: 1000, months: 12 }), null);
  });

  it('discount : une remise se rattrape en volume', () => {
    const r = discount({ price: 50, margin: 40, discount: 10 });
    assert.equal(r.newPrice, 45);
    assert.deepEqual([r.before, r.after], [20, 15]);
    assert.equal(r.extra, 33.3, 'un tiers de ventes en plus pour gagner autant');
    assert.equal(discount({ price: 50, margin: 20, discount: 20 }).extra, null, 'la remise mange toute la marge');
    assert.equal(discount({ price: 50, margin: 0, discount: 10 }), null);
  });

  it('quote : devis, TVA et acompte', () => {
    const r = quote({ days: 8, rate: 400, buffer: 15, expenses: 120, vat: 21, deposit: 30 });
    assert.equal(r.ht, 3800, '3 200 + 480 d\'imprévus + 120 de frais');
    assert.equal(r.ttc, 4598);
    assert.equal(r.depositAmount, 1379.4);
    assert.equal(Math.round((r.depositAmount + r.balance) * 100) / 100, r.ttc);
    assert.equal(quote({ days: 0, rate: 400 }), null);
  });

  it('setAside : ce qui est à toi sur une facture', () => {
    const r = setAside({ amount: 2000, vat: 21, charges: 40 });
    assert.deepEqual([r.ttc, r.vatAmount, r.chargesAmount, r.yours], [2420, 420, 800, 1200]);
    assert.equal(r.aside, 1220);
    assert.equal(setAside({ amount: 2000, vat: 21, charges: 101 }), null);
  });

  it('proRata : suivre pour garder sa part', () => {
    const r = proRata({ stake: 2, pre: 8000000, raise: 2000000 });
    assert.equal(r.invest, 40000, '2 % de la levée');
    assert.equal(r.without, 1.6);
    assert.equal(proRata({ stake: 2, pre: 0, raise: 1 }), null);
  });

  it('rounds : chaque levée réduit la part', () => {
    const r = rounds({ stake: 10, rounds: 3, dilution: 20 });
    assert.equal(r.final, 5.12);
    assert.equal(r.kept, 51.2);
    assert.equal(r.series.length, 4);
    assert.equal(rounds({ stake: 10, rounds: 2.5, dilution: 20 }), null);
  });

  it('scorecard : note sur 100 et point le plus faible', () => {
    const r = scorecard({ team: 8, market: 6, traction: 3, product: 7, terms: 5 });
    assert.equal(r.score, 60.5);
    assert.equal(r.weakest, 'traction');
    assert.equal(scorecard({ team: 10, market: 10, traction: 10, product: 10, terms: 10 }).score, 100);
    assert.equal(scorecard({ team: 11, market: 6, traction: 3, product: 7, terms: 5 }), null);
    assert.equal(scorecard({ team: 8 }), null, 'une note manquante');
  });

  it('savingsGoal : versement mensuel pour atteindre un objectif', () => {
    const r = savingsGoal({ target: 12000, years: 10, rate: 0, initial: 0 });
    assert.equal(r.monthly, 100);
    const avec = savingsGoal({ target: 20000, years: 10, rate: 4, initial: 1000 });
    const verif = compound({ initial: 1000, monthly: avec.monthly, rate: 4, years: 10 });
    assert.ok(Math.abs(verif.value - 20000) < 1, 'le versement trouvé mène bien à l\'objectif');
    assert.equal(savingsGoal({ target: 1000, years: 10, rate: 5, initial: 5000 }).monthly, 0, 'déjà assez');
    assert.equal(savingsGoal({ target: 1000, years: 0.5 }), null);
  });

  it('drawdown : durée d\'un capital qui verse un revenu', () => {
    const r = drawdown({ capital: 12000, monthly: 1000, rate: 0 });
    assert.equal(r.months, 12);
    assert.equal(r.forever, false);
    const sansFin = drawdown({ capital: 100000, monthly: 200, rate: 3 });
    assert.equal(sansFin.forever, true, 'le retrait est plus petit que ce que le capital rapporte');
    assert.equal(sansFin.months, null);
    assert.equal(drawdown({ capital: 100000, monthly: 0, rate: 3 }), null);
  });

  it('cushion : épargne de précaution', () => {
    const r = cushion({ expenses: 1500, months: 4, saved: 1000, monthly: 200 });
    assert.deepEqual([r.target, r.missing, r.wait], [6000, 5000, 25]);
    assert.equal(cushion({ expenses: 1500, months: 4, saved: 9000, monthly: 0 }).wait, 0, 'déjà couvert');
    assert.equal(cushion({ expenses: 1500, months: 4, saved: 0, monthly: 0 }).wait, null, 'sans épargne, jamais');
    assert.equal(cushion({ expenses: 0, months: 4 }), null);
  });
});

describe('immobilier', () => {
  it('mortgage : mensualité, coût et tableau par année', () => {
    const r = mortgage({ amount: 200000, rate: 3.5, years: 20, insurance: 0.3 });
    assert.equal(r.payment, 1159.92, 'formule de la mensualité constante');
    assert.equal(r.insurance, 50);
    assert.equal(r.monthly, 1209.92);
    assert.equal(r.series.length, 20);
    assert.equal(r.series[19].balance, 0);
    const capital = r.series.reduce((s, y) => s + y.principal, 0);
    assert.ok(Math.abs(capital - 200000) < 1, 'tout le capital est remboursé');
    assert.ok(r.series[0].interest > r.series[19].interest, 'les intérêts pèsent surtout au début');
    assert.equal(mortgage({ amount: 12000, rate: 0, years: 1 }).payment, 1000, 'à taux zéro');
    assert.equal(mortgage({ amount: 1000, rate: 3, years: 2.5 }), null);
  });
  it('borrowingCapacity : la mensualité maximale devient un montant', () => {
    const r = borrowingCapacity({ income: 4000, debts: 200, ratio: 35, rate: 0, years: 20 });
    assert.equal(r.maxMonthly, 1200);
    assert.equal(r.loan, 288000);
    assert.equal(borrowingCapacity({ income: 1000, debts: 900, ratio: 35, rate: 3, years: 20 }).loan, 0, 'déjà trop de crédits');
    const back = mortgage({ amount: borrowingCapacity({ income: 4000, ratio: 35, rate: 3.5, years: 25 }).loan, rate: 3.5, years: 25 });
    assert.ok(Math.abs(back.payment - 1400) < 0.02, 'la capacité redonne la mensualité de départ');
  });
  it('rentalYield : brut et net', () => {
    const r = rentalYield({ price: 200000, costs: 20000, rent: 1000, charges: 1800, vacancy: 1 });
    assert.equal(r.gross, 6);
    assert.equal(r.netIncome, 9200);
    assert.equal(r.net, 4.18);
    assert.equal(rentalYield({ price: 1, rent: 0, charges: 10 }).payback, null);
  });
  it('rentalCashflow : ce qui reste chaque mois', () => {
    const r = rentalCashflow({ rent: 900, vacancy: 0, charges: 150, loan: 800, works: 5 });
    assert.equal(r.cash, -95);
    assert.equal(r.yearly, -1140);
  });
  it('rentOrBuy : sans croissance ni placement, comparer est une affaire de mensualités', () => {
    const r = rentOrBuy({ price: 120000, buyCosts: 0, deposit: 120000, rate: 0, years: 1, rent: 1000, growth: 0, invest: 0, horizon: 1 });
    // Acheter comptant : 120 000 de logement, 1 % de frais par an, et le loyer non payé placé.
    assert.equal(r.loan, 0);
    assert.equal(r.buy, 120000 + 12 * (1000 - 100));
    assert.equal(r.rent, 120000);
    assert.equal(r.breakEven, 1);
    assert.equal(rentOrBuy({ price: 1, rate: 1, years: 1, rent: 1, horizon: 0 }), null);
  });
});

describe('e-commerce', () => {
  it('adsProfit : ROAS d\'équilibre et coût par commande', () => {
    const r = adsProfit({ basket: 50, cogs: 15, shipping: 5, fees: 2, spend: 1000, orders: 40 });
    assert.equal(r.margin, 29);
    assert.equal(r.breakEvenRoas, 1.72);
    assert.equal(r.roas, 2);
    assert.equal(r.cpa, 25);
    assert.equal(r.profit, 160);
    assert.equal(r.ordersNeeded, 35);
    assert.equal(adsProfit({ basket: 10, cogs: 12 }).breakEvenRoas, null, 'vendu à perte');
  });
  it('freeShipping : panier minimum', () => {
    const r = freeShipping({ basket: 40, margin: 50, shipping: 6, orders: 100 });
    assert.equal(r.extra, 12);
    assert.equal(r.threshold, 52);
    assert.equal(r.monthly, 600);
  });
  it('reorder : point de commande', () => {
    const r = reorder({ daily: 4, lead: 10, safety: 5, stock: 100, cost: 3 });
    assert.equal(r.point, 60);
    assert.equal(r.orderIn, 10);
    assert.equal(r.late, false);
    assert.equal(reorder({ daily: 4, lead: 10, safety: 5, stock: 30 }).late, true);
  });
  it('returnsCost : coût par retour', () => {
    const r = returnsCost({ orders: 200, rate: 10, basket: 60, cogs: 20, back: 6, lost: 25 });
    assert.equal(r.returned, 20);
    assert.equal(r.perReturn, 51);
    assert.equal(r.total, 1020);
    assert.equal(r.share, 12.8);
  });
  it('marketplace : ce qui reste par vente', () => {
    const r = marketplace({ price: 40, cogs: 12, commission: 15, fixedFee: 1, siteFees: 2, siteAds: 4 });
    assert.equal(r.mp, 21);
    assert.equal(r.site, 23.2);
    assert.equal(r.gap, 2.2);
    assert.equal(r.adsLimit, 6.2);
  });
});

describe('budget', () => {
  it('budgetSplit : 50 / 30 / 20', () => {
    const r = budgetSplit({ income: 2000, needs: 1100, wants: 600 });
    assert.equal(r.savings, 300);
    assert.equal(r.savingsPct, 15);
    assert.deepEqual(r.target, { needs: 1000, wants: 600, savings: 400 });
  });
  it('debtPayoff : durée, intérêts, et l\'effet d\'un versement en plus', () => {
    const r = debtPayoff({ balance: 1200, rate: 0, payment: 100 });
    assert.equal(r.months, 12);
    assert.equal(r.interest, 0);
    const card = debtPayoff({ balance: 3000, rate: 19, payment: 100, extra: 50 });
    assert.ok(card.moreMonths < card.months);
    assert.ok(card.saved > 0);
    assert.equal(debtPayoff({ balance: 10000, rate: 24, payment: 150 }).months, null, 'le versement ne couvre pas les intérêts');
  });
  it('workHours : un achat en heures', () => {
    const r = workHours({ price: 300, income: 1800, hours: 150, years: 10, rate: 0 });
    assert.equal(r.hourly, 12);
    assert.equal(r.hours, 25);
    assert.equal(r.later, 300);
  });
  it('carCost : par mois et par kilomètre', () => {
    const r = carCost({ price: 20000, years: 5, resale: 40, km: 12000, use: 6, energy: 1.8, fixed: 1200 });
    assert.equal(r.loss, 2400);
    assert.equal(r.fuel, 1296);
    assert.equal(r.year, 4896);
    assert.equal(r.month, 408);
    assert.equal(r.perKm, 0.41);
  });
});
