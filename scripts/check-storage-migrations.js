#!/usr/bin/env node
/*
 * check-storage-migrations.js — a table the app queries must have a migration.
 *
 * The class this guards: `sb.from("cs_thing")` against a table with no
 * CREATE TABLE in supabase/migrations. On live that query errors, and the
 * feature answers 503 "storage is not set up" — honest, but the feature does
 * not work. 610 tables were in that state when this landed, 505 of them with a
 * migration already written and sitting unapplied in supabase/migrations_archive.
 *
 * This is a RATCHET, not a burn-down demand. The in-memory fallback is
 * deliberate, so the baseline records the tables already in that state and the
 * guard fails only when a NEW one appears — or when the count changes, so the
 * baseline stays honest as migrations get applied.
 *
 * migrations_archive/ does NOT count as backed. An unapplied migration is not
 * a table.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BASELINE_PATH = path.join(__dirname, "storage-tables-baseline.json");

function fail(msg) {
  console.error(`check-storage-migrations: ${msg}`);
  process.exit(1);
}

// ── 1. Tables the app queries ────────────────────────────────────────────────
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      yield* walk(full);
    } else if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) {
      yield full;
    }
  }
}

const used = new Map(); // table -> first file that queries it
let scanned = 0;
for (const file of walk(path.join(ROOT, "src"))) {
  scanned++;
  // Comments mention table names too — loose-client.ts documents `sb.from("x")`
  // — so they are removed before matching rather than filtered afterwards.
  const text = fs
    .readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  // `.from("table")` on a Supabase client. Array.from / Buffer.from take a
  // string too, so the receiver is excluded explicitly rather than by shape.
  for (const m of text.matchAll(/(\w+)?\.from\(\s*["'`]([a-z_][a-z0-9_]*)["'`]/g)) {
    const receiver = m[1] ?? "";
    if (receiver === "Array" || receiver === "Buffer" || receiver === "Object") continue;
    const table = m[2];
    if (!used.has(table)) used.set(table, path.relative(ROOT, file));
  }
}

// ── 2. Tables an APPLIED migration creates ───────────────────────────────────
const MIGRATIONS = path.join(ROOT, "supabase", "migrations");
const created = new Set();
let migrationFiles = 0;
if (fs.existsSync(MIGRATIONS)) {
  for (const f of fs.readdirSync(MIGRATIONS).filter((n) => n.endsWith(".sql"))) {
    migrationFiles++;
    const sql = fs.readFileSync(path.join(MIGRATIONS, f), "utf8").toLowerCase();
    for (const m of sql.matchAll(
      /create\s+table\s+(?:if\s+not\s+exists\s+)?["']?(?:public\.)?([a-z_][a-z0-9_]*)/g,
    )) {
      created.add(m[1]);
    }
  }
}

// ── 3. Non-vacuity — a broken scan must not pass ─────────────────────────────
if (scanned < 2000) fail(`only ${scanned} source files scanned — the walk is broken, not the code clean.`);
if (used.size < 100) fail(`only ${used.size} queried tables found — the .from() matcher is broken.`);
if (migrationFiles < 5) fail(`only ${migrationFiles} migration files read — supabase/migrations is not being seen.`);

// ── 4. Compare against the baseline ──────────────────────────────────────────
const unbacked = [...used.keys()].filter((t) => !created.has(t)).sort();

if (!fs.existsSync(BASELINE_PATH)) {
  console.error("\ncheck-storage-migrations: no baseline committed yet. Current unbacked tables:\n");
  console.error(JSON.stringify(unbacked, null, 1));
  fail(`commit the above as scripts/storage-tables-baseline.json (${unbacked.length} entries).`);
}

const baseline = new Set(JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")));
const added = unbacked.filter((t) => !baseline.has(t));
const backed = [...baseline].filter((t) => !unbacked.includes(t)).sort();

if (added.length) {
  console.error(
    `\ncheck-storage-migrations: ${added.length} table(s) are queried with no migration behind them.\n` +
      `On live that query errors and the feature answers 503 — it will not persist anything.\n` +
      `Add a migration under supabase/migrations/, or use the in-memory store deliberately.\n`,
  );
  for (const t of added) console.error(`  ${t}   first queried in ${used.get(t)}`);
  process.exit(1);
}

if (backed.length) {
  console.error(
    `\ncheck-storage-migrations: ${backed.length} baselined table(s) now HAVE a migration — good.\n` +
      `Remove them from scripts/storage-tables-baseline.json so the baseline stays honest:\n`,
  );
  for (const t of backed) console.error(`  ${t}`);
  process.exit(1);
}

console.log(
  `check-storage-migrations: ${used.size} queried table(s), ${used.size - unbacked.length} backed by a migration, ` +
    `${unbacked.length} baselined ✓`,
);
