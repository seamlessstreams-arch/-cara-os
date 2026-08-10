import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/v1/staff-training-compliance-intelligence/route";

// Regression guard: this route threw `ReferenceError: Cannot access
// 'mandatoryRecords' before initialization` on EVERY request. The per-staff
// map callback referenced a const declared ~30 lines below it, so the whole
// page at /intelligence/cara/staff-training-compliance was dead in production.
//
// tsc allows this shape — a block-scoped variable read inside a closure is
// legal at compile time because the compiler can't know when the closure runs —
// and the build never executes route handlers, so nothing caught it. Executing
// the real route is the only check that does.
describe("staff-training-compliance-intelligence route", () => {
  it("responds without throwing", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("scores each staff member against their OWN mandatory total", async () => {
    const body = await (await GET()).json();
    const profiles = body.data.staffProfiles as Array<{
      mandatoryTotal: number;
      signal: string;
      mandatoryExpired: number;
      mandatoryNotStarted: number;
      mandatoryExpiringSoon: number;
    }>;
    expect(profiles.length).toBeGreaterThan(0);

    // The denominator bug would have read the home-wide count here, so a staff
    // member with no mandatory records could come back "compliant" — the
    // fabricate-on-empty shape. Empty must mean not_recorded, always.
    for (const p of profiles) {
      if (p.mandatoryTotal === 0) {
        expect(p.signal).toBe("not_recorded");
      } else if (p.mandatoryExpired > 0 || p.mandatoryNotStarted > 0) {
        expect(p.signal).toBe("non_compliant");
      } else if (p.mandatoryExpiringSoon > 0) {
        expect(p.signal).toBe("expiring");
      } else {
        expect(p.signal).toBe("compliant");
      }
    }
  });
});
