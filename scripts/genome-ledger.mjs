// Genome ledger — a permanent, version-controlled fossil record of the hive.
//
// Reads completed lives from Supabase (one per deceased Botty: its birth
// lineage + fixed genome + full life outcomes), decodes the 16-gene profile,
// and appends them to monthly shards genomes/YYYY-MM.jsonl. Git history then
// IS the evolutionary record — `git diff` shows the mutations.
//
// Decoupled & read-only against the sim: it only reads the public anon REST
// (geboorten + levens) and commits files. It never touches hive-tick.
//
// Watermark: genomes/.ledger-state.json {last_leven}. Run by a scheduled
// GitHub Action; also runnable locally with `node scripts/genome-ledger.mjs`.

import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = "https://oblzouaapvdippyhxmpo.supabase.co";
// Public anon key (RLS-protected, meant to live client-side).
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibHpvdWFhcHZkaXBweWh4bXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MzEyMzIsImV4cCI6MjA5NzQwNzIzMn0.dvrxesHILnLdYYrs0_p1Os7Zwi2BdShLDRj8QCkodP4";

const DIR = "genomes";
const STATE = path.join(DIR, ".ledger-state.json");
const BATCH = 500;        // levens rows per page
const CHUNK = 150;        // bids per geboorten lookup
const MAX_RECORDS = 50000; // safety cap per run

const GENE_NAMES = [
  "energy_decay", "data_decay", "fitness_decay", "happiness_decay", "mood_decay",
  "energy_care", "data_care", "fitness_care", "happiness_care",
  "illness_chance", "recovery_speed", "social_sensitivity", "colour_tint",
  "size", "expression_bias", "ageing",
];

function genoomBytes(g) {
  const arr = new Array(16).fill(128);
  if (!g || typeof g !== "string") return arr;
  try {
    let b64 = g.replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = Buffer.from(b64, "base64");
    for (let j = 0; j < 16 && j < bin.length; j++) arr[j] = bin[j];
  } catch { /* corrupt genome → neutral baseline */ }
  return arr;
}
function profiel(g) {
  const by = genoomBytes(g);
  const o = {};
  GENE_NAMES.forEach((n, i) => (o[n] = by[i]));
  return o;
}

async function rest(pathq) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathq}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!res.ok) throw new Error(`REST ${res.status} on ${pathq}: ${await res.text()}`);
  return res.json();
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return { last_leven: 0 }; }
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  const state = readState();
  let lastL = state.last_leven || 0;
  let processed = 0;
  const openFiles = new Map(); // "YYYY-MM" → fd

  function appendRecord(rec) {
    const ym = (rec.gestorven && rec.gestorven.slice(0, 7)) || "unknown";
    let fd = openFiles.get(ym);
    if (fd === undefined) { fd = fs.openSync(path.join(DIR, `${ym}.jsonl`), "a"); openFiles.set(ym, fd); }
    fs.writeSync(fd, JSON.stringify(rec) + "\n");
  }

  while (processed < MAX_RECORDS) {
    const levensCols =
      "id,bid,naam,generatie,geboren,gestorven,leeftijd_sec,oorzaak,piek_iq,kinderen,woorden,vrienden,niveau,genome";
    const doden = await rest(
      `levens?select=${levensCols}&id=gt.${lastL}&order=id.asc&limit=${BATCH}`,
    );
    if (!doden.length) break;

    // Birth lineage for these Bottys (parents, mutations, relatedness, immigrant).
    const bids = [...new Set(doden.map((d) => d.bid).filter(Boolean))];
    const geb = new Map();
    for (let i = 0; i < bids.length; i += CHUNK) {
      const slice = bids.slice(i, i + CHUNK);
      const list = slice.map((b) => `"${b}"`).join(",");
      const rows = await rest(
        `geboorten?select=kind_id,oudera_naam,ouderb_naam,immigrant,mutaties,verwantschap&kind_id=in.(${encodeURIComponent(list)})`,
      );
      for (const r of rows) geb.set(r.kind_id, r);
    }

    for (const d of doden) {
      const g = (d.bid && geb.get(d.bid)) || {};
      appendRecord({
        bid: d.bid, naam: d.naam, generatie: d.generatie,
        geboren: d.geboren, gestorven: d.gestorven, leeftijd_sec: d.leeftijd_sec, oorzaak: d.oorzaak,
        ouderA: g.oudera_naam ?? null, ouderB: g.ouderb_naam ?? null,
        immigrant: g.immigrant ?? null, mutaties: g.mutaties ?? null, verwantschap: g.verwantschap ?? null,
        uitkomst: {
          kinderen: d.kinderen, woorden: d.woorden, vrienden: d.vrienden,
          piek_iq: d.piek_iq, niveau: d.niveau,
        },
        genome: d.genome,
        profiel: profiel(d.genome),
      });
      lastL = Math.max(lastL, d.id);
      processed++;
    }
    if (doden.length < BATCH) break;
  }

  for (const fd of openFiles.values()) fs.closeSync(fd);
  // Only touch the state file when something actually changed (or on first run),
  // so a quiet run leaves no diff and the workflow makes no commit.
  if (processed > 0 || !fs.existsSync(STATE)) {
    fs.writeFileSync(STATE, JSON.stringify({ last_leven: lastL, updated_at: new Date().toISOString() }, null, 2) + "\n");
  }
  console.log(`genome-ledger: recorded ${processed} lives, watermark now ${lastL}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
