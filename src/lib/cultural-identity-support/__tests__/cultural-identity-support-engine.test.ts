// ==============================================================================
// Cornerstone Cultural Identity Support Intelligence — Engine Tests
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateNeedsAssessment,
  evaluateCulturalActivities,
  evaluateIdentityPlanning,
  evaluateStaffCulturalReadiness,
  generateCulturalIdentitySupportIntelligence,
  getRating,
  getCulturalNeedTypeLabel,
  getSupportStatusLabel,
  getActivityTypeLabel,
  getEngagementLevelLabel,
  getRatingLabel,
} from "../cultural-identity-support-engine";
import type {
  CulturalNeedsAssessment,
  CulturalActivity,
  IdentityPlan,
  StaffCulturalTraining,
  CulturalNeedType,
  SupportStatus,
  ActivityType,
  EngagementLevel,
  Rating,
} from "../cultural-identity-support-engine";

// -- Constants ----------------------------------------------------------------

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-19";

// -- Factories ----------------------------------------------------------------

function makeAssessment(
  overrides: Partial<CulturalNeedsAssessment> = {},
): CulturalNeedsAssessment {
  return {
    id: "cna-001",
    childId: "child-alex",
    childName: "Alex",
    needType: "religion",
    description: "Church of England — wishes to attend Sunday services",
    supportStatus: "fully_met",
    assessmentDate: "2026-02-01",
    reviewDate: "2026-05-01",
    reviewCurrent: true,
    childConsulted: true,
    familyConsulted: true,
    ...overrides,
  };
}

function makeActivity(
  overrides: Partial<CulturalActivity> = {},
): CulturalActivity {
  return {
    id: "ca-001",
    date: "2026-02-10",
    activityType: "religious_observance",
    description: "Sunday church service",
    facilitatedBy: "Sarah Thompson",
    childrenParticipated: ["child-alex"],
    engagement: "high",
    resourcesProvided: true,
    childFeedbackPositive: true,
    ...overrides,
  };
}

function makePlan(overrides: Partial<IdentityPlan> = {}): IdentityPlan {
  return {
    id: "ip-001",
    childId: "child-alex",
    childName: "Alex",
    planInPlace: true,
    lastReviewDate: "2026-04-01",
    identityNeedsDocumented: true,
    lifeStoryWorkActive: true,
    culturalMentorAssigned: true,
    communityLinksEstablished: true,
    ...overrides,
  };
}

function makeTraining(
  overrides: Partial<StaffCulturalTraining> = {},
): StaffCulturalTraining {
  return {
    id: "sct-001",
    staffId: "staff-sarah",
    staffName: "Sarah Thompson",
    culturalAwareness: true,
    antiRacism: true,
    religiousLiteracy: true,
    identitySupport: true,
    lgbtqAwareness: true,
    communicationDiversity: true,
    ...overrides,
  };
}

// -- Oak House Demo Data ------------------------------------------------------

const DEMO_ASSESSMENTS: CulturalNeedsAssessment[] = [
  // Alex — White British, Church of England
  makeAssessment({
    id: "cna-alex-01", childId: "child-alex", childName: "Alex",
    needType: "religion", description: "CofE — Sunday services",
    supportStatus: "fully_met", reviewCurrent: true, childConsulted: true, familyConsulted: true,
  }),
  makeAssessment({
    id: "cna-alex-02", childId: "child-alex", childName: "Alex",
    needType: "heritage", description: "Local heritage exploration",
    supportStatus: "fully_met", reviewCurrent: true, childConsulted: true, familyConsulted: true,
  }),
  makeAssessment({
    id: "cna-alex-03", childId: "child-alex", childName: "Alex",
    needType: "festivals", description: "Christmas, Easter celebrations",
    supportStatus: "fully_met", reviewCurrent: true, childConsulted: true, familyConsulted: false,
  }),

  // Jordan — Black Caribbean, Rastafarian
  makeAssessment({
    id: "cna-jordan-01", childId: "child-jordan", childName: "Jordan",
    needType: "religion", description: "Rastafarian faith — livity, meditation",
    supportStatus: "partially_met", reviewCurrent: true, childConsulted: true, familyConsulted: true,
  }),
  makeAssessment({
    id: "cna-jordan-02", childId: "child-jordan", childName: "Jordan",
    needType: "diet", description: "Ital food — natural, unprocessed, plant-based",
    supportStatus: "partially_met", reviewCurrent: true, childConsulted: true, familyConsulted: true,
  }),
  makeAssessment({
    id: "cna-jordan-03", childId: "child-jordan", childName: "Jordan",
    needType: "hair_care", description: "Afro-Caribbean hair care products and styling",
    supportStatus: "fully_met", reviewCurrent: true, childConsulted: true, familyConsulted: false,
  }),
  makeAssessment({
    id: "cna-jordan-04", childId: "child-jordan", childName: "Jordan",
    needType: "language", description: "Jamaican Patois maintenance",
    supportStatus: "partially_met", reviewCurrent: false, childConsulted: true, familyConsulted: true,
  }),
  makeAssessment({
    id: "cna-jordan-05", childId: "child-jordan", childName: "Jordan",
    needType: "music", description: "Reggae and roots music — cultural connection",
    supportStatus: "fully_met", reviewCurrent: true, childConsulted: true, familyConsulted: false,
  }),
  makeAssessment({
    id: "cna-jordan-06", childId: "child-jordan", childName: "Jordan",
    needType: "community_links", description: "Black Caribbean community centre",
    supportStatus: "fully_met", reviewCurrent: true, childConsulted: true, familyConsulted: true,
  }),

  // Morgan — Mixed heritage White/Asian, Buddhist
  makeAssessment({
    id: "cna-morgan-01", childId: "child-morgan", childName: "Morgan",
    needType: "religion", description: "Buddhist practice — meditation and mindfulness",
    supportStatus: "fully_met", reviewCurrent: true, childConsulted: true, familyConsulted: true,
  }),
  makeAssessment({
    id: "cna-morgan-02", childId: "child-morgan", childName: "Morgan",
    needType: "diet", description: "Vegetarian — Buddhist practice",
    supportStatus: "fully_met", reviewCurrent: true, childConsulted: true, familyConsulted: true,
  }),
  makeAssessment({
    id: "cna-morgan-03", childId: "child-morgan", childName: "Morgan",
    needType: "heritage", description: "Dual heritage — White and Asian exploration",
    supportStatus: "fully_met", reviewCurrent: true, childConsulted: true, familyConsulted: true,
  }),
  makeAssessment({
    id: "cna-morgan-04", childId: "child-morgan", childName: "Morgan",
    needType: "festivals", description: "Lunar New Year, Vesak celebrations",
    supportStatus: "fully_met", reviewCurrent: true, childConsulted: true, familyConsulted: true,
  }),
];

const DEMO_ACTIVITIES: CulturalActivity[] = [
  // Alex
  makeActivity({
    id: "ca-alex-01", activityType: "religious_observance", date: "2026-02-10",
    description: "Sunday church service at local CofE parish",
    facilitatedBy: "Sarah Thompson",
    childrenParticipated: ["child-alex"],
    engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
  }),
  makeActivity({
    id: "ca-alex-02", activityType: "heritage_activity", date: "2026-03-05",
    description: "Local history museum visit — family tree project",
    facilitatedBy: "Sarah Thompson",
    childrenParticipated: ["child-alex", "child-morgan"],
    engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
  }),

  // Jordan
  makeActivity({
    id: "ca-jordan-01", activityType: "cultural_celebration", date: "2026-02-20",
    description: "Caribbean carnival preparation and community event",
    facilitatedBy: "Lisa Chen",
    childrenParticipated: ["child-jordan", "child-alex", "child-morgan"],
    engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
  }),
  makeActivity({
    id: "ca-jordan-02", activityType: "community_visit", date: "2026-03-01",
    description: "Visit to local Black Caribbean community centre",
    facilitatedBy: "Lisa Chen",
    childrenParticipated: ["child-jordan"],
    engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
  }),
  makeActivity({
    id: "ca-jordan-03", activityType: "language_support", date: "2026-03-20",
    description: "Patois language session with community elder",
    facilitatedBy: "Lisa Chen",
    childrenParticipated: ["child-jordan"],
    engagement: "medium", resourcesProvided: true, childFeedbackPositive: true,
  }),
  makeActivity({
    id: "ca-jordan-04", activityType: "mentoring", date: "2026-04-05",
    description: "Mentoring session with Black Caribbean role model",
    facilitatedBy: "Community Volunteer",
    childrenParticipated: ["child-jordan"],
    engagement: "high", resourcesProvided: false, childFeedbackPositive: true,
  }),

  // Morgan
  makeActivity({
    id: "ca-morgan-01", activityType: "religious_observance", date: "2026-02-15",
    description: "Buddhist temple meditation session",
    facilitatedBy: "Lisa Chen",
    childrenParticipated: ["child-morgan"],
    engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
  }),
  makeActivity({
    id: "ca-morgan-02", activityType: "cultural_celebration", date: "2026-02-28",
    description: "Lunar New Year celebration with Asian community group",
    facilitatedBy: "Lisa Chen",
    childrenParticipated: ["child-morgan", "child-alex"],
    engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
  }),
  makeActivity({
    id: "ca-morgan-03", activityType: "identity_workshop", date: "2026-03-25",
    description: "Dual heritage identity work session with key worker",
    facilitatedBy: "Sarah Thompson",
    childrenParticipated: ["child-morgan"],
    engagement: "medium", resourcesProvided: true, childFeedbackPositive: true,
  }),
];

const DEMO_PLANS: IdentityPlan[] = [
  makePlan({
    id: "ip-alex-01", childId: "child-alex", childName: "Alex",
    planInPlace: true, lastReviewDate: "2026-04-01",
    identityNeedsDocumented: true, lifeStoryWorkActive: true,
    culturalMentorAssigned: false, communityLinksEstablished: true,
  }),
  makePlan({
    id: "ip-jordan-01", childId: "child-jordan", childName: "Jordan",
    planInPlace: true, lastReviewDate: "2026-04-15",
    identityNeedsDocumented: true, lifeStoryWorkActive: true,
    culturalMentorAssigned: true, communityLinksEstablished: true,
  }),
  makePlan({
    id: "ip-morgan-01", childId: "child-morgan", childName: "Morgan",
    planInPlace: true, lastReviewDate: "2026-04-10",
    identityNeedsDocumented: true, lifeStoryWorkActive: true,
    culturalMentorAssigned: true, communityLinksEstablished: true,
  }),
];

const DEMO_TRAINING: StaffCulturalTraining[] = [
  makeTraining({
    id: "sct-sarah-01", staffId: "staff-sarah", staffName: "Sarah Thompson",
    culturalAwareness: true, antiRacism: true, religiousLiteracy: true,
    identitySupport: true, lgbtqAwareness: true, communicationDiversity: false,
  }),
  makeTraining({
    id: "sct-tom-01", staffId: "staff-tom", staffName: "Tom Williams",
    culturalAwareness: true, antiRacism: true, religiousLiteracy: false,
    identitySupport: false, lgbtqAwareness: false, communicationDiversity: false,
  }),
  makeTraining({
    id: "sct-lisa-01", staffId: "staff-lisa", staffName: "Lisa Chen",
    culturalAwareness: true, antiRacism: true, religiousLiteracy: true,
    identitySupport: true, lgbtqAwareness: true, communicationDiversity: true,
  }),
];

const TOTAL_CHILDREN = 3;

// =============================================================================
// getRating
// =============================================================================

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
});

// =============================================================================
// Label Functions
// =============================================================================

describe("Label functions", () => {
  describe("getCulturalNeedTypeLabel", () => {
    it("returns correct label for each need type", () => {
      const expected: Record<CulturalNeedType, string> = {
        language: "Language",
        religion: "Religion",
        diet: "Diet",
        clothing: "Clothing",
        festivals: "Festivals",
        heritage: "Heritage",
        hair_care: "Hair Care",
        skin_care: "Skin Care",
        music: "Music",
        community_links: "Community Links",
        other: "Other",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getCulturalNeedTypeLabel(key as CulturalNeedType)).toBe(label);
      }
    });
  });

  describe("getSupportStatusLabel", () => {
    it("returns correct label for each status", () => {
      const expected: Record<SupportStatus, string> = {
        fully_met: "Fully Met",
        partially_met: "Partially Met",
        not_met: "Not Met",
        under_review: "Under Review",
        not_assessed: "Not Assessed",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getSupportStatusLabel(key as SupportStatus)).toBe(label);
      }
    });
  });

  describe("getActivityTypeLabel", () => {
    it("returns correct label for each activity type", () => {
      const expected: Record<ActivityType, string> = {
        cultural_celebration: "Cultural Celebration",
        religious_observance: "Religious Observance",
        heritage_activity: "Heritage Activity",
        language_support: "Language Support",
        community_visit: "Community Visit",
        identity_workshop: "Identity Workshop",
        mentoring: "Mentoring",
        other: "Other",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getActivityTypeLabel(key as ActivityType)).toBe(label);
      }
    });
  });

  describe("getEngagementLevelLabel", () => {
    it("returns correct label for each engagement level", () => {
      const expected: Record<EngagementLevel, string> = {
        high: "High",
        medium: "Medium",
        low: "Low",
        refused: "Refused",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getEngagementLevelLabel(key as EngagementLevel)).toBe(label);
      }
    });
  });

  describe("getRatingLabel", () => {
    it("returns correct label for each rating", () => {
      const expected: Record<Rating, string> = {
        outstanding: "Outstanding",
        good: "Good",
        requires_improvement: "Requires Improvement",
        inadequate: "Inadequate",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getRatingLabel(key as Rating)).toBe(label);
      }
    });
  });
});

// =============================================================================
// evaluateNeedsAssessment
// =============================================================================

describe("evaluateNeedsAssessment", () => {
  it("returns zero scores for empty assessments", () => {
    const result = evaluateNeedsAssessment([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.fullyMetRate).toBe(0);
    expect(result.reviewCurrentRate).toBe(0);
    expect(result.childConsultedRate).toBe(0);
    expect(result.familyConsultedRate).toBe(0);
    expect(result.needTypeCoverage).toBe(0);
  });

  it("scores maximum for perfect inputs", () => {
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        needType: (["language", "religion", "diet", "clothing", "festivals"] as CulturalNeedType[])[i],
        supportStatus: "fully_met",
        reviewCurrent: true,
        childConsulted: true,
        familyConsulted: true,
      }),
    );
    const result = evaluateNeedsAssessment(assessments);
    expect(result.overallScore).toBe(25);
    expect(result.fullyMetRate).toBe(100);
    expect(result.reviewCurrentRate).toBe(100);
    expect(result.childConsultedRate).toBe(100);
    expect(result.familyConsultedRate).toBe(100);
  });

  it("calculates fully met rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", supportStatus: "fully_met" }),
      makeAssessment({ id: "a2", supportStatus: "partially_met" }),
      makeAssessment({ id: "a3", supportStatus: "not_met" }),
    ];
    const result = evaluateNeedsAssessment(assessments);
    expect(result.fullyMetRate).toBe(33);
  });

  it("awards 7 points for fully met rate >= 80%", () => {
    const assessments = [
      makeAssessment({ id: "a1", supportStatus: "fully_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a2", supportStatus: "fully_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a3", supportStatus: "fully_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a4", supportStatus: "fully_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a5", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
    ];
    const result = evaluateNeedsAssessment(assessments);
    expect(result.fullyMetRate).toBe(80);
    // 7 (fully met) + 0 + 0 + 0 = 7
    expect(result.overallScore).toBe(7);
  });

  it("awards 5 points for fully met rate >= 60% but < 80%", () => {
    const assessments = [
      makeAssessment({ id: "a1", supportStatus: "fully_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a2", supportStatus: "fully_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a3", supportStatus: "fully_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a4", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a5", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
    ];
    const result = evaluateNeedsAssessment(assessments);
    expect(result.fullyMetRate).toBe(60);
    expect(result.overallScore).toBe(5);
  });

  it("awards 3 points for fully met rate >= 40% but < 60%", () => {
    const assessments = [
      makeAssessment({ id: "a1", supportStatus: "fully_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a2", supportStatus: "fully_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a3", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a4", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a5", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
    ];
    const result = evaluateNeedsAssessment(assessments);
    expect(result.fullyMetRate).toBe(40);
    expect(result.overallScore).toBe(3);
  });

  it("awards 1 point for fully met rate >= 20% but < 40%", () => {
    const assessments = [
      makeAssessment({ id: "a1", supportStatus: "fully_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a2", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a3", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a4", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
    ];
    const result = evaluateNeedsAssessment(assessments);
    expect(result.fullyMetRate).toBe(25);
    expect(result.overallScore).toBe(1);
  });

  it("calculates review current rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", reviewCurrent: true }),
      makeAssessment({ id: "a2", reviewCurrent: true }),
      makeAssessment({ id: "a3", reviewCurrent: false }),
    ];
    const result = evaluateNeedsAssessment(assessments);
    expect(result.reviewCurrentRate).toBe(67);
  });

  it("calculates child consulted rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", childConsulted: true }),
      makeAssessment({ id: "a2", childConsulted: false }),
      makeAssessment({ id: "a3", childConsulted: true }),
      makeAssessment({ id: "a4", childConsulted: false }),
    ];
    const result = evaluateNeedsAssessment(assessments);
    expect(result.childConsultedRate).toBe(50);
  });

  it("calculates family consulted rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", familyConsulted: true }),
      makeAssessment({ id: "a2", familyConsulted: true }),
      makeAssessment({ id: "a3", familyConsulted: false }),
    ];
    const result = evaluateNeedsAssessment(assessments);
    expect(result.familyConsultedRate).toBe(67);
  });

  it("counts need type coverage correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", needType: "religion" }),
      makeAssessment({ id: "a2", needType: "diet" }),
      makeAssessment({ id: "a3", needType: "religion" }), // duplicate
      makeAssessment({ id: "a4", needType: "hair_care" }),
    ];
    const result = evaluateNeedsAssessment(assessments);
    expect(result.needTypeCoverage).toBe(3);
  });

  it("caps score at 25", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        supportStatus: "fully_met",
        reviewCurrent: true,
        childConsulted: true,
        familyConsulted: true,
      }),
    );
    const result = evaluateNeedsAssessment(assessments);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single assessment correctly", () => {
    const result = evaluateNeedsAssessment([makeAssessment()]);
    expect(result.totalAssessments).toBe(1);
    expect(result.fullyMetRate).toBe(100);
  });

  it("scores demo data appropriately", () => {
    const result = evaluateNeedsAssessment(DEMO_ASSESSMENTS);
    expect(result.totalAssessments).toBe(13);
    expect(result.fullyMetRate).toBeGreaterThan(50);
    expect(result.childConsultedRate).toBe(100);
    expect(result.needTypeCoverage).toBeGreaterThan(4);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives zero for all not_met, no consultation, no review", () => {
    const assessments = [
      makeAssessment({ id: "a1", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
      makeAssessment({ id: "a2", supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
    ];
    const result = evaluateNeedsAssessment(assessments);
    expect(result.overallScore).toBe(0);
  });
});

// =============================================================================
// evaluateCulturalActivities
// =============================================================================

describe("evaluateCulturalActivities", () => {
  it("returns zero scores for empty activities", () => {
    const result = evaluateCulturalActivities([], 3);
    expect(result.overallScore).toBe(0);
    expect(result.totalActivities).toBe(0);
    expect(result.engagementRate).toBe(0);
    expect(result.resourcesRate).toBe(0);
    expect(result.positiveFeedbackRate).toBe(0);
    expect(result.childrenReachedRate).toBe(0);
    expect(result.activityVariety).toBe(0);
  });

  it("scores maximum for perfect inputs", () => {
    const types: ActivityType[] = [
      "cultural_celebration", "religious_observance", "heritage_activity",
      "language_support", "community_visit",
    ];
    const activities = types.map((type, i) =>
      makeActivity({
        id: `a${i}`, activityType: type,
        childrenParticipated: ["child-alex", "child-jordan", "child-morgan"],
        engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
      }),
    );
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.overallScore).toBe(25);
    expect(result.engagementRate).toBe(100);
    expect(result.resourcesRate).toBe(100);
    expect(result.positiveFeedbackRate).toBe(100);
    expect(result.childrenReachedRate).toBe(100);
    expect(result.activityVariety).toBe(5);
  });

  it("calculates engagement rate correctly (high + medium)", () => {
    const activities = [
      makeActivity({ id: "a1", engagement: "high" }),
      makeActivity({ id: "a2", engagement: "medium" }),
      makeActivity({ id: "a3", engagement: "low" }),
      makeActivity({ id: "a4", engagement: "refused" }),
    ];
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.engagementRate).toBe(50);
  });

  it("awards 6 points for engagement >= 85%", () => {
    const activities = Array.from({ length: 7 }, (_, i) =>
      makeActivity({
        id: `a${i}`, engagement: i < 6 ? "high" : "low",
        resourcesProvided: false, childFeedbackPositive: false,
        childrenParticipated: [],
      }),
    );
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.engagementRate).toBe(86);
    // 6 (engagement) + 0 + 0 + 0 + 1 (1 type) = 7
    expect(result.overallScore).toBe(7);
  });

  it("awards 4 points for engagement >= 65% but < 85%", () => {
    const activities = [
      makeActivity({ id: "a1", engagement: "high", resourcesProvided: false, childFeedbackPositive: false, childrenParticipated: [] }),
      makeActivity({ id: "a2", engagement: "high", resourcesProvided: false, childFeedbackPositive: false, childrenParticipated: [] }),
      makeActivity({ id: "a3", engagement: "low", resourcesProvided: false, childFeedbackPositive: false, childrenParticipated: [] }),
    ];
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.engagementRate).toBe(67);
    // 4 (engagement) + 0 + 0 + 0 + 1 (1 type) = 5
    expect(result.overallScore).toBe(5);
  });

  it("calculates resources rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", resourcesProvided: true }),
      makeActivity({ id: "a2", resourcesProvided: true }),
      makeActivity({ id: "a3", resourcesProvided: false }),
    ];
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.resourcesRate).toBe(67);
  });

  it("calculates positive feedback rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", childFeedbackPositive: true }),
      makeActivity({ id: "a2", childFeedbackPositive: false }),
      makeActivity({ id: "a3", childFeedbackPositive: true }),
      makeActivity({ id: "a4", childFeedbackPositive: true }),
    ];
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.positiveFeedbackRate).toBe(75);
  });

  it("calculates children reached rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", childrenParticipated: ["child-alex"] }),
      makeActivity({ id: "a2", childrenParticipated: ["child-jordan"] }),
    ];
    const result = evaluateCulturalActivities(activities, 3);
    // 2 unique children out of 3 = 67%
    expect(result.childrenReachedRate).toBe(67);
  });

  it("handles zero totalChildren for children reached rate", () => {
    const activities = [
      makeActivity({ id: "a1", childrenParticipated: ["child-alex"] }),
    ];
    const result = evaluateCulturalActivities(activities, 0);
    expect(result.childrenReachedRate).toBe(0);
  });

  it("deduplicates children across activities", () => {
    const activities = [
      makeActivity({ id: "a1", childrenParticipated: ["child-alex", "child-jordan"] }),
      makeActivity({ id: "a2", childrenParticipated: ["child-alex", "child-morgan"] }),
    ];
    const result = evaluateCulturalActivities(activities, 3);
    // 3 unique children out of 3 = 100%
    expect(result.childrenReachedRate).toBe(100);
  });

  it("counts activity variety correctly", () => {
    const activities = [
      makeActivity({ id: "a1", activityType: "religious_observance" }),
      makeActivity({ id: "a2", activityType: "cultural_celebration" }),
      makeActivity({ id: "a3", activityType: "religious_observance" }),
      makeActivity({ id: "a4", activityType: "heritage_activity" }),
    ];
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.activityVariety).toBe(3);
  });

  it("awards 4 points for variety >= 5", () => {
    const types: ActivityType[] = [
      "cultural_celebration", "religious_observance", "heritage_activity",
      "language_support", "community_visit",
    ];
    const activities = types.map((type, i) =>
      makeActivity({
        id: `a${i}`, activityType: type,
        engagement: "low", resourcesProvided: false,
        childFeedbackPositive: false, childrenParticipated: [],
      }),
    );
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.activityVariety).toBe(5);
  });

  it("awards 3 points for variety >= 3 but < 5", () => {
    const types: ActivityType[] = ["cultural_celebration", "religious_observance", "heritage_activity"];
    const activities = types.map((type, i) =>
      makeActivity({
        id: `a${i}`, activityType: type,
        engagement: "low", resourcesProvided: false,
        childFeedbackPositive: false, childrenParticipated: [],
      }),
    );
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.activityVariety).toBe(3);
  });

  it("caps score at 25", () => {
    const types: ActivityType[] = [
      "cultural_celebration", "religious_observance", "heritage_activity",
      "language_support", "community_visit", "identity_workshop", "mentoring", "other",
    ];
    const activities = types.map((type, i) =>
      makeActivity({
        id: `a${i}`, activityType: type,
        childrenParticipated: ["child-alex", "child-jordan", "child-morgan"],
        engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
      }),
    );
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single activity correctly", () => {
    const result = evaluateCulturalActivities([makeActivity()], 3);
    expect(result.totalActivities).toBe(1);
  });

  it("scores demo data appropriately", () => {
    const result = evaluateCulturalActivities(DEMO_ACTIVITIES, TOTAL_CHILDREN);
    expect(result.totalActivities).toBe(9);
    expect(result.engagementRate).toBeGreaterThan(70);
    expect(result.positiveFeedbackRate).toBe(100);
    expect(result.childrenReachedRate).toBe(100);
    expect(result.activityVariety).toBeGreaterThan(4);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// =============================================================================
// evaluateIdentityPlanning
// =============================================================================

describe("evaluateIdentityPlanning", () => {
  it("returns zero scores for empty plans", () => {
    const result = evaluateIdentityPlanning([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPlans).toBe(0);
    expect(result.planInPlaceRate).toBe(0);
    expect(result.identityDocumentedRate).toBe(0);
    expect(result.lifeStoryRate).toBe(0);
    expect(result.mentorRate).toBe(0);
    expect(result.communityLinksRate).toBe(0);
  });

  it("scores maximum for perfect plans", () => {
    const plans = Array.from({ length: 3 }, (_, i) =>
      makePlan({
        id: `p${i}`,
        planInPlace: true,
        identityNeedsDocumented: true,
        lifeStoryWorkActive: true,
        culturalMentorAssigned: true,
        communityLinksEstablished: true,
      }),
    );
    const result = evaluateIdentityPlanning(plans);
    expect(result.overallScore).toBe(25);
    expect(result.planInPlaceRate).toBe(100);
    expect(result.identityDocumentedRate).toBe(100);
    expect(result.lifeStoryRate).toBe(100);
    expect(result.mentorRate).toBe(100);
    expect(result.communityLinksRate).toBe(100);
  });

  it("calculates plan in place rate correctly", () => {
    const plans = [
      makePlan({ id: "p1", planInPlace: true }),
      makePlan({ id: "p2", planInPlace: true }),
      makePlan({ id: "p3", planInPlace: false }),
    ];
    const result = evaluateIdentityPlanning(plans);
    expect(result.planInPlaceRate).toBe(67);
  });

  it("awards 6 points for plan in place >= 90%", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makePlan({
        id: `p${i}`,
        planInPlace: i < 9 ? true : false,
        identityNeedsDocumented: false,
        lifeStoryWorkActive: false,
        culturalMentorAssigned: false,
        communityLinksEstablished: false,
      }),
    );
    const result = evaluateIdentityPlanning(plans);
    expect(result.planInPlaceRate).toBe(90);
    // 6 (plan) + 0 + 0 + 0 + 0 = 6
    expect(result.overallScore).toBe(6);
  });

  it("awards 4 points for plan in place >= 70% but < 90%", () => {
    const plans = [
      makePlan({ id: "p1", planInPlace: true, identityNeedsDocumented: false, lifeStoryWorkActive: false, culturalMentorAssigned: false, communityLinksEstablished: false }),
      makePlan({ id: "p2", planInPlace: true, identityNeedsDocumented: false, lifeStoryWorkActive: false, culturalMentorAssigned: false, communityLinksEstablished: false }),
      makePlan({ id: "p3", planInPlace: false, identityNeedsDocumented: false, lifeStoryWorkActive: false, culturalMentorAssigned: false, communityLinksEstablished: false }),
    ];
    const result = evaluateIdentityPlanning(plans);
    expect(result.planInPlaceRate).toBe(67);
    // 2 (plan 50-69%) => but actually 67 >= 50 so score 2
    expect(result.overallScore).toBe(2);
  });

  it("calculates identity documented rate correctly", () => {
    const plans = [
      makePlan({ id: "p1", identityNeedsDocumented: true }),
      makePlan({ id: "p2", identityNeedsDocumented: false }),
      makePlan({ id: "p3", identityNeedsDocumented: true }),
    ];
    const result = evaluateIdentityPlanning(plans);
    expect(result.identityDocumentedRate).toBe(67);
  });

  it("calculates life story rate correctly", () => {
    const plans = [
      makePlan({ id: "p1", lifeStoryWorkActive: true }),
      makePlan({ id: "p2", lifeStoryWorkActive: true }),
      makePlan({ id: "p3", lifeStoryWorkActive: false }),
      makePlan({ id: "p4", lifeStoryWorkActive: false }),
    ];
    const result = evaluateIdentityPlanning(plans);
    expect(result.lifeStoryRate).toBe(50);
  });

  it("calculates mentor rate correctly", () => {
    const plans = [
      makePlan({ id: "p1", culturalMentorAssigned: true }),
      makePlan({ id: "p2", culturalMentorAssigned: false }),
      makePlan({ id: "p3", culturalMentorAssigned: false }),
    ];
    const result = evaluateIdentityPlanning(plans);
    expect(result.mentorRate).toBe(33);
  });

  it("calculates community links rate correctly", () => {
    const plans = [
      makePlan({ id: "p1", communityLinksEstablished: true }),
      makePlan({ id: "p2", communityLinksEstablished: true }),
      makePlan({ id: "p3", communityLinksEstablished: true }),
    ];
    const result = evaluateIdentityPlanning(plans);
    expect(result.communityLinksRate).toBe(100);
  });

  it("gives zero for all false across every field", () => {
    const plans = [
      makePlan({ id: "p1", planInPlace: false, identityNeedsDocumented: false, lifeStoryWorkActive: false, culturalMentorAssigned: false, communityLinksEstablished: false }),
      makePlan({ id: "p2", planInPlace: false, identityNeedsDocumented: false, lifeStoryWorkActive: false, culturalMentorAssigned: false, communityLinksEstablished: false }),
    ];
    const result = evaluateIdentityPlanning(plans);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const plans = Array.from({ length: 10 }, (_, i) =>
      makePlan({ id: `p${i}` }),
    );
    const result = evaluateIdentityPlanning(plans);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single plan correctly", () => {
    const result = evaluateIdentityPlanning([makePlan()]);
    expect(result.totalPlans).toBe(1);
    expect(result.planInPlaceRate).toBe(100);
  });

  it("scores demo data appropriately", () => {
    const result = evaluateIdentityPlanning(DEMO_PLANS);
    expect(result.totalPlans).toBe(3);
    expect(result.planInPlaceRate).toBe(100);
    expect(result.identityDocumentedRate).toBe(100);
    expect(result.lifeStoryRate).toBe(100);
    expect(result.communityLinksRate).toBe(100);
    expect(result.mentorRate).toBe(67);
    expect(result.overallScore).toBeGreaterThan(15);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// =============================================================================
// evaluateStaffCulturalReadiness
// =============================================================================

describe("evaluateStaffCulturalReadiness", () => {
  it("returns zero scores for empty training", () => {
    const result = evaluateStaffCulturalReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.awarenessRate).toBe(0);
    expect(result.antiRacismRate).toBe(0);
    expect(result.religiousLiteracyRate).toBe(0);
    expect(result.identitySupportRate).toBe(0);
    expect(result.lgbtqAwarenessRate).toBe(0);
    expect(result.communicationDiversityRate).toBe(0);
  });

  it("scores maximum for perfect training", () => {
    const training = Array.from({ length: 3 }, (_, i) =>
      makeTraining({ id: `t${i}` }),
    );
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.awarenessRate).toBe(100);
    expect(result.antiRacismRate).toBe(100);
    expect(result.religiousLiteracyRate).toBe(100);
    expect(result.identitySupportRate).toBe(100);
    expect(result.lgbtqAwarenessRate).toBe(100);
    expect(result.communicationDiversityRate).toBe(100);
  });

  it("calculates awareness rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", culturalAwareness: true }),
      makeTraining({ id: "t2", culturalAwareness: true }),
      makeTraining({ id: "t3", culturalAwareness: false }),
    ];
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.awarenessRate).toBe(67);
  });

  it("awards 5 points for awareness >= 90%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t${i}`,
        culturalAwareness: i < 9 ? true : false,
        antiRacism: false, religiousLiteracy: false,
        identitySupport: false, lgbtqAwareness: false, communicationDiversity: false,
      }),
    );
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.awarenessRate).toBe(90);
    // 5 (awareness) + 0 + 0 + 0 + 0 + 0 = 5
    expect(result.overallScore).toBe(5);
  });

  it("awards 3 points for awareness >= 70% but < 90%", () => {
    const training = [
      makeTraining({ id: "t1", culturalAwareness: true, antiRacism: false, religiousLiteracy: false, identitySupport: false, lgbtqAwareness: false, communicationDiversity: false }),
      makeTraining({ id: "t2", culturalAwareness: true, antiRacism: false, religiousLiteracy: false, identitySupport: false, lgbtqAwareness: false, communicationDiversity: false }),
      makeTraining({ id: "t3", culturalAwareness: false, antiRacism: false, religiousLiteracy: false, identitySupport: false, lgbtqAwareness: false, communicationDiversity: false }),
    ];
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.awarenessRate).toBe(67);
    // 67 < 70 => 1 point for awareness >= 50%
    expect(result.overallScore).toBe(1);
  });

  it("calculates anti-racism rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", antiRacism: true }),
      makeTraining({ id: "t2", antiRacism: false }),
      makeTraining({ id: "t3", antiRacism: true }),
    ];
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.antiRacismRate).toBe(67);
  });

  it("calculates religious literacy rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", religiousLiteracy: true }),
      makeTraining({ id: "t2", religiousLiteracy: true }),
      makeTraining({ id: "t3", religiousLiteracy: false }),
      makeTraining({ id: "t4", religiousLiteracy: false }),
    ];
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.religiousLiteracyRate).toBe(50);
  });

  it("calculates identity support rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", identitySupport: true }),
      makeTraining({ id: "t2", identitySupport: true }),
      makeTraining({ id: "t3", identitySupport: true }),
    ];
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.identitySupportRate).toBe(100);
  });

  it("calculates LGBTQ awareness rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", lgbtqAwareness: true }),
      makeTraining({ id: "t2", lgbtqAwareness: false }),
    ];
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.lgbtqAwarenessRate).toBe(50);
  });

  it("calculates communication diversity rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", communicationDiversity: true }),
      makeTraining({ id: "t2", communicationDiversity: false }),
      makeTraining({ id: "t3", communicationDiversity: false }),
    ];
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.communicationDiversityRate).toBe(33);
  });

  it("gives zero for all false across every field", () => {
    const training = [
      makeTraining({ id: "t1", culturalAwareness: false, antiRacism: false, religiousLiteracy: false, identitySupport: false, lgbtqAwareness: false, communicationDiversity: false }),
      makeTraining({ id: "t2", culturalAwareness: false, antiRacism: false, religiousLiteracy: false, identitySupport: false, lgbtqAwareness: false, communicationDiversity: false }),
    ];
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t${i}` }),
    );
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single staff member correctly", () => {
    const result = evaluateStaffCulturalReadiness([makeTraining()]);
    expect(result.totalStaff).toBe(1);
    expect(result.awarenessRate).toBe(100);
  });

  it("scores demo data appropriately", () => {
    const result = evaluateStaffCulturalReadiness(DEMO_TRAINING);
    expect(result.totalStaff).toBe(3);
    expect(result.awarenessRate).toBe(100);
    expect(result.antiRacismRate).toBe(100);
    expect(result.religiousLiteracyRate).toBe(67);
    expect(result.identitySupportRate).toBe(67);
    expect(result.lgbtqAwarenessRate).toBe(67);
    expect(result.communicationDiversityRate).toBe(33);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// =============================================================================
// generateCulturalIdentitySupportIntelligence
// =============================================================================

describe("generateCulturalIdentitySupportIntelligence", () => {
  it("returns complete intelligence for empty inputs", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [], 0,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.needsAssessment.overallScore).toBe(0);
    expect(result.culturalActivities.overallScore).toBe(0);
    expect(result.identityPlanning.overallScore).toBe(0);
    expect(result.staffReadiness.overallScore).toBe(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("generates correct intelligence for Oak House demo data", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      DEMO_ASSESSMENTS, DEMO_ACTIVITIES, DEMO_PLANS, DEMO_TRAINING, TOTAL_CHILDREN,
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);

    expect(result.needsAssessment.totalAssessments).toBe(13);
    expect(result.culturalActivities.totalActivities).toBe(9);
    expect(result.identityPlanning.totalPlans).toBe(3);
    expect(result.staffReadiness.totalStaff).toBe(3);
  });

  it("caps overall score at 100", () => {
    const types: ActivityType[] = [
      "cultural_celebration", "religious_observance", "heritage_activity",
      "language_support", "community_visit",
    ];
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        supportStatus: "fully_met",
        reviewCurrent: true,
        childConsulted: true,
        familyConsulted: true,
      }),
    );
    const activities = types.map((type, i) =>
      makeActivity({
        id: `act${i}`, activityType: type,
        childrenParticipated: ["child-alex", "child-jordan", "child-morgan"],
        engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
      }),
    );
    const plans = Array.from({ length: 3 }, (_, i) => makePlan({ id: `p${i}` }));
    const training = Array.from({ length: 5 }, (_, i) => makeTraining({ id: `t${i}` }));

    const result = generateCulturalIdentitySupportIntelligence(
      assessments, activities, plans, training, 3,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes all required regulatory links", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [], 0,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015 Reg 14"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("UNCRC Article 8"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("UNCRC Article 30"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Equality Act 2010"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Children Act 1989"))).toBe(true);
  });

  it("generates strengths when performance is high", () => {
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        supportStatus: "fully_met",
        reviewCurrent: true,
        childConsulted: true,
        familyConsulted: true,
      }),
    );
    const types: ActivityType[] = [
      "cultural_celebration", "religious_observance", "heritage_activity",
      "language_support", "community_visit",
    ];
    const activities = types.map((type, i) =>
      makeActivity({
        id: `act${i}`, activityType: type,
        childrenParticipated: ["child-alex", "child-jordan", "child-morgan"],
        engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
      }),
    );
    const plans = Array.from({ length: 3 }, (_, i) => makePlan({ id: `p${i}` }));
    const training = Array.from({ length: 3 }, (_, i) => makeTraining({ id: `t${i}` }));

    const result = generateCulturalIdentitySupportIntelligence(
      assessments, activities, plans, training, 3,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement when data is missing", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [], 0,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates urgent actions when no assessments recorded", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [], 0,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
    expect(result.actions.some((a) => a.includes("cultural needs assessments"))).toBe(true);
  });

  it("generates urgent actions when no activities recorded", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [makeAssessment()], [], [], [], 0,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("cultural activities programme"))).toBe(true);
  });

  it("generates urgent actions when no plans recorded", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [makeAssessment()], [makeActivity()], [], [], 3,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("identity plans"))).toBe(true);
  });

  it("generates urgent actions when no staff training recorded", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [makeAssessment()], [makeActivity()], [makePlan()], [], 3,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("staff cultural training"))).toBe(true);
  });

  it("sums all four sub-scores for overall score", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      DEMO_ASSESSMENTS, DEMO_ACTIVITIES, DEMO_PLANS, DEMO_TRAINING, TOTAL_CHILDREN,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const expectedSum =
      result.needsAssessment.overallScore +
      result.culturalActivities.overallScore +
      result.identityPlanning.overallScore +
      result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("rating matches overall score for outstanding", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        supportStatus: "fully_met",
        reviewCurrent: true,
        childConsulted: true,
        familyConsulted: true,
      }),
    );
    const types: ActivityType[] = [
      "cultural_celebration", "religious_observance", "heritage_activity",
      "language_support", "community_visit",
    ];
    const activities = types.map((type, i) =>
      makeActivity({
        id: `act${i}`, activityType: type,
        childrenParticipated: ["child-alex", "child-jordan", "child-morgan"],
        engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
      }),
    );
    const plans = Array.from({ length: 3 }, (_, i) => makePlan({ id: `p${i}` }));
    const training = Array.from({ length: 3 }, (_, i) => makeTraining({ id: `t${i}` }));

    const highResult = generateCulturalIdentitySupportIntelligence(
      assessments, activities, plans, training, 3,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(highResult.rating).toBe("outstanding");
  });

  it("produces inadequate rating for very low scores", () => {
    const assessments = [
      makeAssessment({ supportStatus: "not_met", reviewCurrent: false, childConsulted: false, familyConsulted: false }),
    ];
    const activities = [
      makeActivity({ engagement: "refused", resourcesProvided: false, childFeedbackPositive: false, childrenParticipated: [] }),
    ];
    const plans = [
      makePlan({ planInPlace: false, identityNeedsDocumented: false, lifeStoryWorkActive: false, culturalMentorAssigned: false, communityLinksEstablished: false }),
    ];
    const training = [
      makeTraining({ culturalAwareness: false, antiRacism: false, religiousLiteracy: false, identitySupport: false, lgbtqAwareness: false, communicationDiversity: false }),
    ];

    const result = generateCulturalIdentitySupportIntelligence(
      assessments, activities, plans, training, 3,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
  });

  it("handles assessments-only data correctly", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      DEMO_ASSESSMENTS, [], [], [], 0,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.needsAssessment.totalAssessments).toBe(13);
    expect(result.culturalActivities.totalActivities).toBe(0);
    expect(result.identityPlanning.totalPlans).toBe(0);
    expect(result.staffReadiness.totalStaff).toBe(0);
  });

  it("handles activities-only data correctly", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], DEMO_ACTIVITIES, [], [], TOTAL_CHILDREN,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.needsAssessment.totalAssessments).toBe(0);
    expect(result.culturalActivities.totalActivities).toBe(9);
  });

  it("handles plans-only data correctly", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], DEMO_PLANS, [], 0,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.identityPlanning.totalPlans).toBe(3);
    expect(result.needsAssessment.totalAssessments).toBe(0);
  });

  it("handles training-only data correctly", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], DEMO_TRAINING, 0,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.staffReadiness.totalStaff).toBe(3);
    expect(result.needsAssessment.totalAssessments).toBe(0);
  });

  it("preserves homeId and period in result", () => {
    const result = generateCulturalIdentitySupportIntelligence(
      [], [], [], [], 0,
      "maple-lodge", "2026-03-01", "2026-04-30",
    );
    expect(result.homeId).toBe("maple-lodge");
    expect(result.periodStart).toBe("2026-03-01");
    expect(result.periodEnd).toBe("2026-04-30");
  });
});

// =============================================================================
// Edge Cases and Boundary Tests
// =============================================================================

describe("Edge cases", () => {
  it("handles many assessments", () => {
    const assessments = Array.from({ length: 50 }, (_, i) =>
      makeAssessment({ id: `a${i}`, supportStatus: i % 2 === 0 ? "fully_met" : "not_met" }),
    );
    const result = evaluateNeedsAssessment(assessments);
    expect(result.totalAssessments).toBe(50);
    expect(result.fullyMetRate).toBe(50);
  });

  it("handles many activities", () => {
    const activities = Array.from({ length: 30 }, (_, i) =>
      makeActivity({ id: `a${i}`, engagement: i % 3 === 0 ? "high" : "low" }),
    );
    const result = evaluateCulturalActivities(activities, 10);
    expect(result.totalActivities).toBe(30);
  });

  it("handles many plans", () => {
    const plans = Array.from({ length: 20 }, (_, i) =>
      makePlan({ id: `p${i}`, planInPlace: i % 2 === 0 }),
    );
    const result = evaluateIdentityPlanning(plans);
    expect(result.totalPlans).toBe(20);
    expect(result.planInPlaceRate).toBe(50);
  });

  it("handles many staff", () => {
    const training = Array.from({ length: 15 }, (_, i) =>
      makeTraining({ id: `t${i}`, culturalAwareness: i % 3 === 0 }),
    );
    const result = evaluateStaffCulturalReadiness(training);
    expect(result.totalStaff).toBe(15);
  });

  it("handles all cultural need types", () => {
    const types: CulturalNeedType[] = [
      "language", "religion", "diet", "clothing", "festivals",
      "heritage", "hair_care", "skin_care", "music", "community_links", "other",
    ];
    const assessments = types.map((type, i) =>
      makeAssessment({ id: `a${i}`, needType: type }),
    );
    const result = evaluateNeedsAssessment(assessments);
    expect(result.needTypeCoverage).toBe(11);
  });

  it("handles all support statuses", () => {
    const statuses: SupportStatus[] = ["fully_met", "partially_met", "not_met", "under_review", "not_assessed"];
    const assessments = statuses.map((status, i) =>
      makeAssessment({ id: `a${i}`, supportStatus: status }),
    );
    const result = evaluateNeedsAssessment(assessments);
    expect(result.totalAssessments).toBe(5);
    expect(result.fullyMetRate).toBe(20);
  });

  it("handles all activity types", () => {
    const types: ActivityType[] = [
      "cultural_celebration", "religious_observance", "heritage_activity",
      "language_support", "community_visit", "identity_workshop", "mentoring", "other",
    ];
    const activities = types.map((type, i) =>
      makeActivity({ id: `a${i}`, activityType: type }),
    );
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.activityVariety).toBe(8);
  });

  it("handles all engagement levels", () => {
    const levels: EngagementLevel[] = ["high", "medium", "low", "refused"];
    const activities = levels.map((level, i) =>
      makeActivity({ id: `a${i}`, engagement: level }),
    );
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.totalActivities).toBe(4);
    // high + medium = 2/4 = 50%
    expect(result.engagementRate).toBe(50);
  });

  it("handles empty childrenParticipated arrays", () => {
    const activities = [
      makeActivity({ id: "a1", childrenParticipated: [] }),
      makeActivity({ id: "a2", childrenParticipated: [] }),
    ];
    const result = evaluateCulturalActivities(activities, 3);
    expect(result.childrenReachedRate).toBe(0);
  });
});
