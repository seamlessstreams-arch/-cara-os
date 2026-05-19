import { describe, it, expect } from "vitest";
import {
  generateSleepRoutineQualityIntelligence, evaluateSleepQuality, evaluateBedtimeRoutine,
  evaluateSleepPolicy, evaluateStaffSleepReadiness, buildChildSleepProfiles, pct, getRating,
  getSleepQualityLabel, getRoutineAdherenceLabel, getNightIssueLabel, getRatingLabel,
} from "../sleep-routine-quality-engine";
import type { SleepRecord, SleepPolicy, StaffSleepTraining } from "../sleep-routine-quality-engine";

let _id = 0;
function makeRecord(overrides: Partial<SleepRecord> = {}): SleepRecord {
  _id++;
  return { id: `sr-${_id}`, childId: "child-a", childName: "Alex", recordDate: "2026-04-01", sleepQuality: "good", hoursSlept: 9, routineAdherence: "fully_followed", nightIssue: "none", windDownCompleted: true, screenFreeBeforeBed: true, environmentComfortable: true, childSatisfied: true, staffNightCheckCompleted: true, recordedTimely: true, ...overrides };
}
function makePolicy(overrides: Partial<SleepPolicy> = {}): SleepPolicy {
  return { id: "sp-1", bedtimeRoutinePolicy: true, individualSleepPlans: true, screenTimeLimits: true, sleepEnvironmentStandards: true, nightStaffProtocol: true, sleepHygieneEducation: true, regularSleepReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffSleepTraining> = {}): StaffSleepTraining {
  _tid++;
  return { id: `st-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, sleepHygiene: true, bedtimeRoutines: true, nightSupport: true, sleepDisorders: true, screenTimeManagement: true, environmentalFactors: true, ...overrides };
}

describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(0, 0)).toBe(0); });
  it("returns 100 for equal", () => { expect(pct(5, 5)).toBe(100); });
  it("returns 0 for num=0", () => { expect(pct(0, 10)).toBe(0); });
});

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

describe("label getters", () => {
  it("getSleepQualityLabel", () => { expect(getSleepQualityLabel("excellent")).toBe("Excellent"); expect(getSleepQualityLabel("very_poor")).toBe("Very Poor"); });
  it("getRoutineAdherenceLabel", () => { expect(getRoutineAdherenceLabel("fully_followed")).toBe("Fully Followed"); expect(getRoutineAdherenceLabel("not_followed")).toBe("Not Followed"); });
  it("getNightIssueLabel", () => { expect(getNightIssueLabel("nightmares")).toBe("Nightmares"); expect(getNightIssueLabel("none")).toBe("None"); expect(getNightIssueLabel("screen_use")).toBe("Screen Use"); });
  it("getRatingLabel", () => { expect(getRatingLabel("outstanding")).toBe("Outstanding"); expect(getRatingLabel("inadequate")).toBe("Inadequate"); });
});

describe("evaluateSleepQuality", () => {
  it("returns 0 for empty", () => { const r = evaluateSleepQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("scores 25 for perfect", () => { const r = evaluateSleepQuality(Array.from({ length: 10 }, () => makeRecord())); expect(r.overallScore).toBe(25); expect(r.goodSleepRate).toBe(100); });
  it("counts excellent+good as good sleep", () => {
    const records = [makeRecord({ sleepQuality: "excellent" }), makeRecord({ sleepQuality: "good" }), makeRecord({ sleepQuality: "fair" }), makeRecord({ sleepQuality: "poor" }), makeRecord({ sleepQuality: "very_poor" })];
    expect(evaluateSleepQuality(records).goodSleepRate).toBe(40);
  });
  it("scores night issue rate inversely", () => {
    const noIssues = Array.from({ length: 5 }, () => makeRecord({ nightIssue: "none" }));
    expect(evaluateSleepQuality(noIssues).nightIssueRate).toBe(0);
    const allIssues = Array.from({ length: 5 }, () => makeRecord({ nightIssue: "nightmares" }));
    expect(evaluateSleepQuality(allIssues).nightIssueRate).toBe(100);
  });
  it("calculates average hours", () => {
    const records = [makeRecord({ hoursSlept: 8 }), makeRecord({ hoursSlept: 10 })];
    expect(evaluateSleepQuality(records).averageHours).toBe(9);
  });
  it("scores combined night check + timely", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ staffNightCheckCompleted: true, recordedTimely: false }));
    const r = evaluateSleepQuality(records);
    expect(r.overallScore).toBeGreaterThan(0);
  });
  it("caps at 25", () => { expect(evaluateSleepQuality(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25); });
});

describe("evaluateBedtimeRoutine", () => {
  it("returns 0 for empty", () => { const r = evaluateBedtimeRoutine([]); expect(r.overallScore).toBe(0); });
  it("scores 25 for perfect", () => { const r = evaluateBedtimeRoutine(Array.from({ length: 10 }, () => makeRecord())); expect(r.overallScore).toBe(25); });
  it("counts fully+mostly as adherent", () => {
    const records = [makeRecord({ routineAdherence: "fully_followed" }), makeRecord({ routineAdherence: "mostly_followed" }), makeRecord({ routineAdherence: "partially_followed" }), makeRecord({ routineAdherence: "not_followed" })];
    expect(evaluateBedtimeRoutine(records).routineAdherenceRate).toBe(50);
  });
  it("scores wind-down rate", () => {
    const records = [makeRecord({ windDownCompleted: true }), makeRecord({ windDownCompleted: false })];
    expect(evaluateBedtimeRoutine(records).windDownRate).toBe(50);
  });
  it("scores screen-free rate", () => {
    const records = [makeRecord({ screenFreeBeforeBed: true }), makeRecord({ screenFreeBeforeBed: false })];
    expect(evaluateBedtimeRoutine(records).screenFreeRate).toBe(50);
  });
  it("scores environment rate", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ environmentComfortable: true }));
    expect(evaluateBedtimeRoutine(records).environmentRate).toBe(100);
  });
  it("caps at 25", () => { expect(evaluateBedtimeRoutine(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25); });
});

describe("evaluateSleepPolicy", () => {
  it("returns 0 for null", () => { const r = evaluateSleepPolicy(null); expect(r.overallScore).toBe(0); expect(r.bedtimeRoutinePolicy).toBe(false); });
  it("scores 25 for full policy", () => { expect(evaluateSleepPolicy(makePolicy()).overallScore).toBe(25); });
  it("scores individual weights", () => {
    expect(evaluateSleepPolicy(makePolicy({ bedtimeRoutinePolicy: true, individualSleepPlans: false, screenTimeLimits: false, sleepEnvironmentStandards: false, nightStaffProtocol: false, sleepHygieneEducation: false, regularSleepReview: false })).overallScore).toBe(4);
    expect(evaluateSleepPolicy(makePolicy({ bedtimeRoutinePolicy: false, individualSleepPlans: false, screenTimeLimits: false, sleepEnvironmentStandards: false, nightStaffProtocol: true, sleepHygieneEducation: false, regularSleepReview: false })).overallScore).toBe(3);
  });
  it("4-point items = 16", () => {
    expect(evaluateSleepPolicy(makePolicy({ nightStaffProtocol: false, sleepHygieneEducation: false, regularSleepReview: false })).overallScore).toBe(16);
  });
  it("3-point items = 9", () => {
    expect(evaluateSleepPolicy(makePolicy({ bedtimeRoutinePolicy: false, individualSleepPlans: false, screenTimeLimits: false, sleepEnvironmentStandards: false })).overallScore).toBe(9);
  });
  it("all false = 0", () => {
    expect(evaluateSleepPolicy(makePolicy({ bedtimeRoutinePolicy: false, individualSleepPlans: false, screenTimeLimits: false, sleepEnvironmentStandards: false, nightStaffProtocol: false, sleepHygieneEducation: false, regularSleepReview: false })).overallScore).toBe(0);
  });
});

describe("evaluateStaffSleepReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateStaffSleepReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("scores 25 for fully trained", () => { expect(evaluateStaffSleepReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25); });
  it("scores 0 for untrained staff", () => {
    expect(evaluateStaffSleepReadiness([makeTraining({ sleepHygiene: false, bedtimeRoutines: false, nightSupport: false, sleepDisorders: false, screenTimeManagement: false, environmentalFactors: false })]).overallScore).toBe(0);
  });
  it("single fully trained = 25", () => { expect(evaluateStaffSleepReadiness([makeTraining()]).overallScore).toBe(25); });
  it("caps at 25", () => { expect(evaluateStaffSleepReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25); });
});

describe("buildChildSleepProfiles", () => {
  it("returns empty for no records", () => { expect(buildChildSleepProfiles([]).length).toBe(0); });
  it("groups by child", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex" }), makeRecord({ childId: "c2", childName: "Jordan" })];
    const profiles = buildChildSleepProfiles(records);
    expect(profiles.length).toBe(2);
  });
  it("calculates good sleep rate", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex", sleepQuality: "excellent" }), makeRecord({ childId: "c1", childName: "Alex", sleepQuality: "poor" })];
    expect(buildChildSleepProfiles(records)[0].goodSleepRate).toBe(50);
  });
  it("calculates average hours", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex", hoursSlept: 8 }), makeRecord({ childId: "c1", childName: "Alex", hoursSlept: 10 })];
    expect(buildChildSleepProfiles(records)[0].averageHours).toBe(9);
  });
  it("calculates routine adherence rate", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex", routineAdherence: "fully_followed" }), makeRecord({ childId: "c1", childName: "Alex", routineAdherence: "not_followed" })];
    expect(buildChildSleepProfiles(records)[0].routineAdherenceRate).toBe(50);
  });
  it("caps at 10", () => {
    const records = Array.from({ length: 15 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    expect(buildChildSleepProfiles(records)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("perfect profile = 10", () => {
    const records = Array.from({ length: 10 }, () => makeRecord({ childId: "c1", childName: "Alex", sleepQuality: "excellent", hoursSlept: 9, routineAdherence: "fully_followed" }));
    expect(buildChildSleepProfiles(records)[0].overallScore).toBe(10);
  });
});

describe("generateSleepRoutineQualityIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-19" };

  it("returns inadequate for empty", () => {
    const r = generateSleepRoutineQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const r = generateSleepRoutineQualityIntelligence(Array.from({ length: 10 }, () => makeRecord()), makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const r = generateSleepRoutineQualityIntelligence(Array.from({ length: 20 }, () => makeRecord()), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generateSleepRoutineQualityIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01"); expect(r.periodEnd).toBe("2026-06-30");
  });
  it("generates strengths for good sleep", () => {
    const r = generateSleepRoutineQualityIntelligence(Array.from({ length: 5 }, () => makeRecord({ sleepQuality: "excellent" })), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("sleep quality"))).toBe(true);
  });
  it("generates strength for routine adherence", () => {
    const r = generateSleepRoutineQualityIntelligence(Array.from({ length: 5 }, () => makeRecord({ routineAdherence: "fully_followed" })), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("routines"))).toBe(true);
  });
  it("generates action for no records", () => {
    const r = generateSleepRoutineQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No sleep records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generateSleepRoutineQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generateSleepRoutineQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generateSleepRoutineQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("NICE NG10"))).toBe(true);
  });
  it("good rating for 75", () => {
    const r = generateSleepRoutineQualityIntelligence(Array.from({ length: 5 }, () => makeRecord()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(75); expect(r.rating).toBe("good");
  });
});
