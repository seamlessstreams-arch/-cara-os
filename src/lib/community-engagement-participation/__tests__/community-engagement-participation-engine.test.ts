import { describe, it, expect } from "vitest";
import {
  generateCommunityEngagementParticipationIntelligence, evaluateEngagementQuality, evaluateEngagementCompliance,
  evaluateCommunityPolicy, evaluateStaffCommunityReadiness, buildChildCommunityProfiles, pct, getRating,
  getActivityTypeLabel, getParticipationLevelLabel, getRatingLabel,
} from "../community-engagement-participation-engine";
import type { CommunityActivity, CommunityPolicy, StaffCommunityTraining } from "../community-engagement-participation-engine";

let _id = 0;
function makeActivity(overrides: Partial<CommunityActivity> = {}): CommunityActivity {
  _id++;
  return { id: `ca-${_id}`, childId: "child-alex", childName: "Alex", activityDate: "2026-04-01", activityType: "sports_club", participationLevel: "highly_engaged", childInitiated: true, socialSkillsDeveloped: true, communityLinksStrengthened: true, documentedInPlan: true, staffSupported: true, feedbackObtained: true, ...overrides };
}
function makePolicy(overrides: Partial<CommunityPolicy> = {}): CommunityPolicy {
  return { id: "cp-1", communityEngagementStrategy: true, socialInclusionFramework: true, activityAccessPolicy: true, safeguardingInCommunity: true, transportArrangements: true, partnershipAgreements: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffCommunityTraining> = {}): StaffCommunityTraining {
  _tid++;
  return { id: `ct-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, communityEngagement: true, socialInclusion: true, safeguardingInCommunity: true, activityPlanning: true, partnershipWorking: true, documentationSkills: true, ...overrides };
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
  it("getActivityTypeLabel", () => {
    expect(getActivityTypeLabel("sports_club")).toBe("Sports Club");
    expect(getActivityTypeLabel("youth_group")).toBe("Youth Group");
    expect(getActivityTypeLabel("volunteering")).toBe("Volunteering");
    expect(getActivityTypeLabel("cultural_event")).toBe("Cultural Event");
    expect(getActivityTypeLabel("religious_group")).toBe("Religious Group");
    expect(getActivityTypeLabel("hobby_class")).toBe("Hobby Class");
    expect(getActivityTypeLabel("community_project")).toBe("Community Project");
    expect(getActivityTypeLabel("social_outing")).toBe("Social Outing");
  });
  it("getParticipationLevelLabel", () => {
    expect(getParticipationLevelLabel("highly_engaged")).toBe("Highly Engaged");
    expect(getParticipationLevelLabel("regular_participant")).toBe("Regular Participant");
    expect(getParticipationLevelLabel("occasional")).toBe("Occasional");
    expect(getParticipationLevelLabel("reluctant")).toBe("Reluctant");
    expect(getParticipationLevelLabel("non_participant")).toBe("Non-Participant");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluateEngagementQuality", () => {
  it("returns 0 for empty", () => { const r = evaluateEngagementQuality([]); expect(r.overallScore).toBe(0); expect(r.totalActivities).toBe(0); });
  it("scores 25 for perfect", () => { expect(evaluateEngagementQuality(Array.from({ length: 10 }, () => makeActivity())).overallScore).toBe(25); });
  it("counts highly_engaged+regular_participant as participating", () => {
    const activities = [makeActivity({ participationLevel: "highly_engaged" }), makeActivity({ participationLevel: "regular_participant" }), makeActivity({ participationLevel: "occasional" }), makeActivity({ participationLevel: "reluctant" }), makeActivity({ participationLevel: "non_participant" })];
    expect(evaluateEngagementQuality(activities).participationRate).toBe(40);
  });
  it("calculates child initiated rate", () => {
    const activities = [makeActivity({ childInitiated: true }), makeActivity({ childInitiated: false })];
    expect(evaluateEngagementQuality(activities).childInitiatedRate).toBe(50);
  });
  it("calculates social skills rate", () => {
    const activities = [makeActivity({ socialSkillsDeveloped: true }), makeActivity({ socialSkillsDeveloped: true }), makeActivity({ socialSkillsDeveloped: false })];
    expect(evaluateEngagementQuality(activities).socialSkillsRate).toBe(67);
  });
  it("calculates community links rate", () => {
    const activities = Array.from({ length: 4 }, () => makeActivity({ communityLinksStrengthened: true })).concat([makeActivity({ communityLinksStrengthened: false })]);
    expect(evaluateEngagementQuality(activities).communityLinksRate).toBe(80);
  });
  it("caps at 25", () => { expect(evaluateEngagementQuality(Array.from({ length: 20 }, () => makeActivity())).overallScore).toBeLessThanOrEqual(25); });
  it("scores lower with poor participation", () => {
    const good = evaluateEngagementQuality(Array.from({ length: 5 }, () => makeActivity()));
    const bad = evaluateEngagementQuality(Array.from({ length: 5 }, () => makeActivity({ participationLevel: "non_participant", childInitiated: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
});

describe("evaluateEngagementCompliance", () => {
  it("returns 0 for empty", () => { expect(evaluateEngagementCompliance([]).overallScore).toBe(0); });
  it("calculates documented rate", () => {
    const activities = [makeActivity({ documentedInPlan: true }), makeActivity({ documentedInPlan: false })];
    expect(evaluateEngagementCompliance(activities).documentedRate).toBe(50);
  });
  it("calculates staff supported rate", () => {
    const activities = [makeActivity({ staffSupported: true }), makeActivity({ staffSupported: false }), makeActivity({ staffSupported: true })];
    expect(evaluateEngagementCompliance(activities).staffSupportedRate).toBe(67);
  });
  it("calculates feedback rate", () => {
    const activities = Array.from({ length: 3 }, () => makeActivity({ feedbackObtained: true })).concat([makeActivity({ feedbackObtained: false })]);
    expect(evaluateEngagementCompliance(activities).feedbackRate).toBe(75);
  });
  it("calculates activity diversity ratio", () => {
    const activities = [makeActivity({ activityType: "sports_club" }), makeActivity({ activityType: "sports_club" })];
    expect(evaluateEngagementCompliance(activities).activityDiversityRatio).toBe(13);
  });
  it("caps at 25", () => { expect(evaluateEngagementCompliance(Array.from({ length: 20 }, () => makeActivity())).overallScore).toBeLessThanOrEqual(25); });
});

describe("evaluateCommunityPolicy", () => {
  it("returns 0 for null", () => { const r = evaluateCommunityPolicy(null); expect(r.overallScore).toBe(0); expect(r.communityEngagementStrategy).toBe(false); });
  it("scores 25 for full policy", () => { expect(evaluateCommunityPolicy(makePolicy()).overallScore).toBe(25); });
  it("4-point items individually", () => { expect(evaluateCommunityPolicy(makePolicy({ communityEngagementStrategy: true, socialInclusionFramework: false, activityAccessPolicy: false, safeguardingInCommunity: false, transportArrangements: false, partnershipAgreements: false, regularReview: false })).overallScore).toBe(4); });
  it("3-point items individually", () => { expect(evaluateCommunityPolicy(makePolicy({ communityEngagementStrategy: false, socialInclusionFramework: false, activityAccessPolicy: false, safeguardingInCommunity: false, transportArrangements: true, partnershipAgreements: false, regularReview: false })).overallScore).toBe(3); });
  it("4-point items = 16", () => { expect(evaluateCommunityPolicy(makePolicy({ transportArrangements: false, partnershipAgreements: false, regularReview: false })).overallScore).toBe(16); });
  it("3-point items = 9", () => { expect(evaluateCommunityPolicy(makePolicy({ communityEngagementStrategy: false, socialInclusionFramework: false, activityAccessPolicy: false, safeguardingInCommunity: false })).overallScore).toBe(9); });
  it("all false = 0", () => { expect(evaluateCommunityPolicy(makePolicy({ communityEngagementStrategy: false, socialInclusionFramework: false, activityAccessPolicy: false, safeguardingInCommunity: false, transportArrangements: false, partnershipAgreements: false, regularReview: false })).overallScore).toBe(0); });
});

describe("evaluateStaffCommunityReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateStaffCommunityReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("scores 25 for fully trained", () => { expect(evaluateStaffCommunityReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25); });
  it("scores 0 for untrained", () => { expect(evaluateStaffCommunityReadiness([makeTraining({ communityEngagement: false, socialInclusion: false, safeguardingInCommunity: false, activityPlanning: false, partnershipWorking: false, documentationSkills: false })]).overallScore).toBe(0); });
  it("single fully trained = 25", () => { expect(evaluateStaffCommunityReadiness([makeTraining()]).overallScore).toBe(25); });
  it("caps at 25", () => { expect(evaluateStaffCommunityReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25); });
});

describe("buildChildCommunityProfiles", () => {
  it("returns empty for no activities", () => { expect(buildChildCommunityProfiles([]).length).toBe(0); });
  it("groups by child", () => {
    const activities = [makeActivity({ childId: "c1", childName: "Alex" }), makeActivity({ childId: "c2", childName: "Jordan" })];
    expect(buildChildCommunityProfiles(activities).length).toBe(2);
  });
  it("calculates participation rate", () => {
    const activities = [makeActivity({ childId: "c1", childName: "Alex", participationLevel: "highly_engaged" }), makeActivity({ childId: "c1", childName: "Alex", participationLevel: "non_participant" })];
    expect(buildChildCommunityProfiles(activities)[0].participationRate).toBe(50);
  });
  it("calculates child initiated rate", () => {
    const activities = [makeActivity({ childId: "c1", childName: "Alex", childInitiated: true }), makeActivity({ childId: "c1", childName: "Alex", childInitiated: false })];
    expect(buildChildCommunityProfiles(activities)[0].childInitiatedRate).toBe(50);
  });
  it("diversity bonus for 4+ types", () => {
    const types: CommunityActivity["activityType"][] = ["sports_club", "youth_group", "volunteering", "cultural_event"];
    const activities = types.map((t) => makeActivity({ childId: "c1", childName: "Alex", activityType: t }));
    expect(buildChildCommunityProfiles(activities)[0].overallScore).toBeGreaterThanOrEqual(5);
  });
  it("caps at 10", () => {
    const activities = Array.from({ length: 15 }, () => makeActivity({ childId: "c1", childName: "Alex" }));
    expect(buildChildCommunityProfiles(activities)[0].overallScore).toBeLessThanOrEqual(10);
  });
});

describe("generateCommunityEngagementParticipationIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-19" };

  it("returns inadequate for empty", () => {
    const r = generateCommunityEngagementParticipationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const types: CommunityActivity["activityType"][] = ["sports_club", "youth_group", "volunteering", "cultural_event", "religious_group", "hobby_class", "community_project", "social_outing"];
    const activities = Array.from({ length: 10 }, (_, i) => makeActivity({ activityType: types[i % 8] }));
    const r = generateCommunityEngagementParticipationIntelligence(activities, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const types: CommunityActivity["activityType"][] = ["sports_club", "youth_group", "volunteering", "cultural_event", "religious_group", "hobby_class", "community_project", "social_outing"];
    const r = generateCommunityEngagementParticipationIntelligence(Array.from({ length: 20 }, (_, i) => makeActivity({ activityType: types[i % 8] })), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generateCommunityEngagementParticipationIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01");
  });
  it("generates strength for high participation", () => {
    const r = generateCommunityEngagementParticipationIntelligence(Array.from({ length: 5 }, () => makeActivity()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("participation"))).toBe(true);
  });
  it("generates strength for high child initiated", () => {
    const r = generateCommunityEngagementParticipationIntelligence(Array.from({ length: 5 }, () => makeActivity()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("initiating"))).toBe(true);
  });
  it("generates action for no activities", () => {
    const r = generateCommunityEngagementParticipationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No community activity records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generateCommunityEngagementParticipationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generateCommunityEngagementParticipationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generateCommunityEngagementParticipationIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC"))).toBe(true);
  });
  it("good rating for ~75", () => {
    const r = generateCommunityEngagementParticipationIntelligence(Array.from({ length: 5 }, () => makeActivity()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.rating).toBe("good");
  });
});
