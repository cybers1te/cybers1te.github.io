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

let env;

before(async () => {
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

function post(fs, uid, cid, text, overrides = {}) {
  const msg = doc(collection(fs, 'conversations', cid, 'messages'));
  const batch = writeBatch(fs);
  batch.set(msg, { uid, text, createdAt: serverTimestamp(), ...overrides.message });
  batch.update(doc(fs, 'conversations', cid), {
    lastMessage: { id: msg.id, uid, text, at: serverTimestamp(), ...overrides.lastMessage },
    updatedAt: serverTimestamp(),
    ['lastRead.' + uid]: serverTimestamp(),
  });
  return batch.commit();
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

  test('un membre envoie un message et met à jour l\'aperçu', async () => {
    await assertSucceeds(post(db('alice'), 'alice', cid, 'Salut Bob'));
    const conv = await getDoc(doc(db('bob'), 'conversations', cid));
    if (conv.data().lastMessage.text !== 'Salut Bob') throw new Error('aperçu non mis à jour');
    const msgs = await assertSucceeds(getDocs(collection(db('bob'), 'conversations', cid, 'messages')));
    if (msgs.size !== 1) throw new Error('attendu 1 message');
  });

  test('un message sans mise à jour de l\'aperçu est refusé', async () => {
    const fs = db('alice');
    await assertFails(setDoc(doc(collection(fs, 'conversations', cid, 'messages')),
      { uid: 'alice', text: 'seul', createdAt: serverTimestamp() }));
  });

  test('l\'aperçu doit recopier le texte du message', async () => {
    await assertFails(post(db('alice'), 'alice', cid, 'vrai texte',
      { lastMessage: { text: 'autre chose' } }));
  });

  test('un aperçu ne peut pas être réécrit hors d\'un envoi', async () => {
    await post(db('alice'), 'alice', cid, 'premier');
    const conv = await getDoc(doc(db('alice'), 'conversations', cid));
    const old = conv.data().lastMessage.id;
    await assertFails(updateDoc(doc(db('alice'), 'conversations', cid), {
      lastMessage: { id: old, uid: 'alice', text: 'premier', at: serverTimestamp() },
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

  test('texte vide ou trop long refusé', async () => {
    await assertFails(post(db('alice'), 'alice', cid, ''));
    await assertFails(post(db('alice'), 'alice', cid, 'x'.repeat(2001)));
    await assertSucceeds(post(db('alice'), 'alice', cid, 'x'.repeat(2000)));
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
