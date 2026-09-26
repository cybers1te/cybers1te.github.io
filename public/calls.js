// Appels audio et vidéo de message-me (WebRTC).
//
// Firestore sert seulement à se trouver (« signalisation ») : l'appelant écrit
// une offre dans calls/{id}, l'appelé y répond, et chacun dépose ses
// candidats ICE (les adresses où le joindre). Le son et l'image passent
// ensuite directement d'un navigateur à l'autre, chiffrés par WebRTC.
//
// Les serveurs STUN publics suffisent sur la plupart des réseaux. Derrière
// certains réseaux très fermés (4G de quelques opérateurs, entreprises), il
// faut un serveur relais TURN : voir `iceServers` dans FIREBASE.md.

const RING_MS = 45000;      // l'appelant abandonne après 45 s de sonnerie
const CONNECT_MS = 30000;   // délai pour établir la connexion après avoir décroché
const RING_LOCAL_MS = 60000; // un appel entrant cesse de sonner ici après 60 s
const STALE_MS = 5 * 60000; // un appel « qui sonne » plus vieux est un reste abandonné

const DEFAULT_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];

const ts = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : 0);

export function callsSupported() {
  return Boolean(window.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function capture(video) {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: video ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
  });
}

/* Micro (et caméra pour un appel vidéo). Sans caméra, l'appel continue en
   audio plutôt que d'échouer. */
async function localMedia(video) {
  try {
    return { stream: await capture(video), camera: video };
  } catch (err) {
    if (!video) throw err;
    return { stream: await capture(false), camera: false };
  }
}

/* Firestore refuse `undefined` : on ne garde que des champs définis. */
function candidateData(c) {
  return {
    candidate: c.candidate,
    sdpMid: c.sdpMid ?? null,
    sdpMLineIndex: c.sdpMLineIndex ?? null,
    usernameFragment: c.usernameFragment ?? null,
  };
}

/**
 * onChange(call)       l'appel en cours a changé (ou vient de se terminer) ;
 * onRinging(list)      liste des appels entrants qui sonnent ;
 * onLog(cid, payload)  l'appelant consigne l'appel terminé dans la conversation.
 */
export function createCalls({ F, db, uid, iceServers, onChange, onRinging, onLog, onError }) {
  const ice = [...DEFAULT_ICE, ...(Array.isArray(iceServers) ? iceServers : [])];
  let call = null;
  const ringing = new Map(); // id -> appel entrant
  const dismissed = new Set(); // appels déjà décrochés, refusés ou expirés ici
  let unsubRinging = null;

  const change = (c) => onChange(c || call);
  const emitRinging = () => onRinging([...ringing.values()]);

  function peer(c) {
    const pc = new RTCPeerConnection({ iceServers: ice });
    c.pc = pc;
    c.remote = new MediaStream();
    c.pendingRemote = [];
    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) c.remote = e.streams[0];
      else c.remote.addTrack(e.track);
      change(c);
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === 'connected') {
        if (!c.startedAt) c.startedAt = Date.now();
        c.phase = 'active';
        clearTimeout(c.connectTimer);
      } else if (s === 'disconnected' && c.phase === 'active') {
        c.phase = 'unstable';
      } else if (s === 'failed') {
        finish(c, 'failed');
        return;
      }
      change(c);
    };
    for (const track of c.local.getTracks()) pc.addTrack(track, c.local);
    return pc;
  }

  function addRemote(c, data) {
    if (c.ended) return;
    const cand = new RTCIceCandidate(data);
    if (c.pc.remoteDescription) c.pc.addIceCandidate(cand).catch(() => {});
    else c.pendingRemote.push(cand);
  }

  function flushRemote(c) {
    for (const cand of c.pendingRemote.splice(0)) c.pc.addIceCandidate(cand).catch(() => {});
  }

  function watchCandidates(c, name) {
    c.unsubs.push(F.onSnapshot(F.collection(c.ref, name), (snap) => {
      for (const ch of snap.docChanges()) if (ch.type === 'added') addRemote(c, ch.doc.data());
    }));
  }

  function armConnectTimer(c) {
    clearTimeout(c.connectTimer);
    c.connectTimer = setTimeout(() => {
      if (c.phase !== 'active' && c.phase !== 'unstable') finish(c, 'failed');
    }, CONNECT_MS);
  }

  /* Fin d'appel, quelle qu'en soit la raison. L'état est écrit dans
     calls/{id} sauf si c'est l'autre qui a terminé ; l'appelant consigne
     ensuite l'appel dans la conversation. */
  function finish(c, reason, { remote = false, silent = false } = {}) {
    if (c.ended) return;
    c.ended = true;
    c.phase = 'ended';
    c.reason = reason;
    clearTimeout(c.ringTimer);
    clearTimeout(c.connectTimer);
    for (const u of c.unsubs) u();
    c.unsubs = [];
    try { if (c.pc) c.pc.close(); } catch { /* déjà fermée */ }
    if (c.local) c.local.getTracks().forEach((t) => t.stop());
    c.duration = c.startedAt ? Math.round((Date.now() - c.startedAt) / 1000) : 0;

    const write = async () => {
      if (remote || !c.created) return;
      if (c.answered) {
        await F.updateDoc(c.ref, { status: 'ended', endedAt: F.serverTimestamp(), endedBy: uid });
      } else if (c.role === 'caller') {
        await F.updateDoc(c.ref, { status: 'missed', endedAt: F.serverTimestamp() });
      }
    };
    const status = reason === 'failed' && !c.startedAt ? 'failed'
      : c.answered ? 'ended'
        : reason === 'declined' ? 'declined' : 'missed';
    write().catch(() => {}).finally(() => {
      if (c.role === 'caller' && !silent) onLog(c.cid, { t: 'call', video: c.video, status, duration: c.duration });
    });
    if (call === c) call = null;
    change(c);
  }

  /* ----------------------------------------------------------- appeler */

  async function start(cid, peerUid, video) {
    if (call) throw Object.assign(new Error('busy'), { code: 'busy' });
    const { stream, camera } = await localMedia(video);
    const ref = F.doc(F.collection(db, 'calls'));
    const c = {
      id: ref.id, ref, cid, peer: peerUid, video, role: 'caller', phase: 'calling',
      local: stream, micOn: true, camOn: camera, unsubs: [],
    };
    call = c;
    change(c);
    try {
      const pc = peer(c);
      const out = F.collection(ref, 'callerCandidates');
      const queue = [];
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const data = candidateData(e.candidate);
        if (c.created) F.addDoc(out, data).catch(() => {});
        else queue.push(data);
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await F.setDoc(ref, {
        cid, caller: uid, callee: peerUid, video, status: 'ringing',
        offer: { type: offer.type, sdp: offer.sdp }, createdAt: F.serverTimestamp(),
      });
      c.created = true;
      if (c.ended) {
        // Raccroché pendant l'écriture : on prévient l'appelé tout de suite.
        F.updateDoc(ref, { status: 'missed', endedAt: F.serverTimestamp() }).catch(() => {});
        return;
      }
      for (const data of queue.splice(0)) F.addDoc(out, data).catch(() => {});
      c.unsubs.push(F.onSnapshot(ref, (snap) => onCallerUpdate(c, snap.data())));
      watchCandidates(c, 'calleeCandidates');
      c.ringTimer = setTimeout(() => { if (c.phase === 'calling') finish(c, 'missed'); }, RING_MS);
    } catch (err) {
      finish(c, 'failed', { silent: !c.created });
      throw err;
    }
  }

  async function onCallerUpdate(c, d) {
    if (!d || c.ended) return;
    if (d.status === 'accepted' && d.answer && !c.answered) {
      c.answered = true;
      c.phase = 'connecting';
      clearTimeout(c.ringTimer);
      change(c);
      try {
        await c.pc.setRemoteDescription(d.answer);
        flushRemote(c);
      } catch {
        finish(c, 'failed');
        return;
      }
      armConnectTimer(c);
    } else if (d.status === 'declined') {
      finish(c, 'declined', { remote: true });
    } else if (d.status === 'ended') {
      finish(c, 'ended', { remote: true });
    } else if (d.status === 'missed') {
      finish(c, 'missed', { remote: true }); // raccroché depuis un autre de mes onglets
    }
  }

  /* ---------------------------------------------------------- décrocher */

  async function accept(id) {
    const inc = ringing.get(id);
    if (!inc) return;
    dismissed.add(id);
    ringing.delete(id);
    emitRinging();
    if (call) finish(call, 'ended');
    const ref = F.doc(db, 'calls', id);
    let c = null;
    try {
      const { stream, camera } = await localMedia(inc.video);
      c = {
        id, ref, cid: inc.cid, peer: inc.caller, video: inc.video, role: 'callee', phase: 'connecting',
        local: stream, micOn: true, camOn: camera, unsubs: [], answered: true,
      };
      call = c;
      change(c);
      const pc = peer(c);
      const out = F.collection(ref, 'calleeCandidates');
      pc.onicecandidate = (e) => { if (e.candidate) F.addDoc(out, candidateData(e.candidate)).catch(() => {}); };
      await pc.setRemoteDescription(inc.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await F.updateDoc(ref, {
        status: 'accepted', answer: { type: answer.type, sdp: answer.sdp }, answeredAt: F.serverTimestamp(),
      });
      c.created = true;
      if (c.ended) {
        F.updateDoc(ref, { status: 'ended', endedAt: F.serverTimestamp(), endedBy: uid }).catch(() => {});
        return;
      }
      c.unsubs.push(F.onSnapshot(ref, (snap) => {
        const d = snap.data();
        if (d && d.status === 'ended') finish(c, 'ended', { remote: true });
      }));
      watchCandidates(c, 'callerCandidates');
      armConnectTimer(c);
    } catch (err) {
      // Sans réponse écrite, l'appelant attendrait jusqu'à la fin de la sonnerie.
      if (!c || !c.created) F.updateDoc(ref, { status: 'declined', endedAt: F.serverTimestamp() }).catch(() => {});
      if (c) finish(c, 'gone', { remote: true });
      throw err;
    }
  }

  async function decline(id) {
    const inc = ringing.get(id);
    dismissed.add(id);
    ringing.delete(id);
    emitRinging();
    if (!inc) return;
    await F.updateDoc(F.doc(db, 'calls', id), { status: 'declined', endedAt: F.serverTimestamp() }).catch(() => {});
  }

  /* ------------------------------------------------ appels qui me sonnent */

  function watch() {
    if (unsubRinging) return;
    unsubRinging = F.onSnapshot(
      F.query(F.collection(db, 'calls'), F.where('callee', '==', uid), F.where('status', '==', 'ringing')),
      (snap) => {
        const now = Date.now();
        const present = new Set();
        for (const d of snap.docs) {
          const data = d.data({ serverTimestamps: 'estimate' });
          if (now - ts(data.createdAt) > STALE_MS) continue;
          present.add(d.id);
          if (ringing.has(d.id) || dismissed.has(d.id)) continue;
          const inc = { id: d.id, ...data, seenAt: now };
          ringing.set(d.id, inc);
          if (call) { decline(d.id); continue; } // déjà en ligne : occupé
          setTimeout(() => {
            if (ringing.get(d.id) !== inc) return;
            dismissed.add(d.id);
            ringing.delete(d.id);
            emitRinging();
          }, RING_LOCAL_MS);
        }
        for (const id of [...ringing.keys()]) if (!present.has(id)) ringing.delete(id);
        emitRinging();
      },
      (err) => onError && onError(err));
  }

  /* ------------------------------------------------------------ pendant */

  function hangUp() {
    if (call) finish(call, call.answered ? 'ended' : 'missed');
  }

  function toggleMic() {
    if (!call) return;
    call.micOn = !call.micOn;
    call.local.getAudioTracks().forEach((t) => { t.enabled = call.micOn; });
    change();
  }

  function toggleCam() {
    if (!call || !call.local.getVideoTracks().length) return;
    call.camOn = !call.camOn;
    call.local.getVideoTracks().forEach((t) => { t.enabled = call.camOn; });
    change();
  }

  function dispose() {
    if (unsubRinging) unsubRinging();
    unsubRinging = null;
    ringing.clear();
    dismissed.clear();
    if (call) finish(call, call.answered ? 'ended' : 'missed', { silent: true });
  }

  return {
    watch, start, accept, decline, hangUp, toggleMic, toggleCam, dispose,
    get current() { return call; },
    get ringing() { return [...ringing.values()]; },
  };
}
