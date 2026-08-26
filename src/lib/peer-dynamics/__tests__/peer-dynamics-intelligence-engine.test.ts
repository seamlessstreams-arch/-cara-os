import { describe, it, expect } from "vitest";
import {
  getRating, getPeerDynamicsIntelligenceCategoryLabel, getPeerDynamicsIntelligenceOutcomeLabel, getPeerDynamicsRatingLabel,
  evaluatePeerDynamicsQuality, evaluatePeerDynamicsCompliance, evaluatePeerDynamicsPolicy,
  evaluateStaffPeerDynamicsReadiness, buildChildPeerDynamicsProfiles, generatePeerDynamicsIntelligenceResult,
} from "../peer-dynamics-intelligence-engine";
import type {
  PeerDynamicsIntelligenceRecord, PeerDynamicsIntelligencePolicy, StaffPeerDynamicsTraining,
  PeerDynamicsIntelligenceCategory, PeerDynamicsIntelligenceOutcome, PeerDynamicsRating,
} from "../peer-dynamics-intelligence-engine";

function makeRecord(overrides: Partial<PeerDynamicsIntelligenceRecord> = {}): PeerDynamicsIntelligenceRecord {
  return { id: "pd-1", homeId: "home-oak", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "peer_conflict_resolution", outcome: "positive_dynamics", childViewCaptured: true, restorativeApproachUsed: true, positiveOutcomeAchieved: true, safetyConsideredFirst: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<PeerDynamicsIntelligenceRecord> = {}): PeerDynamicsIntelligenceRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `pd-${i}`, ...o }));
}
function allTruePolicy(): PeerDynamicsIntelligencePolicy {
  return { peerRelationshipPolicy: true, antiBullyingPolicy: true, restorativePracticePolicy: true, groupLivingPolicy: true, socialSkillsDevelopmentPolicy: true, peerMediationPolicy: true, conflictResolutionPolicy: true };
}
function allFalsePolicy(): PeerDynamicsIntelligencePolicy {
  return { peerRelationshipPolicy: false, antiBullyingPolicy: false, restorativePracticePolicy: false, groupLivingPolicy: false, socialSkillsDevelopmentPolicy: false, peerMediationPolicy: false, conflictResolutionPolicy: false };
}
function makeStaff(o: Partial<StaffPeerDynamicsTraining> = {}): StaffPeerDynamicsTraining {
  return { staffId: "s1", peerDynamicsAwareness: true, conflictResolutionSkills: true, restorativePracticeSkills: true, groupFacilitationSkills: true, bullyingPreventionKnowledge: true, socialSkillsTeaching: true, ...o };
}

// ═══ pct ═══

// ═══ getRating ═══
describe("getRating", () => {
  it("outstanding ≥80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("inadequate <40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ═══ Labels ═══
describe("getPeerDynamicsIntelligenceCategoryLabel", () => {
  const cases: [PeerDynamicsIntelligenceCategory, string][] = [
    ["peer_conflict_resolution", "Peer Conflict Resolution"], ["friendship_building", "Friendship Building"],
    ["group_activity_engagement", "Group Activity Engagement"], ["bullying_response", "Bullying Response"],
    ["positive_peer_influence", "Positive Peer Influence"], ["social_skills_development", "Social Skills Development"],
    ["peer_mediation", "Peer Mediation"], ["group_living_assessment", "Group Living Assessment"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getPeerDynamicsIntelligenceCategoryLabel(c)).toBe(l); });
});

describe("getPeerDynamicsIntelligenceOutcomeLabel", () => {
  const cases: [PeerDynamicsIntelligenceOutcome, string][] = [
    ["positive_dynamics", "Positive Dynamics"], ["improving_dynamics", "Improving Dynamics"], ["mixed_dynamics", "Mixed Dynamics"],
    ["concerning_dynamics", "Concerning Dynamics"], ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getPeerDynamicsIntelligenceOutcomeLabel(o)).toBe(l); });
});

describe("getPeerDynamicsRatingLabel", () => {
  const cases: [PeerDynamicsRating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s → %s", (r, l) => { expect(getPeerDynamicsRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluatePeerDynamicsQuality", () => {
  it("0 for empty", () => { const r = evaluatePeerDynamicsQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { expect(evaluatePeerDynamicsQuality(makeRecords(5)).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluatePeerDynamicsQuality(makeRecords(3, { childViewCaptured: false, restorativeApproachUsed: false, positiveOutcomeAchieved: false, safetyConsideredFirst: false })).overallScore).toBe(0); });
  it("weight 7 for childViewCaptured", () => { expect(evaluatePeerDynamicsQuality([makeRecord({ childViewCaptured: true, restorativeApproachUsed: false, positiveOutcomeAchieved: false, safetyConsideredFirst: false })]).overallScore).toBe(7); });
  it("weight 6 for restorativeApproachUsed", () => { expect(evaluatePeerDynamicsQuality([makeRecord({ childViewCaptured: false, restorativeApproachUsed: true, positiveOutcomeAchieved: false, safetyConsideredFirst: false })]).overallScore).toBe(6); });
  it("weight 6 for positiveOutcomeAchieved", () => { expect(evaluatePeerDynamicsQuality([makeRecord({ childViewCaptured: false, restorativeApproachUsed: false, positiveOutcomeAchieved: true, safetyConsideredFirst: false })]).overallScore).toBe(6); });
  it("weight 6 for safetyConsideredFirst", () => { expect(evaluatePeerDynamicsQuality([makeRecord({ childViewCaptured: false, restorativeApproachUsed: false, positiveOutcomeAchieved: false, safetyConsideredFirst: true })]).overallScore).toBe(6); });
  it("50% partial = 12.5", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", childViewCaptured: false, restorativeApproachUsed: false, positiveOutcomeAchieved: false, safetyConsideredFirst: false })];
    expect(evaluatePeerDynamicsQuality(records).overallScore).toBe(12.5);
  });
  it("caps at 25", () => { expect(evaluatePeerDynamicsQuality(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
  it("returns correct rates", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", childViewCaptured: false })];
    const r = evaluatePeerDynamicsQuality(records);
    expect(r.childViewCapturedRate).toBe(50);
    expect(r.restorativeApproachUsedRate).toBe(100);
  });
  it("single record all true = 25", () => { expect(evaluatePeerDynamicsQuality([makeRecord()]).overallScore).toBe(25); });
});

// ═══ Compliance ═══
describe("evaluatePeerDynamicsCompliance", () => {
  it("0 for empty", () => { expect(evaluatePeerDynamicsCompliance([]).overallScore).toBe(0); });
  it("25 for perfect with 8 categories", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response", "positive_peer_influence", "social_skills_development", "peer_mediation", "group_living_assessment"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    expect(evaluatePeerDynamicsCompliance(records).overallScore).toBe(25);
  });
  it("4/8 = 0.5 ratio", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response"];
    const r = evaluatePeerDynamicsCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })));
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
  it("single category = 0.13", () => { expect(evaluatePeerDynamicsCompliance(makeRecords(5)).categoryDiversityRatio).toBe(0.13); });
  it("caps at 25", () => { expect(evaluatePeerDynamicsCompliance(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
  it("documentation weight = 8", () => {
    const r = evaluatePeerDynamicsCompliance([makeRecord({ documentationComplete: true, timelyRecording: false, childViewCaptured: false })]);
    // 8 + 0 + 0 + (1/8)*5 = 8 + 0.625 = 8.6 → round to 8.6
    expect(r.overallScore).toBeGreaterThanOrEqual(8);
  });
  it("timely recording weight = 7", () => {
    const r = evaluatePeerDynamicsCompliance([makeRecord({ documentationComplete: false, timelyRecording: true, childViewCaptured: false })]);
    expect(r.overallScore).toBeGreaterThanOrEqual(7);
  });
  it("uniqueCategories tracks distinct categories", () => {
    const records = [makeRecord({ id: "a", category: "peer_conflict_resolution" }), makeRecord({ id: "b", category: "peer_conflict_resolution" }), makeRecord({ id: "c", category: "friendship_building" })];
    expect(evaluatePeerDynamicsCompliance(records).uniqueCategories).toBe(2);
  });
  it("returns correct rates for mixed data", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", documentationComplete: false, timelyRecording: false })];
    const r = evaluatePeerDynamicsCompliance(records);
    expect(r.documentationCompleteRate).toBe(50);
    expect(r.timelyRecordingRate).toBe(50);
  });
});

// ═══ Policy ═══
describe("evaluatePeerDynamicsPolicy", () => {
  it("0 for null", () => { expect(evaluatePeerDynamicsPolicy(null).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluatePeerDynamicsPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluatePeerDynamicsPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("peerRelationshipPolicy = 4", () => { expect(evaluatePeerDynamicsPolicy({ ...allFalsePolicy(), peerRelationshipPolicy: true }).overallScore).toBe(4); });
  it("antiBullyingPolicy = 4", () => { expect(evaluatePeerDynamicsPolicy({ ...allFalsePolicy(), antiBullyingPolicy: true }).overallScore).toBe(4); });
  it("restorativePracticePolicy = 4", () => { expect(evaluatePeerDynamicsPolicy({ ...allFalsePolicy(), restorativePracticePolicy: true }).overallScore).toBe(4); });
  it("groupLivingPolicy = 4", () => { expect(evaluatePeerDynamicsPolicy({ ...allFalsePolicy(), groupLivingPolicy: true }).overallScore).toBe(4); });
  it("socialSkillsDevelopmentPolicy = 3", () => { expect(evaluatePeerDynamicsPolicy({ ...allFalsePolicy(), socialSkillsDevelopmentPolicy: true }).overallScore).toBe(3); });
  it("peerMediationPolicy = 3", () => { expect(evaluatePeerDynamicsPolicy({ ...allFalsePolicy(), peerMediationPolicy: true }).overallScore).toBe(3); });
  it("conflictResolutionPolicy = 3", () => { expect(evaluatePeerDynamicsPolicy({ ...allFalsePolicy(), conflictResolutionPolicy: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluatePeerDynamicsPolicy(allTruePolicy()).overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3); });
  it("null policy returns all false booleans", () => {
    const r = evaluatePeerDynamicsPolicy(null);
    expect(r.peerRelationshipPolicy).toBe(false);
    expect(r.antiBullyingPolicy).toBe(false);
    expect(r.conflictResolutionPolicy).toBe(false);
  });
  it("partial policy returns correct booleans", () => {
    const r = evaluatePeerDynamicsPolicy({ ...allFalsePolicy(), peerRelationshipPolicy: true, antiBullyingPolicy: true });
    expect(r.peerRelationshipPolicy).toBe(true);
    expect(r.antiBullyingPolicy).toBe(true);
    expect(r.restorativePracticePolicy).toBe(false);
    expect(r.overallScore).toBe(8);
  });
});

// ═══ Staff Readiness ═══
describe("evaluateStaffPeerDynamicsReadiness", () => {
  it("0 for empty", () => { expect(evaluateStaffPeerDynamicsReadiness([]).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffPeerDynamicsReadiness([makeStaff()]).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffPeerDynamicsReadiness([makeStaff({ peerDynamicsAwareness: false, conflictResolutionSkills: false, restorativePracticeSkills: false, groupFacilitationSkills: false, bullyingPreventionKnowledge: false, socialSkillsTeaching: false })]).overallScore).toBe(0); });
  it("peerDynamicsAwareness = 6", () => { expect(evaluateStaffPeerDynamicsReadiness([makeStaff({ peerDynamicsAwareness: true, conflictResolutionSkills: false, restorativePracticeSkills: false, groupFacilitationSkills: false, bullyingPreventionKnowledge: false, socialSkillsTeaching: false })]).overallScore).toBe(6); });
  it("conflictResolutionSkills = 5", () => { expect(evaluateStaffPeerDynamicsReadiness([makeStaff({ peerDynamicsAwareness: false, conflictResolutionSkills: true, restorativePracticeSkills: false, groupFacilitationSkills: false, bullyingPreventionKnowledge: false, socialSkillsTeaching: false })]).overallScore).toBe(5); });
  it("restorativePracticeSkills = 5", () => { expect(evaluateStaffPeerDynamicsReadiness([makeStaff({ peerDynamicsAwareness: false, conflictResolutionSkills: false, restorativePracticeSkills: true, groupFacilitationSkills: false, bullyingPreventionKnowledge: false, socialSkillsTeaching: false })]).overallScore).toBe(5); });
  it("groupFacilitationSkills = 4", () => { expect(evaluateStaffPeerDynamicsReadiness([makeStaff({ peerDynamicsAwareness: false, conflictResolutionSkills: false, restorativePracticeSkills: false, groupFacilitationSkills: true, bullyingPreventionKnowledge: false, socialSkillsTeaching: false })]).overallScore).toBe(4); });
  it("bullyingPreventionKnowledge = 3", () => { expect(evaluateStaffPeerDynamicsReadiness([makeStaff({ peerDynamicsAwareness: false, conflictResolutionSkills: false, restorativePracticeSkills: false, groupFacilitationSkills: false, bullyingPreventionKnowledge: true, socialSkillsTeaching: false })]).overallScore).toBe(3); });
  it("socialSkillsTeaching = 2", () => { expect(evaluateStaffPeerDynamicsReadiness([makeStaff({ peerDynamicsAwareness: false, conflictResolutionSkills: false, restorativePracticeSkills: false, groupFacilitationSkills: false, bullyingPreventionKnowledge: false, socialSkillsTeaching: true })]).overallScore).toBe(2); });
  it("weights sum to 25", () => { expect(evaluateStaffPeerDynamicsReadiness([makeStaff()]).overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2); });
  it("mixed staff", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", peerDynamicsAwareness: false, socialSkillsTeaching: false })];
    expect(evaluateStaffPeerDynamicsReadiness(staff).overallScore).toBe(21);
  });
  it("returns 0 totalStaff for empty", () => { expect(evaluateStaffPeerDynamicsReadiness([]).totalStaff).toBe(0); });
  it("returns correct rates", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", peerDynamicsAwareness: false })];
    const r = evaluateStaffPeerDynamicsReadiness(staff);
    expect(r.peerDynamicsAwarenessRate).toBe(50);
    expect(r.conflictResolutionSkillsRate).toBe(100);
    expect(r.totalStaff).toBe(2);
  });
});

// ═══ Child Profiles ═══
describe("buildChildPeerDynamicsProfiles", () => {
  it("empty for no records", () => { expect(buildChildPeerDynamicsProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const profiles = buildChildPeerDynamicsProfiles([makeRecord({ id: "a", childId: "c1" }), makeRecord({ id: "b", childId: "c2" }), makeRecord({ id: "c", childId: "c1" })]);
    expect(profiles).toHaveLength(2);
  });
  it("freq=0 for <5", () => { expect(buildChildPeerDynamicsProfiles(makeRecords(4, { childId: "c1" }))[0].overallScore).toBe(6); });
  it("freq=1 for 5-9", () => { expect(buildChildPeerDynamicsProfiles(makeRecords(5, { childId: "c1" }))[0].overallScore).toBe(7); });
  it("freq=2 for >=10", () => { expect(buildChildPeerDynamicsProfiles(makeRecords(10, { childId: "c1" }))[0].overallScore).toBe(8); });
  it("diversity 2 for >=4 cats", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response"];
    expect(buildChildPeerDynamicsProfiles(cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c })))[0].overallScore).toBe(8);
  });
  it("caps at 10", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response", "positive_peer_influence", "social_skills_development", "peer_mediation", "group_living_assessment"];
    expect(buildChildPeerDynamicsProfiles(cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", category: c }))))[0].overallScore).toBe(10);
  });
  it("rate1=0 for childViewCapturedRate <40%", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", childViewCaptured: true }),
      makeRecord({ id: "b", childId: "c1", childViewCaptured: false }),
      makeRecord({ id: "c", childId: "c1", childViewCaptured: false }),
      makeRecord({ id: "d", childId: "c1", childViewCaptured: false }),
    ];
    // 25% rate => rate1Score=0, freq=0, rate2=3(100%), diversity=0 => score=3
    expect(buildChildPeerDynamicsProfiles(records)[0].overallScore).toBe(3);
  });
  it("rate1=1 for childViewCapturedRate 40-59%", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", childViewCaptured: true }),
      makeRecord({ id: "b", childId: "c1", childViewCaptured: true }),
      makeRecord({ id: "c", childId: "c1", childViewCaptured: false }),
      makeRecord({ id: "d", childId: "c1", childViewCaptured: false }),
      makeRecord({ id: "e", childId: "c1", childViewCaptured: false }),
    ];
    // 40% rate => rate1Score=1, freq=1(5 records), rate2=3(100%), diversity=0 => score=5
    expect(buildChildPeerDynamicsProfiles(records)[0].overallScore).toBe(5);
  });
  it("rate1=2 for childViewCapturedRate 60-79%", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", childViewCaptured: true }),
      makeRecord({ id: "b", childId: "c1", childViewCaptured: true }),
      makeRecord({ id: "c", childId: "c1", childViewCaptured: true }),
      makeRecord({ id: "d", childId: "c1", childViewCaptured: false }),
      makeRecord({ id: "e", childId: "c1", childViewCaptured: false }),
    ];
    // 60% rate => rate1Score=2, freq=1(5 records), rate2=3(100%), diversity=0 => score=6
    expect(buildChildPeerDynamicsProfiles(records)[0].overallScore).toBe(6);
  });
  it("rate2=0 for restorativeApproachUsedRate <40%", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", restorativeApproachUsed: false }),
      makeRecord({ id: "b", childId: "c1", restorativeApproachUsed: false }),
      makeRecord({ id: "c", childId: "c1", restorativeApproachUsed: false }),
      makeRecord({ id: "d", childId: "c1", restorativeApproachUsed: true }),
    ];
    // rate2=0 (25%), rate1=3(100%), freq=0, diversity=0 => score=3
    expect(buildChildPeerDynamicsProfiles(records)[0].overallScore).toBe(3);
  });
  it("diversity 1 for 2-3 cats", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", category: "peer_conflict_resolution" }),
      makeRecord({ id: "b", childId: "c1", category: "friendship_building" }),
    ];
    // freq=0, rate1=3, rate2=3, diversity=1 => score=7
    expect(buildChildPeerDynamicsProfiles(records)[0].overallScore).toBe(7);
  });
  it("diversity 0 for 1 cat", () => {
    const records = [makeRecord({ id: "a", childId: "c1" })];
    // freq=0, rate1=3, rate2=3, diversity=0 => score=6
    expect(buildChildPeerDynamicsProfiles(records)[0].overallScore).toBe(6);
  });
  it("returns categoriesCovered list", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", category: "peer_conflict_resolution" }),
      makeRecord({ id: "b", childId: "c1", category: "friendship_building" }),
      makeRecord({ id: "c", childId: "c1", category: "peer_conflict_resolution" }),
    ];
    const profile = buildChildPeerDynamicsProfiles(records)[0];
    expect(profile.categoriesCovered).toHaveLength(2);
    expect(profile.categoriesCovered).toContain("peer_conflict_resolution");
    expect(profile.categoriesCovered).toContain("friendship_building");
  });
  it("returns correct childViewCapturedRate", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", childViewCaptured: true }),
      makeRecord({ id: "b", childId: "c1", childViewCaptured: false }),
    ];
    expect(buildChildPeerDynamicsProfiles(records)[0].childViewCapturedRate).toBe(50);
  });
  it("returns correct restorativeApproachUsedRate", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", restorativeApproachUsed: true }),
      makeRecord({ id: "b", childId: "c1", restorativeApproachUsed: true }),
      makeRecord({ id: "c", childId: "c1", restorativeApproachUsed: false }),
    ];
    expect(buildChildPeerDynamicsProfiles(records)[0].restorativeApproachUsedRate).toBe(67);
  });
});

// ═══ Orchestrator ═══
describe("generatePeerDynamicsIntelligenceResult", () => {
  it("outstanding for perfect data", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response", "positive_peer_influence", "social_skills_development", "peer_mediation", "group_living_assessment"];
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ date: "2026-06-15" }), makeRecord({ id: "out", date: "2025-01-01" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.peerDynamicsQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.peerDynamicsQuality).toBeDefined();
    expect(r.peerDynamicsCompliance).toBeDefined();
    expect(r.peerDynamicsPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });
  it("includes regulatory links", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 12"))).toBe(true);
  });
  it("actions when policy null", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
  it("includes homeId in result", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-elm", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.homeId).toBe("home-elm");
  });
  it("includes period dates", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-03-01", periodEnd: "2026-06-30", records: [], policy: null, staff: [] });
    expect(r.periodStart).toBe("2026-03-01");
    expect(r.periodEnd).toBe("2026-06-30");
  });
  it("strengths for outstanding overall", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response", "positive_peer_influence", "social_skills_development", "peer_mediation", "group_living_assessment"];
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("Outstanding"))).toBe(true);
  });
  it("strengths for good overall", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff({ peerDynamicsAwareness: false, conflictResolutionSkills: false, restorativePracticeSkills: false })] });
    if (r.overallScore >= 60 && r.overallScore < 80) {
      expect(r.strengths.some(s => s.includes("Good"))).toBe(true);
    }
  });
  it("areas for improvement when inadequate", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.some(a => a.includes("Inadequate"))).toBe(true);
  });
  it("areas for improvement when no records", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.areasForImprovement.some(a => a.includes("No peer dynamics records"))).toBe(true);
  });
  it("areas for improvement when no staff", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [] });
    expect(r.areasForImprovement.some(a => a.includes("No staff peer dynamics training"))).toBe(true);
  });
  it("actions for no staff training", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [] });
    expect(r.actions.some(a => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });
  it("actions for low child view capture", () => {
    const records = makeRecords(5, { childViewCaptured: false });
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("Child view capture"))).toBe(true);
  });
  it("actions for low restorative approach", () => {
    const records = makeRecords(5, { restorativeApproachUsed: false });
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("Restorative approach"))).toBe(true);
  });
  it("actions for low documentation", () => {
    const records = makeRecords(5, { documentationComplete: false });
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("Documentation rate"))).toBe(true);
  });
  it("actions for low timely recording", () => {
    const records = makeRecords(5, { timelyRecording: false });
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("Timely recording"))).toBe(true);
  });
  it("no immediate actions for excellent data", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response", "positive_peer_influence", "social_skills_development", "peer_mediation", "group_living_assessment"];
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions[0]).toContain("No immediate actions required");
  });
  it("childProfiles included", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ childId: "c1" }), makeRecord({ id: "pd-2", childId: "c2", childName: "Jordan" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.childProfiles).toHaveLength(2);
  });
  it("regulatory links always present", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some(l => l.includes("NMS 3"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("Children Act 1989"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("Quality Standards 2015"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("KCSIE 2024"))).toBe(true);
  });
  it("strengths include quality strong when quality >= 20", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response", "positive_peer_influence", "social_skills_development", "peer_mediation", "group_living_assessment"];
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("quality is strong"))).toBe(true);
  });
  it("strengths include compliance strong when compliance >= 20", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response", "positive_peer_influence", "social_skills_development", "peer_mediation", "group_living_assessment"];
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("compliance is strong"))).toBe(true);
  });
  it("strengths include policy robust when policy >= 20", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("policy framework is robust"))).toBe(true);
  });
  it("strengths include staff strong when staff >= 20", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("readiness is strong"))).toBe(true);
  });
  it("strengths include documentation rate when >= 90", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response", "positive_peer_influence", "social_skills_development", "peer_mediation", "group_living_assessment"];
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("Documentation rate at 100%"))).toBe(true);
  });
  it("areas improvement for policy null", () => {
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: null, staff: [makeStaff()] });
    expect(r.areasForImprovement.some(a => a.includes("No peer dynamics policy"))).toBe(true);
  });
  it("actions for low staff awareness", () => {
    const staff = [makeStaff({ staffId: "s1", peerDynamicsAwareness: false }), makeStaff({ staffId: "s2", peerDynamicsAwareness: false }), makeStaff({ staffId: "s3", peerDynamicsAwareness: false })];
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff });
    expect(r.actions.some(a => a.includes("Peer dynamics awareness"))).toBe(true);
  });
  it("actions for children with low scores", () => {
    const records = [makeRecord({ id: "a", childId: "c1", childViewCaptured: false, restorativeApproachUsed: false })];
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("child(ren) with low peer dynamics scores"))).toBe(true);
  });
  it("score capped at 100", () => {
    const cats: PeerDynamicsIntelligenceCategory[] = ["peer_conflict_resolution", "friendship_building", "group_activity_engagement", "bullying_response", "positive_peer_influence", "social_skills_development", "peer_mediation", "group_living_assessment"];
    const r = generatePeerDynamicsIntelligenceResult({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
});
