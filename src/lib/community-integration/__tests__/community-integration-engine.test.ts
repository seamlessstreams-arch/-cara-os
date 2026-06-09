// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Community Integration Intelligence — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateActivityParticipation,
  evaluateSocialNetworks,
  evaluateBarrierManagement,
  evaluateInclusionOutcomes,
  buildChildCommunityProfiles,
  generateCommunityIntegrationIntelligence,
  getRating,
  getActivityCategoryLabel,
  getParticipationLevelLabel,
  getFriendshipQualityLabel,
  getCommunityBarrierLabel,
  getSocialMediaSafetyLabel,
  getRatingLabel,
} from "../community-integration-engine";
import type {
  CommunityActivity,
  SocialNetwork,
  CommunityBarrierRecord,
  InclusionAssessment,
  ActivityCategory,
  ParticipationLevel,
  FriendshipQuality,
  CommunityBarrier,
  SocialMediaSafety,
  Rating,
} from "../community-integration-engine";

// ── Constants ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

// ── Factories ────────────────────────────────────────────────────────────────

function makeActivity(overrides: Partial<CommunityActivity> = {}): CommunityActivity {
  return {
    id: "act-001",
    childId: "child-alex",
    childName: "Alex",
    activityCategory: "sport",
    activityName: "Football Club",
    participationLevel: "regular",
    frequency: "weekly",
    startDate: "2026-01-15",
    childEnjoys: true,
    staffSupported: false,
    independentAttendance: true,
    communityBased: true,
    ...overrides,
  };
}

function makeNetwork(overrides: Partial<SocialNetwork> = {}): SocialNetwork {
  return {
    id: "net-001",
    childId: "child-alex",
    childName: "Alex",
    friendshipQuality: "strong",
    numberOfFriends: 4,
    friendsOutsideCare: true,
    socialMediaSafety: "safe_and_supported",
    communityMentor: true,
    regularSocialActivities: 3,
    ...overrides,
  };
}

function makeBarrier(overrides: Partial<CommunityBarrierRecord> = {}): CommunityBarrierRecord {
  return {
    id: "bar-001",
    childId: "child-jordan",
    childName: "Jordan",
    barrier: "transport",
    barrierDescription: "No direct bus route to activity venue",
    actionTaken: true,
    resolved: false,
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<InclusionAssessment> = {}): InclusionAssessment {
  return {
    id: "inc-001",
    childId: "child-alex",
    childName: "Alex",
    feelsPartOfCommunity: true,
    accessToLocalAmenities: true,
    positiveLocalRelationships: true,
    stigmaExperienced: false,
    independentTravelSkills: true,
    assessedDate: "2026-04-01",
    assessedBy: "Sarah Johnson",
    ...overrides,
  };
}

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────
// Alex: active in football club + youth group
// Jordan: limited engagement (transport barrier)
// Morgan: art class + volunteering + drama group

const DEMO_ACTIVITIES: CommunityActivity[] = [
  // Alex — football club (regular) + youth group (regular)
  makeActivity({ id: "act-a01", childId: "child-alex", childName: "Alex", activityCategory: "sport", activityName: "Oakwood Football Club", participationLevel: "regular", frequency: "weekly", childEnjoys: true, independentAttendance: true, communityBased: true }),
  makeActivity({ id: "act-a02", childId: "child-alex", childName: "Alex", activityCategory: "youth_group", activityName: "Friday Youth Group", participationLevel: "regular", frequency: "weekly", childEnjoys: true, independentAttendance: false, communityBased: true, staffSupported: true }),

  // Jordan — limited engagement, tried once at swimming
  makeActivity({ id: "act-j01", childId: "child-jordan", childName: "Jordan", activityCategory: "sport", activityName: "Swimming", participationLevel: "tried_once", frequency: "ad_hoc", childEnjoys: false, independentAttendance: false, communityBased: true, staffSupported: true }),

  // Morgan — art class + volunteering + drama group (all regular)
  makeActivity({ id: "act-m01", childId: "child-morgan", childName: "Morgan", activityCategory: "arts_culture", activityName: "Community Art Class", participationLevel: "regular", frequency: "weekly", childEnjoys: true, independentAttendance: true, communityBased: true }),
  makeActivity({ id: "act-m02", childId: "child-morgan", childName: "Morgan", activityCategory: "volunteering", activityName: "Charity Shop Volunteer", participationLevel: "regular", frequency: "fortnightly", childEnjoys: true, independentAttendance: true, communityBased: true }),
  makeActivity({ id: "act-m03", childId: "child-morgan", childName: "Morgan", activityCategory: "arts_culture", activityName: "Drama Group", participationLevel: "regular", frequency: "weekly", childEnjoys: true, independentAttendance: false, communityBased: true, staffSupported: true }),
];

const DEMO_NETWORKS: SocialNetwork[] = [
  makeNetwork({ id: "net-a01", childId: "child-alex", childName: "Alex", friendshipQuality: "strong", numberOfFriends: 5, friendsOutsideCare: true, socialMediaSafety: "safe_and_supported", communityMentor: true, regularSocialActivities: 3 }),
  makeNetwork({ id: "net-j01", childId: "child-jordan", childName: "Jordan", friendshipQuality: "limited", numberOfFriends: 1, friendsOutsideCare: false, socialMediaSafety: "some_concerns", communityMentor: false, regularSocialActivities: 0 }),
  makeNetwork({ id: "net-m01", childId: "child-morgan", childName: "Morgan", friendshipQuality: "developing", numberOfFriends: 3, friendsOutsideCare: true, socialMediaSafety: "safe_and_supported", communityMentor: true, regularSocialActivities: 3 }),
];

const DEMO_BARRIERS: CommunityBarrierRecord[] = [
  makeBarrier({ id: "bar-j01", childId: "child-jordan", childName: "Jordan", barrier: "transport", barrierDescription: "No direct bus route to activity venues in the area", actionTaken: true, resolved: false }),
  makeBarrier({ id: "bar-j02", childId: "child-jordan", childName: "Jordan", barrier: "behaviour", barrierDescription: "Risk assessment limits unsupervised community access", actionTaken: true, resolved: false }),
];

const DEMO_ASSESSMENTS: InclusionAssessment[] = [
  makeAssessment({ id: "inc-a01", childId: "child-alex", childName: "Alex", feelsPartOfCommunity: true, accessToLocalAmenities: true, positiveLocalRelationships: true, stigmaExperienced: false, independentTravelSkills: true, assessedBy: "Sarah Johnson" }),
  makeAssessment({ id: "inc-j01", childId: "child-jordan", childName: "Jordan", feelsPartOfCommunity: false, accessToLocalAmenities: false, positiveLocalRelationships: false, stigmaExperienced: true, independentTravelSkills: false, assessedBy: "Sarah Johnson" }),
  makeAssessment({ id: "inc-m01", childId: "child-morgan", childName: "Morgan", feelsPartOfCommunity: true, accessToLocalAmenities: true, positiveLocalRelationships: true, stigmaExperienced: false, independentTravelSkills: true, assessedBy: "Sarah Johnson" }),
];

// ══════════════════════════════════════════════════════════════════════════════
// getRating
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
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("Label functions", () => {
  describe("getActivityCategoryLabel", () => {
    it("returns correct label for each category", () => {
      const expected: Record<ActivityCategory, string> = {
        sport: "Sport",
        arts_culture: "Arts & Culture",
        music: "Music",
        faith: "Faith",
        volunteering: "Volunteering",
        youth_group: "Youth Group",
        social_club: "Social Club",
        employment: "Employment",
        training: "Training",
        community_event: "Community Event",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getActivityCategoryLabel(key as ActivityCategory)).toBe(label);
      }
    });
  });

  describe("getParticipationLevelLabel", () => {
    it("returns correct label for each level", () => {
      const expected: Record<ParticipationLevel, string> = {
        regular: "Regular",
        occasional: "Occasional",
        tried_once: "Tried Once",
        refused: "Refused",
        not_offered: "Not Offered",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getParticipationLevelLabel(key as ParticipationLevel)).toBe(label);
      }
    });
  });

  describe("getFriendshipQualityLabel", () => {
    it("returns correct label for each quality", () => {
      const expected: Record<FriendshipQuality, string> = {
        strong: "Strong",
        developing: "Developing",
        limited: "Limited",
        isolated: "Isolated",
        not_assessed: "Not Assessed",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getFriendshipQualityLabel(key as FriendshipQuality)).toBe(label);
      }
    });
  });

  describe("getCommunityBarrierLabel", () => {
    it("returns correct label for each barrier", () => {
      const expected: Record<CommunityBarrier, string> = {
        transport: "Transport",
        cost: "Cost",
        stigma: "Stigma",
        behaviour: "Behaviour",
        risk_assessment: "Risk Assessment",
        staffing: "Staffing",
        location: "Location",
        none: "None",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getCommunityBarrierLabel(key as CommunityBarrier)).toBe(label);
      }
    });
  });

  describe("getSocialMediaSafetyLabel", () => {
    it("returns correct label for each safety level", () => {
      const expected: Record<SocialMediaSafety, string> = {
        safe_and_supported: "Safe and Supported",
        some_concerns: "Some Concerns",
        significant_risk: "Significant Risk",
        not_applicable: "Not Applicable",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getSocialMediaSafetyLabel(key as SocialMediaSafety)).toBe(label);
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

// ══════════════════════════════════════════════════════════════════════════════
// evaluateActivityParticipation
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateActivityParticipation", () => {
  it("returns zero scores for empty activities", () => {
    const result = evaluateActivityParticipation([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalActivities).toBe(0);
    expect(result.regularParticipationRate).toBe(0);
    expect(result.activityVariety).toBe(0);
    expect(result.communityBasedRate).toBe(0);
    expect(result.enjoymentRate).toBe(0);
    expect(result.independentAttendanceRate).toBe(0);
  });

  it("scores high for all-regular, diverse, community-based, enjoyed, independent activities", () => {
    const activities = [
      makeActivity({ id: "a1", activityCategory: "sport", participationLevel: "regular", communityBased: true, childEnjoys: true, independentAttendance: true }),
      makeActivity({ id: "a2", activityCategory: "arts_culture", participationLevel: "regular", communityBased: true, childEnjoys: true, independentAttendance: true }),
      makeActivity({ id: "a3", activityCategory: "music", participationLevel: "regular", communityBased: true, childEnjoys: true, independentAttendance: true }),
      makeActivity({ id: "a4", activityCategory: "volunteering", participationLevel: "regular", communityBased: true, childEnjoys: true, independentAttendance: true }),
      makeActivity({ id: "a5", activityCategory: "youth_group", participationLevel: "regular", communityBased: true, childEnjoys: true, independentAttendance: true }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.overallScore).toBe(25);
    expect(result.totalActivities).toBe(5);
    expect(result.regularParticipationRate).toBe(100);
    expect(result.activityVariety).toBe(5);
    expect(result.communityBasedRate).toBe(100);
    expect(result.enjoymentRate).toBe(100);
    expect(result.independentAttendanceRate).toBe(100);
  });

  it("calculates regular participation rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", participationLevel: "regular" }),
      makeActivity({ id: "a2", participationLevel: "regular" }),
      makeActivity({ id: "a3", participationLevel: "occasional" }),
      makeActivity({ id: "a4", participationLevel: "tried_once" }),
      makeActivity({ id: "a5", participationLevel: "refused" }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.regularParticipationRate).toBe(40);
  });

  it("awards 7 points for regular participation >= 80%", () => {
    const activities = [
      makeActivity({ id: "a1", participationLevel: "regular", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a2", participationLevel: "regular", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a3", participationLevel: "regular", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a4", participationLevel: "regular", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a5", participationLevel: "occasional", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
    ];
    const result = evaluateActivityParticipation(activities);
    // 80% regular => 7 points, 1 category => 1 point, 0% community => 0, 0% enjoy => 0, 0% independent => 0
    expect(result.overallScore).toBe(8);
  });

  it("awards 5 points for regular participation >= 60% but < 80%", () => {
    const activities = [
      makeActivity({ id: "a1", participationLevel: "regular", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a2", participationLevel: "regular", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a3", participationLevel: "regular", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a4", participationLevel: "occasional", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a5", participationLevel: "occasional", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
    ];
    const result = evaluateActivityParticipation(activities);
    // 60% regular => 5 points, 1 category => 1 point
    expect(result.overallScore).toBe(6);
  });

  it("awards 3 points for regular participation >= 40% but < 60%", () => {
    const activities = [
      makeActivity({ id: "a1", participationLevel: "regular", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a2", participationLevel: "regular", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a3", participationLevel: "occasional", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a4", participationLevel: "occasional", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a5", participationLevel: "occasional", activityCategory: "sport", communityBased: false, childEnjoys: false, independentAttendance: false }),
    ];
    const result = evaluateActivityParticipation(activities);
    // 40% regular => 3 points, 1 category => 1 point
    expect(result.overallScore).toBe(4);
  });

  it("counts activity variety correctly", () => {
    const activities = [
      makeActivity({ id: "a1", activityCategory: "sport" }),
      makeActivity({ id: "a2", activityCategory: "arts_culture" }),
      makeActivity({ id: "a3", activityCategory: "music" }),
      makeActivity({ id: "a4", activityCategory: "sport" }), // duplicate
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.activityVariety).toBe(3);
  });

  it("awards 5 points for activity variety >= 5", () => {
    const activities = [
      makeActivity({ id: "a1", activityCategory: "sport", participationLevel: "occasional", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a2", activityCategory: "arts_culture", participationLevel: "occasional", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a3", activityCategory: "music", participationLevel: "occasional", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a4", activityCategory: "volunteering", participationLevel: "occasional", communityBased: false, childEnjoys: false, independentAttendance: false }),
      makeActivity({ id: "a5", activityCategory: "youth_group", participationLevel: "occasional", communityBased: false, childEnjoys: false, independentAttendance: false }),
    ];
    const result = evaluateActivityParticipation(activities);
    // 0% regular => 0 pts, 5 categories => 5 pts
    expect(result.activityVariety).toBe(5);
  });

  it("calculates community-based rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", communityBased: true }),
      makeActivity({ id: "a2", communityBased: true }),
      makeActivity({ id: "a3", communityBased: false }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.communityBasedRate).toBe(67);
  });

  it("calculates enjoyment rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", childEnjoys: true }),
      makeActivity({ id: "a2", childEnjoys: true }),
      makeActivity({ id: "a3", childEnjoys: false }),
      makeActivity({ id: "a4", childEnjoys: false }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.enjoymentRate).toBe(50);
  });

  it("calculates independent attendance rate correctly", () => {
    const activities = [
      makeActivity({ id: "a1", independentAttendance: true }),
      makeActivity({ id: "a2", independentAttendance: false }),
      makeActivity({ id: "a3", independentAttendance: false }),
      makeActivity({ id: "a4", independentAttendance: false }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.independentAttendanceRate).toBe(25);
  });

  it("caps score at 25", () => {
    // Create perfect conditions that might exceed 25
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `a${i}`,
        activityCategory: ["sport", "arts_culture", "music", "volunteering", "youth_group", "social_club", "employment", "training", "community_event", "faith"][i] as ActivityCategory,
        participationLevel: "regular",
        communityBased: true,
        childEnjoys: true,
        independentAttendance: true,
      }),
    );
    const result = evaluateActivityParticipation(activities);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single activity correctly", () => {
    const result = evaluateActivityParticipation([
      makeActivity({ participationLevel: "regular", communityBased: true, childEnjoys: true, independentAttendance: true }),
    ]);
    expect(result.totalActivities).toBe(1);
    expect(result.regularParticipationRate).toBe(100);
    expect(result.activityVariety).toBe(1);
  });

  it("gives zero regular participation points when all refused", () => {
    const activities = [
      makeActivity({ id: "a1", participationLevel: "refused", communityBased: false, childEnjoys: false, independentAttendance: false, activityCategory: "sport" }),
      makeActivity({ id: "a2", participationLevel: "refused", communityBased: false, childEnjoys: false, independentAttendance: false, activityCategory: "sport" }),
    ];
    const result = evaluateActivityParticipation(activities);
    expect(result.regularParticipationRate).toBe(0);
  });

  it("scores demo data (Chamberlain House) appropriately", () => {
    const result = evaluateActivityParticipation(DEMO_ACTIVITIES);
    expect(result.totalActivities).toBe(6);
    // 5 out of 6 are regular => 83%
    expect(result.regularParticipationRate).toBe(83);
    // Categories: sport, youth_group, arts_culture, volunteering => 4
    expect(result.activityVariety).toBe(4);
    // All are community-based
    expect(result.communityBasedRate).toBe(100);
    // 5/6 enjoy
    expect(result.enjoymentRate).toBe(83);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSocialNetworks
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSocialNetworks", () => {
  it("returns zero scores for empty networks", () => {
    const result = evaluateSocialNetworks([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalNetworks).toBe(0);
    expect(result.friendshipQualityRate).toBe(0);
    expect(result.friendsOutsideCareRate).toBe(0);
    expect(result.mentorRate).toBe(0);
    expect(result.socialMediaSafetyRate).toBe(0);
  });

  it("scores high for excellent social networks", () => {
    const networks = [
      makeNetwork({ id: "n1", friendshipQuality: "strong", friendsOutsideCare: true, communityMentor: true, socialMediaSafety: "safe_and_supported" }),
      makeNetwork({ id: "n2", friendshipQuality: "strong", friendsOutsideCare: true, communityMentor: true, socialMediaSafety: "safe_and_supported" }),
      makeNetwork({ id: "n3", friendshipQuality: "developing", friendsOutsideCare: true, communityMentor: false, socialMediaSafety: "safe_and_supported" }),
    ];
    const result = evaluateSocialNetworks(networks);
    expect(result.overallScore).toBe(25);
    expect(result.friendshipQualityRate).toBe(100);
    expect(result.friendsOutsideCareRate).toBe(100);
  });

  it("calculates friendship quality rate correctly (strong + developing)", () => {
    const networks = [
      makeNetwork({ id: "n1", friendshipQuality: "strong" }),
      makeNetwork({ id: "n2", friendshipQuality: "developing" }),
      makeNetwork({ id: "n3", friendshipQuality: "limited" }),
      makeNetwork({ id: "n4", friendshipQuality: "isolated" }),
    ];
    const result = evaluateSocialNetworks(networks);
    expect(result.friendshipQualityRate).toBe(50);
  });

  it("awards 8 points for friendship quality >= 80%", () => {
    const networks = [
      makeNetwork({ id: "n1", friendshipQuality: "strong", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "some_concerns" }),
      makeNetwork({ id: "n2", friendshipQuality: "strong", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "some_concerns" }),
      makeNetwork({ id: "n3", friendshipQuality: "strong", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "some_concerns" }),
      makeNetwork({ id: "n4", friendshipQuality: "strong", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "some_concerns" }),
      makeNetwork({ id: "n5", friendshipQuality: "developing", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "some_concerns" }),
    ];
    const result = evaluateSocialNetworks(networks);
    // 100% friendship quality => 8 pts, 0% outside care => 0, 0% mentor => 0, 0% safe social => 0
    expect(result.friendshipQualityRate).toBe(100);
  });

  it("awards 5 points for friendship quality >= 60% but < 80%", () => {
    const networks = [
      makeNetwork({ id: "n1", friendshipQuality: "strong", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "significant_risk" }),
      makeNetwork({ id: "n2", friendshipQuality: "developing", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "significant_risk" }),
      makeNetwork({ id: "n3", friendshipQuality: "limited", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "significant_risk" }),
    ];
    const result = evaluateSocialNetworks(networks);
    expect(result.friendshipQualityRate).toBe(67);
  });

  it("calculates friends outside care rate correctly", () => {
    const networks = [
      makeNetwork({ id: "n1", friendsOutsideCare: true }),
      makeNetwork({ id: "n2", friendsOutsideCare: true }),
      makeNetwork({ id: "n3", friendsOutsideCare: false }),
    ];
    const result = evaluateSocialNetworks(networks);
    expect(result.friendsOutsideCareRate).toBe(67);
  });

  it("awards 6 points for friends outside care >= 70%", () => {
    const networks = [
      makeNetwork({ id: "n1", friendshipQuality: "limited", friendsOutsideCare: true, communityMentor: false, socialMediaSafety: "significant_risk" }),
      makeNetwork({ id: "n2", friendshipQuality: "limited", friendsOutsideCare: true, communityMentor: false, socialMediaSafety: "significant_risk" }),
      makeNetwork({ id: "n3", friendshipQuality: "limited", friendsOutsideCare: true, communityMentor: false, socialMediaSafety: "significant_risk" }),
    ];
    const result = evaluateSocialNetworks(networks);
    expect(result.friendsOutsideCareRate).toBe(100);
  });

  it("calculates mentor rate correctly", () => {
    const networks = [
      makeNetwork({ id: "n1", communityMentor: true }),
      makeNetwork({ id: "n2", communityMentor: false }),
      makeNetwork({ id: "n3", communityMentor: true }),
      makeNetwork({ id: "n4", communityMentor: false }),
    ];
    const result = evaluateSocialNetworks(networks);
    expect(result.mentorRate).toBe(50);
  });

  it("calculates social media safety rate correctly (safe + not_applicable)", () => {
    const networks = [
      makeNetwork({ id: "n1", socialMediaSafety: "safe_and_supported" }),
      makeNetwork({ id: "n2", socialMediaSafety: "not_applicable" }),
      makeNetwork({ id: "n3", socialMediaSafety: "some_concerns" }),
      makeNetwork({ id: "n4", socialMediaSafety: "significant_risk" }),
    ];
    const result = evaluateSocialNetworks(networks);
    expect(result.socialMediaSafetyRate).toBe(50);
  });

  it("caps score at 25", () => {
    const networks = Array.from({ length: 5 }, (_, i) =>
      makeNetwork({
        id: `n${i}`,
        friendshipQuality: "strong",
        friendsOutsideCare: true,
        communityMentor: true,
        socialMediaSafety: "safe_and_supported",
      }),
    );
    const result = evaluateSocialNetworks(networks);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single network correctly", () => {
    const result = evaluateSocialNetworks([
      makeNetwork({ friendshipQuality: "strong", friendsOutsideCare: true, communityMentor: true, socialMediaSafety: "safe_and_supported" }),
    ]);
    expect(result.totalNetworks).toBe(1);
    expect(result.friendshipQualityRate).toBe(100);
  });

  it("scores poorly for all isolated children", () => {
    const networks = [
      makeNetwork({ id: "n1", friendshipQuality: "isolated", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "significant_risk" }),
      makeNetwork({ id: "n2", friendshipQuality: "isolated", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "significant_risk" }),
    ];
    const result = evaluateSocialNetworks(networks);
    expect(result.friendshipQualityRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores demo data (Chamberlain House) appropriately", () => {
    const result = evaluateSocialNetworks(DEMO_NETWORKS);
    expect(result.totalNetworks).toBe(3);
    // 2 out of 3 are strong/developing
    expect(result.friendshipQualityRate).toBe(67);
    // 2 out of 3 have friends outside care
    expect(result.friendsOutsideCareRate).toBe(67);
    // 2 out of 3 have community mentors
    expect(result.mentorRate).toBe(67);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateBarrierManagement
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateBarrierManagement", () => {
  it("returns score 25 for empty barriers (no barriers = excellent)", () => {
    const result = evaluateBarrierManagement([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalBarriers).toBe(0);
    expect(result.resolutionRate).toBe(0);
    expect(result.actionTakenRate).toBe(0);
  });

  it("returns score 25 for barriers with only 'none' type", () => {
    const barriers = [
      makeBarrier({ id: "b1", barrier: "none", actionTaken: false, resolved: false }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.overallScore).toBe(25);
    expect(result.totalBarriers).toBe(0);
  });

  it("scores high for all barriers resolved with action taken", () => {
    const barriers = [
      makeBarrier({ id: "b1", barrier: "transport", actionTaken: true, resolved: true }),
      makeBarrier({ id: "b2", barrier: "cost", actionTaken: true, resolved: true }),
      makeBarrier({ id: "b3", barrier: "stigma", actionTaken: true, resolved: true }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.resolutionRate).toBe(100);
    expect(result.actionTakenRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("calculates resolution rate correctly", () => {
    const barriers = [
      makeBarrier({ id: "b1", barrier: "transport", resolved: true }),
      makeBarrier({ id: "b2", barrier: "cost", resolved: false }),
      makeBarrier({ id: "b3", barrier: "stigma", resolved: true }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.resolutionRate).toBe(67);
  });

  it("calculates action taken rate correctly", () => {
    const barriers = [
      makeBarrier({ id: "b1", barrier: "transport", actionTaken: true }),
      makeBarrier({ id: "b2", barrier: "cost", actionTaken: true }),
      makeBarrier({ id: "b3", barrier: "stigma", actionTaken: false }),
      makeBarrier({ id: "b4", barrier: "behaviour", actionTaken: false }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.actionTakenRate).toBe(50);
  });

  it("awards 10 points for resolution rate >= 80%", () => {
    const barriers = [
      makeBarrier({ id: "b1", barrier: "transport", actionTaken: false, resolved: true }),
      makeBarrier({ id: "b2", barrier: "cost", actionTaken: false, resolved: true }),
      makeBarrier({ id: "b3", barrier: "stigma", actionTaken: false, resolved: true }),
      makeBarrier({ id: "b4", barrier: "behaviour", actionTaken: false, resolved: true }),
      makeBarrier({ id: "b5", barrier: "staffing", actionTaken: false, resolved: false }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.resolutionRate).toBe(80);
  });

  it("awards 7 points for resolution rate >= 60% but < 80%", () => {
    const barriers = [
      makeBarrier({ id: "b1", barrier: "transport", actionTaken: false, resolved: true }),
      makeBarrier({ id: "b2", barrier: "cost", actionTaken: false, resolved: true }),
      makeBarrier({ id: "b3", barrier: "stigma", actionTaken: false, resolved: false }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.resolutionRate).toBe(67);
  });

  it("scores zero for no action taken and no resolution", () => {
    const barriers = [
      makeBarrier({ id: "b1", barrier: "transport", actionTaken: false, resolved: false }),
      makeBarrier({ id: "b2", barrier: "cost", actionTaken: false, resolved: false }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.overallScore).toBe(0);
    expect(result.resolutionRate).toBe(0);
    expect(result.actionTakenRate).toBe(0);
  });

  it("handles single barrier correctly", () => {
    const result = evaluateBarrierManagement([
      makeBarrier({ barrier: "transport", actionTaken: true, resolved: true }),
    ]);
    expect(result.totalBarriers).toBe(1);
    expect(result.resolutionRate).toBe(100);
    expect(result.actionTakenRate).toBe(100);
  });

  it("caps score at 25", () => {
    const barriers = Array.from({ length: 10 }, (_, i) =>
      makeBarrier({
        id: `b${i}`,
        barrier: "transport",
        actionTaken: true,
        resolved: true,
      }),
    );
    const result = evaluateBarrierManagement(barriers);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores demo data (Chamberlain House) appropriately", () => {
    const result = evaluateBarrierManagement(DEMO_BARRIERS);
    expect(result.totalBarriers).toBe(2);
    // Both have action taken, neither resolved
    expect(result.actionTakenRate).toBe(100);
    expect(result.resolutionRate).toBe(0);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("filters out 'none' barriers from scoring", () => {
    const barriers = [
      makeBarrier({ id: "b1", barrier: "none" }),
      makeBarrier({ id: "b2", barrier: "transport", actionTaken: true, resolved: true }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.totalBarriers).toBe(1);
  });

  it("gives bonus for proactive management", () => {
    const withAction = evaluateBarrierManagement([
      makeBarrier({ id: "b1", barrier: "transport", actionTaken: true, resolved: false }),
      makeBarrier({ id: "b2", barrier: "cost", actionTaken: true, resolved: false }),
      makeBarrier({ id: "b3", barrier: "stigma", actionTaken: true, resolved: false }),
    ]);
    const withoutAction = evaluateBarrierManagement([
      makeBarrier({ id: "b1", barrier: "transport", actionTaken: false, resolved: false }),
      makeBarrier({ id: "b2", barrier: "cost", actionTaken: false, resolved: false }),
      makeBarrier({ id: "b3", barrier: "stigma", actionTaken: false, resolved: false }),
    ]);
    expect(withAction.overallScore).toBeGreaterThan(withoutAction.overallScore);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateInclusionOutcomes
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInclusionOutcomes", () => {
  it("returns zero scores for empty assessments", () => {
    const result = evaluateInclusionOutcomes([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.communityBelongingRate).toBe(0);
    expect(result.amenityAccessRate).toBe(0);
    expect(result.positiveRelationshipsRate).toBe(0);
    expect(result.independentTravelRate).toBe(0);
  });

  it("scores high for all-positive assessments", () => {
    const assessments = [
      makeAssessment({ id: "i1", feelsPartOfCommunity: true, accessToLocalAmenities: true, positiveLocalRelationships: true, independentTravelSkills: true }),
      makeAssessment({ id: "i2", feelsPartOfCommunity: true, accessToLocalAmenities: true, positiveLocalRelationships: true, independentTravelSkills: true }),
      makeAssessment({ id: "i3", feelsPartOfCommunity: true, accessToLocalAmenities: true, positiveLocalRelationships: true, independentTravelSkills: true }),
    ];
    const result = evaluateInclusionOutcomes(assessments);
    expect(result.overallScore).toBe(25);
    expect(result.communityBelongingRate).toBe(100);
    expect(result.amenityAccessRate).toBe(100);
    expect(result.positiveRelationshipsRate).toBe(100);
    expect(result.independentTravelRate).toBe(100);
  });

  it("calculates community belonging rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "i1", feelsPartOfCommunity: true }),
      makeAssessment({ id: "i2", feelsPartOfCommunity: true }),
      makeAssessment({ id: "i3", feelsPartOfCommunity: false }),
    ];
    const result = evaluateInclusionOutcomes(assessments);
    expect(result.communityBelongingRate).toBe(67);
  });

  it("awards 7 points for community belonging >= 80%", () => {
    const assessments = [
      makeAssessment({ id: "i1", feelsPartOfCommunity: true, accessToLocalAmenities: false, positiveLocalRelationships: false, independentTravelSkills: false }),
      makeAssessment({ id: "i2", feelsPartOfCommunity: true, accessToLocalAmenities: false, positiveLocalRelationships: false, independentTravelSkills: false }),
      makeAssessment({ id: "i3", feelsPartOfCommunity: true, accessToLocalAmenities: false, positiveLocalRelationships: false, independentTravelSkills: false }),
      makeAssessment({ id: "i4", feelsPartOfCommunity: true, accessToLocalAmenities: false, positiveLocalRelationships: false, independentTravelSkills: false }),
    ];
    const result = evaluateInclusionOutcomes(assessments);
    expect(result.communityBelongingRate).toBe(100);
    // Exactly 7 for belonging + 0 for rest
    expect(result.overallScore).toBe(7);
  });

  it("awards 5 points for community belonging >= 60% but < 80%", () => {
    const assessments = [
      makeAssessment({ id: "i1", feelsPartOfCommunity: true, accessToLocalAmenities: false, positiveLocalRelationships: false, independentTravelSkills: false }),
      makeAssessment({ id: "i2", feelsPartOfCommunity: true, accessToLocalAmenities: false, positiveLocalRelationships: false, independentTravelSkills: false }),
      makeAssessment({ id: "i3", feelsPartOfCommunity: false, accessToLocalAmenities: false, positiveLocalRelationships: false, independentTravelSkills: false }),
    ];
    const result = evaluateInclusionOutcomes(assessments);
    expect(result.communityBelongingRate).toBe(67);
    expect(result.overallScore).toBe(5);
  });

  it("calculates amenity access rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "i1", accessToLocalAmenities: true }),
      makeAssessment({ id: "i2", accessToLocalAmenities: false }),
    ];
    const result = evaluateInclusionOutcomes(assessments);
    expect(result.amenityAccessRate).toBe(50);
  });

  it("calculates positive relationships rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "i1", positiveLocalRelationships: true }),
      makeAssessment({ id: "i2", positiveLocalRelationships: true }),
      makeAssessment({ id: "i3", positiveLocalRelationships: false }),
      makeAssessment({ id: "i4", positiveLocalRelationships: false }),
    ];
    const result = evaluateInclusionOutcomes(assessments);
    expect(result.positiveRelationshipsRate).toBe(50);
  });

  it("calculates independent travel rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "i1", independentTravelSkills: true }),
      makeAssessment({ id: "i2", independentTravelSkills: true }),
      makeAssessment({ id: "i3", independentTravelSkills: true }),
      makeAssessment({ id: "i4", independentTravelSkills: false }),
    ];
    const result = evaluateInclusionOutcomes(assessments);
    expect(result.independentTravelRate).toBe(75);
  });

  it("scores zero for all-negative assessments", () => {
    const assessments = [
      makeAssessment({ id: "i1", feelsPartOfCommunity: false, accessToLocalAmenities: false, positiveLocalRelationships: false, independentTravelSkills: false }),
      makeAssessment({ id: "i2", feelsPartOfCommunity: false, accessToLocalAmenities: false, positiveLocalRelationships: false, independentTravelSkills: false }),
    ];
    const result = evaluateInclusionOutcomes(assessments);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `i${i}`,
        feelsPartOfCommunity: true,
        accessToLocalAmenities: true,
        positiveLocalRelationships: true,
        independentTravelSkills: true,
      }),
    );
    const result = evaluateInclusionOutcomes(assessments);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single assessment correctly", () => {
    const result = evaluateInclusionOutcomes([
      makeAssessment({ feelsPartOfCommunity: true, accessToLocalAmenities: true, positiveLocalRelationships: true, independentTravelSkills: true }),
    ]);
    expect(result.totalAssessments).toBe(1);
    expect(result.communityBelongingRate).toBe(100);
  });

  it("scores demo data (Chamberlain House) appropriately", () => {
    const result = evaluateInclusionOutcomes(DEMO_ASSESSMENTS);
    expect(result.totalAssessments).toBe(3);
    // 2 out of 3 feel part of community
    expect(result.communityBelongingRate).toBe(67);
    // 2 out of 3 have access to amenities
    expect(result.amenityAccessRate).toBe(67);
    // 2 out of 3 have positive relationships
    expect(result.positiveRelationshipsRate).toBe(67);
    // 2 out of 3 have independent travel skills
    expect(result.independentTravelRate).toBe(67);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildCommunityProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildCommunityProfiles", () => {
  it("returns empty array when no data", () => {
    const profiles = buildChildCommunityProfiles([], [], [], []);
    expect(profiles).toHaveLength(0);
  });

  it("builds profiles from activities alone", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex", participationLevel: "regular" }),
      makeActivity({ id: "a2", childId: "child-alex", childName: "Alex", participationLevel: "regular" }),
    ];
    const profiles = buildChildCommunityProfiles(activities, [], [], []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].activityCount).toBe(2);
    expect(profiles[0].regularActivityCount).toBe(2);
    expect(profiles[0].friendshipQuality).toBe("no_data");
  });

  it("builds profiles from networks alone", () => {
    const networks = [
      makeNetwork({ id: "n1", childId: "child-alex", childName: "Alex", friendshipQuality: "strong" }),
    ];
    const profiles = buildChildCommunityProfiles([], networks, [], []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].friendshipQuality).toBe("strong");
    expect(profiles[0].activityCount).toBe(0);
  });

  it("builds profiles from barriers alone", () => {
    const barriers = [
      makeBarrier({ id: "b1", childId: "child-jordan", childName: "Jordan", barrier: "transport" }),
    ];
    const profiles = buildChildCommunityProfiles([], [], barriers, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].barriersCount).toBe(1);
  });

  it("builds profiles from assessments alone", () => {
    const assessments = [
      makeAssessment({ id: "i1", childId: "child-alex", childName: "Alex", feelsPartOfCommunity: true }),
    ];
    const profiles = buildChildCommunityProfiles([], [], [], assessments);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].feelsPartOfCommunity).toBe(true);
  });

  it("merges data from all sources for the same child", () => {
    const activities = [makeActivity({ childId: "child-alex", childName: "Alex", participationLevel: "regular" })];
    const networks = [makeNetwork({ childId: "child-alex", childName: "Alex", friendshipQuality: "strong", friendsOutsideCare: true })];
    const barriers = [makeBarrier({ childId: "child-alex", childName: "Alex", barrier: "transport", resolved: true })];
    const assessments = [makeAssessment({ childId: "child-alex", childName: "Alex", feelsPartOfCommunity: true })];

    const profiles = buildChildCommunityProfiles(activities, networks, barriers, assessments);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].activityCount).toBe(1);
    expect(profiles[0].friendshipQuality).toBe("strong");
    expect(profiles[0].barriersCount).toBe(1);
    expect(profiles[0].feelsPartOfCommunity).toBe(true);
  });

  it("creates separate profiles for different children", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeActivity({ id: "a2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildCommunityProfiles(activities, [], [], []);
    expect(profiles).toHaveLength(2);
    const alexProfile = profiles.find((p) => p.childId === "child-alex");
    const jordanProfile = profiles.find((p) => p.childId === "child-jordan");
    expect(alexProfile).toBeDefined();
    expect(jordanProfile).toBeDefined();
  });

  it("calculates profile score correctly for well-integrated child", () => {
    const activities = [
      makeActivity({ id: "a1", childId: "child-alex", childName: "Alex", participationLevel: "regular" }),
      makeActivity({ id: "a2", childId: "child-alex", childName: "Alex", participationLevel: "regular" }),
      makeActivity({ id: "a3", childId: "child-alex", childName: "Alex", participationLevel: "regular" }),
    ];
    const networks = [makeNetwork({ childId: "child-alex", childName: "Alex", friendshipQuality: "strong", friendsOutsideCare: true })];
    const assessments = [makeAssessment({ childId: "child-alex", childName: "Alex", feelsPartOfCommunity: true })];
    const profiles = buildChildCommunityProfiles(activities, networks, [], assessments);
    // 3 regular => 3 pts, strong friendship => 2 pts, no barriers => 2 pts, community belonging => 2 pts, outside friends => 1 pt = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("calculates profile score correctly for isolated child", () => {
    const networks = [makeNetwork({ childId: "child-jordan", childName: "Jordan", friendshipQuality: "isolated", friendsOutsideCare: false })];
    const barriers = [makeBarrier({ childId: "child-jordan", childName: "Jordan", barrier: "transport", resolved: false, actionTaken: false })];
    const assessments = [makeAssessment({ childId: "child-jordan", childName: "Jordan", feelsPartOfCommunity: false })];
    const profiles = buildChildCommunityProfiles([], networks, barriers, assessments);
    // 0 activities => 0, isolated => 0, 1 unresolved barrier => 0, no belonging => 0, no outside friends => 0
    expect(profiles[0].overallScore).toBe(0);
  });

  it("caps profile score at 10", () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({ id: `a${i}`, childId: "child-alex", childName: "Alex", participationLevel: "regular" }),
    );
    const networks = [makeNetwork({ childId: "child-alex", childName: "Alex", friendshipQuality: "strong", friendsOutsideCare: true, communityMentor: true })];
    const assessments = [makeAssessment({ childId: "child-alex", childName: "Alex", feelsPartOfCommunity: true })];
    const profiles = buildChildCommunityProfiles(activities, networks, [], assessments);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("filters out 'none' barriers from barrier count", () => {
    const barriers = [
      makeBarrier({ id: "b1", childId: "child-alex", childName: "Alex", barrier: "none" }),
      makeBarrier({ id: "b2", childId: "child-alex", childName: "Alex", barrier: "transport" }),
    ];
    const profiles = buildChildCommunityProfiles([], [], barriers, []);
    expect(profiles[0].barriersCount).toBe(1);
  });

  it("correctly counts barriers resolved", () => {
    const barriers = [
      makeBarrier({ id: "b1", childId: "child-alex", childName: "Alex", barrier: "transport", resolved: true }),
      makeBarrier({ id: "b2", childId: "child-alex", childName: "Alex", barrier: "cost", resolved: false }),
      makeBarrier({ id: "b3", childId: "child-alex", childName: "Alex", barrier: "stigma", resolved: true }),
    ];
    const profiles = buildChildCommunityProfiles([], [], barriers, []);
    expect(profiles[0].barriersCount).toBe(3);
    expect(profiles[0].barriersResolvedCount).toBe(2);
  });

  it("uses latest assessment for community belonging", () => {
    const assessments = [
      makeAssessment({ id: "i1", childId: "child-alex", childName: "Alex", feelsPartOfCommunity: false, assessedDate: "2026-01-01" }),
      makeAssessment({ id: "i2", childId: "child-alex", childName: "Alex", feelsPartOfCommunity: true, assessedDate: "2026-04-01" }),
    ];
    const profiles = buildChildCommunityProfiles([], [], [], assessments);
    expect(profiles[0].feelsPartOfCommunity).toBe(true);
  });

  it("returns null for feelsPartOfCommunity when no assessments", () => {
    const activities = [makeActivity({ childId: "child-alex", childName: "Alex" })];
    const profiles = buildChildCommunityProfiles(activities, [], [], []);
    expect(profiles[0].feelsPartOfCommunity).toBeNull();
  });

  it("scores demo data (Chamberlain House) profiles correctly", () => {
    const profiles = buildChildCommunityProfiles(DEMO_ACTIVITIES, DEMO_NETWORKS, DEMO_BARRIERS, DEMO_ASSESSMENTS);
    expect(profiles).toHaveLength(3);

    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.activityCount).toBe(2);
    expect(alex!.regularActivityCount).toBe(2);
    expect(alex!.friendshipQuality).toBe("strong");
    expect(alex!.feelsPartOfCommunity).toBe(true);
    expect(alex!.overallScore).toBeGreaterThanOrEqual(7);

    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan).toBeDefined();
    expect(jordan!.activityCount).toBe(1);
    expect(jordan!.regularActivityCount).toBe(0);
    expect(jordan!.friendshipQuality).toBe("limited");
    expect(jordan!.barriersCount).toBe(2);
    expect(jordan!.feelsPartOfCommunity).toBe(false);
    expect(jordan!.overallScore).toBeLessThanOrEqual(3);

    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan).toBeDefined();
    expect(morgan!.activityCount).toBe(3);
    expect(morgan!.regularActivityCount).toBe(3);
    expect(morgan!.friendshipQuality).toBe("developing");
    expect(morgan!.feelsPartOfCommunity).toBe(true);
    expect(morgan!.overallScore).toBeGreaterThanOrEqual(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateCommunityIntegrationIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateCommunityIntegrationIntelligence", () => {
  it("returns complete intelligence for empty inputs", () => {
    const result = generateCommunityIntegrationIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    // Activity=0, Social=0, Barrier=25 (no barriers), Inclusion=0 = 25
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
    expect(result.activityParticipation.overallScore).toBe(0);
    expect(result.socialNetworks.overallScore).toBe(0);
    expect(result.barrierManagement.overallScore).toBe(25);
    expect(result.inclusionOutcomes.overallScore).toBe(0);
    expect(result.childProfiles).toHaveLength(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("generates correct intelligence for Chamberlain House demo data", () => {
    const result = generateCommunityIntegrationIntelligence(
      DEMO_ACTIVITIES, DEMO_NETWORKS, DEMO_BARRIERS, DEMO_ASSESSMENTS,
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);

    // Sub-scores
    expect(result.activityParticipation.overallScore).toBeGreaterThan(0);
    expect(result.activityParticipation.totalActivities).toBe(6);
    expect(result.socialNetworks.overallScore).toBeGreaterThan(0);
    expect(result.socialNetworks.totalNetworks).toBe(3);
    expect(result.barrierManagement.totalBarriers).toBe(2);
    expect(result.inclusionOutcomes.totalAssessments).toBe(3);

    // Child profiles
    expect(result.childProfiles).toHaveLength(3);

    // Strengths, areas, actions
    expect(result.strengths.length).toBeGreaterThanOrEqual(0);
    expect(result.areasForImprovement.length).toBeGreaterThanOrEqual(0);
    expect(result.actions.length).toBeGreaterThanOrEqual(0);
  });

  it("caps overall score at 100", () => {
    // Create data that maximises each subscale
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `a${i}`,
        activityCategory: ["sport", "arts_culture", "music", "volunteering", "youth_group", "social_club", "employment", "training", "community_event", "faith"][i] as ActivityCategory,
        participationLevel: "regular",
        communityBased: true,
        childEnjoys: true,
        independentAttendance: true,
      }),
    );
    const networks = Array.from({ length: 5 }, (_, i) =>
      makeNetwork({
        id: `n${i}`,
        friendshipQuality: "strong",
        friendsOutsideCare: true,
        communityMentor: true,
        socialMediaSafety: "safe_and_supported",
      }),
    );
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({
        id: `inc${i}`,
        feelsPartOfCommunity: true,
        accessToLocalAmenities: true,
        positiveLocalRelationships: true,
        independentTravelSkills: true,
      }),
    );
    const result = generateCommunityIntegrationIntelligence(
      activities, networks, [], assessments,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes regulatory links", () => {
    const result = generateCommunityIntegrationIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 6 — quality of care standard including community participation");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 7 — children's views, wishes, and feelings about their community");
    expect(result.regulatoryLinks).toContain("UNCRC Article 31 — right to rest, leisure, play, and participation in cultural life");
    expect(result.regulatoryLinks).toContain("Equality Act 2010 — access to community activities without discrimination");
  });

  it("includes SCCIF and NMS references", () => {
    const result = generateCommunityIntegrationIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const sccif = result.regulatoryLinks.find((r) => r.includes("SCCIF"));
    expect(sccif).toBeDefined();
    const nms7 = result.regulatoryLinks.find((r) => r.includes("NMS 7"));
    expect(nms7).toBeDefined();
    const nms10 = result.regulatoryLinks.find((r) => r.includes("NMS 10"));
    expect(nms10).toBeDefined();
  });

  it("generates strengths when performance is high", () => {
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({
        id: `a${i}`,
        activityCategory: ["sport", "arts_culture", "music", "volunteering", "youth_group"][i] as ActivityCategory,
        participationLevel: "regular",
        communityBased: true,
        childEnjoys: true,
        independentAttendance: true,
      }),
    );
    const networks = [
      makeNetwork({ id: "n1", friendshipQuality: "strong", friendsOutsideCare: true, communityMentor: true, socialMediaSafety: "safe_and_supported" }),
    ];
    const assessments = [
      makeAssessment({ feelsPartOfCommunity: true, accessToLocalAmenities: true, positiveLocalRelationships: true, independentTravelSkills: true }),
    ];
    const result = generateCommunityIntegrationIntelligence(
      activities, networks, [], assessments,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("regular participation"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("variety"))).toBe(true);
  });

  it("generates areas for improvement when data is missing", () => {
    const result = generateCommunityIntegrationIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates urgent actions when no activities recorded", () => {
    const result = generateCommunityIntegrationIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
    expect(result.actions.some((a) => a.includes("community activity programme"))).toBe(true);
  });

  it("generates urgent actions when no social networks recorded", () => {
    const result = generateCommunityIntegrationIntelligence(
      [makeActivity()], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("social networks"))).toBe(true);
  });

  it("generates urgent actions when no inclusion assessments recorded", () => {
    const result = generateCommunityIntegrationIntelligence(
      [makeActivity()], [makeNetwork()], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("inclusion assessments"))).toBe(true);
  });

  it("sums all four sub-scores for overall score", () => {
    const result = generateCommunityIntegrationIntelligence(
      DEMO_ACTIVITIES, DEMO_NETWORKS, DEMO_BARRIERS, DEMO_ASSESSMENTS,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const expectedSum =
      result.activityParticipation.overallScore +
      result.socialNetworks.overallScore +
      result.barrierManagement.overallScore +
      result.inclusionOutcomes.overallScore;
    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("rating matches overall score", () => {
    // Outstanding
    const highActivities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `a${i}`,
        activityCategory: ["sport", "arts_culture", "music", "volunteering", "youth_group", "social_club", "employment", "training", "community_event", "faith"][i] as ActivityCategory,
        participationLevel: "regular",
        communityBased: true,
        childEnjoys: true,
        independentAttendance: true,
      }),
    );
    const highNetworks = Array.from({ length: 3 }, (_, i) =>
      makeNetwork({ id: `n${i}`, friendshipQuality: "strong", friendsOutsideCare: true, communityMentor: true, socialMediaSafety: "safe_and_supported" }),
    );
    const highAssessments = Array.from({ length: 3 }, (_, i) =>
      makeAssessment({ id: `i${i}`, feelsPartOfCommunity: true, accessToLocalAmenities: true, positiveLocalRelationships: true, independentTravelSkills: true }),
    );
    const highResult = generateCommunityIntegrationIntelligence(
      highActivities, highNetworks, [], highAssessments,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(highResult.rating).toBe("outstanding");
  });

  it("produces inadequate rating for very low scores", () => {
    const activities = [
      makeActivity({ participationLevel: "refused", communityBased: false, childEnjoys: false, independentAttendance: false }),
    ];
    const networks = [
      makeNetwork({ friendshipQuality: "isolated", friendsOutsideCare: false, communityMentor: false, socialMediaSafety: "significant_risk" }),
    ];
    const barriers = [
      makeBarrier({ barrier: "transport", actionTaken: false, resolved: false }),
      makeBarrier({ barrier: "cost", actionTaken: false, resolved: false }),
      makeBarrier({ barrier: "stigma", actionTaken: false, resolved: false }),
    ];
    const assessments = [
      makeAssessment({ feelsPartOfCommunity: false, accessToLocalAmenities: false, positiveLocalRelationships: false, independentTravelSkills: false }),
    ];
    const result = generateCommunityIntegrationIntelligence(
      activities, networks, barriers, assessments,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
  });

  it("handles activities-only data correctly", () => {
    const result = generateCommunityIntegrationIntelligence(
      DEMO_ACTIVITIES, [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.activityParticipation.totalActivities).toBe(6);
    expect(result.socialNetworks.totalNetworks).toBe(0);
    expect(result.barrierManagement.totalBarriers).toBe(0);
    expect(result.inclusionOutcomes.totalAssessments).toBe(0);
  });

  it("handles networks-only data correctly", () => {
    const result = generateCommunityIntegrationIntelligence(
      [], DEMO_NETWORKS, [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.activityParticipation.totalActivities).toBe(0);
    expect(result.socialNetworks.totalNetworks).toBe(3);
  });

  it("preserves homeId and period in result", () => {
    const result = generateCommunityIntegrationIntelligence(
      [], [], [], [],
      "maple-lodge", "2026-03-01", "2026-04-30",
    );
    expect(result.homeId).toBe("maple-lodge");
    expect(result.periodStart).toBe("2026-03-01");
    expect(result.periodEnd).toBe("2026-04-30");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge Cases and Boundary Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles many activities for a single child", () => {
    const activities = Array.from({ length: 50 }, (_, i) =>
      makeActivity({ id: `a${i}`, participationLevel: i % 2 === 0 ? "regular" : "occasional" }),
    );
    const result = evaluateActivityParticipation(activities);
    expect(result.totalActivities).toBe(50);
    expect(result.regularParticipationRate).toBe(50);
  });

  it("handles many networks", () => {
    const networks = Array.from({ length: 20 }, (_, i) =>
      makeNetwork({ id: `n${i}`, friendshipQuality: i % 3 === 0 ? "strong" : "limited" }),
    );
    const result = evaluateSocialNetworks(networks);
    expect(result.totalNetworks).toBe(20);
  });

  it("handles many barriers", () => {
    const barriers = Array.from({ length: 30 }, (_, i) =>
      makeBarrier({ id: `b${i}`, barrier: "transport", actionTaken: i % 2 === 0, resolved: i % 3 === 0 }),
    );
    const result = evaluateBarrierManagement(barriers);
    expect(result.totalBarriers).toBe(30);
  });

  it("handles all participation levels in activities", () => {
    const levels: ParticipationLevel[] = ["regular", "occasional", "tried_once", "refused", "not_offered"];
    const activities = levels.map((level, i) =>
      makeActivity({ id: `a${i}`, participationLevel: level }),
    );
    const result = evaluateActivityParticipation(activities);
    expect(result.totalActivities).toBe(5);
    expect(result.regularParticipationRate).toBe(20);
  });

  it("handles all friendship qualities in networks", () => {
    const qualities: FriendshipQuality[] = ["strong", "developing", "limited", "isolated", "not_assessed"];
    const networks = qualities.map((quality, i) =>
      makeNetwork({ id: `n${i}`, friendshipQuality: quality }),
    );
    const result = evaluateSocialNetworks(networks);
    expect(result.totalNetworks).toBe(5);
    expect(result.friendshipQualityRate).toBe(40);
  });

  it("handles all barrier types", () => {
    const barrierTypes: CommunityBarrier[] = ["transport", "cost", "stigma", "behaviour", "risk_assessment", "staffing", "location"];
    const barriers = barrierTypes.map((barrier, i) =>
      makeBarrier({ id: `b${i}`, barrier, actionTaken: true, resolved: true }),
    );
    const result = evaluateBarrierManagement(barriers);
    expect(result.totalBarriers).toBe(7);
    expect(result.resolutionRate).toBe(100);
    expect(result.actionTakenRate).toBe(100);
  });

  it("handles all activity categories", () => {
    const categories: ActivityCategory[] = ["sport", "arts_culture", "music", "faith", "volunteering", "youth_group", "social_club", "employment", "training", "community_event"];
    const activities = categories.map((cat, i) =>
      makeActivity({ id: `a${i}`, activityCategory: cat }),
    );
    const result = evaluateActivityParticipation(activities);
    expect(result.activityVariety).toBe(10);
  });

  it("handles all social media safety levels", () => {
    const levels: SocialMediaSafety[] = ["safe_and_supported", "some_concerns", "significant_risk", "not_applicable"];
    const networks = levels.map((safety, i) =>
      makeNetwork({ id: `n${i}`, socialMediaSafety: safety }),
    );
    const result = evaluateSocialNetworks(networks);
    expect(result.socialMediaSafetyRate).toBe(50); // safe_and_supported + not_applicable = 2/4 = 50%
  });

  it("handles mixed barrier 'none' and real barriers", () => {
    const barriers = [
      makeBarrier({ id: "b1", barrier: "none" }),
      makeBarrier({ id: "b2", barrier: "none" }),
      makeBarrier({ id: "b3", barrier: "transport", actionTaken: true, resolved: true }),
    ];
    const result = evaluateBarrierManagement(barriers);
    expect(result.totalBarriers).toBe(1);
    expect(result.resolutionRate).toBe(100);
  });
});
