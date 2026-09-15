#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// GUARD — A COLUMN DEFAULT MUST NOT ANSWER A JUDGEMENT
//
// The deepest layer of the fabricate-on-empty class. The archived migrations
// carry 1,058 columns shaped like
//
//   child_engaged        boolean NOT NULL DEFAULT true,
//   social_worker_informed boolean NOT NULL DEFAULT true,
//
// (census 2026-09-01: 215 of 408 archived files), plus 66 observation-of-harm
// columns defaulting to false. With such a schema live, an INSERT that omits
// the column records the flattering answer AT THE DATABASE — no route or
// service fix can stop it, because the fabrication happens below them.
//
// This guard scans supabase/migrations — the LIVE directory, the only one that
// gets applied — so promoting an archived migration with a judgement default
// fails CI until the default is removed. The archive itself is deliberately
// not scanned: it is a to-do list, not a deployment path.
//
// ── The rule ────────────────────────────────────────────────────────────────
//
//   • `boolean NOT NULL DEFAULT true` is banned unless the column name is a
//     lifecycle flag (is_active, archived, enabled, …) or allowlisted below.
//   • `DEFAULT false` on an observation-of-harm column (concern/risk/injury/
//     harm/incident/distress/allegation) is banned the same way — "no concerns"
//     must be recorded, never assumed.
//   • The remedy when promoting: drop the DEFAULT (keep NOT NULL so the
//     service must supply the answer — pair with requireFields), or make the
//     column nullable so absence stays absent.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LIVE = path.join(ROOT, "supabase", "migrations");

const LIFECYCLE = /^(is_active|active|archived|deleted|enabled|disabled|is_current|published|draft|visible|hidden|locked|read_only)$/;

/** Verified-correct sites, by column name, with the reason on record. */
const ALLOWED = new Map([
  ["requires_oversight", "defaulting TO oversight is the conservative direction — more scrutiny, never less"],
  ["is_mandatory", "unstated training treated as mandatory — over-requiring compliance is the safe error"],
  ["estimated", "marks a value as an estimate — defaulting to 'estimated' UNDER-claims precision, which is honest"],
  // ── Pre-existing in the APPLIED baseline, pinned so the guard can ship. ──
  // NOT a sign-off: an unassessed missing episode reads as "no contextual
  // safeguarding risk", under-counting the EFH signals the CS engine feeds on.
  // Needs a nullable-column migration (manual live apply) + tri-state
  // consumers; until then the flag means "risk identified", never "assessed
  // safe". Flagged 2026-09-01. Do not add new columns to this section.
  ["contextual_safeguarding_risk", "pre-existing live baseline column — awaiting nullable migration, see note above"],
]);

const HARM = /(concern|risk|injur|harm|incident|distress|allegat)/;
const ACTION_PENDING = /(notified|informed|referred|reported|escalated|shared|reviewed|completed|submitted|sent|applied|obtained|scheduled|conducted)$/;

const files = fs.readdirSync(LIVE).filter((f) => f.endsWith(".sql"));
if (files.length < 5) {
  console.error(`check-migration-defaults: only ${files.length} live migration(s) found — expected 5+. Refusing to pass vacuously.`);
  process.exit(1);
}

const violations = [];
for (const f of files) {
  const lines = fs.readFileSync(path.join(LIVE, f), "utf8").split("\n");
  lines.forEach((line, i) => {
    let m = /^\s*([a-z0-9_]+)\s+boolean\s+NOT NULL DEFAULT true\b/i.exec(line);
    if (m && !LIFECYCLE.test(m[1]) && !ALLOWED.has(m[1])) {
      violations.push(`  ${f}:${i + 1} — ${m[1]} boolean NOT NULL DEFAULT true`);
      return;
    }
    m = /^\s*([a-z0-9_]+)\s+boolean\s+(?:NOT NULL\s+)?DEFAULT false\b/i.exec(line);
    if (m && HARM.test(m[1]) && !ACTION_PENDING.test(m[1]) && !ALLOWED.has(m[1])) {
      violations.push(`  ${f}:${i + 1} — ${m[1]} DEFAULT false (observation of harm)`);
    }
  });
}

if (violations.length > 0) {
  console.error(
    "\ncheck-migration-defaults: a column default must not answer a judgement.\n\n" +
    violations.join("\n") + "\n\n" +
    "An INSERT that omits the column would record the flattering answer at the\n" +
    "database, below every route and service check. Drop the DEFAULT (keep NOT\n" +
    "NULL so callers must supply the answer), make the column nullable, or — if\n" +
    "the default is genuinely correct — add the column to ALLOWED in this file\n" +
    "with its reason.\n"
  );
  process.exit(1);
}

console.log(`check-migration-defaults: ${files.length} live migration(s) scanned — no judgement-answering column defaults ✓ (${ALLOWED.size} allowlisted)`);
