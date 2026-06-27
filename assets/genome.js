/*
 * Botty genoom — gedeelde clientside helpers
 * ------------------------------------------------------------------
 * Eén bron van waarheid voor de gen-layout + base64url-decoder.
 * Gebruikt door index.html (hive-viewer) en stamboom.html.
 *
 * LET OP: de autoritatieve genetica draait in de edge function
 * (supabase/functions/hive-tick/index.ts). Dit bestand is puur voor
 * het *tonen* van een bestaand genoom in de UI — houd de gen-volgorde
 * hieronder gelijk aan die in de edge function.
 *
 * Klassiek script (geen module) zodat bestaande IIFE-pagina's het
 * via window.BottyGenome kunnen gebruiken zonder herstructurering.
 */
(function (global) {
  "use strict";

  var GENOOM_LEN = 16;

  // Per gen: [kort label, lange uitleg, categorie]
  // Categorie bepaalt de kleur van het DNA-staafje.
  var genMeta = [
    ["E↓", "energie-verval", "verval"], ["D↓", "data-verval", "verval"],
    ["F↓", "fit-verval", "verval"],     ["G↓", "geluk-verval", "verval"],
    ["S↓", "stemming-verval", "verval"],
    ["E+", "energie-zorg", "zorg"],     ["D+", "data-zorg", "zorg"],
    ["F+", "fit-zorg", "zorg"],         ["G+", "geluk-zorg", "zorg"],
    ["🤒", "ziekte-kans", "risico"],    ["✚", "herstel-snelheid", "zorg"],
    ["👥", "sociale gevoeligheid", "overig"], ["🎨", "kleur-tint", "overig"],
    ["📏", "grootte", "overig"],        ["😯", "expressie-bias", "overig"],
    ["⏳", "veroudering", "overig"]
  ];

  var genKleur = { verval: "#e0556b", zorg: "#5fd0a8", risico: "#f6a623", overig: "#7b9bff" };

  // base64url-genoom → array van 16 bytes (ontbrekend = 128 = neutraal)
  function genoomBytes(g) {
    var arr = new Array(GENOOM_LEN);
    for (var i = 0; i < GENOOM_LEN; i++) arr[i] = 128;
    if (!g || typeof g !== "string") return arr;
    try {
      var b64 = g.replace(/-/g, "+").replace(/_/g, "/");
      b64 += "=".repeat((4 - (b64.length % 4)) % 4);
      var bin = atob(b64);
      for (var j = 0; j < GENOOM_LEN && j < bin.length; j++) arr[j] = bin.charCodeAt(j);
    } catch (e) { /* corrupt genoom → neutrale baseline */ }
    return arr;
  }

  // Erfelijke grootte (gen 13): 0.80×–1.20×. Valt terug op b.grootte als die er is.
  function grootteUit(b) {
    if (b && typeof b.grootte === "number") return b.grootte;
    var by = genoomBytes(b && b.genome);
    return 0.80 + (by[13] / 255) * 0.40;
  }

  global.BottyGenome = {
    GENOOM_LEN: GENOOM_LEN,
    genMeta: genMeta,
    genKleur: genKleur,
    genoomBytes: genoomBytes,
    grootteUit: grootteUit
  };
})(window);
