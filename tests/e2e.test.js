// Tests du chiffrement de bout en bout (public/e2e.js), sans Firebase :
//     node --test tests/e2e.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PASSWORD_ITERATIONS,
  RECOVERY_ITERATIONS,
  decryptBlob,
  decryptMessage,
  encryptBlob,
  encryptMessage,
  encryptPayload,
  generateIdentity,
  importPrivateKey,
  isRecoveryCodeShaped,
  keyFingerprint,
  newNoteSeed,
  newRecoveryCode,
  normalizeRecoveryCode,
  noteKeyFromMessage,
  noteKeyFromSeed,
  openNote,
  safetyNumber,
  seal,
  sealNote,
  unseal,
} from '../public/e2e.js';

const [alice, bob, mallory] = await Promise.all([generateIdentity(), generateIdentity(), generateIdentity()]);
const members = { alice: alice.publicKey, bob: bob.publicKey };

test('chaque membre déchiffre, y compris l\'auteur', async () => {
  const enc = await encryptMessage('Salut Bob 👋 à 19 h ?', members, 'c1', 'alice');
  assert.equal(await decryptMessage(enc, 'bob', bob.privateKey, 'c1', 'alice'), 'Salut Bob 👋 à 19 h ?');
  assert.equal(await decryptMessage(enc, 'alice', alice.privateKey, 'c1', 'alice'), 'Salut Bob 👋 à 19 h ?');
  assert.deepEqual(Object.keys(enc.k).sort(), ['alice', 'bob']);
  assert.ok(!JSON.stringify(enc).includes('Salut'));
});

test('un non-membre ne déchiffre pas, même avec la clé emballée d\'un autre', async () => {
  const enc = await encryptMessage('secret', members, 'c1', 'alice');
  await assert.rejects(decryptMessage(enc, 'mallory', mallory.privateKey, 'c1', 'alice'));
  await assert.rejects(decryptMessage({ ...enc, k: { mallory: enc.k.bob } }, 'mallory', mallory.privateKey, 'c1', 'alice'));
  await assert.rejects(decryptMessage(enc, 'bob', mallory.privateKey, 'c1', 'alice'));
});

test('le texte est lié à sa conversation et à son auteur', async () => {
  const enc = await encryptMessage('lié', members, 'c1', 'alice');
  await assert.rejects(decryptMessage(enc, 'bob', bob.privateKey, 'c2', 'alice'));
  await assert.rejects(decryptMessage(enc, 'bob', bob.privateKey, 'c1', 'bob'));
});

test('un texte chiffré modifié est rejeté', async () => {
  const enc = await encryptMessage('intègre', members, 'c1', 'alice');
  const flipped = enc.ct[0] === 'A' ? 'B' + enc.ct.slice(1) : 'A' + enc.ct.slice(1);
  await assert.rejects(decryptMessage({ ...enc, ct: flipped }, 'bob', bob.privateKey, 'c1', 'alice'));
});

test('le plus long message tient dans la limite des règles (12 000)', async () => {
  const enc = await encryptMessage('€'.repeat(2000), members, 'c1', 'alice');
  assert.ok(enc.ct.length <= 12000, 'ct = ' + enc.ct.length);
  assert.equal(enc.e.length, 88);
  assert.equal(enc.iv.length, 16);
  assert.equal(alice.publicKey.length, 88);
});

test('clé privée scellée : bon mot de passe seulement', async () => {
  const box = await seal(alice.pkcs8, 'mon mot de passe', PASSWORD_ITERATIONS);
  assert.ok(box.ct.length <= 512 && box.salt.length <= 64 && box.iv.length <= 32);
  const pkcs8 = await unseal(box, 'mon mot de passe');
  const key = await importPrivateKey(pkcs8);
  const enc = await encryptMessage('rouvert', members, 'c1', 'bob');
  assert.equal(await decryptMessage(enc, 'alice', key, 'c1', 'bob'), 'rouvert');
  await assert.rejects(unseal(box, 'mauvais'));
});

test('code de secours : format, tolérance à la saisie, déverrouillage', async () => {
  const code = newRecoveryCode();
  assert.match(code, /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){5}$/);
  assert.notEqual(code, newRecoveryCode());
  const typed = code.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o').replace(/1/g, 'l');
  assert.equal(normalizeRecoveryCode(typed), normalizeRecoveryCode(code));
  assert.ok(isRecoveryCodeShaped(typed));
  assert.ok(!isRecoveryCodeShaped('ABCD-EFGH'));
  const box = await seal(alice.pkcs8, normalizeRecoveryCode(code), RECOVERY_ITERATIONS);
  await unseal(box, normalizeRecoveryCode(typed));
});

test('enveloppe v2 (photo, vocal, appel) : aller-retour et version liée', async () => {
  const payload = { t: 'image', caption: 'Vue du balcon', mime: 'image/webp', w: 800, h: 600, key: 'k', iv: 'i' };
  const enc = await encryptPayload(payload, members, 'c1', 'alice');
  assert.equal(enc.v, 2);
  assert.deepEqual(JSON.parse(await decryptMessage(enc, 'bob', bob.privateKey, 'c1', 'alice')), payload);
  assert.ok(!JSON.stringify(enc).includes('balcon'));
  // Changer la version (v2 -> v1) ne doit pas faire passer l'enveloppe pour du texte.
  await assert.rejects(decryptMessage({ ...enc, v: 1 }, 'bob', bob.privateKey, 'c1', 'alice'));
  const v1 = await encryptMessage('texte', members, 'c1', 'alice');
  await assert.rejects(decryptMessage({ ...v1, v: 2 }, 'bob', bob.privateKey, 'c1', 'alice'));
  await assert.rejects(decryptMessage({ ...enc, v: 3 }, 'bob', bob.privateKey, 'c1', 'alice'));
});

test('fichier chiffré : aller-retour, lié au message, intègre', async () => {
  const bytes = new Uint8Array(50000).map((_, i) => (i * 7) % 256);
  const box = await encryptBlob(bytes, 'c1', 'm1');
  assert.equal(box.data.length, bytes.length + 16);
  assert.notDeepEqual(box.data.slice(0, 32), bytes.slice(0, 32));
  const back = new Uint8Array(await decryptBlob(box.data, box.key, box.iv, 'c1', 'm1'));
  assert.deepEqual(back, bytes);
  await assert.rejects(decryptBlob(box.data, box.key, box.iv, 'c1', 'm2'));
  await assert.rejects(decryptBlob(box.data, box.key, box.iv, 'c2', 'm1'));
  const tampered = box.data.slice();
  tampered[10] ^= 1;
  await assert.rejects(decryptBlob(tampered, box.key, box.iv, 'c1', 'm1'));
  const other = await encryptBlob(bytes, 'c1', 'm1');
  await assert.rejects(decryptBlob(box.data, other.key, box.iv, 'c1', 'm1'));
});

test('enveloppe v2 la plus longue (légende de 2000 caractères) sous la limite des règles', async () => {
  const payload = { t: 'image', caption: 'é'.repeat(2000), mime: 'image/jpeg', w: 1600, h: 1200,
    key: 'A'.repeat(44), iv: 'B'.repeat(16) };
  const enc = await encryptPayload(payload, members, 'c1', 'alice');
  assert.ok(enc.ct.length <= 12000, 'ct = ' + enc.ct.length);
});

test('texte le plus riche (2000 caractères, réponse, 19 mentions) sous la limite des règles', async () => {
  const uid = 'u'.repeat(28);
  const payload = {
    t: 'text', text: '€'.repeat(2000), nk: newNoteSeed(),
    reply: { id: 'm'.repeat(20), uid, s: '€'.repeat(120) },
    mentions: Array.from({ length: 19 }, () => uid),
  };
  const enc = await encryptPayload(payload, members, 'c1', 'alice');
  assert.ok(enc.ct.length <= 12000, 'ct = ' + enc.ct.length);
});

test('réactions et votes : lisibles par les membres, liés au message et à leur auteur', async () => {
  const enc = await encryptMessage('Qui vient ?', members, 'c1', 'alice');
  const byAlice = await noteKeyFromMessage(enc, 'alice', alice.privateKey);
  const byBob = await noteKeyFromMessage(enc, 'bob', bob.privateKey);
  const note = await sealNote(byBob, { r: '👍', v: [1] }, 'c1', 'm1', 'bob');
  assert.equal(note.iv.length, 16);
  assert.ok(note.ct.length <= 400);
  assert.deepEqual(await openNote(byAlice, note, 'c1', 'm1', 'bob'), { r: '👍', v: [1] });
  await assert.rejects(openNote(byAlice, note, 'c1', 'm2', 'bob'));
  await assert.rejects(openNote(byAlice, note, 'c1', 'm1', 'alice'));
  await assert.rejects(noteKeyFromMessage(enc, 'mallory', mallory.privateKey));
  // Graine de l'enveloppe : la même clé pour tous, et après modification.
  const seed = newNoteSeed();
  const k1 = await noteKeyFromSeed(seed);
  const k2 = await noteKeyFromSeed(seed);
  assert.deepEqual(await openNote(k2, await sealNote(k1, { r: '❤️' }, 'c', 'm', 'u'), 'c', 'm', 'u'), { r: '❤️' });
});

test('numéro de sécurité : 60 chiffres, le même des deux côtés, change avec la clé', async () => {
  const ab = await safetyNumber('alice', alice.publicKey, 'bob', bob.publicKey);
  const ba = await safetyNumber('bob', bob.publicKey, 'alice', alice.publicKey);
  assert.equal(ab, ba);
  assert.match(ab, /^(\d{5} ){11}\d{5}$/);
  assert.notEqual(await safetyNumber('alice', alice.publicKey, 'bob', mallory.publicKey), ab);
  assert.notEqual(await keyFingerprint(alice.publicKey), await keyFingerprint(bob.publicKey));
});
