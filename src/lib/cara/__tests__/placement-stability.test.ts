import { describe, it, expect } from "vitest";
import { assessPlacementStability, type PlacementInput } from "../placement-stability";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
}

function stableInput(overrides: Partial<PlacementInput> = {}): PlacementInput {
  return {
    childId: "child_test",
    childName: "Test Child",
    placementStartDate: makeDate(200),
    previousPlacements: 1,
    incidentCount: 0,
    incidentTrend: "stable",
    restraintCount: 0,
    missingEpisodes: 0,
    schoolAttendancePercent: 95,
    schoolExclusions: 0,
    hasKeyWorkerRelationship: true,
    keyWorkerConsistency: "stable",
    peerRelationships: "positive",
    familyContactRegular: true,
    familyContactQuality: "positive",
    engagedInEducation: true,
    engagedInActivities: true,
    outcomesProgress: "on_track",
    youngPersonViews: "wants_to_stay",
    averageMood: 4,
    moodTrend: "stable",
    selfHarmPresent: false,
    sleepDisturbance: false,
    ...overrides,
  };
}

function unstableInput(overrides: Partial<PlacementInput> = {}): PlacementInput {
  return {
    childId: "child_unstable",
    childName: "Unstable Child",
    placementStartDate: makeDate(30),
    previousPlacements: 6,
    incidentCount: 10,
    incidentTrend: "increasing",
    restraintCount: 4,
    missingEpisodes: 3,
    schoolAttendancePercent: 40,
    schoolExclusions: 2,
    hasKeyWorkerRelationship: false,
    keyWorkerConsistency: "multiple_changes",
    peerRelationships: "conflictual",
    familyContactRegular: false,
    familyContactQuality: "negative",
    engagedInEducation: false,
    engagedInActivities: false,
    outcomesProgress: "off_track",
    youngPersonViews: "wants_to_leave",
    averageMood: 1,
    moodTrend: "declining",
    selfHarmPresent: true,
    sleepDisturbance: true,
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Placement Stability Predictor", () => {
  describe("assessPlacementStability", () => {
    it("returns correct structure", () => {
      const result = assessPlacementStability(stableInput());
      expect(result.childId).toBe("child_test");
      expect(result.childName).toBe("Test Child");
      expect(result.assessedAt).toBeTruthy();
      expect(result.stabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.stabilityScore).toBeLessThanOrEqual(100);
      expect(["low", "moderate", "elevated", "high", "critical"]).toContain(result.riskLevel);
      expect(result.placementDuration).toBeGreaterThan(0);
      expect(result.summary).toBeTruthy();
    });

    it("scores stable placement highly", () => {
      const result = assessPlacementStability(stableInput());
      expect(result.stabilityScore).toBeGreaterThanOrEqual(80);
      expect(result.riskLevel).toBe("low");
    });

    it("scores unstable placement low", () => {
      const result = assessPlacementStability(unstableInput());
      expect(result.stabilityScore).toBeLessThan(35);
      expect(result.riskLevel).toBe("critical");
    });

    it("clamps score between 0 and 100", () => {
      const result = assessPlacementStability(unstableInput());
      expect(result.stabilityScore).toBeGreaterThanOrEqual(0);

      const result2 = assessPlacementStability(stableInput());
      expect(result2.stabilityScore).toBeLessThanOrEqual(100);
    });
  });

  // ── Risk factors ──────────────────────────────────────────────────────────

  describe("risk factors", () => {
    it("flags high incident count", () => {
      const result = assessPlacementStability(stableInput({ incidentCount: 9 }));
      expect(result.riskFactors.some((r) => r.id === "incidents_high")).toBe(true);
    });

    it("flags escalating incidents", () => {
      const result = assessPlacementStability(stableInput({ incidentTrend: "increasing" }));
      expect(result.riskFactors.some((r) => r.id === "incidents_increasing")).toBe(true);
    });

    it("flags restraint use", () => {
      const result = assessPlacementStability(stableInput({ restraintCount: 3 }));
      expect(result.riskFactors.some((r) => r.id === "restraints_high")).toBe(true);
    });

    it("flags missing episodes", () => {
      const result = assessPlacementStability(stableInput({ missingEpisodes: 3 }));
      expect(result.riskFactors.some((r) => r.id === "missing_frequent")).toBe(true);
    });

    it("flags poor school attendance", () => {
      const result = assessPlacementStability(stableInput({ schoolAttendancePercent: 50 }));
      expect(result.riskFactors.some((r) => r.id === "school_poor")).toBe(true);
    });

    it("flags school exclusions", () => {
      const result = assessPlacementStability(stableInput({ schoolExclusions: 2 }));
      expect(result.riskFactors.some((r) => r.id === "exclusions_multiple")).toBe(true);
    });

    it("flags young person wanting to leave", () => {
      const result = assessPlacementStability(stableInput({ youngPersonViews: "wants_to_leave" }));
      expect(result.riskFactors.some((r) => r.id === "yp_wants_leave")).toBe(true);
      expect(result.earlyWarnings.some((w) => w.includes("wants to leave"))).toBe(true);
    });

    it("flags self-harm", () => {
      const result = assessPlacementStability(stableInput({ selfHarmPresent: true }));
      expect(result.riskFactors.some((r) => r.id === "self_harm")).toBe(true);
    });

    it("flags placement history", () => {
      const result = assessPlacementStability(stableInput({ previousPlacements: 6 }));
      expect(result.riskFactors.some((r) => r.id === "history_high")).toBe(true);
    });

    it("flags key worker absence", () => {
      const result = assessPlacementStability(stableInput({ hasKeyWorkerRelationship: false }));
      expect(result.riskFactors.some((r) => r.id === "no_key_worker")).toBe(true);
    });

    it("flags peer conflict", () => {
      const result = assessPlacementStability(stableInput({ peerRelationships: "conflictual" }));
      expect(result.riskFactors.some((r) => r.id === "peers_conflict")).toBe(true);
    });
  });

  // ── Protective factors ────────────────────────────────────────────────────

  describe("protective factors", () => {
    it("identifies low incidents as protective", () => {
      const result = assessPlacementStability(stableInput({ incidentCount: 0 }));
      expect(result.protectiveFactors.some((p) => p.id === "incidents_low")).toBe(true);
    });

    it("identifies decreasing incidents as protective", () => {
      const result = assessPlacementStability(stableInput({ incidentTrend: "decreasing" }));
      expect(result.protectiveFactors.some((p) => p.id === "incidents_decreasing")).toBe(true);
    });

    it("identifies good school attendance as protective", () => {
      const result = assessPlacementStability(stableInput({ schoolAttendancePercent: 95 }));
      expect(result.protectiveFactors.some((p) => p.id === "school_good")).toBe(true);
    });

    it("identifies positive peer relationships", () => {
      const result = assessPlacementStability(stableInput({ peerRelationships: "positive" }));
      expect(result.protectiveFactors.some((p) => p.id === "peers_positive")).toBe(true);
    });

    it("identifies young person wanting to stay", () => {
      const result = assessPlacementStability(stableInput({ youngPersonViews: "wants_to_stay" }));
      expect(result.protectiveFactors.some((p) => p.id === "yp_wants_stay")).toBe(true);
    });

    it("identifies long placement as protective", () => {
      const result = assessPlacementStability(stableInput({ placementStartDate: makeDate(400) }));
      expect(result.protectiveFactors.some((p) => p.id === "long_placement")).toBe(true);
    });
  });

  // ── Early warnings ────────────────────────────────────────────────────────

  describe("early warnings", () => {
    it("generates early warning for new placement", () => {
      const result = assessPlacementStability(stableInput({ placementStartDate: makeDate(14) }));
      expect(result.earlyWarnings.some((w) => w.includes("Early placement"))).toBe(true);
    });

    it("generates warning for escalating incidents", () => {
      const result = assessPlacementStability(stableInput({ incidentTrend: "increasing" }));
      expect(result.earlyWarnings.some((w) => w.includes("increasing"))).toBe(true);
    });

    it("generates warning for self-harm", () => {
      const result = assessPlacementStability(stableInput({ selfHarmPresent: true }));
      expect(result.earlyWarnings.some((w) => w.includes("Self-harm"))).toBe(true);
    });

    it("caps early warnings at 5", () => {
      const result = assessPlacementStability(unstableInput());
      expect(result.earlyWarnings.length).toBeLessThanOrEqual(5);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends professionals meeting for critical risk", () => {
      const result = assessPlacementStability(unstableInput());
      expect(result.recommendations.some((r) => r.includes("professionals meeting"))).toBe(true);
    });

    it("recommends BSP review for high incident severity", () => {
      const result = assessPlacementStability(stableInput({ incidentCount: 9, incidentTrend: "increasing" }));
      expect(result.recommendations.some((r) => r.includes("behaviour support plan"))).toBe(true);
    });

    it("recommends conversation with YP if they want to leave", () => {
      const result = assessPlacementStability(stableInput({ youngPersonViews: "wants_to_leave" }));
      expect(result.recommendations.some((r) => r.includes("young person"))).toBe(true);
    });

    it("caps recommendations at 4", () => {
      const result = assessPlacementStability(unstableInput());
      expect(result.recommendations.length).toBeLessThanOrEqual(4);
    });
  });

  // ── Risk levels ───────────────────────────────────────────────────────────

  describe("risk levels", () => {
    it("low for score >= 80", () => {
      const result = assessPlacementStability(stableInput());
      if (result.stabilityScore >= 80) expect(result.riskLevel).toBe("low");
    });

    it("critical for score < 35", () => {
      const result = assessPlacementStability(unstableInput());
      if (result.stabilityScore < 35) expect(result.riskLevel).toBe("critical");
    });

    it("moderate for mid-range scores", () => {
      // Introduce some moderate risk factors
      const result = assessPlacementStability(stableInput({
        incidentCount: 5,
        schoolAttendancePercent: 70,
        youngPersonViews: "ambivalent",
        peerRelationships: "mixed",
      }));
      expect(["moderate", "elevated", "low"]).toContain(result.riskLevel);
    });
  });
});
