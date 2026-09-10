import { describe, it, expect, vi } from "vitest";

// Live-leg regression for fix/phantom-table-reads: the service queried the
// phantom `staff` table (live: staff_members), filtered incidents on the
// phantom `staff_involved` column, read phantom `incident_type`, and checked
// the enum value "safeguarding" — the union member is "safeguarding_concern",
// so the critical safeguarding objective could never fire. The mocked client
// is keyed by REAL table name: the old code's `from("staff")` finds nothing
// and falls back to the demo pathway, failing every assertion below.
vi.mock("@/lib/supabase/server", () => {
  const table = (rows: Array<Record<string, unknown>> | null) => {
    const terminal = { data: rows, error: rows ? null : { message: "relation does not exist" } };
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "neq", "in", "is", "not", "contains", "or", "gte", "lte", "order"]) {
      b[m] = () => b;
    }
    b.limit = () => Promise.resolve(terminal);
    b.single = () =>
      Promise.resolve({ data: rows?.[0] ?? null, error: rows?.length ? null : { message: "no rows" } });
    return b;
  };
  const tables: Record<string, Array<Record<string, unknown>> | null> = {
    staff_members: [{ id: "st-1", full_name: "Dana Example", role: "senior_rcw" }],
    incidents: [
      { id: "i1", type: "physical_intervention", description: "hold in lounge", created_at: "2026-09-01T10:00:00Z" },
      { id: "i2", type: "physical_intervention", description: "hold at school run", created_at: "2026-09-02T10:00:00Z" },
      { id: "i3", type: "safeguarding_concern", description: "disclosure", created_at: "2026-09-03T10:00:00Z" },
    ],
  };
  return {
    createServerClient: () => ({ from: (t: string) => table(tables[t] ?? null) }),
    isSupabaseEnabled: () => true,
  };
});

import { generateStaffPathway } from "../learning-pathway.service";

describe("generateStaffPathway (live leg, mocked client)", () => {
  it("reads staff_members and builds objectives from real incident vocabulary", async () => {
    const p = await generateStaffPathway("st-1");
    expect(p.staffName).toBe("Dana Example"); // full_name off staff_members
    const titles = p.objectives.map((o) => o.title);
    expect(titles).toContain("De-escalation Refresher"); // 2× physical_intervention
    // "safeguarding_concern" is the real enum member — the old check used
    // "safeguarding", which no incident can ever be.
    const sg = p.objectives.find((o) => o.title === "Safeguarding Practice Review");
    expect(sg).toBeDefined();
    expect(sg!.priority).toBe("critical");
    expect(sg!.sourceEvidence).toContain("i3");
  });
});
