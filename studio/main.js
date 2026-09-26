// Page de vente de Studio : remplit la page à partir de config.js et
// transforme le formulaire en e-mail prêt à envoyer (mailto:). Le site reste
// statique : aucune donnée n'est stockée ni envoyée ailleurs.
(function () {
  const S = window.STUDIO || {};
  const METIERS = window.METIERS;
  const offers = S.offers || [];
  const legal = S.legal || {};
  const $ = (id) => document.getElementById(id);

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    el.append(...kids.flat().filter((kid) => kid != null && kid !== false));
    return el;
  }

  const name = S.name || 'Studio';
  const euros = (n) => n.toLocaleString('fr-FR') + ' €';

  // ---------- Identité ----------

  document.title = `${name} — sites vitrines pour commerces et artisans`;
  document.querySelectorAll('[data-studio="name"]').forEach((el) => { el.textContent = name; });
  if (S.city) $('heroCity').textContent = ` · ${S.city}`;
  $('footName').textContent = `© ${new Date().getFullYear()} ${name}${S.city ? ' · ' + S.city : ''}`;
  $('setup').hidden = Boolean(S.email);

  // ---------- Aperçu interactif ----------

  const preview = $('preview');
  const fullscreen = $('fullscreen');
  const chips = $('chips');
  for (const [key, m] of Object.entries(METIERS)) {
    chips.append(h('button', {
      type: 'button',
      class: 'chip',
      'aria-pressed': key === 'boulangerie' ? 'true' : 'false',
      text: m.label,
      onclick(event) {
        chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
        event.currentTarget.setAttribute('aria-pressed', 'true');
        preview.src = 'exemple/?apercu&metier=' + key;
        fullscreen.href = 'exemple/?metier=' + key;
        $('metierSelect').value = key;
      },
    }));
  }

  // ---------- Tarifs ----------

  const offerSelect = $('offerSelect');
  const choose = (offer) => {
    offerSelect.value = offer.id;
    $('commande').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => $('orderForm').elements.nom.focus({ preventScroll: true }), 400);
  };
  $('offers').append(...offers.map((offer) => h('article', { class: 'offer' + (offer.featured ? ' featured' : '') },
    offer.featured ? h('span', { class: 'badge', text: 'Recommandé' }) : null,
    h('h3', { text: offer.name }),
    h('p', { class: 'pitch', text: offer.pitch }),
    h('p', { class: 'price' }, euros(offer.price), offer.unit ? h('small', { text: offer.unit }) : null),
    h('p', { class: 'delay', text: offer.delay }),
    h('ul', {}, offer.features.map((f) => h('li', { text: f }))),
    h('button', { type: 'button', class: 'btn' + (offer.featured ? '' : ' btn-ghost'), text: `Choisir ${offer.name}`, onclick: () => choose(offer) }),
    offer.paymentLink
      ? h('a', { class: 'pay', href: offer.paymentLink, target: '_blank', rel: 'noopener', text: 'Maquette validée ? Payer l\'acompte ↗' })
      : null,
  )));
  $('vatNote').textContent = legal.vatNote ? `Prix nets — ${legal.vatNote}.` : '';

  // ---------- Formulaire ----------

  const metierSelect = $('metierSelect');
  for (const [key, m] of Object.entries(METIERS)) metierSelect.append(h('option', { value: key, text: m.label }));
  metierSelect.append(h('option', { value: 'autre', text: 'Autre activité' }));
  for (const offer of offers) {
    offerSelect.append(h('option', { value: offer.id, text: `${offer.name} — ${euros(offer.price)}${offer.unit}` }));
  }
  offerSelect.append(h('option', { value: '', text: 'Je ne sais pas encore' }));
  offerSelect.value = (offers.find((o) => o.featured) || offers[0] || {}).id || '';

  const form = $('orderForm');
  const error = $('formError');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const missing = [...form.querySelectorAll('[required]')].filter((el) => !el.value.trim());
    const badUrl = form.elements.lien.value && !form.elements.lien.checkValidity();
    if (!S.email) {
      error.textContent = 'Ce formulaire n\'est pas encore relié à une adresse e-mail.';
    } else if (missing.length) {
      error.textContent = 'Merci de remplir les champs : ' + missing.map((el) => el.parentElement.firstChild.textContent.trim()).join(', ') + '.';
      missing[0].focus();
    } else if (badUrl) {
      error.textContent = 'Le lien de votre page existante doit commencer par https://';
      form.elements.lien.focus();
    } else {
      error.textContent = '';
    }
    error.hidden = !error.textContent;
    if (error.textContent) return;

    const v = (field) => form.elements[field].value.trim();
    const offer = offers.find((o) => o.id === v('formule'));
    const metier = METIERS[v('metier')];
    const subject = `Demande de maquette — ${v('commerce')} (${v('ville')})`;
    const body = [
      'Bonjour,',
      '',
      `Je souhaite recevoir une maquette gratuite pour mon commerce.`,
      '',
      `Nom : ${v('nom')}`,
      `Commerce : ${v('commerce')}`,
      `Activité : ${metier ? metier.label : 'Autre'}`,
      `Ville : ${v('ville')}`,
      `Me répondre : ${v('contact')}`,
      `Formule envisagée : ${offer ? `${offer.name} (${euros(offer.price)}${offer.unit})` : 'je ne sais pas encore'}`,
      v('lien') ? `Page existante : ${v('lien')}` : null,
      v('message') ? `\n${v('message')}` : null,
      '',
      'Merci !',
    ].filter((line) => line !== null).join('\n');

    location.href = `mailto:${S.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const sentTo = $('sentTo');
    sentTo.textContent = S.email;
    sentTo.href = `mailto:${S.email}`;
    $('sentBody').value = `Objet : ${subject}\n\n${body}`;
    $('sent').hidden = false;
  });

  $('copyBody').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const area = $('sentBody');
    try {
      await navigator.clipboard.writeText(area.value);
    } catch {
      area.select();
      document.execCommand('copy');
    }
    button.textContent = 'Copié ✓';
    setTimeout(() => { button.textContent = 'Copier le message'; }, 2000);
  });

  // ---------- Contact direct ----------

  const direct = $('direct');
  const phone = (S.phone || '').replace(/[^\d+]/g, '');
  if (phone) {
    const pretty = phone.replace(/^\+33/, '0').replace(/(\d{2})(?=\d)/g, '$1 ');
    direct.append(h('a', { class: 'direct-link', href: `tel:${phone}` }, h('small', { text: 'Appeler' }), pretty));
    if (S.whatsapp) {
      const text = encodeURIComponent('Bonjour, je souhaite une maquette gratuite pour mon commerce.');
      direct.append(h('a', { class: 'direct-link', href: `https://wa.me/${phone.replace('+', '')}?text=${text}`, target: '_blank', rel: 'noopener' }, h('small', { text: 'WhatsApp' }), 'Écrire un message'));
    }
  }
  if (S.email) {
    direct.append(h('a', { class: 'direct-link', href: `mailto:${S.email}` }, h('small', { text: 'E-mail' }), S.email));
  }

  // ---------- Mentions légales ----------

  const rows = [
    ['Éditeur', [S.owner || name, legal.status].filter(Boolean).join(' — ')],
    ['SIRET', legal.siret || 'en cours d\'attribution'],
    ['Adresse', legal.address || null],
    ['Contact', S.email || null],
  ];
  $('legal').append(...rows.filter(([, value]) => value).flatMap(([term, value]) => [h('dt', { text: term }), h('dd', { text: value })]));
})();
