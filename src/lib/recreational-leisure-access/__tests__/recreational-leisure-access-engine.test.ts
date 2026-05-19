// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Recreational & Leisure Access Intelligence Engine
//
// Demo: Oak House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateActivityEngagement,
  evaluateActivityDiversity,
  evaluateLeisurePolicy,
  evaluateStaffLeisureReadiness,
  buildChildLeisureProfiles,
  generateRecreationalLeisureAccessIntelligence,
  getActivityTypeLabel,
  getParticipationLevelLabel,
  getRatingLabel,
  getRating,
  pct,
} from "../recreational-leisure-access-engine";
import type {
  LeisureActivity,
  LeisurePolicy,
  StaffLeisureTraining,
  ActivityType,
  ParticipationLevel,
  Rating,
} from "../recreational-leisure-access-engine";

// ── Test Fixtures ────────────────────────────────────────────────────────

const makeActivity = (overrides: Partial<LeisureActivity> = {}): LeisureActivity => ({
  id: "act-001",
  childId: "child-alex",
  childName: "Alex",
  activityDate: "2026-03-15",
  activityType: "sports",
  participationLevel: "enthusiastic",
  childEnjoyed: true,
  newSkillDeveloped: true,
  socialInteraction: true,
  staffSupported: true,
  accessBarrierFree: true,
  recordedInPlan: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<LeisurePolicy> = {}): LeisurePolicy => ({
  id: "policy-001",
  activityProgramme: true,
  individualInterestPlans: true,
  inclusiveAccess: true,
  budgetAllocated: true,
  communityPartnerships: true,
  riskAssessmentProcess: true,
  regularReview: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffLeisureTraining> = {}): StaffLeisureTraining => ({
  id: "train-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  activityPlanning: true,
  safeguardingInActivities: true,
  inclusionAwareness: true,
  firstAidOutdoors: true,
  youthEngagement: true,
  communityResources: true,
  ...overrides,
});

// ── pct() ─────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
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

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

// ── getRating() ───────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles exact boundaries", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(60)).toBe("good");
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label Getters ─────────────────────────────────────────────────────────

describe("getActivityTypeLabel", () => {
  it("returns correct label for sports", () => {
    expect(getActivityTypeLabel("sports")).toBe("Sports");
  });

  it("returns correct label for arts_crafts", () => {
    expect(getActivityTypeLabel("arts_crafts")).toBe("Arts & Crafts");
  });

  it("returns correct label for music", () => {
    expect(getActivityTypeLabel("music")).toBe("Music");
  });

  it("returns correct label for drama", () => {
    expect(getActivityTypeLabel("drama")).toBe("Drama");
  });

  it("returns correct label for outdoor_adventure", () => {
    expect(getActivityTypeLabel("outdoor_adventure")).toBe("Outdoor Adventure");
  });

  it("returns correct label for swimming", () => {
    expect(getActivityTypeLabel("swimming")).toBe("Swimming");
  });

  it("returns correct label for clubs_groups", () => {
    expect(getActivityTypeLabel("clubs_groups")).toBe("Clubs & Groups");
  });

  it("returns correct label for cultural_visits", () => {
    expect(getActivityTypeLabel("cultural_visits")).toBe("Cultural Visits");
  });
});

describe("getParticipationLevelLabel", () => {
  it("returns correct label for enthusiastic", () => {
    expect(getParticipationLevelLabel("enthusiastic")).toBe("Enthusiastic");
  });

  it("returns correct label for willing", () => {
    expect(getParticipationLevelLabel("willing")).toBe("Willing");
  });

  it("returns correct label for reluctant", () => {
    expect(getParticipationLevelLabel("reluctant")).toBe("Reluctant");
  });

  it("returns correct label for refused", () => {
    expect(getParticipationLevelLabel("refused")).toBe("Refused");
  });

  it("returns correct label for unable", () => {
    expect(getParticipationLevelLabel("unable")).toBe("Unable");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns Good for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns Requires Improvement for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns Inadequate for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateActivityEngagement ────────────────────────────────────────────

describe("evaluateActivityEngagement", () => {
  it("returns score 0 for empty activities", () => {
    const result = evaluateActivityEngagement([]);
    expect(result.score).toBe(0);
    expect(result.totalActivities).toBe(0);
    expect(result.enjoymentRate).toBe(0);
    expect(result.participationRate).toBe(0);
    expect(result.socialInteractionRate).toBe(0);
    expect(result.newSkillRate).toBe(0);
    expect(result.recordedInPlanRate).toBe(0);
  });

  it("returns max score for perfect activities", () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `act-${i}` }),
    );
    const result = evaluateActivityEngagement(activities);
    expect(result.score).toBe(25);
    expect(result.enjoymentRate).toBe(100);
    expect(result.participationRate).toBe(100);
    expect(result.socialInteractionRate).toBe(100);
    expect(result.newSkillRate).toBe(100);
    expect(result.recordedInPlanRate).toBe(100);
  });

  it("calculates enjoyment rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", childEnjoyed: true }),
      makeActivity({ id: "a2", childEnjoyed: true }),
      makeActivity({ id: "a3", childEnjoyed: false }),
      makeActivity({ id: "a4", childEnjoyed: false }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.enjoymentCount).toBe(2);
    expect(result.enjoymentRate).toBe(50);
  });

  it("counts enthusiastic and willing as positive participation", () => {
    const activities = [
      makeActivity({ id: "a1", participationLevel: "enthusiastic" }),
      makeActivity({ id: "a2", participationLevel: "willing" }),
      makeActivity({ id: "a3", participationLevel: "reluctant" }),
      makeActivity({ id: "a4", participationLevel: "refused" }),
      makeActivity({ id: "a5", participationLevel: "unable" }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.participationCount).toBe(2);
    expect(result.participationRate).toBe(40);
  });

  it("calculates social interaction rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", socialInteraction: true }),
      makeActivity({ id: "a2", socialInteraction: false }),
      makeActivity({ id: "a3", socialInteraction: true }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.socialInteractionCount).toBe(2);
    expect(result.socialInteractionRate).toBe(67);
  });

  it("calculates new skill rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", newSkillDeveloped: true }),
      makeActivity({ id: "a2", newSkillDeveloped: false }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.newSkillCount).toBe(1);
    expect(result.newSkillRate).toBe(50);
  });

  it("calculates recorded in plan rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", recordedInPlan: true }),
      makeActivity({ id: "a2", recordedInPlan: false }),
      makeActivity({ id: "a3", recordedInPlan: true }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.recordedInPlanCount).toBe(2);
    expect(result.recordedInPlanRate).toBe(67);
  });

  it("returns correct total activities count", () => {
    const activities = [
      makeActivity({ id: "a1" }),
      makeActivity({ id: "a2" }),
      makeActivity({ id: "a3" }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.totalActivities).toBe(3);
  });

  it("score is capped at 25", () => {
    const activities = Array.from({ length: 20 }, (_, i) =>
      makeActivity({ id: `act-${i}` }),
    );
    const result = evaluateActivityEngagement(activities);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const activities = [
      makeActivity({
        id: "a1",
        childEnjoyed: false,
        participationLevel: "refused",
        socialInteraction: false,
        newSkillDeveloped: false,
        recordedInPlan: false,
      }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("produces partial score for mixed activities", () => {
    const activities = [
      makeActivity({ id: "a1", childEnjoyed: true, participationLevel: "enthusiastic", socialInteraction: true }),
      makeActivity({ id: "a2", childEnjoyed: false, participationLevel: "reluctant", socialInteraction: false, newSkillDeveloped: false, recordedInPlan: false }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(25);
  });

  it("handles single activity with all false", () => {
    const activity = makeActivity({
      childEnjoyed: false,
      participationLevel: "refused",
      socialInteraction: false,
      newSkillDeveloped: false,
      recordedInPlan: false,
    });
    const result = evaluateActivityEngagement([activity]);
    expect(result.enjoymentRate).toBe(0);
    expect(result.participationRate).toBe(0);
    expect(result.socialInteractionRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("handles single activity with all true", () => {
    const result = evaluateActivityEngagement([makeActivity()]);
    expect(result.enjoymentRate).toBe(100);
    expect(result.participationRate).toBe(100);
    expect(result.socialInteractionRate).toBe(100);
    expect(result.score).toBe(25);
  });
});

// ── evaluateActivityDiversity ─────────────────────────────────────────────

describe("evaluateActivityDiversity", () => {
  it("returns score 0 for empty activities", () => {
    const result = evaluateActivityDiversity([]);
    expect(result.score).toBe(0);
    expect(result.totalActivities).toBe(0);
    expect(result.uniqueActivityTypes).toBe(0);
    expect(result.uniqueActivityTypeRatio).toBe(0);
    expect(result.accessBarrierFreeRate).toBe(0);
    expect(result.staffSupportRate).toBe(0);
  });

  it("returns correct unique activity type count", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "sports" }),
      makeActivity({ id: "a2", activityType: "music" }),
      makeActivity({ id: "a3", activityType: "sports" }),
      makeActivity({ id: "a4", activityType: "drama" }),
    ];
    const result = evaluateActivityDiversity(activities);
    expect(result.uniqueActivityTypes).toBe(3);
  });

  it("calculates unique activity type ratio correctly", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "sports" }),
      makeActivity({ id: "a2", activityType: "music" }),
      makeActivity({ id: "a3", activityType: "drama" }),
      makeActivity({ id: "a4", activityType: "swimming" }),
    ];
    const result = evaluateActivityDiversity(activities);
    // 4 out of 8 = 50%
    expect(result.uniqueActivityTypeRatio).toBe(50);
  });

  it("returns max ratio for all 8 activity types", () => {
    const types: ActivityType[] = [
      "sports", "arts_crafts", "music", "drama",
      "outdoor_adventure", "swimming", "clubs_groups", "cultural_visits",
    ];
    const activities = types.map((t, i) =>
      makeActivity({ id: `a-${i}`, activityType: t }),
    );
    const result = evaluateActivityDiversity(activities);
    expect(result.uniqueActivityTypes).toBe(8);
    expect(result.uniqueActivityTypeRatio).toBe(100);
  });

  it("calculates access barrier free rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", accessBarrierFree: true }),
      makeActivity({ id: "a2", accessBarrierFree: true }),
      makeActivity({ id: "a3", accessBarrierFree: false }),
    ];
    const result = evaluateActivityDiversity(activities);
    expect(result.accessBarrierFreeCount).toBe(2);
    expect(result.accessBarrierFreeRate).toBe(67);
  });

  it("calculates staff support rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", staffSupported: true }),
      makeActivity({ id: "a2", staffSupported: false }),
    ];
    const result = evaluateActivityDiversity(activities);
    expect(result.staffSupportCount).toBe(1);
    expect(result.staffSupportRate).toBe(50);
  });

  it("builds correct activity type breakdown", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "sports" }),
      makeActivity({ id: "a2", activityType: "sports" }),
      makeActivity({ id: "a3", activityType: "music" }),
    ];
    const result = evaluateActivityDiversity(activities);
    expect(result.activityTypeBreakdown.sports).toBe(2);
    expect(result.activityTypeBreakdown.music).toBe(1);
    expect(result.activityTypeBreakdown.drama).toBe(0);
  });

  it("score is capped at 25", () => {
    const types: ActivityType[] = [
      "sports", "arts_crafts", "music", "drama",
      "outdoor_adventure", "swimming", "clubs_groups", "cultural_visits",
    ];
    const activities = types.map((t, i) =>
      makeActivity({ id: `a-${i}`, activityType: t }),
    );
    const result = evaluateActivityDiversity(activities);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const activities = [
      makeActivity({ id: "a1", accessBarrierFree: false, staffSupported: false }),
    ];
    const result = evaluateActivityDiversity(activities);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("returns max score for perfect activities", () => {
    const types: ActivityType[] = [
      "sports", "arts_crafts", "music", "drama",
      "outdoor_adventure", "swimming", "clubs_groups", "cultural_visits",
    ];
    const activities = types.map((t, i) =>
      makeActivity({ id: `a-${i}`, activityType: t, accessBarrierFree: true, staffSupported: true }),
    );
    const result = evaluateActivityDiversity(activities);
    expect(result.score).toBe(25);
  });

  it("returns empty breakdown for empty activities", () => {
    const result = evaluateActivityDiversity([]);
    expect(result.activityTypeBreakdown.sports).toBe(0);
    expect(result.activityTypeBreakdown.cultural_visits).toBe(0);
  });

  it("handles single activity type", () => {
    const activities = [makeActivity({ id: "a1", activityType: "sports" })];
    const result = evaluateActivityDiversity(activities);
    expect(result.uniqueActivityTypes).toBe(1);
    // 1/8 = 13%
    expect(result.uniqueActivityTypeRatio).toBe(13);
  });
});

// ── evaluateLeisurePolicy ─────────────────────────────────────────────────

describe("evaluateLeisurePolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluateLeisurePolicy(null);
    expect(result.score).toBe(0);
    expect(result.policyProvided).toBe(false);
    expect(result.activityProgramme).toBe(false);
    expect(result.individualInterestPlans).toBe(false);
    expect(result.inclusiveAccess).toBe(false);
    expect(result.budgetAllocated).toBe(false);
    expect(result.communityPartnerships).toBe(false);
    expect(result.riskAssessmentProcess).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns score 25 for all-true policy", () => {
    const result = evaluateLeisurePolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.policyProvided).toBe(true);
  });

  it("returns 4 for only activityProgramme", () => {
    const result = evaluateLeisurePolicy(makePolicy({
      activityProgramme: true,
      individualInterestPlans: false,
      inclusiveAccess: false,
      budgetAllocated: false,
      communityPartnerships: false,
      riskAssessmentProcess: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("returns 4 for only individualInterestPlans", () => {
    const result = evaluateLeisurePolicy(makePolicy({
      activityProgramme: false,
      individualInterestPlans: true,
      inclusiveAccess: false,
      budgetAllocated: false,
      communityPartnerships: false,
      riskAssessmentProcess: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("returns 4 for only inclusiveAccess", () => {
    const result = evaluateLeisurePolicy(makePolicy({
      activityProgramme: false,
      individualInterestPlans: false,
      inclusiveAccess: true,
      budgetAllocated: false,
      communityPartnerships: false,
      riskAssessmentProcess: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("returns 4 for only budgetAllocated", () => {
    const result = evaluateLeisurePolicy(makePolicy({
      activityProgramme: false,
      individualInterestPlans: false,
      inclusiveAccess: false,
      budgetAllocated: true,
      communityPartnerships: false,
      riskAssessmentProcess: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("returns 3 for only communityPartnerships", () => {
    const result = evaluateLeisurePolicy(makePolicy({
      activityProgramme: false,
      individualInterestPlans: false,
      inclusiveAccess: false,
      budgetAllocated: false,
      communityPartnerships: true,
      riskAssessmentProcess: false,
      regularReview: false,
    }));
    expect(result.score).toBe(3);
  });

  it("returns 3 for only riskAssessmentProcess", () => {
    const result = evaluateLeisurePolicy(makePolicy({
      activityProgramme: false,
      individualInterestPlans: false,
      inclusiveAccess: false,
      budgetAllocated: false,
      communityPartnerships: false,
      riskAssessmentProcess: true,
      regularReview: false,
    }));
    expect(result.score).toBe(3);
  });

  it("returns 3 for only regularReview", () => {
    const result = evaluateLeisurePolicy(makePolicy({
      activityProgramme: false,
      individualInterestPlans: false,
      inclusiveAccess: false,
      budgetAllocated: false,
      communityPartnerships: false,
      riskAssessmentProcess: false,
      regularReview: true,
    }));
    expect(result.score).toBe(3);
  });

  it("returns 16 for all 4-point booleans true, 3-point false", () => {
    const result = evaluateLeisurePolicy(makePolicy({
      activityProgramme: true,
      individualInterestPlans: true,
      inclusiveAccess: true,
      budgetAllocated: true,
      communityPartnerships: false,
      riskAssessmentProcess: false,
      regularReview: false,
    }));
    expect(result.score).toBe(16);
  });

  it("returns 9 for all 3-point booleans true, 4-point false", () => {
    const result = evaluateLeisurePolicy(makePolicy({
      activityProgramme: false,
      individualInterestPlans: false,
      inclusiveAccess: false,
      budgetAllocated: false,
      communityPartnerships: true,
      riskAssessmentProcess: true,
      regularReview: true,
    }));
    expect(result.score).toBe(9);
  });

  it("reflects boolean values in result", () => {
    const result = evaluateLeisurePolicy(makePolicy({
      activityProgramme: true,
      individualInterestPlans: false,
    }));
    expect(result.activityProgramme).toBe(true);
    expect(result.individualInterestPlans).toBe(false);
  });

  it("is capped at 25", () => {
    const result = evaluateLeisurePolicy(makePolicy());
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffLeisureReadiness ─────────────────────────────────────────

describe("evaluateStaffLeisureReadiness", () => {
  it("returns score 0 for empty training", () => {
    const result = evaluateStaffLeisureReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.activityPlanningRate).toBe(0);
    expect(result.safeguardingInActivitiesRate).toBe(0);
    expect(result.inclusionAwarenessRate).toBe(0);
    expect(result.firstAidOutdoorsRate).toBe(0);
    expect(result.youthEngagementRate).toBe(0);
    expect(result.communityResourcesRate).toBe(0);
  });

  it("returns score 25 for fully trained staff", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", staffName: "Sarah Johnson" }),
      makeTraining({ id: "t2", staffId: "s2", staffName: "Tom Richards" }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.score).toBe(25);
    expect(result.totalStaff).toBe(2);
  });

  it("calculates activity planning rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", activityPlanning: true }),
      makeTraining({ id: "t2", staffId: "s2", activityPlanning: false }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.activityPlanningCount).toBe(1);
    expect(result.activityPlanningRate).toBe(50);
  });

  it("calculates safeguarding in activities rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", safeguardingInActivities: true }),
      makeTraining({ id: "t2", staffId: "s2", safeguardingInActivities: false }),
      makeTraining({ id: "t3", staffId: "s3", safeguardingInActivities: true }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.safeguardingInActivitiesCount).toBe(2);
    expect(result.safeguardingInActivitiesRate).toBe(67);
  });

  it("calculates inclusion awareness rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", inclusionAwareness: true }),
      makeTraining({ id: "t2", staffId: "s2", inclusionAwareness: true }),
      makeTraining({ id: "t3", staffId: "s3", inclusionAwareness: false }),
      makeTraining({ id: "t4", staffId: "s4", inclusionAwareness: true }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.inclusionAwarenessCount).toBe(3);
    expect(result.inclusionAwarenessRate).toBe(75);
  });

  it("calculates first aid outdoors rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", firstAidOutdoors: false }),
      makeTraining({ id: "t2", staffId: "s2", firstAidOutdoors: false }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.firstAidOutdoorsCount).toBe(0);
    expect(result.firstAidOutdoorsRate).toBe(0);
  });

  it("calculates youth engagement rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", youthEngagement: true }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.youthEngagementCount).toBe(1);
    expect(result.youthEngagementRate).toBe(100);
  });

  it("calculates community resources rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", communityResources: true }),
      makeTraining({ id: "t2", staffId: "s2", communityResources: false }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.communityResourcesCount).toBe(1);
    expect(result.communityResourcesRate).toBe(50);
  });

  it("returns score weighted correctly with only activityPlanning", () => {
    // activityPlanning weight = 6
    const training = [
      makeTraining({
        id: "t1", staffId: "s1",
        activityPlanning: true,
        safeguardingInActivities: false,
        inclusionAwareness: false,
        firstAidOutdoors: false,
        youthEngagement: false,
        communityResources: false,
      }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.score).toBe(6);
  });

  it("returns score weighted correctly with only safeguardingInActivities", () => {
    // safeguardingInActivities weight = 5
    const training = [
      makeTraining({
        id: "t1", staffId: "s1",
        activityPlanning: false,
        safeguardingInActivities: true,
        inclusionAwareness: false,
        firstAidOutdoors: false,
        youthEngagement: false,
        communityResources: false,
      }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.score).toBe(5);
  });

  it("returns score weighted correctly with only communityResources", () => {
    // communityResources weight = 2
    const training = [
      makeTraining({
        id: "t1", staffId: "s1",
        activityPlanning: false,
        safeguardingInActivities: false,
        inclusionAwareness: false,
        firstAidOutdoors: false,
        youthEngagement: false,
        communityResources: true,
      }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.score).toBe(2);
  });

  it("score is capped at 25", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const training = [
      makeTraining({
        id: "t1", staffId: "s1",
        activityPlanning: false,
        safeguardingInActivities: false,
        inclusionAwareness: false,
        firstAidOutdoors: false,
        youthEngagement: false,
        communityResources: false,
      }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.score).toBe(0);
  });

  it("handles partial training across multiple staff", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", activityPlanning: true, safeguardingInActivities: true, inclusionAwareness: false, firstAidOutdoors: false, youthEngagement: false, communityResources: false }),
      makeTraining({ id: "t2", staffId: "s2", activityPlanning: false, safeguardingInActivities: false, inclusionAwareness: true, firstAidOutdoors: true, youthEngagement: false, communityResources: false }),
    ];
    const result = evaluateStaffLeisureReadiness(training);
    expect(result.activityPlanningRate).toBe(50);
    expect(result.safeguardingInActivitiesRate).toBe(50);
    expect(result.inclusionAwarenessRate).toBe(50);
    expect(result.firstAidOutdoorsRate).toBe(50);
    expect(result.youthEngagementRate).toBe(0);
    expect(result.communityResourcesRate).toBe(0);
  });
});

// ── buildChildLeisureProfiles ─────────────────────────────────────────────

describe("buildChildLeisureProfiles", () => {
  it("returns empty array for no activities", () => {
    const profiles = buildChildLeisureProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("groups activities by childId", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "a2", childId: "child-jordan", childName: "Jordan" }),
      makeActivity({ id: "a3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildLeisureProfiles(activities);
    expect(profiles.length).toBe(2);
  });

  it("counts total activities per child", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "a2", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "a3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildLeisureProfiles(activities);
    expect(profiles[0].totalActivities).toBe(3);
  });

  it("counts enjoyment per child", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex", childEnjoyed: true }),
      makeActivity({ id: "a2", childId: "child-alex", childName: "Alex", childEnjoyed: false }),
      makeActivity({ id: "a3", childId: "child-alex", childName: "Alex", childEnjoyed: true }),
    ];
    const profiles = buildChildLeisureProfiles(activities);
    expect(profiles[0].enjoymentCount).toBe(2);
  });

  it("counts positive participation per child", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex", participationLevel: "enthusiastic" }),
      makeActivity({ id: "a2", childId: "child-alex", childName: "Alex", participationLevel: "willing" }),
      makeActivity({ id: "a3", childId: "child-alex", childName: "Alex", participationLevel: "reluctant" }),
    ];
    const profiles = buildChildLeisureProfiles(activities);
    expect(profiles[0].participationCount).toBe(2);
  });

  it("counts unique activity types per child", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex", activityType: "sports" }),
      makeActivity({ id: "a2", childId: "child-alex", childName: "Alex", activityType: "music" }),
      makeActivity({ id: "a3", childId: "child-alex", childName: "Alex", activityType: "sports" }),
      makeActivity({ id: "a4", childId: "child-alex", childName: "Alex", activityType: "drama" }),
    ];
    const profiles = buildChildLeisureProfiles(activities);
    expect(profiles[0].uniqueActivityTypes).toBe(3);
  });

  it("frequency score: 0 for < 5 activities", () => {
    const activities = Array.from({ length: 4 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: "child-alex",
        childName: "Alex",
        childEnjoyed: false,
        participationLevel: "reluctant",
        activityType: "sports",
      }),
    );
    const profiles = buildChildLeisureProfiles(activities);
    // frequency=0, enjoyment=0, participation=0, diversity=0 (1 type)
    expect(profiles[0].score).toBe(0);
  });

  it("frequency score: 1 for >= 5 activities", () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: "child-alex",
        childName: "Alex",
        childEnjoyed: false,
        participationLevel: "reluctant",
        activityType: "sports",
      }),
    );
    const profiles = buildChildLeisureProfiles(activities);
    // frequency=1, enjoyment=0, participation=0, diversity=0
    expect(profiles[0].score).toBe(1);
  });

  it("frequency score: 2 for >= 10 activities", () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: "child-alex",
        childName: "Alex",
        childEnjoyed: false,
        participationLevel: "reluctant",
        activityType: "sports",
      }),
    );
    const profiles = buildChildLeisureProfiles(activities);
    // frequency=2, enjoyment=0, participation=0, diversity=0
    expect(profiles[0].score).toBe(2);
  });

  it("diversity score: 1 for >= 3 unique types", () => {
    const types: ActivityType[] = ["sports", "music", "drama"];
    const activities = types.map((t, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: "child-alex",
        childName: "Alex",
        activityType: t,
        childEnjoyed: false,
        participationLevel: "reluctant",
      }),
    );
    const profiles = buildChildLeisureProfiles(activities);
    // frequency=0, enjoyment=0, participation=0, diversity=1
    expect(profiles[0].score).toBe(1);
  });

  it("diversity score: 2 for >= 5 unique types", () => {
    const types: ActivityType[] = ["sports", "music", "drama", "swimming", "outdoor_adventure"];
    const activities = types.map((t, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: "child-alex",
        childName: "Alex",
        activityType: t,
        childEnjoyed: false,
        participationLevel: "reluctant",
      }),
    );
    const profiles = buildChildLeisureProfiles(activities);
    // frequency=1 (5 activities), enjoyment=0, participation=0, diversity=2
    expect(profiles[0].score).toBe(3);
  });

  it("max score is 10", () => {
    const types: ActivityType[] = ["sports", "music", "drama", "swimming", "outdoor_adventure"];
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: "child-alex",
        childName: "Alex",
        activityType: types[i % types.length],
        childEnjoyed: true,
        participationLevel: "enthusiastic",
      }),
    );
    const profiles = buildChildLeisureProfiles(activities);
    // frequency=2, enjoyment=3, participation=3, diversity=2 = 10
    expect(profiles[0].score).toBe(10);
  });

  it("score is capped at 10", () => {
    const types: ActivityType[] = ["sports", "music", "drama", "swimming", "outdoor_adventure", "arts_crafts", "clubs_groups"];
    const activities = Array.from({ length: 20 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: "child-alex",
        childName: "Alex",
        activityType: types[i % types.length],
        childEnjoyed: true,
        participationLevel: "enthusiastic",
      }),
    );
    const profiles = buildChildLeisureProfiles(activities);
    expect(profiles[0].score).toBeLessThanOrEqual(10);
  });

  it("score is never negative", () => {
    const activities = [
      makeActivity({
        childId: "child-alex",
        childName: "Alex",
        childEnjoyed: false,
        participationLevel: "refused",
        activityType: "sports",
      }),
    ];
    const profiles = buildChildLeisureProfiles(activities);
    expect(profiles[0].score).toBeGreaterThanOrEqual(0);
  });

  it("returns correct childId and childName", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildLeisureProfiles(activities);
    expect(profiles[0].childId).toBe("child-jordan");
    expect(profiles[0].childName).toBe("Jordan");
  });

  it("handles multiple children correctly", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex", childEnjoyed: true, participationLevel: "enthusiastic" }),
      makeActivity({ id: "a2", childId: "child-jordan", childName: "Jordan", childEnjoyed: false, participationLevel: "reluctant" }),
      makeActivity({ id: "a3", childId: "child-alex", childName: "Alex", childEnjoyed: true, participationLevel: "willing" }),
    ];
    const profiles = buildChildLeisureProfiles(activities);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;

    expect(alex.totalActivities).toBe(2);
    expect(alex.enjoymentCount).toBe(2);
    expect(alex.participationCount).toBe(2);

    expect(jordan.totalActivities).toBe(1);
    expect(jordan.enjoymentCount).toBe(0);
    expect(jordan.participationCount).toBe(0);
  });
});

// ── generateRecreationalLeisureAccessIntelligence ─────────────────────────

describe("generateRecreationalLeisureAccessIntelligence", () => {
  it("returns all required fields", () => {
    const result = generateRecreationalLeisureAccessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(result.overallScore).toBeDefined();
    expect(result.rating).toBeDefined();
    expect(result.activityEngagement).toBeDefined();
    expect(result.activityDiversity).toBeDefined();
    expect(result.leisurePolicy).toBeDefined();
    expect(result.staffLeisureReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
    expect(result.assessedAt).toBeDefined();
  });

  it("returns score 0 for completely empty data", () => {
    const result = generateRecreationalLeisureAccessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("sums 4 evaluator scores correctly", () => {
    const activities = [makeActivity()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, policy, training, "oak-house", "2026-01-01", "2026-05-19",
    );
    const expectedSum =
      result.activityEngagement.score +
      result.activityDiversity.score +
      result.leisurePolicy.score +
      result.staffLeisureReadiness.score;
    expect(result.overallScore).toBe(Math.min(Math.round(expectedSum), 100));
  });

  it("caps overall score at 100", () => {
    const types: ActivityType[] = [
      "sports", "arts_crafts", "music", "drama",
      "outdoor_adventure", "swimming", "clubs_groups", "cultural_visits",
    ];
    const activities = types.map((t, i) => makeActivity({ id: `a-${i}`, activityType: t }));
    const policy = makePolicy();
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
    ];
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, policy, training, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns outstanding rating for perfect data", () => {
    const types: ActivityType[] = [
      "sports", "arts_crafts", "music", "drama",
      "outdoor_adventure", "swimming", "clubs_groups", "cultural_visits",
    ];
    const activities = types.map((t, i) => makeActivity({ id: `a-${i}`, activityType: t }));
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, policy, training, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
  });

  it("includes child profiles from activities", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "a2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.childProfiles.length).toBe(2);
  });

  it("includes 7 regulatory links", () => {
    const result = generateRecreationalLeisureAccessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 10 — Enjoyment and achievement");
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 12 — Health and wellbeing");
    expect(result.regulatoryLinks).toContain("SCCIF — Experiences and progress of children");
    expect(result.regulatoryLinks).toContain("NMS 10 — Leisure activities");
    expect(result.regulatoryLinks).toContain("Children Act 1989 — Welfare of the child");
    expect(result.regulatoryLinks).toContain("UNCRC Article 31 — Right to play and leisure");
    expect(result.regulatoryLinks).toContain("Ofsted ILACS — Experiences of children in care");
  });

  // Strengths/actions logic
  it("generates strength when enjoyment rate >= 80%", () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childEnjoyed: true }),
    );
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    const hasEnjoymentStrength = result.strengths.some((s) => s.includes("enjoyment"));
    expect(hasEnjoymentStrength).toBe(true);
  });

  it("generates strength when participation rate >= 80%", () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `a-${i}`, participationLevel: "enthusiastic" }),
    );
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    const hasParticipationStrength = result.strengths.some((s) => s.includes("participation"));
    expect(hasParticipationStrength).toBe(true);
  });

  it("generates strength when unique activity types >= 6", () => {
    const types: ActivityType[] = [
      "sports", "arts_crafts", "music", "drama", "outdoor_adventure", "swimming",
    ];
    const activities = types.map((t, i) => makeActivity({ id: `a-${i}`, activityType: t }));
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    const hasDiversityStrength = result.strengths.some((s) => s.includes("diversity"));
    expect(hasDiversityStrength).toBe(true);
  });

  it("generates action when no activities", () => {
    const result = generateRecreationalLeisureAccessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    const hasNoRecordsAction = result.actions.some((a) => a.includes("No leisure activity records"));
    expect(hasNoRecordsAction).toBe(true);
  });

  it("generates URGENT action when no policy", () => {
    const result = generateRecreationalLeisureAccessIntelligence(
      [makeActivity()], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    const hasUrgentPolicy = result.actions.some((a) => a.includes("URGENT") && a.includes("policy"));
    expect(hasUrgentPolicy).toBe(true);
  });

  it("generates URGENT action when no training", () => {
    const result = generateRecreationalLeisureAccessIntelligence(
      [makeActivity()], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-19",
    );
    const hasUrgentTraining = result.actions.some((a) => a.includes("URGENT") && a.includes("training"));
    expect(hasUrgentTraining).toBe(true);
  });

  it("generates area for improvement when enjoyment < 60%", () => {
    const activities = [
      makeActivity({ id: "a1", childEnjoyed: true }),
      makeActivity({ id: "a2", childEnjoyed: false }),
      makeActivity({ id: "a3", childEnjoyed: false }),
      makeActivity({ id: "a4", childEnjoyed: false }),
      makeActivity({ id: "a5", childEnjoyed: false }),
    ];
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    const hasEnjoymentArea = result.areasForImprovement.some((a) => a.includes("Enjoyment rate"));
    expect(hasEnjoymentArea).toBe(true);
  });

  it("generates area for improvement when participation < 60%", () => {
    const activities = [
      makeActivity({ id: "a1", participationLevel: "enthusiastic" }),
      makeActivity({ id: "a2", participationLevel: "reluctant" }),
      makeActivity({ id: "a3", participationLevel: "refused" }),
      makeActivity({ id: "a4", participationLevel: "unable" }),
      makeActivity({ id: "a5", participationLevel: "refused" }),
    ];
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    const hasParticipationArea = result.areasForImprovement.some((a) => a.includes("Participation rate"));
    expect(hasParticipationArea).toBe(true);
  });

  it("generates default action when everything is good", () => {
    const types: ActivityType[] = [
      "sports", "arts_crafts", "music", "drama",
      "outdoor_adventure", "swimming", "clubs_groups", "cultural_visits",
    ];
    const activities = types.map((t, i) => makeActivity({ id: `a-${i}`, activityType: t }));
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    const hasDefaultAction = result.actions.some((a) => a.includes("Continue current"));
    expect(hasDefaultAction).toBe(true);
  });

  it("includes assessedAt as ISO string", () => {
    const result = generateRecreationalLeisureAccessIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.assessedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns correct homeId", () => {
    const result = generateRecreationalLeisureAccessIntelligence(
      [], null, [], "test-home", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("test-home");
  });

  it("returns correct period dates", () => {
    const result = generateRecreationalLeisureAccessIntelligence(
      [], null, [], "oak-house", "2026-02-01", "2026-04-30",
    );
    expect(result.periodStart).toBe("2026-02-01");
    expect(result.periodEnd).toBe("2026-04-30");
  });

  it("handles mid-range data producing good rating", () => {
    // Some activities, partial policy, partial training
    const activities = [
      makeActivity({ id: "a1", childEnjoyed: true, activityType: "sports" }),
      makeActivity({ id: "a2", childEnjoyed: true, activityType: "music" }),
      makeActivity({ id: "a3", childEnjoyed: false, activityType: "drama" }),
    ];
    const policy = makePolicy({
      communityPartnerships: false,
      riskAssessmentProcess: false,
      regularReview: false,
    });
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        firstAidOutdoors: false,
        youthEngagement: false,
        communityResources: false,
      }),
    ];
    const result = generateRecreationalLeisureAccessIntelligence(
      activities, policy, training, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(100);
  });
});
