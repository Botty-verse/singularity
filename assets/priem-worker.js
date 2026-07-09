/*
 * priem-worker.js — draait in een Web Worker (aparte thread) zodat de UI soepel
 * blijft. Zoekt enorme WAARSCHIJNLIJKE priemen (honderden cijfers) met BigInt
 * Miller-Rabin. Dit is het zware rekenwerk dat we van de bezoeker "lenen".
 *
 * Protocol:
 *   main → worker : { type:"start", digits, rondes }   start zoeken
 *   main → worker : { type:"stop" }                     stoppen
 *   worker → main : { type:"bezig", pogingen }          voortgang (elke ~250 pogingen)
 *   worker → main : { type:"vondst", cijfers, digits, pogingen }
 */
"use strict";

var actief = false;
var DIGITS = 130;
var RONDES = 20;

function randOdd(digits) {
  // willekeurig oneven getal met exact `digits` cijfers
  var eerste = "123456789"[Math.floor(Math.random() * 9)];
  var s = eerste;
  for (var i = 1; i < digits - 1; i++) s += Math.floor(Math.random() * 10);
  s += "13579"[Math.floor(Math.random() * 5)];   // oneven slot
  return BigInt(s);
}

function modpow(base, exp, mod) {
  var r = 1n; base %= mod;
  while (exp > 0n) {
    if (exp & 1n) r = (r * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return r;
}

function randBelow(max) {
  var bits = max.toString(2).length;
  var bytes = Math.ceil(bits / 8);
  var x;
  do {
    var buf = new Uint8Array(bytes);
    (self.crypto || crypto).getRandomValues(buf);
    x = 0n;
    for (var i = 0; i < buf.length; i++) x = (x << 8n) | BigInt(buf[i]);
    x %= max;
  } while (x < 2n);
  return x;
}

var KLEIN = [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n,41n,43n,47n];

function isPriem(n, rondes) {
  for (var k = 0; k < KLEIN.length; k++) {
    if (n === KLEIN[k]) return true;
    if (n % KLEIN[k] === 0n) return false;
  }
  var d = n - 1n, r = 0n;
  while ((d & 1n) === 0n) { d >>= 1n; r++; }
  for (var i = 0; i < rondes; i++) {
    var a = randBelow(n - 2n);
    var x = modpow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    var door = false;
    for (var j = 1n; j < r; j++) {
      x = (x * x) % n;
      if (x === n - 1n) { door = true; break; }
    }
    if (!door) return false;
  }
  return true;
}

function zoekStap() {
  if (!actief) return;
  var pogingen = 0;
  // Werk in blokjes zodat we tussendoor stop/berichten kunnen verwerken.
  var deadline = Date.now() + 400;
  while (actief && Date.now() < deadline) {
    var kandidaat = randOdd(DIGITS);
    pogingen++;
    if (isPriem(kandidaat, RONDES)) {
      postMessage({ type: "vondst", cijfers: kandidaat.toString(), digits: DIGITS, pogingen: pogingen });
      pogingen = 0;
    }
  }
  if (pogingen) postMessage({ type: "bezig", pogingen: pogingen });
  if (actief) setTimeout(zoekStap, 0);
}

onmessage = function (e) {
  var m = e.data || {};
  if (m.type === "start") {
    DIGITS = Math.max(80, Math.min(400, m.digits | 0 || 130));
    RONDES = Math.max(8, Math.min(40, m.rondes | 0 || 20));
    if (!actief) { actief = true; zoekStap(); }
  } else if (m.type === "stop") {
    actief = false;
  }
};
