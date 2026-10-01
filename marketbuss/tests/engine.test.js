// Tests du moteur de marketbuss, sur de petites données inventées (les noms
// « acme », « globex »… n'existent pas) : aucun accès au réseau.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  atomFeed, blended, buildSnapshot, catalogKey, groupBoard, parseName, prettify, priceIndex,
} from '../lib/engine.js';

const NOW = new Date('2026-06-30T12:00:00Z');
const day = (n) => new Date(NOW - n * 86400000).toISOString().slice(0, 10);
const row = (model, score, extra = {}) => ({ model, vendor: 'Acme', license: 'proprietary', score, ci: 5, votes: 1000, ...extra });

const LITELLM = {
  'acme-one': { mode: 'chat', litellm_provider: 'openai', input_cost_per_token: 2e-6, output_cost_per_token: 8e-6,
    max_input_tokens: 400000, max_output_tokens: 64000, supports_vision: true, supports_function_calling: true },
  'azure/acme-one': { mode: 'chat', litellm_provider: 'azure', input_cost_per_token: 9e-6, output_cost_per_token: 9e-5 },
  'openrouter/acme/acme-one:batch': { mode: 'chat', litellm_provider: 'openrouter', input_cost_per_token: 1e-7, output_cost_per_token: 1e-7 },
  'globex-pro': { mode: 'chat', litellm_provider: 'anthropic', input_cost_per_token: 1e-5, output_cost_per_token: 5e-5, supports_reasoning: true },
  'initech-lite': { mode: 'chat', litellm_provider: 'mistral', input_cost_per_token: 1e-7, output_cost_per_token: 3e-7 },
  'initech-max': { mode: 'chat', litellm_provider: 'mistral', input_cost_per_token: 3e-6, output_cost_per_token: 9e-6 },
  'paint-1': { mode: 'image_generation', output_cost_per_image: 0.04 },
};

function arena({ text, code, history = {}, past = {} }) {
  return {
    date: day(0),
    boards: {
      text: { meta: { last_updated: 'Jun 29, 2026' }, models: text },
      code: { meta: {}, models: code },
      'text-to-image': { meta: {}, models: [row('paint-1', 1300), row('paint-2 (hd)', 1250)] },
    },
    history,
    past,
  };
}

describe('noms', () => {
  it('regroupe les réglages sous le modèle', () => {
    assert.deepEqual(parseName('acme-one-high'), { base: 'acme-one', variant: 'high' });
    assert.deepEqual(parseName('Acme One (Max)'), { base: 'acme-one', variant: 'max' });
    assert.deepEqual(parseName('acme-one.5-xhigh (harness)'), { base: 'acme-one-5', variant: 'xhigh · harness' });
    assert.deepEqual(parseName('acme-one-thinking-32k'), { base: 'acme-one', variant: 'thinking 32k' });
    assert.deepEqual(parseName('acme-one-non-reasoning'), { base: 'acme-one', variant: 'non-reasoning' });
    assert.deepEqual(parseName('acme-one-20260115'), { base: 'acme-one', variant: '' });
  });

  it('un nom connu des catalogues de prix garde son suffixe', () => {
    const known = (s) => s === 'initech-max';
    assert.equal(parseName('initech-max', known).base, 'initech-max');
    assert.equal(parseName('initech-max').base, 'initech');
  });

  it('clés de prix : fournisseur, région et version retirés', () => {
    assert.equal(catalogKey('bedrock/eu.acme.acme-one-4-6-v1:0'), 'acme-one-4-6');
    assert.equal(catalogKey('openrouter/acme/acme-one.5:free'), 'acme-one-5');
    assert.equal(catalogKey('bedrock/ap-1/globex.v3.2'), 'globex-v3-2');
    assert.equal(catalogKey('gemini/acme-2.5-flash'), 'acme-2-5-flash');
  });

  it('noms lisibles', () => {
    assert.equal(prettify('acme-one-4-6'), 'Acme One 4.6');
    assert.equal(prettify('gpt-5-6-sol'), 'GPT-5.6 Sol');
    assert.equal(prettify('globex-k2-6'), 'Globex K2.6');
    assert.equal(prettify('initech-235b-a22b'), 'Initech 235B A22B');
  });
});

describe('prix', () => {
  it('fournisseur officiel d\'abord, tarifs « batch » ignorés', () => {
    const index = priceIndex(LITELLM);
    assert.equal(index.get('acme-one').key, 'acme-one');
    assert.equal(index.has('paint-1'), false, 'seuls les modèles de texte ont un prix au jeton');
  });

  it('prix mixte : 3 jetons lus pour 1 écrit', () => {
    assert.equal(blended(2, 8), 3.5);
    assert.equal(blended(null, 8), null);
  });
});

describe('instantané', () => {
  const text = [row('globex-pro-high', 1500), row('globex-pro', 1490), row('acme-one', 1480), row('initech-lite', 1400)];
  const code = [row('acme-one-max', 1700), row('globex-pro', 1600), row('initech-lite', 1300)];

  it('classe les modèles et calcule l\'indice', () => {
    const snap = buildSnapshot({ now: NOW, arena: arena({ text, code }), litellm: LITELLM });
    const [first, second] = snap.models;
    assert.equal(first.id, 'acme-one');
    assert.equal(first.rank, 1);
    assert.equal(first.cats.code.variant, 'max');
    assert.equal(second.id, 'globex-pro');
    assert.equal(second.cats.text.rank, 1, 'meilleur réglage : globex-pro-high');
    assert.deepEqual(second.variants, ['high']);
    assert.equal(first.price.input, 2);
    assert.equal(first.price.output, 8);
    assert.equal(first.price.provider, 'openai');
    assert.equal(first.context, 400000);
    assert.equal(first.caps.vision, true);
    assert.ok(first.index > second.index);
    assert.equal(snap.categories.find((c) => c.id === 'text').leader, 'globex-pro');
    // Les modèles d'images ne sont pas dans le classement général.
    const paint = snap.models.find((m) => m.id === 'paint-1');
    assert.equal(paint.group, 'media');
    assert.equal(paint.rank, undefined);
    assert.equal(snap.models.find((m) => m.id === 'paint-2').variants[0], 'hd');
  });

  it('frontière qualité/prix', () => {
    const snap = buildSnapshot({ now: NOW, arena: arena({ text, code }), litellm: LITELLM });
    const pareto = snap.models.filter((m) => m.pareto).map((m) => m.id).sort();
    // globex-pro est moins bon et plus cher que acme-one : dominé.
    assert.deepEqual(pareto, ['acme-one', 'initech-lite']);
  });

  it('mouvements sur 7 jours, nouveaux n° 1 et entrées', () => {
    const old = [row('globex-pro', 1500), row('initech-lite', 1400)];
    const history = {
      text: [{ date: day(8), models: old }, { date: day(7), models: old }, { date: day(2), models: text }],
    };
    const past = { text: { d7: { date: day(7), models: old } } };
    const snap = buildSnapshot({ now: NOW, arena: arena({ text, code, history, past }), litellm: LITELLM });
    const acme = snap.models.find((m) => m.id === 'acme-one');
    assert.equal(acme.cats.text.rank7, 0, 'absent il y a 7 jours');
    assert.equal(acme.firstSeen, day(2));
    assert.equal(acme.isNew, true);
    const initech = snap.models.find((m) => m.id === 'initech-lite');
    assert.equal(initech.cats.text.rank7, 2);
    assert.equal(initech.cats.text.rank, 3);
    assert.equal(initech.firstSeen, undefined, 'déjà là au début de l\'historique');
    assert.deepEqual(acme.hist.text.map((p) => p[0]), [day(2)]);
    const entry = snap.events.find((e) => e.type === 'entry' && e.model === 'acme-one');
    assert.equal(entry.date, day(2));
    assert.equal(entry.rank, 2);
  });

  it('un nouveau modèle sans note dans une arène a un indice provisoire', () => {
    const history = { text: [{ date: day(20), models: [row('globex-pro', 1500)] }, { date: day(1), models: text }] };
    const snap = buildSnapshot({
      now: NOW, arena: arena({ text, code: [row('globex-pro', 1600)], history }), litellm: LITELLM,
    });
    const acme = snap.models.find((m) => m.id === 'acme-one');
    assert.equal(acme.provisional, true);
    assert.equal(acme.index, acme.cats.text.points, 'seule l\'arène notée compte');
  });

  it('changement de prix depuis le passage précédent, puis gardé', () => {
    const previous = buildSnapshot({ now: NOW, arena: arena({ text, code }), litellm: LITELLM });
    previous.models.find((m) => m.id === 'acme-one').price.blended = 7;
    const snap = buildSnapshot({ now: NOW, arena: arena({ text, code }), litellm: LITELLM, previous });
    const ev = snap.events.find((e) => e.type === 'price');
    assert.deepEqual(ev, { date: day(0), type: 'price', model: 'acme-one', from: 7, to: 3.5 });
    const next = buildSnapshot({ now: NOW, arena: arena({ text, code }), litellm: LITELLM, previous: snap });
    assert.equal(next.events.filter((e) => e.type === 'price').length, 1);
  });

  it('base des prix injoignable : prix précédents conservés', () => {
    const previous = buildSnapshot({ now: NOW, arena: arena({ text, code }), litellm: LITELLM });
    const snap = buildSnapshot({ now: NOW, arena: arena({ text, code }), litellm: null, previous });
    const acme = snap.models.find((m) => m.id === 'acme-one');
    assert.equal(acme.price.input, 2);
    assert.equal(acme.price.stale, true);
  });

  it('sorties récentes et version gratuite (OpenRouter)', () => {
    const created = Math.floor((NOW - 3 * 86400000) / 1000);
    const openrouter = [
      { id: 'acme/acme-one', name: 'Acme: Acme One', created, context_length: 200000,
        pricing: { prompt: '0.000002', completion: '0.000008' }, architecture: { input_modalities: ['text', 'image'] } },
      { id: 'acme/acme-one:free', name: 'Acme: Acme One (free)', created, pricing: { prompt: '0', completion: '0' } },
      { id: 'old/ancient', name: 'Old: Ancient', created: created - 400 * 86400, pricing: { prompt: '0.000001', completion: '0.000001' } },
    ];
    const snap = buildSnapshot({ now: NOW, arena: arena({ text, code }), litellm: LITELLM, openrouter });
    const acme = snap.models.find((m) => m.id === 'acme-one');
    assert.equal(acme.name, 'Acme One');
    assert.deepEqual(acme.or, { id: 'acme/acme-one', created, free: true });
    assert.deepEqual(snap.releases.map((r) => r.id), ['acme/acme-one']);
    assert.equal(snap.releases[0].model, 'acme-one');
  });

  it('flux Atom : texte échappé', () => {
    const snap = buildSnapshot({ now: NOW, arena: arena({ text, code }), litellm: LITELLM });
    snap.events = [{ date: day(0), type: 'release', name: 'A <b>&</b> "B"', orId: 'x/y' }];
    const xml = atomFeed(snap, 'https://example.org');
    assert.match(xml, /A &lt;b&gt;&amp;&lt;\/b&gt; &quot;B&quot;/);
    assert.match(xml, /<link rel="self" href="https:\/\/example.org\/data\/feed.xml"\/>/);
  });

  it('les lignes sans score sont ignorées', () => {
    const rows = groupBoard('text', [{ model: 'x', score: null }, null, { model: '', score: 3 }, row('ok', 1)]);
    assert.deepEqual(rows.map((r) => r.base), ['ok']);
  });
});
