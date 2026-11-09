// recordIntakeAudit with Supabase on: supabase-js RESOLVES with `error` on a
// failed insert rather than throwing, so the writer must read it. These tests
// hand it a stub client and check it never claims a write that did not land.

import { describe, it, expect, vi, beforeEach } from "vitest";

const createServerClient = vi.fn();

vi.mock("@/lib/supabase/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/supabase/server")>()),
  isSupabaseEnabled: () => true,
  createServerClient: () => createServerClient(),
}));
vi.mock("@/lib/supabase/tenant", () => ({ tenantHomeId: () => "00000000-0000-4000-8000-000000000001" }));

import { recordIntakeAudit } from "../intake-store";

function stubClient(result: { error: unknown }, writes: Array<{ table: string; row: unknown }>) {
  return {
    from: (table: string) => ({
      insert: async (row: unknown) => {
        writes.push({ table, row });
        return result;
      },
    }),
  };
}

const ENTRY = {
  action: "pattern_candidate_approved" as const,
  actorId: "staff-live-1",
  entityId: "cand-1",
  reason: "Specific, verified against Regulation 45, and paraphrased.",
};

describe("recordIntakeAudit (Supabase on)", () => {
  beforeEach(() => {
    createServerClient.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("writes who, what, which record and why to cara_audit_logs", async () => {
    const writes: Array<{ table: string; row: unknown }> = [];
    createServerClient.mockReturnValue(stubClient({ error: null }, writes));
    const r = await recordIntakeAudit(ENTRY);
    expect(r).toEqual({ recorded: true });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      table: "cara_audit_logs",
      row: {
        user_id: "staff-live-1",
        action_type: "pattern_candidate_approved",
        entity_type: "practice_pattern_candidate",
        entity_id: "cand-1",
        metadata: { reason: ENTRY.reason },
      },
    });
  });

  it("reports a failed insert as NOT recorded instead of swallowing it", async () => {
    createServerClient.mockReturnValue(
      stubClient({ error: { message: 'relation "cara_audit_logs" does not exist', code: "42P01" } }, []),
    );
    const r = await recordIntakeAudit(ENTRY);
    expect(r.recorded).toBe(false);
    expect(r.error).toMatch(/does not exist/);
    expect(console.error).toHaveBeenCalled();
  });

  it("reports a missing client as not recorded", async () => {
    createServerClient.mockReturnValue(null);
    expect(await recordIntakeAudit(ENTRY)).toEqual({ recorded: false, error: "no database client" });
  });
});
