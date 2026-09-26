// Chiffrement de bout en bout de message-me (Web Crypto, aucune bibliothèque).
//
// Chaque compte possède une paire de clés ECDH P-256 :
//   - la clé publique est dans users/{uid}.publicKey, lisible par les autres ;
//   - la clé privée ne quitte jamais le navigateur en clair. Elle est rangée
//     dans keys/{uid} (lisible par son seul propriétaire) chiffrée deux fois :
//     avec le mot de passe (byPassword) et avec le code de secours
//     (byRecovery), chacun passé dans PBKDF2-SHA-256.
//
// Chaque message a sa propre clé AES-256-GCM. Elle est « emballée » pour
// chaque membre de la conversation (y compris l'auteur) par ECDH éphémère +
// HKDF + AES-KW. Firestore ne voit donc que :
//   enc = { v, e: clé publique éphémère, iv, ct: texte chiffré, k: { uid: clé emballée } }
// Le texte est lié à sa conversation et à son auteur (données associées
// AES-GCM) : on ne peut pas le recopier ailleurs sans que le déchiffrement échoue.

const subtle = globalThis.crypto.subtle;
const ECDH = { name: 'ECDH', namedCurve: 'P-256' };
const te = new TextEncoder();
const td = new TextDecoder();

export const PASSWORD_ITERATIONS = 600000;
export const RECOVERY_ITERATIONS = 100000;

/* ---------------------------------------------------------------- base64 */

export function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

export function fromB64(str) {
  const s = atob(str);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

const random = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

/* ------------------------------------------------------- code de secours */

// Base32 de Crockford : pas de I, L, O ni U, donc rien à confondre.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 120 bits aléatoires, affichés en 6 groupes de 4 caractères. */
export function newRecoveryCode() {
  const bytes = random(15);
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }
  return out.match(/.{4}/g).join('-');
}

/** Tolère minuscules, espaces, tirets et les confusions O/0, I/L/1. */
export function normalizeRecoveryCode(code) {
  return String(code || '').toUpperCase()
    .replace(/[\s-]+/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

export function isRecoveryCodeShaped(code) {
  const c = normalizeRecoveryCode(code);
  return c.length === 24 && [...c].every((ch) => B32.includes(ch));
}

/* ------------------------------------------------------ paire de clés */

/**
 * Nouvelle identité. `pkcs8` (la clé privée en clair) sert uniquement à la
 * sceller juste après ; la clé gardée en mémoire n'est pas exportable.
 */
export async function generateIdentity() {
  const pair = await subtle.generateKey(ECDH, true, ['deriveBits']);
  const pkcs8 = await subtle.exportKey('pkcs8', pair.privateKey);
  const publicKey = toB64(await subtle.exportKey('raw', pair.publicKey));
  const privateKey = await importPrivateKey(pkcs8);
  return { publicKey, privateKey, pkcs8 };
}

export function importPrivateKey(pkcs8) {
  return subtle.importKey('pkcs8', pkcs8, ECDH, false, ['deriveBits']);
}

/* ------------------------------------- sceller la clé privée (PBKDF2) */

async function secretKey(secret, salt, iterations) {
  const base = await subtle.importKey('raw', te.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Chiffre `pkcs8` avec un secret (mot de passe ou code de secours normalisé). */
export async function seal(pkcs8, secret, iterations) {
  const salt = random(16);
  const iv = random(12);
  const key = await secretKey(secret, salt, iterations);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, pkcs8);
  return { salt: toB64(salt), iv: toB64(iv), ct: toB64(ct), iter: iterations };
}

/** Rend la clé privée en clair (pkcs8), ou lève une erreur si le secret est faux. */
export async function unseal(box, secret) {
  const key = await secretKey(secret, fromB64(box.salt), box.iter);
  return subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, key, fromB64(box.ct));
}

/* ------------------------------------------------------------ messages */

async function wrappingKey(privateKey, publicKey, salt, uid) {
  const bits = await subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
  const hkdf = await subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: te.encode('message-me/e2e/v1/' + uid) },
    hkdf,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

const aad = (cid, author) => te.encode('message-me/v1|' + cid + '|' + author);

/**
 * Chiffre `text` pour les membres `recipients` ({ uid: clé publique base64 }).
 * `cid` et `author` sont liés au texte chiffré.
 */
export async function encryptMessage(text, recipients, cid, author) {
  const cek = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = random(12);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(cid, author) }, cek, te.encode(text));
  const eph = await subtle.generateKey(ECDH, false, ['deriveBits']);
  const ephRaw = new Uint8Array(await subtle.exportKey('raw', eph.publicKey));
  const k = {};
  for (const [uid, pub] of Object.entries(recipients)) {
    const theirs = await subtle.importKey('raw', fromB64(pub), ECDH, false, []);
    const kek = await wrappingKey(eph.privateKey, theirs, ephRaw, uid);
    k[uid] = toB64(await subtle.wrapKey('raw', cek, kek, 'AES-KW'));
  }
  return { v: 1, e: toB64(ephRaw), iv: toB64(iv), ct: toB64(ct), k };
}

/** Déchiffre un message pour `uid` avec sa clé privée ; lève une erreur sinon. */
export async function decryptMessage(enc, uid, privateKey, cid, author) {
  if (!enc || enc.v !== 1 || !enc.k || !enc.k[uid]) throw new Error('no-key');
  const ephRaw = fromB64(enc.e);
  const eph = await subtle.importKey('raw', ephRaw, ECDH, false, []);
  const kek = await wrappingKey(privateKey, eph, ephRaw, uid);
  const cek = await subtle.unwrapKey('raw', fromB64(enc.k[uid]), kek, 'AES-KW',
    { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: fromB64(enc.iv), additionalData: aad(cid, author) },
    cek, fromB64(enc.ct));
  return td.decode(pt);
}

/* ------------------------------------ clé de cet appareil (IndexedDB) */

// La clé privée déverrouillée est gardée sur l'appareil (non exportable),
// pour ne pas redemander le mot de passe à chaque visite. Elle est effacée
// à la déconnexion.

const DB_NAME = 'message-me';
const STORE = 'device-keys';

function openDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('no-indexeddb')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, fn) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function saveDeviceKey(uid, value) {
  try { await withStore('readwrite', (s) => s.put(value, uid)); } catch { /* mémoire seulement */ }
}

export async function loadDeviceKey(uid) {
  try { return (await withStore('readonly', (s) => s.get(uid))) || null; } catch { return null; }
}

export async function deleteDeviceKey(uid) {
  try { await withStore('readwrite', (s) => s.delete(uid)); } catch { /* rien à effacer */ }
}
