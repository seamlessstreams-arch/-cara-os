// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Supervision Quality Intelligence Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateSessionQuality,
  evaluateScheduleCompliance,
  evaluateActionTracking,
  evaluateStaffDevelopment,
  buildStaffSupervisionProfiles,
  generateSupervisionQualityIntelligence,
  getRating,
  pct,
  getSupervisionTypeLabel,
  getSupervisionFrequencyLabel,
  getSupervisionQualityLabel,
  getReflectivePracticeLevelLabel,
  getActionCompletionStatusLabel,
  getWellbeingCheckOutcomeLabel,
  getRatingLabel,
} from "../supervision-quality-engine";
import type {
  SupervisionSession,
  SupervisionSchedule,
  SupervisionAction,
  StaffDevelopmentOutcome,
  SupervisionType,
  SupervisionFrequency,
  SupervisionQuality,
  ReflectivePracticeLevel,
  ActionCompletionStatus,
  WellbeingCheckOutcome,
  Rating,
} from "../supervision-quality-engine";

// ── Shared Constants ───────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const HOME_ID = "oak-house";

// ── Factory Helpers ────────────────────────────────────────────────────────

function makeSession(overrides: Partial<SupervisionSession> = {}): SupervisionSession {
  return {
    id: "sess-1",
    staffId: "staff-1",
    staffName: "Test Staff",
    supervisorId: "sup-1",
    supervisorName: "Test Supervisor",
    date: "2025-03-15",
    durationMinutes: 60,
    supervisionType: "formal_individual",
    quality: "good",
    reflectivePracticeLevel: "reflective",
    safeguardingDiscussed: true,
    childrenDiscussed: ["Child A", "Child B"],
    actionsAgreed: 3,
    actionsCompleted: 2,
    wellbeingCheck: "no_concerns",
    recordedTimely: true,
    staffSignedOff: true,
    supervisorSignedOff: true,
    ...overrides,
  };
}

function makeSchedule(overrides: Partial<SupervisionSchedule> = {}): SupervisionSchedule {
  return {
    id: "sch-1",
    staffId: "staff-1",
    staffName: "Test Staff",
    requiredFrequency: "monthly",
    lastSessionDate: "2025-03-15",
    nextDueDate: "2025-04-15",
    consecutiveMissed: 0,
    overdue: false,
    ...overrides,
  };
}

function makeAction(overrides: Partial<SupervisionAction> = {}): SupervisionAction {
  return {
    id: "act-1",
    sessionId: "sess-1",
    staffId: "staff-1",
    staffName: "Test Staff",
    description: "Complete training module",
    targetDate: "2025-04-15",
    status: "completed_on_time",
    category: "practice",
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<StaffDevelopmentOutcome> = {}): StaffDevelopmentOutcome {
  return {
    id: "out-1",
    staffId: "staff-1",
    staffName: "Test Staff",
    skillArea: "Safeguarding",
    startLevel: 2,
    currentLevel: 3,
    improvementPlan: true,
    targetDate: "2025-06-01",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getSupervisionTypeLabel", () => {
  it("returns correct label for each type", () => {
    expect(getSupervisionTypeLabel("formal_individual")).toBe("Formal Individual");
    expect(getSupervisionTypeLabel("group")).toBe("Group");
    expect(getSupervisionTypeLabel("peer")).toBe("Peer");
    expect(getSupervisionTypeLabel("management")).toBe("Management");
    expect(getSupervisionTypeLabel("clinical")).toBe("Clinical");
    expect(getSupervisionTypeLabel("safeguarding")).toBe("Safeguarding");
  });

  it("returns raw value for unknown type", () => {
    expect(getSupervisionTypeLabel("unknown" as SupervisionType)).toBe("unknown");
  });
});

describe("getSupervisionFrequencyLabel", () => {
  it("returns correct label for each frequency", () => {
    expect(getSupervisionFrequencyLabel("weekly")).toBe("Weekly");
    expect(getSupervisionFrequencyLabel("fortnightly")).toBe("Fortnightly");
    expect(getSupervisionFrequencyLabel("monthly")).toBe("Monthly");
    expect(getSupervisionFrequencyLabel("six_weekly")).toBe("Six-Weekly");
    expect(getSupervisionFrequencyLabel("quarterly")).toBe("Quarterly");
    expect(getSupervisionFrequencyLabel("ad_hoc")).toBe("Ad Hoc");
  });

  it("returns raw value for unknown frequency", () => {
    expect(getSupervisionFrequencyLabel("unknown" as SupervisionFrequency)).toBe("unknown");
  });
});

describe("getSupervisionQualityLabel", () => {
  it("returns correct label for each quality", () => {
    expect(getSupervisionQualityLabel("outstanding")).toBe("Outstanding");
    expect(getSupervisionQualityLabel("good")).toBe("Good");
    expect(getSupervisionQualityLabel("adequate")).toBe("Adequate");
    expect(getSupervisionQualityLabel("inadequate")).toBe("Inadequate");
  });

  it("returns raw value for unknown quality", () => {
    expect(getSupervisionQualityLabel("unknown" as SupervisionQuality)).toBe("unknown");
  });
});

describe("getReflectivePracticeLevelLabel", () => {
  it("returns correct label for each level", () => {
    expect(getReflectivePracticeLevelLabel("deeply_reflective")).toBe("Deeply Reflective");
    expect(getReflectivePracticeLevelLabel("reflective")).toBe("Reflective");
    expect(getReflectivePracticeLevelLabel("surface_level")).toBe("Surface Level");
    expect(getReflectivePracticeLevelLabel("not_reflective")).toBe("Not Reflective");
  });

  it("returns raw value for unknown level", () => {
    expect(getReflectivePracticeLevelLabel("unknown" as ReflectivePracticeLevel)).toBe("unknown");
  });
});

describe("getActionCompletionStatusLabel", () => {
  it("returns correct label for each status", () => {
    expect(getActionCompletionStatusLabel("completed_on_time")).toBe("Completed On Time");
    expect(getActionCompletionStatusLabel("completed_late")).toBe("Completed Late");
    expect(getActionCompletionStatusLabel("in_progress")).toBe("In Progress");
    expect(getActionCompletionStatusLabel("overdue")).toBe("Overdue");
    expect(getActionCompletionStatusLabel("not_started")).toBe("Not Started");
  });

  it("returns raw value for unknown status", () => {
    expect(getActionCompletionStatusLabel("unknown" as ActionCompletionStatus)).toBe("unknown");
  });
});

describe("getWellbeingCheckOutcomeLabel", () => {
  it("returns correct label for each outcome", () => {
    expect(getWellbeingCheckOutcomeLabel("no_concerns")).toBe("No Concerns");
    expect(getWellbeingCheckOutcomeLabel("minor_concerns_addressed")).toBe("Minor Concerns Addressed");
    expect(getWellbeingCheckOutcomeLabel("significant_concerns")).toBe("Significant Concerns");
    expect(getWellbeingCheckOutcomeLabel("urgent_referral")).toBe("Urgent Referral");
  });

  it("returns raw value for unknown outcome", () => {
    expect(getWellbeingCheckOutcomeLabel("unknown" as WellbeingCheckOutcome)).toBe("unknown");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for each rating", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });

  it("returns raw value for unknown rating", () => {
    expect(getRatingLabel("unknown" as Rating)).toBe("unknown");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(70)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

describe("pct", () => {
  it("calculates percentage correctly", () => {
    expect(pct(1, 2)).toBe(50);
    expect(pct(3, 4)).toBe(75);
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
    expect(pct(0, 0)).toBe(0);
  });

  it("returns 100 for 1/1", () => {
    expect(pct(1, 1)).toBe(100);
  });

  it("returns 0 for 0/n", () => {
    expect(pct(0, 5)).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSessionQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSessionQuality", () => {
  it("returns zero scores for empty sessions", () => {
    const result = evaluateSessionQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.outstandingGoodRate).toBe(0);
    expect(result.reflectiveRate).toBe(0);
    expect(result.safeguardingDiscussionRate).toBe(0);
    expect(result.averageDurationMinutes).toBe(0);
    expect(result.recordingComplianceRate).toBe(0);
    expect(result.signOffRate).toBe(0);
  });

  it("calculates outstanding/good rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", quality: "outstanding" }),
      makeSession({ id: "s2", quality: "good" }),
      makeSession({ id: "s3", quality: "adequate" }),
      makeSession({ id: "s4", quality: "inadequate" }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.outstandingGoodRate).toBe(50);
    expect(result.totalSessions).toBe(4);
  });

  it("calculates 100% outstanding/good rate", () => {
    const sessions = [
      makeSession({ id: "s1", quality: "outstanding" }),
      makeSession({ id: "s2", quality: "good" }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.outstandingGoodRate).toBe(100);
  });

  it("calculates reflective rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", reflectivePracticeLevel: "deeply_reflective" }),
      makeSession({ id: "s2", reflectivePracticeLevel: "reflective" }),
      makeSession({ id: "s3", reflectivePracticeLevel: "surface_level" }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.reflectiveRate).toBe(67);
  });

  it("calculates safeguarding discussion rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", safeguardingDiscussed: true }),
      makeSession({ id: "s2", safeguardingDiscussed: true }),
      makeSession({ id: "s3", safeguardingDiscussed: false }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.safeguardingDiscussionRate).toBe(67);
  });

  it("calculates average duration correctly", () => {
    const sessions = [
      makeSession({ id: "s1", durationMinutes: 45 }),
      makeSession({ id: "s2", durationMinutes: 60 }),
      makeSession({ id: "s3", durationMinutes: 75 }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.averageDurationMinutes).toBe(60);
  });

  it("calculates recording compliance rate correctly", () => {
    const sessions = [
      makeSession({ id: "s1", recordedTimely: true }),
      makeSession({ id: "s2", recordedTimely: true }),
      makeSession({ id: "s3", recordedTimely: false }),
      makeSession({ id: "s4", recordedTimely: false }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.recordingComplianceRate).toBe(50);
  });

  it("calculates sign-off rate correctly (both must sign)", () => {
    const sessions = [
      makeSession({ id: "s1", staffSignedOff: true, supervisorSignedOff: true }),
      makeSession({ id: "s2", staffSignedOff: true, supervisorSignedOff: false }),
      makeSession({ id: "s3", staffSignedOff: false, supervisorSignedOff: true }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.signOffRate).toBe(33);
  });

  it("gives high score for all-excellent sessions", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({
        id: `s${i}`,
        quality: "outstanding",
        reflectivePracticeLevel: "deeply_reflective",
        safeguardingDiscussed: true,
        recordedTimely: true,
        staffSignedOff: true,
        supervisorSignedOff: true,
      }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.overallScore).toBe(25);
    expect(result.outstandingGoodRate).toBe(100);
    expect(result.reflectiveRate).toBe(100);
  });

  it("gives low score for poor quality sessions", () => {
    const sessions = [
      makeSession({
        id: "s1",
        quality: "inadequate",
        reflectivePracticeLevel: "not_reflective",
        safeguardingDiscussed: false,
        recordedTimely: false,
        staffSignedOff: false,
        supervisorSignedOff: false,
      }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.overallScore).toBe(0);
    expect(result.outstandingGoodRate).toBe(0);
    expect(result.reflectiveRate).toBe(0);
  });

  it("caps score at 25", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `s${i}`,
        quality: "outstanding",
        reflectivePracticeLevel: "deeply_reflective",
        safeguardingDiscussed: true,
        recordedTimely: true,
        staffSignedOff: true,
        supervisorSignedOff: true,
      }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateScheduleCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateScheduleCompliance", () => {
  it("returns zero scores for empty schedules", () => {
    const result = evaluateScheduleCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.onScheduleRate).toBe(0);
    expect(result.overdueCount).toBe(0);
    expect(result.consecutiveMissedMax).toBe(0);
    expect(result.averageDaysBetweenSessions).toBe(0);
  });

  it("calculates on-schedule rate correctly", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: false }),
      makeSchedule({ id: "sch2", staffId: "s2", overdue: true }),
      makeSchedule({ id: "sch3", staffId: "s3", overdue: false }),
    ];
    const result = evaluateScheduleCompliance(schedules);
    expect(result.onScheduleRate).toBe(67);
    expect(result.overdueCount).toBe(1);
    expect(result.totalStaff).toBe(3);
  });

  it("returns 100% on-schedule when no one is overdue", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: false }),
      makeSchedule({ id: "sch2", staffId: "s2", overdue: false }),
    ];
    const result = evaluateScheduleCompliance(schedules);
    expect(result.onScheduleRate).toBe(100);
    expect(result.overdueCount).toBe(0);
  });

  it("gives max score when all on schedule", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: false, consecutiveMissed: 0 }),
      makeSchedule({ id: "sch2", staffId: "s2", overdue: false, consecutiveMissed: 0 }),
    ];
    const result = evaluateScheduleCompliance(schedules);
    expect(result.overallScore).toBe(25);
  });

  it("finds maximum consecutive missed", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", consecutiveMissed: 1 }),
      makeSchedule({ id: "sch2", staffId: "s2", consecutiveMissed: 4 }),
      makeSchedule({ id: "sch3", staffId: "s3", consecutiveMissed: 2 }),
    ];
    const result = evaluateScheduleCompliance(schedules);
    expect(result.consecutiveMissedMax).toBe(4);
  });

  it("applies penalty for consecutive missed > 2", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: false, consecutiveMissed: 3 }),
      makeSchedule({ id: "sch2", staffId: "s2", overdue: false, consecutiveMissed: 0 }),
    ];
    const result = evaluateScheduleCompliance(schedules);
    // 100% on schedule = 25 base, but -3 for staff > 2 consecutive, -5 for any >= 3
    expect(result.overallScore).toBeLessThan(25);
  });

  it("applies additional -5 penalty for 3+ consecutive missed", () => {
    const allOnSchedule = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: false, consecutiveMissed: 0 }),
    ];
    const resultClean = evaluateScheduleCompliance(allOnSchedule);

    const withMissed = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: false, consecutiveMissed: 3 }),
    ];
    const resultMissed = evaluateScheduleCompliance(withMissed);

    // Should have both -3 (>2) and -5 (>=3) penalties applied
    expect(resultMissed.overallScore).toBeLessThan(resultClean.overallScore);
  });

  it("calculates average days between sessions", () => {
    const schedules = [
      makeSchedule({
        id: "sch1",
        staffId: "s1",
        lastSessionDate: "2025-03-01",
        nextDueDate: "2025-04-01",
      }),
      makeSchedule({
        id: "sch2",
        staffId: "s2",
        lastSessionDate: "2025-03-15",
        nextDueDate: "2025-04-15",
      }),
    ];
    const result = evaluateScheduleCompliance(schedules);
    expect(result.averageDaysBetweenSessions).toBe(31);
  });

  it("caps score at 0 minimum even with many penalties", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: true, consecutiveMissed: 5 }),
      makeSchedule({ id: "sch2", staffId: "s2", overdue: true, consecutiveMissed: 4 }),
      makeSchedule({ id: "sch3", staffId: "s3", overdue: true, consecutiveMissed: 6 }),
    ];
    const result = evaluateScheduleCompliance(schedules);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("caps score at 25 maximum", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: false, consecutiveMissed: 0 }),
    ];
    const result = evaluateScheduleCompliance(schedules);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateActionTracking
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateActionTracking", () => {
  it("returns zero scores for empty actions", () => {
    const result = evaluateActionTracking([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalActions).toBe(0);
    expect(result.completedOnTimeRate).toBe(0);
    expect(result.overdueCount).toBe(0);
    expect(result.safeguardingActionCompletionRate).toBe(0);
    expect(result.byCategory).toEqual({});
  });

  it("calculates completed on time rate correctly", () => {
    const actions = [
      makeAction({ id: "a1", status: "completed_on_time" }),
      makeAction({ id: "a2", status: "completed_late" }),
      makeAction({ id: "a3", status: "overdue" }),
      makeAction({ id: "a4", status: "in_progress" }),
    ];
    const result = evaluateActionTracking(actions);
    expect(result.completedOnTimeRate).toBe(25);
    expect(result.totalActions).toBe(4);
  });

  it("counts overdue actions correctly", () => {
    const actions = [
      makeAction({ id: "a1", status: "overdue" }),
      makeAction({ id: "a2", status: "overdue" }),
      makeAction({ id: "a3", status: "completed_on_time" }),
    ];
    const result = evaluateActionTracking(actions);
    expect(result.overdueCount).toBe(2);
  });

  it("calculates safeguarding action completion rate", () => {
    const actions = [
      makeAction({ id: "a1", category: "safeguarding", status: "completed_on_time" }),
      makeAction({ id: "a2", category: "safeguarding", status: "completed_late" }),
      makeAction({ id: "a3", category: "safeguarding", status: "overdue" }),
    ];
    const result = evaluateActionTracking(actions);
    expect(result.safeguardingActionCompletionRate).toBe(67);
  });

  it("gives 0% safeguarding completion when all overdue", () => {
    const actions = [
      makeAction({ id: "a1", category: "safeguarding", status: "overdue" }),
    ];
    const result = evaluateActionTracking(actions);
    expect(result.safeguardingActionCompletionRate).toBe(0);
  });

  it("calculates category breakdown correctly", () => {
    const actions = [
      makeAction({ id: "a1", category: "practice" }),
      makeAction({ id: "a2", category: "practice" }),
      makeAction({ id: "a3", category: "safeguarding" }),
      makeAction({ id: "a4", category: "training" }),
      makeAction({ id: "a5", category: "wellbeing" }),
    ];
    const result = evaluateActionTracking(actions);
    expect(result.byCategory).toEqual({
      practice: 2,
      safeguarding: 1,
      training: 1,
      wellbeing: 1,
    });
  });

  it("gives high score when all completed on time and no overdue", () => {
    const actions = [
      makeAction({ id: "a1", status: "completed_on_time", category: "safeguarding" }),
      makeAction({ id: "a2", status: "completed_on_time", category: "practice" }),
    ];
    const result = evaluateActionTracking(actions);
    expect(result.overallScore).toBe(25);
  });

  it("penalises overdue safeguarding actions", () => {
    const withoutOverdue = [
      makeAction({ id: "a1", status: "completed_on_time", category: "safeguarding" }),
    ];
    const withOverdue = [
      makeAction({ id: "a1", status: "overdue", category: "safeguarding" }),
    ];
    const resultGood = evaluateActionTracking(withoutOverdue);
    const resultBad = evaluateActionTracking(withOverdue);
    expect(resultBad.overallScore).toBeLessThan(resultGood.overallScore);
  });

  it("gives bonus points when no actions are overdue", () => {
    const noOverdue = [
      makeAction({ id: "a1", status: "completed_on_time" }),
      makeAction({ id: "a2", status: "in_progress" }),
    ];
    const withOverdue = [
      makeAction({ id: "a1", status: "completed_on_time" }),
      makeAction({ id: "a2", status: "overdue" }),
    ];
    const resultNoOverdue = evaluateActionTracking(noOverdue);
    const resultWithOverdue = evaluateActionTracking(withOverdue);
    expect(resultNoOverdue.overallScore).toBeGreaterThan(resultWithOverdue.overallScore);
  });

  it("caps score at 25", () => {
    const actions = Array.from({ length: 20 }, (_, i) =>
      makeAction({ id: `a${i}`, status: "completed_on_time", category: "safeguarding" }),
    );
    const result = evaluateActionTracking(actions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("caps score at 0 minimum", () => {
    const actions = Array.from({ length: 10 }, (_, i) =>
      makeAction({ id: `a${i}`, status: "overdue", category: "safeguarding" }),
    );
    const result = evaluateActionTracking(actions);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffDevelopment
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffDevelopment", () => {
  it("returns zero scores for empty outcomes", () => {
    const result = evaluateStaffDevelopment([], []);
    expect(result.overallScore).toBe(0);
    expect(result.totalOutcomes).toBe(0);
    expect(result.improvementRate).toBe(0);
    expect(result.withPlanRate).toBe(0);
    expect(result.averageSkillImprovement).toBe(0);
    expect(result.wellbeingConcernRate).toBe(0);
  });

  it("calculates improvement rate correctly", () => {
    const outcomes = [
      makeOutcome({ id: "o1", startLevel: 2, currentLevel: 4 }),
      makeOutcome({ id: "o2", startLevel: 3, currentLevel: 3 }),
      makeOutcome({ id: "o3", startLevel: 1, currentLevel: 2 }),
    ];
    const result = evaluateStaffDevelopment(outcomes, []);
    expect(result.improvementRate).toBe(67);
  });

  it("calculates with-plan rate correctly", () => {
    const outcomes = [
      makeOutcome({ id: "o1", improvementPlan: true }),
      makeOutcome({ id: "o2", improvementPlan: false }),
      makeOutcome({ id: "o3", improvementPlan: true }),
      makeOutcome({ id: "o4", improvementPlan: true }),
    ];
    const result = evaluateStaffDevelopment(outcomes, []);
    expect(result.withPlanRate).toBe(75);
  });

  it("calculates average skill improvement correctly", () => {
    const outcomes = [
      makeOutcome({ id: "o1", startLevel: 2, currentLevel: 4 }),
      makeOutcome({ id: "o2", startLevel: 3, currentLevel: 4 }),
    ];
    const result = evaluateStaffDevelopment(outcomes, []);
    expect(result.averageSkillImprovement).toBe(1.5);
  });

  it("handles negative skill change (regression)", () => {
    const outcomes = [
      makeOutcome({ id: "o1", startLevel: 4, currentLevel: 2 }),
    ];
    const result = evaluateStaffDevelopment(outcomes, []);
    expect(result.averageSkillImprovement).toBe(-2);
    expect(result.improvementRate).toBe(0);
  });

  it("extracts wellbeing concern rate from sessions", () => {
    const sessions = [
      makeSession({ id: "s1", wellbeingCheck: "no_concerns" }),
      makeSession({ id: "s2", wellbeingCheck: "minor_concerns_addressed" }),
      makeSession({ id: "s3", wellbeingCheck: "significant_concerns" }),
      makeSession({ id: "s4", wellbeingCheck: "urgent_referral" }),
    ];
    const result = evaluateStaffDevelopment([], sessions);
    expect(result.wellbeingConcernRate).toBe(50);
  });

  it("counts only significant_concerns and urgent_referral as concerns", () => {
    const sessions = [
      makeSession({ id: "s1", wellbeingCheck: "no_concerns" }),
      makeSession({ id: "s2", wellbeingCheck: "minor_concerns_addressed" }),
    ];
    const result = evaluateStaffDevelopment([], sessions);
    expect(result.wellbeingConcernRate).toBe(0);
  });

  it("gives higher score with low wellbeing concerns", () => {
    const outcomes = [makeOutcome({ id: "o1", startLevel: 2, currentLevel: 3 })];
    const noConcernSessions = [
      makeSession({ id: "s1", wellbeingCheck: "no_concerns" }),
    ];
    const highConcernSessions = [
      makeSession({ id: "s1", wellbeingCheck: "significant_concerns" }),
      makeSession({ id: "s2", wellbeingCheck: "urgent_referral" }),
    ];
    const resultLow = evaluateStaffDevelopment(outcomes, noConcernSessions);
    const resultHigh = evaluateStaffDevelopment(outcomes, highConcernSessions);
    expect(resultLow.overallScore).toBeGreaterThan(resultHigh.overallScore);
  });

  it("gives good score for all outcomes improved with plans", () => {
    const outcomes = [
      makeOutcome({ id: "o1", startLevel: 2, currentLevel: 4, improvementPlan: true }),
      makeOutcome({ id: "o2", startLevel: 1, currentLevel: 3, improvementPlan: true }),
    ];
    const sessions = [makeSession({ id: "s1", wellbeingCheck: "no_concerns" })];
    const result = evaluateStaffDevelopment(outcomes, sessions);
    expect(result.overallScore).toBeGreaterThan(20);
  });

  it("caps score at 25", () => {
    const outcomes = Array.from({ length: 10 }, (_, i) =>
      makeOutcome({ id: `o${i}`, startLevel: 1, currentLevel: 5, improvementPlan: true }),
    );
    const sessions = [makeSession({ wellbeingCheck: "no_concerns" })];
    const result = evaluateStaffDevelopment(outcomes, sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildStaffSupervisionProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildStaffSupervisionProfiles", () => {
  it("returns empty array for no data", () => {
    const result = buildStaffSupervisionProfiles([], [], []);
    expect(result).toEqual([]);
  });

  it("creates profile from sessions only", () => {
    const sessions = [
      makeSession({ staffId: "s1", staffName: "Alice", date: "2025-03-15", quality: "good" }),
      makeSession({ id: "s2", staffId: "s1", staffName: "Alice", date: "2025-04-15", quality: "outstanding" }),
    ];
    const result = buildStaffSupervisionProfiles(sessions, [], []);
    expect(result).toHaveLength(1);
    expect(result[0].staffId).toBe("s1");
    expect(result[0].staffName).toBe("Alice");
    expect(result[0].sessionCount).toBe(2);
    expect(result[0].lastSessionDate).toBe("2025-04-15");
    expect(result[0].overdue).toBe(false);
  });

  it("resolves quality average correctly", () => {
    // 2 outstanding (4) + 1 good (3) = avg 3.67 → outstanding
    const sessions = [
      makeSession({ id: "s1", staffId: "s1", quality: "outstanding" }),
      makeSession({ id: "s2", staffId: "s1", quality: "outstanding" }),
      makeSession({ id: "s3", staffId: "s1", quality: "good" }),
    ];
    const result = buildStaffSupervisionProfiles(sessions, [], []);
    expect(result[0].qualityAverage).toBe("outstanding");
  });

  it("resolves quality average as good", () => {
    // 1 outstanding (4) + 2 good (3) = avg 3.33 → good
    const sessions = [
      makeSession({ id: "s1", staffId: "s1", quality: "outstanding" }),
      makeSession({ id: "s2", staffId: "s1", quality: "good" }),
      makeSession({ id: "s3", staffId: "s1", quality: "good" }),
    ];
    const result = buildStaffSupervisionProfiles(sessions, [], []);
    expect(result[0].qualityAverage).toBe("good");
  });

  it("resolves quality average as adequate", () => {
    // 1 good (3) + 1 inadequate (1) = avg 2.0 → adequate
    const sessions = [
      makeSession({ id: "s1", staffId: "s1", quality: "good" }),
      makeSession({ id: "s2", staffId: "s1", quality: "inadequate" }),
    ];
    const result = buildStaffSupervisionProfiles(sessions, [], []);
    expect(result[0].qualityAverage).toBe("adequate");
  });

  it("resolves quality average as inadequate", () => {
    const sessions = [
      makeSession({ id: "s1", staffId: "s1", quality: "inadequate" }),
    ];
    const result = buildStaffSupervisionProfiles(sessions, [], []);
    expect(result[0].qualityAverage).toBe("inadequate");
  });

  it("returns none for quality average when no sessions", () => {
    const schedules = [makeSchedule({ staffId: "s1" })];
    const result = buildStaffSupervisionProfiles([], schedules, []);
    expect(result[0].qualityAverage).toBe("none");
  });

  it("picks up overdue status from schedule", () => {
    const schedules = [makeSchedule({ staffId: "s1", overdue: true })];
    const result = buildStaffSupervisionProfiles([], schedules, []);
    expect(result[0].overdue).toBe(true);
  });

  it("counts actions completed and outstanding", () => {
    const actions = [
      makeAction({ id: "a1", staffId: "s1", status: "completed_on_time" }),
      makeAction({ id: "a2", staffId: "s1", status: "completed_late" }),
      makeAction({ id: "a3", staffId: "s1", status: "overdue" }),
      makeAction({ id: "a4", staffId: "s1", status: "in_progress" }),
      makeAction({ id: "a5", staffId: "s1", status: "not_started" }),
    ];
    const result = buildStaffSupervisionProfiles([], [], actions);
    expect(result[0].actionsCompleted).toBe(2);
    expect(result[0].actionsOutstanding).toBe(3);
  });

  it("creates profiles for multiple staff", () => {
    const sessions = [
      makeSession({ id: "s1", staffId: "s1", staffName: "Alice" }),
      makeSession({ id: "s2", staffId: "s2", staffName: "Bob" }),
    ];
    const result = buildStaffSupervisionProfiles(sessions, [], []);
    expect(result).toHaveLength(2);
    const names = result.map((p) => p.staffName);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
  });

  it("merges data across sessions, schedules, and actions for same staff", () => {
    const sessions = [
      makeSession({ staffId: "s1", staffName: "Alice", quality: "outstanding" }),
    ];
    const schedules = [
      makeSchedule({ staffId: "s1", staffName: "Alice", overdue: false }),
    ];
    const actions = [
      makeAction({ id: "a1", staffId: "s1", staffName: "Alice", status: "completed_on_time" }),
    ];
    const result = buildStaffSupervisionProfiles(sessions, schedules, actions);
    expect(result).toHaveLength(1);
    expect(result[0].sessionCount).toBe(1);
    expect(result[0].overdue).toBe(false);
    expect(result[0].actionsCompleted).toBe(1);
  });

  it("caps overall score at 10", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `s${i}`, staffId: "s1", quality: "outstanding" }),
    );
    const actions = Array.from({ length: 10 }, (_, i) =>
      makeAction({ id: `a${i}`, staffId: "s1", status: "completed_on_time" }),
    );
    const result = buildStaffSupervisionProfiles(sessions, [], actions);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("caps overall score at 0 minimum", () => {
    const schedules = [makeSchedule({ staffId: "s1", overdue: true })];
    const result = buildStaffSupervisionProfiles([], schedules, []);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateSupervisionQualityIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateSupervisionQualityIntelligence", () => {
  it("returns complete intelligence structure", () => {
    const result = generateSupervisionQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.sessionQuality).toBeDefined();
    expect(result.scheduleCompliance).toBeDefined();
    expect(result.actionTracking).toBeDefined();
    expect(result.staffDevelopment).toBeDefined();
    expect(result.staffProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("returns inadequate rating for all empty data", () => {
    const result = generateSupervisionQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });

  it("sums component scores into overall score", () => {
    const sessions = [
      makeSession({ quality: "outstanding", reflectivePracticeLevel: "deeply_reflective" }),
    ];
    const schedules = [makeSchedule({ overdue: false, consecutiveMissed: 0 })];
    const actions = [makeAction({ status: "completed_on_time", category: "safeguarding" })];
    const outcomes = [makeOutcome({ startLevel: 2, currentLevel: 4 })];

    const result = generateSupervisionQualityIntelligence(
      sessions, schedules, actions, outcomes, HOME_ID, PERIOD_START, PERIOD_END,
    );

    const expectedSum =
      result.sessionQuality.overallScore +
      result.scheduleCompliance.overallScore +
      result.actionTracking.overallScore +
      result.staffDevelopment.overallScore;

    expect(result.overallScore).toBe(Math.round(expectedSum * 10) / 10);
  });

  it("calculates correct rating from overall score", () => {
    // All excellent data should give high score
    const sessions = Array.from({ length: 6 }, (_, i) =>
      makeSession({
        id: `s${i}`,
        quality: "outstanding",
        reflectivePracticeLevel: "deeply_reflective",
        safeguardingDiscussed: true,
        recordedTimely: true,
        staffSignedOff: true,
        supervisorSignedOff: true,
        wellbeingCheck: "no_concerns",
      }),
    );
    const schedules = [
      makeSchedule({ overdue: false, consecutiveMissed: 0 }),
    ];
    const actions = Array.from({ length: 4 }, (_, i) =>
      makeAction({ id: `a${i}`, status: "completed_on_time", category: i === 0 ? "safeguarding" : "practice" }),
    );
    const outcomes = [
      makeOutcome({ startLevel: 2, currentLevel: 4, improvementPlan: true }),
    ];

    const result = generateSupervisionQualityIntelligence(
      sessions, schedules, actions, outcomes, HOME_ID, PERIOD_START, PERIOD_END,
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  // ── Strengths Tests ──

  it("includes strength for high outstanding/good rate", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s${i}`, quality: "outstanding" }),
    );
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("outstanding or good"))).toBe(true);
  });

  it("includes strength for high reflective rate", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s${i}`, reflectivePracticeLevel: "deeply_reflective" }),
    );
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("Reflective practice"))).toBe(true);
  });

  it("includes strength for high safeguarding discussion rate", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `s${i}`, safeguardingDiscussed: true }),
    );
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("Safeguarding is discussed"))).toBe(true);
  });

  it("includes strength for 100% on-schedule", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: false }),
      makeSchedule({ id: "sch2", staffId: "s2", overdue: false }),
    ];
    const result = generateSupervisionQualityIntelligence(
      [], schedules, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("within required timescales"))).toBe(true);
  });

  it("includes strength for high action completion rate", () => {
    const actions = Array.from({ length: 5 }, (_, i) =>
      makeAction({ id: `a${i}`, status: "completed_on_time" }),
    );
    const result = generateSupervisionQualityIntelligence(
      [], [], actions, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("completed on time"))).toBe(true);
  });

  it("includes strength for low wellbeing concerns", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s${i}`, wellbeingCheck: "no_concerns" }),
    );
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("wellbeing concerns"))).toBe(true);
  });

  // ── Areas for Improvement Tests ──

  it("flags low quality rate as area for improvement", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s${i}`, quality: "inadequate" }),
    );
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("quality of supervision"))).toBe(true);
  });

  it("flags low reflective rate as area for improvement", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s${i}`, reflectivePracticeLevel: "not_reflective" }),
    );
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("Reflective practice"))).toBe(true);
  });

  it("flags overdue supervision as area for improvement", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: true }),
    ];
    const result = generateSupervisionQualityIntelligence(
      [], schedules, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("overdue supervision"))).toBe(true);
  });

  it("flags consecutive missed sessions as area for improvement", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", consecutiveMissed: 3 }),
    ];
    const result = generateSupervisionQualityIntelligence(
      [], schedules, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("consecutive supervision sessions"))).toBe(true);
  });

  it("flags overdue actions as area for improvement", () => {
    const actions = [
      makeAction({ id: "a1", status: "overdue" }),
    ];
    const result = generateSupervisionQualityIntelligence(
      [], [], actions, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("overdue"))).toBe(true);
  });

  it("flags high wellbeing concern rate", () => {
    const sessions = Array.from({ length: 4 }, (_, i) =>
      makeSession({ id: `s${i}`, wellbeingCheck: "significant_concerns" }),
    );
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("wellbeing concerns"))).toBe(true);
  });

  // ── Actions Tests ──

  it("generates URGENT action for overdue safeguarding actions", () => {
    const actions = [
      makeAction({ id: "a1", category: "safeguarding", status: "overdue" }),
    ];
    const result = generateSupervisionQualityIntelligence(
      [], [], actions, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("safeguarding"))).toBe(true);
  });

  it("generates URGENT action for 3+ consecutive missed", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", consecutiveMissed: 3 }),
    ];
    const result = generateSupervisionQualityIntelligence(
      [], schedules, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("missed 3 or more"))).toBe(true);
  });

  it("generates URGENT action for overdue schedules", () => {
    const schedules = [
      makeSchedule({ id: "sch1", staffId: "s1", overdue: true }),
    ];
    const result = generateSupervisionQualityIntelligence(
      [], schedules, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("overdue"))).toBe(true);
  });

  it("generates HIGH action for low safeguarding discussion rate", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s${i}`, safeguardingDiscussed: false }),
    );
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("HIGH") && a.includes("safeguarding"))).toBe(true);
  });

  it("generates HIGH action for low reflective rate", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s${i}`, reflectivePracticeLevel: "not_reflective" }),
    );
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("HIGH") && a.includes("reflective supervision"))).toBe(true);
  });

  it("generates MEDIUM action for low recording compliance", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s${i}`, recordedTimely: false }),
    );
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("MEDIUM") && a.includes("recording"))).toBe(true);
  });

  it("does not generate unnecessary actions for good data", () => {
    const sessions = Array.from({ length: 6 }, (_, i) =>
      makeSession({
        id: `s${i}`,
        quality: "outstanding",
        reflectivePracticeLevel: "deeply_reflective",
        safeguardingDiscussed: true,
        recordedTimely: true,
        staffSignedOff: true,
        supervisorSignedOff: true,
        wellbeingCheck: "no_concerns",
      }),
    );
    const schedules = [
      makeSchedule({ overdue: false, consecutiveMissed: 0 }),
    ];
    const actions = [
      makeAction({ status: "completed_on_time", category: "safeguarding" }),
    ];
    const result = generateSupervisionQualityIntelligence(
      sessions, schedules, actions, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.filter((a) => a.startsWith("URGENT")).length).toBe(0);
  });

  // ── Regulatory Links Tests ──

  it("includes all required regulatory links", () => {
    const result = generateSupervisionQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 33"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 13"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 19"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 20"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Munro Review"))).toBe(true);
  });

  it("returns exactly 7 regulatory links", () => {
    const result = generateSupervisionQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  // ── Staff Profiles Integration ──

  it("includes staff profiles in main result", () => {
    const sessions = [
      makeSession({ staffId: "s1", staffName: "Alice" }),
      makeSession({ id: "s2", staffId: "s2", staffName: "Bob" }),
    ];
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.staffProfiles).toHaveLength(2);
  });

  // ── Edge Cases ──

  it("handles single session correctly", () => {
    const result = generateSupervisionQualityIntelligence(
      [makeSession()], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.sessionQuality.totalSessions).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("handles mixed quality data correctly", () => {
    const sessions = [
      makeSession({ id: "s1", quality: "outstanding", reflectivePracticeLevel: "deeply_reflective", safeguardingDiscussed: true }),
      makeSession({ id: "s2", quality: "inadequate", reflectivePracticeLevel: "not_reflective", safeguardingDiscussed: false }),
    ];
    const result = generateSupervisionQualityIntelligence(
      sessions, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.sessionQuality.outstandingGoodRate).toBe(50);
    expect(result.sessionQuality.reflectiveRate).toBe(50);
    expect(result.sessionQuality.safeguardingDiscussionRate).toBe(50);
  });

  it("overall score is always 0-100", () => {
    // Empty data: 0
    const resultEmpty = generateSupervisionQualityIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(resultEmpty.overallScore).toBeGreaterThanOrEqual(0);
    expect(resultEmpty.overallScore).toBeLessThanOrEqual(100);

    // Excellent data
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `s${i}`,
        quality: "outstanding",
        reflectivePracticeLevel: "deeply_reflective",
        safeguardingDiscussed: true,
        recordedTimely: true,
        staffSignedOff: true,
        supervisorSignedOff: true,
        wellbeingCheck: "no_concerns",
      }),
    );
    const resultExcellent = generateSupervisionQualityIntelligence(
      sessions,
      [makeSchedule({ overdue: false, consecutiveMissed: 0 })],
      [makeAction({ status: "completed_on_time", category: "safeguarding" })],
      [makeOutcome({ startLevel: 2, currentLevel: 4 })],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(resultExcellent.overallScore).toBeGreaterThanOrEqual(0);
    expect(resultExcellent.overallScore).toBeLessThanOrEqual(100);
  });
});
