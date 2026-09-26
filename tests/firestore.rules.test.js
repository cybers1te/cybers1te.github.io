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
  encryptMessage,
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

  test('groupe : 2 à 20 membres distincts et un titre', async () => {
    const fs = db('alice');
    await assertSucceeds(setDoc(doc(collection(fs, 'conversations')),
      newConversation(fs, 'alice', ['alice', 'bob', 'carol'])));
    await assertFails(setDoc(doc(collection(fs, 'conversations')),
      newConversation(fs, 'alice', ['alice', 'bob'], { title: '' })));
    await assertFails(setDoc(doc(collection(fs, 'conversations')),
      newConversation(fs, 'alice', ['alice', 'alice'])));
    const many = ['alice', ...Array.from({ length: 20 }, (_, i) => 'u' + i)];
    await assertFails(setDoc(doc(collection(fs, 'conversations')),
      newConversation(fs, 'alice', many)));
  });

  test('refuse un aperçu pré-rempli à la création', async () => {
    const fs = db('alice');
    const data = newConversation(fs, 'alice', ['alice', 'bob']);
    data.lastMessage = { id: 'x', uid: 'bob', text: 'faux', at: serverTimestamp() };
    await assertFails(setDoc(doc(collection(fs, 'conversations')), data));
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
    const fs = db('alice');
    const group = doc(collection(fs, 'conversations'));
    await setDoc(group, newConversation(fs, 'alice', ['alice', 'bob', 'carol']));
    await assertFails(updateDoc(doc(db('bob'), 'conversations', group.id),
      { members: arrayRemove('carol') }));
    await assertSucceeds(updateDoc(doc(db('bob'), 'conversations', group.id),
      { members: arrayRemove('bob') }));
    await assertFails(getDoc(doc(db('bob'), 'conversations', group.id)));

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
