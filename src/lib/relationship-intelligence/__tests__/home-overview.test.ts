import { describe, it, expect } from "vitest";
import { buildHomeRelationshipOverview, type HomeOverviewInput } from "../home-overview";

const NOW = "2026-06-22T12:00:00.000Z";

function baseInput(over: Partial<HomeOverviewInput> = {}): HomeOverviewInput {
  return {
    children: [],
    now: NOW,
    staffName: (id) => id,
    keyWorkingSessions: [],
    debriefRecords: [],
    incidents: [],
    familyTimeSessions: [],
    missingEpisodes: [],
    returnInterviews: [],
    positiveAchievements: [],
    educationRecords: [],
    lacReviews: [],
    behaviourLog: [],
    ...over,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inc = (o: any) => o;

describe("buildHomeRelationshipOverview", () => {
  it("ranks the child who needs us most first and counts statuses", () => {
    const o = buildHomeRelationshipOverview(
      baseInput({
        children: [
          { childId: "yp_calm", childName: "Calm", trustedAdults: ["Emma"], knownTriggers: [], calmingApproaches: [] },
          { childId: "yp_struggling", childName: "Struggling", trustedAdults: [], knownTriggers: [], calmingApproaches: [] },
        ],
        // Struggling: recent high-severity incidents → fragile relationships + concern emotional safety
        incidents: [
          inc({ id: "i1", child_id: "yp_struggling", date: "2026-06-18", type: "behaviour", severity: "high", description: "x", reported_by: "s1" }),
          inc({ id: "i2", child_id: "yp_struggling", date: "2026-06-12", type: "behaviour", severity: "high", description: "x", reported_by: "s1" }),
        ],
      }),
    );
    expect(o.children[0].childId).toBe("yp_struggling");
    expect(o.children[0].priority).toBeGreaterThan(o.children[1].priority);
    expect(o.children[0].relStatus).toBe("fragile");
    // counts add up across both children
    const relTotal = o.counts.relationships.secure + o.counts.relationships.developing + o.counts.relationships.fragile;
    expect(relTotal).toBe(2);
    expect(o.headline).toMatch(/need|needs/);
  });

  it("is settled (and says so) when every child is secure", () => {
    const o = buildHomeRelationshipOverview(
      baseInput({
        children: [{ childId: "yp_ok", childName: "Ok", trustedAdults: ["Emma"], knownTriggers: [], calmingApproaches: [] }],
        // Trusted adult + two recent key-work sessions, no rupture → secure relationally.
        keyWorkingSessions: [
          { child_id: "yp_ok", staff_id: "s1", date: "2026-06-18", mood_before: 3, mood_after: 4 } as never,
          { child_id: "yp_ok", staff_id: "s1", date: "2026-06-10", mood_before: 3, mood_after: 4 } as never,
        ],
      }),
    );
    expect(o.headline).toMatch(/settled/);
    expect(o.children[0].priority).toBe(0);
  });

  it("is deterministic and handles an empty home", () => {
    const empty = buildHomeRelationshipOverview(baseInput());
    expect(empty.children).toHaveLength(0);
    expect(empty.headline).toMatch(/No children/);
    expect(buildHomeRelationshipOverview(baseInput())).toEqual(empty);
  });
});
