# Implementatieplan — zonneladen, slaapvoorkeur & object-aanvulling

Concreet plan voor als er weer tokens zijn. Volgorde is bewust: elk blok bouwt
logisch voort op het vorige. Alles blijft toeschouwer-vriendelijk (observeren, niet
micromanagen). Details tunen we tijdens de bouw.

Kern-touchpoints (nu geverifieerd):
- **`supabase/functions/hive-tick/index.ts`** — server-simulatie. Relevant:
  `kiesDoelen` (regel ~801), `zorg`/`vervalEen` (~825/~860), `slaapt(b)` (~889),
  `NACHT`/`slaap(b)` (dag-nachtcyclus, ~864/~876), de doel-toewijzing met
  `soort`/`niveau`/`px`/`py`, en de zelfzorg-nabijheidscheck (`zelfzorgRonde`).
- **`construct.html`** — weergave. Relevant: objectenlijst met vloeren
  `tuin=405 (niveau 0)` / `kamer=662 (niveau 1)` (regel ~360), `RUST`-rustplek,
  `zeg(...)`/`.bubbel` en de emoji/hartjes-overlay boven de kop, `zetInner`.
- **`agents.json`** — centrale objectcatalogus (server + client lezen dit).
- **`index.html`** — kaarten (optioneel: zon-status tonen).

Belangrijk: alle drie de features raken **alleen client + edge function**, geen DB-
migratie. Edge function deployt via CI (push naar `main` die `supabase/functions/**`
raakt). Denk aan de egress-afspraken: geen extra realtime-verkeer introduceren; de
nieuwe velden (`b.zonladen`, drive-effecten) reizen mee in het bestaande slanke
broadcast-snapshot — controleer dat ze **niet** bij de zware velden zitten die
`slankeBottys`/`hive_slim()` strippen (dat zijn ze niet, dus ze gaan automatisch mee).

---

## Blok 1 — Zon als object + draadloos zonneladen  ⏱️ eerst

**Doel:** een Botty die stilstaat in de openlucht (bovengronds, overdag) laadt
langzaam `energie` op; boven de kop verschijnt ☀️.

1. **`agents.json`** — nieuw agent `zon`:
   - `id:"zon"`, `klasse:"hemellichaam"`, `icoon:"☀️"`, `stat:"energie"`,
     teksten (`kort:"de zon"`, `doe:"zonnebaden in de openlucht"`,
     `actie:"laadt zich draadloos op in de zon"`, `leer:"de zon me gratis energie geeft"`).
   - Markeer 'm als niet-vloerobject: voeg veld `hemel:true` (of `nabijheid:false`)
     toe zodat de gewone nabijheidscheck 'm overslaat — de zon werkt globaal, niet
     via aanlopen. `wereld` = plek aan de hemel (bovenin tuin-zone) voor de render.
2. **`hive-tick/index.ts`** — zonlaad-regel (in de per-Botty tick, naast `vervalEen`):
   - Voorwaarde: **overdag** (`!NACHT`), Botty **bovengronds** (niveau 0 / tuin),
     en **stilstaand** = idle (geen bewegingsdoel: `doel` leeg of `soort` in
     {`bijkomen`,`herstellen`,`slapen`} en pos ≈ vorige pos).
   - Effect: `b.energie = klem(b.energie + ZON_LAAD)` (klein, bv. +1..2/tick),
     en zet vlag `b.zonladen = true`. Anders `b.zonladen = false`.
   - Constante `ZON_LAAD` bovenaan bij de andere tuning-constanten.
   - `b.zonladen` reist mee in het broadcast-snapshot (niet-zwaar veld → automatisch).
3. **`construct.html`** — render:
   - Teken de zon in de lucht boven de tuin (statische ☀️ of SVG-zon met zachte
     glow-`ambient`). 's Nachts dimmen (er is al een `updateNacht`).
   - Toon ☀️ boven de kop van elke Botty met `b.zonladen` (hergebruik de bestaande
     emoji-boven-kop/bubbel-overlay; klein, subtiel, evt. lichte puls).
4. **Optioneel `index.html`** — ☀️-badge op de kaart bij `b.zonladen`.

**Tuning tijdens bouw:** laadsnelheid, of de zon ook 's ochtends/'s avonds zwakker
is, en of stilstaan een minimale duur vraagt voordat ☀️ verschijnt.

---

## Blok 2 — Slaapvoorkeur: ondergronds slapen, bovengronds wakker  ⏱️ daarna

**Doel:** verticaal ritme — slapend/rustend naar de lage, beschutte laag; wakker/
actief naar boven (naar de zon).

1. **`hive-tick/index.ts`** — bij de doel-toewijzing (waar `soort`+`niveau` gezet
   worden, en in de `thuis`/woonlaag-keuze):
   - Slaap/herstel/bijkomen-doelen → **lage laag** (kamer/niveau 1, de beschutte
     "ondergrondse" ruimte). 's Nachts (`NACHT`) trekt iedereen die slaapt hierheen.
   - Wakkere/actieve doelen overdag → voorkeur **bovengrondse laag** (tuin/niveau 0),
     zodat ze in de zon komen (sluit aan op Blok 1).
   - Vervang/verzwak de huidige `dapper`-gebaseerde vaste woonlaag met deze
     slaap/waak- + dag/nacht-gedreven keuze (dapper mag nog als lichte bias blijven).
2. **`construct.html`** — controleer dat `RUST`/rustplek op de lage laag ligt en dat
   de trap-logica (niveauwissel) het nieuwe ritme soepel toont. Evt. de lage laag
   visueel iets "ondergronds/beschut" maken (donkerder, hol-sfeer) — optioneel.

**Tuning:** hoe sterk de voorkeur is (mogen er uitzonderingen zijn?), en of
"ondergronds" een aparte nieuwe laag wordt of gewoon de bestaande kamer-laag.

---

## Blok 3 — Opladen / eten / tanken zichtbaar maken  ⏱️ laatst (polish)

**Doel:** de drie energiebronnen voelen verschillend, ook al vullen ze dezelfde
`energie`-drive.

1. **`hive-tick/index.ts`** — in de zelfzorg-/aanvul-events al de bron meegeven
   (welk object) zodat de client het juiste icoon kan kiezen. (Events bestaan al;
   voeg desnoods `bron`/`obj` toe aan het event.)
2. **`construct.html`** — emoji boven de kop tijdens het aanvullen, per bron:
   - ⚡ **opladen** bij de laadcomputer (`laadkruk`)
   - 🔋 **tanken** bij het `kastje`
   - 🍽️ **eten** bij de `bloempot`
   - ☀️ **zonneladen** (al gedekt door Blok 1)
   Hergebruik dezelfde overlay als de ☀️ uit Blok 1.

**Tuning:** duur/animatie van de emoji, en of we ook een klein micro-effect
(hapgeluid-achtige beweging) willen.

---

## Suggestie van aanpak per sessie

- **Sessie A:** Blok 1 volledig (agents.json + zonlaad-regel + render + ☀️). Testbaar
  end-to-end, direct zichtbaar resultaat.
- **Sessie B:** Blok 2 (slaap/waak-ritme) — bouwt op de bovengrondse zon van Blok 1.
- **Sessie C:** Blok 3 (bron-emoji's) — pure polish.

Elke sessie: bouwen → lokaal/headless verifiëren → PR → direct mergen (staande
afspraak). Edge function alleen via CI deployen.
