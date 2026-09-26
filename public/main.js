// message-me — messagerie en temps réel sur Firebase (Auth + Firestore).
//
// Le site est statique : tout s'exécute dans le navigateur. Firebase
// Authentication gère les comptes, Cloud Firestore stocke les profils, les
// conversations et les messages, et les règles de firestore.rules décident qui
// a le droit de lire et d'écrire quoi. Les écritures de ce fichier doivent
// donc correspondre exactement à ce que ces règles acceptent.
//
// Les messages, photos et messages vocaux sont chiffrés de bout en bout
// avant de partir (voir e2e.js) : Firestore ne reçoit jamais leur contenu en
// clair. Les appels passent directement d'un navigateur à l'autre (calls.js).
import * as appConfig from './firebase-config.js';
import * as E2E from './e2e.js';
import * as Media from './media.js';
import * as Notify from './notify.js';
import { callsSupported, createCalls } from './calls.js';

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
  return h('span', {
    class: 'avatar ' + extra,
    style: '--hue:' + hue(seed),
    'aria-hidden': 'true',
    text: initials(label),
  });
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
  authMode: 'login',
};

const people = new Map();   // uid -> { name, username, publicKey } | 'pending'
const drafts = new Map();   // brouillon par conversation
const markedRead = new Map(); // cid -> id du dernier message déjà marqué lu
const plain = new Map();    // 'cid/mid' -> { state, kind, text, payload } (voir content())
const decrypting = new Map(); // 'cid/mid' -> déchiffrement en cours
const mediaUrls = new Map(); // 'cid/mid' -> Promise de l'URL locale du fichier déchiffré
const rowCache = new Map();  // mid -> { sig, node } : lignes déjà dessinées de la conversation ouverte
const typingSeen = new Map(); // 'cid/uid' -> dernier signal de saisie reçu
const typingUntil = new Map(); // 'cid/uid' -> fin d'affichage de « … écrit »
const lastSeenMsg = new Map(); // cid -> dernier message déjà signalé (notifications)
const announcedCalls = new Set();
const unsub = { profile: null, convs: null, msgs: null };
let convsInit = false;
let calls = null;           // appels (calls.js), si le navigateur les gère
let callLayer = null;       // écran d'appel
let endedCall = null;       // appel qui vient de se terminer (écran de fin)
let unsubPlayer = null;
let lastTypingSent = 0;
let pendingProfile = null;  // pseudo choisi à l'inscription, réservé dès la connexion
let claiming = false;
let ui = null;              // éléments de l'interface principale

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
  vault = null;
  recoveryToShow = null;
  ui = null;
  document.title = 'message-me';
}

const me = () => (state.user ? state.user.uid : null);

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
  });
}

async function fetchPerson(uid) {
  const snap = await F.getDoc(F.doc(db, 'users', uid));
  const p = snap.exists() ? snap.data() : { name: 'Compte inconnu', username: '' };
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
     kind  : 'text' | 'image' | 'audio' | 'call'
   Déchiffre à la demande et redessine ensuite. */
const LOCKED = { state: 'error', kind: 'text', text: '' };
const RICH_KINDS = ['image', 'audio', 'call'];

function readPayload(v, raw) {
  if (v !== 2) return { state: 'ok', kind: 'text', text: raw };
  try {
    const p = JSON.parse(raw);
    if (p && RICH_KINDS.includes(p.t)) {
      return { state: 'ok', kind: p.t, text: typeof p.caption === 'string' ? p.caption : '', payload: p };
    }
  } catch {
    // Enveloppe illisible.
  }
  return LOCKED;
}

function decryptContent(cid, m) {
  if (typeof m.text === 'string') return Promise.resolve({ state: 'legacy', kind: 'text', text: m.text });
  const key = cid + '/' + m.id;
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
  if (typeof m.text === 'string') return { state: 'legacy', kind: 'text', text: m.text };
  const key = cid + '/' + m.id;
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

/* Résumé d'une ligne : aperçu de la liste, notifications. */
function summary(c, mine) {
  if (c.state === 'pending') return '…';
  if (c.state === 'error') return '🔒 Message illisible';
  if (c.kind === 'image') return '📷 Photo' + (c.text ? ' · ' + c.text : '');
  if (c.kind === 'audio') return '🎤 Message vocal (' + Media.formatDuration(c.payload.duration) + ')';
  if (c.kind === 'call') return '📞 ' + callLabel(c.payload, mine);
  return c.text;
}

/* Type du fichier, choisi par l'expéditeur : seuls des formats d'image et de
   son inoffensifs sont gardés. Une « photo » en text/html ou image/svg+xml,
   ouverte dans un onglet, exécuterait du code sur ce site. */
const SAFE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  audio: ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/aac', 'audio/wav', 'audio/x-m4a'],
};

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
  return conv.members.filter((uid) => uid !== me() && (typingUntil.get(conv.id + '/' + uid) || 0) > now);
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

/* ======================================================================== */
/* Démarrage                                                                */
/* ======================================================================== */

async function start() {
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
  db = F.getFirestore(app);
  if (emulate) {
    A.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    F.connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  A.onAuthStateChanged(auth, onAuth);
  window.addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', () => markRead(activeConv()));
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
  window.addEventListener('pagehide', () => { if (calls) calls.hangUp(); });
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
      renderOnboarding();
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
        if (!secret) { renderUnlock('setup'); return; }
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
  login ? h('button', { class: 'linkish', type: 'button', onclick: forgot }, 'Mot de passe oublié ?') : null);

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
      await A.createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
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
  const error = formError();
  const recovery = mode === 'changed';
  const input = recovery
    ? h('input', {
      name: 'code', required: true, autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false',
      class: 'mono', placeholder: 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX',
    })
    : h('input', { type: 'password', name: 'password', required: true, autocomplete: 'current-password' });
  const submit = h('button', { class: 'btn primary block', type: 'submit' },
    mode === 'setup' ? 'Activer le chiffrement' : 'Déverrouiller');

  const copy = {
    password: ['Déverrouille tes messages',
      'Tes messages sont chiffrés. Sur cet appareil, entre ton mot de passe pour les lire.'],
    changed: ['Ton mot de passe a changé',
      'Pour relire tes messages chiffrés, entre le code de secours que tu as noté à l\'inscription.'],
    setup: ['Active le chiffrement',
      'message-me chiffre désormais les messages de bout en bout. Entre ton mot de passe pour créer ta clé.'],
  }[mode];

  async function unlock() {
    if (mode === 'changed') {
      if (!E2E.isRecoveryCodeShaped(input.value)) throw userError('Le code de secours compte 24 caractères, par groupes de 4.');
      let pkcs8;
      try {
        pkcs8 = await E2E.unseal(box.byRecovery, E2E.normalizeRecoveryCode(input.value));
      } catch {
        throw userError('Code de secours incorrect.');
      }
      // La clé est rescellée avec le nouveau mot de passe.
      const byPassword = await E2E.seal(pkcs8, secret, E2E.PASSWORD_ITERATIONS);
      await F.updateDoc(F.doc(db, 'keys', me()), { byPassword, updatedAt: F.serverTimestamp() });
      await adoptPkcs8(pkcs8, box.publicKey);
      toast('Messages déverrouillés.', 'success');
    } else {
      const password = input.value;
      if (!password) throw userError('Indique ton mot de passe.');
      if (mode === 'password' && await tryPassword(box, password)) {
        // Rien d'autre à faire.
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
  field(recovery ? 'Code de secours' : 'Mot de passe', input),
  error,
  submit);

  mount(h('div', { class: 'center' }, h('div', { class: 'card narrow' },
    logo(),
    h('p', { class: 'kicker', text: '🔒 Chiffrement de bout en bout' }),
    h('h1', { text: copy[0] }),
    h('p', { class: 'lead', text: copy[1] }),
    form,
    h('div', { class: 'row-actions' },
      recovery ? h('button', { class: 'linkish', type: 'button', onclick: lostCode }, 'J\'ai perdu mon code') : null,
      h('button', { class: 'linkish', type: 'button', onclick: logout }, 'Se déconnecter')))));
  input.focus();

  function lostCode() {
    const confirmBtn = h('button', { class: 'btn primary', type: 'button' }, 'Créer une nouvelle clé');
    const err = formError();
    const dlg = modal('Code de secours perdu', h('div', { class: 'form' },
      h('p', { text: 'Sans ce code, personne ne peut déchiffrer tes anciens messages : ils resteront illisibles pour toi.' }),
      h('p', { text: 'Tu peux créer une nouvelle clé pour continuer à discuter. Les nouveaux messages seront lisibles normalement.' }),
      err,
      h('div', { class: 'row-actions end' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
        confirmBtn)));
    confirmBtn.addEventListener('click', () => {
      busy(confirmBtn, async () => {
        await writeNewKeys(secret);
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
          'aria-label': 'Nouvelle conversation', onclick: openNewConversation,
        }, icon('plus'))),
      h('div', { class: 'side-search' }, icon('search'), search),
      ui.notice,
      ui.list,
      ui.me),
    ui.chat);
  mount(ui.shell);
  renderMe();
  renderNotice();
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
      onError: (err) => {
        if (err && err.code === 'permission-denied') {
          toast('Les appels demandent les nouvelles règles Firestore : republie firestore.rules (guide, étape 4).', 'error');
        }
      },
    });
    calls.watch();
  }

  unsub.convs = F.onSnapshot(
    F.query(F.collection(db, 'conversations'), F.where('members', 'array-contains', me())),
    (snap) => {
      state.convs = snap.docs
        .map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))
        .sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
      state.convsReady = true;
      ensurePeople(new Set(state.convs.flatMap((c) => c.members)));
      trackActivity();
      renderConvList();
      renderChatHead();
      renderMessages();
      markRead(activeConv());
      updateTitle();
    },
    (err) => toast(describe(err), 'error'));

  route(true);
}

function renderMe() {
  if (!ui || !state.profile) return;
  const p = state.profile;
  ui.me.replaceChildren(
    h('button', { class: 'me-btn', type: 'button', onclick: openProfile, title: 'Mon profil' },
      avatar(p.uid, p.name, 'sm'),
      h('span', { class: 'me-txt' }, h('b', { text: p.name }), h('small', { text: '@' + p.username }))),
    h('button', {
      class: 'btn icon ghost', type: 'button', title: 'Se déconnecter', 'aria-label': 'Se déconnecter',
      onclick: logout,
    }, icon('logout')));
}

/* Invitation à activer les notifications, tant qu'on n'a ni accepté, ni
   refusé, ni fermé l'invitation. */
function renderNotice() {
  if (!ui) return;
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

async function announce(conv, lm) {
  if (!document.hidden) {
    Notify.blip();
    return;
  }
  const c = await decryptContent(conv.id, lm);
  const who = person(lm.uid) || await fetchPerson(lm.uid).catch(() => null);
  const group = conv.type === 'group';
  Notify.notify(group ? conv.title : (who ? who.name : 'message-me'), {
    body: (group && who ? who.name + ' : ' : '') + summary(c, false),
    tag: 'conv-' + conv.id,
    hash: '#/c/' + encodeURIComponent(conv.id),
  });
}

function updateTitle() {
  const n = state.convs.filter(isUnread).length;
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
      h('button', { class: 'btn primary sm', type: 'button', onclick: openNewConversation },
        icon('plus'), 'Écrire à quelqu\'un')));
    return;
  }
  const q = state.filter;
  const items = state.convs.filter((c) => {
    if (!q) return true;
    const hay = [convTitle(c), convSubtitle(c)].join(' ').toLowerCase();
    return hay.includes(q.replace(/^@/, ''));
  });
  if (!items.length) {
    ui.list.replaceChildren(h('p', { class: 'list-note', text: 'Aucune conversation ne correspond.' }));
    return;
  }
  ui.list.replaceChildren(...items.map((c) => {
    const lm = c.lastMessage;
    const unread = isUnread(c);
    let preview = 'Nouvelle conversation';
    const typing = typingText(c);
    if (typing) {
      preview = typing;
    } else if (lm) {
      const p = content(c.id, lm);
      const who = p.kind === 'call' ? ''
        : lm.uid === me() ? 'Toi : '
          : (c.type === 'group' ? ((person(lm.uid) || {}).name || '…') + ' : ' : '');
      preview = who + summary(p, lm.uid === me()).replace(/\s+/g, ' ');
    }
    return h('a', {
      class: 'conv' + (unread ? ' unread' : ''),
      href: '#/c/' + encodeURIComponent(c.id),
      'aria-current': c.id === state.activeId ? 'page' : null,
    },
    convAvatar(c),
    h('span', { class: 'conv-txt' },
      h('span', { class: 'conv-top' },
        h('b', { class: 'conv-title', text: convTitle(c) }),
        h('time', { text: listTime(ts(lm ? lm.at : c.updatedAt)) })),
      h('span', { class: 'conv-bottom' },
        h('span', { class: 'conv-preview' + (typing ? ' typing' : ''), text: preview }),
        unread ? h('span', { class: 'dot', 'aria-label': 'non lu' }) : null)));
  }));
}

function route(initial = false) {
  const m = location.hash.match(/^#\/c\/([^/?#]+)/);
  const id = m ? decodeURIComponent(m[1]) : null;
  if (id !== state.activeId || initial === true) openConversation(id);
}

function openConversation(id) {
  if (!ui) return;
  if (unsub.msgs) unsub.msgs();
  unsub.msgs = null;
  if (ui.composer && state.activeId) drafts.set(state.activeId, ui.composer.querySelector('textarea').value);
  if (ui.composer && ui.composer.cleanup) ui.composer.cleanup();
  if (id !== state.activeId) {
    rowCache.clear();
    Media.player.stop();
  }
  state.activeId = id;
  state.messages = [];
  state.messagesReady = false;
  ui.shell.dataset.view = id ? 'chat' : 'list';
  ui.head = ui.log = ui.logIn = ui.composer = ui.jump = null;
  renderConvList();

  if (!id) {
    ui.chat.replaceChildren(h('div', { class: 'chat-empty' },
      h('span', { class: 'chat-empty-art' }, icon('chats')),
      h('h2', { text: 'Choisis une conversation' }),
      h('p', { text: 'Ou démarres-en une avec le pseudo de quelqu\'un.' }),
      h('button', { class: 'btn primary', type: 'button', onclick: openNewConversation },
        icon('plus'), 'Nouvelle conversation'),
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
  ui.chat.replaceChildren(ui.head, ui.log, ui.jump, ui.composer);
  renderChatHead();
  renderMessages();
  markRead(activeConv());
  if (!coarse) ui.composer.querySelector('textarea').focus();

  unsub.msgs = F.onSnapshot(
    F.query(F.collection(db, 'conversations', id, 'messages'), F.orderBy('createdAt'), F.limitToLast(HISTORY)),
    (snap) => {
      if (state.activeId !== id) return;
      state.messages = snap.docs.map((d) => ({
        id: d.id,
        pending: d.metadata.hasPendingWrites,
        ...d.data({ serverTimestamps: 'estimate' }),
      }));
      state.messagesReady = true;
      ensurePeople(new Set(state.messages.map((m) => m.uid)));
      renderMessages();
    },
    (err) => {
      if (state.activeId !== id || !ui || !ui.logIn) return;
      state.messagesReady = true;
      state.messages = [];
      if (err.code === 'permission-denied') {
        ui.logIn.replaceChildren(h('div', { class: 'log-note' },
          h('h3', { text: 'Conversation introuvable' }),
          h('p', { text: 'Elle n\'existe pas, ou tu n\'en fais pas partie.' }),
          h('a', { class: 'btn ghost sm', href: '#/' }, 'Retour')));
        ui.composer.hidden = true;
      } else {
        toast(describe(err), 'error');
      }
    });
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
  ui.head.replaceChildren(...[back,
    convAvatar(conv),
    h('div', { class: 'chat-id' },
      h('b', { text: convTitle(conv) }),
      h('small', { text: convSubtitle(conv) })),
    conv.type !== 'group' && calls ? h('button', {
      class: 'btn icon ghost', type: 'button', title: 'Appel vocal', 'aria-label': 'Appel vocal',
      onclick: () => startCall(conv, false),
    }, icon('phone')) : null,
    conv.type !== 'group' && calls ? h('button', {
      class: 'btn icon ghost', type: 'button', title: 'Appel vidéo', 'aria-label': 'Appel vidéo',
      onclick: () => startCall(conv, true),
    }, icon('video')) : null,
    conv.type === 'group'
      ? h('button', {
        class: 'btn icon ghost', type: 'button', title: 'Quitter le groupe', 'aria-label': 'Quitter le groupe',
        onclick: () => leaveGroup(conv),
      }, icon('leave'))
      : null].filter(Boolean));
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
  if (!ui || !ui.logIn) return;
  const conv = activeConv();
  const cid = state.activeId;
  const log = ui.log;
  const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 120;
  const firstPaint = !ui.logIn.dataset.painted;

  if (!state.messagesReady) {
    ui.logIn.replaceChildren(h('p', { class: 'log-hint', text: 'Chargement des messages…' }));
    return;
  }
  if (!state.messages.length) {
    const text = conv && conv.type === 'group'
      ? 'Le groupe « ' + conv.title + ' » est créé. Lance la discussion !'
      : 'Dis bonjour 👋';
    ui.logIn.replaceChildren(...[h('p', { class: 'log-hint', text }), typingRow(conv)].filter(Boolean));
    ui.logIn.dataset.painted = '1';
    return;
  }

  const group = conv && conv.type === 'group';
  const msgs = state.messages.map((m) => ({ ...m, t: ts(m.createdAt) || Date.now(), c: content(cid, m) }));
  msgs.sort((a, b) => a.t - b.t);

  // Dernier de mes messages lu par l'autre personne (discussion à deux).
  let seenId = null;
  if (conv && !group) {
    const other = otherUid(conv);
    const readAt = conv.lastRead ? ts(conv.lastRead[other]) : 0;
    const mine = msgs.filter((m) => m.uid === me() && m.c.kind !== 'call');
    const lastMine = mine[mine.length - 1];
    if (lastMine && !lastMine.pending && readAt && readAt >= lastMine.t) seenId = lastMine.id;
  }

  const nodes = [h('p', { class: 'log-hint e2e', text:
    '🔒 Messages, photos et messages vocaux sont chiffrés de bout en bout.' })];
  if (state.messages.length >= HISTORY) {
    nodes.push(h('p', { class: 'log-hint', text: 'Seuls les ' + HISTORY + ' derniers messages sont affichés.' }));
  }
  // Deux messages forment un bloc s'ils viennent de la même personne, le même
  // jour, à moins de RUN_GAP d'écart ; un journal d'appel coupe les blocs.
  const joins = (a, b) => a && b && a.uid === b.uid && a.c.kind !== 'call' && b.c.kind !== 'call'
    && Math.abs(b.t - a.t) <= RUN_GAP && startOfDay(a.t) === startOfDay(b.t);
  let prevDay = null;
  msgs.forEach((m, i) => {
    const day = startOfDay(m.t);
    if (day !== prevDay) {
      nodes.push(h('p', { class: 'day' }, h('span', { text: dayLabel(m.t) })));
      prevDay = day;
    }
    const author = person(m.uid);
    const f = {
      first: !joins(msgs[i - 1], m),
      last: !joins(m, msgs[i + 1]),
      mine: m.uid === me(),
      group,
      seen: m.id === seenId,
    };
    const sig = [m.c.state, m.c.kind, m.c.text, f.first, f.last, f.mine, group, f.seen, m.pending,
      fmtTime.format(m.t), author ? author.name : ''].join('\u0001');
    let hit = rowCache.get(m.id);
    if (!hit || hit.sig !== sig) {
      hit = { sig, node: messageRow(cid, conv, m, m.c, f, author) };
      rowCache.set(m.id, hit);
    }
    nodes.push(hit.node);
  });
  const typing = typingRow(conv);
  if (typing) nodes.push(typing);
  ui.logIn.replaceChildren(...nodes);
  ui.logIn.dataset.painted = '1';
  updateVoice(Media.player.state());

  const lastMsg = msgs[msgs.length - 1];
  const grew = ui.logIn.dataset.lastId !== lastMsg.id;
  ui.logIn.dataset.lastId = lastMsg.id;
  if (firstPaint || nearBottom || (lastMsg.uid === me() && lastMsg.pending)) {
    log.scrollTop = log.scrollHeight;
  } else if (grew && ui.jump) {
    ui.jump.classList.add('fresh');
  }
  updateJump();
}

function messageRow(cid, conv, m, c, f, author) {
  if (c.kind === 'call' && c.state === 'ok') {
    const p = c.payload;
    const missed = p.status !== 'ended';
    return h('div', { class: 'msg system' },
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
  if (readable && c.kind === 'image') {
    bubble = photoBubble(cid, m, c);
  } else if (readable && c.kind === 'audio') {
    bubble = voiceBubble(cid, m, c);
  } else {
    bubble = h('div', {
      class: 'bubble' + (readable && EMOJI_ONLY.test(c.text) ? ' emoji' : '') + (readable ? '' : ' locked'),
      title: c.state === 'error'
        ? 'Ce message a été chiffré pour une ancienne clé de ton compte.'
        : fmtTime.format(m.t) + (c.state === 'legacy' ? ' · envoyé avant le chiffrement' : ''),
    }, c.state === 'pending' ? 'Déchiffrement…' : c.state === 'error' ? '🔒 Message illisible' : richText(c.text));
  }

  return h('div', {
    class: 'msg ' + (f.mine ? 'mine' : 'theirs') + (f.first ? ' first' : '') + (f.last ? ' last' : '') +
      (m.pending ? ' pending' : ''),
  },
  f.group && !f.mine ? (f.last ? avatar(m.uid, author ? author.name : '?', 'xs') : h('span', { class: 'avatar-gap' })) : null,
  h('div', { class: 'msg-body' },
    f.group && !f.mine && f.first ? h('span', { class: 'author', text: author ? author.name : '…' }) : null,
    bubble,
    f.last ? h('span', { class: 'meta' },
      m.pending ? 'Envoi…' : fmtTime.format(m.t),
      f.seen ? ' · Vu' : '') : null));
}

function photoBubble(cid, m, c) {
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
  return h('div', { class: 'bubble media' }, frame, c.text ? h('p', { class: 'caption' }, richText(c.text)) : null);
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
  if (!far) ui.jump.classList.remove('fresh');
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
  const picker = h('input', { type: 'file', accept: 'image/*', hidden: true, 'aria-hidden': 'true', tabindex: -1 });
  const attachBtn = h('button', {
    class: 'btn icon ghost attach', type: 'button', 'aria-label': 'Joindre une photo', title: 'Photo',
    onclick: () => picker.click(),
  }, icon('image'));
  const tray = h('div', { class: 'tray', hidden: true });
  const row = h('div', { class: 'composer-row' }, attachBtn, picker, ta, count, send, mic);
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

  let attached = null; // { blob, w, h, mime, url }
  let recorder = null;
  let recTimer = null;

  function sync() {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 168) + 'px';
    const left = MAX_TEXT - ta.value.length;
    count.textContent = left < 200 ? String(left) : '';
    const ready = Boolean(ta.value.trim()) || Boolean(attached);
    send.disabled = !ready;
    send.hidden = voice && !ready;
    mic.hidden = !voice || ready;
  }

  function clearAttachment(revoke = true) {
    if (attached && revoke) URL.revokeObjectURL(attached.url);
    attached = null;
    tray.hidden = true;
    tray.replaceChildren();
    ta.placeholder = 'Écris un message…';
    sync();
  }

  async function attach(file) {
    try {
      const img = await Media.prepareImage(file);
      clearAttachment();
      attached = { ...img, url: URL.createObjectURL(img.blob) };
      tray.replaceChildren(
        h('img', { src: attached.url, alt: '' }),
        h('span', { class: 'tray-txt' },
          h('b', { text: 'Photo' }),
          h('small', { text: img.w + ' × ' + img.h + ' · ' + Media.formatBytes(img.blob.size) + ' · chiffrée à l\'envoi' })),
        h('button', {
          class: 'btn icon ghost', type: 'button', 'aria-label': 'Retirer la photo',
          onclick: () => clearAttachment(),
        }, icon('close')));
      tray.hidden = false;
      ta.placeholder = 'Ajoute une légende…';
      sync();
      ta.focus();
    } catch (err) {
      toast(describe(err), 'error');
    }
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
    try {
      const v = await r.stop();
      const url = URL.createObjectURL(v.blob);
      await sendRich(cid, { t: 'audio', mime: v.mime, duration: v.duration, wave: v.wave, size: v.blob.size }, v.blob, url);
    } catch (err) {
      toast('Message vocal non envoyé : ' + (err.userMessage || describe(err)), 'error');
    }
  }

  const form = h('form', {
    class: 'composer',
    onsubmit: (e) => {
      e.preventDefault();
      const text = ta.value.trim();
      lastTypingSent = 0;
      if (attached) {
        const a = attached;
        ta.value = '';
        drafts.delete(cid);
        clearAttachment(false); // l'URL locale sert à afficher la photo pendant l'envoi
        sendRich(cid, { t: 'image', caption: text, mime: a.mime, w: a.w, h: a.h, size: a.blob.size }, a.blob, a.url)
          .catch((err) => toast('Photo non envoyée : ' + (err.userMessage || describe(err)), 'error'));
        return;
      }
      if (!text) return;
      ta.value = '';
      drafts.delete(cid);
      sync();
      sendMessage(cid, text).catch((err) => {
        toast('Message non envoyé : ' + (err.userMessage || describe(err)), 'error');
        if (!ta.value) { ta.value = text; sync(); }
      });
    },
  }, tray, row, recBar);

  ta.addEventListener('input', () => {
    sync();
    signalTyping(cid, ta.value);
  });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !coarse) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  ta.addEventListener('paste', (e) => {
    const file = [...(e.clipboardData ? e.clipboardData.files : [])].find((f) => /^image\//.test(f.type));
    if (!file) return;
    e.preventDefault();
    attach(file);
  });
  picker.addEventListener('change', () => {
    if (picker.files[0]) attach(picker.files[0]);
    picker.value = '';
  });
  mic.addEventListener('click', startRecording);
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && recorder) finishRecording(false);
  });
  form.attach = attach;
  form.cleanup = () => {
    if (recorder) recorder.cancel();
    recorder = null;
    clearInterval(recTimer);
    if (attached) URL.revokeObjectURL(attached.url);
    attached = null;
  };
  requestAnimationFrame(sync);
  return form;
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
    const file = [...e.dataTransfer.files].find((f) => /^image\//.test(f.type));
    if (file) ui.composer.attach(file);
    else toast('Seules les photos peuvent être envoyées.', 'info');
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
  const others = conv.members.filter((uid) => uid !== me());
  const fresh = await Promise.all(others.map(fetchPerson));
  others.forEach((uid, i) => {
    const p = fresh[i];
    if (p.publicKey) keys[uid] = p.publicKey;
    else missing.push(p.username ? '@' + p.username : p.name);
  });
  if (missing.length) {
    throw userError(missing.join(', ') + (missing.length > 1 ? ' doivent' : ' doit') +
      ' se reconnecter une fois à message-me pour activer le chiffrement.');
  }
  return keys;
}

/* Le message chiffré, son éventuel fichier chiffré et l'aperçu de la
   conversation partent dans la même écriture groupée : les règles refusent
   l'un sans les autres. */
function commitMessage(cid, msg, enc, media = null) {
  const uid = me();
  const batch = F.writeBatch(db);
  if (media) {
    batch.set(F.doc(db, 'conversations', cid, 'media', msg.id), {
      uid, data: F.Bytes.fromUint8Array(media), createdAt: F.serverTimestamp(),
    });
  }
  batch.set(msg, { uid, enc, createdAt: F.serverTimestamp() });
  batch.update(F.doc(db, 'conversations', cid), {
    lastMessage: { id: msg.id, uid, enc, at: F.serverTimestamp() },
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

async function sendMessage(cid, text) {
  const conv = conversationFor(cid);
  const enc = await E2E.encryptMessage(text, await memberKeys(conv), cid, me());
  const msg = F.doc(F.collection(db, 'conversations', cid, 'messages'));
  plain.set(cid + '/' + msg.id, { state: 'ok', kind: 'text', text });
  return commitMessage(cid, msg, enc);
}

/* Photo, message vocal ou journal d'appel : enveloppe chiffrée (v2). Un
   fichier est chiffré avec sa propre clé, qui ne voyage que dans l'enveloppe. */
async function sendRich(cid, payload, blob = null, localUrl = null) {
  const conv = conversationFor(cid);
  const msg = F.doc(F.collection(db, 'conversations', cid, 'messages'));
  const key = cid + '/' + msg.id;
  let full = payload;
  let media = null;
  if (blob) {
    const box = await E2E.encryptBlob(new Uint8Array(await blob.arrayBuffer()), cid, msg.id);
    full = { ...payload, key: box.key, iv: box.iv };
    media = box.data;
    if (localUrl) mediaUrls.set(key, Promise.resolve(localUrl));
  }
  const enc = await E2E.encryptPayload(full, await memberKeys(conv), cid, me());
  plain.set(key, { state: 'ok', kind: full.t, text: full.caption || '', payload: full });
  scheduleRender();
  return commitMessage(cid, msg, enc, media);
}

function markRead(conv) {
  if (!conv || document.hidden || conv.id !== state.activeId || !isUnread(conv)) return;
  const id = conv.lastMessage.id;
  if (markedRead.get(conv.id) === id) return;
  markedRead.set(conv.id, id);
  F.updateDoc(F.doc(db, 'conversations', conv.id), { ['lastRead.' + me()]: F.serverTimestamp() })
    .catch(() => markedRead.delete(conv.id));
}

async function leaveGroup(conv) {
  if (!window.confirm('Quitter le groupe « ' + conv.title + ' » ? Tu ne verras plus ses messages.')) return;
  if (unsub.msgs) unsub.msgs();
  unsub.msgs = null;
  try {
    await F.updateDoc(F.doc(db, 'conversations', conv.id), { members: F.arrayRemove(me()) });
    toast('Tu as quitté « ' + conv.title + ' ».', 'info');
    location.hash = '#/';
  } catch (err) {
    toast(describe(err), 'error');
    openConversation(conv.id);
  }
}

/* ======================================================================== */
/* Appels                                                                   */
/* ======================================================================== */

async function startCall(conv, video) {
  if (!calls) return;
  if (calls.current) {
    toast('Un appel est déjà en cours.', 'info');
    return;
  }
  Notify.unlockAudio();
  try {
    await calls.start(conv.id, otherUid(conv), video);
  } catch (err) {
    toast('Appel impossible : ' + describe(err), 'error');
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
    setStream(L.localVideo, c.local);
  }
  const remoteVideo = Boolean(c && c.video && c.remote && c.remote.getVideoTracks().length && c.phase !== 'calling');
  const localVideo = Boolean(c && c.local && c.local.getVideoTracks().length && c.camOn);
  L.el.dataset.mode = ring ? 'incoming' : c ? c.phase : 'ended';
  L.el.classList.toggle('has-remote-video', remoteVideo);
  L.el.classList.toggle('has-local-video', localVideo);

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
}

/* ======================================================================== */
/* Fenêtres                                                                 */
/* ======================================================================== */

function modal(title, body) {
  const dlg = h('dialog', { class: 'modal', 'aria-label': title },
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

function openNewConversation() {
  const error = formError();
  const who = h('input', {
    name: 'who', required: true, autocapitalize: 'none', spellcheck: 'false', autocomplete: 'off',
    placeholder: '@pseudo',
  });
  const title = h('input', { name: 'title', maxlength: MAX_TITLE, placeholder: 'ex. Week-end à Lyon' });
  const titleField = field('Nom du groupe (facultatif)', title);
  titleField.hidden = true;
  const submit = h('button', { class: 'btn primary', type: 'submit' }, 'Démarrer');

  const parse = () => [...new Set(who.value.split(/[\s,;]+/).map(normalizeUsername).filter(Boolean))];
  who.addEventListener('input', () => {
    const n = parse().length;
    titleField.hidden = n < 2;
    submit.textContent = n < 2 ? 'Démarrer' : 'Créer le groupe';
  });

  const form = h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      showError(error, '');
      busy(submit, () => createConversation(parse(), title.value.trim()))
        .then((cid) => {
          dlg.close();
          location.hash = '#/c/' + encodeURIComponent(cid);
        })
        .catch((err) => showError(error, err.userMessage || describe(err)));
    },
  },
  field('Avec qui ?', who, 'Un pseudo pour une discussion à deux, plusieurs (séparés par des espaces) pour un groupe.'),
  titleField,
  error,
  h('div', { class: 'row-actions end' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
    submit),
  h('p', { class: 'fineprint' }, 'Ton pseudo : ', h('b', { text: '@' + state.profile.username }),
    ' — partage-le pour qu\'on puisse t\'écrire.'));

  const dlg = modal('Nouvelle conversation', form);
  who.focus();
}

async function createConversation(usernames, title) {
  const fail = (message) => Object.assign(new Error(message), { userMessage: message });
  const self = state.profile.username;
  const wanted = usernames.filter((u) => u !== self);
  if (!wanted.length) {
    throw fail(usernames.length ? 'Tu ne peux pas t\'écrire à toi-même : indique le pseudo de quelqu\'un d\'autre.'
      : 'Indique au moins un pseudo.');
  }
  const bad = wanted.find((u) => !USERNAME_RE.test(u));
  if (bad) throw fail('« ' + bad + ' » n\'est pas un pseudo valide.');
  if (wanted.length + 1 > MAX_MEMBERS) throw fail('Un groupe compte au plus ' + MAX_MEMBERS + ' membres.');

  const snaps = await Promise.all(wanted.map((u) => F.getDoc(F.doc(db, 'usernames', u))));
  const missing = wanted.filter((u, i) => !snaps[i].exists());
  if (missing.length) {
    throw fail((missing.length > 1 ? 'Pseudos introuvables : ' : 'Pseudo introuvable : ') +
      missing.map((u) => '@' + u).join(', ') + '.');
  }
  const uids = snaps.map((s) => s.data().uid);
  const uid = me();
  const base = {
    createdBy: uid,
    createdAt: F.serverTimestamp(),
    updatedAt: F.serverTimestamp(),
    lastMessage: null,
    lastRead: {},
  };

  if (uids.length === 1) {
    const members = [uid, uids[0]].sort();
    const cid = 'dm_' + members.join('_');
    if (state.convs.some((c) => c.id === cid)) return cid;
    const ref = F.doc(db, 'conversations', cid);
    try {
      await F.setDoc(ref, { ...base, type: 'dm', members, title: '' });
    } catch (err) {
      // Elle existe déjà (la liste n'était pas encore chargée) : on l'ouvre.
      const existing = err.code === 'permission-denied' ? await F.getDoc(ref).catch(() => null) : null;
      if (!existing || !existing.exists()) throw err;
    }
    return cid;
  }

  const names = await Promise.all(uids.map(async (u) => {
    const s = await F.getDoc(F.doc(db, 'users', u));
    const p = s.exists() ? s.data() : { name: '?', username: '' };
    people.set(u, p);
    return p.name;
  }));
  let groupTitle = title;
  if (!groupTitle) {
    const all = [state.profile.name, ...names];
    groupTitle = all.length > 3 ? all.slice(0, 3).join(', ') + ' et ' + (all.length - 3) + ' autres'
      : all.join(', ');
  }
  groupTitle = [...groupTitle].slice(0, MAX_TITLE).join('');
  const ref = F.doc(F.collection(db, 'conversations'));
  await F.setDoc(ref, { ...base, type: 'group', members: [uid, ...uids], title: groupTitle });
  return ref.id;
}

function openProfile() {
  const p = state.profile;
  const error = formError();
  const name = h('input', { name: 'name', required: true, maxlength: MAX_NAME, value: p.name });
  const save = h('button', { class: 'btn primary', type: 'submit' }, 'Enregistrer');
  const form = h('form', {
    class: 'form', novalidate: true,
    onsubmit: (e) => {
      e.preventDefault();
      const n = name.value.trim();
      if (!n || n.length > MAX_NAME) return showError(error, 'Le nom affiché fait entre 1 et 40 caractères.');
      showError(error, '');
      busy(save, () => F.updateDoc(F.doc(db, 'users', p.uid), { name: n }))
        .then(() => { toast('Profil mis à jour.', 'success'); dlg.close(); })
        .catch((err) => showError(error, describe(err)));
    },
  },
  h('div', { class: 'profile-id' },
    avatar(p.uid, p.name, 'lg'),
    h('div', {},
      h('b', { text: '@' + p.username }),
      h('small', { text: state.user.email || '' }))),
  h('div', { class: 'row-actions' },
    h('button', {
      class: 'btn ghost sm', type: 'button',
      onclick: () => navigator.clipboard.writeText('@' + p.username)
        .then(() => toast('Pseudo copié.', 'success'))
        .catch(() => toast('Copie impossible : ton pseudo est @' + p.username, 'info')),
    }, icon('copy'), 'Copier mon pseudo'),
    h('button', {
      class: 'btn ghost sm', type: 'button', onclick: () => { dlg.close(); openChangePassword(); },
    }, icon('mail'), 'Changer de mot de passe'),
    h('button', {
      class: 'btn ghost sm', type: 'button', onclick: () => { dlg.close(); openNewRecoveryCode(); },
    }, 'Nouveau code de secours')),
  h('p', { class: 'fineprint', text: '🔒 Tes messages, photos et messages vocaux sont chiffrés de bout en bout.' }),
  notificationsSetting(),
  field('Nom affiché', name),
  error,
  h('div', { class: 'row-actions end' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { dlg.close(); logout(); } },
      icon('logout'), 'Se déconnecter'),
    save));

  const dlg = modal('Mon profil', form);
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
    box.replaceChildren(
      icon('bell'),
      h('span', { class: 'setting-txt' },
        h('b', { text: 'Notifications' }),
        h('small', { text: text + (perm === 'unsupported' ? '' : ' Elles arrivent tant que message-me est ouvert, même en arrière-plan.') })),
      perm === 'default'
        ? h('button', {
          class: 'btn primary sm', type: 'button',
          onclick: () => enableNotifications().then(draw),
        }, 'Activer')
        : null);
  };
  draw();
  return box;
}

/* Ouvre la clé privée avec le mot de passe actuel (vérifié par Firebase). */
async function unsealWithPassword(password) {
  try {
    await reauthenticate(password);
  } catch (err) {
    const code = (err && err.code) || '';
    if (/wrong-password|invalid-credential|invalid-login/.test(code)) throw userError('Mot de passe actuel incorrect.');
    throw err;
  }
  const box = await readKeys();
  if (!box) throw userError('Clé de chiffrement introuvable. Déconnecte-toi puis reconnecte-toi.');
  try {
    return await E2E.unseal(box.byPassword, password);
  } catch {
    throw userError('Ta clé ne s\'ouvre pas avec ce mot de passe. Déconnecte-toi puis reconnecte-toi avec ton code de secours.');
  }
}

/* Le mot de passe change dans Firebase, et la clé privée est rescellée avec
   le nouveau : les messages restent lisibles. */
function openChangePassword() {
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
        await A.updatePassword(auth.currentUser, next.value);
        await F.updateDoc(F.doc(db, 'keys', me()), { byPassword, updatedAt: F.serverTimestamp() });
        toast('Mot de passe changé.', 'success');
        dlg.close();
      }).catch((err) => showError(error, err.userMessage || describe(err)));
    },
  },
  field('Mot de passe actuel', current),
  field('Nouveau mot de passe', next, '8 caractères minimum.'),
  error,
  h('div', { class: 'row-actions end' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
    save));
  const dlg = modal('Changer de mot de passe', form);
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
  h('p', { text: 'Un nouveau code de secours remplace l\'ancien. Confirme avec ton mot de passe.' }),
  field('Mot de passe', password),
  error,
  h('div', { class: 'row-actions end' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Annuler'),
    go));
  body.append(form);
  const dlg = modal('Nouveau code de secours', body);
  password.focus();
}

start();
