// Photos et messages vocaux de message-me : préparation dans le navigateur,
// avant chiffrement (e2e.js) et envoi.
//
// Sans Cloud Storage (réservé à la formule payante de Firebase), un fichier
// est rangé dans un document Firestore, limité à 1 Mio : les photos sont donc
// redimensionnées et recompressées, et les messages vocaux limités en durée.

export const MAX_MEDIA_BYTES = 950000;  // avant chiffrement ; les règles acceptent 1 000 000 octets chiffrés
export const MAX_VOICE_SECONDS = 180;
const MAX_SIDE = 1600;
const WAVE_BARS = 40;

function mediaError(code) {
  return Object.assign(new Error(code), { code });
}

/* ---------------------------------------------------------------- photos */

let webp = null;
function canEncodeWebp() {
  if (webp === null) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    webp = c.toDataURL('image/webp').startsWith('data:image/webp');
  }
  return webp;
}

async function decodeImage(file) {
  if (window.createImageBitmap) {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, done: () => bitmap.close() };
    } catch {
      // Format non géré par createImageBitmap : on passe par <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(mediaError('image-decode'));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, done: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Redimensionne (1600 px au plus grand côté) et recompresse une photo pour
 * qu'elle tienne sous MAX_MEDIA_BYTES. Rend { blob, w, h, mime }.
 */
export async function prepareImage(file) {
  if (!file || !/^image\//.test(file.type)) throw mediaError('not-image');
  const img = await decodeImage(file);
  try {
    if (!img.width || !img.height) throw mediaError('image-decode');
    const type = canEncodeWebp() ? 'image/webp' : 'image/jpeg';
    let scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    for (let round = 0; round < 6; round++) {
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const g = canvas.getContext('2d');
      if (type === 'image/jpeg') {
        g.fillStyle = '#ffffff'; // pas de transparence en JPEG
        g.fillRect(0, 0, w, h);
      }
      g.drawImage(img.source, 0, 0, w, h);
      for (const quality of [0.86, 0.74, 0.62]) {
        const blob = await toBlob(canvas, type, quality);
        if (blob && blob.size <= MAX_MEDIA_BYTES) return { blob, w, h, mime: blob.type || type };
      }
      scale *= 0.7;
    }
    throw mediaError('too-big');
  } finally {
    img.done();
  }
}

/* ------------------------------------------------------ messages vocaux */

export function voiceSupported() {
  return Boolean(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// AAC (mp4) se lit partout ; sinon Opus.
const AUDIO_TYPES = ['audio/mp4;codecs=mp4a.40.2', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];

function pickAudioType() {
  if (!MediaRecorder.isTypeSupported) return '';
  return AUDIO_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

/** Enregistre un message vocal, et relève le niveau sonore pour sa forme d'onde. */
export class VoiceRecorder {
  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const mimeType = pickAudioType();
    this.recorder = new MediaRecorder(this.stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32000 });
    this.chunks = [];
    this.levels = [];
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) this.chunks.push(e.data);
    };
    this.startedAt = performance.now();
    this.recorder.start(500);
    this.meter();
  }

  meter() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 512;
      this.ctx.createMediaStreamSource(this.stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      this.sampler = setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        this.levels.push(Math.min(1, peak / 90));
      }, 80);
    } catch {
      this.ctx = null;
    }
  }

  /** Niveau sonore actuel, entre 0 et 1. */
  get level() {
    return this.levels.length ? this.levels[this.levels.length - 1] : 0;
  }

  get seconds() {
    return this.startedAt ? (performance.now() - this.startedAt) / 1000 : 0;
  }

  /** Taille déjà enregistrée, pour s'arrêter avant la limite d'un document. */
  get bytes() {
    return this.chunks.reduce((n, c) => n + c.size, 0);
  }

  /** Durée ou taille maximale atteinte. */
  get full() {
    return this.seconds >= MAX_VOICE_SECONDS || this.bytes >= MAX_MEDIA_BYTES * 0.9;
  }

  /** Arrête et rend { blob, mime, duration, wave }. */
  stop() {
    return new Promise((resolve, reject) => {
      const rec = this.recorder;
      if (!rec || rec.state === 'inactive') {
        reject(mediaError('not-recording'));
        return;
      }
      const duration = Math.max(0.5, this.seconds);
      rec.onstop = () => {
        const mime = rec.mimeType || (this.chunks[0] && this.chunks[0].type) || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mime });
        const wave = waveform(this.levels);
        this.release();
        if (blob.size > MAX_MEDIA_BYTES) reject(mediaError('too-big'));
        else resolve({ blob, mime, duration: Math.round(duration * 10) / 10, wave });
      };
      rec.stop();
    });
  }

  cancel() {
    try {
      if (this.recorder && this.recorder.state !== 'inactive') {
        this.recorder.onstop = null;
        this.recorder.stop();
      }
    } catch {
      // Déjà arrêté.
    }
    this.release();
    this.chunks = [];
  }

  release() {
    clearInterval(this.sampler);
    if (this.ctx) this.ctx.close().catch(() => {});
    this.ctx = null;
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}

/** Réduit les niveaux relevés à WAVE_BARS barres de 0 à 15. */
function waveform(levels) {
  if (!levels.length) return Array(WAVE_BARS).fill(2);
  const out = [];
  for (let i = 0; i < WAVE_BARS; i++) {
    const from = Math.floor((i * levels.length) / WAVE_BARS);
    const to = Math.max(from + 1, Math.floor(((i + 1) * levels.length) / WAVE_BARS));
    let peak = 0;
    for (let j = from; j < to && j < levels.length; j++) peak = Math.max(peak, levels[j]);
    out.push(Math.max(1, Math.round(Math.sqrt(peak) * 15)));
  }
  return out;
}

/* ------------------------------------------------------------- lecteur */

// Un seul lecteur pour tout le site : lancer un message vocal arrête le
// précédent. L'interface s'abonne à son état pour se mettre à jour.

const audio = new Audio();
audio.preload = 'auto';
let current = null; // { id, duration }
const listeners = new Set();
const RATES = [1, 1.5, 2];

function snapshot() {
  const known = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
  return {
    id: current ? current.id : null,
    playing: Boolean(current) && !audio.paused && !audio.ended,
    time: audio.currentTime || 0,
    duration: (current && current.duration) || known,
    rate: audio.playbackRate,
  };
}

function emit() {
  const s = snapshot();
  for (const fn of listeners) fn(s);
}

for (const ev of ['play', 'pause', 'timeupdate', 'loadedmetadata']) audio.addEventListener(ev, emit);
audio.addEventListener('ended', () => {
  audio.currentTime = 0;
  current = null;
  emit();
});

export const player = {
  async toggle(id, url, duration) {
    if (current && current.id === id) {
      if (audio.paused) await audio.play();
      else audio.pause();
      return;
    }
    audio.pause();
    current = { id, duration };
    audio.src = url;
    audio.currentTime = 0;
    emit();
    await audio.play();
  },

  seek(id, fraction) {
    if (!current || current.id !== id) return;
    const d = snapshot().duration;
    if (d) audio.currentTime = Math.max(0, Math.min(d, fraction * d));
  },

  cycleRate() {
    const i = RATES.indexOf(audio.playbackRate);
    audio.playbackRate = RATES[(i + 1) % RATES.length];
    emit();
  },

  stop() {
    audio.pause();
    current = null;
    emit();
  },

  state: snapshot,

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

export function formatBytes(n) {
  return n < 1024 * 1024 ? Math.round(n / 1024) + ' Ko' : (n / 1024 / 1024).toFixed(1).replace('.', ',') + ' Mo';
}
