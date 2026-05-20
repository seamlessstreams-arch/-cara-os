// ══════════════════════════════════════════════════════════════════════════════
// Daily Log Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  ALL_CATEGORIES,
  pct,
  getRating,
  getDailyLogCategoryLabel,
  getDailyLogOutcomeLabel,
  getRatingLabel,
  evaluateDailyLogQuality,
  evaluateDailyLogCompliance,
  evaluateDailyLogPolicy,
  evaluateStaffDailyLogReadiness,
  buildChildDailyLogProfiles,
  generateDailyLogIntelligence,
} from "../daily-log-engine";
import type {
  DailyLogRecord,
  DailyLogPolicy,
  StaffDailyLogTraining,
  DailyLogCategory,
} from "../daily-log-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeRecord(overrides: Partial<DailyLogRecord> = {}): DailyLogRecord {
  return {
    id: "rec-001",
    childId: "child-alex",
    childName: "Alex",
    logDate: "2026-03-15",
    category: "morning_routine",
    detailedObservation: true,
    childMoodRecorded: true,
    keyworkerInformed: true,
    actionFollowedUp: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<DailyLogPolicy> = {}): DailyLogPolicy {
  return {
    id: "pol-001",
    dailyRecordingPolicy: true,
    observationFramework: true,
    handoverProtocol: true,
    significantEventsProcedure: true,
    childParticipationGuidance: true,
    qualityAssuranceProcess: true,
    reviewSchedule: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffDailyLogTraining> = {}): StaffDailyLogTraining {
  return {
    id: "tr-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    observationSkills: true,
    recordKeeping: true,
    childCommunication: true,
    safeguardingAwareness: true,
    handoverPractice: true,
    reflectiveWriting: true,
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
// getRating
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
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("label helpers", () => {
  it("getDailyLogCategoryLabel returns labels for all categories", () => {
    expect(getDailyLogCategoryLabel("morning_routine")).toBe("Morning Routine");
    expect(getDailyLogCategoryLabel("education_update")).toBe("Education Update");
    expect(getDailyLogCategoryLabel("health_observation")).toBe("Health Observation");
    expect(getDailyLogCategoryLabel("social_interaction")).toBe("Social Interaction");
    expect(getDailyLogCategoryLabel("emotional_wellbeing")).toBe("Emotional Wellbeing");
    expect(getDailyLogCategoryLabel("evening_routine")).toBe("Evening Routine");
    expect(getDailyLogCategoryLabel("night_observation")).toBe("Night Observation");
    expect(getDailyLogCategoryLabel("significant_event")).toBe("Significant Event");
  });

  it("getDailyLogOutcomeLabel returns labels for all outcomes", () => {
    expect(getDailyLogOutcomeLabel("completed")).toBe("Completed");
    expect(getDailyLogOutcomeLabel("partially_completed")).toBe("Partially Completed");
    expect(getDailyLogOutcomeLabel("not_completed")).toBe("Not Completed");
    expect(getDailyLogOutcomeLabel("deferred")).toBe("Deferred");
    expect(getDailyLogOutcomeLabel("emergency_override")).toBe("Emergency Override");
  });

  it("getRatingLabel returns labels for all ratings", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });

  it("ALL_CATEGORIES contains exactly 8 values", () => {
    expect(ALL_CATEGORIES).toHaveLength(8);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: evaluateDailyLogQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDailyLogQuality", () => {
  it("returns zeros and inadequate for empty records", () => {
    const result = evaluateDailyLogQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.detailedObservationRate).toBe(0);
    expect(result.childMoodRate).toBe(0);
    expect(result.keyworkerInformedRate).toBe(0);
    expect(result.actionFollowedUpRate).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns).toHaveLength(1);
  });

  it("scores 25 for all perfect records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-002" })];
    const result = evaluateDailyLogQuality(records);
    expect(result.detailedObservationRate).toBe(100);
    expect(result.childMoodRate).toBe(100);
    expect(result.keyworkerInformedRate).toBe(100);
    expect(result.actionFollowedUpRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates detailedObservationRate correctly", () => {
    const records = [
      makeRecord({ detailedObservation: true }),
      makeRecord({ id: "rec-002", detailedObservation: false }),
      makeRecord({ id: "rec-003", detailedObservation: true }),
      makeRecord({ id: "rec-004", detailedObservation: false }),
    ];
    const result = evaluateDailyLogQuality(records);
    expect(result.detailedObservationRate).toBe(50);
  });

  it("calculates childMoodRate correctly", () => {
    const records = [
      makeRecord({ childMoodRecorded: true }),
      makeRecord({ id: "rec-002", childMoodRecorded: false }),
      makeRecord({ id: "rec-003", childMoodRecorded: true }),
    ];
    const result = evaluateDailyLogQuality(records);
    expect(result.childMoodRate).toBe(67);
  });

  it("calculates keyworkerInformedRate correctly", () => {
    const records = [
      makeRecord({ keyworkerInformed: true }),
      makeRecord({ id: "rec-002", keyworkerInformed: false }),
    ];
    const result = evaluateDailyLogQuality(records);
    expect(result.keyworkerInformedRate).toBe(50);
  });

  it("calculates actionFollowedUpRate correctly", () => {
    const records = [
      makeRecord({ actionFollowedUp: false }),
      makeRecord({ id: "rec-002", actionFollowedUp: false }),
      makeRecord({ id: "rec-003", actionFollowedUp: true }),
    ];
    const result = evaluateDailyLogQuality(records);
    expect(result.actionFollowedUpRate).toBe(33);
  });

  it("generates strengths for high rates", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `rec-${i}` }));
    const result = evaluateDailyLogQuality(records);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("observation"))).toBe(true);
  });

  it("generates concerns for low rates", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        detailedObservation: false,
        childMoodRecorded: false,
        keyworkerInformed: false,
        actionFollowedUp: false,
      }),
    );
    const result = evaluateDailyLogQuality(records);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.score).toBe(0);
  });

  it("applies correct weights to score", () => {
    // Only detailedObservation true, rest false -> score = 7 (weight 7)
    const records = [
      makeRecord({
        detailedObservation: true,
        childMoodRecorded: false,
        keyworkerInformed: false,
        actionFollowedUp: false,
      }),
    ];
    const result = evaluateDailyLogQuality(records);
    expect(result.score).toBe(7);
  });

  it("score is capped at 25", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `rec-${i}` }));
    const result = evaluateDailyLogQuality(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: evaluateDailyLogCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDailyLogCompliance", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateDailyLogCompliance([]);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.keyworkerInformedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
    expect(result.score).toBe(0);
  });

  it("scores 25 for perfect compliance with all categories", () => {
    const records = ALL_CATEGORIES.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateDailyLogCompliance(records);
    expect(result.documentationRate).toBe(100);
    expect(result.timelyRecordingRate).toBe(100);
    expect(result.categoryDiversityRatio).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates documentationRate correctly", () => {
    const records = [
      makeRecord({ documentationComplete: true }),
      makeRecord({ id: "rec-002", documentationComplete: false }),
    ];
    const result = evaluateDailyLogCompliance(records);
    expect(result.documentationRate).toBe(50);
  });

  it("calculates timelyRecordingRate correctly", () => {
    const records = [
      makeRecord({ timelyRecording: true }),
      makeRecord({ id: "rec-002", timelyRecording: true }),
      makeRecord({ id: "rec-003", timelyRecording: false }),
    ];
    const result = evaluateDailyLogCompliance(records);
    expect(result.timelyRecordingRate).toBe(67);
  });

  it("calculates categoryDiversityRatio as pct of unique categories", () => {
    const records = [
      makeRecord({ category: "morning_routine" }),
      makeRecord({ id: "rec-002", category: "morning_routine" }),
      makeRecord({ id: "rec-003", category: "education_update" }),
      makeRecord({ id: "rec-004", category: "health_observation" }),
      makeRecord({ id: "rec-005", category: "social_interaction" }),
    ];
    const result = evaluateDailyLogCompliance(records);
    expect(result.uniqueCategories).toBe(4);
    expect(result.categoryDiversityRatio).toBe(50); // 4/8 = 50%
  });

  it("generates strengths for excellent documentation", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `rec-${i}` }));
    const result = evaluateDailyLogCompliance(records);
    expect(result.strengths.some((s) => s.includes("documentation") || s.includes("Documentation"))).toBe(true);
  });

  it("generates concerns for low documentation", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, documentationComplete: false }),
    );
    const result = evaluateDailyLogCompliance(records);
    expect(result.concerns.some((c) => c.includes("Documentation") || c.includes("documentation"))).toBe(true);
  });

  it("generates strength for high category coverage", () => {
    const records = ALL_CATEGORIES.slice(0, 6).map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateDailyLogCompliance(records);
    expect(result.strengths.some((s) => s.includes("category") || s.includes("Category"))).toBe(true);
  });

  it("generates concern for very low category coverage", () => {
    const records = [
      makeRecord({ category: "morning_routine" }),
    ];
    const result = evaluateDailyLogCompliance(records);
    expect(result.concerns.some((c) => c.includes("category"))).toBe(true);
  });

  it("applies correct weights to score", () => {
    // Only documentationComplete true, rest false, single category
    const records = [
      makeRecord({
        documentationComplete: true,
        timelyRecording: false,
        keyworkerInformed: false,
      }),
    ];
    const result = evaluateDailyLogCompliance(records);
    // doc=8, timely=0, keyworker=0, diversity = pct(1,8)=13 -> 13/100*5 = 0.65 -> rounded
    // score = 8 + 0 + 0 + 0.625 = 8.625 -> rounded to 8.6
    expect(result.score).toBeGreaterThan(8);
    expect(result.score).toBeLessThan(10);
  });

  it("score is capped at 25", () => {
    const records = ALL_CATEGORIES.map((cat, i) => makeRecord({ id: `rec-${i}`, category: cat }));
    const result = evaluateDailyLogCompliance(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: evaluateDailyLogPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDailyLogPolicy", () => {
  it("returns all false and score 0 for null policy", () => {
    const result = evaluateDailyLogPolicy(null);
    expect(result.dailyRecordingPolicy).toBe(false);
    expect(result.observationFramework).toBe(false);
    expect(result.handoverProtocol).toBe(false);
    expect(result.significantEventsProcedure).toBe(false);
    expect(result.childParticipationGuidance).toBe(false);
    expect(result.qualityAssuranceProcess).toBe(false);
    expect(result.reviewSchedule).toBe(false);
    expect(result.score).toBe(0);
    expect(result.concerns).toHaveLength(1);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("scores 25 for full policy", () => {
    const result = evaluateDailyLogPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.strengths.some((s) => s.includes("7/7"))).toBe(true);
  });

  it("scores correctly with partial policy (first 4 true = 16)", () => {
    const result = evaluateDailyLogPolicy(
      makePolicy({
        childParticipationGuidance: false,
        qualityAssuranceProcess: false,
        reviewSchedule: false,
      }),
    );
    expect(result.score).toBe(16); // 4+4+4+4 = 16
  });

  it("scores correctly with last 3 true only (= 9)", () => {
    const result = evaluateDailyLogPolicy(
      makePolicy({
        dailyRecordingPolicy: false,
        observationFramework: false,
        handoverProtocol: false,
        significantEventsProcedure: false,
      }),
    );
    expect(result.score).toBe(9); // 3+3+3 = 9
  });

  it("generates concern for each missing policy component", () => {
    const result = evaluateDailyLogPolicy(
      makePolicy({
        dailyRecordingPolicy: false,
        observationFramework: false,
        handoverProtocol: false,
        significantEventsProcedure: false,
        childParticipationGuidance: false,
        qualityAssuranceProcess: false,
        reviewSchedule: false,
      }),
    );
    expect(result.concerns).toHaveLength(7);
    expect(result.score).toBe(0);
  });

  it("generates strength for 5 components in place", () => {
    const result = evaluateDailyLogPolicy(
      makePolicy({
        qualityAssuranceProcess: false,
        reviewSchedule: false,
      }),
    );
    expect(result.strengths.some((s) => s.includes("5/7"))).toBe(true);
  });

  it("generates specific concern for missing handover protocol", () => {
    const result = evaluateDailyLogPolicy(makePolicy({ handoverProtocol: false }));
    expect(result.concerns.some((c) => c.includes("handover"))).toBe(true);
  });

  it("generates specific concern for missing significant events procedure", () => {
    const result = evaluateDailyLogPolicy(makePolicy({ significantEventsProcedure: false }));
    expect(result.concerns.some((c) => c.includes("significant"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: evaluateStaffDailyLogReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffDailyLogReadiness", () => {
  it("returns zeros for empty staff", () => {
    const result = evaluateStaffDailyLogReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.observationSkillsRate).toBe(0);
    expect(result.recordKeepingRate).toBe(0);
    expect(result.childCommunicationRate).toBe(0);
    expect(result.safeguardingAwarenessRate).toBe(0);
    expect(result.handoverPracticeRate).toBe(0);
    expect(result.reflectiveWritingRate).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns).toHaveLength(1);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("scores 25 for all perfect staff", () => {
    const staff = [makeTraining(), makeTraining({ id: "tr-002", staffId: "staff-tom", staffName: "Tom" })];
    const result = evaluateStaffDailyLogReadiness(staff);
    expect(result.observationSkillsRate).toBe(100);
    expect(result.recordKeepingRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates observationSkillsRate correctly", () => {
    const staff = [
      makeTraining({ observationSkills: true }),
      makeTraining({ id: "tr-002", staffId: "staff-tom", staffName: "Tom", observationSkills: false }),
    ];
    const result = evaluateStaffDailyLogReadiness(staff);
    expect(result.observationSkillsRate).toBe(50);
  });

  it("calculates recordKeepingRate correctly", () => {
    const staff = [
      makeTraining({ recordKeeping: true }),
      makeTraining({ id: "tr-002", staffId: "staff-tom", staffName: "Tom", recordKeeping: false }),
      makeTraining({ id: "tr-003", staffId: "staff-lisa", staffName: "Lisa", recordKeeping: true }),
    ];
    const result = evaluateStaffDailyLogReadiness(staff);
    expect(result.recordKeepingRate).toBe(67);
  });

  it("calculates childCommunicationRate correctly", () => {
    const staff = [
      makeTraining({ childCommunication: false }),
      makeTraining({ id: "tr-002", staffId: "staff-tom", staffName: "Tom", childCommunication: false }),
    ];
    const result = evaluateStaffDailyLogReadiness(staff);
    expect(result.childCommunicationRate).toBe(0);
  });

  it("applies correct weights (6+5+5+4+3+2 = 25)", () => {
    // Only observationSkills true, rest false -> score = 6
    const staff = [
      makeTraining({
        observationSkills: true,
        recordKeeping: false,
        childCommunication: false,
        safeguardingAwareness: false,
        handoverPractice: false,
        reflectiveWriting: false,
      }),
    ];
    const result = evaluateStaffDailyLogReadiness(staff);
    expect(result.score).toBe(6);
  });

  it("generates strengths for high rates", () => {
    const staff = Array.from({ length: 5 }, (_, i) =>
      makeTraining({ id: `tr-${i}`, staffId: `staff-${i}`, staffName: `Staff ${i}` }),
    );
    const result = evaluateStaffDailyLogReadiness(staff);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates concerns for low rates", () => {
    const staff = Array.from({ length: 5 }, (_, i) =>
      makeTraining({
        id: `tr-${i}`,
        staffId: `staff-${i}`,
        staffName: `Staff ${i}`,
        observationSkills: false,
        recordKeeping: false,
        childCommunication: false,
        safeguardingAwareness: false,
        handoverPractice: false,
        reflectiveWriting: false,
      }),
    );
    const result = evaluateStaffDailyLogReadiness(staff);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.score).toBe(0);
  });

  it("score is capped at 25", () => {
    const staff = [makeTraining()];
    const result = evaluateStaffDailyLogReadiness(staff);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildDailyLogProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildDailyLogProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildDailyLogProfiles([])).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "rec-002", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "rec-003", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildDailyLogProfiles(records);
    expect(profiles).toHaveLength(2);
  });

  it("calculates totalRecords per child", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "rec-002", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "rec-003", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildDailyLogProfiles(records);
    expect(profiles[0].totalRecords).toBe(3);
  });

  it("calculates detailedObservationRate per child", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", detailedObservation: true }),
      makeRecord({ id: "rec-002", childId: "child-alex", childName: "Alex", detailedObservation: false }),
    ];
    const profiles = buildChildDailyLogProfiles(records);
    expect(profiles[0].detailedObservationRate).toBe(50);
  });

  it("calculates childMoodRate per child", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", childMoodRecorded: true }),
      makeRecord({ id: "rec-002", childId: "child-alex", childName: "Alex", childMoodRecorded: true }),
      makeRecord({ id: "rec-003", childId: "child-alex", childName: "Alex", childMoodRecorded: false }),
    ];
    const profiles = buildChildDailyLogProfiles(records);
    expect(profiles[0].childMoodRate).toBe(67);
  });

  it("counts unique categories per child", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", category: "morning_routine" }),
      makeRecord({ id: "rec-002", childId: "child-alex", childName: "Alex", category: "morning_routine" }),
      makeRecord({ id: "rec-003", childId: "child-alex", childName: "Alex", category: "education_update" }),
      makeRecord({ id: "rec-004", childId: "child-alex", childName: "Alex", category: "health_observation" }),
    ];
    const profiles = buildChildDailyLogProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(3);
  });

  it("frequency score: >=10 records -> 2 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildDailyLogProfiles(records);
    // freq=2, rate1=3 (100%), rate2=3 (100%), diversity=0 (1 category) = 8
    expect(profiles[0].dailyLogScore).toBe(8);
  });

  it("frequency score: >=5 records -> 1 point", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildDailyLogProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0 (1 category) = 7
    expect(profiles[0].dailyLogScore).toBe(7);
  });

  it("frequency score: <5 records -> 0 points", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildDailyLogProfiles(records);
    // freq=0, rate1=3, rate2=3, diversity=0 = 6
    expect(profiles[0].dailyLogScore).toBe(6);
  });

  it("rate1 score: detailedObservationRate >=80 -> 3", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-alex", childName: "Alex", detailedObservation: true }),
    );
    const profiles = buildChildDailyLogProfiles(records);
    expect(profiles[0].detailedObservationRate).toBe(100);
    // rate1=3
  });

  it("rate1 score: detailedObservationRate >=60 but <80 -> 2", () => {
    const records = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeRecord({ id: `rec-${i}`, childId: "child-alex", childName: "Alex", detailedObservation: true }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeRecord({ id: `rec-t-${i}`, childId: "child-alex", childName: "Alex", detailedObservation: false }),
      ),
    ];
    const profiles = buildChildDailyLogProfiles(records);
    expect(profiles[0].detailedObservationRate).toBe(70);
    // freq=2, rate1=2, rate2=3 (100%), diversity=0 = 7
    expect(profiles[0].dailyLogScore).toBe(7);
  });

  it("diversity bonus: >=4 categories -> 2 points", () => {
    const cats: DailyLogCategory[] = ["morning_routine", "education_update", "health_observation", "social_interaction"];
    const records = cats.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-alex", childName: "Alex", category: cat }),
    );
    const profiles = buildChildDailyLogProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(4);
    // freq=0, rate1=3, rate2=3, diversity=2 = 8
    expect(profiles[0].dailyLogScore).toBe(8);
  });

  it("diversity bonus: >=2 but <4 categories -> 1 point", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", category: "morning_routine" }),
      makeRecord({ id: "rec-002", childId: "child-alex", childName: "Alex", category: "education_update" }),
    ];
    const profiles = buildChildDailyLogProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(2);
    // freq=0, rate1=3, rate2=3, diversity=1 = 7
    expect(profiles[0].dailyLogScore).toBe(7);
  });

  it("score is capped at 10", () => {
    const cats: DailyLogCategory[] = ["morning_routine", "education_update", "health_observation", "social_interaction", "emotional_wellbeing"];
    const records = cats.flatMap((cat, i) =>
      Array.from({ length: 3 }, (_, j) =>
        makeRecord({ id: `rec-${i}-${j}`, childId: "child-alex", childName: "Alex", category: cat }),
      ),
    );
    const profiles = buildChildDailyLogProfiles(records);
    // freq=2 (15 records), rate1=3, rate2=3, diversity=2 = 10
    expect(profiles[0].dailyLogScore).toBeLessThanOrEqual(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateDailyLogIntelligence (orchestrator)
// ══════════════════════════════════════════════════════════════════════════════

describe("generateDailyLogIntelligence", () => {
  it("returns complete intelligence object", () => {
    const records = [makeRecord()];
    const policy = makePolicy();
    const staff = [makeTraining()];
    const result = generateDailyLogIntelligence(records, policy, staff, "oak-house", "2026-01-01", "2026-12-31");

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-12-31");
    expect(result.assessedAt).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.dailyLogQuality).toBeDefined();
    expect(result.dailyLogCompliance).toBeDefined();
    expect(result.dailyLogPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("filters records by period", () => {
    const records = [
      makeRecord({ logDate: "2026-03-15" }),
      makeRecord({ id: "rec-002", logDate: "2025-01-01" }), // outside period
    ];
    const result = generateDailyLogIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.dailyLogQuality.totalRecords).toBe(1);
  });

  it("sums 4 evaluator scores for overall", () => {
    const records = ALL_CATEGORIES.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const policy = makePolicy();
    const staff = [makeTraining()];
    const result = generateDailyLogIntelligence(records, policy, staff, "oak-house", "2026-01-01", "2026-12-31");
    const expectedSum = Math.round(
      result.dailyLogQuality.score +
      result.dailyLogCompliance.score +
      result.dailyLogPolicy.score +
      result.staffReadiness.score,
    );
    expect(result.overallScore).toBe(Math.min(100, expectedSum));
  });

  it("overall score is capped at 100", () => {
    const records = ALL_CATEGORIES.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = generateDailyLogIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rating matches score via getRating", () => {
    const records = [makeRecord()];
    const result = generateDailyLogIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.rating).toBe(getRating(result.overallScore));
  });

  it("generates outstanding rating for perfect inputs", () => {
    const records = ALL_CATEGORIES.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = generateDailyLogIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.rating).toBe("outstanding");
  });

  it("generates inadequate rating for null policy and empty everything", () => {
    const result = generateDailyLogIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });

  it("includes URGENT actions when policy is null", () => {
    const result = generateDailyLogIntelligence([makeRecord()], null, [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("includes URGENT actions when staff is empty", () => {
    const result = generateDailyLogIntelligence([makeRecord()], makePolicy(), [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("staff"))).toBe(true);
  });

  it("includes HIGH actions when quality rates are below 50%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        detailedObservation: false,
        childMoodRecorded: false,
        keyworkerInformed: false,
        actionFollowedUp: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    );
    const result = generateDailyLogIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.startsWith("HIGH"))).toBe(true);
  });

  it("includes 7 regulatory links", () => {
    const result = generateDailyLogIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Regulation 36");
  });

  it("builds child profiles in result", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "rec-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateDailyLogIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.childProfiles).toHaveLength(2);
  });

  it("strengths include overall rating message for good score", () => {
    const records = ALL_CATEGORIES.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = generateDailyLogIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.strengths.some((s) => s.includes("Outstanding") || s.includes("Good"))).toBe(true);
  });

  it("areasForImprovement populated for low overall score", () => {
    const result = generateDailyLogIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("no actions message when everything is good", () => {
    const records = ALL_CATEGORIES.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = generateDailyLogIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("MEDIUM action for children with low scores", () => {
    const records = [
      makeRecord({
        childId: "child-alex",
        childName: "Alex",
        detailedObservation: false,
        childMoodRecorded: false,
        keyworkerInformed: false,
        actionFollowedUp: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    ];
    const result = generateDailyLogIntelligence(records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("child"))).toBe(true);
  });
});
