# Voorstel — biochemie en brein volgens de echte Creatures-engine

> Status: **voorstel**, nog niet gebouwd. Basis: Ghidra-analyse van de originele
> Mac-binary van Creatures (1997, PowerPC). De bevindingen staan in de vault-notitie
> *Creatures 1 engine — first look with Ghidra*. Dit document vertaalt twee stukken
> daarvan naar `hive-tick`:
> 1. de **biochemie-tick** (emitters → receptors → reacties → halfwaardetijden);
> 2. de **SVRule-interpreter** (21 operanden, 6 operatoren) als erfelijke leerregel.
>
> De Botty's blijven toeschouwer-vriendelijk en de edge function blijft goedkoop. Elke
> stap is los te deployen en heeft een ablatie-vlag in de stijl van v13.

---

## 1. Wat Creatures precies doet (samenvatting van de analyse)

### Biochemie (`CBiochemistry`, tick = één functie)
In deze volgorde, alles in bytes (0–255, verzadigend):

1. **Emitters**, lichaam → stof. Per emitter:
   - *velden*: locus (pointer naar een lichaamswaarde), stof, drempel, versterking, **samplefrequentie** (alleen als `tick % rate == 0`) en vlaggen;
   - *vlaggen*: `1` = bron na lezen op 0 zetten, `2` = digitaal (vaste hoeveelheid), `4` = bron omkeren (255 − x);
   - *werking*: analoog geeft `stof += gain × (bron − drempel) >> 8`.
2. **Receptors**, stof → lichaam. Per receptor:
   - *velden*: stof, drempel, **nominale waarde**, versterking, vlaggen (`2` = digitaal, `1` = omgekeerd) en een locus;
   - *werking*: de locus wordt elke tick **overschreven** met `nominaal ± signaal`, waarbij signaal = `gain × max(0, stof − drempel) >> 8`.
3. **Reacties**, `a·A + b·B → c·C + d·D`:
   - `eenheden = min(A/a, B/b)`;
   - wat er reageert, volgt dezelfde vervalfunctie als de halfwaardetijden, met de reactiesnelheid als halfwaardetijd-byte;
   - een ontbrekende reactant telt als "oneindig".
4. **Halfwaardetijden**: elke stof vervalt met een byte die **logaritmisch** is ingedeeld. 32 niveaus (byte >> 3), en elke stap van 8 verdubbelt de halfwaardetijd:

| byte | halfwaardetijd (ticks) |
|---|---|
| 0–7 | direct weg |
| 8–15 | 0,4 |
| 16–23 | 0,9 |
| 24–31 | 1,7 |
| 32–39 | 3,4 |
| 40–47 | 6,8 |
| 48–55 | 13,7 |
| 56–63 | 27 |
| 64–71 | 55 |
| 72–79 | 110 |
| … | ×2 per stap |
| 248–255 | nooit |

   Implementatie: niveaus 1–7 vermenigvuldigen elke tick met een factor, vanaf niveau 8 is de factor vast (0,975) en verdubbelt het tick-interval.

### Brein-regels (SVRules)
Een regel is een reeks van maximaal 10 bytes. Er is één accumulator van 0–255, en alle rekenwerk verzadigt.

| opcode | betekenis |
|---|---|
| `0` | einde → accumulator wegschrijven |
| `1–21` | accumulator = operand *n* (tabel hieronder) |
| `22` | accumulator 0 → stoppen en wegschrijven |
| `23` PLUS | volgende byte = operand; acc = min(255, acc + x) |
| `24` MINUS | acc = max(0, acc − x) |
| `25` TIMES | acc = (acc × x) >> 8 |
| `26` INCR / `27` DECR | ±1 |

Operanden in Creatures:

| nr | operand |
|---|---|
| 1–4 | 0, 1, 64, 255 |
| 5–8 | chem0–3 (receptor-loci van de lobe) |
| 9 | state |
| 10 | output |
| 11 | drempel |
| 12–15 | type0, type1, anded0, anded1 |
| 16 | input (output van de bronneuron) |
| 17 | conduct |
| 18 | suscept |
| 19 | STW |
| 20 | LTW |
| 21 | strength |

---

## 2. Waar `hive-tick` nu staat

- `biochemie(b, bottys)` (rond regel 546): 14 stoffen met namen, schaal 0–100.
  - *emitters*: met de hand geschreven formules;
  - *halfwaardetijden*: een vast getal in ticks, deels genoom-afhankelijk (`chemHalfLives`);
  - *receptors*: een paar `if`-regels op `b.stemming`;
  - *reacties*: alleen "endorfine blust stress".
- `breinLeer(...)`: een vaste formule `geloof += lr·(beloond − geloof)`, gepoort door endorfine, plus atrofie. Er is geen erfelijke leerregel.
- Andere code schrijft rechtstreeks in `b.chem.<naam>` (aaien, zelfzorg, medicijn…). **Dat moet blijven werken.**

---

## 3. Voorstel A — data-gedreven biochemie (fase 3 van de roadmap)

### 3.1 Principes
- **Interface blijft hetzelfde:** `b.chem` blijft een object `naam → 0..100`. De UI, de kit en de bestaande injecties hoeven niet te veranderen. Intern rekenen we met dezelfde semantiek als Creatures, alleen op schaal 0–100 in plaats van 0–255.
- **Beschrijving in plaats van code:** wat er nu als losse formules staat, wordt **data**, een "standaard-biochemie" met tabellen van emitters, receptors en reacties. Daarmee kan het later uit het genoom komen (fase 5).
- **Loci verbinden het lichaam met de chemie:** een locus is een benoemde lees- of schrijfplek, zoals in Creatures. Leesbare loci zijn bijvoorbeeld `energie`, `fit`, `geluk`, `data`, `ziek`, `nabij`, `actief`, `alleen`, `drukte`, `libidoGolf` en `oud`. Schrijfbare loci zijn onder meer `stemming` en de brein-chem-ingangen (zie B).

### 3.2 Datavorm

```ts
type Emitter  = { locus: string; stof: string; drempel: number; gain: number; rate?: number; vlag?: number }; // vlag: 1 reset, 2 digitaal, 4 omkeren
type Receptor = { stof: string; locus: string; drempel: number; nominaal: number; gain: number; vlag?: number }; // vlag: 1 omgekeerd, 2 digitaal
type Reactie  = { a?: [number, string]; b?: [number, string]; c?: [number, string]; d?: [number, string]; snelheid: number }; // snelheid = hl-byte
type HlByte   = number; // 0..255, logaritmische schaal (zie tabel)
```

Loci zijn kleine getters en setters, één keer per tick opgebouwd:

```ts
function lociVan(b: any, ctx: { nabij: number; actief: boolean; veroud: number }) {
  const lees: Record<string, () => number> = {
    tekortEnergie: () => 100 - (b.energie ?? 50),
    tekortFit:     () => 100 - (b.fit ?? 50),
    tekortGeluk:   () => 100 - (b.geluk ?? 50),
    tekortData:    () => 100 - (b.data ?? 50),
    ziek:          () => b.ziek ? 100 : 0,
    alleen:        () => ctx.nabij === 0 ? 100 : 0,
    gezelschap:    () => Math.min(ctx.nabij, 3) * 33,
    drukte:        () => ctx.nabij >= 4 ? 100 : 0,
    actief:        () => ctx.actief ? 100 : 0,
    oud:           () => Math.max(0, ctx.veroud) * 100,
    // …
  };
  const schrijf: Record<string, (v: number) => void> = {
    stemmingDuw: v => { b.stemming = klem((b.stemming ?? 50) + v / 20); }, // receptor duwt, i.p.v. overschrijft
    breinChem0:  v => { (b.breinIn ||= [0, 0, 0, 0])[0] = v; },          // zie voorstel B
    // …
  };
  return { lees, schrijf };
}
```

> **Afwijking van Creatures, bewust:** in Creatures *overschrijft* een receptor zijn locus
> (nominaal ± signaal). De Botty-stemming is een opgebouwde waarde, dus de stemming-
> receptors krijgen een *duw*-locus. Voor de brein-ingangen houden we het
> Creatures-gedrag aan (overschrijven).

### 3.3 De tick (één functie, dezelfde volgorde als Creatures)

```ts
// Logaritmische halfwaardetijd-tabel, letterlijk uit Creatures (32 niveaus).
const HL_FACTOR = [0, 12965, 29149, 43707, 53520, 59224, 62300, ...Array(24).fill(63897), 65535].map(f => f / 65536);
const HL_MASKER = [...Array(8).fill(0), ...Array.from({ length: 24 }, (_, i) => (1 << (i + 1)) - 1)];
function verval(v: number, hl: HlByte, tick: number): number {
  const n = hl >> 3, m = HL_MASKER[n];
  return (tick & m) === m ? v * HL_FACTOR[n] : v;
}

function biochemieTick(b: any, chem: Record<string, number>, bio: Biochemie, loci: Loci, tick: number) {
  for (const e of bio.emitters) {                       // 1. lichaam → stof
    if (e.rate && tick % e.rate) continue;
    let bron = loci.lees[e.locus]?.() ?? 0;
    if (e.vlag! & 4) bron = 100 - bron;
    const boven = bron - e.drempel; if (boven <= 0) continue;
    chem[e.stof] = Math.min(100, chem[e.stof] + ((e.vlag! & 2) ? e.gain : e.gain * boven / 100));
  }
  for (const r of bio.receptors) {                      // 2. stof → lichaam
    const boven = Math.max(0, chem[r.stof] - r.drempel);
    const sig = boven === 0 ? 0 : ((r.vlag! & 2) ? r.gain : r.gain * boven / 100);
    loci.schrijf[r.locus]?.((r.vlag! & 1) ? r.nominaal - sig : r.nominaal + sig);
  }
  for (const x of bio.reacties) {                       // 3. reacties
    const eenh = Math.min(x.a ? chem[x.a[1]] / x.a[0] : Infinity, x.b ? chem[x.b[1]] / x.b[0] : Infinity);
    if (!isFinite(eenh) || eenh <= 0) continue;
    const r = eenh - verval(eenh, x.snelheid, tick);    // wat er deze tick reageert
    if (x.a) chem[x.a[1]] = Math.max(0, chem[x.a[1]] - x.a[0] * r);
    if (x.b) chem[x.b[1]] = Math.max(0, chem[x.b[1]] - x.b[0] * r);
    if (x.c) chem[x.c[1]] = Math.min(100, chem[x.c[1]] + x.c[0] * r);
    if (x.d) chem[x.d[1]] = Math.min(100, chem[x.d[1]] + x.d[0] * r);
  }
  for (const k in bio.halfwaarde) chem[k] = verval(chem[k], bio.halfwaarde[k], tick); // 4. verval
}
```

**Let op de tick-teller:** het masker werkt alleen met een oplopende teller. Een globale teller in de state (`state.tick`) is nodig, die ook in de catch-up-lus doorloopt. Dat is één extra veld en geen migratie.

### 3.4 Standaard-biochemie: huidig gedrag als data
Een eerste vertaling van de bestaande formules. Exact hoeft niet, het *karakter* moet blijven:

| Huidige code | Wordt |
|---|---|
| `honger += (100−energie)·0,045` | emitter `tekortEnergie → honger`, gain 4,5 |
| `vermoeidheid += (100−fit)·0,03 + actief·1,4 + oud·0,8` | 3 emitters (`tekortFit`, `actief` digitaal 1,4, `oud` 0,8) |
| `stress += (100−geluk)·0,02 + ziek·4 + alleen·0,8` | 3 emitters |
| `eenzaamheid += alleen ? 1,3 : −2,2` | emitter `alleen` (digitaal 1,3) + reactie `oxytocine + eenzaamheid → oxytocine` |
| `stress −= endorfine·0,06` | reactie `1 endorfine + 1 stress → 1 endorfine`, snelheid ~byte 40 (katalysator) |
| `glycogeen` volgt glucose traag | reacties `glucose → glycogeen` (traag) en `glycogeen → glucose` (bij laag glucose) |
| `chemHalfLives` in ticks | halfwaarde-bytes: het dichtstbijzijnde niveau (bv. 10 ticks ≈ byte 44, 90 ticks ≈ byte 76) |
| genoom-afhankelijke halfwaardetijden | het hl-byte schuift met het gen: `byte + 8·log2(multiplier)` |
| receptors op `stemming` | receptors met `stemmingDuw`-locus en dezelfde drempels (endorfine > 30, stress > 40, …) |

Wat niet goed in emitter-vorm past, blijft voorlopig code buiten de tabel: de libido-sinus, de kansgebaseerde gif-infectie en de adrenaline-dempt-moeheid-regel. Die kunnen later een eigen locus of reactie krijgen.

### 3.5 Ablatie en uitrol
- `BIOCHEMIE_TABEL = false` geeft het oude `biochemie()`. Zo zijn ze naast elkaar te vergelijken.
- Uitrol: eerst alleen **halfwaardetijden** op de logaritmische schaal, dan emitters en receptors, dan reacties.
- Kosten: ongeveer 30 emitters + 10 receptors + 5 reacties × 9 Botty's per tick. Dat is verwaarloosbaar, minder dan de huidige afstandsberekening.

---

## 4. Voorstel B — SVRules als erfelijke leerregel (fase 4)

### 4.1 Idee
Het Botty-brein is een **geloof per drift × object**. Dat zetten we niet om naar neuronen. Wel maken we de *leerregel* een **SVRule**, een korte, erfelijke bytecode zoals in Creatures, in plaats van de vaste formule in `breinLeer`. Zo kan evolutie de **manier van leren** vormen: snel, voorzichtig, of gevoelig voor stress. Dat raakt meteen het doel "slimmer worden", omdat leervermogen erfelijk en divers wordt.

Mapping op het Creatures-model, met **één dendriet per drift × object**:

| Creatures | Botty |
|---|---|
| `LTW` (lange-termijngewicht) | `b.brein[drift][obj]` (het huidige geloof) |
| `STW` (korte-termijngewicht) | nieuw: `b.breinSTW[drift][obj]`, de verse indruk, vervalt snel |
| `input` | de beloning van deze ervaring (homeostatisch, 0..255) |
| `suscept` | nieuw: hoe ontvankelijk dit verband nu is (stijgt na een ervaring, ebt weg) |
| `chem0–3` | brein-chem-ingangen uit receptors (voorstel A): endorfine, stress, verveling, nieuwsgierigheid |
| `state` | de urgentie van de drift (100 − bar) |

### 4.2 De interpreter (20 regels, letterlijk Creatures-semantiek)

```ts
// SVRule: max 10 bytes. Operandtabel o[1..21] wordt per evaluatie gevuld.
function svr(regel: number[], o: number[]): number {
  let acc = 0;
  for (let i = 0; i < regel.length; ) {
    const op = regel[i++];
    if (op === 0) break;
    if (op <= 21) { acc = o[op]; continue; }
    switch (op) {
      case 22: if (acc === 0) return 0; break;
      case 23: acc = Math.min(255, acc + o[regel[i++]]); break;
      case 24: acc = Math.max(0,   acc - o[regel[i++]]); break;
      case 25: acc = (acc * o[regel[i++]]) >> 8;         break;
      case 26: acc = Math.min(255, acc + 1);             break;
      case 27: acc = Math.max(0,   acc - 1);             break;
    } // ≥ 28: genegeerd, net als in Creatures
  }
  return acc;
}
// Operanden-indeling (Botty-variant, posities zoals Creatures):
// 1:0 2:1 3:64 4:255 5–8:chem0–3 9:urgentie 10:— 11:drempel 16:beloning 18:suscept 19:STW 20:LTW 21:sterkte
```

### 4.3 Standaard-regels die het huidige gedrag nabootsen
De huidige update is `geloof += 0,28 · poort · (beloond − geloof)`, met een poort van 0,6–1,5× door endorfine.

| Regel | Bytes | Leest als |
|---|---|---|
| **STW-regel** (verse indruk) | `[16, 25, 5, 0]` | beloning × endorfine (chem0) |
| **suscept-regel** | `[18, 27, 27, 0]` | suscept − 2: ontvankelijkheid ebt weg |
| **LTW-regel** (consolidatie) | `[19, 25, 18, 23, 20, 0]` | STW × suscept + LTW, plus een aparte "naar beneden"-regel bij geen beloning |

De exacte bytes stemmen we af met een **equivalentietest**: 1000 gesimuleerde ervaringen, waarbij de oude en de nieuwe update binnen een paar procent van elkaar moeten blijven. `SVRULE_BREIN = false` geeft de oude formule.

### 4.4 Erfelijkheid
- **Plek in het genoom:** de regels (3 × 10 bytes) passen niet in het 16-byte genoom. Ze komen in de bestaande **extra genen** (variabel-lang genoom, gen-headers) als nieuw gentype `svr`. Ontbreekt dat gen, dan gelden de standaard-regels (backward compatible).
- **Mutatie:** per byte, met kleine kans:
  - een opcode vervangen door een buur (PLUS ↔ MINUS, operand ±1);
  - een byte invoegen of verwijderen.
  Een kapotte regel geeft hooguit 0 of 255, nooit een crash. Dat is de Creatures-robuustheid: de interpreter accepteert *elke* bytestring.
- **Kruisen:** per regel van ouder A of ouder B (linkage per regel).

### 4.5 Zichtbaar maken (Construct)
- **Neuronennet:** de dendriet-dikte blijft LTW. STW krijgt een tweede, dunne gloeilijn: de "verse indruk".
- **Verzorgerskit:** een nieuw regel-paneel toont de 3 regels als leesbare tokens, bijvoorbeeld `beloning TIMES endorfine`. Per Botty verschillend: "deze Botty leert snel van aaien, die van stress".

---

## 5. Volgorde en risico's

| Stap | Inhoud | Risico | Terug te draaien |
|---|---|---|---|
| A1 | logaritmische halfwaardetijden + `state.tick` | laag | vlag |
| A2 | emitters en receptors als tabel (standaard-biochemie) | middel (balans) | vlag |
| A3 | reacties (endorfine-katalyse, glucose ↔ glycogeen, oxytocine) | laag | vlag |
| B1 | SVRule-interpreter + standaard-regels + equivalentietest | laag | vlag |
| B2 | `svr`-gentype: erfelijke en muterende regels | middel (evolutie kan rare leerders maken; dat is juist het punt) | vlag + gen negeren |
| B3 | regel-paneel in de kit | geen | — |

**Balans:** na A2 moet de populatie binnen een paar uur hetzelfde gedrag tonen als nu: stemming, eenzaamheid, honger. Dat meten we met de bestaande evolutie- en populatiepagina's vóór en na.

**Niet in dit voorstel:** echte lobes en neuronen, en het genoom-gedreven vullen van de biochemie-tabellen (C4/C5). Die bouwen op A en B voort.
