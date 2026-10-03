#!/usr/bin/env node
// marketbuss — fabrique site/icons.js à partir des icônes Lucide (licence ISC).
//
// Le site n'embarque que les icônes dont il se sert : celles des outils
// (contenu.js), des catégories de l'annuaire (arsenal.js) et celles de
// l'interface (liste UI ci-dessous). Après avoir ajouté une icône :
//
//   cd plateforme && npm install && npm run icons
//
// Les noms sont ceux de https://lucide.dev/icons.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { STARTUP_MODULES, TOOLS } from '../site/contenu.js';
import { ARSENAL } from '../site/arsenal.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const lucide = path.resolve(here, '../node_modules/lucide-static');

/* Les icônes de l'interface (boutons, titres, repères). */
const UI = [
  'arrow-right', 'arrow-up-right', 'book-open', 'calculator', 'check', 'chevron-right', 'circle-question-mark', 'copy', 'download',
  'flask-conical', 'id-card', 'languages', 'lightbulb', 'link', 'list-checks', 'moon', 'notebook-pen', 'plus', 'printer', 'rocket',
  'rotate-ccw', 'route', 'search', 'sun', 'trash', 'triangle-alert', 'upload', 'x',
];

const nodes = JSON.parse(await readFile(path.join(lucide, 'icon-nodes.json'), 'utf8'));
const { version } = JSON.parse(await readFile(path.join(lucide, 'package.json'), 'utf8'));
const names = [...new Set([...TOOLS.map((t) => t.icon), ...STARTUP_MODULES.map((m) => m.icon), ...ARSENAL.map((c) => c.icon), ...UI])].sort();
const missing = names.filter((n) => !nodes[n]);
if (missing.length) {
  console.error('Icônes inconnues de Lucide ' + version + ' : ' + missing.join(', '));
  process.exit(1);
}

const lines = names.map((n) => `  '${n}': ${JSON.stringify(nodes[n])},`);
const out = `// marketbuss — les icônes du site. Fichier fabriqué par plateforme/tools/icons.mjs : ne pas le modifier à la main.
//
// Icônes Lucide ${version} (https://lucide.dev), licence ISC :
// Copyright (c) Lucide Icons and Contributors. Certaines icônes viennent du
// projet Feather (licence MIT), Copyright (c) 2013-2023 Cole Bemis.
// Une icône : la liste de ses tracés, [balise, attributs].

export const ICONS = {
${lines.join('\n')}
};
`;
await writeFile(path.resolve(here, '../site/icons.js'), out);
console.log(`site/icons.js : ${names.length} icônes (Lucide ${version}).`);
