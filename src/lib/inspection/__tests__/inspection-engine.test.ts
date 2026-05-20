import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getInspectionCategoryLabel,
  getInspectionOutcomeLabel,
  getRatingLabel,
  evaluateInspectionQuality,
  evaluateInspectionCompliance,
  evaluateInspectionPolicy,
  evaluateStaffInspectionReadiness,
  buildChildInspectionProfiles,
  generateInspectionIntelligence,
} from "../inspection-engine";
import type {
  InspectionRecord,
  InspectionPolicy,
  StaffInspectionTraining,
} from "../inspection-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<InspectionRecord> = {}): InspectionRecord {
  return {
    id: "rec-1",
    homeId: "oak-house",
    date: "2026-03-15",
    childId: "child-1",
    childName: "Test Child",
    category: "overall_effectiveness",
    outcome: "good",
    evidenceDocumented: true,
    actionPlanCreated: true,
    staffPrepared: true,
    childViewIncluded: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<InspectionPolicy> = {}): InspectionPolicy {
  return {
    inspectionReadinessPolicy: true,
    selfAssessmentFramework: true,
    actionPlanningProcedure: true,
    evidenceCollectionPolicy: true,
    notificationProtocol: true,
    staffPreparationGuidance: true,
    continuousImprovementPolicy: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffInspectionTraining> = {}): StaffInspectionTraining {
  return {
    staffId: "staff-1",
    inspectionReadiness: true,
    evidencePresentation: true,
    regulatoryKnowledge: true,
    selfAssessment: true,
    actionPlanDevelopment: true,
    qualityAssurance: true,
    ...overrides,
  };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => { expect(pct(5, 0)).toBe(0); });
  it("returns 100 for equal num and den", () => { expect(pct(10, 10)).toBe(100); });
  it("returns 50 for half", () => { expect(pct(5, 10)).toBe(50); });
  it("rounds to nearest integer", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
  it("returns 0 for 0 numerator", () => { expect(pct(0, 10)).toBe(0); });
});

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ── Label Helpers ──────────────────────────────────────────────────────────

describe("getInspectionCategoryLabel", () => {
  it("returns human-readable labels", () => {
    expect(getInspectionCategoryLabel("overall_effectiveness")).toBe("Overall Effectiveness");
    expect(getInspectionCategoryLabel("quality_of_care")).toBe("Quality of Care");
    expect(getInspectionCategoryLabel("safety_of_children")).toBe("Safety of Children");
    expect(getInspectionCategoryLabel("leadership_management")).toBe("Leadership & Management");
    expect(getInspectionCategoryLabel("outcomes_for_children")).toBe("Outcomes for Children");
    expect(getInspectionCategoryLabel("education_achievement")).toBe("Education & Achievement");
    expect(getInspectionCategoryLabel("health_wellbeing")).toBe("Health & Wellbeing");
    expect(getInspectionCategoryLabel("transitions_planning")).toBe("Transitions & Planning");
  });
});

describe("getInspectionOutcomeLabel", () => {
  it("returns human-readable labels", () => {
    expect(getInspectionOutcomeLabel("outstanding")).toBe("Outstanding");
    expect(getInspectionOutcomeLabel("good")).toBe("Good");
    expect(getInspectionOutcomeLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getInspectionOutcomeLabel("inadequate")).toBe("Inadequate");
    expect(getInspectionOutcomeLabel("not_yet_inspected")).toBe("Not Yet Inspected");
  });
});

describe("getRatingLabel", () => {
  it("formats rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
});

// ── Evaluator 1: Inspection Quality ────────────────────────────────────────

describe("evaluateInspectionQuality", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateInspectionQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalRecords).toBe(0);
    expect(result.evidenceDocumentedRate).toBe(0);
  });

  it("returns max score for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" })];
    const result = evaluateInspectionQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalRecords).toBe(2);
    expect(result.evidenceDocumentedRate).toBe(100);
    expect(result.actionPlanCreatedRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({ evidenceDocumented: false, actionPlanCreated: false, staffPrepared: false, childViewIncluded: false })];
    const result = evaluateInspectionQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("calculates mixed rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", evidenceDocumented: true, actionPlanCreated: false, staffPrepared: true, childViewIncluded: false }),
      makeRecord({ id: "r2", evidenceDocumented: true, actionPlanCreated: true, staffPrepared: false, childViewIncluded: false }),
    ];
    const result = evaluateInspectionQuality(records);
    expect(result.evidenceDocumentedRate).toBe(100);
    expect(result.actionPlanCreatedRate).toBe(50);
    expect(result.staffPreparedRate).toBe(50);
    expect(result.childViewIncludedRate).toBe(0);
  });

  it("applies correct weights (7+6+6+6=25)", () => {
    const records = [makeRecord({ actionPlanCreated: false, staffPrepared: false, childViewIncluded: false })];
    const result = evaluateInspectionQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("caps score at 25", () => {
    const result = evaluateInspectionQuality([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── Evaluator 2: Inspection Compliance ─────────────────────────────────────

describe("evaluateInspectionCompliance", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateInspectionCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.documentationRate).toBe(0);
  });

  it("calculates documentation and timely rates", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "r2", documentationComplete: true, timelyRecording: false }),
      makeRecord({ id: "r3", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluateInspectionCompliance(records);
    expect(result.documentationRate).toBe(67);
    expect(result.timelyRecordingRate).toBe(33);
  });

  it("calculates category diversity correctly", () => {
    const records = [makeRecord({ category: "overall_effectiveness" })];
    const result = evaluateInspectionCompliance(records);
    expect(result.categoryDiversityRatio).toBe(13);
  });

  it("returns high diversity for many categories", () => {
    const categories: Array<InspectionRecord["category"]> = [
      "overall_effectiveness", "quality_of_care", "safety_of_children", "leadership_management",
      "outcomes_for_children", "education_achievement", "health_wellbeing", "transitions_planning",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateInspectionCompliance(records);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("applies correct weights (8+7+5+5=25)", () => {
    const categories: Array<InspectionRecord["category"]> = [
      "overall_effectiveness", "quality_of_care", "safety_of_children", "leadership_management",
      "outcomes_for_children", "education_achievement", "health_wellbeing", "transitions_planning",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateInspectionCompliance(records);
    expect(result.overallScore).toBe(25);
  });
});

// ── Evaluator 3: Inspection Policy ─────────────────────────────────────────

describe("evaluateInspectionPolicy", () => {
  it("returns zeros for null policy", () => {
    const result = evaluateInspectionPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.inspectionReadinessPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateInspectionPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateInspectionPolicy(makePolicy({
      inspectionReadinessPolicy: false, selfAssessmentFramework: false, actionPlanningProcedure: false,
      evidenceCollectionPolicy: false, notificationProtocol: false, staffPreparationGuidance: false, continuousImprovementPolicy: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("weights first 4 at 4 points each", () => {
    const result = evaluateInspectionPolicy(makePolicy({
      inspectionReadinessPolicy: true, selfAssessmentFramework: false, actionPlanningProcedure: false,
      evidenceCollectionPolicy: false, notificationProtocol: false, staffPreparationGuidance: false, continuousImprovementPolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    const result = evaluateInspectionPolicy(makePolicy({
      inspectionReadinessPolicy: false, selfAssessmentFramework: false, actionPlanningProcedure: false,
      evidenceCollectionPolicy: false, notificationProtocol: true, staffPreparationGuidance: true, continuousImprovementPolicy: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("handles partial policy (first 4 only = 16)", () => {
    const result = evaluateInspectionPolicy(makePolicy({
      notificationProtocol: false, staffPreparationGuidance: false, continuousImprovementPolicy: false,
    }));
    expect(result.overallScore).toBe(16);
    expect(result.rating).toBe("good");
  });

  it("preserves boolean values in result", () => {
    const result = evaluateInspectionPolicy(makePolicy({ inspectionReadinessPolicy: true, selfAssessmentFramework: false }));
    expect(result.inspectionReadinessPolicy).toBe(true);
    expect(result.selfAssessmentFramework).toBe(false);
  });
});

// ── Evaluator 4: Staff Readiness ───────────────────────────────────────────

describe("evaluateStaffInspectionReadiness", () => {
  it("returns zeros for empty staff", () => {
    const result = evaluateStaffInspectionReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score for all-true staff", () => {
    const staff = [makeTraining(), makeTraining({ staffId: "staff-2" })];
    const result = evaluateStaffInspectionReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeTraining({
      inspectionReadiness: false, evidencePresentation: false, regulatoryKnowledge: false,
      selfAssessment: false, actionPlanDevelopment: false, qualityAssurance: false,
    })];
    const result = evaluateStaffInspectionReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weights (6+5+5+4+3+2=25)", () => {
    const staff = [makeTraining({
      evidencePresentation: false, regulatoryKnowledge: false, selfAssessment: false,
      actionPlanDevelopment: false, qualityAssurance: false,
    })];
    const result = evaluateStaffInspectionReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("only qualityAssurance true gives weight-2 score", () => {
    const staff = [makeTraining({
      inspectionReadiness: false, evidencePresentation: false, regulatoryKnowledge: false,
      selfAssessment: false, actionPlanDevelopment: false, qualityAssurance: true,
    })];
    const result = evaluateStaffInspectionReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("calculates mixed rates correctly", () => {
    const staff = [
      makeTraining({ staffId: "s1", inspectionReadiness: true, evidencePresentation: true, regulatoryKnowledge: false, selfAssessment: false, actionPlanDevelopment: false, qualityAssurance: false }),
      makeTraining({ staffId: "s2", inspectionReadiness: true, evidencePresentation: false, regulatoryKnowledge: true, selfAssessment: false, actionPlanDevelopment: false, qualityAssurance: false }),
    ];
    const result = evaluateStaffInspectionReadiness(staff);
    expect(result.inspectionReadinessRate).toBe(100);
    expect(result.evidencePresentationRate).toBe(50);
    expect(result.regulatoryKnowledgeRate).toBe(50);
  });
});

// ── Child Profiles ─────────────────────────────────────────────────────────

describe("buildChildInspectionProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildInspectionProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildInspectionProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "c1")?.totalRecords).toBe(2);
  });

  it("scores frequency: >=10 gives 2, >=5 gives 1, <5 gives 0", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", evidenceDocumented: false, childViewIncluded: false }),
    );
    const profiles = buildChildInspectionProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores rate1 (evidenceDocumentedRate): >=80 gives 3", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", evidenceDocumented: i < 4, childViewIncluded: false }),
    );
    const profiles = buildChildInspectionProfiles(recs);
    // freq=1, rate1(80%)=3, rate2(0%)=0, diversity(1)=0 -> 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("scores diversity: >=4 gives 2, >=2 gives 1", () => {
    const categories: Array<InspectionRecord["category"]> = [
      "overall_effectiveness", "quality_of_care", "safety_of_children", "leadership_management",
    ];
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: cat, evidenceDocumented: false, childViewIncluded: false }),
    );
    const profiles = buildChildInspectionProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("caps at 10", () => {
    const categories: Array<InspectionRecord["category"]> = [
      "overall_effectiveness", "quality_of_care", "safety_of_children", "leadership_management",
    ];
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: categories[i % 4] }),
    );
    const profiles = buildChildInspectionProfiles(recs);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("2 categories gives diversity 1", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", category: "overall_effectiveness", evidenceDocumented: false, childViewIncluded: false }),
      makeRecord({ id: "r2", childId: "c1", category: "quality_of_care", evidenceDocumented: false, childViewIncluded: false }),
    ];
    const profiles = buildChildInspectionProfiles(recs);
    expect(profiles[0].overallScore).toBe(1);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });
});

// ── Additional Quality Edge Cases ──────────────────────────────────────────

describe("evaluateInspectionQuality — additional", () => {
  it("single record with only evidenceDocumented true gives weight-7 score", () => {
    const records = [makeRecord({ actionPlanCreated: false, staffPrepared: false, childViewIncluded: false })];
    const result = evaluateInspectionQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("handles large record sets", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `r-${i}`, evidenceDocumented: i % 2 === 0 }),
    );
    const result = evaluateInspectionQuality(records);
    expect(result.evidenceDocumentedRate).toBe(50);
    expect(result.totalRecords).toBe(100);
  });

  it("rating maps correctly for low score", () => {
    const records = [makeRecord({ evidenceDocumented: false, actionPlanCreated: false, staffPrepared: false, childViewIncluded: false })];
    const result = evaluateInspectionQuality(records);
    expect(result.rating).toBe("inadequate");
  });
});

// ── Additional Compliance Edge Cases ──────────────────────────────────────

describe("evaluateInspectionCompliance — additional", () => {
  it("two categories gives 25% diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "overall_effectiveness" }),
      makeRecord({ id: "r2", category: "quality_of_care" }),
    ];
    const result = evaluateInspectionCompliance(records);
    expect(result.categoryDiversityRatio).toBe(25);
  });

  it("all compliance false with single category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, childViewIncluded: false })];
    const result = evaluateInspectionCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.overallScore).toBe(1); // only diversity 13% x 5 = 0.65 -> 1
  });
});

// ── Additional Policy Edge Cases ──────────────────────────────────────────

describe("evaluateInspectionPolicy — additional", () => {
  it("single middle policy gives 4 points", () => {
    const result = evaluateInspectionPolicy(makePolicy({
      inspectionReadinessPolicy: false, selfAssessmentFramework: false, actionPlanningProcedure: true,
      evidenceCollectionPolicy: false, notificationProtocol: false, staffPreparationGuidance: false, continuousImprovementPolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("rating for score 9 gives inadequate", () => {
    const result = evaluateInspectionPolicy(makePolicy({
      inspectionReadinessPolicy: false, selfAssessmentFramework: false, actionPlanningProcedure: false,
      evidenceCollectionPolicy: false, notificationProtocol: true, staffPreparationGuidance: true, continuousImprovementPolicy: true,
    }));
    expect(result.overallScore).toBe(9);
    expect(result.rating).toBe("inadequate");
  });
});

// ── Additional Staff Edge Cases ───────────────────────────────────────────

describe("evaluateStaffInspectionReadiness — additional", () => {
  it("3 staff with mixed skills", () => {
    const staff = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2", inspectionReadiness: false, evidencePresentation: false }),
      makeTraining({ staffId: "s3", regulatoryKnowledge: false, selfAssessment: false, actionPlanDevelopment: false, qualityAssurance: false }),
    ];
    const result = evaluateStaffInspectionReadiness(staff);
    expect(result.totalStaff).toBe(3);
    expect(result.inspectionReadinessRate).toBe(67);
  });
});

// ── Additional Child Profile Edge Cases ───────────────────────────────────

describe("buildChildInspectionProfiles — additional", () => {
  it("rate2 childViewIncludedRate 60% gives 2 points", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", evidenceDocumented: false, childViewIncluded: i < 3 }),
    );
    const profiles = buildChildInspectionProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(60%)=2, diversity(1)=0 -> 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("preserves child name from first record", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex Updated" }),
    ];
    const profiles = buildChildInspectionProfiles(recs);
    expect(profiles[0].childName).toBe("Alex");
  });

  it("rate1 40% gives 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", evidenceDocumented: i < 2, childViewIncluded: false }),
    );
    const profiles = buildChildInspectionProfiles(recs);
    // freq=1, rate1(40%)=1, rate2(0%)=0, diversity(1)=0 -> 2
    expect(profiles[0].overallScore).toBe(2);
  });
});

// ── Master Generator ───────────────────────────────────────────────────────

describe("generateInspectionIntelligence", () => {
  it("returns correct structure with all data", () => {
    const result = generateInspectionIntelligence([makeRecord()], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.inspectionQuality).toBeDefined();
    expect(result.inspectionCompliance).toBeDefined();
    expect(result.inspectionPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("sums 4 evaluator scores", () => {
    const result = generateInspectionIntelligence([makeRecord()], makePolicy(), [makeTraining()], "h", "s", "e");
    const expectedTotal = result.inspectionQuality.overallScore + result.inspectionCompliance.overallScore + result.inspectionPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedTotal));
  });

  it("caps overall score at 100", () => {
    const result = generateInspectionIntelligence([makeRecord()], makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns inadequate for empty data", () => {
    const result = generateInspectionIntelligence([], null, [], "h", "s", "e");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for metrics >= 80%", () => {
    const categories: Array<InspectionRecord["category"]> = [
      "overall_effectiveness", "quality_of_care", "safety_of_children", "leadership_management",
      "outcomes_for_children", "education_achievement", "health_wellbeing", "transitions_planning",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateInspectionIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low metrics", () => {
    const records = [makeRecord({
      evidenceDocumented: false, actionPlanCreated: false, staffPrepared: false,
      childViewIncluded: false, documentationComplete: false, timelyRecording: false,
    })];
    const result = generateInspectionIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateInspectionIntelligence([makeRecord()], null, [makeTraining()], "h", "s", "e");
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions when staff is empty", () => {
    const result = generateInspectionIntelligence([makeRecord()], makePolicy(), [], "h", "s", "e");
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
    ];
    const result = generateInspectionIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.childProfiles).toHaveLength(2);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateInspectionIntelligence([], null, [], "h", "s", "e");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Reg 45");
  });

  it("no areas for improvement when all metrics high", () => {
    const categories: Array<InspectionRecord["category"]> = [
      "overall_effectiveness", "quality_of_care", "safety_of_children", "leadership_management",
      "outcomes_for_children", "education_achievement", "health_wellbeing", "transitions_planning",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateInspectionIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("empty childProfiles when no records", () => {
    const result = generateInspectionIntelligence([], makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.childProfiles).toHaveLength(0);
  });

  it("returns outstanding for fully compliant data", () => {
    const categories: Array<InspectionRecord["category"]> = [
      "overall_effectiveness", "quality_of_care", "safety_of_children", "leadership_management",
      "outcomes_for_children", "education_achievement", "health_wellbeing", "transitions_planning",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateInspectionIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBe(100);
  });

  it("generates actions for low metrics (<50%)", () => {
    const records = [makeRecord({
      evidenceDocumented: false, actionPlanCreated: false, childViewIncluded: false,
      documentationComplete: false, timelyRecording: false,
    })];
    const staff = [makeTraining({ regulatoryKnowledge: false })];
    const result = generateInspectionIntelligence(records, makePolicy(), staff, "h", "s", "e");
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("no strengths when all metrics are low", () => {
    const records = [makeRecord({
      evidenceDocumented: false, actionPlanCreated: false, staffPrepared: false,
      childViewIncluded: false, documentationComplete: false, timelyRecording: false,
    })];
    const staff = [makeTraining({
      inspectionReadiness: false, evidencePresentation: false, regulatoryKnowledge: false,
      selfAssessment: false, actionPlanDevelopment: false, qualityAssurance: false,
    })];
    const result = generateInspectionIntelligence(records, null, staff, "h", "s", "e");
    expect(result.strengths).toHaveLength(0);
  });

  it("handles mixed children and categories in profiles", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex", category: "overall_effectiveness" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex", category: "quality_of_care" }),
      makeRecord({ id: "r3", childId: "c2", childName: "Jordan", category: "safety_of_children" }),
    ];
    const result = generateInspectionIntelligence(records, makePolicy(), [makeTraining()], "h", "s", "e");
    expect(result.childProfiles).toHaveLength(2);
    const alex = result.childProfiles.find(p => p.childId === "c1");
    expect(alex?.categoriesCovered).toHaveLength(2);
  });
});
