// ══════════════════════════════════════════════════════════════════════════════
// dal.inspectionHistory.update — the live (Supabase) branch
//
// PATCH /api/v1/inspection-history/[id] used to call db.inspectionHistory.update
// against the in-memory store, which isLiveTenant() empties at module load — so
// every edit 404'd on the live tenant. The route now calls dal, whose update
// writes through Supabase. The live branch cannot be reached without real
// credentials, so it is exercised here against a fake client that records the
// query it was asked to run.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";

const createServerClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => true,
  createServerClient: () => createServerClient(),
}));

import { dal } from "@/lib/db/dal";
import type { InspectionRecord } from "@/types/extended";

interface Captured {
  table: string;
  patch: Record<string, unknown>;
  filters: Record<string, unknown>;
}

type Chain = {
  eq: (col: string, val: unknown) => Chain;
  select: () => Chain;
  maybeSingle: () => Promise<{ data: InspectionRecord | null }>;
};

function fakeClient(row: InspectionRecord | null, captured: Captured[]) {
  return {
    from(table: string) {
      return {
        update(patch: Record<string, unknown>) {
          const filters: Record<string, unknown> = {};
          const chain: Chain = {
            eq(col: string, val: unknown) {
              filters[col] = val;
              return chain;
            },
            select() {
              return chain;
            },
            async maybeSingle() {
              captured.push({ table, patch, filters });
              return { data: row };
            },
          };
          return chain;
        },
      };
    },
  };
}

const sampleRow: InspectionRecord = {
  id: "insp_1",
  home_id: "a0000000-0000-0000-0000-000000000001",
  inspection_date: "2026-01-01",
  inspection_type: "Full inspection",
  grade: "Outstanding",
  inspector_name: "Jane Whitfield",
  report_reference: null,
  report_url: null,
  actions_required: 0,
  actions_completed: 0,
  summary: null,
  published_at: null,
  created_at: "2026-01-01T09:00:00Z",
  updated_at: "2026-01-02T09:00:00Z",
};

describe("dal.inspectionHistory.update (live branch)", () => {
  beforeEach(() => {
    createServerClient.mockReset();
  });

  it("writes an UPDATE scoped by id and home_id and returns the row", async () => {
    const captured: Captured[] = [];
    createServerClient.mockReturnValue(fakeClient(sampleRow, captured));

    const result = await dal.inspectionHistory.update("insp_1", { grade: "Outstanding" });

    expect(result).toEqual(sampleRow);
    expect(captured).toHaveLength(1);
    expect(captured[0].table).toBe("inspection_history");
    // Tenant isolation is enforced in the query, not just by RLS (the app
    // queries as service_role, which bypasses RLS).
    expect(captured[0].filters.id).toBe("insp_1");
    expect(typeof captured[0].filters.home_id).toBe("string");
    expect(captured[0].filters.home_id).toBeTruthy();
    expect(captured[0].patch.grade).toBe("Outstanding");
    expect(captured[0].patch.updated_at).toBeDefined();
  });

  it("returns null when no row matches (the 404 path)", async () => {
    const captured: Captured[] = [];
    createServerClient.mockReturnValue(fakeClient(null, captured));

    const result = await dal.inspectionHistory.update("insp_missing", { grade: "Good" });

    expect(result).toBeNull();
    expect(captured).toHaveLength(1);
  });

  it("whitelists columns — never writes id, home_id, created_at or unknown keys", async () => {
    const captured: Captured[] = [];
    createServerClient.mockReturnValue(fakeClient(sampleRow, captured));

    // Raw, client-supplied body: typed loosely so the extra keys model what a
    // caller could actually send through readJsonBody (data: any).
    const rawBody: Record<string, unknown> = {
      grade: "Good",
      inspector_name: "New Inspector",
      // Fields that must not reach the UPDATE:
      id: "evil",
      home_id: "some-other-home",
      created_at: "1999-01-01T00:00:00Z",
      bogus: 1,
    };
    await dal.inspectionHistory.update("insp_1", rawBody as Partial<InspectionRecord>);

    const patch = captured[0].patch;
    expect(patch.grade).toBe("Good");
    expect(patch.inspector_name).toBe("New Inspector");
    expect(patch.updated_at).toBeDefined();
    expect(patch).not.toHaveProperty("id");
    expect(patch).not.toHaveProperty("home_id");
    expect(patch).not.toHaveProperty("created_at");
    expect(patch).not.toHaveProperty("bogus");
  });
});
