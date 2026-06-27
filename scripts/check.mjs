#!/usr/bin/env node
/*
 * Lichte CI-check (geen build): vangt syntaxfouten vóór ze live gaan.
 *  1. node --check op alle assets/*.js
 *  2. elk inline <script> in de HTML-pagina's syntactisch valideren
 *     (module vs. classic op basis van type="module")
 *  3. controleren dat elke <script src="assets/..."> echt bestaat
 *
 * Faalt met exit code 1 zodra er iets niet klopt.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

const root = process.cwd();
let fouten = 0;
const tmp = mkdtempSync(join(tmpdir(), "bottycheck-"));

function checkSyntax(code, label, asModule) {
  const file = join(tmp, "snippet" + (asModule ? ".mjs" : ".cjs"));
  writeFileSync(file, code);
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    return true;
  } catch (e) {
    console.error(`✗ ${label}\n${(e.stderr || e.stdout || e.message).toString().trim()}\n`);
    fouten++;
    return false;
  }
}

// 1. Gedeelde modules
const assetsDir = join(root, "assets");
if (existsSync(assetsDir)) {
  for (const f of readdirSync(assetsDir).filter(n => n.endsWith(".js"))) {
    if (checkSyntax(readFileSync(join(assetsDir, f), "utf8"), `assets/${f}`, false)) {
      console.log(`✓ assets/${f}`);
    }
  }
}

// 2 + 3. HTML-pagina's
const htmlFiles = readdirSync(root).filter(n => n.endsWith(".html"));
const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
for (const f of htmlFiles) {
  const html = readFileSync(join(root, f), "utf8");
  let m, idx = 0, okBlocks = 0;
  while ((m = scriptRe.exec(html)) !== null) {
    const attrs = m[1], body = m[2];
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      const src = srcMatch[1];
      if (src.startsWith("assets/") && !existsSync(join(root, src))) {
        console.error(`✗ ${f}: ontbrekend script-bestand "${src}"`);
        fouten++;
      }
      continue; // externe/asset-src: geen inline body om te checken
    }
    if (!body.trim()) continue;
    const asModule = /type\s*=\s*["']module["']/i.test(attrs);
    if (checkSyntax(body, `${f} <script #${++idx}>`, asModule)) okBlocks++;
  }
  console.log(`✓ ${f} (${okBlocks} inline script-blok(ken) ok)`);
}

if (fouten) {
  console.error(`\n❌ ${fouten} probleem/problemen gevonden.`);
  process.exit(1);
}
console.log("\n✅ Alles syntactisch in orde.");
