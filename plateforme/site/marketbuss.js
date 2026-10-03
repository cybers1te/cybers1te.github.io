// marketbuss — la plateforme (page unique, sans compte).
//
// Tout se passe dans le navigateur : rien de ce que tape le visiteur n'est
// envoyé quelque part. Les textes saisis (carte de pitch, pitch en une phrase,
// lean canvas, studio) sont affichés avec textContent, jamais avec innerHTML.
//
// Les mots du site sont dans lang/<langue>.js ; ce fichier ne contient que la
// structure des pages. T = la langue en cours, F = ses formats.
//
// La mise en forme est faite avec Tailwind CSS : les classes sont écrites ici,
// en entier (Tailwind lit ce fichier pour savoir lesquelles garder). Après
// avoir changé une classe : `cd plateforme && npm run css`.

import * as calc from './calculs.js?v=__V__';
import { CANVAS, GUIDES, LEVELS, ROLES, STARTUP_EXAMPLE, STARTUP_MODULES, STARTUP_TASKS, TOOLS } from './contenu.js?v=__V__';
import { ARSENAL, VERIFIED } from './arsenal.js?v=__V__';
import { avatar, coin, icon } from './dessins.js?v=__V__';

/* ---------- Classes partagées (Tailwind) ---------- */

const C = {
  wrap: 'mx-auto w-full max-w-6xl px-5 sm:px-8',
  narrow: 'mx-auto w-full max-w-3xl px-5 sm:px-8',
  btn: 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-sheet px-4 py-2 text-[0.95rem] font-semibold leading-tight text-ink no-underline transition-colors hover:border-ink active:translate-y-px',
  btnPen: 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-pen bg-pen px-4 py-2 text-[0.95rem] font-semibold leading-tight text-pen-ink no-underline transition-opacity hover:opacity-85 active:translate-y-px',
  btnSmall: 'inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line bg-sheet px-3 py-1 text-sm font-semibold leading-tight text-ink no-underline transition-colors hover:border-ink active:translate-y-px',
  btnSmallPen: 'inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-pen bg-pen px-3 py-1 text-sm font-semibold leading-tight text-pen-ink no-underline transition-opacity hover:opacity-85 active:translate-y-px',
  input: 'min-h-11 w-full min-w-0 rounded-lg border border-line bg-sheet px-3 py-2 text-ink placeholder:text-faint hover:border-faint focus:border-pen',
  sheet: 'min-w-0 rounded-2xl border border-line bg-sheet p-5 sm:p-6',
  paper: 'quadrille min-w-0 rounded-2xl border border-line p-5 sm:p-6',
  h1: 'text-[clamp(1.75rem,4.2vw,2.6rem)] leading-[1.12]',
  h2: 'text-2xl leading-tight sm:text-[1.7rem]',
  h3: 'text-lg leading-snug',
  small: 'text-sm font-semibold text-faint',
  sub: 'mt-2.5 max-w-2xl text-lg leading-relaxed text-soft',
  fine: 'max-w-2xl text-sm leading-relaxed text-faint',
  link: 'font-semibold text-pen underline decoration-pen/40 underline-offset-4 hover:decoration-pen',
  chip: 'inline-flex items-center gap-1.5 rounded-full border border-line bg-sheet px-3 py-1.5 text-sm font-medium text-ink no-underline transition-colors hover:border-ink',
  actions: 'flex flex-wrap gap-2.5',
  grid2: 'grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]',
  grid2wide: 'grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]',
  th: 'border-b border-line px-2.5 py-2 text-left text-sm font-semibold text-faint',
  td: 'border-b border-line px-2.5 py-2',
  num: ' text-right whitespace-nowrap tabular-nums',
};

/* ---------- Langues ---------- */

const LANGS = { fr: 'FR', en: 'EN', nl: 'NL' };
/* La devise : seulement le symbole affiché (les calculs ne convertissent rien). */
const CURRENCIES = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: '$ CA', XOF: 'FCFA', MAD: 'DH' };
let currency = 'EUR';
// Un texte avec « € » → le même avec la devise choisie (« €1,200 » → « CHF 1,200 », « 1 200 € » → « 1 200 CHF »).
function cur(text) {
  if (currency === 'EUR' || text == null) return text;
  const sym = CURRENCIES[currency];
  return String(text).replace(/€(?=[\d-])/g, sym.length > 1 ? sym + ' ' : sym).replace(/€/g, sym);
}
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
    money: (n) => (n == null || !Number.isFinite(n) ? '—' : cur(pack.money(n, nf))),
    pct: (n, d = 1) => pack.pct(nf(n, d)),
    times: (n) => pack.times(nf(n, n < 10 ? 1 : 0)),
    ord: pack.ord,
    plural: pack.plural,
  };
  verifiedDate = new Intl.DateTimeFormat(pack.locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(VERIFIED + 'T12:00:00'));
  document.documentElement.lang = code;
  paintChrome();
}

/* Le thème : celui du système, sauf si le visiteur en a choisi un (bouton de l'en-tête). */
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : darkQuery.matches);
function paintTheme() {
  const button = document.getElementById('theme');
  if (button) button.replaceChildren(icon(isDark() ? 'sun' : 'moon', 18));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark() ? '#121d1a' : '#f5f6fb');
}
darkQuery.addEventListener('change', paintTheme);

/* L'en-tête et le pied de page sont dans index.html : on y pose les mots de la langue. */
function paintChrome() {
  const ui = T.ui;
  document.querySelector('[data-skip]').textContent = ui.skip;
  document.querySelector('meta[name="description"]').setAttribute('content', ui.description);
  for (const a of document.querySelectorAll('[data-nav]')) a.textContent = ui.nav[a.dataset.nav];
  for (const el of document.querySelectorAll('[data-foot]')) el.textContent = ui.foot[el.dataset.foot];
  for (const a of document.querySelectorAll('[data-foot-link]')) a.textContent = ui.foot.links[a.dataset.footLink];
  const box = document.getElementById('lang');
  box.setAttribute('aria-label', ui.language);
  // La devise et le thème, à côté de la langue : retenus dans le navigateur.
  let money = document.getElementById('cur');
  if (!money) {
    // Sur un petit écran, la devise ne montre que son symbole : tout tient sur la ligne du logo.
    const narrow = matchMedia('(max-width: 639px)').matches;
    money = h('select', { id: 'cur', class: 'h-8 cursor-pointer rounded-md border border-line bg-sheet px-1 text-sm font-medium text-soft hover:border-ink hover:text-ink sm:px-1.5',
      onchange: (e) => { currency = e.target.value; store.set('mb-currency', currency); render(); } },
    Object.entries(CURRENCIES).map(([code, sym]) => h('option', { value: code }, narrow ? sym : `${sym} ${code}`)));
    const theme = h('button', { id: 'theme', type: 'button', class: 'grid size-8 cursor-pointer place-items-center rounded-md border border-line bg-sheet text-soft hover:border-ink hover:text-ink',
      onclick: () => {
        const next = isDark() ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        store.set('mb-theme', next);
        paintTheme();
      } });
    box.after(money, theme);
  }
  money.value = currency;
  money.setAttribute('aria-label', ui.currency);
  money.title = ui.currency;
  const theme = document.getElementById('theme');
  theme.setAttribute('aria-label', ui.theme);
  theme.title = ui.theme;
  paintTheme();
  box.replaceChildren(...Object.entries(LANGS).map(([code, label]) => h('button', { type: 'button', lang: code,
    class: 'h-8 cursor-pointer px-1.5 text-[0.8rem] font-semibold text-soft hover:text-ink aria-pressed:bg-fluo aria-pressed:text-fluo-ink sm:px-2 sm:text-sm',
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
  const el = h('div', { 'data-ui': 'toast', role: 'status', class: 'rounded-xl bg-ink px-4 py-3 text-[0.95rem] font-semibold text-paper shadow-lg' }, text);
  zone.append(el);
  setTimeout(() => el.remove(), 3200);
}
async function copyText(text, done) {
  try { await navigator.clipboard.writeText(text); toast(done); } catch { toast(T.ui.copyFail); }
}

/* ---------- Petits composants ---------- */

/* Le nom d'un profil, avec sa couleur d'intercalaire. */
const roleTag = (role) => h('span', { class: `${ROLES[role].color} inline-flex items-center gap-1.5 text-sm font-semibold text-soft` },
  h('i', { class: 'size-2.5 rounded-[3px] bg-role' }), T.roles[role].name);

/* Une icône sur un carré teinté. `tone` : la classe de couleur (p1…p7), sinon le bleu du stylo. */
const badge = (name, tone = '', big = false) => h('span', { class: `${tone} grid flex-none place-items-center bg-role/12 text-role-ink ${big ? 'size-14 rounded-2xl' : 'size-10 rounded-xl'}` }, icon(name, big ? 28 : 20));

/* Un outil, sur une ligne : son icône, son nom, la question à laquelle il répond. */
function toolRow(t) {
  const w = T.tools[t.id];
  return h('a', { 'data-ui': 'tool', class: `${ROLES[t.role].color} group flex items-start gap-3 rounded-xl p-2.5 text-ink no-underline transition-colors hover:bg-role/10`, href: '#/outil/' + t.id },
    badge(t.icon, ROLES[t.role].color),
    h('span', { class: 'grid min-w-0 gap-0.5' },
      h('b', { class: 'font-semibold leading-snug', text: w.name }),
      h('span', { class: 'text-[0.95rem] leading-snug text-soft', text: w.question })));
}
const toolList = (tools) => h('div', { class: 'grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3' }, tools.map(toolRow));

function section(title, sub, ...kids) {
  return h('section', { class: 'mt-16 sm:mt-20' },
    h('div', { class: 'mb-6' }, h('h2', { class: C.h2, text: title }), sub ? h('p', { class: C.sub, text: sub }) : null),
    ...kids);
}

/* Le haut d'une page : un dessin, le titre, une phrase. */
function pageHead(art, title, sub, ...extra) {
  return h('div', { class: 'flex flex-col gap-4 pb-8 pt-8 sm:flex-row sm:items-start sm:gap-5 sm:pt-10' }, art,
    h('div', { class: 'min-w-0' }, ...extra, h('h1', { class: C.h1, text: title }), sub ? h('p', { class: C.sub, text: sub }) : null));
}

/* Le conseil d'un guide : une annotation dans la marge, à l'encre bleue. */
function guideSays(guideId, text) {
  const g = GUIDES[guideId];
  if (!g || !text) return null;
  const w = T.guides[guideId];
  return h('figure', { 'data-ui': 'guide', class: 'flex max-w-3xl items-start gap-3.5 border-l-2 border-bad/50 pl-4' },
    avatar(g.avatar, 48),
    h('div', { class: 'grid min-w-0 gap-1' },
      h('blockquote', { class: 'casual text-[1.05rem] font-medium leading-snug text-pen', text }),
      h('figcaption', { class: 'text-sm text-faint', text: `${w.name}, ${w.job}` })));
}

const catChip = (c) => h('a', { class: C.chip, href: '#/arsenal/' + c.id }, icon(c.icon, 16), T.arsenal.cats[c.id].name);
const toolChip = (t) => h('a', { class: C.chip, href: '#/outil/' + t.id }, icon(t.icon, 16), T.tools[t.id].name);

/* Un encadré : une limite, une précaution. */
const notice = (text, name = 'triangle-alert') => h('p', { 'data-ui': 'notice', class: 'flex max-w-3xl gap-3 rounded-xl border border-line bg-sheet p-4 text-[0.95rem] leading-relaxed text-soft' },
  h('span', { class: 'mt-0.5 text-bad' }, icon(name, 18)), h('span', { text }));

/* Le grand chiffre d'un résultat, passé au surligneur (ou corrigé en rouge quand il est mauvais). */
const score = (value, label, cls = '') => h('div', { 'data-score': '', class: 'grid justify-items-start gap-2' },
  // L'écart avec le chiffre d'avant vient se poser à côté du grand chiffre (voir calculator).
  h('div', { class: 'flex flex-wrap items-center gap-x-3 gap-y-1' },
    h('b', { class: `surligne casual text-[clamp(2.1rem,6vw,3.4rem)] font-extrabold leading-[1.2] [overflow-wrap:anywhere] ${cls === 'bad' ? 'rate' : ''}`, text: value })),
  h('span', { class: 'max-w-xs leading-snug text-soft', text: cur(label) }));
const facts = (list) => h('div', { class: 'grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-x-6 gap-y-4 border-y border-line py-4' },
  list.filter(Boolean).map(([label, value]) => h('div', { class: 'grid content-start gap-0.5' },
    h('span', { class: 'text-sm leading-snug text-faint', text: cur(label) }), h('b', { class: 'text-lg font-semibold tabular-nums', text: cur(value) }))));
const chartTitle = (text) => h('h3', { class: C.h3, text });

/* Un tableau. Une cellule : un texte, un nœud, ou { text, cls }. La première colonne est à gauche, les autres à droite. */
function tableOf(head, rows) {
  const cell = (c, i) => {
    const o = c != null && typeof c === 'object' && !(c instanceof Node) ? c : { text: c };
    const cls = C.td + (i ? C.num : '') + (o.cls ? ' ' + o.cls : '');
    return o.text instanceof Node ? h('td', { class: cls }, o.text) : h('td', { class: cls, text: o.text });
  };
  return h('div', { class: 'overflow-x-auto' }, h('table', { class: 'w-full border-collapse text-[0.95rem]' },
    h('thead', {}, h('tr', {}, head.map((t, i) => h('th', { scope: 'col', class: C.th + (i ? C.num : ''), text: t })))),
    h('tbody', {}, rows.map((r) => h('tr', {}, r.map(cell))))));
}
const NEG = 'font-semibold text-bad';
const POS = 'font-semibold text-good';

/* Le graphique et ses repères : les textes restent en HTML, donc lisibles à toutes les largeurs. */
function figure(chart, ticks, top) {
  return h('div', { class: 'grid gap-1.5' },
    h('p', { class: 'text-sm text-faint', text: T.ui.highest(top) }),
    chart,
    // Un repère au bord du graphique s'aligne sur le bord, les autres se centrent sous leur colonne.
    h('div', { class: 'relative h-5 text-sm text-faint', 'aria-hidden': 'true' }, ticks.map(([at, label]) => h('span', { class: 'absolute top-0 whitespace-nowrap',
      style: `left:${(at * 100).toFixed(2)}%;transform:translateX(${at < 0.05 ? '0' : at > 0.95 ? '-100%' : '-50%'})`, text: label }))));
}

/* Des colonnes : valeurs positives vers le haut, négatives vers le bas.
   `data` : [{ label, value, title }]. `fmt` : comment écrire une valeur. */
function columns(data, { height = 150, pos = 'var(--p1)', neg = 'var(--hot)', every = 6, fmt = F.money } = {}) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const span = max - min || 1;
  const bw = 8;
  const gap = 3;
  // Avec peu de colonnes, on garde la place de douze : une seule ne remplit pas tout le graphique.
  const W = Math.max(data.length, 12) * (bw + gap);
  const zero = Math.round((max / span) * height);
  const root = svg('svg', { viewBox: `0 0 ${W} ${height + 1}`, class: 'colonnes', preserveAspectRatio: 'none', role: 'img',
    'aria-label': `${fmt(data[0].value)} → ${fmt(data[data.length - 1].value)}` });
  const ticks = [];
  data.forEach((d, i) => {
    const hpx = Math.max(d.value === 0 ? 0 : 2, Math.round((Math.abs(d.value) / span) * height));
    const y = d.value >= 0 ? zero - hpx : zero;
    // --i : le rang de la colonne, pour qu'elles montent l'une après l'autre à la première ouverture.
    const r = svg('rect', { x: i * (bw + gap) + gap / 2, y, width: bw, height: hpx, 'data-col': d.value >= 0 ? 'pos' : 'neg', style: `fill:${d.value >= 0 ? pos : neg};--i:${i}` });
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
  const gap = 4;
  const W = Math.max(data.length, 10) * (bw + gap);
  // data-rise : à la première ouverture, le graphique monte d'un bloc (les morceaux d'une colonne restent collés).
  const root = svg('svg', { viewBox: `0 0 ${W} ${height + 1}`, class: 'colonnes', 'data-rise': '', preserveAspectRatio: 'none', role: 'img', 'aria-label': label });
  const ticks = [];
  data.forEach((d, i) => {
    let y = height;
    d.parts.forEach((v, k) => {
      const hpx = Math.round((Math.max(0, v) / max) * height);
      if (!hpx) return;
      y -= hpx;
      // Un filet de papier sépare les deux couleurs d'une même colonne.
      const r = svg('rect', { x: i * (bw + gap) + gap / 2, y, width: bw, height: k ? Math.max(1, hpx - 1) : hpx, style: `fill:${colors[k]}` });
      r.append(svg('title', { text: d.title }));
      root.append(r);
    });
    if (i % every === 0) ticks.push([(i * (bw + gap) + gap / 2 + bw / 2) / W, d.label]);
  });
  root.append(svg('rect', { x: 0, y: height, width: W, height: 1, style: 'fill:var(--ink)' }));
  return figure(root, ticks, F.money(max));
}

/* Une barre à comparer : le libellé, la barre, la valeur. `inner` : la barre elle-même. */
const versusRow = (label, inner, text) => h('div', { class: 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,11rem)_minmax(2.5rem,1fr)_auto]' },
  h('span', { class: 'leading-tight text-soft', text: label }), inner, h('b', { class: 'font-semibold tabular-nums', text }));
const track = (cls, pct, width = null) => h('span', { class: 'col-span-2 row-start-2 block h-3 overflow-hidden rounded-full bg-line/70 sm:col-span-1 sm:row-start-auto', 'aria-hidden': 'true', style: width == null ? null : `width:${width}%` },
  h('span', { 'data-bar': '', class: `block h-full rounded-full s-${cls || 'off'}`, style: `width:${pct}%` }));

/* Des barres horizontales à comparer : `rows` : [{ label, value, text, cls }]. */
function versus(rows) {
  const list = rows.filter(Boolean);
  const max = Math.max(1e-9, ...list.map((r) => r.value));
  return h('div', { class: 'grid gap-3' }, list.map((r) => versusRow(r.label, track(r.cls, Math.max(1, (Math.max(0, r.value) / max) * 100)), r.text)));
}

/* Une jauge : une seule barre, de 0 à 100 %. */
const meter = (pct, label) => h('div', { class: 'h-4 overflow-hidden rounded-full bg-line/70', role: 'img', 'aria-label': label },
  h('span', { 'data-bar': '', class: 'block h-full min-w-0.5 rounded-full s-role', style: `width:${pct}%` }));

const legend = (...items) => h('div', { class: 'flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-soft' },
  items.map(([cls, text]) => h('span', { class: 'inline-flex items-center gap-2' }, h('i', { class: `size-3 flex-none rounded-[3px] s-${cls}` }), text)));

/* Des cases de couleur, dix par rang. `list` : la couleur de chaque case. */
const cells = (list, label) => h('div', { class: 'grid w-max grid-cols-10 gap-[3px]', role: 'img', 'aria-label': label },
  list.map((c) => h('i', { class: `size-3.5 rounded-[3px] s-${c}` })));

/* Cent cases à partager : `parts` : [[couleur, nom, pourcentage]]. Les arrondis vont aux plus gros restes. */
function waffle(parts) {
  const count = parts.map((p) => Math.floor(p[2]));
  let rest = 100 - count.reduce((s, n) => s + n, 0);
  const order = parts.map((p, i) => [p[2] - Math.floor(p[2]), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; rest > 0 && order.length; k++, rest--) count[order[k % order.length][1]]++;
  const squares = [];
  parts.forEach((p, i) => { for (let n = 0; n < count[i]; n++) squares.push(p[0]); });
  return cells(squares, parts.map((p) => `${p[1]} ${F.pct(p[2])}`).join(', '));
}

/* Les douze mois d'une trésorerie : une case par mois qui reste. */
const monthsMeter = (n, R) => h('div', { class: 'grid gap-1.5', role: 'img', 'aria-label': R.months(n) },
  h('div', { class: 'flex gap-1' }, Array.from({ length: 12 }, (_, i) => h('i', { class: `h-7 w-3.5 rounded-[3px] ${i < n ? (n < 6 ? 's-hot' : 's-p1') : 's-off'}` }))),
  h('small', { class: 'text-sm text-faint', text: R.monthsNote }));

function valuesTable(head, rows) {
  return h('details', { 'data-values': '' }, h('summary', { class: 'cursor-pointer ' + C.link }, T.ui.seeValues),
    h('div', { class: 'mt-3' }, tableOf(head, rows)));
}

const top = (...kids) => h('div', { class: 'flex flex-wrap items-center gap-x-8 gap-y-5' }, ...kids);
const verdict = (text) => h('p', { 'data-ui': 'verdict', class: 'max-w-2xl text-lg leading-relaxed', text: cur(text) });
const years = (n) => (n > 30 ? 10 : 5);

/* ---------- Résultats des calculateurs ----------
   Chaque fonction reçoit v (les chiffres saisis) et R (les mots de l'outil),
   et rend les morceaux du résultat. `null` : chiffres impossibles. */

const RESULTS = {
  runway(v, R) {
    const r = calc.runway(v);
    if (!r) return null;
    const shown = r.months == null ? r.series : r.series.slice(0, Math.min(r.series.length, r.months + 8));
    const lives = r.months == null ? 12 : Math.min(12, r.months);
    return [
      top(score(r.months == null ? `${r.horizon}+` : String(r.months), say(R.label, r), r.months != null && r.months < 6 ? 'bad' : ''),
        monthsMeter(lives, R)),
      verdict(R.verdict(v, r, F)),
      facts(R.facts(v, r, F)),
      chartTitle(R.chart),
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
      chartTitle(R.chart),
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
      chartTitle(R.chart),
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
      chartTitle(R.chart),
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
      chartTitle(R.chart),
      tableOf(R.table, [Math.floor(r.units / 2), r.units, Math.ceil(r.units * 1.5)].map((u) => {
        const result = u * r.margin - v.fixed;
        return [F.nf(u), F.money(u * v.price), { text: F.money(result), cls: result < 0 ? NEG : POS }];
      })),
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
      chartTitle(R.chart),
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
    const grid = v.count <= 200 ? cells([...Array(r.fails).fill('off'), ...Array(r.mids).fill('p1'), ...Array(r.winners).fill('ok')], R.aria(r)) : null;
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
      chartTitle(R.chart),
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
      h('div', { class: 'grid gap-3' }, r.parts.map((p) => versusRow(R.criteria[p.key],
        track(p.key === r.weakest ? 'hot' : 'p2', Math.max(1, (p.points / p.weight) * 100), (p.weight / 30) * 100), R.points(p, F)))),
      facts(R.facts(v, r, F)),
    ];
  },

  composes(v, R) {
    const r = calc.compound(v);
    if (!r) return null;
    return [
      top(score(F.money(r.value), say(R.label, v))),
      verdict(R.verdict(v, r, F)),
      chartTitle(R.chart),
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
      chartTitle(R.chart),
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
      chartTitle(R.chart),
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
      chartTitle(R.chart),
      columns(r.series.map((p) => ({ label: String(p.year), value: p.value, title: R.bar(p, F) })), { every: years(r.series.length), pos: 'var(--violet)' }),
      facts(R.facts(v, r, F)),
    ];
  },

  credit(v, R) {
    const r = calc.mortgage(v);
    if (!r) return null;
    return [
      top(score(F.money(r.monthly), R.label)),
      verdict(R.verdict(v, r, F)),
      chartTitle(R.chart),
      stacked(r.series.map((p) => ({ label: String(p.year), parts: [p.principal, p.interest], title: R.bar(p, F) })),
        { every: years(v.years), colors: ['var(--p5)', 'var(--hot)'], label: R.aria }),
      legend(['p5', R.legend[0]], ['hot', R.legend[1]]),
      facts(R.facts(v, r, F)),
      valuesTable(R.table, r.series.map((p) => R.row(p, F))),
    ];
  },

  capacite(v, R) {
    const r = calc.borrowingCapacity(v);
    if (!r) return null;
    return [
      top(score(F.money(r.loan), R.label, r.loan === 0 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: r.room, text: F.money(r.room), cls: 'violet' },
        v.debts > 0 ? { label: R.rows[1], value: v.debts, text: F.money(v.debts), cls: 'hot' } : null,
        { label: R.rows[2], value: r.maxMonthly, text: F.money(r.maxMonthly), cls: 'p5' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  rendement(v, R) {
    const r = calc.rentalYield(v);
    if (!r) return null;
    return [
      top(score(F.pct(r.net, 2), R.label, r.net < 0 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      chartTitle(R.chart),
      versus([{ label: R.rows[0], value: r.yearRent, text: F.money(r.yearRent), cls: 'ok' },
        v.charges > 0 ? { label: R.rows[1], value: v.charges, text: F.money(v.charges), cls: 'hot' } : null,
        { label: R.rows[2], value: r.netIncome, text: F.money(r.netIncome), cls: 'p5' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  cashflow(v, R) {
    const r = calc.rentalCashflow(v);
    if (!r) return null;
    return [
      top(score(F.money(r.cash), R.label, r.cash < 0 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      chartTitle(R.chart),
      versus([{ label: R.rows[0], value: r.income, text: F.money(r.income), cls: 'ok' },
        v.loan > 0 ? { label: R.rows[1], value: v.loan, text: F.money(v.loan), cls: 'hot' } : null,
        v.charges > 0 ? { label: R.rows[2], value: v.charges, text: F.money(v.charges), cls: 'violet' } : null,
        r.reserve > 0 ? { label: R.rows[3], value: r.reserve, text: F.money(r.reserve), cls: 'p1' } : null]),
      facts(R.facts(v, r, F)),
    ];
  },

  louer(v, R) {
    const r = calc.rentOrBuy(v);
    if (!r) return null;
    return [
      top(score(F.money(Math.abs(r.gap)), say(R.label, r))),
      verdict(R.verdict(v, r, F)),
      chartTitle(R.chart),
      columns(r.series.map((p) => ({ label: String(p.year), value: p.buy - p.rent, title: R.bar(p, F) })), { every: years(v.horizon), pos: 'var(--p5)', neg: 'var(--p2)' }),
      legend(['p5', R.legend[0]], ['p2', R.legend[1]]),
      facts(R.facts(v, r, F)),
      valuesTable(R.table, r.series.map((p) => R.row(p, F))),
    ];
  },

  pub(v, R) {
    const r = calc.adsProfit(v);
    if (!r) return null;
    return [
      top(score(F.money(r.profit), R.label, r.profit < 0 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: r.revenue, text: F.money(r.revenue), cls: 'violet' },
        { label: R.rows[1], value: v.orders * r.margin, text: F.money(v.orders * r.margin), cls: 'ok' },
        { label: R.rows[2], value: v.spend, text: F.money(v.spend), cls: 'hot' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  livraison(v, R) {
    const r = calc.freeShipping(v);
    if (!r) return null;
    return [
      top(score(F.money(r.threshold), R.label)),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: v.basket, text: F.money(v.basket), cls: 'p2' },
        { label: R.rows[1], value: r.threshold, text: F.money(r.threshold), cls: 'p6' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  stock(v, R) {
    const r = calc.reorder(v);
    if (!r) return null;
    return [
      top(score(F.nf(r.point), R.label, r.late ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: v.stock, text: F.nf(v.stock), cls: r.late ? 'hot' : 'ok' },
        { label: R.rows[1], value: r.point, text: F.nf(r.point), cls: 'p6' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  retours(v, R) {
    const r = calc.returnsCost(v);
    if (!r) return null;
    return [
      top(score(F.money(r.total), R.label, r.share != null && r.share >= 20 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: r.margin, text: F.money(r.margin), cls: 'ok' },
        { label: R.rows[1], value: r.total, text: F.money(r.total), cls: 'hot' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  marketplace(v, R) {
    const r = calc.marketplace(v);
    if (!r) return null;
    return [
      top(score(F.money(Math.abs(r.gap)), say(R.label, r))),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: r.site, text: F.money(r.site), cls: 'p6' },
        { label: R.rows[1], value: r.mp, text: F.money(r.mp), cls: 'p2' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  budget(v, R) {
    const r = calc.budgetSplit(v);
    if (!r) return null;
    const parts = [['hot', R.parts[0], r.needsPct], ['violet', R.parts[1], r.wantsPct], ['ok', R.parts[2], r.savingsPct]].filter((p) => p[2] > 0);
    const rule = calc.BUDGET_RULE;
    return [
      top(score(F.money(r.savings), R.label, r.savings < 0 ? 'bad' : ''), r.savings >= 0 ? waffle(parts) : null),
      verdict(R.verdict(v, r, F)),
      legend(...parts.map((p) => [p[0], `${p[1]} : ${F.pct(p[2])}`])),
      chartTitle(R.chart),
      tableOf(R.table, [['needs', v.needs, r.needsPct], ['wants', v.wants, r.wantsPct], ['savings', r.savings, r.savingsPct]].map(([k, amount, pct], i) => {
        const over = k === 'savings' ? pct < rule[k] : pct > rule[k];
        return [R.parts[i], { text: `${F.money(amount)} (${F.pct(pct)})`, cls: over ? NEG : POS }, `${F.money(r.target[k])} (${F.pct(rule[k], 0)})`];
      })),
      facts(R.facts(v, r, F)),
    ];
  },

  dette(v, R) {
    const r = calc.debtPayoff(v);
    if (!r) return null;
    if (r.months == null) return [top(score(R.never, R.neverLabel, 'bad')), verdict(R.neverVerdict(v, r, F))];
    return [
      top(score(F.nf(r.months), say(R.label, r), r.months > 36 ? 'bad' : '')),
      verdict(R.verdict(v, r, F)),
      chartTitle(R.chart),
      columns(r.series.map((p) => ({ label: String(p.year), value: p.balance, title: R.bar(p, F) })), { every: 1, pos: 'var(--p7)' }),
      facts(R.facts(v, r, F)),
    ];
  },

  heures(v, R) {
    const r = calc.workHours(v);
    if (!r) return null;
    return [
      top(score(F.nf(r.hours, 1), R.label)),
      verdict(R.verdict(v, r, F)),
      versus([{ label: R.rows[0], value: v.price, text: F.money(v.price), cls: 'p7' },
        v.years > 0 ? { label: R.rows[1], value: r.later, text: F.money(r.later), cls: 'ok' } : null]),
      facts(R.facts(v, r, F)),
    ];
  },

  voiture(v, R) {
    const r = calc.carCost(v);
    if (!r) return null;
    return [
      top(score(F.money(r.month), R.label)),
      verdict(R.verdict(v, r, F)),
      chartTitle(R.chart),
      versus([{ label: R.rows[0], value: r.loss, text: F.money(r.loss), cls: 'violet' },
        { label: R.rows[1], value: r.fuel, text: F.money(r.fuel), cls: 'hot' },
        { label: R.rows[2], value: r.fixed, text: F.money(r.fixed), cls: 'p2' }]),
      facts(R.facts(v, r, F)),
    ];
  },

  coussin(v, R) {
    const r = calc.cushion(v);
    if (!r) return null;
    return [
      top(score(F.money(r.target), R.label)),
      meter(r.progress, R.aria(r, F)),
      verdict(R.verdict(v, r, F)),
      facts(R.facts(v, r, F)),
    ];
  },
};

/* ---------- Le grand chiffre, en nombre ----------
   Pour chaque calculateur : le calcul, le chiffre qu'il met en avant, son format,
   et le sens qui arrange (true : plus haut vaut mieux, false : plus bas, null : ça dépend).
   `alt` : le texte quand il n'y a pas de chiffre (jamais, sans fin…), compté comme l'infini. */

const FMT = {
  money: (n) => F.money(n), nf: (n) => F.nf(n), nf1: (n) => F.nf(n, 1),
  pct: (n) => F.pct(n), pct2: (n) => F.pct(n, 2), times: (n) => F.times(n),
};
const HEAD = {
  runway: [calc.runway, (r) => r.months, 'nf', true, (r) => `${r.horizon}+`],
  lever: [calc.raiseNeed, (r) => r.raise, 'money', false],
  dilution: [calc.dilution, (r) => r.founders, 'pct', true],
  vesting: [calc.vesting, (r) => r.vested, 'pct2', true],
  marche: [calc.marketSize, (r) => r.som, 'money', true],
  client: [calc.unitEconomics, (r) => r.ratio, 'times', true, (r, R) => R.free],
  objectif: [calc.revenueTarget, (r) => r.perMonth, 'nf1', false],
  croissance: [calc.growthRate, (r) => r.monthly, 'pct2', false],
  tarif: [calc.dayRate, (r) => r.rate, 'money', false],
  devis: [calc.quote, (r) => r.ttc, 'money', null],
  prix: [calc.pricing, (r, v) => (v.vat > 0 ? r.ttc : r.ht), 'money', null],
  remise: [calc.discount, (r) => r.extra, 'pct', false, (r, R) => R.never],
  seuil: [calc.breakEven, (r) => r.units, 'nf', false, (r, R) => R.never],
  tunnel: [calc.funnel, (r) => r.customers, 'nf1', true],
  tirelire: [calc.setAside, (r) => r.aside, 'money', null],
  ticket: [calc.exitReturn, (r) => r.multiple, 'times', true],
  valo: [calc.maxValuation, (r) => r.post, 'money', true],
  portefeuille: [calc.portfolio, (r) => r.multiple, 'times', true],
  suivre: [calc.proRata, (r) => r.invest, 'money', null],
  fonte: [calc.rounds, (r) => r.final, 'pct2', true],
  convertible: [calc.convertible, (r) => r.stake, 'pct2', null],
  cascade: [calc.waterfall, (r) => r.others, 'money', true],
  note: [calc.scorecard, (r) => r.score, 'nf', true],
  composes: [calc.compound, (r) => r.value, 'money', true],
  cible: [calc.savingsGoal, (r) => r.monthly, 'money', false],
  frais: [calc.fees, (r) => r.gap, 'money', null],
  inflation: [calc.inflation, (r) => r.real, 'money', true],
  reserve: [calc.drawdown, (r) => r.years, 'nf1', true, (r, R) => R.forever],
  coussin: [calc.cushion, (r) => r.target, 'money', null],
  credit: [calc.mortgage, (r) => r.monthly, 'money', false],
  capacite: [calc.borrowingCapacity, (r) => r.loan, 'money', true],
  rendement: [calc.rentalYield, (r) => r.net, 'pct2', true],
  cashflow: [calc.rentalCashflow, (r) => r.cash, 'money', true],
  louer: [calc.rentOrBuy, (r) => Math.abs(r.gap), 'money', null],
  pub: [calc.adsProfit, (r) => r.profit, 'money', true],
  livraison: [calc.freeShipping, (r) => r.threshold, 'money', null],
  stock: [calc.reorder, (r) => r.point, 'nf', null],
  retours: [calc.returnsCost, (r) => r.total, 'money', false],
  marketplace: [calc.marketplace, (r) => Math.abs(r.gap), 'money', null],
  budget: [calc.budgetSplit, (r) => r.savings, 'money', true],
  dette: [calc.debtPayoff, (r) => r.months, 'nf', false, (r, R) => R.never],
  heures: [calc.workHours, (r) => r.hours, 'nf1', false],
  voiture: [calc.carCost, (r) => r.month, 'money', false],
};

/* → { r, n, text, fmt, up } ou null si les chiffres sont impossibles. */
function headOf(id, v, R) {
  const [fn, pick, fmt, up, alt] = HEAD[id];
  const r = fn(v);
  if (!r) return null;
  const n = pick(r, v);
  if (n == null || !Number.isFinite(n)) return { r, n: Infinity, text: alt ? alt(r, R) : '—', up };
  return { r, n, text: FMT[fmt](n), fmt, up };
}

/* L'écart entre deux grands chiffres : texte et couleur (good, bad ou flat). */
function deltaOf(a, b) {
  if (!a || !b || a.text === b.text) return null;
  const d = b.n - a.n;
  const text = Number.isFinite(d) ? (d > 0 ? '+' : '') + FMT[b.fmt || a.fmt](d) : b.text;
  return { text, cls: a.up == null ? 'flat' : (d > 0) === a.up ? 'good' : 'bad' };
}

/* Le calcul, pas à pas : les lignes viennent de la langue (T.steps). Les étapes sont numérotées : c'est une vraie suite. */
function stepsBlock(rows) {
  const list = (rows || []).filter(Boolean);
  if (!list.length) return null;
  return h('div', { 'data-ui': 'steps', class: 'grid gap-1.5' },
    h('h3', { class: C.h3 + ' flex items-center gap-2' }, icon('calculator', 18), T.ui.steps),
    h('p', { class: 'text-sm text-faint', text: T.ui.stepsSub }),
    h('ol', { class: 'mt-1.5 grid' }, list.map(([label, expr], i) => h('li', { 'data-step': '', style: `--i:${i}`, class: 'grid grid-cols-[1.9rem_minmax(0,1fr)] gap-x-2 border-t border-dashed border-line py-2.5' },
      h('span', { class: 'row-span-2 mt-0.5 grid size-6 place-items-center rounded-full border-[1.5px] border-role text-xs font-bold text-role-ink', 'aria-hidden': 'true', text: String(i + 1) }),
      h('span', { class: 'leading-snug text-soft', text: cur(label) }),
      h('b', { class: 'font-mono text-[1.02rem] font-medium leading-snug [overflow-wrap:anywhere]', text: cur(expr) })))));
}

/* Un chiffre qui défile jusqu'à sa valeur. */
function tween(el, from, to, fmt, done) {
  const steps = 14;
  let k = 0;
  const tick = () => {
    if (!el.isConnected) return;
    k++;
    if (k >= steps) { done(); return; }
    const p = 1 - (1 - k / steps) ** 3;
    el.textContent = fmt(from + (to - from) * p);
    el._raf = requestAnimationFrame(() => requestAnimationFrame(tick));
  };
  el.textContent = fmt(from);
  el._raf = requestAnimationFrame(tick);
}

/* Quelques confettis, quand une liste est finie. */
function burst(from) {
  if (calm) return;
  const box = from.getBoundingClientRect();
  const layer = h('div', { class: 'confetti', 'aria-hidden': 'true', style: `left:${Math.round(box.left + box.width / 2)}px;top:${Math.round(box.top + box.height / 2)}px` });
  const colors = ['p1', 'ok', 'hot', 'p5', 'violet', 'p6', 'p2'];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const d = 70 + (i % 3) * 34;
    layer.append(h('i', { class: 's-' + colors[i % colors.length], style: `--dx:${Math.round(Math.cos(a) * d)}px;--dy:${Math.round(Math.sin(a) * d - 50)}px;--d:${(i % 4) * 40}ms;--r:${(i % 2 ? 1 : -1) * (120 + i * 25)}deg` }));
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 1600);
}

/* ---------- Vues ---------- */

/* Sur l'accueil : un vrai outil, en petit. On change un chiffre, la feuille se recalcule. */
function demoSheet(id) {
  const t = toolById.get(id);
  const w = T.tools[id];
  const R = T.res[id];
  const values = Object.fromEntries(t.fields.map((f) => [f.key, f.value]));
  const out = h('div', { class: 'grid gap-4', 'aria-live': 'polite' });
  const open = h('a', { class: C.btn, href: '#/outil/' + id }, T.ui.home.demoOpen, icon('arrow-right', 16));
  const draw = () => {
    open.href = `#/outil/${id}?${t.fields.map((f) => `${f.key}=${encodeURIComponent(values[f.key])}`).join('&')}`;
    const parts = RESULTS[id](values, R);
    const head = parts ? headOf(id, values, R) : null;
    if (!parts) { out.replaceChildren(h('p', { class: 'text-soft', text: R.invalid })); return; }
    // Le grand chiffre et la phrase qui l'explique, puis le calcul ligne par ligne.
    out.replaceChildren(...[...parts.flat().filter(Boolean).slice(0, 2), head && T.steps[id] ? stepsBlock(T.steps[id](values, head.r, F)) : null].filter(Boolean));
  };
  const fields = t.fields.map((f) => {
    const [label, rawUnit] = w.fields[f.key];
    const input = h('input', { type: 'number', inputmode: 'decimal', id: 'd-' + f.key, step: f.step, min: f.min, max: f.max, value: values[f.key],
      class: C.input + ' font-semibold tabular-nums',
      oninput: (e) => { values[f.key] = e.target.value === '' ? NaN : Number(e.target.value); if (Number.isFinite(values[f.key])) range.value = values[f.key]; draw(); } });
    const lo = f.min ?? 0;
    const hi = lo + Math.ceil(((f.max ?? Math.max(f.value * 4, lo + f.step * 10)) - lo) / f.step) * f.step;
    const range = h('input', { type: 'range', class: 'curseur', min: lo, max: hi, step: f.step, value: values[f.key], 'aria-label': T.ui.slider(label), tabindex: '-1',
      oninput: (e) => { values[f.key] = Number(e.target.value); input.value = e.target.value; draw(); } });
    return h('div', { class: 'grid gap-1' },
      h('label', { for: 'd-' + f.key, class: 'text-[0.95rem] font-semibold leading-snug', text: label }),
      h('div', { class: 'flex items-center gap-2' }, input, rawUnit ? h('span', { class: 'flex-none text-sm text-faint', text: cur(rawUnit) }) : null),
      range);
  });
  draw();
  return h('div', { 'data-ui': 'demo', class: `${ROLES[t.role].color} ${C.paper} grid gap-5` },
    h('div', { class: 'flex items-start gap-3' }, badge(t.icon, ROLES[t.role].color),
      h('div', { class: 'grid gap-0.5' }, h('p', { class: C.small, text: T.ui.home.demo }), h('h2', { class: 'text-xl leading-snug', text: w.question }))),
    h('form', { class: 'grid items-end gap-x-4 gap-y-3 sm:grid-cols-3', onsubmit: (e) => e.preventDefault() }, fields),
    out,
    h('div', { class: C.actions }, open));
}

/* Les sept profils, comme les intercalaires d'un classeur : un onglet par profil, et ses outils dessous. */
function binder() {
  const roles = Object.values(ROLES);
  let current = ROLES[store.get('mb-role', '')] ? store.get('mb-role', '') : roles[0].id;
  const tabs = h('div', { role: 'tablist', 'aria-label': T.ui.home.choose, class: 'relative z-10 -mb-px flex gap-1 overflow-x-auto pb-px [scrollbar-width:thin]' });
  const panel = h('div', { role: 'tabpanel', id: 'binder-panel', tabindex: '0', class: 'rounded-b-2xl rounded-tr-2xl border border-line bg-sheet p-5 sm:p-6' });
  const draw = (focus) => {
    tabs.replaceChildren(...roles.map((r) => h('button', { type: 'button', role: 'tab', id: 'tab-' + r.id, 'data-ui': 'profile', 'aria-selected': r.id === current ? 'true' : 'false', 'aria-controls': 'binder-panel',
      tabindex: r.id === current ? '0' : '-1',
      class: `${r.color} flex flex-none cursor-pointer items-center gap-2 rounded-t-xl border border-b-0 border-t-[3px] border-line border-t-role bg-role/10 px-3 py-2 text-[0.95rem] font-semibold text-soft hover:text-ink aria-selected:bg-sheet aria-selected:text-ink aria-selected:shadow-[0_1px_0_var(--sheet)]`,
      onclick: () => { current = r.id; store.set('mb-role', current); draw(true); },
      onkeydown: (e) => {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        current = roles[(roles.findIndex((x) => x.id === current) + step + roles.length) % roles.length].id;
        store.set('mb-role', current);
        draw(true);
      } }, avatar(r.avatar, 28), T.roles[r.id].name)));
    const r = ROLES[current];
    const w = T.roles[r.id];
    panel.setAttribute('aria-labelledby', 'tab-' + r.id);
    panel.className = `${r.color} rounded-b-2xl rounded-tr-2xl border border-line bg-sheet p-5 sm:p-6`;
    panel.replaceChildren(h('div', { class: 'grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]' },
      h('div', { class: 'flex items-start gap-4 lg:flex-col' }, avatar(r.avatar, 76),
        h('div', { class: 'grid gap-1.5' },
          h('h3', { class: 'casual text-xl font-extrabold leading-tight', text: w.pitch }),
          h('p', { class: 'text-[0.95rem] leading-snug text-soft', text: w.about }),
          h('p', { class: 'mt-1' }, h('a', { class: C.link, href: '#/outils/' + r.id }, T.ui.nTools(toolsOf(r.id).length))))),
      h('div', { class: 'grid content-start gap-x-4 gap-y-1 sm:grid-cols-2' }, toolsOf(r.id).map(toolRow))));
    if (focus) { const on = document.getElementById('tab-' + current); if (on) { on.focus(); on.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } }
  };
  draw(false);
  return h('div', { 'data-ui': 'binder' }, tabs, panel);
}

function viewHome() {
  const ui = T.ui.home;
  const frag = h('div', { class: C.wrap });
  frag.append(h('section', { class: 'grid items-start gap-10 pb-4 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12' },
    h('div', { class: 'lg:pt-10' },
      h('h1', { class: 'text-[clamp(2.3rem,6.4vw,4.1rem)] leading-[1.04]', text: ui.headline }),
      h('p', { class: 'mt-5 max-w-xl text-lg leading-relaxed text-soft', text: ui.lead(TOOLS.length) }),
      h('div', { class: C.actions + ' mt-7' },
        h('a', { class: C.btnPen, href: '#/outils' }, ui.allTools(TOOLS.length)),
        h('a', { class: C.btn, href: '#/startup' }, ui.studioOpen)),
      h('p', { class: 'mt-5 ' + C.fine, text: ui.note })),
    demoSheet('seuil')));

  const recent = store.get('mb-recent', []).filter((id) => toolById.has(id)).slice(0, 3);
  if (recent.length) frag.append(section(ui.recent, ui.recentSub, toolList(recent.map((id) => toolById.get(id)))));

  frag.append(section(ui.choose, ui.toolsSub(TOOLS.length), binder()));

  frag.append(h('section', { class: 'mt-16 grid items-center gap-6 rounded-2xl border border-line bg-sheet p-6 sm:mt-20 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto]' },
    h('div', {},
      h('h2', { class: C.h2, text: ui.studio }),
      h('p', { class: C.sub, text: ui.studioText }),
      h('ul', { class: 'mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem] font-medium text-soft' },
        STARTUP_MODULES.map((m) => h('li', { class: 'inline-flex items-center gap-1.5' }, h('span', { class: 'text-pen' }, icon(m.icon, 16)), T.ui.startup.modules[m.id][0])))),
    h('a', { class: C.btnPen, href: '#/startup' }, icon('rocket', 18), ui.studioOpen)));

  frag.append(section(ui.arsenal, ui.arsenalSub(ARSENAL_COUNT, verifiedDate),
    h('div', { class: 'grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3' }, ARSENAL.map((c) => h('a', { 'data-ui': 'cat', class: 'flex items-center gap-3 rounded-xl p-2.5 text-ink no-underline transition-colors hover:bg-role/10', href: '#/arsenal/' + c.id },
      badge(c.icon), h('span', { class: 'grid min-w-0' }, h('b', { class: 'font-semibold leading-snug', text: T.arsenal.cats[c.id].name }), h('small', { class: 'text-sm text-faint', text: T.ui.nItems(c.tools.length) }))))),
    h('div', { class: C.actions + ' mt-6' }, h('a', { class: C.btn, href: '#/arsenal' }, ui.arsenalOpen))));

  frag.append(section(ui.path, ui.pathSub,
    h('ol', { class: 'grid gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-6' }, T.levels.map((l, i) => h('li', {}, h('a', { class: 'group grid gap-1 border-t-2 border-ink pt-3 text-ink no-underline', href: '#/parcours' },
      h('span', { class: 'casual text-3xl font-extrabold leading-none text-pen', text: String(i + 1) }),
      h('b', { class: 'font-semibold leading-snug group-hover:underline', text: l.name }),
      h('span', { class: 'text-sm leading-snug text-soft', text: l.goal })))))));

  frag.append(section(ui.guides, ui.guidesSub,
    h('div', { class: 'grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3' }, Object.entries(GUIDES).map(([id, g]) => h('div', { 'data-ui': 'cast', class: 'flex items-start gap-4' },
      avatar(g.avatar, 60),
      h('div', { class: 'grid min-w-0 gap-0.5' },
        h('b', { class: 'font-semibold leading-snug', text: `${T.guides[id].name}, ${T.guides[id].job}` }),
        h('p', { class: 'casual text-[0.98rem] font-medium leading-snug text-pen', text: T.guides[id].line })))))));

  const promo = (name, title, text, href, label, pen) => h('div', { class: 'flex items-start gap-4' }, badge(name, '', true),
    h('div', { class: 'grid min-w-0 justify-items-start gap-2.5' }, h('h2', { class: C.h2, text: title }), h('p', { class: 'leading-relaxed text-soft', text }),
      h('a', { class: pen ? C.btnPen : C.btn, href }, label)));
  frag.append(h('section', { class: 'mt-16 grid gap-10 sm:mt-20 lg:grid-cols-2' },
    promo('id-card', ui.card, ui.cardText, '#/pitch', ui.cardOpen, true),
    promo('book-open', ui.glossary, ui.glossaryText(T.glossary.length), '#/lexique', ui.glossaryOpen, false)));

  frag.append(section(ui.lab, ui.labSub,
    h('div', { class: 'flex items-start gap-4' }, badge('flask-conical', 'p3', true),
      h('div', { class: 'grid min-w-0 max-w-2xl justify-items-start gap-2.5' }, h('h3', { class: 'text-xl font-bold leading-snug', text: ui.labName }), h('p', { class: 'leading-relaxed text-soft', text: ui.labText }),
        h('a', { class: C.btn, href: 'repondeur/' }, ui.labOpen)))));
  return frag;
}

/* Un choix parmi plusieurs, sur une ligne : le surligneur marque le choix en cours. */
const SEG = 'flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-sheet p-1 [scrollbar-width:thin]';
const SEG_ITEM = 'flex flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-soft no-underline hover:text-ink aria-pressed:bg-fluo aria-pressed:text-fluo-ink aria-[current=page]:bg-fluo aria-[current=page]:text-fluo-ink';
const SEARCH = C.input + ' min-w-0 flex-[1_1_22rem]';
const FILTERS = 'mb-6 flex flex-wrap items-center gap-3';

/* Le choix du profil, en liens : `base` est le début de l'adresse. */
function roleSeg(base, current) {
  return h('div', { class: SEG, 'data-ui': 'seg', role: 'group', 'aria-label': T.ui.profile },
    [['', T.ui.all], ...Object.keys(ROLES).map((id) => [id, T.roles[id].name])].map(([id, label]) =>
      h('a', { class: SEG_ITEM, 'aria-current': (current || '') === id ? 'page' : null, href: base + (id ? '/' + id : '') }, label)));
}

function viewTools(roleId) {
  const role = ROLES[roleId] || null;
  const frag = h('div', { class: C.wrap });
  frag.append(pageHead(role ? avatar(role.avatar, 76) : null, role ? T.roles[role.id].name : T.ui.tools.all, role ? T.roles[role.id].about : T.ui.tools.allSub(TOOLS.length)));
  const list = h('div', { 'data-ui': 'tools' });
  const draw = (q) => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    if (!words.length) {
      if (role) list.replaceChildren(toolList(toolsOf(role.id)));
      else list.replaceChildren(...Object.values(ROLES).map((r) => h('section', { class: `${r.color} mt-10 border-t-[3px] border-role pt-5 first:mt-0` },
        h('a', { class: 'mb-4 flex items-center gap-3 text-ink no-underline', href: '#/outils/' + r.id }, avatar(r.avatar, 44),
          h('span', { class: 'grid' }, h('h2', { class: 'text-xl leading-tight', text: T.roles[r.id].name }), h('span', { class: 'text-[0.95rem] leading-snug text-soft', text: T.roles[r.id].about }))),
        toolList(toolsOf(r.id)))));
      return;
    }
    // Chaque mot doit se trouver dans le nom, la question, la présentation ou le profil de l'outil.
    const hits = TOOLS.filter((t) => {
      if (role && t.role !== role.id) return false;
      const w = T.tools[t.id];
      const text = fold([w.name, w.question, w.lead, T.roles[t.role].name, ...Object.values(w.fields || {}).map((f) => f[0])].join(' '));
      return words.every((x) => text.includes(x));
    });
    list.replaceChildren(hits.length ? toolList(hits) : h('p', { 'data-ui': 'empty', class: 'py-6 text-soft', text: T.ui.tools.noMatch }));
  };
  frag.append(h('div', { class: FILTERS },
    h('input', { class: SEARCH, 'data-search': '', type: 'search', placeholder: T.ui.tools.search, 'aria-label': T.ui.tools.search, oninput: (e) => draw(e.target.value) }),
    roleSeg('#/outils', role ? role.id : '')));
  frag.append(list);
  draw('');
  frag.append(h('p', { class: C.fine + ' mt-10', text: T.ui.fineprint }));
  return frag;
}

const prose = (items) => h('ul', { class: 'grid max-w-3xl gap-2.5 leading-relaxed text-soft' },
  items.map((text) => h('li', { class: 'relative pl-5 before:absolute before:left-0 before:top-[0.65em] before:size-1.5 before:rounded-full before:bg-pen', text })));

function viewTool(id, query) {
  const t = toolById.get(id);
  if (!t) return viewMissing();
  store.set('mb-recent', [id, ...store.get('mb-recent', []).filter((x) => x !== id)].slice(0, 8));
  const w = T.tools[id];
  const ui = T.ui.tools;
  const frag = h('div', { class: C.wrap });
  const crumb = 'text-soft underline decoration-line underline-offset-4 hover:text-ink';
  frag.append(h('nav', { class: 'flex flex-wrap gap-2 pt-6 text-sm text-faint', 'aria-label': ui.crumb },
    h('a', { class: crumb, href: '#/outils', text: ui.crumb }), h('span', { 'aria-hidden': 'true', text: '/' }),
    h('a', { class: crumb, href: '#/outils/' + t.role, text: T.roles[t.role].name }), h('span', { 'aria-hidden': 'true', text: '/' }), h('span', { text: w.name })));
  frag.append(pageHead(badge(t.icon, ROLES[t.role].color, true), w.question, w.lead, h('p', { class: 'mb-1.5' }, roleTag(t.role))));

  if (t.kind === 'checklist') frag.append(checklist(t));
  else if (t.kind === 'writer') frag.append(writer(t));
  else if (t.kind === 'canvas') frag.append(canvas(t));
  else frag.append(calculator(t, query));

  const tip = guideSays(t.guide, w.tip);
  if (tip) frag.append(h('div', { class: 'mt-10' }, tip));
  if (w.read) frag.append(section(t.kind === 'calc' ? ui.howRead : ui.howUse, null, prose(w.read)));
  frag.append(h('div', { class: 'mt-8' }, notice(w.limits)));
  const cats = (t.arsenal || []).map((c) => catById.get(c)).filter(Boolean);
  if (cats.length) frag.append(section(ui.inArsenal, ui.inArsenalSub, h('div', { class: 'flex flex-wrap gap-2.5' }, cats.map(catChip))));
  frag.append(section(ui.others, null, toolList(toolsOf(t.role).filter((x) => x.id !== t.id))));
  return frag;
}

/* Les outils qui se suivent : quels chiffres passent de l'un à l'autre.
   Chaque fonction reçoit les chiffres saisis et le calcul, et rend { champ: valeur } pour l'outil suivant. */
const LINKS = {
  runway: [['lever', (v) => ({ burn: v.burn, revenue: v.revenue })]],
  lever: [['dilution', (v, r) => ({ pre: v.pre, raise: r.raise })]],
  marche: [['objectif', (v, r) => ({ target: r.som / 12, price: v.price / 12 })]],
  client: [['tunnel', (v) => ({ spend: v.spend })]],
  tarif: [['devis', (v, r) => ({ rate: r.rate })]],
  devis: [['tirelire', (v, r) => ({ amount: r.ht, vat: v.vat })]],
  prix: [['remise', (v, r) => ({ price: r.ht, margin: v.margin })], ['seuil', (v, r) => ({ price: r.ht, variable: v.cost })]],
  ticket: [['valo', (v) => ({ exit: v.exit, dilution: v.dilution, ticket: v.ticket })]],
  suivre: [['fonte', (v, r) => ({ stake: r.without })]],
  composes: [['frais', (v) => ({ initial: v.initial, monthly: v.monthly, rate: v.rate, years: v.years })], ['inflation', (v, r) => ({ amount: r.value, years: v.years })]],
  cible: [['composes', (v, r) => ({ initial: v.initial, monthly: r.monthly, rate: v.rate, years: v.years })]],
  capacite: [['credit', (v, r) => ({ amount: r.loan, rate: v.rate, years: v.years })]],
  credit: [['cashflow', (v, r) => ({ loan: r.monthly })], ['louer', (v) => ({ rate: v.rate, years: v.years })]],
  rendement: [['cashflow', (v, r) => ({ rent: v.rent, charges: v.charges / 12 })]],
  pub: [['livraison', (v) => ({ basket: v.basket, shipping: v.shipping })], ['retours', (v) => ({ basket: v.basket, cogs: v.cogs })]],
  marketplace: [['pub', (v) => ({ basket: v.price, cogs: v.cogs })]],
  budget: [['coussin', (v, r) => ({ expenses: v.needs, monthly: Math.max(0, r.savings) })], ['dette', (v, r) => ({ payment: Math.max(1, Math.round(Math.max(0, r.savings) / 2)) })]],
  heures: [['composes', (v) => ({ initial: v.price, monthly: 0, rate: v.rate, years: Math.max(1, v.years) })]],
};
function nextBlock(id, v, r) {
  const list = (LINKS[id] || []).filter(([to]) => toolById.has(to));
  if (!list.length) return null;
  return h('div', { 'data-ui': 'next', class: 'grid gap-2.5' }, h('h3', { class: C.h3, text: T.ui.next.title }), list.map(([to, fn]) => {
    const target = toolById.get(to);
    const vals = Object.entries(fn(v, r)).filter(([key, x]) => Number.isFinite(x) && target.fields.some((f) => f.key === key));
    // Les valeurs passent dans l'adresse, arrondies et gardées dans les limites du champ.
    const q = vals.map(([key, x]) => {
      const f = target.fields.find((y) => y.key === key);
      const n = Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, Math.round(x * 100) / 100));
      return `${key}=${encodeURIComponent(Number.isInteger(f.step) && f.key === 'years' ? Math.round(n) : n)}`;
    }).join('&');
    const labels = vals.map(([key]) => T.tools[to].fields[key][0].toLowerCase()).join(', ');
    return h('a', { class: `${ROLES[target.role].color} flex items-center gap-3 rounded-xl border border-line bg-sheet p-3 text-ink no-underline transition-colors hover:border-role`, href: `#/outil/${to}?${q}` },
      badge(target.icon, ROLES[target.role].color),
      h('span', { class: 'grid min-w-0 flex-1' }, h('b', { class: 'font-semibold leading-snug', text: T.ui.next.go(T.tools[to].name) }), labels ? h('small', { class: 'text-sm leading-snug text-soft', text: T.ui.next.passes(labels) }) : null),
      h('span', { class: 'text-faint' }, icon('chevron-right', 18)));
  }));
}

const TONE = { good: 'bg-good text-sheet', bad: 'bg-bad text-sheet', flat: 'bg-ink text-paper' };
const TONE_TEXT = { good: 'text-good', bad: 'text-bad', flat: 'text-soft' };
const FIELD = 'grid gap-1.5';
const LABEL = 'font-semibold leading-snug';
const HINT = 'text-sm leading-snug text-faint';
const UNIT = 'min-w-[5.5em] flex-none whitespace-nowrap text-sm text-faint';

function calculator(t, query) {
  const w = T.tools[t.id];
  const R = T.res[t.id];
  const values = {};
  for (const f of t.fields) {
    const raw = query.get(f.key);
    const n = raw == null || raw === '' ? NaN : Number(raw);
    values[f.key] = Number.isFinite(n) ? n : f.value;
  }
  const out = h('div', { 'data-ui': 'result', class: `${ROLES[t.role].color} ${C.paper} grid gap-5 lg:row-span-2`, 'aria-live': 'polite' });
  const levers = h('div', { 'data-ui': 'levers', class: `${ROLES[t.role].color} ${C.sheet} grid gap-2 empty:hidden`, 'data-noprint': '' });
  const linkFor = () => `#/outil/${t.id}?${t.fields.map((f) => `${f.key}=${encodeURIComponent(values[f.key])}`).join('&')}`;
  let urlTimer = null;
  let prev = null; // le grand chiffre affiché juste avant
  let shown = null; // la valeur affichée en ce moment, même au milieu d'un défilement
  const controls = {}; // clé → [champ, curseur]

  const decimals = (x) => (String(x).split('.')[1] || '').length;
  const nudge = (f, dir) => {
    const x = Number((values[f.key] + dir * f.step).toFixed(decimals(f.step)));
    return Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, x));
  };
  const setValue = (key, n) => {
    values[key] = n;
    const [input, range] = controls[key];
    input.value = n;
    range.value = n;
    draw();
  };

  /* Un pas de plus ou de moins sur chaque chiffre : le résultat qu'il donnerait. */
  const LEVER = 'grid min-h-11 min-w-0 justify-items-start rounded-lg border border-line bg-paper px-2.5 py-1.5 text-left';
  const drawLevers = (head) => {
    const focused = document.activeElement && levers.contains(document.activeElement) ? document.activeElement.dataset.lever : null;
    if (!head) { levers.replaceChildren(); return; }
    const rows = t.fields.map((f) => {
      if (!Number.isFinite(values[f.key])) return null;
      const [label, unit] = w.fields[f.key];
      const stepText = F.nf(f.step, 2) + (unit ? ' ' + cur(unit) : '');
      const buttons = [-1, 1].map((dir) => {
        const n = nudge(f, dir);
        if (n === values[f.key]) return { dir, off: true };
        const next = headOf(t.id, { ...values, [f.key]: n }, R);
        const d = deltaOf(head, next);
        return { dir, n, next, d, weight: !next ? 0 : !Number.isFinite(next.n - head.n) ? Infinity : Math.abs(next.n - head.n) };
      });
      // Toutes les lignes restent, même sans effet : les boutons ne bougent pas sous le doigt.
      return { f, label, stepText, buttons, weight: Math.max(...buttons.map((b) => b.weight || 0)) };
    }).filter(Boolean);
    // La barre dit quel chiffre pèse le plus ; l'ordre des lignes ne bouge pas, pour garder les boutons sous le doigt.
    const finite = rows.map((r) => r.weight).filter(Number.isFinite);
    const top = Math.max(1e-9, ...finite);
    levers.replaceChildren(
      h('h3', { class: C.h3, text: T.ui.levers }), h('p', { class: HINT + ' mb-1', text: T.ui.leversSub }),
      ...rows.map((row) => h('div', { class: 'grid gap-1.5 border-t border-line py-2.5' },
        h('div', { class: 'grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-3' }, h('span', { class: 'font-semibold leading-tight', text: row.label }),
          h('i', { class: 'block h-1.5 overflow-hidden rounded-full bg-line/70', 'aria-hidden': 'true' }, h('i', { class: 'block h-full rounded-full s-role', style: `width:${Number.isFinite(row.weight) ? Math.max(6, (row.weight / top) * 100) : 100}%` }))),
        h('div', { class: 'grid grid-cols-2 gap-2' }, row.buttons.map((b) => {
          const sign = b.dir > 0 ? '+' : '−';
          if (b.off) return h('span', { class: LEVER + ' opacity-40', 'aria-hidden': 'true' }, h('b', { class: 'text-sm font-semibold', text: sign + row.stepText }));
          const result = b.next ? b.next.text : R.invalid;
          return h('button', { type: 'button', class: LEVER + ' cursor-pointer transition-colors hover:border-ink active:translate-y-px', 'data-lever': `${row.f.key}:${b.dir}`,
            'aria-label': T.ui.leverTry(row.label, sign + row.stepText, b.next ? b.next.text : '—'),
            onclick: () => setValue(row.f.key, b.n) },
          h('b', { class: 'text-sm font-semibold', text: sign + row.stepText }),
          h('span', { class: `text-sm leading-tight [overflow-wrap:anywhere] ${TONE_TEXT[b.d ? b.d.cls : 'flat']}`, text: '→ ' + (b.next ? result : '—') + (b.d && Number.isFinite(b.next.n - head.n) ? ` (${b.d.text})` : b.next && !b.d ? ' (=)' : '') }));
        })))));
    if (focused) { const again = levers.querySelector(`[data-lever="${focused}"]`); if (again) again.focus(); }
  };

  let scenarioA = null; // { values, head } : les chiffres gardés pour comparer
  const fieldText = (f, n) => (Number.isFinite(n) ? F.nf(n, 2) + (w.fields[f.key][1] ? ' ' + cur(w.fields[f.key][1]) : '') : '—');
  const compareBlock = (head) => {
    const S = T.ui.scenario;
    const changed = t.fields.filter((f) => scenarioA.values[f.key] !== values[f.key]);
    const d = deltaOf(scenarioA.head, head);
    const side = (label, text) => h('div', { class: 'grid' }, h('small', { class: 'text-sm text-faint', text: label }), h('b', { class: 'casual text-xl font-extrabold leading-tight', text }));
    return h('div', { 'data-ui': 'compare', class: 'grid gap-3 rounded-xl border-[1.5px] border-role bg-sheet p-4' },
      h('h3', { class: C.h3, text: S.title }),
      h('div', { class: 'flex flex-wrap items-center gap-x-4 gap-y-2' },
        side(S.a, scenarioA.head ? scenarioA.head.text : '—'),
        h('span', { class: 'text-faint', 'aria-hidden': 'true' }, icon('arrow-right', 20)),
        side(S.now, head.text),
        d ? h('em', { class: `rounded-md px-2 py-0.5 text-xs font-bold not-italic ${TONE[d.cls]}`, text: d.text }) : null),
      changed.length ? h('ul', { class: 'grid gap-0.5 text-sm text-soft' }, h('li', { class: 'text-faint', text: S.changed }),
        changed.map((f) => h('li', { text: `${w.fields[f.key][0]} : ${fieldText(f, scenarioA.values[f.key])} → ${fieldText(f, values[f.key])}` })))
        : h('p', { class: C.fine, text: S.same }),
      h('div', { class: C.actions },
        h('button', { class: C.btnSmall, type: 'button', onclick: () => {
          for (const f of t.fields) { values[f.key] = scenarioA.values[f.key]; controls[f.key][0].value = values[f.key]; controls[f.key][1].value = values[f.key]; }
          draw();
        } }, S.restore),
        h('button', { class: C.btnSmall, type: 'button', onclick: () => { scenarioA = null; draw(); } }, S.clear)));
  };
  const draw = () => {
    const first = !prev && !out.childElementCount;
    // Avant de tout remplacer : la largeur des barres, pour animer le passage.
    const oldWidths = [...out.querySelectorAll('[data-bar]')].map((el) => el.style.width);
    const oldScore = out.querySelector('[data-score] b');
    if (oldScore) cancelAnimationFrame(oldScore._raf);

    const parts = RESULTS[t.id](values, R);
    const head = parts ? headOf(t.id, values, R) : null;
    const nodes = parts ? parts.flat().filter(Boolean) : [notice(R.invalid)];
    if (head && T.steps[t.id]) {
      // Le pas à pas se glisse avant le tableau des valeurs, s'il y en a un.
      const block = stepsBlock(T.steps[t.id](values, head.r, F));
      const at = nodes.findIndex((n) => n.hasAttribute && n.hasAttribute('data-values'));
      if (block) nodes.splice(at < 0 ? nodes.length : at, 0, block);
      // Les outils qui continuent le calcul, avec ces chiffres déjà remplis.
      const links = nextBlock(t.id, values, head.r);
      if (links) nodes.splice(at < 0 ? nodes.length : at, 0, links);
    }
    // Le scénario A gardé : il se met juste sous le grand chiffre.
    if (scenarioA && head) nodes.splice(1, 0, compareBlock(head));
    out.classList.toggle('arrive', first && !calm);
    out.replaceChildren(h('h2', { class: C.small, text: T.ui.result }), ...nodes);

    if (!calm) {
      // Les barres glissent de leur ancienne largeur à la nouvelle (de zéro, la première fois).
      [...out.querySelectorAll('[data-bar]')].forEach((el, i) => {
        const to = el.style.width;
        const from = first ? '0%' : oldWidths[i];
        if (from == null || from === to) return;
        el.style.transition = 'none';
        el.style.width = from;
        void el.offsetWidth;
        el.style.transition = '';
        el.style.width = to;
      });
      // Le grand chiffre défile depuis l'ancien (depuis zéro, la première fois), et l'écart s'affiche à côté.
      const b = out.querySelector('[data-score] b');
      if (b && head && head.fmt && Number.isFinite(head.n)) {
        const from = first ? 0 : shown != null && Number.isFinite(shown) ? shown : prev && Number.isFinite(prev.n) ? prev.n : null;
        if (from != null && from !== head.n) {
          const final = b.textContent;
          const fmt = FMT[head.fmt];
          tween(b, from, head.n, (n) => { shown = n; return fmt(n); }, () => { b.textContent = final; shown = head.n; });
        } else shown = head.n;
      } else shown = null;
      const d = deltaOf(prev, head);
      if (b && d) b.parentElement.append(h('em', { class: `ecart pointer-events-none whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-bold not-italic ${TONE[d.cls]}`, 'aria-hidden': 'true', text: d.text }));
    }
    prev = head;
    drawLevers(head);
    // L'adresse suit les chiffres : la page peut être partagée ou rechargée telle quelle.
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      // Seulement si l'outil est encore à l'écran : sinon on écraserait l'adresse de la page suivante.
      if (out.isConnected && location.hash.startsWith('#/outil/' + t.id)) history.replaceState(null, '', location.pathname + location.search + linkFor());
    }, 300);
  };

  const form = h('form', { 'data-ui': 'form', class: `${ROLES[t.role].color} ${C.sheet} grid gap-5`, onsubmit: (e) => e.preventDefault() },
    h('h2', { class: C.small, text: T.ui.yourNumbers }),
    t.fields.map((f) => {
      const [label, rawUnit, hint] = w.fields[f.key];
      const unit = cur(rawUnit);
      const input = h('input', { type: 'number', inputmode: 'decimal', id: 'f-' + f.key, step: f.step, min: f.min, max: f.max, value: values[f.key],
        class: C.input + ' font-semibold tabular-nums',
        'aria-describedby': hint ? 'h-' + f.key : null,
        oninput: (e) => {
          values[f.key] = e.target.value === '' ? NaN : Number(e.target.value);
          if (Number.isFinite(values[f.key])) range.value = values[f.key];
          draw();
        } });
      // Le curseur : de quoi essayer vite. Sans maximum prévu, il va jusqu'à quatre fois l'exemple.
      const lo = f.min ?? 0;
      let hi = f.max ?? Math.max(f.value * 4, lo + f.step * 10);
      if (Number.isFinite(values[f.key]) && values[f.key] > hi) hi = values[f.key] * 2;
      hi = lo + Math.ceil((hi - lo) / f.step) * f.step;
      const range = h('input', { type: 'range', class: 'curseur', 'data-noprint': '', min: lo, max: hi, step: f.step, value: values[f.key], 'aria-label': T.ui.slider(label), tabindex: '-1',
        oninput: (e) => { values[f.key] = Number(e.target.value); input.value = e.target.value; draw(); } });
      controls[f.key] = [input, range];
      return h('div', { class: FIELD },
        h('label', { for: 'f-' + f.key, class: LABEL, text: label }),
        h('div', { class: 'flex items-center gap-3' }, input, unit ? h('span', { class: UNIT, text: unit }) : null),
        range,
        hint ? h('small', { id: 'h-' + f.key, class: HINT, text: cur(hint) }) : null);
    }),
    h('div', { class: C.actions, 'data-noprint': '' },
      h('button', { class: C.btnSmall, type: 'button', 'data-act': 'reset', onclick: () => {
        for (const f of t.fields) { values[f.key] = f.value; controls[f.key][0].value = f.value; controls[f.key][1].value = f.value; }
        draw();
      } }, icon('rotate-ccw', 15), T.ui.reset),
      h('button', { class: C.btnSmall, type: 'button', 'data-act': 'link', onclick: () => copyText(location.origin + location.pathname + linkFor(), T.ui.linkCopied) }, icon('link', 15), T.ui.copyLink),
      h('button', { class: C.btnSmall, type: 'button', 'data-act': 'keep', onclick: () => {
        scenarioA = { values: { ...values }, head: headOf(t.id, values, R) };
        toast(T.ui.scenario.kept); draw();
      } }, T.ui.scenario.keep)));
  draw();
  // Sur grand écran, « ce qui fait bouger » va sous les chiffres ; sur téléphone, après le résultat.
  return h('div', { class: C.grid2 + ' lg:grid-rows-[auto_1fr]' }, form, out, levers);
}

function checklist(t) {
  const ui = T.ui.check;
  const items = T.checklists[t.list];
  const key = 'mb-check-' + t.list;
  let done = new Set(store.get(key, []).filter((i) => Number.isInteger(i) && i >= 0 && i < items.length));
  // Les cases de la jauge restent les mêmes : seule celle qui change bouge.
  const marks = items.map(() => h('i', { class: 'h-7 w-4 rounded-[3px] bg-off transition-colors data-on:bg-good' }));
  const bar = h('div', { class: 'flex flex-wrap gap-1', role: 'img' }, marks);
  const count = h('b', { class: 'surligne casual text-[2.6rem] font-extrabold leading-[1.2]' });
  const status = h('p', { 'data-ui': 'verdict', class: 'max-w-2xl text-lg leading-relaxed' });
  const refresh = () => {
    count.textContent = `${done.size} / ${items.length}`;
    bar.setAttribute('aria-label', ui.progress(done.size, items.length));
    marks.forEach((c, i) => c.toggleAttribute('data-on', i < done.size));
    status.textContent = done.size === items.length ? ui.done : done.size === 0 ? ui.none : ui.left(items.length - done.size);
  };
  const boxes = [];
  const list = h('ol', { 'data-ui': 'checks', class: 'grid' }, items.map(([title, hint], i) => {
    const box = h('input', { type: 'checkbox', id: `${t.list}-${i}`, checked: done.has(i) ? 'checked' : null, class: 'mt-1 size-5 cursor-pointer accent-good',
      onchange: (e) => {
        const before = done.size;
        if (e.target.checked) done.add(i); else done.delete(i);
        store.set(key, [...done]);
        refresh();
        if (done.size === items.length && before < items.length) burst(e.target);
      } });
    boxes.push(box);
    return h('li', { class: 'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3.5 border-t border-line py-3.5' }, box,
      h('label', { for: `${t.list}-${i}`, class: 'grid cursor-pointer gap-0.5' },
        h('b', { class: 'font-semibold leading-snug' }, h('span', { class: 'text-faint', text: `${i + 1}. ` }), title),
        h('span', { class: 'leading-snug text-soft', text: hint })));
  }));
  refresh();
  return h('div', { 'data-ui': 'result', class: `${ROLES[t.role].color} ${C.sheet} grid gap-5` },
    top(h('div', { 'data-score': '', class: 'grid justify-items-start gap-2' }, count, h('span', { class: 'text-soft', text: ui.label })), bar),
    status, list,
    h('div', { class: C.actions }, h('button', { class: C.btnSmall, type: 'button', onclick: () => {
      done = new Set(); store.set(key, []); boxes.forEach((b) => { b.checked = false; }); refresh();
    } }, icon('rotate-ccw', 15), ui.clear)));
}

/* Le pitch en une phrase : des morceaux, deux phrases assemblées par la langue (affichées en texte brut). */
function writer(t) {
  const ui = T.ui.writer;
  const data = store.get('mb-phrase', {});
  const out = h('div', { 'data-ui': 'result', class: `${ROLES[t.role].color} ${C.sheet} grid gap-5`, 'aria-live': 'polite' });
  const block = (title, text, note) => h('div', { class: 'grid gap-2.5 border-t border-line pt-4' },
    h('h3', { class: C.small, text: title }), h('p', { 'data-ui': 'phrase', class: 'casual text-[1.35rem] font-medium leading-snug [overflow-wrap:anywhere]', text }),
    h('div', { class: 'flex flex-wrap items-center justify-between gap-x-4 gap-y-2' }, h('small', { class: HINT, text: note }),
      h('button', { class: C.btnSmall, type: 'button', onclick: () => copyText(text, ui.copied) }, icon('copy', 15), T.ui.copy)));
  const draw = () => {
    store.set('mb-phrase', data);
    const parts = calc.phraseParts(data);
    const r = parts ? T.pitch(parts) : null;
    out.replaceChildren(h('h2', { class: C.small, text: ui.out }), ...(r ? [
      block(ui.short, r.short, ui.chars(r.short.length)),
      r.text !== r.short ? block(ui.full, r.text, ui.charsFull(r.text.length)) : null,
    ].filter(Boolean) : [h('p', { 'data-ui': 'verdict', class: 'text-lg leading-relaxed text-soft', text: ui.empty })]));
  };
  const field = (key) => {
    const [label, placeholder, hint] = ui.fields[key];
    const id = 'w-' + key;
    const input = h('input', { id, type: 'text', class: C.input, maxlength: calc.PHRASE_FIELDS[key], placeholder, 'aria-describedby': hint ? id + '-h' : null,
      oninput: (e) => { data[key] = e.target.value; draw(); } });
    input.value = data[key] || '';
    return h('div', { class: FIELD }, h('label', { for: id, class: LABEL, text: label }), input, hint ? h('small', { id: id + '-h', class: HINT, text: hint }) : null);
  };
  const form = h('form', { 'data-ui': 'form', class: C.sheet + ' grid gap-5', onsubmit: (e) => e.preventDefault() },
    h('h2', { class: C.small, text: ui.words }),
    Object.keys(calc.PHRASE_FIELDS).map(field),
    h('div', { class: C.actions },
      h('button', { class: C.btnSmall, type: 'button', onclick: () => { for (const k of Object.keys(data)) delete data[k]; form.reset(); draw(); } }, T.ui.clear)));
  draw();
  return h('div', { class: C.grid2wide }, form, out);
}

/* Le lean canvas : neuf cases, numérotées dans l'ordre où on les remplit. */
function canvas(t) {
  const ui = T.ui.canvas;
  const data = store.get('mb-canvas', {});
  const count = h('b', { class: 'surligne casual text-[2.6rem] font-extrabold leading-[1.2]' });
  const filled = () => CANVAS.filter((key) => String(data[key] || '').trim()).length;
  const refresh = () => { store.set('mb-canvas', data); count.textContent = `${filled()} / ${CANVAS.length}`; };
  const boxes = CANVAS.map((key, i) => {
    const [name, hint] = ui.boxes[key];
    const area = h('textarea', { id: 'k-' + key, maxlength: 400, placeholder: hint, rows: 4, class: C.input + ' h-full min-h-28 resize-y text-[0.95rem] leading-snug',
      oninput: (e) => { data[key] = e.target.value; refresh(); } });
    area.value = data[key] || '';
    return h('div', { 'data-ui': 'box', class: 'grid min-w-0 grid-rows-[auto_1fr] gap-2', style: `--area:${key}` },
      h('label', { for: 'k-' + key, class: 'flex items-center gap-2 font-semibold' },
        h('span', { class: 'grid size-6 flex-none place-items-center rounded-full border-[1.5px] border-role text-xs font-bold text-role-ink', text: String(i + 1) }), name), area);
  });
  const asText = () => CANVAS.map((key) => `${ui.boxes[key][0].toUpperCase()}\n${String(data[key] || '').trim() || '—'}`).join('\n\n');
  const grid = h('div', { class: 'canvas-grid' }, boxes);
  refresh();
  return h('div', { 'data-ui': 'result', class: `${ROLES[t.role].color} ${C.sheet} grid gap-6` },
    top(h('div', { 'data-score': '', class: 'grid justify-items-start gap-2' }, count, h('span', { class: 'text-soft', text: ui.label })), h('p', { class: 'max-w-xl leading-relaxed text-soft', text: ui.note })),
    grid,
    h('div', { class: C.actions },
      h('button', { class: C.btnPen, type: 'button', onclick: () => {
        if (!filled()) { toast(ui.empty); return; }
        copyText(asText(), ui.copied);
      } }, icon('copy', 16), ui.copy),
      h('button', { class: C.btn, type: 'button', onclick: () => {
        for (const k of Object.keys(data)) delete data[k];
        grid.querySelectorAll('textarea').forEach((a) => { a.value = ''; });
        refresh();
      } }, T.ui.clear)));
}

function viewLevels() {
  const ui = T.ui.levels;
  const frag = h('div', { class: C.wrap });
  frag.append(pageHead(badge('route', '', true), ui.title, ui.sub));
  const col = (title, tone, body) => h('div', { class: `${tone} border-l-[3px] border-role pl-4` }, h('h3', { class: 'mb-1.5 font-bold', text: title }), body);
  const row = (label, chips) => h('div', { class: 'flex flex-wrap items-center gap-2.5' }, h('span', { class: 'text-sm text-faint', text: label }), chips);
  frag.append(h('ol', { class: 'grid gap-6' }, LEVELS.map((l, i) => {
    const w = T.levels[i];
    return h('li', { 'data-ui': 'level', class: C.sheet + ' grid gap-5 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-6' },
      h('div', { class: 'flex items-baseline gap-2.5 sm:grid sm:content-start sm:justify-items-start sm:gap-0' },
        h('small', { class: 'text-sm text-faint', text: ui.level }), h('b', { class: 'casual text-5xl font-extrabold leading-none text-pen', text: String(i + 1) })),
      h('div', { class: 'grid min-w-0 gap-4' },
        h('div', {}, h('h2', { class: C.h2, text: w.name }), h('p', { class: 'mt-1.5 text-lg leading-relaxed', text: w.goal })),
        h('div', { class: 'grid gap-x-8 gap-y-4 md:grid-cols-2' },
          col(ui.founder, 'p1', h('ul', { class: 'grid list-disc gap-1 pl-5 leading-snug text-soft' }, w.todo.map((x) => h('li', { text: x })))),
          col(ui.investor, 'p2', h('p', { class: 'leading-relaxed text-soft', text: w.investor }))),
        guideSays(l.guide, w.tip),
        row(ui.tools, l.tools.map((id) => toolById.get(id)).filter(Boolean).map(toolChip)),
        l.arsenal.length ? row(ui.arsenal, l.arsenal.map((c) => catById.get(c)).filter(Boolean).map(catChip)) : null));
  })));
  return frag;
}

/* La carte de pitch : affichage (texte venu de l'adresse : textContent uniquement). */
function pitchCard(card) {
  const ui = T.ui.pitch.card;
  const traction = [card.t1, card.t2, card.t3].filter(Boolean);
  const block = (title, ...kids) => h('div', { class: 'grid gap-1 border-t border-line pt-3' }, h('h3', { class: C.small, text: title }), ...kids);
  const wrapText = '[overflow-wrap:anywhere]';
  return h('article', { 'data-ui': 'pcard', class: 'quadrille grid w-full max-w-md gap-3.5 rounded-2xl border-2 border-ink p-6' },
    h('header', { class: 'flex items-center justify-between gap-3' },
      h('span', { class: 'rounded-md bg-ink px-2.5 py-1 text-sm font-semibold text-paper', text: card.stage || ui.project }), coin(26)),
    h('h2', { class: `text-[1.7rem] leading-tight ${wrapText}` }, h('span', { class: 'surligne', text: card.name || ui.name })),
    h('p', { class: `text-lg leading-snug ${wrapText}`, text: card.tagline || ui.tagline }),
    card.sector ? h('p', { class: 'text-[0.95rem] font-semibold text-soft', text: card.sector }) : null,
    traction.length ? block(ui.traction, h('ul', { class: `grid list-disc gap-0.5 pl-5 ${wrapText}` }, traction.map((x) => h('li', { text: x })))) : null,
    card.ask || card.use ? block(ui.ask,
      card.ask ? h('p', { class: `casual text-xl font-extrabold ${wrapText}`, text: card.ask }) : null, card.use ? h('p', { class: wrapText, text: card.use }) : null) : null,
    card.contact ? block(ui.contact, h('p', { class: wrapText, text: card.contact })) : null,
    h('footer', { class: 'border-t border-dashed border-line pt-2.5 text-sm text-faint', text: ui.foot }));
}

function viewPitch(code) {
  const ui = T.ui.pitch;
  const frag = h('div', { class: C.wrap });
  if (code) {
    const card = calc.decodeCard(code);
    frag.append(pageHead(null, card ? ui.shared : ui.broken, card ? ui.sharedSub : ui.brokenSub));
    if (card) frag.append(pitchCard(card));
    frag.append(h('div', { class: C.actions + ' mt-8' }, h('a', { class: C.btnPen, href: '#/pitch' }, ui.create)));
    return frag;
  }
  frag.append(pageHead(badge('id-card', '', true), ui.title, ui.sub));
  const card = store.get('mb-card', {});
  const holder = h('div', { class: 'lg:sticky lg:top-24' });
  const draw = () => { holder.replaceChildren(pitchCard(card)); store.set('mb-card', card); };
  const field = (key, { area = false, options = null } = {}) => {
    const [label, placeholder] = ui.fields[key];
    const props = { id: 'c-' + key, class: C.input, maxlength: calc.CARD_FIELDS[key], placeholder, oninput: (e) => { card[key] = e.target.value; draw(); } };
    const control = options
      ? h('select', { id: 'c-' + key, class: C.input + ' cursor-pointer', onchange: (e) => { card[key] = e.target.value; draw(); } },
        h('option', { value: '' }, ui.choose), options.map((o) => h('option', { value: o, selected: card[key] === o ? 'selected' : null }, o)))
      : area ? h('textarea', { ...props, rows: 2 }) : h('input', { ...props, type: 'text' });
    if (!options) control.value = card[key] || '';
    return h('div', { class: FIELD }, h('label', { for: 'c-' + key, class: LABEL, text: label }), control);
  };
  const link = () => location.origin + location.pathname + '#/pitch/' + calc.encodeCard(card);
  const pair = (...kids) => h('div', { class: 'grid gap-5 sm:grid-cols-2' }, ...kids);
  const form = h('form', { 'data-ui': 'form', class: C.sheet + ' grid gap-5', onsubmit: (e) => e.preventDefault() },
    field('name'),
    field('tagline', { area: true }),
    pair(field('stage', { options: T.stages }), field('sector')),
    field('t1'), field('t2'), field('t3'),
    pair(field('ask'), field('contact')),
    field('use', { area: true }),
    h('p', { class: C.fine, text: ui.warn }),
    h('div', { class: C.actions },
      h('button', { class: C.btnPen, type: 'button', onclick: () => {
        if (!String(card.name || '').trim()) { toast(ui.needName); document.getElementById('c-name').focus(); return; }
        copyText(link(), ui.copied);
      } }, icon('link', 16), ui.copy),
      h('button', { class: C.btn, type: 'button', onclick: () => {
        for (const k of Object.keys(card)) delete card[k];
        form.reset();
        draw();
      } }, T.ui.clear)));
  draw();
  frag.append(h('div', { class: C.grid2wide }, form, holder));
  return frag;
}

/* Les pastilles d'accès : la couleur dit si c'est gratuit, limité ou payant ; le texte le dit aussi. */
const ACCESS = { free: 's-ok', open: 's-ok', public: 's-ok', limited: 's-p5', trial: 's-p5', paid: 's-off', fee: 's-off' };

/* L'annuaire : de vrais outils, par besoin. `arg` : un profil (filtre) ou une catégorie (on y défile). */
function viewArsenal(arg) {
  const ui = T.ui.arsenal;
  const role = ROLES[arg] || null;
  const focus = catById.has(arg) ? arg : null;
  const state = { q: '' };
  const frag = h('div', { class: C.wrap });
  frag.append(pageHead(badge('search-check', '', true), ui.title, ui.sub(ARSENAL_COUNT, ARSENAL.length)));
  frag.append(h('div', { class: 'mb-6' }, notice(ui.notice(verifiedDate), 'shield-check')));
  const list = h('div', { 'data-ui': 'arsenal', class: 'grid items-start gap-6 lg:grid-cols-2' });
  const count = h('span', { 'data-ui': 'count', class: 'text-sm text-faint' });
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
      return h('section', { 'data-ui': 'category', class: C.sheet + ' grid scroll-mt-24 gap-4', id: 'rayon-' + c.id },
        h('div', { class: 'flex items-start gap-3.5' }, badge(c.icon), h('div', { class: 'min-w-0' }, h('h2', { class: 'text-xl leading-tight', text: w.name }), h('p', { class: 'mt-1 leading-snug text-soft', text: w.need }))),
        h('ul', { class: 'grid' }, tools.map(({ name, url, access, where, what }) => h('li', { class: 'grid gap-1 border-t border-line py-3' },
          h('a', { 'data-ui': 'site', class: 'group inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 justify-self-start no-underline', href: url, target: '_blank', rel: 'noopener noreferrer' },
            h('b', { class: 'text-lg font-bold leading-tight text-ink underline decoration-pen/50 underline-offset-4 group-hover:decoration-pen', text: name }),
            h('span', { class: 'inline-flex items-center gap-1 text-sm text-pen [overflow-wrap:anywhere]' }, host(url), icon('arrow-up-right', 14)),
            h('span', { class: 'sr-only', text: T.ui.newTab })),
          h('p', { class: 'leading-snug text-soft', text: what }),
          access || where ? h('div', { class: 'mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-soft' },
            access ? h('span', { class: 'inline-flex items-center gap-1.5' }, h('i', { class: `size-2.5 rounded-full ${ACCESS[access] || 's-off'}` }), T.arsenal.access[access]) : null,
            where ? h('span', { class: 'text-faint', text: where.map((p) => T.arsenal.places[p]).join(', ') }) : null) : null))),
        guideSays(c.guide, w.note));
    }).filter(Boolean);
    count.textContent = T.ui.nItems(shown);
    list.replaceChildren(...(cats.length ? cats : [h('p', { 'data-ui': 'empty', class: 'py-6 text-soft', text: ui.empty })]));
  };
  frag.append(h('div', { class: FILTERS },
    h('input', { class: SEARCH, 'data-search': '', type: 'search', placeholder: ui.search, 'aria-label': ui.search, oninput: (e) => { state.q = e.target.value; draw(); } }),
    roleSeg('#/arsenal', role ? role.id : ''), count));
  frag.append(list);
  frag.append(h('p', { class: C.fine + ' mt-8', text: ui.fineprint }));
  draw();
  if (focus) {
    // La page vient d'être posée : on attend le prochain affichage pour défiler jusqu'à la catégorie.
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
  const frag = h('div', { class: C.narrow });
  frag.append(pageHead(badge('book-open', '', true), ui.title, ui.sub(T.glossary.length)));
  const roles = Object.values(ROLES);
  const sorted = [...T.glossary].sort((a, b) => a[0].localeCompare(b[0], T.locale));
  const list = h('dl', { 'data-ui': 'glossary', class: 'mb-6 grid' });
  const count = h('span', { 'data-ui': 'count', class: 'text-sm text-faint' });
  const draw = () => {
    const q = fold(state.q.trim());
    const rows = sorted.filter(([term, who, def]) => (!state.who || who.includes(state.who)) && (!q || fold(term + ' ' + def).includes(q)));
    count.textContent = T.ui.nWords(rows.length);
    list.replaceChildren(...(rows.length ? rows.map(([term, who, def]) => h('div', { class: 'grid gap-x-6 gap-y-1 border-t border-line py-3.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]' },
      h('dt', { class: 'flex flex-wrap items-baseline gap-2 text-lg font-bold leading-snug' }, term,
        h('span', { class: 'inline-flex gap-1' }, roles.filter((r) => who.includes(r.letter)).map((r) => h('i', { class: `size-2.5 rounded-[3px] s-${r.color}`, title: ui.useful(T.roles[r.id].name) })))),
      h('dd', { class: 'leading-relaxed text-soft', text: def })))
      : [h('p', { 'data-ui': 'empty', class: 'py-6 text-soft', text: ui.empty })]));
  };
  const segBox = h('div', { class: 'min-w-0 max-w-full' });
  const drawSeg = () => segBox.replaceChildren(h('div', { class: SEG, 'data-ui': 'seg', role: 'group', 'aria-label': T.ui.profile },
    [['', T.ui.all], ...roles.map((r) => [r.letter, T.roles[r.id].name])].map(([id, label]) => h('button', { type: 'button', class: SEG_ITEM,
      'aria-pressed': state.who === id ? 'true' : 'false', onclick: () => { state.who = id; drawSeg(); draw(); } }, label))));
  drawSeg();
  frag.append(h('div', { class: FILTERS },
    h('input', { class: SEARCH, 'data-search': '', type: 'search', placeholder: ui.search, 'aria-label': ui.search, oninput: (e) => { state.q = e.target.value; draw(); } }),
    segBox, count));
  frag.append(list);
  frag.append(legend(...roles.map((r) => [r.color, T.roles[r.id].name])));
  draw();
  return frag;
}

function viewAbout() {
  const ui = T.ui.about;
  const frag = h('div', { class: C.narrow });
  frag.append(pageHead(null, ui.title, ui.sub));
  ui.sections({ tools: TOOLS.length, arsenal: ARSENAL_COUNT, words: T.glossary.length, date: verifiedDate }).forEach(([title, items], i) => {
    frag.append(h('section', { class: i ? 'mt-12' : '' }, h('h2', { class: C.h2 + ' mb-4', text: title }), prose(items)));
  });
  return frag;
}

function viewMissing() {
  const ui = T.ui.missing;
  return h('div', { class: C.wrap }, pageHead(badge('scan-search', '', true), ui.title, ui.sub),
    h('div', { class: C.actions }, h('a', { class: C.btnPen, href: '#/' }, ui.home), h('a', { class: C.btn, href: '#/outils' }, ui.tools)));
}

/* ---------- Studio Start-Up ----------
   Les start-ups vivent dans ce navigateur (clé mb-startups), relues et
   nettoyées par calc.cleanStartup à chaque ouverture. Tout texte saisi est
   affiché avec textContent. Un module = un onglet. */

const startups = {
  all: () => (store.get('mb-startups', []) || []).map(calc.cleanStartup).filter(Boolean),
  save: (list) => store.set('mb-startups', list),
  current: (list) => list.find((x) => x.id === store.get('mb-startup', null)) || list[0] || null,
};
// Aller à une adresse, même si c'est celle de la page affichée.
const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

function newStartup(name) {
  const ui = T.ui.startup;
  const ex = STARTUP_EXAMPLE;
  return calc.cleanStartup({
    name, stage: 0, pool: ex.pool,
    founders: [{ name: ui.defaultFounder(1), role: '', share: ex.founderShare }],
    plan: { ...ex.plan, costs: ui.defaultCosts.map((label, i) => ({ label, amount: ex.costs[i] || 0 })), hires: [{ label: ui.defaultHire, ...ex.hire }] },
    tasks: STARTUP_TASKS.map((x, i) => ({ text: ui.tasks[i], state: 'todo', tool: x.tool })),
  });
}

/* Les champs du studio : un nombre ou un texte, qui préviennent à chaque frappe. */
let fieldSeq = 0;
// Dans une liste, seul le premier rang montre ses libellés ; les autres les gardent pour les lecteurs d'écran.
const lab = (text, i) => ({ text, hide: i > 0 });
const labelFor = (id, label) => (label ? h('label', { for: id, class: label.hide ? 'sr-only' : LABEL, text: label.text != null ? label.text : label }) : null);
function stNumber(label, unit, value, onInput, attrs = {}) {
  const id = 'st-' + ++fieldSeq;
  return h('div', { class: FIELD }, labelFor(id, label),
    h('div', { class: 'flex items-center gap-2.5' },
      h('input', { id, type: 'number', inputmode: 'decimal', class: C.input + ' font-semibold tabular-nums', value: Number.isFinite(value) ? value : '', ...attrs,
        oninput: (e) => onInput(e.target.value === '' ? NaN : Number(e.target.value)) }),
      unit ? h('span', { class: 'flex-none whitespace-nowrap text-sm text-faint', text: cur(unit) }) : null));
}
function stText(label, value, onInput, { placeholder = '', max = 60, area = false, hint = '' } = {}) {
  const id = 'st-' + ++fieldSeq;
  const input = h(area ? 'textarea' : 'input', { id, class: C.input, maxlength: max, placeholder, rows: area ? 3 : null, type: area ? null : 'text',
    oninput: (e) => onInput(e.target.value) });
  input.value = value || '';
  return h('div', { class: FIELD }, labelFor(id, label), input, hint ? h('small', { class: HINT, text: hint }) : null);
}
const rowRemove = (label, fn) => h('button', { type: 'button', 'aria-label': label, title: label, onclick: fn,
  class: 'grid size-11 flex-none cursor-pointer place-items-center rounded-lg border border-line bg-sheet text-soft transition-colors hover:border-bad hover:text-bad' }, icon('x', 18));
const addButton = (label, fn) => h('button', { class: C.btnSmall + ' justify-self-start', type: 'button', onclick: fn }, icon('plus', 15), label);
// Une ligne d'une liste : le premier champ prend toute la largeur sur téléphone.
const ROW3 = 'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto]';
const ROW2 = 'grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]';
const firstCell = (node) => h('div', { class: 'col-span-full sm:col-span-1' }, node);
const PALETTE = ['p1', 'p2', 'ok', 'violet', 'p5', 'p6', 'p7', 'hot'];
const planOf = (s) => calc.startupPlan(s.plan);
const STUDIO_GRID = 'grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]';
const FORM = C.sheet + ' grid gap-5';
const RESULT = C.paper + ' p1 grid gap-5';
const subTitle = (text) => h('h3', { class: 'mt-2 font-bold', text });

const MODULES = {
  tableau({ s }) {
    const ui = T.ui.startup;
    const r = planOf(s);
    const cap = calc.capTable(s);
    const k = calc.kpiTrend(s.kpis);
    const done = s.tasks.filter((x) => x.state === 'done').length;
    const tile = (value, label, bad) => h('div', { 'data-ui': 'tile', class: 'grid content-start gap-1 rounded-xl border border-line bg-sheet p-3.5' },
      h('b', { class: `casual text-2xl font-extrabold leading-tight [overflow-wrap:anywhere] ${bad ? 'text-bad' : ''}`, text: value }),
      h('span', { class: 'text-sm leading-snug text-soft', text: label }));
    const acts = [];
    if (!s.pitch) acts.push([ui.actions.pitch, '#/startup/identite']);
    if (cap && !cap.ok) acts.push([ui.actions.capOver, '#/startup/equipe']);
    else if (!cap || cap.total === 0) acts.push([ui.actions.cap, '#/startup/equipe']);
    if (r && r.need > 0) acts.push([ui.actions.raise(r.need, F), `#/outil/lever?burn=${Math.round(r.series[0].costs)}&revenue=${Math.round(r.series[0].revenue)}&months=18&buffer=20`]);
    if (r && !r.breakEven) acts.push([ui.actions.profit, '#/startup/plan']);
    if (!s.kpis.length) acts.push([ui.actions.kpi, '#/startup/suivi']);
    const nextTask = s.tasks.find((x) => x.state === 'doing') || s.tasks.find((x) => x.state === 'todo');
    if (nextTask) acts.push([ui.actions.task(nextTask.text), nextTask.tool && toolById.has(nextTask.tool) ? '#/outil/' + nextTask.tool : '#/startup/route']);
    else if (s.tasks.length) acts.push([ui.actions.allDone, '#/startup/route']);
    return h('div', { class: STUDIO_GRID },
      h('div', { 'data-ui': 'result', class: RESULT },
        h('div', { class: 'grid grid-cols-2 gap-3 sm:grid-cols-3' },
          tile(r ? (r.runway == null ? '24+' : F.nf(r.runway)) : '—', ui.tiles.runway, r && r.runway != null && r.runway < 6),
          tile(r && r.breakEven ? 'M' + r.breakEven : '—', ui.tiles.breakEven, r && !r.breakEven),
          tile(r ? F.money(r.need) : '—', ui.tiles.need, r && r.need > 0),
          tile(cap ? F.pct(cap.total) : '—', ui.tiles.founders, cap && !cap.ok),
          tile(`${done} / ${s.tasks.length}`, ui.tiles.tasks),
          tile(k && k.last && k.last.growth != null ? F.pct(k.last.growth) : '—', ui.tiles.growth, k && k.last && k.last.growth < 0)),
        r ? [chartTitle(ui.planChart),
          columns(r.series.map((p) => ({ label: ui.planTick(p.month), value: p.cash, title: ui.planBar(p, F) })), { pos: 'var(--ok)' })] : null),
      h('div', { class: C.sheet },
        h('h2', { class: C.small, text: ui.nextTitle }),
        // Numérotées : c'est l'ordre dans lequel les faire.
        h('ol', { 'data-ui': 'actions', class: 'mt-2 grid' }, acts.map(([text, href], i) => h('li', { class: 'grid grid-cols-[1.9rem_minmax(0,1fr)] gap-x-2 gap-y-2 border-t border-line py-3 first:border-t-0' },
          h('span', { class: 'row-span-2 mt-0.5 grid size-6 place-items-center rounded-full border-[1.5px] border-pen text-xs font-bold text-pen', 'aria-hidden': 'true', text: String(i + 1) }),
          h('span', { class: 'leading-snug', text }), h('a', { class: C.btnSmall + ' justify-self-start', href }, ui.go))))));
  },

  identite({ s, save, refreshName }) {
    const ui = T.ui.startup;
    const f = ui.fields;
    return h('div', { class: FORM + ' max-w-3xl' },
      stText(f.name[0], s.name, (x) => { if (x.trim()) { s.name = x; save(); refreshName(); } }, { max: calc.STARTUP_LIMITS.name }),
      stText(f.pitch[0], s.pitch, (x) => { s.pitch = x; save(); }, { area: true, max: calc.STARTUP_LIMITS.text, placeholder: f.pitch[1] }),
      h('p', { class: C.fine }, ui.pitchHelp, ' ', h('a', { class: C.link, href: '#/outil/phrase', text: T.ui.next.go(T.tools.phrase.name) })),
      h('div', { class: 'grid gap-5 sm:grid-cols-2' },
        stText(f.sector[0], s.sector, (x) => { s.sector = x; save(); }, { placeholder: f.sector[1] }),
        h('div', { class: FIELD }, h('label', { for: 'st-stage', class: LABEL, text: f.stage[0] }),
          h('select', { id: 'st-stage', class: C.input + ' cursor-pointer', onchange: (e) => { s.stage = Number(e.target.value); save(); } },
            T.stages.map((name, i) => h('option', { value: i, selected: i === s.stage ? 'selected' : null }, name))))));
  },

  equipe(ctx) {
    const { s, save } = ctx;
    const ui = T.ui.startup;
    const out = h('div', { 'data-ui': 'result', class: RESULT, 'aria-live': 'polite' });
    const draw = () => {
      const cap = calc.capTable(s);
      if (!cap) { out.replaceChildren(notice(ui.capOver(0, F))); return; }
      const parts = s.founders.map((f, i) => [PALETTE[i % PALETTE.length], f.name || ui.defaultFounder(i + 1), cap.shares[i]]);
      if (cap.pool > 0) parts.push(['off', ui.poolName, cap.pool]);
      if (cap.free > 0) parts.push(['free', ui.freeName, cap.free]);
      const shown = parts.filter((p) => p[2] > 0);
      out.replaceChildren(h('h2', { class: C.small, text: ui.capTitle }),
        cap.ok ? waffle(shown) : null,
        legend(...shown.map((p) => [p[0], `${p[1]} : ${F.pct(p[2])}`])),
        h('p', { 'data-ui': 'verdict', class: `max-w-2xl text-lg leading-relaxed ${cap.ok ? '' : 'font-semibold text-bad'}`, text: cap.ok ? ui.capOk(cap.free, F) : ui.capOver(-cap.free, F) }),
        h('p', { class: C.fine }, ui.capTip, ' ', h('a', { class: C.link, href: '#/outil/vesting', text: T.ui.next.go(T.tools.vesting.name) })));
    };
    const rows = s.founders.map((f, i) => h('div', { class: ROW3 },
      firstCell(stText(lab(ui.founderName, i), f.name, (x) => { f.name = x; save(); draw(); }, { placeholder: ui.defaultFounder(i + 1) })),
      stText(lab(ui.founderRole, i), f.role, (x) => { f.role = x; save(); }),
      stNumber(lab(ui.share, i), '', f.share, (x) => { f.share = x; save(); draw(); }, { min: 0, max: 100, step: 1 }),
      rowRemove(T.ui.startup.removeRow, () => { s.founders.splice(i, 1); save(true); ctx.rerender(); })));
    const form = h('div', { 'data-ui': 'form', class: FORM }, rows,
      s.founders.length < calc.STARTUP_LIMITS.founders ? addButton(ui.addFounder, () => {
        s.founders.push({ name: ui.defaultFounder(s.founders.length + 1), role: '', share: 0 }); save(true); ctx.rerender();
      }) : null,
      stNumber(ui.pool, '', s.pool, (x) => { s.pool = x; save(); draw(); }, { min: 0, max: 50, step: 1 }));
    draw();
    return h('div', { class: C.grid2 }, form, out);
  },

  plan(ctx) {
    const { s, save } = ctx;
    const ui = T.ui.startup;
    const p = s.plan;
    const out = h('div', { 'data-ui': 'result', class: RESULT, 'aria-live': 'polite' });
    const draw = () => {
      const r = planOf(s);
      if (!r) { out.replaceChildren(notice(ui.planInvalid)); return; }
      out.replaceChildren(h('h2', { class: C.small, text: T.ui.result }),
        top(score(r.need > 0 ? F.money(r.need) : (r.breakEven ? 'M' + r.breakEven : '24+'), r.need > 0 ? ui.tiles.need : r.breakEven ? ui.tiles.breakEven : ui.tiles.runway, r.need > 0 ? 'bad' : '')),
        verdict(ui.planVerdict(r, F)),
        facts(ui.planFacts(r, F)),
        chartTitle(ui.planChart),
        columns(r.series.map((x) => ({ label: ui.planTick(x.month), value: x.cash, title: ui.planBar(x, F) })), { pos: 'var(--ok)' }),
        valuesTable(ui.planTable, r.series.map((x) => [ui.planTick(x.month), F.nf(x.customers), F.money(x.revenue), F.money(x.costs), F.money(x.cash)])));
    };
    const set = (key) => (x) => { p[key] = x; save(); draw(); };
    const lim = { growth: { min: -50, max: 100, step: 1 }, churn: { min: 0, max: 100, step: 0.5 } };
    const form = h('div', { 'data-ui': 'form', class: FORM },
      Object.entries(ui.planFields).map(([key, [label, unit]]) => stNumber(label, unit, p[key], set(key), lim[key] || { min: 0, step: key === 'cash' ? 1000 : 1 })),
      subTitle(ui.costsTitle),
      p.costs.map((c, i) => h('div', { class: ROW2 },
        firstCell(stText(lab(ui.costLabel, i), c.label, (x) => { c.label = x; save(); })),
        stNumber(lab(ui.amount, i), '€', c.amount, (x) => { c.amount = x; save(); draw(); }, { min: 0, step: 10 }),
        rowRemove(ui.removeRow, () => { p.costs.splice(i, 1); save(true); ctx.rerender(); }))),
      p.costs.length < calc.STARTUP_LIMITS.costs ? addButton(ui.addCost, () => { p.costs.push({ label: '', amount: 0 }); save(true); ctx.rerender(); }) : null,
      subTitle(ui.hiresTitle),
      p.hires.map((x, i) => h('div', { class: ROW3 },
        firstCell(stText(lab(ui.hireLabel, i), x.label, (v) => { x.label = v; save(); })),
        stNumber(lab(ui.hireMonth, i), '', x.month, (v) => { x.month = v; save(); draw(); }, { min: 1, max: 24, step: 1 }),
        stNumber(lab(ui.salary, i), '€', x.salary, (v) => { x.salary = v; save(); draw(); }, { min: 0, step: 100 }),
        rowRemove(ui.removeRow, () => { p.hires.splice(i, 1); save(true); ctx.rerender(); }))),
      p.hires.length < calc.STARTUP_LIMITS.hires ? addButton(ui.addHire, () => { p.hires.push({ label: '', month: 6, salary: 0 }); save(true); ctx.rerender(); }) : null);
    draw();
    return h('div', { class: C.grid2 }, form, out);
  },

  route(ctx) {
    const { s, save } = ctx;
    const ui = T.ui.startup;
    const done = s.tasks.filter((x) => x.state === 'done').length;
    const moveTo = (task, state) => {
      const before = s.tasks.every((x) => x.state === 'done');
      task.state = state; save(true); ctx.rerender();
      if (!before && s.tasks.every((x) => x.state === 'done')) burst(document.querySelector('[data-ui="kanban"]') || document.body);
    };
    const input = h('input', { type: 'text', class: SEARCH, 'data-ui': 'task-input', maxlength: calc.STARTUP_LIMITS.text, placeholder: ui.taskPlaceholder, 'aria-label': ui.taskPlaceholder });
    const card = (task) => h('li', { 'data-ui': 'task', class: 'grid gap-2.5 rounded-xl border border-line bg-paper p-3' },
      h('p', { class: `leading-snug [overflow-wrap:anywhere] ${task.state === 'done' ? 'text-faint line-through' : ''}`, text: task.text }),
      h('div', { class: 'flex flex-wrap items-center gap-1.5' },
        task.state !== 'todo' ? h('button', { class: C.btnSmall, type: 'button', onclick: () => moveTo(task, 'todo') }, ui.move.todo) : null,
        task.state === 'todo' ? h('button', { class: C.btnSmall, type: 'button', onclick: () => moveTo(task, 'doing') }, ui.move.doing) : null,
        task.state !== 'done' ? h('button', { class: C.btnSmallPen, type: 'button', onclick: () => moveTo(task, 'done') }, icon('check', 15), ui.move.done) : null,
        task.tool && toolById.has(task.tool) ? h('a', { class: C.btnSmall, href: '#/outil/' + task.tool }, ui.openTool) : null,
        h('button', { type: 'button', 'aria-label': ui.removeRow, title: ui.removeRow, class: 'ml-auto grid size-9 cursor-pointer place-items-center rounded-lg text-faint hover:text-bad',
          onclick: () => { s.tasks.splice(s.tasks.indexOf(task), 1); save(true); ctx.rerender(); } }, icon('x', 16))));
    const LANE = { todo: 'border-t-off', doing: 'border-t-pen', done: 'border-t-good' };
    return h('div', { class: 'grid gap-6' },
      h('div', { class: C.sheet + ' grid gap-3.5' },
        h('div', { class: 'flex flex-wrap gap-1', role: 'img', 'aria-label': ui.progress(done, s.tasks.length) }, s.tasks.map((x) => h('i', { class: `h-7 w-4 rounded-[3px] ${x.state === 'done' ? 's-ok' : 's-off'}` }))),
        h('p', { 'data-ui': 'verdict', class: 'text-lg leading-relaxed', text: ui.progress(done, s.tasks.length) }),
        h('form', { class: 'flex flex-wrap items-center gap-3', onsubmit: (e) => {
          e.preventDefault();
          const text = input.value.trim();
          if (!text || s.tasks.length >= calc.STARTUP_LIMITS.tasks) return;
          s.tasks.push({ text, state: 'todo', tool: '' }); save(true); ctx.rerender();
          const again = document.querySelector('[data-ui="task-input"]'); if (again) again.focus();
        } }, input, h('button', { class: C.btnPen, type: 'submit' }, icon('plus', 16), ui.addTask))),
      h('div', { 'data-ui': 'kanban', class: 'grid items-start gap-5 lg:grid-cols-3' }, ['todo', 'doing', 'done'].map((state) => {
        const tasks = s.tasks.filter((x) => x.state === state);
        return h('section', { 'data-ui': 'lane', class: `min-w-0 rounded-2xl border border-t-[3px] border-line bg-sheet p-4 ${LANE[state]}` },
          h('h2', { class: 'mb-3 flex items-baseline gap-2 text-lg leading-tight' }, ui.columns[state], h('small', { class: 'linear text-sm font-medium text-faint', text: String(tasks.length) })),
          h('ol', { class: 'grid gap-2.5' }, tasks.map(card)));
      })));
  },

  suivi(ctx) {
    const { s, save } = ctx;
    const ui = T.ui.startup;
    const k = calc.kpiTrend(s.kpis);
    const now = new Date();
    const entry = { month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, revenue: NaN, customers: NaN, spend: NaN };
    const kf = ui.kpiFields;
    const monthInput = h('input', { type: 'month', id: 'st-month', class: C.input, value: entry.month, oninput: (e) => { entry.month = e.target.value; } });
    const form = h('form', { 'data-ui': 'form', class: FORM, onsubmit: (e) => {
      e.preventDefault();
      if (!/^\d{4}-\d{2}$/.test(entry.month)) { monthInput.focus(); return; }
      const row = { month: entry.month, revenue: entry.revenue || 0, customers: entry.customers || 0, spend: entry.spend || 0 };
      s.kpis = s.kpis.filter((x) => x.month !== row.month).concat(row).slice(-calc.STARTUP_LIMITS.kpis);
      save(true); ctx.rerender();
    } },
    h('div', { class: FIELD }, h('label', { for: 'st-month', class: LABEL, text: kf.month }), monthInput),
    stNumber(kf.revenue, '€', NaN, (x) => { entry.revenue = x; }, { min: 0, step: 100 }),
    stNumber(kf.customers, '', NaN, (x) => { entry.customers = x; }, { min: 0, step: 1 }),
    stNumber(kf.spend, '€', NaN, (x) => { entry.spend = x; }, { min: 0, step: 100 }),
    h('div', { class: C.actions }, h('button', { class: C.btnPen, type: 'submit' }, icon('plus', 16), ui.addKpi)));
    const out = h('div', { 'data-ui': 'result', class: RESULT }, h('h2', { class: C.small, text: ui.modules.suivi[0] }));
    if (!k || !k.rows.length) out.append(h('p', { 'data-ui': 'verdict', class: 'max-w-2xl text-lg leading-relaxed text-soft', text: ui.kpiEmpty }));
    else {
      const remove = (x) => h('button', { type: 'button', 'aria-label': ui.removeRow, title: ui.removeRow, class: 'inline-grid size-8 cursor-pointer place-items-center rounded-lg text-faint hover:text-bad',
        onclick: () => { s.kpis = s.kpis.filter((y) => y.month !== x.month); save(true); ctx.rerender(); } }, icon('x', 16));
      out.append(facts(ui.kpiFacts(k, F)),
        chartTitle(ui.kpiChart),
        columns(k.rows.map((x) => ({ label: x.month.slice(2), value: x.revenue, title: `${x.month} : ${F.money(x.revenue)}` })), { every: Math.max(1, Math.ceil(k.rows.length / 6)), pos: 'var(--p2)' }),
        tableOf([...ui.kpiTable, ''], [...k.rows].reverse().map((x) => [x.month, F.money(x.revenue), F.nf(x.customers), F.money(x.spend),
          { text: x.growth != null ? F.pct(x.growth) : '—', cls: x.growth != null ? (x.growth < 0 ? NEG : POS) : '' }, x.burn > 0 ? F.money(x.burn) : '—', remove(x)])));
    }
    return h('div', { class: C.grid2 }, form, out);
  },

  dossier({ s }) {
    const ui = T.ui.startup;
    const r = planOf(s);
    const k = calc.kpiTrend(s.kpis);
    const text = ui.summary(s, r, calc.capTable(s), k, F, T.stages);
    const card = calc.encodeCard({ name: s.name, tagline: s.pitch, stage: T.stages[s.stage], sector: s.sector,
      ask: r && r.need > 0 ? F.money(r.need) : '', t1: k && k.last ? `${k.last.month} : ${F.money(k.last.revenue)}` : '' });
    const file = h('input', { type: 'file', accept: '.json,application/json', class: 'sr-only', tabindex: '-1', 'aria-hidden': 'true', onchange: async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        const clean = calc.cleanStartup({ ...data, id: undefined });
        if (!clean) throw new Error('forme');
        const all = startups.all(); all.push(clean); startups.save(all); store.set('mb-startup', clean.id);
        toast(ui.imported); go('#/startup/tableau');
      } catch { toast(ui.importFail); }
    } });
    const download = () => {
      const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: (fold(s.name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'startup') + '.json' });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    return h('div', { class: STUDIO_GRID },
      h('div', { 'data-ui': 'result', class: C.sheet + ' grid gap-4' },
        h('h2', { class: C.small, text: ui.summaryTitle }),
        h('pre', { 'data-ui': 'summary', class: 'm-0 whitespace-pre-wrap rounded-xl border border-line bg-paper p-4 font-sans text-[0.98rem] leading-relaxed [overflow-wrap:anywhere]', text }),
        h('div', { class: C.actions, 'data-noprint': '' },
          h('button', { class: C.btnPen, type: 'button', onclick: () => copyText(text, ui.copied) }, icon('copy', 16), ui.copySummary),
          h('a', { class: C.btn, href: '#/pitch/' + card }, icon('id-card', 16), ui.card),
          h('button', { class: C.btn, type: 'button', onclick: () => print() }, icon('printer', 16), ui.print))),
      h('div', { class: C.sheet + ' grid gap-4', 'data-noprint': '' },
        h('p', { class: 'leading-relaxed', text: ui.backupNote }),
        h('div', { class: C.actions },
          h('button', { class: C.btn, type: 'button', onclick: download }, icon('download', 16), ui.exportJson),
          h('button', { class: C.btn, type: 'button', onclick: () => file.click() }, icon('upload', 16), ui.importJson), file)));
  },
};

function viewStartup(moduleId) {
  const ui = T.ui.startup;
  const list = startups.all();
  const s = startups.current(list);
  const mod = STARTUP_MODULES.some((m) => m.id === moduleId) ? moduleId : 'tableau';
  const frag = h('div', { class: C.wrap, 'data-ui': 'studio' });
  frag.append(pageHead(badge('rocket', '', true), ui.title, ui.sub));
  const createForm = () => {
    const input = h('input', { type: 'text', class: SEARCH, 'data-ui': 'startup-name', maxlength: calc.STARTUP_LIMITS.name, placeholder: ui.namePlaceholder, 'aria-label': ui.namePlaceholder });
    return h('form', { 'data-ui': 'create', class: 'flex flex-wrap items-center gap-3', onsubmit: (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) { toast(ui.needName); input.focus(); return; }
      const fresh = newStartup(name);
      const all = startups.all(); all.push(fresh); startups.save(all); store.set('mb-startup', fresh.id);
      go('#/startup/tableau');
    } }, input, h('button', { class: C.btnPen, type: 'submit' }, ui.create));
  };
  if (!s) {
    frag.append(h('div', { 'data-ui': 'studio-empty', class: C.paper + ' grid max-w-3xl gap-4' },
      h('h2', { class: C.h2, text: ui.emptyTitle }), h('p', { class: 'max-w-2xl leading-relaxed text-soft', text: ui.emptyText }), createForm()));
    return frag;
  }
  // Chaque changement est écrit tout de suite : rien ne se perd en changeant d'onglet.
  const save = () => { const all = startups.all(); const i = all.findIndex((x) => x.id === s.id); if (i >= 0) all[i] = s; else all.push(s); startups.save(all); };
  const picker = h('select', { 'aria-label': ui.pick, class: C.input + ' w-auto max-w-[70vw] cursor-pointer font-semibold', onchange: (e) => { store.set('mb-startup', e.target.value); render(); } },
    list.map((x) => h('option', { value: x.id, selected: x.id === s.id ? 'selected' : null }, x.name)));
  const createBox = h('div', { class: 'mb-4 empty:hidden' });
  frag.append(h('div', { 'data-ui': 'studio-bar', 'data-noprint': '', class: 'mb-4 flex flex-wrap items-center gap-2.5' },
    h('label', { class: 'flex items-center gap-2.5 text-sm text-faint' }, h('span', { text: ui.pick }), picker),
    h('button', { class: C.btn, type: 'button', 'data-act': 'new', onclick: () => {
      if (createBox.childElementCount) { createBox.replaceChildren(); return; }
      createBox.replaceChildren(createForm()); createBox.querySelector('input').focus();
    } }, icon('plus', 16), ui.newOne),
    h('button', { class: C.btn, type: 'button', 'data-act': 'remove', onclick: () => {
      if (!confirm(ui.removeConfirm(s.name))) return;
      save(true);
      startups.save(startups.all().filter((x) => x.id !== s.id));
      store.set('mb-startup', null); toast(ui.removed); go('#/startup');
    } }, icon('trash', 16), ui.remove)), createBox);
  frag.append(h('nav', { class: SEG, 'data-ui': 'tabs', 'data-noprint': '', 'aria-label': ui.title }, STARTUP_MODULES.map((m) => h('a', {
    href: '#/startup/' + m.id, class: SEG_ITEM, 'aria-current': m.id === mod ? 'page' : null }, icon(m.icon, 15), ui.modules[m.id][0]))));
  frag.append(h('p', { class: 'mb-6 mt-4 max-w-2xl text-lg leading-relaxed text-soft', text: ui.modules[mod][1] }));
  const body = h('div', { 'data-ui': 'studio-body' });
  const ctx = { s, save, rerender: () => body.replaceChildren(MODULES[mod](ctx)),
    refreshName: () => { const o = picker.querySelector(`option[value="${s.id}"]`); if (o) o.textContent = s.name; } };
  ctx.rerender();
  frag.append(body);
  return frag;
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
    case 'startup': node = viewStartup(param); title = T.ui.startup.title; break;
    case 'pitch': node = viewPitch(param); title = T.ui.pitch.shared; break;
    case 'lexique': node = viewGlossary(); title = T.ui.glossary.title; break;
    case 'a-propos': node = viewAbout(); title = T.ui.about.title; break;
    default: node = viewMissing(); title = T.ui.missing.title;
  }
  document.getElementById('view').replaceChildren(node);
  document.title = (title ? title + ' — ' : '') + T.ui.title;
  // Le surligneur de l'en-tête marque la page en cours.
  const group = { outil: 'outils' }[path] || path;
  for (const a of document.querySelectorAll('[data-nav]')) {
    if (a.dataset.nav === group) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  if (pathPart !== lastPath) scrollTo(0, 0);
  // Changement de page : le clavier et les lecteurs d'écran repartent du contenu.
  if (event && event.type === 'hashchange' && pathPart !== lastPath) document.getElementById('view').focus({ preventScroll: true });
  lastPath = pathPart;
}

document.getElementById('logo').replaceChildren(coin(28));
// « / » : aller droit à la recherche de la page, s'il y en a une.
addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
  const search = document.querySelector('#view [data-search]');
  if (search) { e.preventDefault(); search.focus(); }
});
currency = CURRENCIES[store.get('mb-currency', 'EUR')] ? store.get('mb-currency', 'EUR') : 'EUR';
setLang(pickLang()).then(() => {
  addEventListener('hashchange', render);
  render();
});
