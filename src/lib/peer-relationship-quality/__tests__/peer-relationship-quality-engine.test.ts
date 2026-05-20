import { describe, it, expect } from "vitest";
import {
  generatePeerRelationshipQualityIntelligence, evaluatePeerQuality, evaluatePeerCompliance,
  evaluatePeerPolicy, evaluateStaffPeerReadiness, buildChildPeerProfiles, pct, getRating,
  getInteractionTypeLabel, getRelationshipQualityLabel, getRatingLabel,
} from "../peer-relationship-quality-engine";
import type { PeerInteraction, PeerRelationshipPolicy, StaffPeerSupportTraining } from "../peer-relationship-quality-engine";

let _id = 0;
function makeInteraction(overrides: Partial<PeerInteraction> = {}): PeerInteraction {
  _id++;
  return { id: `pi-${_id}`, childId: "child-alex", childName: "Alex", interactionDate: "2026-04-01", interactionType: "shared_activity", relationshipQuality: "thriving", positiveEngagement: true, conflictResolvedConstructively: true, socialSkillsDemonstrated: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true, ...overrides };
}
function makePolicy(overrides: Partial<PeerRelationshipPolicy> = {}): PeerRelationshipPolicy {
  return { id: "prp-1", positiveRelationshipsStrategy: true, antibullyingPolicy: true, conflictResolutionFramework: true, socialSkillsProgramme: true, peerMentoringScheme: true, inclusionStrategy: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffPeerSupportTraining> = {}): StaffPeerSupportTraining {
  _tid++;
  return { id: `pt-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, relationshipBuilding: true, conflictMediation: true, antibullyingAwareness: true, socialSkillsFacilitation: true, therapeuticGroupWork: true, restorativePractice: true, ...overrides };
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
  it("getInteractionTypeLabel", () => {
    expect(getInteractionTypeLabel("shared_activity")).toBe("Shared Activity");
    expect(getInteractionTypeLabel("conflict_resolution")).toBe("Conflict Resolution");
    expect(getInteractionTypeLabel("cooperative_play")).toBe("Cooperative Play");
    expect(getInteractionTypeLabel("peer_mentoring")).toBe("Peer Mentoring");
    expect(getInteractionTypeLabel("group_project")).toBe("Group Project");
    expect(getInteractionTypeLabel("social_event")).toBe("Social Event");
    expect(getInteractionTypeLabel("team_sport")).toBe("Team Sport");
    expect(getInteractionTypeLabel("creative_collaboration")).toBe("Creative Collaboration");
  });
  it("getRelationshipQualityLabel", () => {
    expect(getRelationshipQualityLabel("thriving")).toBe("Thriving");
    expect(getRelationshipQualityLabel("positive")).toBe("Positive");
    expect(getRelationshipQualityLabel("developing")).toBe("Developing");
    expect(getRelationshipQualityLabel("strained")).toBe("Strained");
    expect(getRelationshipQualityLabel("isolated")).toBe("Isolated");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluatePeerQuality", () => {
  it("returns 0 for empty", () => { const r = evaluatePeerQuality([]); expect(r.overallScore).toBe(0); expect(r.totalInteractions).toBe(0); });
  it("scores 25 for perfect", () => { expect(evaluatePeerQuality(Array.from({ length: 10 }, () => makeInteraction())).overallScore).toBe(25); });
  it("counts thriving+positive as positive relationships", () => {
    const interactions = [makeInteraction({ relationshipQuality: "thriving" }), makeInteraction({ relationshipQuality: "positive" }), makeInteraction({ relationshipQuality: "developing" }), makeInteraction({ relationshipQuality: "strained" }), makeInteraction({ relationshipQuality: "isolated" })];
    expect(evaluatePeerQuality(interactions).positiveRelationshipRate).toBe(40);
  });
  it("calculates positive engagement rate", () => {
    const interactions = [makeInteraction({ positiveEngagement: true }), makeInteraction({ positiveEngagement: false })];
    expect(evaluatePeerQuality(interactions).positiveEngagementRate).toBe(50);
  });
  it("calculates conflict resolution rate", () => {
    const interactions = [makeInteraction({ conflictResolvedConstructively: true }), makeInteraction({ conflictResolvedConstructively: true }), makeInteraction({ conflictResolvedConstructively: false })];
    expect(evaluatePeerQuality(interactions).conflictResolutionRate).toBe(67);
  });
  it("calculates social skills rate", () => {
    const interactions = Array.from({ length: 4 }, () => makeInteraction({ socialSkillsDemonstrated: true })).concat([makeInteraction({ socialSkillsDemonstrated: false })]);
    expect(evaluatePeerQuality(interactions).socialSkillsRate).toBe(80);
  });
  it("caps at 25", () => { expect(evaluatePeerQuality(Array.from({ length: 20 }, () => makeInteraction())).overallScore).toBeLessThanOrEqual(25); });
  it("scores lower with poor relationships", () => {
    const good = evaluatePeerQuality(Array.from({ length: 5 }, () => makeInteraction()));
    const bad = evaluatePeerQuality(Array.from({ length: 5 }, () => makeInteraction({ relationshipQuality: "isolated", positiveEngagement: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
});

describe("evaluatePeerCompliance", () => {
  it("returns 0 for empty", () => { expect(evaluatePeerCompliance([]).overallScore).toBe(0); });
  it("calculates documented rate", () => {
    const interactions = [makeInteraction({ documentedInPlan: true }), makeInteraction({ documentedInPlan: false })];
    expect(evaluatePeerCompliance(interactions).documentedRate).toBe(50);
  });
  it("calculates staff facilitated rate", () => {
    const interactions = [makeInteraction({ staffFacilitated: true }), makeInteraction({ staffFacilitated: false }), makeInteraction({ staffFacilitated: true })];
    expect(evaluatePeerCompliance(interactions).staffFacilitatedRate).toBe(67);
  });
  it("calculates feedback rate", () => {
    const interactions = Array.from({ length: 3 }, () => makeInteraction({ feedbackGiven: true })).concat([makeInteraction({ feedbackGiven: false })]);
    expect(evaluatePeerCompliance(interactions).feedbackRate).toBe(75);
  });
  it("calculates interaction diversity ratio", () => {
    const interactions = [makeInteraction({ interactionType: "shared_activity" }), makeInteraction({ interactionType: "shared_activity" })];
    expect(evaluatePeerCompliance(interactions).interactionDiversityRatio).toBe(13);
  });
  it("caps at 25", () => { expect(evaluatePeerCompliance(Array.from({ length: 20 }, () => makeInteraction())).overallScore).toBeLessThanOrEqual(25); });
});

describe("evaluatePeerPolicy", () => {
  it("returns 0 for null", () => { const r = evaluatePeerPolicy(null); expect(r.overallScore).toBe(0); expect(r.positiveRelationshipsStrategy).toBe(false); });
  it("scores 25 for full policy", () => { expect(evaluatePeerPolicy(makePolicy()).overallScore).toBe(25); });
  it("4-point items individually", () => { expect(evaluatePeerPolicy(makePolicy({ positiveRelationshipsStrategy: true, antibullyingPolicy: false, conflictResolutionFramework: false, socialSkillsProgramme: false, peerMentoringScheme: false, inclusionStrategy: false, regularReview: false })).overallScore).toBe(4); });
  it("3-point items individually", () => { expect(evaluatePeerPolicy(makePolicy({ positiveRelationshipsStrategy: false, antibullyingPolicy: false, conflictResolutionFramework: false, socialSkillsProgramme: false, peerMentoringScheme: true, inclusionStrategy: false, regularReview: false })).overallScore).toBe(3); });
  it("4-point items = 16", () => { expect(evaluatePeerPolicy(makePolicy({ peerMentoringScheme: false, inclusionStrategy: false, regularReview: false })).overallScore).toBe(16); });
  it("3-point items = 9", () => { expect(evaluatePeerPolicy(makePolicy({ positiveRelationshipsStrategy: false, antibullyingPolicy: false, conflictResolutionFramework: false, socialSkillsProgramme: false })).overallScore).toBe(9); });
  it("all false = 0", () => { expect(evaluatePeerPolicy(makePolicy({ positiveRelationshipsStrategy: false, antibullyingPolicy: false, conflictResolutionFramework: false, socialSkillsProgramme: false, peerMentoringScheme: false, inclusionStrategy: false, regularReview: false })).overallScore).toBe(0); });
});

describe("evaluateStaffPeerReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateStaffPeerReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("scores 25 for fully trained", () => { expect(evaluateStaffPeerReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25); });
  it("scores 0 for untrained", () => { expect(evaluateStaffPeerReadiness([makeTraining({ relationshipBuilding: false, conflictMediation: false, antibullyingAwareness: false, socialSkillsFacilitation: false, therapeuticGroupWork: false, restorativePractice: false })]).overallScore).toBe(0); });
  it("single fully trained = 25", () => { expect(evaluateStaffPeerReadiness([makeTraining()]).overallScore).toBe(25); });
  it("caps at 25", () => { expect(evaluateStaffPeerReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25); });
});

describe("buildChildPeerProfiles", () => {
  it("returns empty for no interactions", () => { expect(buildChildPeerProfiles([]).length).toBe(0); });
  it("groups by child", () => {
    const interactions = [makeInteraction({ childId: "c1", childName: "Alex" }), makeInteraction({ childId: "c2", childName: "Jordan" })];
    expect(buildChildPeerProfiles(interactions).length).toBe(2);
  });
  it("calculates positive relationship rate", () => {
    const interactions = [makeInteraction({ childId: "c1", childName: "Alex", relationshipQuality: "thriving" }), makeInteraction({ childId: "c1", childName: "Alex", relationshipQuality: "isolated" })];
    expect(buildChildPeerProfiles(interactions)[0].positiveRelationshipRate).toBe(50);
  });
  it("calculates positive engagement rate", () => {
    const interactions = [makeInteraction({ childId: "c1", childName: "Alex", positiveEngagement: true }), makeInteraction({ childId: "c1", childName: "Alex", positiveEngagement: false })];
    expect(buildChildPeerProfiles(interactions)[0].positiveEngagementRate).toBe(50);
  });
  it("diversity bonus for 4+ types", () => {
    const types: PeerInteraction["interactionType"][] = ["shared_activity", "conflict_resolution", "cooperative_play", "peer_mentoring"];
    const interactions = types.map((t) => makeInteraction({ childId: "c1", childName: "Alex", interactionType: t }));
    expect(buildChildPeerProfiles(interactions)[0].overallScore).toBeGreaterThanOrEqual(5);
  });
  it("caps at 10", () => {
    const interactions = Array.from({ length: 15 }, () => makeInteraction({ childId: "c1", childName: "Alex" }));
    expect(buildChildPeerProfiles(interactions)[0].overallScore).toBeLessThanOrEqual(10);
  });
});

describe("generatePeerRelationshipQualityIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-20" };

  it("returns inadequate for empty", () => {
    const r = generatePeerRelationshipQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const types: PeerInteraction["interactionType"][] = ["shared_activity", "conflict_resolution", "cooperative_play", "peer_mentoring", "group_project", "social_event", "team_sport", "creative_collaboration"];
    const interactions = Array.from({ length: 10 }, (_, i) => makeInteraction({ interactionType: types[i % 8] }));
    const r = generatePeerRelationshipQualityIntelligence(interactions, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const types: PeerInteraction["interactionType"][] = ["shared_activity", "conflict_resolution", "cooperative_play", "peer_mentoring", "group_project", "social_event", "team_sport", "creative_collaboration"];
    const r = generatePeerRelationshipQualityIntelligence(Array.from({ length: 20 }, (_, i) => makeInteraction({ interactionType: types[i % 8] })), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generatePeerRelationshipQualityIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01");
  });
  it("generates strength for positive relationships", () => {
    const r = generatePeerRelationshipQualityIntelligence(Array.from({ length: 5 }, () => makeInteraction()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("peer relationships"))).toBe(true);
  });
  it("generates strength for positive engagement", () => {
    const r = generatePeerRelationshipQualityIntelligence(Array.from({ length: 5 }, () => makeInteraction()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("positive engagement"))).toBe(true);
  });
  it("generates action for no interactions", () => {
    const r = generatePeerRelationshipQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No peer interaction records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generatePeerRelationshipQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generatePeerRelationshipQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generatePeerRelationshipQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("positive relationships"))).toBe(true);
  });
  it("good rating for ~75", () => {
    const r = generatePeerRelationshipQualityIntelligence(Array.from({ length: 5 }, () => makeInteraction()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.rating).toBe("good");
  });
});
