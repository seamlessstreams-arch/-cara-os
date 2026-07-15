#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: new migrations must not reopen the public-schema RLS holes that
// 423_rls_close_public_exposure.sql closed.
//
// Why this can bite: the app talks to Postgres as `service_role`, which bypasses
// RLS. So a table with no RLS, or a wide-open policy, looks perfectly healthy
// from inside the app — every feature works. The only party affected is someone
// holding the anon key, which is public by design. Nothing in the test suite or
// the UI can catch it. A static guard can.
//
// Two rules, both learned from real defects in this repo:
//
//   1. A table created in `public` must enable RLS in the same migration.
//      (102 tables had missed it, incl. every hr_* table and child_pace_profiles.)
//
//   2. A policy must not grant unrestricted access to PUBLIC/anon. Omitting the
//      TO clause means PUBLIC — which includes anon:
//
//          CREATE POLICY "service_role_full_access" ON manager_attention_items
//            FOR ALL USING (true) WITH CHECK (true);
//
//      ~44 tables carried exactly that: a policy NAMED for the service role that
//      in fact granted anon full read/write. `TO service_role` policies are
//      pointless anyway (service_role bypasses RLS) — prefer no policy at all.
//
// Scope: only migrations numbered >= BASELINE are checked. Everything earlier is
// remediated at run time by 423's sweep, so re-litigating history here would be
// noise rather than signal.
//
// Escape hatch: `-- rls-guard: allow <reason>` anywhere in a migration skips that
// file. Use it for dynamic DDL the regexes cannot read, and say why.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

const MIGRATIONS = path.join(__dirname, "..", "supabase", "migrations");
const BASELINE = 423;

// Comments would otherwise trip every rule below (the docs in 423 quote the very
// pattern this guard forbids).
const stripComments = (sql) => sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

const RE_CREATE_TABLE =
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z0-9_]+)"?/gi;
// `create temp table` / `create unlogged table` are not Data-API reachable.
const RE_SKIP_TABLE = /create\s+(?:temp(?:orary)?|unlogged)\s+table/i;
const RE_ENABLE_RLS =
  /alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?"?([a-z0-9_]+)"?\s+enable\s+row\s+level\s+security/gi;
const RE_POLICY =
  /create\s+policy\s+(?:"([^"]+)"|([a-z0-9_]+))\s+on\s+(?:public\.)?"?([a-z0-9_]+)"?([\s\S]*?);/gi;

const failures = [];
const skipped = [];

const files = fs
  .readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith(".sql"))
  .filter((f) => {
    const n = parseInt(f.slice(0, 3), 10);
    return Number.isFinite(n) && n >= BASELINE;
  })
  .sort();

for (const file of files) {
  const raw = fs.readFileSync(path.join(MIGRATIONS, file), "utf8");

  const allow = raw.match(/--\s*rls-guard:\s*allow\s+(.+)/i);
  if (allow) {
    skipped.push(`${file} — ${allow[1].trim()}`);
    continue;
  }

  const sql = stripComments(raw);

  const rlsEnabled = new Set();
  for (const m of sql.matchAll(RE_ENABLE_RLS)) rlsEnabled.add(m[1].toLowerCase());

  for (const m of sql.matchAll(RE_CREATE_TABLE)) {
    const table = m[1].toLowerCase();
    // Look back a little to spot `create temp table`, which RE_CREATE_TABLE's
    // own match text does not include.
    const context = sql.slice(Math.max(0, m.index - 24), m.index + m[0].length);
    if (RE_SKIP_TABLE.test(context)) continue;
    if (!rlsEnabled.has(table)) {
      failures.push(
        `${file}\n    table "${table}" is created in public but never gets\n` +
          `    "alter table ${table} enable row level security;"\n` +
          `    → reachable with the anon key. Add it (a table with RLS and no policy\n` +
          `      is correct here — service_role bypasses RLS, so the app is unaffected).`,
      );
    }
  }

  for (const m of sql.matchAll(RE_POLICY)) {
    const name = m[1] || m[2];
    const table = m[3];
    const body = m[4] || "";

    const unrestricted =
      /using\s*\(\s*true\s*\)/i.test(body) || /with\s+check\s*\(\s*true\s*\)/i.test(body);
    if (!unrestricted) continue;

    const to = body.match(/\bto\s+([a-z_][a-z_,\s]*?)(?=\s+using|\s+with\s+check|\s*$)/i);
    const roles = to ? to[1].trim().toLowerCase() : null;

    // TO service_role is redundant but harmless — it grants nothing the role does
    // not already have by bypassing RLS.
    if (roles && /^service_role$/.test(roles)) continue;

    const who = roles ? `TO ${roles}` : "no TO clause → PUBLIC (includes anon)";
    failures.push(
      `${file}\n    policy "${name}" on "${table}" is unrestricted (USING/WITH CHECK true)\n` +
        `    and applies to: ${who}\n` +
        `    → grants anon or every signed-in user unrestricted access. Scope the\n` +
        `      predicate (e.g. home_id = get_my_home_id()::text), or drop the policy —\n` +
        `      the app reads as service_role and needs no policy at all.`,
    );
  }
}

if (skipped.length) {
  console.log("RLS guard — files skipped by pragma:");
  for (const s of skipped) console.log(`  • ${s}`);
}

if (failures.length) {
  console.error(`\n✖ RLS guard: ${failures.length} issue(s) in migrations >= ${BASELINE}\n`);
  for (const f of failures) console.error(`  • ${f}\n`);
  console.error("See supabase/migrations/423_rls_close_public_exposure.sql for the rationale.\n");
  process.exit(1);
}

console.log(`✔ RLS guard: ${files.length} migration(s) >= ${BASELINE} clean`);
