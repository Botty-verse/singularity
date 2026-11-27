// telegram-sweep — posts hive life-events (births, deaths) to a Telegram channel,
// now WITH a rendered portrait of the Botty (sendPhoto) and disease-aware text.
//
// Decoupled from hive-tick, like notify-sweep: on each run (pg_cron, ~1/min) it reads
// new rows in `geboorten` (births) and `levens` (deaths) since its own watermark
// (notify_state id='telegram') and posts one message per event.
//
// Each Botty's portrait is the same procedural sprite the Tales page draws (pure shapes,
// no fonts), rendered server-side to PNG via resvg-wasm and sent as a photo with the
// event text as caption. If rendering ever fails, it falls back to a plain text message,
// so a Botty is never silently dropped.
//
// First run SEEDS the watermark to the current max ids and posts nothing (no backlog
// dump). Guarded by the shared x-sweep-key (SWEEP_KEY); verify_jwt off. Inert until
// TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set.
//
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SWEEP_KEY.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm@2.6.2";

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

// ── Botty-portret: zelfde sprite + palet als de Tales-pagina (verhaal.html) ──────────
const PALETTEN = [
  { broek: "#2f8f86", broekRand: "#1f6b63", scherm: "#3a9d94", schermRand: "#2b8077", accent: "#2f8f86", oogje: "#bfe3df" },
  { broek: "#b8604f", broekRand: "#7e3a2d", scherm: "#d08b5a", schermRand: "#9a5a2a", accent: "#c56a4a", oogje: "#f2d2b8" },
  { broek: "#5a6fb8", broekRand: "#39497e", scherm: "#6a86d0", schermRand: "#3f58a0", accent: "#5e73c6", oogje: "#cdd8f2" },
  { broek: "#8a6fb8", broekRand: "#5a3f7e", scherm: "#a07bd0", schermRand: "#6a4aa0", accent: "#9a6fc6", oogje: "#e2d2f2" },
  { broek: "#9a8a3a", broekRand: "#6b5f1f", scherm: "#c9b84a", schermRand: "#8a7b2a", accent: "#b8a23a", oogje: "#efe6b8" },
  { broek: "#57b85f", broekRand: "#2e6b34", scherm: "#5fb85f", schermRand: "#2e6b34", accent: "#3f9f4a", oogje: "#cdebc9" },
];
function hash(s: string): number {
  let h = 0; s = String(s || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function paletVan(naam: string) { return PALETTEN[hash(naam) % PALETTEN.length]; }

function spriteSVG(naam: string): string {
  const p = paletVan(naam);
  const body =
    '<g><path d="M100,46 Q96,28 109,20" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="111" cy="16" r="6.5" fill="#8c9196" stroke="#2b2b2b" stroke-width="2.5"/>' +
    '<path d="M111,1 L112.4,5.6 117,7 112.4,8.4 111,13 109.6,8.4 105,7 109.6,5.6 Z" fill="#ffd54a" stroke="#f6a623" stroke-width="0.6"/></g>' +
    '<g><line x1="86" y1="212" x2="80" y2="236" stroke="#2b2b2b" stroke-width="4"/><ellipse cx="78" cy="239" rx="11" ry="6" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="2.5"/></g>' +
    '<g><line x1="114" y1="212" x2="120" y2="236" stroke="#2b2b2b" stroke-width="4"/><ellipse cx="122" cy="239" rx="11" ry="6" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="2.5"/></g>' +
    '<g><line x1="66" y1="156" x2="36" y2="184" stroke="#2b2b2b" stroke-width="4"/><circle cx="55" cy="166" r="7.5" fill="' + p.broek + '" stroke="#2b2b2b" stroke-width="2"/><circle cx="34" cy="187" r="6" fill="' + p.accent + '" stroke="#2b2b2b" stroke-width="2.5"/></g>' +
    '<g><line x1="134" y1="156" x2="164" y2="184" stroke="#2b2b2b" stroke-width="4"/><circle cx="145" cy="166" r="7.5" fill="' + p.broek + '" stroke="#2b2b2b" stroke-width="2"/><circle cx="166" cy="187" r="6" fill="' + p.accent + '" stroke="#2b2b2b" stroke-width="2.5"/></g>' +
    '<rect x="68" y="184" width="64" height="30" rx="10" fill="' + p.broek + '" stroke="' + p.broekRand + '" stroke-width="3"/><line x1="100" y1="200" x2="100" y2="214" stroke="' + p.broekRand + '" stroke-width="3"/>' +
    '<rect x="66" y="140" width="68" height="52" rx="20" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="3"/><rect x="84" y="150" width="32" height="20" rx="7" fill="' + p.accent + '" stroke="#2b2b2b" stroke-width="2.5"/>' +
    '<path d="M93,124 q14,4 0,7 q-14,4 0,7" fill="none" stroke="#9aa0a4" stroke-width="4" stroke-linecap="round"/>' +
    '<g><circle cx="52" cy="76" r="13" fill="' + p.accent + '" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="52" cy="76" r="6" fill="' + p.oogje + '"/>' +
    '<circle cx="148" cy="76" r="13" fill="' + p.accent + '" stroke="#2b2b2b" stroke-width="2.5"/><circle cx="148" cy="76" r="6" fill="' + p.oogje + '"/>' +
    '<path d="M72,46 Q52,48 52,76 Q52,108 72,122 Q100,134 128,122 Q148,108 148,76 Q148,48 128,46 Q100,40 72,46 Z" fill="#fbfbf2" stroke="#2b2b2b" stroke-width="3"/>' +
    '<path d="M80,64 Q100,60 120,64 Q131,66 125,79 L107,106 Q100,115 93,106 L75,79 Q69,66 80,64 Z" fill="' + p.scherm + '" stroke="' + p.schermRand + '" stroke-width="1.5"/>' +
    '<line x1="90" y1="78" x2="90" y2="90" stroke="#1f2a28" stroke-width="4.5" stroke-linecap="round"/><line x1="110" y1="78" x2="110" y2="90" stroke="#1f2a28" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M93,97 Q100,101 107,97 Q106,108 100,109 Q94,108 93,97 Z" fill="#15605a"/></g>';
  // Warme achtergrond (zelfde sfeer als de Tales-kaart); sprite 200×260 met 10px marge.
  return '<svg width="440" height="560" viewBox="0 0 220 280" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="220" height="280" fill="#e7d7b4"/>' +
    '<g transform="translate(10,10)">' + body + '</g></svg>';
}

// resvg-wasm één keer per isolate initialiseren.
let wasmReady: Promise<unknown> | null = null;
function ensureWasm(): Promise<unknown> {
  if (!wasmReady) wasmReady = initWasm(fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm"));
  return wasmReady;
}
async function renderPng(naam: string): Promise<Uint8Array | null> {
  try {
    await ensureWasm();
    const r = new Resvg(spriteSVG(naam));
    return r.render().asPng();
  } catch (e) { console.error("sprite render failed", (e as Error).message); return null; }
}

async function tgSend(text: string): Promise<boolean> {
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!r.ok) { console.error("telegram send failed", r.status, await r.text()); return false; }
    return true;
  } catch (e) { console.error("telegram fetch error", (e as Error).message); return false; }
}

async function tgPhoto(png: Uint8Array, caption: string): Promise<boolean> {
  try {
    const form = new FormData();
    form.append("chat_id", TG_CHAT);
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
    form.append("photo", new Blob([png], { type: "image/png" }), "botty.png");
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, { method: "POST", body: form });
    if (!r.ok) { console.error("telegram photo failed", r.status, await r.text()); return false; }
    return true;
  } catch (e) { console.error("telegram photo error", (e as Error).message); return false; }
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

  const [{ data: maxG }, { data: maxL }] = await Promise.all([
    supa.from("geboorten").select("id").order("id", { ascending: false }).limit(1),
    supa.from("levens").select("id").order("id", { ascending: false }).limit(1),
  ]);
  const curG: number = maxG?.[0]?.id ?? 0;
  const curL: number = maxL?.[0]?.id ?? 0;

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

  type Item = { kind: "b" | "d"; id: number; naam: string; text: string };
  const items: Item[] = [];
  for (const b of births ?? []) {
    const ouders = [b.oudera_naam, b.ouderb_naam].filter(Boolean).map(esc).join(" & ") || "onbekend";
    items.push({ kind: "b", id: b.id, naam: b.kind_naam,
      text: `👶 <b>${esc(b.kind_naam)}</b> is geboren (generatie ${esc(b.generatie)}) — kind van ${ouders}.` });
  }
  for (const d of deaths ?? []) {
    const ziekte = d.oorzaak === "ziek" || d.oorzaak === "ziekte";
    const emoji = ziekte ? "🦠" : "🕯️";
    items.push({ kind: "d", id: d.id, naam: d.naam,
      text: `${emoji} <b>${esc(d.naam)}</b> is overleden — ${oorzaakTekst(d.oorzaak)}, generatie ${esc(d.generatie)}, ${d.kinderen || 0} kinderen nagelaten.` });
  }

  let sentG = lastG, sentL = lastL, photos = 0, texts = 0;
  for (const it of items.slice(0, MAX_PER_RUN)) {
    const png = it.naam ? await renderPng(it.naam) : null;
    let ok = false;
    if (png) { ok = await tgPhoto(png, it.text); if (ok) photos++; }
    if (!ok) { ok = await tgSend(it.text); if (ok) texts++; }
    if (!ok) break; // volledige mislukking → watermerk schuift niet voorbij; volgende run opnieuw
    if (it.kind === "b") sentG = Math.max(sentG, it.id);
    else sentL = Math.max(sentL, it.id);
  }

  if (sentG !== lastG || sentL !== lastL) {
    await supa.from("notify_state").update({ last_geboorte: sentG, last_leven: sentL }).eq("id", "telegram");
  }

  return new Response(
    JSON.stringify({ births: (births ?? []).length, deaths: (deaths ?? []).length, photos, texts }),
    { headers: { "Content-Type": "application/json" } },
  );
});
