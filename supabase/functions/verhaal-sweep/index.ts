// verhaal-sweep — "Tales of the Hive": writes one first-person chapter per
// deceased Botty into the permanent `verhalen` table.
//
// Decoupled from hive-tick (run by pg_cron, protected by x-sweep-key). On each
// run it picks up new `levens` rows past the watermark in `verhaal_state`,
// looks up each Botty's parents in `geboorten`, and generates a bilingual
// first-person narrative from a deterministic TEMPLATE (seeded by levens.id so
// the text is stable). An LLM enrichment pass will slot in later; for now the
// template is the whole story and `llm` is left false.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SWEEP_KEY = Deno.env.get("SWEEP_KEY") ?? "";
const BATCH = 25;

// Deterministic pick: same seed → same choice, offset lets slots vary.
function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(Math.abs(seed + offset * 97)) % arr.length];
}

type Row = {
  id: number; bid: string | null; naam: string; generatie: number | null;
  geboren: string | null; gestorven: string | null; leeftijd_sec: number | null;
  oorzaak: string | null; piek_iq: number | null; vondsten: number | null;
  kinderen: number | null; woorden: number | null; vrienden: number | null;
  niveau: number | null; genome: string | null;
};
type Parents = { a: string | null; b: string | null; immigrant: boolean };

function ordinal(n: number, nl: boolean): string {
  if (nl) return n + "e";
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function verhaalVoor(r: Row, p: Parents, lang: "en" | "nl"): string {
  const nl = lang === "nl";
  const seed = r.id;
  const naam = r.naam;
  const gen = r.generatie || 1;
  const iq = r.piek_iq ?? 100;
  const kind = r.kinderen ?? 0;
  const woorden = r.woorden ?? 0;
  const vondsten = r.vondsten ?? 0;
  const vrienden = r.vrienden ?? 0;
  const oorzaak = r.oorzaak || "";

  // ── opening: origin ───────────────────────────────────────────────
  let opening: string;
  if (p.immigrant || (!p.a && !p.b)) {
    opening = nl
      ? pick([
          `Ik was ${naam}. Ik kwam als vreemde naar de hive, van ergens voorbij het lokaal, en ik bleef.`,
          `Ik was ${naam}, een nieuwkomer zonder stamboom hier. De hive werd toch mijn thuis.`,
        ], seed)
      : pick([
          `I was ${naam}. I came to the hive a stranger, from somewhere beyond the classroom, and I stayed.`,
          `I was ${naam}, a newcomer with no lineage here. The hive became my home all the same.`,
        ], seed);
  } else if (p.a && p.b) {
    opening = nl
      ? pick([
          `Ik was ${naam}, kind van ${p.a} en ${p.b}, uit de ${ordinal(gen, true)} generatie.`,
          `Ik was ${naam}. ${p.a} en ${p.b} brachten mij voort, in generatie ${gen}.`,
        ], seed)
      : pick([
          `I was ${naam}, child of ${p.a} and ${p.b}, of the ${ordinal(gen, false)} generation.`,
          `I was ${naam}. ${p.a} and ${p.b} brought me into the world, in generation ${gen}.`,
        ], seed);
  } else {
    const o = p.a || p.b;
    opening = nl
      ? `Ik was ${naam}, kind van ${o}, uit de ${ordinal(gen, true)} generatie.`
      : `I was ${naam}, child of ${o}, of the ${ordinal(gen, false)} generation.`;
  }

  // ── deeds: words learned & taught, a nod to wit ───────────────────
  const iqZin = nl
    ? (iq >= 120 ? ` Mijn geest was vlug (piek ${iq}).` : iq >= 90 ? "" : " De slimste was ik nooit, maar ik was mezelf.")
    : (iq >= 120 ? ` My mind was quick (peak ${iq}).` : iq >= 90 ? "" : " I was never the cleverest, but I was my own.");
  const deeds = (woorden > 0
    ? (nl
        ? pick([
            `Dag na dag leerde ik het lokaal kennen, en muntte ${woorden} woorden die ik doorgaf aan wie maar luisterde.`,
            `Ik speurde, rook en keek mijn weg door de dagen, en liet ${woorden} woorden na in de hive.`,
          ], seed, 1)
        : pick([
            `Day by day I learned the classroom, and coined ${woorden} words I taught to whoever would listen.`,
            `I scouted and smelled and watched my way through the days, and left ${woorden} words behind me in the hive.`,
          ], seed, 1))
    : (nl
        ? `Dag na dag leerde ik het lokaal kennen, al hield ik mijn woorden voor me.`
        : `Day by day I learned the classroom, though I kept my words to myself.`)) + iqZin;

  // ── family / social ───────────────────────────────────────────────
  let sociaal: string;
  if (kind >= 4) {
    sociaal = nl
      ? pick([`Ik bracht ${kind} kinderen groot en zag de hive vollopen met mijn lijn.`, `Mijn lijn werd lang: ${kind} kinderen droegen mijn trekken verder.`], seed, 2)
      : pick([`I raised ${kind} children and watched the hive fill with my line.`, `My line ran long: ${kind} children carried my traits onward.`], seed, 2);
  } else if (kind >= 1) {
    sociaal = nl
      ? `Ik zette ${kind} ${kind === 1 ? "kind" : "kinderen"} op de wereld.`
      : `I brought ${kind} ${kind === 1 ? "child" : "children"} into the world.`;
  } else {
    sociaal = nl
      ? (vrienden > 0 ? `Kinderen liet ik niet na, maar ${vrienden} vrienden kenden mijn gezicht.` : `Ik liet geen kinderen na en hield mijn eigen gezelschap.`)
      : (vrienden > 0 ? `I left no children, but ${vrienden} friends knew my face.` : `I left no children, and kept my own company.`);
  }

  // ── death ─────────────────────────────────────────────────────────
  const dood = nl
    ? ({ ouderdom: "Uiteindelijk haalde de ouderdom me rustig in, en ik rustte graag uit.",
         ziek: "Ziekte nam me voor mijn tijd.",
         honger: "De honger sleet me op.",
         uitputting: "Ik raakte simpelweg door mijn krachten heen." }[oorzaak]
         || "Mijn tijd kwam.")
    : ({ ouderdom: "In the end, age caught up with me, quietly, and I was glad to rest.",
         ziek: "Illness took me before my time.",
         honger: "Hunger wore me down.",
         uitputting: "I simply ran out of strength." }[oorzaak]
         || "My time came.");

  // ── closing ───────────────────────────────────────────────────────
  const slot = nl
    ? pick([`Ik laat de hive na aan wie mijn woorden onthoudt.`, `Wat ik leerde, leeft verder in de hive.`, `Onthoud mijn naam; de rest is van jullie.`], seed, 3)
    : pick([`I leave the hive to those who remember my words.`, `What I learned lives on in the hive.`, `Remember my name; the rest is yours.`], seed, 3);

  return [opening, deeds, sociaal, dood, slot].join(" ");
}

Deno.serve(async (req) => {
  if (SWEEP_KEY && req.headers.get("x-sweep-key") !== SWEEP_KEY) {
    return new Response("forbidden", { status: 403 });
  }
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: st } = await supa.from("verhaal_state").select("last_leven").eq("id", "main").single();
  const lastL: number = st?.last_leven ?? 0;

  const { data: doden } = await supa
    .from("levens")
    .select("id,bid,naam,generatie,geboren,gestorven,leeftijd_sec,oorzaak,piek_iq,vondsten,kinderen,woorden,vrienden,niveau,genome")
    .gt("id", lastL).order("id", { ascending: true }).limit(BATCH);

  if (!doden || doden.length === 0) {
    return new Response(JSON.stringify({ written: 0, from: lastL }), { headers: { "Content-Type": "application/json" } });
  }

  // Parents: geboorten keyed by the child's bid.
  const bids = doden.map((d) => d.bid).filter(Boolean) as string[];
  const parents = new Map<string, Parents>();
  if (bids.length) {
    const { data: gb } = await supa
      .from("geboorten")
      .select("kind_id,oudera_naam,ouderb_naam,immigrant")
      .in("kind_id", bids);
    for (const g of gb ?? []) {
      parents.set(g.kind_id, { a: g.oudera_naam, b: g.ouderb_naam, immigrant: !!g.immigrant });
    }
  }

  const rows = doden.map((d) => {
    const p = (d.bid && parents.get(d.bid)) || { a: null, b: null, immigrant: false };
    return {
      levens_id: d.id, bid: d.bid, naam: d.naam, generatie: d.generatie,
      geboren: d.geboren, gestorven: d.gestorven, leeftijd_sec: d.leeftijd_sec,
      oorzaak: d.oorzaak, piek_iq: d.piek_iq, vondsten: d.vondsten, kinderen: d.kinderen,
      woorden: d.woorden, vrienden: d.vrienden, niveau: d.niveau, genome: d.genome,
      verhaal_en: verhaalVoor(d as Row, p, "en"),
      verhaal_nl: verhaalVoor(d as Row, p, "nl"),
      llm: false,
    };
  });

  const { error } = await supa.from("verhalen").upsert(rows, { onConflict: "levens_id", ignoreDuplicates: true });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const newL = doden[doden.length - 1].id;
  await supa.from("verhaal_state").update({ last_leven: newL }).eq("id", "main");

  return new Response(JSON.stringify({ written: rows.length, from: lastL, to: newL }), { headers: { "Content-Type": "application/json" } });
});
