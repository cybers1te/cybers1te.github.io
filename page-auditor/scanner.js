/* Page Auditor — moteur d'analyse défensive.
 *
 * Ce fichier est injecté dans la page que VOUS visitez, dans VOTRE
 * navigateur. Il inspecte ce qui est déjà chargé (scripts, iframes,
 * formulaires, écouteurs) et repère par heuristiques les signaux
 * typiques de code indésirable. C'est un détecteur : il signale du
 * suspect, il ne certifie rien.
 *
 * IMPORTANT : « neutraliser » agit uniquement sur la copie de la page
 * rendue dans votre onglet. Le site distant n'est pas modifié — ni pour
 * vous au prochain rechargement, ni pour personne d'autre.
 */
(function () {
  "use strict";

  // Si le moteur est injecté comme balise <script> (et non via l'API
  // d'extension, qui n'ajoute rien au DOM), il ne doit pas s'analyser
  // lui-même : sa liste de noms de mineurs le ferait passer pour un mineur.
  // On retient chacune de ses balises, y compris lors d'une ré-injection.
  if (window.__PAGE_AUDITOR__) {
    window.__PAGE_AUDITOR__._ignore(document.currentScript);
    return window.__PAGE_AUDITOR__;
  }

  var SELVES = [];
  function ignore(node) {
    if (node) SELVES.push(node);
  }
  ignore(document.currentScript);

  var SEVERITY = { HIGH: "high", MEDIUM: "medium", LOW: "low" };

  function pageScripts() {
    return Array.prototype.filter.call(document.scripts, function (s) {
      return SELVES.indexOf(s) === -1;
    });
  }

  // Petite liste indicative de familles connues. Un site sérieux peut
  // référencer ces chaînes légitimement : c'est un signal, pas un verdict.
  var MINER_HINTS = [
    "coinhive", "coin-hive", "cryptonight", "cryptoloot", "crypto-loot",
    "webminepool", "webmine", "minero", "coinimp", "deepminer",
    "jsecoin", "authedmine", "webassembly.*miner"
  ];

  var OBFUSCATION_HINTS = [
    /\beval\s*\(/,
    /new\s+Function\s*\(/,
    /document\.write\s*\(/,
    /\batob\s*\(/,
    /unescape\s*\(/,
    /String\.fromCharCode\s*\(/,
    /\\x[0-9a-f]{2}(?:\\x[0-9a-f]{2}){8,}/i, // longues séquences \xNN
    /(?:%[0-9a-f]{2}){12,}/i                 // longues séquences %NN encodées
  ];

  function hostOf(url) {
    try {
      return new URL(url, location.href).hostname.toLowerCase();
    } catch (e) {
      return "";
    }
  }

  // Domaine « enregistrable » approché : les deux derniers segments, ou trois
  // pour les suffixes nationaux à deux niveaux (bbc.co.uk, abc.com.au…).
  function site(host) {
    var parts = host.split(".");
    var two = parts.slice(-2).join(".");
    var n = /^(?:co|com|net|org|gov|edu|ac|ne|or|go)\.[a-z]{2}$/.test(two) ? 3 : 2;
    return parts.slice(-n).join(".");
  }

  function isThirdParty(url) {
    var h = hostOf(url);
    if (!h) return false;
    return site(location.hostname.toLowerCase()) !== site(h);
  }

  function looksHidden(el) {
    var cs;
    try {
      cs = getComputedStyle(el);
    } catch (e) {
      return false;
    }
    var r = el.getBoundingClientRect();
    // Hors écran = rejeté au-dessus ou à gauche du document (coordonnées
    // absolues). Une iframe simplement plus bas dans la page n'est pas cachée.
    var offscreen = (r.bottom + scrollY) < 0 || (r.right + scrollX) < 0;
    var tiny = (r.width <= 2 && r.height <= 2);
    var invisible = cs.display === "none" || cs.visibility === "hidden" ||
      parseFloat(cs.opacity || "1") === 0;
    return tiny || invisible || offscreen;
  }

  function shorten(s, n) {
    s = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n) + "…" : s;
  }

  // Références vers les éléments signalés, gardées dans la fermeture du
  // moteur et non dans le DOM : la page ne peut ni les lire ni les
  // falsifier (par exemple en posant le même identifiant sur un leurre pour
  // détourner la neutralisation), et le scan ne modifie jamais la page.
  // Un élément garde le même identifiant d'un scan à l'autre, pour qu'un
  // rapport précédent reste utilisable.
  var REFS = new Map();     // identifiant → élément
  var IDS = new WeakMap();  // élément → identifiant
  var _id = 0;
  function tag(el) {
    var ref = IDS.get(el);
    if (!ref) {
      ref = "pa" + (++_id);
      IDS.set(el, ref);
      REFS.set(ref, el);
    }
    return ref;
  }

  function finding(sev, kind, message, el, detail) {
    return {
      severity: sev,
      kind: kind,
      message: message,
      detail: detail || "",
      ref: el ? tag(el) : null,
      node: el ? el.nodeName.toLowerCase() : null
    };
  }

  // --- Détecteurs ---------------------------------------------------------

  function checkMiners(list) {
    var re = new RegExp(MINER_HINTS.join("|"), "i");
    pageScripts().forEach(function (s) {
      var hay = (s.src || "") + " " + (s.textContent || "");
      if (re.test(hay)) {
        list.push(finding(
          SEVERITY.HIGH, "miner",
          "Script référençant un mineur de cryptomonnaie connu. Fermez " +
            "l'onglet : retirer la balise n'arrête pas un script déjà lancé.",
          s, s.src || shorten(s.textContent, 120)
        ));
      }
    });
  }

  function checkObfuscation(list) {
    pageScripts().forEach(function (s) {
      var code = s.textContent || "";
      if (!code || code.length < 40) return;
      var hits = OBFUSCATION_HINTS.filter(function (r) { return r.test(code); });
      // Un seul eval() n'est pas suspect ; on demande plusieurs signaux
      // OU une très longue charge encodée.
      if (hits.length >= 2) {
        list.push(finding(
          SEVERITY.MEDIUM, "obfuscation",
          "Script en ligne au code obfusqué (" + hits.length + " signaux).",
          s, shorten(code, 120)
        ));
      }
    });
  }

  function checkThirdPartyScripts(list) {
    pageScripts().forEach(function (s) {
      if (!s.src || !isThirdParty(s.src)) return;
      var h = hostOf(s.src);
      // Nom de fichier au motif aléatoire : signal faible mais utile.
      var random = /\/[a-z0-9]{16,}\.js(\?|$)/i.test(s.src) ||
        /[?&](?:t|ts|v|cb)=\d{10,}/.test(s.src);
      if (random) {
        list.push(finding(
          SEVERITY.LOW, "thirdparty",
          "Script tiers au nom/paramètre inhabituel : " + h,
          s, s.src
        ));
      }
    });
  }

  function checkHiddenIframes(list) {
    Array.prototype.forEach.call(document.querySelectorAll("iframe"), function (f) {
      if (!looksHidden(f)) return;
      var src = f.getAttribute("src") || "(sans src)";
      list.push(finding(
        SEVERITY.MEDIUM, "hidden-iframe",
        "Iframe masquée" + (isThirdParty(src) ? " vers un tiers" : "") +
          " — technique courante de clickjacking ou de malvertising.",
        f, src
      ));
    });
  }

  function checkFormHijack(list) {
    Array.prototype.forEach.call(document.querySelectorAll("form"), function (form) {
      // L'action du formulaire, plus celles des boutons (formaction), qui la
      // remplacent au moment de l'envoi.
      var targets = [form.getAttribute("action") || ""];
      Array.prototype.forEach.call(form.querySelectorAll("[formaction]"), function (b) {
        targets.push(b.getAttribute("formaction") || "");
      });
      var dest = targets.filter(function (t) { return t && isThirdParty(t); })[0];
      if (!dest) return;
      var hasSecret = form.querySelector(
        'input[type="password"], input[autocomplete*="cc-"], ' +
        'input[name*="pass" i], input[name*="card" i], input[name*="cvv" i]'
      );
      if (hasSecret) {
        list.push(finding(
          SEVERITY.HIGH, "form-hijack",
          "Formulaire contenant un champ sensible envoyé à un domaine tiers : " +
            hostOf(dest),
          form, dest
        ));
      }
    });
  }

  function checkPasswordSniffers(list) {
    // Champs mot de passe surveillés touche par touche = signal d'exfiltration.
    Array.prototype.forEach.call(
      document.querySelectorAll('input[type="password"]'),
      function (inp) {
        // On ne peut pas lister les écouteurs déjà posés, mais on repère
        // les attributs inline, qui, eux, sont visibles.
        ["onkeydown", "onkeypress", "onkeyup", "oninput"].forEach(function (a) {
          if (inp.getAttribute(a)) {
            list.push(finding(
              SEVERITY.HIGH, "keylogger",
              "Champ mot de passe avec gestionnaire clavier en ligne (" + a + ").",
              inp, inp.getAttribute(a)
            ));
          }
        });
      }
    );
  }

  function checkInlineHandlers(list) {
    // Gestionnaires en ligne appelant du code dynamique = vecteur d'injection.
    var suspects = /(?:eval|Function|document\.write|atob|fromCharCode)\s*\(/;
    Array.prototype.forEach.call(
      document.querySelectorAll("*"),
      function (el) {
        if (!el.attributes) return;
        for (var i = 0; i < el.attributes.length; i++) {
          var at = el.attributes[i];
          if (at.name.slice(0, 2) === "on" && suspects.test(at.value || "")) {
            list.push(finding(
              SEVERITY.MEDIUM, "inline-handler",
              "Attribut " + at.name + " exécutant du code dynamique.",
              el, shorten(at.value, 100)
            ));
            break;
          }
        }
      }
    );
  }

  function checkRedirectTricks(list) {
    // meta refresh vers un tiers.
    Array.prototype.forEach.call(
      document.querySelectorAll('meta[http-equiv="refresh" i]'),
      function (m) {
        var c = m.getAttribute("content") || "";
        var url = (c.split(/url=/i)[1] || "").trim();
        if (url && isThirdParty(url)) {
          list.push(finding(
            SEVERITY.MEDIUM, "redirect",
            "Redirection automatique vers un domaine tiers : " + hostOf(url),
            m, url
          ));
        }
      }
    );
  }

  // --- Orchestration ------------------------------------------------------

  function scan() {
    // Oublie les éléments sortis de la page depuis le dernier scan.
    REFS.forEach(function (el, ref) {
      if (!el.isConnected) REFS.delete(ref);
    });
    var findings = [];
    var checks = [
      checkMiners, checkObfuscation, checkThirdPartyScripts,
      checkHiddenIframes, checkFormHijack, checkPasswordSniffers,
      checkInlineHandlers, checkRedirectTricks
    ];
    checks.forEach(function (fn) {
      try { fn(findings); } catch (e) { /* un détecteur ne doit pas tout casser */ }
    });

    var order = { high: 0, medium: 1, low: 2 };
    findings.sort(function (a, b) { return order[a.severity] - order[b.severity]; });

    return {
      url: location.href,
      when: new Date().toISOString(),
      counts: {
        high: findings.filter(function (f) { return f.severity === "high"; }).length,
        medium: findings.filter(function (f) { return f.severity === "medium"; }).length,
        low: findings.filter(function (f) { return f.severity === "low"; }).length
      },
      findings: findings
    };
  }

  // Neutralise localement les éléments signalés (par leurs identifiants).
  // Ne touche jamais le site distant, seulement le DOM de cet onglet.
  function neutralize(refs) {
    var removed = 0;
    var scripts = 0;
    var done = new Set(); // un élément peut porter plusieurs alertes
    (refs || []).forEach(function (ref) {
      var el = REFS.get(ref);
      if (!el || done.has(el) || !el.isConnected) return;
      done.add(el);
      var name = el.nodeName.toLowerCase();
      try {
        if (name === "script") {
          // Empêche une ré-exécution, mais le code déjà lancé continue.
          el.remove();
          scripts++;
        } else if (name === "iframe") {
          // Retirer l'iframe détruit réellement son contexte d'exécution.
          el.remove();
        } else if (name === "form") {
          // On désarme l'envoi sans casser la mise en page, y compris les
          // boutons dont le formaction contournerait l'action du formulaire.
          el.setAttribute("action", "about:blank");
          Array.prototype.forEach.call(el.querySelectorAll("[formaction]"), function (b) {
            b.removeAttribute("formaction");
          });
          el.addEventListener("submit", function (ev) { ev.preventDefault(); }, true);
        } else if (name === "meta") {
          el.remove();
        } else {
          // Élément avec attribut on* dangereux : on retire les handlers.
          for (var i = el.attributes.length - 1; i >= 0; i--) {
            if (el.attributes[i].name.slice(0, 2) === "on") {
              el.removeAttribute(el.attributes[i].name);
            }
          }
        }
        removed++;
      } catch (e) { /* ignore */ }
    });
    return { neutralized: removed, scripts: scripts };
  }

  var api = { scan: scan, neutralize: neutralize, _ignore: ignore };
  window.__PAGE_AUDITOR__ = api;
  return api;
})();
