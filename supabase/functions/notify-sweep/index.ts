// notify-sweep — sends Web Push notifications for adopted Bottys.
//
// Decoupled from hive-tick: on each run (pg_cron, ~1/min) it looks for new
// rows in `geboorten` (births) and `levens` (deaths) since the last watermark
// in `notify_state`, matches them against `adopties` by Botty name, and pushes
// a notification to every subscription that adopted that Botty.
//
// Protected by a shared secret header (x-sweep-key) since verify_jwt is off.
// Secrets required: VAPID_PRIVATE_KEY, SWEEP_KEY. The public VAPID key is not
// secret and is baked in below (same value as assets/botty-config.js).

import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const SWEEP_KEY = Deno.env.get("SWEEP_KEY") ?? "";
const VAPID_PUBLIC = "BCy5Dy1-8E7KdseMf5htnPWloxJ0E4AJ65rcCKNozItqdI18gsP9b-s2OPg427JRbIs-bbghqN5Zkcc5QbnNuXA";
const VAPID_SUBJECT = "https://hive.ramonmoorlag.nl";

const CONSTRUCT_URL = "https://construct.ramonmoorlag.nl";
const KAARTEN_URL = "https://hive.ramonmoorlag.nl/kaarten.html";

function oorzaakTekst(o: string, nl: boolean): string {
  const map: Record<string, [string, string]> = {
    ouderdom: ["old age", "ouderdom"],
    ziek: ["illness", "ziekte"],
    honger: ["hunger", "honger"],
    uitputting: ["exhaustion", "uitputting"],
  };
  const m = map[o];
  return m ? (nl ? m[1] : m[0]) : (o || (nl ? "onbekend" : "unknown"));
}

Deno.serve(async (req) => {
  if (SWEEP_KEY && req.headers.get("x-sweep-key") !== SWEEP_KEY) {
    return new Response("forbidden", { status: 403 });
  }
  if (!VAPID_PRIVATE) {
    return new Response(JSON.stringify({ error: "VAPID_PRIVATE_KEY not set" }), { status: 500 });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Watermark
  const { data: st } = await supa.from("notify_state").select("*").eq("id", "main").single();
  const lastG: number = st?.last_geboorte ?? 0;
  const lastL: number = st?.last_leven ?? 0;

  const [{ data: births }, { data: deaths }, { data: ado }] = await Promise.all([
    supa.from("geboorten").select("id,kind_naam,generatie,oudera_naam,ouderb_naam").gt("id", lastG).order("id", { ascending: true }).limit(300),
    supa.from("levens").select("id,naam,oorzaak,generatie,kinderen").gt("id", lastL).order("id", { ascending: true }).limit(300),
    supa.from("adopties").select("id,botty_naam,endpoint,p256dh,auth,lang"),
  ]);

  const byNaam = new Map<string, any[]>();
  for (const a of ado ?? []) {
    if (!byNaam.has(a.botty_naam)) byNaam.set(a.botty_naam, []);
    byNaam.get(a.botty_naam)!.push(a);
  }

  type Send = { a: any; payload: any; removeAfter: boolean };
  const sends: Send[] = [];

  for (const b of births ?? []) {
    for (const parent of [b.oudera_naam, b.ouderb_naam]) {
      if (parent && byNaam.has(parent)) {
        for (const a of byNaam.get(parent)!) {
          const nl = a.lang === "nl";
          sends.push({
            a, removeAfter: false,
            payload: {
              title: nl ? `👶 ${parent} heeft een kind!` : `👶 ${parent} had a child!`,
              body: nl ? `${b.kind_naam} is geboren (generatie ${b.generatie}).` : `${b.kind_naam} was born (generation ${b.generatie}).`,
              url: CONSTRUCT_URL, tag: `birth-${b.id}-${a.id}`,
            },
          });
        }
      }
    }
  }

  for (const d of deaths ?? []) {
    if (byNaam.has(d.naam)) {
      for (const a of byNaam.get(d.naam)!) {
        const nl = a.lang === "nl";
        sends.push({
          a, removeAfter: true, // Botty is gone → drop the adoption after notifying
          payload: {
            title: nl ? `🕯️ ${d.naam} is overleden` : `🕯️ ${d.naam} has passed away`,
            body: nl
              ? `Oorzaak: ${oorzaakTekst(d.oorzaak, true)}. ${d.kinderen || 0} kinderen nagelaten.`
              : `Cause: ${oorzaakTekst(d.oorzaak, false)}. Left ${d.kinderen || 0} children.`,
            url: KAARTEN_URL, tag: `death-${d.id}`,
          },
        });
      }
    }
  }

  const toDelete = new Set<string>();
  for (const s of sends) {
    try {
      await webpush.sendNotification(
        { endpoint: s.a.endpoint, keys: { p256dh: s.a.p256dh, auth: s.a.auth } },
        JSON.stringify(s.payload),
      );
      if (s.removeAfter) toDelete.add(s.a.id);
    } catch (e: any) {
      const code = e?.statusCode;
      if (code === 404 || code === 410) toDelete.add(s.a.id); // dead subscription
      else console.error("push failed", code, e?.body || e?.message);
    }
  }

  if (toDelete.size) await supa.from("adopties").delete().in("id", [...toDelete]);

  const newG = births && births.length ? births[births.length - 1].id : lastG;
  const newL = deaths && deaths.length ? deaths[deaths.length - 1].id : lastL;
  if (newG !== lastG || newL !== lastL) {
    await supa.from("notify_state").update({ last_geboorte: newG, last_leven: newL }).eq("id", "main");
  }

  return new Response(
    JSON.stringify({ births: (births ?? []).length, deaths: (deaths ?? []).length, sent: sends.length, pruned: toDelete.size }),
    { headers: { "Content-Type": "application/json" } },
  );
});
