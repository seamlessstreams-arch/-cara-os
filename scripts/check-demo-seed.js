#!/usr/bin/env node
/*
 * check-demo-seed.js — go-live guard for client-side demo fiction.
 *
 * Some platform pages hardcode demo data as `const DEMO_… = [ … ]` (or `{ … }`)
 * and render it directly, with no API behind it. On a live tenant
 * (NEXT_PUBLIC_CARA_MODE=live) that fiction — fictional children, professionals,
 * drafts, stats — renders as if it were the home's own records. The store gates
 * never reach it because the data never leaves the component.
 *
 * The fix is to route every USE through demoSeed()/demoSeedOne() from
 * @/lib/demo/demo-seed, which returns empty/null on a live tenant.
 *
 * This guard fails on any RAW use of a DEMO_ data structure — a reference that
 * is not wrapped in demoSeed(/demoSeedOne(. An earlier, weaker version only
 * checked that the helper was imported somewhere in the file; that let a page
 * wrap its list render and still leak through a bare `return DEMO_X`, a
 * `DEMO_X[0]`, a `DEMO_X.length` count, or an object-property read. A live-mode
 * crawl caught two such leaks, so the guard now checks every use.
 *
 * SCOPE:
 *   - Only DEMO_ tokens declared as a data structure: `const DEMO_X = [` or `{`.
 *     Scalar config consts (e.g. DEMO_ORG_ID = "org-demo-1", a fetch param, not
 *     rendered fiction) are ignored.
 *   - A use is CLEARED when the token is immediately wrapped: `demoSeed(DEMO_X`
 *     or `demoSeedOne(DEMO_X`.
 *   - The declaration line itself is not a use.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "app", "(platform)");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");

  // Data-structure DEMO_ tokens only (arrays/objects), never scalar config.
  const dataTokens = new Set();
  for (const m of src.matchAll(/\b(const|let)\s+(DEMO_[A-Z0-9_]+)\s*(?::[^=]*)?=\s*[[{]/g)) {
    dataTokens.add(m[2]);
  }
  if (dataTokens.size === 0) continue;

  // A page-level gate — `if (isLiveTenant()) return …` — makes every demo read
  // below it unreachable in live mode. A wholly-demo page (e.g. an all-fixture
  // dashboard) is cleaner gated once at the top than wrapped read-by-read, so a
  // file that carries an explicit page-level gate is trusted. The live-mode
  // crawl is the backstop that this gate actually dominates.
  if (/\bif\s*\(\s*isLiveTenant\(\)\s*\)\s*(\{|return)/.test(src)) continue;

  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const tok of dataTokens) {
      // Every occurrence of the token on this line…
      const re = new RegExp(`\\b${tok}\\b`, "g");
      let m;
      while ((m = re.exec(line)) !== null) {
        const before = line.slice(0, m.index);
        // …skip its own declaration…
        if (new RegExp(`\\b(const|let)\\s+${tok}\\s*(?::|=)`).test(line)) continue;
        // …skip a TYPE position (`typeof DEMO_X`, `: typeof DEMO_X`) — a type
        // annotation renders nothing…
        if (/\btypeof\s*$/.test(before)) continue;
        // …skip when immediately wrapped by the gate…
        if (/demoSeedO?n?e?\(\s*$/.test(before)) continue;
        offenders.push(`${path.relative(path.join(__dirname, ".."), file)}:${i + 1}  ${line.trim().slice(0, 70)}`);
        break;
      }
    }
  }
}

if (offenders.length > 0) {
  console.error(
    `check-demo-seed: ${offenders.length} raw (ungated) use(s) of DEMO_ data on a page.\n` +
      `Wrap every use in demoSeed()/demoSeedOne() from "@/lib/demo/demo-seed" so a live tenant renders empty, not fiction:\n`,
  );
  for (const o of offenders) console.error(`  ✖ ${o}`);
  process.exit(1);
}

console.log("check-demo-seed: no ungated client-side demo data ✓");
