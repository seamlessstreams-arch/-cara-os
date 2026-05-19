import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getPraiseTypeLabel,
  getRewardCategoryLabel,
  getBehaviourTrendLabel,
  getChildResponseLabel,
  getRatingLabel,
  evaluatePraiseRecognition,
  evaluateRewardSystem,
  evaluateBehaviouralImpact,
  evaluateStaffReinforcementReadiness,
  buildChildReinforcementProfiles,
  generatePositiveReinforcementRewardsIntelligence,
} from "../positive-reinforcement-rewards-engine";
import type {
  PraiseRecord,
  RewardRecord,
  BehaviourOutcome,
  StaffReinforcementTraining,
} from "../positive-reinforcement-rewards-engine";

// -- Helpers -------------------------------------------------------------------

function makePraise(overrides: Partial<PraiseRecord> = {}): PraiseRecord {
  return {
    id: "pr-1",
    childId: "child-1",
    childName: "Alex",
    praiseDate: "2026-04-01",
    praiseType: "verbal",
    givenBy: "Sarah",
    reason: "Good behaviour",
    childResponse: "positive",
    specificAndDescriptive: true,
    linkedToValues: true,
    ...overrides,
  };
}

function makeReward(overrides: Partial<RewardRecord> = {}): RewardRecord {
  return {
    id: "rw-1",
    childId: "child-1",
    childName: "Alex",
    rewardDate: "2026-04-01",
    rewardCategory: "weekly_target",
    description: "Pizza night",
    childChosenReward: true,
    fairAndConsistent: true,
    linkedToBehaviourPlan: true,
    childResponse: "very_positive",
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<BehaviourOutcome> = {}): BehaviourOutcome {
  return {
    id: "bo-1",
    childId: "child-1",
    childName: "Alex",
    assessmentDate: "2026-04-15",
    behaviourTrend: "improved",
    positiveIncidentsCount: 10,
    negativeIncidentsCount: 1,
    restraintCount: 0,
    deEscalationSuccessful: true,
    childReportedFeeling: "positive",
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffReinforcementTraining> = {}): StaffReinforcementTraining {
  return {
    id: "st-1",
    staffId: "staff-1",
    staffName: "Sarah",
    positiveBehaviourSupport: true,
    therapeuticCareApproach: true,
    deEscalationTechniques: true,
    rewardSystemDesign: true,
    traumaInformedPraise: true,
    consistencyInApproach: true,
    ...overrides,
  };
}

// -- pct() --------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });
  it("calculates percentage correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });
  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });
  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });
  it("returns 0 when num is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// -- getRating() ---------------------------------------------------------------

describe("getRating", () => {
  it("returns outstanding for 80+", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for below 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// -- Label getters ------------------------------------------------------------

describe("label getters", () => {
  it("getPraiseTypeLabel returns all labels", () => {
    expect(getPraiseTypeLabel("verbal")).toBe("Verbal Praise");
    expect(getPraiseTypeLabel("written")).toBe("Written Praise");
    expect(getPraiseTypeLabel("public_recognition")).toBe("Public Recognition");
    expect(getPraiseTypeLabel("reward_token")).toBe("Reward Token");
    expect(getPraiseTypeLabel("special_privilege")).toBe("Special Privilege");
    expect(getPraiseTypeLabel("activity_reward")).toBe("Activity Reward");
    expect(getPraiseTypeLabel("certificate")).toBe("Certificate");
    expect(getPraiseTypeLabel("other")).toBe("Other");
  });

  it("getRewardCategoryLabel returns all labels", () => {
    expect(getRewardCategoryLabel("daily_behaviour")).toBe("Daily Behaviour");
    expect(getRewardCategoryLabel("weekly_target")).toBe("Weekly Target");
    expect(getRewardCategoryLabel("achievement")).toBe("Achievement");
    expect(getRewardCategoryLabel("effort")).toBe("Effort");
    expect(getRewardCategoryLabel("kindness")).toBe("Kindness");
    expect(getRewardCategoryLabel("responsibility")).toBe("Responsibility");
    expect(getRewardCategoryLabel("progress")).toBe("Progress");
    expect(getRewardCategoryLabel("other")).toBe("Other");
  });

  it("getBehaviourTrendLabel returns all labels", () => {
    expect(getBehaviourTrendLabel("significantly_improved")).toBe("Significantly Improved");
    expect(getBehaviourTrendLabel("improved")).toBe("Improved");
    expect(getBehaviourTrendLabel("stable")).toBe("Stable");
    expect(getBehaviourTrendLabel("declined")).toBe("Declined");
    expect(getBehaviourTrendLabel("significantly_declined")).toBe("Significantly Declined");
  });

  it("getChildResponseLabel returns all labels", () => {
    expect(getChildResponseLabel("very_positive")).toBe("Very Positive");
    expect(getChildResponseLabel("positive")).toBe("Positive");
    expect(getChildResponseLabel("neutral")).toBe("Neutral");
    expect(getChildResponseLabel("negative")).toBe("Negative");
    expect(getChildResponseLabel("not_recorded")).toBe("Not Recorded");
  });

  it("getRatingLabel returns all labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluatePraiseRecognition -------------------------------------------------

describe("evaluatePraiseRecognition", () => {
  it("returns 0 for empty records", () => {
    const r = evaluatePraiseRecognition([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalPraise).toBe(0);
    expect(r.positiveResponseRate).toBe(0);
    expect(r.specificRate).toBe(0);
    expect(r.linkedToValuesRate).toBe(0);
    expect(r.praiseTypeVariety).toBe(0);
  });

  it("scores maximum for outstanding praise", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makePraise({
        id: `pr-${i}`,
        praiseType: (["verbal", "written", "public_recognition", "reward_token", "certificate"] as const)[i % 5],
        childResponse: "very_positive",
        specificAndDescriptive: true,
        linkedToValues: true,
      }),
    );
    const r = evaluatePraiseRecognition(records);
    expect(r.overallScore).toBe(25);
  });

  it("scores positive response at 80%+ tier (7 points)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makePraise({
        id: `pr-${i}`,
        childResponse: i < 8 ? "positive" : "neutral",
        specificAndDescriptive: false,
        linkedToValues: false,
      }),
    );
    const r = evaluatePraiseRecognition(records);
    expect(r.positiveResponseRate).toBe(80);
  });

  it("scores positive response at 60-79% tier (5 points)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makePraise({
        id: `pr-${i}`,
        childResponse: i < 6 ? "positive" : "neutral",
        specificAndDescriptive: false,
        linkedToValues: false,
      }),
    );
    const r = evaluatePraiseRecognition(records);
    expect(r.positiveResponseRate).toBe(60);
  });

  it("scores positive response at 40-59% tier (3 points)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makePraise({
        id: `pr-${i}`,
        childResponse: i < 4 ? "positive" : "neutral",
        specificAndDescriptive: false,
        linkedToValues: false,
      }),
    );
    const r = evaluatePraiseRecognition(records);
    expect(r.positiveResponseRate).toBe(40);
  });

  it("scores positive response at >0% tier (1 point)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makePraise({
        id: `pr-${i}`,
        childResponse: i < 1 ? "positive" : "neutral",
        specificAndDescriptive: false,
        linkedToValues: false,
      }),
    );
    const r = evaluatePraiseRecognition(records);
    expect(r.positiveResponseRate).toBe(10);
  });

  it("scores praise type variety at 5+ types (6 points)", () => {
    const types = ["verbal", "written", "public_recognition", "reward_token", "certificate"] as const;
    const records = types.map((t, i) =>
      makePraise({ id: `pr-${i}`, praiseType: t, childResponse: "neutral", specificAndDescriptive: false, linkedToValues: false }),
    );
    const r = evaluatePraiseRecognition(records);
    expect(r.praiseTypeVariety).toBe(5);
  });

  it("scores praise type variety at 3-4 types", () => {
    const records = [
      makePraise({ id: "p1", praiseType: "verbal", childResponse: "neutral", specificAndDescriptive: false, linkedToValues: false }),
      makePraise({ id: "p2", praiseType: "written", childResponse: "neutral", specificAndDescriptive: false, linkedToValues: false }),
      makePraise({ id: "p3", praiseType: "certificate", childResponse: "neutral", specificAndDescriptive: false, linkedToValues: false }),
    ];
    const r = evaluatePraiseRecognition(records);
    expect(r.praiseTypeVariety).toBe(3);
  });

  it("caps score at 25", () => {
    const records = [makePraise()];
    const r = evaluatePraiseRecognition(records);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts very_positive as positive response", () => {
    const records = [makePraise({ childResponse: "very_positive", specificAndDescriptive: false, linkedToValues: false })];
    const r = evaluatePraiseRecognition(records);
    expect(r.positiveResponseRate).toBe(100);
  });
});

// -- evaluateRewardSystem ------------------------------------------------------

describe("evaluateRewardSystem", () => {
  it("returns 0 for empty records", () => {
    const r = evaluateRewardSystem([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRewards).toBe(0);
    expect(r.childChosenRate).toBe(0);
    expect(r.fairConsistentRate).toBe(0);
    expect(r.linkedToPlanRate).toBe(0);
    expect(r.positiveResponseRate).toBe(0);
  });

  it("scores maximum for outstanding reward system", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeReward({ id: `rw-${i}` }),
    );
    const r = evaluateRewardSystem(records);
    expect(r.overallScore).toBe(25);
  });

  it("scores child chosen at 90%+ tier (7 points)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeReward({
        id: `rw-${i}`,
        childChosenReward: true,
        fairAndConsistent: false,
        linkedToBehaviourPlan: false,
        childResponse: "neutral",
      }),
    );
    const r = evaluateRewardSystem(records);
    expect(r.childChosenRate).toBe(100);
  });

  it("scores child chosen at 70-89% tier (5 points)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeReward({
        id: `rw-${i}`,
        childChosenReward: i < 7,
        fairAndConsistent: false,
        linkedToBehaviourPlan: false,
        childResponse: "neutral",
      }),
    );
    const r = evaluateRewardSystem(records);
    expect(r.childChosenRate).toBe(70);
  });

  it("scores child chosen at 50-69% tier (3 points)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeReward({
        id: `rw-${i}`,
        childChosenReward: i < 5,
        fairAndConsistent: false,
        linkedToBehaviourPlan: false,
        childResponse: "neutral",
      }),
    );
    const r = evaluateRewardSystem(records);
    expect(r.childChosenRate).toBe(50);
  });

  it("scores child chosen at >0% tier (1 point)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeReward({
        id: `rw-${i}`,
        childChosenReward: i < 1,
        fairAndConsistent: false,
        linkedToBehaviourPlan: false,
        childResponse: "neutral",
      }),
    );
    const r = evaluateRewardSystem(records);
    expect(r.childChosenRate).toBe(10);
  });

  it("caps score at 25", () => {
    const records = [makeReward()];
    const r = evaluateRewardSystem(records);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores zero for all failures", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeReward({
        id: `rw-${i}`,
        childChosenReward: false,
        fairAndConsistent: false,
        linkedToBehaviourPlan: false,
        childResponse: "negative",
      }),
    );
    const r = evaluateRewardSystem(records);
    expect(r.overallScore).toBe(0);
  });
});

// -- evaluateBehaviouralImpact -------------------------------------------------

describe("evaluateBehaviouralImpact", () => {
  it("returns 0 for empty outcomes", () => {
    const r = evaluateBehaviouralImpact([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalAssessments).toBe(0);
    expect(r.improvedTrendRate).toBe(0);
    expect(r.deEscalationRate).toBe(0);
    expect(r.lowRestraintRate).toBe(0);
    expect(r.positiveChildFeelingRate).toBe(0);
  });

  it("scores maximum for outstanding behavioural impact", () => {
    const outcomes = Array.from({ length: 10 }, (_, i) =>
      makeOutcome({
        id: `bo-${i}`,
        behaviourTrend: "improved",
        deEscalationSuccessful: true,
        restraintCount: 0,
        childReportedFeeling: "very_positive",
      }),
    );
    const r = evaluateBehaviouralImpact(outcomes);
    expect(r.overallScore).toBe(25);
  });

  it("scores improved trend at 80%+ tier (7 points)", () => {
    const outcomes = Array.from({ length: 10 }, (_, i) =>
      makeOutcome({
        id: `bo-${i}`,
        behaviourTrend: i < 8 ? "improved" : "stable",
        deEscalationSuccessful: false,
        restraintCount: 1,
        childReportedFeeling: "neutral",
      }),
    );
    const r = evaluateBehaviouralImpact(outcomes);
    expect(r.improvedTrendRate).toBe(80);
  });

  it("scores improved trend at 60-79% tier (5 points)", () => {
    const outcomes = Array.from({ length: 10 }, (_, i) =>
      makeOutcome({
        id: `bo-${i}`,
        behaviourTrend: i < 6 ? "significantly_improved" : "stable",
        deEscalationSuccessful: false,
        restraintCount: 1,
        childReportedFeeling: "neutral",
      }),
    );
    const r = evaluateBehaviouralImpact(outcomes);
    expect(r.improvedTrendRate).toBe(60);
  });

  it("scores improved trend at 40-59% tier (3 points)", () => {
    const outcomes = Array.from({ length: 10 }, (_, i) =>
      makeOutcome({
        id: `bo-${i}`,
        behaviourTrend: i < 4 ? "improved" : "stable",
        deEscalationSuccessful: false,
        restraintCount: 1,
        childReportedFeeling: "neutral",
      }),
    );
    const r = evaluateBehaviouralImpact(outcomes);
    expect(r.improvedTrendRate).toBe(40);
  });

  it("scores improved trend at >0% tier (1 point)", () => {
    const outcomes = Array.from({ length: 10 }, (_, i) =>
      makeOutcome({
        id: `bo-${i}`,
        behaviourTrend: i < 1 ? "improved" : "declined",
        deEscalationSuccessful: false,
        restraintCount: 1,
        childReportedFeeling: "neutral",
      }),
    );
    const r = evaluateBehaviouralImpact(outcomes);
    expect(r.improvedTrendRate).toBe(10);
  });

  it("counts significantly_improved as improved", () => {
    const outcomes = [
      makeOutcome({ behaviourTrend: "significantly_improved", deEscalationSuccessful: false, restraintCount: 1, childReportedFeeling: "neutral" }),
    ];
    const r = evaluateBehaviouralImpact(outcomes);
    expect(r.improvedTrendRate).toBe(100);
  });

  it("scores low restraint at 90%+ tier", () => {
    const outcomes = Array.from({ length: 10 }, (_, i) =>
      makeOutcome({
        id: `bo-${i}`,
        behaviourTrend: "stable",
        deEscalationSuccessful: false,
        restraintCount: 0,
        childReportedFeeling: "neutral",
      }),
    );
    const r = evaluateBehaviouralImpact(outcomes);
    expect(r.lowRestraintRate).toBe(100);
  });

  it("caps score at 25", () => {
    const outcomes = [makeOutcome()];
    const r = evaluateBehaviouralImpact(outcomes);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores zero for all negative outcomes", () => {
    const outcomes = Array.from({ length: 10 }, (_, i) =>
      makeOutcome({
        id: `bo-${i}`,
        behaviourTrend: "significantly_declined",
        deEscalationSuccessful: false,
        restraintCount: 3,
        childReportedFeeling: "negative",
      }),
    );
    const r = evaluateBehaviouralImpact(outcomes);
    expect(r.overallScore).toBe(0);
  });
});

// -- evaluateStaffReinforcementReadiness ---------------------------------------

describe("evaluateStaffReinforcementReadiness", () => {
  it("returns 0 for empty training", () => {
    const r = evaluateStaffReinforcementReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
  });

  it("scores maximum for fully trained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `st-${i}`, staffId: `s-${i}` }),
    );
    const r = evaluateStaffReinforcementReadiness(training);
    expect(r.overallScore).toBe(25);
  });

  it("scores positive behaviour at 90%+ (6 points)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `s-${i}`,
        positiveBehaviourSupport: true,
        therapeuticCareApproach: false,
        deEscalationTechniques: false,
        rewardSystemDesign: false,
        traumaInformedPraise: false,
        consistencyInApproach: false,
      }),
    );
    const r = evaluateStaffReinforcementReadiness(training);
    expect(r.positiveBehaviourRate).toBe(100);
  });

  it("scores positive behaviour at 70-89% (4 points)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `s-${i}`,
        positiveBehaviourSupport: i < 7,
        therapeuticCareApproach: false,
        deEscalationTechniques: false,
        rewardSystemDesign: false,
        traumaInformedPraise: false,
        consistencyInApproach: false,
      }),
    );
    const r = evaluateStaffReinforcementReadiness(training);
    expect(r.positiveBehaviourRate).toBe(70);
  });

  it("scores consistency at 90%+ (2 points)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `s-${i}`,
        positiveBehaviourSupport: false,
        therapeuticCareApproach: false,
        deEscalationTechniques: false,
        rewardSystemDesign: false,
        traumaInformedPraise: false,
        consistencyInApproach: true,
      }),
    );
    const r = evaluateStaffReinforcementReadiness(training);
    expect(r.consistencyRate).toBe(100);
  });

  it("scores consistency at 70-89% (1 point)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `s-${i}`,
        positiveBehaviourSupport: false,
        therapeuticCareApproach: false,
        deEscalationTechniques: false,
        rewardSystemDesign: false,
        traumaInformedPraise: false,
        consistencyInApproach: i < 7,
      }),
    );
    const r = evaluateStaffReinforcementReadiness(training);
    expect(r.consistencyRate).toBe(70);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const r = evaluateStaffReinforcementReadiness(training);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores zero for all untrained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `st-${i}`,
        staffId: `s-${i}`,
        positiveBehaviourSupport: false,
        therapeuticCareApproach: false,
        deEscalationTechniques: false,
        rewardSystemDesign: false,
        traumaInformedPraise: false,
        consistencyInApproach: false,
      }),
    );
    const r = evaluateStaffReinforcementReadiness(training);
    expect(r.overallScore).toBe(0);
  });
});

// -- buildChildReinforcementProfiles -------------------------------------------

describe("buildChildReinforcementProfiles", () => {
  it("returns empty array for no data", () => {
    expect(buildChildReinforcementProfiles([], [], [])).toEqual([]);
  });

  it("creates profile for child with praise only", () => {
    const praise = [makePraise({ childId: "c-1", childName: "Alex" })];
    const result = buildChildReinforcementProfiles(praise, [], []);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("c-1");
    expect(result[0].totalPraise).toBe(1);
    expect(result[0].totalRewards).toBe(0);
    expect(result[0].behaviourTrend).toBe("not_assessed");
  });

  it("creates profile for child with rewards only", () => {
    const rewards = [makeReward({ childId: "c-1", childName: "Alex" })];
    const result = buildChildReinforcementProfiles([], rewards, []);
    expect(result).toHaveLength(1);
    expect(result[0].totalRewards).toBe(1);
    expect(result[0].totalPraise).toBe(0);
  });

  it("creates profile for child with outcomes only", () => {
    const outcomes = [makeOutcome({ childId: "c-1", childName: "Alex" })];
    const result = buildChildReinforcementProfiles([], [], outcomes);
    expect(result).toHaveLength(1);
    expect(result[0].behaviourTrend).toBe("improved");
  });

  it("merges all data for same child", () => {
    const praise = [makePraise({ childId: "c-1" })];
    const rewards = [makeReward({ childId: "c-1" })];
    const outcomes = [makeOutcome({ childId: "c-1" })];
    const result = buildChildReinforcementProfiles(praise, rewards, outcomes);
    expect(result).toHaveLength(1);
    expect(result[0].totalPraise).toBe(1);
    expect(result[0].totalRewards).toBe(1);
  });

  it("handles multiple children", () => {
    const praise = [
      makePraise({ id: "p1", childId: "c-1", childName: "Alex" }),
      makePraise({ id: "p2", childId: "c-2", childName: "Jordan" }),
    ];
    const result = buildChildReinforcementProfiles(praise, [], []);
    expect(result).toHaveLength(2);
  });

  it("scores high praise (5+) at 3 points", () => {
    const praise = Array.from({ length: 5 }, (_, i) =>
      makePraise({ id: `p-${i}`, childId: "c-1", childName: "Alex", childResponse: "neutral" }),
    );
    const result = buildChildReinforcementProfiles(praise, [], []);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(3);
  });

  it("scores improved behaviour trend at 2 points", () => {
    const outcomes = [makeOutcome({ childId: "c-1", behaviourTrend: "improved", childReportedFeeling: "neutral" })];
    const result = buildChildReinforcementProfiles([], [], outcomes);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(2);
  });

  it("scores stable behaviour trend at 1 point", () => {
    const outcomes = [makeOutcome({ childId: "c-1", behaviourTrend: "stable", childReportedFeeling: "neutral" })];
    const result = buildChildReinforcementProfiles([], [], outcomes);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(1);
  });

  it("caps child score at 10", () => {
    const praise = Array.from({ length: 10 }, (_, i) =>
      makePraise({ id: `p-${i}`, childId: "c-1", childResponse: "very_positive" }),
    );
    const rewards = Array.from({ length: 5 }, (_, i) =>
      makeReward({ id: `r-${i}`, childId: "c-1" }),
    );
    const outcomes = [makeOutcome({ childId: "c-1", behaviourTrend: "significantly_improved", childReportedFeeling: "very_positive" })];
    const result = buildChildReinforcementProfiles(praise, rewards, outcomes);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("floors child score at 0", () => {
    const praise = [makePraise({ childId: "c-1", childResponse: "negative" })];
    const result = buildChildReinforcementProfiles(praise, [], []);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- generatePositiveReinforcementRewardsIntelligence --------------------------

describe("generatePositiveReinforcementRewardsIntelligence", () => {
  it("generates full assessment with all data", () => {
    const r = generatePositiveReinforcementRewardsIntelligence(
      [makePraise()], [makeReward()], [makeOutcome()], [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-19");
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(r.rating);
    expect(r.praiseRecognition).toBeDefined();
    expect(r.rewardSystem).toBeDefined();
    expect(r.behaviouralImpact).toBeDefined();
    expect(r.staffReinforcementReadiness).toBeDefined();
    expect(Array.isArray(r.childProfiles)).toBe(true);
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.areasForImprovement)).toBe(true);
    expect(Array.isArray(r.actions)).toBe(true);
    expect(Array.isArray(r.regulatoryLinks)).toBe(true);
  });

  it("generates assessment with all empty data", () => {
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("caps overall score at 100", () => {
    const praise = Array.from({ length: 20 }, (_, i) =>
      makePraise({
        id: `p-${i}`,
        praiseType: (["verbal", "written", "public_recognition", "reward_token", "certificate"] as const)[i % 5],
        childResponse: "very_positive",
      }),
    );
    const rewards = Array.from({ length: 20 }, (_, i) => makeReward({ id: `r-${i}` }));
    const outcomes = Array.from({ length: 10 }, (_, i) => makeOutcome({ id: `o-${i}` }));
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const r = generatePositiveReinforcementRewardsIntelligence(
      praise, rewards, outcomes, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates strength: children responding positively", () => {
    const praise = Array.from({ length: 10 }, (_, i) =>
      makePraise({ id: `p-${i}`, childResponse: "very_positive" }),
    );
    const r = generatePositiveReinforcementRewardsIntelligence(
      praise, [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain(
      "Children responding very positively to praise and recognition strategies",
    );
  });

  it("generates strength: praise specific and descriptive", () => {
    const praise = Array.from({ length: 10 }, (_, i) =>
      makePraise({ id: `p-${i}`, specificAndDescriptive: true }),
    );
    const r = generatePositiveReinforcementRewardsIntelligence(
      praise, [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain(
      "Praise consistently specific and descriptive — high quality reinforcement",
    );
  });

  it("generates strength: reward system child-led", () => {
    const rewards = Array.from({ length: 10 }, (_, i) =>
      makeReward({ id: `r-${i}`, childChosenReward: true }),
    );
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], rewards, [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain(
      "Reward system child-led — children choosing their own rewards",
    );
  });

  it("generates strength: improved behaviour trends", () => {
    const outcomes = Array.from({ length: 10 }, (_, i) =>
      makeOutcome({ id: `o-${i}`, behaviourTrend: "improved" }),
    );
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], [], outcomes, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain(
      "Strong evidence of improved behaviour trends linked to positive reinforcement",
    );
  });

  it("generates strength: staff fully trained", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], [], [], training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths).toContain(
      "Staff team fully trained in positive behaviour support",
    );
  });

  it("generates area for improvement: praise not specific", () => {
    const praise = Array.from({ length: 10 }, (_, i) =>
      makePraise({ id: `p-${i}`, specificAndDescriptive: i < 3 }),
    );
    const r = generatePositiveReinforcementRewardsIntelligence(
      praise, [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement).toContain(
      "Praise not consistently specific and descriptive — risk of generic reinforcement",
    );
  });

  it("generates area for improvement: children not choosing rewards", () => {
    const rewards = Array.from({ length: 10 }, (_, i) =>
      makeReward({ id: `r-${i}`, childChosenReward: i < 3 }),
    );
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], rewards, [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement).toContain(
      "Children not consistently involved in choosing their rewards",
    );
  });

  it("generates area for improvement: de-escalation low", () => {
    const outcomes = Array.from({ length: 10 }, (_, i) =>
      makeOutcome({ id: `o-${i}`, deEscalationSuccessful: i < 3 }),
    );
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], [], outcomes, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement).toContain(
      "De-escalation success rate below expected standard",
    );
  });

  it("generates URGENT action: no praise records", () => {
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "URGENT: No praise or recognition records — implement positive reinforcement tracking immediately",
    );
  });

  it("generates URGENT action: no reward records", () => {
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "URGENT: No reward system records — develop and implement reward strategy",
    );
  });

  it("generates URGENT action: no training records", () => {
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "URGENT: No staff training records for positive reinforcement — deliver comprehensive training",
    );
  });

  it("generates action for declining behaviour", () => {
    const outcomes = [
      makeOutcome({ id: "o-1", childId: "c-1", behaviourTrend: "declined" }),
      makeOutcome({ id: "o-2", childId: "c-2", behaviourTrend: "significantly_declined" }),
    ];
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], [], outcomes, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "2 child(ren) showing declining behaviour trends — review and adapt reinforcement strategies",
    );
  });

  it("generates action for restraint use", () => {
    const outcomes = [
      makeOutcome({ id: "o-1", restraintCount: 2 }),
    ];
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], [], outcomes, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.actions).toContain(
      "1 assessment(s) recording restraint use — review alternatives and de-escalation approach",
    );
  });

  it("includes all regulatory links", () => {
    const r = generatePositiveReinforcementRewardsIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks).toHaveLength(7);
    expect(r.regulatoryLinks[0]).toContain("CHR 2015 Reg 12");
    expect(r.regulatoryLinks[1]).toContain("CHR 2015 Reg 13");
    expect(r.regulatoryLinks[2]).toContain("SCCIF");
    expect(r.regulatoryLinks[3]).toContain("UNCRC Article 12");
    expect(r.regulatoryLinks[4]).toContain("Children Act 1989");
    expect(r.regulatoryLinks[5]).toContain("NMS 3");
    expect(r.regulatoryLinks[6]).toContain("Working Together 2023");
  });

  it("rating is outstanding when all 4 evaluators score high", () => {
    const praise = Array.from({ length: 10 }, (_, i) =>
      makePraise({
        id: `p-${i}`,
        praiseType: (["verbal", "written", "public_recognition", "reward_token", "certificate"] as const)[i % 5],
        childResponse: "very_positive",
      }),
    );
    const rewards = Array.from({ length: 10 }, (_, i) => makeReward({ id: `r-${i}` }));
    const outcomes = Array.from({ length: 10 }, (_, i) => makeOutcome({ id: `o-${i}`, childReportedFeeling: "very_positive" }));
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const r = generatePositiveReinforcementRewardsIntelligence(
      praise, rewards, outcomes, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.rating).toBe("outstanding");
  });

  it("child profiles include all children from praise, rewards, and outcomes", () => {
    const praise = [makePraise({ childId: "c-1", childName: "Alex" })];
    const rewards = [makeReward({ childId: "c-2", childName: "Jordan" })];
    const outcomes = [makeOutcome({ childId: "c-3", childName: "Morgan" })];
    const r = generatePositiveReinforcementRewardsIntelligence(
      praise, rewards, outcomes, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.childProfiles).toHaveLength(3);
    const names = r.childProfiles.map((c) => c.childName);
    expect(names).toContain("Alex");
    expect(names).toContain("Jordan");
    expect(names).toContain("Morgan");
  });
});
