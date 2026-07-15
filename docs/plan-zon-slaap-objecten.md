# Build-spec — zonneladen, slaapvoorkeur & bron-emoji's (één-shot bouwbaar)

Deze spec is bewust volledig en concreet zodat één agent-pass (Fable) alle drie de
features in één keer kan bouwen. Anchors verwijzen naar bestaande code-strings.
Toeschouwer-principe blijft: observeren, niet micromanagen.

## Architectuur die je moet kennen (geverifieerd)

- **Doel is server-authoritatief.** `hive-tick/index.ts` → `kiesDoel(b, ctx)` zet
  `b.doel = { soort, … }` met `soort ∈ {herstellen, slapen, zelfzorg, voortplanting,
  gezelschap, nieuwsgierig, dwalen, priemjacht}`. De client rendert dat.
- **Niveaus zijn client-side.** `construct.html`: vloeren `tuin = niveau 0` (boven),
  `kamer = niveau 1` (onder/beschut). `nieuwDoel(nd, b)` (rond regel 634) vertaalt
  `b.doel.soort` → `niv`/`x`. `RUST = { x:1250, niveau:1 }`. `thuis(b)` kiest woonlaag.
- **Objecten** komen uit `agents.json`. Server-loader filtert op `a.stat && a.sim`
  (regel ~70); client-`bouwObjecten` filtert op `a.wereld && a.sprite` (regel ~402).
  Een agent zónder `sim`/`wereld`/`sprite` wordt door béíde overgeslagen → veilig als
  puur catalogus/legenda-item.
- **`energie/data/fit/geluk`** zijn de vier drives (`DRIVE_STATS`). `klem(x)` clampt 0..100.
- **`NACHT`** (server) / `nacht` (client) = dag/nachtstand, al aanwezig.
- **Egress:** nieuwe velden op `b` (zoals `b.zonladen`) reizen automatisch mee in het
  slanke broadcast-snapshot omdat ze NIET in `ZWARE_VELDEN` staan. Voeg ze daar NIET
  aan toe. Geen DB-migratie nodig. Edge function deployt via CI (push naar `main`
  die `supabase/functions/**` raakt).

---

## Blok 1 — Zon + draadloos zonneladen

**Semantiek:** een wakkere Botty die overdag "dwaalt" staat bovengronds in de zon en
laadt langzaam `energie` op; boven zijn kop verschijnt ☀️. (`dwalen` = het rustige,
niet-behoeftige "rondhangen"-doel; Blok 2 zet dwalen overdag bovengronds neer.)

### 1a. `agents.json` — voeg zon toe (catalogus/legenda; door beide loaders overgeslagen)
Voeg als laatste item in `agents` toe (géén `sim`/`wereld`/`sprite`):
```json
{ "id": "zon", "klasse": "hemellichaam", "hemel": true, "icoon": "☀️", "stat": "energie",
  "kort": "de zon", "doe": "zonnebaden in de openlucht",
  "actie": "laadt zich draadloos op in de zon", "leer": "de zon me gratis energie geeft" }
```

### 1b. `supabase/functions/hive-tick/index.ts` — zonlaad-regel
1. Constante bij de andere tuning-consts (na `const GEBRUIK_AFSTAND = 80;`):
```ts
const ZON_LAAD = 1.4;   // energie/tick voor een Botty die overdag buiten "zonnebadet"
```
2. In het per-request forEach-blok dat elke tick draait — anchor:
   `updateStemming(b, bezoekers);` … `updateGroei(b);` (rond regel 1503). Voeg ná
   `updateGroei(b);` binnen dezelfde forEach toe:
```ts
      // ☀️ Draadloos zonneladen: overdag laadt een rustig-dwalende (bovengrondse)
      // Botty langzaam energie op. Vlag reist mee in het broadcast-snapshot.
      b.zonladen = !NACHT && !!b.doel && b.doel.soort === "dwalen" && !slaapt(b);
      if (b.zonladen && gemist >= 1) b.energie = klem(b.energie + ZON_LAAD * gemist);
```
   (Staat `gemist` niet in scope van dit blok? Gebruik dan `+ ZON_LAAD` zonder schaal.)

### 1c. `construct.html` — zon aan de hemel + ☀️ boven de kop
1. **Zon aan de hemel.** Zoek de achtergrond/lucht-SVG-laag (waar `rays`/`nachtlaag`
   staan). Voeg een vaste zon toe in de tuin-lucht, bv.:
```html
<g id="zonlucht" transform="translate(1300,95)" opacity="1">
  <circle r="46" fill="url(#zonGloed)"/>
  <circle r="26" fill="#ffe08a" stroke="#ffb23e" stroke-width="3"/>
</g>
```
   met in `<defs>`:
```html
<radialGradient id="zonGloed"><stop offset="0%" stop-color="#fff3b0" stop-opacity=".9"/>
  <stop offset="100%" stop-color="#fff3b0" stop-opacity="0"/></radialGradient>
```
   In `updateNacht()` (regel ~350) dim je 'm 's nachts:
```js
    var zl = document.getElementById("zonlucht"); if(zl) zl.setAttribute("opacity", nacht ? "0.12" : "1");
```
2. **☀️ boven de kop.** Geef elke node een persistente overlay-`<text>` naast waar
   `nd.ring` wordt aangemaakt (zoek `nd.ring`), bv. `nd.kopEmoji`:
```js
    nd.kopEmoji = document.createElementNS(SVGNS,"text");
    nd.kopEmoji.setAttribute("text-anchor","middle");
    nd.kopEmoji.setAttribute("style","font:18px sans-serif");
    nd.kopEmoji.setAttribute("opacity","0");
    fxlaag.appendChild(nd.kopEmoji);   // of dezelfde laag als nd.ring
```
   In de per-Botty renderstap (frame-loop, waar `nd.ring.setAttribute(...)` gebeurt,
   regel ~811-823) zet je de emoji + positie (boven het hoofd, `r.x`, hoogte ~ `nd`):
```js
    // Prioriteit: zonladen (☀️) > bezig aan energie-object (Blok 3) > niets
    var kop = b.zonladen ? "☀️" : bronEmoji(b);   // bronEmoji: zie Blok 3
    if(kop){ nd.kopEmoji.textContent = kop;
      nd.kopEmoji.setAttribute("x", r.x);
      nd.kopEmoji.setAttribute("y", vloerVan(nd.niveau) - SPRITE_HOOGTE); // net boven de kop
      nd.kopEmoji.setAttribute("opacity","0.95");
    } else nd.kopEmoji.setAttribute("opacity","0");
```
   (`SPRITE_HOOGTE`: gebruik de bestaande sprite-hoogte/`schaalBasis`-afgeleide; kies
   een waarde die net boven de kop uitkomt, bv. ~120 — tunen tijdens bouw.)

---

## Blok 2 — Slaapvoorkeur: ondergronds slapen, bovengronds wakker

Slapen/rusten gaat al naar `RUST` (niveau 1, de lage/beschutte kamer). Alleen het
wakkere "dwalen" moet overdag naar bóven (tuin, in de zon). Alle edits in
`construct.html`.

1. **`thuis(b)`** (regel ~615) — woonlaag dag/nacht-gedreven i.p.v. puur `dapper`:
```js
  function thuis(b){
    var d = (b.temperament && typeof b.temperament.dapper==="number") ? b.temperament.dapper : 0.5;
    // Overdag liever bovengronds (tuin=0, zon); 's nachts/slaperig liever onder (kamer=1).
    // Dapperheid blijft een lichte bias.
    var nv;
    if(nacht) nv = 1;
    else nv = nameRnd(b.naam+"niv") < (0.35 + 0.5*d) ? 0 : 1;
    var lv = NIVEAUS[nv];
    return { niveau:nv, x: lv.xlo + 55 + nameRnd(b.naam+"thuis")*(lv.xhi - lv.xlo - 110) };
  }
```
2. **`nieuwDoel`** (regel ~634) — dwalen overdag expliciet bovengronds:
   In de `else if(soort==="dwalen"…)`/`else`-tak (nu via `thuis(b)`), forceer overdag
   niveau 0 zodat ze in de openlucht zonnebaden:
```js
    } else {   // dwalen / default
      if(!nacht){ niv = 0; var lt = NIVEAUS[0]; x = lt.xlo + 55 + nameRnd(b.naam+"zon")*(lt.xhi - lt.xlo - 110); }
      else { var td = thuis(b); niv = td.niveau; x = td.x + (Math.random()-0.5)*240; }
    }
```
   Laat `bijkomen`/`herstellen`/`slapen` ongewijzigd → blijven `RUST` (niveau 1).
   (Optioneel/later: de kamer visueel "ondergronds/hol" maken — niet nodig voor de werking.)

---

## Blok 3 — Opladen / eten / tanken zichtbaar (bron-emoji boven de kop)

Puur `construct.html`. De client weet al wélk object een Botty gebruikt via
`b.doel.obj` en detecteert "bezig" bij het object (anchor rond regel 811:
`var bezig = b.doel && b.doel.soort === "zelfzorg" && … Math.abs(r.x - nd.doelX) < 60`).

Voeg een helper toe (bij de andere helpers):
```js
  var BRON_EMOJI = { laadkruk:"⚡", kastje:"🔋", bloempot:"🍽️" };  // energie-bronnen
  function bronEmoji(b){
    if(!b.doel || b.doel.soort!=="zelfzorg") return "";
    var nd = nodes[b.naam]; if(!nd) return "";
    var bezig = !nd.klim && nd.niveau===nd.doelNiveau && Math.abs(nd.render.x - nd.doelX) < 60;
    if(!bezig) return "";
    return BRON_EMOJI[b.doel.obj] || b.doel.icoon || "";   // val terug op object-icoon
  }
```
`bronEmoji(b)` wordt al aangeroepen in de kop-emoji-render van Blok 1b (zonladen heeft
voorrang). Zo toont een Botty ⚡ bij de laadcomputer, 🔋 bij het kastje, 🍽️ bij de
bloempot, en het object-icoon bij data/fit/geluk-objecten.

---

## Verificatie (headless, na de bouw)

- **Edge function**: `deno check supabase/functions/hive-tick/index.ts` (of push → CI-deploy),
  daarna een tick POSTen en controleren dat een dwalende Botty overdag `zonladen:true`
  krijgt en `energie` stijgt; 's nachts `zonladen:false`.
  Realtime-check (zie eerdere sessies): subscribe op kanaal `hive-live`, tick, en
  controleer dat het slanke snapshot `zonladen` bevat.
- **Construct** (Chromium `/opt/pw-browsers/chromium`, Supabase stubben via
  `addInitScript` — CDN is geblokkeerd in de sandbox): laad `construct.html`, injecteer
  een dwalende Botty overdag → ☀️ boven de kop + zon aan de hemel; injecteer een
  zelfzorg-Botty bij `laadkruk` → ⚡ boven de kop; zet `nacht` → zon dimt, dwalers
  zakken naar niveau 1.

## Volgorde & afronding
Bouw 1 → 2 → 3 in één PR (ze grijpen op elkaar in: Blok 2 zet dwalers bovengronds waar
Blok 1 ze laat zonnebaden; Blok 3 hergebruikt de kop-emoji van Blok 1). Daarna:
headless verifiëren → PR → direct mergen (staande afspraak). Edge function alleen via CI.
