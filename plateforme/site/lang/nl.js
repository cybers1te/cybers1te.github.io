// marketbuss — de woorden van de site, in het Nederlands.
//
// Zelfde vorm als lang/fr.js (gecontroleerd door plateforme/tests/langues.test.js).
// Niets hier is financieel, juridisch of fiscaal advies: het is algemene uitleg.
//
// F: de formaten van de taal (F.money, F.pct, F.nf, F.times, F.ord, F.plural).

const lower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
// Een woordgroep: de hoofdletter valt alleen weg voor een gewoon klein woord (niet voor een eigennaam).
const soft = (s) => (/^(de|het|een|onze|jullie|hun|zijn|haar|mijn|elke|alle|sommige|veel|mensen|kleine|lokale|nieuwe|we|ze|klanten|gebruikers|teams|bedrijven|deze|die|dit|dat)(\s|$)/i.test(s) ? lower(s) : s);
const mnd = (n) => (n === 1 ? 'maand' : 'maanden');

export default {
  code: 'nl',
  name: 'Nederlands',
  locale: 'nl-BE',

  money(n, nf) {
    const a = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (a >= 1e9) return `${sign}€ ${nf(a / 1e9, 2)} mld`;
    if (a >= 1e6) return `${sign}€ ${nf(a / 1e6, 2)} mln`;
    if (a >= 100 || Number.isInteger(n)) return `${sign}€ ${nf(Math.round(a))}`;
    return `${sign}€ ${nf(a, 2)}`;
  },
  pct: (text) => text + '%',
  times: (text) => text + '×',
  ord: (n) => n + 'e',
  plural: (n, one, many) => (n === 1 ? one : many || one + 'en'),

  /* De pitch in één zin: `p` = de opgeschoonde stukjes. */
  pitch(p) {
    const who = soft(p.who);
    const short = `${p.name} helpt ${who} om ${lower(p.solution)}.`;
    const first = p.problem ? `${p.name} helpt ${who}, die ${lower(p.problem)}, om ${lower(p.solution)}.` : short;
    let second = '';
    if (p.unlike && p.edge) second = `Anders dan ${soft(p.unlike)}: ${soft(p.edge)}.`;
    else if (p.edge) second = `Ons verschil: ${soft(p.edge)}.`;
    return { short, text: first + (second ? ' ' + second : '') };
  },

  ui: {
    title: 'marketbuss — tools voor ondernemers en investeerders',
    description: 'marketbuss: gratis arcademachines voor ondernemers, zelfstandigen, investeerders en spaarders, en de echte tools van het moment. Zonder account.',
    skip: 'Naar de inhoud',
    loading: 'Laden…',
    language: 'Taal',
    nav: { outils: 'Machines', arsenal: 'Arsenaal', parcours: 'Traject', pitch: 'Pitch', lexique: 'Woordenlijst', 'a-propos': 'Over' },
    foot: {
      blurb: 'Gratis tools voor ondernemers, zelfstandigen, investeerders en spaarders. Zonder account: alles wordt in je browser berekend.',
      links: { outils: 'Alle machines', arsenal: 'Het arsenaal', parcours: 'Het traject', pitch: 'Pitchkaart', lexique: 'De woordenlijst', 'a-propos': 'Over' },
      note: 'De tools dienen om te begrijpen en te oefenen. Het is geen financieel, juridisch of fiscaal advies. Investeren is riskant: je kunt je hele inleg verliezen.',
    },
    all: 'Alle',
    player: 'Speler',
    result: 'Resultaat',
    yourNumbers: 'Jouw cijfers',
    reset: 'Voorbeeld terugzetten',
    copyLink: 'Link kopiëren',
    linkCopied: 'Link gekopieerd, met jouw cijfers.',
    copy: 'Kopiëren',
    copied: 'Gekopieerd.',
    copyFail: 'Kopiëren lukt niet: selecteer de tekst en kopieer hem met de hand.',
    clear: 'Alles wissen',
    seeValues: 'Bekijk de waarden',
    highest: (v) => `Hoogste: ${v}`,
    newTab: '(nieuw tabblad)',
    nTools: (n) => `${n} machine${n === 1 ? '' : 's'}`,
    nItems: (n) => `${n} tool${n === 1 ? '' : 's'}`,
    nWords: (n) => `${n} ${n === 1 ? 'woord' : 'woorden'}`,
    fineprint: 'Deze tools dienen om te begrijpen en te oefenen. Het is geen financieel, juridisch of fiscaal advies.',

    home: {
      insert: 'Gratis tools, zonder account',
      tagline: 'De speelhal voor ondernemers en investeerders.',
      lead: 'Een project doorrekenen, een prijs bepalen, een kapitaalronde voorbereiden, een belegging beoordelen: machines die rekenen, en de echte tools van het moment.',
      choose: 'Kies je speler',
      tools: 'De machines',
      toolsSub: (n) => `${n} machines die elk één vraag beantwoorden. De startcijfers zijn voorbeelden: vervang ze door de jouwe.`,
      arsenal: 'Het arsenaal',
      arsenalSub: (n, date) => `De echte tools van het moment, per behoefte: ${n} tools en overheidsdiensten, gecontroleerd op ${date}. Geen gesponsorde links.`,
      arsenalOpen: 'Open het arsenaal',
      guides: 'De gidsen',
      guidesSub: 'Verzonnen personages. Op elke machine geeft een van hen je een tip.',
      path: 'Het traject',
      pathSub: 'Van idee tot serie A, in zes niveaus: wat je moet doen, en waar een investeerder bij elke stap naar kijkt.',
      card: 'Jouw pitchkaart',
      cardText: 'Vat je project samen op een kaart en deel die met een simpele link. Bij ons wordt niets bewaard.',
      cardOpen: 'Mijn kaart maken',
      glossary: 'De woordenlijst',
      glossaryText: (n) => `Pre-money, btw, runway, ETF… ${n} woorden over ondernemen en geld, eenvoudig uitgelegd.`,
      glossaryOpen: 'Open de woordenlijst',
      lab: 'Het lab',
      labSub: 'Projecten die marketbuss heeft gelanceerd.',
      labName: 'Répondeur IA',
      labText: 'Een assistent die zelf de vragen van klanten van een zaak beantwoordt: openingsuren, prijzen, reservaties. Eerste versie, met een demo om uit te proberen. De pagina is in het Frans.',
      labOpen: 'Bekijk Répondeur IA',
    },

    tools: {
      all: 'Alle machines',
      allSub: (n) => `${n} machines, voor vier spelers.`,
      crumb: 'Machines',
      howRead: 'Hoe lees je het resultaat',
      howUse: 'Hoe gebruik je het',
      inArsenal: 'In het arsenaal',
      inArsenalSub: 'De echte tools die bij deze machine horen.',
      others: 'De andere machines van deze speler',
    },

    check: {
      label: 'punten afgevinkt',
      done: 'Alles is afgevinkt. Laat het nalezen door iemand die het onderwerp kent.',
      none: 'Vink af terwijl je bezig bent: je voortgang blijft in deze browser bewaard.',
      left: (n) => `Nog ${n} ${n === 1 ? 'punt' : 'punten'} te doen.`,
      progress: (a, b) => `${a} van ${b}`,
      clear: 'Alles uitvinken',
    },

    writer: {
      words: 'Jouw woorden',
      out: 'Jouw pitch',
      short: 'De korte zin',
      full: 'De volledige zin',
      chars: (n) => `${n} tekens`,
      charsFull: (n) => `${n} tekens. Hoe korter, hoe beter mensen het onthouden.`,
      empty: 'Vul minstens de naam in, wie je helpt en wat je hen laat doen.',
      copied: 'Zin gekopieerd.',
      fields: {
        name: ['Naam van het project', 'Nordlys'],
        who: ['Wie help je?', 'buurtbakkers'],
        problem: ['Hun probleem', 'elke avond onverkocht brood weggooien', 'Optioneel. Het vervolg van "die…".'],
        solution: ['Wat je hen laat doen', 'hun onverkochte brood voor sluitingstijd te verkopen', 'Het vervolg van "om…". Eindig met "te" en een werkwoord.'],
        unlike: ['Wat ze vandaag gebruiken', 'een kortingsbordje in de etalage', 'Optioneel.'],
        edge: ['Wat er met jou verandert', 'buurtbewoners krijgen een melding op hun telefoon', 'Optioneel.'],
      },
    },

    canvas: {
      label: 'vakken ingevuld',
      note: 'De nummers geven de aanbevolen volgorde. Je kladversie blijft in deze browser.',
      copy: 'Kopiëren als tekst',
      copied: 'Canvas gekopieerd als tekst.',
      empty: 'Vul eerst een vak in.',
      boxes: {
        problem: ['Probleem', 'De drie grootste problemen van je klanten.'],
        segments: ['Klanten', 'Wie precies? En wie koopt als eerste?'],
        uvp: ['Belofte', 'In één zin: waarom jij, en niet iets anders.'],
        solution: ['Oplossing', 'Wat je voor elk probleem aanbiedt.'],
        channels: ['Kanalen', 'Hoe klanten je vinden en kopen.'],
        revenue: ['Inkomsten', 'Wie betaalt, hoeveel, hoe vaak.'],
        costs: ['Kosten', 'Je grootste uitgaven, vast en per verkoop.'],
        metrics: ['Kerncijfers', 'De twee of drie cijfers die tonen of het werkt.'],
        edge: ['Voorsprong', 'Wat een concurrent niet makkelijk kan kopiëren.'],
      },
    },

    levels: {
      title: 'Het traject',
      sub: 'Zes niveaus, van idee tot serie A. Elk project gaat op zijn eigen tempo: sommige slaan niveaus over, en veel hoeven nooit geld op te halen.',
      level: 'Niveau',
      founder: 'Kant van de ondernemer',
      investor: 'Kant van de investeerder',
      tools: 'Nuttige machines:',
      arsenal: 'In het arsenaal:',
    },

    pitch: {
      title: 'Jouw pitchkaart',
      sub: 'Vul de vakken in en de kaart past zich aan. De link bevat de hele kaart: er wordt niets op een server bewaard.',
      shared: 'Pitchkaart',
      sharedSub: 'Deze kaart is gemaakt door een bezoeker. marketbuss heeft de inhoud niet gecontroleerd.',
      broken: 'Onleesbare kaart',
      brokenSub: 'De link is onvolledig of beschadigd. Vraag de maker om hem opnieuw te sturen.',
      create: 'Mijn kaart maken',
      copy: 'Link naar mijn kaart kopiëren',
      copied: 'Link naar je kaart gekopieerd.',
      needName: 'Geef je project eerst een naam.',
      warn: 'Schrijf alleen ware, controleerbare cijfers. Alles wat je op de kaart zet, is zichtbaar voor wie de link krijgt.',
      choose: 'Kies',
      fields: {
        name: ['Naam van het project', 'Nordlys'],
        tagline: ['Wat het doet, in één zin', 'Helpt bakkers hun onverkochte brood te verminderen'],
        stage: ['Fase', ''],
        sector: ['Sector', 'Voeding'],
        t1: ['Tractie: één waar cijfer', '38 bakkers als klant'],
        t2: ['Een tweede', '€ 9.400 omzet per maand'],
        t3: ['Een derde', 'al 6 maanden +14% per maand'],
        ask: ['Wat je zoekt', '€ 800.000'],
        contact: ['Hoe je te bereiken bent', 'Een adres voor het project'],
        use: ['Waar het geld voor dient', 'Twee ontwikkelaars aanwerven en drie steden openen'],
      },
      card: { project: 'Project', name: 'Naam van het project', tagline: 'Wat je project doet, in één zin.', traction: 'Tractie', ask: 'Gezocht', contact: 'Contact', foot: 'Pitchkaart, gemaakt op marketbuss' },
    },

    arsenal: {
      title: 'Het arsenaal',
      sub: (n, k) => `De echte tools van het moment, per behoefte: ${n} tools en overheidsdiensten, op ${k} schappen.`,
      notice: (date) => `Selectie gecontroleerd op ${date}. Geen gesponsorde links: marketbuss verdient er niets aan. De volgorde is geen rangschikking. Aanbiedingen veranderen snel: lees de voorwaarden op de officiële site voor je je vastlegt.`,
      search: 'Zoek een tool of een behoefte',
      empty: 'Geen enkele tool past. Probeer een ander woord, of haal de filter weg.',
      fineprint: '"Zonder abonnement": er gaat een commissie af van elke betaling. "Gratis, beperkt": het gratis aanbod bestaat maar zit snel vol. De genoemde namen zijn van hun eigenaars; marketbuss heeft er geen band mee.',
    },

    glossary: {
      title: 'De woordenlijst',
      sub: (n) => `${n} woorden over ondernemen en geld, eenvoudig uitgelegd.`,
      search: 'Zoek een woord',
      empty: 'Geen enkel woord past. Probeer een andere term, of haal de filter weg.',
      useful: (name) => `Nuttig voor de speler ${name}`,
    },

    about: {
      title: 'Over',
      sub: 'Wat marketbuss is, en wat het niet is.',
      sections: (n) => [
        ['Wat je hier vindt', [
          `${n.tools} machines om een project door te rekenen, een prijs te bepalen, een investering te beoordelen of een belegging te begrijpen.`,
          `Een arsenaal van ${n.arsenal} echte tools en overheidsdiensten, een traject in zes niveaus, een woordenlijst van ${n.words} woorden en een pitchkaart om te delen.`,
          'Alles is gratis en zonder account.',
          'Alles wordt in je browser berekend: je cijfers worden nergens naartoe gestuurd. Afgevinkte lijsten en kladversies blijven in deze browser.',
        ]],
        ['Wat marketbuss niet is', [
          'Geen financieel, juridisch of fiscaal advies: de tools dienen om te begrijpen en te oefenen. Laat je bijstaan door een professional voor je tekent of investeert.',
          'Geen belofte: investeren is riskant, en je kunt je hele inleg verliezen.',
          'Geen gids met contacten: marketbuss brengt niemand met elkaar in contact en controleert de pitchkaarten van bezoekers niet.',
        ]],
        ['Hoe het arsenaal gekozen is', [
          `Elke tool is gecontroleerd op ${n.date}: hij is actief, het adres is dat van de officiële site, en het vermelde gratis aanbod bestaat.`,
          'De selectie steunt op recente vergelijkingen en op de officiële sites. Het is geen rangschikking, en ze is niet volledig.',
          'Geen gesponsorde of affiliate links: marketbuss verdient er niets aan. Er staat geen enkele broker of verkoper van beleggingen in.',
          'Aanbiedingen en prijzen veranderen snel: de officiële site is de referentie.',
          'De selectie is gericht op België en Frankrijk: sommige overheidsdiensten bestaan alleen in het Frans.',
        ]],
        ['De personages en de voorbeelden', [
          'De spelers en de gidsen (Mira, Noé, Sam, Max, Lou, Ada, Iris, Bit) zijn verzonnen personages. Hun tips zijn algemene richtlijnen.',
          'De waarden die je ziet als een machine opent, zijn verzonnen voorbeelden om de berekening te tonen. Ze beschrijven geen echt bedrijf.',
        ]],
        ['Hoe het gemaakt is', [
          'De site is een statische pagina zonder afhankelijkheden. De tekeningen zijn pixelart, met de hand in de code getekend.',
          'De lettertypes Press Start 2P en Jersey 15 vallen onder de vrije OFL-licentie en staan bij de site zelf.',
          'De site bestaat in het Frans, het Engels en het Nederlands. De gekozen taal blijft in deze browser bewaard.',
        ]],
      ],
    },

    missing: { title: 'Pagina niet gevonden', sub: 'Deze pagina bestaat niet, of de link is onvolledig.', home: 'Terug naar de startpagina', tools: 'Bekijk de machines' },
  },

  roles: {
    entrepreneur: { name: 'Ondernemer', pitch: 'Ik start een project', about: 'De tools om je project door te rekenen, het te vertellen en een kapitaalronde voor te bereiden.' },
    independant: { name: 'Zelfstandige', pitch: 'Ik verkoop mijn werk', about: 'De tools om je prijzen te bepalen, klanten te vinden en te weten wat je overhoudt.' },
    investisseur: { name: 'Investeerder', pitch: 'Ik financier projecten', about: 'De tools om een investering te beoordelen en scenario\'s te testen.' },
    epargnant: { name: 'Spaarder', pitch: 'Ik zorg voor mijn spaargeld', about: 'De tools om te zien wat tijd, kosten en stijgende prijzen doen.' },
  },

  guides: {
    mentor: { name: 'Mira', job: 'de mentor', line: 'Stelt de lastige vragen voordat de investeerders dat doen.' },
    accountant: { name: 'Noé', job: 'de boekhouder', line: 'Houdt van cijfers die kloppen en facturen die op tijd vertrekken.' },
    dev: { name: 'Sam', job: 'de ontwikkelaar', line: 'Bouwt snel, test vroeg, gooit zonder spijt weg wat niet nodig is.' },
    designer: { name: 'Max', job: 'de designer', line: 'Haalt alles weg wat de klant niet helpt te begrijpen.' },
    client: { name: 'Lou', job: 'de klant', line: 'Koopt als het duidelijk, nuttig en eerlijk geprijsd is. Anders is ze weg.' },
    banker: { name: 'Ada', job: 'de bankier', line: 'Kijkt eerst naar de kas, dan naar de beloftes.' },
    angel: { name: 'Iris', job: 'de business angel', line: 'Investeert vroeg, verliest vaak, en rekent op enkele grote successen.' },
    robot: { name: 'Bit', job: 'de robot', line: 'Houdt het arsenaal bij en rekent zonder moe te worden.' },
  },

  /* Een machine: naam, vraag, inleiding, velden {sleutel: [label, eenheid, hulp]}, uitleg, grenzen, tip van de gids. */
  tools: {
    runway: {
      name: 'Maanden overleven',
      question: 'Hoeveel maanden hou ik het vol met mijn kasgeld?',
      lead: 'Je kasgeld, wat je uitgeeft, wat er binnenkomt: de tool telt de maanden die je nog hebt voor het op is.',
      fields: {
        cash: ['Kasgeld vandaag', '€'],
        burn: ['Uitgaven per maand', '€'],
        revenue: ['Inkomsten per maand', '€'],
        growth: ['Groei van de inkomsten', '% per maand'],
      },
      read: [
        'Elke kolom is je kasgeld aan het einde van een maand. Zakt het onder nul, dan is het geld op.',
        'Halen je inkomsten je uitgaven in vóór dat moment, dan ben je rendabel en stijgt het kasgeld weer.',
        'Een kapitaalronde duurt vaak meerdere maanden: begin er ruim voor de laatste maand aan.',
      ],
      limits: 'De berekening gaat uit van constante uitgaven en een regelmatige groei. In het echt lijkt geen maand op de andere: hou een marge aan.',
      tip: 'Bekijk dit cijfer elke maand, niet alleen als het slecht gaat. Onder de zes maanden moet je handelen.',
    },
    lever: {
      name: 'Volle tank',
      question: 'Hoeveel moet ik ophalen om de volgende mijlpaal te halen?',
      lead: 'Wat je uitgeeft, wat er binnenkomt, het aantal maanden dat je wilt financieren: de tool geeft het bedrag, en het deel van het bedrijf dat je afstaat.',
      fields: {
        burn: ['Uitgaven per maand, na de ronde', '€', 'Met de geplande aanwervingen.'],
        revenue: ['Inkomsten per maand', '€'],
        months: ['Maanden te financieren', 'maanden'],
        buffer: ['Veiligheidsmarge', '%', 'Voor vertragingen en verrassingen.'],
        pre: ['Waardering vóór de ronde', '€', 'Optioneel: om te zien welk deel je afstaat.'],
      },
      read: [
        'Behoefte = (uitgaven − inkomsten) × aantal maanden, plus de veiligheidsmarge.',
        'Een vaak genoemde vuistregel: genoeg voor 18 tot 24 maanden, want een ronde kost tijd en je moet vooruitgang kunnen tonen voor de volgende.',
        'Afgestaan deel = opgehaald bedrag ÷ (waardering vóór de ronde + opgehaald bedrag).',
      ],
      limits: 'De berekening gaat uit van constante uitgaven en inkomsten. Groeien je inkomsten, dan is de echte behoefte lager: vergelijk met de machine "Maanden overleven".',
      tip: 'Haal geld op om een precieze mijlpaal te halen, niet om "vol te houden". Een investeerder wil weten wat het geld gaat bewijzen.',
    },
    dilution: {
      name: 'De taart verdelen',
      question: 'Welk deel hou ik over na een kapitaalronde?',
      lead: 'Als investeerders instappen, wordt jouw deel van het bedrijf kleiner. De tool toont wie wat bezit na de ronde.',
      fields: {
        pre: ['Waardering vóór de ronde', '€', 'Wat het bedrijf waard is vóór het geld van de investeerders (pre-money).'],
        raise: ['Opgehaald bedrag', '€'],
        pool: ['Pool voor toekomstige werknemers', '%', 'Aandelen die opzij worden gehouden voor nieuwe werknemers, in % van het bedrijf na de ronde.'],
        founders: ['Deel van de oprichters vóór de ronde', '%'],
      },
      read: [
        'Waardering na de ronde (post-money) = waardering vóór + opgehaald bedrag.',
        'Het deel van de investeerders = opgehaald bedrag ÷ waardering na de ronde.',
        'Hier komt de werknemerspool uit het deel van wie er al was, zoals investeerders vaak vragen.',
      ],
      limits: 'Een echte ronde kan andere mechanismen bevatten (converteerbare leningen, preferente aandelen…) die de verdeling veranderen. Laat de documenten nalezen door een professional.',
      tip: 'Een te hoge waardering vandaag maakt de volgende ronde moeilijker. De juiste prijs is er een die je later kunt overtreffen.',
    },
    vesting: {
      name: 'Zandloper',
      question: 'Hoeveel van mijn aandelen zijn echt van mij?',
      lead: 'Met vesting verdien je aandelen in de loop van de tijd. De tool toont wat al van jou is, en wat je zou verliezen als je vandaag vertrekt.',
      fields: {
        stake: ['Toegekend deel', '% van het bedrijf'],
        years: ['Duur van de vesting', 'jaar'],
        cliff: ['Wachtperiode (cliff)', 'maanden', 'Vóór die datum is er niets verworven.'],
        elapsed: ['Verstreken tijd', 'maanden'],
      },
      read: [
        'Vóór het einde van de cliff is er niets verworven. Aan het einde van de cliff telt alle verstreken tijd in één keer.',
        'Daarna verwerf je de aandelen maand na maand, tot het einde van de periode.',
        'Een gangbaar schema: 4 jaar, met één jaar cliff.',
      ],
      limits: 'Het precieze schema, en wat er gebeurt bij een vertrek of een verkoop van het bedrijf, staat in de aandeelhoudersovereenkomst of het toekenningsplan: dat document telt.',
      tip: 'Vesting beschermt wie blijft. Regel het vanaf het begin tussen oprichters: een investeerder vraagt er toch om.',
    },
    marche: {
      name: 'Wereldkaart',
      question: 'Hoe groot is mijn markt?',
      lead: 'Je vertrekt van het aantal mogelijke klanten en wat elke klant opbrengt: de tool geeft de totale markt, het deel dat je kunt bedienen en het deel waar je op mikt.',
      fields: {
        customers: ['Mogelijke klanten in totaal', 'klanten', 'Iedereen die het probleem heeft dat jij oplost.'],
        price: ['Inkomsten per klant', '€ per jaar'],
        reachable: ['Deel dat je kunt bedienen', '%', 'Je land, je taal, je type klant.'],
        share: ['Deel waar je op mikt', '%', 'Van wie je kunt bedienen, binnen enkele jaren.'],
      },
      read: [
        'Totale markt (TAM) = mogelijke klanten × inkomsten per klant.',
        'Markt die je kunt bedienen (SAM) = de totale markt × het bereikbare deel.',
        'Markt waar je op mikt (SOM) = de markt die je kunt bedienen × het deel waar je op mikt. Dat is het nuttigste cijfer voor je plan.',
      ],
      limits: 'De twee percentages zijn aannames: zeg waar ze vandaan komen. Marktaandeel win je klant voor klant.',
      tip: 'Een investeerder gelooft een berekening die bij de klanten begint sneller dan een groot cijfer uit een studie.',
    },
    client: {
      name: 'Klantenjacht',
      question: 'Brengt een klant meer op dan hij mij kost?',
      lead: 'Wat je uitgeeft om een klant te winnen (CAC), en wat die opbrengt zolang hij blijft (LTV).',
      fields: {
        spend: ['Uitgaven om klanten te vinden', '€', 'Reclame, beurzen, tools, over een bepaalde periode.'],
        customers: ['Nieuwe klanten in dezelfde periode', 'klanten'],
        arpu: ['Inkomsten per klant', '€ per maand'],
        margin: ['Brutomarge', '%', 'Wat er van de inkomsten overblijft nadat de dienst geleverd is.'],
        churn: ['Klanten die vertrekken', '% per maand'],
      },
      read: [
        'CAC = uitgaven ÷ nieuwe klanten.',
        'LTV = inkomsten per maand × marge ÷ deel van de klanten dat elke maand vertrekt.',
        'Vaak genoemde richtwaarden: een LTV van minstens 3 keer de CAC, en een CAC die in minder dan 12 maanden is terugverdiend.',
      ],
      limits: 'Met weinig klanten of weinig maanden historiek is het klantverloop erg onzeker, en de LTV dus ook.',
      tip: 'Ik blijf als het product me elke week helpt. Mij houden kost minder dan mij vervangen.',
    },
    objectif: {
      name: 'Op koers',
      question: 'Hoeveel klanten moet ik elke maand winnen om mijn doel te halen?',
      lead: 'Een maandinkomen als doel, een prijs, klanten die vertrekken: de tool geeft het aantal nieuwe klanten dat je elke maand moet winnen.',
      fields: {
        target: ['Beoogde inkomsten', '€ per maand'],
        price: ['Inkomsten per klant', '€ per maand'],
        current: ['Klanten vandaag', 'klanten'],
        churn: ['Klanten die vertrekken', '% per maand'],
        months: ['Termijn', 'maanden'],
      },
      read: [
        'Benodigde klanten = beoogde inkomsten ÷ inkomsten per klant.',
        'Elke maand vertrekt een deel van je klanten: je moet hen vervangen én groeien.',
        'Een lager klantverloop verkleint het aantal klanten dat je moet vinden, elke maand.',
      ],
      limits: 'De berekening gaat uit van één prijs en een constant klantverloop. Ze zegt niet of je markt genoeg klanten telt: zie de machine "Wereldkaart".',
      tip: 'Vraag je, voor je nieuwe klanten gaat zoeken, af waarom de oude vertrekken.',
    },
    croissance: {
      name: 'Turbo',
      question: 'Welke groei per maand heb ik nodig om mijn doel te halen?',
      lead: 'Van een startcijfer naar een doelcijfer, in een aantal maanden: de tool geeft de groei die nodig is, maand na maand.',
      fields: {
        from: ['Cijfer van vandaag', '', 'Omzet, klanten, gebruikers: wat je wilt laten groeien.'],
        to: ['Doelcijfer', ''],
        months: ['Termijn', 'maanden'],
      },
      read: [
        'De groei per maand is het percentage dat je, elke maand herhaald, van de start naar het doel brengt.',
        'Regelmatige groei stapelt zich op: 10% per maand is na een jaar meer dan 3 keer zoveel.',
      ],
      limits: 'Dezelfde groei lang volhouden wordt steeds moeilijker naarmate de cijfers groter worden.',
      tip: 'Kies één cijfer dat je wilt laten groeien, en bekijk het elke week.',
    },
    canvas: {
      name: 'Spelplan',
      question: 'Past mijn project op één pagina?',
      lead: 'Het lean canvas: negen vakken om een project te beschrijven. Schrijf kort. Wat je typt, blijft in deze browser.',
      read: [
        'Begin met het probleem en de klanten: de rest hangt daarvan af.',
        'Een leeg of vaag vak toont wat je nog niet weet.',
        'Maak het opnieuw na elke reeks gesprekken met klanten: het is een kladversie, geen contract.',
      ],
      limits: 'Het lean canvas is bedacht door Ash Maurya, op basis van het Business Model Canvas. Het beschrijft aannames: alleen klanten kunnen die bevestigen.',
      tip: 'Vul het in twintig minuten in en ga dan het riskantste vak controleren bij echte klanten.',
    },
    phrase: {
      name: 'Bliksempitch',
      question: 'Hoe vat ik mijn project samen in één zin?',
      lead: 'Enkele stukjes om in te vullen: de tool zet ze samen tot een korte zin en een volledige zin, klaar om uit te spreken.',
      read: [
        'De korte zin moet volstaan voor iemand die je sector niet kent.',
        'Zeg hem hardop tegen drie mensen. Herhalen ze hem fout, vereenvoudig dan.',
        'Geen holle woorden: "innovatief", "revolutionair", "totaaloplossing" zeggen niets.',
      ],
      limits: 'De tool zet je woorden samen, hij verbetert ze niet. Lees de zin na op taalfouten voor je hem gebruikt.',
      tip: 'Als ik na tien seconden niet begrijp wat je verkoopt, haak ik af.',
    },
    deck: {
      name: 'De 10 slides',
      question: 'Is mijn pitchdeck volledig?',
      lead: 'De tien slides die een investeerder verwacht. Vink af wat je al hebt.',
      limits: 'Een lijst vervangt geen helder verhaal: één idee per slide, en ware cijfers.',
      tip: 'Eén idee per slide. Moet je het mondeling uitleggen, dan is het nog niet duidelijk.',
    },
    tarif: {
      name: 'Prijs van tijd',
      question: 'Welk dagtarief heb ik nodig om van mijn werk te leven?',
      lead: 'Je vertrekt van wat je elke maand wilt overhouden: de tool rekent terug naar het dagtarief dat je moet factureren.',
      fields: {
        net: ['Wat je wilt overhouden', '€ per maand', 'Nadat sociale bijdragen, belastingen en kosten betaald zijn.'],
        days: ['Gefactureerde dagen', 'per maand', 'Zelden alle werkdagen: je moet ook klanten vinden.'],
        weeks: ['Weken zonder facturen', 'per jaar', 'Vakantie, ziekte, kalme periodes.'],
        charges: ['Bijdragen en belastingen', '%', 'Het deel van wat je verdient dat weer vertrekt. Het hangt af van het land, je statuut en je inkomen.'],
        costs: ['Beroepskosten', '€ per maand', 'Software, materiaal, verzekering, boekhouder, verplaatsingen.'],
      },
      read: [
        'Te factureren per jaar = 12 × (wat je per maand wilt overhouden ÷ (1 − bijdragen en belastingen) + kosten per maand).',
        'Gefactureerde dagen per jaar = dagen per maand × 12, min de weken zonder facturen.',
        'Dagtarief = te factureren bedrag ÷ gefactureerde dagen. Het is een tarief exclusief btw.',
      ],
      limits: 'De tool berekent je belastingen niet: het percentage vul je in samen met je boekhouder, volgens je land en je statuut. Kijk ook naar de gangbare tarieven in je vak.',
      tip: 'Vergeet de dagen niet waarop je niet factureert: klanten zoeken, administratie, vakantie, ziekte.',
    },
    devis: {
      name: 'Snelofferte',
      question: 'Hoeveel moet ik voor dit project vragen?',
      lead: 'Werkdagen, een tarief, een marge voor verrassingen, kosten: de tool geeft het bedrag van de offerte en het voorschot dat je vraagt.',
      fields: {
        days: ['Geschatte werkdagen', 'dagen'],
        rate: ['Dagtarief', '€'],
        buffer: ['Marge voor verrassingen', '%', 'Een project duurt bijna altijd langer dan gepland.'],
        expenses: ['Door te rekenen kosten', '€', 'Verplaatsingen, licenties, aankopen voor de klant.'],
        vat: ['Btw', '%', 'Normaal tarief: 21% in België, 20% in Frankrijk. 0 als je vrijgesteld bent.'],
        deposit: ['Gevraagd voorschot', '%', 'Te betalen voor je begint.'],
      },
      read: [
        'Exclusief btw = dagen × tarief, plus de marge voor verrassingen, plus de kosten.',
        'Totaal = exclusief btw + btw.',
        'Het voorschot beschermt je als de klant onderweg verdwijnt.',
      ],
      limits: 'Een ondertekende offerte bindt je: schrijf duidelijk wat inbegrepen is, wat niet, en de betalingstermijnen. De verplichte vermeldingen hangen af van je land.',
      tip: 'Schrijf op wat niet in de prijs zit: daar ontstaan de ruzies.',
    },
    prix: {
      name: 'Prijskaartje',
      question: 'Tegen welke prijs moet ik verkopen om mijn marge te houden?',
      lead: 'De kost van je product, de marge die je wilt houden, de btw: de tool geeft de prijs exclusief btw en de prijs op het etiket.',
      fields: {
        cost: ['Kost van het product', '€', 'Alles wat een verkoop je kost: materiaal, verpakking, levering, commissie.'],
        margin: ['Beoogde marge', '% van de prijs', 'Het deel van de prijs exclusief btw dat bij jou blijft.'],
        vat: ['Btw', '%', 'Normaal tarief: 21% in België, 20% in Frankrijk. Sommige producten hebben een verlaagd tarief.'],
      },
      read: [
        'Prijs exclusief btw = kost ÷ (1 − beoogde marge).',
        'De marge wordt hier geteld in % van de verkoopprijs. Geteld in % van de kost is het een groter cijfer: de tool geeft beide.',
        'Prijs op het etiket = prijs exclusief btw + btw.',
      ],
      limits: 'Een prijs moet je testen: kijk wat concurrenten vragen en wat je klanten willen betalen. Ben je vrijgesteld van btw, vul dan 0 in.',
      tip: 'De marge bereken je exclusief btw: de btw is niet van jou, je draagt die af.',
    },
    remise: {
      name: 'Solden',
      question: 'Wat kost een korting mij echt?',
      lead: 'Een korting gaat helemaal van je marge af. De tool toont hoeveel extra verkopen nodig zijn om evenveel te verdienen als voordien.',
      fields: {
        price: ['Verkoopprijs', '€', 'Exclusief btw.'],
        margin: ['Marge', '% van de prijs'],
        discount: ['Korting', '%'],
      },
      read: [
        'De korting verlaagt de prijs, maar niet je kost: ze gaat van je marge af.',
        'Benodigde extra verkopen = marge vóór ÷ marge na − 1.',
        'Hoe dunner je marge, hoe duurder een korting.',
      ],
      limits: 'De berekening zegt niet of de korting echt meer klanten aantrekt: dat moet je meten. Een korting kan ook dienen om voorraad weg te werken of om mensen te laten proberen.',
      tip: 'Een korting lokt me één keer. Bevalt het product, dan kom ik terug tegen de gewone prijs.',
    },
    seuil: {
      name: 'Eindstreep',
      question: 'Hoeveel verkopen tot ik geen geld meer verlies?',
      lead: 'Het break-evenpunt: het aantal verkopen per maand vanaf wanneer je kosten gedekt zijn.',
      fields: {
        price: ['Verkoopprijs', '€'],
        variable: ['Kost per verkoop', '€', 'Wat elke verkoop je kost: materiaal, levering, commissie…'],
        fixed: ['Vaste kosten per maand', '€', 'Wat je betaalt, ook zonder te verkopen: huur, lonen, abonnementen…'],
      },
      read: [
        'Marge per verkoop = verkoopprijs − kost per verkoop.',
        'Break-even = vaste kosten ÷ marge per verkoop, afgerond naar de volgende verkoop.',
        'Boven het break-evenpunt voegt elke verkoop zijn marge toe aan je winst.',
      ],
      limits: 'De berekening gaat uit van één product en een vaste prijs. Met meerdere producten redeneer je met het gemiddelde winkelmandje.',
      tip: 'Zolang je onder het break-evenpunt zit, vreet elke maand aan je kasgeld. Weet op welke datum je het wilt halen.',
    },
    tunnel: {
      name: 'Trechter',
      question: 'Hoeveel bezoekers worden klant?',
      lead: 'Bezoekers, een deel dat zijn gegevens achterlaat, een deel dat koopt: de tool geeft de verkopen, de omzet en wat een klant kost.',
      fields: {
        visitors: ['Bezoekers', 'per maand'],
        signup: ['Bezoekers die hun gegevens achterlaten', '%', 'Inschrijving, offerteaanvraag, begonnen winkelmandje.'],
        purchase: ['Contacten die kopen', '%'],
        basket: ['Gemiddeld aankoopbedrag', '€'],
        spend: ['Uitgaven om bezoekers aan te trekken', '€ per maand', 'Reclame, content, partnerschappen. 0 als je niets uitgeeft.'],
      },
      read: [
        'Klanten = bezoekers × deel dat gegevens achterlaat × deel dat koopt.',
        'Kost van een klant = uitgaven ÷ klanten.',
        'Een percentage verdubbelen heeft hetzelfde effect als de bezoekers verdubbelen, en kost vaak minder.',
      ],
      limits: 'De percentages verschillen sterk van vak tot vak: meet die van jou in plaats van die van anderen over te nemen.',
      tip: 'Verbeter eerst de stap waar je de meeste mensen verliest: daar levert de inspanning het meest op.',
    },
    tirelire: {
      name: 'Spaarvarken',
      question: 'Hoeveel moet ik van elke factuur opzijzetten?',
      lead: 'Als een klant je betaalt, is niet alles van jou. De tool scheidt de btw, de bijdragen en belastingen, en wat er echt voor jou overblijft.',
      fields: {
        amount: ['Bedrag van de factuur', '€', 'Exclusief btw.'],
        vat: ['Btw', '%', '0 als je vrijgesteld bent.'],
        charges: ['Bijdragen en belastingen', '%', 'Het deel van het bedrag exclusief btw dat weer zal vertrekken. Het hangt af van het land, je statuut en je inkomen.'],
      },
      read: [
        'Btw die je ontvangt, is geen inkomen: je draagt die af aan de staat.',
        'Bijdragen en belastingen betaal je later, soms een jaar later: zonder reserve komt de rekening als het geld al op is.',
        'Het eenvoudigst: zet het bedrag opzij op een andere rekening op de dag dat de klant betaalt.',
      ],
      limits: 'De tool berekent je belastingen niet: het percentage is een schatting die je met je boekhouder bepaalt. Je beroepskosten zijn niet meegeteld.',
      tip: 'Open een tweede rekening voor het geld dat niet van jou is. Wat je niet ziet, geef je niet uit.',
    },
    lancement: {
      name: 'Startschot',
      question: 'Ben ik klaar om mijn eerste klant te factureren?',
      lead: 'Tien punten om te regelen voor je je eerste factuur verstuurt. Vink af wat klaar is.',
      limits: 'Een algemene lijst: de precieze stappen hangen af van je land en je vak. De overheidsinstanties in het arsenaal geven gratis informatie.',
      tip: 'De regels verschillen per land en per statuut. Een uur met een boekhouder bij de start bespaart veel zorgen.',
    },
    ticket: {
      name: 'Muntje terug',
      question: 'Wat is mijn inleg waard als het bedrijf verkocht wordt?',
      lead: 'Een geïnvesteerd bedrag, een waardering bij instap, een bij exit: de tool geeft het veelvoud en het rendement per jaar.',
      fields: {
        ticket: ['Geïnvesteerd bedrag', '€'],
        post: ['Waardering bij instap, na de ronde', '€'],
        dilution: ['Verwatering in latere rondes', '%', 'Bij elke nieuwe ronde wordt je deel kleiner.'],
        exit: ['Waardering bij exit', '€'],
        years: ['Duur', 'jaar'],
      },
      read: [
        'Je deel bij instap = geïnvesteerd bedrag ÷ waardering na de ronde.',
        'Wat je terugkrijgt = je deel bij exit × waardering bij exit.',
        'Het rendement per jaar (IRR) is het percentage dat, elk jaar herhaald, dit veelvoud geeft.',
      ],
      limits: 'Het is een scenario, geen voorspelling. Veel jonge bedrijven geven de inleg nooit terug, en een exit kan veel langer duren dan gepland.',
      tip: 'Ik ga ervan uit dat elke inleg nul waard kan worden. Ik leg alleen in wat ik kan missen.',
    },
    valo: {
      name: 'Instapprijs',
      question: 'Tegen welke waardering moet ik instappen om mijn veelvoud te halen?',
      lead: 'Je vertrekt van de exit waar je op hoopt en het veelvoud waar je op mikt: de tool rekent terug naar de maximale waardering bij instap.',
      fields: {
        exit: ['Verhoopte waardering bij exit', '€'],
        multiple: ['Beoogd veelvoud', 'keer de inleg'],
        dilution: ['Verwatering in latere rondes', '%'],
        ticket: ['Geïnvesteerd bedrag', '€', 'Optioneel: om je deel te zien.'],
      },
      read: [
        'Maximale waardering na de ronde = waardering bij exit × (1 − verwatering) ÷ beoogd veelvoud.',
        'Boven die waardering heb je een grotere exit nodig om hetzelfde veelvoud te halen.',
      ],
      limits: 'Alles hangt af van de verhoopte exit, die niemand vooraf kent. Test meerdere scenario\'s.',
      tip: 'De instapprijs is het enige wat je in de hand hebt. De exit kent niemand.',
    },
    portefeuille: {
      name: 'Dobbelworp',
      question: 'Wat brengt een portefeuille van jonge bedrijven op?',
      lead: 'Veel mislukkingen, enkele middelmatige resultaten, zeldzame grote successen: de tool toont wat dat samen oplevert.',
      fields: {
        count: ['Bedrijven in de portefeuille', 'bedrijven'],
        ticket: ['Bedrag in elk bedrijf', '€'],
        fail: ['Bedrijven die niets teruggeven', '%'],
        mid: ['Bedrijven die een beetje teruggeven', '%'],
        midMultiple: ['Wat die teruggeven', 'keer de inleg'],
        winMultiple: ['Wat de grote successen teruggeven', 'keer de inleg', 'De grote successen: alles wat overblijft na de twee andere groepen.'],
      },
      read: [
        'Veelvoud van de portefeuille = de som, voor elke groep, van haar deel × wat ze teruggeeft.',
        'Kijk naar de regel "zonder de grote successen": dat blijft over als er geen winnaar komt.',
        'Met weinig bedrijven is het gewoon om geen enkel groot succes te hebben.',
      ],
      limits: 'Deze percentages zijn jouw aannames, geen statistieken. In het echt hangt het resultaat van enkele bedrijven af, staat het geld jarenlang vast, en kun je alles verliezen.',
      tip: 'Eén inleg is een gok. Je hebt er veel nodig om kans te maken op een winnaar.',
    },
    suivre: {
      name: 'In de race blijven',
      question: 'Hoeveel moet ik bijleggen om mijn deel te houden?',
      lead: 'Bij elke nieuwe ronde wordt je deel kleiner, tenzij je geld bijlegt. De tool geeft het bedrag, en wat je deel wordt als je niet volgt.',
      fields: {
        stake: ['Je deel vandaag', '% van het bedrijf'],
        pre: ['Waardering vóór de ronde', '€'],
        raise: ['Bedrag van de ronde', '€'],
      },
      read: [
        'Om hetzelfde deel te houden, moet je jouw deel van het opgehaalde bedrag inbrengen.',
        'Volg je niet, dan is je deel = huidig deel × waardering vóór ÷ waardering na.',
        'Je deel daalt in procent, maar het kan meer waard zijn als de waardering gestegen is.',
      ],
      limits: 'Het recht om te volgen (pro rata) moet in de ondertekende documenten staan: het is niet automatisch. De berekening houdt geen rekening met pools voor werknemers.',
      tip: 'Volgen is extra geld steken in een bedrijf dat je al kent: daar zit vaak het grootste deel van het resultaat, en ook van het risico.',
    },
    fonte: {
      name: 'IJsblokje',
      question: 'Wat wordt mijn deel na meerdere rondes?',
      lead: 'Bij elke ronde worden nieuwe aandelen gemaakt en smelt je deel een beetje. De tool toont het effect van meerdere rondes.',
      fields: {
        stake: ['Je deel vandaag', '% van het bedrijf'],
        rounds: ['Aantal komende rondes', 'rondes'],
        dilution: ['Verwatering per ronde', '%', 'Het deel van het bedrijf dat bij elke ronde naar de nieuwkomers gaat.'],
      },
      read: [
        'Bij elke ronde wordt je deel vermenigvuldigd met (1 − verwatering).',
        'Verwateringen stapelen zich op: drie rondes van 20% nemen bijna de helft weg.',
      ],
      limits: 'De verwatering is nooit dezelfde van ronde tot ronde, en een kleiner deel kan meer waard zijn als de waardering stijgt.',
      tip: 'Een klein deel van een groot bedrijf kan meer waard zijn dan een groot deel van een klein. Kijk naar de waarde, niet alleen naar het percentage.',
    },
    convertible: {
      name: 'Instapbon',
      question: 'Welk deel geeft een SAFE of converteerbare lening bij de volgende ronde?',
      lead: 'Nu geld, later aandelen. De tool toont het deel dat je krijgt wanneer de volgende ronde komt, afhankelijk van het plafond en de korting.',
      fields: {
        amount: ['Ingebracht bedrag', '€'],
        cap: ['Waarderingsplafond', '€', '0 als er geen is.'],
        discount: ['Korting', '%'],
        pre: ['Waardering vóór de volgende ronde', '€'],
        raise: ['Bedrag van de volgende ronde', '€'],
      },
      read: [
        'De houder converteert tegen de laagste prijs: die van het plafond, of die van de ronde min de korting.',
        'Hoe lager het plafond tegenover de waardering van de ronde, hoe groter zijn deel.',
        'Afspraak die hier geldt: de prijs van de ronde wordt bepaald op de aandelen die al bestaan, vóór de conversie.',
      ],
      limits: 'Elk contract heeft eigen rekenregels (basis vóór of na de ronde, werknemerspool, rente…). Alleen de ondertekende tekst telt: laat hem nalezen door een professional.',
      tip: 'Lees het plafond en de korting goed: die bepalen het deel, niet alleen het bedrag.',
    },
    cascade: {
      name: 'Waterval',
      question: 'Wie krijgt wat op de dag van de verkoop?',
      lead: 'Wordt het bedrijf verkocht, dan komen investeerders vaak eerst. De tool toont de verdeling volgens de verkoopprijs.',
      fields: {
        exit: ['Verkoopprijs van het bedrijf', '€'],
        invested: ['Bedrag dat de investeerders inbrachten', '€'],
        stake: ['Deel van de investeerders', '% van het bedrijf'],
        multiple: ['Liquidatiepreferentie', 'keer de inleg', '1: ze krijgen eerst hun inleg terug. 0: geen preferentie.'],
      },
      read: [
        'De investeerders nemen het grootste van twee bedragen: hun inleg (maal de preferentie), of hun deel van de verkoopprijs.',
        'Onder de drempelprijs nemen ze de preferentie: de andere aandeelhouders krijgen minder dan hun deel van het bedrijf.',
        'Boven de drempelprijs wordt iedereen betaald volgens zijn deel.',
      ],
      limits: 'Een eenvoudig geval: één klasse investeerders, een "niet-participerende" preferentie, geen schulden of verkoopkosten. De echte verdeling volgt de overeenkomst en de statuten, ronde na ronde.',
      tip: 'Het percentage van het bedrijf zegt niet alles. Vraag altijd in welke volgorde het geld wordt uitbetaald.',
    },
    note: {
      name: 'Rapport',
      question: 'Welk cijfer geef ik deze start-up?',
      lead: 'Vijf criteria, met een cijfer van 0 tot 10. De tool berekent een score op 100 en toont het zwakste punt.',
      fields: {
        team: ['Team', 'op 10', 'Complementair, voltijds, in staat om te verkopen en te bouwen.'],
        market: ['Markt', 'op 10', 'Groot genoeg, en groeiend.'],
        traction: ['Tractie', 'op 10', 'Klanten, omzet, bewezen groei.'],
        product: ['Product', 'op 10', 'Het werkt, en het is moeilijk te kopiëren.'],
        terms: ['Voorwaarden', 'op 10', 'Redelijke waardering en rechten.'],
      },
      read: [
        'Elk criterium weegt anders: team 30, markt 25, tractie 20, product 15, voorwaarden 10.',
        'De score dient om meerdere dossiers met dezelfde criteria te vergelijken, niet om in jouw plaats te beslissen.',
        'Kijk vooral naar het zwakste punt: een heel slecht cijfer op één criterium maak je elders niet goed.',
      ],
      limits: 'De gewichten zijn een voorbeeld, aan te passen aan jouw manier van investeren. Een score vervangt de controles niet, en ook de gesprekken met de oprichters en hun klanten niet.',
      tip: 'Geef het dossier een cijfer vóór de vergadering, en daarna opnieuw. Stijgt het sterk, vraag je dan af of het de feiten zijn of de charme.',
    },
    diligence: {
      name: 'Vergrootglas',
      question: 'Heb ik het belangrijkste gecontroleerd voor ik investeer?',
      lead: 'Twaalf vragen om je te stellen voor je tekent. Vink de vragen af waarop je een stevig antwoord hebt.',
      limits: 'Een lijst vragen vervangt het oordeel van een advocaat of een accountant over de documenten niet.',
      tip: 'Wat niet geschreven en bewezen is, bestaat niet. Vraag de documenten op.',
    },
    composes: {
      name: 'Sneeuwbal',
      question: 'Wat worden mijn stortingen met samengestelde rente?',
      lead: 'De winst van één jaar levert het jaar daarna zelf winst op. Na verloop van tijd wordt het effect zichtbaar.',
      fields: {
        initial: ['Startkapitaal', '€'],
        monthly: ['Storting', '€ per maand'],
        rate: ['Rendement', '% per jaar'],
        years: ['Duur', 'jaar'],
      },
      read: [
        'In het geel wat je gestort hebt. In het groen wat de rente heeft toegevoegd.',
        'Hoe langer de duur, hoe sneller het groene deel groeit: dat is het sneeuwbaleffect.',
      ],
      limits: 'Het rendement wordt constant verondersteld. In het echt schommelt het van jaar tot jaar en kan het negatief zijn; kosten, belastingen en inflatie zijn niet meegeteld.',
      tip: 'De tijd doet een groot deel van het werk: hoe vroeger je begint, hoe langer elke storting kan groeien.',
    },
    cible: {
      name: 'In de roos',
      question: 'Hoeveel moet ik elke maand storten om mijn doel te halen?',
      lead: 'Een bedrag om te bereiken, een duur, een rendement: de tool geeft de maandelijkse storting die nodig is.',
      fields: {
        target: ['Te bereiken bedrag', '€'],
        years: ['Duur', 'jaar'],
        rate: ['Rendement', '% per jaar', '0 voor een rekening die niets opbrengt.'],
        initial: ['Al opzijgezet', '€'],
      },
      read: [
        'Hoe meer tijd je hebt, hoe groter het deel van de weg dat de rente voor je aflegt.',
        'Zonder rendement is de storting gewoon het ontbrekende bedrag gedeeld door het aantal maanden.',
      ],
      limits: 'Het rendement wordt constant verondersteld; kosten, belastingen en inflatie zijn niet meegeteld. Over tien jaar koop je met het beoogde bedrag minder dan vandaag.',
      tip: 'Plan de overschrijving op de dag dat je betaald wordt. Wat vanzelf vertrekt, vraagt geen wilskracht meer.',
    },
    frais: {
      name: 'Knabbelaar',
      question: 'Wat kosten de kosten mij op lange termijn?',
      lead: 'Dezelfde belegging, met twee niveaus van jaarlijkse kosten: de tool toont het verschil aan het einde.',
      fields: {
        initial: ['Startkapitaal', '€'],
        monthly: ['Storting', '€ per maand'],
        rate: ['Rendement vóór kosten', '% per jaar'],
        feeA: ['Kosten van belegging A', '% per jaar'],
        feeB: ['Kosten van belegging B', '% per jaar'],
        years: ['Duur', 'jaar'],
      },
      read: [
        'De jaarlijkse kosten gaan van het rendement af, elk jaar.',
        'Het verschil groeit met de tijd: geld dat naar kosten ging, brengt geen rente meer op.',
      ],
      limits: 'Rendement constant verondersteld; instap- en uitstapkosten, belastingen en inflatie niet meegeteld. De echte kosten van een product staan in het essentiële-informatiedocument.',
      tip: 'Een of twee procentpunten kosten lijken weinig over één jaar. Over dertig jaar is het een groot deel van het resultaat.',
    },
    inflation: {
      name: 'Lekke ballon',
      question: 'Wat is mijn geld over twintig jaar waard?',
      lead: 'Als de prijzen stijgen, koop je met hetzelfde bedrag minder. De tool toont wat het echt waard zal zijn, met of zonder rendement.',
      fields: {
        amount: ['Bedrag vandaag', '€'],
        inflation: ['Prijsstijging', '% per jaar'],
        years: ['Duur', 'jaar'],
        rate: ['Rendement van de belegging', '% per jaar', '0 als het geld slaapt op een rekening die niets opbrengt.'],
      },
      read: [
        'Reële waarde = getoond bedrag ÷ opgestapelde prijsstijging.',
        'Reëel rendement = het rendement van de belegging, min de prijsstijging.',
        'Een rendement gelijk aan de prijsstijging behoudt je koopkracht, zonder ze te verhogen.',
      ],
      limits: 'De prijsstijging verandert van jaar tot jaar: niemand kent die van de komende twintig jaar.',
      tip: 'Een rekening die niets opbrengt, verliest elk jaar waarde, zonder dat het cijfer op het scherm verandert.',
    },
    reserve: {
      name: 'Reservoir',
      question: 'Hoe lang kan mijn spaargeld mij een inkomen uitkeren?',
      lead: 'Een kapitaal, een opname elke maand, een rendement: de tool telt de jaren tot het kapitaal op is.',
      fields: {
        capital: ['Kapitaal', '€'],
        monthly: ['Opname', '€ per maand'],
        rate: ['Rendement', '% per jaar'],
      },
      read: [
        'Elke maand verdient het kapitaal zijn rendement, daarna neem je jouw bedrag op.',
        'Is de opname kleiner dan wat het kapitaal opbrengt, dan raakt het nooit op.',
      ],
      limits: 'Het rendement wordt constant verondersteld. In het echt schommelt het, en een slecht jaar in het begin maakt het kapitaal sneller leeg. Belastingen, kosten en inflatie zijn niet meegeteld.',
      tip: 'Over twintig jaar € 500 per maand opnemen betaalt niet wat € 500 vandaag betaalt: denk aan de stijgende prijzen.',
    },
    coussin: {
      name: 'Buffer',
      question: 'Heb ik genoeg noodspaargeld?',
      lead: 'Noodspaargeld is geld waarmee je meerdere maanden zonder inkomen doorkomt. De tool geeft het bedrag om naar te streven, en de tijd om er te komen.',
      fields: {
        expenses: ['Je uitgaven', '€ per maand', 'Huur, boodschappen, vervoer, abonnementen: wat elke maand vertrekt.'],
        months: ['Te dekken maanden', 'maanden', 'Vaak 3 tot 6 maanden. Meer als je inkomen onregelmatig is.'],
        saved: ['Al opzijgezet', '€'],
        monthly: ['Wat je kunt sparen', '€ per maand'],
      },
      read: [
        'Bedrag om naar te streven = uitgaven per maand × te dekken maanden.',
        'Dit spaargeld moet meteen beschikbaar blijven, zonder risico op verlies: het is geen belegging.',
      ],
      limits: 'Het juiste aantal maanden hangt af van je situatie: hoe stabiel je inkomen is, wie van je afhangt, je woning. Het is een richtlijn, geen regel.',
      tip: 'Bouw deze buffer op voor je iets belegt: hij zorgt ervoor dat je niet op het slechtste moment moet verkopen.',
    },
    avant: {
      name: 'Schild',
      question: 'Ben ik klaar om mijn geld te beleggen?',
      lead: 'Tien punten om te controleren voor je geld belegt. Vink af wat geregeld is.',
      limits: 'Een lijst om na te denken, geen persoonlijk advies: je situatie, je belastingen en je plannen tellen mee. Vraag bij twijfel raad aan een erkende adviseur.',
      tip: 'Hoog rendement, zonder risico en dringend: die drie samen wijzen op oplichting.',
    },
  },

  checklists: {
    deck: [
      ['Het probleem', 'Wie last heeft van wat, en wat het hem vandaag kost.'],
      ['De oplossing', 'Wat je doet, in één zin die een kind van 12 begrijpt.'],
      ['Het product', 'Een demo, schermafbeeldingen: tonen is beter dan beschrijven.'],
      ['De markt', 'Hoeveel mogelijke klanten, en welke eerst.'],
      ['Het verdienmodel', 'Wie betaalt, hoeveel, en hoe vaak.'],
      ['De tractie', 'Klanten, omzet, groei: alleen ware, controleerbare cijfers.'],
      ['De concurrentie', 'De andere oplossingen, en waarom een klant voor jou zou kiezen.'],
      ['Het team', 'Waarom jullie de juiste mensen zijn voor dit project.'],
      ['De ronde', 'Het bedrag, wat het financiert, en tot waar het jullie brengt.'],
      ['Het vervolg', 'De volgende doelen, met datum, en hoe je te bereiken bent.'],
    ],
    lancement: [
      ['Een statuut gekozen', 'Eenmanszaak of vennootschap: je weet welke, en wat het verandert voor je bijdragen.'],
      ['Een geregistreerde activiteit', 'Je hebt je ondernemingsnummer en je weet waar het moet staan.'],
      ['De btw geregeld', 'Je weet of je ze moet aanrekenen of vrijgesteld bent, en je schrijft het op je facturen.'],
      ['Een aparte rekening', 'Het geld van je activiteit en je privégeld lopen niet door elkaar.'],
      ['Correcte facturen', 'Verplichte vermeldingen, nummering, en elektronisch verzenden waar het verplicht is.'],
      ['Een geteste prijs', 'Je tarief dekt je kosten, je dagen zonder facturen en je inkomen. Een klant heeft het al aanvaard.'],
      ['Een offerte of contract', 'Wat je doet, tegen wanneer, voor hoeveel, en wanneer je betaald wordt: op papier, voor je begint.'],
      ['De verzekeringen', 'Je weet welke verplicht zijn in je vak, en welke nuttig zijn.'],
      ['Een reserve voor belastingen', 'Je zet elke maand opzij wat je aan bijdragen en belastingen zult moeten betalen.'],
      ['Drie maanden reserve', 'Genoeg om van te leven als een klant laat betaalt of een maand leeg is.'],
    ],
    diligence: [
      ['Het team', 'Wie zijn de oprichters, wat doen ze voltijds, kennen ze elkaar al lang?'],
      ['Het probleem', 'Bevestigen klanten dat het echt en vervelend is?'],
      ['Het product', 'Heb ik het zelf zien werken?'],
      ['De klanten', 'Kan ik met twee of drie klanten praten?'],
      ['De cijfers', 'Zijn omzet en groei bewezen met documenten?'],
      ['De markt', 'Is hij groot genoeg voor de verhoopte exit?'],
      ['De concurrentie', 'Wie lost dit probleem nog op, en met welke middelen?'],
      ['Het verdienmodel', 'Brengt een klant meer op dan hij kost?'],
      ['Het kapitaal', 'Wie bezit vandaag wat, en wat is er al beloofd?'],
      ['Het juridische', 'Merk, code, contracten: is alles echt van het bedrijf?'],
      ['Het gebruik van het geld', 'Wat financiert de ronde, en voor hoeveel maanden?'],
      ['De voorwaarden', 'Waardering, rechten en documenten: nagelezen door een professional?'],
    ],
    avant: [
      ['Noodspaargeld', 'Genoeg voor meerdere maanden uitgaven, meteen beschikbaar, voor je de rest belegt.'],
      ['Geen dure schuld', 'Een lening met een hoge rente kost vaak meer dan een belegging opbrengt.'],
      ['Een horizon', 'Je weet over hoeveel jaar je dit geld nodig hebt.'],
      ['Je begrijpt het product', 'Je kunt in twee zinnen uitleggen waar het rendement vandaan komt, en wat het kan doen dalen.'],
      ['Je kent de kosten', 'Instapkosten, jaarlijkse kosten, uitstapkosten: je hebt ze gelezen in het essentiële-informatiedocument.'],
      ['Het risico staat op papier', 'Je weet hoeveel je kunt verliezen, en je kunt dat dragen.'],
      ['De verkoper is erkend', 'Je hebt zijn naam nagekeken bij de toezichthouder van je land: de FSMA in België, de AMF in Frankrijk.'],
      ['Geen wonderbelofte', 'Niemand heeft je een hoog, gegarandeerd rendement beloofd dat je nu meteen moet grijpen.'],
      ['Meerdere mandjes', 'Je geld hangt niet af van één bedrijf, één sector of één land.'],
      ['De belastingen', 'Je weet hoe de winst in je land belast wordt.'],
    ],
  },

  /* Het traject: zes niveaus, in de volgorde van contenu.js. */
  levels: [
    { name: 'Het idee', goal: 'Nagaan of het probleem bestaat.',
      todo: ['Met mogelijke klanten praten voor je bouwt', 'Het probleem in één zin schrijven', 'Kijken hoe mensen het vandaag oplossen'],
      investor: 'In deze fase investeert bijna niemand: er zijn alleen jij en je idee.',
      tip: 'Vraag niet "zou je het kopen?". Vraag "hoe doe je het vandaag?".' },
    { name: 'De MVP', goal: 'De kleinste versie bouwen die nuttig is.',
      todo: ['Eén functie overhouden: de functie die het probleem oplost', 'Ze in handen geven van echte gebruikers', 'Noteren wat ze doen, niet alleen wat ze zeggen'],
      investor: 'Familie, vrienden en de eerste supporters kijken vooral naar de oprichters.',
      tip: 'Schaam je je niet een beetje voor je eerste versie, dan heb je ze te laat uitgebracht.' },
    { name: 'De eerste klanten', goal: 'Iemand laten betalen.',
      todo: ['Een prijs bepalen en testen', 'Meten wat een klant kost en wat hij opbrengt', 'Schriftelijke feedback vragen'],
      investor: 'Een eerste omzet, hoe klein ook, bewijst dat het probleem geld waard is.',
      tip: 'Een "dat is geweldig" is niets waard. Een betaling wel.' },
    { name: 'Pre-seed', goal: 'De stap van prototype naar product financieren.',
      todo: ['Het pitchdeck voorbereiden', 'Berekenen hoeveel je ophaalt en voor hoeveel maanden', 'Business angels ontmoeten'],
      investor: 'Business angels kijken naar het team, de markt en de eerste tekenen van tractie.',
      tip: 'Ik zeg nee tegen de meeste dossiers. Het is niets persoonlijks: vraag me waarom, en kom terug met bewijs.' },
    { name: 'Seed', goal: 'Bewijzen dat het product zijn markt vindt.',
      todo: ['Regelmatige groei tonen', 'De eerste sleutelmensen aanwerven', 'Je cijfers elke maand opvolgen'],
      investor: 'Seedfondsen willen klanten zien die blijven en een acquisitiekost die onder controle is.',
      tip: 'Groei vreet kasgeld. Hou beide tegelijk in het oog.' },
    { name: 'Serie A', goal: 'Opschalen wat al werkt.',
      todo: ['De verkoop voorspelbaar herhalen', 'Het team structureren', 'Een stevige boekhouding voorbereiden'],
      investor: 'Durfkapitaalfondsen kijken naar de groei, de marges en de grootte van de markt.',
      tip: 'Op dit niveau financier je geen idee meer maar een machine. Toon dat ze zonder jou draait.' },
  ],

  stages: ['Idee', 'MVP', 'Eerste klanten', 'Pre-seed', 'Seed', 'Serie A'],

  /* De woordenlijst. Letters: e = ondernemer, d = zelfstandige, i = investeerder, s = spaarder. Zelfde volgorde als lang/fr.js. */
  glossary: [
    ['Seedronde', 'ei', 'De eerste echte financieringsronde, om van een product dat bij enkele klanten werkt naar regelmatige groei te gaan.'],
    ['ARR', 'ei', 'Jaarlijks terugkerende omzet: de MRR maal 12.'],
    ['Winst', 'ed', 'Wat er van de omzet overblijft nadat alle kosten betaald zijn.'],
    ['Bootstrapping', 'e', 'Je bedrijf laten groeien zonder investeerders, met eigen inkomsten.'],
    ['BSA-AIR', 'ei', 'In Frankrijk een snelle investeringsovereenkomst: de investeerder betaalt nu en krijgt zijn aandelen bij de volgende ronde, vaak met korting. In België en Nederland gebruikt men eerder een converteerbare lening.'],
    ['Burn rate', 'e', 'Het geld dat het bedrijf elke maand uitgeeft. De netto burn trekt de inkomsten ervan af.'],
    ['Business angel', 'ei', 'Iemand die eigen geld investeert in jonge bedrijven, vaak heel vroeg.'],
    ['CAC', 'ed', 'Kost om een klant te werven: wat je gemiddeld uitgeeft om één klant te winnen.'],
    ['Durfkapitaal (VC)', 'ei', 'Fondsen die geld van anderen investeren in jonge, riskante bedrijven, en mikken op enkele heel grote successen.'],
    ['Vaste kosten', 'ed', 'Wat je elke maand betaalt, ook als je niets verkoopt: huur, abonnementen, lonen.'],
    ['Omzet', 'ed', 'Alles wat je in een periode factureert, voor de kosten eraf gaan.'],
    ['Churn (klantverloop)', 'e', 'Het deel van de klanten dat in een periode vertrekt, vaak per maand.'],
    ['Cliff', 'ei', 'Bij vesting de periode in het begin waarin nog niets verworven is.'],
    ['Closing', 'ei', 'Het moment waarop de documenten getekend zijn en het geld gestort wordt.'],
    ['Dataroom', 'ei', 'De gedeelde ruimte waar het bedrijf de documenten bewaart die investeerders willen nakijken.'],
    ['Korting (discount)', 'ei', 'Een vermindering op de prijs van de aandelen, voor wie eerder investeerde.'],
    ['Offerte', 'd', 'Het document dat het werk en de prijs beschrijft voor je begint. Eenmaal ondertekend bindt het beide partijen.'],
    ['Verwatering', 'ei', 'De daling van jouw deel van het bedrijf wanneer er nieuwe aandelen komen voor nieuwe investeerders.'],
    ['Spreiding', 'is', 'Je geld over meerdere beleggingen verdelen om niet van één af te hangen.'],
    ['Due diligence', 'i', 'De controles voor je investeert: cijfers, contracten, kapitaal, juridische zaken.'],
    ['Noodspaargeld', 's', 'Een reserve die meteen beschikbaar is, voor het onverwachte, voor je de rest belegt.'],
    ['ETF', 's', 'Een fonds dat op de beurs verhandeld wordt en een index volgt, vaak met lage kosten.'],
    ['E-factuur', 'd', 'Een factuur in een formaat dat software kan lezen, verstuurd via een netwerk dat daarvoor dient, zoals Peppol.'],
    ['Lopende kosten', 's', 'Wat er elk jaar van een belegging af gaat, in % van het belegde bedrag.'],
    ['Excl. / incl. btw', 'd', 'Exclusief btw: de prijs zonder de belasting. Inclusief btw: de prijs die de eindklant betaalt.'],
    ['Inflatie', 's', 'De algemene stijging van de prijzen: met hetzelfde bedrag koop je minder dan vroeger.'],
    ['Samengestelde rente', 's', 'De winst van één jaar levert in de volgende jaren zelf winst op.'],
    ['Lead investor', 'ei', 'De investeerder die de ronde leidt: hij onderhandelt de voorwaarden en de anderen volgen.'],
    ['Lean canvas', 'e', 'Eén pagina met negen vakken om een project te beschrijven: probleem, klanten, oplossing, inkomsten, kosten…'],
    ['Machtswet', 'i', 'In een portefeuille van jonge bedrijven maken enkele grote successen het grootste deel van het resultaat.'],
    ['Love money', 'e', 'Het geld dat familie en vrienden helemaal in het begin inbrengen.'],
    ['LTV', 'e', 'Klantwaarde: wat een klant gemiddeld opbrengt zolang hij blijft.'],
    ['Brutomarge', 'ed', 'Wat er van de omzet overblijft na de directe kost van het product of de dienst.'],
    ['MRR', 'ei', 'Maandelijks terugkerende omzet: wat de abonnementen elke maand opbrengen.'],
    ['Veelvoud (multiple)', 'i', 'Wat je terugkrijgt gedeeld door wat je investeerde. Een veelvoud van 3: drie keer je inleg.'],
    ['MVP', 'e', 'Minimum viable product: de kleinste versie die al nuttig is voor een echte gebruiker.'],
    ['Aandeelhoudersovereenkomst', 'ei', 'Het contract dat de regels tussen aandeelhouders vastlegt: beslissingen, exit, vertrek van een oprichter.'],
    ['Gemiddeld winkelmandje', 'd', 'Het gemiddelde bedrag van een aankoop.'],
    ['Pitchdeck', 'e', 'De presentatie van een tiental slides die het project aan een investeerder vertelt.'],
    ['Waarderingsplafond (cap)', 'ei', 'Bij een SAFE of converteerbare lening de maximale waardering om het deel van de investeerder te berekenen.'],
    ['Post-money', 'ei', 'De waardering net na de ronde: pre-money + opgehaald bedrag.'],
    ['Pre-money', 'ei', 'De waardering van het bedrijf net vóór het geld van de nieuwe investeerders.'],
    ['Liquidatiepreferentie', 'ei', 'Het recht van een investeerder om vóór de anderen terugbetaald te worden als het bedrijf verkocht wordt.'],
    ['Pro rata', 'i', 'Het recht van een investeerder om bij de volgende ronde geld bij te leggen en zo zijn deel te houden.'],
    ['Product-market fit', 'e', 'Het moment waarop het product zo goed aan een behoefte voldoet dat klanten vanzelf komen en blijven.'],
    ['Toezichthouder', 'is', 'De instantie die verkopers van financiële producten controleert: de FSMA in België, de AMF in Frankrijk.'],
    ['Reëel rendement', 's', 'Het rendement van een belegging na aftrek van de inflatie.'],
    ['Runway', 'e', 'Het aantal maanden dat je het met je kasgeld volhoudt in het huidige tempo.'],
    ['SAFE', 'ei', 'Het Amerikaanse contract waarop de BSA-AIR geïnspireerd is: nu geld, aandelen bij de volgende ronde.'],
    ['Serie A', 'ei', 'De ronde na de seedronde, om een model op te schalen dat al werkt.'],
    ['Break-evenpunt', 'ed', 'Het verkoopniveau vanaf wanneer je geen geld meer verliest.'],
    ['Captable', 'ei', 'De tabel die zegt wie hoeveel van het bedrijf bezit.'],
    ['TAM, SAM, SOM', 'e', 'De totale markt, het deel dat je kunt bedienen, en het deel waar je echt op mikt.'],
    ['Dagtarief', 'd', 'De prijs van één werkdag van een zelfstandige, exclusief btw.'],
    ['Conversieratio', 'ed', 'Het deel van de bezoekers dat doet wat je van hen verwacht: inschrijven, kopen.'],
    ['Opslag (markup)', 'd', 'De marge tegenover de kost. Niet te verwarren met de marge tegenover de verkoopprijs.'],
    ['Term sheet', 'ei', 'De brief die de voorwaarden van een investeerder samenvat, vóór de definitieve contracten.'],
    ['Ticket', 'i', 'Het bedrag dat een investeerder in een bedrijf steekt.'],
    ['Tractie', 'ei', 'De bewijzen dat het werkt: klanten, omzet, groei, gebruik.'],
    ['Kasgeld', 'ed', 'Het geld dat vandaag echt beschikbaar is op de rekeningen van het bedrijf.'],
    ['IRR', 'i', 'Intern rendement: het rendement per jaar van een investering, rekening houdend met de duur.'],
    ['Btw', 'd', 'Belasting bovenop de verkoopprijs, die het bedrijf int voor de staat en daarna afdraagt.'],
    ['Waardering', 'ei', 'De prijs waarop het hele bedrijf geschat wordt bij een kapitaalronde.'],
    ['Vesting', 'ei', 'Je aandelen geleidelijk verwerven: een oprichter of werknemer die vroeg vertrekt, houdt er maar een deel van.'],
  ],

  arsenal: {
    access: { free: 'Gratis aanbod', limited: 'Gratis, beperkt', trial: 'Gratis proefperiode', paid: 'Betalend', fee: 'Zonder abonnement', open: 'Open source', public: 'Overheidsdienst' },
    places: { BE: 'België', FR: 'Frankrijk', BXL: 'Brussel', WAL: 'Wallonië', VLA: 'Vlaanderen' },
    /* Een schap: naam, behoefte, beschrijvingen van de tools (in de volgorde van arsenal.js), tip van de gids. */
    cats: {
      construire: { name: 'Een app bouwen zonder code', need: 'Jij beschrijft wat je wilt, een AI bouwt de applicatie.',
        tools: [
          'Bouwt een volledige webapplicatie op basis van een beschrijving: pagina\'s, database, accounts.',
          'Maakt een site, een app of een prototype vanuit één zin, rechtstreeks in de browser.',
          'Maakt een volledige app vanuit een beschrijving, met database, accounts en betalingen inbegrepen. Eigendom van Wix.',
          'Een AI-agent bouwt, host en publiceert je app, zonder iets te installeren.',
        ],
        note: 'Handig voor een eerste prototype om aan klanten te tonen. Voor een product dat groeit, heb je vroeg of laat iemand nodig die de code leest.' },
      design: { name: 'Design en beelden', need: 'Een logo, beelden, het ontwerp van een app.',
        tools: [
          'Beelden, presentaties en documenten op basis van sjablonen, met AI-tools.',
          'Ontwerpen en prototypes van apps en sites, met meerdere mensen tegelijk.',
          'Beelden, korte video\'s en pdf\'s op basis van sjablonen.',
        ],
        note: 'Een eenvoudig, leesbaar beeld is beter dan een druk beeld. Hou het bij twee kleuren en één lettertype.' },
      boutique: { name: 'Website en webshop', need: 'Een site om je voor te stellen, of een winkel om te verkopen.',
        tools: [
          'Sitebouwer met slepen en neerzetten, met hosting. Online verkopen vraagt een betalend aanbod.',
          'Kant-en-klare webshop: catalogus, winkelmandje, betaling, voorraad.',
          'Vrije software voor een site en zijn winkel. De software is gratis, de hosting niet.',
          'Verzorgde sites op basis van sjablonen, met online verkoop in de betalende formules.',
        ],
        note: 'Verkoop één keer met de hand voor je een webshop bouwt: een betaallink volstaat om te testen.' },
      ia: { name: 'AI-assistenten', need: 'Schrijven, samenvatten, zoeken, een document analyseren, een pitch voorbereiden.',
        tools: [
          'De assistent van OpenAI: schrijven, opzoeken, analyseren, beelden.',
          'De assistent van Anthropic: schrijven, documenten analyseren, code.',
          'De assistent van Google, gekoppeld aan zijn diensten.',
          'De assistent van het Franse bedrijf Mistral AI. Hij heette tot 2026 Le Chat.',
        ],
        note: 'Een AI kan zich met veel zelfvertrouwen vergissen: controleer de cijfers, wetten en namen die je krijgt. Plak er geen vertrouwelijke gegevens in zonder de instellingen te lezen.' },
      organiser: { name: 'Je organiseren', need: 'Notities, taken, teamgesprekken.',
        tools: [
          'Notities, documenten, databases en taken op één plek.',
          'Taken op borden en kaartjes, die je van kolom naar kolom schuift.',
          'Teamchat georganiseerd in kanalen.',
          'E-mail op je eigen domeinnaam, documenten, opslag en videogesprekken.',
        ],
        note: 'Eén tool die goed bijgehouden wordt, is beter dan vijf half ingevulde. Kies er een en blijf erbij.' },
      crm: { name: 'Je klanten opvolgen', need: 'Weten met wie je sprak, hoever elke verkoop staat, wie je opnieuw moet contacteren.',
        tools: [
          'Contacten, lopende verkopen en taken, met marketingtools eromheen.',
          'Een klantenbestand op jouw manier, gevuld vanuit je e-mails en je agenda.',
          'Een licht klantenbestand, gericht op relaties.',
          'Verkoopopvolging in kolommen, stap voor stap.',
        ],
        note: 'Helemaal in het begin volstaat een eenvoudige tabel. Stap over op een tool als je opvolgingen begint te vergeten.' },
      emails: { name: 'E-mails en nieuwsbrief', need: 'Regelmatig schrijven naar je klanten en naar wie jou volgt.',
        tools: [
          'E-mails, sms en automatische verzendingen. Frans bedrijf, vroeger Sendinblue.',
          'Nieuwsbrief, formulieren en inschrijfpagina\'s voor makers. Heette vroeger ConvertKit.',
          'Een nieuwsbrief maken, versturen en betalend maken, met een ingebouwde site.',
          'E-mails en automatische verzendingen. Het gratis aanbod is erg beperkt.',
        ],
        note: 'Schrijf alleen naar mensen die ermee instemden je berichten te krijgen, en laat altijd een link om uit te schrijven. In Europa beschermt de wet particulieren tegen ongevraagde berichten.' },
      automatiser: { name: 'Automatiseren', need: 'Je tools met elkaar verbinden zodat je niets meer met de hand overtypt.',
        tools: [
          'Verbindt applicaties: "als dit gebeurt, doe dat". Het eenvoudigst om mee te beginnen.',
          'Scenario\'s in meerdere stappen, getekend op het scherm.',
          'Automatiseringen voor technische profielen. Gratis als je het zelf host; de onlineversie is betalend na een proefperiode.',
        ],
        note: 'Doe de taak tien keer met de hand voor je ze automatiseert: dan weet je precies wat er nodig is.' },
      sondages: { name: 'Je klanten bevragen', need: 'Een formulier of een enquête om een idee te toetsen.',
        tools: [
          'Formulieren die je schrijft als een document.',
          'Eenvoudige formulieren en enquêtes, waarvan de antwoorden in een rekenblad komen.',
          'Formulieren die één vraag tegelijk stellen. Het gratis aanbod is erg beperkt.',
        ],
        note: 'Een enquête zegt wat mensen beweren. Wil je weten wat ze echt doen, praat dan met hen en stel voor om te kopen.' },
      mesurer: { name: 'Meten', need: 'Hoeveel bezoekers, waar ze vandaan komen, waar ze afhaken.',
        tools: [
          'De bezoekersmeting van Google voor sites en apps.',
          'Wat gebruikers in je product doen: paden, trechters, sessie-opnames.',
          'Lichte bezoekersmeting, zonder cookies, gehost in Europa.',
          'Vrije bezoekersmeting, gratis als je ze zelf host.',
        ],
        note: 'Bezoekers meten raakt aan hun privacy: afhankelijk van de tool heb je hun toestemming nodig (cookiebanner).' },
      presenter: { name: 'Presentaties en pitchdeck', need: 'De slides om een klant of een investeerder te overtuigen.',
        tools: [
          'Maakt een presentatie, een document of een kleine site op basis van een tekst.',
          'Presentaties die je samen maakt, bedoeld voor teams.',
          'Presentaties op basis van sjablonen, in dezelfde tool als je beelden.',
        ],
        note: 'De tool maakt het verhaal niet. Schrijf eerst je tien zinnen, één per slide, en open pas dan de tool.' },
      banque: { name: 'Zakelijke rekening', need: 'Een aparte rekening voor het geld van je activiteit.',
        tools: [
          'Online zakelijke rekening met kaarten, overschrijvingen en facturatietools.',
          'Online zakelijke rekening voor zelfstandigen en kleine bedrijven, met facturatie.',
          'Zakelijke rekening in meerdere munten, met kaarten.',
          'Een rekening om geld te versturen en te ontvangen in meerdere munten. Nuttig met klanten buiten de eurozone.',
        ],
        note: 'Klassieke banken hebben ook zakelijke rekeningen. Vergelijk de kosten, en ga na of de rekening bij je statuut past.' },
      compta: { name: 'Facturen en boekhouding', need: 'Correcte facturen maken en je boekhouding bijhouden.',
        tools: [
          'Facturen, boekhouding en aangiftes voor zelfstandigen, met verzending via Peppol.',
          'Verstuurde en ontvangen facturen, met toegang tot het Peppol-netwerk.',
          'Facturen, boekhouding en opvolging van je kasgeld, samen met je boekhouder (site in het Frans).',
          'Boekhouding, facturen en aangiftes voor zelfstandigen (site in het Frans).',
        ],
        note: 'De e-factuur wordt de regel. In België gaan facturen tussen btw-plichtige bedrijven sinds 1 januari 2026 via het Peppol-netwerk. In Frankrijk moet elk bedrijf ze sinds 1 september 2026 kunnen ontvangen; kleine bedrijven moeten ze vanaf 1 september 2027 ook versturen. Bekijk je situatie met je boekhouder.' },
      paiements: { name: 'Betalingen ontvangen', need: 'Online of met de kaart betaald worden.',
        tools: [
          'Online betalingen met kaart en met lokale methodes zoals Bancontact.',
          'Betalingen online en in de winkel. Europees bedrijf.',
          'Kleine kaartlezer en betaallinks voor handelaars en zelfstandigen.',
          'Handelaarsrekening om online betalingen te ontvangen.',
        ],
        note: '"Zonder abonnement" betekent niet gratis: er gaat een commissie af van elke betaling. Reken ze mee in je prijs.' },
      captable: { name: 'Captable', need: 'Weten wie wat bezit, en een ronde simuleren.',
        tools: [
          'Captable en participatieplannen voor werknemers. Zwitsers bedrijf, gericht op Europa.',
          'Captable en beheer van effecten. Amerikaans bedrijf; het gratis aanbod is bedoeld voor heel jonge bedrijven.',
          'Captable, wettelijke registers en werknemersparticipatie. Frans bedrijf.',
        ],
        note: 'Met twee of drie vennoten en geen ronde volstaat een goed bijgehouden rekenblad. De tool wordt nuttig zodra er investeerders of aandelen voor werknemers zijn.' },
      dossier: { name: 'Je dossier delen', need: 'Je deck en je documenten versturen, en weten of ze gelezen worden.',
        tools: [
          'Documenten delen met leesstatistieken per pagina. Open source.',
          'Documenten veilig delen met leesopvolging. Eigendom van Dropbox.',
          'Een gedeelde map, met lees- of bewerkrechten. Zonder leesstatistieken.',
        ],
        note: 'Stuur een link in plaats van een bijlage: je kunt het document achteraf verbeteren, en de toegang afsluiten.' },
      donnees: { name: 'Gegevens over start-ups', need: 'Wie haalde hoeveel op, bij wie, in welke sector.',
        tools: [
          'Database over bedrijven, investeerders en kapitaalrondes.',
          'Database over start-ups en hun financiering, sterk in Europa.',
          'De database van professionals in durfkapitaal. Met abonnement.',
        ],
        note: 'Deze databases zijn onvolledig voor kleine rondes. Vergelijk altijd met het officiële register en met de oprichters.' },
      verifier: { name: 'Een bedrijf nakijken', need: 'Bestaat het echt? Wie leidt het? Wat zegt de jaarrekening?',
        tools: [
          'Het officiële register van Belgische ondernemingen (KBO): nummer, adres, activiteiten, bestuurders.',
          'De jaarrekeningen die Belgische bedrijven neerlegden, bij de Nationale Bank van België (Balanscentrale).',
          'De openbare zoekmachine voor Franse bedrijven (in het Frans).',
          'De openbare gegevens van Franse bedrijven, verzameld door een privédienst (in het Frans).',
        ],
        note: 'Voor je tekent met een klant, een leverancier of een bedrijf waarin je investeert: twee minuten opzoeken voorkomt nare verrassingen.' },
      arnaques: { name: 'Oplichting herkennen', need: 'Nagaan of een verkoper van beleggingen erkend is.',
        tools: [
          'De tool van de Belgische toezichthouder: is de verkoper erkend? Is er een waarschuwing over hem?',
          'De lijsten van de Franse toezichthouder met niet-erkende bedrijven en sites (in het Frans).',
          'Een dienst van de AMF om een speler na te kijken, een aanbod te testen en fraude te melden (in het Frans).',
          'De waarschuwingen van toezichthouders uit de hele wereld, op één portaal (in het Engels).',
        ],
        note: 'Een naam die niet op een zwarte lijst staat, bewijst niets: oplichters veranderen voortdurend van naam. Ga na of de verkoper echt erkend is.' },
      marches: { name: 'De markten volgen', need: 'Een belegging begrijpen en je portefeuille opvolgen.',
        tools: [
          'Een zoekmachine voor ETF\'s, met gidsen om ze te begrijpen.',
          'Vrije software om te installeren, die het echte rendement van je portefeuille berekent.',
          'Grafieken, koersen en meldingen over de markten.',
          'Online opvolging van je portefeuille (in het Engels).',
        ],
        note: 'Deze tools informeren, ze adviseren niet. Er staat hier bewust geen enkele broker of verkoper van beleggingen.' },
      aides: { name: 'Overheidssteun', need: 'Overheidsinstanties die informeren en begeleiden.',
        tools: [
          'Het Brussels agentschap voor ondernemerschap. Zijn informatiedienst hub.info verving de site 1819; het nummer 1819 blijft werken.',
          'Het informatiepunt voor Waalse ondernemers, verbonden aan Wallonie Entreprendre (in het Frans).',
          'Het Vlaams Agentschap Innoveren en Ondernemen.',
          'Het federale portaal met de stappen om in België een bedrijf te starten of te laten groeien.',
          'Gidsen, sjablonen en tools om een bedrijf te starten of over te nemen (in het Frans).',
          'De officiële site om de oprichting, wijziging of stopzetting van een bedrijf in Frankrijk aan te geven (in het Frans).',
        ],
        note: 'Deze instanties bestaan om je vragen te beantwoorden. Begin bij hen voor je een privédienst betaalt.' },
    },
  },

  /* De resultaten van de machines. v = wat je invulde, r = de berekening, F = de formaten. */
  res: {
    runway: {
      invalid: 'Controleer je cijfers: kasgeld, uitgaven en inkomsten kunnen niet negatief zijn.',
      label: (r) => (r.months === 1 ? 'maand overleven' : 'maanden overleven'),
      verdict(v, r, F) {
        // Inkomsten die vandaag de uitgaven dekken maar dalen: dat is geen break-evenpunt.
        const shrinking = r.breakEven === 1 && v.growth < 0;
        if (shrinking) {
          return r.months == null ? `Je inkomsten dekken je uitgaven vandaag, maar ze dalen. Het kasgeld houdt het toch langer dan ${r.horizon} maanden vol.`
            : `Je inkomsten dekken je uitgaven vandaag, maar ze dalen: het kasgeld zakt onder nul tijdens de ${F.ord(r.months + 1)} maand.`;
        }
        if (r.months == null && r.breakEven) return r.breakEven === 1 ? 'Je inkomsten dekken je uitgaven al: het kasgeld daalt niet.'
          : `Je inkomsten halen je uitgaven in tijdens de ${F.ord(r.breakEven)} maand: het kasgeld zakt nooit onder nul.`;
        if (r.months == null) return `Je houdt het in dit tempo langer dan ${r.horizon} maanden vol.`;
        let t = r.months === 0 ? 'In dit tempo zakt het kasgeld al in de eerste maand onder nul.'
          : `In dit tempo zakt het kasgeld onder nul tijdens de ${F.ord(r.months + 1)} maand.`;
        if (r.breakEven) t += ` Je inkomsten zouden je uitgaven pas dekken in de ${F.ord(r.breakEven)} maand: te laat, tenzij je geld ophaalt of minder uitgeeft.`;
        return t;
      },
      hearts: (n) => `${n} ${n === 1 ? 'hartje' : 'hartjes'} van de 12`,
      heartsNote: 'Eén hartje per maand, hoogstens twaalf.',
      facts: (v, r, F) => [
        ['Je verliest elke maand, vandaag', r.netBurn > 0 ? F.money(r.netBurn) : 'niets'],
        ['Inkomsten dekken de uitgaven', r.breakEven === 1 ? (v.growth < 0 ? 'vandaag, maar dalend' : 'vandaag al') : r.breakEven ? `in de ${F.ord(r.breakEven)} maand` : `niet binnen ${r.horizon} maanden`],
      ],
      chart: 'Je kasgeld, maand na maand',
      tick: (n) => 'M' + n,
      bar: (p, F) => `Maand ${p.month}: ${F.money(p.cash)}`,
      legend: ['Positief kasgeld', 'Onder nul'],
      table: ['Maand', 'Inkomsten', 'Kasgeld'],
      row: (p, F) => [p.month === 0 ? 'Vandaag' : 'Maand ' + p.month, p.month === 0 ? '' : F.money(p.revenue), F.money(p.cash)],
    },
    lever: {
      invalid: 'Controleer je cijfers: je hebt minstens één maand nodig om te financieren, en bedragen die niet negatief zijn.',
      none: 'Niets',
      noneLabel: 'op te halen om vol te houden',
      noneVerdict: 'Je inkomsten dekken je uitgaven al. Een ronde zou niet dienen om vol te houden, maar om sneller te gaan: zeg precies waarvoor.',
      label: (v) => `op te halen om ${v.months} ${mnd(v.months)} vol te houden`,
      verdict: (v, r, F) => `Je verliest ${F.money(r.netBurn)} per maand: ${F.money(r.base)} over ${v.months} ${mnd(v.months)}`
        + (v.buffer > 0 ? `, plus ${F.pct(v.buffer, 0)} veiligheidsmarge.` : '.')
        + (r.investors != null ? ` Bij een waardering van ${F.money(v.pre)} sta je ${F.pct(r.investors)} van het bedrijf af.` : ''),
      rows: ['Behoefte zonder marge', 'Veiligheidsmarge'],
      facts: (v, r, F) => [
        ['Verlies per maand', F.money(r.netBurn)],
        r.post != null ? ['Waardering na de ronde', F.money(r.post)] : null,
        ['Deel voor de investeerders', r.investors != null ? F.pct(r.investors) : 'vul een waardering in'],
      ],
    },
    dilution: {
      invalid: 'Met deze cijfers blijft er niets meer te verdelen: de ronde en de pool nemen 100% van het bedrijf of meer. Controleer de waardering.',
      label: 'voor de oprichters na de ronde',
      verdict: (v, r, F) => `De oprichters gaan van ${F.pct(v.founders)} naar ${F.pct(r.founders)}: ze staan ${F.nf(r.lost, 1)} procentpunt af. Het bedrijf is na de ronde ${F.money(r.post)} waard.`,
      parts: ['Oprichters', 'Andere aandeelhouders die er al waren', 'Werknemerspool', 'Nieuwe investeerders'],
      facts: (v, r, F) => [
        ['Waardering vóór de ronde', F.money(v.pre)],
        ['Waardering na de ronde', F.money(r.post)],
        ['Deel van de nieuwe investeerders', F.pct(r.investors)],
      ],
    },
    vesting: {
      invalid: 'Controleer je cijfers: een deel tussen 0 en 100%, een duur van minstens één jaar, en een cliff die korter is dan de duur.',
      label: 'van het bedrijf al verworven',
      verdict(v, r, F) {
        if (r.toCliff > 0) return `De cliff is nog niet voorbij: er is nog niets verworven. Nog ${r.toCliff} ${mnd(r.toCliff)} tot de eerste aandelen verworven zijn.`;
        if (r.left === 0) return `Alles is verworven: de ${F.pct(v.stake, 2)} zijn van jou.`;
        return `${F.pct(r.ratio)} van je toekenning is verworven. Vertrek je vandaag, dan hou je ${F.pct(r.vested, 2)} van het bedrijf en laat je ${F.pct(r.unvested, 2)} achter.`;
      },
      parts: ['Al verworven', 'Nog niet verworven'],
      facts: (v, r, F) => [
        ['Verworven', F.pct(r.vested, 2)],
        ['Nog niet verworven', F.pct(r.unvested, 2)],
        ['Maanden tot het einde', r.left === 0 ? 'afgelopen' : String(r.left)],
      ],
    },
    marche: {
      invalid: 'Controleer je cijfers: je hebt minstens één klant en inkomsten per klant nodig, en delen tussen 0 en 100%.',
      label: 'per jaar: de markt waar je op mikt',
      verdict: (v, r, F) => `Van de ${F.nf(v.customers)} mogelijke klanten kun je er ${F.nf(r.samCustomers)} bedienen en mik je op ${F.nf(r.somCustomers)}. Tegen ${F.money(v.price)} per klant per jaar geeft dat ${F.money(r.som)} inkomsten per jaar.`,
      rows: ['Totale markt (TAM)', 'Markt die je kunt bedienen (SAM)', 'Markt waar je op mikt (SOM)'],
      facts: (v, r, F) => [
        ['Klanten die je kunt bedienen', F.nf(r.samCustomers)],
        ['Klanten waar je op mikt', F.nf(r.somCustomers)],
        ['Deel van de totale markt', F.pct(r.tam > 0 ? (r.som / r.tam) * 100 : 0, 2)],
      ],
    },
    client: {
      invalid: 'Controleer je cijfers: je hebt minstens één klant nodig, inkomsten, een marge tussen 1 en 100% en een klantverloop boven nul.',
      free: 'Gratis',
      label: 'wat een klant opbrengt, vergeleken met zijn kost',
      verdict(v, r, F) {
        if (r.ratio == null) return 'Klanten vinden kost je niets: elke klant brengt zijn marge op vanaf de eerste maand.';
        if (r.ratio >= 3) return `Een klant brengt ${F.nf(r.ratio, 1)} keer op wat hij je kost: boven de richtwaarde van 3.`;
        if (r.ratio >= 1) return `Een klant brengt ${F.nf(r.ratio, 1)} keer op wat hij je kost: onder de richtwaarde van 3. Verlaag de acquisitiekost, of hou je klanten langer.`;
        return `Een klant kost je meer dan hij opbrengt (${F.nf(r.ratio, 1)} keer zijn kost): elke nieuwe klant maakt het verlies groter.`;
      },
      rows: ['Kost van een klant (CAC)', 'Waarde van een klant (LTV)'],
      facts: (v, r, F) => [
        ['Een klant blijft gemiddeld', `${F.nf(r.lifetime, 1)} ${mnd(r.lifetime)}`],
        ['Zijn kost is terugverdiend in', r.payback ? `${F.nf(r.payback, 1)} ${mnd(r.payback)}` : 'meteen'],
      ],
    },
    objectif: {
      invalid: 'Controleer je cijfers: beoogde inkomsten en een prijs boven nul, een klantverloop onder 100%, en minstens één maand.',
      label: (r) => (r.perMonth === 1 ? 'nieuwe klant te winnen per maand' : 'nieuwe klanten te winnen per maand'),
      verdict(v, r, F) {
        if (r.perMonth === 0) return `Je hebt al genoeg klanten om over ${v.months} ${mnd(v.months)} ${F.money(v.target)} per maand te halen, zelfs met wie vertrekt.`;
        let t = `Om ${F.money(v.target)} per maand te halen, heb je ${F.nf(r.needed)} ${r.needed === 1 ? 'klant' : 'klanten'} nodig. Over ${v.months} ${mnd(v.months)} vraagt dat ${F.nf(r.perMonth, 1)} nieuwe klanten per maand.`;
        if (r.lost > 0) t += ` Waarvan ${F.nf(r.lost)} in totaal om wie vertrekt te vervangen.`;
        return t;
      },
      rows: ['Klanten vandaag', 'Benodigde klanten', 'Klanten te winnen in totaal'],
      facts: (v, r, F) => [
        ['Inkomsten per maand vandaag', F.money(r.currentRevenue)],
        ['Klanten te winnen in totaal', F.nf(r.total)],
        ['Waarvan om vertrekkers te vervangen', F.nf(Math.max(0, r.lost))],
      ],
    },
    croissance: {
      invalid: 'Controleer je cijfers: twee cijfers boven nul, en minstens één maand.',
      label: 'groei per maand',
      verdict(v, r, F) {
        if (r.monthly === 0) return 'Start en doel zijn gelijk: er is geen groei nodig.';
        if (r.monthly < 0) return `Het doel ligt lager dan de start: een daling van ${F.pct(-r.monthly, 2)} per maand.`;
        return `Om in ${v.months} ${mnd(v.months)} van ${F.nf(v.from)} naar ${F.nf(v.to)} te gaan, moet je elke maand ${F.pct(r.monthly, 2)} groeien: in totaal ${F.nf(r.multiple, 1)} keer zoveel.`;
      },
      facts: (v, r, F) => [
        ['Over een jaar, in hetzelfde tempo', F.pct(r.yearly, 0)],
        ['Tijd om te verdubbelen', r.doubling != null ? `${F.nf(r.doubling, 1)} ${mnd(r.doubling)}` : '—'],
        ['Vermenigvuldigd met', F.nf(r.multiple, 2)],
      ],
    },
    tarif: {
      invalid: 'Controleer je cijfers: je hebt een beoogd inkomen nodig, minstens één gefactureerde dag per maand, minder dan 52 weken zonder facturen en minder dan 100% bijdragen.',
      label: 'per dag, exclusief btw',
      verdict: (v, r, F) => `Om ${F.money(v.net)} per maand over te houden, moet je ${F.money(r.revenue)} per jaar factureren, in ${F.nf(r.billable, 0)} dagen.`,
      chart: 'Waar gaat wat je factureert naartoe',
      rows: ['Wat je overhoudt', 'Bijdragen en belastingen', 'Beroepskosten'],
      facts: (v, r, F) => [
        ['Per uur, bij 8 uur per dag', F.money(r.hourly)],
        ['Gefactureerde dagen per jaar', F.nf(r.billable, 0)],
        ['Te factureren per maand, gemiddeld', F.money(r.revenue / 12)],
      ],
    },
    devis: {
      invalid: 'Controleer je cijfers: je hebt dagen en een tarief boven nul nodig, en percentages tussen 0 en 100.',
      label: (v) => (v.vat > 0 ? 'te betalen door de klant, inclusief btw' : 'te betalen door de klant'),
      verdict: (v, r, F) => `Je offerte: ${F.money(r.ht)} exclusief btw, voor ${F.nf(r.days, 1)} dagen, verrassingen inbegrepen.`
        + (v.deposit > 0 ? ` Een voorschot van ${F.pct(v.deposit, 0)}: ${F.money(r.depositAmount)} voor je begint, daarna ${F.money(r.balance)} aan het einde.` : ''),
      chart: 'Wat er in de offerte zit',
      rows: ['Werk', 'Marge voor verrassingen', 'Kosten', 'Btw'],
      facts: (v, r, F) => [
        ['Totaal exclusief btw', F.money(r.ht)],
        ['Voorschot', F.money(r.depositAmount)],
        ['Saldo aan het einde', F.money(r.balance)],
      ],
    },
    prix: {
      invalid: 'Controleer je cijfers: je hebt een kost boven nul nodig en een marge onder 100% van de prijs.',
      label: (v) => (v.vat > 0 ? 'prijs op het etiket, inclusief btw' : 'verkoopprijs'),
      verdict: (v, r, F) => `Verkocht tegen ${F.money(r.ht)} exclusief btw levert je product je ${F.money(r.marginAmount)} op: ${F.pct(v.margin, 0)} van de prijs, of ${F.pct(r.markup, 0)} van de kost.`,
      chart: 'Wat er in de prijs zit',
      rows: ['Kost', 'Jouw marge', 'Btw, af te dragen'],
      facts: (v, r, F) => [
        ['Prijs exclusief btw', F.money(r.ht)],
        ['Marge in % van de kost', F.pct(r.markup, 0)],
        ['Etiketprijs ÷ kost', F.nf(r.coefficient, 2)],
      ],
    },
    remise: {
      invalid: 'Controleer je cijfers: een prijs en een marge boven nul, en een korting onder 100%.',
      never: 'Verlies',
      neverLabel: 'op elke verkoop',
      neverVerdict: (v, r, F) => `Met ${F.pct(v.discount, 0)} korting verkoop je tegen ${F.money(r.newPrice)} en ${r.after === 0 ? 'verdien je niets meer' : `verlies je ${F.money(-r.after)}`} op elke verkoop: geen enkel volume maakt dat goed.`,
      label: 'meer verkopen om evenveel te verdienen als voordien',
      verdict: (v, r, F) => (v.discount === 0 ? 'Zonder korting verandert er niets. Vul een percentage in om het effect te zien.'
        : `Een korting van ${F.pct(v.discount, 0)} neemt ${F.pct(r.lostShare, 0)} van je marge weg: je verdient ${F.money(r.after)} per verkoop in plaats van ${F.money(r.before)}. Je moet ${F.pct(r.extra, 0)} meer verkopen om evenveel te verdienen.`),
      rows: ['Marge per verkoop, vóór', 'Marge per verkoop, na'],
      facts: (v, r, F) => [
        ['Prijs na korting', F.money(r.newPrice)],
        ['Deel van de marge dat verdwijnt', F.pct(r.lostShare, 0)],
        ['Verkopen om evenveel te verdienen als met 100', r.extra != null ? F.nf(Math.ceil(100 + r.extra)) : '—'],
      ],
    },
    seuil: {
      invalid: 'Controleer je cijfers: je hebt een verkoopprijs boven nul nodig.',
      never: 'Nooit',
      neverLabel: 'geen enkel aantal verkopen volstaat',
      neverVerdict: (v, r, F) => `Elke verkoop kost je ${F.money(-r.margin)}: geen enkel volume maakt dat goed. Verhoog de prijs of verlaag de kost per verkoop.`,
      label: (r) => `${r.units === 1 ? 'verkoop' : 'verkopen'} per maand om break-even te draaien`,
      verdict: (v, r, F) => `Elke verkoop levert je ${F.money(r.margin)} op (${F.pct(r.marginRate)} van de prijs). Je hebt er ${F.nf(r.units)} per maand nodig, dus ${F.money(r.revenue)} omzet, om ${F.money(v.fixed)} vaste kosten te dekken.`,
      facts: (v, r, F) => [
        ['Marge per verkoop', F.money(r.margin)],
        ['Omzet op het break-evenpunt', F.money(r.revenue)],
        ['Verkopen per werkdag, ongeveer', F.nf(r.units / 22, 1)],
      ],
      chart: 'Drie scenario\'s',
      table: ['Verkopen per maand', 'Omzet', 'Resultaat van de maand'],
    },
    tunnel: {
      invalid: 'Controleer je cijfers: percentages gaan van 0 tot 100%, en bedragen kunnen niet negatief zijn.',
      label: (r) => `${r.customers === 1 ? 'klant' : 'klanten'} per maand`,
      verdict: (v, r, F) => `Van de ${F.nf(v.visitors)} bezoekers kopen er ${F.nf(r.customers, 1)}: ${F.pct(r.rate, 2)}. `
        + (v.signup <= v.purchase ? 'De zwakste stap: gegevens achterlaten. Verbeter die eerst.' : 'De zwakste stap: de aankoop. Verbeter die eerst.'),
      rows: ['Bezoekers', 'Contacten', 'Klanten'],
      facts: (v, r, F) => [
        ['Omzet per maand', F.money(r.revenue)],
        ['Kost van een klant', r.costPerCustomer != null ? F.money(r.costPerCustomer) : v.spend > 0 ? 'geen klanten' : 'niets'],
        v.spend > 0 ? ['Voor € 1 uitgegeven ontvang je', F.money(r.perEuro)] : null,
        v.spend > 0 ? ['Omzet min uitgaven', F.money(r.result)] : null,
      ],
    },
    tirelire: {
      invalid: 'Controleer je cijfers: een bedrag boven nul, en percentages tussen 0 en 100.',
      label: 'opzij te zetten van deze factuur',
      verdict: (v, r, F) => `Je klant betaalt je ${F.money(r.ttc)}. Zet ${F.money(r.aside)} opzij: je houdt echt ${F.money(r.yours)} over, dat is ${F.pct(r.yoursShare, 0)} van wat je ontving.`,
      chart: 'Waar gaat het ontvangen geld naartoe',
      rows: ['Wat van jou is', 'Bijdragen en belastingen', 'Btw, af te dragen'],
      facts: (v, r, F) => [
        ['Ontvangen', F.money(r.ttc)],
        ['Opzij te zetten', F.money(r.aside)],
        ['Echt van jou', F.money(r.yours)],
      ],
    },
    ticket: {
      invalid: 'Controleer je cijfers: het geïnvesteerde bedrag kan niet hoger zijn dan de waardering bij instap, en de duur moet minstens één jaar zijn.',
      label: 'je inleg',
      verdict: (v, r, F) => (r.multiple >= 1
        ? `In dit scenario wordt ${F.money(v.ticket)} in ${v.years} jaar ${F.money(r.proceeds)}: ${F.pct(r.irr)} per jaar.`
        : `In dit scenario krijg je ${F.money(r.proceeds)} terug van de ${F.money(v.ticket)} die je investeerde: een verlies van ${F.money(-r.gain)}.`),
      rows: ['Geïnvesteerd', 'Teruggekregen'],
      facts: (v, r, F) => [
        ['Je deel bij instap', F.pct(r.stake, 2)],
        ['Je deel bij exit', F.pct(r.stakeExit, 2)],
        ['Rendement per jaar (IRR)', F.pct(r.irr)],
      ],
    },
    valo: {
      invalid: 'Controleer je cijfers: je hebt een waardering bij exit en een veelvoud boven nul nodig.',
      label: 'maximale waardering na de ronde',
      verdict: (v, r, F) => `Om ${F.nf(v.multiple, 1)} keer je inleg terug te krijgen met een exit van ${F.money(v.exit)} en ${F.pct(v.dilution, 0)} verwatering tot dan, mag het bedrijf na de ronde niet meer dan ${F.money(r.post)} waard zijn.`,
      facts: (v, r, F) => [
        r.pre != null ? ['Dat is, vóór jouw inleg', F.money(r.pre)] : null,
        r.stake != null ? ['Je deel bij instap', F.pct(r.stake, 2)] : ['Je deel', v.ticket > 0 ? 'je bedrag is hoger dan deze waardering' : 'vul een bedrag in om het te zien'],
      ],
    },
    portefeuille: {
      invalid: 'Controleer je cijfers: een geheel aantal bedrijven (hoogstens 500), en twee delen die samen niet meer dan 100% zijn.',
      label: 'je inleg, over het geheel',
      verdict(v, r, F) {
        let t = `Van ${v.count} ${v.count === 1 ? 'bedrijf' : 'bedrijven'}: ${r.fails} zonder opbrengst, ${r.mids} met een kleine opbrengst, ${r.winners} ${r.winners === 1 ? 'groot succes' : 'grote successen'}. Gemiddeld, met deze aannames, zou ${F.money(r.invested)} geïnvesteerd ${F.money(r.proceeds)} teruggeven.`;
        if (r.win > 0 && r.winners === 0) t += ' Met zo weinig bedrijven is het goed mogelijk dat je geen enkel groot succes hebt.';
        return t;
      },
      aria: (r) => `${r.fails} zonder opbrengst, ${r.mids} met een kleine opbrengst, ${r.winners} grote successen`,
      legend: ['Geeft niets terug', 'Geeft een beetje terug', 'Groot succes'],
      facts: (v, r, F) => [
        ['Zonder de grote successen', F.times(r.withoutWinners)],
        ['Deel grote successen', F.pct(r.win, 0)],
        ['Winst of verlies', F.money(r.proceeds - r.invested)],
      ],
    },
    suivre: {
      invalid: 'Controleer je cijfers: een deel tussen 0 en 100%, en een waardering boven nul.',
      label: 'bij te leggen om je deel te houden',
      verdict: (v, r, F) => (v.raise === 0 ? 'Zonder ronde verandert je deel niet.'
        : `Om op ${F.pct(v.stake, 2)} te blijven, moet je ${F.money(r.invest)} inbrengen in deze ronde. Volg je niet, dan zakt je deel naar ${F.pct(r.without, 2)}.`),
      rows: ['Je deel als je volgt', 'Je deel als je niet volgt'],
      facts: (v, r, F) => [
        ['Waardering na de ronde', F.money(r.post)],
        ['Procentpunten verloren zonder te volgen', F.nf(r.lost, 2)],
        ['Waarde van je deel als je volgt', F.money(r.value)],
      ],
    },
    fonte: {
      invalid: 'Controleer je cijfers: een deel tussen 0 en 100%, van 1 tot 12 rondes, en een verwatering onder 100%.',
      label: (v) => `van het bedrijf na ${v.rounds} ${v.rounds === 1 ? 'ronde' : 'rondes'}`,
      verdict: (v, r, F) => `Je deel gaat van ${F.pct(v.stake, 2)} naar ${F.pct(r.final, 2)}: je houdt er ${F.pct(r.kept, 0)} van over.`,
      chart: 'Je deel, ronde na ronde',
      tick: (n) => (n === 0 ? 'Nu' : 'R' + n),
      bar: (p, F) => (p.round === 0 ? `Vandaag: ${F.pct(p.stake, 2)}` : `Na ronde ${p.round}: ${F.pct(p.stake, 2)}`),
      top: (F, max) => F.pct(max, 2),
      facts: (v, r, F) => [
        ['Startdeel', F.pct(v.stake, 2)],
        ['Deel aan het einde', F.pct(r.final, 2)],
        ['Wat er smolt', F.pct(100 - r.kept, 0)],
      ],
    },
    convertible: {
      invalid: 'Controleer je cijfers: je hebt een bedrag nodig, een waardering boven nul en een korting onder 100%.',
      label: 'van het bedrijf voor de houder, na de ronde',
      verdict(v, r, F) {
        if (r.rule === 'cap') return `Het plafond geldt: de houder converteert alsof het bedrijf ${F.money(r.effective)} waard was, in plaats van ${F.money(v.pre)}. Voor hetzelfde bedrag krijgt hij ${F.nf(r.bonus, 2)} keer het deel van een investeerder in de ronde.`;
        if (r.rule === 'discount') return `De korting geldt: de houder converteert tegen een waardering van ${F.money(r.effective)}, in plaats van ${F.money(v.pre)}. Voor hetzelfde bedrag krijgt hij ${F.nf(r.bonus, 2)} keer het deel van een investeerder in de ronde.`;
        return 'Het plafond en de korting gelden hier niet: de houder converteert tegen dezelfde prijs als de investeerders in de ronde.';
      },
      parts: ['Aandeelhouders die er al waren', 'Houder van de SAFE', 'Investeerders in de ronde'],
      facts: (v, r, F) => [
        ['Waardering gebruikt voor de conversie', F.money(r.effective)],
        ['Zijn deel tegen de prijs van de ronde, zonder voordeel', F.pct(r.atRound, 2)],
      ],
    },
    cascade: {
      invalid: 'Controleer je cijfers: het deel van de investeerders gaat van 0 tot 100%, en de preferentie van 0 tot 10 keer de inleg.',
      label: 'voor de oprichters en de andere aandeelhouders',
      verdict(v, r, F) {
        if (v.exit === 0) return 'Tegen deze prijs valt er niets te verdelen.';
        if (r.converts) return `Tegen deze prijs brengt het deel van het bedrijf meer op dan de preferentie: iedereen wordt betaald volgens zijn deel. De investeerders krijgen ${F.money(r.investors)}, de andere aandeelhouders ${F.money(r.others)}.`;
        return `De investeerders nemen hun preferentie: ${F.money(r.investors)}, dat is ${F.pct(r.investorsShare)} van de prijs terwijl ze ${F.pct(v.stake, 1)} van het bedrijf hebben. Er blijft ${F.money(r.others)} over voor de andere aandeelhouders.`;
      },
      rows: ['Investeerders', 'Andere aandeelhouders'],
      facts: (v, r, F) => [
        ['Drempelprijs', r.threshold > 0 ? F.money(r.threshold) : 'geen'],
        ['Deel van de prijs voor de investeerders', F.pct(r.investorsShare)],
        ['Hun deel van het bedrijf', F.pct(v.stake, 1)],
      ],
    },
    note: {
      invalid: 'Controleer je cijfers: elk cijfer gaat van 0 tot 10.',
      label: 'op 100',
      criteria: { team: 'Team', market: 'Markt', traction: 'Tractie', product: 'Product', terms: 'Voorwaarden' },
      verdict(v, r, F) {
        const weak = this.criteria[r.weakest].toLowerCase();
        const level = r.score >= 75 ? 'Een stevig dossier volgens deze criteria.' : r.score >= 50 ? 'Een gemiddeld dossier volgens deze criteria.' : 'Een zwak dossier volgens deze criteria.';
        return `${level} Het zwakste punt: ${weak}. Dat is de eerste vraag om uit te diepen.`;
      },
      points: (p, F) => `${F.nf(p.points, 1)} / ${p.weight}`,
      facts: (v, r, F) => [
        ['Zwakste punt', r.parts.find((p) => p.key === r.weakest).note + ' / 10'],
        ['Behaalde punten', `${F.nf(r.score, 1)} / 100`],
      ],
    },
    composes: {
      invalid: 'Controleer je cijfers: de duur moet een geheel aantal jaren zijn, tussen 1 en 60.',
      label: (v) => `na ${v.years} jaar`,
      verdict: (v, r, F) => (r.gain >= 0
        ? `Bij dit rendement zou je ${F.money(r.paid)} storten en zou de rente ${F.money(r.gain)} toevoegen${r.paid > 0 ? `, dat is ${F.pct((r.gain / r.paid) * 100, 0)} meer` : ''}.`
        : `Je zou ${F.money(r.paid)} storten; met een negatief rendement zou er ${F.money(r.value)} overblijven.`),
      chart: 'Jaar na jaar',
      aria: 'Waarde jaar na jaar',
      bar: (p, F) => `Jaar ${p.year}: ${F.money(p.value)}, waarvan ${F.money(p.paid)} gestort`,
      legend: ['Wat je gestort hebt', 'Wat de rente heeft toegevoegd'],
      table: ['Jaar', 'Gestort', 'Waarde'],
      row: (p, F) => [p.year === 0 ? 'Start' : 'Jaar ' + p.year, F.money(p.paid), F.money(p.value)],
    },
    cible: {
      invalid: 'Controleer je cijfers: een bedrag boven nul, en een gehele duur tussen 1 en 60 jaar.',
      label: 'per maand te storten',
      verdict(v, r, F) {
        if (r.enough) return `Wat je al hebt, volstaat: zonder iets te storten heb je over ${v.years} jaar ${F.money(r.grown)}.`;
        return `Stort je ${v.years} jaar lang ${F.money(r.monthly)} per maand, dan zou je bij dit rendement ${F.money(v.target)} bereiken. Je zou ${F.money(r.paid)} gestort hebben; de rente zou de rest doen: ${F.money(r.interest)}.`;
      },
      rows: ['Wat je stort', 'Wat de rente toevoegt'],
      facts: (v, r, F) => [
        ['In totaal gestort', F.money(r.paid)],
        ['Toegevoegd door de rente', F.money(Math.max(0, r.interest))],
        ['Per jaar', F.money(r.monthly * 12)],
      ],
    },
    frais: {
      invalid: 'Controleer je cijfers: kosten tussen 0 en 20% per jaar, en een gehele duur tussen 1 en 60 jaar.',
      label: (v) => `verschil na ${v.years} jaar`,
      verdict: (v, r, F, x) => (r.gap === 0 ? 'Dezelfde kosten, hetzelfde resultaat. Verander een van de twee om het verschil te zien.'
        : `Met ${F.pct(x.lowFee, 2)} kosten per jaar zou je eindigen met ${F.money(x.low)}. Met ${F.pct(x.highFee, 2)}: ${F.money(x.high)}, dus ${F.money(r.gap)} minder, op ${F.money(r.paid)} inleg.`),
      chart: 'Jaar na jaar',
      aria: 'Waarde van de twee beleggingen, jaar na jaar',
      bar: (p, F) => `Jaar ${p.year}: A ${F.money(p.a)}, B ${F.money(p.b)}`,
      legend: (x) => [`Belegging ${x.highName}, de duurste`, `Wat belegging ${x.lowName} extra overlaat`],
      facts: (v, r, F) => [
        ['Zonder enige kosten', F.money(r.free)],
        ['Kost van de kosten van belegging A', F.money(r.costA)],
        ['Kost van de kosten van belegging B', F.money(r.costB)],
      ],
      table: ['Jaar', 'Belegging A', 'Belegging B'],
      row: (p, F) => [p.year === 0 ? 'Start' : 'Jaar ' + p.year, F.money(p.a), F.money(p.b)],
    },
    inflation: {
      invalid: 'Controleer je cijfers: een bedrag boven nul, en een gehele duur tussen 1 en 60 jaar.',
      label: (v) => `koopkracht over ${v.years} jaar`,
      verdict(v, r, F) {
        return v.rate === 0
          ? `Over ${v.years} jaar staat er nog altijd ${F.money(r.nominal)} voor je ${F.money(v.amount)}, maar koop je er alleen nog mee wat ${F.money(r.real)} vandaag koopt${r.lost > 0 ? `: ${F.pct(r.lost)} minder koopkracht` : ''}.`
          : `Over ${v.years} jaar toont je belegging ${F.money(r.nominal)}. Na aftrek van de prijsstijging is dat ${F.money(r.real)} in geld van vandaag: een reëel rendement van ${F.pct(r.realRate, 2)} per jaar.`;
      },
      chart: 'Wat het bedrag echt waard is, jaar na jaar',
      bar: (p, F) => `Jaar ${p.year}: ${F.money(p.real)} in geld van vandaag`,
      facts: (v, r, F) => [
        ['Getoond bedrag aan het einde', F.money(r.nominal)],
        ['Reëel rendement per jaar', F.pct(r.realRate, 2)],
        ['Koopkracht', r.lost > 0 ? `${F.pct(r.lost)} minder` : `${F.pct(-r.lost)} meer`],
      ],
      table: ['Jaar', 'Getoond bedrag', 'Waarde in geld van vandaag'],
      row: (p, F) => [p.year === 0 ? 'Vandaag' : 'Jaar ' + p.year, F.money(p.nominal), F.money(p.real)],
    },
    reserve: {
      invalid: 'Controleer je cijfers: een kapitaal en een opname boven nul.',
      forever: 'Eindeloos',
      foreverLabel: 'het kapitaal raakt niet op',
      label: () => 'jaar tot het kapitaal op is',
      verdict(v, r, F) {
        if (r.forever) return `Je neemt ${F.money(v.monthly)} per maand op, en het kapitaal brengt ongeveer ${F.money(r.sustainable)} per maand op: het zou niet opraken bij dit rendement.`;
        return `Neem je ${F.money(v.monthly)} per maand op, dan zou het kapitaal na ${F.nf(r.years, 1)} jaar op zijn. Je zou in totaal ${F.money(r.total)} opgenomen hebben, voor ${F.money(v.capital)} bij de start.`;
      },
      chart: 'Het kapitaal, jaar na jaar',
      bar: (p, F) => `Jaar ${p.year}: ${F.money(p.value)}`,
      facts: (v, r, F) => [
        ['Wat het kapitaal per maand opbrengt, bij de start', F.money(r.sustainable)],
        ['In totaal opgenomen', r.total != null ? F.money(r.total) : '—'],
        ['Maanden met een opname', r.months != null ? F.nf(r.months) : '—'],
      ],
    },
    coussin: {
      invalid: 'Controleer je cijfers: uitgaven boven nul, en 1 tot 60 maanden om te dekken.',
      label: 'om opzij te hebben',
      verdict(v, r, F) {
        if (r.missing === 0) return `Je buffer is compleet: je kunt het ${F.nf(r.covered, 1)} ${mnd(r.covered)} volhouden.`;
        let t = `Je kunt het ${F.nf(r.covered, 1)} ${mnd(r.covered)} volhouden. Je komt ${F.money(r.missing)} tekort.`;
        t += r.wait != null ? ` Zet je ${F.money(v.monthly)} per maand opzij, dan ben je er over ${r.wait} ${mnd(r.wait)}.` : ' Vul in wat je elke maand kunt sparen om te zien wanneer je er bent.';
        return t;
      },
      aria: (r, F) => `${F.pct(r.progress, 0)} van het doel`,
      facts: (v, r, F) => [
        ['Al gedekt', `${F.nf(r.covered, 1)} ${mnd(r.covered)}`],
        ['Ontbreekt nog', F.money(r.missing)],
        ['Maanden tot je er bent', r.wait === 0 ? 'bereikt' : r.wait != null ? String(r.wait) : '—'],
      ],
    },
  },
};
