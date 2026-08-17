#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE — src/lib/supabase/expected-tables.ts
//
// Migrations are applied to the live tenant BY HAND. There is no `supabase db
// push` in CI, in vercel.json, or in package.json scripts. So a merged, deployed
// migration proves the BUILD shipped — it does not prove the table exists.
//
// #942 landed cs_communication_drafts. Nothing in the product could tell anyone
// whether it had actually been created, and a missing table does not announce
// itself: PostgREST answers PGRST205 and the page renders an empty list. That is
// the fabricated-absence class again, one layer down — a whole COLLECTION
// missing rather than one read failing.
//
// This file is generated because types.ts is types-only and erased at runtime;
// the app cannot read its own table list without one. Same reason the legacy
// dispatcher is generated. check-dal-persistence.js fails if it drifts.
//
//   node scripts/generate-expected-tables.js
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TYPES = path.join(ROOT, "src", "lib", "supabase", "types.ts");
const MIGRATIONS = path.join(ROOT, "supabase", "migrations");
const OUT = path.join(ROOT, "src", "lib", "supabase", "expected-tables.ts");

/**
 * Column names declared inside one `create table ( ... )` body.
 *
 * Scans to the MATCHING close paren rather than the first one — a column with
 * `numeric(10,2)` or `default gen_random_uuid()::text` would otherwise cut the
 * body short. Table-level constraints are skipped by keyword.
 */
const CONSTRAINT_WORDS = new Set([
  "primary", "unique", "foreign", "check", "constraint", "exclude", "like", "partition",
]);

function columnsInCreateBody(sql, openIndex) {
  let depth = 0;
  let end = -1;
  for (let i = openIndex; i < sql.length; i++) {
    if (sql[i] === "(") depth++;
    else if (sql[i] === ")") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return [];

  const body = sql.slice(openIndex + 1, end);
  // Split on commas that are not inside parens — `numeric(10, 2)` is one column.
  const parts = [];
  let buf = "", d = 0;
  for (const ch of body) {
    if (ch === "(") d++;
    else if (ch === ")") d--;
    if (ch === "," && d === 0) { parts.push(buf); buf = ""; } else buf += ch;
  }
  parts.push(buf);

  const cols = [];
  for (const raw of parts) {
    // Strip line comments before looking for the name.
    const line = raw.split("\n").map((l) => l.replace(/--.*$/, "")).join(" ").trim();
    if (!line) continue;
    const first = line.split(/\s+/)[0].replace(/["']/g, "").toLowerCase();
    if (!first || CONSTRAINT_WORDS.has(first)) continue;
    if (!/^[a-z_][a-z0-9_]*$/.test(first)) continue;
    cols.push(first);
  }
  return cols;
}

/** Columns each migration introduces, by table. First mention wins. */
function columnOrigins(files) {
  const origin = new Map();          // table -> Map(column -> migration file)
  const put = (table, column, file) => {
    if (!origin.has(table)) origin.set(table, new Map());
    const m = origin.get(table);
    if (!m.has(column)) m.set(column, file);
  };

  for (const { file, sql } of files) {
    const lower = sql.toLowerCase();

    // create table <t> ( ... )
    const createRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?["']?([a-z_][a-z0-9_]*)["']?\s*\(/g;
    let m;
    while ((m = createRe.exec(lower))) {
      for (const col of columnsInCreateBody(lower, m.index + m[0].length - 1)) {
        put(m[1], col, file);
      }
    }

    // alter table <t> ... add column <c>, add column <c2> ...
    // Statement-scoped so a later `alter table other_table` cannot steal them.
    for (const stmt of lower.split(";")) {
      const at = stmt.match(/alter\s+table\s+(?:if\s+exists\s+)?["']?([a-z_][a-z0-9_]*)["']?/);
      if (!at) continue;
      for (const c of stmt.matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?["']?([a-z_][a-z0-9_]*)["']?/g)) {
        put(at[1], c[1], file);
      }
    }
  }
  return origin;
}

/** Every table the Database type declares, and the migration that creates it. */
function collect() {
  const typesSrc = fs.readFileSync(TYPES, "utf8");
  const block = typesSrc.match(/\n {4}Tables:\s*\{\n([\s\S]*?)\n {4}Views:\s*\{/);
  if (!block) throw new Error("could not locate the Tables block in types.ts");
  const typed = [...block[1].matchAll(/\n {6}([a-z_][a-z0-9_]*):\s*\{\s*\n\s*Row:/g)].map((m) => m[1]);
  if (typed.length === 0) throw new Error("parsed zero typed tables from types.ts");

  // The Row block of each table IS its column contract — what the app will ask
  // PostgREST for, and therefore what has to exist.
  const rowColumns = new Map();
  for (const table of typed) {
    const re = new RegExp(
      String.raw`\n {6}${table}:\s*\{\s*\n\s*Row:\s*\{\n([\s\S]*?)\n {8}\};`,
    );
    const rowBlock = typesSrc.match(re);
    if (!rowBlock) throw new Error(`could not read the Row block for ${table}`);
    const cols = [...rowBlock[1].matchAll(/\n {10}([a-z_][a-z0-9_]*)\??:/g)].map((m) => m[1]);
    if (cols.length === 0) throw new Error(`parsed zero columns for ${table}`);
    rowColumns.set(table, cols);
  }

  // First migration wins: a table may be created in one and altered later, and
  // the file to RUN is the one that introduces the thing that is missing.
  const files = fs
    .readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => ({ file, sql: fs.readFileSync(path.join(MIGRATIONS, file), "utf8") }));

  const createdIn = new Map();
  for (const { file, sql } of files) {
    for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?["']?([a-z_][a-z0-9_]*)["']?/gi)) {
      const t = m[1].toLowerCase();
      if (!createdIn.has(t)) createdIn.set(t, file);
    }
  }
  const origins = columnOrigins(files);

  return typed.sort().map((table) => {
    const tableMigration = createdIn.get(table) ?? null;
    const byColumn = origins.get(table) ?? new Map();
    // Only columns introduced LATER than the table itself are worth listing:
    // the rest exist iff the table does, and repeating them would triple this
    // file for no signal. A column the migrations never mention is listed with
    // a null migration — it is a real gap, and silence about it would be worse.
    const columns = rowColumns
      .get(table)
      .map((name) => ({ name, migration: byColumn.get(name) ?? null }))
      .filter((c) => c.migration !== tableMigration)
      .sort((a, b) => a.name.localeCompare(b.name));

    return { table, migration: tableMigration, columns };
  });
}

function render(rows) {
  const body = rows
    .map((r) => {
      const cols = r.columns.length
        ? `\n      ${r.columns
            .map((c) => `{ name: ${JSON.stringify(c.name)}, migration: ${JSON.stringify(c.migration)} }`)
            .join(",\n      ")},\n    `
        : "";
      return (
        `  {\n    table: ${JSON.stringify(r.table)},\n` +
        `    migration: ${JSON.stringify(r.migration)},\n` +
        `    columns: [${cols}],\n  },`
      );
    })
    .join("\n");
  return `// GENERATED by scripts/generate-expected-tables.js — do not edit by hand.
// Run the script after adding a table to supabase/types.ts; CI fails if this
// file drifts from types.ts + supabase/migrations.
//
// Migrations are applied to the live tenant MANUALLY. This list is what lets
// /api/v1/system/persistence say WHICH migration has not been run yet, instead
// of a page quietly rendering an empty list for a table that does not exist.

export interface ExpectedColumn {
  name: string;
  /**
   * The migration that ADDS it, which is always later than the one that
   * creates the table — that is why this column can be missing while the table
   * is present. Null means no migration in the repo mentions it at all.
   */
  migration: string | null;
}

export interface ExpectedTable {
  /** Table name as PostgREST sees it. */
  table: string;
  /** The migration file that creates it — the one to run if it is missing. */
  migration: string | null;
  /**
   * Only the columns added AFTER the table was created. The rest exist if and
   * only if the table does, so probing them would say nothing new. These are
   * the ones an unapplied ALTER leaves behind — #941's safer-recruitment
   * fields, for instance, on a staff_members table that has existed for months.
   */
  columns: ExpectedColumn[];
}

export const EXPECTED_TABLES: ExpectedTable[] = [
${body}
];
`;
}

const rows = collect();
if (require.main === module) {
  fs.writeFileSync(OUT, render(rows));
  console.log(`generate-expected-tables: wrote ${rows.length} tables to ${path.relative(ROOT, OUT)}`);
}

module.exports = { collect, render };
