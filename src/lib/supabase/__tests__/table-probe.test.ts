// ══════════════════════════════════════════════════════════════════════════════
// Is the table there, or is the collection empty?
//
// Migrations reach the live tenant by hand — no `supabase db push` in CI or in
// the deploy. So a table can be shipped, merged, deployed and still not exist,
// and when it does not, PostgREST answers PGRST205, the service returns an
// error, and the page renders an empty list. Identical, on screen, to a home
// that has recorded nothing.
//
// The line these tests hold is the one that makes the report actionable:
//   missing  → there is a migration to run
//   errored  → there is NOT; the table may exist and hold a home's records
//   present  → readable, and its row count is a fact about data, not schema
//
// Reporting "errored" as "missing" would send someone to re-run a migration
// against a live table. Reporting "missing" as "empty" is the bug itself.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  isMissingTableError, missingColumnName, classifyProbe, summariseDrift,
} from "@/lib/supabase/table-probe";
import { EXPECTED_TABLES } from "@/lib/supabase/expected-tables";

describe("isMissingTableError", () => {
  it("recognises Postgres undefined_table", () => {
    expect(isMissingTableError({ code: "42P01" })).toBe(true);
  });

  it("recognises PostgREST's schema-cache miss — what an unmigrated table gives", () => {
    expect(isMissingTableError({ code: "PGRST205" })).toBe(true);
  });

  it("recognises the message forms when no code is surfaced", () => {
    expect(isMissingTableError({
      message: "Could not find the table 'public.cs_communication_drafts' in the schema cache",
    })).toBe(true);
    expect(isMissingTableError({ message: 'relation "tasks" does not exist' })).toBe(true);
  });

  it("does NOT treat an ordinary failure as a missing table", () => {
    expect(isMissingTableError({ code: "PGRST301", message: "JWT expired" })).toBe(false);
    expect(isMissingTableError({ message: "fetch failed" })).toBe(false);
    expect(isMissingTableError({ message: "permission denied for table incidents" })).toBe(false);
  });

  it("treats no error as no error", () => {
    expect(isMissingTableError(null)).toBe(false);
    expect(isMissingTableError({})).toBe(false);
  });
});

describe("classifyProbe", () => {
  it("a readable table is present, and its count is reported", () => {
    const r = classifyProbe("incidents", "0001_init.sql", { count: 42 });
    expect(r.status).toBe("present");
    expect(r.rows).toBe(42);
    expect(r.error).toBeNull();
  });

  it("★ a table that EXISTS with no rows is present, not missing", () => {
    const r = classifyProbe("incidents", "0001_init.sql", { count: 0 });
    expect(r.status).toBe("present");
    expect(r.rows).toBe(0);
  });

  it("a table that does not exist is missing, and carries the migration to run", () => {
    const r = classifyProbe("cs_communication_drafts", "20260816210000_persist.sql", {
      error: { code: "PGRST205", message: "Could not find the table" },
    });
    expect(r.status).toBe("missing");
    expect(r.migration).toBe("20260816210000_persist.sql");
    expect(r.rows).toBeNull();
  });

  it("★ any other failure is ERRORED, never missing — the table may be full", () => {
    const r = classifyProbe("incidents", "0001_init.sql", {
      error: { code: "PGRST301", message: "JWT expired" },
    });
    expect(r.status).toBe("errored");
    expect(r.rows).toBeNull();
    expect(r.error).toBe("JWT expired");
  });

  it("never reports a row count it did not get", () => {
    expect(classifyProbe("x", null, { error: { code: "42P01" } }).rows).toBeNull();
    expect(classifyProbe("x", null, { error: { message: "boom" } }).rows).toBeNull();
  });

  it("truncates the error text rather than letting it grow without bound", () => {
    const r = classifyProbe("x", null, { error: { message: "e".repeat(400) } });
    expect(r.error!.length).toBe(120);
  });
});

describe("summariseDrift", () => {
  const present = (t: string) => classifyProbe(t, `${t}.sql`, { count: 1 });
  const missing = (t: string) => classifyProbe(t, `${t}.sql`, { error: { code: "PGRST205" } });
  const errored = (t: string) => classifyProbe(t, `${t}.sql`, { error: { message: "network" } });

  it("says so plainly when every table is there", () => {
    const s = summariseDrift([present("a"), present("b")]);
    expect(s.missing).toBe(0);
    expect(s.pending_migrations).toEqual([]);
    expect(s.headline).toBe("All 2 expected tables exist on this tenant, with every expected column.");
  });

  it("names the migrations still to run, in run order", () => {
    const s = summariseDrift([present("a"), missing("20260816"), missing("20260815")]);
    expect(s.missing).toBe(2);
    expect(s.pending_migrations).toEqual(["20260815.sql", "20260816.sql"]);
    expect(s.headline).toContain("Run: 20260815.sql, 20260816.sql");
  });

  it("says what a missing table DOES — writes fail, reads render as empty", () => {
    const s = summariseDrift([missing("a")]);
    expect(s.headline).toContain("renders as empty");
  });

  it("★ does not call an unreadable table a missing one", () => {
    const s = summariseDrift([present("a"), errored("b")]);
    expect(s.missing).toBe(0);
    expect(s.errored).toBe(1);
    expect(s.pending_migrations).toEqual([]);
    expect(s.headline).toContain("not the same as missing");
    expect(s.headline).toContain("no migration to run for it");
  });

  it("dedupes when one migration creates several tables", () => {
    const both = [
      classifyProbe("a", "0001.sql", { error: { code: "42P01" } }),
      classifyProbe("b", "0001.sql", { error: { code: "42P01" } }),
    ];
    expect(summariseDrift(both).pending_migrations).toEqual(["0001.sql"]);
  });
});

describe("the generated manifest", () => {
  it("covers every typed table, and every one names its migration", () => {
    expect(EXPECTED_TABLES.length).toBeGreaterThan(40);
    for (const t of EXPECTED_TABLES) {
      expect(t.table).toMatch(/^[a-z_][a-z0-9_]*$/);
      expect(t.migration).toMatch(/\.sql$/);
    }
  });

  it("includes the two tables added most recently — the ones most likely unapplied", () => {
    const names = EXPECTED_TABLES.map((t) => t.table);
    expect(names).toContain("cs_communication_drafts");
    expect(names).toContain("behaviour_support_plans");
  });

  it("has no duplicates", () => {
    const names = EXPECTED_TABLES.map((t) => t.table);
    expect(new Set(names).size).toBe(names.length);
  });
});

// ── A table that exists, and is still missing a column ───────────────────────
//
// #941 added six safer-recruitment fields to staff_members — a table that has
// existed since the lean baseline. If that ALTER has not been run, the table is
// present, the row count is right, and every read naming one of those columns
// fails WHOLESALE: PostgREST rejects the entire select on the first unknown
// column, so the failure is not confined to the field that is absent.
//
// The table-level probe cannot see any of that. It reports "present".

describe("missingColumnName", () => {
  it("reads the column out of Postgres's undefined_column", () => {
    expect(missingColumnName({
      code: "42703",
      message: 'column staff_members.barred_list_checked_date does not exist',
    })).toBe("barred_list_checked_date");
  });

  it("handles an unqualified column name", () => {
    expect(missingColumnName({ code: "42703", message: 'column "dbs_date" does not exist' }))
      .toBe("dbs_date");
  });

  it("reads PostgREST's schema-cache form", () => {
    expect(missingColumnName({
      code: "PGRST204",
      message: "Could not find the 'prohibition_checked_by' column of 'staff_members' in the schema cache",
    })).toBe("prohibition_checked_by");
  });

  it("returns null when the failure is not about a column", () => {
    expect(missingColumnName({ code: "PGRST301", message: "JWT expired" })).toBeNull();
    expect(missingColumnName({ message: "fetch failed" })).toBeNull();
    expect(missingColumnName(null)).toBeNull();
  });

  it("★ returns null when it cannot name one — a caller must not guess", () => {
    // Mentions "column" but names nothing extractable.
    expect(missingColumnName({ code: "42703", message: "a column is wrong somewhere" })).toBeNull();
  });
});

describe("classifyProbe carries missing columns", () => {
  const cols = [{ name: "barred_list_checked_date", migration: "20260816200000_x.sql" }];

  it("a present table can still be short a column", () => {
    const r = classifyProbe("staff_members", "0000_base.sql", { count: 12, missingColumns: cols });
    expect(r.status).toBe("present");
    expect(r.rows).toBe(12);
    expect(r.missing_columns).toEqual(cols);
  });

  it("an empty array means checked and none missing", () => {
    expect(classifyProbe("x", null, { count: 0, missingColumns: [] }).missing_columns).toEqual([]);
  });

  it("★ null means NOT CHECKED, which is not the same as none missing", () => {
    expect(classifyProbe("x", null, { count: 0 }).missing_columns).toBeNull();
  });

  it("does not report columns for a table that does not exist", () => {
    const r = classifyProbe("x", null, { error: { code: "PGRST205" }, missingColumns: cols });
    expect(r.status).toBe("missing");
    expect(r.missing_columns).toBeNull();
  });
});

describe("summariseDrift counts columns as drift", () => {
  const short = (t: string, names: string[], file: string) =>
    classifyProbe(t, `${t}.sql`, {
      count: 5,
      missingColumns: names.map((name) => ({ name, migration: file })),
    });

  it("a present table short a column is still drift, and names its migration", () => {
    const s = summariseDrift([short("staff_members", ["barred_list_checked_date"], "20260816200000_x.sql")]);
    expect(s.missing).toBe(0);
    expect(s.tables_missing_columns).toBe(1);
    expect(s.missing_column_count).toBe(1);
    expect(s.pending_migrations).toEqual(["20260816200000_x.sql"]);
  });

  it("says why a missing column is worse than it sounds", () => {
    const s = summariseDrift([short("staff_members", ["a"], "m.sql")]);
    expect(s.headline).toContain("rejects the WHOLE select");
  });

  it("counts columns, not just tables", () => {
    const s = summariseDrift([short("staff_members", ["a", "b", "c"], "m.sql")]);
    expect(s.tables_missing_columns).toBe(1);
    expect(s.missing_column_count).toBe(3);
  });

  it("merges table and column migrations into ONE run list, in order", () => {
    const s = summariseDrift([
      classifyProbe("later", "20260816_b.sql", { error: { code: "PGRST205" } }),
      short("earlier", ["x"], "20260815_a.sql"),
    ]);
    expect(s.pending_migrations).toEqual(["20260815_a.sql", "20260816_b.sql"]);
  });

  it("says every column is there when nothing is missing", () => {
    const s = summariseDrift([classifyProbe("a", "a.sql", { count: 1, missingColumns: [] })]);
    expect(s.headline).toContain("with every expected column");
  });
});

describe("the generated manifest tracks later-added columns", () => {
  it("★ carries #941's six safer-recruitment fields against staff_members", () => {
    const staff = EXPECTED_TABLES.find((t) => t.table === "staff_members");
    expect(staff).toBeDefined();
    const names = staff!.columns.map((c) => c.name).sort();
    expect(names).toEqual([
      "barred_list_checked_by", "barred_list_checked_date",
      "prohibition_checked_by", "prohibition_checked_date",
      "right_to_work_checked_by", "right_to_work_checked_date",
    ]);
    for (const c of staff!.columns) {
      expect(c.migration).toBe("20260816200000_add_safer_recruitment_checks.sql");
    }
  });

  it("lists ONLY columns added after the table — the rest exist iff it does", () => {
    const staff = EXPECTED_TABLES.find((t) => t.table === "staff_members")!;
    const names = staff.columns.map((c) => c.name);
    // Both are staff_members columns, but they come from the table's own
    // create migration, so probing them would say nothing the table probe does.
    expect(names).not.toContain("first_name");
    expect(names).not.toContain("dbs_number");
  });

  it("every tracked column names the migration that adds it", () => {
    for (const t of EXPECTED_TABLES) {
      for (const c of t.columns) {
        expect(c.migration, `${t.table}.${c.name} has no migration`).toMatch(/\.sql$/);
        expect(c.migration).not.toBe(t.migration);
      }
    }
  });
});
