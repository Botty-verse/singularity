/*
 * Botty — synthetische stemmen (Web Audio API, clientside)
 * ------------------------------------------------------------------
 * Geen audiobestanden: elke Botty "praat" in kort gebrabbel dat live wordt
 * gesynthetiseerd. Zijn stem is stabiel afgeleid van zijn naam (toonhoogte +
 * klankkleur) en zijn grootte-gen (grote Botty = lagere stem); baby's klinken
 * hoger. Stemmingen kleuren het contour: praten, blij, ziek, slaap.
 *
 * Gebruik:
 *   <script src="assets/botty-audio.js"></script>
 *   BottyAudio.unlock();            // 1× bij het eerste gebruikersgebaar
 *   BottyAudio.setDemping(false);   // geluid aan/uit (persist via localStorage)
 *   BottyAudio.spreek(botty, "blij");
 *
 * Browsers staan geluid pas toe ná een gebruikersgebaar — roep unlock() dus
 * vanuit een klik/kliklistener aan. Standaard staat het geluid UIT.
 */
(function (global) {
  "use strict";

  var ctx = null, master = null;
  var KEY = "botty-geluid";
  var gedempt = (function () {
    try { return localStorage.getItem(KEY) !== "aan"; } catch (_) { return true; }
  })();

  function hash(s) {
    var h = 2166136261; s = String(s || "");
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }

  // AudioContext pas aanmaken/hervatten binnen een gebruikersgebaar.
  function unlock() {
    try {
      if (!ctx) {
        var AC = global.AudioContext || global.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
    } catch (_) { /* audio is nooit kritisch */ }
  }

  function isGedempt() { return gedempt; }
  function setDemping(d) {
    gedempt = !!d;
    try { localStorage.setItem(KEY, gedempt ? "uit" : "aan"); } catch (_) {}
    if (!gedempt) unlock();
  }

  // Stabiele stem per Botty: basisfrequentie, oscillatortype, formant-toon.
  function stemVan(b) {
    var h = hash(b && b.naam);
    var base = 205 + (h % 170);                       // 205..375 Hz grondtoon
    var grootte = (b && typeof b.grootte === "number") ? b.grootte : 1;
    base *= (1.18 - Math.min(0.34, (grootte - 0.7) * 0.5)); // groter → lager
    var stage = b && b.stage;
    if (stage === "baby") base *= 1.4;
    else if (stage === "tiener") base *= 1.14;
    var types = ["square", "sawtooth", "triangle"];
    return { base: base, type: types[h % 3], formant: 620 + (h % 6) * 220 };
  }

  var STEMMING = {
    praat: { step: 1.00, dur: 0.085, gap: 0.030, filt: 1.0,  vol: 0.17 },
    blij:  { step: 1.05, dur: 0.075, gap: 0.022, filt: 1.45, vol: 0.19 },
    ziek:  { step: 0.93, dur: 0.150, gap: 0.055, filt: 0.65, vol: 0.14 },
    slaap: { step: 0.985, dur: 0.230, gap: 0.090, filt: 0.5, vol: 0.11 },
  };

  // Eén lettergreep = oscillator door een bandpass (formant) met een snelle env.
  function lettergreep(t, freq, v, cfg) {
    var osc = ctx.createOscillator(); osc.type = v.type;
    osc.frequency.setValueAtTime(freq * 0.88, t);
    osc.frequency.linearRampToValueAtTime(freq, t + 0.02);
    osc.frequency.linearRampToValueAtTime(freq * 0.95, t + cfg.dur);
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = v.formant * cfg.filt; bp.Q.value = 5.5;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(cfg.vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0006, t + cfg.dur);
    osc.connect(bp); bp.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + cfg.dur + 0.03);
  }

  // Een "woord": een handjevol lettergrepen met licht driftend contour.
  function spreek(b, stemming) {
    if (gedempt || !ctx) return;
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (_) {} }
    var cfg = STEMMING[stemming] || STEMMING.praat;
    var v = stemVan(b);
    var n = 2 + (hash((b && b.naam) + stemming) % 4);   // 2..5 lettergrepen
    var t = ctx.currentTime + 0.01;
    var pitch = v.base;
    for (var i = 0; i < n; i++) {
      lettergreep(t, pitch, v, cfg);
      t += cfg.dur + cfg.gap;
      // drift rond de grondtoon + stemming-contour (blij stijgt, ziek zakt)
      pitch *= (1 + (Math.random() - 0.45) * 0.14) * cfg.step;
      pitch = Math.max(120, Math.min(900, pitch));
    }
  }

  global.BottyAudio = {
    unlock: unlock,
    spreek: spreek,
    setDemping: setDemping,
    isGedempt: isGedempt,
  };
})(window);
