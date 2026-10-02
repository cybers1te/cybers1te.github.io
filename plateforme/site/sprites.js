// marketbuss — les dessins en pixel art.
//
// Chaque dessin est une grille de caractères : un caractère = un pixel, sa
// lettre = sa couleur (voir COLORS), « . » = transparent. sprite() en fait un
// SVG net à toutes les tailles. Aucune image à télécharger.

const COLORS = {
  k: '#0b0920', // contour
  w: '#f4f1ff', // blanc
  g: '#bfb9e6', // gris clair
  d: '#2b2760', // indigo sombre
  n: '#4a4494', // indigo moyen
  y: '#ffd23f', // jaune pièce
  Y: '#fff3a6', // jaune clair
  o: '#ff8a3c', // orange
  r: '#ff5d8f', // rose
  R: '#ffb3cb', // rose clair
  c: '#35e0ff', // cyan
  C: '#b8f4ff', // cyan clair
  v: '#58f29b', // vert
  V: '#c5ffe0', // vert clair
  p: '#8f7bff', // violet
  b: '#3a5bff', // bleu
  s: '#ffcfa3', // peau
  h: '#7a4a2e', // cheveux
};

const SPRITES = {
  rocket: [
    '.....w.....',
    '....www....',
    '...wwwww...',
    '...wcccw...',
    '..wwcCcww..',
    '..wwcccww..',
    '..wwwwwww..',
    '..wgwwwgw..',
    '.rwwwwwwwr.',
    'rrwwwwwwwrr',
    'rr.wgggw.rr',
    'r...ooo...r',
    '...oyyyo...',
    '...oyYyo...',
    '....oyo....',
    '.....o.....',
  ],
  coin: [
    '...kkkk...',
    '..kyyyyk..',
    '.kyYYyyyk.',
    'kyYyyyoyyk',
    'kyYyyyoyyk',
    'kyYyyyoyyk',
    'kyYyyyoyyk',
    '.kyyyooyk.',
    '..kyyyyk..',
    '...kkkk...',
  ],
  gem: [
    '..ccccc..',
    '.cCCccbc.',
    'cCCcccbbc',
    'cccccbbbc',
    '.cccbbbc.',
    '..ccbbc..',
    '...cbc...',
    '....c....',
  ],
  heart: [
    '.rr...rr.',
    'rRRr.rrrr',
    'rRrrrrrrr',
    'rrrrrrrrr',
    '.rrrrrrr.',
    '..rrrrr..',
    '...rrr...',
    '....r....',
  ],
  star: [
    '....y....',
    '....y....',
    '...yYy...',
    'yyyyYyyyy',
    '.yyYYYyy.',
    '..yyyyy..',
    '..yyyyy..',
    '.yyy.yyy.',
    '.y.....y.',
  ],
  chart: [
    '.........',
    '.......v.',
    '.......v.',
    '....y..v.',
    '....y..v.',
    '.r..y..v.',
    '.r..y..v.',
    '.r..y..v.',
    'wwwwwwwww',
  ],
  flag: [
    '.w.......',
    '.wrrrrr..',
    '.wrrrrrr.',
    '.wrrrrr..',
    '.wrrr....',
    '.w.......',
    '.w.......',
    '.w.......',
    'www......',
  ],
  book: [
    '.pppppppp',
    '.pwwwwwwp',
    '.pwkkwwwp',
    '.pwwwwwwp',
    '.pwkkkwwp',
    '.pwwwwwwp',
    '.pwkkwwwp',
    '.pwwwwwwp',
    '.pppppppp',
  ],
  card: [
    'yyyyyyyyy',
    'ywwwwwwwy',
    'ywkkwwwwy',
    'ywwwwwwwy',
    'ywcccccwy',
    'ywcccccwy',
    'ywwwwwwwy',
    'ywkkkkwwy',
    'yyyyyyyyy',
  ],
  flask: [
    '...www...',
    '...w.w...',
    '...w.w...',
    '..w...w..',
    '..w...w..',
    '.wvvvvvw.',
    '.wvvVvvw.',
    'wvvvvvvvw',
    'wwwwwwwww',
  ],
  pie: [
    '...yyy...',
    '.yyyyccc.',
    '.yyyycccc',
    'yyyyycccc',
    'yyyyycccc',
    'yyyyyrrrr',
    '.yyyyrrr.',
    '.yyyyrrr.',
    '...yyr...',
  ],
  target: [
    '..rrrrr..',
    '.rwwwwwr.',
    'rwwrrrwwr',
    'rwrwwwrwr',
    'rwrwrwrwr',
    'rwrwwwrwr',
    'rwwrrrwwr',
    '.rwwwwwr.',
    '..rrrrr..',
  ],
  lens: [
    '..cccc...',
    '.cCCccc..',
    'cCCccccc.',
    'cCcccccc.',
    'cccccccc.',
    '.cccccc..',
    '..cccc.w.',
    '.......ww',
    '........w',
  ],
  steps: [
    '......vvv',
    '......vvv',
    '......vvv',
    '...yyyvvv',
    '...yyyvvv',
    '...yyyvvv',
    'rrryyyvvv',
    'rrryyyvvv',
    'rrryyyvvv',
  ],
  bolt: [
    '....yyy..',
    '...yyy...',
    '..yyy....',
    '.yyyyyy..',
    '...yyy...',
    '..yyy....',
    '.yyy.....',
    '.yy......',
    '.y.......',
  ],
  // Joueur 1 : l'entrepreneur (sweat jaune).
  founder: [
    '....hhhh....',
    '...hhhhhh...',
    '...hssssh...',
    '...skssks...',
    '...ssssss...',
    '....srrs....',
    '..yyyyyyyy..',
    '.yyyyYYyyyy.',
    '.yyyyYYyyyy.',
    '.syyyyyyyys.',
    '.syyyyyyyys.',
    '...bbbbbb...',
    '...bb..bb...',
    '...bb..bb...',
    '...bb..bb...',
    '..www..www..',
  ],
  // Joueur 2 : l'investisseur (veste cyan, cravate).
  investor: [
    '....gggg....',
    '...gggggg...',
    '...gssssg...',
    '...skssks...',
    '...ssssss...',
    '....ssss....',
    '..ccwrrwcc..',
    '.cccwrrwccc.',
    '.ccccrrcccc.',
    '.sccccccccs.',
    '.sccccccccs.',
    '...nnnnnn...',
    '...nn..nn...',
    '...nn..nn...',
    '...nn..nn...',
    '..www..www..',
  ],
};

const SVG_NS = 'http://www.w3.org/2000/svg';

/* Un dessin → un SVG. `px` : taille d'un pixel à l'écran. Les pixels voisins
   de même couleur sont fusionnés en un seul rectangle. */
export function sprite(name, px = 4, label = '') {
  const rows = SPRITES[name] || SPRITES.star;
  const w = Math.max(...rows.map((r) => r.length));
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', `0 0 ${w} ${rows.length}`);
  el.setAttribute('width', w * px);
  el.setAttribute('height', rows.length * px);
  el.setAttribute('shape-rendering', 'crispEdges');
  el.setAttribute('class', 'sprite sprite-' + name);
  if (label) { el.setAttribute('role', 'img'); el.setAttribute('aria-label', label); } else el.setAttribute('aria-hidden', 'true');
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (COLORS[ch]) {
        const r = document.createElementNS(SVG_NS, 'rect');
        r.setAttribute('x', x); r.setAttribute('y', y);
        r.setAttribute('width', end - x); r.setAttribute('height', 1);
        r.setAttribute('fill', COLORS[ch]);
        el.append(r);
      }
      x = end;
    }
  });
  return el;
}

/* Générateur pseudo-aléatoire fixe : la même ville et le même ciel à chaque visite. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* La ville la nuit, au pied de l'accueil : immeubles, fenêtres allumées, étoiles. */
export function skyline(width = 240, height = 54) {
  const rnd = seeded(20261002);
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', `0 0 ${width} ${height}`);
  el.setAttribute('preserveAspectRatio', 'xMidYMax slice');
  el.setAttribute('shape-rendering', 'crispEdges');
  el.setAttribute('class', 'skyline');
  el.setAttribute('aria-hidden', 'true');
  const rect = (x, y, w, h, fill, cls) => {
    const r = document.createElementNS(SVG_NS, 'rect');
    r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', h);
    r.setAttribute('fill', fill);
    if (cls) r.setAttribute('class', cls);
    el.append(r);
  };
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rnd() * width);
    const y = Math.floor(rnd() * (height - 22));
    rect(x, y, 1, 1, rnd() > 0.8 ? '#ffd23f' : rnd() > 0.5 ? '#f4f1ff' : '#8f7bff', i % 5 === 0 ? 'twinkle' : '');
  }
  // Deux rangées d'immeubles : le fond plus clair, le premier plan plus sombre.
  for (const [fill, lit, minH, maxH] of [['#2b2760', '#4a4494', 14, 30], ['#1b1840', '#ffd23f', 8, 22]]) {
    let x = -2;
    while (x < width) {
      const w = 5 + Math.floor(rnd() * 9);
      const h = minH + Math.floor(rnd() * (maxH - minH));
      rect(x, height - h, w, h, fill);
      for (let wy = height - h + 2; wy < height - 2; wy += 3) {
        for (let wx = x + 1; wx < x + w - 1; wx += 2) {
          if (rnd() > 0.62) rect(wx, wy, 1, 1, rnd() > 0.85 ? '#35e0ff' : lit);
        }
      }
      if (rnd() > 0.7) rect(x + Math.floor(w / 2), height - h - 3, 1, 3, fill);
      x += w + (rnd() > 0.75 ? 1 : 0);
    }
  }
  return el;
}

export const SPRITE_NAMES = Object.keys(SPRITES);
