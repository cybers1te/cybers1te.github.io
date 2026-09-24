/* Logique du popup : injecte scanner.js dans l'onglet actif, affiche le
 * rapport, et déclenche la neutralisation locale.
 *
 * Les textes affichés proviennent d'une page potentiellement hostile :
 * on les insère TOUJOURS via textContent, jamais via innerHTML, pour
 * qu'un site ne puisse pas injecter de code dans l'extension elle-même.
 */
"use strict";

var KIND_LABEL = {
  "miner": "Mineur de crypto",
  "obfuscation": "Code obfusqué",
  "thirdparty": "Script tiers",
  "hidden-iframe": "Iframe masquée",
  "form-hijack": "Formulaire détourné",
  "keylogger": "Capture clavier",
  "inline-handler": "Gestionnaire suspect",
  "redirect": "Redirection"
};

var lastReport = null;

function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

async function activeTab() {
  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

// Injecte le moteur puis exécute une fonction dans le même monde isolé.
async function run(tabId, func, args) {
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["scanner.js"]
  });
  var res = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: func,
    args: args || []
  });
  return res && res[0] ? res[0].result : null;
}

function render(report) {
  lastReport = report;
  var list = document.getElementById("list");
  list.replaceChildren();

  ["high", "medium", "low"].forEach(function (s) {
    document.getElementById("c-" + s).textContent = report.counts[s];
  });

  if (!report.findings.length) {
    list.appendChild(el("div", "empty ok",
      "Aucun signal suspect détecté sur cette page."));
    document.getElementById("clean").disabled = true;
    return;
  }

  report.findings.forEach(function (f) {
    var item = el("div", "item " + f.severity);
    item.appendChild(el("div", "k", KIND_LABEL[f.kind] || f.kind));
    item.appendChild(el("div", "m", f.message));
    if (f.detail) item.appendChild(el("div", "d", f.detail));
    list.appendChild(item);
  });

  document.getElementById("clean").disabled = false;
}

function showError(msg) {
  var list = document.getElementById("list");
  list.replaceChildren(el("div", "empty", msg));
  document.getElementById("clean").disabled = true;
}

async function doScan() {
  var tab = await activeTab();
  try {
    document.getElementById("host").textContent = new URL(tab.url).hostname;
  } catch (e) { /* url non lisible */ }

  try {
    var report = await run(tab.id, function () {
      return window.__PAGE_AUDITOR__.scan();
    });
    render(report);
  } catch (e) {
    // Pages système (chrome://, Chrome Web Store…) : injection interdite.
    showError("Cette page ne peut pas être analysée (page protégée du navigateur).");
  }
}

async function doClean() {
  if (!lastReport) return;
  var tab = await activeTab();
  var refs = lastReport.findings
    .map(function (f) { return f.ref; })
    .filter(Boolean);

  var out = await run(tab.id, function (r) {
    return window.__PAGE_AUDITOR__.neutralize(r);
  }, [refs]);

  var n = out ? out.neutralized : 0;
  var s = out ? out.scripts : 0;
  await doScan();
  var list = document.getElementById("list");
  if (s > 0) {
    list.prepend(el("div", "empty",
      s + " script(s) retiré(s) : un code déjà lancé peut continuer de " +
      "tourner. Fermez l'onglet pour l'arrêter à coup sûr."));
  }
  list.prepend(el("div", "empty ok",
    n + " élément(s) neutralisé(s) dans cet onglet."));
}

document.getElementById("rescan").addEventListener("click", doScan);
document.getElementById("clean").addEventListener("click", doClean);
doScan();
