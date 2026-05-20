import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getNightMonitoringCategoryLabel,
  getNightMonitoringOutcomeLabel,
  getRatingLabel,
  evaluateNightMonitoringQuality,
  evaluateNightMonitoringCompliance,
  evaluateNightMonitoringPolicy,
  evaluateStaffNightMonitoringReadiness,
  buildChildNightMonitoringProfiles,
  generateNightMonitoringIntelligence,
} from "../night-monitoring-intelligence-engine";
import type {
  NightMonitoringRecord,
  NightMonitoringPolicy,
  StaffNightMonitoringTraining,
  NightMonitoringCategory,
  NightMonitoringOutcome,
  Rating,
} from "../night-monitoring-intelligence-engine";

// ── Helpers ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<NightMonitoringRecord> = {}): NightMonitoringRecord {
  return {
    id: "nm-1",
    homeId: "home-oak",
    date: "2026-03-15",
    childId: "child-alex",
    childName: "Alex",
    category: "waking_night_check",
    outcome: "all_settled",
    checkCompletedOnTime: true,
    observationsRecorded: true,
    incidentEscalated: true,
    childWelfareConfirmed: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makeFullRecords(count: number, overrides: Partial<NightMonitoringRecord> = {}): NightMonitoringRecord[] {
  return Array.from({ length: count }, (_, i) =>
    makeRecord({ id: `nm-${i}`, ...overrides })
  );
}

function makeAllTruePolicy(): NightMonitoringPolicy {
  return {
    nightMonitoringPolicy: true,
    wakingNightCheckFrequency: true,
    nightIncidentProcedure: true,
    nightMedicationProtocol: true,
    nightHandoverProcedure: true,
    sleepMonitoringGuidance: true,
    environmentalCheckPolicy: true,
  };
}

function makeAllFalsePolicy(): NightMonitoringPolicy {
  return {
    nightMonitoringPolicy: false,
    wakingNightCheckFrequency: false,
    nightIncidentProcedure: false,
    nightMedicationProtocol: false,
    nightHandoverProcedure: false,
    sleepMonitoringGuidance: false,
    environmentalCheckPolicy: false,
  };
}

function makeStaff(overrides: Partial<StaffNightMonitoringTraining> = {}): StaffNightMonitoringTraining {
  return {
    staffId: "staff-1",
    nightCareCompetency: true,
    nightIncidentManagement: true,
    sleepMonitoringSkills: true,
    nightMedicationHandling: true,
    childWelfareAssessment: true,
    nightHandoverProcedure: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// pct()
// ═══════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns percentage rounded to nearest integer", () => {
    expect(pct(3, 4)).toBe(75);
  });
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });
  it("returns 100 for 1/1", () => {
    expect(pct(1, 1)).toBe(100);
  });
  it("returns 0 for 0/10", () => {
    expect(pct(0, 10)).toBe(0);
  });
  it("rounds correctly (2/3 = 67)", () => {
    expect(pct(2, 3)).toBe(67);
  });
  it("rounds correctly (1/3 = 33)", () => {
    expect(pct(1, 3)).toBe(33);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getRating()
// ═══════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for 60–79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for 40–59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Label Functions
// ═══════════════════════════════════════════════════════════════════════════

describe("getNightMonitoringCategoryLabel", () => {
  const cases: [NightMonitoringCategory, string][] = [
    ["waking_night_check", "Waking Night Check"],
    ["sleep_observation", "Sleep Observation"],
    ["night_incident_response", "Night Incident Response"],
    ["medication_round", "Medication Round"],
    ["disturbance_management", "Disturbance Management"],
    ["handover_briefing", "Handover Briefing"],
    ["welfare_check", "Welfare Check"],
    ["environmental_check", "Environmental Check"],
  ];
  it.each(cases)("maps %s → %s", (cat, label) => {
    expect(getNightMonitoringCategoryLabel(cat)).toBe(label);
  });
});

describe("getNightMonitoringOutcomeLabel", () => {
  const cases: [NightMonitoringOutcome, string][] = [
    ["all_settled", "All Settled"],
    ["minor_disturbance", "Minor Disturbance"],
    ["significant_incident", "Significant Incident"],
    ["intervention_required", "Intervention Required"],
    ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("maps %s → %s", (outcome, label) => {
    expect(getNightMonitoringOutcomeLabel(outcome)).toBe(label);
  });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [
    ["outstanding", "Outstanding"],
    ["good", "Good"],
    ["requires_improvement", "Requires Improvement"],
    ["inadequate", "Inadequate"],
  ];
  it.each(cases)("maps %s → %s", (r, label) => {
    expect(getRatingLabel(r)).toBe(label);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Evaluator 1: Quality (0-25)
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateNightMonitoringQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateNightMonitoringQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.checkCompletedOnTimeRate).toBe(0);
    expect(result.observationsRecordedRate).toBe(0);
    expect(result.incidentEscalatedRate).toBe(0);
    expect(result.childWelfareConfirmedRate).toBe(0);
  });

  it("returns 25 for all-perfect records", () => {
    const records = makeFullRecords(5);
    const result = evaluateNightMonitoringQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(5);
    expect(result.checkCompletedOnTimeRate).toBe(100);
    expect(result.observationsRecordedRate).toBe(100);
    expect(result.incidentEscalatedRate).toBe(100);
    expect(result.childWelfareConfirmedRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = makeFullRecords(3, {
      checkCompletedOnTime: false,
      observationsRecorded: false,
      incidentEscalated: false,
      childWelfareConfirmed: false,
    });
    const result = evaluateNightMonitoringQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("scores first boolean (checkCompletedOnTime) at weight 7", () => {
    const records = makeFullRecords(1, {
      checkCompletedOnTime: true,
      observationsRecorded: false,
      incidentEscalated: false,
      childWelfareConfirmed: false,
    });
    const result = evaluateNightMonitoringQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("scores second boolean (observationsRecorded) at weight 6", () => {
    const records = makeFullRecords(1, {
      checkCompletedOnTime: false,
      observationsRecorded: true,
      incidentEscalated: false,
      childWelfareConfirmed: false,
    });
    const result = evaluateNightMonitoringQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("scores third boolean (incidentEscalated) at weight 6", () => {
    const records = makeFullRecords(1, {
      checkCompletedOnTime: false,
      observationsRecorded: false,
      incidentEscalated: true,
      childWelfareConfirmed: false,
    });
    const result = evaluateNightMonitoringQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("scores fourth boolean (childWelfareConfirmed) at weight 6", () => {
    const records = makeFullRecords(1, {
      checkCompletedOnTime: false,
      observationsRecorded: false,
      incidentEscalated: false,
      childWelfareConfirmed: true,
    });
    const result = evaluateNightMonitoringQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("calculates partial rates correctly", () => {
    const records = [
      makeRecord({ id: "a", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true }),
      makeRecord({ id: "b", checkCompletedOnTime: false, observationsRecorded: false, incidentEscalated: false, childWelfareConfirmed: false }),
    ];
    const result = evaluateNightMonitoringQuality(records);
    expect(result.checkCompletedOnTimeRate).toBe(50);
    expect(result.observationsRecordedRate).toBe(50);
    expect(result.incidentEscalatedRate).toBe(50);
    expect(result.childWelfareConfirmedRate).toBe(50);
    // (50/100)*7 + (50/100)*6 + (50/100)*6 + (50/100)*6 = 3.5 + 3 + 3 + 3 = 12.5
    expect(result.overallScore).toBe(12.5);
  });

  it("caps score at 25", () => {
    const records = makeFullRecords(100);
    const result = evaluateNightMonitoringQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single record", () => {
    const records = [makeRecord()];
    const result = evaluateNightMonitoringQuality(records);
    expect(result.totalRecords).toBe(1);
    expect(result.overallScore).toBe(25);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Evaluator 2: Compliance (0-25)
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateNightMonitoringCompliance", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateNightMonitoringCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.checkCompletedOnTimeRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("scores documentation at weight 8", () => {
    const records = makeFullRecords(1, {
      documentationComplete: true,
      timelyRecording: false,
      checkCompletedOnTime: false,
      category: "waking_night_check",
    });
    const result = evaluateNightMonitoringCompliance(records);
    // (100/100)*8 + 0 + 0 + (1/8)*5 = 8 + 0.625 = 8.625 → round to 8.6
    const categoryRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((8 + categoryRatio * 5) * 10) / 10;
    expect(result.overallScore).toBe(expected);
  });

  it("scores timely recording at weight 7", () => {
    const records = makeFullRecords(1, {
      documentationComplete: false,
      timelyRecording: true,
      checkCompletedOnTime: false,
      category: "waking_night_check",
    });
    const result = evaluateNightMonitoringCompliance(records);
    const categoryRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((7 + categoryRatio * 5) * 10) / 10;
    expect(result.overallScore).toBe(expected);
  });

  it("scores checkCompletedOnTime at weight 5", () => {
    const records = makeFullRecords(1, {
      documentationComplete: false,
      timelyRecording: false,
      checkCompletedOnTime: true,
      category: "waking_night_check",
    });
    const result = evaluateNightMonitoringCompliance(records);
    const categoryRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((5 + categoryRatio * 5) * 10) / 10;
    expect(result.overallScore).toBe(expected);
  });

  it("returns max 25 for perfect compliance with full category diversity", () => {
    const allCategories: NightMonitoringCategory[] = [
      "waking_night_check", "sleep_observation", "night_incident_response", "medication_round",
      "disturbance_management", "handover_briefing", "welfare_check", "environmental_check",
    ];
    const records = allCategories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, category: cat, documentationComplete: true, timelyRecording: true, checkCompletedOnTime: true })
    );
    const result = evaluateNightMonitoringCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.uniqueCategories).toBe(8);
    expect(result.categoryDiversityRatio).toBe(1);
  });

  it("calculates categoryDiversityRatio correctly for 4/8 categories", () => {
    const cats: NightMonitoringCategory[] = ["waking_night_check", "sleep_observation", "night_incident_response", "medication_round"];
    const records = cats.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateNightMonitoringCompliance(records);
    expect(result.uniqueCategories).toBe(4);
    expect(result.categoryDiversityRatio).toBe(0.5);
  });

  it("handles single-category records", () => {
    const records = makeFullRecords(5, { category: "welfare_check" });
    const result = evaluateNightMonitoringCompliance(records);
    expect(result.uniqueCategories).toBe(1);
    expect(result.categoryDiversityRatio).toBe(0.13);
  });

  it("caps score at 25", () => {
    const allCategories: NightMonitoringCategory[] = [
      "waking_night_check", "sleep_observation", "night_incident_response", "medication_round",
      "disturbance_management", "handover_briefing", "welfare_check", "environmental_check",
    ];
    const records = allCategories.flatMap((cat, i) =>
      makeFullRecords(10, { category: cat }).map((r, j) => ({ ...r, id: `r-${i}-${j}` }))
    );
    const result = evaluateNightMonitoringCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Evaluator 3: Policy (0-25)
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateNightMonitoringPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateNightMonitoringPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.nightMonitoringPolicy).toBe(false);
    expect(result.wakingNightCheckFrequency).toBe(false);
    expect(result.nightIncidentProcedure).toBe(false);
    expect(result.nightMedicationProtocol).toBe(false);
    expect(result.nightHandoverProcedure).toBe(false);
    expect(result.sleepMonitoringGuidance).toBe(false);
    expect(result.environmentalCheckPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateNightMonitoringPolicy(makeAllTruePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateNightMonitoringPolicy(makeAllFalsePolicy());
    expect(result.overallScore).toBe(0);
  });

  it("nightMonitoringPolicy weighted at 4", () => {
    const policy = { ...makeAllFalsePolicy(), nightMonitoringPolicy: true };
    const result = evaluateNightMonitoringPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("wakingNightCheckFrequency weighted at 4", () => {
    const policy = { ...makeAllFalsePolicy(), wakingNightCheckFrequency: true };
    const result = evaluateNightMonitoringPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("nightIncidentProcedure weighted at 4", () => {
    const policy = { ...makeAllFalsePolicy(), nightIncidentProcedure: true };
    const result = evaluateNightMonitoringPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("nightMedicationProtocol weighted at 4", () => {
    const policy = { ...makeAllFalsePolicy(), nightMedicationProtocol: true };
    const result = evaluateNightMonitoringPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("nightHandoverProcedure weighted at 3", () => {
    const policy = { ...makeAllFalsePolicy(), nightHandoverProcedure: true };
    const result = evaluateNightMonitoringPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("sleepMonitoringGuidance weighted at 3", () => {
    const policy = { ...makeAllFalsePolicy(), sleepMonitoringGuidance: true };
    const result = evaluateNightMonitoringPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("environmentalCheckPolicy weighted at 3", () => {
    const policy = { ...makeAllFalsePolicy(), environmentalCheckPolicy: true };
    const result = evaluateNightMonitoringPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("weights sum to 25 (4+4+4+4+3+3+3)", () => {
    const result = evaluateNightMonitoringPolicy(makeAllTruePolicy());
    expect(result.overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3);
  });

  it("reflects individual boolean values correctly", () => {
    const policy = { ...makeAllTruePolicy(), sleepMonitoringGuidance: false };
    const result = evaluateNightMonitoringPolicy(policy);
    expect(result.sleepMonitoringGuidance).toBe(false);
    expect(result.overallScore).toBe(22);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Readiness (0-25)
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateStaffNightMonitoringReadiness", () => {
  it("returns 0 for empty staff array", () => {
    const result = evaluateStaffNightMonitoringReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.nightCareCompetencyRate).toBe(0);
    expect(result.nightIncidentManagementRate).toBe(0);
    expect(result.sleepMonitoringSkillsRate).toBe(0);
    expect(result.nightMedicationHandlingRate).toBe(0);
    expect(result.childWelfareAssessmentRate).toBe(0);
    expect(result.nightHandoverProcedureRate).toBe(0);
  });

  it("returns 25 for all-true staff", () => {
    const staff = [makeStaff()];
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(1);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeStaff({
      nightCareCompetency: false,
      nightIncidentManagement: false,
      sleepMonitoringSkills: false,
      nightMedicationHandling: false,
      childWelfareAssessment: false,
      nightHandoverProcedure: false,
    })];
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("nightCareCompetency weighted at 6", () => {
    const staff = [makeStaff({
      nightCareCompetency: true,
      nightIncidentManagement: false,
      sleepMonitoringSkills: false,
      nightMedicationHandling: false,
      childWelfareAssessment: false,
      nightHandoverProcedure: false,
    })];
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("nightIncidentManagement weighted at 5", () => {
    const staff = [makeStaff({
      nightCareCompetency: false,
      nightIncidentManagement: true,
      sleepMonitoringSkills: false,
      nightMedicationHandling: false,
      childWelfareAssessment: false,
      nightHandoverProcedure: false,
    })];
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("sleepMonitoringSkills weighted at 5", () => {
    const staff = [makeStaff({
      nightCareCompetency: false,
      nightIncidentManagement: false,
      sleepMonitoringSkills: true,
      nightMedicationHandling: false,
      childWelfareAssessment: false,
      nightHandoverProcedure: false,
    })];
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("nightMedicationHandling weighted at 4", () => {
    const staff = [makeStaff({
      nightCareCompetency: false,
      nightIncidentManagement: false,
      sleepMonitoringSkills: false,
      nightMedicationHandling: true,
      childWelfareAssessment: false,
      nightHandoverProcedure: false,
    })];
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.overallScore).toBe(4);
  });

  it("childWelfareAssessment weighted at 3", () => {
    const staff = [makeStaff({
      nightCareCompetency: false,
      nightIncidentManagement: false,
      sleepMonitoringSkills: false,
      nightMedicationHandling: false,
      childWelfareAssessment: true,
      nightHandoverProcedure: false,
    })];
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.overallScore).toBe(3);
  });

  it("nightHandoverProcedure weighted at 2", () => {
    const staff = [makeStaff({
      nightCareCompetency: false,
      nightIncidentManagement: false,
      sleepMonitoringSkills: false,
      nightMedicationHandling: false,
      childWelfareAssessment: false,
      nightHandoverProcedure: true,
    })];
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("weights sum to 25 (6+5+5+4+3+2)", () => {
    const staff = [makeStaff()];
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2);
  });

  it("calculates partial rates for mixed staff", () => {
    const staff = [
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2", nightCareCompetency: false, nightHandoverProcedure: false }),
    ];
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.totalStaff).toBe(2);
    expect(result.nightCareCompetencyRate).toBe(50);
    expect(result.nightHandoverProcedureRate).toBe(50);
    // (50/100)*6 + (100/100)*5 + (100/100)*5 + (100/100)*4 + (100/100)*3 + (50/100)*2
    // = 3 + 5 + 5 + 4 + 3 + 1 = 21
    expect(result.overallScore).toBe(21);
  });

  it("caps score at 25", () => {
    const staff = Array.from({ length: 100 }, (_, i) => makeStaff({ staffId: `s-${i}` }));
    const result = evaluateStaffNightMonitoringReadiness(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Child Night Monitoring Profiles
// ═══════════════════════════════════════════════════════════════════════════

describe("buildChildNightMonitoringProfiles", () => {
  it("returns empty array for empty records", () => {
    expect(buildChildNightMonitoringProfiles([])).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ id: "a", childId: "child-1", childName: "Alice" }),
      makeRecord({ id: "b", childId: "child-2", childName: "Bob" }),
      makeRecord({ id: "c", childId: "child-1", childName: "Alice" }),
    ];
    const profiles = buildChildNightMonitoringProfiles(records);
    expect(profiles).toHaveLength(2);
    const alice = profiles.find((p) => p.childId === "child-1")!;
    expect(alice.totalRecords).toBe(2);
    const bob = profiles.find((p) => p.childId === "child-2")!;
    expect(bob.totalRecords).toBe(1);
  });

  it("frequency score: 0 for <5 records", () => {
    const records = makeFullRecords(4, { childId: "child-1", childName: "Alice" }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const profiles = buildChildNightMonitoringProfiles(records);
    // freq=0, rate1=3 (100%), rate2=3 (100%), diversity=0 (1 cat) = min(10, 6)
    expect(profiles[0].overallScore).toBe(6);
  });

  it("frequency score: 1 for 5–9 records", () => {
    const records = makeFullRecords(5, { childId: "child-1", childName: "Alice" }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const profiles = buildChildNightMonitoringProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0 (1 cat) = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("frequency score: 2 for >=10 records", () => {
    const records = makeFullRecords(10, { childId: "child-1", childName: "Alice" }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const profiles = buildChildNightMonitoringProfiles(records);
    // freq=2, rate1=3, rate2=3, diversity=0 (1 cat) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("rate1 (checkCompletedOnTimeRate): 3 at >=80%, 2 at >=60%, 1 at >=40%, 0 below", () => {
    // 80% = 3
    const r80 = makeFullRecords(5, { childId: "c1", childName: "C" }).map((r, i) => ({
      ...r, id: `r-${i}`, checkCompletedOnTime: i < 4, // 4/5 = 80%
    }));
    const p80 = buildChildNightMonitoringProfiles(r80);
    expect(p80[0].checkCompletedOnTimeRate).toBe(80);

    // 60% = 2
    const r60 = makeFullRecords(5, { childId: "c1", childName: "C" }).map((r, i) => ({
      ...r, id: `r-${i}`, checkCompletedOnTime: i < 3, // 3/5 = 60%
    }));
    const p60 = buildChildNightMonitoringProfiles(r60);
    expect(p60[0].checkCompletedOnTimeRate).toBe(60);
  });

  it("rate2 (observationsRecordedRate): tiered scoring", () => {
    // All observations = 100% → rate2=3
    const r100 = makeFullRecords(5, { childId: "c1", childName: "C" }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const p100 = buildChildNightMonitoringProfiles(r100);
    expect(p100[0].observationsRecordedRate).toBe(100);
  });

  it("diversity bonus: 0 for 1 category, 1 for 2–3, 2 for >=4", () => {
    // 1 category → 0
    const r1 = [makeRecord({ id: "a", childId: "c1", childName: "C", category: "welfare_check" })];
    const p1 = buildChildNightMonitoringProfiles(r1);
    // freq=0, rate1=3, rate2=3, div=0 = 6
    expect(p1[0].overallScore).toBe(6);

    // 2 categories → 1
    const r2 = [
      makeRecord({ id: "a", childId: "c1", childName: "C", category: "welfare_check" }),
      makeRecord({ id: "b", childId: "c1", childName: "C", category: "sleep_observation" }),
    ];
    const p2 = buildChildNightMonitoringProfiles(r2);
    // freq=0, rate1=3, rate2=3, div=1 = 7
    expect(p2[0].overallScore).toBe(7);

    // 4 categories → 2
    const r4 = [
      makeRecord({ id: "a", childId: "c1", childName: "C", category: "welfare_check" }),
      makeRecord({ id: "b", childId: "c1", childName: "C", category: "sleep_observation" }),
      makeRecord({ id: "c", childId: "c1", childName: "C", category: "medication_round" }),
      makeRecord({ id: "d", childId: "c1", childName: "C", category: "waking_night_check" }),
    ];
    const p4 = buildChildNightMonitoringProfiles(r4);
    // freq=0, rate1=3, rate2=3, div=2 = 8
    expect(p4[0].overallScore).toBe(8);
  });

  it("caps at 10", () => {
    const allCategories: NightMonitoringCategory[] = [
      "waking_night_check", "sleep_observation", "night_incident_response", "medication_round",
      "disturbance_management", "handover_briefing", "welfare_check", "environmental_check",
    ];
    // 10+ records, all true rates, 8 categories → freq=2, rate1=3, rate2=3, div=2 = 10
    const records = allCategories.flatMap((cat, ci) =>
      [0, 1].map((j) => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", childName: "C", category: cat }))
    );
    const profiles = buildChildNightMonitoringProfiles(records);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("tracks categoriesCovered correctly", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", childName: "C", category: "welfare_check" }),
      makeRecord({ id: "b", childId: "c1", childName: "C", category: "sleep_observation" }),
      makeRecord({ id: "c", childId: "c1", childName: "C", category: "welfare_check" }),
    ];
    const profiles = buildChildNightMonitoringProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
    expect(profiles[0].categoriesCovered).toContain("welfare_check");
    expect(profiles[0].categoriesCovered).toContain("sleep_observation");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Orchestrator
// ═══════════════════════════════════════════════════════════════════════════

describe("generateNightMonitoringIntelligence", () => {
  it("produces outstanding result for perfect data", () => {
    const allCategories: NightMonitoringCategory[] = [
      "waking_night_check", "sleep_observation", "night_incident_response", "medication_round",
      "disturbance_management", "handover_briefing", "welfare_check", "environmental_check",
    ];
    const records = allCategories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, date: "2026-03-15", category: cat })
    );
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-12-31");
  });

  it("produces inadequate result for empty data", () => {
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("filters records by period", () => {
    const records = [
      makeRecord({ id: "in", date: "2026-06-15" }),
      makeRecord({ id: "out", date: "2025-01-01" }),
    ];
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.nightMonitoringQuality.totalRecords).toBe(1);
  });

  it("includes all four evaluator results", () => {
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.nightMonitoringQuality).toBeDefined();
    expect(result.nightMonitoringCompliance).toBeDefined();
    expect(result.nightMonitoringPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
  });

  it("includes child profiles", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", childName: "Alice" }),
      makeRecord({ id: "b", childId: "c2", childName: "Bob" }),
    ];
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.childProfiles).toHaveLength(2);
  });

  it("overall score = sum of 4 evaluators, capped at 100", () => {
    const allCategories: NightMonitoringCategory[] = [
      "waking_night_check", "sleep_observation", "night_incident_response", "medication_round",
      "disturbance_management", "handover_briefing", "welfare_check", "environmental_check",
    ];
    const records = allCategories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, category: cat })
    );
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    const expected = Math.min(100, Math.round(
      result.nightMonitoringQuality.overallScore +
      result.nightMonitoringCompliance.overallScore +
      result.nightMonitoringPolicy.overallScore +
      result.staffReadiness.overallScore
    ));
    expect(result.overallScore).toBe(expected);
  });

  it("generates strengths for outstanding rating", () => {
    const allCategories: NightMonitoringCategory[] = [
      "waking_night_check", "sleep_observation", "night_incident_response", "medication_round",
      "disturbance_management", "handover_briefing", "welfare_check", "environmental_check",
    ];
    const records = allCategories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates areas for improvement when no records", () => {
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.areasForImprovement.some((a) => a.includes("No night monitoring records"))).toBe(true);
  });

  it("generates actions when policy is null", () => {
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates actions when staff is empty", () => {
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: makeAllTruePolicy(),
      staff: [],
    });
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("includes regulatory links", () => {
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 22"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 7"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("generates no-action message when everything is good", () => {
    const allCategories: NightMonitoringCategory[] = [
      "waking_night_check", "sleep_observation", "night_incident_response", "medication_round",
      "disturbance_management", "handover_briefing", "welfare_check", "environmental_check",
    ];
    const records = allCategories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  it("flags low check completion actions", () => {
    // All checks fail
    const records = makeFullRecords(10, {
      checkCompletedOnTime: false,
      observationsRecorded: false,
    }).map((r, i) => ({ ...r, id: `r-${i}` }));
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("Night check completion"))).toBe(true);
  });

  it("identifies low-score children for action", () => {
    // child with very low scores
    const records = [
      makeRecord({
        id: "a", childId: "c1", childName: "Alice",
        checkCompletedOnTime: false, observationsRecorded: false, incidentEscalated: false, childWelfareConfirmed: false,
        documentationComplete: false, timelyRecording: false,
      }),
    ];
    const result = generateNightMonitoringIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeAllTruePolicy(),
      staff: [makeStaff()],
    });
    // Child score: freq=0, rate1=0 (0%), rate2=0 (0%), div=0 (1 cat) = 0 → <= 3 → flagged
    expect(result.actions.some((a) => a.includes("child(ren) with low night monitoring scores"))).toBe(true);
  });
});
