// telegram-sweep — posts hive life-events (births, deaths) to a Telegram channel.
//
// Decoupled from hive-tick, exactly like notify-sweep: on each run (pg_cron, ~1/min)
// it reads new rows in `geboorten` (births) and `levens` (deaths) since its OWN
// watermark (notify_state id='telegram') and posts one message per event via the
// Telegram Bot API (sendMessage).
//
// First run SEEDS the watermark to the current max ids and posts nothing, so the
// historical backlog (all past lives) is never dumped into the channel — only events
// from activation onward are posted.
//
// verify_jwt is off; the function is guarded by the shared x-sweep-key header (same
// SWEEP_KEY as notify-sweep). It stays inert (and returns a "skipped" status) until
// TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set, so it is safe to deploy and cron
// before the bot exists.
//
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SWEEP_KEY.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SWEEP_KEY = Deno.env.get("SWEEP_KEY") ?? "";
const TG_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TG_CHAT = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";

const MAX_PER_RUN = 15; // zachte flood-rem: hooguit zoveel berichten per minuut-run

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function oorzaakTekst(o: string): string {
  const map: Record<string, string> = {
    ouderdom: "ouderdom", ziek: "ziekte", ziekte: "ziekte", honger: "honger", uitputting: "uitputting",
  };
  return map[o] ?? (o || "onbekend");
}

async function tgSend(text: string): Promise<boolean> {
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!r.ok) { console.error("telegram send failed", r.status, await r.text()); return false; }
    return true;
  } catch (e) { console.error("telegram fetch error", (e as Error).message); return false; }
}

Deno.serve(async (req) => {
  if (!SWEEP_KEY || req.headers.get("x-sweep-key") !== SWEEP_KEY) {
    return new Response("forbidden", { status: 403 });
  }
  if (!TG_TOKEN || !TG_CHAT) {
    return new Response(JSON.stringify({ skipped: "TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set" }),
      { headers: { "Content-Type": "application/json" } });
  }

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: st } = await supa.from("notify_state").select("*").eq("id", "telegram").maybeSingle();

  // Huidige max-id's (voor seeding en als bovengrens).
  const [{ data: maxG }, { data: maxL }] = await Promise.all([
    supa.from("geboorten").select("id").order("id", { ascending: false }).limit(1),
    supa.from("levens").select("id").order("id", { ascending: false }).limit(1),
  ]);
  const curG: number = maxG?.[0]?.id ?? 0;
  const curL: number = maxL?.[0]?.id ?? 0;

  // Eerste run: watermerk op nu zetten, geen historie dumpen.
  if (!st) {
    await supa.from("notify_state").upsert({ id: "telegram", last_geboorte: curG, last_leven: curL });
    return new Response(JSON.stringify({ seeded: { last_geboorte: curG, last_leven: curL } }),
      { headers: { "Content-Type": "application/json" } });
  }

  const lastG: number = st.last_geboorte ?? 0;
  const lastL: number = st.last_leven ?? 0;

  const [{ data: births }, { data: deaths }] = await Promise.all([
    supa.from("geboorten").select("id,kind_naam,generatie,oudera_naam,ouderb_naam")
      .gt("id", lastG).order("id", { ascending: true }).limit(300),
    supa.from("levens").select("id,naam,oorzaak,generatie,kinderen")
      .gt("id", lastL).order("id", { ascending: true }).limit(300),
  ]);

  type Item = { kind: "b" | "d"; id: number; text: string };
  const items: Item[] = [];
  for (const b of births ?? []) {
    const ouders = [b.oudera_naam, b.ouderb_naam].filter(Boolean).map(esc).join(" & ") || "onbekend";
    items.push({ kind: "b", id: b.id,
      text: `👶 <b>${esc(b.kind_naam)}</b> is geboren (generatie ${esc(b.generatie)}) — kind van ${ouders}.` });
  }
  for (const d of deaths ?? []) {
    items.push({ kind: "d", id: d.id,
      text: `🕯️ <b>${esc(d.naam)}</b> is overleden — ${oorzaakTekst(d.oorzaak)}, generatie ${esc(d.generatie)}, ${d.kinderen || 0} kinderen nagelaten.` });
  }

  let sentG = lastG, sentL = lastL, posted = 0;
  for (const it of items.slice(0, MAX_PER_RUN)) {
    const ok = await tgSend(it.text);
    if (!ok) break; // stop; watermerk schuift niet voorbij een mislukking → volgende run opnieuw
    posted++;
    if (it.kind === "b") sentG = Math.max(sentG, it.id);
    else sentL = Math.max(sentL, it.id);
  }

  if (sentG !== lastG || sentL !== lastL) {
    await supa.from("notify_state").update({ last_geboorte: sentG, last_leven: sentL }).eq("id", "telegram");
  }

  return new Response(
    JSON.stringify({ births: (births ?? []).length, deaths: (deaths ?? []).length, posted }),
    { headers: { "Content-Type": "application/json" } },
  );
});
