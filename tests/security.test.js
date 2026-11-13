// Run: deno test --allow-read tests/security.test.js
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
function assert(ok) { if (!ok) throw new Error('Assertion failed'); }
const root = new URL('../supabase/functions/', import.meta.url);
const source = readFileSync(new URL('hive-tick/index.ts', root), 'utf8');
const start = source.indexOf('Deno.serve(async (req) => {') + 'Deno.serve(async (req) => {'.length;
const prefix = source.slice(start, source.indexOf('  // Lees alleen de kolommen', start))
  .replace('let vraag: any', 'let vraag').replace('const chunks: Uint8Array[]', 'const chunks');
async function tick(body, { method = 'POST', recent = false, error = null } = {}) {
  let reads = 0;
  const context = vm.createContext({ Request, Response, TextDecoder, Uint8Array, Date, CORS: {}, TICK_THROTTLE_MS: 5000,
    supabase: { from(table) {
      reads++;
      assert(table === 'hive_state');
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: recent ? { last_updated_at: Date.now() } : null, error }) }) }) };
    } }
  });
  // Stop just before the large state read; only the real production guard executes.
  const handler = vm.runInContext('(async (req) => {' + prefix + '\nreturn new Response("accepted"); } catch (e) { throw e; } })', context);
  const response = await handler(new Request('https://example.invalid', { method, ...(body === undefined ? {} : { body }) }));
  return { response, reads };
}
Deno.test('malformed actions and oversized bodies stop before database access', async () => {
  for (const body of ['{', 'null', '[]', '"text"', '{"actie":"unknown"}', '{"actie":true}', '{"actie":"aai"}', '{"actie":"woord","woord":{}}', '{"actie":"broed","ei":7}']) {
    const { response, reads } = await tick(body);
    assert(response.status === 400 && reads === 0);
  }
  const { response, reads } = await tick('x'.repeat(4097));
  assert(response.status === 413 && reads === 0);
});
Deno.test('valid interactions and ordinary ticks share early throttling', async () => {
  for (const body of [undefined, '{}', '{"actie":"aai","bot":"Botty"}', '{"actie":"broed","ei":"egg-1"}', '{"actie":"woord","woord":"hoi"}']) {
    const limited = await tick(body, { recent: true });
    assert(limited.reads === 1);
    assert((await limited.response.json()).skipped === true);
    const accepted = await tick(body);
    assert(accepted.reads === 1 && await accepted.response.text() === 'accepted');
  }
});
Deno.test('preflight, methods and failed database checks are handled safely', async () => {
  const preflight = await tick(undefined, { method: 'OPTIONS' });
  assert(preflight.response.status === 200 && preflight.reads === 0);
  const get = await tick(undefined, { method: 'GET' });
  assert(get.response.status === 405 && get.reads === 0);
  const failed = await tick(undefined, { error: { message: 'unavailable' } });
  assert(failed.response.status === 503);
});
for (const name of ['notify-sweep', 'verhaal-sweep']) {
  const code = readFileSync(new URL(name + '/index.ts', root), 'utf8');
  const match = code.match(/if \(!SWEEP_KEY[^]*?\n  }/);
  assert(match);
  Deno.test(name + ' rejects missing, empty and incorrect secrets', () => {
    for (const secret of ['', 'configured-secret']) {
      for (const header of [null, '', 'wrong', 'configured-secret']) {
        const context = vm.createContext({ SWEEP_KEY: secret, Response, req: { headers: new Headers(header === null ? {} : { 'x-sweep-key': header }) } });
        const response = vm.runInContext('(() => {' + match[0] + '\nreturn new Response("accepted"); })()', context);
        assert(response.status === (secret && header === secret ? 200 : 403));
      }
    }
  });
}
