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
    description: 'marketbuss: free arcade machines for founders, freelancers, investors and savers, plus today\'s real tools. No account.',
    skip: 'Skip to content',
    loading: 'Loading…',
    language: 'Language',
    nav: { outils: 'Machines', arsenal: 'Arsenal', parcours: 'Journey', pitch: 'Pitch', lexique: 'Glossary', 'a-propos': 'About' },
    foot: {
      blurb: 'Free tools for founders, freelancers, investors and savers. No account: everything is calculated in your browser.',
      links: { outils: 'All machines', arsenal: 'The arsenal', parcours: 'The journey', pitch: 'Pitch card', lexique: 'The glossary', 'a-propos': 'About' },
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
    highest: (v) => `Highest: ${v}`,
    newTab: '(new tab)',
    nTools: (n) => `${n} machine${s(n)}`,
    nItems: (n) => `${n} tool${s(n)}`,
    nWords: (n) => `${n} word${s(n)}`,
    fineprint: 'These tools are for understanding and practising. They are not financial, legal or tax advice.',

    home: {
      insert: 'Free tools, no account',
      tagline: 'The arcade for founders and investors.',
      lead: 'Cost a project, set a price, prepare a funding round, judge an investment: machines that do the maths, and today\'s real tools.',
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
    },

    tools: {
      all: 'All machines',
      allSub: (n) => `${n} machines, for four players.`,
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
          `${n.tools} machines to cost a project, set a price, assess an investment or understand a savings product.`,
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
          'The players and the guides (Mira, Noé, Sam, Max, Lou, Ada, Iris, Bit) are made-up characters. Their tips are general pointers.',
          'The values shown when a machine opens are examples invented to show the calculation. They describe no real company.',
        ]],
        ['How it is made', [
          'The site is a static page with no dependencies. The drawings are pixel art, drawn by hand in the code.',
          'The Press Start 2P and Jersey 15 fonts are under the free OFL licence and hosted with the site.',
          'The site exists in French, English and Dutch. The language you choose stays saved in this browser.',
        ]],
      ],
    },

    missing: { title: 'Page not found', sub: 'This page does not exist, or the link is incomplete.', home: 'Back to the home page', tools: 'See the machines' },
  },

  roles: {
    entrepreneur: { name: 'Founder', pitch: 'I am starting a project', about: 'The tools to cost your project, tell its story and prepare a funding round.' },
    independant: { name: 'Freelancer', pitch: 'I sell my work', about: 'The tools to set your prices, find your customers and know what you have left.' },
    investisseur: { name: 'Investor', pitch: 'I fund projects', about: 'The tools to assess an investment and test scenarios.' },
    epargnant: { name: 'Saver', pitch: 'I look after my savings', about: 'The tools to see what time, fees and rising prices do.' },
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
  },
};
