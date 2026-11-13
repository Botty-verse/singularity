// deno test --allow-read tests/404-security.test.js
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'npm:linkedom@0.18.12';
const html = readFileSync(new URL('../404.html', import.meta.url), 'utf8');
const start = html.indexOf('    tbody.replaceChildren();');
const code = html.slice(start, html.indexOf('\n  })();', start));
function assert(v) { if (!v) throw new Error('Assertion failed'); }
Deno.test('404 logs cannot create HTML or unsafe links; valid links retain formatting', () => {
 const { document } = parseHTML('<html><body><table><tbody></tbody></table></body></html>');
 const tbody = document.querySelector('tbody');
 const attack = '<img src=x onerror=alert(1)>';
 const hits = ['javascript:alert(1)', 'data:text/html,' + attack, 'https://example.org/" onclick="alert(1)', null, 'https://example.org/a'].map(referrer => ({ ts: '2026-11-13T00:00:00Z', path: attack, referrer }));
 vm.runInNewContext(code, { document, tbody, hits, window: {}, Date, URL });
 assert(tbody.querySelectorAll('tr').length === 5);
 assert(tbody.querySelectorAll('img,script,[onclick],[onerror]').length === 0);
 for (const a of tbody.querySelectorAll('a')) assert(/^https?:/.test(a.href));
 assert(tbody.querySelectorAll('a').length === 2);
 assert(tbody.querySelector('td:nth-child(2)').textContent === attack);
 vm.runInNewContext(code, { document, tbody, hits, window: {}, Date, URL });
 assert(tbody.querySelectorAll('tr').length === 5); // Refresh replaces rather than appends.
});
