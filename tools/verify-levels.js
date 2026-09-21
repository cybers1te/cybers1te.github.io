#!/usr/bin/env node
/* Validateur de niveaux pour geometry-dash.js.
 *
 * La simulation étant déterministe et la vitesse horizontale constante, l'état
 * du joueur à l'instant t se résume à (y, vy, au sol, orbes/pads consommés).
 * On explore donc frame par frame l'ensemble des états atteignables, puis on
 * remonte à l'envers pour savoir lesquels mènent à la fin du niveau.
 *
 * Sortie : franchissable ou non, nombre de sauts obligatoires, et largeur de la
 * fenêtre de timing de chaque saut (une fenêtre de 2-3 frames = saut au pixel,
 * donc mauvais level design ; on vise au moins ~10 frames, soit ~40 ms).
 */
'use strict';

const GD = require('../geometry-dash.js');
const { PHYS: P } = GD;

function popcount(n) { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; }

function pack(s) {
  let om = 0, pm = 0;
  for (let i = 0; i < s.usedOrbs.length; i++) if (s.usedOrbs[i]) om |= 1 << i;
  for (let i = 0; i < s.usedPads.length; i++) if (s.usedPads[i]) pm |= 1 << i;
  return { y: s.y, vy: s.vy, og: s.onGround ? 1 : 0, om, pm };
}

/* Un unique état de travail réutilisé : l'exploration fait des dizaines de
   millions de pas, allouer un objet à chaque fois coûterait bien plus cher
   que la simulation elle-même. */
function loadInto(s, c, x, frame) {
  s.x = x; s.y = c.y; s.vy = c.vy; s.onGround = !!c.og; s.frame = frame;
  s.dead = false; s.won = false; s.rot = 0;
  for (let i = 0; i < s.usedOrbs.length; i++) s.usedOrbs[i] = (c.om >> i) & 1;
  for (let i = 0; i < s.usedPads.length; i++) s.usedPads[i] = (c.pm >> i) & 1;
  s.usedCount = popcount(c.om);
  return s;
}

/* On n'autorise une décision de saut qu'une frame sur STRIDE. La recherche
   explore donc un sous-ensemble des stratégies humaines : un niveau déclaré
   franchissable l'est réellement, et les fenêtres mesurées sont prudentes. */
const STRIDE = 2;

const keyOf = (c) => c.y.toFixed(3) + ',' + c.vy.toFixed(3) + ',' + c.og + ',' + c.om + ',' + c.pm;

const DEAD = -1, WIN = -2;

function explore(lvl, maxFrames) {
  // xs[f] = abscisse commune à tous les états de la frame f (accumulée comme
  // dans le jeu pour rester bit-à-bit identique).
  const xs = [0];
  for (let f = 1; f <= maxFrames + 1; f++) xs[f] = xs[f - 1] + P.SPEED * P.DT;

  const frames = [];
  const scratch = GD.newRun(lvl);
  let cur = [pack(GD.newRun(lvl))];
  let curMap = new Map([[keyOf(cur[0]), 0]]);
  let peak = 1;

  for (let f = 0; f <= maxFrames; f++) {
    const next = [], nextMap = new Map();
    const succ = new Int32Array(cur.length * 2);
    const canJump = f % STRIDE === 0;

    for (let i = 0; i < cur.length; i++) {
      for (let h = 0; h < 2; h++) {
        if (h === 1 && !canJump) { succ[i * 2 + 1] = DEAD; continue; }
        const s = loadInto(scratch, cur[i], xs[f], f);
        GD.step(s, lvl, h === 1);
        let out;
        if (s.dead) out = DEAD;
        else if (s.won) out = WIN;
        else {
          const c = pack(s), k = keyOf(c);
          if (nextMap.has(k)) out = nextMap.get(k);
          else { out = next.length; nextMap.set(k, out); next.push(c); }
        }
        succ[i * 2 + h] = out;
      }
    }
    frames.push({ list: cur, map: curMap, succ, x: xs[f] });
    if (next.length === 0) break;
    if (next.length > peak) peak = next.length;
    cur = next; curMap = nextMap;
  }
  return { frames, xs, peak };
}

function backward(frames) {
  const win = frames.map((fr) => new Uint8Array(fr.list.length));
  for (let f = frames.length - 1; f >= 0; f--) {
    const fr = frames[f], w = win[f], nw = win[f + 1];
    for (let i = 0; i < fr.list.length; i++) {
      for (let h = 0; h < 2; h++) {
        const o = fr.succ[i * 2 + h];
        if (o === WIN || (o >= 0 && nw && nw[o])) { w[i] = 1; break; }
      }
    }
  }
  return win;
}

/* Rejoue le niveau en ne sautant qu'au dernier moment possible : chaque saut
   forcé donne la largeur réelle de sa fenêtre de timing. */
/* Rejoue le niveau et mesure la tolérance de chaque saut obligatoire.
 *
 * La politique compte : « sauter à la dernière frame possible » fait atterrir
 * le joueur au plus tard, ce qui rétrécit artificiellement la fenêtre du saut
 * suivant. On recense donc, à chaque passage au sol, toutes les frames depuis
 * lesquelles sauter reste gagnant, et on saute au milieu — comme un joueur.
 */
function play(lvl, frames, win) {
  if (!win[0][0]) return null;
  const windows = [];
  let f = 0, idx = 0, jumps = 0, orbInputs = 0;

  const ok = (fi, i, h) => {
    const o = frames[fi].succ[i * 2 + h];
    const nw = win[fi + 1];
    return o === WIN || (o >= 0 && nw && nw[o]);
  };

  while (f < frames.length) {
    if (frames[f].list[idx].og) {
      const valid = [];
      let ff = f, ii = idx, forced = false, done = false;

      while (ff < frames.length && frames[ff].list[ii].og) {
        if (ok(ff, ii, 1)) valid.push([ff, ii]);
        if (!ok(ff, ii, 0)) { forced = true; break; }   // il faut sauter ici
        const nxt = frames[ff].succ[ii * 2];
        if (nxt === WIN) { done = true; break; }        // fin atteinte au sol
        ff++; ii = nxt;
      }
      if (done) return { windows, jumps, orbInputs, frames: ff + 1 };

      if (forced) {
        if (!valid.length) return null;
        // `valid` peut contenir plusieurs plages disjointes (un obstacle au
        // plafond rend le saut mortel au milieu du passage au sol). Seule la
        // dernière plage contiguë compte : c'est celle qui mène au saut
        // obligatoire, et c'est la tolérance réellement offerte au joueur.
        let a = valid.length - 1;
        while (a > 0 && valid[a][0] - valid[a - 1][0] === STRIDE) a--;
        const run = valid.slice(a);
        const [pf, pi] = run[Math.floor((run.length - 1) / 2)];
        windows.push({
          frames: run.length * STRIDE,
          fromU: frames[run[0][0]].x / P.U,
          toU: frames[run[run.length - 1][0]].x / P.U,
          atU: frames[pf].x / P.U
        });
        jumps++;
        const o = frames[pf].succ[pi * 2 + 1];
        if (o === WIN) return { windows, jumps, orbInputs, frames: pf + 1 };
        f = pf + 1; idx = o;
        continue;
      }
      // le joueur a quitté le sol sans sauter (bord de plateforme)
      f = ff; idx = ii;
      if (f >= frames.length) break;
    }

    // en vol : on ne presse que si c'est nécessaire (orbe)
    const keep = ok(f, idx, 0);
    const h = keep ? 0 : 1;
    if (!keep && !ok(f, idx, 1)) return null;
    if (h === 1) { jumps++; orbInputs++; }
    const o = frames[f].succ[idx * 2 + h];
    if (o === WIN) return { windows, jumps, orbInputs, frames: f + 1 };
    if (o === DEAD) return null;
    f++; idx = o;
  }
  return null;
}

/* Seuil de régression : en dessous, le saut demande une précision qu'aucun
   joueur ne peut tenir de façon fiable. Le script sort en erreur. */
const MIN_WINDOW_MS = 40;

let failed = 0;
const levels = GD.buildLevels();

console.log('Physique : vitesse ' + P.SPEED + ' px/s, gravité ' + P.GRAVITY +
  ', saut ' + P.JUMP_V + ' (arc ≈ ' +
  (P.JUMP_V * P.JUMP_V / (2 * P.GRAVITY) / P.U).toFixed(2) + ' cases de haut, ' +
  (2 * P.JUMP_V / P.GRAVITY * P.SPEED / P.U).toFixed(2) + ' cases de long)\n');

for (const lvl of levels) {
  const maxFrames = Math.ceil(lvl.length / (P.SPEED * P.DT)) + 8;
  const t0 = Date.now();
  const { frames, peak } = explore(lvl, maxFrames);
  const win = backward(frames);
  const res = play(lvl, frames, win);
  const ms = Date.now() - t0;

  const head = lvl.name + ' (' + lvl.difficulty + ', ' + lvl.lengthU + ' cases)';
  if (!res) {
    failed++;
    // Jusqu'où peut-on aller au mieux ?
    let last = 0;
    for (let f = 0; f < frames.length; f++) if (frames[f].list.length) last = f;
    console.log('✗ ' + head + ' — INFRANCHISSABLE. Progression maximale : ' +
      (frames[last].x / P.U).toFixed(1) + ' / ' + lvl.lengthU + ' cases (' +
      (100 * frames[last].x / lvl.length).toFixed(0) + '%)');
    continue;
  }

  const sorted = res.windows.slice().sort((a, b) => a.frames - b.frames);
  const min = sorted[0];
  const tight = sorted.filter((w) => w.frames < 10).slice(0, 8);
  if (!sorted.length) { console.log('✓ ' + head + ' — aucun saut au sol requis'); continue; }
  const toMs = (fr) => (fr * P.DT * 1000).toFixed(0);

  console.log('✓ ' + head);
  console.log('   franchissable en ' + (res.frames * P.DT).toFixed(1) + ' s, ' +
    res.jumps + ' sauts obligatoires (dont ' + res.orbInputs + ' orbes), ' +
    peak + ' états simultanés max, calcul ' + ms + ' ms');
  console.log('   fenêtre de saut la plus serrée : ' + min.frames + ' frames (' + toMs(min.frames) +
    ' ms) vers la case ' + min.atU.toFixed(1));
  const med = sorted[Math.floor(sorted.length / 2)].frames;
  console.log('   médiane : ' + med + ' frames (' + toMs(med) + ' ms)');
  if (process.env.GD_VERBOSE) {
    console.log('   detail des fenetres :');
    res.windows.forEach((w) => console.log('      ' + String(w.frames).padStart(4) + 'f  ' +
      w.fromU.toFixed(1) + ' -> ' + w.toU.toFixed(1) + '  (saut a ' + w.atU.toFixed(1) + ')'));
  }
  if (tight.length) {
    console.log('   ⚠ sauts à moins de 10 frames : ' +
      tight.map((w) => w.frames + 'f@' + w.atU.toFixed(0)).join(', '));
  }
  if (min.frames * P.DT * 1000 < MIN_WINDOW_MS) {
    failed++;
    console.log('   ✗ fenêtre sous le seuil de ' + MIN_WINDOW_MS + ' ms : injouable');
  }
  console.log('');
}

if (failed) {
  console.log(failed + ' niveau(x) infranchissable(s) ou trop serré(s).');
  process.exit(1);
}
console.log('Tous les niveaux sont franchissables, avec une tolérance de saut ' +
  'd\'au moins ' + MIN_WINDOW_MS + ' ms partout.');
