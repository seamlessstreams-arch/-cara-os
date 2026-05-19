import { describe, it, expect } from "vitest";
import {
  generateMorningRoutinePreparationIntelligence, evaluateRoutineCompletion, evaluateWellbeingReadiness,
  evaluateMorningPolicy, evaluateStaffMorningReadiness, buildChildMorningProfiles, pct, getRating,
  getRoutineElementLabel, getCompletionStatusLabel, getRatingLabel,
} from "../morning-routine-preparation-engine";
import type { MorningRecord, MorningPolicy, StaffMorningTraining } from "../morning-routine-preparation-engine";

let _id = 0;
function makeRecord(overrides: Partial<MorningRecord> = {}): MorningRecord {
  _id++;
  return { id: `mr-${_id}`, childId: "child-a", childName: "Alex", recordDate: "2026-04-01", routineElement: "wake_up", completionStatus: "completed_independently", onTimeForSchool: true, breakfastEaten: true, staffSupported: true, moodPositive: true, documentedInLog: true, parentCarerInformed: true, ...overrides };
}
function makePolicy(overrides: Partial<MorningPolicy> = {}): MorningPolicy {
  return { id: "mp-1", morningRoutinePolicy: true, breakfastStandards: true, schoolReadinessProtocol: true, punctualityTracking: true, individualRoutinePlans: true, staffHandoverProcess: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffMorningTraining> = {}): StaffMorningTraining {
  _tid++;
  return { id: `mt-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, morningRoutineManagement: true, breakfastNutrition: true, emotionalRegulation: true, timeManagement: true, schoolLiaison: true, handoverPractice: true, ...overrides };
}

// =============================================================================
// pct
// =============================================================================
describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(0, 0)).toBe(0); });
  it("returns 100 for equal", () => { expect(pct(5, 5)).toBe(100); });
  it("returns 0 for num=0", () => { expect(pct(0, 10)).toBe(0); });
  it("rounds to nearest integer", () => { expect(pct(1, 3)).toBe(33); });
  it("rounds up at .5", () => { expect(pct(1, 6)).toBe(17); });
});

// =============================================================================
// getRating
// =============================================================================
describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
  it("boundary 80 is outstanding", () => { expect(getRating(80)).toBe("outstanding"); });
  it("boundary 60 is good", () => { expect(getRating(60)).toBe("good"); });
  it("boundary 40 is requires_improvement", () => { expect(getRating(40)).toBe("requires_improvement"); });
});

// =============================================================================
// Label getters
// =============================================================================
describe("label getters", () => {
  it("getRoutineElementLabel — wake_up", () => { expect(getRoutineElementLabel("wake_up")).toBe("Wake Up"); });
  it("getRoutineElementLabel — personal_hygiene", () => { expect(getRoutineElementLabel("personal_hygiene")).toBe("Personal Hygiene"); });
  it("getRoutineElementLabel — breakfast", () => { expect(getRoutineElementLabel("breakfast")).toBe("Breakfast"); });
  it("getRoutineElementLabel — medication", () => { expect(getRoutineElementLabel("medication")).toBe("Medication"); });
  it("getRoutineElementLabel — uniform_preparation", () => { expect(getRoutineElementLabel("uniform_preparation")).toBe("Uniform Preparation"); });
  it("getRoutineElementLabel — bag_packed", () => { expect(getRoutineElementLabel("bag_packed")).toBe("Bag Packed"); });
  it("getRoutineElementLabel — transport_ready", () => { expect(getRoutineElementLabel("transport_ready")).toBe("Transport Ready"); });
  it("getRoutineElementLabel — emotional_check_in", () => { expect(getRoutineElementLabel("emotional_check_in")).toBe("Emotional Check-In"); });
  it("getCompletionStatusLabel — completed_independently", () => { expect(getCompletionStatusLabel("completed_independently")).toBe("Completed Independently"); });
  it("getCompletionStatusLabel — completed_with_support", () => { expect(getCompletionStatusLabel("completed_with_support")).toBe("Completed with Support"); });
  it("getCompletionStatusLabel — partially_completed", () => { expect(getCompletionStatusLabel("partially_completed")).toBe("Partially Completed"); });
  it("getCompletionStatusLabel — not_completed", () => { expect(getCompletionStatusLabel("not_completed")).toBe("Not Completed"); });
  it("getCompletionStatusLabel — refused", () => { expect(getCompletionStatusLabel("refused")).toBe("Refused"); });
  it("getRatingLabel — outstanding", () => { expect(getRatingLabel("outstanding")).toBe("Outstanding"); });
  it("getRatingLabel — good", () => { expect(getRatingLabel("good")).toBe("Good"); });
  it("getRatingLabel — requires_improvement", () => { expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement"); });
  it("getRatingLabel — inadequate", () => { expect(getRatingLabel("inadequate")).toBe("Inadequate"); });
});

// =============================================================================
// evaluateRoutineCompletion
// =============================================================================
describe("evaluateRoutineCompletion", () => {
  it("returns 0 for empty", () => { const r = evaluateRoutineCompletion([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("scores 25 for perfect", () => { const r = evaluateRoutineCompletion(Array.from({ length: 10 }, () => makeRecord())); expect(r.overallScore).toBe(25); expect(r.completionRate).toBe(100); });
  it("counts completed_independently as completed", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ completionStatus: "completed_independently" }));
    expect(evaluateRoutineCompletion(records).completionRate).toBe(100);
  });
  it("counts completed_with_support as completed", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ completionStatus: "completed_with_support" }));
    expect(evaluateRoutineCompletion(records).completionRate).toBe(100);
  });
  it("does not count partially_completed as completed", () => {
    const records = [makeRecord({ completionStatus: "partially_completed" }), makeRecord({ completionStatus: "not_completed" }), makeRecord({ completionStatus: "refused" })];
    expect(evaluateRoutineCompletion(records).completionRate).toBe(0);
  });
  it("mixed completion statuses", () => {
    const records = [makeRecord({ completionStatus: "completed_independently" }), makeRecord({ completionStatus: "completed_with_support" }), makeRecord({ completionStatus: "partially_completed" }), makeRecord({ completionStatus: "not_completed" })];
    expect(evaluateRoutineCompletion(records).completionRate).toBe(50);
  });
  it("calculates on-time rate", () => {
    const records = [makeRecord({ onTimeForSchool: true }), makeRecord({ onTimeForSchool: false })];
    expect(evaluateRoutineCompletion(records).onTimeRate).toBe(50);
  });
  it("calculates breakfast rate", () => {
    const records = [makeRecord({ breakfastEaten: true }), makeRecord({ breakfastEaten: false }), makeRecord({ breakfastEaten: true })];
    expect(evaluateRoutineCompletion(records).breakfastRate).toBe(67);
  });
  it("calculates support documentation rate", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ staffSupported: true, documentedInLog: false }));
    const r = evaluateRoutineCompletion(records);
    expect(r.supportDocumentationRate).toBe(50);
  });
  it("caps at 25", () => { expect(evaluateRoutineCompletion(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25); });
  it("low completion scores tier 1", () => {
    const records = [makeRecord({ completionStatus: "completed_independently" }), ...Array.from({ length: 9 }, () => makeRecord({ completionStatus: "not_completed" }))];
    const r = evaluateRoutineCompletion(records);
    expect(r.completionRate).toBe(10);
  });
  it("40-59 completion tier scores 3", () => {
    const records = [
      ...Array.from({ length: 5 }, () => makeRecord({ completionStatus: "completed_independently" })),
      ...Array.from({ length: 5 }, () => makeRecord({ completionStatus: "not_completed" })),
    ];
    expect(evaluateRoutineCompletion(records).completionRate).toBe(50);
  });
  it("60-79 completion tier", () => {
    const records = [
      ...Array.from({ length: 7 }, () => makeRecord({ completionStatus: "completed_independently" })),
      ...Array.from({ length: 3 }, () => makeRecord({ completionStatus: "not_completed" })),
    ];
    expect(evaluateRoutineCompletion(records).completionRate).toBe(70);
  });
  it("all false booleans still scores on completion", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ onTimeForSchool: false, breakfastEaten: false, staffSupported: false, documentedInLog: false }));
    const r = evaluateRoutineCompletion(records);
    expect(r.overallScore).toBeGreaterThan(0);
  });
});

// =============================================================================
// evaluateWellbeingReadiness
// =============================================================================
describe("evaluateWellbeingReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateWellbeingReadiness([]); expect(r.overallScore).toBe(0); expect(r.moodPositiveRate).toBe(0); });
  it("scores 25 for perfect", () => { const r = evaluateWellbeingReadiness(Array.from({ length: 10 }, () => makeRecord())); expect(r.overallScore).toBe(25); });
  it("calculates mood positive rate", () => {
    const records = [makeRecord({ moodPositive: true }), makeRecord({ moodPositive: false })];
    expect(evaluateWellbeingReadiness(records).moodPositiveRate).toBe(50);
  });
  it("calculates parent informed rate", () => {
    const records = [makeRecord({ parentCarerInformed: true }), makeRecord({ parentCarerInformed: false }), makeRecord({ parentCarerInformed: true })];
    expect(evaluateWellbeingReadiness(records).parentInformedRate).toBe(67);
  });
  it("counts only completed_independently for independent rate", () => {
    const records = [makeRecord({ completionStatus: "completed_independently" }), makeRecord({ completionStatus: "completed_with_support" }), makeRecord({ completionStatus: "completed_independently" })];
    expect(evaluateWellbeingReadiness(records).independentCompletionRate).toBe(67);
  });
  it("does not count completed_with_support as independent", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ completionStatus: "completed_with_support" }));
    expect(evaluateWellbeingReadiness(records).independentCompletionRate).toBe(0);
  });
  it("all negative scores some points", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ moodPositive: false, parentCarerInformed: false, completionStatus: "not_completed" }));
    expect(evaluateWellbeingReadiness(records).overallScore).toBe(0);
  });
  it("caps at 25", () => { expect(evaluateWellbeingReadiness(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25); });
  it("mood 90+ scores 8", () => {
    const records = Array.from({ length: 10 }, () => makeRecord({ moodPositive: true }));
    const r = evaluateWellbeingReadiness(records);
    expect(r.moodPositiveRate).toBe(100);
  });
  it("mood 70-89 tier", () => {
    const records = [...Array.from({ length: 8 }, () => makeRecord({ moodPositive: true })), ...Array.from({ length: 2 }, () => makeRecord({ moodPositive: false }))];
    expect(evaluateWellbeingReadiness(records).moodPositiveRate).toBe(80);
  });
  it("mood 50-69 tier", () => {
    const records = [...Array.from({ length: 6 }, () => makeRecord({ moodPositive: true })), ...Array.from({ length: 4 }, () => makeRecord({ moodPositive: false }))];
    expect(evaluateWellbeingReadiness(records).moodPositiveRate).toBe(60);
  });
  it("parent informed 90+ scores 9", () => {
    const records = Array.from({ length: 10 }, () => makeRecord({ parentCarerInformed: true }));
    expect(evaluateWellbeingReadiness(records).parentInformedRate).toBe(100);
  });
  it("independent 50-69 tier", () => {
    const records = [...Array.from({ length: 6 }, () => makeRecord({ completionStatus: "completed_independently" })), ...Array.from({ length: 4 }, () => makeRecord({ completionStatus: "completed_with_support" }))];
    expect(evaluateWellbeingReadiness(records).independentCompletionRate).toBe(60);
  });
});

// =============================================================================
// evaluateMorningPolicy
// =============================================================================
describe("evaluateMorningPolicy", () => {
  it("returns 0 for null", () => { const r = evaluateMorningPolicy(null); expect(r.overallScore).toBe(0); expect(r.morningRoutinePolicy).toBe(false); });
  it("scores 25 for full policy", () => { expect(evaluateMorningPolicy(makePolicy()).overallScore).toBe(25); });
  it("morningRoutinePolicy alone = 4", () => {
    expect(evaluateMorningPolicy(makePolicy({ morningRoutinePolicy: true, breakfastStandards: false, schoolReadinessProtocol: false, punctualityTracking: false, individualRoutinePlans: false, staffHandoverProcess: false, regularReview: false })).overallScore).toBe(4);
  });
  it("breakfastStandards alone = 4", () => {
    expect(evaluateMorningPolicy(makePolicy({ morningRoutinePolicy: false, breakfastStandards: true, schoolReadinessProtocol: false, punctualityTracking: false, individualRoutinePlans: false, staffHandoverProcess: false, regularReview: false })).overallScore).toBe(4);
  });
  it("schoolReadinessProtocol alone = 4", () => {
    expect(evaluateMorningPolicy(makePolicy({ morningRoutinePolicy: false, breakfastStandards: false, schoolReadinessProtocol: true, punctualityTracking: false, individualRoutinePlans: false, staffHandoverProcess: false, regularReview: false })).overallScore).toBe(4);
  });
  it("punctualityTracking alone = 4", () => {
    expect(evaluateMorningPolicy(makePolicy({ morningRoutinePolicy: false, breakfastStandards: false, schoolReadinessProtocol: false, punctualityTracking: true, individualRoutinePlans: false, staffHandoverProcess: false, regularReview: false })).overallScore).toBe(4);
  });
  it("individualRoutinePlans alone = 3", () => {
    expect(evaluateMorningPolicy(makePolicy({ morningRoutinePolicy: false, breakfastStandards: false, schoolReadinessProtocol: false, punctualityTracking: false, individualRoutinePlans: true, staffHandoverProcess: false, regularReview: false })).overallScore).toBe(3);
  });
  it("staffHandoverProcess alone = 3", () => {
    expect(evaluateMorningPolicy(makePolicy({ morningRoutinePolicy: false, breakfastStandards: false, schoolReadinessProtocol: false, punctualityTracking: false, individualRoutinePlans: false, staffHandoverProcess: true, regularReview: false })).overallScore).toBe(3);
  });
  it("regularReview alone = 3", () => {
    expect(evaluateMorningPolicy(makePolicy({ morningRoutinePolicy: false, breakfastStandards: false, schoolReadinessProtocol: false, punctualityTracking: false, individualRoutinePlans: false, staffHandoverProcess: false, regularReview: true })).overallScore).toBe(3);
  });
  it("4-point items = 16", () => {
    expect(evaluateMorningPolicy(makePolicy({ individualRoutinePlans: false, staffHandoverProcess: false, regularReview: false })).overallScore).toBe(16);
  });
  it("3-point items = 9", () => {
    expect(evaluateMorningPolicy(makePolicy({ morningRoutinePolicy: false, breakfastStandards: false, schoolReadinessProtocol: false, punctualityTracking: false })).overallScore).toBe(9);
  });
  it("all false = 0", () => {
    expect(evaluateMorningPolicy(makePolicy({ morningRoutinePolicy: false, breakfastStandards: false, schoolReadinessProtocol: false, punctualityTracking: false, individualRoutinePlans: false, staffHandoverProcess: false, regularReview: false })).overallScore).toBe(0);
  });
  it("returns boolean values in result", () => {
    const p = makePolicy({ morningRoutinePolicy: true, breakfastStandards: false });
    const r = evaluateMorningPolicy(p);
    expect(r.morningRoutinePolicy).toBe(true);
    expect(r.breakfastStandards).toBe(false);
  });
});

// =============================================================================
// evaluateStaffMorningReadiness
// =============================================================================
describe("evaluateStaffMorningReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateStaffMorningReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("scores 25 for fully trained", () => { expect(evaluateStaffMorningReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25); });
  it("scores 0 for untrained staff", () => {
    expect(evaluateStaffMorningReadiness([makeTraining({ morningRoutineManagement: false, breakfastNutrition: false, emotionalRegulation: false, timeManagement: false, schoolLiaison: false, handoverPractice: false })]).overallScore).toBe(0);
  });
  it("single fully trained = 25", () => { expect(evaluateStaffMorningReadiness([makeTraining()]).overallScore).toBe(25); });
  it("caps at 25", () => { expect(evaluateStaffMorningReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25); });
  it("morningRoutineManagement weight = 6", () => {
    const t = [makeTraining({ breakfastNutrition: false, emotionalRegulation: false, timeManagement: false, schoolLiaison: false, handoverPractice: false })];
    expect(evaluateStaffMorningReadiness(t).overallScore).toBe(6);
  });
  it("breakfastNutrition weight = 5", () => {
    const t = [makeTraining({ morningRoutineManagement: false, emotionalRegulation: false, timeManagement: false, schoolLiaison: false, handoverPractice: false })];
    expect(evaluateStaffMorningReadiness(t).overallScore).toBe(5);
  });
  it("emotionalRegulation weight = 5", () => {
    const t = [makeTraining({ morningRoutineManagement: false, breakfastNutrition: false, timeManagement: false, schoolLiaison: false, handoverPractice: false })];
    expect(evaluateStaffMorningReadiness(t).overallScore).toBe(5);
  });
  it("timeManagement weight = 4", () => {
    const t = [makeTraining({ morningRoutineManagement: false, breakfastNutrition: false, emotionalRegulation: false, schoolLiaison: false, handoverPractice: false })];
    expect(evaluateStaffMorningReadiness(t).overallScore).toBe(4);
  });
  it("schoolLiaison weight = 3", () => {
    const t = [makeTraining({ morningRoutineManagement: false, breakfastNutrition: false, emotionalRegulation: false, timeManagement: false, handoverPractice: false })];
    expect(evaluateStaffMorningReadiness(t).overallScore).toBe(3);
  });
  it("handoverPractice weight = 2", () => {
    const t = [makeTraining({ morningRoutineManagement: false, breakfastNutrition: false, emotionalRegulation: false, timeManagement: false, schoolLiaison: false })];
    expect(evaluateStaffMorningReadiness(t).overallScore).toBe(2);
  });
  it("returns total staff count", () => {
    expect(evaluateStaffMorningReadiness(Array.from({ length: 3 }, () => makeTraining())).totalStaff).toBe(3);
  });
  it("calculates individual rates correctly", () => {
    const t = [makeTraining({ morningRoutineManagement: true }), makeTraining({ morningRoutineManagement: false })];
    expect(evaluateStaffMorningReadiness(t).morningRoutineManagementRate).toBe(50);
  });
  it("70-89 tier scores mid points", () => {
    const t = [
      makeTraining({ morningRoutineManagement: true }),
      makeTraining({ morningRoutineManagement: true }),
      makeTraining({ morningRoutineManagement: true }),
      makeTraining({ morningRoutineManagement: false }),
    ];
    const r = evaluateStaffMorningReadiness(t);
    expect(r.morningRoutineManagementRate).toBe(75);
  });
});

// =============================================================================
// buildChildMorningProfiles
// =============================================================================
describe("buildChildMorningProfiles", () => {
  it("returns empty for no records", () => { expect(buildChildMorningProfiles([]).length).toBe(0); });
  it("groups by child", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex" }), makeRecord({ childId: "c2", childName: "Jordan" })];
    const profiles = buildChildMorningProfiles(records);
    expect(profiles.length).toBe(2);
  });
  it("calculates completion rate", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex", completionStatus: "completed_independently" }), makeRecord({ childId: "c1", childName: "Alex", completionStatus: "not_completed" })];
    expect(buildChildMorningProfiles(records)[0].completionRate).toBe(50);
  });
  it("calculates on-time rate", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex", onTimeForSchool: true }), makeRecord({ childId: "c1", childName: "Alex", onTimeForSchool: false })];
    expect(buildChildMorningProfiles(records)[0].onTimeRate).toBe(50);
  });
  it("calculates breakfast rate", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex", breakfastEaten: true }), makeRecord({ childId: "c1", childName: "Alex", breakfastEaten: false })];
    expect(buildChildMorningProfiles(records)[0].breakfastRate).toBe(50);
  });
  it("caps at 10", () => {
    const records = Array.from({ length: 15 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    expect(buildChildMorningProfiles(records)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("perfect profile = 10", () => {
    const records = Array.from({ length: 10 }, () => makeRecord({ childId: "c1", childName: "Alex", completionStatus: "completed_independently", onTimeForSchool: true, breakfastEaten: true }));
    expect(buildChildMorningProfiles(records)[0].overallScore).toBe(10);
  });
  it("frequency score: 10+ records = 2", () => {
    const records = Array.from({ length: 10 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    expect(buildChildMorningProfiles(records)[0].overallScore).toBe(10);
  });
  it("frequency score: 5-9 records = 1", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    const profile = buildChildMorningProfiles(records)[0];
    expect(profile.totalRecords).toBe(5);
    expect(profile.overallScore).toBe(9);
  });
  it("frequency score: <5 records = 0", () => {
    const records = Array.from({ length: 3 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    const profile = buildChildMorningProfiles(records)[0];
    expect(profile.totalRecords).toBe(3);
    expect(profile.overallScore).toBe(8);
  });
  it("low completion = lower score", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ childId: "c1", childName: "Alex", completionStatus: "not_completed", onTimeForSchool: false, breakfastEaten: false }));
    expect(buildChildMorningProfiles(records)[0].overallScore).toBe(1);
  });
  it("minimum score is 0", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex", completionStatus: "not_completed", onTimeForSchool: false, breakfastEaten: false })];
    expect(buildChildMorningProfiles(records)[0].overallScore).toBe(0);
  });
  it("multiple children aggregated independently", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex", onTimeForSchool: true }),
      makeRecord({ childId: "c1", childName: "Alex", onTimeForSchool: false }),
      makeRecord({ childId: "c2", childName: "Jordan", onTimeForSchool: true }),
    ];
    const profiles = buildChildMorningProfiles(records);
    expect(profiles.find((p) => p.childId === "c1")?.onTimeRate).toBe(50);
    expect(profiles.find((p) => p.childId === "c2")?.onTimeRate).toBe(100);
  });
});

// =============================================================================
// generateMorningRoutinePreparationIntelligence
// =============================================================================
describe("generateMorningRoutinePreparationIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-19" };

  it("returns inadequate for empty", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const r = generateMorningRoutinePreparationIntelligence(Array.from({ length: 10 }, () => makeRecord()), makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const r = generateMorningRoutinePreparationIntelligence(Array.from({ length: 20 }, () => makeRecord()), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01"); expect(r.periodEnd).toBe("2026-06-30");
  });
  it("generates strength for completion rate >= 80%", () => {
    const r = generateMorningRoutinePreparationIntelligence(Array.from({ length: 5 }, () => makeRecord()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("completing morning routine"))).toBe(true);
  });
  it("generates strength for punctuality >= 80%", () => {
    const r = generateMorningRoutinePreparationIntelligence(Array.from({ length: 5 }, () => makeRecord({ onTimeForSchool: true })), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("punctuality"))).toBe(true);
  });
  it("generates strength for breakfast >= 80%", () => {
    const r = generateMorningRoutinePreparationIntelligence(Array.from({ length: 5 }, () => makeRecord({ breakfastEaten: true })), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("nutritional") || s.includes("breakfast"))).toBe(true);
  });
  it("generates action for no records", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No morning routine records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
  });
  it("includes CHR 2015 Regulation 8", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("Regulation 8"))).toBe(true);
  });
  it("includes CHR 2015 Regulation 10", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("Regulation 10"))).toBe(true);
  });
  it("includes SCCIF", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });
  it("includes NMS 6", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 6"))).toBe(true);
  });
  it("includes Children Act 1989", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });
  it("includes UNCRC Article 28", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 28"))).toBe(true);
  });
  it("includes Ofsted ILACS", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.some((l) => l.includes("Ofsted ILACS"))).toBe(true);
  });
  it("good rating for records + training but no policy", () => {
    const r = generateMorningRoutinePreparationIntelligence(Array.from({ length: 5 }, () => makeRecord()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(75); expect(r.rating).toBe("good");
  });
  it("area for improvement when on-time < 60%", () => {
    const records = [
      ...Array.from({ length: 4 }, () => makeRecord({ onTimeForSchool: false })),
      makeRecord({ onTimeForSchool: true }),
    ];
    const r = generateMorningRoutinePreparationIntelligence(records, null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("punctuality"))).toBe(true);
  });
  it("area for improvement when breakfast < 60%", () => {
    const records = [
      ...Array.from({ length: 4 }, () => makeRecord({ breakfastEaten: false })),
      makeRecord({ breakfastEaten: true }),
    ];
    const r = generateMorningRoutinePreparationIntelligence(records, null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("Breakfast") || a.includes("breakfast"))).toBe(true);
  });
  it("includes child profiles", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex" }), makeRecord({ childId: "c2", childName: "Jordan" })];
    const r = generateMorningRoutinePreparationIntelligence(records, null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.childProfiles.length).toBe(2);
  });
  it("no strength for completion when records empty", () => {
    const r = generateMorningRoutinePreparationIntelligence([], makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("completing morning routine"))).toBe(false);
  });
  it("no area for improvement when records empty", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.length).toBe(0);
  });
  it("strength for mood when >= 90%", () => {
    const records = Array.from({ length: 10 }, () => makeRecord({ moodPositive: true }));
    const r = generateMorningRoutinePreparationIntelligence(records, null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("positive emotional"))).toBe(true);
  });
  it("strength for staff training", () => {
    const r = generateMorningRoutinePreparationIntelligence([], null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("trained") && s.includes("morning routine"))).toBe(true);
  });
  it("strength for individual routine plans", () => {
    const r = generateMorningRoutinePreparationIntelligence([], makePolicy({ individualRoutinePlans: true }), [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("Individual morning routine plans"))).toBe(true);
  });
  it("no URGENT actions when policy and training present", () => {
    const r = generateMorningRoutinePreparationIntelligence(Array.from({ length: 5 }, () => makeRecord()), makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.filter((a) => a.startsWith("URGENT")).length).toBe(0);
  });
});
