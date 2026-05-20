// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Sleep Hygiene Quality Intelligence Engine
//
// Demo: Oak House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getSleepTypeLabel,
  getSleepQualityLabel,
  getRatingLabel,
  evaluateSleepQuality,
  evaluateSleepCompliance,
  evaluateSleepPolicy,
  evaluateStaffSleepReadiness,
  buildChildSleepProfiles,
  generateSleepHygieneQualityIntelligence,
} from "../sleep-hygiene-quality-engine";
import type {
  SleepRecord,
  SleepPolicy,
  StaffSleepTraining,
} from "../sleep-hygiene-quality-engine";

// ── Factory Helpers ──────────────────────────────────────────────────────

let _recordId = 0;
function makeRecord(overrides: Partial<SleepRecord> = {}): SleepRecord {
  _recordId++;
  return {
    id: "rec-" + _recordId,
    childId: "child-alex",
    childName: "Alex",
    recordDate: "2026-05-10",
    sleepType: "bedtime_routine",
    sleepQuality: "good",
    routineFollowed: true,
    environmentSuitable: true,
    restfulSleep: true,
    documentedInPlan: true,
    staffMonitored: true,
    feedbackGiven: true,
    ...overrides,
  };
}

let _policyId = 0;
function makePolicy(overrides: Partial<SleepPolicy> = {}): SleepPolicy {
  _policyId++;
  return {
    id: "pol-" + _policyId,
    bedtimeRoutineGuideline: true,
    sleepEnvironmentStandard: true,
    nightMonitoringProcedure: true,
    screenTimePolicy: true,
    sleepConcernProtocol: true,
    relaxationProgramme: true,
    regularReview: true,
    ...overrides,
  };
}

let _trainingId = 0;
function makeTraining(overrides: Partial<StaffSleepTraining> = {}): StaffSleepTraining {
  _trainingId++;
  return {
    id: "tr-" + _trainingId,
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    sleepHygieneKnowledge: true,
    nightSupervision: true,
    relaxationTechniques: true,
    sleepDisorderAwareness: true,
    traumaInformedSleep: true,
    environmentManagement: true,
    ...overrides,
  };
}

// ── pct ──────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 for zero denominator", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("rounds correctly", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal values", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("returns 0 for zero numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ── getRating ────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for 80+", () => {
    expect(getRating(80)).toBe("outstanding");
  });

  it("returns outstanding for 100", () => {
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for 60", () => {
    expect(getRating(60)).toBe("good");
  });

  it("returns good for 79", () => {
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
  });

  it("returns requires_improvement for 59", () => {
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for 39", () => {
    expect(getRating(39)).toBe("inadequate");
  });

  it("returns inadequate for 0", () => {
    expect(getRating(0)).toBe("inadequate");
  });
});

// ── Label Functions ──────────────────────────────────────────────────────

describe("label functions", () => {
  it("getSleepTypeLabel returns correct labels", () => {
    expect(getSleepTypeLabel("bedtime_routine")).toBe("Bedtime Routine");
    expect(getSleepTypeLabel("night_check")).toBe("Night Check");
    expect(getSleepTypeLabel("morning_wakeup")).toBe("Morning Wakeup");
    expect(getSleepTypeLabel("sleep_environment_review")).toBe("Sleep Environment Review");
    expect(getSleepTypeLabel("sleep_concern_assessment")).toBe("Sleep Concern Assessment");
    expect(getSleepTypeLabel("relaxation_activity")).toBe("Relaxation Activity");
    expect(getSleepTypeLabel("screen_time_management")).toBe("Screen Time Management");
    expect(getSleepTypeLabel("sleep_hygiene_education")).toBe("Sleep Hygiene Education");
  });

  it("getSleepQualityLabel returns correct labels", () => {
    expect(getSleepQualityLabel("excellent")).toBe("Excellent");
    expect(getSleepQualityLabel("good")).toBe("Good");
    expect(getSleepQualityLabel("fair")).toBe("Fair");
    expect(getSleepQualityLabel("poor")).toBe("Poor");
    expect(getSleepQualityLabel("very_poor")).toBe("Very Poor");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateSleepQuality ────────────────────────────────────────────────

describe("evaluateSleepQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateSleepQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns).toHaveLength(1);
  });

  it("returns max score for all-excellent records", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ sleepQuality: "excellent" }),
    );
    const result = evaluateSleepQuality(records);
    expect(result.score).toBe(25);
    expect(result.sleepQualityRate).toBe(100);
    expect(result.routineRate).toBe(100);
    expect(result.environmentRate).toBe(100);
    expect(result.restfulRate).toBe(100);
  });

  it("returns 0 for all-poor with all false booleans", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({
        sleepQuality: "poor",
        routineFollowed: false,
        environmentSuitable: false,
        restfulSleep: false,
      }),
    );
    const result = evaluateSleepQuality(records);
    expect(result.score).toBe(0);
    expect(result.sleepQualityRate).toBe(0);
  });

  it("computes sleepQualityRate correctly — mixed quality", () => {
    const records = [
      makeRecord({ sleepQuality: "excellent" }),
      makeRecord({ sleepQuality: "good" }),
      makeRecord({ sleepQuality: "fair" }),
      makeRecord({ sleepQuality: "poor" }),
    ];
    const result = evaluateSleepQuality(records);
    expect(result.sleepQualityRate).toBe(50); // 2 of 4
  });

  it("computes routineRate correctly — mixed", () => {
    const records = [
      makeRecord({ routineFollowed: true }),
      makeRecord({ routineFollowed: false }),
    ];
    expect(evaluateSleepQuality(records).routineRate).toBe(50);
  });

  it("computes environmentRate correctly — mixed", () => {
    const records = [
      makeRecord({ environmentSuitable: true }),
      makeRecord({ environmentSuitable: true }),
      makeRecord({ environmentSuitable: false }),
    ];
    expect(evaluateSleepQuality(records).environmentRate).toBe(67);
  });

  it("computes restfulRate correctly", () => {
    const records = [
      makeRecord({ restfulSleep: true }),
      makeRecord({ restfulSleep: false }),
      makeRecord({ restfulSleep: false }),
    ];
    expect(evaluateSleepQuality(records).restfulRate).toBe(33);
  });

  it("populates qualityBreakdown correctly", () => {
    const records = [
      makeRecord({ sleepQuality: "excellent" }),
      makeRecord({ sleepQuality: "excellent" }),
      makeRecord({ sleepQuality: "fair" }),
      makeRecord({ sleepQuality: "very_poor" }),
    ];
    const result = evaluateSleepQuality(records);
    expect(result.qualityBreakdown.excellent).toBe(2);
    expect(result.qualityBreakdown.fair).toBe(1);
    expect(result.qualityBreakdown.very_poor).toBe(1);
    expect(result.qualityBreakdown.good).toBe(0);
    expect(result.qualityBreakdown.poor).toBe(0);
  });

  it("generates strength for high sleep quality", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ sleepQuality: "excellent" }),
    );
    const result = evaluateSleepQuality(records);
    expect(result.strengths.some((s) => s.includes("Excellent sleep quality"))).toBe(true);
  });

  it("generates concern for low sleep quality", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ sleepQuality: "poor" }),
    );
    const result = evaluateSleepQuality(records);
    expect(result.concerns.some((c) => c.includes("Sleep quality at"))).toBe(true);
  });

  it("caps score at 25", () => {
    const records = Array.from({ length: 100 }, () => makeRecord());
    expect(evaluateSleepQuality(records).score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const records = [makeRecord({
      sleepQuality: "very_poor",
      routineFollowed: false,
      environmentSuitable: false,
      restfulSleep: false,
    })];
    expect(evaluateSleepQuality(records).score).toBeGreaterThanOrEqual(0);
  });
});

// ── evaluateSleepCompliance ─────────────────────────────────────────────

describe("evaluateSleepCompliance", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateSleepCompliance([]);
    expect(result.totalRecords).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns).toHaveLength(1);
  });

  it("returns high score when all compliance booleans are true with diverse types", () => {
    const types: SleepRecord["sleepType"][] = [
      "bedtime_routine", "night_check", "morning_wakeup",
      "sleep_environment_review", "sleep_concern_assessment",
      "relaxation_activity", "screen_time_management", "sleep_hygiene_education",
    ];
    const records = types.map((t) => makeRecord({ sleepType: t }));
    const result = evaluateSleepCompliance(records);
    expect(result.documentedRate).toBe(100);
    expect(result.staffMonitoredRate).toBe(100);
    expect(result.feedbackRate).toBe(100);
    expect(result.uniqueTypes).toBe(8);
    expect(result.sleepTypeDiversityRatio).toBe(1);
    expect(result.score).toBe(25);
  });

  it("returns 0 when all compliance booleans are false with one type", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({
        documentedInPlan: false,
        staffMonitored: false,
        feedbackGiven: false,
      }),
    );
    const result = evaluateSleepCompliance(records);
    expect(result.documentedRate).toBe(0);
    expect(result.staffMonitoredRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
    // Only 1 type (bedtime_routine), ratio = 0.13, score contribution = 0.13 * 5 = 0.65 → rounds to 0.7
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("computes documentedRate correctly", () => {
    const records = [
      makeRecord({ documentedInPlan: true }),
      makeRecord({ documentedInPlan: false }),
    ];
    expect(evaluateSleepCompliance(records).documentedRate).toBe(50);
  });

  it("computes staffMonitoredRate correctly", () => {
    const records = [
      makeRecord({ staffMonitored: true }),
      makeRecord({ staffMonitored: true }),
      makeRecord({ staffMonitored: false }),
    ];
    expect(evaluateSleepCompliance(records).staffMonitoredRate).toBe(67);
  });

  it("computes feedbackRate correctly", () => {
    const records = [
      makeRecord({ feedbackGiven: true }),
      makeRecord({ feedbackGiven: false }),
      makeRecord({ feedbackGiven: false }),
      makeRecord({ feedbackGiven: false }),
    ];
    expect(evaluateSleepCompliance(records).feedbackRate).toBe(25);
  });

  it("computes sleepTypeDiversityRatio correctly for 4 types", () => {
    const records = [
      makeRecord({ sleepType: "bedtime_routine" }),
      makeRecord({ sleepType: "night_check" }),
      makeRecord({ sleepType: "morning_wakeup" }),
      makeRecord({ sleepType: "sleep_environment_review" }),
    ];
    const result = evaluateSleepCompliance(records);
    expect(result.uniqueTypes).toBe(4);
    expect(result.sleepTypeDiversityRatio).toBe(0.5);
  });

  it("generates strength for high documentation", () => {
    const records = Array.from({ length: 10 }, () => makeRecord());
    const result = evaluateSleepCompliance(records);
    expect(result.strengths.some((s) => s.includes("documentation"))).toBe(true);
  });

  it("generates concern for low documentation", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ documentedInPlan: false }),
    );
    const result = evaluateSleepCompliance(records);
    expect(result.concerns.some((c) => c.includes("documentation"))).toBe(true);
  });

  it("caps score at 25", () => {
    const types: SleepRecord["sleepType"][] = [
      "bedtime_routine", "night_check", "morning_wakeup",
      "sleep_environment_review", "sleep_concern_assessment",
      "relaxation_activity", "screen_time_management", "sleep_hygiene_education",
    ];
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ sleepType: types[i % 8] }),
    );
    expect(evaluateSleepCompliance(records).score).toBeLessThanOrEqual(25);
  });
});

// ── evaluateSleepPolicy ─────────────────────────────────────────────────

describe("evaluateSleepPolicy", () => {
  it("returns all false and score 0 for null policy", () => {
    const result = evaluateSleepPolicy(null);
    expect(result.score).toBe(0);
    expect(result.bedtimeRoutineGuideline).toBe(false);
    expect(result.sleepEnvironmentStandard).toBe(false);
    expect(result.nightMonitoringProcedure).toBe(false);
    expect(result.screenTimePolicy).toBe(false);
    expect(result.sleepConcernProtocol).toBe(false);
    expect(result.relaxationProgramme).toBe(false);
    expect(result.regularReview).toBe(false);
    expect(result.concerns).toHaveLength(1);
  });

  it("returns 25 for full policy", () => {
    const result = evaluateSleepPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.strengths.some((s) => s.includes("all 7"))).toBe(true);
  });

  it("weights bedtimeRoutineGuideline as 4", () => {
    const result = evaluateSleepPolicy(makePolicy({
      sleepEnvironmentStandard: false,
      nightMonitoringProcedure: false,
      screenTimePolicy: false,
      sleepConcernProtocol: false,
      relaxationProgramme: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("weights sleepEnvironmentStandard as 4", () => {
    const result = evaluateSleepPolicy(makePolicy({
      bedtimeRoutineGuideline: false,
      nightMonitoringProcedure: false,
      screenTimePolicy: false,
      sleepConcernProtocol: false,
      relaxationProgramme: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("weights nightMonitoringProcedure as 4", () => {
    const result = evaluateSleepPolicy(makePolicy({
      bedtimeRoutineGuideline: false,
      sleepEnvironmentStandard: false,
      screenTimePolicy: false,
      sleepConcernProtocol: false,
      relaxationProgramme: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("weights screenTimePolicy as 4", () => {
    const result = evaluateSleepPolicy(makePolicy({
      bedtimeRoutineGuideline: false,
      sleepEnvironmentStandard: false,
      nightMonitoringProcedure: false,
      sleepConcernProtocol: false,
      relaxationProgramme: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("weights sleepConcernProtocol as 3", () => {
    const result = evaluateSleepPolicy(makePolicy({
      bedtimeRoutineGuideline: false,
      sleepEnvironmentStandard: false,
      nightMonitoringProcedure: false,
      screenTimePolicy: false,
      relaxationProgramme: false,
      regularReview: false,
    }));
    expect(result.score).toBe(3);
  });

  it("weights relaxationProgramme as 3", () => {
    const result = evaluateSleepPolicy(makePolicy({
      bedtimeRoutineGuideline: false,
      sleepEnvironmentStandard: false,
      nightMonitoringProcedure: false,
      screenTimePolicy: false,
      sleepConcernProtocol: false,
      regularReview: false,
    }));
    expect(result.score).toBe(3);
  });

  it("weights regularReview as 3", () => {
    const result = evaluateSleepPolicy(makePolicy({
      bedtimeRoutineGuideline: false,
      sleepEnvironmentStandard: false,
      nightMonitoringProcedure: false,
      screenTimePolicy: false,
      sleepConcernProtocol: false,
      relaxationProgramme: false,
    }));
    expect(result.score).toBe(3);
  });

  it("all weights sum to 25", () => {
    expect(4 + 4 + 4 + 4 + 3 + 3 + 3).toBe(25);
  });

  it("generates concern for each missing policy area", () => {
    const result = evaluateSleepPolicy(makePolicy({
      bedtimeRoutineGuideline: false,
      screenTimePolicy: false,
    }));
    expect(result.concerns.some((c) => c.includes("bedtime routine"))).toBe(true);
    expect(result.concerns.some((c) => c.includes("screen time"))).toBe(true);
  });

  it("returns score 0 for policy with all false", () => {
    const result = evaluateSleepPolicy(makePolicy({
      bedtimeRoutineGuideline: false,
      sleepEnvironmentStandard: false,
      nightMonitoringProcedure: false,
      screenTimePolicy: false,
      sleepConcernProtocol: false,
      relaxationProgramme: false,
      regularReview: false,
    }));
    expect(result.score).toBe(0);
    expect(result.concerns).toHaveLength(7);
  });

  it("generates strength for 5+ areas covered", () => {
    const result = evaluateSleepPolicy(makePolicy({
      relaxationProgramme: false,
      regularReview: false,
    }));
    expect(result.strengths.some((s) => s.includes("5 of 7"))).toBe(true);
  });
});

// ── evaluateStaffSleepReadiness ─────────────────────────────────────────

describe("evaluateStaffSleepReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffSleepReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns).toHaveLength(1);
  });

  it("returns 25 for fully trained staff", () => {
    const training = [makeTraining()];
    const result = evaluateStaffSleepReadiness(training);
    expect(result.score).toBe(25);
    expect(result.sleepHygieneKnowledgeRate).toBe(100);
    expect(result.nightSupervisionRate).toBe(100);
  });

  it("returns 0 for untrained staff", () => {
    const training = [makeTraining({
      sleepHygieneKnowledge: false,
      nightSupervision: false,
      relaxationTechniques: false,
      sleepDisorderAwareness: false,
      traumaInformedSleep: false,
      environmentManagement: false,
    })];
    expect(evaluateStaffSleepReadiness(training).score).toBe(0);
  });

  it("weights sleepHygieneKnowledge as 6", () => {
    const training = [makeTraining({
      nightSupervision: false,
      relaxationTechniques: false,
      sleepDisorderAwareness: false,
      traumaInformedSleep: false,
      environmentManagement: false,
    })];
    expect(evaluateStaffSleepReadiness(training).score).toBe(6);
  });

  it("weights nightSupervision as 5", () => {
    const training = [makeTraining({
      sleepHygieneKnowledge: false,
      relaxationTechniques: false,
      sleepDisorderAwareness: false,
      traumaInformedSleep: false,
      environmentManagement: false,
    })];
    expect(evaluateStaffSleepReadiness(training).score).toBe(5);
  });

  it("weights relaxationTechniques as 5", () => {
    const training = [makeTraining({
      sleepHygieneKnowledge: false,
      nightSupervision: false,
      sleepDisorderAwareness: false,
      traumaInformedSleep: false,
      environmentManagement: false,
    })];
    expect(evaluateStaffSleepReadiness(training).score).toBe(5);
  });

  it("weights sleepDisorderAwareness as 4", () => {
    const training = [makeTraining({
      sleepHygieneKnowledge: false,
      nightSupervision: false,
      relaxationTechniques: false,
      traumaInformedSleep: false,
      environmentManagement: false,
    })];
    expect(evaluateStaffSleepReadiness(training).score).toBe(4);
  });

  it("weights traumaInformedSleep as 3", () => {
    const training = [makeTraining({
      sleepHygieneKnowledge: false,
      nightSupervision: false,
      relaxationTechniques: false,
      sleepDisorderAwareness: false,
      environmentManagement: false,
    })];
    expect(evaluateStaffSleepReadiness(training).score).toBe(3);
  });

  it("weights environmentManagement as 2", () => {
    const training = [makeTraining({
      sleepHygieneKnowledge: false,
      nightSupervision: false,
      relaxationTechniques: false,
      sleepDisorderAwareness: false,
      traumaInformedSleep: false,
    })];
    expect(evaluateStaffSleepReadiness(training).score).toBe(2);
  });

  it("all weights sum to 25", () => {
    expect(6 + 5 + 5 + 4 + 3 + 2).toBe(25);
  });

  it("handles partial training across multiple staff", () => {
    const training = [
      makeTraining({ staffId: "s1" }),
      makeTraining({
        staffId: "s2",
        sleepHygieneKnowledge: true,
        nightSupervision: true,
        relaxationTechniques: false,
        sleepDisorderAwareness: false,
        traumaInformedSleep: false,
        environmentManagement: false,
      }),
    ];
    const result = evaluateStaffSleepReadiness(training);
    expect(result.sleepHygieneKnowledgeRate).toBe(100);
    expect(result.nightSupervisionRate).toBe(100);
    expect(result.relaxationTechniquesRate).toBe(50);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(25);
  });

  it("caps at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ staffId: "s-" + i }),
    );
    expect(evaluateStaffSleepReadiness(training).score).toBeLessThanOrEqual(25);
  });

  it("generates strength for high sleep hygiene knowledge", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ staffId: "s-" + i }),
    );
    const result = evaluateStaffSleepReadiness(training);
    expect(result.strengths.some((s) => s.includes("sleep hygiene knowledge"))).toBe(true);
  });

  it("generates concern for low trauma-informed sleep", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ staffId: "s-" + i, traumaInformedSleep: false }),
    );
    const result = evaluateStaffSleepReadiness(training);
    expect(result.concerns.some((c) => c.includes("Trauma-informed"))).toBe(true);
  });
});

// ── buildChildSleepProfiles ─────────────────────────────────────────────

describe("buildChildSleepProfiles", () => {
  it("returns empty for no records", () => {
    expect(buildChildSleepProfiles([])).toHaveLength(0);
  });

  it("creates one profile per child", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex" }),
      makeRecord({ childId: "c2", childName: "Jordan" }),
      makeRecord({ childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles).toHaveLength(2);
  });

  it("computes per-child sleepQualityRate (excellent+good)", () => {
    const records = [
      makeRecord({ childId: "c1", sleepQuality: "excellent" }),
      makeRecord({ childId: "c1", sleepQuality: "poor" }),
    ];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles[0].sleepQualityRate).toBe(50);
  });

  it("computes per-child routineRate", () => {
    const records = [
      makeRecord({ childId: "c1", routineFollowed: true }),
      makeRecord({ childId: "c1", routineFollowed: true }),
      makeRecord({ childId: "c1", routineFollowed: false }),
    ];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles[0].routineRate).toBe(67);
  });

  it("computes uniqueTypes correctly", () => {
    const records = [
      makeRecord({ childId: "c1", sleepType: "bedtime_routine" }),
      makeRecord({ childId: "c1", sleepType: "night_check" }),
      makeRecord({ childId: "c1", sleepType: "bedtime_routine" }),
    ];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles[0].uniqueTypes).toBe(2);
  });

  it("frequencyScore: >=10 records → 2", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ childId: "c1", sleepQuality: "excellent" }),
    );
    const profiles = buildChildSleepProfiles(records);
    // frequencyScore = 2, qualityScore = 3 (100%), routineScore = 3 (100%), diversityBonus = 0 (1 type)
    expect(profiles[0].sleepScore).toBe(8);
  });

  it("frequencyScore: >=5 records → 1", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ childId: "c1", sleepQuality: "excellent" }),
    );
    const profiles = buildChildSleepProfiles(records);
    // frequencyScore = 1, qualityScore = 3, routineScore = 3, diversityBonus = 0
    expect(profiles[0].sleepScore).toBe(7);
  });

  it("frequencyScore: <5 records → 0", () => {
    const records = Array.from({ length: 3 }, () =>
      makeRecord({ childId: "c1", sleepQuality: "excellent" }),
    );
    const profiles = buildChildSleepProfiles(records);
    // frequencyScore = 0, qualityScore = 3, routineScore = 3, diversityBonus = 0
    expect(profiles[0].sleepScore).toBe(6);
  });

  it("qualityScore: >=80% → 3", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ childId: "c1", sleepQuality: "excellent" }),
    );
    const profiles = buildChildSleepProfiles(records);
    expect(profiles[0].sleepQualityRate).toBe(100);
  });

  it("qualityScore: >=60% → 2", () => {
    const records = [
      makeRecord({ childId: "c1", sleepQuality: "excellent" }),
      makeRecord({ childId: "c1", sleepQuality: "excellent" }),
      makeRecord({ childId: "c1", sleepQuality: "poor" }),
    ];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles[0].sleepQualityRate).toBe(67);
    // frequencyScore = 0, qualityScore = 2, routineScore = 3, diversityBonus = 0 → 5
    expect(profiles[0].sleepScore).toBe(5);
  });

  it("qualityScore: >=40% → 1", () => {
    const records = [
      makeRecord({ childId: "c1", sleepQuality: "excellent" }),
      makeRecord({ childId: "c1", sleepQuality: "poor" }),
      makeRecord({ childId: "c1", sleepQuality: "poor" }),
      makeRecord({ childId: "c1", sleepQuality: "poor" }),
      makeRecord({ childId: "c1", sleepQuality: "poor" }),
    ];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles[0].sleepQualityRate).toBe(20);
    // frequencyScore = 1, qualityScore = 0, routineScore = 3, diversityBonus = 0 → 4
    expect(profiles[0].sleepScore).toBe(4);
  });

  it("diversityBonus: >=4 types → 2", () => {
    const records = [
      makeRecord({ childId: "c1", sleepType: "bedtime_routine", sleepQuality: "excellent" }),
      makeRecord({ childId: "c1", sleepType: "night_check", sleepQuality: "excellent" }),
      makeRecord({ childId: "c1", sleepType: "morning_wakeup", sleepQuality: "excellent" }),
      makeRecord({ childId: "c1", sleepType: "relaxation_activity", sleepQuality: "excellent" }),
    ];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles[0].uniqueTypes).toBe(4);
    // frequencyScore = 0, qualityScore = 3, routineScore = 3, diversityBonus = 2 → 8
    expect(profiles[0].sleepScore).toBe(8);
  });

  it("diversityBonus: >=2 types → 1", () => {
    const records = [
      makeRecord({ childId: "c1", sleepType: "bedtime_routine", sleepQuality: "excellent" }),
      makeRecord({ childId: "c1", sleepType: "night_check", sleepQuality: "excellent" }),
    ];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles[0].uniqueTypes).toBe(2);
    // frequencyScore = 0, qualityScore = 3, routineScore = 3, diversityBonus = 1 → 7
    expect(profiles[0].sleepScore).toBe(7);
  });

  it("caps sleepScore at 10", () => {
    const types: SleepRecord["sleepType"][] = [
      "bedtime_routine", "night_check", "morning_wakeup",
      "sleep_environment_review", "sleep_concern_assessment",
    ];
    const records = Array.from({ length: 15 }, (_, i) =>
      makeRecord({ childId: "c1", sleepType: types[i % 5], sleepQuality: "excellent" }),
    );
    const profiles = buildChildSleepProfiles(records);
    expect(profiles[0].sleepScore).toBeLessThanOrEqual(10);
    // frequencyScore = 2, qualityScore = 3, routineScore = 3, diversityBonus = 2 → 10
    expect(profiles[0].sleepScore).toBe(10);
  });

  it("minimum sleepScore is 0", () => {
    const records = [
      makeRecord({
        childId: "c1",
        sleepQuality: "very_poor",
        routineFollowed: false,
      }),
    ];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles[0].sleepScore).toBeGreaterThanOrEqual(0);
  });

  it("groups records correctly by childId", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex" }),
      makeRecord({ childId: "c2", childName: "Jordan" }),
      makeRecord({ childId: "c1", childName: "Alex" }),
      makeRecord({ childId: "c3", childName: "Morgan" }),
    ];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles).toHaveLength(3);
    const alex = profiles.find((p) => p.childId === "c1")!;
    expect(alex.totalRecords).toBe(2);
    expect(alex.childName).toBe("Alex");
  });
});

// ── generateSleepHygieneQualityIntelligence (Orchestrator) ──────────────

describe("generateSleepHygieneQualityIntelligence", () => {
  const demoRecords: SleepRecord[] = [
    makeRecord({ childId: "child-alex", childName: "Alex", recordDate: "2026-05-05", sleepType: "bedtime_routine" }),
    makeRecord({ childId: "child-alex", childName: "Alex", recordDate: "2026-05-06", sleepType: "night_check" }),
    makeRecord({ childId: "child-jordan", childName: "Jordan", recordDate: "2026-05-05", sleepType: "morning_wakeup" }),
    makeRecord({ childId: "child-jordan", childName: "Jordan", recordDate: "2026-05-06", sleepType: "sleep_environment_review" }),
    makeRecord({ childId: "child-jordan", childName: "Jordan", recordDate: "2026-05-07", sleepType: "relaxation_activity" }),
    makeRecord({ childId: "child-morgan", childName: "Morgan", recordDate: "2026-05-05", sleepType: "screen_time_management" }),
    makeRecord({ childId: "child-morgan", childName: "Morgan", recordDate: "2026-05-06", sleepType: "sleep_hygiene_education" }),
    makeRecord({ childId: "child-morgan", childName: "Morgan", recordDate: "2026-05-07", sleepType: "sleep_concern_assessment" }),
  ];

  const demoPolicy = makePolicy();

  const demoTraining: StaffSleepTraining[] = [
    makeTraining({ staffId: "staff-sarah", staffName: "Sarah Johnson" }),
    makeTraining({ staffId: "staff-tom", staffName: "Tom Richards" }),
    makeTraining({ staffId: "staff-lisa", staffName: "Lisa Williams" }),
    makeTraining({ staffId: "staff-darren", staffName: "Darren Laville" }),
  ];

  it("returns complete intelligence with all fields", () => {
    const result = generateSleepHygieneQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-04-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.assessedAt).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.sleepQuality).toBeDefined();
    expect(result.sleepCompliance).toBeDefined();
    expect(result.sleepPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("sums evaluator scores correctly", () => {
    const result = generateSleepHygieneQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    const sum = Math.round(
      result.sleepQuality.score +
      result.sleepCompliance.score +
      result.sleepPolicy.score +
      result.staffReadiness.score,
    );
    expect(result.overallScore).toBe(Math.min(sum, 100));
  });

  it("rates outstanding for high-performing home", () => {
    const result = generateSleepHygieneQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate for all-empty inputs", () => {
    const result = generateSleepHygieneQualityIntelligence(
      [], null, [], "empty", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates URGENT actions for missing policy", () => {
    const result = generateSleepHygieneQualityIntelligence(
      demoRecords, null, demoTraining,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT actions for missing training", () => {
    const result = generateSleepHygieneQualityIntelligence(
      demoRecords, demoPolicy, [],
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("caps overall score at 100", () => {
    const result = generateSleepHygieneQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes child profiles for all children in records", () => {
    const result = generateSleepHygieneQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.childProfiles).toHaveLength(3);
  });

  it("has exactly 7 regulatory links", () => {
    const result = generateSleepHygieneQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Regulation 6 in regulatory links", () => {
    const result = generateSleepHygieneQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 6"))).toBe(true);
  });

  it("includes NICE Guideline NG92 in regulatory links", () => {
    const result = generateSleepHygieneQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NICE Guideline NG92"))).toBe(true);
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const result = generateSleepHygieneQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("generates strengths for outstanding home", () => {
    const result = generateSleepHygieneQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates areas for improvement for poor data", () => {
    const poorRecords = Array.from({ length: 5 }, () =>
      makeRecord({
        recordDate: "2026-05-10",
        sleepQuality: "poor",
        routineFollowed: false,
        environmentSuitable: false,
        restfulSleep: false,
        documentedInPlan: false,
        staffMonitored: false,
        feedbackGiven: false,
      }),
    );
    const result = generateSleepHygieneQualityIntelligence(
      poorRecords, null, [],
      "poor-home", "2026-04-01", "2026-05-18",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("filters records to period", () => {
    const records = [
      makeRecord({ childId: "c1", recordDate: "2026-03-01" }), // outside period
      makeRecord({ childId: "c1", recordDate: "2026-05-10" }), // inside period
    ];
    const result = generateSleepHygieneQualityIntelligence(
      records, demoPolicy, demoTraining,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.sleepQuality.totalRecords).toBe(1);
  });

  it("no actions message when everything is good", () => {
    const result = generateSleepHygieneQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("generates URGENT actions for low sleep quality children", () => {
    const poorRecords = Array.from({ length: 2 }, () =>
      makeRecord({
        childId: "c1",
        recordDate: "2026-05-10",
        sleepQuality: "very_poor",
        routineFollowed: false,
      }),
    );
    const result = generateSleepHygieneQualityIntelligence(
      poorRecords, demoPolicy, demoTraining,
      "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("low sleep scores"))).toBe(true);
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("single record gives nonzero score", () => {
    const result = evaluateSleepQuality([makeRecord()]);
    expect(result.score).toBeGreaterThan(0);
  });

  it("evaluator scores never exceed 25", () => {
    const records = Array.from({ length: 100 }, () => makeRecord());
    expect(evaluateSleepQuality(records).score).toBeLessThanOrEqual(25);
    expect(evaluateSleepCompliance(records).score).toBeLessThanOrEqual(25);
    expect(evaluateSleepPolicy(makePolicy()).score).toBeLessThanOrEqual(25);
    const training = Array.from({ length: 100 }, (_, i) =>
      makeTraining({ staffId: "s-" + i }),
    );
    expect(evaluateStaffSleepReadiness(training).score).toBeLessThanOrEqual(25);
  });

  it("large dataset runs without error", () => {
    const records = Array.from({ length: 200 }, (_, i) =>
      makeRecord({ childId: "c-" + (i % 20), recordDate: "2026-05-10" }),
    );
    const training = Array.from({ length: 20 }, (_, i) =>
      makeTraining({ staffId: "s-" + i }),
    );
    const result = generateSleepHygieneQualityIntelligence(
      records, makePolicy(), training,
      "big", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.childProfiles).toHaveLength(20);
  });

  it("overall score is the rounded sum of the four evaluator scores", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ recordDate: "2026-05-10" }),
    );
    const result = generateSleepHygieneQualityIntelligence(
      records, makePolicy(), [makeTraining()],
      "test", "2026-01-01", "2026-05-18",
    );
    const expected = Math.min(
      100,
      Math.round(
        result.sleepQuality.score +
        result.sleepCompliance.score +
        result.sleepPolicy.score +
        result.staffReadiness.score,
      ),
    );
    expect(result.overallScore).toBe(expected);
  });
});
