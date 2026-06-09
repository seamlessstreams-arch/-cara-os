// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Placement Stability & Continuity Intelligence — Engine Tests
//
// Covers pct, getRating, label getters, all 4 evaluators, buildChildPlacementProfiles,
// orchestrator — empty/perfect/partial/cap scenarios.
// Demo data: Chamberlain House — Alex, Jordan, Morgan
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getReviewTypeLabel,
  getStabilityStatusLabel,
  getRatingLabel,
  evaluatePlacementQuality,
  evaluatePlacementCompliance,
  evaluatePlacementPolicy,
  evaluateStaffPlacementReadiness,
  buildChildPlacementProfiles,
  generatePlacementStabilityContinuityIntelligence,
} from "../placement-stability-continuity-engine";
import type {
  PlacementReview,
  PlacementPolicy,
  StaffPlacementTraining,
} from "../placement-stability-continuity-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const HOME_ID = "oak-house";

// ── Factories ──────────────────────────────────────────────────────────────

let _reviewId = 0;
let _policyId = 0;
let _trainingId = 0;

function makeReview(overrides: Partial<PlacementReview> = {}): PlacementReview {
  return {
    id: `rev-${++_reviewId}`,
    childId: "child-alex",
    childName: "Alex",
    reviewDate: "2025-03-15",
    reviewType: "stability_assessment",
    stabilityStatus: "stable",
    childParticipated: true,
    familyEngaged: true,
    continuityMaintained: true,
    documentedInPlan: true,
    managementOversight: true,
    actionsTaken: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<PlacementPolicy> = {}): PlacementPolicy {
  return {
    id: `pol-${++_policyId}`,
    stabilityStrategy: true,
    matchingProcess: true,
    disruptionProtocol: true,
    transitionFramework: true,
    contactArrangements: true,
    contingencyPlanning: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffPlacementTraining> = {}): StaffPlacementTraining {
  return {
    id: `train-${++_trainingId}`,
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    attachmentTheory: true,
    therapeuticCaregiving: true,
    disruptionPrevention: true,
    transitionSupport: true,
    familyEngagement: true,
    multiAgencyWorking: true,
    ...overrides,
  };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(8, 8)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ── Label Getters ──────────────────────────────────────────────────────────

describe("getReviewTypeLabel", () => {
  it("returns correct labels for all review types", () => {
    expect(getReviewTypeLabel("stability_assessment")).toBe("Stability Assessment");
    expect(getReviewTypeLabel("disruption_meeting")).toBe("Disruption Meeting");
    expect(getReviewTypeLabel("placement_plan_review")).toBe("Placement Plan Review");
    expect(getReviewTypeLabel("matching_review")).toBe("Matching Review");
    expect(getReviewTypeLabel("transition_planning")).toBe("Transition Planning");
    expect(getReviewTypeLabel("contact_review")).toBe("Contact Review");
    expect(getReviewTypeLabel("key_worker_session")).toBe("Key Worker Session");
    expect(getReviewTypeLabel("multi_agency_review")).toBe("Multi-Agency Review");
  });
});

describe("getStabilityStatusLabel", () => {
  it("returns correct labels for all stability statuses", () => {
    expect(getStabilityStatusLabel("stable")).toBe("Stable");
    expect(getStabilityStatusLabel("mostly_stable")).toBe("Mostly Stable");
    expect(getStabilityStatusLabel("some_concerns")).toBe("Some Concerns");
    expect(getStabilityStatusLabel("at_risk")).toBe("At Risk");
    expect(getStabilityStatusLabel("disrupted")).toBe("Disrupted");
  });
});

describe("getRatingLabel", () => {
  it("returns correct labels for all ratings", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── Evaluator 1: evaluatePlacementQuality ──────────────────────────────────

describe("evaluatePlacementQuality", () => {
  it("returns zeroes for empty reviews", () => {
    const result = evaluatePlacementQuality([]);
    expect(result.totalReviews).toBe(0);
    expect(result.stabilityRate).toBe(0);
    expect(result.childParticipatedRate).toBe(0);
    expect(result.familyEngagedRate).toBe(0);
    expect(result.continuityRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("scores 25 for perfect reviews", () => {
    const reviews = Array.from({ length: 5 }, () => makeReview());
    const result = evaluatePlacementQuality(reviews);
    expect(result.stabilityRate).toBe(100);
    expect(result.childParticipatedRate).toBe(100);
    expect(result.familyEngagedRate).toBe(100);
    expect(result.continuityRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("counts mostly_stable as stable for stabilityRate", () => {
    const reviews = [
      makeReview({ stabilityStatus: "stable" }),
      makeReview({ stabilityStatus: "mostly_stable" }),
      makeReview({ stabilityStatus: "at_risk" }),
      makeReview({ stabilityStatus: "disrupted" }),
    ];
    const result = evaluatePlacementQuality(reviews);
    expect(result.stabilityRate).toBe(50);
  });

  it("calculates partial scores correctly", () => {
    const reviews = [
      makeReview({ childParticipated: true, familyEngaged: false, continuityMaintained: false }),
      makeReview({ childParticipated: false, familyEngaged: false, continuityMaintained: false }),
    ];
    const result = evaluatePlacementQuality(reviews);
    expect(result.childParticipatedRate).toBe(50);
    expect(result.familyEngagedRate).toBe(0);
    expect(result.continuityRate).toBe(0);
  });

  it("caps score at 25", () => {
    // All 100% rates — 7+6+6+6=25, should not exceed 25
    const reviews = Array.from({ length: 10 }, () => makeReview());
    const result = evaluatePlacementQuality(reviews);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles all disrupted reviews", () => {
    const reviews = [
      makeReview({ stabilityStatus: "disrupted", childParticipated: false, familyEngaged: false, continuityMaintained: false }),
    ];
    const result = evaluatePlacementQuality(reviews);
    expect(result.stabilityRate).toBe(0);
    expect(result.score).toBe(0);
  });
});

// ── Evaluator 2: evaluatePlacementCompliance ───────────────────────────────

describe("evaluatePlacementCompliance", () => {
  it("returns zeroes for empty reviews", () => {
    const result = evaluatePlacementCompliance([]);
    expect(result.totalReviews).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.managementOversightRate).toBe(0);
    expect(result.actionsTakenRate).toBe(0);
    expect(result.reviewTypeDiversityRatio).toBe(0);
    expect(result.score).toBe(0);
  });

  it("scores 25 for perfect compliance with all 8 review types", () => {
    const types = [
      "stability_assessment", "disruption_meeting", "placement_plan_review",
      "matching_review", "transition_planning", "contact_review",
      "key_worker_session", "multi_agency_review",
    ] as const;
    const reviews = types.map((t) => makeReview({ reviewType: t }));
    const result = evaluatePlacementCompliance(reviews);
    expect(result.documentedRate).toBe(100);
    expect(result.managementOversightRate).toBe(100);
    expect(result.actionsTakenRate).toBe(100);
    expect(result.reviewTypeDiversityRatio).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates diversity ratio as uniqueTypes / 8", () => {
    const reviews = [
      makeReview({ reviewType: "stability_assessment" }),
      makeReview({ reviewType: "stability_assessment" }),
      makeReview({ reviewType: "disruption_meeting" }),
      makeReview({ reviewType: "matching_review" }),
      makeReview({ reviewType: "contact_review" }),
    ];
    const result = evaluatePlacementCompliance(reviews);
    // 4 unique / 8 = 50%
    expect(result.reviewTypeDiversityRatio).toBe(50);
  });

  it("calculates partial compliance rates", () => {
    const reviews = [
      makeReview({ documentedInPlan: true, managementOversight: true, actionsTaken: false }),
      makeReview({ documentedInPlan: false, managementOversight: false, actionsTaken: false }),
    ];
    const result = evaluatePlacementCompliance(reviews);
    expect(result.documentedRate).toBe(50);
    expect(result.managementOversightRate).toBe(50);
    expect(result.actionsTakenRate).toBe(0);
  });

  it("caps score at 25", () => {
    const types = [
      "stability_assessment", "disruption_meeting", "placement_plan_review",
      "matching_review", "transition_planning", "contact_review",
      "key_worker_session", "multi_agency_review",
    ] as const;
    const reviews = types.map((t) => makeReview({ reviewType: t }));
    const result = evaluatePlacementCompliance(reviews);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("returns low score for all-false compliance booleans", () => {
    const reviews = [
      makeReview({ documentedInPlan: false, managementOversight: false, actionsTaken: false }),
    ];
    const result = evaluatePlacementCompliance(reviews);
    expect(result.documentedRate).toBe(0);
    expect(result.managementOversightRate).toBe(0);
    expect(result.actionsTakenRate).toBe(0);
  });
});

// ── Evaluator 3: evaluatePlacementPolicy ───────────────────────────────────

describe("evaluatePlacementPolicy", () => {
  it("returns all false and score 0 for null policy", () => {
    const result = evaluatePlacementPolicy(null);
    expect(result.stabilityStrategy).toBe(false);
    expect(result.matchingProcess).toBe(false);
    expect(result.disruptionProtocol).toBe(false);
    expect(result.transitionFramework).toBe(false);
    expect(result.contactArrangements).toBe(false);
    expect(result.contingencyPlanning).toBe(false);
    expect(result.regularReview).toBe(false);
    expect(result.score).toBe(0);
  });

  it("scores 25 for all-true policy", () => {
    const result = evaluatePlacementPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("weights first 4 booleans at 4 points each", () => {
    const result = evaluatePlacementPolicy(makePolicy({
      stabilityStrategy: true,
      matchingProcess: false,
      disruptionProtocol: false,
      transitionFramework: false,
      contactArrangements: false,
      contingencyPlanning: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);

    const result2 = evaluatePlacementPolicy(makePolicy({
      stabilityStrategy: true,
      matchingProcess: true,
      disruptionProtocol: false,
      transitionFramework: false,
      contactArrangements: false,
      contingencyPlanning: false,
      regularReview: false,
    }));
    expect(result2.score).toBe(8);

    const result3 = evaluatePlacementPolicy(makePolicy({
      stabilityStrategy: true,
      matchingProcess: true,
      disruptionProtocol: true,
      transitionFramework: true,
      contactArrangements: false,
      contingencyPlanning: false,
      regularReview: false,
    }));
    expect(result3.score).toBe(16);
  });

  it("weights last 3 booleans at 3 points each", () => {
    const result = evaluatePlacementPolicy(makePolicy({
      stabilityStrategy: false,
      matchingProcess: false,
      disruptionProtocol: false,
      transitionFramework: false,
      contactArrangements: true,
      contingencyPlanning: true,
      regularReview: true,
    }));
    expect(result.score).toBe(9);
  });

  it("returns boolean values matching policy input", () => {
    const result = evaluatePlacementPolicy(makePolicy({
      stabilityStrategy: true,
      matchingProcess: false,
      disruptionProtocol: true,
      transitionFramework: false,
      contactArrangements: true,
      contingencyPlanning: false,
      regularReview: true,
    }));
    expect(result.stabilityStrategy).toBe(true);
    expect(result.matchingProcess).toBe(false);
    expect(result.disruptionProtocol).toBe(true);
    expect(result.transitionFramework).toBe(false);
    expect(result.contactArrangements).toBe(true);
    expect(result.contingencyPlanning).toBe(false);
    expect(result.regularReview).toBe(true);
    expect(result.score).toBe(4 + 4 + 3 + 3); // 14
  });

  it("scores 0 for all-false policy", () => {
    const result = evaluatePlacementPolicy(makePolicy({
      stabilityStrategy: false,
      matchingProcess: false,
      disruptionProtocol: false,
      transitionFramework: false,
      contactArrangements: false,
      contingencyPlanning: false,
      regularReview: false,
    }));
    expect(result.score).toBe(0);
  });
});

// ── Evaluator 4: evaluateStaffPlacementReadiness ───────────────────────────

describe("evaluateStaffPlacementReadiness", () => {
  it("returns zeroes for empty staff", () => {
    const result = evaluateStaffPlacementReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.attachmentTheoryRate).toBe(0);
    expect(result.therapeuticCaregivingRate).toBe(0);
    expect(result.disruptionPreventionRate).toBe(0);
    expect(result.transitionSupportRate).toBe(0);
    expect(result.familyEngagementRate).toBe(0);
    expect(result.multiAgencyWorkingRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("scores 25 for all staff fully trained", () => {
    const staff = [makeTraining(), makeTraining({ staffId: "staff-tom", staffName: "Tom Richards" })];
    const result = evaluateStaffPlacementReadiness(staff);
    expect(result.attachmentTheoryRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("weights attachmentTheory at 6 points", () => {
    const staff = [makeTraining({
      attachmentTheory: true,
      therapeuticCaregiving: false,
      disruptionPrevention: false,
      transitionSupport: false,
      familyEngagement: false,
      multiAgencyWorking: false,
    })];
    const result = evaluateStaffPlacementReadiness(staff);
    expect(result.score).toBe(6);
  });

  it("weights therapeuticCaregiving at 5 points", () => {
    const staff = [makeTraining({
      attachmentTheory: false,
      therapeuticCaregiving: true,
      disruptionPrevention: false,
      transitionSupport: false,
      familyEngagement: false,
      multiAgencyWorking: false,
    })];
    const result = evaluateStaffPlacementReadiness(staff);
    expect(result.score).toBe(5);
  });

  it("weights disruptionPrevention at 5 points", () => {
    const staff = [makeTraining({
      attachmentTheory: false,
      therapeuticCaregiving: false,
      disruptionPrevention: true,
      transitionSupport: false,
      familyEngagement: false,
      multiAgencyWorking: false,
    })];
    const result = evaluateStaffPlacementReadiness(staff);
    expect(result.score).toBe(5);
  });

  it("weights transitionSupport at 4 points", () => {
    const staff = [makeTraining({
      attachmentTheory: false,
      therapeuticCaregiving: false,
      disruptionPrevention: false,
      transitionSupport: true,
      familyEngagement: false,
      multiAgencyWorking: false,
    })];
    const result = evaluateStaffPlacementReadiness(staff);
    expect(result.score).toBe(4);
  });

  it("weights familyEngagement at 3 points", () => {
    const staff = [makeTraining({
      attachmentTheory: false,
      therapeuticCaregiving: false,
      disruptionPrevention: false,
      transitionSupport: false,
      familyEngagement: true,
      multiAgencyWorking: false,
    })];
    const result = evaluateStaffPlacementReadiness(staff);
    expect(result.score).toBe(3);
  });

  it("weights multiAgencyWorking at 2 points", () => {
    const staff = [makeTraining({
      attachmentTheory: false,
      therapeuticCaregiving: false,
      disruptionPrevention: false,
      transitionSupport: false,
      familyEngagement: false,
      multiAgencyWorking: true,
    })];
    const result = evaluateStaffPlacementReadiness(staff);
    expect(result.score).toBe(2);
  });

  it("calculates partial rates from mixed staff", () => {
    const staff = [
      makeTraining({ attachmentTheory: true, therapeuticCaregiving: true, disruptionPrevention: false, transitionSupport: false, familyEngagement: false, multiAgencyWorking: false }),
      makeTraining({ staffId: "staff-tom", staffName: "Tom Richards", attachmentTheory: false, therapeuticCaregiving: false, disruptionPrevention: true, transitionSupport: true, familyEngagement: false, multiAgencyWorking: false }),
    ];
    const result = evaluateStaffPlacementReadiness(staff);
    expect(result.attachmentTheoryRate).toBe(50);
    expect(result.therapeuticCaregivingRate).toBe(50);
    expect(result.disruptionPreventionRate).toBe(50);
    expect(result.transitionSupportRate).toBe(50);
    expect(result.familyEngagementRate).toBe(0);
    expect(result.multiAgencyWorkingRate).toBe(0);
  });

  it("caps score at 25", () => {
    const staff = [makeTraining(), makeTraining({ staffId: "staff-tom" }), makeTraining({ staffId: "staff-lisa" })];
    const result = evaluateStaffPlacementReadiness(staff);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ── buildChildPlacementProfiles ────────────────────────────────────────────

describe("buildChildPlacementProfiles", () => {
  it("returns empty array for no reviews", () => {
    expect(buildChildPlacementProfiles([])).toEqual([]);
  });

  it("groups reviews by childId", () => {
    const reviews = [
      makeReview({ childId: "child-alex", childName: "Alex" }),
      makeReview({ childId: "child-alex", childName: "Alex" }),
      makeReview({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildPlacementProfiles(reviews);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "child-alex")?.totalReviews).toBe(2);
    expect(profiles.find((p) => p.childId === "child-jordan")?.totalReviews).toBe(1);
  });

  it("calculates stabilityRate per child", () => {
    const reviews = [
      makeReview({ childId: "child-alex", stabilityStatus: "stable" }),
      makeReview({ childId: "child-alex", stabilityStatus: "disrupted" }),
    ];
    const profiles = buildChildPlacementProfiles(reviews);
    expect(profiles[0].stabilityRate).toBe(50);
  });

  it("calculates childParticipatedRate per child", () => {
    const reviews = [
      makeReview({ childId: "child-alex", childParticipated: true }),
      makeReview({ childId: "child-alex", childParticipated: false }),
      makeReview({ childId: "child-alex", childParticipated: false }),
    ];
    const profiles = buildChildPlacementProfiles(reviews);
    expect(profiles[0].childParticipatedRate).toBe(33);
  });

  it("gives frequencyScore 2 for >=10 reviews", () => {
    const reviews = Array.from({ length: 10 }, () => makeReview({ childId: "child-alex" }));
    const profiles = buildChildPlacementProfiles(reviews);
    // frequencyScore=2, stabilityScore=3 (100%), participationScore=3 (100%), diversityBonus=0 (1 type)
    // total = 2+3+3+0 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("gives frequencyScore 1 for >=5 reviews", () => {
    const reviews = Array.from({ length: 5 }, () => makeReview({ childId: "child-alex" }));
    const profiles = buildChildPlacementProfiles(reviews);
    // 1+3+3+0 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("gives frequencyScore 0 for <5 reviews", () => {
    const reviews = Array.from({ length: 4 }, () => makeReview({ childId: "child-alex" }));
    const profiles = buildChildPlacementProfiles(reviews);
    // 0+3+3+0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("gives stabilityScore 3 for rate >=80", () => {
    const reviews = [
      makeReview({ childId: "child-alex", stabilityStatus: "stable" }),
      makeReview({ childId: "child-alex", stabilityStatus: "stable" }),
      makeReview({ childId: "child-alex", stabilityStatus: "stable" }),
      makeReview({ childId: "child-alex", stabilityStatus: "stable" }),
      makeReview({ childId: "child-alex", stabilityStatus: "disrupted" }),
    ];
    const profiles = buildChildPlacementProfiles(reviews);
    // rate = 80%, stabilityScore = 3
    expect(profiles[0].stabilityRate).toBe(80);
  });

  it("gives stabilityScore 2 for rate >=60 and <80", () => {
    const reviews = [
      makeReview({ childId: "child-alex", stabilityStatus: "stable" }),
      makeReview({ childId: "child-alex", stabilityStatus: "stable" }),
      makeReview({ childId: "child-alex", stabilityStatus: "disrupted" }),
    ];
    const profiles = buildChildPlacementProfiles(reviews);
    // rate = 67%, stabilityScore = 2; freq=0, part=3, div=0 => 0+2+3+0 = 5
    expect(profiles[0].overallScore).toBe(5);
  });

  it("gives diversityBonus 2 for >=4 review types", () => {
    const reviews = [
      makeReview({ childId: "child-alex", reviewType: "stability_assessment" }),
      makeReview({ childId: "child-alex", reviewType: "disruption_meeting" }),
      makeReview({ childId: "child-alex", reviewType: "matching_review" }),
      makeReview({ childId: "child-alex", reviewType: "contact_review" }),
    ];
    const profiles = buildChildPlacementProfiles(reviews);
    // freq=0, stab=3 (100%), part=3 (100%), div=2 => 8
    expect(profiles[0].overallScore).toBe(8);
    expect(profiles[0].reviewTypes).toHaveLength(4);
  });

  it("gives diversityBonus 1 for >=2 and <4 review types", () => {
    const reviews = [
      makeReview({ childId: "child-alex", reviewType: "stability_assessment" }),
      makeReview({ childId: "child-alex", reviewType: "disruption_meeting" }),
    ];
    const profiles = buildChildPlacementProfiles(reviews);
    // freq=0, stab=3 (100%), part=3 (100%), div=1 => 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("gives diversityBonus 0 for 1 review type", () => {
    const reviews = [
      makeReview({ childId: "child-alex", reviewType: "stability_assessment" }),
      makeReview({ childId: "child-alex", reviewType: "stability_assessment" }),
    ];
    const profiles = buildChildPlacementProfiles(reviews);
    // freq=0, stab=3 (100%), part=3 (100%), div=0 => 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("caps overallScore at 10", () => {
    const reviews = Array.from({ length: 12 }, (_, i) =>
      makeReview({
        childId: "child-alex",
        reviewType: (["stability_assessment", "disruption_meeting", "placement_plan_review", "matching_review", "transition_planning", "contact_review", "key_worker_session", "multi_agency_review"] as const)[i % 8],
      }),
    );
    const profiles = buildChildPlacementProfiles(reviews);
    // freq=2 (12), stab=3 (100%), part=3 (100%), div=2 (8 types) => 10 (capped)
    expect(profiles[0].overallScore).toBe(10);
  });

  it("tracks review types per child correctly", () => {
    const reviews = [
      makeReview({ childId: "child-alex", reviewType: "stability_assessment" }),
      makeReview({ childId: "child-alex", reviewType: "stability_assessment" }),
      makeReview({ childId: "child-alex", reviewType: "key_worker_session" }),
    ];
    const profiles = buildChildPlacementProfiles(reviews);
    expect(profiles[0].reviewTypes).toContain("stability_assessment");
    expect(profiles[0].reviewTypes).toContain("key_worker_session");
    expect(profiles[0].reviewTypes).toHaveLength(2);
  });
});

// ── Orchestrator ───────────────────────────────────────────────────────────

describe("generatePlacementStabilityContinuityIntelligence", () => {
  it("returns inadequate with score 0 for empty data", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns outstanding for perfect data", () => {
    const types = [
      "stability_assessment", "disruption_meeting", "placement_plan_review",
      "matching_review", "transition_planning", "contact_review",
      "key_worker_session", "multi_agency_review",
    ] as const;
    const reviews = types.map((t) => makeReview({ reviewType: t }));
    const policy = makePolicy();
    const staff = [
      makeTraining(),
      makeTraining({ staffId: "staff-tom", staffName: "Tom Richards" }),
    ];
    const result = generatePlacementStabilityContinuityIntelligence(
      reviews, policy, staff, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("caps overall score at 100", () => {
    const types = [
      "stability_assessment", "disruption_meeting", "placement_plan_review",
      "matching_review", "transition_planning", "contact_review",
      "key_worker_session", "multi_agency_review",
    ] as const;
    const reviews = types.map((t) => makeReview({ reviewType: t }));
    const policy = makePolicy();
    const staff = [makeTraining(), makeTraining({ staffId: "staff-tom" })];
    const result = generatePlacementStabilityContinuityIntelligence(
      reviews, policy, staff, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes homeId and period in result", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [makeReview()], makePolicy(), [makeTraining()],
      "test-home", "2025-01-01", "2025-12-31",
    );
    expect(result.homeId).toBe("test-home");
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-12-31");
  });

  it("generates strengths for high-scoring areas", () => {
    const types = [
      "stability_assessment", "disruption_meeting", "placement_plan_review",
      "matching_review", "transition_planning", "contact_review",
      "key_worker_session", "multi_agency_review",
    ] as const;
    const reviews = types.map((t) => makeReview({ reviewType: t }));
    const policy = makePolicy();
    const staff = [makeTraining(), makeTraining({ staffId: "staff-tom" })];
    const result = generatePlacementStabilityContinuityIntelligence(
      reviews, policy, staff, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.toLowerCase().includes("stability"))).toBe(true);
  });

  it("generates URGENT actions for missing policy", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [makeReview()], null, [makeTraining()], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT:"))).toBe(true);
    expect(result.actions.some((a) => a.includes("policy"))).toBe(true);
  });

  it("generates URGENT actions for missing training", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [makeReview()], makePolicy(), [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT:"))).toBe(true);
    expect(result.actions.some((a) => a.toLowerCase().includes("training"))).toBe(true);
  });

  it("includes exactly 7 regulatory links", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Regulation 5 in regulatory links", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 5"))).toBe(true);
  });

  it("includes CHR 2015 Regulation 7 in regulatory links", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 7"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes NMS 3 in regulatory links", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("includes Care Planning Regulations 2010 in regulatory links", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Care Planning Regulations 2010"))).toBe(true);
  });

  it("includes NICE Guideline CG76 in regulatory links", () => {
    const result = generatePlacementStabilityContinuityIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NICE Guideline CG76"))).toBe(true);
  });

  it("generates areas for improvement for low-scoring data", () => {
    const reviews = [
      makeReview({
        stabilityStatus: "disrupted",
        childParticipated: false,
        familyEngaged: false,
        continuityMaintained: false,
        documentedInPlan: false,
        managementOversight: false,
        actionsTaken: false,
      }),
    ];
    const result = generatePlacementStabilityContinuityIntelligence(
      reviews, makePolicy({
        stabilityStrategy: false, matchingProcess: false, disruptionProtocol: false,
        transitionFramework: false, contactArrangements: false, contingencyPlanning: false,
        regularReview: false,
      }), [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("includes child profiles in result", () => {
    const reviews = [
      makeReview({ childId: "child-alex", childName: "Alex" }),
      makeReview({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generatePlacementStabilityContinuityIntelligence(
      reviews, makePolicy(), [makeTraining()], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles).toHaveLength(2);
    expect(result.childProfiles.find((p) => p.childId === "child-alex")).toBeDefined();
    expect(result.childProfiles.find((p) => p.childId === "child-jordan")).toBeDefined();
  });

  it("sums the four evaluator scores for overallScore", () => {
    const reviews = [makeReview()];
    const policy = makePolicy({
      stabilityStrategy: true, matchingProcess: true, disruptionProtocol: false,
      transitionFramework: false, contactArrangements: false, contingencyPlanning: false,
      regularReview: false,
    });
    const staff = [makeTraining({
      attachmentTheory: true, therapeuticCaregiving: false, disruptionPrevention: false,
      transitionSupport: false, familyEngagement: false, multiAgencyWorking: false,
    })];
    const result = generatePlacementStabilityContinuityIntelligence(
      reviews, policy, staff, HOME_ID, PERIOD_START, PERIOD_END,
    );
    const expectedSum = result.placementQuality.score + result.placementCompliance.score +
      result.placementPolicy.score + result.staffReadiness.score;
    expect(result.overallScore).toBe(Math.min(100, expectedSum));
  });

  it("generates URGENT actions for partially missing policy booleans", () => {
    const policy = makePolicy({
      stabilityStrategy: false,
      disruptionProtocol: false,
    });
    const result = generatePlacementStabilityContinuityIntelligence(
      [makeReview()], policy, [makeTraining()], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("stability strategy"))).toBe(true);
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("disruption"))).toBe(true);
  });
});
