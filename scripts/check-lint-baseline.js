#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// GUARD — LINT RATCHET (per-rule baseline; counts may only fall)
//
// The 2026-08-17 census: 10,910 eslint findings, 90% of them two rules, only 19
// auto-fixable. Nobody fixes that before adding a gate — so the gate comes
// first. This guard runs the full lint, counts findings PER RULE, and compares
// against scripts/lint-baseline.json:
//
//   a rule's count grew            → FAIL: new lint debt does not land
//   a rule's count fell            → FAIL: shrink the baseline in the same PR,
//                                     so the improvement can never regress
//   a rule appeared from nowhere   → FAIL (growth from zero)
//   a baselined rule reads zero    → FAIL (leg 2: remove the entry)
//
// Per-rule, not a single total, because a total lets 50 new `any`s hide behind
// 50 deleted unused imports. Every class ratchets independently.
//
// ── The eslint-major pin ────────────────────────────────────────────────────
// eslint 10 CRASHES in this repo (eslint-config-next's bundled
// eslint-plugin-react still calls the removed context.getFilename — PR #949,
// held). A crashed lint produces zero findings, and zero findings on a
// non-empty baseline would fail leg 2 with a misleading message — so the major
// is asserted up front with a pointer to the real blocker.
//
// ── Regenerating ────────────────────────────────────────────────────────────
//   node scripts/check-lint-baseline.js --update     # rewrite baseline to now
//
// On any mismatch the guard prints the corrected baseline JSON, so a burn-down
// PR copies it rather than hand-editing counts.
//
// LINT_BASELINE_JSON=<path> skips running eslint and reads results from a file
// — a testing seam for can-fail proofs (a full lint run costs 6–8 minutes).
// CI never sets it.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BASELINE_PATH = path.join(ROOT, "scripts", "lint-baseline.json");
// Messages with no ruleId are eslint's unused-disable-directive reports; give
// them a stable name so stale suppressions ratchet like everything else.
const NO_RULE = "__unused-disable-directive__";

function fail(msg) {
  console.error(`\ncheck-lint-baseline: ${msg}\n`);
  process.exit(1);
}

// ── 0. The eslint major must be the one this repo can actually run ──────────
const eslintVersion = require(path.join(ROOT, "node_modules", "eslint", "package.json")).version;
if (!eslintVersion.startsWith("9.")) {
  fail(
    `eslint is ${eslintVersion}, but this repo can only lint under eslint 9 — ` +
      "eslint 10 crashes on eslint-config-next's bundled eslint-plugin-react " +
      "(removed context.getFilename; see held PR #949). Pin eslint 9 or unhold " +
      "#949 only after the upstream fix ships AND this guard passes under it.",
  );
}

// ── 1. Run the lint (or read the seam) ──────────────────────────────────────
function lintResults() {
  const seam = process.env.LINT_BASELINE_JSON;
  if (seam) {
    console.log(`check-lint-baseline: reading results from ${seam} (testing seam)`);
    return JSON.parse(fs.readFileSync(seam, "utf8"));
  }

  execFileSync("node", [path.join(ROOT, "scripts", "link-eslint-ts6.js")], { stdio: "inherit" });
  const out = path.join(os.tmpdir(), `lint-baseline-${process.pid}.json`);
  try {
    // eslint exits 1 whenever error-severity findings exist, which is the
    // steady state until the burn-down completes — only a MISSING report file
    // is a real failure.
    execFileSync("npx", ["eslint", ".", "--format", "json", "--output-file", out], {
      cwd: ROOT,
      stdio: ["ignore", "inherit", "inherit"],
    });
  } catch {
    if (!fs.existsSync(out)) fail("eslint did not produce a report — it crashed before linting.");
  }
  const results = JSON.parse(fs.readFileSync(out, "utf8"));
  fs.unlinkSync(out);
  return results;
}

const results = lintResults();

// Non-vacuity: an implausibly small file count means the scan broke (bad cwd,
// broken config, over-wide ignore) — passing on that would be the guard
// covering its own eyes.
if (results.length < 5000) {
  fail(`only ${results.length} files were linted — the scan is broken, not the code clean.`);
}

const counts = {};
for (const file of results) {
  for (const m of file.messages ?? []) {
    const rule = m.ruleId ?? NO_RULE;
    counts[rule] = (counts[rule] ?? 0) + 1;
  }
}

const render = (obj) =>
  JSON.stringify(Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))), null, 1) + "\n";

// ── 2. --update rewrites the baseline to the current truth ──────────────────
if (process.argv.includes("--update")) {
  fs.writeFileSync(BASELINE_PATH, render(counts));
  console.log(`check-lint-baseline: baseline rewritten — ${Object.values(counts).reduce((a, b) => a + b, 0)} findings across ${Object.keys(counts).length} rules.`);
  process.exit(0);
}

// ── 3. Compare ──────────────────────────────────────────────────────────────
if (!fs.existsSync(BASELINE_PATH)) {
  console.error("\ncheck-lint-baseline: no baseline committed yet. Current counts:\n");
  console.error(render(counts));
  fail("commit the above as scripts/lint-baseline.json (or run with --update).");
}
const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));

const grew = [];
const shrank = [];
for (const rule of new Set([...Object.keys(counts), ...Object.keys(baseline)])) {
  const now = counts[rule] ?? 0;
  const was = baseline[rule] ?? 0;
  if (now > was) grew.push(`  ${rule}: ${was} → ${now}  (+${now - was})`);
  else if (now < was) shrank.push(`  ${rule}: ${was} → ${now}  (-${was - now})`);
}

if (grew.length || shrank.length) {
  console.error("\ncheck-lint-baseline: per-rule counts have drifted from the baseline.\n");
  if (grew.length) {
    console.error("GREW — new lint debt; fix the findings, do not raise the baseline:\n" + grew.join("\n") + "\n");
  }
  if (shrank.length) {
    console.error("SHRANK — good; lock it in by shrinking the baseline in this PR:\n" + shrank.join("\n") + "\n");
  }
  console.error("Corrected baseline (valid ONLY for the shrink case — copy verbatim):\n");
  console.error(render(counts));
  process.exit(1);
}

const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(
  `check-lint-baseline: ${results.length} files linted under eslint ${eslintVersion} — ` +
    `${total} findings across ${Object.keys(counts).length} rules, all at or below baseline ✓`,
);
