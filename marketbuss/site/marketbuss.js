// marketbuss — l'application (page unique, sans dépendance).
//
// Tout le calcul lourd est fait par le robot (marketbuss/tools/update.mjs),
// qui publie data/latest.json toutes les 3 heures. Cette page l'affiche,
// le filtre, le compare, et le relit toute seule toutes les 5 minutes : une
// page restée ouverte se met à jour sans rechargement.
//
// Les noms de modèles viennent de sources extérieures : ils ne passent
// jamais par innerHTML (textContent uniquement, voir h() et svg()).

const DATA_URL = 'data/latest.json';
const FEED_URL = 'data/feed.xml';
const POLL_MS = 5 * 60 * 1000;
const MAX_COMPARE = 4;
const DAY = 86400000;

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
    if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) if (kid) el.append(kid);
  return el;
}

const ICONS = {
  star: '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
  crown: '<path d="M4 18.5h16M5 16l-1.5-9 5 4 3.5-6 3.5 6 5-4L19 16z"/>',
  enter: '<path d="M14 4.5h4.5v15H14M3.5 12h11M11 8.5l3.5 3.5-3.5 3.5"/>',
  tag: '<path d="M3.5 12.5V4.5h8l8.5 8.5-8 8z"/><circle cx="8" cy="9" r="1.4"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5"/>',
  external: '<path d="M14 4.5h5.5V10M19.5 4.5l-8 8M18 14v5.5H4.5V6H10"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.5v.5"/>',
  rss: '<path d="M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8"/><circle cx="6" cy="18" r="1.5"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V5.5a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3"/>',
  chart: '<path d="M4 19.5h16M6.5 16l4-5 3.5 3 5-6.5"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>',
};
function icon(name, cls = 'ic') {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('class', cls);
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = ICONS[name] || '';
  return el;
}

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* navigation privée */ }
  },
};

/* ---------- Formats ---------- */

const fmt = (n, digits = 0) => (n == null ? '—'
  : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n));
const fmtFixed = (n, digits) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);

function fmtPrice(p) {
  if (p == null) return '—';
  if (p === 0) return 'gratuit';
  return fmt(p, p < 0.1 ? 3 : 2) + ' $';
}
function fmtCost(d) {
  if (d == null) return '—';
  if (d === 0) return '0 $';
  if (d < 1) return fmtFixed(d, 2) + ' $';
  if (d < 100) return fmtFixed(d, 2) + ' $';
  return fmt(Math.round(d)) + ' $';
}
function fmtCtx(n) {
  if (!n) return '—';
  if (n >= 1e6) return fmt(n / 1e6, 2) + ' M';
  if (n >= 1e3) return fmt(Math.round(n / 1e3)) + ' k';
  return fmt(n);
}
function fmtTokens(n) {
  if (n >= 1e9) return fmt(n / 1e9, 1) + ' Md';
  if (n >= 1e6) return fmt(n / 1e6, 1) + ' M';
  if (n >= 1e3) return fmt(n / 1e3, 1) + ' k';
  return fmt(n);
}
function relTime(iso) {
  if (!iso) return '—';
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return 'à l\'instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'hier' : `il y a ${d} jours`;
}
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dateLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const fmtDay = (ymd) => dateFmt.format(new Date(ymd + 'T00:00:00Z'));
function dayLabel(ymd) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - DAY).toISOString().slice(0, 10);
  if (ymd === today) return 'Aujourd\'hui';
  if (ymd === yesterday) return 'Hier';
  const s = dateLong.format(new Date(ymd + 'T00:00:00Z'));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ---------- Données ---------- */

let snap = null;
let byId = new Map();
let catById = new Map();
let pollTimer = null;
const favs = new Set(store.get('mb-favs', []));
const lastVisit = store.get('mb-visit', null);

const ui = {
  rank: { q: '', vendor: '', license: 'all', favs: false, caps: [], sort: null, dir: 1 },
  compare: [],
  calc: { input: 20, output: 4, cache: 0, rankedOnly: true, preset: 'code' },
  wizard: { use: 'text', budget: 0, open: false, longctx: false, free: false },
  news: 'all',
};

function setData(data) {
  snap = data;
  byId = new Map(data.models.map((m) => [m.id, m]));
  catById = new Map(data.categories.map((c) => [c.id, c]));
}

const ranked = () => snap.models.filter((m) => m.rank).sort((a, b) => a.rank - b.rank);
const llmCats = () => snap.categories.filter((c) => c.group === 'llm');
const mediaCats = () => snap.categories.filter((c) => c.group === 'media');
const leaderOf = (catId) => byId.get((catById.get(catId) || {}).leader);

async function fetchData() {
  const res = await fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (!data || !Array.isArray(data.models)) throw new Error('données illisibles');
  return data;
}

async function refresh({ manual = false } = {}) {
  try {
    const data = await fetchData();
    const changed = !snap || data.generatedAt !== snap.generatedAt;
    if (changed) {
      const first = !snap;
      setData(data);
      if (!first) toast('Nouvelles données : le classement vient d\'être mis à jour.', 'success');
      render({ keepScroll: !first });
    } else if (manual) {
      toast('Déjà à jour : prochaine collecte ' + nextRunText() + '.');
    }
    renderStatus();
  } catch (err) {
    if (!snap) renderError(err);
    else if (manual) toast('Impossible de joindre le serveur. Les données affichées restent valables.', 'error');
  }
}

/* Prochain passage du robot : toutes les 3 h, à la minute indiquée (UTC). */
function nextRun() {
  const sch = (snap && snap.schedule) || { everyHours: 3, minute: 17 };
  const d = new Date();
  d.setUTCSeconds(0, 0);
  for (let i = 0; i < 24 * 60; i++) {
    d.setUTCMinutes(d.getUTCMinutes() + 1);
    if (d.getUTCMinutes() === sch.minute && d.getUTCHours() % sch.everyHours === 0) return d;
  }
  return null;
}
function nextRunText() {
  const d = nextRun();
  return d ? 'vers ' + timeFmt.format(d) : 'dans quelques heures';
}

function freshness() {
  if (!snap) return 'wait';
  const age = Date.now() - Date.parse(snap.generatedAt);
  if (snap.stale || age > 12 * 3600000) return 'stale';
  if (age > 4.5 * 3600000) return 'late';
  return 'ok';
}

function renderStatus() {
  const btn = document.getElementById('status');
  if (!btn || !snap) return;
  const state = freshness();
  btn.dataset.state = state;
  const txt = state === 'stale' ? 'Données anciennes' : 'À jour';
  btn.querySelector('.status-txt').replaceChildren(h('span', { text: txt }), h('span', { class: 'st-age', text: ' · ' + relTime(snap.generatedAt) }));
  btn.title = `Collecte du ${new Date(snap.generatedAt).toLocaleString('fr-FR')}. Prochaine collecte ${nextRunText()}. `
    + 'Cliquer pour vérifier maintenant.';
}

/* ---------- Petits composants ---------- */

function toast(text, kind = '') {
  const zone = document.getElementById('toasts');
  const el = h('div', { class: 'toast ' + kind, role: 'status' }, text);
  zone.append(el);
  setTimeout(() => el.classList.add('out'), 4200);
  setTimeout(() => el.remove(), 4700);
}

const tipEl = () => document.getElementById('tip');
function showTip(x, y, ...content) {
  const tip = tipEl();
  tip.replaceChildren(...content);
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  let left = x + 14;
  let top = y - r.height - 10;
  if (left + r.width > innerWidth - 8) left = x - r.width - 14;
  if (left < 8) left = 8;
  if (top < 8) top = y + 16;
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}
function hideTip() { tipEl().hidden = true; }
const tipRow = (value, label) => h('div', { class: 'tip-row' }, h('b', { text: value }), h('span', { text: label }));

function favButton(m) {
  const on = favs.has(m.id);
  return h('button', {
    class: 'fav' + (on ? ' on' : ''), type: 'button',
    'aria-pressed': on ? 'true' : 'false',
    'aria-label': (on ? 'Retirer des favoris : ' : 'Ajouter aux favoris : ') + m.name,
    title: on ? 'Retirer des favoris' : 'Ajouter aux favoris',
    onclick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (favs.has(m.id)) favs.delete(m.id); else favs.add(m.id);
      store.set('mb-favs', [...favs]);
      const now = favs.has(m.id);
      e.currentTarget.classList.toggle('on', now);
      e.currentTarget.setAttribute('aria-pressed', now ? 'true' : 'false');
      toast(now ? `${m.name} ajouté à tes favoris.` : `${m.name} retiré de tes favoris.`);
    },
  }, icon('star'));
}

/* Variation de rang : flèche + nombre (jamais la couleur seule). */
function delta(rank, rank7) {
  if (rank == null || rank7 == null) return h('span', { class: 'delta none', text: '' });
  if (rank7 === 0) return h('span', { class: 'delta new', title: 'Absent du classement il y a 7 jours' }, 'nouveau');
  const d = rank7 - rank;
  if (d > 0) return h('span', { class: 'delta up', title: `Gagne ${d} place${d > 1 ? 's' : ''} en 7 jours` }, '▲ ' + d);
  if (d < 0) return h('span', { class: 'delta down', title: `Perd ${-d} place${d < -1 ? 's' : ''} en 7 jours` }, '▼ ' + -d);
  return h('span', { class: 'delta same', title: 'Même place qu\'il y a 7 jours' }, '=');
}

function badges(m) {
  return h('span', { class: 'badges' },
    m.isNew ? h('span', { class: 'badge new', title: 'Arrivé dans les classements il y a moins de 14 jours' }, 'nouveau') : null,
    m.provisional ? h('span', { class: 'badge prov', title: 'Pas encore noté dans toutes les arènes : indice provisoire' }, 'provisoire') : null,
    m.license === 'open' ? h('span', { class: 'badge open', title: 'Poids ouverts : téléchargeable et hébergeable soi-même' }, 'ouvert') : null,
    m.or && m.or.free ? h('span', { class: 'badge free', title: 'Version gratuite disponible sur OpenRouter' }, 'gratuit') : null);
}

function modelLink(m, extra) {
  return h('a', { class: 'model-link', href: '#/modele/' + encodeURIComponent(m.id) },
    h('span', { class: 'model-name', text: m.name }),
    h('span', { class: 'model-meta' }, h('span', { text: m.vendor || '—' }), extra ? h('span', { text: extra }) : null));
}

function bar(value, max = 100) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return h('span', { class: 'bar', 'aria-hidden': 'true' }, h('span', { style: `width:${pct.toFixed(1)}%` }));
}

function section(title, sub, ...kids) {
  return h('section', { class: 'section' },
    h('div', { class: 'section-head' },
      h('div', {}, h('h2', { text: title }), sub ? h('p', { class: 'sub', text: sub }) : null)),
    ...kids);
}
function sectionWith(title, sub, actions, ...kids) {
  const s = section(title, sub, ...kids);
  s.querySelector('.section-head').append(h('div', { class: 'section-actions' }, actions));
  return s;
}

function seg(label, options, value, onpick) {
  return h('div', { class: 'seg', role: 'group', 'aria-label': label },
    options.map(([v, text]) => h('button', {
      type: 'button', class: v === value ? 'on' : '', 'aria-pressed': v === value ? 'true' : 'false',
      onclick: () => onpick(v),
    }, text)));
}

/* ---------- Graphiques (SVG) ---------- */

let charts = [];
function chartBox(cls, draw) {
  const box = h('div', { class: 'chart ' + (cls || '') });
  charts.push(() => {
    if (!box.isConnected) return;
    box.replaceChildren();
    draw(box, box.clientWidth || 600);
  });
  return box;
}
function drawCharts() { charts.forEach((fn) => fn()); }
let resizeTimer = null;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawCharts, 150);
});

const log10 = Math.log10;

/* Qualité (indice) en fonction du prix (échelle log) ; la frontière
   qualité/prix en couleur, le reste en gris. */
function drawScatter(box, width, models) {
  const pts = models.filter((m) => m.index != null && m.price && m.price.blended > 0);
  if (pts.length < 3) {
    box.append(h('p', { class: 'empty', text: 'Pas assez de modèles avec un prix pour tracer le graphique.' }));
    return;
  }
  const W = Math.max(280, width);
  const H = W < 560 ? 300 : 360;
  const M = { l: 40, r: 18, t: 14, b: 42 };
  const xs = pts.map((m) => log10(m.price.blended));
  const ys = pts.map((m) => m.index);
  const x0 = Math.floor(Math.min(...xs) * 2) / 2 - 0.1;
  const x1 = Math.ceil(Math.max(...xs) * 2) / 2 + 0.1;
  const y0 = Math.max(0, Math.floor((Math.min(...ys) - 3) / 10) * 10);
  const y1 = 100;
  const X = (v) => M.l + ((log10(v) - x0) / (x1 - x0)) * (W - M.l - M.r);
  const Y = (v) => M.t + (1 - (v - y0) / (y1 - y0)) * (H - M.t - M.b);
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img',
    'aria-label': 'Indice de qualité selon le prix mixte par million de jetons' });
  const grid = svg('g', { class: 'grid' });
  for (let v = y0; v <= y1; v += 10) {
    grid.append(svg('line', { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v) }));
    grid.append(svg('text', { x: M.l - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick', text: String(v) }));
  }
  for (const t of [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100, 300]) {
    if (log10(t) < x0 || log10(t) > x1) continue;
    grid.append(svg('line', { x1: X(t), x2: X(t), y1: M.t, y2: H - M.b, class: 'v' }));
    grid.append(svg('text', { x: X(t), y: H - M.b + 18, 'text-anchor': 'middle', class: 'tick', text: fmt(t, 2) + ' $' }));
  }
  grid.append(svg('text', { x: W - M.r, y: H - 6, 'text-anchor': 'end', class: 'axis-label',
    text: 'Prix mixte par million de jetons (échelle log) →' }));
  grid.append(svg('text', { x: M.l, y: M.t - 2, class: 'axis-label', 'dominant-baseline': 'hanging', dx: 6,
    text: '↑ Indice marketbuss' }));
  root.append(grid);
  const frontier = pts.filter((m) => m.pareto).sort((a, b) => a.price.blended - b.price.blended);
  if (frontier.length > 1) {
    root.append(svg('polyline', { class: 'frontier',
      points: frontier.map((m) => `${X(m.price.blended).toFixed(1)},${Y(m.index).toFixed(1)}`).join(' ') }));
  }
  const dots = svg('g', {});
  const order = pts.slice().sort((a, b) => (a.pareto ? 1 : 0) - (b.pareto ? 1 : 0));
  for (const m of order) {
    dots.append(svg('circle', { cx: X(m.price.blended), cy: Y(m.index), r: m.pareto ? 5 : 4,
      class: m.pareto ? 'dot accent' : 'dot' }));
  }
  root.append(dots);
  // Étiquettes : seulement la frontière, sans chevauchement.
  const boxes = [];
  const labels = svg('g', { class: 'labels' });
  for (const m of frontier.slice().sort((a, b) => b.index - a.index)) {
    const w = m.name.length * 6.6;
    let x = X(m.price.blended) + 9;
    let anchor = 'start';
    if (x + w > W - M.r) { x = X(m.price.blended) - 9; anchor = 'end'; }
    const y = Y(m.index) + 4;
    const b = anchor === 'start' ? [x, y - 11, x + w, y + 3] : [x - w, y - 11, x, y + 3];
    if (boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue;
    boxes.push(b);
    labels.append(svg('text', { x, y, 'text-anchor': anchor, class: 'label', text: m.name }));
  }
  root.append(labels);
  // Zones de survol (24 px) plus grandes que les points.
  const hits = svg('g', {});
  for (const m of order) {
    const cx = X(m.price.blended);
    const cy = Y(m.index);
    const show = (ev) => {
      const r = box.getBoundingClientRect();
      const px = ev && ev.clientX != null ? ev.clientX : r.left + cx;
      const py = ev && ev.clientY != null ? ev.clientY : r.top + cy;
      showTip(px, py, h('div', { class: 'tip-title', text: m.name }),
        tipRow(fmt(m.index, 1), `indice · n° ${m.rank}`),
        tipRow(fmtPrice(m.price.blended), 'prix mixte / M de jetons'),
        m.pareto ? h('div', { class: 'tip-note', text: 'Sur la frontière qualité/prix' }) : null);
    };
    hits.append(svg('circle', { cx, cy, r: 12, class: 'hit', tabindex: 0, role: 'link',
      'aria-label': `${m.name} : indice ${fmt(m.index, 1)}, ${fmtPrice(m.price.blended)} par million de jetons`,
      onpointermove: show, onpointerleave: hideTip, onfocus: () => show(null), onblur: hideTip,
      onclick: () => { location.hash = '#/modele/' + encodeURIComponent(m.id); },
      onkeydown: (e) => { if (e.key === 'Enter') location.hash = '#/modele/' + encodeURIComponent(m.id); } }));
  }
  root.append(hits);
  box.append(root,
    h('div', { class: 'legend' },
      h('span', {}, h('i', { class: 'key accent' }), 'Frontière qualité/prix : aucun modèle n\'est à la fois meilleur et moins cher'),
      h('span', {}, h('i', { class: 'key' }), 'Autres modèles classés')));
}

/* Évolution du score Elo d'une arène (30 jours). */
function drawLine(box, width, points, { name }) {
  if (!points || points.length < 2) {
    box.append(h('p', { class: 'empty', text: 'Historique en cours de constitution.' }));
    return;
  }
  const W = Math.max(260, width);
  const H = 170;
  const M = { l: 44, r: 54, t: 12, b: 28 };
  const ts = points.map((p) => Date.parse(p[0] + 'T00:00:00Z'));
  const vs = points.map((p) => p[1]);
  const t0 = Math.min(...ts);
  const t1 = Math.max(...ts);
  let v0 = Math.min(...vs);
  let v1 = Math.max(...vs);
  const pad = Math.max(4, (v1 - v0) * 0.2);
  v0 = Math.floor((v0 - pad) / 5) * 5;
  v1 = Math.ceil((v1 + pad) / 5) * 5;
  const X = (t) => M.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - M.l - M.r);
  const Y = (v) => M.t + (1 - (v - v0) / (v1 - v0)) * (H - M.t - M.b);
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img',
    'aria-label': `Score Elo ${name} sur 30 jours, de ${vs[0]} à ${vs[vs.length - 1]}` });
  const grid = svg('g', { class: 'grid' });
  const step = Math.max(5, Math.ceil((v1 - v0) / 3 / 5) * 5);
  for (let v = v0; v <= v1; v += step) {
    grid.append(svg('line', { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v) }));
    grid.append(svg('text', { x: M.l - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick', text: fmt(v) }));
  }
  grid.append(svg('text', { x: M.l, y: H - 8, class: 'tick', text: fmtDay(points[0][0]) }));
  grid.append(svg('text', { x: W - M.r, y: H - 8, 'text-anchor': 'end', class: 'tick', text: fmtDay(points[points.length - 1][0]) }));
  root.append(grid);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(ts[i]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
  root.append(svg('path', { class: 'area', d: `${d}L${X(t1).toFixed(1)},${Y(v0)}L${X(t0).toFixed(1)},${Y(v0)}Z` }));
  root.append(svg('path', { class: 'line', d }));
  const last = points[points.length - 1];
  root.append(svg('circle', { class: 'dot accent', cx: X(t1), cy: Y(last[1]), r: 4 }));
  root.append(svg('text', { class: 'label', x: X(t1) + 9, y: Y(last[1]) + 4, text: fmt(last[1]) }));
  const cross = svg('line', { class: 'cross', y1: M.t, y2: H - M.b, visibility: 'hidden' });
  const focus = svg('circle', { class: 'dot accent', r: 4, visibility: 'hidden' });
  root.append(cross, focus);
  const overlay = svg('rect', { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b, class: 'overlay' });
  const move = (ev) => {
    const r = root.getBoundingClientRect();
    const x = ev.clientX - r.left;
    let best = 0;
    ts.forEach((t, i) => { if (Math.abs(X(t) - x) < Math.abs(X(ts[best]) - x)) best = i; });
    const p = points[best];
    cross.setAttribute('x1', X(ts[best]));
    cross.setAttribute('x2', X(ts[best]));
    cross.setAttribute('visibility', 'visible');
    focus.setAttribute('cx', X(ts[best]));
    focus.setAttribute('cy', Y(p[1]));
    focus.setAttribute('visibility', 'visible');
    showTip(ev.clientX, r.top + Y(p[1]), h('div', { class: 'tip-title', text: fmtDay(p[0]) }),
      tipRow(fmt(p[1]), 'Elo ' + name), tipRow('n° ' + p[2], 'dans l\'arène'));
  };
  overlay.addEventListener('pointermove', move);
  overlay.addEventListener('pointerleave', () => {
    hideTip();
    cross.setAttribute('visibility', 'hidden');
    focus.setAttribute('visibility', 'hidden');
  });
  root.append(overlay);
  box.append(root);
}

/* ---------- En-tête : navigation, bandeau, thème ---------- */

function renderNav(path) {
  for (const a of document.querySelectorAll('[data-nav]')) {
    const on = a.dataset.nav === path;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}

function renderTicker() {
  const el = document.getElementById('ticker');
  if (!snap) return;
  const items = [];
  for (const c of snap.categories) {
    const m = leaderOf(c.id);
    if (m) items.push({ m, tag: 'N° 1 ' + c.label, kind: 'lead' });
  }
  for (const m of ranked()) {
    if (m.rank7 === 0) items.push({ m, tag: 'Nouveau', kind: 'new' });
    else if (m.rank7 && m.rank7 - m.rank >= 2) items.push({ m, tag: `▲ ${m.rank7 - m.rank} au général`, kind: 'up' });
    else if (m.rank7 && m.rank - m.rank7 >= 2) items.push({ m, tag: `▼ ${m.rank - m.rank7} au général`, kind: 'down' });
  }
  for (const e of snap.events.filter((x) => x.type === 'price').slice(0, 4)) {
    const m = byId.get(e.model);
    if (!m) continue;
    const pct = Math.round(((e.to - e.from) / e.from) * 100);
    items.push({ m, tag: `Prix ${pct > 0 ? '+' : '−'}${Math.abs(pct)} %`, kind: pct < 0 ? 'up' : 'down' });
  }
  const make = (hidden) => h('div', { class: 'ticker-run', 'aria-hidden': hidden ? 'true' : null },
    items.map(({ m, tag, kind }) => h('a', { class: 'tick-item', href: '#/modele/' + encodeURIComponent(m.id), tabindex: hidden ? '-1' : null },
      h('span', { class: 'tick-tag k-' + kind, text: tag }), h('span', { text: m.name }))));
  el.replaceChildren(h('div', { class: 'ticker-track', style: `--n:${items.length}` }, make(false), make(true)));
}

const THEMES = ['auto', 'light', 'dark'];
function applyTheme(t) {
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const btn = document.getElementById('theme');
  const label = { auto: 'automatique', light: 'clair', dark: 'sombre' }[t];
  btn.replaceChildren(icon({ auto: 'auto', light: 'sun', dark: 'moon' }[t]));
  btn.setAttribute('aria-label', 'Thème : ' + label);
  btn.title = 'Thème : ' + label + ' (cliquer pour changer)';
}

/* ---------- Vues ---------- */

let currentPath = null;
function render({ keepScroll = false } = {}) {
  if (!snap) return;
  hideTip();
  charts = [];
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, arg] = raw.split('/');
  const view = document.getElementById('view');
  const y = scrollY;
  let node;
  switch (path) {
    case 'classement': node = viewRanking(arg ? decodeURIComponent(arg) : 'general'); break;
    case 'modele': node = viewModel(decodeURIComponent(arg || '')); break;
    case 'comparer': node = viewCompare(arg ? decodeURIComponent(arg) : ''); break;
    case 'calculateur': node = viewCalc(); break;
    case 'choisir': node = viewWizard(); break;
    case 'nouveautes': node = viewNews(); break;
    case 'methode': node = viewMethod(); break;
    default: node = viewHome();
  }
  view.replaceChildren(node);
  renderNav(path || '');
  renderTicker();
  requestAnimationFrame(drawCharts);
  const title = { classement: 'Classements', modele: (byId.get(decodeURIComponent(arg || '')) || {}).name,
    comparer: 'Comparer', calculateur: 'Calculateur de coût', choisir: 'Trouver mon IA', nouveautes: 'Nouveautés',
    methode: 'Méthode' }[path];
  document.title = (title ? title + ' — ' : '') + 'marketbuss — les meilleures IA du moment';
  if (keepScroll) scrollTo(0, y);
  else if (path !== currentPath || path === 'modele') scrollTo(0, 0);
  currentPath = path;
}

/* Accueil */
function viewHome() {
  const list = ranked();
  const top = list[0];
  const notes = [['text', 'En conversation'], ['code', 'En code']]
    .map(([c, label]) => [label, leaderOf(c)])
    .filter(([, m]) => m && m !== top)
    .map(([label, m]) => `${label}, le n° 1 est ${m.name}.`);
  const frag = h('div', { class: 'wrap' });

  frag.append(h('section', { class: 'hero' },
    h('div', { class: 'hero-main' },
      h('p', { class: 'eyebrow' }, h('span', { class: 'live', 'aria-hidden': 'true' }),
        `Marché des IA en direct · collecte ${relTime(snap.generatedAt)}`),
      h('h1', {}, 'Les meilleures IA du moment, ', h('span', { class: 'hl', text: 'classées en continu.' })),
      h('p', { class: 'lead', text: 'marketbuss croise les votes à l\'aveugle de millions d\'utilisateurs (Arena AI), '
        + 'les prix publics des fournisseurs et les nouvelles sorties. Le classement se met à jour tout seul, '
        + 'toutes les 3 heures.' }),
      h('div', { class: 'actions' },
        h('a', { class: 'btn primary', href: '#/classement' }, icon('chart'), 'Voir le classement'),
        h('a', { class: 'btn', href: '#/choisir' }, 'Trouver l\'IA qu\'il me faut'))),
    top ? h('a', { class: 'hero-card', href: '#/modele/' + encodeURIComponent(top.id) },
      h('span', { class: 'hc-label' }, icon('crown'), 'N° 1 du moment · indice marketbuss'),
      h('span', { class: 'hc-name', text: top.name }),
      h('span', { class: 'hc-vendor', text: top.vendor || '' }),
      h('span', { class: 'hc-figure' }, fmt(top.index, 1), h('small', { text: ' / 100' })),
      h('span', { class: 'hc-facts' },
        top.cats.text ? h('span', { text: `Texte : n° ${top.cats.text.rank}` }) : null,
        top.cats.code ? h('span', { text: `Code : n° ${top.cats.code.rank}` }) : null,
        top.price ? h('span', { text: `${fmtPrice(top.price.input)} / ${fmtPrice(top.price.output)} par M de jetons` }) : null),
      notes.length ? h('span', { class: 'hc-note', text: notes.join(' ') }) : null)
      : null));

  const since = sinceVisit();
  if (since) frag.append(since);

  frag.append(h('div', { class: 'tiles' },
    tile('Modèles suivis', fmt(snap.stats.models), `${snap.stats.vendors} éditeurs`),
    tile('Classés au général', fmt(snap.stats.ranked), `${snap.stats.priced} avec un prix public`),
    tile('Arènes', fmt(snap.categories.length), 'texte, code, images, vidéo…'),
    tile('Nouveaux (14 jours)', fmt(snap.stats.fresh), snap.stats.releases ? `${snap.stats.releases} sorties sur OpenRouter` : 'entrés dans les classements'),
    tile('Prochaine collecte', nextRunText().replace(/^vers /, ''), 'automatique, toutes les 3 h')));

  // Top 10
  frag.append(sectionWith('Le top 10', 'Indice marketbuss : la qualité mesurée dans les arènes Texte, Code, Vision et Documents.',
    h('a', { class: 'btn ghost sm', href: '#/classement' }, 'Tout le classement'),
    h('ol', { class: 'top-list' }, list.slice(0, 10).map((m) => h('li', {},
      h('span', { class: 'pos', text: String(m.rank) }),
      delta(m.rank, m.rank7),
      h('div', { class: 'tl-name' }, modelLink(m), badges(m)),
      h('span', { class: 'idx' }, bar(m.index), h('b', { text: fmt(m.index, 1) })),
      h('span', { class: 'price', text: m.price ? fmtPrice(m.price.blended) : 'prix ?' , title: 'Prix mixte par million de jetons' }),
      favButton(m))))));

  // Les meilleurs par usage
  frag.append(section('Les meilleurs par usage', 'Le n° 1 de chaque arène, et son dauphin.',
    h('div', { class: 'cat-grid' }, snap.categories.map((c) => {
      const lead = leaderOf(c.id);
      const second = snap.models.filter((m) => m.cats[c.id] && m.cats[c.id].rank === 2)[0];
      if (!lead) return null;
      const cell = lead.cats[c.id];
      return h('a', { class: 'cat-card', href: '#/classement/' + c.id },
        h('span', { class: 'cat-label', text: c.label }),
        h('span', { class: 'cat-desc', text: c.desc }),
        h('span', { class: 'cat-lead', text: lead.name }),
        h('span', { class: 'cat-score', text: c.id === 'agent' ? `${fmt(cell.score, 2)} d'amélioration nette` : `Elo ${fmt(cell.score)}` }),
        second ? h('span', { class: 'cat-second', text: `puis ${second.name}` }) : null);
    }))));

  // Qualité / prix
  frag.append(section('Qualité ou prix : qui en donne le plus ?',
    'Chaque point est un modèle classé. En haut à gauche : les meilleurs pour leur prix.',
    h('div', { class: 'card' }, chartBox('chart-scatter', (box, w) => drawScatter(box, w, list)))));

  // Mouvements
  const evs = snap.events.slice(0, 7);
  if (evs.length) {
    frag.append(sectionWith('Les derniers mouvements', 'Nouveaux n° 1, entrées dans les classements, prix, sorties.',
      h('a', { class: 'btn ghost sm', href: '#/nouveautes' }, 'Toutes les nouveautés'),
      h('ul', { class: 'events' }, evs.map(eventRow))));
  }
  return frag;
}

function tile(label, value, sub) {
  return h('div', { class: 'tile' }, h('span', { class: 'tile-label', text: label }),
    h('span', { class: 'tile-value', text: value }), sub ? h('span', { class: 'tile-sub', text: sub }) : null);
}

/* Bandeau « depuis ta dernière visite ». */
function sinceVisit() {
  if (!lastVisit || !lastVisit.at) return null;
  if (Date.now() - Date.parse(lastVisit.at) < 3600000) return null;
  const day = lastVisit.at.slice(0, 10);
  const evs = snap.events.filter((e) => e.date >= day);
  if (!evs.length) return null;
  const count = (t) => evs.filter((e) => e.type === t).length;
  const parts = [
    count('leader') ? `${count('leader')} nouveau${count('leader') > 1 ? 'x' : ''} n° 1` : null,
    count('entry') ? `${count('entry')} entrée${count('entry') > 1 ? 's' : ''} dans les classements` : null,
    count('price') ? `${count('price')} changement${count('price') > 1 ? 's' : ''} de prix` : null,
    count('release') ? `${count('release')} sortie${count('release') > 1 ? 's' : ''}` : null,
  ].filter(Boolean);
  const favHits = evs.filter((e) => favs.has(e.model)).length;
  return h('a', { class: 'since', href: '#/nouveautes' },
    icon('spark'),
    h('span', {}, h('b', { text: `Depuis ta dernière visite (${relTime(lastVisit.at)}) : ` }), parts.join(', ') + '.',
      favHits ? ` Dont ${favHits} sur tes favoris.` : ''),
    h('span', { class: 'since-go', text: 'Voir →' }));
}

/* Classements */
function viewRanking(catId) {
  const isGeneral = catId === 'general' || !catById.has(catId);
  const cat = isGeneral ? null : catById.get(catId);
  const st = ui.rank;
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' },
    h('h1', { text: isGeneral ? 'Classement général' : 'Classement ' + cat.label }),
    h('p', { class: 'sub', text: isGeneral
      ? 'L\'indice marketbuss résume la qualité mesurée dans les arènes Texte, Code, Vision et Documents (sur 100).'
      : `${cat.desc}. Score Elo de l'arène ${cat.label} d'Arena AI${cat.updated ? ', mise à jour du ' + cat.updated : ''}.` })));

  frag.append(h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Arènes' },
    [['general', 'Général'], ...snap.categories.map((c) => [c.id, c.label])].map(([id, label]) =>
      h('a', { role: 'tab', class: 'tab' + ((isGeneral ? 'general' : catId) === id ? ' on' : ''),
        'aria-selected': (isGeneral ? 'general' : catId) === id ? 'true' : 'false',
        href: '#/classement/' + id }, label))));

  const base = isGeneral ? ranked() : snap.models.filter((m) => m.cats[catId]);
  const isMedia = cat && cat.group === 'media';
  const vendors = [...new Set(base.map((m) => m.vendor).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  if (st.vendor && !vendors.includes(st.vendor)) st.vendor = '';

  const results = h('div', { class: 'results' });
  const count = h('span', { class: 'count' });
  const draw = () => {
    const rows = filterRows(base, catId, isGeneral);
    count.textContent = `${rows.length} modèle${rows.length > 1 ? 's' : ''}`;
    results.replaceChildren(rows.length ? rankingTable(rows, catId, isGeneral, isMedia, draw)
      : h('p', { class: 'empty', text: 'Aucun modèle ne correspond à ces filtres.' }));
  };

  const search = h('input', { class: 'input', type: 'search', placeholder: 'Rechercher un modèle ou un éditeur',
    'aria-label': 'Rechercher', value: st.q, oninput: (e) => { st.q = e.target.value; draw(); } });
  const vendorSel = h('select', { class: 'input select', 'aria-label': 'Éditeur',
    onchange: (e) => { st.vendor = e.target.value; draw(); } },
  h('option', { value: '' }, 'Tous les éditeurs'), vendors.map((v) => h('option', { value: v, selected: v === st.vendor ? 'selected' : null }, v)));
  const lic = () => seg('Licence', [['all', 'Toutes'], ['open', 'Ouvertes'], ['proprietary', 'Fermées']], st.license, (v) => {
    st.license = v;
    licBox.replaceChildren(lic());
    draw();
  });
  const licBox = h('div', {}, lic());
  const chip = (key, label) => h('button', {
    type: 'button', class: 'chip' + (st.caps.includes(key) ? ' on' : ''), 'aria-pressed': st.caps.includes(key) ? 'true' : 'false',
    onclick: (e) => {
      st.caps = st.caps.includes(key) ? st.caps.filter((k) => k !== key) : [...st.caps, key];
      e.currentTarget.classList.toggle('on');
      e.currentTarget.setAttribute('aria-pressed', st.caps.includes(key) ? 'true' : 'false');
      draw();
    },
  }, label);
  const favChip = h('button', {
    type: 'button', class: 'chip' + (st.favs ? ' on' : ''), 'aria-pressed': st.favs ? 'true' : 'false',
    onclick: (e) => { st.favs = !st.favs; e.currentTarget.classList.toggle('on', st.favs); e.currentTarget.setAttribute('aria-pressed', String(st.favs)); draw(); },
  }, icon('star', 'ic sm'), 'Mes favoris');

  frag.append(h('div', { class: 'filters' },
    h('label', { class: 'search-box' }, icon('search'), search),
    vendorSel, licBox,
    h('div', { class: 'chips' }, favChip,
      !isMedia ? [chip('vision', 'Vision'), chip('reasoning', 'Raisonnement'), chip('tools', 'Outils'), chip('pdf', 'PDF'), chip('free', 'Version gratuite')] : null),
    h('div', { class: 'filters-end' }, count,
      h('button', { class: 'btn ghost sm', type: 'button', onclick: () => exportCsv(filterRows(base, catId, isGeneral), catId, isGeneral, isMedia) },
        icon('download'), 'Exporter (CSV)'))));
  frag.append(results);
  draw();
  if (isGeneral) {
    frag.append(h('p', { class: 'fineprint' }, 'Seuls les modèles présents dans les arènes Texte ou Code ont un indice. ',
      'Les autres sont dans leur arène (onglets ci-dessus). ', h('a', { href: '#/methode', text: 'Comment l\'indice est calculé' })));
  }
  return frag;
}

function filterRows(base, catId, isGeneral) {
  const st = ui.rank;
  const q = fold(st.q.trim());
  let rows = base.filter((m) => {
    if (q && !fold(m.name + ' ' + (m.vendor || '') + ' ' + m.id).includes(q)) return false;
    if (st.vendor && m.vendor !== st.vendor) return false;
    if (st.license === 'open' && m.license !== 'open') return false;
    if (st.license === 'proprietary' && m.license === 'open') return false;
    if (st.favs && !favs.has(m.id)) return false;
    for (const c of st.caps) {
      if (c === 'free' ? !(m.or && m.or.free) : !(m.caps && m.caps[c])) return false;
    }
    return true;
  });
  const val = (m) => {
    switch (st.sort) {
      case 'name': return m.name;
      case 'index': return m.index ?? -1;
      case 'text': return m.cats.text ? -m.cats.text.rank : -1e9;
      case 'code': return m.cats.code ? -m.cats.code.rank : -1e9;
      case 'price': return m.price ? -m.price.blended : -1e9;
      case 'context': return m.context || 0;
      case 'votes': return (m.cats[catId] || {}).votes || 0;
      case 'delta': {
        const r = isGeneral ? m : m.cats[catId];
        return r && r.rank7 ? r.rank7 - r.rank : r && r.rank7 === 0 ? 1e6 : -1e9;
      }
      default: return isGeneral ? -m.rank : -m.cats[catId].rank;
    }
  };
  rows = rows.slice().sort((a, b) => {
    const va = val(a);
    const vb = val(b);
    const c = typeof va === 'string' ? va.localeCompare(vb) : vb - va;
    return c * st.dir;
  });
  return rows;
}

function rankingTable(rows, catId, isGeneral, isMedia, redraw) {
  const st = ui.rank;
  const sortable = (key, label, cls = '') => h('th', { class: cls, scope: 'col', 'aria-sort': st.sort === key ? (st.dir > 0 ? 'descending' : 'ascending') : null },
    h('button', { type: 'button', class: 'th-btn' + (st.sort === key ? ' on' : ''),
      onclick: () => {
        if (st.sort === key) st.dir = -st.dir; else { st.sort = key; st.dir = 1; }
        redraw();
      } }, label, st.sort === key ? (st.dir > 0 ? ' ↓' : ' ↑') : ''));
  const cols = isGeneral
    ? [sortable(null, '#', 'num'), sortable('delta', '7 j', 'num'), sortable('name', 'Modèle'), sortable('index', 'Indice'),
      sortable('text', 'Texte', 'num'), sortable('code', 'Code', 'num'), sortable('price', 'Prix entrée / sortie', 'num'),
      sortable('context', 'Contexte', 'num'), h('th', { scope: 'col' }, h('span', { class: 'sr' }, 'Favori'))]
    : [sortable(null, '#', 'num'), sortable('delta', '7 j', 'num'), sortable('name', 'Modèle'),
      sortable(null, catId === 'agent' ? 'Amélioration' : 'Elo', 'num'), h('th', { scope: 'col', class: 'num' }, '± IC'),
      sortable('votes', catId === 'agent' ? 'Sessions' : 'Votes', 'num'),
      !isMedia ? sortable('price', 'Prix mixte', 'num') : null, h('th', { scope: 'col' }, h('span', { class: 'sr' }, 'Favori'))];
  const table = h('table', { class: 'rank-table' }, h('thead', {}, h('tr', {}, cols)),
    h('tbody', {}, rows.map((m) => {
      if (isGeneral) {
        return h('tr', {},
          h('td', { class: 'num pos', text: String(m.rank) }),
          h('td', { class: 'num' }, delta(m.rank, m.rank7)),
          h('td', {}, h('div', { class: 'model-cell' }, modelLink(m), badges(m))),
          h('td', { class: 'idx-cell' }, h('span', { class: 'idx' }, bar(m.index), h('b', { text: fmt(m.index, 1) }))),
          h('td', { class: 'num', text: m.cats.text ? 'n° ' + m.cats.text.rank : '—' }),
          h('td', { class: 'num', text: m.cats.code ? 'n° ' + m.cats.code.rank : '—' }),
          h('td', { class: 'num', text: m.price ? `${fmtPrice(m.price.input)} / ${fmtPrice(m.price.output)}` : '—' }),
          h('td', { class: 'num', text: fmtCtx(m.context) }),
          h('td', { class: 'fav-cell' }, favButton(m)));
      }
      const c = m.cats[catId];
      return h('tr', {},
        h('td', { class: 'num pos', text: String(c.rank) }),
        h('td', { class: 'num' }, delta(c.rank, c.rank7)),
        h('td', {}, h('div', { class: 'model-cell' }, modelLink(m, c.variant ? 'réglage ' + c.variant : ''), badges(m))),
        h('td', { class: 'num strong', text: catId === 'agent' ? fmt(c.score, 2) : fmt(c.score) }),
        h('td', { class: 'num muted', text: c.ci != null ? '± ' + fmt(c.ci, catId === 'agent' ? 2 : 0) : '—' }),
        h('td', { class: 'num', text: fmt(c.votes) }),
        !isMedia ? h('td', { class: 'num', text: m.price ? fmtPrice(m.price.blended) : '—' }) : null,
        h('td', { class: 'fav-cell' }, favButton(m)));
    })));
  // Sur téléphone : des cartes plutôt qu'un tableau.
  const cards = h('ol', { class: 'rank-cards' }, rows.map((m) => {
    const c = isGeneral ? null : m.cats[catId];
    const rank = isGeneral ? m.rank : c.rank;
    const facts = isGeneral
      ? [m.cats.text ? `Texte n° ${m.cats.text.rank}` : null, m.cats.code ? `Code n° ${m.cats.code.rank}` : null,
        m.price ? `${fmtPrice(m.price.blended)} / M` : null, m.context ? `contexte ${fmtCtx(m.context)}` : null]
      : [c.variant ? 'réglage ' + c.variant : null, `${fmt(c.votes)} ${catId === 'agent' ? 'sessions' : 'votes'}`,
        !isMedia && m.price ? `${fmtPrice(m.price.blended)} / M` : null];
    return h('li', { class: 'rank-card' },
      h('span', { class: 'pos', text: String(rank) }),
      h('div', { class: 'rc-main' },
        h('div', { class: 'rc-top' }, modelLink(m), favButton(m)),
        h('div', { class: 'rc-facts' }, badges(m), facts.filter(Boolean).map((f) => h('span', { text: f })))),
      h('div', { class: 'rc-score' },
        h('b', { text: isGeneral ? fmt(m.index, 1) : (catId === 'agent' ? fmt(c.score, 2) : fmt(c.score)) }),
        h('small', { text: isGeneral ? 'indice' : catId === 'agent' ? 'amélior.' : 'Elo' }),
        delta(rank, isGeneral ? m.rank7 : c.rank7)));
  }));
  return h('div', {}, h('div', { class: 'table-wrap' }, table), cards);
}

function exportCsv(rows, catId, isGeneral, isMedia) {
  const num = (n, d = 2) => (n == null ? '' : String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ','));
  const head = isGeneral
    ? ['rang', 'modele', 'editeur', 'licence', 'indice', 'rang_texte', 'rang_code', 'prix_entree_usd_M', 'prix_sortie_usd_M', 'prix_mixte_usd_M', 'contexte']
    : ['rang', 'modele', 'editeur', 'licence', 'reglage', catId === 'agent' ? 'amelioration_nette' : 'elo', 'ic', 'votes', ...(isMedia ? [] : ['prix_mixte_usd_M'])];
  const lines = rows.map((m) => {
    if (isGeneral) {
      return [m.rank, m.name, m.vendor, m.license, num(m.index, 1), m.cats.text?.rank, m.cats.code?.rank,
        num(m.price?.input, 4), num(m.price?.output, 4), num(m.price?.blended, 4), m.context];
    }
    const c = m.cats[catId];
    return [c.rank, m.name, m.vendor, m.license, c.variant, num(c.score, 2), num(c.ci, 2), c.votes, ...(isMedia ? [] : [num(m.price?.blended, 4)])];
  });
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = '﻿' + [head, ...lines].map((r) => r.map(cell).join(';')).join('\r\n');
  const a = h('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
    download: `marketbuss-${isGeneral ? 'general' : catId}-${snap.generatedAt.slice(0, 10)}.csv` });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* Fiche d'un modèle */
function viewModel(id) {
  const m = byId.get(id);
  const frag = h('div', { class: 'wrap' });
  if (!m) {
    frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Modèle introuvable' }),
      h('p', { class: 'sub', text: 'Il n\'est plus dans les classements suivis, ou le lien est incomplet.' }),
      h('a', { class: 'btn primary', href: '#/classement' }, 'Voir le classement')));
    return frag;
  }
  const inCompare = ui.compare.includes(m.id);
  frag.append(h('nav', { class: 'crumbs', 'aria-label': 'Fil d\'Ariane' },
    h('a', { href: '#/classement', text: 'Classements' }), h('span', { text: ' / ' }), h('span', { text: m.name })));
  frag.append(h('div', { class: 'model-head' },
    h('div', {},
      h('h1', { text: m.name }),
      h('p', { class: 'sub' }, h('span', { text: m.vendor || 'Éditeur inconnu' }),
        m.license ? h('span', { text: m.license === 'open' ? ' · poids ouverts' : ' · propriétaire' }) : null,
        m.firstSeen ? h('span', { text: ` · dans les arènes depuis le ${fmtDay(m.firstSeen)}` }) : null),
      badges(m)),
    h('div', { class: 'actions' },
      favButton(m),
      h('a', { class: 'btn', href: '#/comparer/' + encodeURIComponent([...new Set([...ui.compare.filter((x) => x !== m.id), m.id])].slice(-MAX_COMPARE).join(',')),
        onclick: () => { if (!inCompare) ui.compare = [...ui.compare.filter((x) => x !== m.id), m.id].slice(-MAX_COMPARE); } },
      icon('plus'), 'Comparer'),
      m.or ? h('a', { class: 'btn ghost', href: 'https://openrouter.ai/' + m.or.id, target: '_blank', rel: 'noopener' },
        'Essayer sur OpenRouter', icon('external')) : null)));

  frag.append(h('div', { class: 'tiles' },
    m.index != null ? tile('Indice marketbuss', fmt(m.index, 1), `n° ${m.rank} sur ${snap.stats.ranked}${m.provisional ? ' · provisoire' : ''}`)
      : tile('Indice marketbuss', '—', m.group === 'media' ? 'modèle d\'images ou de vidéo' : 'absent des arènes Texte et Code'),
    tile('Prix mixte', m.price ? fmtPrice(m.price.blended) : '—', m.price ? 'par million de jetons (3 lus pour 1 écrit)' : 'pas de prix public trouvé'),
    tile('Contexte', fmtCtx(m.context), m.maxOutput ? `jusqu'à ${fmtCtx(m.maxOutput)} jetons en sortie` : 'jetons lus à la fois'),
    tile('Arènes', String(Object.keys(m.cats).length), Object.keys(m.cats).map((c) => (catById.get(c) || {}).label).filter(Boolean).join(', '))));

  // Rangs par arène
  const catRows = snap.categories.filter((c) => m.cats[c.id]);
  frag.append(section('Ses résultats par arène', 'Barre : chances de l\'emporter face au n° 1 de l\'arène (100 = le n° 1).',
    h('div', { class: 'card' }, h('ul', { class: 'hbars' }, catRows.map((c) => {
      const cell = m.cats[c.id];
      const row = h('li', { class: 'hbar-row', tabindex: 0 },
        h('a', { class: 'hb-label', href: '#/classement/' + c.id, text: c.label }),
        h('span', { class: 'hb-track' }, h('span', { class: 'hb-fill', style: `width:${Math.max(2, cell.points)}%` })),
        h('span', { class: 'hb-value' }, h('b', { text: 'n° ' + cell.rank }),
          h('span', { text: c.id === 'agent' ? ` · ${fmt(cell.score, 2)}` : ` · Elo ${fmt(cell.score)}` }),
          delta(cell.rank, cell.rank7)));
      const show = (ev) => {
        const r = row.getBoundingClientRect();
        showTip(ev && ev.clientX != null ? ev.clientX : r.left + r.width / 2, r.top,
          h('div', { class: 'tip-title', text: c.label }),
          tipRow(c.id === 'agent' ? fmt(cell.score, 2) : fmt(cell.score), c.id === 'agent' ? 'amélioration nette' : `Elo (± ${fmt(cell.ci)})`),
          tipRow(fmt(cell.points, 1), 'sur 100 face au n° 1'),
          tipRow(fmt(cell.votes), c.id === 'agent' ? 'sessions' : 'votes'),
          cell.variant ? tipRow(cell.variant, 'meilleur réglage') : null);
      };
      row.addEventListener('pointermove', show);
      row.addEventListener('pointerleave', hideTip);
      row.addEventListener('focus', () => show(null));
      row.addEventListener('blur', hideTip);
      return row;
    })))));

  // Historique
  const hist = Object.entries(m.hist || {}).filter(([, pts]) => pts.length > 1);
  if (hist.length) {
    frag.append(section('Évolution sur 30 jours', 'Score Elo, jour par jour, dans chaque arène suivie de près.',
      h('div', { class: 'multiples' }, hist.map(([c, pts]) => h('div', { class: 'card' },
        h('h3', { text: (catById.get(c) || {}).label || c }),
        chartBox('chart-line', (box, w) => drawLine(box, w, pts, { name: (catById.get(c) || {}).label || c })),
        h('details', { class: 'data' }, h('summary', {}, 'Voir les valeurs'),
          h('table', { class: 'mini' }, h('thead', {}, h('tr', {}, h('th', {}, 'Jour'), h('th', { class: 'num' }, 'Elo'), h('th', { class: 'num' }, 'Rang'))),
            h('tbody', {}, pts.slice().reverse().map((p) => h('tr', {}, h('td', { text: fmtDay(p[0]) }),
              h('td', { class: 'num', text: fmt(p[1]) }), h('td', { class: 'num', text: 'n° ' + p[2] })))))))))));
  }

  // Prix et capacités
  if (m.group === 'llm' || m.price) {
    const caps = [['vision', 'Comprend les images'], ['reasoning', 'Raisonnement'], ['tools', 'Appels d\'outils'],
      ['pdf', 'Lit les PDF'], ['audio', 'Écoute l\'audio'], ['web', 'Recherche web']];
    frag.append(section('Prix et capacités', m.price ? `Prix ${m.price.source === 'litellm' ? 'catalogue' : 'OpenRouter'}`
      + (m.price.provider ? ` (${m.price.provider})` : '') + ', en dollars par million de jetons.' : 'Aucun prix public trouvé pour ce modèle.',
    h('div', { class: 'two-col' },
      h('div', { class: 'card' }, h('dl', { class: 'facts' },
        fact('Entrée (jetons lus)', m.price ? fmtPrice(m.price.input) : '—'),
        fact('Sortie (jetons écrits)', m.price ? fmtPrice(m.price.output) : '—'),
        fact('Entrée en cache', m.price && m.price.cacheRead ? fmtPrice(m.price.cacheRead) : '—'),
        fact('Prix mixte (3 : 1)', m.price ? fmtPrice(m.price.blended) : '—'),
        fact('Contexte', fmtCtx(m.context)),
        fact('Sortie maximale', fmtCtx(m.maxOutput)))),
      h('div', { class: 'card' }, h('ul', { class: 'caps' }, caps.map(([k, label]) => h('li', { class: m.caps && m.caps[k] ? 'yes' : 'no' },
        icon(m.caps && m.caps[k] ? 'check' : 'close'), h('span', { text: label }),
        h('span', { class: 'sr', text: m.caps && m.caps[k] ? ' : oui' : ' : non ou inconnu' })))),
      m.variants && m.variants.length ? h('p', { class: 'fineprint', text: 'Réglages vus dans les arènes : ' + m.variants.join(', ') + '.' }) : null))));
  }

  // Alternatives
  if (m.index != null) {
    const cheaper = ranked().filter((x) => x.id !== m.id && x.price && m.price && x.price.blended < m.price.blended
      && x.index >= m.index - 6).sort((a, b) => b.index - a.index).slice(0, 4);
    const better = ranked().filter((x) => x.rank < m.rank).slice(-3).reverse();
    if (cheaper.length || better.length) {
      frag.append(section('Et à côté ?', null, h('div', { class: 'two-col' },
        cheaper.length ? h('div', { class: 'card' }, h('h3', { text: 'Presque aussi bons, moins chers' }), miniList(cheaper)) : null,
        better.length ? h('div', { class: 'card' }, h('h3', { text: 'Juste devant au classement' }), miniList(better)) : null)));
    }
  }
  return frag;
}

const fact = (k, v) => [h('dt', { text: k }), h('dd', { text: v })];
function miniList(list) {
  return h('ul', { class: 'mini-list' }, list.map((x) => h('li', {}, modelLink(x),
    h('span', { class: 'mini-figs' }, h('b', { text: fmt(x.index, 1) }), h('span', { text: x.price ? fmtPrice(x.price.blended) + ' / M' : '' })))));
}

/* Comparateur */
function viewCompare(arg) {
  if (arg) ui.compare = arg.split(',').map((s) => s.trim()).filter((id) => byId.has(id)).slice(0, MAX_COMPARE);
  const ids = ui.compare;
  const models = ids.map((id) => byId.get(id));
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Comparer des modèles' }),
    h('p', { class: 'sub', text: `Jusqu'à ${MAX_COMPARE} modèles côte à côte. Le lien de la page garde ta sélection : partage-le.` })));

  const go = (next) => { location.hash = '#/comparer/' + next.map(encodeURIComponent).join(','); };
  frag.append(h('div', { class: 'picked' },
    models.map((m, i) => h('span', { class: 'pick s' + (i + 1) }, h('i', { class: 'key s' + (i + 1) }), h('span', { text: m.name }),
      h('button', { type: 'button', class: 'pick-x', 'aria-label': 'Retirer ' + m.name, onclick: () => go(ids.filter((x) => x !== m.id)) }, icon('close')))),
    ids.length < MAX_COMPARE ? picker((id) => go([...ids, id]), ids) : null));

  if (!models.length) {
    const sugg = ranked().slice(0, 3).map((m) => m.id);
    frag.append(h('div', { class: 'empty-state' },
      h('p', { text: 'Choisis des modèles avec la recherche ci-dessus, ou commence par le podium :' }),
      h('button', { class: 'btn primary', type: 'button', onclick: () => go(sugg) }, 'Comparer le top 3')));
    return frag;
  }

  const cats = snap.categories.filter((c) => models.some((m) => m.cats[c.id]));
  const best = (vals, low = false) => {
    const ok = vals.filter((v) => v != null);
    if (ok.length < 2) return null;
    return low ? Math.min(...ok) : Math.max(...ok);
  };
  const row = (label, vals, show, { low = false } = {}) => {
    const b = best(vals, low);
    return h('tr', {}, h('th', { scope: 'row', text: label }),
      vals.map((v) => h('td', { class: 'num' + (b != null && v === b ? ' best' : '') },
        b != null && v === b ? icon('check', 'ic sm') : null, show(v))));
  };
  const table = h('table', { class: 'cmp-table' },
    h('thead', {}, h('tr', {}, h('td', {}), models.map((m, i) => h('th', { scope: 'col' }, h('i', { class: 'key s' + (i + 1) }),
      h('a', { href: '#/modele/' + encodeURIComponent(m.id), text: m.name }), h('small', { text: m.vendor || '' }))))),
    h('tbody', {},
      row('Indice marketbuss', models.map((m) => m.index ?? null), (v) => fmt(v, 1)),
      row('Rang général', models.map((m) => m.rank ?? null), (v) => (v ? 'n° ' + v : '—'), { low: true }),
      cats.map((c) => row(c.label + (c.id === 'agent' ? ' (amélioration)' : ' (Elo)'),
        models.map((m) => (m.cats[c.id] ? m.cats[c.id].score : null)), (v) => (v == null ? '—' : fmt(v, c.id === 'agent' ? 2 : 0)))),
      row('Prix entrée / M', models.map((m) => m.price?.input ?? null), fmtPrice, { low: true }),
      row('Prix sortie / M', models.map((m) => m.price?.output ?? null), fmtPrice, { low: true }),
      row('Prix mixte / M', models.map((m) => m.price?.blended ?? null), fmtPrice, { low: true }),
      row('Contexte', models.map((m) => m.context ?? null), fmtCtx),
      h('tr', {}, h('th', { scope: 'row', text: 'Licence' }), models.map((m) => h('td', { class: 'num', text: m.license === 'open' ? 'ouverte' : m.license ? 'propriétaire' : '—' }))),
      h('tr', {}, h('th', { scope: 'row', text: 'Capacités' }), models.map((m) => h('td', { class: 'num', text:
        Object.entries({ vision: 'vision', reasoning: 'raisonnement', tools: 'outils', pdf: 'PDF' })
          .filter(([k]) => m.caps && m.caps[k]).map(([, v]) => v).join(', ') || '—' })))));
  frag.append(h('div', { class: 'card table-wrap' }, table));

  // Barres groupées : une couleur par modèle (ordre de sélection), légende au-dessus.
  frag.append(section('Arène par arène', 'Sur 100 : chances de l\'emporter face au n° 1 de l\'arène.',
    h('div', { class: 'card' },
      h('div', { class: 'legend' }, models.map((m, i) => h('span', {}, h('i', { class: 'key rect s' + (i + 1) }), m.name))),
      h('div', { class: 'gbars' }, cats.map((c) => h('div', { class: 'gb-group' },
        h('span', { class: 'gb-label', text: c.label }),
        h('div', { class: 'gb-bars' }, models.map((m, i) => {
          const cell = m.cats[c.id];
          return h('div', { class: 'gb-row', title: `${m.name} : ${cell ? fmt(cell.points, 1) + ' / 100, n° ' + cell.rank : 'absent de l\'arène'}` },
            h('span', { class: 'gb-track' }, cell ? h('span', { class: 'gb-fill s' + (i + 1), style: `width:${Math.max(1.5, cell.points)}%` }) : null),
            h('span', { class: 'gb-val', text: cell ? fmt(cell.points, 0) : '—' }));
        }))))))));
  return frag;
}

/* Champ de recherche avec suggestions (comparateur, calculateur). */
function picker(onpick, exclude = []) {
  const list = h('ul', { class: 'picker-list', role: 'listbox', hidden: true });
  let active = -1;
  let items = [];
  const input = h('input', { class: 'input', type: 'search', placeholder: 'Ajouter un modèle…', 'aria-label': 'Ajouter un modèle',
    role: 'combobox', 'aria-expanded': 'false', autocomplete: 'off' });
  const update = () => {
    const q = fold(input.value.trim());
    items = snap.models.filter((m) => !exclude.includes(m.id) && (!q || fold(m.name + ' ' + (m.vendor || '') + ' ' + m.id).includes(q)))
      .slice(0, 8);
    active = items.length ? 0 : -1;
    list.replaceChildren(...items.map((m, i) => h('li', { role: 'option', class: i === active ? 'on' : '', 'aria-selected': i === active ? 'true' : 'false',
      onpointerdown: (e) => { e.preventDefault(); onpick(m.id); } },
    h('span', { text: m.name }), h('small', { text: [m.vendor, m.rank ? 'n° ' + m.rank : null].filter(Boolean).join(' · ') }))));
    list.hidden = !items.length;
    input.setAttribute('aria-expanded', items.length ? 'true' : 'false');
  };
  input.addEventListener('input', update);
  input.addEventListener('focus', update);
  input.addEventListener('blur', () => setTimeout(() => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }, 120));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      [...list.children].forEach((li, i) => { li.classList.toggle('on', i === active); li.setAttribute('aria-selected', i === active ? 'true' : 'false'); });
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      onpick(items[active].id);
    } else if (e.key === 'Escape') {
      list.hidden = true;
    }
  });
  return h('div', { class: 'picker' }, icon('search'), input, list);
}

/* Calculateur de coût */
const PRESETS = {
  chat: { label: 'Chatbot de site', input: 2, output: 0.5, cache: 30 },
  code: { label: 'Assistant de code', input: 20, output: 4, cache: 60 },
  docs: { label: 'Analyse de documents', input: 50, output: 2, cache: 20 },
  agent: { label: 'Agent autonome', input: 150, output: 25, cache: 70 },
};
function viewCalc() {
  const st = ui.calc;
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Calculateur de coût' }),
    h('p', { class: 'sub', text: 'Combien coûterait ton usage chez chaque modèle, au prix catalogue des fournisseurs.' })));
  const out = h('div', {});
  const field = (key, label, unit, step) => h('label', { class: 'field' }, h('span', { text: label }),
    h('span', { class: 'field-input' }, h('input', { class: 'input', type: 'number', min: 0, step, value: st[key], inputmode: 'decimal',
      oninput: (e) => { st[key] = Math.max(0, Number(e.target.value) || 0); st.preset = null; presetBox.replaceChildren(presetSeg()); draw(); } }),
    h('span', { class: 'unit', text: unit })));
  const presetSeg = () => seg('Exemples d\'usage', Object.entries(PRESETS).map(([k, p]) => [k, p.label]), st.preset, (k) => {
    Object.assign(st, PRESETS[k], { preset: k });
    render({ keepScroll: true });
  });
  const presetBox = h('div', {}, presetSeg());
  const draw = () => {
    const pool = (st.rankedOnly ? ranked() : snap.models.filter((m) => m.group === 'llm')).filter((m) => m.price);
    const rows = pool.map((m) => {
      const cached = (st.input * st.cache) / 100;
      const fresh = st.input - cached;
      const cacheRate = m.price.cacheRead ?? m.price.input;
      const cost = fresh * m.price.input + cached * cacheRate + st.output * m.price.output;
      return { m, cost };
    }).sort((a, b) => a.cost - b.cost);
    if (!rows.length) { out.replaceChildren(h('p', { class: 'empty', text: 'Aucun modèle avec un prix.' })); return; }
    const max = Math.max(...rows.map((r) => r.cost));
    const cheapest = rows[0];
    const bestQ = rows.filter((r) => r.m.index != null).sort((a, b) => b.m.index - a.m.index)[0];
    const value = rows.filter((r) => r.m.pareto && r.m.index != null && bestQ && r.m.index >= bestQ.m.index - 8)
      .sort((a, b) => a.cost - b.cost)[0];
    out.replaceChildren(
      h('div', { class: 'tiles three' },
        pickTile('Le moins cher', cheapest),
        bestQ ? pickTile('Le mieux classé', bestQ) : null,
        value ? pickTile('Le bon compromis', value, 'à 8 points du meilleur, au meilleur prix') : null),
      h('div', { class: 'card' }, h('table', { class: 'cost-table' },
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Modèle'), h('th', { scope: 'col', class: 'num' }, 'Indice'),
          h('th', { scope: 'col' }, 'Coût par mois'), h('th', { scope: 'col', class: 'num' }, 'Par an'))),
        h('tbody', {}, rows.map(({ m, cost }) => h('tr', {},
          h('td', {}, modelLink(m)),
          h('td', { class: 'num', text: m.index != null ? fmt(m.index, 1) : '—' }),
          h('td', {}, h('div', { class: 'cost-cell' }, h('span', { class: 'cost-bar', 'aria-hidden': 'true' },
            h('span', { style: `width:${max ? Math.max(0.8, (cost / max) * 100) : 0}%` })), h('b', { text: fmtCost(cost) }))),
          h('td', { class: 'num', text: fmtCost(cost * 12) })))))),
      h('p', { class: 'fineprint', text: 'Les modèles qui « réfléchissent » écrivent des jetons de raisonnement en plus de la réponse : '
        + 'compte large pour la sortie. Prix hors taxes, sans remise de volume ni tarif « batch ».' }));
  };
  frag.append(h('div', { class: 'card calc-form' },
    h('p', { class: 'calc-hint', text: 'Pars d\'un exemple, puis ajuste :' }), presetBox,
    h('div', { class: 'fields' },
      field('input', 'Jetons lus par mois', 'millions', 0.5),
      field('output', 'Jetons écrits par mois', 'millions', 0.5),
      field('cache', 'Part des jetons lus déjà en cache', '%', 5)),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.rankedOnly ? 'checked' : null,
      onchange: (e) => { st.rankedOnly = e.target.checked; draw(); } }), 'Seulement les modèles classés au général'),
    h('p', { class: 'fineprint', text: `${fmtTokens(1e6)} de jetons ≈ 750 000 mots en anglais, un peu moins en français.` })));
  frag.append(out);
  draw();
  return frag;
}
function pickTile(label, r, sub) {
  return h('a', { class: 'tile pick-tile', href: '#/modele/' + encodeURIComponent(r.m.id) },
    h('span', { class: 'tile-label', text: label }), h('span', { class: 'tile-value', text: fmtCost(r.cost) }),
    h('span', { class: 'tile-sub', text: `${r.m.name}${r.m.index != null ? ' · indice ' + fmt(r.m.index, 1) : ''}${sub ? ' — ' + sub : ''} · par mois` }));
}

/* Trouver mon IA */
const USES = [
  ['text', 'Écrire et discuter', 'Rédaction, questions, idées'],
  ['code', 'Programmer', 'Code, sites, scripts'],
  ['document', 'Lire des documents', 'PDF, contrats, rapports'],
  ['vision', 'Comprendre des images', 'Photos, schémas, captures'],
  ['search', 'Chercher sur le web', 'Réponses sourcées'],
  ['agent', 'Confier des tâches', 'Agents autonomes'],
  ['text-to-image', 'Créer des images', 'Illustrations, visuels'],
  ['image-edit', 'Retoucher des images', 'Modifier une photo'],
  ['text-to-video', 'Créer des vidéos', 'À partir d\'un texte'],
];
function viewWizard() {
  const st = ui.wizard;
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Trouver l\'IA qu\'il me faut' }),
    h('p', { class: 'sub', text: 'Trois questions, et les trois meilleurs choix du moment pour toi, d\'après les classements du jour.' })));
  const uses = USES.filter(([id]) => catById.has(id));
  if (!uses.some(([id]) => id === st.use)) st.use = uses[0][0];
  const isMedia = (catById.get(st.use) || {}).group === 'media';
  const result = h('div', {});
  const rerender = () => render({ keepScroll: true });
  frag.append(h('div', { class: 'wizard' },
    h('fieldset', { class: 'card' }, h('legend', {}, h('span', { class: 'step', text: '1' }), 'Pour quoi faire ?'),
      h('div', { class: 'choices' }, uses.map(([id, label, sub]) => h('button', {
        type: 'button', class: 'choice' + (st.use === id ? ' on' : ''), 'aria-pressed': st.use === id ? 'true' : 'false',
        onclick: () => { st.use = id; rerender(); },
      }, h('b', { text: label }), h('small', { text: sub }))))),
    h('fieldset', { class: 'card', disabled: isMedia ? 'disabled' : null },
      h('legend', {}, h('span', { class: 'step', text: '2' }), 'Quel budget ?'),
      isMedia ? h('p', { class: 'fineprint', text: 'Les prix des modèles d\'images et de vidéo ne sont pas comparables au jeton : ce critère est ignoré.' })
        : seg('Budget', [[0, 'Peu importe'], [10, '≤ 10 $'], [3, '≤ 3 $'], [1, '≤ 1 $']], st.budget, (v) => { st.budget = v; rerender(); }),
      !isMedia ? h('p', { class: 'fineprint', text: 'Prix mixte par million de jetons (environ 750 000 mots).' }) : null),
    h('fieldset', { class: 'card' }, h('legend', {}, h('span', { class: 'step', text: '3' }), 'Des exigences ?'),
      h('div', { class: 'checks' },
        wizCheck('open', 'Poids ouverts (hébergeable chez moi)'),
        !isMedia ? wizCheck('longctx', 'Grand contexte (200 000 jetons ou plus)') : null,
        !isMedia ? wizCheck('free', 'Version gratuite disponible') : null))));
  const cat = st.use;
  const pool = snap.models.filter((m) => m.cats[cat]
    && (!st.open || m.license === 'open')
    && (isMedia || !st.longctx || (m.context || 0) >= 200000)
    && (isMedia || !st.free || (m.or && m.or.free))
    && (isMedia || !st.budget || (m.price && m.price.blended <= st.budget)))
    .sort((a, b) => a.cats[cat].rank - b.cats[cat].rank);
  const top = pool.slice(0, 3);
  const label = (catById.get(cat) || {}).label;
  result.append(top.length
    ? h('div', { class: 'recos' }, top.map((m, i) => {
      const c = m.cats[cat];
      const why = [
        `n° ${c.rank} de l'arène ${label}`,
        m.rank ? `n° ${m.rank} au général` : null,
        !isMedia && m.price ? `${fmtPrice(m.price.blended)} par million de jetons` : null,
        !isMedia && m.context ? `contexte ${fmtCtx(m.context)}` : null,
        m.license === 'open' ? 'poids ouverts' : null,
        m.or && m.or.free ? 'version gratuite sur OpenRouter' : null,
      ].filter(Boolean);
      return h('a', { class: 'reco' + (i === 0 ? ' first' : ''), href: '#/modele/' + encodeURIComponent(m.id) },
        h('span', { class: 'reco-rank', text: i === 0 ? 'Notre choix' : i === 1 ? 'Alternative' : 'Aussi bien' }),
        h('span', { class: 'reco-name', text: m.name }),
        h('span', { class: 'reco-vendor', text: m.vendor || '' }),
        h('ul', {}, why.map((w) => h('li', { text: w }))));
    }))
    : h('p', { class: 'empty', text: 'Aucun modèle ne remplit toutes ces conditions aujourd\'hui. Assouplis un critère.' }));
  frag.append(section('Nos recommandations', `Parmi ${pool.length} modèle${pool.length > 1 ? 's' : ''} qui conviennent.`, result));
  return frag;
}
function wizCheck(key, label) {
  return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: ui.wizard[key] ? 'checked' : null,
    onchange: (e) => { ui.wizard[key] = e.target.checked; render({ keepScroll: true }); } }), label);
}

/* Nouveautés */
function eventText(e) {
  const m = byId.get(e.model);
  const name = m ? m.name : e.name || e.model || '';
  const cat = (catById.get(e.cat) || {}).label || e.cat;
  if (e.type === 'leader') {
    const prev = byId.get(e.previous);
    return [h('b', { text: name }), ` prend la tête de l'arène ${cat}`, prev ? `, devant ${prev.name}` : '', '.'];
  }
  if (e.type === 'entry') return [h('b', { text: name }), ` entre dans l'arène ${cat}, directement n° ${e.rank}.`];
  if (e.type === 'price') {
    const pct = Math.round(((e.to - e.from) / e.from) * 100);
    return [h('b', { text: name }), ` : prix ${pct < 0 ? 'en baisse' : 'en hausse'} de ${Math.abs(pct)} % (${fmtPrice(e.from)} → ${fmtPrice(e.to)} par M de jetons).`];
  }
  if (e.type === 'release') return ['Nouveau modèle disponible : ', h('b', { text: name }), '.'];
  return [name];
}
const EVENT_ICON = { leader: 'crown', entry: 'enter', price: 'tag', release: 'spark' };
function eventRow(e) {
  const m = byId.get(e.model);
  const inner = [h('span', { class: 'ev-ic ' + e.type }, icon(EVENT_ICON[e.type] || 'info')),
    h('span', { class: 'ev-txt' }, eventText(e)),
    h('span', { class: 'ev-date', text: fmtDay(e.date) })];
  return h('li', { class: 'event' + (m && favs.has(m.id) ? ' fav-ev' : '') },
    m ? h('a', { href: '#/modele/' + encodeURIComponent(m.id) }, inner)
      : e.orId ? h('a', { href: 'https://openrouter.ai/' + e.orId, target: '_blank', rel: 'noopener' }, inner) : h('div', {}, inner));
}
function viewNews() {
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Nouveautés' }),
    h('p', { class: 'sub', text: 'Tout ce qui a bougé ces 30 derniers jours, détecté automatiquement à chaque collecte.' })));
  const since = sinceVisit();
  if (since) frag.append(since);
  const feedUrl = new URL(FEED_URL, location.href).href;
  frag.append(h('div', { class: 'card subscribe' }, icon('rss'),
    h('div', {}, h('b', { text: 'Être prévenu sans revenir sur le site' }),
      h('p', { text: 'Ajoute ce flux à ton lecteur de flux (Feedly, Inoreader, Thunderbird…) : chaque mouvement y arrive tout seul.' })),
    h('div', { class: 'sub-actions' },
      h('code', { text: feedUrl }),
      h('button', { class: 'btn sm', type: 'button', onclick: async () => {
        try { await navigator.clipboard.writeText(feedUrl); toast('Adresse du flux copiée.', 'success'); } catch { toast('Copie impossible : sélectionne l\'adresse à la main.'); }
      } }, icon('copy'), 'Copier'))));
  const types = [['all', 'Tout'], ['leader', 'Nouveaux n° 1'], ['entry', 'Entrées'], ['price', 'Prix'], ['release', 'Sorties']]
    .filter(([t]) => t === 'all' || snap.events.some((e) => e.type === t));
  const list = h('div', {});
  const draw = () => {
    const evs = snap.events.filter((e) => ui.news === 'all' || e.type === ui.news);
    const days = new Map();
    for (const e of evs) (days.get(e.date) || days.set(e.date, []).get(e.date)).push(e);
    list.replaceChildren(...(evs.length ? [...days].map(([d, es]) => h('div', { class: 'day' },
      h('h3', { text: dayLabel(d) }), h('ul', { class: 'events' }, es.map(eventRow))))
      : [h('p', { class: 'empty', text: 'Rien de ce type ces 30 derniers jours.' })]));
  };
  const segBox = h('div', {});
  const drawSeg = () => segBox.replaceChildren(seg('Type', types, ui.news, (t) => { ui.news = t; drawSeg(); draw(); }));
  drawSeg();
  frag.append(h('div', { class: 'filters' }, segBox), list);
  draw();
  if (snap.releases && snap.releases.length) {
    frag.append(section('Sorties récentes', 'Les derniers modèles mis en ligne sur OpenRouter (pas encore forcément dans les arènes).',
      h('div', { class: 'card table-wrap' }, h('table', { class: 'rank-table plain' },
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Modèle'), h('th', { scope: 'col' }, 'Sorti le'),
          h('th', { scope: 'col', class: 'num' }, 'Prix entrée / sortie'), h('th', { scope: 'col', class: 'num' }, 'Contexte'))),
        h('tbody', {}, snap.releases.map((r) => h('tr', {},
          h('td', {}, r.model ? h('a', { href: '#/modele/' + encodeURIComponent(r.model), text: r.name })
            : h('a', { href: 'https://openrouter.ai/' + r.id, target: '_blank', rel: 'noopener', text: r.name }),
          h('small', { class: 'muted', text: ' ' + (r.vendor || '') }), r.free ? h('span', { class: 'badge free' }, 'gratuit') : null),
          h('td', { text: fmtDay(r.created.slice(0, 10)) }),
          h('td', { class: 'num', text: r.price ? `${fmtPrice(r.price.input)} / ${fmtPrice(r.price.output)}` : '—' }),
          h('td', { class: 'num', text: fmtCtx(r.context) }))))))));
  }
  return frag;
}

/* Méthode */
function viewMethod() {
  const frag = h('div', { class: 'wrap narrow' });
  frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Méthode' }),
    h('p', { class: 'sub', text: 'D\'où viennent les chiffres, comment ils sont calculés, et leurs limites.' })));
  const okText = (s) => (s.ok ? 'à jour' : 'injoignable au dernier passage');
  frag.append(section('Les sources', `Dernière collecte : ${new Date(snap.generatedAt).toLocaleString('fr-FR')} (${relTime(snap.generatedAt)}). Prochaine : ${nextRunText()}.`,
    h('ul', { class: 'sources' }, (snap.sources || []).map((s) => h('li', { class: s.ok ? 'ok' : 'ko' },
      h('span', { class: 'src-state', text: s.ok ? '✓' : '!' , 'aria-hidden': 'true' }),
      h('div', {}, h('a', { href: s.url, target: '_blank', rel: 'noopener', text: s.name }),
        h('p', { text: {
          arena: 'Qualité : des millions de votes à l\'aveugle entre deux réponses anonymes, convertis en score Elo, une arène par usage. '
            + 'Copie quotidienne en JSON par le projet libre arena-ai-leaderboards.',
          litellm: 'Prix : la base ouverte des tarifs publics de chaque fournisseur (entrée, sortie, cache), avec la taille du contexte et les capacités.',
          openrouter: 'Catalogue : les modèles mis en ligne, leur date de sortie et l\'existence d\'une version gratuite.',
        }[s.id] || '' }),
        h('small', { text: `${okText(s)}${s.date ? ' · classements du ' + fmtDay(s.date) : ''}` })))))));
  frag.append(section('L\'indice marketbuss', null, h('div', { class: 'prose' },
    h('p', { text: 'Dans chaque arène, un écart de score Elo se traduit en chances de gagner un duel. Pour chaque modèle, on calcule ses chances face au n° 1 de l\'arène, ramenées sur 100 : le n° 1 a 100, un modèle à 70 points derrière environ 80, à 200 points environ 48.' }),
    h('p', { text: 'L\'indice est la moyenne de ces notes dans quatre arènes : '
      + llmCats().filter((c) => c.weight).map((c) => `${c.label} (${Math.round(c.weight * 100)} %)`).join(', ') + '.' }),
    h('p', { text: 'Un modèle absent du haut d\'une arène compte juste sous la dernière place affichée. Exception : un modèle arrivé depuis moins de 14 jours, pas encore noté partout ; l\'arène manquante est alors laissée de côté et son indice est marqué « provisoire ».' }),
    h('p', { text: 'Les réglages d\'un même modèle (effort de réflexion « high », « max »…) sont regroupés : c\'est son meilleur réglage qui compte.' }))));
  frag.append(section('Le rapport qualité/prix', null, h('div', { class: 'prose' },
    h('p', { text: 'Le prix mixte compte 3 jetons lus pour 1 jeton écrit, l\'usage le plus courant. Un modèle est sur la frontière qualité/prix si aucun autre n\'est à la fois mieux classé et moins cher.' }))));
  frag.append(section('Les mises à jour', null, h('div', { class: 'prose' },
    h('p', { text: 'Un robot (GitHub Actions) relève toutes les sources toutes les 3 heures, recalcule tout et republie le site. Les arènes elles-mêmes changent environ une fois par jour.' }),
    h('p', { text: 'Une page restée ouverte vérifie toute seule toutes les 5 minutes s\'il y a du nouveau et se met à jour sans rechargement. Les nouveaux n° 1, entrées, sorties et changements de prix sont détectés automatiquement et publiés dans le flux Atom.' }))));
  frag.append(section('Les limites', null, h('ul', { class: 'prose list' },
    h('li', { text: 'Les arènes mesurent la préférence des votants sur des questions variées, pas une compétence précise. Le score d\'un modèle très récent bouge encore : regarde son intervalle de confiance (± IC).' }),
    h('li', { text: 'Les arènes n\'affichent que leur haut de classement : un modèle absent n\'est pas forcément mauvais, il est seulement sous la dernière place affichée.' }),
    h('li', { text: 'Les prix sont les prix catalogue, hors taxes, sans remise ni tarif « batch ». Les modèles qui réfléchissent écrivent plus de jetons, donc coûtent plus à l\'usage que leur prix au jeton ne le laisse croire.' }),
    h('li', { text: 'Le rapprochement des noms entre les sources est automatique : quelques modèles peuvent rester sans prix.' }))));
  frag.append(section('Données ouvertes', 'Réutilisables librement, sans clé ni inscription.', h('div', { class: 'prose' },
    h('p', {}, h('a', { href: DATA_URL, text: 'data/latest.json' }), ' : l\'instantané complet (modèles, arènes, prix, historique, événements), ',
      h('a', { href: FEED_URL, text: 'data/feed.xml' }), ' : le flux Atom des mouvements.'),
    h('p', { class: 'fineprint', text: `${snap.stats.models} modèles, dont ${snap.stats.ranked} classés au général et ${snap.stats.priced} avec un prix ; historique depuis le ${snap.stats.historyFrom ? fmtDay(snap.stats.historyFrom) : '—'}.` }))));
  return frag;
}

function renderError(err) {
  document.getElementById('view').replaceChildren(h('div', { class: 'wrap page-head' },
    h('h1', { text: 'Le marché est momentanément injoignable' }),
    h('p', { class: 'sub', text: 'Les données n\'ont pas pu être chargées (' + (err && err.message ? err.message : 'erreur réseau') + ').' }),
    h('button', { class: 'btn primary', type: 'button', onclick: () => { location.reload(); } }, icon('refresh'), 'Réessayer')));
}

/* ---------- Démarrage ---------- */

// La messagerie publiée avant à cette adresse avait un service worker et une
// copie hors ligne : on les retire pour qu'ils ne servent plus d'anciens fichiers.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .catch(() => {});
}
if (window.caches) {
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('message-me')).map((k) => caches.delete(k)))).catch(() => {});
}

let theme = store.get('mb-theme', 'auto');
applyTheme(theme);
document.getElementById('theme').addEventListener('click', () => {
  theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  store.set('mb-theme', theme);
  applyTheme(theme);
  requestAnimationFrame(drawCharts);
});
document.getElementById('status').addEventListener('click', () => refresh({ manual: true }));
addEventListener('hashchange', () => render());
addEventListener('pointerdown', (e) => { if (!e.target.closest('.hit, .overlay, .hbar-row')) hideTip(); });
addEventListener('scroll', hideTip, { passive: true });

await refresh();
store.set('mb-visit', { at: new Date().toISOString() });
setInterval(renderStatus, 30000);
pollTimer = setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
document.addEventListener('visibilitychange', () => { if (!document.hidden && snap && Date.now() - Date.parse(snap.generatedAt) > POLL_MS) refresh(); });
