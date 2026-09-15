#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// GUARD — AN UNRECORDED JUDGEMENT IS NOT A YES
//
// A read path that answers a question nobody asked:
//
//   const { data: config } = await sb.from("safeguarding_config")
//     .select("*").eq("child_id", childId).single();
//   return {
//     riskAssessmentCurrent: config?.risk_assessment_current ?? true,
//     safeguardingPlanInPlace: config?.safeguarding_plan ?? true,
//     staffSafeguardingTrained: config?.staff_trained ?? true,
//   };
//
// When that config row does not exist — the normal state for a table whose
// migration has not been applied — `config` is null and every judgement reads
// `true`. The child is then assessed as fully compliant, scoring 100/100, and
// reported as "CHR 2015 Reg 12 — met — Child protection measures in place and
// current" out of a table with no row in it.
//
// The tell is visible inside a single object literal: the risk-bearing flags
// beside these all default the other way.
//
//   policeNotified: e.police_notified ?? false,
//   socialWorkerNotified: e.sw_notified ?? true,     // ← the odd one out
//   ofstedNotified: e.ofsted_notified ?? undefined,
//
// Where sibling fields disagree about direction, the flattering one is the bug.
//
// ── The rule ────────────────────────────────────────────────────────────────
//
// `?? true` is banned in API route handlers. An absent value is absent: type
// the field `boolean | null` and let the engine report it as not evidenced.
// Credit requires `=== true`; a breach requires `=== false`, so that absence
// becomes neither a pass nor a false red.
//
// ── Direction ───────────────────────────────────────────────────────────────
//
// This is a ONE-WAY cap, not a two-way ratchet. Each file carries the number of
// sites it had when the guard landed; exceeding it fails, and going under it
// passes. That is deliberate: several branches fixing these sites were in
// flight when this guard was written, and a two-way baseline would have gone
// red or green purely on the order they merged. Lower the numbers as you fix
// them — a file that reaches zero should be deleted from the baseline outright.
//
// ── Escape hatch ────────────────────────────────────────────────────────────
//
// A default that is genuinely correct takes a reason on the line above:
//
//   // absence-ok: the column is NOT NULL, so this default is unreachable
//   flagged: row.flagged ?? true,
//
// Annotated sites are excluded from the count entirely.
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const API = path.join(ROOT, "src", "app", "api");
const BASELINE = require("./defaulted-judgements-baseline.json");

/** `foo: expr ?? true,` — the field name is what we count. */
const SITE = /^\s*([A-Za-z_$][\w$]*)\s*:\s*.*\?\?\s*true\s*,?\s*$/;
const EXEMPT = /\/\/\s*absence-ok:/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      walk(p, out);
    } else if (e.name === "route.ts") {
      out.push(p);
    }
  }
  return out;
}

// The services layer holds the same class an order of magnitude larger (~880
// sites, census 2026-09-01): `child_engaged: payload.childEngaged ?? true` in a
// CREATE service writes the judgement into the record itself. Every one of the
// 134 tables those services insert into is currently UNBACKED (they are all in
// the storage-migration baseline), so the defaults are latent, not live — they
// arm the day the archived migrations are applied. Capped here so the count
// cannot grow while it waits.
const SERVICES = path.join(ROOT, "src", "lib", "services");
function walkServices(out = []) {
  for (const e of fs.readdirSync(SERVICES, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith("-service.ts")) out.push(path.join(SERVICES, e.name));
  }
  return out;
}

const found = new Map(); // relpath -> [field, ...]
let scanned = 0;

for (const file of [...walk(API), ...walkServices()]) {
  scanned++;
  const rel = path.relative(ROOT, file);
  const lines = fs.readFileSync(file, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = SITE.exec(lines[i]);
    if (!m) continue;
    if (i > 0 && EXEMPT.test(lines[i - 1])) continue;
    if (!found.has(rel)) found.set(rel, []);
    found.get(rel).push(m[1]);
  }
}

// Sanity: a guard that scans nothing passes vacuously.
if (scanned < 100) {
  console.error(`check-defaulted-judgements: only ${scanned} files scanned — expected 100+. Refusing to pass vacuously.`);
  process.exit(1);
}

const failures = [];
for (const [rel, fields] of found) {
  const allowed = BASELINE[rel] ?? 0;
  if (fields.length > allowed) {
    failures.push(
      `  ${rel}\n    ${fields.length} defaulted judgement(s), baseline allows ${allowed}` +
      `\n    ${fields.slice(0, 6).join(", ")}${fields.length > 6 ? ", …" : ""}`
    );
  }
}

const total = [...found.values()].reduce((t, f) => t + f.length, 0);
const baselineTotal = Object.values(BASELINE).reduce((t, n) => t + n, 0);

if (failures.length > 0) {
  console.error(
    "\ncheck-defaulted-judgements: an unrecorded judgement must not read as a yes.\n\n" +
    failures.join("\n") + "\n\n" +
    "Type the field `boolean | null`, default it to `?? null`, and make the engine\n" +
    "report it as not evidenced. Credit requires `=== true`; a breach requires\n" +
    "`=== false`. If the default really is correct, put `// absence-ok: <reason>`\n" +
    "on the line above it.\n"
  );
  process.exit(1);
}

console.log(
  `check-defaulted-judgements: ${scanned} files scanned (routes + services) — ` +
  `${total} defaulted judgement(s) remaining, cap ${baselineTotal} ✓`
);
