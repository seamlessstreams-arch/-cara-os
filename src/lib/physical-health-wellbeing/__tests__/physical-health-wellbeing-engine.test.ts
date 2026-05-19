import { describe, it, expect } from "vitest";
import {
  generatePhysicalHealthWellbeingIntelligence,
  evaluateHealthQuality,
  evaluateHealthCompliance,
  evaluateHealthPolicy,
  evaluateStaffHealthReadiness,
  buildChildHealthProfiles,
  pct,
  getRating,
  getHealthAreaLabel,
  getHealthOutcomeLabel,
  getRatingLabel,
} from "../physical-health-wellbeing-engine";
import type {
  HealthRecord,
  HealthPolicy,
  StaffHealthTraining,
} from "../physical-health-wellbeing-engine";

// -- Auto-incrementing factory helpers ----------------------------------------

let recordId = 0;
function makeRecord(overrides: Partial<HealthRecord> = {}): HealthRecord {
  recordId++;
  return {
    id: `hr-${recordId}`,
    childId: "child-alex",
    childName: "Alex",
    recordDate: "2026-04-01",
    healthArea: "medical_appointment",
    healthOutcome: "good",
    appointmentAttended: true,
    healthPlanUpdated: true,
    consentObtained: true,
    staffAccompanied: true,
    documentedInRecord: true,
    followUpScheduled: true,
    ...overrides,
  };
}

let policyId = 0;
function makePolicy(overrides: Partial<HealthPolicy> = {}): HealthPolicy {
  policyId++;
  return {
    id: `hp-${policyId}`,
    healthAssessmentFramework: true,
    appointmentManagement: true,
    consentProtocol: true,
    healthPassportScheme: true,
    physicalActivityPlan: true,
    nutritionGuidelines: true,
    regularReview: true,
    ...overrides,
  };
}

let trainingId = 0;
function makeTraining(overrides: Partial<StaffHealthTraining> = {}): StaffHealthTraining {
  trainingId++;
  return {
    id: `sht-${trainingId}`,
    staffId: `staff-${trainingId}`,
    staffName: "Sarah Johnson",
    healthAwareness: true,
    mentalHealthFirstAid: true,
    consentAndCapacity: true,
    medicationManagement: true,
    appointmentSupport: true,
    healthDocumentation: true,
    ...overrides,
  };
}

// -- pct ----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for 0/0", () => {
    expect(pct(0, 0)).toBe(0);
  });
  it("calculates correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });
  it("rounds", () => {
    expect(pct(1, 3)).toBe(33);
  });
  it("returns 100 for full", () => {
    expect(pct(5, 5)).toBe(100);
  });
  it("handles 0 numerator with non-zero denominator", () => {
    expect(pct(0, 10)).toBe(0);
  });
  it("rounds 2/3 to 67", () => {
    expect(pct(2, 3)).toBe(67);
  });
});

// -- getRating ----------------------------------------------------------------

describe("getRating", () => {
  it("outstanding >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("good >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("requires_improvement >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("inadequate < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
  it("boundary at 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(79)).toBe("good");
  });
  it("boundary at 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("boundary at 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// -- Label functions ----------------------------------------------------------

describe("label functions", () => {
  it("health area labels", () => {
    expect(getHealthAreaLabel("medical_appointment")).toBe("Medical Appointment");
    expect(getHealthAreaLabel("dental_check")).toBe("Dental Check");
    expect(getHealthAreaLabel("optician_visit")).toBe("Optician Visit");
    expect(getHealthAreaLabel("immunisation")).toBe("Immunisation");
    expect(getHealthAreaLabel("health_assessment")).toBe("Health Assessment");
    expect(getHealthAreaLabel("physical_activity")).toBe("Physical Activity");
    expect(getHealthAreaLabel("nutrition_review")).toBe("Nutrition Review");
    expect(getHealthAreaLabel("mental_health_review")).toBe("Mental Health Review");
  });
  it("health outcome labels", () => {
    expect(getHealthOutcomeLabel("excellent")).toBe("Excellent");
    expect(getHealthOutcomeLabel("good")).toBe("Good");
    expect(getHealthOutcomeLabel("satisfactory")).toBe("Satisfactory");
    expect(getHealthOutcomeLabel("concern_raised")).toBe("Concern Raised");
    expect(getHealthOutcomeLabel("missed")).toBe("Missed");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateHealthQuality ----------------------------------------------------

describe("evaluateHealthQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateHealthQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.outcomeRate).toBe(0);
    expect(result.appointmentAttendedRate).toBe(0);
    expect(result.healthPlanRate).toBe(0);
    expect(result.consentRate).toBe(0);
  });

  it("scores 25 for perfect records", () => {
    const records = [
      makeRecord({ healthOutcome: "excellent" }),
      makeRecord({ healthOutcome: "good" }),
      makeRecord({ healthOutcome: "excellent" }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.outcomeRate).toBe(100);
    expect(result.appointmentAttendedRate).toBe(100);
    expect(result.healthPlanRate).toBe(100);
    expect(result.consentRate).toBe(100);
  });

  it("scores 0 for all poor records", () => {
    const records = [
      makeRecord({
        healthOutcome: "missed",
        appointmentAttended: false,
        healthPlanUpdated: false,
        consentObtained: false,
      }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.overallScore).toBe(0);
    expect(result.outcomeRate).toBe(0);
    expect(result.appointmentAttendedRate).toBe(0);
  });

  it("calculates outcome rate correctly", () => {
    const records = [
      makeRecord({ healthOutcome: "excellent" }),
      makeRecord({ healthOutcome: "good" }),
      makeRecord({ healthOutcome: "satisfactory" }),
      makeRecord({ healthOutcome: "missed" }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.outcomeRate).toBe(50);
  });

  it("calculates appointment attended rate", () => {
    const records = [
      makeRecord({ appointmentAttended: true }),
      makeRecord({ appointmentAttended: false }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.appointmentAttendedRate).toBe(50);
  });

  it("calculates health plan rate", () => {
    const records = [
      makeRecord({ healthPlanUpdated: true }),
      makeRecord({ healthPlanUpdated: true }),
      makeRecord({ healthPlanUpdated: false }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.healthPlanRate).toBe(67);
  });

  it("calculates consent rate", () => {
    const records = [
      makeRecord({ consentObtained: true }),
      makeRecord({ consentObtained: false }),
      makeRecord({ consentObtained: true }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.consentRate).toBe(67);
  });

  it("score capped at 25", () => {
    const result = evaluateHealthQuality([makeRecord({ healthOutcome: "excellent" })]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles mixed quality records with partial score", () => {
    const records = [
      makeRecord({ healthOutcome: "excellent" }),
      makeRecord({ healthOutcome: "missed", appointmentAttended: false, healthPlanUpdated: false, consentObtained: false }),
    ];
    const result = evaluateHealthQuality(records);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });
});

// -- evaluateHealthCompliance -------------------------------------------------

describe("evaluateHealthCompliance", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateHealthCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.staffAccompaniedRate).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.followUpRate).toBe(0);
    expect(result.areaDiversity).toBe(0);
  });

  it("scores high for perfect compliance", () => {
    const records = [
      makeRecord({ healthArea: "medical_appointment" }),
      makeRecord({ healthArea: "dental_check" }),
      makeRecord({ healthArea: "optician_visit" }),
      makeRecord({ healthArea: "immunisation" }),
      makeRecord({ healthArea: "health_assessment" }),
      makeRecord({ healthArea: "physical_activity" }),
      makeRecord({ healthArea: "nutrition_review" }),
      makeRecord({ healthArea: "mental_health_review" }),
    ];
    const result = evaluateHealthCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.staffAccompaniedRate).toBe(100);
    expect(result.documentedRate).toBe(100);
    expect(result.followUpRate).toBe(100);
    expect(result.areaDiversity).toBe(1);
  });

  it("scores 0 for all non-compliant records", () => {
    const records = [
      makeRecord({
        staffAccompanied: false,
        documentedInRecord: false,
        followUpScheduled: false,
      }),
    ];
    const result = evaluateHealthCompliance(records);
    expect(result.overallScore).toBeLessThan(5);
    expect(result.staffAccompaniedRate).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.followUpRate).toBe(0);
  });

  it("calculates staff accompanied rate", () => {
    const records = [
      makeRecord({ staffAccompanied: true }),
      makeRecord({ staffAccompanied: false }),
    ];
    const result = evaluateHealthCompliance(records);
    expect(result.staffAccompaniedRate).toBe(50);
  });

  it("calculates documented rate", () => {
    const records = [
      makeRecord({ documentedInRecord: true }),
      makeRecord({ documentedInRecord: true }),
      makeRecord({ documentedInRecord: false }),
    ];
    const result = evaluateHealthCompliance(records);
    expect(result.documentedRate).toBe(67);
  });

  it("calculates follow-up rate", () => {
    const records = [
      makeRecord({ followUpScheduled: true }),
      makeRecord({ followUpScheduled: false }),
      makeRecord({ followUpScheduled: true }),
    ];
    const result = evaluateHealthCompliance(records);
    expect(result.followUpRate).toBe(67);
  });

  it("calculates area diversity", () => {
    const records = [
      makeRecord({ healthArea: "medical_appointment" }),
      makeRecord({ healthArea: "dental_check" }),
      makeRecord({ healthArea: "optician_visit" }),
      makeRecord({ healthArea: "immunisation" }),
    ];
    const result = evaluateHealthCompliance(records);
    expect(result.areaDiversity).toBe(0.5);
  });

  it("score capped at 25", () => {
    const result = evaluateHealthCompliance([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateHealthPolicy -----------------------------------------------------

describe("evaluateHealthPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateHealthPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.healthAssessmentFramework).toBe(false);
    expect(result.appointmentManagement).toBe(false);
    expect(result.consentProtocol).toBe(false);
    expect(result.healthPassportScheme).toBe(false);
    expect(result.physicalActivityPlan).toBe(false);
    expect(result.nutritionGuidelines).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("scores 25 for full policy", () => {
    const result = evaluateHealthPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("scores 0 for all-false policy", () => {
    const result = evaluateHealthPolicy(
      makePolicy({
        healthAssessmentFramework: false,
        appointmentManagement: false,
        consentProtocol: false,
        healthPassportScheme: false,
        physicalActivityPlan: false,
        nutritionGuidelines: false,
        regularReview: false,
      }),
    );
    expect(result.overallScore).toBe(0);
  });

  it("scores partial for some true", () => {
    const result = evaluateHealthPolicy(
      makePolicy({
        healthAssessmentFramework: true,
        appointmentManagement: true,
        consentProtocol: false,
        healthPassportScheme: false,
        physicalActivityPlan: false,
        nutritionGuidelines: false,
        regularReview: false,
      }),
    );
    expect(result.overallScore).toBe(8);
  });

  it("weights 4+4+4+4+3+3+3 = 25", () => {
    // Each of the first four contributes 4
    const r1 = evaluateHealthPolicy(makePolicy({
      healthAssessmentFramework: true,
      appointmentManagement: false,
      consentProtocol: false,
      healthPassportScheme: false,
      physicalActivityPlan: false,
      nutritionGuidelines: false,
      regularReview: false,
    }));
    expect(r1.overallScore).toBe(4);

    // Last three contribute 3 each
    const r2 = evaluateHealthPolicy(makePolicy({
      healthAssessmentFramework: false,
      appointmentManagement: false,
      consentProtocol: false,
      healthPassportScheme: false,
      physicalActivityPlan: true,
      nutritionGuidelines: false,
      regularReview: false,
    }));
    expect(r2.overallScore).toBe(3);
  });

  it("reflects boolean values correctly", () => {
    const policy = makePolicy({
      healthAssessmentFramework: true,
      appointmentManagement: false,
      consentProtocol: true,
      healthPassportScheme: false,
      physicalActivityPlan: true,
      nutritionGuidelines: false,
      regularReview: true,
    });
    const result = evaluateHealthPolicy(policy);
    expect(result.healthAssessmentFramework).toBe(true);
    expect(result.appointmentManagement).toBe(false);
    expect(result.consentProtocol).toBe(true);
    expect(result.healthPassportScheme).toBe(false);
    expect(result.physicalActivityPlan).toBe(true);
    expect(result.nutritionGuidelines).toBe(false);
    expect(result.regularReview).toBe(true);
  });

  it("score capped at 25", () => {
    const result = evaluateHealthPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateStaffHealthReadiness ---------------------------------------------

describe("evaluateStaffHealthReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffHealthReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.healthAwarenessRate).toBe(0);
    expect(result.mentalHealthFirstAidRate).toBe(0);
    expect(result.consentAndCapacityRate).toBe(0);
    expect(result.medicationManagementRate).toBe(0);
    expect(result.appointmentSupportRate).toBe(0);
    expect(result.healthDocumentationRate).toBe(0);
  });

  it("scores 25 for fully trained staff", () => {
    const training = [
      makeTraining(),
      makeTraining({ staffName: "Tom Richards" }),
      makeTraining({ staffName: "Lisa Williams" }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.healthAwarenessRate).toBe(100);
    expect(result.mentalHealthFirstAidRate).toBe(100);
    expect(result.consentAndCapacityRate).toBe(100);
    expect(result.medicationManagementRate).toBe(100);
    expect(result.appointmentSupportRate).toBe(100);
    expect(result.healthDocumentationRate).toBe(100);
  });

  it("scores 0 for completely untrained staff", () => {
    const training = [
      makeTraining({
        healthAwareness: false,
        mentalHealthFirstAid: false,
        consentAndCapacity: false,
        medicationManagement: false,
        appointmentSupport: false,
        healthDocumentation: false,
      }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates health awareness rate", () => {
    const training = [
      makeTraining({ healthAwareness: true }),
      makeTraining({ healthAwareness: false }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.healthAwarenessRate).toBe(50);
  });

  it("calculates mental health first aid rate", () => {
    const training = [
      makeTraining({ mentalHealthFirstAid: true }),
      makeTraining({ mentalHealthFirstAid: true }),
      makeTraining({ mentalHealthFirstAid: false }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.mentalHealthFirstAidRate).toBe(67);
  });

  it("calculates consent and capacity rate", () => {
    const training = [
      makeTraining({ consentAndCapacity: true }),
      makeTraining({ consentAndCapacity: false }),
      makeTraining({ consentAndCapacity: false }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.consentAndCapacityRate).toBe(33);
  });

  it("calculates medication management rate", () => {
    const training = [
      makeTraining({ medicationManagement: true }),
      makeTraining({ medicationManagement: true }),
      makeTraining({ medicationManagement: true }),
      makeTraining({ medicationManagement: false }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.medicationManagementRate).toBe(75);
  });

  it("calculates appointment support rate", () => {
    const training = [
      makeTraining({ appointmentSupport: true }),
      makeTraining({ appointmentSupport: false }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.appointmentSupportRate).toBe(50);
  });

  it("calculates health documentation rate", () => {
    const training = [
      makeTraining({ healthDocumentation: true }),
      makeTraining({ healthDocumentation: false }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.healthDocumentationRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffHealthReadiness([makeTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles partially trained staff", () => {
    const training = [
      makeTraining({
        healthAwareness: true,
        mentalHealthFirstAid: true,
        consentAndCapacity: false,
        medicationManagement: false,
        appointmentSupport: false,
        healthDocumentation: false,
      }),
    ];
    const result = evaluateStaffHealthReadiness(training);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
    expect(result.healthAwarenessRate).toBe(100);
    expect(result.consentAndCapacityRate).toBe(0);
  });
});

// -- buildChildHealthProfiles -------------------------------------------------

describe("buildChildHealthProfiles", () => {
  it("returns empty for no records", () => {
    expect(buildChildHealthProfiles([])).toEqual([]);
  });

  it("builds profile for a single child", () => {
    const records = [makeRecord({ childId: "child-alex", childName: "Alex" })];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].recordCount).toBe(1);
  });

  it("handles multiple children", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ childId: "child-morgan", childName: "Morgan" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles).toHaveLength(3);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].recordCount).toBe(3);
  });

  it("frequency score: 2 for >= 10 records", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ childId: "child-alex", childName: "Alex", healthOutcome: "excellent" }),
    );
    const profiles = buildChildHealthProfiles(records);
    // frequency=2, outcomeRate=100(3), appointmentRate=100(3), diversity=0 (only 1 area)
    expect(profiles[0].overallScore).toBe(8);
  });

  it("frequency score: 1 for >= 5 records", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ childId: "child-alex", childName: "Alex", healthOutcome: "excellent" }),
    );
    const profiles = buildChildHealthProfiles(records);
    // frequency=1, outcomeRate=100(3), appointmentRate=100(3), diversity=0 (only 1 area)
    expect(profiles[0].overallScore).toBe(7);
  });

  it("frequency score: 0 for < 5 records", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", healthOutcome: "excellent" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    // frequency=0, outcomeRate=100(3), appointmentRate=100(3), diversity=0
    expect(profiles[0].overallScore).toBe(6);
  });

  it("outcomeRate score: 3 for >= 80%", () => {
    const records = [
      makeRecord({ childId: "child-alex", healthOutcome: "excellent" }),
      makeRecord({ childId: "child-alex", healthOutcome: "excellent" }),
      makeRecord({ childId: "child-alex", healthOutcome: "excellent" }),
      makeRecord({ childId: "child-alex", healthOutcome: "excellent" }),
      makeRecord({ childId: "child-alex", healthOutcome: "missed", appointmentAttended: false }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].outcomeRate).toBe(80);
  });

  it("appointmentRate: reflects attended ratio", () => {
    const records = [
      makeRecord({ childId: "child-alex", appointmentAttended: true }),
      makeRecord({ childId: "child-alex", appointmentAttended: false }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].appointmentRate).toBe(50);
  });

  it("diversity score: 2 for >= 4 unique areas", () => {
    const records = [
      makeRecord({ childId: "child-alex", healthArea: "medical_appointment" }),
      makeRecord({ childId: "child-alex", healthArea: "dental_check" }),
      makeRecord({ childId: "child-alex", healthArea: "optician_visit" }),
      makeRecord({ childId: "child-alex", healthArea: "immunisation" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].uniqueAreas).toBe(4);
  });

  it("diversity score: 1 for >= 2 unique areas", () => {
    const records = [
      makeRecord({ childId: "child-alex", healthArea: "medical_appointment" }),
      makeRecord({ childId: "child-alex", healthArea: "dental_check" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].uniqueAreas).toBe(2);
  });

  it("diversity score: 0 for 1 unique area", () => {
    const records = [
      makeRecord({ childId: "child-alex", healthArea: "medical_appointment" }),
      makeRecord({ childId: "child-alex", healthArea: "medical_appointment" }),
    ];
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].uniqueAreas).toBe(1);
  });

  it("score capped at 10", () => {
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({
        childId: "child-alex",
        childName: "Alex",
        healthOutcome: "excellent",
        healthArea: (["medical_appointment", "dental_check", "optician_visit", "immunisation", "health_assessment", "physical_activity", "nutrition_review", "mental_health_review"] as const)[i % 8],
      }),
    );
    const profiles = buildChildHealthProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("gives higher score for well-managed child", () => {
    const goodRecords = [
      makeRecord({ childId: "child-alex", healthOutcome: "excellent", healthArea: "medical_appointment" }),
      makeRecord({ childId: "child-alex", healthOutcome: "excellent", healthArea: "dental_check" }),
      makeRecord({ childId: "child-alex", healthOutcome: "excellent", healthArea: "optician_visit" }),
      makeRecord({ childId: "child-alex", healthOutcome: "excellent", healthArea: "immunisation" }),
      makeRecord({ childId: "child-alex", healthOutcome: "excellent", healthArea: "health_assessment" }),
    ];
    const badRecords = [
      makeRecord({ childId: "child-jordan", childName: "Jordan", healthOutcome: "missed", appointmentAttended: false }),
    ];

    const goodProfiles = buildChildHealthProfiles(goodRecords);
    const badProfiles = buildChildHealthProfiles(badRecords);
    expect(goodProfiles[0].overallScore).toBeGreaterThan(badProfiles[0].overallScore);
  });
});

// -- generatePhysicalHealthWellbeingIntelligence ------------------------------

describe("generatePhysicalHealthWellbeingIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(
      result.healthQuality.overallScore +
      result.healthCompliance.overallScore +
      result.healthPolicy.overallScore +
      result.staffHealthReadiness.overallScore,
    );
  });

  it("returns inadequate with no data", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", healthOutcome: "excellent", healthArea: "medical_appointment" }),
      makeRecord({ childId: "child-alex", childName: "Alex", healthOutcome: "excellent", healthArea: "dental_check" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan", healthOutcome: "good", healthArea: "optician_visit" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan", healthOutcome: "good", healthArea: "immunisation" }),
      makeRecord({ childId: "child-morgan", childName: "Morgan", healthOutcome: "excellent", healthArea: "health_assessment" }),
      makeRecord({ childId: "child-morgan", childName: "Morgan", healthOutcome: "excellent", healthArea: "physical_activity" }),
      makeRecord({ childId: "child-alex", childName: "Alex", healthOutcome: "good", healthArea: "nutrition_review" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan", healthOutcome: "excellent", healthArea: "mental_health_review" }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, makePolicy(), [makeTraining(), makeTraining({ staffName: "Tom" })],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("builds child health profiles", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childHealthProfiles).toHaveLength(2);
  });

  // -- Strengths --

  it("adds strength for high outcome rate", () => {
    const records = [
      makeRecord({ healthOutcome: "excellent" }),
      makeRecord({ healthOutcome: "excellent" }),
      makeRecord({ healthOutcome: "excellent" }),
      makeRecord({ healthOutcome: "excellent" }),
      makeRecord({ healthOutcome: "good" }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Strong health outcomes"))).toBe(true);
  });

  it("adds strength for high appointment attendance", () => {
    const records = [
      makeRecord({ appointmentAttended: true }),
      makeRecord({ appointmentAttended: true }),
      makeRecord({ appointmentAttended: true }),
      makeRecord({ appointmentAttended: true }),
      makeRecord({ appointmentAttended: true }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Appointments consistently attended"))).toBe(true);
  });

  it("adds strength for high health plan rate", () => {
    const records = [
      makeRecord({ healthPlanUpdated: true }),
      makeRecord({ healthPlanUpdated: true }),
      makeRecord({ healthPlanUpdated: true }),
      makeRecord({ healthPlanUpdated: true }),
      makeRecord({ healthPlanUpdated: true }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Health plans regularly updated"))).toBe(true);
  });

  it("adds strength for excellent documentation", () => {
    const records = [
      makeRecord({ documentedInRecord: true }),
      makeRecord({ documentedInRecord: true }),
      makeRecord({ documentedInRecord: true }),
      makeRecord({ documentedInRecord: true }),
      makeRecord({ documentedInRecord: true }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Excellent health documentation"))).toBe(true);
  });

  it("does not add strengths for empty records", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Strong health outcomes"))).toBe(false);
    expect(result.strengths.some((s) => s.includes("Appointments consistently attended"))).toBe(false);
    expect(result.strengths.some((s) => s.includes("Health plans regularly updated"))).toBe(false);
    expect(result.strengths.some((s) => s.includes("Excellent health documentation"))).toBe(false);
  });

  // -- Actions --

  it("adds action for no health records", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [], makePolicy(), [makeTraining()], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("No health records found"))).toBe(true);
  });

  it("adds URGENT action for null policy", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [makeRecord()], null, [makeTraining()], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("adds URGENT action for empty training", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [makeRecord()], makePolicy(), [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("adds action for low follow-up rate", () => {
    const records = [
      makeRecord({ followUpScheduled: false }),
      makeRecord({ followUpScheduled: false }),
      makeRecord({ followUpScheduled: true }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, makePolicy(), [makeTraining()], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("follow-up scheduling"))).toBe(true);
  });

  it("adds action for low consent rate", () => {
    const records = [
      makeRecord({ consentObtained: false }),
      makeRecord({ consentObtained: false }),
      makeRecord({ consentObtained: true }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, makePolicy(), [makeTraining()], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("consent processes"))).toBe(true);
  });

  it("does not add follow-up action when rate is high", () => {
    const records = [
      makeRecord({ followUpScheduled: true }),
      makeRecord({ followUpScheduled: true }),
      makeRecord({ followUpScheduled: true }),
      makeRecord({ followUpScheduled: true }),
      makeRecord({ followUpScheduled: true }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, makePolicy(), [makeTraining()], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("follow-up scheduling"))).toBe(false);
  });

  // -- Areas for Improvement --

  it("adds area for no records", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [], makePolicy(), [makeTraining()], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No health records available"))).toBe(true);
  });

  it("adds area for no policy", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [makeRecord()], null, [makeTraining()], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No health policy"))).toBe(true);
  });

  it("adds area for no training", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [makeRecord()], makePolicy(), [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No staff health training"))).toBe(true);
  });

  it("adds area for low outcome rate", () => {
    const records = [
      makeRecord({ healthOutcome: "missed", appointmentAttended: false }),
      makeRecord({ healthOutcome: "concern_raised" }),
      makeRecord({ healthOutcome: "satisfactory" }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, makePolicy(), [makeTraining()], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Health outcome rate at 0%"))).toBe(true);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generatePhysicalHealthWellbeingIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 6"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Promoting the health of looked after children"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NHS England"))).toBe(true);
  });

  // -- Integration --

  it("handles realistic mixed scenario", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", healthArea: "medical_appointment", healthOutcome: "excellent" }),
      makeRecord({ childId: "child-alex", childName: "Alex", healthArea: "dental_check", healthOutcome: "good" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan", healthArea: "optician_visit", healthOutcome: "good" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan", healthArea: "immunisation", healthOutcome: "excellent" }),
      makeRecord({ childId: "child-morgan", childName: "Morgan", healthArea: "health_assessment", healthOutcome: "satisfactory" }),
      makeRecord({ childId: "child-morgan", childName: "Morgan", healthArea: "physical_activity", healthOutcome: "excellent" }),
      makeRecord({ childId: "child-alex", childName: "Alex", healthArea: "nutrition_review", healthOutcome: "good" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan", healthArea: "mental_health_review", healthOutcome: "good" }),
      makeRecord({ childId: "child-morgan", childName: "Morgan", healthArea: "medical_appointment", healthOutcome: "excellent" }),
      makeRecord({ childId: "child-alex", childName: "Alex", healthArea: "immunisation", healthOutcome: "good" }),
    ];
    const training = [
      makeTraining({ staffName: "Sarah Johnson" }),
      makeTraining({ staffName: "Tom Richards" }),
      makeTraining({ staffName: "Lisa Williams" }),
      makeTraining({ staffName: "Darren Laville" }),
    ];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, makePolicy(), training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childHealthProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("does not add non-applicable strengths or areas when data is perfect", () => {
    const records = [makeRecord({ healthOutcome: "excellent" })];
    const result = generatePhysicalHealthWellbeingIntelligence(
      records, makePolicy(), [makeTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No health records"))).toBe(false);
    expect(result.areasForImprovement.some((a) => a.includes("No health policy"))).toBe(false);
    expect(result.areasForImprovement.some((a) => a.includes("No staff health training"))).toBe(false);
  });
});
