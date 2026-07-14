import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/v1/restraint-intelligence/route";

// Regression guard: this route was dead (500) because a seed record hid its
// missing required fields behind a member-level `as RestraintRecord` cast —
// r.notifications_sent.length threw on the incomplete record. Executing the
// real route against the seeded store keeps the whole chain honest.
describe("restraint-intelligence route", () => {
  it("returns 200 with populated analysis over the seeded restraints", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data.overview.total_incidents_90d).toBeGreaterThan(0);
    // Injuries reach the engine (person/injury -> person/description mapping).
    expect(body.data.overview.incidents_with_injury).toBeGreaterThan(0);
    // The corrected seed vocabulary flows through to the breakdowns — these
    // were impossible while seeds used values outside RestraintReason.
    const reasons = body.data.reason_breakdown.map((r: { reason: string }) => r.reason);
    expect(reasons).toContain("harm_to_self");
  });
});
