#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: Math.random() may generate an ID. It may not generate a RECORD.
//
// /workforce/qualifications shipped a card whose own comment read "Simulate DBS
// data based on staff":
//
//   dbs_number:          s.dbs_number || `DBS-…${Math.floor(Math.random() * 900 + 100)}`
//   dbs_date:            s.dbs_date || "2025-06-15"
//   update_service:      s.dbs_update_service ?? (Math.random() > 0.3)
//   barred_list_checked: true        ← every staff member, unconditionally
//
// A home with nothing recorded saw a screen of green ticks, DBS certificate
// numbers and barred-list confirmations for its entire team. Invented, and a
// different DBS number on every render. That is Reg 32 / Schedule 2 evidence —
// the first thing an inspector asks for.
//
// /quality/reg-45 did the smaller version of it: `{Math.floor(Math.random() *
// 12) + 3} evidence links` under a section of a statutory review, re-rolled on
// every render.
//
// The rule is a single line, because a line you can argue about is a line that
// erodes: Math.random() is permitted ONLY as `Math.random().toString(36)` —
// the id idiom used in ~30 places here. Any other use is producing a value the
// record will treat as fact.
//
// A count, a date, a reference, a boolean, a score: if it is not read from a
// record it must not be shown as one. Where the data is genuinely absent, say
// absent — that is what the fabricate-on-empty rule has meant since #894.
//
// Randomness also breaks a second promise: two loads of the same screen show
// two different figures, so nothing on it can be cited, compared or checked.
// That applies even to demo builders, which is why the one in
// api/cara/education-engagement was made deterministic rather than exempted.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

/** The one permitted idiom: a random component of a generated identifier. */
const ID_IDIOM = /Math\.random\(\)\s*\.\s*toString\(\s*36\s*\)/;

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
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes("Math.random")) continue;
  const rel = file.split(path.sep).join("/");

  text.split("\n").forEach((line, i) => {
    if (!line.includes("Math.random")) return;
    // A comment ABOUT Math.random is not a use of it — hero-field.tsx notes
    // that it deliberately avoids it for stable frames.
    const code = line.replace(/\/\/.*$/, "").replace(/\/\*[\s\S]*?\*\//g, "");
    if (!code.includes("Math.random")) return;
    if (ID_IDIOM.test(code)) return;
    violations.push(`${rel}:${i + 1}  ${line.trim().slice(0, 110)}`);
  });
}

if (violations.length) {
  console.error(
    `check-random-record-content: ${violations.length} use(s) of Math.random() outside id generation.\n` +
      `A random number displayed as a DBS certificate, an evidence count or an attendance figure is\n` +
      `read as fact by everyone who sees it, and shows a different value on the next render. Read it\n` +
      `from the record, or say the record is empty. The only permitted form is\n` +
      `Math.random().toString(36) inside a generated id.\n`
  );
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log("check-random-record-content: no record content is generated at random.");
