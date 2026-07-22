#!/usr/bin/env node
/*
 * check-dal-persistence.js — every table the typed DAL writes to must exist
 * in the schema-of-record (supabase/migrations).
 *
 * The class this guards (it cost a live tenant its writes): the dual-mode DAL
 * (src/lib/db/dal.ts → src/lib/supabase/queries.ts) inserts against
 * `Database["public"]["Tables"][<name>]` and does NOT try/catch the Supabase
 * call. If <name> has no CREATE TABLE in the applied migrations, the live
 * database has no such relation, the insert 500s, there is no in-memory
 * fallback on a live tenant, and the record is silently lost while the user
 * sees an error. This is exactly what happened after the 406-file migration
 * chain was squashed to a lean baseline: the baseline kept 16 of the 43 typed
 * tables and dropped 27 (medication_administrations, supervisions,
 * chronology_entries, notifications, leave_requests, vacancies, expenses,
 * qa_audits, candidate_*, care_event*, …). Every write to those entities failed
 * on the live home until 20260722120000_persist_typed_tables.sql restored them.
 *
 * The guard: collect every table name declared in the Database type (the
 * contract the code compiles and inserts against), collect every table CREATEd
 * across supabase/migrations, and fail on any typed table that no migration
 * creates. A typed table with no backing table is a persistence gap by
 * construction — the schema-of-record must be a superset of the write contract.
 *
 * SCOPE:
 *   - Type source: src/lib/supabase/types.ts, the `Tables: { ... }` block only.
 *     Views (a separate block) are not written to and are excluded.
 *   - Schema source: every *.sql under supabase/migrations (NOT
 *     migrations_archive — that is the retired cs_-prefixed chain). Both
 *     `create table x` and `create table if not exists x` are recognised.
 *
 * When this fails: a typed table has no CREATE TABLE. Either add the table to a
 * migration (the medication_administrations case — the schema must carry every
 * table the DAL writes to), or, if the type entry is genuinely dead, remove it
 * from types.ts so the contract stops promising a table nothing backs. Never
 * add a name to ALLOWLIST without a comment saying why that typed table is
 * legitimately never written to a real database.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TYPES = path.join(ROOT, "src", "lib", "supabase", "types.ts");
const MIGRATIONS = path.join(ROOT, "supabase", "migrations");

// Typed tables that are deliberately never persisted to a real database.
// Keep empty; every entry needs a one-line justification.
const ALLOWLIST = new Set([]);

function fail(msg) {
  console.error(`check-dal-persistence: ${msg}`);
  process.exit(1);
}

// ── 1. Tables the Database type declares (the write contract) ────────────────
const typesSrc = fs.readFileSync(TYPES, "utf8");
const tablesBlock = typesSrc.match(/\n {4}Tables:\s*\{\n([\s\S]*?)\n {4}Views:\s*\{/);
if (!tablesBlock) {
  fail("could not locate the `Tables: { ... }` block in types.ts — parser needs updating.");
}
const typedTables = new Set(
  [...tablesBlock[1].matchAll(/\n {6}([a-z_][a-z0-9_]*):\s*\{\s*\n\s*Row:/g)].map((m) => m[1]),
);
if (typedTables.size === 0) {
  fail("parsed zero typed tables from types.ts — parser needs updating.");
}

// ── 2. Tables the migrations create (the schema-of-record) ───────────────────
const migrationFiles = fs
  .readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => fs.readFileSync(path.join(MIGRATIONS, f), "utf8"));
const createdTables = new Set();
for (const sql of migrationFiles) {
  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?["']?([a-z_][a-z0-9_]*)["']?/gi)) {
    createdTables.add(m[1].toLowerCase());
  }
}

// ── 3. Every typed table must have a backing CREATE TABLE ────────────────────
const gaps = [...typedTables]
  .filter((t) => !createdTables.has(t) && !ALLOWLIST.has(t))
  .sort();

if (gaps.length > 0) {
  console.error(
    `check-dal-persistence: ${gaps.length} typed table(s) have NO CREATE TABLE in supabase/migrations.\n` +
      "The DAL inserts against these with no try/catch — on a live tenant every write 500s and the record is lost:\n",
  );
  for (const t of gaps) console.error(`  ✗ ${t}`);
  console.error(
    "\nAdd each to a migration, or remove the dead entry from types.ts. See this file's header.",
  );
  process.exit(1);
}

console.log(
  `check-dal-persistence: all ${typedTables.size} typed tables are backed by a migration ✓`,
);
