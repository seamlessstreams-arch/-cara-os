#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: seed dates float — no new field-keyed date literals in app code.
//
// A fixed "2026-04-21" in demo data is correct the week it is written and
// wrong every week after: due dates authored as upcoming silently age into
// the past, "recent activity" hollows out of every trend window, and the demo
// quietly rots (2,059 dates had, across two stores and 93 files — #916–#918).
// Seeds use seedDay(offset) from src/lib/seed-date.ts, which re-anchors on
// the current London week every cold start.
//
// REAL-WORLD FACTS ARE THE EXCEPTION and must stay fixed: statutory
// effective-from dates, content-ingestion stamps, config provenance. Floating
// those fakes freshness — the #918 converter briefly had DfE guidance
// becoming "statutory from next week", forever. Adding a file below is a
// declaration that its dates are facts about the world, not seed activity.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

const ALLOWED = new Set([
  // Config-record provenance stamps (symbolic 2025-01-01 created/updated).
  "src/lib/cara/cara-config.ts",
  // Knowledge-base ingested_at — when guidance content actually entered.
  "src/lib/cara/knowledge-base.ts",
  // DfE suspension guidance statutory effective_from — a real-world date.
  "src/lib/education-disruption/education-disruption-engine.ts",
]);

const BANNED = /\w+:\s*"20[0-9]{2}-[0-9]{2}-[0-9]{2}/;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      yield* walk(full);
    } else if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) {
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
    if (BANNED.test(line)) violations.push(`${rel}:${i + 1}  ${line.trim().slice(0, 100)}`);
  });
}

if (violations.length) {
  console.error(
    `check-seed-decay: ${violations.length} fixed seed date(s) — these age out of every trend window.\n` +
      `Use seedDay(offset) from @/lib/seed-date so seeds re-anchor each cold start.\n` +
      `If this date is a REAL-WORLD FACT (statutory date, ingestion stamp), add the\n` +
      `file to ALLOWED in this script with a reason — that declaration is the point.\n`
  );
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log("check-seed-decay: every seed date floats; fixed dates are declared facts.");
