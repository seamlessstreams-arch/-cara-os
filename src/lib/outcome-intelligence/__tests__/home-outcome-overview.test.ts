import { describe, it, expect } from "vitest";
import { buildHomeOutcomeOverview, type HomeOutcomeInput } from "../home-outcome-overview";

const NOW = "2026-06-22T12:00:00.000Z";
const RECENT = "2026-05-20";
const RECENT_2 = "2026-06-10";

function input(over: Partial<HomeOutcomeInput> = {}): HomeOutcomeInput {
  return {
    now: NOW,
    children: [],
    keyWorkingSessions: [],
    incidents: [],
    missingEpisodes: [],
    educationRecords: [],
    positiveAchievements: [],
    familyTimeSessions: [],
    returnInterviews: [],
    lacReviews: [],
    ...over,
  };
}

describe("buildHomeOutcomeOverview", () => {
  it("handles an empty home", () => {
    const out = buildHomeOutcomeOverview(input());
    expect(out.childCount).toBe(0);
    expect(out.headline).toMatch(/No children/i);
    expect(out.domainSummaries).toHaveLength(5);
  });

  it("is deterministic for a given now", () => {
    const args = input({ children: [{ id: "yp_a", name: "A", trustedAdults: ["Emma (RM)"] }] });
    expect(buildHomeOutcomeOverview(args)).toEqual(buildHomeOutcomeOverview(args));
  });

  it("ranks a child with a recent high-severity incident above a settled child", () => {
    const out = buildHomeOutcomeOverview(
      input({
        children: [
          { id: "yp_calm", name: "Calm Child", trustedAdults: ["Emma (RM)"] },
          { id: "yp_risk", name: "At Risk", trustedAdults: ["Emma (RM)"] },
        ],
        incidents: [
          { id: "i1", child_id: "yp_risk", date: RECENT, severity: "critical", type: "physical", description: "x" } as never,
        ],
      }),
    );
    expect(out.children[0].childId).toBe("yp_risk");
    expect(out.children[0].priority).toBeGreaterThan(out.children[1].priority);
    expect(out.childrenNeedingFocus).toBeGreaterThanOrEqual(1);
  });

  it("builds a home-wide domain heatmap that sums to the child count per domain", () => {
    const out = buildHomeOutcomeOverview(
      input({
        children: [
          { id: "yp_a", name: "A", trustedAdults: ["Emma (RM)"] },
          { id: "yp_b", name: "B", trustedAdults: [] },
        ],
        incidents: [
          { id: "i1", child_id: "yp_a", date: RECENT, severity: "high", type: "physical", description: "x" } as never,
        ],
      }),
    );
    const safety = out.domainSummaries.find((d) => d.key === "safety")!;
    expect(safety.onTrack + safety.progressing + safety.needsFocus).toBe(2);
    // yp_a has a recent high-severity incident → that child's safety needs focus.
    expect(safety.needsFocus).toBeGreaterThanOrEqual(1);
  });

  it("reports all-positive when no child has a concern", () => {
    const out = buildHomeOutcomeOverview(
      input({
        children: [
          { id: "yp_a", name: "A", trustedAdults: ["Emma (RM)"] },
          { id: "yp_b", name: "B", trustedAdults: ["Olivia (RM)"] },
        ],
        keyWorkingSessions: [
          { id: "k1", child_id: "yp_a", date: RECENT, staff_id: "s1", mood_before: 3, mood_after: 5 } as never,
          { id: "k2", child_id: "yp_a", date: RECENT_2, staff_id: "s1", mood_before: 3, mood_after: 5 } as never,
          { id: "k3", child_id: "yp_b", date: RECENT, staff_id: "s1", mood_before: 3, mood_after: 5 } as never,
          { id: "k4", child_id: "yp_b", date: RECENT_2, staff_id: "s1", mood_before: 3, mood_after: 5 } as never,
        ],
      }),
    );
    expect(out.childrenNeedingFocus).toBe(0);
    expect(out.headline).toMatch(/on track or progressing/i);
  });
});
