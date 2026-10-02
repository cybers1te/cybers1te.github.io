// Tests des langues de la plateforme marketbuss : les trois fichiers ont la
// même forme, couvrent toutes les bornes et tous les rayons, et leurs phrases
// se construisent sans trou (aucune dépendance, aucun réseau).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as calc from '../site/calculs.js';
import { CANVAS, GUIDES, LEVELS, ROLES, TOOLS } from '../site/contenu.js';
import { ARSENAL, VERIFIED } from '../site/arsenal.js';
import fr from '../site/lang/fr.js';
import en from '../site/lang/en.js';
import nl from '../site/lang/nl.js';

const PACKS = { fr, en, nl };

// La forme d'une valeur : les textes peuvent changer, pas la structure.
function shape(x) {
  if (Array.isArray(x)) return x.map(shape);
  if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map((k) => [k, shape(x[k])]));
  return typeof x;
}

// Les formats, comme dans arcade.js.
function formats(pack) {
  const nf = (n, d = 0) => new Intl.NumberFormat(pack.locale, { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n);
  return { nf, money: (n) => pack.money(n, nf), pct: (n, d = 1) => pack.pct(nf(n, d)), times: (n) => pack.times(nf(n, 1)), ord: pack.ord, plural: pack.plural };
}

// Quelle fonction de calcul sert quelle borne.
const CALC = {
  runway: calc.runway, lever: calc.raiseNeed, dilution: calc.dilution, vesting: calc.vesting, marche: calc.marketSize, client: calc.unitEconomics,
  objectif: calc.revenueTarget, croissance: calc.growthRate, tarif: calc.dayRate, devis: calc.quote, prix: calc.pricing, remise: calc.discount,
  seuil: calc.breakEven, tunnel: calc.funnel, tirelire: calc.setAside, ticket: calc.exitReturn, valo: calc.maxValuation, portefeuille: calc.portfolio,
  suivre: calc.proRata, fonte: calc.rounds, convertible: calc.convertible, cascade: calc.waterfall, note: calc.scorecard, composes: calc.compound,
  cible: calc.savingsGoal, frais: calc.fees, inflation: calc.inflation, reserve: calc.drawdown, coussin: calc.cushion,
  credit: calc.mortgage, capacite: calc.borrowingCapacity, rendement: calc.rentalYield, cashflow: calc.rentalCashflow, louer: calc.rentOrBuy,
  pub: calc.adsProfit, livraison: calc.freeShipping, stock: calc.reorder, retours: calc.returnsCost, marketplace: calc.marketplace,
  budget: calc.budgetSplit, dette: calc.debtPayoff, heures: calc.workHours, voiture: calc.carCost,
};

const clean = (text, where) => {
  assert.equal(typeof text, 'string', `${where} : pas un texte`);
  assert.ok(text.trim().length > 0, `${where} : vide`);
  assert.ok(!/undefined|NaN|\[object|null\b/.test(text), `${where} : texte abîmé « ${text} »`);
};

describe('langues : même forme partout', () => {
  for (const [code, pack] of Object.entries(PACKS)) {
    if (code === 'fr') continue;
    it(`${code} a la même structure que le français`, () => {
      assert.deepEqual(shape(pack), shape(fr));
      assert.equal(pack.code, code);
    });
    it(`${code} : le lexique suit le même ordre et les mêmes joueurs`, () => {
      assert.equal(pack.glossary.length, fr.glossary.length);
      pack.glossary.forEach((row, i) => assert.equal(row[1], fr.glossary[i][1], `mot n° ${i + 1} : ${row[0]}`));
      assert.equal(new Set(pack.glossary.map((r) => r[0])).size, pack.glossary.length, 'pas de doublon');
    });
  }
});

describe('langues : tout le site est couvert', () => {
  for (const [code, pack] of Object.entries(PACKS)) {
    it(`${code} : joueurs, guides, bornes, listes, parcours`, () => {
      assert.deepEqual(Object.keys(pack.roles).sort(), Object.keys(ROLES).sort());
      assert.deepEqual(Object.keys(pack.guides).sort(), Object.keys(GUIDES).sort());
      assert.deepEqual(Object.keys(pack.tools).sort(), TOOLS.map((t) => t.id).sort());
      assert.equal(pack.levels.length, LEVELS.length);
      assert.equal(pack.stages.length, LEVELS.length);
      assert.deepEqual(Object.keys(pack.ui.canvas.boxes).sort(), [...CANVAS].sort());
      assert.deepEqual(Object.keys(pack.ui.writer.fields), Object.keys(calc.PHRASE_FIELDS));
      assert.deepEqual(Object.keys(pack.ui.pitch.fields).sort(), Object.keys(calc.CARD_FIELDS).sort());
      for (const t of TOOLS) {
        const w = pack.tools[t.id];
        for (const key of ['name', 'question', 'lead', 'limits', 'tip']) clean(w[key], `${code} ${t.id}.${key}`);
        if (t.kind === 'calc') {
          assert.deepEqual(Object.keys(w.fields).sort(), t.fields.map((f) => f.key).sort(), `${code} ${t.id} : champs`);
          for (const [key, field] of Object.entries(w.fields)) { clean(field[0], `${code} ${t.id}.${key}`); assert.equal(typeof field[1], 'string'); }
          assert.ok(pack.res[t.id], `${code} ${t.id} : résultat`);
        }
        if (t.kind === 'checklist') assert.equal(pack.checklists[t.list].length, t.size, `${code} ${t.list}`);
        if (t.kind !== 'checklist') assert.ok(w.read && w.read.length >= 2, `${code} ${t.id} : mode d'emploi`);
      }
      assert.deepEqual(Object.keys(pack.res).sort(), TOOLS.filter((t) => t.kind === 'calc').map((t) => t.id).sort());
    });

    it(`${code} : l'arsenal`, () => {
      assert.deepEqual(Object.keys(pack.arsenal.cats).sort(), ARSENAL.map((c) => c.id).sort());
      for (const c of ARSENAL) {
        const w = pack.arsenal.cats[c.id];
        assert.equal(w.tools.length, c.tools.length, `${code} ${c.id} : une description par outil`);
        for (const text of [w.name, w.need, w.note, ...w.tools]) clean(text, `${code} ${c.id}`);
        for (const [, , access, where] of c.tools) {
          if (access) assert.ok(pack.arsenal.access[access], `${code} accès ${access}`);
          for (const place of where || []) assert.ok(pack.arsenal.places[place], `${code} lieu ${place}`);
        }
      }
    });

    it(`${code} : les résultats se disent sans trou, avec l'exemple de chaque borne`, () => {
      const F = formats(pack);
      for (const t of TOOLS.filter((x) => x.kind === 'calc')) {
        const v = Object.fromEntries(t.fields.map((f) => [f.key, f.value]));
        const r = CALC[t.id](v);
        assert.ok(r, `${t.id} : l'exemple doit donner un résultat`);
        const R = pack.res[t.id];
        clean(R.invalid, `${code} ${t.id}.invalid`);
        const x = { lowName: 'A', highName: 'B', low: r.a, high: r.b, lowFee: 0.3, highFee: 2 };
        clean(R.verdict(v, r, F, x), `${code} ${t.id}.verdict`);
        for (const pair of (R.facts ? R.facts(v, r, F) : []).filter(Boolean)) { clean(pair[0], `${code} ${t.id} fait`); clean(String(pair[1]), `${code} ${t.id} valeur`); }
        // Le libellé du grand chiffre dépend parfois du résultat (runway, objectif, seuil, tunnel, reserve), parfois de la saisie.
        const label = typeof R.label !== 'function' ? R.label : ['runway', 'objectif', 'seuil', 'tunnel', 'reserve', 'louer', 'marketplace', 'dette'].includes(t.id) ? R.label(r) : R.label(v);
        clean(label, `${code} ${t.id}.label`);
      }
    });

    it(`${code} : le calcul pas à pas, pour chaque borne et dans les cas limites`, () => {
      const F = formats(pack);
      assert.deepEqual(Object.keys(pack.steps).sort(), TOOLS.filter((t) => t.kind === 'calc').map((t) => t.id).sort());
      for (const t of TOOLS.filter((x) => x.kind === 'calc')) {
        const base = Object.fromEntries(t.fields.map((f) => [f.key, f.value]));
        // L'exemple, puis chaque chiffre à son minimum : les lignes doivent toujours se dire sans trou.
        const cases = [base, ...t.fields.map((f) => ({ ...base, [f.key]: f.min ?? 0 }))];
        let shown = 0;
        for (const v of cases) {
          const r = CALC[t.id](v);
          if (!r) continue;
          const rows = pack.steps[t.id](v, r, F).filter(Boolean);
          if (v === base) assert.ok(rows.length >= 2, `${code} ${t.id} : au moins deux étapes`);
          for (const [label, expr] of rows) { clean(label, `${code} ${t.id} étape`); clean(expr, `${code} ${t.id} étape « ${label} »`); }
          shown++;
        }
        assert.ok(shown > 0, `${code} ${t.id}`);
      }
    });

    it(`${code} : les mots de l'interface`, () => {
      const ui = pack.ui;
      for (const text of [ui.title, ui.description, ui.highest('1'), ui.nTools(1), ui.nTools(3), ui.nItems(2), ui.nWords(5), ui.home.toolsSub(52),
        ui.home.arsenalSub(79, 'x'), ui.home.glossaryText(64), ui.tools.allSub(35), ui.check.left(1), ui.check.left(4), ui.check.progress(2, 10),
        ui.writer.chars(10), ui.writer.charsFull(10), ui.steps, ui.stepsSub, ui.levers, ui.leversSub, ui.leverTry('a', '+1', 'b'), ui.slider('a'), ui.arsenal.sub(79, 21), ui.arsenal.notice('x'), ui.glossary.sub(64), ui.glossary.useful('x')]) clean(text, `${code} interface`);
      const sections = ui.about.sections({ tools: 35, arsenal: 79, words: 64, date: 'x' });
      assert.ok(sections.length >= 4);
      for (const [title, items] of sections) { clean(title, code); items.forEach((i) => clean(i, code)); }
      const F = formats(pack);
      clean(F.money(1234567), code); clean(F.money(-12.5), code); clean(F.pct(12.345, 1), code); clean(F.ord(1), code); clean(F.ord(22), code);
      assert.ok(!Number.isNaN(new Date(VERIFIED + 'T12:00:00').getTime()), 'date de vérification lisible');
    });
  }
});

describe('langues : phrases selon les cas', () => {
  for (const [code, pack] of Object.entries(PACKS)) {
    it(`${code} : des revenus qui baissent ne sont pas annoncés comme un équilibre`, () => {
      const F = formats(pack);
      const v = { cash: 5000, burn: 9000, revenue: 10000, growth: -10 };
      const r = calc.runway(v);
      assert.equal(r.breakEven, 1);
      assert.ok(r.months != null, 'la trésorerie finit par passer sous zéro');
      const text = pack.res.runway.verdict(v, r, F);
      clean(text, code);
      assert.ok(!text.includes(F.ord(1) + ' '), `${code} : ne parle pas du « 1er mois » comme d'un point d'équilibre : ${text}`);
      const stable = pack.res.runway.verdict({ ...v, growth: 0 }, calc.runway({ ...v, growth: 0 }), F);
      assert.notEqual(stable, text);
    });
    it(`${code} : singulier et pluriel`, () => {
      const F = formats(pack);
      const one = calc.revenueTarget({ target: 100, price: 100, current: 0, churn: 0, months: 1 });
      assert.equal(one.perMonth, 1);
      assert.notEqual(pack.res.objectif.label(one), pack.res.objectif.label({ perMonth: 5 }));
      clean(pack.res.objectif.verdict({ target: 100, price: 100, current: 0, churn: 0, months: 1 }, one, F), code);
    });
  }
});

describe('langues : le pitch en une phrase', () => {
  it('français : assemble sans abîmer les noms', () => {
    const p = calc.phraseParts({ name: 'Nordlys', who: 'Les boulangeries', problem: 'Jettent leurs invendus chaque soir.',
      solution: 'Vendre ces invendus avant la fermeture', unlike: 'Les remises en vitrine', edge: 'Les clients du quartier sont prévenus' });
    const r = fr.pitch(p);
    assert.equal(r.short, 'Nordlys aide les boulangeries à vendre ces invendus avant la fermeture.');
    assert.equal(r.text, 'Nordlys aide les boulangeries, qui jettent leurs invendus chaque soir, à vendre ces invendus avant la fermeture. '
      + 'Contrairement aux remises en vitrine, les clients du quartier sont prévenus.');
    assert.equal(fr.pitch(calc.phraseParts({ name: 'Nordlys', who: 'Airbnb et ses hôtes', solution: 'gagner du temps' })).short,
      'Nordlys aide Airbnb et ses hôtes à gagner du temps.', 'un nom propre garde sa majuscule');
  });
  it('anglais', () => {
    const r = en.pitch(calc.phraseParts({ name: 'Nordlys', who: 'Neighbourhood bakeries', problem: 'throw away unsold bread every evening',
      solution: 'Sell their unsold bread before closing', unlike: 'A discount sign in the window', edge: 'Locals get an alert on their phone' }));
    assert.equal(r.short, 'Nordlys helps Neighbourhood bakeries sell their unsold bread before closing.');
    assert.ok(r.text.endsWith('Unlike a discount sign in the window, Locals get an alert on their phone.'));
  });
  it('néerlandais', () => {
    const r = nl.pitch(calc.phraseParts({ name: 'Nordlys', who: 'de buurtbakkers', solution: 'hun onverkochte brood voor sluitingstijd te verkopen',
      edge: 'Buurtbewoners krijgen een melding' }));
    assert.equal(r.short, 'Nordlys helpt de buurtbakkers om hun onverkochte brood voor sluitingstijd te verkopen.');
    assert.equal(r.text, r.short + ' Ons verschil: Buurtbewoners krijgen een melding.');
  });
});
