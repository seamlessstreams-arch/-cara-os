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
  isMissingTableError, classifyProbe, summariseDrift,
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
    expect(s.headline).toBe("All 2 expected tables exist on this tenant.");
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
