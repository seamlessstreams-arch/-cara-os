import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getMultiAgencyCategoryLabel,
  getMultiAgencyOutcomeLabel,
  getRatingLabel,
  evaluateMultiAgencyQuality,
  evaluateMultiAgencyCompliance,
  evaluateMultiAgencyPolicy,
  evaluateStaffMultiAgencyReadiness,
  buildChildMultiAgencyProfiles,
  generateMultiAgencyIntelligence,
} from "../multi-agency-intelligence-engine";
import type {
  MultiAgencyRecord,
  MultiAgencyPolicy,
  StaffMultiAgencyTraining,
  MultiAgencyCategory,
  MultiAgencyOutcome,
  Rating,
} from "../multi-agency-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<MultiAgencyRecord> = {}): MultiAgencyRecord {
  return {
    id: "rec-1",
    homeId: "home-oak",
    date: "2026-03-15",
    childId: "child-alex",
    childName: "Alex",
    category: "strategy_meeting",
    outcome: "fully_engaged",
    agencyAttendanceConfirmed: true,
    actionPointsRecorded: true,
    informationSharedAppropriately: true,
    childViewRepresented: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<MultiAgencyPolicy> = {}): MultiAgencyPolicy {
  return {
    multiAgencyWorkingPolicy: true,
    informationSharingProtocol: true,
    lacReviewProcedure: true,
    referralCoordinationPolicy: true,
    jointAssessmentFramework: true,
    professionalConsultationPolicy: true,
    multiAgencyTrainingPolicy: true,
    ...overrides,
  };
}

function makeStaff(overrides: Partial<StaffMultiAgencyTraining> = {}): StaffMultiAgencyTraining {
  return {
    staffId: "staff-1",
    multiAgencyWorkingKnowledge: true,
    informationSharingSkills: true,
    meetingFacilitationSkills: true,
    referralProcessKnowledge: true,
    jointAssessmentSkills: true,
    professionalBoundaries: true,
    ...overrides,
  };
}

// ── pct() ──────────────────────────────────────────────────────────────────

describe("pct()", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when numerator equals denominator", () => {
    expect(pct(5, 5)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("rounds correctly", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("handles large values", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

// ── getRating() ────────────────────────────────────────────────────────────

describe("getRating()", () => {
  it("returns outstanding for 80", () => {
    expect(getRating(80)).toBe("outstanding");
  });

  it("returns outstanding for 100", () => {
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for 60", () => {
    expect(getRating(60)).toBe("good");
  });

  it("returns good for 79", () => {
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
  });

  it("returns requires_improvement for 59", () => {
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for 39", () => {
    expect(getRating(39)).toBe("inadequate");
  });

  it("returns inadequate for 0", () => {
    expect(getRating(0)).toBe("inadequate");
  });
});

// ── Label functions ────────────────────────────────────────────────────────

describe("getMultiAgencyCategoryLabel()", () => {
  const categories: MultiAgencyCategory[] = [
    "strategy_meeting", "lac_review", "care_team_meeting",
    "professional_consultation", "information_sharing", "joint_assessment",
    "referral_coordination", "multi_agency_training",
  ];

  it.each(categories)("returns a string for %s", (cat) => {
    const label = getMultiAgencyCategoryLabel(cat);
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  it("returns correct label for strategy_meeting", () => {
    expect(getMultiAgencyCategoryLabel("strategy_meeting")).toBe("Strategy Meeting");
  });

  it("returns correct label for lac_review", () => {
    expect(getMultiAgencyCategoryLabel("lac_review")).toBe("LAC Review");
  });

  it("returns correct label for multi_agency_training", () => {
    expect(getMultiAgencyCategoryLabel("multi_agency_training")).toBe("Multi-Agency Training");
  });
});

describe("getMultiAgencyOutcomeLabel()", () => {
  const outcomes: MultiAgencyOutcome[] = [
    "fully_engaged", "partially_engaged", "agency_declined",
    "no_response", "not_applicable",
  ];

  it.each(outcomes)("returns a string for %s", (out) => {
    const label = getMultiAgencyOutcomeLabel(out);
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  it("returns correct label for fully_engaged", () => {
    expect(getMultiAgencyOutcomeLabel("fully_engaged")).toBe("Fully Engaged");
  });

  it("returns correct label for no_response", () => {
    expect(getMultiAgencyOutcomeLabel("no_response")).toBe("No Response");
  });
});

describe("getRatingLabel()", () => {
  const ratings: Rating[] = ["outstanding", "good", "requires_improvement", "inadequate"];

  it.each(ratings)("returns a string for %s", (r) => {
    const label = getRatingLabel(r);
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  it("returns Outstanding for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns Requires Improvement for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
});

// ── evaluateMultiAgencyQuality() ───────────────────────────────────────────

describe("evaluateMultiAgencyQuality()", () => {
  it("returns 0 score for empty records", () => {
    const result = evaluateMultiAgencyQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.agencyAttendanceConfirmedRate).toBe(0);
    expect(result.actionPointsRecordedRate).toBe(0);
    expect(result.informationSharedAppropriatelyRate).toBe(0);
    expect(result.childViewRepresentedRate).toBe(0);
  });

  it("returns 25 for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" }), makeRecord({ id: "rec-3" })];
    const result = evaluateMultiAgencyQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(3);
    expect(result.agencyAttendanceConfirmedRate).toBe(100);
    expect(result.actionPointsRecordedRate).toBe(100);
    expect(result.informationSharedAppropriatelyRate).toBe(100);
    expect(result.childViewRepresentedRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({
      agencyAttendanceConfirmed: false,
      actionPointsRecorded: false,
      informationSharedAppropriately: false,
      childViewRepresented: false,
    })];
    const result = evaluateMultiAgencyQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("handles mixed records correctly", () => {
    const records = [
      makeRecord(),
      makeRecord({ id: "rec-2", agencyAttendanceConfirmed: false, childViewRepresented: false }),
    ];
    const result = evaluateMultiAgencyQuality(records);
    expect(result.totalRecords).toBe(2);
    expect(result.agencyAttendanceConfirmedRate).toBe(50);
    expect(result.actionPointsRecordedRate).toBe(100);
    expect(result.informationSharedAppropriatelyRate).toBe(100);
    expect(result.childViewRepresentedRate).toBe(50);
    // score = (50/100)*7 + (100/100)*6 + (100/100)*6 + (50/100)*6 = 3.5 + 6 + 6 + 3 = 18.5
    expect(result.overallScore).toBe(18.5);
  });

  it("handles single record", () => {
    const records = [makeRecord()];
    const result = evaluateMultiAgencyQuality(records);
    expect(result.totalRecords).toBe(1);
    expect(result.overallScore).toBe(25);
  });

  it("score is capped at 25", () => {
    const records = [makeRecord()];
    const result = evaluateMultiAgencyQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const records = [makeRecord({
      agencyAttendanceConfirmed: false,
      actionPointsRecorded: false,
      informationSharedAppropriately: false,
      childViewRepresented: false,
    })];
    const result = evaluateMultiAgencyQuality(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("correctly weights agencyAttendanceConfirmed at 7", () => {
    const records = [makeRecord({
      agencyAttendanceConfirmed: true,
      actionPointsRecorded: false,
      informationSharedAppropriately: false,
      childViewRepresented: false,
    })];
    const result = evaluateMultiAgencyQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("correctly weights actionPointsRecorded at 6", () => {
    const records = [makeRecord({
      agencyAttendanceConfirmed: false,
      actionPointsRecorded: true,
      informationSharedAppropriately: false,
      childViewRepresented: false,
    })];
    const result = evaluateMultiAgencyQuality(records);
    expect(result.overallScore).toBe(6);
  });
});

// ── evaluateMultiAgencyCompliance() ─────────────────────────────────────────

describe("evaluateMultiAgencyCompliance()", () => {
  it("returns 0 score for empty records", () => {
    const result = evaluateMultiAgencyCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.agencyAttendanceConfirmedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("returns full score for full compliance", () => {
    const records = [
      makeRecord({ category: "strategy_meeting" }),
      makeRecord({ id: "rec-2", category: "lac_review" }),
      makeRecord({ id: "rec-3", category: "care_team_meeting" }),
      makeRecord({ id: "rec-4", category: "professional_consultation" }),
      makeRecord({ id: "rec-5", category: "information_sharing" }),
      makeRecord({ id: "rec-6", category: "joint_assessment" }),
      makeRecord({ id: "rec-7", category: "referral_coordination" }),
      makeRecord({ id: "rec-8", category: "multi_agency_training" }),
    ];
    const result = evaluateMultiAgencyCompliance(records);
    expect(result.documentationCompleteRate).toBe(100);
    expect(result.timelyRecordingRate).toBe(100);
    expect(result.agencyAttendanceConfirmedRate).toBe(100);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
    expect(result.overallScore).toBe(25);
  });

  it("handles partial compliance", () => {
    const records = [
      makeRecord({ documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "rec-2", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluateMultiAgencyCompliance(records);
    expect(result.documentationCompleteRate).toBe(50);
    expect(result.timelyRecordingRate).toBe(50);
    expect(result.agencyAttendanceConfirmedRate).toBe(100);
  });

  it("calculates category diversity correctly with 1 category", () => {
    const records = [makeRecord()];
    const result = evaluateMultiAgencyCompliance(records);
    expect(result.uniqueCategories).toBe(1);
    expect(result.categoryDiversityRatio).toBe(0.13);
  });

  it("calculates category diversity correctly with 4 categories", () => {
    const records = [
      makeRecord({ category: "strategy_meeting" }),
      makeRecord({ id: "rec-2", category: "lac_review" }),
      makeRecord({ id: "rec-3", category: "care_team_meeting" }),
      makeRecord({ id: "rec-4", category: "professional_consultation" }),
    ];
    const result = evaluateMultiAgencyCompliance(records);
    expect(result.uniqueCategories).toBe(4);
    expect(result.categoryDiversityRatio).toBe(0.5);
  });

  it("calculates category diversity correctly with 6 categories", () => {
    const records = [
      makeRecord({ category: "strategy_meeting" }),
      makeRecord({ id: "rec-2", category: "lac_review" }),
      makeRecord({ id: "rec-3", category: "care_team_meeting" }),
      makeRecord({ id: "rec-4", category: "professional_consultation" }),
      makeRecord({ id: "rec-5", category: "information_sharing" }),
      makeRecord({ id: "rec-6", category: "joint_assessment" }),
    ];
    const result = evaluateMultiAgencyCompliance(records);
    expect(result.uniqueCategories).toBe(6);
    expect(result.categoryDiversityRatio).toBe(0.75);
  });

  it("score is capped at 25", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, category: ["strategy_meeting", "lac_review", "care_team_meeting", "professional_consultation", "information_sharing", "joint_assessment", "referral_coordination", "multi_agency_training"][i] as MultiAgencyCategory })
    );
    const result = evaluateMultiAgencyCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const records = [makeRecord({
      documentationComplete: false,
      timelyRecording: false,
      agencyAttendanceConfirmed: false,
    })];
    const result = evaluateMultiAgencyCompliance(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── evaluateMultiAgencyPolicy() ─────────────────────────────────────────────

describe("evaluateMultiAgencyPolicy()", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateMultiAgencyPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.multiAgencyWorkingPolicy).toBe(false);
    expect(result.informationSharingProtocol).toBe(false);
    expect(result.lacReviewProcedure).toBe(false);
    expect(result.referralCoordinationPolicy).toBe(false);
    expect(result.jointAssessmentFramework).toBe(false);
    expect(result.professionalConsultationPolicy).toBe(false);
    expect(result.multiAgencyTrainingPolicy).toBe(false);
  });

  it("returns 25 for all true", () => {
    const result = evaluateMultiAgencyPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all false", () => {
    const result = evaluateMultiAgencyPolicy(makePolicy({
      multiAgencyWorkingPolicy: false,
      informationSharingProtocol: false,
      lacReviewProcedure: false,
      referralCoordinationPolicy: false,
      jointAssessmentFramework: false,
      professionalConsultationPolicy: false,
      multiAgencyTrainingPolicy: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("returns correct partial score for multiAgencyWorkingPolicy only", () => {
    const result = evaluateMultiAgencyPolicy(makePolicy({
      multiAgencyWorkingPolicy: true,
      informationSharingProtocol: false,
      lacReviewProcedure: false,
      referralCoordinationPolicy: false,
      jointAssessmentFramework: false,
      professionalConsultationPolicy: false,
      multiAgencyTrainingPolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("returns correct partial score for weight-4 policies", () => {
    const result = evaluateMultiAgencyPolicy(makePolicy({
      multiAgencyWorkingPolicy: true,
      informationSharingProtocol: true,
      lacReviewProcedure: true,
      referralCoordinationPolicy: true,
      jointAssessmentFramework: false,
      professionalConsultationPolicy: false,
      multiAgencyTrainingPolicy: false,
    }));
    expect(result.overallScore).toBe(16);
  });

  it("returns correct partial score for weight-3 policies", () => {
    const result = evaluateMultiAgencyPolicy(makePolicy({
      multiAgencyWorkingPolicy: false,
      informationSharingProtocol: false,
      lacReviewProcedure: false,
      referralCoordinationPolicy: false,
      jointAssessmentFramework: true,
      professionalConsultationPolicy: true,
      multiAgencyTrainingPolicy: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("reflects boolean values in result", () => {
    const pol = makePolicy({
      multiAgencyWorkingPolicy: true,
      informationSharingProtocol: false,
      lacReviewProcedure: true,
      referralCoordinationPolicy: false,
      jointAssessmentFramework: true,
      professionalConsultationPolicy: false,
      multiAgencyTrainingPolicy: true,
    });
    const result = evaluateMultiAgencyPolicy(pol);
    expect(result.multiAgencyWorkingPolicy).toBe(true);
    expect(result.informationSharingProtocol).toBe(false);
    expect(result.lacReviewProcedure).toBe(true);
    expect(result.referralCoordinationPolicy).toBe(false);
    expect(result.jointAssessmentFramework).toBe(true);
    expect(result.professionalConsultationPolicy).toBe(false);
    expect(result.multiAgencyTrainingPolicy).toBe(true);
  });

  it("score is capped at 25", () => {
    const result = evaluateMultiAgencyPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffMultiAgencyReadiness() ─────────────────────────────────────

describe("evaluateStaffMultiAgencyReadiness()", () => {
  it("returns 0 for empty staff", () => {
    const result = evaluateStaffMultiAgencyReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.multiAgencyWorkingKnowledgeRate).toBe(0);
    expect(result.informationSharingSkillsRate).toBe(0);
    expect(result.meetingFacilitationSkillsRate).toBe(0);
    expect(result.referralProcessKnowledgeRate).toBe(0);
    expect(result.jointAssessmentSkillsRate).toBe(0);
    expect(result.professionalBoundariesRate).toBe(0);
  });

  it("returns 25 for full training", () => {
    const staff = [makeStaff(), makeStaff({ staffId: "staff-2" })];
    const result = evaluateStaffMultiAgencyReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(2);
    expect(result.multiAgencyWorkingKnowledgeRate).toBe(100);
    expect(result.informationSharingSkillsRate).toBe(100);
    expect(result.meetingFacilitationSkillsRate).toBe(100);
    expect(result.referralProcessKnowledgeRate).toBe(100);
    expect(result.jointAssessmentSkillsRate).toBe(100);
    expect(result.professionalBoundariesRate).toBe(100);
  });

  it("returns 0 when all training is false", () => {
    const staff = [makeStaff({
      multiAgencyWorkingKnowledge: false,
      informationSharingSkills: false,
      meetingFacilitationSkills: false,
      referralProcessKnowledge: false,
      jointAssessmentSkills: false,
      professionalBoundaries: false,
    })];
    const result = evaluateStaffMultiAgencyReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("handles partial training (50% across all skills)", () => {
    const staff = [
      makeStaff(),
      makeStaff({
        staffId: "staff-2",
        multiAgencyWorkingKnowledge: false,
        informationSharingSkills: false,
        meetingFacilitationSkills: false,
        referralProcessKnowledge: false,
        jointAssessmentSkills: false,
        professionalBoundaries: false,
      }),
    ];
    const result = evaluateStaffMultiAgencyReadiness(staff);
    expect(result.multiAgencyWorkingKnowledgeRate).toBe(50);
    expect(result.informationSharingSkillsRate).toBe(50);
    expect(result.meetingFacilitationSkillsRate).toBe(50);
    // score = 50/100 * 6 + 50/100 * 5 + 50/100 * 5 + 50/100 * 4 + 50/100 * 3 + 50/100 * 2 = 3+2.5+2.5+2+1.5+1 = 12.5
    expect(result.overallScore).toBe(12.5);
  });

  it("correctly weights multiAgencyWorkingKnowledge at 6", () => {
    const staff = [makeStaff({
      multiAgencyWorkingKnowledge: true,
      informationSharingSkills: false,
      meetingFacilitationSkills: false,
      referralProcessKnowledge: false,
      jointAssessmentSkills: false,
      professionalBoundaries: false,
    })];
    const result = evaluateStaffMultiAgencyReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("correctly weights professionalBoundaries at 2", () => {
    const staff = [makeStaff({
      multiAgencyWorkingKnowledge: false,
      informationSharingSkills: false,
      meetingFacilitationSkills: false,
      referralProcessKnowledge: false,
      jointAssessmentSkills: false,
      professionalBoundaries: true,
    })];
    const result = evaluateStaffMultiAgencyReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("score is capped at 25", () => {
    const staff = [makeStaff()];
    const result = evaluateStaffMultiAgencyReadiness(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const staff = [makeStaff({
      multiAgencyWorkingKnowledge: false,
      informationSharingSkills: false,
      meetingFacilitationSkills: false,
      referralProcessKnowledge: false,
      jointAssessmentSkills: false,
      professionalBoundaries: false,
    })];
    const result = evaluateStaffMultiAgencyReadiness(staff);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── buildChildMultiAgencyProfiles() ─────────────────────────────────────────

describe("buildChildMultiAgencyProfiles()", () => {
  it("returns empty array for empty records", () => {
    const result = buildChildMultiAgencyProfiles([]);
    expect(result).toEqual([]);
  });

  it("builds profile for single child", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", category: "strategy_meeting" }),
      makeRecord({ id: "rec-2", childId: "child-alex", childName: "Alex", category: "lac_review" }),
    ];
    const result = buildChildMultiAgencyProfiles(records);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("child-alex");
    expect(result[0].childName).toBe("Alex");
    expect(result[0].totalRecords).toBe(2);
    expect(result[0].agencyAttendanceConfirmedRate).toBe(100);
    expect(result[0].childViewRepresentedRate).toBe(100);
    expect(result[0].categoriesCovered).toHaveLength(2);
  });

  it("builds profiles for multiple children", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "rec-2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "rec-3", childId: "child-morgan", childName: "Morgan" }),
    ];
    const result = buildChildMultiAgencyProfiles(records);
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.childId).sort()).toEqual(["child-alex", "child-jordan", "child-morgan"]);
  });

  it("groups records by child", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", category: "strategy_meeting" }),
      makeRecord({ id: "rec-2", childId: "child-alex", childName: "Alex", category: "lac_review" }),
      makeRecord({ id: "rec-3", childId: "child-jordan", childName: "Jordan", category: "care_team_meeting" }),
    ];
    const result = buildChildMultiAgencyProfiles(records);
    const alex = result.find((p) => p.childId === "child-alex")!;
    const jordan = result.find((p) => p.childId === "child-jordan")!;
    expect(alex.totalRecords).toBe(2);
    expect(jordan.totalRecords).toBe(1);
  });

  // Scoring bands
  it("frequency score: 0 for <5 records", () => {
    const records = [makeRecord({ childId: "child-a", childName: "A" })];
    const result = buildChildMultiAgencyProfiles(records);
    // freq=0, rate1=3 (100%), rate2=3 (100%), diversity=0 (1 cat) → 6
    expect(result[0].overallScore).toBe(6);
  });

  it("frequency score: 1 for 5 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-a", childName: "A" })
    );
    const result = buildChildMultiAgencyProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0 (1 cat) → 7
    expect(result[0].overallScore).toBe(7);
  });

  it("frequency score: 2 for 10 records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-a", childName: "A" })
    );
    const result = buildChildMultiAgencyProfiles(records);
    // freq=2, rate1=3, rate2=3, diversity=0 (1 cat) → 8
    expect(result[0].overallScore).toBe(8);
  });

  it("rate1 (agencyAttendance) score: 0 for <40%", () => {
    const records = [
      makeRecord({ childId: "child-a", childName: "A", agencyAttendanceConfirmed: false }),
      makeRecord({ id: "rec-2", childId: "child-a", childName: "A", agencyAttendanceConfirmed: false }),
      makeRecord({ id: "rec-3", childId: "child-a", childName: "A", agencyAttendanceConfirmed: true }),
    ];
    // agencyAttendance = 33%
    const result = buildChildMultiAgencyProfiles(records);
    // freq=0, rate1=0 (33%), rate2=3 (100%), diversity=0 → 3
    expect(result[0].overallScore).toBe(3);
  });

  it("rate1 (agencyAttendance) score: 1 for 40-59%", () => {
    const records = [
      makeRecord({ childId: "child-a", childName: "A", agencyAttendanceConfirmed: true }),
      makeRecord({ id: "rec-2", childId: "child-a", childName: "A", agencyAttendanceConfirmed: false }),
      makeRecord({ id: "rec-3", childId: "child-a", childName: "A", agencyAttendanceConfirmed: false }),
      makeRecord({ id: "rec-4", childId: "child-a", childName: "A", agencyAttendanceConfirmed: false }),
      makeRecord({ id: "rec-5", childId: "child-a", childName: "A", agencyAttendanceConfirmed: true }),
    ];
    // agencyAttendance = 40%
    const result = buildChildMultiAgencyProfiles(records);
    // freq=1 (5 records), rate1=1 (40%), rate2=3 (100%), diversity=0 → 5
    expect(result[0].overallScore).toBe(5);
  });

  it("rate2 (childView) score: 2 for 60-79%", () => {
    const records = [
      makeRecord({ childId: "child-a", childName: "A", childViewRepresented: true }),
      makeRecord({ id: "rec-2", childId: "child-a", childName: "A", childViewRepresented: true }),
      makeRecord({ id: "rec-3", childId: "child-a", childName: "A", childViewRepresented: true }),
      makeRecord({ id: "rec-4", childId: "child-a", childName: "A", childViewRepresented: false }),
      makeRecord({ id: "rec-5", childId: "child-a", childName: "A", childViewRepresented: false }),
    ];
    // childView = 60%
    const result = buildChildMultiAgencyProfiles(records);
    // freq=1 (5 records), rate1=3 (100%), rate2=2 (60%), diversity=0 → 6
    expect(result[0].overallScore).toBe(6);
  });

  it("diversity score: 0 for 1 category", () => {
    const records = [makeRecord()];
    const result = buildChildMultiAgencyProfiles(records);
    expect(result[0].categoriesCovered).toHaveLength(1);
  });

  it("diversity score: 1 for 2 categories", () => {
    const records = [
      makeRecord({ childId: "child-a", childName: "A", category: "strategy_meeting" }),
      makeRecord({ id: "rec-2", childId: "child-a", childName: "A", category: "lac_review" }),
    ];
    const result = buildChildMultiAgencyProfiles(records);
    expect(result[0].categoriesCovered).toHaveLength(2);
    // freq=0, rate1=3, rate2=3, diversity=1 → 7
    expect(result[0].overallScore).toBe(7);
  });

  it("diversity score: 2 for 4+ categories", () => {
    const records = [
      makeRecord({ childId: "child-a", childName: "A", category: "strategy_meeting" }),
      makeRecord({ id: "rec-2", childId: "child-a", childName: "A", category: "lac_review" }),
      makeRecord({ id: "rec-3", childId: "child-a", childName: "A", category: "care_team_meeting" }),
      makeRecord({ id: "rec-4", childId: "child-a", childName: "A", category: "professional_consultation" }),
    ];
    const result = buildChildMultiAgencyProfiles(records);
    expect(result[0].categoriesCovered).toHaveLength(4);
    // freq=0, rate1=3, rate2=3, diversity=2 → 8
    expect(result[0].overallScore).toBe(8);
  });

  it("overall score is capped at 10", () => {
    const cats: MultiAgencyCategory[] = [
      "strategy_meeting", "lac_review", "care_team_meeting", "professional_consultation",
      "information_sharing", "joint_assessment", "referral_coordination", "multi_agency_training",
    ];
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({ id: `rec-${i}`, childId: "child-a", childName: "A", category: cats[i % 8] })
    );
    const result = buildChildMultiAgencyProfiles(records);
    // freq=2 (12 records), rate1=3 (100%), rate2=3 (100%), diversity=2 (8 cats) → min(10, 10) = 10
    expect(result[0].overallScore).toBe(10);
  });

  it("child with all false booleans gets low score", () => {
    const records = [makeRecord({
      childId: "child-a",
      childName: "A",
      agencyAttendanceConfirmed: false,
      childViewRepresented: false,
    })];
    const result = buildChildMultiAgencyProfiles(records);
    // freq=0, rate1=0 (0%), rate2=0 (0%), diversity=0 → 0
    expect(result[0].overallScore).toBe(0);
  });
});

// ── generateMultiAgencyIntelligence() ───────────────────────────────────────

describe("generateMultiAgencyIntelligence()", () => {
  it("full orchestration with good data", () => {
    const cats: MultiAgencyCategory[] = [
      "strategy_meeting", "lac_review", "care_team_meeting", "professional_consultation",
      "information_sharing", "joint_assessment", "referral_coordination", "multi_agency_training",
    ];
    const records = cats.map((cat, i) => makeRecord({ id: `rec-${i}`, category: cat, date: "2026-03-15" }));
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff(), makeStaff({ staffId: "staff-2" })],
    });

    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.multiAgencyQuality.overallScore).toBe(25);
    expect(result.multiAgencyCompliance.overallScore).toBe(25);
    expect(result.multiAgencyPolicy.overallScore).toBe(25);
    expect(result.staffReadiness.overallScore).toBe(25);
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("handles empty records", () => {
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: makePolicy(),
      staff: [makeStaff()],
    });
    expect(result.multiAgencyQuality.overallScore).toBe(0);
    expect(result.multiAgencyCompliance.overallScore).toBe(0);
    expect(result.overallScore).toBe(50);
    expect(result.rating).toBe("requires_improvement");
    expect(result.areasForImprovement).toContain("No multi-agency records — multi-agency working must be documented");
  });

  it("handles null policy", () => {
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [makeRecord()],
      policy: null,
      staff: [makeStaff()],
    });
    expect(result.multiAgencyPolicy.overallScore).toBe(0);
    expect(result.areasForImprovement).toContain("No multi-agency policy in place — statutory requirement");
    expect(result.actions.some((a) => a.startsWith("URGENT:"))).toBe(true);
  });

  it("handles empty staff", () => {
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [makeRecord()],
      policy: makePolicy(),
      staff: [],
    });
    expect(result.staffReadiness.overallScore).toBe(0);
    expect(result.areasForImprovement).toContain("No staff multi-agency training records — training required");
    expect(result.actions.some((a) => a.includes("No staff multi-agency training"))).toBe(true);
  });

  it("filters records by date range", () => {
    const records = [
      makeRecord({ id: "in-range-1", date: "2026-03-15" }),
      makeRecord({ id: "in-range-2", date: "2026-04-01" }),
      makeRecord({ id: "out-of-range", date: "2025-12-01" }),
    ];
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff()],
    });
    expect(result.multiAgencyQuality.totalRecords).toBe(2);
  });

  it("score is capped at 100", () => {
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [makeRecord()],
      policy: makePolicy(),
      staff: [makeStaff()],
    });
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns childProfiles", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "rec-2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff()],
    });
    expect(result.childProfiles).toHaveLength(2);
  });

  it("returns regulatory links", () => {
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 5 — Engaging with others");
    expect(result.regulatoryLinks).toContain("WTSC 2023 — Multi-agency safeguarding arrangements");
    expect(result.regulatoryLinks).toContain("Quality Standards 2015 Standard 5");
  });

  it("inadequate rating generates urgent actions", () => {
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
    expect(result.actions.some((a) => a.startsWith("URGENT:"))).toBe(true);
  });

  it("good data generates strengths, not improvement areas for the same dimension", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        category: ["strategy_meeting", "lac_review", "care_team_meeting", "professional_consultation", "information_sharing", "joint_assessment", "referral_coordination", "multi_agency_training"][i] as MultiAgencyCategory,
      })
    );
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff(), makeStaff({ staffId: "staff-2" })],
    });
    expect(result.strengths.length).toBeGreaterThan(0);
    // Outstanding → no "Requires Improvement" or "Inadequate" improvement area
    expect(result.areasForImprovement.filter((a) => a.includes("Inadequate")).length).toBe(0);
    expect(result.areasForImprovement.filter((a) => a.includes("Requires Improvement")).length).toBe(0);
  });

  it("actions include no-action message when all is well", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        category: ["strategy_meeting", "lac_review", "care_team_meeting", "professional_consultation", "information_sharing", "joint_assessment", "referral_coordination", "multi_agency_training"][i] as MultiAgencyCategory,
      })
    );
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff(), makeStaff({ staffId: "staff-2" })],
    });
    expect(result.actions).toContain("No immediate actions required. Multi-agency working systems operating within expected standards.");
  });

  it("low child view rate triggers HIGH action", () => {
    const records = [
      makeRecord({ childViewRepresented: false }),
      makeRecord({ id: "rec-2", childViewRepresented: false }),
      makeRecord({ id: "rec-3", childViewRepresented: false }),
    ];
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("Child view representation"))).toBe(true);
  });

  it("low documentation rate triggers HIGH action", () => {
    const records = [
      makeRecord({ documentationComplete: false }),
      makeRecord({ id: "rec-2", documentationComplete: false }),
      makeRecord({ id: "rec-3", documentationComplete: false }),
    ];
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("HIGH") && a.includes("Documentation rate"))).toBe(true);
  });

  it("low timely recording triggers MEDIUM action", () => {
    const records = [
      makeRecord({ timelyRecording: false }),
      makeRecord({ id: "rec-2", timelyRecording: false }),
      makeRecord({ id: "rec-3", timelyRecording: false }),
    ];
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("Timely recording"))).toBe(true);
  });

  it("low staff knowledge triggers MEDIUM action", () => {
    const staff = [
      makeStaff({ multiAgencyWorkingKnowledge: false }),
      makeStaff({ staffId: "staff-2", multiAgencyWorkingKnowledge: false }),
      makeStaff({ staffId: "staff-3", multiAgencyWorkingKnowledge: false }),
    ];
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [makeRecord()],
      policy: makePolicy(),
      staff,
    });
    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("Multi-agency working knowledge"))).toBe(true);
  });

  it("low-scoring children trigger MEDIUM action", () => {
    const records = [
      makeRecord({
        childId: "child-low",
        childName: "Low",
        agencyAttendanceConfirmed: false,
        childViewRepresented: false,
      }),
    ];
    const result = generateMultiAgencyIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeStaff()],
    });
    expect(result.actions.some((a) => a.includes("MEDIUM") && a.includes("child(ren) with low multi-agency scores"))).toBe(true);
  });
});
