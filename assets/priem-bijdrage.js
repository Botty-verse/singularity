/*
 * priem-bijdrage.js — "Laat je browser meerekenen".
 * ------------------------------------------------------------------
 * Zet een klein, vriendelijk widget neer waarmee een bezoeker z'n
 * browser priemen kan laten zoeken voor de hive. Het zware rekenwerk
 * draait in priem-worker.js (aparte thread); gevonden reuzenpriemen
 * gaan naar de edge function `priem-claim`, die ze verifieert en aan
 * een levende Botty toekent.
 *
 * Bewust OPT-IN (rekenkracht/accu is van de bezoeker): standaard uit,
 * keuze onthouden in localStorage. Pauzeert vanzelf als het tabblad
 * verborgen is. Vereist BottyConfig (assets/botty-config.js).
 */
(function () {
  "use strict";
  if (!window.BottyConfig || !window.Worker) return;

  var CFG = window.BottyConfig;
  var CLAIM_URL = CFG.SUPABASE_URL + "/functions/v1/priem-claim";
  var SLEUTEL = "botty_priem_meerekenen";
  var DIGITS = /Mobi|Android/i.test(navigator.userAgent) ? 180 : 300;
  var CLAIM_THROTTLE = 3500;   // hoogstens ~1 inzending per 3,5s (rest telt lokaal mee)

  var aan = false, worker = null, pogingen = 0, gevonden = 0, laatsteClaim = 0;

  // ── UI ──────────────────────────────────────────────────────────────────────
  var css = document.createElement("style");
  css.textContent =
    "#priem-bijdrage{position:fixed;right:14px;bottom:14px;z-index:9999;width:230px;" +
    "font-family:'Nunito',system-ui,sans-serif;background:rgba(6,26,18,.94);color:#dff7ea;" +
    "border:1px solid #1c5b42;border-radius:14px;padding:.7rem .8rem;box-shadow:0 8px 30px rgba(0,0,0,.4);font-size:.82rem}" +
    "#priem-bijdrage h4{margin:0 0 .35rem;font-size:.82rem;color:#39ff85;display:flex;align-items:center;gap:.35rem}" +
    "#priem-bijdrage p{margin:0 0 .5rem;color:#a8d4be;line-height:1.4;font-size:.76rem}" +
    "#priem-bijdrage button{width:100%;border:none;border-radius:9px;padding:.45rem;font-weight:900;" +
    "font-family:inherit;font-size:.82rem;cursor:pointer;background:#1a7d4a;color:#fff;transition:background .15s}" +
    "#priem-bijdrage button:hover{background:#39ff85;color:#04140d}" +
    "#priem-bijdrage.aan button{background:#7a2018}" +
    "#priem-bijdrage.aan button:hover{background:#b52718;color:#fff}" +
    "#priem-bijdrage .stat{margin-top:.5rem;font-size:.74rem;color:#7fb89a;font-variant-numeric:tabular-nums;min-height:1.1em}" +
    "#priem-bijdrage .puls{display:inline-block;width:8px;height:8px;border-radius:50%;background:#39ff85;margin-right:.15rem}" +
    "#priem-bijdrage.aan .puls{animation:priempuls 1.1s ease-in-out infinite}" +
    "#priem-bijdrage .dicht{position:absolute;top:6px;right:9px;cursor:pointer;color:#5f8f78;font-size:.9rem}" +
    "@keyframes priempuls{0%,100%{opacity:.25}50%{opacity:1}}" +
    "@media(max-width:520px){#priem-bijdrage{width:190px;right:8px;bottom:8px}}";
  document.head.appendChild(css);

  var box = document.createElement("div");
  box.id = "priem-bijdrage";
  box.innerHTML =
    '<span class="dicht" title="verbergen">✕</span>' +
    '<h4><span class="puls"></span>Reken mee</h4>' +
    '<p>Laat je browser reuzenpriemen zoeken voor de hive. Elke vondst gaat naar een levende Botty.</p>' +
    '<button type="button"></button>' +
    '<div class="stat"></div>';
  var knop = box.querySelector("button");
  var stat = box.querySelector(".stat");
  box.querySelector(".dicht").onclick = function () { box.style.display = "none"; stop(); };

  function toonStat(extra) {
    if (aan) stat.textContent = pogingen.toLocaleString("nl-NL") + " getallen getest · " + gevonden + " gevonden";
    else stat.textContent = gevonden ? (gevonden + " gevonden deze sessie") : "";
    if (extra) stat.textContent = extra;
  }
  function verfrisKnop() {
    box.classList.toggle("aan", aan);
    knop.textContent = aan ? "⏸ Stop met rekenen" : "▶ Start met rekenen";
    toonStat();
  }

  // ── Motor ─────────────────────────────────────────────────────────────────────
  function start() {
    if (aan) return;
    aan = true;
    try { localStorage.setItem(SLEUTEL, "1"); } catch (e) {}
    worker = new Worker("assets/priem-worker.js");
    worker.onmessage = function (e) {
      var m = e.data || {};
      if (m.type === "bezig") { pogingen += m.pogingen; toonStat(); }
      else if (m.type === "vondst") { pogingen += m.pogingen; gevonden++; toonStat(); claim(m.cijfers); }
    };
    worker.postMessage({ type: "start", digits: DIGITS, rondes: 20 });
    verfrisKnop();
  }
  function stop() {
    if (!aan) return;
    aan = false;
    try { localStorage.setItem(SLEUTEL, "0"); } catch (e) {}
    if (worker) { worker.postMessage({ type: "stop" }); worker.terminate(); worker = null; }
    verfrisKnop();
  }

  function claim(cijfers) {
    // De browser vindt priemen sneller dan we ze zinnig kunnen wegschrijven;
    // stuur er dus een representatief deel in en laat de rest lokaal meetellen.
    var nu = Date.now();
    if (nu - laatsteClaim < CLAIM_THROTTLE) return;
    laatsteClaim = nu;
    fetch(CLAIM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": CFG.SUPABASE_ANON,
                 "Authorization": "Bearer " + CFG.SUPABASE_ANON },
      body: JSON.stringify({ cijfers: cijfers }),
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res && res.ok) toonStat("🎉 " + res.digits + " cijfers → toegekend aan " + res.ontdekker);
      // niet-ok (bv. al ontdekt / rem) stil doorlaten: de worker gaat door
    }).catch(function () {});
  }

  knop.onclick = function () { aan ? stop() : start(); };

  // Pauzeer als het tabblad verborgen is (accu/CPU sparen), hervat bij terugkeer.
  var wilde = false;
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { if (aan) { wilde = true; stop(); } }
    else if (wilde) { wilde = false; start(); }
  });

  document.addEventListener("DOMContentLoaded", function () {
    document.body.appendChild(box);
    verfrisKnop();
    try { if (localStorage.getItem(SLEUTEL) === "1") start(); } catch (e) {}
  });
  if (document.readyState !== "loading") {
    document.body.appendChild(box); verfrisKnop();
    try { if (localStorage.getItem(SLEUTEL) === "1") start(); } catch (e) {}
  }
})();
