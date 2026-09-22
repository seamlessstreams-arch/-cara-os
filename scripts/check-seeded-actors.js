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
// ── Two scopes ──────────────────────────────────────────────────────────────
//
// The guard shipped scanning .tsx only, and that hid the larger half. A route
// handler that ends
//
//   created_by: body.created_by ?? "staff_darren",
//
// stamps a person who does not work at the home onto every record whose caller
// omitted the field — from ANY caller, not just the page that was fixed. Nine
// of the home_id columns are `text` rather than `uuid`, so "home_oak" lands in
// those silently instead of failing; production already carries one emergency
// alert raised by, resolved by and belonging to nobody real.
//
// So there are two scopes, each with its own baseline:
//
//   CLIENT  .tsx that calls api.post/put/patch or .mutate
//   SERVER  .ts  that calls .insert/.upsert/.update or exports POST/PUT/PATCH
//
// Kept apart because the fixes differ. A client site takes the actor from
// useAuthContext(); a server site must take it from the authenticated request
// and reject the write when it cannot — a default is exactly the bug.
//
// src/lib/seed-data.ts and src/lib/db/store.ts are excluded: they DEFINE the
// seed, and seedIds() reads them.
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
const SERVER_BASELINE = require("./seeded-actors-server-baseline.json");

/** The seed's own definition files. They are allowed to contain seed ids —
 *  that is what they are — and seedIds() reads them to build the id set. */
const SEED_SOURCES = new Set(["src/lib/seed-data.ts", "src/lib/db/store.ts"]);

/** A test may name a seeded person freely: that is a fixture, not a record.
 *  The walk already skips __tests__/ directories, but a *.test.ts sitting
 *  beside its source was being scanned — one of them came into range the
 *  moment the server pattern below widened. */
const IS_TEST = /\.(test|spec)\.tsx?$/;

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
// A server file that puts rows into the database, or answers a mutating verb.
//
// Two idioms, because this codebase has two. The first is the Supabase client
// and the route handlers. The second is the typed store — db.x.create(),
// dal.x.update(), intelligenceDb.x.create() — which the first misses entirely.
//
// That gap was not hypothetical. incident-service.ts writes every incident
// audit entry through intelligenceDb.caraAuditTrail.create() and carried three
// seeded literals, including the home stamped onto every incident session. The
// guard shipped blind to it and the fix for that file had to be found by hand.
//
// linked-updates.ts was the larger one it missed: the "record once, update
// everywhere" engine, which auto-assigns the tasks it generates and addresses
// its push notifications. Ten sites, all naming people who do not work there.
// Both files are at zero now and are out of the baseline entirely — widening
// the pattern is what keeps them there.
const SERVER_WRITES = new RegExp(
  [
    /\.(?:insert|upsert|update)\(/.source,
    /export\s+(?:async\s+)?function\s+(?:POST|PUT|PATCH)\b/.source,
    /\b(?:db|dal|\w*(?:Db|Store))\.[A-Za-z_]\w*\.(?:create|update|upsert|remove)\(/.source,
  ].join("|"),
);
const EXEMPT = /\/\/\s*seed-actor-ok:/;

function walk(dir, ext, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      walk(p, ext, out);
    } else if (e.name.endsWith(ext)) {
      // ".tsx".endsWith(".ts") is false, so the two scopes never overlap.
      out.push(p);
    }
  }
  return out;
}

const IDS = seedIds();

/** Count the seed-id literals on the writing files of one scope.
 *  Returns relpath -> [id, ...] plus how many files were actually scanned. */
function scan(ext, writes, skip = () => false) {
  const found = new Map();
  let scanned = 0;
  for (const file of walk(SRC, ext)) {
    const rel = path.relative(ROOT, file);
    if (IS_TEST.test(rel) || skip(rel)) continue;
    const src = fs.readFileSync(file, "utf8");
    // Only files that write. One that merely renders a seeded name is
    // check-demo-seed's business, not this guard's.
    if (!writes.test(src)) continue;
    scanned++;
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
  return { found, scanned };
}

const client = scan(".tsx", WRITES);
const server = scan(".ts", SERVER_WRITES, (rel) => SEED_SOURCES.has(rel));

// A guard that scans nothing passes vacuously. Both scopes, independently:
// a refactor that renamed every route handler must not read as a clean sheet.
for (const [label, n, floor] of [
  ["writing component", client.scanned, 100],
  ["writing server file", server.scanned, 100],
]) {
  if (n < floor) {
    console.error(`check-seeded-actors: only ${n} ${label}(s) scanned — expected ${floor}+. Refusing to pass vacuously.`);
    process.exit(1);
  }
}

const failures = [];
function check({ found }, baseline, what) {
  for (const [rel, ids] of found) {
    const allowed = baseline[rel] ?? 0;
    if (ids.length > allowed) {
      failures.push(
        `  ${rel}\n    ${ids.length} seeded id(s) in a ${what}, baseline allows ${allowed}` +
        `\n    ${[...new Set(ids)].slice(0, 6).join(", ")}`
      );
    }
  }
}
check(client, BASELINE, "writing component");
check(server, SERVER_BASELINE, "writing server file");

const sum = (m) => [...m.values()].reduce((t, v) => t + v.length, 0);
const capOf = (b) => Object.values(b).reduce((t, n) => t + n, 0);

if (failures.length > 0) {
  console.error(
    "\ncheck-seeded-actors: a record must not be written by, or about, a seeded person.\n\n" +
    failures.join("\n") + "\n\n" +
    "In a component: take the actor from useAuthContext() and the child from\n" +
    "ChildSelect / useChildren. Where the signed-in user cannot be resolved to\n" +
    "a staff record, disable the save rather than attributing the entry to a\n" +
    "guess.\n\n" +
    "In a route: take the actor from the authenticated request and reject the\n" +
    "write when it is absent. `body.created_by ?? \"staff_darren\"` is not a\n" +
    "default, it is a false attribution that outlives the request.\n\n" +
    "If a site really is demo-only and never submitted, put\n" +
    "`// seed-actor-ok: <reason>` on the line above it.\n"
  );
  process.exit(1);
}

console.log(
  `check-seeded-actors: ${client.scanned} writing component(s), ` +
  `${sum(client.found)} seeded id(s) remaining, cap ${capOf(BASELINE)} ✓\n` +
  `check-seeded-actors: ${server.scanned} writing server file(s), ` +
  `${sum(server.found)} seeded id(s) remaining, cap ${capOf(SERVER_BASELINE)} ✓`
);
