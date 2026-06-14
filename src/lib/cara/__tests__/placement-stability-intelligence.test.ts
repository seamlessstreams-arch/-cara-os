// ══════════════════════════════════════════════════════════════════════════════
// Tests — Placement Stability Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analysePlacementStability,
  PlacementStabilityInput,
  PlacementHistory,
  DisruptionIndicator,
} from "../placement-stability-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date("2026-05-16T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

function makePlacement(overrides: Partial<PlacementHistory> = {}): PlacementHistory {
  return {
    id: `pl_${Math.random().toString(36).slice(2)}`,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    type: "residential",
    durationDays: 365,
    planned: true,
    ...overrides,
  };
}

function makeInput(overrides: Partial<PlacementStabilityInput> = {}): PlacementStabilityInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    currentPlacementStartDate: "2025-08-01",
    currentPlacementDays: 289,
    placementHistory: [],
    totalPlacementsEver: 1,
    disruptionIndicators: [],
    indicatorTrend: "stable",
    incidentsLast30Days: 1,
    incidentsTrend: "stable",
    missingEpisodesLast30Days: 0,
    childFeelsSettled: true,
    childWantsToStay: true,
    childHasRoomPersonalised: true,
    regularRoutineEstablished: true,
    positiveStaffRelationships: true,
    peerRelationshipsGood: true,
    placementReviewCurrent: true,
    matchingAssessmentDone: true,
    impactRiskAssessmentDone: true,
    contingencyPlanInPlace: true,
    stayingPutOptionExplored: false,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════

describe("Placement Stability Intelligence Engine", () => {

  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns valid assessment structure", () => {
      const result = analysePlacementStability(makeInput());
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("stabilityScore");
      expect(result).toHaveProperty("disruptionRiskScore");
      expect(result).toHaveProperty("belongingScore");
      expect(result).toHaveProperty("planningScore");
      expect(result).toHaveProperty("disruptionRiskLevel");
      expect(result).toHaveProperty("activeIndicators");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName", () => {
      const result = analysePlacementStability(makeInput({ childName: "Sam" }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });
  });

  // ── Disruption risk assessment ────────────────────────────────────────

  describe("Disruption risk assessment", () => {
    it("low risk for stable placement", () => {
      const result = analysePlacementStability(makeInput());
      expect(result.disruptionRiskLevel).toBe("low");
    });

    it("high risk with multiple indicators", () => {
      const result = analysePlacementStability(makeInput({
        disruptionIndicators: ["running_away", "self_harm", "peer_conflict"],
        indicatorTrend: "worsening",
        incidentsLast30Days: 6,
      }));
      expect(["high", "very_high"]).toContain(result.disruptionRiskLevel);
    });

    it("very high risk with many factors", () => {
      const result = analysePlacementStability(makeInput({
        disruptionIndicators: ["running_away", "self_harm", "police_involvement", "refusing_boundaries"],
        indicatorTrend: "worsening",
        incidentsLast30Days: 12,
        incidentsTrend: "increasing",
        missingEpisodesLast30Days: 4,
        childWantsToStay: false,
        placementHistory: [
          makePlacement({ endReason: "breakdown" }),
          makePlacement({ endReason: "breakdown" }),
          makePlacement({ endReason: "breakdown" }),
        ],
      }));
      expect(result.disruptionRiskLevel).toBe("very_high");
    });

    it("medium risk with some indicators", () => {
      const result = analysePlacementStability(makeInput({
        disruptionIndicators: ["peer_conflict", "disengagement"],
        incidentsLast30Days: 3,
      }));
      expect(result.disruptionRiskLevel).toBe("medium");
    });

    it("child not wanting to stay increases risk", () => {
      const result = analysePlacementStability(makeInput({
        childWantsToStay: false,
        disruptionIndicators: ["placement_request"],
      }));
      expect(result.disruptionRiskLevel).not.toBe("low");
    });
  });

  // ── Stability scoring ─────────────────────────────────────────────────

  describe("Stability scoring", () => {
    it("high for long placement with no breakdowns", () => {
      const result = analysePlacementStability(makeInput({
        currentPlacementDays: 400,
        totalPlacementsEver: 1,
      }));
      expect(result.stabilityScore).toBeGreaterThan(85);
    });

    it("low for many placements with breakdowns", () => {
      const result = analysePlacementStability(makeInput({
        currentPlacementDays: 20,
        totalPlacementsEver: 6,
        placementHistory: [
          makePlacement({ endReason: "breakdown", durationDays: 30 }),
          makePlacement({ endReason: "breakdown", durationDays: 45 }),
          makePlacement({ endReason: "breakdown", durationDays: 60 }),
        ],
      }));
      expect(result.stabilityScore).toBeLessThan(30);
    });
  });

  // ── Belonging scoring ─────────────────────────────────────────────────

  describe("Belonging scoring", () => {
    it("100 for full belonging indicators", () => {
      const result = analysePlacementStability(makeInput());
      expect(result.belongingScore).toBe(100);
    });

    it("0 when no belonging indicators", () => {
      const result = analysePlacementStability(makeInput({
        childFeelsSettled: false,
        childWantsToStay: false,
        childHasRoomPersonalised: false,
        regularRoutineEstablished: false,
        positiveStaffRelationships: false,
        peerRelationshipsGood: false,
      }));
      expect(result.belongingScore).toBe(0);
    });
  });

  // ── Planning scoring ──────────────────────────────────────────────────

  describe("Planning scoring", () => {
    it("100 for all planning in place", () => {
      const result = analysePlacementStability(makeInput({
        stayingPutOptionExplored: true,
      }));
      expect(result.planningScore).toBe(100);
    });

    it("0 when no planning", () => {
      const result = analysePlacementStability(makeInput({
        placementReviewCurrent: false,
        matchingAssessmentDone: false,
        impactRiskAssessmentDone: false,
        contingencyPlanInPlace: false,
        stayingPutOptionExplored: false,
      }));
      expect(result.planningScore).toBe(0);
    });
  });

  // ── Overall rating ────────────────────────────────────────────────────

  describe("Overall rating", () => {
    it("excellent for stable, settled placement", () => {
      const result = analysePlacementStability(makeInput());
      expect(result.overallRating).toBe("excellent");
    });

    it("inadequate for highly unstable placement", () => {
      const result = analysePlacementStability(makeInput({
        currentPlacementDays: 15,
        totalPlacementsEver: 6,
        disruptionIndicators: ["running_away", "self_harm", "police_involvement"],
        indicatorTrend: "worsening",
        incidentsLast30Days: 10,
        incidentsTrend: "increasing",
        childFeelsSettled: false,
        childWantsToStay: false,
        childHasRoomPersonalised: false,
        regularRoutineEstablished: false,
        positiveStaffRelationships: false,
        peerRelationshipsGood: false,
        placementReviewCurrent: false,
        matchingAssessmentDone: false,
        impactRiskAssessmentDone: false,
        contingencyPlanInPlace: false,
        placementHistory: [
          makePlacement({ endReason: "breakdown", durationDays: 30 }),
          makePlacement({ endReason: "breakdown", durationDays: 20 }),
        ],
      }));
      expect(result.overallRating).toBe("inadequate");
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("critical for very high disruption risk", () => {
      const result = analysePlacementStability(makeInput({
        disruptionIndicators: ["running_away", "self_harm", "police_involvement", "refusing_boundaries"],
        indicatorTrend: "worsening",
        incidentsLast30Days: 12,
        incidentsTrend: "increasing",
        childWantsToStay: false,
        missingEpisodesLast30Days: 4,
      }));
      const c = result.concerns.find(c => c.category === "disruption_risk");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("critical for pattern of breakdowns", () => {
      const result = analysePlacementStability(makeInput({
        placementHistory: [
          makePlacement({ endReason: "breakdown" }),
          makePlacement({ endReason: "breakdown" }),
          makePlacement({ endReason: "breakdown" }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "history");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("significant for child not settled after 2 months", () => {
      const result = analysePlacementStability(makeInput({
        childFeelsSettled: false,
        currentPlacementDays: 90,
      }));
      const c = result.concerns.find(c => c.category === "belonging");
      expect(c).toBeDefined();
    });

    it("significant for child not wanting to stay", () => {
      const result = analysePlacementStability(makeInput({
        childWantsToStay: false,
      }));
      const c = result.concerns.find(c => c.category === "voice");
      expect(c).toBeDefined();
    });

    it("significant for increasing incidents", () => {
      const result = analysePlacementStability(makeInput({
        incidentsLast30Days: 8,
        incidentsTrend: "increasing",
      }));
      const c = result.concerns.find(c => c.category === "incidents");
      expect(c).toBeDefined();
    });

    it("moderate for no matching assessment", () => {
      const result = analysePlacementStability(makeInput({
        matchingAssessmentDone: false,
      }));
      const c = result.concerns.find(c => c.category === "matching");
      expect(c).toBeDefined();
    });

    it("significant for many placements", () => {
      const result = analysePlacementStability(makeInput({
        totalPlacementsEver: 5,
      }));
      const c = result.concerns.find(c => c.category === "instability");
      expect(c).toBeDefined();
    });

    it("no concerns for stable placement", () => {
      const result = analysePlacementStability(makeInput());
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies long placement duration", () => {
      const result = analysePlacementStability(makeInput({
        currentPlacementDays: 400,
      }));
      const s = result.strengths.find(s => s.category === "duration");
      expect(s).toBeDefined();
    });

    it("identifies sense of belonging", () => {
      const result = analysePlacementStability(makeInput());
      const s = result.strengths.find(s => s.category === "belonging");
      expect(s).toBeDefined();
    });

    it("identifies good relationships", () => {
      const result = analysePlacementStability(makeInput());
      const s = result.strengths.find(s => s.category === "relationships");
      expect(s).toBeDefined();
    });

    it("identifies no disruption indicators", () => {
      const result = analysePlacementStability(makeInput());
      const s = result.strengths.find(s => s.category === "risk");
      expect(s).toBeDefined();
    });

    it("identifies improving trend", () => {
      const result = analysePlacementStability(makeInput({
        indicatorTrend: "improving",
      }));
      const s = result.strengths.find(s => s.category === "trend");
      expect(s).toBeDefined();
    });
  });

  // ── Regulatory flags ──────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("CHR 2015 Reg 11 met for stable placement", () => {
      const result = analysePlacementStability(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 11");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("CHR 2015 Reg 11 not_met for high risk", () => {
      const result = analysePlacementStability(makeInput({
        disruptionIndicators: ["running_away", "self_harm", "police_involvement"],
        indicatorTrend: "worsening",
        incidentsLast30Days: 10,
        incidentsTrend: "increasing",
        childWantsToStay: false,
        missingEpisodesLast30Days: 3,
        placementReviewCurrent: false,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 11");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("CHR 2015 Reg 12 met with matching assessment", () => {
      const result = analysePlacementStability(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 12");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("CHR 2015 Reg 12 not_met without matching", () => {
      const result = analysePlacementStability(makeInput({
        matchingAssessmentDone: false,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 12");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("SCCIF met when child settled", () => {
      const result = analysePlacementStability(makeInput());
      const flag = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("urgent meeting for high risk", () => {
      const result = analysePlacementStability(makeInput({
        disruptionIndicators: ["running_away", "self_harm", "police_involvement"],
        indicatorTrend: "worsening",
        incidentsLast30Days: 10,
        incidentsTrend: "increasing",
        childWantsToStay: false,
        missingEpisodesLast30Days: 3,
      }));
      expect(result.recommendations.some(r => r.includes("URGENT"))).toBe(true);
    });

    it("recommends matching assessment", () => {
      const result = analysePlacementStability(makeInput({
        matchingAssessmentDone: false,
      }));
      expect(result.recommendations.some(r => r.includes("matching"))).toBe(true);
    });

    it("recommends placement review", () => {
      const result = analysePlacementStability(makeInput({
        placementReviewCurrent: false,
      }));
      expect(result.recommendations.some(r => r.includes("review"))).toBe(true);
    });

    it("recommends staying put for 16+", () => {
      const result = analysePlacementStability(makeInput({
        age: 16,
        stayingPutOptionExplored: false,
      }));
      expect(result.recommendations.some(r => r.includes("staying-put"))).toBe(true);
    });

    it("recommends room personalisation", () => {
      const result = analysePlacementStability(makeInput({
        childHasRoomPersonalised: false,
        currentPlacementDays: 30,
      }));
      expect(result.recommendations.some(r => r.includes("personalise"))).toBe(true);
    });

    it("minimal for stable placement", () => {
      const result = analysePlacementStability(makeInput());
      expect(result.recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  // ── Summary ───────────────────────────────────────────────────────────

  describe("Summary", () => {
    it("includes child name", () => {
      const result = analysePlacementStability(makeInput({ childName: "Jordan" }));
      expect(result.summary).toContain("Jordan");
    });

    it("includes risk level", () => {
      const result = analysePlacementStability(makeInput());
      expect(result.summary).toContain("low");
    });

    it("includes total placements", () => {
      const result = analysePlacementStability(makeInput({ totalPlacementsEver: 2 }));
      expect(result.summary).toContain("2 placement");
    });
  });
});
