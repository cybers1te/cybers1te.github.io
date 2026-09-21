/* Trueware — version navigateur.
 *
 * GitHub Pages ne sert que des fichiers statiques : cette version rejoue donc
 * côté client ce que fait l'application Flask du dossier trueware/ (catalogue,
 * comptes, panier, commandes, avis, administration). Les données vivent dans
 * localStorage, sur cet appareil uniquement.
 *
 * Le catalogue vient de trueware-catalog.js, lui-même produit par
 * tools/build-static.py à partir du catalogue Python : une seule source.
 */
(function () {
  'use strict';

  var CATALOG = window.TRUEWARE_CATALOG;
  var STORE = 'trueware:v1';
  var PER_PAGE = 9;
  var FREE_SHIPPING = 10000;
  var SHIPPING = 490;
  var MAX_QTY = 10;
  var STATUSES = ['En préparation', 'Expédiée', 'Livrée', 'Annulée'];
  var PBKDF2_ROUNDS = 150000;

  var app, flashes, nav, catbar;
  var artSeq = 0;
  var hasCrypto = !!(window.crypto && window.crypto.subtle);

  /* ====================================================================== */
  /* 1. Outils                                                              */
  /* ====================================================================== */

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function eur(cents) {
    if (cents == null) return '';
    return Math.floor(cents / 100) + ',' + String(cents % 100).padStart(2, '0') + ' €';
  }

  function hex(bytes) {
    return Array.prototype.map.call(bytes, function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function fromHex(s) {
    var out = new Uint8Array(s.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16);
    return out;
  }

  function randomHex(n) {
    var b = new Uint8Array(n);
    (window.crypto || {}).getRandomValues
      ? window.crypto.getRandomValues(b)
      : b.forEach(function (_, i) { b[i] = Math.floor(Math.random() * 256); });
    return hex(b);
  }

  function nowISO() { return new Date().toISOString().replace(/\.\d+Z$/, 'Z'); }

  var EMAIL_RE = /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/;

  /* ====================================================================== */
  /* 2. Stockage local                                                      */
  /* ====================================================================== */

  var DB = null;

  function blankDB() {
    return { v: 1, users: [], sessionId: null, carts: {}, guestCart: {},
             orders: [], reviews: [], stock: {} };
  }

  function loadDB() {
    try {
      var raw = localStorage.getItem(STORE);
      DB = raw ? JSON.parse(raw) : blankDB();
    } catch (e) {
      DB = blankDB();
    }
    var base = blankDB();
    for (var k in base) if (!(k in DB)) DB[k] = base[k];
  }

  function saveDB() {
    try {
      localStorage.setItem(STORE, JSON.stringify(DB));
    } catch (e) {
      flash("Stockage du navigateur indisponible : les données ne seront pas conservées.", 'error');
    }
  }

  function resetDB() { DB = blankDB(); saveDB(); }

  /* ====================================================================== */
  /* 3. Produits                                                            */
  /* ====================================================================== */

  var BY_SLUG = {};
  var CATS = {};

  function indexCatalog() {
    CATALOG.products.forEach(function (p, i) { p.idx = i; BY_SLUG[p.slug] = p; });
    CATALOG.categories.forEach(function (c) { CATS[c.slug] = c; });
  }

  function stockOf(p) {
    return DB.stock[p.slug] == null ? p.stock : DB.stock[p.slug];
  }

  function reviewsOf(slug) {
    return DB.reviews.filter(function (r) { return r.slug === slug; })
      .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  }

  function ratingOf(slug) {
    var rs = reviewsOf(slug);
    if (!rs.length) return { avg: null, count: 0 };
    var sum = rs.reduce(function (t, r) { return t + r.rating; }, 0);
    return { avg: Math.round((sum / rs.length) * 10) / 10, count: rs.length };
  }

  /* ====================================================================== */
  /* 4. Visuel produit (même rendu que trueware/imagery.py)                 */
  /* ====================================================================== */

  var PALETTES = {
    peripheriques: ['#46e2a8', '#1b6ef3'],
    composants: ['#ff8a3d', '#ff3d7f'],
    ecrans: ['#7c6bff', '#22d3ee'],
    audio: ['#ffd166', '#ef476f'],
    reseau: ['#22d3ee', '#3b82f6'],
    stockage: ['#a3e635', '#059669']
  };

  function art(p, size, ratio) {
    var d = p.seed;
    var pal = PALETTES[p.category] || ['#46e2a8', '#7c6bff'];
    var a = pal[0], b = pal[1];
    var w = size, h = Math.round(size / (ratio || 1)), shortSide = Math.min(w, h);
    var gid = 'a' + (artSeq++);
    var rot = -24 + (d[0] % 48);
    var out = ['<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" ' +
               'role="img" aria-hidden="true" class="art">'];

    out.push('<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/>' +
      '</linearGradient><radialGradient id="' + gid + 'h" cx="0.5" cy="0.38" r="0.62">' +
      '<stop offset="0" stop-color="' + a + '" stop-opacity="0.45"/>' +
      '<stop offset="1" stop-color="' + a + '" stop-opacity="0"/></radialGradient></defs>');
    out.push('<rect width="' + w + '" height="' + h + '" fill="#0d1117"/>');
    out.push('<rect width="' + w + '" height="' + h + '" fill="url(#' + gid + 'h)"/>');

    var step = Math.floor(shortSide / 10);
    var i;
    for (i = 1; i <= Math.floor(w / step); i++) {
      out.push('<line x1="' + (i * step) + '" y1="0" x2="' + (i * step) + '" y2="' + h +
               '" stroke="#ffffff" stroke-opacity="0.045"/>');
    }
    for (i = 1; i <= Math.floor(h / step); i++) {
      out.push('<line x1="0" y1="' + (i * step) + '" x2="' + w + '" y2="' + (i * step) +
               '" stroke="#ffffff" stroke-opacity="0.045"/>');
    }

    var cx = w / 2, cy = h / 2;
    out.push('<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">');
    var shape = d[1] % 4;
    var sw = shortSide * (0.36 + (d[2] % 20) / 100);
    var sh = shortSide * (0.30 + (d[3] % 26) / 100);

    if (shape === 0) {
      out.push('<rect x="' + (cx - sw / 2).toFixed(1) + '" y="' + (cy - sh / 2).toFixed(1) +
        '" width="' + sw.toFixed(1) + '" height="' + sh.toFixed(1) +
        '" rx="' + (10 + d[4] % 26) + '" fill="url(#' + gid + ')"/>');
    } else if (shape === 1) {
      var r = shortSide * 0.3;
      out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" fill="url(#' + gid + ')"/>');
      out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.55).toFixed(1) + '" fill="#0d1117"/>');
      out.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.30).toFixed(1) + '" fill="url(#' + gid + ')"/>');
    } else if (shape === 2) {
      var n = 3 + d[5] % 3;
      var bw = sw / (n * 1.7);
      for (i = 0; i < n; i++) {
        var bh = sh * (0.55 + ((d[6 + i] % 45) / 100));
        var x = cx - sw / 2 + i * bw * 1.7;
        out.push('<rect x="' + x.toFixed(1) + '" y="' + (cy - bh / 2).toFixed(1) +
          '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) +
          '" rx="' + (bw / 2).toFixed(1) + '" fill="url(#' + gid + ')"/>');
      }
    } else {
      var pts = [], rr = shortSide * 0.29;
      for (i = 0; i < 6; i++) {
        var ang = Math.PI / 6 + i * Math.PI / 3;
        pts.push((cx + rr * Math.cos(ang)).toFixed(1) + ',' + (cy + rr * Math.sin(ang)).toFixed(1));
      }
      out.push('<polygon points="' + pts.join(' ') + '" fill="url(#' + gid + ')"/>');
    }
    out.push('</g>');

    out.push('<rect x="10" y="10" width="' + (w - 20) + '" height="' + (h - 20) +
             '" rx="14" fill="none" stroke="#ffffff" stroke-opacity="0.10"/>');
    for (i = 0; i < 3; i++) {
      out.push('<circle cx="' + (28 + i * 16) + '" cy="' + (h - 26) + '" r="3.5" fill="' + a +
               '" fill-opacity="' + (0.9 - i * 0.28).toFixed(2) + '"/>');
    }
    out.push('</svg>');
    return out.join('');
  }

  /* ====================================================================== */
  /* 5. Comptes                                                             */
  /* ====================================================================== */

  function currentUser() {
    if (!DB.sessionId) return null;
    return DB.users.filter(function (u) { return u.id === DB.sessionId; })[0] || null;
  }

  function userByEmail(email) {
    var low = String(email).toLowerCase();
    return DB.users.filter(function (u) { return u.email.toLowerCase() === low; })[0] || null;
  }

  /* PBKDF2-SHA256 quand le navigateur le permet. Un compte local ne protège
     rien — mais on évite de conserver un mot de passe en clair. */
  function derive(password, saltHex) {
    if (!hasCrypto) {
      var h = 5381, s = password + saltHex;
      for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
      return Promise.resolve('weak:' + h.toString(16));
    }
    var enc = new TextEncoder();
    return window.crypto.subtle
      .importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
      .then(function (key) {
        return window.crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: fromHex(saltHex), iterations: PBKDF2_ROUNDS, hash: 'SHA-256' },
          key, 256);
      })
      .then(function (bits) { return 'pbkdf2:' + hex(new Uint8Array(bits)); });
  }

  function constantEquals(a, b) {
    if (a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /* ====================================================================== */
  /* 6. Panier                                                              */
  /* ====================================================================== */

  function cartRaw() {
    var u = currentUser();
    if (u) { DB.carts[u.id] = DB.carts[u.id] || {}; return DB.carts[u.id]; }
    return DB.guestCart;
  }

  function cartSet(slug, qty) {
    var cart = cartRaw();
    qty = Math.max(0, Math.min(MAX_QTY, qty));
    if (qty) cart[slug] = qty; else delete cart[slug];
    saveDB();
  }

  function cartCount() {
    var cart = cartRaw(), n = 0;
    for (var k in cart) n += cart[k];
    return n;
  }

  function mergeGuestCart(userId) {
    DB.carts[userId] = DB.carts[userId] || {};
    for (var slug in DB.guestCart) {
      DB.carts[userId][slug] = Math.min(MAX_QTY,
        (DB.carts[userId][slug] || 0) + DB.guestCart[slug]);
    }
    DB.guestCart = {};
  }

  function cartView() {
    var cart = cartRaw(), lines = [], subtotal = 0, issues = [];
    Object.keys(cart).forEach(function (slug) {
      var p = BY_SLUG[slug];
      if (!p) { delete cart[slug]; return; }
      var qty = cart[slug];
      var stock = stockOf(p);
      if (qty > stock) {
        if (stock === 0) {
          issues.push(p.name + ' est en rupture de stock.');
          delete cart[slug];
          return;
        }
        issues.push('Stock limité : ' + p.name + ' ramené à ' + stock + '.');
        cart[slug] = qty = stock;
      }
      var total = p.price * qty;
      subtotal += total;
      lines.push({ product: p, qty: qty, total: total });
    });
    lines.sort(function (a, b) { return a.product.name.localeCompare(b.product.name, 'fr'); });
    if (issues.length) saveDB();
    var shipping = (subtotal === 0 || subtotal >= FREE_SHIPPING) ? 0 : SHIPPING;
    return {
      lines: lines, subtotal: subtotal, shipping: shipping,
      total: subtotal + shipping,
      count: lines.reduce(function (t, l) { return t + l.qty; }, 0),
      issues: issues
    };
  }

  /* ====================================================================== */
  /* 7. Fragments d'interface                                               */
  /* ====================================================================== */

  function flash(msg, kind) {
    var p = document.createElement('p');
    p.className = 'flash flash-' + (kind || 'info');
    p.textContent = msg;
    flashes.appendChild(p);
    setTimeout(function () {
      p.style.transition = 'opacity .4s';
      p.style.opacity = '0';
      setTimeout(function () { p.remove(); }, 450);
    }, 5000);
  }

  function stars(avg, count) {
    var out = '<span class="stars" aria-label="' + (avg || 0) + ' sur 5">';
    for (var i = 1; i <= 5; i++) {
      out += '<span class="star' + (avg && avg >= i - 0.25 ? ' on' : '') + '">★</span>';
    }
    if (count) out += '<small>' + count + '</small>';
    return out + '</span>';
  }

  function productCard(p) {
    var stock = stockOf(p), r = ratingOf(p.slug);
    var deal = p.compare && p.compare > p.price;
    return '<article class="card">' +
      '<a class="card-art" href="#/produit/' + esc(p.slug) + '">' + art(p, 420, 1.42) +
        (p.badge ? '<span class="tag tag-accent">' + esc(p.badge) + '</span>' : '') +
        (deal ? '<span class="tag tag-deal">−' + Math.round((1 - p.price / p.compare) * 100) + ' %</span>' : '') +
        (stock === 0 ? '<span class="card-out">Rupture</span>' : '') +
      '</a>' +
      '<div class="card-body">' +
        '<p class="card-brand">' + esc(p.brand) + ' · ' + esc(CATS[p.category].name) + '</p>' +
        '<h3><a href="#/produit/' + esc(p.slug) + '">' + esc(p.name) + '</a></h3>' +
        '<p class="card-sum">' + esc(p.summary) + '</p>' +
        '<div class="card-foot"><div class="price"><b>' + eur(p.price) + '</b>' +
          (deal ? '<s>' + eur(p.compare) + '</s>' : '') + '</div>' + stars(r.avg, r.count) + '</div>' +
        '<div class="card-add"><button class="btn btn-sm ' +
          (stock === 0 ? 'btn-ghost" disabled' : 'btn-primary" data-act="add" data-slug="' + esc(p.slug)) +
          '">' + (stock === 0 ? 'Indisponible' : 'Ajouter au panier') + '</button></div>' +
      '</div></article>';
  }

  function grid(list, cols) {
    return '<div class="grid grid-' + (cols || 3) + '">' + list.map(productCard).join('') + '</div>';
  }

  function renderChrome() {
    var u = currentUser(), n = cartCount();
    nav.innerHTML =
      '<a href="#/catalogue">Catalogue</a>' +
      (u ? '<a href="#/admin" class="admin-link">Admin</a><a href="#/compte">Compte</a>' +
           '<button class="linkish" data-act="logout">Déconnexion</button>'
         : '<a href="#/connexion">Connexion</a>' +
           '<a href="#/inscription" class="btn btn-sm btn-outline">Créer un compte</a>') +
      '<a class="cart-link" href="#/panier">Panier' + (n ? ' <span class="badge">' + n + '</span>' : '') + '</a>';

    catbar.innerHTML = CATALOG.categories.map(function (c) {
      return '<a href="#/catalogue?categorie=' + esc(c.slug) + '">' + esc(c.name) + '</a>';
    }).join('') + '<span class="catbar-note">Livraison offerte dès 100&nbsp;€</span>';

    var fc = document.getElementById('tw-foot-cats');
    if (fc) fc.innerHTML = CATALOG.categories.map(function (c) {
      return '<a href="#/catalogue?categorie=' + esc(c.slug) + '">' + esc(c.name) + '</a>';
    }).join('');
  }

  /* ====================================================================== */
  /* 8. Vues                                                                */
  /* ====================================================================== */

  function viewHome() {
    var all = CATALOG.products;
    var featured = all.filter(function (p) { return p.featured; }).slice(0, 6);
    var fresh = all.slice().reverse().slice(0, 4);
    var deals = all.filter(function (p) { return p.compare && p.compare > p.price; })
      .sort(function (a, b) { return (b.compare - b.price) - (a.compare - a.price); }).slice(0, 3);

    return '<section class="hero"><div class="hero-in">' +
      '<div class="hero-text">' +
        '<p class="kick">' + all.length + ' références · ' + CATALOG.categories.length + ' familles</p>' +
        '<h1>Le matériel<br><em>qui tient</em> ses<br>promesses.</h1>' +
        '<p class="lead">Périphériques, composants, écrans et réseau sélectionnés sur des ' +
          'critères mesurables : construction, endurance, service après-vente. Pas de ' +
          'superlatifs, des fiches techniques complètes.</p>' +
        '<div class="hero-cta"><a class="btn btn-primary" href="#/catalogue">Explorer le catalogue</a>' +
          (currentUser() ? '' : '<a class="btn btn-outline" href="#/inscription">Créer un compte</a>') +
        '</div>' +
        '<ul class="hero-points"><li><b>Livraison offerte</b> dès 100&nbsp;€</li>' +
          '<li><b>Stock réel</b> affiché à l\'unité</li>' +
          '<li><b>30 jours</b> pour changer d\'avis</li></ul>' +
      '</div>' +
      '<div class="hero-panel"><p class="panel-label">Sélection de la semaine</p>' +
        featured.slice(0, 3).map(function (p) {
          return '<a class="mini" href="#/produit/' + esc(p.slug) + '">' +
            '<span class="mini-art">' + art(p, 96, 1) + '</span>' +
            '<span class="mini-txt"><b>' + esc(p.name) + '</b><small>' + esc(p.brand) + '</small></span>' +
            '<span class="mini-price">' + eur(p.price) + '</span></a>';
        }).join('') +
        '<a class="panel-more" href="#/catalogue">Tout le catalogue →</a></div>' +
    '</div></section>' +

    '<section class="wrap"><div class="cats">' +
      CATALOG.categories.map(function (c) {
        return '<a class="cat" href="#/catalogue?categorie=' + esc(c.slug) + '"><b>' +
          esc(c.name) + '</b><span>' + esc(c.tagline) + '</span></a>';
      }).join('') + '</div></section>' +

    (deals.length ? '<section class="wrap"><header class="sec-head"><div>' +
      '<p class="kick">Bons plans</p><h2>Prix en baisse</h2></div>' +
      '<a class="linkish" href="#/catalogue?tri=prix-croissant">Trier par prix →</a></header>' +
      grid(deals) + '</section>' : '') +

    '<section class="wrap"><header class="sec-head"><div><p class="kick">Sélection</p>' +
      '<h2>Mis en avant</h2></div><a class="linkish" href="#/catalogue">Voir tout →</a></header>' +
      grid(featured) + '</section>' +

    '<section class="wrap"><header class="sec-head"><div><p class="kick">Derniers arrivages</p>' +
      '<h2>Nouveautés</h2></div>' +
      '<a class="linkish" href="#/catalogue?tri=nouveautes">Par date →</a></header>' +
      grid(fresh, 4) + '</section>' +

    '<section class="wrap"><div class="promise">' +
      '<div><span class="num">01</span><h3>Fiches complètes</h3><p>Chaque produit détaille ses ' +
        'caractéristiques mesurables, pas seulement ses arguments commerciaux.</p></div>' +
      '<div><span class="num">02</span><h3>Stock honnête</h3><p>La quantité affichée diminue ' +
        'dès qu\'une commande est validée.</p></div>' +
      '<div><span class="num">03</span><h3>Avis vérifiés</h3><p>Seuls les comptes connectés ' +
        'publient un avis, un seul par produit et par personne.</p></div>' +
    '</div></section>';
  }

  var SORTS = {
    pertinence: function (a, b) {
      return (b.featured - a.featured) || a.name.localeCompare(b.name, 'fr');
    },
    'prix-croissant': function (a, b) { return a.price - b.price; },
    'prix-decroissant': function (a, b) { return b.price - a.price; },
    nouveautes: function (a, b) { return b.idx - a.idx; },
    note: function (a, b) {
      var ra = ratingOf(a.slug), rb = ratingOf(b.slug);
      return (rb.avg || 0) - (ra.avg || 0) || rb.count - ra.count;
    }
  };

  function viewCatalogue(q) {
    var term = (q.q || '').trim().toLowerCase();
    var cat = q.categorie || '';
    var sort = SORTS[q.tri] ? q.tri : 'pertinence';
    var page = Math.max(1, parseInt(q.page, 10) || 1);

    var list = CATALOG.products.filter(function (p) {
      if (cat && p.category !== cat) return false;
      if (!term) return true;
      return (p.name + ' ' + p.brand + ' ' + p.summary).toLowerCase().indexOf(term) >= 0;
    }).sort(SORTS[sort]);

    var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    page = Math.min(page, pages);
    var slice = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    var active = cat ? CATS[cat] : null;

    function link(extra) {
      var parts = [];
      if (term) parts.push('q=' + encodeURIComponent(q.q));
      if (cat) parts.push('categorie=' + encodeURIComponent(cat));
      if (sort !== 'pertinence') parts.push('tri=' + sort);
      if (extra) parts.push(extra);
      return '#/catalogue' + (parts.length ? '?' + parts.join('&') : '');
    }

    var opts = [['pertinence', 'Pertinence'], ['prix-croissant', 'Prix croissant'],
                ['prix-decroissant', 'Prix décroissant'], ['nouveautes', 'Nouveautés'],
                ['note', 'Mieux notés']];

    return '<section class="wrap"><header class="page-head"><p class="kick">Catalogue</p>' +
      '<h1>' + esc(active ? active.name : 'Tout le matériel') + '</h1>' +
      '<p class="lead">' + esc(active ? active.tagline :
        'Les ' + list.length + ' références en vente, filtrables par famille et par prix.') +
      '</p></header>' +

      '<form class="filters" data-form="filters">' +
        '<input type="search" name="q" value="' + esc(q.q || '') + '" placeholder="Nom ou marque…" aria-label="Recherche">' +
        '<select name="categorie" aria-label="Famille"><option value="">Toutes les familles</option>' +
          CATALOG.categories.map(function (c) {
            return '<option value="' + esc(c.slug) + '"' + (cat === c.slug ? ' selected' : '') +
              '>' + esc(c.name) + '</option>';
          }).join('') + '</select>' +
        '<select name="tri" aria-label="Tri">' + opts.map(function (o) {
            return '<option value="' + o[0] + '"' + (sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
          }).join('') + '</select>' +
        '<button class="btn btn-sm btn-primary">Filtrer</button>' +
        (term || cat || sort !== 'pertinence' ? '<a class="linkish" href="#/catalogue">Réinitialiser</a>' : '') +
      '</form>' +

      '<p class="count">' + list.length + ' produit' + (list.length !== 1 ? 's' : '') +
        (term ? ' pour « ' + esc(q.q) + ' »' : '') + '</p>' +

      (slice.length
        ? grid(slice) + (pages > 1
            ? '<nav class="pager" aria-label="Pages">' + Array.apply(null, { length: pages })
                .map(function (_, i) {
                  return '<a href="' + link('page=' + (i + 1)) + '"' +
                    (i + 1 === page ? ' class="on"' : '') + '>' + (i + 1) + '</a>';
                }).join('') + '</nav>'
            : '')
        : '<div class="empty"><h3>Aucun produit ne correspond</h3>' +
          '<p>Essayez un autre terme ou retirez les filtres.</p>' +
          '<a class="btn btn-outline" href="#/catalogue">Voir tout le catalogue</a></div>') +
    '</section>';
  }

  function viewProduct(slug) {
    var p = BY_SLUG[slug];
    if (!p) return viewMissing();
    var stock = stockOf(p), r = ratingOf(p.slug), u = currentUser();
    var rs = reviewsOf(slug);
    var mine = u ? rs.filter(function (x) { return x.userId === u.id; })[0] : null;
    var deal = p.compare && p.compare > p.price;
    var similar = CATALOG.products.filter(function (x) {
      return x.category === p.category && x.slug !== p.slug;
    }).slice(0, 3);
    var maxQty = Math.min(stock || 1, MAX_QTY);

    return '<section class="wrap">' +
      '<nav class="crumbs"><a href="#/">Accueil</a> / <a href="#/catalogue?categorie=' +
        esc(p.category) + '">' + esc(CATS[p.category].name) + '</a> / <span>' + esc(p.name) + '</span></nav>' +

      '<div class="product"><div class="product-art">' + art(p, 620, 1) +
        (p.badge ? '<span class="tag tag-accent">' + esc(p.badge) + '</span>' : '') + '</div>' +
      '<div class="product-info"><p class="kick">' + esc(p.brand) + ' · ' + esc(CATS[p.category].name) + '</p>' +
        '<h1>' + esc(p.name) + '</h1>' + stars(r.avg, r.count) +
        '<p class="lead">' + esc(p.summary) + '</p>' +
        '<div class="buybox"><div class="buy-price"><b>' + eur(p.price) + '</b>' +
          (deal ? '<s>' + eur(p.compare) + '</s><span class="tag tag-deal">−' +
            Math.round((1 - p.price / p.compare) * 100) + ' %</span>' : '') + '</div>' +
          '<p class="stock ' + (stock > 10 ? 'ok' : (stock > 0 ? 'low' : 'out')) + '">' +
            (stock > 10 ? 'En stock — expédié sous 24&nbsp;h'
              : (stock > 0 ? 'Plus que ' + stock + ' en stock' : 'Rupture de stock')) + '</p>' +
          '<form class="buy-form" data-form="buy" data-slug="' + esc(p.slug) + '">' +
            '<label class="qty"><span>Quantité</span>' +
              '<input type="number" name="qty" value="1" min="1" max="' + maxQty + '"' +
              (stock === 0 ? ' disabled' : '') + '></label>' +
            '<button class="btn btn-primary btn-big"' + (stock === 0 ? ' disabled' : '') + '>' +
              (stock === 0 ? 'Indisponible' : 'Ajouter au panier') + '</button></form>' +
          '<ul class="assur"><li>Livraison offerte dès 100&nbsp;€</li><li>Retour sous 30 jours</li>' +
            '<li>Garantie constructeur incluse</li></ul>' +
        '</div></div></div>' +

      '<div class="product-detail"><div class="prose"><h2>Description</h2><p>' +
        esc(p.description) + '</p></div>' +
        (p.specs.length ? '<aside class="specs"><h2>Caractéristiques</h2><dl>' +
          p.specs.map(function (s) {
            return '<dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd>';
          }).join('') + '</dl></aside>' : '') +
      '</div>' +

      '<section class="reviews"><header class="sec-head"><div><p class="kick">Avis</p>' +
        '<h2>' + r.count + ' avis client' + (r.count !== 1 ? 's' : '') + '</h2></div></header>' +
        (u
          ? '<form class="review-form" data-form="review" data-slug="' + esc(p.slug) + '">' +
            '<p class="form-title">' + (mine ? 'Modifier mon avis' : 'Donner mon avis') + '</p>' +
            '<div class="rating-pick">' + [5, 4, 3, 2, 1].map(function (n) {
              var on = mine ? mine.rating === n : n === 5;
              return '<label><input type="radio" name="rating" value="' + n + '"' +
                (on ? ' checked' : '') + '><span>' + n + ' ★</span></label>';
            }).join('') + '</div>' +
            '<textarea name="body" rows="3" maxlength="1200" placeholder="Ce qui vous a convaincu, ou non.">' +
              esc(mine ? mine.body : '') + '</textarea>' +
            '<button class="btn btn-sm btn-primary">' + (mine ? 'Mettre à jour' : 'Publier') + '</button></form>'
          : '<p class="note"><a href="#/connexion?suivant=' + encodeURIComponent('/produit/' + p.slug) +
            '">Connectez-vous</a> pour publier un avis sur ce produit.</p>') +
        (rs.length
          ? '<ul class="review-list">' + rs.map(function (x) {
              return '<li><div class="review-head"><b>' + esc(x.author) + '</b>' + stars(x.rating) +
                '<time datetime="' + esc(x.createdAt) + '">' + esc(x.createdAt.slice(0, 10)) + '</time></div>' +
                (x.body ? '<p>' + esc(x.body) + '</p>' : '') + '</li>';
            }).join('') + '</ul>'
          : '<p class="note">Aucun avis pour l\'instant.</p>') +
      '</section>' +

      (similar.length ? '<section><header class="sec-head"><div><p class="kick">Même famille</p>' +
        '<h2>À comparer</h2></div></header>' + grid(similar) + '</section>' : '') +
    '</section>';
  }

  function viewCart() {
    var view = cartView();
    view.issues.forEach(function (m) { flash(m, 'info'); });
    if (!view.lines.length) {
      return '<section class="wrap"><header class="page-head"><p class="kick">Panier</p>' +
        '<h1>0 article</h1></header><div class="empty"><h3>Votre panier est vide</h3>' +
        '<p>Parcourez le catalogue pour y ajouter du matériel.</p>' +
        '<a class="btn btn-primary" href="#/catalogue">Voir le catalogue</a></div></section>';
    }
    return '<section class="wrap"><header class="page-head"><p class="kick">Panier</p>' +
      '<h1>' + view.count + ' article' + (view.count !== 1 ? 's' : '') + '</h1></header>' +
      '<div class="cart"><div class="cart-lines">' +
        view.lines.map(function (l) {
          var p = l.product;
          return '<article class="line">' +
            '<a class="line-art" href="#/produit/' + esc(p.slug) + '">' + art(p, 120, 1) + '</a>' +
            '<div class="line-txt"><p class="card-brand">' + esc(p.brand) + '</p>' +
              '<h3><a href="#/produit/' + esc(p.slug) + '">' + esc(p.name) + '</a></h3>' +
              '<p class="line-unit">' + eur(p.price) + ' l\'unité · ' + stockOf(p) + ' en stock</p></div>' +
            '<form class="line-qty" data-form="qty" data-slug="' + esc(p.slug) + '">' +
              '<input type="number" name="qty" value="' + l.qty + '" min="1" max="' +
                Math.min(stockOf(p), MAX_QTY) + '" aria-label="Quantité">' +
              '<button class="btn btn-sm btn-outline">Mettre à jour</button></form>' +
            '<div class="line-end"><b>' + eur(l.total) + '</b>' +
              '<button class="linkish danger" data-act="remove" data-slug="' + esc(p.slug) + '">Retirer</button>' +
            '</div></article>';
        }).join('') + '</div>' +
      '<aside class="summary"><h2>Récapitulatif</h2><dl>' +
        '<dt>Sous-total</dt><dd>' + eur(view.subtotal) + '</dd>' +
        '<dt>Livraison</dt><dd>' + (view.shipping ? eur(view.shipping) : 'Offerte') + '</dd></dl>' +
        (view.shipping ? '<p class="nudge">Encore ' + eur(FREE_SHIPPING - view.subtotal) +
          ' pour la livraison offerte.</p>' : '') +
        '<p class="summary-total"><span>Total</span><b>' + eur(view.total) + '</b></p>' +
        '<a class="btn btn-primary btn-big" href="#/commande">' +
          (currentUser() ? 'Passer la commande' : 'Se connecter et commander') + '</a>' +
        '<a class="linkish" href="#/catalogue">Continuer mes achats</a></aside></div></section>';
  }

  function viewMissing() {
    return '<section class="wrap narrow"><div class="empty big"><p class="kick">Erreur 404</p>' +
      '<h1>Page introuvable</h1><p class="lead">Le lien est peut-être obsolète.</p>' +
      '<div class="done-cta"><a class="btn btn-outline" href="#/catalogue">Catalogue</a>' +
      '<a class="btn btn-primary" href="#/">Retour à l\'accueil</a></div></div></section>';
  }

  var LOCAL_WARNING =
    '<div class="tw-warn"><b>Compte local.</b> Il est enregistré dans ce navigateur ' +
    'uniquement, jamais envoyé sur un serveur, et n\'importe qui ayant accès à cet ' +
    'appareil peut le lire. N\'utilisez pas un mot de passe dont vous vous servez ailleurs.' +
    (hasCrypto ? '' : ' <b>Attention :</b> ce navigateur ne fournit pas WebCrypto, ' +
      'le mot de passe n\'est protégé que par un condensé faible.') + '</div>';

  function viewRegister(q) {
    return '<section class="wrap narrow"><div class="auth">' +
      '<header class="page-head"><p class="kick">Inscription</p><h1>Créer mon compte</h1>' +
      '<p class="lead">Un compte conserve votre panier, suit vos commandes et permet ' +
      'de publier des avis.</p></header>' + LOCAL_WARNING +
      '<form data-form="register"><input type="hidden" name="suivant" value="' + esc(q.suivant || '') + '">' +
        '<label>Nom<input name="name" required minlength="2" maxlength="60" autocomplete="name" autofocus></label>' +
        '<label>Adresse e-mail<input type="email" name="email" required maxlength="160" autocomplete="email"></label>' +
        '<label>Mot de passe<input type="password" name="password" required minlength="8" ' +
          'autocomplete="new-password"><small>8 caractères minimum.</small></label>' +
        '<label>Confirmation<input type="password" name="password2" required minlength="8" ' +
          'autocomplete="new-password"></label>' +
        '<button class="btn btn-primary btn-big">Créer mon compte</button></form>' +
      '<p class="note">Déjà client ? <a href="#/connexion">Se connecter</a></p></div></section>';
  }

  function viewLogin(q) {
    return '<section class="wrap narrow"><div class="auth">' +
      '<header class="page-head"><p class="kick">Connexion</p><h1>Accéder à mon compte</h1></header>' +
      LOCAL_WARNING +
      '<form data-form="login"><input type="hidden" name="suivant" value="' + esc(q.suivant || '') + '">' +
        '<label>Adresse e-mail<input type="email" name="email" required autocomplete="email" autofocus></label>' +
        '<label>Mot de passe<input type="password" name="password" required autocomplete="current-password"></label>' +
        '<button class="btn btn-primary btn-big">Se connecter</button></form>' +
      '<p class="note">Pas encore de compte ? <a href="#/inscription">Créer un compte</a></p></div></section>';
  }

  function ordersOf(userId) {
    return DB.orders.filter(function (o) { return o.userId === userId; })
      .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  }

  function viewAccount() {
    var u = currentUser();
    if (!u) return redirectTo('#/connexion?suivant=' + encodeURIComponent('/compte'));
    var orders = ordersOf(u.id);
    var mine = DB.reviews.filter(function (r) { return r.userId === u.id; })
      .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });

    return '<section class="wrap"><header class="page-head"><p class="kick">Mon compte</p>' +
      '<h1>' + esc(u.name) + '</h1><p class="lead">' + esc(u.email) + '</p></header>' +
      '<div class="account"><div class="account-main">' +
        '<div class="panel"><h2>Mes commandes</h2>' +
          (orders.length
            ? '<table class="table"><thead><tr><th>Référence</th><th>Date</th><th>Articles</th>' +
              '<th>Total</th><th>État</th></tr></thead><tbody>' +
              orders.map(function (o) {
                return '<tr><td><a href="#/commande/' + esc(o.ref) + '">' + esc(o.ref) + '</a></td>' +
                  '<td>' + esc(o.createdAt.slice(0, 10)) + '</td><td>' + o.items.length + '</td>' +
                  '<td>' + eur(o.total) + '</td>' +
                  '<td><span class="status-pill sm">' + esc(o.status) + '</span></td></tr>';
              }).join('') + '</tbody></table>'
            : '<p class="note">Aucune commande pour l\'instant. <a href="#/catalogue">Voir le catalogue</a></p>') +
        '</div>' +
        (mine.length ? '<div class="panel"><h2>Mes avis</h2><ul class="review-list">' +
          mine.map(function (r) {
            var p = BY_SLUG[r.slug];
            return '<li><div class="review-head"><b><a href="#/produit/' + esc(r.slug) + '">' +
              esc(p ? p.name : r.slug) + '</a></b>' + stars(r.rating) +
              '<time datetime="' + esc(r.createdAt) + '">' + esc(r.createdAt.slice(0, 10)) + '</time></div>' +
              (r.body ? '<p>' + esc(r.body) + '</p>' : '') + '</li>';
          }).join('') + '</ul></div>' : '') +
      '</div>' +
      '<aside class="account-side">' +
        '<div class="panel"><h2>Coordonnées</h2><form data-form="profile">' +
          '<label>Nom<input name="name" value="' + esc(u.name) + '" required minlength="2" maxlength="60"></label>' +
          '<label>Adresse<input name="address" value="' + esc(u.address || '') + '" maxlength="160"></label>' +
          '<div class="row"><label>Code postal<input name="zip" value="' + esc(u.zip || '') + '" maxlength="16"></label>' +
          '<label>Ville<input name="city" value="' + esc(u.city || '') + '" maxlength="80"></label></div>' +
          '<label>Pays<input name="country" value="' + esc(u.country || 'France') + '" maxlength="60"></label>' +
          '<button class="btn btn-sm btn-primary">Enregistrer</button></form></div>' +
        '<div class="panel"><h2>Mot de passe</h2><form data-form="password">' +
          '<label>Mot de passe actuel<input type="password" name="current" required autocomplete="current-password"></label>' +
          '<label>Nouveau mot de passe<input type="password" name="password" required minlength="8" autocomplete="new-password"></label>' +
          '<label>Confirmation<input type="password" name="password2" required minlength="8" autocomplete="new-password"></label>' +
          '<button class="btn btn-sm btn-outline">Changer</button></form></div>' +
        '<div class="panel tw-danger-zone"><h2>Données de démonstration</h2>' +
          '<p class="note">Comptes, commandes, avis et stocks sont stockés dans ce navigateur. ' +
          'Vous pouvez tout effacer et repartir du catalogue d\'origine.</p>' +
          '<button class="btn btn-sm btn-outline" data-act="reset">Tout réinitialiser</button></div>' +
      '</aside></div></section>';
  }

  function viewCheckout() {
    var u = currentUser();
    if (!u) return redirectTo('#/connexion?suivant=' + encodeURIComponent('/commande'));
    var view = cartView();
    if (!view.lines.length) {
      flash('Votre panier est vide.', 'info');
      return redirectTo('#/catalogue');
    }
    return '<section class="wrap"><header class="page-head"><p class="kick">Étape finale</p>' +
      '<h1>Livraison et validation</h1><p class="lead">Boutique de démonstration : aucun moyen ' +
      'de paiement n\'est demandé ni traité. La commande est enregistrée dans ce navigateur et ' +
      'le stock est décrémenté.</p></header>' +
      '<div class="cart"><form class="checkout" data-form="checkout"><fieldset>' +
        '<legend>Adresse de livraison</legend>' +
        '<label>Destinataire<input name="ship_name" value="' + esc(u.name) + '" required maxlength="160" autocomplete="name"></label>' +
        '<label>Adresse<input name="ship_address" value="' + esc(u.address || '') + '" required maxlength="160" autocomplete="street-address"></label>' +
        '<div class="row"><label>Code postal<input name="ship_zip" value="' + esc(u.zip || '') + '" required maxlength="16" autocomplete="postal-code"></label>' +
        '<label>Ville<input name="ship_city" value="' + esc(u.city || '') + '" required maxlength="80" autocomplete="address-level2"></label></div>' +
        '<label>Pays<input name="ship_country" value="' + esc(u.country || 'France') + '" required maxlength="60" autocomplete="country-name"></label>' +
      '</fieldset><p class="note">Facturé à ' + esc(u.email) + '</p>' +
      '<button class="btn btn-primary btn-big">Valider la commande — ' + eur(view.total) + '</button></form>' +
      '<aside class="summary"><h2>' + view.count + ' article' + (view.count !== 1 ? 's' : '') + '</h2>' +
        '<ul class="summary-lines">' + view.lines.map(function (l) {
          return '<li><span>' + l.qty + ' × ' + esc(l.product.name) + '</span><b>' + eur(l.total) + '</b></li>';
        }).join('') + '</ul><dl><dt>Sous-total</dt><dd>' + eur(view.subtotal) + '</dd>' +
        '<dt>Livraison</dt><dd>' + (view.shipping ? eur(view.shipping) : 'Offerte') + '</dd></dl>' +
        '<p class="summary-total"><span>Total</span><b>' + eur(view.total) + '</b></p>' +
        '<a class="linkish" href="#/panier">Modifier le panier</a></aside></div></section>';
  }

  function viewOrder(ref) {
    var u = currentUser();
    if (!u) return redirectTo('#/connexion?suivant=' + encodeURIComponent('/commande/' + ref));
    var o = DB.orders.filter(function (x) { return x.ref === ref; })[0];
    if (!o) return viewMissing();
    if (o.userId !== u.id) {
      return '<section class="wrap narrow"><div class="empty big"><p class="kick">Erreur 403</p>' +
        '<h1>Accès refusé</h1><p class="lead">Cette commande appartient à un autre compte.</p>' +
        '<div class="done-cta"><a class="btn btn-primary" href="#/compte">Mes commandes</a></div></div></section>';
    }
    return '<section class="wrap narrow"><div class="done"><p class="kick">Commande enregistrée</p>' +
      '<h1>Merci !</h1><p class="lead">Votre commande <b>' + esc(o.ref) + '</b> est enregistrée ' +
      'et son stock réservé.</p><p class="status-pill">' + esc(o.status) + '</p></div>' +
      '<div class="panel"><h2>Détail</h2><table class="table"><thead><tr><th>Article</th><th>Qté</th>' +
        '<th>Prix unitaire</th><th>Total</th></tr></thead><tbody>' +
        o.items.map(function (i) {
          return '<tr><td><a href="#/produit/' + esc(i.slug) + '">' + esc(i.name) + '</a></td>' +
            '<td>' + i.qty + '</td><td>' + eur(i.price) + '</td><td>' + eur(i.price * i.qty) + '</td></tr>';
        }).join('') + '</tbody><tfoot>' +
        '<tr><td colspan="3">Sous-total</td><td>' + eur(o.subtotal) + '</td></tr>' +
        '<tr><td colspan="3">Livraison</td><td>' + (o.shipping ? eur(o.shipping) : 'Offerte') + '</td></tr>' +
        '<tr class="grand"><td colspan="3">Total</td><td>' + eur(o.total) + '</td></tr>' +
      '</tfoot></table></div>' +
      '<div class="panel"><h2>Livraison</h2><address>' + esc(o.ship.name) + '<br>' +
        esc(o.ship.address) + '<br>' + esc(o.ship.zip) + ' ' + esc(o.ship.city) + '<br>' +
        esc(o.ship.country) + '</address><p class="note">Passée le ' + esc(o.createdAt.slice(0, 10)) +
        ' · facturée à ' + esc(o.email) + '</p></div>' +
      '<div class="done-cta"><a class="btn btn-outline" href="#/compte">Mes commandes</a>' +
        '<a class="btn btn-primary" href="#/catalogue">Continuer mes achats</a></div></section>';
  }

  function viewAdmin(sub) {
    var u = currentUser();
    if (!u) return redirectTo('#/connexion?suivant=' + encodeURIComponent('/admin'));

    var banner = '<div class="tw-warn"><b>Démonstration.</b> Cette version navigateur ouvre ' +
      'l\'administration à tout compte connecté et ne montre que les données de cet appareil. ' +
      'La version serveur la réserve aux comptes marqués administrateurs.</div>';

    var revenue = DB.orders.filter(function (o) { return o.status !== 'Annulée'; })
      .reduce(function (t, o) { return t + o.total; }, 0);
    var pending = DB.orders.filter(function (o) { return o.status === 'En préparation'; }).length;
    var low = CATALOG.products.filter(function (p) { return stockOf(p) <= 10; })
      .sort(function (a, b) { return stockOf(a) - stockOf(b); });

    var sold = {};
    DB.orders.forEach(function (o) {
      if (o.status === 'Annulée') return;
      o.items.forEach(function (i) {
        sold[i.slug] = sold[i.slug] || { name: i.name, units: 0, revenue: 0 };
        sold[i.slug].units += i.qty;
        sold[i.slug].revenue += i.qty * i.price;
      });
    });
    var top = Object.keys(sold).map(function (k) { return sold[k]; })
      .sort(function (a, b) { return b.units - a.units; }).slice(0, 6);

    var subnav = '<nav class="subnav">' +
      '<a href="#/admin"' + (!sub ? ' class="on"' : '') + '>Vue d\'ensemble</a>' +
      '<a href="#/admin/stocks"' + (sub === 'stocks' ? ' class="on"' : '') + '>Stocks</a>' +
      '<a href="#/admin/commandes"' + (sub === 'commandes' ? ' class="on"' : '') + '>Commandes</a></nav>';

    var head = '<section class="wrap"><header class="page-head"><p class="kick">Administration</p>' +
      '<h1>' + (sub === 'stocks' ? 'Stocks' : (sub === 'commandes' ? 'Commandes' : 'Tableau de bord')) +
      '</h1></header>' + subnav + banner;

    if (sub === 'stocks') {
      return head + '<div class="panel"><table class="table"><thead><tr><th>Produit</th>' +
        '<th>Famille</th><th>Prix</th><th>Stock</th><th>Avis</th><th></th></tr></thead><tbody>' +
        CATALOG.products.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); })
          .map(function (p) {
            var s = stockOf(p), r = ratingOf(p.slug);
            return '<tr><td><b>' + esc(p.name) + '</b><br><small class="muted">' + esc(p.brand) +
              ' · ' + esc(p.slug) + '</small></td><td>' + esc(CATS[p.category].name) + '</td>' +
              '<td>' + eur(p.price) + '</td>' +
              '<td><b class="' + (s === 0 ? 'danger' : (s <= 10 ? 'warn' : '')) + '">' + s + '</b></td>' +
              '<td>' + r.count + (r.avg ? ' · ' + r.avg + '★' : '') + '</td>' +
              '<td><form class="status-form" data-form="stock" data-slug="' + esc(p.slug) + '">' +
                '<input type="number" name="stock" value="' + s + '" min="0" max="9999" aria-label="Stock ' + esc(p.name) + '">' +
                '<button class="btn btn-sm btn-outline">OK</button></form></td></tr>';
          }).join('') + '</tbody></table></div></section>';
    }

    if (sub === 'commandes') {
      var orders = DB.orders.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
      return head + '<div class="panel">' + (orders.length
        ? '<table class="table"><thead><tr><th>Référence</th><th>Date</th><th>Client</th>' +
          '<th>Articles</th><th>Total</th><th>État</th></tr></thead><tbody>' +
          orders.map(function (o) {
            return '<tr><td><a href="#/commande/' + esc(o.ref) + '">' + esc(o.ref) + '</a></td>' +
              '<td>' + esc(o.createdAt.slice(0, 10)) + '</td>' +
              '<td>' + esc(o.ship.name) + '<br><small class="muted">' + esc(o.email) + '</small></td>' +
              '<td>' + o.items.length + '</td><td>' + eur(o.total) + '</td>' +
              '<td><form class="status-form" data-form="status" data-ref="' + esc(o.ref) + '">' +
                '<select name="status" aria-label="État de ' + esc(o.ref) + '">' +
                  STATUSES.map(function (s) {
                    return '<option value="' + esc(s) + '"' + (o.status === s ? ' selected' : '') +
                      '>' + esc(s) + '</option>';
                  }).join('') + '</select>' +
                '<button class="btn btn-sm btn-outline">OK</button></form></td></tr>';
          }).join('') + '</tbody></table>'
        : '<p class="note">Aucune commande enregistrée sur cet appareil.</p>') + '</div></section>';
    }

    return head +
      '<div class="kpis">' +
        '<div><span>Chiffre d\'affaires</span><b>' + eur(revenue) + '</b></div>' +
        '<div><span>Commandes</span><b>' + DB.orders.length + '</b></div>' +
        '<div><span>À préparer</span><b>' + pending + '</b></div>' +
        '<div><span>Produits en vente</span><b>' + CATALOG.products.length + '</b></div>' +
        '<div><span>Comptes locaux</span><b>' + DB.users.length + '</b></div></div>' +
      '<div class="admin-grid">' +
        '<div class="panel"><h2>Commandes récentes</h2>' +
          (DB.orders.length
            ? '<table class="table"><thead><tr><th>Référence</th><th>Client</th><th>Total</th>' +
              '<th>État</th></tr></thead><tbody>' +
              DB.orders.slice(-8).reverse().map(function (o) {
                return '<tr><td><a href="#/commande/' + esc(o.ref) + '">' + esc(o.ref) + '</a></td>' +
                  '<td>' + esc(o.email) + '</td><td>' + eur(o.total) + '</td>' +
                  '<td><span class="status-pill sm">' + esc(o.status) + '</span></td></tr>';
              }).join('') + '</tbody></table><a class="linkish" href="#/admin/commandes">Toutes les commandes →</a>'
            : '<p class="note">Aucune commande enregistrée.</p>') + '</div>' +
        '<div class="panel"><h2>Stock faible</h2>' +
          (low.length
            ? '<table class="table"><thead><tr><th>Produit</th><th>Stock</th></tr></thead><tbody>' +
              low.slice(0, 8).map(function (p) {
                var s = stockOf(p);
                return '<tr><td>' + esc(p.name) + '</td><td><b class="' + (s === 0 ? 'danger' : 'warn') +
                  '">' + s + '</b></td></tr>';
              }).join('') + '</tbody></table><a class="linkish" href="#/admin/stocks">Gérer les stocks →</a>'
            : '<p class="note">Tous les stocks sont au-dessus de 10 unités.</p>') + '</div>' +
        '<div class="panel"><h2>Meilleures ventes</h2>' +
          (top.length
            ? '<table class="table"><thead><tr><th>Produit</th><th>Unités</th><th>CA</th></tr></thead><tbody>' +
              top.map(function (t) {
                return '<tr><td>' + esc(t.name) + '</td><td>' + t.units + '</td><td>' + eur(t.revenue) + '</td></tr>';
              }).join('') + '</tbody></table>'
            : '<p class="note">Pas encore de vente.</p>') + '</div>' +
      '</div></section>';
  }

  /* ====================================================================== */
  /* 9. Routage                                                             */
  /* ====================================================================== */

  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    var qi = h.indexOf('?');
    var path = qi < 0 ? h : h.slice(0, qi);
    var query = {};
    if (qi >= 0) {
      h.slice(qi + 1).split('&').forEach(function (kv) {
        if (!kv) return;
        var eq = kv.indexOf('=');
        var k = decodeURIComponent(eq < 0 ? kv : kv.slice(0, eq));
        var v = eq < 0 ? '' : decodeURIComponent(kv.slice(eq + 1).replace(/\+/g, ' '));
        query[k] = v;
      });
    }
    return { path: path, query: query };
  }

  function redirectTo(hash) {
    setTimeout(function () { location.hash = hash; }, 0);
    return '<div class="tw-boot"><p>Redirection…</p></div>';
  }

  function go(hash) {
    if (location.hash === hash) render(); else location.hash = hash;
  }

  /* Une destination de redirection ne doit jamais sortir de l'application. */
  function safeNext(next, fallback) {
    if (next && next.charAt(0) === '/' && next.charAt(1) !== '/') return '#' + next;
    return fallback;
  }

  var lastPath = null;

  function render() {
    var r = parseHash();
    var parts = r.path.replace(/^\/+|\/+$/g, '').split('/');
    var html;

    switch (parts[0]) {
      case '':           html = viewHome(); break;
      case 'catalogue':  html = viewCatalogue(r.query); break;
      case 'produit':    html = viewProduct(decodeURIComponent(parts[1] || '')); break;
      case 'panier':     html = viewCart(); break;
      case 'inscription': html = viewRegister(r.query); break;
      case 'connexion':  html = viewLogin(r.query); break;
      case 'compte':     html = viewAccount(); break;
      case 'commande':
        html = parts[1] ? viewOrder(decodeURIComponent(parts[1])) : viewCheckout();
        break;
      case 'admin':      html = viewAdmin(parts[1] || ''); break;
      default:           html = viewMissing();
    }

    app.className = '';
    app.innerHTML = html;
    renderChrome();
    var q = document.getElementById('tw-q');
    if (q) q.value = parts[0] === 'catalogue' ? (r.query.q || '') : '';
    if (r.path !== lastPath) { window.scrollTo(0, 0); lastPath = r.path; }
  }

  /* ====================================================================== */
  /* 10. Actions                                                            */
  /* ====================================================================== */

  function fv(form, name) {
    var el = form.elements[name];
    return el ? String(el.value) : '';
  }

  function addToCart(slug, qty) {
    var p = BY_SLUG[slug];
    if (!p) return;
    var stock = stockOf(p);
    if (stock <= 0) { flash(p.name + ' est en rupture de stock.', 'error'); return; }
    var have = cartRaw()[slug] || 0;
    var want = Math.max(1, Math.min(MAX_QTY, have + Math.max(1, qty || 1)));
    if (want > stock) {
      want = stock;
      flash('Stock disponible : ' + want + ' unité(s) de ' + p.name + '.', 'info');
    } else {
      flash(p.name + ' ajouté au panier.', 'success');
    }
    cartSet(slug, want);
    render();
  }

  function doRegister(form) {
    var name = fv(form, 'name').trim();
    var email = fv(form, 'email').trim().toLowerCase();
    var pwd = fv(form, 'password');
    var pwd2 = fv(form, 'password2');
    var errors = [];
    if (name.length < 2 || name.length > 60) errors.push('Le nom doit contenir entre 2 et 60 caractères.');
    if (!EMAIL_RE.test(email) || email.length > 160) errors.push('Adresse e-mail invalide.');
    if (pwd.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caractères.');
    if (pwd !== pwd2) errors.push('Les deux mots de passe ne correspondent pas.');
    if (!errors.length && userByEmail(email)) errors.push('Un compte existe déjà avec cette adresse.');
    if (errors.length) { errors.forEach(function (e) { flash(e, 'error'); }); return; }

    var salt = randomHex(16);
    derive(pwd, salt).then(function (h) {
      var id = 'u' + randomHex(8);
      DB.users.push({ id: id, name: name, email: email, salt: salt, hash: h,
                      address: '', zip: '', city: '', country: 'France', createdAt: nowISO() });
      DB.sessionId = id;
      mergeGuestCart(id);
      saveDB();
      flash('Bienvenue ' + name + ' ! Votre compte est créé.', 'success');
      go(safeNext(fv(form, 'suivant'), '#/compte'));
    });
  }

  function doLogin(form) {
    var email = fv(form, 'email').trim().toLowerCase();
    var pwd = fv(form, 'password');
    var u = userByEmail(email);
    if (!u) { flash('Adresse e-mail ou mot de passe incorrect.', 'error'); return; }
    derive(pwd, u.salt).then(function (h) {
      if (!constantEquals(h, u.hash)) {
        flash('Adresse e-mail ou mot de passe incorrect.', 'error');
        return;
      }
      DB.sessionId = u.id;
      mergeGuestCart(u.id);
      saveDB();
      flash('Content de vous revoir, ' + u.name + '.', 'success');
      go(safeNext(fv(form, 'suivant'), '#/compte'));
    });
  }

  function doProfile(form) {
    var u = currentUser();
    if (!u) return;
    var name = fv(form, 'name').trim();
    if (name.length < 2 || name.length > 60) {
      flash('Le nom doit contenir entre 2 et 60 caractères.', 'error');
      return;
    }
    u.name = name;
    u.address = fv(form, 'address').trim().slice(0, 160);
    u.zip = fv(form, 'zip').trim().slice(0, 16);
    u.city = fv(form, 'city').trim().slice(0, 80);
    u.country = fv(form, 'country').trim().slice(0, 60) || 'France';
    saveDB();
    flash('Coordonnées enregistrées.', 'success');
    render();
  }

  function doPassword(form) {
    var u = currentUser();
    if (!u) return;
    var cur = fv(form, 'current'), next = fv(form, 'password'), next2 = fv(form, 'password2');
    if (next.length < 8) { flash('Le nouveau mot de passe doit contenir au moins 8 caractères.', 'error'); return; }
    if (next !== next2) { flash('Les deux mots de passe ne correspondent pas.', 'error'); return; }
    derive(cur, u.salt).then(function (h) {
      if (!constantEquals(h, u.hash)) { flash('Mot de passe actuel incorrect.', 'error'); return; }
      var salt = randomHex(16);
      return derive(next, salt).then(function (nh) {
        u.salt = salt;
        u.hash = nh;
        saveDB();
        flash('Mot de passe mis à jour.', 'success');
        render();
      });
    });
  }

  function doCheckout(form) {
    var u = currentUser();
    if (!u) return;
    var ship = {
      name: fv(form, 'ship_name').trim(), address: fv(form, 'ship_address').trim(),
      zip: fv(form, 'ship_zip').trim(), city: fv(form, 'ship_city').trim(),
      country: fv(form, 'ship_country').trim()
    };
    var labels = { name: 'Nom du destinataire requis.', address: 'Adresse requise.',
                   zip: 'Code postal requis.', city: 'Ville requise.', country: 'Pays requis.' };
    var errors = Object.keys(labels).filter(function (k) { return !ship[k]; });
    if (errors.length) { errors.forEach(function (k) { flash(labels[k], 'error'); }); return; }

    var view = cartView();
    if (!view.lines.length) { flash('Votre panier est vide.', 'info'); go('#/catalogue'); return; }
    var short = view.lines.filter(function (l) { return l.qty > stockOf(l.product); });
    if (short.length) {
      flash('Le stock a changé pendant la validation, vérifiez votre panier.', 'error');
      go('#/panier');
      return;
    }

    view.lines.forEach(function (l) {
      DB.stock[l.product.slug] = stockOf(l.product) - l.qty;
    });
    var d = new Date();
    var ref = 'TW-' + d.getUTCFullYear() +
      String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0') +
      '-' + randomHex(3).toUpperCase();
    DB.orders.push({
      ref: ref, userId: u.id, status: STATUSES[0], email: u.email,
      subtotal: view.subtotal, shipping: view.shipping, total: view.total,
      ship: ship, createdAt: nowISO(),
      items: view.lines.map(function (l) {
        return { slug: l.product.slug, name: l.product.name, price: l.product.price, qty: l.qty };
      })
    });
    DB.carts[u.id] = {};
    saveDB();
    go('#/commande/' + encodeURIComponent(ref));
  }

  function doReview(form, slug) {
    var u = currentUser();
    if (!u) { go('#/connexion?suivant=' + encodeURIComponent('/produit/' + slug)); return; }
    var rating = parseInt(fv(form, 'rating'), 10);
    if (!(rating >= 1 && rating <= 5)) { flash('Choisissez une note entre 1 et 5.', 'error'); return; }
    var body = fv(form, 'body').trim().slice(0, 1200);
    var existing = DB.reviews.filter(function (r) {
      return r.slug === slug && r.userId === u.id;
    })[0];
    if (existing) {
      existing.rating = rating;
      existing.body = body;
      existing.createdAt = nowISO();
      existing.author = u.name;
    } else {
      DB.reviews.push({ slug: slug, userId: u.id, author: u.name, rating: rating,
                        body: body, createdAt: nowISO() });
    }
    saveDB();
    flash('Merci, votre avis est publié.', 'success');
    render();
  }

  /* ====================================================================== */
  /* 11. Écoute des événements                                              */
  /* ====================================================================== */

  function bindEvents() {
    document.addEventListener('submit', function (e) {
      var form = e.target;
      var kind = form.getAttribute('data-form');

      if (form.id === 'tw-search') {
        e.preventDefault();
        var term = fv(form, 'q').trim();
        go('#/catalogue' + (term ? '?q=' + encodeURIComponent(term) : ''));
        return;
      }
      if (!kind) return;
      e.preventDefault();

      switch (kind) {
        case 'filters':
          var parts = [];
          var q = fv(form, 'q').trim();
          var cat = fv(form, 'categorie');
          var tri = fv(form, 'tri');
          if (q) parts.push('q=' + encodeURIComponent(q));
          if (cat) parts.push('categorie=' + encodeURIComponent(cat));
          if (tri && tri !== 'pertinence') parts.push('tri=' + tri);
          go('#/catalogue' + (parts.length ? '?' + parts.join('&') : ''));
          break;
        case 'buy':
          addToCart(form.getAttribute('data-slug'), parseInt(fv(form, 'qty'), 10) || 1);
          break;
        case 'qty':
          var slug = form.getAttribute('data-slug');
          var p = BY_SLUG[slug];
          var want = parseInt(fv(form, 'qty'), 10) || 1;
          if (p && want > stockOf(p)) {
            want = stockOf(p);
            flash('Stock limité : ' + p.name + ' ramené à ' + want + '.', 'info');
          }
          cartSet(slug, want);
          render();
          break;
        case 'register': doRegister(form); break;
        case 'login':    doLogin(form); break;
        case 'profile':  doProfile(form); break;
        case 'password': doPassword(form); break;
        case 'checkout': doCheckout(form); break;
        case 'review':   doReview(form, form.getAttribute('data-slug')); break;
        case 'stock':
          var s = Math.max(0, parseInt(fv(form, 'stock'), 10) || 0);
          DB.stock[form.getAttribute('data-slug')] = s;
          saveDB();
          flash('Stock mis à jour.', 'success');
          render();
          break;
        case 'status':
          var ref = form.getAttribute('data-ref');
          var order = DB.orders.filter(function (o) { return o.ref === ref; })[0];
          var st = fv(form, 'status');
          if (order && STATUSES.indexOf(st) >= 0) {
            order.status = st;
            saveDB();
            flash('Commande passée à « ' + st +' ».', 'success');
            render();
          }
          break;
      }
    });

    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!el) return;
      var act = el.getAttribute('data-act');
      e.preventDefault();

      if (act === 'add') {
        addToCart(el.getAttribute('data-slug'), 1);
      } else if (act === 'remove') {
        cartSet(el.getAttribute('data-slug'), 0);
        flash('Article retiré du panier.', 'info');
        render();
      } else if (act === 'logout') {
        DB.sessionId = null;
        saveDB();
        flash('Vous êtes déconnecté.', 'info');
        go('#/');
      } else if (act === 'reset') {
        if (window.confirm('Effacer les comptes, commandes, avis et stocks enregistrés '
              + 'dans ce navigateur ? Cette action est irréversible.')) {
          resetDB();
          flash('Données de démonstration réinitialisées.', 'info');
          go('#/');
        }
      }
    });

    var details = document.getElementById('tw-demo-details');
    var more = document.getElementById('tw-demo-more');
    if (details && more) {
      details.addEventListener('toggle', function () { more.hidden = !details.open; });
    }
  }

  /* ====================================================================== */
  /* 12. Amorçage                                                           */
  /* ====================================================================== */

  function boot() {
    app = document.getElementById('tw-app');
    flashes = document.getElementById('tw-flashes');
    nav = document.getElementById('tw-nav');
    catbar = document.getElementById('tw-catbar');
    if (!app) return;

    if (!CATALOG || !CATALOG.products || !CATALOG.products.length) {
      app.className = '';
      app.innerHTML = '<section class="wrap narrow"><div class="empty big">' +
        '<h1>Catalogue indisponible</h1><p>Le fichier <code>trueware-catalog.js</code> ' +
        'n\'a pas pu être chargé. Régénérez-le avec ' +
        '<code>python3 tools/build-static.py</code>.</p></div></section>';
      return;
    }

    loadDB();
    indexCatalog();
    bindEvents();
    window.addEventListener('hashchange', render);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
