// marketbuss — the words of the site, in English.
//
// Same shape as lang/fr.js (checked by plateforme/tests/langues.test.js).
// Nothing here is financial, legal or tax advice: these are general explanations.
//
// F: the formats of the language (F.money, F.pct, F.nf, F.times, F.ord, F.plural).

const lower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
// A group of words: the capital only drops before a common small word (not before a proper noun).
const soft = (s) => (/^(the|a|an|our|your|their|its|his|her|my|every|all|some|most|many|people|small|local|new|we|they|it|you|customers|users|teams|companies|businesses|those|these|this|that)(\s|$)/i.test(s) ? lower(s) : s);
const s = (n) => (n === 1 ? '' : 's');
const months = (n, F) => `${F.nf(n, 1)} month${s(n)}`;

export default {
  code: 'en',
  name: 'English',
  locale: 'en-GB',

  money(n, nf) {
    const a = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (a >= 1e9) return `${sign}€${nf(a / 1e9, 2)}bn`;
    if (a >= 1e6) return `${sign}€${nf(a / 1e6, 2)}M`;
    if (a >= 100 || Number.isInteger(n)) return `${sign}€${nf(Math.round(a))}`;
    return `${sign}€${nf(a, 2)}`;
  },
  pct: (text) => text + '%',
  times: (text) => text + '×',
  ord(n) {
    const t = n % 100;
    if (t >= 11 && t <= 13) return n + 'th';
    return n + (['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  },
  plural: (n, one, many) => (n === 1 ? one : many || one + 's'),

  /* The one-sentence pitch: `p` = the cleaned pieces. */
  pitch(p) {
    const who = soft(p.who);
    const short = `${p.name} helps ${who} ${lower(p.solution)}.`;
    const first = p.problem ? `${p.name} helps ${who}, who ${lower(p.problem)}, ${lower(p.solution)}.` : short;
    let second = '';
    if (p.unlike && p.edge) second = `Unlike ${soft(p.unlike)}, ${soft(p.edge)}.`;
    else if (p.edge) second = `What makes us different: ${soft(p.edge)}.`;
    return { short, text: first + (second ? ' ' + second : '') };
  },

  ui: {
    title: 'marketbuss — tools for founders and investors',
    description: 'marketbuss: free arcade machines to start a business, invest, save, buy a home, sell online and manage a budget, plus today\'s real tools. No account.',
    skip: 'Skip to content',
    loading: 'Loading…',
    language: 'Language',
    nav: { outils: 'Machines', startup: 'Start-up', arsenal: 'Arsenal', parcours: 'Journey', pitch: 'Pitch', lexique: 'Glossary', 'a-propos': 'About' },
    foot: {
      blurb: "Free tools to start a business, invest, save, buy a home, sell online and keep a budget, plus a studio to run your start-up. No account: everything is worked out in your browser.",
      links: { outils: 'All machines', startup: 'Start-up Studio', arsenal: 'The arsenal', parcours: 'The journey', pitch: 'Pitch card', lexique: 'The glossary', 'a-propos': 'About' },
      note: 'The tools are for understanding and practising. They are not financial, legal or tax advice. Investing is risky: you can lose everything you put in.',
    },
    all: 'All',
    player: 'Player',
    result: 'Result',
    yourNumbers: 'Your numbers',
    reset: 'Reset the example',
    copyLink: 'Copy the link',
    linkCopied: 'Link copied, with your numbers.',
    copy: 'Copy',
    copied: 'Copied.',
    copyFail: 'Could not copy: select the text and copy it by hand.',
    clear: 'Clear everything',
    seeValues: 'See the values',
    steps: 'The maths, step by step',
    stepsSub: 'With your numbers, rounded.',
    levers: 'What moves the result',
    leversSub: 'Each button changes one number by one notch and shows the result it would give. The yellow bar shows which ones weigh most.',
    leverTry: (label, step, result) => `${label} ${step}: the result would become ${result}`,
    slider: (label) => `${label} (slider)`,
    highest: (v) => `Highest: ${v}`,
    newTab: '(new tab)',
    nTools: (n) => `${n} machine${s(n)}`,
    nItems: (n) => `${n} tool${s(n)}`,
    nWords: (n) => `${n} word${s(n)}`,
    fineprint: 'These tools are for understanding and practising. They are not financial, legal or tax advice.',

    home: {
      insert: 'Free tools, no account',
      recent: 'Your latest machines',
      recentSub: 'Pick up where you left off. They stay in this browser.',
      stats: { tools: 'machines', players: 'players', arsenal: 'real tools', words: 'words explained' },
      tagline: 'The arcade for founders and investors.',
      lead: 'Cost a project, set a price, prepare a funding round, judge an investment, buy a home, sell online, keep a budget: machines that do the maths and show it, and today\'s real tools.',
      choose: 'Choose your player',
      tools: 'The machines',
      toolsSub: (n) => `${n} machines, each answering one question. The starting numbers are examples: replace them with yours.`,
      arsenal: 'The arsenal',
      arsenalSub: (n, date) => `Today's real tools, sorted by need: ${n} tools and public services, checked on ${date}. No sponsored links.`,
      arsenalOpen: 'Open the arsenal',
      guides: 'The guides',
      guidesSub: 'Made-up characters. On every machine, one of them gives you a tip.',
      path: 'The journey',
      pathSub: 'From the idea to series A, in six levels: what to do, and what an investor looks at, at each step.',
      card: 'Your pitch card',
      cardText: 'Sum up your project on a card and share it with a simple link. Nothing is stored on our side.',
      cardOpen: 'Make my card',
      glossary: 'The glossary',
      glossaryText: (n) => `Pre-money, VAT, runway, ETF… ${n} words of business and money, explained simply.`,
      glossaryOpen: 'Open the glossary',
      lab: 'The lab',
      labSub: 'Projects launched by marketbuss.',
      labName: 'Répondeur IA',
      labText: 'An assistant that answers a shop\'s customers on its own: opening hours, prices, bookings. First version, with a demo to try. The page is in French.',
      labOpen: 'See Répondeur IA',
      studio: 'Start-up Studio',
      studioSub: 'Create your start-up and run it in one place.',
      studioText: 'Seven modules that work together: identity, team and equity, a 24-month financial plan, roadmap, tracking of real numbers, and a file ready to share. The dashboard tells you what to do next.',
      studioOpen: 'Open the studio',
    },

    tools: {
      all: 'All machines',
      allSub: (n) => `${n} machines, for seven players.`,
      search: 'Find a machine: mortgage, VAT, stock, debt…',
      noMatch: 'No machine matches. Try another word.',
      crumb: 'Machines',
      howRead: 'How to read the result',
      howUse: 'How to use it',
      inArsenal: 'In the arsenal',
      inArsenalSub: 'The real tools that go with this machine.',
      others: 'This player\'s other machines',
    },

    check: {
      label: 'points ticked',
      done: 'Everything is ticked. Have it reviewed by someone who knows the subject.',
      none: 'Tick as you go: your progress stays saved in this browser.',
      left: (n) => `${n} point${s(n)} left to deal with.`,
      progress: (a, b) => `${a} out of ${b}`,
      clear: 'Untick everything',
    },

    writer: {
      words: 'Your words',
      out: 'Your pitch',
      short: 'The short sentence',
      full: 'The full sentence',
      chars: (n) => `${n} characters`,
      charsFull: (n) => `${n} characters. The shorter it is, the better people remember it.`,
      empty: 'Fill in at least the name, the people you help and what you let them do.',
      copied: 'Sentence copied.',
      fields: {
        name: ['Project name', 'Nordlys'],
        who: ['Who do you help?', 'neighbourhood bakeries'],
        problem: ['Their problem', 'throw away unsold bread every evening', 'Optional. What comes after "who…".'],
        solution: ['What you let them do', 'sell their unsold bread before closing', 'What comes after "helps them…". Start with a verb.'],
        unlike: ['What they use today', 'a discount sign in the window', 'Optional.'],
        edge: ['What changes with you', 'locals get an alert on their phone', 'Optional.'],
      },
    },

    canvas: {
      label: 'boxes filled',
      note: 'The numbers give the suggested order. Your draft stays in this browser.',
      copy: 'Copy as text',
      copied: 'Canvas copied as text.',
      empty: 'Fill in a box first.',
      boxes: {
        problem: ['Problem', 'Your customers\' three main problems.'],
        segments: ['Customers', 'Who exactly? And who will buy first?'],
        uvp: ['Promise', 'In one sentence: why you, and not something else.'],
        solution: ['Solution', 'What you offer for each problem.'],
        channels: ['Channels', 'How customers find you and buy.'],
        revenue: ['Revenue', 'Who pays, how much, how often.'],
        costs: ['Costs', 'Your main expenses, fixed and per sale.'],
        metrics: ['Key numbers', 'The two or three numbers that tell you it is working.'],
        edge: ['Advantage', 'What a competitor cannot easily copy.'],
      },
    },

    levels: {
      title: 'The journey',
      sub: 'Six levels, from the idea to series A. Every project moves at its own pace: some skip levels, and many never need to raise money.',
      level: 'Level',
      founder: 'Founder side',
      investor: 'Investor side',
      tools: 'Useful machines:',
      arsenal: 'In the arsenal:',
    },

    pitch: {
      title: 'Your pitch card',
      sub: 'Fill in the boxes and the card updates. The link contains the whole card: nothing is stored on a server.',
      shared: 'Pitch card',
      sharedSub: 'This card was made by a visitor. marketbuss has not checked what it says.',
      broken: 'Unreadable card',
      brokenSub: 'The link is incomplete or damaged. Ask its author to send it again.',
      create: 'Make my card',
      copy: 'Copy the link to my card',
      copied: 'Link to your card copied.',
      needName: 'Give your project a name first.',
      warn: 'Only write true, checkable numbers. Everything you put on the card will be visible to whoever gets the link.',
      choose: 'Choose',
      fields: {
        name: ['Project name', 'Nordlys'],
        tagline: ['What it does, in one sentence', 'Helps bakeries cut their unsold bread'],
        stage: ['Stage', ''],
        sector: ['Sector', 'Food'],
        t1: ['Traction: one true number', '38 bakeries as customers'],
        t2: ['A second one', '€9,400 in revenue per month'],
        t3: ['A third one', '+14% per month for 6 months'],
        ask: ['What you are looking for', '€800,000'],
        contact: ['How to reach you', 'An address created for the project'],
        use: ['What the money is for', 'Hire two developers and open three cities'],
      },
      card: { project: 'Project', name: 'Project name', tagline: 'What your project does, in one sentence.', traction: 'Traction', ask: 'Looking for', contact: 'Contact', foot: 'Pitch card, made on marketbuss' },
    },

    arsenal: {
      title: 'The arsenal',
      sub: (n, k) => `Today's real tools, sorted by need: ${n} tools and public services, on ${k} shelves.`,
      notice: (date) => `Selection checked on ${date}. No sponsored links: marketbuss earns nothing. The order is not a ranking. Offers change fast: read the terms on the official site before you commit.`,
      search: 'Search for a tool or a need',
      empty: 'No tool matches. Try another word, or remove the filter.',
      fineprint: '"No subscription": a fee is taken on each payment. "Free, limited": the free plan exists but fills up fast. The names quoted belong to their owners; marketbuss has no connection with them.',
    },

    glossary: {
      title: 'The glossary',
      sub: (n) => `${n} words of business and money, explained simply.`,
      search: 'Search for a word',
      empty: 'No word matches. Try another term, or remove the filter.',
      useful: (name) => `Useful for the ${name} player`,
    },

    about: {
      title: 'About',
      sub: 'What marketbuss is, and what it is not.',
      sections: (n) => [
        ['What you will find here', [
          `${n.tools} machines to cost a project, set a price, assess an investment, understand a savings product, buy or rent a home, sell online or keep a budget. Each one shows its maths, step by step.`,
          `An arsenal of ${n.arsenal} real tools and public services, a six-level journey, a glossary of ${n.words} words and a pitch card to share.`,
          'Everything is free and needs no account.',
          'Everything is calculated in your browser: your numbers are not sent anywhere. Ticked lists and drafts stay in this browser.',
        ]],
        ['What marketbuss is not', [
          'Not financial, legal or tax advice: the tools are for understanding and practising. Before you sign or invest, get help from a professional.',
          'Not a promise: investing is risky, and you can lose everything you put in.',
          'Not a directory: marketbuss does not connect people and does not check the pitch cards visitors make.',
        ]],
        ['How the arsenal is chosen', [
          `Every tool was checked on ${n.date}: it is active, the address is its official site, and the free plan mentioned exists.`,
          'The selection draws on recent comparisons and on the official sites. It is not a ranking, and it is not complete.',
          'No sponsored or affiliate links: marketbuss earns nothing. No broker or seller of investment products is listed.',
          'Offers and prices change fast: the official site is the reference.',
          'The selection leans towards Belgium and France: some public services are in French or Dutch only.',
        ]],
        ['The characters and the examples', [
          'The players and the guides (Mira, Noé, Sam, Max, Lou, Ada, Iris, Bit, Zoé, Kai) are made-up characters. Their tips are general pointers.',
          'The values shown when a machine opens are examples invented to show the calculation. They describe no real company.',
        ]],
        ['How it is made', [
          'The site is a static page with no dependencies. The drawings are pixel art, drawn by hand in the code.',
          'The Press Start 2P and Jersey 15 fonts are under the free OFL licence and hosted with the site.',
          'The site exists in French, English and Dutch. The language you choose stays saved in this browser.',
        ]],
      ],
    },

    currency: 'Currency',
    scenario: {
      keep: 'Keep as scenario A',
      title: 'Scenario A versus now',
      a: 'Scenario A',
      now: 'Now',
      changed: 'Numbers changed',
      same: 'No number changed: change one to compare.',
      restore: 'Back to scenario A',
      clear: 'Forget A',
      kept: 'Scenario A kept. Change your numbers to compare.',
    },
    next: {
      title: 'Carry on with these numbers',
      go: (name) => `Open "${name}"`,
      passes: (labels) => `with ${labels}`,
    },
    startup: {
      title: 'Start-up Studio',
      sub: 'Create your start-up and run it in one place: identity, team, financial plan, roadmap, real numbers and file. Everything stays in this browser.',
      emptyTitle: 'Launch your start-up',
      emptyText: 'Give it a name: the studio prepares an example financial plan, a twelve-step roadmap and a dashboard. Then you replace them with your own numbers.',
      namePlaceholder: 'Start-up name',
      create: 'Create my start-up',
      needName: 'Give your start-up a name first.',
      newOne: 'New start-up',
      pick: 'Start-up',
      remove: 'Delete',
      removeConfirm: (name) => `Delete "${name}" from this browser? This can't be undone.`,
      removed: 'Start-up deleted.',
      modules: {
        tableau: ['Dashboard', 'Where your start-up stands, and what to do now.'],
        identite: ['Identity', 'The name, the pitch sentence, the sector and the stage.'],
        equipe: ['Team and equity', 'The co-founders, their roles and who owns what.'],
        plan: ['Financial plan', 'Customers, revenue, spending and cash over 24 months.'],
        route: ['Roadmap', 'The steps to do, in progress and done.'],
        suivi: ['Tracking', 'Your real numbers, month after month.'],
        dossier: ['File', 'The summary to share, the pitch card and the backup.'],
      },
      fields: {
        name: ['Name', ''],
        pitch: ['Your pitch sentence', 'E.g.: Nordlys helps bakeries sell their leftovers before closing time.'],
        sector: ['Sector', 'E.g.: food, software, fashion…'],
        stage: ['Stage', ''],
      },
      pitchHelp: 'Need help with the sentence? The "Lightning pitch" machine builds it with you.',
      founderName: 'Name',
      founderRole: 'Role',
      share: 'Share of equity (%)',
      addFounder: 'Add a co-founder',
      pool: 'Pool for future employees (%)',
      defaultFounder: (n) => `Co-founder ${n}`,
      capTitle: 'Who owns what',
      poolName: 'Employee pool',
      freeName: 'Not allocated yet',
      capOk: (free, F) => (free > 0 ? `All good. ${F.pct(free)} of the equity isn't allocated to anyone yet.` : 'All the equity is allocated.'),
      capOver: (over, F) => `The shares go over 100% by ${F.pct(over)}: lower a share or the pool.`,
      capTip: 'Plan vesting for each co-founder: the "Hourglass" machine shows how.',
      planFields: {
        cash: ['Cash at the start', '€'],
        price: ['Price per customer', '€ a month'],
        start: ['Customers at the start', 'customers'],
        newPerMonth: ['New customers in the first month', 'customers'],
        growth: ['Rise in new customers', '% a month'],
        churn: ['Customers who leave', '% a month'],
      },
      costsTitle: 'Fixed spending per month',
      costLabel: 'Expense',
      amount: 'Amount a month',
      addCost: 'Add an expense',
      hiresTitle: 'Hires',
      hireLabel: 'Role',
      hireMonth: 'From month',
      salary: 'Full cost a month',
      addHire: 'Add a hire',
      defaultCosts: ['Tools and software', 'Marketing', 'Accounting', 'Premises'],
      defaultHire: 'First developer',
      removeRow: 'Remove',
      planInvalid: 'Check the plan: amounts that are not negative, a rise from −50 to 100% and churn from 0 to 100%.',
      planVerdict(r, F) {
        let t = r.breakEven ? `Your revenue covers your spending from month ${r.breakEven}.` : "Your revenue doesn't cover your spending within the 24 months of the plan.";
        t += r.need > 0 ? ` At the lowest point, you're short ${F.money(r.need)}: that's the minimum to raise or find.` : ' Cash never goes below zero.';
        return t;
      },
      planChart: 'Your cash over 24 months',
      planTick: (m) => 'M' + m,
      planBar: (p, F) => `Month ${p.month}: ${F.money(p.cash)}, ${F.nf(p.customers)} customers`,
      planTable: ['Month', 'Customers', 'Revenue', 'Spending', 'Cash'],
      planFacts: (r, F) => [
        ['Break-even month', r.breakEven ? `month ${r.breakEven}` : 'not within 24 months'],
        ['Cash lasts', r.runway == null ? 'all 24 months' : `${r.runway} month${s(r.runway)}`],
        ['Money short at the lowest point', r.need > 0 ? F.money(r.need) : 'nothing'],
        ['Revenue in month 12', F.money(r.revenue12)],
        ['Customers in month 12', F.nf(r.customers12)],
        ['Loss in the first month', r.burn > 0 ? F.money(r.burn) : 'none'],
      ],
      columns: { todo: 'To do', doing: 'In progress', done: 'Done' },
      move: { todo: 'Back to to-do', doing: 'Start', done: 'Finish' },
      taskPlaceholder: 'New step',
      addTask: 'Add',
      openTool: 'Open the machine',
      progress: (a, b) => `${a} of ${b} steps done`,
      tasks: [
        'Ask 10 possible customers about their problem',
        'Fill in the lean canvas',
        'Write the pitch sentence',
        'Estimate the size of the market',
        'Set a first price',
        'Build a first prototype',
        'Find 3 first customers',
        'Choose a legal form and open a business account',
        "Sign a shareholders' agreement, with vesting",
        'Work out the cost and value of a customer',
        'Prepare the 10-slide deck',
        'Work out how much to raise',
      ],
      kpiFields: { month: 'Month', revenue: 'Revenue', customers: 'Customers', spend: 'Spending' },
      addKpi: 'Add this month',
      kpiEmpty: 'Each month, note your real revenue, customers and spending: the studio works out your growth and your loss, and compares them with the plan.',
      kpiChart: 'Your revenue, month after month',
      kpiTable: ['Month', 'Revenue', 'Customers', 'Spending', 'Growth', 'Loss'],
      kpiFacts: (k, F) => [
        ["Last month's revenue", F.money(k.last.revenue)],
        ["Last month's growth", k.last.growth != null ? F.pct(k.last.growth) : '—'],
        ['Average growth, last 3 months', k.avgGrowth != null ? F.pct(k.avgGrowth) : '—'],
        ["Last month's loss", k.last.burn > 0 ? F.money(k.last.burn) : 'none'],
      ],
      tiles: {
        runway: 'months of cash',
        breakEven: 'break-even month',
        need: 'to find at the lowest point',
        founders: 'of equity to co-founders',
        tasks: 'steps done',
        growth: 'growth, last month',
      },
      nextTitle: 'Your next actions',
      actions: {
        pitch: 'Write your pitch sentence.',
        cap: 'Split the equity between the co-founders.',
        capOver: 'The shares go over 100%: fix them.',
        raise: (need, F) => `You're short ${F.money(need)} over 24 months: prepare a funding round or cut your spending.`,
        profit: "You're not profitable within 24 months: rethink your price, your customers or your spending.",
        kpi: 'Note your first real numbers in tracking.',
        task: (t) => `Next step: ${t}`,
        allDone: 'Every step of the roadmap is done: add the next ones.',
      },
      go: 'Go',
      summaryTitle: 'Summary to share',
      summary(st, r, cap, k, F, stages) {
        const lines = [st.name + (st.sector ? ` · ${st.sector}` : '') + ` · ${stages[st.stage]}`];
        if (st.pitch) lines.push(st.pitch);
        if (st.founders.length) lines.push('', 'Team: ' + st.founders.map((f) => `${f.name || '?'}${f.role ? ` (${f.role})` : ''} ${F.pct(f.share)}`).join(', ') + (st.pool > 0 ? `; employee pool ${F.pct(st.pool)}` : ''));
        if (r) {
          lines.push('', `Plan: ${F.money(st.plan.price)} per customer per month, ${F.nf(r.customers12)} customers and ${F.money(r.revenue12)} of revenue in month 12.`);
          lines.push(r.breakEven ? `Break-even in month ${r.breakEven}.` : 'No break-even within 24 months.');
          if (r.need > 0) lines.push(`Funding need: ${F.money(r.need)}.`);
        }
        if (k && k.last) lines.push('', `Last real month (${k.last.month}): ${F.money(k.last.revenue)} of revenue, ${F.nf(k.last.customers)} customers` + (k.last.growth != null ? `, ${F.pct(k.last.growth)} growth.` : '.'));
        return lines.join('\n');
      },
      copySummary: 'Copy the summary',
      copied: 'Summary copied.',
      card: 'Create the pitch card',
      exportJson: 'Download the backup',
      importJson: 'Import a backup',
      imported: 'Start-up imported.',
      importFail: "This file isn't a start-up backup.",
      print: 'Print',
      backupNote: 'Everything is saved in this browser only. Download a backup to switch device or to lose nothing.',
    },
    missing: { title: 'Page not found', sub: 'This page does not exist, or the link is incomplete.', home: 'Back to the home page', tools: 'See the machines' },
  },

  roles: {
    entrepreneur: { name: 'Founder', pitch: 'I am starting a project', about: 'The tools to cost your project, tell its story and prepare a funding round.' },
    independant: { name: 'Freelancer', pitch: 'I sell my work', about: 'The tools to set your prices, find your customers and know what you have left.' },
    investisseur: { name: 'Investor', pitch: 'I fund projects', about: 'The tools to assess an investment and test scenarios.' },
    epargnant: { name: 'Saver', pitch: 'I look after my savings', about: 'The tools to see what time, fees and rising prices do.' },
    immobilier: { name: 'Property', pitch: "I'm buying or renting a home", about: 'Tools for a mortgage, a purchase, a rental or a buy-to-let investment.' },
    ecommerce: { name: 'Online seller', pitch: 'I sell online', about: 'Tools to see what your orders, ads and deliveries really earn you.' },
    budget: { name: 'Budget', pitch: 'I manage my everyday money', about: 'Tools to see where your money goes, pay off a debt and put a price on a purchase.' },
  },

  guides: {
    mentor: { name: 'Mira', job: 'the mentor', line: 'Asks the awkward questions before the investors do.' },
    accountant: { name: 'Noé', job: 'the accountant', line: 'Likes numbers that add up and invoices sent on time.' },
    dev: { name: 'Sam', job: 'the developer', line: 'Builds fast, tests early, throws away what is not needed without regret.' },
    designer: { name: 'Max', job: 'the designer', line: 'Removes everything that does not help the customer understand.' },
    client: { name: 'Lou', job: 'the customer', line: 'Buys when it is clear, useful and fairly priced. Otherwise, she leaves.' },
    banker: { name: 'Ada', job: 'the banker', line: 'Looks at the cash first, the promises second.' },
    angel: { name: 'Iris', job: 'the business angel', line: 'Invests early, loses often, and counts on a few big wins.' },
    robot: { name: 'Bit', job: 'the robot', line: 'Keeps the arsenal up to date and does the maths without getting tired.' },
    agent: { name: 'Zoé', job: 'the estate agent', line: 'Visits three times, measures everything, and reads the building accounts from start to finish.' },
    shopkeeper: { name: 'Kai', job: 'the online seller', line: 'Counts every parcel, every return and every euro of ads before celebrating a sale.' },
  },

  /* A machine: name, question, intro, fields {key: [label, unit, help]}, how to read, limits, the guide's tip. */
  tools: {
    runway: {
      name: 'Months of survival',
      question: 'How many months can I last on my cash?',
      lead: 'Your cash, what you spend, what you take in: the tool counts the months you have left before running dry.',
      fields: {
        cash: ['Cash today', '€'],
        burn: ['Spending per month', '€'],
        revenue: ['Revenue per month', '€'],
        growth: ['Revenue growth', '% per month'],
      },
      read: [
        'Each column is your cash at the end of a month. When it drops below zero, the money has run out.',
        'If your revenue catches up with your spending before then, you are profitable and the cash goes back up.',
        'A funding round often takes several months: better to start well before the last month.',
      ],
      limits: 'The calculation assumes constant spending and steady growth. In real life no two months are alike: keep a margin.',
      tip: 'Look at this number every month, not only when things go badly. Under six months, it is time to act.',
    },
    lever: {
      name: 'Full tank',
      question: 'How much should I raise to reach the next milestone?',
      lead: 'What you spend, what you take in, the number of months to fund: the tool gives the amount, and the share of the company to give up.',
      fields: {
        burn: ['Spending per month, after the round', '€', 'Including planned hires.'],
        revenue: ['Revenue per month', '€'],
        months: ['Months to fund', 'months'],
        buffer: ['Safety margin', '%', 'For delays and surprises.'],
        pre: ['Valuation before the round', '€', 'Optional: to see the share you give up.'],
      },
      read: [
        'Need = (spending − revenue) × number of months, plus the safety margin.',
        'A common rule of thumb: enough to last 18 to 24 months, because a round takes time and you need progress to show before the next one.',
        'Share given up = amount raised ÷ (valuation before the round + amount raised).',
      ],
      limits: 'The calculation assumes constant spending and revenue. If your revenue grows, the real need is lower: compare with the "Months of survival" machine.',
      tip: 'Raise to reach a precise milestone, not to "hang on". An investor wants to know what the money will prove.',
    },
    dilution: {
      name: 'Slicing the cake',
      question: 'What share do I keep after a funding round?',
      lead: 'When investors come in, your share of the company shrinks. The tool shows who owns what after the round.',
      fields: {
        pre: ['Valuation before the round', '€', 'What the company is worth before the investors\' money (pre-money).'],
        raise: ['Amount raised', '€'],
        pool: ['Pool for future employees', '%', 'Shares set aside for hiring, as a % of the company after the round.'],
        founders: ['Founders\' share before the round', '%'],
      },
      read: [
        'Valuation after the round (post-money) = valuation before + amount raised.',
        'The investors\' share = amount raised ÷ valuation after the round.',
        'Here the employee pool is taken from those who were already there, as investors often ask.',
      ],
      limits: 'A real round can include other mechanisms (convertible notes, preferred shares…) that change the split. Have the documents reviewed by a professional.',
      tip: 'A valuation that is too high today makes the next round harder. The right price is one you will be able to beat.',
    },
    vesting: {
      name: 'Hourglass',
      question: 'How many of my shares are really mine?',
      lead: 'With vesting, shares are earned over time. The tool shows what is already yours, and what you would lose by leaving today.',
      fields: {
        stake: ['Share granted', '% of the company'],
        years: ['Vesting period', 'years'],
        cliff: ['Waiting period (cliff)', 'months', 'Until this period ends, nothing is earned.'],
        elapsed: ['Time elapsed', 'months'],
      },
      read: [
        'Before the end of the cliff, nothing is earned. At the end of the cliff, all the time elapsed counts at once.',
        'After that, shares are earned month by month until the end of the period.',
        'A common pattern: 4 years, with a one-year cliff.',
      ],
      limits: 'The exact schedule, and what happens if someone leaves or the company is sold, are written in the shareholders\' agreement or the grant plan: that document is what counts.',
      tip: 'Vesting protects those who stay. Set it up between founders from the start: an investor will ask for it anyway.',
    },
    marche: {
      name: 'World map',
      question: 'How big is my market?',
      lead: 'You start from the number of possible customers and what each one brings in: the tool gives the total market, the part you can serve and the part you are aiming for.',
      fields: {
        customers: ['Possible customers in total', 'customers', 'Everyone who has the problem you solve.'],
        price: ['Revenue per customer', '€ per year'],
        reachable: ['Share you can serve', '%', 'Your country, your language, your type of customer.'],
        share: ['Share you are aiming for', '%', 'Among those you can serve, within a few years.'],
      },
      read: [
        'Total market (TAM) = possible customers × revenue per customer.',
        'Market you can serve (SAM) = the total market × the reachable share.',
        'Market you are aiming for (SOM) = the market you can serve × the share you aim for. It is the most useful number for your plan.',
      ],
      limits: 'Both percentages are assumptions: say where they come from. Market share is won one customer at a time.',
      tip: 'An investor believes a calculation that starts from customers more readily than a big number taken from a report.',
    },
    client: {
      name: 'Customer hunt',
      question: 'Does a customer bring in more than they cost me?',
      lead: 'What you spend to win a customer (CAC), and what they bring in for as long as they stay (LTV).',
      fields: {
        spend: ['Spending to find customers', '€', 'Advertising, trade fairs, tools, over a given period.'],
        customers: ['New customers over the same period', 'customers'],
        arpu: ['Revenue per customer', '€ per month'],
        margin: ['Gross margin', '%', 'What is left of the revenue once the service is delivered.'],
        churn: ['Customers who leave', '% per month'],
      },
      read: [
        'CAC = spending ÷ new customers.',
        'LTV = revenue per month × margin ÷ share of customers leaving each month.',
        'Often-quoted benchmarks: an LTV of at least 3 times the CAC, and a CAC paid back in under 12 months.',
      ],
      limits: 'With few customers or few months of history, the churn rate is very uncertain, and so is the LTV.',
      tip: 'I stay when the product helps me every week. Keeping me costs less than replacing me.',
    },
    objectif: {
      name: 'On target',
      question: 'How many customers must I win each month to reach my goal?',
      lead: 'A monthly revenue to reach, a price, customers who leave: the tool gives the number of new customers to win each month.',
      fields: {
        target: ['Revenue goal', '€ per month'],
        price: ['Revenue per customer', '€ per month'],
        current: ['Customers today', 'customers'],
        churn: ['Customers who leave', '% per month'],
        months: ['Time frame', 'months'],
      },
      read: [
        'Customers needed = revenue goal ÷ revenue per customer.',
        'Each month some of your customers leave: you have to replace them as well as grow.',
        'Lowering the churn rate cuts the number of customers to find, every month.',
      ],
      limits: 'The calculation assumes a single price and a constant churn rate. It does not tell you whether your market holds enough customers: see the "World map" machine.',
      tip: 'Before chasing new customers, ask yourself why the old ones leave.',
    },
    croissance: {
      name: 'Turbo',
      question: 'What monthly growth do I need to reach my goal?',
      lead: 'From a starting number to a target number, in a number of months: the tool gives the growth needed, month after month.',
      fields: {
        from: ['Today\'s number', '', 'Revenue, customers, users: whatever you want to grow.'],
        to: ['Target number', ''],
        months: ['Time frame', 'months'],
      },
      read: [
        'The monthly growth is the rate that, repeated every month, takes you from the start to the goal.',
        'Steady growth compounds: 10% per month multiplies the number by more than 3 in a year.',
      ],
      limits: 'Keeping the same growth for a long time gets harder and harder as the numbers get bigger.',
      tip: 'Pick one number to grow, and look at it every week.',
    },
    canvas: {
      name: 'Game plan',
      question: 'Does my project fit on one page?',
      lead: 'The lean canvas: nine boxes to describe a project. Keep it short. What you type stays in this browser.',
      read: [
        'Start with the problem and the customers: everything else depends on them.',
        'An empty or vague box shows what you do not know yet.',
        'Redo it after each round of conversations with customers: it is a draft, not a contract.',
      ],
      limits: 'The lean canvas was created by Ash Maurya, from the Business Model Canvas. It describes assumptions: only customers can confirm them.',
      tip: 'Fill it in within twenty minutes, then go and check the riskiest box with real customers.',
    },
    phrase: {
      name: 'Lightning pitch',
      question: 'How do I say my project in one sentence?',
      lead: 'A few pieces to fill in: the tool puts them together into a short sentence and a full sentence, ready to say.',
      read: [
        'The short sentence should be enough for someone who does not know your field.',
        'Say it out loud to three people. If they repeat it wrong, simplify.',
        'No empty words: "innovative", "revolutionary", "end-to-end solution" say nothing.',
      ],
      limits: 'The tool assembles your words, it does not improve them. Check the grammar before you use the sentence.',
      tip: 'If I do not understand what you sell within ten seconds, I move on.',
    },
    deck: {
      name: 'The 10 slides',
      question: 'Is my pitch deck complete?',
      lead: 'The ten slides an investor expects to find. Tick what you already have.',
      limits: 'A list does not replace a clear story: one idea per slide, and true numbers.',
      tip: 'One idea per slide. If you have to explain it out loud, it is not clear yet.',
    },
    tarif: {
      name: 'Price of time',
      question: 'What day rate do I need to live off my work?',
      lead: 'You start from what you want to keep each month: the tool works back to the day rate to charge.',
      fields: {
        net: ['What you want to keep', '€ per month', 'Once social contributions, taxes and costs are paid.'],
        days: ['Days billed', 'per month', 'Rarely every working day: you also have to find the customers.'],
        weeks: ['Weeks without billing', 'per year', 'Holidays, illness, quiet periods.'],
        charges: ['Contributions and taxes', '%', 'The part of what you earn that goes back out. It depends on the country, your status and your income.'],
        costs: ['Business costs', '€ per month', 'Software, equipment, insurance, accountant, travel.'],
      },
      read: [
        'To bill over the year = 12 × (what you want to keep per month ÷ (1 − contributions and taxes) + costs per month).',
        'Days billed over the year = days per month × 12, minus the weeks without billing.',
        'Day rate = amount to bill ÷ days billed. It is a rate before VAT.',
      ],
      limits: 'The tool does not work out your taxes: the percentage is yours to fill in with your accountant, for your country and status. Look at the usual rates in your trade too.',
      tip: 'Do not forget the days you cannot bill: finding customers, admin, holidays, illness.',
    },
    devis: {
      name: 'Express quote',
      question: 'How much should I charge for this project?',
      lead: 'Days of work, a rate, a margin for surprises, expenses: the tool gives the amount of the quote and the deposit to ask for.',
      fields: {
        days: ['Estimated days of work', 'days'],
        rate: ['Day rate', '€'],
        buffer: ['Margin for surprises', '%', 'A project almost always takes longer than planned.'],
        expenses: ['Expenses to pass on', '€', 'Travel, licences, purchases for the customer.'],
        vat: ['VAT', '%', 'Standard rate: 21% in Belgium, 20% in France. 0 if you are exempt.'],
        deposit: ['Deposit asked', '%', 'To be paid before you start.'],
      },
      read: [
        'Before VAT = days × rate, plus the margin for surprises, plus expenses.',
        'Total = before VAT + VAT.',
        'The deposit protects you if the customer disappears halfway through.',
      ],
      limits: 'A signed quote binds you: write clearly what is included, what is not, and the payment terms. The mandatory details depend on your country.',
      tip: 'Write down what is not included in the price: that is where arguments start.',
    },
    prix: {
      name: 'Price tag',
      question: 'What price should I sell at to keep my margin?',
      lead: 'The cost of your product, the margin you want to keep, VAT: the tool gives the price before VAT and the price on the label.',
      fields: {
        cost: ['Product cost', '€', 'Everything a sale costs you: materials, packaging, delivery, payment fees.'],
        margin: ['Target margin', '% of the price', 'The part of the price before VAT that stays with you.'],
        vat: ['VAT', '%', 'Standard rate: 21% in Belgium, 20% in France. Some products have a reduced rate.'],
      },
      read: [
        'Price before VAT = cost ÷ (1 − target margin).',
        'The margin is counted here as a % of the selling price. Counted as a % of the cost (markup), it is a bigger number: the tool gives both.',
        'Price on the label = price before VAT + VAT.',
      ],
      limits: 'A price has to be tested: look at what competitors charge and what your customers are willing to pay. If you are exempt from VAT, enter 0.',
      tip: 'Margin is calculated before VAT: the VAT is not yours, you pass it on.',
    },
    remise: {
      name: 'Sale',
      question: 'What does a discount really cost me?',
      lead: 'A discount comes entirely out of your margin. The tool shows how many extra sales it takes to earn as much as before.',
      fields: {
        price: ['Selling price', '€', 'Before VAT.'],
        margin: ['Margin', '% of the price'],
        discount: ['Discount', '%'],
      },
      read: [
        'The discount lowers the price, but not your cost: it is taken from your margin.',
        'Extra sales needed = margin before ÷ margin after − 1.',
        'The thinner your margin, the more a discount costs.',
      ],
      limits: 'The calculation does not say whether the discount really brings in more customers: that has to be measured. A discount can also be used to clear stock or to get people to try.',
      tip: 'A discount brings me in once. If I like the product, I come back at the normal price.',
    },
    seuil: {
      name: 'Finish line',
      question: 'How many sales until I stop losing money?',
      lead: 'The break-even point: the number of sales per month from which your costs are covered.',
      fields: {
        price: ['Selling price', '€'],
        variable: ['Cost per sale', '€', 'What each sale costs you: materials, delivery, payment fees…'],
        fixed: ['Fixed costs per month', '€', 'What you pay even without selling: rent, wages, subscriptions…'],
      },
      read: [
        'Margin per sale = selling price − cost per sale.',
        'Break-even = fixed costs ÷ margin per sale, rounded up to the next sale.',
        'Above break-even, each sale adds its margin to your profit.',
      ],
      limits: 'The calculation assumes a single product and a fixed price. With several products, work with an average sale (average price and average cost).',
      tip: 'As long as you are below break-even, every month eats into your cash. Know the date you plan to cross it.',
    },
    tunnel: {
      name: 'Funnel',
      question: 'How many visitors become customers?',
      lead: 'Visitors, a share who leave their details, a share who buy: the tool gives the sales, the revenue and what a customer costs.',
      fields: {
        visitors: ['Visitors', 'per month'],
        signup: ['Visitors who leave their details', '%', 'Sign-up, quote request, basket started.'],
        purchase: ['Contacts who buy', '%'],
        basket: ['Average purchase', '€'],
        spend: ['Spending to bring the visitors', '€ per month', 'Advertising, content, partnerships. 0 if you spend nothing.'],
      },
      read: [
        'Customers = visitors × share who leave their details × share who buy.',
        'Cost of a customer = spending ÷ customers.',
        'Doubling a rate has the same effect as doubling the visitors, and often costs less.',
      ],
      limits: 'Rates vary a lot from one trade to another: measure your own rather than borrowing other people\'s.',
      tip: 'First improve the step where you lose the most people: that is where the effort pays off most.',
    },
    tirelire: {
      name: 'Piggy bank',
      question: 'How much should I set aside from each invoice?',
      lead: 'When a customer pays you, not all of it is yours. The tool separates VAT, contributions and taxes, and what is really left for you.',
      fields: {
        amount: ['Invoice amount', '€', 'Before VAT.'],
        vat: ['VAT', '%', '0 if you are exempt.'],
        charges: ['Contributions and taxes', '%', 'The part of the amount before VAT that will go back out. It depends on the country, your status and your income.'],
      },
      read: [
        'VAT you collect is not income: it is passed on to the state.',
        'Contributions and taxes are paid later, sometimes a year later: without a reserve, the bill arrives when the money is already spent.',
        'The simplest way: move the amount to set aside to another account the day the customer pays.',
      ],
      limits: 'The tool does not work out your taxes: the percentage is an estimate to set with your accountant. Your business costs are not counted.',
      tip: 'Open a second account for the money that is not yours. What you do not see, you do not spend.',
    },
    lancement: {
      name: 'Ready, set, go',
      question: 'Am I ready to bill my first customer?',
      lead: 'Ten points to settle before you send your first invoice. Tick what is done.',
      limits: 'A general list: the exact steps depend on your country and your trade. The public bodies in the arsenal give information for free.',
      tip: 'The rules change with the country and your status. An hour with an accountant at the start saves a lot of trouble.',
    },
    ticket: {
      name: 'Coin return',
      question: 'What is my stake worth if the company is sold?',
      lead: 'An amount invested, a valuation at entry, one at exit: the tool gives the multiple and the return per year.',
      fields: {
        ticket: ['Amount invested', '€'],
        post: ['Valuation at entry, after the round', '€'],
        dilution: ['Dilution in later rounds', '%', 'With each new round, your share shrinks.'],
        exit: ['Valuation at exit', '€'],
        years: ['Duration', 'years'],
      },
      read: [
        'Your share at entry = amount invested ÷ valuation after the round.',
        'What you get back = your share at exit × valuation at exit.',
        'The return per year (IRR) is the rate that, repeated every year, gives this multiple.',
      ],
      limits: 'It is a scenario, not a forecast. Many young companies never return the money, and an exit can take far longer than planned.',
      tip: 'I assume every stake can go to zero. I only put in what I can afford to lose.',
    },
    valo: {
      name: 'Entry price',
      question: 'At what valuation should I come in to aim for my multiple?',
      lead: 'You start from the exit you hope for and the multiple you aim for: the tool works back to the maximum valuation at entry.',
      fields: {
        exit: ['Hoped-for valuation at exit', '€'],
        multiple: ['Target multiple', 'times the stake'],
        dilution: ['Dilution in later rounds', '%'],
        ticket: ['Amount invested', '€', 'Optional: to see your share.'],
      },
      read: [
        'Maximum valuation after the round = exit valuation × (1 − dilution) ÷ target multiple.',
        'Above this valuation, you would need a bigger exit to reach the same multiple.',
      ],
      limits: 'Everything rests on the hoped-for exit, which nobody knows in advance. Test several scenarios.',
      tip: 'The entry price is the only thing you control. The exit, nobody knows.',
    },
    portefeuille: {
      name: 'Roll of the dice',
      question: 'What does a portfolio of young companies return?',
      lead: 'Many failures, a few middling results, rare big wins: the tool shows what that adds up to overall.',
      fields: {
        count: ['Companies in the portfolio', 'companies'],
        ticket: ['Amount put into each', '€'],
        fail: ['Those that return nothing', '%'],
        mid: ['Those that return a little', '%'],
        midMultiple: ['What they return', 'times the stake'],
        winMultiple: ['What the big wins return', 'times the stake', 'The big wins: whatever is left once the two other groups are taken out.'],
      },
      read: [
        'Portfolio multiple = the sum, for each group, of its share × what it returns.',
        'Look at the "without the big wins" line: that is what is left if no winner turns up.',
        'With few companies, having no big win at all is common.',
      ],
      limits: 'These percentages are your assumptions, not statistics. In real life the result hangs on a few companies, the money is locked up for many years, and you can lose it all.',
      tip: 'A single stake is a bet. It takes many to have a chance of landing on a winner.',
    },
    suivre: {
      name: 'Staying in the race',
      question: 'How much must I put back in to keep my share?',
      lead: 'With each new round, your share shrinks unless you put more money in. The tool gives the amount, and what your share becomes if you do not follow.',
      fields: {
        stake: ['Your share today', '% of the company'],
        pre: ['Valuation before the round', '€'],
        raise: ['Amount of the round', '€'],
      },
      read: [
        'To keep the same share, you have to put in your share of the amount raised.',
        'If you do not follow, your share = current share × valuation before ÷ valuation after.',
        'Your share drops as a percentage, but it can be worth more if the valuation has gone up.',
      ],
      limits: 'The right to follow (pro rata) has to be written into the signed documents: it is not automatic. The calculation ignores pools created for employees.',
      tip: 'Following means putting more money into a company you already know: that is often where most of the return comes from, and most of the risk too.',
    },
    fonte: {
      name: 'Ice cube',
      question: 'What happens to my share after several rounds?',
      lead: 'With each round, new shares are created and your share melts a little. The tool shows the effect of several rounds.',
      fields: {
        stake: ['Your share today', '% of the company'],
        rounds: ['Number of rounds to come', 'rounds'],
        dilution: ['Dilution at each round', '%', 'The share of the company given to the newcomers at each round.'],
      },
      read: [
        'At each round, your share is multiplied by (1 − dilution).',
        'Dilutions compound: three rounds at 20% take away nearly half.',
      ],
      limits: 'Dilution is never the same from one round to the next, and a smaller share can be worth more if the valuation rises.',
      tip: 'A small share of a big company can be worth more than a big share of a small one. Look at the value, not only the percentage.',
    },
    convertible: {
      name: 'Entry voucher',
      question: 'What share does a SAFE or BSA-AIR give at the next round?',
      lead: 'Money now, shares later. The tool shows the share obtained when the next round arrives, depending on the cap and the discount.',
      fields: {
        amount: ['Amount put in', '€'],
        cap: ['Valuation cap', '€', '0 if there is none.'],
        discount: ['Discount', '%'],
        pre: ['Valuation before the next round', '€'],
        raise: ['Amount of the next round', '€'],
      },
      read: [
        'The holder converts at the lower of two prices: the cap price, or the round price minus the discount.',
        'The lower the cap compared with the round valuation, the bigger the holder\'s share.',
        'Convention used here: the round price is set on the shares that already exist, before conversion.',
      ],
      limits: 'Every contract has its own calculation rules (pre- or post-money basis, employee pool, interest…). Only the signed text counts: have it reviewed by a professional.',
      tip: 'Read the cap and the discount carefully: they set the share, not just the amount.',
    },
    cascade: {
      name: 'Waterfall',
      question: 'Who gets what on the day of the sale?',
      lead: 'When the company is sold, investors often get paid first. The tool shows the split depending on the sale price.',
      fields: {
        exit: ['Sale price of the company', '€'],
        invested: ['Amount put in by the investors', '€'],
        stake: ['Investors\' share', '% of the company'],
        multiple: ['Liquidation preference', 'times the stake', '1: they get their money back first. 0: no preference.'],
      },
      read: [
        'Investors take the larger of two amounts: their stake (times the preference), or their share of the sale price.',
        'Below the threshold price, they take the preference: the other shareholders get less than their share of the company.',
        'Above the threshold price, everyone is paid according to their share.',
      ],
      limits: 'A simple case: one class of investors, a "non-participating" preference, no debt and no sale costs. The real split follows the agreement and the articles, round by round.',
      tip: 'The percentage of the company does not tell the whole story. Always ask in what order the money is paid out.',
    },
    note: {
      name: 'Report card',
      question: 'What mark should I give this startup?',
      lead: 'Five criteria, marked from 0 to 10. The tool works out a mark out of 100 and shows the weakest point.',
      fields: {
        team: ['Team', 'out of 10', 'Complementary, full-time, able to sell and to build.'],
        market: ['Market', 'out of 10', 'Big enough, and growing.'],
        traction: ['Traction', 'out of 10', 'Customers, revenue, proven growth.'],
        product: ['Product', 'out of 10', 'It works, and it is hard to copy.'],
        terms: ['Terms', 'out of 10', 'Reasonable valuation and rights.'],
      },
      read: [
        'Each criterion carries a different weight: team 30, market 25, traction 20, product 15, terms 10.',
        'The mark is for comparing several deals with the same grid, not for deciding in your place.',
        'Look above all at the weakest point: a very bad mark on one criterion cannot be made up for elsewhere.',
      ],
      limits: 'The weights are an example, to adapt to the way you invest. A mark replaces neither the checks nor the conversations with the founders and their customers.',
      tip: 'Mark the deal before the meeting, then after. If the mark jumps, ask yourself whether it is the facts or the charm.',
    },
    diligence: {
      name: 'Magnifying glass',
      question: 'Have I checked the essentials before investing?',
      lead: 'Twelve questions to ask yourself before signing. Tick the ones you have a solid answer to.',
      limits: 'A list of questions does not replace a lawyer\'s or an accountant\'s opinion on the documents.',
      tip: 'What is not written down and proven does not exist. Ask for the documents.',
    },
    composes: {
      name: 'Snowball',
      question: 'What do my payments become with compound interest?',
      lead: 'One year\'s gains themselves produce gains the following year. Over time, the effect becomes visible.',
      fields: {
        initial: ['Starting capital', '€'],
        monthly: ['Payment', '€ per month'],
        rate: ['Return', '% per year'],
        years: ['Duration', 'years'],
      },
      read: [
        'In yellow, what you paid in. In green, what interest added.',
        'The longer the duration, the faster the green part grows: that is the snowball effect.',
      ],
      limits: 'The return is assumed constant. In real life it varies from year to year and can be negative; fees, taxes and inflation are not counted.',
      tip: 'Time does a large part of the work: the earlier you start, the longer each payment has to grow.',
    },
    cible: {
      name: 'Bullseye',
      question: 'How much should I pay in each month to reach my goal?',
      lead: 'An amount to reach, a duration, a return: the tool gives the monthly payment needed.',
      fields: {
        target: ['Amount to reach', '€'],
        years: ['Duration', 'years'],
        rate: ['Return', '% per year', '0 for an account that pays nothing.'],
        initial: ['Already set aside', '€'],
      },
      read: [
        'The more time you have, the more of the distance interest covers for you.',
        'With no return, the payment is simply the missing amount divided by the number of months.',
      ],
      limits: 'The return is assumed constant; fees, taxes and inflation are not counted. In ten years, the target amount will buy less than it does today.',
      tip: 'Schedule the transfer for the day you get paid. What leaves on its own no longer takes willpower.',
    },
    frais: {
      name: 'Nibbler',
      question: 'What do fees cost me over time?',
      lead: 'The same investment, with two levels of yearly fees: the tool shows the gap at the end.',
      fields: {
        initial: ['Starting capital', '€'],
        monthly: ['Payment', '€ per month'],
        rate: ['Return before fees', '% per year'],
        feeA: ['Fees of investment A', '% per year'],
        feeB: ['Fees of investment B', '% per year'],
        years: ['Duration', 'years'],
      },
      read: [
        'Yearly fees are taken off the return, every year.',
        'The gap grows with time: money that left as fees no longer earns interest.',
      ],
      limits: 'Return assumed constant; entry and exit fees, taxes and inflation not counted. A product\'s real fees are written in its key information document.',
      tip: 'One or two points of fees look like nothing over a year. Over thirty years, they are a big slice of the result.',
    },
    inflation: {
      name: 'Leaky balloon',
      question: 'What will my money be worth in twenty years?',
      lead: 'When prices rise, the same sum buys less. The tool shows what it will really be worth, with or without a return.',
      fields: {
        amount: ['Sum today', '€'],
        inflation: ['Price rises', '% per year'],
        years: ['Duration', 'years'],
        rate: ['Return on the investment', '% per year', '0 if the money sleeps in an account that pays nothing.'],
      },
      read: [
        'Real value = sum shown ÷ cumulative price rises.',
        'Real return = the return on the investment, once price rises are taken out.',
        'A return equal to price rises keeps your purchasing power, without increasing it.',
      ],
      limits: 'Price rises change from year to year: nobody knows what they will be over the next twenty years.',
      tip: 'An account that pays nothing loses value every year, without the number on the screen moving.',
    },
    reserve: {
      name: 'Tank',
      question: 'How long can my savings pay me an income?',
      lead: 'A lump sum, a withdrawal each month, a return: the tool counts the years before the capital is empty.',
      fields: {
        capital: ['Capital', '€'],
        monthly: ['Withdrawal', '€ per month'],
        rate: ['Return', '% per year'],
      },
      read: [
        'Each month the capital earns its return, then you take out your amount.',
        'If the withdrawal is smaller than what the capital earns, it never runs out.',
      ],
      limits: 'The return is assumed constant. In real life it varies, and a bad year early on empties the capital faster. Taxes, fees and inflation are not counted.',
      tip: 'Taking out €500 a month in twenty years will not pay for what €500 pays for today: think about rising prices.',
    },
    coussin: {
      name: 'Cushion',
      question: 'Do I have enough emergency savings?',
      lead: 'Emergency savings are what lets you last several months without income. The tool gives the amount to aim for, and the time to get there.',
      fields: {
        expenses: ['Your spending', '€ per month', 'Rent, food, transport, subscriptions: what goes out every month.'],
        months: ['Months to cover', 'months', 'Often 3 to 6 months. More if your income is irregular.'],
        saved: ['Already set aside', '€'],
        monthly: ['What you can save', '€ per month'],
      },
      read: [
        'Amount to aim for = spending per month × months to cover.',
        'These savings must stay available straight away, with no risk of loss: they are not an investment.',
      ],
      limits: 'The right number of months depends on your situation: how stable your income is, who depends on you, your housing. It is a pointer, not a rule.',
      tip: 'Build this cushion before investing anything: it is what keeps you from selling at the worst moment.',
    },
    avant: {
      name: 'Shield',
      question: 'Am I ready to invest my money?',
      lead: 'Ten points to check before investing money. Tick the ones that are settled.',
      limits: 'A list to think with, not personal advice: your situation, your taxes and your plans matter. If in doubt, ask an authorised adviser.',
      tip: 'High return, no risk and urgent: the three together are the sign of a scam.',
    },
    credit: {
      name: 'Keys in hand',
      question: 'How much does my mortgage cost?',
      lead: 'The amount, the rate, the term: the tool gives the monthly payment, the total cost and what you repay each year.',
      fields: {
        amount: ['Amount borrowed', '€'],
        rate: ['Interest rate', '% a year', 'The nominal rate, without insurance.'],
        years: ['Term', 'years'],
        insurance: ['Borrower insurance', '% a year', 'As a % of the amount borrowed. Often between 0.1% and 0.5%.'],
      },
      read: [
        'The monthly payment stays the same from start to finish. What changes is what it pays for: at first, mostly interest.',
        'The total cost is the interest plus the insurance: what you pay on top of the amount borrowed.',
        'A longer term lowers the monthly payment but raises the total cost: try the "years" buttons.',
      ],
      limits: "Fixed rate, no arrangement or guarantee fees, and insurance worked out on the starting amount. Your bank's offer is what counts: look at its APR.",
      tip: 'Compare offers on the APR, not on the rate alone: it also counts the insurance and the fees.',
    },
    capacite: {
      name: 'Borrowing gauge',
      question: 'How much can I borrow?',
      lead: 'Your income, your current loans and the share you want to spend on them: the tool works out the possible monthly payment and how much you can borrow.',
      fields: {
        income: ['Household net income', '€ a month'],
        debts: ['Loans already running', '€ a month'],
        ratio: ['Maximum share for loans', '% of income', 'A common benchmark: 35%.'],
        rate: ['Rate, insurance included', '% a year'],
        years: ['Term', 'years'],
      },
      read: [
        'The possible monthly payment is the share of your income set aside for loans, minus the loans you already have.',
        'The amount depends a lot on the term and the rate: five more years can add tens of thousands of euros.',
        "Keep a comfortable amount to live on: the bank saying yes doesn't make it wise.",
      ],
      limits: 'A rough figure. Each bank also looks at your deposit, your job situation, what you have left to live on and its own rules.',
      tip: 'Turn up at the bank with tidy bank statements and savings that remain after the purchase: that often makes the difference.',
    },
    rendement: {
      name: 'Rental yield',
      question: 'How much does this rental really earn?',
      lead: 'The price, the costs, the rent and the expenses: the tool works out the gross yield, the one in the listings, and the net yield, the one that matters.',
      fields: {
        price: ['Purchase price', '€'],
        costs: ['Buying costs and works', '€', 'Notary or registration duties, agency, works before letting.'],
        rent: ['Rent, without service charges', '€ a month'],
        charges: ['Expenses you pay', '€ a year', 'Property tax, non-recoverable service charges, insurance, upkeep.'],
        vacancy: ['Months without a tenant', 'months a year'],
      },
      read: [
        "Gross yield = a year's rent ÷ price. It's the figure in the listings, but it leaves out costs and expenses.",
        'Net yield = (rent collected − expenses) ÷ (price + costs). That is the one to compare with an investment.',
        'The figure is before tax and without a loan: for the loan, use the "Cash flow" machine.',
      ],
      limits: 'Before tax, without a loan and without resale. Rents, expenses and empty months change from year to year.',
      tip: 'A very high gross yield often hides a difficult area or big works. Go and see it, twice.',
    },
    cashflow: {
      name: 'Cash flow',
      question: 'Does this rental earn or cost me money each month?',
      lead: 'The rent on one side; the loan, the expenses and a reserve for works on the other: the tool gives what is left each month.',
      fields: {
        rent: ['Rent', '€ a month'],
        vacancy: ['Share of the year without a tenant', '%', 'About 5% = just over two weeks a year.'],
        charges: ['Expenses you pay', '€ a month', 'Property tax, building charges, insurance, management, per month.'],
        loan: ['Mortgage payment', '€ a month', 'The "Keys in hand" machine works it out.'],
        works: ['Reserve for works', '% of rent'],
      },
      read: [
        'Positive: the home pays its loan and leaves you something. Negative: you top it up from your own pocket each month.',
        'A slightly negative cash flow can still be a good investment, because you repay capital each month. But you have to be able to pay it for a long time.',
        'The reserve for works avoids nasty surprises: boiler, roof, refreshing the place between tenants.',
      ],
      limits: 'Before tax. The rent can fall and a tenant can stop paying: keep savings on the side.',
      tip: 'Test a rent 10% lower and two months without a tenant: if the figure is still bearable, the project is solid.',
    },
    louer: {
      name: 'Rent or buy',
      question: 'Is it better to rent or to buy my home?',
      lead: 'Two lives side by side: one buys, the other rents and invests the difference. The tool compares their wealth, year after year.',
      fields: {
        price: ['Price of the home', '€'],
        buyCosts: ['Buying costs', '% of price', 'Notary or registration duties, guarantee, arrangement fees.'],
        deposit: ['Deposit', '€'],
        rate: ['Mortgage rate', '% a year'],
        years: ['Mortgage term', 'years'],
        rent: ['Rent for a similar home', '€ a month'],
        growth: ['Rise in prices and rents', '% a year'],
        invest: ['Return on invested money', '% a year', 'What the deposit would earn if it were invested instead of going into the home.'],
        horizon: ['Compare after', 'years'],
      },
      read: [
        'Each column is the wealth gap between the buyer and the renter. Orange: buying is ahead. Cyan: renting is ahead.',
        'The renter invests the deposit, then each month whatever they spend less than the buyer. If renting costs more, the buyer invests the difference.',
        'The longer you stay, the more likely buying wins: the buying costs are only paid once.',
      ],
      limits: 'The owner also pays 1% of the price a year (tax, upkeep). No tax, no selling costs, and prices that rise steadily: reality is bumpier.',
      tip: 'The real question is often: how long will you stay? Under five years, renting often wins.',
    },
    visite: {
      name: 'Viewing',
      question: 'Have I checked everything before buying?',
      lead: 'Ten points to look at before signing for a home. Tick the ones that are sorted.',
      limits: 'A list so you forget nothing, not legal advice: the rules change from country to country. Have the preliminary contract checked by a notary or a lawyer.',
      tip: 'Visit on a weekday evening and on a Saturday: the noise, the parking and the neighbours are not the same.',
    },
    pub: {
      name: 'Profitable ads',
      question: 'Are my ads really making money?',
      lead: 'Your basket, your costs, your ad budget and the orders it brought: the tool works out the profit, the ROAS, and the minimum ROAS to avoid losing money.',
      fields: {
        basket: ['Average basket', '€', 'Without VAT.'],
        cogs: ['Cost of the products', '€ per order'],
        shipping: ['Delivery you pay', '€ per order'],
        fees: ['Payment fees', '% of basket'],
        spend: ['Ad budget', '€'],
        orders: ['Orders from the ads', 'orders'],
      },
      read: [
        "ROAS = revenue ÷ ad budget. A ROAS of 3 doesn't mean you make money: it all depends on your margin.",
        'The break-even ROAS is the minimum to pay for the products, the delivery and the fees. Below it, each order costs you.',
        "The cost per order mustn't exceed the margin on an order: that's the maximum cost per order.",
      ],
      limits: 'One order per customer, no returns: a customer who comes back is worth more. Ad platforms often report optimistic figures.',
      tip: 'Work out your break-even ROAS before launching a campaign, and cut whatever stays below it after a week.',
    },
    livraison: {
      name: 'Free delivery',
      question: 'From what basket should I offer free delivery?',
      lead: 'What a delivery costs and your margin: the tool gives the basket from which free delivery pays for itself.',
      fields: {
        basket: ['Average basket today', '€'],
        margin: ['Margin on products', '% of price'],
        shipping: ['Cost of a delivery', '€'],
        orders: ['Orders per month', 'orders'],
      },
      read: [
        'Free delivery costs one shipment on every order. To pay for it, the basket must be bigger by at least: delivery cost ÷ margin.',
        'Setting the threshold just above your average basket nudges customers to add an item.',
        'If your margin is thin, free delivery is very expensive: raise your prices a little instead.',
      ],
      limits: "Doesn't count the extra customers free delivery brings, nor those who abandon their basket because of delivery costs.",
      tip: "Suggest a small item to add when the customer is just under the threshold: it's often the one they take.",
    },
    stock: {
      name: 'Stock',
      question: 'When should I reorder stock?',
      lead: "Your sales per day, the supplier's lead time and your safety margin: the tool gives the reorder point and the days of stock you have left.",
      fields: {
        daily: ['Sales per day', 'units'],
        lead: ['Supplier lead time', 'days', 'Between your order and the stock arriving.'],
        safety: ['Safety stock', 'days', 'For delays and sales peaks.'],
        stock: ['Stock today', 'units'],
        cost: ['Purchase cost of one unit', '€'],
      },
      read: [
        'Reorder point = sales per day × (lead time + safety). When your stock drops below it, order.',
        'If your stock is already below it, you risk running out before the next delivery.',
        'Too much stock ties up money: its value is shown so you can see it.',
      ],
      limits: 'Steady sales. Before sales periods, holidays or a campaign, plan for more.',
      tip: "Write down the real lead time of every supplier delivery: the promised one is almost always shorter.",
    },
    retours: {
      name: 'Returns',
      question: 'How much do returns cost me?',
      lead: 'Your orders, your return rate and what a return costs: the tool gives the monthly cost and the share of your margin that goes with it.',
      fields: {
        orders: ['Orders per month', 'orders'],
        rate: ['Return rate', '%'],
        basket: ['Average basket refunded', '€'],
        cogs: ['Cost of the products', '€ per order'],
        back: ['Return costs you pay', '€ per parcel'],
        lost: ['Products unsellable after return', '%'],
      },
      read: [
        'A return loses you the margin on the sale, the return costs and, if the product is damaged, what it cost you.',
        'Clothes and shoes are often returned: an accurate size guide brings returns down.',
        'Compare this cost with what better photos, a more precise product page or a size guide would cost.',
      ],
      limits: 'Leaves out the time spent handling returns, and the outbound delivery already paid.',
      tip: 'Ask for the reason for each return: a few reasons often explain almost all of them.',
    },
    marketplace: {
      name: 'Marketplace',
      question: 'Sell on a marketplace or on my own shop?',
      lead: 'The same product, two channels: the tool compares what you keep per sale on a marketplace and on your own shop.',
      fields: {
        price: ['Selling price', '€', 'Without VAT.'],
        cogs: ['Cost of the product', '€'],
        commission: ['Marketplace commission', '%'],
        fixedFee: ['Fixed fee per sale', '€'],
        siteFees: ['Payment fees on your shop', '%'],
        siteAds: ['Ads per sale on your shop', '€', 'What you spend on advertising to get one sale.'],
      },
      read: [
        'A marketplace takes a commission but brings you customers. Your shop costs less per sale, but you have to pay to bring customers in.',
        'The ad threshold is the amount per sale above which your shop earns less than the marketplace.',
        'Many sellers use both: the marketplace to be found, the shop for customers who come back.',
      ],
      limits: "No subscription, storage fees or returns. Commissions vary by category: check the platform's fee table.",
      tip: 'Slip a card into every parcel sold on the marketplace: next time, the customer can order from you.',
    },
    boutique: {
      name: 'Opening day',
      question: 'Is my online shop ready to open?',
      lead: 'Ten points to sort out before opening an online shop. Tick the ones that are done.',
      limits: 'The rules depend on the country you sell in: check the exact obligations with an accountant or your chamber of commerce.',
      tip: 'Place a real order on your shop, from the product page to the parcel arriving, before your first customer.',
    },
    budget: {
      name: 'Monthly budget',
      question: 'Where does my money go each month?',
      lead: 'Your income, your essential spending and your wants: the tool shows what you have left and compares it with the 50 / 30 / 20 benchmark.',
      fields: {
        income: ['Net income for the month', '€'],
        needs: ['Essential spending', '€', 'Rent, groceries, energy, transport, insurance, loans.'],
        wants: ['Wants', '€', 'Going out, subscriptions, clothes, trips…'],
      },
      read: [
        "The 50 / 30 / 20 benchmark: half for essentials, 30% for wants, 20% put aside. It's a starting point, not a rule.",
        "If essentials take more than half, it isn't necessarily your fault (high rent, for example): the room to move is often in the wants.",
        'What is left only really gets saved if you put it aside at the start of the month, not at the end.',
      ],
      limits: 'A typical month. Rare expenses (gifts, repairs, tax) count too: divide them by twelve.',
      tip: "Set up a transfer to your savings on the day your pay arrives: what you don't see, you don't spend.",
    },
    dette: {
      name: 'Debt escape',
      question: 'How long until I pay off my debt?',
      lead: 'What you owe, the rate and your payment: the tool gives the number of months, the interest paid, and what you save by paying a bit more.',
      fields: {
        balance: ['Left to repay', '€'],
        rate: ['Debt rate', '% a year', 'The APR shown on your statement or contract.'],
        payment: ['Payment per month', '€'],
        extra: ['Extra each month, to compare', '€'],
      },
      read: [
        'At first, a large part of the payment only covers interest. If the payment barely covers it, the debt hardly goes down.',
        'Paying a bit more each month cuts both the time and the interest: the "saved" figure shows it.',
        'With several debts, repay the most expensive one first, paying the minimum on the others.',
      ],
      limits: 'Fixed rate and constant payment, no fees or penalties. A credit card or revolving credit can change rate: check your contract.',
      tip: "If you can't keep up, talk to your bank or a public debt advice service before the first missed payment.",
    },
    heures: {
      name: 'Price in hours',
      question: 'How many hours of work does this purchase cost?',
      lead: 'The price, your income and your hours: the tool turns the purchase into hours of work, and shows what the money would become if invested.',
      fields: {
        price: ['Price of the purchase', '€'],
        income: ['Net income', '€ a month'],
        hours: ['Hours worked', 'a month', 'Full time at 35 hours a week is about 151 hours a month.'],
        years: ['If the money were invested for', 'years'],
        rate: ['at a return of', '% a year'],
      },
      read: [
        'Your hourly income = net income ÷ hours worked. The price divided by that gives the hours to work.',
        "It isn't about guilt, it's about choosing: a purchase worth its hours is a good purchase.",
        'The invested value shows the hidden cost of a purchase: what the money could have become.',
      ],
      limits: "Net income as you enter it, and a steady return, which doesn't exist in real life.",
      tip: "For a purchase that isn't urgent, wait 48 hours: if you still think about it, it really matters to you.",
    },
    voiture: {
      name: 'True car bill',
      question: 'How much does my car really cost?',
      lead: 'The purchase, the resale, the energy and the fixed costs: the tool gives the cost per month and per kilometre.',
      fields: {
        price: ['Purchase price', '€'],
        years: ['Kept for', 'years'],
        resale: ['Resale value', '% of price'],
        km: ['Kilometres a year', 'km'],
        use: ['Consumption', 'L or kWh / 100 km'],
        energy: ['Energy price', '€ per L or kWh'],
        fixed: ['Insurance, servicing, parking', '€ a year'],
      },
      read: [
        'The loss of value at resale is often the biggest cost, and the least visible.',
        'The cost per kilometre helps you compare with the train, the bike, car sharing or renting.',
        'For an electric car, enter the consumption in kWh and the price per kWh.',
      ],
      limits: 'No loan, unexpected repairs, tolls or fines. Energy prices change.',
      tip: 'Compare the monthly cost with public transport plus a few rentals a year.',
    },
    menage: {
      name: 'Big clean-up',
      question: 'Are my finances in order?',
      lead: 'Ten points to put your money in order. Tick the ones that are done.',
      limits: 'A general list, not personal advice. For difficult debts, public services and charities help for free.',
      tip: 'Do this clean-up once a year, always in the same month: forgotten subscriptions always come back.',
    },
  },

  checklists: {
    deck: [
      ['The problem', 'Who suffers from what, and how much it costs them today.'],
      ['The solution', 'What you do, in one sentence a 12-year-old understands.'],
      ['The product', 'A demo, screenshots: showing beats describing.'],
      ['The market', 'How many possible customers, and which ones first.'],
      ['The business model', 'Who pays, how much, and how often.'],
      ['Traction', 'Customers, revenue, growth: only true, checkable numbers.'],
      ['The competition', 'The other solutions, and why a customer would choose you.'],
      ['The team', 'Why you are the right people for this project.'],
      ['The round', 'The amount, what it pays for, and how far it takes you.'],
      ['What comes next', 'The next goals, with dates, and how to reach you.'],
    ],
    lancement: [
      ['A status chosen', 'Sole trader or company: you know which one, and what it changes for your contributions.'],
      ['A registered business', 'You have your company number and you know where it must appear.'],
      ['VAT sorted out', 'You know whether you must charge it or are exempt, and you write it on your invoices.'],
      ['A separate account', 'The money of the business does not mix with your personal money.'],
      ['Compliant invoices', 'Mandatory details, numbering, and electronic sending where it is required.'],
      ['A tested price', 'Your rate covers your costs, your days without billing and your income. A customer has already accepted it.'],
      ['A quote or a contract', 'What you do, by when, for how much, and when you get paid: in writing, before you start.'],
      ['Insurance', 'You know which policies are mandatory in your trade, and which are useful.'],
      ['A reserve for taxes', 'Each month you set aside what you will owe in contributions and taxes.'],
      ['Three months ahead', 'Enough to live on if a customer pays late or a month is empty.'],
    ],
    diligence: [
      ['The team', 'Who are the founders, what do they do full-time, have they known each other long?'],
      ['The problem', 'Do customers confirm that it is real and painful?'],
      ['The product', 'Have I seen it work myself?'],
      ['The customers', 'Can I talk to two or three customers?'],
      ['The numbers', 'Are revenue and growth backed by documents?'],
      ['The market', 'Is it big enough for the exit hoped for?'],
      ['The competition', 'Who else solves this problem, and with what resources?'],
      ['The business model', 'Does a customer bring in more than they cost?'],
      ['The ownership', 'Who owns what today, and what has already been promised?'],
      ['The legal side', 'Brand, code, contracts: does everything really belong to the company?'],
      ['The use of funds', 'What does the round pay for, and for how many months?'],
      ['The terms', 'Valuation, rights and documents: reviewed by a professional?'],
    ],
    avant: [
      ['Emergency savings', 'Enough to cover several months of spending, available straight away, before investing the rest.'],
      ['No expensive debt', 'A high-interest loan often costs more than an investment returns.'],
      ['A time frame', 'You know in how many years you will need this money.'],
      ['You understand the product', 'You can explain in two sentences where the return comes from, and what can make it fall.'],
      ['You know the fees', 'Entry fees, yearly fees, exit fees: you have read them in the key information document.'],
      ['The risk is written down', 'You know how much you can lose, and you can bear it.'],
      ['The seller is authorised', 'You have checked their name with your country\'s regulator: the FSMA in Belgium, the AMF in France.'],
      ['No miracle promise', 'Nobody has promised you a high, guaranteed return to grab right now.'],
      ['Several baskets', 'Your money does not depend on a single company, sector or country.'],
      ['Taxes', 'You know how the gains will be taxed in your country.'],
    ],
    visite: [
      ['The full budget', "Price, buying costs, works, moving: you have the total, and you'll still have savings afterwards."],
      ['A nod from the bank', 'A bank has looked at your file and given you a possible amount.'],
      ['The surveys', 'Energy, asbestos, lead, electrics, gas: you have read them, not just received them.'],
      ['The real running costs', 'Building charges, property tax, energy: the amounts for recent years.'],
      ['The building', 'Minutes of the latest owners\' meetings: works voted or coming up, unpaid charges.'],
      ['The works', 'Roof, heating, windows, damp: a professional has given a rough price.'],
      ['The area, at different times', 'Noise, parking, transport, shops: visited on a weekday and at the weekend.'],
      ['The planning rules', "What can be built around it, and what you're allowed to change."],
      ['Local prices', 'You compared with recent sales, not only with listings.'],
      ['A way out', 'The preliminary contract lets you pull out if your mortgage is refused.'],
    ],
    boutique: [
      ['Your status', 'Your business is registered and you know how VAT applies to your sales.'],
      ['The legal notice', 'Business name, address, company number, contact: visible on the site.'],
      ['The terms of sale', 'Prices, delivery, payment, guarantees, returns: written clearly.'],
      ['The right of withdrawal', 'In the European Union, customers have 14 days to change their mind: the steps are explained.'],
      ['Personal data', 'Privacy policy and cookie banner compliant with the GDPR.'],
      ['Payment tested', 'A real order paid, refunded, and the money safely in your account.'],
      ['Delivery priced', 'Rates, times and packaging tested, including for a heavy or distant parcel.'],
      ['Complete product pages', 'Sharp photos, dimensions, materials, size guide: enough to avoid returns.'],
      ['Customer service', 'An email address that someone reads, and a stated reply time.'],
      ['The basic figures', 'Margin per product, break-even ROAS and cost of a return, worked out before paying for ads.'],
    ],
    menage: [
      ['Subscriptions', "You've listed every direct debit of the month and stopped the ones you no longer use."],
      ['A simple budget', 'You know how much comes in, how much goes out, and what is left at the end of the month.'],
      ['An emergency fund', 'Enough for a few months of spending, in a separate account.'],
      ['Debts listed', 'Amount, rate and end date of each loan: the most expensive is repaid first.'],
      ['No permanent overdraft', "Your account doesn't stay in the red every month."],
      ['Insurance reviewed', 'No duplicates (bank card, home, phone) and the right cover.'],
      ['Energy and phone compared', 'Your contracts have been compared at least once this year.'],
      ['Benefits', "You've checked the benefits and discounts you're entitled to."],
      ['Paperwork in order', 'Contracts, payslips, tax: findable in two minutes.'],
      ['An automatic transfer', 'An amount goes to savings on the day your pay arrives.'],
    ],
  },

  /* The journey: six levels, in the order of contenu.js. */
  levels: [
    { name: 'The idea', goal: 'Check that the problem exists.',
      todo: ['Talk to possible customers before building', 'Write the problem in one sentence', 'Look at how people cope today'],
      investor: 'At this stage almost nobody invests: there is only you and your idea.',
      tip: 'Do not ask "would you buy it?". Ask "how do you do it today?".' },
    { name: 'The MVP', goal: 'Build the smallest version that is useful.',
      todo: ['Keep a single function: the one that solves the problem', 'Put it in the hands of real users', 'Note what they do, not only what they say'],
      investor: 'Friends, family and first backers look mostly at the founders.',
      tip: 'If you are not a little ashamed of your first version, you released it too late.' },
    { name: 'The first customers', goal: 'Get someone to pay.',
      todo: ['Set a price and test it', 'Measure what a customer costs and what they bring in', 'Ask for written feedback'],
      investor: 'First revenue, even small, proves that the problem is worth money.',
      tip: 'A "that\'s great" is worth nothing. A payment is proof.' },
    { name: 'Pre-seed', goal: 'Fund the move from prototype to product.',
      todo: ['Prepare the pitch deck', 'Work out how much to raise and for how many months', 'Meet business angels'],
      investor: 'Business angels look at the team, the market and the first signs of traction.',
      tip: 'I say no to most deals. It is nothing personal: ask me why, and come back with proof.' },
    { name: 'Seed', goal: 'Prove that the product finds its market.',
      todo: ['Show steady growth', 'Hire the first key people', 'Track your numbers every month'],
      investor: 'Seed funds want to see customers who stay and a customer acquisition cost under control.',
      tip: 'Growth eats cash. Watch both at the same time.' },
    { name: 'Series A', goal: 'Scale what already works.',
      todo: ['Repeat the sale in a predictable way', 'Structure the team', 'Prepare solid accounts'],
      investor: 'Venture capital funds look at growth, margins and the size of the market.',
      tip: 'At this level investors no longer fund an idea but a machine. Show that it runs without you.' },
  ],

  stages: ['Idea', 'MVP', 'First customers', 'Pre-seed', 'Seed', 'Series A'],

  /* The glossary. Letters: e = founder, d = freelancer, i = investor, s = saver. Same order as lang/fr.js. */
  glossary: [
    ['Seed round', 'ei', 'The first real funding round, to go from a product that works for a few customers to steady growth.'],
    ['ARR', 'ei', 'Annual recurring revenue: MRR multiplied by 12.'],
    ['Profit', 'ed', 'What is left of the revenue once all costs are paid.'],
    ['Bootstrapping', 'e', 'Growing your company without investors, on its own revenue.'],
    ['BSA-AIR', 'ei', 'In France, a quick investment agreement: the investor pays now and receives shares at the next round, often at a discount. The French cousin of the SAFE.'],
    ['Burn rate', 'e', 'The money the company spends each month. Net burn is spending minus revenue.'],
    ['Business angel', 'ei', 'A person who invests their own money in young companies, often very early.'],
    ['CAC', 'ed', 'Customer acquisition cost: what you spend on average to win a customer.'],
    ['Venture capital (VC)', 'ei', 'Funds that invest other people\'s money in young, risky companies, aiming for a few very big wins.'],
    ['Fixed costs', 'ed', 'What you pay every month even if you sell nothing: rent, subscriptions, wages.'],
    ['Revenue (turnover)', 'ed', 'Everything you bill over a period, before taking costs off.'],
    ['Churn', 'e', 'The share of customers who leave over a period, often per month.'],
    ['Cliff', 'ei', 'In vesting, the period at the start during which nothing is earned yet.'],
    ['Closing', 'ei', 'The moment the documents are signed and the money is paid.'],
    ['Data room', 'ei', 'The shared space where the company keeps the documents investors want to check.'],
    ['Discount', 'ei', 'A reduction on the share price, granted to those who invested earlier.'],
    ['Quote', 'd', 'The document that describes the work and its price before starting. Once signed, it binds both sides.'],
    ['Dilution', 'ei', 'The drop in your share of the company when new shares are created for new investors.'],
    ['Diversification', 'is', 'Spreading your money over several investments so as not to depend on a single one.'],
    ['Due diligence', 'i', 'The checks made before investing: numbers, contracts, ownership, legal matters.'],
    ['Emergency savings', 's', 'A reserve available straight away, for the unexpected, before investing the rest.'],
    ['ETF', 's', 'A fund traded on the stock exchange that tracks an index, often with low fees.'],
    ['E-invoice', 'd', 'An invoice sent in a format software can read, over a network built for it, such as Peppol.'],
    ['Ongoing charges', 's', 'What an investment takes every year, as a % of the amount invested.'],
    ['Excl. / incl. VAT', 'd', 'Excluding VAT: the price without the tax. Including VAT: the price the final customer pays.'],
    ['Inflation', 's', 'The general rise in prices: the same sum buys less than before.'],
    ['Compound interest', 's', 'One year\'s gains produce gains of their own in the following years.'],
    ['Lead investor', 'ei', 'The investor who leads the round: they negotiate the terms and the others follow.'],
    ['Lean canvas', 'e', 'One page with nine boxes to describe a project: problem, customers, solution, revenue, costs…'],
    ['Power law', 'i', 'In a portfolio of young companies, a few big wins make up most of the result.'],
    ['Friends and family money', 'e', 'The money put in by family and friends at the very start.'],
    ['LTV', 'e', 'Lifetime value: what a customer brings in on average for as long as they stay.'],
    ['Gross margin', 'ed', 'What is left of the revenue after the direct cost of the product or service.'],
    ['MRR', 'ei', 'Monthly recurring revenue: what subscriptions bring in each month.'],
    ['Multiple', 'i', 'What you get back divided by what you invested. A multiple of 3: three times your stake.'],
    ['MVP', 'e', 'Minimum viable product: the smallest version that is already useful to a real user.'],
    ['Shareholders\' agreement', 'ei', 'The contract that sets the rules between shareholders: decisions, exit, a founder leaving.'],
    ['Average basket', 'd', 'The average amount of a purchase.'],
    ['Pitch deck', 'e', 'The presentation, about ten slides long, that presents the project to an investor.'],
    ['Valuation cap', 'ei', 'In a SAFE or BSA-AIR, the maximum valuation used to work out the investor\'s share.'],
    ['Post-money', 'ei', 'The valuation just after the round: pre-money + amount raised.'],
    ['Pre-money', 'ei', 'The valuation of the company just before the new investors\' money.'],
    ['Liquidation preference', 'ei', 'An investor\'s right to be paid back before the others when the company is sold.'],
    ['Pro rata', 'i', 'An investor\'s right to put more money in at the next round to keep their share.'],
    ['Product-market fit', 'e', 'The point where the product meets a need so well that customers come and stay without being pushed.'],
    ['Regulator', 'is', 'The authority that supervises sellers of financial products: the FSMA in Belgium, the AMF in France.'],
    ['Real return', 's', 'The return on an investment once inflation is taken out.'],
    ['Runway', 'e', 'The number of months the cash lets you last at the current pace.'],
    ['SAFE', 'ei', 'The American contract that inspired the BSA-AIR: money now, shares at the next round.'],
    ['Series A', 'ei', 'The round that follows seed, to scale a model that already works.'],
    ['Break-even point', 'ed', 'The level of sales from which you no longer lose money.'],
    ['Cap table', 'ei', 'The table that says who owns how much of the company.'],
    ['TAM, SAM, SOM', 'e', 'The total market, the part you can serve, and the part you are really aiming for.'],
    ['Day rate', 'd', 'The price of a freelancer\'s day of work, before VAT.'],
    ['Conversion rate', 'ed', 'The share of visitors who do what you expect of them: sign up, buy.'],
    ['Markup', 'd', 'The margin compared with the cost. Not to be confused with the margin rate, compared with the selling price.'],
    ['Term sheet', 'ei', 'The letter that sums up the terms an investor offers, before the final contracts.'],
    ['Ticket', 'i', 'The amount an investor puts into a company.'],
    ['Traction', 'ei', 'The proof that it works: customers, revenue, growth, usage.'],
    ['Cash', 'ed', 'The money really available in the company\'s accounts today.'],
    ['IRR', 'i', 'Internal rate of return: the return per year on an investment, taking its duration into account.'],
    ['VAT', 'd', 'Tax added to the selling price, which the business collects for the state and then passes on.'],
    ['Valuation', 'ei', 'The price put on the whole company at a funding round.'],
    ['Vesting', 'ei', 'Earning your shares gradually: a founder or employee who leaves early keeps only part of them.'],
    ['Deposit', 'm', 'The personal money put into a property purchase, on top of the mortgage.'],
    ['Cash flow', 'mi', 'What an investment leaves you (or costs you) each month, once everything is paid.'],
    ['Debt-to-income ratio', 'mb', 'The share of your income that goes to your loans each month.'],
    ['APR', 'mb', 'Annual percentage rate: the true cost of a loan, with fees and insurance.'],
    ['Rental yield', 'm', "A year's rent as a % of the price of the home. Gross: before expenses. Net: after."],
    ['Rental vacancy', 'm', 'The periods when a home to let has no tenant.'],
    ['ROAS', 'c', 'Return on ad spend: the revenue brought in by one euro of advertising.'],
    ['CPA', 'c', 'Cost per acquisition: what an order or a customer obtained through advertising costs.'],
    ['Return rate', 'c', 'The share of orders sent back by customers.'],
    ['Marketplace', 'c', "A site that sells other sellers' products, in exchange for a commission."],
    ['Reorder point', 'c', 'The stock level at which you need to reorder so you don\'t run out.'],
    ['50 / 30 / 20', 'b', 'A budget benchmark: 50% for essentials, 30% for wants, 20% for savings.'],
    ['Money left to live on', 'bm', 'What is left each month once essential spending and loans are paid.'],
    ['Revolving credit', 'b', 'A reserve of money to repay, often at a high rate. Use it with care.'],
  ],

  arsenal: {
    access: { free: 'Free plan', limited: 'Free, limited', trial: 'Free trial', paid: 'Paid', fee: 'No subscription', open: 'Open source', public: 'Public service' },
    places: { BE: 'Belgium', FR: 'France', BXL: 'Brussels', WAL: 'Wallonia', VLA: 'Flanders' },
    /* A shelf: name, need, descriptions of the tools (in the order of arsenal.js), the guide's tip. */
    cats: {
      construire: { name: 'Build an app without coding', need: 'You describe what you want, an AI builds the application.',
        tools: [
          'Builds a complete web application from a description: pages, database, accounts.',
          'Creates a site, an app or a prototype from one sentence, right in the browser.',
          'Creates a complete app from a description, with database, accounts and payments included. Owned by Wix.',
          'An AI agent builds, hosts and publishes your app, with nothing to install.',
        ],
        note: 'Handy for a first prototype to show customers. For a product that grows, sooner or later you will need someone who reads the code.' },
      design: { name: 'Design and visuals', need: 'A logo, visuals, the mock-up of an app.',
        tools: [
          'Visuals, presentations and documents from templates, with AI tools.',
          'Mock-ups and prototypes of apps and sites, with several people at once.',
          'Visuals, short videos and PDFs from templates.',
        ],
        note: 'A simple, readable visual beats a busy one. Keep two colours and one font.' },
      boutique: { name: 'Website and online shop', need: 'A site to present yourself, or a shop to sell.',
        tools: [
          'Drag-and-drop site builder, with hosting. Selling online needs a paid plan.',
          'A ready-made online shop: catalogue, basket, payment, stock.',
          'Free software for a site and its shop. The software is free, hosting is not.',
          'Polished sites from templates, with online selling in the paid plans.',
        ],
        note: 'Before building a shop, sell once by hand: a payment link is enough to test.' },
      ia: { name: 'AI assistants', need: 'Write, summarise, search, analyse a document, prepare a pitch.',
        tools: [
          'OpenAI\'s assistant: writing, research, analysis, images.',
          'Anthropic\'s assistant: writing, document analysis, code.',
          'Google\'s assistant, connected to its services.',
          'The assistant of the French company Mistral AI. It was called Le Chat until 2026.',
        ],
        note: 'An AI can be confidently wrong: check the numbers, laws and names it gives you. Do not paste confidential data into it without reading its settings.' },
      organiser: { name: 'Get organised', need: 'Notes, tasks, team chat.',
        tools: [
          'Notes, documents, databases and task tracking in one place.',
          'Tasks on boards and cards, moved from column to column.',
          'Team messaging organised in channels.',
          'E-mail on your own domain, documents, storage and video calls.',
        ],
        note: 'One tool well kept beats five half-filled ones. Pick one and stick to it.' },
      crm: { name: 'Keep track of customers', need: 'Know who you spoke to, where each sale stands, who to follow up.',
        tools: [
          'Contacts, deals in progress and tasks, with marketing tools around them.',
          'A customer file your way, filled from your e-mails and calendar.',
          'A light customer file, centred on relationships.',
          'Sales tracking as columns, step by step.',
        ],
        note: 'At the very start a simple spreadsheet is enough. Move to a tool when you start forgetting follow-ups.' },
      emails: { name: 'E-mails and newsletter', need: 'Write regularly to your customers and to those who follow you.',
        tools: [
          'E-mails, SMS and automatic sends. A French company, formerly Sendinblue.',
          'Newsletter, forms and sign-up pages for creators. Used to be called ConvertKit.',
          'Create, send and charge for a newsletter, with a built-in site.',
          'E-mails and automatic sends. The free plan is very limited.',
        ],
        note: 'Only write to people who agreed to receive your messages, and always leave an unsubscribe link. In Europe, the law protects individuals against unsolicited mailings.' },
      automatiser: { name: 'Automate', need: 'Connect your tools so you stop copying by hand.',
        tools: [
          'Connects applications: "when this happens, do that". The simplest to start with.',
          'Multi-step scenarios, drawn on screen.',
          'Automations for technical profiles. Free if you host it yourself; the online version is paid after a trial.',
        ],
        note: 'Do the task by hand ten times before automating it: you will know exactly what is needed.' },
      sondages: { name: 'Ask your customers', need: 'A form or a survey to check an idea.',
        tools: [
          'Forms you write like a document.',
          'Simple forms and surveys, with answers landing in a spreadsheet.',
          'Forms that ask one question at a time. The free plan is very limited.',
        ],
        note: 'A survey tells you what people say. To know what they really do, talk to them and offer them something to buy.' },
      mesurer: { name: 'Measure', need: 'How many visitors, where they come from, where they stop.',
        tools: [
          'Google\'s audience measurement for sites and apps.',
          'What users do in your product: paths, funnels, session recordings.',
          'Light audience measurement, without cookies, hosted in Europe.',
          'Open-source audience measurement, free if you host it yourself.',
        ],
        note: 'Measuring visitors touches their privacy: depending on the tool, you need their consent (cookie banner).' },
      presenter: { name: 'Presentations and pitch deck', need: 'The slides to convince a customer or an investor.',
        tools: [
          'Generates a presentation, a document or a small site from a text.',
          'Presentations made together, designed for teams.',
          'Presentations from templates, in the same tool as your visuals.',
        ],
        note: 'The tool does not make the story. Write your ten sentences first, one per slide, and only then open the tool.' },
      banque: { name: 'Business account', need: 'A separate account for the money of your business.',
        tools: [
          'Online business account with cards, transfers and invoicing tools.',
          'Online business account for freelancers and small companies, with invoicing.',
          'Multi-currency business account, with cards.',
          'An account to send and receive money in several currencies. Useful with customers outside the euro area.',
        ],
        note: 'Traditional banks have business accounts too. Compare the fees, and check that the account suits your status.' },
      compta: { name: 'Invoices and bookkeeping', need: 'Make compliant invoices and keep track of your accounts.',
        tools: [
          'Invoices, bookkeeping and tax returns for freelancers, with sending through Peppol.',
          'Invoices sent and received, with access to the Peppol network.',
          'Invoices, bookkeeping and cash tracking, linked with your accountant (site in French).',
          'Bookkeeping, invoices and tax returns for freelancers (site in French).',
        ],
        note: 'E-invoicing is becoming the rule. In Belgium, invoices between VAT-registered businesses have gone through the Peppol network since 1 January 2026. In France, since 1 September 2026 every business must be able to receive them; small businesses will have to issue them from 1 September 2027. Check your situation with your accountant.' },
      paiements: { name: 'Take payments', need: 'Get paid online or by card.',
        tools: [
          'Online payments by card and by local methods such as Bancontact.',
          'Online and in-store payments. A European company.',
          'Small card reader and payment links for shopkeepers and freelancers.',
          'Merchant account to receive payments online.',
        ],
        note: '"No subscription" does not mean free: a fee is taken on every payment. Count it in your price.' },
      captable: { name: 'Cap table', need: 'Know who owns what, and simulate a round.',
        tools: [
          'Cap table and employee equity plans. A Swiss company, focused on Europe.',
          'Cap table and equity management. An American company; the free plan is aimed at very young companies.',
          'Cap table, legal registers and employee ownership. A French company.',
        ],
        note: 'With two or three partners and no round, a well-kept spreadsheet is enough. The tool becomes useful once there are investors or shares for employees.' },
      dossier: { name: 'Share your documents', need: 'Send your deck and documents, and know whether they are read.',
        tools: [
          'Document sharing with reading statistics, page by page. Open source.',
          'Secure document sharing with reading tracking. Owned by Dropbox.',
          'A shared folder, with view or edit rights. No reading statistics.',
        ],
        note: 'Send a link rather than an attachment: you can fix the document afterwards, and cut off access.' },
      donnees: { name: 'Startup data', need: 'Who raised how much, from whom, in which sector.',
        tools: [
          'Database on companies, investors and funding rounds.',
          'Database on startups and their funding, strong in Europe.',
          'The database of venture capital professionals. By subscription.',
        ],
        note: 'These databases are incomplete on small rounds. Always cross-check with the official register and with the founders.' },
      verifier: { name: 'Check a company', need: 'Does it really exist? Who runs it? What do its accounts say?',
        tools: [
          'The official register of Belgian companies: number, address, activities, directors.',
          'The annual accounts filed by Belgian companies, at the National Bank of Belgium.',
          'The public search engine for French companies (in French).',
          'Public data on French companies, gathered by a private service (in French).',
        ],
        note: 'Before signing with a customer, a supplier or a company you invest in: two minutes of searching avoid nasty surprises.' },
      arnaques: { name: 'Spot scams', need: 'Check that a seller of investments is authorised.',
        tools: [
          'The Belgian regulator\'s tool: is the seller authorised? Is there a warning about them?',
          'The French regulator\'s lists of unauthorised companies and sites (in French).',
          'An AMF service to check a firm, test an offer and report a fraud (in French).',
          'Alerts from regulators around the world, gathered on one portal.',
        ],
        note: 'A name missing from a blacklist is no proof of honesty: fraudsters change names all the time. Check that the seller really is authorised.' },
      marches: { name: 'Follow the markets', need: 'Understand an investment and track your portfolio.',
        tools: [
          'An ETF search engine, with guides to understand them.',
          'Free software to install, which works out the real performance of your portfolio.',
          'Charts, prices and alerts on the markets.',
          'Online portfolio tracking.',
        ],
        note: 'These tools inform, they do not advise. No broker or seller of investments is listed here, by choice.' },
      aides: { name: 'Public support', need: 'Public bodies that inform and support.',
        tools: [
          'The Brussels agency for entrepreneurship. Its information service hub.info replaced the 1819 site; the 1819 phone number still works.',
          'The information point for Walloon entrepreneurs, linked to Wallonie Entreprendre (in French).',
          'The Flemish agency for innovation and entrepreneurship (in Dutch).',
          'The federal portal for the steps to start or grow a business in Belgium.',
          'Guides, templates and tools to start or take over a business (in French).',
          'The official site to register the creation, change or closure of a business in France (in French).',
        ],
        note: 'These bodies exist to answer your questions. Start with them before paying a private service.' },
    },
  },

  /* The maths, step by step: [what is worked out, the sum with the numbers entered].
     Same order and same cases in all three languages. */
  steps: {
    runway(v, r, F) {
      const g = r.series[12];
      return [
        ['What you lose each month', `${F.money(v.burn)} − ${F.money(v.revenue)} = ${F.money(r.netBurn)}`],
        r.netBurn > 0 ? ['With no growth, your cash would last', `${F.money(v.cash)} ÷ ${F.money(r.netBurn)} ≈ ${F.nf(v.cash / r.netBurn, 1)} months`] : null,
        v.growth !== 0 && g ? [`Your revenue in month 12, at ${F.pct(v.growth)} a month`, `${F.money(v.revenue)} × (1 + ${F.pct(v.growth)})^11 = ${F.money(g.revenue)}`] : null,
        r.netBurn > 0 ? ['In plain terms, each day costs you', `${F.money(r.netBurn)} ÷ 30 ≈ ${F.money(r.netBurn / 30)}`] : null,
      ];
    },
    lever(v, r, F) {
      return [
        ['Loss per month', `${F.money(v.burn)} − ${F.money(v.revenue)} = ${F.money(r.netBurn)}`],
        ['Need over the period', `${F.money(Math.max(0, r.netBurn))} × ${v.months} month${s(v.months)} = ${F.money(r.base)}`],
        v.buffer > 0 ? ['With the safety margin', `${F.money(r.base)} × (1 + ${F.pct(v.buffer)}) = ${F.money(r.raise)}`] : null,
        r.investors != null ? ['Stake given to investors', `${F.money(r.raise)} ÷ (${F.money(v.pre)} + ${F.money(r.raise)}) = ${F.pct(r.investors)}`] : null,
        r.raise > 0 ? ['In plain terms, each funded month costs', `${F.money(r.raise)} ÷ ${v.months} = ${F.money(r.raise / v.months)}`] : null,
      ];
    },
    dilution(v, r, F) {
      return [
        ['Valuation after the round', `${F.money(v.pre)} + ${F.money(v.raise)} = ${F.money(r.post)}`],
        ['New investors\' stake', `${F.money(v.raise)} ÷ ${F.money(r.post)} = ${F.pct(r.investors)}`],
        ['What the existing owners keep', `100% − ${F.pct(r.investors)} − ${F.pct(r.pool)} = ${F.pct(100 - r.investors - r.pool)}`],
        ['Founders\' stake', `${F.pct(v.founders)} × ${F.pct(100 - r.investors - r.pool)} = ${F.pct(r.founders)}`],
        ['In plain terms, their stake is worth today', `${F.pct(r.founders)} × ${F.money(r.post)} = ${F.money((r.founders / 100) * r.post)}`],
      ];
    },
    vesting(v, r, F) {
      const total = v.years * 12;
      return [
        ['Total period', `${v.years} years × 12 = ${total} months`],
        r.toCliff > 0 ? ['The cliff', `${F.nf(v.elapsed)} months < ${F.nf(v.cliff)} months: nothing has vested`]
          : ['Share of the time gone by', `${F.nf(Math.min(v.elapsed, total))} ÷ ${total} = ${F.pct(r.ratio)}`],
        ['Vested equity', `${F.pct(v.stake, 2)} × ${F.pct(r.ratio)} = ${F.pct(r.vested, 2)}`],
        ['In plain terms, each month adds', `${F.pct(v.stake, 2)} ÷ ${total} = ${F.pct(v.stake / total, 3)}`],
      ];
    },
    marche(v, r, F) {
      return [
        ['Total market (TAM)', `${F.nf(v.customers)} × ${F.money(v.price)} = ${F.money(r.tam)}`],
        ['Customers you can serve', `${F.nf(v.customers)} × ${F.pct(v.reachable)} = ${F.nf(r.samCustomers)}`],
        ['Customers you aim for', `${F.nf(r.samCustomers)} × ${F.pct(v.share)} = ${F.nf(r.somCustomers)}`],
        ['Target revenue (SOM)', `${F.nf(r.somCustomers)} × ${F.money(v.price)} = ${F.money(r.som)}`],
        ['In plain terms, per month', `${F.money(r.som)} ÷ 12 = ${F.money(r.som / 12)}`],
      ];
    },
    client(v, r, F) {
      const monthly = v.arpu * (v.margin / 100);
      return [
        ['Cost of a customer (CAC)', `${F.money(v.spend)} ÷ ${F.nf(v.customers)} = ${F.money(r.cac)}`],
        ['Margin per customer per month', `${F.money(v.arpu)} × ${F.pct(v.margin)} = ${F.money(monthly)}`],
        ['A customer stays on average', `100% ÷ ${F.pct(v.churn)} = ${F.nf(r.lifetime, 1)} months`],
        ['Value of a customer (LTV)', `${F.money(monthly)} × ${F.nf(r.lifetime, 1)} = ${F.money(r.ltv)}`],
        r.ratio != null ? ['LTV ÷ CAC ratio', `${F.money(r.ltv)} ÷ ${F.money(r.cac)} = ${F.nf(r.ratio, 1)}`] : null,
      ];
    },
    objectif(v, r, F) {
      const still = v.current * (1 - v.churn / 100) ** v.months;
      return [
        ['Customers needed', `${F.money(v.target)} ÷ ${F.money(v.price)} = ${F.nf(r.needed)}`],
        v.current > 0 && v.churn > 0 ? [`Your customers still there in ${v.months} month${s(v.months)}`, `${F.nf(v.current)} × (1 − ${F.pct(v.churn)})^${v.months} ≈ ${F.nf(still)}`] : null,
        ['Customers to win in total', `${F.nf(r.perMonth, 1)} × ${v.months} month${s(v.months)} ≈ ${F.nf(r.total)}`],
        r.perMonth > 0 ? ['In plain terms, per week', `${F.nf(r.perMonth, 1)} × 12 ÷ 52 ≈ ${F.nf((r.perMonth * 12) / 52, 1)}`] : null,
      ];
    },
    croissance(v, r, F) {
      return [
        ['Target multiple', `${F.nf(v.to)} ÷ ${F.nf(v.from)} = ${F.nf(r.multiple, 2)}`],
        ['Growth per month', `${F.nf(r.multiple, 2)}^(1/${v.months}) − 1 = ${F.pct(r.monthly, 2)}`],
        ['Over a year', `(1 + ${F.pct(r.monthly, 2)})^12 − 1 = ${F.pct(r.yearly, 0)}`],
        r.monthly > 0 ? ['In plain terms, next month', `${F.nf(v.from)} × (1 + ${F.pct(r.monthly, 2)}) = ${F.nf(v.from * (1 + r.monthly / 100), 1)}`] : null,
      ];
    },
    tarif(v, r, F) {
      const gross = (v.net * 12) / (1 - v.charges / 100);
      return [
        ['Days billed in the year', `${F.nf(v.days)} × 12 × (52 − ${F.nf(v.weeks)}) ÷ 52 = ${F.nf(r.billable, 0)}`],
        [`To keep ${F.money(v.net)} a month`, `${F.money(v.net)} × 12 ÷ (1 − ${F.pct(v.charges)}) = ${F.money(gross)}`],
        v.costs > 0 ? ['Plus the year\'s expenses', `${F.money(gross)} + ${F.money(v.costs)} × 12 = ${F.money(r.revenue)}`] : null,
        ['Day rate', `${F.money(r.revenue)} ÷ ${F.nf(r.billable, 0)} = ${F.money(r.rate)}`],
        [`In plain terms, a month with ${F.nf(v.days)} days billed`, `${F.nf(v.days)} × ${F.money(r.rate)} = ${F.money(v.days * r.rate)}`],
      ];
    },
    devis(v, r, F) {
      return [
        ['Work', `${F.nf(v.days, 1)} days × ${F.money(v.rate)} = ${F.money(r.work)}`],
        v.buffer > 0 ? ['Margin for the unexpected', `${F.money(r.work)} × ${F.pct(v.buffer)} = ${F.money(r.safety)}`] : null,
        ['Total before VAT', `${F.money(r.work)} + ${F.money(r.safety)} + ${F.money(v.expenses)} = ${F.money(r.ht)}`],
        v.vat > 0 ? ['VAT', `${F.money(r.ht)} × ${F.pct(v.vat)} = ${F.money(r.vatAmount)}`] : null,
        v.deposit > 0 ? ['Deposit', `${F.money(r.ttc)} × ${F.pct(v.deposit)} = ${F.money(r.depositAmount)}`] : null,
        ['In plain terms, each planned day earns you', `(${F.money(r.ht)} − ${F.money(v.expenses)}) ÷ ${F.nf(v.days, 1)} = ${F.money((r.ht - v.expenses) / v.days)}`],
      ];
    },
    prix(v, r, F) {
      return [
        ['Price before VAT', `${F.money(v.cost)} ÷ (1 − ${F.pct(v.margin)}) = ${F.money(r.ht)}`],
        ['Your margin', `${F.money(r.ht)} − ${F.money(v.cost)} = ${F.money(r.marginAmount)}`],
        v.vat > 0 ? ['Displayed price', `${F.money(r.ht)} × (1 + ${F.pct(v.vat)}) = ${F.money(r.ttc)}`] : null,
        r.marginAmount > 0 ? [`In plain terms, to earn ${F.money(1000)} of margin`, `${F.money(1000)} ÷ ${F.money(r.marginAmount)} → ${F.nf(Math.ceil(1000 / r.marginAmount))} sales`] : null,
      ];
    },
    remise(v, r, F) {
      return [
        ['Margin per sale, before', `${F.money(v.price)} × ${F.pct(v.margin)} = ${F.money(r.before)}`],
        ['Margin per sale, after', `${F.money(v.price)} × (${F.pct(v.margin)} − ${F.pct(v.discount)}) = ${F.money(r.after)}`],
        r.extra != null ? ['Extra sales', `${F.money(r.before)} ÷ ${F.money(r.after)} − 1 = ${F.pct(r.extra)}`] : null,
        r.extra != null ? ['In plain terms, 100 sales before equal', `100 × ${F.money(r.before)} ÷ ${F.money(r.after)} → ${F.nf(Math.ceil(100 + r.extra))} sales after`] : null,
      ];
    },
    seuil(v, r, F) {
      return [
        ['Margin per sale', `${F.money(v.price)} − ${F.money(v.variable)} = ${F.money(r.margin)}`],
        r.units != null ? ['Sales to cover fixed costs', `${F.money(v.fixed)} ÷ ${F.money(r.margin)} = ${F.nf(v.fixed / r.margin, 1)} → ${F.nf(r.units)}`] : null,
        r.units != null ? ['Revenue at break-even', `${F.nf(r.units)} × ${F.money(v.price)} = ${F.money(r.revenue)}`] : null,
        r.units != null ? ['In plain terms, per working day (22 a month)', `${F.nf(r.units)} ÷ 22 ≈ ${F.nf(r.units / 22, 1)} sale${r.units / 22 === 1 ? '' : 's'}`] : null,
      ];
    },
    tunnel(v, r, F) {
      return [
        ['Leads', `${F.nf(v.visitors)} × ${F.pct(v.signup)} = ${F.nf(r.leads, 1)}`],
        ['Customers', `${F.nf(r.leads, 1)} × ${F.pct(v.purchase)} = ${F.nf(r.customers, 1)}`],
        ['Revenue', `${F.nf(r.customers, 1)} × ${F.money(v.basket)} = ${F.money(r.revenue)}`],
        r.costPerCustomer != null ? ['Cost of a customer', `${F.money(v.spend)} ÷ ${F.nf(r.customers, 1)} = ${F.money(r.costPerCustomer)}`] : null,
        r.customers > 0 ? ['In plain terms, visitors per customer', `${F.nf(v.visitors)} ÷ ${F.nf(r.customers, 1)} ≈ ${F.nf(v.visitors / r.customers)}`] : null,
      ];
    },
    tirelire(v, r, F) {
      return [
        ['VAT, to pay back', `${F.money(v.amount)} × ${F.pct(v.vat)} = ${F.money(r.vatAmount)}`],
        ['Contributions and tax', `${F.money(v.amount)} × ${F.pct(v.charges)} = ${F.money(r.chargesAmount)}`],
        ['To set aside', `${F.money(r.vatAmount)} + ${F.money(r.chargesAmount)} = ${F.money(r.aside)}`],
        ['Really yours', `${F.money(v.amount)} − ${F.money(r.chargesAmount)} = ${F.money(r.yours)}`],
        [`In plain terms, out of ${F.money(100)} received`, `${F.money(r.yoursShare)} is yours`],
      ];
    },
    ticket(v, r, F) {
      return [
        ['Your stake going in', `${F.money(v.ticket)} ÷ ${F.money(v.post)} = ${F.pct(r.stake, 2)}`],
        v.dilution > 0 ? ['After the later rounds', `${F.pct(r.stake, 2)} × (1 − ${F.pct(v.dilution)}) = ${F.pct(r.stakeExit, 2)}`] : null,
        ['What you get back', `${F.pct(r.stakeExit, 2)} × ${F.money(v.exit)} = ${F.money(r.proceeds)}`],
        ['Multiple', `${F.money(r.proceeds)} ÷ ${F.money(v.ticket)} = ${F.times(r.multiple)}`],
        r.multiple > 0 ? ['Return per year (IRR)', `${F.nf(r.multiple, 2)}^(1/${v.years}) − 1 = ${F.pct(r.irr)}`] : null,
      ];
    },
    valo(v, r, F) {
      const kept = v.exit * (1 - v.dilution / 100);
      return [
        ['Exit, once your stake is diluted', `${F.money(v.exit)} × (1 − ${F.pct(v.dilution)}) = ${F.money(kept)}`],
        ['Maximum valuation', `${F.money(kept)} ÷ ${F.nf(v.multiple, 1)} = ${F.money(r.post)}`],
        r.stake != null ? ['Your stake going in', `${F.money(v.ticket)} ÷ ${F.money(r.post)} = ${F.pct(r.stake, 2)}`] : null,
        r.stake != null ? ['In plain terms, at the exit you would get', `${F.money(v.ticket)} × ${F.nf(v.multiple, 1)} = ${F.money(v.ticket * v.multiple)}`] : null,
      ];
    },
    portefeuille(v, r, F) {
      return [
        ['Invested in total', `${F.nf(v.count)} × ${F.money(v.ticket)} = ${F.money(r.invested)}`],
        ['Average multiple', `${F.pct(v.mid)} × ${F.nf(v.midMultiple, 1)} + ${F.pct(r.win)} × ${F.nf(v.winMultiple, 1)} = ${F.times(r.multiple)}`],
        ['Expected return', `${F.money(r.invested)} × ${F.nf(r.multiple, 2)} = ${F.money(r.proceeds)}`],
        ['In plain terms, one big win returns', `${F.money(v.ticket)} × ${F.nf(v.winMultiple, 1)} = ${F.money(v.ticket * v.winMultiple)}`],
      ];
    },
    suivre(v, r, F) {
      return [
        ['Valuation after the round', `${F.money(v.pre)} + ${F.money(v.raise)} = ${F.money(r.post)}`],
        ['To keep your stake', `${F.money(v.raise)} × ${F.pct(v.stake, 2)} = ${F.money(r.invest)}`],
        ['If you don\'t follow', `${F.pct(v.stake, 2)} × ${F.money(v.pre)} ÷ ${F.money(r.post)} = ${F.pct(r.without, 2)}`],
      ];
    },
    fonte(v, r, F) {
      return [
        ['Each round leaves you', `100% − ${F.pct(v.dilution)} = ${F.pct(100 - v.dilution)}`],
        [`After ${v.rounds} round${v.rounds > 1 ? 's' : ''}`, `${F.pct(v.stake, 2)} × ${F.nf(1 - v.dilution / 100, 2)}^${v.rounds} = ${F.pct(r.final, 2)}`],
        [`In plain terms, for a sale at ${F.money(1e7)}`, `${F.pct(r.final, 2)} × ${F.money(1e7)} = ${F.money((r.final / 100) * 1e7)}`],
      ];
    },
    convertible(v, r, F) {
      const discounted = v.pre * (1 - v.discount / 100);
      return [
        ['Valuation with the discount', `${F.money(v.pre)} × (1 − ${F.pct(v.discount)}) = ${F.money(discounted)}`],
        v.cap > 0 ? ['Valuation used: the lower one', `min(${F.money(v.cap)}; ${F.money(discounted)}) = ${F.money(r.effective)}`] : null,
        ['The holder buys as if', `${F.money(v.amount)} ÷ ${F.money(r.effective)} = ${F.pct((v.amount / r.effective) * 100, 2)} of the existing equity`],
        ['Their stake after the round', F.pct(r.stake, 2)],
      ];
    },
    cascade(v, r, F) {
      return [
        ['Investors\' preference', `${F.money(v.invested)} × ${F.nf(v.multiple, 1)} = ${F.money(v.invested * v.multiple)}`],
        ['Their share of the price', `${F.money(v.exit)} × ${F.pct(v.stake)} = ${F.money(r.asShares)}`],
        ['They take the larger', `max(${F.money(r.preference)}; ${F.money(r.asShares)}) = ${F.money(r.investors)}`],
        ['Left for the other shareholders', `${F.money(v.exit)} − ${F.money(r.investors)} = ${F.money(r.others)}`],
      ];
    },
    note(v, r, F) {
      const names = { team: 'Team', market: 'Market', traction: 'Traction', product: 'Product', terms: 'Terms' };
      return [
        ...r.parts.map((p) => [`${names[p.key]} (weight ${p.weight})`, `${F.nf(p.note, 1)} ÷ 10 × ${p.weight} = ${F.nf(p.points, 1)}`]),
        ['Total', `${r.parts.map((p) => F.nf(p.points, 1)).join(' + ')} = ${F.nf(r.score, 1)}`],
      ];
    },
    composes(v, r, F) {
      return [
        ['Paid in, in total', `${F.money(v.initial)} + ${F.money(v.monthly)} × ${v.years * 12} months = ${F.money(r.paid)}`],
        ['What the interest adds', `${F.money(r.value)} − ${F.money(r.paid)} = ${F.money(r.gain)}`],
        v.rate > 0 ? ['Time to double (rule of 72)', `72 ÷ ${F.nf(v.rate, 1)} ≈ ${F.nf(72 / v.rate, 1)} years`] : null,
        r.value > 0 ? ['In plain terms, withdrawing 4% a year afterwards', `${F.money(r.value)} × 4% ÷ 12 = ${F.money((r.value * 0.04) / 12)} a month`] : null,
      ];
    },
    cible(v, r, F) {
      return [
        [`Your starting capital, in ${v.years} year${v.years > 1 ? 's' : ''}`, `${F.money(v.initial)} → ${F.money(r.grown)}`],
        ['Still to build', `${F.money(v.target)} − ${F.money(r.grown)} = ${F.money(Math.max(0, v.target - r.grown))}`],
        ['Paid in, in total', `${F.money(v.initial)} + ${F.money(r.monthly)} × ${v.years * 12} = ${F.money(r.paid)}`],
        r.monthly > 0 ? ['In plain terms, per day', `${F.money(r.monthly)} × 12 ÷ 365 ≈ ${F.money((r.monthly * 12) / 365)}`] : null,
      ];
    },
    frais(v, r, F) {
      const [low, high] = v.feeA <= v.feeB ? [r.a, r.b] : [r.b, r.a];
      return [
        ['Net return of investment A', `${F.pct(v.rate)} − ${F.pct(v.feeA, 2)} = ${F.pct(v.rate - v.feeA, 2)}`],
        ['Net return of investment B', `${F.pct(v.rate)} − ${F.pct(v.feeB, 2)} = ${F.pct(v.rate - v.feeB, 2)}`],
        ['Gap at the end', `${F.money(low)} − ${F.money(high)} = ${F.money(r.gap)}`],
        v.monthly > 0 && r.gap > 0 ? ['In plain terms, this gap is worth', `${F.money(r.gap)} ÷ ${F.money(v.monthly)} ≈ ${F.nf(r.gap / v.monthly)} months of payments`] : null,
      ];
    },
    inflation(v, r, F) {
      const prices = (1 + v.inflation / 100) ** v.years;
      return [
        [`Prices, in ${v.years} year${v.years > 1 ? 's' : ''}`, `(1 + ${F.pct(v.inflation)})^${v.years} = × ${F.nf(prices, 2)}`],
        v.rate !== 0 ? ['Amount shown', `${F.money(v.amount)} × (1 + ${F.pct(v.rate)})^${v.years} = ${F.money(r.nominal)}`] : null,
        ['Value in today\'s money', `${F.money(r.nominal)} ÷ ${F.nf(prices, 2)} = ${F.money(r.real)}`],
        [`In plain terms, a ${F.money(100)} grocery shop would cost`, `${F.money(100)} × ${F.nf(prices, 2)} = ${F.money(100 * prices)}`],
      ];
    },
    reserve(v, r, F) {
      const monthly = ((1 + v.rate / 100) ** (1 / 12) - 1) * 100;
      return [
        ['Return per month', `(1 + ${F.pct(v.rate)})^(1/12) − 1 = ${F.pct(monthly, 3)}`],
        ['What the capital earns per month', `${F.money(v.capital)} × ${F.pct(monthly, 3)} = ${F.money(r.sustainable)}`],
        r.forever ? ['You withdraw less than that', `${F.money(v.monthly)} ≤ ${F.money(r.sustainable)}`]
          : ['You dip into the capital, at the start', `${F.money(v.monthly)} − ${F.money(r.sustainable)} = ${F.money(v.monthly - r.sustainable)} a month`],
        r.total != null ? ['Withdrawn in total', `${F.money(v.monthly)} × ${F.nf(r.months)} month${s(r.months)} = ${F.money(r.total)}`] : null,
      ];
    },
    coussin(v, r, F) {
      return [
        ['Target', `${F.money(v.expenses)} × ${F.nf(v.months)} month${s(v.months)} = ${F.money(r.target)}`],
        ['Already covered', `${F.money(v.saved)} ÷ ${F.money(v.expenses)} = ${F.nf(r.covered, 1)} months`],
        r.missing > 0 ? ['Still missing', `${F.money(r.target)} − ${F.money(v.saved)} = ${F.money(r.missing)}`] : null,
        r.missing > 0 && v.monthly > 0 ? ['Time to get there', `${F.money(r.missing)} ÷ ${F.money(v.monthly)} = ${F.nf(r.missing / v.monthly, 1)} → ${r.wait} month${s(r.wait)}`] : null,
      ];
    },
    credit(v, r, F) {
      const n = v.years * 12;
      const m = v.rate / 12;
      return [
        ['Rate per month', `${F.pct(v.rate)} ÷ 12 = ${F.pct(m, 3)}`],
        ['Monthly payment, without insurance', v.rate > 0 ? `${F.money(v.amount)} × ${F.pct(m, 3)} ÷ (1 − (1 + ${F.pct(m, 3)})^−${n}) = ${F.money(r.payment)}` : `${F.money(v.amount)} ÷ ${n} = ${F.money(r.payment)}`],
        v.insurance > 0 ? ['Insurance per month', `${F.money(v.amount)} × ${F.pct(v.insurance, 2)} ÷ 12 = ${F.money(r.insurance)}`] : null,
        ['Paid in total', `${F.money(r.monthly)} × ${n} months = ${F.money(r.totalPaid)}`],
        v.rate > 0 ? ['In plain terms, in the first month the interest is', `${F.money(v.amount)} × ${F.pct(m, 3)} = ${F.money(r.firstInterest)}`] : null,
      ];
    },
    capacite(v, r, F) {
      const n = v.years * 12;
      const m = v.rate / 12;
      return [
        ['Share set aside for loans', `${F.money(v.income)} × ${F.pct(v.ratio)} = ${F.money(r.room)}`],
        v.debts > 0 ? ['Minus your current loans', `${F.money(r.room)} − ${F.money(v.debts)} = ${F.money(r.maxMonthly)}`] : null,
        ['Amount you can borrow', v.rate > 0 ? `${F.money(r.maxMonthly)} × (1 − (1 + ${F.pct(m, 3)})^−${n}) ÷ ${F.pct(m, 3)} = ${F.money(r.loan)}` : `${F.money(r.maxMonthly)} × ${n} = ${F.money(r.loan)}`],
        r.loan > 0 ? ['In plain terms, the interest paid in total', `${F.money(r.totalPaid)} − ${F.money(r.loan)} = ${F.money(r.interest)}`] : null,
      ];
    },
    rendement(v, r, F) {
      return [
        ["A year's rent", `${F.money(v.rent)} × (12 − ${F.nf(v.vacancy, 1)}) = ${F.money(r.yearRent)}`],
        ['Gross yield', `${F.money(v.rent)} × 12 ÷ ${F.money(v.price)} = ${F.pct(r.gross, 2)}`],
        ["What's left", `${F.money(r.yearRent)} − ${F.money(v.charges)} = ${F.money(r.netIncome)}`],
        ['Net yield', `${F.money(r.netIncome)} ÷ (${F.money(v.price)} + ${F.money(v.costs)}) = ${F.pct(r.net, 2)}`],
        ['In plain terms, per month', `${F.money(r.netIncome)} ÷ 12 = ${F.money(r.netIncome / 12)}`],
      ];
    },
    cashflow(v, r, F) {
      return [
        ['Rent collected', `${F.money(v.rent)} × (1 − ${F.pct(v.vacancy)}) = ${F.money(r.income)}`],
        v.works > 0 ? ['Reserve for works', `${F.money(v.rent)} × ${F.pct(v.works)} = ${F.money(r.reserve)}`] : null,
        ["What's left", `${F.money(r.income)} − ${F.money(v.charges)} − ${F.money(v.loan)} − ${F.money(r.reserve)} = ${F.money(r.cash)}`],
        ['In plain terms, over a year', `${F.money(r.cash)} × 12 = ${F.money(r.yearly)}`],
      ];
    },
    louer(v, r, F) {
      const diff = r.firstOwnerOut - v.rent;
      return [
        ['Cost of buying', `${F.money(v.price)} × (1 + ${F.pct(v.buyCosts)}) = ${F.money(r.cost)}`],
        ['Amount borrowed', `${F.money(r.cost)} − ${F.money(Math.min(v.deposit, r.cost))} = ${F.money(r.loan)}`],
        ["Owner's spending, first month", `${F.money(r.payment)} + ${F.money(v.price)} × 1% ÷ 12 = ${F.money(r.firstOwnerOut)}`],
        diff >= 0 ? ['The renter invests, first month', `${F.money(r.firstOwnerOut)} − ${F.money(v.rent)} = ${F.money(diff)}`]
          : ['The owner invests, first month', `${F.money(v.rent)} − ${F.money(r.firstOwnerOut)} = ${F.money(-diff)}`],
        [`Wealth after ${v.horizon} year${v.horizon > 1 ? 's' : ''}`, `${F.money(r.buy)} buying, ${F.money(r.rent)} renting`],
      ];
    },
    pub(v, r, F) {
      return [
        ['Margin per order', `${F.money(v.basket)} − ${F.money(v.cogs)} − ${F.money(v.shipping)} − ${F.money(v.basket * v.fees / 100)} = ${F.money(r.margin)}`],
        r.breakEvenRoas != null ? ['Break-even ROAS', `${F.money(v.basket)} ÷ ${F.money(r.margin)} = ${F.nf(r.breakEvenRoas, 2)}`] : null,
        r.roas != null ? ['Your ROAS', `${F.money(r.revenue)} ÷ ${F.money(v.spend)} = ${F.nf(r.roas, 2)}`] : null,
        ['Profit', `${F.nf(v.orders)} × ${F.money(r.margin)} − ${F.money(v.spend)} = ${F.money(r.profit)}`],
        r.cpa != null ? ['In plain terms, each order costs you in ads', `${F.money(v.spend)} ÷ ${F.nf(v.orders)} = ${F.money(r.cpa)}`] : null,
      ];
    },
    livraison(v, r, F) {
      return [
        ['Margin on an average basket', `${F.money(v.basket)} × ${F.pct(v.margin)} = ${F.money(v.basket * v.margin / 100)}`],
        ['Extra basket to pay for delivery', `${F.money(v.shipping)} ÷ ${F.pct(v.margin)} = ${F.money(r.extra)}`],
        ['Threshold', `${F.money(v.basket)} + ${F.money(r.extra)} = ${F.money(r.threshold)}`],
        v.orders > 0 ? ['In plain terms, free delivery on everything would cost per month', `${F.nf(v.orders)} × ${F.money(v.shipping)} = ${F.money(r.monthly)}`] : null,
      ];
    },
    stock(v, r, F) {
      return [
        ['Reorder point', `${F.nf(v.daily, 1)} × (${F.nf(v.lead)} + ${F.nf(v.safety)}) = ${F.nf(r.point)}`],
        ['Days of stock', `${F.nf(v.stock)} ÷ ${F.nf(v.daily, 1)} = ${F.nf(r.daysLeft, 1)}`],
        r.late ? null : ['Order in', `(${F.nf(v.stock)} − ${F.nf(r.point)}) ÷ ${F.nf(v.daily, 1)} ≈ ${F.nf(r.orderIn)} days`],
        v.cost > 0 ? ['In plain terms, your stock is worth', `${F.nf(v.stock)} × ${F.money(v.cost)} = ${F.money(r.value)}`] : null,
      ];
    },
    retours(v, r, F) {
      return [
        ['Returns per month', `${F.nf(v.orders)} × ${F.pct(v.rate)} = ${F.nf(r.returned, 1)}`],
        ['Cost of a return', `(${F.money(v.basket)} − ${F.money(v.cogs)}) + ${F.money(v.back)} + ${F.money(v.cogs)} × ${F.pct(v.lost)} = ${F.money(r.perReturn)}`],
        ['Per month', `${F.nf(r.returned, 1)} × ${F.money(r.perReturn)} = ${F.money(r.total)}`],
        v.rate > 0 ? ['In plain terms, out of 100 orders', `${F.nf(v.rate, 1)} come back and cost ${F.money(v.rate * r.perReturn)}`] : null,
      ];
    },
    marketplace(v, r, F) {
      return [
        ['Fees on the marketplace', `${F.money(v.price)} × ${F.pct(v.commission)} + ${F.money(v.fixedFee)} = ${F.money(r.mpCost)}`],
        ['Left over, on the marketplace', `${F.money(v.price)} − ${F.money(v.cogs)} − ${F.money(r.mpCost)} = ${F.money(r.mp)}`],
        ['Fees on your shop', `${F.money(v.price)} × ${F.pct(v.siteFees)} + ${F.money(v.siteAds)} = ${F.money(r.siteCost)}`],
        ['Left over, on your shop', `${F.money(v.price)} − ${F.money(v.cogs)} − ${F.money(r.siteCost)} = ${F.money(r.site)}`],
        ['In plain terms, over 100 sales', `100 × ${F.money(Math.abs(r.gap))} = a gap of ${F.money(100 * Math.abs(r.gap))}`],
      ];
    },
    budget(v, r, F) {
      return [
        ["What's left", `${F.money(v.income)} − ${F.money(v.needs)} − ${F.money(v.wants)} = ${F.money(r.savings)}`],
        ['Benchmark for essentials', `${F.money(v.income)} × ${F.pct(50, 0)} = ${F.money(r.target.needs)}`],
        ['Benchmark for wants', `${F.money(v.income)} × ${F.pct(30, 0)} = ${F.money(r.target.wants)}`],
        ['Benchmark for savings', `${F.money(v.income)} × ${F.pct(20, 0)} = ${F.money(r.target.savings)}`],
        r.savings > 0 ? ['In plain terms, over ten years', `${F.money(r.savings)} × 120 months = ${F.money(r.savings * 120)}`] : null,
      ];
    },
    dette(v, r, F) {
      const m = v.rate / 12;
      return [
        ['Rate per month', `${F.pct(v.rate)} ÷ 12 = ${F.pct(m, 2)}`],
        ['Interest in the first month', `${F.money(v.balance)} × ${F.pct(m, 2)} = ${F.money(r.firstInterest)}`],
        r.months != null ? ['Debt repaid in the first month', `${F.money(v.payment)} − ${F.money(r.firstInterest)} = ${F.money(v.payment - r.firstInterest)}`]
          : ['Minimum payment', `more than ${F.money(r.firstInterest)} a month`],
        r.months != null ? ['In plain terms, you pay in total', `${F.money(v.balance)} + ${F.money(r.interest)} = ${F.money(v.balance + r.interest)}`] : null,
      ];
    },
    heures(v, r, F) {
      return [
        ['Your hourly income', `${F.money(v.income)} ÷ ${F.nf(v.hours)} h = ${F.money(r.hourly)}`],
        ['Hours of work', `${F.money(v.price)} ÷ ${F.money(r.hourly)} = ${F.nf(r.hours, 1)} h`],
        v.years > 0 ? ['The same money invested', `${F.money(v.price)} × (1 + ${F.pct(v.rate)})^${v.years} = ${F.money(r.later)}`] : null,
        ['In plain terms, in 7-hour days', `${F.nf(r.hours, 1)} ÷ 7 ≈ ${F.nf(r.days, 1)}`],
      ];
    },
    voiture(v, r, F) {
      return [
        ['Loss of value per year', `${F.money(v.price)} × (1 − ${F.pct(v.resale)}) ÷ ${F.nf(v.years)} = ${F.money(r.loss)}`],
        ['Energy per year', `${F.nf(v.km)} km × ${F.nf(v.use, 1)} ÷ 100 × ${F.money(v.energy)} = ${F.money(r.fuel)}`],
        ['Per year', `${F.money(r.loss)} + ${F.money(r.fuel)} + ${F.money(r.fixed)} = ${F.money(r.year)}`],
        ['Per month', `${F.money(r.year)} ÷ 12 = ${F.money(r.month)}`],
        r.perKm != null ? ['In plain terms, a 20 km trip', `20 × ${F.money(r.perKm)} = ${F.money(20 * r.perKm)}`] : null,
      ];
    },
  },

  /* The results of the machines. v = what you typed, r = the calculation, F = the formats. */
  res: {
    runway: {
      invalid: 'Check your numbers: cash, spending and revenue cannot be negative.',
      label: (r) => (r.months === 1 ? 'month of survival' : 'months of survival'),
      verdict(v, r, F) {
        // Revenue that covers spending today but is shrinking: that is not a break-even point.
        const shrinking = r.breakEven === 1 && v.growth < 0;
        if (shrinking) {
          return r.months == null ? `Your revenue covers your spending today, but it is shrinking. The cash still lasts more than ${r.horizon} months.`
            : `Your revenue covers your spending today, but it is shrinking: the cash drops below zero during the ${F.ord(r.months + 1)} month.`;
        }
        if (r.months == null && r.breakEven) return r.breakEven === 1 ? 'Your revenue already covers your spending: the cash does not go down.'
          : `Your revenue catches up with your spending in the ${F.ord(r.breakEven)} month: the cash never drops below zero.`;
        if (r.months == null) return `You last more than ${r.horizon} months at this pace.`;
        let t = r.months === 0 ? 'At this pace, the cash drops below zero in the very first month.'
          : `At this pace, the cash drops below zero during the ${F.ord(r.months + 1)} month.`;
        if (r.breakEven) t += ` Your revenue would only cover your spending in the ${F.ord(r.breakEven)} month: too late, unless you raise money or cut spending.`;
        return t;
      },
      hearts: (n) => `${n} heart${s(n)} out of 12`,
      heartsNote: 'One heart per month, twelve at most.',
      facts: (v, r, F) => [
        ['You lose each month, today', r.netBurn > 0 ? F.money(r.netBurn) : 'nothing'],
        ['Revenue covers spending', r.breakEven === 1 ? (v.growth < 0 ? 'today, but shrinking' : 'already today') : r.breakEven ? `in the ${F.ord(r.breakEven)} month` : `not within ${r.horizon} months`],
      ],
      chart: 'Your cash, month by month',
      tick: (n) => 'M' + n,
      bar: (p, F) => `Month ${p.month}: ${F.money(p.cash)}`,
      legend: ['Positive cash', 'Below zero'],
      table: ['Month', 'Revenue', 'Cash'],
      row: (p, F) => [p.month === 0 ? 'Today' : 'Month ' + p.month, p.month === 0 ? '' : F.money(p.revenue), F.money(p.cash)],
    },
    lever: {
      invalid: 'Check your numbers: you need at least one month to fund, and amounts that are not negative.',
      none: 'Nothing',
      noneLabel: 'to raise to keep going',
      noneVerdict: 'Your revenue already covers your spending. A round would not be for keeping going but for going faster: say exactly what for.',
      label: (v) => `to raise to last ${v.months} month${s(v.months)}`,
      verdict: (v, r, F) => `You lose ${F.money(r.netBurn)} per month: ${F.money(r.base)} over ${v.months} month${s(v.months)}`
        + (v.buffer > 0 ? `, plus a ${F.pct(v.buffer, 0)} safety margin.` : '.')
        + (r.investors != null ? ` At a ${F.money(v.pre)} valuation, you give up ${F.pct(r.investors)} of the company.` : ''),
      rows: ['Need without margin', 'Safety margin'],
      facts: (v, r, F) => [
        ['Loss per month', F.money(r.netBurn)],
        r.post != null ? ['Valuation after the round', F.money(r.post)] : null,
        ['Share given to investors', r.investors != null ? F.pct(r.investors) : 'enter a valuation'],
      ],
    },
    dilution: {
      invalid: 'With these numbers there is nothing left to share: the round and the pool take 100% of the company or more. Check the valuation.',
      label: 'for the founders after the round',
      verdict: (v, r, F) => `The founders go from ${F.pct(v.founders)} to ${F.pct(r.founders)}: they give up ${F.nf(r.lost, 1)} points. The company is worth ${F.money(r.post)} after the round.`,
      parts: ['Founders', 'Other shareholders already there', 'Employee pool', 'New investors'],
      facts: (v, r, F) => [
        ['Valuation before the round', F.money(v.pre)],
        ['Valuation after the round', F.money(r.post)],
        ['New investors\' share', F.pct(r.investors)],
      ],
    },
    vesting: {
      invalid: 'Check your numbers: a share between 0 and 100%, a period of at least one year, and a cliff shorter than the period.',
      label: 'of the company already earned',
      verdict(v, r, F) {
        if (r.toCliff > 0) return `The cliff has not passed: nothing is earned yet. ${r.toCliff} more month${s(r.toCliff)} before the first shares vest.`;
        if (r.left === 0) return `Everything is earned: the full ${F.pct(v.stake, 2)} is yours.`;
        return `${F.pct(r.ratio)} of your grant is earned. Leaving today, you would keep ${F.pct(r.vested, 2)} of the company and leave ${F.pct(r.unvested, 2)} behind.`;
      },
      parts: ['Already earned', 'Not earned yet'],
      facts: (v, r, F) => [
        ['Earned', F.pct(r.vested, 2)],
        ['Not earned yet', F.pct(r.unvested, 2)],
        ['Months until the end', r.left === 0 ? 'finished' : String(r.left)],
      ],
    },
    marche: {
      invalid: 'Check your numbers: you need at least one customer and a revenue per customer, and shares between 0 and 100%.',
      label: 'per year: the market you are aiming for',
      verdict: (v, r, F) => `Out of ${F.nf(v.customers)} possible customers, you can serve ${F.nf(r.samCustomers)} and you aim for ${F.nf(r.somCustomers)}. At ${F.money(v.price)} per year each, that makes ${F.money(r.som)} in revenue per year.`,
      rows: ['Total market (TAM)', 'Market you can serve (SAM)', 'Market you aim for (SOM)'],
      facts: (v, r, F) => [
        ['Customers you can serve', F.nf(r.samCustomers)],
        ['Customers you aim for', F.nf(r.somCustomers)],
        ['Share of the total market', F.pct(r.tam > 0 ? (r.som / r.tam) * 100 : 0, 2)],
      ],
    },
    client: {
      invalid: 'Check your numbers: you need at least one customer, a revenue, a margin between 1 and 100% and a churn rate above zero.',
      free: 'Free',
      label: 'what a customer brings in, compared with their cost',
      verdict(v, r, F) {
        if (r.ratio == null) return 'Your customers cost you nothing to find: each one brings in their margin from the first month.';
        if (r.ratio >= 3) return `A customer brings in ${F.nf(r.ratio, 1)} times what they cost you: above the benchmark of 3.`;
        if (r.ratio >= 1) return `A customer brings in ${F.nf(r.ratio, 1)} times what they cost you: below the benchmark of 3. Lower the acquisition cost, or keep your customers longer.`;
        return `A customer costs you more than they bring in (${F.nf(r.ratio, 1)} times their cost): each new customer deepens the loss.`;
      },
      rows: ['Cost of a customer (CAC)', 'Value of a customer (LTV)'],
      facts: (v, r, F) => [
        ['A customer stays on average', months(r.lifetime, F)],
        ['Their cost is paid back in', r.payback ? months(r.payback, F) : 'straight away'],
      ],
    },
    objectif: {
      invalid: 'Check your numbers: a revenue goal and a price above zero, a churn rate below 100%, and at least one month.',
      label: (r) => (r.perMonth === 1 ? 'new customer to win each month' : 'new customers to win each month'),
      verdict(v, r, F) {
        if (r.perMonth === 0) return `You already have enough customers to reach ${F.money(v.target)} per month in ${v.months} month${s(v.months)}, even with those who leave.`;
        let t = `To reach ${F.money(v.target)} per month, you need ${F.nf(r.needed)} customer${s(r.needed)}. Over ${v.months} month${s(v.months)}, that takes ${F.nf(r.perMonth, 1)} new customers per month.`;
        if (r.lost > 0) t += ` In total, ${F.nf(r.lost)} of them only replace those who leave.`;
        return t;
      },
      rows: ['Customers today', 'Customers needed', 'Customers to win in total'],
      facts: (v, r, F) => [
        ['Revenue per month today', F.money(r.currentRevenue)],
        ['Customers to win in total', F.nf(r.total)],
        ['Of which to replace leavers', F.nf(Math.max(0, r.lost))],
      ],
    },
    croissance: {
      invalid: 'Check your numbers: two numbers above zero, and at least one month.',
      label: 'growth per month',
      verdict(v, r, F) {
        if (r.monthly === 0) return 'Start and goal are equal: no growth is needed.';
        if (r.monthly < 0) return `The goal is lower than the start: a drop of ${F.pct(-r.monthly, 2)} per month.`;
        return `To go from ${F.nf(v.from)} to ${F.nf(v.to)} in ${v.months} month${s(v.months)}, you need to grow by ${F.pct(r.monthly, 2)} every month: that multiplies it by ${F.nf(r.multiple, 1)} overall.`;
      },
      facts: (v, r, F) => [
        ['Over a year, at the same pace', F.pct(r.yearly, 0)],
        ['Time to double', r.doubling != null ? months(r.doubling, F) : '—'],
        ['Multiplied by', F.nf(r.multiple, 2)],
      ],
    },
    tarif: {
      invalid: 'Check your numbers: you need an income goal, at least one day billed per month, fewer than 52 weeks without billing and less than 100% in contributions.',
      label: 'per day, before VAT',
      verdict: (v, r, F) => `To keep ${F.money(v.net)} per month, you need to bill ${F.money(r.revenue)} over the year, in ${F.nf(r.billable, 0)} days.`,
      chart: 'Where what you bill goes',
      rows: ['What you keep', 'Contributions and taxes', 'Business costs'],
      facts: (v, r, F) => [
        ['Per hour, for 8 hours a day', F.money(r.hourly)],
        ['Days billed over the year', F.nf(r.billable, 0)],
        ['To bill per month, on average', F.money(r.revenue / 12)],
      ],
    },
    devis: {
      invalid: 'Check your numbers: you need days and a rate above zero, and percentages between 0 and 100.',
      label: (v) => (v.vat > 0 ? 'for the customer to pay, VAT included' : 'for the customer to pay'),
      verdict: (v, r, F) => `Your quote: ${F.money(r.ht)} before VAT, for ${F.nf(r.days, 1)} days planned with surprises included.`
        + (v.deposit > 0 ? ` A ${F.pct(v.deposit, 0)} deposit: ${F.money(r.depositAmount)} before starting, then ${F.money(r.balance)} at the end.` : ''),
      chart: 'What the quote contains',
      rows: ['Work', 'Margin for surprises', 'Expenses', 'VAT'],
      facts: (v, r, F) => [
        ['Total before VAT', F.money(r.ht)],
        ['Deposit', F.money(r.depositAmount)],
        ['Balance at the end', F.money(r.balance)],
      ],
    },
    prix: {
      invalid: 'Check your numbers: you need a cost above zero and a margin below 100% of the price.',
      label: (v) => (v.vat > 0 ? 'price on the label, VAT included' : 'selling price'),
      verdict: (v, r, F) => `Sold at ${F.money(r.ht)} before VAT, your product leaves you ${F.money(r.marginAmount)}: ${F.pct(v.margin, 0)} of the price, or ${F.pct(r.markup, 0)} of the cost.`,
      chart: 'What the price contains',
      rows: ['Cost', 'Your margin', 'VAT, to pass on'],
      facts: (v, r, F) => [
        ['Price before VAT', F.money(r.ht)],
        ['Margin as a % of the cost', F.pct(r.markup, 0)],
        ['Label price ÷ cost', F.nf(r.coefficient, 2)],
      ],
    },
    remise: {
      invalid: 'Check your numbers: a price and a margin above zero, and a discount below 100%.',
      never: 'Loss',
      neverLabel: 'on every sale',
      neverVerdict: (v, r, F) => `With a ${F.pct(v.discount, 0)} discount, you sell at ${F.money(r.newPrice)} and you ${r.after === 0 ? 'earn nothing' : `lose ${F.money(-r.after)}`} on every sale: no volume makes up for that.`,
      label: 'more sales to earn as much as before',
      verdict: (v, r, F) => (v.discount === 0 ? 'With no discount, nothing changes. Enter a percentage to see its effect.'
        : `A ${F.pct(v.discount, 0)} discount takes away ${F.pct(r.lostShare, 0)} of your margin: you earn ${F.money(r.after)} per sale instead of ${F.money(r.before)}. You have to sell ${F.pct(r.extra, 0)} more to earn as much.`),
      rows: ['Margin per sale, before', 'Margin per sale, after'],
      facts: (v, r, F) => [
        ['Price after discount', F.money(r.newPrice)],
        ['Share of the margin lost', F.pct(r.lostShare, 0)],
        ['Sales needed to earn what 100 sales earned before', r.extra != null ? F.nf(Math.ceil(100 + r.extra)) : '—'],
      ],
    },
    seuil: {
      invalid: 'Check your numbers: you need a selling price above zero.',
      never: 'Never',
      neverLabel: 'no number of sales is enough',
      neverVerdict: (v, r, F) => `Each sale loses you ${F.money(-r.margin)}: no volume makes up for that. Raise the price or lower the cost per sale.`,
      label: (r) => `sale${s(r.units)} per month to break even`,
      verdict: (v, r, F) => `Each sale leaves you ${F.money(r.margin)} (${F.pct(r.marginRate)} of the price). You need ${F.nf(r.units)} per month, that is ${F.money(r.revenue)} in revenue, to cover ${F.money(v.fixed)} of fixed costs.`,
      facts: (v, r, F) => [
        ['Margin per sale', F.money(r.margin)],
        ['Revenue at break-even', F.money(r.revenue)],
        ['Sales per working day, roughly', F.nf(r.units / 22, 1)],
      ],
      chart: 'Three scenarios',
      table: ['Sales per month', 'Revenue', 'Result for the month'],
    },
    tunnel: {
      invalid: 'Check your numbers: rates go from 0 to 100%, and amounts cannot be negative.',
      label: (r) => `customer${s(r.customers)} per month`,
      verdict: (v, r, F) => `Out of ${F.nf(v.visitors)} visitors, ${F.nf(r.customers, 1)} buy: ${F.pct(r.rate, 2)}. `
        + (v.signup <= v.purchase ? 'The weaker step is leaving details: improve it first.' : 'The weaker step is the purchase: improve it first.'),
      rows: ['Visitors', 'Contacts', 'Customers'],
      facts: (v, r, F) => [
        ['Revenue per month', F.money(r.revenue)],
        ['Cost of a customer', r.costPerCustomer != null ? F.money(r.costPerCustomer) : v.spend > 0 ? 'no customers' : 'nothing'],
        v.spend > 0 ? ['For €1 spent, you take in', F.money(r.perEuro)] : null,
        v.spend > 0 ? ['Revenue minus spending', F.money(r.result)] : null,
      ],
    },
    tirelire: {
      invalid: 'Check your numbers: an amount above zero, and percentages between 0 and 100.',
      label: 'to set aside from this invoice',
      verdict: (v, r, F) => `Your customer pays you ${F.money(r.ttc)}. Set ${F.money(r.aside)} aside: you are really left with ${F.money(r.yours)}, that is ${F.pct(r.yoursShare, 0)} of what you took in.`,
      chart: 'Where the money you take in goes',
      rows: ['What is yours', 'Contributions and taxes', 'VAT, to pass on'],
      facts: (v, r, F) => [
        ['Taken in', F.money(r.ttc)],
        ['To set aside', F.money(r.aside)],
        ['Really yours', F.money(r.yours)],
      ],
    },
    ticket: {
      invalid: 'Check your numbers: the amount invested cannot exceed the valuation at entry, and the duration must be at least one year.',
      label: 'your stake',
      verdict: (v, r, F) => (r.multiple >= 1
        ? `In this scenario, ${F.money(v.ticket)} becomes ${F.money(r.proceeds)} in ${v.years} year${s(v.years)}: ${F.pct(r.irr)} per year.`
        : `In this scenario, you get back ${F.money(r.proceeds)} out of ${F.money(v.ticket)} invested: a loss of ${F.money(-r.gain)}.`),
      rows: ['Invested', 'Got back'],
      facts: (v, r, F) => [
        ['Your share at entry', F.pct(r.stake, 2)],
        ['Your share at exit', F.pct(r.stakeExit, 2)],
        ['Return per year (IRR)', F.pct(r.irr)],
      ],
    },
    valo: {
      invalid: 'Check your numbers: you need an exit valuation and a multiple above zero.',
      label: 'maximum valuation after the round',
      verdict: (v, r, F) => `To get back ${F.nf(v.multiple, 1)} times your stake with an exit at ${F.money(v.exit)} and ${F.pct(v.dilution, 0)} dilution until then, the company must not be worth more than ${F.money(r.post)} after the round.`,
      facts: (v, r, F) => [
        r.pre != null ? ['That is, before your stake', F.money(r.pre)] : null,
        r.stake != null ? ['Your share at entry', F.pct(r.stake, 2)] : ['Your share', v.ticket > 0 ? 'your amount is above this valuation' : 'enter an amount to see it'],
      ],
    },
    portefeuille: {
      invalid: 'Check your numbers: a whole number of companies (500 at most), and two shares that add up to no more than 100%.',
      label: 'your stake, overall',
      verdict(v, r, F) {
        let t = `Out of ${v.count} compan${v.count === 1 ? 'y' : 'ies'}: ${r.fails} with no return, ${r.mids} returning a little, ${r.winners} big win${s(r.winners)}. On average, with these assumptions, ${F.money(r.invested)} invested would return ${F.money(r.proceeds)}.`;
        if (r.win > 0 && r.winners === 0) t += ' With so few companies, you may well have no big win at all.';
        return t;
      },
      aria: (r) => `${r.fails} with no return, ${r.mids} returning a little, ${r.winners} big win${s(r.winners)}`,
      legend: ['Returns nothing', 'Returns a little', 'Big win'],
      facts: (v, r, F) => [
        ['Without the big wins', F.times(r.withoutWinners)],
        ['Share of big wins', F.pct(r.win, 0)],
        ['Gain or loss', F.money(r.proceeds - r.invested)],
      ],
    },
    suivre: {
      invalid: 'Check your numbers: a share between 0 and 100%, and a valuation above zero.',
      label: 'to put back in to keep your share',
      verdict: (v, r, F) => (v.raise === 0 ? 'With no round, your share does not move.'
        : `To stay at ${F.pct(v.stake, 2)}, you need to put ${F.money(r.invest)} into this round. If you do not follow, your share drops to ${F.pct(r.without, 2)}.`),
      rows: ['Your share if you follow', 'Your share if you do not'],
      facts: (v, r, F) => [
        ['Valuation after the round', F.money(r.post)],
        ['Points lost without following', F.nf(r.lost, 2)],
        ['Value of your share if you follow', F.money(r.value)],
      ],
    },
    fonte: {
      invalid: 'Check your numbers: a share between 0 and 100%, from 1 to 12 rounds, and a dilution below 100%.',
      label: (v) => `of the company after ${v.rounds} round${s(v.rounds)}`,
      verdict: (v, r, F) => `Your share goes from ${F.pct(v.stake, 2)} to ${F.pct(r.final, 2)}: you keep ${F.pct(r.kept, 0)} of it.`,
      chart: 'Your share, round after round',
      tick: (n) => (n === 0 ? 'Now' : 'R' + n),
      bar: (p, F) => (p.round === 0 ? `Today: ${F.pct(p.stake, 2)}` : `After round ${p.round}: ${F.pct(p.stake, 2)}`),
      top: (F, max) => F.pct(max, 2),
      facts: (v, r, F) => [
        ['Starting share', F.pct(v.stake, 2)],
        ['Share at the end', F.pct(r.final, 2)],
        ['What melted', F.pct(100 - r.kept, 0)],
      ],
    },
    convertible: {
      invalid: 'Check your numbers: you need an amount, a valuation above zero and a discount below 100%.',
      label: 'of the company for the holder, after the round',
      verdict(v, r, F) {
        if (r.rule === 'cap') return `The cap applies: the holder converts as if the company were worth ${F.money(r.effective)}, instead of ${F.money(v.pre)}. For the same amount, they get ${F.nf(r.bonus, 2)} times the share of an investor in the round.`;
        if (r.rule === 'discount') return `The discount applies: the holder converts at a valuation of ${F.money(r.effective)}, instead of ${F.money(v.pre)}. For the same amount, they get ${F.nf(r.bonus, 2)} times the share of an investor in the round.`;
        return 'Neither the cap nor the discount applies: the holder converts at the same price as the investors in the round.';
      },
      parts: ['Shareholders already there', 'Holder of the SAFE', 'Investors in the round'],
      facts: (v, r, F) => [
        ['Valuation used to convert', F.money(r.effective)],
        ['Their share at the round price, with no advantage', F.pct(r.atRound, 2)],
      ],
    },
    cascade: {
      invalid: 'Check your numbers: the investors\' share goes from 0 to 100%, and the preference from 0 to 10 times the stake.',
      label: 'for the founders and the other shareholders',
      verdict(v, r, F) {
        if (v.exit === 0) return 'At this price, there is nothing to share.';
        if (r.converts) return `At this price, the share of the company brings in more than the preference: everyone is paid according to their share. Investors get ${F.money(r.investors)}, the other shareholders ${F.money(r.others)}.`;
        return `Investors take their preference: ${F.money(r.investors)}, that is ${F.pct(r.investorsShare)} of the price although they hold ${F.pct(v.stake, 1)} of the company. ${F.money(r.others)} is left for the other shareholders.`;
      },
      rows: ['Investors', 'Other shareholders'],
      facts: (v, r, F) => [
        ['Threshold price', r.threshold > 0 ? F.money(r.threshold) : 'none'],
        ['Share of the price for investors', F.pct(r.investorsShare)],
        ['Their share of the company', F.pct(v.stake, 1)],
      ],
    },
    note: {
      invalid: 'Check your marks: each one goes from 0 to 10.',
      label: 'out of 100',
      criteria: { team: 'Team', market: 'Market', traction: 'Traction', product: 'Product', terms: 'Terms' },
      verdict(v, r, F) {
        const weak = this.criteria[r.weakest].toLowerCase();
        const level = r.score >= 75 ? 'A solid deal on this grid.' : r.score >= 50 ? 'An average deal on this grid.' : 'A weak deal on this grid.';
        return `${level} The weakest point: ${weak}. That is the first question to dig into.`;
      },
      points: (p, F) => `${F.nf(p.points, 1)} / ${p.weight}`,
      facts: (v, r, F) => [
        ['Weakest point', r.parts.find((p) => p.key === r.weakest).note + ' / 10'],
        ['Points earned', `${F.nf(r.score, 1)} / 100`],
      ],
    },
    composes: {
      invalid: 'Check your numbers: the duration must be a whole number of years, between 1 and 60.',
      label: (v) => `after ${v.years} year${s(v.years)}`,
      verdict: (v, r, F) => (r.gain >= 0
        ? `At this return, you would pay in ${F.money(r.paid)} and interest would add ${F.money(r.gain)}${r.paid > 0 ? `, that is ${F.pct((r.gain / r.paid) * 100, 0)} more` : ''}.`
        : `You would pay in ${F.money(r.paid)}; with a negative return, ${F.money(r.value)} would be left.`),
      chart: 'Year after year',
      aria: 'Value year by year',
      bar: (p, F) => `Year ${p.year}: ${F.money(p.value)}, of which ${F.money(p.paid)} paid in`,
      legend: ['What you paid in', 'What interest added'],
      table: ['Year', 'Paid in', 'Value'],
      row: (p, F) => [p.year === 0 ? 'Start' : 'Year ' + p.year, F.money(p.paid), F.money(p.value)],
    },
    cible: {
      invalid: 'Check your numbers: an amount above zero, and a whole duration between 1 and 60 years.',
      label: 'to pay in each month',
      verdict(v, r, F) {
        const years = `${v.years} year${s(v.years)}`;
        if (r.enough) return `What you already have is enough: without paying anything in, you would have ${F.money(r.grown)} in ${years}.`;
        return `By paying in ${F.money(r.monthly)} per month for ${years}, you would reach ${F.money(v.target)} at this return. You would have paid in ${F.money(r.paid)}; interest would add the rest: ${F.money(r.interest)}.`;
      },
      rows: ['What you pay in', 'What interest adds'],
      facts: (v, r, F) => [
        ['Paid in overall', F.money(r.paid)],
        ['Brought by interest', F.money(Math.max(0, r.interest))],
        ['Per year', F.money(r.monthly * 12)],
      ],
    },
    frais: {
      invalid: 'Check your numbers: fees between 0 and 20% per year, and a whole duration between 1 and 60 years.',
      label: (v) => `gap after ${v.years} year${s(v.years)}`,
      verdict: (v, r, F, x) => (r.gap === 0 ? 'Same fees, same result. Change one of the two to see the gap.'
        : `With ${F.pct(x.lowFee, 2)} in fees per year, you would end up with ${F.money(x.low)}. With ${F.pct(x.highFee, 2)}, ${F.money(x.high)}: ${F.money(r.gap)} less, for ${F.money(r.paid)} paid in.`),
      chart: 'Year after year',
      aria: 'Value of the two investments, year by year',
      bar: (p, F) => `Year ${p.year}: A ${F.money(p.a)}, B ${F.money(p.b)}`,
      legend: (x) => [`Investment ${x.highName}, the more expensive`, `What investment ${x.lowName} leaves on top`],
      facts: (v, r, F) => [
        ['With no fees at all', F.money(r.free)],
        ['Cost of investment A\'s fees', F.money(r.costA)],
        ['Cost of investment B\'s fees', F.money(r.costB)],
      ],
      table: ['Year', 'Investment A', 'Investment B'],
      row: (p, F) => [p.year === 0 ? 'Start' : 'Year ' + p.year, F.money(p.a), F.money(p.b)],
    },
    inflation: {
      invalid: 'Check your numbers: a sum above zero, and a whole duration between 1 and 60 years.',
      label: (v) => `of purchasing power in ${v.years} year${s(v.years)}`,
      verdict(v, r, F) {
        const years = `${v.years} year${s(v.years)}`;
        return v.rate === 0
          ? `In ${years}, your ${F.money(v.amount)} will still show ${F.money(r.nominal)}, but will only buy what ${F.money(r.real)} buys today${r.lost > 0 ? `: ${F.pct(r.lost)} less purchasing power` : ''}.`
          : `In ${years}, your investment will show ${F.money(r.nominal)}. Once price rises are taken out, that is worth ${F.money(r.real)} in today's money: a real return of ${F.pct(r.realRate, 2)} per year.`;
      },
      chart: 'What the sum is really worth, year after year',
      bar: (p, F) => `Year ${p.year}: ${F.money(p.real)} in today's money`,
      facts: (v, r, F) => [
        ['Sum shown at the end', F.money(r.nominal)],
        ['Real return per year', F.pct(r.realRate, 2)],
        ['Purchasing power', r.lost > 0 ? `${F.pct(r.lost)} less` : `${F.pct(-r.lost)} more`],
      ],
      table: ['Year', 'Sum shown', 'Value in today\'s money'],
      row: (p, F) => [p.year === 0 ? 'Today' : 'Year ' + p.year, F.money(p.nominal), F.money(p.real)],
    },
    reserve: {
      invalid: 'Check your numbers: a starting sum and a withdrawal above zero.',
      forever: 'No end',
      foreverLabel: 'the capital does not run out',
      label: (r) => `year${s(r.years)} before the capital is empty`,
      verdict(v, r, F) {
        if (r.forever) return `You take out ${F.money(v.monthly)} per month, and the capital earns about ${F.money(r.sustainable)} per month: it would not run out, at this return.`;
        return `Taking out ${F.money(v.monthly)} per month, the capital would be empty after ${F.nf(r.years, 1)} year${s(r.years)}. You would have taken out ${F.money(r.total)} in total, from ${F.money(v.capital)} at the start.`;
      },
      chart: 'The capital, year after year',
      bar: (p, F) => `Year ${p.year}: ${F.money(p.value)}`,
      facts: (v, r, F) => [
        ['What the capital earns per month, at the start', F.money(r.sustainable)],
        ['Taken out in total', r.total != null ? F.money(r.total) : '—'],
        ['Months of withdrawals', r.months != null ? F.nf(r.months) : '—'],
      ],
    },
    coussin: {
      invalid: 'Check your numbers: spending above zero, and from 1 to 60 months to cover.',
      label: 'to have set aside',
      verdict(v, r, F) {
        if (r.missing === 0) return `Your cushion is complete: you have enough to last ${months(r.covered, F)}.`;
        let t = `You have enough to last ${months(r.covered, F)}. You are ${F.money(r.missing)} short.`;
        t += r.wait != null ? ` Setting aside ${F.money(v.monthly)} per month, you get there in ${r.wait} month${s(r.wait)}.` : ' Enter what you can save each month to see when you will get there.';
        return t;
      },
      aria: (r, F) => `${F.pct(r.progress, 0)} of the goal`,
      facts: (v, r, F) => [
        ['Already covered', months(r.covered, F)],
        ['Still missing', F.money(r.missing)],
        ['Months before you get there', r.wait === 0 ? 'reached' : r.wait != null ? String(r.wait) : '—'],
      ],
    },
    credit: {
      invalid: 'Check your numbers: an amount above zero, a rate from 0 to 30%, a whole term from 1 to 40 years and insurance from 0 to 5%.',
      label: 'a month, insurance included',
      verdict: (v, r, F) => `For ${F.money(v.amount)} over ${v.years} year${s(v.years)}, you pay ${F.money(r.monthly)} a month. The loan costs you ${F.money(r.totalCost)} on top of the amount borrowed, which is ${F.pct((r.totalCost / v.amount) * 100, 0)} of that amount.`,
      chart: 'What you repay each year',
      aria: 'Capital and interest repaid, year by year',
      bar: (p, F) => `Year ${p.year}: ${F.money(p.principal)} capital, ${F.money(p.interest)} interest`,
      legend: ['Capital repaid', 'Interest'],
      facts: (v, r, F) => [
        ['Monthly payment without insurance', F.money(r.payment)],
        ['Interest in total', F.money(r.totalInterest)],
        ['Insurance in total', F.money(r.totalInsurance)],
      ],
      table: ['Year', 'Capital', 'Interest', 'Still owed'],
      row: (p, F) => ['Year ' + p.year, F.money(p.principal), F.money(p.interest), F.money(p.balance)],
    },
    capacite: {
      invalid: 'Check your numbers: income above zero, a share from 1 to 100%, a rate from 0 to 30% and a whole term from 1 to 40 years.',
      label: 'you can borrow',
      verdict(v, r, F) {
        if (r.maxMonthly === 0) return `Your current loans (${F.money(v.debts)} a month) already take the whole share planned: ${F.pct(v.ratio, 0)} of your income.`;
        return `With ${F.money(v.income)} of income, ${F.pct(v.ratio, 0)} gives ${F.money(r.room)} a month for loans. ${F.money(r.maxMonthly)} of it is left: enough to borrow ${F.money(r.loan)} over ${v.years} year${s(v.years)}.`;
      },
      rows: ['Share planned for loans', 'Loans already running', 'Possible monthly payment'],
      facts: (v, r, F) => [
        ['Possible monthly payment', F.money(r.maxMonthly)],
        ['Interest paid in total', F.money(r.interest)],
        ['Your loans today', `${F.pct(r.used)} of income`],
      ],
    },
    rendement: {
      invalid: 'Check your numbers: a price above zero, amounts that are not negative and 0 to 12 months without a tenant.',
      label: 'net yield a year',
      verdict: (v, r, F) => (r.netIncome <= 0
        ? `The expenses eat all the rent: the home costs you ${F.money(-r.netIncome)} a year, even before the loan.`
        : `Advertised at ${F.pct(r.gross, 2)} gross, the home earns ${F.pct(r.net, 2)} net: ${F.money(r.netIncome)} a year for ${F.money(r.total)} invested. It would take ${F.nf(r.payback, 1)} years of rent to pay back the purchase.`),
      chart: "A year's rent",
      rows: ['Rent collected', 'Expenses', "What's left"],
      facts: (v, r, F) => [
        ['Gross yield', F.pct(r.gross, 2)],
        ['Total cost', F.money(r.total)],
        ['Years to pay back the purchase', r.payback != null ? F.nf(r.payback, 1) : 'never'],
      ],
    },
    cashflow: {
      invalid: 'Check your numbers: amounts that are not negative and percentages from 0 to 100.',
      label: 'a month, after the loan',
      verdict: (v, r, F) => (r.cash >= 0
        ? `The home pays its loan and its expenses, and leaves you ${F.money(r.cash)} a month: ${F.money(r.yearly)} a year, before tax.`
        : `The rent doesn't cover everything: you top up ${F.money(-r.cash)} a month from your own pocket, ${F.money(-r.yearly)} a year. In return, you repay capital each month.`),
      chart: 'A typical month',
      rows: ['Rent collected', 'Loan', 'Expenses', 'Reserve for works'],
      facts: (v, r, F) => [
        ['Over a year', F.money(r.yearly)],
        ['The rent covers the loan at', r.cover != null ? F.pct(r.cover, 0) : 'no loan'],
        ['Going out each month', F.money(r.out)],
      ],
    },
    louer: {
      invalid: 'Check your numbers: a price above zero, whole terms from 1 to 40 years, a price rise from −20 to 20% and sensible rates.',
      label: (r) => (r.gap >= 0 ? 'more wealth by buying' : 'more wealth by renting'),
      verdict(v, r, F) {
        const y = `${v.horizon} year${s(v.horizon)}`;
        let t = r.gap >= 0
          ? `After ${y}, the buyer has ${F.money(r.buy)} and the renter ${F.money(r.rent)}: buying wins by ${F.money(r.gap)}.`
          : `After ${y}, the renter has ${F.money(r.rent)} and the buyer ${F.money(r.buy)}: renting wins by ${F.money(-r.gap)}.`;
        t += r.breakEven != null ? ` Buying takes the lead after ${r.breakEven} year${s(r.breakEven)}.` : ' Over this period, buying never takes the lead.';
        return t;
      },
      chart: 'Wealth gap, year after year',
      bar: (p, F) => `Year ${p.year}: buyer ${F.money(p.buy)}, renter ${F.money(p.rent)}`,
      legend: ['Buying is ahead', 'Renting is ahead'],
      facts: (v, r, F) => [
        ['Amount borrowed', F.money(r.loan)],
        ['Monthly payment', F.money(r.payment)],
        ['Value of the home at the end', F.money(r.home)],
      ],
      table: ['Year', 'Buyer', 'Renter'],
      row: (p, F) => [p.year === 0 ? 'Start' : 'Year ' + p.year, F.money(p.buy), F.money(p.rent)],
    },
    pub: {
      invalid: 'Check your numbers: a basket above zero, amounts that are not negative and fees from 0 to 100%.',
      label: 'profit after ads',
      verdict(v, r, F) {
        if (r.breakEvenRoas == null) return `Each order already costs you ${F.money(-r.margin)} before ads: no campaign can make up for that. Rethink your price or your costs.`;
        const roas = r.roas != null ? `Your ROAS is ${F.nf(r.roas, 2)}, against a break-even ROAS of ${F.nf(r.breakEvenRoas, 2)}. ` : '';
        return roas + (r.profit >= 0 ? `These ads leave you ${F.money(r.profit)}.`
          : `These ads lose you ${F.money(-r.profit)}: you would need ${F.nf(r.ordersNeeded)} orders to break even.`);
      },
      rows: ['Revenue', 'Margin before ads', 'Ad budget'],
      facts: (v, r, F) => [
        ['Break-even ROAS', r.breakEvenRoas != null ? F.nf(r.breakEvenRoas, 2) : '—'],
        ['Cost per order', r.cpa != null ? F.money(r.cpa) : '—'],
        ['Maximum cost per order', F.money(r.maxCpa)],
      ],
    },
    livraison: {
      invalid: 'Check your numbers: a basket above zero, a margin from 1 to 100% and amounts that are not negative.',
      label: 'minimum basket for free delivery',
      verdict: (v, r, F) => `A ${F.money(v.shipping)} delivery eats ${F.pct(r.eaten, 0)} of the margin on an average basket. To pay for it, you need ${F.money(r.extra)} more in the basket: offer free delivery from ${F.money(r.threshold)}.`,
      rows: ['Average basket today', 'Free delivery threshold'],
      facts: (v, r, F) => [
        ['Extra basket needed', F.money(r.extra)],
        ['Share of the margin eaten', F.pct(r.eaten, 0)],
        ['Free delivery on everything, per month', F.money(r.monthly)],
      ],
    },
    stock: {
      invalid: 'Check your numbers: sales above zero and numbers that are not negative.',
      label: 'units: the point to reorder at',
      verdict(v, r, F) {
        if (r.late) return `Your stock (${F.nf(v.stock)}) is already below the reorder point: order today. It lasts ${F.nf(r.daysLeft, 1)} days, against a lead time of ${F.nf(v.lead)} days` + (r.gap > 0 ? `: ${F.nf(r.gap, 1)} days out of stock if nothing changes.` : '.');
        return `Your stock lasts ${F.nf(r.daysLeft, 1)} days. Reorder when it drops below ${F.nf(r.point)} units: in about ${F.nf(r.orderIn)} day${s(r.orderIn)}.`;
      },
      rows: ['Stock today', 'Reorder point'],
      facts: (v, r, F) => [
        ['Days of stock', F.nf(r.daysLeft, 1)],
        ['Order in', r.late ? 'right now' : `${F.nf(r.orderIn)} day${s(r.orderIn)}`],
        ['Value of the stock', F.money(r.value)],
      ],
    },
    retours: {
      invalid: 'Check your numbers: a basket above zero, amounts that are not negative and percentages from 0 to 100.',
      label: 'cost of returns a month',
      verdict: (v, r, F) => `${F.nf(r.returned, 1)} returns a month, at ${F.money(r.perReturn)} each: ${F.money(r.total)} a month and ${F.money(r.yearly)} a year`
        + (r.share != null ? `, which is ${F.pct(r.share)} of your margin.` : '.'),
      rows: ["The month's margin, before returns", 'Cost of returns'],
      facts: (v, r, F) => [
        ['Cost of a return', F.money(r.perReturn)],
        ['Over a year', F.money(r.yearly)],
        ['Margin after returns', F.money(r.after)],
      ],
    },
    marketplace: {
      invalid: 'Check your numbers: a price above zero, amounts that are not negative and percentages from 0 to 100.',
      label: (r) => (r.gap >= 0 ? 'more per sale on your shop' : 'more per sale on the marketplace'),
      verdict(v, r, F) {
        if (r.gap === 0) return 'Both channels leave you the same per sale.';
        return r.gap > 0
          ? `Your shop leaves you ${F.money(r.site)} per sale, the marketplace ${F.money(r.mp)}. Your shop stays ahead as long as ads there cost less than ${F.money(r.adsLimit)} per sale.`
          : `The marketplace leaves you ${F.money(r.mp)} per sale, your shop ${F.money(r.site)}: ads there cost too much. Above ${F.money(r.adsLimit)} of ads per sale, the marketplace wins.`;
      },
      rows: ['On your shop', 'On the marketplace'],
      facts: (v, r, F) => [
        ['Marketplace fees, per sale', F.money(r.mpCost)],
        ['Your shop\'s fees, per sale', F.money(r.siteCost)],
        ['Maximum ads per sale on your shop', F.money(r.adsLimit)],
      ],
    },
    budget: {
      invalid: 'Check your numbers: income above zero and spending that is not negative.',
      label: 'left at the end of the month',
      verdict(v, r, F) {
        if (r.savings < 0) return `You spend ${F.money(-r.savings)} more than you earn each month: start with the wants, then renegotiate the big essential costs.`;
        return `You have ${F.money(r.savings)} left each month: ${F.pct(r.savingsPct)} of your income and ${F.money(r.yearly)} a year.`
          + (r.savingsPct >= 20 ? ' Above the 20% benchmark: well done.' : ` The 20% benchmark would be ${F.money(r.target.savings)}.`);
      },
      parts: ['Essentials', 'Wants', 'Left over'],
      chart: 'You and the 50 / 30 / 20 benchmark',
      table: ['', 'You', 'Benchmark'],
      facts: (v, r, F) => [
        ['Put aside over a year', F.money(r.yearly)],
        ['Essentials', F.pct(r.needsPct)],
        ['Wants', F.pct(r.wantsPct)],
      ],
    },
    dette: {
      invalid: 'Check your numbers: an amount owed and a payment above zero, and a rate from 0 to 100%.',
      never: 'Never',
      neverLabel: "the payment doesn't cover the interest",
      neverVerdict: (v, r, F) => `The first month's interest is already ${F.money(r.firstInterest)}: at ${F.money(v.payment)} a month, the debt doesn't go down. You need to pay at least ${F.money(r.minPayment)}, and much more to get out of it.`,
      label: (r) => `month${s(r.months)} to repay it all`,
      verdict(v, r, F) {
        let t = `At ${F.money(v.payment)} a month, you're done in ${r.months} month${s(r.months)} and pay ${F.money(r.interest)} in interest.`;
        if (r.saved != null) t += ` Paying ${F.money(v.extra)} more, it would be ${r.moreMonths} month${s(r.moreMonths)}, and ${F.money(r.saved)} less interest.`;
        return t;
      },
      chart: 'Still owed, year after year',
      bar: (p, F) => `Year ${p.year}: ${F.money(p.balance)}`,
      facts: (v, r, F) => [
        ['Interest in total', F.money(r.interest)],
        ["First month's interest", F.money(r.firstInterest)],
        ['Saved by paying more', r.saved != null ? F.money(r.saved) : '—'],
      ],
    },
    heures: {
      invalid: 'Check your numbers: a price, an income and hours above zero.',
      label: 'hours of work',
      verdict: (v, r, F) => `At ${F.money(r.hourly)} an hour, this purchase costs you ${F.nf(r.hours, 1)} hours of work: about ${F.nf(r.days, 1)} seven-hour day${r.days === 1 ? '' : 's'}.`
        + (v.years > 0 ? ` Invested for ${v.years} year${s(v.years)} at ${F.pct(v.rate)}, the money would become ${F.money(r.later)}.` : ''),
      rows: ['Price of the purchase', 'The same money invested'],
      facts: (v, r, F) => [
        ['Your hourly income', F.money(r.hourly)],
        ['In seven-hour days', F.nf(r.days, 1)],
        ["Share of the month's income", F.pct(r.share)],
      ],
    },
    voiture: {
      invalid: 'Check your numbers: a period from 1 to 40 years, a resale value from 0 to 100% and amounts that are not negative.',
      label: 'a month, all in',
      verdict: (v, r, F) => `Your car costs you ${F.money(r.year)} a year, which is ${F.money(r.month)} a month` + (r.perKm != null ? ` and ${F.money(r.perKm)} per kilometre.` : '.')
        + ` The biggest share: ${r.loss >= r.fuel && r.loss >= r.fixed ? 'the loss of value' : r.fuel >= r.fixed ? 'energy' : 'the fixed costs'}.`,
      chart: 'What a year costs',
      rows: ['Loss of value', 'Energy', 'Insurance, servicing, parking'],
      facts: (v, r, F) => [
        ['Per year', F.money(r.year)],
        ['Per kilometre', r.perKm != null ? F.money(r.perKm) : '—'],
        [`Over ${v.years} year${s(v.years)}`, F.money(r.total)],
      ],
    },
  },
};
