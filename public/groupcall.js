// Appels de groupe de message-me (WebRTC), 4 personnes au plus.
//
// Chaque participant est relié directement à chacun des autres (maillage) :
// avec 4 personnes, chacun envoie son son et son image 3 fois, ce qui reste
// raisonnable pour une connexion ordinaire. Firestore sert seulement à se
// trouver (rooms/{rid}, voir firestore.rules) :
//   - rooms/{rid}.participants : qui est dans l'appel ;
//   - rooms/{rid}.beats        : dernier signe de vie de chacun (toutes les
//     20 s) ; un participant muet depuis plus d'une minute (onglet fermé
//     brutalement) est retiré par les autres ;
//   - rooms/{rid}/links        : une offre de chaque nouveau venu vers chaque
//     participant déjà là, sa réponse, et leurs candidats ICE.

const BEAT_MS = 20000;
const STALE_MS = 60000;
const MAX = 4;
const DEFAULT_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];

const ts = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : 0);

function candidateData(c) {
  return {
    candidate: c.candidate,
    sdpMid: c.sdpMid ?? null,
    sdpMLineIndex: c.sdpMLineIndex ?? null,
    usernameFragment: c.usernameFragment ?? null,
  };
}

async function localMedia(video) {
  const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio, video: video ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
    });
    return { stream, camera: video };
  } catch (err) {
    if (!video) throw err;
    return { stream: await navigator.mediaDevices.getUserMedia({ audio, video: false }), camera: false };
  }
}

const fail = (code) => Object.assign(new Error(code), { code });

/**
 * onChange(room) : l'appel en cours a changé (null quand il se termine).
 * room = { id, cid, video, local, micOn, camOn, startedAt, peers: Map(uid -> { remote, state }) }
 */
export function createGroupCalls({ F, db, uid, iceServers, onChange }) {
  const ice = [...DEFAULT_ICE, ...(Array.isArray(iceServers) ? iceServers : [])];
  let room = null;

  const change = () => onChange(room);

  /* Retire les participants silencieux depuis plus d'une minute. */
  function sweep(ref, d, now) {
    const stale = (d.participants || []).filter((p) => p !== uid && ts((d.beats || {})[p]) < now - STALE_MS);
    return Promise.all(stale.map((p) => F.updateDoc(ref, {
      participants: F.arrayRemove(p), ['beats.' + p]: F.deleteField(),
    }).catch(() => {}))).then(() => stale);
  }

  /* Lance un appel dans le groupe `cid`, ou rejoint celui qui y est annoncé. */
  async function start(conv, video) {
    if (room) throw fail('busy');
    if (conv.room && conv.room.id) {
      const joined = await join(conv).catch((err) => {
        if (err.code === 'gone') return null;
        throw err;
      });
      if (joined) return;
    }
    const { stream, camera } = await localMedia(video);
    try {
      const ref = F.doc(F.collection(db, 'rooms'));
      const batch = F.writeBatch(db);
      batch.set(ref, {
        cid: conv.id, by: uid, video, createdAt: F.serverTimestamp(),
        participants: [uid], beats: { [uid]: F.serverTimestamp() },
      });
      batch.update(F.doc(db, 'conversations', conv.id), {
        room: { id: ref.id, video, at: F.serverTimestamp(), by: uid },
      });
      await batch.commit();
      enter(ref, conv.id, video, stream, camera, []);
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      throw err;
    }
  }

  async function join(conv) {
    if (room) throw fail('busy');
    const ref = F.doc(db, 'rooms', conv.room.id);
    const snap = await F.getDoc(ref);
    if (!snap.exists()) throw fail('gone');
    const d = snap.data({ serverTimestamps: 'estimate' });
    const now = Math.max(Date.now(), ...Object.values(d.beats || {}).map(ts));
    const gone = await sweep(ref, d, now);
    const others = (d.participants || []).filter((p) => p !== uid && !gone.includes(p));
    // Plus personne dans cet appel : on en lance un nouveau.
    if (!others.length) throw fail('gone');
    if (others.length >= MAX) throw fail('full');
    const { stream, camera } = await localMedia(Boolean(d.video));
    try {
      await F.updateDoc(ref, { participants: F.arrayUnion(uid), ['beats.' + uid]: F.serverTimestamp() });
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      throw err.code === 'permission-denied' ? fail('full') : err;
    }
    enter(ref, conv.id, Boolean(d.video), stream, camera, others);
    return true;
  }

  function enter(ref, cid, video, stream, camera, others) {
    room = {
      id: ref.id, ref, cid, video, local: stream, micOn: true, camOn: camera,
      startedAt: Date.now(), peers: new Map(), participants: [uid, ...others],
      unsubs: [], joinedAt: 0, waiting: [], beatTimer: null,
    };
    const r = room;
    change();

    r.unsubs.push(F.onSnapshot(ref, (snap) => {
      if (room !== r) return;
      const d = snap.data({ serverTimestamps: 'estimate' });
      if (!d) { leave('gone'); return; }
      r.participants = d.participants || [];
      r.beats = d.beats || {};
      if (!r.participants.includes(uid)) {
        // Retiré par les autres (plus de signe de vie) : on sort proprement.
        if (!snap.metadata.hasPendingWrites) leave('removed');
        return;
      }
      if (!r.joinedAt && !snap.metadata.hasPendingWrites) {
        r.joinedAt = ts(r.beats[uid]) || Date.now();
        for (const w of r.waiting.splice(0)) answerLink(r, w);
      }
      for (const p of [...r.peers.keys()]) if (!r.participants.includes(p)) dropPeer(r, p);
      change();
    }, () => {}));

    r.unsubs.push(F.onSnapshot(F.query(F.collection(ref, 'links'), F.where('to', '==', uid)), (snap) => {
      for (const ch of snap.docChanges()) {
        if (ch.type !== 'added') continue;
        if (r.joinedAt) answerLink(r, ch.doc);
        else r.waiting.push(ch.doc);
      }
    }, () => {}));

    for (const p of others) offerTo(r, p).catch(() => dropPeer(r, p));

    r.beatTimer = setInterval(() => {
      if (room !== r) return;
      F.updateDoc(ref, { ['beats.' + uid]: F.serverTimestamp() }).catch(() => {});
      const mine = ts((r.beats || {})[uid]);
      if (mine) sweep(ref, { participants: r.participants, beats: r.beats }, mine);
    }, BEAT_MS);
  }

  function makePeer(r, p, role) {
    const pc = new RTCPeerConnection({ iceServers: ice });
    const peer = { uid: p, pc, role, remote: new MediaStream(), state: 'connecting', pending: [], unsubs: [], answered: false };
    for (const t of r.local.getTracks()) pc.addTrack(t, r.local);
    pc.ontrack = (e) => {
      peer.remote = e.streams && e.streams[0] ? e.streams[0] : peer.remote;
      if (!e.streams || !e.streams[0]) peer.remote.addTrack(e.track);
      e.track.onmute = change;
      e.track.onunmute = change;
      change();
    };
    pc.onconnectionstatechange = () => {
      peer.state = pc.connectionState;
      change();
    };
    r.peers.set(p, peer);
    return peer;
  }

  function addRemote(peer, data) {
    const cand = new RTCIceCandidate(data);
    if (peer.pc.remoteDescription) peer.pc.addIceCandidate(cand).catch(() => {});
    else peer.pending.push(cand);
  }

  function flush(peer) {
    for (const cand of peer.pending.splice(0)) peer.pc.addIceCandidate(cand).catch(() => {});
  }

  async function offerTo(r, p) {
    const peer = makePeer(r, p, 'offerer');
    const link = F.doc(F.collection(r.ref, 'links'));
    peer.link = link;
    const out = F.collection(link, 'fromCandidates');
    const queue = [];
    let created = false;
    peer.pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const data = candidateData(e.candidate);
      if (created) F.addDoc(out, data).catch(() => {});
      else queue.push(data);
    };
    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(offer);
    await F.setDoc(link, { from: uid, to: p, offer: { type: offer.type, sdp: offer.sdp }, createdAt: F.serverTimestamp() });
    created = true;
    for (const data of queue.splice(0)) F.addDoc(out, data).catch(() => {});
    peer.unsubs.push(F.onSnapshot(link, (snap) => {
      const d = snap.data();
      if (!d || !d.answer || peer.answered || room !== r) return;
      peer.answered = true;
      peer.pc.setRemoteDescription(d.answer).then(() => flush(peer)).catch(() => dropPeer(r, p));
    }, () => {}));
    peer.unsubs.push(F.onSnapshot(F.collection(link, 'toCandidates'), (snap) => {
      for (const ch of snap.docChanges()) if (ch.type === 'added') addRemote(peer, ch.doc.data());
    }, () => {}));
  }

  async function answerLink(r, docSnap) {
    const d = docSnap.data({ serverTimestamps: 'estimate' });
    if (room !== r || d.to !== uid || !r.participants.includes(d.from)) return;
    // Une offre d'une session précédente (avant mon arrivée) ne vaut plus.
    if (ts(d.createdAt) < r.joinedAt - 5000) return;
    const existing = r.peers.get(d.from);
    if (existing) {
      // Arrivés en même temps, chacun a fait une offre : celle du plus petit
      // identifiant l'emporte.
      if (existing.role === 'offerer' && d.from < uid) dropPeer(r, d.from);
      else return;
    }
    const peer = makePeer(r, d.from, 'answerer');
    peer.link = docSnap.ref;
    const out = F.collection(docSnap.ref, 'toCandidates');
    peer.pc.onicecandidate = (e) => { if (e.candidate) F.addDoc(out, candidateData(e.candidate)).catch(() => {}); };
    try {
      await peer.pc.setRemoteDescription(d.offer);
      flush(peer);
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      await F.updateDoc(docSnap.ref, { answer: { type: answer.type, sdp: answer.sdp } });
    } catch {
      dropPeer(r, d.from);
      return;
    }
    peer.unsubs.push(F.onSnapshot(F.collection(docSnap.ref, 'fromCandidates'), (snap) => {
      for (const ch of snap.docChanges()) if (ch.type === 'added') addRemote(peer, ch.doc.data());
    }, () => {}));
  }

  function dropPeer(r, p) {
    const peer = r.peers.get(p);
    if (!peer) return;
    r.peers.delete(p);
    for (const u of peer.unsubs) u();
    try { peer.pc.close(); } catch { /* déjà fermée */ }
    if (room === r) change();
  }

  /* Quitter l'appel. Le dernier à partir retire l'annonce du groupe. */
  async function leave(reason = 'left') {
    const r = room;
    if (!r) return;
    room = null;
    clearInterval(r.beatTimer);
    for (const u of r.unsubs) u();
    for (const p of [...r.peers.keys()]) dropPeer(r, p);
    r.local.getTracks().forEach((t) => t.stop());
    onChange(null);
    if (reason === 'removed' || reason === 'gone') return;
    try {
      const snap = await F.getDoc(r.ref);
      const d = snap.exists() ? snap.data() : { participants: [] };
      const others = (d.participants || []).filter((p) => p !== uid);
      const batch = F.writeBatch(db);
      batch.update(r.ref, { participants: F.arrayRemove(uid), ['beats.' + uid]: F.deleteField() });
      if (!others.length) batch.update(F.doc(db, 'conversations', r.cid), { room: F.deleteField() });
      await batch.commit();
    } catch {
      // Les autres le retireront faute de signe de vie.
    }
  }

  /* Annonce restée affichée alors que plus personne n'est dans l'appel. */
  async function tidy(conv) {
    if (!conv.room || !conv.room.id || (room && room.id === conv.room.id)) return;
    try {
      const ref = F.doc(db, 'rooms', conv.room.id);
      const snap = await F.getDoc(ref);
      const d = snap.exists() ? snap.data({ serverTimestamps: 'estimate' }) : null;
      if (d) {
        const now = Math.max(Date.now(), ...Object.values(d.beats || {}).map(ts));
        const gone = await sweep(ref, d, now);
        if ((d.participants || []).filter((p) => !gone.includes(p)).length) return;
      }
      await F.updateDoc(F.doc(db, 'conversations', conv.id), { room: F.deleteField() });
    } catch {
      // Rien à ranger, ou pas le droit : sans conséquence.
    }
  }

  function toggleMic() {
    if (!room) return;
    room.micOn = !room.micOn;
    room.local.getAudioTracks().forEach((t) => { t.enabled = room.micOn; });
    change();
  }

  function toggleCam() {
    if (!room || !room.local.getVideoTracks().length) return;
    room.camOn = !room.camOn;
    room.local.getVideoTracks().forEach((t) => { t.enabled = room.camOn; });
    change();
  }

  return {
    start, join, leave, tidy, toggleMic, toggleCam,
    get current() { return room; },
  };
}
