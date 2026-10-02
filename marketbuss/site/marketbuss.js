// marketbuss — l'application (page unique, sans dépendance).
//
// Tout le calcul lourd est fait par le robot (marketbuss/tools/update.mjs),
// qui publie data/latest.json toutes les 3 heures. Cette page l'affiche,
// le filtre, le compare, et le relit toute seule toutes les 5 minutes : une
// page restée ouverte se met à jour sans rechargement.
//
// Les noms de modèles viennent de sources extérieures : ils ne passent
// jamais par innerHTML (textContent uniquement, voir h() et svg()). Les
// champs récents de l'instantané (tendance, détail des prix…) sont tous
// facultatifs : un ancien instantané republié en secours s'affiche aussi.

const DATA_URL = 'data/latest.json';
const FEED_URL = 'data/feed.xml';
const POLL_MS = 5 * 60 * 1000;
const MAX_COMPARE = 4;
const DAY = 86400000;
const WORDS_PER_TOKEN = 0.75; // en anglais ; un peu moins en français
const WORDS_PER_PAGE = 300;

/* ---------- Outils DOM ---------- */

/* Typographie française : pas de retour à la ligne avant ; : ! ? » % $ ni
   après « ou « n° ». Les adresses (sans espace) ne sont pas touchées. */
const typo = (s) => String(s).replace(/ ([;:!?»%$])/g, '\u00a0$1').replace(/« /g, '«\u00a0').replace(/n° /g, 'n°\u00a0');

function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = typo(v);
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(typo(kid)));
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

// Pictogrammes : tracés fixes écrits ici (aucune donnée extérieure).
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
  up: '<path d="M12 5.5l7.5 12h-15z" fill="currentColor" stroke="none"/>',
  down: '<path d="M12 18.5l7.5-12h-15z" fill="currentColor" stroke="none"/>',
  flat: '<path d="M6 12h12"/>',
  scale: '<path d="M12 4.5v15M6 19.5h12M5 8l7-2 7 2M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  columns: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M9.5 5v14M14.5 5v14"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
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
const plural = (n, one, many) => `${fmt(n)} ${n > 1 ? many || one + 's' : one}`;

function fmtPrice(p) {
  if (p == null) return '—';
  if (p === 0) return 'gratuit';
  return fmt(p, p < 0.1 ? 3 : 2) + ' $';
}
function fmtCost(d) {
  if (d == null) return '—';
  if (d === 0) return '0 $';
  if (d < 0.01) return 'moins de 0,01 $';
  if (d < 100) return fmtFixed(d, 2) + ' $';
  return fmt(Math.round(d)) + ' $';
}
function fmtCtx(n) {
  if (!n) return '—';
  if (n >= 1e6) return fmt(n / 1e6, 2) + ' M';
  if (n >= 1e3) return fmt(Math.round(n / 1e3)) + ' k';
  return fmt(n);
}
function fmtBig(n) {
  if (n == null) return '—';
  if (n >= 1e9) return fmt(n / 1e9, 1) + ' Md';
  if (n >= 1e6) return fmt(n / 1e6, 1) + ' M';
  if (n >= 1e4) return fmt(Math.round(n / 1e3)) + ' k';
  return fmt(n);
}
// Comme fmtBig, mais en toutes lettres sous le million (« 60 000 pages »).
const fmtCount = (n) => (n >= 1e6 ? fmtBig(n) : fmt(Math.round(n)));
const PROVIDERS = { anthropic: 'Anthropic', openai: 'OpenAI', gemini: 'Google', 'vertex_ai-language-models': 'Google Vertex AI',
  xai: 'xAI', mistral: 'Mistral', deepseek: 'DeepSeek', moonshot: 'Moonshot', meta: 'Meta', meta_llama: 'Meta', zai: 'Z.ai',
  dashscope: 'Alibaba', qwen_ai_platform: 'Alibaba', qwencloud: 'Alibaba', minimax: 'MiniMax', cohere: 'Cohere' };
const providerName = (p) => PROVIDERS[p] || String(p).replace(/[_-]+/g, ' ');
// Nombre de pages qu'un nombre de jetons représente (ordre de grandeur).
const pagesOf = (tokens) => Math.round((tokens * WORDS_PER_TOKEN) / WORDS_PER_PAGE);
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
const dateFull = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const fmtDay = (ymd) => dateFmt.format(new Date(ymd + 'T00:00:00Z'));
const fmtDate = (ymd) => dateFull.format(new Date(ymd + 'T00:00:00Z'));
function dayLabel(ymd) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - DAY).toISOString().slice(0, 10);
  if (ymd === today) return 'Aujourd\'hui';
  if (ymd === yesterday) return 'Hier';
  const s = dateLong.format(new Date(ymd + 'T00:00:00Z'));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ordinal = (n) => (n === 1 ? '1er' : n + 'e');
const modelHref = (m) => '#/modele/' + encodeURIComponent(m.id);
const vendorHref = (v) => '#/editeur/' + encodeURIComponent(v);
const median = (list) => {
  if (!list.length) return null;
  const s = list.slice().sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
/* Chances (0 à 1) qu'un modèle à `a` points Elo l'emporte sur un modèle à `b`. */
const winProb = (a, b) => 1 / (1 + 10 ** ((b - a) / 400));

/* ---------- Données ---------- */

let snap = null;
let byId = new Map();
let catById = new Map();
let vendors = new Map();
let market = {};
let pollTimer = null;
const favs = new Set(store.get('mb-favs', []));
const lastVisit = store.get('mb-visit', null);

const ui = {
  rank: { q: '', vendor: '', license: 'all', favs: false, caps: [], sort: null, dir: 1, cols: store.get('mb-cols', 'short') },
  compare: [],
  calc: { input: 20, output: 4, cache: 60, rankedOnly: true, batch: false, preset: 'code' },
  wizard: { use: 'text', budget: 0, open: false, longctx: false, free: false },
  news: { type: 'all', cat: 'all', favs: false },
  duel: {},
  vendorSort: 'best',
};

const ranked = () => market.ranked;
const llmCats = () => snap.categories.filter((c) => c.group === 'llm');
const leaderOf = (catId) => byId.get((catById.get(catId) || {}).leader);
const catLabel = (id) => (catById.get(id) || {}).label || id;
const isAgent = (catId) => catId === 'agent';
const scoreText = (catId, score) => (isAgent(catId) ? fmt(score, 2) : fmt(score));
const metricName = (catId) => (isAgent(catId) ? 'amélioration nette' : 'Elo');

function setData(data) {
  snap = data;
  byId = new Map(data.models.map((m) => [m.id, m]));
  catById = new Map(data.categories.map((c) => [c.id, c]));

  const list = data.models.filter((m) => m.rank).sort((a, b) => a.rank - b.rank);
  const priced = list.filter((m) => m.price && m.price.blended != null);
  const prices = priced.map((m) => m.price.blended).sort((a, b) => a - b);
  market = {
    ranked: list,
    priced,
    prices,
    medianPrice: median(prices),
    votes: data.categories.reduce((sum, c) => sum + (c.votes != null ? c.votes
      : data.models.reduce((s, m) => s + ((m.cats[c.id] || {}).votes || 0), 0)), 0),
    byCat: new Map(data.categories.map((c) => [c.id,
      data.models.filter((m) => m.cats[c.id]).sort((a, b) => a.cats[c.id].rank - b.cats[c.id].rank)])),
  };

  // Les éditeurs : leurs modèles, leur meilleur rang, les arènes qu'ils mènent.
  vendors = new Map();
  for (const m of data.models) {
    if (!m.vendor) continue;
    let v = vendors.get(m.vendor);
    if (!v) vendors.set(m.vendor, v = { name: m.vendor, models: [], ranked: [], leads: [], podiums: 0, open: 0, top20: 0 });
    v.models.push(m);
    if (m.rank) v.ranked.push(m);
    if (m.rank && m.rank <= 20) v.top20++;
    if (m.license === 'open') v.open++;
    for (const cell of Object.values(m.cats)) if (cell.rank <= 3) v.podiums++;
  }
  for (const c of data.categories) {
    const lead = byId.get(c.leader);
    if (lead && lead.vendor && vendors.has(lead.vendor)) vendors.get(lead.vendor).leads.push(c.id);
  }
  for (const v of vendors.values()) {
    v.ranked.sort((a, b) => a.rank - b.rank);
    v.best = v.ranked[0] || null;
    const p = v.models.filter((m) => m.price && m.price.blended != null).map((m) => m.price.blended);
    v.priceMin = p.length ? Math.min(...p) : null;
    v.priceMax = p.length ? Math.max(...p) : null;
    // Meilleure place toutes arènes confondues (pour les éditeurs d'images et de vidéo).
    v.bestCell = null;
    for (const m of v.models) {
      for (const [cat, cell] of Object.entries(m.cats)) {
        if (!v.bestCell || cell.rank < v.bestCell.rank) v.bestCell = { model: m, cat, rank: cell.rank };
      }
    }
  }
}

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
      toast('Déjà à jour. Prochaine collecte ' + nextRunText() + '.');
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
  btn.querySelector('.status-txt').replaceChildren(h('span', { text: txt }), h('span', { class: 'st-age', text: relTime(snap.generatedAt) }));
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
  tip.replaceChildren(...content.flat().filter(Boolean));
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
const tipRow = (value, label, key) => h('div', { class: 'tip-row' },
  key ? h('i', { class: 'line-key ' + key, 'aria-hidden': 'true' }) : null, h('b', { text: value }), h('span', { text: label }));

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

/* Variation de rang : pictogramme + nombre (jamais la couleur seule).
   `before` : rang d'avant (0 = absent du classement, null = inconnu).
   Absent avant ne veut pas dire nouveau : une arène n'affiche que son haut
   de classement, un modèle peut en sortir puis y revenir. */
function delta(rank, before, period = '7 jours', isNew = false) {
  if (rank == null || before == null) return h('span', { class: 'delta none' });
  if (before === 0) return h('span', { class: 'delta new', title: `Absent du classement il y a ${period}` }, isNew ? 'nouveau' : 'entrée');
  const d = before - rank;
  if (d > 0) return h('span', { class: 'delta up', title: `Gagne ${plural(d, 'place')} en ${period}` }, icon('up', 'tri'), String(d));
  if (d < 0) return h('span', { class: 'delta down', title: `Perd ${plural(-d, 'place')} en ${period}` }, icon('down', 'tri'), String(-d));
  return h('span', { class: 'delta same', title: `Même place qu'il y a ${period}` }, icon('flat', 'tri'), h('span', { class: 'sr', text: 'stable' }));
}

function badges(m) {
  const list = [
    m.isNew ? h('span', { class: 'badge new', title: 'Arrivé dans les classements il y a moins de 14 jours' }, 'nouveau') : null,
    m.provisional ? h('span', { class: 'badge prov', title: 'Pas encore noté dans toutes les arènes : indice provisoire' }, 'provisoire') : null,
    m.license === 'open' ? h('span', { class: 'badge open', title: 'Poids ouverts : téléchargeable et hébergeable soi-même' }, 'ouvert') : null,
    m.or && m.or.free ? h('span', { class: 'badge free', title: 'Version gratuite disponible sur OpenRouter' }, 'gratuit') : null,
    m.pareto ? h('span', { class: 'badge value', title: 'Sur la frontière qualité/prix : aucun modèle n\'est à la fois meilleur et moins cher' }, 'qualité/prix') : null,
  ].filter(Boolean);
  return list.length ? h('span', { class: 'badges' }, list) : null;
}

function modelLink(m, extra) {
  return h('a', { class: 'model-link', href: modelHref(m) },
    h('span', { class: 'model-name', text: m.name }),
    h('span', { class: 'model-meta' }, h('span', { text: m.vendor || 'éditeur inconnu' }), extra ? h('span', { text: extra }) : null));
}

function bar(value, max = 100, cls = '') {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return h('span', { class: 'bar ' + cls, 'aria-hidden': 'true' }, h('span', { style: `width:${pct.toFixed(1)}%` }));
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

/* Rangée de chiffres clés : étiquette, valeur, précision. */
function figure(label, value, sub, href) {
  const kids = [h('span', { class: 'fig-label', text: label }), h('span', { class: 'fig-value', text: value }),
    sub ? h('span', { class: 'fig-sub', text: sub }) : null];
  return href ? h('a', { class: 'fig', href }, kids) : h('div', { class: 'fig' }, kids);
}
const figures = (...items) => h('div', { class: 'figs' }, items);

/* Liste de faits (étiquette → valeur). */
const fact = (k, v, note) => [h('dt', { text: k }), h('dd', {}, v instanceof Node ? v : h('span', { text: v }),
  note ? h('small', { text: note }) : null)];

function dataTable(cls, head, rows) {
  return h('table', { class: 'data ' + (cls || '') },
    h('thead', {}, h('tr', {}, head.map((c) => (c instanceof Node ? c : h('th', { scope: 'col', class: c[1] || '', text: c[0] }))))),
    h('tbody', {}, rows));
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

/* Courbe miniature (sans axe) : la forme d'une évolution, d'un coup d'œil.
   `values` : nombres dans l'ordre du temps. */
function spark(values, { w = 84, height = 24, label = '' } = {}) {
  if (!values || values.length < 2) return h('span', { class: 'spark none', title: 'Historique en cours de constitution' });
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const X = (i) => 3 + (i / (values.length - 1)) * (w - 6);
  const Y = (v) => 3 + (1 - (v - lo) / span) * (height - 6);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  const last = values[values.length - 1];
  const root = svg('svg', { class: 'spark', viewBox: `0 0 ${w} ${height}`, width: w, height, role: 'img',
    'aria-label': label || `De ${fmt(values[0], 1)} à ${fmt(last, 1)}` });
  root.append(svg('path', { d }), svg('circle', { cx: X(values.length - 1), cy: Y(last), r: 2.6 }));
  return root;
}
/* Tendance d'un modèle : son indice sur 30 jours (à défaut, son Elo en texte ou en code). */
function trendValues(m) {
  if (m.trend && m.trend.length > 1) return { values: m.trend.map((p) => p[1]), what: 'Indice' };
  const hist = m.hist && (m.hist.text || m.hist.code);
  if (hist && hist.length > 1) return { values: hist.map((p) => p[1]), what: 'Elo' };
  return null;
}
function trendSpark(m, opts) {
  const t = trendValues(m);
  if (!t) return spark(null);
  const first = t.values[0];
  const last = t.values[t.values.length - 1];
  const el = spark(t.values, { ...opts, label: `${t.what} sur 30 jours : de ${fmt(first, 1)} à ${fmt(last, 1)}` });
  el.append(svg('title', { text: `${t.what} sur 30 jours : de ${fmt(first, 1)} à ${fmt(last, 1)}` }));
  return el;
}

/* Qualité (indice) en fonction du prix (échelle log) ; la frontière
   qualité/prix en couleur, le reste en gris. */
function drawScatter(box, width, models, highlight) {
  const pts = models.filter((m) => m.index != null && m.price && m.price.blended > 0);
  if (pts.length < 3) {
    box.append(h('p', { class: 'empty', text: 'Pas assez de modèles avec un prix pour tracer le graphique.' }));
    return;
  }
  const W = Math.max(280, width);
  const H = W < 560 ? 300 : 380;
  const M = { l: 40, r: 18, t: 22, b: 46 };
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
    text: 'Prix mixte par million de jetons, échelle logarithmique' }));
  grid.append(svg('text', { x: M.l - 30, y: 12, class: 'axis-label', text: 'Indice marketbuss' }));
  root.append(grid);
  const frontier = pts.filter((m) => m.pareto).sort((a, b) => a.price.blended - b.price.blended);
  if (frontier.length > 1) {
    root.append(svg('polyline', { class: 'frontier',
      points: frontier.map((m) => `${X(m.price.blended).toFixed(1)},${Y(m.index).toFixed(1)}`).join(' ') }));
  }
  const isHi = (m) => highlight && m.id === highlight.id;
  const dots = svg('g', {});
  const order = pts.slice().sort((a, b) => (a.pareto ? 1 : 0) + (isHi(a) ? 2 : 0) - (b.pareto ? 1 : 0) - (isHi(b) ? 2 : 0));
  for (const m of order) {
    dots.append(svg('circle', { cx: X(m.price.blended), cy: Y(m.index), r: isHi(m) ? 7 : m.pareto ? 5 : 4,
      class: isHi(m) ? 'dot here' : m.pareto ? 'dot accent' : 'dot' }));
  }
  root.append(dots);
  // Étiquettes : la frontière (et le modèle de la fiche), sans chevauchement.
  const boxes = [];
  const labels = svg('g', { class: 'labels' });
  const labelled = [...(highlight && pts.includes(highlight) ? [highlight] : []),
    ...frontier.filter((m) => !isHi(m)).sort((a, b) => b.index - a.index)];
  for (const m of labelled) {
    const w = m.name.length * 6.6;
    let x = X(m.price.blended) + 10;
    let anchor = 'start';
    if (x + w > W - M.r) { x = X(m.price.blended) - 10; anchor = 'end'; }
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
        tipRow(fmt(m.index, 1), `indice, n° ${m.rank}`),
        tipRow(fmtPrice(m.price.blended), 'prix mixte par M de jetons'),
        m.pareto ? h('div', { class: 'tip-note', text: 'Sur la frontière qualité/prix' }) : null);
    };
    hits.append(svg('circle', { cx, cy, r: 12, class: 'hit', tabindex: 0, role: 'link',
      'aria-label': `${m.name} : indice ${fmt(m.index, 1)}, ${fmtPrice(m.price.blended)} par million de jetons`,
      onpointermove: show, onpointerleave: hideTip, onfocus: () => show(null), onblur: hideTip,
      onclick: () => { location.hash = modelHref(m); },
      onkeydown: (e) => { if (e.key === 'Enter') location.hash = modelHref(m); } }));
  }
  root.append(hits);
  box.append(root,
    h('div', { class: 'legend' },
      highlight && pts.includes(highlight) ? h('span', {}, h('i', { class: 'key here' }), highlight.name) : null,
      h('span', {}, h('i', { class: 'key accent' }), 'Frontière qualité/prix : aucun modèle n\'est à la fois meilleur et moins cher'),
      h('span', {}, h('i', { class: 'key' }), 'Autres modèles classés')));
}

/* Une ou plusieurs courbes dans le temps. `series` : [{ name, cls, points:
   [[jour, valeur, rang]] }]. Une seule série : courbe + aire ; plusieurs :
   une couleur par série, légende au-dessus, valeurs dans l'infobulle. */
function drawLines(box, width, series, { unit = '', height = 190, digits = 0, rankLabel = '', multi = false } = {}) {
  series.forEach((s, i) => { s.cls ||= 's' + (i + 1); });
  const usable = series.filter((s) => s.points && s.points.length > 1);
  if (!usable.length) {
    box.append(h('p', { class: 'empty', text: 'Historique en cours de constitution.' }));
    return;
  }
  const single = !multi && usable.length === 1;
  const W = Math.max(260, width);
  const H = height;
  const M = { l: 44, r: single ? 54 : 16, t: 12, b: 28 };
  const days = [...new Set(usable.flatMap((s) => s.points.map((p) => p[0])))].sort();
  const T = (d) => Date.parse(d + 'T00:00:00Z');
  const t0 = T(days[0]);
  const t1 = T(days[days.length - 1]);
  const all = usable.flatMap((s) => s.points.map((p) => p[1]));
  let v0 = Math.min(...all);
  let v1 = Math.max(...all);
  const pad = Math.max(digits ? 1 : 4, (v1 - v0) * 0.2);
  const round = digits ? 1 : 5;
  v0 = Math.floor((v0 - pad) / round) * round;
  v1 = Math.ceil((v1 + pad) / round) * round;
  if (unit === 'indice') v1 = Math.min(100, v1);
  const X = (t) => M.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - M.l - M.r);
  const Y = (v) => M.t + (1 - (v - v0) / (v1 - v0)) * (H - M.t - M.b);
  const first = usable[0].points;
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img',
    'aria-label': single ? `${usable[0].name} sur 30 jours, de ${fmt(first[0][1], digits)} à ${fmt(first[first.length - 1][1], digits)}`
      : `Évolution sur 30 jours : ${usable.map((s) => s.name).join(', ')}` });
  const grid = svg('g', { class: 'grid' });
  const raw = (v1 - v0) / 3;
  const step = digits ? Math.max(1, Math.ceil(raw)) : Math.max(5, Math.ceil(raw / 5) * 5);
  for (let v = v0; v <= v1 + 1e-9; v += step) {
    grid.append(svg('line', { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v) }));
    grid.append(svg('text', { x: M.l - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick', text: fmt(v) }));
  }
  grid.append(svg('text', { x: M.l, y: H - 8, class: 'tick', text: fmtDay(days[0]) }));
  grid.append(svg('text', { x: W - M.r, y: H - 8, 'text-anchor': 'end', class: 'tick', text: fmtDay(days[days.length - 1]) }));
  root.append(grid);
  usable.forEach((s, i) => {
    const cls = s.cls || 's' + (i + 1);
    const d = s.points.map((p, j) => `${j ? 'L' : 'M'}${X(T(p[0])).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
    const end = s.points[s.points.length - 1];
    if (single) {
      root.append(svg('path', { class: 'area ' + cls,
        d: `${d}L${X(T(end[0])).toFixed(1)},${Y(v0)}L${X(T(s.points[0][0])).toFixed(1)},${Y(v0)}Z` }));
    }
    root.append(svg('path', { class: 'line ' + cls, d }));
    root.append(svg('circle', { class: 'dot ' + cls, cx: X(T(end[0])), cy: Y(end[1]), r: 4 }));
    if (single) root.append(svg('text', { class: 'label', x: X(T(end[0])) + 9, y: Y(end[1]) + 4, text: fmt(end[1], digits) }));
  });
  const cross = svg('line', { class: 'cross', y1: M.t, y2: H - M.b, visibility: 'hidden' });
  root.append(cross);
  const marks = usable.map((s, i) => {
    const c = svg('circle', { class: 'dot ' + (s.cls || 's' + (i + 1)), r: 4, visibility: 'hidden' });
    root.append(c);
    return c;
  });
  const overlay = svg('rect', { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b, class: 'overlay' });
  const move = (ev) => {
    const r = root.getBoundingClientRect();
    const x = ev.clientX - r.left;
    let best = days[0];
    for (const d of days) if (Math.abs(X(T(d)) - x) < Math.abs(X(T(best)) - x)) best = d;
    cross.setAttribute('x1', X(T(best)));
    cross.setAttribute('x2', X(T(best)));
    cross.setAttribute('visibility', 'visible');
    const rows = [];
    let top = r.top + M.t;
    usable.forEach((s, i) => {
      const p = s.points.find((q) => q[0] === best);
      marks[i].setAttribute('visibility', p ? 'visible' : 'hidden');
      if (!p) return;
      marks[i].setAttribute('cx', X(T(p[0])));
      marks[i].setAttribute('cy', Y(p[1]));
      if (i === 0 || single) top = r.top + Y(p[1]);
      rows.push(tipRow(fmt(p[1], digits), single ? unit || s.name : s.name, single ? null : (s.cls || 's' + (i + 1))));
      if (single && p[2]) rows.push(tipRow('n° ' + p[2], rankLabel || 'au classement'));
    });
    showTip(ev.clientX, top, h('div', { class: 'tip-title', text: fmtDay(best) }), rows);
  };
  overlay.addEventListener('pointermove', move);
  overlay.addEventListener('pointerleave', () => {
    hideTip();
    cross.setAttribute('visibility', 'hidden');
    marks.forEach((c) => c.setAttribute('visibility', 'hidden'));
  });
  root.append(overlay);
  if (!single) {
    box.append(h('div', { class: 'legend' }, series.map((s) => h('span', {},
      h('i', { class: 'line-key ' + s.cls }), usable.includes(s) ? s.name : `${s.name} : historique trop court pour une courbe`))));
  }
  box.append(root);
}

/* Tableau des valeurs d'une courbe (repli sous le graphique). */
function valuesTable(points, valueLabel, digits = 0) {
  return h('details', { class: 'values' }, h('summary', {}, 'Voir les valeurs'),
    h('table', { class: 'mini' }, h('thead', {}, h('tr', {}, h('th', {}, 'Jour'), h('th', { class: 'num' }, valueLabel), h('th', { class: 'num' }, 'Rang'))),
      h('tbody', {}, points.slice().reverse().map((p) => h('tr', {}, h('td', { text: fmtDay(p[0]) }),
        h('td', { class: 'num', text: fmt(p[1], digits) }), h('td', { class: 'num', text: p[2] ? 'n° ' + p[2] : '—' }))))));
}

/* ---------- En-tête : navigation, bandeau, thème, recherche ---------- */

function renderNav(path) {
  const group = { modele: 'classement', editeur: 'editeurs' }[path] || path;
  for (const a of document.querySelectorAll('[data-nav]')) {
    const on = a.dataset.nav === group;
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
    if (m.isNew) items.push({ m, tag: 'Nouveau', kind: 'new' });
    else if (m.rank7 && m.rank7 - m.rank >= 2) items.push({ m, tag: `+${m.rank7 - m.rank} places`, kind: 'up' });
    else if (m.rank7 && m.rank - m.rank7 >= 2) items.push({ m, tag: `−${m.rank - m.rank7} places`, kind: 'down' });
  }
  for (const e of snap.events.filter((x) => x.type === 'price').slice(0, 4)) {
    const m = byId.get(e.model);
    if (!m) continue;
    const pct = Math.round(((e.to - e.from) / e.from) * 100);
    items.push({ m, tag: `Prix ${pct > 0 ? '+' : '−'}${Math.abs(pct)} %`, kind: pct < 0 ? 'up' : 'down' });
  }
  const make = (hidden) => h('div', { class: 'ticker-run', 'aria-hidden': hidden ? 'true' : null },
    items.map(({ m, tag, kind }) => h('a', { class: 'tick-item', href: modelHref(m), tabindex: hidden ? '-1' : null },
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

/* Recherche : un modèle ou un éditeur, depuis n'importe quelle page. */
function openSearch() {
  const dlg = document.getElementById('search');
  if (!snap || !dlg || dlg.open) return;
  const close = () => { if (dlg.open) dlg.close(); };
  dlg.replaceChildren(h('div', { class: 'search-panel' },
    h('div', { class: 'search-head' }, h('h2', { text: 'Chercher un modèle ou un éditeur' }),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Fermer', onclick: close }, icon('close'))),
    picker((id) => { close(); location.hash = id.startsWith('@') ? vendorHref(id.slice(1)) : '#/modele/' + encodeURIComponent(id); },
      [], { placeholder: 'Claude, GPT, Gemini, Anthropic…', vendorsToo: true, inline: true })));
  dlg.showModal();
  const input = dlg.querySelector('input');
  if (input) input.focus();
}

/* ---------- Vues ---------- */

let currentPath = null;
function render({ keepScroll = false } = {}) {
  if (!snap) return;
  hideTip();
  charts = [];
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, arg] = raw.split('/');
  const param = arg ? decodeURIComponent(arg) : '';
  const view = document.getElementById('view');
  const y = scrollY;
  let node;
  switch (path) {
    case 'classement': node = viewRanking(param || 'general'); break;
    case 'modele': node = viewModel(param); break;
    case 'editeurs': node = viewVendors(); break;
    case 'editeur': node = viewVendor(param); break;
    case 'comparer': node = viewCompare(param); break;
    case 'calculateur': node = viewCalc(); break;
    case 'choisir': node = viewWizard(param); break;
    case 'nouveautes': node = viewNews(); break;
    case 'methode': node = viewMethod(); break;
    default: node = viewHome();
  }
  view.replaceChildren(node);
  renderNav(path || '');
  renderTicker();
  requestAnimationFrame(drawCharts);
  const title = { classement: 'Classements', modele: (byId.get(param) || {}).name, editeurs: 'Éditeurs',
    editeur: vendors.has(param) ? param : 'Éditeur', comparer: 'Comparer', calculateur: 'Calculateur de coût',
    choisir: 'Trouver mon IA', nouveautes: 'Nouveautés', methode: 'Méthode et lexique' }[path];
  document.title = (title ? title + ' — ' : '') + 'marketbuss — les meilleures IA du moment';
  if (keepScroll) scrollTo(0, y);
  else if (path !== currentPath || path === 'modele' || path === 'editeur') scrollTo(0, 0);
  currentPath = path;
}

/* Accueil */
let introPlayed = false;
function viewHome() {
  const list = ranked();
  // L'animation d'ouverture du tableau ne joue qu'une fois par visite.
  const frag = h('div', { class: 'home' + (introPlayed ? '' : ' intro') });
  introPlayed = true;

  // Le tableau des cotations : le classement lui-même ouvre la page.
  const board = h('ol', { class: 'board-rows' }, list.slice(0, 5).map((m, i) => h('li', { style: `--i:${i}` },
    h('a', { class: 'board-row', href: modelHref(m) },
      h('span', { class: 'board-rank', text: String(m.rank) }),
      h('span', { class: 'board-name' }, h('b', { text: m.name }),
        h('small', {}, h('span', { text: m.vendor || '' }),
          m.price ? h('span', { text: `${fmtPrice(m.price.input)} lus, ${fmtPrice(m.price.output)} écrits` }) : h('span', { text: 'prix non publié' }))),
      h('span', { class: 'board-trend' }, trendSpark(m, { w: 96, height: 30 })),
      h('span', { class: 'board-index' }, h('b', { text: fmtFixed(m.index, 1) }),
        h('span', { class: 'board-meter', 'aria-hidden': 'true' }, h('span', { style: `width:${m.index}%` }))),
      h('span', { class: 'board-delta' }, delta(m.rank, m.rank7, '7 jours', m.isNew))))));
  frag.append(h('section', { class: 'board' }, h('div', { class: 'wrap board-grid' },
    h('div', { class: 'board-intro' },
      h('h1', { text: 'Les meilleures IA du moment, classées en continu.' }),
      h('p', { class: 'lead', text: 'marketbuss croise les votes à l\'aveugle de millions d\'utilisateurs (Arena AI), '
        + 'les prix publics des fournisseurs et les nouvelles sorties. Le classement se recalcule tout seul, toutes les 3 heures.' }),
      h('div', { class: 'actions' },
        h('a', { class: 'btn primary', href: '#/classement' }, 'Voir tout le classement'),
        h('a', { class: 'btn onboard', href: '#/choisir' }, 'Trouver l\'IA qu\'il me faut')),
      h('p', { class: 'board-fresh' }, icon('clock', 'ic sm'),
        `Dernière collecte ${relTime(snap.generatedAt)}. Prochaine ${nextRunText()}.`)),
    h('div', { class: 'board-table' },
      h('div', { class: 'board-head' }, h('span', { text: 'Classement général' }),
        h('span', { text: 'Indice sur 100, tendance sur 30 jours, variation sur 7 jours' })),
      board,
      h('a', { class: 'board-more', href: '#/classement' }, `Les ${fmt(snap.stats.ranked)} modèles classés`)))));

  const body = h('div', { class: 'wrap' });
  frag.append(body);

  const open = snap.models.filter((m) => m.license === 'open').length;
  body.append(figures(
    figure('Modèles suivis', fmt(snap.stats.models), `chez ${snap.stats.vendors} éditeurs`, '#/editeurs'),
    figure('Classés au général', fmt(snap.stats.ranked), `${snap.stats.priced} avec un prix public`, '#/classement'),
    figure('Arènes', fmt(snap.categories.length), `${fmtBig(market.votes)} de votes comptés`),
    figure('Nouveaux en 14 jours', fmt(snap.stats.fresh), 'entrés dans les classements', '#/nouveautes'),
    figure('Prix médian', market.medianPrice != null ? fmtPrice(market.medianPrice) : '—', 'par million de jetons, modèles classés', '#/calculateur'),
    figure('Poids ouverts', fmt(open), 'modèles à héberger soi-même')));

  body.append(h('nav', { class: 'use-links', 'aria-label': 'Trouver une IA par usage' },
    h('span', { class: 'use-label', text: 'Je veux' }),
    USES.filter(([id]) => catById.has(id)).map(([id, label]) => h('a', { class: 'chip', href: '#/choisir/' + id, text: label.toLowerCase() }))));

  const since = sinceVisit();
  if (since) body.append(since);

  // La suite du classement + ce qui bouge.
  const gainers = list.filter((m) => m.rank7 > 0 && m.rank7 - m.rank > 0).sort((a, b) => (b.rank7 - b.rank) - (a.rank7 - a.rank)).slice(0, 4);
  const losers = list.filter((m) => m.rank7 > 0 && m.rank - m.rank7 > 0).sort((a, b) => (b.rank - b.rank7) - (a.rank - a.rank7)).slice(0, 4);
  const fresh = list.filter((m) => m.isNew).slice(0, 4);
  const moverList = (title, items, empty) => h('div', { class: 'movers-col' }, h('h3', { text: title }),
    items.length ? h('ul', { class: 'movers' }, items.map((m) => h('li', {},
      delta(m.rank, m.rank7, '7 jours', m.isNew),
      h('a', { href: modelHref(m), text: m.name }),
      h('span', { class: 'mv-rank', text: m.rank7 ? `${ordinal(m.rank7)} puis ${ordinal(m.rank)}` : `directement ${ordinal(m.rank)}` }))))
      : h('p', { class: 'empty small', text: empty }));
  body.append(h('div', { class: 'split' },
    section('La suite du classement', 'Du 6e au 15e. L\'indice résume la qualité mesurée en texte, code, vision et documents.',
      h('ol', { class: 'top-list', start: 6 }, list.slice(5, 15).map((m) => h('li', {},
        h('span', { class: 'pos', text: String(m.rank) }),
        delta(m.rank, m.rank7),
        h('div', { class: 'tl-name' }, modelLink(m)),
        h('span', { class: 'idx' }, bar(m.index), h('b', { text: fmtFixed(m.index, 1) })),
        h('span', { class: 'price', text: m.price ? fmtPrice(m.price.blended) : 'prix ?', title: 'Prix mixte par million de jetons' }),
        favButton(m)))),
      h('p', { class: 'more' }, h('a', { href: '#/classement' }, `Voir les ${fmt(snap.stats.ranked)} modèles classés`))),
    section('Ça bouge cette semaine', 'Places gagnées et perdues au classement général en 7 jours.',
      h('div', { class: 'movers-box' },
        moverList('En hausse', gainers, 'Aucune hausse cette semaine.'),
        moverList('En baisse', losers, 'Aucune baisse cette semaine.'),
        fresh.length ? h('div', { class: 'movers-col' }, h('h3', { text: 'Nouveaux venus' }),
          h('ul', { class: 'movers' }, fresh.map((m) => h('li', {},
            h('span', { class: 'delta new', text: ordinal(m.rank) }),
            h('a', { href: modelHref(m), text: m.name }),
            h('span', { class: 'mv-rank', text: m.firstSeen ? `depuis le ${fmtDay(m.firstSeen)}` : 'depuis peu' }))))) : null))));

  // Les meilleurs par usage
  body.append(section('Le n° 1 de chaque usage', 'Une arène par usage. À côté du premier : son avance sur le deuxième.',
    h('div', { class: 'cat-grid' }, snap.categories.map((c) => {
      const lead = leaderOf(c.id);
      if (!lead) return null;
      const second = c.second ? byId.get(c.second) : (market.byCat.get(c.id) || [])[1];
      const cell = lead.cats[c.id];
      const gap = second ? cell.score - second.cats[c.id].score : null;
      return h('a', { class: 'cat-card', href: '#/classement/' + c.id },
        h('span', { class: 'cat-label', text: c.label }),
        h('span', { class: 'cat-desc', text: c.desc }),
        h('span', { class: 'cat-lead', text: lead.name }),
        h('span', { class: 'cat-vendor', text: lead.vendor || '' }),
        h('span', { class: 'cat-facts' },
          h('span', { text: isAgent(c.id) ? `${fmt(cell.score, 2)} d'amélioration nette` : `Elo ${fmt(cell.score)}` }),
          second ? h('span', { text: `${fmt(gap, isAgent(c.id) ? 2 : 0)} d'avance sur ${second.name}` }) : null,
          h('span', { text: `${fmt(c.count)} modèles, ${fmtBig(c.votes ?? cell.votes)} ${isAgent(c.id) ? 'sessions' : 'votes'}` })));
    }))));

  // Selon ton budget
  const tiers = new Set();
  const pick = (label, sub, pool, tier = false) => {
    const m = pool.slice().sort((a, b) => b.index - a.index)[0];
    // Une tranche de prix dont le gagnant est déjà celui de la tranche au-dessus n'apprend rien.
    if (!m || (tier && tiers.has(m.id))) return null;
    if (tier) tiers.add(m.id);
    return h('a', { class: 'pick-row', href: modelHref(m) },
      h('span', { class: 'pick-label' }, h('b', { text: label }), h('small', { text: sub })),
      h('span', { class: 'pick-model' }, h('b', { text: m.name }), h('small', { text: m.vendor || '' })),
      h('span', { class: 'pick-num' }, h('b', { text: fmtFixed(m.index, 1) }), h('small', { text: `n° ${m.rank}` })),
      h('span', { class: 'pick-num' }, h('b', { text: m.price ? fmtPrice(m.price.blended) : '—' }), h('small', { text: m.price ? 'par M de jetons' : 'prix non publié' })));
  };
  const under = (max) => market.priced.filter((m) => m.price.blended <= max);
  const picks = [
    pick('Sans limite de prix', 'le meilleur, tout court', list, true),
    pick('Jusqu\'à 10 $', 'par million de jetons', under(10), true),
    pick('Jusqu\'à 5 $', 'par million de jetons', under(5), true),
    pick('Jusqu\'à 3 $', 'par million de jetons', under(3), true),
    pick('Jusqu\'à 1 $', 'par million de jetons', under(1), true),
    pick('Jusqu\'à 0,30 $', 'par million de jetons', under(0.3), true),
    pick('Poids ouverts', 'à héberger soi-même', list.filter((m) => m.license === 'open')),
    pick('Version gratuite', 'disponible sur OpenRouter', list.filter((m) => m.or && m.or.free)),
  ].filter(Boolean);
  body.append(sectionWith('Le meilleur selon ton budget', 'Le modèle le mieux classé dans chaque tranche de prix.',
    h('a', { class: 'btn ghost sm', href: '#/calculateur' }, 'Calculer mon coût'),
    h('div', { class: 'picks' }, picks)));

  // Qualité / prix
  const frontier = market.priced.filter((m) => m.pareto).sort((a, b) => b.index - a.index);
  body.append(section('Qualité ou prix : qui en donne le plus ?',
    'Chaque point est un modèle classé. En haut à gauche : les meilleurs pour leur prix.',
    h('div', { class: 'split wide-left' },
      h('div', { class: 'panel' }, chartBox('chart-scatter', (box, w) => drawScatter(box, w, list))),
      h('div', { class: 'panel' }, h('h3', { text: 'Les meilleurs rapports qualité/prix' }),
        h('p', { class: 'fineprint', text: 'Pour faire mieux que l\'un d\'eux, il faut payer plus cher.' }),
        h('ul', { class: 'mini-list' }, frontier.map((m) => h('li', {}, modelLink(m),
          h('span', { class: 'mini-figs' }, h('b', { text: fmtFixed(m.index, 1) }), h('span', { text: fmtPrice(m.price.blended) })))))))));

  // Les éditeurs
  const vs = [...vendors.values()].filter((v) => v.top20).sort((a, b) => b.top20 - a.top20 || a.best.rank - b.best.rank).slice(0, 8);
  const maxTop = Math.max(1, ...vs.map((v) => v.top20));
  body.append(sectionWith('Quels éditeurs dominent ?', 'Nombre de modèles de chaque éditeur dans les 20 premiers du classement général.',
    h('a', { class: 'btn ghost sm', href: '#/editeurs' }, 'Tous les éditeurs'),
    h('ul', { class: 'vbars' }, vs.map((v) => h('li', {},
      h('a', { class: 'vb-name', href: vendorHref(v.name), text: v.name }),
      h('span', { class: 'vb-track', 'aria-hidden': 'true' }, h('span', { style: `width:${(v.top20 / maxTop) * 100}%` })),
      h('b', { class: 'vb-val', text: String(v.top20) }),
      h('span', { class: 'vb-note', text: [`meilleur : ${v.best.name}, n° ${v.best.rank}`,
        v.leads.length ? `n° 1 en ${v.leads.map(catLabel).join(', ')}` : null].filter(Boolean).join(' ; ') }))))));

  // Mouvements
  const evs = snap.events.slice(0, 8);
  if (evs.length) {
    body.append(sectionWith('Les derniers mouvements', 'Nouveaux n° 1, entrées dans les classements, prix, sorties.',
      h('a', { class: 'btn ghost sm', href: '#/nouveautes' }, 'Toutes les nouveautés'),
      h('ul', { class: 'events' }, evs.map(eventRow))));
  }
  return frag;
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
    count('entry') ? `${plural(count('entry'), 'entrée')} dans les classements` : null,
    count('price') ? `${plural(count('price'), 'changement')} de prix` : null,
    count('release') ? plural(count('release'), 'sortie') : null,
  ].filter(Boolean);
  const favHits = evs.filter((e) => favs.has(e.model)).length;
  return h('a', { class: 'since', href: '#/nouveautes' },
    icon('spark'),
    h('span', {}, h('b', { text: `Depuis ta dernière visite (${relTime(lastVisit.at)}) : ` }), parts.join(', ') + '.',
      favHits ? ` Dont ${favHits} sur tes favoris.` : ''),
    h('span', { class: 'since-go', text: 'Voir le détail' }));
}

/* Événements (accueil, nouveautés, fiche) */
function eventText(e) {
  const m = byId.get(e.model);
  const name = m ? m.name : e.name || e.model || '';
  const cat = catLabel(e.cat);
  if (e.type === 'leader') {
    const prev = byId.get(e.previous);
    return [h('b', { text: name }), ` prend la tête de l'arène ${cat}`, prev ? `, devant ${prev.name}` : '', '.'];
  }
  if (e.type === 'entry') return [h('b', { text: name }), ` entre dans l'arène ${cat}, directement n° ${e.rank}.`];
  if (e.type === 'price') {
    const pct = Math.round(((e.to - e.from) / e.from) * 100);
    return [h('b', { text: name }), ` : prix ${pct < 0 ? 'en baisse' : 'en hausse'} de ${Math.abs(pct)} %, de ${fmtPrice(e.from)} à ${fmtPrice(e.to)} par M de jetons.`];
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
  const orId = typeof e.orId === 'string' && /^[\w.:-]+\/[\w.:-]+$/.test(e.orId) ? e.orId : null;
  return h('li', { class: 'event' + (m && favs.has(m.id) ? ' fav-ev' : '') },
    m ? h('a', { href: modelHref(m) }, inner)
      : orId ? h('a', { href: 'https://openrouter.ai/' + orId, target: '_blank', rel: 'noopener' }, inner) : h('div', {}, inner));
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
      ? 'L\'indice marketbuss résume, sur 100, la qualité mesurée dans les arènes Texte, Code, Vision et Documents.'
      : `${cat.desc}. ${isAgent(catId) ? 'Amélioration nette mesurée' : 'Score Elo'} dans l'arène ${cat.label} d'Arena AI.` })));

  frag.append(h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Arènes' },
    [['general', 'Général'], ...snap.categories.map((c) => [c.id, c.label])].map(([id, label]) =>
      h('a', { role: 'tab', class: 'tab' + ((isGeneral ? 'general' : catId) === id ? ' on' : ''),
        'aria-selected': (isGeneral ? 'general' : catId) === id ? 'true' : 'false',
        href: '#/classement/' + id }, label))));

  const base = isGeneral ? ranked() : market.byCat.get(catId) || [];
  const isMedia = cat && cat.group === 'media';

  // Le résumé de l'arène.
  if (isGeneral) {
    const top = base[0];
    const second = base[1];
    frag.append(figures(
      top ? figure('N° 1', top.name, `indice ${fmtFixed(top.index, 1)}, ${top.vendor || ''}`, modelHref(top)) : null,
      top && second ? figure('Avance sur le 2e', fmtFixed(top.index - second.index, 1) + ' pt', second.name, modelHref(second)) : null,
      figure('Modèles classés', fmt(base.length), `sur ${fmt(snap.stats.models)} suivis`),
      figure('Prix médian', market.medianPrice != null ? fmtPrice(market.medianPrice) : '—',
        market.prices.length ? `de ${fmtPrice(market.prices[0])} à ${fmtPrice(market.prices[market.prices.length - 1])}` : ''),
      figure('Sur la frontière qualité/prix', fmt(base.filter((m) => m.pareto).length), 'modèles imbattables pour leur prix')));
  } else {
    const top = base[0];
    const second = base[1];
    const gap = top && second ? top.cats[catId].score - second.cats[catId].score : null;
    const tied = top ? base.filter((m) => m !== top && withinMargin(m.cats[catId], top.cats[catId])).length : 0;
    frag.append(figures(
      top ? figure('N° 1', top.name, `${metricName(catId)} ${scoreText(catId, top.cats[catId].score)}`, modelHref(top)) : null,
      gap != null ? figure('Avance sur le 2e', fmt(gap, isAgent(catId) ? 2 : 0) + (isAgent(catId) ? '' : ' pts'), second.name, modelHref(second)) : null,
      figure('Dans la marge d\'erreur du n° 1', fmt(tied), tied ? 'à égalité statistique avec lui' : 'le n° 1 est nettement devant'),
      figure('Modèles classés', fmt(base.length), `${fmtBig(cat.votes ?? base.reduce((s, m) => s + (m.cats[catId].votes || 0), 0))} ${isAgent(catId) ? 'sessions' : 'votes'}`),
      figure('Mise à jour de l\'arène', cat.updated ? fmtArenaDate(cat.updated) : '—', 'par Arena AI')));
  }

  const vendorList = [...new Set(base.map((m) => m.vendor).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  if (st.vendor && !vendorList.includes(st.vendor)) st.vendor = '';

  const results = h('div', { class: 'results' });
  const count = h('span', { class: 'count' });
  const draw = () => {
    const rows = filterRows(base, catId, isGeneral);
    count.textContent = `${plural(rows.length, 'modèle')}${rows.length < base.length ? ' sur ' + base.length : ''}`;
    results.replaceChildren(rows.length ? rankingTable(rows, catId, isGeneral, isMedia, draw)
      : h('p', { class: 'empty', text: 'Aucun modèle ne correspond à ces filtres. Retire un filtre pour élargir.' }));
  };

  const search = h('input', { class: 'input', type: 'search', placeholder: 'Rechercher un modèle ou un éditeur',
    'aria-label': 'Rechercher', value: st.q, oninput: (e) => { st.q = e.target.value; draw(); } });
  const vendorSel = h('select', { class: 'input select', 'aria-label': 'Éditeur',
    onchange: (e) => { st.vendor = e.target.value; draw(); } },
  h('option', { value: '' }, 'Tous les éditeurs'), vendorList.map((v) => h('option', { value: v, selected: v === st.vendor ? 'selected' : null }, v)));
  const lic = () => seg('Licence', [['all', 'Toutes'], ['open', 'Ouvertes'], ['proprietary', 'Fermées']], st.license, (v) => {
    st.license = v;
    licBox.replaceChildren(lic());
    draw();
  });
  const licBox = h('div', {}, lic());
  const cols = () => seg('Colonnes', [['short', 'Essentiel'], ['full', 'Tout le détail']], st.cols, (v) => {
    st.cols = v;
    store.set('mb-cols', v);
    colBox.replaceChildren(cols());
    draw();
  });
  const colBox = h('div', { class: 'cols-toggle' }, cols());
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
      !isMedia ? [chip('vision', 'Vision'), chip('reasoning', 'Raisonnement'), chip('tools', 'Outils'), chip('pdf', 'PDF'),
        chip('web', 'Recherche web'), chip('free', 'Version gratuite'), isGeneral ? chip('pareto', 'Bon rapport qualité/prix') : null] : null),
    h('div', { class: 'filters-end' }, count, colBox,
      h('button', { class: 'btn ghost sm', type: 'button', onclick: () => exportCsv(filterRows(base, catId, isGeneral), catId, isGeneral, isMedia) },
        icon('download'), 'Exporter en CSV'))));
  frag.append(results);
  draw();
  frag.append(h('div', { class: 'notes' },
    isGeneral ? h('p', {}, 'Seuls les modèles présents dans les arènes Texte ou Code ont un indice. Les autres sont dans leur arène, par les onglets ci-dessus. ')
      : h('p', {}, 'La petite barre sous chaque score est son intervalle de confiance : deux modèles dont les barres se chevauchent sont à égalité statistique. '
        + '« Face au n° 1 » donne, sur 100, les chances de l\'emporter contre le premier de l\'arène. '),
    h('p', {}, h('a', { href: '#/methode', text: 'Comment ces chiffres sont calculés' }), '.')));
  return frag;
}

// « Sep 30, 2026 » (Arena AI) → « 30 sept. ». Texte inconnu : rendu tel quel.
function fmtArenaDate(s) {
  const t = Date.parse(s + ' UTC');
  return Number.isFinite(t) ? dateFmt.format(new Date(t)) : String(s);
}
/* Deux scores sont à égalité statistique quand leurs intervalles se chevauchent. */
const withinMargin = (cell, top) => cell.score + (cell.ci || 0) >= top.score - (top.ci || 0);

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
      if (c === 'free') { if (!(m.or && m.or.free)) return false; }
      else if (c === 'pareto') { if (!m.pareto) return false; }
      else if (!(m.caps && m.caps[c])) return false;
    }
    return true;
  });
  const cell = (m) => (isGeneral ? null : m.cats[catId]);
  const rankIn = (m, c) => (m.cats[c] ? -m.cats[c].rank : -1e9);
  const val = (m) => {
    switch (st.sort) {
      case 'name': return m.name;
      case 'index': return m.index ?? -1;
      case 'text': case 'code': case 'vision': case 'document': return rankIn(m, st.sort);
      case 'general': return m.rank ? -m.rank : -1e9;
      case 'price': return m.price ? -m.price.blended : -1e9;
      case 'cache': return m.price && m.price.cacheRead != null ? -m.price.cacheRead : -1e9;
      case 'context': return m.context || 0;
      case 'output': return m.maxOutput || 0;
      case 'votes': return (cell(m) || {}).votes || 0;
      case 'ci': return cell(m) && cell(m).ci != null ? -cell(m).ci : -1e9;
      case 'arenas': return Object.keys(m.cats).length;
      case 'trend': {
        const t = trendValues(m);
        return t ? t.values[t.values.length - 1] - t.values[0] : -1e9;
      }
      case 'delta': case 'delta30': {
        const r = isGeneral ? m : cell(m);
        const before = st.sort === 'delta30' ? r && r.rank30 : r && r.rank7;
        return before ? before - r.rank : before === 0 ? 1e6 : -1e9;
      }
      default: return isGeneral ? -m.rank : -cell(m).rank;
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

/* Score d'une arène avec son intervalle de confiance, dessiné sur l'étendue de l'arène. */
function scoreCell(catId, cell, cat) {
  const lo = (cat.floor ?? cell.score) - (isAgent(catId) ? 1 : 15);
  const hi = (cat.top ?? cell.score) + (isAgent(catId) ? 1 : 15);
  const pos = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo || 1)) * 100));
  const ci = cell.ci || 0;
  return h('div', { class: 'score-cell' },
    h('b', { text: scoreText(catId, cell.score) }),
    h('span', { class: 'range', 'aria-hidden': 'true' },
      h('span', { class: 'range-ci', style: `left:${pos(cell.score - ci).toFixed(1)}%;width:${Math.max(1.5, pos(cell.score + ci) - pos(cell.score - ci)).toFixed(1)}%` }),
      h('span', { class: 'range-dot', style: `left:${pos(cell.score).toFixed(1)}%` })));
}

function rankingTable(rows, catId, isGeneral, isMedia, redraw) {
  const st = ui.rank;
  const full = st.cols === 'full';
  const cat = isGeneral ? null : catById.get(catId);
  const topCell = isGeneral ? null : (market.byCat.get(catId)[0] || {}).cats[catId];
  const sortable = (key, label, cls = '', title = '') => h('th', { class: cls, scope: 'col', title: title || null,
    'aria-sort': st.sort === key ? (st.dir > 0 ? 'descending' : 'ascending') : null },
  h('button', { type: 'button', class: 'th-btn' + (st.sort === key ? ' on' : ''),
    onclick: () => {
      if (st.sort === key) st.dir = -st.dir; else { st.sort = key; st.dir = 1; }
      redraw();
    } }, label, st.sort === key ? icon(st.dir > 0 ? 'down' : 'up', 'tri') : null));
  const plain = (label, cls = '', title = '') => h('th', { scope: 'col', class: cls, title: title || null }, label);
  const favHead = h('th', { scope: 'col' }, h('span', { class: 'sr' }, 'Favori'));
  const rankOf = (m, c) => (m.cats[c] ? 'n° ' + m.cats[c].rank : '—');
  const license = (m) => (m.license === 'open' ? 'ouverte' : m.license ? 'fermée' : '—');

  let cols;
  let line;
  if (isGeneral) {
    cols = [sortable(null, 'Rang', 'num'), sortable('delta', '7 j', 'num', 'Places gagnées ou perdues en 7 jours'), sortable('name', 'Modèle'),
      sortable('index', 'Indice', '', 'Indice marketbuss, sur 100'), sortable('trend', '30 j', '', 'Évolution de l\'indice sur 30 jours'),
      sortable('text', 'Texte', 'num'), sortable('code', 'Code', 'num'),
      full ? [sortable('vision', 'Vision', 'num'), sortable('document', 'Documents', 'num')] : null,
      sortable('price', 'Prix lu / écrit', 'num', 'Dollars par million de jetons lus, puis écrits'),
      full ? [sortable('price', 'Prix mixte', 'num', '3 jetons lus pour 1 écrit'), sortable('cache', 'Lu en cache', 'num')] : null,
      sortable('context', 'Contexte', 'num', 'Nombre de jetons lus à la fois'),
      full ? [sortable('output', 'Sortie max', 'num'), plain('Licence'), sortable('arenas', 'Arènes', 'num')] : null,
      favHead];
    line = (m) => h('tr', {},
      h('td', { class: 'num pos', text: String(m.rank) }),
      h('td', { class: 'num' }, delta(m.rank, m.rank7)),
      h('td', {}, h('div', { class: 'model-cell' }, modelLink(m), badges(m))),
      h('td', { class: 'idx-cell' }, h('span', { class: 'idx' }, bar(m.index), h('b', { text: fmtFixed(m.index, 1) }))),
      h('td', { class: 'spark-cell' }, trendSpark(m)),
      h('td', { class: 'num', text: rankOf(m, 'text') }),
      h('td', { class: 'num', text: rankOf(m, 'code') }),
      full ? [h('td', { class: 'num', text: rankOf(m, 'vision') }), h('td', { class: 'num', text: rankOf(m, 'document') })] : null,
      h('td', { class: 'num', text: m.price ? `${fmtPrice(m.price.input)} / ${fmtPrice(m.price.output)}` : '—' }),
      full ? [h('td', { class: 'num', text: m.price ? fmtPrice(m.price.blended) : '—' }),
        h('td', { class: 'num', text: m.price && m.price.cacheRead != null ? fmtPrice(m.price.cacheRead) : '—' })] : null,
      h('td', { class: 'num', text: fmtCtx(m.context) }),
      full ? [h('td', { class: 'num', text: fmtCtx(m.maxOutput) }), h('td', { text: license(m) }),
        h('td', { class: 'num', text: String(Object.keys(m.cats).length) })] : null,
      h('td', { class: 'fav-cell' }, favButton(m)));
  } else {
    const unit = isAgent(catId) ? 'Amélioration' : 'Elo';
    cols = [sortable(null, 'Rang', 'num'), sortable('delta', '7 j', 'num', 'Places gagnées ou perdues en 7 jours'),
      full ? sortable('delta30', '30 j', 'num', 'Places gagnées ou perdues en 30 jours') : null,
      sortable('name', 'Modèle'),
      plain(unit, '', 'Score et intervalle de confiance'), sortable('ci', 'Marge', 'num', 'Intervalle de confiance : plus ou moins'),
      plain('Écart au n° 1', 'num'), plain('Face au n° 1', 'num', 'Chances de l\'emporter contre le n° 1, sur 100'),
      sortable('votes', isAgent(catId) ? 'Sessions' : 'Votes', 'num'),
      full ? plain('Réglage', '', 'Le réglage du modèle qui obtient ce score') : null,
      !isMedia ? sortable('price', 'Prix mixte', 'num', 'Dollars par million de jetons, 3 lus pour 1 écrit') : null,
      full && !isMedia ? sortable('context', 'Contexte', 'num') : null,
      full ? plain('Licence') : null,
      full && !isMedia ? sortable('general', 'Général', 'num', 'Rang au classement général') : null,
      favHead];
    line = (m) => {
      const c = m.cats[catId];
      const gap = topCell ? topCell.score - c.score : null;
      const tie = topCell && c.rank > 1 && withinMargin(c, topCell);
      return h('tr', {},
        h('td', { class: 'num pos', text: String(c.rank) }),
        h('td', { class: 'num' }, delta(c.rank, c.rank7)),
        full ? h('td', { class: 'num' }, delta(c.rank, c.rank30, '30 jours')) : null,
        h('td', {}, h('div', { class: 'model-cell' }, modelLink(m, !full && c.variant ? 'réglage ' + c.variant : ''), badges(m))),
        h('td', {}, scoreCell(catId, c, cat)),
        h('td', { class: 'num muted', text: c.ci != null ? '± ' + fmt(c.ci, isAgent(catId) ? 2 : 0) : '—' }),
        h('td', { class: 'num' + (tie ? ' tie' : ''), title: tie ? 'Dans la marge d\'erreur du n° 1 : égalité statistique' : null },
          c.rank === 1 ? '—' : '−' + fmt(gap, isAgent(catId) ? 2 : 0), tie ? h('span', { class: 'tie-mark', text: 'égalité' }) : null),
        h('td', { class: 'num', text: c.points != null ? fmt(c.points, 0) + ' %' : '—' }),
        h('td', { class: 'num', text: fmt(c.votes) }),
        full ? h('td', { class: 'muted', text: c.variant || '—' }) : null,
        !isMedia ? h('td', { class: 'num', text: m.price ? fmtPrice(m.price.blended) : '—' }) : null,
        full && !isMedia ? h('td', { class: 'num', text: fmtCtx(m.context) }) : null,
        full ? h('td', { text: license(m) }) : null,
        full && !isMedia ? h('td', { class: 'num', text: m.rank ? 'n° ' + m.rank : '—' }) : null,
        h('td', { class: 'fav-cell' }, favButton(m)));
    };
  }
  const table = h('table', { class: 'rank-table' + (full ? ' full' : '') }, h('thead', {}, h('tr', {}, cols)),
    h('tbody', {}, rows.map(line)));
  // Sur téléphone : des cartes plutôt qu'un tableau.
  const cards = h('ol', { class: 'rank-cards' }, rows.map((m) => {
    const c = isGeneral ? null : m.cats[catId];
    const rank = isGeneral ? m.rank : c.rank;
    const facts = isGeneral
      ? [m.cats.text ? `Texte n° ${m.cats.text.rank}` : null, m.cats.code ? `Code n° ${m.cats.code.rank}` : null,
        m.price ? `${fmtPrice(m.price.blended)} par M` : null, m.context ? `contexte ${fmtCtx(m.context)}` : null]
      : [c.ci != null ? `marge ± ${fmt(c.ci, isAgent(catId) ? 2 : 0)}` : null,
        c.points != null ? `${fmt(c.points, 0)} % face au n° 1` : null,
        `${fmtBig(c.votes)} ${isAgent(catId) ? 'sessions' : 'votes'}`,
        c.variant ? 'réglage ' + c.variant : null,
        !isMedia && m.price ? `${fmtPrice(m.price.blended)} par M` : null];
    return h('li', { class: 'rank-card' },
      h('span', { class: 'pos', text: String(rank) }),
      h('div', { class: 'rc-main' },
        h('div', { class: 'rc-top' }, modelLink(m), favButton(m)),
        h('div', { class: 'rc-facts' }, facts.filter(Boolean).map((f) => h('span', { text: f }))),
        badges(m)),
      h('div', { class: 'rc-score' },
        h('b', { text: isGeneral ? fmtFixed(m.index, 1) : scoreText(catId, c.score) }),
        h('small', { text: isGeneral ? 'indice' : isAgent(catId) ? 'amélior.' : 'Elo' }),
        delta(rank, isGeneral ? m.rank7 : c.rank7)));
  }));
  return h('div', {}, h('div', { class: 'table-wrap' }, table), cards);
}

function exportCsv(rows, catId, isGeneral, isMedia) {
  const num = (n, d = 2) => (n == null ? '' : String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ','));
  const head = isGeneral
    ? ['rang', 'rang_il_y_a_7_jours', 'modele', 'editeur', 'licence', 'indice', 'rang_texte', 'rang_code', 'rang_vision', 'rang_documents',
      'prix_entree_usd_M', 'prix_sortie_usd_M', 'prix_cache_usd_M', 'prix_mixte_usd_M', 'contexte', 'sortie_max', 'frontiere_qualite_prix']
    : ['rang', 'rang_il_y_a_7_jours', 'rang_il_y_a_30_jours', 'modele', 'editeur', 'licence', 'reglage', isAgent(catId) ? 'amelioration_nette' : 'elo',
      'marge', 'face_au_n1_pct', 'votes', ...(isMedia ? [] : ['prix_mixte_usd_M', 'contexte', 'rang_general'])];
  const lines = rows.map((m) => {
    if (isGeneral) {
      return [m.rank, m.rank7 || '', m.name, m.vendor, m.license, num(m.index, 1), m.cats.text?.rank, m.cats.code?.rank, m.cats.vision?.rank,
        m.cats.document?.rank, num(m.price?.input, 4), num(m.price?.output, 4), num(m.price?.cacheRead, 4), num(m.price?.blended, 4),
        m.context, m.maxOutput, m.pareto ? 'oui' : 'non'];
    }
    const c = m.cats[catId];
    return [c.rank, c.rank7 || '', c.rank30 || '', m.name, m.vendor, m.license, c.variant, num(c.score, 2), num(c.ci, 2), num(c.points, 1), c.votes,
      ...(isMedia ? [] : [num(m.price?.blended, 4), m.context, m.rank])];
  });
  const cell = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s)) s = '\'' + s; // jamais de formule dans un tableur
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = '﻿' + [head, ...lines].map((r) => r.map(cell).join(';')).join('\r\n');
  const a = h('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
    download: `marketbuss-${isGeneral ? 'general' : catId}-${snap.generatedAt.slice(0, 10)}.csv` });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast(`${plural(rows.length, 'ligne')} exportée${rows.length > 1 ? 's' : ''}.`, 'success');
}

/* Cellule d'un tableau qui se replie en fiche sur téléphone (voir table.stack). */
const cell = (label, props, ...kids) => h('td', { 'data-label': label, ...(props || {}) },
  kids.flat(Infinity).filter((k) => k != null && k !== false).length > 1 ? h('span', { class: 'cv' }, ...kids) : kids);

/* Coût en dollars d'un usage (millions de jetons lus et écrits, part lue en cache). */
function usageCost(m, inputM, outputM, cachePct = 0, batch = false) {
  if (!m.price) return null;
  const p = batch && m.price.batch ? { ...m.price, ...m.price.batch } : m.price;
  const cached = (inputM * cachePct) / 100;
  const cacheRate = batch && m.price.batch ? p.input : (m.price.cacheRead ?? p.input);
  const parts = { read: (inputM - cached) * p.input, cache: cached * cacheRate, write: outputM * p.output };
  return { ...parts, total: parts.read + parts.cache + parts.write };
}

const CAPS = [
  ['vision', 'Comprend les images', 'Photos, schémas, captures d\'écran'],
  ['pdf', 'Lit les PDF', 'Sans conversion préalable'],
  ['audio', 'Écoute l\'audio', 'Voix, enregistrements'],
  ['video', 'Regarde des vidéos', 'En entrée'],
  ['reasoning', 'Raisonnement', 'Réfléchit avant de répondre'],
  ['tools', 'Appels d\'outils', 'Peut déclencher des fonctions'],
  ['web', 'Recherche web', 'Proposée par le fournisseur'],
  ['schema', 'Réponses structurées', 'Suit un format JSON imposé'],
  ['cache', 'Cache des jetons lus', 'Relire un même texte coûte moins'],
  ['computer', 'Pilote un ordinateur', 'Clique et tape à ta place'],
];

/* Un modèle absent des catalogues n'a aucune capacité connue : on ne l'affiche pas comme « non ». */
const capsKnown = (m) => !!(m.price || m.context || Object.values(m.caps || {}).some(Boolean));

/* Le portrait du modèle en quelques phrases, écrit à partir des chiffres du jour. */
function modelSummary(m) {
  const out = [];
  const cells = Object.entries(m.cats).sort((a, b) => a[1].rank - b[1].rank || (b[1].points || 0) - (a[1].points || 0));
  if (m.rank) {
    out.push(`${m.name} est ${m.rank === 1 ? 'en tête' : ordinal(m.rank)} du classement général sur ${snap.stats.ranked} modèles, `
      + `avec un indice de ${fmtFixed(m.index, 1)} sur 100${m.provisional ? ' (provisoire : il n\'est pas encore noté dans toutes les arènes)' : ''}.`);
  } else if (m.group === 'media') {
    out.push(`${m.name} crée ou retouche des images ou des vidéos : il n'a pas d'indice général, seulement des places dans ses arènes.`);
  } else {
    out.push(`${m.name} n'est noté ni en texte ni en code : il n'a pas d'indice général, seulement des places dans ses arènes.`);
  }
  if (cells.length) {
    const [bestId, best] = cells[0];
    const [worstId, worst] = cells[cells.length - 1];
    out.push(`Son meilleur terrain est l'arène ${catLabel(bestId)}, où il est ${best.rank === 1 ? 'n° 1' : ordinal(best.rank)} sur ${catById.get(bestId).count}`
      + (cells.length > 1 && worst.rank > best.rank ? ` ; il est moins à l'aise en ${catLabel(worstId)} (${ordinal(worst.rank)}).` : '.'));
  }
  if (m.price && m.price.blended != null && market.medianPrice) {
    const ratio = m.price.blended / market.medianPrice;
    const versus = ratio >= 1.15 ? `${fmt(ratio, 1)} fois le prix médian des modèles classés`
      : ratio <= 0.87 ? `${fmt(1 / ratio, 1)} fois moins que le prix médian des modèles classés` : 'à peu près le prix médian des modèles classés';
    out.push(`Il coûte ${fmtPrice(m.price.blended)} par million de jetons, soit ${versus}`
      + (m.pareto ? ', et aucun modèle n\'est à la fois meilleur et moins cher.' : '.'));
  } else if (m.group === 'llm') {
    out.push('Son prix n\'est pas publié dans les catalogues suivis.');
  }
  if (m.rank && m.rank7 > 0 && m.rank7 !== m.rank) {
    const d = m.rank7 - m.rank;
    out.push(`En 7 jours, il a ${d > 0 ? 'gagné' : 'perdu'} ${plural(Math.abs(d), 'place')}.`);
  } else if (m.firstSeen) {
    out.push(`Il est entré dans les classements le ${fmtDate(m.firstSeen)}.`);
  }
  return out.join(' ');
}

/* Fiche d'un modèle */
function viewModel(id) {
  const m = byId.get(id);
  const frag = h('div', { class: 'wrap' });
  if (!m) {
    frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Modèle introuvable' }),
      h('p', { class: 'sub', text: 'Il n\'est plus dans les classements suivis, ou le lien est incomplet.' }),
      h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '#/classement' }, 'Voir le classement'),
        h('button', { class: 'btn', type: 'button', onclick: openSearch }, icon('search'), 'Chercher un modèle'))));
    return frag;
  }
  const inCompare = ui.compare.includes(m.id);
  const cmpIds = [...new Set([...ui.compare.filter((x) => x !== m.id), m.id])].slice(-MAX_COMPARE);
  frag.append(h('nav', { class: 'crumbs', 'aria-label': 'Fil d\'Ariane' },
    h('a', { href: '#/classement', text: 'Classements' }), h('span', { text: '/' }),
    m.vendor ? [h('a', { href: vendorHref(m.vendor), text: m.vendor }), h('span', { text: '/' })] : null,
    h('span', { text: m.name })));
  frag.append(h('div', { class: 'model-head' },
    h('div', {},
      h('h1', { text: m.name }),
      h('p', { class: 'model-id' },
        m.vendor ? h('a', { href: vendorHref(m.vendor), text: m.vendor }) : h('span', { text: 'Éditeur inconnu' }),
        m.license ? h('span', { text: m.license === 'open' ? 'poids ouverts' : 'modèle fermé' }) : null,
        m.firstSeen ? h('span', { text: `dans les arènes depuis le ${fmtDay(m.firstSeen)}` }) : null),
      badges(m)),
    h('div', { class: 'actions' },
      favButton(m),
      h('a', { class: 'btn', href: '#/comparer/' + cmpIds.map(encodeURIComponent).join(','),
        onclick: () => { if (!inCompare) ui.compare = cmpIds; } }, icon('scale'), 'Comparer'),
      m.or && /^[\w.:-]+\/[\w.:-]+$/.test(m.or.id) ? h('a', { class: 'btn ghost', href: 'https://openrouter.ai/' + m.or.id, target: '_blank', rel: 'noopener' },
        'Essayer sur OpenRouter', icon('external')) : null)));

  if (m.retire) {
    const gone = m.retire <= new Date().toISOString().slice(0, 10);
    frag.append(h('p', { class: 'notice warn' }, icon('info'),
      gone ? `Son fournisseur a annoncé son retrait pour le ${fmtDate(m.retire)} : il n'est peut-être plus disponible.`
        : `Son fournisseur a annoncé son retrait pour le ${fmtDate(m.retire)}.`));
  }
  frag.append(h('p', { class: 'summary', text: modelSummary(m) }));

  const votes = Object.values(m.cats).reduce((s, c) => s + (c.votes || 0), 0);
  const cheaper = m.price ? market.priced.filter((x) => x.price.blended < m.price.blended).length : 0;
  frag.append(figures(
    m.index != null ? figure('Indice marketbuss', fmtFixed(m.index, 1), `n° ${m.rank} sur ${snap.stats.ranked}${m.provisional ? ', provisoire' : ''}`)
      : figure('Indice marketbuss', '—', m.group === 'media' ? 'modèle d\'images ou de vidéo' : 'absent des arènes Texte et Code'),
    m.rank ? figure('Devant', Math.round(((snap.stats.ranked - m.rank) / Math.max(1, snap.stats.ranked - 1)) * 100) + ' %', 'des autres modèles classés') : null,
    figure('Prix mixte', m.price ? fmtPrice(m.price.blended) : '—', m.price
      ? (m.rank ? `${ordinal(cheaper + 1)} moins cher sur ${market.priced.length}` : 'par million de jetons') : 'pas de prix public trouvé'),
    figure('Contexte', fmtCtx(m.context), m.context ? `environ ${fmt(pagesOf(m.context))} pages lues d'un coup` : 'taille non publiée'),
    figure('Sortie maximale', fmtCtx(m.maxOutput), m.maxOutput ? `environ ${fmt(pagesOf(m.maxOutput))} pages écrites` : 'non publiée'),
    figure('Votes reçus', fmtBig(votes), `dans ${plural(Object.keys(m.cats).length, 'arène')}`)));

  // Résultats par arène
  const catRows = snap.categories.filter((c) => m.cats[c.id]);
  frag.append(section('Ses résultats, arène par arène',
    'La barre donne ses chances de l\'emporter face au n° 1 de l\'arène : 100 pour le n° 1 lui-même.',
    h('div', { class: 'table-wrap' }, h('table', { class: 'data stack arena-table' },
      h('thead', {}, h('tr', {}, ['Arène', 'Face au n° 1', 'Rang', 'Score', 'Écart au n° 1', 'Votes', '7 j', '30 j', 'Meilleur réglage']
        .map((t, i) => h('th', { scope: 'col', class: i >= 2 && i <= 7 ? 'num' : '', text: t })))),
      h('tbody', {}, catRows.map((c) => {
        const x = m.cats[c.id];
        const top = (market.byCat.get(c.id)[0] || m).cats[c.id];
        const tie = x.rank > 1 && withinMargin(x, top);
        return h('tr', {},
          h('th', { scope: 'row' }, h('a', { href: '#/classement/' + c.id, text: c.label }), h('small', { text: c.desc })),
          cell('Face au n° 1', { class: 'meter-cell' }, h('span', { class: 'idx' }, bar(x.points), h('b', { text: fmt(x.points, 0) + ' %' }))),
          cell('Rang', { class: 'num' }, h('b', { text: 'n° ' + x.rank }), h('small', { text: ' sur ' + c.count })),
          cell('Score', { class: 'num' }, h('span', { text: `${scoreText(c.id, x.score)}` }),
            x.ci != null ? h('small', { text: ` ± ${fmt(x.ci, isAgent(c.id) ? 2 : 0)}` }) : null),
          cell('Écart au n° 1', { class: 'num' + (tie ? ' tie' : '') },
            x.rank === 1 ? 'en tête' : '−' + fmt(top.score - x.score, isAgent(c.id) ? 2 : 0), tie ? h('span', { class: 'tie-mark', text: 'égalité' }) : null),
          cell('Votes', { class: 'num', text: fmt(x.votes) }),
          cell('7 jours', { class: 'num' }, delta(x.rank, x.rank7)),
          cell('30 jours', { class: 'num' }, delta(x.rank, x.rank30, '30 jours')),
          cell('Meilleur réglage', { class: 'muted', text: x.variant || 'standard' }));
      })))),
    m.variants && m.variants.length ? h('p', { class: 'fineprint', text: `Réglages vus dans les arènes : ${m.variants.join(', ')}. Seul le meilleur compte.` }) : null));

  // Évolution
  const hist = Object.entries(m.hist || {}).filter(([, pts]) => pts.length > 1);
  const hasTrend = m.trend && m.trend.length > 1;
  if (hasTrend || hist.length) {
    frag.append(section('Son évolution sur 30 jours', hasTrend
      ? 'L\'indice se mesure par rapport au n° 1 de chaque arène : il peut baisser sans que le modèle change, quand un meilleur arrive.'
      : 'Score Elo, jour par jour, dans les arènes suivies de près.',
    hasTrend ? h('div', { class: 'panel' }, h('h3', { text: 'Indice marketbuss et rang général' }),
      chartBox('chart-line', (box, w) => drawLines(box, w, [{ name: 'Indice', cls: 's1', points: m.trend }],
        { unit: 'indice', digits: 1, height: 220, rankLabel: 'au classement général' })),
      valuesTable(m.trend, 'Indice', 1)) : null,
    hist.length ? h('div', { class: 'multiples' }, hist.map(([c, pts]) => h('div', { class: 'panel' },
      h('h3', { text: 'Elo, arène ' + catLabel(c) }),
      chartBox('chart-line', (box, w) => drawLines(box, w, [{ name: 'Elo ' + catLabel(c), cls: 's1', points: pts }],
        { unit: 'Elo ' + catLabel(c), rankLabel: 'dans l\'arène' })),
      valuesTable(pts, 'Elo')))) : null));
  }

  // Face à face
  const duelCats = catRows.filter((c) => !isAgent(c.id) && (market.byCat.get(c.id) || []).length > 1);
  if (duelCats.length) {
    const box = h('div', {});
    const drawDuel = () => {
      const pickId = duelCats.some((c) => c.id === ui.duel[m.id]) ? ui.duel[m.id]
        : duelCats.slice().sort((a, b) => m.cats[a.id].rank - m.cats[b.id].rank)[0].id;
      const mine = m.cats[pickId];
      const rivals = (market.byCat.get(pickId) || []).filter((x) => x.id !== m.id).slice(0, 6);
      box.replaceChildren(
        duelCats.length > 1 ? seg('Arène', duelCats.map((c) => [c.id, c.label]), pickId, (v) => { ui.duel[m.id] = v; drawDuel(); }) : null,
        h('ul', { class: 'duels' }, rivals.map((x) => {
          const p = Math.round(winProb(mine.score, x.cats[pickId].score) * 100);
          return h('li', {},
            h('a', { class: 'duel-name', href: modelHref(x) }, h('b', { text: x.name }), h('small', { text: `n° ${x.cats[pickId].rank}, Elo ${fmt(x.cats[pickId].score)}` })),
            h('span', { class: 'duel-track', 'aria-hidden': 'true' }, h('span', { class: 'duel-fill', style: `width:${p}%` }), h('i', {})),
            h('span', { class: 'duel-val' }, h('b', { text: p + ' %' }), h('small', { text: p > 50 ? 'favori' : p < 50 ? 'outsider' : 'à égalité' })));
        })),
        h('p', { class: 'fineprint', text: `Sur 100 duels à l'aveugle dans l'arène ${catLabel(pickId)}, combien ${m.name} en gagnerait, d'après l'écart de score Elo. Le trait marque 50 %.` }));
    };
    drawDuel();
    frag.append(section('En face à face', 'Ses chances contre les meilleurs de l\'arène.', h('div', { class: 'panel' }, box)));
  }

  // Prix
  if (m.price) {
    const p = m.price;
    const uses = [
      ['Résumer un livre de 300 pages', '120 000 jetons lus, 1 000 écrits', usageCost(m, 0.12, 0.001)],
      ['Répondre à 1 000 questions courtes', '200 000 jetons lus, 400 000 écrits', usageCost(m, 0.2, 0.4)],
      ['Une journée d\'assistant de code', '3 M de jetons lus dont 70 % en cache, 200 000 écrits', usageCost(m, 3, 0.2, 70)],
      ['Un mois de chatbot sur un site', '2 M de jetons lus dont 30 % en cache, 500 000 écrits', usageCost(m, 2, 0.5, 30)],
    ];
    const provider = p.provider && p.provider !== 'openrouter' ? providerName(p.provider) : null;
    frag.append(section('Ses prix', `Prix ${p.source === 'litellm' ? 'catalogue' : 'relevé sur OpenRouter'}`
      + (provider ? ` de ${provider}` : '') + ', en dollars par million de jetons, hors taxes.' + (p.stale ? ' Prix du passage précédent : la base des prix était injoignable.' : ''),
    h('div', { class: 'two-col' },
      h('div', { class: 'panel' }, h('h3', { text: 'Le tarif' }), h('dl', { class: 'facts' },
        fact('Jetons lus (entrée)', fmtPrice(p.input)),
        fact('Jetons écrits (sortie)', fmtPrice(p.output), p.input ? `${fmt(p.output / p.input, 1)} fois le prix de lecture` : null),
        p.cacheRead != null ? fact('Jetons relus depuis le cache', fmtPrice(p.cacheRead), p.input ? `${Math.round((1 - p.cacheRead / p.input) * 100)} % de moins qu'une lecture normale` : null) : null,
        p.cacheWrite != null ? fact('Mise en cache', fmtPrice(p.cacheWrite)) : null,
        p.batch ? fact('Tarif différé (batch)', `${fmtPrice(p.batch.input)} lus, ${fmtPrice(p.batch.output)} écrits`, 'réponse sous 24 h') : null,
        p.tier ? fact(`Au-delà de ${fmtCtx(p.tier.above)} jetons lus`, `${fmtPrice(p.tier.input)} lus${p.tier.output != null ? ', ' + fmtPrice(p.tier.output) + ' écrits' : ''}`, 'tarif majoré pour les très longs textes') : null,
        fact('Prix mixte', fmtPrice(p.blended), '3 jetons lus pour 1 écrit')),
      p.url ? h('p', { class: 'fineprint' }, h('a', { href: p.url, target: '_blank', rel: 'noopener' }, 'Page des prix du fournisseur', icon('external', 'ic sm'))) : null),
      h('div', { class: 'panel' }, h('h3', { text: 'Ce que ça coûte en pratique' }),
        h('ul', { class: 'uses' }, uses.map(([label, detail, c]) => h('li', {},
          h('span', {}, h('b', { text: label }), h('small', { text: detail })), h('b', { class: 'use-cost', text: fmtCost(c.total) })))),
        h('p', { class: 'fineprint' }, 'Ordres de grandeur. Pour ton propre usage : ', h('a', { href: '#/calculateur', text: 'le calculateur' }), '.'))),
    m.index != null && p.blended > 0 ? h('div', { class: 'panel' }, h('h3', { text: 'Sa place sur la carte qualité/prix' }),
      chartBox('chart-scatter', (box, w) => drawScatter(box, w, ranked(), m))) : null));
  } else if (m.group === 'llm') {
    frag.append(section('Ses prix', null, h('p', { class: 'empty', text: 'Aucun prix public trouvé pour ce modèle dans les catalogues suivis.' })));
  }

  // Capacités
  if (m.group === 'llm') {
    frag.append(!capsKnown(m) ? section('Ce qu\'il sait faire', null,
      h('p', { class: 'empty', text: 'Ce modèle n\'est pas encore dans les catalogues des fournisseurs : ses capacités ne sont pas connues.' }))
      : section('Ce qu\'il sait faire', 'D\'après les catalogues des fournisseurs. Une croix veut dire « non », ou « pas indiqué ».',
      h('ul', { class: 'caps' }, CAPS.map(([k, label, sub]) => {
        const yes = !!(m.caps && m.caps[k]);
        return h('li', { class: yes ? 'yes' : 'no' }, icon(yes ? 'check' : 'close'),
          h('span', {}, h('b', { text: label }), h('small', { text: sub })),
          h('span', { class: 'sr', text: yes ? ' : oui' : ' : non ou inconnu' }));
      }))));
  }

  // Autour de lui
  const siblings = m.vendor && vendors.has(m.vendor) ? vendors.get(m.vendor).models.filter((x) => x.id !== m.id)
    .sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9)).slice(0, 5) : [];
  const cheaperAlt = m.index != null && m.price ? ranked().filter((x) => x.id !== m.id && x.price && x.price.blended < m.price.blended
    && x.index >= m.index - 6).sort((a, b) => b.index - a.index).slice(0, 4) : [];
  const better = m.rank ? ranked().filter((x) => x.rank < m.rank).slice(-3).reverse() : [];
  const behind = m.rank ? ranked().filter((x) => x.rank > m.rank).slice(0, 3) : [];
  if (siblings.length || cheaperAlt.length || better.length || behind.length) {
    frag.append(section('Autour de lui', null, h('div', { class: 'three-col' },
      cheaperAlt.length ? h('div', { class: 'panel' }, h('h3', { text: 'Presque aussi bons, moins chers' }), miniList(cheaperAlt, m)) : null,
      better.length || behind.length ? h('div', { class: 'panel' }, h('h3', { text: 'Ses voisins au classement' }), miniList([...better.slice().reverse(), ...behind], m)) : null,
      siblings.length ? h('div', { class: 'panel' }, h('h3', {}, 'Chez ', h('a', { href: vendorHref(m.vendor), text: m.vendor })), miniList(siblings, m)) : null)));
  }

  // Son actualité
  const news = snap.events.filter((e) => e.model === m.id || e.previous === m.id);
  if (news.length) frag.append(section('Son actualité', 'Ses mouvements des 30 derniers jours.', h('ul', { class: 'events' }, news.map(eventRow))));
  return frag;
}

function miniList(list, self) {
  return h('ul', { class: 'mini-list' }, list.map((x) => h('li', {}, modelLink(x),
    h('span', { class: 'mini-figs' },
      h('b', { text: x.index != null ? fmtFixed(x.index, 1) : bestPlace(x) }),
      h('span', { text: x.price ? fmtPrice(x.price.blended) + ' par M' : x.rank ? 'n° ' + x.rank : '' })),
    self && x.id !== self.id ? h('a', { class: 'mini-cmp', href: '#/comparer/' + [self.id, x.id].map(encodeURIComponent).join(','),
      'aria-label': `Comparer ${self.name} et ${x.name}`, title: 'Comparer les deux' }, icon('scale', 'ic sm')) : null)));
}
/* Meilleure place d'un modèle sans indice : « n° 2 Images ». */
function bestPlace(m) {
  const best = Object.entries(m.cats).sort((a, b) => a[1].rank - b[1].rank)[0];
  return best ? `n° ${best[1].rank} ${catLabel(best[0])}` : '—';
}

/* Éditeurs */
function viewVendors() {
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Les éditeurs' }),
    h('p', { class: 'sub', text: 'Qui fabrique les modèles suivis, lesquels mènent une arène, et à quel prix.' })));
  const all = [...vendors.values()];
  const most = all.slice().sort((a, b) => b.models.length - a.models.length)[0];
  const leaders = all.filter((v) => v.leads.length);
  const topLead = leaders.slice().sort((a, b) => b.leads.length - a.leads.length)[0];
  frag.append(figures(
    figure('Éditeurs suivis', fmt(all.length), `${fmt(all.filter((v) => v.ranked.length).length)} au classement général`),
    most ? figure('Le plus représenté', most.name, plural(most.models.length, 'modèle suivi', 'modèles suivis'), vendorHref(most.name)) : null,
    topLead ? figure('Le plus de premières places', topLead.name, `n° 1 dans ${plural(topLead.leads.length, 'arène')}`, vendorHref(topLead.name)) : null,
    figure('Éditeurs en tête d\'une arène', fmt(leaders.length), `sur ${snap.categories.length} arènes`),
    figure('Avec des poids ouverts', fmt(all.filter((v) => v.open).length), 'au moins un modèle ouvert')));

  const sorts = {
    best: (a, b) => (a.best ? a.best.rank : 1e9) - (b.best ? b.best.rank : 1e9) || (a.bestCell.rank - b.bestCell.rank) || b.models.length - a.models.length,
    count: (a, b) => b.models.length - a.models.length || a.name.localeCompare(b.name),
    podium: (a, b) => b.podiums - a.podiums || b.leads.length - a.leads.length,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  const out = h('div', {});
  const segBox = h('div', {});
  const draw = () => {
    segBox.replaceChildren(seg('Trier par', [['best', 'Meilleur rang'], ['podium', 'Podiums'], ['count', 'Nombre de modèles'], ['name', 'Nom']],
      ui.vendorSort, (v) => { ui.vendorSort = v; draw(); }));
    const rows = all.slice().sort(sorts[ui.vendorSort] || sorts.best);
    out.replaceChildren(h('div', { class: 'table-wrap' }, h('table', { class: 'data stack vendor-table' },
      h('thead', {}, h('tr', {}, ['Éditeur', 'Meilleur modèle', 'Modèles suivis', 'Classés', 'Dans le top 20', 'Podiums', 'En tête de', 'Prix mixte', 'Ouverts']
        .map((t, i) => h('th', { scope: 'col', class: i >= 2 && i <= 5 || i >= 7 ? 'num' : '', text: t })))),
      h('tbody', {}, rows.map((v) => h('tr', {},
        h('th', { scope: 'row' }, h('a', { href: vendorHref(v.name), text: v.name })),
        cell('Meilleur modèle', {}, v.best ? [h('a', { href: modelHref(v.best), text: v.best.name }), h('small', { text: ` n° ${v.best.rank} au général` })]
          : [h('a', { href: modelHref(v.bestCell.model), text: v.bestCell.model.name }), h('small', { text: ` n° ${v.bestCell.rank} ${catLabel(v.bestCell.cat)}` })]),
        cell('Modèles suivis', { class: 'num', text: fmt(v.models.length) }),
        cell('Classés au général', { class: 'num', text: v.ranked.length ? fmt(v.ranked.length) : '—' }),
        cell('Dans le top 20', { class: 'num', text: v.top20 ? fmt(v.top20) : '—' }),
        cell('Podiums', { class: 'num', text: v.podiums ? fmt(v.podiums) : '—', title: 'Places dans les trois premiers, toutes arènes confondues' }),
        cell('En tête de', { class: v.leads.length ? '' : 'muted', text: v.leads.length ? v.leads.map(catLabel).join(', ') : 'aucune arène' }),
        cell('Prix mixte', { class: 'num', text: v.priceMin == null ? '—' : v.priceMin === v.priceMax ? fmtPrice(v.priceMin) : `${fmtPrice(v.priceMin)} à ${fmtPrice(v.priceMax)}` }),
        cell('Poids ouverts', { class: 'num', text: v.open ? fmt(v.open) : '—' })))))));
  };
  frag.append(h('div', { class: 'filters' }, segBox, h('div', { class: 'filters-end' }, h('span', { class: 'count', text: plural(all.length, 'éditeur') }))), out);
  draw();
  frag.append(h('div', { class: 'notes' }, h('p', { text: 'Un podium est une place dans les trois premiers d\'une arène. Le prix mixte compte 3 jetons lus pour 1 écrit, par million de jetons.' })));
  return frag;
}

function viewVendor(name) {
  const v = vendors.get(name);
  const frag = h('div', { class: 'wrap' });
  if (!v) {
    frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Éditeur introuvable' }),
      h('p', { class: 'sub', text: 'Aucun de ses modèles n\'est dans les classements suivis, ou le lien est incomplet.' }),
      h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '#/editeurs' }, 'Voir tous les éditeurs'))));
    return frag;
  }
  frag.append(h('nav', { class: 'crumbs', 'aria-label': 'Fil d\'Ariane' },
    h('a', { href: '#/editeurs', text: 'Éditeurs' }), h('span', { text: '/' }), h('span', { text: v.name })));
  frag.append(h('div', { class: 'page-head tight' }, h('h1', { text: v.name }),
    h('p', { class: 'sub', text: `${plural(v.models.length, 'modèle suivi', 'modèles suivis')}`
      + (v.best ? `. Son meilleur : ${v.best.name}, ${ordinal(v.best.rank)} au classement général.` : `. Son meilleur : ${v.bestCell.model.name}, ${ordinal(v.bestCell.rank)} en ${catLabel(v.bestCell.cat)}.`) })));
  frag.append(figures(
    figure('Modèles suivis', fmt(v.models.length), `${fmt(v.ranked.length)} au classement général`),
    v.best ? figure('Meilleur rang général', 'n° ' + v.best.rank, v.best.name, modelHref(v.best)) : figure('Meilleure place', 'n° ' + v.bestCell.rank, `${v.bestCell.model.name}, ${catLabel(v.bestCell.cat)}`, modelHref(v.bestCell.model)),
    figure('Arènes menées', fmt(v.leads.length), v.leads.length ? v.leads.map(catLabel).join(', ') : 'aucune pour l\'instant'),
    figure('Podiums', fmt(v.podiums), 'places dans les trois premiers'),
    figure('Prix mixte', v.priceMin == null ? '—' : fmtPrice(v.priceMin), v.priceMin == null ? 'pas de prix public' : v.priceMin === v.priceMax ? 'par million de jetons' : `jusqu'à ${fmtPrice(v.priceMax)} par million de jetons`),
    figure('Poids ouverts', fmt(v.open), v.open ? 'à héberger soi-même' : 'tous ses modèles sont fermés')));

  if (v.ranked.length) {
    frag.append(section('Ses modèles au classement général', null,
      h('div', { class: 'table-wrap' }, h('table', { class: 'data stack' },
        h('thead', {}, h('tr', {}, ['Rang', 'Modèle', 'Indice', '7 j', '30 j', 'Texte', 'Code', 'Prix lu / écrit', 'Contexte']
          .map((t, i) => h('th', { scope: 'col', class: i === 1 || i === 2 || i === 4 ? '' : 'num', text: t })))),
        h('tbody', {}, v.ranked.map((m) => h('tr', {},
          cell('Rang général', { class: 'num pos', text: 'n° ' + m.rank }),
          h('th', { scope: 'row' }, h('div', { class: 'model-cell' }, h('a', { href: modelHref(m), text: m.name }), badges(m))),
          cell('Indice', { class: 'meter-cell' }, h('span', { class: 'idx' }, bar(m.index), h('b', { text: fmtFixed(m.index, 1) }))),
          cell('7 jours', { class: 'num' }, delta(m.rank, m.rank7)),
          cell('Tendance', { class: 'spark-cell' }, trendSpark(m)),
          cell('Texte', { class: 'num', text: m.cats.text ? 'n° ' + m.cats.text.rank : '—' }),
          cell('Code', { class: 'num', text: m.cats.code ? 'n° ' + m.cats.code.rank : '—' }),
          cell('Prix lu / écrit', { class: 'num', text: m.price ? `${fmtPrice(m.price.input)} / ${fmtPrice(m.price.output)}` : '—' }),
          cell('Contexte', { class: 'num', text: fmtCtx(m.context) }))))))));
  }

  const perCat = snap.categories.map((c) => {
    const mine = (market.byCat.get(c.id) || []).filter((m) => m.vendor === v.name);
    return mine.length ? { c, mine } : null;
  }).filter(Boolean);
  frag.append(section('Ses places, arène par arène', 'Son meilleur modèle dans chaque arène où il est présent.',
    h('div', { class: 'table-wrap' }, h('table', { class: 'data stack' },
      h('thead', {}, h('tr', {}, ['Arène', 'Son meilleur modèle', 'Rang', 'Score', 'Modèles présents']
        .map((t, i) => h('th', { scope: 'col', class: i >= 2 ? 'num' : '', text: t })))),
      h('tbody', {}, perCat.map(({ c, mine }) => h('tr', {},
        h('th', { scope: 'row' }, h('a', { href: '#/classement/' + c.id, text: c.label })),
        cell('Son meilleur modèle', {}, h('a', { href: modelHref(mine[0]), text: mine[0].name })),
        cell('Rang', { class: 'num' }, h('b', { text: 'n° ' + mine[0].cats[c.id].rank }), h('small', { text: ' sur ' + c.count })),
        cell('Score', { class: 'num', text: scoreText(c.id, mine[0].cats[c.id].score) }),
        cell('Modèles présents', { class: 'num', text: fmt(mine.length) }))))))));

  const others = v.models.filter((m) => !m.rank);
  if (others.length) {
    frag.append(section('Ses autres modèles', 'Hors classement général : modèles d\'images, de vidéo, ou absents des arènes Texte et Code.',
      h('ul', { class: 'chips-list' }, others.map((m) => h('li', {}, h('a', { href: modelHref(m) }, h('b', { text: m.name }), h('small', { text: bestPlace(m) })))))));
  }
  const ids = new Set(v.models.map((m) => m.id));
  const news = snap.events.filter((e) => ids.has(e.model)).slice(0, 12);
  if (news.length) frag.append(section('Son actualité', 'Les mouvements de ses modèles sur 30 jours.', h('ul', { class: 'events' }, news.map(eventRow))));
  return frag;
}

/* Comparateur */
function viewCompare(arg) {
  if (arg) ui.compare = arg.split(',').map((s) => s.trim()).filter((id) => byId.has(id)).slice(0, MAX_COMPARE);
  const ids = ui.compare;
  const models = ids.map((id) => byId.get(id));
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Comparer des modèles' }),
    h('p', { class: 'sub', text: `Jusqu'à ${MAX_COMPARE} modèles côte à côte. Le lien de la page garde ta sélection : tu peux le partager.` })));

  const go = (next) => { location.hash = '#/comparer/' + next.map(encodeURIComponent).join(','); };
  frag.append(h('div', { class: 'picked' },
    models.map((m, i) => h('span', { class: 'pick' }, h('i', { class: 'key rect s' + (i + 1) }), h('span', { text: m.name }),
      h('button', { type: 'button', class: 'pick-x', 'aria-label': 'Retirer ' + m.name, onclick: () => go(ids.filter((x) => x !== m.id)) }, icon('close')))),
    ids.length < MAX_COMPARE ? picker((id) => go([...ids, id]), ids) : null,
    models.length ? h('button', { class: 'btn ghost sm', type: 'button', onclick: async () => {
      try { await navigator.clipboard.writeText(location.href); toast('Lien de la comparaison copié.', 'success'); } catch { toast('Copie impossible : copie l\'adresse de la page à la main.'); }
    } }, icon('link'), 'Copier le lien') : null));

  if (!models.length) {
    const podium = ranked().slice(0, 3).map((m) => m.id);
    const value = market.priced.filter((m) => m.pareto).sort((a, b) => b.index - a.index).slice(0, 3).map((m) => m.id);
    const open = ranked().filter((m) => m.license === 'open').slice(0, 3).map((m) => m.id);
    frag.append(h('div', { class: 'empty-state' },
      h('p', { text: 'Ajoute des modèles avec la recherche ci-dessus, ou pars d\'une sélection toute prête :' }),
      h('div', { class: 'actions' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => go(podium) }, 'Le podium du moment'),
        value.length > 1 ? h('button', { class: 'btn', type: 'button', onclick: () => go(value) }, 'Les meilleurs rapports qualité/prix') : null,
        open.length > 1 ? h('button', { class: 'btn', type: 'button', onclick: () => go(open) }, 'Les meilleurs modèles ouverts') : null)));
    return frag;
  }

  const cats = snap.categories.filter((c) => models.some((m) => m.cats[c.id]));

  // Le verdict, en phrases.
  if (models.length > 1) {
    const says = [];
    const byIndex = models.filter((m) => m.index != null).sort((a, b) => b.index - a.index);
    if (byIndex.length > 1) {
      says.push(`${byIndex[0].name} est le mieux classé (indice ${fmtFixed(byIndex[0].index, 1)}, `
        + `${fmtFixed(byIndex[0].index - byIndex[1].index, 1)} point${byIndex[0].index - byIndex[1].index >= 2 ? 's' : ''} devant ${byIndex[1].name}).`);
    }
    const byPrice = models.filter((m) => m.price && m.price.blended != null).sort((a, b) => a.price.blended - b.price.blended);
    if (byPrice.length > 1 && byPrice[0].price.blended < byPrice[byPrice.length - 1].price.blended) {
      const hi = byPrice[byPrice.length - 1];
      says.push(`${byPrice[0].name} est le moins cher : ${fmtPrice(byPrice[0].price.blended)} par million de jetons, `
        + (byPrice[0].price.blended > 0 ? `${fmt(hi.price.blended / byPrice[0].price.blended, 1)} fois moins que ${hi.name}.` : `contre ${fmtPrice(hi.price.blended)} pour ${hi.name}.`));
    }
    const wins = new Map(models.map((m) => [m.id, []]));
    for (const c of cats) {
      const present = models.filter((m) => m.cats[c.id]).sort((a, b) => a.cats[c.id].rank - b.cats[c.id].rank);
      if (present.length > 1) wins.get(present[0].id).push(c.label);
    }
    for (const m of models) {
      const w = wins.get(m.id);
      if (w.length) says.push(`${m.name} l'emporte en ${w.join(', ')}.`);
    }
    const byCtx = models.filter((m) => m.context).sort((a, b) => b.context - a.context);
    if (byCtx.length > 1 && byCtx[0].context > byCtx[1].context) says.push(`${byCtx[0].name} lit le plus de texte d'un coup (${fmtCtx(byCtx[0].context)} jetons).`);
    if (says.length) frag.append(h('div', { class: 'verdict' }, h('h2', { text: 'En résumé' }), h('ul', {}, says.map((s) => h('li', { text: s })))));
  }

  const best = (vals, low = false) => {
    const ok = vals.filter((v) => v != null);
    if (ok.length < 2 || Math.min(...ok) === Math.max(...ok)) return null;
    return low ? Math.min(...ok) : Math.max(...ok);
  };
  const row = (label, vals, show, { low = false } = {}) => {
    const b = best(vals, low);
    return h('tr', {}, h('th', { scope: 'row', text: label }),
      vals.map((v) => h('td', { class: 'num' + (b != null && v === b ? ' best' : '') },
        b != null && v === b ? icon('check', 'ic sm') : null, show(v))));
  };
  const group = (label) => h('tr', { class: 'group' }, h('th', { scope: 'colgroup', colspan: models.length + 1, text: label }));
  const st = ui.calc;
  const table = h('table', { class: 'cmp-table' },
    h('thead', {}, h('tr', {}, h('td', {}), models.map((m, i) => h('th', { scope: 'col' }, h('i', { class: 'key rect s' + (i + 1) }),
      h('a', { href: modelHref(m), text: m.name }), h('small', { text: m.vendor || '' }))))),
    h('tbody', {},
      group('Classement'),
      row('Indice marketbuss', models.map((m) => m.index ?? null), (v) => (v == null ? '—' : fmtFixed(v, 1))),
      row('Rang général', models.map((m) => m.rank ?? null), (v) => (v ? 'n° ' + v : '—'), { low: true }),
      h('tr', {}, h('th', { scope: 'row', text: 'Variation sur 7 jours' }), models.map((m) => h('td', { class: 'num' }, m.rank ? delta(m.rank, m.rank7) : '—'))),
      group('Score par arène'),
      cats.map((c) => row(`${c.label}, ${isAgent(c.id) ? 'amélioration' : 'Elo'}`,
        models.map((m) => (m.cats[c.id] ? m.cats[c.id].score : null)), (v) => (v == null ? '—' : scoreText(c.id, v)))),
      group('Prix, en dollars par million de jetons'),
      row('Jetons lus', models.map((m) => m.price?.input ?? null), fmtPrice, { low: true }),
      row('Jetons écrits', models.map((m) => m.price?.output ?? null), fmtPrice, { low: true }),
      row('Relus depuis le cache', models.map((m) => m.price?.cacheRead ?? null), fmtPrice, { low: true }),
      row('Prix mixte', models.map((m) => m.price?.blended ?? null), fmtPrice, { low: true }),
      row('Ton usage, par mois', models.map((m) => (usageCost(m, st.input, st.output, st.cache) || {}).total ?? null), fmtCost, { low: true }),
      group('Taille'),
      row('Contexte, en jetons', models.map((m) => m.context ?? null), fmtCtx),
      row('Sortie maximale, en jetons', models.map((m) => m.maxOutput ?? null), fmtCtx),
      h('tr', {}, h('th', { scope: 'row', text: 'Licence' }), models.map((m) => h('td', { class: 'num', text: m.license === 'open' ? 'poids ouverts' : m.license ? 'fermée' : '—' }))),
      models.some((m) => m.group === 'llm') ? [group('Capacités'),
        CAPS.map(([k, label]) => h('tr', {}, h('th', { scope: 'row', text: label }), models.map((m) => {
          if (!capsKnown(m)) return h('td', { class: 'num muted', title: 'Pas encore dans les catalogues' }, '—');
          const yes = !!(m.caps && m.caps[k]);
          return h('td', { class: 'num cap ' + (yes ? 'yes' : 'no') }, icon(yes ? 'check' : 'close', 'ic sm'), h('span', { class: 'sr', text: yes ? 'oui' : 'non ou inconnu' }));
        })))] : null));
  frag.append(h('div', { class: 'table-wrap panel flush' }, table));
  frag.append(h('p', { class: 'fineprint' }, `« Ton usage » reprend les réglages du calculateur : ${fmt(st.input, 1)} M de jetons lus et ${fmt(st.output, 1)} M écrits par mois, ${fmt(st.cache)} % en cache. `,
    h('a', { href: '#/calculateur', text: 'Changer ces réglages' }), '.'));

  // Face à face (deux modèles) : chances de l'emporter, arène par arène.
  if (models.length === 2) {
    const [a, b] = models;
    const shared = cats.filter((c) => !isAgent(c.id) && a.cats[c.id] && b.cats[c.id]);
    if (shared.length) {
      frag.append(section('En face à face', `Sur 100 duels à l'aveugle, combien ${a.name} en gagnerait contre ${b.name}, d'après l'écart de score Elo.`,
        h('div', { class: 'panel' }, h('ul', { class: 'duels versus' }, shared.map((c) => {
          const p = Math.round(winProb(a.cats[c.id].score, b.cats[c.id].score) * 100);
          return h('li', {},
            h('span', { class: 'duel-name' }, h('b', { text: c.label }), h('small', { text: `Elo ${fmt(a.cats[c.id].score)} contre ${fmt(b.cats[c.id].score)}` })),
            h('span', { class: 'duel-track two', 'aria-hidden': 'true' }, h('span', { class: 'duel-fill s1', style: `width:${p}%` }),
              h('span', { class: 'duel-fill s2', style: `width:${100 - p}%` }), h('i', {})),
            h('span', { class: 'duel-val' }, h('b', { text: `${p} % à ${100 - p} %` }), h('small', { text: p === 50 ? 'à égalité' : `avantage ${p > 50 ? a.name : b.name}` })));
        })), h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'key rect s1' }), a.name), h('span', {}, h('i', { class: 'key rect s2' }), b.name)))));
    }
  }

  // Évolution de l'indice : une courbe par modèle.
  const trends = models.filter((m) => m.index != null).map((m) => ({ name: m.name, cls: 's' + (models.indexOf(m) + 1), points: m.trend }));
  if (trends.some((s) => s.points && s.points.length > 1)) {
    frag.append(section('L\'indice sur 30 jours', 'Chaque courbe suit un modèle. Passe sur le graphique pour lire les valeurs d\'un jour.',
      h('div', { class: 'panel' }, chartBox('chart-line', (box, w) => drawLines(box, w, trends, { unit: 'indice', digits: 1, height: 260, multi: true })))));
  }

  // Barres groupées : une couleur par modèle (ordre de sélection), légende au-dessus.
  frag.append(section('Arène par arène', 'Sur 100 : chances de l\'emporter face au n° 1 de l\'arène.',
    h('div', { class: 'panel' },
      h('div', { class: 'legend' }, models.map((m, i) => h('span', {}, h('i', { class: 'key rect s' + (i + 1) }), m.name))),
      h('div', { class: 'gbars' }, cats.map((c) => h('div', { class: 'gb-group' },
        h('span', { class: 'gb-label', text: c.label }),
        h('div', { class: 'gb-bars' }, models.map((m, i) => {
          const x = m.cats[c.id];
          return h('div', { class: 'gb-row', title: `${m.name} : ${x ? fmt(x.points, 1) + ' sur 100, n° ' + x.rank : 'absent de l\'arène'}` },
            h('span', { class: 'gb-track' }, x ? h('span', { class: 'gb-fill s' + (i + 1), style: `width:${Math.max(1.5, x.points)}%` }) : null),
            h('span', { class: 'gb-val', text: x ? fmt(x.points, 0) : '—' }));
        }))))))));
  return frag;
}

/* Champ de recherche avec suggestions (comparateur, recherche générale). */
function picker(onpick, exclude = [], { placeholder = 'Ajouter un modèle…', vendorsToo = false, inline = false } = {}) {
  const list = h('ul', { class: 'picker-list' + (inline ? ' inline' : ''), role: 'listbox', hidden: !inline });
  let active = -1;
  let items = [];
  const input = h('input', { class: 'input', type: 'search', placeholder, 'aria-label': placeholder,
    role: 'combobox', 'aria-expanded': 'false', autocomplete: 'off' });
  const update = () => {
    const q = fold(input.value.trim());
    const models = snap.models.filter((m) => !exclude.includes(m.id) && (!q || fold(m.name + ' ' + (m.vendor || '') + ' ' + m.id).includes(q)))
      .slice(0, inline ? 9 : 8).map((m) => ({ id: m.id, name: m.name,
        sub: [m.vendor, m.rank ? 'n° ' + m.rank + ' au général' : bestPlace(m)].filter(Boolean).join(', ') }));
    const vs = vendorsToo && q ? [...vendors.values()].filter((v) => fold(v.name).includes(q)).slice(0, 3)
      .map((v) => ({ id: '@' + v.name, name: v.name, sub: 'éditeur, ' + plural(v.models.length, 'modèle') })) : [];
    items = [...vs, ...models];
    active = items.length ? 0 : -1;
    list.replaceChildren(...(items.length ? items.map((it, i) => h('li', { role: 'option', class: i === active ? 'on' : '', 'aria-selected': i === active ? 'true' : 'false',
      onpointerdown: (e) => { e.preventDefault(); onpick(it.id); } },
    h('span', { text: it.name }), h('small', { text: it.sub })))
      : [h('li', { class: 'none', text: 'Aucun résultat. Essaie un autre nom.' })]));
    list.hidden = false;
    input.setAttribute('aria-expanded', items.length ? 'true' : 'false');
  };
  input.addEventListener('input', update);
  input.addEventListener('focus', update);
  if (!inline) input.addEventListener('blur', () => setTimeout(() => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }, 120));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      [...list.children].forEach((li, i) => { li.classList.toggle('on', i === active); li.setAttribute('aria-selected', i === active ? 'true' : 'false'); });
      if (list.children[active]) list.children[active].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      onpick(items[active].id);
    } else if (e.key === 'Escape' && !inline) {
      list.hidden = true;
    }
  });
  return h('div', { class: 'picker' + (inline ? ' inline' : '') }, icon('search'), input, list);
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
  const equiv = h('p', { class: 'fineprint' });
  const field = (key, label, unit, step, max) => h('label', { class: 'field' }, h('span', { text: label }),
    h('span', { class: 'field-input' }, h('input', { class: 'input', type: 'number', min: 0, max, step, value: st[key], inputmode: 'decimal',
      oninput: (e) => {
        st[key] = Math.max(0, Math.min(max ?? Infinity, Number(e.target.value) || 0));
        st.preset = null;
        presetBox.replaceChildren(presetSeg());
        draw();
      } }),
    h('span', { class: 'unit', text: unit })));
  const presetSeg = () => seg('Exemples d\'usage', Object.entries(PRESETS).map(([k, p]) => [k, p.label]), st.preset, (k) => {
    Object.assign(st, { input: PRESETS[k].input, output: PRESETS[k].output, cache: PRESETS[k].cache, preset: k });
    render({ keepScroll: true });
  });
  const presetBox = h('div', {}, presetSeg());
  const draw = () => {
    const words = (st.input + st.output) * 1e6 * WORDS_PER_TOKEN;
    equiv.textContent = typo(`${fmt(st.input + st.output, 1)} M de jetons par mois, c'est environ ${fmtCount(words)}${words >= 1e6 ? ' de' : ''} mots, `
      + `soit ${fmtCount(words / WORDS_PER_PAGE)}${words / WORDS_PER_PAGE >= 1e6 ? ' de' : ''} pages.`)
      + typo(` Un jeton vaut à peu près les trois quarts d'un mot en anglais, un peu moins en français.`);
    const pool = (st.rankedOnly ? ranked() : snap.models.filter((m) => m.group === 'llm')).filter((m) => m.price);
    const rows = pool.map((m) => ({ m, c: usageCost(m, st.input, st.output, st.cache, st.batch) }))
      .sort((a, b) => a.c.total - b.c.total);
    if (!rows.length) { out.replaceChildren(h('p', { class: 'empty', text: 'Aucun modèle avec un prix public.' })); return; }
    const max = Math.max(...rows.map((r) => r.c.total));
    const cheapest = rows[0];
    const bestQ = rows.filter((r) => r.m.index != null).sort((a, b) => b.m.index - a.m.index)[0];
    const value = rows.filter((r) => r.m.pareto && r.m.index != null && bestQ && r.m.index >= bestQ.m.index - 8)
      .sort((a, b) => a.c.total - b.c.total)[0];
    const pct = (v) => (max ? (v / max) * 100 : 0);
    out.replaceChildren(
      h('div', { class: 'recos three' },
        pickTile('Le moins cher', cheapest),
        bestQ ? pickTile('Le mieux classé', bestQ) : null,
        value && value !== bestQ && value !== cheapest ? pickTile('Le bon compromis', value, 'à moins de 8 points du meilleur') : null),
      h('div', { class: 'legend' },
        h('span', {}, h('i', { class: 'key rect s1' }), 'Lecture'),
        st.cache > 0 ? h('span', {}, h('i', { class: 'key rect s2' }), 'Relecture depuis le cache') : null,
        h('span', {}, h('i', { class: 'key rect s3' }), 'Écriture')),
      h('div', { class: 'table-wrap' }, h('table', { class: 'data cost-table' },
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Modèle'), h('th', { scope: 'col', class: 'num' }, 'Indice'),
          h('th', { scope: 'col', class: 'num opt' }, 'Lecture'), h('th', { scope: 'col', class: 'num opt' }, 'Écriture'),
          h('th', { scope: 'col' }, 'Coût par mois'), h('th', { scope: 'col', class: 'num opt' }, 'Par an'))),
        h('tbody', {}, rows.map(({ m, c }) => h('tr', {},
          h('td', {}, modelLink(m, st.batch && m.price.batch ? 'tarif différé' : '')),
          h('td', { class: 'num', text: m.index != null ? fmtFixed(m.index, 1) : '—' }),
          h('td', { class: 'num opt', text: fmtCost(c.read + c.cache) }),
          h('td', { class: 'num opt', text: fmtCost(c.write) }),
          h('td', {}, h('div', { class: 'cost-cell' },
            h('span', { class: 'cost-bar', 'aria-hidden': 'true', title: `Lecture ${fmtCost(c.read)}, cache ${fmtCost(c.cache)}, écriture ${fmtCost(c.write)}` },
              h('span', { class: 's1', style: `width:${pct(c.read)}%` }), h('span', { class: 's2', style: `width:${pct(c.cache)}%` }),
              h('span', { class: 's3', style: `width:${pct(c.write)}%` })),
            h('b', { text: fmtCost(c.total) }))),
          h('td', { class: 'num opt', text: fmtCost(c.total * 12) })))))),
      h('div', { class: 'notes' }, h('p', { text: 'Les modèles qui « réfléchissent » écrivent des jetons de raisonnement en plus de la réponse : compte large pour l\'écriture. '
        + 'Prix hors taxes, sans remise de volume.' })));
  };
  frag.append(h('div', { class: 'panel calc-form' },
    h('p', { class: 'calc-hint', text: 'Pars d\'un exemple, puis ajuste les trois nombres.' }), presetBox,
    h('div', { class: 'fields' },
      field('input', 'Jetons lus par mois', 'millions', 0.5),
      field('output', 'Jetons écrits par mois', 'millions', 0.5),
      field('cache', 'Part des jetons lus déjà en cache', '%', 5, 100)),
    equiv,
    h('div', { class: 'checks row' },
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.rankedOnly ? 'checked' : null,
        onchange: (e) => { st.rankedOnly = e.target.checked; draw(); } }), 'Seulement les modèles classés au général'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.batch ? 'checked' : null,
        onchange: (e) => { st.batch = e.target.checked; draw(); } }), 'Tarif différé quand il existe (réponse sous 24 h, souvent moitié prix)'))));
  frag.append(out);
  draw();
  return frag;
}
function pickTile(label, r, sub) {
  return h('a', { class: 'reco', href: modelHref(r.m) },
    h('span', { class: 'reco-rank', text: label }),
    h('span', { class: 'reco-name', text: fmtCost(r.c.total) }),
    h('span', { class: 'reco-vendor', text: 'par mois' }),
    h('ul', {}, h('li', { text: r.m.name }), r.m.index != null ? h('li', { text: `indice ${fmtFixed(r.m.index, 1)}, n° ${r.m.rank}` }) : null,
      sub ? h('li', { text: sub }) : null, h('li', { text: `${fmtCost(r.c.total * 12)} par an` })));
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
  ['image-to-video', 'Animer une image', 'D\'une photo à une vidéo'],
  ['video-edit', 'Monter une vidéo', 'Modifier une vidéo existante'],
];
function viewWizard(use) {
  const st = ui.wizard;
  if (use && catById.has(use)) st.use = use;
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Trouver l\'IA qu\'il me faut' }),
    h('p', { class: 'sub', text: 'Trois questions, et les trois meilleurs choix du moment pour toi, d\'après les classements du jour.' })));
  const uses = USES.filter(([id]) => catById.has(id));
  if (!uses.some(([id]) => id === st.use)) st.use = uses[0][0];
  const isMedia = (catById.get(st.use) || {}).group === 'media';
  const rerender = () => render({ keepScroll: true });
  frag.append(h('div', { class: 'wizard' },
    h('fieldset', { class: 'panel' }, h('legend', {}, h('span', { class: 'step', text: '1' }), 'Pour quoi faire ?'),
      h('div', { class: 'choices' }, uses.map(([id, label, sub]) => h('button', {
        type: 'button', class: 'choice' + (st.use === id ? ' on' : ''), 'aria-pressed': st.use === id ? 'true' : 'false',
        onclick: () => {
          st.use = id;
          // L'adresse suit le choix : un lien partagé rouvre le même usage.
          if (location.hash.startsWith('#/choisir/')) history.replaceState(null, '', '#/choisir/' + id);
          rerender();
        },
      }, h('b', { text: label }), h('small', { text: sub }))))),
    h('fieldset', { class: 'panel', disabled: isMedia ? 'disabled' : null },
      h('legend', {}, h('span', { class: 'step', text: '2' }), 'Quel budget ?'),
      isMedia ? h('p', { class: 'fineprint', text: 'Les prix des modèles d\'images et de vidéo ne se comptent pas au jeton : ce critère est ignoré.' })
        : seg('Budget', [[0, 'Peu importe'], [10, 'Jusqu\'à 10 $'], [3, 'Jusqu\'à 3 $'], [1, 'Jusqu\'à 1 $']], st.budget, (v) => { st.budget = v; rerender(); }),
      !isMedia ? h('p', { class: 'fineprint', text: 'Prix mixte par million de jetons, soit environ 750 000 mots.' }) : null),
    h('fieldset', { class: 'panel' }, h('legend', {}, h('span', { class: 'step', text: '3' }), 'Des exigences ?'),
      h('div', { class: 'checks' },
        wizCheck('open', 'Poids ouverts, pour l\'héberger chez moi'),
        !isMedia ? wizCheck('longctx', 'Grand contexte : 200 000 jetons ou plus') : null,
        !isMedia ? wizCheck('free', 'Version gratuite disponible') : null))));
  const cat = st.use;
  const all = market.byCat.get(cat) || [];
  const pool = all.filter((m) => (!st.open || m.license === 'open')
    && (isMedia || !st.longctx || (m.context || 0) >= 200000)
    && (isMedia || !st.free || (m.or && m.or.free))
    && (isMedia || !st.budget || (m.price && m.price.blended <= st.budget)));
  const top = pool.slice(0, 3);
  const label = catLabel(cat);
  const leader = all[0];
  const result = h('div', {});
  result.append(top.length
    ? h('div', { class: 'recos' }, top.map((m, i) => {
      const c = m.cats[cat];
      const month = usageCost(m, PRESETS.chat.input, PRESETS.chat.output, PRESETS.chat.cache);
      const why = [
        `n° ${c.rank} de l'arène ${label}, ${fmt(c.points, 0)} % face au n° 1`,
        m.rank ? `n° ${m.rank} au classement général` : null,
        !isMedia ? (m.price ? `${fmtPrice(m.price.blended)} par million de jetons` : 'prix non publié') : null,
        !isMedia && month ? `environ ${fmtCost(month.total)} par mois pour un petit chatbot` : null,
        !isMedia && m.context ? `lit ${fmtCtx(m.context)} jetons d'un coup, environ ${fmt(pagesOf(m.context))} pages` : null,
        m.license === 'open' ? 'poids ouverts' : null,
        m.or && m.or.free ? 'version gratuite sur OpenRouter' : null,
      ].filter(Boolean);
      return h('a', { class: 'reco' + (i === 0 ? ' first' : ''), href: modelHref(m) },
        h('span', { class: 'reco-rank', text: i === 0 ? 'Notre choix' : i === 1 ? 'Alternative' : 'Aussi bien' }),
        h('span', { class: 'reco-name', text: m.name }),
        h('span', { class: 'reco-vendor', text: m.vendor || '' }),
        h('ul', {}, why.map((w) => h('li', { text: w }))));
    }))
    : h('p', { class: 'empty', text: 'Aucun modèle ne remplit toutes ces conditions aujourd\'hui. Assouplis le budget ou retire une exigence.' }));
  if (top.length && leader && !top.includes(leader)) {
    result.append(h('p', { class: 'notice' }, icon('info'), h('span', {}, `Le n° 1 de l'arène ${label}, `,
      h('a', { href: modelHref(leader), text: leader.name }), ', ne remplit pas tes critères : il est écarté.')));
  }
  if (top.length > 1) {
    result.append(h('div', { class: 'actions' },
      h('a', { class: 'btn', href: '#/comparer/' + top.map((m) => encodeURIComponent(m.id)).join(',') }, icon('scale'), `Comparer ces ${top.length} modèles`),
      h('a', { class: 'btn ghost', href: '#/classement/' + cat }, `Tout le classement ${label}`)));
  }
  frag.append(section('Nos recommandations', pool.length
    ? `Parmi ${plural(pool.length, 'modèle')} qui ${pool.length > 1 ? 'conviennent' : 'convient'}, sur ${all.length} dans l'arène ${label}.`
    : `Aucun des ${all.length} modèles de l'arène ${label} ne convient.`, result));
  return frag;
}
function wizCheck(key, label) {
  return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: ui.wizard[key] ? 'checked' : null,
    onchange: (e) => { ui.wizard[key] = e.target.checked; render({ keepScroll: true }); } }), label);
}

/* Nouveautés */
function viewNews() {
  const st = ui.news;
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Nouveautés' }),
    h('p', { class: 'sub', text: 'Tout ce qui a bougé ces 30 derniers jours, détecté automatiquement à chaque collecte.' })));
  const since = sinceVisit();
  if (since) frag.append(since);

  const n = (t) => snap.events.filter((e) => e.type === t).length;
  const lastLead = snap.events.find((e) => e.type === 'leader');
  frag.append(figures(
    figure('Nouveaux n° 1', fmt(n('leader')), lastLead && byId.get(lastLead.model) ? `le dernier : ${byId.get(lastLead.model).name}, en ${catLabel(lastLead.cat)}` : 'en 30 jours'),
    figure('Entrées dans les classements', fmt(n('entry')), 'en 30 jours'),
    figure('Changements de prix', fmt(n('price')), n('price') ? 'en 90 jours' : 'aucun relevé pour l\'instant'),
    figure('Sorties sur OpenRouter', fmt(n('release')), n('release') ? 'en 30 jours' : 'aucune relevée'),
    figure('Modèles nouveaux', fmt(snap.stats.fresh), 'arrivés depuis moins de 14 jours')));

  const feedUrl = new URL(FEED_URL, location.href).href;
  frag.append(h('div', { class: 'panel subscribe' }, icon('rss'),
    h('div', {}, h('b', { text: 'Être prévenu sans revenir sur le site' }),
      h('p', { text: 'Ajoute ce flux à ton lecteur de flux (Feedly, Inoreader, Thunderbird…) : chaque mouvement y arrive tout seul.' })),
    h('div', { class: 'sub-actions' },
      h('code', { text: feedUrl }),
      h('button', { class: 'btn sm', type: 'button', onclick: async () => {
        try { await navigator.clipboard.writeText(feedUrl); toast('Adresse du flux copiée.', 'success'); } catch { toast('Copie impossible : sélectionne l\'adresse à la main.'); }
      } }, icon('copy'), 'Copier l\'adresse'))));

  // Les plus forts mouvements de la semaine, au général et dans chaque arène.
  const moves = [];
  for (const m of ranked()) if (m.rank7 > 0 && m.rank7 !== m.rank) moves.push({ m, where: 'Général', from: m.rank7, to: m.rank, href: '#/classement' });
  for (const c of snap.categories) {
    for (const m of market.byCat.get(c.id) || []) {
      const x = m.cats[c.id];
      if (x.rank7 > 0 && x.rank7 !== x.rank) moves.push({ m, where: c.label, from: x.rank7, to: x.rank, href: '#/classement/' + c.id });
    }
  }
  const up = moves.filter((x) => x.from > x.to).sort((a, b) => (b.from - b.to) - (a.from - a.to)).slice(0, 6);
  const down = moves.filter((x) => x.from < x.to).sort((a, b) => (b.to - b.from) - (a.to - a.from)).slice(0, 6);
  const moveList = (title, items, empty) => h('div', { class: 'panel' }, h('h3', { text: title }),
    items.length ? h('ul', { class: 'movers wide' }, items.map((x) => h('li', {},
      delta(x.to, x.from),
      h('a', { href: modelHref(x.m), text: x.m.name }),
      h('span', { class: 'mv-rank' }, h('a', { href: x.href, text: x.where }), `, ${ordinal(x.from)} puis ${ordinal(x.to)}`))))
      : h('p', { class: 'empty small', text: empty }));
  frag.append(section('Les plus forts mouvements en 7 jours', 'Places gagnées et perdues, au général et dans chaque arène.',
    h('div', { class: 'two-col' },
      moveList('Les plus fortes hausses', up, 'Aucune hausse cette semaine.'),
      moveList('Les plus fortes baisses', down, 'Aucune baisse cette semaine.'))));

  const types = [['all', 'Tout'], ['leader', 'Nouveaux n° 1'], ['entry', 'Entrées'], ['price', 'Prix'], ['release', 'Sorties']]
    .filter(([t]) => t === 'all' || snap.events.some((e) => e.type === t));
  const evCats = snap.categories.filter((c) => snap.events.some((e) => e.cat === c.id));
  const list = h('div', {});
  const count = h('span', { class: 'count' });
  const draw = () => {
    const evs = snap.events.filter((e) => (st.type === 'all' || e.type === st.type)
      && (st.cat === 'all' || e.cat === st.cat) && (!st.favs || favs.has(e.model)));
    count.textContent = plural(evs.length, 'mouvement');
    const days = new Map();
    for (const e of evs) (days.get(e.date) || days.set(e.date, []).get(e.date)).push(e);
    list.replaceChildren(...(evs.length ? [...days].map(([d, es]) => h('div', { class: 'day' },
      h('h3', {}, dayLabel(d), h('small', { text: plural(es.length, 'mouvement') })), h('ul', { class: 'events' }, es.map(eventRow))))
      : [h('p', { class: 'empty', text: st.favs && !favs.size ? 'Tu n\'as pas encore de favoris : ajoute-en avec l\'étoile, dans les classements.'
        : 'Rien de ce type ces 30 derniers jours. Élargis les filtres.' })]));
  };
  const segBox = h('div', {});
  const drawSeg = () => segBox.replaceChildren(seg('Type', types, st.type, (t) => { st.type = t; drawSeg(); draw(); }));
  drawSeg();
  const catSel = h('select', { class: 'input select', 'aria-label': 'Arène', onchange: (e) => { st.cat = e.target.value; draw(); } },
    h('option', { value: 'all' }, 'Toutes les arènes'), evCats.map((c) => h('option', { value: c.id, selected: c.id === st.cat ? 'selected' : null }, c.label)));
  const favChip = h('button', { type: 'button', class: 'chip' + (st.favs ? ' on' : ''), 'aria-pressed': String(st.favs),
    onclick: (e) => { st.favs = !st.favs; e.currentTarget.classList.toggle('on', st.favs); e.currentTarget.setAttribute('aria-pressed', String(st.favs)); draw(); } },
  icon('star', 'ic sm'), 'Mes favoris');
  frag.append(section('Le journal', 'Jour par jour, du plus récent au plus ancien.',
    h('div', { class: 'filters' }, segBox, evCats.length > 1 ? catSel : null, favChip, h('div', { class: 'filters-end' }, count)), list));
  draw();
  if (snap.releases && snap.releases.length) {
    frag.append(section('Sorties récentes', 'Les derniers modèles mis en ligne sur OpenRouter, pas encore forcément dans les arènes.',
      h('div', { class: 'table-wrap' }, h('table', { class: 'data stack' },
        h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Modèle'), h('th', { scope: 'col' }, 'Sorti le'),
          h('th', { scope: 'col', class: 'num' }, 'Prix lu / écrit'), h('th', { scope: 'col', class: 'num' }, 'Contexte'))),
        h('tbody', {}, snap.releases.map((r) => {
          const orId = typeof r.id === 'string' && /^[\w.:-]+\/[\w.:-]+$/.test(r.id) ? r.id : null;
          return h('tr', {},
            h('th', { scope: 'row' }, r.model && byId.has(r.model) ? h('a', { href: '#/modele/' + encodeURIComponent(r.model), text: r.name })
              : orId ? h('a', { href: 'https://openrouter.ai/' + orId, target: '_blank', rel: 'noopener', text: r.name }) : h('span', { text: r.name }),
            h('small', { text: ' ' + (r.vendor || '') }), r.free ? h('span', { class: 'badge free' }, 'gratuit') : null),
            cell('Sorti le', { text: fmtDay(String(r.created).slice(0, 10)) }),
            cell('Prix lu / écrit', { class: 'num', text: r.price ? `${fmtPrice(r.price.input)} / ${fmtPrice(r.price.output)}` : '—' }),
            cell('Contexte', { class: 'num', text: fmtCtx(r.context) }));
        }))))));
  }
  return frag;
}

/* Méthode et lexique */
const GLOSSARY = [
  ['Arène', 'Un classement par usage (texte, code, images…). Des personnes posent une question, reçoivent deux réponses anonymes et votent pour la meilleure, sans savoir quels modèles ont répondu.'],
  ['Score Elo', 'Une note tirée des duels, comme aux échecs. Seul l\'écart compte : 100 points d\'avance, c\'est environ 64 % de duels gagnés ; 200 points, 76 %.'],
  ['Marge, ou intervalle de confiance', 'La fourchette dans laquelle le vrai score se trouve presque sûrement. Deux modèles dont les fourchettes se chevauchent sont à égalité statistique. Plus un modèle reçoit de votes, plus sa marge est étroite.'],
  ['Indice marketbuss', 'Une note sur 100 qui résume la qualité d\'un modèle dans quatre arènes : Texte, Code, Vision et Documents. 100 veut dire n° 1 partout.'],
  ['Jeton', 'L\'unité de texte que les modèles lisent et écrivent : un morceau de mot. Un million de jetons vaut environ 750 000 mots en anglais, un peu moins en français, soit 2 500 pages.'],
  ['Jetons lus, jetons écrits', 'Lus : ce que tu envoies au modèle (ta question, tes documents). Écrits : ce qu\'il répond. L\'écriture coûte presque toujours plus cher que la lecture.'],
  ['Prix mixte', 'Un seul prix pour comparer : 3 jetons lus pour 1 jeton écrit, le mélange le plus courant.'],
  ['Cache', 'Quand tu renvoies plusieurs fois le même texte (un long document, des consignes), le fournisseur le garde en mémoire et te le refacture beaucoup moins cher.'],
  ['Tarif différé, ou batch', 'Tu envoies tes demandes en lot et tu acceptes d\'attendre la réponse jusqu\'à 24 heures ; en échange, le prix est souvent divisé par deux.'],
  ['Contexte', 'La quantité de texte qu\'un modèle peut lire en une seule fois : ta question, les documents joints et la conversation en cours.'],
  ['Poids ouverts', 'Le modèle est téléchargeable : tu peux l\'installer sur tes propres machines, sans passer par son éditeur.'],
  ['Raisonnement', 'Le modèle réfléchit par étapes avant de répondre. C\'est souvent meilleur, plus lent, et plus cher : ces étapes sont facturées comme des jetons écrits.'],
  ['Réglage', 'Un même modèle peut concourir avec plusieurs niveaux de réflexion (« high », « max »…). marketbuss les regroupe et garde le meilleur.'],
  ['Frontière qualité/prix', 'Les modèles qu\'aucun autre ne bat à la fois sur la qualité et sur le prix. Pour faire mieux que l\'un d\'eux, il faut payer plus.'],
  ['Agent', 'Un modèle qui mène une tâche seul, en plusieurs étapes, avec des outils : chercher, écrire du code, le lancer, corriger.'],
];
const FAQ = [
  ['Pourquoi l\'indice d\'un modèle baisse alors qu\'il n\'a pas changé ?',
    'L\'indice se mesure par rapport au n° 1 de chaque arène. Quand un meilleur modèle arrive, le n° 1 monte, et tous les autres reculent un peu sans avoir changé.'],
  ['Pourquoi un modèle récent est-il marqué « provisoire » ?',
    'Pendant ses 14 premiers jours, il n\'est souvent noté que dans une ou deux arènes. Son indice ne compte alors que celles-là : il peut encore bouger nettement.'],
  ['Pourquoi certains modèles n\'ont-ils pas de prix ?',
    'Le prix vient des catalogues publics. Un modèle tout juste annoncé, réservé à certains clients ou vendu autrement qu\'au jeton n\'y figure pas encore.'],
  ['Le n° 1 est-il le meilleur pour moi ?',
    'Pas forcément. Le classement général mélange quatre usages. Regarde plutôt l\'arène qui correspond à ce que tu veux faire, puis le prix : « Trouver mon IA » fait ce tri pour toi.'],
  ['À quelle fréquence les chiffres changent-ils ?',
    'Le robot repasse toutes les 3 heures. Les arènes, elles, publient leurs scores environ une fois par jour ; les prix changent quelques fois par mois.'],
  ['Puis-je réutiliser les données ?',
    'Oui : le fichier JSON et le flux Atom sont publics, sans clé ni inscription. Cite Arena AI, LiteLLM et OpenRouter, dont viennent les chiffres.'],
];
function viewMethod() {
  const frag = h('div', { class: 'wrap narrow' });
  frag.append(h('div', { class: 'page-head' }, h('h1', { text: 'Méthode et lexique' }),
    h('p', { class: 'sub', text: 'D\'où viennent les chiffres, comment ils sont calculés, ce que veulent dire les mots, et leurs limites.' })));
  frag.append(h('nav', { class: 'toc', 'aria-label': 'Dans cette page' },
    [['sources', 'Les sources'], ['indice', 'L\'indice'], ['prix', 'Le rapport qualité/prix'], ['maj', 'Les mises à jour'],
      ['lexique', 'Le lexique'], ['questions', 'Questions fréquentes'], ['limites', 'Les limites'], ['donnees', 'Données ouvertes']]
      .map(([id, label]) => h('button', { type: 'button', class: 'chip', onclick: () => {
        const el = document.getElementById('m-' + id);
        if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      } }, label))));
  const sec = (id, title, sub, ...kids) => {
    const s = section(title, sub, ...kids);
    s.id = 'm-' + id;
    return s;
  };
  const okText = (s) => (s.ok ? 'à jour' : 'injoignable au dernier passage');
  frag.append(sec('sources', 'Les sources', `Dernière collecte le ${new Date(snap.generatedAt).toLocaleString('fr-FR')} (${relTime(snap.generatedAt)}). Prochaine ${nextRunText()}.`,
    h('ul', { class: 'sources' }, (snap.sources || []).map((s) => h('li', { class: s.ok ? 'ok' : 'ko' },
      h('span', { class: 'src-state', 'aria-hidden': 'true' }, icon(s.ok ? 'check' : 'info', 'ic sm')),
      h('div', {}, /^https:\/\//.test(String(s.url)) ? h('a', { href: s.url, target: '_blank', rel: 'noopener', text: s.name }) : h('b', { text: s.name }),
        h('p', { text: {
          arena: 'La qualité. Des millions de votes à l\'aveugle entre deux réponses anonymes, convertis en score Elo, une arène par usage. '
            + 'Copie quotidienne en JSON par le projet libre arena-ai-leaderboards.',
          litellm: 'Les prix. La base ouverte des tarifs publics de chaque fournisseur (lecture, écriture, cache, tarif différé), avec la taille du contexte et les capacités.',
          openrouter: 'Le catalogue. Les modèles mis en ligne, leur date de sortie et l\'existence d\'une version gratuite.',
        }[s.id] || '' }),
        h('small', { text: [okText(s), s.date ? 'classements du ' + fmtDay(s.date) : null, s.boards ? plural(s.boards, 'arène') : null,
          s.count ? `${fmt(s.count)} entrées lues` : null].filter(Boolean).join(', ') })))))));
  const weights = llmCats().filter((c) => c.weight);
  frag.append(sec('indice', 'L\'indice marketbuss', null, h('div', { class: 'prose' },
    h('p', { text: 'Dans chaque arène, un écart de score Elo se traduit en chances de gagner un duel. Pour chaque modèle, on calcule ses chances face au n° 1 de l\'arène, ramenées sur 100 : le n° 1 a 100, un modèle à 70 points derrière environ 80, à 200 points environ 48.' }),
    h('p', { text: 'L\'indice est la moyenne de ces notes dans quatre arènes, chacune avec son poids :' }),
    h('ul', { class: 'weights' }, weights.map((c) => h('li', {},
      h('span', { text: c.label }), h('span', { class: 'w-track', 'aria-hidden': 'true' }, h('span', { style: `width:${c.weight * 100 / 0.35}%` })),
      h('b', { text: Math.round(c.weight * 100) + ' %' })))),
    h('p', { text: 'Un modèle absent du haut d\'une arène compte juste sous la dernière place affichée. Exception : un modèle arrivé depuis moins de 14 jours, pas encore noté partout ; l\'arène manquante est alors laissée de côté et son indice est marqué « provisoire ».' }),
    h('p', { text: 'Les réglages d\'un même modèle (effort de réflexion « high », « max »…) sont regroupés : c\'est son meilleur réglage qui compte.' }),
    h('p', { text: 'La courbe sur 30 jours refait ce même calcul avec les arènes de chaque jour. Le rang d\'il y a 7 jours est calculé de la même façon.' }))));
  frag.append(sec('prix', 'Le rapport qualité/prix', null, h('div', { class: 'prose' },
    h('p', { text: 'Le prix mixte compte 3 jetons lus pour 1 jeton écrit, l\'usage le plus courant. Un modèle est sur la frontière qualité/prix si aucun autre n\'est à la fois mieux classé et moins cher.' }),
    h('p', { text: 'Le calculateur applique tes propres volumes : jetons lus, jetons écrits, part relue depuis le cache, et tarif différé si tu peux attendre la réponse.' }))));
  frag.append(sec('maj', 'Les mises à jour', null, h('div', { class: 'prose' },
    h('p', { text: 'Un robot (GitHub Actions) relève toutes les sources toutes les 3 heures, recalcule tout et republie le site. Les arènes elles-mêmes changent environ une fois par jour.' }),
    h('p', { text: 'Une page restée ouverte vérifie toute seule toutes les 5 minutes s\'il y a du nouveau et se met à jour sans rechargement. Les nouveaux n° 1, entrées, sorties et changements de prix sont détectés automatiquement et publiés dans le flux Atom.' }),
    h('p', { text: 'Si une source ne répond pas, les derniers chiffres connus restent affichés et la pastille en haut de page passe à « Données anciennes ».' }))));
  frag.append(sec('lexique', 'Le lexique', 'Les mots qui reviennent sur le site, expliqués simplement.',
    h('dl', { class: 'glossary' }, GLOSSARY.map(([term, def]) => [h('dt', { text: term }), h('dd', { text: def })]))));
  frag.append(sec('questions', 'Questions fréquentes', null,
    h('div', { class: 'faq' }, FAQ.map(([q, a]) => h('details', {}, h('summary', { text: q }), h('p', { text: a }))))));
  frag.append(sec('limites', 'Les limites', null, h('ul', { class: 'prose list' },
    h('li', { text: 'Les arènes mesurent la préférence des votants sur des questions variées, pas une compétence précise. Le score d\'un modèle très récent bouge encore : regarde sa marge.' }),
    h('li', { text: 'Les arènes n\'affichent que leur haut de classement : un modèle absent n\'est pas forcément mauvais, il est seulement sous la dernière place affichée.' }),
    h('li', { text: 'Les prix sont les prix catalogue, hors taxes, sans remise. Les modèles qui réfléchissent écrivent plus de jetons, donc coûtent plus à l\'usage que leur prix au jeton ne le laisse croire.' }),
    h('li', { text: 'Le rapprochement des noms entre les sources est automatique : quelques modèles peuvent rester sans prix.' }),
    h('li', { text: 'Les capacités viennent des catalogues des fournisseurs : une capacité non indiquée n\'est pas forcément absente.' }))));
  frag.append(sec('donnees', 'Données ouvertes', 'Réutilisables librement, sans clé ni inscription.', h('div', { class: 'prose' },
    h('p', {}, h('a', { href: DATA_URL, text: 'data/latest.json' }), ' : l\'instantané complet (modèles, arènes, prix, historique, événements). ',
      h('a', { href: FEED_URL, text: 'data/feed.xml' }), ' : le flux Atom des mouvements. Chaque classement s\'exporte aussi en CSV depuis sa page.'),
    h('p', { class: 'fineprint', text: `${snap.stats.models} modèles, dont ${snap.stats.ranked} classés au général et ${snap.stats.priced} avec un prix ; historique depuis le ${snap.stats.historyFrom ? fmtDay(snap.stats.historyFrom) : '—'}.` }))));
  return frag;
}

function renderError(err) {
  document.getElementById('view').replaceChildren(h('div', { class: 'wrap page-head' },
    h('h1', { text: 'Le classement n\'a pas pu être chargé' }),
    h('p', { class: 'sub', text: 'Les données sont restées introuvables (' + (err && err.message ? err.message : 'erreur réseau') + '). Vérifie ta connexion, puis réessaie.' }),
    h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { location.reload(); } }, icon('refresh'), 'Réessayer'))));
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
document.getElementById('find').addEventListener('click', openSearch);
document.getElementById('search').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
  if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
    e.preventDefault();
    openSearch();
  }
});
addEventListener('hashchange', () => render());
addEventListener('pointerdown', (e) => { if (!e.target.closest('.hit, .overlay')) hideTip(); });
addEventListener('scroll', hideTip, { passive: true });

await refresh();
store.set('mb-visit', { at: new Date().toISOString() });
setInterval(renderStatus, 30000);
pollTimer = setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
document.addEventListener('visibilitychange', () => { if (!document.hidden && snap && Date.now() - Date.parse(snap.generatedAt) > POLL_MS) refresh(); });
