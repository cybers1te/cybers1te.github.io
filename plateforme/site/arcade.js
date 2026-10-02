// marketbuss — la plateforme (page unique, sans dépendance, sans compte).
//
// Tout se passe dans le navigateur : rien de ce que tape le visiteur n'est
// envoyé quelque part. Les textes saisis (carte de pitch) sont affichés avec
// textContent, jamais avec innerHTML.

import * as calc from './calculs.js?v=__V__';
import { CHECKLISTS, GLOSSARY, LEVELS, ROLES, STAGES, TOOLS } from './contenu.js?v=__V__';
import { skyline, sprite } from './sprites.js?v=__V__';

/* ---------- Outils DOM et formats ---------- */

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

const nf = (n, d = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(n);
function money(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e9) return nf(n / 1e9, 2) + ' Md €';
  if (a >= 1e6) return nf(n / 1e6, 2) + ' M €';
  if (a >= 100 || Number.isInteger(n)) return nf(Math.round(n)) + ' €';
  return nf(n, 2) + ' €';
}
const pct = (n, d = 1) => nf(n, d) + ' %';
const times = (n) => nf(n, n < 10 ? 1 : 0) + ' ×';
const ordinal = (n) => (n === 1 ? '1er' : n + 'e');
const plural = (n, one, many) => `${nf(n)} ${n > 1 ? many || one + 's' : one}`;
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const toolById = new Map(TOOLS.map((t) => [t.id, t]));

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
  try { await navigator.clipboard.writeText(text); toast(done); } catch { toast('Copie impossible : copie l\'adresse de la page à la main.'); }
}

/* ---------- Petits composants ---------- */

const roleTag = (role) => h('span', { class: 'tag ' + ROLES[role].color, text: ROLES[role].name });

function toolCard(t) {
  return h('a', { class: 'cabinet ' + ROLES[t.role].color, href: '#/outil/' + t.id },
    h('span', { class: 'cabinet-screen' }, sprite(t.sprite, 6)),
    h('span', { class: 'cabinet-body' },
      roleTag(t.role),
      h('b', { text: t.name }),
      h('span', { text: t.question })));
}

function section(title, sub, ...kids) {
  return h('section', { class: 'section' },
    h('div', { class: 'section-head' }, h('h2', { text: title }), sub ? h('p', { class: 'sub', text: sub }) : null),
    ...kids);
}

/* Le grand chiffre d'un résultat. */
const score = (value, label, cls = '') => h('div', { class: 'score ' + cls }, h('b', { text: value }), h('span', { text: label }));
const fact = (label, value) => h('div', { class: 'fact' }, h('span', { text: label }), h('b', { text: value }));

/* Colonnes en pixels : valeurs positives vers le haut, négatives vers le bas.
   `data` : [{ label, value, title }]. Les valeurs sont aussi dans un tableau. */
function columns(data, { height = 150, pos = 'var(--p1)', neg = 'var(--hot)', every = 6 } = {}) {
  const max = Math.max(0, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const span = max - min || 1;
  const bw = 8;
  const gap = 2;
  const W = data.length * (bw + gap);
  const zero = Math.round((max / span) * height);
  const root = svg('svg', { viewBox: `0 0 ${W} ${height + 1}`, class: 'pxchart', preserveAspectRatio: 'none', 'shape-rendering': 'crispEdges', role: 'img',
    'aria-label': `De ${money(data[0].value)} à ${money(data[data.length - 1].value)}` });
  const ticks = [];
  data.forEach((d, i) => {
    const hpx = Math.max(d.value === 0 ? 0 : 2, Math.round((Math.abs(d.value) / span) * height));
    const y = d.value >= 0 ? zero - hpx : zero;
    const r = svg('rect', { x: i * (bw + gap) + gap / 2, y, width: bw, height: hpx, fill: d.value >= 0 ? pos : neg });
    r.append(svg('title', { text: d.title }));
    root.append(r);
    if (i % every === 0) ticks.push([(i * (bw + gap) + gap / 2 + bw / 2) / W, d.label]);
  });
  root.append(svg('rect', { x: 0, y: zero, width: W, height: 1, fill: 'var(--ink)' }));
  return figure(root, ticks, max > 0 ? money(max) : money(min));
}

/* Le graphique et ses repères : les textes restent en HTML, donc lisibles à toutes les largeurs. */
function figure(chart, ticks, top) {
  return h('div', { class: 'pxfig' },
    h('p', { class: 'pxtop', text: `Le plus haut : ${top}` }),
    chart,
    h('div', { class: 'pxaxis', 'aria-hidden': 'true' }, ticks.map(([at, label]) => h('span', { style: `left:${(at * 100).toFixed(2)}%`, text: label }))));
}

/* Colonnes empilées : `data` : [{ label, parts: [a, b], title }]. */
function stacked(data, { height = 160, colors = ['var(--p1)', 'var(--ok)'], every = 5 } = {}) {
  const max = Math.max(1, ...data.map((d) => d.parts.reduce((s, v) => s + Math.max(0, v), 0)));
  const bw = 10;
  const gap = 3;
  const W = data.length * (bw + gap);
  const root = svg('svg', { viewBox: `0 0 ${W} ${height}`, class: 'pxchart', preserveAspectRatio: 'none', 'shape-rendering': 'crispEdges', role: 'img',
    'aria-label': 'Valeur année par année' });
  const ticks = [];
  data.forEach((d, i) => {
    let y = height;
    d.parts.forEach((v, k) => {
      const hpx = Math.round((Math.max(0, v) / max) * height);
      if (!hpx) return;
      y -= hpx;
      // Un pixel de fond sépare les deux couleurs d'une même colonne.
      const r = svg('rect', { x: i * (bw + gap), y: k ? y : y + 0, width: bw, height: k ? Math.max(1, hpx - 1) : hpx, fill: colors[k] });
      r.append(svg('title', { text: d.title }));
      root.append(r);
    });
    if (i % every === 0) ticks.push([(i * (bw + gap) + bw / 2) / W, d.label]);
  });
  return figure(root, ticks, money(max));
}

/* Deux barres horizontales à comparer. */
function versus(rows) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return h('div', { class: 'versus' }, rows.map((r) => h('div', { class: 'versus-row' },
    h('span', { class: 'versus-label', text: r.label }),
    h('span', { class: 'versus-track', 'aria-hidden': 'true' }, h('span', { class: r.cls || '', style: `width:${Math.max(1, (r.value / max) * 100)}%` })),
    h('b', { text: r.text }))));
}

const legend = (...items) => h('div', { class: 'legend' }, items.map(([cls, text]) => h('span', {}, h('i', { class: 'key ' + cls }), text)));

function valuesTable(head, rows) {
  return h('details', { class: 'values' }, h('summary', {}, 'Voir les valeurs'),
    h('div', { class: 'table-wrap' }, h('table', {},
      h('thead', {}, h('tr', {}, head.map((t, i) => h('th', { scope: 'col', class: i ? 'num' : '', text: t })))),
      h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c, i) => h('td', { class: i ? 'num' : '', text: c }))))))));
}

/* ---------- Résultats des calculateurs ---------- */

const invalid = (text) => h('p', { class: 'notice', text });

const RESULTS = {
  runway(v) {
    const r = calc.runway(v);
    if (!r) return invalid('Vérifie tes chiffres : la trésorerie, les dépenses et les revenus ne peuvent pas être négatifs.');
    const shown = r.months == null ? r.series : r.series.slice(0, Math.min(r.series.length, r.months + 8));
    const lives = r.months == null ? 12 : Math.min(12, r.months);
    let verdict;
    if (r.months == null && r.breakEven) verdict = r.breakEven === 1 ? 'Tes revenus couvrent déjà tes dépenses : la trésorerie ne baisse pas.'
      : `Tes revenus rattrapent tes dépenses au ${ordinal(r.breakEven)} mois : la trésorerie ne passe jamais sous zéro.`;
    else if (r.months == null) verdict = `Tu tiens plus de ${r.horizon} mois à ce rythme.`;
    else {
      verdict = r.months === 0 ? 'À ce rythme, la trésorerie passe sous zéro dès le premier mois.'
        : `À ce rythme, la trésorerie passe sous zéro au cours du ${ordinal(r.months + 1)} mois.`;
      if (r.breakEven) verdict += ` Tes revenus ne couvriraient tes dépenses qu'au ${ordinal(r.breakEven)} mois : trop tard, sauf à lever des fonds ou à réduire les dépenses.`;
    }
    return [
      h('div', { class: 'result-top' },
        score(r.months == null ? `${r.horizon}+` : String(r.months), 'mois de survie', r.months != null && r.months < 6 ? 'bad' : ''),
        h('div', { class: 'lives', role: 'img', 'aria-label': `${lives} cœur${lives > 1 ? 's' : ''} sur 12` },
          Array.from({ length: 12 }, (_, i) => h('span', { class: i < lives ? '' : 'off' }, sprite('heart', 3))),
          h('small', { text: 'Un cœur par mois, douze au plus.' }))),
      h('p', { class: 'verdict', text: verdict }),
      h('div', { class: 'facts' },
        fact('Tu perds chaque mois, aujourd\'hui', r.netBurn > 0 ? money(r.netBurn) : 'rien'),
        fact('Revenus qui couvrent les dépenses', r.breakEven ? `au ${ordinal(r.breakEven)} mois` : `pas avant ${r.horizon} mois`)),
      h('h3', { text: 'Ta trésorerie, mois par mois' }),
      columns(shown.map((p) => ({ label: 'M' + p.month, value: p.cash, title: `Mois ${p.month} : ${money(p.cash)}` }))),
      legend(['p1', 'Trésorerie positive'], ['hot', 'Sous zéro']),
      valuesTable(['Mois', 'Revenus', 'Trésorerie'], shown.map((p) => [p.month === 0 ? 'Aujourd\'hui' : 'Mois ' + p.month, p.month === 0 ? '' : money(p.revenue), money(p.cash)])),
    ];
  },

  dilution(v) {
    const r = calc.dilution(v);
    if (!r) return invalid('Avec ces chiffres, il ne reste plus rien à partager : la levée et la réserve prennent 100 % du capital ou plus. Vérifie la valorisation.');
    const parts = [['p1', 'Fondateurs', r.founders], ['violet', 'Autres associés déjà là', r.others], ['hot', 'Réserve pour les salariés', r.pool], ['p2', 'Nouveaux investisseurs', r.investors]]
      .filter((p) => p[2] > 0);
    // 100 cases : chaque part reçoit ses cases, les arrondis vont à la plus grosse.
    const cells = parts.map((p) => Math.floor(p[2]));
    let rest = 100 - cells.reduce((s, n) => s + n, 0);
    const order = parts.map((p, i) => [p[2] - Math.floor(p[2]), i]).sort((a, b) => b[0] - a[0]);
    for (let k = 0; rest > 0; k++, rest--) cells[order[k % order.length][1]]++;
    const squares = [];
    parts.forEach((p, i) => { for (let n = 0; n < cells[i]; n++) squares.push(p[0]); });
    return [
      h('div', { class: 'result-top' }, score(pct(r.founders), 'pour les fondateurs après la levée'),
        h('div', { class: 'waffle', role: 'img', 'aria-label': parts.map((p) => `${p[1]} ${pct(p[2])}`).join(', ') },
          squares.map((c) => h('i', { class: c })))),
      h('p', { class: 'verdict', text: `Les fondateurs passent de ${pct(v.founders)} à ${pct(r.founders)} : ils cèdent ${nf(r.lost, 1)} points. L'entreprise vaut ${money(r.post)} après la levée.` }),
      legend(...parts.map((p) => [p[0], `${p[1]} : ${pct(p[2])}`])),
      h('div', { class: 'facts' },
        fact('Valorisation avant la levée', money(v.pre)),
        fact('Valorisation après la levée', money(r.post)),
        fact('Part des nouveaux investisseurs', pct(r.investors))),
    ];
  },

  seuil(v) {
    const r = calc.breakEven(v);
    if (!r) return invalid('Vérifie tes chiffres : il faut un prix de vente au-dessus de zéro.');
    if (r.units == null) {
      return [h('div', { class: 'result-top' }, score('Jamais', 'aucun nombre de ventes ne suffit', 'bad')),
        h('p', { class: 'verdict', text: `Chaque vente te fait perdre ${money(-r.margin)} : aucun volume ne rattrape ça. Monte le prix ou baisse le coût par vente.` })];
    }
    const scenario = (units) => [nf(units), money(units * v.price), money(units * r.margin - v.fixed)];
    return [
      h('div', { class: 'result-top' }, score(nf(r.units), `vente${r.units > 1 ? 's' : ''} par mois pour être à l'équilibre`)),
      h('p', { class: 'verdict', text: `Chaque vente te laisse ${money(r.margin)} (${pct(r.marginRate)} du prix). Il en faut ${nf(r.units)} par mois, soit ${money(r.revenue)} de chiffre d'affaires, pour couvrir ${money(v.fixed)} de charges fixes.` }),
      h('div', { class: 'facts' },
        fact('Marge par vente', money(r.margin)),
        fact('Chiffre d\'affaires au seuil', money(r.revenue)),
        fact('Ventes par jour ouvré, environ', nf(r.units / 22, 1))),
      h('h3', { text: 'Trois scénarios' }),
      h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ['Ventes par mois', 'Chiffre d\'affaires', 'Résultat du mois'].map((t, i) => h('th', { scope: 'col', class: i ? 'num' : '', text: t })))),
        h('tbody', {}, [Math.floor(r.units / 2), r.units, Math.ceil(r.units * 1.5)].map((u) => {
          const row = scenario(u);
          return h('tr', {}, row.map((c, i) => h('td', { class: (i ? 'num' : '') + (i === 2 ? (u * r.margin - v.fixed < 0 ? ' neg' : ' posv') : ''), text: c })));
        })))),
    ];
  },

  client(v) {
    const r = calc.unitEconomics(v);
    if (!r) return invalid('Vérifie tes chiffres : il faut au moins un client, un revenu, une marge entre 1 et 100 % et un taux de départ au-dessus de zéro.');
    let verdict;
    if (r.ratio == null) verdict = 'Tes clients ne te coûtent rien à trouver : chacun rapporte sa marge dès le premier mois.';
    else if (r.ratio >= 3) verdict = `Un client te rapporte ${nf(r.ratio, 1)} fois ce qu'il te coûte : au-dessus du repère de 3.`;
    else if (r.ratio >= 1) verdict = `Un client te rapporte ${nf(r.ratio, 1)} fois ce qu'il te coûte : en dessous du repère de 3. Baisse le coût d'acquisition, ou garde tes clients plus longtemps.`;
    else verdict = `Un client te coûte plus qu'il ne rapporte (${nf(r.ratio, 1)} fois son coût) : chaque nouveau client creuse la perte.`;
    return [
      h('div', { class: 'result-top' }, score(r.ratio == null ? 'Gratuit' : times(r.ratio), 'ce que rapporte un client, comparé à son coût', r.ratio != null && r.ratio < 1 ? 'bad' : '')),
      h('p', { class: 'verdict', text: verdict }),
      versus([{ label: 'Coût d\'un client (CAC)', value: r.cac, text: money(r.cac), cls: 'hot' }, { label: 'Valeur d\'un client (LTV)', value: r.ltv, text: money(r.ltv), cls: 'ok' }]),
      h('div', { class: 'facts' },
        fact('Un client reste en moyenne', `${nf(r.lifetime, 1)} mois`),
        fact('Son coût est remboursé en', r.payback ? `${nf(r.payback, 1)} mois` : 'tout de suite')),
    ];
  },

  ticket(v) {
    const r = calc.exitReturn(v);
    if (!r) return invalid('Vérifie tes chiffres : le montant investi ne peut pas dépasser la valorisation à l\'entrée, et la durée doit être d\'au moins un an.');
    return [
      h('div', { class: 'result-top' }, score(times(r.multiple), 'la mise', r.multiple < 1 ? 'bad' : 'p2')),
      h('p', { class: 'verdict', text: r.multiple >= 1
        ? `Dans ce scénario, ${money(v.ticket)} deviennent ${money(r.proceeds)} en ${plural(v.years, 'an')} : ${pct(r.irr)} par an.`
        : `Dans ce scénario, tu récupères ${money(r.proceeds)} sur ${money(v.ticket)} investis : une perte de ${money(-r.gain)}.` }),
      versus([{ label: 'Investi', value: v.ticket, text: money(v.ticket), cls: 'p2' }, { label: 'Récupéré', value: r.proceeds, text: money(r.proceeds), cls: 'ok' }]),
      h('div', { class: 'facts' },
        fact('Ta part à l\'entrée', pct(r.stake, 2)),
        fact('Ta part à la sortie', pct(r.stakeExit, 2)),
        fact('Rendement par an (TRI)', pct(r.irr))),
    ];
  },

  composes(v) {
    const r = calc.compound(v);
    if (!r) return invalid('Vérifie tes chiffres : la durée doit être un nombre entier d\'années, entre 1 et 60.');
    return [
      h('div', { class: 'result-top' }, score(money(r.value), `au bout de ${plural(v.years, 'an')}`, 'p2')),
      h('p', { class: 'verdict', text: r.gain >= 0
        ? `Tu as versé ${money(r.paid)} ; les intérêts ont ajouté ${money(r.gain)}${r.paid > 0 ? `, soit ${pct((r.gain / r.paid) * 100, 0)} de plus` : ''}.`
        : `Tu as versé ${money(r.paid)} ; avec un rendement négatif, il reste ${money(r.value)}.` }),
      h('h3', { text: 'Année après année' }),
      stacked(r.series.map((p) => ({ label: String(p.year), parts: [Math.min(p.paid, p.value), Math.max(0, p.value - p.paid)],
        title: `Année ${p.year} : ${money(p.value)}, dont ${money(p.paid)} versés` })), { every: v.years > 30 ? 10 : 5 }),
      legend(['p1', 'Ce que tu as versé'], ['ok', 'Ce que les intérêts ont ajouté']),
      valuesTable(['Année', 'Versé', 'Valeur'], r.series.map((p) => [p.year === 0 ? 'Départ' : 'Année ' + p.year, money(p.paid), money(p.value)])),
    ];
  },

  valo(v) {
    const r = calc.maxValuation(v);
    if (!r) return invalid('Vérifie tes chiffres : il faut une valorisation de sortie et un multiple au-dessus de zéro.');
    return [
      h('div', { class: 'result-top' }, score(money(r.post), 'de valorisation maximale après la levée', 'p2')),
      h('p', { class: 'verdict', text: `Pour récupérer ${nf(v.multiple, 1)} fois ta mise avec une sortie à ${money(v.exit)} et ${pct(v.dilution, 0)} de dilution d'ici là, l'entreprise ne doit pas valoir plus de ${money(r.post)} après la levée.` }),
      h('div', { class: 'facts' },
        r.pre != null ? fact('Soit, avant ta mise', money(r.pre)) : null,
        r.stake != null ? fact('Ta part à l\'entrée', pct(r.stake, 2)) : fact('Ta part', v.ticket > 0 ? 'ton montant dépasse cette valorisation' : 'indique un montant pour la connaître')),
    ];
  },
};

/* ---------- Vues ---------- */

function viewHome() {
  const frag = h('div', { class: 'home' });
  frag.append(h('section', { class: 'hero' },
    h('div', { class: 'wrap hero-in' },
      h('p', { class: 'insert', text: 'Outils gratuits, sans compte' }),
      h('h1', { text: 'marketbuss' }),
      h('p', { class: 'tagline', text: 'La salle d\'arcade des entrepreneurs et des investisseurs.' }),
      h('p', { class: 'lead', text: 'Chiffrer un projet, préparer une levée, juger un investissement : des outils simples, qui tournent dans ton navigateur.' }),
      h('h2', { class: 'select-title', text: 'Choisis ton joueur' }),
      h('div', { class: 'players' }, Object.values(ROLES).map((r) => h('a', { class: 'player ' + r.color, href: '#/outils/' + r.id },
        h('span', { class: 'player-sprite' }, sprite(r.sprite, 7)),
        h('span', { class: 'player-text' },
          h('small', { text: r.player }),
          h('b', { text: r.name }),
          h('span', { text: r.pitch }),
          h('span', { class: 'player-go', text: `${TOOLS.filter((t) => t.role === r.id).length} outils` })))))),
    h('div', { class: 'hero-rocket', 'aria-hidden': 'true' }, sprite('rocket', 6)),
    h('div', { class: 'hero-coin c1', 'aria-hidden': 'true' }, sprite('coin', 4)),
    h('div', { class: 'hero-coin c2', 'aria-hidden': 'true' }, sprite('gem', 4)),
    skyline()));

  const body = h('div', { class: 'wrap' });
  frag.append(body);
  body.append(section('Les bornes', 'Chaque borne répond à une question. Les chiffres de départ sont des exemples : remplace-les par les tiens.',
    h('div', { class: 'cabinets three' }, TOOLS.map(toolCard))));

  body.append(section('Le parcours', 'De l\'idée à la série A, en six niveaux : quoi faire, et ce que regarde un investisseur à chaque étape.',
    h('ol', { class: 'track' }, LEVELS.map((l, i) => h('li', {}, h('a', { href: '#/parcours' },
      h('span', { class: 'track-n', text: String(i + 1) }), h('b', { text: l.name }), h('span', { text: l.goal })))))));

  body.append(h('section', { class: 'section duo' },
    h('a', { class: 'panel link-panel', href: '#/pitch' }, sprite('card', 7),
      h('div', {}, h('h2', { text: 'Ta carte de pitch' }),
        h('p', { text: 'Résume ton projet sur une carte, et partage-la avec un simple lien. Rien n\'est enregistré chez nous.' }),
        h('span', { class: 'btn p1', text: 'Créer ma carte' }))),
    h('a', { class: 'panel link-panel', href: '#/lexique' }, sprite('book', 7),
      h('div', {}, h('h2', { text: 'Le lexique' }),
        h('p', { text: `Pre-money, dilution, runway, TRI… ${GLOSSARY.length} mots de la création d'entreprise et de l'investissement, expliqués simplement.` }),
        h('span', { class: 'btn', text: 'Ouvrir le lexique' })))));

  body.append(section('Le labo', 'Les projets lancés par marketbuss.',
    h('a', { class: 'panel link-panel lab', href: 'repondeur/' }, sprite('flask', 7),
      h('div', {}, h('h3', { text: 'Répondeur IA' }),
        h('p', { text: 'Un assistant qui répond tout seul aux questions des clients d\'un commerce : horaires, prix, réservations. Première version, avec une démonstration à essayer.' }),
        h('span', { class: 'btn', text: 'Voir le Répondeur IA' })))));
  return frag;
}

function viewTools(roleId) {
  const role = ROLES[roleId] || null;
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' },
    role ? h('div', { class: 'head-sprite' }, sprite(role.sprite, 6)) : null,
    h('div', {}, h('h1', { text: role ? `${role.player} : ${role.name}` : 'Toutes les bornes' }),
      h('p', { class: 'sub', text: role ? (role.id === 'entrepreneur'
        ? 'Les outils pour chiffrer ton projet et préparer une levée.'
        : 'Les outils pour évaluer un investissement et tester des scénarios.') : 'Les outils des deux joueurs.' }))));
  frag.append(h('div', { class: 'seg', role: 'group', 'aria-label': 'Joueur' },
    [['', 'Tous'], ['entrepreneur', 'Entrepreneur'], ['investisseur', 'Investisseur']].map(([id, label]) =>
      h('a', { class: (roleId || '') === id ? 'on' : '', 'aria-current': (roleId || '') === id ? 'page' : null, href: '#/outils' + (id ? '/' + id : '') }, label))));
  frag.append(h('div', { class: role ? 'cabinets' : 'cabinets three' }, TOOLS.filter((t) => !role || t.role === role.id).map(toolCard)));
  frag.append(h('p', { class: 'fineprint', text: 'Ces outils servent à comprendre et à s\'entraîner. Ce ne sont pas des conseils financiers, juridiques ou fiscaux.' }));
  return frag;
}

function viewTool(id, query) {
  const t = toolById.get(id);
  if (!t) return viewMissing();
  const frag = h('div', { class: 'wrap' });
  frag.append(h('nav', { class: 'crumbs', 'aria-label': 'Fil d\'Ariane' },
    h('a', { href: '#/outils', text: 'Bornes' }), h('span', { text: '/' }),
    h('a', { href: '#/outils/' + t.role, text: ROLES[t.role].name }), h('span', { text: '/' }), h('span', { text: t.name })));
  frag.append(h('div', { class: 'page-head' },
    h('div', { class: 'head-sprite ' + ROLES[t.role].color }, sprite(t.sprite, 7)),
    h('div', {}, roleTag(t.role), h('h1', { text: t.question }), h('p', { class: 'sub', text: t.lead }))));

  if (t.kind === 'checklist') frag.append(checklist(t));
  else frag.append(calculator(t, query));

  if (t.read) frag.append(section('Comment lire le résultat', null, h('ul', { class: 'prose' }, t.read.map((s) => h('li', { text: s })))));
  frag.append(h('p', { class: 'notice', text: t.limits }));
  const siblings = TOOLS.filter((x) => x.role === t.role && x.id !== t.id);
  frag.append(section('Les autres bornes du joueur', null, h('div', { class: 'cabinets' }, siblings.map(toolCard))));
  return frag;
}

function calculator(t, query) {
  const values = {};
  for (const f of t.fields) {
    const raw = query.get(f.key);
    const n = raw == null || raw === '' ? NaN : Number(raw);
    values[f.key] = Number.isFinite(n) ? n : f.value;
  }
  const out = h('div', { class: 'panel result ' + ROLES[t.role].color, 'aria-live': 'polite' });
  const linkFor = () => {
    const q = t.fields.map((f) => `${f.key}=${encodeURIComponent(values[f.key])}`).join('&');
    return `#/outil/${t.id}?${q}`;
  };
  let urlTimer = null;
  const draw = () => {
    out.replaceChildren(h('h2', { class: 'result-title', text: 'Résultat' }), ...[RESULTS[t.id](values)].flat().filter(Boolean));
    // L'adresse suit les chiffres : la page peut être partagée ou rechargée telle quelle.
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      // Seulement si la borne est encore à l'écran : sinon on écraserait l'adresse de la page suivante.
      if (out.isConnected && location.hash.startsWith('#/outil/' + t.id)) history.replaceState(null, '', linkFor());
    }, 300);
  };
  const inputs = [];
  const form = h('form', { class: 'panel form', onsubmit: (e) => e.preventDefault() },
    h('h2', { class: 'result-title', text: 'Tes chiffres' }),
    t.fields.map((f) => {
      const input = h('input', { type: 'number', inputmode: 'decimal', id: 'f-' + f.key, step: f.step, min: f.min, max: f.max, value: values[f.key],
        'aria-describedby': f.hint ? 'h-' + f.key : null,
        oninput: (e) => { values[f.key] = e.target.value === '' ? NaN : Number(e.target.value); draw(); } });
      inputs.push([f, input]);
      return h('div', { class: 'field' },
        h('label', { for: 'f-' + f.key, text: f.label }),
        h('div', { class: 'field-in' }, input, h('span', { class: 'unit', text: f.unit })),
        f.hint ? h('small', { id: 'h-' + f.key, text: f.hint }) : null);
    }),
    h('div', { class: 'form-actions' },
      h('button', { class: 'btn', type: 'button', onclick: () => {
        for (const [f, input] of inputs) { values[f.key] = f.value; input.value = f.value; }
        draw();
      } }, 'Remettre l\'exemple'),
      h('button', { class: 'btn', type: 'button', onclick: () => copyText(location.origin + location.pathname + linkFor(), 'Lien copié, avec tes chiffres.') }, 'Copier le lien')));
  draw();
  return h('div', { class: 'tool-grid' }, form, out);
}

function checklist(t) {
  const items = CHECKLISTS[t.list];
  const key = 'mb-check-' + t.list;
  let done = new Set(store.get(key, []).filter((i) => Number.isInteger(i) && i >= 0 && i < items.length));
  const bar = h('div', { class: 'progress', role: 'img' });
  const count = h('b', {});
  const verdict = h('p', { class: 'verdict' });
  const refresh = () => {
    count.textContent = `${done.size} / ${items.length}`;
    bar.setAttribute('aria-label', `${done.size} sur ${items.length}`);
    bar.replaceChildren(...items.map((_, i) => h('i', { class: i < done.size ? 'on' : '' })));
    verdict.textContent = done.size === items.length ? 'Tout est coché. Fais relire par quelqu\'un qui ne connaît pas le projet.'
      : done.size === 0 ? 'Coche au fur et à mesure : ta progression reste enregistrée dans ce navigateur.'
        : `Il te reste ${plural(items.length - done.size, 'point')} à traiter.`;
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
    h('div', { class: 'result-top' }, h('div', { class: 'score ' + (t.role === 'investisseur' ? 'p2' : '') }, count, h('span', { text: 'points cochés' })), bar),
    verdict, list,
    h('div', { class: 'form-actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
      done = new Set(); store.set(key, []); boxes.forEach((b) => { b.checked = false; }); refresh();
    } }, 'Tout décocher')));
}

function viewLevels() {
  const frag = h('div', { class: 'wrap' });
  frag.append(h('div', { class: 'page-head' }, h('div', { class: 'head-sprite' }, sprite('steps', 7)),
    h('div', {}, h('h1', { text: 'Le parcours' }), h('p', { class: 'sub', text: 'Six niveaux, de l\'idée à la série A. Chaque projet avance à son rythme : certains sautent des niveaux, beaucoup n\'ont jamais besoin de lever des fonds.' }))));
  frag.append(h('ol', { class: 'levels' }, LEVELS.map((l, i) => h('li', { class: 'panel level' },
    h('div', { class: 'level-n' }, h('small', { text: 'Niveau' }), h('b', { text: String(i + 1) })),
    h('div', { class: 'level-body' },
      h('h2', { text: l.name }), h('p', { class: 'level-goal', text: l.goal }),
      h('div', { class: 'level-cols' },
        h('div', {}, h('h3', { class: 'p1', text: 'Côté entrepreneur' }), h('ul', {}, l.todo.map((x) => h('li', { text: x })))),
        h('div', {}, h('h3', { class: 'p2', text: 'Côté investisseur' }), h('p', { text: l.investor }))),
      h('div', { class: 'level-tools' }, h('span', { text: 'Bornes utiles :' }),
        l.tools.map((id) => h('a', { class: 'chip', href: '#/outil/' + id, text: toolById.get(id).name }))))))));
  return frag;
}

/* La carte de pitch : affichage (texte venu de l'adresse : textContent uniquement). */
function pitchCard(card) {
  const traction = [card.t1, card.t2, card.t3].filter(Boolean);
  return h('article', { class: 'pcard' },
    h('header', {}, h('span', { class: 'tag p1', text: card.stage || 'Projet' }), sprite('star', 3)),
    h('h2', { text: card.name || 'Nom du projet' }),
    h('p', { class: 'pcard-tagline', text: card.tagline || 'Ce que fait ton projet, en une phrase.' }),
    card.sector ? h('p', { class: 'pcard-sector', text: card.sector }) : null,
    traction.length ? h('div', { class: 'pcard-block' }, h('h3', { text: 'Traction' }), h('ul', {}, traction.map((x) => h('li', { text: x })))) : null,
    card.ask || card.use ? h('div', { class: 'pcard-block' }, h('h3', { text: 'Recherche' }),
      card.ask ? h('p', { class: 'pcard-ask', text: card.ask }) : null, card.use ? h('p', { text: card.use }) : null) : null,
    card.contact ? h('div', { class: 'pcard-block' }, h('h3', { text: 'Contact' }), h('p', { text: card.contact })) : null,
    h('footer', { text: 'Carte de pitch, faite sur marketbuss' }));
}

function viewPitch(code) {
  const frag = h('div', { class: 'wrap' });
  if (code) {
    const card = calc.decodeCard(code);
    frag.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', { text: card ? 'Carte de pitch' : 'Carte illisible' }),
      h('p', { class: 'sub', text: card ? 'Cette carte a été créée par un visiteur. marketbuss n\'a pas vérifié ce qu\'elle contient.'
        : 'Le lien est incomplet ou abîmé. Demande à son auteur de te le renvoyer.' }))));
    if (card) frag.append(h('div', { class: 'pcard-solo' }, pitchCard(card)));
    frag.append(h('div', { class: 'form-actions' }, h('a', { class: 'btn p1', href: '#/pitch' }, 'Créer ma carte')));
    return frag;
  }
  frag.append(h('div', { class: 'page-head' }, h('div', { class: 'head-sprite' }, sprite('card', 7)),
    h('div', {}, h('h1', { text: 'Ta carte de pitch' }), h('p', { class: 'sub', text: 'Remplis les cases, la carte se met à jour. Le lien contient toute la carte : rien n\'est enregistré sur un serveur.' }))));
  const card = store.get('mb-card', {});
  const holder = h('div', { class: 'pcard-holder' });
  const draw = () => { holder.replaceChildren(pitchCard(card)); store.set('mb-card', card); };
  const field = (key, label, { area = false, placeholder = '', options = null } = {}) => {
    const max = calc.CARD_FIELDS[key];
    const props = { id: 'c-' + key, maxlength: max, placeholder, oninput: (e) => { card[key] = e.target.value; draw(); } };
    const control = options
      ? h('select', { id: 'c-' + key, onchange: (e) => { card[key] = e.target.value; draw(); } },
        h('option', { value: '' }, 'Choisir'), options.map((o) => h('option', { value: o, selected: card[key] === o ? 'selected' : null }, o)))
      : area ? h('textarea', { ...props, rows: 2 }) : h('input', { ...props, type: 'text' });
    if (!options) control.value = card[key] || '';
    return h('div', { class: 'field' }, h('label', { for: 'c-' + key, text: label }), control);
  };
  const link = () => location.origin + location.pathname + '#/pitch/' + calc.encodeCard(card);
  const form = h('form', { class: 'panel form', onsubmit: (e) => e.preventDefault() },
    field('name', 'Nom du projet', { placeholder: 'Nordlys' }),
    field('tagline', 'Ce qu\'il fait, en une phrase', { area: true, placeholder: 'Aide les boulangeries à réduire leurs invendus' }),
    h('div', { class: 'field-row' }, field('stage', 'Stade', { options: STAGES }), field('sector', 'Secteur', { placeholder: 'Alimentation' })),
    field('t1', 'Traction : un chiffre vrai', { placeholder: '38 boulangeries clientes' }),
    field('t2', 'Un deuxième', { placeholder: '9 400 € de revenu par mois' }),
    field('t3', 'Un troisième', { placeholder: '+14 % par mois depuis 6 mois' }),
    h('div', { class: 'field-row' }, field('ask', 'Ce que tu cherches', { placeholder: '800 000 €' }), field('contact', 'Comment te joindre', { placeholder: 'Une adresse créée pour le projet' })),
    field('use', 'À quoi servira l\'argent', { area: true, placeholder: 'Recruter deux développeurs et ouvrir trois villes' }),
    h('p', { class: 'fineprint', text: 'N\'écris que des chiffres vrais et vérifiables. Tout ce que tu mets sur la carte sera visible par ceux qui reçoivent le lien.' }),
    h('div', { class: 'form-actions' },
      h('button', { class: 'btn p1', type: 'button', onclick: () => {
        if (!String(card.name || '').trim()) { toast('Donne d\'abord un nom à ton projet.'); document.getElementById('c-name').focus(); return; }
        copyText(link(), 'Lien de ta carte copié.');
      } }, 'Copier le lien de ma carte'),
      h('button', { class: 'btn', type: 'button', onclick: () => {
        for (const k of Object.keys(card)) delete card[k];
        form.reset();
        draw();
      } }, 'Tout effacer')));
  draw();
  frag.append(h('div', { class: 'tool-grid wide-form' }, form, holder));
  return frag;
}

function viewGlossary() {
  const state = { q: '', who: '' };
  const frag = h('div', { class: 'wrap narrow' });
  frag.append(h('div', { class: 'page-head' }, h('div', { class: 'head-sprite' }, sprite('book', 7)),
    h('div', {}, h('h1', { text: 'Le lexique' }), h('p', { class: 'sub', text: `${GLOSSARY.length} mots de la création d'entreprise et de l'investissement, expliqués simplement.` }))));
  const list = h('dl', { class: 'glossary' });
  const count = h('span', { class: 'count' });
  const draw = () => {
    const q = fold(state.q.trim());
    const rows = GLOSSARY.filter(([term, who, def]) => (!state.who || who.includes(state.who)) && (!q || fold(term + ' ' + def).includes(q)));
    count.textContent = plural(rows.length, 'mot');
    list.replaceChildren(...(rows.length ? rows.map(([term, who, def]) => h('div', {},
      h('dt', {}, term, h('span', { class: 'who' }, who.includes('e') ? h('i', { class: 'key p1', title: 'Utile à l\'entrepreneur' }) : null,
        who.includes('i') ? h('i', { class: 'key p2', title: 'Utile à l\'investisseur' }) : null)),
      h('dd', { text: def })))
      : [h('p', { class: 'empty', text: 'Aucun mot ne correspond. Essaie un autre terme, ou retire le filtre.' })]));
  };
  const segBox = h('div', {});
  const drawSeg = () => segBox.replaceChildren(h('div', { class: 'seg', role: 'group', 'aria-label': 'Joueur' },
    [['', 'Tous'], ['e', 'Entrepreneur'], ['i', 'Investisseur']].map(([id, label]) => h('button', { type: 'button', class: state.who === id ? 'on' : '',
      'aria-pressed': state.who === id ? 'true' : 'false', onclick: () => { state.who = id; drawSeg(); draw(); } }, label))));
  drawSeg();
  frag.append(h('div', { class: 'filters' },
    h('input', { class: 'search', type: 'search', placeholder: 'Chercher un mot', 'aria-label': 'Chercher un mot', oninput: (e) => { state.q = e.target.value; draw(); } }),
    segBox, count));
  frag.append(list);
  frag.append(legend(['p1', 'Utile à l\'entrepreneur'], ['p2', 'Utile à l\'investisseur']));
  draw();
  return frag;
}

function viewAbout() {
  const frag = h('div', { class: 'wrap narrow' });
  frag.append(h('div', { class: 'page-head' }, h('div', {}, h('h1', { text: 'À propos' }),
    h('p', { class: 'sub', text: 'Ce qu\'est marketbuss, et ce que ce n\'est pas.' }))));
  frag.append(section('Ce que tu trouves ici', null, h('ul', { class: 'prose' },
    h('li', { text: `${TOOLS.length} bornes pour chiffrer un projet ou évaluer un investissement, un parcours en six niveaux, un lexique et une carte de pitch à partager.` }),
    h('li', { text: 'Tout est gratuit et sans compte.' }),
    h('li', { text: 'Tout se calcule dans ton navigateur : tes chiffres ne sont envoyés nulle part. Les listes cochées et le brouillon de ta carte restent dans ce navigateur.' }))));
  frag.append(section('Ce que marketbuss n\'est pas', null, h('ul', { class: 'prose' },
    h('li', { text: 'Pas un conseil financier, juridique ou fiscal : les outils servent à comprendre et à s\'entraîner. Avant de signer ou d\'investir, fais-toi accompagner par un professionnel.' }),
    h('li', { text: 'Pas une promesse : investir dans une jeune entreprise est risqué, et on peut perdre toute sa mise.' }),
    h('li', { text: 'Pas un annuaire : marketbuss ne met personne en relation et ne vérifie pas les cartes de pitch créées par les visiteurs.' }))));
  frag.append(section('Les chiffres d\'exemple', null, h('p', { class: 'prose', text: 'Les valeurs affichées à l\'ouverture de chaque borne sont des exemples inventés pour montrer le calcul. Elles ne décrivent aucune entreprise réelle.' })));
  frag.append(section('Fabrication', null, h('p', { class: 'prose', text: 'Le site est une page statique, sans dépendance. Les dessins sont en pixel art, tracés à la main dans le code. Les polices Press Start 2P et Jersey 15 sont sous licence libre OFL et hébergées avec le site.' })));
  return frag;
}

function viewMissing() {
  return h('div', { class: 'wrap' }, h('div', { class: 'page-head' }, h('div', { class: 'head-sprite' }, sprite('lens', 7)),
    h('div', {}, h('h1', { text: 'Page introuvable' }), h('p', { class: 'sub', text: 'Cette page n\'existe pas, ou le lien est incomplet.' }),
      h('div', { class: 'form-actions' }, h('a', { class: 'btn p1', href: '#/' }, 'Retour à l\'accueil'), h('a', { class: 'btn', href: '#/outils' }, 'Voir les bornes')))));
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
    case 'outils': node = viewTools(param); title = ROLES[param] ? ROLES[param].name : 'Les bornes'; break;
    case 'outil': node = viewTool(param, new URLSearchParams(queryPart)); title = (toolById.get(param) || {}).name; break;
    case 'parcours': node = viewLevels(); title = 'Le parcours'; break;
    case 'pitch': node = viewPitch(param); title = 'Carte de pitch'; break;
    case 'lexique': node = viewGlossary(); title = 'Le lexique'; break;
    case 'a-propos': node = viewAbout(); title = 'À propos'; break;
    default: node = viewMissing(); title = 'Page introuvable';
  }
  document.getElementById('view').replaceChildren(node);
  document.title = (title ? title + ' — ' : '') + 'marketbuss — outils pour entrepreneurs et investisseurs';
  const group = { outil: 'outils' }[path] || path;
  for (const a of document.querySelectorAll('[data-nav]')) {
    const on = a.dataset.nav === group;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  if (pathPart !== lastPath) scrollTo(0, 0);
  // Changement de page : le clavier et les lecteurs d'écran repartent du contenu.
  if (event && pathPart !== lastPath) document.getElementById('view').focus({ preventScroll: true });
  lastPath = pathPart;
}

document.getElementById('logo').replaceChildren(sprite('coin', 3));
addEventListener('hashchange', render);
render();
if (calm) document.documentElement.classList.add('calm');
