/* i18n.js — English-first taalwissel met een vast vlaggetje.
 *
 * Twee manieren om tekst te vertalen, vrij te combineren:
 *
 * 1) Dubbele blokken (fijn voor rijke tekst met tags/links):
 *      <p class="t en">English…</p>
 *      <p class="t nl">Nederlands…</p>
 *    CSS toont alleen de actieve taal (zie de synchroon geïnjecteerde stijl hieronder).
 *    Werkt op elk element (p, span, li, h2, a, …). Inline: gebruik <span class="t en/nl">.
 *
 * 2) Attribuut-overrides (fijn voor losse woorden en niet-tekst-attributen):
 *      data-nl="…"        → vervangt textContent (Engels blijft de bron in de HTML)
 *      data-nl-html="…"   → vervangt innerHTML
 *      data-nl-ph="…"     → placeholder ·  data-nl-title="…" → title ·  data-nl-aria="…" → aria-label
 *
 * Dynamische tekst (uit scripts): SiteLang.get() geeft de taal; SiteLang.onChange(fn)
 * roept fn(lang) meteen aan én bij elke wissel, zodat scripts hun eigen teksten zetten.
 *
 * Voorkeur onthouden in localStorage ("site-lang"). Nieuwe bezoekers krijgen Engels.
 */
(function(){
  "use strict";
  var KEY = "site-lang";
  var listeners = [];

  function stored(){
    try{ var v = localStorage.getItem(KEY); if(v === "en" || v === "nl") return v; }catch(e){}
    return null;
  }
  var lang = stored() || "en";                 // English-first
  function save(l){ try{ localStorage.setItem(KEY, l); }catch(e){} }

  // Synchroon (tijdens het parsen van <head>): zet de taal op <html> en injecteer de
  // dual-block-CSS, nog vóór de body rendert — zo geen zichtbare flits van beide talen.
  var root = document.documentElement;
  root.setAttribute("data-lang", lang);
  (function injectCSS(){
    var css = 'html[data-lang="en"] .t.nl{display:none!important}' +
              'html[data-lang="nl"] .t.en{display:none!important}' +
              '#lang-flag:hover{background:rgba(0,0,0,.7)!important}';
    var st = document.createElement("style");
    st.id = "i18n-style";
    st.appendChild(document.createTextNode(css));
    (document.head || root).appendChild(st);
  })();

  function applyAttrs(){
    root.setAttribute("data-lang", lang);
    root.lang = lang;
    document.querySelectorAll("[data-nl]").forEach(function(el){
      if(!el.hasAttribute("data-en")) el.setAttribute("data-en", el.textContent);
      el.textContent = lang === "nl" ? el.getAttribute("data-nl") : el.getAttribute("data-en");
    });
    document.querySelectorAll("[data-nl-html]").forEach(function(el){
      if(!el.hasAttribute("data-en-html")) el.setAttribute("data-en-html", el.innerHTML);
      el.innerHTML = lang === "nl" ? el.getAttribute("data-nl-html") : el.getAttribute("data-en-html");
    });
    [["data-nl-ph","placeholder","data-en-ph"],
     ["data-nl-title","title","data-en-title"],
     ["data-nl-aria","aria-label","data-en-aria"]].forEach(function(m){
      document.querySelectorAll("[" + m[0] + "]").forEach(function(el){
        if(!el.hasAttribute(m[2])) el.setAttribute(m[2], el.getAttribute(m[1]) || "");
        el.setAttribute(m[1], lang === "nl" ? el.getAttribute(m[0]) : el.getAttribute(m[2]));
      });
    });
  }

  function notify(){ listeners.forEach(function(fn){ try{ fn(lang); }catch(e){} }); }

  function setLang(l){
    lang = (l === "nl") ? "nl" : "en";
    save(lang);
    applyAttrs();
    updateFlag();
    notify();
  }

  var flagBtn = null;
  function updateFlag(){
    if(!flagBtn) return;
    var toNL = lang === "en";                  // toon de vlag van de taal waar je NAARTOE switcht
    flagBtn.textContent = toNL ? "🇳🇱" : "🇬🇧";
    var label = toNL ? "Schakel over naar Nederlands" : "Switch to English";
    flagBtn.setAttribute("aria-label", label);
    flagBtn.title = label;
  }
  function buildFlag(){
    if(flagBtn || !document.body) return;
    flagBtn = document.createElement("button");
    flagBtn.id = "lang-flag";
    flagBtn.type = "button";
    flagBtn.addEventListener("click", function(){ setLang(lang === "en" ? "nl" : "en"); });
    var s = flagBtn.style;
    s.position = "fixed"; s.top = "10px"; s.right = "10px"; s.zIndex = "99999";
    s.font = "20px/1 sans-serif"; s.lineHeight = "1"; s.background = "rgba(0,0,0,.5)";
    s.border = "1px solid rgba(255,255,255,.4)"; s.borderRadius = "10px";
    s.padding = "5px 8px"; s.cursor = "pointer"; s.webkitBackdropFilter = "blur(4px)"; s.backdropFilter = "blur(4px)";
    s.boxShadow = "0 2px 8px rgba(0,0,0,.3)";
    document.body.appendChild(flagBtn);
    updateFlag();
  }

  // Publieke API — synchroon beschikbaar zodra dit script is uitgevoerd.
  window.SiteLang = {
    get: function(){ return lang; },
    set: setLang,
    onChange: function(fn){
      listeners.push(fn);
      try{ fn(lang); }catch(e){}             // meteen initialiseren in de huidige taal
      return fn;
    }
  };

  function initDom(){ buildFlag(); applyAttrs(); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", initDom);
  else initDom();
})();
