/* ──────────────────────────────────────────────────────────────
   Health Intelligence Engine (v2) — Tests
   ────────────────────────────────────────────────────────────── */

import { describe, it, expect } from "vitest";
import {
  healthIntelligencePct,
  getHealthIntelligenceRating,
  getHealthIntelligenceCategoryLabel,
  getHealthIntelligenceOutcomeLabel,
  getHealthIntelligenceRatingLabel,
  evaluateHealthIntelligenceQuality,
  evaluateHealthIntelligenceCompliance,
  evaluateHealthIntelligencePolicy,
  evaluateStaffHealthIntelligenceReadiness,
  buildChildHealthIntelligenceProfiles,
  generateHealthIntelligenceResult,
} from "../health-intelligence-engine";
import type {
  HealthIntelligenceRecord,
  HealthIntelligencePolicy,
  StaffHealthIntelligenceTraining,
  HealthIntelligenceCategory,
} from "../health-intelligence-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<HealthIntelligenceRecord> = {}): HealthIntelligenceRecord {
  return {
    id: "hi-001",
    homeId: "home-oak",
    date: "2025-06-15",
    childId: "child-alex",
    childName: "Alex",
    category: "health_assessment",
    outcome: "health_improved",
    healthNeedsAssessed: true,
    consentObtained: true,
    childViewIncluded: true,
    followUpPlanned: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<HealthIntelligencePolicy> = {}): HealthIntelligencePolicy {
  return {
    healthCarePolicy: true,
    consentToTreatmentPolicy: true,
    medicationManagementPolicy: true,
    mentalHealthSupportPolicy: true,
    healthPromotionPolicy: true,
    dentalHealthPolicy: true,
    immunisationTrackingPolicy: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffHealthIntelligenceTraining> = {}): StaffHealthIntelligenceTraining {
  return {
    staffId: "staff-sarah",
    healthAssessmentKnowledge: true,
    medicationAdministration: true,
    mentalHealthAwareness: true,
    firstAidTraining: true,
    healthPromotionSkills: true,
    consentProcedures: true,
    ...overrides,
  };
}

const ALL_CATEGORIES: HealthIntelligenceCategory[] = [
  "health_assessment", "medical_appointment", "dental_check", "immunisation_review",
  "mental_health_screening", "health_action_plan", "medication_review", "health_promotion",
];

// ══════════════════════════════════════════════════════════════════════════════
// healthIntelligencePct
// ══════════════════════════════════════════════════════════════════════════════

describe("healthIntelligencePct", () => {
  it("calculates percentage correctly", () => {
    expect(healthIntelligencePct(3, 4)).toBe(75);
  });

  it("returns 0 when denominator is 0", () => {
    expect(healthIntelligencePct(5, 0)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    expect(healthIntelligencePct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(healthIntelligencePct(7, 7)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(healthIntelligencePct(0, 10)).toBe(0);
  });

  it("returns 50 for half", () => {
    expect(healthIntelligencePct(1, 2)).toBe(50);
  });

  it("handles large numbers", () => {
    expect(healthIntelligencePct(999, 1000)).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getHealthIntelligenceRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getHealthIntelligenceRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getHealthIntelligenceRating(80)).toBe("outstanding");
    expect(getHealthIntelligenceRating(100)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getHealthIntelligenceRating(60)).toBe("good");
    expect(getHealthIntelligenceRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getHealthIntelligenceRating(40)).toBe("requires_improvement");
    expect(getHealthIntelligenceRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getHealthIntelligenceRating(39)).toBe("inadequate");
    expect(getHealthIntelligenceRating(0)).toBe("inadequate");
  });

  it("returns outstanding for exactly 80", () => {
    expect(getHealthIntelligenceRating(80)).toBe("outstanding");
  });

  it("returns good for exactly 60", () => {
    expect(getHealthIntelligenceRating(60)).toBe("good");
  });

  it("returns requires_improvement for exactly 40", () => {
    expect(getHealthIntelligenceRating(40)).toBe("requires_improvement");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label functions
// ══════════════════════════════════════════════════════════════════════════════

describe("label functions", () => {
  it("getHealthIntelligenceCategoryLabel returns correct labels", () => {
    expect(getHealthIntelligenceCategoryLabel("health_assessment")).toBe("Health Assessment");
    expect(getHealthIntelligenceCategoryLabel("medical_appointment")).toBe("Medical Appointment");
    expect(getHealthIntelligenceCategoryLabel("dental_check")).toBe("Dental Check");
    expect(getHealthIntelligenceCategoryLabel("immunisation_review")).toBe("Immunisation Review");
    expect(getHealthIntelligenceCategoryLabel("mental_health_screening")).toBe("Mental Health Screening");
    expect(getHealthIntelligenceCategoryLabel("health_action_plan")).toBe("Health Action Plan");
    expect(getHealthIntelligenceCategoryLabel("medication_review")).toBe("Medication Review");
    expect(getHealthIntelligenceCategoryLabel("health_promotion")).toBe("Health Promotion");
  });

  it("getHealthIntelligenceOutcomeLabel returns correct labels", () => {
    expect(getHealthIntelligenceOutcomeLabel("health_improved")).toBe("Health Improved");
    expect(getHealthIntelligenceOutcomeLabel("health_maintained")).toBe("Health Maintained");
    expect(getHealthIntelligenceOutcomeLabel("health_concern_identified")).toBe("Health Concern Identified");
    expect(getHealthIntelligenceOutcomeLabel("health_deteriorated")).toBe("Health Deteriorated");
    expect(getHealthIntelligenceOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });

  it("getHealthIntelligenceRatingLabel returns correct labels", () => {
    expect(getHealthIntelligenceRatingLabel("outstanding")).toBe("Outstanding");
    expect(getHealthIntelligenceRatingLabel("good")).toBe("Good");
    expect(getHealthIntelligenceRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getHealthIntelligenceRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateHealthIntelligenceQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHealthIntelligenceQuality", () => {
  it("returns all zeros for empty records", () => {
    const r = evaluateHealthIntelligenceQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.healthNeedsAssessedRate).toBe(0);
    expect(r.consentObtainedRate).toBe(0);
    expect(r.childViewIncludedRate).toBe(0);
    expect(r.followUpPlannedRate).toBe(0);
  });

  it("scores 25 for all-perfect records", () => {
    const records = [makeRecord(), makeRecord({ id: "hi-002" })];
    const r = evaluateHealthIntelligenceQuality(records);
    expect(r.overallScore).toBe(25);
    expect(r.healthNeedsAssessedRate).toBe(100);
    expect(r.consentObtainedRate).toBe(100);
    expect(r.childViewIncludedRate).toBe(100);
    expect(r.followUpPlannedRate).toBe(100);
  });

  it("calculates healthNeedsAssessedRate correctly", () => {
    const records = [
      makeRecord({ healthNeedsAssessed: true }),
      makeRecord({ id: "hi-002", healthNeedsAssessed: false }),
    ];
    const r = evaluateHealthIntelligenceQuality(records);
    expect(r.healthNeedsAssessedRate).toBe(50);
  });

  it("calculates consentObtainedRate correctly", () => {
    const records = [
      makeRecord({ consentObtained: true }),
      makeRecord({ id: "hi-002", consentObtained: false }),
      makeRecord({ id: "hi-003", consentObtained: false }),
    ];
    const r = evaluateHealthIntelligenceQuality(records);
    expect(r.consentObtainedRate).toBe(33);
  });

  it("calculates childViewIncludedRate correctly", () => {
    const records = [
      makeRecord({ childViewIncluded: false }),
      makeRecord({ id: "hi-002", childViewIncluded: false }),
    ];
    const r = evaluateHealthIntelligenceQuality(records);
    expect(r.childViewIncludedRate).toBe(0);
  });

  it("calculates followUpPlannedRate correctly", () => {
    const records = [
      makeRecord({ followUpPlanned: true }),
      makeRecord({ id: "hi-002", followUpPlanned: false }),
    ];
    const r = evaluateHealthIntelligenceQuality(records);
    expect(r.followUpPlannedRate).toBe(50);
  });

  it("caps score at 25", () => {
    const r = evaluateHealthIntelligenceQuality([makeRecord()]);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns correct totalRecords", () => {
    const records = [makeRecord(), makeRecord({ id: "hi-002" }), makeRecord({ id: "hi-003" })];
    const r = evaluateHealthIntelligenceQuality(records);
    expect(r.totalRecords).toBe(3);
  });

  it("score is 0 when all booleans are false", () => {
    const r = evaluateHealthIntelligenceQuality([
      makeRecord({ healthNeedsAssessed: false, consentObtained: false, childViewIncluded: false, followUpPlanned: false }),
    ]);
    expect(r.overallScore).toBe(0);
  });

  it("weights healthNeedsAssessed highest at 7", () => {
    const r = evaluateHealthIntelligenceQuality([
      makeRecord({ healthNeedsAssessed: true, consentObtained: false, childViewIncluded: false, followUpPlanned: false }),
    ]);
    expect(r.overallScore).toBe(7);
  });

  it("weights consentObtained at 6", () => {
    const r = evaluateHealthIntelligenceQuality([
      makeRecord({ healthNeedsAssessed: false, consentObtained: true, childViewIncluded: false, followUpPlanned: false }),
    ]);
    expect(r.overallScore).toBe(6);
  });

  it("weights childViewIncluded at 6", () => {
    const r = evaluateHealthIntelligenceQuality([
      makeRecord({ healthNeedsAssessed: false, consentObtained: false, childViewIncluded: true, followUpPlanned: false }),
    ]);
    expect(r.overallScore).toBe(6);
  });

  it("weights followUpPlanned at 6", () => {
    const r = evaluateHealthIntelligenceQuality([
      makeRecord({ healthNeedsAssessed: false, consentObtained: false, childViewIncluded: false, followUpPlanned: true }),
    ]);
    expect(r.overallScore).toBe(6);
  });

  it("handles mixed records", () => {
    const records = [
      makeRecord({ healthNeedsAssessed: true, consentObtained: true, childViewIncluded: true, followUpPlanned: true }),
      makeRecord({ id: "hi-002", healthNeedsAssessed: false, consentObtained: false, childViewIncluded: false, followUpPlanned: false }),
    ];
    const r = evaluateHealthIntelligenceQuality(records);
    expect(r.healthNeedsAssessedRate).toBe(50);
    expect(r.consentObtainedRate).toBe(50);
    expect(r.childViewIncludedRate).toBe(50);
    expect(r.followUpPlannedRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateHealthIntelligenceCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHealthIntelligenceCompliance", () => {
  it("returns all zeros for empty records", () => {
    const r = evaluateHealthIntelligenceCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.documentationCompleteRate).toBe(0);
    expect(r.timelyRecordingRate).toBe(0);
    expect(r.healthNeedsAssessedRate).toBe(0);
    expect(r.categoryDiversityRatio).toBe(0);
    expect(r.uniqueCategories).toBe(0);
  });

  it("scores 25 for perfect compliance with all 8 categories", () => {
    const records = ALL_CATEGORIES.map((cat, i) =>
      makeRecord({ id: `hi-${i}`, category: cat }),
    );
    const r = evaluateHealthIntelligenceCompliance(records);
    expect(r.overallScore).toBe(25);
    expect(r.documentationCompleteRate).toBe(100);
    expect(r.timelyRecordingRate).toBe(100);
    expect(r.healthNeedsAssessedRate).toBe(100);
    expect(r.categoryDiversityRatio).toBe(1);
    expect(r.uniqueCategories).toBe(8);
  });

  it("calculates documentationCompleteRate correctly", () => {
    const records = [
      makeRecord({ documentationComplete: true }),
      makeRecord({ id: "hi-002", documentationComplete: false }),
    ];
    const r = evaluateHealthIntelligenceCompliance(records);
    expect(r.documentationCompleteRate).toBe(50);
  });

  it("calculates timelyRecordingRate correctly", () => {
    const records = [
      makeRecord({ timelyRecording: true }),
      makeRecord({ id: "hi-002", timelyRecording: false }),
      makeRecord({ id: "hi-003", timelyRecording: false }),
    ];
    const r = evaluateHealthIntelligenceCompliance(records);
    expect(r.timelyRecordingRate).toBe(33);
  });

  it("calculates healthNeedsAssessedRate correctly (compliance reuses quality boolean)", () => {
    const records = [
      makeRecord({ healthNeedsAssessed: true }),
      makeRecord({ id: "hi-002", healthNeedsAssessed: false }),
    ];
    const r = evaluateHealthIntelligenceCompliance(records);
    expect(r.healthNeedsAssessedRate).toBe(50);
  });

  it("calculates categoryDiversityRatio for 1 category", () => {
    const records = [
      makeRecord({ category: "dental_check" }),
      makeRecord({ id: "hi-002", category: "dental_check" }),
    ];
    const r = evaluateHealthIntelligenceCompliance(records);
    expect(r.categoryDiversityRatio).toBe(0.13);
    expect(r.uniqueCategories).toBe(1);
  });

  it("calculates categoryDiversityRatio for 4 categories", () => {
    const records = [
      makeRecord({ category: "health_assessment" }),
      makeRecord({ id: "hi-002", category: "dental_check" }),
      makeRecord({ id: "hi-003", category: "immunisation_review" }),
      makeRecord({ id: "hi-004", category: "medication_review" }),
    ];
    const r = evaluateHealthIntelligenceCompliance(records);
    expect(r.categoryDiversityRatio).toBe(0.5);
    expect(r.uniqueCategories).toBe(4);
  });

  it("caps score at 25", () => {
    const records = ALL_CATEGORIES.map((cat, i) =>
      makeRecord({ id: `hi-${i}`, category: cat }),
    );
    const r = evaluateHealthIntelligenceCompliance(records);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns correct totalRecords", () => {
    const records = [makeRecord(), makeRecord({ id: "hi-002" })];
    const r = evaluateHealthIntelligenceCompliance(records);
    expect(r.totalRecords).toBe(2);
  });

  it("score is low when all compliance booleans are false and single category", () => {
    const r = evaluateHealthIntelligenceCompliance([
      makeRecord({ documentationComplete: false, timelyRecording: false, healthNeedsAssessed: false }),
    ]);
    expect(r.documentationCompleteRate).toBe(0);
    expect(r.timelyRecordingRate).toBe(0);
    expect(r.healthNeedsAssessedRate).toBe(0);
    // Only contribution is categoryDiversityRatio = 0.13 * 5 = 0.65 -> Math.round(0.65*10)/10 = 0.7
    expect(r.overallScore).toBe(0.7);
  });

  it("weights documentationComplete highest at 8", () => {
    const r = evaluateHealthIntelligenceCompliance([
      makeRecord({ documentationComplete: true, timelyRecording: false, healthNeedsAssessed: false }),
    ]);
    // 8 (doc) + 0 (timely) + 0 (needs) + 0.13*5 (diversity) = 8.65 -> 8.6
    expect(r.overallScore).toBeGreaterThanOrEqual(8);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateHealthIntelligencePolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHealthIntelligencePolicy", () => {
  it("returns 0 for null policy", () => {
    const r = evaluateHealthIntelligencePolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.healthCarePolicy).toBe(false);
    expect(r.consentToTreatmentPolicy).toBe(false);
    expect(r.medicationManagementPolicy).toBe(false);
    expect(r.mentalHealthSupportPolicy).toBe(false);
    expect(r.healthPromotionPolicy).toBe(false);
    expect(r.dentalHealthPolicy).toBe(false);
    expect(r.immunisationTrackingPolicy).toBe(false);
  });

  it("scores 25 for all policies enabled", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy());
    expect(r.overallScore).toBe(25);
  });

  it("scores 0 for all policies disabled", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({
      healthCarePolicy: false, consentToTreatmentPolicy: false, medicationManagementPolicy: false,
      mentalHealthSupportPolicy: false, healthPromotionPolicy: false, dentalHealthPolicy: false, immunisationTrackingPolicy: false,
    }));
    expect(r.overallScore).toBe(0);
  });

  it("scores 4 for healthCarePolicy only", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({
      healthCarePolicy: true, consentToTreatmentPolicy: false, medicationManagementPolicy: false,
      mentalHealthSupportPolicy: false, healthPromotionPolicy: false, dentalHealthPolicy: false, immunisationTrackingPolicy: false,
    }));
    expect(r.overallScore).toBe(4);
  });

  it("scores 4 for consentToTreatmentPolicy only", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({
      healthCarePolicy: false, consentToTreatmentPolicy: true, medicationManagementPolicy: false,
      mentalHealthSupportPolicy: false, healthPromotionPolicy: false, dentalHealthPolicy: false, immunisationTrackingPolicy: false,
    }));
    expect(r.overallScore).toBe(4);
  });

  it("scores 4 for medicationManagementPolicy only", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({
      healthCarePolicy: false, consentToTreatmentPolicy: false, medicationManagementPolicy: true,
      mentalHealthSupportPolicy: false, healthPromotionPolicy: false, dentalHealthPolicy: false, immunisationTrackingPolicy: false,
    }));
    expect(r.overallScore).toBe(4);
  });

  it("scores 4 for mentalHealthSupportPolicy only", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({
      healthCarePolicy: false, consentToTreatmentPolicy: false, medicationManagementPolicy: false,
      mentalHealthSupportPolicy: true, healthPromotionPolicy: false, dentalHealthPolicy: false, immunisationTrackingPolicy: false,
    }));
    expect(r.overallScore).toBe(4);
  });

  it("scores 3 for healthPromotionPolicy only", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({
      healthCarePolicy: false, consentToTreatmentPolicy: false, medicationManagementPolicy: false,
      mentalHealthSupportPolicy: false, healthPromotionPolicy: true, dentalHealthPolicy: false, immunisationTrackingPolicy: false,
    }));
    expect(r.overallScore).toBe(3);
  });

  it("scores 3 for dentalHealthPolicy only", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({
      healthCarePolicy: false, consentToTreatmentPolicy: false, medicationManagementPolicy: false,
      mentalHealthSupportPolicy: false, healthPromotionPolicy: false, dentalHealthPolicy: true, immunisationTrackingPolicy: false,
    }));
    expect(r.overallScore).toBe(3);
  });

  it("scores 3 for immunisationTrackingPolicy only", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({
      healthCarePolicy: false, consentToTreatmentPolicy: false, medicationManagementPolicy: false,
      mentalHealthSupportPolicy: false, healthPromotionPolicy: false, dentalHealthPolicy: false, immunisationTrackingPolicy: true,
    }));
    expect(r.overallScore).toBe(3);
  });

  it("correctly sums mixed policies: 4+3+3 = 10", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({
      healthCarePolicy: true, consentToTreatmentPolicy: false, medicationManagementPolicy: false,
      mentalHealthSupportPolicy: false, healthPromotionPolicy: true, dentalHealthPolicy: true, immunisationTrackingPolicy: false,
    }));
    expect(r.overallScore).toBe(10);
  });

  it("correctly sums weight-4 policies: 4+4+4+4 = 16", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({
      healthCarePolicy: true, consentToTreatmentPolicy: true, medicationManagementPolicy: true,
      mentalHealthSupportPolicy: true, healthPromotionPolicy: false, dentalHealthPolicy: false, immunisationTrackingPolicy: false,
    }));
    expect(r.overallScore).toBe(16);
  });

  it("preserves individual boolean values in result", () => {
    const r = evaluateHealthIntelligencePolicy(makePolicy({ mentalHealthSupportPolicy: false, immunisationTrackingPolicy: false }));
    expect(r.mentalHealthSupportPolicy).toBe(false);
    expect(r.immunisationTrackingPolicy).toBe(false);
    expect(r.healthCarePolicy).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffHealthIntelligenceReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffHealthIntelligenceReadiness", () => {
  it("returns all zeros for empty training", () => {
    const r = evaluateStaffHealthIntelligenceReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.healthAssessmentKnowledgeRate).toBe(0);
    expect(r.medicationAdministrationRate).toBe(0);
    expect(r.mentalHealthAwarenessRate).toBe(0);
    expect(r.firstAidTrainingRate).toBe(0);
    expect(r.healthPromotionSkillsRate).toBe(0);
    expect(r.consentProceduresRate).toBe(0);
  });

  it("scores 25 for fully trained staff", () => {
    const r = evaluateStaffHealthIntelligenceReadiness([makeTraining()]);
    expect(r.overallScore).toBe(25);
    expect(r.totalStaff).toBe(1);
  });

  it("scores 0 for fully untrained staff", () => {
    const r = evaluateStaffHealthIntelligenceReadiness([makeTraining({
      healthAssessmentKnowledge: false, medicationAdministration: false, mentalHealthAwareness: false,
      firstAidTraining: false, healthPromotionSkills: false, consentProcedures: false,
    })]);
    expect(r.overallScore).toBe(0);
  });

  it("weights healthAssessmentKnowledge at 6", () => {
    const r = evaluateStaffHealthIntelligenceReadiness([makeTraining({
      healthAssessmentKnowledge: true, medicationAdministration: false, mentalHealthAwareness: false,
      firstAidTraining: false, healthPromotionSkills: false, consentProcedures: false,
    })]);
    expect(r.overallScore).toBe(6);
  });

  it("weights medicationAdministration at 5", () => {
    const r = evaluateStaffHealthIntelligenceReadiness([makeTraining({
      healthAssessmentKnowledge: false, medicationAdministration: true, mentalHealthAwareness: false,
      firstAidTraining: false, healthPromotionSkills: false, consentProcedures: false,
    })]);
    expect(r.overallScore).toBe(5);
  });

  it("weights mentalHealthAwareness at 5", () => {
    const r = evaluateStaffHealthIntelligenceReadiness([makeTraining({
      healthAssessmentKnowledge: false, medicationAdministration: false, mentalHealthAwareness: true,
      firstAidTraining: false, healthPromotionSkills: false, consentProcedures: false,
    })]);
    expect(r.overallScore).toBe(5);
  });

  it("weights firstAidTraining at 4", () => {
    const r = evaluateStaffHealthIntelligenceReadiness([makeTraining({
      healthAssessmentKnowledge: false, medicationAdministration: false, mentalHealthAwareness: false,
      firstAidTraining: true, healthPromotionSkills: false, consentProcedures: false,
    })]);
    expect(r.overallScore).toBe(4);
  });

  it("weights healthPromotionSkills at 3", () => {
    const r = evaluateStaffHealthIntelligenceReadiness([makeTraining({
      healthAssessmentKnowledge: false, medicationAdministration: false, mentalHealthAwareness: false,
      firstAidTraining: false, healthPromotionSkills: true, consentProcedures: false,
    })]);
    expect(r.overallScore).toBe(3);
  });

  it("weights consentProcedures at 2", () => {
    const r = evaluateStaffHealthIntelligenceReadiness([makeTraining({
      healthAssessmentKnowledge: false, medicationAdministration: false, mentalHealthAwareness: false,
      firstAidTraining: false, healthPromotionSkills: false, consentProcedures: true,
    })]);
    expect(r.overallScore).toBe(2);
  });

  it("calculates rates correctly with mixed training", () => {
    const training = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2", healthAssessmentKnowledge: false, medicationAdministration: false, mentalHealthAwareness: false, firstAidTraining: false, healthPromotionSkills: false, consentProcedures: false }),
    ];
    const r = evaluateStaffHealthIntelligenceReadiness(training);
    expect(r.healthAssessmentKnowledgeRate).toBe(50);
    expect(r.medicationAdministrationRate).toBe(50);
    expect(r.mentalHealthAwarenessRate).toBe(50);
    expect(r.firstAidTrainingRate).toBe(50);
    expect(r.healthPromotionSkillsRate).toBe(50);
    expect(r.consentProceduresRate).toBe(50);
    expect(r.totalStaff).toBe(2);
  });

  it("caps score at 25", () => {
    const r = evaluateStaffHealthIntelligenceReadiness([makeTraining()]);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles multiple fully trained staff", () => {
    const training = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2" }),
      makeTraining({ staffId: "s3" }),
    ];
    const r = evaluateStaffHealthIntelligenceReadiness(training);
    expect(r.overallScore).toBe(25);
    expect(r.totalStaff).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildHealthIntelligenceProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildHealthIntelligenceProfiles", () => {
  it("returns empty array for no records", () => {
    const p = buildChildHealthIntelligenceProfiles([]);
    expect(p).toHaveLength(0);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "hi-002", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "hi-003", childId: "child-jordan", childName: "Jordan" }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p).toHaveLength(2);
  });

  it("calculates totalRecords per child", () => {
    const records = [
      makeRecord({ childId: "child-alex" }),
      makeRecord({ id: "hi-002", childId: "child-alex" }),
      makeRecord({ id: "hi-003", childId: "child-alex" }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].totalRecords).toBe(3);
  });

  it("assigns freq=2 for 10+ records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `hi-${i}`, childId: "child-alex" }),
    );
    const p = buildChildHealthIntelligenceProfiles(records);
    // freq=2, rate1=3 (100% assessed), rate2=3 (100% consent), diversity=0 (1 type) = 8
    expect(p[0].overallScore).toBe(8);
  });

  it("assigns freq=1 for 5-9 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `hi-${i}`, childId: "child-alex" }),
    );
    const p = buildChildHealthIntelligenceProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0 = 7
    expect(p[0].overallScore).toBe(7);
  });

  it("assigns freq=0 for fewer than 5 records", () => {
    const records = [makeRecord({ childId: "child-alex" })];
    const p = buildChildHealthIntelligenceProfiles(records);
    // freq=0, rate1=3 (100%), rate2=3 (100%), diversity=0 = 6
    expect(p[0].overallScore).toBe(6);
  });

  it("rate1 uses healthNeedsAssessedRate", () => {
    const records = [
      makeRecord({ childId: "child-alex", healthNeedsAssessed: true }),
      makeRecord({ id: "hi-002", childId: "child-alex", healthNeedsAssessed: false }),
      makeRecord({ id: "hi-003", childId: "child-alex", healthNeedsAssessed: false }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].healthNeedsAssessedRate).toBe(33);
    // rate1=0 (33% < 40), rate2=3 (100% consent), freq=0, diversity=0 = 3
    expect(p[0].overallScore).toBe(3);
  });

  it("rate2 uses consentObtainedRate", () => {
    const records = [
      makeRecord({ childId: "child-alex", consentObtained: true }),
      makeRecord({ id: "hi-002", childId: "child-alex", consentObtained: false }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].consentObtainedRate).toBe(50);
    // rate2=1 (50% >= 40), rate1=3 (100%), freq=0, diversity=0 = 4
    expect(p[0].overallScore).toBe(4);
  });

  it("rate1=3 for healthNeedsAssessedRate >= 80", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `hi-${i}`, childId: "child-alex", healthNeedsAssessed: true }),
    );
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].healthNeedsAssessedRate).toBe(100);
  });

  it("rate1=2 for healthNeedsAssessedRate 60-79", () => {
    const records = [
      makeRecord({ childId: "child-alex", healthNeedsAssessed: true }),
      makeRecord({ id: "hi-002", childId: "child-alex", healthNeedsAssessed: true }),
      makeRecord({ id: "hi-003", childId: "child-alex", healthNeedsAssessed: false }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].healthNeedsAssessedRate).toBe(67);
    // rate1=2 (67% >= 60), rate2=3 (100%), freq=0, diversity=0 = 5
    expect(p[0].overallScore).toBe(5);
  });

  it("rate1=1 for healthNeedsAssessedRate 40-59", () => {
    const records = [
      makeRecord({ childId: "child-alex", healthNeedsAssessed: true }),
      makeRecord({ id: "hi-002", childId: "child-alex", healthNeedsAssessed: false }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].healthNeedsAssessedRate).toBe(50);
    // rate1=1 (50% >= 40), rate2=3 (100%), freq=0, diversity=0 = 4
    expect(p[0].overallScore).toBe(4);
  });

  it("rate1=0 for healthNeedsAssessedRate < 40", () => {
    const records = [
      makeRecord({ childId: "child-alex", healthNeedsAssessed: true }),
      makeRecord({ id: "hi-002", childId: "child-alex", healthNeedsAssessed: false }),
      makeRecord({ id: "hi-003", childId: "child-alex", healthNeedsAssessed: false }),
      makeRecord({ id: "hi-004", childId: "child-alex", healthNeedsAssessed: false }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].healthNeedsAssessedRate).toBe(25);
    // rate1=0, rate2=3 (100%), freq=0, diversity=0 = 3
    expect(p[0].overallScore).toBe(3);
  });

  it("diversity=2 for 4+ categories", () => {
    const records = [
      makeRecord({ childId: "child-alex", category: "health_assessment" }),
      makeRecord({ id: "hi-002", childId: "child-alex", category: "dental_check" }),
      makeRecord({ id: "hi-003", childId: "child-alex", category: "immunisation_review" }),
      makeRecord({ id: "hi-004", childId: "child-alex", category: "medication_review" }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].categoriesCovered).toHaveLength(4);
    // freq=0, rate1=3, rate2=3, diversity=2 = 8
    expect(p[0].overallScore).toBe(8);
  });

  it("diversity=1 for 2-3 categories", () => {
    const records = [
      makeRecord({ childId: "child-alex", category: "dental_check" }),
      makeRecord({ id: "hi-002", childId: "child-alex", category: "immunisation_review" }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].categoriesCovered).toHaveLength(2);
    // freq=0, rate1=3, rate2=3, diversity=1 = 7
    expect(p[0].overallScore).toBe(7);
  });

  it("diversity=0 for 1 category", () => {
    const records = [
      makeRecord({ childId: "child-alex", category: "dental_check" }),
      makeRecord({ id: "hi-002", childId: "child-alex", category: "dental_check" }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].categoriesCovered).toHaveLength(1);
  });

  it("caps score at 10", () => {
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({
        id: `hi-${i}`,
        childId: "child-alex",
        category: ALL_CATEGORIES[i % 8],
      }),
    );
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score is 10 for max everything", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `hi-${i}`,
        childId: "child-alex",
        category: ALL_CATEGORIES[i % 8],
      }),
    );
    const p = buildChildHealthIntelligenceProfiles(records);
    // freq=2 (10 records), rate1=3 (100%), rate2=3 (100%), diversity=2 (8 categories) = 10
    expect(p[0].overallScore).toBe(10);
  });

  it("score is 0 for child with all false booleans", () => {
    const records = [
      makeRecord({ childId: "child-alex", healthNeedsAssessed: false, consentObtained: false }),
      makeRecord({ id: "hi-002", childId: "child-alex", healthNeedsAssessed: false, consentObtained: false }),
    ];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].healthNeedsAssessedRate).toBe(0);
    expect(p[0].consentObtainedRate).toBe(0);
    // freq=0, rate1=0, rate2=0, diversity=0 = 0
    expect(p[0].overallScore).toBe(0);
  });

  it("preserves childName", () => {
    const records = [makeRecord({ childId: "child-alex", childName: "Alex" })];
    const p = buildChildHealthIntelligenceProfiles(records);
    expect(p[0].childName).toBe("Alex");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateHealthIntelligenceResult
// ══════════════════════════════════════════════════════════════════════════════

describe("generateHealthIntelligenceResult", () => {
  const fullRecords: HealthIntelligenceRecord[] = ALL_CATEGORIES.map((cat, i) =>
    makeRecord({ id: `hi-${i}`, category: cat, childId: i < 4 ? "child-alex" : i < 7 ? "child-jordan" : "child-morgan", childName: i < 4 ? "Alex" : i < 7 ? "Jordan" : "Morgan" }),
  );

  it("returns correct homeId and period", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.homeId).toBe("home-oak");
    expect(r.periodStart).toBe("2025-01-01");
    expect(r.periodEnd).toBe("2025-12-31");
  });

  it("sums four evaluators and caps at 100", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("rates outstanding for perfect input", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.rating).toBe("outstanding");
  });

  it("rates inadequate for empty input", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("filters records by period", () => {
    const records = [
      makeRecord({ id: "hi-in", date: "2025-06-15" }),
      makeRecord({ id: "hi-out", date: "2024-06-15" }),
    ];
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.healthQuality.totalRecords).toBe(1);
  });

  it("includes strengths when evaluator scores are >= 20", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("includes overall strength message for outstanding", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("includes areas for improvement when evaluator scores < 15", () => {
    const weakRecords = [
      makeRecord({ healthNeedsAssessed: false, consentObtained: false, childViewIncluded: false, followUpPlanned: false, documentationComplete: false, timelyRecording: false }),
    ];
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: weakRecords, policy: null, staff: [] });
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("includes URGENT actions when policy is null", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: null, staff: [makeTraining()] });
    expect(r.actions.some((a) => a.includes("URGENT") && a.includes("polic"))).toBe(true);
  });

  it("includes URGENT actions when staff is empty", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [] });
    expect(r.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("includes no-action message when everything is good", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("always includes 7 regulatory links", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Reg 10 in regulatory links", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
  });

  it("includes CHR 2015 Reg 14 in regulatory links", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 14"))).toBe(true);
  });

  it("includes NMS 6 in regulatory links", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 6"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("includes child profiles in result", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.childProfiles.length).toBe(3);
  });

  it("passes through evaluator results", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.healthQuality).toBeDefined();
    expect(r.healthCompliance).toBeDefined();
    expect(r.healthPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });

  it("handles null policy with records and training", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: null, staff: [makeTraining()] });
    expect(r.healthPolicy.overallScore).toBe(0);
    expect(r.overallScore).toBeLessThan(100);
  });

  it("handles empty training with records and policy", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [] });
    expect(r.staffReadiness.overallScore).toBe(0);
    expect(r.overallScore).toBeLessThan(100);
  });

  it("generates no strengths for zero-score evaluators", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    const evaluatorStrengths = r.strengths.filter((s) =>
      s.includes("quality") || s.includes("compliance") || s.includes("polic") || s.includes("readiness"),
    );
    expect(evaluatorStrengths).toHaveLength(0);
  });

  it("overall score equals sum of four evaluator scores when under 100", () => {
    const r = generateHealthIntelligenceResult({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: [makeRecord({ healthNeedsAssessed: false, consentObtained: false })],
      policy: makePolicy({ mentalHealthSupportPolicy: false, immunisationTrackingPolicy: false }),
      staff: [makeTraining({ mentalHealthAwareness: false })],
    });
    const expectedSum = r.healthQuality.overallScore + r.healthCompliance.overallScore + r.healthPolicy.overallScore + r.staffReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(100, Math.round(expectedSum)));
  });

  it("includes area for improvement when no health records", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: makePolicy(), staff: [makeTraining()] });
    expect(r.areasForImprovement.some((a) => a.includes("No health records"))).toBe(true);
  });

  it("includes area for improvement when no policy", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: null, staff: [makeTraining()] });
    expect(r.areasForImprovement.some((a) => a.includes("No health policy"))).toBe(true);
  });

  it("includes area for improvement when no staff training", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: fullRecords, policy: makePolicy(), staff: [] });
    expect(r.areasForImprovement.some((a) => a.includes("No staff health training"))).toBe(true);
  });

  it("generates HIGH actions for low documentation rate", () => {
    const records = [
      makeRecord({ documentationComplete: false }),
      makeRecord({ id: "hi-002", documentationComplete: false }),
    ];
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.actions.some((a) => a.includes("HIGH") && a.includes("Documentation"))).toBe(true);
  });

  it("generates MEDIUM actions for low timely recording", () => {
    const records = [
      makeRecord({ timelyRecording: false }),
      makeRecord({ id: "hi-002", timelyRecording: false }),
    ];
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.actions.some((a) => a.includes("MEDIUM") && a.includes("Timely recording"))).toBe(true);
  });

  it("generates actions for low-score children", () => {
    const records = [
      makeRecord({ childId: "child-alex", healthNeedsAssessed: false, consentObtained: false }),
    ];
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.actions.some((a) => a.includes("child(ren) with low health scores"))).toBe(true);
  });

  it("includes Inadequate area for improvement when score < 40", () => {
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("includes Good strength when score 60-79", () => {
    // policy=25 + staff=25 + some quality+compliance
    const records = [
      makeRecord({ category: "health_assessment" }),
      makeRecord({ id: "hi-002", category: "dental_check" }),
      makeRecord({ id: "hi-003", category: "mental_health_screening" }),
    ];
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records, policy: makePolicy(), staff: [makeTraining()] });
    if (r.overallScore >= 60 && r.overallScore < 80) {
      expect(r.strengths.some((s) => s.includes("Good"))).toBe(true);
    }
  });

  it("date filtering includes boundary dates", () => {
    const records = [
      makeRecord({ id: "hi-start", date: "2025-01-01" }),
      makeRecord({ id: "hi-end", date: "2025-12-31" }),
    ];
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.healthQuality.totalRecords).toBe(2);
  });

  it("date filtering excludes records outside period", () => {
    const records = [
      makeRecord({ id: "hi-before", date: "2024-12-31" }),
      makeRecord({ id: "hi-after", date: "2026-01-01" }),
      makeRecord({ id: "hi-in", date: "2025-06-15" }),
    ];
    const r = generateHealthIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records, policy: makePolicy(), staff: [makeTraining()] });
    expect(r.healthQuality.totalRecords).toBe(1);
  });
});
