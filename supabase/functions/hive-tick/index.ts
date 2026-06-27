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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────
function klem(v: number) { return Math.max(0, Math.min(100, v)); }
function heeft(b: any, mut: string) { return (b.mutaties || []).includes(mut); }
function maakId(): string {
  try { return crypto.randomUUID().slice(0, 8); }
  catch { return Math.random().toString(36).slice(2, 10); }
}

// ─── IQ: priemgetallen uitwerken ───────────────────────────────────────────────
// Elke Botty start met IQ 100. Per denk-ronde zoekt hij een NOG NIET ONTDEKTE
// priem (≤ PRIEM_MAX): een nieuwe vinden = +1, een foute gok = -2. De gedeelde
// vondsten-collectie voorkomt dat hetzelfde getal opnieuw "ontdekt" wordt.
// Slimmere Bottys (hogere datakwaliteit) slagen vaker.
const PRIEM_MAX = 10000;
function isPriem(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}
// uitkomst: "nieuw" (verse ontdekking), "fout" (geen priem), "leeg" (alles al ontdekt)
function denkPriem(b: any, ontdekt: Set<number>): { getal: number; uitkomst: string; iq: number } {
  const intel = b.datakwaliteit ?? 50;
  const p = Math.max(0.5, Math.min(0.97, 0.5 + (intel - 50) / 100 * 0.9));
  if (Math.random() < p) {
    // Zoek een priem die nog niet in de collectie zit.
    for (let poging = 0; poging < 300; poging++) {
      const g = 2 + Math.floor(Math.random() * (PRIEM_MAX - 1));
      if (isPriem(g) && !ontdekt.has(g)) {
        ontdekt.add(g);
        b.iq = Math.min(999, (b.iq ?? 100) + 1);
        return { getal: g, uitkomst: "nieuw", iq: b.iq };
      }
    }
    // Vrijwel alles onder PRIEM_MAX is al ontdekt — geen punt, geen straf.
    return { getal: 0, uitkomst: "leeg", iq: b.iq ?? 100 };
  }
  let getal: number;
  do { getal = 4 + Math.floor(Math.random() * (PRIEM_MAX - 3)); } while (isPriem(getal));
  b.iq = Math.max(0, (b.iq ?? 100) - 2);
  return { getal, uitkomst: "fout", iq: b.iq };
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
function geneScore(b: any) { return (b.datakwaliteit ?? 50) + (b.efficientie ?? 50); }
// Urgentie: hoe lager, hoe eerder zorg nodig. De láágste losse stat telt
// (één kritieke waarde is erger dan een matig gemiddelde), zieken springen voor.
function urgentie(b: any) {
  return Math.min(b.energie, b.data, b.fit, b.geluk) - (b.ziek ? 40 : 0);
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
  const G = exprGenoom(b.genome);
  b.energie  = klem(b.energie  - 2.4 * G.verval.energie);
  b.data     = klem(b.data     - (heeft(b, "zonnepaneel") ? 0.8 : 1.6) * G.verval.data);
  b.fit      = klem(b.fit      - 1.6 * G.verval.fit);
  b.geluk    = klem(b.geluk    - 1.5 * G.verval.geluk);
  b.stemming = klem((b.stemming ?? 50) - 1.6 * G.verval.stemming);
  if (!b.ziek && Math.random() < 0.004 * G.ziekKans) b.ziek = true;
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
    grootte: G.grootte,
    bid: extra.bid ?? maakId(),
  };
  return { ...base, ...extra, genome, grootte: G.grootte, bid: base.bid };
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

  return maakBotty(naam, { ...kleur, naam: kleur.naam || "mix" }, gen, {
    datakwaliteit: dk, efficientie: ef, mutaties,
    stemming: kindStemming,
    genome: kindGenoom,
    grootte: G.grootte,
    erfenis,
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
Deno.serve(async () => {
  const { data: row, error } = await supabase.from("hive_state").select("*").eq("id", "main").single();
  let state = (error || !row) ? maakNieuweHive() : row;
  let bottys: any[] = state.bottys || [];

  // Backfill: bestaande Bottys zonder genoom krijgen een baseline (gedrag ongewijzigd)
  const baseline = bytesNaarGenoom(new Uint8Array(GENOOM_LEN).fill(128));
  bottys.forEach(b => {
    if (!b.genome || typeof b.genome !== "string") b.genome = baseline;
    if (typeof b.grootte !== "number") b.grootte = exprGenoom(b.genome).grootte;
    if (!b.bid) b.bid = maakId();   // stabiele identiteit voor de stamboom
    if (typeof b.iq !== "number") b.iq = 100;   // IQ-spel: iedereen start op 100
  });

  const nu = Date.now();
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
    kiesDoelen(bottys, ZORG_PER_TICK).forEach(b => { zorg(b); acties++; });
    if (t % Math.round(VERVAL_INTERVAL / INTERVAL) === 0) {
      bottys.forEach(b => { if (!b.bezigEi) vervalEen(b); });
    }
    bottys.forEach(b => {
      const s = huidigeStage(b); if (s !== b.stage) b.stage = s;
      updateStemming(b, bezoekers);
    });
  }

  if (gemist >= 1) {
    // Actieve tick
    const doelen = kiesDoelen(bottys, ZORG_PER_TICK);
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
    });

    // IQ-ronde: elke Botty zoekt een nog niet ontdekte priem (gedeelde collectie)
    const ontdekt = new Set<number>();
    try {
      const { data: pv } = await supabase.from("priemvondsten").select("getal");
      (pv || []).forEach((r: any) => ontdekt.add(r.getal));
    } catch (_) { /* zonder collectie kan iedereen alsnog ontdekken */ }

    const denkers = bottys.filter(b => !b.bezigEi);
    const resultaten = denkers.map(b => ({ b, r: denkPriem(b, ontdekt) }));
    const nieuweVondsten = resultaten
      .filter(x => x.r.uitkomst === "nieuw")
      .map(x => ({ getal: x.r.getal, ontdekker_naam: x.b.naam, ontdekker_bid: x.b.bid, generatie: x.b.generatie }));
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
      const tekst = r.uitkomst === "nieuw"
        ? "🧠 <b>" + pick.b.naam + "</b> ontdekte een nieuw priemgetal: " + r.getal + "! (+1, IQ " + r.iq + ")"
        : r.uitkomst === "leeg"
          ? "🧠 <b>" + pick.b.naam + "</b> vond niets nieuws — bijna alle priemen onder " + PRIEM_MAX + " zijn al ontdekt"
          : "🧠 <b>" + pick.b.naam + "</b> gokte " + r.getal + " — niet priem (−2, IQ " + r.iq + ")";
      events.push({ soort: "denk", naam: pick.b.naam, getal: r.getal, uitkomst: r.uitkomst, iq: r.iq, tekst });
    }

    // Kennisuitwisseling
    if (Math.random() < 0.125 && bottys.length >= 2) {
      const n = bottys.length;
      let i = Math.floor(Math.random() * n), j;
      do { j = Math.floor(Math.random() * n); } while (j === i);
      const a = bottys[i], b = bottys[j];
      if (!a.bezigEi && !b.bezigEi) {
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

    // Voortplanting — genomen kruisen hier
    if (Math.random() < 0.05) {
      const kandidaten = bottys.filter(rijp);
      if (kandidaten.length >= 2) {
        // Slimme partnerkeuze: kies het paar dat fit, genetisch divers én slim is.
        // Score = fitness + gewicht × genetische afstand + gewicht × gezamenlijk IQ.
        let beste: any = null;
        for (let i = 0; i < kandidaten.length; i++)
          for (let j = i + 1; j < kandidaten.length; j++) {
            const a = kandidaten[i], b2 = kandidaten[j];
            const score = geneScore(a) + geneScore(b2)
              + PARTNER_DIVERSITEIT_GEWICHT * genoomAfstand(a.genome, b2.genome)
              + PARTNER_IQ_GEWICHT * ((a.iq ?? 100) + (b2.iq ?? 100));
            if (!beste || score > beste.score) beste = { a, b: b2, score };
          }
        // De minst-fitte ouder maakt plaats voor het kind; de fitste blijft.
        const ouderA = geneScore(beste.a) <= geneScore(beste.b) ? beste.a : beste.b; // vertrekt
        const ouderB = ouderA === beste.a ? beste.b : beste.a;                        // blijft
        const idx = bottys.indexOf(ouderA);
        const popDiv = popDiversiteit(bottys);

        let kind: any, verwantschap = 0, inteeltStraf = 0, immigrant = false;

        if (popDiv < DIVERSITEIT_DREMPEL) {
          // Diversiteits-alarm: vers bloed i.p.v. nóg een inteelt-kind
          const gen = Math.max(ouderA.generatie ?? 1, ouderB.generatie ?? 1) + 1;
          kind = maakImmigrant(bottys.map((b: any) => b.naam), gen);
          immigrant = true;
          events.push({ soort: "immigrant", naamKind: kind.naam,
            tekst: "🌱 <b>" + kind.naam + "</b> arriveert als verse mutant — de genenpoel werd te eenvormig (diversiteit " + Math.round(popDiv) + ")" });
        } else {
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
          events.push({ soort: "kweek-start", naamA: ouderA.naam, naamB: ouderB.naam,
            tekst: "💞 De AI koppelt <b>" + ouderA.naam + "</b> en <b>" + ouderB.naam + "</b> — beste genen" });
        }
        const verwR = Math.round(verwantschap * 100) / 100;

        lastKweek = {
          ouderA: immigrant ? null : ouderA.naam, ouderB: immigrant ? null : ouderB.naam,
          kind: kind.naam, generatie: kind.generatie,
          genome: kind.genome, grootte: kind.grootte, erfenis: kind.erfenis,
          verwantschap: verwR, immigrant,
        };

        // Stamboom: leg deze geboorte vast (best-effort, blokkeert de tick niet)
        try {
          await supabase.from("geboorten").insert({
            kind_id: kind.bid, kind_naam: kind.naam, generatie: kind.generatie,
            oudera_id: immigrant ? null : ouderA.bid, oudera_naam: immigrant ? null : ouderA.naam,
            ouderb_id: immigrant ? null : ouderB.bid, ouderb_naam: immigrant ? null : ouderB.naam,
            genome: kind.genome, grootte: kind.grootte,
            van_a: kind.erfenis?.vanA ?? null,
            van_b: kind.erfenis?.vanB ?? null,
            mutaties: kind.erfenis?.mutaties ?? null,
            verwantschap: verwR, immigrant,
          });
        } catch (_) { /* stamboom is niet kritisch */ }

        if (idx >= 0) bottys[idx] = kind;

        if (immigrant) {
          events.push({ soort: "geboren", naamKind: kind.naam, generatie: kind.generatie,
            genome: kind.genome, grootte: kind.grootte, immigrant: true,
            tekst: "🐣 <b>" + kind.naam + "</b> (verse mutant) is geboren — generatie " + kind.generatie });
        } else {
          const e = kind.erfenis;
          const erfenisTekst = e
            ? " · " + e.vanA + "+" + e.vanB + " genen, " + e.mutaties + " mutatie" + (e.mutaties !== 1 ? "s" : "")
            : "";
          const straftekst = inteeltStraf >= 1
            ? " · ⚠️ inteelt (−" + Math.round(inteeltStraf) + " fitness" + (kind.ziek ? ", ziek geboren" : "") + ")"
            : "";
          events.push({ soort: "geboren", naamKind: kind.naam, generatie: kind.generatie,
            genome: kind.genome, grootte: kind.grootte, erfenis: kind.erfenis, verwantschap: verwR,
            tekst: "🐣 <b>" + kind.naam + "</b> is geboren — generatie " + kind.generatie + erfenisTekst + straftekst });
        }
      }
    }
  }

  await supabase.from("hive_state").upsert({
    id: "main", bottys,
    first_opened: state.first_opened ?? nu,
    acties,
    last_updated_at: nu,
    last_kweek: lastKweek,
  });

  for (const ev of events) await broadcast(ev);

  return new Response(
    JSON.stringify({ ok: true, ticks: gemist, events: events.length, bezoekers }),
    { headers: { "Content-Type": "application/json" } },
  );
});
