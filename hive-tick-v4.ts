// hive-tick v5 — stemming, bezoekers, tragere AI
// Deploy via: supabase functions deploy hive-tick

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INTERVAL          = 1100;
const VERVAL_INTERVAL   = 2200;
const ZORG_PER_TICK     = 1;   // was 3 — AI werkt langzamer zodat bars kunnen verschuiven
const MAX_CATCHUP_TICKS = 5000;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function klem(v: number) { return Math.max(0, Math.min(100, v)); }
function heeft(b: any, mut: string) { return (b.mutaties || []).includes(mut); }
function huidigeStage(b: any) {
  const leeftijd = (Date.now() - b.geboren) / 1000;
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

// Stemming: emotionele toestand 0-100, beinvloed door bezoekers, leeftijd, genen en AI-zorg
function updateStemming(b: any, bezoekers: number) {
  const stage = huidigeStage(b);
  const genBonus = ((b.datakwaliteit ?? 50) + (b.efficientie ?? 50) - 100) / 20;
  const bezoekersBonus = Math.min(bezoekers, 12) * 0.9;
  const stageEffect = stage === "baby"
    ? (Math.random() * 8 - 4)
    : stage === "tiener"
    ? (Math.random() * 4 - 1.5)
    : 0.4;
  const wifiBonus = heeft(b, "wifi") || heeft(b, "antenne2") ? 1.5 : 0;
  const ziekPenalty = b.ziek ? -5 : 0;
  const vervalDecay = -1.4;
  b.stemming = klem((b.stemming ?? 50) + vervalDecay + genBonus + bezoekersBonus + stageEffect + wifiBonus + ziekPenalty);
}

const ZORGACTIES = [
  (b: any) => { if (b.energie < 80) { b.energie = klem(b.energie + 18); return { label:"+⚡", kleur:"#5ec6ff", animeer:true, tekst:"AI geeft <b>"+b.naam+"</b> energie" }; } },
  (b: any) => { if (b.data < 80)    { b.data    = klem(b.data    + 14 + (heeft(b,"wifi")||heeft(b,"antenne2") ? 5 : 0)); return { label:"+💾", kleur:"#3a9d94", animeer:true, tekst:"AI traint <b>"+b.naam+"</b>" }; } },
  (b: any) => { if (b.fit < 80)     { b.fit     = klem(b.fit     + 16); return { label:"+🏃", kleur:"#7fd06f", animeer:true, tekst:"AI laat <b>"+b.naam+"</b> sporten" }; } },
  (b: any) => { if (b.geluk < 80)   { b.geluk   = klem(b.geluk   + 10); return { label:"+😊", kleur:"#f6a623", animeer:false, tekst:"AI houdt <b>"+b.naam+"</b> blij (maar geen band)" }; } },
  (b: any) => { if (b.ziek)         { b.ziek = false; b.energie = klem(b.energie+10); b.fit = klem(b.fit+10); return { label:"💊", kleur:"#ff8bd0", animeer:true, tekst:"AI geneest <b>"+b.naam+"</b>" }; } },
];

function zorg(b: any) {
  for (const fn of ZORGACTIES) {
    const r = fn(b);
    if (r) {
      b.stemming = klem((b.stemming ?? 50) + 14);
      return r;
    }
  }
  b.geluk = klem(b.geluk + 5);
  b.stemming = klem((b.stemming ?? 50) + 8);
  return { label:"+geluk 🤖", kleur:"#f6a623", animeer:false, tekst:"AI houdt <b>"+b.naam+"</b> blij (maar geen band)" };
}

function vervalEen(b: any) {
  b.energie = klem(b.energie - 3);
  b.data    = klem(b.data    - (heeft(b,"zonnepaneel") ? 1 : 2));
  b.fit     = klem(b.fit     - 2);
  b.geluk   = klem(b.geluk   - 2);
  b.stemming = klem((b.stemming ?? 50) - 2);
  if (!b.ziek && Math.random() < 0.004) b.ziek = true;
}

const NAMEN = ["Pixel","Nova","Spark","Byte","Echo","Flux","Arc","Volt","Glow","Iris","Zap","Core"];
const PALETTEN = [
  { naam:"smaragd",  accent:"#2ecc71", oogje:"#145a32", scherm:"#1e8449", schermRand:"#145a32", broek:"#117a65", broekRand:"#0e6655" },
  { naam:"saffier",  accent:"#3498db", oogje:"#1a5276", scherm:"#2471a3", schermRand:"#1a5276", broek:"#1f618d", broekRand:"#1a5276" },
  { naam:"robijn",   accent:"#e74c3c", oogje:"#78281f", scherm:"#cb4335", schermRand:"#78281f", broek:"#922b21", broekRand:"#78281f" },
  { naam:"amber",    accent:"#f39c12", oogje:"#784212", scherm:"#d68910", schermRand:"#784212", broek:"#9a7d0a", broekRand:"#784212" },
  { naam:"amethist", accent:"#9b59b6", oogje:"#4a235a", scherm:"#884ea0", schermRand:"#4a235a", broek:"#6c3483", broekRand:"#4a235a" },
  { naam:"koraal",   accent:"#e67e22", oogje:"#784212", scherm:"#ca6f1e", schermRand:"#784212", broek:"#935116", broekRand:"#784212" },
];
const MUTATIES = ["zonnepaneel","wifi","antenne2","oog3","quantum"];

function maakBotty(naam: string, palet: any, generatie = 1, extra: any = {}) {
  return {
    naam, kleur: { ...palet }, paletNaam: palet.naam,
    energie: 70 + Math.random()*20, data: 60 + Math.random()*25,
    fit: 65 + Math.random()*20, geluk: 60 + Math.random()*25,
    datakwaliteit: 40 + Math.random()*30, efficientie: 40 + Math.random()*30,
    stemming: 40 + Math.random()*25,
    stage: "baby", geboren: Date.now(),
    generatie, ziek: false, mutaties: [], bezigEi: false,
    ...extra,
  };
}

function maakKind(ouderA: any, ouderB: any, namen: string[]) {
  const bezet = new Set(namen);
  const kandidaten = NAMEN.filter(n => !bezet.has(n));
  const naam = kandidaten[Math.floor(Math.random() * kandidaten.length)] || "Kind";
  const palet = Math.random() < 0.5 ? ouderA.kleur : ouderB.kleur;
  const dk = klem(Math.max(ouderA.datakwaliteit, ouderB.datakwaliteit) + (Math.random()*10 - 2));
  const ef = klem(Math.max(ouderA.efficientie,   ouderB.efficientie)   + (Math.random()*10 - 2));
  const gen = Math.max(ouderA.generatie ?? 1, ouderB.generatie ?? 1) + 1;
  const ouderMuts = [...new Set([...(ouderA.mutaties||[]), ...(ouderB.mutaties||[])])];
  const mutaties = ouderMuts.filter(() => Math.random() < 0.6);
  if (Math.random() < 0.12) {
    const nieuw = MUTATIES.filter(m => !mutaties.includes(m));
    if (nieuw.length) mutaties.push(nieuw[Math.floor(Math.random()*nieuw.length)]);
  }
  const ouderStemming = ((ouderA.stemming ?? 50) + (ouderB.stemming ?? 50)) / 2;
  const kindStemming = klem(ouderStemming + (Math.random() * 20 - 10));
  return maakBotty(naam, { ...palet, naam: palet.naam || "mix" }, gen, { datakwaliteit:dk, efficientie:ef, mutaties, stemming:kindStemming });
}

function maakNieuweHive() {
  const bottys = [];
  for (let i = 0; i < 9; i++) {
    const palet = PALETTEN[i % PALETTEN.length];
    bottys.push(maakBotty(NAMEN[i], palet));
  }
  return { id: "main", bottys, first_opened: Date.now(), acties: 0, last_updated_at: Date.now() };
}

async function broadcast(payload: object) {
  try {
    await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        messages: [{
          topic: "realtime:hive-events",
          event: "actie",
          payload,
        }],
      }),
    });
  } catch (_) { /* broadcast is best-effort */ }
}

Deno.serve(async () => {
  const { data: row, error } = await supabase
    .from("hive_state").select("*").eq("id","main").single();

  let state = (error || !row) ? maakNieuweHive() : row;
  let bottys: any[] = state.bottys || [];

  const nu = Date.now();
  const gemist = Math.min(
    Math.floor((nu - (state.last_updated_at || nu)) / INTERVAL),
    MAX_CATCHUP_TICKS,
  );
  const vervalTicks = Math.floor(gemist * INTERVAL / VERVAL_INTERVAL);

  // Tel actieve bezoekers (pings van afgelopen 30s)
  const cutoff = new Date(nu - 30000).toISOString();
  const { count: bezoekersCount } = await supabase
    .from("bezoeker_pings")
    .select("*", { count: "exact", head: true })
    .gte("ts", cutoff);
  const bezoekers = bezoekersCount ?? 0;

  // Cleanup oude pings
  await supabase.from("bezoeker_pings").delete().lt("ts", new Date(nu - 120000).toISOString());

  let acties: number = state.acties ?? 0;
  const events: object[] = [];

  for (let t = 0; t < gemist - 1; t++) {
    kiesDoelen(bottys, ZORG_PER_TICK).forEach(b => { zorg(b); acties++; });
    if (t % Math.round(VERVAL_INTERVAL / INTERVAL) === 0) bottys.forEach(b => { if (!b.bezigEi) vervalEen(b); });
    bottys.forEach(b => {
      const s = huidigeStage(b); if (s !== b.stage) b.stage = s;
      updateStemming(b, bezoekers);
    });
  }

  if (gemist >= 1) {
    const doelen = kiesDoelen(bottys, ZORG_PER_TICK);
    doelen.forEach((b, i) => {
      if (b.bezigEi) return;
      acties++;
      const d = zorg(b);
      if (i === 0) events.push({ soort:"zorg", naam:b.naam, ...d });
      else         events.push({ soort:"zorg", naam:b.naam, label:d.label, kleur:d.kleur, animeer:d.animeer });
    });
    for (let t = 0; t < vervalTicks; t++) bottys.forEach(b => { if (!b.bezigEi) vervalEen(b); });
    bottys.forEach(b => {
      const s = huidigeStage(b); if (s !== b.stage) b.stage = s;
      updateStemming(b, bezoekers);
    });

    if (Math.random() < 0.125 && bottys.length >= 2) {
      const n = bottys.length;
      let i = Math.floor(Math.random()*n), j;
      do { j = Math.floor(Math.random()*n); } while (j === i);
      const a = bottys[i], b = bottys[j];
      if (!a.bezigEi && !b.bezigEi) {
        a.geluk = klem(a.geluk + 12); b.geluk = klem(b.geluk + 12);
        a.stemming = klem((a.stemming ?? 50) + 8);
        b.stemming = klem((b.stemming ?? 50) + 8);
        const leraar = a.data >= b.data ? a : b;
        const leerling = leraar === a ? b : a;
        const bonus = 10 + (heeft(leerling,"wifi")||heeft(leerling,"antenne2") ? 6 : 0);
        leerling.data = klem(leerling.data + bonus);
        events.push({ soort:"bezoek", naamA:a.naam, naamB:b.naam,
          tekst:"🔗 <b>"+a.naam+"</b> en <b>"+b.naam+"</b> wisselen kennis uit" });
      }
    }

    if (Math.random() < 0.05) {
      const kandidaten = bottys.filter(rijp);
      if (kandidaten.length >= 2) {
        kandidaten.sort((a, b) => geneScore(b) - geneScore(a));
        const ouderA = kandidaten[0];
        const ouderB = kandidaten[1];
        const kind = maakKind(ouderA, ouderB, bottys.map((b:any) => b.naam));
        const idx = bottys.indexOf(ouderA);
        events.push({ soort:"kweek-start", naamA:ouderA.naam, naamB:ouderB.naam,
          tekst:"💞 De AI koppelt <b>"+ouderA.naam+"</b> en <b>"+ouderB.naam+"</b> — beste genen" });
        if (idx >= 0) bottys[idx] = kind;
        events.push({ soort:"geboren", naamKind:kind.naam, generatie:kind.generatie,
          tekst:"🐣 <b>"+kind.naam+"</b> is geboren — generatie "+kind.generatie });
      }
    }
  }

  await supabase.from("hive_state").upsert({
    id: "main",
    bottys,
    first_opened: state.first_opened ?? nu,
    acties,
    last_updated_at: nu,
  });

  for (const ev of events) await broadcast(ev);

  return new Response(JSON.stringify({ ok:true, ticks: gemist, events: events.length, bezoekers }), {
    headers: { "Content-Type": "application/json" },
  });
});
