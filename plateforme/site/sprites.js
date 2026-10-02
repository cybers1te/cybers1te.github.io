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
  s: '#ffcfa3', // peau claire
  m: '#dba06c', // peau mate
  u: '#9a6238', // peau foncée
  h: '#7a4a2e', // cheveux bruns
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
  tag: [
    '....yyyyy',
    '...yyyyky',
    '..yyyyyyy',
    '.yyYyyyyy',
    'yyyyYyyy.',
    '.yyyyyy..',
    '..yyyy...',
    '...yy....',
    '.........',
  ],
  clock: [
    '..wwwww..',
    '.wCCCCCw.',
    'wCCCkCCCw',
    'wCCCkCCCw',
    'wCCCkkkCw',
    'wCCCCCCCw',
    'wCCCCCCCw',
    '.wCCCCCw.',
    '..wwwww..',
  ],
  globe: [
    '..ccccc..',
    '.ccvvccc.',
    'ccvvvcccc',
    'cvvvccvcc',
    'cccvccvvc',
    'ccccccvvc',
    'cccvvcccc',
    '.ccvvccc.',
    '..ccccc..',
  ],
  funnel: [
    'ppppppppp',
    'ppppppppp',
    '.ppppppp.',
    '..ppppp..',
    '...ppp...',
    '...ppp...',
    '...ppp...',
    '....y....',
    '....y....',
  ],
  bag: [
    '..yy.yy..',
    '...yyy...',
    '...ooo...',
    '..yyyyy..',
    '.yyyYyyy.',
    'yyyYYyyyy',
    'yyyYyyyyy',
    'yyyyyyyyy',
    '.yyyyyyy.',
  ],
  percent: [
    'rr.....r.',
    'rr....r..',
    '.....r...',
    '....r....',
    '...r.....',
    '..r......',
    '.r....rr.',
    'r.....rr.',
    '.........',
  ],
  balloon: [
    '..rrrrr..',
    '.rRRrrrr.',
    'rRRrrrrrr',
    'rrrrrrrrr',
    '.rrrrrrr.',
    '..rrrrr..',
    '....r....',
    '....w....',
    '...w.....',
  ],
  dice: [
    'wwwwwwwww',
    'wkwwwwwkw',
    'wwwwwwwww',
    'wwwwwwwww',
    'wwwwkwwww',
    'wwwwwwwww',
    'wwwwwwwww',
    'wkwwwwwkw',
    'wwwwwwwww',
  ],
  scroll: [
    '.wwwwwww.',
    'wwgggggww',
    '.wwwwwww.',
    '.wkkkkww.',
    '.wwwwwww.',
    '.wkkkwww.',
    '.wwwwwww.',
    'wwgggggww',
    '.wwwwwww.',
  ],
  cascade: [
    'yyy......',
    'yyy......',
    'ooo......',
    '...ccc...',
    '...ccc...',
    '...bbb...',
    '......vvv',
    '......vvv',
    '......vvv',
  ],
  bubble: [
    '.wwwwwww.',
    'wwwwwwwww',
    'wwkwkwkww',
    'wwwwwwwww',
    'wwwwwwwww',
    '.wwwwwww.',
    '..ww.....',
    '.ww......',
    '.w.......',
  ],
  board: [
    'wwwwwwwww',
    'wyywccwrw',
    'wyywccwrw',
    'wyywwwwrw',
    'wyywvvwrw',
    'wwwwwwwww',
    'wppppwoow',
    'wppppwoow',
    'wwwwwwwww',
  ],
  clip: [
    '..wgggw..',
    '.wwwwwww.',
    '.wvwkkkw.',
    '.wwwwwww.',
    '.wvwkkkw.',
    '.wwwwwww.',
    '.wvwkkkw.',
    '.wwwwwww.',
    '.wwwwwww.',
  ],
  shield: [
    'vvvvvvvvv',
    'vVVvvvvvv',
    'vVvvvvvvv',
    'vvvvvvwvv',
    'vvwvvwvvv',
    '.vvwwvvv.',
    '.vvvvvvv.',
    '..vvvvv..',
    '....v....',
  ],
  brush: [
    '.......oo',
    '......oo.',
    '.....oo..',
    '....oo...',
    '...ww....',
    '..ppw....',
    '.pppp....',
    '.ppp.....',
    'pp.......',
  ],
  shop: [
    'rwrwrwrwr',
    'rwrwrwrwr',
    '.rwrwrwr.',
    'wwwwwwwww',
    'wccwwwkkw',
    'wccwwwkkw',
    'wwwwwwkkw',
    'wwwwwwkkw',
    'ggggggggg',
  ],
  people: [
    '.........',
    '.ss...mm.',
    '.ss...mm.',
    'yyyy.cccc',
    'yyyy.cccc',
    'yyyy.cccc',
    'yyyy.cccc',
    '.........',
    '.........',
  ],
  mail: [
    '.........',
    'wwwwwwwww',
    'wgwwwwwgw',
    'wwgwwwgww',
    'wwwgwgwww',
    'wwwwgwwww',
    'wwwwwwwww',
    'wwwwwwwww',
    '.........',
  ],
  gear: [
    '..g.g.g..',
    '.ggggggg.',
    'ggg...ggg',
    '.gg...gg.',
    'ggg...ggg',
    '.gg...gg.',
    'ggg...ggg',
    '.ggggggg.',
    '..g.g.g..',
  ],
  bank: [
    '....w....',
    '..wwwww..',
    'wwwwwwwww',
    '.g.g.g.g.',
    '.g.g.g.g.',
    '.g.g.g.g.',
    '.g.g.g.g.',
    'wwwwwwwww',
    'wwwwwwwww',
  ],
  invoice: [
    '.wwwwwww.',
    '.wkkkwww.',
    '.wwwwwww.',
    '.wkkkkkw.',
    '.wkkkkkw.',
    '.wwwwwww.',
    '.wwwvvvw.',
    '.wwwwwww.',
    '.w.w.w.w.',
  ],
  folder: [
    '.........',
    'yyyy.....',
    'yyyyyyyyy',
    'yYYYYYYYy',
    'yYYYYYYYy',
    'yYYYYYYYy',
    'yYYYYYYYy',
    'yyyyyyyyy',
    '.........',
  ],
  building: [
    '..ggggg..',
    '..gcgcg..',
    '..ggggg..',
    '..gcgcg..',
    '..ggggg..',
    '..gcgcg..',
    '..ggggg..',
    '..ggkgg..',
    'ggggggggg',
  ],
  bot: [
    '....c....',
    '....g....',
    '.ggggggg.',
    '.gwwwwwg.',
    '.gwcwcwg.',
    '.gwwwwwg.',
    '.gwrrrwg.',
    '.ggggggg.',
    '..g...g..',
  ],
  hourglass: [
    'yyyyyyyyy',
    '.wwwwwww.',
    '..wYYYw..',
    '...wYw...',
    '....w....',
    '...wYw...',
    '..wwYww..',
    '.wYYYYYw.',
    'yyyyyyyyy',
  ],
  scissors: [
    'w.....w..',
    '.w...w...',
    '..w.w....',
    '...w.....',
    '..w.w....',
    '.rr.rr...',
    'r..r..r..',
    'r..r..r..',
    '.rr.rr...',
  ],
  piggy: [
    '.........',
    '..rr.yy..',
    '.rrrrrrr.',
    'rrkrrrrrr',
    'RRrrrrrrr',
    'RRrrrrrrr',
    '.rrrrrrr.',
    '.rr...rr.',
    '.........',
  ],
  up: [
    '....v....',
    '...vvv...',
    '..vvvvv..',
    '.vvvvvvv.',
    '...vvv...',
    '...vvv...',
    '...vvv...',
    '...vvv...',
    '...vvv...',
  ],
  ice: [
    '.CCCCCCC.',
    'CCwwCCCCC',
    'CwCCCCCCC',
    'CCCCCCCCC',
    'CCCCCCCcC',
    'CCCCCCccC',
    '.CCCCCCC.',
    '..c...c..',
    '.c.....c.',
  ],
  medal: [
    'bb.....bb',
    '.bb...bb.',
    '..bb.bb..',
    '..yyyyy..',
    '.yyYYyyy.',
    '.yYyyyyy.',
    '.yyyyyyy.',
    '.yyyyyyy.',
    '..yyyyy..',
  ],
  drop: [
    '....c....',
    '...ccc...',
    '...ccc...',
    '..ccccc..',
    '.cCccccc.',
    '.cCccccc.',
    '.ccccccc.',
    '..ccccc..',
    '...ccc...',
  ],
  umbrella: [
    '...ppp...',
    '.ppppppp.',
    'ppppppppp',
    'p.p.w.p.p',
    '....w....',
    '....w....',
    '....w....',
    '..w.w....',
    '..www....',
  ],
  // Bit, le robot de la salle d'arcade.
  robot: [
    '.....cc.....',
    '.....gg.....',
    '..gggggggg..',
    '..gwwwwwwg..',
    '..gwcwwcwg..',
    '..gwwwwwwg..',
    '..gwwrrwwg..',
    '..gggggggg..',
    '....gggg....',
    '.gggggggggg.',
    '.gggyyyyggg.',
    '.g.gyYYyg.g.',
    '.g.gggggg.g.',
    '...gg..gg...',
    '...gg..gg...',
    '..nnn..nnn..',
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

/* Les personnages : un même gabarit de 12 × 16 pixels, habillé de façons différentes.
     hair, skin, top, legs, shoes : lettres de COLORS ;
     style  : short | long | bun | cap | headset | glasses ;
     collar : tie | shirt | hood | plain ;  skirt : jupe à la place du pantalon. */
function person({ hair = 'h', skin = 's', top = 'y', light = null, legs = 'b', shoes = 'w', style = 'short', collar = 'plain', mouth = 'r', skirt = false, hat = null }) {
  const head = {
    short: ['....HHHH....', '...HHHHHH...', '...HSSSSH...', '...SkSSkS...', '...SSSSSS...', '....SMMS....'],
    long: ['....HHHH....', '...HHHHHH...', '..HHSSSSHH..', '..HSkSSkSH..', '..HSSSSSSH..', '..H.SMMS.H..'],
    bun: ['.....HH.....', '...HHHHHH...', '...HSSSSH...', '...SkSSkS...', '...SSSSSS...', '....SMMS....'],
    cap: ['....XXXX....', '..XXXXXXX...', '...HSSSSH...', '...SkSSkS...', '...SSSSSS...', '....SMMS....'],
    headset: ['....HHHH....', '..XHHHHHHX..', '..XHSSSSHX..', '..XSkSSkSX..', '...SSSSSS...', '....SMMS....'],
    glasses: ['....HHHH....', '...HHHHHH...', '...HSSSSH...', '..wkwSSwkw..', '...SSSSSS...', '....SMMS....'],
  }[style];
  const body = {
    plain: ['..TTTTTTTT..', '.TTTTTTTTTT.', '.TTTTTTTTTT.', '.STTTTTTTTS.', '.STTTTTTTTS.'],
    hood: ['..TTTTTTTT..', '.TTTTLLTTTT.', '.TTTTLLTTTT.', '.STTTTTTTTS.', '.STTTTTTTTS.'],
    tie: ['..TTwrrwTT..', '.TTTwrrwTTT.', '.TTTTrrTTTT.', '.STTTTTTTTS.', '.STTTTTTTTS.'],
    shirt: ['..TTTwwTTT..', '.TTTTwwTTTT.', '.TTTTLLTTTT.', '.STTTTTTTTS.', '.STTTTTTTTS.'],
  }[collar];
  const lower = skirt
    ? ['..BBBBBBBB..', '..BBBBBBBB..', '...SS..SS...', '...SS..SS...', '..FFF..FFF..']
    : ['...BBBBBB...', '...BB..BB...', '...BB..BB...', '...BB..BB...', '..FFF..FFF..'];
  const map = { H: hair, S: skin, T: top, L: light || top, B: legs, F: shoes, M: mouth, X: hat || hair };
  return [...head, ...body, ...lower].map((row) => row.replace(/[HSTLBFMX]/g, (c) => map[c]));
}

Object.assign(SPRITES, {
  // Les joueurs.
  freelance: person({ hair: 'o', skin: 's', top: 'v', light: 'V', legs: 'n', style: 'long', collar: 'hood' }),
  saver: person({ hair: 'h', skin: 'u', top: 'p', light: 'w', legs: 'n', style: 'short', collar: 'shirt' }),
  // Les guides.
  mentor: person({ hair: 'g', skin: 'm', top: 'r', light: 'R', legs: 'n', style: 'bun', collar: 'hood', skirt: true }),
  accountant: person({ hair: 'h', skin: 's', top: 'w', legs: 'n', style: 'glasses', collar: 'tie' }),
  dev: person({ hair: 'h', skin: 'u', top: 'n', light: 'c', legs: 'b', style: 'headset', collar: 'hood', hat: 'c' }),
  banker: person({ hair: 'y', skin: 's', top: 'b', light: 'w', legs: 'b', style: 'long', collar: 'shirt', skirt: true }),
  client: person({ hair: 'r', skin: 'm', top: 'o', light: 'Y', legs: 'b', style: 'cap', collar: 'hood', hat: 'r' }),
  angel: person({ hair: 'w', skin: 's', top: 'c', light: 'C', legs: 'n', style: 'long', collar: 'shirt' }),
  designer: person({ hair: 'p', skin: 's', top: 'R', light: 'r', legs: 'n', style: 'short', collar: 'hood' }),
});

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
