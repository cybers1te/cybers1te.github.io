// Répondeur IA — la page de présentation.
//
// La démonstration (commerces fictifs, réponses préparées) vient de
// moteur.js. Tout ce que tape le visiteur est affiché avec textContent :
// jamais d'innerHTML avec du texte venu de l'extérieur.

import { SHOPS, answer, greeting, isOpen, nextOpening } from './moteur.js?v=__V__';

/* Les coordonnées affichées dans « Demander une démo ». Laisser vide ce qui
   n'existe pas : seules les entrées remplies sont affichées.
     instagram : nom du compte, sans @
     whatsapp  : numéro au format international, chiffres seulement (ex. 32470123456)
     email     : adresse de contact */
const CONTACT = {
  instagram: '',
  whatsapp: '',
  email: '',
};

const $ = (id) => document.getElementById(id);
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Démonstration ---------- */

let shop = SHOPS[0];
let pending = null; // réponse en attente (le répondeur « écrit »)

const timeText = (d) => `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;

function renderState() {
  const now = new Date();
  const open = isOpen(shop, now);
  const next = nextOpening(shop, now);
  $('shop-name').textContent = shop.name;
  $('shop-avatar').textContent = shop.name.replace(/^(Le|La|Les) /, '').charAt(0);
  $('shop-state').textContent = open
    ? `Il est ${timeText(now)}, ${shop.article} est ouvert`
    : `Il est ${timeText(now)}, ${shop.article} est fermé${next ? '. Le répondeur, lui, répond' : ''}`;
  $('shop-state').classList.toggle('closed', !open);
}

function addMessage(who, text) {
  const log = $('log');
  const el = h('p', { class: 'msg ' + who },
    h('span', { class: 'sr', text: who === 'user' ? 'Vous : ' : 'Répondeur : ' }), text);
  log.append(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

function ask(question) {
  const text = String(question || '').trim().slice(0, 200);
  if (!text || pending) return;
  addMessage('user', text);
  const reply = answer(shop, text, new Date());
  const typing = h('p', { class: 'msg bot typing', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
  $('log').append(typing);
  $('log').scrollTop = $('log').scrollHeight;
  const current = shop;
  pending = setTimeout(() => {
    pending = null;
    typing.remove();
    if (current !== shop) return; // le visiteur a changé de commerce entre-temps
    addMessage('bot', reply.text);
  }, calm ? 0 : 550);
}

function selectShop(id, { focus = false } = {}) {
  shop = SHOPS.find((s) => s.id === id) || SHOPS[0];
  if (pending) { clearTimeout(pending); pending = null; }
  for (const tab of $('demo-tabs').children) {
    const on = tab.dataset.shop === shop.id;
    tab.setAttribute('aria-selected', on ? 'true' : 'false');
    tab.tabIndex = on ? 0 : -1;
  }
  renderState();
  $('log').replaceChildren();
  addMessage('bot', greeting(shop, new Date()));
  $('suggest').replaceChildren(...shop.questions.map((q) =>
    h('button', { type: 'button', class: 'chip', onclick: () => ask(q) }, q)));
  $('ask-input').placeholder = `Une question pour ${shop.article}…`;
  if (focus) $('demo').scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
}

$('demo-tabs').replaceChildren(...SHOPS.map((s) => h('button', {
  type: 'button', role: 'tab', class: 'demo-tab', 'data-shop': s.id, 'aria-selected': 'false',
  onclick: () => selectShop(s.id),
}, s.type)));
// Flèches gauche / droite entre les onglets, comme le veut l'usage.
$('demo-tabs').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const i = SHOPS.indexOf(shop);
  const next = SHOPS[(i + (e.key === 'ArrowRight' ? 1 : -1) + SHOPS.length) % SHOPS.length];
  selectShop(next.id);
  $('demo-tabs').querySelector('[aria-selected="true"]').focus();
  e.preventDefault();
});

$('ask').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('ask-input');
  ask(input.value);
  input.value = '';
});

// « Pour quels commerces » : chaque exemple ouvre la démonstration correspondante.
$('who').replaceChildren(...SHOPS.map((s) => h('li', {},
  h('button', { type: 'button', class: 'who-card', onclick: () => { selectShop(s.id, { focus: true }); ask(s.questions[0]); } },
    h('b', { text: s.type }),
    h('span', { class: 'who-q', text: '«\u00a0' + s.questions[0].replace(/ \?$/, '\u00a0?') + '\u00a0»' }),
    h('span', { class: 'who-go', text: 'Voir la réponse dans la démo' })))));

selectShop(shop.id);
// À l'arrivée, un premier échange est déjà là : on voit tout de suite ce que fait le répondeur.
addMessage('user', shop.questions[0]);
addMessage('bot', answer(shop, shop.questions[0], new Date()).text);
setInterval(renderState, 30000);

/* ---------- Contact ---------- */

const ways = [];
if (/^[\w.]{1,30}$/.test(CONTACT.instagram)) {
  ways.push(h('a', { class: 'btn primary', href: 'https://www.instagram.com/' + CONTACT.instagram, target: '_blank', rel: 'noopener' },
    'Écrire sur Instagram', h('small', { text: '@' + CONTACT.instagram })));
}
if (/^\d{8,15}$/.test(CONTACT.whatsapp)) {
  ways.push(h('a', { class: 'btn primary', href: 'https://wa.me/' + CONTACT.whatsapp, target: '_blank', rel: 'noopener' }, 'Écrire sur WhatsApp'));
}
if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACT.email)) {
  ways.push(h('a', { class: 'btn primary', href: 'mailto:' + CONTACT.email + '?subject=' + encodeURIComponent('Démo du Répondeur IA') },
    'Écrire un e-mail', h('small', { text: CONTACT.email })));
}
$('contact-ways').replaceChildren(...(ways.length ? ways
  : [h('p', { class: 'contact-missing', text: 'Coordonnées à ajouter avant la mise en ligne.' })]));
// Sans coordonnées, les boutons « Demander une démo » ne mènent nulle part d'utile : on le signale.
document.documentElement.dataset.contact = ways.length ? 'ok' : 'missing';
