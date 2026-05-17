// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Placement Stability — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluatePlacementStability,
  calculateHomeStabilityMetrics,
  getMatchingRecommendations,
  getPlacementStatusLabel,
  getEndReasonLabel,
  getMatchingDomainLabel,
} from "../stability-engine";
import type {
  Placement,
  MatchingAssessmentItem,
  StabilityMilestone,
  DisruptionEvent,
  RiskIndicator,
  MatchingDomain,
  PlacementStatus,
  EndReason,
} from "../stability-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeMatching(domain: MatchingDomain, score: number = 8, notes: string = "Good match"): MatchingAssessmentItem {
  return { domain, score, notes };
}

function makeMilestone(overrides: Partial<StabilityMilestone> = {}): StabilityMilestone {
  return {
    name: "Settled in school",
    targetDate: "2026-03-01T00:00:00Z",
    achievedDate: "2026-02-20T00:00:00Z",
    status: "achieved",
    ...overrides,
  };
}

function makePlacement(overrides: Partial<Placement> = {}): Placement {
  return {
    id: "pl-001",
    childId: "child-jordan",
    childName: "Jordan Williams",
    homeId: "home-oak",
    homeName: "Oak House",
    status: "established",

    referralDate: "2024-08-15T00:00:00Z",
    admissionDate: "2024-09-01T00:00:00Z",

    matchingScore: 78,
    matchingAssessment: [
      makeMatching("age_appropriateness", 8, "Within age range of current group"),
      makeMatching("peer_dynamics", 7, "Generally positive dynamics. Minor tension with one peer."),
      makeMatching("risk_compatibility", 7, "Compatible risk profile"),
      makeMatching("therapeutic_needs", 8, "CAMHS accessible locally"),
      makeMatching("education_provision", 9, "School placement secured pre-admission"),
      makeMatching("location_suitability", 7, "40 min from family — manageable for contact"),
      makeMatching("cultural_identity", 8, "Staff culturally aware. Community links available."),
      makeMatching("contact_arrangements", 7, "Weekly contact agreed"),
      makeMatching("staff_capability", 8, "Experienced team. Keyworker matched well."),
      makeMatching("physical_environment", 8, "Suitable room. Sensory space available."),
    ],

    currentRiskIndicators: [],
    stabilityMilestones: [
      makeMilestone({ name: "Settled in school", status: "achieved" }),
      makeMilestone({ name: "Established keyworker relationship", status: "achieved" }),
      makeMilestone({ name: "Regular family contact", status: "achieved" }),
      makeMilestone({ name: "Engaged in community activity", status: "pending", targetDate: "2026-06-01T00:00:00Z", achievedDate: undefined }),
    ],
    disruptionHistory: [],

    keyworkerId: "staff-001",
    keyworkerName: "Sarah Mitchell",
    socialWorkerId: "sw-001",
    previousPlacements: 2,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePlacementStability
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePlacementStability", () => {
  it("returns excellent stability for well-established placement", () => {
    const placement = makePlacement();
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.stabilityScore).toBeGreaterThanOrEqual(85);
    expect(result.stabilityRating).toBe("excellent");
    expect(result.disruptionRisk).toBe("low");
    expect(result.daysInPlacement).toBeGreaterThan(600);
  });

  it("reduces score for risk indicators", () => {
    const placement = makePlacement({
      currentRiskIndicators: ["frequent_missing", "escalating_incidents", "peer_conflict"],
    });
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.stabilityScore).toBeLessThan(75);
    expect(result.riskIndicatorCount).toBe(3);
    expect(result.activeRisks).toHaveLength(3);
  });

  it("reduces score for recent disruption events", () => {
    const placement = makePlacement({
      disruptionHistory: [
        { date: "2026-05-01T00:00:00Z", description: "Peer conflict escalation", severity: "medium", resolved: true, actionTaken: "Mediation" },
        { date: "2026-04-15T00:00:00Z", description: "Refused to return from missing", severity: "high", resolved: true, actionTaken: "Stability meeting" },
      ],
    });
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.stabilityScore).toBeLessThan(85);
  });

  it("reduces score for low matching domains", () => {
    const placement = makePlacement({
      matchingAssessment: [
        makeMatching("peer_dynamics", 3, "Significant conflict with existing residents"),
        makeMatching("therapeutic_needs", 4, "CAMHS waiting list — 6 months"),
        makeMatching("risk_compatibility", 5, "Higher risk than peers"),
        ...["age_appropriateness", "education_provision", "location_suitability", "cultural_identity", "contact_arrangements", "staff_capability", "physical_environment"].map(d =>
          makeMatching(d as MatchingDomain, 8),
        ),
      ],
    });
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.matchingAdequacy).toBe("adequate"); // avg still above 6
  });

  it("detects weak matching when average < 6", () => {
    const placement = makePlacement({
      matchingAssessment: [
        makeMatching("peer_dynamics", 3),
        makeMatching("therapeutic_needs", 4),
        makeMatching("risk_compatibility", 4),
        makeMatching("age_appropriateness", 5),
        makeMatching("education_provision", 5),
        makeMatching("location_suitability", 4),
        makeMatching("cultural_identity", 5),
        makeMatching("contact_arrangements", 4),
        makeMatching("staff_capability", 5),
        makeMatching("physical_environment", 5),
      ],
    });
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.matchingAdequacy).toBe("weak");
  });

  it("assigns high disruption risk with 3+ indicators", () => {
    const placement = makePlacement({
      currentRiskIndicators: ["frequent_missing", "escalating_incidents", "placement_refusal"],
    });
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.disruptionRisk).toBe("high");
  });

  it("assigns very_high disruption risk with 5+ indicators", () => {
    const placement = makePlacement({
      currentRiskIndicators: [
        "frequent_missing", "escalating_incidents", "peer_conflict",
        "placement_refusal", "exploitation_risk",
      ],
    });
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.disruptionRisk).toBe("very_high");
  });

  it("counts milestone statuses correctly", () => {
    const placement = makePlacement({
      stabilityMilestones: [
        makeMilestone({ status: "achieved" }),
        makeMilestone({ name: "M2", status: "achieved" }),
        makeMilestone({ name: "M3", status: "pending", achievedDate: undefined }),
        makeMilestone({ name: "M4", status: "overdue", achievedDate: undefined }),
      ],
    });
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.milestonesAchieved).toBe(2);
    expect(result.milestonesPending).toBe(1);
    expect(result.milestonesOverdue).toBe(1);
  });

  it("penalizes placements with many previous breakdowns", () => {
    // Add a risk indicator to bring below 100 so the penalty is visible
    const base = makePlacement({ previousPlacements: 5, currentRiskIndicators: ["peer_conflict"], admissionDate: "2026-05-01T00:00:00Z" });
    const comparison = makePlacement({ previousPlacements: 1, currentRiskIndicators: ["peer_conflict"], admissionDate: "2026-05-01T00:00:00Z" });
    const result1 = evaluatePlacementStability(base, FIXED_NOW);
    const result2 = evaluatePlacementStability(comparison, FIXED_NOW);
    expect(result1.stabilityScore).toBeLessThan(result2.stabilityScore);
  });

  it("gives tenure bonus for long placements", () => {
    // Add a risk indicator to bring below 100 so the bonus is visible
    const longPlacement = makePlacement({ admissionDate: "2023-01-01T00:00:00Z", currentRiskIndicators: ["peer_conflict"] });
    const shortPlacement = makePlacement({ admissionDate: "2026-05-01T00:00:00Z", currentRiskIndicators: ["peer_conflict"] });
    const result1 = evaluatePlacementStability(longPlacement, FIXED_NOW);
    const result2 = evaluatePlacementStability(shortPlacement, FIXED_NOW);
    expect(result1.stabilityScore).toBeGreaterThan(result2.stabilityScore);
  });

  it("generates settling-in recommendation for new placement", () => {
    const placement = makePlacement({ admissionDate: "2026-05-01T00:00:00Z" });
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("settling-in"))).toBe(true);
  });

  it("generates recommendation for placement refusal", () => {
    const placement = makePlacement({
      currentRiskIndicators: ["placement_refusal"],
    });
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("wish to leave"))).toBe(true);
  });

  it("generates recommendation for exploitation risk", () => {
    const placement = makePlacement({
      currentRiskIndicators: ["exploitation_risk"],
    });
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("Exploitation"))).toBe(true);
  });

  it("generates recommendation for stable long placement", () => {
    const placement = makePlacement({ admissionDate: "2025-06-01T00:00:00Z" }); // >180 days
    const result = evaluatePlacementStability(placement, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("transition planning"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateHomeStabilityMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeStabilityMetrics", () => {
  it("counts total and active placements", () => {
    const placements = [
      makePlacement({ id: "pl-1", status: "established" }),
      makePlacement({ id: "pl-2", status: "settling_in" }),
      makePlacement({ id: "pl-3", status: "ended", endReason: "planned_move_on" }),
    ];
    const result = calculateHomeStabilityMetrics(placements, "home-oak", "Oak House", 4, FIXED_NOW);
    expect(result.totalPlacements).toBe(3);
    expect(result.activePlacements).toBe(2);
  });

  it("calculates average days in placement", () => {
    const placements = [
      makePlacement({ id: "pl-1", admissionDate: "2026-05-01T00:00:00Z" }), // 15 days
      makePlacement({ id: "pl-2", admissionDate: "2026-04-16T00:00:00Z" }), // 30 days
    ];
    const result = calculateHomeStabilityMetrics(placements, "home-oak", "Oak House", 4, FIXED_NOW);
    expect(result.averageDaysInPlacement).toBe(23); // avg of 15 and 30
  });

  it("calculates disruption rate from ended placements", () => {
    const placements = [
      makePlacement({ id: "pl-1", status: "ended", endReason: "disruption" }),
      makePlacement({ id: "pl-2", status: "ended", endReason: "planned_move_on" }),
      makePlacement({ id: "pl-3", status: "ended", endReason: "disruption" }),
      makePlacement({ id: "pl-4", status: "ended", endReason: "reunification" }),
    ];
    const result = calculateHomeStabilityMetrics(placements, "home-oak", "Oak House", 4, FIXED_NOW);
    expect(result.disruptionRate).toBe(50); // 2/4
  });

  it("calculates occupancy rate", () => {
    const placements = [
      makePlacement({ id: "pl-1", status: "established" }),
      makePlacement({ id: "pl-2", status: "settling_in" }),
      makePlacement({ id: "pl-3", status: "at_risk" }),
    ];
    const result = calculateHomeStabilityMetrics(placements, "home-oak", "Oak House", 4, FIXED_NOW);
    expect(result.occupancyRate).toBe(75); // 3/4
  });

  it("counts placements at risk", () => {
    const placements = [
      makePlacement({ id: "pl-1", currentRiskIndicators: ["frequent_missing", "escalating_incidents", "peer_conflict"] }),
      makePlacement({ id: "pl-2" }),
    ];
    const result = calculateHomeStabilityMetrics(placements, "home-oak", "Oak House", 4, FIXED_NOW);
    expect(result.placementsAtRisk).toBe(1);
  });

  it("aggregates risk indicators across placements", () => {
    const placements = [
      makePlacement({ id: "pl-1", currentRiskIndicators: ["peer_conflict", "frequent_missing"] }),
      makePlacement({ id: "pl-2", currentRiskIndicators: ["peer_conflict"] }),
    ];
    const result = calculateHomeStabilityMetrics(placements, "home-oak", "Oak House", 4, FIXED_NOW);
    expect(result.riskSummary[0].indicator).toBe("peer_conflict");
    expect(result.riskSummary[0].count).toBe(2);
  });

  it("filters to correct home", () => {
    const placements = [
      makePlacement({ id: "pl-1", homeId: "home-oak" }),
      makePlacement({ id: "pl-2", homeId: "home-elm" }),
    ];
    const result = calculateHomeStabilityMetrics(placements, "home-oak", "Oak House", 4, FIXED_NOW);
    expect(result.totalPlacements).toBe(1);
  });

  it("returns defaults for no placements", () => {
    const result = calculateHomeStabilityMetrics([], "home-oak", "Oak House", 4, FIXED_NOW);
    expect(result.totalPlacements).toBe(0);
    expect(result.averageStabilityScore).toBe(100);
    expect(result.disruptionRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getMatchingRecommendations
// ══════════════════════════════════════════════════════════════════════════════

describe("getMatchingRecommendations", () => {
  it("returns recommendations for low-scoring domains", () => {
    const placement = makePlacement({
      matchingAssessment: [
        makeMatching("peer_dynamics", 4, "Conflict with one peer"),
        makeMatching("therapeutic_needs", 5, "Waiting list for therapy"),
        makeMatching("age_appropriateness", 9, "Good fit"),
      ],
    });
    const recs = getMatchingRecommendations(placement);
    expect(recs).toHaveLength(2);
    expect(recs[0].domain).toBe("peer_dynamics");
    expect(recs[0].currentScore).toBe(4);
    expect(recs[0].domainLabel).toBe("Peer Group Dynamics");
  });

  it("uses mitigation plan when provided", () => {
    const placement = makePlacement({
      matchingAssessment: [
        { domain: "peer_dynamics", score: 4, notes: "Conflict", mitigationPlan: "Structured activities programme" },
      ],
    });
    const recs = getMatchingRecommendations(placement);
    expect(recs[0].recommendation).toBe("Structured activities programme");
  });

  it("generates default mitigation when none provided", () => {
    const placement = makePlacement({
      matchingAssessment: [
        makeMatching("cultural_identity", 4, "Limited community links"),
      ],
    });
    const recs = getMatchingRecommendations(placement);
    expect(recs[0].recommendation).toContain("culturally appropriate");
  });

  it("returns empty for well-matched placement", () => {
    const placement = makePlacement(); // all scores >= 7
    const recs = getMatchingRecommendations(placement);
    expect(recs).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getPlacementStatusLabel returns labels", () => {
    expect(getPlacementStatusLabel("established")).toBe("Established");
    expect(getPlacementStatusLabel("at_risk")).toBe("At Risk of Disruption");
    expect(getPlacementStatusLabel("settling_in")).toBe("Settling In");
  });

  it("getEndReasonLabel returns labels", () => {
    expect(getEndReasonLabel("planned_move_on")).toBe("Planned Move-On");
    expect(getEndReasonLabel("disruption")).toBe("Unplanned Disruption");
    expect(getEndReasonLabel("reunification")).toBe("Family Reunification");
  });

  it("getMatchingDomainLabel returns labels", () => {
    expect(getMatchingDomainLabel("peer_dynamics")).toBe("Peer Group Dynamics");
    expect(getMatchingDomainLabel("therapeutic_needs")).toBe("Therapeutic Needs Provision");
  });
});
