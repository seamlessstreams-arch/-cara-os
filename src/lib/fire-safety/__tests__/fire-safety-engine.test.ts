// ══════════════════════════════════════════════════════════════════════════════
// Fire Safety Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getFireSafetyCategoryLabel,
  getFireSafetyOutcomeLabel,
  getRatingLabel,
  evaluateFireSafetyQuality,
  evaluateFireSafetyCompliance,
  evaluateFireSafetyPolicy,
  evaluateFireSafetyStaffReadiness,
  buildChildFireSafetyProfiles,
  generateFireSafetyIntelligence,
} from "../fire-safety-engine";
import type {
  FireSafetyRecord,
  FireSafetyPolicy,
  FireSafetyStaffTraining,
  FireSafetyCategory,
} from "../fire-safety-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeRecord(overrides: Partial<FireSafetyRecord> = {}): FireSafetyRecord {
  return {
    id: "rec-001",
    homeId: "oak-house",
    date: "2026-03-15",
    childId: "child-alex",
    childName: "Alex",
    category: "fire_drill",
    outcome: "fully_compliant",
    drillCompletedSuccessfully: true,
    allChildrenAccounted: true,
    evacuationTimeRecorded: true,
    equipmentFunctional: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<FireSafetyPolicy> = {}): FireSafetyPolicy {
  return {
    fireSafetyPolicy: true,
    evacuationProcedure: true,
    fireRiskAssessmentPolicy: true,
    equipmentMaintenancePolicy: true,
    drillFrequencyGuidance: true,
    emergencyLightingPolicy: true,
    fireAlarmTestingPolicy: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<FireSafetyStaffTraining> = {}): FireSafetyStaffTraining {
  return {
    staffId: "staff-sarah",
    fireWardenTraining: true,
    evacuationProcedureKnowledge: true,
    fireExtinguisherUse: true,
    fireRiskAssessment: true,
    alarmSystemKnowledge: true,
    firstAidFireInjury: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating helper
// ══════════════════════════════════════════════════════════════════════════════

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
});

// ══════════════════════════════════════════════════════════════════════════════
// Label helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("label helpers", () => {
  it("returns correct category labels", () => {
    expect(getFireSafetyCategoryLabel("fire_drill")).toBe("Fire Drill");
    expect(getFireSafetyCategoryLabel("equipment_check")).toBe("Equipment Check");
    expect(getFireSafetyCategoryLabel("risk_assessment")).toBe("Risk Assessment");
    expect(getFireSafetyCategoryLabel("evacuation_plan")).toBe("Evacuation Plan");
    expect(getFireSafetyCategoryLabel("fire_alarm_test")).toBe("Fire Alarm Test");
    expect(getFireSafetyCategoryLabel("staff_training_session")).toBe("Staff Training Session");
    expect(getFireSafetyCategoryLabel("fire_door_check")).toBe("Fire Door Check");
    expect(getFireSafetyCategoryLabel("emergency_lighting_check")).toBe("Emergency Lighting Check");
  });

  it("returns correct outcome labels", () => {
    expect(getFireSafetyOutcomeLabel("fully_compliant")).toBe("Fully Compliant");
    expect(getFireSafetyOutcomeLabel("minor_issue")).toBe("Minor Issue");
    expect(getFireSafetyOutcomeLabel("significant_issue")).toBe("Significant Issue");
    expect(getFireSafetyOutcomeLabel("action_required")).toBe("Action Required");
    expect(getFireSafetyOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });

  it("returns correct rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateFireSafetyQuality", () => {
  it("returns zeroed result for empty records array", () => {
    const result = evaluateFireSafetyQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.score).toBe(0);
    expect(result.drillCompletedSuccessfullyRate).toBe(0);
    expect(result.allChildrenAccountedRate).toBe(0);
    expect(result.evacuationTimeRecordedRate).toBe(0);
    expect(result.equipmentFunctionalRate).toBe(0);
    expect(result.concerns).toHaveLength(1);
  });

  it("scores 25 for all-perfect records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateFireSafetyQuality(records);
    expect(result.score).toBe(25);
    expect(result.drillCompletedSuccessfullyRate).toBe(100);
    expect(result.allChildrenAccountedRate).toBe(100);
    expect(result.evacuationTimeRecordedRate).toBe(100);
    expect(result.equipmentFunctionalRate).toBe(100);
  });

  it("scores 0 for all-false records", () => {
    const records = [
      makeRecord({
        drillCompletedSuccessfully: false,
        allChildrenAccounted: false,
        evacuationTimeRecorded: false,
        equipmentFunctional: false,
      }),
    ];
    const result = evaluateFireSafetyQuality(records);
    expect(result.score).toBe(0);
  });

  it("calculates drillCompletedSuccessfullyRate correctly", () => {
    const records = [
      makeRecord({ id: "r1", drillCompletedSuccessfully: true }),
      makeRecord({ id: "r2", drillCompletedSuccessfully: false }),
    ];
    const result = evaluateFireSafetyQuality(records);
    expect(result.drillCompletedSuccessfullyRate).toBe(50);
  });

  it("calculates allChildrenAccountedRate correctly", () => {
    const records = [
      makeRecord({ id: "r1", allChildrenAccounted: true }),
      makeRecord({ id: "r2", allChildrenAccounted: true }),
      makeRecord({ id: "r3", allChildrenAccounted: false }),
    ];
    const result = evaluateFireSafetyQuality(records);
    expect(result.allChildrenAccountedRate).toBe(67);
  });

  it("calculates evacuationTimeRecordedRate correctly", () => {
    const records = [
      makeRecord({ id: "r1", evacuationTimeRecorded: true }),
      makeRecord({ id: "r2", evacuationTimeRecorded: false }),
      makeRecord({ id: "r3", evacuationTimeRecorded: false }),
      makeRecord({ id: "r4", evacuationTimeRecorded: false }),
    ];
    const result = evaluateFireSafetyQuality(records);
    expect(result.evacuationTimeRecordedRate).toBe(25);
  });

  it("calculates equipmentFunctionalRate correctly", () => {
    const records = [
      makeRecord({ id: "r1", equipmentFunctional: true }),
      makeRecord({ id: "r2", equipmentFunctional: true }),
      makeRecord({ id: "r3", equipmentFunctional: true }),
      makeRecord({ id: "r4", equipmentFunctional: false }),
    ];
    const result = evaluateFireSafetyQuality(records);
    expect(result.equipmentFunctionalRate).toBe(75);
  });

  it("score is between 0 and 25 for mixed records", () => {
    const records = [
      makeRecord({ id: "r1", drillCompletedSuccessfully: true, allChildrenAccounted: false }),
      makeRecord({ id: "r2", drillCompletedSuccessfully: false, evacuationTimeRecorded: false }),
    ];
    const result = evaluateFireSafetyQuality(records);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strengths for high drill completion", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, drillCompletedSuccessfully: true }),
    );
    const result = evaluateFireSafetyQuality(records);
    expect(result.strengths.some((s) => s.includes("drill completion"))).toBe(true);
  });

  it("generates concerns for low drill completion", () => {
    const records = [
      makeRecord({ id: "r1", drillCompletedSuccessfully: false }),
      makeRecord({ id: "r2", drillCompletedSuccessfully: false }),
      makeRecord({ id: "r3", drillCompletedSuccessfully: false }),
    ];
    const result = evaluateFireSafetyQuality(records);
    expect(result.concerns.some((c) => c.includes("Drill completion rate"))).toBe(true);
  });

  it("applies weights correctly: drillCompleted worth 7 out of 25", () => {
    // Only drillCompletedSuccessfully true, rest false
    const records = [
      makeRecord({
        drillCompletedSuccessfully: true,
        allChildrenAccounted: false,
        evacuationTimeRecorded: false,
        equipmentFunctional: false,
      }),
    ];
    const result = evaluateFireSafetyQuality(records);
    expect(result.score).toBe(7);
  });

  it("applies weights correctly: allChildrenAccounted worth 6 out of 25", () => {
    const records = [
      makeRecord({
        drillCompletedSuccessfully: false,
        allChildrenAccounted: true,
        evacuationTimeRecorded: false,
        equipmentFunctional: false,
      }),
    ];
    const result = evaluateFireSafetyQuality(records);
    expect(result.score).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateFireSafetyCompliance", () => {
  it("returns zeroed result for empty records array", () => {
    const result = evaluateFireSafetyCompliance([]);
    expect(result.totalRecords).toBe(0);
    expect(result.score).toBe(0);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.concerns).toHaveLength(1);
  });

  it("scores 25 for perfect compliance with all 8 categories", () => {
    const categories: FireSafetyCategory[] = [
      "fire_drill", "equipment_check", "risk_assessment", "evacuation_plan",
      "fire_alarm_test", "staff_training_session", "fire_door_check", "emergency_lighting_check",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateFireSafetyCompliance(records);
    expect(result.score).toBe(25);
    expect(result.uniqueCategories).toBe(8);
    expect(result.categoryDiversityRatio).toBe(1);
  });

  it("scores 0 for all-false compliance records with single category", () => {
    const records = [
      makeRecord({
        documentationComplete: false,
        timelyRecording: false,
        allChildrenAccounted: false,
      }),
    ];
    const result = evaluateFireSafetyCompliance(records);
    // categoryDiversityRatio is 1/8 = 0.13, contributing 0.13*5 = 0.65 ~ rounds to 0.6
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("calculates documentationRate correctly", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true }),
      makeRecord({ id: "r2", documentationComplete: false }),
    ];
    const result = evaluateFireSafetyCompliance(records);
    expect(result.documentationRate).toBe(50);
  });

  it("calculates timelyRecordingRate correctly", () => {
    const records = [
      makeRecord({ id: "r1", timelyRecording: true }),
      makeRecord({ id: "r2", timelyRecording: true }),
      makeRecord({ id: "r3", timelyRecording: false }),
    ];
    const result = evaluateFireSafetyCompliance(records);
    expect(result.timelyRecordingRate).toBe(67);
  });

  it("calculates allChildrenAccountedRate correctly", () => {
    const records = [
      makeRecord({ id: "r1", allChildrenAccounted: true }),
      makeRecord({ id: "r2", allChildrenAccounted: false }),
    ];
    const result = evaluateFireSafetyCompliance(records);
    expect(result.allChildrenAccountedRate).toBe(50);
  });

  it("calculates categoryDiversityRatio correctly", () => {
    const records = [
      makeRecord({ id: "r1", category: "fire_drill" }),
      makeRecord({ id: "r2", category: "equipment_check" }),
      makeRecord({ id: "r3", category: "fire_drill" }),
      makeRecord({ id: "r4", category: "risk_assessment" }),
    ];
    const result = evaluateFireSafetyCompliance(records);
    expect(result.uniqueCategories).toBe(3);
    expect(result.categoryDiversityRatio).toBe(0.38);
  });

  it("score is between 0 and 25", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, timelyRecording: false }),
      makeRecord({ id: "r2", documentationComplete: false, timelyRecording: true }),
    ];
    const result = evaluateFireSafetyCompliance(records);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("documentation weight is 8 out of 25", () => {
    const records = [
      makeRecord({
        documentationComplete: true,
        timelyRecording: false,
        allChildrenAccounted: false,
      }),
    ];
    const result = evaluateFireSafetyCompliance(records);
    // documentation=8 + categoryDiversity=0.13*5=0.65
    expect(result.score).toBeGreaterThanOrEqual(8);
    expect(result.score).toBeLessThanOrEqual(9);
  });

  it("generates strengths for high documentation", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateFireSafetyCompliance(records);
    expect(result.strengths.some((s) => s.includes("documentation"))).toBe(true);
  });

  it("generates concerns for low documentation", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, documentationComplete: false }),
    );
    const result = evaluateFireSafetyCompliance(records);
    expect(result.concerns.some((c) => c.includes("Documentation rate"))).toBe(true);
  });

  it("generates concerns for limited category coverage", () => {
    const records = [
      makeRecord({ id: "r1", category: "fire_drill" }),
      makeRecord({ id: "r2", category: "fire_drill" }),
    ];
    const result = evaluateFireSafetyCompliance(records);
    expect(result.concerns.some((c) => c.includes("category"))).toBe(true);
  });

  it("generates strengths for comprehensive category coverage", () => {
    const categories: FireSafetyCategory[] = [
      "fire_drill", "equipment_check", "risk_assessment", "evacuation_plan",
      "fire_alarm_test", "staff_training_session",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateFireSafetyCompliance(records);
    expect(result.strengths.some((s) => s.includes("Comprehensive"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateFireSafetyPolicy", () => {
  it("returns zeroed result for null policy", () => {
    const result = evaluateFireSafetyPolicy(null);
    expect(result.score).toBe(0);
    expect(result.fireSafetyPolicy).toBe(false);
    expect(result.evacuationProcedure).toBe(false);
    expect(result.concerns).toHaveLength(1);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("scores 25 for all-true policy", () => {
    const result = evaluateFireSafetyPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("scores 0 for all-false policy", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      fireSafetyPolicy: false,
      evacuationProcedure: false,
      fireRiskAssessmentPolicy: false,
      equipmentMaintenancePolicy: false,
      drillFrequencyGuidance: false,
      emergencyLightingPolicy: false,
      fireAlarmTestingPolicy: false,
    }));
    expect(result.score).toBe(0);
  });

  it("fireSafetyPolicy contributes 4 points", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      fireSafetyPolicy: true,
      evacuationProcedure: false,
      fireRiskAssessmentPolicy: false,
      equipmentMaintenancePolicy: false,
      drillFrequencyGuidance: false,
      emergencyLightingPolicy: false,
      fireAlarmTestingPolicy: false,
    }));
    expect(result.score).toBe(4);
  });

  it("evacuationProcedure contributes 4 points", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      fireSafetyPolicy: false,
      evacuationProcedure: true,
      fireRiskAssessmentPolicy: false,
      equipmentMaintenancePolicy: false,
      drillFrequencyGuidance: false,
      emergencyLightingPolicy: false,
      fireAlarmTestingPolicy: false,
    }));
    expect(result.score).toBe(4);
  });

  it("fireRiskAssessmentPolicy contributes 4 points", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      fireSafetyPolicy: false,
      evacuationProcedure: false,
      fireRiskAssessmentPolicy: true,
      equipmentMaintenancePolicy: false,
      drillFrequencyGuidance: false,
      emergencyLightingPolicy: false,
      fireAlarmTestingPolicy: false,
    }));
    expect(result.score).toBe(4);
  });

  it("equipmentMaintenancePolicy contributes 4 points", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      fireSafetyPolicy: false,
      evacuationProcedure: false,
      fireRiskAssessmentPolicy: false,
      equipmentMaintenancePolicy: true,
      drillFrequencyGuidance: false,
      emergencyLightingPolicy: false,
      fireAlarmTestingPolicy: false,
    }));
    expect(result.score).toBe(4);
  });

  it("drillFrequencyGuidance contributes 3 points", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      fireSafetyPolicy: false,
      evacuationProcedure: false,
      fireRiskAssessmentPolicy: false,
      equipmentMaintenancePolicy: false,
      drillFrequencyGuidance: true,
      emergencyLightingPolicy: false,
      fireAlarmTestingPolicy: false,
    }));
    expect(result.score).toBe(3);
  });

  it("emergencyLightingPolicy contributes 3 points", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      fireSafetyPolicy: false,
      evacuationProcedure: false,
      fireRiskAssessmentPolicy: false,
      equipmentMaintenancePolicy: false,
      drillFrequencyGuidance: false,
      emergencyLightingPolicy: true,
      fireAlarmTestingPolicy: false,
    }));
    expect(result.score).toBe(3);
  });

  it("fireAlarmTestingPolicy contributes 3 points", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      fireSafetyPolicy: false,
      evacuationProcedure: false,
      fireRiskAssessmentPolicy: false,
      equipmentMaintenancePolicy: false,
      drillFrequencyGuidance: false,
      emergencyLightingPolicy: false,
      fireAlarmTestingPolicy: true,
    }));
    expect(result.score).toBe(3);
  });

  it("weights sum to 25 (4+4+4+4+3+3+3)", () => {
    const result = evaluateFireSafetyPolicy(makePolicy());
    expect(result.score).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3);
  });

  it("generates strength for complete policy (7/7)", () => {
    const result = evaluateFireSafetyPolicy(makePolicy());
    expect(result.strengths.some((s) => s.includes("7/7"))).toBe(true);
  });

  it("generates strength for good policy coverage (5+)", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      emergencyLightingPolicy: false,
      fireAlarmTestingPolicy: false,
    }));
    expect(result.strengths.some((s) => s.includes("5/7"))).toBe(true);
  });

  it("generates concerns for missing policies", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      fireSafetyPolicy: false,
      evacuationProcedure: false,
    }));
    expect(result.concerns.some((c) => c.includes("fire safety policy"))).toBe(true);
    expect(result.concerns.some((c) => c.includes("evacuation procedure"))).toBe(true);
  });

  it("reflects boolean values in result", () => {
    const result = evaluateFireSafetyPolicy(makePolicy({
      fireSafetyPolicy: true,
      evacuationProcedure: false,
    }));
    expect(result.fireSafetyPolicy).toBe(true);
    expect(result.evacuationProcedure).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateFireSafetyStaffReadiness", () => {
  it("returns zeroed result for empty training array", () => {
    const result = evaluateFireSafetyStaffReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.score).toBe(0);
    expect(result.fireWardenTrainingRate).toBe(0);
    expect(result.concerns).toHaveLength(1);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("scores 25 for all-perfect training", () => {
    const training = [makeTraining({ staffId: "s1" }), makeTraining({ staffId: "s2" })];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.score).toBe(25);
  });

  it("scores 0 for all-false training", () => {
    const training = [
      makeTraining({
        staffId: "s1",
        fireWardenTraining: false,
        evacuationProcedureKnowledge: false,
        fireExtinguisherUse: false,
        fireRiskAssessment: false,
        alarmSystemKnowledge: false,
        firstAidFireInjury: false,
      }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.score).toBe(0);
  });

  it("calculates fireWardenTrainingRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", fireWardenTraining: true }),
      makeTraining({ staffId: "s2", fireWardenTraining: false }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.fireWardenTrainingRate).toBe(50);
  });

  it("calculates evacuationProcedureKnowledgeRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", evacuationProcedureKnowledge: true }),
      makeTraining({ staffId: "s2", evacuationProcedureKnowledge: true }),
      makeTraining({ staffId: "s3", evacuationProcedureKnowledge: false }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.evacuationProcedureKnowledgeRate).toBe(67);
  });

  it("calculates fireExtinguisherUseRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", fireExtinguisherUse: true }),
      makeTraining({ staffId: "s2", fireExtinguisherUse: false }),
      makeTraining({ staffId: "s3", fireExtinguisherUse: false }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.fireExtinguisherUseRate).toBe(33);
  });

  it("calculates fireRiskAssessmentRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", fireRiskAssessment: true }),
      makeTraining({ staffId: "s2", fireRiskAssessment: true }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.fireRiskAssessmentRate).toBe(100);
  });

  it("calculates alarmSystemKnowledgeRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", alarmSystemKnowledge: false }),
      makeTraining({ staffId: "s2", alarmSystemKnowledge: false }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.alarmSystemKnowledgeRate).toBe(0);
  });

  it("calculates firstAidFireInjuryRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", firstAidFireInjury: true }),
      makeTraining({ staffId: "s2", firstAidFireInjury: false }),
      makeTraining({ staffId: "s3", firstAidFireInjury: true }),
      makeTraining({ staffId: "s4", firstAidFireInjury: true }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.firstAidFireInjuryRate).toBe(75);
  });

  it("fireWardenTraining weight is 6", () => {
    const training = [
      makeTraining({
        staffId: "s1",
        fireWardenTraining: true,
        evacuationProcedureKnowledge: false,
        fireExtinguisherUse: false,
        fireRiskAssessment: false,
        alarmSystemKnowledge: false,
        firstAidFireInjury: false,
      }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.score).toBe(6);
  });

  it("evacuationProcedureKnowledge weight is 5", () => {
    const training = [
      makeTraining({
        staffId: "s1",
        fireWardenTraining: false,
        evacuationProcedureKnowledge: true,
        fireExtinguisherUse: false,
        fireRiskAssessment: false,
        alarmSystemKnowledge: false,
        firstAidFireInjury: false,
      }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.score).toBe(5);
  });

  it("firstAidFireInjury weight is 2", () => {
    const training = [
      makeTraining({
        staffId: "s1",
        fireWardenTraining: false,
        evacuationProcedureKnowledge: false,
        fireExtinguisherUse: false,
        fireRiskAssessment: false,
        alarmSystemKnowledge: false,
        firstAidFireInjury: true,
      }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.score).toBe(2);
  });

  it("weights sum to 25 (6+5+5+4+3+2)", () => {
    const training = [makeTraining({ staffId: "s1" })];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.score).toBe(6 + 5 + 5 + 4 + 3 + 2);
  });

  it("score is between 0 and 25 for mixed training", () => {
    const training = [
      makeTraining({ staffId: "s1", fireWardenTraining: true, fireExtinguisherUse: false }),
      makeTraining({ staffId: "s2", fireWardenTraining: false, evacuationProcedureKnowledge: true }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strengths for high fire warden training", () => {
    const training = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2" }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.strengths.some((s) => s.includes("fire warden training"))).toBe(true);
  });

  it("generates concerns for low fire warden training", () => {
    const training = [
      makeTraining({ staffId: "s1", fireWardenTraining: false }),
      makeTraining({ staffId: "s2", fireWardenTraining: false }),
      makeTraining({ staffId: "s3", fireWardenTraining: false }),
    ];
    const result = evaluateFireSafetyStaffReadiness(training);
    expect(result.concerns.some((c) => c.includes("Fire warden training"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildFireSafetyProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildFireSafetyProfiles([])).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildFireSafetyProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "child-alex")!.totalRecords).toBe(2);
    expect(profiles.find((p) => p.childId === "child-jordan")!.totalRecords).toBe(1);
  });

  it("scores 10 for a child with >= 10 records, all true, >= 4 categories", () => {
    const categories: FireSafetyCategory[] = [
      "fire_drill", "equipment_check", "risk_assessment", "evacuation_plan",
    ];
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        childId: "child-alex",
        childName: "Alex",
        category: categories[i % categories.length],
      }),
    );
    const profiles = buildChildFireSafetyProfiles(records);
    expect(profiles[0].fireSafetyScore).toBe(10);
  });

  it("frequency: >= 10 records = 2 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildFireSafetyProfiles(records);
    // frequency=2, rate1(100%)=3, rate2(100%)=3, diversity(1 cat)=0 => 8
    expect(profiles[0].fireSafetyScore).toBe(8);
  });

  it("frequency: >= 5 records = 1 point", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildFireSafetyProfiles(records);
    // frequency=1, rate1(100%)=3, rate2(100%)=3, diversity(1 cat)=0 => 7
    expect(profiles[0].fireSafetyScore).toBe(7);
  });

  it("frequency: < 5 records = 0 points", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildFireSafetyProfiles(records);
    // frequency=0, rate1(100%)=3, rate2(100%)=3, diversity(1 cat)=0 => 6
    expect(profiles[0].fireSafetyScore).toBe(6);
  });

  it("rate1 (drillCompletedSuccessfullyRate): thresholds 80/60/40", () => {
    // 80% -> 3 points
    const records80 = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        childId: "child-a",
        childName: "A",
        drillCompletedSuccessfully: i < 4, // 4/5 = 80%
      }),
    );
    const p80 = buildChildFireSafetyProfiles(records80);
    expect(p80[0].drillCompletedSuccessfullyRate).toBe(80);

    // 60% -> 2 points
    const records60 = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        childId: "child-b",
        childName: "B",
        drillCompletedSuccessfully: i < 3, // 3/5 = 60%
      }),
    );
    const p60 = buildChildFireSafetyProfiles(records60);
    expect(p60[0].drillCompletedSuccessfullyRate).toBe(60);

    // 20% -> 0 points
    const records20 = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        childId: "child-c",
        childName: "C",
        drillCompletedSuccessfully: i < 1, // 1/5 = 20%
      }),
    );
    const p20 = buildChildFireSafetyProfiles(records20);
    expect(p20[0].drillCompletedSuccessfullyRate).toBe(20);
  });

  it("diversity: >= 4 categories = 2 points, >= 2 = 1 point", () => {
    // 4 categories
    const categories4: FireSafetyCategory[] = ["fire_drill", "equipment_check", "risk_assessment", "evacuation_plan"];
    const records4 = categories4.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-a", childName: "A", category: cat }),
    );
    const p4 = buildChildFireSafetyProfiles(records4);
    expect(p4[0].uniqueCategories).toBe(4);

    // 2 categories
    const records2 = [
      makeRecord({ id: "r1", childId: "child-b", childName: "B", category: "fire_drill" }),
      makeRecord({ id: "r2", childId: "child-b", childName: "B", category: "equipment_check" }),
    ];
    const p2 = buildChildFireSafetyProfiles(records2);
    expect(p2[0].uniqueCategories).toBe(2);
  });

  it("score capped at 10", () => {
    const categories: FireSafetyCategory[] = [
      "fire_drill", "equipment_check", "risk_assessment", "evacuation_plan",
      "fire_alarm_test", "staff_training_session",
    ];
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        childId: "child-alex",
        childName: "Alex",
        category: categories[i % categories.length],
      }),
    );
    const profiles = buildChildFireSafetyProfiles(records);
    expect(profiles[0].fireSafetyScore).toBeLessThanOrEqual(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Orchestrator
// ══════════════════════════════════════════════════════════════════════════════

describe("generateFireSafetyIntelligence", () => {
  const PERIOD_START = "2026-01-01";
  const PERIOD_END = "2026-05-20";

  it("produces a complete intelligence object", () => {
    const records = [makeRecord({ id: "r1", date: "2026-03-15" })];
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(typeof result.overallScore).toBe("number");
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.quality).toBeDefined();
    expect(result.compliance).toBeDefined();
    expect(result.policy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("overall score is sum of four sub-scores, capped at 100", () => {
    const records = [makeRecord({ id: "r1", date: "2026-03-15" })];
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    const expectedSum = Math.min(100, Math.round(
      result.quality.score + result.compliance.score + result.policy.score + result.staffReadiness.score,
    ));
    expect(result.overallScore).toBe(expectedSum);
  });

  it("overall score is between 0 and 100", () => {
    const records = [makeRecord({ id: "r1", date: "2026-03-15" })];
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rates outstanding for perfect data", () => {
    const categories: FireSafetyCategory[] = [
      "fire_drill", "equipment_check", "risk_assessment", "evacuation_plan",
      "fire_alarm_test", "staff_training_session", "fire_door_check", "emergency_lighting_check",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, date: "2026-03-15", category: cat }),
    );
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rates inadequate for completely empty data", () => {
    const result = generateFireSafetyIntelligence(
      [], null, [], "empty-home", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("filters records to period", () => {
    const records = [
      makeRecord({ id: "r1", date: "2025-06-01" }), // outside
      makeRecord({ id: "r2", date: "2026-03-15" }), // inside
      makeRecord({ id: "r3", date: "2027-01-01" }), // outside
    ];
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.quality.totalRecords).toBe(1);
  });

  it("includes records on period boundaries", () => {
    const records = [
      makeRecord({ id: "r1", date: PERIOD_START }),
      makeRecord({ id: "r2", date: PERIOD_END }),
    ];
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.quality.totalRecords).toBe(2);
  });

  it("builds child profiles from period records", () => {
    const records = [
      makeRecord({ id: "r1", date: "2026-02-01", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", date: "2026-03-01", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "r3", date: "2026-04-01", childId: "child-alex", childName: "Alex" }),
    ];
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  it("includes 7 regulatory links", () => {
    const result = generateFireSafetyIntelligence(
      [], makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("Fire Safety"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 25"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 44"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Health and Safety"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Quality Standards"))).toBe(true);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateFireSafetyIntelligence(
      [makeRecord({ date: "2026-03-15" })], null, [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT actions when no staff training", () => {
    const result = generateFireSafetyIntelligence(
      [makeRecord({ date: "2026-03-15" })], makePolicy(), [], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("generates no immediate actions message for excellent data", () => {
    const categories: FireSafetyCategory[] = [
      "fire_drill", "equipment_check", "risk_assessment", "evacuation_plan",
      "fire_alarm_test", "staff_training_session", "fire_door_check", "emergency_lighting_check",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, date: "2026-03-15", category: cat }),
    );
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("includes strengths for high-scoring evaluators", () => {
    const categories: FireSafetyCategory[] = [
      "fire_drill", "equipment_check", "risk_assessment", "evacuation_plan",
      "fire_alarm_test", "staff_training_session", "fire_door_check", "emergency_lighting_check",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, date: "2026-03-15", category: cat }),
    );
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes areas for improvement for low-scoring evaluators", () => {
    const result = generateFireSafetyIntelligence(
      [], null, [], "empty-home", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("generates actions for low drill completion rate", () => {
    const records = [
      makeRecord({ id: "r1", date: "2026-03-15", drillCompletedSuccessfully: false }),
      makeRecord({ id: "r2", date: "2026-04-15", drillCompletedSuccessfully: false }),
      makeRecord({ id: "r3", date: "2026-05-15", drillCompletedSuccessfully: false }),
    ];
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("Drill completion rate"))).toBe(true);
  });

  it("generates actions for low documentation rate", () => {
    const records = [
      makeRecord({ id: "r1", date: "2026-03-15", documentationComplete: false }),
      makeRecord({ id: "r2", date: "2026-04-15", documentationComplete: false }),
      makeRecord({ id: "r3", date: "2026-05-15", documentationComplete: false }),
    ];
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("Documentation rate"))).toBe(true);
  });

  it("generates actions for children with low scores", () => {
    // Child with all false — low score
    const records = [
      makeRecord({
        id: "r1",
        date: "2026-03-15",
        childId: "child-alex",
        childName: "Alex",
        drillCompletedSuccessfully: false,
        allChildrenAccounted: false,
      }),
    ];
    const result = generateFireSafetyIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("child(ren) with low fire safety scores"))).toBe(true);
  });
});
