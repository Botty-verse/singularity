/*
 * Botty — gedeelde render-helpers (clientside)
 * ------------------------------------------------------------------
 * Het kleurenpalet en de spier-schaalformule die de hive-viewer en de
 * evolutie-pagina delen.
 *
 * NB: bewust NIET hier gedeeld omdat ze per pagina verschillen:
 *   - `groei` (sprite-schaal per levensfase) — andere waarden per view
 *   - `mutatieSvg` / `mutatiesSvg` — andere glow-varianten per view
 *   - kaarten.html heeft een eigen palet-set
 * Houd die dus lokaal in de betreffende pagina.
 */
(function (global) {
  "use strict";

  var paletten = [
    {naam:"Klassiek",broek:"#57b85f",broekRand:"#2e6b34",scherm:"#3a9d94",schermRand:"#2b8077",accent:"#2f8f86",oogje:"#bfe3df"},
    {naam:"Aqua",    broek:"#3fb6c9",broekRand:"#1f6f7e",scherm:"#2f8fa8",schermRand:"#236f84",accent:"#2f9fb0",oogje:"#cdeef5"},
    {naam:"Amethist",broek:"#9b78e0",broekRand:"#5e44a0",scherm:"#7b5bc4",schermRand:"#5a3f9a",accent:"#8a6fd0",oogje:"#e3d8fb"},
    {naam:"Zonnig",  broek:"#f6a623",broekRand:"#b97608",scherm:"#e08a1a",schermRand:"#a8650f",accent:"#f0a83a",oogje:"#ffe9c2"},
    {naam:"Koraal",  broek:"#e0556b",broekRand:"#a03048",scherm:"#d14761",schermRand:"#9a3149",accent:"#e06b80",oogje:"#fbd8df"},
    {naam:"Azuur",   broek:"#5ec6ff",broekRand:"#2f7fae",scherm:"#3a9de0",schermRand:"#236f9e",accent:"#4fb0ec",oogje:"#d3ecff"},
    {naam:"Mint",    broek:"#5fd0a8",broekRand:"#2e8a6a",scherm:"#3aa886",schermRand:"#247a5f",accent:"#3fb894",oogje:"#cdf5e6"}
  ];

  // Spier-schaal op basis van efficiëntie (0.55×–1.55×).
  function spierSchaal(eff) {
    return (0.55 + (typeof eff === "number" ? eff : 50) / 100 * 1.0).toFixed(2);
  }

  global.BottyRender = { paletten: paletten, spierSchaal: spierSchaal };
})(window);
