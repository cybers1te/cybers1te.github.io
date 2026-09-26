// Outil de prospection : génère le lien d'une maquette personnalisée et les
// messages à envoyer au commerce, puis garde un suivi des contacts dans le
// navigateur (localStorage, propre à cet appareil).
(function () {
  const S = window.STUDIO || {};
  const METIERS = window.METIERS;
  const offers = S.offers || [];
  const $ = (id) => document.getElementById(id);
  const euros = (n) => n.toLocaleString('fr-FR') + ' €';
  const studioName = S.name || 'Studio';
  const studioUrl = new URL('./', location.href).href;

  document.querySelectorAll('[data-studio="name"]').forEach((el) => { el.textContent = studioName; });

  const fields = {
    metier: $('metier'), ville: $('ville'), prenom: $('prenom'),
    nom: $('nom'), offre: $('offre'), tel: $('tel'),
  };
  for (const [key, m] of Object.entries(METIERS)) fields.metier.add(new Option(m.label, key));
  for (const o of offers) fields.offre.add(new Option(`${o.name} — ${euros(o.price)}${o.unit}`, o.id));
  fields.offre.value = (offers.find((o) => o.featured) || offers[0] || {}).id || '';
  fields.prenom.value = (S.owner || '').split(' ')[0];
  fields.tel.value = (S.phone || '').replace(/^\+33/, '0').replace(/(\d{2})(?=\d)/g, '$1 ');
  fields.ville.value = (S.city || '').split(/[ ,]/)[0];

  // ---------- Stockage du suivi ----------

  const KEY = 'studio-prospects';
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  };
  const save = (list) => {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* navigation privée */ }
  };
  let prospects = load();

  // ---------- Messages ----------

  const val = (f) => fields[f].value.trim();

  function render() {
    const m = METIERS[val('metier')];
    const ville = val('ville');
    const nom = val('nom') || m.sample;
    const prenom = val('prenom') || '[ton prénom]';
    const offer = offers.find((o) => o.id === val('offre'));
    const prix = offer ? `${euros(offer.price)}${offer.unit}` : '[prix]';
    const deVille = ville ? ` de ${ville}` : '';
    const link = new URL(window.maquetteUrl(val('metier'), val('nom'), ville), location.href).href;
    const signature = [prenom, val('tel'), `${studioName} — ${studioUrl}`].filter(Boolean).join('\n');

    $('maps').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${m.label} ${ville}`.trim());
    $('link').value = link;
    $('open').href = link;

    const subject = `Un aperçu du site de ${nom}`;
    const body = [
      'Bonjour,',
      '',
      `Je m'appelle ${prenom}, je crée des sites internet pour les commerces${deVille}. En cherchant « ${m.label.toLowerCase()}${ville ? ' ' + ville : ''} » sur Google, j'ai remarqué que ${nom} n'avait pas encore de site.`,
      '',
      'Je me suis permis de préparer un aperçu de ce à quoi il pourrait ressembler :',
      link,
      '',
      `Si cet aperçu vous plaît, je le mets en ligne avec vos vrais horaires, vos photos et votre adresse pour ${prix}, et vous ne payez qu'après avoir validé le résultat. Sinon, aucun souci : l'aperçu est gratuit et sans engagement.`,
      '',
      'Belle journée,',
      signature,
      '',
      'Vous ne souhaitez plus recevoir de message de ma part ? Répondez simplement « STOP ».',
    ].join('\n');
    $('email').value = `Objet : ${subject}\n\n${body}`;
    $('mail').href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    $('sms').value = `Bonjour, ${prenom} ici, je crée des sites internet pour les commerces${deVille}. J'ai préparé gratuitement un aperçu du site de ${nom} : ${link} — s'il vous convient, il peut être en ligne cette semaine pour ${prix}, payable après validation. Belle journée !`;

    $('script').value = [
      `« Bonjour, je m'appelle ${prenom}, je crée des sites internet pour les commerces${deVille}.`,
      `J'ai vu que ${nom} n'avait pas de site : quand vos clients vous cherchent sur Google, ils ne trouvent que votre fiche.`,
      `Je vous ai préparé un aperçu gratuit, je peux vous le montrer ? »`,
      '',
      '→ Montrer la maquette sur ton téléphone.',
      '',
      `« Je le mets en ligne avec vos horaires et vos photos pour ${prix}, et vous ne payez qu'après avoir validé. Qu'est-ce que vous aimeriez y voir ? »`,
    ].join('\n');
  }

  // ---------- Suivi ----------

  const STATUTS = ['Contacté', 'A répondu', 'Maquette envoyée', 'Validé', 'Payé', 'Pas intéressé'];

  function renderTrack() {
    const rows = $('rows');
    rows.replaceChildren();
    for (const p of prospects) {
      const tr = rows.insertRow();
      const cell = (text) => { const td = tr.insertCell(); td.textContent = text; return td; };
      const name = cell('');
      const a = document.createElement('a');
      a.href = new URL(window.maquetteUrl(p.metier, p.nom, p.ville), location.href).href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = p.nom;
      name.append(a);
      cell(p.ville || '—');
      cell(new Date(p.date).toLocaleDateString('fr-FR'));
      const offer = offers.find((o) => o.id === p.offre);
      cell(offer ? offer.name : '—');
      const select = document.createElement('select');
      select.setAttribute('aria-label', `Statut de ${p.nom}`);
      for (const s of STATUTS) select.add(new Option(s, s));
      select.value = p.statut;
      select.addEventListener('change', () => { p.statut = select.value; save(prospects); renderStats(); });
      tr.insertCell().append(select);
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = 'Retirer';
      del.setAttribute('aria-label', `Retirer ${p.nom} du suivi`);
      del.addEventListener('click', () => {
        prospects = prospects.filter((x) => x !== p);
        save(prospects);
        renderTrack();
      });
      tr.insertCell().append(del);
    }
    $('empty').hidden = prospects.length > 0;
    renderStats();
  }

  function renderStats() {
    const count = (s) => prospects.filter((p) => p.statut === s).length;
    const cash = prospects
      .filter((p) => p.statut === 'Payé')
      .reduce((sum, p) => sum + ((offers.find((o) => o.id === p.offre) || {}).price || 0), 0);
    const plural = (n, word) => [n, n > 1 ? word + 's' : word];
    const stats = [
      plural(prospects.length, 'contacté'),
      plural(count('A répondu') + count('Maquette envoyée') + count('Validé') + count('Payé'), 'réponse'),
      plural(count('Validé') + count('Payé'), 'client'),
      [euros(cash), 'encaissés'],
    ];
    $('stats').replaceChildren(...stats.map(([n, label]) => {
      const div = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = n;
      div.append(b, label);
      return div;
    }));
  }

  $('add').addEventListener('click', () => {
    if (!val('nom')) { fields.nom.focus(); return; }
    prospects.unshift({
      nom: val('nom'), metier: val('metier'), ville: val('ville'),
      offre: val('offre'), statut: 'Contacté', date: Date.now(),
    });
    save(prospects);
    renderTrack();
    fields.nom.value = '';
    render();
    fields.nom.focus();
  });

  // ---------- Copier ----------

  const copied = $('copied');
  let timer;
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const source = $(button.dataset.copy);
      try {
        await navigator.clipboard.writeText(source.value);
      } catch {
        source.select();
        document.execCommand('copy');
      }
      copied.hidden = false;
      clearTimeout(timer);
      timer = setTimeout(() => { copied.hidden = true; }, 1600);
    });
  });

  $('tool').addEventListener('input', render);
  $('tool').addEventListener('submit', (event) => event.preventDefault());
  render();
  renderTrack();
})();
