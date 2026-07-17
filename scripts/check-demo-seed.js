#!/usr/bin/env node
/*
 * check-demo-seed.js — go-live guard for client-side demo fiction.
 *
 * Some platform pages render a hardcoded DEMO_ array directly as their data
 * (useState initialiser, or an array they .map/.filter/.reduce over) with no
 * API behind it. On a live tenant (NEXT_PUBLIC_CARA_MODE=live) that fiction —
 * fictional children, professionals, drafts — renders as if it were the home's
 * own records. The store gates never reach it because the data never leaves the
 * component.
 *
 * The fix is to route the seed through demoSeed()/demoSeedOne() from
 * @/lib/demo/demo-seed, which returns empty on a live tenant. This guard fails
 * if a page uses a DEMO_ array as data without importing that helper, so the
 * class cannot silently return.
 *
 * Heuristic, deliberately matched to the audit that found the class:
 *   OFFENCE  = a page that (useState(DEMO_…) | DEMO_….map/filter/reduce/slice
 *              /find/sort | = DEMO_…) — i.e. renders a DEMO_ array as data
 *   CLEARED  = that page imports from "@/lib/demo/demo-seed"
 * A page that references DEMO_ only as a type or a label never trips the data
 * patterns, so it is not required to import the helper.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "app", "(platform)");
const HELPER = "@/lib/demo/demo-seed";

// Renders a DEMO_ array AS DATA (not merely as a type or a label).
const DATA_USE = /useState[^)]*\bDEMO_[A-Z0-9_]+|\bDEMO_[A-Z0-9_]+\.(filter|map|reduce|slice|find|sort|length)\b|=\s*DEMO_[A-Z0-9_]+\b/;

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
  if (!DATA_USE.test(src)) continue; // does not render a DEMO_ array as data
  // Routed through the gate anywhere in the file → cleared. demoSeed() wraps the
  // seed at the data source, so the raw DEMO_… tokens can remain.
  if (src.includes(HELPER)) continue;
  offenders.push(path.relative(path.join(__dirname, ".."), file));
}

if (offenders.length > 0) {
  console.error(
    `check-demo-seed: ${offenders.length} page(s) render a DEMO_ array as data without the live-tenant gate.\n` +
      `Route the seed through demoSeed()/demoSeedOne() from "${HELPER}" so a live tenant renders empty, not fiction:\n`,
  );
  for (const o of offenders) console.error(`  ✖ ${o}`);
  process.exit(1);
}

console.log("check-demo-seed: no ungated client-side demo fiction ✓");
