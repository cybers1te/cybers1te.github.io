// marketbuss — la plateforme (page unique, sans dépendance, sans compte).
//
// Tout se passe dans le navigateur : rien de ce que tape le visiteur n'est
// envoyé quelque part. Les textes saisis (carte de pitch, pitch en une phrase,
// lean canvas) sont affichés avec textContent, jamais avec innerHTML.
//
// Les mots du site sont dans lang/<langue>.js ; ce fichier ne contient que la
// structure des pages. T = la langue en cours, F = ses formats.

import * as calc from './calculs.js?v=__V__';
import { CANVAS, GUIDES, LEVELS, ROLES, TOOLS } from './contenu.js?v=__V__';
import { ARSENAL, VERIFIED } from './arsenal.js?v=__V__';
import { skyline, sprite } from './sprites.js?v=__V__';

/* ---------- Langues ---------- */

const LANGS = { fr: 'FR', en: 'EN', nl: 'NL' };
let T = null; // les mots de la langue en cours
let F = null; // ses formats : nombres, argent, pourcentages
let verifiedDate = '';

function pickLang() {
  const wanted = new URLSearchParams(location.search).get('lang');
  if (LANGS[wanted]) return wanted;
  const saved = store.get('mb-lang', null);
  if (LANGS[saved]) return saved;
  for (const l of navigator.languages || [navigator.language || 'fr']) {
    const code = String(l).slice(0, 2).toLowerCase();
    if (LANGS[code]) return code;
  }
  return 'fr';
}

async function setLang(code) {
  let pack;
  try { pack = (await import(`./lang/${code}.js?v=__V__`)).default; } catch (error) {
    // Une langue qui ne se charge pas ne doit pas laisser une page vide : on revient au français.
    if (code === 'fr') throw error;
    pack = (await import('./lang/fr.js?v=__V__')).default;
  }
  T = pack;
  const nf = (n, d = 0) => new Intl.NumberFormat(pack.locale, { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n);
  F = {
    nf,
    money: (n) => (n == null || !Number.isFinite(n) ? '—' : pack.money(n, nf)),
    pct: (n, d = 1) => pack.pct(nf(n, d)),
    times: (n) => pack.times(nf(n, n < 10 ? 1 : 0)),
    ord: pack.ord,
    plural: pack.plural,
  };
  verifiedDate = new Intl.DateTimeFormat(pack.locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(VERIFIED + 'T12:00:00'));
  document.documentElement.lang = code;
  paintChrome();
}

/* L'en-tête et le pied de page sont dans index.html : on y pose les mots de la langue. */
function paintChrome() {
  const ui = T.ui;
  document.querySelector('.skip').textContent = ui.skip;
  document.querySelector('meta[name="description"]').setAttribute('content', ui.description);
  for (const a of document.querySelectorAll('[data-nav]')) a.textContent = ui.nav[a.dataset.nav];
  for (const el of document.querySelectorAll('[data-foot]')) el.textContent = ui.foot[el.dataset.foot];
  for (const a of document.querySelectorAll('[data-foot-link]')) a.textContent = ui.foot.links[a.dataset.footLink];
  const box = document.getElementById('lang');
  box.setAttribute('aria-label', ui.language);
  box.replaceChildren(...Object.entries(LANGS).map(([code, label]) => h('button', { type: 'button', class: code === T.code ? 'on' : '', lang: code,
    'aria-pressed': code === T.code ? 'true' : 'false',
    onclick: async () => {
      // Le choix fait ici l'emporte sur un éventuel ?lang= dans l'adresse : on l'enregistre et on retire le paramètre.
      store.set('mb-lang', code);
      if (new URLSearchParams(location.search).has('lang')) history.replaceState(null, '', location.pathname + location.hash);
      if (code === T.code) return;
      await setLang(code);
      render();
    } }, label)));
}

/* ---------- Outils DOM ---------- */

function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
const SVG_NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs, ...kids) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'text') el.textContent = v; else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid) el.append(kid);
  return el;
}

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const toolById = new Map(TOOLS.map((t) => [t.id, t]));
const toolsOf = (roleId) => TOOLS.filter((t) => t.role === roleId);
const catById = new Map(ARSENAL.map((c) => [c.id, c]));
const ARSENAL_COUNT = ARSENAL.reduce((n, c) => n + c.tools.length, 0);
// Un mot ou une fonction : les libellés peuvent dépendre des chiffres.
const say = (x, ...args) => (typeof x === 'function' ? x(...args) : x);

const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* navigation privée */ } },
};

function toast(text) {
  const zone = document.getElementById('toasts');
  const el = h('div', { class: 'toast', role: 'status' }, text);
  zone.append(el);
  setTimeout(() => el.remove(), 3200);
}
async function copyText(text, done) {
  try { await navigator.clipboard.writeText(text); toast(done); } catch { toast(T.ui.copyFail); }
}

/* ---------- Petits composants ---------- */

const roleTag = (role) => h('span', { class: 'tag ' + ROLES[role].color, text: T.roles[role].name });
const playerName = (roleId) => `${T.ui.player} ${Object.keys(ROLES).indexOf(roleId) + 1}`;

function toolCard(t) {
  const w = T.tools[t.id];
  return h('a', { class: 'cabinet ' + ROLES[t.role].color, href: '#/outil/' + t.id },
    h('span', { class: 'cabinet-screen' }, sprite(t.sprite, 6)),
    h('span', { class: 'cabinet-body' }, roleTag(t.role), h('b', { text: w.name }), h('span', { text: w.question })));
}

/* La même borne, en petit : pour les listes longues. */
function miniTool(t) {
  const w = T.tools[t.id];
  return h('a', { class: 'mini ' + ROLES[t.role].color, href: '#/outil/' + t.id },
    h('span', { class: 'mini-icon' }, sprite(t.sprite, 4)),
    h('span', { class: 'mini-text' }, h('b', { text: w.name }), h('span', { text: w.question })));
}

function section(title, sub, ...kids) {
  return h('section', { class: 'section' },
    h('div', { class: 'section-head' }, h('h2', { text: title }), sub ? h('p', { class: 'sub', text: sub }) : null),
    ...kids);
}

/* Un personnage qui parle : le guide et sa bulle. */
function guideSays(guideId, text) {
  const g = GUIDES[guideId];
  if (!g || !text) return null;
  const w = T.guides[guideId];
  return h('div', { class: 'guide' },
    h('div', { class: 'guide-face' }, sprite(g.sprite, 4)),
    h('div', { class: 'guide-say' }, h('b', { text: `${w.name}, ${w.job}` }), h('p', { text })));
}

const catChip = (c) => h('a', { class: 'chip', href: '#/arsenal/' + c.id }, sprite(c.sprite, 2), T.arsenal.cats[c.id].name);
const toolChip = (t) => h('a', { class: 'chip', href: '#/outil/' + t.id }, sprite(t.sprite, 2), T.tools[t.id].name);

/* Le grand chiffre d'un résultat. */
const score = (value, label, cls = '') => h('div', { class: 'score ' + cls }, h('b', { text: value }), h('span', { text: label }));
const facts = (list) => h('div', { class: 'facts' }, list.filter(Boolean).map(([label, value]) => h('div', { class: 'fact' }, h('span', { text: label }), h('b', { text: value }))));

/* Le graphique et ses repères : les textes restent en HTML, donc lisibles à toutes les largeurs. */
function figure(chart, ticks, top) {
  return h('div', { class: 'pxfig' },
    h('p', { class: 'pxtop', text: T.ui.highest(top) }),
    chart,
    h('div', { class: 'pxaxis', 'aria-hidden': 'true' }, ticks.map(([at, label]) => h('span', { style: `left:${(at * 100).toFixed(2)}%`, text: label }))));
}

/* Colonnes en pixels : valeurs positives vers le haut, négatives vers le bas.
   `data` : [{ label, value, title }]. `fmt` : comment écrire une valeur. */
function columns(data, { height = 150, pos = 'var(--p1)', neg = 'var(--hot)', every = 6, fmt = F.money } = {}) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const span = max - min || 1;
  const bw = 8;
  const gap = 2;
  const W = data.length * (bw + gap);
  const zero = Math.round((max / span) * height);
  const root = svg('svg', { viewBox: `0 0 ${W} ${height + 1}`, class: 'pxchart', preserveAspectRatio: 'none', 'shape-rendering': 'crispEdges', role: 'img',
    'aria-label': `${fmt(data[0].value)} → ${fmt(data[data.length - 1].value)}` });
  const ticks = [];
  data.forEach((d, i) => {
    const hpx = Math.max(d.value === 0 ? 0 : 2, Math.round((Math.abs(d.value) / span) * height));
    const y = d.value >= 0 ? zero - hpx : zero;
    const r = svg('rect', { x: i * (bw + gap) + gap / 2, y, width: bw, height: hpx, style: `fill:${d.value >= 0 ? pos : neg}` });
    r.append(svg('title', { text: d.title }));
    root.append(r);
    if (i % every === 0) ticks.push([(i * (bw + gap) + gap / 2 + bw / 2) / W, d.label]);
  });
  root.append(svg('rect', { x: 0, y: zero, width: W, height: 1, style: 'fill:var(--ink)' }));
  return figure(root, ticks, fmt(max > 0 ? max : min));
}

/* Colonnes empilées : `data` : [{ label, parts: [a, b], title }]. */
function stacked(data, { height = 160, colors = ['var(--p1)', 'var(--ok)'], every = 5, label = '' } = {}) {
  const max = Math.max(1, ...data.map((d) => d.parts.reduce((s, v) => s + Math.max(0, v), 0)));
  const bw = 10;
  const gap = 3;
  const W = data.length * (bw + gap);
  const root = svg('svg', { viewBox: `0 0 ${W} ${height}`, class: 'pxchart', preserveAspectRatio: 'none', 'shape-rendering': 'crispEdges', role: 'img', 'aria-label': label });
  const ticks = [];
  data.forEach((d, i) => {
    let y = height;
    d.parts.forEach((v, k) => {
      const hpx = Math.round((Math.max(0, v) / max) * height);
      if (!hpx) return;
      y -= hpx;
      // Un pixel de fond sépare les deux couleurs d'une même colonne.
      const r = svg('rect', { x: i * (bw + gap), y, width: bw, height: k ? Math.max(1, hpx - 1) : hpx, style: `fill:${colors[k]}` });
      r.append(svg('title', { text: d.title }));
      root.append(r);
    });
    if (i % every === 0) ticks.push([(i * (bw + gap) + bw / 2) / W, d.label]);
  });
  return figure(root, ticks, F.money(max));
}

/* Des barres horizontales à comparer : `rows` : [{ label, value, text, cls }]. */
function versus(rows) {
  const list = rows.filter(Boolean);
  const max = Math.max(1e-9, ...list.map((r) => r.value));
  return h('div', { class: 'versus' }, list.map((r) => h('div', { class: 'versus-row' },
    h('span', { class: 'versus-label', text: r.label }),
    h('span', { class: 'versus-track', 'aria-hidden': 'true' }, h('span', { class: r.cls || '', style: `width:${Math.max(1, (Math.max(0, r.value) / max) * 100)}%` })),
    h('b', { text: r.text }))));
}

const legend = (...items) => h('div', { class: 'legend' }, items.map(([cls, text]) => h('span', {}, h('i', { class: 'key ' + cls }), text)));

/* Cent cases à partager : `parts` : [[classe, nom, pourcentage]]. Les arrondis vont aux plus gros restes. */
function waffle(parts) {
  const cells = parts.map((p) => Math.floor(p[2]));
  let rest = 100 - cells.reduce((s, n) => s + n, 0);
  const order = parts.map((p, i) => [p[2] - Math.floor(p[2]), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; rest > 0 && order.length; k++, rest--) cells[order[k % order.length][1]]++;
  const squares = [];
  parts.forEach((p, i) => { for (let n = 0; n < cells[i]; n++) squares.push(p[0]); });
  return h('div', { class: 'waffle', role: 'img', 'aria-label': parts.map((p) => `${p[1]} ${F.pct(p[2])}`).join(', ') },
    squares.map((c) => h('i', { class: c })));
}

function valuesTable(head, rows) {
  return h('details', { class: 'values' }, h('summary', {}, T.ui.seeValues),
    h('div', { class: 'table-wrap' }, h('table', {},
      h('thead', {}, h('tr', {}, head.map((t, i) => h('th', { scope: 'col', class: i ? 'num' : '', text: t })))),
      h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c, i) => h('td', { class: i ? 'num' : '', text: c }))))))));
}

const top = (...kids) => h('div', { class: 'result-top' }, ...kids);
const verdict = (text) => h('p', { class: 'verdict', text });
const years = (n) => (n > 30 ? 10 : 5);

/* ---------- Résultats des calculateurs ----------
   Chaque fonction reçoit v (les chiffres saisis) et R (les mots de la borne),
   et rend les morceaux du résultat. `null` : chiffres impossibles. */

const RESULTS = {
  runway(v, R) {
    const r = calc.runway(v);
    if (!r) return null;
    const shown = r.months == null ? r.series : r.series.slice(0, Math.min(r.series.length, r.months + 8));
    const lives = r.months == null ? 12 : Math.min(12, r.months);
    return [
      top(score(r.months == null ? `${r.horizon}+` : String(r.months), say(R.label, r), r.months != null && r.months < 6 ? 'bad' : ''),
        h('div', { class: 'lives', role: 'img', 'aria-label': R.hearts(lives) },
          Array.from({ length: 12 }, (_, i) => h('span', { class: i < lives ? '' : 'off' }, sprite('heart', 3))),
          h('small', { text: R.heartsNote }))),
      verdict(R.verdict(v, r, F)),
      facts(R.facts(v, r, F)),
      h('h3', { text: R.chart }),
      columns(shown.map((p) => ({ label: R.tick(p.month), value: p.cash, title: R.bar(p, F) }))),
      legend(['p1', R.legend[0]], ['hot', R.legend[1]]),
      valuesTable(R.table, shown.map((p) => R.row(p, F))),
    ];
  },

  lever(v, R) {
    const r = calc.raiseNeed(v);
    if (!r) return null;
    if (r.raise === 0) return [top(score(R.none, R.noneLabel)), verdict(R.noneVerdict)];
    return [
      top(score(F.money(r.raise), say(R.label, v))),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: r.base, text: F.money(r.base), cls: 'p1' },
        r.raise > r.base ? { label: R.rows[1], value: r.raise - r.base, text: F.money(r.raise - r.base), cls: 'violet' } : null]),
      facts(R.facts(v, r, F)),
    ];
  },

  dilution(v, R) {
    const r = calc.dilution(v);
    if (!r) return null;
    const parts = [['p1', R.parts[0], r.founders], ['violet', R.parts[1], r.others], ['hot', R.parts[2], r.pool], ['p2', R.parts[3], r.investors]].filter((p) => p[2] > 0);
    return [
      top(score(F.pct(r.founders), R.label), waffle(parts)),
      verdict(R.verdict(v, r, F)),
      legend(...parts.map((p) => [p[0], `${p[1]} : ${F.pct(p[2])}`])),
      facts(R.facts(v, r, F)),
    ];
  },

  vesting(v, R) {
    const r = calc.vesting(v);
    if (!r) return null;
    const parts = [['p1', R.parts[0], r.ratio], ['off', R.parts[1], 100 - r.ratio]].filter((p) => p[2] > 0);
    return [
      top(score(F.pct(r.vested, 2), R.label, r.ratio === 0 ? 'bad' : ''), waffle(parts)),
      verdict(R.verdict(v, r, F)),
      legend(...parts.map((p) => [p[0], `${p[1]} : ${F.pct(p[2])}`])),
      facts(R.facts(v, r, F)),
    ];
  },

  marche(v, R) {
    const r = calc.marketSize(v);
    if (!r) return null;
    return [
      top(score(F.money(r.som), R.label)),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: r.tam, text: F.money(r.tam), cls: 'violet' },
        { label: R.rows[1], value: r.sam, text: F.money(r.sam), cls: 'p2' },
        { label: R.rows[2], value: r.som, text: F.money(r.som), cls: 'p1' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  client(v, R) {
    const r = calc.unitEconomics(v);
    if (!r) return null;
    return [
      top(score(r.ratio == null ? R.free : F.times(r.ratio), R.label, r.ratio != null && r.ratio < 1 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: r.cac, text: F.money(r.cac), cls: 'hot' }, { label: R.rows[1], value: r.ltv, text: F.money(r.ltv), cls: 'ok' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  objectif(v, R) {
    const r = calc.revenueTarget(v);
    if (!r) return null;
    return [
      top(score(F.nf(r.perMonth, r.perMonth < 10 ? 1 : 0), say(R.label, r))),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: v.current, text: F.nf(v.current), cls: 'violet' },
        { label: R.rows[1], value: r.needed, text: F.nf(r.needed), cls: 'p1' },
        { label: R.rows[2], value: r.total, text: F.nf(r.total), cls: 'ok' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  croissance(v, R) {
    const r = calc.growthRate(v);
    if (!r) return null;
    return [top(score(F.pct(r.monthly, 2), R.label, r.monthly < 0 ? 'bad' : '')), verdict(R.verdict(v, r, F)), facts(R.facts(v, r, F))];
  },

  tarif(v, R) {
    const r = calc.dayRate(v);
    if (!r) return null;
    return [
      top(score(F.money(r.rate), R.label)),
      verdict(R.verdict(v, r, F)),
      h('h3', { text: R.chart }),
      versus([{ label: R.rows[0], value: r.netYear, text: F.money(r.netYear), cls: 'ok' },
        { label: R.rows[1], value: r.chargesAmount, text: F.money(r.chargesAmount), cls: 'hot' },
        { label: R.rows[2], value: r.costsAmount, text: F.money(r.costsAmount), cls: 'violet' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  devis(v, R) {
    const r = calc.quote(v);
    if (!r) return null;
    return [
      top(score(F.money(r.ttc), say(R.label, v))),
      verdict(R.verdict(v, r, F)),
      h('h3', { text: R.chart }),
      versus([{ label: R.rows[0], value: r.work, text: F.money(r.work), cls: 'ok' },
        r.safety > 0 ? { label: R.rows[1], value: r.safety, text: F.money(r.safety), cls: 'p1' } : null,
        v.expenses > 0 ? { label: R.rows[2], value: v.expenses, text: F.money(v.expenses), cls: 'p2' } : null,
        r.vatAmount > 0 ? { label: R.rows[3], value: r.vatAmount, text: F.money(r.vatAmount), cls: 'violet' } : null]),
      facts(R.facts(v, r, F)),
    ];
  },

  prix(v, R) {
    const r = calc.pricing(v);
    if (!r) return null;
    return [
      top(score(F.money(v.vat > 0 ? r.ttc : r.ht), say(R.label, v))),
      verdict(R.verdict(v, r, F)),
      h('h3', { text: R.chart }),
      versus([{ label: R.rows[0], value: v.cost, text: F.money(v.cost), cls: 'hot' },
        { label: R.rows[1], value: r.marginAmount, text: F.money(r.marginAmount), cls: 'ok' },
        v.vat > 0 ? { label: R.rows[2], value: r.vatAmount, text: F.money(r.vatAmount), cls: 'violet' } : null]),
      facts(R.facts(v, r, F)),
    ];
  },

  remise(v, R) {
    const r = calc.discount(v);
    if (!r) return null;
    if (r.extra == null) return [top(score(R.never, R.neverLabel, 'bad')), verdict(R.neverVerdict(v, r, F))];
    return [
      top(score('+' + F.pct(r.extra, 0), R.label, r.extra >= 100 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: r.before, text: F.money(r.before), cls: 'ok' }, { label: R.rows[1], value: r.after, text: F.money(r.after), cls: 'hot' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  seuil(v, R) {
    const r = calc.breakEven(v);
    if (!r) return null;
    if (r.units == null) return [top(score(R.never, R.neverLabel, 'bad')), verdict(R.neverVerdict(v, r, F))];
    return [
      top(score(F.nf(r.units), say(R.label, r))),
      verdict(R.verdict(v, r, F)),
      facts(R.facts(v, r, F)),
      h('h3', { text: R.chart }),
      h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, R.table.map((t, i) => h('th', { scope: 'col', class: i ? 'num' : '', text: t })))),
        h('tbody', {}, [Math.floor(r.units / 2), r.units, Math.ceil(r.units * 1.5)].map((u) => {
          const result = u * r.margin - v.fixed;
          return h('tr', {}, [F.nf(u), F.money(u * v.price), F.money(result)].map((c, i) => h('td', { class: (i ? 'num' : '') + (i === 2 ? (result < 0 ? ' neg' : ' posv') : ''), text: c })));
        })))),
    ];
  },

  tunnel(v, R) {
    const r = calc.funnel(v);
    if (!r) return null;
    return [
      top(score(F.nf(r.customers, r.customers < 10 ? 1 : 0), say(R.label, r), r.customers < 1 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: v.visitors, text: F.nf(v.visitors), cls: 'violet' },
        { label: R.rows[1], value: r.leads, text: F.nf(r.leads, 1), cls: 'p2' },
        { label: R.rows[2], value: r.customers, text: F.nf(r.customers, 1), cls: 'ok' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  tirelire(v, R) {
    const r = calc.setAside(v);
    if (!r) return null;
    return [
      top(score(F.money(r.aside), R.label)),
      verdict(R.verdict(v, r, F)),
      h('h3', { text: R.chart }),
      versus([{ label: R.rows[0], value: r.yours, text: F.money(r.yours), cls: 'ok' },
        r.chargesAmount > 0 ? { label: R.rows[1], value: r.chargesAmount, text: F.money(r.chargesAmount), cls: 'hot' } : null,
        r.vatAmount > 0 ? { label: R.rows[2], value: r.vatAmount, text: F.money(r.vatAmount), cls: 'violet' } : null]),
      facts(R.facts(v, r, F)),
    ];
  },

  ticket(v, R) {
    const r = calc.exitReturn(v);
    if (!r) return null;
    return [
      top(score(F.times(r.multiple), R.label, r.multiple < 1 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: v.ticket, text: F.money(v.ticket), cls: 'p2' }, { label: R.rows[1], value: r.proceeds, text: F.money(r.proceeds), cls: 'ok' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  valo(v, R) {
    const r = calc.maxValuation(v);
    if (!r) return null;
    return [top(score(F.money(r.post), R.label)), verdict(R.verdict(v, r, F)), facts(R.facts(v, r, F))];
  },

  portefeuille(v, R) {
    const r = calc.portfolio(v);
    if (!r) return null;
    const grid = v.count <= 200 ? h('div', { class: 'waffle', role: 'img', 'aria-label': R.aria(r) },
      [...Array(r.fails).fill('off'), ...Array(r.mids).fill('p1'), ...Array(r.winners).fill('ok')].map((c) => h('i', { class: c }))) : null;
    return [
      top(score(F.times(r.multiple), R.label, r.multiple < 1 ? 'bad' : ''), grid),
      verdict(R.verdict(v, r, F)),
      legend(['off', R.legend[0]], ['p1', R.legend[1]], ['ok', R.legend[2]]),
      facts(R.facts(v, r, F)),
    ];
  },

  suivre(v, R) {
    const r = calc.proRata(v);
    if (!r) return null;
    return [
      top(score(F.money(r.invest), R.label)),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: v.stake, text: F.pct(v.stake, 2), cls: 'ok' }, { label: R.rows[1], value: r.without, text: F.pct(r.without, 2), cls: 'hot' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  fonte(v, R) {
    const r = calc.rounds(v);
    if (!r) return null;
    return [
      top(score(F.pct(r.final, 2), say(R.label, v))),
      verdict(R.verdict(v, r, F)),
      h('h3', { text: R.chart }),
      columns(r.series.map((p) => ({ label: R.tick(p.round), value: p.stake, title: R.bar(p, F) })), { every: 1, pos: 'var(--p2)', fmt: (n) => F.pct(n, 2) }),
      facts(R.facts(v, r, F)),
    ];
  },

  convertible(v, R) {
    const r = calc.convertible(v);
    if (!r) return null;
    const parts = [['p1', R.parts[0], r.existing], ['p2', R.parts[1], r.stake], ['violet', R.parts[2], r.newInvestors]].filter((p) => p[2] > 0);
    return [
      top(score(F.pct(r.stake, 2), R.label), waffle(parts)),
      verdict(R.verdict(v, r, F)),
      legend(...parts.map((p) => [p[0], `${p[1]} : ${F.pct(p[2], 2)}`])),
      facts(R.facts(v, r, F)),
    ];
  },

  cascade(v, R) {
    const r = calc.waterfall(v);
    if (!r) return null;
    return [
      top(score(F.money(r.others), R.label, r.others === 0 && v.exit > 0 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: r.investors, text: F.money(r.investors), cls: 'p2' }, { label: R.rows[1], value: r.others, text: F.money(r.others), cls: 'p1' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  note(v, R) {
    const r = calc.scorecard(v);
    if (!r) return null;
    return [
      top(score(F.nf(r.score, 0), R.label, r.score < 50 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      // Chaque barre : les points gagnés sur le poids du critère.
      h('div', { class: 'versus' }, r.parts.map((p) => h('div', { class: 'versus-row' },
        h('span', { class: 'versus-label', text: R.criteria[p.key] }),
        h('span', { class: 'versus-track', 'aria-hidden': 'true', style: `width:${(p.weight / 30) * 100}%` }, h('span', { class: p.key === r.weakest ? 'hot' : 'p2', style: `width:${Math.max(1, (p.points / p.weight) * 100)}%` })),
        h('b', { text: R.points(p, F) })))),
      facts(R.facts(v, r, F)),
    ];
  },

  composes(v, R) {
    const r = calc.compound(v);
    if (!r) return null;
    return [
      top(score(F.money(r.value), say(R.label, v))),
      verdict(R.verdict(v, r, F)),
      h('h3', { text: R.chart }),
      stacked(r.series.map((p) => ({ label: String(p.year), parts: [Math.min(p.paid, p.value), Math.max(0, p.value - p.paid)], title: R.bar(p, F) })), { every: years(v.years), label: R.aria }),
      legend(['p1', R.legend[0]], ['ok', R.legend[1]]),
      valuesTable(R.table, r.series.map((p) => R.row(p, F))),
    ];
  },

  cible(v, R) {
    const r = calc.savingsGoal(v);
    if (!r) return null;
    return [
      top(score(F.money(r.monthly), R.label)),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: r.paid, text: F.money(r.paid), cls: 'violet' },
        r.interest > 0 ? { label: R.rows[1], value: r.interest, text: F.money(r.interest), cls: 'ok' } : null]),
      facts(R.facts(v, r, F)),
    ];
  },

  frais(v, R) {
    const r = calc.fees(v);
    if (!r) return null;
    const aLow = v.feeA <= v.feeB;
    const x = { lowName: aLow ? 'A' : 'B', highName: aLow ? 'B' : 'A', low: aLow ? r.a : r.b, high: aLow ? r.b : r.a, lowFee: Math.min(v.feeA, v.feeB), highFee: Math.max(v.feeA, v.feeB) };
    const names = R.legend(x);
    return [
      top(score(F.money(r.gap), say(R.label, v))),
      verdict(R.verdict(v, r, F, x)),
      h('h3', { text: R.chart }),
      stacked(r.series.map((p) => ({ label: String(p.year), parts: [Math.min(p.a, p.b), Math.abs(p.a - p.b)], title: R.bar(p, F) })),
        { every: years(v.years), colors: ['var(--violet)', 'var(--ok)'], label: R.aria }),
      legend(['violet', names[0]], ['ok', names[1]]),
      facts(R.facts(v, r, F)),
      valuesTable(R.table, r.series.map((p) => R.row(p, F))),
    ];
  },

  inflation(v, R) {
    const r = calc.inflation(v);
    if (!r) return null;
    return [
      top(score(F.money(r.real), say(R.label, v), r.real < v.amount ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      h('h3', { text: R.chart }),
      columns(r.series.map((p) => ({ label: String(p.year), value: p.real, title: R.bar(p, F) })), { every: years(v.years), pos: 'var(--violet)' }),
      facts(R.facts(v, r, F)),
      valuesTable(R.table, r.series.map((p) => R.row(p, F))),
    ];
  },

  reserve(v, R) {
    const r = calc.drawdown(v);
    if (!r) return null;
    return [
      top(r.forever ? score(R.forever, R.foreverLabel) : score(F.nf(r.years, 1), say(R.label, r), r.years < 10 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      h('h3', { text: R.chart }),
      columns(r.series.map((p) => ({ label: String(p.year), value: p.value, title: R.bar(p, F) })), { every: years(r.series.length), pos: 'var(--violet)' }),
      facts(R.facts(v, r, F)),
    ];
  },

  coussin(v, R) {
    const r = calc.cushion(v);
    if (!r) return null;
    return [
      top(score(F.money(r.target), R.label)),
      h('div', { class: 'meter', role: 'img', 'aria-label': R.aria(r, F) }, h('span', { style: `width:${r.progress}%` })),
      verdict(R.verdict(v, r, F)),
      facts(R.facts(v, r, F)),
    ];
  },
};

/* ---------- Vues ---------- */

function viewHome() {
  const ui = T.ui.home;
  const frag = h('div', { class: 'home' });
  frag.append(h('section', { class: 'hero' },
    h('div', { class: 'wrap hero-in' },
      h('p', { class: 'insert', text: ui.insert }),
      h('h1', { text: 'marketbuss' }),
      h('p', { class: 'tagline', text: ui.tagline }),
      h('p', { class: 'lead', text: ui.lead }),
      h('h2', { class: 'select-title', text: ui.choose }),
      h('div', { class: 'players' }, Object.values(ROLES).map((r) => h('a', { class: 'player ' + r.color, href: '#/outils/' + r.id },
        h('span', { class: 'player-sprite' }, sprite(r.sprite, 6)),
        h('span', { class: 'player-text' },
          h('small', { text: playerName(r.id) }),
          h('b', { text: T.roles[r.id].name }),
          h('span', { text: T.roles[r.id].pitch }),
          h('span', { class: 'player-go', text: T.ui.nTools(toolsOf(r.id).length) })))))),
    h('div', { class: 'hero-rocket', 'aria-hidden': 'true' }, sprite('rocket', 6)),
    h('div', { class: 'hero-coin c1', 'aria-hidden': 'true' }, sprite('coin', 4)),
    h('div', { class: 'hero-coin c2', 'aria-hidden': 'true' }, sprite('gem', 4)),
    skyline()));

  const body = h('div', { class: 'wrap' });
  frag.append(body);
  body.append(section(ui.tools, ui.toolsSub(TOOLS.length),
    h('div', { class: 'squads' }, Object.values(ROLES).map((r) => h('div', { class: 'squad ' + r.color },
      h('a', { class: 'squad-head', href: '#/outils/' + r.id },
        sprite(r.sprite, 4),
        h('span', {}, h('small', { text: playerName(r.id) }), h('b', { text: T.roles[r.id].name }))),
      h('div', { class: 'minis' }, toolsOf(r.id).map(miniTool)))))));

  body.append(section(ui.arsenal, ui.arsenalSub(ARSENAL_COUNT, verifiedDate),
    h('div', { class: 'cats' }, ARSENAL.map((c) => h('a', { class: 'cat', href: '#/arsenal/' + c.id },
      sprite(c.sprite, 4), h('span', {}, h('b', { text: T.arsenal.cats[c.id].name }), h('small', { text: T.ui.nItems(c.tools.length) }))))),
    h('div', { class: 'form-actions' }, h('a', { class: 'btn p1', href: '#/arsenal' }, ui.arsenalOpen))));

  body.append(section(ui.guides, ui.guidesSub,
    h('div', { class: 'cast' }, Object.entries(GUIDES).map(([id, g]) => h('div', { class: 'cast-one' },
      sprite(g.sprite, 5),
      h('div', {}, h('b', { text: T.guides[id].name }), h('small', { text: T.guides[id].job }), h('p', { text: T.guides[id].line })))))));

  body.append(section(ui.path, ui.pathSub,
    h('ol', { class: 'track' }, T.levels.map((l, i) => h('li', {}, h('a', { href: '#/parcours' },
      h('span', { class: 'track-n', text: String(i + 1) }), h('b', { text: l.name }), h('span', { text: l.goal })))))));

  body.append(h('section', { class: 'section duo' },
    h('a', { class: 'panel link-panel', href: '#/pitch' }, sprite('card', 7),
      h('div', {}, h('h2', { text: ui.card }), h('p', { text: ui.cardText }), h('span', { class: 'btn p1', text: ui.cardOpen }))),
    h('a', { class: 'panel link-panel', href: '#/lexique' }, sprite('book', 7),
      h('div', {}, h('h2', { text: ui.glossary }), h('p', { text: ui.glossaryText(T.glossary.length) }), h('span', { class: 'btn', text: ui.glossaryOpen })))));

  body.append(section(ui.lab, ui.labSub,
    h('a', { class: 'panel link-panel lab', href: 'repondeur/' }, sprite('flask', 7),
      h('div', {}, h('h3', { text: ui.labName }), h('p', { text: ui.labText }), h('span', { class: 'btn', text: ui.labOpen })))));
  return frag;
}

/* Le choix du joueur, en boutons : `base` est le début de l'adresse. */
function roleSeg(base, current) {
  return h('div', { class: 'seg', role: 'group', 'aria-label': T.ui.player },
    [['', T.ui.all], ...Object.keys(ROLES).map((id) => [id, T.roles[id].name])].map(([id, label]) =>
      h('a', { class: (current || '') === id ? 'on' : '', 'aria-current': (current || '') === id ? 'page' : null, href: base + (id ? '/' + id : '') }, label)));
}

function viewTools(roleId) {
  const role = ROLES[roleId] || null;
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' },
    role ? h('div', { class: 'head-sprite ' + role.color }, sprite(role.sprite, 6)) : null,
    h('div', {}, h('h1', { text: role ? `${playerName(role.id)} : ${T.roles[role.id].name}` : T.ui.tools.all }),
      h('p', { class: 'sub', text: role ? T.roles[role.id].about : T.ui.tools.allSub(TOOLS.length) }))));
  frag.append(roleSeg('#/outils', role ? role.id : ''));
  if (role) frag.append(h('div', { class: 'cabinets' }, toolsOf(role.id).map(toolCard)));
  else {
    for (const r of Object.values(ROLES)) {
      frag.append(h('section', { class: 'section tight' },
        h('div', { class: 'section-head' }, h('h2', { text: T.roles[r.id].name }), h('p', { class: 'sub', text: T.roles[r.id].about })),
        h('div', { class: 'cabinets' }, toolsOf(r.id).map(toolCard))));
    }
  }
  frag.append(h('p', { class: 'fineprint', text: T.ui.fineprint }));
  return frag;
}

function viewTool(id, query) {
  const t = toolById.get(id);
  if (!t) return viewMissing();
  const w = T.tools[id];
  const ui = T.ui.tools;
  const frag = h('div', { class: 'wrap' });
  frag.append(h('nav', { class: 'crumbs', 'aria-label': ui.crumb },
    h('a', { href: '#/outils', text: ui.crumb }), h('span', { text: '/' }),
    h('a', { href: '#/outils/' + t.role, text: T.roles[t.role].name }), h('span', { text: '/' }), h('span', { text: w.name })));
  frag.append(h('div', { class: 'page-head' },
    h('div', { class: 'head-sprite ' + ROLES[t.role].color }, sprite(t.sprite, 7)),
    h('div', {}, roleTag(t.role), h('h1', { text: w.question }), h('p', { class: 'sub', text: w.lead }))));

  if (t.kind === 'checklist') frag.append(checklist(t));
  else if (t.kind === 'writer') frag.append(writer(t));
  else if (t.kind === 'canvas') frag.append(canvas(t));
  else frag.append(calculator(t, query));

  const tip = guideSays(t.guide, w.tip);
  if (tip) frag.append(tip);
  if (w.read) frag.append(section(t.kind === 'calc' ? ui.howRead : ui.howUse, null, h('ul', { class: 'prose' }, w.read.map((s) => h('li', { text: s })))));
  frag.append(h('p', { class: 'notice', text: w.limits }));
  const cats = (t.arsenal || []).map((c) => catById.get(c)).filter(Boolean);
  if (cats.length) frag.append(section(ui.inArsenal, ui.inArsenalSub, h('div', { class: 'chips' }, cats.map(catChip))));
  frag.append(section(ui.others, null, h('div', { class: 'minis' }, toolsOf(t.role).filter((x) => x.id !== t.id).map(miniTool))));
  return frag;
}

function calculator(t, query) {
  const w = T.tools[t.id];
  const R = T.res[t.id];
  const values = {};
  for (const f of t.fields) {
    const raw = query.get(f.key);
    const n = raw == null || raw === '' ? NaN : Number(raw);
    values[f.key] = Number.isFinite(n) ? n : f.value;
  }
  const out = h('div', { class: 'panel result ' + ROLES[t.role].color, 'aria-live': 'polite' });
  const linkFor = () => `#/outil/${t.id}?${t.fields.map((f) => `${f.key}=${encodeURIComponent(values[f.key])}`).join('&')}`;
  let urlTimer = null;
  const draw = () => {
    const parts = RESULTS[t.id](values, R);
    out.replaceChildren(h('h2', { class: 'result-title', text: T.ui.result }), ...(parts ? parts.flat().filter(Boolean) : [h('p', { class: 'notice', text: R.invalid })]));
    // L'adresse suit les chiffres : la page peut être partagée ou rechargée telle quelle.
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      // Seulement si la borne est encore à l'écran : sinon on écraserait l'adresse de la page suivante.
      if (out.isConnected && location.hash.startsWith('#/outil/' + t.id)) history.replaceState(null, '', location.pathname + location.search + linkFor());
    }, 300);
  };
  const inputs = [];
  const form = h('form', { class: 'panel form', onsubmit: (e) => e.preventDefault() },
    h('h2', { class: 'result-title', text: T.ui.yourNumbers }),
    t.fields.map((f) => {
      const [label, unit, hint] = w.fields[f.key];
      const input = h('input', { type: 'number', inputmode: 'decimal', id: 'f-' + f.key, step: f.step, min: f.min, max: f.max, value: values[f.key],
        'aria-describedby': hint ? 'h-' + f.key : null,
        oninput: (e) => { values[f.key] = e.target.value === '' ? NaN : Number(e.target.value); draw(); } });
      inputs.push([f, input]);
      return h('div', { class: 'field' },
        h('label', { for: 'f-' + f.key, text: label }),
        h('div', { class: 'field-in' }, input, unit ? h('span', { class: 'unit', text: unit }) : null),
        hint ? h('small', { id: 'h-' + f.key, text: hint }) : null);
    }),
    h('div', { class: 'form-actions' },
      h('button', { class: 'btn', type: 'button', onclick: () => {
        for (const [f, input] of inputs) { values[f.key] = f.value; input.value = f.value; }
        draw();
      } }, T.ui.reset),
      h('button', { class: 'btn', type: 'button', onclick: () => copyText(location.origin + location.pathname + linkFor(), T.ui.linkCopied) }, T.ui.copyLink)));
  draw();
  return h('div', { class: 'tool-grid' }, form, out);
}

function checklist(t) {
  const ui = T.ui.check;
  const items = T.checklists[t.list];
  const key = 'mb-check-' + t.list;
  let done = new Set(store.get(key, []).filter((i) => Number.isInteger(i) && i >= 0 && i < items.length));
  const bar = h('div', { class: 'progress', role: 'img' });
  const count = h('b', {});
  const status = h('p', { class: 'verdict' });
  const refresh = () => {
    count.textContent = `${done.size} / ${items.length}`;
    bar.setAttribute('aria-label', ui.progress(done.size, items.length));
    bar.replaceChildren(...items.map((_, i) => h('i', { class: i < done.size ? 'on' : '' })));
    status.textContent = done.size === items.length ? ui.done : done.size === 0 ? ui.none : ui.left(items.length - done.size);
  };
  const boxes = [];
  const list = h('ol', { class: 'checks' }, items.map(([title, hint], i) => {
    const box = h('input', { type: 'checkbox', id: `${t.list}-${i}`, checked: done.has(i) ? 'checked' : null,
      onchange: (e) => { if (e.target.checked) done.add(i); else done.delete(i); store.set(key, [...done]); refresh(); } });
    boxes.push(box);
    return h('li', {}, box, h('label', { for: `${t.list}-${i}` }, h('b', { text: title }), h('span', { text: hint })));
  }));
  refresh();
  return h('div', { class: 'panel result ' + ROLES[t.role].color },
    top(h('div', { class: 'score' }, count, h('span', { text: ui.label })), bar),
    status, list,
    h('div', { class: 'form-actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
      done = new Set(); store.set(key, []); boxes.forEach((b) => { b.checked = false; }); refresh();
    } }, ui.clear)));
}

/* Le pitch en une phrase : des morceaux, deux phrases assemblées par la langue (affichées en texte brut). */
function writer(t) {
  const ui = T.ui.writer;
  const data = store.get('mb-phrase', {});
  const out = h('div', { class: 'panel result ' + ROLES[t.role].color, 'aria-live': 'polite' });
  const block = (title, text, note) => h('div', { class: 'phrase' },
    h('h3', { text: title }), h('p', { class: 'phrase-text', text }),
    h('div', { class: 'phrase-foot' }, h('small', { text: note }),
      h('button', { class: 'btn', type: 'button', onclick: () => copyText(text, ui.copied) }, T.ui.copy)));
  const draw = () => {
    store.set('mb-phrase', data);
    const parts = calc.phraseParts(data);
    const r = parts ? T.pitch(parts) : null;
    out.replaceChildren(h('h2', { class: 'result-title', text: ui.out }), ...(r ? [
      block(ui.short, r.short, ui.chars(r.short.length)),
      r.text !== r.short ? block(ui.full, r.text, ui.charsFull(r.text.length)) : null,
    ].filter(Boolean) : [h('p', { class: 'verdict', text: ui.empty })]));
  };
  const field = (key) => {
    const [label, placeholder, hint] = ui.fields[key];
    const id = 'w-' + key;
    const input = h('input', { id, type: 'text', maxlength: calc.PHRASE_FIELDS[key], placeholder, 'aria-describedby': hint ? id + '-h' : null,
      oninput: (e) => { data[key] = e.target.value; draw(); } });
    input.value = data[key] || '';
    return h('div', { class: 'field' }, h('label', { for: id, text: label }), input, hint ? h('small', { id: id + '-h', text: hint }) : null);
  };
  const form = h('form', { class: 'panel form', onsubmit: (e) => e.preventDefault() },
    h('h2', { class: 'result-title', text: ui.words }),
    Object.keys(calc.PHRASE_FIELDS).map(field),
    h('div', { class: 'form-actions' },
      h('button', { class: 'btn', type: 'button', onclick: () => { for (const k of Object.keys(data)) delete data[k]; form.reset(); draw(); } }, T.ui.clear)));
  draw();
  return h('div', { class: 'tool-grid wide-form' }, form, out);
}

/* Le lean canvas : neuf cases, numérotées dans l'ordre où on les remplit. */
function canvas(t) {
  const ui = T.ui.canvas;
  const data = store.get('mb-canvas', {});
  const count = h('b', {});
  const filled = () => CANVAS.filter((key) => String(data[key] || '').trim()).length;
  const refresh = () => { store.set('mb-canvas', data); count.textContent = `${filled()} / ${CANVAS.length}`; };
  const boxes = CANVAS.map((key, i) => {
    const [name, hint] = ui.boxes[key];
    const area = h('textarea', { id: 'k-' + key, maxlength: 400, placeholder: hint, rows: 4, oninput: (e) => { data[key] = e.target.value; refresh(); } });
    area.value = data[key] || '';
    return h('div', { class: 'canvas-box', style: `grid-area:${key}` }, h('label', { for: 'k-' + key }, h('span', { text: String(i + 1) }), name), area);
  });
  const asText = () => CANVAS.map((key) => `${ui.boxes[key][0].toUpperCase()}\n${String(data[key] || '').trim() || '—'}`).join('\n\n');
  const grid = h('div', { class: 'canvas-grid' }, boxes);
  refresh();
  return h('div', { class: 'panel result ' + ROLES[t.role].color },
    top(h('div', { class: 'score' }, count, h('span', { text: ui.label })), verdict(ui.note)),
    grid,
    h('div', { class: 'form-actions' },
      h('button', { class: 'btn p1', type: 'button', onclick: () => {
        if (!filled()) { toast(ui.empty); return; }
        copyText(asText(), ui.copied);
      } }, ui.copy),
      h('button', { class: 'btn', type: 'button', onclick: () => {
        for (const k of Object.keys(data)) delete data[k];
        grid.querySelectorAll('textarea').forEach((a) => { a.value = ''; });
        refresh();
      } }, T.ui.clear)));
}

function viewLevels() {
  const ui = T.ui.levels;
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('div', { class: 'head-sprite' }, sprite('steps', 7)),
    h('div', {}, h('h1', { text: ui.title }), h('p', { class: 'sub', text: ui.sub }))));
  frag.append(h('ol', { class: 'levels' }, LEVELS.map((l, i) => {
    const w = T.levels[i];
    return h('li', { class: 'panel level' },
      h('div', { class: 'level-n' }, h('small', { text: ui.level }), h('b', { text: String(i + 1) })),
      h('div', { class: 'level-body' },
        h('h2', { text: w.name }), h('p', { class: 'level-goal', text: w.goal }),
        h('div', { class: 'level-cols' },
          h('div', {}, h('h3', { class: 'p1', text: ui.founder }), h('ul', {}, w.todo.map((x) => h('li', { text: x })))),
          h('div', {}, h('h3', { class: 'p2', text: ui.investor }), h('p', { text: w.investor }))),
        guideSays(l.guide, w.tip),
        h('div', { class: 'level-tools' }, h('span', { text: ui.tools }), l.tools.map((id) => toolById.get(id)).filter(Boolean).map(toolChip)),
        l.arsenal.length ? h('div', { class: 'level-tools' }, h('span', { text: ui.arsenal }), l.arsenal.map((c) => catById.get(c)).filter(Boolean).map(catChip)) : null));
  })));
  return frag;
}

/* La carte de pitch : affichage (texte venu de l'adresse : textContent uniquement). */
function pitchCard(card) {
  const ui = T.ui.pitch.card;
  const traction = [card.t1, card.t2, card.t3].filter(Boolean);
  return h('article', { class: 'pcard' },
    h('header', {}, h('span', { class: 'tag p1', text: card.stage || ui.project }), sprite('star', 3)),
    h('h2', { text: card.name || ui.name }),
    h('p', { class: 'pcard-tagline', text: card.tagline || ui.tagline }),
    card.sector ? h('p', { class: 'pcard-sector', text: card.sector }) : null,
    traction.length ? h('div', { class: 'pcard-block' }, h('h3', { text: ui.traction }), h('ul', {}, traction.map((x) => h('li', { text: x })))) : null,
    card.ask || card.use ? h('div', { class: 'pcard-block' }, h('h3', { text: ui.ask }),
      card.ask ? h('p', { class: 'pcard-ask', text: card.ask }) : null, card.use ? h('p', { text: card.use }) : null) : null,
    card.contact ? h('div', { class: 'pcard-block' }, h('h3', { text: ui.contact }), h('p', { text: card.contact })) : null,
    h('footer', { text: ui.foot }));
}

function viewPitch(code) {
  const ui = T.ui.pitch;
  const frag = h('div', { class: 'wrap' });
  if (code) {
    const card = calc.decodeCard(code);
    frag.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', { text: card ? ui.shared : ui.broken }),
      h('p', { class: 'sub', text: card ? ui.sharedSub : ui.brokenSub }))));
    if (card) frag.append(h('div', { class: 'pcard-solo' }, pitchCard(card)));
    frag.append(h('div', { class: 'form-actions' }, h('a', { class: 'btn p1', href: '#/pitch' }, ui.create)));
    return frag;
  }
  frag.append(h('div', { class: 'page-head' }, h('div', { class: 'head-sprite' }, sprite('card', 7)),
    h('div', {}, h('h1', { text: ui.title }), h('p', { class: 'sub', text: ui.sub }))));
  const card = store.get('mb-card', {});
  const holder = h('div', { class: 'pcard-holder' });
  const draw = () => { holder.replaceChildren(pitchCard(card)); store.set('mb-card', card); };
  const field = (key, { area = false, options = null } = {}) => {
    const [label, placeholder] = ui.fields[key];
    const props = { id: 'c-' + key, maxlength: calc.CARD_FIELDS[key], placeholder, oninput: (e) => { card[key] = e.target.value; draw(); } };
    const control = options
      ? h('select', { id: 'c-' + key, onchange: (e) => { card[key] = e.target.value; draw(); } },
        h('option', { value: '' }, ui.choose), options.map((o) => h('option', { value: o, selected: card[key] === o ? 'selected' : null }, o)))
      : area ? h('textarea', { ...props, rows: 2 }) : h('input', { ...props, type: 'text' });
    if (!options) control.value = card[key] || '';
    return h('div', { class: 'field' }, h('label', { for: 'c-' + key, text: label }), control);
  };
  const link = () => location.origin + location.pathname + '#/pitch/' + calc.encodeCard(card);
  const form = h('form', { class: 'panel form', onsubmit: (e) => e.preventDefault() },
    field('name'),
    field('tagline', { area: true }),
    h('div', { class: 'field-row' }, field('stage', { options: T.stages }), field('sector')),
    field('t1'), field('t2'), field('t3'),
    h('div', { class: 'field-row' }, field('ask'), field('contact')),
    field('use', { area: true }),
    h('p', { class: 'fineprint', text: ui.warn }),
    h('div', { class: 'form-actions' },
      h('button', { class: 'btn p1', type: 'button', onclick: () => {
        if (!String(card.name || '').trim()) { toast(ui.needName); document.getElementById('c-name').focus(); return; }
        copyText(link(), ui.copied);
      } }, ui.copy),
      h('button', { class: 'btn', type: 'button', onclick: () => {
        for (const k of Object.keys(card)) delete card[k];
        form.reset();
        draw();
      } }, T.ui.clear)));
  draw();
  frag.append(h('div', { class: 'tool-grid wide-form' }, form, holder));
  return frag;
}

/* L'arsenal : de vrais outils, par besoin. `arg` : un joueur (filtre) ou un rayon (on y défile). */
function viewArsenal(arg) {
  const ui = T.ui.arsenal;
  const role = ROLES[arg] || null;
  const focus = catById.has(arg) ? arg : null;
  const state = { q: '' };
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('div', { class: 'head-sprite' }, sprite('robot', 5)),
    h('div', {}, h('h1', { text: ui.title }), h('p', { class: 'sub', text: ui.sub(ARSENAL_COUNT, ARSENAL.length) }))));
  frag.append(h('p', { class: 'notice calm-notice', text: ui.notice(verifiedDate) }));
  const list = h('div', { class: 'arsenal' });
  const count = h('span', { class: 'count' });
  const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
  const draw = () => {
    const q = fold(state.q.trim());
    let shown = 0;
    const cats = ARSENAL.filter((c) => !role || c.roles.includes(role.id)).map((c) => {
      const w = T.arsenal.cats[c.id];
      const whole = fold(w.name + ' ' + w.need).includes(q);
      const tools = c.tools.map(([name, url, access, where], i) => ({ name, url, access, where, what: w.tools[i] }))
        .filter((o) => !q || whole || fold(o.name + ' ' + o.what).includes(q));
      if (!tools.length) return null;
      shown += tools.length;
      return h('section', { class: 'panel rayon', id: 'rayon-' + c.id },
        h('div', { class: 'rayon-head' }, sprite(c.sprite, 5), h('div', {}, h('h2', { text: w.name }), h('p', { text: w.need }))),
        h('ul', { class: 'rayon-list' }, tools.map(({ name, url, access, where, what }) => h('li', {},
          h('a', { class: 'rayon-link', href: url, target: '_blank', rel: 'noopener noreferrer' },
            h('b', { text: name }), h('span', { text: host(url) }), h('span', { class: 'sr', text: T.ui.newTab })),
          h('p', { text: what }),
          access || where ? h('div', { class: 'rayon-tags' },
            access ? h('span', { class: 'badge ' + access, text: T.arsenal.access[access] }) : null,
            where ? h('span', { class: 'badge where', text: where.map((p) => T.arsenal.places[p]).join(' · ') }) : null) : null))),
        guideSays(c.guide, w.note));
    }).filter(Boolean);
    count.textContent = T.ui.nItems(shown);
    list.replaceChildren(...(cats.length ? cats : [h('p', { class: 'empty', text: ui.empty })]));
  };
  frag.append(h('div', { class: 'filters' },
    h('input', { class: 'search', type: 'search', placeholder: ui.search, 'aria-label': ui.search, oninput: (e) => { state.q = e.target.value; draw(); } }),
    roleSeg('#/arsenal', role ? role.id : ''), count));
  frag.append(list);
  frag.append(h('p', { class: 'fineprint', text: ui.fineprint }));
  draw();
  if (focus) {
    // La page vient d'être posée : on attend le prochain affichage pour défiler jusqu'au rayon.
    requestAnimationFrame(() => {
      const el = document.getElementById('rayon-' + focus);
      if (el) el.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
    });
  }
  return frag;
}

function viewGlossary() {
  const ui = T.ui.glossary;
  const state = { q: '', who: '' };
  const frag = h('div', { class: 'wrap narrow' });
  frag.append(h('div', { class: 'page-head' }, h('div', { class: 'head-sprite' }, sprite('book', 7)),
    h('div', {}, h('h1', { text: ui.title }), h('p', { class: 'sub', text: ui.sub(T.glossary.length) }))));
  const roles = Object.values(ROLES);
  const sorted = [...T.glossary].sort((a, b) => a[0].localeCompare(b[0], T.locale));
  const list = h('dl', { class: 'glossary' });
  const count = h('span', { class: 'count' });
  const draw = () => {
    const q = fold(state.q.trim());
    const rows = sorted.filter(([term, who, def]) => (!state.who || who.includes(state.who)) && (!q || fold(term + ' ' + def).includes(q)));
    count.textContent = T.ui.nWords(rows.length);
    list.replaceChildren(...(rows.length ? rows.map(([term, who, def]) => h('div', {},
      h('dt', {}, term, h('span', { class: 'who' }, roles.filter((r) => who.includes(r.letter)).map((r) => h('i', { class: 'key ' + r.color, title: ui.useful(T.roles[r.id].name) })))),
      h('dd', { text: def })))
      : [h('p', { class: 'empty', text: ui.empty })]));
  };
  const segBox = h('div', {});
  const drawSeg = () => segBox.replaceChildren(h('div', { class: 'seg', role: 'group', 'aria-label': T.ui.player },
    [['', T.ui.all], ...roles.map((r) => [r.letter, T.roles[r.id].name])].map(([id, label]) => h('button', { type: 'button', class: state.who === id ? 'on' : '',
      'aria-pressed': state.who === id ? 'true' : 'false', onclick: () => { state.who = id; drawSeg(); draw(); } }, label))));
  drawSeg();
  frag.append(h('div', { class: 'filters' },
    h('input', { class: 'search', type: 'search', placeholder: ui.search, 'aria-label': ui.search, oninput: (e) => { state.q = e.target.value; draw(); } }),
    segBox, count));
  frag.append(list);
  frag.append(legend(...roles.map((r) => [r.color, T.roles[r.id].name])));
  draw();
  return frag;
}

function viewAbout() {
  const ui = T.ui.about;
  const frag = h('div', { class: 'wrap narrow' });
  frag.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', { text: ui.title }), h('p', { class: 'sub', text: ui.sub }))));
  for (const [title, items] of ui.sections({ tools: TOOLS.length, arsenal: ARSENAL_COUNT, words: T.glossary.length, date: verifiedDate })) {
    frag.append(section(title, null, h('ul', { class: 'prose' }, items.map((text) => h('li', { text })))));
  }
  return frag;
}

function viewMissing() {
  const ui = T.ui.missing;
  return h('div', { class: 'wrap' }, h('div', { class: 'page-head' }, h('div', { class: 'head-sprite' }, sprite('lens', 7)),
    h('div', {}, h('h1', { text: ui.title }), h('p', { class: 'sub', text: ui.sub }),
      h('div', { class: 'form-actions' }, h('a', { class: 'btn p1', href: '#/' }, ui.home), h('a', { class: 'btn', href: '#/outils' }, ui.tools)))));
}

/* ---------- Navigation ---------- */

let lastPath = null;
function render(event) {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  const [path, arg = ''] = pathPart.split('/');
  let param = arg;
  try { param = decodeURIComponent(arg); } catch { /* adresse abîmée : on garde le texte brut */ }
  let node;
  let title;
  switch (path) {
    case '': node = viewHome(); break;
    case 'outils': node = viewTools(param); title = ROLES[param] ? T.roles[param].name : T.ui.tools.all; break;
    case 'outil': node = viewTool(param, new URLSearchParams(queryPart)); title = toolById.has(param) ? T.tools[param].name : T.ui.missing.title; break;
    case 'arsenal': node = viewArsenal(param); title = T.ui.arsenal.title; break;
    case 'parcours': node = viewLevels(); title = T.ui.levels.title; break;
    case 'pitch': node = viewPitch(param); title = T.ui.pitch.shared; break;
    case 'lexique': node = viewGlossary(); title = T.ui.glossary.title; break;
    case 'a-propos': node = viewAbout(); title = T.ui.about.title; break;
    default: node = viewMissing(); title = T.ui.missing.title;
  }
  document.getElementById('view').replaceChildren(node);
  document.title = (title ? title + ' — ' : '') + T.ui.title;
  const group = { outil: 'outils' }[path] || path;
  for (const a of document.querySelectorAll('[data-nav]')) {
    const on = a.dataset.nav === group;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  if (pathPart !== lastPath) scrollTo(0, 0);
  // Changement de page : le clavier et les lecteurs d'écran repartent du contenu.
  if (event && event.type === 'hashchange' && pathPart !== lastPath) document.getElementById('view').focus({ preventScroll: true });
  lastPath = pathPart;
}

document.getElementById('logo').replaceChildren(sprite('coin', 3));
if (calm) document.documentElement.classList.add('calm');
setLang(pickLang()).then(() => {
  addEventListener('hashchange', render);
  render();
});
