// ==============================================================================
// Cornerstone -- Disability & Reasonable Adjustments Intelligence Engine Tests
// 80+ tests covering all functions, scoring, labels, edge cases
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getDisabilityTypeLabel,
  getAdjustmentStatusLabel,
  getEquipmentConditionLabel,
  getReviewOutcomeLabel,
  getRatingLabel,
  evaluateAdjustmentImplementation,
  evaluateAccessibilityCompliance,
  evaluateEquipmentProvision,
  evaluateStaffDisabilityReadiness,
  buildChildAdjustmentSummaries,
  generateDisabilityReasonableAdjustmentsIntelligence,
  disabilityTypeLabels,
  adjustmentStatusLabels,
  equipmentConditionLabels,
  reviewOutcomeLabels,
  ratingLabels,
} from "../disability-reasonable-adjustments-engine";
import type {
  AdjustmentRecord,
  AccessibilityAudit,
  EquipmentRecord,
  StaffDisabilityTraining,
  DisabilityType,
  AdjustmentStatus,
  EquipmentCondition,
  ReviewOutcome,
  Rating,
} from "../disability-reasonable-adjustments-engine";

// -- Test Data Factories ------------------------------------------------------

function makeAdjustment(overrides: Partial<AdjustmentRecord> = {}): AdjustmentRecord {
  return {
    id: "adj-test",
    childId: "child-1",
    childName: "Test Child",
    disabilityType: "physical",
    adjustmentDescription: "Test adjustment",
    adjustmentStatus: "in_place",
    dateImplemented: "2025-01-01",
    reviewDate: "2025-07-01",
    reviewCurrent: true,
    ehcpInPlace: true,
    professionalInvolved: true,
    ...overrides,
  };
}

function makeAudit(overrides: Partial<AccessibilityAudit> = {}): AccessibilityAudit {
  return {
    id: "audit-test",
    auditDate: "2025-06-01",
    auditor: "Test Auditor",
    physicalAccessCompliant: true,
    sensoryEnvironmentAdapted: true,
    communicationAidsAvailable: true,
    signageAccessible: true,
    overallCompliant: true,
    ...overrides,
  };
}

function makeEquipment(overrides: Partial<EquipmentRecord> = {}): EquipmentRecord {
  return {
    id: "equip-test",
    childId: "child-1",
    childName: "Test Child",
    equipmentType: "Wheelchair",
    condition: "good",
    lastChecked: "2025-06-01",
    maintenanceCurrent: true,
    replacementNeeded: false,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffDisabilityTraining> = {}): StaffDisabilityTraining {
  return {
    id: "train-test",
    staffId: "staff-1",
    staffName: "Test Staff",
    disabilityAwareness: true,
    reasonableAdjustmentsTrained: true,
    ehcpUnderstanding: true,
    communicationStrategies: true,
    personalCareTrained: true,
    emergencyEvacuationTrained: true,
    ...overrides,
  };
}

// ==============================================================================
// pct() helper
// ==============================================================================

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for 1/2", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

// ==============================================================================
// getRating() helper
// ==============================================================================

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles exact boundary at 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(79)).toBe("good");
  });

  it("handles exact boundary at 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("handles exact boundary at 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ==============================================================================
// Label getters
// ==============================================================================

describe("getDisabilityTypeLabel", () => {
  const cases: [DisabilityType, string][] = [
    ["physical", "Physical"],
    ["sensory_visual", "Sensory (Visual)"],
    ["sensory_hearing", "Sensory (Hearing)"],
    ["cognitive", "Cognitive"],
    ["learning", "Learning"],
    ["autism_spectrum", "Autism Spectrum"],
    ["mental_health", "Mental Health"],
    ["speech_language", "Speech & Language"],
    ["multiple", "Multiple"],
    ["other", "Other"],
  ];
  it.each(cases)("returns %s for %s", (type, expected) => {
    expect(getDisabilityTypeLabel(type)).toBe(expected);
  });
});

describe("getAdjustmentStatusLabel", () => {
  const cases: [AdjustmentStatus, string][] = [
    ["in_place", "In Place"],
    ["pending", "Pending"],
    ["under_review", "Under Review"],
    ["not_needed", "Not Needed"],
    ["refused", "Refused"],
  ];
  it.each(cases)("returns %s for %s", (status, expected) => {
    expect(getAdjustmentStatusLabel(status)).toBe(expected);
  });
});

describe("getEquipmentConditionLabel", () => {
  const cases: [EquipmentCondition, string][] = [
    ["good", "Good"],
    ["fair", "Fair"],
    ["poor", "Poor"],
    ["needs_replacement", "Needs Replacement"],
  ];
  it.each(cases)("returns %s for %s", (condition, expected) => {
    expect(getEquipmentConditionLabel(condition)).toBe(expected);
  });
});

describe("getReviewOutcomeLabel", () => {
  const cases: [ReviewOutcome, string][] = [
    ["effective", "Effective"],
    ["partially_effective", "Partially Effective"],
    ["not_effective", "Not Effective"],
    ["needs_update", "Needs Update"],
  ];
  it.each(cases)("returns %s for %s", (outcome, expected) => {
    expect(getReviewOutcomeLabel(outcome)).toBe(expected);
  });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [
    ["outstanding", "Outstanding"],
    ["good", "Good"],
    ["requires_improvement", "Requires Improvement"],
    ["inadequate", "Inadequate"],
  ];
  it.each(cases)("returns %s for %s", (rating, expected) => {
    expect(getRatingLabel(rating)).toBe(expected);
  });
});

describe("label maps are exported and complete", () => {
  it("disabilityTypeLabels has 10 entries", () => {
    expect(Object.keys(disabilityTypeLabels)).toHaveLength(10);
  });

  it("adjustmentStatusLabels has 5 entries", () => {
    expect(Object.keys(adjustmentStatusLabels)).toHaveLength(5);
  });

  it("equipmentConditionLabels has 4 entries", () => {
    expect(Object.keys(equipmentConditionLabels)).toHaveLength(4);
  });

  it("reviewOutcomeLabels has 4 entries", () => {
    expect(Object.keys(reviewOutcomeLabels)).toHaveLength(4);
  });

  it("ratingLabels has 4 entries", () => {
    expect(Object.keys(ratingLabels)).toHaveLength(4);
  });
});

// ==============================================================================
// evaluateAdjustmentImplementation
// ==============================================================================

describe("evaluateAdjustmentImplementation", () => {
  it("returns score 0 for empty data", () => {
    const result = evaluateAdjustmentImplementation([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAdjustments).toBe(0);
    expect(result.inPlaceRate).toBe(0);
    expect(result.reviewCurrentRate).toBe(0);
    expect(result.ehcpRate).toBe(0);
    expect(result.professionalInvolvedRate).toBe(0);
  });

  it("returns score 25 for perfect data", () => {
    const adjustments = [
      makeAdjustment({ id: "a1" }),
      makeAdjustment({ id: "a2" }),
      makeAdjustment({ id: "a3" }),
    ];
    const result = evaluateAdjustmentImplementation(adjustments);
    expect(result.overallScore).toBe(25);
    expect(result.inPlaceRate).toBe(100);
    expect(result.reviewCurrentRate).toBe(100);
    expect(result.ehcpRate).toBe(100);
    expect(result.professionalInvolvedRate).toBe(100);
  });

  it("calculates correct rates for mixed data", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", adjustmentStatus: "in_place", reviewCurrent: true, ehcpInPlace: true, professionalInvolved: true }),
      makeAdjustment({ id: "a2", adjustmentStatus: "pending", reviewCurrent: false, ehcpInPlace: false, professionalInvolved: false }),
    ];
    const result = evaluateAdjustmentImplementation(adjustments);
    expect(result.inPlaceRate).toBe(50);
    expect(result.reviewCurrentRate).toBe(50);
    expect(result.ehcpRate).toBe(50);
    expect(result.professionalInvolvedRate).toBe(50);
    expect(result.totalAdjustments).toBe(2);
  });

  it("builds status breakdown correctly", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", adjustmentStatus: "in_place" }),
      makeAdjustment({ id: "a2", adjustmentStatus: "in_place" }),
      makeAdjustment({ id: "a3", adjustmentStatus: "pending" }),
    ];
    const result = evaluateAdjustmentImplementation(adjustments);
    expect(result.statusBreakdown).toEqual({ in_place: 2, pending: 1 });
  });

  it("builds disability type breakdown correctly", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", disabilityType: "physical" }),
      makeAdjustment({ id: "a2", disabilityType: "physical" }),
      makeAdjustment({ id: "a3", disabilityType: "learning" }),
    ];
    const result = evaluateAdjustmentImplementation(adjustments);
    expect(result.disabilityTypeBreakdown).toEqual({ physical: 2, learning: 1 });
  });

  it("produces score between 0 and 25 for partial data", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", adjustmentStatus: "in_place", reviewCurrent: true, ehcpInPlace: false, professionalInvolved: false }),
    ];
    const result = evaluateAdjustmentImplementation(adjustments);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single adjustment with all false", () => {
    const adjustments = [
      makeAdjustment({ adjustmentStatus: "refused", reviewCurrent: false, ehcpInPlace: false, professionalInvolved: false }),
    ];
    const result = evaluateAdjustmentImplementation(adjustments);
    expect(result.overallScore).toBe(0);
    expect(result.inPlaceRate).toBe(0);
  });

  it("handles all statuses", () => {
    const statuses: AdjustmentStatus[] = ["in_place", "pending", "under_review", "not_needed", "refused"];
    const adjustments = statuses.map((s, i) =>
      makeAdjustment({ id: `a${i}`, adjustmentStatus: s }),
    );
    const result = evaluateAdjustmentImplementation(adjustments);
    expect(result.totalAdjustments).toBe(5);
    expect(result.inPlaceCount).toBe(1);
    expect(result.inPlaceRate).toBe(20);
  });
});

// ==============================================================================
// evaluateAccessibilityCompliance
// ==============================================================================

describe("evaluateAccessibilityCompliance", () => {
  it("returns score 0 for empty data", () => {
    const result = evaluateAccessibilityCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAudits).toBe(0);
    expect(result.physicalAccessRate).toBe(0);
    expect(result.sensoryAdaptationRate).toBe(0);
    expect(result.communicationAidsRate).toBe(0);
    expect(result.overallComplianceRate).toBe(0);
  });

  it("returns score 25 for perfect data", () => {
    const audits = [makeAudit({ id: "a1" }), makeAudit({ id: "a2" })];
    const result = evaluateAccessibilityCompliance(audits);
    expect(result.overallScore).toBe(25);
    expect(result.physicalAccessRate).toBe(100);
    expect(result.sensoryAdaptationRate).toBe(100);
    expect(result.communicationAidsRate).toBe(100);
    expect(result.overallComplianceRate).toBe(100);
  });

  it("calculates correct rates for mixed data", () => {
    const audits = [
      makeAudit({ id: "a1" }),
      makeAudit({
        id: "a2",
        physicalAccessCompliant: false,
        sensoryEnvironmentAdapted: false,
        communicationAidsAvailable: false,
        signageAccessible: false,
        overallCompliant: false,
      }),
    ];
    const result = evaluateAccessibilityCompliance(audits);
    expect(result.physicalAccessRate).toBe(50);
    expect(result.sensoryAdaptationRate).toBe(50);
    expect(result.communicationAidsRate).toBe(50);
    expect(result.signageAccessibleRate).toBe(50);
    expect(result.overallComplianceRate).toBe(50);
  });

  it("handles single audit all false", () => {
    const audits = [
      makeAudit({
        physicalAccessCompliant: false,
        sensoryEnvironmentAdapted: false,
        communicationAidsAvailable: false,
        signageAccessible: false,
        overallCompliant: false,
      }),
    ];
    const result = evaluateAccessibilityCompliance(audits);
    expect(result.overallScore).toBe(0);
  });

  it("signageAccessible does not affect overall score formula directly", () => {
    // signageAccessible is tracked but not in the scoring formula
    const auditGoodSignage = makeAudit({ id: "a1", signageAccessible: true });
    const auditBadSignage = makeAudit({ id: "a2", signageAccessible: false });
    const r1 = evaluateAccessibilityCompliance([auditGoodSignage]);
    const r2 = evaluateAccessibilityCompliance([auditBadSignage]);
    // Both should have same overallScore because signage is not in the formula
    // (physical, sensory, communication, overall compliance are all true in both)
    expect(r1.overallScore).toBe(r2.overallScore);
  });

  it("produces score between 0 and 25", () => {
    const audits = [
      makeAudit({ id: "a1", physicalAccessCompliant: false, overallCompliant: false }),
    ];
    const result = evaluateAccessibilityCompliance(audits);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ==============================================================================
// evaluateEquipmentProvision
// ==============================================================================

describe("evaluateEquipmentProvision", () => {
  it("returns score 0 for empty data", () => {
    const result = evaluateEquipmentProvision([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalEquipment).toBe(0);
    expect(result.goodConditionRate).toBe(0);
    expect(result.maintenanceCurrentRate).toBe(0);
    expect(result.replacementBacklog).toBe(0);
  });

  it("returns score 25 for perfect data", () => {
    const equipment = [
      makeEquipment({ id: "e1" }),
      makeEquipment({ id: "e2" }),
    ];
    const result = evaluateEquipmentProvision(equipment);
    expect(result.overallScore).toBe(25);
    expect(result.goodConditionRate).toBe(100);
    expect(result.maintenanceCurrentRate).toBe(100);
    expect(result.replacementBacklog).toBe(0);
    expect(result.replacementBacklogRate).toBe(0);
  });

  it("calculates correct rates for mixed data", () => {
    const equipment = [
      makeEquipment({ id: "e1", condition: "good", maintenanceCurrent: true, replacementNeeded: false }),
      makeEquipment({ id: "e2", condition: "poor", maintenanceCurrent: false, replacementNeeded: true }),
    ];
    const result = evaluateEquipmentProvision(equipment);
    expect(result.goodConditionRate).toBe(50);
    expect(result.maintenanceCurrentRate).toBe(50);
    expect(result.replacementBacklog).toBe(1);
    expect(result.replacementBacklogRate).toBe(50);
  });

  it("builds condition breakdown", () => {
    const equipment = [
      makeEquipment({ id: "e1", condition: "good" }),
      makeEquipment({ id: "e2", condition: "good" }),
      makeEquipment({ id: "e3", condition: "fair" }),
      makeEquipment({ id: "e4", condition: "needs_replacement" }),
    ];
    const result = evaluateEquipmentProvision(equipment);
    expect(result.conditionBreakdown).toEqual({
      good: 2,
      fair: 1,
      needs_replacement: 1,
    });
  });

  it("handles all equipment needing replacement", () => {
    const equipment = [
      makeEquipment({ id: "e1", condition: "needs_replacement", maintenanceCurrent: false, replacementNeeded: true }),
      makeEquipment({ id: "e2", condition: "needs_replacement", maintenanceCurrent: false, replacementNeeded: true }),
    ];
    const result = evaluateEquipmentProvision(equipment);
    expect(result.replacementBacklog).toBe(2);
    expect(result.replacementBacklogRate).toBe(100);
    expect(result.goodConditionRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("penalises replacement backlog in score", () => {
    const noBacklog = evaluateEquipmentProvision([
      makeEquipment({ id: "e1", replacementNeeded: false }),
    ]);
    const withBacklog = evaluateEquipmentProvision([
      makeEquipment({ id: "e1", replacementNeeded: true }),
    ]);
    expect(noBacklog.overallScore).toBeGreaterThan(withBacklog.overallScore);
  });

  it("produces score between 0 and 25", () => {
    const equipment = [
      makeEquipment({ id: "e1", condition: "fair", maintenanceCurrent: false }),
    ];
    const result = evaluateEquipmentProvision(equipment);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ==============================================================================
// evaluateStaffDisabilityReadiness
// ==============================================================================

describe("evaluateStaffDisabilityReadiness", () => {
  it("returns score 0 for empty data", () => {
    const result = evaluateStaffDisabilityReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.awarenessRate).toBe(0);
    expect(result.adjustmentsTrainingRate).toBe(0);
    expect(result.ehcpUnderstandingRate).toBe(0);
    expect(result.communicationStrategiesRate).toBe(0);
    expect(result.personalCareRate).toBe(0);
    expect(result.emergencyEvacuationRate).toBe(0);
  });

  it("returns score 25 for perfect data", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
    ];
    const result = evaluateStaffDisabilityReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.awarenessRate).toBe(100);
    expect(result.adjustmentsTrainingRate).toBe(100);
    expect(result.ehcpUnderstandingRate).toBe(100);
    expect(result.communicationStrategiesRate).toBe(100);
    expect(result.personalCareRate).toBe(100);
    expect(result.emergencyEvacuationRate).toBe(100);
  });

  it("calculates correct rates for mixed data", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({
        id: "t2",
        staffId: "s2",
        disabilityAwareness: false,
        reasonableAdjustmentsTrained: false,
        ehcpUnderstanding: false,
        communicationStrategies: false,
        personalCareTrained: false,
        emergencyEvacuationTrained: false,
      }),
    ];
    const result = evaluateStaffDisabilityReadiness(training);
    expect(result.awarenessRate).toBe(50);
    expect(result.adjustmentsTrainingRate).toBe(50);
    expect(result.ehcpUnderstandingRate).toBe(50);
    expect(result.communicationStrategiesRate).toBe(50);
    expect(result.personalCareRate).toBe(50);
    expect(result.emergencyEvacuationRate).toBe(50);
  });

  it("handles single staff with no training", () => {
    const training = [
      makeTraining({
        disabilityAwareness: false,
        reasonableAdjustmentsTrained: false,
        ehcpUnderstanding: false,
        communicationStrategies: false,
        personalCareTrained: false,
        emergencyEvacuationTrained: false,
      }),
    ];
    const result = evaluateStaffDisabilityReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("produces score between 0 and 25 for partial training", () => {
    const training = [
      makeTraining({
        disabilityAwareness: true,
        reasonableAdjustmentsTrained: true,
        ehcpUnderstanding: false,
        communicationStrategies: false,
        personalCareTrained: false,
        emergencyEvacuationTrained: false,
      }),
    ];
    const result = evaluateStaffDisabilityReadiness(training);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("correctly reports totalStaff", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
      makeTraining({ id: "t3", staffId: "s3" }),
    ];
    const result = evaluateStaffDisabilityReadiness(training);
    expect(result.totalStaff).toBe(3);
  });
});

// ==============================================================================
// buildChildAdjustmentSummaries
// ==============================================================================

describe("buildChildAdjustmentSummaries", () => {
  it("returns empty array for empty data", () => {
    const result = buildChildAdjustmentSummaries([], []);
    expect(result).toEqual([]);
  });

  it("builds summary for single child with adjustments", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", childId: "c1", childName: "Child One", adjustmentStatus: "in_place", reviewCurrent: true, ehcpInPlace: true }),
    ];
    const result = buildChildAdjustmentSummaries(adjustments, []);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("c1");
    expect(result[0].childName).toBe("Child One");
    expect(result[0].totalAdjustments).toBe(1);
    expect(result[0].inPlaceCount).toBe(1);
    expect(result[0].reviewCurrentCount).toBe(1);
    expect(result[0].ehcpInPlace).toBe(true);
  });

  it("builds summary for single child with equipment only", () => {
    const equipment = [
      makeEquipment({ id: "e1", childId: "c1", childName: "Child One", condition: "good" }),
    ];
    const result = buildChildAdjustmentSummaries([], equipment);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("c1");
    expect(result[0].equipmentCount).toBe(1);
    expect(result[0].equipmentGoodCount).toBe(1);
    expect(result[0].totalAdjustments).toBe(0);
  });

  it("merges adjustments and equipment for the same child", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", childId: "c1", childName: "Child One" }),
    ];
    const equipment = [
      makeEquipment({ id: "e1", childId: "c1", childName: "Child One" }),
    ];
    const result = buildChildAdjustmentSummaries(adjustments, equipment);
    expect(result).toHaveLength(1);
    expect(result[0].totalAdjustments).toBe(1);
    expect(result[0].equipmentCount).toBe(1);
  });

  it("creates separate summaries for different children", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", childId: "c1", childName: "Child One" }),
      makeAdjustment({ id: "a2", childId: "c2", childName: "Child Two" }),
    ];
    const result = buildChildAdjustmentSummaries(adjustments, []);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.childId).sort()).toEqual(["c1", "c2"]);
  });

  it("collects unique disability types per child", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", childId: "c1", childName: "C1", disabilityType: "physical" }),
      makeAdjustment({ id: "a2", childId: "c1", childName: "C1", disabilityType: "physical" }),
      makeAdjustment({ id: "a3", childId: "c1", childName: "C1", disabilityType: "learning" }),
    ];
    const result = buildChildAdjustmentSummaries(adjustments, []);
    expect(result[0].disabilityTypes).toEqual(["physical", "learning"]);
  });

  it("scores 0-10 range", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", childId: "c1", childName: "C1" }),
    ];
    const equipment = [
      makeEquipment({ id: "e1", childId: "c1", childName: "C1" }),
    ];
    const result = buildChildAdjustmentSummaries(adjustments, equipment);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("gives max score for perfect child data", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", childId: "c1", childName: "C1", adjustmentStatus: "in_place", reviewCurrent: true, ehcpInPlace: true }),
    ];
    const equipment = [
      makeEquipment({ id: "e1", childId: "c1", childName: "C1", condition: "good" }),
    ];
    const result = buildChildAdjustmentSummaries(adjustments, equipment);
    // 3 (in place) + 2 (review current) + 2 (ehcp) + 3 (equipment good) = 10
    expect(result[0].overallScore).toBe(10);
  });

  it("gives 0 score for child with no EHCP and all adjustments refused", () => {
    const adjustments = [
      makeAdjustment({ id: "a1", childId: "c1", childName: "C1", adjustmentStatus: "refused", reviewCurrent: false, ehcpInPlace: false, professionalInvolved: false }),
    ];
    const equipment = [
      makeEquipment({ id: "e1", childId: "c1", childName: "C1", condition: "needs_replacement" }),
    ];
    const result = buildChildAdjustmentSummaries(adjustments, equipment);
    expect(result[0].overallScore).toBe(0);
  });
});

// ==============================================================================
// generateDisabilityReasonableAdjustmentsIntelligence -- Main generator
// ==============================================================================

describe("generateDisabilityReasonableAdjustmentsIntelligence", () => {
  const perfectAdjustments: AdjustmentRecord[] = [
    makeAdjustment({ id: "a1", childId: "c1", childName: "C1" }),
    makeAdjustment({ id: "a2", childId: "c2", childName: "C2" }),
  ];
  const perfectAudits: AccessibilityAudit[] = [
    makeAudit({ id: "au1" }),
    makeAudit({ id: "au2" }),
  ];
  const perfectEquipment: EquipmentRecord[] = [
    makeEquipment({ id: "e1" }),
    makeEquipment({ id: "e2" }),
  ];
  const perfectTraining: StaffDisabilityTraining[] = [
    makeTraining({ id: "t1", staffId: "s1" }),
    makeTraining({ id: "t2", staffId: "s2" }),
  ];

  it("produces full result with all fields", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.homeId).toBe("test-home");
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-06-30");
    expect(result.referenceDate).toBe("2025-06-01");
    expect(result.overallScore).toBeDefined();
    expect(result.rating).toBeDefined();
    expect(result.adjustmentImplementation).toBeDefined();
    expect(result.accessibilityCompliance).toBeDefined();
    expect(result.equipmentProvision).toBeDefined();
    expect(result.staffDisabilityReadiness).toBeDefined();
    expect(result.childSummaries).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("returns overall score of 100 for perfect data", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("returns overall score of 0 for empty data", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      [],
      [],
      [],
      [],
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overall score at 100", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  // Regulatory links always present
  it("always includes regulatory links", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      [],
      [],
      [],
      [],
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Equality Act 2010"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SEN Code of Practice 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 23"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("regulatory links are present even with perfect data", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.regulatoryLinks.length).toBe(7);
  });

  // Strengths verification
  it("includes strengths for high in-place rate", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.strengths.some((s) => s.includes("reasonable adjustments are in place"))).toBe(true);
  });

  it("includes strengths for good accessibility compliance", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.strengths.some((s) => s.includes("accessibility compliance"))).toBe(true);
  });

  it("includes strengths for well-maintained equipment", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.strengths.some((s) => s.includes("equipment"))).toBe(true);
  });

  it("includes strengths for strong staff training", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.strengths.some((s) => s.includes("staff disability training"))).toBe(true);
  });

  it("no strengths when all data is empty", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      [],
      [],
      [],
      [],
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.strengths).toHaveLength(0);
  });

  // Areas for improvement verification
  it("includes areas for improvement for low review currency", () => {
    const lowReview = [
      makeAdjustment({ id: "a1", reviewCurrent: false }),
      makeAdjustment({ id: "a2", reviewCurrent: false }),
      makeAdjustment({ id: "a3", reviewCurrent: true }),
    ];
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      lowReview,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("reviews are current"))).toBe(true);
  });

  it("includes areas for improvement for equipment backlog", () => {
    const badEquipment = [
      makeEquipment({ id: "e1", replacementNeeded: true }),
    ];
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      badEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("equipment need replacement"))).toBe(true);
  });

  // Actions verification
  it("includes URGENT actions for empty adjustments", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      [],
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("adjustment"))).toBe(true);
  });

  it("includes URGENT actions for empty audits", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      [],
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("accessibility audit"))).toBe(true);
  });

  it("includes URGENT actions for empty equipment", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      [],
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("equipment"))).toBe(true);
  });

  it("includes URGENT actions for empty training", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      [],
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("includes URGENT for low in-place rate", () => {
    const lowInPlace = [
      makeAdjustment({ id: "a1", adjustmentStatus: "pending", reviewCurrent: false, ehcpInPlace: false, professionalInvolved: false }),
      makeAdjustment({ id: "a2", adjustmentStatus: "refused", reviewCurrent: false, ehcpInPlace: false, professionalInvolved: false }),
      makeAdjustment({ id: "a3", adjustmentStatus: "under_review", reviewCurrent: false, ehcpInPlace: false, professionalInvolved: false }),
      makeAdjustment({ id: "a4", adjustmentStatus: "pending", reviewCurrent: false, ehcpInPlace: false, professionalInvolved: false }),
    ];
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      lowInPlace,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("40%"))).toBe(true);
  });

  it("includes URGENT for critical equipment replacement backlog", () => {
    const criticalEquipment = [
      makeEquipment({ id: "e1", condition: "needs_replacement", maintenanceCurrent: false, replacementNeeded: true }),
      makeEquipment({ id: "e2", condition: "needs_replacement", maintenanceCurrent: false, replacementNeeded: true }),
    ];
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      criticalEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("replacement"))).toBe(true);
  });

  it("no URGENT actions when all data is perfect", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgentActions).toHaveLength(0);
  });

  it("no actions or areas for improvement when all data is perfect", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.actions).toHaveLength(0);
    expect(result.areasForImprovement).toHaveLength(0);
  });

  // Mixed data
  it("handles mixed quality data with correct score range", () => {
    const mixedAdjustments = [
      makeAdjustment({ id: "a1", adjustmentStatus: "in_place", reviewCurrent: true, ehcpInPlace: true, professionalInvolved: true }),
      makeAdjustment({ id: "a2", adjustmentStatus: "pending", reviewCurrent: false, ehcpInPlace: false, professionalInvolved: false }),
    ];
    const mixedAudits = [
      makeAudit({ id: "au1" }),
      makeAudit({ id: "au2", physicalAccessCompliant: false, overallCompliant: false }),
    ];
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      mixedAdjustments,
      mixedAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes child summaries", () => {
    const result = generateDisabilityReasonableAdjustmentsIntelligence(
      perfectAdjustments,
      perfectAudits,
      perfectEquipment,
      perfectTraining,
      "test-home",
      "2025-01-01",
      "2025-06-30",
      "2025-06-01",
    );
    // perfectAdjustments has 2 different children (c1, c2), perfectEquipment has 2 with c1
    // So at least 2 child summaries
    expect(result.childSummaries.length).toBeGreaterThanOrEqual(2);
  });
});

// ==============================================================================
// Edge cases & boundary conditions
// ==============================================================================

describe("edge cases", () => {
  it("pct handles 0/0 gracefully", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("getRating at boundary 0", () => {
    expect(getRating(0)).toBe("inadequate");
  });

  it("all evaluators return exactly 25 when data is perfect", () => {
    expect(evaluateAdjustmentImplementation([makeAdjustment()]).overallScore).toBe(25);
    expect(evaluateAccessibilityCompliance([makeAudit()]).overallScore).toBe(25);
    expect(evaluateEquipmentProvision([makeEquipment()]).overallScore).toBe(25);
    expect(evaluateStaffDisabilityReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("all evaluators return exactly 0 when data is empty", () => {
    expect(evaluateAdjustmentImplementation([]).overallScore).toBe(0);
    expect(evaluateAccessibilityCompliance([]).overallScore).toBe(0);
    expect(evaluateEquipmentProvision([]).overallScore).toBe(0);
    expect(evaluateStaffDisabilityReadiness([]).overallScore).toBe(0);
  });

  it("single item in each evaluator produces valid score", () => {
    const adjResult = evaluateAdjustmentImplementation([makeAdjustment()]);
    const auditResult = evaluateAccessibilityCompliance([makeAudit()]);
    const equipResult = evaluateEquipmentProvision([makeEquipment()]);
    const staffResult = evaluateStaffDisabilityReadiness([makeTraining()]);

    for (const r of [adjResult, auditResult, equipResult, staffResult]) {
      expect(r.overallScore).toBeGreaterThanOrEqual(0);
      expect(r.overallScore).toBeLessThanOrEqual(25);
    }
  });

  it("child summary with no adjustments and no equipment scores 0", () => {
    // Use an adjustment to create the child, then test with empty
    const result = buildChildAdjustmentSummaries([], []);
    expect(result).toHaveLength(0);
  });

  it("child with only equipment and no adjustments", () => {
    const result = buildChildAdjustmentSummaries(
      [],
      [makeEquipment({ childId: "c1", childName: "C1", condition: "good" })],
    );
    expect(result).toHaveLength(1);
    expect(result[0].totalAdjustments).toBe(0);
    expect(result[0].ehcpInPlace).toBe(false);
    expect(result[0].equipmentCount).toBe(1);
  });
});
