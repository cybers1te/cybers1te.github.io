// Tests des calculs de la plateforme marketbuss (aucune dépendance, aucun réseau).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  breakEven, compound, decodeCard, dilution, encodeCard, exitReturn, maxValuation, runway, unitEconomics,
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
