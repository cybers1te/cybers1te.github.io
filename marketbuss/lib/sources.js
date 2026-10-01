// marketbuss — téléchargement des sources (Node 22 ou navigateur : fetch).
// Chaque fonction renvoie les données brutes ; engine.js les assemble.

export const SOURCES = {
  arena: {
    name: 'Arena AI (ex-LMSYS Chatbot Arena)',
    url: 'https://arena.ai/leaderboard',
    // Copie quotidienne en JSON des classements, licence MIT.
    raw: 'https://raw.githubusercontent.com/oolong-tea-2026/arena-ai-leaderboards/main/data/',
    repo: 'https://github.com/oolong-tea-2026/arena-ai-leaderboards',
  },
  litellm: {
    name: 'LiteLLM, la base des prix des fournisseurs',
    url: 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json',
    repo: 'https://github.com/BerriAI/litellm',
  },
  openrouter: {
    name: 'OpenRouter, le catalogue des modèles',
    url: 'https://openrouter.ai/api/v1/models',
    repo: 'https://openrouter.ai/models',
  },
};

const ARENA_CATS = ['text', 'code', 'vision', 'document', 'search', 'agent',
  'text-to-image', 'image-edit', 'text-to-video', 'image-to-video', 'video-edit'];
const HISTORY_CATS = ['text', 'code', 'vision', 'document'];
const HISTORY_DAYS = 30;

/* JSON d'une adresse : null si elle n'existe pas (404), erreur sinon. */
export async function getJson(url, { timeout = 30000, retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctl.signal, headers: { accept: 'application/json' } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${url} : HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

const shift = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') - days * 86400000).toISOString().slice(0, 10);

/* Date existante la plus proche de `target`, à 3 jours près. */
function nearest(dates, target) {
  let best = null;
  for (const d of dates) {
    const gap = Math.abs(Date.parse(d) - Date.parse(target)) / 86400000;
    if (gap <= 3 && (!best || gap < best.gap || (gap === best.gap && d < best.d))) best = { d, gap };
  }
  return best ? best.d : null;
}

/* Classements Arena AI du jour + 30 jours d'historique pour les arènes
   principales + l'état d'il y a 7 et 30 jours pour toutes. */
export async function fetchArena() {
  const base = SOURCES.arena.raw;
  const latest = await getJson(base + 'latest.json');
  if (!latest || !latest.path) throw new Error('Arena AI : latest.json introuvable');
  const day = String(latest.date || latest.path);
  const boards = {};
  await pool(ARENA_CATS, 6, async (cat) => {
    const board = await getJson(`${base}${latest.path}/${cat}.json`);
    if (board && Array.isArray(board.models) && board.models.length) boards[cat] = board;
  });
  if (!boards.text && !boards.code) throw new Error('Arena AI : classements texte et code absents');

  // Les dossiers du dépôt ont des trous : on part des dates où « texte » existe.
  const dates = Array.from({ length: HISTORY_DAYS }, (_, i) => shift(day, i + 1));
  const history = Object.fromEntries(HISTORY_CATS.map((c) => [c, []]));
  const textDays = await pool(dates, 6, (d) => getJson(`${base}${d}/text.json`).catch(() => null));
  const existing = dates.filter((d, i) => textDays[i] && Array.isArray(textDays[i].models));
  dates.forEach((d, i) => { if (textDays[i] && textDays[i].models) history.text.push({ date: d, models: textDays[i].models }); });
  const jobs = [];
  for (const cat of HISTORY_CATS.filter((c) => c !== 'text')) for (const d of existing) jobs.push([cat, d]);
  const got = await pool(jobs, 6, ([cat, d]) => getJson(`${base}${d}/${cat}.json`).catch(() => null));
  jobs.forEach(([cat, d], i) => { if (got[i] && got[i].models) history[cat].push({ date: d, models: got[i].models }); });
  for (const cat of HISTORY_CATS) if (boards[cat]) history[cat].push({ date: day, models: boards[cat].models });

  // Il y a 7 et 30 jours (au plus près).
  const d7 = nearest(existing, shift(day, 7));
  const d30 = nearest(existing, shift(day, 30)) || (existing.length ? existing[existing.length - 1] : null);
  const past = {};
  const pastJobs = [];
  for (const cat of ARENA_CATS) {
    past[cat] = {};
    for (const [key, d] of [['d7', d7], ['d30', d30]]) {
      if (!d) continue;
      const h = (history[cat] || []).find((x) => x.date === d);
      if (h) past[cat][key] = h;
      else pastJobs.push([cat, key, d]);
    }
  }
  const pastGot = await pool(pastJobs, 6, ([cat, , d]) => getJson(`${base}${d}/${cat}.json`).catch(() => null));
  pastJobs.forEach(([cat, key, d], i) => {
    if (pastGot[i] && pastGot[i].models) past[cat][key] = { date: d, models: pastGot[i].models };
  });

  return { date: day, fetchedAt: new Date().toISOString(), boards, history, past };
}

export async function fetchLitellm() {
  const data = await getJson(SOURCES.litellm.url, { timeout: 60000 });
  if (!data || typeof data !== 'object') throw new Error('LiteLLM : fichier des prix introuvable');
  return data;
}

export async function fetchOpenrouter() {
  const data = await getJson(SOURCES.openrouter.url);
  if (!data || !Array.isArray(data.data)) throw new Error('OpenRouter : catalogue introuvable');
  return data.data;
}
