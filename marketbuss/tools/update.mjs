#!/usr/bin/env node
// marketbuss — le robot de mise à jour.
//
//   node marketbuss/tools/update.mjs [--out dossier] [--previous adresse|fichier] [--site adresse]
//
// Télécharge les sources, calcule l'instantané (engine.js) et écrit
// <out>/latest.json et <out>/feed.xml. Lancé par GitHub Actions toutes les
// 3 heures avant chaque publication du site.
//
// Si Arena AI est injoignable, l'instantané précédent (celui du site en
// ligne) est republié tel quel ; à défaut, le fichier déjà présent dans
// <out> est conservé : le site n'est jamais publié sans données.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomFeed, buildSnapshot } from '../lib/engine.js';
import { SOURCES, fetchArena, fetchLitellm, fetchOpenrouter, getJson } from '../lib/sources.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const OUT = path.resolve(args.out || path.join(here, '../site/data'));
const SITE = String(args.site || 'https://marketbuss.github.io/');
const PREVIOUS = args.previous || null;

async function loadPrevious(where) {
  if (!where) return null;
  try {
    if (/^https?:\/\//.test(where)) return await getJson(where + (where.includes('?') ? '&' : '?') + 't=' + Date.now(), { retries: 1 });
    return JSON.parse(await readFile(where, 'utf8'));
  } catch (err) {
    console.warn('Instantané précédent illisible :', err.message);
    return null;
  }
}

async function attempt(id, fn) {
  const started = Date.now();
  try {
    const data = await fn();
    console.log(`✓ ${id} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    return { data, status: { id, ok: true } };
  } catch (err) {
    console.warn(`✗ ${id} : ${err.message}`);
    return { data: null, status: { id, ok: false, error: String(err.message).slice(0, 200) } };
  }
}

const [arena, litellm, openrouter, previous] = await Promise.all([
  attempt('arena', fetchArena),
  attempt('litellm', fetchLitellm),
  attempt('openrouter', fetchOpenrouter),
  loadPrevious(PREVIOUS),
]);

await mkdir(OUT, { recursive: true });
const target = path.join(OUT, 'latest.json');

if (!arena.data) {
  if (previous && Array.isArray(previous.models) && previous.models.length) {
    previous.checkedAt = new Date().toISOString();
    previous.stale = true;
    await writeFile(target, JSON.stringify(previous));
    await writeFile(path.join(OUT, 'feed.xml'), atomFeed(previous, SITE));
    console.warn('Arena AI injoignable : instantané précédent republié tel quel.');
  } else {
    console.warn('Arena AI injoignable et pas d\'instantané précédent : fichier existant conservé.');
  }
  process.exit(0);
}

const now = new Date();
const sources = [
  { ...arena.status, name: SOURCES.arena.name, url: SOURCES.arena.url, repo: SOURCES.arena.repo,
    fetchedAt: now.toISOString(), date: arena.data.date,
    boards: Object.keys(arena.data.boards).length },
  { ...litellm.status, name: SOURCES.litellm.name, url: SOURCES.litellm.repo,
    fetchedAt: litellm.data ? now.toISOString() : null,
    count: litellm.data ? Object.keys(litellm.data).length : 0 },
  { ...openrouter.status, name: SOURCES.openrouter.name, url: SOURCES.openrouter.repo,
    fetchedAt: openrouter.data ? now.toISOString() : null,
    count: openrouter.data ? openrouter.data.length : 0 },
];

const snap = buildSnapshot({
  now, arena: arena.data, litellm: litellm.data, openrouter: openrouter.data, previous, sources,
});
await writeFile(target, JSON.stringify(snap));
await writeFile(path.join(OUT, 'feed.xml'), atomFeed(snap, SITE));

// Résumé dans le journal du robot.
const kb = (Buffer.byteLength(JSON.stringify(snap)) / 1024).toFixed(0);
console.log(`\n${snap.stats.models} modèles, ${snap.stats.ranked} classés, ${snap.stats.priced} avec prix, `
  + `${snap.categories.length} arènes, ${snap.events.length} événements, ${snap.releases.length} sorties — ${kb} Ko`);
console.log('\nClassement général :');
for (const m of snap.models.filter((x) => x.rank).slice(0, 12)) {
  const price = m.price ? `${m.price.input} / ${m.price.output} $` : 'prix ?';
  console.log(`  ${String(m.rank).padStart(2)}. ${m.name.padEnd(28)} ${String(m.index).padStart(5)}  ${price}${m.pareto ? '  ◆' : ''}`);
}
console.log('\nN° 1 par arène :');
for (const c of snap.categories) {
  const leader = snap.models.find((m) => m.id === c.leader);
  console.log(`  ${c.label.padEnd(14)} ${leader ? leader.name : c.leader}`);
}
const unpriced = snap.models.filter((m) => m.group === 'llm' && !m.price).map((m) => m.id);
if (unpriced.length) console.log(`\nSans prix (${unpriced.length}) : ${unpriced.join(', ')}`);
