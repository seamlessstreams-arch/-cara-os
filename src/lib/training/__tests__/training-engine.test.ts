import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getTrainingCategoryLabel,
  getTrainingOutcomeLabel,
  getRatingLabel,
  evaluateTrainingQuality,
  evaluateTrainingCompliance,
  evaluateTrainingPolicy,
  evaluateStaffTrainingReadiness,
  buildStaffTrainingProfiles,
  generateTrainingIntelligence,
} from "../training-engine";
import type {
  TrainingRecord,
  TrainingPolicy,
  StaffTrainingCompetency,
} from "../training-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return {
    id: "rec-1",
    homeId: "oak-house",
    date: "2026-03-15",
    staffId: "staff-1",
    staffName: "Test Staff",
    category: "safeguarding",
    outcome: "completed",
    completedOnTime: true,
    assessmentPassed: true,
    practicalComponentDone: true,
    certificateObtained: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<TrainingPolicy> = {}): TrainingPolicy {
  return {
    mandatoryTrainingPolicy: true,
    trainingNeedsAnalysis: true,
    refresherSchedulePolicy: true,
    inductionTrainingFramework: true,
    trainingRecordKeeping: true,
    externalTrainingApproval: true,
    trainingBudgetPolicy: true,
    ...overrides,
  };
}

function makeCompetency(overrides: Partial<StaffTrainingCompetency> = {}): StaffTrainingCompetency {
  return {
    staffId: "staff-1",
    trainingNeedsAssessment: true,
    deliverySkills: true,
    complianceMonitoring: true,
    recordManagement: true,
    qualityAssurance: true,
    budgetManagement: true,
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

describe("getTrainingCategoryLabel", () => {
  it("returns human-readable labels", () => {
    expect(getTrainingCategoryLabel("safeguarding")).toBe("Safeguarding");
    expect(getTrainingCategoryLabel("first_aid")).toBe("First Aid");
    expect(getTrainingCategoryLabel("restraint_techniques")).toBe("Restraint Techniques");
    expect(getTrainingCategoryLabel("medication_management")).toBe("Medication Management");
    expect(getTrainingCategoryLabel("fire_safety")).toBe("Fire Safety");
    expect(getTrainingCategoryLabel("health_and_safety")).toBe("Health and Safety");
    expect(getTrainingCategoryLabel("equality_diversity")).toBe("Equality Diversity");
    expect(getTrainingCategoryLabel("therapeutic_care")).toBe("Therapeutic Care");
  });
});

describe("getTrainingOutcomeLabel", () => {
  it("returns human-readable labels", () => {
    expect(getTrainingOutcomeLabel("completed")).toBe("Completed");
    expect(getTrainingOutcomeLabel("in_progress")).toBe("In Progress");
    expect(getTrainingOutcomeLabel("expired")).toBe("Expired");
    expect(getTrainingOutcomeLabel("not_started")).toBe("Not Started");
    expect(getTrainingOutcomeLabel("exempt")).toBe("Exempt");
  });
});

describe("getRatingLabel", () => {
  it("formats rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
});

// ── Evaluator 1: Training Quality ──────────────────────────────────────────

describe("evaluateTrainingQuality", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateTrainingQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalRecords).toBe(0);
    expect(result.completedOnTimeRate).toBe(0);
  });

  it("returns max score for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" })];
    const result = evaluateTrainingQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalRecords).toBe(2);
    expect(result.completedOnTimeRate).toBe(100);
    expect(result.assessmentPassedRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({ completedOnTime: false, assessmentPassed: false, practicalComponentDone: false, certificateObtained: false })];
    const result = evaluateTrainingQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("calculates mixed rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", completedOnTime: true, assessmentPassed: false, practicalComponentDone: true, certificateObtained: false }),
      makeRecord({ id: "r2", completedOnTime: true, assessmentPassed: true, practicalComponentDone: false, certificateObtained: false }),
    ];
    const result = evaluateTrainingQuality(records);
    expect(result.completedOnTimeRate).toBe(100);
    expect(result.assessmentPassedRate).toBe(50);
    expect(result.practicalComponentDoneRate).toBe(50);
    expect(result.certificateObtainedRate).toBe(0);
  });

  it("applies correct weights (7+6+6+6=25)", () => {
    const records = [makeRecord({ assessmentPassed: false, practicalComponentDone: false, certificateObtained: false })];
    const result = evaluateTrainingQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("caps score at 25", () => {
    const result = evaluateTrainingQuality([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── Evaluator 2: Training Compliance ───────────────────────────────────────

describe("evaluateTrainingCompliance", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateTrainingCompliance([]);
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
    const result = evaluateTrainingCompliance(records);
    expect(result.documentationRate).toBe(67);
    expect(result.timelyRecordingRate).toBe(33);
  });

  it("calculates category diversity correctly", () => {
    const records = [makeRecord({ category: "safeguarding" })];
    const result = evaluateTrainingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(13);
  });

  it("returns high diversity for many categories", () => {
    const categories: Array<TrainingRecord["category"]> = [
      "safeguarding", "first_aid", "restraint_techniques", "medication_management",
      "fire_safety", "health_and_safety", "equality_diversity", "therapeutic_care",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateTrainingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("applies correct weights (8+7+5+5=25)", () => {
    const categories: Array<TrainingRecord["category"]> = [
      "safeguarding", "first_aid", "restraint_techniques", "medication_management",
      "fire_safety", "health_and_safety", "equality_diversity", "therapeutic_care",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateTrainingCompliance(records);
    expect(result.overallScore).toBe(25);
  });
});

// ── Evaluator 3: Training Policy ───────────────────────────────────────────

describe("evaluateTrainingPolicy", () => {
  it("returns zeros for null policy", () => {
    const result = evaluateTrainingPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.mandatoryTrainingPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateTrainingPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateTrainingPolicy(makePolicy({
      mandatoryTrainingPolicy: false, trainingNeedsAnalysis: false, refresherSchedulePolicy: false,
      inductionTrainingFramework: false, trainingRecordKeeping: false, externalTrainingApproval: false, trainingBudgetPolicy: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("weights first 4 at 4 points each", () => {
    const result = evaluateTrainingPolicy(makePolicy({
      mandatoryTrainingPolicy: true, trainingNeedsAnalysis: false, refresherSchedulePolicy: false,
      inductionTrainingFramework: false, trainingRecordKeeping: false, externalTrainingApproval: false, trainingBudgetPolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    const result = evaluateTrainingPolicy(makePolicy({
      mandatoryTrainingPolicy: false, trainingNeedsAnalysis: false, refresherSchedulePolicy: false,
      inductionTrainingFramework: false, trainingRecordKeeping: true, externalTrainingApproval: true, trainingBudgetPolicy: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("handles partial policy (first 4 only = 16)", () => {
    const result = evaluateTrainingPolicy(makePolicy({
      trainingRecordKeeping: false, externalTrainingApproval: false, trainingBudgetPolicy: false,
    }));
    expect(result.overallScore).toBe(16);
    expect(result.rating).toBe("good");
  });

  it("preserves boolean values in result", () => {
    const result = evaluateTrainingPolicy(makePolicy({ mandatoryTrainingPolicy: true, trainingNeedsAnalysis: false }));
    expect(result.mandatoryTrainingPolicy).toBe(true);
    expect(result.trainingNeedsAnalysis).toBe(false);
  });
});

// ── Evaluator 4: Staff Training Readiness ──────────────────────────────────

describe("evaluateStaffTrainingReadiness", () => {
  it("returns zeros for empty staff", () => {
    const result = evaluateStaffTrainingReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score for all-true staff", () => {
    const staff = [makeCompetency(), makeCompetency({ staffId: "staff-2" })];
    const result = evaluateStaffTrainingReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeCompetency({
      trainingNeedsAssessment: false, deliverySkills: false, complianceMonitoring: false,
      recordManagement: false, qualityAssurance: false, budgetManagement: false,
    })];
    const result = evaluateStaffTrainingReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weights (6+5+5+4+3+2=25)", () => {
    const staff = [makeCompetency({
      deliverySkills: false, complianceMonitoring: false, recordManagement: false,
      qualityAssurance: false, budgetManagement: false,
    })];
    const result = evaluateStaffTrainingReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("only budgetManagement true gives weight-2 score", () => {
    const staff = [makeCompetency({
      trainingNeedsAssessment: false, deliverySkills: false, complianceMonitoring: false,
      recordManagement: false, qualityAssurance: false, budgetManagement: true,
    })];
    const result = evaluateStaffTrainingReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("calculates mixed rates correctly", () => {
    const staff = [
      makeCompetency({ staffId: "s1", trainingNeedsAssessment: true, deliverySkills: true, complianceMonitoring: false, recordManagement: false, qualityAssurance: false, budgetManagement: false }),
      makeCompetency({ staffId: "s2", trainingNeedsAssessment: true, deliverySkills: false, complianceMonitoring: true, recordManagement: false, qualityAssurance: false, budgetManagement: false }),
    ];
    const result = evaluateStaffTrainingReadiness(staff);
    expect(result.trainingNeedsAssessmentRate).toBe(100);
    expect(result.deliverySkillsRate).toBe(50);
    expect(result.complianceMonitoringRate).toBe(50);
  });
});

// ── Staff Profiles ─────────────────────────────────────────────────────────

describe("buildStaffTrainingProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildStaffTrainingProfiles([])).toEqual([]);
  });

  it("groups by staffId", () => {
    const records = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s2", staffName: "Tom" }),
      makeRecord({ id: "r3", staffId: "s1", staffName: "Sarah" }),
    ];
    const profiles = buildStaffTrainingProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.staffId === "s1")?.totalRecords).toBe(2);
  });

  it("scores frequency: >=10 gives 2, >=5 gives 1, <5 gives 0", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", completedOnTime: false, assessmentPassed: false }),
    );
    const profiles = buildStaffTrainingProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores rate1 (completedOnTimeRate): >=80 gives 3", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", completedOnTime: i < 4, assessmentPassed: false }),
    );
    const profiles = buildStaffTrainingProfiles(recs);
    // freq=1, rate1(80%)=3, rate2(0%)=0, diversity(1)=0 = 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("scores diversity: >=4 gives 2, >=2 gives 1", () => {
    const categories: Array<TrainingRecord["category"]> = [
      "safeguarding", "first_aid", "restraint_techniques", "medication_management",
    ];
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", category: cat, completedOnTime: false, assessmentPassed: false }),
    );
    const profiles = buildStaffTrainingProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("caps at 10", () => {
    const categories: Array<TrainingRecord["category"]> = [
      "safeguarding", "first_aid", "restraint_techniques", "medication_management",
    ];
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", category: categories[i % 4] }),
    );
    const profiles = buildStaffTrainingProfiles(recs);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("2 categories gives diversity 1", () => {
    const recs = [
      makeRecord({ id: "r1", staffId: "s1", category: "safeguarding", completedOnTime: false, assessmentPassed: false }),
      makeRecord({ id: "r2", staffId: "s1", category: "first_aid", completedOnTime: false, assessmentPassed: false }),
    ];
    const profiles = buildStaffTrainingProfiles(recs);
    expect(profiles[0].overallScore).toBe(1);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });
});

// ── Additional Quality Edge Cases ──────────────────────────────────────────

describe("evaluateTrainingQuality — additional", () => {
  it("single record with only completedOnTime true gives weight-7 score", () => {
    const records = [makeRecord({ assessmentPassed: false, practicalComponentDone: false, certificateObtained: false })];
    const result = evaluateTrainingQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("handles large record sets", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `r-${i}`, completedOnTime: i % 2 === 0 }),
    );
    const result = evaluateTrainingQuality(records);
    expect(result.completedOnTimeRate).toBe(50);
    expect(result.totalRecords).toBe(100);
  });

  it("rating maps correctly for low score", () => {
    const records = [makeRecord({ completedOnTime: false, assessmentPassed: false, practicalComponentDone: false, certificateObtained: false })];
    const result = evaluateTrainingQuality(records);
    expect(result.rating).toBe("inadequate");
  });
});

// ── Additional Compliance Edge Cases ──────────────────────────────────────

describe("evaluateTrainingCompliance — additional", () => {
  it("two categories gives 25% diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "safeguarding" }),
      makeRecord({ id: "r2", category: "first_aid" }),
    ];
    const result = evaluateTrainingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(25);
  });

  it("all compliance false with single category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, completedOnTime: false })];
    const result = evaluateTrainingCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.overallScore).toBe(1); // only diversity 13% x 5 = 0.65 -> 1
  });
});

// ── Additional Policy Edge Cases ──────────────────────────────────────────

describe("evaluateTrainingPolicy — additional", () => {
  it("single middle policy gives 4 points", () => {
    const result = evaluateTrainingPolicy(makePolicy({
      mandatoryTrainingPolicy: false, trainingNeedsAnalysis: false, refresherSchedulePolicy: true,
      inductionTrainingFramework: false, trainingRecordKeeping: false, externalTrainingApproval: false, trainingBudgetPolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("rating for score 9 -> 36 -> inadequate", () => {
    const result = evaluateTrainingPolicy(makePolicy({
      mandatoryTrainingPolicy: false, trainingNeedsAnalysis: false, refresherSchedulePolicy: false,
      inductionTrainingFramework: false, trainingRecordKeeping: true, externalTrainingApproval: true, trainingBudgetPolicy: true,
    }));
    expect(result.overallScore).toBe(9);
    expect(result.rating).toBe("inadequate");
  });
});

// ── Additional Staff Readiness Edge Cases ─────────────────────────────────

describe("evaluateStaffTrainingReadiness — additional", () => {
  it("3 staff with mixed skills", () => {
    const staff = [
      makeCompetency({ staffId: "s1" }),
      makeCompetency({ staffId: "s2", trainingNeedsAssessment: false, deliverySkills: false }),
      makeCompetency({ staffId: "s3", complianceMonitoring: false, recordManagement: false, qualityAssurance: false, budgetManagement: false }),
    ];
    const result = evaluateStaffTrainingReadiness(staff);
    expect(result.totalStaff).toBe(3);
    expect(result.trainingNeedsAssessmentRate).toBe(67);
  });
});

// ── Additional Staff Profile Edge Cases ───────────────────────────────────

describe("buildStaffTrainingProfiles — additional", () => {
  it("rate2 assessmentPassedRate 60% gives 2 points", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", completedOnTime: false, assessmentPassed: i < 3 }),
    );
    const profiles = buildStaffTrainingProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(60%)=2, diversity(1)=0 = 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("preserves staff name from first record", () => {
    const recs = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s1", staffName: "Sarah Updated" }),
    ];
    const profiles = buildStaffTrainingProfiles(recs);
    expect(profiles[0].staffName).toBe("Sarah");
  });

  it("rate1 40% gives 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", completedOnTime: i < 2, assessmentPassed: false }),
    );
    const profiles = buildStaffTrainingProfiles(recs);
    // freq=1, rate1(40%)=1, rate2(0%)=0, diversity(1)=0 = 2
    expect(profiles[0].overallScore).toBe(2);
  });
});

// ── Master Generator ───────────────────────────────────────────────────────

describe("generateTrainingIntelligence", () => {
  it("returns correct structure with all data", () => {
    const result = generateTrainingIntelligence([makeRecord()], makePolicy(), [makeCompetency()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.trainingQuality).toBeDefined();
    expect(result.trainingCompliance).toBeDefined();
    expect(result.trainingPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.staffProfiles).toBeDefined();
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("sums 4 evaluator scores", () => {
    const result = generateTrainingIntelligence([makeRecord()], makePolicy(), [makeCompetency()], "h", "s", "e");
    const expectedTotal = result.trainingQuality.overallScore + result.trainingCompliance.overallScore + result.trainingPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedTotal));
  });

  it("caps overall score at 100", () => {
    const result = generateTrainingIntelligence([makeRecord()], makePolicy(), [makeCompetency()], "h", "s", "e");
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns inadequate for empty data", () => {
    const result = generateTrainingIntelligence([], null, [], "h", "s", "e");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for metrics >= 80%", () => {
    const categories: Array<TrainingRecord["category"]> = [
      "safeguarding", "first_aid", "restraint_techniques", "medication_management",
      "fire_safety", "health_and_safety", "equality_diversity", "therapeutic_care",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateTrainingIntelligence(records, makePolicy(), [makeCompetency()], "h", "s", "e");
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low metrics", () => {
    const records = [makeRecord({
      completedOnTime: false, assessmentPassed: false, practicalComponentDone: false,
      certificateObtained: false, documentationComplete: false, timelyRecording: false,
    })];
    const result = generateTrainingIntelligence(records, makePolicy(), [makeCompetency()], "h", "s", "e");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateTrainingIntelligence([makeRecord()], null, [makeCompetency()], "h", "s", "e");
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions when staff is empty", () => {
    const result = generateTrainingIntelligence([makeRecord()], makePolicy(), [], "h", "s", "e");
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("builds staff profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s2", staffName: "Tom" }),
    ];
    const result = generateTrainingIntelligence(records, makePolicy(), [makeCompetency()], "h", "s", "e");
    expect(result.staffProfiles).toHaveLength(2);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateTrainingIntelligence([], null, [], "h", "s", "e");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Reg 31");
  });

  it("no areas for improvement when all metrics high", () => {
    const categories: Array<TrainingRecord["category"]> = [
      "safeguarding", "first_aid", "restraint_techniques", "medication_management",
      "fire_safety", "health_and_safety", "equality_diversity", "therapeutic_care",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateTrainingIntelligence(records, makePolicy(), [makeCompetency()], "h", "s", "e");
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("empty staffProfiles when no records", () => {
    const result = generateTrainingIntelligence([], makePolicy(), [makeCompetency()], "h", "s", "e");
    expect(result.staffProfiles).toHaveLength(0);
  });

  it("returns outstanding for fully compliant data", () => {
    const categories: Array<TrainingRecord["category"]> = [
      "safeguarding", "first_aid", "restraint_techniques", "medication_management",
      "fire_safety", "health_and_safety", "equality_diversity", "therapeutic_care",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateTrainingIntelligence(records, makePolicy(), [makeCompetency()], "h", "s", "e");
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBe(100);
  });

  it("generates actions for low metrics (<50%)", () => {
    const records = [makeRecord({
      completedOnTime: false, assessmentPassed: false, certificateObtained: false,
      documentationComplete: false, timelyRecording: false,
    })];
    const staff = [makeCompetency({ complianceMonitoring: false })];
    const result = generateTrainingIntelligence(records, makePolicy(), staff, "h", "s", "e");
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("no strengths when all metrics are low", () => {
    const records = [makeRecord({
      completedOnTime: false, assessmentPassed: false, practicalComponentDone: false,
      certificateObtained: false, documentationComplete: false, timelyRecording: false,
    })];
    const staff = [makeCompetency({
      trainingNeedsAssessment: false, deliverySkills: false, complianceMonitoring: false,
      recordManagement: false, qualityAssurance: false, budgetManagement: false,
    })];
    const result = generateTrainingIntelligence(records, null, staff, "h", "s", "e");
    expect(result.strengths).toHaveLength(0);
  });

  it("handles mixed staff and categories in profiles", () => {
    const records = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah", category: "safeguarding" }),
      makeRecord({ id: "r2", staffId: "s1", staffName: "Sarah", category: "first_aid" }),
      makeRecord({ id: "r3", staffId: "s2", staffName: "Tom", category: "fire_safety" }),
    ];
    const result = generateTrainingIntelligence(records, makePolicy(), [makeCompetency()], "h", "s", "e");
    expect(result.staffProfiles).toHaveLength(2);
    const sarah = result.staffProfiles.find(p => p.staffId === "s1");
    expect(sarah?.categoriesCovered).toHaveLength(2);
  });
});
