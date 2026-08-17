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

/** A client whose head-count answers depend on the table asked for. */
function fakeClient(answers: Record<string, { count?: number; error?: { code?: string; message?: string } }>) {
  return {
    from: (table: string) => ({
      select: async () => answers[table] ?? { count: 0, error: null },
    }),
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
