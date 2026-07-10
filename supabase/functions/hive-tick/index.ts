// hive-tick — genoom-evolutie: gedrag + kleur + grootte evolueren mee
// ---------------------------------------------------------------------------
// CANONIEKE BRON van de edge function. Dit bestand = de gedeployde versie.
// Deploy:  supabase functions deploy hive-tick
// (of via de Supabase MCP deploy-tool met exact deze inhoud)
// Houd de gen-layout gelijk aan assets/genome.js (clientside weergave).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INTERVAL          = 1000;
const VERVAL_INTERVAL   = 2000;
const ZORG_PER_TICK     = 2;
const MAX_CATCHUP_TICKS = 5000;
// Inteelt: ouders met een kleinere genetische afstand dan dit krijgen een
// zwakker, vaker ziek kind (inteelt-depressie). Schaal: Manhattan over 16 genen.
const INTEELT_DREMPEL      = 170;
const INTEELT_MAX_STRAF    = 20;   // max punten van datakwaliteit/efficiëntie
// Diversiteits-alarm: zakt de gemiddelde paarsgewijze afstand hieronder, dan
// injecteert de hive een verse mutant i.p.v. nóg een inteelt-kind.
const DIVERSITEIT_DREMPEL  = 130;
// Slimme partnerkeuze: weeg genetische afstand mee in de keuze, zodat de hive
// fitte én niet-verwante ouders koppelt (en inteelt-depressie ontwijkt).
const PARTNER_DIVERSITEIT_GEWICHT = 0.12;
// IQ telt ook mee in de partnerkeuze: slimme Bottys zijn aantrekkelijker.
const PARTNER_IQ_GEWICHT = 0.2;
// Agency: een ouder die zélf een kind wil, telt zwaarder mee in de partnerkeuze.
const PARTNER_WIL_GEWICHT = 30;
// Fertiliteit: gestreste Bottys zijn minder vruchtbaar → minder aantrekkelijk als ouder.
const PARTNER_STRESS_GEWICHT = 0.35;
// §3.4: de AI koppelt bij voorkeur ♂×♀. Een bonus (geen harde eis) zodat een
// kleine of eenzijdige populatie niet vastloopt.
const PARTNER_SEKSE_GEWICHT = 45;
// De Construct: een 2D-arena waarin de Botty's rondlopen (top-down, units).
const WERELD_B = 1000;          // breedte
const WERELD_H = 600;           // hoogte
const WERELD_STAP = 55;         // max verplaatsing per actieve tick
const WERELD_NABIJ = 90;        // afstand waarop Botty's elkaars gezelschap voelen
const RUSTPLEK = { x: 500, y: 430 }; // rustige hoek bij de vloer (voor zieke Botty's)
// Affordance-objecten (Creatures-stijl): elk object in het lokaal verhelpt één
// drive. Een Botty met een tekort zweeft er zelf naartoe en reguleert zichzelf —
// de AI-zorgronde blijft alleen als vangnet. Coördinaten matchen construct.html.
const OBJECTEN = [
  { id: "laadkruk", stat: "energie", kort: "de laadkruk",   x: 250, y: 450, icoon: "⚡", doe: "opladen bij de laadkruk",     actie: "laadt zichzelf op bij de omgevallen kruk", leer: "de omgevallen kruk me kan opladen" },
  { id: "bord",     stat: "data",    kort: "het schoolbord", x: 510, y: 240, icoon: "💾", doe: "leren van het schoolbord",    actie: "leert van de sommen op het bord",          leer: "de sommen op het bord me slimmer maken" },
  { id: "bal",      stat: "fit",     kort: "de bal",         x: 700, y: 470, icoon: "🏃", doe: "spelen met de bal",           actie: "speelt met de bal",                        leer: "spelen met de bal me fit houdt" },
  { id: "deur",     stat: "geluk",   kort: "de open deur",   x: 920, y: 400, icoon: "🌲", doe: "het bos ruiken bij de deur",  actie: "snuift de bosgeur bij de open deur",       leer: "de bosgeur bij de deur me blij maakt" },
];
const DRIVE_STATS: string[] = ["energie", "data", "fit", "geluk"];
const DRIVE_LABEL: Record<string, string> = { energie: "een leeg gevoel", data: "leerhonger", fit: "een slap lijf", geluk: "somberheid" };
const ZELFZORG_START = 55;   // laagste bar hieronder → zelf naar een object
const ZELFZORG_KLAAR = 80;   // bar hierboven → klaar, weer wat anders gaan doen
const GEBRUIK_AFSTAND = 80;  // dicht genoeg bij het object om het te gebruiken

// ── Lerend brein (Creatures-stijl reward/punishment) ────────────────────────────
// Wélk object een drive oplost staat NIET vast: elke Botty leert het zelf. Per
// drive houdt hij een geloof (0..1) bij per object. Een object dat de drive-bar
// echt liet stijgen wordt beloond (geloof↑), iets dat niets deed bestraft
// (geloof↓). Zo ontstaan individuele gewoontes, "bijgeloof" en fouten — en dat
// zonder gebruiker: de omgeving zelf is de leraar. Groentjes exploreren veel,
// experts exploiteren hun sterkste geloof (maar blijven een beetje nieuwsgierig).
const BREIN_LEER     = 0.28;  // leersnelheid: hoe hard één ervaring het geloof bijstelt
const BREIN_NEUTRAAL = 0.5;   // startgeloof voor een nog onbeproefd object
const BREIN_EPS_MAX  = 0.4;   // exploratiekans van een groentje
const BREIN_EPS_MIN  = 0.06;  // exploratiekans van een expert
const BREIN_OPGEVEN  = 3;     // mislukte pogingen bij één object → iets anders proberen
const BREIN_ATROFIE  = 0.012; // ongebruikte overtuigingen zakken langzaam terug naar neutraal

function breinGeloof(b: any, drive: string, objId: string): number {
  return b.brein?.[drive]?.[objId] ?? BREIN_NEUTRAAL;
}
// Leren = drive-reductie, CHEMISCH GEPOORT (Creatures): de beloningsstof endorfine
// zet de plasticiteit open. Een bezoeker die aait geeft endorfine → versterkt precies
// datgene wat de Botty op dat moment leert. Naast versterking: atrofie van de rest.
function breinLeer(b: any, drive: string, objId: string, beloond: boolean) {
  b.brein = b.brein || {};
  b.brein[drive] = b.brein[drive] || {};
  const endorfine = b.chem?.endorfine ?? 0;
  const poort = 0.6 + Math.min(1, endorfine / 60) * 0.9;   // plasticiteits-poort 0.6..1.5×
  const lr = BREIN_LEER * poort * (b.leerBonus ?? 1);       // erfelijke leer-versnelling (toekomst-lijn)
  const oud = b.brein[drive][objId] ?? BREIN_NEUTRAAL;
  b.brein[drive][objId] = +Math.max(0, Math.min(1, oud + lr * ((beloond ? 1 : 0) - oud))).toFixed(3);
  // Atrofie: de andere overtuigingen voor deze drive driften langzaam naar neutraal.
  for (const id of Object.keys(b.brein[drive])) {
    if (id === objId) continue;
    const w = b.brein[drive][id];
    b.brein[drive][id] = +(w + (BREIN_NEUTRAAL - w) * BREIN_ATROFIE).toFixed(3);
  }
  b.breinN = b.breinN || {};
  b.breinN[drive] = (b.breinN[drive] || 0) + 1;
}
function kiesObjectVoor(b: any, drive: string) {
  const n = b.breinN?.[drive] ?? 0;
  const eps = Math.max(BREIN_EPS_MIN, BREIN_EPS_MAX - n * 0.03);
  if (Math.random() < eps) return OBJECTEN[Math.floor(Math.random() * OBJECTEN.length)]; // exploratie
  let best = OBJECTEN[0], bestW = -Infinity;                                             // exploitatie
  for (const o of OBJECTEN) {
    const w = breinGeloof(b, drive, o.id) + Math.random() * 0.03; // kleine ruis tegen vastlopen
    if (w > bestW) { bestW = w; best = o; }
  }
  return best;
}
// Erfelijke gewoontes (stap 2): een kind erft het gemengde geloof van beide
// ouders — culturele overdracht bovenop de genetische. Zo begint een kind van
// efficiënte foragers met een voorsprong, maar mutatie + halvering houden ruimte
// voor eigen ontdekkingen (en voor het afleren van ouderlijk "bijgeloof").
const BREIN_ERF_MUTATIE = 0.12;  // kans dat een geërfd geloof willekeurig verschuift
function erfBrein(ouderA: any, ouderB: any): { brein: Record<string, Record<string, number>>; breinN: Record<string, number> } {
  const brein: Record<string, Record<string, number>> = {};
  const breinN: Record<string, number> = {};
  for (const drive of DRIVE_STATS) {
    const a = ouderA.brein?.[drive] || {};
    const b = ouderB.brein?.[drive] || {};
    const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
    if (!ids.size) continue;
    const rij: Record<string, number> = {};
    for (const id of ids) {
      const va = a[id] ?? BREIN_NEUTRAAL, vb = b[id] ?? BREIN_NEUTRAAL;
      let w = (va + vb) / 2;
      // Naar neutraal trekken: het kind érft de neiging maar niet de zekerheid —
      // het moet zelf nog bevestigen (halveert de afstand tot neutraal).
      w = BREIN_NEUTRAAL + (w - BREIN_NEUTRAAL) * 0.6;
      if (Math.random() < BREIN_ERF_MUTATIE) w += (Math.random() - 0.5) * 0.4;
      rij[id] = +Math.max(0, Math.min(1, w)).toFixed(3);
    }
    brein[drive] = rij;
    // Startervaring: genoeg om iets minder blind te exploreren, niet als expert.
    breinN[drive] = 3;
  }
  return { brein, breinN };
}
// ─── Biochemie (stap 3): een kleine interne scheikunde náást de bars ─────────────
// Creatures-getrouw in het klein: stoffen met een concentratie (0..100), emitters
// die ze afgeven op basis van toestand, een reactie die ze omzet, receptors die ze
// in een effect vertalen, en half-lives (genoom-bepaald → evolueerbaar) die ze
// laten wegebben. Deze eerste stap draait NAAST de bars en stuurt alleen de toch al
// ruisige stemming aan; verval/ziekte/euforie blijven ongewijzigd. `gif` wordt al
// als schaduw bijgehouden zodat een latere stap ziekte erop kan overzetten.
// Drives als chemicaliën (Creatures-getrouw). Naast de vier bar-drives dragen we
// drie "gevoelens" mee die het gedrag én het gezicht sturen: verveling, angst,
// eenzaamheid — met eigen emitters, half-lives en receptors.
const CHEM: string[] = ["honger", "vermoeidheid", "stress", "endorfine", "gif", "verveling", "angst", "eenzaamheid"];
function chemHalfLives(G: any): Record<string, number> {
  // half-life in ticks: hoe hoger, hoe trager de stof wegebt (genoom-bepaald)
  return {
    honger:       10 / G.verval.energie,   // trager metabolisme → honger blijft langer
    vermoeidheid: 12 / G.verval.fit,
    stress:       14 / G.verval.stemming,
    endorfine:    6  * G.herstel,           // beter herstel → endorfine zindert langer na
    gif:          40 / G.ziekKans,          // zwakker immuun → gif blijft langer hangen
    verveling:    18,                       // verveling bouwt traag op en zakt traag
    angst:        8  / G.ziekKans,          // angst ebt vrij snel weg als de dreiging voorbij is
    eenzaamheid:  16 * G.social,            // socialere Bottys voelen eenzaamheid langer na
  };
}
const chemVervalFactor = (h: number) => Math.pow(0.5, 1 / Math.max(1, h));
// Stress ondermijnt de weerstand (Creatures p.16/245: hoge stress → lagere
// immuniteit én fertiliteit). Factor 1.0 (geen stress) .. 2.5 (max stress).
const stressVan = (b: any): number => b.chem?.stress ?? 0;
const stressFactor = (b: any): number => 1 + stressVan(b) / 100 * 1.5;

function biochemie(b: any, bottys: any[]) {
  const G = exprGenoom(b.genome);
  const c = b.chem = b.chem || {};
  for (const k of CHEM) if (typeof c[k] !== "number") c[k] = 0;
  const actief = b.doel && b.doel.soort !== "bijkomen" && b.doel.soort !== "herstellen" && b.doel.soort !== "slapen";
  let nabij = 0;
  if (b.pos) for (const o of bottys) { if (o !== b && !o.bezigEi && o.pos && afstand2(b.pos, o.pos) < ZICHT * ZICHT) nabij++; }

  // Emitters: toestand → stof
  c.honger       += (100 - (b.energie ?? 50)) * 0.045;
  c.vermoeidheid += (100 - (b.fit ?? 50)) * 0.03 + (actief ? 1.4 : 0);
  c.stress       += (100 - (b.geluk ?? 50)) * 0.02 + (b.ziek ? 4 : 0) + (nabij === 0 ? 0.8 : 0);
  if (nabij > 0) c.endorfine += Math.min(nabij, 3) * 1.1;                 // gezelschap voelt goed
  if (!b.ziek && Math.random() < 0.004 * G.ziekKans * stressFactor(b)) c.gif += 22; // stress verzwakt de weerstand
  // Nieuwe drives (emitters):
  // verveling: stijgt bij doelloos jagen/dwalen, daalt bij zelfzorg, gezelschap en euforie.
  const bezigLeuk = b.doel && (b.doel.soort === "zelfzorg" || b.doel.soort === "gezelschap" || b.doel.soort === "nieuwsgierig");
  c.verveling    += (bezigLeuk ? -1.4 : 0.7) - Math.min(c.endorfine, 30) * 0.03;
  // angst: ziekte en overbevolking maken bang; endorfine stelt gerust.
  c.angst        += (b.ziek ? 2.4 : 0) + (nabij >= 4 ? 0.7 : 0) + (c.gif ?? 0) * 0.02 - Math.min(c.endorfine, 40) * 0.04;
  // eenzaamheid: stijgt in je eentje, zakt snel in gezelschap.
  c.eenzaamheid  += (nabij === 0 ? 1.3 : -2.2);

  // Reactie: endorfine blust stress (katalytische afbraak). Bewust zwakker (0.06)
  // zodat endorfine ambiënte stress dempt maar acute stress (ziek/eenzaam) niet
  // volledig maskeert — anders bouwt stress nooit op en zijn de fertiliteit/
  // immuniteit-effecten onzichtbaar.
  c.stress -= Math.min(c.stress, c.endorfine * 0.06);

  // Half-lives: exponentieel verval per stof
  const hl = chemHalfLives(G);
  for (const k of CHEM) c[k] = Math.max(0, Math.min(100, +(c[k] * chemVervalFactor(hl[k])).toFixed(2)));

  // Receptors: endorfine tilt de stemming op, stress/verveling/angst/eenzaamheid drukken.
  let d = 0;
  if (c.endorfine   > 30) d += (c.endorfine   - 30) * 0.05;
  if (c.stress      > 40) d -= (c.stress      - 40) * 0.04;
  if (c.verveling   > 50) d -= (c.verveling   - 50) * 0.025;
  if (c.angst       > 45) d -= (c.angst       - 45) * 0.05;
  if (c.eenzaamheid > 50) d -= (c.eenzaamheid - 50) * 0.03;
  if (d !== 0) b.stemming = klem((b.stemming ?? 50) + d);

  // Dominant gevoel → gezichtsuitdrukking (de client leest b.humeur). Ziek en slaap
  // krijgen client-side voorrang; hier bepalen we bang/eenzaam/verveeld/blij.
  const kandidaten: [string, number][] = [
    ["bang",     (c.angst ?? 0)       - 45],
    ["eenzaam",  (c.eenzaamheid ?? 0) - 55],
    ["verveeld", (c.verveling ?? 0)   - 58],
    ["blij",     (c.endorfine ?? 0)   - 58],
  ];
  kandidaten.sort((x, y) => y[1] - x[1]);
  b.humeur = kandidaten[0][1] > 0 ? kandidaten[0][0] : "";
}

// ─── Taal (fase 1): woorden ontstaan, verspreiden en driften ────────────────────
// Emergente verb-object-taal (Creatures p.381-390), maar tussen de Bottys zelf.
// Elke Botty houdt een lexicon bij: concept → zelfverzonnen woord. Bij een sterke
// ervaring (geslaagde zelfzorg) munt hij een woord; in de sociale ronde geeft hij
// het door, soms met klank-mutatie (dialect-drift). Zo convergeert de hive langzaam
// naar een gedeelde taal — met varianten. Concepten fase 1: de vier objecten.
const CONCEPTEN: string[] = OBJECTEN.map(o => o.id);
const CONCEPT_LABEL: Record<string, string> = Object.fromEntries(OBJECTEN.map(o => [o.id, o.kort]));
const TAAL_MK = "kmtsnrlpvhbdgz".split("");
const TAAL_KL = "aeiou".split("");
const taalSyl = (): string => TAAL_MK[Math.floor(Math.random() * TAAL_MK.length)] + TAAL_KL[Math.floor(Math.random() * TAAL_KL.length)];
function muntWoord(): string { return Math.random() < 0.45 ? taalSyl() : taalSyl() + taalSyl(); }
function muteerWoord(w: string): string {
  const r = Math.random();
  if (r < 0.5 && w.length >= 2) {                       // één klank verandert
    const i = Math.floor(Math.random() * w.length);
    const vervang = TAAL_KL.includes(w[i]) ? TAAL_KL[Math.floor(Math.random() * TAAL_KL.length)] : TAAL_MK[Math.floor(Math.random() * TAAL_MK.length)];
    return w.slice(0, i) + vervang + w.slice(i + 1);
  }
  if (r < 0.8) return w + taalSyl();                    // langer
  return w.length > 2 ? w.slice(0, -2) : w + taalSyl(); // korter
}
// De spreker geeft zijn woord voor één concept door aan de luisteraar (soms met drift).
function praat(spreker: any, luisteraar: any): { concept: string; woord: string } | null {
  const lex = spreker.lexicon; if (!lex) return null;
  const bekend = CONCEPTEN.filter(c => lex[c]);
  if (!bekend.length) return null;
  const concept = bekend[Math.floor(Math.random() * bekend.length)];
  const woord = lex[concept];
  luisteraar.lexicon = luisteraar.lexicon || {};
  if (luisteraar.lexicon[concept] === woord) return null;
  luisteraar.lexicon[concept] = Math.random() < 0.12 ? muteerWoord(woord) : woord;
  return { concept, woord: luisteraar.lexicon[concept] };
}

// Punten van interesse in het klaslokaal — waar nieuwsgierige Botty's naartoe zweven
// om "rond te kijken" (coördinaten matchen construct.html, wereld 1000×600).
const POIS = [
  { id: "bord",  x: 510, y: 240, tekst: "de sommen op het bord" },
  { id: "raamL", x: 160, y: 250, tekst: "het bos door het linkerraam" },
  { id: "raamR", x: 840, y: 250, tekst: "het bos door het rechterraam" },
  { id: "deur",  x: 950, y: 380, tekst: "de open deur naar het bos" },
  { id: "bal",   x: 700, y: 470, tekst: "de bal op de vloer" },
  { id: "kruk",  x: 250, y: 450, tekst: "de omgevallen kruk" },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────
function klem(v: number) { return Math.max(0, Math.min(100, v)); }
function heeft(b: any, mut: string) { return (b.mutaties || []).includes(mut); }
function maakId(): string {
  try { return crypto.randomUUID().slice(0, 8); }
  catch { return Math.random().toString(36).slice(2, 10); }
}

// ─── Geslacht (§3.4: seksueel dimorfisme) ────────────────────────────────────────
// Elke Botty is ♂ of ♀. Nieuwe Botty's krijgen willekeurig (≈50/50) een sekse;
// bestaande Botty's zonder sekse leiden we stabiel af uit hun bid, zodat het niet
// elke tick wisselt vóór het is opgeslagen. Sekse moduleert de expressie licht
// (dimorfisme) en stuurt de partnerkeuze (de AI koppelt bij voorkeur ♂×♀).
function hashSekse(seed: string): "m" | "v" {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (h & 1) ? "m" : "v";
}
// Subtiel dimorfisme op de lichaamsgrootte: ♂ iets groter, ♀ iets kleiner.
function sekseGrootte(basis: number, sekse: string): number {
  return +(basis * (sekse === "m" ? 1.06 : 0.95)).toFixed(3);
}

// ─── IQ: priemgetallen uitwerken ───────────────────────────────────────────────
// Elke Botty start met IQ 100. Per denk-ronde maakt hij een BEWUSTE keuze: uit een
// reeks kandidaten kiest hij de nog niet ontdekte priem die het best bij zijn
// persoonlijke PRIEMSMAAK past. Die smaak leiden we af uit het genoom (dus stabiel
// én erfelijk: kinderen lijken op hun ouders, mutaties laten de smaak driften), zodat
// elke Botty zijn eigen niche in de getallenlijn claimt en zich onderscheidt.
//   nieuwe vondst = +1 IQ · verstrooide misgok = -2 · niets vrij = 0
// Slimmere Bottys (hogere datakwaliteit) slagen vaker én bekijken meer kandidaten,
// dus kiezen "lekkerder" en vinden vaker iets.
const PRIEM_LO = 2;        // het hele veld vanaf het begin
const PRIEM_HI = 1000000;  // 78.498 priemen onder 1.000.000 (al ontdekte worden gededupeerd)
// Euforie-afkoelperiode: na een vondst-kick zoekt een Botty ~10 min niet echt —
// hij geniet na en broedt op strategie. Pas daarna kan hij weer vinden (en een
// nieuwe euforie krijgen). Zo blijft de kick speciaal én worden de drives
// (zelfzorg, bijkomen, AI-zorg) niet permanent gemaskeerd door volle bars.
const EUFORIE_PAUZE = 10 * 60 * 1000;
function isPriem(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

// ── Priemsmaak: elke Botty valt op priemen met een bepaalde eigenschap ──────────
function cijfersom(n: number): number { let s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } return s; }
// Symmetrie 0..1: hoeveel van de spiegelende cijferparen matchen (1 = palindroom).
function palindroomScore(n: number): number {
  const s = "" + n; let m = 0, t = 0;
  for (let i = 0, j = s.length - 1; i < j; i++, j--) { t++; if (s[i] === s[j]) m++; }
  return t ? m / t : 1;
}
// Een smaak scoort een priem 0..1: hoe hoger, hoe lekkerder voor déze Botty. Bij
// zeldzame voorkeuren is de score een gradiënt (bijna-tweeling, bijna-palindroom),
// zodat élke Botty altijd richting zijn niche kan kiezen — ook als de perfecte
// kandidaat ontbreekt.
const SMAKEN = [
  { id: "tweeling",    naam: "tweelingpriemen",               score: (p: number) => (isPriem(p - 2) || isPriem(p + 2)) ? 1 : (isPriem(p - 4) || isPriem(p + 4)) ? 0.4 : 0 },
  { id: "sophie",      naam: "Sophie-Germain-priemen",        score: (p: number) => isPriem(2 * p + 1) ? 1 : (isPriem(2 * p - 1) ? 0.4 : 0) },
  { id: "palindroom",  naam: "palindroompriemen",             score: (p: number) => palindroomScore(p) },
  { id: "pythagoras",  naam: "Pythagoras-priemen (≡1 mod 4)", score: (p: number) => p % 4 === 1 ? 1 : 0 },
  { id: "eindcijfer1", naam: "priemen die op 1 eindigen",     score: (p: number) => p % 10 === 1 ? 1 : 0 },
  { id: "eindcijfer3", naam: "priemen die op 3 eindigen",     score: (p: number) => p % 10 === 3 ? 1 : 0 },
  { id: "eindcijfer7", naam: "priemen die op 7 eindigen",     score: (p: number) => p % 10 === 7 ? 1 : 0 },
  { id: "eindcijfer9", naam: "priemen die op 9 eindigen",     score: (p: number) => p % 10 === 9 ? 1 : 0 },
  { id: "cijfersom",   naam: "priemen met hoge cijfersom",    score: (p: number) => Math.min(1, cijfersom(p) / 36) },
];

// Stabiele smaak uit het genoom (niet uit bid → erfelijk). We XOR-en twee genen:
// onder single-point crossover erft een kind die genen meestal heel van één ouder
// (≈87% kind-lijkt-op-ouder), terwijl recombinatie/mutatie af en toe een nieuwe
// smaak doet ontstaan — evolutionaire drift. XOR houdt de verdeling gelijkmatig.
function smaakVan(b: any) {
  const by = genoomBytes(b.genome);
  const idx = Math.min(SMAKEN.length - 1, Math.floor((by[0] ^ by[2]) / (256 / SMAKEN.length)));
  return SMAKEN[idx];
}

// ── Basis-wiskunde: leren door doen ─────────────────────────────────────────────
// Hoe meer priemen een Botty ooit vond (b.vondsten), hoe meer deelbaarheidsregels
// hij doorkrijgt. Met elke beheerste regel verwerpt hij meteen de getallen die
// deelbaar zijn door 2, 3, 5, 7, … — die overweegt hij niet eens meer. Zo besteedt
// hij z'n denkmoeite aan kansrijkere getallen en vindt hij efficiënter priemen,
// vooral als die schaarser worden. Een priem >13 is nooit deelbaar door deze
// kleine priemen, dus de filter slaat nooit een echte vondst over.
const WISKUNDE_WIEL = [2, 3, 5, 7, 11, 13];
const WISKUNDE_DREMPELS = [3, 10, 25, 50, 100, 200]; // vondsten nodig voor regel 1..6
function wiskundeNiveau(vondsten: number): number {
  let n = 0;
  for (const d of WISKUNDE_DREMPELS) if (vondsten >= d) n++;
  return n; // 0..6 = aantal beheerste deelbaarheidsregels
}

// uitkomst: "nieuw" (bewust gekozen verse vondsten) | "fout" (verstrooide misgok) | "leeg" (niets vrij)
function denkPriem(b: any, ontdekt: Set<number>): { getallen: number[]; getal: number; uitkomst: string; iq: number; smaak: string; niveau: number } {
  const intel = b.datakwaliteit ?? 50;
  const smaak = smaakVan(b);
  const ervaring = b.vondsten ?? 0;
  const niveau = wiskundeNiveau(ervaring);
  const wiel = WISKUNDE_WIEL.slice(0, niveau); // beheerste deelbaarheidsregels
  // Ervaring helpt slagen én vergroot de keuze (meer kandidaten tegelijk afwegen).
  // Agency: een Botty die zich heeft voorgenomen te jagen, doet het net iets feller.
  const gedreven = b.doel && b.doel.soort === "priemjacht";
  const p = Math.max(0.5, Math.min(0.99, 0.5 + (intel - 50) / 100 * 0.9 + niveau * 0.02 + (gedreven ? 0.05 : 0)));
  if (Math.random() < p) {
    const keuze = Math.max(2, Math.min(16, Math.round(2 + intel / 100 * 10 + niveau + (gedreven ? 2 : 0))));
    const shortlist: number[] = [];
    let overwogen = 0, trekkingen = 0;
    // Wiel-verwerpingen kosten geen denkmoeite (overwogen); alleen kansrijke
    // getallen tellen. Zo betekent meer wiskunde = effectief meer zoekkracht.
    while (shortlist.length < keuze && overwogen < keuze * 8 && trekkingen < keuze * 400) {
      trekkingen++;
      const g = PRIEM_LO + Math.floor(Math.random() * (PRIEM_HI - PRIEM_LO));
      if (wiel.some(d => g % d === 0)) continue; // basis-wiskunde: direct verwerpen
      overwogen++;
      if (isPriem(g) && !ontdekt.has(g)) shortlist.push(g);
    }
    if (shortlist.length) {
      // Bewuste keuze op smaak (lekkerste eerst); ervaren Bottys "zien" er meer
      // tegelijk en oogsten meerdere priemen per denkronde (1..4 met het niveau).
      shortlist.sort((x, y) => smaak.score(y) - smaak.score(x));
      const vangst = Math.min(shortlist.length, 1 + Math.floor(niveau / 2));
      const getallen = shortlist.slice(0, vangst);
      for (const g of getallen) ontdekt.add(g);
      b.iq = Math.min(999, (b.iq ?? 100) + getallen.length);
      b.vondsten = ervaring + getallen.length; // leren door doen
      return { getallen, getal: getallen[0], uitkomst: "nieuw", iq: b.iq, smaak: smaak.naam, niveau };
    }
    return { getallen: [], getal: 0, uitkomst: "leeg", iq: b.iq ?? 100, smaak: smaak.naam, niveau };
  }
  let getal: number;
  do { getal = PRIEM_LO + 2 + Math.floor(Math.random() * (PRIEM_HI - PRIEM_LO - 2)); } while (isPriem(getal));
  b.iq = Math.max(0, (b.iq ?? 100) - 2);
  return { getallen: [], getal, uitkomst: "fout", iq: b.iq, smaak: smaak.naam, niveau };
}

// ─── Genoom (Creatures-stijl, 16 genen, elk 1 byte) ──────────────────────────
// byte=128 → multiplier ~1.0 → identiek aan huidig gedrag (veilige migratie)
// byte=0   → 0.5x  (trager verval, minder gevoelig voor ziekte, etc.)
// byte=255 → 1.5x  (sneller verval, maar ook sterkere reactie op zorg)
//
// Gen 0–4  : vervalsnelheden (energie, data, fit, geluk, stemming)
// Gen 5–8  : zorg-winsten   (energie, data, fit, geluk)
// Gen 9    : ziek-kans
// Gen 10   : herstel-snelheid
// Gen 11   : sociale gevoeligheid (bezoekers → stemming)
// Gen 12   : kleur-tint (-30° tot +30° hue-rotate op ouder-palet)
// Gen 13   : grootte (0.80 tot 1.20 schaal)
// Gen 14   : expressie-bias (stemmings-drempel)
// Gen 15   : verouderingssnelheid

const GENOOM_LEN = 16;

function bytesNaarGenoom(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function genoomBytes(g: string | undefined): Uint8Array {
  if (!g || typeof g !== "string") return new Uint8Array(GENOOM_LEN).fill(128);
  try {
    const b64 = g.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(padded);
    const arr = new Uint8Array(GENOOM_LEN);
    for (let i = 0; i < GENOOM_LEN; i++) arr[i] = i < bin.length ? bin.charCodeAt(i) : 128;
    return arr;
  } catch {
    return new Uint8Array(GENOOM_LEN).fill(128);
  }
}

function genoomGenereer(variantie = 25): string {
  const bytes = new Uint8Array(GENOOM_LEN);
  for (let i = 0; i < GENOOM_LEN; i++) {
    const v = 128 + (Math.random() - 0.5) * variantie * 2;
    bytes[i] = Math.max(0, Math.min(255, Math.round(v)));
  }
  return bytesNaarGenoom(bytes);
}

// Byte als multiplier: 0→0.5x, 128→~1.0x, 255→1.5x
function mult(b: Uint8Array, i: number): number {
  return 0.5 + b[i] / 255;
}

function exprGenoom(g: string | undefined) {
  const b = genoomBytes(g);
  return {
    verval: {
      energie:  mult(b, 0),
      data:     mult(b, 1),
      fit:      mult(b, 2),
      geluk:    mult(b, 3),
      stemming: mult(b, 4),
    },
    zorg: {
      energie: mult(b, 5),
      data:    mult(b, 6),
      fit:     mult(b, 7),
      geluk:   mult(b, 8),
    },
    ziekKans:  mult(b,  9),
    herstel:   mult(b, 10),
    social:    mult(b, 11),
    kleurTint: Math.round((b[12] / 255 - 0.5) * 60),  // -30° tot +30°
    grootte:   0.80 + (b[13] / 255) * 0.40,            // 0.80 tot 1.20
    expressieBias: (b[14] / 255 - 0.5) * 20,           // -10 tot +10
    agingSpeed: mult(b, 15),
  };
}

function genoomKruis(a: string | undefined, b: string | undefined): { genoom: string; vanA: number; vanB: number } {
  const ba = genoomBytes(a), bb = genoomBytes(b);
  const punt = 3 + Math.floor(Math.random() * 10);
  const kind = new Uint8Array(GENOOM_LEN);
  for (let i = 0; i < GENOOM_LEN; i++) kind[i] = i < punt ? ba[i] : bb[i];
  return { genoom: bytesNaarGenoom(kind), vanA: punt, vanB: GENOOM_LEN - punt };
}

function genoomMuteer(g: string | undefined, kans = 0.08): { genoom: string; aantalMutaties: number } {
  const b = genoomBytes(g);
  let aantalMutaties = 0;
  for (let i = 0; i < GENOOM_LEN; i++) {
    if (Math.random() < kans) {
      b[i] = Math.max(0, Math.min(255, b[i] + Math.round((Math.random() - 0.5) * 60)));
      aantalMutaties++;
    }
  }
  return { genoom: bytesNaarGenoom(b), aantalMutaties };
}

// ─── Kleur-tint via hue-rotate ────────────────────────────────────────────────
function hueRotateHex(hex: string, deg: number): string {
  if (!hex || !hex.startsWith("#") || deg === 0) return hex;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g ? ((b - r) / d + 2) / 6
      :             ((r - g) / d + 4) / 6;
  }
  h = (h + deg / 360 + 1) % 1;
  function hq(p: number, q: number, t: number) {
    t = (t + 1) % 1;
    return t < 1/6 ? p + (q-p)*6*t : t < 0.5 ? q : t < 2/3 ? p + (q-p)*(2/3-t)*6 : p;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const nr = s ? hq(p, q, h + 1/3) : l;
  const ng = s ? hq(p, q, h)       : l;
  const nb = s ? hq(p, q, h - 1/3) : l;
  const x = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${x(nr)}${x(ng)}${x(nb)}`;
}

function tintPalet(palet: any, deg: number): any {
  if (!deg) return palet;
  const result = { ...palet };
  for (const v of ["accent", "oogje", "scherm", "schermRand", "broek", "broekRand"]) {
    if (result[v]) result[v] = hueRotateHex(result[v], deg);
  }
  if (Math.abs(deg) > 8) result.naam = "Geëvolueerd";
  return result;
}

// ─── Stage & fitness ──────────────────────────────────────────────────────────
function huidigeStage(b: any) {
  const G = exprGenoom(b.genome);
  const leeftijd = (Date.now() - b.geboren) / 1000 / G.agingSpeed;
  if (leeftijd < 120) return "baby";
  if (leeftijd < 300) return "tiener";
  return "volwassen";
}

function rijp(b: any) {
  return huidigeStage(b) === "volwassen"
    && (b.datakwaliteit ?? 50) + (b.efficientie ?? 50) >= 80
    && !b.bezigEi;
}

// ─── Sterfelijkheid: levenskracht-klok ──────────────────────────────────────────
// Creatures: het brein-orgaan heeft een life-force; wordt die 0, dan sterft de
// creature (Genetics Kit p.50). Onze levenskracht (0..100) beweegt naar een doel
// dat bepaald wordt door ouderdom (een dalend plafond) minus acute nood (ziek,
// uithongering, gif). Zo sterven vooral de oude en chronisch-zwakke Bottys —
// jonge, gezonde Bottys overleven zelfs tegenslag. Tick-frequentie-onafhankelijk:
// het evenwicht ligt vast, alleen de aanloop hangt van het aantal calls af.
const OUDERDOM_START = 4000;  // leeftijd-eenheden (realSec/agingSpeed) waarop veroudering begint
const OUDERDOM_DOOD  = 8000;  // hier staat het plafond op 0 → sterven van ouderdom
const MIN_POP = 4;            // zachte vloer: de hive sterft nooit hieronder uit
const MAX_POP = 12;           // zachte cap: daarboven vervangt een geboorte de zwakste ouder

// ─── Broedmachine: kweek legt een ei, een bezoeker broedt het uit ────────────────
const MAX_EIEREN    = 2;             // max eieren tegelijk in de broedmachine
const BROEDTIJD_MS  = 90_000;        // ei is rijp na 1,5 minuut warmte
const AUTO_BROED_MS = 20 * 60_000;   // vangnet: zonder bezoeker komt het ei vanzelf uit

// ─── Bezoekersinteractie: de Hand grijpt in (aaien / voeren / medicijn / woord) ──
// Geen login: het is één gedeelde hive, dus een GLOBALE token-bucket beschermt de
// simulatie. Alle bezoekers putten uit dezelfde emmer; is die leeg, dan wacht de
// hand even. Zo kan geen enkele kijker (of bot) de hive ontregelen, ook niet met
// honderd tegelijk.
const IA_BUCKET_MAX   = 12;          // burst: zoveel ingrepen mogen er kort achter elkaar
const IA_REFILL_MS    = 2500;        // daarna vult de emmer met 1 token per 2,5 s (~24/min)
function interactieBudget(state: any, nu: number): { tokens: number; laatst: number } {
  const b = (state.ia_bucket && typeof state.ia_bucket.tokens === "number")
    ? state.ia_bucket : { tokens: IA_BUCKET_MAX, laatst: nu };
  const bij = Math.max(0, (nu - (b.laatst ?? nu)) / IA_REFILL_MS);
  return { tokens: Math.min(IA_BUCKET_MAX, b.tokens + bij), laatst: nu };
}

const DOEL_POP = 9;           // streefgetal voor de geboortekans
function senescence(b: any): number {
  const leeftijd = (Date.now() - (b.geboren ?? Date.now())) / 1000 / exprGenoom(b.genome).agingSpeed;
  return Math.max(0, Math.min(1, (leeftijd - OUDERDOM_START) / (OUDERDOM_DOOD - OUDERDOM_START)));
}
function updateLevenskracht(b: any) {
  if (typeof b.levenskracht !== "number") b.levenskracht = 100;
  const plafond = 100 * (1 - senescence(b));       // ouderdom verlaagt het plafond permanent
  let acuut = 0;                                    // acute nood drukt het doel tijdelijk omlaag
  if (b.ziek) acuut += 12;
  const laagste = Math.min(b.energie ?? 50, b.data ?? 50, b.fit ?? 50, b.geluk ?? 50);
  if (laagste < 12) acuut += (12 - laagste) * 1.5;  // uithongering
  const gif = b.chem?.gif ?? 0;
  if (gif > 40) acuut += (gif - 40) * 0.3;
  const doel = Math.max(0, plafond - acuut);
  b.levenskracht = Math.max(0, Math.min(100, b.levenskracht + (doel - b.levenskracht) * 0.1));
}
function isDood(b: any): boolean {
  return !b.bezigEi && ((b.levenskracht ?? 100) <= 0.5 || senescence(b) >= 1);
}

// ─── Groei bijhouden: een levenslange staat van dienst per Botty ─────────────────
// Accumuleert mijlpalen tijdens het leven (piek-IQ, priemen, woorden, vrienden,
// niveau; kinderen wordt bij de geboorte opgehoogd). Bij de dood vormt dit het
// grafschrift dat in de `levens`-tabel bewaard blijft.
function updateGroei(b: any) {
  const g = b.groei = b.groei || { piekIQ: b.iq ?? 100, kinderen: 0 };
  if ((b.iq ?? 100) > (g.piekIQ ?? 0)) g.piekIQ = b.iq;
  g.vondsten = b.vondsten ?? 0;
  g.niveau   = wiskundeNiveau(b.vondsten ?? 0);
  g.woorden  = b.lexicon ? Object.keys(b.lexicon).length : 0;
  g.vrienden = b.relaties ? Object.keys(b.relaties).length : 0;
}
function geneScore(b: any) { return (b.datakwaliteit ?? 50) + (b.efficientie ?? 50); }
// Urgentie: hoe lager, hoe eerder zorg nodig. De láágste losse stat telt
// (één kritieke waarde is erger dan een matig gemiddelde), zieken springen voor.
function urgentie(b: any) {
  let u = Math.min(b.energie, b.data, b.fit, b.geluk) - (b.ziek ? 40 : 0);
  // Agency: een Botty die zélf om herstel/rust vraagt, dringt iets voor in de rij.
  if (b.doel && (b.doel.soort === "herstellen" || b.doel.soort === "bijkomen")) u -= 8;
  return u;
}
function kiesDoelen(bottys: any[], n: number) {
  return [...bottys]
    .filter(b => !b.bezigEi)
    .sort((a, b) => urgentie(a) - urgentie(b))
    .slice(0, n);
}

// ─── Stemming ─────────────────────────────────────────────────────────────────
function updateStemming(b: any, bezoekers: number) {
  const G = exprGenoom(b.genome);
  const stage = huidigeStage(b);
  const genBonus = ((b.datakwaliteit ?? 50) + (b.efficientie ?? 50) - 100) / 20;
  const bezoekersBonus = Math.min(bezoekers, 12) * 0.9 * G.social;
  const stageEffect = stage === "baby" ? (Math.random() * 8 - 4)
    : stage === "tiener" ? (Math.random() * 4 - 1.5) : 0.4;
  const wifiBonus = heeft(b, "wifi") || heeft(b, "antenne2") ? 1.5 : 0;
  const ziekPenalty = b.ziek ? -5 : 0;
  const vervalDecay = -1.1 * G.verval.stemming;
  b.stemming = klem(
    (b.stemming ?? 50) + vervalDecay + genBonus + bezoekersBonus + stageEffect + wifiBonus + ziekPenalty
  );
}

// ─── Zorg ─────────────────────────────────────────────────────────────────────
function zorg(b: any) {
  const G = exprGenoom(b.genome);
  const dataBonus = heeft(b, "wifi") || heeft(b, "antenne2") ? 5 : 0;

  // 1) Ziekte eerst — een zieke Botty is altijd het urgentst.
  if (b.ziek) {
    b.ziek = false;
    b.energie = klem(b.energie + 10 * G.herstel);
    b.fit     = klem(b.fit     + 10 * G.herstel);
    b.stemming = klem((b.stemming ?? 50) + 14);
    return { label: "💊", kleur: "#ff8bd0", animeer: true, tekst: "AI geneest <b>" + b.naam + "</b>" };
  }

  // 2) Anders: pak de láágste stat onder 90 (de echte bottleneck), niet vaste volgorde.
  const opties = [
    { v: b.energie, doe: () => { b.energie = klem(b.energie + 18 * G.zorg.energie); }, label: "+⚡", kleur: "#5ec6ff", animeer: true,  tekst: "AI geeft <b>" + b.naam + "</b> energie" },
    { v: b.data,    doe: () => { b.data    = klem(b.data    + (14 + dataBonus) * G.zorg.data); }, label: "+💾", kleur: "#3a9d94", animeer: true,  tekst: "AI traint <b>" + b.naam + "</b>" },
    { v: b.fit,     doe: () => { b.fit     = klem(b.fit     + 16 * G.zorg.fit); },  label: "+🏃", kleur: "#7fd06f", animeer: true,  tekst: "AI laat <b>" + b.naam + "</b> sporten" },
    { v: b.geluk,   doe: () => { b.geluk   = klem(b.geluk   + 14 * G.zorg.geluk); }, label: "+😊", kleur: "#f6a623", animeer: false, tekst: "AI houdt <b>" + b.naam + "</b> blij (maar geen band)" },
  ].filter(o => o.v < 90).sort((x, y) => x.v - y.v);

  if (opties.length) {
    const o = opties[0];
    o.doe();
    b.stemming = klem((b.stemming ?? 50) + 14);
    return { label: o.label, kleur: o.kleur, animeer: o.animeer, tekst: o.tekst };
  }

  // 3) Alles vol → klein geluk-zetje.
  b.geluk = klem(b.geluk + 5);
  b.stemming = klem((b.stemming ?? 50) + 8);
  return { label: "+geluk 🤖", kleur: "#f6a623", animeer: false, tekst: "AI houdt <b>" + b.naam + "</b> blij (maar geen band)" };
}

// ─── Verval ───────────────────────────────────────────────────────────────────
function vervalEen(b: any) {
  // Wie slaapt vervalt niet maar herstelt (dag/nacht-cyclus). Ook zieken en
  // uitgeputten rusten 's nachts uit op de rustplek — de AI-verzorger slaapt
  // immers ook, dus zonder dit zou een zieke de hele nacht wegkwijnen.
  if (NACHT && (slaapt(b) || b.doel?.soort === "herstellen" || b.doel?.soort === "bijkomen")) { slaap(b); return; }
  const G = exprGenoom(b.genome);
  b.energie  = klem(b.energie  - 2.4 * G.verval.energie);
  b.data     = klem(b.data     - (heeft(b, "zonnepaneel") ? 0.8 : 1.6) * G.verval.data);
  b.fit      = klem(b.fit      - 1.6 * G.verval.fit);
  b.geluk    = klem(b.geluk    - 1.5 * G.verval.geluk);
  b.stemming = klem((b.stemming ?? 50) - 1.6 * G.verval.stemming);
  // Immuniteit: hoge stress verzwakt de weerstand → grotere ziektekans.
  if (!b.ziek && Math.random() < 0.004 * G.ziekKans * stressFactor(b)) { b.ziek = true; onthoud(b, "ziek", "ik werd ziek"); }
}

// ─── Dag & nacht: de hive leeft op Nederlandse kloktijd ──────────────────────────
// 's Nachts (22:00–07:00 Europe/Amsterdam) slaapt de hive: Botty's zoeken de
// rustplek, verval keert om in herstel, de AI-verzorger pauzeert, kweek en
// priemjacht liggen stil. Slapen is functioneel: dromen spelen herinneringen na
// en consolideren het brein (het sterkst geleerde verband wordt iets sterker,
// zwakke verbanden slijten richting neutraal — zoals slaap echte synapsen snoeit).
const NACHT_START = 22, NACHT_EIND = 7;
function amsterdamUur(t: number): number {
  return Number(new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "numeric", hour12: false })
    .format(new Date(t)));
}
function isNacht(t: number): boolean { const u = amsterdamUur(t); return u >= NACHT_START || u < NACHT_EIND; }
let NACHT = false;   // per request gezet in de serve-handler

function slaapt(b: any): boolean { return b.doel?.soort === "slapen"; }

// Eén slaap-tick: herstel i.p.v. verval (aangeroepen op het verval-ritme)
function slaap(b: any) {
  const G = exprGenoom(b.genome);
  b.energie  = klem((b.energie ?? 50) + 2.4 * G.herstel);
  b.fit      = klem((b.fit ?? 50) + 0.6 * G.herstel);
  b.stemming = klem((b.stemming ?? 50) + 0.3);
  const c = b.chem;
  if (c) {
    c.vermoeidheid = Math.max(0, (c.vermoeidheid ?? 0) - 3);
    c.stress       = Math.max(0, (c.stress ?? 0) - 1.5);
  }
}

// Dromen: herinnering naspelen + brein-consolidatie
function droom(b: any): string {
  const herin = Array.isArray(b.herinneringen) && b.herinneringen.length ? kies(b.herinneringen) : null;
  const tekst = herin
    ? kies(["ik droom dat " + herin.tekst, "in mijn droom " + herin.tekst + " — alweer", "flarden: " + herin.tekst])
    : kies(["ik droom van zachte getallen", "ik droom van zon door het raam", "ik droom dat ik kan vliegen"]);
  b.gedachte = tekst;
  if (b.brein) {
    for (const stat of Object.keys(b.brein)) {
      const w = b.brein[stat]; if (!w || typeof w !== "object") continue;
      const ids = Object.keys(w); if (!ids.length) continue;
      const top = ids.sort((p, q) => (w[q] ?? 0) - (w[p] ?? 0))[0];
      for (const id of ids) {
        w[id] = Math.round((id === top
          ? Math.min(0.95, (w[id] ?? 0.5) + 0.004)          // het geleerde verankert
          : (w[id] ?? 0.5) + (0.5 - (w[id] ?? 0.5)) * 0.02  // ruis slijt naar neutraal
        ) * 1000) / 1000;
      }
    }
  }
  return tekst;
}

// ─── Bewustzijn: innerlijke gedachte + episodisch geheugen ──────────────────────
// Géén echt bewustzijn — een representatie: elke Botty "merkt" zijn meest saillante
// interne signaal en verwoordt het (Laag 1), en onthoudt een handvol sleutel-
// momenten uit zijn leven (Laag 2). Temperament komt uit het genoom: gen 11
// (sociaal = hoeveel hij aan anderen denkt), gen 14 (expressie = hoe uitgesproken).
function kies<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function onthoud(b: any, soort: string, tekst: string) {
  if (!Array.isArray(b.herinneringen)) b.herinneringen = [];
  const laatste = b.herinneringen[b.herinneringen.length - 1];
  if (laatste && laatste.soort === soort && laatste.tekst === tekst) return; // geen directe dubbel
  b.herinneringen.push({ t: Date.now(), soort, tekst });
  if (b.herinneringen.length > 8) b.herinneringen = b.herinneringen.slice(-8); // alleen de recentste 8
}

function denkBewust(b: any, ctx: { getallen?: number[]; anderen: any[] }) {
  const by = genoomBytes(b.genome);
  const sociaalHoog = mult(by, 11) > 1.05;
  const expressief = by[14] > 150;
  const uit = (s: string) => expressief ? s + "!" : s;
  const smk = smaakVan(b).naam;
  const niv = wiskundeNiveau(b.vondsten ?? 0);

  // Prioriteit: nood/lichaam → euforie → tekort → herinnering → sociaal → contemplatie
  if (b.ziek) { b.gedachte = kies(["Er knaagt iets in mijn circuits…", "Ik voel me niet mezelf.", "Alles loopt traag vandaag."]); return; }

  if (ctx.getallen && ctx.getallen.length) {
    const g = ctx.getallen[0];
    b.gedachte = uit(kies([g + "… precies goed", "Daar! " + g + " — ik voel het kloppen", "Ik zie " + smk + " overal", "Mijn hoofd tintelt"]));
    return;
  }

  const tekorten: [number, string][] = [
    [b.energie, "Ik voel me leeg…"], [b.data, "Ik wil meer weten."],
    [b.fit, "Mijn lijf is moe."], [b.geluk, "Ik mis iets."],
  ];
  const laag = tekorten.filter(t => t[0] < 28).sort((a, c) => a[0] - c[0])[0];
  if (laag) { b.gedachte = laag[1]; return; }

  // Biochemie voelbaar: een dominante stof kleurt af en toe de gedachte.
  const ch = b.chem;
  if (ch && Math.random() < 0.35) {
    if ((ch.stress ?? 0) > 55)      { b.gedachte = uit(kies(["Ik voel me gespannen…", "Er zit onrust in mijn circuits", "Ik kom niet tot rust"])); return; }
    if ((ch.endorfine ?? 0) > 55)   { b.gedachte = uit(kies(["Alles voelt licht nu", "Ik gloei van binnen", "Wat een fijn gevoel"])); return; }
    if ((ch.vermoeidheid ?? 0) > 60){ b.gedachte = kies(["Ik ben bekaf.", "Mijn systemen slepen zich voort", "Even bijkomen…"]); return; }
    if ((ch.honger ?? 0) > 60)      { b.gedachte = kies(["Ik snak naar stroom.", "Mijn accu knort"]); return; }
  }

  if (Array.isArray(b.herinneringen) && b.herinneringen.length && Math.random() < 0.3) {
    const h = kies(b.herinneringen);
    b.gedachte = kies(["Ik denk nog aan vroeger: " + h.tekst, "Ik herinner me: " + h.tekst]);
    return;
  }

  // Laag 4 — besef van anderen: merk de toestand van een nabije buur op.
  if (sociaalHoog && Math.random() < 0.6) {
    const buren = ctx.anderen.filter(x => x !== b && !x.bezigEi && x.pos && b.pos && afstand2(b.pos, x.pos) < ZICHT * ZICHT);
    if (buren.length) {
      const zieke = buren.find(x => x.ziek);
      const droeve = buren.find(x => (x.stemming ?? 50) < 35);
      const blije = buren.find(x => (x.stemming ?? 50) > 85);
      b.gedachte = zieke ? kies(["Gaat het wel met " + zieke.naam + "?", "Ik maak me zorgen om " + zieke.naam + "."])
        : droeve ? kies([droeve.naam + " lijkt somber.", "Ik wil " + droeve.naam + " opvrolijken."])
        : blije  ? uit(kies([blije.naam + " straalt", "Wat is " + blije.naam + " blij"]))
        :          kies(["Fijn, " + kies(buren).naam + " is dichtbij.", "Ik ben niet alleen."]);
      return;
    }
    // niemand dichtbij → verlangen naar gezelschap
    const ver = ctx.anderen.filter(x => x !== b && !x.bezigEi);
    if (ver.length) { b.gedachte = kies(["Waar is iedereen?", "Ik voel me alleen.", "Ik zou " + kies(ver).naam + " graag zien."]); return; }
  }

  if (b.doel && b.doel.soort === "zelfzorg" && typeof b.doel.tekst === "string") {
    b.gedachte = uit(kies(["Ik weet wat ik nodig heb: " + b.doel.tekst, "Even voor mezelf zorgen", "Dit kan ik zelf oplossen", "Eerst " + b.doel.tekst + ", dan de rest"]));
    return;
  }

  if (b.doel && b.doel.soort === "nieuwsgierig" && typeof b.doel.tekst === "string") {
    const wat = b.doel.tekst.replace("kijken naar ", "");
    b.gedachte = uit(kies(["Wat is dat daar?", "Ik wil " + wat + " van dichtbij zien", "Hé… " + wat, "Even " + wat + " bekijken"]));
    return;
  }

  // Afkoelend na een euforie: niet jagen, wel nadenken over de volgende zet.
  if (Date.now() - (b.euforieOp || 0) < EUFORIE_PAUZE) {
    b.gedachte = uit(kies(["Nog even nagenieten… straks weer jagen", "Mijn volgende " + smk + "-zet rijpt nog",
      "Eerst ademhalen, dan de volgende priem", "Ik broed op een nieuwe strategie"]));
    return;
  }

  // Taal: soms mijmert een Botty over zijn eigen woord voor iets.
  if (b.lexicon && Math.random() < 0.2) {
    const bekend = CONCEPTEN.filter(c => b.lexicon[c]);
    if (bekend.length) {
      const c = kies(bekend);
      b.gedachte = uit(kies(["“" + b.lexicon[c] + "”… zo noem ik " + (CONCEPT_LABEL[c] || c),
        "In mijn hoofd heet " + (CONCEPT_LABEL[c] || c) + " “" + b.lexicon[c] + "”", "“" + b.lexicon[c] + "”"]));
      return;
    }
  }

  const zelf = niv >= 4 ? "Ik ken de getallen nu goed." : niv >= 2 ? "Ik begin de patronen te zien." : "Zoveel getallen nog te ontdekken.";
  b.gedachte = kies(["Ik denk na over " + smk + ".", zelf, "Welke priem wacht er op mij?", "Stil. Rekenen.", "Ik tel de stilte."]);
}

// ─── Laag 3 — eigen doel / agency ───────────────────────────────────────────────
// Een Botty vormt aan het begin van de tick een intentie. De hive-mechaniek buigt
// daarna licht mee (zorg luistert, partners die een kind willen worden vaker
// gekoppeld, gezelschap-zoekers ontmoeten elkaar, gedreven jagers zoeken feller).
function kiesDoel(b: any, ctx: { anderen: any[] }) {
  if (b.ziek) { b.doel = { soort: "herstellen", tekst: "weer beter worden" }; return; }
  // 's Nachts slaapt iedereen die niet ziek is
  if (NACHT) { b.doel = { soort: "slapen", tekst: "slapen tot de ochtend" }; return; }
  if (slaapt(b)) b.doel = null;   // ochtend: wakker worden, vers doel kiezen
  // Zelfregulatie (drives → affordances): hysterese eerst — wie al bij een object
  // bezig is, blijft tot de drive echt is opgelost (anders flippert het doel).
  if (b.doel && b.doel.soort === "zelfzorg" && b.doel.stat && (b[b.doel.stat] ?? 100) < ZELFZORG_KLAAR) return;
  // Dan: pak de sterkste drive (laagste bar). Wélk object daartegen helpt, kiest
  // de Botty op basis van wat hij geleerd heeft (kiesObjectVoor) — niet vast.
  const drive = DRIVE_STATS.map(s => ({ s, v: b[s] ?? 100 })).sort((p, q) => p.v - q.v)[0];
  if (drive && drive.v < ZELFZORG_START) {
    const o = kiesObjectVoor(b, drive.s);
    b.doel = { soort: "zelfzorg", stat: drive.s, obj: o.id, px: o.x, py: o.y, tekst: o.doe, mislukt: 0 };
    return;
  }
  // Fertiliteit: te veel stress onderdrukt de voortplantingsdrang (Creatures p.16).
  if (rijp(b) && (b.stemming ?? 50) > 65 && stressVan(b) < 45 && Math.random() < 0.4) { b.doel = { soort: "voortplanting", tekst: "een kind krijgen" }; return; }
  if (mult(genoomBytes(b.genome), 11) > 1.05 && Math.random() < 0.45) {
    const an = ctx.anderen.filter(x => x !== b && !x.bezigEi);
    if (an.length) {
      let v: any;
      if (b.relaties) { // liefst naar de beste vriend
        const vriendBid = Object.keys(b.relaties).sort((p, q) => b.relaties[q] - b.relaties[p])[0];
        if (vriendBid) v = an.find(x => x.bid === vriendBid);
      }
      if (!v) v = kies(an);
      b.doel = { soort: "gezelschap", naar: v.naam, tekst: "bij " + v.naam + " zijn" }; return;
    }
  }
  // Nieuwsgierigheid (uit gen 14, expressie-bias): af en toe iets gaan onderzoeken
  // i.p.v. jagen — een zwevende Botty zweeft naar een punt van interesse om rond te kijken.
  if (mult(genoomBytes(b.genome), 14) > 1.0 && Math.random() < 0.3) {
    const poi = kies(POIS);
    b.doel = { soort: "nieuwsgierig", poi: poi.id, px: poi.x, py: poi.y, tekst: "kijken naar " + poi.tekst }; return;
  }
  b.doel = { soort: "priemjacht", tekst: "jagen op " + smaakVan(b).naam };
}

// ─── De Construct: ruimtelijke beweging ─────────────────────────────────────────
// Elke Botty heeft een positie in de arena en zet per actieve tick één stap naar
// een doelwit dat volgt uit zijn intentie (Laag 3). Zo wordt "agency" zichtbaar in
// de ruimte: gezelschap-zoekers lopen naar elkaar toe, vermoeiden naar de rustplek,
// jagers dwalen. Client-side wordt tussen ticks geïnterpoleerd voor vloeiend beeld.
function plekVan(b: any) {
  if (!b.pos || typeof b.pos.x !== "number" || typeof b.pos.y !== "number") {
    b.pos = { x: 40 + Math.random() * (WERELD_B - 80), y: 40 + Math.random() * (WERELD_H - 80) };
  }
  return b.pos;
}
function beweeg(bottys: any[]) {
  for (const b of bottys) {
    if (b.bezigEi) continue;
    const p = plekVan(b);
    let doelwit: { x: number; y: number } | null = null;
    const soort = b.doel?.soort;
    if (soort === "gezelschap" && b.doel.naar) {
      const vriend = bottys.find(x => x.naam === b.doel.naar && !x.bezigEi);
      if (vriend) doelwit = plekVan(vriend);
    } else if (soort === "voortplanting") {
      const ander = bottys.filter(x => x !== b && !x.bezigEi && rijp(x))
        .sort((u, v) => afstand2(p, plekVan(u)) - afstand2(p, plekVan(v)))[0];
      if (ander) doelwit = plekVan(ander);
    } else if (soort === "herstellen" || soort === "bijkomen" || soort === "slapen") {
      doelwit = RUSTPLEK;
    } else if ((soort === "nieuwsgierig" || soort === "zelfzorg") && typeof b.doel.px === "number") {
      doelwit = { x: b.doel.px, y: b.doel.py };
    }
    // priemjacht / geen doelwit → rustige dwaaltocht
    if (!doelwit) {
      const hoek = (b.richting ?? Math.random() * Math.PI * 2) + (Math.random() - 0.5) * 1.2;
      doelwit = { x: p.x + Math.cos(hoek) * WERELD_STAP * 2, y: p.y + Math.sin(hoek) * WERELD_STAP * 2 };
    }
    const dx = doelwit.x - p.x, dy = doelwit.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    // niet bovenop elkaar gaan staan bij gezelschap: stop op gezelschapsafstand
    const wens = (soort === "gezelschap" || soort === "voortplanting") ? Math.max(0, d - WERELD_NABIJ * 0.7) : d;
    const stap = Math.min(WERELD_STAP, wens) + (Math.random() - 0.5) * 6;
    b.richting = Math.atan2(dy, dx);
    p.x = Math.max(12, Math.min(WERELD_B - 12, p.x + (dx / d) * stap));
    p.y = Math.max(12, Math.min(WERELD_H - 12, p.y + (dy / d) * stap));
  }
}
function afstand2(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy;
}

// ─── Zelfzorg: een object gebruiken ─────────────────────────────────────────────
// Wie met een zelfzorg-doel dicht genoeg bij zijn object is, vult de bijbehorende
// bar aan (drive-reductie). Draait óók in catch-up-ticks (positie verandert daar
// niet, dus wie bij zijn object staat, blijft rustig doorladen) — zo werkt
// zelfregulatie ook onder de cron als er niemand kijkt.
const ZELFZORG_TEMPO = 7;   // punten per tick; AI-zorg (14-18 per beurt) blijft sneller
function zelfzorgRonde(bottys: any[], events: object[] | null) {
  let gemeld = false;
  for (const b of bottys) {
    if (b.bezigEi || !b.pos || !b.doel || b.doel.soort !== "zelfzorg") continue;
    const obj = OBJECTEN.find(o => o.id === b.doel.obj);
    if (!obj || afstand2(b.pos, obj) > GEBRUIK_AFSTAND * GEBRUIK_AFSTAND) continue;
    const G = exprGenoom(b.genome);
    const factor = (G.zorg as any)[obj.stat] ?? 1;
    const drive = b.doel.stat as string;
    const voor = b[drive] ?? 50;
    // Werkelijk effect: het object verhoogt ZIJN eigen stat — dat kan een andere
    // zijn dan de drive die de Botty dácht op te lossen. Dat verschil is de les.
    b[obj.stat] = klem((b[obj.stat] ?? 50) + ZELFZORG_TEMPO * factor);
    const na = b[drive] ?? voor;

    // Leren kan alleen als de drive nog kón stijgen (anders leert een volle bar niets).
    const kanStijgen = voor < 99;
    const beloond = na > voor + 0.01;
    if (kanStijgen) {
      breinLeer(b, drive, obj.id, beloond);
      b.stemming = klem((b.stemming ?? 50) + (beloond ? 1.5 : 0.2));
      if (beloond) {
        b.doel.mislukt = 0;
        b.chem = b.chem || {}; b.chem.endorfine = Math.min(100, (b.chem.endorfine || 0) + 8); // zelf iets oplossen geeft een endorfine-zetje
        // Taal: munt een woord voor dit object als je er nog geen hebt.
        b.lexicon = b.lexicon || {};
        if (!b.lexicon[obj.id]) {
          b.lexicon[obj.id] = muntWoord();
          if (events && Math.random() < 0.5) events.push({ soort: "taal", naam: b.naam,
            tekst: "🗣️ <b>" + b.naam + "</b> munt een woord voor " + obj.kort + ": “" + b.lexicon[obj.id] + "”" });
        }
        if (!b.zelfzorgGeleerd || !b.zelfzorgGeleerd[obj.id]) {
          b.zelfzorgGeleerd = b.zelfzorgGeleerd || {};
          b.zelfzorgGeleerd[obj.id] = true;
          onthoud(b, "zelfzorg", "ik ontdekte dat " + obj.leer);
        }
      } else {
        b.doel.mislukt = (b.doel.mislukt || 0) + 1;
        if (b.doel.mislukt >= BREIN_OPGEVEN) {
          onthoud(b, "leren", "ik leerde dat " + obj.kort + " niet helpt tegen " + (DRIVE_LABEL[drive] || drive));
          if (events && !gemeld && Math.random() < 0.5) {
            events.push({ soort: "zelfzorg", naam: b.naam, label: "🤔", kleur: "#c9a86a", animeer: false,
              tekst: "🤔 <b>" + b.naam + "</b> merkt dat " + obj.kort + " niet helpt tegen " + (DRIVE_LABEL[drive] || drive) });
            gemeld = true;
          }
          b.doel = null;   // iets anders proberen bij de volgende keuze
          continue;
        }
      }
    } else {
      b.stemming = klem((b.stemming ?? 50) + 1);
    }

    if (events && !gemeld && beloond && Math.random() < 0.3) {
      events.push({ soort: "zelfzorg", naam: b.naam, label: obj.icoon, kleur: "#5ec6ff", animeer: true,
        tekst: obj.icoon + " <b>" + b.naam + "</b> " + obj.actie });
      gemeld = true;
    }
  }
}

// ─── Laag 4 — besef van anderen (theory of mind) ────────────────────────────────
// Op nabijheid (de Construct): een Botty merkt buren op, voelt met ze mee
// (emotionele besmetting), bouwt vriendschappen op (affiniteit) en troost wie het
// zwaar heeft. Empathie komt uit gen 11 (sociaal): 0 (afstandelijk) .. 0.5 (warm).
const ZICHT = 160;                       // perceptie-straal in de arena
function empathie(b: any): number { return Math.max(0, mult(genoomBytes(b.genome), 11) - 1); }

function socialeRonde(bottys: any[], events: object[]) {
  const actief = bottys.filter(b => !b.bezigEi && b.pos && !slaapt(b));
  // Affiniteit zakt langzaam weg (vriendschap moet onderhouden worden).
  for (const b of actief) {
    if (b.relaties) for (const k in b.relaties) { b.relaties[k] *= 0.98; if (b.relaties[k] < 0.5) delete b.relaties[k]; }
  }
  // Per Botty: buren waarnemen → emotionele besmetting + affiniteit + taal.
  let praatGedaan = false;
  for (const b of actief) {
    const emp = empathie(b);
    let som = 0, n = 0;
    for (const c of actief) {
      if (c === b || afstand2(b.pos, c.pos) > ZICHT * ZICHT) continue;
      n++; som += (c.stemming ?? 50);
      b.relaties = b.relaties || {};
      b.relaties[c.bid] = Math.min(100, (b.relaties[c.bid] || 0) + 1); // samen zijn schept band
      // Taal: af en toe zegt b een woord tegen buur c, die het overneemt.
      if (Math.random() < 0.25) {
        const p = praat(b, c);
        if (p && !praatGedaan && Math.random() < 0.4) {
          events.push({ soort: "taal", naamA: b.naam, naamB: c.naam,
            tekst: "🗨️ <b>" + b.naam + "</b> zegt “" + p.woord + "” (" + (CONCEPT_LABEL[p.concept] || p.concept) + ") tegen <b>" + c.naam + "</b>" });
          praatGedaan = true;
        }
      }
    }
    if (n) {
      const gem = som / n;                                  // schuif licht naar de buur-stemming
      b.stemming = klem((b.stemming ?? 50) + (gem - (b.stemming ?? 50)) * 0.2 * emp);
    }
  }
  // Troosten: één empathische Botty helpt een verdrietige/zieke buur (max 1 event/tick).
  let getroost = false;
  for (const b of actief) {
    if (empathie(b) < 0.15) continue;
    const hulp = actief.find(c => c !== b && afstand2(b.pos, c.pos) < ZICHT * ZICHT && ((c.stemming ?? 50) < 35 || c.ziek));
    if (!hulp) continue;
    hulp.stemming = klem((hulp.stemming ?? 50) + 10);
    b.relaties = b.relaties || {}; hulp.relaties = hulp.relaties || {};
    b.relaties[hulp.bid] = Math.min(100, (b.relaties[hulp.bid] || 0) + 5);
    hulp.relaties[b.bid] = Math.min(100, (hulp.relaties[b.bid] || 0) + 5);
    onthoud(hulp, "troost", "ik werd getroost door " + b.naam);
    if (!getroost) { events.push({ soort: "troost", naamA: b.naam, naamB: hulp.naam, tekst: "💞 <b>" + b.naam + "</b> troost <b>" + hulp.naam + "</b>" }); getroost = true; }
  }
}

// ─── Botty aanmaken ───────────────────────────────────────────────────────────
const NAMEN = ["Pixel", "Nova", "Spark", "Byte", "Echo", "Flux", "Arc", "Volt", "Glow", "Iris", "Zap", "Core"];
const PALETTEN = [
  { naam: "smaragd",  accent: "#2ecc71", oogje: "#145a32", scherm: "#1e8449", schermRand: "#145a32", broek: "#117a65", broekRand: "#0e6655" },
  { naam: "saffier",  accent: "#3498db", oogje: "#1a5276", scherm: "#2471a3", schermRand: "#1a5276", broek: "#1f618d", broekRand: "#1a5276" },
  { naam: "robijn",   accent: "#e74c3c", oogje: "#78281f", scherm: "#cb4335", schermRand: "#78281f", broek: "#922b21", broekRand: "#78281f" },
  { naam: "amber",    accent: "#f39c12", oogje: "#784212", scherm: "#d68910", schermRand: "#784212", broek: "#9a7d0a", broekRand: "#784212" },
  { naam: "amethist", accent: "#9b59b6", oogje: "#4a235a", scherm: "#884ea0", schermRand: "#4a235a", broek: "#6c3483", broekRand: "#4a235a" },
  { naam: "koraal",   accent: "#e67e22", oogje: "#784212", scherm: "#ca6f1e", schermRand: "#784212", broek: "#935116", broekRand: "#784212" },
];
const MUTATIES = ["zonnepaneel", "wifi", "antenne2", "oog3", "quantum"];

function maakBotty(naam: string, palet: any, generatie = 1, extra: any = {}) {
  const genome = extra.genome ?? genoomGenereer(25);
  const G = exprGenoom(genome);
  const sekse = extra.sekse === "m" || extra.sekse === "v" ? extra.sekse : (Math.random() < 0.5 ? "m" : "v");
  const grootte = sekseGrootte(G.grootte, sekse);   // dimorfisme in de opgeslagen grootte
  const base = {
    naam, kleur: { ...palet }, paletNaam: palet.naam,
    energie: 70 + Math.random() * 20,
    data:    60 + Math.random() * 25,
    fit:     65 + Math.random() * 20,
    geluk:   60 + Math.random() * 25,
    datakwaliteit: 40 + Math.random() * 30,
    efficientie:   40 + Math.random() * 30,
    stemming: 40 + Math.random() * 25,
    stage: "baby", geboren: Date.now(),
    generatie, ziek: false, mutaties: [], bezigEi: false,
    genome,
    sekse, dimorf: true,
    grootte,
    bid: extra.bid ?? maakId(),
  };
  return { ...base, ...extra, genome, sekse, dimorf: true, grootte, bid: base.bid };
}

function maakKind(ouderA: any, ouderB: any, namen: string[]) {
  const bezet = new Set(namen);
  const kandidaten = NAMEN.filter(n => !bezet.has(n));
  const naam = kandidaten[Math.floor(Math.random() * kandidaten.length)] || "Kind";

  // Genoom kruisen + muteren — hart van de evolutie
  const kruis = genoomKruis(ouderA.genome, ouderB.genome);
  const mutatie = genoomMuteer(kruis.genoom);
  const kindGenoom = mutatie.genoom;
  const erfenis = { vanA: kruis.vanA, vanB: kruis.vanB, mutaties: mutatie.aantalMutaties };
  const G = exprGenoom(kindGenoom);

  // Kleur: basis van één ouder, dan genoom-tint → kleuren driften over generaties
  const basisPalet = Math.random() < 0.5 ? ouderA.kleur : ouderB.kleur;
  const kleur = tintPalet({ ...basisPalet }, G.kleurTint);

  const dk  = klem(Math.max(ouderA.datakwaliteit ?? 50, ouderB.datakwaliteit ?? 50) + (Math.random() * 10 - 2));
  const ef  = klem(Math.max(ouderA.efficientie   ?? 50, ouderB.efficientie   ?? 50) + (Math.random() * 10 - 2));
  const gen = Math.max(ouderA.generatie ?? 1, ouderB.generatie ?? 1) + 1;

  // Mutaties: unie van ouders, elk met 60% kans doorgegeven + 12% kans op nieuwe
  const ouderMuts = [...new Set([...(ouderA.mutaties || []), ...(ouderB.mutaties || [])])];
  const mutaties  = ouderMuts.filter(() => Math.random() < 0.6);
  if (Math.random() < 0.12) {
    const nieuw = MUTATIES.filter(m => !mutaties.includes(m));
    if (nieuw.length) mutaties.push(nieuw[Math.floor(Math.random() * nieuw.length)]);
  }

  const kindStemming = klem(((ouderA.stemming ?? 50) + (ouderB.stemming ?? 50)) / 2 + (Math.random() * 20 - 10));

  // Erfelijke gewoontes: het kind erft het gemengde brein van beide ouders.
  const { brein, breinN } = erfBrein(ouderA, ouderB);

  // Erfelijke leer-versnelling (toekomst-lijn van Chroom): het kind erft de bonus
  // van de ouders, iets afgezwakt zodat hij over generaties vervaagt maar merkbaar
  // blijft. Kinderen van de toekomst-Botty leren dus sneller.
  const ouderBonus = ((ouderA.leerBonus ?? 1) + (ouderB.leerBonus ?? 1)) / 2;
  const leerBonus = +(1 + (ouderBonus - 1) * 0.9).toFixed(3);

  return maakBotty(naam, { ...kleur, naam: kleur.naam || "mix" }, gen, {
    datakwaliteit: dk, efficientie: ef, mutaties,
    stemming: kindStemming,
    genome: kindGenoom,
    grootte: G.grootte,
    erfenis,
    brein, breinN,
    ...(leerBonus > 1.01 ? { leerBonus } : {}),
  });
}

function kiesNaam(namen: string[]): string {
  const bezet = new Set(namen);
  const vrij = NAMEN.filter(n => !bezet.has(n));
  return vrij[Math.floor(Math.random() * vrij.length)] || "Kind";
}

// Genetische afstand tussen twee genomen (Manhattan over 16 genen, 0..4080).
function genoomAfstand(a: string | undefined, b: string | undefined): number {
  const x = genoomBytes(a), y = genoomBytes(b);
  let d = 0;
  for (let i = 0; i < GENOOM_LEN; i++) d += Math.abs(x[i] - y[i]);
  return d;
}

// Gemiddelde paarsgewijze genetische afstand in de populatie = diversiteit.
function popDiversiteit(bs: any[]): number {
  if (!bs || bs.length < 2) return 9999;
  let s = 0, c = 0;
  for (let i = 0; i < bs.length; i++)
    for (let j = i + 1; j < bs.length; j++) { s += genoomAfstand(bs[i].genome, bs[j].genome); c++; }
  return c ? s / c : 9999;
}

// Verse mutant ("immigrant") — nieuw bloed bij dreigende inteelt.
function maakImmigrant(namen: string[], gen: number) {
  const palet = PALETTEN[Math.floor(Math.random() * PALETTEN.length)];
  return maakBotty(kiesNaam(namen), palet, gen, {
    genome: genoomGenereer(70),   // hoge variantie = fris DNA
    erfenis: { vanA: 0, vanB: 0, mutaties: 0 },
    immigrant: true,
  });
}

function maakNieuweHive() {
  const bottys = [];
  for (let i = 0; i < 9; i++) {
    bottys.push(maakBotty(NAMEN[i], PALETTEN[i % PALETTEN.length]));
  }
  return { id: "main", bottys, first_opened: Date.now(), acties: 0, last_updated_at: Date.now() };
}

// ─── Broadcast ────────────────────────────────────────────────────────────────
async function broadcast(payload: object) {
  try {
    await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ messages: [{ topic: "realtime:hive-events", event: "actie", payload }] }),
    });
  } catch (_) { /* best-effort */ }
}

// ─── Hoofdlus ─────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // Bezoekersverzoek (optioneel): { actie: "broed", ei: "<id>" } broedt een rijp ei uit
  let vraag: any = null;
  try { vraag = await req.json(); } catch (_) { /* geen body = gewone tick */ }

  const { data: row, error } = await supabase.from("hive_state").select("*").eq("id", "main").single();
  let state = (error || !row) ? maakNieuweHive() : row;
  let bottys: any[] = state.bottys || [];
  const eieren: any[] = Array.isArray(state.eieren) ? state.eieren : [];

  // Backfill: bestaande Bottys zonder genoom krijgen een baseline (gedrag ongewijzigd)
  const baseline = bytesNaarGenoom(new Uint8Array(GENOOM_LEN).fill(128));
  bottys.forEach(b => {
    if (!b.genome || typeof b.genome !== "string") b.genome = baseline;
    if (typeof b.grootte !== "number") b.grootte = exprGenoom(b.genome).grootte;
    if (!b.bid) b.bid = maakId();   // stabiele identiteit voor de stamboom
    if (b.sekse !== "m" && b.sekse !== "v") b.sekse = hashSekse(b.bid);   // §3.4: geslacht
    if (!b.dimorf) { b.grootte = sekseGrootte(exprGenoom(b.genome).grootte, b.sekse); b.dimorf = true; }   // dimorfisme één keer toepassen
    if (typeof b.iq !== "number") b.iq = 100;   // IQ-spel: iedereen start op 100
    if (typeof b.levenskracht !== "number") b.levenskracht = 100;   // sterfelijkheid
    if (!b.groei) b.groei = { piekIQ: b.iq ?? 100, kinderen: 0 };   // levenslange groei-teller
    plekVan(b);   // De Construct: geef elke Botty een startpositie in de arena
  });

  const nu = Date.now();
  NACHT = isNacht(nu);   // dag/nacht op Nederlandse kloktijd
  const gemist = Math.min(Math.floor((nu - (state.last_updated_at || nu)) / INTERVAL), MAX_CATCHUP_TICKS);
  const vervalTicks = Math.floor(gemist * INTERVAL / VERVAL_INTERVAL);

  const cutoff = new Date(nu - 30000).toISOString();
  const { count: bezoekersCount } = await supabase
    .from("bezoeker_pings").select("*", { count: "exact", head: true }).gte("ts", cutoff);
  const bezoekers = bezoekersCount ?? 0;
  // Opruimen van oude pings is niet elke browser-tick nodig. Bij een drukke
  // tab is gemist klein (1–3); de cron (1×/min) en eerste loads geven een grote
  // gemist → daar ruimen we op. Scheelt ~40× minder DELETE's per minuut.
  if (gemist >= 20) {
    await supabase.from("bezoeker_pings").delete().lt("ts", new Date(nu - 120000).toISOString());
  }

  let acties: number = state.acties ?? 0;
  const events: object[] = [];
  let lastKweek: any = null;

  // Catch-up ticks
  for (let t = 0; t < gemist - 1; t++) {
    // Zelfregulatie loopt door: wie bij zijn object staat, blijft rustig laden.
    try { zelfzorgRonde(bottys, null); } catch (_) { /* niet kritisch */ }
    try { bottys.forEach(b => { if (!b.bezigEi) biochemie(b, bottys); }); } catch (_) { /* chemie mag de tick nooit breken */ }
    if (!NACHT) kiesDoelen(bottys, ZORG_PER_TICK).forEach(b => { zorg(b); acties++; });   // 's nachts rust ook de AI-verzorger
    if (t % Math.round(VERVAL_INTERVAL / INTERVAL) === 0) {
      bottys.forEach(b => { if (!b.bezigEi) vervalEen(b); });
    }
    bottys.forEach(b => {
      const s = huidigeStage(b); if (s !== b.stage) b.stage = s;
      updateStemming(b, bezoekers);
      updateLevenskracht(b);
      updateGroei(b);
    });
  }

  if (gemist >= 1) {
    // Actieve tick — eerst vormt elke Botty zijn eigen doel (Laag 3), zodat de
    // zorg/keuzes hieronder ernaar kunnen luisteren.
    bottys.forEach(b => { if (!b.bezigEi) kiesDoel(b, { anderen: bottys }); });

    // De Construct: ruimtelijke beweging + sociale ronde (Laag 4). Best-effort:
    // mag de tick nooit breken.
    try {
      beweeg(bottys);
      zelfzorgRonde(bottys, events);
      socialeRonde(bottys, events);
      bottys.forEach(b => { if (!b.bezigEi) biochemie(b, bottys); });
    } catch (_) { /* beweging/zelfzorg/sociaal/chemie is niet kritisch voor de hive */ }

    const doelen = NACHT ? [] : kiesDoelen(bottys, ZORG_PER_TICK);   // 's nachts rust ook de AI-verzorger
    doelen.forEach((b, i) => {
      if (b.bezigEi) return;
      acties++;
      const d = zorg(b);
      if (i === 0) events.push({ soort: "zorg", naam: b.naam, ...d });
      else         events.push({ soort: "zorg", naam: b.naam, label: d.label, kleur: d.kleur, animeer: d.animeer });
    });

    for (let t = 0; t < vervalTicks; t++) {
      bottys.forEach(b => { if (!b.bezigEi) vervalEen(b); });
    }
    bottys.forEach(b => {
      const s = huidigeStage(b); if (s !== b.stage) b.stage = s;
      updateStemming(b, bezoekers);
      updateLevenskracht(b);
      updateGroei(b);
    });

    // IQ-ronde: elke Botty zoekt een nog niet ontdekte priem (gedeelde collectie).
    // PostgREST levert max. 1000 rijen per request, dus pagineren we — anders is de
    // dedup-set incompleet zodra er >1000 priemen zijn (→ priemen "herontdekken").
    // De dedup hoeft alleen het huidige zoekbereik te dekken (kandidaten vallen daar).
    const ontdekt = new Set<number>();
    try {
      for (let from = 0; ; from += 1000) {
        const { data, error: e } = await supabase
          .from("priemvondsten").select("getal")
          .gte("getal", PRIEM_LO).lt("getal", PRIEM_HI)
          .order("getal", { ascending: true }).range(from, from + 999);
        if (e || !data || !data.length) break;
        for (const r of data) ontdekt.add((r as any).getal);
        if (data.length < 1000) break;
      }
    } catch (_) { /* zonder collectie kan iedereen alsnog ontdekken */ }

    const alleDenkers = bottys.filter(b => !b.bezigEi && !(NACHT && slaapt(b)));   // slapers jagen niet
    // Afkoelperiode: wie net een euforie had, jaagt even niet echt — hij broedt
    // op zijn volgende zet. Alleen afgekoelde Bottys doen de vind-ronde mee.
    const denkers  = alleDenkers.filter(b => nu - (b.euforieOp || 0) >= EUFORIE_PAUZE);
    const broeders = alleDenkers.filter(b => nu - (b.euforieOp || 0) <  EUFORIE_PAUZE);
    // Wiskunde-ervaring eenmalig seeden uit de volledige vondsten-historie per bid
    // (alle priemen ooit, ook <10000). Alleen ophalen als er iets te seeden valt.
    if (alleDenkers.some(b => typeof b.vondsten !== "number")) {
      const vondstenPerBid: Record<string, number> = {};
      try {
        for (let from = 0; ; from += 1000) {
          const { data, error: e } = await supabase
            .from("priemvondsten").select("ontdekker_bid")
            .order("getal", { ascending: true }).range(from, from + 999);
          if (e || !data || !data.length) break;
          for (const r of data) { const bid = (r as any).ontdekker_bid; if (bid) vondstenPerBid[bid] = (vondstenPerBid[bid] || 0) + 1; }
          if (data.length < 1000) break;
        }
      } catch (_) { /* geen historie → iedereen begint als novice */ }
      alleDenkers.forEach(b => { if (typeof b.vondsten !== "number") b.vondsten = vondstenPerBid[b.bid] || 0; });
    }
    const resultaten = denkers.map(b => ({ b, r: denkPriem(b, ontdekt) }));
    // 🎉 Euforie: een verse priem voelt geweldig — alle bars (en de stemming)
    // schieten naar 100%. Die kick is mede waaróm de Bottys zo graag priemen jagen.
    // De vind-ronde is al gefilterd op afgekoelde Bottys, dus elke verse vondst
    // is per definitie een nieuwe kick (en start een nieuwe afkoelperiode).
    const euforisch = new Set<string>();
    const vondstMap: Record<string, number[]> = {};
    resultaten.forEach(x => {
      if (x.r.uitkomst !== "nieuw") return;
      x.b.euforieOp = nu;
      euforisch.add(x.b.bid);
      x.b.energie = 100; x.b.data = 100; x.b.fit = 100; x.b.geluk = 100;
      x.b.stemming = 100;
      x.b.chem = x.b.chem || {}; x.b.chem.endorfine = 100;   // de kick als endorfine-piek
      vondstMap[x.b.bid] = x.r.getallen;
      // Episodisch geheugen: eerste priem ooit + het halen van een nieuw wiskunde-niveau.
      const voor = (x.b.vondsten ?? x.r.getallen.length) - x.r.getallen.length;
      if (voor === 0) onthoud(x.b, "eerste-priem", "ik vond mijn eerste priemgetal (" + x.r.getallen[0] + ")");
      const na = wiskundeNiveau(x.b.vondsten ?? 0);
      if (x.r.niveau < na) onthoud(x.b, "wiskunde", "ik leerde een nieuwe rekenregel (niveau " + na + ")");
    });
    const nieuweVondsten = resultaten
      .filter(x => x.r.uitkomst === "nieuw")
      .flatMap(x => x.r.getallen.map(g => ({ getal: g, ontdekker_naam: x.b.naam, ontdekker_bid: x.b.bid, generatie: x.b.generatie })));
    if (nieuweVondsten.length) {
      try {
        await supabase.from("priemvondsten").upsert(nieuweVondsten, { onConflict: "getal", ignoreDuplicates: true });
      } catch (_) { /* collectie is niet kritisch voor de tick */ }
    }
    if (resultaten.length) {
      // Toon liefst een verse ontdekking, anders een willekeurig resultaat.
      const pick = resultaten.find(x => x.r.uitkomst === "nieuw")
        || resultaten[Math.floor(Math.random() * resultaten.length)];
      const r = pick.r;
      const aantal = r.getallen ? r.getallen.length : 0;
      const tekst = r.uitkomst === "nieuw"
        ? "🧠 <b>" + pick.b.naam + "</b> " + (aantal > 1
            ? "vond " + aantal + " priemen (" + r.getallen.join(", ") + ")"
            : "koos priemgetal " + r.getal)
          + " — specialist in " + r.smaak + " · 📐 wiskunde-niveau " + r.niveau + " (+" + aantal + ", IQ " + r.iq + ")"
          + (euforisch.has(pick.b.bid) ? " 🎉 bars op 100%!" : "")
        : r.uitkomst === "leeg"
          ? "🧠 <b>" + pick.b.naam + "</b> vond niets nieuws — bijna alle priemen tussen " + PRIEM_LO + " en " + PRIEM_HI + " zijn al ontdekt"
          : "🧠 <b>" + pick.b.naam + "</b> gokte " + r.getal + " — niet priem (−2, IQ " + r.iq + ")";
      events.push({ soort: "denk", naam: pick.b.naam, getal: r.getal, uitkomst: r.uitkomst, iq: r.iq, smaak: r.smaak, niveau: r.niveau, tekst });
    } else if (broeders.length && Math.random() < 0.25) {
      // Iedereen koelt af: af en toe laten zien dat er gebroed wordt op strategie.
      const b = kies(broeders);
      const rest = Math.max(1, Math.ceil((EUFORIE_PAUZE - (nu - (b.euforieOp || 0))) / 60000));
      events.push({ soort: "denk", naam: b.naam, uitkomst: "broeden",
        tekst: "🧘 <b>" + b.naam + "</b> geniet na van zijn vondst en broedt op een nieuwe strategie (~" + rest + " min)" });
    }

    // Kennisuitwisseling
    if (Math.random() < 0.125 && bottys.length >= 2) {
      const vrij = bottys.filter(x => !x.bezigEi);
      let a: any, b: any;
      // Agency: een gezelschap-zoeker krijgt zijn wens — ontmoet wie hij wilde zien.
      const zoekers = vrij.filter(x => x.doel && x.doel.soort === "gezelschap");
      if (zoekers.length && Math.random() < 0.6) {
        a = kies(zoekers);
        b = vrij.find(x => x.naam === a.doel.naar) || kies(vrij.filter(x => x !== a));
      } else {
        a = kies(vrij); b = kies(vrij.filter(x => x !== a));
      }
      if (a && b && a !== b && !a.bezigEi && !b.bezigEi) {
        a.geluk = klem(a.geluk + 12); b.geluk = klem(b.geluk + 12);
        a.stemming = klem((a.stemming ?? 50) + 8);
        b.stemming = klem((b.stemming ?? 50) + 8);
        const leraar   = a.data >= b.data ? a : b;
        const leerling = leraar === a ? b : a;
        const bonus = 10 + (heeft(leerling, "wifi") || heeft(leerling, "antenne2") ? 6 : 0);
        leerling.data = klem(leerling.data + bonus);
        events.push({ soort: "bezoek", naamA: a.naam, naamB: b.naam,
          tekst: "🔗 <b>" + a.naam + "</b> en <b>" + b.naam + "</b> wisselen kennis uit" });
      }
    }

    // Voortplanting — genomen kruisen hier. Geboortekans stijgt als de populatie
    // krimpt (door sterfte), zodat de hive zichzelf naar het streefgetal herstelt.
    const popLevend = bottys.filter((b: any) => !b.bezigEi).length;
    const kweekKans = popLevend <= 5 ? 0.16 : popLevend < DOEL_POP ? 0.09 : popLevend < MAX_POP ? 0.05 : 0.025;
    if (!NACHT && Math.random() < kweekKans) {   // 's nachts wordt er niet gekweekt
      const kandidaten = bottys.filter(rijp);
      if (kandidaten.length >= 2) {
        // Slimme partnerkeuze: kies het paar dat fit, genetisch divers én slim is.
        // Score = fitness + gewicht × genetische afstand + gewicht × gezamenlijk IQ.
        let beste: any = null;
        for (let i = 0; i < kandidaten.length; i++)
          for (let j = i + 1; j < kandidaten.length; j++) {
            const a = kandidaten[i], b2 = kandidaten[j];
            const wil = (a.doel?.soort === "voortplanting" ? 1 : 0) + (b2.doel?.soort === "voortplanting" ? 1 : 0);
            const score = geneScore(a) + geneScore(b2)
              + PARTNER_DIVERSITEIT_GEWICHT * genoomAfstand(a.genome, b2.genome)
              + PARTNER_IQ_GEWICHT * ((a.iq ?? 100) + (b2.iq ?? 100))
              + PARTNER_WIL_GEWICHT * wil
              + PARTNER_SEKSE_GEWICHT * (a.sekse && b2.sekse && a.sekse !== b2.sekse ? 1 : 0)   // ♂×♀ voorkeur
              - PARTNER_STRESS_GEWICHT * (stressVan(a) + stressVan(b2));   // stress verlaagt fertiliteit
            if (!beste || score > beste.score) beste = { a, b: b2, score };
          }
        const ouderA = geneScore(beste.a) <= geneScore(beste.b) ? beste.a : beste.b;
        const ouderB = ouderA === beste.a ? beste.b : beste.a;
        const idx = bottys.indexOf(ouderA);   // alleen gebruikt als een immigrant plaats inneemt
        const popDiv = popDiversiteit(bottys);

        let kind: any, verwantschap = 0, inteeltStraf = 0, immigrant = false;

        if (popDiv < DIVERSITEIT_DREMPEL) {
          // Diversiteits-alarm: vers bloed i.p.v. nóg een inteelt-kind
          const gen = Math.max(ouderA.generatie ?? 1, ouderB.generatie ?? 1) + 1;
          kind = maakImmigrant(bottys.map((b: any) => b.naam), gen);
          immigrant = true;
          onthoud(kind, "aankomst", "ik arriveerde als verse mutant");
          events.push({ soort: "immigrant", naamKind: kind.naam,
            tekst: "🌱 <b>" + kind.naam + "</b> arriveert als verse mutant — de genenpoel werd te eenvormig (diversiteit " + Math.round(popDiv) + ")" });
        } else if (eieren.length < MAX_EIEREN) {
          kind = maakKind(ouderA, ouderB, bottys.map((b: any) => b.naam));
          // Inteelt-depressie: hoe kleiner de genetische afstand, hoe zwakker het kind
          const dist = genoomAfstand(ouderA.genome, ouderB.genome);
          verwantschap = Math.max(0, (INTEELT_DREMPEL - dist) / INTEELT_DREMPEL); // 0..1
          if (verwantschap > 0) {
            inteeltStraf = verwantschap * INTEELT_MAX_STRAF;
            kind.datakwaliteit = klem((kind.datakwaliteit ?? 50) - inteeltStraf);
            kind.efficientie   = klem((kind.efficientie   ?? 50) - inteeltStraf);
            if (Math.random() < verwantschap * 0.6) kind.ziek = true;
          }
          onthoud(kind, "geboorte", "ik werd geboren als kind van " + ouderA.naam + " en " + ouderB.naam);
          onthoud(ouderB, "kind", "ik kreeg een kind: " + kind.naam);
          // Groei: beide ouders krijgen een kind op hun naam.
          for (const ouder of [ouderA, ouderB]) { ouder.groei = ouder.groei || { piekIQ: ouder.iq ?? 100, kinderen: 0 }; ouder.groei.kinderen = (ouder.groei.kinderen || 0) + 1; }
          events.push({ soort: "kweek-start", naamA: ouderA.naam, naamB: ouderB.naam,
            tekst: "💞 De AI koppelt <b>" + ouderA.naam + "</b> en <b>" + ouderB.naam + "</b> — beste genen" });
        } else {
          kind = null;   // broedmachine vol — geen kweek deze tick
        }

        if (kind && immigrant) {
          // Immigranten arriveren direct (vers bloed wacht niet in een ei)
          const verwR = 0;
          lastKweek = {
            ouderA: null, ouderB: null,
            kind: kind.naam, generatie: kind.generatie,
            genome: kind.genome, grootte: kind.grootte, erfenis: kind.erfenis,
            verwantschap: verwR, immigrant,
          };
          try {
            await supabase.from("geboorten").insert({
              kind_id: kind.bid, kind_naam: kind.naam, generatie: kind.generatie,
              oudera_id: null, oudera_naam: null, ouderb_id: null, ouderb_naam: null,
              genome: kind.genome, grootte: kind.grootte,
              van_a: kind.erfenis?.vanA ?? null, van_b: kind.erfenis?.vanB ?? null,
              mutaties: kind.erfenis?.mutaties ?? null,
              verwantschap: verwR, immigrant,
            });
          } catch (_) { /* stamboom is niet kritisch */ }
          if (bottys.length < MAX_POP) bottys.push(kind);
          else if (idx >= 0) bottys[idx] = kind;
          events.push({ soort: "geboren", naamKind: kind.naam, generatie: kind.generatie,
            genome: kind.genome, grootte: kind.grootte, immigrant: true,
            tekst: "🐣 <b>" + kind.naam + "</b> (verse mutant) is geboren — generatie " + kind.generatie });
        } else if (kind) {
          // Broedmachine: het paar legt een ei; een bezoeker (of de tijd) broedt het uit
          const verwR = Math.round(verwantschap * 100) / 100;
          eieren.push({
            id: maakId(), kind,
            ouderA: ouderA.naam, ouderB: ouderB.naam,
            ouderA_bid: ouderA.bid, ouderB_bid: ouderB.bid,
            verwantschap: verwR, inteeltStraf: Math.round(inteeltStraf),
            gelegd: nu, rijpOp: nu + BROEDTIJD_MS,
          });
          events.push({ soort: "ei-gelegd", naamA: ouderA.naam, naamB: ouderB.naam,
            tekst: "🥚 <b>" + ouderA.naam + "</b> en <b>" + ouderB.naam + "</b> leggen een ei in de broedmachine — wie broedt het uit?" });
        }
      }
    }

    // Sterfelijkheid: wie geen levenskracht meer heeft, sterft — maar de hive zakt
    // nooit onder de zachte vloer (de laatste paar leven op tot een geboorte volgt).
    // Elk sterven laat een grafschrift na in de `levens`-tabel (blijvend spoor).
    const grafschriften: any[] = [];
    try {
      for (const dode of bottys.filter(isDood)) {
        if (bottys.length <= MIN_POP) { dode.levenskracht = Math.max(dode.levenskracht ?? 0, 8); continue; }
        const i = bottys.indexOf(dode);
        if (i < 0) continue;
        bottys.splice(i, 1);
        const leeftijdSec = Math.round((nu - (dode.geboren ?? nu)) / 1000);
        const oorzaak = senescence(dode) >= 1 ? "ouderdom" : dode.ziek ? "ziekte" : "uitputting";
        const g = dode.groei || {};
        const piekIQ = Math.round(g.piekIQ ?? dode.iq ?? 100);
        const kinderen = g.kinderen ?? 0;
        const woorden = dode.lexicon ? Object.keys(dode.lexicon).length : 0;
        grafschriften.push({
          bid: dode.bid ?? null, naam: dode.naam, generatie: dode.generatie ?? 1,
          geboren: dode.geboren ? new Date(dode.geboren).toISOString() : null,
          gestorven: new Date(nu).toISOString(), leeftijd_sec: leeftijdSec, oorzaak,
          piek_iq: piekIQ, vondsten: dode.vondsten ?? 0, kinderen, woorden,
          vrienden: dode.relaties ? Object.keys(dode.relaties).length : 0,
          niveau: wiskundeNiveau(dode.vondsten ?? 0), genome: dode.genome ?? null,
        });
        const naliet = [
          piekIQ > 100 ? "piek-IQ " + piekIQ : null,
          (dode.vondsten ?? 0) > 0 ? (dode.vondsten + " priemen") : null,
          kinderen > 0 ? (kinderen + " kind" + (kinderen !== 1 ? "eren" : "")) : null,
          woorden > 0 ? (woorden + " woord" + (woorden !== 1 ? "en" : "")) : null,
        ].filter(Boolean).join(", ");
        events.push({ soort: "gestorven", naam: dode.naam, generatie: dode.generatie ?? 1,
          tekst: "🕯️ <b>" + dode.naam + "</b> is niet meer — generatie " + (dode.generatie ?? 1)
            + " · leefde " + Math.round(leeftijdSec / 60) + " min · " + oorzaak
            + (naliet ? " · liet na: " + naliet : "") });
      }
    } catch (_) { /* sterfte mag de tick nooit breken */ }
    if (grafschriften.length) {
      try { await supabase.from("levens").insert(grafschriften); } catch (_) { /* grafschrift is niet kritisch */ }
    }

    // Bewustzijn: elke Botty vormt een innerlijke gedachte op basis van zijn staat,
    // zijn vondst van deze tick, zijn relaties en zijn herinneringen.
    bottys.forEach(b => { if (!b.bezigEi && !(NACHT && slaapt(b))) denkBewust(b, { getallen: vondstMap[b.bid], anderen: bottys }); });
    // Dromen: slapers spelen af en toe een herinnering na en consolideren hun brein
    if (NACHT) for (const b of bottys) {
      if (b.bezigEi || !slaapt(b) || Math.random() > 0.10) continue;
      const dtekst = droom(b);
      if (Math.random() < 0.35) events.push({ soort: "droom", naam: b.naam,
        tekst: "💤 <b>" + b.naam + "</b> droomt: \u201c" + dtekst + "\u201d" });
    }
  }

  // ─── Broedmachine: eieren komen uit ────────────────────────────────────────────
  // Een ei komt uit als (a) een bezoeker een rijp ei aanklikt, of (b) het vangnet
  // afloopt zodat de hive nooit stilvalt zonder publiek.
  async function komUit(ei: any, hoe: string) {
    const kind = ei.kind; if (!kind) return;
    // De naam werd bij het leggen gekozen; is hij inmiddels bezet (immigrant,
    // ander ei), dan krijgt het kuiken bij het uitkomen een verse naam.
    if (bottys.some((b: any) => b.naam === kind.naam)) kind.naam = kiesNaam(bottys.map((b: any) => b.naam));
    kind.geboren = nu;
    kind.pos = { x: 90 + Math.random() * 50, y: WERELD_H - 70 };   // kruipt uit de incubator
    // aan de cap maakt de zwakste levende plaats voor het kuiken
    const levend = bottys.filter((b: any) => !b.bezigEi);
    if (levend.length >= MAX_POP) {
      const zwakste = [...levend].sort((a: any, b: any) => geneScore(a) - geneScore(b))[0];
      const i = bottys.indexOf(zwakste);
      if (i >= 0) {
        bottys.splice(i, 1);
        events.push({ soort: "vertrokken", naam: zwakste.naam,
          tekst: "👋 <b>" + zwakste.naam + "</b> maakt plaats voor het kuiken en vertrekt" });
      }
    }
    bottys.push(kind);
    try {
      await supabase.from("geboorten").insert({
        kind_id: kind.bid, kind_naam: kind.naam, generatie: kind.generatie,
        oudera_id: ei.ouderA_bid ?? null, oudera_naam: ei.ouderA ?? null,
        ouderb_id: ei.ouderB_bid ?? null, ouderb_naam: ei.ouderB ?? null,
        genome: kind.genome, grootte: kind.grootte,
        van_a: kind.erfenis?.vanA ?? null, van_b: kind.erfenis?.vanB ?? null,
        mutaties: kind.erfenis?.mutaties ?? null,
        verwantschap: ei.verwantschap ?? 0, immigrant: false,
      });
    } catch (_) { /* stamboom is niet kritisch */ }
    lastKweek = {
      ouderA: ei.ouderA ?? null, ouderB: ei.ouderB ?? null,
      kind: kind.naam, generatie: kind.generatie,
      genome: kind.genome, grootte: kind.grootte, erfenis: kind.erfenis,
      verwantschap: ei.verwantschap ?? 0, immigrant: false,
    };
    const e = kind.erfenis;
    const erfenisTekst = e
      ? " · " + e.vanA + "+" + e.vanB + " genen, " + e.mutaties + " mutatie" + (e.mutaties !== 1 ? "s" : "")
      : "";
    const straftekst = (ei.inteeltStraf ?? 0) >= 1
      ? " · ⚠️ inteelt (−" + ei.inteeltStraf + " fitness" + (kind.ziek ? ", ziek geboren" : "") + ")"
      : "";
    events.push({ soort: "geboren", naamKind: kind.naam, generatie: kind.generatie,
      genome: kind.genome, grootte: kind.grootte, erfenis: kind.erfenis, verwantschap: ei.verwantschap ?? 0,
      tekst: "🐣 <b>" + kind.naam + "</b> komt uit het ei — generatie " + kind.generatie
        + " · " + hoe + erfenisTekst + straftekst });
  }

  // ─── Bezoekersinteractie toepassen (globaal gebudgetteerd) ────────────────────
  let iaBucket = interactieBudget(state, nu);
  let iaEvent: any = null;
  function vindBot(naam: any) {
    return typeof naam === "string" ? bottys.find((b: any) => b.naam === naam && !b.bezigEi) : null;
  }
  function boostEndorfine(b: any, hoeveel: number) {
    b.chem = b.chem || {};
    b.chem.endorfine = Math.min(100, (b.chem.endorfine ?? 0) + hoeveel);
    b.chem.stress = Math.max(0, (b.chem.stress ?? 0) - hoeveel * 0.5);
  }
  if (vraag && vraag.actie && vraag.actie !== "broed") {
    if (iaBucket.tokens < 1) {
      iaEvent = { ok: false, reden: "rustig" };   // emmer leeg: hand wacht even
    } else {
      const kost = () => { iaBucket.tokens -= 1; };

      // 1) AAIEN — attentie voelt goed (endorfine, stemming) én bekrachtigt wat de
      //    Botty NU doet: staat hij bij een object voor een drive, dan leert hij dat
      //    dat object helpt. Zo voed jij als bezoeker het leren mee (Creatures).
      if (vraag.actie === "aai") {
        const b = vindBot(vraag.bot);
        if (b) {
          kost();
          boostEndorfine(b, 26);
          b.stemming = klem((b.stemming ?? 50) + 12);
          b.geluk = klem((b.geluk ?? 50) + 6);
          let leer = "";
          if (b.doel && b.doel.soort === "zelfzorg" && b.doel.stat && b.doel.obj) {
            breinLeer(b, b.doel.stat, b.doel.obj, true);   // "goed zo, blijf dat doen"
            const o = OBJECTEN.find(x => x.id === b.doel.obj);
            if (o) leer = " — leert dat " + o.kort + " goed is";
          }
          onthoud(b, "geaaid", "een warme hand aaide me");
          iaEvent = { ok: true, soort: "aai", naam: b.naam,
            tekst: "🖐 <b>" + b.naam + "</b> wordt geaaid — voelt zich gezien" + leer };
        }
      }

      // 2) VOEREN — een hapje data/energie: tilt de laagste bar op, dempt honger.
      else if (vraag.actie === "voer") {
        const b = vindBot(vraag.bot);
        if (b) {
          kost();
          const laagste = DRIVE_STATS.map(s => ({ s, v: b[s] ?? 100 })).sort((p, q) => p.v - q.v)[0];
          b[laagste.s] = klem((b[laagste.s] ?? 50) + 22);
          b.chem = b.chem || {}; b.chem.honger = Math.max(0, (b.chem.honger ?? 0) - 30);
          b.stemming = klem((b.stemming ?? 50) + 6);
          onthoud(b, "gevoerd", "een hand gaf me iets lekkers");
          iaEvent = { ok: true, soort: "voer", naam: b.naam,
            tekst: "🍎 <b>" + b.naam + "</b> krijgt een hapje — " + DRIVE_LABEL[laagste.s] + " stilt" };
        }
      }

      // 3) MEDICIJN — geneest een zieke Botty (of stelt gerust als hij gezond is).
      else if (vraag.actie === "medicijn") {
        const b = vindBot(vraag.bot);
        if (b) {
          kost();
          if (b.ziek) {
            b.ziek = false;
            b.chem = b.chem || {}; b.chem.gif = 0;
            b.energie = klem((b.energie ?? 50) + 8); b.fit = klem((b.fit ?? 50) + 8);
            b.stemming = klem((b.stemming ?? 50) + 16);
            onthoud(b, "genezen", "een bezoeker gaf me medicijn toen ik ziek was");
            iaEvent = { ok: true, soort: "medicijn", naam: b.naam,
              tekst: "💊 <b>" + b.naam + "</b> is genezen door een bezoeker" };
          } else {
            boostEndorfine(b, 8);
            iaEvent = { ok: true, soort: "medicijn", naam: b.naam,
              tekst: "💊 <b>" + b.naam + "</b> is niet ziek — voelt zich prima" };
          }
        }
      }

      // 4) WOORD ROEPEN — je leert de hive een woord bij het schoolbord. Wie wakker en
      //    dichtbij genoeg is pikt het op (baby's verbasteren het). Het woord landt in
      //    hun lexicon → telt mee in hun woordenschat en grafschrift-nalatenschap.
      else if (vraag.actie === "woord") {
        const woord = String(vraag.woord ?? "").trim().slice(0, 16).replace(/[<>&"]/g, "");
        if (woord) {
          kost();
          const bord = OBJECTEN.find(o => o.id === "bord")!;
          const leerlingen = bottys.filter((b: any) =>
            !b.bezigEi && !(NACHT && slaapt(b)) && b.pos && afstand2(b.pos, bord) < (ZICHT * 1.6) ** 2);
          const doelgroep = leerlingen.length ? leerlingen : bottys.filter((b: any) => !b.bezigEi && !(NACHT && slaapt(b)));
          const geleerd: string[] = [];
          for (const b of doelgroep) {
            b.lexicon = b.lexicon || {};
            const concept = "mens:" + woord.toLowerCase();
            const baby = huidigeStage(b) === "baby";
            b.lexicon[concept] = baby && Math.random() < 0.6 ? muteerWoord(woord) : woord;
            b.geluk = klem((b.geluk ?? 50) + 4);
            boostEndorfine(b, 6);
            if (!b.herinneringen?.some((h: any) => h.soort === "woord-geleerd" && h.tekst.includes(woord)))
              onthoud(b, "woord-geleerd", "een mens leerde me het woord “" + woord + "”");
            geleerd.push(b.naam);
          }
          if (geleerd.length) {
            iaEvent = { ok: true, soort: "woord", woord,
              tekst: "🗣️ De hive leert het woord “" + woord + "” — " + geleerd.length + " Botty" + (geleerd.length !== 1 ? "'s" : "") + " pikken het op" };
          } else { iaBucket.tokens += 1; iaEvent = { ok: false, reden: "niemand luistert" }; }
        }
      }
    }
    if (iaEvent && iaEvent.ok && iaEvent.tekst) events.push({ soort: "interactie", tekst: iaEvent.tekst });
  }

  // (a) bezoeker broedt een rijp ei uit
  if (vraag && vraag.actie === "broed" && typeof vraag.ei === "string") {
    const i = eieren.findIndex((e: any) => e.id === vraag.ei);
    if (i >= 0 && nu >= (eieren[i].rijpOp ?? 0)) {
      const ei = eieren.splice(i, 1)[0];
      await komUit(ei, "uitgebroed door een bezoeker");
    }
  }
  // (b) vangnet: te lang genegeerde eieren komen vanzelf uit
  for (const ei of [...eieren]) {
    if (nu - (ei.gelegd ?? nu) >= AUTO_BROED_MS) {
      const i = eieren.indexOf(ei);
      if (i >= 0) { eieren.splice(i, 1); await komUit(ei, "vanzelf uitgekomen"); }
    }
  }

  // Megapriemen die bezoekers in hun browser vonden (via priem-claim) verrekenen:
  // de ontdekker-Botty krijgt IQ-bonus + een mega-teller. Alleen hier gebeurt de
  // hive_state-write, dus dit is race-vrij. Markeer verrekend zodat het één keer telt.
  try {
    const { data: open } = await supabase
      .from("mega_priemen").select("id,ontdekker_bid,ontdekker_naam,digits")
      .eq("verrekend", false).limit(200);
    if (open && open.length) {
      for (const v of open) {
        const b = bottys.find(x => (v.ontdekker_bid && x.bid === v.ontdekker_bid)
          || x.naam === v.ontdekker_naam);
        if (b) {
          b.iq = Math.min(999, (b.iq ?? 100) + 2);            // zware vondst = flinke bonus
          b.mega = (b.mega ?? 0) + 1;                          // teller voor badges
          onthoud(b, "megapriem", "een bezoeker hielp me een reuzenpriem van " + v.digits + " cijfers vinden");
        }
      }
      await supabase.from("mega_priemen").update({ verrekend: true })
        .in("id", open.map((v: any) => v.id));
    }
  } catch (_) { /* best-effort: volgende tick opnieuw */ }

  await supabase.from("hive_state").upsert({
    id: "main", bottys,
    first_opened: state.first_opened ?? nu,
    acties,
    last_updated_at: nu,
    last_kweek: lastKweek,
    eieren,
    ia_bucket: { tokens: Math.round(iaBucket.tokens * 100) / 100, laatst: nu },
  });

  for (const ev of events) await broadcast(ev);

  return new Response(
    JSON.stringify({ ok: true, ticks: gemist, events: events.length, bezoekers, interactie: iaEvent }),
    { headers: { "Content-Type": "application/json" } },
  );
});
