// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Spiritual Wellbeing Development Intelligence — Engine Tests
//
// Covers all evaluators, helpers, label getters, child profiles, and the
// main orchestrator. 80+ tests covering empty, perfect, partial, and edge cases.
//
// Demo data: Chamberlain House — Alex, Jordan, Morgan
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getSpiritualActivityTypeLabel,
  getEngagementLevelLabel,
  getRatingLabel,
  getSpiritualActivityTypeLabels,
  getEngagementLevelLabels,
  getRatingLabels,
  evaluateSpiritualQuality,
  evaluateSpiritualCompliance,
  evaluateSpiritualPolicy,
  evaluateStaffSpiritualReadiness,
  buildChildSpiritualProfiles,
  generateSpiritualWellbeingDevelopmentIntelligence,
} from "../spiritual-wellbeing-development-engine";
import type {
  SpiritualActivity,
  SpiritualWellbeingPolicy,
  StaffSpiritualWellbeingTraining,
} from "../spiritual-wellbeing-development-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const HOME_ID = "oak-house";
const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-20";

// ── Factories ──────────────────────────────────────────────────────────────

let _id = 0;
function nextId(prefix = "rec"): string { return `${prefix}-${++_id}`; }

function makeActivity(overrides: Partial<SpiritualActivity> = {}): SpiritualActivity {
  return {
    id: nextId("sa"),
    childId: "child-alex",
    childName: "Alex",
    activityDate: "2026-03-10",
    activityType: "faith_practice",
    engagementLevel: "deeply_engaged",
    childChoiceMade: true,
    culturalNeedsConsidered: true,
    wellbeingBenefitNoted: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<SpiritualWellbeingPolicy> = {}): SpiritualWellbeingPolicy {
  return {
    id: nextId("sp"),
    spiritualDevelopmentStrategy: true,
    faithAndBeliefRespectPolicy: true,
    culturalCelebrationFramework: true,
    accessToWorshipPlaces: true,
    dietaryAndRitualAccommodation: true,
    staffGuidanceOnSpirituality: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffSpiritualWellbeingTraining> = {}): StaffSpiritualWellbeingTraining {
  return {
    id: nextId("st"),
    staffId: "s-01",
    staffName: "Sarah Johnson",
    spiritualAwareness: true,
    culturalCompetency: true,
    faithDiversityKnowledge: true,
    childCentredSpiritualSupport: true,
    ethicalBoundaries: true,
    reflectivePractice: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct()
// ══════════════════════════════════════════════════════════════════════════════

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
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating()
// ══════════════════════════════════════════════════════════════════════════════

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
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getSpiritualActivityTypeLabel", () => {
  it("returns correct label for faith_practice", () => {
    expect(getSpiritualActivityTypeLabel("faith_practice")).toBe("Faith Practice");
  });
  it("returns correct label for meditation_mindfulness", () => {
    expect(getSpiritualActivityTypeLabel("meditation_mindfulness")).toBe("Meditation & Mindfulness");
  });
  it("returns correct label for philosophical_discussion", () => {
    expect(getSpiritualActivityTypeLabel("philosophical_discussion")).toBe("Philosophical Discussion");
  });
  it("returns correct label for cultural_celebration", () => {
    expect(getSpiritualActivityTypeLabel("cultural_celebration")).toBe("Cultural Celebration");
  });
  it("returns correct label for community_worship", () => {
    expect(getSpiritualActivityTypeLabel("community_worship")).toBe("Community Worship");
  });
  it("returns correct label for values_exploration", () => {
    expect(getSpiritualActivityTypeLabel("values_exploration")).toBe("Values Exploration");
  });
  it("returns correct label for nature_reflection", () => {
    expect(getSpiritualActivityTypeLabel("nature_reflection")).toBe("Nature Reflection");
  });
  it("returns correct label for creative_spiritual_expression", () => {
    expect(getSpiritualActivityTypeLabel("creative_spiritual_expression")).toBe("Creative Spiritual Expression");
  });
});

describe("getEngagementLevelLabel", () => {
  it("returns correct label for deeply_engaged", () => {
    expect(getEngagementLevelLabel("deeply_engaged")).toBe("Deeply Engaged");
  });
  it("returns correct label for engaged", () => {
    expect(getEngagementLevelLabel("engaged")).toBe("Engaged");
  });
  it("returns correct label for moderate", () => {
    expect(getEngagementLevelLabel("moderate")).toBe("Moderate");
  });
  it("returns correct label for minimal", () => {
    expect(getEngagementLevelLabel("minimal")).toBe("Minimal");
  });
  it("returns correct label for declined", () => {
    expect(getEngagementLevelLabel("declined")).toBe("Declined");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns correct label for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns correct label for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns correct label for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("label map getters", () => {
  it("getSpiritualActivityTypeLabels returns all 8 labels", () => {
    const labels = getSpiritualActivityTypeLabels();
    expect(Object.keys(labels)).toHaveLength(8);
    expect(labels.faith_practice).toBe("Faith Practice");
  });

  it("getEngagementLevelLabels returns all 5 labels", () => {
    const labels = getEngagementLevelLabels();
    expect(Object.keys(labels)).toHaveLength(5);
    expect(labels.deeply_engaged).toBe("Deeply Engaged");
  });

  it("getRatingLabels returns all 4 labels", () => {
    const labels = getRatingLabels();
    expect(Object.keys(labels)).toHaveLength(4);
    expect(labels.outstanding).toBe("Outstanding");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSpiritualQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSpiritualQuality", () => {
  it("returns all zeros for empty array", () => {
    const result = evaluateSpiritualQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalActivities).toBe(0);
    expect(result.engagementRate).toBe(0);
    expect(result.childChoiceRate).toBe(0);
    expect(result.culturalConsiderationRate).toBe(0);
    expect(result.wellbeingBenefitRate).toBe(0);
  });

  it("returns perfect score for all ideal activities", () => {
    const activities = [
      makeActivity(),
      makeActivity({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = evaluateSpiritualQuality(activities);
    expect(result.overallScore).toBe(25);
    expect(result.engagementRate).toBe(100);
    expect(result.childChoiceRate).toBe(100);
    expect(result.culturalConsiderationRate).toBe(100);
    expect(result.wellbeingBenefitRate).toBe(100);
  });

  it("returns 0 when no positive qualities present", () => {
    const activities = [
      makeActivity({
        engagementLevel: "declined",
        childChoiceMade: false,
        culturalNeedsConsidered: false,
        wellbeingBenefitNoted: false,
      }),
    ];
    const result = evaluateSpiritualQuality(activities);
    expect(result.overallScore).toBe(0);
    expect(result.engagementRate).toBe(0);
    expect(result.childChoiceRate).toBe(0);
  });

  it("counts deeply_engaged and engaged as engaged", () => {
    const activities = [
      makeActivity({ engagementLevel: "deeply_engaged" }),
      makeActivity({ engagementLevel: "engaged" }),
      makeActivity({ engagementLevel: "moderate" }),
    ];
    const result = evaluateSpiritualQuality(activities);
    expect(result.engagementRate).toBe(67);
  });

  it("does not count moderate, minimal, or declined as engaged", () => {
    const activities = [
      makeActivity({ engagementLevel: "moderate" }),
      makeActivity({ engagementLevel: "minimal" }),
      makeActivity({ engagementLevel: "declined" }),
    ];
    const result = evaluateSpiritualQuality(activities);
    expect(result.engagementRate).toBe(0);
  });

  it("calculates correct rates for partial data", () => {
    const activities = [
      makeActivity({ childChoiceMade: true, culturalNeedsConsidered: true, wellbeingBenefitNoted: false }),
      makeActivity({ childChoiceMade: false, culturalNeedsConsidered: false, wellbeingBenefitNoted: true }),
    ];
    const result = evaluateSpiritualQuality(activities);
    expect(result.childChoiceRate).toBe(50);
    expect(result.culturalConsiderationRate).toBe(50);
    expect(result.wellbeingBenefitRate).toBe(50);
  });

  it("caps overall score at 25", () => {
    const activities = [makeActivity()];
    const result = evaluateSpiritualQuality(activities);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns totalActivities matching input length", () => {
    const activities = [makeActivity(), makeActivity(), makeActivity()];
    const result = evaluateSpiritualQuality(activities);
    expect(result.totalActivities).toBe(3);
  });

  it("calculates engagement weight correctly (0-7)", () => {
    // 100% engagement → 7 points. Only engagement, rest false
    const activities = [
      makeActivity({ childChoiceMade: false, culturalNeedsConsidered: false, wellbeingBenefitNoted: false }),
    ];
    const result = evaluateSpiritualQuality(activities);
    expect(result.overallScore).toBe(7);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSpiritualCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSpiritualCompliance", () => {
  it("returns all zeros for empty array", () => {
    const result = evaluateSpiritualCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
    expect(result.activityDiversityRatio).toBe(0);
  });

  it("returns perfect score for all compliant activities with full diversity", () => {
    const types: SpiritualActivity["activityType"][] = [
      "faith_practice", "meditation_mindfulness", "philosophical_discussion",
      "cultural_celebration", "community_worship", "values_exploration",
      "nature_reflection", "creative_spiritual_expression",
    ];
    const activities = types.map(activityType => makeActivity({ activityType }));
    const result = evaluateSpiritualCompliance(activities);
    expect(result.overallScore).toBe(25);
    expect(result.documentedRate).toBe(100);
    expect(result.staffSupportedRate).toBe(100);
    expect(result.feedbackRate).toBe(100);
    expect(result.activityDiversityRatio).toBe(1);
  });

  it("returns 0 when no compliance qualities present", () => {
    const activities = [
      makeActivity({ documentedInPlan: false, staffSupported: false, feedbackGiven: false }),
    ];
    const result = evaluateSpiritualCompliance(activities);
    // Only 1 type out of 8, diversity score = round(0.125 * 5) = 1
    expect(result.documentedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
  });

  it("calculates diversity ratio correctly", () => {
    const activities = [
      makeActivity({ activityType: "faith_practice" }),
      makeActivity({ activityType: "meditation_mindfulness" }),
      makeActivity({ activityType: "nature_reflection" }),
      makeActivity({ activityType: "community_worship" }),
    ];
    const result = evaluateSpiritualCompliance(activities);
    expect(result.activityDiversityRatio).toBe(0.5);
  });

  it("calculates documented rate correctly for partial data", () => {
    const activities = [
      makeActivity({ documentedInPlan: true }),
      makeActivity({ documentedInPlan: false }),
    ];
    const result = evaluateSpiritualCompliance(activities);
    expect(result.documentedRate).toBe(50);
  });

  it("calculates staff supported rate correctly", () => {
    const activities = [
      makeActivity({ staffSupported: true }),
      makeActivity({ staffSupported: true }),
      makeActivity({ staffSupported: false }),
    ];
    const result = evaluateSpiritualCompliance(activities);
    expect(result.staffSupportedRate).toBe(67);
  });

  it("calculates feedback rate correctly", () => {
    const activities = [
      makeActivity({ feedbackGiven: true }),
      makeActivity({ feedbackGiven: false }),
      makeActivity({ feedbackGiven: false }),
    ];
    const result = evaluateSpiritualCompliance(activities);
    expect(result.feedbackRate).toBe(33);
  });

  it("caps overall score at 25", () => {
    const types: SpiritualActivity["activityType"][] = [
      "faith_practice", "meditation_mindfulness", "philosophical_discussion",
      "cultural_celebration", "community_worship", "values_exploration",
      "nature_reflection", "creative_spiritual_expression",
    ];
    const activities = types.map(activityType => makeActivity({ activityType }));
    const result = evaluateSpiritualCompliance(activities);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores documented weight correctly (0-8)", () => {
    // 100% documented, rest false, 1 type
    const activities = [
      makeActivity({ staffSupported: false, feedbackGiven: false }),
    ];
    const result = evaluateSpiritualCompliance(activities);
    // documented=8, staffSupported=0, feedback=0, diversity=round(0.125*5)=1
    expect(result.overallScore).toBe(9);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSpiritualPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSpiritualPolicy", () => {
  it("returns all zeros/false for null", () => {
    const result = evaluateSpiritualPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.spiritualDevelopmentStrategy).toBe(false);
    expect(result.faithAndBeliefRespectPolicy).toBe(false);
    expect(result.culturalCelebrationFramework).toBe(false);
    expect(result.accessToWorshipPlaces).toBe(false);
    expect(result.dietaryAndRitualAccommodation).toBe(false);
    expect(result.staffGuidanceOnSpirituality).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns 25 for a fully complete policy", () => {
    const result = evaluateSpiritualPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.spiritualDevelopmentStrategy).toBe(true);
    expect(result.faithAndBeliefRespectPolicy).toBe(true);
    expect(result.culturalCelebrationFramework).toBe(true);
    expect(result.accessToWorshipPlaces).toBe(true);
    expect(result.dietaryAndRitualAccommodation).toBe(true);
    expect(result.staffGuidanceOnSpirituality).toBe(true);
    expect(result.regularReview).toBe(true);
  });

  it("returns 0 when all booleans are false", () => {
    const result = evaluateSpiritualPolicy(makePolicy({
      spiritualDevelopmentStrategy: false,
      faithAndBeliefRespectPolicy: false,
      culturalCelebrationFramework: false,
      accessToWorshipPlaces: false,
      dietaryAndRitualAccommodation: false,
      staffGuidanceOnSpirituality: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("scores spiritualDevelopmentStrategy as 4 points", () => {
    const result = evaluateSpiritualPolicy(makePolicy({
      spiritualDevelopmentStrategy: true,
      faithAndBeliefRespectPolicy: false,
      culturalCelebrationFramework: false,
      accessToWorshipPlaces: false,
      dietaryAndRitualAccommodation: false,
      staffGuidanceOnSpirituality: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores faithAndBeliefRespectPolicy as 4 points", () => {
    const result = evaluateSpiritualPolicy(makePolicy({
      spiritualDevelopmentStrategy: false,
      faithAndBeliefRespectPolicy: true,
      culturalCelebrationFramework: false,
      accessToWorshipPlaces: false,
      dietaryAndRitualAccommodation: false,
      staffGuidanceOnSpirituality: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores culturalCelebrationFramework as 4 points", () => {
    const result = evaluateSpiritualPolicy(makePolicy({
      spiritualDevelopmentStrategy: false,
      faithAndBeliefRespectPolicy: false,
      culturalCelebrationFramework: true,
      accessToWorshipPlaces: false,
      dietaryAndRitualAccommodation: false,
      staffGuidanceOnSpirituality: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores accessToWorshipPlaces as 4 points", () => {
    const result = evaluateSpiritualPolicy(makePolicy({
      spiritualDevelopmentStrategy: false,
      faithAndBeliefRespectPolicy: false,
      culturalCelebrationFramework: false,
      accessToWorshipPlaces: true,
      dietaryAndRitualAccommodation: false,
      staffGuidanceOnSpirituality: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores dietaryAndRitualAccommodation as 3 points", () => {
    const result = evaluateSpiritualPolicy(makePolicy({
      spiritualDevelopmentStrategy: false,
      faithAndBeliefRespectPolicy: false,
      culturalCelebrationFramework: false,
      accessToWorshipPlaces: false,
      dietaryAndRitualAccommodation: true,
      staffGuidanceOnSpirituality: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("scores staffGuidanceOnSpirituality as 3 points", () => {
    const result = evaluateSpiritualPolicy(makePolicy({
      spiritualDevelopmentStrategy: false,
      faithAndBeliefRespectPolicy: false,
      culturalCelebrationFramework: false,
      accessToWorshipPlaces: false,
      dietaryAndRitualAccommodation: false,
      staffGuidanceOnSpirituality: true,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("scores regularReview as 3 points", () => {
    const result = evaluateSpiritualPolicy(makePolicy({
      spiritualDevelopmentStrategy: false,
      faithAndBeliefRespectPolicy: false,
      culturalCelebrationFramework: false,
      accessToWorshipPlaces: false,
      dietaryAndRitualAccommodation: false,
      staffGuidanceOnSpirituality: false,
      regularReview: true,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("caps score at 25", () => {
    const result = evaluateSpiritualPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores partial policy correctly (4+4+3=11)", () => {
    const result = evaluateSpiritualPolicy(makePolicy({
      spiritualDevelopmentStrategy: true,
      faithAndBeliefRespectPolicy: true,
      culturalCelebrationFramework: false,
      accessToWorshipPlaces: false,
      dietaryAndRitualAccommodation: true,
      staffGuidanceOnSpirituality: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(11);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffSpiritualReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffSpiritualReadiness", () => {
  it("returns all zeros for empty array", () => {
    const result = evaluateStaffSpiritualReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.spiritualAwarenessRate).toBe(0);
    expect(result.culturalCompetencyRate).toBe(0);
    expect(result.faithDiversityKnowledgeRate).toBe(0);
    expect(result.childCentredSpiritualSupportRate).toBe(0);
    expect(result.ethicalBoundariesRate).toBe(0);
    expect(result.reflectivePracticeRate).toBe(0);
  });

  it("returns 25 when all staff have all training", () => {
    const training = [
      makeTraining(),
      makeTraining({ staffId: "s-02", staffName: "Tom Richards" }),
    ];
    const result = evaluateStaffSpiritualReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.spiritualAwarenessRate).toBe(100);
    expect(result.culturalCompetencyRate).toBe(100);
  });

  it("returns 0 when no staff have any training", () => {
    const training = [
      makeTraining({
        spiritualAwareness: false, culturalCompetency: false,
        faithDiversityKnowledge: false, childCentredSpiritualSupport: false,
        ethicalBoundaries: false, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffSpiritualReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("scores spiritualAwareness as 6 points max", () => {
    const training = [
      makeTraining({
        spiritualAwareness: true, culturalCompetency: false,
        faithDiversityKnowledge: false, childCentredSpiritualSupport: false,
        ethicalBoundaries: false, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffSpiritualReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("scores culturalCompetency as 5 points max", () => {
    const training = [
      makeTraining({
        spiritualAwareness: false, culturalCompetency: true,
        faithDiversityKnowledge: false, childCentredSpiritualSupport: false,
        ethicalBoundaries: false, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffSpiritualReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("scores faithDiversityKnowledge as 5 points max", () => {
    const training = [
      makeTraining({
        spiritualAwareness: false, culturalCompetency: false,
        faithDiversityKnowledge: true, childCentredSpiritualSupport: false,
        ethicalBoundaries: false, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffSpiritualReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("scores childCentredSpiritualSupport as 4 points max", () => {
    const training = [
      makeTraining({
        spiritualAwareness: false, culturalCompetency: false,
        faithDiversityKnowledge: false, childCentredSpiritualSupport: true,
        ethicalBoundaries: false, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffSpiritualReadiness(training);
    expect(result.overallScore).toBe(4);
  });

  it("scores ethicalBoundaries as 3 points max", () => {
    const training = [
      makeTraining({
        spiritualAwareness: false, culturalCompetency: false,
        faithDiversityKnowledge: false, childCentredSpiritualSupport: false,
        ethicalBoundaries: true, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffSpiritualReadiness(training);
    expect(result.overallScore).toBe(3);
  });

  it("scores reflectivePractice as 2 points max", () => {
    const training = [
      makeTraining({
        spiritualAwareness: false, culturalCompetency: false,
        faithDiversityKnowledge: false, childCentredSpiritualSupport: false,
        ethicalBoundaries: false, reflectivePractice: true,
      }),
    ];
    const result = evaluateStaffSpiritualReadiness(training);
    expect(result.overallScore).toBe(2);
  });

  it("calculates partial rates correctly with mixed training", () => {
    const training = [
      makeTraining({ spiritualAwareness: true, culturalCompetency: true, faithDiversityKnowledge: true, childCentredSpiritualSupport: true, ethicalBoundaries: true, reflectivePractice: true }),
      makeTraining({ staffId: "s-02", staffName: "Tom", spiritualAwareness: true, culturalCompetency: false, faithDiversityKnowledge: false, childCentredSpiritualSupport: false, ethicalBoundaries: false, reflectivePractice: false }),
    ];
    const result = evaluateStaffSpiritualReadiness(training);
    expect(result.spiritualAwarenessRate).toBe(100);
    expect(result.culturalCompetencyRate).toBe(50);
    expect(result.faithDiversityKnowledgeRate).toBe(50);
    expect(result.totalStaff).toBe(2);
  });

  it("caps overall score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffSpiritualReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildSpiritualProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildSpiritualProfiles", () => {
  it("returns empty array when no activities", () => {
    const result = buildChildSpiritualProfiles([]);
    expect(result).toHaveLength(0);
  });

  it("creates profile for child with activities", () => {
    const activities = [makeActivity({ childId: "child-alex", childName: "Alex" })];
    const profiles = buildChildSpiritualProfiles(activities);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalActivities).toBe(1);
  });

  it("creates separate profiles for multiple children", () => {
    const activities = [
      makeActivity({ childId: "child-alex", childName: "Alex" }),
      makeActivity({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildSpiritualProfiles(activities);
    expect(profiles).toHaveLength(2);
    expect(profiles.some(p => p.childId === "child-alex")).toBe(true);
    expect(profiles.some(p => p.childId === "child-jordan")).toBe(true);
  });

  it("calculates engagement rate correctly", () => {
    const activities = [
      makeActivity({ engagementLevel: "deeply_engaged" }),
      makeActivity({ engagementLevel: "engaged" }),
      makeActivity({ engagementLevel: "moderate" }),
    ];
    const profiles = buildChildSpiritualProfiles(activities);
    expect(profiles[0].engagementRate).toBe(67);
  });

  it("calculates child choice rate correctly", () => {
    const activities = [
      makeActivity({ childChoiceMade: true }),
      makeActivity({ childChoiceMade: false }),
    ];
    const profiles = buildChildSpiritualProfiles(activities);
    expect(profiles[0].childChoiceRate).toBe(50);
  });

  it("scores frequency >= 10 as 2 points", () => {
    const activities = Array.from({ length: 10 }, () =>
      makeActivity({ engagementLevel: "declined", childChoiceMade: false }),
    );
    const profiles = buildChildSpiritualProfiles(activities);
    // frequency=2, engagement(0%)=0, childChoice(0%)=0, diversity(1 type)=0
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores frequency >= 5 as 1 point", () => {
    const activities = Array.from({ length: 5 }, () =>
      makeActivity({ engagementLevel: "declined", childChoiceMade: false }),
    );
    const profiles = buildChildSpiritualProfiles(activities);
    // frequency=1, engagement(0%)=0, childChoice(0%)=0, diversity(1 type)=0
    expect(profiles[0].overallScore).toBe(1);
  });

  it("scores frequency < 5 as 0 points", () => {
    const activities = [
      makeActivity({ engagementLevel: "declined", childChoiceMade: false }),
    ];
    const profiles = buildChildSpiritualProfiles(activities);
    // frequency=0, engagement(0%)=0, childChoice(0%)=0, diversity(1 type)=0
    expect(profiles[0].overallScore).toBe(0);
  });

  it("scores engagement >= 80% as 3 points", () => {
    const activities = [
      makeActivity({ engagementLevel: "deeply_engaged", childChoiceMade: false }),
    ];
    const profiles = buildChildSpiritualProfiles(activities);
    // frequency=0, engagement(100%)=3, childChoice(0%)=0, diversity(1 type)=0
    expect(profiles[0].overallScore).toBe(3);
  });

  it("scores engagement >= 60% as 2 points", () => {
    const activities = [
      makeActivity({ engagementLevel: "deeply_engaged", childChoiceMade: false }),
      makeActivity({ engagementLevel: "deeply_engaged", childChoiceMade: false }),
      makeActivity({ engagementLevel: "moderate", childChoiceMade: false }),
    ];
    const profiles = buildChildSpiritualProfiles(activities);
    // engagement = 67% -> 2 points, frequency=0, childChoice=0, diversity=1 type -> 0
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores child choice >= 80% as 3 points", () => {
    const activities = [
      makeActivity({ engagementLevel: "declined", childChoiceMade: true }),
    ];
    const profiles = buildChildSpiritualProfiles(activities);
    // frequency=0, engagement=0, childChoice(100%)=3, diversity=0
    expect(profiles[0].overallScore).toBe(3);
  });

  it("scores diversity >= 4 types as 2 points", () => {
    const activities = [
      makeActivity({ activityType: "faith_practice", engagementLevel: "declined", childChoiceMade: false }),
      makeActivity({ activityType: "meditation_mindfulness", engagementLevel: "declined", childChoiceMade: false }),
      makeActivity({ activityType: "nature_reflection", engagementLevel: "declined", childChoiceMade: false }),
      makeActivity({ activityType: "community_worship", engagementLevel: "declined", childChoiceMade: false }),
    ];
    const profiles = buildChildSpiritualProfiles(activities);
    // frequency=0, engagement=0, childChoice=0, diversity(4)=2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores diversity >= 2 types as 1 point", () => {
    const activities = [
      makeActivity({ activityType: "faith_practice", engagementLevel: "declined", childChoiceMade: false }),
      makeActivity({ activityType: "meditation_mindfulness", engagementLevel: "declined", childChoiceMade: false }),
    ];
    const profiles = buildChildSpiritualProfiles(activities);
    // frequency=0, engagement=0, childChoice=0, diversity(2)=1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("caps child profile score at 10", () => {
    const activities = Array.from({ length: 12 }, (_, i) =>
      makeActivity({
        activityType: ["faith_practice", "meditation_mindfulness", "philosophical_discussion", "cultural_celebration"][i % 4] as SpiritualActivity["activityType"],
      }),
    );
    const profiles = buildChildSpiritualProfiles(activities);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("calculates correct score for perfect profile", () => {
    // frequency >= 10 -> 2, engagement 100% -> 3, childChoice 100% -> 3, diversity >= 4 -> 2 = 10
    const types: SpiritualActivity["activityType"][] = [
      "faith_practice", "meditation_mindfulness", "philosophical_discussion",
      "cultural_celebration", "community_worship", "values_exploration",
      "nature_reflection", "creative_spiritual_expression",
      "faith_practice", "meditation_mindfulness",
    ];
    const activities = types.map(activityType => makeActivity({ activityType }));
    const profiles = buildChildSpiritualProfiles(activities);
    expect(profiles[0].overallScore).toBe(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateSpiritualWellbeingDevelopmentIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateSpiritualWellbeingDevelopmentIntelligence", () => {
  it("produces complete intelligence with all sections", () => {
    const activities = [makeActivity()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.spiritualQuality).toBeDefined();
    expect(result.spiritualCompliance).toBeDefined();
    expect(result.spiritualPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("returns outstanding rating for perfect data", () => {
    const types: SpiritualActivity["activityType"][] = [
      "faith_practice", "meditation_mindfulness", "philosophical_discussion",
      "cultural_celebration", "community_worship", "values_exploration",
      "nature_reflection", "creative_spiritual_expression",
    ];
    const activities = types.map(activityType => makeActivity({ activityType }));
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ staffId: "s-02", staffName: "Tom" })];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate rating for empty/poor data", () => {
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });

  it("caps overall score at 100", () => {
    const types: SpiritualActivity["activityType"][] = [
      "faith_practice", "meditation_mindfulness", "philosophical_discussion",
      "cultural_celebration", "community_worship", "values_exploration",
      "nature_reflection", "creative_spiritual_expression",
    ];
    const activities = types.map(activityType => makeActivity({ activityType }));
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("sums all 4 evaluator scores", () => {
    const activities = [makeActivity()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    const expectedSum = result.spiritualQuality.overallScore + result.spiritualCompliance.overallScore +
      result.spiritualPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("includes 7 regulatory links", () => {
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some(l => l.includes("CHR 2015 Regulation 6"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("CHR 2015 Regulation 7"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("NMS 15"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("Children Act 1989 Section 22(5)"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("UNCRC Article 14"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("Equality Act 2010"))).toBe(true);
  });

  it("generates strength for high engagement", () => {
    const activities = [makeActivity(), makeActivity()];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("High engagement"))).toBe(true);
  });

  it("generates strength for child choice", () => {
    const activities = [makeActivity(), makeActivity()];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Children's choices are consistently respected"))).toBe(true);
  });

  it("generates strength for comprehensive policy", () => {
    const policy = makePolicy();
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Comprehensive spiritual wellbeing policy"))).toBe(true);
  });

  it("generates strength for strong staff readiness", () => {
    const training = [makeTraining()];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Strong staff readiness"))).toBe(true);
  });

  it("generates area for improvement for no policy", () => {
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [makeActivity()], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("No spiritual wellbeing policy"))).toBe(true);
  });

  it("generates area for improvement for missing spiritual development strategy", () => {
    const policy = makePolicy({ spiritualDevelopmentStrategy: false });
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("spiritual development strategy"))).toBe(true);
  });

  it("generates area for improvement for missing faith respect policy", () => {
    const policy = makePolicy({ faithAndBeliefRespectPolicy: false });
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("faith and belief respect"))).toBe(true);
  });

  it("generates area for improvement for missing cultural celebration framework", () => {
    const policy = makePolicy({ culturalCelebrationFramework: false });
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("cultural celebration framework"))).toBe(true);
  });

  it("generates area for improvement for missing access to worship places", () => {
    const policy = makePolicy({ accessToWorshipPlaces: false });
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("access to places of worship"))).toBe(true);
  });

  it("generates action for no activities", () => {
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Introduce a programme"))).toBe(true);
  });

  it("generates action for no policy", () => {
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Develop and implement a spiritual wellbeing development policy"))).toBe(true);
  });

  it("generates action for no training", () => {
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Establish a staff training programme"))).toBe(true);
  });

  it("generates action for missing regular review", () => {
    const policy = makePolicy({ regularReview: false });
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Schedule regular review"))).toBe(true);
  });

  it("handles all-empty data gracefully", () => {
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toHaveLength(0);
  });

  it("assigns rating thresholds correctly for perfect score", () => {
    const types: SpiritualActivity["activityType"][] = [
      "faith_practice", "meditation_mindfulness", "philosophical_discussion",
      "cultural_celebration", "community_worship", "values_exploration",
      "nature_reflection", "creative_spiritual_expression",
    ];
    const activities = types.map(activityType => makeActivity({ activityType }));
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("includes child profiles in the result", () => {
    const activities = [
      makeActivity({ childId: "child-alex", childName: "Alex" }),
      makeActivity({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles).toHaveLength(2);
    expect(result.childProfiles.some(p => p.childId === "child-alex")).toBe(true);
    expect(result.childProfiles.some(p => p.childId === "child-jordan")).toBe(true);
  });

  it("generates strength for diverse activities", () => {
    const types: SpiritualActivity["activityType"][] = [
      "faith_practice", "meditation_mindfulness", "philosophical_discussion",
      "cultural_celebration",
    ];
    const activities = types.map(activityType => makeActivity({ activityType }));
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Diverse range"))).toBe(true);
  });

  it("generates strength for well-documented activities", () => {
    const activities = [makeActivity(), makeActivity()];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("well documented"))).toBe(true);
  });

  it("generates area for improvement for low engagement", () => {
    const activities = [
      makeActivity({ engagementLevel: "declined" }),
      makeActivity({ engagementLevel: "minimal" }),
    ];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Engagement with spiritual activities is low"))).toBe(true);
  });

  it("generates action for low engagement", () => {
    const activities = [
      makeActivity({ engagementLevel: "declined" }),
      makeActivity({ engagementLevel: "minimal" }),
    ];
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Review spiritual activity programme"))).toBe(true);
  });
});
