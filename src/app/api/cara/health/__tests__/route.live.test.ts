import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Live-leg regression for fix/phantom-table-reads: this route looked the child
// up in the phantom `children` table, so on live Supabase every analysis ran
// with the child named "Unknown". The table-keyed fake only answers for
// young_people — the old read finds nothing and the name assertion fails.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return makeFakeSupabaseModule({
    young_people: [{
      id: "yp-live-1", first_name: "Jayden", last_name: "Tester",
      date_of_birth: "2011-04-01", placement_start: "2025-03-01", placement_type: "long_term",
    }],
    // Every other table this route reads exists only in the archived schema —
    // the fake errors them like live PostgREST would, and the route degrades
    // to empty collections exactly as on the live tenant.
  });
});

import { GET } from "../route";

describe("cara/health (live leg, mocked client)", () => {
  it("resolves the child from young_people — not the phantom children table", async () => {
    const res = await GET(new NextRequest("http://localhost/api/cara/health?childId=yp-live-1"));
    const body = (await res.json()).data;
    expect(JSON.stringify(body)).toContain("Jayden Tester");
  });
});
