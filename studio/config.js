// Configuration de Studio — le seul fichier à remplir pour lancer l'activité.
//
// Tout ce qui est écrit ici s'affiche sur la page publique
// https://cybers1te.github.io/studio/ : n'y mets rien que tu ne veux pas
// montrer à tes clients. Tant que « email » est vide, la page affiche un
// bandeau « configuration requise » et le formulaire ne peut rien envoyer.
//
// Guide pas à pas : STUDIO.md, à la racine du dépôt.
window.STUDIO = {
  // Nom commercial affiché en haut de la page et dans les maquettes.
  name: 'Cybersite Studio',

  // Ton prénom et ton nom (signature des messages, mentions légales).
  owner: '',

  // Ta ville ou ta zone d'intervention, ex. « Lyon et alentours ».
  city: '',

  // Adresse e-mail qui reçoit les demandes. OBLIGATOIRE.
  email: '',

  // Téléphone au format international, sans espaces, ex. « +33612345678 ».
  // Optionnel : laisse vide pour ne pas l'afficher.
  phone: '',

  // true pour ajouter un bouton « Écrire sur WhatsApp » (utilise « phone »).
  whatsapp: false,

  // Mentions légales, obligatoires pour un site professionnel en France.
  legal: {
    status: 'Entrepreneur individuel (micro-entreprise)',
    siret: '',   // vide → « en cours d'attribution »
    address: '', // adresse de domiciliation de l'entreprise
    vatNote: 'TVA non applicable, art. 293 B du CGI',
  },

  // Les formules vendues. Modifie librement noms, prix et contenus.
  // « paymentLink » (optionnel) : lien de paiement de l'acompte (Stripe
  // Payment Link, PayPal…). S'il est rempli, la carte affiche un lien
  // « Maquette validée ? Payer l'acompte ».
  offers: [
    {
      id: 'express',
      name: 'Express',
      price: 290,
      unit: '',
      pitch: 'Une page, tout l\'essentiel.',
      delay: 'En ligne sous 72 h',
      features: [
        'Page unique adaptée au mobile',
        'Horaires, adresse, itinéraire et bouton « Appeler »',
        'Présentation de votre activité et de vos produits',
        'Nom de domaine configuré (ex. votre-commerce.fr)',
        'Mentions légales rédigées',
      ],
      paymentLink: '',
    },
    {
      id: 'vitrine',
      name: 'Vitrine',
      price: 590,
      unit: '',
      pitch: 'Le site complet d\'un commerce.',
      delay: 'En ligne sous 7 jours',
      featured: true,
      features: [
        'Tout le contenu de la formule Express',
        'Jusqu\'à 5 pages : services, galerie, équipe, contact…',
        'Formulaire de contact',
        'Référencement Google de base (titres, descriptions, plan du site)',
        'Création ou optimisation de votre fiche Google',
        'Un mois de retouches incluses',
      ],
      paymentLink: '',
    },
    {
      id: 'serenite',
      name: 'Sérénité',
      price: 29,
      unit: '/mois',
      pitch: 'Je m\'occupe de tout, vous ne touchez à rien.',
      delay: 'Sans engagement',
      features: [
        'Hébergement et nom de domaine inclus',
        'Mises à jour sous 48 h : horaires, menus, promotions…',
        'Vérification et sauvegarde chaque mois',
        'Résiliable à tout moment, le site reste à vous',
      ],
      paymentLink: '',
    },
  ],
};
