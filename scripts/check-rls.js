#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: migrations must not leave public-schema RLS holes open.
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
//   2. No policy may be LEFT granting unrestricted access (USING or WITH CHECK
//      true) to anyone but service_role. Omitting the TO clause means PUBLIC —
//      which includes anon:
//
//          CREATE POLICY "service_role_full_access" ON manager_attention_items
//            FOR ALL USING (true) WITH CHECK (true);
//
//      ~44 tables carried exactly that: a policy NAMED for the service role that
//      in fact granted anon full read/write. `TO service_role` policies are
//      pointless anyway (service_role bypasses RLS) — prefer no policy at all.
//
//      Rule 2 judges the END STATE. Migrations are read in version order and a
//      later `drop policy` — in the same file or a later one — clears an earlier
//      create. Replayed files such as 20260918120000_restore_direct_query_tables
//      create the archive's open policies and then drop them a few hundred lines
//      on; flagging those would be noise. A static `alter policy` that changes
//      USING / WITH CHECK / TO is re-judged on what it changes.
//
// Scope: migrations whose VERSION — the full numeric prefix before the first
// underscore — is >= BASELINE. That is every timestamped migration (2026…) and
// every future one; the July lean baseline (00000000000000_) and the promoted
// 3-digit history are out of scope.
//
// ★ Until 2026-11-09 this read only the first THREE characters of the file name,
//   so every timestamped migration parsed as 202, below BASELINE: the guard
//   checked 0 files while printing "clean". It now fails when nothing is in
//   scope, so a guard that checks nothing cannot report success again.
//
// Escape hatch: `-- rls-guard: allow <reason>` anywhere in a migration skips that
// file. Use it for dynamic DDL the regexes cannot read, and say why. Dynamic DDL
// (`execute format('… policy %I …')`) is invisible to the regexes below, because
// "%" is not a name character.
//
// Testing seam: RLS_GUARD_MIGRATIONS_DIR=<dir> points the guard at a fixture
// directory (src/lib/__tests__/rls-guard.test.ts). CI never sets it.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");

const MIGRATIONS =
  process.env.RLS_GUARD_MIGRATIONS_DIR || path.join(__dirname, "..", "supabase", "migrations");
const BASELINE = 423;

// Comments would otherwise trip every rule below (migration headers quote the
// very patterns this guard forbids).
const stripComments = (sql) => sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

const RE_CREATE_TABLE =
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z0-9_]+)"?/gi;
// `create temp table` / `create unlogged table` are not Data-API reachable.
const RE_SKIP_TABLE = /create\s+(?:temp(?:orary)?|unlogged)\s+table/i;
const RE_ENABLE_RLS =
  /alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?"?([a-z0-9_]+)"?\s+enable\s+row\s+level\s+security/gi;
// create / drop / alter policy, in file order. Group 5 is everything up to the
// statement's semicolon (FOR …, TO …, USING (…), WITH CHECK (…), RENAME TO …).
const RE_POLICY_DDL =
  /\b(create|drop|alter)\s+policy\s+(?:if\s+exists\s+)?(?:"([^"]+)"|([a-z0-9_]+))\s+on\s+(?:public\.)?"?([a-z0-9_]+)"?([\s\S]*?);/gi;
// Dropping a table drops its policies.
const RE_DROP_TABLE = /\bdrop\s+table\s+(?:if\s+exists\s+)?([^;]+);/gi;

/** The full numeric prefix before the first underscore; NaN when there is none. */
function versionOf(file) {
  const m = /^(\d+)_/.exec(file);
  return m ? Number(m[1]) : NaN;
}

/** Quoted policy names are case-sensitive; unquoted ones fold to lower case. */
const policyName = (quoted, bare) => (quoted !== undefined ? quoted : bare.toLowerCase());

const RE_USING_TRUE = /\busing\s*\(\s*true\s*\)/i;
const RE_CHECK_TRUE = /\bwith\s+check\s*\(\s*true\s*\)/i;
const RE_TO = /\bto\s+([a-z_][a-z_,\s]*?)(?=\s+using\b|\s+with\s+check\b|\s*$)/i;

const failures = [];
const skipped = [];

const files = fs
  .readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith(".sql"))
  .map((file) => ({ file, version: versionOf(file) }))
  .filter((m) => Number.isFinite(m.version) && m.version >= BASELINE)
  .sort((a, b) => a.version - b.version || a.file.localeCompare(b.file));

if (files.length === 0) {
  console.error(
    `\n✖ RLS guard: no migration in ${MIGRATIONS} has a version >= ${BASELINE}.\n` +
      "  A guard that checks nothing must not report clean. Check the directory and\n" +
      "  the version parsing (the full numeric prefix before the first underscore).\n",
  );
  process.exit(1);
}

// Every policy created or altered in scope, keyed "table|policy", with the state
// that decides rule 2. Drops delete entries, so what remains is the end state.
const policies = new Map();

for (const { file } of files) {
  const raw = fs.readFileSync(path.join(MIGRATIONS, file), "utf8");

  const allow = raw.match(/--\s*rls-guard:\s*allow\s+(.+)/i);
  if (allow) {
    skipped.push(`${file} — ${allow[1].trim()}`);
    continue;
  }

  const sql = stripComments(raw);

  // ── Rule 1: per file ──────────────────────────────────────────────────────
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

  // ── Rule 2: policy DDL in file order, accumulated across files ────────────
  const events = [];
  for (const m of sql.matchAll(RE_POLICY_DDL)) {
    events.push({
      at: m.index,
      kind: m[1].toLowerCase(),
      name: policyName(m[2], m[3]),
      table: m[4].toLowerCase(),
      body: m[5] || "",
    });
  }
  for (const m of sql.matchAll(RE_DROP_TABLE)) {
    const tables = m[1]
      .split(",")
      .map((t) => t.trim().replace(/\s+(?:cascade|restrict)\s*$/i, ""))
      .map((t) => /^(?:public\.)?"?([a-z0-9_]+)"?$/i.exec(t))
      .filter(Boolean)
      .map((x) => x[1].toLowerCase());
    events.push({ at: m.index, kind: "drop-table", tables });
  }
  events.sort((a, b) => a.at - b.at);

  for (const ev of events) {
    if (ev.kind === "drop-table") {
      for (const key of [...policies.keys()]) {
        if (ev.tables.includes(key.split("|")[0])) policies.delete(key);
      }
      continue;
    }

    const key = `${ev.table}|${ev.name}`;

    if (ev.kind === "drop") {
      policies.delete(key);
      continue;
    }

    const to = ev.body.match(RE_TO);

    if (ev.kind === "create") {
      policies.set(key, {
        file,
        name: ev.name,
        table: ev.table,
        roles: to ? to[1].trim().toLowerCase() : null,
        usingTrue: RE_USING_TRUE.test(ev.body),
        checkTrue: RE_CHECK_TRUE.test(ev.body),
      });
      continue;
    }

    // alter policy: re-judge only what the statement changes. A policy created
    // before scope is unknown here; an alter that opens it is still flagged.
    const rename = ev.body.match(/\brename\s+to\s+(?:"([^"]+)"|([a-z0-9_]+))/i);
    const prev = policies.get(key) || {
      file,
      name: ev.name,
      table: ev.table,
      roles: null,
      usingTrue: false,
      checkTrue: false,
    };
    if (rename) {
      const renamed = { ...prev, name: policyName(rename[1], rename[2]) };
      policies.delete(key);
      policies.set(`${ev.table}|${renamed.name}`, renamed);
      continue;
    }
    const next = { ...prev, file };
    if (to) next.roles = to[1].trim().toLowerCase();
    if (/\busing\s*\(/i.test(ev.body)) next.usingTrue = RE_USING_TRUE.test(ev.body);
    if (/\bwith\s+check\s*\(/i.test(ev.body)) next.checkTrue = RE_CHECK_TRUE.test(ev.body);
    policies.set(key, next);
  }
}

for (const p of policies.values()) {
  if (!p.usingTrue && !p.checkTrue) continue;
  // TO service_role is redundant but harmless — it grants nothing the role does
  // not already have by bypassing RLS.
  if (p.roles && /^service_role$/.test(p.roles)) continue;

  const who = p.roles ? `TO ${p.roles}` : "no TO clause → PUBLIC (includes anon)";
  failures.push(
    `${p.file}\n    policy "${p.name}" on "${p.table}" is unrestricted (USING/WITH CHECK true)\n` +
      `    and applies to: ${who} — and no later migration drops or narrows it\n` +
      `    → grants anon or every signed-in user unrestricted access. Scope the\n` +
      `      predicate (e.g. home_id = (select get_my_home_id()), with ::text where\n` +
      `      home_id is text), or drop the policy — the app reads as service_role\n` +
      `      and needs no policy at all.`,
  );
}

if (skipped.length) {
  console.log("RLS guard — files skipped by pragma:");
  for (const s of skipped) console.log(`  • ${s}`);
}

if (failures.length) {
  console.error(`\n✖ RLS guard: ${failures.length} issue(s) in migrations >= ${BASELINE}\n`);
  for (const f of failures) console.error(`  • ${f}\n`);
  process.exit(1);
}

console.log(
  `✔ RLS guard: ${files.length} migration(s) >= ${BASELINE} clean (policies judged on their end state)`,
);
