// marketbuss — l'arsenal : de vrais outils et de vrais services publics, par besoin.
//
// Règles de la liste :
//   - chaque entrée a été vérifiée à la date VERIFIED (outil actif, adresse
//     officielle, existence d'une offre gratuite quand elle est annoncée) ;
//   - aucun lien sponsorisé ni affilié, aucun prix (ils changent trop vite) ;
//   - l'ordre dans une catégorie n'est pas un classement ;
//   - pas de courtier ni de plateforme qui vend des placements.
// Pour mettre à jour : revérifier chaque adresse, puis changer VERIFIED.
//
// Aucun texte ici : le nom des catégories, la description de chaque site et les
// conseils sont dans les fichiers de langue, sous `arsenal`, dans le même ordre.

export const VERIFIED = '2026-10-02';

/*
  Une catégorie : `icon` = son icône Lucide, `roles` = les profils à qui elle sert le plus.
  Un outil : [nom, adresse, accès, pays].
  Accès : free (offre gratuite), limited (gratuit mais limité), trial (essai
  gratuit), paid (payant), fee (sans abonnement, commission par paiement),
  open (logiciel libre), public (service public), null (non précisé).
*/
export const ARSENAL = [
  { id: 'construire', icon: 'zap', guide: 'dev', roles: ['entrepreneur', 'independant'], tools: [
    ['Lovable', 'https://lovable.dev', 'free'],
    ['Bolt', 'https://bolt.new', 'free'],
    ['Base44', 'https://base44.com', 'free'],
    ['Replit', 'https://replit.com', null],
  ] },
  { id: 'design', icon: 'palette', guide: 'designer', roles: ['entrepreneur', 'independant'], tools: [
    ['Canva', 'https://www.canva.com', 'free'],
    ['Figma', 'https://www.figma.com', 'free'],
    ['Adobe Express', 'https://www.adobe.com/express/', 'free'],
  ] },
  { id: 'boutique', icon: 'store', guide: 'designer', roles: ['independant', 'entrepreneur', 'ecommerce'], tools: [
    ['Wix', 'https://www.wix.com', 'free'],
    ['Shopify', 'https://www.shopify.com', 'trial'],
    ['WordPress + WooCommerce', 'https://woocommerce.com', 'open'],
    ['Squarespace', 'https://www.squarespace.com', 'trial'],
  ] },
  { id: 'ia', icon: 'bot', guide: 'robot', roles: ['entrepreneur', 'independant', 'investisseur', 'epargnant', 'ecommerce'], tools: [
    ['ChatGPT', 'https://chatgpt.com', 'free'],
    ['Claude', 'https://claude.ai', 'free'],
    ['Gemini', 'https://gemini.google.com', 'free'],
    ['Vibe (Mistral)', 'https://mistral.ai', 'free'],
  ] },
  { id: 'organiser', icon: 'square-kanban', guide: 'dev', roles: ['entrepreneur', 'independant', 'ecommerce'], tools: [
    ['Notion', 'https://www.notion.com', 'free'],
    ['Trello', 'https://trello.com', 'free'],
    ['Slack', 'https://slack.com', 'free'],
    ['Google Workspace', 'https://workspace.google.com', 'trial'],
  ] },
  { id: 'crm', icon: 'users', guide: 'client', roles: ['entrepreneur', 'independant', 'ecommerce'], tools: [
    ['HubSpot CRM', 'https://www.hubspot.com/products/crm', 'free'],
    ['Attio', 'https://attio.com', 'free'],
    ['folk', 'https://www.folk.app', 'trial'],
    ['Pipedrive', 'https://www.pipedrive.com', 'trial'],
  ] },
  { id: 'emails', icon: 'mail', guide: 'client', roles: ['independant', 'entrepreneur'], tools: [
    ['Brevo', 'https://www.brevo.com', 'free'],
    ['Kit', 'https://kit.com', 'free'],
    ['beehiiv', 'https://www.beehiiv.com', 'free'],
    ['Mailchimp', 'https://mailchimp.com', 'limited'],
  ] },
  { id: 'automatiser', icon: 'workflow', guide: 'robot', roles: ['entrepreneur', 'independant'], tools: [
    ['Zapier', 'https://zapier.com', 'free'],
    ['Make', 'https://www.make.com', 'free'],
    ['n8n', 'https://n8n.io', null],
  ] },
  { id: 'sondages', icon: 'message-circle-question-mark', guide: 'mentor', roles: ['entrepreneur', 'independant'], tools: [
    ['Tally', 'https://tally.so', 'free'],
    ['Google Forms', 'https://forms.google.com', 'free'],
    ['Typeform', 'https://www.typeform.com', 'limited'],
  ] },
  { id: 'mesurer', icon: 'chart-line', guide: 'designer', roles: ['entrepreneur', 'independant', 'ecommerce'], tools: [
    ['Google Analytics', 'https://analytics.google.com', 'free'],
    ['PostHog', 'https://posthog.com', 'free'],
    ['Plausible', 'https://plausible.io', 'trial'],
    ['Matomo', 'https://matomo.org', 'open'],
  ] },
  { id: 'presenter', icon: 'presentation', guide: 'designer', roles: ['entrepreneur', 'independant'], tools: [
    ['Gamma', 'https://gamma.app', 'free'],
    ['Pitch', 'https://pitch.com', 'free'],
    ['Canva', 'https://www.canva.com', 'free'],
  ] },
  { id: 'banque', icon: 'landmark', guide: 'banker', roles: ['independant', 'entrepreneur', 'immobilier', 'budget'], tools: [
    ['Qonto', 'https://qonto.com', 'trial', ['BE', 'FR']],
    ['Shine', 'https://www.shine.fr', 'free', ['FR']],
    ['Revolut Business', 'https://www.revolut.com/business/', 'paid', ['BE', 'FR']],
    ['Wise Business', 'https://wise.com/business/', null, ['BE', 'FR']],
  ] },
  { id: 'compta', icon: 'receipt', guide: 'accountant', roles: ['independant', 'entrepreneur'], tools: [
    ['Accountable', 'https://www.accountable.eu', 'free', ['BE']],
    ['Billit', 'https://www.billit.eu', 'trial', ['BE']],
    ['Pennylane', 'https://www.pennylane.com/fr', 'limited', ['FR']],
    ['Indy', 'https://www.indy.fr', 'free', ['FR']],
  ] },
  { id: 'paiements', icon: 'credit-card', guide: 'banker', roles: ['independant', 'entrepreneur', 'ecommerce'], tools: [
    ['Stripe', 'https://stripe.com', 'fee', ['BE', 'FR']],
    ['Mollie', 'https://www.mollie.com', 'fee', ['BE', 'FR']],
    ['SumUp', 'https://www.sumup.com', 'fee', ['BE', 'FR']],
    ['PayPal', 'https://www.paypal.com', 'fee', ['BE', 'FR']],
  ] },
  { id: 'captable', icon: 'chart-pie', guide: 'mentor', roles: ['entrepreneur', 'investisseur'], tools: [
    ['Ledgy', 'https://ledgy.com', null],
    ['Carta', 'https://carta.com', 'limited'],
    ['Equify', 'https://www.equify.eu', 'paid', ['FR']],
  ] },
  { id: 'dossier', icon: 'folder-open', guide: 'angel', roles: ['entrepreneur', 'investisseur'], tools: [
    ['Papermark', 'https://www.papermark.com', 'limited'],
    ['DocSend', 'https://www.docsend.com', 'trial'],
    ['Google Drive', 'https://drive.google.com', 'free'],
  ] },
  { id: 'donnees', icon: 'database', guide: 'angel', roles: ['investisseur', 'entrepreneur'], tools: [
    ['Crunchbase', 'https://www.crunchbase.com', 'limited'],
    ['Dealroom', 'https://dealroom.co', 'trial'],
    ['PitchBook', 'https://pitchbook.com', 'paid'],
  ] },
  { id: 'verifier', icon: 'building', guide: 'banker', roles: ['investisseur', 'epargnant', 'independant', 'immobilier'], tools: [
    ['BCE / KBO Public Search', 'https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html', 'public', ['BE']],
    ['Centrale des bilans (BNB)', 'https://consult.cbso.nbb.be/', 'public', ['BE']],
    ['Annuaire des Entreprises', 'https://annuaire-entreprises.data.gouv.fr/', 'public', ['FR']],
    ['Pappers', 'https://www.pappers.fr', 'free', ['FR']],
  ] },
  { id: 'arnaques', icon: 'shield-alert', guide: 'robot', roles: ['epargnant', 'investisseur', 'budget', 'immobilier'], tools: [
    ['FSMA : Vérifiez votre fournisseur', 'https://www.fsma.be/fr/verifiez-votre-fournisseur', 'public', ['BE']],
    ['AMF : listes noires', 'https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-noires-et-mises-en-garde', 'public', ['FR']],
    ['AMF Protect Epargne', 'https://protectepargne.amf-france.org/', 'public', ['FR']],
    ['IOSCO I-SCAN', 'https://www.iosco.org/i-scan/', 'public'],
  ] },
  { id: 'marches', icon: 'chart-candlestick', guide: 'robot', roles: ['epargnant', 'investisseur', 'budget'], tools: [
    ['justETF', 'https://www.justetf.com', 'free'],
    ['Portfolio Performance', 'https://www.portfolio-performance.info/en/', 'open'],
    ['TradingView', 'https://www.tradingview.com', 'limited'],
    ['Sharesight', 'https://www.sharesight.com', 'limited'],
  ] },
  { id: 'aides', icon: 'handshake', guide: 'mentor', roles: ['entrepreneur', 'independant'], tools: [
    ['hub.brussels', 'https://hub.brussels', 'public', ['BXL']],
    ['1890', 'https://www.1890.be', 'public', ['WAL']],
    ['VLAIO', 'https://www.vlaio.be/nl', 'public', ['VLA']],
    ['Business Belgium', 'https://business.belgium.be', 'public', ['BE']],
    ['Bpifrance Création', 'https://bpifrance-creation.fr', 'public', ['FR']],
    ['Guichet unique (INPI)', 'https://formalites.entreprises.gouv.fr', 'public', ['FR']],
  ] },
];
