// marketbuss — tests des dessins et de la page : chaque icône et chaque
// personnage cités existent, la page charge les bons fichiers, et rien
// n'est écrit avec innerHTML.
//
//   node --test plateforme/tests/dessins.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { GUIDES, ROLES, STARTUP_MODULES, TOOLS } from '../site/contenu.js';
import { ARSENAL } from '../site/arsenal.js';
import { AVATAR_NAMES, ICON_NAMES } from '../site/dessins.js';

const site = new URL('../site/', import.meta.url);
const read = (name) => readFile(new URL(name, site), 'utf8');

describe('dessins', () => {
  it('chaque outil, chaque module et chaque catégorie a une icône qui existe', () => {
    const wanted = [...TOOLS.map((t) => t.icon), ...STARTUP_MODULES.map((m) => m.icon), ...ARSENAL.map((c) => c.icon)];
    for (const name of wanted) assert.ok(ICON_NAMES.includes(name), `icône absente de icons.js : ${name} (cd plateforme && npm run icons)`);
  });

  it("chaque icône citée dans les pages existe", async () => {
    const js = await read('marketbuss.js');
    const cited = [...js.matchAll(/\b(?:icon|badge)\('([a-z0-9-]+)'/g)].map((m) => m[1]);
    assert.ok(cited.length > 15);
    for (const name of cited) assert.ok(ICON_NAMES.includes(name), `icône absente de icons.js : ${name} (l'ajouter à UI dans tools/icons.mjs)`);
  });

  it('chaque profil et chaque guide a un personnage dessiné', () => {
    const wanted = [...Object.values(ROLES).map((r) => r.avatar), ...Object.values(GUIDES).map((g) => g.avatar)];
    assert.equal(new Set(wanted).size, wanted.length, 'deux personnages partagent le même dessin');
    for (const name of wanted) assert.ok(AVATAR_NAMES.includes(name), `personnage absent de dessins.js : ${name}`);
  });

  it('les sept profils ont chacun leur couleur', () => {
    const colors = Object.values(ROLES).map((r) => r.color);
    assert.equal(new Set(colors).size, colors.length);
    for (const c of colors) assert.match(c, /^p[1-7]$/);
  });
});

describe('page', () => {
  it('index.html charge des fichiers qui existent', async () => {
    const html = await read('index.html');
    const files = [...html.matchAll(/(?:href|src)="([^"#:]+?)(?:\?v=__V__)?"/g)].map((m) => m[1]);
    assert.ok(files.includes('marketbuss.css') && files.includes('marketbuss.js') && files.includes('logo.svg'));
    for (const f of files) await access(new URL(f, site));
  });

  it('la feuille de style contient les classes des pages', async () => {
    // Un contrôle simple ; la vérification complète (feuille refaite et comparée) est dans le workflow.
    const css = await read('marketbuss.css');
    for (const cls of ['.quadrille', '.surligne', '.curseur', '.bg-paper', '.text-ink', '.s-p1']) assert.ok(css.includes(cls), `classe absente de marketbuss.css : ${cls} (cd plateforme && npm run css)`);
    for (const font of ['fonts/recursive-sans.woff2', 'fonts/recursive-mono.woff2']) {
      assert.ok(css.includes(font));
      await access(new URL(font, site));
    }
  });

  it("aucun texte n'est posé avec innerHTML", async () => {
    for (const name of ['marketbuss.js', 'dessins.js']) {
      const js = (await read(name)).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(js), name);
    }
  });
});
