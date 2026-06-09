// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Religious & Spiritual Support Intelligence — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateNeedsAssessment,
  evaluateSupportProvision,
  evaluateFestivalInclusion,
  evaluateStaffCompetence,
  buildChildFaithProfiles,
  generateReligiousSpiritualSupportIntelligence,
  getRating,
  getFaithBackgroundLabel,
  getSupportTypeLabel,
  getSupportQualityLabel,
  getChildPreferenceLabel,
  getRatingLabel,
} from "../religious-spiritual-support-engine";
import type {
  ChildFaithProfile,
  ReligiousSupportActivity,
  FestivalObservance,
  StaffDiversityTraining,
  FaithBackground,
  SupportType,
  SupportQuality,
  ChildPreference,
  Rating,
} from "../religious-spiritual-support-engine";

// ── Constants ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

// ── Factories ────────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<ChildFaithProfile> = {}): ChildFaithProfile {
  return {
    id: "fp-001",
    childId: "child-alex",
    childName: "Alex",
    faithBackground: "christianity",
    childPreference: "interested",
    needsAssessed: true,
    needsDocumented: true,
    supportPlanInPlace: true,
    lastReviewDate: "2026-04-01",
    reviewDue: false,
    ...overrides,
  };
}

function makeActivity(overrides: Partial<ReligiousSupportActivity> = {}): ReligiousSupportActivity {
  return {
    id: "rsa-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-03-10",
    supportType: "worship_access",
    quality: "good",
    childInitiated: true,
    childFeedbackPositive: true,
    facilitatedBy: "Sarah Johnson",
    ...overrides,
  };
}

function makeFestival(overrides: Partial<FestivalObservance> = {}): FestivalObservance {
  return {
    id: "fo-001",
    childId: "child-alex",
    childName: "Alex",
    festivalName: "Easter",
    date: "2026-04-05",
    observed: true,
    childInvolved: true,
    culturallyAppropriate: true,
    ...overrides,
  };
}

function makeStaff(overrides: Partial<StaffDiversityTraining> = {}): StaffDiversityTraining {
  return {
    id: "sdt-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    faithAwareness: true,
    culturalCompetence: true,
    antiDiscrimination: true,
    childRightsTraining: true,
    ...overrides,
  };
}

// ── getRating ────────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label Functions ──────────────────────────────────────────────────────────

describe("Label functions", () => {
  it("getFaithBackgroundLabel returns correct labels", () => {
    expect(getFaithBackgroundLabel("christianity")).toBe("Christianity");
    expect(getFaithBackgroundLabel("islam")).toBe("Islam");
    expect(getFaithBackgroundLabel("judaism")).toBe("Judaism");
    expect(getFaithBackgroundLabel("hinduism")).toBe("Hinduism");
    expect(getFaithBackgroundLabel("sikhism")).toBe("Sikhism");
    expect(getFaithBackgroundLabel("buddhism")).toBe("Buddhism");
    expect(getFaithBackgroundLabel("no_religion")).toBe("No Religion");
    expect(getFaithBackgroundLabel("spiritual_not_religious")).toBe("Spiritual (Not Religious)");
    expect(getFaithBackgroundLabel("other")).toBe("Other");
    expect(getFaithBackgroundLabel("not_recorded")).toBe("Not Recorded");
  });

  it("getSupportTypeLabel returns correct labels", () => {
    expect(getSupportTypeLabel("worship_access")).toBe("Worship Access");
    expect(getSupportTypeLabel("dietary_observance")).toBe("Dietary Observance");
    expect(getSupportTypeLabel("festival_celebration")).toBe("Festival Celebration");
    expect(getSupportTypeLabel("prayer_space")).toBe("Prayer Space");
    expect(getSupportTypeLabel("religious_education")).toBe("Religious Education");
    expect(getSupportTypeLabel("faith_leader_contact")).toBe("Faith Leader Contact");
    expect(getSupportTypeLabel("cultural_observance")).toBe("Cultural Observance");
    expect(getSupportTypeLabel("pastoral_support")).toBe("Pastoral Support");
  });

  it("getSupportQualityLabel returns correct labels", () => {
    expect(getSupportQualityLabel("excellent")).toBe("Excellent");
    expect(getSupportQualityLabel("good")).toBe("Good");
    expect(getSupportQualityLabel("adequate")).toBe("Adequate");
    expect(getSupportQualityLabel("poor")).toBe("Poor");
    expect(getSupportQualityLabel("not_provided")).toBe("Not Provided");
  });

  it("getChildPreferenceLabel returns correct labels", () => {
    expect(getChildPreferenceLabel("actively_practising")).toBe("Actively Practising");
    expect(getChildPreferenceLabel("interested")).toBe("Interested");
    expect(getChildPreferenceLabel("indifferent")).toBe("Indifferent");
    expect(getChildPreferenceLabel("private")).toBe("Private");
    expect(getChildPreferenceLabel("declined")).toBe("Declined");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateNeedsAssessment ──────────────────────────────────────────────────

describe("evaluateNeedsAssessment", () => {
  it("returns zero score for empty profiles", () => {
    const result = evaluateNeedsAssessment([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalProfiles).toBe(0);
    expect(result.needsAssessedRate).toBe(0);
    expect(result.needsDocumentedRate).toBe(0);
    expect(result.supportPlanRate).toBe(0);
    expect(result.reviewCurrentRate).toBe(0);
    expect(result.preferenceRecordedRate).toBe(0);
  });

  it("returns high score when all fields are perfect", () => {
    const profiles = [
      makeProfile({ id: "fp-1", childId: "c1" }),
      makeProfile({ id: "fp-2", childId: "c2" }),
      makeProfile({ id: "fp-3", childId: "c3" }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    // All assessed (7) + all documented (6) + all plans (5) + all current (4) + all recorded (3) = 25
    expect(result.overallScore).toBe(25);
    expect(result.needsAssessedRate).toBe(100);
    expect(result.needsDocumentedRate).toBe(100);
    expect(result.supportPlanRate).toBe(100);
    expect(result.reviewCurrentRate).toBe(100);
    expect(result.preferenceRecordedRate).toBe(100);
  });

  it("scores needs assessed correctly at different thresholds", () => {
    // 2 of 3 assessed = 67% → scores 3 (>=50%)
    const profiles = [
      makeProfile({ id: "fp-1", childId: "c1", needsAssessed: true }),
      makeProfile({ id: "fp-2", childId: "c2", needsAssessed: true }),
      makeProfile({ id: "fp-3", childId: "c3", needsAssessed: false }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.needsAssessedRate).toBe(67);
  });

  it("scores needs assessed at 70% threshold", () => {
    // 7 of 10 = 70% → scores 5
    const profiles = Array.from({ length: 10 }, (_, i) =>
      makeProfile({
        id: `fp-${i}`,
        childId: `c-${i}`,
        needsAssessed: i < 7,
      }),
    );
    const result = evaluateNeedsAssessment(profiles);
    expect(result.needsAssessedRate).toBe(70);
  });

  it("scores needs assessed at 90% threshold", () => {
    // 9 of 10 = 90% → scores 7
    const profiles = Array.from({ length: 10 }, (_, i) =>
      makeProfile({
        id: `fp-${i}`,
        childId: `c-${i}`,
        needsAssessed: i < 9,
      }),
    );
    const result = evaluateNeedsAssessment(profiles);
    expect(result.needsAssessedRate).toBe(90);
  });

  it("scores documented rate correctly", () => {
    const profiles = [
      makeProfile({ id: "fp-1", childId: "c1", needsDocumented: true }),
      makeProfile({ id: "fp-2", childId: "c2", needsDocumented: false }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.needsDocumentedRate).toBe(50);
  });

  it("scores support plan rate correctly", () => {
    const profiles = [
      makeProfile({ id: "fp-1", childId: "c1", supportPlanInPlace: true }),
      makeProfile({ id: "fp-2", childId: "c2", supportPlanInPlace: false }),
      makeProfile({ id: "fp-3", childId: "c3", supportPlanInPlace: false }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.supportPlanRate).toBe(33);
  });

  it("scores review current rate correctly", () => {
    const profiles = [
      makeProfile({ id: "fp-1", childId: "c1", reviewDue: false }),
      makeProfile({ id: "fp-2", childId: "c2", reviewDue: true }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.reviewCurrentRate).toBe(50);
  });

  it("scores preference recorded rate correctly for not_recorded faith backgrounds", () => {
    const profiles = [
      makeProfile({ id: "fp-1", childId: "c1", faithBackground: "christianity" }),
      makeProfile({ id: "fp-2", childId: "c2", faithBackground: "not_recorded" }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.preferenceRecordedRate).toBe(50);
  });

  it("counts single profile correctly", () => {
    const profiles = [makeProfile()];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.totalProfiles).toBe(1);
  });

  it("caps score at 25", () => {
    const profiles = Array.from({ length: 20 }, (_, i) =>
      makeProfile({ id: `fp-${i}`, childId: `c-${i}` }),
    );
    const result = evaluateNeedsAssessment(profiles);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles all profiles with needs not assessed — low score", () => {
    const profiles = [
      makeProfile({
        id: "fp-1",
        childId: "c1",
        needsAssessed: false,
        needsDocumented: false,
        supportPlanInPlace: false,
        reviewDue: true,
        faithBackground: "not_recorded",
      }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    // 0 assessed, 0 documented, 0 plan, 0 review current, 0 preference
    expect(result.overallScore).toBe(0);
  });

  it("handles small percentages above 0 — scores 1 for needs assessed >0 but <50", () => {
    // 1 of 4 = 25% → needsAssessed score should be 1
    const profiles = Array.from({ length: 4 }, (_, i) =>
      makeProfile({
        id: `fp-${i}`,
        childId: `c-${i}`,
        needsAssessed: i === 0,
        needsDocumented: false,
        supportPlanInPlace: false,
        reviewDue: true,
        faithBackground: "not_recorded",
      }),
    );
    const result = evaluateNeedsAssessment(profiles);
    expect(result.needsAssessedRate).toBe(25);
    // Only needsAssessed contributes 1 point
    expect(result.overallScore).toBe(1);
  });
});

// ── evaluateSupportProvision ─────────────────────────────────────────────────

describe("evaluateSupportProvision", () => {
  it("returns 25 when no children need support", () => {
    const profiles = [
      makeProfile({ childPreference: "declined", faithBackground: "no_religion" }),
    ];
    const result = evaluateSupportProvision([], profiles);
    expect(result.overallScore).toBe(25);
  });

  it("returns 25 when all children are indifferent with no_religion", () => {
    const profiles = [
      makeProfile({ childId: "c1", childPreference: "indifferent", faithBackground: "no_religion" }),
      makeProfile({ childId: "c2", childPreference: "declined", faithBackground: "christianity" }),
    ];
    const result = evaluateSupportProvision([], profiles);
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 when profiles with needs exist but no activities", () => {
    const profiles = [
      makeProfile({ childPreference: "actively_practising", faithBackground: "islam" }),
    ];
    const result = evaluateSupportProvision([], profiles);
    expect(result.overallScore).toBe(0);
    expect(result.totalActivities).toBe(0);
  });

  it("scores excellent/good rate correctly at 100%", () => {
    const profiles = [makeProfile({ childPreference: "interested", faithBackground: "christianity" })];
    const activities = [
      makeActivity({ id: "a1", quality: "excellent" }),
      makeActivity({ id: "a2", quality: "good" }),
    ];
    const result = evaluateSupportProvision(activities, profiles);
    expect(result.excellentGoodRate).toBe(100);
  });

  it("scores excellent/good rate correctly at mixed levels", () => {
    const profiles = [makeProfile({ childPreference: "interested", faithBackground: "christianity" })];
    const activities = [
      makeActivity({ id: "a1", quality: "excellent" }),
      makeActivity({ id: "a2", quality: "poor" }),
      makeActivity({ id: "a3", quality: "adequate" }),
    ];
    const result = evaluateSupportProvision(activities, profiles);
    expect(result.excellentGoodRate).toBe(33);
  });

  it("scores child-initiated rate correctly", () => {
    const profiles = [makeProfile({ childPreference: "interested", faithBackground: "christianity" })];
    const activities = [
      makeActivity({ id: "a1", childInitiated: true }),
      makeActivity({ id: "a2", childInitiated: true }),
      makeActivity({ id: "a3", childInitiated: false }),
    ];
    const result = evaluateSupportProvision(activities, profiles);
    expect(result.childInitiatedRate).toBe(67);
  });

  it("scores positive feedback correctly with null values", () => {
    const profiles = [makeProfile({ childPreference: "interested", faithBackground: "christianity" })];
    const activities = [
      makeActivity({ id: "a1", childFeedbackPositive: true }),
      makeActivity({ id: "a2", childFeedbackPositive: false }),
      makeActivity({ id: "a3", childFeedbackPositive: null }),
    ];
    const result = evaluateSupportProvision(activities, profiles);
    // 1 positive of 2 with feedback = 50%
    expect(result.positiveFeedbackRate).toBe(50);
  });

  it("handles all null feedback — positiveFeedbackRate is 0", () => {
    const profiles = [makeProfile({ childPreference: "interested", faithBackground: "christianity" })];
    const activities = [
      makeActivity({ id: "a1", childFeedbackPositive: null }),
      makeActivity({ id: "a2", childFeedbackPositive: null }),
    ];
    const result = evaluateSupportProvision(activities, profiles);
    expect(result.positiveFeedbackRate).toBe(0);
  });

  it("scores support type variety correctly", () => {
    const profiles = [makeProfile({ childPreference: "interested", faithBackground: "christianity" })];
    const activities = [
      makeActivity({ id: "a1", supportType: "worship_access" }),
      makeActivity({ id: "a2", supportType: "dietary_observance" }),
      makeActivity({ id: "a3", supportType: "festival_celebration" }),
      makeActivity({ id: "a4", supportType: "prayer_space" }),
      makeActivity({ id: "a5", supportType: "pastoral_support" }),
    ];
    const result = evaluateSupportProvision(activities, profiles);
    expect(result.supportTypeVariety).toBe(5);
  });

  it("scores regularity correctly — high coverage and average", () => {
    const profiles = [
      makeProfile({ childId: "c1", childPreference: "interested", faithBackground: "christianity" }),
      makeProfile({ childId: "c2", childPreference: "actively_practising", faithBackground: "islam" }),
    ];
    const activities = [
      makeActivity({ id: "a1", childId: "c1" }),
      makeActivity({ id: "a2", childId: "c1" }),
      makeActivity({ id: "a3", childId: "c2" }),
      makeActivity({ id: "a4", childId: "c2" }),
    ];
    const result = evaluateSupportProvision(activities, profiles);
    // 2 children covered of 2 = 100%, avg 2 per child
    expect(result.regularityScore).toBe(3);
  });

  it("scores regularity with partial coverage", () => {
    const profiles = [
      makeProfile({ childId: "c1", childPreference: "interested", faithBackground: "christianity" }),
      makeProfile({ childId: "c2", childPreference: "actively_practising", faithBackground: "islam" }),
      makeProfile({ childId: "c3", childPreference: "interested", faithBackground: "hinduism" }),
    ];
    const activities = [
      makeActivity({ id: "a1", childId: "c1" }),
      makeActivity({ id: "a2", childId: "c2" }),
    ];
    const result = evaluateSupportProvision(activities, profiles);
    // 2 of 3 children = 67%, avg 0.67 per child → coverage >= 60 but avg < 1 → 1
    expect(result.regularityScore).toBe(1);
  });

  it("returns high score for outstanding provision", () => {
    const profiles = [
      makeProfile({ childId: "c1", childPreference: "actively_practising", faithBackground: "islam" }),
    ];
    const activities = Array.from({ length: 5 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: "c1",
        quality: "excellent",
        childInitiated: true,
        childFeedbackPositive: true,
        supportType: ["worship_access", "dietary_observance", "festival_celebration", "prayer_space", "pastoral_support"][i] as SupportType,
      }),
    );
    const result = evaluateSupportProvision(activities, profiles);
    expect(result.overallScore).toBe(25);
  });
});

// ── evaluateFestivalInclusion ────────────────────────────────────────────────

describe("evaluateFestivalInclusion", () => {
  it("returns 25 when no festivals are due and no profiles exist", () => {
    const result = evaluateFestivalInclusion([], []);
    expect(result.overallScore).toBe(25);
    expect(result.totalFestivals).toBe(0);
  });

  it("returns 0 when profiles exist but no festivals recorded", () => {
    const profiles = [makeProfile()];
    const result = evaluateFestivalInclusion([], profiles);
    expect(result.overallScore).toBe(0);
  });

  it("scores observed rate correctly at 100%", () => {
    const profiles = [makeProfile()];
    const festivals = [
      makeFestival({ id: "f1", observed: true }),
      makeFestival({ id: "f2", observed: true }),
    ];
    const result = evaluateFestivalInclusion(festivals, profiles);
    expect(result.observedRate).toBe(100);
  });

  it("scores observed rate correctly at 50%", () => {
    const profiles = [makeProfile()];
    const festivals = [
      makeFestival({ id: "f1", observed: true }),
      makeFestival({ id: "f2", observed: false }),
    ];
    const result = evaluateFestivalInclusion(festivals, profiles);
    expect(result.observedRate).toBe(50);
  });

  it("scores child involved rate correctly", () => {
    const profiles = [makeProfile()];
    const festivals = [
      makeFestival({ id: "f1", childInvolved: true }),
      makeFestival({ id: "f2", childInvolved: false }),
      makeFestival({ id: "f3", childInvolved: true }),
    ];
    const result = evaluateFestivalInclusion(festivals, profiles);
    expect(result.childInvolvedRate).toBe(67);
  });

  it("scores culturally appropriate rate correctly", () => {
    const profiles = [makeProfile()];
    const festivals = [
      makeFestival({ id: "f1", culturallyAppropriate: true }),
      makeFestival({ id: "f2", culturallyAppropriate: false }),
    ];
    const result = evaluateFestivalInclusion(festivals, profiles);
    expect(result.culturallyAppropriateRate).toBe(50);
  });

  it("scores children coverage correctly", () => {
    const profiles = [
      makeProfile({ childId: "c1" }),
      makeProfile({ childId: "c2", id: "fp-2" }),
      makeProfile({ childId: "c3", id: "fp-3" }),
    ];
    const festivals = [
      makeFestival({ id: "f1", childId: "c1" }),
      makeFestival({ id: "f2", childId: "c2" }),
    ];
    const result = evaluateFestivalInclusion(festivals, profiles);
    // 2 of 3 = 67%
    expect(result.childrenCoveredRate).toBe(67);
  });

  it("returns full score for perfect festival observance", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const festivals = [
      makeFestival({ id: "f1", childId: "c1", observed: true, childInvolved: true, culturallyAppropriate: true }),
      makeFestival({ id: "f2", childId: "c1", observed: true, childInvolved: true, culturallyAppropriate: true }),
    ];
    const result = evaluateFestivalInclusion(festivals, profiles);
    // observed 8 + childInvolved 6 + culturallyAppropriate 6 + coverage 5 = 25
    expect(result.overallScore).toBe(25);
  });

  it("scores low when festivals are not observed", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const festivals = [
      makeFestival({ id: "f1", childId: "c1", observed: false, childInvolved: false, culturallyAppropriate: false }),
    ];
    const result = evaluateFestivalInclusion(festivals, profiles);
    expect(result.observedRate).toBe(0);
    // Coverage is 100% (1 of 1 child) → 5 points for coverage alone
    expect(result.overallScore).toBe(5);
  });

  it("caps score at 25", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const festivals = Array.from({ length: 10 }, (_, i) =>
      makeFestival({ id: `f-${i}`, childId: "c1" }),
    );
    const result = evaluateFestivalInclusion(festivals, profiles);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles festivals with partial observed (70%)", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const festivals = Array.from({ length: 10 }, (_, i) =>
      makeFestival({
        id: `f-${i}`,
        childId: "c1",
        observed: i < 7,
        childInvolved: i < 7,
        culturallyAppropriate: i < 7,
      }),
    );
    const result = evaluateFestivalInclusion(festivals, profiles);
    expect(result.observedRate).toBe(70);
  });
});

// ── evaluateStaffCompetence ──────────────────────────────────────────────────

describe("evaluateStaffCompetence", () => {
  it("returns zero score for empty staff", () => {
    const result = evaluateStaffCompetence([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.faithAwarenessRate).toBe(0);
    expect(result.culturalCompetenceRate).toBe(0);
    expect(result.antiDiscriminationRate).toBe(0);
    expect(result.childRightsRate).toBe(0);
    expect(result.overallCompetenceRate).toBe(0);
  });

  it("returns full score when all staff fully trained", () => {
    const staff = [
      makeStaff({ id: "s1", staffId: "st1" }),
      makeStaff({ id: "s2", staffId: "st2" }),
      makeStaff({ id: "s3", staffId: "st3" }),
    ];
    const result = evaluateStaffCompetence(staff);
    // faithAwareness 7 + cultural 6 + antiDisc 5 + childRights 4 + overall 3 = 25
    expect(result.overallScore).toBe(25);
    expect(result.faithAwarenessRate).toBe(100);
    expect(result.culturalCompetenceRate).toBe(100);
    expect(result.antiDiscriminationRate).toBe(100);
    expect(result.childRightsRate).toBe(100);
    expect(result.overallCompetenceRate).toBe(100);
  });

  it("scores faith awareness correctly at 50%", () => {
    const staff = [
      makeStaff({ id: "s1", staffId: "st1", faithAwareness: true }),
      makeStaff({ id: "s2", staffId: "st2", faithAwareness: false }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.faithAwarenessRate).toBe(50);
  });

  it("scores cultural competence correctly at 75%", () => {
    const staff = [
      makeStaff({ id: "s1", staffId: "st1", culturalCompetence: true }),
      makeStaff({ id: "s2", staffId: "st2", culturalCompetence: true }),
      makeStaff({ id: "s3", staffId: "st3", culturalCompetence: true }),
      makeStaff({ id: "s4", staffId: "st4", culturalCompetence: false }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.culturalCompetenceRate).toBe(75);
  });

  it("scores anti-discrimination correctly at 100%", () => {
    const staff = [
      makeStaff({ id: "s1", staffId: "st1", antiDiscrimination: true }),
      makeStaff({ id: "s2", staffId: "st2", antiDiscrimination: true }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.antiDiscriminationRate).toBe(100);
  });

  it("scores child rights correctly at 0%", () => {
    const staff = [
      makeStaff({ id: "s1", staffId: "st1", childRightsTraining: false }),
      makeStaff({ id: "s2", staffId: "st2", childRightsTraining: false }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.childRightsRate).toBe(0);
  });

  it("scores overall competence — staff with all four", () => {
    const staff = [
      makeStaff({ id: "s1", staffId: "st1" }),
      makeStaff({ id: "s2", staffId: "st2", childRightsTraining: false }),
    ];
    const result = evaluateStaffCompetence(staff);
    // 1 of 2 = 50%
    expect(result.overallCompetenceRate).toBe(50);
  });

  it("scores low when no staff have any training", () => {
    const staff = [
      makeStaff({
        id: "s1", staffId: "st1",
        faithAwareness: false,
        culturalCompetence: false,
        antiDiscrimination: false,
        childRightsTraining: false,
      }),
    ];
    const result = evaluateStaffCompetence(staff);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const staff = Array.from({ length: 20 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `st-${i}` }),
    );
    const result = evaluateStaffCompetence(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single staff member correctly", () => {
    const staff = [makeStaff()];
    const result = evaluateStaffCompetence(staff);
    expect(result.totalStaff).toBe(1);
    expect(result.overallScore).toBe(25);
  });

  it("correctly counts totalStaff", () => {
    const staff = Array.from({ length: 7 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `st-${i}` }),
    );
    const result = evaluateStaffCompetence(staff);
    expect(result.totalStaff).toBe(7);
  });
});

// ── buildChildFaithProfiles ──────────────────────────────────────────────────

describe("buildChildFaithProfiles", () => {
  it("returns empty array for no profiles", () => {
    const result = buildChildFaithProfiles([], [], []);
    expect(result).toEqual([]);
  });

  it("builds profile with correct child info", () => {
    const profiles = [makeProfile({ childId: "c1", childName: "Alex", faithBackground: "christianity", childPreference: "interested" })];
    const result = buildChildFaithProfiles(profiles, [], []);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("c1");
    expect(result[0].childName).toBe("Alex");
    expect(result[0].faithBackground).toBe("christianity");
    expect(result[0].childPreference).toBe("interested");
  });

  it("counts activities per child correctly", () => {
    const profiles = [
      makeProfile({ childId: "c1" }),
      makeProfile({ childId: "c2", id: "fp-2" }),
    ];
    const activities = [
      makeActivity({ id: "a1", childId: "c1" }),
      makeActivity({ id: "a2", childId: "c1" }),
      makeActivity({ id: "a3", childId: "c2" }),
    ];
    const result = buildChildFaithProfiles(profiles, activities, []);
    const c1Profile = result.find((p) => p.childId === "c1")!;
    const c2Profile = result.find((p) => p.childId === "c2")!;
    expect(c1Profile.activitiesCount).toBe(2);
    expect(c2Profile.activitiesCount).toBe(1);
  });

  it("counts festivals per child correctly", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const festivals = [
      makeFestival({ id: "f1", childId: "c1" }),
      makeFestival({ id: "f2", childId: "c1" }),
    ];
    const result = buildChildFaithProfiles(profiles, [], festivals);
    expect(result[0].festivalsCount).toBe(2);
  });

  it("scores needsAssessed and needsDocumented correctly", () => {
    const profiles = [
      makeProfile({ childId: "c1", needsAssessed: true, needsDocumented: true }),
    ];
    const result = buildChildFaithProfiles(profiles, [], []);
    expect(result[0].needsAssessed).toBe(true);
    // Score includes 1 for assessed + 1 for documented = 2 base
    expect(result[0].overallScore).toBeGreaterThanOrEqual(2);
  });

  it("includes support plan in score", () => {
    const profiles = [
      makeProfile({ childId: "c1", supportPlanInPlace: true }),
    ];
    const result = buildChildFaithProfiles(profiles, [], []);
    expect(result[0].supportPlanInPlace).toBe(true);
  });

  it("scores review current correctly", () => {
    const profileCurrent = [makeProfile({ childId: "c1", reviewDue: false })];
    const profileOverdue = [makeProfile({ childId: "c2", id: "fp-2", reviewDue: true })];

    const current = buildChildFaithProfiles(profileCurrent, [], []);
    const overdue = buildChildFaithProfiles(profileOverdue, [], []);

    // Current review adds 1 point
    expect(current[0].overallScore).toBeGreaterThan(overdue[0].overallScore);
  });

  it("scores activities — 3+ activities gives 2 points", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const activities = [
      makeActivity({ id: "a1", childId: "c1" }),
      makeActivity({ id: "a2", childId: "c1" }),
      makeActivity({ id: "a3", childId: "c1" }),
    ];
    const result = buildChildFaithProfiles(profiles, activities, []);
    // Should have more points than no activities
    const noAct = buildChildFaithProfiles(profiles, [], []);
    expect(result[0].overallScore).toBeGreaterThan(noAct[0].overallScore);
  });

  it("scores activity quality — 70%+ excellent/good gives 1 point", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const goodActivities = [
      makeActivity({ id: "a1", childId: "c1", quality: "excellent" }),
      makeActivity({ id: "a2", childId: "c1", quality: "good" }),
      makeActivity({ id: "a3", childId: "c1", quality: "good" }),
    ];
    const poorActivities = [
      makeActivity({ id: "a1", childId: "c1", quality: "poor" }),
      makeActivity({ id: "a2", childId: "c1", quality: "poor" }),
      makeActivity({ id: "a3", childId: "c1", quality: "poor" }),
    ];
    const good = buildChildFaithProfiles(profiles, goodActivities, []);
    const poor = buildChildFaithProfiles(profiles, poorActivities, []);
    expect(good[0].overallScore).toBeGreaterThan(poor[0].overallScore);
  });

  it("scores festival participation — 1+ festivals gives 1 point", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const festivals = [makeFestival({ id: "f1", childId: "c1" })];
    const withFest = buildChildFaithProfiles(profiles, [], festivals);
    const noFest = buildChildFaithProfiles(profiles, [], []);
    expect(withFest[0].overallScore).toBeGreaterThan(noFest[0].overallScore);
  });

  it("caps profile score at 10", () => {
    const profiles = [makeProfile({ childId: "c1" })];
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: "c1", quality: "excellent" }),
    );
    const festivals = Array.from({ length: 5 }, (_, i) =>
      makeFestival({ id: `f-${i}`, childId: "c1" }),
    );
    const result = buildChildFaithProfiles(profiles, activities, festivals);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("builds multiple child profiles correctly", () => {
    const profiles = [
      makeProfile({ id: "fp-1", childId: "c1", childName: "Alex" }),
      makeProfile({ id: "fp-2", childId: "c2", childName: "Jordan" }),
      makeProfile({ id: "fp-3", childId: "c3", childName: "Morgan" }),
    ];
    const result = buildChildFaithProfiles(profiles, [], []);
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.childName)).toEqual(["Alex", "Jordan", "Morgan"]);
  });
});

// ── generateReligiousSpiritualSupportIntelligence ────────────────────────────

describe("generateReligiousSpiritualSupportIntelligence", () => {
  it("returns complete intelligence structure", () => {
    const profiles = [makeProfile()];
    const activities = [makeActivity()];
    const festivals = [makeFestival()];
    const staff = [makeStaff()];

    const result = generateReligiousSpiritualSupportIntelligence(
      profiles, activities, festivals, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(typeof result.overallScore).toBe("number");
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.needsAssessment).toBeDefined();
    expect(result.supportProvision).toBeDefined();
    expect(result.festivalInclusion).toBeDefined();
    expect(result.staffCompetence).toBeDefined();
    expect(Array.isArray(result.childProfiles)).toBe(true);
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    expect(Array.isArray(result.actions)).toBe(true);
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
  });

  it("returns score between 0 and 100", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns correct number of regulatory links", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Reg 10 in regulatory links", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes NMS 4 in regulatory links", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 4"))).toBe(true);
  });

  it("includes Equality Act 2010 in regulatory links", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Equality Act 2010"))).toBe(true);
  });

  it("includes UNCRC Article 14 in regulatory links", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 14"))).toBe(true);
  });

  it("includes UNCRC Article 30 in regulatory links", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 30"))).toBe(true);
  });

  it("includes Human Rights Act 1998 Article 9 in regulatory links", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Human Rights Act 1998 Article 9"))).toBe(true);
  });

  it("generates strengths for high-performing home", () => {
    const profiles = Array.from({ length: 3 }, (_, i) =>
      makeProfile({ id: `fp-${i}`, childId: `c-${i}`, childName: `Child ${i}` }),
    );
    const activities = Array.from({ length: 6 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: `c-${i % 3}`,
        quality: "excellent",
        childInitiated: true,
        childFeedbackPositive: true,
        supportType: ["worship_access", "dietary_observance", "festival_celebration", "prayer_space", "pastoral_support", "religious_education"][i] as SupportType,
      }),
    );
    const festivals = Array.from({ length: 3 }, (_, i) =>
      makeFestival({ id: `f-${i}`, childId: `c-${i}` }),
    );
    const staff = Array.from({ length: 4 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `st-${i}` }),
    );

    const result = generateReligiousSpiritualSupportIntelligence(
      profiles, activities, festivals, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for poor-performing home", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        needsAssessed: false,
        needsDocumented: false,
        supportPlanInPlace: false,
        reviewDue: true,
        faithBackground: "not_recorded",
        childPreference: "interested",
      }),
    ];
    const result = generateReligiousSpiritualSupportIntelligence(
      profiles, [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions for homes needing intervention", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("caps overall score at 100", () => {
    const profiles = Array.from({ length: 3 }, (_, i) =>
      makeProfile({ id: `fp-${i}`, childId: `c-${i}` }),
    );
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: `c-${i % 3}`, quality: "excellent", childInitiated: true, childFeedbackPositive: true }),
    );
    const festivals = Array.from({ length: 6 }, (_, i) =>
      makeFestival({ id: `f-${i}`, childId: `c-${i % 3}` }),
    );
    const staff = Array.from({ length: 10 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `st-${i}` }),
    );

    const result = generateReligiousSpiritualSupportIntelligence(
      profiles, activities, festivals, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("sums evaluator scores correctly", () => {
    const profiles = [makeProfile()];
    const activities = [makeActivity()];
    const festivals = [makeFestival()];
    const staff = [makeStaff()];

    const result = generateReligiousSpiritualSupportIntelligence(
      profiles, activities, festivals, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );

    const expectedSum =
      result.needsAssessment.overallScore +
      result.supportProvision.overallScore +
      result.festivalInclusion.overallScore +
      result.staffCompetence.overallScore;

    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("rates outstanding for score >= 80", () => {
    const profiles = Array.from({ length: 3 }, (_, i) =>
      makeProfile({ id: `fp-${i}`, childId: `c-${i}` }),
    );
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        id: `a-${i}`,
        childId: `c-${i % 3}`,
        quality: "excellent",
        childInitiated: true,
        childFeedbackPositive: true,
        supportType: ["worship_access", "dietary_observance", "festival_celebration", "prayer_space", "pastoral_support"][i % 5] as SupportType,
      }),
    );
    const festivals = Array.from({ length: 3 }, (_, i) =>
      makeFestival({ id: `f-${i}`, childId: `c-${i}` }),
    );
    const staff = Array.from({ length: 4 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `st-${i}` }),
    );

    const result = generateReligiousSpiritualSupportIntelligence(
      profiles, activities, festivals, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("returns child profiles matching input profiles", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Alex" }),
      makeProfile({ childId: "c2", childName: "Jordan", id: "fp-2" }),
    ];
    const result = generateReligiousSpiritualSupportIntelligence(
      profiles, [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles).toHaveLength(2);
    expect(result.childProfiles[0].childName).toBe("Alex");
    expect(result.childProfiles[1].childName).toBe("Jordan");
  });

  // Chamberlain House demo test
  it("produces correct results for Chamberlain House demo data", () => {
    const profiles: ChildFaithProfile[] = [
      {
        id: "fp-alex-01", childId: "child-alex", childName: "Alex",
        faithBackground: "christianity", childPreference: "interested",
        needsAssessed: true, needsDocumented: true, supportPlanInPlace: true,
        lastReviewDate: "2026-04-15", reviewDue: false,
      },
      {
        id: "fp-jordan-01", childId: "child-jordan", childName: "Jordan",
        faithBackground: "islam", childPreference: "actively_practising",
        needsAssessed: true, needsDocumented: true, supportPlanInPlace: true,
        lastReviewDate: "2026-04-20", reviewDue: false,
      },
      {
        id: "fp-morgan-01", childId: "child-morgan", childName: "Morgan",
        faithBackground: "no_religion", childPreference: "indifferent",
        needsAssessed: true, needsDocumented: true, supportPlanInPlace: false,
        lastReviewDate: "2026-03-01", reviewDue: false,
      },
    ];

    const activities: ReligiousSupportActivity[] = [
      { id: "rsa-alex-01", childId: "child-alex", childName: "Alex", date: "2026-03-10", supportType: "worship_access", quality: "good", childInitiated: true, childFeedbackPositive: true, facilitatedBy: "Sarah Johnson" },
      { id: "rsa-jordan-01", childId: "child-jordan", childName: "Jordan", date: "2026-03-14", supportType: "worship_access", quality: "excellent", childInitiated: true, childFeedbackPositive: true, facilitatedBy: "Darren Laville" },
      { id: "rsa-jordan-02", childId: "child-jordan", childName: "Jordan", date: "2026-03-15", supportType: "dietary_observance", quality: "excellent", childInitiated: false, childFeedbackPositive: true, facilitatedBy: "Lisa Williams" },
      { id: "rsa-jordan-03", childId: "child-jordan", childName: "Jordan", date: "2026-04-01", supportType: "faith_leader_contact", quality: "good", childInitiated: true, childFeedbackPositive: true, facilitatedBy: "Tom Richards" },
      { id: "rsa-alex-02", childId: "child-alex", childName: "Alex", date: "2026-04-05", supportType: "pastoral_support", quality: "good", childInitiated: false, childFeedbackPositive: null, facilitatedBy: "Sarah Johnson" },
    ];

    const festivals: FestivalObservance[] = [
      { id: "fo-jordan-01", childId: "child-jordan", childName: "Jordan", festivalName: "Eid al-Fitr", date: "2026-03-31", observed: true, childInvolved: true, culturallyAppropriate: true },
      { id: "fo-alex-01", childId: "child-alex", childName: "Alex", festivalName: "Easter", date: "2026-04-05", observed: true, childInvolved: true, culturallyAppropriate: true },
    ];

    const staff: StaffDiversityTraining[] = [
      { id: "sdt-sarah-01", staffId: "staff-sarah", staffName: "Sarah Johnson", faithAwareness: true, culturalCompetence: true, antiDiscrimination: true, childRightsTraining: true },
      { id: "sdt-tom-01", staffId: "staff-tom", staffName: "Tom Richards", faithAwareness: true, culturalCompetence: true, antiDiscrimination: true, childRightsTraining: false },
      { id: "sdt-lisa-01", staffId: "staff-lisa", staffName: "Lisa Williams", faithAwareness: true, culturalCompetence: true, antiDiscrimination: true, childRightsTraining: true },
      { id: "sdt-darren-01", staffId: "staff-darren", staffName: "Darren Laville", faithAwareness: true, culturalCompetence: true, antiDiscrimination: true, childRightsTraining: true },
    ];

    const result = generateReligiousSpiritualSupportIntelligence(
      profiles, activities, festivals, staff,
      "oak-house", PERIOD_START, PERIOD_END,
    );

    // Verify structure
    expect(result.homeId).toBe("oak-house");
    expect(result.childProfiles).toHaveLength(3);

    // Verify needs assessment — all 3 assessed, documented, 2/3 plans, all current, all recorded (2 not_recorded excluded)
    expect(result.needsAssessment.needsAssessedRate).toBe(100);
    expect(result.needsAssessment.needsDocumentedRate).toBe(100);
    expect(result.needsAssessment.supportPlanRate).toBe(67); // 2 of 3
    expect(result.needsAssessment.reviewCurrentRate).toBe(100);

    // Verify support provision — 5 activities, all good+, 3/5 initiated
    expect(result.supportProvision.totalActivities).toBe(5);
    expect(result.supportProvision.excellentGoodRate).toBe(100); // all good or excellent

    // Verify festivals — 2 festivals, all observed/involved/appropriate, 2 of 3 children
    expect(result.festivalInclusion.totalFestivals).toBe(2);
    expect(result.festivalInclusion.observedRate).toBe(100);
    expect(result.festivalInclusion.childInvolvedRate).toBe(100);
    expect(result.festivalInclusion.childrenCoveredRate).toBe(67); // 2 of 3

    // Verify staff — 4 staff, all faith aware, 3/4 all-four
    expect(result.staffCompetence.totalStaff).toBe(4);
    expect(result.staffCompetence.faithAwarenessRate).toBe(100);
    expect(result.staffCompetence.childRightsRate).toBe(75); // 3 of 4

    // Overall should be good or outstanding
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.regulatoryLinks).toHaveLength(7);
  });
});

// ── Edge Cases ───────────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("handles all empty inputs gracefully", () => {
    const result = generateReligiousSpiritualSupportIntelligence(
      [], [], [], [],
      "empty-home", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.rating).toBeDefined();
    expect(result.childProfiles).toHaveLength(0);
  });

  it("pct returns 0 for zero denominator", () => {
    // This is tested indirectly through empty evaluators
    const result = evaluateNeedsAssessment([]);
    expect(result.needsAssessedRate).toBe(0);
  });

  it("handles profiles with no_religion and declined preference correctly", () => {
    const profiles = [
      makeProfile({ childId: "c1", faithBackground: "no_religion", childPreference: "declined" }),
    ];
    // Support provision should return 25 — no children need support
    const provResult = evaluateSupportProvision([], profiles);
    expect(provResult.overallScore).toBe(25);
  });

  it("handles profiles with not_recorded faith background", () => {
    const profiles = [
      makeProfile({ childId: "c1", faithBackground: "not_recorded", childPreference: "declined" }),
    ];
    // not_recorded + declined = no needs → 25
    const provResult = evaluateSupportProvision([], profiles);
    expect(provResult.overallScore).toBe(25);
  });

  it("handles mixed preferences — some needing support, some not", () => {
    const profiles = [
      makeProfile({ childId: "c1", childPreference: "actively_practising", faithBackground: "islam" }),
      makeProfile({ childId: "c2", childPreference: "indifferent", faithBackground: "no_religion", id: "fp-2" }),
    ];
    // Only c1 needs support — provision should consider that
    const activities = [makeActivity({ childId: "c1" })];
    const result = evaluateSupportProvision(activities, profiles);
    expect(result.totalActivities).toBe(1);
  });

  it("handles very large datasets without error", () => {
    const profiles = Array.from({ length: 100 }, (_, i) =>
      makeProfile({ id: `fp-${i}`, childId: `c-${i}`, childName: `Child ${i}` }),
    );
    const activities = Array.from({ length: 500 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: `c-${i % 100}` }),
    );
    const festivals = Array.from({ length: 200 }, (_, i) =>
      makeFestival({ id: `f-${i}`, childId: `c-${i % 100}` }),
    );
    const staff = Array.from({ length: 50 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `st-${i}` }),
    );

    const result = generateReligiousSpiritualSupportIntelligence(
      profiles, activities, festivals, staff,
      "large-home", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.childProfiles).toHaveLength(100);
  });

  it("evaluator scores never exceed 25", () => {
    const profiles = Array.from({ length: 5 }, (_, i) =>
      makeProfile({ id: `fp-${i}`, childId: `c-${i}` }),
    );
    const activities = Array.from({ length: 20 }, (_, i) =>
      makeActivity({ id: `a-${i}`, childId: `c-${i % 5}` }),
    );
    const festivals = Array.from({ length: 10 }, (_, i) =>
      makeFestival({ id: `f-${i}`, childId: `c-${i % 5}` }),
    );
    const staff = Array.from({ length: 10 }, (_, i) =>
      makeStaff({ id: `s-${i}`, staffId: `st-${i}` }),
    );

    const needsResult = evaluateNeedsAssessment(profiles);
    const provResult = evaluateSupportProvision(activities, profiles);
    const festResult = evaluateFestivalInclusion(festivals, profiles);
    const staffResult = evaluateStaffCompetence(staff);

    expect(needsResult.overallScore).toBeLessThanOrEqual(25);
    expect(provResult.overallScore).toBeLessThanOrEqual(25);
    expect(festResult.overallScore).toBeLessThanOrEqual(25);
    expect(staffResult.overallScore).toBeLessThanOrEqual(25);
  });

  it("child profile scores never go below 0", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        needsAssessed: false,
        needsDocumented: false,
        supportPlanInPlace: false,
        reviewDue: true,
      }),
    ];
    const result = buildChildFaithProfiles(profiles, [], []);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});
