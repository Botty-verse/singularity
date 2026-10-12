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

  const leeftijd = r.leeftijd_sec ?? 0;
  const langLeven = oorzaak === "ouderdom" || leeftijd >= 9000;
  const kortLeven = oorzaak !== "ouderdom" && leeftijd > 0 && leeftijd < 4000;

  // ── opening: origin ───────────────────────────────────────────────
  let opening: string;
  if (p.immigrant || (!p.a && !p.b)) {
    opening = pick(nl
      ? [`Ik was ${naam}. Ik kwam als vreemde naar de hive, van ergens voorbij het lokaal, en ik bleef.`,
         `Ik was ${naam}, een nieuwkomer zonder stamboom hier — toch werd de hive mijn thuis.`,
         `Mijn naam was ${naam}. Niemand hier had mij verwacht; ik liep op een dag naar binnen en ging niet meer weg.`]
      : [`I was ${naam}. I came to the hive a stranger, from somewhere beyond the classroom, and I stayed.`,
         `I was ${naam}, a newcomer with no lineage here — yet the hive became my home.`,
         `My name was ${naam}. No one here expected me; I wandered in one day and never left.`], seed);
  } else if (p.a && p.b) {
    opening = pick(nl
      ? [`Ik was ${naam}, kind van ${p.a} en ${p.b}, uit de ${ordinal(gen, true)} generatie.`,
         `Ik was ${naam}. ${p.a} en ${p.b} brachten mij voort, in generatie ${gen}.`,
         `Ze noemden mij ${naam}, geboren uit ${p.a} en ${p.b}, de ${ordinal(gen, true)} van mijn lijn.`]
      : [`I was ${naam}, child of ${p.a} and ${p.b}, of the ${ordinal(gen, false)} generation.`,
         `I was ${naam}. ${p.a} and ${p.b} brought me into the world, in generation ${gen}.`,
         `They called me ${naam}, born of ${p.a} and ${p.b}, the ${ordinal(gen, false)} of my line.`], seed);
  } else {
    const o = p.a || p.b;
    opening = nl
      ? `Ik was ${naam}, kind van ${o}, uit de ${ordinal(gen, true)} generatie.`
      : `I was ${naam}, child of ${o}, of the ${ordinal(gen, false)} generation.`;
  }

  // ── deeds: words learned & taught, talkative vs quiet, a nod to wit ─
  const iqZin = iq >= 120 ? (nl ? ` Mijn geest was vlug (piek ${iq}).` : ` My mind was quick (peak ${iq}).`)
              : iq < 80   ? (nl ? ` De slimste was ik nooit, maar ik was mezelf.` : ` I was never the cleverest, but I was my own.`)
              : "";
  const deeds = (woorden >= 16
    ? pick(nl
        ? [`Ik had een stem en gebruikte 'm: ${woorden} woorden muntte ik, en gaf ze door aan wie maar luisterde.`,
           `Praten kon ik — ${woorden} woorden leerde ik de hive, en ze reisden verder dan ik ooit liep.`]
        : [`I had a voice and I used it: I coined ${woorden} words and passed them to whoever would listen.`,
           `I was a talker — I taught the hive ${woorden} words, and they travelled farther than I ever walked.`], seed, 1)
    : woorden > 0
      ? pick(nl
          ? [`Dag na dag leerde ik het lokaal kennen, en liet ${woorden} woorden na in de hive.`,
             `Ik speurde, rook en keek mijn weg door de dagen, en muntte onderweg ${woorden} woorden.`]
          : [`Day by day I learned the classroom, and left ${woorden} words behind me in the hive.`,
             `I scouted and smelled and watched my way through the days, and coined ${woorden} words along the road.`], seed, 1)
      : (nl ? `Dag na dag leerde ik het lokaal kennen, al hield ik mijn woorden voor me.`
            : `Day by day I learned the classroom, though I kept my words to myself.`)) + iqZin;

  // ── family / social (richer bands) ────────────────────────────────
  let sociaal: string;
  if (kind >= 6) {
    sociaal = pick(nl
      ? [`Ik werd een stamouder: ${kind} kinderen droegen mijn trekken de hive in.`, `Mijn lijn werd een stroom — ${kind} kinderen, en hun kinderen na hen.`]
      : [`I became a founder: ${kind} children carried my traits into the hive.`, `My line became a river — ${kind} children, and theirs after them.`], seed, 2);
  } else if (kind >= 3) {
    sociaal = nl ? `Ik bracht ${kind} kinderen groot en zag de hive voller worden met mijn lijn.`
                 : `I raised ${kind} children and watched the hive grow fuller with my line.`;
  } else if (kind >= 1) {
    sociaal = nl ? `Ik zette ${kind} ${kind === 1 ? "kind" : "kinderen"} op de wereld.`
                 : `I brought ${kind} ${kind === 1 ? "child" : "children"} into the world.`;
  } else if (vrienden >= 6) {
    sociaal = nl ? `Kinderen liet ik niet na, maar ik was nooit alleen — ${vrienden} vrienden kenden mijn gezicht.`
                 : `I left no children, but I was never alone — ${vrienden} friends knew my face.`;
  } else if (vrienden > 0) {
    sociaal = nl ? `Kinderen liet ik niet na, maar ${vrienden} vrienden kenden mijn gezicht.`
                 : `I left no children, but ${vrienden} friends knew my face.`;
  } else {
    sociaal = nl ? `Ik liet geen kinderen na en hield mijn eigen gezelschap, aan de randen van de hive.`
                 : `I left no children, and kept my own company, at the edges of the hive.`;
  }

  // ── a flavour line keyed to the dominant trait ────────────────────
  let flavour = "";
  if (kind < 3 && vrienden >= 8) flavour = " " + pick(nl
    ? [`Waar een menigte was, was ik erbij.`, `Ik kende elk gezicht, en de meeste kenden mij.`, `Onder anderen was ik het gelukkigst.`]
    : [`Where there was a crowd, I was in it.`, `I knew every face, and most knew mine.`, `I was happiest among others.`], seed, 5);
  else if (vrienden <= 2 && kind < 1) flavour = " " + pick(nl
    ? [`Ik hield van de stilte en de hoeken.`, `Ik bleef aan de randen, en dat beviel me.`]
    : [`I loved the quiet and the corners.`, `I kept to the edges, and that suited me.`], seed, 5);
  else if (woorden >= 24) flavour = " " + pick(nl
    ? [`Mijn woorden overleefden mij.`, `Lang na mij bleven mijn woorden.`]
    : [`My words outlived me.`, `Long after me, my words stayed.`], seed, 5);

  // ── death, with a lifespan nod ────────────────────────────────────
  const doodBank: Record<string, string[]> = nl
    ? { ouderdom: [`Uiteindelijk haalde de ouderdom me rustig in, en ik rustte graag uit.`, `Ik werd oud, en op het laatst was ik moe en tevreden.`],
        ziek: [`Ziekte nam me voor mijn tijd.`, `Een kwaal sloop binnen en liet me niet meer los.`],
        honger: [`De honger sleet me op, beetje bij beetje.`],
        uitputting: [`Ik raakte simpelweg door mijn krachten heen.`] }
    : { ouderdom: [`In the end, age caught up with me, quietly, and I was glad to rest.`, `I grew old, and at the last I was tired and content.`],
        ziek: [`Illness took me before my time.`, `A sickness crept in and would not let go.`],
        honger: [`Hunger wore me down, little by little.`],
        uitputting: [`I simply ran out of strength.`] };
  let dood = pick(doodBank[oorzaak] || (nl ? [`Mijn tijd kwam, zoals voor iedereen.`] : [`My time came, as it comes for all.`]), seed, 4);
  if (kortLeven) dood += nl ? ` Het was een kort leven.` : ` It was a short life.`;
  else if (langLeven && oorzaak !== "ouderdom") dood += nl ? ` Maar ik heb lang geleefd.` : ` But I lived long.`;

  // ── closing ───────────────────────────────────────────────────────
  const slot = pick(nl
    ? [`Ik laat de hive na aan wie mijn woorden onthoudt.`, `Wat ik leerde, leeft verder in de hive.`, `Onthoud mijn naam; de rest is van jullie.`, `Het lokaal draait door, ook zonder mij — zo hoort het.`]
    : [`I leave the hive to those who remember my words.`, `What I learned lives on in the hive.`, `Remember my name; the rest is yours.`, `The classroom turns on without me — as it should.`], seed, 3);

  return [opening, deeds, sociaal + flavour, dood, slot].join(" ");
}

// Pick up to 5 of a Botty's coined words — {w: invented word, c: concept key} —
// objects first, then actions, then feelings; skip the names it made for others.
function topWoorden(lexicon: any): { w: string; c: string }[] {
  if (!lexicon || typeof lexicon !== "object") return [];
  const prio = (k: string) => (k.startsWith("dr:") ? 2 : k.startsWith("act:") ? 1 : 0);
  return Object.entries(lexicon)
    .filter(([k, v]) => !k.startsWith("nm:") && typeof v === "string" && v)
    .sort((a, b) => prio(a[0]) - prio(b[0]))
    .slice(0, 5)
    .map(([c, w]) => ({ w: w as string, c }));
}

Deno.serve(async (req) => {
  if (SWEEP_KEY && req.headers.get("x-sweep-key") !== SWEEP_KEY) {
    return new Response("forbidden", { status: 403 });
  }
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Snapshot living Bottys' coined words, so we still have them when they die.
  try {
    const { data: hs } = await supa.from("hive_state").select("bottys").eq("id", "main").single();
    const living = (hs?.bottys ?? []) as any[];
    const snap = living.filter((b) => b && b.bid).map((b) => ({
      bid: b.bid, naam: b.naam, woorden: topWoorden(b.lexicon), updated_at: new Date().toISOString(),
    }));
    if (snap.length) await supa.from("botty_woorden").upsert(snap, { onConflict: "bid" });
    await supa.from("botty_woorden").delete().lt("updated_at", new Date(Date.now() - 2 * 86400000).toISOString());
  } catch (e) {
    console.error("lexicon snapshot failed", (e as any)?.message || e);
  }

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

  // Last-known coined words, snapshotted while each Botty was alive.
  const woordMap = new Map<string, any>();
  if (bids.length) {
    const { data: wr } = await supa.from("botty_woorden").select("bid,woorden").in("bid", bids);
    for (const r of wr ?? []) woordMap.set(r.bid, r.woorden);
  }

  const rows = doden.map((d) => {
    const p = (d.bid && parents.get(d.bid)) || { a: null, b: null, immigrant: false };
    return {
      levens_id: d.id, bid: d.bid, naam: d.naam, generatie: d.generatie,
      geboren: d.geboren, gestorven: d.gestorven, leeftijd_sec: d.leeftijd_sec,
      oorzaak: d.oorzaak, piek_iq: d.piek_iq, vondsten: d.vondsten, kinderen: d.kinderen,
      woorden: d.woorden, vrienden: d.vrienden, niveau: d.niveau, genome: d.genome,
      ouder_a: p.a, ouder_b: p.b,
      top_woorden: (d.bid && woordMap.get(d.bid)) || null,
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
