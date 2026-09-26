// message-me — messagerie en temps réel sur Firebase (Auth + Firestore).
//
// Le site est statique : tout s'exécute dans le navigateur. Firebase
// Authentication gère les comptes, Cloud Firestore stocke les profils, les
// conversations et les messages, et les règles de firestore.rules décident qui
// a le droit de lire et d'écrire quoi. Les écritures de ce fichier doivent
// donc correspondre exactement à ce que ces règles acceptent.
import { firebaseConfig } from './firebase-config.js';

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
  const code = (err && err.code) || '';
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

const people = new Map();   // uid -> { name, username } | 'pending'
const drafts = new Map();   // brouillon par conversation
const markedRead = new Map(); // cid -> id du dernier message déjà marqué lu
const unsub = { profile: null, convs: null, msgs: null };
let pendingProfile = null;  // pseudo choisi à l'inscription, réservé dès la connexion
let claiming = false;
let ui = null;              // éléments de l'interface principale

function teardown() {
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

function ensurePeople(uids) {
  for (const uid of uids) {
    if (people.has(uid)) continue;
    people.set(uid, 'pending');
    F.getDoc(F.doc(db, 'users', uid))
      .then((snap) => {
        people.set(uid, snap.exists() ? snap.data() : { name: 'Compte inconnu', username: '' });
      })
      .catch(() => people.delete(uid))
      .finally(scheduleRender);
  }
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
      if (state.screen !== 'main') {
        startMain();
      } else {
        renderMe();
        scheduleRender();
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
   règles refusent l'un sans l'autre, et refusent un pseudo déjà pris. */
async function claimProfile({ name, username }) {
  claiming = true;
  try {
    const uid = me();
    const batch = F.writeBatch(db);
    batch.set(F.doc(db, 'usernames', username), { uid });
    batch.set(F.doc(db, 'users', uid), { name, username, createdAt: F.serverTimestamp() });
    await batch.commit();
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
  }
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
    await A.signInWithEmailAndPassword(auth, email.value.trim(), password.value);
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
    try {
      await A.createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
    } catch (err) {
      pendingProfile = null;
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
      toast('Si un compte existe pour ' + address + ', un e-mail de réinitialisation vient de partir.', 'success');
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
        'Les messages sont stockés dans Firebase et protégés par des règles d\'accès ; ' +
        'ils ne sont pas chiffrés de bout en bout.' })),
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
    h('button', { class: 'linkish', type: 'button', onclick: () => A.signOut(auth) }, 'Se déconnecter'))));

  if (err) {
    showError(error, err.code === 'username-taken'
      ? '@' + prefill.username + ' est déjà pris, choisis un autre pseudo.'
      : describe(err));
  }
  (prefill.name ? username : name).focus();
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
    me: h('div', { class: 'me' }),
    chat: h('main', { class: 'chat' }),
    search,
    head: null,
    log: null,
    logIn: null,
    composer: null,
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
      ui.list,
      ui.me),
    ui.chat);
  mount(ui.shell);
  renderMe();
  renderConvList();

  unsub.convs = F.onSnapshot(
    F.query(F.collection(db, 'conversations'), F.where('members', 'array-contains', me())),
    (snap) => {
      state.convs = snap.docs
        .map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))
        .sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
      state.convsReady = true;
      ensurePeople(new Set(state.convs.flatMap((c) => c.members)));
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
    if (lm) {
      const who = lm.uid === me() ? 'Toi : '
        : (c.type === 'group' ? ((person(lm.uid) || {}).name || '…') + ' : ' : '');
      preview = who + lm.text.replace(/\s+/g, ' ');
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
        h('span', { class: 'conv-preview', text: preview }),
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
  state.activeId = id;
  state.messages = [];
  state.messagesReady = false;
  ui.shell.dataset.view = id ? 'chat' : 'list';
  ui.head = ui.log = ui.logIn = ui.composer = null;
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
  ui.composer = buildComposer(id);
  ui.chat.replaceChildren(ui.head, ui.log, ui.composer);
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
    conv.type === 'group'
      ? h('button', {
        class: 'btn icon ghost', type: 'button', title: 'Quitter le groupe', 'aria-label': 'Quitter le groupe',
        onclick: () => leaveGroup(conv),
      }, icon('leave'))
      : null].filter(Boolean));
}

function renderMessages() {
  if (!ui || !ui.logIn) return;
  const conv = activeConv();
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
    ui.logIn.replaceChildren(h('p', { class: 'log-hint', text }));
    ui.logIn.dataset.painted = '1';
    return;
  }

  const group = conv && conv.type === 'group';
  const msgs = state.messages.map((m) => ({ ...m, t: ts(m.createdAt) || Date.now() }));
  msgs.sort((a, b) => a.t - b.t);

  // Dernier de mes messages lu par l'autre personne (discussion à deux).
  let seenId = null;
  if (conv && !group) {
    const other = otherUid(conv);
    const readAt = conv.lastRead ? ts(conv.lastRead[other]) : 0;
    const mine = msgs.filter((m) => m.uid === me());
    const lastMine = mine[mine.length - 1];
    if (lastMine && !lastMine.pending && readAt && readAt >= lastMine.t) seenId = lastMine.id;
  }

  const nodes = [];
  if (state.messages.length >= HISTORY) {
    nodes.push(h('p', { class: 'log-hint', text: 'Seuls les ' + HISTORY + ' derniers messages sont affichés.' }));
  }
  let prevDay = null;
  msgs.forEach((m, i) => {
    const day = startOfDay(m.t);
    if (day !== prevDay) {
      nodes.push(h('p', { class: 'day' }, h('span', { text: dayLabel(m.t) })));
      prevDay = day;
    }
    const prev = msgs[i - 1];
    const next = msgs[i + 1];
    const first = !prev || prev.uid !== m.uid || m.t - prev.t > RUN_GAP || startOfDay(prev.t) !== day;
    const last = !next || next.uid !== m.uid || next.t - m.t > RUN_GAP || startOfDay(next.t) !== day;
    const mine = m.uid === me();
    const author = person(m.uid);
    const bubble = h('div', {
      class: 'bubble' + (EMOJI_ONLY.test(m.text) ? ' emoji' : ''),
      title: fmtTime.format(m.t),
    }, richText(m.text));

    const row = h('div', {
      class: 'msg ' + (mine ? 'mine' : 'theirs') + (first ? ' first' : '') + (last ? ' last' : '') +
        (m.pending ? ' pending' : ''),
    },
    group && !mine ? (last ? avatar(m.uid, author ? author.name : '?', 'xs') : h('span', { class: 'avatar-gap' })) : null,
    h('div', { class: 'msg-body' },
      group && !mine && first ? h('span', { class: 'author', text: author ? author.name : '…' }) : null,
      bubble,
      last ? h('span', { class: 'meta' },
        m.pending ? 'Envoi…' : fmtTime.format(m.t),
        m.id === seenId ? ' · Vu' : '') : null));
    nodes.push(row);
  });
  ui.logIn.replaceChildren(...nodes);
  ui.logIn.dataset.painted = '1';

  const lastMsg = msgs[msgs.length - 1];
  if (firstPaint || nearBottom || (lastMsg && lastMsg.uid === me() && lastMsg.pending)) {
    log.scrollTop = log.scrollHeight;
  }
}

function buildComposer(cid) {
  const ta = h('textarea', {
    rows: 1, maxlength: MAX_TEXT, placeholder: 'Écris un message…', 'aria-label': 'Message',
    enterkeyhint: coarse ? 'enter' : 'send',
  });
  ta.value = drafts.get(cid) || '';
  const count = h('span', { class: 'count', 'aria-live': 'polite' });
  const send = h('button', { class: 'btn icon primary send', type: 'submit', 'aria-label': 'Envoyer' }, icon('send'));

  function sync() {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 168) + 'px';
    const left = MAX_TEXT - ta.value.length;
    count.textContent = left < 200 ? String(left) : '';
    send.disabled = !ta.value.trim();
  }

  const form = h('form', {
    class: 'composer',
    onsubmit: (e) => {
      e.preventDefault();
      const text = ta.value.trim();
      if (!text) return;
      ta.value = '';
      drafts.delete(cid);
      sync();
      sendMessage(cid, text).catch((err) => {
        toast('Message non envoyé : ' + describe(err), 'error');
        if (!ta.value) { ta.value = text; sync(); }
      });
    },
  }, ta, count, send);

  ta.addEventListener('input', sync);
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !coarse) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  requestAnimationFrame(sync);
  return form;
}

/* Le message et l'aperçu de la conversation partent dans la même écriture
   groupée : les règles refusent l'un sans l'autre. */
function sendMessage(cid, text) {
  const uid = me();
  const msg = F.doc(F.collection(db, 'conversations', cid, 'messages'));
  const batch = F.writeBatch(db);
  batch.set(msg, { uid, text, createdAt: F.serverTimestamp() });
  batch.update(F.doc(db, 'conversations', cid), {
    lastMessage: { id: msg.id, uid, text, at: F.serverTimestamp() },
    updatedAt: F.serverTimestamp(),
    ['lastRead.' + uid]: F.serverTimestamp(),
  });
  return batch.commit();
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

async function logout() {
  teardown();
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
      class: 'btn ghost sm', type: 'button',
      onclick: () => A.sendPasswordResetEmail(auth, state.user.email)
        .then(() => toast('E-mail envoyé à ' + state.user.email + ' pour changer de mot de passe.', 'success'))
        .catch((err) => toast(describe(err), 'error')),
    }, icon('mail'), 'Changer de mot de passe')),
  field('Nom affiché', name),
  error,
  h('div', { class: 'row-actions end' },
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { dlg.close(); logout(); } },
      icon('logout'), 'Se déconnecter'),
    save));

  const dlg = modal('Mon profil', form);
}

start();
