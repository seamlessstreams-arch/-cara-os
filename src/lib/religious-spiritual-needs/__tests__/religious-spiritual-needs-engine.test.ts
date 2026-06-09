// ==============================================================================
// Cornerstone Religious & Spiritual Needs Intelligence — Engine Tests
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateAssessmentQuality,
  evaluateSupportDelivery,
  evaluateReligiousPolicy,
  evaluateStaffReligiousReadiness,
  buildChildReligiousProfiles,
  generateReligiousSpiritualNeedsIntelligence,
  getRating,
  getFaithBackgroundLabel,
  getSupportTypeLabel,
  getFrequencyLabel,
  getRatingLabel,
} from "../religious-spiritual-needs-engine";
import type {
  ReligiousSpiritualAssessment,
  ReligiousSupportRecord,
  ReligiousPolicy,
  StaffReligiousTraining,
  FaithBackground,
  SupportType,
  Frequency,
  Rating,
} from "../religious-spiritual-needs-engine";

// -- Constants ----------------------------------------------------------------

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-19";

// -- Factories ----------------------------------------------------------------

function makeAssessment(
  overrides: Partial<ReligiousSpiritualAssessment> = {},
): ReligiousSpiritualAssessment {
  return {
    id: "rsa-001",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-02-01",
    assessedBy: "Sarah Thompson",
    faithBackground: "christian",
    needsIdentified: true,
    preferencesRecorded: true,
    childViewsSought: true,
    parentCarerConsulted: true,
    careplanUpdated: true,
    ...overrides,
  };
}

function makeRecord(
  overrides: Partial<ReligiousSupportRecord> = {},
): ReligiousSupportRecord {
  return {
    id: "rsr-001",
    childId: "child-alex",
    childName: "Alex",
    supportDate: "2026-02-10",
    supportType: "worship_access",
    facilitated: true,
    childSatisfied: true,
    frequency: "weekly",
    culturallyAppropriate: true,
    ...overrides,
  };
}

function makePolicy(
  overrides: Partial<ReligiousPolicy> = {},
): ReligiousPolicy {
  return {
    id: "rp-001",
    faithNeedsAssessedOnAdmission: true,
    worshipAccessProvided: true,
    dietaryObservanceMet: true,
    festivalRecognition: true,
    faithLeaderAccess: true,
    prayerSpaceAvailable: true,
    antiDiscriminationTraining: true,
    ...overrides,
  };
}

function makeTraining(
  overrides: Partial<StaffReligiousTraining> = {},
): StaffReligiousTraining {
  return {
    id: "srt-001",
    staffId: "staff-sarah",
    staffName: "Sarah Thompson",
    faithAwareness: true,
    culturalCompetence: true,
    dietaryRequirements: true,
    festivalKnowledge: true,
    antiDiscrimination: true,
    childViewsAdvocacy: true,
    ...overrides,
  };
}

// -- Chamberlain House Demo Data ------------------------------------------------------

const DEMO_ASSESSMENTS: ReligiousSpiritualAssessment[] = [
  // Alex — Christian (Church of England)
  makeAssessment({
    id: "rsa-alex-01", childId: "child-alex", childName: "Alex",
    faithBackground: "christian", assessedBy: "Sarah Thompson",
    needsIdentified: true, preferencesRecorded: true, childViewsSought: true,
    parentCarerConsulted: true, careplanUpdated: true,
  }),

  // Jordan — Muslim
  makeAssessment({
    id: "rsa-jordan-01", childId: "child-jordan", childName: "Jordan",
    faithBackground: "muslim", assessedBy: "Lisa Chen",
    needsIdentified: true, preferencesRecorded: true, childViewsSought: true,
    parentCarerConsulted: true, careplanUpdated: true,
  }),

  // Morgan — Buddhist
  makeAssessment({
    id: "rsa-morgan-01", childId: "child-morgan", childName: "Morgan",
    faithBackground: "buddhist", assessedBy: "Lisa Chen",
    needsIdentified: true, preferencesRecorded: true, childViewsSought: true,
    parentCarerConsulted: true, careplanUpdated: false,
  }),

  // Sam — No faith
  makeAssessment({
    id: "rsa-sam-01", childId: "child-sam", childName: "Sam",
    faithBackground: "no_faith", assessedBy: "Sarah Thompson",
    needsIdentified: true, preferencesRecorded: true, childViewsSought: true,
    parentCarerConsulted: false, careplanUpdated: true,
  }),
];

const DEMO_RECORDS: ReligiousSupportRecord[] = [
  // Alex — Sunday church service
  makeRecord({
    id: "rsr-alex-01", childId: "child-alex", childName: "Alex",
    supportType: "worship_access", facilitated: true, childSatisfied: true,
    frequency: "weekly", culturallyAppropriate: true,
  }),
  makeRecord({
    id: "rsr-alex-02", childId: "child-alex", childName: "Alex",
    supportType: "festival_celebration", facilitated: true, childSatisfied: true,
    frequency: "occasionally", culturallyAppropriate: true,
  }),

  // Jordan — Friday prayers, halal diet, Ramadan
  makeRecord({
    id: "rsr-jordan-01", childId: "child-jordan", childName: "Jordan",
    supportType: "worship_access", facilitated: true, childSatisfied: true,
    frequency: "weekly", culturallyAppropriate: true,
  }),
  makeRecord({
    id: "rsr-jordan-02", childId: "child-jordan", childName: "Jordan",
    supportType: "dietary_observance", facilitated: true, childSatisfied: true,
    frequency: "daily", culturallyAppropriate: true,
  }),
  makeRecord({
    id: "rsr-jordan-03", childId: "child-jordan", childName: "Jordan",
    supportType: "festival_celebration", facilitated: true, childSatisfied: true,
    frequency: "monthly", culturallyAppropriate: true,
  }),
  makeRecord({
    id: "rsr-jordan-04", childId: "child-jordan", childName: "Jordan",
    supportType: "prayer_space", facilitated: true, childSatisfied: true,
    frequency: "daily", culturallyAppropriate: true,
  }),
  makeRecord({
    id: "rsr-jordan-05", childId: "child-jordan", childName: "Jordan",
    supportType: "faith_leader_contact", facilitated: true, childSatisfied: true,
    frequency: "monthly", culturallyAppropriate: true,
  }),

  // Morgan — meditation, Vesak
  makeRecord({
    id: "rsr-morgan-01", childId: "child-morgan", childName: "Morgan",
    supportType: "worship_access", facilitated: true, childSatisfied: true,
    frequency: "weekly", culturallyAppropriate: true,
  }),
  makeRecord({
    id: "rsr-morgan-02", childId: "child-morgan", childName: "Morgan",
    supportType: "festival_celebration", facilitated: true, childSatisfied: false,
    frequency: "occasionally", culturallyAppropriate: true,
  }),
];

const DEMO_POLICIES: ReligiousPolicy[] = [
  makePolicy({
    id: "rp-oak-01",
    faithNeedsAssessedOnAdmission: true,
    worshipAccessProvided: true,
    dietaryObservanceMet: true,
    festivalRecognition: true,
    faithLeaderAccess: true,
    prayerSpaceAvailable: true,
    antiDiscriminationTraining: true,
  }),
];

const DEMO_TRAINING: StaffReligiousTraining[] = [
  makeTraining({
    id: "srt-sarah-01", staffId: "staff-sarah", staffName: "Sarah Thompson",
    faithAwareness: true, culturalCompetence: true, dietaryRequirements: true,
    festivalKnowledge: true, antiDiscrimination: true, childViewsAdvocacy: true,
  }),
  makeTraining({
    id: "srt-tom-01", staffId: "staff-tom", staffName: "Tom Williams",
    faithAwareness: true, culturalCompetence: true, dietaryRequirements: false,
    festivalKnowledge: false, antiDiscrimination: true, childViewsAdvocacy: false,
  }),
  makeTraining({
    id: "srt-lisa-01", staffId: "staff-lisa", staffName: "Lisa Chen",
    faithAwareness: true, culturalCompetence: true, dietaryRequirements: true,
    festivalKnowledge: true, antiDiscrimination: true, childViewsAdvocacy: true,
  }),
];

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
  describe("getFaithBackgroundLabel", () => {
    it("returns correct label for each faith background", () => {
      const expected: Record<FaithBackground, string> = {
        christian: "Christian",
        muslim: "Muslim",
        hindu: "Hindu",
        sikh: "Sikh",
        jewish: "Jewish",
        buddhist: "Buddhist",
        no_faith: "No Faith",
        spiritual_not_religious: "Spiritual but Not Religious",
        other: "Other",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getFaithBackgroundLabel(key as FaithBackground)).toBe(label);
      }
    });
  });

  describe("getSupportTypeLabel", () => {
    it("returns correct label for each support type", () => {
      const expected: Record<SupportType, string> = {
        worship_access: "Worship Access",
        dietary_observance: "Dietary Observance",
        festival_celebration: "Festival Celebration",
        prayer_space: "Prayer Space",
        faith_leader_contact: "Faith Leader Contact",
        religious_education: "Religious Education",
        faith_community: "Faith Community",
        other: "Other",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getSupportTypeLabel(key as SupportType)).toBe(label);
      }
    });
  });

  describe("getFrequencyLabel", () => {
    it("returns correct label for each frequency", () => {
      const expected: Record<Frequency, string> = {
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        occasionally: "Occasionally",
        not_provided: "Not Provided",
      };
      for (const [key, label] of Object.entries(expected)) {
        expect(getFrequencyLabel(key as Frequency)).toBe(label);
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
// evaluateAssessmentQuality
// =============================================================================

describe("evaluateAssessmentQuality", () => {
  it("returns zero scores for empty assessments", () => {
    const result = evaluateAssessmentQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.needsIdentifiedRate).toBe(0);
    expect(result.preferencesRecordedRate).toBe(0);
    expect(result.childViewsRate).toBe(0);
    expect(result.parentConsultedRate).toBe(0);
    expect(result.careplanUpdatedRate).toBe(0);
  });

  it("scores maximum for perfect inputs", () => {
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        needsIdentified: true,
        preferencesRecorded: true,
        childViewsSought: true,
        parentCarerConsulted: true,
        careplanUpdated: true,
      }),
    );
    const result = evaluateAssessmentQuality(assessments);
    expect(result.overallScore).toBe(25);
    expect(result.needsIdentifiedRate).toBe(100);
    expect(result.preferencesRecordedRate).toBe(100);
    expect(result.childViewsRate).toBe(100);
    expect(result.parentConsultedRate).toBe(100);
    expect(result.careplanUpdatedRate).toBe(100);
  });

  it("calculates needs identified rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", needsIdentified: true }),
      makeAssessment({ id: "a2", needsIdentified: false }),
      makeAssessment({ id: "a3", needsIdentified: true }),
    ];
    const result = evaluateAssessmentQuality(assessments);
    expect(result.needsIdentifiedRate).toBe(67);
  });

  it("awards 6 points for needs identified >= 90%", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        needsIdentified: i < 9 ? true : false,
        preferencesRecorded: false,
        childViewsSought: false,
        parentCarerConsulted: false,
        careplanUpdated: false,
      }),
    );
    const result = evaluateAssessmentQuality(assessments);
    expect(result.needsIdentifiedRate).toBe(90);
    expect(result.overallScore).toBe(6);
  });

  it("awards 4 points for needs identified >= 70% but < 90%", () => {
    const assessments = [
      makeAssessment({ id: "a1", needsIdentified: true, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
      makeAssessment({ id: "a2", needsIdentified: true, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
      makeAssessment({ id: "a3", needsIdentified: false, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
    ];
    const result = evaluateAssessmentQuality(assessments);
    expect(result.needsIdentifiedRate).toBe(67);
    // 67 < 70 => 2 points (>= 50%)
    expect(result.overallScore).toBe(2);
  });

  it("awards 2 points for needs identified >= 50% but < 70%", () => {
    const assessments = [
      makeAssessment({ id: "a1", needsIdentified: true, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
      makeAssessment({ id: "a2", needsIdentified: false, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
    ];
    const result = evaluateAssessmentQuality(assessments);
    expect(result.needsIdentifiedRate).toBe(50);
    expect(result.overallScore).toBe(2);
  });

  it("awards 0 points for needs identified < 50%", () => {
    const assessments = [
      makeAssessment({ id: "a1", needsIdentified: false, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
      makeAssessment({ id: "a2", needsIdentified: false, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
      makeAssessment({ id: "a3", needsIdentified: true, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
    ];
    const result = evaluateAssessmentQuality(assessments);
    expect(result.needsIdentifiedRate).toBe(33);
    expect(result.overallScore).toBe(0);
  });

  it("calculates preferences recorded rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", preferencesRecorded: true }),
      makeAssessment({ id: "a2", preferencesRecorded: true }),
      makeAssessment({ id: "a3", preferencesRecorded: false }),
      makeAssessment({ id: "a4", preferencesRecorded: false }),
    ];
    const result = evaluateAssessmentQuality(assessments);
    expect(result.preferencesRecordedRate).toBe(50);
  });

  it("calculates child views rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", childViewsSought: true }),
      makeAssessment({ id: "a2", childViewsSought: false }),
      makeAssessment({ id: "a3", childViewsSought: true }),
    ];
    const result = evaluateAssessmentQuality(assessments);
    expect(result.childViewsRate).toBe(67);
  });

  it("calculates parent consulted rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", parentCarerConsulted: true }),
      makeAssessment({ id: "a2", parentCarerConsulted: true }),
      makeAssessment({ id: "a3", parentCarerConsulted: false }),
    ];
    const result = evaluateAssessmentQuality(assessments);
    expect(result.parentConsultedRate).toBe(67);
  });

  it("calculates care plan updated rate correctly", () => {
    const assessments = [
      makeAssessment({ id: "a1", careplanUpdated: true }),
      makeAssessment({ id: "a2", careplanUpdated: false }),
      makeAssessment({ id: "a3", careplanUpdated: true }),
      makeAssessment({ id: "a4", careplanUpdated: true }),
    ];
    const result = evaluateAssessmentQuality(assessments);
    expect(result.careplanUpdatedRate).toBe(75);
  });

  it("caps score at 25", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        needsIdentified: true,
        preferencesRecorded: true,
        childViewsSought: true,
        parentCarerConsulted: true,
        careplanUpdated: true,
      }),
    );
    const result = evaluateAssessmentQuality(assessments);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single assessment correctly", () => {
    const result = evaluateAssessmentQuality([makeAssessment()]);
    expect(result.totalAssessments).toBe(1);
    expect(result.needsIdentifiedRate).toBe(100);
  });

  it("scores demo data appropriately", () => {
    const result = evaluateAssessmentQuality(DEMO_ASSESSMENTS);
    expect(result.totalAssessments).toBe(4);
    expect(result.needsIdentifiedRate).toBe(100);
    expect(result.childViewsRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives zero for all false across every field", () => {
    const assessments = [
      makeAssessment({ id: "a1", needsIdentified: false, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
      makeAssessment({ id: "a2", needsIdentified: false, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
    ];
    const result = evaluateAssessmentQuality(assessments);
    expect(result.overallScore).toBe(0);
  });
});

// =============================================================================
// evaluateSupportDelivery
// =============================================================================

describe("evaluateSupportDelivery", () => {
  it("returns zero scores for empty records", () => {
    const result = evaluateSupportDelivery([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.facilitatedRate).toBe(0);
    expect(result.childSatisfiedRate).toBe(0);
    expect(result.culturallyAppropriateRate).toBe(0);
    expect(result.regularFrequencyRate).toBe(0);
  });

  it("scores maximum for perfect inputs", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        facilitated: true,
        childSatisfied: true,
        culturallyAppropriate: true,
        frequency: "weekly",
      }),
    );
    const result = evaluateSupportDelivery(records);
    expect(result.overallScore).toBe(25);
    expect(result.facilitatedRate).toBe(100);
    expect(result.childSatisfiedRate).toBe(100);
    expect(result.culturallyAppropriateRate).toBe(100);
    expect(result.regularFrequencyRate).toBe(100);
  });

  it("calculates facilitated rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", facilitated: true }),
      makeRecord({ id: "r2", facilitated: false }),
      makeRecord({ id: "r3", facilitated: true }),
    ];
    const result = evaluateSupportDelivery(records);
    expect(result.facilitatedRate).toBe(67);
  });

  it("awards 7 points for facilitated >= 90%", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        facilitated: i < 9 ? true : false,
        childSatisfied: false,
        culturallyAppropriate: false,
        frequency: "not_provided",
      }),
    );
    const result = evaluateSupportDelivery(records);
    expect(result.facilitatedRate).toBe(90);
    expect(result.overallScore).toBe(7);
  });

  it("awards 5 points for facilitated >= 70% but < 90%", () => {
    const records = [
      makeRecord({ id: "r1", facilitated: true, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
      makeRecord({ id: "r2", facilitated: true, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
      makeRecord({ id: "r3", facilitated: false, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
    ];
    const result = evaluateSupportDelivery(records);
    expect(result.facilitatedRate).toBe(67);
    // 67 < 70 => 3 points (>= 50%)
    expect(result.overallScore).toBe(3);
  });

  it("awards 3 points for facilitated >= 50% but < 70%", () => {
    const records = [
      makeRecord({ id: "r1", facilitated: true, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
      makeRecord({ id: "r2", facilitated: false, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
    ];
    const result = evaluateSupportDelivery(records);
    expect(result.facilitatedRate).toBe(50);
    expect(result.overallScore).toBe(3);
  });

  it("awards 1 point for facilitated >= 30% but < 50%", () => {
    const records = [
      makeRecord({ id: "r1", facilitated: true, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
      makeRecord({ id: "r2", facilitated: false, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
      makeRecord({ id: "r3", facilitated: false, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
    ];
    const result = evaluateSupportDelivery(records);
    expect(result.facilitatedRate).toBe(33);
    expect(result.overallScore).toBe(1);
  });

  it("calculates child satisfied rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", childSatisfied: true }),
      makeRecord({ id: "r2", childSatisfied: false }),
      makeRecord({ id: "r3", childSatisfied: true }),
      makeRecord({ id: "r4", childSatisfied: true }),
    ];
    const result = evaluateSupportDelivery(records);
    expect(result.childSatisfiedRate).toBe(75);
  });

  it("calculates culturally appropriate rate correctly", () => {
    const records = [
      makeRecord({ id: "r1", culturallyAppropriate: true }),
      makeRecord({ id: "r2", culturallyAppropriate: true }),
      makeRecord({ id: "r3", culturallyAppropriate: false }),
    ];
    const result = evaluateSupportDelivery(records);
    expect(result.culturallyAppropriateRate).toBe(67);
  });

  it("calculates regular frequency rate correctly (daily, weekly, monthly)", () => {
    const records = [
      makeRecord({ id: "r1", frequency: "daily" }),
      makeRecord({ id: "r2", frequency: "weekly" }),
      makeRecord({ id: "r3", frequency: "monthly" }),
      makeRecord({ id: "r4", frequency: "occasionally" }),
      makeRecord({ id: "r5", frequency: "not_provided" }),
    ];
    const result = evaluateSupportDelivery(records);
    expect(result.regularFrequencyRate).toBe(60);
  });

  it("caps score at 25", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        facilitated: true,
        childSatisfied: true,
        culturallyAppropriate: true,
        frequency: "weekly",
      }),
    );
    const result = evaluateSupportDelivery(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single record correctly", () => {
    const result = evaluateSupportDelivery([makeRecord()]);
    expect(result.totalRecords).toBe(1);
    expect(result.facilitatedRate).toBe(100);
  });

  it("scores demo data appropriately", () => {
    const result = evaluateSupportDelivery(DEMO_RECORDS);
    expect(result.totalRecords).toBe(9);
    expect(result.facilitatedRate).toBe(100);
    expect(result.childSatisfiedRate).toBeGreaterThan(70);
    expect(result.culturallyAppropriateRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("gives zero for all false with not_provided frequency", () => {
    const records = [
      makeRecord({ id: "r1", facilitated: false, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
      makeRecord({ id: "r2", facilitated: false, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
    ];
    const result = evaluateSupportDelivery(records);
    expect(result.overallScore).toBe(0);
  });
});

// =============================================================================
// evaluateReligiousPolicy
// =============================================================================

describe("evaluateReligiousPolicy", () => {
  it("returns zero scores for empty policies", () => {
    const result = evaluateReligiousPolicy([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPolicies).toBe(0);
    expect(result.faithAssessedOnAdmissionRate).toBe(0);
    expect(result.worshipAccessRate).toBe(0);
    expect(result.dietaryObservanceRate).toBe(0);
    expect(result.festivalRecognitionRate).toBe(0);
    expect(result.faithLeaderAccessRate).toBe(0);
    expect(result.prayerSpaceRate).toBe(0);
    expect(result.antiDiscriminationRate).toBe(0);
  });

  it("scores maximum for perfect policies", () => {
    const policies = Array.from({ length: 3 }, (_, i) =>
      makePolicy({ id: `p${i}` }),
    );
    const result = evaluateReligiousPolicy(policies);
    expect(result.overallScore).toBe(25);
    expect(result.faithAssessedOnAdmissionRate).toBe(100);
    expect(result.worshipAccessRate).toBe(100);
    expect(result.dietaryObservanceRate).toBe(100);
    expect(result.festivalRecognitionRate).toBe(100);
    expect(result.faithLeaderAccessRate).toBe(100);
    expect(result.prayerSpaceRate).toBe(100);
    expect(result.antiDiscriminationRate).toBe(100);
  });

  it("calculates faith assessed on admission rate correctly", () => {
    const policies = [
      makePolicy({ id: "p1", faithNeedsAssessedOnAdmission: true }),
      makePolicy({ id: "p2", faithNeedsAssessedOnAdmission: false }),
      makePolicy({ id: "p3", faithNeedsAssessedOnAdmission: true }),
    ];
    const result = evaluateReligiousPolicy(policies);
    expect(result.faithAssessedOnAdmissionRate).toBe(67);
  });

  it("awards 4 points for faith assessed on admission >= 90%", () => {
    const policies = Array.from({ length: 10 }, (_, i) =>
      makePolicy({
        id: `p${i}`,
        faithNeedsAssessedOnAdmission: i < 9 ? true : false,
        worshipAccessProvided: false,
        dietaryObservanceMet: false,
        festivalRecognition: false,
        faithLeaderAccess: false,
        prayerSpaceAvailable: false,
        antiDiscriminationTraining: false,
      }),
    );
    const result = evaluateReligiousPolicy(policies);
    expect(result.faithAssessedOnAdmissionRate).toBe(90);
    expect(result.overallScore).toBe(4);
  });

  it("awards 2 points for faith assessed on admission >= 60% but < 90%", () => {
    const policies = [
      makePolicy({ id: "p1", faithNeedsAssessedOnAdmission: true, worshipAccessProvided: false, dietaryObservanceMet: false, festivalRecognition: false, faithLeaderAccess: false, prayerSpaceAvailable: false, antiDiscriminationTraining: false }),
      makePolicy({ id: "p2", faithNeedsAssessedOnAdmission: true, worshipAccessProvided: false, dietaryObservanceMet: false, festivalRecognition: false, faithLeaderAccess: false, prayerSpaceAvailable: false, antiDiscriminationTraining: false }),
      makePolicy({ id: "p3", faithNeedsAssessedOnAdmission: false, worshipAccessProvided: false, dietaryObservanceMet: false, festivalRecognition: false, faithLeaderAccess: false, prayerSpaceAvailable: false, antiDiscriminationTraining: false }),
    ];
    const result = evaluateReligiousPolicy(policies);
    expect(result.faithAssessedOnAdmissionRate).toBe(67);
    expect(result.overallScore).toBe(2);
  });

  it("calculates worship access rate correctly", () => {
    const policies = [
      makePolicy({ id: "p1", worshipAccessProvided: true }),
      makePolicy({ id: "p2", worshipAccessProvided: true }),
      makePolicy({ id: "p3", worshipAccessProvided: false }),
    ];
    const result = evaluateReligiousPolicy(policies);
    expect(result.worshipAccessRate).toBe(67);
  });

  it("calculates dietary observance rate correctly", () => {
    const policies = [
      makePolicy({ id: "p1", dietaryObservanceMet: true }),
      makePolicy({ id: "p2", dietaryObservanceMet: false }),
    ];
    const result = evaluateReligiousPolicy(policies);
    expect(result.dietaryObservanceRate).toBe(50);
  });

  it("calculates festival recognition rate correctly", () => {
    const policies = [
      makePolicy({ id: "p1", festivalRecognition: true }),
      makePolicy({ id: "p2", festivalRecognition: true }),
      makePolicy({ id: "p3", festivalRecognition: true }),
    ];
    const result = evaluateReligiousPolicy(policies);
    expect(result.festivalRecognitionRate).toBe(100);
  });

  it("calculates faith leader access rate correctly", () => {
    const policies = [
      makePolicy({ id: "p1", faithLeaderAccess: true }),
      makePolicy({ id: "p2", faithLeaderAccess: false }),
      makePolicy({ id: "p3", faithLeaderAccess: true }),
    ];
    const result = evaluateReligiousPolicy(policies);
    expect(result.faithLeaderAccessRate).toBe(67);
  });

  it("calculates prayer space rate correctly", () => {
    const policies = [
      makePolicy({ id: "p1", prayerSpaceAvailable: true }),
      makePolicy({ id: "p2", prayerSpaceAvailable: false }),
    ];
    const result = evaluateReligiousPolicy(policies);
    expect(result.prayerSpaceRate).toBe(50);
  });

  it("calculates anti-discrimination rate correctly", () => {
    const policies = [
      makePolicy({ id: "p1", antiDiscriminationTraining: true }),
      makePolicy({ id: "p2", antiDiscriminationTraining: true }),
      makePolicy({ id: "p3", antiDiscriminationTraining: false }),
    ];
    const result = evaluateReligiousPolicy(policies);
    expect(result.antiDiscriminationRate).toBe(67);
  });

  it("gives zero for all false across every field", () => {
    const policies = [
      makePolicy({ id: "p1", faithNeedsAssessedOnAdmission: false, worshipAccessProvided: false, dietaryObservanceMet: false, festivalRecognition: false, faithLeaderAccess: false, prayerSpaceAvailable: false, antiDiscriminationTraining: false }),
      makePolicy({ id: "p2", faithNeedsAssessedOnAdmission: false, worshipAccessProvided: false, dietaryObservanceMet: false, festivalRecognition: false, faithLeaderAccess: false, prayerSpaceAvailable: false, antiDiscriminationTraining: false }),
    ];
    const result = evaluateReligiousPolicy(policies);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const policies = Array.from({ length: 10 }, (_, i) =>
      makePolicy({ id: `p${i}` }),
    );
    const result = evaluateReligiousPolicy(policies);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single policy correctly", () => {
    const result = evaluateReligiousPolicy([makePolicy()]);
    expect(result.totalPolicies).toBe(1);
    expect(result.faithAssessedOnAdmissionRate).toBe(100);
  });

  it("scores demo data appropriately", () => {
    const result = evaluateReligiousPolicy(DEMO_POLICIES);
    expect(result.totalPolicies).toBe(1);
    expect(result.faithAssessedOnAdmissionRate).toBe(100);
    expect(result.worshipAccessRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// =============================================================================
// evaluateStaffReligiousReadiness
// =============================================================================

describe("evaluateStaffReligiousReadiness", () => {
  it("returns zero scores for empty training", () => {
    const result = evaluateStaffReligiousReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.faithAwarenessRate).toBe(0);
    expect(result.culturalCompetenceRate).toBe(0);
    expect(result.dietaryRequirementsRate).toBe(0);
    expect(result.festivalKnowledgeRate).toBe(0);
    expect(result.antiDiscriminationRate).toBe(0);
    expect(result.childViewsAdvocacyRate).toBe(0);
  });

  it("scores maximum for perfect training", () => {
    const training = Array.from({ length: 3 }, (_, i) =>
      makeTraining({ id: `t${i}` }),
    );
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.faithAwarenessRate).toBe(100);
    expect(result.culturalCompetenceRate).toBe(100);
    expect(result.dietaryRequirementsRate).toBe(100);
    expect(result.festivalKnowledgeRate).toBe(100);
    expect(result.antiDiscriminationRate).toBe(100);
    expect(result.childViewsAdvocacyRate).toBe(100);
  });

  it("calculates faith awareness rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", faithAwareness: true }),
      makeTraining({ id: "t2", faithAwareness: true }),
      makeTraining({ id: "t3", faithAwareness: false }),
    ];
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.faithAwarenessRate).toBe(67);
  });

  it("awards 6 points for faith awareness >= 90%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t${i}`,
        faithAwareness: i < 9 ? true : false,
        culturalCompetence: false,
        dietaryRequirements: false,
        festivalKnowledge: false,
        antiDiscrimination: false,
        childViewsAdvocacy: false,
      }),
    );
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.faithAwarenessRate).toBe(90);
    expect(result.overallScore).toBe(6);
  });

  it("awards 4 points for faith awareness >= 70% but < 90%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t${i}`,
        faithAwareness: i < 7 ? true : false,
        culturalCompetence: false,
        dietaryRequirements: false,
        festivalKnowledge: false,
        antiDiscrimination: false,
        childViewsAdvocacy: false,
      }),
    );
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.faithAwarenessRate).toBe(70);
    expect(result.overallScore).toBe(4);
  });

  it("awards 2 points for faith awareness >= 50% but < 70%", () => {
    const training = [
      makeTraining({ id: "t1", faithAwareness: true, culturalCompetence: false, dietaryRequirements: false, festivalKnowledge: false, antiDiscrimination: false, childViewsAdvocacy: false }),
      makeTraining({ id: "t2", faithAwareness: false, culturalCompetence: false, dietaryRequirements: false, festivalKnowledge: false, antiDiscrimination: false, childViewsAdvocacy: false }),
    ];
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.faithAwarenessRate).toBe(50);
    expect(result.overallScore).toBe(2);
  });

  it("calculates cultural competence rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", culturalCompetence: true }),
      makeTraining({ id: "t2", culturalCompetence: false }),
      makeTraining({ id: "t3", culturalCompetence: true }),
    ];
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.culturalCompetenceRate).toBe(67);
  });

  it("calculates dietary requirements rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", dietaryRequirements: true }),
      makeTraining({ id: "t2", dietaryRequirements: true }),
      makeTraining({ id: "t3", dietaryRequirements: false }),
      makeTraining({ id: "t4", dietaryRequirements: false }),
    ];
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.dietaryRequirementsRate).toBe(50);
  });

  it("calculates festival knowledge rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", festivalKnowledge: true }),
      makeTraining({ id: "t2", festivalKnowledge: true }),
      makeTraining({ id: "t3", festivalKnowledge: true }),
    ];
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.festivalKnowledgeRate).toBe(100);
  });

  it("calculates anti-discrimination rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", antiDiscrimination: true }),
      makeTraining({ id: "t2", antiDiscrimination: false }),
    ];
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.antiDiscriminationRate).toBe(50);
  });

  it("calculates child views advocacy rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", childViewsAdvocacy: true }),
      makeTraining({ id: "t2", childViewsAdvocacy: false }),
      makeTraining({ id: "t3", childViewsAdvocacy: false }),
    ];
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.childViewsAdvocacyRate).toBe(33);
  });

  it("gives zero for all false across every field", () => {
    const training = [
      makeTraining({ id: "t1", faithAwareness: false, culturalCompetence: false, dietaryRequirements: false, festivalKnowledge: false, antiDiscrimination: false, childViewsAdvocacy: false }),
      makeTraining({ id: "t2", faithAwareness: false, culturalCompetence: false, dietaryRequirements: false, festivalKnowledge: false, antiDiscrimination: false, childViewsAdvocacy: false }),
    ];
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t${i}` }),
    );
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single staff member correctly", () => {
    const result = evaluateStaffReligiousReadiness([makeTraining()]);
    expect(result.totalStaff).toBe(1);
    expect(result.faithAwarenessRate).toBe(100);
  });

  it("scores demo data appropriately", () => {
    const result = evaluateStaffReligiousReadiness(DEMO_TRAINING);
    expect(result.totalStaff).toBe(3);
    expect(result.faithAwarenessRate).toBe(100);
    expect(result.culturalCompetenceRate).toBe(100);
    expect(result.dietaryRequirementsRate).toBe(67);
    expect(result.festivalKnowledgeRate).toBe(67);
    expect(result.antiDiscriminationRate).toBe(100);
    expect(result.childViewsAdvocacyRate).toBe(67);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("applies correct weights — faith awareness > cultural competence > dietary", () => {
    // All staff have ONLY faithAwareness => should get 6 points
    const trainingFA = Array.from({ length: 3 }, (_, i) =>
      makeTraining({
        id: `t${i}`,
        faithAwareness: true,
        culturalCompetence: false,
        dietaryRequirements: false,
        festivalKnowledge: false,
        antiDiscrimination: false,
        childViewsAdvocacy: false,
      }),
    );
    const resultFA = evaluateStaffReligiousReadiness(trainingFA);

    // All staff have ONLY culturalCompetence => should get 5 points
    const trainingCC = Array.from({ length: 3 }, (_, i) =>
      makeTraining({
        id: `t${i}`,
        faithAwareness: false,
        culturalCompetence: true,
        dietaryRequirements: false,
        festivalKnowledge: false,
        antiDiscrimination: false,
        childViewsAdvocacy: false,
      }),
    );
    const resultCC = evaluateStaffReligiousReadiness(trainingCC);

    expect(resultFA.overallScore).toBeGreaterThan(resultCC.overallScore);
  });
});

// =============================================================================
// buildChildReligiousProfiles
// =============================================================================

describe("buildChildReligiousProfiles", () => {
  it("returns empty for no data", () => {
    const profiles = buildChildReligiousProfiles([], []);
    expect(profiles).toHaveLength(0);
  });

  it("builds profiles from assessments only", () => {
    const assessments = [
      makeAssessment({ childId: "child-alex", childName: "Alex", faithBackground: "christian" }),
    ];
    const profiles = buildChildReligiousProfiles(assessments, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].faithBackground).toBe("christian");
    expect(profiles[0].assessmentCount).toBe(1);
    expect(profiles[0].supportCount).toBe(0);
  });

  it("builds profiles from records only", () => {
    const records = [
      makeRecord({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildReligiousProfiles([], records);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-jordan");
    expect(profiles[0].supportCount).toBe(1);
    expect(profiles[0].faithBackground).toBe("other");
  });

  it("merges assessment and support data for same child", () => {
    const assessments = [
      makeAssessment({
        childId: "child-alex", childName: "Alex",
        faithBackground: "christian",
        needsIdentified: true, preferencesRecorded: true,
        childViewsSought: true, careplanUpdated: true,
      }),
    ];
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex", facilitated: true, childSatisfied: true, frequency: "weekly" }),
      makeRecord({ id: "r2", childId: "child-alex", childName: "Alex", facilitated: true, childSatisfied: true, frequency: "weekly" }),
      makeRecord({ id: "r3", childId: "child-alex", childName: "Alex", facilitated: true, childSatisfied: true, frequency: "weekly" }),
    ];
    const profiles = buildChildReligiousProfiles(assessments, records);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].assessmentCount).toBe(1);
    expect(profiles[0].supportCount).toBe(3);
    expect(profiles[0].score).toBeGreaterThan(0);
    expect(profiles[0].score).toBeLessThanOrEqual(10);
  });

  it("creates separate profiles for different children", () => {
    const assessments = [
      makeAssessment({ id: "a1", childId: "child-alex", childName: "Alex", faithBackground: "christian" }),
      makeAssessment({ id: "a2", childId: "child-jordan", childName: "Jordan", faithBackground: "muslim" }),
    ];
    const profiles = buildChildReligiousProfiles(assessments, []);
    expect(profiles).toHaveLength(2);
    const alexProfile = profiles.find((p) => p.childId === "child-alex");
    const jordanProfile = profiles.find((p) => p.childId === "child-jordan");
    expect(alexProfile).toBeDefined();
    expect(jordanProfile).toBeDefined();
    expect(alexProfile!.faithBackground).toBe("christian");
    expect(jordanProfile!.faithBackground).toBe("muslim");
  });

  it("caps child score at 10", () => {
    const assessments = [
      makeAssessment({
        childId: "child-alex", needsIdentified: true,
        preferencesRecorded: true, childViewsSought: true, careplanUpdated: true,
      }),
    ];
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`, childId: "child-alex", childName: "Alex",
        facilitated: true, childSatisfied: true, frequency: "weekly",
      }),
    );
    const profiles = buildChildReligiousProfiles(assessments, records);
    expect(profiles[0].score).toBeLessThanOrEqual(10);
  });

  it("gives zero score for child with no positive indicators", () => {
    const assessments = [
      makeAssessment({
        childId: "child-alex", needsIdentified: false,
        preferencesRecorded: false, childViewsSought: false, careplanUpdated: false,
      }),
    ];
    const profiles = buildChildReligiousProfiles(assessments, []);
    expect(profiles[0].score).toBe(0);
    expect(profiles[0].needsIdentified).toBe(false);
    expect(profiles[0].preferencesRecorded).toBe(false);
  });

  it("builds demo profiles correctly", () => {
    const profiles = buildChildReligiousProfiles(DEMO_ASSESSMENTS, DEMO_RECORDS);
    expect(profiles.length).toBeGreaterThanOrEqual(3);
    const alex = profiles.find((p) => p.childId === "child-alex");
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(alex).toBeDefined();
    expect(jordan).toBeDefined();
    expect(morgan).toBeDefined();
    expect(alex!.faithBackground).toBe("christian");
    expect(jordan!.faithBackground).toBe("muslim");
    expect(morgan!.faithBackground).toBe("buddhist");
  });
});

// =============================================================================
// generateReligiousSpiritualNeedsIntelligence
// =============================================================================

describe("generateReligiousSpiritualNeedsIntelligence", () => {
  it("returns complete intelligence for empty inputs", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.assessmentQuality.overallScore).toBe(0);
    expect(result.supportDelivery.overallScore).toBe(0);
    expect(result.religiousPolicy.overallScore).toBe(0);
    expect(result.staffReadiness.overallScore).toBe(0);
    expect(result.childProfiles).toHaveLength(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("generates correct intelligence for Chamberlain House demo data", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      DEMO_ASSESSMENTS, DEMO_RECORDS, DEMO_POLICIES, DEMO_TRAINING,
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);

    expect(result.assessmentQuality.totalAssessments).toBe(4);
    expect(result.supportDelivery.totalRecords).toBe(9);
    expect(result.religiousPolicy.totalPolicies).toBe(1);
    expect(result.staffReadiness.totalStaff).toBe(3);
    expect(result.childProfiles.length).toBeGreaterThanOrEqual(3);
  });

  it("caps overall score at 100", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        needsIdentified: true,
        preferencesRecorded: true,
        childViewsSought: true,
        parentCarerConsulted: true,
        careplanUpdated: true,
      }),
    );
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        facilitated: true,
        childSatisfied: true,
        culturallyAppropriate: true,
        frequency: "weekly",
      }),
    );
    const policies = Array.from({ length: 3 }, (_, i) => makePolicy({ id: `p${i}` }));
    const training = Array.from({ length: 5 }, (_, i) => makeTraining({ id: `t${i}` }));

    const result = generateReligiousSpiritualNeedsIntelligence(
      assessments, records, policies, training,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes all required regulatory links", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Equality Act 2010"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("UNCRC Article 14"))).toBe(true);
  });

  it("generates strengths when performance is high", () => {
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        needsIdentified: true,
        preferencesRecorded: true,
        childViewsSought: true,
        parentCarerConsulted: true,
        careplanUpdated: true,
      }),
    );
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        facilitated: true,
        childSatisfied: true,
        culturallyAppropriate: true,
        frequency: "weekly",
      }),
    );
    const policies = Array.from({ length: 3 }, (_, i) => makePolicy({ id: `p${i}` }));
    const training = Array.from({ length: 3 }, (_, i) => makeTraining({ id: `t${i}` }));

    const result = generateReligiousSpiritualNeedsIntelligence(
      assessments, records, policies, training,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement when data is missing", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates urgent actions when no assessments recorded", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
    expect(result.actions.some((a) => a.includes("religious and spiritual needs assessments"))).toBe(true);
  });

  it("generates urgent actions when no support records found", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [makeAssessment()], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("religious and spiritual support provision"))).toBe(true);
  });

  it("generates urgent actions when no policies recorded", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [makeAssessment()], [makeRecord()], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("religious and spiritual needs policies"))).toBe(true);
  });

  it("generates urgent actions when no staff training recorded", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [makeAssessment()], [makeRecord()], [makePolicy()], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("staff religious and spiritual training"))).toBe(true);
  });

  it("sums all four sub-scores for overall score", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      DEMO_ASSESSMENTS, DEMO_RECORDS, DEMO_POLICIES, DEMO_TRAINING,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const expectedSum =
      result.assessmentQuality.overallScore +
      result.supportDelivery.overallScore +
      result.religiousPolicy.overallScore +
      result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("rating matches overall score for outstanding", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a${i}`,
        needsIdentified: true,
        preferencesRecorded: true,
        childViewsSought: true,
        parentCarerConsulted: true,
        careplanUpdated: true,
      }),
    );
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r${i}`,
        facilitated: true,
        childSatisfied: true,
        culturallyAppropriate: true,
        frequency: "weekly",
      }),
    );
    const policies = Array.from({ length: 3 }, (_, i) => makePolicy({ id: `p${i}` }));
    const training = Array.from({ length: 3 }, (_, i) => makeTraining({ id: `t${i}` }));

    const highResult = generateReligiousSpiritualNeedsIntelligence(
      assessments, records, policies, training,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(highResult.rating).toBe("outstanding");
  });

  it("produces inadequate rating for very low scores", () => {
    const assessments = [
      makeAssessment({ needsIdentified: false, preferencesRecorded: false, childViewsSought: false, parentCarerConsulted: false, careplanUpdated: false }),
    ];
    const records = [
      makeRecord({ facilitated: false, childSatisfied: false, culturallyAppropriate: false, frequency: "not_provided" }),
    ];
    const policies = [
      makePolicy({ faithNeedsAssessedOnAdmission: false, worshipAccessProvided: false, dietaryObservanceMet: false, festivalRecognition: false, faithLeaderAccess: false, prayerSpaceAvailable: false, antiDiscriminationTraining: false }),
    ];
    const training = [
      makeTraining({ faithAwareness: false, culturalCompetence: false, dietaryRequirements: false, festivalKnowledge: false, antiDiscrimination: false, childViewsAdvocacy: false }),
    ];

    const result = generateReligiousSpiritualNeedsIntelligence(
      assessments, records, policies, training,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
  });

  it("handles assessments-only data correctly", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      DEMO_ASSESSMENTS, [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.assessmentQuality.totalAssessments).toBe(4);
    expect(result.supportDelivery.totalRecords).toBe(0);
    expect(result.religiousPolicy.totalPolicies).toBe(0);
    expect(result.staffReadiness.totalStaff).toBe(0);
  });

  it("handles records-only data correctly", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [], DEMO_RECORDS, [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.assessmentQuality.totalAssessments).toBe(0);
    expect(result.supportDelivery.totalRecords).toBe(9);
  });

  it("handles policies-only data correctly", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [], [], DEMO_POLICIES, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.religiousPolicy.totalPolicies).toBe(1);
    expect(result.assessmentQuality.totalAssessments).toBe(0);
  });

  it("handles training-only data correctly", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [], [], [], DEMO_TRAINING,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.staffReadiness.totalStaff).toBe(3);
    expect(result.assessmentQuality.totalAssessments).toBe(0);
  });

  it("preserves homeId and period in result", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      [], [], [], [],
      "maple-lodge", "2026-03-01", "2026-04-30",
    );
    expect(result.homeId).toBe("maple-lodge");
    expect(result.periodStart).toBe("2026-03-01");
    expect(result.periodEnd).toBe("2026-04-30");
  });

  it("includes child profiles in intelligence result", () => {
    const result = generateReligiousSpiritualNeedsIntelligence(
      DEMO_ASSESSMENTS, DEMO_RECORDS, DEMO_POLICIES, DEMO_TRAINING,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles.length).toBeGreaterThanOrEqual(3);
    expect(result.childProfiles.every((p) => p.score >= 0 && p.score <= 10)).toBe(true);
  });
});

// =============================================================================
// Edge Cases and Boundary Tests
// =============================================================================

describe("Edge cases", () => {
  it("handles many assessments", () => {
    const assessments = Array.from({ length: 50 }, (_, i) =>
      makeAssessment({ id: `a${i}`, needsIdentified: i % 2 === 0 }),
    );
    const result = evaluateAssessmentQuality(assessments);
    expect(result.totalAssessments).toBe(50);
    expect(result.needsIdentifiedRate).toBe(50);
  });

  it("handles many records", () => {
    const records = Array.from({ length: 30 }, (_, i) =>
      makeRecord({ id: `r${i}`, facilitated: i % 3 === 0 }),
    );
    const result = evaluateSupportDelivery(records);
    expect(result.totalRecords).toBe(30);
  });

  it("handles many policies", () => {
    const policies = Array.from({ length: 20 }, (_, i) =>
      makePolicy({ id: `p${i}`, faithNeedsAssessedOnAdmission: i % 2 === 0 }),
    );
    const result = evaluateReligiousPolicy(policies);
    expect(result.totalPolicies).toBe(20);
    expect(result.faithAssessedOnAdmissionRate).toBe(50);
  });

  it("handles many staff", () => {
    const training = Array.from({ length: 15 }, (_, i) =>
      makeTraining({ id: `t${i}`, faithAwareness: i % 3 === 0 }),
    );
    const result = evaluateStaffReligiousReadiness(training);
    expect(result.totalStaff).toBe(15);
  });

  it("handles all faith backgrounds", () => {
    const backgrounds: FaithBackground[] = [
      "christian", "muslim", "hindu", "sikh", "jewish",
      "buddhist", "no_faith", "spiritual_not_religious", "other",
    ];
    const assessments = backgrounds.map((faith, i) =>
      makeAssessment({ id: `a${i}`, faithBackground: faith }),
    );
    const result = evaluateAssessmentQuality(assessments);
    expect(result.totalAssessments).toBe(9);
  });

  it("handles all support types", () => {
    const types: SupportType[] = [
      "worship_access", "dietary_observance", "festival_celebration",
      "prayer_space", "faith_leader_contact", "religious_education",
      "faith_community", "other",
    ];
    const records = types.map((type, i) =>
      makeRecord({ id: `r${i}`, supportType: type }),
    );
    const result = evaluateSupportDelivery(records);
    expect(result.totalRecords).toBe(8);
  });

  it("handles all frequencies", () => {
    const frequencies: Frequency[] = ["daily", "weekly", "monthly", "occasionally", "not_provided"];
    const records = frequencies.map((freq, i) =>
      makeRecord({ id: `r${i}`, frequency: freq }),
    );
    const result = evaluateSupportDelivery(records);
    expect(result.totalRecords).toBe(5);
    // daily + weekly + monthly = 3/5 = 60%
    expect(result.regularFrequencyRate).toBe(60);
  });

  it("handles all ratings via getRating", () => {
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(79)).toBe("good");
    expect(getRating(60)).toBe("good");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});
