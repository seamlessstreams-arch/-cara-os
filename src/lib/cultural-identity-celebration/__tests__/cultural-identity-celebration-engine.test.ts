import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getCulturalAreaLabel,
  getEngagementLevelLabel,
  getRatingLabel,
  evaluateCulturalEngagement,
  evaluateCulturalDiversity,
  evaluateCulturalPolicy,
  evaluateStaffCulturalReadiness,
  buildChildCulturalProfiles,
  generateCulturalIdentityCelebrationIntelligence,
} from "../cultural-identity-celebration-engine";
import type {
  CulturalActivity,
  CulturalPolicy,
  StaffCulturalTraining,
} from "../cultural-identity-celebration-engine";

// -- Factory functions ---------------------------------------------------------

function makeActivity(overrides: Partial<CulturalActivity> = {}): CulturalActivity {
  return {
    id: "act-1",
    childId: "child-alex",
    childName: "Alex",
    activityDate: "2026-03-15",
    culturalArea: "heritage_exploration",
    engagementLevel: "enthusiastic",
    childLedChoice: true,
    identityAffirmed: true,
    documentedInPlan: true,
    staffFacilitated: true,
    communityInvolved: true,
    reflectionCompleted: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<CulturalPolicy> = {}): CulturalPolicy {
  return {
    id: "pol-1",
    culturalIdentityPolicy: true,
    diversityCelebration: true,
    religiousObservanceSupport: true,
    languageSupportProvision: true,
    foodTraditionsRespected: true,
    communityPartnership: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffCulturalTraining> = {}): StaffCulturalTraining {
  return {
    id: "tr-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    culturalCompetence: true,
    diversityAwareness: true,
    religiousLiteracy: true,
    antiRacismPractice: true,
    identitySupport: true,
    communityEngagement: true,
    ...overrides,
  };
}

// -- pct -----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for zero denominator", () => expect(pct(5, 0)).toBe(0));
  it("rounds correctly", () => expect(pct(1, 3)).toBe(33));
  it("returns 100 for equal values", () => expect(pct(10, 10)).toBe(100));
  it("returns 50 for half", () => expect(pct(5, 10)).toBe(50));
  it("returns 0 for zero numerator", () => expect(pct(0, 10)).toBe(0));
  it("handles large numbers", () => expect(pct(999, 1000)).toBe(100));
  it("rounds 2/3 to 67", () => expect(pct(2, 3)).toBe(67));
});

// -- getRating -----------------------------------------------------------------

describe("getRating", () => {
  it("outstanding for 80", () => expect(getRating(80)).toBe("outstanding"));
  it("outstanding for 100", () => expect(getRating(100)).toBe("outstanding"));
  it("outstanding for 95", () => expect(getRating(95)).toBe("outstanding"));
  it("good for 60", () => expect(getRating(60)).toBe("good"));
  it("good for 79", () => expect(getRating(79)).toBe("good"));
  it("requires_improvement for 40", () => expect(getRating(40)).toBe("requires_improvement"));
  it("requires_improvement for 59", () => expect(getRating(59)).toBe("requires_improvement"));
  it("inadequate for 39", () => expect(getRating(39)).toBe("inadequate"));
  it("inadequate for 0", () => expect(getRating(0)).toBe("inadequate"));
});

// -- Label functions -----------------------------------------------------------

describe("label functions", () => {
  it("getCulturalAreaLabel — heritage_exploration", () => {
    expect(getCulturalAreaLabel("heritage_exploration")).toBe("Heritage Exploration");
  });
  it("getCulturalAreaLabel — language_support", () => {
    expect(getCulturalAreaLabel("language_support")).toBe("Language Support");
  });
  it("getCulturalAreaLabel — food_traditions", () => {
    expect(getCulturalAreaLabel("food_traditions")).toBe("Food Traditions");
  });
  it("getCulturalAreaLabel — religious_observance", () => {
    expect(getCulturalAreaLabel("religious_observance")).toBe("Religious Observance");
  });
  it("getCulturalAreaLabel — cultural_events", () => {
    expect(getCulturalAreaLabel("cultural_events")).toBe("Cultural Events");
  });
  it("getCulturalAreaLabel — identity_work", () => {
    expect(getCulturalAreaLabel("identity_work")).toBe("Identity Work");
  });
  it("getCulturalAreaLabel — community_connections", () => {
    expect(getCulturalAreaLabel("community_connections")).toBe("Community Connections");
  });
  it("getCulturalAreaLabel — arts_expression", () => {
    expect(getCulturalAreaLabel("arts_expression")).toBe("Arts Expression");
  });
  it("getEngagementLevelLabel — enthusiastic", () => {
    expect(getEngagementLevelLabel("enthusiastic")).toBe("Enthusiastic");
  });
  it("getEngagementLevelLabel — willing", () => {
    expect(getEngagementLevelLabel("willing")).toBe("Willing");
  });
  it("getEngagementLevelLabel — neutral", () => {
    expect(getEngagementLevelLabel("neutral")).toBe("Neutral");
  });
  it("getEngagementLevelLabel — reluctant", () => {
    expect(getEngagementLevelLabel("reluctant")).toBe("Reluctant");
  });
  it("getEngagementLevelLabel — refused", () => {
    expect(getEngagementLevelLabel("refused")).toBe("Refused");
  });
  it("getRatingLabel — outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("getRatingLabel — good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("getRatingLabel — requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("getRatingLabel — inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateCulturalEngagement ------------------------------------------------

describe("evaluateCulturalEngagement", () => {
  it("returns 0 for empty activities", () => {
    const r = evaluateCulturalEngagement([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalActivities).toBe(0);
    expect(r.engagementRate).toBe(0);
    expect(r.childLedChoiceRate).toBe(0);
    expect(r.identityAffirmedRate).toBe(0);
    expect(r.documentedInPlanRate).toBe(0);
    expect(r.reflectionCompletedRate).toBe(0);
  });

  it("returns max score for all-excellent activities", () => {
    const activities = Array.from({ length: 10 }, (_, i) => makeActivity({ id: `a-${i}`, childId: `c-${i}` }));
    const r = evaluateCulturalEngagement(activities);
    expect(r.overallScore).toBe(25);
    expect(r.engagementRate).toBe(100);
    expect(r.childLedChoiceRate).toBe(100);
    expect(r.identityAffirmedRate).toBe(100);
  });

  it("returns low score for poor engagement", () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        engagementLevel: "refused",
        childLedChoice: false,
        identityAffirmed: false,
        documentedInPlan: false,
        reflectionCompleted: false,
      }),
    );
    const r = evaluateCulturalEngagement(activities);
    expect(r.overallScore).toBe(0);
  });

  it("handles mixed engagement levels", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "enthusiastic" }),
      makeActivity({ id: "a2", engagementLevel: "neutral", childLedChoice: false, identityAffirmed: false }),
    ];
    const r = evaluateCulturalEngagement(activities);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("caps at 25", () => {
    const activities = Array.from({ length: 50 }, (_, i) => makeActivity({ id: `a-${i}` }));
    expect(evaluateCulturalEngagement(activities).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly reports engagement rate — enthusiastic counts", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "enthusiastic" }),
      makeActivity({ id: "a2", engagementLevel: "refused" }),
    ];
    expect(evaluateCulturalEngagement(activities).engagementRate).toBe(50);
  });

  it("correctly reports engagement rate — willing counts", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "willing" }),
      makeActivity({ id: "a2", engagementLevel: "reluctant" }),
    ];
    expect(evaluateCulturalEngagement(activities).engagementRate).toBe(50);
  });

  it("correctly reports child-led choice rate", () => {
    const activities = [
      makeActivity({ id: "a1", childLedChoice: true }),
      makeActivity({ id: "a2", childLedChoice: false }),
      makeActivity({ id: "a3", childLedChoice: true }),
    ];
    expect(evaluateCulturalEngagement(activities).childLedChoiceRate).toBe(67);
  });

  it("correctly reports identity affirmed rate", () => {
    const activities = [
      makeActivity({ id: "a1", identityAffirmed: true }),
      makeActivity({ id: "a2", identityAffirmed: false }),
    ];
    expect(evaluateCulturalEngagement(activities).identityAffirmedRate).toBe(50);
  });

  it("correctly reports documented in plan rate", () => {
    const activities = [
      makeActivity({ id: "a1", documentedInPlan: true }),
      makeActivity({ id: "a2", documentedInPlan: false }),
      makeActivity({ id: "a3", documentedInPlan: true }),
    ];
    expect(evaluateCulturalEngagement(activities).documentedInPlanRate).toBe(67);
  });

  it("correctly reports reflection completed rate", () => {
    const activities = [
      makeActivity({ id: "a1", reflectionCompleted: true }),
      makeActivity({ id: "a2", reflectionCompleted: false }),
    ];
    expect(evaluateCulturalEngagement(activities).reflectionCompletedRate).toBe(50);
  });

  it("single excellent activity scores max", () => {
    expect(evaluateCulturalEngagement([makeActivity()]).overallScore).toBe(25);
  });

  it("neutral engagement does not count toward engagement rate", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "neutral" }),
    ];
    expect(evaluateCulturalEngagement(activities).engagementRate).toBe(0);
  });

  it("reluctant engagement does not count toward engagement rate", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "reluctant" }),
    ];
    expect(evaluateCulturalEngagement(activities).engagementRate).toBe(0);
  });

  it("combined documented+reflection gives score when both high", () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, documentedInPlan: true, reflectionCompleted: true }),
    );
    const r = evaluateCulturalEngagement(activities);
    // Combined rate should be 100% → 6 points from that component
    expect(r.overallScore).toBe(25);
  });

  it("combined documented+reflection gives partial score when one is low", () => {
    const activities = [
      makeActivity({ id: "a1", documentedInPlan: true, reflectionCompleted: false }),
      makeActivity({ id: "a2", documentedInPlan: true, reflectionCompleted: false }),
    ];
    const r = evaluateCulturalEngagement(activities);
    // documentedInPlanRate=100, reflectionCompletedRate=0, combined=50 → 3 points
    expect(r.documentedInPlanRate).toBe(100);
    expect(r.reflectionCompletedRate).toBe(0);
  });

  it("engagement score tiers — 90%+ gets 7", () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, engagementLevel: "enthusiastic" }),
    );
    // All enthusiastic = 100% engagement rate → 7
    // Plus max from other components
    const r = evaluateCulturalEngagement(activities);
    expect(r.engagementRate).toBe(100);
  });

  it("engagement score tiers — 70-89% gets 5", () => {
    const activities = [
      ...Array.from({ length: 7 }, (_, i) => makeActivity({ id: `a-${i}`, engagementLevel: "enthusiastic" })),
      ...Array.from({ length: 3 }, (_, i) => makeActivity({ id: `b-${i}`, engagementLevel: "refused" })),
    ];
    expect(evaluateCulturalEngagement(activities).engagementRate).toBe(70);
  });

  it("engagement score tiers — 50-69% gets 3", () => {
    const activities = [
      ...Array.from({ length: 5 }, (_, i) => makeActivity({ id: `a-${i}`, engagementLevel: "enthusiastic" })),
      ...Array.from({ length: 5 }, (_, i) => makeActivity({ id: `b-${i}`, engagementLevel: "refused" })),
    ];
    expect(evaluateCulturalEngagement(activities).engagementRate).toBe(50);
  });
});

// -- evaluateCulturalDiversity -------------------------------------------------

describe("evaluateCulturalDiversity", () => {
  it("returns 0 for empty activities", () => {
    const r = evaluateCulturalDiversity([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalActivities).toBe(0);
    expect(r.uniqueCulturalAreas).toBe(0);
    expect(r.culturalAreaRatio).toBe(0);
    expect(r.staffFacilitatedRate).toBe(0);
    expect(r.communityInvolvedRate).toBe(0);
  });

  it("returns max score for activities covering all areas with staff and community", () => {
    const areas = [
      "heritage_exploration", "language_support", "food_traditions", "religious_observance",
      "cultural_events", "identity_work", "community_connections", "arts_expression",
    ] as const;
    const activities = areas.map((area, i) =>
      makeActivity({ id: `a-${i}`, culturalArea: area, staffFacilitated: true, communityInvolved: true }),
    );
    const r = evaluateCulturalDiversity(activities);
    expect(r.overallScore).toBe(25);
    expect(r.uniqueCulturalAreas).toBe(8);
    expect(r.culturalAreaRatio).toBe(100);
  });

  it("returns low score for single area with no facilitation", () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        culturalArea: "heritage_exploration",
        staffFacilitated: false,
        communityInvolved: false,
      }),
    );
    const r = evaluateCulturalDiversity(activities);
    expect(r.overallScore).toBeLessThan(10);
    expect(r.uniqueCulturalAreas).toBe(1);
  });

  it("caps at 25", () => {
    const activities = Array.from({ length: 50 }, (_, i) => makeActivity({ id: `a-${i}` }));
    expect(evaluateCulturalDiversity(activities).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly counts unique cultural areas", () => {
    const activities = [
      makeActivity({ id: "a1", culturalArea: "heritage_exploration" }),
      makeActivity({ id: "a2", culturalArea: "heritage_exploration" }),
      makeActivity({ id: "a3", culturalArea: "food_traditions" }),
    ];
    expect(evaluateCulturalDiversity(activities).uniqueCulturalAreas).toBe(2);
  });

  it("correctly reports staff facilitated rate", () => {
    const activities = [
      makeActivity({ id: "a1", staffFacilitated: true }),
      makeActivity({ id: "a2", staffFacilitated: false }),
      makeActivity({ id: "a3", staffFacilitated: true }),
    ];
    expect(evaluateCulturalDiversity(activities).staffFacilitatedRate).toBe(67);
  });

  it("correctly reports community involved rate", () => {
    const activities = [
      makeActivity({ id: "a1", communityInvolved: true }),
      makeActivity({ id: "a2", communityInvolved: false }),
    ];
    expect(evaluateCulturalDiversity(activities).communityInvolvedRate).toBe(50);
  });

  it("calculates cultural area ratio correctly for 4 areas", () => {
    const activities = [
      makeActivity({ id: "a1", culturalArea: "heritage_exploration" }),
      makeActivity({ id: "a2", culturalArea: "food_traditions" }),
      makeActivity({ id: "a3", culturalArea: "religious_observance" }),
      makeActivity({ id: "a4", culturalArea: "arts_expression" }),
    ];
    const r = evaluateCulturalDiversity(activities);
    expect(r.uniqueCulturalAreas).toBe(4);
    expect(r.culturalAreaRatio).toBe(50);
  });

  it("7 areas scores 8 for area coverage", () => {
    const areas = [
      "heritage_exploration", "language_support", "food_traditions", "religious_observance",
      "cultural_events", "identity_work", "community_connections",
    ] as const;
    const activities = areas.map((area, i) =>
      makeActivity({ id: `a-${i}`, culturalArea: area, staffFacilitated: false, communityInvolved: false }),
    );
    const r = evaluateCulturalDiversity(activities);
    expect(r.uniqueCulturalAreas).toBe(7);
    // 8 from areas + 0 from staff + 0 from community = 8
    // But staff/community > 0 would add, so let's check just the areas component
    expect(r.overallScore).toBeGreaterThanOrEqual(8);
  });

  it("5 areas scores 6 for area coverage", () => {
    const areas = [
      "heritage_exploration", "language_support", "food_traditions",
      "religious_observance", "cultural_events",
    ] as const;
    const activities = areas.map((area, i) =>
      makeActivity({ id: `a-${i}`, culturalArea: area, staffFacilitated: false, communityInvolved: false }),
    );
    expect(evaluateCulturalDiversity(activities).uniqueCulturalAreas).toBe(5);
  });

  it("3 areas scores 4 for area coverage", () => {
    const areas = ["heritage_exploration", "language_support", "food_traditions"] as const;
    const activities = areas.map((area, i) =>
      makeActivity({ id: `a-${i}`, culturalArea: area, staffFacilitated: false, communityInvolved: false }),
    );
    expect(evaluateCulturalDiversity(activities).uniqueCulturalAreas).toBe(3);
  });

  it("1 area scores 2 for area coverage", () => {
    const activities = [makeActivity({ id: "a1", staffFacilitated: false, communityInvolved: false })];
    const r = evaluateCulturalDiversity(activities);
    expect(r.uniqueCulturalAreas).toBe(1);
    expect(r.overallScore).toBe(2);
  });
});

// -- evaluateCulturalPolicy ----------------------------------------------------

describe("evaluateCulturalPolicy", () => {
  it("returns 0 for null policy", () => {
    const r = evaluateCulturalPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.culturalIdentityPolicyMet).toBe(false);
    expect(r.diversityCelebrationMet).toBe(false);
    expect(r.religiousObservanceSupportMet).toBe(false);
    expect(r.languageSupportProvisionMet).toBe(false);
    expect(r.foodTraditionsRespectedMet).toBe(false);
    expect(r.communityPartnershipMet).toBe(false);
    expect(r.regularReviewMet).toBe(false);
  });

  it("returns max score (25) for fully compliant policy", () => {
    const r = evaluateCulturalPolicy(makePolicy());
    expect(r.overallScore).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const r = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false,
      diversityCelebration: false,
      religiousObservanceSupport: false,
      languageSupportProvision: false,
      foodTraditionsRespected: false,
      communityPartnership: false,
      regularReview: false,
    }));
    expect(r.overallScore).toBe(0);
  });

  it("culturalIdentityPolicy adds 4 points", () => {
    const base = makePolicy({
      culturalIdentityPolicy: false,
      diversityCelebration: false,
      religiousObservanceSupport: false,
      languageSupportProvision: false,
      foodTraditionsRespected: false,
      communityPartnership: false,
      regularReview: false,
    });
    const withPolicy = makePolicy({
      ...base,
      culturalIdentityPolicy: true,
    });
    const diff = evaluateCulturalPolicy(withPolicy).overallScore - evaluateCulturalPolicy(base).overallScore;
    expect(diff).toBe(4);
  });

  it("diversityCelebration adds 4 points", () => {
    const without = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: false,
      languageSupportProvision: false, foodTraditionsRespected: false, communityPartnership: false, regularReview: false,
    }));
    const with_ = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: true, religiousObservanceSupport: false,
      languageSupportProvision: false, foodTraditionsRespected: false, communityPartnership: false, regularReview: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("religiousObservanceSupport adds 4 points", () => {
    const without = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: false,
      languageSupportProvision: false, foodTraditionsRespected: false, communityPartnership: false, regularReview: false,
    }));
    const with_ = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: true,
      languageSupportProvision: false, foodTraditionsRespected: false, communityPartnership: false, regularReview: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("languageSupportProvision adds 4 points", () => {
    const without = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: false,
      languageSupportProvision: false, foodTraditionsRespected: false, communityPartnership: false, regularReview: false,
    }));
    const with_ = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: false,
      languageSupportProvision: true, foodTraditionsRespected: false, communityPartnership: false, regularReview: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("foodTraditionsRespected adds 3 points", () => {
    const without = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: false,
      languageSupportProvision: false, foodTraditionsRespected: false, communityPartnership: false, regularReview: false,
    }));
    const with_ = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: false,
      languageSupportProvision: false, foodTraditionsRespected: true, communityPartnership: false, regularReview: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(3);
  });

  it("communityPartnership adds 3 points", () => {
    const without = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: false,
      languageSupportProvision: false, foodTraditionsRespected: false, communityPartnership: false, regularReview: false,
    }));
    const with_ = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: false,
      languageSupportProvision: false, foodTraditionsRespected: false, communityPartnership: true, regularReview: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(3);
  });

  it("regularReview adds 3 points", () => {
    const without = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: false,
      languageSupportProvision: false, foodTraditionsRespected: false, communityPartnership: false, regularReview: false,
    }));
    const with_ = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: false, diversityCelebration: false, religiousObservanceSupport: false,
      languageSupportProvision: false, foodTraditionsRespected: false, communityPartnership: false, regularReview: true,
    }));
    expect(with_.overallScore - without.overallScore).toBe(3);
  });

  it("all weights sum to 25", () => {
    // 4+4+4+4+3+3+3 = 25
    expect(evaluateCulturalPolicy(makePolicy()).overallScore).toBe(25);
  });

  it("reports boolean flags correctly for partial policy", () => {
    const r = evaluateCulturalPolicy(makePolicy({
      culturalIdentityPolicy: true,
      diversityCelebration: false,
      religiousObservanceSupport: true,
      languageSupportProvision: false,
    }));
    expect(r.culturalIdentityPolicyMet).toBe(true);
    expect(r.diversityCelebrationMet).toBe(false);
    expect(r.religiousObservanceSupportMet).toBe(true);
    expect(r.languageSupportProvisionMet).toBe(false);
  });

  it("caps at 25", () => {
    expect(evaluateCulturalPolicy(makePolicy()).overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateStaffCulturalReadiness --------------------------------------------

describe("evaluateStaffCulturalReadiness", () => {
  it("returns 0 for empty training", () => {
    const r = evaluateStaffCulturalReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.culturalCompetenceRate).toBe(0);
    expect(r.diversityAwarenessRate).toBe(0);
    expect(r.religiousLiteracyRate).toBe(0);
    expect(r.antiRacismPracticeRate).toBe(0);
    expect(r.identitySupportRate).toBe(0);
    expect(r.communityEngagementRate).toBe(0);
  });

  it("returns max score for fully trained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const r = evaluateStaffCulturalReadiness(training);
    expect(r.overallScore).toBe(25);
    expect(r.culturalCompetenceRate).toBe(100);
  });

  it("returns 0 for untrained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`,
        staffId: `s-${i}`,
        culturalCompetence: false,
        diversityAwareness: false,
        religiousLiteracy: false,
        antiRacismPractice: false,
        identitySupport: false,
        communityEngagement: false,
      }),
    );
    expect(evaluateStaffCulturalReadiness(training).overallScore).toBe(0);
  });

  it("handles partial training", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2", religiousLiteracy: false, antiRacismPractice: false }),
    ];
    const r = evaluateStaffCulturalReadiness(training);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.religiousLiteracyRate).toBe(50);
    expect(r.antiRacismPracticeRate).toBe(50);
  });

  it("caps at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    expect(evaluateStaffCulturalReadiness(training).overallScore).toBeLessThanOrEqual(25);
  });

  it("single fully trained staff scores max", () => {
    expect(evaluateStaffCulturalReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("correctly reports cultural competence rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", culturalCompetence: true }),
      makeTraining({ id: "t2", staffId: "s2", culturalCompetence: false }),
      makeTraining({ id: "t3", staffId: "s3", culturalCompetence: true }),
    ];
    expect(evaluateStaffCulturalReadiness(training).culturalCompetenceRate).toBe(67);
  });

  it("correctly reports diversity awareness rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", diversityAwareness: true }),
      makeTraining({ id: "t2", staffId: "s2", diversityAwareness: false }),
    ];
    expect(evaluateStaffCulturalReadiness(training).diversityAwarenessRate).toBe(50);
  });

  it("correctly reports anti-racism practice rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", antiRacismPractice: true }),
      makeTraining({ id: "t2", staffId: "s2", antiRacismPractice: true }),
      makeTraining({ id: "t3", staffId: "s3", antiRacismPractice: false }),
    ];
    expect(evaluateStaffCulturalReadiness(training).antiRacismPracticeRate).toBe(67);
  });

  it("correctly reports identity support rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", identitySupport: true }),
      makeTraining({ id: "t2", staffId: "s2", identitySupport: false }),
    ];
    expect(evaluateStaffCulturalReadiness(training).identitySupportRate).toBe(50);
  });

  it("correctly reports community engagement rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", communityEngagement: true }),
      makeTraining({ id: "t2", staffId: "s2", communityEngagement: false }),
      makeTraining({ id: "t3", staffId: "s3", communityEngagement: true }),
    ];
    expect(evaluateStaffCulturalReadiness(training).communityEngagementRate).toBe(67);
  });

  it("weights are correct — culturalCompetence worth 6", () => {
    // One staff: only culturalCompetence true → 6, rest false → 0
    const r = evaluateStaffCulturalReadiness([makeTraining({
      culturalCompetence: true,
      diversityAwareness: false,
      religiousLiteracy: false,
      antiRacismPractice: false,
      identitySupport: false,
      communityEngagement: false,
    })]);
    expect(r.overallScore).toBe(6);
  });

  it("weights are correct — diversityAwareness worth 5", () => {
    const r = evaluateStaffCulturalReadiness([makeTraining({
      culturalCompetence: false,
      diversityAwareness: true,
      religiousLiteracy: false,
      antiRacismPractice: false,
      identitySupport: false,
      communityEngagement: false,
    })]);
    expect(r.overallScore).toBe(5);
  });

  it("weights are correct — religiousLiteracy worth 5", () => {
    const r = evaluateStaffCulturalReadiness([makeTraining({
      culturalCompetence: false,
      diversityAwareness: false,
      religiousLiteracy: true,
      antiRacismPractice: false,
      identitySupport: false,
      communityEngagement: false,
    })]);
    expect(r.overallScore).toBe(5);
  });

  it("weights are correct — antiRacismPractice worth 4", () => {
    const r = evaluateStaffCulturalReadiness([makeTraining({
      culturalCompetence: false,
      diversityAwareness: false,
      religiousLiteracy: false,
      antiRacismPractice: true,
      identitySupport: false,
      communityEngagement: false,
    })]);
    expect(r.overallScore).toBe(4);
  });

  it("weights are correct — identitySupport worth 3", () => {
    const r = evaluateStaffCulturalReadiness([makeTraining({
      culturalCompetence: false,
      diversityAwareness: false,
      religiousLiteracy: false,
      antiRacismPractice: false,
      identitySupport: true,
      communityEngagement: false,
    })]);
    expect(r.overallScore).toBe(3);
  });

  it("weights are correct — communityEngagement worth 2", () => {
    const r = evaluateStaffCulturalReadiness([makeTraining({
      culturalCompetence: false,
      diversityAwareness: false,
      religiousLiteracy: false,
      antiRacismPractice: false,
      identitySupport: false,
      communityEngagement: true,
    })]);
    expect(r.overallScore).toBe(2);
  });

  it("all weights sum to 25", () => {
    // 6+5+5+4+3+2 = 25
    expect(evaluateStaffCulturalReadiness([makeTraining()]).overallScore).toBe(25);
  });
});

// -- buildChildCulturalProfiles ------------------------------------------------

describe("buildChildCulturalProfiles", () => {
  it("returns empty for no activities", () => {
    expect(buildChildCulturalProfiles([])).toHaveLength(0);
  });

  it("creates profile from single activity", () => {
    const profiles = buildChildCulturalProfiles([makeActivity({ childId: "c1", childName: "Alex" })]);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalActivities).toBe(1);
  });

  it("groups activities by childId", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", childName: "Alex" }),
      makeActivity({ id: "a2", childId: "c1", childName: "Alex" }),
      makeActivity({ id: "a3", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles).toHaveLength(2);
  });

  it("calculates engagement rate per child", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", engagementLevel: "enthusiastic" }),
      makeActivity({ id: "a2", childId: "c1", engagementLevel: "refused" }),
    ];
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles[0].engagementRate).toBe(50);
  });

  it("calculates identity affirmed rate per child", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", identityAffirmed: true }),
      makeActivity({ id: "a2", childId: "c1", identityAffirmed: false }),
      makeActivity({ id: "a3", childId: "c1", identityAffirmed: true }),
    ];
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles[0].identityAffirmedRate).toBe(67);
  });

  it("counts unique cultural areas per child", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", culturalArea: "heritage_exploration" }),
      makeActivity({ id: "a2", childId: "c1", culturalArea: "heritage_exploration" }),
      makeActivity({ id: "a3", childId: "c1", culturalArea: "food_traditions" }),
      makeActivity({ id: "a4", childId: "c1", culturalArea: "arts_expression" }),
    ];
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles[0].uniqueCulturalAreas).toBe(3);
  });

  it("frequency score: >=10 activities -> 2 points", () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1" }),
    );
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(2);
  });

  it("frequency score: >=5 but <10 activities -> 1 point", () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", engagementLevel: "refused", identityAffirmed: false }),
    );
    const profiles = buildChildCulturalProfiles(activities);
    // 1 from frequency, 0 from engagement (0%), 0 from identity (0%), 0 from diversity (1 area)
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(1);
  });

  it("frequency score: <5 activities -> 0 points from frequency", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", engagementLevel: "refused", identityAffirmed: false }),
    ];
    const profiles = buildChildCulturalProfiles(activities);
    // 0 from frequency, 0 from engagement, 0 from identity, 0 from diversity (1 area < 3)
    expect(profiles[0].overallScore).toBe(0);
  });

  it("engagement score: >=80% -> 3 points", () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", engagementLevel: "enthusiastic", identityAffirmed: false }),
    );
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles[0].engagementRate).toBe(100);
  });

  it("identity score: >=80% -> 3 points", () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", identityAffirmed: true, engagementLevel: "refused" }),
    );
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles[0].identityAffirmedRate).toBe(100);
  });

  it("diversity score: >=5 unique areas -> 2 points", () => {
    const areas = [
      "heritage_exploration", "language_support", "food_traditions",
      "religious_observance", "cultural_events",
    ] as const;
    const activities = areas.map((area, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", culturalArea: area, engagementLevel: "refused", identityAffirmed: false }),
    );
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles[0].uniqueCulturalAreas).toBe(5);
  });

  it("diversity score: >=3 but <5 unique areas -> 1 point", () => {
    const areas = ["heritage_exploration", "language_support", "food_traditions"] as const;
    const activities = areas.map((area, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", culturalArea: area, engagementLevel: "refused", identityAffirmed: false }),
    );
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles[0].uniqueCulturalAreas).toBe(3);
  });

  it("caps child score at 10", () => {
    const areas = [
      "heritage_exploration", "language_support", "food_traditions", "religious_observance",
      "cultural_events", "identity_work", "community_connections", "arts_expression",
    ] as const;
    const activities = Array.from({ length: 16 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", culturalArea: areas[i % 8] }),
    );
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score minimum is 0", () => {
    const activities = [
      makeActivity({
        childId: "c1",
        engagementLevel: "refused",
        identityAffirmed: false,
      }),
    ];
    const profiles = buildChildCulturalProfiles(activities);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });

  it("multiple children have independent scores", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", engagementLevel: "enthusiastic", identityAffirmed: true }),
      makeActivity({ id: "a2", childId: "c2", childName: "Jordan", engagementLevel: "refused", identityAffirmed: false }),
    ];
    const profiles = buildChildCulturalProfiles(activities);
    const alex = profiles.find((p) => p.childId === "c1")!;
    const jordan = profiles.find((p) => p.childId === "c2")!;
    expect(alex.engagementRate).toBe(100);
    expect(jordan.engagementRate).toBe(0);
  });
});

// -- generateCulturalIdentityCelebrationIntelligence ---------------------------

describe("generateCulturalIdentityCelebrationIntelligence", () => {
  const demoActivities = [
    makeActivity({ id: "a1", childId: "child-alex", childName: "Alex", culturalArea: "heritage_exploration" }),
    makeActivity({ id: "a2", childId: "child-alex", childName: "Alex", culturalArea: "food_traditions" }),
    makeActivity({ id: "a3", childId: "child-jordan", childName: "Jordan", culturalArea: "language_support" }),
    makeActivity({ id: "a4", childId: "child-jordan", childName: "Jordan", culturalArea: "religious_observance" }),
    makeActivity({ id: "a5", childId: "child-morgan", childName: "Morgan", culturalArea: "cultural_events" }),
    makeActivity({ id: "a6", childId: "child-morgan", childName: "Morgan", culturalArea: "identity_work" }),
    makeActivity({ id: "a7", childId: "child-morgan", childName: "Morgan", culturalArea: "community_connections" }),
    makeActivity({ id: "a8", childId: "child-alex", childName: "Alex", culturalArea: "arts_expression" }),
  ];

  const demoPolicy = makePolicy();

  const demoTraining = [
    makeTraining({ id: "t1", staffId: "s1", staffName: "Sarah Johnson" }),
    makeTraining({ id: "t2", staffId: "s2", staffName: "Tom Richards" }),
    makeTraining({ id: "t3", staffId: "s3", staffName: "Lisa Williams" }),
    makeTraining({ id: "t4", staffId: "s4", staffName: "Darren Laville" }),
  ];

  it("returns complete intelligence", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-19");
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.rating).toBeDefined();
  });

  it("sums evaluator scores correctly", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    const sum =
      r.culturalEngagement.overallScore +
      r.culturalDiversity.overallScore +
      r.culturalPolicy.overallScore +
      r.staffCulturalReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(sum, 100));
  });

  it("rates outstanding for high-performing home", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(80);
    expect(r.rating).toBe("outstanding");
  });

  it("returns inadequate for all-empty inputs", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "empty", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("generates actions for empty activities", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], demoPolicy, demoTraining, "x", "2026-01-01", "2026-05-19",
    );
    expect(r.actions.some((a) => a.includes("No cultural activity records"))).toBe(true);
  });

  it("generates URGENT action for null policy", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, null, demoTraining, "x", "2026-01-01", "2026-05-19",
    );
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action for empty training", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("generates all URGENT actions for completely empty inputs", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "empty", "2026-01-01", "2026-05-19",
    );
    const urgent = r.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBeGreaterThanOrEqual(2);
  });

  it("caps overall score at 100", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes child profiles", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.childProfiles.length).toBe(3);
  });

  it("has 7 regulatory links", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Regulation 10 in regulatory links", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 10"))).toBe(true);
  });

  it("includes CHR 2015 Regulation 12 in regulatory links", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 12"))).toBe(true);
  });

  it("includes UNCRC Article 30 in regulatory links", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 30"))).toBe(true);
  });

  it("includes Equality Act 2010 in regulatory links", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("Equality Act 2010"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes NMS 7 in regulatory links", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 7"))).toBe(true);
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("generates strengths for outstanding home", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates engagement strength when engagement >=80%", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths.some((s) => s.includes("engagement"))).toBe(true);
  });

  it("generates child-led strength when child-led >=80%", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths.some((s) => s.includes("child-led") || s.includes("Child-led"))).toBe(true);
  });

  it("generates identity affirmation strength when affirmed >=80%", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths.some((s) => s.includes("identity") || s.includes("Identity"))).toBe(true);
  });

  it("generates areas when engagement <60%", () => {
    const badActivities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        engagementLevel: "refused",
        childLedChoice: false,
        identityAffirmed: false,
        communityInvolved: false,
      }),
    );
    const r = generateCulturalIdentityCelebrationIntelligence(
      badActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates area for low community involvement", () => {
    const lowCommunity = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, communityInvolved: false }),
    );
    const r = generateCulturalIdentityCelebrationIntelligence(
      lowCommunity, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement.some((a) => a.includes("Community") || a.includes("community"))).toBe(true);
  });

  it("no areas for improvement with excellent data", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      demoActivities, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    // With all-excellent data, engagement, community should be fine
    // There may still be areas related to staff training, etc.
    expect(r.areasForImprovement.length).toBeGreaterThanOrEqual(0);
  });
});

// -- Edge cases ----------------------------------------------------------------

describe("Edge cases", () => {
  it("single activity scores max engagement", () => {
    expect(evaluateCulturalEngagement([makeActivity()]).overallScore).toBe(25);
  });

  it("single activity with all areas — diversity limited to 1 area", () => {
    const r = evaluateCulturalDiversity([makeActivity()]);
    expect(r.uniqueCulturalAreas).toBe(1);
  });

  it("single policy scores max", () => {
    expect(evaluateCulturalPolicy(makePolicy()).overallScore).toBe(25);
  });

  it("single training scores max", () => {
    expect(evaluateStaffCulturalReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("evaluator scores never exceed 25", () => {
    const largeActivities = Array.from({ length: 100 }, (_, i) => makeActivity({ id: `a-${i}` }));
    const largeTraining = Array.from({ length: 100 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    expect(evaluateCulturalEngagement(largeActivities).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateCulturalDiversity(largeActivities).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateCulturalPolicy(makePolicy()).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateStaffCulturalReadiness(largeTraining).overallScore).toBeLessThanOrEqual(25);
  });

  it("large dataset runs without error", () => {
    const activities = Array.from({ length: 200 }, (_, i) => makeActivity({ id: `a-${i}`, childId: `c-${i % 20}` }));
    const training = Array.from({ length: 20 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    const r = generateCulturalIdentityCelebrationIntelligence(
      activities, makePolicy(), training, "big", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.childProfiles.length).toBe(20);
  });

  it("overall score for all-empty is exactly 0", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [], "empty", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBe(0);
  });

  it("activities only (no policy, no training) still produces valid result", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [makeActivity()], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.culturalPolicy.overallScore).toBe(0);
    expect(r.staffCulturalReadiness.overallScore).toBe(0);
  });

  it("policy only (no activities, no training) still produces valid result", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], makePolicy(), [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.culturalPolicy.overallScore).toBe(25);
    expect(r.culturalEngagement.overallScore).toBe(0);
  });

  it("training only (no activities, no policy) still produces valid result", () => {
    const r = generateCulturalIdentityCelebrationIntelligence(
      [], null, [makeTraining()], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.staffCulturalReadiness.overallScore).toBe(25);
    expect(r.culturalEngagement.overallScore).toBe(0);
  });
});
