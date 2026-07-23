#!/usr/bin/env node
/*
 * check-fabricated-scores.js — an empty population must not score as compliant.
 *
 * The class this guards:
 *
 *   const trainingRate = mandatory.length > 0
 *     ? Math.round((completed / mandatory.length) * 100)
 *     : 100;                                 // ← zero records reads as "100% compliant"
 *
 *   On a newly-provisioned children's home that reports "100% training
 *   compliance, 100% DBS, 100% supervision" when NOTHING has been evidenced.
 *   It was found live: Oak House had one child, one staff member and no
 *   incidents, medications, MARs, training or supervisions on record, and the
 *   health check reported 99% overall / 100% safeguarding — the defaults
 *   outvoted the single real signal.
 *
 *   Ofsted judges a home on the evidence it can show, so an empty register is
 *   the finding, not a pass. A fabricated high score does not merely mislead a
 *   manager, it tells them to stop looking.
 *
 * THE RULE: when the denominator is empty the answer is "not yet measured", so
 * use the shared helpers in src/lib/metrics/rate.ts —
 *
 *   rate(numerator, denominator)   → number | null   (null when denominator <= 0)
 *   rateOf(matching, all)          → number | null
 *   meanOf(values)                 → ignores nulls rather than counting them
 *   weightedMeanOf(entries)        → renormalises the weights over what IS measured
 *   meets(score, n) / below(score, n) → unmeasured is never a pass AND never a breach
 *   formatRate(score)              → "—" for unmeasured
 *
 * Note `?? 0` is the same lie pointing the other way: it manufactures a failure
 * out of silence, and a red zero is just as false as a green hundred. This guard
 * only catches the flattering direction, which is the dangerous one, but treat
 * both as the same bug.
 *
 * BASELINE: sites that predate this guard are listed below so it can be
 * enforced immediately and burned down over time. Deleting entries as they are
 * fixed is the point — the guard fails if a baselined entry no longer matches,
 * so the list cannot rot.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SCAN_DIRS = [path.join(ROOT, "src", "app"), path.join(ROOT, "src", "lib")];

// Anything at or above this reads as reassuring to a manager scanning a
// dashboard. Below it, a default is still wrong but not actively flattering.
const FLATTERING = 60;

/*
 * Known sites, `relative/path.ts:collection:value`. Each is a real instance of
 * the class that has not been converted yet. Fix them by moving to the helpers
 * above, then delete the line.
 */
const BASELINE = new Set(require("./fabricated-scores-baseline.json"));

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

// `xs.length > 0 ? <computed> : 92` and `xs.length ? … : 92`, across newlines
// because these ternaries are usually wrapped. The body is bounded so the match
// cannot run past the end of the expression into an unrelated literal.
const NON_EMPTY_TERNARY = /(\w+(?:\.\w+)*)\.length\s*(?:>\s*0\s*)?\?[\s\S]{0,220}?:\s*(\d{2,3})\b/g;
// `xs.length === 0 ? 92 : <computed>`
const EMPTY_TERNARY = /(\w+(?:\.\w+)*)\.length\s*===?\s*0\s*\?\s*(\d{2,3})\b/g;

const found = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const src = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file);
    for (const re of [NON_EMPTY_TERNARY, EMPTY_TERNARY]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src)) !== null) {
        const value = Number(m[2]);
        if (value < FLATTERING || value > 100) continue;
        const line = src.slice(0, m.index).split("\n").length;
        found.push({ key: `${rel}:${m[1]}:${value}`, rel, line, collection: m[1], value });
      }
    }
  }
}

const fresh = found.filter((f) => !BASELINE.has(f.key));
// A baselined key that no longer appears has been fixed (or moved) — drop it
// from the list so the baseline can only ever shrink.
const foundKeys = new Set(found.map((f) => f.key));
const stale = [...BASELINE].filter((k) => !foundKeys.has(k));

let failed = false;

if (fresh.length > 0) {
  failed = true;
  console.error(
    `check-fabricated-scores: ${fresh.length} new site(s) score an EMPTY population as compliant.\n` +
      "A percentage with no records behind it must be null (\"not yet measured\"), not a high number:\n",
  );
  for (const f of fresh) {
    console.error(`  ✗ ${f.rel}:${f.line} — empty \`${f.collection}\` yields ${f.value}`);
  }
  console.error("\nUse rate()/rateOf()/meanOf()/weightedMeanOf() from src/lib/metrics/rate.ts. See this file's header.");
}

if (stale.length > 0) {
  failed = true;
  console.error(
    `\ncheck-fabricated-scores: ${stale.length} baselined site(s) no longer match — they look fixed.\n` +
      "Remove them from scripts/fabricated-scores-baseline.json so the baseline keeps shrinking:\n",
  );
  for (const k of stale) console.error(`  – ${k}`);
}

if (failed) process.exit(1);

console.log(
  `check-fabricated-scores: no new fabricated-on-empty scores ✓ (${BASELINE.size} baselined site(s) remaining to burn down)`,
);
