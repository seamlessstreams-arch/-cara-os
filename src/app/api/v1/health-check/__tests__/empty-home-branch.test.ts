import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// The health-check has two branches. The measured one reports an unmeasured
// domain as null. The empty-home branch used to return 0 for every score and
// "medium" risk as "type-valid placeholders never rendered while
// assessed:false" — so the two disagreed in shape, and a consumer written to
// the honest-null convention would null-guard one and quietly accept a failing
// score from the other. A home with nothing recorded is unmeasured, not failing.

const empty = () => Promise.resolve([]);

vi.mock("@/lib/db/dal", () => ({
  dal: {
    youngPeople: { findAll: empty },
    incidents: { findAll: empty },
    medicationAdministrations: { findAll: empty },
    shifts: { findAll: empty },
    training: { findAll: empty },
  },
}));

beforeEach(() => vi.clearAllMocks());

describe("health-check with nothing recorded", () => {
  it("reports every score as unmeasured, not as zero", async () => {
    const { GET } = await import("../route");
    const res = await GET(new NextRequest("http://localhost/api/v1/health-check"));
    const { data } = await res.json();

    expect(data.assessed).toBe(false);
    for (const field of ["overall", "safeguarding", "medication", "staffing", "compliance"]) {
      expect(data[field], `${field} must be null, not a fabricated score`).toBeNull();
    }
  });

  it("does not call an unrecorded home a medium risk", async () => {
    const { GET } = await import("../route");
    const res = await GET(new NextRequest("http://localhost/api/v1/health-check"));
    const { data } = await res.json();
    expect(data.risk_level).toBeNull();
  });

  it("still says why, and still carries the build marker", async () => {
    const { GET } = await import("../route");
    const res = await GET(new NextRequest("http://localhost/api/v1/health-check"));
    const { data } = await res.json();
    expect(data.note).toMatch(/no records yet/i);
    expect(data.build?.commit).toBeTruthy();
  });
});
