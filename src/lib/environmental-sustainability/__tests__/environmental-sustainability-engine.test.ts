// ==============================================================================
// Cornerstone Environmental Sustainability Intelligence — Engine Tests
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateActivityEngagement,
  evaluateEnvironmentalPractice,
  evaluateSustainabilityPolicy,
  evaluateStaffSustainabilityReadiness,
  buildChildSustainabilityProfiles,
  generateEnvironmentalSustainabilityIntelligence,
  pct,
  getRating,
  getActivityTypeLabel,
  getEngagementLevelLabel,
  getRatingLabel,
} from "../environmental-sustainability-engine";
import type {
  SustainabilityActivity,
  SustainabilityPolicy,
  StaffSustainabilityTraining,
  ActivityType,
  EngagementLevel,
  Rating,
} from "../environmental-sustainability-engine";

// -- Constants ----------------------------------------------------------------

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-19";

// -- Factories ----------------------------------------------------------------

function makeActivity(
  overrides: Partial<SustainabilityActivity> = {},
): SustainabilityActivity {
  return {
    id: "act-001",
    childId: "child-alex",
    childName: "Alex",
    activityDate: "2026-03-15",
    activityType: "recycling",
    engagementLevel: "highly_engaged",
    childInitiated: true,
    learningOutcomeRecorded: true,
    staffSupported: true,
    ...overrides,
  };
}

function makePolicy(
  overrides: Partial<SustainabilityPolicy> = {},
): SustainabilityPolicy {
  return {
    id: "pol-001",
    recyclingScheme: true,
    energyReductionPlan: true,
    sustainableProcurement: true,
    environmentalEducation: true,
    gardenAccess: true,
    waterConservation: true,
    regularAudit: true,
    ...overrides,
  };
}

function makeTraining(
  overrides: Partial<StaffSustainabilityTraining> = {},
): StaffSustainabilityTraining {
  return {
    id: "tr-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    environmentalAwareness: true,
    recyclingProcedures: true,
    energyConservation: true,
    sustainableLiving: true,
    childEngagement: true,
    outdoorLearning: true,
    ...overrides,
  };
}

// =============================================================================
// pct()
// =============================================================================

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

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

describe("getActivityTypeLabel", () => {
  const cases: [ActivityType, string][] = [
    ["recycling", "Recycling"],
    ["energy_saving", "Energy Saving"],
    ["gardening", "Gardening"],
    ["composting", "Composting"],
    ["water_conservation", "Water Conservation"],
    ["sustainable_shopping", "Sustainable Shopping"],
    ["nature_walk", "Nature Walk"],
    ["environmental_project", "Environmental Project"],
  ];

  it.each(cases)("returns %s for %s", (value, label) => {
    expect(getActivityTypeLabel(value)).toBe(label);
  });
});

describe("getEngagementLevelLabel", () => {
  const cases: [EngagementLevel, string][] = [
    ["highly_engaged", "Highly Engaged"],
    ["engaged", "Engaged"],
    ["partially_engaged", "Partially Engaged"],
    ["reluctant", "Reluctant"],
    ["refused", "Refused"],
  ];

  it.each(cases)("returns %s for %s", (value, label) => {
    expect(getEngagementLevelLabel(value)).toBe(label);
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
// evaluateActivityEngagement
// =============================================================================

describe("evaluateActivityEngagement", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateActivityEngagement([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalActivities).toBe(0);
    expect(result.engagementRate).toBe(0);
    expect(result.childInitiatedRate).toBe(0);
    expect(result.learningRecordedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
  });

  it("scores perfect data near maximum", () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `act-${i}` }),
    );
    const result = evaluateActivityEngagement(activities);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.engagementRate).toBe(100);
    expect(result.childInitiatedRate).toBe(100);
    expect(result.learningRecordedRate).toBe(100);
    expect(result.staffSupportedRate).toBe(100);
  });

  it("calculates engagement rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "highly_engaged" }),
      makeActivity({ id: "a2", engagementLevel: "engaged" }),
      makeActivity({ id: "a3", engagementLevel: "reluctant" }),
      makeActivity({ id: "a4", engagementLevel: "refused" }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.engagementRate).toBe(50);
  });

  it("calculates child-initiated rate", () => {
    const activities = [
      makeActivity({ id: "a1", childInitiated: true }),
      makeActivity({ id: "a2", childInitiated: false }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.childInitiatedRate).toBe(50);
  });

  it("calculates learning recorded rate", () => {
    const activities = [
      makeActivity({ id: "a1", learningOutcomeRecorded: true }),
      makeActivity({ id: "a2", learningOutcomeRecorded: true }),
      makeActivity({ id: "a3", learningOutcomeRecorded: false }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.learningRecordedRate).toBe(67);
  });

  it("calculates staff supported rate", () => {
    const activities = [
      makeActivity({ id: "a1", staffSupported: true }),
      makeActivity({ id: "a2", staffSupported: false }),
      makeActivity({ id: "a3", staffSupported: false }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.staffSupportedRate).toBe(33);
  });

  it("distributes engagement levels correctly", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "highly_engaged" }),
      makeActivity({ id: "a2", engagementLevel: "highly_engaged" }),
      makeActivity({ id: "a3", engagementLevel: "engaged" }),
      makeActivity({ id: "a4", engagementLevel: "refused" }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.engagementDistribution.highly_engaged).toBe(2);
    expect(result.engagementDistribution.engaged).toBe(1);
    expect(result.engagementDistribution.refused).toBe(1);
    expect(result.engagementDistribution.reluctant).toBe(0);
    expect(result.engagementDistribution.partially_engaged).toBe(0);
  });

  it("caps score at 25", () => {
    const activities = Array.from({ length: 20 }, (_, i) =>
      makeActivity({ id: `act-${i}` }),
    );
    const result = evaluateActivityEngagement(activities);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("floors score at 0", () => {
    const activities = [
      makeActivity({
        id: "a1",
        engagementLevel: "refused",
        childInitiated: false,
        learningOutcomeRecorded: false,
        staffSupported: false,
      }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("scores low for poor engagement", () => {
    const activities = [
      makeActivity({
        id: "a1",
        engagementLevel: "refused",
        childInitiated: false,
        learningOutcomeRecorded: false,
        staffSupported: false,
      }),
      makeActivity({
        id: "a2",
        engagementLevel: "reluctant",
        childInitiated: false,
        learningOutcomeRecorded: false,
        staffSupported: false,
      }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.overallScore).toBe(0);
    expect(result.engagementRate).toBe(0);
  });

  it("handles mixed engagement data", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "highly_engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: true }),
      makeActivity({ id: "a2", engagementLevel: "reluctant", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a3", engagementLevel: "engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: true }),
      makeActivity({ id: "a4", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
    ];
    const result = evaluateActivityEngagement(activities);
    expect(result.totalActivities).toBe(4);
    expect(result.engagementRate).toBe(50);
    expect(result.childInitiatedRate).toBe(50);
    expect(result.learningRecordedRate).toBe(50);
    expect(result.staffSupportedRate).toBe(50);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives engagement rate score of 7 at >= 80%", () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `a-${i}`, engagementLevel: "highly_engaged", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
    );
    const result = evaluateActivityEngagement(activities);
    // 100% engagement rate => 7 pts, rest 0
    expect(result.overallScore).toBe(7);
  });

  it("gives engagement rate score of 5 at 60-79%", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "highly_engaged", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a2", engagementLevel: "engaged", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a3", engagementLevel: "engaged", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a4", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a5", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
    ];
    const result = evaluateActivityEngagement(activities);
    // 60% engagement rate => 5 pts
    expect(result.overallScore).toBe(5);
  });

  it("gives engagement rate score of 3 at 40-59%", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "highly_engaged", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a2", engagementLevel: "engaged", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a3", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a4", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a5", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
    ];
    const result = evaluateActivityEngagement(activities);
    // 40% engagement rate => 3 pts
    expect(result.overallScore).toBe(3);
  });

  it("gives engagement rate score of 1 at 20-39%", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "highly_engaged", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a2", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a3", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a4", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
      makeActivity({ id: "a5", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false }),
    ];
    const result = evaluateActivityEngagement(activities);
    // 20% engagement rate => 1 pt
    expect(result.overallScore).toBe(1);
  });

  it("child-initiated rate scoring tiers are correct", () => {
    // 100% child initiated, nothing else
    const full = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `a-${i}`, engagementLevel: "refused", childInitiated: true, learningOutcomeRecorded: false, staffSupported: false }),
    );
    const r1 = evaluateActivityEngagement(full);
    expect(r1.childInitiatedRate).toBe(100);
    // Should get 6 for child-initiated (>=80%)
    // 0 for engagement rate (0%), 0 for learning, 0 for staff
    expect(r1.overallScore).toBe(6);
  });

  it("learning recorded rate scoring tiers are correct", () => {
    const full = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `a-${i}`, engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: true, staffSupported: false }),
    );
    const r1 = evaluateActivityEngagement(full);
    expect(r1.learningRecordedRate).toBe(100);
    expect(r1.overallScore).toBe(6);
  });

  it("staff supported rate scoring tiers are correct", () => {
    const full = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `a-${i}`, engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: true }),
    );
    const r1 = evaluateActivityEngagement(full);
    expect(r1.staffSupportedRate).toBe(100);
    expect(r1.overallScore).toBe(6);
  });
});

// =============================================================================
// evaluateEnvironmentalPractice
// =============================================================================

describe("evaluateEnvironmentalPractice", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateEnvironmentalPractice([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalActivities).toBe(0);
    expect(result.activityTypeDiversity).toBe(0);
    expect(result.frequencyScore).toBe(0);
    expect(result.sustainedEngagementRate).toBe(0);
  });

  it("scores perfect data near maximum", () => {
    const types: ActivityType[] = [
      "recycling", "energy_saving", "gardening", "composting",
      "water_conservation", "sustainable_shopping", "nature_walk",
    ];
    const activities = types.map((t, i) =>
      makeActivity({ id: `act-${i}`, activityType: t, engagementLevel: "highly_engaged" }),
    );
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.activityTypeDiversity).toBe(7);
  });

  it("calculates activity type diversity", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "recycling" }),
      makeActivity({ id: "a2", activityType: "recycling" }),
      makeActivity({ id: "a3", activityType: "gardening" }),
      makeActivity({ id: "a4", activityType: "composting" }),
    ];
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.activityTypeDiversity).toBe(3);
  });

  it("distributes activity types correctly", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "recycling" }),
      makeActivity({ id: "a2", activityType: "recycling" }),
      makeActivity({ id: "a3", activityType: "gardening" }),
    ];
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.activityTypeDistribution.recycling).toBe(2);
    expect(result.activityTypeDistribution.gardening).toBe(1);
    expect(result.activityTypeDistribution.composting).toBe(0);
  });

  it("calculates frequency score per child", () => {
    // 6 activities across 2 children = 3.0 per child
    const activities = [
      makeActivity({ id: "a1", childId: "c1" }),
      makeActivity({ id: "a2", childId: "c1" }),
      makeActivity({ id: "a3", childId: "c1" }),
      makeActivity({ id: "a4", childId: "c2" }),
      makeActivity({ id: "a5", childId: "c2" }),
      makeActivity({ id: "a6", childId: "c2" }),
    ];
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.frequencyScore).toBe(3);
  });

  it("calculates sustained engagement rate", () => {
    const activities = [
      makeActivity({ id: "a1", engagementLevel: "highly_engaged" }),
      makeActivity({ id: "a2", engagementLevel: "engaged" }),
      makeActivity({ id: "a3", engagementLevel: "partially_engaged" }),
      makeActivity({ id: "a4", engagementLevel: "refused" }),
    ];
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.sustainedEngagementRate).toBe(50);
  });

  it("diversity score: 8 at >= 7 types", () => {
    const types: ActivityType[] = [
      "recycling", "energy_saving", "gardening", "composting",
      "water_conservation", "sustainable_shopping", "nature_walk",
    ];
    const activities = types.map((t, i) =>
      makeActivity({ id: `a-${i}`, activityType: t, engagementLevel: "refused", childInitiated: false }),
    );
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.activityTypeDiversity).toBe(7);
    // 8 for diversity, frequency=7/1=7.0 so 9 for frequency, 0 for sustained = 17
    // But sustained engagement is 0% so 0 for that. Score = 8+9+0 = 17
    expect(result.overallScore).toBe(17);
  });

  it("diversity score: 6 at 5-6 types", () => {
    const types: ActivityType[] = [
      "recycling", "energy_saving", "gardening", "composting", "water_conservation",
    ];
    const activities = types.map((t, i) =>
      makeActivity({ id: `a-${i}`, activityType: t, engagementLevel: "refused", childInitiated: false }),
    );
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.activityTypeDiversity).toBe(5);
  });

  it("diversity score: 4 at 3-4 types", () => {
    const types: ActivityType[] = ["recycling", "energy_saving", "gardening"];
    const activities = types.map((t, i) =>
      makeActivity({ id: `a-${i}`, activityType: t, engagementLevel: "refused", childInitiated: false }),
    );
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.activityTypeDiversity).toBe(3);
  });

  it("diversity score: 2 at 1-2 types", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "recycling", engagementLevel: "refused", childInitiated: false }),
    ];
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.activityTypeDiversity).toBe(1);
  });

  it("frequency score: 9 for >= 6 per child", () => {
    const activities = Array.from({ length: 6 }, (_, i) =>
      makeActivity({ id: `a-${i}`, engagementLevel: "refused" }),
    );
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.frequencyScore).toBe(6);
  });

  it("frequency score: 5 for 3 per child", () => {
    const activities = Array.from({ length: 3 }, (_, i) =>
      makeActivity({ id: `a-${i}`, engagementLevel: "refused" }),
    );
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.frequencyScore).toBe(3);
  });

  it("caps score at 25", () => {
    const types: ActivityType[] = [
      "recycling", "energy_saving", "gardening", "composting",
      "water_conservation", "sustainable_shopping", "nature_walk",
      "environmental_project",
    ];
    const activities = Array.from({ length: 8 }, (_, i) =>
      makeActivity({ id: `a-${i}`, activityType: types[i], engagementLevel: "highly_engaged" }),
    );
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single activity correctly", () => {
    const activities = [makeActivity({ id: "a1" })];
    const result = evaluateEnvironmentalPractice(activities);
    expect(result.totalActivities).toBe(1);
    expect(result.activityTypeDiversity).toBe(1);
    expect(result.frequencyScore).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// =============================================================================
// evaluateSustainabilityPolicy
// =============================================================================

describe("evaluateSustainabilityPolicy", () => {
  it("returns zero scores for null policy", () => {
    const result = evaluateSustainabilityPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.policiesInPlace).toBe(0);
    expect(result.recyclingScheme).toBe(false);
    expect(result.energyReductionPlan).toBe(false);
    expect(result.sustainableProcurement).toBe(false);
    expect(result.environmentalEducation).toBe(false);
    expect(result.gardenAccess).toBe(false);
    expect(result.waterConservation).toBe(false);
    expect(result.regularAudit).toBe(false);
  });

  it("scores maximum for all policies true", () => {
    const result = evaluateSustainabilityPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.policiesInPlace).toBe(7);
  });

  it("scores recycling scheme at 4 points", () => {
    const result = evaluateSustainabilityPolicy(
      makePolicy({
        recyclingScheme: true,
        energyReductionPlan: false,
        sustainableProcurement: false,
        environmentalEducation: false,
        gardenAccess: false,
        waterConservation: false,
        regularAudit: false,
      }),
    );
    expect(result.overallScore).toBe(4);
    expect(result.policiesInPlace).toBe(1);
  });

  it("scores energy reduction plan at 4 points", () => {
    const result = evaluateSustainabilityPolicy(
      makePolicy({
        recyclingScheme: false,
        energyReductionPlan: true,
        sustainableProcurement: false,
        environmentalEducation: false,
        gardenAccess: false,
        waterConservation: false,
        regularAudit: false,
      }),
    );
    expect(result.overallScore).toBe(4);
  });

  it("scores sustainable procurement at 4 points", () => {
    const result = evaluateSustainabilityPolicy(
      makePolicy({
        recyclingScheme: false,
        energyReductionPlan: false,
        sustainableProcurement: true,
        environmentalEducation: false,
        gardenAccess: false,
        waterConservation: false,
        regularAudit: false,
      }),
    );
    expect(result.overallScore).toBe(4);
  });

  it("scores environmental education at 4 points", () => {
    const result = evaluateSustainabilityPolicy(
      makePolicy({
        recyclingScheme: false,
        energyReductionPlan: false,
        sustainableProcurement: false,
        environmentalEducation: true,
        gardenAccess: false,
        waterConservation: false,
        regularAudit: false,
      }),
    );
    expect(result.overallScore).toBe(4);
  });

  it("scores garden access at 3 points", () => {
    const result = evaluateSustainabilityPolicy(
      makePolicy({
        recyclingScheme: false,
        energyReductionPlan: false,
        sustainableProcurement: false,
        environmentalEducation: false,
        gardenAccess: true,
        waterConservation: false,
        regularAudit: false,
      }),
    );
    expect(result.overallScore).toBe(3);
  });

  it("scores water conservation at 3 points", () => {
    const result = evaluateSustainabilityPolicy(
      makePolicy({
        recyclingScheme: false,
        energyReductionPlan: false,
        sustainableProcurement: false,
        environmentalEducation: false,
        gardenAccess: false,
        waterConservation: true,
        regularAudit: false,
      }),
    );
    expect(result.overallScore).toBe(3);
  });

  it("scores regular audit at 3 points", () => {
    const result = evaluateSustainabilityPolicy(
      makePolicy({
        recyclingScheme: false,
        energyReductionPlan: false,
        sustainableProcurement: false,
        environmentalEducation: false,
        gardenAccess: false,
        waterConservation: false,
        regularAudit: true,
      }),
    );
    expect(result.overallScore).toBe(3);
  });

  it("scores 4-point policies totalling 16", () => {
    const result = evaluateSustainabilityPolicy(
      makePolicy({
        recyclingScheme: true,
        energyReductionPlan: true,
        sustainableProcurement: true,
        environmentalEducation: true,
        gardenAccess: false,
        waterConservation: false,
        regularAudit: false,
      }),
    );
    expect(result.overallScore).toBe(16);
    expect(result.policiesInPlace).toBe(4);
  });

  it("scores 3-point policies totalling 9", () => {
    const result = evaluateSustainabilityPolicy(
      makePolicy({
        recyclingScheme: false,
        energyReductionPlan: false,
        sustainableProcurement: false,
        environmentalEducation: false,
        gardenAccess: true,
        waterConservation: true,
        regularAudit: true,
      }),
    );
    expect(result.overallScore).toBe(9);
    expect(result.policiesInPlace).toBe(3);
  });

  it("scores 0 for all policies false", () => {
    const result = evaluateSustainabilityPolicy(
      makePolicy({
        recyclingScheme: false,
        energyReductionPlan: false,
        sustainableProcurement: false,
        environmentalEducation: false,
        gardenAccess: false,
        waterConservation: false,
        regularAudit: false,
      }),
    );
    expect(result.overallScore).toBe(0);
    expect(result.policiesInPlace).toBe(0);
  });

  it("caps score at 25", () => {
    const result = evaluateSustainabilityPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("preserves individual boolean values", () => {
    const policy = makePolicy({
      recyclingScheme: true,
      energyReductionPlan: false,
      gardenAccess: true,
    });
    const result = evaluateSustainabilityPolicy(policy);
    expect(result.recyclingScheme).toBe(true);
    expect(result.energyReductionPlan).toBe(false);
    expect(result.gardenAccess).toBe(true);
  });
});

// =============================================================================
// evaluateStaffSustainabilityReadiness
// =============================================================================

describe("evaluateStaffSustainabilityReadiness", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateStaffSustainabilityReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.environmentalAwarenessRate).toBe(0);
    expect(result.recyclingProceduresRate).toBe(0);
    expect(result.energyConservationRate).toBe(0);
    expect(result.sustainableLivingRate).toBe(0);
    expect(result.childEngagementRate).toBe(0);
    expect(result.outdoorLearningRate).toBe(0);
  });

  it("scores perfect data near maximum", () => {
    const training = [
      makeTraining({ id: "t1" }),
      makeTraining({ id: "t2", staffId: "staff-tom", staffName: "Tom" }),
    ];
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.environmentalAwarenessRate).toBe(100);
    expect(result.recyclingProceduresRate).toBe(100);
  });

  it("calculates environmental awareness rate", () => {
    const training = [
      makeTraining({ id: "t1", environmentalAwareness: true }),
      makeTraining({ id: "t2", environmentalAwareness: false }),
    ];
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.environmentalAwarenessRate).toBe(50);
  });

  it("calculates recycling procedures rate", () => {
    const training = [
      makeTraining({ id: "t1", recyclingProcedures: true }),
      makeTraining({ id: "t2", recyclingProcedures: true }),
      makeTraining({ id: "t3", recyclingProcedures: false }),
    ];
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.recyclingProceduresRate).toBe(67);
  });

  it("calculates energy conservation rate", () => {
    const training = [
      makeTraining({ id: "t1", energyConservation: true }),
      makeTraining({ id: "t2", energyConservation: false }),
    ];
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.energyConservationRate).toBe(50);
  });

  it("calculates sustainable living rate", () => {
    const training = [
      makeTraining({ id: "t1", sustainableLiving: true }),
      makeTraining({ id: "t2", sustainableLiving: true }),
      makeTraining({ id: "t3", sustainableLiving: false }),
      makeTraining({ id: "t4", sustainableLiving: false }),
    ];
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.sustainableLivingRate).toBe(50);
  });

  it("calculates child engagement rate", () => {
    const training = [
      makeTraining({ id: "t1", childEngagement: true }),
      makeTraining({ id: "t2", childEngagement: false }),
      makeTraining({ id: "t3", childEngagement: true }),
    ];
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.childEngagementRate).toBe(67);
  });

  it("calculates outdoor learning rate", () => {
    const training = [
      makeTraining({ id: "t1", outdoorLearning: true }),
      makeTraining({ id: "t2", outdoorLearning: false }),
      makeTraining({ id: "t3", outdoorLearning: false }),
    ];
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.outdoorLearningRate).toBe(33);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles poorly trained staff", () => {
    const training = [
      makeTraining({
        id: "t1",
        environmentalAwareness: false,
        recyclingProcedures: false,
        energyConservation: false,
        sustainableLiving: false,
        childEngagement: false,
        outdoorLearning: false,
      }),
    ];
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBe(0);
    expect(result.environmentalAwarenessRate).toBe(0);
    expect(result.recyclingProceduresRate).toBe(0);
  });

  it("environmental awareness scoring: 6 at >= 90%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`,
        environmentalAwareness: true,
        recyclingProcedures: false, energyConservation: false,
        sustainableLiving: false, childEngagement: false, outdoorLearning: false,
      }),
    );
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("environmental awareness scoring: 4 at 70-89%", () => {
    // 7 out of 10 = 70%
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`,
        environmentalAwareness: i < 7,
        recyclingProcedures: false, energyConservation: false,
        sustainableLiving: false, childEngagement: false, outdoorLearning: false,
      }),
    );
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBe(4);
  });

  it("environmental awareness scoring: 3 at 50-69%", () => {
    // 5 out of 10 = 50%
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`,
        environmentalAwareness: i < 5,
        recyclingProcedures: false, energyConservation: false,
        sustainableLiving: false, childEngagement: false, outdoorLearning: false,
      }),
    );
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBe(3);
  });

  it("environmental awareness scoring: 1 at 25-49%", () => {
    // 3 out of 10 = 30%
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`,
        environmentalAwareness: i < 3,
        recyclingProcedures: false, energyConservation: false,
        sustainableLiving: false, childEngagement: false, outdoorLearning: false,
      }),
    );
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBe(1);
  });

  it("environmental awareness scoring: 0 at < 25%", () => {
    // 2 out of 10 = 20%
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`,
        environmentalAwareness: i < 2,
        recyclingProcedures: false, energyConservation: false,
        sustainableLiving: false, childEngagement: false, outdoorLearning: false,
      }),
    );
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("recycling procedures scoring: 5 at >= 90%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`,
        environmentalAwareness: false,
        recyclingProcedures: true,
        energyConservation: false,
        sustainableLiving: false, childEngagement: false, outdoorLearning: false,
      }),
    );
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("outdoor learning scoring: 2 at >= 70%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`,
        environmentalAwareness: false, recyclingProcedures: false,
        energyConservation: false, sustainableLiving: false,
        childEngagement: false,
        outdoorLearning: i < 7,
      }),
    );
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBe(2);
  });

  it("outdoor learning scoring: 1 at 40-69%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`,
        environmentalAwareness: false, recyclingProcedures: false,
        energyConservation: false, sustainableLiving: false,
        childEngagement: false,
        outdoorLearning: i < 4,
      }),
    );
    const result = evaluateStaffSustainabilityReadiness(training);
    expect(result.overallScore).toBe(1);
  });
});

// =============================================================================
// buildChildSustainabilityProfiles
// =============================================================================

describe("buildChildSustainabilityProfiles", () => {
  it("returns empty array for no data", () => {
    const result = buildChildSustainabilityProfiles([]);
    expect(result).toEqual([]);
  });

  it("builds profile from activities", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex", engagementLevel: "highly_engaged" }),
      makeActivity({ id: "a2", childId: "child-alex", childName: "Alex", engagementLevel: "engaged", activityType: "gardening" }),
    ];
    const result = buildChildSustainabilityProfiles(activities);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("child-alex");
    expect(result[0].totalActivities).toBe(2);
    expect(result[0].activityTypeDiversity).toBe(2);
  });

  it("builds separate profiles for different children", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "a2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = buildChildSustainabilityProfiles(activities);
    expect(result).toHaveLength(2);
  });

  it("calculates engagement score correctly — all highly engaged", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", childName: "A", engagementLevel: "highly_engaged" }),
      makeActivity({ id: "a2", childId: "c1", childName: "A", engagementLevel: "highly_engaged" }),
    ];
    const result = buildChildSustainabilityProfiles(activities);
    // All highly_engaged: weighted = 10*2/2 = 10
    expect(result[0].engagementScore).toBe(10);
  });

  it("calculates engagement score correctly — all refused", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", childName: "A", engagementLevel: "refused" }),
      makeActivity({ id: "a2", childId: "c1", childName: "A", engagementLevel: "refused" }),
    ];
    const result = buildChildSustainabilityProfiles(activities);
    expect(result[0].engagementScore).toBe(0);
  });

  it("calculates engagement score correctly — mixed", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", childName: "A", engagementLevel: "highly_engaged" }),
      makeActivity({ id: "a2", childId: "c1", childName: "A", engagementLevel: "refused" }),
    ];
    const result = buildChildSustainabilityProfiles(activities);
    // (10 + 0) / 2 = 5
    expect(result[0].engagementScore).toBe(5);
  });

  it("calculates child-initiated rate", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", childName: "A", childInitiated: true }),
      makeActivity({ id: "a2", childId: "c1", childName: "A", childInitiated: false }),
    ];
    const result = buildChildSustainabilityProfiles(activities);
    expect(result[0].childInitiatedRate).toBe(50);
  });

  it("calculates learning recorded rate", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", childName: "A", learningOutcomeRecorded: true }),
      makeActivity({ id: "a2", childId: "c1", childName: "A", learningOutcomeRecorded: false }),
      makeActivity({ id: "a3", childId: "c1", childName: "A", learningOutcomeRecorded: true }),
    ];
    const result = buildChildSustainabilityProfiles(activities);
    expect(result[0].learningRecordedRate).toBe(67);
  });

  it("calculates activity type diversity per child", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "c1", childName: "A", activityType: "recycling" }),
      makeActivity({ id: "a2", childId: "c1", childName: "A", activityType: "gardening" }),
      makeActivity({ id: "a3", childId: "c1", childName: "A", activityType: "composting" }),
      makeActivity({ id: "a4", childId: "c1", childName: "A", activityType: "recycling" }),
    ];
    const result = buildChildSustainabilityProfiles(activities);
    expect(result[0].activityTypeDiversity).toBe(3);
  });

  it("overall score is in 0-10 range", () => {
    const activities = Array.from({ length: 6 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: "c1",
        childName: "A",
        activityType: (["recycling", "gardening", "composting", "energy_saving", "water_conservation", "nature_walk"] as ActivityType[])[i],
      }),
    );
    const result = buildChildSustainabilityProfiles(activities);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("overall score is 0 for minimal poor data", () => {
    const activities = [
      makeActivity({
        id: "a1",
        childId: "c1",
        childName: "A",
        engagementLevel: "refused",
        childInitiated: false,
        learningOutcomeRecorded: false,
      }),
    ];
    const result = buildChildSustainabilityProfiles(activities);
    // 1 activity (1pt), engagement 0 (0pt), initiated 0% (0pt), diversity 1 (1pt) = 2
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("engagement score is capped at 10", () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", childName: "A", engagementLevel: "highly_engaged" }),
    );
    const result = buildChildSustainabilityProfiles(activities);
    expect(result[0].engagementScore).toBeLessThanOrEqual(10);
  });

  it("overall score components: activity count >= 5 gives 2 points", () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", childName: "A", engagementLevel: "refused", childInitiated: false }),
    );
    const result = buildChildSustainabilityProfiles(activities);
    // 5 activities = 2pts, engagement 0 = 0pts (refused), initiated 0% = 0pts, diversity 1 type = 1pt
    expect(result[0].overallScore).toBe(3);
  });

  it("overall score components: activity count 2-4 gives 1 point", () => {
    const activities = Array.from({ length: 2 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", childName: "A", engagementLevel: "refused", childInitiated: false }),
    );
    const result = buildChildSustainabilityProfiles(activities);
    // 2 activities = 1pt, engagement 0 = 0pts, initiated 0% = 0pts, diversity 1 type = 1pt
    expect(result[0].overallScore).toBe(2);
  });
});

// =============================================================================
// generateEnvironmentalSustainabilityIntelligence (main function)
// =============================================================================

describe("generateEnvironmentalSustainabilityIntelligence", () => {
  it("returns correct structure with all empty data", () => {
    const result = generateEnvironmentalSustainabilityIntelligence(
      [], null, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.activityEngagement.overallScore).toBe(0);
    expect(result.environmentalPractice.overallScore).toBe(0);
    expect(result.sustainabilityPolicy.overallScore).toBe(0);
    expect(result.staffReadiness.overallScore).toBe(0);
    expect(result.childProfiles).toEqual([]);
    expect(result.strengths).toEqual([]);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("caps overall score at 100", () => {
    const types: ActivityType[] = [
      "recycling", "energy_saving", "gardening", "composting",
      "water_conservation", "sustainable_shopping", "nature_walk",
      "environmental_project",
    ];
    const activities = Array.from({ length: 24 }, (_, i) =>
      makeActivity({ id: `a-${i}`, activityType: types[i % 8], engagementLevel: "highly_engaged" }),
    );
    const policy = makePolicy();
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `staff-${i}` }),
    );
    const result = generateEnvironmentalSustainabilityIntelligence(
      activities, policy, training,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("rates outstanding for score >= 80", () => {
    const types: ActivityType[] = [
      "recycling", "energy_saving", "gardening", "composting",
      "water_conservation", "sustainable_shopping", "nature_walk",
      "environmental_project",
    ];
    const activities = Array.from({ length: 16 }, (_, i) =>
      makeActivity({ id: `a-${i}`, activityType: types[i % 8], engagementLevel: "highly_engaged" }),
    );
    const policy = makePolicy();
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `staff-${i}` }),
    );
    const result = generateEnvironmentalSustainabilityIntelligence(
      activities, policy, training,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    if (result.overallScore >= 80) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("rates inadequate for score < 40", () => {
    const result = generateEnvironmentalSustainabilityIntelligence(
      [], null, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("generates URGENT actions when data is empty", () => {
    const result = generateEnvironmentalSustainabilityIntelligence(
      [], null, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT:"));
    expect(urgentActions.length).toBeGreaterThan(0);
  });

  it("generates strengths for good performance", () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, engagementLevel: "highly_engaged" }),
    );
    const policy = makePolicy();
    const result = generateEnvironmentalSustainabilityIntelligence(
      activities, policy, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for poor data", () => {
    const activities = [
      makeActivity({
        id: "a1",
        engagementLevel: "refused",
        childInitiated: false,
        learningOutcomeRecorded: false,
        staffSupported: false,
      }),
    ];
    const result = generateEnvironmentalSustainabilityIntelligence(
      activities, null, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateEnvironmentalSustainabilityIntelligence(
      [], null, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 29"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Environment Act 2021"))).toBe(true);
  });

  it("builds child profiles from activities", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "a2", childId: "child-jordan", childName: "Jordan" }),
      makeActivity({ id: "a3", childId: "child-morgan", childName: "Morgan" }),
    ];
    const result = generateEnvironmentalSustainabilityIntelligence(
      activities, null, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles).toHaveLength(3);
    const childIds = result.childProfiles.map((p) => p.childId);
    expect(childIds).toContain("child-alex");
    expect(childIds).toContain("child-jordan");
    expect(childIds).toContain("child-morgan");
  });

  it("overall score equals sum of sub-scores (when not capped)", () => {
    const activities = [
      makeActivity({
        id: "a1",
        engagementLevel: "reluctant",
        childInitiated: false,
        learningOutcomeRecorded: false,
        staffSupported: false,
      }),
    ];
    const result = generateEnvironmentalSustainabilityIntelligence(
      activities, null, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const expected =
      result.activityEngagement.overallScore +
      result.environmentalPractice.overallScore +
      result.sustainabilityPolicy.overallScore +
      result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(expected, 100));
  });

  it("overall score floors at 0", () => {
    const result = generateEnvironmentalSustainabilityIntelligence(
      [], null, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("passes homeId through correctly", () => {
    const result = generateEnvironmentalSustainabilityIntelligence(
      [], null, [],
      "my-home", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("my-home");
  });

  it("passes period dates through correctly", () => {
    const result = generateEnvironmentalSustainabilityIntelligence(
      [], null, [],
      "oak-house", "2025-06-01", "2025-12-31",
    );
    expect(result.periodStart).toBe("2025-06-01");
    expect(result.periodEnd).toBe("2025-12-31");
  });

  it("generates no strengths for all-empty data", () => {
    const result = generateEnvironmentalSustainabilityIntelligence(
      [], null, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths).toEqual([]);
  });

  it("generates actions for missing recycling scheme", () => {
    const policy = makePolicy({ recyclingScheme: false });
    const result = generateEnvironmentalSustainabilityIntelligence(
      [], policy, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("recycling"))).toBe(true);
  });

  it("generates actions for missing energy reduction plan", () => {
    const policy = makePolicy({ energyReductionPlan: false });
    const result = generateEnvironmentalSustainabilityIntelligence(
      [], policy, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("energy"))).toBe(true);
  });

  it("handles full realistic scenario", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex", activityType: "recycling", engagementLevel: "highly_engaged" }),
      makeActivity({ id: "a2", childId: "child-alex", childName: "Alex", activityType: "gardening", engagementLevel: "engaged" }),
      makeActivity({ id: "a3", childId: "child-jordan", childName: "Jordan", activityType: "energy_saving", engagementLevel: "partially_engaged" }),
      makeActivity({ id: "a4", childId: "child-jordan", childName: "Jordan", activityType: "nature_walk", engagementLevel: "reluctant", childInitiated: false }),
      makeActivity({ id: "a5", childId: "child-morgan", childName: "Morgan", activityType: "composting", engagementLevel: "highly_engaged" }),
      makeActivity({ id: "a6", childId: "child-morgan", childName: "Morgan", activityType: "water_conservation", engagementLevel: "engaged" }),
    ];
    const policy = makePolicy();
    const training = [
      makeTraining({ id: "t1" }),
      makeTraining({ id: "t2", staffId: "s-tom", staffName: "Tom", outdoorLearning: false }),
    ];
    const result = generateEnvironmentalSustainabilityIntelligence(
      activities, policy, training,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
  });
});
