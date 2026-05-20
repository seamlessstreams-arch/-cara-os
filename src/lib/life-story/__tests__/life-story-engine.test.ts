import { describe, it, expect } from "vitest";
import {
  pct, getRating, getSessionTypeLabel, getEngagementLabel, getRatingLabel,
  evaluateSessionQuality, evaluateIdentityCulture, evaluateLifeStoryPolicy,
  evaluateStaffLifeStoryReadiness, buildChildLifeStoryProfiles,
  generateLifeStoryIntelligence,
} from "../life-story-engine";
import type { LifeStoryRecord, LifeStoryPolicy, StaffLifeStoryTraining, SessionType } from "../life-story-engine";

let _sid = 0;
function makeRecord(o: Partial<LifeStoryRecord> = {}): LifeStoryRecord {
  _sid++;
  return { id: `ls-${_sid}`, childId: "child-1", childName: "Alex", sessionDate: "2026-03-01", sessionType: "life_story_book", completed: true, childLedContent: true, childEngagement: "high", addedToLifeStoryBook: true, memoryBoxUpdated: true, photographsTaken: true, identityNeedsAddressed: true, culturalActivityIncluded: true, familyConnectionExplored: true, ...o };
}
function makePolicy(o: Partial<LifeStoryPolicy> = {}): LifeStoryPolicy {
  return { id: "p-1", lifeStoryWorkPolicy: true, childFriendlyMaterials: true, regularReviewSchedule: true, memoryKeepingProtocol: true, identityAssessmentFramework: true, culturalCompetencyPlan: true, familyConnectionProtocol: true, ...o };
}
let _tid = 0;
function makeTraining(o: Partial<StaffLifeStoryTraining> = {}): StaffLifeStoryTraining {
  _tid++;
  return { id: `t-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, lifeStoryWork: true, identitySupport: true, culturalCompetency: true, therapeuticApproach: true, memoryKeeping: true, familyWorkSkills: true, ...o };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("correct pct", () => { expect(pct(3, 4)).toBe(75); });
  it("rounds", () => { expect(pct(1, 3)).toBe(33); });
  it("100 for equal", () => { expect(pct(10, 10)).toBe(100); });
  it("0 for num=0", () => { expect(pct(0, 5)).toBe(0); });
});

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); });
  it("outstanding at 100", () => { expect(getRating(100)).toBe("outstanding"); });
  it("good >= 60", () => { expect(getRating(60)).toBe("good"); });
  it("good at 79", () => { expect(getRating(79)).toBe("good"); });
  it("requires_improvement >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("requires_improvement at 59", () => { expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(0)).toBe("inadequate"); });
  it("inadequate at 39", () => { expect(getRating(39)).toBe("inadequate"); });
});

// ── labels ─────────────────────────────────────────────────────────────────

describe("labels", () => {
  it("session type labels", () => {
    expect(getSessionTypeLabel("life_story_book")).toBe("Life Story Book");
    expect(getSessionTypeLabel("memory_box")).toBe("Memory Box");
    expect(getSessionTypeLabel("photograph_session")).toBe("Photograph Session");
    expect(getSessionTypeLabel("family_tree")).toBe("Family Tree");
    expect(getSessionTypeLabel("timeline_work")).toBe("Timeline Work");
    expect(getSessionTypeLabel("identity_discussion")).toBe("Identity Discussion");
    expect(getSessionTypeLabel("cultural_activity")).toBe("Cultural Activity");
    expect(getSessionTypeLabel("letter_writing")).toBe("Letter Writing");
    expect(getSessionTypeLabel("creative_expression")).toBe("Creative Expression");
    expect(getSessionTypeLabel("other")).toBe("Other");
  });
  it("engagement labels", () => {
    expect(getEngagementLabel("high")).toBe("High");
    expect(getEngagementLabel("moderate")).toBe("Moderate");
    expect(getEngagementLabel("low")).toBe("Low");
    expect(getEngagementLabel("refused")).toBe("Refused");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateSessionQuality ─────────────────────────────────────────────────

describe("evaluateSessionQuality", () => {
  it("zeros for empty", () => {
    const r = evaluateSessionQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalSessions).toBe(0);
    expect(r.completedSessions).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("max 25 with perfect records", () => {
    const r = evaluateSessionQuality(Array.from({ length: 10 }, () => makeRecord()));
    expect(r.overallScore).toBe(25);
    expect(r.completionRate).toBe(100);
    expect(r.childLedRate).toBe(100);
    expect(r.engagementRate).toBe(100);
    expect(r.documentationRate).toBe(100);
  });
  it("completion rate counts completed vs total", () => {
    const s = [makeRecord({ completed: true }), makeRecord({ completed: true }), makeRecord({ completed: false }), makeRecord({ completed: false })];
    expect(evaluateSessionQuality(s).completionRate).toBe(50);
  });
  it("childLed rate uses completed only", () => {
    const s = [
      makeRecord({ completed: true, childLedContent: true }),
      makeRecord({ completed: true, childLedContent: false }),
      makeRecord({ completed: false, childLedContent: true }),
    ];
    expect(evaluateSessionQuality(s).childLedRate).toBe(50);
  });
  it("engagement rate counts high and moderate", () => {
    const s = [
      makeRecord({ childEngagement: "high" }),
      makeRecord({ childEngagement: "moderate" }),
      makeRecord({ childEngagement: "low" }),
      makeRecord({ childEngagement: "refused" }),
    ];
    expect(evaluateSessionQuality(s).engagementRate).toBe(50);
  });
  it("documentation rate from addedToLifeStoryBook", () => {
    const s = [
      makeRecord({ addedToLifeStoryBook: true }),
      makeRecord({ addedToLifeStoryBook: false }),
      makeRecord({ addedToLifeStoryBook: false }),
    ];
    expect(evaluateSessionQuality(s).documentationRate).toBe(33);
  });
  it("caps at 25", () => {
    expect(evaluateSessionQuality(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25);
  });
  it("rating outstanding when score 25", () => {
    expect(evaluateSessionQuality(Array.from({ length: 5 }, () => makeRecord())).rating).toBe("outstanding");
  });
  it("rating inadequate when all poor", () => {
    const s = [makeRecord({ completed: false, childLedContent: false, childEngagement: "refused", addedToLifeStoryBook: false })];
    expect(evaluateSessionQuality(s).rating).toBe("inadequate");
  });
  it("partial scoring", () => {
    // 2 completed out of 4 = 50% completion, both child-led = 100%, both high = 100%, both documented = 100%
    const s = [
      makeRecord({ completed: true }),
      makeRecord({ completed: true }),
      makeRecord({ completed: false }),
      makeRecord({ completed: false }),
    ];
    const r = evaluateSessionQuality(s);
    // (0.5*7) + (1.0*6) + (1.0*6) + (1.0*6) = 3.5 + 6 + 6 + 6 = 21.5 → 22
    expect(r.overallScore).toBe(22);
  });
});

// ── evaluateIdentityCulture ────────────────────────────────────────────────

describe("evaluateIdentityCulture", () => {
  it("zeros for empty", () => {
    expect(evaluateIdentityCulture([]).overallScore).toBe(0);
  });
  it("max 25 with perfect", () => {
    const r = evaluateIdentityCulture(Array.from({ length: 8 }, () => makeRecord()));
    expect(r.overallScore).toBe(25);
    expect(r.identityAddressedRate).toBe(100);
    expect(r.culturalActivityRate).toBe(100);
    expect(r.familyExploredRate).toBe(100);
    expect(r.photographRate).toBe(100);
  });
  it("identity addressed rate", () => {
    const s = [makeRecord({ identityNeedsAddressed: true }), makeRecord({ identityNeedsAddressed: false })];
    expect(evaluateIdentityCulture(s).identityAddressedRate).toBe(50);
  });
  it("cultural activity rate", () => {
    const s = [makeRecord({ culturalActivityIncluded: true }), makeRecord({ culturalActivityIncluded: false }), makeRecord({ culturalActivityIncluded: false })];
    expect(evaluateIdentityCulture(s).culturalActivityRate).toBe(33);
  });
  it("family explored rate", () => {
    const s = [makeRecord({ familyConnectionExplored: true }), makeRecord({ familyConnectionExplored: true }), makeRecord({ familyConnectionExplored: false })];
    expect(evaluateIdentityCulture(s).familyExploredRate).toBe(67);
  });
  it("photograph rate", () => {
    const s = [makeRecord({ photographsTaken: true }), makeRecord({ photographsTaken: false })];
    expect(evaluateIdentityCulture(s).photographRate).toBe(50);
  });
  it("uses only completed records", () => {
    const s = [
      makeRecord({ completed: true, identityNeedsAddressed: true }),
      makeRecord({ completed: false, identityNeedsAddressed: true }),
    ];
    // Only 1 completed, and that one has identity addressed
    expect(evaluateIdentityCulture(s).identityAddressedRate).toBe(100);
  });
  it("all false gives 0", () => {
    const s = [makeRecord({ identityNeedsAddressed: false, culturalActivityIncluded: false, familyConnectionExplored: false, photographsTaken: false })];
    expect(evaluateIdentityCulture(s).overallScore).toBe(0);
  });
  it("caps at 25", () => {
    expect(evaluateIdentityCulture(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateLifeStoryPolicy ────────────────────────────────────────────────

describe("evaluateLifeStoryPolicy", () => {
  it("null gives 0", () => {
    const r = evaluateLifeStoryPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.lifeStoryWorkPolicy).toBe(false);
    expect(r.rating).toBe("inadequate");
  });
  it("all true gives 25", () => {
    expect(evaluateLifeStoryPolicy(makePolicy()).overallScore).toBe(25);
  });
  it("first 4 at 4pts each", () => {
    expect(evaluateLifeStoryPolicy(makePolicy({ identityAssessmentFramework: false, culturalCompetencyPlan: false, familyConnectionProtocol: false })).overallScore).toBe(16);
  });
  it("last 3 at 3pts each", () => {
    expect(evaluateLifeStoryPolicy(makePolicy({ lifeStoryWorkPolicy: false, childFriendlyMaterials: false, regularReviewSchedule: false, memoryKeepingProtocol: false })).overallScore).toBe(9);
  });
  it("all false gives 0", () => {
    expect(evaluateLifeStoryPolicy(makePolicy({ lifeStoryWorkPolicy: false, childFriendlyMaterials: false, regularReviewSchedule: false, memoryKeepingProtocol: false, identityAssessmentFramework: false, culturalCompetencyPlan: false, familyConnectionProtocol: false })).overallScore).toBe(0);
  });
  it("mirrors booleans", () => {
    const r = evaluateLifeStoryPolicy(makePolicy({ lifeStoryWorkPolicy: false }));
    expect(r.lifeStoryWorkPolicy).toBe(false);
    expect(r.childFriendlyMaterials).toBe(true);
  });
  it("single boolean = 4", () => {
    expect(evaluateLifeStoryPolicy(makePolicy({ lifeStoryWorkPolicy: true, childFriendlyMaterials: false, regularReviewSchedule: false, memoryKeepingProtocol: false, identityAssessmentFramework: false, culturalCompetencyPlan: false, familyConnectionProtocol: false })).overallScore).toBe(4);
  });
  it("single 3pt boolean = 3", () => {
    expect(evaluateLifeStoryPolicy(makePolicy({ lifeStoryWorkPolicy: false, childFriendlyMaterials: false, regularReviewSchedule: false, memoryKeepingProtocol: false, identityAssessmentFramework: true, culturalCompetencyPlan: false, familyConnectionProtocol: false })).overallScore).toBe(3);
  });
  it("outstanding rating when full", () => {
    expect(evaluateLifeStoryPolicy(makePolicy()).rating).toBe("outstanding");
  });
});

// ── evaluateStaffLifeStoryReadiness ────────────────────────────────────────

describe("evaluateStaffLifeStoryReadiness", () => {
  it("zeros for empty", () => {
    const r = evaluateStaffLifeStoryReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("25 fully trained", () => {
    expect(evaluateStaffLifeStoryReadiness([makeTraining()]).overallScore).toBe(25);
  });
  it("partial — lifeStoryWork only = 6", () => {
    const t = makeTraining({ lifeStoryWork: true, identitySupport: false, culturalCompetency: false, therapeuticApproach: false, memoryKeeping: false, familyWorkSkills: false });
    expect(evaluateStaffLifeStoryReadiness([t]).overallScore).toBe(6);
  });
  it("partial — familyWorkSkills only = 2", () => {
    const t = makeTraining({ lifeStoryWork: false, identitySupport: false, culturalCompetency: false, therapeuticApproach: false, memoryKeeping: false, familyWorkSkills: true });
    expect(evaluateStaffLifeStoryReadiness([t]).overallScore).toBe(2);
  });
  it("partial — identitySupport only = 5", () => {
    const t = makeTraining({ lifeStoryWork: false, identitySupport: true, culturalCompetency: false, therapeuticApproach: false, memoryKeeping: false, familyWorkSkills: false });
    expect(evaluateStaffLifeStoryReadiness([t]).overallScore).toBe(5);
  });
  it("partial — memoryKeeping only = 3", () => {
    const t = makeTraining({ lifeStoryWork: false, identitySupport: false, culturalCompetency: false, therapeuticApproach: false, memoryKeeping: true, familyWorkSkills: false });
    expect(evaluateStaffLifeStoryReadiness([t]).overallScore).toBe(3);
  });
  it("mixed rates", () => {
    const t1 = makeTraining({ lifeStoryWork: true, identitySupport: false, culturalCompetency: false, therapeuticApproach: false, memoryKeeping: false, familyWorkSkills: false });
    const t2 = makeTraining({ lifeStoryWork: false, identitySupport: true, culturalCompetency: false, therapeuticApproach: false, memoryKeeping: false, familyWorkSkills: false });
    const r = evaluateStaffLifeStoryReadiness([t1, t2]);
    expect(r.lifeStoryWorkRate).toBe(50);
    expect(r.identitySupportRate).toBe(50);
    expect(r.culturalCompetencyRate).toBe(0);
  });
  it("totalStaff count", () => {
    expect(evaluateStaffLifeStoryReadiness([makeTraining(), makeTraining(), makeTraining()]).totalStaff).toBe(3);
  });
  it("outstanding when fully trained", () => {
    expect(evaluateStaffLifeStoryReadiness([makeTraining()]).rating).toBe("outstanding");
  });
});

// ── buildChildLifeStoryProfiles ────────────────────────────────────────────

describe("buildChildLifeStoryProfiles", () => {
  it("empty gives []", () => { expect(buildChildLifeStoryProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const s = [makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c2", childName: "B" })];
    const p = buildChildLifeStoryProfiles(s);
    expect(p).toHaveLength(2);
    expect(p[0].totalSessions).toBe(2);
  });
  it("caps at 10", () => {
    const types: SessionType[] = ["life_story_book", "memory_box", "photograph_session", "family_tree", "timeline_work"];
    const s = Array.from({ length: 12 }, (_, i) => makeRecord({ childId: "c1", childName: "A", sessionType: types[i % types.length] }));
    expect(buildChildLifeStoryProfiles(s)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("freq scoring: 3 sessions → 0 freq", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", completed: false, childLedContent: false, sessionType: "life_story_book" }));
    // 3 sessions, all not completed → freq 0, rate1 0 (completion 0%), rate2 0 (childLed 0%), diversity 0 (0 types completed)
    expect(buildChildLifeStoryProfiles(mk(3))[0].overallScore).toBe(0);
  });
  it("freq scoring: 5 sessions → 1 freq", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", completed: false, childLedContent: false, sessionType: "life_story_book" }));
    // 5 sessions, all not completed → freq 1, rate1 0, rate2 0, diversity 0
    expect(buildChildLifeStoryProfiles(mk(5))[0].overallScore).toBe(1);
  });
  it("freq scoring: 10 sessions → 2 freq", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", completed: false, childLedContent: false, sessionType: "life_story_book" }));
    // 10 sessions, all not completed → freq 2, rate1 0, rate2 0, diversity 0
    expect(buildChildLifeStoryProfiles(mk(10))[0].overallScore).toBe(2);
  });
  it("diversity: 4 types → 2", () => {
    const types: SessionType[] = ["life_story_book", "memory_box", "photograph_session", "family_tree"];
    const s = types.map((t) => makeRecord({ childId: "c1", childName: "A", completed: false, childLedContent: false, sessionType: t }));
    // All not completed: freq 0, rate1 0, rate2 0, diversity 0 (completed types = 0)
    // Actually wait - diversity counts completed session types
    // Since none completed, all type sets are empty → diversity 0
    expect(buildChildLifeStoryProfiles(s)[0].overallScore).toBe(0);
  });
  it("diversity with completed: 4 types → 2", () => {
    const types: SessionType[] = ["life_story_book", "memory_box", "photograph_session", "family_tree"];
    const s = types.map((t) => makeRecord({ childId: "c1", childName: "A", completed: true, childLedContent: false, sessionType: t }));
    // freq 0 (4 < 5), rate1: completionRate=100→3, rate2: childLedRate=0→0, diversity: 4 types→2
    expect(buildChildLifeStoryProfiles(s)[0].overallScore).toBe(5);
  });
  it("perfect child gets 10", () => {
    const types: SessionType[] = ["life_story_book", "memory_box", "photograph_session", "family_tree", "timeline_work"];
    const s = Array.from({ length: 10 }, (_, i) => makeRecord({ childId: "c1", childName: "A", sessionType: types[i % types.length] }));
    // freq: 10→2, rate1: 100→3, rate2: 100→3, diversity: 5 types→2 = 10
    expect(buildChildLifeStoryProfiles(s)[0].overallScore).toBe(10);
  });
  it("completionRate and childLedRate tracked", () => {
    const s = [
      makeRecord({ childId: "c1", childName: "A", completed: true, childLedContent: true }),
      makeRecord({ childId: "c1", childName: "A", completed: true, childLedContent: false }),
      makeRecord({ childId: "c1", childName: "A", completed: false, childLedContent: false }),
    ];
    const p = buildChildLifeStoryProfiles(s)[0];
    expect(p.completionRate).toBe(67);
    expect(p.childLedRate).toBe(50);
  });
  it("sessionTypesCovered lists unique completed types", () => {
    const s = [
      makeRecord({ childId: "c1", childName: "A", sessionType: "life_story_book" }),
      makeRecord({ childId: "c1", childName: "A", sessionType: "memory_box" }),
      makeRecord({ childId: "c1", childName: "A", sessionType: "life_story_book" }),
    ];
    const p = buildChildLifeStoryProfiles(s)[0];
    expect(p.sessionTypesCovered).toContain("life_story_book");
    expect(p.sessionTypesCovered).toContain("memory_box");
    expect(p.sessionTypesCovered).toHaveLength(2);
  });
});

// ── generateLifeStoryIntelligence ──────────────────────────────────────────

describe("generateLifeStoryIntelligence", () => {
  it("complete result", () => {
    const types: SessionType[] = ["life_story_book", "memory_box", "photograph_session", "family_tree", "timeline_work", "identity_discussion", "cultural_activity", "letter_writing"];
    const s = types.map((t, i) => makeRecord({ childId: i < 4 ? "c1" : "c2", childName: i < 4 ? "A" : "B", sessionType: t }));
    const r = generateLifeStoryIntelligence(s, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.homeId).toBe("oak-house");
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.regulatoryLinks).toHaveLength(7);
  });
  it("100 perfect", () => {
    const types: SessionType[] = ["life_story_book", "memory_box", "photograph_session", "family_tree", "timeline_work", "identity_discussion", "cultural_activity", "letter_writing"];
    const r = generateLifeStoryIntelligence(types.map((t) => makeRecord({ sessionType: t })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("0 empty", () => {
    const r = generateLifeStoryIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("URGENT actions", () => {
    const r = generateLifeStoryIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.filter((a) => a.startsWith("URGENT")).length).toBe(2);
  });
  it("strengths when >=80%", () => {
    const types: SessionType[] = ["life_story_book", "memory_box", "photograph_session", "family_tree", "timeline_work", "identity_discussion", "cultural_activity", "letter_writing"];
    const r = generateLifeStoryIntelligence(types.map((t) => makeRecord({ sessionType: t })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("improvements when <60%", () => {
    const s = [makeRecord({ completed: false, childLedContent: false, childEngagement: "refused", addedToLifeStoryBook: false, identityNeedsAddressed: false, culturalActivityIncluded: false, familyConnectionExplored: false, photographsTaken: false })];
    const r = generateLifeStoryIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("cultural and family actions when rates low", () => {
    const s = [makeRecord({ culturalActivityIncluded: false, familyConnectionExplored: false })];
    const r = generateLifeStoryIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    // culturalActivityRate = 0%, familyExploredRate = 0% → both <50 → actions
    expect(r.actions.some((a) => a.includes("cultural") || a.includes("Cultural"))).toBe(true);
    expect(r.actions.some((a) => a.includes("family") || a.includes("Family"))).toBe(true);
  });
  it("child profiles included", () => {
    const s = [makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c2", childName: "B" })];
    const r = generateLifeStoryIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.childProfiles).toHaveLength(2);
  });
  it("periodStart and periodEnd stored", () => {
    const r = generateLifeStoryIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-06-01");
  });
  it("child-led action when rate low", () => {
    const s = [makeRecord({ childLedContent: false })];
    const r = generateLifeStoryIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.includes("child-led") || a.includes("Child-led"))).toBe(true);
  });
  it("photograph action when rate low", () => {
    const s = [makeRecord({ photographsTaken: false })];
    const r = generateLifeStoryIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.toLowerCase().includes("photograph"))).toBe(true);
  });
  it("therapeutic training action when staff rate low", () => {
    const t = makeTraining({ therapeuticApproach: false });
    const r = generateLifeStoryIntelligence([makeRecord()], makePolicy(), [t], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.toLowerCase().includes("therapeutic"))).toBe(true);
  });
  it("regulatory links reference correct legislation", () => {
    const r = generateLifeStoryIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 5"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 7"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 14"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 8"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 30"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });
  it("overallScore capped at 100", () => {
    const r = generateLifeStoryIntelligence(Array.from({ length: 20 }, () => makeRecord()), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
});
