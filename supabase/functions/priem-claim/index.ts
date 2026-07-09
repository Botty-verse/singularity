// priem-claim — verifieert een enorme priem die de BROWSER van een bezoeker
// heeft gevonden, en kent 'm toe aan een levende Botty.
//
// De bezoeker levert de rekenkracht: een Web Worker scant duizenden kandidaten
// en stuurt alleen de winnaar hierheen. Zoeken is duur (in de browser),
// verifiëren is goedkoop (één Miller-Rabin-test hier). Zo blijft de collectie
// schoon zonder dat we anon-insert op de tabel hoeven open te zetten.
//
// De +IQ-toekenning aan de Botty gebeurt NIET hier maar in hive-tick (die als
// enige hive_state schrijft) — wij zetten alleen de vondst met ontdekker weg
// en laten `verrekend=false` staan.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Grenzen: alleen genuinely zware vondsten tellen, en de verificatie mag niet
// misbruikt worden om de function te laten zwoegen op absurd lange invoer.
const MIN_DIGITS = 80;
const MAX_DIGITS = 400;
const RONDES = 24;               // Miller-Rabin-getuigen (faalkans < 4^-24)
const MAX_PER_10S = 12;          // simpele snelheidsrem op de hele collectie

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ── Miller-Rabin op BigInt ────────────────────────────────────────────────────
function modpow(base: bigint, exp: bigint, mod: bigint): bigint {
  let r = 1n; base %= mod;
  while (exp > 0n) {
    if (exp & 1n) r = (r * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return r;
}

function randBigInt(max: bigint): bigint {
  // uniforme willekeurige a in [2, max) via crypto
  const bits = max.toString(2).length;
  const bytes = Math.ceil(bits / 8);
  let x: bigint;
  do {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    x = 0n;
    for (const b of buf) x = (x << 8n) | BigInt(b);
    x %= max;
  } while (x < 2n);
  return x;
}

const KLEINE_PRIEMEN = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

function isWaarschijnlijkPriem(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of KLEINE_PRIEMEN) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  // n-1 = d * 2^r
  let d = n - 1n, r = 0n;
  while ((d & 1n) === 0n) { d >>= 1n; r++; }
  for (let i = 0; i < RONDES; i++) {
    const a = randBigInt(n - 2n);
    let x = modpow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let door = false;
    for (let j = 1n; j < r; j++) {
      x = (x * x) % n;
      if (x === n - 1n) { door = true; break; }
    }
    if (!door) return false;
  }
  return true;
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, reden: "alleen POST" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ ok: false, reden: "ongeldige body" }, 400); }

  const cijfers = String(body?.cijfers ?? "").trim();
  if (!/^[1-9][0-9]*$/.test(cijfers)) return json({ ok: false, reden: "geen geldig getal" }, 400);
  const digits = cijfers.length;
  if (digits < MIN_DIGITS) return json({ ok: false, reden: `te klein (< ${MIN_DIGITS} cijfers)` }, 422);
  if (digits > MAX_DIGITS) return json({ ok: false, reden: `te groot (> ${MAX_DIGITS} cijfers)` }, 422);

  const n = BigInt(cijfers);
  if (!isWaarschijnlijkPriem(n)) return json({ ok: false, reden: "niet priem" }, 422);

  // Snelheidsrem: hoeveel is er de laatste 10s al binnengekomen?
  const sinds = new Date(Date.now() - 10_000).toISOString();
  const { count: recent } = await supabase
    .from("mega_priemen").select("id", { count: "exact", head: true }).gte("ts", sinds);
  if ((recent ?? 0) >= MAX_PER_10S) return json({ ok: false, reden: "even rustig aan" }, 429);

  // Kies een levende Botty als ontdekker: bij voorkeur eentje die nu jaagt.
  const { data: row } = await supabase.from("hive_state").select("bottys").eq("id", "main").single();
  const bottys: any[] = (row?.bottys ?? []).filter((b: any) => b && b.naam);
  if (!bottys.length) return json({ ok: false, reden: "geen levende Botty's" }, 503);
  const jagers = bottys.filter((b: any) => b?.doel?.soort === "priemjacht");
  const pool = jagers.length ? jagers : bottys;
  const ontdekker = pool[Math.floor(Math.random() * pool.length)];

  const { error } = await supabase.from("mega_priemen").insert({
    cijfers, digits,
    ontdekker_naam: ontdekker.naam,
    ontdekker_bid: ontdekker.bid ?? null,
    generatie: ontdekker.generatie ?? null,
  });
  if (error) {
    // unieke-constraint = dit getal was al gevonden
    if ((error as any).code === "23505") return json({ ok: false, reden: "al ontdekt" }, 409);
    return json({ ok: false, reden: "opslaan mislukt" }, 500);
  }

  return json({ ok: true, digits, ontdekker: ontdekker.naam, generatie: ontdekker.generatie ?? null });
});
