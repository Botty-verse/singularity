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
  // De korte labels zijn taalneutraal (symbolen); alleen de lange uitleg verschilt per taal.
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

  // Engelse lange uitleg per gen (zelfde volgorde en categorie).
  var genLangEN = [
    "energy decay", "data decay", "fitness decay", "happiness decay", "mood decay",
    "energy care", "data care", "fitness care", "happiness care",
    "illness chance", "recovery speed", "social sensitivity", "colour tint",
    "size", "expression bias", "ageing"
  ];
  // genMeta in de gevraagde taal ("en"/"nl"); NL is de standaard/bron.
  function genMetaFor(lang){
    if(lang !== "en") return genMeta;
    return genMeta.map(function(m, i){ return [m[0], genLangEN[i], m[2]]; });
  }

  var genKleur = { verval: "#e0556b", zorg: "#5fd0a8", risico: "#f6a623", overig: "#7b9bff" };
  var catLabelNL = { verval:"verval", zorg:"zorg", risico:"risico", overig:"overig" };
  var catLabelEN = { verval:"decay", zorg:"care", risico:"risk", overig:"other" };
  function catLabelFor(lang){ return lang === "en" ? catLabelEN : catLabelNL; }

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
    genMeta: genMeta,          // NL (backward compatible)
    genMetaFor: genMetaFor,    // taalbewust: genMetaFor("en"|"nl")
    genKleur: genKleur,
    catLabelFor: catLabelFor,  // taalbewust categorie-label
    genoomBytes: genoomBytes,
    grootteUit: grootteUit
  };
})(window);
