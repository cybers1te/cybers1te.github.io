// Tests du chiffrement de bout en bout (public/e2e.js), sans Firebase :
//     node --test tests/e2e.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PASSWORD_ITERATIONS,
  RECOVERY_ITERATIONS,
  decryptMessage,
  encryptMessage,
  generateIdentity,
  importPrivateKey,
  isRecoveryCodeShaped,
  newRecoveryCode,
  normalizeRecoveryCode,
  seal,
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

test('le plus long message tient dans la limite des règles (8200)', async () => {
  const enc = await encryptMessage('€'.repeat(2000), members, 'c1', 'alice');
  assert.ok(enc.ct.length <= 8200, 'ct = ' + enc.ct.length);
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
