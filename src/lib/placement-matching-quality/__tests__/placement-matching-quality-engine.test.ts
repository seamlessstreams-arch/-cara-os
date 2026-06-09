// ==============================================================================
// TESTS — Placement Matching Quality Intelligence Engine
//
// Demo data: Chamberlain House with children Alex (excellent match), Jordan (good match,
// settling), Morgan (good match, stable). 3 compatibility reviews,
// 3 stability assessments, no disruptions.
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateMatchingProcess,
  evaluateCompatibility,
  evaluateStabilityOutcomes,
  evaluateDisruptionLearning,
  buildChildProfiles,
  generatePlacementMatchingQualityIntelligence,
  getMatchingOutcomeLabel,
  getStabilityIndicatorLabel,
  getImpactAssessmentStatusLabel,
  getConsultationStatusLabel,
  getMatchingCriteriaLabel,
  getRatingLabel,
} from "../placement-matching-quality-engine";
import type {
  PlacementMatch,
  CompatibilityReview,
  PlacementStability,
  DisruptionRecord,
} from "../placement-matching-quality-engine";

// -- Helper Factories ---------------------------------------------------------

function makePlacement(overrides: Partial<PlacementMatch> = {}): PlacementMatch {
  return {
    id: "pm-001",
    childId: "child-001",
    childName: "Alex",
    admissionDate: "2026-01-15",
    matchingOutcome: "excellent_match",
    impactAssessmentStatus: "completed_pre_admission",
    existingChildrenConsulted: "all_consulted",
    staffConsulted: true,
    referralInformationComplete: true,
    trialOvernight: true,
    criteriaAssessed: [
      "age_appropriateness",
      "gender_compatibility",
      "needs_compatibility",
      "risk_compatibility",
      "education_needs",
      "cultural_needs",
      "therapeutic_needs",
      "location_suitability",
      "sibling_placement",
      "peer_dynamics",
    ],
    criteriaMetCount: 9,
    riskAssessmentCompleted: true,
    ...overrides,
  };
}

function makeReview(overrides: Partial<CompatibilityReview> = {}): CompatibilityReview {
  return {
    id: "cr-001",
    reviewDate: "2026-03-01",
    reviewedBy: "Sarah Johnson",
    childId1: "child-001",
    childId2: "child-002",
    compatible: true,
    riskIdentified: false,
    managementPlanInPlace: false,
    positiveRelationship: true,
    ...overrides,
  };
}

function makeStability(overrides: Partial<PlacementStability> = {}): PlacementStability {
  return {
    id: "ps-001",
    childId: "child-001",
    childName: "Alex",
    assessmentDate: "2026-05-01",
    stabilityIndicator: "stable",
    daysInPlacement: 106,
    incidentCount: 1,
    missingCount: 0,
    schoolAttending: true,
    therapeuticEngaged: true,
    keyRelationshipEstablished: true,
    ...overrides,
  };
}

function makeDisruption(overrides: Partial<DisruptionRecord> = {}): DisruptionRecord {
  return {
    id: "dr-001",
    childId: "child-099",
    childName: "Test Child",
    disruptionDate: "2026-04-01",
    reason: "Escalating behaviour incompatible with group",
    plannedMove: true,
    alternativePlacement: true,
    lessonLearnedDocumented: true,
    impactOnOtherChildren: true,
    ...overrides,
  };
}

// -- Demo Data Set ------------------------------------------------------------

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

const demoPlacements: PlacementMatch[] = [
  // Alex — excellent match
  makePlacement({
    id: "pm-001",
    childId: "child-001",
    childName: "Alex",
    admissionDate: "2026-01-15",
    matchingOutcome: "excellent_match",
    impactAssessmentStatus: "completed_pre_admission",
    existingChildrenConsulted: "all_consulted",
    staffConsulted: true,
    referralInformationComplete: true,
    trialOvernight: true,
    criteriaAssessed: [
      "age_appropriateness",
      "gender_compatibility",
      "needs_compatibility",
      "risk_compatibility",
      "education_needs",
      "cultural_needs",
      "therapeutic_needs",
      "location_suitability",
      "sibling_placement",
      "peer_dynamics",
    ],
    criteriaMetCount: 9,
    riskAssessmentCompleted: true,
  }),
  // Jordan — good match, settling
  makePlacement({
    id: "pm-002",
    childId: "child-002",
    childName: "Jordan",
    admissionDate: "2026-03-01",
    matchingOutcome: "good_match",
    impactAssessmentStatus: "completed_pre_admission",
    existingChildrenConsulted: "all_consulted",
    staffConsulted: true,
    referralInformationComplete: true,
    trialOvernight: false,
    criteriaAssessed: [
      "age_appropriateness",
      "gender_compatibility",
      "needs_compatibility",
      "risk_compatibility",
      "education_needs",
      "therapeutic_needs",
      "peer_dynamics",
    ],
    criteriaMetCount: 6,
    riskAssessmentCompleted: true,
  }),
  // Morgan — good match, stable
  makePlacement({
    id: "pm-003",
    childId: "child-003",
    childName: "Morgan",
    admissionDate: "2025-09-10",
    matchingOutcome: "good_match",
    impactAssessmentStatus: "completed_pre_admission",
    existingChildrenConsulted: "all_consulted",
    staffConsulted: true,
    referralInformationComplete: true,
    trialOvernight: true,
    criteriaAssessed: [
      "age_appropriateness",
      "gender_compatibility",
      "needs_compatibility",
      "risk_compatibility",
      "education_needs",
      "cultural_needs",
      "therapeutic_needs",
      "location_suitability",
      "peer_dynamics",
    ],
    criteriaMetCount: 8,
    riskAssessmentCompleted: true,
  }),
];

const demoReviews: CompatibilityReview[] = [
  // Alex <-> Jordan
  makeReview({
    id: "cr-001",
    reviewDate: "2026-03-05",
    reviewedBy: "Sarah Johnson",
    childId1: "child-001",
    childId2: "child-002",
    compatible: true,
    riskIdentified: false,
    managementPlanInPlace: false,
    positiveRelationship: true,
  }),
  // Alex <-> Morgan
  makeReview({
    id: "cr-002",
    reviewDate: "2026-03-05",
    reviewedBy: "Sarah Johnson",
    childId1: "child-001",
    childId2: "child-003",
    compatible: true,
    riskIdentified: false,
    managementPlanInPlace: false,
    positiveRelationship: true,
  }),
  // Jordan <-> Morgan
  makeReview({
    id: "cr-003",
    reviewDate: "2026-03-10",
    reviewedBy: "Tom Richards",
    childId1: "child-002",
    childId2: "child-003",
    compatible: true,
    riskIdentified: true,
    managementPlanInPlace: true,
    positiveRelationship: true,
  }),
];

const demoStability: PlacementStability[] = [
  // Alex — stable
  makeStability({
    id: "ps-001",
    childId: "child-001",
    childName: "Alex",
    assessmentDate: "2026-05-01",
    stabilityIndicator: "stable",
    daysInPlacement: 106,
    incidentCount: 1,
    missingCount: 0,
    schoolAttending: true,
    therapeuticEngaged: true,
    keyRelationshipEstablished: true,
  }),
  // Jordan — settling
  makeStability({
    id: "ps-002",
    childId: "child-002",
    childName: "Jordan",
    assessmentDate: "2026-05-01",
    stabilityIndicator: "settling",
    daysInPlacement: 61,
    incidentCount: 3,
    missingCount: 0,
    schoolAttending: true,
    therapeuticEngaged: true,
    keyRelationshipEstablished: true,
  }),
  // Morgan — stable
  makeStability({
    id: "ps-003",
    childId: "child-003",
    childName: "Morgan",
    assessmentDate: "2026-05-01",
    stabilityIndicator: "stable",
    daysInPlacement: 250,
    incidentCount: 0,
    missingCount: 0,
    schoolAttending: true,
    therapeuticEngaged: false,
    keyRelationshipEstablished: true,
  }),
];

const demoDisruptions: DisruptionRecord[] = [];

// ==============================================================================
// TEST SUITES
// ==============================================================================

describe("evaluateMatchingProcess", () => {
  it("counts total placements", () => {
    const result = evaluateMatchingProcess(demoPlacements);
    expect(result.totalPlacements).toBe(3);
  });

  it("calculates excellent/good rate", () => {
    const result = evaluateMatchingProcess(demoPlacements);
    // All 3 are excellent or good = 100%
    expect(result.excellentGoodRate).toBe(100);
  });

  it("calculates impact assessment rate", () => {
    const result = evaluateMatchingProcess(demoPlacements);
    // All 3 completed pre-admission = 100%
    expect(result.impactAssessmentRate).toBe(100);
  });

  it("calculates consultation rate", () => {
    const result = evaluateMatchingProcess(demoPlacements);
    // All 3 = all_consulted = 100%
    expect(result.consultationRate).toBe(100);
  });

  it("calculates referral completeness rate", () => {
    const result = evaluateMatchingProcess(demoPlacements);
    expect(result.referralCompleteRate).toBe(100);
  });

  it("calculates risk assessment rate", () => {
    const result = evaluateMatchingProcess(demoPlacements);
    expect(result.riskAssessmentRate).toBe(100);
  });

  it("calculates average criteria met", () => {
    const result = evaluateMatchingProcess(demoPlacements);
    // (9 + 6 + 8) / 3 = 7.666... => 7.7
    expect(result.averageCriteriaMet).toBeCloseTo(7.7, 1);
  });

  it("returns score between 0 and 25", () => {
    const result = evaluateMatchingProcess(demoPlacements);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns zero for empty placements", () => {
    const result = evaluateMatchingProcess([]);
    expect(result.totalPlacements).toBe(0);
    expect(result.overallScore).toBe(0);
    expect(result.excellentGoodRate).toBe(0);
    expect(result.impactAssessmentRate).toBe(0);
    expect(result.consultationRate).toBe(0);
    expect(result.referralCompleteRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.averageCriteriaMet).toBe(0);
  });

  it("handles poor match placement", () => {
    const placements = [makePlacement({ matchingOutcome: "poor_match" })];
    const result = evaluateMatchingProcess(placements);
    expect(result.excellentGoodRate).toBe(0);
  });

  it("handles placement_disrupted outcome", () => {
    const placements = [makePlacement({ matchingOutcome: "placement_disrupted" })];
    const result = evaluateMatchingProcess(placements);
    expect(result.excellentGoodRate).toBe(0);
  });

  it("handles adequate_match outcome", () => {
    const placements = [makePlacement({ matchingOutcome: "adequate_match" })];
    const result = evaluateMatchingProcess(placements);
    expect(result.excellentGoodRate).toBe(0);
  });

  it("counts completed_post_admission as completed impact assessment", () => {
    const placements = [
      makePlacement({ impactAssessmentStatus: "completed_post_admission" }),
    ];
    const result = evaluateMatchingProcess(placements);
    expect(result.impactAssessmentRate).toBe(100);
  });

  it("does not count in_progress as completed impact assessment", () => {
    const placements = [makePlacement({ impactAssessmentStatus: "in_progress" })];
    const result = evaluateMatchingProcess(placements);
    expect(result.impactAssessmentRate).toBe(0);
  });

  it("does not count not_completed as completed impact assessment", () => {
    const placements = [makePlacement({ impactAssessmentStatus: "not_completed" })];
    const result = evaluateMatchingProcess(placements);
    expect(result.impactAssessmentRate).toBe(0);
  });

  it("partially_consulted does not count as all_consulted", () => {
    const placements = [
      makePlacement({ existingChildrenConsulted: "partially_consulted" }),
    ];
    const result = evaluateMatchingProcess(placements);
    expect(result.consultationRate).toBe(0);
  });

  it("not_consulted does not count as all_consulted", () => {
    const placements = [
      makePlacement({ existingChildrenConsulted: "not_consulted" }),
    ];
    const result = evaluateMatchingProcess(placements);
    expect(result.consultationRate).toBe(0);
  });

  it("incomplete referral information reduces rate", () => {
    const placements = [
      makePlacement({ id: "p1", referralInformationComplete: true }),
      makePlacement({ id: "p2", referralInformationComplete: false }),
    ];
    const result = evaluateMatchingProcess(placements);
    expect(result.referralCompleteRate).toBe(50);
  });

  it("risk assessment not completed reduces rate", () => {
    const placements = [
      makePlacement({ id: "p1", riskAssessmentCompleted: true }),
      makePlacement({ id: "p2", riskAssessmentCompleted: false }),
    ];
    const result = evaluateMatchingProcess(placements);
    expect(result.riskAssessmentRate).toBe(50);
  });

  it("gives maximum 25 points for perfect placements", () => {
    const placements = [makePlacement()];
    const result = evaluateMatchingProcess(placements);
    expect(result.overallScore).toBe(25);
  });

  it("handles single placement with all negative indicators", () => {
    const placements = [
      makePlacement({
        matchingOutcome: "poor_match",
        impactAssessmentStatus: "not_completed",
        existingChildrenConsulted: "not_consulted",
        referralInformationComplete: false,
        riskAssessmentCompleted: false,
      }),
    ];
    const result = evaluateMatchingProcess(placements);
    expect(result.overallScore).toBe(0);
  });
});

describe("evaluateCompatibility", () => {
  it("counts total reviews", () => {
    const result = evaluateCompatibility(demoReviews);
    expect(result.totalReviews).toBe(3);
  });

  it("calculates compatible rate", () => {
    const result = evaluateCompatibility(demoReviews);
    // All 3 are compatible = 100%
    expect(result.compatibleRate).toBe(100);
  });

  it("calculates management plan rate where risk identified", () => {
    const result = evaluateCompatibility(demoReviews);
    // 1 risk identified, 1 management plan = 100%
    expect(result.managementPlanRate).toBe(100);
  });

  it("calculates positive relationship rate", () => {
    const result = evaluateCompatibility(demoReviews);
    // All 3 positive = 100%
    expect(result.positiveRelationshipRate).toBe(100);
  });

  it("counts risks identified", () => {
    const result = evaluateCompatibility(demoReviews);
    expect(result.risksIdentifiedCount).toBe(1);
  });

  it("returns score between 0 and 25", () => {
    const result = evaluateCompatibility(demoReviews);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns zero for empty reviews", () => {
    const result = evaluateCompatibility([]);
    expect(result.totalReviews).toBe(0);
    expect(result.overallScore).toBe(0);
    expect(result.compatibleRate).toBe(0);
    expect(result.managementPlanRate).toBe(0);
    expect(result.positiveRelationshipRate).toBe(0);
    expect(result.risksIdentifiedCount).toBe(0);
  });

  it("handles all incompatible reviews", () => {
    const reviews = [
      makeReview({ id: "r1", compatible: false, positiveRelationship: false }),
      makeReview({ id: "r2", compatible: false, positiveRelationship: false }),
    ];
    const result = evaluateCompatibility(reviews);
    expect(result.compatibleRate).toBe(0);
    expect(result.positiveRelationshipRate).toBe(0);
  });

  it("management plan rate is 0 when risk identified but no plan", () => {
    const reviews = [
      makeReview({
        riskIdentified: true,
        managementPlanInPlace: false,
      }),
    ];
    const result = evaluateCompatibility(reviews);
    expect(result.managementPlanRate).toBe(0);
  });

  it("management plan rate is 0 when no risks identified", () => {
    const reviews = [
      makeReview({ riskIdentified: false, managementPlanInPlace: false }),
    ];
    const result = evaluateCompatibility(reviews);
    expect(result.managementPlanRate).toBe(0);
  });

  it("handles multiple risks with mixed management plans", () => {
    const reviews = [
      makeReview({ id: "r1", riskIdentified: true, managementPlanInPlace: true }),
      makeReview({ id: "r2", riskIdentified: true, managementPlanInPlace: false }),
      makeReview({ id: "r3", riskIdentified: false }),
    ];
    const result = evaluateCompatibility(reviews);
    // 2 risks, 1 with plan = 50%
    expect(result.managementPlanRate).toBe(50);
    expect(result.risksIdentifiedCount).toBe(2);
  });

  it("gives maximum 25 points for all compatible, positive, managed risks", () => {
    const reviews = [
      makeReview({
        compatible: true,
        positiveRelationship: true,
        riskIdentified: true,
        managementPlanInPlace: true,
      }),
    ];
    const result = evaluateCompatibility(reviews);
    expect(result.overallScore).toBe(25);
  });
});

describe("evaluateStabilityOutcomes", () => {
  it("counts total assessments", () => {
    const result = evaluateStabilityOutcomes(demoStability);
    expect(result.totalAssessments).toBe(3);
  });

  it("calculates stable/settling rate", () => {
    const result = evaluateStabilityOutcomes(demoStability);
    // All 3 are stable or settling = 100%
    expect(result.stableSettlingRate).toBe(100);
  });

  it("counts at-risk placements", () => {
    const result = evaluateStabilityOutcomes(demoStability);
    expect(result.atRiskCount).toBe(0);
  });

  it("counts disrupted placements", () => {
    const result = evaluateStabilityOutcomes(demoStability);
    expect(result.disruptedCount).toBe(0);
  });

  it("calculates school attending rate", () => {
    const result = evaluateStabilityOutcomes(demoStability);
    expect(result.schoolAttendingRate).toBe(100);
  });

  it("calculates therapeutic engaged rate", () => {
    const result = evaluateStabilityOutcomes(demoStability);
    // Alex and Jordan engaged, Morgan not = 67%
    expect(result.therapeuticEngagedRate).toBe(67);
  });

  it("calculates key relationship rate", () => {
    const result = evaluateStabilityOutcomes(demoStability);
    // All 3 have key relationships = 100%
    expect(result.keyRelationshipRate).toBe(100);
  });

  it("calculates average days in placement", () => {
    const result = evaluateStabilityOutcomes(demoStability);
    // (106 + 61 + 250) / 3 = 139
    expect(result.averageDaysInPlacement).toBe(139);
  });

  it("returns score between 0 and 25", () => {
    const result = evaluateStabilityOutcomes(demoStability);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns zero for empty assessments", () => {
    const result = evaluateStabilityOutcomes([]);
    expect(result.totalAssessments).toBe(0);
    expect(result.overallScore).toBe(0);
    expect(result.stableSettlingRate).toBe(0);
    expect(result.atRiskCount).toBe(0);
    expect(result.disruptedCount).toBe(0);
    expect(result.schoolAttendingRate).toBe(0);
    expect(result.therapeuticEngagedRate).toBe(0);
    expect(result.keyRelationshipRate).toBe(0);
    expect(result.averageDaysInPlacement).toBe(0);
  });

  it("handles at_risk_of_disruption indicator", () => {
    const assessments = [
      makeStability({ stabilityIndicator: "at_risk_of_disruption" }),
    ];
    const result = evaluateStabilityOutcomes(assessments);
    expect(result.atRiskCount).toBe(1);
    expect(result.stableSettlingRate).toBe(0);
  });

  it("handles disrupted indicator", () => {
    const assessments = [
      makeStability({ stabilityIndicator: "disrupted" }),
    ];
    const result = evaluateStabilityOutcomes(assessments);
    expect(result.disruptedCount).toBe(1);
    expect(result.stableSettlingRate).toBe(0);
  });

  it("handles unsettled indicator", () => {
    const assessments = [makeStability({ stabilityIndicator: "unsettled" })];
    const result = evaluateStabilityOutcomes(assessments);
    expect(result.stableSettlingRate).toBe(0);
  });

  it("handles mixed stability indicators", () => {
    const assessments = [
      makeStability({ id: "s1", stabilityIndicator: "stable" }),
      makeStability({ id: "s2", stabilityIndicator: "unsettled" }),
      makeStability({ id: "s3", stabilityIndicator: "at_risk_of_disruption" }),
      makeStability({ id: "s4", stabilityIndicator: "settling" }),
    ];
    const result = evaluateStabilityOutcomes(assessments);
    // stable + settling = 2/4 = 50%
    expect(result.stableSettlingRate).toBe(50);
    expect(result.atRiskCount).toBe(1);
  });

  it("all negative indicators produce low score", () => {
    const assessments = [
      makeStability({
        stabilityIndicator: "disrupted",
        schoolAttending: false,
        therapeuticEngaged: false,
        keyRelationshipEstablished: false,
      }),
    ];
    const result = evaluateStabilityOutcomes(assessments);
    expect(result.overallScore).toBe(0);
  });

  it("all positive indicators produce maximum score", () => {
    const assessments = [
      makeStability({
        stabilityIndicator: "stable",
        schoolAttending: true,
        therapeuticEngaged: true,
        keyRelationshipEstablished: true,
      }),
    ];
    const result = evaluateStabilityOutcomes(assessments);
    expect(result.overallScore).toBe(25);
  });
});

describe("evaluateDisruptionLearning", () => {
  it("returns 25 for no disruptions", () => {
    const result = evaluateDisruptionLearning([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalDisruptions).toBe(0);
  });

  it("returns 25 for demo data (no disruptions)", () => {
    const result = evaluateDisruptionLearning(demoDisruptions);
    expect(result.overallScore).toBe(25);
  });

  it("reduces score when disruptions exist with incomplete documentation", () => {
    const disruptions = [
      makeDisruption({
        plannedMove: false,
        lessonLearnedDocumented: false,
        impactOnOtherChildren: false,
      }),
    ];
    const result = evaluateDisruptionLearning(disruptions);
    expect(result.totalDisruptions).toBe(1);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("calculates planned move rate", () => {
    const disruptions = [
      makeDisruption({ id: "d1", plannedMove: true }),
      makeDisruption({ id: "d2", plannedMove: false }),
    ];
    const result = evaluateDisruptionLearning(disruptions);
    expect(result.plannedMoveRate).toBe(50);
  });

  it("calculates lesson documented rate", () => {
    const disruptions = [
      makeDisruption({ id: "d1", lessonLearnedDocumented: true }),
      makeDisruption({ id: "d2", lessonLearnedDocumented: false }),
    ];
    const result = evaluateDisruptionLearning(disruptions);
    expect(result.lessonDocumentedRate).toBe(50);
  });

  it("calculates impact assessed rate", () => {
    const disruptions = [
      makeDisruption({ id: "d1", impactOnOtherChildren: true }),
      makeDisruption({ id: "d2", impactOnOtherChildren: false }),
    ];
    const result = evaluateDisruptionLearning(disruptions);
    expect(result.impactAssessedRate).toBe(50);
  });

  it("returns score between 0 and 25", () => {
    const disruptions = [makeDisruption(), makeDisruption({ id: "d2" })];
    const result = evaluateDisruptionLearning(disruptions);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("all undocumented disruptions produce lowest scores", () => {
    const disruptions = [
      makeDisruption({
        id: "d1",
        plannedMove: false,
        lessonLearnedDocumented: false,
        impactOnOtherChildren: false,
      }),
      makeDisruption({
        id: "d2",
        plannedMove: false,
        lessonLearnedDocumented: false,
        impactOnOtherChildren: false,
      }),
      makeDisruption({
        id: "d3",
        plannedMove: false,
        lessonLearnedDocumented: false,
        impactOnOtherChildren: false,
      }),
    ];
    const result = evaluateDisruptionLearning(disruptions);
    expect(result.plannedMoveRate).toBe(0);
    expect(result.lessonDocumentedRate).toBe(0);
    expect(result.impactAssessedRate).toBe(0);
    expect(result.overallScore).toBeLessThan(16);
  });

  it("well-documented disruptions recover some score", () => {
    const disruptions = [
      makeDisruption({
        plannedMove: true,
        lessonLearnedDocumented: true,
        impactOnOtherChildren: true,
      }),
    ];
    const result = evaluateDisruptionLearning(disruptions);
    expect(result.overallScore).toBeGreaterThan(20);
  });

  it("rates are 0 for zero disruptions", () => {
    const result = evaluateDisruptionLearning([]);
    expect(result.plannedMoveRate).toBe(0);
    expect(result.lessonDocumentedRate).toBe(0);
    expect(result.impactAssessedRate).toBe(0);
  });

  it("never returns negative score", () => {
    const manyDisruptions = Array.from({ length: 10 }, (_, i) =>
      makeDisruption({
        id: `d-${i}`,
        plannedMove: false,
        lessonLearnedDocumented: false,
        impactOnOtherChildren: false,
      }),
    );
    const result = evaluateDisruptionLearning(manyDisruptions);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

describe("buildChildProfiles", () => {
  it("returns a profile for each placement", () => {
    const profiles = buildChildProfiles(demoPlacements, demoStability, demoReviews);
    expect(profiles.length).toBe(3);
  });

  it("returns correct child details", () => {
    const profiles = buildChildProfiles(demoPlacements, demoStability, demoReviews);
    const alex = profiles.find((p) => p.childId === "child-001")!;
    expect(alex.childName).toBe("Alex");
    expect(alex.matchingOutcome).toBe("excellent_match");
    expect(alex.stabilityIndicator).toBe("stable");
  });

  it("returns days in placement from stability record", () => {
    const profiles = buildChildProfiles(demoPlacements, demoStability, demoReviews);
    const alex = profiles.find((p) => p.childId === "child-001")!;
    expect(alex.daysInPlacement).toBe(106);
  });

  it("counts compatibility issues (incompatible reviews)", () => {
    const profiles = buildChildProfiles(demoPlacements, demoStability, demoReviews);
    // All reviews are compatible so 0 issues each
    for (const profile of profiles) {
      expect(profile.compatibilityIssues).toBe(0);
    }
  });

  it("counts compatibility issues when incompatible", () => {
    const reviewsWithIssues = [
      makeReview({
        id: "r1",
        childId1: "child-001",
        childId2: "child-002",
        compatible: false,
      }),
    ];
    const profiles = buildChildProfiles(demoPlacements, demoStability, reviewsWithIssues);
    const alex = profiles.find((p) => p.childId === "child-001")!;
    expect(alex.compatibilityIssues).toBe(1);
    const jordan = profiles.find((p) => p.childId === "child-002")!;
    expect(jordan.compatibilityIssues).toBe(1);
  });

  it("returns overall score between 0 and 10", () => {
    const profiles = buildChildProfiles(demoPlacements, demoStability, demoReviews);
    for (const profile of profiles) {
      expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      expect(profile.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("defaults stability to settling when no stability record exists", () => {
    const profiles = buildChildProfiles(demoPlacements, [], demoReviews);
    for (const profile of profiles) {
      expect(profile.stabilityIndicator).toBe("settling");
      expect(profile.daysInPlacement).toBe(0);
    }
  });

  it("returns empty array for no placements", () => {
    const profiles = buildChildProfiles([], demoStability, demoReviews);
    expect(profiles).toEqual([]);
  });

  it("excellent match with stable placement and no issues scores highest", () => {
    const profiles = buildChildProfiles(
      [makePlacement({ matchingOutcome: "excellent_match" })],
      [makeStability({ stabilityIndicator: "stable" })],
      [],
    );
    expect(profiles[0].overallScore).toBe(10);
  });

  it("poor match with disrupted placement scores lowest", () => {
    const profiles = buildChildProfiles(
      [makePlacement({ matchingOutcome: "poor_match" })],
      [makeStability({ stabilityIndicator: "disrupted" })],
      [
        makeReview({ childId1: "child-001", childId2: "child-x", compatible: false }),
        makeReview({ childId1: "child-y", childId2: "child-001", compatible: false }),
        makeReview({ childId1: "child-001", childId2: "child-z", compatible: false }),
      ],
    );
    expect(profiles[0].overallScore).toBe(1);
  });
});

describe("generatePlacementMatchingQualityIntelligence", () => {
  const result = generatePlacementMatchingQualityIntelligence(
    demoPlacements,
    demoReviews,
    demoStability,
    demoDisruptions,
    "oak-house",
    PERIOD_START,
    PERIOD_END,
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("produces an overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(
      result.rating,
    );
  });

  it("includes matching process results", () => {
    expect(result.matchingProcess).toBeDefined();
    expect(result.matchingProcess.totalPlacements).toBe(3);
  });

  it("includes compatibility results", () => {
    expect(result.compatibility).toBeDefined();
    expect(result.compatibility.totalReviews).toBe(3);
  });

  it("includes stability outcome results", () => {
    expect(result.stabilityOutcome).toBeDefined();
    expect(result.stabilityOutcome.totalAssessments).toBe(3);
  });

  it("includes disruption learning results", () => {
    expect(result.disruptionLearning).toBeDefined();
    expect(result.disruptionLearning.totalDisruptions).toBe(0);
    expect(result.disruptionLearning.overallScore).toBe(25);
  });

  it("includes child profiles", () => {
    expect(result.childProfiles.length).toBe(3);
  });

  it("overall score equals sum of component scores", () => {
    const sum =
      result.matchingProcess.overallScore +
      result.compatibility.overallScore +
      result.stabilityOutcome.overallScore +
      result.disruptionLearning.overallScore;
    expect(result.overallScore).toBe(Math.min(100, Math.max(0, Math.round(sum))));
  });

  it("generates strengths array", () => {
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement array", () => {
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    expect(Array.isArray(result.actions)).toBe(true);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("regulatory links include Reg 12", () => {
    const hasReg12 = result.regulatoryLinks.some((l) => l.includes("Reg 12"));
    expect(hasReg12).toBe(true);
  });

  it("regulatory links include Reg 14", () => {
    const hasReg14 = result.regulatoryLinks.some((l) => l.includes("Reg 14"));
    expect(hasReg14).toBe(true);
  });

  it("regulatory links include SCCIF", () => {
    const hasSCCIF = result.regulatoryLinks.some((l) => l.includes("SCCIF"));
    expect(hasSCCIF).toBe(true);
  });

  it("regulatory links include NMS 11", () => {
    const hasNMS = result.regulatoryLinks.some((l) => l.includes("NMS 11"));
    expect(hasNMS).toBe(true);
  });

  it("regulatory links include UNCRC Article 3", () => {
    const hasUNCRC = result.regulatoryLinks.some((l) => l.includes("UNCRC Article 3"));
    expect(hasUNCRC).toBe(true);
  });

  it("regulatory links include Working Together 2023", () => {
    const hasWT = result.regulatoryLinks.some((l) => l.includes("Working Together"));
    expect(hasWT).toBe(true);
  });

  it("regulatory links include CA 1989 s22C", () => {
    const hasCA = result.regulatoryLinks.some((l) => l.includes("CA 1989 s22C"));
    expect(hasCA).toBe(true);
  });
});

describe("Scoring thresholds", () => {
  it("outstanding rating for perfect data", () => {
    const result = generatePlacementMatchingQualityIntelligence(
      [makePlacement()],
      [
        makeReview({
          compatible: true,
          riskIdentified: true,
          managementPlanInPlace: true,
          positiveRelationship: true,
        }),
      ],
      [
        makeStability({
          stabilityIndicator: "stable",
          schoolAttending: true,
          therapeuticEngaged: true,
          keyRelationshipEstablished: true,
        }),
      ],
      [],
      "test-home",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("inadequate rating for poor data", () => {
    const result = generatePlacementMatchingQualityIntelligence(
      [
        makePlacement({
          matchingOutcome: "poor_match",
          impactAssessmentStatus: "not_completed",
          existingChildrenConsulted: "not_consulted",
          referralInformationComplete: false,
          riskAssessmentCompleted: false,
        }),
      ],
      [makeReview({ compatible: false, positiveRelationship: false })],
      [
        makeStability({
          stabilityIndicator: "disrupted",
          schoolAttending: false,
          therapeuticEngaged: false,
          keyRelationshipEstablished: false,
        }),
      ],
      [
        makeDisruption({
          plannedMove: false,
          lessonLearnedDocumented: false,
          impactOnOtherChildren: false,
        }),
        makeDisruption({
          id: "d2",
          plannedMove: false,
          lessonLearnedDocumented: false,
          impactOnOtherChildren: false,
        }),
        makeDisruption({
          id: "d3",
          plannedMove: false,
          lessonLearnedDocumented: false,
          impactOnOtherChildren: false,
        }),
      ],
      "test-home",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("handles all empty data gracefully", () => {
    const result = generatePlacementMatchingQualityIntelligence(
      [],
      [],
      [],
      [],
      "empty-home",
      PERIOD_START,
      PERIOD_END,
    );
    // Empty placements/reviews/stability = 0, but empty disruptions = 25
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toEqual([]);
  });

  it("overall score never exceeds 100", () => {
    const result = generatePlacementMatchingQualityIntelligence(
      [makePlacement()],
      [
        makeReview({
          compatible: true,
          riskIdentified: true,
          managementPlanInPlace: true,
          positiveRelationship: true,
        }),
      ],
      [
        makeStability({
          stabilityIndicator: "stable",
          schoolAttending: true,
          therapeuticEngaged: true,
          keyRelationshipEstablished: true,
        }),
      ],
      [],
      "test",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score never goes below 0", () => {
    const result = generatePlacementMatchingQualityIntelligence(
      [],
      [],
      [],
      Array.from({ length: 10 }, (_, i) =>
        makeDisruption({
          id: `d-${i}`,
          plannedMove: false,
          lessonLearnedDocumented: false,
          impactOnOtherChildren: false,
        }),
      ),
      "test",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

describe("Strengths and areas generation", () => {
  it("generates matching strength when excellent/good rate >= 80%", () => {
    const result = generatePlacementMatchingQualityIntelligence(
      demoPlacements,
      demoReviews,
      demoStability,
      demoDisruptions,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const hasMatchingStrength = result.strengths.some((s) =>
      s.includes("matching practice"),
    );
    expect(hasMatchingStrength).toBe(true);
  });

  it("generates no disruption strength when zero disruptions", () => {
    const result = generatePlacementMatchingQualityIntelligence(
      demoPlacements,
      demoReviews,
      demoStability,
      [],
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const hasNoDisruptionStrength = result.strengths.some((s) =>
      s.includes("No placement disruptions"),
    );
    expect(hasNoDisruptionStrength).toBe(true);
  });

  it("generates compatibility strength when compatibility rate >= 80%", () => {
    const result = generatePlacementMatchingQualityIntelligence(
      demoPlacements,
      demoReviews,
      demoStability,
      demoDisruptions,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const hasCompatibilityStrength = result.strengths.some((s) =>
      s.includes("compatibility"),
    );
    expect(hasCompatibilityStrength).toBe(true);
  });

  it("flags area when consultation rate < 70%", () => {
    const placements = [
      makePlacement({ id: "p1", existingChildrenConsulted: "not_consulted" }),
      makePlacement({ id: "p2", existingChildrenConsulted: "not_consulted" }),
      makePlacement({ id: "p3", existingChildrenConsulted: "partially_consulted" }),
    ];
    const result = generatePlacementMatchingQualityIntelligence(
      placements,
      demoReviews,
      demoStability,
      demoDisruptions,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const hasConsultationArea = result.areasForImprovement.some((a) =>
      a.includes("consulted"),
    );
    expect(hasConsultationArea).toBe(true);
  });

  it("generates no-action message when everything is perfect", () => {
    const result = generatePlacementMatchingQualityIntelligence(
      [makePlacement()],
      [],
      [
        makeStability({
          stabilityIndicator: "stable",
          schoolAttending: true,
          therapeuticEngaged: true,
          keyRelationshipEstablished: true,
        }),
      ],
      [],
      "test-home",
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions[0]).toContain("No immediate actions");
  });

  it("generates at-risk action when at-risk placements exist", () => {
    const result = generatePlacementMatchingQualityIntelligence(
      demoPlacements,
      demoReviews,
      [makeStability({ stabilityIndicator: "at_risk_of_disruption" })],
      demoDisruptions,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
    );
    const hasAtRiskAction = result.actions.some((a) =>
      a.includes("at risk of disruption"),
    );
    expect(hasAtRiskAction).toBe(true);
  });
});

describe("Label functions", () => {
  it("getMatchingOutcomeLabel returns human-readable labels", () => {
    expect(getMatchingOutcomeLabel("excellent_match")).toBe("Excellent Match");
    expect(getMatchingOutcomeLabel("good_match")).toBe("Good Match");
    expect(getMatchingOutcomeLabel("adequate_match")).toBe("Adequate Match");
    expect(getMatchingOutcomeLabel("poor_match")).toBe("Poor Match");
    expect(getMatchingOutcomeLabel("placement_disrupted")).toBe("Placement Disrupted");
  });

  it("getStabilityIndicatorLabel returns human-readable labels", () => {
    expect(getStabilityIndicatorLabel("stable")).toBe("Stable");
    expect(getStabilityIndicatorLabel("settling")).toBe("Settling");
    expect(getStabilityIndicatorLabel("unsettled")).toBe("Unsettled");
    expect(getStabilityIndicatorLabel("at_risk_of_disruption")).toBe(
      "At Risk of Disruption",
    );
    expect(getStabilityIndicatorLabel("disrupted")).toBe("Disrupted");
  });

  it("getImpactAssessmentStatusLabel returns human-readable labels", () => {
    expect(getImpactAssessmentStatusLabel("completed_pre_admission")).toBe(
      "Completed Pre-Admission",
    );
    expect(getImpactAssessmentStatusLabel("completed_post_admission")).toBe(
      "Completed Post-Admission",
    );
    expect(getImpactAssessmentStatusLabel("not_completed")).toBe("Not Completed");
    expect(getImpactAssessmentStatusLabel("in_progress")).toBe("In Progress");
  });

  it("getConsultationStatusLabel returns human-readable labels", () => {
    expect(getConsultationStatusLabel("all_consulted")).toBe("All Consulted");
    expect(getConsultationStatusLabel("partially_consulted")).toBe(
      "Partially Consulted",
    );
    expect(getConsultationStatusLabel("not_consulted")).toBe("Not Consulted");
  });

  it("getMatchingCriteriaLabel returns human-readable labels", () => {
    expect(getMatchingCriteriaLabel("age_appropriateness")).toBe("Age Appropriateness");
    expect(getMatchingCriteriaLabel("gender_compatibility")).toBe(
      "Gender Compatibility",
    );
    expect(getMatchingCriteriaLabel("needs_compatibility")).toBe(
      "Needs Compatibility",
    );
    expect(getMatchingCriteriaLabel("risk_compatibility")).toBe("Risk Compatibility");
    expect(getMatchingCriteriaLabel("education_needs")).toBe("Education Needs");
    expect(getMatchingCriteriaLabel("cultural_needs")).toBe("Cultural Needs");
    expect(getMatchingCriteriaLabel("therapeutic_needs")).toBe("Therapeutic Needs");
    expect(getMatchingCriteriaLabel("location_suitability")).toBe(
      "Location Suitability",
    );
    expect(getMatchingCriteriaLabel("sibling_placement")).toBe("Sibling Placement");
    expect(getMatchingCriteriaLabel("peer_dynamics")).toBe("Peer Dynamics");
  });

  it("getRatingLabel returns human-readable labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});
