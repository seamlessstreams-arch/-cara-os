#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: no `new Date(year, month, day)` in shipped code.
//
// The multi-argument Date constructor builds LOCAL midnight. Converting that
// to an ISO string and slicing the date off gives the PREVIOUS day whenever the
// local zone is ahead of UTC — which London is for seven months of the year:
//
//   TZ=Europe/London
//   new Date(2026, 2, 3).toISOString().slice(0, 10)   // "2026-03-03"  (GMT, right)
//   new Date(2026, 3, 28).toISOString().slice(0, 10)  // "2026-04-27"  (BST, a day early)
//
// A series built this way is only SOMETIMES wrong, which is worse than always:
// the March entries look correct and the April ones quietly slip a day.
//
// Use Date.UTC(y, m, d) when you mean a calendar date, or londonDateStr(instant)
// from @/lib/utils when you mean "the London date of this moment". This sits
// alongside the .getHours()/.getDay() bans from the same London-dates work.
//
// Found by the fix for on-shift access at the London/UTC boundary: the census
// for that turned up 12 candidate sites, of which 10 were the correct
// UTC-midnight round-trip and exactly these 2 were real.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SCAN_DIRS = [path.join(ROOT, "src")];
// Tests may construct local dates deliberately to exercise timezone behaviour.
const SKIP_DIR = /(^|\/)(node_modules|__tests__)$/;
const SKIP_FILE = /\.test\.tsx?$/;

// Three-or-more numeric arguments — `new Date(ms)` and `new Date("...")` are fine.
const LOCAL_CTOR = /new Date\(\s*\d{4}\s*,\s*[^,)]+,[^)]*\)/g;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIR.test(p)) walk(p, out);
    } else if (/\.tsx?$/.test(e.name) && !SKIP_FILE.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

const violations = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const rel = path.relative(ROOT, file);
    fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) return;
      LOCAL_CTOR.lastIndex = 0;
      let m;
      while ((m = LOCAL_CTOR.exec(line)) !== null) {
        if (/Date\.UTC/.test(m[0])) continue;
        violations.push(`${rel}:${i + 1}  ${m[0]}`);
      }
    });
  }
}

if (violations.length > 0) {
  console.error(
    `\ncheck-local-date-ctor: ${violations.length} local-midnight Date constructor(s).\n` +
      "new Date(y, m, d) is LOCAL midnight; sliced to an ISO date it lands on the previous\n" +
      "day whenever London is ahead of UTC, so the series is right in GMT and a day early in BST:\n",
  );
  for (const v of violations) console.error("  ✗ " + v);
  console.error(
    "\nUse Date.UTC(y, m, d) for a calendar date, or londonDateStr(instant) from @/lib/utils\n" +
      "for \"the London date of this moment\".",
  );
  process.exit(1);
}
console.log("Local-date-ctor guard passed: no local-midnight Date constructors in shipped code.");
