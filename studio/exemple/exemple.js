// Maquette de site vitrine, personnalisée par l'URL :
//
//   exemple/?metier=boulangerie&nom=Boulangerie%20Martin&ville=Lyon
//
// « metier » choisit le contenu type dans metiers.js ; « nom » et « ville »
// remplacent les valeurs d'exemple. « apercu » masque le bandeau de maquette
// (utilisé par la page de vente, qui l'affiche dans un cadre de téléphone).
// Tous les boutons sont inertes : ils expliquent ce qu'ils feront une fois le
// site réel en ligne.
(function () {
  const studio = window.STUDIO || {};
  const metiers = window.METIERS;
  const params = new URLSearchParams(location.search);

  // Le texte vient de l'URL : longueur bornée, affiché uniquement via textContent.
  const clean = (value, max) => (value || '').replace(/\s+/g, ' ').trim().slice(0, max);

  const key = Object.hasOwn(metiers, params.get('metier')) ? params.get('metier') : 'boulangerie';
  const m = metiers[key];
  const nom = clean(params.get('nom'), 40) || m.sample;
  const ville = clean(params.get('ville'), 40) || 'Votre ville';
  const apercu = params.has('apercu');
  const studioName = studio.name || 'Studio';

  const $ = (id) => document.getElementById(id);
  const text = (id, value) => { $(id).textContent = value; };

  document.title = `${nom} — ${m.label} à ${ville}`;
  const root = document.documentElement.style;
  root.setProperty('--accent', m.colors.accent);
  root.setProperty('--ink', m.colors.ink);
  root.setProperty('--bg', m.colors.bg);
  root.setProperty('--soft', m.colors.soft);

  const letter = nom.replace(/^(l['’]|le |la |les |au |aux )/i, '').charAt(0).toUpperCase();
  text('mono', letter);
  text('artLetter', letter);
  text('brandName', nom);
  text('kicker', `${m.label} · ${ville}`);
  text('title', nom);
  text('tagline', m.tagline);
  text('cta', m.cta);
  text('sectionTitle', m.section);
  text('navServices', m.section);
  text('address', `12 rue de la République, ${ville}`);
  text('footName', `© ${new Date().getFullYear()} ${nom} · ${ville}`);
  text('footStudio', studioName);

  if (apercu) {
    $('demoBar').hidden = true;
    document.body.classList.add('apercu');
  } else {
    text('demoBy', `préparée gratuitement par ${studioName}`);
  }

  // Services
  const items = $('items');
  for (const [title, desc] of m.items) {
    const card = document.createElement('article');
    card.className = 'card';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    const p = document.createElement('p');
    p.textContent = desc;
    card.append(h3, p);
    items.append(card);
  }

  // Horaires, du lundi au dimanche, avec le jour courant en évidence.
  const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const now = new Date();
  const today = now.getDay();
  const fmt = (hhmm) => {
    const [h, min] = hhmm.split(':');
    return `${Number(h)} h${min === '00' ? '' : ' ' + min}`;
  };
  const table = $('hours');
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const tr = table.insertRow();
    if (d === today) tr.className = 'today';
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = DAYS[d];
    const td = document.createElement('td');
    td.textContent = m.hours[d].length
      ? m.hours[d].map(([a, b]) => `${fmt(a)} – ${fmt(b)}`).join(', ')
      : 'Fermé';
    tr.append(th, td);
  }

  // « Ouvert maintenant » : cherche le créneau en cours ou la prochaine ouverture.
  const minutes = (hhmm) => { const [h, min] = hhmm.split(':'); return h * 60 + Number(min); };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const status = $('status');
  const current = m.hours[today].find(([a, b]) => nowMin >= minutes(a) && nowMin < minutes(b));
  if (current) {
    status.textContent = `Ouvert · ferme à ${fmt(current[1])}`;
    status.classList.add('open');
  } else {
    let next = '';
    for (let offset = 0; offset < 8 && !next; offset++) {
      const d = (today + offset) % 7;
      const slot = m.hours[d].find(([a]) => offset > 0 || minutes(a) > nowMin);
      if (slot) {
        const when = offset === 0 ? 'aujourd\'hui' : offset === 1 ? 'demain' : DAYS[d].toLowerCase();
        next = `ouvre ${when} à ${fmt(slot[0])}`;
      }
    }
    status.textContent = `Fermé · ${next}`;
  }

  // Boutons de démonstration.
  const MESSAGES = {
    appeler: 'Sur le vrai site, ce bouton lance l\'appel vers votre numéro.',
    itineraire: 'Sur le vrai site, ce bouton ouvre l\'itinéraire jusqu\'à votre adresse.',
    email: 'Sur le vrai site, ce bouton ouvre un e-mail adressé à votre commerce.',
    mentions: 'Sur le vrai site, cette page contient vos mentions légales.',
    cta: `Sur le vrai site, « ${m.cta} » mène au moyen de contact de votre choix.`,
  };
  const toast = $('toast');
  let timer;
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-demo]');
    if (!link) return;
    event.preventDefault();
    const message = MESSAGES[link.dataset.demo];
    if (!message) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { toast.hidden = true; }, 3200);
  });
})();
