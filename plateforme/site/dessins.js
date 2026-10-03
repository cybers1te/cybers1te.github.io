// marketbuss — les dessins du site : icônes, personnages, logo.
//
// Tout est tracé en SVG, au trait, comme au stylo : aucune image à télécharger.
// Les icônes viennent de Lucide (icons.js) ; les personnages et la pièce sont
// dessinés ici. Les couleurs suivent le thème (variables CSS).

import { ICONS } from './icons.js?v=__V__';

const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, ...kids) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null && v !== false) node.setAttribute(k, v);
  for (const kid of kids.flat()) if (kid) node.append(kid);
  return node;
}

/* Une icône Lucide. `label` : son nom pour les lecteurs d'écran (sinon elle est décorative). */
export function icon(name, size = 20, label = '') {
  const nodes = ICONS[name] || ICONS['circle-question-mark'];
  return el('svg', { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor', 'stroke-width': 2,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'icon', role: label ? 'img' : null, 'aria-label': label || null, 'aria-hidden': label ? null : 'true' },
  nodes.map(([tag, attrs]) => el(tag, attrs)));
}
export const ICON_NAMES = Object.keys(ICONS);

/* ---------- Personnages ----------
   Un buste au trait : tête, cheveux, col. `top` : la couleur du vêtement
   (une couleur du thème ou un code). Aucun ne représente une personne réelle. */

const SKIN = { clair: '#f6d6bd', mat: '#dfa878', fonce: '#a2673f' };
const HAIR = { brun: '#4a3025', noir: '#23201f', roux: '#d0662a', blond: '#eec14e', gris: '#b9bcc8', blanc: '#eef0f4', rose: '#e46aae' };
const INK = 'var(--ink)';

const PEOPLE = {
  // Les sept profils : le vêtement prend la couleur du profil.
  founder: { skin: 'clair', hair: 'brun', style: 'short', collar: 'hood', top: 'var(--p1)' },
  freelance: { skin: 'clair', hair: 'roux', style: 'long', collar: 'hood', top: 'var(--ok)' },
  investor: { skin: 'mat', hair: 'noir', style: 'glasses', collar: 'tie', top: 'var(--p2)' },
  saver: { skin: 'fonce', hair: 'noir', style: 'short', collar: 'shirt', top: 'var(--violet)' },
  owner: { skin: 'mat', hair: 'brun', style: 'cap', collar: 'shirt', top: 'var(--p5)', hat: 'var(--p5)' },
  merchant: { skin: 'fonce', hair: 'rose', style: 'headset', collar: 'hood', top: 'var(--p6)', hat: 'var(--ink)' },
  household: { skin: 'clair', hair: 'brun', style: 'long', collar: 'plain', top: 'var(--p7)' },
  // Les guides.
  mentor: { skin: 'mat', hair: 'gris', style: 'bun', collar: 'shirt', top: 'var(--hot)' },
  accountant: { skin: 'clair', hair: 'brun', style: 'glasses', collar: 'tie', top: 'var(--sheet)' },
  dev: { skin: 'fonce', hair: 'noir', style: 'headset', collar: 'hood', top: 'var(--ink-2)', hat: 'var(--p2)' },
  designer: { skin: 'clair', hair: 'rose', style: 'short', collar: 'plain', top: 'var(--fluo)' },
  client: { skin: 'mat', hair: 'roux', style: 'cap', collar: 'hood', top: 'var(--p5)', hat: 'var(--hot)' },
  banker: { skin: 'clair', hair: 'blond', style: 'long', collar: 'shirt', top: 'var(--p1)' },
  angel: { skin: 'clair', hair: 'blanc', style: 'long', collar: 'shirt', top: 'var(--p2)' },
  agent: { skin: 'fonce', hair: 'noir', style: 'glasses', collar: 'tie', top: 'var(--p5)' },
  shopkeeper: { skin: 'clair', hair: 'roux', style: 'bun', collar: 'hood', top: 'var(--p6)' },
};

const line = { stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };

function robot() {
  const metal = 'var(--line)';
  return [
    el('path', { d: 'M10 64c0-10 8-16 22-16s22 6 22 16z', fill: metal, ...line }),
    el('rect', { x: 26, y: 53, width: 12, height: 7, rx: 2, fill: 'var(--fluo)', ...line }),
    el('path', { d: 'M32 14V8', fill: 'none', ...line }),
    el('circle', { cx: 32, cy: 6, r: 2.5, fill: 'var(--p2)', ...line }),
    el('rect', { x: 17, y: 14, width: 30, height: 28, rx: 7, fill: 'var(--sheet)', ...line }),
    el('rect', { x: 13, y: 24, width: 4, height: 9, rx: 2, fill: metal, ...line }),
    el('rect', { x: 47, y: 24, width: 4, height: 9, rx: 2, fill: metal, ...line }),
    el('rect', { x: 23.5, y: 22, width: 6, height: 7, rx: 2.5, fill: 'var(--p2)', ...line }),
    el('rect', { x: 34.5, y: 22, width: 6, height: 7, rx: 2.5, fill: 'var(--p2)', ...line }),
    el('path', { d: 'M26 35h12', fill: 'none', ...line }),
    el('path', { d: 'M28 42v6h8v-6', fill: metal, ...line }),
  ];
}

function person({ skin, hair, style, collar, top, hat }) {
  const S = SKIN[skin];
  const H = HAIR[hair];
  const parts = [];
  // Derrière la tête : les cheveux longs, le chignon.
  if (style === 'long') parts.push(el('path', { d: 'M17 46c-4-14-3-35 15-35s19 21 15 35c-3 2-7 1-8-3H25c-1 4-5 5-8 3z', fill: H, ...line }));
  if (style === 'bun') parts.push(el('circle', { cx: 32, cy: 8.5, r: 5.5, fill: H, ...line }));
  // Le buste, puis le cou.
  parts.push(el('path', { d: 'M8 64c0-12 9-18 24-18s24 6 24 18z', fill: top, ...line }));
  parts.push(el('path', { d: 'M26.5 38v9c2 3 9 3 11 0v-9z', fill: S, ...line }));
  if (collar === 'hood') {
    parts.push(el('path', { d: 'M22 47c3 7 17 7 20 0', fill: 'none', ...line }), el('path', { d: 'M29 53v6M35 53v6', fill: 'none', ...line }));
  } else if (collar === 'tie') {
    parts.push(el('path', { d: 'M24 46.5l8 8 8-8 3 2-11 10-11-10z', fill: 'var(--sheet)', ...line }), el('path', { d: 'M32 54.5l-2.5 9.5h5z', fill: 'var(--hot)', ...line }));
  } else if (collar === 'shirt') {
    parts.push(el('path', { d: 'M24 46.5l8 9 8-9 3 2-8 9-3-4-3 4-8-9z', fill: 'var(--sheet)', ...line }));
  } else {
    parts.push(el('path', { d: 'M23 47c3 6 15 6 18 0', fill: 'none', ...line }));
  }
  // La tête et le visage.
  parts.push(el('ellipse', { cx: 32, cy: 27, rx: 12, ry: 13.5, fill: S, ...line }));
  parts.push(el('circle', { cx: 27.5, cy: 28.5, r: 1.4, fill: INK }), el('circle', { cx: 36.5, cy: 28.5, r: 1.4, fill: INK }));
  parts.push(el('path', { d: 'M28 34c2 2.5 6 2.5 8 0', fill: 'none', ...line }));
  // Devant : la frange, la casquette, le casque, les lunettes.
  if (style === 'cap') {
    parts.push(el('path', { d: 'M20 24c0-9 5-14 12-14s12 5 12 14z', fill: hat, ...line }), el('path', { d: 'M20 24h28c3 0 4 4 1 4H24', fill: hat, ...line }));
  } else {
    parts.push(el('path', { d: style === 'long' ? 'M20 27c-1-10 5-15 12-15s13 5 12 15c-4-3-6-6-7-9-3 4-10 7-17 9z' : 'M20 26c-1-10 5-15.5 12-15.5S45 16 44 26c-2-5-5-8-12-8s-10 3-12 8z', fill: H, ...line }));
  }
  if (style === 'headset') {
    parts.push(el('path', { d: 'M19 29c-2-22 28-22 26 0', fill: 'none', ...line, stroke: hat, 'stroke-width': 3 }),
      el('rect', { x: 16, y: 25, width: 6, height: 10, rx: 3, fill: hat, ...line }),
      el('rect', { x: 42, y: 25, width: 6, height: 10, rx: 3, fill: hat, ...line }),
      el('path', { d: 'M19 35c0 5 4 7 9 6', fill: 'none', ...line }));
  }
  if (style === 'glasses') {
    parts.push(el('circle', { cx: 27, cy: 28.5, r: 4.3, fill: 'none', ...line }), el('circle', { cx: 37, cy: 28.5, r: 4.3, fill: 'none', ...line }),
      el('path', { d: 'M31.3 28h1.4M22.7 27.5l-2.5-1M41.3 27.5l2.5-1', fill: 'none', ...line }));
  }
  return parts;
}

export function avatar(name, size = 48, label = '') {
  const p = PEOPLE[name];
  return el('svg', { viewBox: '0 0 64 64', width: size, height: size, class: 'avatar', role: label ? 'img' : null, 'aria-label': label || null, 'aria-hidden': label ? null : 'true' },
    name === 'robot' || !p ? robot() : person(p));
}
export const AVATAR_NAMES = [...Object.keys(PEOPLE), 'robot'];

/* Le logo : une pièce, avec le « m » de marketbuss. */
export function coin(size = 28) {
  return el('svg', { viewBox: '0 0 64 64', width: size, height: size, class: 'coin', 'aria-hidden': 'true' },
    el('circle', { cx: 32, cy: 32, r: 28, fill: 'var(--fluo)', stroke: INK, 'stroke-width': 4 }),
    el('path', { d: 'M20 43V28a6 6 0 0 1 12 0v15M32 28a6 6 0 0 1 12 0v15', fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
}
