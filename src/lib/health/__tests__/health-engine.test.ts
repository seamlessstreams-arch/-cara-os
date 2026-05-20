/* ──────────────────────────────────────────────────────────────
   Health Intelligence Engine — Tests
   ────────────────────────────────────────────────────────────── */

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getAssessmentTypeLabel,
  getOutcomeLabel,
  getRatingLabel,
  evaluateHealthQuality,
  evaluateHealthCompliance,
  evaluateHealthPolicy,
  evaluateStaffHealthReadiness,
  buildChildHealthProfiles,
  generateHealthIntelligence,
} from "../health-engine";
import type {
  HealthRecord,
  HealthPolicy,
  StaffHealthTraining,
} from "../health-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<HealthRecord> = {}): HealthRecord {
  return {
    id: "rec-001",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-03-15",
    assessmentType: "initial_health_assessment",
    outcome: "completed_on_time",
    childConsented: true,
    actionPlanCreated: true,
    gpNotified: true,
    documentedInCareFile: true,
    followUpScheduled: true,
    parentCarerInformed: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<HealthPolicy> = {}): HealthPolicy {
  return {
    id: "pol-001",
    healthAssessmentSchedule: true,
    mentalHealthStrategy: true,
    medicationProtocol: true,
    consentFramework: true,
    dentalOpticalTracking: true,
    immunisationMonitoring: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffHealthTraining> = {}): StaffHealthTraining {
  return {
    id: "trn-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    healthAssessmentProcess: true,
    mentalHealthAwareness: true,
    medicationAdministration: true,
    consentAndCapacity: true,
    firstAidCertified: true,
    healthPromotionSkills: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("calculates percentage correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(7, 7)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════════════
// Label functions
// ══════════════════════════════════════════════════════════════════════════════

describe("label functions", () => {
  it("getAssessmentTypeLabel returns correct labels", () => {
    expect(getAssessmentTypeLabel("initial_health_assessment")).toBe("Initial Health Assessment");
    expect(getAssessmentTypeLabel("review_health_assessment")).toBe("Review Health Assessment");
    expect(getAssessmentTypeLabel("dental_check")).toBe("Dental Check");
    expect(getAssessmentTypeLabel("optical_check")).toBe("Optical Check");
    expect(getAssessmentTypeLabel("immunisation_review")).toBe("Immunisation Review");
    expect(getAssessmentTypeLabel("sdq_assessment")).toBe("SDQ Assessment");
    expect(getAssessmentTypeLabel("mental_health_review")).toBe("Mental Health Review");
    expect(getAssessmentTypeLabel("specialist_referral")).toBe("Specialist Referral");
  });

  it("getOutcomeLabel returns correct labels", () => {
    expect(getOutcomeLabel("completed_on_time")).toBe("Completed On Time");
    expect(getOutcomeLabel("completed_late")).toBe("Completed Late");
    expect(getOutcomeLabel("overdue")).toBe("Overdue");
    expect(getOutcomeLabel("missed")).toBe("Missed");
    expect(getOutcomeLabel("not_due")).toBe("Not Due");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateHealthQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHealthQuality", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateHealthQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.completedOnTimeRate).toBe(0);
    expect(result.childConsentRate).toBe(0);
    expect(result.actionPlanRate).toBe(0);
    expect(result.followUpRate).toBe(0);
  });

  it("scores maximum for perfect records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-002" })];
    const result = evaluateHealthQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.completedOnTimeRate).toBe(100);
    expect(result.childConsentRate).toBe(100);
    expect(result.actionPlanRate).toBe(100);
    expect(result.followUpRate).toBe(100);
  });

  it("calculates completedOnTimeRate correctly", () => {
    const records = [
      makeRecord(),
      makeRecord({ id: "rec-002", outcome: "completed_late" }),
      makeRecord({ id: "rec-003", outcome: "overdue" }),
      makeRecord({ id: "rec-004", outcome: "completed_on_time" }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.completedOnTimeRate).toBe(50);
  });

  it("calculates childConsentRate correctly", () => {
    const records = [
      makeRecord({ childConsented: true }),
      makeRecord({ id: "rec-002", childConsented: false }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.childConsentRate).toBe(50);
  });

  it("calculates actionPlanRate correctly", () => {
    const records = [
      makeRecord({ actionPlanCreated: true }),
      makeRecord({ id: "rec-002", actionPlanCreated: false }),
      makeRecord({ id: "rec-003", actionPlanCreated: false }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.actionPlanRate).toBe(33);
  });

  it("calculates followUpRate correctly", () => {
    const records = [
      makeRecord({ followUpScheduled: false }),
      makeRecord({ id: "rec-002", followUpScheduled: false }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.followUpRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("caps score at 25", () => {
    const records = [makeRecord()];
    const result = evaluateHealthQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns correct totalRecords", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-002" }), makeRecord({ id: "rec-003" })];
    const result = evaluateHealthQuality(records);
    expect(result.totalRecords).toBe(3);
  });

  it("handles mixed outcomes for quality scoring", () => {
    const records = [
      makeRecord({ outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, followUpScheduled: true }),
      makeRecord({ id: "rec-002", outcome: "missed", childConsented: false, actionPlanCreated: false, followUpScheduled: false }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.completedOnTimeRate).toBe(50);
    expect(result.childConsentRate).toBe(50);
    expect(result.actionPlanRate).toBe(50);
    expect(result.followUpRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateHealthCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHealthCompliance", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateHealthCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.gpNotifiedRate).toBe(0);
    expect(result.parentInformedRate).toBe(0);
    expect(result.typeDiversityRatio).toBe(0);
  });

  it("scores maximum for perfect compliance", () => {
    const records = [
      makeRecord({ assessmentType: "initial_health_assessment" }),
      makeRecord({ id: "rec-002", assessmentType: "review_health_assessment" }),
      makeRecord({ id: "rec-003", assessmentType: "dental_check" }),
      makeRecord({ id: "rec-004", assessmentType: "optical_check" }),
      makeRecord({ id: "rec-005", assessmentType: "immunisation_review" }),
      makeRecord({ id: "rec-006", assessmentType: "sdq_assessment" }),
      makeRecord({ id: "rec-007", assessmentType: "mental_health_review" }),
      makeRecord({ id: "rec-008", assessmentType: "specialist_referral" }),
    ];
    const result = evaluateHealthCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.documentedRate).toBe(100);
    expect(result.gpNotifiedRate).toBe(100);
    expect(result.parentInformedRate).toBe(100);
    expect(result.typeDiversityRatio).toBe(100);
  });

  it("calculates documentedRate correctly", () => {
    const records = [
      makeRecord({ documentedInCareFile: true }),
      makeRecord({ id: "rec-002", documentedInCareFile: false }),
    ];
    const result = evaluateHealthCompliance(records);
    expect(result.documentedRate).toBe(50);
  });

  it("calculates gpNotifiedRate correctly", () => {
    const records = [
      makeRecord({ gpNotified: true }),
      makeRecord({ id: "rec-002", gpNotified: false }),
      makeRecord({ id: "rec-003", gpNotified: false }),
    ];
    const result = evaluateHealthCompliance(records);
    expect(result.gpNotifiedRate).toBe(33);
  });

  it("calculates parentInformedRate correctly", () => {
    const records = [
      makeRecord({ parentCarerInformed: false }),
      makeRecord({ id: "rec-002", parentCarerInformed: false }),
    ];
    const result = evaluateHealthCompliance(records);
    expect(result.parentInformedRate).toBe(0);
  });

  it("calculates typeDiversityRatio based on unique types out of 8", () => {
    const records = [
      makeRecord({ assessmentType: "dental_check" }),
      makeRecord({ id: "rec-002", assessmentType: "dental_check" }),
      makeRecord({ id: "rec-003", assessmentType: "optical_check" }),
    ];
    const result = evaluateHealthCompliance(records);
    // 2 unique types out of 8 = 25%
    expect(result.typeDiversityRatio).toBe(25);
  });

  it("caps score at 25", () => {
    const records = [makeRecord()];
    const result = evaluateHealthCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single assessment type with full diversity penalty", () => {
    const records = [
      makeRecord({ assessmentType: "dental_check" }),
      makeRecord({ id: "rec-002", assessmentType: "dental_check" }),
    ];
    const result = evaluateHealthCompliance(records);
    // 1 unique type out of 8 = 13%
    expect(result.typeDiversityRatio).toBe(13);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateHealthPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHealthPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateHealthPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.healthAssessmentSchedule).toBe(false);
    expect(result.mentalHealthStrategy).toBe(false);
    expect(result.medicationProtocol).toBe(false);
    expect(result.consentFramework).toBe(false);
    expect(result.dentalOpticalTracking).toBe(false);
    expect(result.immunisationMonitoring).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("scores 25 for all policies enabled", () => {
    const result = evaluateHealthPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("scores 0 for all policies disabled", () => {
    const result = evaluateHealthPolicy(makePolicy({
      healthAssessmentSchedule: false,
      mentalHealthStrategy: false,
      medicationProtocol: false,
      consentFramework: false,
      dentalOpticalTracking: false,
      immunisationMonitoring: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("scores 4 for healthAssessmentSchedule only", () => {
    const result = evaluateHealthPolicy(makePolicy({
      healthAssessmentSchedule: true,
      mentalHealthStrategy: false,
      medicationProtocol: false,
      consentFramework: false,
      dentalOpticalTracking: false,
      immunisationMonitoring: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores 4 for mentalHealthStrategy only", () => {
    const result = evaluateHealthPolicy(makePolicy({
      healthAssessmentSchedule: false,
      mentalHealthStrategy: true,
      medicationProtocol: false,
      consentFramework: false,
      dentalOpticalTracking: false,
      immunisationMonitoring: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores 3 for dentalOpticalTracking only", () => {
    const result = evaluateHealthPolicy(makePolicy({
      healthAssessmentSchedule: false,
      mentalHealthStrategy: false,
      medicationProtocol: false,
      consentFramework: false,
      dentalOpticalTracking: true,
      immunisationMonitoring: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("correctly sums mixed policies", () => {
    // healthAssessmentSchedule (4) + dentalOpticalTracking (3) + regularReview (3) = 10
    const result = evaluateHealthPolicy(makePolicy({
      healthAssessmentSchedule: true,
      mentalHealthStrategy: false,
      medicationProtocol: false,
      consentFramework: false,
      dentalOpticalTracking: true,
      immunisationMonitoring: false,
      regularReview: true,
    }));
    expect(result.overallScore).toBe(10);
  });

  it("preserves individual boolean values in result", () => {
    const policy = makePolicy({ mentalHealthStrategy: false, regularReview: false });
    const result = evaluateHealthPolicy(policy);
    expect(result.mentalHealthStrategy).toBe(false);
    expect(result.regularReview).toBe(false);
    expect(result.healthAssessmentSchedule).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffHealthReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffHealthReadiness", () => {
  it("returns all zeros for empty training", () => {
    const result = evaluateStaffHealthReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.healthAssessmentProcessRate).toBe(0);
    expect(result.mentalHealthAwarenessRate).toBe(0);
    expect(result.medicationAdministrationRate).toBe(0);
    expect(result.consentAndCapacityRate).toBe(0);
    expect(result.firstAidCertifiedRate).toBe(0);
    expect(result.healthPromotionSkillsRate).toBe(0);
  });

  it("scores maximum for fully trained staff", () => {
    const result = evaluateStaffHealthReadiness([makeTraining()]);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(1);
  });

  it("calculates rates correctly with mixed training", () => {
    const training = [
      makeTraining({ staffId: "s1", healthAssessmentProcess: true, mentalHealthAwareness: true, medicationAdministration: true, consentAndCapacity: true, firstAidCertified: true, healthPromotionSkills: true }),
      makeTraining({ id: "trn-002", staffId: "s2", healthAssessmentProcess: false, mentalHealthAwareness: false, medicationAdministration: false, consentAndCapacity: false, firstAidCertified: false, healthPromotionSkills: false }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.healthAssessmentProcessRate).toBe(50);
    expect(result.mentalHealthAwarenessRate).toBe(50);
    expect(result.medicationAdministrationRate).toBe(50);
    expect(result.consentAndCapacityRate).toBe(50);
    expect(result.firstAidCertifiedRate).toBe(50);
    expect(result.healthPromotionSkillsRate).toBe(50);
    expect(result.totalStaff).toBe(2);
  });

  it("scores 0 for fully untrained staff", () => {
    const result = evaluateStaffHealthReadiness([
      makeTraining({
        healthAssessmentProcess: false,
        mentalHealthAwareness: false,
        medicationAdministration: false,
        consentAndCapacity: false,
        firstAidCertified: false,
        healthPromotionSkills: false,
      }),
    ]);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const result = evaluateStaffHealthReadiness([makeTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles multiple fully trained staff", () => {
    const training = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ id: "trn-002", staffId: "s2" }),
      makeTraining({ id: "trn-003", staffId: "s3" }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(3);
  });

  it("weights healthAssessmentProcess highest", () => {
    // Only healthAssessmentProcess = true: should get 6 points
    const result = evaluateStaffHealthReadiness([
      makeTraining({
        healthAssessmentProcess: true,
        mentalHealthAwareness: false,
        medicationAdministration: false,
        consentAndCapacity: false,
        firstAidCertified: false,
        healthPromotionSkills: false,
      }),
    ]);
    expect(result.overallScore).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildHealthProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildHealthProfiles", () => {
  it("returns empty array for no records", () => {
    const profiles = buildChildHealthProfiles([]);
    expect(profiles).toHaveLength(0);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "rec-002", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "rec-003", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles).toHaveLength(2);
  });

  it("calculates totalAssessments per child", () => {
    const records = [
      makeRecord({ childId: "child-alex" }),
      makeRecord({ id: "rec-002", childId: "child-alex" }),
      makeRecord({ id: "rec-003", childId: "child-alex" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].totalAssessments).toBe(3);
  });

  it("caps score at 10", () => {
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        childId: "child-alex",
        assessmentType: ["initial_health_assessment", "review_health_assessment", "dental_check", "optical_check"][i % 4] as any,
      }),
    );
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("assigns freq=2 for 10+ records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-alex" }),
    );
    const profiles = buildChildHealthProfiles(records);
    // freq=2, rate1=3 (100% on time), rate2=3 (100% consent), diversity=0 (1 type) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("assigns freq=1 for 5-9 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-alex" }),
    );
    const profiles = buildChildHealthProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("assigns freq=0 for fewer than 5 records", () => {
    const records = [
      makeRecord({ childId: "child-alex" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    // freq=0, rate1=3, rate2=3, diversity=0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("calculates diversity=2 for 4+ assessment types", () => {
    const records = [
      makeRecord({ childId: "child-alex", assessmentType: "initial_health_assessment" }),
      makeRecord({ id: "rec-002", childId: "child-alex", assessmentType: "dental_check" }),
      makeRecord({ id: "rec-003", childId: "child-alex", assessmentType: "optical_check" }),
      makeRecord({ id: "rec-004", childId: "child-alex", assessmentType: "sdq_assessment" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].diversityCount).toBe(4);
    // freq=0, rate1=3, rate2=3, diversity=2 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("calculates diversity=1 for 2-3 assessment types", () => {
    const records = [
      makeRecord({ childId: "child-alex", assessmentType: "dental_check" }),
      makeRecord({ id: "rec-002", childId: "child-alex", assessmentType: "optical_check" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].diversityCount).toBe(2);
  });

  it("calculates diversity=0 for 1 assessment type", () => {
    const records = [
      makeRecord({ childId: "child-alex", assessmentType: "dental_check" }),
      makeRecord({ id: "rec-002", childId: "child-alex", assessmentType: "dental_check" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].diversityCount).toBe(1);
  });

  it("rates completedOnTimeRate thresholds correctly", () => {
    // 2 out of 3 on time = 67% -> rate1 = 2
    const records = [
      makeRecord({ childId: "child-alex", outcome: "completed_on_time" }),
      makeRecord({ id: "rec-002", childId: "child-alex", outcome: "completed_on_time" }),
      makeRecord({ id: "rec-003", childId: "child-alex", outcome: "overdue" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].completedOnTimeRate).toBe(67);
  });

  it("handles child with all missed outcomes", () => {
    const records = [
      makeRecord({ childId: "child-alex", outcome: "missed", childConsented: false }),
      makeRecord({ id: "rec-002", childId: "child-alex", outcome: "missed", childConsented: false }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].completedOnTimeRate).toBe(0);
    expect(profiles[0].childConsentRate).toBe(0);
    // freq=0, rate1=0, rate2=0, diversity=0 = 0
    expect(profiles[0].overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateHealthIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateHealthIntelligence", () => {
  const fullRecords: HealthRecord[] = [
    makeRecord({ childId: "child-alex", childName: "Alex", assessmentType: "initial_health_assessment" }),
    makeRecord({ id: "rec-002", childId: "child-alex", childName: "Alex", assessmentType: "review_health_assessment" }),
    makeRecord({ id: "rec-003", childId: "child-alex", childName: "Alex", assessmentType: "dental_check" }),
    makeRecord({ id: "rec-004", childId: "child-alex", childName: "Alex", assessmentType: "optical_check" }),
    makeRecord({ id: "rec-005", childId: "child-jordan", childName: "Jordan", assessmentType: "immunisation_review" }),
    makeRecord({ id: "rec-006", childId: "child-jordan", childName: "Jordan", assessmentType: "sdq_assessment" }),
    makeRecord({ id: "rec-007", childId: "child-jordan", childName: "Jordan", assessmentType: "mental_health_review" }),
    makeRecord({ id: "rec-008", childId: "child-morgan", childName: "Morgan", assessmentType: "specialist_referral" }),
  ];

  it("returns correct homeId and period", () => {
    const result = generateHealthIntelligence(fullRecords, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
  });

  it("sums four evaluators and caps at 100", () => {
    const result = generateHealthIntelligence(fullRecords, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("rates outstanding for perfect input", () => {
    const result = generateHealthIntelligence(fullRecords, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.rating).toBe("outstanding");
  });

  it("rates inadequate for empty input", () => {
    const result = generateHealthIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("includes strengths when evaluator scores are >= 20", () => {
    const result = generateHealthIntelligence(fullRecords, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes areas for improvement when evaluator scores < 15", () => {
    const weakRecords = [
      makeRecord({ outcome: "missed", childConsented: false, actionPlanCreated: false, followUpScheduled: false, documentedInCareFile: false, gpNotified: false, parentCarerInformed: false }),
    ];
    const result = generateHealthIntelligence(weakRecords, null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("includes URGENT actions when policy is 0", () => {
    const result = generateHealthIntelligence(fullRecords, null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("polic"))).toBe(true);
  });

  it("includes URGENT actions when staff readiness is 0", () => {
    const result = generateHealthIntelligence(fullRecords, makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("includes conditional actions when rates < 50", () => {
    const poorRecords = [
      makeRecord({ outcome: "missed", childConsented: false, documentedInCareFile: false, gpNotified: false }),
      makeRecord({ id: "rec-002", outcome: "overdue", childConsented: false, documentedInCareFile: false, gpNotified: false }),
    ];
    const result = generateHealthIntelligence(poorRecords, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("always includes 7 regulatory links", () => {
    const result = generateHealthIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Reg 10 in regulatory links", () => {
    const result = generateHealthIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
  });

  it("includes child profiles in result", () => {
    const result = generateHealthIntelligence(fullRecords, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.childProfiles.length).toBe(3);
  });

  it("passes through evaluator results", () => {
    const result = generateHealthIntelligence(fullRecords, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.healthQuality).toBeDefined();
    expect(result.healthCompliance).toBeDefined();
    expect(result.healthPolicy).toBeDefined();
    expect(result.staffHealthReadiness).toBeDefined();
  });

  it("handles null policy with records and training", () => {
    const result = generateHealthIntelligence(fullRecords, null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.healthPolicy.overallScore).toBe(0);
    expect(result.overallScore).toBeLessThan(100);
  });

  it("handles empty training with records and policy", () => {
    const result = generateHealthIntelligence(fullRecords, makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20");
    expect(result.staffHealthReadiness.overallScore).toBe(0);
    expect(result.overallScore).toBeLessThan(100);
  });

  it("generates no strengths for zero-score evaluators", () => {
    const result = generateHealthIntelligence([], null, [], "oak-house", "2026-01-01", "2026-05-20");
    // With all zeros, no evaluator reaches >= 20
    const evaluatorStrengths = result.strengths.filter((s) =>
      s.includes("quality") || s.includes("compliance") || s.includes("polic") || s.includes("readiness"),
    );
    expect(evaluatorStrengths).toHaveLength(0);
  });

  it("overall score equals sum of four evaluator scores when under 100", () => {
    const result = generateHealthIntelligence(
      [makeRecord({ outcome: "completed_late", childConsented: false })],
      makePolicy({ mentalHealthStrategy: false, regularReview: false }),
      [makeTraining({ mentalHealthAwareness: false })],
      "oak-house",
      "2026-01-01",
      "2026-05-20",
    );
    const expectedSum =
      result.healthQuality.overallScore +
      result.healthCompliance.overallScore +
      result.healthPolicy.overallScore +
      result.staffHealthReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedSum));
  });
});
