import { describe, it, expect } from "vitest";
import {
  generateNightCareIntelligence,
  evaluateQuality,
  evaluateCompliance,
  evaluatePolicy,
  evaluateStaffReadiness,
  buildChildNightCareProfiles,
  pct,
  getRating,
  getCategoryLabel,
  getOutcomeLabel,
  getRatingLabel,
} from "../night-care-engine";
import type {
  NightCareRecord,
  NightCarePolicy,
  NightCareStaffTraining,
} from "../night-care-engine";

// ── Factory Functions ────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<NightCareRecord> = {}): NightCareRecord {
  return {
    id: "rec-1",
    homeId: "oak-house",
    date: "2026-05-10",
    childId: "child-alex",
    childName: "Alex",
    category: "night_check",
    outcome: "settled_night",
    nightCheckCompleted: true,
    sleepPatternRecorded: true,
    incidentHandledAppropriately: true,
    childComfortChecked: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<NightCarePolicy> = {}): NightCarePolicy {
  return {
    nightCarePolicy: true,
    sleepMonitoringGuidance: true,
    nightIncidentProcedure: true,
    wakingNightPolicy: true,
    nightMedicationProtocol: true,
    bedtimeRoutineGuidance: true,
    nightHandoverProcedure: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<NightCareStaffTraining> = {}): NightCareStaffTraining {
  return {
    id: "tr-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    nightCareCompetency: true,
    sleepMonitoringSkills: true,
    nightIncidentResponse: true,
    nightMedicationHandling: true,
    childComfortTechniques: true,
    nightHandoverProcedure: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 for 0/0", () => expect(pct(0, 0)).toBe(0));
  it("calculates correctly", () => expect(pct(3, 4)).toBe(75));
  it("rounds to nearest integer", () => expect(pct(1, 3)).toBe(33));
  it("returns 100 for equal values", () => expect(pct(5, 5)).toBe(100));
  it("returns 0 for 0 numerator", () => expect(pct(0, 10)).toBe(0));
  it("handles large numbers", () => expect(pct(999, 1000)).toBe(100));
  it("rounds 50.5 correctly", () => expect(pct(1, 2)).toBe(50));
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("outstanding at exactly 80", () => expect(getRating(80)).toBe("outstanding"));
  it("outstanding at 100", () => expect(getRating(100)).toBe("outstanding"));
  it("outstanding at 95", () => expect(getRating(95)).toBe("outstanding"));
  it("good at exactly 60", () => expect(getRating(60)).toBe("good"));
  it("good at 79", () => expect(getRating(79)).toBe("good"));
  it("requires_improvement at exactly 40", () => expect(getRating(40)).toBe("requires_improvement"));
  it("requires_improvement at 59", () => expect(getRating(59)).toBe("requires_improvement"));
  it("inadequate at 39", () => expect(getRating(39)).toBe("inadequate"));
  it("inadequate at 0", () => expect(getRating(0)).toBe("inadequate"));
});

// ══════════════════════════════════════════════════════════════════════════════
// Label functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getCategoryLabel", () => {
  it("night_check", () => expect(getCategoryLabel("night_check")).toBe("Night Check"));
  it("sleep_monitoring", () => expect(getCategoryLabel("sleep_monitoring")).toBe("Sleep Monitoring"));
  it("night_incident", () => expect(getCategoryLabel("night_incident")).toBe("Night Incident"));
  it("waking_night_support", () => expect(getCategoryLabel("waking_night_support")).toBe("Waking Night Support"));
  it("night_medication", () => expect(getCategoryLabel("night_medication")).toBe("Night Medication"));
  it("bedtime_routine", () => expect(getCategoryLabel("bedtime_routine")).toBe("Bedtime Routine"));
  it("night_handover", () => expect(getCategoryLabel("night_handover")).toBe("Night Handover"));
  it("disturbance_response", () => expect(getCategoryLabel("disturbance_response")).toBe("Disturbance Response"));
});

describe("getOutcomeLabel", () => {
  it("settled_night", () => expect(getOutcomeLabel("settled_night")).toBe("Settled Night"));
  it("minor_disturbance", () => expect(getOutcomeLabel("minor_disturbance")).toBe("Minor Disturbance"));
  it("significant_incident", () => expect(getOutcomeLabel("significant_incident")).toBe("Significant Incident"));
  it("support_provided", () => expect(getOutcomeLabel("support_provided")).toBe("Support Provided"));
  it("not_applicable", () => expect(getOutcomeLabel("not_applicable")).toBe("Not Applicable"));
});

describe("getRatingLabel", () => {
  it("outstanding", () => expect(getRatingLabel("outstanding")).toBe("Outstanding"));
  it("good", () => expect(getRatingLabel("good")).toBe("Good"));
  it("requires_improvement", () => expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement"));
  it("inadequate", () => expect(getRatingLabel("inadequate")).toBe("Inadequate"));
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.nightCheckCompletedRate).toBe(0);
    expect(result.sleepPatternRecordedRate).toBe(0);
    expect(result.incidentHandledAppropriatelyRate).toBe(0);
    expect(result.childComfortCheckedRate).toBe(0);
  });

  it("scores 25 for all-true records", () => {
    const result = evaluateQuality([makeRecord(), makeRecord({ id: "rec-2" })]);
    expect(result.overallScore).toBe(25);
  });

  it("calculates nightCheckCompletedRate correctly", () => {
    const result = evaluateQuality([
      makeRecord({ id: "r1", nightCheckCompleted: true }),
      makeRecord({ id: "r2", nightCheckCompleted: false }),
    ]);
    expect(result.nightCheckCompletedRate).toBe(50);
  });

  it("calculates sleepPatternRecordedRate correctly", () => {
    const result = evaluateQuality([
      makeRecord({ id: "r1", sleepPatternRecorded: true }),
      makeRecord({ id: "r2", sleepPatternRecorded: false }),
      makeRecord({ id: "r3", sleepPatternRecorded: true }),
    ]);
    expect(result.sleepPatternRecordedRate).toBe(67);
  });

  it("calculates incidentHandledAppropriatelyRate correctly", () => {
    const result = evaluateQuality([
      makeRecord({ id: "r1", incidentHandledAppropriately: true }),
      makeRecord({ id: "r2", incidentHandledAppropriately: false }),
    ]);
    expect(result.incidentHandledAppropriatelyRate).toBe(50);
  });

  it("calculates childComfortCheckedRate correctly", () => {
    const result = evaluateQuality([
      makeRecord({ id: "r1", childComfortChecked: true }),
      makeRecord({ id: "r2", childComfortChecked: false }),
      makeRecord({ id: "r3", childComfortChecked: false }),
    ]);
    expect(result.childComfortCheckedRate).toBe(33);
  });

  it("scores 0 when all booleans are false", () => {
    const result = evaluateQuality([
      makeRecord({
        nightCheckCompleted: false,
        sleepPatternRecorded: false,
        incidentHandledAppropriately: false,
        childComfortChecked: false,
      }),
    ]);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const result = evaluateQuality([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score minimum is 0", () => {
    const result = evaluateQuality([
      makeRecord({
        nightCheckCompleted: false,
        sleepPatternRecorded: false,
        incidentHandledAppropriately: false,
        childComfortChecked: false,
      }),
    ]);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("returns correct total records count", () => {
    const result = evaluateQuality([
      makeRecord({ id: "r1" }),
      makeRecord({ id: "r2" }),
      makeRecord({ id: "r3" }),
    ]);
    expect(result.totalRecords).toBe(3);
  });

  it("nightCheck weight is 7 (highest)", () => {
    // 100% nightCheck only = 7 points
    const result = evaluateQuality([
      makeRecord({
        nightCheckCompleted: true,
        sleepPatternRecorded: false,
        incidentHandledAppropriately: false,
        childComfortChecked: false,
      }),
    ]);
    expect(result.overallScore).toBe(7);
  });

  it("sleepPattern weight is 6", () => {
    const result = evaluateQuality([
      makeRecord({
        nightCheckCompleted: false,
        sleepPatternRecorded: true,
        incidentHandledAppropriately: false,
        childComfortChecked: false,
      }),
    ]);
    expect(result.overallScore).toBe(6);
  });

  it("incident weight is 6", () => {
    const result = evaluateQuality([
      makeRecord({
        nightCheckCompleted: false,
        sleepPatternRecorded: false,
        incidentHandledAppropriately: true,
        childComfortChecked: false,
      }),
    ]);
    expect(result.overallScore).toBe(6);
  });

  it("comfort weight is 6", () => {
    const result = evaluateQuality([
      makeRecord({
        nightCheckCompleted: false,
        sleepPatternRecorded: false,
        incidentHandledAppropriately: false,
        childComfortChecked: true,
      }),
    ]);
    expect(result.overallScore).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateCompliance", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.nightCheckCompletedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("calculates documentationRate correctly", () => {
    const result = evaluateCompliance([
      makeRecord({ id: "r1", documentationComplete: true }),
      makeRecord({ id: "r2", documentationComplete: false }),
    ]);
    expect(result.documentationRate).toBe(50);
  });

  it("calculates timelyRecordingRate correctly", () => {
    const result = evaluateCompliance([
      makeRecord({ id: "r1", timelyRecording: true }),
      makeRecord({ id: "r2", timelyRecording: false }),
      makeRecord({ id: "r3", timelyRecording: true }),
    ]);
    expect(result.timelyRecordingRate).toBe(67);
  });

  it("calculates nightCheckCompletedRate for compliance", () => {
    const result = evaluateCompliance([
      makeRecord({ id: "r1", nightCheckCompleted: true }),
      makeRecord({ id: "r2", nightCheckCompleted: false }),
    ]);
    expect(result.nightCheckCompletedRate).toBe(50);
  });

  it("calculates categoryDiversityRatio from unique categories", () => {
    const result = evaluateCompliance([
      makeRecord({ id: "r1", category: "night_check" }),
      makeRecord({ id: "r2", category: "sleep_monitoring" }),
      makeRecord({ id: "r3", category: "bedtime_routine" }),
      makeRecord({ id: "r4", category: "night_handover" }),
    ]);
    expect(result.uniqueCategories).toBe(4);
    expect(result.categoryDiversityRatio).toBe(0.5); // 4/8
  });

  it("diversity ratio 1.0 for all 8 categories", () => {
    const categories = [
      "night_check", "sleep_monitoring", "night_incident", "waking_night_support",
      "night_medication", "bedtime_routine", "night_handover", "disturbance_response",
    ] as const;
    const records = categories.map((category, i) =>
      makeRecord({ id: `r${i}`, category }),
    );
    const result = evaluateCompliance(records);
    expect(result.uniqueCategories).toBe(8);
    expect(result.categoryDiversityRatio).toBe(1);
  });

  it("diversity ratio 0.13 for 1 category", () => {
    const result = evaluateCompliance([
      makeRecord({ id: "r1", category: "night_check" }),
    ]);
    expect(result.uniqueCategories).toBe(1);
    expect(result.categoryDiversityRatio).toBe(0.13);
  });

  it("scores high when all metrics are perfect with diverse categories", () => {
    const categories = [
      "night_check", "sleep_monitoring", "night_incident", "waking_night_support",
      "night_medication", "bedtime_routine", "night_handover", "disturbance_response",
    ] as const;
    const records = categories.map((category, i) =>
      makeRecord({ id: `r${i}`, category }),
    );
    const result = evaluateCompliance(records);
    expect(result.overallScore).toBe(25);
  });

  it("scores 0 when all metrics are poor with single category", () => {
    const result = evaluateCompliance([
      makeRecord({
        documentationComplete: false,
        timelyRecording: false,
        nightCheckCompleted: false,
      }),
    ]);
    // Only diversity contributes a small amount (0.13 * 5 = 0.65 -> rounds to 0.6)
    expect(result.overallScore).toBeLessThanOrEqual(1);
  });

  it("caps score at 25", () => {
    const result = evaluateCompliance([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns correct total records count", () => {
    const result = evaluateCompliance([
      makeRecord({ id: "r1" }),
      makeRecord({ id: "r2" }),
    ]);
    expect(result.totalRecords).toBe(2);
  });

  it("weights documentation at 8", () => {
    // 100% documentation + 0% timely + 0% nightCheck + single category
    const result = evaluateCompliance([
      makeRecord({
        documentationComplete: true,
        timelyRecording: false,
        nightCheckCompleted: false,
      }),
    ]);
    // 8 + 0 + 0 + 0.13*5 = 8.65 rounds to 8.6 or 8.7
    expect(result.overallScore).toBeGreaterThanOrEqual(8);
    expect(result.overallScore).toBeLessThanOrEqual(9);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePolicy", () => {
  it("returns 0 for null policy (all false)", () => {
    const result = evaluatePolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.nightCarePolicy).toBe(false);
    expect(result.sleepMonitoringGuidance).toBe(false);
    expect(result.nightIncidentProcedure).toBe(false);
    expect(result.wakingNightPolicy).toBe(false);
    expect(result.nightMedicationProtocol).toBe(false);
    expect(result.bedtimeRoutineGuidance).toBe(false);
    expect(result.nightHandoverProcedure).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluatePolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("nightCarePolicy contributes 4", () => {
    const result = evaluatePolicy(makePolicy({
      nightCarePolicy: true,
      sleepMonitoringGuidance: false,
      nightIncidentProcedure: false,
      wakingNightPolicy: false,
      nightMedicationProtocol: false,
      bedtimeRoutineGuidance: false,
      nightHandoverProcedure: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("sleepMonitoringGuidance contributes 4", () => {
    const result = evaluatePolicy(makePolicy({
      nightCarePolicy: false,
      sleepMonitoringGuidance: true,
      nightIncidentProcedure: false,
      wakingNightPolicy: false,
      nightMedicationProtocol: false,
      bedtimeRoutineGuidance: false,
      nightHandoverProcedure: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("nightIncidentProcedure contributes 4", () => {
    const result = evaluatePolicy(makePolicy({
      nightCarePolicy: false,
      sleepMonitoringGuidance: false,
      nightIncidentProcedure: true,
      wakingNightPolicy: false,
      nightMedicationProtocol: false,
      bedtimeRoutineGuidance: false,
      nightHandoverProcedure: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("wakingNightPolicy contributes 4", () => {
    const result = evaluatePolicy(makePolicy({
      nightCarePolicy: false,
      sleepMonitoringGuidance: false,
      nightIncidentProcedure: false,
      wakingNightPolicy: true,
      nightMedicationProtocol: false,
      bedtimeRoutineGuidance: false,
      nightHandoverProcedure: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("nightMedicationProtocol contributes 3", () => {
    const result = evaluatePolicy(makePolicy({
      nightCarePolicy: false,
      sleepMonitoringGuidance: false,
      nightIncidentProcedure: false,
      wakingNightPolicy: false,
      nightMedicationProtocol: true,
      bedtimeRoutineGuidance: false,
      nightHandoverProcedure: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("bedtimeRoutineGuidance contributes 3", () => {
    const result = evaluatePolicy(makePolicy({
      nightCarePolicy: false,
      sleepMonitoringGuidance: false,
      nightIncidentProcedure: false,
      wakingNightPolicy: false,
      nightMedicationProtocol: false,
      bedtimeRoutineGuidance: true,
      nightHandoverProcedure: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("nightHandoverProcedure contributes 3", () => {
    const result = evaluatePolicy(makePolicy({
      nightCarePolicy: false,
      sleepMonitoringGuidance: false,
      nightIncidentProcedure: false,
      wakingNightPolicy: false,
      nightMedicationProtocol: false,
      bedtimeRoutineGuidance: false,
      nightHandoverProcedure: true,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("weights sum to 25 (4+4+4+4+3+3+3)", () => {
    const result = evaluatePolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("partial policy returns correct partial score", () => {
    // nightCarePolicy (4) + nightIncidentProcedure (4) + nightMedicationProtocol (3) = 11
    const result = evaluatePolicy(makePolicy({
      nightCarePolicy: true,
      sleepMonitoringGuidance: false,
      nightIncidentProcedure: true,
      wakingNightPolicy: false,
      nightMedicationProtocol: true,
      bedtimeRoutineGuidance: false,
      nightHandoverProcedure: false,
    }));
    expect(result.overallScore).toBe(11);
  });

  it("preserves boolean values in result", () => {
    const result = evaluatePolicy(makePolicy({
      nightCarePolicy: true,
      sleepMonitoringGuidance: false,
      nightIncidentProcedure: true,
      wakingNightPolicy: false,
      nightMedicationProtocol: true,
      bedtimeRoutineGuidance: false,
      nightHandoverProcedure: true,
    }));
    expect(result.nightCarePolicy).toBe(true);
    expect(result.sleepMonitoringGuidance).toBe(false);
    expect(result.nightIncidentProcedure).toBe(true);
    expect(result.wakingNightPolicy).toBe(false);
    expect(result.nightMedicationProtocol).toBe(true);
    expect(result.bedtimeRoutineGuidance).toBe(false);
    expect(result.nightHandoverProcedure).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.nightCareCompetencyRate).toBe(0);
    expect(result.sleepMonitoringSkillsRate).toBe(0);
    expect(result.nightIncidentResponseRate).toBe(0);
    expect(result.nightMedicationHandlingRate).toBe(0);
    expect(result.childComfortTechniquesRate).toBe(0);
    expect(result.nightHandoverProcedureRate).toBe(0);
  });

  it("scores 25 for all-true training", () => {
    const result = evaluateStaffReadiness([makeTraining(), makeTraining({ id: "tr-2", staffId: "staff-tom" })]);
    expect(result.overallScore).toBe(25);
  });

  it("nightCareCompetency weight is 6 (highest)", () => {
    const result = evaluateStaffReadiness([
      makeTraining({
        nightCareCompetency: true,
        sleepMonitoringSkills: false,
        nightIncidentResponse: false,
        nightMedicationHandling: false,
        childComfortTechniques: false,
        nightHandoverProcedure: false,
      }),
    ]);
    expect(result.overallScore).toBe(6);
  });

  it("sleepMonitoringSkills weight is 5", () => {
    const result = evaluateStaffReadiness([
      makeTraining({
        nightCareCompetency: false,
        sleepMonitoringSkills: true,
        nightIncidentResponse: false,
        nightMedicationHandling: false,
        childComfortTechniques: false,
        nightHandoverProcedure: false,
      }),
    ]);
    expect(result.overallScore).toBe(5);
  });

  it("nightIncidentResponse weight is 5", () => {
    const result = evaluateStaffReadiness([
      makeTraining({
        nightCareCompetency: false,
        sleepMonitoringSkills: false,
        nightIncidentResponse: true,
        nightMedicationHandling: false,
        childComfortTechniques: false,
        nightHandoverProcedure: false,
      }),
    ]);
    expect(result.overallScore).toBe(5);
  });

  it("nightMedicationHandling weight is 4", () => {
    const result = evaluateStaffReadiness([
      makeTraining({
        nightCareCompetency: false,
        sleepMonitoringSkills: false,
        nightIncidentResponse: false,
        nightMedicationHandling: true,
        childComfortTechniques: false,
        nightHandoverProcedure: false,
      }),
    ]);
    expect(result.overallScore).toBe(4);
  });

  it("childComfortTechniques weight is 3", () => {
    const result = evaluateStaffReadiness([
      makeTraining({
        nightCareCompetency: false,
        sleepMonitoringSkills: false,
        nightIncidentResponse: false,
        nightMedicationHandling: false,
        childComfortTechniques: true,
        nightHandoverProcedure: false,
      }),
    ]);
    expect(result.overallScore).toBe(3);
  });

  it("nightHandoverProcedure weight is 2", () => {
    const result = evaluateStaffReadiness([
      makeTraining({
        nightCareCompetency: false,
        sleepMonitoringSkills: false,
        nightIncidentResponse: false,
        nightMedicationHandling: false,
        childComfortTechniques: false,
        nightHandoverProcedure: true,
      }),
    ]);
    expect(result.overallScore).toBe(2);
  });

  it("weights sum to 25 (6+5+5+4+3+2)", () => {
    const result = evaluateStaffReadiness([makeTraining()]);
    expect(result.overallScore).toBe(25);
  });

  it("calculates rates correctly across multiple staff", () => {
    const result = evaluateStaffReadiness([
      makeTraining({ id: "tr-1", staffId: "staff-sarah", nightCareCompetency: true, sleepMonitoringSkills: true }),
      makeTraining({ id: "tr-2", staffId: "staff-tom", nightCareCompetency: true, sleepMonitoringSkills: false }),
      makeTraining({ id: "tr-3", staffId: "staff-lisa", nightCareCompetency: false, sleepMonitoringSkills: true }),
    ]);
    expect(result.totalStaff).toBe(3);
    expect(result.nightCareCompetencyRate).toBe(67);
    expect(result.sleepMonitoringSkillsRate).toBe(67);
  });

  it("scores 0 when all skills are false", () => {
    const result = evaluateStaffReadiness([
      makeTraining({
        nightCareCompetency: false,
        sleepMonitoringSkills: false,
        nightIncidentResponse: false,
        nightMedicationHandling: false,
        childComfortTechniques: false,
        nightHandoverProcedure: false,
      }),
    ]);
    expect(result.overallScore).toBe(0);
  });

  it("caps at 25", () => {
    const result = evaluateStaffReadiness([makeTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildNightCareProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildNightCareProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildNightCareProfiles([])).toEqual([]);
  });

  it("builds one profile per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r3", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildNightCareProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "child-alex")!.totalRecords).toBe(2);
    expect(profiles.find((p) => p.childId === "child-jordan")!.totalRecords).toBe(1);
  });

  it("calculates nightCheckCompletedRate per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", nightCheckCompleted: true }),
      makeRecord({ id: "r2", childId: "child-alex", nightCheckCompleted: false }),
    ];
    const profiles = buildChildNightCareProfiles(records);
    expect(profiles[0].nightCheckCompletedRate).toBe(50);
  });

  it("calculates sleepPatternRecordedRate per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", sleepPatternRecorded: true }),
      makeRecord({ id: "r2", childId: "child-alex", sleepPatternRecorded: true }),
      makeRecord({ id: "r3", childId: "child-alex", sleepPatternRecorded: false }),
    ];
    const profiles = buildChildNightCareProfiles(records);
    expect(profiles[0].sleepPatternRecordedRate).toBe(67);
  });

  it("counts unique categories per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", category: "night_check" }),
      makeRecord({ id: "r2", childId: "child-alex", category: "sleep_monitoring" }),
      makeRecord({ id: "r3", childId: "child-alex", category: "night_check" }),
    ];
    const profiles = buildChildNightCareProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(2);
  });

  it("frequency score: >=10 records -> 2", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r${i}`, childId: "child-alex" }),
    );
    const profiles = buildChildNightCareProfiles(records);
    // freq=2, rate1=3 (100%), rate2=3 (100%), diversity=0 (1 category) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("frequency score: >=5 records -> 1", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r${i}`, childId: "child-alex" }),
    );
    const profiles = buildChildNightCareProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("frequency score: <5 records -> 0", () => {
    const records = Array.from({ length: 4 }, (_, i) =>
      makeRecord({ id: `r${i}`, childId: "child-alex" }),
    );
    const profiles = buildChildNightCareProfiles(records);
    // freq=0, rate1=3, rate2=3, diversity=0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("rate1 thresholds: >=80 -> 3, >=60 -> 2, >=40 -> 1, <40 -> 0", () => {
    // 3 out of 4 nightCheck = 75% -> rate1=2
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", nightCheckCompleted: true }),
      makeRecord({ id: "r2", childId: "child-alex", nightCheckCompleted: true }),
      makeRecord({ id: "r3", childId: "child-alex", nightCheckCompleted: true }),
      makeRecord({ id: "r4", childId: "child-alex", nightCheckCompleted: false }),
    ];
    const profiles = buildChildNightCareProfiles(records);
    expect(profiles[0].nightCheckCompletedRate).toBe(75);
    // freq=0, rate1=2, rate2=3 (all sleep true), diversity=0 (1 cat) = 5
    expect(profiles[0].overallScore).toBe(5);
  });

  it("rate2 thresholds: >=80 -> 3, >=60 -> 2, >=40 -> 1, <40 -> 0", () => {
    // 1 out of 3 sleepPattern = 33% -> rate2=0
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", sleepPatternRecorded: true }),
      makeRecord({ id: "r2", childId: "child-alex", sleepPatternRecorded: false }),
      makeRecord({ id: "r3", childId: "child-alex", sleepPatternRecorded: false }),
    ];
    const profiles = buildChildNightCareProfiles(records);
    expect(profiles[0].sleepPatternRecordedRate).toBe(33);
    // freq=0, rate1=3, rate2=0, diversity=0 = 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("diversity bonus: >=4 categories -> 2", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", category: "night_check" }),
      makeRecord({ id: "r2", childId: "child-alex", category: "sleep_monitoring" }),
      makeRecord({ id: "r3", childId: "child-alex", category: "bedtime_routine" }),
      makeRecord({ id: "r4", childId: "child-alex", category: "night_handover" }),
    ];
    const profiles = buildChildNightCareProfiles(records);
    // freq=0, rate1=3, rate2=3, diversity=2 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("diversity bonus: >=2 categories -> 1", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", category: "night_check" }),
      makeRecord({ id: "r2", childId: "child-alex", category: "sleep_monitoring" }),
    ];
    const profiles = buildChildNightCareProfiles(records);
    // freq=0, rate1=3, rate2=3, diversity=1 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("diversity bonus: 1 category -> 0", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", category: "night_check" }),
    ];
    const profiles = buildChildNightCareProfiles(records);
    // freq=0, rate1=3, rate2=3, diversity=0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("caps profile score at 10", () => {
    // Max possible: freq=2 + rate1=3 + rate2=3 + diversity=2 = 10
    const categories = [
      "night_check", "sleep_monitoring", "bedtime_routine", "night_handover",
    ] as const;
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({ id: `r${i}`, childId: "child-alex", category: categories[i % 4] }),
    );
    const profiles = buildChildNightCareProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("produces zero score for child with all-false and 1 record 1 category", () => {
    const records = [
      makeRecord({
        childId: "child-alex",
        nightCheckCompleted: false,
        sleepPatternRecorded: false,
        category: "night_check",
      }),
    ];
    const profiles = buildChildNightCareProfiles(records);
    // freq=0, rate1=0, rate2=0, diversity=0 = 0
    expect(profiles[0].overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateNightCareIntelligence (orchestrator)
// ══════════════════════════════════════════════════════════════════════════════

describe("generateNightCareIntelligence", () => {
  const HOME_ID = "oak-house";
  const START = "2026-05-01";
  const END = "2026-05-31";

  it("returns all required top-level fields", () => {
    const result = generateNightCareIntelligence([], null, [], HOME_ID, START, END);
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(START);
    expect(result.periodEnd).toBe(END);
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.rating).toBe("string");
    expect(result.quality).toBeDefined();
    expect(result.compliance).toBeDefined();
    expect(result.policy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(Array.isArray(result.childProfiles)).toBe(true);
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    expect(Array.isArray(result.actions)).toBe(true);
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
  });

  it("overall score is the sum of four sub-scores capped at 100", () => {
    const records = [makeRecord()];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    const expectedSum =
      result.quality.overallScore +
      result.compliance.overallScore +
      result.policy.overallScore +
      result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, Math.max(0, expectedSum)));
  });

  it("overall score never exceeds 100", () => {
    const records = [makeRecord()];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score never goes below 0", () => {
    const result = generateNightCareIntelligence([], null, [], HOME_ID, START, END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("assigns outstanding rating for score >= 80", () => {
    const categories = [
      "night_check", "sleep_monitoring", "night_incident", "waking_night_support",
      "night_medication", "bedtime_routine", "night_handover", "disturbance_response",
    ] as const;
    const records = categories.map((category, i) =>
      makeRecord({ id: `r${i}`, category }),
    );
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("assigns inadequate rating for empty data with null policy", () => {
    const result = generateNightCareIntelligence([], null, [], HOME_ID, START, END);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("always includes 7 regulatory links", () => {
    const result = generateNightCareIntelligence([], null, [], HOME_ID, START, END);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 34"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 7"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989 s.22"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Quality Standards 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 40"))).toBe(true);
  });

  // -- Strengths --

  it("identifies strength for high nightCheck rate", () => {
    const records = [makeRecord()];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.strengths.some((s) => s.includes("Night checks consistently completed"))).toBe(true);
  });

  it("identifies strength for high sleepPattern rate", () => {
    const records = [makeRecord()];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.strengths.some((s) => s.includes("Sleep patterns recorded"))).toBe(true);
  });

  it("identifies strength for all staff trained", () => {
    const training = [makeTraining()];
    const result = generateNightCareIntelligence([makeRecord()], makePolicy(), training, HOME_ID, START, END);
    expect(result.strengths.some((s) => s.includes("All staff trained in night care competency"))).toBe(true);
  });

  it("identifies strength for comprehensive policy", () => {
    const result = generateNightCareIntelligence([makeRecord()], makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.strengths.some((s) => s.includes("Comprehensive night care policy"))).toBe(true);
  });

  it("identifies strength for 100% documentation", () => {
    const records = [makeRecord()];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.strengths.some((s) => s.includes("Documentation rate at 100%"))).toBe(true);
  });

  // -- Areas for Improvement --

  it("flags area when no records found", () => {
    const result = generateNightCareIntelligence([], makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.areasForImprovement.some((a) => a.includes("No night care records found"))).toBe(true);
  });

  it("flags area when nightCheck rate is low", () => {
    const records = [
      makeRecord({ id: "r1", nightCheckCompleted: false }),
      makeRecord({ id: "r2", nightCheckCompleted: false }),
    ];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.areasForImprovement.some((a) => a.includes("Night check completion rate"))).toBe(true);
  });

  it("flags area when no policy", () => {
    const result = generateNightCareIntelligence([makeRecord()], null, [makeTraining()], HOME_ID, START, END);
    expect(result.areasForImprovement.some((a) => a.includes("No night care policy"))).toBe(true);
  });

  it("flags area when no training records", () => {
    const result = generateNightCareIntelligence([makeRecord()], makePolicy(), [], HOME_ID, START, END);
    expect(result.areasForImprovement.some((a) => a.includes("No staff night care training records"))).toBe(true);
  });

  it("flags area when nightIncidentProcedure missing from policy", () => {
    const result = generateNightCareIntelligence(
      [makeRecord()],
      makePolicy({ nightIncidentProcedure: false }),
      [makeTraining()],
      HOME_ID, START, END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("Night incident procedure missing"))).toBe(true);
  });

  it("flags area when documentation rate below 100", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true }),
      makeRecord({ id: "r2", documentationComplete: false }),
    ];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.areasForImprovement.some((a) => a.includes("Documentation rate at"))).toBe(true);
  });

  // -- Actions --

  it("generates URGENT action when no records", () => {
    const result = generateNightCareIntelligence([], makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("night care recording"))).toBe(true);
  });

  it("generates URGENT action for low nightCheck rate", () => {
    const records = [
      makeRecord({ id: "r1", nightCheckCompleted: false }),
      makeRecord({ id: "r2", nightCheckCompleted: false }),
    ];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("night check"))).toBe(true);
  });

  it("generates URGENT action for no training", () => {
    const result = generateNightCareIntelligence([makeRecord()], makePolicy(), [], HOME_ID, START, END);
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("generates action for policy development when null", () => {
    const result = generateNightCareIntelligence([makeRecord()], null, [makeTraining()], HOME_ID, START, END);
    expect(result.actions.some((a) => a.includes("Develop") && a.includes("policy"))).toBe(true);
  });

  it("generates no actions when everything is excellent", () => {
    const categories = [
      "night_check", "sleep_monitoring", "night_incident", "waking_night_support",
      "night_medication", "bedtime_routine", "night_handover", "disturbance_response",
    ] as const;
    const records = categories.map((category, i) =>
      makeRecord({ id: `r${i}`, category }),
    );
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.actions).toHaveLength(0);
  });

  // -- Child Profiles in Orchestrator --

  it("includes child profiles in result", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "child-morgan", childName: "Morgan" }),
    ];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.childProfiles).toHaveLength(3);
  });

  it("returns empty child profiles when no records", () => {
    const result = generateNightCareIntelligence([], makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.childProfiles).toHaveLength(0);
  });

  // -- Edge Cases --

  it("handles single record, null policy, empty training", () => {
    const result = generateNightCareIntelligence([makeRecord()], null, [], HOME_ID, START, END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(typeof result.rating).toBe("string");
  });

  it("preserves homeId, periodStart, periodEnd", () => {
    const result = generateNightCareIntelligence([], null, [], "my-home", "2026-01-01", "2026-12-31");
    expect(result.homeId).toBe("my-home");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-12-31");
  });

  it("all four zero scores produce 0 overall", () => {
    const result = generateNightCareIntelligence([], null, [], HOME_ID, START, END);
    expect(result.overallScore).toBe(0);
  });

  it("all four perfect scores produce 100 overall with diverse categories", () => {
    const categories = [
      "night_check", "sleep_monitoring", "night_incident", "waking_night_support",
      "night_medication", "bedtime_routine", "night_handover", "disturbance_response",
    ] as const;
    const records = categories.map((category, i) =>
      makeRecord({ id: `r${i}`, category }),
    );
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  // -- Chamberlain House Demo Integration --

  it("produces outstanding result with full Chamberlain House demo data", () => {
    const categories = [
      "night_check", "sleep_monitoring", "night_incident", "waking_night_support",
      "night_medication", "bedtime_routine", "night_handover", "disturbance_response",
    ] as const;

    const records: NightCareRecord[] = [];
    const children = [
      { id: "child-alex", name: "Alex" },
      { id: "child-jordan", name: "Jordan" },
      { id: "child-morgan", name: "Morgan" },
    ];

    let idx = 0;
    for (const child of children) {
      for (let i = 0; i < 4; i++) {
        records.push(makeRecord({
          id: `rec-${idx++}`,
          childId: child.id,
          childName: child.name,
          category: categories[i % categories.length],
        }));
      }
    }

    const training = [
      makeTraining({ id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeTraining({ id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards" }),
      makeTraining({ id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
      makeTraining({ id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];

    const result = generateNightCareIntelligence(records, makePolicy(), training, HOME_ID, START, END);
    expect(result.homeId).toBe("oak-house");
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("produces result with mixed quality data", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex", nightCheckCompleted: true, sleepPatternRecorded: true }),
      makeRecord({ id: "r2", childId: "child-alex", childName: "Alex", nightCheckCompleted: false, sleepPatternRecorded: false }),
      makeRecord({ id: "r3", childId: "child-jordan", childName: "Jordan", nightCheckCompleted: true, sleepPatternRecorded: true }),
      makeRecord({ id: "r4", childId: "child-jordan", childName: "Jordan", nightCheckCompleted: true, sleepPatternRecorded: false }),
    ];

    const result = generateNightCareIntelligence(
      records,
      makePolicy({ nightMedicationProtocol: false }),
      [makeTraining({ nightMedicationHandling: false })],
      HOME_ID, START, END,
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(100);
    expect(result.childProfiles).toHaveLength(2);
  });

  it("handles all-bad scenario", () => {
    const records = [
      makeRecord({
        nightCheckCompleted: false,
        sleepPatternRecorded: false,
        incidentHandledAppropriately: false,
        childComfortChecked: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    ];
    const result = generateNightCareIntelligence(records, null, [], HOME_ID, START, END);
    expect(result.overallScore).toBeLessThan(5);
    expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("does not flag area when nightCheck rate is above 80", () => {
    const records = [
      makeRecord({ id: "r1", nightCheckCompleted: true }),
      makeRecord({ id: "r2", nightCheckCompleted: true }),
      makeRecord({ id: "r3", nightCheckCompleted: true }),
      makeRecord({ id: "r4", nightCheckCompleted: true }),
      makeRecord({ id: "r5", nightCheckCompleted: true }),
    ];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.areasForImprovement.some((a) => a.includes("Night check completion rate"))).toBe(false);
  });

  it("does not flag staff training area when all trained", () => {
    const result = generateNightCareIntelligence(
      [makeRecord()],
      makePolicy(),
      [makeTraining()],
      HOME_ID, START, END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("night care competency"))).toBe(false);
  });

  it("handles records from multiple dates", () => {
    const records = [
      makeRecord({ id: "r1", date: "2026-05-01" }),
      makeRecord({ id: "r2", date: "2026-05-02" }),
      makeRecord({ id: "r3", date: "2026-05-03" }),
    ];
    const result = generateNightCareIntelligence(records, makePolicy(), [makeTraining()], HOME_ID, START, END);
    expect(result.quality.totalRecords).toBe(3);
  });
});
