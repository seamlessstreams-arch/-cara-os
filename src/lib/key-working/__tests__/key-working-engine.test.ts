import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getKeyWorkingCategoryLabel,
  getKeyWorkingOutcomeLabel,
  getRatingLabel,
  evaluateKeyWorkingQuality,
  evaluateKeyWorkingCompliance,
  evaluateKeyWorkingPolicy,
  evaluateStaffKeyWorkingReadiness,
  buildChildKeyWorkingProfiles,
  generateKeyWorkingIntelligence,
} from "../key-working-engine";
import type {
  KeyWorkingRecord,
  KeyWorkingPolicy,
  StaffKeyWorkingTraining,
} from "../key-working-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<KeyWorkingRecord> = {}): KeyWorkingRecord {
  return {
    id: "rec-1",
    homeId: "home-oak",
    date: "2026-03-15",
    childId: "child-1",
    childName: "Test Child",
    category: "formal_keywork",
    outcome: "completed",
    childEngaged: true,
    childViewRecorded: true,
    goalsAddressed: true,
    moodImproved: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<KeyWorkingPolicy> = {}): KeyWorkingPolicy {
  return {
    keyWorkingPolicy: true,
    sessionFrequencyGuidance: true,
    childParticipationFramework: true,
    carePlanLinkagePolicy: true,
    supervisionOfKeywork: true,
    keyworkerAllocationPolicy: true,
    recordKeepingStandard: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffKeyWorkingTraining> = {}): StaffKeyWorkingTraining {
  return {
    staffId: "staff-1",
    relationshipBuilding: true,
    therapeuticApproaches: true,
    childVoiceCapture: true,
    carePlanKnowledge: true,
    recordKeeping: true,
    crisisSupport: true,
    ...overrides,
  };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => { expect(pct(5, 0)).toBe(0); });
  it("returns 100 for equal num and den", () => { expect(pct(10, 10)).toBe(100); });
  it("returns 50 for half", () => { expect(pct(5, 10)).toBe(50); });
  it("rounds to nearest integer", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
  it("returns 0 for 0 numerator", () => { expect(pct(0, 10)).toBe(0); });
});

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ── Label Helpers ──────────────────────────────────────────────────────────

describe("getKeyWorkingCategoryLabel", () => {
  it("returns human-readable labels", () => {
    expect(getKeyWorkingCategoryLabel("formal_keywork")).toBe("Formal Keywork");
    expect(getKeyWorkingCategoryLabel("informal_check_in")).toBe("Informal Check-in");
    expect(getKeyWorkingCategoryLabel("direct_work")).toBe("Direct Work");
    expect(getKeyWorkingCategoryLabel("life_story_work")).toBe("Life Story Work");
    expect(getKeyWorkingCategoryLabel("goal_review")).toBe("Goal Review");
    expect(getKeyWorkingCategoryLabel("crisis_support")).toBe("Crisis Support");
    expect(getKeyWorkingCategoryLabel("preparation_session")).toBe("Preparation Session");
    expect(getKeyWorkingCategoryLabel("celebration_session")).toBe("Celebration Session");
  });
});

describe("getKeyWorkingOutcomeLabel", () => {
  it("returns human-readable labels", () => {
    expect(getKeyWorkingOutcomeLabel("completed")).toBe("Completed");
    expect(getKeyWorkingOutcomeLabel("partially_completed")).toBe("Partially Completed");
    expect(getKeyWorkingOutcomeLabel("child_declined")).toBe("Child Declined");
    expect(getKeyWorkingOutcomeLabel("postponed")).toBe("Postponed");
    expect(getKeyWorkingOutcomeLabel("cancelled")).toBe("Cancelled");
  });
});

describe("getRatingLabel", () => {
  it("formats rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── Evaluator 1: Key-Working Quality ───────────────────────────────────────

describe("evaluateKeyWorkingQuality", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateKeyWorkingQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalRecords).toBe(0);
    expect(result.childEngagedRate).toBe(0);
  });

  it("returns max score for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" })];
    const result = evaluateKeyWorkingQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalRecords).toBe(2);
    expect(result.childEngagedRate).toBe(100);
    expect(result.childViewRecordedRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({ childEngaged: false, childViewRecorded: false, goalsAddressed: false, moodImproved: false })];
    const result = evaluateKeyWorkingQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("calculates mixed rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", childEngaged: true, childViewRecorded: false, goalsAddressed: true, moodImproved: false }),
      makeRecord({ id: "r2", childEngaged: true, childViewRecorded: true, goalsAddressed: false, moodImproved: false }),
    ];
    const result = evaluateKeyWorkingQuality(records);
    expect(result.childEngagedRate).toBe(100);
    expect(result.childViewRecordedRate).toBe(50);
    expect(result.goalsAddressedRate).toBe(50);
    expect(result.moodImprovedRate).toBe(0);
  });

  it("applies correct weights (7+6+6+6=25)", () => {
    const records = [makeRecord({ childViewRecorded: false, goalsAddressed: false, moodImproved: false })];
    const result = evaluateKeyWorkingQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("caps score at 25", () => {
    const result = evaluateKeyWorkingQuality([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("single record with only childViewRecorded gives weight-6 score", () => {
    const records = [makeRecord({ childEngaged: false, goalsAddressed: false, moodImproved: false })];
    const result = evaluateKeyWorkingQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("handles large record sets", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childEngaged: i % 2 === 0 }),
    );
    const result = evaluateKeyWorkingQuality(records);
    expect(result.childEngagedRate).toBe(50);
    expect(result.totalRecords).toBe(100);
  });

  it("rating maps correctly for low score", () => {
    const records = [makeRecord({ childEngaged: false, childViewRecorded: false, goalsAddressed: false, moodImproved: false })];
    const result = evaluateKeyWorkingQuality(records);
    expect(result.rating).toBe("inadequate");
  });

  it("only moodImproved true gives weight-6 score", () => {
    const records = [makeRecord({ childEngaged: false, childViewRecorded: false, goalsAddressed: false, moodImproved: true })];
    const result = evaluateKeyWorkingQuality(records);
    expect(result.overallScore).toBe(6);
  });
});

// ── Evaluator 2: Key-Working Compliance ────────────────────────────────────

describe("evaluateKeyWorkingCompliance", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateKeyWorkingCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.documentationRate).toBe(0);
  });

  it("calculates documentation and timely rates", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "r2", documentationComplete: true, timelyRecording: false }),
      makeRecord({ id: "r3", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluateKeyWorkingCompliance(records);
    expect(result.documentationRate).toBe(67);
    expect(result.timelyRecordingRate).toBe(33);
  });

  it("calculates category diversity correctly", () => {
    const records = [makeRecord({ category: "formal_keywork" })];
    const result = evaluateKeyWorkingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(13);
  });

  it("returns high diversity for many categories", () => {
    const categories: Array<KeyWorkingRecord["category"]> = [
      "formal_keywork", "informal_check_in", "direct_work", "life_story_work",
      "goal_review", "crisis_support", "preparation_session", "celebration_session",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateKeyWorkingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("applies correct weights (8+7+5+5=25)", () => {
    const categories: Array<KeyWorkingRecord["category"]> = [
      "formal_keywork", "informal_check_in", "direct_work", "life_story_work",
      "goal_review", "crisis_support", "preparation_session", "celebration_session",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateKeyWorkingCompliance(records);
    expect(result.overallScore).toBe(25);
  });

  it("two categories gives 25% diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "formal_keywork" }),
      makeRecord({ id: "r2", category: "direct_work" }),
    ];
    const result = evaluateKeyWorkingCompliance(records);
    expect(result.categoryDiversityRatio).toBe(25);
  });

  it("all compliance false with single category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, childViewRecorded: false })];
    const result = evaluateKeyWorkingCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.overallScore).toBe(1); // only diversity 13% x 5 = 0.65 -> 1
  });

  it("childViewRecordedRate contributes to compliance score", () => {
    const records = [makeRecord({ id: "r1", documentationComplete: false, timelyRecording: false, childViewRecorded: true })];
    const result = evaluateKeyWorkingCompliance(records);
    expect(result.childViewRecordedRate).toBe(100);
    // childViewRecorded(5) + diversity 13% x 5 = 5 + 0.65 -> 6
    expect(result.overallScore).toBe(6);
  });

  it("returns correct rating for mid-range score", () => {
    const records = [
      makeRecord({ id: "r1", category: "formal_keywork", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "r2", category: "direct_work", documentationComplete: true, timelyRecording: false, childViewRecorded: false }),
    ];
    const result = evaluateKeyWorkingCompliance(records);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── Evaluator 3: Key-Working Policy ────────────────────────────────────────

describe("evaluateKeyWorkingPolicy", () => {
  it("returns zeros for null policy", () => {
    const result = evaluateKeyWorkingPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.keyWorkingPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateKeyWorkingPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateKeyWorkingPolicy(makePolicy({
      keyWorkingPolicy: false, sessionFrequencyGuidance: false, childParticipationFramework: false,
      carePlanLinkagePolicy: false, supervisionOfKeywork: false, keyworkerAllocationPolicy: false, recordKeepingStandard: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("weights first 4 at 4 points each", () => {
    const result = evaluateKeyWorkingPolicy(makePolicy({
      keyWorkingPolicy: true, sessionFrequencyGuidance: false, childParticipationFramework: false,
      carePlanLinkagePolicy: false, supervisionOfKeywork: false, keyworkerAllocationPolicy: false, recordKeepingStandard: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    const result = evaluateKeyWorkingPolicy(makePolicy({
      keyWorkingPolicy: false, sessionFrequencyGuidance: false, childParticipationFramework: false,
      carePlanLinkagePolicy: false, supervisionOfKeywork: true, keyworkerAllocationPolicy: true, recordKeepingStandard: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("handles partial policy (first 4 only = 16)", () => {
    const result = evaluateKeyWorkingPolicy(makePolicy({
      supervisionOfKeywork: false, keyworkerAllocationPolicy: false, recordKeepingStandard: false,
    }));
    expect(result.overallScore).toBe(16);
    expect(result.rating).toBe("good");
  });

  it("preserves boolean values in result", () => {
    const result = evaluateKeyWorkingPolicy(makePolicy({ keyWorkingPolicy: true, sessionFrequencyGuidance: false }));
    expect(result.keyWorkingPolicy).toBe(true);
    expect(result.sessionFrequencyGuidance).toBe(false);
  });

  it("single middle policy gives 4 points", () => {
    const result = evaluateKeyWorkingPolicy(makePolicy({
      keyWorkingPolicy: false, sessionFrequencyGuidance: false, childParticipationFramework: true,
      carePlanLinkagePolicy: false, supervisionOfKeywork: false, keyworkerAllocationPolicy: false, recordKeepingStandard: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("rating for score 9 -> 36 -> inadequate", () => {
    const result = evaluateKeyWorkingPolicy(makePolicy({
      keyWorkingPolicy: false, sessionFrequencyGuidance: false, childParticipationFramework: false,
      carePlanLinkagePolicy: false, supervisionOfKeywork: true, keyworkerAllocationPolicy: true, recordKeepingStandard: true,
    }));
    expect(result.overallScore).toBe(9);
    expect(result.rating).toBe("inadequate");
  });
});

// ── Evaluator 4: Staff Readiness ───────────────────────────────────────────

describe("evaluateStaffKeyWorkingReadiness", () => {
  it("returns zeros for empty staff", () => {
    const result = evaluateStaffKeyWorkingReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score for all-true staff", () => {
    const staff = [makeTraining(), makeTraining({ staffId: "staff-2" })];
    const result = evaluateStaffKeyWorkingReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeTraining({
      relationshipBuilding: false, therapeuticApproaches: false, childVoiceCapture: false,
      carePlanKnowledge: false, recordKeeping: false, crisisSupport: false,
    })];
    const result = evaluateStaffKeyWorkingReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weights (6+5+5+4+3+2=25)", () => {
    const staff = [makeTraining({
      therapeuticApproaches: false, childVoiceCapture: false, carePlanKnowledge: false,
      recordKeeping: false, crisisSupport: false,
    })];
    const result = evaluateStaffKeyWorkingReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("only crisisSupport true gives weight-2 score", () => {
    const staff = [makeTraining({
      relationshipBuilding: false, therapeuticApproaches: false, childVoiceCapture: false,
      carePlanKnowledge: false, recordKeeping: false, crisisSupport: true,
    })];
    const result = evaluateStaffKeyWorkingReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("calculates mixed rates correctly", () => {
    const staff = [
      makeTraining({ staffId: "s-1", relationshipBuilding: true, therapeuticApproaches: true, childVoiceCapture: false, carePlanKnowledge: false, recordKeeping: false, crisisSupport: false }),
      makeTraining({ staffId: "s-2", relationshipBuilding: true, therapeuticApproaches: false, childVoiceCapture: true, carePlanKnowledge: false, recordKeeping: false, crisisSupport: false }),
    ];
    const result = evaluateStaffKeyWorkingReadiness(staff);
    expect(result.relationshipBuildingRate).toBe(100);
    expect(result.therapeuticApproachesRate).toBe(50);
    expect(result.childVoiceCaptureRate).toBe(50);
  });

  it("3 staff with mixed skills", () => {
    const staff = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2", relationshipBuilding: false, therapeuticApproaches: false }),
      makeTraining({ staffId: "s3", childVoiceCapture: false, carePlanKnowledge: false, recordKeeping: false, crisisSupport: false }),
    ];
    const result = evaluateStaffKeyWorkingReadiness(staff);
    expect(result.totalStaff).toBe(3);
    expect(result.relationshipBuildingRate).toBe(67);
  });

  it("only recordKeeping true gives weight-3 score", () => {
    const staff = [makeTraining({
      relationshipBuilding: false, therapeuticApproaches: false, childVoiceCapture: false,
      carePlanKnowledge: false, recordKeeping: true, crisisSupport: false,
    })];
    const result = evaluateStaffKeyWorkingReadiness(staff);
    expect(result.overallScore).toBe(3);
  });
});

// ── Child Profiles ─────────────────────────────────────────────────────────

describe("buildChildKeyWorkingProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildKeyWorkingProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildKeyWorkingProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "c1")?.totalRecords).toBe(2);
  });

  it("scores frequency: >=10 -> 2, >=5 -> 1, <5 -> 0", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childEngaged: false, childViewRecorded: false }),
    );
    const profiles = buildChildKeyWorkingProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores rate1 (childEngagedRate): >=80 -> 3", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childEngaged: i < 4, childViewRecorded: false }),
    );
    const profiles = buildChildKeyWorkingProfiles(recs);
    // freq=1, rate1(80%)=3, rate2(0%)=0, diversity(1)=0 -> 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("scores diversity: >=4 -> 2, >=2 -> 1", () => {
    const categories: Array<KeyWorkingRecord["category"]> = [
      "formal_keywork", "informal_check_in", "direct_work", "goal_review",
    ];
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: cat, childEngaged: false, childViewRecorded: false }),
    );
    const profiles = buildChildKeyWorkingProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("caps at 10", () => {
    const categories: Array<KeyWorkingRecord["category"]> = [
      "formal_keywork", "informal_check_in", "direct_work", "goal_review",
    ];
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: categories[i % 4] }),
    );
    const profiles = buildChildKeyWorkingProfiles(recs);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("2 categories gives diversity 1", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", category: "formal_keywork", childEngaged: false, childViewRecorded: false }),
      makeRecord({ id: "r2", childId: "c1", category: "direct_work", childEngaged: false, childViewRecorded: false }),
    ];
    const profiles = buildChildKeyWorkingProfiles(recs);
    expect(profiles[0].overallScore).toBe(1);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });

  it("rate2 childViewRecordedRate 60% -> 2 points", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childEngaged: false, childViewRecorded: i < 3 }),
    );
    const profiles = buildChildKeyWorkingProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(60%)=2, diversity(1)=0 -> 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("preserves child name from first record", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex Updated" }),
    ];
    const profiles = buildChildKeyWorkingProfiles(recs);
    expect(profiles[0].childName).toBe("Alex");
  });

  it("rate1 40% -> 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childEngaged: i < 2, childViewRecorded: false }),
    );
    const profiles = buildChildKeyWorkingProfiles(recs);
    // freq=1, rate1(40%)=1, rate2(0%)=0, diversity(1)=0 -> 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("rate2 40% -> 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childEngaged: false, childViewRecorded: i < 2 }),
    );
    const profiles = buildChildKeyWorkingProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(40%)=1, diversity(1)=0 -> 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("single record gives no frequency bonus", () => {
    const recs = [makeRecord({ id: "r1", childId: "c1", childEngaged: false, childViewRecorded: false })];
    const profiles = buildChildKeyWorkingProfiles(recs);
    // freq(1)=0, rate1(0%)=0, rate2(0%)=0, diversity(1)=0 -> 0
    expect(profiles[0].overallScore).toBe(0);
  });

  it("5 records gives frequency 1", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", childEngaged: false, childViewRecorded: false }),
    );
    const profiles = buildChildKeyWorkingProfiles(recs);
    // freq=1, rest 0 -> 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("sorts multiple children correctly", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildKeyWorkingProfiles(recs);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].childId).toBe("c1");
    expect(profiles[1].childId).toBe("c2");
  });
});

// ── Master Generator ───────────────────────────────────────────────────────

describe("generateKeyWorkingIntelligence", () => {
  it("returns correct structure with all data", () => {
    const result = generateKeyWorkingIntelligence({
      homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-20",
      records: [makeRecord()], policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.keyWorkingQuality).toBeDefined();
    expect(result.keyWorkingCompliance).toBeDefined();
    expect(result.keyWorkingPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("sums 4 evaluator scores", () => {
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: makePolicy(), staff: [makeTraining()],
    });
    const expectedTotal = result.keyWorkingQuality.overallScore + result.keyWorkingCompliance.overallScore + result.keyWorkingPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedTotal));
  });

  it("caps overall score at 100", () => {
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns inadequate for empty data", () => {
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [], policy: null, staff: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for metrics >= 80%", () => {
    const categories: Array<KeyWorkingRecord["category"]> = [
      "formal_keywork", "informal_check_in", "direct_work", "life_story_work",
      "goal_review", "crisis_support", "preparation_session", "celebration_session",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low metrics", () => {
    const records = [makeRecord({
      childEngaged: false, childViewRecorded: false, goalsAddressed: false,
      moodImproved: false, documentationComplete: false, timelyRecording: false,
    })];
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: null, staff: [makeTraining()],
    });
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions when staff is empty", () => {
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: makePolicy(), staff: [],
    });
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
    ];
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.childProfiles).toHaveLength(2);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [], policy: null, staff: [],
    });
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Reg 10");
  });

  it("no areas for improvement when all metrics high", () => {
    const categories: Array<KeyWorkingRecord["category"]> = [
      "formal_keywork", "informal_check_in", "direct_work", "life_story_work",
      "goal_review", "crisis_support", "preparation_session", "celebration_session",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("empty childProfiles when no records", () => {
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [], policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.childProfiles).toHaveLength(0);
  });

  it("returns outstanding for fully compliant data", () => {
    const categories: Array<KeyWorkingRecord["category"]> = [
      "formal_keywork", "informal_check_in", "direct_work", "life_story_work",
      "goal_review", "crisis_support", "preparation_session", "celebration_session",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBe(100);
  });

  it("generates actions for low metrics (<50%)", () => {
    const records = [makeRecord({
      childEngaged: false, childViewRecorded: false, goalsAddressed: false,
      documentationComplete: false, timelyRecording: false,
    })];
    const staff = [makeTraining({ childVoiceCapture: false })];
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff,
    });
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("no strengths when all metrics are low", () => {
    const records = [makeRecord({
      childEngaged: false, childViewRecorded: false, goalsAddressed: false,
      moodImproved: false, documentationComplete: false, timelyRecording: false,
    })];
    const staff = [makeTraining({
      relationshipBuilding: false, therapeuticApproaches: false, childVoiceCapture: false,
      carePlanKnowledge: false, recordKeeping: false, crisisSupport: false,
    })];
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: null, staff,
    });
    expect(result.strengths).toHaveLength(0);
  });

  it("handles mixed children and categories in profiles", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex", category: "formal_keywork" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex", category: "direct_work" }),
      makeRecord({ id: "r3", childId: "c2", childName: "Jordan", category: "crisis_support" }),
    ];
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.childProfiles).toHaveLength(2);
    const alex = result.childProfiles.find(p => p.childId === "c1");
    expect(alex?.categoriesCovered).toHaveLength(2);
  });

  it("returns good rating for partial compliance", () => {
    const records = [
      makeRecord({ id: "r1", category: "formal_keywork" }),
      makeRecord({ id: "r2", category: "informal_check_in", moodImproved: false }),
    ];
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy({ supervisionOfKeywork: false, keyworkerAllocationPolicy: false, recordKeepingStandard: false }),
      staff: [makeTraining({ crisisSupport: false, recordKeeping: false, carePlanKnowledge: false })],
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
    expect(result.rating).toBe("good");
  });

  it("returns requires_improvement for weak data", () => {
    const records = [
      makeRecord({ id: "r1", childEngaged: true, childViewRecorded: false, goalsAddressed: false, moodImproved: false }),
      makeRecord({ id: "r2", childEngaged: false, childViewRecorded: true, goalsAddressed: false, moodImproved: false }),
    ];
    const result = generateKeyWorkingIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy({ keyWorkingPolicy: false, sessionFrequencyGuidance: false }), staff: [makeTraining({ relationshipBuilding: false, therapeuticApproaches: false })],
    });
    expect(result.rating).toBe("requires_improvement");
  });
});
