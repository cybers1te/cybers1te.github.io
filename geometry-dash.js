/* Geometry Dash — clone jouable (mode cube).
 *
 * La simulation est volontairement séparée du rendu et tourne à pas de temps
 * fixe : elle est donc parfaitement déterministe. tools/verify-levels.js
 * recharge ce même fichier sous Node pour prouver que chaque niveau est
 * franchissable et mesurer la largeur des fenêtres de saut.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GD = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', api.boot);
    else api.boot();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ==========================================================================
     1. Constantes physiques
     ========================================================================== */

  var U = 40; // côté d'une case du niveau, en pixels monde

  var P = {
    U: U,
    SPEED: 380,        // vitesse horizontale constante (px/s)
    GRAVITY: 3900,     // px/s²
    JUMP_V: 860,       // impulsion de saut depuis le sol
    PAD_V: 1180,       // tremplin jaune
    ORB_V: 900,        // orbe jaune (saut en plein vol)
    MAX_FALL: 1700,    // vitesse de chute maximale
    DT: 1 / 240,       // pas de simulation
    ROT: Math.PI / 0.44 // 180° par arc de saut standard
  };

  // Arc de saut de référence : ~95 px de haut, ~167 px de long (4,2 cases).

  /* ==========================================================================
     2. Construction des niveaux
     ========================================================================== */

  function Level(name, opts) {
    opts = opts || {};
    this.name = name;
    this.difficulty = opts.difficulty || 'Facile';
    this.stars = opts.stars || 1;
    this.bpm = opts.bpm || 132;
    this.sky = opts.sky || ['#161a63', '#2b1d74'];
    this.accent = opts.accent || '#3ad6ff';
    this.glow = opts.glow || '#b66bff';
    this.ground = opts.ground || '#0d1038';
    this.solids = [];
    this.hazards = [];
    this.pads = [];
    this.orbs = [];
    this.lengthU = 0;
    this.length = 0;
  }

  Level.prototype._grow = function (xu) {
    if (xu > this.lengthU) this.lengthU = xu;
  };

  /* Bloc plein : on atterrit dessus, on meurt si on le percute de côté ou par
     dessous — exactement comme dans le jeu original. */
  Level.prototype.block = function (xu, yu, wu, hu) {
    wu = wu == null ? 1 : wu;
    hu = hu == null ? 1 : hu;
    this.solids.push({ x: xu * U, y: yu * U, w: wu * U, h: hu * U, xu: xu, yu: yu, wu: wu, hu: hu });
    this._grow(xu + wu);
    return this;
  };

  /* Escalier montant de n marches à partir de (xu, yu). */
  Level.prototype.stairs = function (xu, n, yu) {
    yu = yu || 0;
    for (var i = 0; i < n; i++) this.block(xu + i, yu, 1, i + 1);
    return this;
  };

  /* Pointes au sol (ou posées sur un bloc via yu). */
  Level.prototype.spike = function (xu, n, yu) {
    n = n || 1;
    yu = yu || 0;
    for (var i = 0; i < n; i++) {
      var x = (xu + i) * U, y = yu * U;
      this.hazards.push({
        kind: 'spike', x: x, y: y, w: U, h: U, flip: false,
        hit: { x: x + 0.30 * U, y: y, w: 0.40 * U, h: 0.62 * U }
      });
    }
    this._grow(xu + n);
    return this;
  };

  /* Pointes suspendues, pointe vers le bas (sous un bloc). */
  Level.prototype.spikeDown = function (xu, n, yu) {
    n = n || 1;
    for (var i = 0; i < n; i++) {
      var x = (xu + i) * U, y = yu * U;
      this.hazards.push({
        kind: 'spike', x: x, y: y, w: U, h: U, flip: true,
        hit: { x: x + 0.30 * U, y: y + 0.38 * U, w: 0.40 * U, h: 0.62 * U }
      });
    }
    this._grow(xu + n);
    return this;
  };

  /* Scie rotative : mortelle, sa hitbox est plus petite que le visuel. */
  Level.prototype.saw = function (xu, yu, ru) {
    ru = ru || 0.9;
    this.hazards.push({
      kind: 'saw', cx: (xu + 0.5) * U, cy: yu * U, r: ru * U, hr: ru * U * 0.62,
      spin: (xu % 2 ? -1 : 1) * (2.2 + (xu % 3) * 0.4)
    });
    this._grow(xu + 1);
    return this;
  };

  /* Tremplin jaune : se déclenche au contact, sans action du joueur. */
  Level.prototype.pad = function (xu, yu) {
    yu = yu || 0;
    var x = xu * U, y = yu * U;
    this.pads.push({
      x: x, y: y, w: U, h: 0.3 * U,
      hit: { x: x + 0.06 * U, y: y, w: 0.88 * U, h: 0.30 * U }
    });
    this._grow(xu + 1);
    return this;
  };

  /* Orbe jaune : donne un saut supplémentaire si le joueur appuie au contact. */
  Level.prototype.orb = function (xu, yu) {
    this.orbs.push({ cx: (xu + 0.5) * U, cy: yu * U, r: 0.34 * U, hr: 0.58 * U });
    this._grow(xu + 1);
    return this;
  };

  /* Clôt le niveau et construit l'index spatial par colonne. */
  Level.prototype.finish = function (xu) {
    this.lengthU = xu;
    this.length = xu * U;
    var cols = xu + 4;
    this.iSolid = new Array(cols);
    this.iHaz = new Array(cols);
    this.iPad = new Array(cols);
    this.iOrb = new Array(cols);

    var self = this;
    function put(index, from, to, value) {
      var a = Math.max(0, Math.floor(from / U));
      var b = Math.min(cols - 1, Math.floor(to / U));
      for (var c = a; c <= b; c++) {
        if (!index[c]) index[c] = [];
        index[c].push(value);
      }
    }
    this.solids.forEach(function (b) { put(self.iSolid, b.x, b.x + b.w - 0.001, b); });
    this.hazards.forEach(function (h, i) {
      if (h.kind === 'saw') put(self.iHaz, h.cx - h.r, h.cx + h.r, i);
      else put(self.iHaz, h.x, h.x + h.w - 0.001, i);
    });
    this.pads.forEach(function (p, i) { put(self.iPad, p.x, p.x + p.w - 0.001, i); });
    this.orbs.forEach(function (o, i) { put(self.iOrb, o.cx - o.hr, o.cx + o.hr, i); });
    return this;
  };

  /* ==========================================================================
     3. Niveaux
     ========================================================================== */

  function buildLevels() {
    /* Vocabulaire d'obstacles validé par tools/verify-levels.js :
       - spike(x, 1..2)              saut confortable ; 3 pointes = saut serré
       - saw(x, 0, r)                scie à demi enterrée : se saute
       - saw(x, 3.2, r)              scie au plafond : interdit de sauter
       - block(x, 0, w, 1..2)        bloc au sol : on atterrit dessus
       - block(x, 1, w, 1)           tunnel bas : interdit de sauter
       - block(x, 1, w, 1) + spike   plateforme obligatoire : il faut monter
       - block(x, 3, w, 1) + spikeDown   plafond hérissé : interdit de sauter
       - pad(x) puis spike(x+1, 3)   tremplin
       - orb(x, 2.1)                 saut supplémentaire en plein vol        */

    var one = new Level('Néon Zéro', {
      difficulty: 'Facile', stars: 2, bpm: 128,
      sky: ['#151a66', '#2c1c78'], accent: '#3ad6ff', glow: '#8f6bff', ground: '#0c1039'
    });
    one.spike(14)
      .spike(20)
      .spike(26, 2)
      .block(33, 0)
      .spike(39, 2)
      .block(45, 0, 2, 1)
      .saw(52, 0, 0.9)
      .spike(58, 2)
      .block(64, 0, 1, 2)
      .spike(71, 2)
      .pad(78).spike(79, 3)
      .orb(87, 2.1).spike(89, 2)
      .spike(96, 2)
      .block(102, 1, 3, 1).spike(102, 3, 0)
      .saw(111, 0, 0.9)
      .spike(117, 2)
      .finish(126);

    var two = new Level('Circuit Pulse', {
      difficulty: 'Normal', stars: 5, bpm: 140,
      sky: ['#0b2a4a', '#0d5a62'], accent: '#37ffc4', glow: '#2fa8ff', ground: '#04212c'
    });
    two.spike(13, 2)
      .block(21, 0)
      .spike(28, 2)
      .saw(36, 0, 0.95)
      .block(44, 1, 3, 1).spike(44, 3, 0)
      .spike(54, 2)
      .pad(62).spike(63, 3)
      .block(72, 0, 1, 2)
      .spike(80, 2)
      .saw(88, 0, 0.9).saw(89, 0, 0.9)
      .orb(97, 2.1).spike(99, 2)
      .block(107, 3, 4, 1).spikeDown(107, 4, 2)
      .spike(116, 2)
      .stairs(124, 2)
      .spike(133, 2)
      .saw(141, 0, 0.95)
      .orb(149, 2.1).spike(151, 2)
      .block(159, 0, 2, 1)
      .spike(167, 2)
      .finish(175);

    /* Difficulté obtenue par la densité (peu de sol entre deux sauts) plutôt
       que par des fenêtres au millième : un saut injouable n'est pas difficile,
       il est cassé. Le validateur garde toutes les fenêtres au-dessus de 20 ms. */
    var three = new Level('Zone Fracture', {
      difficulty: 'Difficile', stars: 8, bpm: 150,
      sky: ['#3a0a3f', '#6b0f35'], accent: '#ff5d8f', glow: '#ffb347', ground: '#25062b'
    });
    three.spike(12, 2)
      .spike(19, 2)
      .block(26, 0).spike(29, 2)
      .stairs(35, 2)
      .saw(43, 0, 0.95).saw(44, 0, 0.95)
      .spike(51, 2)
      .block(58, 1, 3, 1).spike(58, 3, 0)
      .spike(67, 2)
      .pad(74).spike(75, 3)
      .spike(84, 2)
      .block(91, 3, 4, 1).spikeDown(91, 4, 2)
      .spike(99, 2)
      .orb(106, 2.1).spike(108, 2)
      .block(115, 0, 1, 2)
      .saw(122, 0, 0.95)
      .spike(129, 2)
      .stairs(136, 2)
      .spike(144, 2)
      .pad(151).spike(152, 3)
      .orb(160, 2.1).spike(162, 2)
      .saw(169, 0, 0.95).saw(170, 0, 0.95)
      .spike(177, 2)
      .block(184, 0, 2, 1)
      .spike(191, 2)
      .finish(199);

    return [one, two, three];
  }

  /* ==========================================================================
     4. Simulation
     ========================================================================== */

  function newRun(level) {
    return {
      x: 0, y: 0, vy: 0, onGround: true, rot: 0,
      dead: false, won: false, frame: 0,
      usedOrbs: new Uint8Array(level.orbs.length),
      usedPads: new Uint8Array(level.pads.length),
      usedCount: 0,
      jumped: false, padHit: -1, orbHit: -1, landed: false
    };
  }

  function cloneRun(s) {
    return {
      x: s.x, y: s.y, vy: s.vy, onGround: s.onGround, rot: s.rot,
      dead: s.dead, won: s.won, frame: s.frame,
      usedOrbs: s.usedOrbs.slice(), usedPads: s.usedPads.slice(),
      usedCount: s.usedCount,
      jumped: s.jumped, padHit: s.padHit, orbHit: s.orbHit, landed: s.landed
    };
  }

  function bucket(index, x1, x2) {
    var a = Math.max(0, Math.floor(x1 / U));
    var b = Math.floor(x2 / U);
    var out = null;
    for (var c = a; c <= b; c++) {
      var list = index[c];
      if (!list) continue;
      if (!out) out = list.slice();
      else for (var i = 0; i < list.length; i++) if (out.indexOf(list[i]) < 0) out.push(list[i]);
    }
    return out;
  }

  function overlaps(ax, ay, aw, ah, b) {
    return ax < b.x + b.w && ax + aw > b.x && ay < b.y + b.h && ay + ah > b.y;
  }

  function circleHitsBox(cx, cy, r, bx, by, bw, bh) {
    var nx = cx < bx ? bx : (cx > bx + bw ? bx + bw : cx);
    var ny = cy < by ? by : (cy > by + bh ? by + bh : cy);
    var dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  }

  /* Un pas de simulation. `hold` = le joueur maintient la commande de saut. */
  function step(s, lvl, hold) {
    if (s.dead || s.won) return s;
    var dt = P.DT, i, n, list;
    s.jumped = false; s.padHit = -1; s.orbHit = -1; s.landed = false;

    /* --- 4.1 entrée joueur --- */
    if (hold) {
      if (s.onGround) {
        s.vy = P.JUMP_V; s.onGround = false; s.jumped = true;
      } else {
        list = bucket(lvl.iOrb, s.x, s.x + U);
        if (list) {
          for (i = 0; i < list.length; i++) {
            n = list[i];
            if (s.usedOrbs[n]) continue;
            var o = lvl.orbs[n];
            if (circleHitsBox(o.cx, o.cy, o.hr, s.x, s.y, U, U)) {
              s.vy = P.ORB_V; s.usedOrbs[n] = 1; s.usedCount++; s.orbHit = n; s.jumped = true;
              break;
            }
          }
        }
      }
    }

    /* --- 4.2 avance horizontale (vitesse constante) --- */
    s.x += P.SPEED * dt;

    /* --- 4.3 avance verticale puis résolution des blocs --- */
    s.vy -= P.GRAVITY * dt;
    if (s.vy < -P.MAX_FALL) s.vy = -P.MAX_FALL;
    var prevY = s.y;
    s.y += s.vy * dt;
    var wasAir = !s.onGround;
    s.onGround = false;
    if (s.y <= 0) { s.y = 0; s.vy = 0; s.onGround = true; }

    var solids = bucket(lvl.iSolid, s.x, s.x + U);
    if (solids) {
      /* atterrissage : on ne se pose que si l'on venait d'au-dessus */
      for (i = 0; i < solids.length; i++) {
        var b = solids[i];
        if (b.x >= s.x + U || b.x + b.w <= s.x) continue;
        var top = b.y + b.h;
        if (s.vy <= 0 && prevY >= top - 0.5 && s.y < top && s.y + U > b.y) {
          s.y = top; s.vy = 0; s.onGround = true;
        }
      }
      /* chevauchement restant = mur ou plafond = mort */
      for (i = 0; i < solids.length; i++) {
        var c = solids[i];
        if (overlaps(s.x, s.y, U, U, c)) { s.dead = true; return s; }
      }
    }
    if (s.onGround && wasAir) s.landed = true;

    /* --- 4.4 tremplins --- */
    list = bucket(lvl.iPad, s.x, s.x + U);
    if (list) {
      for (i = 0; i < list.length; i++) {
        n = list[i];
        if (s.usedPads[n]) continue;
        if (overlaps(s.x, s.y, U, U, lvl.pads[n].hit)) {
          s.vy = P.PAD_V; s.onGround = false; s.usedPads[n] = 1; s.padHit = n;
        }
      }
    }

    /* --- 4.5 obstacles mortels --- */
    list = bucket(lvl.iHaz, s.x, s.x + U);
    if (list) {
      for (i = 0; i < list.length; i++) {
        var h = lvl.hazards[list[i]];
        if (h.kind === 'saw') {
          if (circleHitsBox(h.cx, h.cy, h.hr, s.x, s.y, U, U)) { s.dead = true; return s; }
        } else if (overlaps(s.x, s.y, U, U, h.hit)) { s.dead = true; return s; }
      }
    }

    /* --- 4.6 rotation (purement visuelle) et fin de niveau --- */
    if (s.onGround) {
      var q = Math.PI / 2;
      var target = Math.round(s.rot / q) * q;
      s.rot += (target - s.rot) * Math.min(1, 18 * dt);
    } else {
      s.rot += P.ROT * dt;
    }
    if (s.x >= lvl.length) { s.x = lvl.length; s.won = true; }
    s.frame++;
    return s;
  }

  var api = {
    U: U, PHYS: P, Level: Level, buildLevels: buildLevels,
    newRun: newRun, cloneRun: cloneRun, step: step,
    boot: function () { boot(); }
  };

  /* ==========================================================================
     5. Audio : musique chiptune générée + effets, sans aucun fichier externe
     ========================================================================== */

  var PATTERNS = [
    {
      bass: [0, 0, 12, 0, 7, 0, 12, 0, 5, 5, 12, 5, 3, 3, 10, 3],
      lead: [12, null, 15, 19, null, 15, 12, null, 10, null, 14, 17, null, 14, 10, null]
    },
    {
      bass: [0, 0, 7, 0, 10, 10, 3, 10, 5, 5, 12, 5, 8, 8, 3, 0],
      lead: [19, 17, 15, 17, 12, null, 15, null, 22, 19, 17, 19, 15, null, 12, null]
    },
    {
      bass: [0, 12, 0, 7, 3, 10, 3, 0, 5, 12, 5, 8, 7, 14, 7, 3],
      lead: [24, 22, 19, 22, 17, 19, 15, 12, 24, 22, 19, 15, 17, 12, 10, 7]
    }
  ];

  function createSound() {
    var ac = null, master = null, musicBus = null, sfxBus = null, noise = null;
    var muted = false, running = false, ticker = 0;
    var stepIdx = 0, nextT = 0, bpm = 132, pat = PATTERNS[0], energy = 1;

    function ensure() {
      if (ac) return ac;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.85;
      master.connect(ac.destination);
      musicBus = ac.createGain(); musicBus.gain.value = 0.3; musicBus.connect(master);
      sfxBus = ac.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);

      var len = Math.floor(ac.sampleRate * 0.5);
      noise = ac.createBuffer(1, len, ac.sampleRate);
      var d = noise.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return ac;
    }

    function note(semi, t, dur, type, gain, bus, detune) {
      var o = ac.createOscillator(), gn = ac.createGain();
      o.type = type;
      o.frequency.value = 110 * Math.pow(2, semi / 12);
      if (detune) o.detune.value = detune;
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(gain, t + 0.008);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn); gn.connect(bus);
      o.start(t); o.stop(t + dur + 0.02);
    }

    function kick(t) {
      var o = ac.createOscillator(), gn = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
      gn.gain.setValueAtTime(0.9, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(gn); gn.connect(musicBus);
      o.start(t); o.stop(t + 0.18);
    }

    function hat(t, loud) {
      var src = ac.createBufferSource(), hp = ac.createBiquadFilter(), gn = ac.createGain();
      src.buffer = noise;
      hp.type = 'highpass'; hp.frequency.value = 7000;
      gn.gain.setValueAtTime(loud ? 0.22 : 0.09, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(hp); hp.connect(gn); gn.connect(musicBus);
      src.start(t); src.stop(t + 0.06);
    }

    function schedule(t, i) {
      if (i % 4 === 0) kick(t);
      hat(t, i % 4 === 2);
      var b = pat.bass[i];
      if (b != null) {
        var o = ac.createOscillator(), lp = ac.createBiquadFilter(), gn = ac.createGain();
        o.type = 'square';
        o.frequency.value = 55 * Math.pow(2, b / 12);
        lp.type = 'lowpass'; lp.frequency.value = 760;
        gn.gain.setValueAtTime(0, t);
        gn.gain.linearRampToValueAtTime(0.5, t + 0.01);
        gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(lp); lp.connect(gn); gn.connect(musicBus);
        o.start(t); o.stop(t + 0.2);
      }
      var l = pat.lead[i];
      if (l != null && energy > 0.4) {
        note(l + 12, t, 0.15, 'triangle', 0.24 * energy, musicBus);
        note(l + 12, t, 0.15, 'sawtooth', 0.07 * energy, musicBus, 9);
      }
    }

    function pump() {
      if (!ac || !running) return;
      var spb = 60 / bpm / 4;
      while (nextT < ac.currentTime + 0.14) {
        if (nextT < ac.currentTime) nextT = ac.currentTime + 0.02;
        schedule(nextT, stepIdx % 16);
        stepIdx++;
        nextT += spb;
      }
    }

    return {
      unlock: function () {
        var c = ensure();
        if (c && c.state === 'suspended') c.resume();
      },
      setTrack: function (levelIndex, levelBpm) {
        pat = PATTERNS[levelIndex % PATTERNS.length];
        bpm = levelBpm || 132;
      },
      start: function () {
        if (!ensure()) return;
        if (ac.state === 'suspended') ac.resume();
        if (running) return;
        running = true; stepIdx = 0; nextT = ac.currentTime + 0.08;
        ticker = setInterval(pump, 25);
        pump();
      },
      stop: function () {
        running = false;
        if (ticker) { clearInterval(ticker); ticker = 0; }
      },
      setEnergy: function (v) { energy = v; },
      toggleMute: function () {
        muted = !muted;
        if (master) master.gain.value = muted ? 0 : 0.85;
        return muted;
      },
      setMuted: function (v) {
        muted = !!v;
        if (master) master.gain.value = muted ? 0 : 0.85;
      },
      isMuted: function () { return muted; },
      sfx: function (kind) {
        if (!ac || muted) return;
        var t = ac.currentTime;
        if (kind === 'jump') note(36, t, 0.09, 'square', 0.16, sfxBus);
        else if (kind === 'pad') { note(31, t, 0.16, 'sawtooth', 0.2, sfxBus); note(43, t + 0.04, 0.14, 'square', 0.13, sfxBus); }
        else if (kind === 'orb') { note(48, t, 0.12, 'triangle', 0.24, sfxBus); note(55, t + 0.05, 0.12, 'triangle', 0.16, sfxBus); }
        else if (kind === 'die') {
          var o = ac.createOscillator(), gn = ac.createGain();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(420, t);
          o.frequency.exponentialRampToValueAtTime(48, t + 0.36);
          gn.gain.setValueAtTime(0.3, t);
          gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
          o.connect(gn); gn.connect(sfxBus);
          o.start(t); o.stop(t + 0.42);
          var s = ac.createBufferSource(), sg = ac.createGain();
          s.buffer = noise;
          sg.gain.setValueAtTime(0.25, t);
          sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          s.connect(sg); sg.connect(sfxBus);
          s.start(t); s.stop(t + 0.32);
        } else if (kind === 'win') {
          [24, 28, 31, 36, 40, 43].forEach(function (n, i) {
            note(n, t + i * 0.08, 0.3, 'triangle', 0.22, sfxBus);
          });
        }
      }
    };
  }

  /* ==========================================================================
     6. Utilitaires de rendu
     ========================================================================== */

  var VIEW_U = 20;   // largeur visible, en cases
  var GROUND_F = 0.78;

  function rgba(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function repeatX(camX, scale, f, spacing, viewW, cb) {
    var off = camX * f;
    var first = Math.floor(off / spacing) - 1;
    var count = Math.ceil(viewW / scale / spacing) + 3;
    for (var i = 0; i < count; i++) {
      var wx = (first + i) * spacing;
      cb((wx - off) * scale, first + i);
    }
  }

  function drawBackdrop(g, ctx, W, H, camX, scale, groundY) {
    var lvl = g.level;
    var pulse = 0.5 + 0.5 * Math.sin(g.beat * Math.PI * 2);

    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, lvl.sky[0]);
    sky.addColorStop(0.62, lvl.sky[1]);
    sky.addColorStop(1, lvl.sky[0]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    var halo = ctx.createRadialGradient(W * 0.5, groundY * 0.58, 0, W * 0.5, groundY * 0.58, H * (0.78 + 0.1 * pulse));
    halo.addColorStop(0, rgba(lvl.glow, 0.3 + 0.1 * pulse));
    halo.addColorStop(1, rgba(lvl.glow, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    /* couche lointaine : losanges */
    ctx.strokeStyle = rgba('#ffffff', 0.07);
    ctx.lineWidth = 2;
    repeatX(camX, scale, 0.18, 360, W, function (x, i) {
      var size = (110 + (i % 3) * 55) * scale;
      var cy = groundY * (0.3 + ((i * 7) % 5) * 0.11);
      ctx.beginPath();
      ctx.moveTo(x, cy - size / 2);
      ctx.lineTo(x + size / 2, cy);
      ctx.lineTo(x, cy + size / 2);
      ctx.lineTo(x - size / 2, cy);
      ctx.closePath();
      ctx.stroke();
    });

    /* couche médiane : colonnes de lumière */
    repeatX(camX, scale, 0.42, 250, W, function (x, i) {
      var w = (34 + (i % 2) * 22) * scale;
      var gr = ctx.createLinearGradient(0, 0, 0, groundY);
      gr.addColorStop(0, rgba(lvl.accent, 0));
      gr.addColorStop(1, rgba(lvl.accent, 0.09 + 0.05 * pulse));
      ctx.fillStyle = gr;
      ctx.fillRect(x, groundY * 0.1, w, groundY * 0.9);
    });

    /* couche proche : grille */
    ctx.strokeStyle = rgba('#ffffff', 0.05);
    ctx.lineWidth = 1;
    repeatX(camX, scale, 0.8, 120, W, function (x) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, groundY);
      ctx.stroke();
    });

    /* le sol */
    var gr2 = ctx.createLinearGradient(0, groundY, 0, H);
    gr2.addColorStop(0, lvl.ground);
    gr2.addColorStop(1, '#04040f');
    ctx.fillStyle = gr2;
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, groundY, W, H - groundY);
    ctx.clip();
    ctx.strokeStyle = rgba(lvl.accent, 0.13);
    ctx.lineWidth = 1;
    repeatX(camX, scale, 1, P.U, W, function (x) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, H);
      ctx.stroke();
    });
    ctx.strokeStyle = rgba(lvl.accent, 0.07);
    for (var yy = groundY; yy < H; yy += P.U * scale) {
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(W, yy);
      ctx.stroke();
    }
    ctx.restore();

    /* arête supérieure lumineuse */
    ctx.save();
    ctx.shadowColor = lvl.accent;
    ctx.shadowBlur = 22 * (0.7 + 0.5 * pulse);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, groundY - 2.5, W, 3);
    ctx.restore();
    ctx.fillStyle = rgba(lvl.accent, 0.75);
    ctx.fillRect(0, groundY, W, 2);
  }

  /* --- objets du monde (repère monde, y vers le haut) --- */

  function drawBlock(ctx, b, lvl) {
    ctx.fillStyle = '#0c0a20';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = rgba(lvl.accent, 0.22);
    ctx.lineWidth = 1;
    for (var i = 1; i < b.wu; i++) {
      ctx.beginPath();
      ctx.moveTo(b.x + i * P.U, b.y);
      ctx.lineTo(b.x + i * P.U, b.y + b.h);
      ctx.stroke();
    }
    for (var j = 1; j < b.hu; j++) {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + j * P.U);
      ctx.lineTo(b.x + b.w, b.y + j * P.U);
      ctx.stroke();
    }
    ctx.save();
    ctx.shadowColor = lvl.accent;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = lvl.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
    ctx.restore();
    ctx.fillStyle = rgba('#ffffff', 0.55);
    ctx.fillRect(b.x + 3, b.y + b.h - 4, b.w - 6, 2.5);
  }

  function drawSpike(ctx, h, lvl) {
    var top = h.flip ? h.y : h.y + h.h;
    var base = h.flip ? h.y + h.h : h.y;
    ctx.beginPath();
    ctx.moveTo(h.x + 1, base);
    ctx.lineTo(h.x + h.w / 2, top);
    ctx.lineTo(h.x + h.w - 1, base);
    ctx.closePath();
    var gr = ctx.createLinearGradient(h.x, base, h.x, top);
    gr.addColorStop(0, '#15102e');
    gr.addColorStop(0.55, rgba(lvl.accent, 0.55));
    gr.addColorStop(1, '#ffffff');
    ctx.fillStyle = gr;
    ctx.save();
    ctx.shadowColor = lvl.accent;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = rgba('#ffffff', 0.85);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  function drawSaw(ctx, h, lvl, t) {
    ctx.save();
    ctx.translate(h.cx, h.cy);
    ctx.rotate(t * h.spin);
    var teeth = 9;
    ctx.beginPath();
    for (var i = 0; i < teeth * 2; i++) {
      var r = i % 2 ? h.r : h.r * 0.62;
      var a = (i / (teeth * 2)) * Math.PI * 2;
      var x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#120d26';
    ctx.save();
    ctx.shadowColor = lvl.accent;
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = lvl.accent;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, h.r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = rgba('#ffffff', 0.85);
    ctx.fill();
    ctx.restore();
  }

  function drawPad(ctx, p, t) {
    var bob = Math.sin(t * 6) * 1.2;
    ctx.save();
    ctx.shadowColor = '#ffe14d';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffe14d';
    roundRect(ctx, p.x + 2, p.y + bob, p.w - 4, p.h, 4);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = rgba('#ffffff', 0.9);
    ctx.fillRect(p.x + 6, p.y + p.h * 0.55 + bob, p.w - 12, 2);
  }

  function drawOrb(ctx, o, used, t) {
    var pulse = 0.5 + 0.5 * Math.sin(t * 5);
    ctx.save();
    ctx.globalAlpha = used ? 0.25 : 1;
    ctx.strokeStyle = '#ffe14d';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffe14d';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(o.cx, o.cy, o.r + 3 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(o.cx, o.cy, o.r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#fff6c9';
    ctx.fill();
    ctx.restore();
  }

  function drawFinish(ctx, lvl, t) {
    var x = lvl.length;
    var h = P.U * 7;
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 26;
    ctx.fillStyle = rgba('#ffffff', 0.13);
    ctx.fillRect(x - 6, 0, 12, h);
    ctx.restore();
    for (var i = 0; i < 14; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : lvl.accent;
      ctx.fillRect(x - 5, (i / 14) * h, 10, h / 14 - 2);
    }
    ctx.strokeStyle = rgba('#ffffff', 0.5 + 0.4 * Math.sin(t * 4));
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 14, 0, 28, h);
  }

  function drawPlayer(ctx, g) {
    var s = g.run, lvl = g.level, u = P.U;
    if (g.state === 'dead') return;
    ctx.save();
    ctx.translate(s.x + u / 2, s.y + u / 2);
    ctx.rotate(s.rot);
    ctx.shadowColor = lvl.accent;
    ctx.shadowBlur = 20;
    ctx.fillStyle = lvl.accent;
    roundRect(ctx, -u / 2 + 3, -u / 2 + 3, u - 6, u - 6, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0b0820';
    roundRect(ctx, -u * 0.27, -u * 0.27, u * 0.54, u * 0.54, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, -u * 0.14, -u * 0.14, u * 0.28, u * 0.28, 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    roundRect(ctx, -u / 2 + 3, -u / 2 + 3, u - 6, u - 6, 7);
    ctx.stroke();
    ctx.restore();
  }

  function drawWorld(g, ctx, camX) {
    var lvl = g.level, t = g.t;
    var x0 = camX - P.U * 2, x1 = camX + VIEW_U * P.U + P.U * 2;
    var i;

    for (i = 0; i < lvl.solids.length; i++) {
      var b = lvl.solids[i];
      if (b.x + b.w < x0 || b.x > x1) continue;
      drawBlock(ctx, b, lvl);
    }
    for (i = 0; i < lvl.pads.length; i++) {
      var p = lvl.pads[i];
      if (p.x + p.w < x0 || p.x > x1) continue;
      drawPad(ctx, p, t);
    }
    for (i = 0; i < lvl.hazards.length; i++) {
      var h = lvl.hazards[i];
      var hx = h.kind === 'saw' ? h.cx : h.x;
      if (hx + P.U < x0 || hx > x1) continue;
      if (h.kind === 'saw') drawSaw(ctx, h, lvl, t); else drawSpike(ctx, h, lvl);
    }
    for (i = 0; i < lvl.orbs.length; i++) {
      var o = lvl.orbs[i];
      if (o.cx < x0 || o.cx > x1) continue;
      drawOrb(ctx, o, g.run.usedOrbs[i], t);
    }
    if (lvl.length > x0 && lvl.length < x1 + P.U * 4) drawFinish(ctx, lvl, t);

    /* jalons du mode practice */
    if (g.practice) {
      for (i = 0; i < g.checkpoints.length; i++) {
        var cp = g.checkpoints[i];
        if (cp.x < x0 || cp.x > x1) continue;
        ctx.fillStyle = rgba('#5cff9d', 0.85);
        ctx.fillRect(cp.x + P.U * 0.42, 0, 3, P.U * 1.6);
        ctx.beginPath();
        ctx.arc(cp.x + P.U * 0.5, P.U * 1.7, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (i = 0; i < g.particles.length; i++) {
      var q = g.particles[i];
      var a = q.life / q.max;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.translate(q.x, q.y);
      ctx.rotate(q.rot);
      ctx.fillStyle = q.color;
      var sz = q.size * (0.35 + 0.65 * a);
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }

    drawPlayer(ctx, g);
  }

  function render(g) {
    var ctx = g.ctx, W = g.w, H = g.h, dpr = g.dpr;
    var lvl = g.level, s = g.run;
    var scale = W / (VIEW_U * P.U);
    var groundY = H * GROUND_F;
    var camX = s.x - VIEW_U * P.U * 0.3;
    if (camX < -P.U * 3) camX = -P.U * 3;
    var sx = 0, sy = 0;
    if (g.shake > 0) {
      sx = (Math.random() * 2 - 1) * g.shake;
      sy = (Math.random() * 2 - 1) * g.shake;
    }

    ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
    drawBackdrop(g, ctx, W, H, camX, scale, groundY);

    var k = scale * dpr;
    ctx.setTransform(k, 0, 0, -k, (-camX * scale + sx) * dpr, (groundY + sy) * dpr);
    drawWorld(g, ctx, camX);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (g.flash > 0) {
      ctx.fillStyle = rgba('#ffffff', Math.min(0.75, g.flash * 0.75));
      ctx.fillRect(0, 0, W, H);
    }
    var vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  /* ==========================================================================
     7. Particules
     ========================================================================== */

  function addParticle(g, x, y, vx, vy, life, size, color) {
    if (g.particles.length > 460) g.particles.shift();
    g.particles.push({
      x: x, y: y, vx: vx, vy: vy, life: life, max: life, size: size, color: color,
      rot: Math.random() * 6.283, spin: (Math.random() * 2 - 1) * 9
    });
  }

  function updateParticles(g, dt) {
    for (var i = g.particles.length - 1; i >= 0; i--) {
      var q = g.particles[i];
      q.life -= dt;
      if (q.life <= 0) { g.particles.splice(i, 1); continue; }
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy -= 950 * dt;
      q.rot += q.spin * dt;
      if (q.y < 0) { q.y = 0; q.vy = Math.abs(q.vy) * 0.28; q.vx *= 0.72; }
    }
  }

  function spawnTrail(g) {
    var s = g.run, c = g.level.accent;
    addParticle(g, s.x + 4 + Math.random() * 8, s.y + Math.random() * P.U, -60 - Math.random() * 70,
      12 + Math.random() * 40, 0.42, 5 + Math.random() * 5, c);
  }

  function spawnJump(g) {
    var s = g.run;
    for (var i = 0; i < 7; i++) {
      addParticle(g, s.x + P.U * 0.5, s.y + 3, (Math.random() * 2 - 1) * 150, -Math.random() * 60,
        0.34, 4 + Math.random() * 4, '#ffffff');
    }
  }

  function spawnLand(g) {
    var s = g.run;
    for (var i = 0; i < 9; i++) {
      addParticle(g, s.x + P.U * 0.5 + (Math.random() * 2 - 1) * 12, s.y + 2,
        (Math.random() * 2 - 1) * 190, Math.random() * 120, 0.4, 4 + Math.random() * 5,
        i % 2 ? '#ffffff' : g.level.accent);
    }
  }

  function spawnDeath(g) {
    var s = g.run;
    for (var i = 0; i < 46; i++) {
      var a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 560;
      addParticle(g, s.x + P.U * 0.5, s.y + P.U * 0.5, Math.cos(a) * sp, Math.sin(a) * sp + 160,
        0.5 + Math.random() * 0.5, 5 + Math.random() * 10,
        i % 3 === 0 ? '#ffffff' : (i % 3 === 1 ? g.level.accent : g.level.glow));
    }
  }

  /* ==========================================================================
     8. Le jeu
     ========================================================================== */

  var STORE = 'gd:records:v1';

  function loadBest() {
    try {
      var raw = localStorage.getItem(STORE);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveBest(best) {
    try { localStorage.setItem(STORE, JSON.stringify(best)); } catch (e) { /* stockage indisponible */ }
  }

  function hazardAhead(lvl, x, range) {
    var a = Math.floor(x / P.U), b = Math.floor((x + range) / P.U);
    for (var c = a; c <= b; c++) {
      if (lvl.iHaz[c] && lvl.iHaz[c].length) return true;
      if (lvl.iSolid[c] && lvl.iSolid[c].length) return true;
      if (lvl.iPad[c] && lvl.iPad[c].length) return true;
    }
    return false;
  }

  function pct(g) {
    return Math.max(0, Math.min(100, (g.run.x / g.level.length) * 100));
  }

  function message(g, title, sub) {
    if (!g.dom.msg) return;
    if (!title) { g.dom.msg.classList.remove('is-on'); return; }
    g.dom.msgTitle.textContent = title;
    g.dom.msgSub.innerHTML = sub || '';
    g.dom.msg.classList.add('is-on');
  }

  function startRun(g, checkpoint) {
    g.run = checkpoint ? cloneRun(checkpoint) : newRun(g.level);
    g.acc = 0;
    g.state = 'play';
    g.attempts++;
    g.particles.length = 0;
    if (!checkpoint) { g.lastCpX = -1e9; }
    message(g, null);
    updateHud(g);
  }

  function setLevel(g, i) {
    g.li = ((i % g.levels.length) + g.levels.length) % g.levels.length;
    g.level = g.levels[g.li];
    g.attempts = 0;
    g.checkpoints.length = 0;
    g.lastCpX = -1e9;
    g.run = newRun(g.level);
    g.state = 'ready';
    g.particles.length = 0;
    g.sound.setTrack(g.li, g.level.bpm);
    if (g.dom.levels) {
      var kids = g.dom.levels.children;
      for (var k = 0; k < kids.length; k++) kids[k].classList.toggle('is-on', k === g.li);
    }
    message(g, g.level.name, 'Clique, appuie sur <b>Espace</b> ou touche l\'écran pour lancer la tentative.');
    updateHud(g);
    renderRecords(g);
  }

  function onDeath(g) {
    g.state = 'dead';
    g.timer = 0.45;
    g.shake = 16;
    g.flash = 0.55;
    spawnDeath(g);
    g.sound.sfx('die');
    if (!g.practice) {
      var p = Math.floor(pct(g));
      var key = g.level.name;
      if (!g.best[key] || g.best[key] < p) { g.best[key] = p; saveBest(g.best); renderRecords(g); }
    }
  }

  function onWin(g) {
    g.state = 'won';
    g.flash = 0.7;
    g.sound.sfx('win');
    for (var i = 0; i < 90; i++) {
      var a = Math.random() * Math.PI;
      addParticle(g, g.level.length + (Math.random() * 2 - 1) * 30, Math.random() * P.U * 6,
        Math.cos(a) * 260, Math.sin(a) * 320, 1.1 + Math.random(), 6 + Math.random() * 9,
        i % 2 ? '#ffffff' : g.level.accent);
    }
    if (!g.practice) {
      g.best[g.level.name] = 100;
      saveBest(g.best);
      renderRecords(g);
    }
    message(g, 'Niveau terminé !',
      (g.practice ? 'Mode entraînement — relance en mode normal pour valider le niveau.' : 'Bravo. ' + g.attempts + ' tentative' + (g.attempts > 1 ? 's' : '') + '.') +
      '<br><span class="gd-msg-hint">Appuie pour rejouer</span>');
  }

  function maybeCheckpoint(g) {
    var s = g.run;
    if (!s.onGround || s.y > 0.01) return;
    if (s.x - g.lastCpX < P.U * 9) return;
    if (hazardAhead(g.level, s.x + P.U, P.U * 2.6)) return;
    g.checkpoints.push(cloneRun(s));
    if (g.checkpoints.length > 60) g.checkpoints.shift();
    g.lastCpX = s.x;
  }

  function simStep(g) {
    var s = g.run;
    step(s, g.level, g.hold);
    if (s.jumped) {
      g.jumps++;
      g.sound.sfx(s.orbHit >= 0 ? 'orb' : 'jump');
      spawnJump(g);
    }
    if (s.padHit >= 0) { g.sound.sfx('pad'); spawnJump(g); }
    if (s.landed) spawnLand(g);
    g.trailTick++;
    if (g.trailTick % 3 === 0) spawnTrail(g);
    if (s.dead) onDeath(g);
    else if (s.won) onWin(g);
    else if (g.practice) maybeCheckpoint(g);
  }

  function updateHud(g) {
    var d = g.dom;
    if (d.levelName) d.levelName.textContent = g.level.name;
    if (d.diff) d.diff.textContent = g.level.difficulty + ' · ' + g.level.stars + '★';
    if (d.attempts) d.attempts.textContent = g.attempts;
    var p = pct(g);
    if (d.pct) d.pct.textContent = Math.floor(p) + '%';
    if (d.bar) d.bar.style.width = p.toFixed(2) + '%';
  }

  function renderRecords(g) {
    if (!g.dom.records) return;
    var html = '';
    for (var i = 0; i < g.levels.length; i++) {
      var l = g.levels[i], b = g.best[l.name] || 0;
      html += '<tr' + (i === g.li ? ' class="is-on"' : '') + '><td>' + l.name + '</td><td>' + l.difficulty +
        '</td><td>' + l.lengthU + ' cases</td><td><span class="gd-rec' + (b >= 100 ? ' is-done' : '') + '">' +
        (b >= 100 ? 'Terminé' : b + '%') + '</span></td></tr>';
    }
    g.dom.records.innerHTML = html;
  }

  function press(g) {
    g.sound.unlock();
    if (g.state === 'ready') {
      g.sound.start();
      startRun(g, null);
      g.hold = true;
      return;
    }
    if (g.state === 'paused') {
      g.state = 'play';
      g.sound.start();
      message(g, null);
      return;
    }
    if (g.state === 'won') {
      startRun(g, null);
      g.hold = true;
      return;
    }
    g.hold = true;
  }

  function resize(g) {
    var r = g.canvas.getBoundingClientRect();
    g.dpr = Math.min(2, window.devicePixelRatio || 1);
    g.w = Math.max(260, Math.round(r.width));
    g.h = Math.max(150, Math.round(r.height));
    g.canvas.width = Math.round(g.w * g.dpr);
    g.canvas.height = Math.round(g.h * g.dpr);
  }

  function createGame(canvas, dom) {
    var levels = buildLevels();
    var g = {
      canvas: canvas, ctx: canvas.getContext('2d'), dom: dom,
      levels: levels, li: 0, level: levels[0], run: newRun(levels[0]),
      particles: [], shake: 0, flash: 0, t: 0, beat: 0, trailTick: 0, jumps: 0,
      attempts: 0, practice: false, checkpoints: [], lastCpX: -1e9,
      acc: 0, last: 0, state: 'ready', timer: 0, hold: false,
      dpr: 1, w: 640, h: 360, sound: createSound(), best: loadBest()
    };
    resize(g);

    /* --- sélecteur de niveaux --- */
    if (dom.levels) {
      dom.levels.innerHTML = '';
      levels.forEach(function (l, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'gd-lvl' + (i === 0 ? ' is-on' : '');
        b.innerHTML = '<span>' + l.name + '</span><small>' + l.difficulty + ' · ' + l.stars + '★</small>';
        b.addEventListener('click', function () {
          setLevel(g, i);
          g.sound.setTrack(i, l.bpm);
        });
        dom.levels.appendChild(b);
      });
    }

    /* --- boutons --- */
    if (dom.restart) dom.restart.addEventListener('click', function () {
      g.sound.unlock(); g.sound.start(); startRun(g, null);
    });
    if (dom.practice) dom.practice.addEventListener('click', function () {
      g.practice = !g.practice;
      dom.practice.classList.toggle('is-on', g.practice);
      dom.practice.setAttribute('aria-pressed', g.practice ? 'true' : 'false');
      if (dom.frame) dom.frame.classList.toggle('is-practice', g.practice);
      g.checkpoints.length = 0;
      g.lastCpX = -1e9;
      if (g.state !== 'ready') startRun(g, null);
    });
    if (dom.mute) {
      var storedMute = false;
      try { storedMute = localStorage.getItem('gd:mute') === '1'; } catch (e) { /* ignore */ }
      g.sound.setMuted(storedMute);
      dom.mute.classList.toggle('is-off', storedMute);
      dom.mute.textContent = storedMute ? 'Son coupé' : 'Son actif';
      dom.mute.addEventListener('click', function () {
        var m = g.sound.toggleMute();
        dom.mute.classList.toggle('is-off', m);
        dom.mute.textContent = m ? 'Son coupé' : 'Son actif';
        try { localStorage.setItem('gd:mute', m ? '1' : '0'); } catch (e) { /* ignore */ }
      });
    }
    if (dom.full) dom.full.addEventListener('click', function () {
      var el = dom.frame || canvas;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen();
    });

    /* --- entrées --- */
    var target = dom.frame || canvas;
    target.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      press(g);
    });
    window.addEventListener('pointerup', function () { g.hold = false; });
    window.addEventListener('pointercancel', function () { g.hold = false; });

    function isTyping() {
      var a = document.activeElement;
      return a && /^(BUTTON|INPUT|TEXTAREA|SELECT|A)$/.test(a.tagName);
    }

    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      var k = e.code;
      if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') {
        if (isTyping() && k === 'Space') return;
        e.preventDefault();
        press(g);
      } else if (k === 'KeyR') {
        g.sound.unlock(); g.sound.start(); startRun(g, null);
      } else if (k === 'KeyP') {
        if (dom.practice) dom.practice.click();
      } else if (k === 'KeyM') {
        if (dom.mute) dom.mute.click();
      } else if (k === 'KeyZ' && g.practice && g.state === 'play' && g.run.onGround) {
        g.checkpoints.push(cloneRun(g.run));
        g.lastCpX = g.run.x;
      } else if (k === 'KeyX' && g.practice) {
        g.checkpoints.pop();
        g.lastCpX = g.checkpoints.length ? g.checkpoints[g.checkpoints.length - 1].x : -1e9;
      }
    });
    window.addEventListener('keyup', function (e) {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') g.hold = false;
    });

    window.addEventListener('resize', function () { resize(g); });
    if (window.ResizeObserver) new ResizeObserver(function () { resize(g); }).observe(canvas);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && g.state === 'play') {
        g.state = 'paused';
        g.hold = false;
        g.sound.stop();
        message(g, 'Pause', 'Appuie pour reprendre la tentative.');
      }
    });

    setLevel(g, 0);

    /* --- boucle --- */
    function loop(now) {
      requestAnimationFrame(loop);
      var dt = g.last ? (now - g.last) / 1000 : 0;
      g.last = now;
      if (dt > 0.12) dt = 0.12;
      g.t += dt;
      g.beat += dt * (g.level.bpm / 60) / 4;
      if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 70);
      if (g.flash > 0) g.flash = Math.max(0, g.flash - dt * 3.2);
      updateParticles(g, dt);

      if (g.state === 'play') {
        g.acc += dt;
        var guard = 0;
        while (g.acc >= P.DT && guard++ < 900) {
          simStep(g);
          g.acc -= P.DT;
          if (g.state !== 'play') break;
        }
        g.sound.setEnergy(0.5 + 0.5 * Math.min(1, pct(g) / 40));
      } else if (g.state === 'dead') {
        g.timer -= dt;
        if (g.timer <= 0) {
          var cp = g.practice && g.checkpoints.length ? g.checkpoints[g.checkpoints.length - 1] : null;
          startRun(g, cp);
        }
      }
      render(g);
      updateHud(g);
    }
    requestAnimationFrame(loop);
    return g;
  }

  function boot() {
    var canvas = document.getElementById('gd-canvas');
    if (!canvas) return;
    function byId(id) { return document.getElementById(id); }
    createGame(canvas, {
      frame: byId('gd-frame'),
      levelName: byId('gd-level-name'),
      diff: byId('gd-diff'),
      attempts: byId('gd-attempts'),
      pct: byId('gd-pct'),
      bar: byId('gd-bar-fill'),
      msg: byId('gd-msg'),
      msgTitle: byId('gd-msg-title'),
      msgSub: byId('gd-msg-sub'),
      levels: byId('gd-levels'),
      restart: byId('gd-restart'),
      practice: byId('gd-practice'),
      mute: byId('gd-mute'),
      full: byId('gd-full'),
      records: byId('gd-records')
    });
  }

  return api;
});
