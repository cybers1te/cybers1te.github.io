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
    description: 'marketbuss: gratis arcademachines om te ondernemen, te investeren, te sparen, een woning te kopen, online te verkopen en je budget te beheren, en de echte tools van het moment. Zonder account.',
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
    steps: 'De berekening, stap voor stap',
    stepsSub: 'Met jouw cijfers, afgerond.',
    levers: 'Wat het resultaat doet bewegen',
    leversSub: 'Elke knop verandert één cijfer met één stap en toont het resultaat dat het zou geven. De gele balk toont welke het zwaarst wegen.',
    leverTry: (label, step, result) => `${label} ${step}: het resultaat zou ${result} worden`,
    slider: (label) => `${label} (schuifregelaar)`,
    highest: (v) => `Hoogste: ${v}`,
    newTab: '(nieuw tabblad)',
    nTools: (n) => `${n} machine${n === 1 ? '' : 's'}`,
    nItems: (n) => `${n} tool${n === 1 ? '' : 's'}`,
    nWords: (n) => `${n} ${n === 1 ? 'woord' : 'woorden'}`,
    fineprint: 'Deze tools dienen om te begrijpen en te oefenen. Het is geen financieel, juridisch of fiscaal advies.',

    home: {
      insert: 'Gratis tools, zonder account',
      recent: 'Je laatste machines',
      recentSub: 'Ga verder waar je was. Ze blijven in deze browser.',
      stats: { tools: 'machines', players: 'spelers', arsenal: 'echte tools', words: 'uitgelegde woorden' },
      tagline: 'De speelhal voor ondernemers en investeerders.',
      lead: 'Een project doorrekenen, een prijs bepalen, een kapitaalronde voorbereiden, een belegging beoordelen, een woning kopen, online verkopen, je budget bijhouden: machines die rekenen en de berekening tonen, en de echte tools van het moment.',
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
      allSub: (n) => `${n} machines, voor zeven spelers.`,
      search: 'Zoek een machine: lening, btw, voorraad, schuld…',
      noMatch: 'Geen enkele machine past. Probeer een ander woord.',
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
          `${n.tools} machines om een project door te rekenen, een prijs te bepalen, een investering te beoordelen, een belegging te begrijpen, een woning te kopen of te huren, online te verkopen of je budget te beheren. Elke machine toont haar berekening, stap voor stap.`,
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
          'De spelers en de gidsen (Mira, Noé, Sam, Max, Lou, Ada, Iris, Bit, Zoé, Kai) zijn verzonnen personages. Hun tips zijn algemene richtlijnen.',
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
    immobilier: { name: 'Vastgoed', pitch: 'Ik koop of huur een woning', about: 'Tools voor een hypotheek, een aankoop, een huur of een woning om te verhuren.' },
    ecommerce: { name: 'Webwinkelier', pitch: 'Ik verkoop online', about: 'Tools om te zien wat je bestellingen, advertenties en leveringen echt opbrengen.' },
    budget: { name: 'Budget', pitch: 'Ik beheer mijn geld van elke dag', about: 'Tools om te zien waar je geld naartoe gaat, een schuld af te lossen en een aankoop te becijferen.' },
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
    agent: { name: 'Zoé', job: 'de vastgoedmakelaar', line: 'Bezoekt drie keer, meet alles op en leest de rekeningen van de mede-eigendom van begin tot eind.' },
    shopkeeper: { name: 'Kai', job: 'de webwinkelier', line: 'Telt elk pakje, elke retour en elke euro advertentie voor hij een verkoop viert.' },
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
    credit: {
      name: 'Sleutel op zak',
      question: 'Hoeveel kost mijn woonkrediet?',
      lead: 'Het bedrag, de rentevoet, de looptijd: de tool geeft de maandlast, de totale kost en wat je elk jaar afbetaalt.',
      fields: {
        amount: ['Geleend bedrag', '€'],
        rate: ['Rentevoet', '% per jaar', 'De nominale rentevoet, zonder verzekering.'],
        years: ['Looptijd', 'jaar'],
        insurance: ['Schuldsaldoverzekering', '% per jaar', 'In % van het geleende bedrag. Vaak tussen 0,1 en 0,5%.'],
      },
      read: [
        'De maandlast blijft van begin tot eind dezelfde. Wat verandert, is wat ze betaalt: in het begin vooral rente.',
        'De totale kost is de rente plus de verzekering: wat je betaalt bovenop het geleende bedrag.',
        'Een langere looptijd verlaagt de maandlast maar verhoogt de totale kost: probeer de knoppen "jaar".',
      ],
      limits: 'Vaste rente, zonder dossier- of waarborgkosten, en verzekering berekend op het beginbedrag. Het aanbod van je bank telt: kijk naar het JKP.',
      tip: 'Vergelijk aanbiedingen op het JKP, niet alleen op de rentevoet: het telt ook de verzekering en de kosten mee.',
    },
    capacite: {
      name: 'Leenmeter',
      question: 'Hoeveel kan ik lenen?',
      lead: 'Je inkomen, je lopende kredieten en het deel dat je eraan wilt besteden: de tool berekent de mogelijke maandlast en hoeveel je kunt lenen.',
      fields: {
        income: ['Netto-inkomen van het gezin', '€ per maand'],
        debts: ['Lopende kredieten', '€ per maand'],
        ratio: ['Maximaal deel voor kredieten', '% van het inkomen', 'Een gangbaar richtpunt: 35%.'],
        rate: ['Rentevoet, verzekering inbegrepen', '% per jaar'],
        years: ['Looptijd', 'jaar'],
      },
      read: [
        'De mogelijke maandlast is het deel van je inkomen voor kredieten, min de kredieten die je al hebt.',
        'Het bedrag hangt sterk af van de looptijd en de rente: vijf jaar langer kan tienduizenden euro\'s extra opleveren.',
        'Houd genoeg over om van te leven: dat de bank ja zegt, maakt het nog niet verstandig.',
      ],
      limits: 'Een grootteorde. Elke bank kijkt ook naar je eigen inbreng, je werksituatie, wat je overhoudt om van te leven en haar eigen regels.',
      tip: 'Kom naar de bank met nette rekeninguittreksels en spaargeld dat na de aankoop overblijft: dat maakt vaak het verschil.',
    },
    rendement: {
      name: 'Huurrendement',
      question: 'Hoeveel brengt deze verhuurde woning echt op?',
      lead: 'De prijs, de kosten, de huur en de uitgaven: de tool berekent het brutorendement, dat van de advertenties, en het nettorendement, dat telt.',
      fields: {
        price: ['Aankoopprijs', '€'],
        costs: ['Aankoopkosten en werken', '€', 'Notaris of registratierechten, makelaar, werken voor de verhuur.'],
        rent: ['Huur, zonder lasten', '€ per maand'],
        charges: ['Uitgaven voor jou', '€ per jaar', 'Onroerende voorheffing, niet-verhaalbare lasten, verzekering, onderhoud.'],
        vacancy: ['Maanden zonder huurder', 'maanden per jaar'],
      },
      read: [
        'Brutorendement = huur van een jaar ÷ prijs. Het is het cijfer uit de advertenties, maar het vergeet de kosten en de uitgaven.',
        'Nettorendement = (ontvangen huur − uitgaven) ÷ (prijs + kosten). Dat cijfer vergelijk je met een belegging.',
        'Het cijfer is voor belastingen en zonder lening: voor de lening gebruik je de kast "Cashflow".',
      ],
      limits: 'Voor belastingen, zonder lening en zonder doorverkoop. Huur, uitgaven en leegstand veranderen van jaar tot jaar.',
      tip: 'Een heel hoog brutorendement verbergt vaak een moeilijke buurt of grote werken. Ga het bekijken, twee keer.',
    },
    cashflow: {
      name: 'Cashflow',
      question: 'Brengt deze verhuurde woning elke maand op of kost ze me geld?',
      lead: 'De huur aan de ene kant; de lening, de uitgaven en een reserve voor werken aan de andere: de tool geeft wat er elke maand overblijft.',
      fields: {
        rent: ['Huur', '€ per maand'],
        vacancy: ['Deel van het jaar zonder huurder', '%', 'Ongeveer 5% = iets meer dan twee weken per jaar.'],
        charges: ['Uitgaven voor jou', '€ per maand', 'Onroerende voorheffing, mede-eigendom, verzekering, beheer, per maand.'],
        loan: ['Maandlast van de lening', '€ per maand', 'De kast "Sleutel op zak" berekent ze.'],
        works: ['Reserve voor werken', '% van de huur'],
      },
      read: [
        'Positief: de woning betaalt haar lening en laat je iets over. Negatief: je legt elke maand bij uit eigen zak.',
        'Een licht negatieve cashflow kan nog een goede investering zijn, want je lost elke maand kapitaal af. Maar je moet het lang kunnen betalen.',
        'De reserve voor werken voorkomt vervelende verrassingen: verwarmingsketel, dak, opfrissen tussen twee huurders.',
      ],
      limits: 'Voor belastingen. De huur kan dalen en een huurder kan stoppen met betalen: houd spaargeld achter de hand.',
      tip: 'Test een 10% lagere huur en twee maanden zonder huurder: blijft het cijfer draaglijk, dan is het project stevig.',
    },
    louer: {
      name: 'Huren of kopen',
      question: 'Is het beter om mijn woning te huren of te kopen?',
      lead: 'Twee levens naast elkaar: het ene koopt, het andere huurt en belegt het verschil. De tool vergelijkt hun vermogen, jaar na jaar.',
      fields: {
        price: ['Prijs van de woning', '€'],
        buyCosts: ['Aankoopkosten', '% van de prijs', 'Notaris of registratierechten, waarborg, dossier.'],
        deposit: ['Eigen inbreng', '€'],
        rate: ['Rentevoet van de lening', '% per jaar'],
        years: ['Looptijd van de lening', 'jaar'],
        rent: ['Huur voor een vergelijkbare woning', '€ per maand'],
        growth: ['Stijging van prijzen en huren', '% per jaar'],
        invest: ['Rendement van belegd geld', '% per jaar', 'Wat de eigen inbreng zou opbrengen als ze belegd werd in plaats van in de woning te gaan.'],
        horizon: ['Vergelijken na', 'jaar'],
      },
      read: [
        'Elke kolom is het verschil in vermogen tussen de koper en de huurder. Oranje: kopen staat voor. Cyaan: huren staat voor.',
        'De huurder belegt de eigen inbreng, en daarna elke maand wat hij minder uitgeeft dan de koper. Kost huren meer, dan belegt de koper het verschil.',
        'Hoe langer je blijft, hoe groter de kans dat kopen wint: de aankoopkosten betaal je maar één keer.',
      ],
      limits: 'De eigenaar betaalt ook 1% van de prijs per jaar (belasting, onderhoud). Geen belastingen, geen verkoopkosten, en prijzen die regelmatig stijgen: de werkelijkheid is grilliger.',
      tip: 'De echte vraag is vaak: hoe lang blijf je? Onder de vijf jaar wint huren vaak.',
    },
    visite: {
      name: 'Bezoek',
      question: 'Heb ik alles gecontroleerd voor ik koop?',
      lead: 'Tien punten om na te kijken voor je tekent voor een woning. Vink aan wat geregeld is.',
      limits: 'Een lijst om niets te vergeten, geen juridisch advies: de regels verschillen per land. Laat de voorlopige overeenkomst nalezen door een notaris of jurist.',
      tip: 'Bezoek op een weekavond en op een zaterdag: lawaai, parkeren en buren zijn dan niet hetzelfde.',
    },
    pub: {
      name: 'Rendabele advertenties',
      question: 'Brengen mijn advertenties echt geld op?',
      lead: 'Je winkelmandje, je kosten, je advertentiebudget en de bestellingen die het opleverde: de tool berekent de winst, de ROAS en de minimale ROAS om geen geld te verliezen.',
      fields: {
        basket: ['Gemiddeld winkelmandje', '€', 'Zonder btw.'],
        cogs: ['Kost van de producten', '€ per bestelling'],
        shipping: ['Levering voor jouw rekening', '€ per bestelling'],
        fees: ['Betaalkosten', '% van het mandje'],
        spend: ['Advertentiebudget', '€'],
        orders: ['Bestellingen uit de advertenties', 'bestellingen'],
      },
      read: [
        'ROAS = omzet ÷ advertentiebudget. Een ROAS van 3 betekent niet dat je geld verdient: alles hangt af van je marge.',
        'De break-even-ROAS is het minimum om de producten, de levering en de kosten te betalen. Daaronder kost elke bestelling je geld.',
        'De kost per bestelling mag de marge op een bestelling niet overschrijden: dat is de maximale kost per bestelling.',
      ],
      limits: 'Eén bestelling per klant, zonder retouren: een klant die terugkomt is meer waard. Advertentieplatformen tonen vaak optimistische cijfers.',
      tip: 'Bereken je break-even-ROAS voor je een campagne start, en schrap na een week wat eronder blijft.',
    },
    livraison: {
      name: 'Gratis levering',
      question: 'Vanaf welk winkelmandje bied ik gratis levering aan?',
      lead: 'Wat een verzending kost en je marge: de tool geeft het mandje vanaf waar gratis levering zichzelf betaalt.',
      fields: {
        basket: ['Gemiddeld mandje vandaag', '€'],
        margin: ['Marge op de producten', '% van de prijs'],
        shipping: ['Kost van een verzending', '€'],
        orders: ['Bestellingen per maand', 'bestellingen'],
      },
      read: [
        'Gratis levering kost één verzending per bestelling. Om die te betalen, moet het mandje minstens zoveel groter zijn: verzendkost ÷ marge.',
        'Een drempel net boven je gemiddelde mandje zet klanten aan om nog iets toe te voegen.',
        'Is je marge klein, dan is gratis levering heel duur: verhoog liever je prijzen een beetje.',
      ],
      limits: 'Telt niet de extra klanten die gratis levering aantrekt, noch wie zijn mandje laat staan door de verzendkosten.',
      tip: 'Stel een klein artikel voor wanneer de klant net onder de drempel zit: dat neemt hij vaak.',
    },
    stock: {
      name: 'Voorraad',
      question: 'Wanneer moet ik voorraad bijbestellen?',
      lead: 'Je verkoop per dag, de levertijd van de leverancier en je veiligheidsmarge: de tool geeft het bestelpunt en de dagen voorraad die je nog hebt.',
      fields: {
        daily: ['Verkoop per dag', 'stuks'],
        lead: ['Levertijd van de leverancier', 'dagen', 'Tussen je bestelling en de aankomst van de voorraad.'],
        safety: ['Veiligheidsvoorraad', 'dagen', 'Voor vertragingen en verkooppieken.'],
        stock: ['Voorraad vandaag', 'stuks'],
        cost: ['Aankoopprijs per stuk', '€'],
      },
      read: [
        'Bestelpunt = verkoop per dag × (levertijd + veiligheid). Zakt je voorraad eronder, bestel dan.',
        'Zit je voorraad er al onder, dan dreig je zonder te vallen voor de volgende levering.',
        'Te veel voorraad legt geld vast: de waarde ervan wordt getoond zodat je het ziet.',
      ],
      limits: 'Regelmatige verkoop. Voor de solden, de feestdagen of een campagne plan je ruimer.',
      tip: 'Noteer de echte levertijd van elke levering: de beloofde is bijna altijd korter.',
    },
    retours: {
      name: 'Retouren',
      question: 'Hoeveel kosten retouren me?',
      lead: 'Je bestellingen, je retourpercentage en wat een retour kost: de tool geeft de kost per maand en het deel van je marge dat ermee weggaat.',
      fields: {
        orders: ['Bestellingen per maand', 'bestellingen'],
        rate: ['Retourpercentage', '%'],
        basket: ['Gemiddeld terugbetaald mandje', '€'],
        cogs: ['Kost van de producten', '€ per bestelling'],
        back: ['Retourkosten voor jou', '€ per pakje'],
        lost: ['Onverkoopbaar na retour', '%'],
      },
      read: [
        'Een retour kost je de marge op de verkoop, de retourkosten en, als het product beschadigd is, wat het je kostte.',
        'Kleding en schoenen worden vaak teruggestuurd: een nauwkeurige maattabel doet de retouren dalen.',
        'Vergelijk deze kost met wat betere foto\'s, een preciezere productpagina of een maattabel zouden kosten.',
      ],
      limits: 'Telt de tijd voor het verwerken van retouren niet mee, noch de al betaalde heenlevering.',
      tip: 'Vraag bij elke retour naar de reden: een paar redenen verklaren vaak bijna alle retouren.',
    },
    marketplace: {
      name: 'Marktplaats',
      question: 'Verkopen op een marktplaats of in mijn eigen webwinkel?',
      lead: 'Hetzelfde product, twee kanalen: de tool vergelijkt wat je per verkoop overhoudt op een marktplaats en in je eigen webwinkel.',
      fields: {
        price: ['Verkoopprijs', '€', 'Zonder btw.'],
        cogs: ['Kost van het product', '€'],
        commission: ['Commissie van de marktplaats', '%'],
        fixedFee: ['Vaste kosten per verkoop', '€'],
        siteFees: ['Betaalkosten in je webwinkel', '%'],
        siteAds: ['Advertenties per verkoop in je webwinkel', '€', 'Wat je aan advertenties uitgeeft voor één verkoop.'],
      },
      read: [
        'Een marktplaats neemt een commissie maar brengt je klanten. Je webwinkel kost minder per verkoop, maar je moet betalen om klanten te laten komen.',
        'De advertentiedrempel is het bedrag per verkoop waarboven je webwinkel minder opbrengt dan de marktplaats.',
        'Veel verkopers gebruiken beide: de marktplaats om gevonden te worden, de webwinkel voor klanten die terugkomen.',
      ],
      limits: 'Zonder abonnement, opslagkosten of retouren. Commissies verschillen per categorie: kijk de tarieven van het platform na.',
      tip: 'Steek een kaartje in elk pakje dat via de marktplaats verkocht is: de volgende keer kan de klant bij jou bestellen.',
    },
    boutique: {
      name: 'Opening',
      question: 'Is mijn webwinkel klaar om te openen?',
      lead: 'Tien punten om te regelen voor je een webwinkel opent. Vink aan wat gedaan is.',
      limits: 'De regels hangen af van het land waar je verkoopt: controleer de precieze verplichtingen bij een boekhouder of je kamer van koophandel.',
      tip: 'Plaats een echte bestelling in je webwinkel, van de productpagina tot het ontvangen pakje, voor je eerste klant.',
    },
    budget: {
      name: 'Maandbudget',
      question: 'Waar gaat mijn geld elke maand naartoe?',
      lead: 'Je inkomen, je noodzakelijke uitgaven en je wensen: de tool toont wat je overhoudt en vergelijkt het met het richtpunt 50 / 30 / 20.',
      fields: {
        income: ['Netto-inkomen van de maand', '€'],
        needs: ['Noodzakelijke uitgaven', '€', 'Huur, boodschappen, energie, vervoer, verzekeringen, kredieten.'],
        wants: ['Wensen', '€', 'Uitgaan, abonnementen, kleren, reizen…'],
      },
      read: [
        'Het richtpunt 50 / 30 / 20: de helft voor het noodzakelijke, 30% voor wensen, 20% opzij. Een vertrekpunt, geen regel.',
        'Neemt het noodzakelijke meer dan de helft, dan is dat niet per se jouw schuld (een hoge huur bijvoorbeeld): de ruimte zit dan vaak in de wensen.',
        'Wat overblijft, spaar je pas echt als je het aan het begin van de maand opzijzet, niet aan het einde.',
      ],
      limits: 'Een gewone maand. Zeldzame uitgaven (cadeaus, herstellingen, belastingen) tellen ook: deel ze door twaalf.',
      tip: 'Plan een overschrijving naar je spaarrekening op de dag dat je loon binnenkomt: wat je niet ziet, geef je niet uit.',
    },
    dette: {
      name: 'Uit de schulden',
      question: 'Hoe snel los ik mijn schuld af?',
      lead: 'Wat je verschuldigd bent, de rente en je afbetaling: de tool geeft het aantal maanden, de betaalde rente, en wat je bespaart door wat meer te betalen.',
      fields: {
        balance: ['Nog af te lossen', '€'],
        rate: ['Rente op de schuld', '% per jaar', 'Het JKP op je afschrift of contract.'],
        payment: ['Afbetaling per maand', '€'],
        extra: ['Extra per maand, om te vergelijken', '€'],
      },
      read: [
        'In het begin betaalt een groot deel van de afbetaling alleen de rente. Dekt de afbetaling die amper, dan daalt de schuld bijna niet.',
        'Elke maand wat meer betalen verkort zowel de duur als de rente: het cijfer "bespaard" toont het.',
        'Met meerdere schulden los je eerst de duurste af, en betaal je op de andere het minimum.',
      ],
      limits: 'Vaste rente en vaste afbetaling, zonder kosten of boetes. Een kredietopening kan van rente veranderen: kijk je contract na.',
      tip: 'Lukt het niet meer om te betalen, praat dan met je bank of een openbare dienst voor schuldhulp voor de eerste achterstand.',
    },
    heures: {
      name: 'Prijs in uren',
      question: 'Hoeveel uur werk kost deze aankoop?',
      lead: 'De prijs, je inkomen en je uren: de tool zet de aankoop om in uren werk, en toont wat het bedrag zou worden als het belegd werd.',
      fields: {
        price: ['Prijs van de aankoop', '€'],
        income: ['Netto-inkomen', '€ per maand'],
        hours: ['Gewerkte uren', 'per maand', 'Voltijds aan 38 uur per week is ongeveer 165 uur per maand.'],
        years: ['Als het bedrag belegd werd gedurende', 'jaar'],
        rate: ['aan een rendement van', '% per jaar'],
      },
      read: [
        'Je inkomen per uur = netto-inkomen ÷ gewerkte uren. De prijs gedeeld door dat cijfer geeft de uren werk.',
        'Het is niet om je schuldig te voelen, het is om te kiezen: een aankoop die zijn uren waard is, is een goede aankoop.',
        'De belegde waarde toont de verborgen kost van een aankoop: wat het geld had kunnen worden.',
      ],
      limits: 'Netto-inkomen zoals je het invult, en een regelmatig rendement, wat in het echt niet bestaat.',
      tip: 'Wacht voor een aankoop die niet dringend is 48 uur: denk je er dan nog aan, dan is ze echt belangrijk voor je.',
    },
    voiture: {
      name: 'Echte autofactuur',
      question: 'Hoeveel kost mijn auto echt?',
      lead: 'De aankoop, de doorverkoop, de energie en de vaste kosten: de tool geeft de kost per maand en per kilometer.',
      fields: {
        price: ['Aankoopprijs', '€'],
        years: ['Gehouden gedurende', 'jaar'],
        resale: ['Waarde bij doorverkoop', '% van de prijs'],
        km: ['Kilometer per jaar', 'km'],
        use: ['Verbruik', 'L of kWh / 100 km'],
        energy: ['Energieprijs', '€ per L of kWh'],
        fixed: ['Verzekering, onderhoud, parkeren', '€ per jaar'],
      },
      read: [
        'Het waardeverlies bij doorverkoop is vaak de grootste kost, en de minst zichtbare.',
        'De kost per kilometer helpt vergelijken met de trein, de fiets, autodelen of huren.',
        'Voor een elektrische auto vul je het verbruik in kWh in en de prijs per kWh.',
      ],
      limits: 'Zonder lening, onverwachte herstellingen, tol of boetes. Energieprijzen veranderen.',
      tip: 'Vergelijk de kost per maand met het openbaar vervoer plus een paar keer per jaar een huurauto.',
    },
    menage: {
      name: 'Grote schoonmaak',
      question: 'Zijn mijn financiën op orde?',
      lead: 'Tien punten om orde te brengen in je geld. Vink aan wat gedaan is.',
      limits: 'Een algemene lijst, geen persoonlijk advies. Bij moeilijke schulden helpen openbare diensten en verenigingen gratis.',
      tip: 'Doe deze schoonmaak één keer per jaar, altijd in dezelfde maand: vergeten abonnementen komen altijd terug.',
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
    visite: [
      ['Het volledige budget', 'Prijs, aankoopkosten, werken, verhuis: je kent het totaal, en je houdt daarna nog spaargeld over.'],
      ['Een akkoord van de bank', 'Een bank heeft je dossier bekeken en je een mogelijk bedrag gegeven.'],
      ['De keuringen', 'Energie, asbest, lood, elektriciteit, gas: je hebt ze gelezen, niet alleen ontvangen.'],
      ['De echte lasten', 'Lasten van de mede-eigendom, onroerende voorheffing, energie: de bedragen van de laatste jaren.'],
      ['De mede-eigendom', 'Verslagen van de laatste algemene vergaderingen: gestemde of geplande werken, achterstallen.'],
      ['De werken', 'Dak, verwarming, ramen, vocht: een vakman heeft een prijsindicatie gegeven.'],
      ['De buurt, op verschillende uren', 'Lawaai, parkeren, vervoer, winkels: bezocht op een weekdag en in het weekend.'],
      ['De stedenbouwkundige regels', 'Wat er rondom gebouwd mag worden, en wat jij mag veranderen.'],
      ['De prijzen in de buurt', 'Je hebt vergeleken met recente verkopen, niet alleen met advertenties.'],
      ['Een uitweg', 'De voorlopige overeenkomst laat je afhaken als je lening geweigerd wordt.'],
    ],
    boutique: [
      ['Je statuut', 'Je activiteit is aangegeven en je weet hoe de btw op je verkopen van toepassing is.'],
      ['De wettelijke vermeldingen', 'Bedrijfsnaam, adres, ondernemingsnummer, contact: zichtbaar op de site.'],
      ['De verkoopvoorwaarden', 'Prijzen, levering, betaling, garanties, retouren: duidelijk opgeschreven.'],
      ['Het herroepingsrecht', 'In de Europese Unie heeft de klant 14 dagen om van gedachten te veranderen: de stappen zijn uitgelegd.'],
      ['Persoonsgegevens', 'Privacybeleid en cookiebanner in orde met de AVG.'],
      ['De betaling getest', 'Een echte bestelling betaald, terugbetaald, en het geld goed op je rekening.'],
      ['De levering becijferd', 'Tarieven, termijnen en verpakking getest, ook voor een zwaar of ver pakje.'],
      ['Volledige productpagina\'s', "Scherpe foto's, afmetingen, materialen, maattabel: genoeg om retouren te vermijden."],
      ['De klantendienst', 'Een e-mailadres dat gelezen wordt, en een aangekondigde antwoordtermijn.'],
      ['De basiscijfers', 'Marge per product, break-even-ROAS en kost van een retour, berekend voor je advertenties betaalt.'],
    ],
    menage: [
      ['De abonnementen', 'Je hebt alle domiciliëringen van de maand opgelijst en gestopt wat niet meer dient.'],
      ['Een eenvoudig budget', 'Je weet hoeveel er binnenkomt, hoeveel er buitengaat en wat er op het einde van de maand overblijft.'],
      ['Een spaarbuffer', 'Genoeg voor enkele maanden uitgaven, op een aparte rekening.'],
      ['De schulden opgelijst', 'Bedrag, rente en einde van elk krediet: de duurste wordt eerst afgelost.'],
      ['Geen vaste debetstand', 'Je rekening staat niet elke maand in het rood.'],
      ['De verzekeringen nagekeken', 'Geen dubbele (bankkaart, woning, telefoon) en de juiste dekking.'],
      ['Energie en telefoon vergeleken', 'Je contracten zijn dit jaar minstens één keer vergeleken.'],
      ['De tegemoetkomingen', 'Je hebt de steun en kortingen nagekeken waar je recht op hebt.'],
      ['De papieren geordend', 'Contracten, loonfiches, belastingen: in twee minuten terug te vinden.'],
      ['Een automatische overschrijving', 'Er gaat een bedrag naar je spaarrekening op de dag dat je loon binnenkomt.'],
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
    ['Eigen inbreng', 'm', 'Het eigen geld dat je in een vastgoedaankoop steekt, bovenop de lening.'],
    ['Cashflow', 'mi', 'Wat een investering je elke maand oplevert (of kost), als alles betaald is.'],
    ['Schuldratio', 'mb', 'Het deel van je inkomen dat elke maand naar je kredieten gaat.'],
    ['JKP', 'mb', 'Jaarlijks kostenpercentage: de echte kost van een krediet, met kosten en verzekering.'],
    ['Huurrendement', 'm', 'De huur van een jaar in % van de prijs van de woning. Bruto: voor de uitgaven. Netto: erna.'],
    ['Leegstand', 'm', 'De periodes waarin een te huur gestelde woning geen huurder heeft.'],
    ['ROAS', 'c', 'De omzet die één euro advertentie oplevert.'],
    ['CPA', 'c', 'Kost per acquisitie: wat een bestelling of een klant via advertenties kost.'],
    ['Retourpercentage', 'c', 'Het deel van de bestellingen dat klanten terugsturen.'],
    ['Marktplaats', 'c', 'Een site die de producten van andere verkopers verkoopt, tegen een commissie.'],
    ['Bestelpunt', 'c', 'Het voorraadniveau waarop je moet bijbestellen om niet zonder te vallen.'],
    ['50 / 30 / 20', 'b', 'Een budgetrichtpunt: 50% voor het noodzakelijke, 30% voor wensen, 20% om te sparen.'],
    ['Leefgeld', 'bm', 'Wat er elke maand overblijft als de noodzakelijke uitgaven en kredieten betaald zijn.'],
    ['Kredietopening', 'b', 'Een geldreserve om terug te betalen, vaak aan een hoge rente. Voorzichtig mee omgaan.'],
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

  /* De berekening, stap voor stap: [wat berekend wordt, de som met de ingevulde cijfers].
     Zelfde volgorde en zelfde gevallen in de drie talen. */
  steps: {
    runway(v, r, F) {
      const g = r.series[12];
      return [
        ['Wat je elke maand verliest', `${F.money(v.burn)} − ${F.money(v.revenue)} = ${F.money(r.netBurn)}`],
        r.netBurn > 0 ? ['Zonder groei houdt het kasgeld het vol', `${F.money(v.cash)} ÷ ${F.money(r.netBurn)} ≈ ${F.nf(v.cash / r.netBurn, 1)} maanden`] : null,
        v.growth !== 0 && g ? [`Je inkomsten in maand 12, met ${F.pct(v.growth)} per maand`, `${F.money(v.revenue)} × (1 + ${F.pct(v.growth)})^11 = ${F.money(g.revenue)}`] : null,
        r.netBurn > 0 ? ['Concreet kost elke dag je', `${F.money(r.netBurn)} ÷ 30 ≈ ${F.money(r.netBurn / 30)}`] : null,
      ];
    },
    lever(v, r, F) {
      return [
        ['Verlies per maand', `${F.money(v.burn)} − ${F.money(v.revenue)} = ${F.money(r.netBurn)}`],
        ['Behoefte over de periode', `${F.money(Math.max(0, r.netBurn))} × ${v.months} ${mnd(v.months)} = ${F.money(r.base)}`],
        v.buffer > 0 ? ['Met de veiligheidsmarge', `${F.money(r.base)} × (1 + ${F.pct(v.buffer)}) = ${F.money(r.raise)}`] : null,
        r.investors != null ? ['Deel voor de investeerders', `${F.money(r.raise)} ÷ (${F.money(v.pre)} + ${F.money(r.raise)}) = ${F.pct(r.investors)}`] : null,
        r.raise > 0 ? ['Concreet kost elke gefinancierde maand', `${F.money(r.raise)} ÷ ${v.months} = ${F.money(r.raise / v.months)}`] : null,
      ];
    },
    dilution(v, r, F) {
      return [
        ['Waardering na de ronde', `${F.money(v.pre)} + ${F.money(v.raise)} = ${F.money(r.post)}`],
        ['Deel van de nieuwe investeerders', `${F.money(v.raise)} ÷ ${F.money(r.post)} = ${F.pct(r.investors)}`],
        ['Wat de bestaande aandeelhouders houden', `100% − ${F.pct(r.investors)} − ${F.pct(r.pool)} = ${F.pct(100 - r.investors - r.pool)}`],
        ['Deel van de oprichters', `${F.pct(v.founders)} × ${F.pct(100 - r.investors - r.pool)} = ${F.pct(r.founders)}`],
        ['Concreet is hun deel vandaag waard', `${F.pct(r.founders)} × ${F.money(r.post)} = ${F.money((r.founders / 100) * r.post)}`],
      ];
    },
    vesting(v, r, F) {
      const total = v.years * 12;
      return [
        ['Totale duur', `${v.years} jaar × 12 = ${total} maanden`],
        r.toCliff > 0 ? ['De cliff', `${F.nf(v.elapsed)} ${mnd(v.elapsed)} < ${F.nf(v.cliff)} ${mnd(v.cliff)}: er is nog niets verworven`]
          : ['Deel van de verstreken tijd', `${F.nf(Math.min(v.elapsed, total))} ÷ ${total} = ${F.pct(r.ratio)}`],
        ['Verworven aandelen', `${F.pct(v.stake, 2)} × ${F.pct(r.ratio)} = ${F.pct(r.vested, 2)}`],
        ['Concreet krijg je er elke maand bij', `${F.pct(v.stake, 2)} ÷ ${total} = ${F.pct(v.stake / total, 3)}`],
      ];
    },
    marche(v, r, F) {
      return [
        ['Totale markt (TAM)', `${F.nf(v.customers)} × ${F.money(v.price)} = ${F.money(r.tam)}`],
        ['Klanten die je kunt bedienen', `${F.nf(v.customers)} × ${F.pct(v.reachable)} = ${F.nf(r.samCustomers)}`],
        ['Klanten die je mikt', `${F.nf(r.samCustomers)} × ${F.pct(v.share)} = ${F.nf(r.somCustomers)}`],
        ['Beoogde inkomsten (SOM)', `${F.nf(r.somCustomers)} × ${F.money(v.price)} = ${F.money(r.som)}`],
        ['Concreet, per maand', `${F.money(r.som)} ÷ 12 = ${F.money(r.som / 12)}`],
      ];
    },
    client(v, r, F) {
      const monthly = v.arpu * (v.margin / 100);
      return [
        ['Kost van een klant (CAC)', `${F.money(v.spend)} ÷ ${F.nf(v.customers)} = ${F.money(r.cac)}`],
        ['Marge per klant per maand', `${F.money(v.arpu)} × ${F.pct(v.margin)} = ${F.money(monthly)}`],
        ['Een klant blijft gemiddeld', `100% ÷ ${F.pct(v.churn)} = ${F.nf(r.lifetime, 1)} maanden`],
        ['Waarde van een klant (LTV)', `${F.money(monthly)} × ${F.nf(r.lifetime, 1)} = ${F.money(r.ltv)}`],
        r.ratio != null ? ['Verhouding LTV ÷ CAC', `${F.money(r.ltv)} ÷ ${F.money(r.cac)} = ${F.nf(r.ratio, 1)}`] : null,
      ];
    },
    objectif(v, r, F) {
      const still = v.current * (1 - v.churn / 100) ** v.months;
      return [
        ['Nodige klanten', `${F.money(v.target)} ÷ ${F.money(v.price)} = ${F.nf(r.needed)}`],
        v.current > 0 && v.churn > 0 ? [`Je klanten die er over ${v.months} ${mnd(v.months)} nog zijn`, `${F.nf(v.current)} × (1 − ${F.pct(v.churn)})^${v.months} ≈ ${F.nf(still)}`] : null,
        ['Klanten te winnen in totaal', `${F.nf(r.perMonth, 1)} × ${v.months} ${mnd(v.months)} ≈ ${F.nf(r.total)}`],
        r.perMonth > 0 ? ['Concreet, per week', `${F.nf(r.perMonth, 1)} × 12 ÷ 52 ≈ ${F.nf((r.perMonth * 12) / 52, 1)}`] : null,
      ];
    },
    croissance(v, r, F) {
      return [
        ['Beoogde vermenigvuldiging', `${F.nf(v.to)} ÷ ${F.nf(v.from)} = ${F.nf(r.multiple, 2)}`],
        ['Groei per maand', `${F.nf(r.multiple, 2)}^(1/${v.months}) − 1 = ${F.pct(r.monthly, 2)}`],
        ['Over een jaar', `(1 + ${F.pct(r.monthly, 2)})^12 − 1 = ${F.pct(r.yearly, 0)}`],
        r.monthly > 0 ? ['Concreet, volgende maand', `${F.nf(v.from)} × (1 + ${F.pct(r.monthly, 2)}) = ${F.nf(v.from * (1 + r.monthly / 100), 1)}`] : null,
      ];
    },
    tarif(v, r, F) {
      const gross = (v.net * 12) / (1 - v.charges / 100);
      return [
        ['Gefactureerde dagen per jaar', `${F.nf(v.days)} × 12 × (52 − ${F.nf(v.weeks)}) ÷ 52 = ${F.nf(r.billable, 0)}`],
        [`Om ${F.money(v.net)} per maand over te houden`, `${F.money(v.net)} × 12 ÷ (1 − ${F.pct(v.charges)}) = ${F.money(gross)}`],
        v.costs > 0 ? ['Plus de kosten van het jaar', `${F.money(gross)} + ${F.money(v.costs)} × 12 = ${F.money(r.revenue)}`] : null,
        ['Dagtarief', `${F.money(r.revenue)} ÷ ${F.nf(r.billable, 0)} = ${F.money(r.rate)}`],
        [`Concreet, een maand met ${F.nf(v.days)} gefactureerde dagen`, `${F.nf(v.days)} × ${F.money(r.rate)} = ${F.money(v.days * r.rate)}`],
      ];
    },
    devis(v, r, F) {
      return [
        ['Werk', `${F.nf(v.days, 1)} dagen × ${F.money(v.rate)} = ${F.money(r.work)}`],
        v.buffer > 0 ? ['Marge voor verrassingen', `${F.money(r.work)} × ${F.pct(v.buffer)} = ${F.money(r.safety)}`] : null,
        ['Totaal exclusief btw', `${F.money(r.work)} + ${F.money(r.safety)} + ${F.money(v.expenses)} = ${F.money(r.ht)}`],
        v.vat > 0 ? ['Btw', `${F.money(r.ht)} × ${F.pct(v.vat)} = ${F.money(r.vatAmount)}`] : null,
        v.deposit > 0 ? ['Voorschot', `${F.money(r.ttc)} × ${F.pct(v.deposit)} = ${F.money(r.depositAmount)}`] : null,
        ['Concreet brengt een geplande dag je op', `(${F.money(r.ht)} − ${F.money(v.expenses)}) ÷ ${F.nf(v.days, 1)} = ${F.money((r.ht - v.expenses) / v.days)}`],
      ];
    },
    prix(v, r, F) {
      return [
        ['Prijs exclusief btw', `${F.money(v.cost)} ÷ (1 − ${F.pct(v.margin)}) = ${F.money(r.ht)}`],
        ['Je marge', `${F.money(r.ht)} − ${F.money(v.cost)} = ${F.money(r.marginAmount)}`],
        v.vat > 0 ? ['Getoonde prijs', `${F.money(r.ht)} × (1 + ${F.pct(v.vat)}) = ${F.money(r.ttc)}`] : null,
        r.marginAmount > 0 ? [`Concreet, om ${F.money(1000)} marge te verdienen`, `${F.money(1000)} ÷ ${F.money(r.marginAmount)} → ${F.nf(Math.ceil(1000 / r.marginAmount))} verkopen`] : null,
      ];
    },
    remise(v, r, F) {
      return [
        ['Marge per verkoop, vooraf', `${F.money(v.price)} × ${F.pct(v.margin)} = ${F.money(r.before)}`],
        ['Marge per verkoop, nadien', `${F.money(v.price)} × (${F.pct(v.margin)} − ${F.pct(v.discount)}) = ${F.money(r.after)}`],
        r.extra != null ? ['Extra verkopen', `${F.money(r.before)} ÷ ${F.money(r.after)} − 1 = ${F.pct(r.extra)}`] : null,
        r.extra != null ? ['Concreet zijn 100 verkopen vooraf evenveel als', `100 × ${F.money(r.before)} ÷ ${F.money(r.after)} → ${F.nf(Math.ceil(100 + r.extra))} verkopen nadien`] : null,
      ];
    },
    seuil(v, r, F) {
      return [
        ['Marge per verkoop', `${F.money(v.price)} − ${F.money(v.variable)} = ${F.money(r.margin)}`],
        r.units != null ? ['Verkopen om de vaste kosten te dekken', `${F.money(v.fixed)} ÷ ${F.money(r.margin)} = ${F.nf(v.fixed / r.margin, 1)} → ${F.nf(r.units)}`] : null,
        r.units != null ? ['Omzet op het break-evenpunt', `${F.nf(r.units)} × ${F.money(v.price)} = ${F.money(r.revenue)}`] : null,
        r.units != null ? ['Concreet, per werkdag (22 per maand)', `${F.nf(r.units)} ÷ 22 ≈ ${F.nf(r.units / 22, 1)} ${r.units / 22 === 1 ? 'verkoop' : 'verkopen'}`] : null,
      ];
    },
    tunnel(v, r, F) {
      return [
        ['Contacten', `${F.nf(v.visitors)} × ${F.pct(v.signup)} = ${F.nf(r.leads, 1)}`],
        ['Klanten', `${F.nf(r.leads, 1)} × ${F.pct(v.purchase)} = ${F.nf(r.customers, 1)}`],
        ['Omzet', `${F.nf(r.customers, 1)} × ${F.money(v.basket)} = ${F.money(r.revenue)}`],
        r.costPerCustomer != null ? ['Kost van een klant', `${F.money(v.spend)} ÷ ${F.nf(r.customers, 1)} = ${F.money(r.costPerCustomer)}`] : null,
        r.customers > 0 ? ['Concreet, bezoekers per klant', `${F.nf(v.visitors)} ÷ ${F.nf(r.customers, 1)} ≈ ${F.nf(v.visitors / r.customers)}`] : null,
      ];
    },
    tirelire(v, r, F) {
      return [
        ['Btw, door te storten', `${F.money(v.amount)} × ${F.pct(v.vat)} = ${F.money(r.vatAmount)}`],
        ['Bijdragen en belastingen', `${F.money(v.amount)} × ${F.pct(v.charges)} = ${F.money(r.chargesAmount)}`],
        ['Opzij te zetten', `${F.money(r.vatAmount)} + ${F.money(r.chargesAmount)} = ${F.money(r.aside)}`],
        ['Echt van jou', `${F.money(v.amount)} − ${F.money(r.chargesAmount)} = ${F.money(r.yours)}`],
        [`Concreet, op ${F.money(100)} ontvangen`, `${F.money(r.yoursShare)} is van jou`],
      ];
    },
    ticket(v, r, F) {
      return [
        ['Je deel bij de instap', `${F.money(v.ticket)} ÷ ${F.money(v.post)} = ${F.pct(r.stake, 2)}`],
        v.dilution > 0 ? ['Na de volgende rondes', `${F.pct(r.stake, 2)} × (1 − ${F.pct(v.dilution)}) = ${F.pct(r.stakeExit, 2)}`] : null,
        ['Wat je terugkrijgt', `${F.pct(r.stakeExit, 2)} × ${F.money(v.exit)} = ${F.money(r.proceeds)}`],
        ['Veelvoud', `${F.money(r.proceeds)} ÷ ${F.money(v.ticket)} = ${F.times(r.multiple)}`],
        r.multiple > 0 ? ['Rendement per jaar (IRR)', `${F.nf(r.multiple, 2)}^(1/${v.years}) − 1 = ${F.pct(r.irr)}`] : null,
      ];
    },
    valo(v, r, F) {
      const kept = v.exit * (1 - v.dilution / 100);
      return [
        ['Exit, zodra je deel verwaterd is', `${F.money(v.exit)} × (1 − ${F.pct(v.dilution)}) = ${F.money(kept)}`],
        ['Maximale waardering', `${F.money(kept)} ÷ ${F.nf(v.multiple, 1)} = ${F.money(r.post)}`],
        r.stake != null ? ['Je deel bij de instap', `${F.money(v.ticket)} ÷ ${F.money(r.post)} = ${F.pct(r.stake, 2)}`] : null,
        r.stake != null ? ['Concreet zou je bij de exit krijgen', `${F.money(v.ticket)} × ${F.nf(v.multiple, 1)} = ${F.money(v.ticket * v.multiple)}`] : null,
      ];
    },
    portefeuille(v, r, F) {
      return [
        ['In totaal geïnvesteerd', `${F.nf(v.count)} × ${F.money(v.ticket)} = ${F.money(r.invested)}`],
        ['Gemiddeld veelvoud', `${F.pct(v.mid)} × ${F.nf(v.midMultiple, 1)} + ${F.pct(r.win)} × ${F.nf(v.winMultiple, 1)} = ${F.times(r.multiple)}`],
        ['Verwacht rendement', `${F.money(r.invested)} × ${F.nf(r.multiple, 2)} = ${F.money(r.proceeds)}`],
        ['Concreet levert één groot succes op', `${F.money(v.ticket)} × ${F.nf(v.winMultiple, 1)} = ${F.money(v.ticket * v.winMultiple)}`],
      ];
    },
    suivre(v, r, F) {
      return [
        ['Waardering na de ronde', `${F.money(v.pre)} + ${F.money(v.raise)} = ${F.money(r.post)}`],
        ['Om je deel te houden', `${F.money(v.raise)} × ${F.pct(v.stake, 2)} = ${F.money(r.invest)}`],
        ['Als je niet volgt', `${F.pct(v.stake, 2)} × ${F.money(v.pre)} ÷ ${F.money(r.post)} = ${F.pct(r.without, 2)}`],
      ];
    },
    fonte(v, r, F) {
      return [
        ['Elke ronde laat je', `100% − ${F.pct(v.dilution)} = ${F.pct(100 - v.dilution)}`],
        [`Na ${v.rounds} ${v.rounds > 1 ? 'rondes' : 'ronde'}`, `${F.pct(v.stake, 2)} × ${F.nf(1 - v.dilution / 100, 2)}^${v.rounds} = ${F.pct(r.final, 2)}`],
        [`Concreet, bij een verkoop voor ${F.money(1e7)}`, `${F.pct(r.final, 2)} × ${F.money(1e7)} = ${F.money((r.final / 100) * 1e7)}`],
      ];
    },
    convertible(v, r, F) {
      const discounted = v.pre * (1 - v.discount / 100);
      return [
        ['Waardering met de korting', `${F.money(v.pre)} × (1 − ${F.pct(v.discount)}) = ${F.money(discounted)}`],
        v.cap > 0 ? ['Gebruikte waardering: de laagste', `min(${F.money(v.cap)}; ${F.money(discounted)}) = ${F.money(r.effective)}`] : null,
        ['De houder koopt alsof', `${F.money(v.amount)} ÷ ${F.money(r.effective)} = ${F.pct((v.amount / r.effective) * 100, 2)} van het bestaande kapitaal`],
        ['Zijn deel na de ronde', F.pct(r.stake, 2)],
      ];
    },
    cascade(v, r, F) {
      return [
        ['Voorkeur van de investeerders', `${F.money(v.invested)} × ${F.nf(v.multiple, 1)} = ${F.money(v.invested * v.multiple)}`],
        ['Hun deel van de prijs', `${F.money(v.exit)} × ${F.pct(v.stake)} = ${F.money(r.asShares)}`],
        ['Ze nemen het grootste', `max(${F.money(r.preference)}; ${F.money(r.asShares)}) = ${F.money(r.investors)}`],
        ['Over voor de andere aandeelhouders', `${F.money(v.exit)} − ${F.money(r.investors)} = ${F.money(r.others)}`],
      ];
    },
    note(v, r, F) {
      const names = { team: 'Team', market: 'Markt', traction: 'Tractie', product: 'Product', terms: 'Voorwaarden' };
      return [
        ...r.parts.map((p) => [`${names[p.key]} (gewicht ${p.weight})`, `${F.nf(p.note, 1)} ÷ 10 × ${p.weight} = ${F.nf(p.points, 1)}`]),
        ['Totaal', `${r.parts.map((p) => F.nf(p.points, 1)).join(' + ')} = ${F.nf(r.score, 1)}`],
      ];
    },
    composes(v, r, F) {
      return [
        ['In totaal ingelegd', `${F.money(v.initial)} + ${F.money(v.monthly)} × ${v.years * 12} maanden = ${F.money(r.paid)}`],
        ['Wat de rente toevoegt', `${F.money(r.value)} − ${F.money(r.paid)} = ${F.money(r.gain)}`],
        v.rate > 0 ? ['Tijd om te verdubbelen (regel van 72)', `72 ÷ ${F.nf(v.rate, 1)} ≈ ${F.nf(72 / v.rate, 1)} jaar`] : null,
        r.value > 0 ? ['Concreet, als je daarna 4% per jaar opneemt', `${F.money(r.value)} × 4% ÷ 12 = ${F.money((r.value * 0.04) / 12)} per maand`] : null,
      ];
    },
    cible(v, r, F) {
      return [
        [`Je startkapitaal, over ${v.years} jaar`, `${F.money(v.initial)} → ${F.money(r.grown)}`],
        ['Nog op te bouwen', `${F.money(v.target)} − ${F.money(r.grown)} = ${F.money(Math.max(0, v.target - r.grown))}`],
        ['In totaal ingelegd', `${F.money(v.initial)} + ${F.money(r.monthly)} × ${v.years * 12} = ${F.money(r.paid)}`],
        r.monthly > 0 ? ['Concreet, per dag', `${F.money(r.monthly)} × 12 ÷ 365 ≈ ${F.money((r.monthly * 12) / 365)}`] : null,
      ];
    },
    frais(v, r, F) {
      const [low, high] = v.feeA <= v.feeB ? [r.a, r.b] : [r.b, r.a];
      return [
        ['Netto rendement van belegging A', `${F.pct(v.rate)} − ${F.pct(v.feeA, 2)} = ${F.pct(v.rate - v.feeA, 2)}`],
        ['Netto rendement van belegging B', `${F.pct(v.rate)} − ${F.pct(v.feeB, 2)} = ${F.pct(v.rate - v.feeB, 2)}`],
        ['Verschil op het einde', `${F.money(low)} − ${F.money(high)} = ${F.money(r.gap)}`],
        v.monthly > 0 && r.gap > 0 ? ['Concreet is dat verschil', `${F.money(r.gap)} ÷ ${F.money(v.monthly)} ≈ ${F.nf(r.gap / v.monthly)} maanden inleg`] : null,
      ];
    },
    inflation(v, r, F) {
      const prices = (1 + v.inflation / 100) ** v.years;
      return [
        [`De prijzen, over ${v.years} jaar`, `(1 + ${F.pct(v.inflation)})^${v.years} = × ${F.nf(prices, 2)}`],
        v.rate !== 0 ? ['Getoond bedrag', `${F.money(v.amount)} × (1 + ${F.pct(v.rate)})^${v.years} = ${F.money(r.nominal)}`] : null,
        ['Waarde in geld van vandaag', `${F.money(r.nominal)} ÷ ${F.nf(prices, 2)} = ${F.money(r.real)}`],
        [`Concreet kost een boodschappenkar van ${F.money(100)} dan`, `${F.money(100)} × ${F.nf(prices, 2)} = ${F.money(100 * prices)}`],
      ];
    },
    reserve(v, r, F) {
      const monthly = ((1 + v.rate / 100) ** (1 / 12) - 1) * 100;
      return [
        ['Rendement per maand', `(1 + ${F.pct(v.rate)})^(1/12) − 1 = ${F.pct(monthly, 3)}`],
        ['Wat het kapitaal per maand opbrengt', `${F.money(v.capital)} × ${F.pct(monthly, 3)} = ${F.money(r.sustainable)}`],
        r.forever ? ['Je neemt minder op dan dat', `${F.money(v.monthly)} ≤ ${F.money(r.sustainable)}`]
          : ['Je spreekt het kapitaal aan, in het begin', `${F.money(v.monthly)} − ${F.money(r.sustainable)} = ${F.money(v.monthly - r.sustainable)} per maand`],
        r.total != null ? ['In totaal opgenomen', `${F.money(v.monthly)} × ${F.nf(r.months)} ${mnd(r.months)} = ${F.money(r.total)}`] : null,
      ];
    },
    coussin(v, r, F) {
      return [
        ['Doel', `${F.money(v.expenses)} × ${F.nf(v.months)} ${mnd(v.months)} = ${F.money(r.target)}`],
        ['Al gedekt', `${F.money(v.saved)} ÷ ${F.money(v.expenses)} = ${F.nf(r.covered, 1)} maanden`],
        r.missing > 0 ? ['Er ontbreekt nog', `${F.money(r.target)} − ${F.money(v.saved)} = ${F.money(r.missing)}`] : null,
        r.missing > 0 && v.monthly > 0 ? ['Tijd om er te geraken', `${F.money(r.missing)} ÷ ${F.money(v.monthly)} = ${F.nf(r.missing / v.monthly, 1)} → ${r.wait} ${mnd(r.wait)}`] : null,
      ];
    },
    credit(v, r, F) {
      const n = v.years * 12;
      const m = v.rate / 12;
      return [
        ['Rente per maand', `${F.pct(v.rate)} ÷ 12 = ${F.pct(m, 3)}`],
        ['Maandlast, zonder verzekering', v.rate > 0 ? `${F.money(v.amount)} × ${F.pct(m, 3)} ÷ (1 − (1 + ${F.pct(m, 3)})^−${n}) = ${F.money(r.payment)}` : `${F.money(v.amount)} ÷ ${n} = ${F.money(r.payment)}`],
        v.insurance > 0 ? ['Verzekering per maand', `${F.money(v.amount)} × ${F.pct(v.insurance, 2)} ÷ 12 = ${F.money(r.insurance)}`] : null,
        ['In totaal betaald', `${F.money(r.monthly)} × ${n} maanden = ${F.money(r.totalPaid)}`],
        v.rate > 0 ? ['Concreet is de rente in de eerste maand', `${F.money(v.amount)} × ${F.pct(m, 3)} = ${F.money(r.firstInterest)}`] : null,
      ];
    },
    capacite(v, r, F) {
      const n = v.years * 12;
      const m = v.rate / 12;
      return [
        ['Deel voor kredieten', `${F.money(v.income)} × ${F.pct(v.ratio)} = ${F.money(r.room)}`],
        v.debts > 0 ? ['Min je lopende kredieten', `${F.money(r.room)} − ${F.money(v.debts)} = ${F.money(r.maxMonthly)}`] : null,
        ['Bedrag dat je kunt lenen', v.rate > 0 ? `${F.money(r.maxMonthly)} × (1 − (1 + ${F.pct(m, 3)})^−${n}) ÷ ${F.pct(m, 3)} = ${F.money(r.loan)}` : `${F.money(r.maxMonthly)} × ${n} = ${F.money(r.loan)}`],
        r.loan > 0 ? ['Concreet, de rente in totaal', `${F.money(r.totalPaid)} − ${F.money(r.loan)} = ${F.money(r.interest)}`] : null,
      ];
    },
    rendement(v, r, F) {
      return [
        ['Huur van een jaar', `${F.money(v.rent)} × (12 − ${F.nf(v.vacancy, 1)}) = ${F.money(r.yearRent)}`],
        ['Brutorendement', `${F.money(v.rent)} × 12 ÷ ${F.money(v.price)} = ${F.pct(r.gross, 2)}`],
        ['Wat overblijft', `${F.money(r.yearRent)} − ${F.money(v.charges)} = ${F.money(r.netIncome)}`],
        ['Nettorendement', `${F.money(r.netIncome)} ÷ (${F.money(v.price)} + ${F.money(v.costs)}) = ${F.pct(r.net, 2)}`],
        ['Concreet, per maand', `${F.money(r.netIncome)} ÷ 12 = ${F.money(r.netIncome / 12)}`],
      ];
    },
    cashflow(v, r, F) {
      return [
        ['Ontvangen huur', `${F.money(v.rent)} × (1 − ${F.pct(v.vacancy)}) = ${F.money(r.income)}`],
        v.works > 0 ? ['Reserve voor werken', `${F.money(v.rent)} × ${F.pct(v.works)} = ${F.money(r.reserve)}`] : null,
        ['Wat overblijft', `${F.money(r.income)} − ${F.money(v.charges)} − ${F.money(v.loan)} − ${F.money(r.reserve)} = ${F.money(r.cash)}`],
        ['Concreet, over een jaar', `${F.money(r.cash)} × 12 = ${F.money(r.yearly)}`],
      ];
    },
    louer(v, r, F) {
      const diff = r.firstOwnerOut - v.rent;
      return [
        ['Kost van de aankoop', `${F.money(v.price)} × (1 + ${F.pct(v.buyCosts)}) = ${F.money(r.cost)}`],
        ['Geleend bedrag', `${F.money(r.cost)} − ${F.money(Math.min(v.deposit, r.cost))} = ${F.money(r.loan)}`],
        ['Uitgave van de eigenaar, eerste maand', `${F.money(r.payment)} + ${F.money(v.price)} × 1% ÷ 12 = ${F.money(r.firstOwnerOut)}`],
        diff >= 0 ? ['De huurder belegt, eerste maand', `${F.money(r.firstOwnerOut)} − ${F.money(v.rent)} = ${F.money(diff)}`]
          : ['De eigenaar belegt, eerste maand', `${F.money(v.rent)} − ${F.money(r.firstOwnerOut)} = ${F.money(-diff)}`],
        [`Vermogen na ${v.horizon} jaar`, `${F.money(r.buy)} met kopen, ${F.money(r.rent)} met huren`],
      ];
    },
    pub(v, r, F) {
      return [
        ['Marge per bestelling', `${F.money(v.basket)} − ${F.money(v.cogs)} − ${F.money(v.shipping)} − ${F.money(v.basket * v.fees / 100)} = ${F.money(r.margin)}`],
        r.breakEvenRoas != null ? ['Break-even-ROAS', `${F.money(v.basket)} ÷ ${F.money(r.margin)} = ${F.nf(r.breakEvenRoas, 2)}`] : null,
        r.roas != null ? ['Jouw ROAS', `${F.money(r.revenue)} ÷ ${F.money(v.spend)} = ${F.nf(r.roas, 2)}`] : null,
        ['Winst', `${F.nf(v.orders)} × ${F.money(r.margin)} − ${F.money(v.spend)} = ${F.money(r.profit)}`],
        r.cpa != null ? ['Concreet kost elke bestelling je aan advertenties', `${F.money(v.spend)} ÷ ${F.nf(v.orders)} = ${F.money(r.cpa)}`] : null,
      ];
    },
    livraison(v, r, F) {
      return [
        ['Marge op een gemiddeld mandje', `${F.money(v.basket)} × ${F.pct(v.margin)} = ${F.money(v.basket * v.margin / 100)}`],
        ['Extra mandje om de verzending te betalen', `${F.money(v.shipping)} ÷ ${F.pct(v.margin)} = ${F.money(r.extra)}`],
        ['Drempel', `${F.money(v.basket)} + ${F.money(r.extra)} = ${F.money(r.threshold)}`],
        v.orders > 0 ? ['Concreet kost alles gratis leveren per maand', `${F.nf(v.orders)} × ${F.money(v.shipping)} = ${F.money(r.monthly)}`] : null,
      ];
    },
    stock(v, r, F) {
      return [
        ['Bestelpunt', `${F.nf(v.daily, 1)} × (${F.nf(v.lead)} + ${F.nf(v.safety)}) = ${F.nf(r.point)}`],
        ['Dagen voorraad', `${F.nf(v.stock)} ÷ ${F.nf(v.daily, 1)} = ${F.nf(r.daysLeft, 1)}`],
        r.late ? null : ['Bestellen over', `(${F.nf(v.stock)} − ${F.nf(r.point)}) ÷ ${F.nf(v.daily, 1)} ≈ ${F.nf(r.orderIn)} dagen`],
        v.cost > 0 ? ['Concreet is je voorraad waard', `${F.nf(v.stock)} × ${F.money(v.cost)} = ${F.money(r.value)}`] : null,
      ];
    },
    retours(v, r, F) {
      return [
        ['Retouren per maand', `${F.nf(v.orders)} × ${F.pct(v.rate)} = ${F.nf(r.returned, 1)}`],
        ['Kost van een retour', `(${F.money(v.basket)} − ${F.money(v.cogs)}) + ${F.money(v.back)} + ${F.money(v.cogs)} × ${F.pct(v.lost)} = ${F.money(r.perReturn)}`],
        ['Per maand', `${F.nf(r.returned, 1)} × ${F.money(r.perReturn)} = ${F.money(r.total)}`],
        v.rate > 0 ? ['Concreet, op 100 bestellingen', `${F.nf(v.rate, 1)} komen terug en kosten ${F.money(v.rate * r.perReturn)}`] : null,
      ];
    },
    marketplace(v, r, F) {
      return [
        ['Kosten op de marktplaats', `${F.money(v.price)} × ${F.pct(v.commission)} + ${F.money(v.fixedFee)} = ${F.money(r.mpCost)}`],
        ['Over, op de marktplaats', `${F.money(v.price)} − ${F.money(v.cogs)} − ${F.money(r.mpCost)} = ${F.money(r.mp)}`],
        ['Kosten in je webwinkel', `${F.money(v.price)} × ${F.pct(v.siteFees)} + ${F.money(v.siteAds)} = ${F.money(r.siteCost)}`],
        ['Over, in je webwinkel', `${F.money(v.price)} − ${F.money(v.cogs)} − ${F.money(r.siteCost)} = ${F.money(r.site)}`],
        ['Concreet, op 100 verkopen', `100 × ${F.money(Math.abs(r.gap))} = ${F.money(100 * Math.abs(r.gap))} verschil`],
      ];
    },
    budget(v, r, F) {
      return [
        ['Wat overblijft', `${F.money(v.income)} − ${F.money(v.needs)} − ${F.money(v.wants)} = ${F.money(r.savings)}`],
        ['Richtpunt voor het noodzakelijke', `${F.money(v.income)} × ${F.pct(50, 0)} = ${F.money(r.target.needs)}`],
        ['Richtpunt voor wensen', `${F.money(v.income)} × ${F.pct(30, 0)} = ${F.money(r.target.wants)}`],
        ['Richtpunt om te sparen', `${F.money(v.income)} × ${F.pct(20, 0)} = ${F.money(r.target.savings)}`],
        r.savings > 0 ? ['Concreet, over tien jaar', `${F.money(r.savings)} × 120 maanden = ${F.money(r.savings * 120)}`] : null,
      ];
    },
    dette(v, r, F) {
      const m = v.rate / 12;
      return [
        ['Rente per maand', `${F.pct(v.rate)} ÷ 12 = ${F.pct(m, 2)}`],
        ['Rente in de eerste maand', `${F.money(v.balance)} × ${F.pct(m, 2)} = ${F.money(r.firstInterest)}`],
        r.months != null ? ['Schuld afgelost in de eerste maand', `${F.money(v.payment)} − ${F.money(r.firstInterest)} = ${F.money(v.payment - r.firstInterest)}`]
          : ['Minimale afbetaling', `meer dan ${F.money(r.firstInterest)} per maand`],
        r.months != null ? ['Concreet betaal je in totaal', `${F.money(v.balance)} + ${F.money(r.interest)} = ${F.money(v.balance + r.interest)}`] : null,
      ];
    },
    heures(v, r, F) {
      return [
        ['Je inkomen per uur', `${F.money(v.income)} ÷ ${F.nf(v.hours)} u = ${F.money(r.hourly)}`],
        ['Uren werk', `${F.money(v.price)} ÷ ${F.money(r.hourly)} = ${F.nf(r.hours, 1)} u`],
        v.years > 0 ? ['Hetzelfde bedrag belegd', `${F.money(v.price)} × (1 + ${F.pct(v.rate)})^${v.years} = ${F.money(r.later)}`] : null,
        ['Concreet, in werkdagen van 7 uur', `${F.nf(r.hours, 1)} ÷ 7 ≈ ${F.nf(r.days, 1)}`],
      ];
    },
    voiture(v, r, F) {
      return [
        ['Waardeverlies per jaar', `${F.money(v.price)} × (1 − ${F.pct(v.resale)}) ÷ ${F.nf(v.years)} = ${F.money(r.loss)}`],
        ['Energie per jaar', `${F.nf(v.km)} km × ${F.nf(v.use, 1)} ÷ 100 × ${F.money(v.energy)} = ${F.money(r.fuel)}`],
        ['Per jaar', `${F.money(r.loss)} + ${F.money(r.fuel)} + ${F.money(r.fixed)} = ${F.money(r.year)}`],
        ['Per maand', `${F.money(r.year)} ÷ 12 = ${F.money(r.month)}`],
        r.perKm != null ? ['Concreet, een rit van 20 km', `20 × ${F.money(r.perKm)} = ${F.money(20 * r.perKm)}`] : null,
      ];
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
    credit: {
      invalid: 'Controleer je cijfers: een bedrag boven nul, een rente van 0 tot 30%, een looptijd van 1 tot 40 volle jaren en een verzekering van 0 tot 5%.',
      label: 'per maand, verzekering inbegrepen',
      verdict: (v, r, F) => `Voor ${F.money(v.amount)} over ${v.years} jaar betaal je ${F.money(r.monthly)} per maand. De lening kost je ${F.money(r.totalCost)} bovenop het geleende bedrag, of ${F.pct((r.totalCost / v.amount) * 100, 0)} van dat bedrag.`,
      chart: 'Wat je elk jaar afbetaalt',
      aria: 'Afgelost kapitaal en rente, jaar per jaar',
      bar: (p, F) => `Jaar ${p.year}: ${F.money(p.principal)} kapitaal, ${F.money(p.interest)} rente`,
      legend: ['Afgelost kapitaal', 'Rente'],
      facts: (v, r, F) => [
        ['Maandlast zonder verzekering', F.money(r.payment)],
        ['Rente in totaal', F.money(r.totalInterest)],
        ['Verzekering in totaal', F.money(r.totalInsurance)],
      ],
      table: ['Jaar', 'Kapitaal', 'Rente', 'Nog verschuldigd'],
      row: (p, F) => ['Jaar ' + p.year, F.money(p.principal), F.money(p.interest), F.money(p.balance)],
    },
    capacite: {
      invalid: 'Controleer je cijfers: een inkomen boven nul, een deel van 1 tot 100%, een rente van 0 tot 30% en een looptijd van 1 tot 40 volle jaren.',
      label: 'die je kunt lenen',
      verdict(v, r, F) {
        if (r.maxMonthly === 0) return `Je lopende kredieten (${F.money(v.debts)} per maand) nemen al het hele voorziene deel: ${F.pct(v.ratio, 0)} van je inkomen.`;
        return `Met ${F.money(v.income)} inkomen geeft ${F.pct(v.ratio, 0)} ${F.money(r.room)} per maand voor kredieten. Daarvan blijft ${F.money(r.maxMonthly)} over: genoeg om ${F.money(r.loan)} te lenen over ${v.years} jaar.`;
      },
      rows: ['Deel voor kredieten', 'Lopende kredieten', 'Mogelijke maandlast'],
      facts: (v, r, F) => [
        ['Mogelijke maandlast', F.money(r.maxMonthly)],
        ['Rente in totaal', F.money(r.interest)],
        ['Je kredieten vandaag', `${F.pct(r.used)} van het inkomen`],
      ],
    },
    rendement: {
      invalid: 'Controleer je cijfers: een prijs boven nul, bedragen die niet negatief zijn en 0 tot 12 maanden zonder huurder.',
      label: 'nettorendement per jaar',
      verdict: (v, r, F) => (r.netIncome <= 0
        ? `De uitgaven slokken alle huur op: de woning kost je ${F.money(-r.netIncome)} per jaar, nog voor de lening.`
        : `Aangekondigd aan ${F.pct(r.gross, 2)} bruto, brengt de woning ${F.pct(r.net, 2)} netto op: ${F.money(r.netIncome)} per jaar voor ${F.money(r.total)} geïnvesteerd. Er zijn ${F.nf(r.payback, 1)} jaar huur nodig om de aankoop terug te verdienen.`),
      chart: 'Een jaar huur',
      rows: ['Ontvangen huur', 'Uitgaven', 'Wat overblijft'],
      facts: (v, r, F) => [
        ['Brutorendement', F.pct(r.gross, 2)],
        ['Totale kost', F.money(r.total)],
        ['Jaren om de aankoop terug te verdienen', r.payback != null ? F.nf(r.payback, 1) : 'nooit'],
      ],
    },
    cashflow: {
      invalid: 'Controleer je cijfers: bedragen die niet negatief zijn en percentages van 0 tot 100.',
      label: 'per maand, na de lening',
      verdict: (v, r, F) => (r.cash >= 0
        ? `De woning betaalt haar lening en uitgaven, en laat je ${F.money(r.cash)} per maand over: ${F.money(r.yearly)} per jaar, voor belastingen.`
        : `De huur dekt niet alles: je legt ${F.money(-r.cash)} per maand bij uit eigen zak, of ${F.money(-r.yearly)} per jaar. In ruil los je elke maand kapitaal af.`),
      chart: 'Een gewone maand',
      rows: ['Ontvangen huur', 'Lening', 'Uitgaven', 'Reserve voor werken'],
      facts: (v, r, F) => [
        ['Over een jaar', F.money(r.yearly)],
        ['De huur dekt de lening voor', r.cover != null ? F.pct(r.cover, 0) : 'geen lening'],
        ['Uitgaand per maand', F.money(r.out)],
      ],
    },
    louer: {
      invalid: 'Controleer je cijfers: een prijs boven nul, looptijden van 1 tot 40 volle jaren, een prijsstijging van −20 tot 20% en redelijke rentes.',
      label: (r) => (r.gap >= 0 ? 'meer vermogen door te kopen' : 'meer vermogen door te huren'),
      verdict(v, r, F) {
        let t = r.gap >= 0
          ? `Na ${v.horizon} jaar heeft de koper ${F.money(r.buy)} en de huurder ${F.money(r.rent)}: kopen wint met ${F.money(r.gap)}.`
          : `Na ${v.horizon} jaar heeft de huurder ${F.money(r.rent)} en de koper ${F.money(r.buy)}: huren wint met ${F.money(-r.gap)}.`;
        t += r.breakEven != null ? ` Kopen neemt de leiding na ${r.breakEven} jaar.` : ' Over deze periode neemt kopen nooit de leiding.';
        return t;
      },
      chart: 'Verschil in vermogen, jaar na jaar',
      bar: (p, F) => `Jaar ${p.year}: koper ${F.money(p.buy)}, huurder ${F.money(p.rent)}`,
      legend: ['Kopen staat voor', 'Huren staat voor'],
      facts: (v, r, F) => [
        ['Geleend bedrag', F.money(r.loan)],
        ['Maandlast', F.money(r.payment)],
        ['Waarde van de woning op het einde', F.money(r.home)],
      ],
      table: ['Jaar', 'Koper', 'Huurder'],
      row: (p, F) => [p.year === 0 ? 'Start' : 'Jaar ' + p.year, F.money(p.buy), F.money(p.rent)],
    },
    pub: {
      invalid: 'Controleer je cijfers: een mandje boven nul, bedragen die niet negatief zijn en kosten van 0 tot 100%.',
      label: 'winst na advertenties',
      verdict(v, r, F) {
        if (r.breakEvenRoas == null) return `Elke bestelling kost je al ${F.money(-r.margin)} voor de advertenties: geen campagne kan dat goedmaken. Herbekijk je prijs of je kosten.`;
        const roas = r.roas != null ? `Je ROAS is ${F.nf(r.roas, 2)}, tegenover een break-even-ROAS van ${F.nf(r.breakEvenRoas, 2)}. ` : '';
        return roas + (r.profit >= 0 ? `Deze advertenties laten je ${F.money(r.profit)} over.`
          : `Deze advertenties kosten je ${F.money(-r.profit)}: je zou ${F.nf(r.ordersNeeded)} bestellingen nodig hebben om quitte te spelen.`);
      },
      rows: ['Omzet', 'Marge voor advertenties', 'Advertentiebudget'],
      facts: (v, r, F) => [
        ['Break-even-ROAS', r.breakEvenRoas != null ? F.nf(r.breakEvenRoas, 2) : '—'],
        ['Kost per bestelling', r.cpa != null ? F.money(r.cpa) : '—'],
        ['Maximale kost per bestelling', F.money(r.maxCpa)],
      ],
    },
    livraison: {
      invalid: 'Controleer je cijfers: een mandje boven nul, een marge van 1 tot 100% en bedragen die niet negatief zijn.',
      label: 'minimummandje voor gratis levering',
      verdict: (v, r, F) => `Een verzending van ${F.money(v.shipping)} slokt ${F.pct(r.eaten, 0)} op van de marge op een gemiddeld mandje. Om ze te betalen is ${F.money(r.extra)} extra in het mandje nodig: bied gratis levering aan vanaf ${F.money(r.threshold)}.`,
      rows: ['Gemiddeld mandje vandaag', 'Drempel voor gratis levering'],
      facts: (v, r, F) => [
        ['Nodig extra mandje', F.money(r.extra)],
        ['Opgeslokt deel van de marge', F.pct(r.eaten, 0)],
        ['Alles gratis leveren, per maand', F.money(r.monthly)],
      ],
    },
    stock: {
      invalid: 'Controleer je cijfers: een verkoop boven nul en getallen die niet negatief zijn.',
      label: 'stuks: het punt om bij te bestellen',
      verdict(v, r, F) {
        if (r.late) return `Je voorraad (${F.nf(v.stock)}) zit al onder het bestelpunt: bestel vandaag. Hij houdt ${F.nf(r.daysLeft, 1)} dagen, tegenover ${F.nf(v.lead)} dagen levertijd` + (r.gap > 0 ? `: ${F.nf(r.gap, 1)} dagen zonder voorraad als er niets verandert.` : '.');
        return `Je voorraad houdt ${F.nf(r.daysLeft, 1)} dagen. Bestel bij wanneer hij onder ${F.nf(r.point)} stuks zakt: over ongeveer ${F.nf(r.orderIn)} ${r.orderIn === 1 ? 'dag' : 'dagen'}.`;
      },
      rows: ['Voorraad vandaag', 'Bestelpunt'],
      facts: (v, r, F) => [
        ['Dagen voorraad', F.nf(r.daysLeft, 1)],
        ['Bestellen over', r.late ? 'meteen' : `${F.nf(r.orderIn)} ${r.orderIn === 1 ? 'dag' : 'dagen'}`],
        ['Waarde van de voorraad', F.money(r.value)],
      ],
    },
    retours: {
      invalid: 'Controleer je cijfers: een mandje boven nul, bedragen die niet negatief zijn en percentages van 0 tot 100.',
      label: 'kost van retouren per maand',
      verdict: (v, r, F) => `${F.nf(r.returned, 1)} retouren per maand, aan ${F.money(r.perReturn)} per stuk: ${F.money(r.total)} per maand en ${F.money(r.yearly)} per jaar`
        + (r.share != null ? `, of ${F.pct(r.share)} van je marge.` : '.'),
      rows: ['Marge van de maand, voor retouren', 'Kost van de retouren'],
      facts: (v, r, F) => [
        ['Kost van een retour', F.money(r.perReturn)],
        ['Over een jaar', F.money(r.yearly)],
        ['Marge na retouren', F.money(r.after)],
      ],
    },
    marketplace: {
      invalid: 'Controleer je cijfers: een prijs boven nul, bedragen die niet negatief zijn en percentages van 0 tot 100.',
      label: (r) => (r.gap >= 0 ? 'meer per verkoop in je webwinkel' : 'meer per verkoop op de marktplaats'),
      verdict(v, r, F) {
        if (r.gap === 0) return 'Beide kanalen laten je per verkoop hetzelfde over.';
        return r.gap > 0
          ? `Je webwinkel laat je ${F.money(r.site)} per verkoop over, de marktplaats ${F.money(r.mp)}. Je webwinkel blijft voor zolang advertenties er minder dan ${F.money(r.adsLimit)} per verkoop kosten.`
          : `De marktplaats laat je ${F.money(r.mp)} per verkoop over, je webwinkel ${F.money(r.site)}: advertenties kosten er te veel. Boven ${F.money(r.adsLimit)} advertentie per verkoop wint de marktplaats.`;
      },
      rows: ['In je webwinkel', 'Op de marktplaats'],
      facts: (v, r, F) => [
        ['Kosten van de marktplaats, per verkoop', F.money(r.mpCost)],
        ['Kosten van je webwinkel, per verkoop', F.money(r.siteCost)],
        ['Maximale advertentie per verkoop in je webwinkel', F.money(r.adsLimit)],
      ],
    },
    budget: {
      invalid: 'Controleer je cijfers: een inkomen boven nul en uitgaven die niet negatief zijn.',
      label: 'over op het einde van de maand',
      verdict(v, r, F) {
        if (r.savings < 0) return `Je geeft elke maand ${F.money(-r.savings)} meer uit dan je verdient: begin bij de wensen, en heronderhandel dan de grote noodzakelijke uitgaven.`;
        return `Je houdt ${F.money(r.savings)} per maand over: ${F.pct(r.savingsPct)} van je inkomen en ${F.money(r.yearly)} per jaar.`
          + (r.savingsPct >= 20 ? ' Boven het richtpunt van 20%: goed zo.' : ` Het richtpunt van 20% zou ${F.money(r.target.savings)} zijn.`);
      },
      parts: ['Noodzakelijk', 'Wensen', 'Over'],
      chart: 'Jij en het richtpunt 50 / 30 / 20',
      table: ['', 'Jij', 'Richtpunt'],
      facts: (v, r, F) => [
        ['Opzij over een jaar', F.money(r.yearly)],
        ['Noodzakelijk', F.pct(r.needsPct)],
        ['Wensen', F.pct(r.wantsPct)],
      ],
    },
    dette: {
      invalid: 'Controleer je cijfers: een verschuldigd bedrag en een afbetaling boven nul, en een rente van 0 tot 100%.',
      never: 'Nooit',
      neverLabel: 'de afbetaling dekt de rente niet',
      neverVerdict: (v, r, F) => `De rente van de eerste maand is al ${F.money(r.firstInterest)}: met ${F.money(v.payment)} per maand daalt de schuld niet. Je moet minstens ${F.money(r.minPayment)} betalen, en veel meer om eruit te raken.`,
      label: (r) => `${mnd(r.months)} om alles af te lossen`,
      verdict(v, r, F) {
        let t = `Met ${F.money(v.payment)} per maand ben je klaar na ${r.months} ${mnd(r.months)} en betaal je ${F.money(r.interest)} rente.`;
        if (r.saved != null) t += ` Betaal je ${F.money(v.extra)} meer, dan wordt het ${r.moreMonths} ${mnd(r.moreMonths)}, en ${F.money(r.saved)} minder rente.`;
        return t;
      },
      chart: 'Nog verschuldigd, jaar na jaar',
      bar: (p, F) => `Jaar ${p.year}: ${F.money(p.balance)}`,
      facts: (v, r, F) => [
        ['Rente in totaal', F.money(r.interest)],
        ['Rente van de eerste maand', F.money(r.firstInterest)],
        ['Bespaard door meer te betalen', r.saved != null ? F.money(r.saved) : '—'],
      ],
    },
    heures: {
      invalid: 'Controleer je cijfers: een prijs, een inkomen en uren boven nul.',
      label: 'uur werk',
      verdict: (v, r, F) => `Aan ${F.money(r.hourly)} per uur kost deze aankoop je ${F.nf(r.hours, 1)} uur werk: ongeveer ${F.nf(r.days, 1)} ${r.days === 1 ? 'werkdag' : 'werkdagen'} van 7 uur.`
        + (v.years > 0 ? ` Belegd gedurende ${v.years} jaar aan ${F.pct(v.rate)} zou het bedrag ${F.money(r.later)} worden.` : ''),
      rows: ['Prijs van de aankoop', 'Hetzelfde bedrag belegd'],
      facts: (v, r, F) => [
        ['Je inkomen per uur', F.money(r.hourly)],
        ['In werkdagen van 7 uur', F.nf(r.days, 1)],
        ['Deel van je maandinkomen', F.pct(r.share)],
      ],
    },
    voiture: {
      invalid: 'Controleer je cijfers: een periode van 1 tot 40 jaar, een doorverkoopwaarde van 0 tot 100% en bedragen die niet negatief zijn.',
      label: 'per maand, alles inbegrepen',
      verdict: (v, r, F) => `Je auto kost je ${F.money(r.year)} per jaar, of ${F.money(r.month)} per maand` + (r.perKm != null ? ` en ${F.money(r.perKm)} per kilometer.` : '.')
        + ` Het grootste deel: ${r.loss >= r.fuel && r.loss >= r.fixed ? 'het waardeverlies' : r.fuel >= r.fixed ? 'de energie' : 'de vaste kosten'}.`,
      chart: 'Wat een jaar kost',
      rows: ['Waardeverlies', 'Energie', 'Verzekering, onderhoud, parkeren'],
      facts: (v, r, F) => [
        ['Per jaar', F.money(r.year)],
        ['Per kilometer', r.perKm != null ? F.money(r.perKm) : '—'],
        [`Over ${v.years} jaar`, F.money(r.total)],
      ],
    },
  },
};
