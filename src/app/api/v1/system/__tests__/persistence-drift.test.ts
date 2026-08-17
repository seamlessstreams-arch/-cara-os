// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/system/persistence — does the tenant actually have its tables?
//
// Migrations are applied to the live tenant by hand. #942 shipped
// cs_communication_drafts, deployed, and live-verified — and none of that
// proved the table had been created. A missing table renders as an empty list,
// so nothing in the product could say which migration still needed running.
//
// The route is the only surface that can tell the difference, so it is
// exercised here for real: the handler runs, against a fake Supabase client
// that answers differently per table.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";

const isSupabaseEnabled = vi.fn();
const createServerClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => isSupabaseEnabled(),
  createServerClient: () => createServerClient(),
}));

import { GET } from "@/app/api/v1/system/persistence/route";
import { EXPECTED_TABLES } from "@/lib/supabase/expected-tables";

type Answer = { count?: number; error?: { code?: string; message?: string } };

/**
 * A client whose answers depend on the table asked for, and — for the column
 * probe — on which columns are asked for.
 *
 * `absentColumns` models what PostgREST actually does: it rejects the WHOLE
 * select on the FIRST unknown column and names only that one, which is why the
 * route has to ask repeatedly, dropping one each time.
 */
function fakeClient(
  answers: Record<string, Answer>,
  absentColumns: Record<string, string[]> = {},
) {
  return {
    from: (table: string) => {
      const builder = (columns?: string) => {
        const asked = (columns ?? "*").split(",").map((c) => c.trim());
        const absent = (absentColumns[table] ?? []).find((c) => asked.includes(c));
        const result = absent
          ? { error: { code: "42703", message: `column ${table}.${absent} does not exist` } }
          : (answers[table] ?? { count: 0, error: null });
        return {
          ...result,
          limit: async () => result,
          then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
        };
      };
      return { select: (columns?: string) => builder(columns) };
    },
  };
}

async function run() {
  const res = await GET();
  return (await res.json()) as { data: Record<string, any> };
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseEnabled.mockReturnValue(true);
});

describe("every expected table is probed, not a hardcoded four", () => {
  it("checks all of them", async () => {
    createServerClient.mockReturnValue(fakeClient({}));
    const { data } = await run();
    expect(data.probe).toHaveLength(EXPECTED_TABLES.length);
    expect(data.drift.checked).toBe(EXPECTED_TABLES.length);
  });

  it("reports every table present when the tenant is fully migrated", async () => {
    createServerClient.mockReturnValue(fakeClient({}));
    const { data } = await run();
    expect(data.drift.missing).toBe(0);
    expect(data.drift.pending_migrations).toEqual([]);
    expect(data.drift.headline).toContain("exist on this tenant");
  });
});

describe("a table that was shipped but never created", () => {
  it("is named, with the migration to run", async () => {
    createServerClient.mockReturnValue(fakeClient({
      cs_communication_drafts: { error: { code: "PGRST205", message: "Could not find the table" } },
    }));
    const { data } = await run();

    expect(data.drift.missing).toBe(1);
    expect(data.drift.pending_migrations).toEqual(["20260816210000_persist_communication_drafts.sql"]);
    const row = data.probe.find((p: { table: string }) => p.table === "cs_communication_drafts");
    expect(row.status).toBe("missing");
    expect(row.rows).toBeNull();
  });

  it("says what it costs — writes fail, reads render as empty", async () => {
    createServerClient.mockReturnValue(fakeClient({
      cs_communication_drafts: { error: { code: "PGRST205" } },
    }));
    const { data } = await run();
    expect(data.drift.headline).toContain("renders as empty");
  });

  it("★ is not confused with a table that exists and holds nothing", async () => {
    createServerClient.mockReturnValue(fakeClient({ tasks: { count: 0 } }));
    const { data } = await run();
    expect(data.drift.missing).toBe(0);
    expect(data.probe.find((p: { table: string }) => p.table === "tasks").status).toBe("present");
  });

  it("★ is not confused with a table that could not be read", async () => {
    createServerClient.mockReturnValue(fakeClient({
      incidents: { error: { message: "connection reset" } },
    }));
    const { data } = await run();
    expect(data.drift.missing).toBe(0);
    expect(data.drift.errored).toBe(1);
    expect(data.drift.pending_migrations).toEqual([]);
  });
});

describe("what it refuses to claim", () => {
  it("reports no drift at all in demo mode — an unprobed tenant has not been checked", async () => {
    isSupabaseEnabled.mockReturnValue(false);
    const { data } = await run();
    expect(data.mode).toBe("demo");
    expect(data.drift).toBeNull();
    expect(data.probe).toEqual([]);
  });

  it("reports no drift when the client cannot be built", async () => {
    createServerClient.mockReturnValue(null);
    const { data } = await run();
    expect(data.drift).toBeNull();
  });

  it("never returns any environment VALUE, only whether each is set", async () => {
    createServerClient.mockReturnValue(fakeClient({}));
    const { data } = await run();
    for (const v of Object.values(data.env)) expect(typeof v).toBe("boolean");
  });

  it("states that a shipped migration is not an applied one", async () => {
    createServerClient.mockReturnValue(fakeClient({}));
    const { data } = await run();
    expect(data.migration_note).toContain("by hand");
  });

  it("survives a client that throws rather than returning an error", async () => {
    createServerClient.mockReturnValue({
      from: () => ({ select: async () => { throw new Error("socket hang up"); } }),
    });
    const { data } = await run();
    expect(data.drift.errored).toBe(EXPECTED_TABLES.length);
    expect(data.drift.missing).toBe(0);
  });
});

// ── The table is there; the ALTER was never run ──────────────────────────────
//
// #941 added six safer-recruitment columns to staff_members, a table that has
// existed since the lean baseline. Unapplied, the table-level probe reports
// "present" with the right row count and nothing looks wrong — while every read
// naming one of those columns fails wholesale.

describe("a present table that is short a column", () => {
  const staffShort = (...columns: string[]) =>
    fakeClient({ staff_members: { count: 14 } }, { staff_members: columns });

  it("is still reported as present, with its real row count", async () => {
    createServerClient.mockReturnValue(staffShort("barred_list_checked_date"));
    const { data } = await run();
    const row = data.probe.find((p: { table: string }) => p.table === "staff_members");
    expect(row.status).toBe("present");
    expect(row.rows).toBe(14);
  });

  it("★ names the columns it does not have, and the migration that adds them", async () => {
    createServerClient.mockReturnValue(
      staffShort("barred_list_checked_date", "prohibition_checked_by"),
    );
    const { data } = await run();
    const row = data.probe.find((p: { table: string }) => p.table === "staff_members");

    expect(row.missing_columns.map((c: { name: string }) => c.name))
      .toEqual(["barred_list_checked_date", "prohibition_checked_by"]);
    expect(data.drift.missing_column_count).toBe(2);
    expect(data.drift.tables_missing_columns).toBe(1);
    expect(data.drift.pending_migrations)
      .toEqual(["20260816200000_add_safer_recruitment_checks.sql"]);
  });

  it("finds ALL of them, though PostgREST names only one per refusal", async () => {
    createServerClient.mockReturnValue(staffShort(
      "barred_list_checked_by", "barred_list_checked_date",
      "prohibition_checked_by", "prohibition_checked_date",
      "right_to_work_checked_by", "right_to_work_checked_date",
    ));
    const { data } = await run();
    expect(data.drift.missing_column_count).toBe(6);
  });

  it("reports an empty list — not null — when every column is there", async () => {
    createServerClient.mockReturnValue(fakeClient({}));
    const { data } = await run();
    const row = data.probe.find((p: { table: string }) => p.table === "staff_members");
    expect(row.missing_columns).toEqual([]);
    expect(data.drift.missing_column_count).toBe(0);
    expect(data.drift.headline).toContain("with every expected column");
  });

  it("★ reports NOT CHECKED rather than guessing when the refusal names nothing", async () => {
    createServerClient.mockReturnValue({
      from: () => ({
        select: (columns?: string) => {
          const res = columns && columns !== "*"
            ? { error: { code: "42703", message: "something is wrong with a column" } }
            : { count: 3, error: null };
          return { ...res, limit: async () => res, then: (r: (v: unknown) => unknown) => Promise.resolve(res).then(r) };
        },
      }),
    });
    const { data } = await run();
    const row = data.probe.find((p: { table: string }) => p.table === "staff_members");
    expect(row.status).toBe("present");
    expect(row.missing_columns).toBeNull();
    expect(data.drift.missing_column_count).toBe(0);
  });

  it("does not probe columns on a table that does not exist", async () => {
    createServerClient.mockReturnValue(fakeClient({
      staff_members: { error: { code: "PGRST205" } },
    }));
    const { data } = await run();
    const row = data.probe.find((p: { table: string }) => p.table === "staff_members");
    expect(row.status).toBe("missing");
    expect(row.missing_columns).toBeNull();
    // One fact, not seven: the table is absent.
    expect(data.drift.missing_column_count).toBe(0);
  });

  it("merges table drift and column drift into one run list", async () => {
    createServerClient.mockReturnValue(fakeClient(
      { cs_communication_drafts: { error: { code: "PGRST205" } }, staff_members: { count: 9 } },
      { staff_members: ["barred_list_checked_date"] },
    ));
    const { data } = await run();
    expect(data.drift.pending_migrations).toEqual([
      "20260816200000_add_safer_recruitment_checks.sql",
      "20260816210000_persist_communication_drafts.sql",
    ]);
  });
});
