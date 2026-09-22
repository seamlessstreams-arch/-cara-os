#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// GUARD — A RECORD IS NOT WRITTEN BY A SEEDED PERSON
//
// A client component that writes a record and stamps it with a demo id:
//
//   createMutation.mutate({
//     child_id: "yp_alex",
//     reported_by: "staff_darren",
//     home_id: "home_oak",
//     ...
//   });
//
// On the demo tenant those ids resolve and the record looks right. On a live
// tenant they resolve to nobody. A Reg 40 notification to Ofsted, a deprivation
// of liberty authorisation, a CCTV access log and a medication error were all
// being attributed to "staff_darren" — a person who is not on the home's staff
// list — and four pages attached records to "yp_alex", a child who does not
// exist there.
//
// This is not the same class as check-demo-seed, which catches DEMO_ constants
// being RENDERED. These ids are WRITTEN, into the record, where they outlive
// the render and turn up in evidence.
//
// ── The rule ────────────────────────────────────────────────────────────────
//
// A .tsx file that writes (api.post/put/patch or .mutate) must not contain a
// seed id literal. Take the actor from the session identity — useAuthContext()
// — and the child from the home's own list, via ChildSelect / useChildren.
// Where identity cannot be resolved, refuse to record rather than attribute the
// entry to a guess.
//
// ── Direction ───────────────────────────────────────────────────────────────
//
// A ONE-WAY cap, like check-defaulted-judgements. Each file carries the number
// of sites it had when this guard landed; exceeding it fails, going under it
// passes. Lower the numbers as you fix them, and delete a file from the
// baseline once it reaches zero.
//
// ── Escape hatch ────────────────────────────────────────────────────────────
//
//   // seed-actor-ok: demo-only preview, never submitted
//   staff_id: "staff_darren",
//
// Annotated sites are excluded from the count entirely.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const BASELINE = require("./seeded-actors-baseline.json");

/** The ids the demo seed defines. Read from source so the guard cannot drift
 *  from the seed: a new seeded person is covered the day it is added. */
function seedIds() {
  const ids = new Set();
  for (const rel of ["src/lib/seed-data.ts", "src/lib/db/store.ts"]) {
    const txt = fs.readFileSync(path.join(ROOT, rel), "utf8");
    for (const m of txt.matchAll(/"((?:staff|yp|home)_[a-z0-9_]+)"/g)) ids.add(m[1]);
  }
  return ids;
}

/** Any string literal that IS a seed id, anywhere on the line. Catches the
 *  plain `field: "staff_darren"`, a useState default, and the ternary form
 *  (`cond ? "staff_ryan" : null`) that a field-name-anchored pattern misses. */
const LITERAL = /"((?:staff|yp|home)_[a-z0-9_]+)"/g;
const WRITES = /api\.(post|put|patch)\b|\.mutate(Async)?\(/;
const EXEMPT = /\/\/\s*seed-actor-ok:/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      walk(p, out);
    } else if (e.name.endsWith(".tsx")) {
      out.push(p);
    }
  }
  return out;
}

const IDS = seedIds();
const found = new Map(); // relpath -> [id, ...]
let scanned = 0;

for (const file of walk(SRC)) {
  const src = fs.readFileSync(file, "utf8");
  // Only components that write. A page that merely renders a seeded name is
  // check-demo-seed's business, not this guard's.
  if (!WRITES.test(src)) continue;
  scanned++;
  const rel = path.relative(ROOT, file);
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (EXEMPT.test(lines[i]) || (i > 0 && EXEMPT.test(lines[i - 1]))) continue;
    // A line that is wholly a comment is describing the fix, not doing it.
    if (/^\s*(\/\/|\*)/.test(lines[i])) continue;
    for (const m of lines[i].matchAll(LITERAL)) {
      if (!IDS.has(m[1])) continue;
      if (!found.has(rel)) found.set(rel, []);
      found.get(rel).push(m[1]);
    }
  }
}

// A guard that scans nothing passes vacuously.
if (scanned < 100) {
  console.error(`check-seeded-actors: only ${scanned} writing component(s) scanned — expected 100+. Refusing to pass vacuously.`);
  process.exit(1);
}

const failures = [];
for (const [rel, ids] of found) {
  const allowed = BASELINE[rel] ?? 0;
  if (ids.length > allowed) {
    failures.push(
      `  ${rel}\n    ${ids.length} seeded id(s) in a writing component, baseline allows ${allowed}` +
      `\n    ${[...new Set(ids)].slice(0, 6).join(", ")}`
    );
  }
}

const total = [...found.values()].reduce((t, v) => t + v.length, 0);
const cap = Object.values(BASELINE).reduce((t, n) => t + n, 0);

if (failures.length > 0) {
  console.error(
    "\ncheck-seeded-actors: a record must not be written by, or about, a seeded person.\n\n" +
    failures.join("\n") + "\n\n" +
    "Take the actor from useAuthContext() and the child from ChildSelect /\n" +
    "useChildren(). Where the signed-in user cannot be resolved to a staff\n" +
    "record, disable the save rather than attributing the entry to a guess.\n" +
    "If a site really is demo-only and never submitted, put\n" +
    "`// seed-actor-ok: <reason>` on the line above it.\n"
  );
  process.exit(1);
}

console.log(
  `check-seeded-actors: ${scanned} writing component(s) scanned — ` +
  `${total} seeded id(s) remaining, cap ${cap} ✓`
);
