import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Live-leg regression for fix/phantom-table-reads: this route (like 15
// siblings) looked the child up in the phantom `children` table, so on live
// Supabase every analysis ran with the child named "Unknown". The mocked
// client is keyed by REAL table name — the old `from("children")` read finds
// nothing and the assertion on the child's name fails.
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
    young_people: [
      { id: "yp-live-1", first_name: "Jayden", last_name: "Tester", date_of_birth: "2011-04-01" },
    ],
    // activities / activity_config exist only in the archived schema — the
    // fake errors them like live PostgREST would, and the route degrades to
    // an empty activity list exactly as on the live tenant.
  };
  return {
    createServerClient: () => ({ from: (t: string) => table(tables[t] ?? null) }),
    isSupabaseEnabled: () => true,
  };
});

import { GET } from "../route";

describe("cara/activities (live leg, mocked client)", () => {
  it("resolves the child from young_people — not the phantom children table", async () => {
    const res = await GET(new NextRequest("http://localhost/api/cara/activities?childId=yp-live-1"));
    const body = (await res.json()).data;
    expect(body.childName).toBe("Jayden Tester");
    expect(body.childName).not.toBe("Unknown");
  });
});
