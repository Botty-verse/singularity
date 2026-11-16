// deno test --allow-read --allow-env tests/tick-gate.test.js
import { PGlite } from 'npm:@electric-sql/pglite@0.3.14';
import { readFileSync } from 'node:fs';
function assert(ok) { if (!ok) throw new Error('Assertion failed'); }
Deno.test('database gate serializes admission, fences stale writes and commits history atomically', async () => {
 const db = new PGlite();
 try {
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create table hive_state(id text primary key, bottys jsonb, first_opened bigint, acties integer, last_updated_at bigint, last_kweek jsonb, eieren jsonb, ia_bucket jsonb);
 create table geboorten(id bigint generated always as identity primary key, ts timestamptz default now(), kind_id text not null, kind_naam text not null, generatie integer, oudera_id text, oudera_naam text, ouderb_id text, ouderb_naam text, genome text, grootte real, van_a integer, van_b integer, mutaties integer, verwantschap real, immigrant boolean);
 create table levens(id bigint generated always as identity primary key, ts timestamptz default now(), bid text, naam text not null, generatie integer, geboren timestamptz, gestorven timestamptz, leeftijd_sec integer, oorzaak text, piek_iq integer, vondsten integer, kinderen integer, woorden integer, vrienden integer, niveau integer, genome text);
 create table bezoeker_pings(ts timestamptz);`);
 await db.exec(readFileSync(new URL('../supabase/migrations/20261113160000_atomic_hive_ticks.sql', import.meta.url), 'utf8'));
 const a = '00000000-0000-4000-8000-000000000001', b = '00000000-0000-4000-8000-000000000002';
 const acquire = async (token, interaction = false) => (await db.query('select acquire_hive_tick($1,$2) as ok', [token, interaction])).rows[0].ok;
 const commit = async (token, state, births = [], deaths = []) => (await db.query('select commit_hive_tick($1,$2,$3,$4,false) as ok', [token, state, births, deaths])).rows[0].ok;
 const release = token => db.query('select release_hive_tick($1)', [token]);
 const state = { id: 'main', bottys: [{naam:'A'}], acties:1, first_opened:1, last_updated_at:1, eieren:[], ia_bucket:{} };
 assert(await acquire(a));
 assert(!await acquire(b, true)); // Separate worker cannot enter even with another action kind.
 assert(await commit(a, state, [{kind_id:'child',kind_naam:'Child',generatie:1}], [{naam:'Dead'}]));
 assert(!await commit(a, {...state, acties:999})); // A network retry must not duplicate history.
 await release(b); // Wrong token cannot release someone else's lease.
 assert(!await acquire(b));
 await release(a);
 assert(!await acquire(b, true)); // Releasing retains the global cooldown.
 await db.exec("update hive_tick_gate set admitted_at = now() - interval '6 seconds'");
 assert(await acquire(b));
 assert(!await commit(a, {...state, acties:999}));
 assert((await db.query('select acties from hive_state')).rows[0].acties === 1);
 // A constraint failure rolls back the state AND every history insert.
 let failed = false;
 try { await commit(b, {...state, acties:2}, [{kind_id:'next',kind_naam:'Next'}], [{}]); } catch (_) { failed = true; }
 assert(failed);
 assert((await db.query('select acties from hive_state')).rows[0].acties === 1);
 assert((await db.query('select count(*)::int as n from geboorten')).rows[0].n === 1);
 assert(await commit(b, {...state, acties:2}));
 await db.exec("update hive_tick_gate set lease_until = now() - interval '1 second', admitted_at = now() - interval '6 seconds'");
 assert(!await commit(b, {...state, acties:999})); // Expired lease cannot commit, even before takeover.
 assert(await acquire(a));
 assert(!await commit(b, {...state, acties:999}));
 const perms = await db.query(`select has_function_privilege('anon','acquire_hive_tick(uuid,boolean)','execute') as anon,
 has_function_privilege('authenticated','commit_hive_tick(uuid,jsonb,jsonb,jsonb,boolean)','execute') as auth,
 has_function_privilege('service_role','commit_hive_tick(uuid,jsonb,jsonb,jsonb,boolean)','execute') as service`);
 assert(!perms.rows[0].anon && !perms.rows[0].auth && perms.rows[0].service);
 } finally { await db.close(); }
});
