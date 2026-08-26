// ==============================================================================
// Cara Outdoor Activity & Enrichment Intelligence — Engine Tests
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateActivityParticipation,
  evaluateEnrichmentQuality,
  evaluateRiskManagement,
  evaluateStaffReadiness,
  buildChildEnrichmentProfiles,
  generateOutdoorActivityEnrichmentIntelligence,
  getRating,
  getActivityCategoryLabel,
  getRiskBenefitOutcomeLabel,
  getChildEngagementLabel,
  getActivityFrequencyLabel,
  getWeatherConditionLabel,
  getRatingLabel,
} from "../outdoor-activity-enrichment-engine";
import type {
  ActivityRecord,
  EnrichmentPlan,
  RiskBenefitAssessment,
  StaffActivityTraining,
  ActivityCategory,
  RiskBenefitOutcome,
  ChildEngagement,
  ActivityFrequency,
  WeatherCondition,
  Rating,
} from "../outdoor-activity-enrichment-engine";

// -- Constants ----------------------------------------------------------------

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

// -- Factories ----------------------------------------------------------------

function makeActivity(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return {
    id: "act-001",
    childId: "child-alex",
    childName: "Alex",
    category: "outdoor_adventure",
    date: "2026-03-15",
    description: "Forest trail walk",
    duration: 120,
    location: "Local Forest",
    staffLed: true,
    childChose: true,
    riskBenefitAssessed: true,
    riskBenefitOutcome: "good",
    childEngagement: "enthusiastic",
    outdoors: true,
    communityBased: true,
    newExperience: true,
    peersInvolved: true,
    ...overrides,
  };
}

function makePlan(overrides: Partial<EnrichmentPlan> = {}): EnrichmentPlan {
  return {
    id: "plan-001",
    childId: "child-alex",
    childName: "Alex",
    planDate: "2026-01-15",
    reviewDate: "2026-04-15",
    interestsIdentified: ["hiking", "art"],
    activitiesPlanned: 10,
    activitiesCompleted: 8,
    childContributed: true,
    diverseRange: true,
    barrierIdentified: null,
    barrierAddressed: null,
    ...overrides,
  };
}

function makeRiskAssessment(
  overrides: Partial<RiskBenefitAssessment> = {},
): RiskBenefitAssessment {
  return {
    id: "ra-001",
    activityId: "act-001",
    assessedBy: "Sarah Johnson",
    assessDate: "2026-03-14",
    hazardsIdentified: 3,
    controlMeasures: 5,
    benefitsArticulated: true,
    childViewSought: true,
    dynamicAssessment: true,
    outcome: "good",
    ...overrides,
  };
}

function makeStaff(
  overrides: Partial<StaffActivityTraining> = {},
): StaffActivityTraining {
  return {
    id: "staff-001",
    staffId: "s-sarah",
    staffName: "Sarah Johnson",
    firstAidCurrent: true,
    outdoorQualifications: ["Mountain Leader", "Forest School L3"],
    activityLeaderTrained: true,
    riskAssessmentTrained: true,
    safeguardingCurrent: true,
    ...overrides,
  };
}

// =============================================================================
// pct()
// =============================================================================

// =============================================================================
// getRating()
// =============================================================================

describe("getRating", () => {
  it("returns outstanding for scores >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for scores >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for scores >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for scores < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// =============================================================================
// Label Functions
// =============================================================================

describe("getActivityCategoryLabel", () => {
  const cases: [ActivityCategory, string][] = [
    ["outdoor_adventure", "Outdoor Adventure"],
    ["sports", "Sports"],
    ["creative_arts", "Creative Arts"],
    ["cultural_visit", "Cultural Visit"],
    ["nature_environment", "Nature & Environment"],
    ["community_service", "Community Service"],
    ["educational_trip", "Educational Trip"],
    ["social_event", "Social Event"],
    ["therapeutic_activity", "Therapeutic Activity"],
    ["life_skill_practice", "Life Skill Practice"],
  ];

  it.each(cases)("returns %s for %s", (value, label) => {
    expect(getActivityCategoryLabel(value)).toBe(label);
  });
});

describe("getRiskBenefitOutcomeLabel", () => {
  const cases: [RiskBenefitOutcome, string][] = [
    ["excellent", "Excellent"],
    ["good", "Good"],
    ["adequate", "Adequate"],
    ["poor", "Poor"],
  ];

  it.each(cases)("returns %s for %s", (value, label) => {
    expect(getRiskBenefitOutcomeLabel(value)).toBe(label);
  });
});

describe("getChildEngagementLabel", () => {
  const cases: [ChildEngagement, string][] = [
    ["enthusiastic", "Enthusiastic"],
    ["willing", "Willing"],
    ["reluctant", "Reluctant"],
    ["refused", "Refused"],
    ["not_offered", "Not Offered"],
  ];

  it.each(cases)("returns %s for %s", (value, label) => {
    expect(getChildEngagementLabel(value)).toBe(label);
  });
});

describe("getActivityFrequencyLabel", () => {
  const cases: [ActivityFrequency, string][] = [
    ["daily", "Daily"],
    ["weekly", "Weekly"],
    ["fortnightly", "Fortnightly"],
    ["monthly", "Monthly"],
    ["termly", "Termly"],
    ["one_off", "One-off"],
  ];

  it.each(cases)("returns %s for %s", (value, label) => {
    expect(getActivityFrequencyLabel(value)).toBe(label);
  });
});

describe("getWeatherConditionLabel", () => {
  const cases: [WeatherCondition, string][] = [
    ["good", "Good"],
    ["mixed", "Mixed"],
    ["poor", "Poor"],
    ["extreme", "Extreme"],
  ];

  it.each(cases)("returns %s for %s", (value, label) => {
    expect(getWeatherConditionLabel(value)).toBe(label);
  });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [
    ["outstanding", "Outstanding"],
    ["good", "Good"],
    ["requires_improvement", "Requires Improvement"],
    ["inadequate", "Inadequate"],
  ];

  it.each(cases)("returns %s for %s", (value, label) => {
    expect(getRatingLabel(value)).toBe(label);
  });
});

// =============================================================================
// evaluateActivityParticipation
// =============================================================================

describe("evaluateActivityParticipation", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateActivityParticipation([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalActivities).toBe(0);
    expect(result.outdoorRate).toBeNull();
    expect(result.communityRate).toBeNull();
    expect(result.childChoiceRate).toBeNull();
    expect(result.newExperienceRate).toBeNull();
    expect(result.averageDuration).toBe(0);
  });

  it("scores perfect data near maximum", () => {
    // All perfect: outdoors, child chose, community, new experience, enthusiastic
    const activities: ActivityRecord[] = Array.from({ length: 5 }, (_, i) =>
      makeActivity({
        id: `act-${i}`,
        category: (["outdoor_adventure", "sports", "creative_arts", "cultural_visit", "nature_environment"] as ActivityCategory[])[i],
        childEngagement: "enthusiastic",
      }),
    );
    const result = evaluateActivityParticipation(activities);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.outdoorRate).toBe(100);
    expect(result.childChoiceRate).toBe(100);
    expect(result.communityRate).toBe(100);
  });

  it("calculates outdoor rate correctly", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", outdoors: true }),
      makeActivity({ id: "a2", outdoors: false }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.outdoorRate).toBe(50);
  });

  it("calculates community rate correctly", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", communityBased: true }),
      makeActivity({ id: "a2", communityBased: false }),
      makeActivity({ id: "a3", communityBased: false }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.communityRate).toBe(33);
  });

  it("calculates child choice rate correctly", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childChose: true }),
      makeActivity({ id: "a2", childChose: true }),
      makeActivity({ id: "a3", childChose: false }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.childChoiceRate).toBe(67);
  });

  it("calculates average duration", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", duration: 60 }),
      makeActivity({ id: "a2", duration: 120 }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.averageDuration).toBe(90);
  });

  it("distributes categories correctly", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", category: "sports" }),
      makeActivity({ id: "a2", category: "sports" }),
      makeActivity({ id: "a3", category: "creative_arts" }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.categoryDistribution.sports).toBe(2);
    expect(result.categoryDistribution.creative_arts).toBe(1);
    expect(result.categoryDistribution.outdoor_adventure).toBe(0);
  });

  it("distributes engagement correctly", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childEngagement: "enthusiastic" }),
      makeActivity({ id: "a2", childEngagement: "willing" }),
      makeActivity({ id: "a3", childEngagement: "refused" }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.engagementDistribution.enthusiastic).toBe(1);
    expect(result.engagementDistribution.willing).toBe(1);
    expect(result.engagementDistribution.refused).toBe(1);
  });

  it("penalises refusals", () => {
    const baseActivities: ActivityRecord[] = [
      makeActivity({ id: "a1", childEngagement: "willing" }),
      makeActivity({ id: "a2", childEngagement: "willing" }),
    ];
    const refusedActivities: ActivityRecord[] = [
      makeActivity({ id: "a1", childEngagement: "willing" }),
      makeActivity({ id: "a2", childEngagement: "refused" }),
    ];
    const baseResult = evaluateActivityParticipation(baseActivities);
    const refusedResult = evaluateActivityParticipation(refusedActivities);
    expect(refusedResult.overallScore).toBeLessThan(baseResult.overallScore);
  });

  it("rewards enthusiastic engagement (max 3)", () => {
    const activities: ActivityRecord[] = Array.from({ length: 5 }, (_, i) =>
      makeActivity({
        id: `act-${i}`,
        childEngagement: "enthusiastic",
      }),
    );
    const result = evaluateActivityParticipation(activities);
    // 5 enthusiastic but bonus capped at +3
    // Compare with willing variant
    const willingActivities: ActivityRecord[] = Array.from({ length: 5 }, (_, i) =>
      makeActivity({
        id: `act-${i}`,
        childEngagement: "willing",
      }),
    );
    const willingResult = evaluateActivityParticipation(willingActivities);
    expect(result.overallScore).toBe(willingResult.overallScore + 3);
  });

  it("caps score at 25", () => {
    const activities: ActivityRecord[] = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `act-${i}`,
        childEngagement: "enthusiastic",
      }),
    );
    const result = evaluateActivityParticipation(activities);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("floors score at 0 even with many refusals", () => {
    const activities: ActivityRecord[] = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `act-${i}`,
        childEngagement: "refused",
        outdoors: false,
        childChose: false,
        communityBased: false,
        newExperience: false,
      }),
    );
    const result = evaluateActivityParticipation(activities);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles mixed engagement data", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childEngagement: "enthusiastic", outdoors: true, childChose: true, communityBased: true, newExperience: true }),
      makeActivity({ id: "a2", childEngagement: "willing", outdoors: false, childChose: false, communityBased: false, newExperience: false }),
      makeActivity({ id: "a3", childEngagement: "reluctant", outdoors: true, childChose: true, communityBased: false, newExperience: false }),
      makeActivity({ id: "a4", childEngagement: "refused", outdoors: false, childChose: false, communityBased: true, newExperience: true }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.totalActivities).toBe(4);
    expect(result.outdoorRate).toBe(50);
    expect(result.childChoiceRate).toBe(50);
    expect(result.communityRate).toBe(50);
    expect(result.newExperienceRate).toBe(50);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// =============================================================================
// evaluateEnrichmentQuality
// =============================================================================

describe("evaluateEnrichmentQuality", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateEnrichmentQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPlans).toBe(0);
    expect(result.currentPlanRate).toBeNull();
    expect(result.completionRate).toBeNull();
    expect(result.childContributionRate).toBeNull();
    expect(result.diverseRangeRate).toBeNull();
    expect(result.barriersAddressedRate).toBeNull();
    expect(result.averageActivitiesPlanned).toBe(0);
  });

  it("scores perfect data near maximum", () => {
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", activitiesPlanned: 10, activitiesCompleted: 10 }),
      makePlan({ id: "p2", activitiesPlanned: 8, activitiesCompleted: 8 }),
    ];
    const result = evaluateEnrichmentQuality(plans);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.completionRate).toBe(100);
    expect(result.childContributionRate).toBe(100);
    expect(result.diverseRangeRate).toBe(100);
  });

  it("calculates completion rate across all plans", () => {
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", activitiesPlanned: 10, activitiesCompleted: 5 }),
      makePlan({ id: "p2", activitiesPlanned: 10, activitiesCompleted: 5 }),
    ];
    const result = evaluateEnrichmentQuality(plans);
    expect(result.completionRate).toBe(50);
  });

  it("calculates child contribution rate", () => {
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", childContributed: true }),
      makePlan({ id: "p2", childContributed: false }),
    ];
    const result = evaluateEnrichmentQuality(plans);
    expect(result.childContributionRate).toBe(50);
  });

  it("calculates diverse range rate", () => {
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", diverseRange: true }),
      makePlan({ id: "p2", diverseRange: true }),
      makePlan({ id: "p3", diverseRange: false }),
    ];
    const result = evaluateEnrichmentQuality(plans);
    expect(result.diverseRangeRate).toBe(67);
  });

  it("calculates barriers addressed rate only for plans with barriers", () => {
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", barrierIdentified: "transport", barrierAddressed: true }),
      makePlan({ id: "p2", barrierIdentified: "cost", barrierAddressed: false }),
      makePlan({ id: "p3", barrierIdentified: null, barrierAddressed: null }),
    ];
    const result = evaluateEnrichmentQuality(plans);
    expect(result.barriersAddressedRate).toBe(50);
  });

  it("gives full barrier score when no barriers exist", () => {
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1" }),
    ];
    const result = evaluateEnrichmentQuality(plans);
    // No barriers = 4 points for barriers addressed dimension
    expect(result.barriersAddressedRate).toBeNull(); // Rate is 0 because no barriers
    // But score should include 4 points for no-barriers bonus
    expect(result.overallScore).toBeGreaterThanOrEqual(4);
  });

  it("calculates current plan rate", () => {
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", reviewDate: "2026-04-15" }),
      makePlan({ id: "p2", reviewDate: null }),
    ];
    const result = evaluateEnrichmentQuality(plans);
    expect(result.currentPlanRate).toBe(50);
  });

  it("calculates average activities planned", () => {
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", activitiesPlanned: 10 }),
      makePlan({ id: "p2", activitiesPlanned: 6 }),
    ];
    const result = evaluateEnrichmentQuality(plans);
    expect(result.averageActivitiesPlanned).toBe(8);
  });

  it("caps score at 25", () => {
    const plans: EnrichmentPlan[] = Array.from({ length: 5 }, (_, i) =>
      makePlan({
        id: `plan-${i}`,
        activitiesPlanned: 10,
        activitiesCompleted: 10,
        childContributed: true,
        diverseRange: true,
        reviewDate: "2026-04-15",
      }),
    );
    const result = evaluateEnrichmentQuality(plans);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles low completion rates correctly", () => {
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", activitiesPlanned: 10, activitiesCompleted: 1, childContributed: false, diverseRange: false, reviewDate: null }),
    ];
    const result = evaluateEnrichmentQuality(plans);
    expect(result.completionRate).toBe(10);
    expect(result.overallScore).toBeLessThan(10);
  });
});

// =============================================================================
// evaluateRiskManagement
// =============================================================================

describe("evaluateRiskManagement", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateRiskManagement([], []);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.assessmentRate).toBeNull();
    expect(result.goodOrExcellentRate).toBeNull();
    expect(result.childViewRate).toBeNull();
    expect(result.dynamicAssessmentRate).toBeNull();
    expect(result.benefitsArticulatedRate).toBeNull();
    expect(result.averageHazards).toBe(0);
  });

  it("scores perfect data near maximum", () => {
    const activities: ActivityRecord[] = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `act-${i}`, riskBenefitAssessed: true }),
    );
    const assessments: RiskBenefitAssessment[] = Array.from({ length: 5 }, (_, i) =>
      makeRiskAssessment({ id: `ra-${i}`, activityId: `act-${i}`, outcome: "excellent" }),
    );
    const result = evaluateRiskManagement(assessments, activities);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.assessmentRate).toBe(100);
    expect(result.goodOrExcellentRate).toBe(100);
  });

  it("calculates assessment rate based on activities", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", riskBenefitAssessed: true }),
      makeActivity({ id: "a2", riskBenefitAssessed: false }),
    ];
    const assessments: RiskBenefitAssessment[] = [
      makeRiskAssessment({ id: "ra-1", activityId: "a1" }),
    ];
    const result = evaluateRiskManagement(assessments, activities);
    expect(result.assessmentRate).toBe(50);
  });

  it("calculates good or excellent rate", () => {
    const assessments: RiskBenefitAssessment[] = [
      makeRiskAssessment({ id: "ra-1", outcome: "excellent" }),
      makeRiskAssessment({ id: "ra-2", outcome: "good" }),
      makeRiskAssessment({ id: "ra-3", outcome: "poor" }),
    ];
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", riskBenefitAssessed: true }),
      makeActivity({ id: "a2", riskBenefitAssessed: true }),
      makeActivity({ id: "a3", riskBenefitAssessed: true }),
    ];
    const result = evaluateRiskManagement(assessments, activities);
    expect(result.goodOrExcellentRate).toBe(67);
  });

  it("calculates child view rate", () => {
    const assessments: RiskBenefitAssessment[] = [
      makeRiskAssessment({ id: "ra-1", childViewSought: true }),
      makeRiskAssessment({ id: "ra-2", childViewSought: false }),
    ];
    const result = evaluateRiskManagement(assessments, [makeActivity()]);
    expect(result.childViewRate).toBe(50);
  });

  it("calculates dynamic assessment rate", () => {
    const assessments: RiskBenefitAssessment[] = [
      makeRiskAssessment({ id: "ra-1", dynamicAssessment: true }),
      makeRiskAssessment({ id: "ra-2", dynamicAssessment: true }),
      makeRiskAssessment({ id: "ra-3", dynamicAssessment: false }),
    ];
    const result = evaluateRiskManagement(assessments, [makeActivity()]);
    expect(result.dynamicAssessmentRate).toBe(67);
  });

  it("calculates benefits articulated rate", () => {
    const assessments: RiskBenefitAssessment[] = [
      makeRiskAssessment({ id: "ra-1", benefitsArticulated: true }),
      makeRiskAssessment({ id: "ra-2", benefitsArticulated: false }),
      makeRiskAssessment({ id: "ra-3", benefitsArticulated: true }),
    ];
    const result = evaluateRiskManagement(assessments, [makeActivity()]);
    expect(result.benefitsArticulatedRate).toBe(67);
  });

  it("calculates average hazards", () => {
    const assessments: RiskBenefitAssessment[] = [
      makeRiskAssessment({ id: "ra-1", hazardsIdentified: 2 }),
      makeRiskAssessment({ id: "ra-2", hazardsIdentified: 4 }),
    ];
    const result = evaluateRiskManagement(assessments, [makeActivity()]);
    expect(result.averageHazards).toBe(3);
  });

  it("caps score at 25", () => {
    const activities: ActivityRecord[] = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `act-${i}`, riskBenefitAssessed: true }),
    );
    const assessments: RiskBenefitAssessment[] = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({ id: `ra-${i}`, outcome: "excellent" }),
    );
    const result = evaluateRiskManagement(assessments, activities);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles mixed quality outcomes", () => {
    const assessments: RiskBenefitAssessment[] = [
      makeRiskAssessment({ id: "ra-1", outcome: "excellent", childViewSought: true, dynamicAssessment: true, benefitsArticulated: true }),
      makeRiskAssessment({ id: "ra-2", outcome: "poor", childViewSought: false, dynamicAssessment: false, benefitsArticulated: false }),
    ];
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", riskBenefitAssessed: true }),
      makeActivity({ id: "a2", riskBenefitAssessed: true }),
    ];
    const result = evaluateRiskManagement(assessments, activities);
    expect(result.goodOrExcellentRate).toBe(50);
    expect(result.childViewRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// =============================================================================
// evaluateStaffReadiness
// =============================================================================

describe("evaluateStaffReadiness", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.firstAidRate).toBeNull();
    expect(result.activityLeaderRate).toBeNull();
    expect(result.riskAssessmentTrainedRate).toBeNull();
    expect(result.safeguardingRate).toBeNull();
    expect(result.averageQualifications).toBe(0);
  });

  it("scores perfect data near maximum", () => {
    const staff: StaffActivityTraining[] = [
      makeStaff({ id: "s1" }),
      makeStaff({ id: "s2", staffId: "s-tom", staffName: "Tom" }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.firstAidRate).toBe(100);
    expect(result.activityLeaderRate).toBe(100);
    expect(result.safeguardingRate).toBe(100);
  });

  it("calculates first aid rate", () => {
    const staff: StaffActivityTraining[] = [
      makeStaff({ id: "s1", firstAidCurrent: true }),
      makeStaff({ id: "s2", firstAidCurrent: false }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.firstAidRate).toBe(50);
  });

  it("calculates activity leader rate", () => {
    const staff: StaffActivityTraining[] = [
      makeStaff({ id: "s1", activityLeaderTrained: true }),
      makeStaff({ id: "s2", activityLeaderTrained: false }),
      makeStaff({ id: "s3", activityLeaderTrained: false }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.activityLeaderRate).toBe(33);
  });

  it("calculates risk assessment trained rate", () => {
    const staff: StaffActivityTraining[] = [
      makeStaff({ id: "s1", riskAssessmentTrained: true }),
      makeStaff({ id: "s2", riskAssessmentTrained: true }),
      makeStaff({ id: "s3", riskAssessmentTrained: false }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.riskAssessmentTrainedRate).toBe(67);
  });

  it("calculates safeguarding rate", () => {
    const staff: StaffActivityTraining[] = [
      makeStaff({ id: "s1", safeguardingCurrent: true }),
      makeStaff({ id: "s2", safeguardingCurrent: true }),
      makeStaff({ id: "s3", safeguardingCurrent: true }),
      makeStaff({ id: "s4", safeguardingCurrent: false }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.safeguardingRate).toBe(75);
  });

  it("calculates average qualifications", () => {
    const staff: StaffActivityTraining[] = [
      makeStaff({ id: "s1", outdoorQualifications: ["ML", "FS"] }),
      makeStaff({ id: "s2", outdoorQualifications: [] }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.averageQualifications).toBe(1);
  });

  it("caps score at 25", () => {
    const staff: StaffActivityTraining[] = Array.from({ length: 10 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffReadiness(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles poorly trained staff", () => {
    const staff: StaffActivityTraining[] = [
      makeStaff({
        id: "s1",
        firstAidCurrent: false,
        activityLeaderTrained: false,
        riskAssessmentTrained: false,
        safeguardingCurrent: false,
        outdoorQualifications: [],
      }),
    ];
    const result = evaluateStaffReadiness(staff);
    expect(result.overallScore).toBe(0);
    expect(result.firstAidRate).toBe(0);
    expect(result.activityLeaderRate).toBe(0);
  });
});

// =============================================================================
// buildChildEnrichmentProfiles
// =============================================================================

describe("buildChildEnrichmentProfiles", () => {
  it("returns empty array for no data", () => {
    const result = buildChildEnrichmentProfiles([], []);
    expect(result).toEqual([]);
  });

  it("builds profiles from activities only", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex", outdoors: true, childChose: true, childEngagement: "enthusiastic" }),
      makeActivity({ id: "a2", childId: "child-alex", childName: "Alex", outdoors: false, childChose: false, childEngagement: "willing" }),
    ];
    const result = buildChildEnrichmentProfiles(activities, []);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("child-alex");
    expect(result[0].totalActivities).toBe(2);
    expect(result[0].outdoorRate).toBe(50);
    expect(result[0].choiceRate).toBe(50);
  });

  it("builds profiles from plans only", () => {
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", childId: "child-jordan", childName: "Jordan", activitiesPlanned: 10, activitiesCompleted: 7 }),
    ];
    const result = buildChildEnrichmentProfiles([], plans);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("child-jordan");
    expect(result[0].totalActivities).toBe(0);
    expect(result[0].planCompletionRate).toBe(70);
  });

  it("merges data from activities and plans for same child", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex" }),
    ];
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", childId: "child-alex", childName: "Alex", activitiesPlanned: 10, activitiesCompleted: 8 }),
    ];
    const result = buildChildEnrichmentProfiles(activities, plans);
    expect(result).toHaveLength(1);
    expect(result[0].totalActivities).toBe(1);
    expect(result[0].planCompletionRate).toBe(80);
  });

  it("builds separate profiles for different children", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "a2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = buildChildEnrichmentProfiles(activities, []);
    expect(result).toHaveLength(2);
  });

  it("calculates engagement score correctly", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childId: "c1", childName: "A", childEngagement: "enthusiastic" }),
      makeActivity({ id: "a2", childId: "c1", childName: "A", childEngagement: "enthusiastic" }),
    ];
    const result = buildChildEnrichmentProfiles(activities, []);
    // All enthusiastic: weighted = 10*2/2 = 10
    expect(result[0].engagementScore).toBe(10);
  });

  it("engagement score is 0 for all refused", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childId: "c1", childName: "A", childEngagement: "refused" }),
      makeActivity({ id: "a2", childId: "c1", childName: "A", childEngagement: "refused" }),
    ];
    const result = buildChildEnrichmentProfiles(activities, []);
    expect(result[0].engagementScore).toBe(0);
  });

  it("overall score is 0-10 range", () => {
    const activities: ActivityRecord[] = Array.from({ length: 6 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", childName: "A" }),
    );
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", childId: "c1", childName: "A", activitiesPlanned: 10, activitiesCompleted: 10 }),
    ];
    const result = buildChildEnrichmentProfiles(activities, plans);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("plan completion rate is null when no plans", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childId: "c1", childName: "A" }),
    ];
    const result = buildChildEnrichmentProfiles(activities, []);
    expect(result[0].planCompletionRate).toBeNull();
  });
});

// =============================================================================
// generateOutdoorActivityEnrichmentIntelligence (main function)
// =============================================================================

describe("generateOutdoorActivityEnrichmentIntelligence", () => {
  it("returns correct structure with all empty data", () => {
    const result = generateOutdoorActivityEnrichmentIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.activityParticipation.overallScore).toBe(0);
    expect(result.enrichmentQuality.overallScore).toBe(0);
    expect(result.riskManagement.overallScore).toBe(0);
    expect(result.staffReadiness.overallScore).toBe(0);
    expect(result.childProfiles).toEqual([]);
    expect(result.strengths).toEqual([]);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("caps overall score at 100", () => {
    // Extremely good data across all domains
    const activities: ActivityRecord[] = Array.from({ length: 20 }, (_, i) =>
      makeActivity({ id: `a-${i}`, riskBenefitAssessed: true, childEngagement: "enthusiastic" }),
    );
    const plans: EnrichmentPlan[] = Array.from({ length: 5 }, (_, i) =>
      makePlan({ id: `p-${i}`, activitiesPlanned: 10, activitiesCompleted: 10 }),
    );
    const assessments: RiskBenefitAssessment[] = Array.from({ length: 20 }, (_, i) =>
      makeRiskAssessment({ id: `ra-${i}`, activityId: `a-${i}`, outcome: "excellent" }),
    );
    const staff: StaffActivityTraining[] = Array.from({ length: 5 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `staff-${i}` }),
    );
    const result = generateOutdoorActivityEnrichmentIntelligence(
      activities, plans, assessments, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("rates outstanding for score >= 80", () => {
    const activities: ActivityRecord[] = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, riskBenefitAssessed: true, childEngagement: "enthusiastic" }),
    );
    const plans: EnrichmentPlan[] = Array.from({ length: 3 }, (_, i) =>
      makePlan({ id: `p-${i}`, activitiesPlanned: 10, activitiesCompleted: 10 }),
    );
    const assessments: RiskBenefitAssessment[] = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({ id: `ra-${i}`, activityId: `a-${i}`, outcome: "excellent" }),
    );
    const staff: StaffActivityTraining[] = Array.from({ length: 5 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `staff-${i}` }),
    );
    const result = generateOutdoorActivityEnrichmentIntelligence(
      activities, plans, assessments, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    if (result.overallScore >= 80) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("rates inadequate for score < 40", () => {
    const result = generateOutdoorActivityEnrichmentIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("generates URGENT actions when data is empty", () => {
    const result = generateOutdoorActivityEnrichmentIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT:"));
    expect(urgentActions.length).toBeGreaterThan(0);
  });

  it("generates strengths for good performance", () => {
    const activities: ActivityRecord[] = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childEngagement: "enthusiastic" }),
    );
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", activitiesPlanned: 10, activitiesCompleted: 10 }),
    ];
    const result = generateOutdoorActivityEnrichmentIntelligence(
      activities, plans, [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for poor data", () => {
    const activities: ActivityRecord[] = [
      makeActivity({
        id: "a1",
        outdoors: false,
        childChose: false,
        communityBased: false,
        newExperience: false,
        childEngagement: "refused",
      }),
    ];
    const result = generateOutdoorActivityEnrichmentIntelligence(
      activities, [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateOutdoorActivityEnrichmentIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 6"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 9"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 31"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CA 1989 s22(3)(a)"))).toBe(true);
  });

  it("builds child profiles from activities and plans", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "a2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const plans: EnrichmentPlan[] = [
      makePlan({ id: "p1", childId: "child-alex", childName: "Alex" }),
      makePlan({ id: "p2", childId: "child-morgan", childName: "Morgan" }),
    ];
    const result = generateOutdoorActivityEnrichmentIntelligence(
      activities, plans, [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles).toHaveLength(3);
    const childIds = result.childProfiles.map((p) => p.childId);
    expect(childIds).toContain("child-alex");
    expect(childIds).toContain("child-jordan");
    expect(childIds).toContain("child-morgan");
  });

  it("overall score equals sum of sub-scores (when not capped)", () => {
    const activities: ActivityRecord[] = [
      makeActivity({ id: "a1", childEngagement: "willing", outdoors: false, childChose: false, communityBased: false, newExperience: false }),
    ];
    const result = generateOutdoorActivityEnrichmentIntelligence(
      activities, [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const expected =
      result.activityParticipation.overallScore +
      result.enrichmentQuality.overallScore +
      result.riskManagement.overallScore +
      result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(expected, 100));
  });

  it("overall score floors at 0", () => {
    const result = generateOutdoorActivityEnrichmentIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});
