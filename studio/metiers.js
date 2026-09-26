// Métiers proposés dans les maquettes (exemple/) et l'outil de prospection.
//
// Chaque métier fournit le contenu d'un site type : accroche, services,
// horaires habituels et couleurs. Pour en ajouter un, copie un bloc existant
// et change sa clé (en minuscules, sans accents : elle apparaît dans l'URL).
//
// hours : un élément par jour, dimanche en premier (comme Date.getDay()),
// chacun étant une liste de créneaux [ouverture, fermeture] ; [] = fermé.
window.METIERS = {
  boulangerie: {
    label: 'Boulangerie',
    sample: 'Boulangerie des Tilleuls',
    tagline: 'Pains au levain, viennoiseries pur beurre et pâtisseries maison, cuits chaque matin sur place.',
    cta: 'Commander pour le week-end',
    section: 'Au fournil',
    items: [
      ['Pains au levain', 'Tradition, campagne, seigle, céréales : pétris la veille, cuits le matin.'],
      ['Viennoiseries', 'Croissants et pains au chocolat pur beurre, feuilletés sur place.'],
      ['Pâtisseries', 'Tartes de saison, éclairs et entremets à partager.'],
      ['Commandes', 'Pièces montées, plateaux et grandes quantités sur réservation.'],
    ],
    hours: [[['07:00', '13:00']], [], [['07:00', '19:30']], [['07:00', '19:30']], [['07:00', '19:30']], [['07:00', '19:30']], [['07:00', '19:30']]],
    colors: { accent: '#a4541a', ink: '#2b1d10', bg: '#fbf6ee', soft: '#f2e5d1' },
  },
  coiffure: {
    label: 'Salon de coiffure',
    sample: 'Salon Émeraude',
    tagline: 'Coupes, couleurs et soins sur mesure, dans un salon où l\'on prend le temps de vous écouter.',
    cta: 'Prendre rendez-vous',
    section: 'Nos prestations',
    items: [
      ['Coupe femme', 'Shampooing, coupe et coiffage adaptés à votre visage et à votre quotidien.'],
      ['Coupe homme & barbe', 'Dégradés, ciseaux, taille et entretien de la barbe.'],
      ['Couleur & balayage', 'Couleurs, mèches et balayages, avec diagnostic offert.'],
      ['Soins', 'Soins profonds et brushing pour des cheveux en pleine forme.'],
    ],
    hours: [[], [], [['09:00', '19:00']], [['09:00', '19:00']], [['09:00', '19:00']], [['09:00', '19:00']], [['09:00', '17:00']]],
    colors: { accent: '#1f6f5c', ink: '#132420', bg: '#f5f7f5', soft: '#dfece7' },
  },
  restaurant: {
    label: 'Restaurant',
    sample: 'Le Petit Comptoir',
    tagline: 'Une cuisine de marché, faite maison avec les produits des producteurs du coin.',
    cta: 'Réserver une table',
    section: 'À table',
    items: [
      ['Menu du midi', 'Entrée, plat, dessert : une ardoise qui change chaque jour.'],
      ['La carte', 'Des plats de saison, cuisinés sur place à partir de produits frais.'],
      ['Vins & boissons', 'Une sélection de vignerons indépendants, au verre ou à la bouteille.'],
      ['Groupes', 'Anniversaires, repas d\'équipe : privatisation sur demande.'],
    ],
    hours: [[], [], [['12:00', '14:00'], ['19:00', '22:30']], [['12:00', '14:00'], ['19:00', '22:30']], [['12:00', '14:00'], ['19:00', '22:30']], [['12:00', '14:00'], ['19:00', '23:00']], [['12:00', '14:30'], ['19:00', '23:00']]],
    colors: { accent: '#9c2f2f', ink: '#241514', bg: '#fbf7f2', soft: '#f1e0da' },
  },
  garage: {
    label: 'Garage automobile',
    sample: 'Garage du Centre',
    tagline: 'Entretien, réparation et diagnostic toutes marques, avec un devis clair avant chaque intervention.',
    cta: 'Demander un devis',
    section: 'Nos services',
    items: [
      ['Entretien & vidange', 'Révisions constructeur sans perdre votre garantie.'],
      ['Pneus & géométrie', 'Montage, équilibrage et parallélisme, pneus été et hiver.'],
      ['Freinage', 'Plaquettes, disques et liquide de frein contrôlés et remplacés.'],
      ['Diagnostic', 'Lecture électronique des pannes et voyants allumés.'],
    ],
    hours: [[], [['08:00', '12:00'], ['14:00', '18:00']], [['08:00', '12:00'], ['14:00', '18:00']], [['08:00', '12:00'], ['14:00', '18:00']], [['08:00', '12:00'], ['14:00', '18:00']], [['08:00', '12:00'], ['14:00', '18:00']], [['08:00', '12:00']]],
    colors: { accent: '#1d4f91', ink: '#101a2b', bg: '#f4f6f9', soft: '#dfe7f2' },
  },
  artisan: {
    label: 'Artisan du bâtiment',
    sample: 'Durand Rénovation',
    tagline: 'Plomberie, électricité et rénovation : intervention rapide et devis gratuit dans tout le secteur.',
    cta: 'Demander un devis gratuit',
    section: 'Nos interventions',
    items: [
      ['Dépannage', 'Fuite, panne, coupure : intervention rapide, du lundi au vendredi.'],
      ['Salle de bain', 'Rénovation complète, douche à l\'italienne, accessibilité.'],
      ['Électricité', 'Mise aux normes, tableau électrique, éclairage.'],
      ['Rénovation', 'Cuisine, sols, cloisons : un seul interlocuteur pour tout le chantier.'],
    ],
    hours: [[], [['08:00', '18:00']], [['08:00', '18:00']], [['08:00', '18:00']], [['08:00', '18:00']], [['08:00', '18:00']], []],
    colors: { accent: '#b0500f', ink: '#1f1a15', bg: '#f7f5f2', soft: '#efe2d4' },
  },
  fleuriste: {
    label: 'Fleuriste',
    sample: 'L\'Atelier des Fleurs',
    tagline: 'Bouquets du jour, compositions sur mesure et fleurs pour tous les moments de la vie.',
    cta: 'Commander un bouquet',
    section: 'À l\'atelier',
    items: [
      ['Bouquets du jour', 'Composés chaque matin avec les fleurs de saison.'],
      ['Mariages & événements', 'Décoration florale, bouquets de mariée, centres de table.'],
      ['Deuil', 'Couronnes et compositions, livrées avec délicatesse.'],
      ['Plantes', 'Plantes d\'intérieur et d\'extérieur, et conseils pour les garder belles.'],
    ],
    hours: [[['09:00', '13:00']], [], [['09:00', '19:30']], [['09:00', '19:30']], [['09:00', '19:30']], [['09:00', '19:30']], [['09:00', '19:30']]],
    colors: { accent: '#b0386a', ink: '#2a1420', bg: '#fcf6f8', soft: '#f5e0e9' },
  },
};

// Construit le lien d'une maquette personnalisée (chemin relatif à studio/).
window.maquetteUrl = function (metier, nom, ville) {
  const q = new URLSearchParams({ metier });
  if (nom) q.set('nom', nom);
  if (ville) q.set('ville', ville);
  return 'exemple/?' + q.toString();
};
