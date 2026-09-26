// Notifications du navigateur et sons de message-me.
//
// Un vrai « push » (site fermé) demanderait un serveur d'envoi, donc la
// formule payante de Firebase : ici, les notifications arrivent tant qu'un
// onglet message-me est ouvert, même en arrière-plan ou fenêtre réduite.
// Elles passent par le service worker (sw.js), seul moyen d'en afficher sur
// Android, et qui ramène sur la bonne conversation quand on clique dessus.

let registration = null;

export async function registerWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    registration = await navigator.serviceWorker.register('sw.js');
  } catch {
    registration = null;
  }
  return registration;
}

export const notificationsSupported = () => 'Notification' in window;

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestNotifications() {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

async function worker() {
  if (registration) return registration;
  if (!('serviceWorker' in navigator)) return null;
  try {
    return (await navigator.serviceWorker.getRegistration()) || null;
  } catch {
    return null;
  }
}

/** `hash` est la route à ouvrir au clic, par exemple '#/c/<id>'. */
export async function notify(title, { body = '', tag, hash = '', requireInteraction = false, vibrate } = {}) {
  if (notificationPermission() !== 'granted') return;
  const options = {
    body,
    tag,
    renotify: Boolean(tag),
    requireInteraction,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { hash },
    ...(vibrate ? { vibrate } : {}),
  };
  try {
    const reg = await worker();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      if (hash) location.hash = hash;
      n.close();
    };
  } catch {
    // Refusée par le système : l'interface suffit.
  }
}

export async function closeNotifications(tag) {
  try {
    const reg = await worker();
    if (!reg) return;
    for (const n of await reg.getNotifications({ tag })) n.close();
  } catch {
    // Rien à fermer.
  }
}

/* ------------------------------------------------------------------ sons */

// Sons synthétisés (Web Audio) : aucun fichier à charger. Les navigateurs
// n'autorisent le son qu'après une première interaction avec la page :
// unlockAudio() est appelé au premier clic.

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function unlockAudio() {
  audio();
}

function beep(freqs, at, duration, volume) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(volume, at + 0.02);
  g.gain.setValueAtTime(volume, at + Math.max(0.03, duration - 0.06));
  g.gain.linearRampToValueAtTime(0, at + duration);
  g.connect(ctx.destination);
  for (const f of freqs) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    o.connect(g);
    o.start(at);
    o.stop(at + duration + 0.05);
  }
}

let ringTimer = null;
let ringKind = null;

/** 'incoming' : sonnerie d'appel entrant ; 'outgoing' : tonalité de retour d'appel. */
export function startRingtone(kind) {
  if (ringKind === kind) return;
  stopRingtone();
  if (!audio()) return;
  ringKind = kind;
  const play = () => {
    const t = ctx.currentTime + 0.05;
    if (kind === 'incoming') {
      beep([659, 880], t, 0.35, 0.09);
      beep([659, 880], t + 0.5, 0.35, 0.09);
      if (navigator.vibrate) navigator.vibrate([400, 150, 400]);
    } else {
      beep([440], t, 1.4, 0.05);
    }
  };
  play();
  ringTimer = setInterval(play, kind === 'incoming' ? 2600 : 4500);
}

export function stopRingtone() {
  clearInterval(ringTimer);
  ringTimer = null;
  if (ringKind === 'incoming' && navigator.vibrate) navigator.vibrate(0);
  ringKind = null;
}

/** Petit son discret à l'arrivée d'un message. */
export function blip() {
  if (!audio()) return;
  const t = ctx.currentTime + 0.02;
  beep([880], t, 0.08, 0.05);
  beep([1318], t + 0.09, 0.1, 0.04);
}

/** Tonalité de fin d'appel. */
export function hangupTone() {
  if (!audio()) return;
  const t = ctx.currentTime + 0.02;
  beep([480, 620], t, 0.18, 0.05);
  beep([480, 620], t + 0.26, 0.18, 0.05);
}
