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

/*
 * Verified-correct sites, kept SEPARATE from the burn-down baseline.
 *
 * The matcher cannot tell "no records exist" from "records were analysed and
 * nothing was found" — and only the first is the bug. A detector that reads a
 * record's own text and finds no concern is reporting a real finding, so
 * scoring it well is right.
 *
 * An entry here is a claim that a human checked it. Keep the reason with it;
 * an allowlist without reasons decays into a silencer.
 */
const ALLOWED = new Map([
  [
    "src/lib/cara-practice/cara-practice-engine.ts:gaps:100",
    "gaps come from detectDevelopmentalGaps(text); the function already returns all-null for an empty record, so zero gaps here means analysed-and-clear",
  ],
  [
    "src/lib/cara-practice/cara-practice-engine.ts:protective:100",
    "detectProtectiveFactors matches WEAK_PROTECTIVE, so zero hits means no unevidenced protective claims were made — guarded by the same empty-record null return",
  ],

  // ── Statement-form leaves ───────────────────────────────────────────────────
  // Sites the EMPTY_RETURN matcher flags that are NOT the bug: a score is only
  // fabricated when it claims QUALITY/COMPLIANCE from an empty population. The
  // entries below either measure adverse-event FREQUENCY (zero events is a real
  // positive), guard a numeric divide-by-zero, apply a documented neutral
  // default, mark a genuinely not-applicable case, or aren't a care score at
  // all. Each was read and judged; the handling/compliance ones were converted
  // to null in the same change rather than allowlisted.
  [
    "src/lib/cara/missing-episodes-intelligence.ts:total:100",
    "scoreFrequency is inverse-frequency (fewer episodes = higher score); zero missing episodes is the safest real outcome, not absent data",
  ],
  [
    "src/lib/cara/safeguarding-intelligence.ts:count:100",
    "scoreMissing/scoreRestraint are inverse-frequency: zero missing/restraint events is a genuine positive, consistent with how Cara scores adverse-event frequency elsewhere",
  ],
  [
    "src/lib/cara/health-appointments-intelligence.ts:overdue.length:100",
    "scoreTimeliness: nothing overdue genuinely IS timely — inverse-frequency, not absence of data (attendance-rate, which IS handling, was converted to null)",
  ],
  [
    "src/lib/cara/sanctions-rewards-intelligence.ts:sanctions.length:100",
    "scoreProportionality: no sanctions issued means none were disproportionate — inverse-frequency",
  ],
  [
    "src/lib/cara/emotional-wellbeing-intelligence.ts:needsTherapy:90",
    "no therapeutic need identified (no referral, no abnormal SDQ, no self-harm) is a real clinical finding, not absent data",
  ],
  [
    "src/lib/cara/family-contact-intelligence.ts:requirements.length:75",
    "no contact-plan requirement recorded = nothing to comply against; neutral by design (a child may have no family-contact order)",
  ],
  [
    "src/lib/cara/outcome-tracker.ts:ind.target:100",
    "divide-by-zero guard on a numeric target (ind.target === 0), not an empty collection; a zero-target indicator is vacuously met",
  ],
  [
    "src/lib/recording-quality/recording-quality-engine.ts:isRiskRelated:100",
    "scoreRiskRelevance: a record that is not risk-related is not-applicable and must not be dragged down — not a fabricated quality claim",
  ],
  [
    "src/lib/command-palette/rank.ts:wordStart:76",
    "search-relevance ranking (word-boundary match scores 76), not a care-quality score",
  ],
  // oversight/scoring.ts: documented neutral defaults (no checks ⇒ 60), and a
  // vacuously-complete referral score (nothing required ⇒ complete). 60 is a
  // warn-band midpoint, not a flattering pass.
  ["src/lib/oversight/scoring.ts:checks.length:60", "boolScore documented neutral default: no checks ⇒ 60 (warn midpoint, not a pass)"],
  ["src/lib/oversight/scoring.ts:parts.length:60", "composite of neutral sub-scores ⇒ 60 when no parts measured"],
  ["src/lib/oversight/scoring.ts:pa:60", "neutral 60 default when the sub-score input is absent"],
  ["src/lib/oversight/scoring.ts:pc:60", "neutral 60 default when the sub-score input is absent"],
  ["src/lib/oversight/scoring.ts:pr:60", "neutral 60 default when the sub-score input is absent"],
  ["src/lib/oversight/scoring.ts:wf:60", "neutral 60 default when the sub-score input is absent"],
  ["src/lib/oversight/scoring.ts:required.length:100", "referralCompletionScore: nothing required ⇒ vacuously complete"],
]);

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
// Statement form of the same lie, which the ternary matchers miss:
//   if (xs.length === 0) return 100;   /   if (!xs.length) return 90;
// A score function that early-returns a flattering literal for an empty
// population is fabricating exactly as `xs.length ? … : 100` does — it just
// spells it with `if`/`return`. Bounded, single-line, so it cannot swallow an
// unrelated later return.
const EMPTY_RETURN = /if\s*\(\s*!?\s*(\w+(?:\.\w+)*)(?:\.length)?\s*(?:===?\s*0|<\s*1)?\s*\)\s*return\s+(\d{2,3})\s*;/g;

const found = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const src = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file);
    for (const re of [NON_EMPTY_TERNARY, EMPTY_TERNARY, EMPTY_RETURN]) {
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

const fresh = found.filter((f) => !BASELINE.has(f.key) && !ALLOWED.has(f.key));
// A baselined key that no longer appears has been fixed (or moved) — drop it
// from the list so the baseline can only ever shrink.
const foundKeys = new Set(found.map((f) => f.key));
const stale = [...BASELINE].filter((k) => !foundKeys.has(k));
// An allowlist entry whose site is gone is no longer vouching for anything;
// leaving it would let a future site silently inherit someone else's sign-off.
const staleAllowed = [...ALLOWED.keys()].filter((k) => !foundKeys.has(k));

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

if (staleAllowed.length > 0) {
  failed = true;
  console.error(
    `\ncheck-fabricated-scores: ${staleAllowed.length} allowlisted site(s) no longer exist.\n` +
      "Remove them from the ALLOWED map in this file — a sign-off must point at real code:\n",
  );
  for (const k of staleAllowed) console.error(`  – ${k}`);
}

if (failed) process.exit(1);

const remaining = BASELINE.size > 0
  ? `${BASELINE.size} baselined site(s) remaining to burn down`
  : "baseline empty — the class is fully burned down";
console.log(
  `check-fabricated-scores: no new fabricated-on-empty scores ✓ (${remaining}; ${ALLOWED.size} verified-correct site(s) allowlisted)`,
);
