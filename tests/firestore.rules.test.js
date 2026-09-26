// Tests des règles Firestore de message-me.
//
// Ils tournent contre l'émulateur Firestore (aucun projet réel n'est touché) :
//     npm test
import { after, before, beforeEach, describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  arrayRemove,
  arrayUnion,
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  PASSWORD_ITERATIONS,
  RECOVERY_ITERATIONS,
  encryptBlob,
  encryptMessage,
  encryptPayload,
  generateIdentity,
  seal,
} from '../public/e2e.js';

let env;
const ids = {}; // uid -> identité de test

before(async () => {
  for (const uid of ['alice', 'bob', 'carol', 'mallory']) ids[uid] = await generateIdentity();
  env = await initializeTestEnvironment({
    projectId: 'demo-message-me',
    firestore: {
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

after(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const db = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

// Mêmes écritures que public/main.js.

function register(fs, uid, username, name = 'Nom ' + username) {
  const batch = writeBatch(fs);
  batch.set(doc(fs, 'usernames', username), { uid });
  batch.set(doc(fs, 'users', uid), { name, username, createdAt: serverTimestamp() });
  return batch.commit();
}

const dmId = (a, b) => 'dm_' + [a, b].sort().join('_');

function newConversation(fs, uid, members, { type = 'group', title = 'Groupe' } = {}) {
  return {
    type,
    members,
    title,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
    lastRead: {},
  };
}

function createDm(fs, uid, other) {
  const members = [uid, other].sort();
  return setDoc(doc(fs, 'conversations', dmId(uid, other)),
    newConversation(fs, uid, members, { type: 'dm', title: '' }));
}

// Groupe tel que public/main.js le crée : son seul créateur, admin, puis
// les membres ajoutés un par un (addMember).
const PERMS = { send: 'all', info: 'all', add: 'all' };

function newGroup(uid, { title = 'Groupe', perms = PERMS, description = '' } = {}) {
  return {
    type: 'group',
    members: [uid],
    admins: [uid],
    perms,
    description,
    title,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
    lastRead: {},
  };
}

const addMember = (fs, gid, uid) => updateDoc(doc(fs, 'conversations', gid), { members: arrayUnion(uid) });

// Groupe déjà en place (écrit sans passer par les règles). `legacy` : groupe
// créé avant les admins, sans `admins` ni `perms`.
async function seedGroup(gid, members, { createdBy = members[0], admins = [createdBy], perms = PERMS, legacy = false } = {}) {
  const data = {
    type: 'group', members, title: 'Groupe', createdBy,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), lastMessage: null, lastRead: {},
    ...(legacy ? {} : { admins, perms, description: '' }),
  };
  await seed((fs) => setDoc(doc(fs, 'conversations', gid), data));
  return gid;
}

async function seedUsers(...uids) {
  await seed(async (fs) => {
    for (const uid of uids) await setDoc(doc(fs, 'users', uid), { name: 'Nom ' + uid, username: uid });
  });
}

const encryptFor = (members, text, cid, uid) =>
  encryptMessage(text, Object.fromEntries(members.map((m) => [m, ids[m].publicKey])), cid, uid);

async function post(fs, uid, cid, text, overrides = {}) {
  const members = overrides.members || ['alice', 'bob'];
  const enc = overrides.enc || await encryptFor(members, text, cid, uid);
  const msg = doc(collection(fs, 'conversations', cid, 'messages'));
  const batch = writeBatch(fs);
  batch.set(msg, { uid, enc, createdAt: serverTimestamp(), ...overrides.message });
  batch.update(doc(fs, 'conversations', cid), {
    lastMessage: { id: msg.id, uid, enc, at: serverTimestamp(), ...overrides.lastMessage },
    updatedAt: serverTimestamp(),
    ['lastRead.' + uid]: serverTimestamp(),
  });
  return batch.commit();
}

// Même écriture que l'inscription de public/main.js : pseudo, profil avec
// clé publique et clé privée scellée, ensemble.
async function registerWithKeys(fs, uid, username, identity = ids[uid]) {
  const batch = writeBatch(fs);
  batch.set(doc(fs, 'usernames', username), { uid });
  batch.set(doc(fs, 'users', uid), {
    name: 'Nom ' + username, username, createdAt: serverTimestamp(), publicKey: identity.publicKey,
  });
  batch.set(doc(fs, 'keys', uid), await keysDoc(identity));
  return batch.commit();
}

async function keysDoc(identity, { iterations = PASSWORD_ITERATIONS } = {}) {
  return {
    v: 1,
    publicKey: identity.publicKey,
    byPassword: await seal(identity.pkcs8, 'mot de passe', iterations),
    byRecovery: await seal(identity.pkcs8, 'CODEDESECOURS', RECOVERY_ITERATIONS),
    updatedAt: serverTimestamp(),
  };
}

async function seed(fn) {
  await env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));
}

describe('pseudos et profils', () => {
  test('inscription : pseudo et profil créés ensemble', async () => {
    await assertSucceeds(register(db('alice'), 'alice', 'alice'));
  });

  test('refuse un visiteur non connecté', async () => {
    await assertFails(register(anon(), 'alice', 'alice'));
    await seed((fs) => setDoc(doc(fs, 'users', 'bob'), { name: 'Bob', username: 'bob' }));
    await assertFails(getDoc(doc(anon(), 'users', 'bob')));
  });

  test('refuse un profil sans pseudo réservé', async () => {
    const fs = db('alice');
    await assertFails(setDoc(doc(fs, 'users', 'alice'),
      { name: 'Alice', username: 'alice', createdAt: serverTimestamp() }));
  });

  test('refuse un pseudo réservé pour quelqu\'un d\'autre', async () => {
    const fs = db('alice');
    const batch = writeBatch(fs);
    batch.set(doc(fs, 'usernames', 'alice'), { uid: 'bob' });
    batch.set(doc(fs, 'users', 'alice'), { name: 'A', username: 'alice', createdAt: serverTimestamp() });
    await assertFails(batch.commit());
  });

  test('un pseudo déjà pris ne peut pas être repris', async () => {
    await register(db('alice'), 'alice', 'alice');
    await assertFails(register(db('bob'), 'bob', 'alice'));
  });

  test('un compte ne réserve qu\'un seul pseudo', async () => {
    await register(db('alice'), 'alice', 'alice');
    await assertFails(setDoc(doc(db('alice'), 'usernames', 'alice2'), { uid: 'alice' }));
  });

  test('refuse les pseudos mal formés', async () => {
    for (const bad of ['ab', 'Alice', 'a b', 'é_toile', 'x'.repeat(21)]) {
      await assertFails(register(db('alice'), 'alice', bad));
    }
  });

  test('refuse un nom vide ou trop long', async () => {
    await assertFails(register(db('alice'), 'alice', 'alice', ''));
    await assertFails(register(db('alice'), 'alice', 'alice', 'x'.repeat(41)));
  });

  test('on lit un profil ou un pseudo précis, jamais la liste', async () => {
    await register(db('alice'), 'alice', 'alice');
    const fs = db('bob');
    await assertSucceeds(getDoc(doc(fs, 'users', 'alice')));
    await assertSucceeds(getDoc(doc(fs, 'usernames', 'alice')));
    await assertFails(getDocs(collection(fs, 'users')));
    await assertFails(getDocs(collection(fs, 'usernames')));
  });

  test('on change son nom affiché, pas son pseudo ni celui des autres', async () => {
    await register(db('alice'), 'alice', 'alice');
    await assertSucceeds(updateDoc(doc(db('alice'), 'users', 'alice'), { name: 'Alice L.' }));
    await assertFails(updateDoc(doc(db('alice'), 'users', 'alice'), { username: 'reine' }));
    await assertFails(updateDoc(doc(db('bob'), 'users', 'alice'), { name: 'Piratée' }));
  });
});

describe('clés de chiffrement', () => {
  test('inscription : pseudo, profil, clé publique et clé scellée ensemble', async () => {
    await assertSucceeds(registerWithKeys(db('alice'), 'alice', 'alice'));
    const profile = await getDoc(doc(db('bob'), 'users', 'alice'));
    if (profile.data().publicKey !== ids.alice.publicKey) throw new Error('clé publique absente');
  });

  test('la clé scellée n\'est lisible que par son propriétaire, jamais listée', async () => {
    await registerWithKeys(db('alice'), 'alice', 'alice');
    await assertSucceeds(getDoc(doc(db('alice'), 'keys', 'alice')));
    await assertFails(getDoc(doc(db('bob'), 'keys', 'alice')));
    await assertFails(getDoc(doc(anon(), 'keys', 'alice')));
    await assertFails(getDocs(collection(db('alice'), 'keys')));
  });

  test('la clé scellée doit correspondre à la clé publique du profil', async () => {
    await register(db('alice'), 'alice', 'alice');
    const fs = db('alice');
    const data = await keysDoc(ids.alice);
    await assertFails(setDoc(doc(fs, 'keys', 'alice'), data));
    const batch = writeBatch(fs);
    batch.set(doc(fs, 'keys', 'alice'), data);
    batch.update(doc(fs, 'users', 'alice'), { publicKey: ids.bob.publicKey });
    await assertFails(batch.commit());
  });

  test('activer le chiffrement sur un compte existant', async () => {
    await register(db('alice'), 'alice', 'alice');
    const fs = db('alice');
    const batch = writeBatch(fs);
    batch.set(doc(fs, 'keys', 'alice'), await keysDoc(ids.alice));
    batch.update(doc(fs, 'users', 'alice'), { publicKey: ids.alice.publicKey });
    await assertSucceeds(batch.commit());
  });

  test('changer de clé : profil et clé scellée ensemble, jamais l\'un sans l\'autre', async () => {
    await registerWithKeys(db('alice'), 'alice', 'alice');
    const fresh = await generateIdentity();
    const fs = db('alice');
    await assertFails(updateDoc(doc(fs, 'users', 'alice'), { publicKey: fresh.publicKey }));
    const batch = writeBatch(fs);
    batch.set(doc(fs, 'keys', 'alice'), await keysDoc(fresh));
    batch.update(doc(fs, 'users', 'alice'), { publicKey: fresh.publicKey });
    await assertSucceeds(batch.commit());
  });

  test('changer de mot de passe : la clé scellée est réécrite, la clé publique reste', async () => {
    await registerWithKeys(db('alice'), 'alice', 'alice');
    await assertSucceeds(updateDoc(doc(db('alice'), 'keys', 'alice'), {
      byPassword: await seal(ids.alice.pkcs8, 'nouveau', PASSWORD_ITERATIONS),
      updatedAt: serverTimestamp(),
    }));
  });

  test('personne d\'autre ne touche à la clé d\'un compte', async () => {
    await registerWithKeys(db('alice'), 'alice', 'alice');
    const fs = db('mallory');
    await assertFails(updateDoc(doc(fs, 'users', 'alice'), { publicKey: ids.mallory.publicKey }));
    await assertFails(setDoc(doc(fs, 'keys', 'alice'), await keysDoc(ids.mallory)));
    await assertFails(deleteDoc(doc(db('alice'), 'keys', 'alice')));
  });

  test('refuse une clé mal formée ou trop peu protégée', async () => {
    await register(db('alice'), 'alice', 'alice');
    const fs = db('alice');
    const weak = writeBatch(fs);
    weak.set(doc(fs, 'keys', 'alice'), await keysDoc(ids.alice, { iterations: 1000 }));
    weak.update(doc(fs, 'users', 'alice'), { publicKey: ids.alice.publicKey });
    await assertFails(weak.commit());
    await assertFails(updateDoc(doc(fs, 'users', 'alice'), { publicKey: 'pas une clé' }));
  });
});

describe('conversations', () => {
  test('discussion à deux avec identifiant déterministe', async () => {
    await assertSucceeds(createDm(db('alice'), 'alice', 'bob'));
  });

  test('refuse une discussion à deux avec un autre identifiant', async () => {
    const fs = db('alice');
    await assertFails(setDoc(doc(fs, 'conversations', 'autre'),
      newConversation(fs, 'alice', ['alice', 'bob'], { type: 'dm', title: '' })));
    await assertFails(setDoc(doc(fs, 'conversations', dmId('alice', 'bob')),
      newConversation(fs, 'alice', ['bob', 'alice'], { type: 'dm', title: '' })));
  });

  test('refuse une conversation dont on n\'est pas membre', async () => {
    const fs = db('mallory');
    await assertFails(setDoc(doc(fs, 'conversations', dmId('alice', 'bob')),
      newConversation(fs, 'mallory', ['alice', 'bob'], { type: 'dm', title: '' })));
    await assertFails(setDoc(doc(collection(fs, 'conversations')),
      newConversation(fs, 'mallory', ['alice', 'bob'])));
  });

  test('groupe : créé par son seul créateur, admin, avec un titre', async () => {
    const fs = db('alice');
    const make = (data) => setDoc(doc(collection(fs, 'conversations')), data);
    await assertSucceeds(make(newGroup('alice')));
    await assertSucceeds(make(newGroup('alice', { description: 'd'.repeat(300) })));
    // Les autres membres sont ajoutés ensuite, un par un.
    await assertFails(make({ ...newGroup('alice'), members: ['alice', 'bob'] }));
    await assertFails(make(newConversation(fs, 'alice', ['alice', 'bob', 'carol'])));
    await assertFails(make({ ...newGroup('alice'), admins: ['alice', 'bob'] }));
    await assertFails(make({ ...newGroup('bob'), createdBy: 'alice' }));
    await assertFails(make(newGroup('alice', { title: '' })));
    await assertFails(make(newGroup('alice', { title: 't'.repeat(61) })));
    await assertFails(make(newGroup('alice', { description: 'd'.repeat(301) })));
    await assertFails(make(newGroup('alice', { perms: { ...PERMS, send: 'personne' } })));
    await assertFails(make(newGroup('alice', { perms: { send: 'all', info: 'all' } })));
    await assertFails(make({ ...newGroup('alice'), extra: true }));
  });

  test('refuse un aperçu pré-rempli à la création', async () => {
    const data = newGroup('alice');
    data.lastMessage = { id: 'x', uid: 'bob', text: 'faux', at: serverTimestamp() };
    await assertFails(setDoc(doc(collection(db('alice'), 'conversations')), data));
  });

  test('seuls les membres lisent une conversation', async () => {
    await createDm(db('alice'), 'alice', 'bob');
    await assertSucceeds(getDoc(doc(db('bob'), 'conversations', dmId('alice', 'bob'))));
    await assertFails(getDoc(doc(db('mallory'), 'conversations', dmId('alice', 'bob'))));
  });

  test('la liste n\'est permise que filtrée sur ses propres conversations', async () => {
    await createDm(db('alice'), 'alice', 'bob');
    const fs = db('bob');
    const mine = await assertSucceeds(getDocs(query(collection(fs, 'conversations'),
      where('members', 'array-contains', 'bob'))));
    if (mine.size !== 1) throw new Error('attendu 1 conversation, obtenu ' + mine.size);
    await assertFails(getDocs(collection(fs, 'conversations')));
    await assertFails(getDocs(query(collection(fs, 'conversations'),
      where('members', 'array-contains', 'alice'))));
  });

  test('on ne peut pas s\'ajouter ou ajouter quelqu\'un', async () => {
    await createDm(db('alice'), 'alice', 'bob');
    const ref = (fs) => doc(fs, 'conversations', dmId('alice', 'bob'));
    await assertFails(updateDoc(ref(db('mallory')), { members: arrayUnion('mallory') }));
    await assertFails(updateDoc(ref(db('alice')), { members: arrayUnion('mallory') }));
    await assertFails(updateDoc(ref(db('alice')), { title: 'renommée' }));
  });

  test('on quitte un groupe, pas une discussion à deux', async () => {
    const gid = await seedGroup('g1', ['alice', 'bob', 'carol']);
    await assertFails(updateDoc(doc(db('bob'), 'conversations', gid),
      { members: arrayRemove('carol') }));
    await assertSucceeds(updateDoc(doc(db('bob'), 'conversations', gid),
      { members: arrayRemove('bob') }));
    await assertFails(getDoc(doc(db('bob'), 'conversations', gid)));

    await createDm(db('alice'), 'alice', 'bob');
    await assertFails(updateDoc(doc(db('bob'), 'conversations', dmId('alice', 'bob')),
      { members: arrayRemove('bob') }));
  });

  test('personne ne supprime une conversation', async () => {
    await createDm(db('alice'), 'alice', 'bob');
    await assertFails(deleteDoc(doc(db('alice'), 'conversations', dmId('alice', 'bob'))));
  });
});

describe('messages', () => {
  const cid = dmId('alice', 'bob');

  beforeEach(() => createDm(db('alice'), 'alice', 'bob'));

  test('un membre envoie un message chiffré et met à jour l\'aperçu', async () => {
    await assertSucceeds(post(db('alice'), 'alice', cid, 'Salut Bob'));
    const conv = await getDoc(doc(db('bob'), 'conversations', cid));
    const msgs = await assertSucceeds(getDocs(collection(db('bob'), 'conversations', cid, 'messages')));
    if (msgs.size !== 1) throw new Error('attendu 1 message');
    const stored = msgs.docs[0].data();
    if ('text' in stored || JSON.stringify(stored).includes('Salut Bob')) throw new Error('texte en clair stocké');
    if (conv.data().lastMessage.enc.ct !== stored.enc.ct) throw new Error('aperçu non mis à jour');
  });

  test('un message en clair est refusé', async () => {
    const fs = db('alice');
    const msg = doc(collection(fs, 'conversations', cid, 'messages'));
    const batch = writeBatch(fs);
    batch.set(msg, { uid: 'alice', text: 'en clair', createdAt: serverTimestamp() });
    batch.update(doc(fs, 'conversations', cid), {
      lastMessage: { id: msg.id, uid: 'alice', text: 'en clair', at: serverTimestamp() },
      updatedAt: serverTimestamp(),
      'lastRead.alice': serverTimestamp(),
    });
    await assertFails(batch.commit());
  });

  test('un message sans mise à jour de l\'aperçu est refusé', async () => {
    const fs = db('alice');
    await assertFails(setDoc(doc(collection(fs, 'conversations', cid, 'messages')),
      { uid: 'alice', enc: await encryptFor(['alice', 'bob'], 'seul', cid, 'alice'), createdAt: serverTimestamp() }));
  });

  test('l\'aperçu doit recopier le message chiffré', async () => {
    const other = await encryptFor(['alice', 'bob'], 'autre chose', cid, 'alice');
    await assertFails(post(db('alice'), 'alice', cid, 'vrai texte', { lastMessage: { enc: other } }));
  });

  test('une clé emballée pour chaque membre, et pour personne d\'autre', async () => {
    await assertFails(post(db('alice'), 'alice', cid, 'sans Bob', { members: ['alice'] }));
    await assertFails(post(db('alice'), 'alice', cid, 'avec Mallory', { members: ['alice', 'bob', 'mallory'] }));
  });

  test('un aperçu ne peut pas être réécrit hors d\'un envoi', async () => {
    await post(db('alice'), 'alice', cid, 'premier');
    const conv = await getDoc(doc(db('alice'), 'conversations', cid));
    const old = conv.data().lastMessage;
    await assertFails(updateDoc(doc(db('alice'), 'conversations', cid), {
      lastMessage: { id: old.id, uid: 'alice', enc: old.enc, at: serverTimestamp() },
      updatedAt: serverTimestamp(),
      'lastRead.alice': serverTimestamp(),
    }));
  });

  test('un non-membre ne lit ni n\'écrit', async () => {
    await post(db('alice'), 'alice', cid, 'privé');
    await assertFails(getDocs(collection(db('mallory'), 'conversations', cid, 'messages')));
    await assertFails(post(db('mallory'), 'mallory', cid, 'intrus'));
  });

  test('on ne signe pas un message au nom d\'un autre', async () => {
    await assertFails(post(db('alice'), 'alice', cid, 'faux', {
      message: { uid: 'bob' }, lastMessage: { uid: 'bob' },
    }));
  });

  // Le texte étant chiffré, Firestore ne peut plus vérifier qu'il n'est pas
  // vide (le site s'en charge) ; il borne en revanche sa taille.
  test('message chiffré trop long refusé', async () => {
    // 2000 caractères de 3 octets : le plus long message que le site envoie.
    await assertSucceeds(post(db('alice'), 'alice', cid, '€'.repeat(2000)));
    await assertFails(post(db('alice'), 'alice', cid, '€'.repeat(2100)));
  });

  test('date imposée par le serveur', async () => {
    await assertFails(post(db('alice'), 'alice', cid, 'du passé', {
      message: { createdAt: Timestamp.fromMillis(0) },
    }));
  });

  test('un message envoyé ne se modifie ni ne se supprime', async () => {
    await post(db('alice'), 'alice', cid, 'définitif');
    const msgs = await getDocs(collection(db('alice'), 'conversations', cid, 'messages'));
    const ref = msgs.docs[0].ref;
    await assertFails(updateDoc(ref, { text: 'modifié' }));
    await assertFails(deleteDoc(ref));
  });

  test('accusé de lecture : seulement le sien', async () => {
    await post(db('alice'), 'alice', cid, 'lu ?');
    await assertSucceeds(updateDoc(doc(db('bob'), 'conversations', cid),
      { 'lastRead.bob': serverTimestamp() }));
    await assertFails(updateDoc(doc(db('bob'), 'conversations', cid),
      { 'lastRead.alice': serverTimestamp() }));
    await assertFails(updateDoc(doc(db('mallory'), 'conversations', cid),
      { 'lastRead.mallory': serverTimestamp() }));
  });
});

// Même écriture qu'une photo ou un message vocal de public/main.js : octets
// chiffrés, message (enveloppe v2) et aperçu, ensemble.
async function postMedia(fs, uid, cid, opts = {}) {
  const members = opts.members || ['alice', 'bob'];
  const msg = doc(collection(fs, 'conversations', cid, 'messages'));
  const box = await encryptBlob(opts.bytes || new Uint8Array(2048).fill(7), cid, msg.id);
  const enc = await encryptPayload(
    { t: 'image', caption: '', mime: 'image/webp', w: 10, h: 10, key: box.key, iv: box.iv },
    Object.fromEntries(members.map((m) => [m, ids[m].publicKey])), cid, uid);
  const batch = writeBatch(fs);
  if (!opts.noMedia) {
    batch.set(doc(fs, 'conversations', cid, 'media', opts.mediaId || msg.id), {
      uid, data: Bytes.fromUint8Array(opts.data || box.data), createdAt: serverTimestamp(), ...opts.media,
    });
  }
  if (!opts.noMessage) {
    batch.set(msg, { uid, enc, createdAt: serverTimestamp() });
    batch.update(doc(fs, 'conversations', cid), {
      lastMessage: { id: msg.id, uid, enc, at: serverTimestamp() },
      updatedAt: serverTimestamp(),
      ['lastRead.' + uid]: serverTimestamp(),
    });
  }
  await batch.commit();
  return msg.id;
}

describe('photos et messages vocaux', () => {
  const cid = dmId('alice', 'bob');

  beforeEach(() => createDm(db('alice'), 'alice', 'bob'));

  test('un membre envoie un fichier chiffré avec son message', async () => {
    const mid = await assertSucceeds(postMedia(db('alice'), 'alice', cid));
    const media = await assertSucceeds(getDoc(doc(db('bob'), 'conversations', cid, 'media', mid)));
    if (!(media.data().data instanceof Bytes)) throw new Error('octets attendus');
    await assertFails(getDoc(doc(db('mallory'), 'conversations', cid, 'media', mid)));
    await assertFails(getDocs(collection(db('mallory'), 'conversations', cid, 'media')));
  });

  test('un fichier sans son message, ou rattaché à un autre, est refusé', async () => {
    await assertFails(postMedia(db('alice'), 'alice', cid, { noMessage: true }));
    await assertFails(postMedia(db('alice'), 'alice', cid, { mediaId: 'autre' }));
  });

  test('on ne dépose pas de fichier au nom d\'un autre, ni chez des inconnus', async () => {
    await assertFails(postMedia(db('alice'), 'alice', cid, { media: { uid: 'bob' } }));
    await assertFails(postMedia(db('mallory'), 'mallory', cid));
  });

  test('taille maximale : 1 000 000 d\'octets chiffrés', async () => {
    await assertSucceeds(postMedia(db('alice'), 'alice', cid, { data: new Uint8Array(1000000).fill(1) }));
    await assertFails(postMedia(db('alice'), 'alice', cid, { data: new Uint8Array(1000001).fill(1) }));
    await assertFails(postMedia(db('alice'), 'alice', cid, { data: new Uint8Array(8) }));
  });

  test('aucune métadonnée en clair à côté des octets chiffrés', async () => {
    await assertFails(postMedia(db('alice'), 'alice', cid, { media: { mime: 'image/jpeg' } }));
    await assertFails(postMedia(db('alice'), 'alice', cid, { media: { data: 'pas des octets' } }));
  });

  test('un fichier envoyé ne se modifie ni ne se supprime', async () => {
    const mid = await postMedia(db('alice'), 'alice', cid);
    const ref = doc(db('alice'), 'conversations', cid, 'media', mid);
    await assertFails(updateDoc(ref, { data: Bytes.fromUint8Array(new Uint8Array(100)) }));
    await assertFails(deleteDoc(ref));
  });

  test('enveloppe v2 sans fichier (journal d\'appel) acceptée, version inconnue refusée', async () => {
    const recipients = { alice: ids.alice.publicKey, bob: ids.bob.publicKey };
    const enc = await encryptPayload({ t: 'call', video: false, status: 'missed', duration: 0 }, recipients, cid, 'alice');
    await assertSucceeds(post(db('alice'), 'alice', cid, '', { enc }));
    await assertFails(post(db('alice'), 'alice', cid, '', { enc: { ...enc, v: 3 } }));
  });
});

describe('« … écrit »', () => {
  const cid = dmId('alice', 'bob');
  const ref = (uid) => doc(db(uid), 'conversations', cid);

  beforeEach(() => createDm(db('alice'), 'alice', 'bob'));

  test('chacun signale seulement sa propre saisie, à l\'heure du serveur', async () => {
    await assertSucceeds(updateDoc(ref('alice'), { 'typing.alice': serverTimestamp() }));
    await assertSucceeds(updateDoc(ref('bob'), { 'typing.bob': serverTimestamp() }));
    await assertSucceeds(updateDoc(ref('alice'), { 'typing.alice': serverTimestamp() }));
    await assertFails(updateDoc(ref('alice'), { 'typing.bob': serverTimestamp() }));
    await assertFails(updateDoc(ref('alice'), { 'typing.alice': Timestamp.fromMillis(0) }));
    await assertFails(updateDoc(ref('mallory'), { 'typing.mallory': serverTimestamp() }));
  });

  test('la saisie ne sert pas à modifier autre chose', async () => {
    await assertFails(updateDoc(ref('alice'), { 'typing.alice': serverTimestamp(), title: 'x' }));
    await assertFails(updateDoc(ref('alice'), { typing: 'oui' }));
  });
});

describe('appels', () => {
  const cid = dmId('alice', 'bob');
  const offer = { type: 'offer', sdp: 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\n' };
  const answer = { type: 'answer', sdp: 'v=0\r\no=- 3 4 IN IP4 127.0.0.1\r\n' };
  const call = (over = {}) => ({
    cid, caller: 'alice', callee: 'bob', video: true, status: 'ringing', offer, createdAt: serverTimestamp(), ...over,
  });
  const ref = (uid, id = 'appel1') => doc(db(uid), 'calls', id);

  beforeEach(() => createDm(db('alice'), 'alice', 'bob'));

  test('on appelle l\'autre membre d\'une discussion à deux', async () => {
    await assertSucceeds(setDoc(ref('alice'), call()));
    await assertSucceeds(getDoc(ref('bob')));
    await assertFails(getDoc(ref('mallory')));
  });

  test('refuse un appel hors discussion à deux, usurpé ou mal formé', async () => {
    const gid = await seedGroup('g1', ['alice', 'bob', 'carol']);
    await assertFails(setDoc(ref('alice', 'g'), call({ cid: gid })));
    await assertFails(setDoc(ref('alice', 'm'), call({ callee: 'mallory' })));
    await assertFails(setDoc(ref('mallory', 'x'), call({ caller: 'mallory', callee: 'bob' })));
    await assertFails(setDoc(ref('bob', 'u'), call()));
    await assertFails(setDoc(ref('alice', 's'), call({ status: 'accepted' })));
    await assertFails(setDoc(ref('alice', 'o'), call({ offer: { type: 'answer', sdp: 'x' } })));
    await assertFails(setDoc(ref('alice', 't'), call({ createdAt: Timestamp.fromMillis(0) })));
    await assertFails(setDoc(ref('alice', 'e'), call({ answer })));
  });

  test('l\'appelé voit les appels qui lui sonnent, et seulement les siens', async () => {
    await setDoc(ref('alice'), call());
    const ringing = await assertSucceeds(getDocs(query(collection(db('bob'), 'calls'),
      where('callee', '==', 'bob'), where('status', '==', 'ringing'))));
    if (ringing.size !== 1) throw new Error('attendu 1 appel');
    await assertFails(getDocs(collection(db('bob'), 'calls')));
    await assertFails(getDocs(query(collection(db('mallory'), 'calls'), where('callee', '==', 'bob'))));
  });

  test('décrocher puis raccrocher', async () => {
    await setDoc(ref('alice'), call());
    await assertFails(updateDoc(ref('alice'), { status: 'accepted', answer, answeredAt: serverTimestamp() }));
    await assertFails(updateDoc(ref('bob'), { status: 'accepted', answer: offer, answeredAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref('bob'), { status: 'accepted', answer, answeredAt: serverTimestamp() }));
    await assertFails(updateDoc(ref('bob'), { status: 'ended', endedAt: serverTimestamp(), endedBy: 'alice' }));
    await assertSucceeds(updateDoc(ref('alice'), { status: 'ended', endedAt: serverTimestamp(), endedBy: 'alice' }));
    await assertFails(updateDoc(ref('bob'), { status: 'accepted', answer, answeredAt: serverTimestamp() }));
  });

  test('refuser (appelé) ou renoncer (appelant), seulement pendant la sonnerie', async () => {
    await setDoc(ref('alice', 'a'), call());
    await assertFails(updateDoc(ref('alice', 'a'), { status: 'declined', endedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref('bob', 'a'), { status: 'declined', endedAt: serverTimestamp() }));
    await setDoc(ref('alice', 'b'), call());
    await assertFails(updateDoc(ref('bob', 'b'), { status: 'missed', endedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref('alice', 'b'), { status: 'missed', endedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref('bob', 'b'), { status: 'accepted', answer, answeredAt: serverTimestamp() }));
    await assertFails(updateDoc(ref('mallory', 'b'), { status: 'ended', endedAt: serverTimestamp(), endedBy: 'mallory' }));
  });

  test('candidats ICE : chacun écrit les siens, les deux les lisent', async () => {
    await setDoc(ref('alice'), call());
    const cand = { candidate: 'candidate:1 1 udp 2122260223 192.168.1.2 50000 typ host', sdpMid: '0',
      sdpMLineIndex: 0, usernameFragment: 'abcd' };
    await assertSucceeds(setDoc(doc(db('alice'), 'calls', 'appel1', 'callerCandidates', 'c1'), cand));
    await assertSucceeds(setDoc(doc(db('bob'), 'calls', 'appel1', 'calleeCandidates', 'c1'), cand));
    await assertFails(setDoc(doc(db('bob'), 'calls', 'appel1', 'callerCandidates', 'c2'), cand));
    await assertFails(setDoc(doc(db('alice'), 'calls', 'appel1', 'calleeCandidates', 'c2'), cand));
    await assertFails(setDoc(doc(db('alice'), 'calls', 'appel1', 'callerCandidates', 'c3'), { ...cand, extra: 1 }));
    await assertSucceeds(getDocs(collection(db('bob'), 'calls', 'appel1', 'callerCandidates')));
    await assertSucceeds(getDocs(collection(db('alice'), 'calls', 'appel1', 'calleeCandidates')));
    await assertFails(getDocs(collection(db('mallory'), 'calls', 'appel1', 'callerCandidates')));
  });

  test('personne ne supprime un appel', async () => {
    await setDoc(ref('alice'), call());
    await assertFails(deleteDoc(ref('alice')));
  });
});

describe('groupes : membres', () => {
  const ref = (uid, gid = 'g1') => doc(db(uid), 'conversations', gid);

  beforeEach(() => seedUsers('alice', 'bob', 'carol', 'dave', 'mallory'));

  test('le créateur ajoute les membres un par un', async () => {
    const fs = db('alice');
    const group = doc(collection(fs, 'conversations'));
    await setDoc(group, newGroup('alice'));
    await assertSucceeds(addMember(fs, group.id, 'bob'));
    await assertSucceeds(addMember(fs, group.id, 'carol'));
    const data = (await getDoc(group)).data();
    if (data.members.join() !== 'alice,bob,carol') throw new Error('membres : ' + data.members);
    await assertSucceeds(getDoc(doc(db('bob'), 'conversations', group.id)));
  });

  test('un seul membre à la fois, un compte qui existe, 20 membres au plus', async () => {
    await seedGroup('g1', ['alice']);
    await assertFails(updateDoc(ref('alice'), { members: arrayUnion('bob', 'carol') }));
    await assertFails(updateDoc(ref('alice'), { members: arrayUnion('inconnu') }));
    await assertFails(updateDoc(ref('alice'), { members: ['bob'] }));
    const many = ['alice', ...Array.from({ length: 19 }, (_, i) => 'u' + i)];
    await seedGroup('g2', many);
    await assertFails(addMember(db('alice'), 'g2', 'bob'));
  });

  test('ajout réservé aux admins si le groupe le demande', async () => {
    await seedGroup('g1', ['alice', 'bob'], { perms: { ...PERMS, add: 'admins' } });
    await assertFails(addMember(db('bob'), 'g1', 'carol'));
    await assertSucceeds(addMember(db('alice'), 'g1', 'carol'));
    await seedGroup('g2', ['alice', 'bob']);
    await assertSucceeds(addMember(db('bob'), 'g2', 'carol'));
    await assertFails(addMember(db('mallory'), 'g2', 'mallory'));
  });

  test('personne n\'est ajouté par quelqu\'un qu\'il a bloqué', async () => {
    await seedGroup('g1', ['alice', 'bob']);
    await setDoc(doc(db('carol'), 'settings', 'carol'), { blocked: ['alice'] });
    await assertFails(addMember(db('alice'), 'g1', 'carol'));
    await assertSucceeds(addMember(db('bob'), 'g1', 'carol'));
  });

  test('un admin retire un membre ; un membre ne retire personne', async () => {
    await seedGroup('g1', ['alice', 'bob', 'carol', 'dave'], { admins: ['alice', 'bob'] });
    await assertFails(updateDoc(ref('carol'), { members: arrayRemove('dave') }));
    await assertFails(updateDoc(ref('alice'), { members: ['alice', 'bob'] }));
    await assertSucceeds(updateDoc(ref('alice'), { members: arrayRemove('dave') }));
    // Un admin retiré perd ses droits dans la même écriture.
    await assertFails(updateDoc(ref('alice'), { members: arrayRemove('bob') }));
    await assertSucceeds(updateDoc(ref('alice'), { members: arrayRemove('bob'), admins: ['alice'] }));
    await assertFails(updateDoc(ref('alice'), { members: arrayRemove('alice'), admins: ['carol'], title: 'x' }));
  });

  test('le propriétaire ne peut pas être retiré', async () => {
    await seedGroup('g1', ['alice', 'bob', 'carol'], { admins: ['alice', 'bob'] });
    await assertFails(updateDoc(ref('bob'), { members: arrayRemove('alice'), admins: ['bob'] }));
    await assertFails(updateDoc(ref('bob'), { members: arrayRemove('alice') }));
  });

  test('le dernier admin qui part passe la main', async () => {
    await seedGroup('g1', ['alice', 'bob', 'carol']);
    await assertFails(updateDoc(ref('alice'), { members: arrayRemove('alice') }));
    await assertFails(updateDoc(ref('alice'), { members: arrayRemove('alice'), admins: [] }));
    await assertFails(updateDoc(ref('alice'), { members: arrayRemove('alice'), admins: ['mallory'] }));
    await assertSucceeds(updateDoc(ref('alice'), { members: arrayRemove('alice'), admins: ['bob'] }));
    await assertSucceeds(updateDoc(ref('carol'), { members: arrayRemove('carol') }));
    // Dernier membre : il part, le groupe reste vide.
    await assertSucceeds(updateDoc(ref('bob'), { members: arrayRemove('bob'), admins: [] }));
  });

  test('ancien groupe (sans admins) : son créateur en est l\'admin', async () => {
    await seedGroup('g1', ['alice', 'bob', 'carol'], { legacy: true });
    await assertFails(updateDoc(ref('bob'), { members: arrayRemove('carol') }));
    await assertSucceeds(updateDoc(ref('alice'), { members: arrayRemove('carol'), admins: ['alice'] }));
    await assertSucceeds(addMember(db('bob'), 'g1', 'dave'));
    await assertSucceeds(updateDoc(ref('bob'), { title: 'Nouveau nom' }));
  });
});

describe('groupes : rôles et réglages', () => {
  const ref = (uid, gid = 'g1') => doc(db(uid), 'conversations', gid);

  test('un admin donne ou retire les droits d\'admin, un à la fois', async () => {
    await seedGroup('g1', ['alice', 'bob', 'carol', 'dave']);
    await assertFails(updateDoc(ref('bob'), { admins: arrayUnion('bob') }));
    await assertFails(updateDoc(ref('alice'), { admins: arrayUnion('mallory') }));
    await assertFails(updateDoc(ref('alice'), { admins: arrayUnion('bob', 'carol') }));
    await assertSucceeds(updateDoc(ref('alice'), { admins: arrayUnion('bob') }));
    await assertSucceeds(updateDoc(ref('bob'), { admins: arrayUnion('carol') }));
    await assertSucceeds(updateDoc(ref('bob'), { admins: arrayRemove('carol') }));
    await assertFails(updateDoc(ref('dave'), { admins: arrayRemove('bob') }));
  });

  test('seul le propriétaire retire ses propres droits ; il reste un admin', async () => {
    await seedGroup('g1', ['alice', 'bob', 'carol'], { admins: ['alice', 'bob'] });
    await assertFails(updateDoc(ref('bob'), { admins: arrayRemove('alice') }));
    await assertSucceeds(updateDoc(ref('alice'), { admins: arrayRemove('alice') }));
    await assertFails(updateDoc(ref('bob'), { admins: arrayRemove('bob') }));
  });

  test('groupe sans admin : un membre peut se désigner', async () => {
    await seedGroup('g1', ['bob', 'carol'], { createdBy: 'alice', legacy: true });
    await assertFails(updateDoc(ref('bob'), { admins: ['bob', 'carol'] }));
    await assertSucceeds(updateDoc(ref('bob'), { admins: ['bob'] }));
    await assertFails(updateDoc(ref('carol'), { admins: ['carol'] }));
  });

  test('nom et description : par tous, ou par les admins seulement', async () => {
    await seedGroup('g1', ['alice', 'bob']);
    await assertSucceeds(updateDoc(ref('bob'), { title: 'Week-end', description: 'Départ vendredi' }));
    await assertFails(updateDoc(ref('bob'), { title: '' }));
    await assertFails(updateDoc(ref('bob'), { description: 'd'.repeat(301) }));
    await assertFails(updateDoc(ref('bob'), { title: 'x', members: arrayUnion('carol') }));
    await seedGroup('g2', ['alice', 'bob'], { perms: { ...PERMS, info: 'admins' } });
    await assertFails(updateDoc(ref('bob', 'g2'), { title: 'Pris' }));
    await assertSucceeds(updateDoc(ref('alice', 'g2'), { title: 'Repris' }));
    await assertFails(updateDoc(ref('mallory', 'g2'), { title: 'Intrus' }));
  });

  test('les réglages du groupe sont réservés aux admins', async () => {
    await seedGroup('g1', ['alice', 'bob']);
    const locked = { send: 'admins', info: 'admins', add: 'admins' };
    await assertFails(updateDoc(ref('bob'), { perms: locked }));
    await assertFails(updateDoc(ref('alice'), { perms: { ...locked, send: 'moi' } }));
    await assertFails(updateDoc(ref('alice'), { perms: { send: 'admins' } }));
    await assertSucceeds(updateDoc(ref('alice'), { perms: locked }));
  });

  test('écriture réservée aux admins', async () => {
    const members = ['alice', 'bob'];
    await seedGroup('g1', members, { perms: { ...PERMS, send: 'admins' } });
    await assertFails(post(db('bob'), 'bob', 'g1', 'je peux ?', { members }));
    await assertSucceeds(post(db('alice'), 'alice', 'g1', 'annonce', { members }));
  });
});

describe('groupes : privé de parole', () => {
  const members = ['alice', 'bob', 'carol'];
  const until = (ms) => Timestamp.fromMillis(Date.now() + ms);
  const restrict = (uid, target, ms = 3600e3, over = {}) =>
    setDoc(doc(db(uid), 'conversations', 'g1', 'restrictions', target),
      { until: until(ms), by: uid, at: serverTimestamp(), ...over });

  beforeEach(() => seedGroup('g1', members, { admins: ['alice', 'carol'] }).then(() =>
    seedUsers('alice', 'bob', 'carol', 'mallory')));

  test('un admin retire la parole à un membre, pour un temps', async () => {
    await assertSucceeds(restrict('alice', 'bob'));
    await assertFails(post(db('bob'), 'bob', 'g1', 'chut', { members }));
    await assertSucceeds(post(db('alice'), 'alice', 'g1', 'ok', { members }));
    await assertSucceeds(getDoc(doc(db('bob'), 'conversations', 'g1', 'restrictions', 'bob')));
    await assertSucceeds(getDocs(collection(db('bob'), 'conversations', 'g1', 'restrictions')));
    await assertFails(getDocs(collection(db('mallory'), 'conversations', 'g1', 'restrictions')));
    // Rendre la parole.
    await assertFails(deleteDoc(doc(db('bob'), 'conversations', 'g1', 'restrictions', 'bob')));
    await assertSucceeds(deleteDoc(doc(db('carol'), 'conversations', 'g1', 'restrictions', 'bob')));
    await assertSucceeds(post(db('bob'), 'bob', 'g1', 'merci', { members }));
  });

  test('une fois le délai passé, le membre écrit à nouveau', async () => {
    await seed((fs) => setDoc(doc(fs, 'conversations', 'g1', 'restrictions', 'bob'),
      { until: Timestamp.fromMillis(Date.now() - 1000), by: 'alice', at: Timestamp.now() }));
    await assertSucceeds(post(db('bob'), 'bob', 'g1', 'de retour', { members }));
  });

  test('ni un membre, ni contre un admin, ni plus de 30 jours', async () => {
    await assertFails(restrict('bob', 'alice'));
    await assertFails(restrict('alice', 'carol'));
    await assertFails(restrict('alice', 'alice'));
    await assertFails(restrict('alice', 'mallory'));
    await assertFails(restrict('alice', 'bob', 31 * 864e5));
    await assertFails(restrict('alice', 'bob', -1000));
    await assertFails(restrict('alice', 'bob', 3600e3, { by: 'carol' }));
    await assertFails(restrict('alice', 'bob', 3600e3, { raison: 'spam' }));
    await assertSucceeds(restrict('alice', 'bob', 30 * 864e5 - 60e3));
  });
});

describe('blocage', () => {
  const cid = dmId('alice', 'bob');
  const block = (uid, ...who) => setDoc(doc(db(uid), 'settings', uid), { blocked: who });

  test('réglages privés : seul leur propriétaire les lit et les écrit', async () => {
    await assertSucceeds(setDoc(doc(db('bob'), 'settings', 'bob'),
      { blocked: ['alice'], muted: { [cid]: Date.now() + 3600e3 } }));
    await assertSucceeds(getDoc(doc(db('bob'), 'settings', 'bob')));
    await assertFails(getDoc(doc(db('alice'), 'settings', 'bob')));
    await assertFails(getDocs(collection(db('bob'), 'settings')));
    await assertFails(setDoc(doc(db('alice'), 'settings', 'bob'), { blocked: [] }));
    await assertFails(setDoc(doc(db('bob'), 'settings', 'bob'), { blocked: ['bob'] }));
    await assertFails(setDoc(doc(db('bob'), 'settings', 'bob'), { blocked: 'alice' }));
    await assertFails(setDoc(doc(db('bob'), 'settings', 'bob'), { theme: 'sombre' }));
    await assertFails(setDoc(doc(db('bob'), 'settings', 'bob'),
      { blocked: Array.from({ length: 501 }, (_, i) => 'u' + i) }));
  });

  test('une personne bloquée n\'écrit plus, jusqu\'au déblocage', async () => {
    await createDm(db('alice'), 'alice', 'bob');
    await assertSucceeds(post(db('alice'), 'alice', cid, 'avant'));
    await block('bob', 'alice');
    await assertFails(post(db('alice'), 'alice', cid, 'pendant'));
    await assertFails(postMedia(db('alice'), 'alice', cid));
    await block('bob');
    await assertSucceeds(post(db('alice'), 'alice', cid, 'après'));
  });

  test('ni nouvelle discussion, ni appel vers qui nous a bloqués', async () => {
    await block('bob', 'alice');
    await assertFails(createDm(db('alice'), 'alice', 'bob'));
    await assertSucceeds(createDm(db('bob'), 'bob', 'alice'));
    const offer = { type: 'offer', sdp: 'v=0\r\n' };
    await assertFails(setDoc(doc(db('alice'), 'calls', 'c1'), {
      cid, caller: 'alice', callee: 'bob', video: false, status: 'ringing', offer, createdAt: serverTimestamp(),
    }));
  });

  test('dans un groupe, le blocage n\'empêche pas d\'écrire aux autres', async () => {
    const members = ['alice', 'bob', 'carol'];
    await seedGroup('g1', members);
    await block('bob', 'alice');
    await assertSucceeds(post(db('alice'), 'alice', 'g1', 'bonjour à tous', { members }));
  });
});
