#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: day COUNTS are London calendar days, never rolling 24-hour windows.
//
// "Nd overdue" / "due in Nd" / "N days since" computed as
// Math.floor|ceil|round((a - b) / 86400000) anchored on the wall clock is
// wrong for part of every day: floor(due - now) says "0d left" for a task due
// TOMORROW from ~01:00 London; round says it from ~13:00; ceil(now - start)
// overcounts "days since" from ~01:00 — and a date-only operand parses as UTC
// midnight (01:00 BST), shifting every boundary. ~160 sites across 117 files
// were swept onto londonDayDiff() in #906; this keeps the next one out.
//
// A line is flagged when it BOTH divides by a day of milliseconds AND anchors
// on the wall clock (Date.now(), new Date(), or a now/today variable's ms).
// Two-record durations — daysBetween(a.date, b.date) style, no "now" — are a
// different, legitimate question and are deliberately not matched.
//
// Fix: londonDayDiff(date) from @/lib/utils — or londonDayDiff(date, now)
// where the caller takes an injectable clock.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

// Verified calendar-exact by hand in #906 and left alone on purpose:
// each anchors on a LONDON date-only value (todayStr()-derived), so both
// operands parse as UTC midnights of London calendar days and the division is
// exact — the rolling-window failure mode cannot occur.
const ALLOWED = new Set([
  "src/app/(platform)/quality/reg-44/page.tsx",
  "src/app/(platform)/placement-disruption-prevention-plan/page.tsx",
  "src/app/api/v1/handover/staff-context/route.ts",
  "src/app/api/v1/staff/[id]/route.ts",
  "src/lib/utils.ts", // londonDayDiff's own implementation divides by 86400000
]);

// The trailing \b applied to every alternative, including the parenthesised
// ones — and a word boundary cannot match after a closing paren, so
// `/ (1000 * 60 * 60 * 24)` was never recognised as a day divisor at all.
// 66 sites write it that way. The boundary now applies only to the
// alternatives that end in a word character, where it is doing real work.
const DAY_MS =
  /\/\s*(?:(?:86400000|86_400_000|864e5|msPerDay|MS_PER_DAY|DAY_MS)\b|\(1000 \* 60 \* 60 \* 24\)|\(24 \* 60 \* 60 \* 1000\)|\(60 \* 60 \* 24 \* 1000\))/;
const NOW_ANCHOR =
  /Date\.now\(\)|new Date\(\)|\bnow(?:Ms)?\s*\.getTime\(\)|\btoday\s*\.getTime\(\)|\(\s*now(?:Ms)?\s*-|-\s*now(?:Ms)?\s*\)/;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      yield* walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
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
    if (DAY_MS.test(line) && NOW_ANCHOR.test(line)) {
      violations.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
    }
  });
}

if (violations.length) {
  console.error(
    `check-rolling-day-maths: ${violations.length} rolling-window day count(s).\n` +
      `A day count anchored on the wall clock reads a day off for part of every day\n` +
      `(worst in BST). Use londonDayDiff(date) from @/lib/utils — or\n` +
      `londonDayDiff(date, now) where the caller takes an injectable clock.\n`
  );
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log("check-rolling-day-maths: no wall-clock day divisions outside the pinned exclusions.");
