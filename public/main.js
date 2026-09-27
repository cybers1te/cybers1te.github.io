// message-me — messagerie en temps réel sur Firebase (Auth + Firestore).
//
// Le site est statique : tout s'exécute dans le navigateur. Firebase
// Authentication gère les comptes, Cloud Firestore stocke les profils, les
// conversations et les messages, et les règles de firestore.rules décident qui
// a le droit de lire et d'écrire quoi. Les écritures de ce fichier doivent
// donc correspondre exactement à ce que ces règles acceptent.
//
// Les messages, photos, fichiers, messages vocaux, sondages, réactions et
// votes sont chiffrés de bout en bout avant de partir (voir e2e.js) :
// Firestore ne reçoit jamais leur contenu en clair. Les appels passent
// directement d'un navigateur à l'autre (calls.js à deux, groupcall.js en
// groupe).
import * as appConfig from './firebase-config.js';
import * as E2E from './e2e.js';
import * as Media from './media.js';
import * as Notify from './notify.js';
import { callsSupported, createCalls, screenShareSupported } from './calls.js';
import { createGroupCalls } from './groupcall.js';

const { firebaseConfig } = appConfig;

const SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';
const GUIDE = 'https://github.com/cybers1te/cybers1te.github.io/blob/main/FIREBASE.md';

// Mêmes limites que firestore.rules.
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const MAX_NAME = 40;
const MAX_TITLE = 60;
const MAX_TEXT = 2000;
const MAX_MEMBERS = 20;
const HISTORY = 200;          // messages chargés par conversation
const RUN_GAP = 5 * 60 * 1000; // deux messages d'une même personne à moins de 5 min forment un bloc
const TYPING_MS = 6000;        // durée d'affichage de « … écrit » après un signal
const TYPING_EVERY = 3000;     // on signale sa saisie au plus toutes les 3 s
const MAX_DESC = 300;          // description d'un groupe
const DEFAULT_PERMS = { send: 'all', info: 'all', add: 'all' };
const FOREVER = Date.UTC(9999, 0, 1); // sourdine « toujours »
const MUTE_CHOICES = [['1 heure', 3600e3], ['8 heures', 8 * 3600e3], ['1 semaine', 7 * 864e5], ['Toujours', 0]];
const SILENCE_CHOICES = [['15 minutes', 15 * 60e3], ['1 heure', 3600e3], ['8 heures', 8 * 3600e3],
  ['24 heures', 864e5], ['7 jours', 7 * 864e5]];

// Projet fictif utilisé avec les émulateurs locaux (npm run dev, puis
// http://127.0.0.1:5000/?emulateurs).
const DEMO_CONFIG = {
  apiKey: 'demo-key',
  authDomain: 'demo-message-me.firebaseapp.com',
  projectId: 'demo-message-me',
  appId: 'demo',
};

const root = document.getElementById('app');
const toasts = document.getElementById('toasts');
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
const emulate = isLocal && new URLSearchParams(location.search).has('emulateurs');
const configured = Boolean(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);
const coarse = window.matchMedia('(pointer: coarse)').matches;

let A, F, auth, db; // modules et instances Firebase

/* ======================================================================== */
/* Outils                                                                   */
/* ======================================================================== */

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

const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M5 12l14-7-5 15-2.6-5.4z"/><path d="M19 5l-7.6 9.6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  leave: '<path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10"/><path d="M15 16l4-4-4-4M19 12H9"/>',
  logout: '<path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14"/><path d="M9 16l-4-4 4-4M5 12h10"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
  chats: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v5a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V14h0.5A2.5 2.5 0 0 1 4 11.5z"/><path d="M17 8.5h0.5A2.5 2.5 0 0 1 20 11v5a2.5 2.5 0 0 1-2.5 2.5H17V21l-3.5-2.5H11"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
  micOff: '<path d="M9 9v2.5a3 3 0 0 0 5.2 2M15 11.5V6.5a3 3 0 0 0-5.8-1"/><path d="M5.5 11.5a6.5 6.5 0 0 0 10.4 5.2M18.5 11.5a6.4 6.4 0 0 1-.6 2.7M12 18v3M4 4l16 16"/>',
  phone: '<path d="M5 4.5h3.2l1.6 4-2.1 1.3a11 11 0 0 0 6.5 6.5l1.3-2.1 4 1.6V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z"/>',
  hangup: '<path d="M3.2 14.6l-.4-2.3a1.6 1.6 0 0 1 .9-1.7 18.5 18.5 0 0 1 16.6 0 1.6 1.6 0 0 1 .9 1.7l-.4 2.3a1.3 1.3 0 0 1-1.6 1l-3-.7a1.3 1.3 0 0 1-1-1.2l-.1-1.6a12.3 12.3 0 0 0-5.3 0l-.1 1.6a1.3 1.3 0 0 1-1 1.2l-3 .7a1.3 1.3 0 0 1-1.5-1z"/>',
  video: '<rect x="3" y="6.5" width="12.5" height="11" rx="2.5"/><path d="M15.5 10.5l5.5-3v9l-5.5-3z"/>',
  videoOff: '<path d="M8 6.5h5A2.5 2.5 0 0 1 15.5 9v4.5M15.5 10.5l5.5-3v9l-4-2.2M15 17.5H5.5A2.5 2.5 0 0 1 3 15V9a2.5 2.5 0 0 1 1.6-2.3M3 3l18 18"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  pause: '<path d="M8 5.5v13M16 5.5v13" stroke-width="3.2"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l1 12.5h9l1-12.5M10 10.5v6M14 10.5v6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
  bellOff: '<path d="M8.6 5.4A6 6 0 0 1 18 11v4.2M6 11v5.5l-1.5 2h13M10 20.5a2.2 2.2 0 0 0 4 0M4 4l16 16"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.2a5.5 5.5 0 0 1 3 4.8"/>',
  userPlus: '<circle cx="10" cy="8.5" r="3.2"/><path d="M4 19a6 6 0 0 1 12 0M18.5 8v6M15.5 11h6"/>',
  edit: '<path d="M5 19h3.5l9.7-9.7a2.1 2.1 0 0 0-3-3L5.5 16z"/><path d="M13.8 7.7l2.5 2.5"/>',
  shield: '<path d="M12 3.8l6.5 2.4v5.3c0 4-2.7 7.3-6.5 8.7-3.8-1.4-6.5-4.7-6.5-8.7V6.2z"/>',
  ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  hush: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/><path d="M9.5 7.8l5 4.4M14.5 7.8l-5 4.4"/>',
  message: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chevron: '<path d="M9.5 5.5l6.5 6.5-6.5 6.5"/>',
  star: '<path d="M12 4.5l2.3 4.7 5.2.8-3.8 3.6.9 5.2L12 16.4l-4.6 2.4.9-5.2-3.8-3.6 5.2-.8z"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.6-1.1-2.7 0-.9.7-1.6 1.6-1.6h2.2a4 4 0 0 0 4-4c0-3.9-3.8-7-8.5-7z"/><circle cx="8" cy="11.5" r=".9"/><circle cx="10.8" cy="7.6" r=".9"/><circle cx="15.3" cy="8.2" r=".9"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  volume: '<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  eye: '<path d="M2.8 12s3.4-6.5 9.2-6.5 9.2 6.5 9.2 6.5-3.4 6.5-9.2 6.5S2.8 12 2.8 12z"/><circle cx="12" cy="12" r="2.8"/>',
  more: '<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>',
  reply: '<path d="M10 7.5L5 12l5 4.5"/><path d="M5.5 12H14a5 5 0 0 1 5 5v1.5"/>',
  smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14a4 4 0 0 0 7 0"/><path d="M9 9.5v.1M15 9.5v.1"/>',
  poll: '<path d="M5 20V11M12 20V5M19 20v-6"/>',
  file: '<path d="M13.5 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9.5z"/><path d="M13.5 3.5v6h6"/>',
  pin: '<path d="M9 4h6l-1 5 3 3v2H7v-2l3-3z"/><path d="M12 14v6"/>',
  archive: '<rect x="3.5" y="4.5" width="17" height="4.5" rx="1.5"/><path d="M5.5 9v8.5A2 2 0 0 0 7.5 19.5h9a2 2 0 0 0 2-2V9M10 13h4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6.8"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
  timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 3h5"/>',
  camera: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
  screen: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  downSmall: '<path d="M6 9l6 6 6-6"/>',
  wifiOff: '<path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.8a10 10 0 0 1 4-2.3M19 12.8a10 10 0 0 0-2.6-1.8M2 9.3a15 15 0 0 1 5-3M22 9.3A15 15 0 0 0 11 5.1"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>',
  installApp: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3M10 18.5h4"/>',
};

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'i');
  svg.innerHTML = ICONS[name];
  return svg;
}

function logo() {
  const mark = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  mark.setAttribute('viewBox', '0 0 32 32');
  mark.setAttribute('aria-hidden', 'true');
  mark.setAttribute('class', 'logo-mark');
  mark.innerHTML = '<rect width="32" height="32" rx="9" class="logo-bg"/>' +
    '<path d="M8 11.5A4.5 4.5 0 0 1 12.5 7h7A4.5 4.5 0 0 1 24 11.5v4a4.5 4.5 0 0 1-4.5 4.5H15l-5 4v-4.4A4.5 4.5 0 0 1 8 15.5z" class="logo-fg"/>';
  return h('span', { class: 'logo' }, mark, h('span', { class: 'logo-word' }, 'message', h('b', {}, '-me')));
}

function mount(...nodes) {
  root.replaceChildren(...nodes);
}

function toast(message, kind = 'info') {
  const t = h('p', { class: 'toast toast-' + kind, text: message });
  toasts.append(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, kind === 'error' ? 6500 : 4000);
}

function hue(seed) {
  let n = 0;
  for (const ch of String(seed)) n = (n * 31 + ch.codePointAt(0)) >>> 0;
  return n % 360;
}

function initials(label) {
  const words = String(label || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  const first = [...words[0]][0] || '';
  const second = words.length > 1 ? [...words[words.length - 1]][0] || '' : '';
  return (first + second).toUpperCase();
}

function avatar(seed, label, extra = '') {
  const el = h('span', {
    class: 'avatar ' + extra,
    style: '--hue:' + hue(seed),
    'aria-hidden': 'true',
    text: initials(label),
  });
  const pv = db ? photoVersion(seed) : null;
  if (pv) {
    const hit = photos.get(pv.key);
    const paint = (url) => {
      if (!url) return;
      el.style.backgroundImage = 'url("' + url + '")';
      el.classList.add('has-photo');
    };
    if (hit && hit.v === pv.v && hit.url) paint(hit.url);
    else photoUrl(pv).then(paint);
  }
  return el;
}

/* Photo d'un compte (avatars/{uid}) ou d'un groupe (conversations/{cid}/photo),
   rechargée quand sa version (date de mise à jour) change. */
const photos = new Map(); // 'u:uid' | 'g:cid' -> { v, job, url }

function photoVersion(seed) {
  const p = people.get(seed);
  if (p && p !== 'pending') return p.photo ? { key: 'u:' + seed, kind: 'u', id: seed, v: ts(p.photo) } : null;
  const conv = state.convs.find((c) => c.id === seed);
  if (conv && conv.photo) return { key: 'g:' + seed, kind: 'g', id: seed, v: ts(conv.photo) };
  return null;
}

function photoUrl(pv) {
  const hit = photos.get(pv.key);
  if (hit && hit.v === pv.v) return hit.job;
  if (hit && hit.url) URL.revokeObjectURL(hit.url);
  const ref = pv.kind === 'u' ? F.doc(db, 'avatars', pv.id) : F.doc(db, 'conversations', pv.id, 'photo', 'current');
  const entry = { v: pv.v, url: null, job: null };
  entry.job = F.getDoc(ref)
    .then((snap) => {
      if (!snap.exists()) return null;
      entry.url = URL.createObjectURL(new Blob([snap.data().data.toUint8Array()], { type: 'image/jpeg' }));
      return entry.url;
    })
    .catch(() => null);
  photos.set(pv.key, entry);
  return entry.job;
}

const ts = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : 0);

const fmtTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const fmtWeekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
const fmtShort = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const fmtDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtDayYear = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function startOfDay(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function listTime(t) {
  if (!t) return '';
  const today = startOfDay(Date.now());
  const day = startOfDay(t);
  if (day === today) return fmtTime.format(t);
  if (day === today - 864e5) return 'Hier';
  if (today - day < 6 * 864e5) return fmtWeekday.format(t).replace('.', '');
  return fmtShort.format(t);
}

function dayLabel(t) {
  const today = startOfDay(Date.now());
  const day = startOfDay(t);
  if (day === today) return "Aujourd'hui";
  if (day === today - 864e5) return 'Hier';
  const sameYear = new Date(t).getFullYear() === new Date().getFullYear();
  const s = (sameYear ? fmtDay : fmtDayYear).format(t);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const URL_RE = /https?:\/\/[^\s<>"]+/g;

function richText(text) {
  const frag = document.createDocumentFragment();
  let last = 0;
  let m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text))) {
    let url = m[0];
    const trail = url.match(/[.,;:!?)\]'»]+$/);
    if (trail) url = url.slice(0, -trail[0].length);
    frag.append(text.slice(last, m.index));
    frag.append(h('a', { href: url, target: '_blank', rel: 'noopener noreferrer nofollow' }, url));
    last = m.index + url.length;
    URL_RE.lastIndex = last;
  }
  frag.append(text.slice(last));
  return frag;
}

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*\s*){1,3}$/u;

function normalizeUsername(v) {
  return String(v || '').trim().replace(/^@+/, '').toLowerCase();
}

/* Messages d'erreur compréhensibles, avec un renvoi vers l'étape du guide
   quand l'erreur vient d'une configuration Firebase incomplète. */
function describe(err) {
  // Les erreurs du navigateur (DOMException) portent leur nom dans `name` ;
  // leur `code` est un vieux numéro sans intérêt.
  const code = (err && typeof err.code === 'string' && err.code) || (err && err.name !== 'Error' && err.name) || '';
  const map = {
    'auth/invalid-credential': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/wrong-password': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/user-not-found': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/invalid-login-credentials': 'Adresse e-mail ou mot de passe incorrect.',
    'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse e-mail.',
    'auth/invalid-email': 'Adresse e-mail invalide.',
    'auth/missing-email': 'Indique ton adresse e-mail.',
    'auth/missing-password': 'Indique ton mot de passe.',
    'auth/weak-password': 'Mot de passe trop faible : 8 caractères minimum.',
    'auth/password-does-not-meet-requirements': 'Ce mot de passe ne respecte pas les exigences du site.',
    'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
    'auth/network-request-failed': 'Connexion réseau impossible. Vérifie ta connexion Internet.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/account-exists-with-different-credential':
      'Un compte existe déjà avec cette adresse e-mail : connecte-toi avec ton mot de passe.',
    'auth/popup-blocked': 'La fenêtre de connexion a été bloquée : autorise les fenêtres pour ce site.',
    'auth/requires-recent-login': 'Par sécurité, déconnecte-toi puis reconnecte-toi avant de réessayer.',
    'auth/operation-not-allowed':
      'La connexion par e-mail n\'est pas activée dans Firebase (guide, étape 3).',
    'auth/configuration-not-found':
      'Firebase Authentication n\'est pas activé sur ce projet (guide, étape 3).',
    'auth/unauthorized-domain':
      'Ce site n\'est pas un domaine autorisé dans Firebase Authentication (guide, étape 6).',
    'auth/invalid-api-key':
      'La clé d\'API de public/firebase-config.js est invalide (guide, étape 5).',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      'La clé d\'API de public/firebase-config.js est invalide (guide, étape 5).',
    'permission-denied':
      'Accès refusé par les règles Firestore. Les règles de firestore.rules sont-elles publiées ? (guide, étape 4)',
    'not-found': 'Base Firestore introuvable : crée-la dans la console Firebase (guide, étape 4).',
    'unavailable': 'Firebase est injoignable pour le moment. Nouvelle tentative automatique…',
    'resource-exhausted': 'La limite gratuite de Firebase est atteinte pour aujourd\'hui. Réessaie demain.',
    'invalid-argument': 'Fichier trop volumineux pour être envoyé.',
    'NotAllowedError': 'Accès au micro ou à la caméra refusé. Autorise-le dans les réglages du site (icône à gauche de l\'adresse).',
    'SecurityError': 'Accès au micro ou à la caméra refusé. Autorise-le dans les réglages du site (icône à gauche de l\'adresse).',
    'NotFoundError': 'Aucun micro ou caméra détecté sur cet appareil.',
    'NotReadableError': 'Le micro ou la caméra est déjà utilisé par une autre application.',
    'OverconstrainedError': 'Le micro ou la caméra ne convient pas. Essaie un autre appareil.',
    'not-image': 'Ce fichier n\'est pas une image.',
    'image-decode': 'Impossible de lire cette image. Essaie un autre format (JPEG, PNG).',
    'too-big': 'Fichier trop volumineux, même après compression.',
    'busy': 'Un appel est déjà en cours.',
  };
  if (map[code]) return map[code];
  if (code.startsWith('auth/requests-from-referer')) return map['auth/unauthorized-domain'];
  return 'Une erreur est survenue' + (code ? ' (' + code + ')' : '') + '.';
}

async function busy(button, work) {
  button.disabled = true;
  button.classList.add('is-busy');
  try {
    return await work();
  } finally {
    button.disabled = false;
    button.classList.remove('is-busy');
  }
}

/* ======================================================================== */
/* État                                                                     */
/* ======================================================================== */

const state = {
  screen: null,        // 'setup' | 'splash' | 'auth' | 'onboard' | 'main'
  user: null,          // utilisateur Firebase Auth
  profile: null,       // users/{uid}
  convs: [],
  convsReady: false,
  activeId: null,
  messages: [],
  messagesReady: false,
  filter: '',
  limit: 200,          // messages chargés dans la conversation ouverte
  search: null,        // recherche dans la conversation : { q, hits, i }
  showArchived: false,
  authMode: 'login',
  settings: { blocked: new Set(), muted: {}, pinned: [], archived: [], keys: {}, verified: {}, hidePresence: false }, // settings/{uid} : réglages privés
};

const people = new Map();   // uid -> { name, username, publicKey } | 'pending'
const drafts = new Map();   // brouillon par conversation
const markedRead = new Map(); // cid -> id du dernier message déjà marqué lu
const plain = new Map();    // contentKey() -> { state, kind, text, payload } (voir content())
const decrypting = new Map(); // contentKey() -> déchiffrement en cours
const notesCache = new Map(); // 'cid/mid/uid/ct' -> note déchiffrée { r, v } (réaction, vote)
const noteKeys = new Map();   // contentKey() -> Promise de la clé des notes du message
const mediaUrls = new Map(); // 'cid/mid' -> Promise de l'URL locale du fichier déchiffré
const rowCache = new Map();  // mid -> { sig, node } : lignes déjà dessinées de la conversation ouverte
const typingSeen = new Map(); // 'cid/uid' -> dernier signal de saisie reçu
const typingUntil = new Map(); // 'cid/uid' -> fin d'affichage de « … écrit »
const lastSeenMsg = new Map(); // cid -> dernier message déjà signalé (notifications)
const announcedCalls = new Set();
const restrictions = new Map(); // uid -> fin de la privation de parole (groupe ouvert)
const revealed = new Set();   // messages de personnes bloquées affichés quand même
const unsub = { profile: null, convs: null, msgs: null, settings: null, restr: null };
let convsInit = false;
let calls = null;           // appels (calls.js), si le navigateur les gère
let group = null;           // appels de groupe (groupcall.js)
let groupLayer = null;      // écran d'un appel de groupe
const seenRooms = new Map(); // cid -> appel de groupe déjà signalé
const tidied = new Set();   // annonces d'appel de groupe déjà vérifiées
let callLayer = null;       // écran d'appel
let endedCall = null;       // appel qui vient de se terminer (écran de fin)
let unsubPlayer = null;
let lastTypingSent = 0;
let pendingProfile = null;  // pseudo choisi à l'inscription, réservé dès la connexion
let claiming = false;
let ui = null;              // éléments de l'interface principale
let panel = null;           // fenêtre d'infos ouverte : { cid, render }
let wakeTimer = null;       // fin d'une sourdine ou d'une privation de parole
let knownIds = new Set();   // conversations de l'instantané précédent

// Chiffrement : `vault` est la clé privée déverrouillée du compte connecté.
// `secret` garde le mot de passe tapé à la connexion le temps de déverrouiller
// la clé, puis il est oublié.
let vault = null;           // { uid, publicKey, privateKey }
let secret = null;
let opening = false;
let recoveryToShow = null;  // code de secours à montrer une fois

function userError(message) {
  return Object.assign(new Error(message), { userMessage: message });
}

function teardown() {
  if (ui && ui.composer && ui.composer.cleanup) ui.composer.cleanup();
  if (calls) calls.dispose();
  calls = null;
  if (group) group.leave();
  group = null;
  if (groupLayer) {
    clearInterval(groupLayer.timer);
    groupLayer.el.remove();
    groupLayer = null;
  }
  seenRooms.clear();
  tidied.clear();
  Notify.stopRingtone();
  endedCall = null;
  if (callLayer) {
    clearInterval(callLayer.timer);
    callLayer.el.remove();
    callLayer = null;
  }
  if (unsubPlayer) unsubPlayer();
  unsubPlayer = null;
  Media.player.stop();
  for (const job of mediaUrls.values()) job.then((url) => URL.revokeObjectURL(url)).catch(() => {});
  mediaUrls.clear();
  rowCache.clear();
  typingSeen.clear();
  typingUntil.clear();
  lastSeenMsg.clear();
  announcedCalls.clear();
  restrictions.clear();
  revealed.clear();
  if (panel && panel.dlg.open) panel.dlg.close();
  panel = null;
  if (presenceWatch) presenceWatch.unsub();
  presenceWatch = null;
  clearTimeout(wakeTimer);
  knownIds = new Set();
  state.settings = { blocked: new Set(), muted: {}, pinned: [], archived: [], keys: {}, verified: {}, hidePresence: false };
  photos.clear();
  presenceAt.clear();
  clearInterval(presenceTimer);
  presenceTimer = null;
  convsInit = false;
  lastTypingSent = 0;
  for (const k of Object.keys(unsub)) {
    if (unsub[k]) unsub[k]();
    unsub[k] = null;
  }
  state.profile = null;
  state.convs = [];
  state.convsReady = false;
  state.activeId = null;
  state.messages = [];
  state.messagesReady = false;
  state.filter = '';
  people.clear();
  drafts.clear();
  markedRead.clear();
  plain.clear();
  decrypting.clear();
  notesCache.clear();
  noteKeys.clear();
  vault = null;
  recoveryToShow = null;
  ui = null;
  document.title = 'message-me';
}

const me = () => (state.user ? state.user.uid : null);

/* Préférences propres à cet appareil (sons, aperçu, thème). */
function pref(key, fallback) {
  try { return localStorage.getItem('mm-' + key) || fallback; } catch { return fallback; }
}

function setPref(key, value) {
  try { localStorage.setItem('mm-' + key, value); } catch { /* stockage indisponible */ }
}

const soundsOn = () => pref('sons', 'oui') === 'oui';
const previewOn = () => pref('apercu', 'oui') === 'oui';

function applyTheme() {
  const theme = pref('theme', 'auto');
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

function person(uid) {
  const p = people.get(uid);
  return p && p !== 'pending' ? p : null;
}

let renderQueued = false;
function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    if (state.screen !== 'main') return;
    renderConvList();
    renderChatHead();
    renderMessages();
    renderGate();
    if (panel) panel.render();
  });
}

async function fetchPerson(uid) {
  const ref = F.doc(db, 'users', uid);
  // Hors ligne, la copie locale répond tout de suite (sinon on attendrait).
  const snap = navigator.onLine ? await F.getDoc(ref) : await F.getDocFromCache(ref).catch(() => F.getDoc(ref));
  const p = snap.exists() ? snap.data() : { name: 'Compte supprimé', username: '', gone: true };
  people.set(uid, p);
  return p;
}

function ensurePeople(uids) {
  for (const uid of uids) {
    if (people.has(uid)) continue;
    people.set(uid, 'pending');
    fetchPerson(uid)
      .catch(() => people.delete(uid))
      .finally(scheduleRender);
  }
}

/* Contenu en clair d'un message (ou de l'aperçu d'une conversation, qui porte
   le même identifiant) : { state, kind, text, payload }.
     state : 'ok' | 'legacy' (envoyé avant le chiffrement) | 'pending' | 'error'
             | 'deleted' (supprimé pour tout le monde) | 'expired' (éphémère échu)
     kind  : 'text' | 'image' | 'audio' | 'file' | 'poll' | 'call'
             | 'event' (vie du groupe)
   Déchiffre à la demande et redessine ensuite. */
const LOCKED = { state: 'error', kind: 'text', text: '' };
const DELETED = { state: 'deleted', kind: 'deleted', text: '' };
const EXPIRED = { state: 'expired', kind: 'expired', text: '' };
const RICH_KINDS = ['text', 'image', 'audio', 'file', 'poll', 'call', 'event'];

function readPayload(v, raw) {
  if (v !== 2) return { state: 'ok', kind: 'text', text: raw };
  try {
    const p = JSON.parse(raw);
    if (p && RICH_KINDS.includes(p.t)) {
      const text = p.t === 'text' ? p.text : p.t === 'poll' ? p.q : p.caption;
      return { state: 'ok', kind: p.t, text: typeof text === 'string' ? text : '', payload: p };
    }
  } catch {
    // Enveloppe illisible.
  }
  return LOCKED;
}

/* Clé de cache du contenu : elle change quand le message est modifié. */
const contentKey = (cid, m) => cid + '/' + m.id + (m.enc && m.enc.ct ? '/' + m.enc.ct.slice(-16) : '');
const expired = (m) => Boolean(m.exp) && ts(m.exp) > 0 && ts(m.exp) <= Date.now();

function decryptContent(cid, m) {
  if (m.deleted) return Promise.resolve(DELETED);
  if (expired(m)) return Promise.resolve(EXPIRED);
  if (typeof m.text === 'string') return Promise.resolve({ state: 'legacy', kind: 'text', text: m.text });
  const key = contentKey(cid, m);
  if (plain.has(key)) return Promise.resolve(plain.get(key));
  if (decrypting.has(key)) return decrypting.get(key);
  if (!m.enc || !vault) return Promise.resolve(LOCKED);
  const holder = vault;
  const job = E2E.decryptMessage(m.enc, holder.uid, holder.privateKey, cid, m.uid)
    .then((raw) => readPayload(m.enc.v, raw), () => LOCKED)
    .then((c) => {
      decrypting.delete(key);
      if (vault === holder) plain.set(key, c);
      return c;
    });
  decrypting.set(key, job);
  return job;
}

function content(cid, m) {
  if (m.deleted) return DELETED;
  if (expired(m)) return EXPIRED;
  if (typeof m.text === 'string') return { state: 'legacy', kind: 'text', text: m.text };
  const key = contentKey(cid, m);
  const hit = plain.get(key);
  if (hit) return hit;
  if (!m.enc || !vault) return LOCKED;
  if (!decrypting.has(key)) decryptContent(cid, m).then(scheduleRender);
  return { state: 'pending', kind: 'text', text: '' };
}

function spokenDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0');
}

function callLabel(p, mine) {
  const kind = p.video ? 'Appel vidéo' : 'Appel vocal';
  if (p.status === 'ended') return kind + ' · ' + spokenDuration(p.duration);
  if (p.status === 'declined') return kind + ' refusé';
  if (p.status === 'failed') return kind + ' : connexion impossible';
  return kind + (mine ? ' sans réponse' : ' manqué');
}

const nameOf = (uid) => (person(uid) || {}).name || '…';

function joinNames(names) {
  return names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' et ' + names[names.length - 1];
}

const fmtUntil = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/* « 15:30 », « demain 15:30 » ou « lun. 29 sept., 15:30 ». */
function untilText(t) {
  const day = startOfDay(t);
  const today = startOfDay(Date.now());
  if (day === today) return fmtTime.format(t);
  if (day === today + 864e5) return 'demain ' + fmtTime.format(t);
  return fmtUntil.format(t);
}

function permsText(p) {
  if (!p || typeof p !== 'object') return '';
  const only = [];
  if (p.send === 'admins') only.push('écrire');
  if (p.info === 'admins') only.push('modifier les infos');
  if (p.add === 'admins') only.push('ajouter des membres');
  return only.length ? 'seuls les admins peuvent ' + joinNames(only) : 'tous les membres peuvent tout faire';
}

/* Événement de la vie d'un groupe (ajout, départ, rôle…), écrit du point de
   vue de chacun : « Alice a ajouté Bob », « Tu as quitté le groupe ». Ces
   textes évitent les accords de genre. */
function eventText(p, author) {
  const mine = author === me();
  const who = mine ? 'Tu' : nameOf(author);
  const has = who + (mine ? ' as ' : ' a ');
  const targets = (Array.isArray(p.targets) ? p.targets : []).filter((t) => typeof t === 'string').slice(0, 20);
  const target = targets[0];
  const toMe = target === me();
  const clip = (t) => [...String(t || '')].slice(0, MAX_TITLE).join('');
  const names = joinNames(targets.map((t) => (t === me() ? 'toi' : nameOf(t))));
  switch (p.e) {
    case 'create':
      return has + 'créé le groupe « ' + clip(p.title) + ' »' + (targets.length ? ' avec ' + names : '');
    case 'add':
      return targets.length === 1 && toMe ? who + ' t\'a fait entrer dans le groupe' : has + 'ajouté ' + names;
    case 'remove':
      return toMe ? who + ' t\'a fait sortir du groupe' : has + 'retiré ' + names + ' du groupe';
    case 'leave':
      return has + 'quitté le groupe' + (typeof p.heir === 'string'
        ? ' · ' + (p.heir === me() ? 'tu as' : nameOf(p.heir) + ' a') + ' maintenant les droits d\'admin' : '');
    case 'promote':
      return toMe ? who + ' t\'a donné les droits d\'admin' : has + 'donné les droits d\'admin à ' + names;
    case 'demote':
      if (target === author) return has + 'renoncé à ' + (mine ? 'tes' : 'ses') + ' droits d\'admin';
      return toMe ? who + ' t\'a retiré les droits d\'admin' : has + 'retiré les droits d\'admin à ' + names;
    case 'claim':
      return has + 'repris les droits d\'admin du groupe';
    case 'silence': {
      const until = Number(p.until) ? ' jusqu\'à ' + untilText(Number(p.until)) : '';
      return (toMe ? who + ' t\'a retiré la parole' : has + 'retiré la parole à ' + names) + until;
    }
    case 'unsilence':
      return toMe ? who + ' t\'a rendu la parole' : has + 'rendu la parole à ' + names;
    case 'title':
      return has + 'renommé le groupe « ' + clip(p.title) + ' »';
    case 'description':
      return has + 'modifié la description du groupe';
    case 'perms':
      return has + 'modifié les réglages : ' + permsText(p.perms);
    case 'ttl':
      return Number(p.ttl)
        ? has + 'activé les messages éphémères : ils disparaissent après ' + (TTL_LABELS[p.ttl] || 'un délai')
        : has + 'désactivé les messages éphémères';
    case 'join':
      return has + 'rejoint le groupe avec le lien d\'invitation';
    case 'photo':
      return has + 'changé la photo du groupe';
    case 'room':
      return has + 'lancé un appel ' + (p.video ? 'vidéo' : 'vocal') + ' de groupe';
    default:
      return 'Le groupe a été modifié';
  }
}

/* Cet événement me concerne directement (on m'a ajouté, retiré la parole…). */
function eventForMe(p) {
  return Array.isArray(p.targets) && p.targets.includes(me())
    && ['create', 'add', 'promote', 'demote', 'silence', 'unsilence'].includes(p.e);
}

/* Résumé d'une ligne : aperçu de la liste, notifications. */
function summary(c, mine, author) {
  if (c.state === 'pending') return '…';
  if (c.state === 'error') return '🔒 Message illisible';
  if (c.state === 'deleted') return '🚫 Message supprimé';
  if (c.state === 'expired') return '⏱ Message éphémère expiré';
  if (c.kind === 'image') return '📷 Photo' + (c.text ? ' · ' + c.text : '');
  if (c.kind === 'audio') return '🎤 Message vocal (' + Media.formatDuration(c.payload.duration) + ')';
  if (c.kind === 'file') return '📄 ' + fileName(c.payload) + (c.text ? ' · ' + c.text : '');
  if (c.kind === 'poll') return '📊 Sondage : ' + c.text;
  if (c.kind === 'call') return '📞 ' + callLabel(c.payload, mine);
  if (c.kind === 'event') return eventText(c.payload, author);
  return c.text;
}

/* Type du fichier, choisi par l'expéditeur : seuls des formats d'image et de
   son inoffensifs sont gardés. Une « photo » en text/html ou image/svg+xml,
   ouverte dans un onglet, exécuterait du code sur ce site. */
const SAFE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  audio: ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/aac', 'audio/wav', 'audio/x-m4a'],
};

/* Nom de fichier affichable et sûr (sans chemin), 120 caractères au plus. */
function fileName(p) {
  const name = String((p && p.name) || 'fichier').split(/[\\/]/).pop().replace(/[\u0000-\u001f]/g, '').trim();
  return [...(name || 'fichier')].slice(0, 120).join('');
}

function safeType(p) {
  const base = String(p.mime || '').split(';')[0].trim().toLowerCase();
  return (SAFE_TYPES[p.t] || []).includes(base) ? base : 'application/octet-stream';
}

/* Fichier chiffré d'un message, déchiffré en mémoire : URL locale (blob:). */
function mediaUrl(cid, mid, p) {
  const key = cid + '/' + mid;
  if (!mediaUrls.has(key)) {
    const job = F.getDoc(F.doc(db, 'conversations', cid, 'media', mid))
      .then((snap) => {
        if (!snap.exists()) throw new Error('missing');
        return E2E.decryptBlob(snap.data().data.toUint8Array(), p.key, p.iv, cid, mid);
      })
      .then((bytes) => URL.createObjectURL(new Blob([bytes], { type: safeType(p) })));
    job.catch(() => {});
    mediaUrls.set(key, job);
  }
  return mediaUrls.get(key);
}

/* « … écrit » : membres dont un signal de saisie est récent. */
function typers(conv) {
  const now = Date.now();
  return conv.members.filter((uid) => uid !== me() && !isBlocked(uid)
    && (typingUntil.get(conv.id + '/' + uid) || 0) > now);
}

function typingText(conv) {
  const who = typers(conv);
  if (!who.length) return '';
  if (conv.type !== 'group') return 'écrit…';
  const names = who.map((uid) => (person(uid) || {}).name || '…');
  return names.length === 1 ? names[0] + ' écrit…'
    : names.slice(0, -1).join(', ') + ' et ' + names[names.length - 1] + ' écrivent…';
}

function otherUid(conv) {
  return conv.members.find((m) => m !== me()) || me();
}

function convTitle(conv) {
  if (conv.type === 'group') return conv.title;
  const p = person(otherUid(conv));
  return p ? p.name : '…';
}

function convSubtitle(conv) {
  if (conv.type !== 'group') {
    const p = person(otherUid(conv));
    return p && p.username ? '@' + p.username : '';
  }
  const names = conv.members.filter((uid) => uid !== me()).map((uid) => (person(uid) || {}).name || '…');
  if (conv.members.includes(me())) names.push('toi');
  return conv.members.length + ' membres · ' + names.join(', ');
}

function convAvatar(conv, extra = '') {
  if (conv.type === 'group') return avatar(conv.id, conv.title, 'group ' + extra);
  const other = otherUid(conv);
  return avatar(other, convTitle(conv), extra);
}

function isUnread(conv) {
  const lm = conv.lastMessage;
  if (!lm || lm.uid === me()) return false;
  const read = conv.lastRead ? ts(conv.lastRead[me()]) : 0;
  return !read || read < ts(lm.at);
}

function activeConv() {
  return state.convs.find((c) => c.id === state.activeId) || null;
}

/* Rôles et réglages d'un groupe, comme dans firestore.rules. Un groupe créé
   avant l'arrivée des admins n'a ni `admins` ni `perms` : son créateur en est
   l'admin, et chaque membre peut tout faire. */
const adminsOf = (conv) => (Array.isArray(conv.admins) ? conv.admins : [conv.createdBy]);
const isAdmin = (conv, uid = me()) => adminsOf(conv).includes(uid);
const permOf = (conv, what) => (conv.perms && conv.perms[what]) || 'all';
const can = (conv, what) => conv.type === 'group' && (permOf(conv, what) === 'all' || isAdmin(conv));
const isOwner = (conv, uid) => conv.createdBy === uid && conv.members.includes(uid);
const orphan = (conv) => conv.type === 'group' && !conv.members.some((u) => adminsOf(conv).includes(u));

const isBlocked = (uid) => state.settings.blocked.has(uid);

function mutedUntil(cid) {
  const v = state.settings.muted[cid];
  return typeof v === 'number' && v > Date.now() ? v : 0;
}
const isMuted = (cid) => mutedUntil(cid) > 0;

/* Privé de parole dans le groupe ouvert : fin de la privation, sinon 0. */
function silencedUntil(uid) {
  const t = restrictions.get(uid) || 0;
  return t > Date.now() ? t : 0;
}

/* Contacts : les personnes avec qui on partage déjà une conversation. */
function contacts() {
  const uids = new Set(state.convs.flatMap((c) => c.members));
  uids.delete(me());
  return [...uids].filter((u) => person(u) && !isBlocked(u))
    .sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'fr'));
}

/* Réveille l'interface à la fin de la sourdine ou de la privation de parole
   la plus proche. */
function scheduleWake() {
  clearTimeout(wakeTimer);
  const now = Date.now();
  const ends = [...Object.values(state.settings.muted), ...restrictions.values(),
    ...state.messages.map((m) => ts(m.exp))]
    .filter((t) => typeof t === 'number' && t > now && t < FOREVER);
  if (!ends.length) return;
  wakeTimer = setTimeout(() => {
    scheduleRender();
    updateTitle();
    scheduleWake();
  }, Math.min(Math.min(...ends) - now + 500, 864e5));
}

/* ======================================================================== */
/* Démarrage                                                                */
/* ======================================================================== */

/* Sur mobile, le clavier réduit la zone visible sans toujours réduire la
   page (iOS, anciens Android) : la hauteur de l'interface suit donc la zone
   réellement visible, pour que la zone de saisie reste au-dessus du clavier. */
function fitViewport() {
  const vv = window.visualViewport;
  if (!vv) return;
  const fit = () => {
    if (Math.abs(vv.scale - 1) > 0.01) return; // zoom au doigt : on ne touche à rien
    document.documentElement.style.setProperty('--app-h', Math.round(vv.height) + 'px');
    // iOS fait défiler toute la page pour montrer le champ : on la remet en place.
    if (vv.offsetTop > 0 && window.scrollY > 0) window.scrollTo(0, 0);
  };
  vv.addEventListener('resize', fit);
  vv.addEventListener('scroll', fit);
  fit();
}

async function start() {
  applyTheme();
  fitViewport();
  if (!configured && !emulate) {
    renderSetup();
    return;
  }
  renderSplash('Connexion à Firebase…');
  let app;
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js'),
    ]);
    A = authMod;
    F = fsMod;
    app = appMod.initializeApp(emulate ? DEMO_CONFIG : firebaseConfig);
  } catch (err) {
    renderFatal('Impossible de charger Firebase. Vérifie ta connexion Internet, ' +
      'ou qu\'un bloqueur ne filtre pas www.gstatic.com.');
    return;
  }
  auth = A.getAuth(app);
  auth.languageCode = 'fr';
  // Copie locale persistante (IndexedDB) : les conversations s'ouvrent sans
  // réseau, et les messages écrits hors ligne partent au retour du réseau.
  // Elle ne contient que des messages chiffrés ; elle est effacée à la
  // déconnexion.
  try {
    db = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
    });
  } catch {
    db = F.getFirestore(app);
  }
  if (emulate) {
    A.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    F.connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  // Tests sur les émulateurs uniquement : l'état est lisible depuis la console.
  if (emulate) {
    window.__mm = {
      state, people, trustCache,
      // Compte Google factice de l'émulateur (la vraie fenêtre Google a besoin d'Internet).
      google: (token) => A.signInWithCredential(auth, A.GoogleAuthProvider.credential(token)),
    };
  }
  A.onAuthStateChanged(auth, onAuth);
  window.addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', () => {
    markRead(activeConv());
    beatPresence();
  });
  // Le son n'est permis qu'après une interaction avec la page.
  document.addEventListener('pointerdown', Notify.unlockAudio, { once: true });
  document.addEventListener('keydown', Notify.unlockAudio, { once: true });
  // Clic sur une notification : le service worker indique la conversation.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'open' && e.data.hash) location.hash = e.data.hash;
    });
  }
  // Fermer l'onglet raccroche ; l'écoute des appels entrants reste active si
  // la page revient de l'historique.
  window.addEventListener('pagehide', () => {
    if (calls) calls.hangUp();
    if (group) group.leave();
  });
  window.addEventListener('online', () => { renderOffline(); beatPresence(); });
  // Adresse confirmée dans un autre onglet (lien reçu par e-mail) : on le voit au retour.
  window.addEventListener('focus', () => {
    const user = auth.currentUser;
    if (user && hasPassword() && !user.emailVerified) user.reload().then(renderNotice).catch(() => {});
  });
  window.addEventListener('offline', renderOffline);
}

function onAuth(user) {
  if (user && state.user && user.uid === state.user.uid && state.screen === 'main') return;
  teardown();
  state.user = user;
  if (!user) {
    renderAuth();
    return;
  }
  state.authMode = 'login'; // à la prochaine déconnexion, on revient sur « Connexion »
  renderSplash(pendingProfile ? 'Création de ton profil…' : 'Connexion…');
  watchProfile(user);
}

function watchProfile(user) {
  unsub.profile = F.onSnapshot(F.doc(db, 'users', user.uid), { includeMetadataChanges: true }, (snap) => {
    if (snap.exists()) {
      // Une écriture locale pas encore acceptée par le serveur peut encore
      // être refusée (pseudo déjà pris) : on attend sa confirmation.
      if (snap.metadata.hasPendingWrites && !state.profile) return;
      state.profile = { uid: user.uid, ...snap.data() };
      people.set(user.uid, state.profile);
      if (state.screen === 'main') {
        // Clé changée depuis un autre appareil : on rouvre avec la nouvelle.
        if (vault && state.profile.publicKey && state.profile.publicKey !== vault.publicKey) {
          location.reload();
          return;
        }
        renderMe();
        scheduleRender();
      } else if (!claiming && state.screen !== 'lock' && state.screen !== 'recovery') {
        openVault();
      }
      return;
    }
    if (snap.metadata.fromCache || claiming) return;
    state.profile = null;
    if (pendingProfile) {
      const wanted = pendingProfile;
      pendingProfile = null;
      claimProfile(wanted).catch((err) => renderOnboarding(wanted, err));
    } else if (state.screen !== 'onboard') {
      renderOnboarding({ name: (user.displayName || '').slice(0, MAX_NAME) });
    }
  }, (err) => renderFatal(describe(err)));
}

/* Réserve le pseudo et crée le profil dans une seule écriture groupée : les
   règles refusent l'un sans l'autre, et refusent un pseudo déjà pris. Si le
   mot de passe vient d'être tapé, la clé de chiffrement part avec. */
async function claimProfile({ name, username }) {
  claiming = true;
  let created = false;
  try {
    const uid = me();
    const keys = secret ? await newKeys(secret) : null;
    const batch = F.writeBatch(db);
    batch.set(F.doc(db, 'usernames', username), { uid });
    batch.set(F.doc(db, 'users', uid), {
      name, username, createdAt: F.serverTimestamp(), ...(keys ? { publicKey: keys.doc.publicKey } : {}),
    });
    if (keys) batch.set(F.doc(db, 'keys', uid), keys.doc);
    await batch.commit();
    if (keys) await adoptKeys(keys);
    created = true;
  } catch (err) {
    if (err.code === 'permission-denied') {
      const taken = await F.getDoc(F.doc(db, 'usernames', username)).catch(() => null);
      if (taken && taken.exists()) {
        const e = new Error('taken');
        e.code = 'username-taken';
        throw e;
      }
    }
    throw err;
  } finally {
    claiming = false;
    if (created && state.profile) openVault();
  }
}

/* ------------------------------------------------------------------------ */
/* Clé de chiffrement du compte                                             */
/* ------------------------------------------------------------------------ */

/* Nouvelle paire de clés, scellée par le mot de passe et par un nouveau code
   de secours, prête à écrire dans keys/{uid}. */
async function newKeys(password) {
  const identity = await E2E.generateIdentity();
  const code = E2E.newRecoveryCode();
  const [byPassword, byRecovery] = await Promise.all([
    E2E.seal(identity.pkcs8, password, E2E.PASSWORD_ITERATIONS),
    E2E.seal(identity.pkcs8, E2E.normalizeRecoveryCode(code), E2E.RECOVERY_ITERATIONS),
  ]);
  return {
    identity,
    code,
    doc: { v: 1, publicKey: identity.publicKey, byPassword, byRecovery, updatedAt: F.serverTimestamp() },
  };
}

/* Garde la clé déverrouillée en mémoire et sur cet appareil ; le code de
   secours d'une clé toute neuve sera montré avant d'entrer. */
async function adoptKeys({ identity, code }) {
  vault = { uid: me(), publicKey: identity.publicKey, privateKey: identity.privateKey };
  recoveryToShow = code;
  await E2E.saveDeviceKey(vault.uid, { publicKey: vault.publicKey, privateKey: vault.privateKey });
}

async function adoptPkcs8(pkcs8, publicKey) {
  const privateKey = await E2E.importPrivateKey(pkcs8);
  vault = { uid: me(), publicKey, privateKey };
  await E2E.saveDeviceKey(vault.uid, { publicKey, privateKey });
}

/* Crée (ou remplace, si le code de secours est perdu) la clé du compte. */
async function writeNewKeys(password) {
  const keys = await newKeys(password);
  const uid = me();
  const batch = F.writeBatch(db);
  batch.set(F.doc(db, 'keys', uid), keys.doc);
  batch.update(F.doc(db, 'users', uid), { publicKey: keys.doc.publicKey });
  await batch.commit();
  await adoptKeys(keys);
}

async function readKeys() {
  const snap = await F.getDoc(F.doc(db, 'keys', me()));
  return snap.exists() ? snap.data() : null;
}

async function tryPassword(box, password) {
  try {
    await adoptPkcs8(await E2E.unseal(box.byPassword, password), box.publicKey);
    return true;
  } catch {
    return false;
  }
}

function reauthenticate(password) {
  const user = auth.currentUser;
  return A.reauthenticateWithCredential(user, A.EmailAuthProvider.credential(user.email, password));
}

/* Compte avec mot de passe (e-mail), ou connecté avec Google seulement. Un
   compte Google protège sa clé par un « mot de passe de chiffrement » choisi
   sur message-me : Google ne le connaît pas. */
const hasPassword = () => Boolean(auth && auth.currentUser
  && auth.currentUser.providerData.some((p) => p.providerId === 'password'));

async function signInWithGoogle() {
  const provider = new A.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await A.signInWithPopup(auth, provider);
  } catch (err) {
    const code = (err && err.code) || '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await A.signInWithRedirect(auth, provider);
      return;
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
    if (code === 'auth/operation-not-allowed') {
      throw userError('La connexion avec Google n\'est pas activée dans Firebase (guide, « Connexion avec Google »).');
    }
    throw err;
  }
}

/* Déverrouille la clé du compte, puis ouvre la messagerie. */
async function openVault() {
  if (opening) return;
  opening = true;
  try {
    const uid = me();
    if (!vault) {
      const device = await E2E.loadDeviceKey(uid);
      if (device && device.publicKey && device.publicKey === state.profile.publicKey) {
        vault = { uid, publicKey: device.publicKey, privateKey: device.privateKey };
      }
    }
    if (!vault) {
      renderSplash('Déverrouillage de tes messages…');
      const box = await readKeys();
      if (!box) {
        // Compte créé avant le chiffrement : on crée sa clé.
        if (!secret) { renderUnlock(hasPassword() ? 'setup' : 'choose'); return; }
        await writeNewKeys(secret);
      } else if (!secret || !(await tryPassword(box, secret))) {
        // Mot de passe connu mais qui n'ouvre pas la clé : il a été réinitialisé.
        renderUnlock(secret ? 'changed' : 'password', box);
        return;
      }
    }
    secret = null;
    enterMain();
  } catch (err) {
    renderFatal(describe(err));
  } finally {
    opening = false;
  }
}

function enterMain() {
  if (recoveryToShow) {
    renderRecovery(recoveryToShow, () => {
      recoveryToShow = null;
      startMain();
    });
    return;
  }
  startMain();
}

/* ======================================================================== */
/* Écrans hors messagerie                                                   */
/* ======================================================================== */

function renderSplash(message) {
  state.screen = 'splash';
  mount(h('div', { class: 'splash', role: 'status' },
    h('span', { class: 'splash-mark', 'aria-hidden': 'true' }),
    h('p', { text: message })));
}

function renderFatal(message) {
  state.screen = 'fatal';
  mount(h('div', { class: 'center' }, h('div', { class: 'card narrow' },
    logo(),
    h('h1', { text: 'Quelque chose bloque' }),
    h('p', { text: message }),
    h('div', { class: 'row-actions' },
      h('button', { class: 'btn primary', onclick: () => location.reload() }, 'Réessayer'),
      h('a', { class: 'btn ghost', href: GUIDE, target: '_blank', rel: 'noopener' }, 'Ouvrir le guide')))));
}

function renderSetup() {
  state.screen = 'setup';
  // Mêmes étapes, dans le même ordre, que FIREBASE.md (les messages
  // d'erreur de describe() y renvoient par leur numéro).
  const steps = [
    ['Crée un projet', 'sur console.firebase.google.com (gratuit, formule Spark).'],
    ['Ajoute une application Web', 'au projet pour obtenir sa configuration.'],
    ['Active la connexion', 'Authentication → Méthode de connexion → Adresse e-mail/Mot de passe.'],
    ['Crée la base', 'Firestore Database, puis colle le contenu de firestore.rules dans l\'onglet Règles.'],
    ['Colle la configuration', 'dans public/firebase-config.js et publie-la sur GitHub.'],
    ['Autorise le domaine', 'cybers1te.github.io dans Authentication → Paramètres.'],
  ];
  mount(h('div', { class: 'center' }, h('div', { class: 'card setup' },
    logo(),
    h('p', { class: 'kicker', text: 'Configuration' }),
    h('h1', { text: 'Il ne manque plus que Firebase' }),
    h('p', { class: 'lead', text:
      'message-me stocke ses comptes et ses messages dans un projet Firebase. ' +
      'Ce site n\'est pas encore relié au tien : ça prend une dizaine de minutes.' }),
    h('ol', { class: 'steps' }, steps.map(([t, d]) => h('li', {}, h('b', { text: t }), ' ', d))),
    h('div', { class: 'row-actions' },
      h('a', { class: 'btn primary', href: GUIDE, target: '_blank', rel: 'noopener' }, 'Suivre le guide pas à pas'),
      isLocal ? h('a', { class: 'btn ghost', href: '?emulateurs' }, 'Essayer avec les émulateurs') : null))));
}

function field(label, input, hint) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label', text: label }), input,
    hint ? h('small', { class: 'field-hint', text: hint }) : null);
}

function formError() {
  return h('p', { class: 'form-error', role: 'alert', hidden: true });
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = !message;
}

function renderAuth() {
  state.screen = 'auth';
  const login = state.authMode === 'login';

  const tabs = h('div', { class: 'tabs', role: 'tablist' },
    h('button', {
      class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(login),
      onclick: () => { state.authMode = 'login'; renderAuth(); },
    }, 'Connexion'),
    h('button', {
      class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(!login),
      onclick: () => { state.authMode = 'register'; renderAuth(); },
    }, 'Inscription'));

  const error = formError();
  const email = h('input', { type: 'email', name: 'email', required: true, autocomplete: 'email', maxlength: 160 });
  const password = h('input', {
    type: 'password', name: 'password', required: true, minlength: login ? null : 8,
    autocomplete: login ? 'current-password' : 'new-password',
  });
  const name = h('input', { name: 'name', required: true, maxlength: MAX_NAME, autocomplete: 'nickname' });
  const username = h('input', {
    name: 'username', required: true, minlength: 3, maxlength: 20, autocapitalize: 'none',
    autocomplete: 'username', spellcheck: 'false',
  });
  const submit = h('button', { class: 'btn primary block', type: 'submit' },
    login ? 'Se connecter' : 'Créer mon compte');
  const googleBtn = h('button', { class: 'btn ghost block google', type: 'button' }, googleMark(), 'Continuer avec Google');
  googleBtn.addEventListener('click', () => {
    showError(error, '');
    busy(googleBtn, signInWithGoogle).catch((err) => showError(error, err.userMessage || describe(err)));
  });

  const form = h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      showError(error, '');
      busy(submit, () => (login ? doLogin() : doRegister())).catch((err) => {
        showError(error, err.userMessage || describe(err));
      });
    },
  },
  login ? null : field('Nom affiché', name, 'Ce que les autres verront, ex. « Léa Martin ».'),
  login ? null : field('Pseudo', h('span', { class: 'prefixed' }, h('span', { text: '@' }), username),
    '3 à 20 caractères : lettres, chiffres, _. Définitif — c\'est lui qu\'on tape pour t\'écrire.'),
  field('Adresse e-mail', email),
  field('Mot de passe', password, login ? null : '8 caractères minimum.'),
  error,
  submit,
  login ? h('button', { class: 'linkish', type: 'button', onclick: forgot }, 'Mot de passe oublié ?') : null,
  h('p', { class: 'or', text: 'ou' }),
  googleBtn);

  function fail(message) {
    const e = new Error(message);
    e.userMessage = message;
    return e;
  }

  async function doLogin() {
    secret = password.value; // déverrouille la clé de chiffrement juste après
    try {
      await A.signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    } catch (err) {
      secret = null;
      throw err;
    }
  }

  async function doRegister() {
    const n = name.value.trim();
    const u = normalizeUsername(username.value);
    if (!n) throw fail('Choisis un nom affiché.');
    if (n.length > MAX_NAME) throw fail('Le nom affiché fait au plus ' + MAX_NAME + ' caractères.');
    if (!USERNAME_RE.test(u)) throw fail('Pseudo invalide : 3 à 20 caractères parmi a–z, 0–9 et _.');
    if (password.value.length < 8) throw fail('Mot de passe trop court : 8 caractères minimum.');
    // Le pseudo ne peut être réservé qu'une fois connecté (les règles
    // l'exigent) : on le garde de côté, watchProfile le réserve aussitôt.
    pendingProfile = { name: n, username: u };
    secret = password.value; // scelle la clé de chiffrement créée avec le profil
    try {
      const cred = await A.createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
      A.sendEmailVerification(cred.user).catch(() => {});
    } catch (err) {
      pendingProfile = null;
      secret = null;
      throw err;
    }
  }

  async function forgot() {
    const address = email.value.trim();
    if (!address) {
      showError(error, 'Indique ton adresse e-mail, puis clique à nouveau sur « Mot de passe oublié ? ».');
      email.focus();
      return;
    }
    try {
      await A.sendPasswordResetEmail(auth, address);
      toast('Si un compte existe pour ' + address + ', un e-mail de réinitialisation vient de partir. ' +
        'Garde ton code de secours sous la main pour relire tes messages.', 'success');
    } catch (err) {
      showError(error, describe(err));
    }
  }

  const preview = h('div', { class: 'preview', 'aria-hidden': 'true' },
    h('p', { class: 'pv theirs' }, 'On se retrouve à quelle heure ?'),
    h('p', { class: 'pv mine' }, '19 h devant le ciné 🎬'),
    h('p', { class: 'pv theirs' }, 'Parfait, je préviens le groupe.'),
    h('p', { class: 'pv-meta' }, 'Vu'));

  mount(h('div', { class: 'auth' },
    h('section', { class: 'auth-brand' },
      logo(),
      h('h1', {}, 'Tes conversations,', h('br'), h('em', {}, 'en temps réel.')),
      h('p', { class: 'lead', text:
        'Discussions à deux ou en groupe, synchronisées instantanément sur tous tes appareils.' }),
      preview,
      h('p', { class: 'fineprint', text:
        '🔒 Les messages sont chiffrés de bout en bout : seuls les membres d\'une conversation ' +
        'peuvent les lire, pas même l\'administrateur du site. Les noms, pseudos et titres de ' +
        'groupe ne sont pas chiffrés.' })),
    h('section', { class: 'auth-panel' }, h('div', { class: 'card auth-card' },
      tabs,
      h('h2', { text: login ? 'Content de te revoir' : 'Crée ton compte' }),
      form))));

  (login ? email : name).focus();
  try {
    if (sessionStorage.getItem('mm-deleted')) {
      sessionStorage.removeItem('mm-deleted');
      toast('Ton compte a été supprimé.', 'success');
    }
  } catch { /* stockage indisponible */ }
}

/* Logo Google (couleurs officielles), pour le bouton de connexion. */
function googleMark() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'i g-mark');
  svg.innerHTML = '<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>' +
    '<path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>' +
    '<path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>' +
    '<path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>';
  return svg;
}

function renderOnboarding(prefill = {}, err = null) {
  state.screen = 'onboard';
  const error = formError();
  const name = h('input', { name: 'name', required: true, maxlength: MAX_NAME, value: prefill.name || '' });
  const username = h('input', {
    name: 'username', required: true, minlength: 3, maxlength: 20, autocapitalize: 'none',
    spellcheck: 'false', value: prefill.username || '',
  });
  const submit = h('button', { class: 'btn primary block', type: 'submit' }, 'Continuer');

  mount(h('div', { class: 'center' }, h('div', { class: 'card narrow' },
    logo(),
    h('h1', { text: 'Choisis ton pseudo' }),
    h('p', { class: 'lead', text: 'C\'est lui que les autres taperont pour t\'écrire. Il est définitif.' }),
    h('form', {
      class: 'form', novalidate: true,
      onsubmit: (e) => {
        e.preventDefault();
        const n = name.value.trim();
        const u = normalizeUsername(username.value);
        if (!n || n.length > MAX_NAME) return showError(error, 'Choisis un nom affiché (40 caractères maximum).');
        if (!USERNAME_RE.test(u)) return showError(error, 'Pseudo invalide : 3 à 20 caractères parmi a–z, 0–9 et _.');
        showError(error, '');
        busy(submit, () => claimProfile({ name: n, username: u })).catch((e2) => {
          showError(error, e2.code === 'username-taken' ? 'Ce pseudo est déjà pris, choisis-en un autre.' : describe(e2));
        });
      },
    },
    field('Nom affiché', name),
    field('Pseudo', h('span', { class: 'prefixed' }, h('span', { text: '@' }), username),
      '3 à 20 caractères : lettres minuscules, chiffres, _.'),
    error,
    submit),
    h('button', { class: 'linkish', type: 'button', onclick: logout }, 'Se déconnecter'))));

  if (err) {
    showError(error, err.code === 'username-taken'
      ? '@' + prefill.username + ' est déjà pris, choisis un autre pseudo.'
      : describe(err));
  }
  (prefill.name ? username : name).focus();
}

/* Déverrouillage de la clé de chiffrement.
   - 'password' : session ouverte mais clé absente de cet appareil ;
   - 'changed'  : le mot de passe a été réinitialisé, il faut le code de secours ;
   - 'setup'    : compte créé avant le chiffrement, on lui crée sa clé. */
function renderUnlock(mode, box = null) {
  state.screen = 'lock';
  const google = !hasPassword(); // compte Google : mot de passe de chiffrement propre au site
  const error = formError();
  const recovery = mode === 'changed';
  const pwLabel = google ? 'Mot de passe de chiffrement' : 'Mot de passe';
  const input = recovery
    ? h('input', {
      name: 'code', required: true, autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false',
      class: 'mono', placeholder: 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX',
    })
    : h('input', { type: 'password', name: 'password', required: true, autocomplete: mode === 'choose' ? 'new-password' : 'current-password' });
  // Nouveau mot de passe de chiffrement : à la création (Google), ou après
  // le code de secours (Google).
  const needsNew = mode === 'choose' || (recovery && google);
  const fresh = needsNew ? h('input', { type: 'password', name: 'new', required: true, minlength: 8, autocomplete: 'new-password' }) : null;
  const again = needsNew ? h('input', { type: 'password', name: 'again', required: true, minlength: 8, autocomplete: 'new-password' }) : null;
  const submit = h('button', { class: 'btn primary block', type: 'submit' },
    mode === 'setup' || mode === 'choose' ? 'Activer le chiffrement' : 'Déverrouiller');

  const copy = {
    password: google
      ? ['Déverrouille tes messages', 'Tes messages sont chiffrés. Sur cet appareil, entre ton mot de passe de chiffrement ' +
        '(celui choisi sur message-me, pas celui de Google).']
      : ['Déverrouille tes messages', 'Tes messages sont chiffrés. Sur cet appareil, entre ton mot de passe pour les lire.'],
    changed: google
      ? ['Mot de passe de chiffrement oublié', 'Entre le code de secours noté à l\'inscription, puis choisis un nouveau mot de passe de chiffrement.']
      : ['Ton mot de passe a changé', 'Pour relire tes messages chiffrés, entre le code de secours que tu as noté à l\'inscription.'],
    setup: ['Active le chiffrement',
      'message-me chiffre désormais les messages de bout en bout. Entre ton mot de passe pour créer ta clé.'],
    choose: ['Choisis un mot de passe de chiffrement',
      'Tes messages sont chiffrés de bout en bout. Ce mot de passe protège ta clé : il te sera demandé pour lire tes ' +
      'messages sur un nouvel appareil. Google ne le connaît pas, et personne ne peut le retrouver pour toi.'],
  }[mode];

  function checkNew() {
    if (fresh.value.length < 8) throw userError('Mot de passe de chiffrement trop court : 8 caractères minimum.');
    if (fresh.value !== again.value) throw userError('Les deux mots de passe ne sont pas identiques.');
    return fresh.value;
  }

  async function unlock() {
    if (mode === 'choose') {
      await writeNewKeys(checkNew());
    } else if (mode === 'changed') {
      if (!E2E.isRecoveryCodeShaped(input.value)) throw userError('Le code de secours compte 24 caractères, par groupes de 4.');
      const next = google ? checkNew() : secret;
      let pkcs8;
      try {
        pkcs8 = await E2E.unseal(box.byRecovery, E2E.normalizeRecoveryCode(input.value));
      } catch {
        throw userError('Code de secours incorrect.');
      }
      // La clé est rescellée avec le nouveau mot de passe.
      const byPassword = await E2E.seal(pkcs8, next, E2E.PASSWORD_ITERATIONS);
      await F.updateDoc(F.doc(db, 'keys', me()), { byPassword, updatedAt: F.serverTimestamp() });
      await adoptPkcs8(pkcs8, box.publicKey);
      toast('Messages déverrouillés.', 'success');
    } else {
      const password = input.value;
      if (!password) throw userError('Indique ton ' + pwLabel.toLowerCase() + '.');
      if (mode === 'password' && await tryPassword(box, password)) {
        // Rien d'autre à faire.
      } else if (google) {
        throw userError('Mot de passe de chiffrement incorrect.');
      } else {
        try {
          await reauthenticate(password);
        } catch (err) {
          const code = (err && err.code) || '';
          if (/wrong-password|invalid-credential|invalid-login/.test(code)) throw userError('Mot de passe incorrect.');
          throw err;
        }
        secret = password;
        if (mode === 'password') { renderUnlock('changed', box); return; }
        await writeNewKeys(password);
      }
    }
    secret = null;
    enterMain();
  }

  const form = h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      showError(error, '');
      busy(submit, unlock).catch((err) => showError(error, err.userMessage || describe(err)));
    },
  },
  mode === 'choose' ? null : field(recovery ? 'Code de secours' : pwLabel, input),
  needsNew ? field('Nouveau mot de passe de chiffrement', fresh, '8 caractères minimum. Différent de ton mot de passe Google.') : null,
  needsNew ? field('Confirme-le', again) : null,
  error,
  submit);

  mount(h('div', { class: 'center' }, h('div', { class: 'card narrow' },
    logo(),
    h('p', { class: 'kicker', text: '🔒 Chiffrement de bout en bout' }),
    h('h1', { text: copy[0] }),
    h('p', { class: 'lead', text: copy[1] }),
    form,
    h('div', { class: 'row-actions' },
      mode === 'password' && google
        ? h('button', { class: 'linkish', type: 'button', onclick: () => renderUnlock('changed', box) }, 'Mot de passe de chiffrement oublié ?')
        : null,
      recovery ? h('button', { class: 'linkish', type: 'button', onclick: lostCode }, 'J\'ai perdu mon code') : null,
      h('button', { class: 'linkish', type: 'button', onclick: logout }, 'Se déconnecter')))));
  (fresh && mode === 'choose' ? fresh : input).focus();

  function lostCode() {
    const confirmBtn = h('button', { class: 'btn primary', type: 'button' }, 'Créer une nouvelle clé');
    const err = formError();
    const pw = google ? h('input', { type: 'password', minlength: 8, autocomplete: 'new-password' }) : null;
    const dlg = modal('Code de secours perdu', h('div', { class: 'form' },
      h('p', { text: 'Sans ce code, personne ne peut déchiffrer tes anciens messages : ils resteront illisibles pour toi.' }),
      h('p', { text: 'Tu peux créer une nouvelle clé pour continuer à discuter. Les nouveaux messages seront lisibles normalement.' }),
      pw ? field('Nouveau mot de passe de chiffrement', pw, '8 caractères minimum.') : null,
      err,
      h('div', { class: 'row-actions end' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
        confirmBtn)));
    confirmBtn.addEventListener('click', () => {
      busy(confirmBtn, async () => {
        const next = google ? pw.value : secret;
        if (google && next.length < 8) throw userError('Mot de passe de chiffrement trop court : 8 caractères minimum.');
        await writeNewKeys(next);
        secret = null;
        dlg.close();
        enterMain();
      }).catch((e) => showError(err, e.userMessage || describe(e)));
    });
  }
}

/* Bloc qui affiche un code de secours, avec copie et téléchargement. */
function recoveryPanel(code, onDone) {
  const ok = h('input', { type: 'checkbox', name: 'saved' });
  const next = h('button', { class: 'btn primary block', type: 'button', disabled: true, onclick: onDone }, 'Continuer');
  ok.addEventListener('change', () => { next.disabled = !ok.checked; });
  const text = 'Code de secours message-me (' + (state.user ? state.user.email : '') + ')\n\n' + code + '\n\n' +
    'Il permet de relire tes messages chiffrés si tu oublies ton mot de passe.\n';
  return h('div', { class: 'form' },
    h('p', { class: 'recovery-code', text: code, 'aria-label': 'Code de secours' }),
    h('div', { class: 'row-actions' },
      h('button', {
        class: 'btn ghost sm', type: 'button',
        onclick: () => navigator.clipboard.writeText(code)
          .then(() => toast('Code copié.', 'success'))
          .catch(() => toast('Copie impossible : recopie le code à la main.', 'info')),
      }, icon('copy'), 'Copier'),
      h('button', {
        class: 'btn ghost sm', type: 'button',
        onclick: () => {
          const a = h('a', {
            href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
            download: 'message-me-code-de-secours.txt',
          });
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        },
      }, 'Télécharger')),
    h('p', { class: 'fineprint', text:
      'Si tu oublies ton mot de passe, ce code est le seul moyen de relire tes messages. Personne ne peut ' +
      'le retrouver pour toi, pas même l\'administrateur du site. Range-le hors de ce site : sur papier ou ' +
      'dans un gestionnaire de mots de passe.' }),
    h('label', { class: 'check' }, ok, h('span', { text: 'J\'ai noté ce code en lieu sûr.' })),
    next);
}

function renderRecovery(code, onDone) {
  state.screen = 'recovery';
  mount(h('div', { class: 'center' }, h('div', { class: 'card narrow' },
    logo(),
    h('p', { class: 'kicker', text: '🔒 Chiffrement de bout en bout' }),
    h('h1', { text: 'Ton code de secours' }),
    h('p', { class: 'lead', text: 'Tes messages sont chiffrés avec une clé protégée par ton mot de passe. Note ce code : il ne sera plus jamais affiché.' }),
    recoveryPanel(code, onDone))));
}

/* ======================================================================== */
/* Messagerie                                                               */
/* ======================================================================== */

function startMain() {
  state.screen = 'main';
  const search = h('input', {
    type: 'search', placeholder: 'Rechercher', 'aria-label': 'Rechercher une conversation',
    oninput: () => { state.filter = search.value.trim().toLowerCase(); renderConvList(); },
  });
  ui = {
    list: h('nav', { class: 'conv-list', 'aria-label': 'Conversations' }),
    notice: h('div', { class: 'notice', hidden: true }),
    offline: h('div', { class: 'offline', hidden: true, role: 'status' }),
    me: h('div', { class: 'me' }),
    chat: h('main', { class: 'chat' }),
    search,
    head: null,
    log: null,
    logIn: null,
    composer: null,
    jump: null,
  };
  ui.shell = h('div', { class: 'shell', 'data-view': 'list' },
    h('aside', { class: 'side' },
      h('header', { class: 'side-head' },
        logo(),
        h('button', {
          class: 'btn icon primary', type: 'button', title: 'Nouvelle conversation',
          'aria-label': 'Nouvelle conversation', onclick: () => openNewConversation(),
        }, icon('plus'))),
      h('div', { class: 'side-search' }, icon('search'), search),
      ui.offline,
      ui.notice,
      ui.list,
      ui.me),
    ui.chat);
  mount(ui.shell);
  renderMe();
  renderNotice();
  renderOffline();
  renderConvList();
  bindDrop(ui.chat);

  Notify.registerWorker();
  buildCallLayer();
  unsubPlayer = Media.player.subscribe(updateVoice);
  if (callsSupported()) {
    calls = createCalls({
      F, db, uid: me(), iceServers: appConfig.iceServers,
      onChange: onCallChange,
      onRinging,
      onLog: (cid, payload) => sendRich(cid, payload).catch(() => {}),
      // Refusé d'office : personne bloquée, ou déjà dans un appel de groupe.
      screen: (incoming) => !isBlocked(incoming.caller) && !(group && group.current),
      onError: (err) => {
        if (err && err.code === 'permission-denied') {
          toast('Les appels demandent les nouvelles règles Firestore : republie firestore.rules (guide, étape 4).', 'error');
        }
      },
    });
    calls.watch();
    group = createGroupCalls({ F, db, uid: me(), iceServers: appConfig.iceServers, onChange: renderGroupLayer });
    buildGroupLayer();
  }

  // Réglages privés : personnes bloquées, conversations en sourdine.
  unsub.settings = F.onSnapshot(F.doc(db, 'settings', me()), (snap) => {
    const d = snap.exists() ? snap.data() : {};
    const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
    const map = (v) => (v && typeof v === 'object' ? v : {});
    const wasHidden = state.settings.hidePresence;
    state.settings = {
      blocked: new Set(list(d.blocked)),
      muted: map(d.muted),
      pinned: list(d.pinned),
      archived: list(d.archived),
      keys: map(d.keys),
      verified: map(d.verified),
      hidePresence: d.hidePresence === true,
    };
    if (wasHidden !== state.settings.hidePresence) beatPresence();
    ensurePeople(state.settings.blocked);
    scheduleWake();
    scheduleRender();
    updateTitle();
  }, () => { /* règles pas encore publiées : aucun réglage */ });

  startPresence();

  unsub.convs = F.onSnapshot(
    F.query(F.collection(db, 'conversations'), F.where('members', 'array-contains', me())),
    (snap) => {
      state.convs = snap.docs
        .map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))
        .sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
      state.convsReady = true;
      const ids = new Set(state.convs.map((c) => c.id));
      // Retiré du groupe ouvert (ou parti depuis un autre appareil).
      if (state.activeId && knownIds.has(state.activeId) && !ids.has(state.activeId)) showGone();
      knownIds = ids;
      ensurePeople(new Set(state.convs.flatMap((c) => c.members)));
      trackActivity();
      renderConvList();
      renderChatHead();
      renderMessages();
      renderGate();
      if (panel) panel.render();
      markRead(activeConv());
      updateTitle();
    },
    (err) => toast(describe(err), 'error'));

  route(true);
}

/* Bandeau « Hors ligne » : les messages attendent le retour du réseau. */
function renderOffline() {
  if (!ui) return;
  const off = !navigator.onLine;
  ui.offline.hidden = !off;
  ui.offline.replaceChildren(...(off ? [icon('wifiOff'), h('span', { text: 'Hors ligne — tes messages partiront dès le retour du réseau.' })] : []));
}

/* Installation comme une application (écran d'accueil, plein écran). */
let installPrompt = null;
// L'application Android (dossier android/) ouvre le site avec ce référent.
const APK = 'message-me.apk';
const inAndroidApp = (() => {
  try {
    if (document.referrer.startsWith('android-app://io.github.cybers1te.messageme')) sessionStorage.setItem('mm-app', '1');
    return sessionStorage.getItem('mm-app') === '1';
  } catch {
    return false;
  }
})();
const standalone = () => inAndroidApp || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = () => /android/i.test(navigator.userAgent);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  toast('message-me est installé sur cet appareil.', 'success');
});

/* Sur Android, l'APK à installer soi-même, à côté de l'installation par le
   navigateur. */
function apkSetting() {
  if (!isAndroid() || standalone()) return null;
  return h('div', { class: 'setting' }, icon('download'),
    h('span', { class: 'setting-txt' }, h('b', { text: 'Application Android (APK)' }),
      h('small', { text: 'À installer en autorisant ton navigateur à installer des applications. Elle s\'ouvre avec Chrome.' })),
    h('a', { class: 'btn ghost sm', href: APK, download: 'message-me.apk' }, 'Télécharger'));
}

function installSetting() {
  if (standalone()) {
    return h('div', { class: 'setting' }, icon('installApp'),
      h('span', { class: 'setting-txt' }, h('b', { text: 'Application installée' }),
        h('small', { text: 'Tu utilises message-me comme une application.' })));
  }
  const text = installPrompt ? 'Une icône sur l\'écran d\'accueil, en plein écran, et qui s\'ouvre même sans réseau.'
    : isIos() ? 'Dans Safari : bouton Partager, puis « Sur l\'écran d\'accueil ».'
      : 'Depuis le menu du navigateur : « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».';
  return h('div', { class: 'setting' }, icon('installApp'),
    h('span', { class: 'setting-txt' }, h('b', { text: 'Installer l\'application' }), h('small', { text })),
    installPrompt ? h('button', {
      class: 'btn primary sm', type: 'button',
      onclick: async () => {
        const prompt = installPrompt;
        installPrompt = null;
        prompt.prompt();
        await prompt.userChoice.catch(() => null);
      },
    }, 'Installer') : null);
}

function renderMe() {
  if (!ui || !state.profile) return;
  const p = state.profile;
  ui.me.replaceChildren(
    h('button', { class: 'me-btn', type: 'button', onclick: openSettings, title: 'Mon profil et paramètres' },
      avatar(p.uid, p.name, 'sm'),
      h('span', { class: 'me-txt' }, h('b', { text: p.name }), h('small', { text: '@' + p.username }))),
    h('button', {
      class: 'btn icon ghost', type: 'button', title: 'Paramètres', 'aria-label': 'Paramètres',
      onclick: openSettings,
    }, icon('settings')));
}

/* Invitation à activer les notifications, tant qu'on n'a ni accepté, ni
   refusé, ni fermé l'invitation. */
function renderNotice() {
  if (!ui) return;
  const user = auth.currentUser;
  let later = false;
  try { later = localStorage.getItem('mm-notice-email') === 'non'; } catch { /* stockage indisponible */ }
  if (user && hasPassword() && !user.emailVerified && !later) {
    ui.notice.hidden = false;
    ui.notice.replaceChildren(
      icon('mail'),
      h('span', { class: 'notice-txt' }, h('b', { text: 'Confirme ton adresse e-mail' }),
        h('small', { text: 'Un lien a été envoyé à ' + user.email + '. Il permet de récupérer ton compte.' })),
      h('button', {
        class: 'btn icon ghost', type: 'button', 'aria-label': 'Plus tard',
        onclick: () => {
          try { localStorage.setItem('mm-notice-email', 'non'); } catch { /* tant pis */ }
          renderNotice();
        },
      }, icon('close')),
      h('button', {
        class: 'btn primary sm', type: 'button',
        onclick: (e) => busy(e.currentTarget, () => A.sendEmailVerification(user))
          .then(() => toast('Lien renvoyé à ' + user.email + '.', 'success'))
          .catch((err) => toast(describe(err), 'error')),
      }, 'Renvoyer le lien'));
    return;
  }
  let dismissed = false;
  try { dismissed = localStorage.getItem('mm-notice-notifs') === 'non'; } catch { /* stockage indisponible */ }
  const show = Notify.notificationPermission() === 'default' && !dismissed;
  ui.notice.hidden = !show;
  if (!show) return;
  ui.notice.replaceChildren(
    icon('bell'),
    h('span', { class: 'notice-txt' }, h('b', { text: 'Active les notifications' }),
      h('small', { text: 'pour être prévenu des messages et des appels.' })),
    h('button', {
      class: 'btn icon ghost', type: 'button', 'aria-label': 'Plus tard',
      onclick: () => {
        try { localStorage.setItem('mm-notice-notifs', 'non'); } catch { /* tant pis */ }
        renderNotice();
      },
    }, icon('close')),
    h('button', { class: 'btn primary sm', type: 'button', onclick: enableNotifications }, 'Activer'));
}

async function enableNotifications() {
  Notify.unlockAudio();
  const result = await Notify.requestNotifications();
  if (result === 'granted') {
    toast('Notifications activées.', 'success');
    Notify.notify('message-me', { body: 'Les notifications fonctionnent 🎉', tag: 'test' });
  } else if (result === 'denied') {
    toast('Notifications bloquées : autorise-les dans les réglages du site.', 'error');
  }
  renderNotice();
}

/* Nouveaux messages et « … écrit » : ce qui a changé depuis le dernier
   instantané de la liste des conversations. */
function trackActivity() {
  for (const c of state.convs) {
    for (const [uid, v] of Object.entries(c.typing || {})) {
      if (uid === me()) continue;
      const key = c.id + '/' + uid;
      const t = ts(v);
      const prev = typingSeen.get(key);
      typingSeen.set(key, t);
      if (convsInit && t && t !== prev) {
        typingUntil.set(key, Date.now() + TYPING_MS);
        setTimeout(scheduleRender, TYPING_MS + 100);
      }
    }
    if (c.type === 'group' && c.room && c.room.id) {
      const known = seenRooms.get(c.id);
      seenRooms.set(c.id, c.room.id);
      if (convsInit && known !== c.room.id && c.room.by !== me()) announceRoom(c);
    }
    const lm = c.lastMessage;
    if (!lm) continue;
    const prev = lastSeenMsg.get(c.id);
    lastSeenMsg.set(c.id, lm.id);
    if (!convsInit || prev === lm.id || lm.uid === me()) continue;
    typingUntil.delete(c.id + '/' + lm.uid);
    if (!document.hidden && c.id === state.activeId) continue;
    announce(c, lm);
  }
  convsInit = true;
}

/* Nouveau message : son discret si l'onglet est visible, notification sinon.
   Rien pour une conversation en sourdine ou une personne bloquée ; pour la
   vie d'un groupe, seulement ce qui me concerne (on m'a ajouté…). */
async function announce(conv, lm) {
  if (isBlocked(lm.uid) || lm.deleted) return;
  const c = await decryptContent(conv.id, lm);
  const mentioned = c.state === 'ok' && Array.isArray(c.payload && c.payload.mentions) && c.payload.mentions.includes(me());
  // Une @mention passe la sourdine, comme sur les autres messageries.
  if (isMuted(conv.id) && !mentioned) return;
  if (c.kind === 'event' && c.state === 'ok' && !eventForMe(c.payload)) return;
  if (!document.hidden) {
    if (soundsOn()) Notify.blip();
    return;
  }
  const who = person(lm.uid) || await fetchPerson(lm.uid).catch(() => null);
  const group = conv.type === 'group';
  const text = summary(c, false, lm.uid);
  Notify.notify(group ? conv.title : (who ? who.name : 'message-me'), {
    body: !previewOn() ? (mentioned ? 'Tu as été mentionné·e' : 'Nouveau message')
      : c.kind === 'event' ? text : (mentioned ? '@ ' : '') + (group && who ? who.name + ' : ' : '') + text,
    tag: 'conv-' + conv.id,
    hash: '#/c/' + encodeURIComponent(conv.id),
  });
}

function announceRoom(conv) {
  if (isMuted(conv.id) || isBlocked(conv.room.by) || (group && group.current)) return;
  const who = nameOf(conv.room.by);
  if (!document.hidden) {
    if (soundsOn()) Notify.blip();
    if (conv.id !== state.activeId) toast(who + ' a lancé un appel dans « ' + conv.title + ' ».', 'info');
    return;
  }
  Notify.notify('Appel de groupe · ' + conv.title, {
    body: who + ' a lancé un appel ' + (conv.room.video ? 'vidéo' : 'vocal') + ' — touche pour rejoindre',
    tag: 'room-' + conv.room.id,
    hash: '#/c/' + encodeURIComponent(conv.id),
  });
}

function updateTitle() {
  const n = state.convs.filter((c) => isUnread(c) && !isMuted(c.id) && !state.settings.archived.includes(c.id)).length;
  document.title = (n ? '(' + n + ') ' : '') + 'message-me';
}

function renderConvList() {
  if (!ui) return;
  if (!state.convsReady) {
    ui.list.replaceChildren(h('p', { class: 'list-note', text: 'Chargement des conversations…' }));
    return;
  }
  if (!state.convs.length) {
    ui.list.replaceChildren(h('div', { class: 'list-empty' },
      h('p', { text: 'Aucune conversation pour l\'instant.' }),
      h('div', { class: 'row-actions' },
        h('button', { class: 'btn primary sm', type: 'button', onclick: () => openNewConversation('dm') },
          icon('plus'), 'Écrire à quelqu\'un'),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => openNewConversation('group') },
          icon('users'), 'Créer un groupe'))));
    return;
  }
  const q = state.filter;
  const archived = new Set(state.settings.archived);
  const pinned = state.settings.pinned;
  const shelf = state.convs.filter((c) => archived.has(c.id));
  // Recherche : dans toutes les conversations, archivées comprises.
  let items = state.convs.filter((c) => {
    if (q) return [convTitle(c), convSubtitle(c)].join(' ').toLowerCase().includes(q.replace(/^@/, ''));
    return state.showArchived ? archived.has(c.id) : !archived.has(c.id);
  });
  // Épinglées en tête, dans l'ordre où elles ont été épinglées.
  items = [...items.filter((c) => pinned.includes(c.id)).sort((a, b) => pinned.indexOf(a.id) - pinned.indexOf(b.id)),
    ...items.filter((c) => !pinned.includes(c.id))];
  const head = [];
  if (!q && state.showArchived) {
    head.push(h('button', {
      class: 'conv shelf', type: 'button', onclick: () => { state.showArchived = false; renderConvList(); },
    }, h('span', { class: 'avatar sm shelf-ic' }, icon('back')), h('span', { class: 'conv-txt' },
      h('b', { class: 'conv-title', text: 'Conversations archivées' }),
      h('small', { class: 'conv-preview', text: 'Elles restent archivées quand un message arrive.' }))));
  } else if (!q && shelf.length) {
    const unreadShelf = shelf.filter(isUnread).length;
    head.push(h('button', {
      class: 'conv shelf', type: 'button', onclick: () => { state.showArchived = true; renderConvList(); },
    }, h('span', { class: 'avatar sm shelf-ic' }, icon('archive')), h('span', { class: 'conv-txt' },
      h('span', { class: 'conv-top' }, h('b', { class: 'conv-title', text: 'Archivées' }),
        unreadShelf ? h('span', { class: 'count-badge accent', text: String(unreadShelf) }) : h('span', { class: 'count-badge', text: String(shelf.length) })))));
  }
  if (!items.length) {
    ui.list.replaceChildren(...head, h('p', { class: 'list-note', text: q ? 'Aucune conversation ne correspond.' : 'Aucune conversation ici.' }));
    return;
  }
  ui.list.replaceChildren(...head, ...items.map((c) => {
    const lm = c.lastMessage;
    const unread = isUnread(c);
    let preview = 'Nouvelle conversation';
    const typing = typingText(c);
    if (typing) {
      preview = typing;
    } else if (c.type === 'dm' && isBlocked(otherUid(c))) {
      preview = '🚫 Personne bloquée';
    } else if (lm && lm.uid !== me() && isBlocked(lm.uid)) {
      preview = 'Message masqué';
    } else if (lm) {
      const p = content(c.id, lm);
      const who = p.kind === 'call' || p.kind === 'event' ? ''
        : lm.uid === me() ? 'Toi : '
          : (c.type === 'group' ? nameOf(lm.uid) + ' : ' : '');
      preview = who + summary(p, lm.uid === me(), lm.uid).replace(/\s+/g, ' ');
    }
    const muted = isMuted(c.id);
    const row = h('a', {
      class: 'conv' + (unread ? ' unread' : '') + (muted ? ' muted' : ''),
      href: '#/c/' + encodeURIComponent(c.id),
      'aria-current': c.id === state.activeId ? 'page' : null,
    },
    convAvatar(c),
    h('span', { class: 'conv-txt' },
      h('span', { class: 'conv-top' },
        h('b', { class: 'conv-title', text: convTitle(c) }),
        c.type === 'group' && c.room ? h('span', { class: 'conv-flag live', title: 'Appel de groupe en cours', 'aria-label': 'appel en cours' }, icon('phone')) : null,
        muted ? h('span', { class: 'conv-flag', title: 'En sourdine', 'aria-label': 'en sourdine' }, icon('bellOff')) : null,
        pinned.includes(c.id) ? h('span', { class: 'conv-flag', title: 'Épinglée', 'aria-label': 'épinglée' }, icon('pin')) : null,
        h('time', { text: listTime(ts(lm ? lm.at : c.updatedAt)) })),
      h('span', { class: 'conv-bottom' },
        h('span', { class: 'conv-preview' + (typing ? ' typing' : ''), text: preview }),
        unread ? h('span', { class: 'dot', 'aria-label': 'non lu' }) : null)),
    coarse ? null : h('button', {
      class: 'conv-more', type: 'button', 'aria-label': 'Actions sur la conversation', title: 'Plus',
      onclick: (e) => { e.preventDefault(); e.stopPropagation(); openConvMenu(c); },
    }, icon('more')));
    // Appui long (mobile) ou clic droit : épingler, archiver, sourdine…
    bindPress(row, () => openConvMenu(c), 'button');
    return row;
  }));
}

function openConvMenu(c) {
  const pinned = state.settings.pinned.includes(c.id);
  const archived = state.settings.archived.includes(c.id);
  menu(convTitle(c), [
    { label: pinned ? 'Désépingler' : 'Épingler en haut', icon: 'pin', onclick: () => run(togglePin(c)) },
    { label: archived ? 'Désarchiver' : 'Archiver', icon: 'archive', onclick: () => run(toggleArchive(c)) },
    { label: isMuted(c.id) ? 'Réactiver les notifications' : 'Mettre en sourdine…', icon: isMuted(c.id) ? 'bell' : 'bellOff', onclick: () => chooseMute(c.id) },
    isUnread(c) ? { label: 'Marquer comme lu', icon: 'check', onclick: () => run(markAsRead(c)) } : null,
  ]);
}

const MAX_PINS = 5;

async function togglePin(c) {
  const on = !state.settings.pinned.includes(c.id);
  if (on && state.settings.pinned.length >= MAX_PINS) {
    throw userError('Tu peux épingler ' + MAX_PINS + ' conversations au plus.');
  }
  await F.setDoc(settingsRef(), { pinned: on ? F.arrayUnion(c.id) : F.arrayRemove(c.id) }, { merge: true });
}

async function toggleArchive(c) {
  const on = !state.settings.archived.includes(c.id);
  await F.setDoc(settingsRef(), {
    archived: on ? F.arrayUnion(c.id) : F.arrayRemove(c.id),
    ...(on ? { pinned: F.arrayRemove(c.id) } : {}),
  }, { merge: true });
  toast(on ? '« ' + convTitle(c) + ' » archivée.' : '« ' + convTitle(c) + ' » désarchivée.', 'success');
}

function markAsRead(c) {
  return F.updateDoc(F.doc(db, 'conversations', c.id), { ['lastRead.' + me()]: F.serverTimestamp() });
}

function route(initial = false) {
  const join = location.hash.match(/^#\/join\/([A-Za-z0-9_-]{20,40})$/);
  if (join) {
    history.replaceState(null, '', location.pathname + location.search + '#/');
    openJoin(join[1]);
    if (state.activeId || initial === true) openConversation(null);
    return;
  }
  const m = location.hash.match(/^#\/c\/([^/?#]+)/);
  const id = m ? decodeURIComponent(m[1]) : null;
  if (id !== state.activeId || initial === true) openConversation(id);
}

function openConversation(id) {
  if (!ui) return;
  if (unsub.msgs) unsub.msgs();
  unsub.msgs = null;
  if (ui.composer && state.activeId) drafts.set(state.activeId, ui.composer.draft());
  if (ui.composer && ui.composer.cleanup) ui.composer.cleanup();
  if (id !== state.activeId) {
    rowCache.clear();
    revealed.clear();
    Media.player.stop();
    if (panel && panel.dlg.open) panel.dlg.close();
  }
  if (unsub.restr) unsub.restr();
  unsub.restr = null;
  restrictions.clear();
  state.activeId = id;
  state.messages = [];
  state.messagesReady = false;
  state.limit = HISTORY;
  state.search = null;
  ui.shell.dataset.view = id ? 'chat' : 'list';
  ui.head = ui.log = ui.logIn = ui.composer = ui.jump = ui.gate = ui.searchBar = ui.roomBar = ui.keyNotice = null;
  ui.keyChecked = null;
  ui.closed = false;
  ui.keepScroll = 0;
  renderConvList();

  if (!id) {
    ui.chat.replaceChildren(h('div', { class: 'chat-empty' },
      h('span', { class: 'chat-empty-art' }, icon('chats')),
      h('h2', { text: 'Choisis une conversation' }),
      h('p', { text: 'Ou démarres-en une avec le pseudo de quelqu\'un.' }),
      h('div', { class: 'row-actions center-actions' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => openNewConversation('dm') },
          icon('plus'), 'Nouvelle conversation'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => openNewConversation('group') },
          icon('users'), 'Nouveau groupe')),
      state.profile ? h('p', { class: 'fineprint' }, 'Ton pseudo à partager : ',
        h('b', { text: '@' + state.profile.username })) : null));
    return;
  }

  ui.head = h('header', { class: 'chat-head' });
  ui.logIn = h('div', { class: 'log-in' });
  ui.log = h('div', { class: 'log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Messages' }, ui.logIn);
  ui.log.addEventListener('scroll', updateJump, { passive: true });
  ui.jump = h('button', {
    class: 'jump', type: 'button', hidden: true, 'aria-label': 'Aller aux derniers messages',
    onclick: () => ui.log.scrollTo({ top: ui.log.scrollHeight, behavior: 'smooth' }),
  }, icon('down'));
  ui.composer = buildComposer(id);
  ui.gate = h('div', { class: 'gate', hidden: true, role: 'status' });
  ui.searchBar = h('div', { class: 'search-bar', hidden: true, role: 'search' });
  ui.roomBar = h('div', { class: 'room-bar', hidden: true, role: 'status' });
  ui.keyNotice = h('div', { class: 'room-bar key-notice', hidden: true, role: 'status' });
  ui.chat.replaceChildren(ui.head, ui.roomBar, ui.keyNotice, ui.searchBar, ui.log, ui.jump, ui.gate, ui.composer);
  renderChatHead();
  renderMessages();
  renderGate();
  markRead(activeConv());
  if (!coarse && !ui.composer.hidden) ui.composer.querySelector('textarea').focus();

  // Membres privés de parole (groupes).
  unsub.restr = F.onSnapshot(F.collection(db, 'conversations', id, 'restrictions'), (snap) => {
    if (state.activeId !== id) return;
    restrictions.clear();
    for (const d of snap.docs) restrictions.set(d.id, ts(d.data().until));
    scheduleWake();
    scheduleRender();
  }, () => { /* règles pas encore publiées */ });

  subscribeMessages(id);
}

/* Les `state.limit` derniers messages de la conversation, en direct. */
function subscribeMessages(id) {
  if (unsub.msgs) unsub.msgs();
  unsub.msgs = F.onSnapshot(
    F.query(F.collection(db, 'conversations', id, 'messages'), F.orderBy('createdAt'), F.limitToLast(state.limit)),
    (snap) => {
      if (state.activeId !== id) return;
      state.messages = snap.docs.map((d) => ({
        id: d.id,
        // En cours d'envoi : sa date de création n'est pas encore fixée par le
        // serveur (une réaction en attente ne compte pas).
        pending: d.metadata.hasPendingWrites && !d.data({ serverTimestamps: 'none' }).createdAt,
        ...d.data({ serverTimestamps: 'estimate' }),
      }));
      state.messagesReady = true;
      ensurePeople(new Set(state.messages.map((m) => m.uid)));
      sweepExpired(id, state.messages);
      scheduleWake();
      renderMessages();
    },
    (err) => {
      if (state.activeId !== id || !ui || !ui.logIn) return;
      state.messagesReady = true;
      state.messages = [];
      if (err.code === 'permission-denied') {
        closeChat('Conversation introuvable', 'Elle n\'existe pas, ou tu n\'en fais pas partie.');
      } else {
        toast(describe(err), 'error');
      }
    });
}

/* La conversation ouverte n'est plus accessible : message à la place. */
function closeChat(title, text) {
  if (!ui || !ui.logIn) return;
  if (unsub.msgs) unsub.msgs();
  unsub.msgs = null;
  if (ui.composer && ui.composer.cleanup) ui.composer.cleanup();
  if (panel && panel.dlg.open) panel.dlg.close();
  ui.closed = true;
  state.messages = [];
  state.messagesReady = true;
  ui.logIn.replaceChildren(h('div', { class: 'log-note' },
    h('h3', { text: title }),
    h('p', { text }),
    h('a', { class: 'btn ghost sm', href: '#/' }, 'Retour')));
  renderGate();
}

function showGone() {
  closeChat('Tu ne fais plus partie de ce groupe',
    'Un admin t\'en a retiré, ou tu l\'as quitté depuis un autre appareil.');
}

const TTL_LABELS = { 0: 'Désactivés', 86400: '24 heures', 604800: '7 jours' };

function headSubtitle(conv) {
  const typing = typingText(conv);
  if (typing) return typing;
  const ttl = Number(conv.ttl) || 0;
  const eph = ttl ? '⏱ ' + (ttl === 86400 ? '24 h' : '7 j') + ' · ' : '';
  if (conv.type !== 'group') {
    const seen = isBlocked(otherUid(conv)) ? '' : presenceText(otherUid(conv));
    return eph + (seen ? seen + ' · ' : '') + convSubtitle(conv);
  }
  return eph + groupSubtitle(conv);
}

function groupSubtitle(conv) {
  const others = conv.members.filter((u) => u !== me()).map(nameOf);
  return conv.members.length + (conv.members.length > 1 ? ' membres' : ' membre') +
    (others.length ? ' · ' + others.join(', ') : '');
}

function renderChatHead() {
  if (!ui || !ui.head) return;
  const conv = activeConv();
  const back = h('a', { class: 'btn icon ghost back', href: '#/', 'aria-label': 'Retour aux conversations' }, icon('back'));
  if (!conv) {
    ui.head.replaceChildren(back, h('div', { class: 'chat-id' },
      h('b', { text: state.convsReady ? '' : 'Chargement…' })));
    return;
  }
  const dm = conv.type !== 'group';
  watchPresence(dm && !isBlocked(otherUid(conv)) ? otherUid(conv) : null);
  const callable = calls && (dm ? !isBlocked(otherUid(conv)) : Boolean(group) && !gateReason(conv));
  const infoLabel = dm ? 'Infos du contact' : 'Infos du groupe';
  ui.head.replaceChildren(...[back,
    h('button', {
      class: 'chat-id-btn', type: 'button', title: infoLabel, 'aria-label': infoLabel + ' : ' + convTitle(conv),
      onclick: () => openInfo(),
    },
    convAvatar(conv),
    h('span', { class: 'chat-id' },
      h('b', {}, h('span', { text: convTitle(conv) }), isMuted(conv.id) ? icon('bellOff') : null),
      h('small', { class: typingText(conv) ? 'typing' : null, text: headSubtitle(conv) }))),
    callable ? h('button', {
      class: 'btn icon ghost', type: 'button', title: dm ? 'Appel vocal' : 'Appel vocal de groupe',
      'aria-label': dm ? 'Appel vocal' : 'Appel vocal de groupe',
      onclick: () => startCall(conv, false),
    }, icon('phone')) : null,
    callable ? h('button', {
      class: 'btn icon ghost', type: 'button', title: dm ? 'Appel vidéo' : 'Appel vidéo de groupe',
      'aria-label': dm ? 'Appel vidéo' : 'Appel vidéo de groupe',
      onclick: () => startCall(conv, true),
    }, icon('video')) : null,
    // Sur petit écran, la recherche est dans les infos de la conversation.
    h('button', {
      class: 'btn icon ghost wide-only', type: 'button', title: 'Rechercher', 'aria-label': 'Rechercher dans la conversation',
      onclick: openSearch,
    }, icon('search')),
    h('button', {
      class: 'btn icon ghost', type: 'button', title: infoLabel, 'aria-label': infoLabel,
      onclick: () => openInfo(),
    }, icon('info'))].filter(Boolean));
  renderRoomBar(conv);
  if (dm && ui.keyChecked !== conv.id) {
    ui.keyChecked = conv.id;
    const peer = otherUid(conv);
    checkKeyChange(peer).then((fp) => { if (fp && state.activeId === conv.id) showKeyNotice(peer, fp); }).catch(() => {});
  }
}

function showKeyNotice(uid, fp) {
  if (!ui || !ui.keyNotice) return;
  ui.keyNotice.hidden = false;
  ui.keyNotice.replaceChildren(icon('lock'),
    h('span', { class: 'room-txt', text: 'La clé de sécurité de ' + nameOf(uid) + ' a changé (nouvel appareil ou code de ' +
      'secours perdu). En cas de doute, vérifiez-la ensemble.' }),
    h('button', { class: 'btn ghost sm', type: 'button', onclick: () => openVerify(uid) }, 'Vérifier'),
    h('button', {
      class: 'btn icon ghost', type: 'button', 'aria-label': 'J\'ai compris',
      onclick: () => { ui.keyNotice.hidden = true; run(acceptKey(uid, fp)); },
    }, icon('close')));
}

/* Bandeau « Appel de groupe en cours · Rejoindre ». */
function renderRoomBar(conv) {
  if (!ui || !ui.roomBar) return;
  const live = conv && conv.type === 'group' && conv.room && conv.room.id && group
    && !(group.current && group.current.id === conv.room.id);
  ui.roomBar.hidden = !live;
  if (!live) {
    ui.roomBar.replaceChildren();
    return;
  }
  if (!tidied.has(conv.room.id)) {
    tidied.add(conv.room.id);
    group.tidy(conv);
  }
  ui.roomBar.replaceChildren(
    h('span', { class: 'room-dot', 'aria-hidden': 'true' }),
    h('span', { class: 'room-txt', text: (conv.room.video ? 'Appel vidéo' : 'Appel vocal') + ' de groupe en cours' }),
    h('button', { class: 'btn primary sm', type: 'button', onclick: () => joinGroupCall(conv) },
      icon(conv.room.video ? 'video' : 'phone'), 'Rejoindre'));
}

/* Pourquoi on ne peut pas écrire ici (bloqué, privé de parole, écriture
   réservée aux admins), ou null. */
function gateReason(conv) {
  if (!conv) return null;
  if (conv.type !== 'group') {
    const other = otherUid(conv);
    if (!isBlocked(other)) return null;
    return {
      text: 'Tu as bloqué ' + nameOf(other) + ' : plus aucun message ni appel de sa part.',
      action: ['Débloquer', () => setBlocked(other, false)],
    };
  }
  const until = silencedUntil(me());
  if (until) return { text: '🔇 Un admin t\'a retiré la parole jusqu\'à ' + untilText(until) + '.' };
  if (!can(conv, 'send')) return { text: 'Seuls les admins peuvent écrire dans ce groupe.' };
  return null;
}

function renderGate() {
  if (!ui || !ui.gate || !ui.composer) return;
  if (ui.closed) {
    ui.gate.hidden = true;
    ui.composer.hidden = true;
    return;
  }
  const r = gateReason(activeConv());
  ui.gate.hidden = !r;
  ui.composer.hidden = Boolean(r);
  if (!r) return;
  ui.gate.replaceChildren(...[
    h('p', { text: r.text }),
    r.action ? h('button', { class: 'btn ghost sm', type: 'button', onclick: r.action[1] }, r.action[0]) : null,
  ].filter(Boolean));
}

function typingRow(conv) {
  const text = conv ? typingText(conv) : '';
  if (!text) return null;
  const label = conv.type === 'group' ? text : ((person(otherUid(conv)) || {}).name || '') + ' écrit…';
  return h('div', { class: 'typing-row' },
    h('span', { class: 'typing-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
    h('span', { text: label }));
}

function renderMessages() {
  if (!ui || !ui.logIn || ui.closed) return;
  const conv = activeConv();
  const cid = state.activeId;
  const log = ui.log;
  const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 120;
  const firstPaint = !ui.logIn.dataset.painted;

  if (!state.messagesReady) {
    ui.logIn.replaceChildren(h('p', { class: 'log-hint', text: 'Chargement des messages…' }));
    return;
  }
  // Les messages éphémères échus disparaissent (et sont effacés de la base).
  const visible = state.messages.filter((m) => !expired(m));
  if (!visible.length) {
    const text = conv && conv.type === 'group'
      ? 'Le groupe « ' + conv.title + ' » est créé. Lance la discussion !'
      : 'Dis bonjour 👋';
    ui.logIn.replaceChildren(...[h('p', { class: 'log-hint', text }), typingRow(conv)].filter(Boolean));
    ui.logIn.dataset.painted = '1';
    return;
  }

  const group = conv && conv.type === 'group';
  const msgs = visible.map((m) => ({ ...m, t: ts(m.createdAt) || Date.now(), c: content(cid, m) }));
  msgs.sort((a, b) => a.t - b.t);
  const byId = new Map(msgs.map((m) => [m.id, m]));
  const solo = (m) => m.c.kind === 'call' || m.c.kind === 'event';
  const names = conv ? mentionNames(conv) : {};

  // Dernier de mes messages : lu par l'autre personne (discussion à deux),
  // ou par combien de membres (groupe).
  const mine = msgs.filter((m) => m.uid === me() && !solo(m) && m.c.state !== 'deleted');
  const lastMine = mine[mine.length - 1];
  let seenId = null;
  let seenBy = 0;
  if (conv && lastMine && !lastMine.pending) {
    const readers = readersOf(conv, lastMine.t);
    if (!group && readers.length) seenId = lastMine.id;
    if (group) seenBy = readers.length;
  }

  const nodes = [h('p', { class: 'log-hint e2e', text:
    '🔒 Messages, photos, fichiers et messages vocaux sont chiffrés de bout en bout.' })];
  if (state.messages.length >= state.limit) {
    nodes.push(h('p', { class: 'log-more' }, h('button', {
      class: 'btn ghost sm', type: 'button', onclick: loadOlder,
    }, 'Charger les messages précédents')));
  }
  // Deux messages forment un bloc s'ils viennent de la même personne, le même
  // jour, à moins de RUN_GAP d'écart ; un journal d'appel ou un événement du
  // groupe coupe les blocs.
  const joins = (a, b) => a && b && a.uid === b.uid && !solo(a) && !solo(b)
    && Math.abs(b.t - a.t) <= RUN_GAP && startOfDay(a.t) === startOfDay(b.t);
  const mentioned = [];
  let prevDay = null;
  msgs.forEach((m, i) => {
    const day = startOfDay(m.t);
    if (day !== prevDay) {
      nodes.push(h('p', { class: 'day' }, h('span', { text: dayLabel(m.t) })));
      prevDay = day;
    }
    const author = person(m.uid);
    const notes = notesOf(cid, m, m.c);
    const p = m.c.payload || {};
    const reply = p.reply && typeof p.reply.id === 'string' ? p.reply : null;
    const target = reply ? byId.get(reply.id) : null;
    const f = {
      first: !joins(msgs[i - 1], m),
      last: !joins(m, msgs[i + 1]),
      mine: m.uid === me(),
      group,
      seen: m.id === seenId,
      seenBy: lastMine && m.id === lastMine.id ? seenBy : 0,
      // Dans un groupe, les messages d'une personne bloquée sont masqués.
      masked: group && m.uid !== me() && isBlocked(m.uid) && !revealed.has(m.id),
      mention: Array.isArray(p.mentions) && p.mentions.includes(me()) && m.uid !== me(),
      notes,
      names,
      reply,
      replyGone: Boolean(target && target.c.state === 'deleted'),
    };
    const event = m.c.kind === 'event' && m.c.state === 'ok';
    if (event && Array.isArray(p.targets)) mentioned.push(...p.targets);
    if (reply) mentioned.push(reply.uid);
    const sig = [m.c.state, m.c.kind, event ? eventText(p, m.uid) : m.c.text, f.first, f.last,
      f.mine, group, f.seen, f.seenBy, f.masked, f.mention, f.replyGone, m.pending, ts(m.editedAt),
      m.deletedBy || '', Boolean(m.exp), fmtTime.format(m.t), author ? author.name : '',
      reply ? nameOf(reply.uid) : '', JSON.stringify(notes), gateReason(conv) ? 1 : 0].join('\u0001');
    let hit = rowCache.get(m.id);
    if (!hit || hit.sig !== sig) {
      hit = { sig, node: messageRow(cid, conv, m, m.c, f, author) };
      rowCache.set(m.id, hit);
    }
    nodes.push(hit.node);
  });
  ensurePeople(new Set(mentioned.filter((u) => typeof u === 'string')));
  const typing = typingRow(conv);
  if (typing) nodes.push(typing);
  ui.logIn.replaceChildren(...nodes);
  ui.logIn.dataset.painted = '1';
  updateVoice(Media.player.state());
  markSearch();

  const lastMsg = msgs[msgs.length - 1];
  const grew = ui.logIn.dataset.lastId !== lastMsg.id;
  ui.logIn.dataset.lastId = lastMsg.id;
  if (ui.keepScroll) {
    // Messages plus anciens chargés au-dessus : on garde la même vue.
    log.scrollTop = log.scrollHeight - ui.keepScroll;
    ui.keepScroll = 0;
  } else if (state.search && state.search.q) {
    // La recherche décide de la position.
  } else if (firstPaint || nearBottom || (lastMsg.uid === me() && lastMsg.pending)) {
    log.scrollTop = log.scrollHeight;
  } else if (grew && ui.jump) {
    ui.jump.classList.add('fresh');
  }
  updateJump();
}

/* Membres (autres que moi) qui ont lu la conversation après `t`. */
function readersOf(conv, t) {
  return conv.members.filter((u) => u !== me() && conv.lastRead && ts(conv.lastRead[u]) >= t);
}

/* Pseudos des membres, pour repérer les @mentions. */
function mentionNames(conv) {
  const out = {};
  for (const u of conv.members) {
    const p = person(u);
    if (p && p.username) out[p.username] = u;
  }
  return out;
}

function mentionsIn(text, conv) {
  const names = mentionNames(conv);
  const found = new Set();
  for (const m of String(text).matchAll(/@([a-z0-9_]{3,20})/gi)) {
    const u = names[m[1].toLowerCase()];
    if (u && u !== me()) found.add(u);
  }
  return [...found].slice(0, 19);
}

/* Texte avec liens et @mentions des membres mis en valeur. */
function richBody(text, names) {
  const frag = richText(text);
  if (!names || !Object.keys(names).length) return frag;
  const walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) if (!walker.currentNode.parentElement || walker.currentNode.parentElement.tagName !== 'A') texts.push(walker.currentNode);
  for (const node of texts) {
    const parts = node.data.split(/(@[a-z0-9_]{3,20})/gi);
    if (parts.length === 1) continue;
    node.replaceWith(...parts.map((part) => {
      const u = part.startsWith('@') ? names[part.slice(1).toLowerCase()] : null;
      return u ? h('span', { class: 'mention' + (u === me() ? ' me' : ''), text: part }) : part;
    }));
  }
  return frag;
}

function replySnippet(m, c) {
  return [...summary(c, m.uid === me(), m.uid).replace(/\s+/g, ' ')].slice(0, 120).join('');
}

function quoteFor(f) {
  const r = f.reply;
  return h('button', {
    class: 'quote', type: 'button', 'aria-label': 'Voir le message cité',
    onclick: (e) => { e.stopPropagation(); scrollToMessage(r.id); },
  },
  h('b', { text: r.uid === me() ? 'Toi' : nameOf(r.uid) }),
  h('span', { text: f.replyGone ? '🚫 Message supprimé' : String(r.s || '') }));
}

function scrollToMessage(id) {
  const hit = rowCache.get(id);
  if (!hit || !hit.node.isConnected) {
    toast('Ce message est trop ancien pour être affiché ici.', 'info');
    return;
  }
  hit.node.scrollIntoView({ block: 'center', behavior: 'smooth' });
  hit.node.classList.remove('flash');
  void hit.node.offsetWidth;
  hit.node.classList.add('flash');
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function reactionsRow(cid, m, c, f) {
  const counts = new Map();
  for (const n of Object.values(f.notes)) if (n.r) counts.set(n.r, (counts.get(n.r) || 0) + 1);
  if (!counts.size) return null;
  const mineR = (f.notes[me()] || {}).r;
  return h('button', {
    class: 'reacts', type: 'button', 'aria-label': 'Voir les réactions',
    onclick: (e) => { e.stopPropagation(); openReactions(cid, m, c, f); },
  }, [...counts].map(([emoji, n]) => h('span', { class: 'react' + (emoji === mineR ? ' mine' : '') },
    emoji, n > 1 ? h('small', { text: String(n) }) : null)));
}

function messageRow(cid, conv, m, c, f, author) {
  if (c.kind === 'event' && c.state === 'ok') {
    return h('div', { class: 'msg system', 'data-mid': m.id },
      h('p', { class: 'sys-note' },
        h('span', { text: eventText(c.payload, m.uid) }),
        h('time', { text: m.pending ? 'Envoi…' : fmtTime.format(m.t) })));
  }
  if (c.kind === 'call' && c.state === 'ok') {
    const p = c.payload;
    const missed = p.status !== 'ended';
    return h('div', { class: 'msg system', 'data-mid': m.id },
      h('div', { class: 'call-log' + (missed ? ' missed' : '') },
        icon(p.video ? 'video' : 'phone'),
        h('span', { text: callLabel(p, f.mine) }),
        h('time', { text: m.pending ? 'Envoi…' : fmtTime.format(m.t) }),
        calls && conv && conv.type !== 'group'
          ? h('button', { class: 'linkish', type: 'button', onclick: () => startCall(conv, Boolean(p.video)) }, 'Rappeler')
          : null));
  }

  const readable = c.state === 'ok' || c.state === 'legacy';
  let bubble;
  if (f.masked) {
    bubble = h('div', { class: 'bubble masked' }, 'Message d\'une personne bloquée · ',
      h('button', {
        class: 'linkish', type: 'button',
        onclick: () => { revealed.add(m.id); scheduleRender(); },
      }, 'Afficher'));
  } else if (c.state === 'deleted') {
    bubble = h('div', { class: 'bubble deleted' }, icon('ban'),
      m.deletedBy && m.deletedBy !== m.uid ? 'Supprimé par un admin' : 'Message supprimé');
  } else if (readable && c.kind === 'image') {
    bubble = photoBubble(cid, m, c, f.names);
  } else if (readable && c.kind === 'audio') {
    bubble = voiceBubble(cid, m, c);
  } else if (readable && c.kind === 'file') {
    bubble = fileBubble(cid, m, c, f.names);
  } else if (readable && c.kind === 'poll') {
    bubble = pollBubble(cid, conv, m, c, f);
  } else {
    bubble = h('div', {
      class: 'bubble' + (readable && EMOJI_ONLY.test(c.text) && !f.reply ? ' emoji' : '') + (readable ? '' : ' locked'),
      title: c.state === 'error'
        ? 'Ce message a été chiffré pour une ancienne clé de ton compte.'
        : fmtTime.format(m.t) + (c.state === 'legacy' ? ' · envoyé avant le chiffrement' : ''),
    }, c.state === 'pending' ? 'Déchiffrement…' : c.state === 'error' ? '🔒 Message illisible' : richBody(c.text, f.names));
  }
  if (f.reply && !f.masked && c.state === 'ok') {
    if (c.kind === 'audio') bubble = h('div', { class: 'bubble-stack' }, quoteFor(f), bubble);
    else bubble.prepend(quoteFor(f));
  }

  const actionable = !f.masked && c.state !== 'deleted' && c.state !== 'pending';
  const body = h('div', { class: 'msg-body' },
    f.group && !f.mine && f.first ? h('span', { class: 'author', text: author ? author.name : '…' }) : null,
    h('div', { class: 'bubble-wrap' },
      bubble,
      actionable && !coarse
        ? h('button', {
          class: 'msg-more', type: 'button', 'aria-label': 'Actions sur le message',
          onclick: (e) => { e.stopPropagation(); openMessageMenu(cid, m, c, f); },
        }, icon('more'))
        : null),
    reactionsRow(cid, m, c, f),
    h('span', { class: 'meta' + (f.last ? '' : ' on-tap') },
      m.exp ? h('span', { class: 'meta-ic', title: 'Message éphémère' }, '⏱ ') : null,
      m.pending ? 'Envoi…' : fmtTime.format(m.t),
      m.editedAt && c.state === 'ok' ? ' · modifié' : '',
      f.seen ? ' · Vu' : '',
      f.seenBy ? h('button', {
        class: 'linkish seen-by', type: 'button',
        onclick: (e) => { e.stopPropagation(); openMessageInfo(conv, m); },
      }, ' · Vu par ' + f.seenBy) : ''));
  // Un appui sur la bulle affiche son heure (pas d'infobulle sur mobile).
  body.addEventListener('click', (e) => {
    if (e.target.closest('a, button, .voice-wave')) return;
    body.parentElement.classList.toggle('show-meta');
  });
  if (actionable) {
    bindPress(body, () => openMessageMenu(cid, m, c, f));
    if (coarse) bindSwipe(body, () => { if (ui.composer && !gateReason(conv)) ui.composer.startReply(m, c); });
  }

  return h('div', {
    class: 'msg ' + (f.mine ? 'mine' : 'theirs') + (f.first ? ' first' : '') + (f.last ? ' last' : '') +
      (m.pending ? ' pending' : '') + (f.mention ? ' mentioned' : ''),
    'data-mid': m.id,
  },
  f.group && !f.mine ? (f.last ? avatar(m.uid, author ? author.name : '?', 'xs') : h('span', { class: 'avatar-gap' })) : null,
  body);
}

/* Appui long (doigt) ou clic droit (souris) : menu du message ou de la
   conversation. `ignore` : éléments internes qui gardent leur propre geste. */
function bindPress(el, onPress, ignore = 'a, button, .voice-wave') {
  let timer = null;
  let start = null;
  const cancel = () => { clearTimeout(timer); timer = null; };
  const inner = (e) => {
    const hit = e.target.closest(ignore);
    return Boolean(hit && hit !== el && el.contains(hit));
  };
  el.addEventListener('contextmenu', (e) => {
    if (inner(e)) return;
    e.preventDefault();
    cancel();
    onPress();
  });
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || inner(e)) return;
    start = { x: e.clientX, y: e.clientY };
    cancel();
    timer = setTimeout(() => {
      timer = null;
      el.dataset.pressed = '1';
      if (navigator.vibrate) navigator.vibrate(15);
      onPress();
    }, 450);
  });
  el.addEventListener('pointermove', (e) => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) cancel();
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, cancel);
  // Le clic qui suit un appui long ne compte pas.
  el.addEventListener('click', (e) => {
    if (el.dataset.pressed) {
      delete el.dataset.pressed;
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
}

/* Glisser un message vers la droite : y répondre. */
function bindSwipe(el, onSwipe) {
  let start = null;
  let dx = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    start = { x: e.clientX, y: e.clientY };
    dx = 0;
  });
  el.addEventListener('pointermove', (e) => {
    if (!start) return;
    const x = e.clientX - start.x;
    const y = Math.abs(e.clientY - start.y);
    if (y > 24 && Math.abs(x) < y) { start = null; el.style.transform = ''; return; }
    dx = Math.max(0, Math.min(80, x));
    if (dx > 6) el.style.transform = 'translateX(' + dx + 'px)';
    el.classList.toggle('swiping', dx > 56);
  });
  const end = () => {
    if (start && dx > 56) onSwipe();
    start = null;
    dx = 0;
    el.style.transform = '';
    el.classList.remove('swiping');
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

function openMessageMenu(cid, m, c, f) {
  const conv = state.convs.find((x) => x.id === cid);
  if (!conv) return;
  const canWrite = !gateReason(conv);
  const canNote = canWrite && c.state === 'ok' && Boolean(m.enc) && !m.pending;
  const mineR = (f.notes[me()] || {}).r;
  const items = [];
  if (canWrite && ui.composer) items.push({ label: 'Répondre', icon: 'reply', onclick: () => ui.composer.startReply(m, c) });
  if (c.text && c.state !== 'error') {
    items.push({
      label: 'Copier le texte', icon: 'copy',
      onclick: () => navigator.clipboard.writeText(c.text).then(() => toast('Texte copié.', 'success')).catch(() => {}),
    });
  }
  if (c.kind === 'poll' && c.state === 'ok') items.push({ label: 'Voir les votes', icon: 'poll', onclick: () => openPollVotes(cid, m, c, f) });
  if (Object.keys(f.notes).some((u) => f.notes[u].r)) items.push({ label: 'Voir les réactions', icon: 'smile', onclick: () => openReactions(cid, m, c, f) });
  if (canWrite && editable(m, c) && ui.composer) items.push({ label: 'Modifier', icon: 'edit', onclick: () => ui.composer.startEdit(m, c) });
  if (m.uid === me()) items.push({ label: 'Infos', sub: 'Qui l\'a lu', icon: 'info', onclick: () => openMessageInfo(conv, m) });
  if (m.enc && (m.uid === me() || (conv.type === 'group' && isAdmin(conv)))) {
    items.push({ label: 'Supprimer pour tout le monde', icon: 'trash', danger: true, onclick: () => run(deleteMessage(cid, m, c)) });
  }
  const dlg = menu('Message', items);
  if (canNote) {
    dlg.querySelector('.menu').prepend(h('div', { class: 'react-bar', role: 'group', 'aria-label': 'Réagir' },
      REACTIONS.map((e) => h('button', {
        type: 'button', 'aria-pressed': String(e === mineR), 'aria-label': 'Réagir ' + e,
        onclick: () => { dlg.close(); react(cid, m, c, e); },
      }, e))));
  }
}

function openReactions(cid, m, c, f) {
  const rows = Object.entries(f.notes).filter(([, n]) => n.r)
    .sort(([a], [b]) => (a === me() ? -1 : b === me() ? 1 : nameOf(a).localeCompare(nameOf(b), 'fr')));
  const mineR = (f.notes[me()] || {}).r;
  const dlg = modal('Réactions', h('div', { class: 'pick-list' },
    rows.map(([u, n]) => h('div', { class: 'member static' },
      avatar(u, nameOf(u), 'sm'),
      h('span', { class: 'member-txt' }, h('b', { text: u === me() ? 'Toi' : nameOf(u) })),
      h('span', { class: 'react-big', text: n.r }))),
    mineR ? h('div', { class: 'row-actions end' }, h('button', {
      class: 'btn ghost sm', type: 'button', onclick: () => { dlg.close(); react(cid, m, c, mineR); },
    }, 'Retirer ma réaction')) : null), 'menu-dlg');
}

function openMessageInfo(conv, m) {
  const t = ts(m.createdAt);
  const readers = new Set(readersOf(conv, t));
  const others = conv.members.filter((u) => u !== me());
  const row = (u, read) => h('div', { class: 'member static' },
    avatar(u, nameOf(u), 'sm'),
    h('span', { class: 'member-txt' }, h('b', { text: nameOf(u) }),
      h('small', { text: read ? 'Lu · ' + listTime(ts(conv.lastRead[u])) : 'Pas encore lu' })),
    read ? h('span', { class: 'tick on' }, icon('check')) : null);
  modal('Infos du message', h('div', { class: 'info' },
    h('p', { class: 'fineprint', text: 'Envoyé ' + dayLabel(t).toLowerCase() + ' à ' + fmtTime.format(t) +
      (m.editedAt ? ' · modifié à ' + fmtTime.format(ts(m.editedAt)) : '') }),
    section('Lu par ' + readers.size + ' / ' + others.length,
      h('div', { class: 'pick-list' }, others.filter((u) => readers.has(u)).map((u) => row(u, true)),
        others.filter((u) => !readers.has(u)).map((u) => row(u, false))))), 'menu-dlg');
}

function fileBubble(cid, m, c, names) {
  const p = c.payload;
  const name = fileName(p);
  const ext = (name.match(/\.([a-z0-9]{1,5})$/i) || [])[1];
  const get = h('button', { class: 'file-get', type: 'button', 'aria-label': 'Télécharger ' + name, title: 'Télécharger' }, icon('download'));
  get.addEventListener('click', (e) => {
    e.stopPropagation();
    get.classList.add('is-busy');
    mediaUrl(cid, m.id, p)
      .then((url) => {
        const a = h('a', { href: url, download: name });
        document.body.append(a);
        a.click();
        a.remove();
      })
      .catch(() => toast('Ce fichier ne peut pas être déchiffré.', 'error'))
      .finally(() => get.classList.remove('is-busy'));
  });
  return h('div', { class: 'bubble file-b' },
    h('div', { class: 'file-card' },
      h('span', { class: 'file-ic', text: ext ? ext.toUpperCase() : 'FICHIER' }),
      h('span', { class: 'file-txt' }, h('b', { text: name }),
        h('small', { text: Media.formatBytes(Number(p.size) || 0) + ' · chiffré' })),
      get),
    c.text ? h('p', { class: 'caption' }, richBody(c.text, names)) : null);
}

function pollBubble(cid, conv, m, c, f) {
  const p = c.payload;
  const options = (Array.isArray(p.options) ? p.options : []).slice(0, 10).map((o) => [...String(o)].slice(0, 100).join(''));
  const counts = options.map(() => 0);
  const voters = new Set();
  for (const [u, n] of Object.entries(f.notes)) {
    for (const i of n.v) if (i < options.length) { counts[i]++; voters.add(u); }
  }
  const mineV = (f.notes[me()] || { v: [] }).v;
  const max = Math.max(1, ...counts);
  const canVote = conv && !gateReason(conv) && Boolean(m.enc) && !m.pending;
  return h('div', { class: 'bubble poll' },
    h('p', { class: 'poll-q', text: c.text }),
    h('p', { class: 'poll-kind', text: p.multi ? 'Plusieurs réponses possibles' : 'Une seule réponse' }),
    options.map((o, i) => h('button', {
      class: 'poll-opt', type: 'button', 'aria-pressed': String(mineV.includes(i)), disabled: !canVote,
      onclick: (e) => { e.stopPropagation(); vote(cid, m, c, i); },
    },
    h('span', { class: 'poll-check' }, icon('check')),
    h('span', { class: 'poll-label', text: o }),
    h('span', { class: 'poll-count', text: String(counts[i]) }),
    h('span', { class: 'poll-bar', style: 'width:' + Math.round((counts[i] / max) * 100) + '%' }))),
    h('button', {
      class: 'linkish poll-foot', type: 'button',
      onclick: (e) => { e.stopPropagation(); openPollVotes(cid, m, c, f); },
    }, voters.size + (voters.size > 1 ? ' votants' : ' votant') + ' · Voir les votes'));
}

function openPollVotes(cid, m, c, f) {
  const p = c.payload;
  const options = (Array.isArray(p.options) ? p.options : []).slice(0, 10);
  modal('Votes', h('div', { class: 'info' },
    h('p', { class: 'poll-q', text: c.text }),
    options.map((o, i) => {
      const who = Object.entries(f.notes).filter(([, n]) => n.v.includes(i)).map(([u]) => u);
      return section(h('span', {}, String(o), ' ', h('span', { class: 'count-badge', text: String(who.length) })),
        who.length
          ? h('div', { class: 'pick-list' }, who.map((u) => h('div', { class: 'member static' },
            avatar(u, nameOf(u), 'sm'), h('span', { class: 'member-txt' }, h('b', { text: u === me() ? 'Toi' : nameOf(u) })))))
          : h('p', { class: 'fineprint', text: 'Aucun vote.' }));
    })), 'menu-dlg');
}

/* ------------------------------------------------------------------------ */
/* Recherche dans la conversation (sur les messages déchiffrés)             */
/* ------------------------------------------------------------------------ */

const fold = (t) => String(t || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function searchable(c) {
  if (c.state !== 'ok' && c.state !== 'legacy') return '';
  const p = c.payload || {};
  return [c.text, c.kind === 'file' ? fileName(p) : '', c.kind === 'poll' && Array.isArray(p.options) ? p.options.join(' ') : '']
    .join(' ');
}

function openSearch() {
  if (!ui || !ui.searchBar) return;
  if (state.search) {
    state.search.input.focus();
    return;
  }
  const input = h('input', {
    type: 'search', placeholder: 'Rechercher dans la conversation', 'aria-label': 'Rechercher dans la conversation',
    enterkeyhint: 'search', autocomplete: 'off',
  });
  const count = h('span', { class: 'search-count', 'aria-live': 'polite' });
  const btn = (label, name, onclick) => h('button', { class: 'btn icon ghost', type: 'button', 'aria-label': label, title: label, onclick }, icon(name));
  ui.searchBar.replaceChildren(icon('search'), input, count,
    btn('Résultat précédent', 'up', () => stepSearch(-1)),
    btn('Résultat suivant', 'downSmall', () => stepSearch(1)),
    btn('Fermer la recherche', 'close', closeSearch));
  ui.searchBar.hidden = false;
  state.search = { q: '', hits: [], i: -1, input, count };
  input.addEventListener('input', () => runSearch(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); stepSearch(e.shiftKey ? 1 : -1); }
    if (e.key === 'Escape') closeSearch();
  });
  input.focus();
}

function runSearch(q) {
  const S = state.search;
  if (!S) return;
  S.q = fold(q.trim());
  const cid = state.activeId;
  S.hits = !S.q ? [] : state.messages
    .filter((m) => !expired(m))
    .map((m) => ({ id: m.id, t: ts(m.createdAt), text: fold(searchable(content(cid, m))) }))
    .filter((m) => m.text.includes(S.q))
    .sort((a, b) => a.t - b.t)
    .map((m) => m.id);
  S.i = S.hits.length - 1;
  markSearch();
  focusHit();
}

function stepSearch(delta) {
  const S = state.search;
  if (!S || !S.hits.length) return;
  S.i = (S.i + delta + S.hits.length) % S.hits.length;
  markSearch();
  focusHit();
}

/* Surligne les résultats sur les lignes déjà dessinées. */
function markSearch() {
  const S = state.search;
  const hits = new Set(S ? S.hits : []);
  const now = S && S.i >= 0 ? S.hits[S.i] : null;
  for (const [id, hit] of rowCache) {
    hit.node.classList.toggle('hit', hits.has(id));
    hit.node.classList.toggle('hit-now', id === now);
  }
  if (S) {
    S.count.textContent = !S.q ? '' : S.hits.length ? (S.i + 1) + ' / ' + S.hits.length : 'Aucun résultat';
  }
}

function focusHit() {
  const S = state.search;
  const hit = S && S.i >= 0 ? rowCache.get(S.hits[S.i]) : null;
  if (hit && hit.node.isConnected) hit.node.scrollIntoView({ block: 'center' });
}

function closeSearch() {
  state.search = null;
  if (ui && ui.searchBar) {
    ui.searchBar.hidden = true;
    ui.searchBar.replaceChildren();
  }
  markSearch();
}

/* Messages plus anciens : 200 de plus à chaque fois. */
function loadOlder() {
  if (!ui || !ui.log) return;
  ui.keepScroll = ui.log.scrollHeight - ui.log.scrollTop;
  state.limit += HISTORY;
  subscribeMessages(state.activeId);
}

function photoBubble(cid, m, c, names) {
  const p = c.payload;
  const w0 = Math.max(1, Number(p.w) || 1);
  const h0 = Math.max(1, Number(p.h) || 1);
  let width = Math.min(300, w0);
  if ((width * h0) / w0 > 360) width = (360 * w0) / h0;
  width = Math.max(120, Math.round(width));
  const img = h('img', { alt: c.text || 'Photo', decoding: 'async' });
  const frame = h('button', {
    class: 'photo', type: 'button', 'aria-label': 'Agrandir la photo',
    style: 'width:' + width + 'px;aspect-ratio:' + w0 + ' / ' + h0,
  }, img);
  mediaUrl(cid, m.id, p)
    .then((url) => {
      img.src = url;
      frame.classList.add('ready');
      frame.onclick = () => openPhoto(url, c.text, safeType(p));
    })
    .catch(() => {
      frame.classList.add('broken');
      frame.disabled = true;
      frame.setAttribute('aria-label', 'Photo illisible');
    });
  return h('div', { class: 'bubble media' }, frame, c.text ? h('p', { class: 'caption' }, richBody(c.text, names)) : null);
}

function voiceBubble(cid, m, c) {
  const p = c.payload;
  const key = cid + '/' + m.id;
  const levels = Array.isArray(p.wave) && p.wave.length ? p.wave.slice(0, 64) : Array(40).fill(4);
  const play = h('button', { class: 'voice-play', type: 'button', 'aria-label': 'Écouter le message vocal' }, icon('play'));
  const wave = h('div', { class: 'voice-wave', 'aria-hidden': 'true' },
    levels.map((v) => h('i', { style: 'height:' + Math.max(14, Math.min(100, ((Number(v) || 1) / 15) * 100)) + '%' })));
  const el = h('div', { class: 'bubble voice', 'data-voice': key, 'data-duration': Number(p.duration) || 0 },
    play,
    wave,
    h('span', { class: 'voice-time', text: Media.formatDuration(p.duration) }),
    h('button', {
      class: 'voice-rate', type: 'button', 'aria-label': 'Vitesse de lecture', hidden: true,
      onclick: () => Media.player.cycleRate(),
    }, '1×'));
  play.addEventListener('click', () => {
    Notify.unlockAudio();
    el.classList.add('loading');
    mediaUrl(cid, m.id, p)
      .then((url) => Media.player.toggle(key, url, p.duration))
      .catch(() => toast('Ce message vocal ne peut pas être lu sur ce navigateur.', 'error'))
      .finally(() => el.classList.remove('loading'));
  });
  wave.addEventListener('click', (e) => {
    const r = wave.getBoundingClientRect();
    Media.player.seek(key, (e.clientX - r.left) / r.width);
  });
  return el;
}

/* Le lecteur est unique (media.js) : on reflète son état sur les messages
   vocaux affichés. */
function updateVoice(st) {
  if (!ui || !ui.log) return;
  for (const el of ui.log.querySelectorAll('[data-voice]')) {
    const active = st.id === el.dataset.voice;
    const duration = active && st.duration ? st.duration : Number(el.dataset.duration) || 0;
    const progress = active && duration ? Math.min(1, st.time / duration) : 0;
    const playing = active && st.playing;
    el.classList.toggle('playing', playing);
    const btn = el.querySelector('.voice-play');
    if (btn.dataset.state !== String(playing)) {
      btn.dataset.state = String(playing);
      btn.replaceChildren(icon(playing ? 'pause' : 'play'));
      btn.setAttribute('aria-label', playing ? 'Pause' : 'Écouter le message vocal');
    }
    const bars = el.querySelectorAll('.voice-wave i');
    const on = Math.round(progress * bars.length);
    bars.forEach((b, i) => b.classList.toggle('on', i < on));
    el.querySelector('.voice-time').textContent = Media.formatDuration(active && st.time ? st.time : duration);
    const rate = el.querySelector('.voice-rate');
    rate.hidden = !active;
    rate.textContent = String(st.rate).replace('.', ',') + '×';
  }
}

function updateJump() {
  if (!ui || !ui.jump || !ui.log) return;
  const far = ui.log.scrollHeight - ui.log.scrollTop - ui.log.clientHeight > 300;
  ui.jump.hidden = !far;
  if (!far) {
    ui.jump.classList.remove('fresh');
    return;
  }
  // Juste au-dessus de la zone de saisie, quelle que soit sa hauteur.
  const below = ui.chat.getBoundingClientRect().bottom - ui.log.getBoundingClientRect().bottom;
  ui.jump.style.bottom = Math.round(below + 14) + 'px';
}

function buildComposer(cid) {
  const voice = Media.voiceSupported();
  const ta = h('textarea', {
    rows: 1, maxlength: MAX_TEXT, placeholder: 'Écris un message…', 'aria-label': 'Message',
    enterkeyhint: coarse ? 'enter' : 'send',
  });
  ta.value = drafts.get(cid) || '';
  const count = h('span', { class: 'count', 'aria-live': 'polite' });
  const send = h('button', { class: 'btn icon primary send', type: 'submit', 'aria-label': 'Envoyer' }, icon('send'));
  const mic = h('button', {
    class: 'btn icon primary send', type: 'button', 'aria-label': 'Enregistrer un message vocal',
    title: 'Message vocal', hidden: !voice,
  }, icon('mic'));
  const photoInput = h('input', { type: 'file', accept: 'image/*', hidden: true, 'aria-hidden': 'true', tabindex: -1 });
  const fileInput = h('input', { type: 'file', hidden: true, 'aria-hidden': 'true', tabindex: -1 });
  const attachBtn = h('button', {
    class: 'btn icon ghost attach', type: 'button', 'aria-label': 'Joindre : photo, fichier ou sondage', title: 'Joindre',
    onclick: () => menu('Joindre', [
      { label: 'Photo', sub: 'Compressée, chiffrée', icon: 'image', onclick: () => photoInput.click() },
      { label: 'Fichier', sub: 'PDF, document… jusqu\'à ' + Media.formatBytes(Media.MAX_MEDIA_BYTES), icon: 'file', onclick: () => fileInput.click() },
      { label: 'Sondage', sub: 'Une question, jusqu\'à 10 réponses', icon: 'poll', onclick: () => openPollComposer(cid) },
    ]),
  }, icon('plus'));
  const context = h('div', { class: 'tray context', hidden: true }); // réponse ou modification
  const tray = h('div', { class: 'tray', hidden: true });            // pièce jointe
  const mentionPop = h('div', { class: 'mention-pop', hidden: true, role: 'listbox', 'aria-label': 'Mentionner un membre' });
  const row = h('div', { class: 'composer-row' }, attachBtn, photoInput, fileInput, ta, count, send, mic);
  const recTime = h('span', { class: 'rec-time', text: '0:00' });
  const recLevel = h('span', { class: 'rec-level', 'aria-hidden': 'true' }, Array.from({ length: 48 }, () => h('i')));
  const recBar = h('div', { class: 'rec', hidden: true, role: 'status' },
    h('button', {
      class: 'btn icon ghost', type: 'button', 'aria-label': 'Annuler l\'enregistrement', title: 'Annuler',
      onclick: () => finishRecording(false),
    }, icon('trash')),
    h('span', { class: 'rec-dot', 'aria-hidden': 'true' }),
    recTime,
    recLevel,
    h('button', {
      class: 'btn icon primary send', type: 'button', 'aria-label': 'Envoyer le message vocal',
      onclick: () => finishRecording(true),
    }, icon('send')));

  let attached = null; // { kind: 'image' | 'file', blob, url?, w, h, mime, name }
  let replyTo = null;  // { id, uid, s }
  let editing = null;  // { m, c }
  let recorder = null;
  let recTimer = null;
  let mentionList = [];
  let mentionIndex = 0;

  function sync() {
    // Boutons d'abord : la largeur du champ en dépend, et sa hauteur de sa largeur.
    const ready = Boolean(ta.value.trim()) || Boolean(attached) || Boolean(editing);
    send.disabled = !ready;
    send.hidden = voice && !ready;
    mic.hidden = !voice || ready;
    attachBtn.hidden = Boolean(editing);
    const left = MAX_TEXT - ta.value.length;
    count.textContent = left < 200 ? String(left) : '';
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight + 2, 168) + 'px'; // + bordures
  }

  function placeholder() {
    ta.placeholder = editing ? 'Modifie ton message…' : attached ? 'Ajoute une légende…' : 'Écris un message…';
  }

  function clearAttachment(revoke = true) {
    if (attached && attached.url && revoke) URL.revokeObjectURL(attached.url);
    attached = null;
    tray.hidden = true;
    tray.replaceChildren();
    placeholder();
    sync();
  }

  function showTray(thumb, title, detail) {
    tray.replaceChildren(thumb,
      h('span', { class: 'tray-txt' }, h('b', { text: title }), h('small', { text: detail })),
      h('button', {
        class: 'btn icon ghost', type: 'button', 'aria-label': 'Retirer la pièce jointe',
        onclick: () => clearAttachment(),
      }, icon('close')));
    tray.hidden = false;
    placeholder();
    sync();
    ta.focus();
  }

  async function attach(file) {
    try {
      const img = await Media.prepareImage(file);
      clearAttachment();
      attached = { kind: 'image', ...img, url: URL.createObjectURL(img.blob) };
      showTray(h('img', { src: attached.url, alt: '' }), 'Photo',
        img.w + ' × ' + img.h + ' · ' + Media.formatBytes(img.blob.size) + ' · chiffrée à l\'envoi');
    } catch (err) {
      toast(describe(err), 'error');
    }
  }

  function attachFile(file) {
    if (file.size > Media.MAX_MEDIA_BYTES) {
      toast('Fichier trop lourd : ' + Media.formatBytes(Media.MAX_MEDIA_BYTES) + ' au plus (limite de la formule gratuite de Firebase).', 'error');
      return;
    }
    clearAttachment();
    const name = fileName({ name: file.name });
    attached = { kind: 'file', blob: file, name, mime: String(file.type || 'application/octet-stream').slice(0, 100) };
    const ext = (name.match(/\.([a-z0-9]{1,5})$/i) || [])[1];
    showTray(h('span', { class: 'file-ic', text: ext ? ext.toUpperCase() : 'FICHIER' }), name,
      Media.formatBytes(file.size) + ' · chiffré à l\'envoi');
  }

  function showContext(kind, title, text) {
    context.replaceChildren(icon(kind === 'edit' ? 'edit' : 'reply'),
      h('span', { class: 'tray-txt' }, h('b', { text: title }), h('small', { text })),
      h('button', {
        class: 'btn icon ghost', type: 'button', 'aria-label': kind === 'edit' ? 'Annuler la modification' : 'Annuler la réponse',
        onclick: () => clearContext(),
      }, icon('close')));
    context.hidden = false;
  }

  function clearContext() {
    const wasEditing = Boolean(editing);
    replyTo = null;
    editing = null;
    context.hidden = true;
    context.replaceChildren();
    if (wasEditing) ta.value = drafts.get(cid) || '';
    placeholder();
    sync();
  }

  function startReply(m, c) {
    if (editing) clearContext();
    replyTo = { id: m.id, uid: m.uid, s: replySnippet(m, c) };
    showContext('reply', 'Réponse à ' + (m.uid === me() ? 'toi' : nameOf(m.uid)), replyTo.s);
    ta.focus();
  }

  function startEdit(m, c) {
    replyTo = null;
    if (!editing) drafts.set(cid, ta.value);
    editing = { m, c };
    clearAttachment();
    showContext('edit', 'Modification du message', replySnippet(m, c));
    ta.value = c.text;
    placeholder();
    sync();
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }

  /* @mentions dans les groupes : suggestions des membres pendant la saisie. */
  function mentionQuery() {
    const conv = state.convs.find((x) => x.id === cid);
    if (!conv || conv.type !== 'group') return null;
    const before = ta.value.slice(0, ta.selectionStart);
    const m = before.match(/(^|\s)@([a-z0-9_]{0,20})$/i);
    return m ? { conv, q: fold(m[2]), start: before.length - m[2].length - 1 } : null;
  }

  function updateMentions() {
    const mq = mentionQuery();
    mentionList = !mq ? [] : mq.conv.members
      .filter((u) => u !== me() && person(u) && person(u).username && !isBlocked(u))
      .filter((u) => fold(person(u).username).startsWith(mq.q) || fold(nameOf(u)).split(/\s+/).some((w) => w.startsWith(mq.q)))
      .slice(0, 6);
    mentionIndex = Math.min(mentionIndex, Math.max(0, mentionList.length - 1));
    mentionPop.hidden = !mentionList.length;
    mentionPop.replaceChildren(...mentionList.map((u, i) => h('button', {
      class: 'member' + (i === mentionIndex ? ' active' : ''), type: 'button', role: 'option',
      'aria-selected': String(i === mentionIndex),
      onmousedown: (e) => e.preventDefault(),
      onclick: () => pickMention(u),
    }, avatar(u, nameOf(u), 'xs'), h('span', { class: 'member-txt' }, h('b', { text: nameOf(u) }),
      h('small', { text: '@' + person(u).username })))));
  }

  function pickMention(u) {
    const mq = mentionQuery();
    if (!mq) return;
    const after = ta.value.slice(ta.selectionStart);
    const insert = '@' + person(u).username + ' ';
    ta.value = ta.value.slice(0, mq.start) + insert + after;
    const pos = mq.start + insert.length;
    ta.setSelectionRange(pos, pos);
    mentionPop.hidden = true;
    mentionList = [];
    sync();
    ta.focus();
  }

  async function startRecording() {
    Notify.unlockAudio();
    const r = new Media.VoiceRecorder();
    try {
      await r.start();
    } catch (err) {
      r.cancel();
      toast(describe(err), 'error');
      return;
    }
    recorder = r;
    row.hidden = true;
    tray.hidden = true;
    recBar.hidden = false;
    const bars = recLevel.querySelectorAll('i');
    recTimer = setInterval(() => {
      recTime.textContent = Media.formatDuration(r.seconds);
      // Onde qui défile : les derniers niveaux relevés, le plus récent à droite.
      const recent = r.levels.slice(-bars.length);
      const offset = bars.length - recent.length;
      bars.forEach((b, i) => {
        const level = i < offset ? 0 : recent[i - offset];
        b.style.height = Math.max(12, Math.round(Math.sqrt(level) * 100)) + '%';
      });
      if (r.full) {
        toast('Durée maximale atteinte : message vocal envoyé.', 'info');
        finishRecording(true);
      }
    }, 150);
  }

  function stopRecordingUi() {
    clearInterval(recTimer);
    recTimer = null;
    recBar.hidden = true;
    row.hidden = false;
    tray.hidden = !attached;
  }

  async function finishRecording(keep) {
    const r = recorder;
    recorder = null;
    stopRecordingUi();
    if (!r) return;
    if (!keep) {
      r.cancel();
      return;
    }
    const reply = replyTo;
    clearContext();
    try {
      const v = await r.stop();
      const url = URL.createObjectURL(v.blob);
      await sendRich(cid, { t: 'audio', mime: v.mime, duration: v.duration, wave: v.wave, size: v.blob.size,
        ...(reply ? { reply } : {}) }, v.blob, url);
    } catch (err) {
      toast('Message vocal non envoyé : ' + sendFailure(err, cid), 'error');
    }
  }

  const form = h('form', {
    class: 'composer',
    onsubmit: (e) => {
      e.preventDefault();
      const text = ta.value.trim();
      lastTypingSent = 0;
      mentionPop.hidden = true;
      const conv = state.convs.find((x) => x.id === cid);
      if (editing) {
        const { m, c } = editing;
        if (!text && c.kind === 'text') return;
        drafts.delete(cid);
        clearContext();
        ta.value = '';
        sync();
        editMessage(cid, m, c, text).catch((err) => toast('Modification impossible : ' + sendFailure(err, cid), 'error'));
        return;
      }
      const extra = {
        ...(replyTo ? { reply: replyTo } : {}),
        ...(conv && conv.type === 'group' && text ? { mentions: mentionsIn(text, conv) } : {}),
      };
      if (extra.mentions && !extra.mentions.length) delete extra.mentions;
      if (attached) {
        const a = attached;
        ta.value = '';
        drafts.delete(cid);
        clearAttachment(false); // l'URL locale sert à afficher la photo pendant l'envoi
        clearContext();
        const job = a.kind === 'image'
          ? sendRich(cid, { t: 'image', caption: text, mime: a.mime, w: a.w, h: a.h, size: a.blob.size, ...extra }, a.blob, a.url)
          : sendRich(cid, { t: 'file', caption: text, name: a.name, mime: a.mime, size: a.blob.size, ...extra }, a.blob);
        job.catch((err) => toast((a.kind === 'image' ? 'Photo non envoyée : ' : 'Fichier non envoyé : ') + sendFailure(err, cid), 'error'));
        return;
      }
      if (!text) return;
      ta.value = '';
      drafts.delete(cid);
      clearContext();
      sync();
      sendMessage(cid, text, extra).catch((err) => {
        toast('Message non envoyé : ' + sendFailure(err, cid), 'error');
        if (!ta.value) { ta.value = text; sync(); }
      });
    },
  }, mentionPop, context, tray, row, recBar);

  ta.addEventListener('input', () => {
    sync();
    updateMentions();
    if (!editing) signalTyping(cid, ta.value);
  });
  ta.addEventListener('click', updateMentions);
  ta.addEventListener('keydown', (e) => {
    if (!mentionPop.hidden && mentionList.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        mentionIndex = (mentionIndex + (e.key === 'ArrowDown' ? 1 : -1) + mentionList.length) % mentionList.length;
        updateMentions();
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pickMention(mentionList[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        mentionPop.hidden = true;
        return;
      }
    }
    if (e.key === 'Escape' && (editing || replyTo)) {
      clearContext();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !coarse) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  ta.addEventListener('blur', () => setTimeout(() => { mentionPop.hidden = true; }, 150));
  ta.addEventListener('paste', (e) => {
    const file = [...(e.clipboardData ? e.clipboardData.files : [])].find((f) => /^image\//.test(f.type));
    if (!file) return;
    e.preventDefault();
    attach(file);
  });
  photoInput.addEventListener('change', () => {
    if (photoInput.files[0]) attach(photoInput.files[0]);
    photoInput.value = '';
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) attachFile(fileInput.files[0]);
    fileInput.value = '';
  });
  mic.addEventListener('click', startRecording);
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && recorder) finishRecording(false);
  });
  form.attach = attach;
  form.attachFile = attachFile;
  form.startReply = startReply;
  form.startEdit = startEdit;
  form.draft = () => (editing ? drafts.get(cid) || '' : ta.value);
  form.cleanup = () => {
    if (recorder) recorder.cancel();
    recorder = null;
    clearInterval(recTimer);
    if (attached && attached.url) URL.revokeObjectURL(attached.url);
    attached = null;
  };
  requestAnimationFrame(sync);
  return form;
}

/* Nouveau sondage : une question, de 2 à 10 réponses. */
function openPollComposer(cid) {
  const error = formError();
  const q = h('input', { name: 'q', required: true, maxlength: 200, placeholder: 'ex. On se retrouve où ?' });
  const list = h('div', { class: 'poll-edit' });
  const multi = h('input', { type: 'checkbox', role: 'switch' });
  const addBtn = h('button', { class: 'btn ghost sm', type: 'button' }, icon('plus'), 'Ajouter une réponse');
  const submit = h('button', { class: 'btn primary', type: 'submit' }, 'Envoyer le sondage');
  const addOption = (value = '') => {
    const input = h('input', { maxlength: 100, placeholder: 'Réponse ' + (list.children.length + 1), value, 'aria-label': 'Réponse' });
    const row = h('div', { class: 'poll-edit-row' }, input, h('button', {
      class: 'btn icon ghost', type: 'button', 'aria-label': 'Retirer cette réponse',
      onclick: () => { if (list.children.length > 2) { row.remove(); addBtn.hidden = false; } },
    }, icon('close')));
    list.append(row);
    addBtn.hidden = list.children.length >= 10;
    return input;
  };
  addOption();
  addOption();
  addBtn.addEventListener('click', () => addOption().focus());
  const form = h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      showError(error, '');
      const question = q.value.trim();
      const options = [...list.querySelectorAll('input')].map((i) => i.value.trim()).filter(Boolean);
      if (!question) return showError(error, 'Écris la question du sondage.');
      if (options.length < 2) return showError(error, 'Il faut au moins deux réponses.');
      if (new Set(options.map(fold)).size !== options.length) return showError(error, 'Deux réponses sont identiques.');
      busy(submit, () => sendRich(cid, { t: 'poll', q: question, options, multi: multi.checked }))
        .then(() => dlg.close())
        .catch((err) => showError(error, sendFailure(err, cid)));
    },
  },
  field('Question', q),
  h('div', { class: 'field' }, h('span', { class: 'field-label', text: 'Réponses' }), list, addBtn),
  h('label', { class: 'setting toggle' }, icon('check'),
    h('span', { class: 'setting-txt' }, h('b', { text: 'Plusieurs réponses' }), h('small', { text: 'Chacun peut cocher plusieurs choix.' })),
    multi),
  h('p', { class: 'fineprint', text: '🔒 La question, les réponses et les votes sont chiffrés de bout en bout.' }),
  error,
  h('div', { class: 'row-actions end sticky-actions' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
    submit));
  const dlg = modal('Nouveau sondage', form);
  if (!coarse) q.focus();
}

/* Déposer une photo n'importe où dans la conversation ouverte. */
function bindDrop(zone) {
  const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  zone.addEventListener('dragover', (e) => {
    if (!hasFiles(e) || !ui || !ui.composer) return;
    e.preventDefault();
    zone.classList.add('dropping');
  });
  zone.addEventListener('dragleave', (e) => {
    if (e.target === zone || !zone.contains(e.relatedTarget)) zone.classList.remove('dropping');
  });
  zone.addEventListener('drop', (e) => {
    zone.classList.remove('dropping');
    if (!hasFiles(e) || !ui || !ui.composer) return;
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (/^image\//.test(file.type)) ui.composer.attach(file);
    else ui.composer.attachFile(file);
  });
}

/* « … écrit » : au plus un signal toutes les TYPING_EVERY ms, et seulement
   quand il y a du texte. */
function signalTyping(cid, text) {
  const now = Date.now();
  if (!text.trim() || now - lastTypingSent < TYPING_EVERY) return;
  lastTypingSent = now;
  F.updateDoc(F.doc(db, 'conversations', cid), { ['typing.' + me()]: F.serverTimestamp() }).catch(() => {});
}

/* Clés publiques de tous les membres (y compris soi), relues à chaque envoi :
   un message chiffré pour une clé remplacée resterait illisible. */
async function memberKeys(conv) {
  const keys = { [me()]: vault.publicKey };
  const missing = [];
  const gone = [];
  const others = conv.members.filter((uid) => uid !== me());
  const fresh = await Promise.all(others.map(fetchPerson));
  others.forEach((uid, i) => {
    const p = fresh[i];
    if (p.publicKey) keys[uid] = p.publicKey;
    else if (p.gone) gone.push(uid);
    else missing.push(p.username ? '@' + p.username : p.name);
  });
  if (gone.length && conv.type !== 'group') throw userError('ce compte a été supprimé.');
  if (missing.length) {
    throw userError(missing.join(', ') + (missing.length > 1 ? ' doivent' : ' doit') +
      ' se reconnecter une fois à message-me pour activer le chiffrement.');
  }
  return keys;
}

/* Le message chiffré, son éventuel fichier chiffré et l'aperçu de la
   conversation partent dans la même écriture groupée : les règles refusent
   l'un sans les autres. */
function commitMessage(cid, msg, enc, media = null, ttl = 0) {
  const uid = me();
  // Message éphémère : échéance fixée à l'envoi (les règles la vérifient).
  const exp = ttl > 0 ? { exp: F.Timestamp.fromMillis(Date.now() + ttl * 1000) } : {};
  const batch = F.writeBatch(db);
  if (media) {
    batch.set(F.doc(db, 'conversations', cid, 'media', msg.id), {
      uid, data: F.Bytes.fromUint8Array(media), createdAt: F.serverTimestamp(),
    });
  }
  batch.set(msg, { uid, enc, createdAt: F.serverTimestamp(), ...exp });
  batch.update(F.doc(db, 'conversations', cid), {
    lastMessage: { id: msg.id, uid, enc, at: F.serverTimestamp(), ...exp },
    updatedAt: F.serverTimestamp(),
    ['lastRead.' + uid]: F.serverTimestamp(),
  });
  return batch.commit();
}

function conversationFor(cid) {
  const conv = state.convs.find((c) => c.id === cid);
  if (!conv || !vault) throw userError('Conversation pas encore chargée, réessaie dans un instant.');
  return conv;
}

function sendFailure(err, cid) {
  if (err.userMessage) return err.userMessage;
  const conv = state.convs.find((c) => c.id === cid);
  if (err.code === 'permission-denied' && conv) {
    return conv.type === 'group'
      ? 'tu ne peux pas écrire dans ce groupe pour le moment.'
      : 'cette personne ne reçoit pas tes messages (elle t\'a peut-être bloqué).';
  }
  return describe(err);
}

/* Texte : enveloppe v2, avec la réponse citée et les mentions éventuelles. */
function sendMessage(cid, text, extra = {}) {
  return sendRich(cid, { t: 'text', text, ...extra });
}

/* Tout message part dans une enveloppe chiffrée (v2). Un fichier est chiffré
   avec sa propre clé, qui ne voyage que dans l'enveloppe ; les réactions et
   votes, avec une clé tirée de la graine `nk`. */
async function sendRich(cid, payload, blob = null, localUrl = null, fresh = null) {
  const conv = fresh || conversationFor(cid);
  const msg = F.doc(F.collection(db, 'conversations', cid, 'messages'));
  let full = ['call', 'event'].includes(payload.t) ? payload : { ...payload, nk: E2E.newNoteSeed() };
  let media = null;
  if (blob) {
    const box = await E2E.encryptBlob(new Uint8Array(await blob.arrayBuffer()), cid, msg.id);
    full = { ...full, key: box.key, iv: box.iv };
    media = box.data;
    if (localUrl) mediaUrls.set(cid + '/' + msg.id, Promise.resolve(localUrl));
  }
  const enc = await E2E.encryptPayload(full, await memberKeys(conv), cid, me());
  plain.set(contentKey(cid, { id: msg.id, enc }), readPayload(2, JSON.stringify(full)));
  scheduleRender();
  return commitMessage(cid, msg, enc, media, Number(conv.ttl) || 0);
}

/* ------------------------------------------------------------------------ */
/* Réactions, votes, modification, suppression                              */
/* ------------------------------------------------------------------------ */

function noteKeyFor(cid, m, c) {
  const key = contentKey(cid, m);
  if (!noteKeys.has(key)) {
    const job = c.payload && typeof c.payload.nk === 'string'
      ? E2E.noteKeyFromSeed(c.payload.nk)
      : E2E.noteKeyFromMessage(m.enc, vault.uid, vault.privateKey);
    job.catch(() => {});
    noteKeys.set(key, job);
  }
  return noteKeys.get(key);
}

function cleanNote(v) {
  const r = v && typeof v.r === 'string' && [...v.r].length <= 8 ? v.r : null;
  const votes = v && Array.isArray(v.v) ? v.v.filter((i) => Number.isInteger(i) && i >= 0 && i < 10).slice(0, 10) : [];
  return { r, v: votes };
}

/* Réactions et votes d'un message : { uid: { r, v } }, déchiffrés à la demande. */
function notesOf(cid, m, c) {
  const out = {};
  if (!m.notes || !vault || c.state !== 'ok' || !m.enc) return out;
  for (const [uid, n] of Object.entries(m.notes)) {
    if (!n || typeof n.ct !== 'string' || typeof n.iv !== 'string') continue;
    const k = cid + '/' + m.id + '/' + uid + '/' + n.ct;
    if (notesCache.has(k)) {
      const v = notesCache.get(k);
      if (v) out[uid] = v;
      continue;
    }
    notesCache.set(k, null);
    noteKeyFor(cid, m, c)
      .then((key) => E2E.openNote(key, n, cid, m.id, uid))
      .then((v) => { notesCache.set(k, cleanNote(v)); scheduleRender(); }, () => {});
  }
  return out;
}

async function setNote(cid, m, c, next) {
  const ref = F.doc(db, 'conversations', cid, 'messages', m.id);
  if (!next.r && !next.v.length) {
    await F.updateDoc(ref, { ['notes.' + me()]: F.deleteField() });
    return;
  }
  const key = await noteKeyFor(cid, m, c);
  const box = await E2E.sealNote(key, next, cid, m.id, me());
  notesCache.set(cid + '/' + m.id + '/' + me() + '/' + box.ct, next);
  await F.updateDoc(ref, { ['notes.' + me()]: box });
}

function react(cid, m, c, emoji) {
  const mine = notesOf(cid, m, c)[me()] || { r: null, v: [] };
  return setNote(cid, m, c, { ...mine, r: mine.r === emoji ? null : emoji }).catch((err) =>
    toast('Réaction impossible : ' + sendFailure(err, cid), 'error'));
}

function vote(cid, m, c, index) {
  const mine = notesOf(cid, m, c)[me()] || { r: null, v: [] };
  const multi = Boolean(c.payload.multi);
  let v = mine.v.includes(index) ? mine.v.filter((i) => i !== index) : multi ? [...mine.v, index] : [index];
  v = v.sort((a, b) => a - b);
  return setNote(cid, m, c, { ...mine, v }).catch((err) => toast('Vote impossible : ' + sendFailure(err, cid), 'error'));
}

/* L'aperçu de la conversation suit son dernier message modifié ou supprimé. */
function syncPreview(batch, cid, mid, next) {
  const conv = state.convs.find((c) => c.id === cid);
  const lm = conv && conv.lastMessage;
  if (!lm || lm.id !== mid) return;
  batch.update(F.doc(db, 'conversations', cid), {
    lastMessage: { id: lm.id, uid: lm.uid, at: lm.at, ...(lm.exp ? { exp: lm.exp } : {}), ...next },
  });
}

const EDIT_MS = 2 * 864e5; // 48 heures, comme les règles

function editable(m, c) {
  return m.uid === me() && c.state === 'ok' && ['text', 'image', 'file'].includes(c.kind)
    && !m.pending && Date.now() - ts(m.createdAt) < EDIT_MS - 60e3;
}

async function editMessage(cid, m, c, text) {
  const conv = conversationFor(cid);
  // Un ancien message (v1) n'a pas d'enveloppe : il en reçoit une.
  const payload = c.payload ? { ...c.payload } : { t: 'text' };
  if (c.kind === 'text') payload.text = text;
  else payload.caption = text;
  if (conv.type === 'group') payload.mentions = mentionsIn(text, conv);
  if (!payload.nk) payload.nk = E2E.newNoteSeed();
  const enc = await E2E.encryptPayload(payload, await memberKeys(conv), cid, m.uid);
  plain.set(contentKey(cid, { id: m.id, enc }), readPayload(2, JSON.stringify(payload)));
  const batch = F.writeBatch(db);
  batch.update(F.doc(db, 'conversations', cid, 'messages', m.id), { enc, editedAt: F.serverTimestamp() });
  syncPreview(batch, cid, m.id, { enc });
  await batch.commit();
}

async function deleteMessage(cid, m, c) {
  const mine = m.uid === me();
  const ok = await confirmSheet({
    title: 'Supprimer pour tout le monde ?',
    text: mine ? 'Le message disparaît pour tous les membres. Il reste seulement « Message supprimé ».'
      : 'En tant qu\'admin, tu supprimes le message de ' + nameOf(m.uid) + ' pour tous les membres.',
    confirm: 'Supprimer',
  });
  if (!ok) return;
  const batch = F.writeBatch(db);
  batch.update(F.doc(db, 'conversations', cid, 'messages', m.id), {
    enc: F.deleteField(), notes: F.deleteField(), editedAt: F.deleteField(),
    deleted: true, deletedBy: me(), deletedAt: F.serverTimestamp(),
  });
  if (c.payload && c.payload.key) batch.delete(F.doc(db, 'conversations', cid, 'media', m.id));
  syncPreview(batch, cid, m.id, { deleted: true });
  await batch.commit();
}

/* Messages éphémères expirés : effacés par le premier membre qui les voit. */
function sweepExpired(cid, messages) {
  const old = messages.filter((m) => expired(m) && !m.pending).slice(0, 100);
  if (!old.length) return;
  const batch = F.writeBatch(db);
  for (const m of old) {
    batch.delete(F.doc(db, 'conversations', cid, 'media', m.id));
    batch.delete(F.doc(db, 'conversations', cid, 'messages', m.id));
  }
  batch.commit().catch(() => {});
}

function markRead(conv) {
  if (!conv || document.hidden || conv.id !== state.activeId || !isUnread(conv)) return;
  const id = conv.lastMessage.id;
  if (markedRead.get(conv.id) === id) return;
  markedRead.set(conv.id, id);
  F.updateDoc(F.doc(db, 'conversations', conv.id), { ['lastRead.' + me()]: F.serverTimestamp() })
    .catch(() => markedRead.delete(conv.id));
}

/* ------------------------------------------------------------------------ */
/* Groupes : membres, rôles, réglages                                       */
/* ------------------------------------------------------------------------ */

/* Chaque changement du groupe est suivi d'un événement chiffré dans la
   conversation (« Alice a ajouté Bob »), pour les membres à jour : le
   groupe est relu d'abord. Sans droit d'écrire, pas d'événement. */
async function postEvent(cid, payload) {
  try {
    const snap = await F.getDoc(F.doc(db, 'conversations', cid));
    if (!snap.exists() || !vault) return;
    const conv = { id: cid, ...snap.data() };
    if (!conv.members.includes(me()) || (conv.type === 'group' && !can(conv, 'send')) || silencedUntil(me())) return;
    await sendRich(cid, { t: 'event', ...payload }, null, null, conv);
  } catch {
    // L'événement n'est qu'une trace : le changement lui-même est fait.
  }
}

/* Écriture de la liste des admins. Un ancien groupe n'a pas de champ
   `admins` : on l'écrit en entier plutôt que de le modifier. */
function adminsChange(conv, add, remove) {
  if (Array.isArray(conv.admins)) return add ? F.arrayUnion(add) : F.arrayRemove(remove);
  const list = adminsOf(conv).filter((u) => u !== remove);
  return add ? [...list, add] : list;
}

const groupRef = (conv) => F.doc(db, 'conversations', conv.id);

/* Pseudos -> comptes, avec des messages d'erreur clairs. */
async function lookupUsernames(usernames) {
  const self = state.profile.username;
  const wanted = [...new Set(usernames.map(normalizeUsername).filter(Boolean))];
  if (wanted.includes(self)) throw userError('C\'est ton propre pseudo : indique celui de quelqu\'un d\'autre.');
  const bad = wanted.find((u) => !USERNAME_RE.test(u));
  if (bad) throw userError('« ' + bad + ' » n\'est pas un pseudo valide.');
  const snaps = await Promise.all(wanted.map((u) => F.getDoc(F.doc(db, 'usernames', u))));
  const missing = wanted.filter((u, i) => !snaps[i].exists());
  if (missing.length) {
    throw userError((missing.length > 1 ? 'Pseudos introuvables : ' : 'Pseudo introuvable : ') +
      missing.map((u) => '@' + u).join(', ') + '.');
  }
  const uids = snaps.map((d) => d.data().uid);
  const found = await Promise.all(uids.map((u) => (person(u) ? person(u) : fetchPerson(u).catch(() => null))));
  const gone = wanted.filter((u, i) => found[i] && found[i].gone);
  if (gone.length) throw userError('Le compte @' + gone[0] + ' a été supprimé.');
  return uids;
}

/* Ajoute des membres, un par un (les règles vérifient à chaque ajout que la
   personne n'a pas bloqué l'auteur). Rend { added, failed }. */
async function addToGroup(ref, uids) {
  const results = await Promise.allSettled(uids.map((u) => F.updateDoc(ref, { members: F.arrayUnion(u) })));
  const added = uids.filter((u, i) => results[i].status === 'fulfilled');
  const failed = uids.filter((u, i) => results[i].status === 'rejected');
  if (failed.length) {
    toast(joinNames(failed.map(nameOf)) + (failed.length > 1 ? ' n\'ont' : ' n\'a') +
      ' pas pu être ajouté au groupe (paramètres de confidentialité).', 'error');
  }
  return { added, failed };
}

async function createGroup({ title, description, uids }) {
  const uid = me();
  if (!uids.length) throw userError('Ajoute au moins une personne au groupe.');
  if (uids.length + 1 > MAX_MEMBERS) throw userError('Un groupe compte au plus ' + MAX_MEMBERS + ' membres.');
  let name = [...title.trim()].slice(0, MAX_TITLE).join('');
  if (!name) {
    const all = [state.profile.name, ...uids.map(nameOf)];
    name = [...(all.length > 3 ? all.slice(0, 3).join(', ') + ' et ' + (all.length - 3) + ' autres' : all.join(', '))]
      .slice(0, MAX_TITLE).join('');
  }
  const ref = F.doc(F.collection(db, 'conversations'));
  await F.setDoc(ref, {
    type: 'group', members: [uid], admins: [uid], perms: { ...DEFAULT_PERMS },
    title: name, description: [...description.trim()].slice(0, MAX_DESC).join(''),
    createdBy: uid, createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp(),
    lastMessage: null, lastRead: {},
  });
  const { added } = await addToGroup(ref, uids);
  await postEvent(ref.id, { e: 'create', title: name, targets: added });
  return ref.id;
}

async function addMembers(conv, uids) {
  const fresh = uids.filter((u) => !conv.members.includes(u));
  if (!fresh.length) throw userError('Ces personnes font déjà partie du groupe.');
  if (conv.members.length + fresh.length > MAX_MEMBERS) {
    throw userError('Un groupe compte au plus ' + MAX_MEMBERS + ' membres.');
  }
  const { added } = await addToGroup(groupRef(conv), fresh);
  if (added.length) {
    await postEvent(conv.id, { e: 'add', targets: added });
    toast(added.length > 1 ? added.length + ' personnes ajoutées.' : nameOf(added[0]) + ' fait maintenant partie du groupe.', 'success');
  }
}

async function removeMember(conv, uid) {
  const ok = await confirmSheet({
    title: 'Retirer ' + nameOf(uid) + ' ?',
    text: nameOf(uid) + ' ne verra plus les nouveaux messages de « ' + conv.title + ' ».',
    confirm: 'Retirer du groupe',
  });
  if (!ok) return;
  await F.updateDoc(groupRef(conv), { members: F.arrayRemove(uid), admins: adminsChange(conv, null, uid) });
  F.deleteDoc(F.doc(db, 'conversations', conv.id, 'restrictions', uid)).catch(() => {});
  await postEvent(conv.id, { e: 'remove', targets: [uid] });
}

async function setAdmin(conv, uid, on) {
  await F.updateDoc(groupRef(conv), { admins: on ? adminsChange(conv, uid) : adminsChange(conv, null, uid) });
  await postEvent(conv.id, { e: on ? 'promote' : 'demote', targets: [uid] });
}

async function claimAdmin(conv) {
  await F.updateDoc(groupRef(conv), { admins: [me()] });
  await postEvent(conv.id, { e: 'claim' });
}

async function silence(conv, uid, ms) {
  const until = Date.now() + ms;
  await F.setDoc(F.doc(db, 'conversations', conv.id, 'restrictions', uid), {
    until: F.Timestamp.fromMillis(until), by: me(), at: F.serverTimestamp(),
  });
  await postEvent(conv.id, { e: 'silence', targets: [uid], until });
}

async function unsilence(conv, uid) {
  await F.deleteDoc(F.doc(db, 'conversations', conv.id, 'restrictions', uid));
  await postEvent(conv.id, { e: 'unsilence', targets: [uid] });
}

async function updateInfo(conv, title, description) {
  const t = [...title.trim()].slice(0, MAX_TITLE).join('');
  const d = [...description.trim()].slice(0, MAX_DESC).join('');
  if (!t) throw userError('Le nom du groupe ne peut pas être vide.');
  if (t === conv.title && d === (conv.description || '')) return;
  await F.updateDoc(groupRef(conv), { title: t, description: d });
  if (t !== conv.title) await postEvent(conv.id, { e: 'title', title: t });
  if (d !== (conv.description || '')) await postEvent(conv.id, { e: 'description' });
}

async function updatePerms(conv, what, value) {
  const perms = { ...DEFAULT_PERMS, ...(conv.perms || {}), [what]: value };
  await F.updateDoc(groupRef(conv), { perms });
  await postEvent(conv.id, { e: 'perms', perms });
}

async function leaveGroup(conv) {
  const ok = await confirmSheet({
    title: 'Quitter « ' + conv.title + ' » ?',
    text: 'Tu ne verras plus ses messages. Un membre devra t\'y ajouter pour revenir.',
    confirm: 'Quitter le groupe',
  });
  if (!ok) return;
  if (panel && panel.dlg.open) panel.dlg.close();
  // On quitte la conversation avant de quitter le groupe : pas d'écran
  // « Tu ne fais plus partie de ce groupe » pour son propre départ.
  location.hash = '#/';
  route();
  try {
    await leaveGroupNow(conv);
    toast('Tu as quitté « ' + conv.title + ' ».', 'info');
  } catch (err) {
    toast(describe(err), 'error');
  }
}

/* Départ d'un groupe, sans question (aussi à la suppression du compte). */
async function leaveGroupNow(conv) {
  const rest = conv.members.filter((u) => u !== me());
  const change = { members: F.arrayRemove(me()) };
  let heir = null;
  if (isAdmin(conv)) {
    const others = adminsOf(conv).filter((u) => u !== me() && rest.includes(u));
    // Dernier admin : il passe la main au membre le plus ancien.
    if (!others.length && rest.length) {
      heir = rest[0];
      change.admins = [heir];
    } else {
      change.admins = adminsChange(conv, null, me());
    }
  }
  await postEvent(conv.id, { e: 'leave', ...(heir ? { heir } : {}) });
  await F.updateDoc(groupRef(conv), change);
}

/* Suppression du compte : départ des groupes, puis effacement du profil, de
   la clé, des réglages, de la photo et de la présence, puis du compte
   lui-même. Le pseudo reste réservé ; les messages déjà envoyés restent
   lisibles par leurs destinataires. */
async function deleteAccount(password) {
  if (hasPassword()) {
    try {
      await reauthenticate(password);
    } catch (err) {
      const code = (err && err.code) || '';
      if (/wrong-password|invalid-credential|invalid-login/.test(code)) throw userError('Mot de passe incorrect.');
      throw err;
    }
  } else {
    await A.reauthenticateWithPopup(auth.currentUser, new A.GoogleAuthProvider());
  }
  const uid = me();
  for (const conv of state.convs.filter((c) => c.type === 'group')) await leaveGroupNow(conv).catch(() => {});
  const batch = F.writeBatch(db);
  for (const col of ['presence', 'avatars', 'settings', 'keys', 'users']) batch.delete(F.doc(db, col, uid));
  await batch.commit();
  await E2E.deleteDeviceKey(uid);
  await A.deleteUser(auth.currentUser);
  try { sessionStorage.setItem('mm-deleted', '1'); } catch { /* tant pis */ }
  try {
    await F.terminate(db);
    await F.clearIndexedDbPersistence(db);
  } catch {
    // Autre onglet ouvert : rien de grave.
  }
  location.reload();
}

function openDeleteAccount() {
  const error = formError();
  const password = hasPassword()
    ? h('input', { type: 'password', name: 'password', required: true, autocomplete: 'current-password' }) : null;
  const sure = h('input', { type: 'checkbox' });
  const go = h('button', { class: 'btn danger', type: 'submit', disabled: true }, 'Supprimer définitivement');
  sure.addEventListener('change', () => { go.disabled = !sure.checked; });
  const form = h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      showError(error, '');
      busy(go, () => deleteAccount(password ? password.value : ''))
        .then(() => dlg.close())
        .catch((err) => showError(error, err.userMessage || describe(err)));
    },
  },
  h('p', { text: 'Ton profil, ta photo, ta clé de chiffrement et tes réglages sont effacés, et tu quittes tous tes groupes. ' +
    'Tes anciens messages restent visibles pour leurs destinataires, sous « Compte supprimé ». Ton pseudo reste réservé : ' +
    'personne ne pourra le reprendre.' }),
  password ? field('Confirme avec ton mot de passe', password) : h('p', { class: 'fineprint', text: 'Google te demandera de confirmer.' }),
  h('label', { class: 'check' }, sure, h('span', { text: 'Je comprends que c\'est définitif.' })),
  error,
  h('div', { class: 'row-actions end' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
    go));
  const dlg = modal('Supprimer mon compte', form);
}

/* ------------------------------------------------------------------------ */
/* Blocage et sourdine (réglages privés : settings/{uid})                   */
/* ------------------------------------------------------------------------ */

const settingsRef = () => F.doc(db, 'settings', me());

async function setBlocked(uid, on) {
  if (on) {
    const ok = await confirmSheet({
      title: 'Bloquer ' + nameOf(uid) + ' ?',
      text: 'Cette personne ne pourra plus t\'écrire en privé, t\'appeler ni t\'ajouter à un groupe. ' +
        'Dans les groupes en commun, ses messages seront masqués. Elle n\'est pas prévenue.',
      confirm: 'Bloquer',
    });
    if (!ok) return;
  }
  try {
    await F.setDoc(settingsRef(), { blocked: on ? F.arrayUnion(uid) : F.arrayRemove(uid) }, { merge: true });
    toast(on ? nameOf(uid) + ' est bloqué·e.' : nameOf(uid) + ' est débloqué·e.', 'success');
  } catch (err) {
    toast(err.code === 'permission-denied'
      ? 'Le blocage demande les nouvelles règles Firestore : republie firestore.rules (guide, étape 4).'
      : describe(err), 'error');
  }
}

/* until : date de fin en millisecondes, FOREVER, ou 0 pour réactiver. */
async function setMuted(cid, until) {
  try {
    if (until) await F.setDoc(settingsRef(), { muted: { [cid]: until } }, { merge: true });
    else await F.updateDoc(settingsRef(), { ['muted.' + cid]: F.deleteField() });
  } catch (err) {
    toast(err.code === 'permission-denied'
      ? 'La sourdine demande les nouvelles règles Firestore : republie firestore.rules (guide, étape 4).'
      : describe(err), 'error');
  }
}

function muteLabel(cid) {
  const until = mutedUntil(cid);
  if (!until) return 'Notifications activées';
  return until >= FOREVER ? 'En sourdine' : 'En sourdine jusqu\'à ' + untilText(until);
}

function chooseMute(cid) {
  if (isMuted(cid)) {
    setMuted(cid, 0);
    return;
  }
  menu('Mettre en sourdine', MUTE_CHOICES.map(([label, ms]) => ({
    label, icon: 'bellOff', onclick: () => setMuted(cid, ms ? Date.now() + ms : FOREVER),
  })), 'Plus de son ni de notification pour cette conversation. Les appels sonnent toujours.');
}

/* ------------------------------------------------------------------------ */
/* Vérification du chiffrement (numéro de sécurité, code QR)                 */
/* ------------------------------------------------------------------------ */

const fingerprints = new Map(); // clé publique -> empreinte courte

function fingerprintOf(publicKey) {
  if (!fingerprints.has(publicKey)) fingerprints.set(publicKey, E2E.keyFingerprint(publicKey));
  return fingerprints.get(publicKey);
}

/* 'verified' | 'changed' (clé différente de celle vérifiée) | 'unverified' */
async function trustOf(uid) {
  const p = person(uid);
  if (!p || !p.publicKey) return 'unverified';
  const fp = await fingerprintOf(p.publicKey);
  const v = state.settings.verified[uid];
  if (!v) return 'unverified';
  return v === fp ? 'verified' : 'changed';
}

const trustCache = new Map(); // uid -> dernier état connu (affichage synchrone)

function trustLabel(uid) {
  trustOf(uid).then((t) => {
    if (trustCache.get(uid) !== t) {
      trustCache.set(uid, t);
      if (panel) panel.render();
      scheduleRender();
    }
  });
  return trustCache.get(uid) || 'unverified';
}

/* Clé d'un contact changée depuis la dernière fois (nouvel appareil, code de
   secours perdu… ou quelqu'un qui s'interpose) : on le signale dans la
   discussion. La première clé vue est retenue sans rien dire. */
async function checkKeyChange(uid) {
  const p = await fetchPerson(uid).catch(() => null);
  if (!p || !p.publicKey) return null;
  const fp = await fingerprintOf(p.publicKey);
  const known = state.settings.keys[uid];
  if (!known) {
    F.setDoc(settingsRef(), { keys: { [uid]: fp } }, { merge: true }).catch(() => {});
    return null;
  }
  return known === fp ? null : fp;
}

function acceptKey(uid, fp) {
  return F.setDoc(settingsRef(), { keys: { [uid]: fp } }, { merge: true });
}

async function setVerified(uid, on) {
  const p = await fetchPerson(uid);
  const fp = await fingerprintOf(p.publicKey);
  await F.setDoc(settingsRef(), on
    ? { verified: { [uid]: fp }, keys: { [uid]: fp } }
    : { verified: { [uid]: F.deleteField() } }, { merge: true });
  toast(on ? nameOf(uid) + ' est vérifié·e.' : 'Vérification retirée.', 'success');
}

let qrModule = null;
const loadQr = () => qrModule || (qrModule = import('./qr.js'));

function qrSvg(text) {
  return loadQr().then((m) => {
    const q = m.qrcode(0, 'M');
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-2 -2 ' + (n + 4) + ' ' + (n + 4));
    svg.setAttribute('class', 'qr');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Code QR du numéro de sécurité');
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '-2');
    bg.setAttribute('y', '-2');
    bg.setAttribute('width', String(n + 4));
    bg.setAttribute('height', String(n + 4));
    bg.setAttribute('fill', '#fff');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', '#000');
    svg.append(bg, path);
    return svg;
  });
}

const SAFETY_PREFIX = 'message-me/safety/v1:';

async function openVerify(uid) {
  const p = await fetchPerson(uid).catch(() => null);
  if (!p || !p.publicKey || !vault) {
    toast('Cette personne n\'a pas encore de clé de chiffrement.', 'info');
    return;
  }
  const number = await E2E.safetyNumber(me(), vault.publicKey, uid, p.publicKey);
  const trust = await trustOf(uid);
  const qrBox = h('div', { class: 'qr-box' });
  qrSvg(SAFETY_PREFIX + number).then((svg) => qrBox.append(svg)).catch(() => {});
  const status = h('p', { class: 'verify-status ' + trust, text: trust === 'verified'
    ? '✅ Tu as vérifié ' + p.name + '.'
    : trust === 'changed'
      ? '⚠️ La clé de ' + p.name + ' a changé depuis ta vérification.'
      : 'Pas encore vérifié.' });
  const scan = 'BarcodeDetector' in window
    ? h('button', { class: 'btn ghost sm', type: 'button', onclick: () => scanSafety(number, uid, dlg) }, icon('camera'), 'Scanner son code')
    : null;
  const dlg = modal('Vérifier le chiffrement', h('div', { class: 'info verify' },
    h('p', { class: 'fineprint', text: 'Compare ces 60 chiffres avec ceux affichés chez ' + p.name + ' (même écran, dans ' +
      'ses infos de contact), ou scanne son code QR. S\'ils sont identiques, vos messages ne peuvent être lus que par ' +
      'vous deux : personne ne s\'est glissé entre vous.' }),
    h('p', { class: 'safety', 'aria-label': 'Numéro de sécurité' }, number.split(' ').map((g) => h('span', { text: g }))),
    qrBox,
    status,
    h('div', { class: 'row-actions' },
      scan,
      trust === 'verified'
        ? h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { dlg.close(); run(setVerified(uid, false)); } }, 'Retirer la vérification')
        : h('button', { class: 'btn primary sm', type: 'button', onclick: () => { dlg.close(); run(setVerified(uid, true)); } },
          icon('check'), 'Marquer comme vérifié'))), 'verify-dlg');
}

/* Scanner le code QR de l'autre (appareils qui savent lire les codes QR). */
async function scanSafety(number, uid, parent) {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  } catch (err) {
    toast(describe(err), 'error');
    return;
  }
  const video = h('video', { class: 'scan-video', autoplay: true, playsinline: true });
  video.muted = true;
  video.srcObject = stream;
  const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
  let timer = null;
  const dlg = modal('Scanner le code', h('div', { class: 'info' }, video,
    h('p', { class: 'fineprint', text: 'Vise le code QR affiché sur le téléphone de l\'autre personne.' })), 'menu-dlg');
  dlg.addEventListener('close', () => {
    clearInterval(timer);
    stream.getTracks().forEach((t) => t.stop());
  });
  timer = setInterval(async () => {
    const found = await detector.detect(video).catch(() => []);
    const code = found.map((f) => f.rawValue).find((v) => String(v).startsWith(SAFETY_PREFIX));
    if (!code) return;
    clearInterval(timer);
    dlg.close();
    if (code === SAFETY_PREFIX + number) {
      parent.close();
      await setVerified(uid, true).catch((err) => toast(describe(err), 'error'));
      toast('Les numéros correspondent : chiffrement vérifié ✅', 'success');
    } else {
      toast('Les numéros ne correspondent pas : ne vous fiez pas à cette discussion pour des choses sensibles.', 'error');
    }
  }, 400);
}

/* ------------------------------------------------------------------------ */
/* « En ligne » / « vu à » (presence/{uid})                                  */
/* ------------------------------------------------------------------------ */

const presenceAt = new Map(); // uid -> dernière activité (ms)
let presenceTimer = null;
let presenceWatch = null;     // { uid, unsub }
const ONLINE_MS = 90e3;

/* Masquer son statut, c'est aussi ne plus voir celui des autres. */
const presenceShared = () => !state.settings.hidePresence;

function beatPresence() {
  if (!db || !me()) return;
  const ref = F.doc(db, 'presence', me());
  if (!presenceShared()) {
    F.deleteDoc(ref).catch(() => {});
    return;
  }
  if (document.hidden) return;
  F.setDoc(ref, { at: F.serverTimestamp() }).catch(() => {});
}

function startPresence() {
  clearInterval(presenceTimer);
  beatPresence();
  presenceTimer = setInterval(() => {
    beatPresence();
    // « vu il y a… » vieillit : on redessine l'en-tête de temps en temps.
    if (presenceWatch) renderChatHead();
  }, 60e3);
}

function watchPresence(uid) {
  if (presenceWatch && presenceWatch.uid === uid) return;
  if (presenceWatch) presenceWatch.unsub();
  presenceWatch = null;
  if (!uid || !presenceShared()) return;
  const unsubP = F.onSnapshot(F.doc(db, 'presence', uid), (snap) => {
    if (snap.exists()) presenceAt.set(uid, ts(snap.data({ serverTimestamps: 'estimate' }).at));
    else presenceAt.delete(uid);
    renderChatHead();
    if (panel) panel.render();
  }, () => {});
  presenceWatch = { uid, unsub: unsubP };
}

function presenceText(uid) {
  if (!presenceShared()) return '';
  const at = presenceAt.get(uid);
  if (!at) return '';
  if (Date.now() - at < ONLINE_MS) return 'en ligne';
  const day = startOfDay(at);
  const today = startOfDay(Date.now());
  if (day === today) return 'vu à ' + fmtTime.format(at);
  if (day === today - 864e5) return 'vu hier à ' + fmtTime.format(at);
  return 'vu le ' + fmtShort.format(at);
}

async function setHidePresence(hide) {
  await F.setDoc(settingsRef(), { hidePresence: hide }, { merge: true });
  if (hide) await F.deleteDoc(F.doc(db, 'presence', me())).catch(() => {});
}

/* ------------------------------------------------------------------------ */
/* Liens d'invitation dans un groupe (invites/{code})                       */
/* ------------------------------------------------------------------------ */

function inviteLink(code) {
  return location.origin + location.pathname + location.search + '#/join/' + code;
}

function newInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_');
}

async function createInvite(conv) {
  const code = newInviteCode();
  const batch = F.writeBatch(db);
  batch.set(F.doc(db, 'invites', code), {
    cid: conv.id, title: [...conv.title].slice(0, MAX_TITLE).join(''), by: me(), createdAt: F.serverTimestamp(),
  });
  batch.update(F.doc(db, 'conversations', conv.id), { invite: code });
  await batch.commit();
  return code;
}

async function disableInvite(conv) {
  await F.updateDoc(F.doc(db, 'conversations', conv.id), { invite: F.deleteField() });
  F.deleteDoc(F.doc(db, 'invites', conv.invite)).catch(() => {}); // seulement s'il vient de moi
}

function shareInvite(conv) {
  const url = inviteLink(conv.invite);
  if (navigator.share) {
    navigator.share({ title: conv.title, text: 'Rejoins « ' + conv.title + ' » sur message-me', url }).catch(() => {});
    return;
  }
  navigator.clipboard.writeText(url)
    .then(() => toast('Lien copié.', 'success'))
    .catch(() => toast('Copie impossible : ' + url, 'info'));
}

/* La liste des conversations est chargée (au démarrage, elle arrive un peu après). */
function convsLoaded() {
  return new Promise((resolve) => {
    const wait = () => (state.convsReady || !ui ? resolve() : setTimeout(wait, 100));
    wait();
  });
}

/* Ouverture d'un lien #/join/<code>. */
async function openJoin(code) {
  await convsLoaded();
  let inv = null;
  try {
    const snap = await F.getDoc(F.doc(db, 'invites', code));
    inv = snap.exists() ? snap.data() : null;
  } catch {
    inv = null;
  }
  if (!inv) {
    toast('Ce lien d\'invitation n\'existe pas, ou plus.', 'error');
    return;
  }
  if (state.convs.some((c) => c.id === inv.cid)) {
    location.hash = '#/c/' + encodeURIComponent(inv.cid);
    return;
  }
  const by = person(inv.by) || await fetchPerson(inv.by).catch(() => null);
  const ok = await confirmSheet({
    title: 'Rejoindre « ' + inv.title + ' » ?',
    text: 'Invitation de ' + (by ? by.name : 'quelqu\'un') + '. Les membres verront ton nom et ton pseudo, ' +
      'et les nouveaux messages du groupe.',
    confirm: 'Rejoindre le groupe',
    danger: false,
  });
  if (!ok) return;
  try {
    await F.updateDoc(F.doc(db, 'conversations', inv.cid), { members: F.arrayUnion(me()), joinCode: code });
  } catch (err) {
    toast(err.code === 'permission-denied'
      ? 'Ce lien n\'est plus valable, ou le groupe est complet (20 membres).' : describe(err), 'error');
    return;
  }
  location.hash = '#/c/' + encodeURIComponent(inv.cid);
  postEvent(inv.cid, { e: 'join' });
}

/* ------------------------------------------------------------------------ */
/* Photos de profil et de groupe                                             */
/* ------------------------------------------------------------------------ */

async function photoBytes(file) {
  const blob = await Media.prepareAvatar(file);
  return F.Bytes.fromUint8Array(new Uint8Array(await blob.arrayBuffer()));
}

async function setProfilePhoto(file) {
  const data = await photoBytes(file);
  const batch = F.writeBatch(db);
  batch.set(F.doc(db, 'avatars', me()), { data, updatedAt: F.serverTimestamp() });
  batch.update(F.doc(db, 'users', me()), { photo: F.serverTimestamp() });
  await batch.commit();
}

async function removeProfilePhoto() {
  const batch = F.writeBatch(db);
  batch.delete(F.doc(db, 'avatars', me()));
  batch.update(F.doc(db, 'users', me()), { photo: F.deleteField() });
  await batch.commit();
}

async function setGroupPhoto(conv, file) {
  const data = await photoBytes(file);
  const batch = F.writeBatch(db);
  batch.set(F.doc(db, 'conversations', conv.id, 'photo', 'current'), { data, updatedAt: F.serverTimestamp() });
  batch.update(F.doc(db, 'conversations', conv.id), { photo: F.serverTimestamp() });
  await batch.commit();
  await postEvent(conv.id, { e: 'photo' });
}

async function removeGroupPhoto(conv) {
  const batch = F.writeBatch(db);
  batch.delete(F.doc(db, 'conversations', conv.id, 'photo', 'current'));
  batch.update(F.doc(db, 'conversations', conv.id), { photo: F.deleteField() });
  await batch.commit();
}

/* Choisir une photo (ou la retirer). */
function pickPhoto(has, onFile, onRemove) {
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
  input.addEventListener('change', () => {
    if (input.files[0]) run(onFile(input.files[0]).then(() => toast('Photo mise à jour.', 'success')));
    input.remove();
  });
  document.body.append(input);
  if (!has) {
    input.click();
    return;
  }
  menu('Photo', [
    { label: 'Choisir une photo', icon: 'image', onclick: () => input.click() },
    { label: 'Retirer la photo', icon: 'trash', danger: true, onclick: () => { input.remove(); run(onRemove()); } },
  ]);
}

/* Discussion à deux avec quelqu'un (créée au besoin). */
async function openDirect(uid) {
  const members = [me(), uid].sort();
  const cid = 'dm_' + members.join('_');
  if (!state.convs.some((c) => c.id === cid)) {
    const ref = F.doc(db, 'conversations', cid);
    try {
      await F.setDoc(ref, {
        type: 'dm', members, title: '', createdBy: me(), createdAt: F.serverTimestamp(),
        updatedAt: F.serverTimestamp(), lastMessage: null, lastRead: {},
      });
    } catch (err) {
      // Elle existe déjà (la liste n'était pas encore chargée) : on l'ouvre.
      const existing = err.code === 'permission-denied' ? await F.getDoc(ref).catch(() => null) : null;
      if (!existing || !existing.exists()) {
        throw err.code === 'permission-denied'
          ? userError('Impossible d\'écrire à cette personne pour le moment.') : err;
      }
    }
  }
  if (panel && panel.dlg.open) panel.dlg.close();
  location.hash = '#/c/' + encodeURIComponent(cid);
  return cid;
}

/* ======================================================================== */
/* Appels                                                                   */
/* ======================================================================== */

async function startCall(conv, video) {
  if (!calls) return;
  if (calls.current || (group && group.current)) {
    toast('Un appel est déjà en cours.', 'info');
    return;
  }
  if (conv.type === 'group') {
    startGroupCall(conv, video);
    return;
  }
  Notify.unlockAudio();
  try {
    await calls.start(conv.id, otherUid(conv), video);
  } catch (err) {
    toast('Appel impossible : ' + (err && err.code === 'permission-denied'
      ? 'cette personne ne peut pas recevoir ton appel.' : describe(err)), 'error');
  }
}

function answerCall(id) {
  Notify.unlockAudio();
  calls.accept(id).catch((err) => toast('Impossible de décrocher : ' + describe(err), 'error'));
}

function onCallChange(c) {
  if (c && c.ended) {
    endedCall = c;
    Notify.hangupTone();
    setTimeout(() => {
      if (endedCall !== c) return;
      endedCall = null;
      renderCallLayer();
    }, 1800);
  } else if (c) {
    endedCall = null;
  }
  renderCallLayer();
}

/* Appels qui sonnent : notification (si l'onglet est caché) et écran. */
function onRinging(list) {
  const ids = new Set(list.map((r) => r.id));
  for (const id of [...announcedCalls]) {
    if (ids.has(id)) continue;
    announcedCalls.delete(id);
    Notify.closeNotifications('call-' + id);
  }
  for (const r of list) {
    if (announcedCalls.has(r.id)) continue;
    announcedCalls.add(r.id);
    ensurePeople([r.caller]);
    (person(r.caller) ? Promise.resolve(person(r.caller)) : fetchPerson(r.caller).catch(() => null)).then((p) => {
      if (!announcedCalls.has(r.id)) return;
      Notify.notify('Appel de ' + (p ? p.name : 'quelqu\'un'), {
        body: r.video ? 'Appel vidéo entrant — clique pour répondre' : 'Appel vocal entrant — clique pour répondre',
        tag: 'call-' + r.id,
        hash: '#/c/' + encodeURIComponent(r.cid),
        requireInteraction: true,
        vibrate: [400, 150, 400, 150, 400],
      });
      renderCallLayer();
    });
  }
  renderCallLayer();
}

function buildCallLayer() {
  const remoteVideo = h('video', { class: 'call-remote', autoplay: true, playsinline: true });
  const localVideo = h('video', { class: 'call-local', autoplay: true, playsinline: true });
  const remoteAudio = h('audio', { autoplay: true });
  remoteVideo.muted = true; // le son passe par remoteAudio
  localVideo.muted = true;
  const info = h('div', { class: 'call-info' });
  const controls = h('div', { class: 'call-controls' });
  const el = h('div', { class: 'call-layer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Appel', hidden: true },
    remoteVideo, remoteAudio, info, localVideo, controls);
  document.body.append(el);
  callLayer = { el, remoteVideo, localVideo, remoteAudio, info, controls, timer: null, status: null };
}

function callButton(label, iconName, cls, onclick) {
  return h('button', { class: 'call-btn ' + cls, type: 'button', 'aria-label': label, title: label, onclick },
    icon(iconName), h('span', { text: label }));
}

function endedText(c) {
  if (c.reason === 'declined') return 'Appel refusé';
  if (c.reason === 'failed') {
    return c.startedAt ? 'Connexion perdue' : 'Connexion impossible : le réseau bloque peut-être l\'appel';
  }
  if (c.reason === 'gone') return 'L\'appel est terminé';
  if (!c.answered) return c.role === 'caller' ? 'Pas de réponse' : 'Appel manqué';
  return 'Appel terminé · ' + Media.formatDuration(c.duration);
}

function setStream(el, stream) {
  if (el.srcObject === stream) return;
  el.srcObject = stream;
  if (stream) el.play().catch(() => {});
}

function renderCallLayer() {
  if (!callLayer) return;
  const L = callLayer;
  const c = calls ? calls.current : null;
  const ring = !c && calls ? calls.ringing[0] : null;
  const shown = c || ring || endedCall;

  if (ring) Notify.startRingtone('incoming');
  else if (c && c.role === 'caller' && c.phase === 'calling') Notify.startRingtone('outgoing');
  else Notify.stopRingtone();

  if (!shown) {
    L.el.hidden = true;
    clearInterval(L.timer);
    L.timer = null;
    setStream(L.remoteVideo, null);
    setStream(L.remoteAudio, null);
    setStream(L.localVideo, null);
    document.body.classList.remove('in-call');
    return;
  }
  L.el.hidden = false;
  document.body.classList.add('in-call');

  const cur = c || endedCall;
  const peerUid = ring ? ring.caller : cur.peer;
  const p = person(peerUid);
  const name = p ? p.name : '…';
  const video = ring ? ring.video : cur.video;

  if (c) {
    setStream(L.remoteAudio, c.remote);
    setStream(L.remoteVideo, c.remote);
    setStream(L.localVideo, c.screen || c.local);
  }
  // Vidéo de l'autre : dès qu'elle a des images (caméra ou écran partagé).
  const rv = c && c.remote ? c.remote.getVideoTracks().find((t) => t.readyState === 'live') : null;
  const remoteVideo = Boolean(c && rv && !rv.muted && c.phase !== 'calling');
  const localVideo = Boolean(c && ((c.local && c.local.getVideoTracks().length && c.camOn) || c.screen));
  L.el.dataset.mode = ring ? 'incoming' : c ? c.phase : 'ended';
  L.el.classList.toggle('has-remote-video', remoteVideo);
  L.el.classList.toggle('has-local-video', localVideo);
  L.el.classList.toggle('sharing', Boolean(c && c.screen));

  const status = h('p', { class: 'call-status' });
  const statusText = () => {
    if (ring) return video ? 'Appel vidéo entrant…' : 'Appel vocal entrant…';
    if (!c) return endedText(endedCall);
    if (c.phase === 'calling') return (video ? 'Appel vidéo' : 'Appel vocal') + ' · sonnerie…';
    if (c.phase === 'connecting') return 'Connexion…';
    if (c.phase === 'unstable') return 'Connexion instable…';
    return Media.formatDuration(c.startedAt ? (Date.now() - c.startedAt) / 1000 : 0);
  };
  status.textContent = statusText();
  L.status = { el: status, text: statusText };
  L.info.replaceChildren(
    avatar(peerUid, name, 'xl' + (ring || (c && c.phase === 'calling') ? ' pulse' : '')),
    h('h2', { text: name }),
    status,
    h('p', { class: 'call-note', text: '🔒 Chiffré de navigateur à navigateur' }));

  if (ring) {
    L.controls.replaceChildren(
      callButton('Refuser', 'hangup', 'danger', () => calls.decline(ring.id)),
      callButton('Répondre', ring.video ? 'video' : 'phone', 'accept', () => answerCall(ring.id)));
  } else if (c) {
    L.controls.replaceChildren(...[
      callButton(c.micOn ? 'Couper le micro' : 'Activer le micro', c.micOn ? 'mic' : 'micOff',
        c.micOn ? '' : 'off', () => calls.toggleMic()),
      c.local && c.local.getVideoTracks().length
        ? callButton(c.camOn ? 'Couper la caméra' : 'Activer la caméra', c.camOn ? 'video' : 'videoOff',
          c.camOn ? '' : 'off', () => calls.toggleCam())
        : null,
      screenShareSupported() && (c.phase === 'active' || c.phase === 'unstable')
        ? callButton(c.screen ? 'Arrêter le partage' : 'Partager l\'écran', 'screen', c.screen ? 'on' : '',
          () => calls.toggleShare().catch((err) => {
            if (err && err.name !== 'NotAllowedError') toast('Partage d\'écran impossible : ' + describe(err), 'error');
          }))
        : null,
      callButton('Raccrocher', 'hangup', 'danger', () => calls.hangUp()),
    ].filter(Boolean));
  } else {
    L.controls.replaceChildren();
  }

  clearInterval(L.timer);
  L.timer = null;
  if (c && (c.phase === 'active' || c.phase === 'unstable')) {
    L.timer = setInterval(() => { if (L.status) L.status.el.textContent = L.status.text(); }, 1000);
  }
}

/* ------------------------------------------------------------------------ */
/* Appels de groupe                                                         */
/* ------------------------------------------------------------------------ */

async function startGroupCall(conv, video) {
  if (!group) return;
  const live = conv.room && conv.room.id;
  if (!live) {
    const ok = await confirmSheet({
      title: (video ? 'Appel vidéo' : 'Appel vocal') + ' de groupe ?',
      text: 'Les membres de « ' + conv.title + ' » sont prévenus et peuvent te rejoindre (4 personnes au plus).',
      confirm: 'Lancer l\'appel',
      danger: false,
    });
    if (!ok) return;
  }
  Notify.unlockAudio();
  try {
    await group.start(conv, video);
    if (!live || (group.current && group.current.participants.length === 1)) postEvent(conv.id, { e: 'room', video });
  } catch (err) {
    toast(groupCallError(err), 'error');
  }
}

function joinGroupCall(conv) {
  if (!group) return;
  if ((calls && calls.current) || group.current) {
    toast('Un appel est déjà en cours.', 'info');
    return;
  }
  Notify.unlockAudio();
  group.join(conv).catch((err) => {
    if (err.code === 'gone') {
      toast('Cet appel est terminé.', 'info');
      tidied.delete(conv.room.id);
      group.tidy(conv);
      return;
    }
    toast(groupCallError(err), 'error');
  });
}

function groupCallError(err) {
  if (err && err.code === 'full') return 'L\'appel est complet : 4 personnes au plus.';
  if (err && err.code === 'busy') return 'Un appel est déjà en cours.';
  return 'Appel impossible : ' + describe(err);
}

function buildGroupLayer() {
  const grid = h('div', { class: 'gc-grid' });
  const title = h('h2');
  const status = h('p', { class: 'call-status' });
  const controls = h('div', { class: 'call-controls' });
  const el = h('div', { class: 'call-layer group-call', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Appel de groupe', hidden: true },
    h('header', { class: 'gc-head' }, title, status), grid, controls);
  document.body.append(el);
  groupLayer = { el, grid, title, status, controls, tiles: new Map(), timer: null };
}

function groupTile(key, uid, local) {
  const video = h('video', { autoplay: true, playsinline: true });
  video.muted = local; // le son des autres passe par leur vignette
  const tile = h('div', { class: 'gc-tile' + (local ? ' me' : '') },
    video, avatar(uid, nameOf(uid), 'lg'),
    h('span', { class: 'gc-name', text: local ? 'Toi' : nameOf(uid) }),
    h('span', { class: 'gc-state' }));
  return { tile, video, stream: null };
}

function renderGroupLayer(room) {
  const L = groupLayer;
  if (!L) return;
  if (!room) {
    L.el.hidden = true;
    clearInterval(L.timer);
    L.timer = null;
    for (const t of L.tiles.values()) t.video.srcObject = null;
    L.tiles.clear();
    L.grid.replaceChildren();
    document.body.classList.remove('in-call');
    scheduleRender();
    return;
  }
  L.el.hidden = false;
  document.body.classList.add('in-call');
  const conv = state.convs.find((c) => c.id === room.cid);
  L.title.textContent = conv ? conv.title : 'Appel de groupe';
  const people = [['me', me(), room.local, true], ...[...room.peers.values()].map((p) => [p.uid, p.uid, p.remote, false])];
  // Participants annoncés dont la connexion n'est pas encore établie.
  for (const u of room.participants || []) if (u !== me() && !room.peers.has(u)) people.push([u, u, null, false]);
  const keys = new Set(people.map(([k]) => k));
  for (const k of [...L.tiles.keys()]) if (!keys.has(k)) L.tiles.delete(k);
  const tiles = people.map(([k, uid, stream, local]) => {
    let t = L.tiles.get(k);
    if (!t) { t = groupTile(k, uid, local); L.tiles.set(k, t); }
    if (t.stream !== stream) {
      t.stream = stream;
      t.video.srcObject = stream;
      if (stream) t.video.play().catch(() => {});
    }
    const vt = stream ? stream.getVideoTracks().find((x) => x.readyState === 'live') : null;
    const showVideo = local ? Boolean(vt && room.camOn) : Boolean(vt && !vt.muted);
    t.tile.classList.toggle('has-video', showVideo);
    const peer = room.peers.get(uid);
    const st = local ? (room.micOn ? '' : '🔇') : !peer ? 'Connexion…'
      : peer.state === 'connected' ? '' : peer.state === 'failed' ? 'Connexion impossible' : 'Connexion…';
    t.tile.querySelector('.gc-state').textContent = st;
    return t.tile;
  });
  L.grid.dataset.n = String(tiles.length);
  L.grid.replaceChildren(...tiles);
  const n = tiles.length;
  const tick = () => {
    L.status.textContent = (n > 1 ? n + ' participants' : 'En attente des autres membres…') + ' · ' +
      Media.formatDuration((Date.now() - room.startedAt) / 1000);
  };
  tick();
  clearInterval(L.timer);
  L.timer = setInterval(tick, 1000);
  L.controls.replaceChildren(...[
    callButton(room.micOn ? 'Couper le micro' : 'Activer le micro', room.micOn ? 'mic' : 'micOff',
      room.micOn ? '' : 'off', () => group.toggleMic()),
    room.local.getVideoTracks().length
      ? callButton(room.camOn ? 'Couper la caméra' : 'Activer la caméra', room.camOn ? 'video' : 'videoOff',
        room.camOn ? '' : 'off', () => group.toggleCam())
      : null,
    callButton('Quitter l\'appel', 'hangup', 'danger', () => group.leave()),
  ].filter(Boolean));
  scheduleRender();
}

/* Visionneuse : la photo déchiffrée, en grand, avec enregistrement. */
function openPhoto(url, caption, mime) {
  const ext = /png/.test(mime) ? 'png' : /webp/.test(mime) ? 'webp' : 'jpg';
  const dlg = h('dialog', { class: 'lightbox', 'aria-label': 'Photo' },
    h('img', { src: url, alt: caption || 'Photo' }),
    h('div', { class: 'lightbox-bar' },
      h('p', { text: caption || '' }),
      h('a', { class: 'btn ghost sm', href: url, download: 'message-me-photo.' + ext }, icon('download'), 'Enregistrer'),
      h('button', { class: 'btn icon ghost', type: 'button', 'aria-label': 'Fermer', onclick: () => dlg.close() }, icon('close'))));
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.tagName === 'IMG') dlg.close(); });
  document.body.append(dlg);
  dlg.showModal();
}

/* La clé déverrouillée est effacée de cet appareil à la déconnexion. */
async function logout() {
  const uid = me();
  secret = null;
  teardown();
  if (uid) await E2E.deleteDeviceKey(uid);
  await A.signOut(auth);
  // La copie hors ligne (noms, groupes, messages chiffrés) ne reste pas sur
  // l'appareil : on la vide, puis on recharge la page.
  try {
    await F.terminate(db);
    await F.clearIndexedDbPersistence(db);
  } catch {
    // Autre onglet encore ouvert : la copie sera réutilisée par le prochain compte.
  }
  location.reload();
}

/* ======================================================================== */
/* Fenêtres                                                                 */
/* ======================================================================== */

function modal(title, body, cls = '') {
  const dlg = h('dialog', { class: 'modal ' + cls, 'aria-label': title },
    h('header', { class: 'modal-head' },
      h('h2', { text: title }),
      h('button', {
        class: 'btn icon ghost', type: 'button', 'aria-label': 'Fermer', onclick: () => dlg.close(),
      }, icon('close'))),
    body);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

/* Menu d'actions (feuille en bas de l'écran sur mobile). */
function menu(title, items, note = '') {
  const dlg = modal(title, h('div', { class: 'menu' },
    note ? h('p', { class: 'menu-note', text: note }) : null,
    items.filter(Boolean).map((it) => h('button', {
      class: 'menu-item' + (it.danger ? ' danger' : ''), type: 'button',
      onclick: () => { dlg.close(); it.onclick(); },
    }, icon(it.icon), h('span', { class: 'menu-txt' }, h('b', { text: it.label }),
      it.sub ? h('small', { text: it.sub }) : null)))), 'menu-dlg');
  return dlg;
}

/* Demande de confirmation : rend une promesse (vrai si confirmé). */
function confirmSheet({ title, text, confirm, danger = true }) {
  return new Promise((resolve) => {
    let answer = false;
    const dlg = modal(title, h('div', { class: 'form' },
      h('p', { class: 'confirm-text', text }),
      h('div', { class: 'row-actions end' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
        h('button', {
          class: 'btn ' + (danger ? 'danger' : 'primary'), type: 'button',
          onclick: () => { answer = true; dlg.close(); },
        }, confirm))), 'confirm-dlg');
    dlg.addEventListener('close', () => resolve(answer));
  });
}

const run = (job) => Promise.resolve(job).catch((err) => toast(err.userMessage || describe(err), 'error'));

function actionTile(iconName, label, onclick, cls = '') {
  return h('button', { class: 'action ' + cls, type: 'button', onclick },
    h('span', { class: 'action-ic' }, icon(iconName)), h('span', { text: label }));
}

function section(title, ...kids) {
  return h('section', { class: 'info-sec' }, h('h4', {}, title), ...kids);
}

/* Petit sélecteur à boutons (Tous / Admins, thème…). */
function segmented(label, options, value, onpick, disabled = false) {
  return h('div', { class: 'seg', role: 'group', 'aria-label': label },
    options.map(([v, text]) => h('button', {
      type: 'button', 'aria-pressed': String(v === value), disabled,
      onclick: () => { if (v !== value) onpick(v); },
    }, text)));
}

/* ------------------------------------------------------------------------ */
/* Infos d'une conversation : groupe (membres, rôles, réglages) ou contact  */
/* ------------------------------------------------------------------------ */

async function setTtl(conv, ttl) {
  await F.updateDoc(F.doc(db, 'conversations', conv.id), { ttl });
  await postEvent(conv.id, { e: 'ttl', ttl });
}

function ttlSetting(conv) {
  const allowedToSet = conv.type !== 'group' || can(conv, 'info');
  return h('div', { class: 'perm' },
    h('span', { class: 'perm-txt' }, h('b', { text: 'Messages éphémères' }),
      h('small', { text: 'Les nouveaux messages disparaissent après ce délai.' })),
    segmented('Messages éphémères', [[0, 'Non'], [86400, '24 h'], [604800, '7 j']], Number(conv.ttl) || 0,
      (v) => run(setTtl(conv, v)), !allowedToSet));
}

function openInfo() {
  const conv = activeConv();
  if (!conv) return;
  const body = h('div', { class: 'info' });
  const dlg = modal(conv.type === 'group' ? 'Infos du groupe' : 'Infos du contact', body, 'info-dlg');
  let sig = '';
  const view = { dlg, cid: conv.id, render: () => {
    const c = activeConv();
    if (!c || c.id !== view.cid) return;
    // Redessine seulement si quelque chose a changé (on ne remplace pas un
    // bouton sous le doigt à chaque signal « … écrit »).
    const next = infoSig(c);
    if (next === sig) return;
    sig = next;
    const top = dlg.scrollTop;
    body.replaceChildren(...(c.type === 'group' ? groupInfo(c) : directInfo(c)).filter(Boolean));
    dlg.scrollTop = top;
  } };
  panel = view;
  dlg.addEventListener('close', () => { if (panel === view) panel = null; });
  view.render();
}

function infoSig(conv) {
  const uids = conv.type === 'group' ? conv.members : [otherUid(conv)];
  return JSON.stringify([conv.title, conv.description, conv.members, conv.admins, conv.perms, conv.createdBy, conv.ttl,
    conv.type === 'group' ? '' : [trustCache.get(otherUid(conv)) || '', state.settings.verified[otherUid(conv)] || '',
      (person(otherUid(conv)) || {}).publicKey || ''],
    ts(conv.photo), conv.invite || '', conv.type === 'group' ? '' : presenceText(otherUid(conv)),
    state.settings.pinned.includes(conv.id), state.settings.archived.includes(conv.id),
    mutedUntil(conv.id), uids.map((u) => [nameOf(u), (person(u) || {}).username, isBlocked(u), silencedUntil(u)]),
    state.convs.length, Boolean(calls)]);
}

function roleOf(conv, uid) {
  if (isOwner(conv, uid)) return 'Propriétaire';
  if (isAdmin(conv, uid)) return 'Admin';
  return '';
}

function badges(conv, uid) {
  const out = [];
  const role = roleOf(conv, uid);
  if (role) out.push(h('span', { class: 'badge accent', text: role }));
  const until = silencedUntil(uid);
  if (until) out.push(h('span', { class: 'badge', title: 'Privé de parole', text: '🔇 ' + untilText(until) }));
  if (isBlocked(uid)) out.push(h('span', { class: 'badge danger', text: 'Bloqué·e' }));
  return out;
}

function groupInfo(conv) {
  const n = conv.members.length;
  const admin = isAdmin(conv);
  const muted = isMuted(conv.id);
  const order = (u) => (u === me() ? 0 : isOwner(conv, u) ? 1 : isAdmin(conv, u) ? 2 : 3);
  const members = [...conv.members].sort((a, b) => order(a) - order(b) || nameOf(a).localeCompare(nameOf(b), 'fr'));
  const perm = (what, label) => h('div', { class: 'perm' },
    h('span', { text: label }),
    segmented(label, [['all', 'Tous'], ['admins', 'Admins']], permOf(conv, what),
      (v) => run(updatePerms(conv, what, v)), !admin));

  const inviteSection = can(conv, 'add')
    ? section('Lien d\'invitation', conv.invite
      ? h('div', { class: 'invite' },
        h('input', { class: 'invite-url', readonly: true, value: inviteLink(conv.invite), 'aria-label': 'Lien d\'invitation',
          onfocus: (e) => e.target.select() }),
        h('div', { class: 'row-actions' },
          h('button', { class: 'btn primary sm', type: 'button', onclick: () => shareInvite(conv) },
            icon('link'), navigator.share ? 'Partager' : 'Copier le lien'),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => run(createInvite(conv)) }, 'Nouveau lien'),
          h('button', { class: 'btn ghost sm', type: 'button', onclick: () => run(disableInvite(conv)) }, 'Désactiver')),
        h('p', { class: 'fineprint', text: 'Qui a ce lien peut rejoindre le groupe. « Nouveau lien » rend l\'ancien inutilisable.' }))
      : h('div', { class: 'invite' },
        h('button', { class: 'btn ghost sm', type: 'button', onclick: () => run(createInvite(conv)) },
          icon('link'), 'Créer un lien d\'invitation'),
        h('p', { class: 'fineprint', text: 'Pratique pour inviter sans connaître les pseudos (20 membres au plus).' })))
    : null;

  return [
    h('div', { class: 'info-hero' },
      can(conv, 'info')
        ? h('button', {
          class: 'photo-edit', type: 'button', 'aria-label': 'Changer la photo du groupe',
          onclick: () => pickPhoto(Boolean(conv.photo), (f) => setGroupPhoto(conv, f), () => removeGroupPhoto(conv)),
        }, convAvatar(conv, 'lg'), h('span', { class: 'photo-edit-ic' }, icon('camera')))
        : convAvatar(conv, 'lg'),
      h('h3', { text: conv.title }),
      h('p', { class: 'info-sub', text: 'Groupe · ' + n + (n > 1 ? ' membres' : ' membre') }),
      conv.description
        ? h('p', { class: 'info-desc' }, richText(conv.description))
        : can(conv, 'info')
          ? h('button', { class: 'linkish', type: 'button', onclick: () => openEditInfo(conv) }, 'Ajouter une description')
          : null,
      muted ? h('p', { class: 'info-flag' }, icon('bellOff'), muteLabel(conv.id)) : null),
    h('div', { class: 'info-actions' },
      can(conv, 'info') ? actionTile('edit', 'Modifier', () => openEditInfo(conv)) : null,
      can(conv, 'add') && n < MAX_MEMBERS ? actionTile('userPlus', 'Ajouter', () => openAddMembers(conv)) : null,
      actionTile(muted ? 'bell' : 'bellOff', muted ? 'Réactiver' : 'Sourdine', () => chooseMute(conv.id)),
      actionTile('search', 'Rechercher', () => { if (panel) panel.dlg.close(); openSearch(); }),
      actionTile('leave', 'Quitter', () => run(leaveGroup(conv)), 'danger')),
    orphan(conv)
      ? h('div', { class: 'callout' },
        h('p', { text: 'Ce groupe n\'a plus d\'admin : un membre peut reprendre ce rôle.' }),
        h('button', { class: 'btn primary sm', type: 'button', onclick: () => run(claimAdmin(conv)) },
          icon('shield'), 'Reprendre les droits d\'admin'))
      : null,
    section('Réglages du groupe',
      ttlSetting(conv),
      perm('send', 'Envoyer des messages'),
      perm('info', 'Modifier les infos'),
      perm('add', 'Ajouter des membres'),
      admin ? null : h('p', { class: 'fineprint', text: 'Seuls les admins peuvent changer ces réglages.' })),
    inviteSection,
    section(h('span', {}, 'Membres ', h('span', { class: 'count-badge', text: String(n) })),
      can(conv, 'add') && n < MAX_MEMBERS
        ? h('button', { class: 'member add', type: 'button', onclick: () => openAddMembers(conv) },
          h('span', { class: 'avatar sm add-ic' }, icon('userPlus')), h('b', { text: 'Ajouter des membres' }))
        : null,
      members.map((uid) => h('button', {
        class: 'member', type: 'button', onclick: () => openMemberMenu(conv, uid),
        'aria-label': nameOf(uid) + (uid === me() ? ' (toi)' : '') + (roleOf(conv, uid) ? ', ' + roleOf(conv, uid) : ''),
      },
      avatar(uid, nameOf(uid), 'sm'),
      h('span', { class: 'member-txt' },
        h('b', {}, nameOf(uid), uid === me() ? h('small', { text: ' (toi)' }) : null),
        h('small', { text: (person(uid) || {}).username ? '@' + person(uid).username : '' })),
      h('span', { class: 'badges' }, badges(conv, uid)),
      icon('chevron')))),
    h('div', { class: 'info-foot' },
      h('button', { class: 'btn danger-ghost block', type: 'button', onclick: () => run(leaveGroup(conv)) },
        icon('leave'), 'Quitter le groupe'),
      h('p', { class: 'fineprint', text: '🔒 Les messages sont chiffrés de bout en bout. Le nom, la description ' +
        'et la liste des membres ne le sont pas.' })),
  ];
}

function directInfo(conv) {
  const uid = otherUid(conv);
  const p = person(uid) || {};
  const blocked = isBlocked(uid);
  const muted = isMuted(conv.id);
  const callable = calls && !blocked;
  const shared = state.convs.filter((c) => c.type === 'group' && c.members.includes(uid));
  const close = () => { if (panel) panel.dlg.close(); };
  return [
    h('div', { class: 'info-hero' },
      avatar(uid, nameOf(uid), 'lg'),
      h('h3', { text: nameOf(uid) }),
      p.username ? h('p', { class: 'info-sub', text: '@' + p.username + (presenceText(uid) && !blocked ? ' · ' + presenceText(uid) : '') }) : null,
      blocked ? h('p', { class: 'info-flag danger' }, icon('ban'), 'Tu as bloqué cette personne') : null,
      muted ? h('p', { class: 'info-flag' }, icon('bellOff'), muteLabel(conv.id)) : null),
    h('div', { class: 'info-actions' },
      callable ? actionTile('phone', 'Appeler', () => { close(); startCall(conv, false); }) : null,
      callable ? actionTile('video', 'Vidéo', () => { close(); startCall(conv, true); }) : null,
      actionTile(muted ? 'bell' : 'bellOff', muted ? 'Réactiver' : 'Sourdine', () => chooseMute(conv.id)),
      actionTile('search', 'Rechercher', () => { close(); openSearch(); }),
      p.username ? actionTile('copy', 'Copier le pseudo', () => navigator.clipboard.writeText('@' + p.username)
        .then(() => toast('Pseudo copié.', 'success'))
        .catch(() => toast('Son pseudo : @' + p.username, 'info'))) : null),
    section('Conversation', ttlSetting(conv)),
    section('Chiffrement', h('button', { class: 'member', type: 'button', onclick: () => openVerify(uid) },
      h('span', { class: 'avatar sm add-ic' }, icon('lock')),
      h('span', { class: 'member-txt' }, h('b', { text: 'Vérifier le chiffrement' }),
        h('small', { text: 'Numéro de sécurité et code QR à comparer' })),
      h('span', { class: 'badges' }, {
        verified: h('span', { class: 'badge success', text: 'Vérifié' }),
        changed: h('span', { class: 'badge danger', text: 'Clé changée' }),
        unverified: h('span', { class: 'badge', text: 'Non vérifié' }),
      }[trustLabel(uid)]),
      icon('chevron'))),
    shared.length
      ? section('Groupes en commun',
        shared.map((g) => h('a', { class: 'member', href: '#/c/' + encodeURIComponent(g.id), onclick: close },
          convAvatar(g, 'sm'),
          h('span', { class: 'member-txt' }, h('b', { text: g.title }),
            h('small', { text: g.members.length + ' membres' })),
          icon('chevron'))))
      : null,
    h('div', { class: 'info-foot' },
      blocked
        ? h('button', { class: 'btn ghost block', type: 'button', onclick: () => setBlocked(uid, false) },
          icon('ban'), 'Débloquer ' + nameOf(uid))
        : h('button', { class: 'btn danger-ghost block', type: 'button', onclick: () => setBlocked(uid, true) },
          icon('ban'), 'Bloquer ' + nameOf(uid)),
      h('p', { class: 'fineprint', text: 'Bloquer empêche cette personne de t\'écrire en privé, de t\'appeler et ' +
        'de t\'ajouter à un groupe. Elle n\'est pas prévenue.' })),
  ];
}

function openMemberMenu(conv, uid) {
  const self = uid === me();
  const admin = isAdmin(conv);
  const name = nameOf(uid);
  const items = [];
  if (!self) items.push({ label: 'Envoyer un message', icon: 'message', onclick: () => run(openDirect(uid)) });
  if (!self) items.push({ label: 'Vérifier le chiffrement', icon: 'lock', onclick: () => openVerify(uid) });
  if (admin && !self) {
    if (!isAdmin(conv, uid)) {
      items.push({ label: 'Donner les droits d\'admin', sub: 'Gérer les membres et les réglages', icon: 'shield',
        onclick: () => run(setAdmin(conv, uid, true)) });
    } else if (!isOwner(conv, uid)) {
      items.push({ label: 'Retirer les droits d\'admin', icon: 'shield', onclick: () => run(setAdmin(conv, uid, false)) });
    }
    if (!isAdmin(conv, uid) && !isOwner(conv, uid)) {
      items.push(silencedUntil(uid)
        ? { label: 'Rendre la parole', sub: 'Privé de parole jusqu\'à ' + untilText(silencedUntil(uid)),
          icon: 'message', onclick: () => run(unsilence(conv, uid)) }
        : { label: 'Retirer la parole…', sub: 'Mute temporaire : lit le groupe sans pouvoir y écrire',
          icon: 'hush', onclick: () => chooseSilence(conv, uid) });
    }
    if (!isOwner(conv, uid)) {
      items.push({ label: 'Retirer du groupe', icon: 'leave', danger: true, onclick: () => run(removeMember(conv, uid)) });
    }
  }
  if (self && admin && adminsOf(conv).some((u) => u !== me() && conv.members.includes(u))) {
    items.push({ label: 'Renoncer à mes droits d\'admin', icon: 'shield', onclick: () => run(setAdmin(conv, uid, false)) });
  }
  if (self) items.push({ label: 'Quitter le groupe', icon: 'leave', danger: true, onclick: () => run(leaveGroup(conv)) });
  if (!self) {
    items.push(isBlocked(uid)
      ? { label: 'Débloquer ' + name, icon: 'ban', onclick: () => setBlocked(uid, false) }
      : { label: 'Bloquer ' + name, icon: 'ban', danger: true, onclick: () => setBlocked(uid, true) });
  }
  const p = person(uid) || {};
  menu(name + (self ? ' (toi)' : ''), items, [p.username ? '@' + p.username : '', roleOf(conv, uid)].filter(Boolean).join(' · '));
}

function chooseSilence(conv, uid) {
  const name = nameOf(uid);
  menu('Retirer la parole à ' + name, SILENCE_CHOICES.map(([label, ms]) => ({
    label, icon: 'hush', onclick: () => run(silence(conv, uid, ms)),
  })), name + ' pourra lire le groupe mais plus y écrire, jusqu\'à la fin du délai (ou jusqu\'à ce qu\'un admin lui rende la parole).');
}

function openEditInfo(conv) {
  const error = formError();
  const title = h('input', { name: 'title', required: true, maxlength: MAX_TITLE, value: conv.title });
  const desc = h('textarea', { name: 'description', rows: 3, maxlength: MAX_DESC, placeholder: 'De quoi parle ce groupe ?' });
  desc.value = conv.description || '';
  const save = h('button', { class: 'btn primary', type: 'submit' }, 'Enregistrer');
  const form = h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      showError(error, '');
      busy(save, () => updateInfo(conv, title.value, desc.value))
        .then(() => dlg.close())
        .catch((err) => showError(error, err.userMessage || describe(err)));
    },
  },
  field('Nom du groupe', title),
  field('Description', desc, 'Visible par tous les membres. 300 caractères au plus.'),
  error,
  h('div', { class: 'row-actions end' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
    save));
  const dlg = modal('Modifier le groupe', form);
  title.focus();
}

/* Choix de personnes : par pseudo, ou parmi ses contacts. */
function peoplePicker({ exclude = [], max = MAX_MEMBERS - 1, onChange = () => {} } = {}) {
  const picked = [];
  const error = formError();
  const chips = h('div', { class: 'chips', hidden: true });
  const input = h('input', {
    name: 'who', autocapitalize: 'none', spellcheck: 'false', autocomplete: 'off', enterkeyhint: 'done',
    placeholder: '@pseudo', 'aria-label': 'Ajouter par pseudo',
  });
  const addBtn = h('button', { class: 'btn ghost sm', type: 'button' }, icon('plus'), 'Ajouter');
  const list = h('div', { class: 'pick-list' });

  function draw() {
    chips.hidden = !picked.length;
    chips.replaceChildren(...picked.map((u) => h('span', { class: 'chip' },
      avatar(u, nameOf(u), 'xs'), h('span', { text: nameOf(u) }),
      h('button', {
        type: 'button', 'aria-label': 'Retirer ' + nameOf(u),
        onclick: () => toggle(u),
      }, icon('close')))));
    const people = contacts().filter((u) => !exclude.includes(u));
    list.replaceChildren(...(people.length
      ? [h('p', { class: 'pick-head', text: 'Tes contacts' }), ...people.map((u) => h('button', {
        class: 'member pick', type: 'button', 'aria-pressed': String(picked.includes(u)), onclick: () => toggle(u),
      },
      avatar(u, nameOf(u), 'sm'),
      h('span', { class: 'member-txt' }, h('b', { text: nameOf(u) }),
        h('small', { text: '@' + ((person(u) || {}).username || '') })),
      h('span', { class: 'tick' }, icon('check'))))]
      : [h('p', { class: 'fineprint', text: 'Ajoute des personnes par leur pseudo.' })]));
    onChange(picked.slice());
  }

  function toggle(u) {
    showError(error, '');
    const i = picked.indexOf(u);
    if (i >= 0) picked.splice(i, 1);
    else if (picked.length >= max) showError(error, 'Un groupe compte au plus ' + MAX_MEMBERS + ' membres.');
    else picked.push(u);
    draw();
  }

  async function addTyped() {
    const names = input.value.split(/[\s,;]+/).filter(Boolean);
    if (!names.length) return;
    showError(error, '');
    try {
      const uids = await busy(addBtn, () => lookupUsernames(names));
      for (const u of uids) {
        if (exclude.includes(u)) throw userError(nameOf(u) + ' fait déjà partie du groupe.');
        if (isBlocked(u)) throw userError('Tu as bloqué ' + nameOf(u) + ' : débloque cette personne d\'abord.');
      }
      for (const u of uids) if (!picked.includes(u)) toggle(u);
      input.value = '';
    } catch (err) {
      showError(error, err.userMessage || describe(err));
    }
  }

  addBtn.addEventListener('click', addTyped);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTyped(); }
  });
  draw();
  return {
    el: h('div', { class: 'picker' }, chips,
      h('div', { class: 'picker-add' }, input, addBtn), error, list),
    picked: () => picked.slice(),
    input,
  };
}

function openAddMembers(conv) {
  const submit = h('button', { class: 'btn primary', type: 'button', disabled: true }, 'Ajouter');
  const picker = peoplePicker({
    exclude: conv.members,
    max: MAX_MEMBERS - conv.members.length,
    onChange: (list) => {
      submit.disabled = !list.length;
      submit.textContent = list.length > 1 ? 'Ajouter ' + list.length + ' personnes' : 'Ajouter';
    },
  });
  submit.addEventListener('click', () => {
    busy(submit, () => addMembers(conv, picker.picked()))
      .then(() => dlg.close())
      .catch((err) => toast(err.userMessage || describe(err), 'error'));
  });
  const dlg = modal('Ajouter au groupe', h('div', { class: 'form' },
    picker.el,
    h('div', { class: 'row-actions end sticky-actions' },
      h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
      submit)));
  if (!coarse) picker.input.focus();
}

/* ------------------------------------------------------------------------ */
/* Nouvelle conversation : discussion à deux ou groupe                       */
/* ------------------------------------------------------------------------ */

function openNewConversation(mode = 'dm') {
  const body = h('div', { class: 'new-conv' });
  const dlg = modal('Nouvelle conversation', body);
  const draw = (m) => {
    const tabs = h('div', { class: 'tabs', role: 'tablist' },
      h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(m === 'dm'), onclick: () => draw('dm') },
        'Discussion'),
      h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(m === 'group'), onclick: () => draw('group') },
        'Groupe'));
    body.replaceChildren(tabs, m === 'dm' ? directForm(dlg) : groupForm(dlg));
    const first = body.querySelector('input');
    if (first && !coarse) first.focus();
  };
  draw(mode);
}

function directForm(dlg) {
  const error = formError();
  const who = h('input', {
    name: 'who', required: true, autocapitalize: 'none', spellcheck: 'false', autocomplete: 'off',
    placeholder: '@pseudo', enterkeyhint: 'go',
  });
  const submit = h('button', { class: 'btn primary', type: 'submit' }, 'Écrire');
  const people = contacts();
  return h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      showError(error, '');
      busy(submit, async () => {
        if (!who.value.trim()) throw userError('Indique le pseudo de la personne.');
        const [uid] = await lookupUsernames([who.value]);
        await openDirect(uid);
        dlg.close();
      }).catch((err) => showError(error, err.userMessage || describe(err)));
    },
  },
  field('Pseudo de la personne', who),
  error,
  h('div', { class: 'row-actions end' }, submit),
  people.length
    ? h('div', { class: 'pick-list' }, h('p', { class: 'pick-head', text: 'Tes contacts' }),
      people.map((u) => h('button', {
        class: 'member', type: 'button',
        onclick: () => run(openDirect(u).then(() => dlg.close())),
      },
      avatar(u, nameOf(u), 'sm'),
      h('span', { class: 'member-txt' }, h('b', { text: nameOf(u) }),
        h('small', { text: '@' + ((person(u) || {}).username || '') })),
      icon('chevron'))))
    : null,
  h('p', { class: 'fineprint' }, 'Ton pseudo : ', h('b', { text: '@' + state.profile.username }),
    ' — partage-le pour qu\'on puisse t\'écrire.'));
}

function groupForm(dlg) {
  const error = formError();
  const title = h('input', { name: 'title', maxlength: MAX_TITLE, placeholder: 'ex. Week-end à Lyon' });
  const desc = h('textarea', { name: 'description', rows: 2, maxlength: MAX_DESC, placeholder: 'Facultatif' });
  const submit = h('button', { class: 'btn primary', type: 'submit', disabled: true }, 'Créer le groupe');
  const picker = peoplePicker({
    onChange: (list) => {
      submit.disabled = !list.length;
      submit.textContent = list.length ? 'Créer le groupe (' + (list.length + 1) + ' membres)' : 'Créer le groupe';
    },
  });
  return h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      showError(error, '');
      busy(submit, () => createGroup({ title: title.value, description: desc.value, uids: picker.picked() }))
        .then((cid) => {
          dlg.close();
          location.hash = '#/c/' + encodeURIComponent(cid);
        })
        .catch((err) => showError(error, err.userMessage || describe(err)));
    },
  },
  field('Nom du groupe', title, 'Facultatif : sinon, les prénoms des membres.'),
  field('Description', desc),
  h('div', { class: 'field' }, h('span', { class: 'field-label', text: 'Membres' }), picker.el),
  h('p', { class: 'fineprint', text: 'Tu en seras l\'admin. Membres, rôles et réglages se gèrent ensuite dans les infos du groupe.' }),
  error,
  h('div', { class: 'row-actions end sticky-actions' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
    submit));
}

/* ------------------------------------------------------------------------ */
/* Paramètres : profil, notifications, apparence, confidentialité, sécurité */
/* ------------------------------------------------------------------------ */

function openSettings() {
  const p = state.profile;
  const error = formError();
  const name = h('input', { name: 'name', required: true, maxlength: MAX_NAME, value: p.name, autocomplete: 'nickname' });
  const save = h('button', { class: 'btn primary sm', type: 'submit' }, 'Enregistrer');
  const profile = h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      const n = name.value.trim();
      if (!n || n.length > MAX_NAME) return showError(error, 'Le nom affiché fait entre 1 et 40 caractères.');
      showError(error, '');
      busy(save, () => F.updateDoc(F.doc(db, 'users', p.uid), { name: n }))
        .then(() => toast('Profil mis à jour.', 'success'))
        .catch((err) => showError(error, describe(err)));
    },
  },
  h('div', { class: 'profile-id' },
    h('button', {
      class: 'photo-edit', type: 'button', 'aria-label': 'Changer ma photo de profil',
      onclick: () => pickPhoto(Boolean(state.profile.photo), setProfilePhoto, removeProfilePhoto),
    }, avatar(p.uid, p.name, 'lg'), h('span', { class: 'photo-edit-ic' }, icon('camera'))),
    h('div', {},
      h('b', { text: '@' + p.username }),
      h('small', { text: (state.user.email || '') + (hasPassword()
        ? (auth.currentUser.emailVerified ? ' · confirmée' : ' · non confirmée') : ' · compte Google') }),
      h('button', {
        class: 'linkish', type: 'button',
        onclick: () => navigator.clipboard.writeText('@' + p.username)
          .then(() => toast('Pseudo copié.', 'success'))
          .catch(() => toast('Copie impossible : ton pseudo est @' + p.username, 'info')),
      }, 'Copier mon pseudo'))),
  h('div', { class: 'inline-field' }, field('Nom affiché', name), save),
  error);

  const theme = h('div', {});
  const drawTheme = () => theme.replaceChildren(h('div', { class: 'setting' },
    icon('palette'),
    h('span', { class: 'setting-txt' }, h('b', { text: 'Thème' }), h('small', { text: 'Sur cet appareil.' })),
    segmented('Thème', [['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']], pref('theme', 'auto'), (v) => {
      setPref('theme', v);
      applyTheme();
      drawTheme();
    })));
  drawTheme();

  const blocked = h('div', { class: 'blocked-list' });
  const blockedCount = h('span', { class: 'count-badge' });
  const drawBlocked = () => {
    const uids = [...state.settings.blocked];
    blockedCount.textContent = String(uids.length);
    blockedCount.hidden = !uids.length;
    blocked.replaceChildren(...(uids.length
      ? uids.map((u) => h('div', { class: 'member static' },
        avatar(u, nameOf(u), 'sm'),
        h('span', { class: 'member-txt' }, h('b', { text: nameOf(u) }),
          h('small', { text: (person(u) || {}).username ? '@' + person(u).username : '' })),
        h('button', {
          class: 'btn ghost sm', type: 'button',
          onclick: () => setBlocked(u, false).then(drawBlocked),
        }, 'Débloquer')))
      : [h('p', { class: 'fineprint', text: 'Tu n\'as bloqué personne. Pour bloquer quelqu\'un, ouvre les infos de ' +
        'votre discussion ou touche son nom dans la liste des membres d\'un groupe.' })]));
  };
  drawBlocked();

  const dlg = modal('Paramètres', h('div', { class: 'settings' },
    section('Profil', profile),
    section('Notifications',
      notificationsSetting(),
      toggleSetting('volume', 'Sons', 'Petit son à l\'arrivée d\'un message.', 'sons'),
      toggleSetting('eye', 'Aperçu des messages', 'Affiche le contenu dans les notifications.', 'apercu')),
    section('Application', installSetting(), apkSetting()),
    section('Apparence', theme),
    section('Confidentialité', presenceSetting()),
    section(h('span', {}, 'Personnes bloquées ', blockedCount), blocked),
    section('Sécurité',
      h('p', { class: 'fineprint', text: '🔒 Tes messages, photos et messages vocaux sont chiffrés de bout en bout.' }),
      h('div', { class: 'row-actions' },
        h('button', {
          class: 'btn ghost sm', type: 'button', onclick: () => { dlg.close(); openChangePassword(); },
        }, icon('lock'), hasPassword() ? 'Changer de mot de passe' : 'Mot de passe de chiffrement'),
        h('button', {
          class: 'btn ghost sm', type: 'button', onclick: () => { dlg.close(); openNewRecoveryCode(); },
        }, 'Nouveau code de secours'))),
    h('div', { class: 'info-foot' },
      h('button', { class: 'btn danger-ghost block', type: 'button', onclick: () => { dlg.close(); logout(); } },
        icon('logout'), 'Se déconnecter'),
      h('button', { class: 'linkish danger-link', type: 'button', onclick: () => { dlg.close(); openDeleteAccount(); } },
        'Supprimer mon compte'))), 'settings-dlg');
}

function presenceSetting() {
  const input = h('input', { type: 'checkbox', role: 'switch', checked: presenceShared() });
  input.addEventListener('change', () => run(setHidePresence(!input.checked)));
  return h('label', { class: 'setting toggle' },
    icon('eye'),
    h('span', { class: 'setting-txt' }, h('b', { text: 'Montrer quand je suis en ligne' }),
      h('small', { text: '« En ligne » ou « vu à 14:32 ». Si tu le masques, tu ne vois plus non plus celui des autres.' })),
    input);
}

function toggleSetting(iconName, title, text, key) {
  const input = h('input', { type: 'checkbox', role: 'switch', checked: pref(key, 'oui') === 'oui' });
  input.addEventListener('change', () => setPref(key, input.checked ? 'oui' : 'non'));
  return h('label', { class: 'setting toggle' },
    icon(iconName),
    h('span', { class: 'setting-txt' }, h('b', { text: title }), h('small', { text })),
    input);
}

function notificationsSetting() {
  const box = h('div', { class: 'setting' });
  const draw = () => {
    const perm = Notify.notificationPermission();
    const text = {
      granted: 'Notifications activées sur cet appareil.',
      denied: 'Notifications bloquées : autorise-les dans les réglages du site (icône à gauche de l\'adresse).',
      default: 'Sois prévenu des nouveaux messages et des appels.',
      unsupported: 'Ce navigateur ne gère pas les notifications.',
    }[perm];
    box.replaceChildren(...[
      icon('bell'),
      h('span', { class: 'setting-txt' },
        h('b', { text: 'Notifications' }),
        h('small', { text: text + (perm === 'unsupported' ? '' : ' Elles arrivent tant que message-me est ouvert, même en arrière-plan.') })),
      perm === 'default'
        ? h('button', {
          class: 'btn primary sm', type: 'button',
          onclick: () => enableNotifications().then(draw),
        }, 'Activer')
        : null,
    ].filter(Boolean));
  };
  draw();
  return box;
}

/* Ouvre la clé privée avec le mot de passe actuel (vérifié par Firebase). */
async function unsealWithPassword(password) {
  if (hasPassword()) {
    try {
      await reauthenticate(password);
    } catch (err) {
      const code = (err && err.code) || '';
      if (/wrong-password|invalid-credential|invalid-login/.test(code)) throw userError('Mot de passe actuel incorrect.');
      throw err;
    }
  }
  const box = await readKeys();
  if (!box) throw userError('Clé de chiffrement introuvable. Déconnecte-toi puis reconnecte-toi.');
  try {
    return await E2E.unseal(box.byPassword, password);
  } catch {
    throw userError(hasPassword()
      ? 'Ta clé ne s\'ouvre pas avec ce mot de passe. Déconnecte-toi puis reconnecte-toi avec ton code de secours.'
      : 'Mot de passe de chiffrement incorrect.');
  }
}

/* Le mot de passe change dans Firebase, et la clé privée est rescellée avec
   le nouveau : les messages restent lisibles. */
function openChangePassword() {
  const google = !hasPassword();
  const error = formError();
  const current = h('input', { type: 'password', name: 'current', required: true, autocomplete: 'current-password' });
  const next = h('input', { type: 'password', name: 'next', required: true, minlength: 8, autocomplete: 'new-password' });
  const save = h('button', { class: 'btn primary', type: 'submit' }, 'Changer');
  const form = h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      showError(error, '');
      busy(save, async () => {
        if (next.value.length < 8) throw userError('Nouveau mot de passe trop court : 8 caractères minimum.');
        const pkcs8 = await unsealWithPassword(current.value);
        const byPassword = await E2E.seal(pkcs8, next.value, E2E.PASSWORD_ITERATIONS);
        if (!google) await A.updatePassword(auth.currentUser, next.value);
        await F.updateDoc(F.doc(db, 'keys', me()), { byPassword, updatedAt: F.serverTimestamp() });
        toast(google ? 'Mot de passe de chiffrement changé.' : 'Mot de passe changé.', 'success');
        dlg.close();
      }).catch((err) => showError(error, err.userMessage || describe(err)));
    },
  },
  field(google ? 'Mot de passe de chiffrement actuel' : 'Mot de passe actuel', current),
  field(google ? 'Nouveau mot de passe de chiffrement' : 'Nouveau mot de passe', next, '8 caractères minimum.'),
  error,
  h('div', { class: 'row-actions end' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
    save));
  const dlg = modal(google ? 'Mot de passe de chiffrement' : 'Changer de mot de passe', form);
  current.focus();
}

/* Remplace le code de secours (l'ancien cesse de fonctionner). */
function openNewRecoveryCode() {
  const error = formError();
  const password = h('input', { type: 'password', name: 'password', required: true, autocomplete: 'current-password' });
  const go = h('button', { class: 'btn primary', type: 'submit' }, 'Générer');
  const body = h('div', {});
  const form = h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      showError(error, '');
      busy(go, async () => {
        const pkcs8 = await unsealWithPassword(password.value);
        const code = E2E.newRecoveryCode();
        const byRecovery = await E2E.seal(pkcs8, E2E.normalizeRecoveryCode(code), E2E.RECOVERY_ITERATIONS);
        await F.updateDoc(F.doc(db, 'keys', me()), { byRecovery, updatedAt: F.serverTimestamp() });
        body.replaceChildren(
          h('p', { class: 'lead', text: 'Voici ton nouveau code. L\'ancien ne fonctionne plus.' }),
          recoveryPanel(code, () => dlg.close()));
      }).catch((err) => showError(error, err.userMessage || describe(err)));
    },
  },
  h('p', { text: 'Un nouveau code de secours remplace l\'ancien. Confirme avec ton ' +
    (hasPassword() ? 'mot de passe.' : 'mot de passe de chiffrement.') }),
  field(hasPassword() ? 'Mot de passe' : 'Mot de passe de chiffrement', password),
  error,
  h('div', { class: 'row-actions end' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
    go));
  body.append(form);
  const dlg = modal('Nouveau code de secours', body);
  password.focus();
}

start();
