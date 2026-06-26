// hive-tick v6 — genoom-evolutie: gedrag + kleur + grootte evolueren mee
// Deploy via: supabase functions deploy hive-tick

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INTERVAL          = 1000;
const VERVAL_INTERVAL   = 2000;
const ZORG_PER_TICK     = 2;
const MAX_CATCHUP_TICKS = 5000;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────
function klem(v: number) { return Math.max(0, Math.min(100, v)); }
function heeft(b: any, mut: string) { return (b.mutaties || []).includes(mut); }
function maakId(): string {
  try { return crypto.randomUUID().slice(0, 8); }
  catch { return Math.random().toString(36).slice(2, 10); }
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
function kiesDoelen(bottys: any[], n: number) {
  return [...bottys]
    .filter(b => !b.bezigEi)
    .sort((a, b) => ((a.energie + a.data + a.fit + a.geluk) / 4) - ((b.energie + b.data + b.fit + b.geluk) / 4))
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
  const acties = [
    () => { if (b.energie < 90) { b.energie = klem(b.energie + 18 * G.zorg.energie); return { label: "+⚡", kleur: "#5ec6ff", animeer: true,  tekst: "AI geeft <b>" + b.naam + "</b> energie" }; } },
    () => { if (b.data < 90)    { b.data    = klem(b.data    + (14 + dataBonus) * G.zorg.data); return { label: "+💾", kleur: "#3a9d94", animeer: true,  tekst: "AI traint <b>" + b.naam + "</b>" }; } },
    () => { if (b.fit < 90)     { b.fit     = klem(b.fit     + 16 * G.zorg.fit);  return { label: "+🏃", kleur: "#7fd06f", animeer: true,  tekst: "AI laat <b>" + b.naam + "</b> sporten" }; } },
    () => { if (b.geluk < 90)   { b.geluk   = klem(b.geluk   + 14 * G.zorg.geluk); return { label: "+😊", kleur: "#f6a623", animeer: false, tekst: "AI houdt <b>" + b.naam + "</b> blij (maar geen band)" }; } },
    () => { if (b.ziek)         { b.ziek = false; b.energie = klem(b.energie + 10 * G.herstel); b.fit = klem(b.fit + 10 * G.herstel); return { label: "💊", kleur: "#ff8bd0", animeer: true, tekst: "AI geneest <b>" + b.naam + "</b>" }; } },
  ];
  for (const fn of acties) {
    const r = fn();
    if (r) { b.stemming = klem((b.stemming ?? 50) + 14); return r; }
  }
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
  });

  const nu = Date.now();
  const gemist = Math.min(Math.floor((nu - (state.last_updated_at || nu)) / INTERVAL), MAX_CATCHUP_TICKS);
  const vervalTicks = Math.floor(gemist * INTERVAL / VERVAL_INTERVAL);

  const cutoff = new Date(nu - 30000).toISOString();
  const { count: bezoekersCount } = await supabase
    .from("bezoeker_pings").select("*", { count: "exact", head: true }).gte("ts", cutoff);
  const bezoekers = bezoekersCount ?? 0;
  await supabase.from("bezoeker_pings").delete().lt("ts", new Date(nu - 120000).toISOString());

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
        kandidaten.sort((a, b) => geneScore(b) - geneScore(a));
        const ouderA = kandidaten[0], ouderB = kandidaten[1];
        const kind = maakKind(ouderA, ouderB, bottys.map((b: any) => b.naam));
        lastKweek = {
          ouderA: ouderA.naam, ouderB: ouderB.naam,
          kind: kind.naam, generatie: kind.generatie,
          genome: kind.genome, grootte: kind.grootte, erfenis: kind.erfenis,
        };
        // Stamboom: leg deze geboorte vast (best-effort, blokkeert de tick niet)
        try {
          await supabase.from("geboorten").insert({
            kind_id: kind.bid, kind_naam: kind.naam, generatie: kind.generatie,
            oudera_id: ouderA.bid, oudera_naam: ouderA.naam,
            ouderb_id: ouderB.bid, ouderb_naam: ouderB.naam,
            genome: kind.genome, grootte: kind.grootte,
            van_a: kind.erfenis?.vanA ?? null,
            van_b: kind.erfenis?.vanB ?? null,
            mutaties: kind.erfenis?.mutaties ?? null,
          });
        } catch (_) { /* stamboom is niet kritisch */ }
        const idx = bottys.indexOf(ouderA);
        events.push({ soort: "kweek-start", naamA: ouderA.naam, naamB: ouderB.naam,
          tekst: "💞 De AI koppelt <b>" + ouderA.naam + "</b> en <b>" + ouderB.naam + "</b> — beste genen" });
        if (idx >= 0) bottys[idx] = kind;
        const e = kind.erfenis;
        const erfenisTekst = e
          ? " · " + e.vanA + "+" + e.vanB + " genen, " + e.mutaties + " mutatie" + (e.mutaties !== 1 ? "s" : "")
          : "";
        events.push({ soort: "geboren", naamKind: kind.naam, generatie: kind.generatie,
          genome: kind.genome, grootte: kind.grootte, erfenis: kind.erfenis,
          tekst: "🐣 <b>" + kind.naam + "</b> is geboren — generatie " + kind.generatie + erfenisTekst });
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
