/*
 * Botty — gedeelde SVG-sprites (clientside)
 * ------------------------------------------------------------------
 * De canonieke Botty-tekening in drie levensfasen. Elke functie krijgt
 * een palet-object met de sleutels: broek, broekRand, scherm, schermRand,
 * accent, oogje — en geeft de <g>-inhoud van een 200×250 viewBox terug.
 *
 * Gebruik:
 *   <script src="assets/botty-sprites.js"></script>
 *   var sprites = BottySprites.set;   // { baby, tiener, volwassen }
 *   svg.innerHTML = sprites[stage](palet);
 *
 * LET OP: evolutie.html en kaarten.html gebruiken bewust eigen varianten
 * (vereenvoudigd resp. kaart-formaat). Wijzig die daar, niet hier.
 */
(function (global) {
  "use strict";

  function spriteVolwassen(p){ return ''
    + '<g class="antenne"><path d="M100,46 Q96,28 109,20" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>'
    +   '<circle cx="111" cy="16" r="6.5" fill="#8c9196" stroke="#2b2b2b" stroke-width="2.5"/>'
    +   '<path class="ster" d="M111,1 L112.4,5.6 117,7 112.4,8.4 111,13 109.6,8.4 105,7 109.6,5.6 Z" fill="#ffd54a" stroke="#f6a623" stroke-width="0.6"/></g>'
    + '<g class="been"><line x1="86" y1="212" x2="80" y2="236" stroke="#2b2b2b" stroke-width="4"/><ellipse cx="78" cy="239" rx="11" ry="6" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<g class="been"><line x1="114" y1="212" x2="120" y2="236" stroke="#2b2b2b" stroke-width="4"/><ellipse cx="122" cy="239" rx="11" ry="6" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<g class="arm arm-l"><line x1="66" y1="156" x2="36" y2="184" stroke="#2b2b2b" stroke-width="4"/><circle class="spier" cx="55" cy="166" r="7.5" fill="'+p.broek+'" stroke="#2b2b2b" stroke-width="2"/><circle cx="34" cy="187" r="6" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<g class="arm arm-r"><line x1="134" y1="156" x2="164" y2="184" stroke="#2b2b2b" stroke-width="4"/><circle class="spier" cx="145" cy="166" r="7.5" fill="'+p.broek+'" stroke="#2b2b2b" stroke-width="2"/><circle cx="166" cy="187" r="6" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<rect x="68" y="184" width="64" height="30" rx="10" fill="'+p.broek+'" stroke="'+p.broekRand+'" stroke-width="3"/><line x1="100" y1="200" x2="100" y2="214" stroke="'+p.broekRand+'" stroke-width="3"/>'
    + '<rect x="66" y="140" width="68" height="52" rx="20" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="3"/><rect x="84" y="150" width="32" height="20" rx="7" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/>'
    + '<path d="M93,124 q14,4 0,7 q-14,4 0,7" fill="none" stroke="#9aa0a4" stroke-width="4" stroke-linecap="round"/>'
    + '<g class="kop"><circle cx="52" cy="76" r="13" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="52" cy="76" r="6" fill="'+p.oogje+'"/>'
    +   '<circle cx="148" cy="76" r="13" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="148" cy="76" r="6" fill="'+p.oogje+'"/>'
    +   '<path d="M72,46 Q52,48 52,76 Q52,108 72,122 Q100,134 128,122 Q148,108 148,76 Q148,48 128,46 Q100,40 72,46 Z" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="3"/>'
    +   '<path d="M80,64 Q100,60 120,64 Q131,66 125,79 L107,106 Q100,115 93,106 L75,79 Q69,66 80,64 Z" fill="'+p.scherm+'" stroke="'+p.schermRand+'" stroke-width="1.5"/>'
    +   '<line x1="90" y1="78" x2="90" y2="90" stroke="#1f2a28" stroke-width="4.5" stroke-linecap="round"/><line x1="110" y1="78" x2="110" y2="90" stroke="#1f2a28" stroke-width="4.5" stroke-linecap="round"/>'
    +   '<path d="M93,97 Q100,101 107,97 Q106,108 100,109 Q94,108 93,97 Z" fill="#15605a"/></g>'; }

  function spriteBaby(p){ return ''
    + '<g class="antenne"><path d="M100,8 Q96,-9 109,-16" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>'
    +   '<circle cx="111" cy="-20" r="6.5" fill="#8c9196" stroke="#2b2b2b" stroke-width="2.5"/>'
    +   '<path class="ster" d="M111,-29 L112.4,-24.4 117,-23 112.4,-21.6 111,-17 109.6,-21.6 105,-23 109.6,-24.4 Z" fill="#ffd54a" stroke="#f6a623" stroke-width="0.6"/></g>'
    + '<g class="been"><line x1="88" y1="204" x2="82" y2="228" stroke="#2b2b2b" stroke-width="4"/><ellipse cx="80" cy="231" rx="10" ry="5.5" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<g class="been"><line x1="112" y1="204" x2="118" y2="228" stroke="#2b2b2b" stroke-width="4"/><ellipse cx="120" cy="231" rx="10" ry="5.5" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<g class="arm arm-l"><line x1="66" y1="156" x2="44" y2="176" stroke="#2b2b2b" stroke-width="4"/><circle class="spier" cx="57" cy="163" r="6.5" fill="'+p.broek+'" stroke="#2b2b2b" stroke-width="2"/><circle cx="42" cy="179" r="6" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<g class="arm arm-r"><line x1="134" y1="156" x2="156" y2="176" stroke="#2b2b2b" stroke-width="4"/><circle class="spier" cx="143" cy="163" r="6.5" fill="'+p.broek+'" stroke="#2b2b2b" stroke-width="2"/><circle cx="158" cy="179" r="6" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<rect x="71" y="197" width="58" height="24" rx="9" fill="'+p.broek+'" stroke="'+p.broekRand+'" stroke-width="3"/><line x1="100" y1="210" x2="100" y2="221" stroke="'+p.broekRand+'" stroke-width="3"/>'
    + '<rect x="67" y="148" width="66" height="42" rx="16" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="3"/><rect x="83" y="157" width="34" height="18" rx="6" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/>'
    + '<path d="M93,130 q14,3 0,6 q-14,3 0,6" fill="none" stroke="#9aa0a4" stroke-width="4" stroke-linecap="round"/>'
    + '<g class="kop"><circle cx="36" cy="70" r="18" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="36" cy="70" r="8" fill="'+p.oogje+'"/>'
    +   '<circle cx="164" cy="70" r="18" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="164" cy="70" r="8" fill="'+p.oogje+'"/>'
    +   '<path d="M72,10 Q36,12 36,70 Q36,116 72,132 Q100,142 128,132 Q164,116 164,70 Q164,12 128,10 Q100,4 72,10 Z" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="3"/>'
    +   '<path d="M76,58 Q100,52 124,58 Q136,62 130,78 L112,107 Q100,118 88,107 L70,78 Q64,62 76,58 Z" fill="'+p.scherm+'" stroke="'+p.schermRand+'" stroke-width="1.5"/>'
    +   '<line x1="90" y1="76" x2="90" y2="92" stroke="#1f2a28" stroke-width="5.5" stroke-linecap="round"/><line x1="110" y1="76" x2="110" y2="92" stroke="#1f2a28" stroke-width="5.5" stroke-linecap="round"/>'
    +   '<path d="M93,97 Q100,101 107,97 Q106,108 100,109 Q94,108 93,97 Z" fill="#15605a"/></g>'; }

  function spriteTiener(p){ return ''
    + '<g class="antenne"><path d="M100,46 Q96,28 109,20" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>'
    +   '<circle cx="111" cy="16" r="6.5" fill="#8c9196" stroke="#2b2b2b" stroke-width="2.5"/>'
    +   '<path class="ster" d="M111,1 L112.4,5.6 117,7 112.4,8.4 111,13 109.6,8.4 105,7 109.6,5.6 Z" fill="#ffd54a" stroke="#f6a623" stroke-width="0.6"/></g>'
    + '<g class="been"><line x1="86" y1="218" x2="76" y2="248" stroke="#2b2b2b" stroke-width="3.5"/><ellipse cx="74" cy="251" rx="11" ry="5.5" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<g class="been"><line x1="114" y1="218" x2="124" y2="248" stroke="#2b2b2b" stroke-width="3.5"/><ellipse cx="126" cy="251" rx="11" ry="5.5" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<g class="arm arm-l"><line x1="66" y1="155" x2="26" y2="202" stroke="#2b2b2b" stroke-width="3.5"/><circle class="spier" cx="50" cy="173" r="7.5" fill="'+p.broek+'" stroke="#2b2b2b" stroke-width="2"/><circle cx="24" cy="205" r="5.5" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<g class="arm arm-r"><line x1="134" y1="155" x2="174" y2="202" stroke="#2b2b2b" stroke-width="3.5"/><circle class="spier" cx="150" cy="173" r="7.5" fill="'+p.broek+'" stroke="#2b2b2b" stroke-width="2"/><circle cx="176" cy="205" r="5.5" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/></g>'
    + '<rect x="67" y="193" width="66" height="30" rx="10" fill="'+p.broek+'" stroke="'+p.broekRand+'" stroke-width="3"/><line x1="100" y1="209" x2="100" y2="223" stroke="'+p.broekRand+'" stroke-width="3"/>'
    + '<rect x="65" y="136" width="70" height="62" rx="20" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="3"/><rect x="82" y="148" width="36" height="22" rx="7" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/>'
    + '<path d="M93,124 q14,4 0,7 q-14,4 0,7" fill="none" stroke="#9aa0a4" stroke-width="4" stroke-linecap="round"/>'
    + '<g class="kop"><circle cx="52" cy="76" r="13" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="52" cy="76" r="6" fill="'+p.oogje+'"/>'
    +   '<circle cx="148" cy="76" r="13" fill="'+p.accent+'" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="148" cy="76" r="6" fill="'+p.oogje+'"/>'
    +   '<path d="M72,46 Q52,48 52,76 Q52,108 72,122 Q100,134 128,122 Q148,108 148,76 Q148,48 128,46 Q100,40 72,46 Z" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="3"/>'
    +   '<path d="M80,64 Q100,60 120,64 Q131,66 125,79 L107,106 Q100,115 93,106 L75,79 Q69,66 80,64 Z" fill="'+p.scherm+'" stroke="'+p.schermRand+'" stroke-width="1.5"/>'
    +   '<line x1="90" y1="78" x2="90" y2="90" stroke="#1f2a28" stroke-width="4.5" stroke-linecap="round"/><line x1="110" y1="78" x2="110" y2="90" stroke="#1f2a28" stroke-width="4.5" stroke-linecap="round"/>'
    +   '<path d="M93,97 Q100,101 107,97 Q106,108 100,109 Q94,108 93,97 Z" fill="#15605a"/></g>'; }

  global.BottySprites = {
    volwassen: spriteVolwassen,
    baby: spriteBaby,
    tiener: spriteTiener,
    set: { baby: spriteBaby, tiener: spriteTiener, volwassen: spriteVolwassen }
  };
})(window);
