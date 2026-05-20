import { describe, it, expect } from "vitest";
import {
  generateKeyWorkerRelationshipIntelligence, evaluateKeyWorkerQuality, evaluateKeyWorkerCompliance,
  evaluateKeyWorkerPolicy, evaluateStaffKeyWorkerReadiness, buildChildKeyWorkerProfiles, pct, getRating,
  getSessionTypeLabel, getRelationshipStrengthLabel, getRatingLabel,
} from "../key-worker-relationship-engine";
import type { KeyWorkerSession, KeyWorkerPolicy, StaffKeyWorkerTraining } from "../key-worker-relationship-engine";

let _id = 0;
function makeSession(overrides: Partial<KeyWorkerSession> = {}): KeyWorkerSession {
  _id++;
  return { id: `kws-${_id}`, childId: "child-alex", childName: "Alex", keyWorkerId: "staff-sarah", keyWorkerName: "Sarah Johnson", sessionDate: "2026-04-01", sessionType: "one_to_one", relationshipStrength: "very_strong", childEngaged: true, goalsDiscussed: true, progressRecorded: true, documentedInPlan: true, supervisorReviewed: true, feedbackGiven: true, ...overrides };
}
function makePolicy(overrides: Partial<KeyWorkerPolicy> = {}): KeyWorkerPolicy {
  return { id: "kwp-1", keyWorkerAllocationStrategy: true, sessionFrequencyStandard: true, relationshipBuildingFramework: true, advocacyProtocol: true, handoverProcedure: true, supervisionRequirement: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffKeyWorkerTraining> = {}): StaffKeyWorkerTraining {
  _tid++;
  return { id: `kwt-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, relationshipBuilding: true, childAdvocacy: true, goalSettingSkills: true, lifeStoryWork: true, transitionSupport: true, reflectivePractice: true, ...overrides };
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
  it("getSessionTypeLabel", () => {
    expect(getSessionTypeLabel("one_to_one")).toBe("One to One");
    expect(getSessionTypeLabel("activity_based")).toBe("Activity Based");
    expect(getSessionTypeLabel("goal_review")).toBe("Goal Review");
    expect(getSessionTypeLabel("crisis_support")).toBe("Crisis Support");
    expect(getSessionTypeLabel("advocacy")).toBe("Advocacy");
    expect(getSessionTypeLabel("life_story_work")).toBe("Life Story Work");
    expect(getSessionTypeLabel("transition_planning")).toBe("Transition Planning");
    expect(getSessionTypeLabel("wellbeing_check")).toBe("Wellbeing Check");
  });
  it("getRelationshipStrengthLabel", () => {
    expect(getRelationshipStrengthLabel("very_strong")).toBe("Very Strong");
    expect(getRelationshipStrengthLabel("strong")).toBe("Strong");
    expect(getRelationshipStrengthLabel("developing")).toBe("Developing");
    expect(getRelationshipStrengthLabel("fragile")).toBe("Fragile");
    expect(getRelationshipStrengthLabel("disengaged")).toBe("Disengaged");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluateKeyWorkerQuality", () => {
  it("returns 0 for empty", () => { const r = evaluateKeyWorkerQuality([]); expect(r.overallScore).toBe(0); expect(r.totalSessions).toBe(0); });
  it("scores 25 for perfect", () => { expect(evaluateKeyWorkerQuality(Array.from({ length: 10 }, () => makeSession())).overallScore).toBe(25); });
  it("counts very_strong+strong as strong relationships", () => {
    const sessions = [makeSession({ relationshipStrength: "very_strong" }), makeSession({ relationshipStrength: "strong" }), makeSession({ relationshipStrength: "developing" }), makeSession({ relationshipStrength: "fragile" }), makeSession({ relationshipStrength: "disengaged" })];
    expect(evaluateKeyWorkerQuality(sessions).strongRelationshipRate).toBe(40);
  });
  it("calculates child engaged rate", () => {
    const sessions = [makeSession({ childEngaged: true }), makeSession({ childEngaged: false })];
    expect(evaluateKeyWorkerQuality(sessions).childEngagedRate).toBe(50);
  });
  it("calculates goals discussed rate", () => {
    const sessions = [makeSession({ goalsDiscussed: true }), makeSession({ goalsDiscussed: true }), makeSession({ goalsDiscussed: false })];
    expect(evaluateKeyWorkerQuality(sessions).goalsDiscussedRate).toBe(67);
  });
  it("calculates progress rate", () => {
    const sessions = Array.from({ length: 4 }, () => makeSession({ progressRecorded: true })).concat([makeSession({ progressRecorded: false })]);
    expect(evaluateKeyWorkerQuality(sessions).progressRate).toBe(80);
  });
  it("caps at 25", () => { expect(evaluateKeyWorkerQuality(Array.from({ length: 20 }, () => makeSession())).overallScore).toBeLessThanOrEqual(25); });
  it("scores lower with poor relationships", () => {
    const good = evaluateKeyWorkerQuality(Array.from({ length: 5 }, () => makeSession()));
    const bad = evaluateKeyWorkerQuality(Array.from({ length: 5 }, () => makeSession({ relationshipStrength: "disengaged", childEngaged: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
  it("returns correct totalSessions", () => {
    expect(evaluateKeyWorkerQuality([makeSession(), makeSession(), makeSession()]).totalSessions).toBe(3);
  });
});

describe("evaluateKeyWorkerCompliance", () => {
  it("returns 0 for empty", () => { expect(evaluateKeyWorkerCompliance([]).overallScore).toBe(0); });
  it("calculates documented rate", () => {
    const sessions = [makeSession({ documentedInPlan: true }), makeSession({ documentedInPlan: false })];
    expect(evaluateKeyWorkerCompliance(sessions).documentedRate).toBe(50);
  });
  it("calculates supervisor reviewed rate", () => {
    const sessions = [makeSession({ supervisorReviewed: true }), makeSession({ supervisorReviewed: false }), makeSession({ supervisorReviewed: true })];
    expect(evaluateKeyWorkerCompliance(sessions).supervisorReviewedRate).toBe(67);
  });
  it("calculates feedback rate", () => {
    const sessions = Array.from({ length: 3 }, () => makeSession({ feedbackGiven: true })).concat([makeSession({ feedbackGiven: false })]);
    expect(evaluateKeyWorkerCompliance(sessions).feedbackRate).toBe(75);
  });
  it("calculates session type diversity ratio", () => {
    const sessions = [makeSession({ sessionType: "one_to_one" }), makeSession({ sessionType: "one_to_one" })];
    expect(evaluateKeyWorkerCompliance(sessions).sessionTypeDiversityRatio).toBe(13);
  });
  it("diversity ratio for 4 types", () => {
    const sessions = [makeSession({ sessionType: "one_to_one" }), makeSession({ sessionType: "goal_review" }), makeSession({ sessionType: "advocacy" }), makeSession({ sessionType: "wellbeing_check" })];
    expect(evaluateKeyWorkerCompliance(sessions).sessionTypeDiversityRatio).toBe(50);
  });
  it("caps at 25", () => { expect(evaluateKeyWorkerCompliance(Array.from({ length: 20 }, () => makeSession())).overallScore).toBeLessThanOrEqual(25); });
  it("scores lower with no documentation", () => {
    const good = evaluateKeyWorkerCompliance(Array.from({ length: 5 }, () => makeSession()));
    const bad = evaluateKeyWorkerCompliance(Array.from({ length: 5 }, () => makeSession({ documentedInPlan: false, supervisorReviewed: false, feedbackGiven: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
});

describe("evaluateKeyWorkerPolicy", () => {
  it("returns 0 for null", () => { const r = evaluateKeyWorkerPolicy(null); expect(r.overallScore).toBe(0); expect(r.keyWorkerAllocationStrategy).toBe(false); });
  it("scores 25 for full policy", () => { expect(evaluateKeyWorkerPolicy(makePolicy()).overallScore).toBe(25); });
  it("4-point items individually", () => { expect(evaluateKeyWorkerPolicy(makePolicy({ keyWorkerAllocationStrategy: true, sessionFrequencyStandard: false, relationshipBuildingFramework: false, advocacyProtocol: false, handoverProcedure: false, supervisionRequirement: false, regularReview: false })).overallScore).toBe(4); });
  it("3-point items individually", () => { expect(evaluateKeyWorkerPolicy(makePolicy({ keyWorkerAllocationStrategy: false, sessionFrequencyStandard: false, relationshipBuildingFramework: false, advocacyProtocol: false, handoverProcedure: true, supervisionRequirement: false, regularReview: false })).overallScore).toBe(3); });
  it("4-point items = 16", () => { expect(evaluateKeyWorkerPolicy(makePolicy({ handoverProcedure: false, supervisionRequirement: false, regularReview: false })).overallScore).toBe(16); });
  it("3-point items = 9", () => { expect(evaluateKeyWorkerPolicy(makePolicy({ keyWorkerAllocationStrategy: false, sessionFrequencyStandard: false, relationshipBuildingFramework: false, advocacyProtocol: false })).overallScore).toBe(9); });
  it("all false = 0", () => { expect(evaluateKeyWorkerPolicy(makePolicy({ keyWorkerAllocationStrategy: false, sessionFrequencyStandard: false, relationshipBuildingFramework: false, advocacyProtocol: false, handoverProcedure: false, supervisionRequirement: false, regularReview: false })).overallScore).toBe(0); });
  it("mirrors boolean values", () => {
    const r = evaluateKeyWorkerPolicy(makePolicy({ keyWorkerAllocationStrategy: true, sessionFrequencyStandard: false }));
    expect(r.keyWorkerAllocationStrategy).toBe(true);
    expect(r.sessionFrequencyStandard).toBe(false);
  });
});

describe("evaluateStaffKeyWorkerReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateStaffKeyWorkerReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("scores 25 for fully trained", () => { expect(evaluateStaffKeyWorkerReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25); });
  it("scores 0 for untrained", () => { expect(evaluateStaffKeyWorkerReadiness([makeTraining({ relationshipBuilding: false, childAdvocacy: false, goalSettingSkills: false, lifeStoryWork: false, transitionSupport: false, reflectivePractice: false })]).overallScore).toBe(0); });
  it("single fully trained = 25", () => { expect(evaluateStaffKeyWorkerReadiness([makeTraining()]).overallScore).toBe(25); });
  it("caps at 25", () => { expect(evaluateStaffKeyWorkerReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25); });
  it("calculates relationship building rate", () => {
    const training = [makeTraining({ relationshipBuilding: true }), makeTraining({ relationshipBuilding: false })];
    expect(evaluateStaffKeyWorkerReadiness(training).relationshipBuildingRate).toBe(50);
  });
  it("calculates child advocacy rate", () => {
    const training = [makeTraining({ childAdvocacy: true }), makeTraining({ childAdvocacy: true }), makeTraining({ childAdvocacy: false })];
    expect(evaluateStaffKeyWorkerReadiness(training).childAdvocacyRate).toBe(67);
  });
  it("returns correct totalStaff", () => {
    expect(evaluateStaffKeyWorkerReadiness([makeTraining(), makeTraining()]).totalStaff).toBe(2);
  });
  it("weights relationship building highest", () => {
    const rbOnly = evaluateStaffKeyWorkerReadiness([makeTraining({ relationshipBuilding: true, childAdvocacy: false, goalSettingSkills: false, lifeStoryWork: false, transitionSupport: false, reflectivePractice: false })]);
    const rpOnly = evaluateStaffKeyWorkerReadiness([makeTraining({ relationshipBuilding: false, childAdvocacy: false, goalSettingSkills: false, lifeStoryWork: false, transitionSupport: false, reflectivePractice: true })]);
    expect(rbOnly.overallScore).toBeGreaterThan(rpOnly.overallScore);
  });
});

describe("buildChildKeyWorkerProfiles", () => {
  it("returns empty for no sessions", () => { expect(buildChildKeyWorkerProfiles([]).length).toBe(0); });
  it("groups by child", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex" }), makeSession({ childId: "c2", childName: "Jordan" })];
    expect(buildChildKeyWorkerProfiles(sessions).length).toBe(2);
  });
  it("calculates strong relationship rate", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex", relationshipStrength: "very_strong" }), makeSession({ childId: "c1", childName: "Alex", relationshipStrength: "disengaged" })];
    expect(buildChildKeyWorkerProfiles(sessions)[0].strongRelationshipRate).toBe(50);
  });
  it("calculates engaged rate", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex", childEngaged: true }), makeSession({ childId: "c1", childName: "Alex", childEngaged: false })];
    expect(buildChildKeyWorkerProfiles(sessions)[0].engagedRate).toBe(50);
  });
  it("frequency bonus for 10+ sessions", () => {
    const sessions = Array.from({ length: 10 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    const p = buildChildKeyWorkerProfiles(sessions)[0];
    expect(p.overallScore).toBeGreaterThanOrEqual(5);
  });
  it("frequency bonus for 5+ sessions", () => {
    const sessions5 = Array.from({ length: 5 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    const sessions2 = Array.from({ length: 2 }, () => makeSession({ childId: "c2", childName: "Jordan" }));
    const profiles5 = buildChildKeyWorkerProfiles(sessions5);
    const profiles2 = buildChildKeyWorkerProfiles(sessions2);
    expect(profiles5[0].overallScore).toBeGreaterThanOrEqual(profiles2[0].overallScore);
  });
  it("diversity bonus for 4+ types", () => {
    const types: KeyWorkerSession["sessionType"][] = ["one_to_one", "goal_review", "advocacy", "wellbeing_check"];
    const sessions = types.map((t) => makeSession({ childId: "c1", childName: "Alex", sessionType: t }));
    expect(buildChildKeyWorkerProfiles(sessions)[0].overallScore).toBeGreaterThanOrEqual(5);
  });
  it("caps at 10", () => {
    const sessions = Array.from({ length: 15 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    expect(buildChildKeyWorkerProfiles(sessions)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("returns correct totalSessions per child", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex" }), makeSession({ childId: "c1", childName: "Alex" }), makeSession({ childId: "c2", childName: "Jordan" })];
    const profiles = buildChildKeyWorkerProfiles(sessions);
    const alex = profiles.find((p) => p.childId === "c1")!;
    const jordan = profiles.find((p) => p.childId === "c2")!;
    expect(alex.totalSessions).toBe(2);
    expect(jordan.totalSessions).toBe(1);
  });
  it("disengaged child scores low", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex", relationshipStrength: "disengaged", childEngaged: false })];
    expect(buildChildKeyWorkerProfiles(sessions)[0].overallScore).toBeLessThanOrEqual(1);
  });
});

describe("generateKeyWorkerRelationshipIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-19" };

  it("returns inadequate for empty", () => {
    const r = generateKeyWorkerRelationshipIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const types: KeyWorkerSession["sessionType"][] = ["one_to_one", "activity_based", "goal_review", "crisis_support", "advocacy", "life_story_work", "transition_planning", "wellbeing_check"];
    const sessions = Array.from({ length: 10 }, (_, i) => makeSession({ sessionType: types[i % 8] }));
    const r = generateKeyWorkerRelationshipIntelligence(sessions, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const types: KeyWorkerSession["sessionType"][] = ["one_to_one", "activity_based", "goal_review", "crisis_support", "advocacy", "life_story_work", "transition_planning", "wellbeing_check"];
    const r = generateKeyWorkerRelationshipIntelligence(Array.from({ length: 20 }, (_, i) => makeSession({ sessionType: types[i % 8] })), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generateKeyWorkerRelationshipIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01"); expect(r.periodEnd).toBe("2026-06-30");
  });
  it("generates strength for strong relationships", () => {
    const r = generateKeyWorkerRelationshipIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("trusting bonds"))).toBe(true);
  });
  it("generates strength for high engagement", () => {
    const r = generateKeyWorkerRelationshipIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("engaged"))).toBe(true);
  });
  it("generates strength for high goals discussed", () => {
    const r = generateKeyWorkerRelationshipIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("Goals"))).toBe(true);
  });
  it("generates strength for high documentation", () => {
    const r = generateKeyWorkerRelationshipIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("documentation"))).toBe(true);
  });
  it("generates action for no sessions", () => {
    const r = generateKeyWorkerRelationshipIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No key worker session records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generateKeyWorkerRelationshipIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generateKeyWorkerRelationshipIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generateKeyWorkerRelationshipIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
  });
  it("good rating for ~75", () => {
    const r = generateKeyWorkerRelationshipIntelligence(Array.from({ length: 5 }, () => makeSession()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.rating).toBe("good");
  });
  it("improvement for low relationship strength", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ relationshipStrength: "fragile", childEngaged: false, goalsDiscussed: false, progressRecorded: false }));
    const r = generateKeyWorkerRelationshipIntelligence(sessions, null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("relationship strength"))).toBe(true);
  });
  it("improvement for low engagement", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ childEngaged: false }));
    const r = generateKeyWorkerRelationshipIntelligence(sessions, null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("engagement"))).toBe(true);
  });
  it("action for low supervisor review", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ supervisorReviewed: false }));
    const r = generateKeyWorkerRelationshipIntelligence(sessions, null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("supervisor"))).toBe(true);
  });
  it("includes child profiles", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex" }), makeSession({ childId: "c2", childName: "Jordan" })];
    const r = generateKeyWorkerRelationshipIntelligence(sessions, null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.childProfiles.length).toBe(2);
  });
  it("no improvement for empty sessions", () => {
    const r = generateKeyWorkerRelationshipIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.length).toBe(0);
  });
});
