// marketbuss — moteur : transforme les données brutes des sources en un
// instantané prêt à afficher (marketbuss/site/data/latest.json).
//
//   - Arena AI (classements par votes à l'aveugle, une « arène » par usage) :
//     la qualité, le rang, l'historique ;
//   - LiteLLM (base ouverte des prix publics des fournisseurs) : les prix,
//     la taille du contexte, les capacités ;
//   - OpenRouter (catalogue en ligne, facultatif) : les sorties récentes, les
//     versions gratuites, les noms officiels.
//
// Fonctions pures, sans réseau (voir sources.js pour le téléchargement) :
// tout se teste avec de petites données d'exemple.

/* Les arènes suivies. `llm` : modèles de texte ; `media` : création
   d'images et de vidéos. `weight` : poids dans l'indice marketbuss. */
export const CATEGORIES = [
  { id: 'text', label: 'Texte', group: 'llm', weight: 0.35, history: true,
    desc: 'Conversation, rédaction, raisonnement' },
  { id: 'code', label: 'Code', group: 'llm', weight: 0.35, history: true,
    desc: 'Programmation et développement web' },
  { id: 'vision', label: 'Vision', group: 'llm', weight: 0.15, history: true,
    desc: 'Comprendre des images et des captures' },
  { id: 'document', label: 'Documents', group: 'llm', weight: 0.15, history: true,
    desc: 'PDF et documents longs' },
  { id: 'search', label: 'Recherche web', group: 'llm',
    desc: 'Réponses appuyées sur une recherche en ligne' },
  { id: 'agent', label: 'Agents', group: 'llm', metric: 'Net Improvement',
    desc: 'Tâches menées seul, avec des outils' },
  { id: 'text-to-image', label: 'Images', group: 'media', desc: 'Créer une image à partir d\'un texte' },
  { id: 'image-edit', label: 'Retouche', group: 'media', desc: 'Modifier une image existante' },
  { id: 'text-to-video', label: 'Vidéo', group: 'media', desc: 'Créer une vidéo à partir d\'un texte' },
  { id: 'image-to-video', label: 'Image → vidéo', group: 'media', desc: 'Animer une image' },
  { id: 'video-edit', label: 'Montage vidéo', group: 'media', desc: 'Modifier une vidéo existante' },
];
export const INDEX_CATS = CATEGORIES.filter((c) => c.weight);
const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

/* Réglages d'un même modèle (effort de réflexion, recherche…) : on les
   regroupe sous le modèle, avec son meilleur réglage. */
const EFFORTS = new Set(['high', 'xhigh', 'max', 'low', 'medium', 'minimal', 'none', 'thinking',
  'reasoning', 'nothinking', 'instant', 'search', 'grounding', 'fast', 'agent']);

// Fournisseurs « officiels » d'abord : leur prix est le prix catalogue.
const PROVIDER_RANK = ['openai', 'anthropic', 'gemini', 'vertex_ai-language-models', 'xai', 'mistral',
  'deepseek', 'moonshot', 'meta', 'meta_llama', 'zai', 'dashscope', 'qwen_ai_platform', 'qwencloud',
  'minimax', 'cohere', 'openrouter'];

const DAY = 86400000;

/* ---------- Noms ---------- */

export function slug(raw) {
  return String(raw ?? '').toLowerCase().trim()
    .replace(/[\s._:/]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// « -2026-06-22 », « -20260622 », « -0709 » (mois-jour) en fin de nom.
export function stripDate(s) {
  return s
    .replace(/-20\d\d-[01]\d-[0-3]\d$/, '')
    .replace(/-20\d\d[01]\d[0-3]\d$/, '')
    .replace(/-(0[1-9]|1[0-2])[0-3]\d$/, '');
}

/* Nom affiché dans une arène → modèle (`base`) + réglage (`variant`).
   `known(s)` dit si `s` est un modèle connu des catalogues de prix : on
   s'arrête alors de retirer des suffixes (« qwen3.8-max » est un modèle,
   « claude-opus-4-6-max » un réglage). */
export function parseName(raw, known = () => false) {
  const variants = [];
  let s = String(raw ?? '').replace(/\(([^)]*)\)/g, (_, v) => {
    if (v.trim()) variants.push(v.trim().toLowerCase());
    return ' ';
  });
  s = stripDate(slug(s)).replace(/^api-(?=[a-z])/, '');
  for (;;) {
    if (known(s)) break;
    const parts = s.split('-');
    const last = parts[parts.length - 1];
    if (parts.length > 2 && (last === 'reasoning' || last === 'thinking') && /^(non|no)$/.test(parts[parts.length - 2])) {
      variants.unshift(parts[parts.length - 2] + '-' + last);
      s = parts.slice(0, -2).join('-');
    } else if (parts.length > 1 && EFFORTS.has(last)) {
      variants.unshift(last);
      s = parts.slice(0, -1).join('-');
    } else if (parts.length > 2 && /^\d+k$/.test(last) && parts[parts.length - 2] === 'thinking') {
      variants.unshift('thinking ' + last);
      s = parts.slice(0, -2).join('-');
    } else {
      break;
    }
  }
  return { base: s, variant: variants.join(' · ') };
}

const WORDS = {
  gpt: 'GPT', glm: 'GLM', mai: 'MAI', api: 'API', oss: 'OSS', vl: 'VL', tts: 'TTS', ai: 'AI', xl: 'XL',
  deepseek: 'DeepSeek', minimax: 'MiniMax', xai: 'xAI', openai: 'OpenAI', flux: 'FLUX', hd: 'HD',
  ppl: 'PPL', lfm: 'LFM', ernie: 'ERNIE', nemotron: 'Nemotron',
};

/* « claude-opus-4-6 » → « Claude Opus 4.6 », « gpt-5-6-sol » → « GPT-5.6 Sol ». */
export function prettify(base) {
  const parts = String(base).split('-').filter(Boolean);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (/^\d+$/.test(p)) {
      let num = p;
      while (i + 1 < parts.length && /^\d{1,2}$/.test(parts[i + 1]) && p.length <= 2) num += '.' + parts[++i];
      if (out.length && out[out.length - 1] === 'GPT') out[out.length - 1] = 'GPT-' + num;
      else out.push(num);
      continue;
    }
    // « k2-6 » → « K2.6 », « qwen3-8 » → « Qwen3.8 ».
    let word = p;
    if (/^[a-z]+\d+$/.test(p) && i + 1 < parts.length && /^\d{1,2}$/.test(parts[i + 1])) word = p + '.' + parts[++i];
    if (word !== p) out.push(/^[vkr]\d/.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1));
    else if (WORDS[p]) out.push(WORDS[p]);
    else if (/^\d+(\.\d+)?[bkm]$/.test(p)) out.push(p.toUpperCase());
    else if (/^a\d+b$/.test(p)) out.push(p.toUpperCase());
    else if (/^[vkr]\d+(\.\d+)?$/.test(p)) out.push(p.toUpperCase());
    else if (/^\d+o$/.test(p) && out[out.length - 1] === 'GPT') out[out.length - 1] = 'GPT-' + p;
    else if (/^o\d+$/.test(p) || /^\d+o$/.test(p)) out.push(p);
    else out.push(p.charAt(0).toUpperCase() + p.slice(1));
  }
  return out.join(' ');
}

/* ---------- Prix (LiteLLM) ---------- */

/* Clé LiteLLM (« bedrock/eu.anthropic.claude-opus-4-6-v1:0 »,
   « openrouter/openai/gpt-6.1-sol ») → nom de modèle comparable. */
export function catalogKey(key) {
  let s = String(key).toLowerCase().split('/').pop();
  s = s.replace(/:(free|beta|extended|thinking|nitro|floor|online|exacto)$/, '');
  s = s.replace(/^(us|eu|apac|au|jp|ca|global|us-gov)\./, '');
  const dot = s.match(/^([a-z]+)\.(.+)$/);
  if (dot && dot[1].length < 20) {
    // Style Bedrock : « anthropic.claude-opus-4-6-v1:0 », « openai.gpt-oss-120b-1:0 ».
    // « deepseek.v3.2 » garde son nom, les autres perdent préfixe et version.
    s = /^v\d/.test(dot[2]) ? dot[1] + '-' + dot[2] : dot[2].replace(/-v\d+(:\d+)?$/, '').replace(/-\d+:\d+$/, '');
  }
  return stripDate(slug(s));
}

const perMillion = (x) => (typeof x === 'number' && isFinite(x) ? Math.round(x * 1e6 * 10000) / 10000 : null);

export function blended(input, output) {
  if (input == null || output == null) return null;
  return Math.round(((3 * input + output) / 4) * 10000) / 10000;
}

/* Index des prix : nom comparable → meilleure entrée (fournisseur officiel
   d'abord). Seuls les modèles de texte (chat) sont gardés. */
export function priceIndex(litellm) {
  const index = new Map();
  for (const [key, v] of Object.entries(litellm || {})) {
    if (!v || typeof v !== 'object' || key === 'sample_spec') continue;
    if (v.mode !== 'chat' && v.mode !== 'responses') continue;
    if (typeof v.input_cost_per_token !== 'number' || typeof v.output_cost_per_token !== 'number') continue;
    if (/(^|[/:.-])(batch|batches|flex|priority)([/:.-]|$)/.test(key)) continue;
    const name = catalogKey(key);
    if (!name) continue;
    const rank = PROVIDER_RANK.indexOf(v.litellm_provider);
    const entry = { key, provider: v.litellm_provider || null, rank: rank < 0 ? 99 : rank, v };
    const prev = index.get(name);
    if (!prev || entry.rank < prev.rank || (entry.rank === prev.rank && key.length < prev.key.length)) {
      index.set(name, entry);
    }
  }
  return index;
}

/* ---------- Catalogue OpenRouter ---------- */

export function openrouterIndex(list) {
  const index = new Map();
  for (const m of Array.isArray(list) ? list : []) {
    if (!m || typeof m.id !== 'string') continue;
    const free = /:free$/.test(m.id);
    const name = catalogKey(m.id);
    if (!name) continue;
    const cur = index.get(name) || { entry: null, free: false };
    if (free) cur.free = true;
    else if (!cur.entry || String(m.id).length < String(cur.entry.id).length) cur.entry = m;
    if (!cur.entry && free) cur.freeEntry = m;
    index.set(name, cur);
  }
  return index;
}

// « Alibaba: Qwen3.8 Max (0902) » → « Qwen3.8 Max ».
const orName = (m) => String(m.name || '').replace(/^[^:]{1,40}:\s*/, '')
  .replace(/\s*\((\d{4}|\d{6}|\d{8}|free)\)\s*$/i, '').trim() || null;
const orPrice = (m) => {
  const p = m && m.pricing;
  if (!p) return null;
  const input = perMillion(Number(p.prompt));
  const output = perMillion(Number(p.completion));
  if (input == null || output == null || input < 0 || output < 0) return null;
  return { input, output, cacheRead: perMillion(Number(p.input_cache_read)) || null };
};

function lookup(index, base) {
  const tries = [base, base + '-preview', base.replace(/-preview$/, ''), base.replace(/-latest$/, ''), base + '-latest'];
  for (const t of tries) if (t && index.has(t)) return index.get(t);
  return null;
}

/* ---------- Arènes ---------- */

const points = (score, top) => (score == null || top == null ? null
  : Math.min(100, Math.round((200 / (1 + 10 ** ((top - score) / 400))) * 10) / 10));

/* Une liste de l'arène → modèles regroupés (meilleur réglage de chacun),
   classés. */
export function groupBoard(cat, rows, known) {
  const byBase = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || !r.model) continue;
    const score = cat === 'agent' ? agentScore(r) : num(r.score);
    if (score == null) continue;
    const { base, variant } = parseName(r.model, known);
    if (!base) continue;
    const row = {
      base, variant, raw: String(r.model), score,
      ci: num(cat === 'agent' ? agentCi(r) : r.ci),
      votes: num(cat === 'agent' ? r.sessions : r.votes),
      vendor: r.vendor || null, license: r.license || null,
    };
    const cur = byBase.get(base);
    if (!cur) byBase.set(base, { ...row, variants: [variant].filter(Boolean) });
    else {
      if (variant && !cur.variants.includes(variant)) cur.variants.push(variant);
      if (row.score > cur.score || (row.score === cur.score && (row.votes || 0) > (cur.votes || 0))) {
        Object.assign(cur, { ...row, variants: cur.variants });
      }
      cur.vendor ||= row.vendor;
      cur.license ||= row.license;
    }
  }
  const list = [...byBase.values()].sort((a, b) => b.score - a.score || (b.votes || 0) - (a.votes || 0));
  list.forEach((r, i) => { r.rank = i + 1; });
  return list;
}

function num(x) {
  const n = typeof x === 'string' ? Number(x) : x;
  return typeof n === 'number' && isFinite(n) ? n : null;
}
function agentMetric(r) {
  const list = Array.isArray(r.scores) ? r.scores : [];
  return list.find((s) => s && s.name === CAT.agent.metric) || null;
}
const agentScore = (r) => num((agentMetric(r) || {}).score);
const agentCi = (r) => num((agentMetric(r) || {}).ci);

/* ---------- Instantané ---------- */

/*
  input = {
    now: Date,
    arena: { fetchedAt, boards: { cat: { meta, models } },
             history: { cat: [{ date, models }] },   // arènes `history: true`
             past: { cat: { d7: { date, models }, d30: { date, models } } } },
    litellm: { … } | null,
    openrouter: [ … ] | null,
    previous: instantané précédent | null,
    sources: [ { id, ok, … } ],
  }
*/
export function buildSnapshot(input) {
  const now = input.now ? new Date(input.now) : new Date();
  const arena = input.arena || { boards: {} };
  const prices = priceIndex(input.litellm);
  const ors = openrouterIndex(input.openrouter);
  const known = (s) => prices.has(s) || ors.has(s);
  const previous = input.previous && Array.isArray(input.previous.models) ? input.previous : null;
  const prevById = new Map((previous ? previous.models : []).map((m) => [m.id, m]));

  const models = new Map();
  const model = (base) => {
    if (!models.has(base)) models.set(base, { id: base, cats: {}, variants: [], vendor: null, license: null });
    return models.get(base);
  };

  const categories = [];
  for (const cat of CATEGORIES) {
    const board = arena.boards && arena.boards[cat.id];
    const rows = groupBoard(cat.id, board && board.models, known);
    if (!rows.length) continue;
    const top = rows[0].score;
    const floor = rows[rows.length - 1].score;
    const past7 = rankMap(cat.id, arena.past && arena.past[cat.id] && arena.past[cat.id].d7, known);
    const past30 = rankMap(cat.id, arena.past && arena.past[cat.id] && arena.past[cat.id].d30, known);
    for (const r of rows) {
      const m = model(r.base);
      m.vendor ||= r.vendor;
      if (r.license === 'open' || (!m.license && r.license)) m.license = r.license;
      for (const v of r.variants) if (!m.variants.includes(v)) m.variants.push(v);
      const p7 = past7 && past7.get(r.base);
      const p30 = past30 && past30.get(r.base);
      m.cats[cat.id] = {
        score: r.score, ci: r.ci, votes: r.votes, rank: r.rank,
        points: cat.id === 'agent' ? Math.round((100 * r.score / top) * 10) / 10 : points(r.score, top),
        variant: r.variant || null,
        rank7: past7 ? (p7 ? p7.rank : 0) : null,
        rank30: past30 ? (p30 ? p30.rank : 0) : null,
        score7: p7 ? p7.score : null,
      };
    }
    categories.push({
      id: cat.id, label: cat.label, group: cat.group, desc: cat.desc, weight: cat.weight || 0,
      metric: cat.id === 'agent' ? 'Amélioration nette' : 'Elo',
      count: rows.length, top, floor, leader: rows[0].base,
      updated: (board.meta && board.meta.last_updated) || null,
      past7: arena.past && arena.past[cat.id] && arena.past[cat.id].d7 ? arena.past[cat.id].d7.date : null,
    });
  }
  const catInfo = Object.fromEntries(categories.map((c) => [c.id, c]));

  // Historique quotidien (arènes principales) : courbe, entrées, changements de n° 1.
  const firstSeen = new Map();
  const events = [];
  let oldest = null;
  for (const cat of CATEGORIES.filter((c) => c.history)) {
    const days = ((arena.history && arena.history[cat.id]) || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    if (!days.length || !catInfo[cat.id]) continue;
    if (!oldest || days[0].date < oldest) oldest = days[0].date;
    let leader = null;
    const seen = new Set();
    days.forEach((day, i) => {
      const rows = groupBoard(cat.id, day.models, known);
      for (const r of rows) {
        const m = models.get(r.base);
        if (m) {
          m.hist ||= {};
          (m.hist[cat.id] ||= []).push([day.date, r.score, r.rank]);
        }
        if (!firstSeen.has(r.base) || day.date < firstSeen.get(r.base)) firstSeen.set(r.base, day.date);
        // Entrée dans le classement (sauf si c'est directement à la 1re place :
        // l'événement « prend la tête » la raconte déjà).
        if (i > 0 && !seen.has(r.base) && models.has(r.base) && r.rank > 1) {
          events.push({ date: day.date, type: 'entry', model: r.base, cat: cat.id, rank: r.rank });
        }
        seen.add(r.base);
      }
      if (rows.length) {
        if (leader && rows[0].base !== leader) {
          events.push({ date: day.date, type: 'leader', model: rows[0].base, cat: cat.id, previous: leader });
        }
        leader = rows[0].base;
      }
    });
  }

  // Prix, contexte, capacités, catalogue OpenRouter.
  for (const m of models.values()) {
    const lit = lookup(prices, m.id);
    const or = lookup(ors, m.id);
    const v = lit ? lit.v : null;
    if (v) {
      const input = perMillion(v.input_cost_per_token);
      const output = perMillion(v.output_cost_per_token);
      m.price = {
        input, output, cacheRead: perMillion(v.cache_read_input_token_cost),
        blended: blended(input, output), source: 'litellm', provider: lit.provider,
      };
    } else if (or && or.entry && orPrice(or.entry)) {
      const p = orPrice(or.entry);
      m.price = { ...p, blended: blended(p.input, p.output), source: 'openrouter', provider: 'openrouter' };
    } else if (!input.litellm && prevById.get(m.id) && prevById.get(m.id).price) {
      // Base des prix injoignable ce coup-ci : on garde le prix du passage précédent.
      m.price = { ...prevById.get(m.id).price, stale: true };
    } else {
      m.price = null;
    }
    const orEntry = or && (or.entry || or.freeEntry);
    m.context = num(v && v.max_input_tokens) || num(orEntry && (orEntry.context_length
      || (orEntry.top_provider && orEntry.top_provider.context_length))) || null;
    m.maxOutput = num(v && v.max_output_tokens) || num(orEntry && orEntry.top_provider
      && orEntry.top_provider.max_completion_tokens) || null;
    const mods = (orEntry && orEntry.architecture && orEntry.architecture.input_modalities) || [];
    m.caps = {
      vision: !!((v && v.supports_vision) || mods.includes('image')),
      reasoning: !!(v && v.supports_reasoning),
      tools: !!(v && v.supports_function_calling),
      pdf: !!((v && v.supports_pdf_input) || mods.includes('file')),
      audio: !!((v && v.supports_audio_input) || mods.includes('audio')),
      web: !!(v && v.supports_web_search),
    };
    m.or = orEntry ? { id: String(orEntry.id).replace(/:free$/, ''), created: orEntry.created || null, free: !!or.free } : null;
    m.name = (orEntry && orName(orEntry)) || prettify(m.id);
    m.group = Object.keys(m.cats).some((c) => CAT[c].group === 'llm') ? 'llm' : 'media';
    const fs = firstSeen.get(m.id) || null;
    m.firstSeen = fs && oldest && fs > oldest ? fs : null;
    m.isNew = !!(m.firstSeen && now - new Date(m.firstSeen + 'T00:00:00Z') <= 14 * DAY);
  }

  // Indice marketbuss : moyenne pondérée des arènes principales. Absent du
  // haut d'une arène = compté juste sous la dernière place de cette arène,
  // sauf pour un modèle arrivé depuis moins de 14 jours : l'arène est alors
  // laissée de côté (pas encore assez de votes) et l'indice est provisoire.
  for (const m of models.values()) {
    const present = INDEX_CATS.filter((c) => m.cats[c.id]);
    if (!present.some((c) => c.id === 'text' || c.id === 'code')) { m.index = null; continue; }
    let sum = 0;
    let weights = 0;
    for (const c of INDEX_CATS) {
      const info = catInfo[c.id];
      if (!info) continue;
      const cell = m.cats[c.id];
      if (!cell && m.isNew) { m.provisional = true; continue; }
      const p = cell ? cell.points : points(info.floor - 10, info.top);
      sum += c.weight * p;
      weights += c.weight;
    }
    m.index = weights ? Math.round((sum / weights) * 10) / 10 : null;
    m.coverage = present.length;
  }
  const ranked = [...models.values()].filter((m) => m.index != null)
    .sort((a, b) => b.index - a.index || (b.cats.text ? b.cats.text.score : 0) - (a.cats.text ? a.cats.text.score : 0));
  ranked.forEach((m, i) => { m.rank = i + 1; });

  // Rang au classement général il y a 7 jours (même calcul, arènes d'alors).
  const old = new Map();
  for (const c of INDEX_CATS) {
    const snap7 = arena.past && arena.past[c.id] && arena.past[c.id].d7;
    if (!snap7) continue;
    const rows = groupBoard(c.id, snap7.models, known);
    if (!rows.length) continue;
    const top = rows[0].score;
    const floor = rows[rows.length - 1].score;
    for (const r of rows) {
      const o = old.get(r.base) || { cells: {} };
      o.cells[c.id] = points(r.score, top);
      old.set(r.base, o);
    }
    old.set('__' + c.id, { floor: points(floor - 10, top) });
  }
  if (old.size) {
    const idx7 = [];
    for (const [base, o] of old) {
      if (base.startsWith('__') || !(o.cells.text != null || o.cells.code != null)) continue;
      let sum = 0;
      let w = 0;
      for (const c of INDEX_CATS) {
        const floorInfo = old.get('__' + c.id);
        if (!floorInfo) continue;
        sum += c.weight * (o.cells[c.id] ?? floorInfo.floor);
        w += c.weight;
      }
      idx7.push([base, sum / w]);
    }
    idx7.sort((a, b) => b[1] - a[1]);
    const rank7 = new Map(idx7.map(([base], i) => [base, i + 1]));
    for (const m of ranked) m.rank7 = rank7.get(m.id) || 0;
  }
  for (const m of models.values()) {
    if (m.rank == null) m.rank = null;
    const prev = prevById.get(m.id);
    m.rankPrev = prev && prev.rank != null ? prev.rank : null;
  }

  // Frontière qualité/prix : aucun modèle n'est à la fois meilleur et moins cher.
  let best = -1;
  for (const m of ranked.filter((x) => x.price && x.price.blended != null)
    .sort((a, b) => a.price.blended - b.price.blended || b.index - a.index)) {
    m.pareto = m.index > best;
    if (m.pareto) best = m.index;
  }

  // Changements de prix : comparés au passage précédent du robot, puis gardés 90 jours.
  const today = now.toISOString().slice(0, 10);
  const carried = (previous && Array.isArray(previous.events) ? previous.events : [])
    .filter((e) => e && e.type === 'price' && now - new Date(e.date + 'T00:00:00Z') <= 90 * DAY);
  for (const m of models.values()) {
    const prev = prevById.get(m.id);
    if (!prev || !prev.price || !m.price || prev.price.blended == null || m.price.blended == null) continue;
    const change = (m.price.blended - prev.price.blended) / prev.price.blended;
    if (Math.abs(change) >= 0.01) {
      carried.push({ date: today, type: 'price', model: m.id, from: prev.price.blended, to: m.price.blended });
    }
  }
  events.push(...carried);

  // Sorties récentes (catalogue OpenRouter).
  const releases = [];
  for (const [, o] of ors) {
    const e = o.entry || o.freeEntry;
    if (!e || !e.created) continue;
    const created = new Date(Number(e.created) * 1000);
    if (!(now - created <= 30 * DAY)) continue;
    const p = orPrice(e);
    const base = catalogKey(e.id);
    releases.push({
      id: String(e.id).replace(/:free$/, ''), name: orName(e) || prettify(base),
      vendor: String(e.id).split('/')[0] || null, created: created.toISOString(),
      context: num(e.context_length), price: p ? { ...p, blended: blended(p.input, p.output) } : null,
      free: !!o.free, model: models.has(base) ? base : null,
    });
    events.push({ date: created.toISOString().slice(0, 10), type: 'release', model: models.has(base) ? base : null,
      name: orName(e) || prettify(base), orId: String(e.id).replace(/:free$/, '') });
  }
  releases.sort((a, b) => b.created.localeCompare(a.created));

  const seenEvents = new Set();
  const cutoff = new Date(now - 30 * DAY).toISOString().slice(0, 10);
  const recent = events
    .filter((e) => e.type === 'price' || e.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date) || order(a) - order(b))
    .filter((e) => {
      const key = [e.type, e.model, e.cat, e.date, e.to, e.orId].join('|');
      if (seenEvents.has(key)) return false;
      seenEvents.add(key);
      return true;
    })
    .slice(0, 80);

  const list = [...models.values()].sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9)
    || bestPoints(b) - bestPoints(a) || a.name.localeCompare(b.name));
  const vendors = new Set(list.map((m) => m.vendor).filter(Boolean));

  return {
    version: 1,
    generatedAt: now.toISOString(),
    schedule: { cron: '17 */3 * * *', everyHours: 3, minute: 17 },
    sources: input.sources || [],
    categories,
    stats: {
      models: list.length,
      ranked: ranked.length,
      vendors: vendors.size,
      open: list.filter((m) => m.license === 'open').length,
      priced: list.filter((m) => m.price).length,
      fresh: list.filter((m) => m.isNew).length,
      releases: releases.length,
      historyFrom: oldest,
    },
    models: list.map(clean),
    releases: releases.slice(0, 40),
    events: recent,
  };
}

const order = (e) => ({ leader: 0, entry: 1, price: 2, release: 3 }[e.type] ?? 9);
const bestPoints = (m) => Math.max(0, ...Object.values(m.cats).map((c) => c.points || 0));

function rankMap(cat, snap, known) {
  if (!snap || !snap.models) return null;
  return new Map(groupBoard(cat, snap.models, known).map((r) => [r.base, r]));
}

// Champs vides retirés : instantané plus léger.
function clean(m) {
  const out = {};
  for (const [k, v] of Object.entries(m)) {
    if (v == null || v === false || (Array.isArray(v) && !v.length)) continue;
    out[k] = v;
  }
  return out;
}

/* ---------- Flux Atom (abonnement aux nouveautés) ---------- */

const esc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

export function describeEvent(e, snap) {
  const byId = new Map(snap.models.map((m) => [m.id, m]));
  const cats = new Map(snap.categories.map((c) => [c.id, c]));
  const name = (id) => (byId.get(id) || {}).name || e.name || prettify(id || '');
  const cat = e.cat && cats.get(e.cat) ? cats.get(e.cat).label : e.cat;
  if (e.type === 'leader') return `${name(e.model)} prend la tête du classement ${cat} (devant ${name(e.previous)})`;
  if (e.type === 'entry') return `${name(e.model)} entre dans le classement ${cat} (n° ${e.rank})`;
  if (e.type === 'price') {
    const pct = Math.round(((e.to - e.from) / e.from) * 100);
    return `${name(e.model)} : prix ${pct < 0 ? 'en baisse' : 'en hausse'} de ${Math.abs(pct)} % (${e.from} → ${e.to} $ / M de jetons)`;
  }
  if (e.type === 'release') return `Nouveau modèle disponible : ${e.name || name(e.model)}`;
  return name(e.model);
}

export function atomFeed(snap, siteUrl) {
  const base = siteUrl.replace(/\/?$/, '/');
  const entries = snap.events.slice(0, 40).map((e, i) => {
    const title = describeEvent(e, snap);
    const link = e.model ? `${base}#/modele/${encodeURIComponent(e.model)}` : `${base}#/nouveautes`;
    const id = `${base}#evt-${[e.type, e.model || e.orId, e.cat || '', e.date, i].join('-')}`;
    return `  <entry>
    <title>${esc(title)}</title>
    <link href="${esc(link)}"/>
    <id>${esc(id)}</id>
    <updated>${esc(e.date)}T00:00:00Z</updated>
    <summary>${esc(title)}</summary>
  </entry>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="fr">
  <title>marketbuss — mouvements du marché des IA</title>
  <subtitle>Nouveaux n° 1, entrées dans les classements, sorties et changements de prix.</subtitle>
  <link href="${esc(base)}"/>
  <link rel="self" href="${esc(base)}data/feed.xml"/>
  <id>${esc(base)}</id>
  <updated>${esc(snap.generatedAt)}</updated>
${entries}
</feed>
`;
}
