#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: "today" must be Europe/London, never UTC.
//
// The homes are in the UK and their records are legal documents, so the day a
// record is filed under has to be the day the staff on shift are living in.
// `new Date().toISOString().slice(0, 10)` is the UTC day: during BST (about
// half the year) anything written between 00:00 and 00:59 was dated YESTERDAY —
// and night shifts are exactly when incidents, medication rounds and
// missing-from-care episodes get recorded.
//
// 855 of these were swept out of 421 files; this keeps them out. Use todayStr()
// / londonDateStr() from @/lib/utils instead.
//
// Only the NO-ARG form is banned. `someStoredDate.toISOString().slice(0, 10)`
// formats an instant that is already fixed, which is a different question.
//
// Tests are out of scope (and were skipped by the sweep): they build `asOf`
// inputs for pure functions rather than filing records, so the zone there is
// the test's own business.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

// utils.ts is where the London-correct helpers are defined.
const ALLOWED = new Set(["src/lib/utils.ts"]);

const BANNED = [
  /new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/,
  /new Date\(\)\.toISOString\(\)\.split\(["']T["']\)\[0\]/,
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      yield* walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) {
      yield full;
    }
  }
}

const violations = [];
for (const file of walk("src")) {
  const rel = file.split(path.sep).join("/");
  if (ALLOWED.has(rel)) continue;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (BANNED.some((re) => re.test(line))) {
      violations.push(`${rel}:${i + 1}  ${line.trim().slice(0, 90)}`);
    }
  });
}

if (violations.length > 0) {
  console.error('UTC-today guard FAILED — "today" computed in UTC files records under the wrong day during BST:');
  for (const v of violations) console.error("  " + v);
  console.error("Use todayStr() (or londonDateStr(d)) from @/lib/utils.");
  process.exit(1);
}
console.log('UTC-today guard passed: no UTC "today" outside src/lib/utils.ts.');
