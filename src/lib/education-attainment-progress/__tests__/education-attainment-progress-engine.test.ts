// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Education Attainment & Progress Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson (Senior RSW), Tom Richards (RSW),
//        Lisa Williams (Senior RSW), Darren Laville (RM)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateEducationQuality,
  evaluateEducationCompliance,
  evaluateEducationPolicy,
  evaluateStaffEducationReadiness,
  buildChildEducationProfiles,
  generateEducationAttainmentProgressIntelligence,
  getEducationAreaLabel,
  getProgressLevelLabel,
  getRatingLabel,
} from "../education-attainment-progress-engine";
import type {
  EducationRecord,
  EducationPolicy,
  StaffEducationTraining,
} from "../education-attainment-progress-engine";

// ── Factory Functions ────────────────────────────────────────────────────

let recordIdCounter = 0;
const makeRecord = (overrides: Partial<EducationRecord> = {}): EducationRecord => ({
  id: `edu-${String(++recordIdCounter).padStart(3, "0")}`,
  childId: "child-alex",
  childName: "Alex",
  recordDate: "2026-03-15",
  educationArea: "academic_progress",
  progressLevel: "expected",
  pepUpdated: true,
  schoolAttendanceGood: true,
  staffAdvocacyProvided: true,
  documentedInPlan: true,
  virtualSchoolLinked: true,
  childViewsCaptured: true,
  ...overrides,
});

let policyIdCounter = 0;
const makePolicy = (overrides: Partial<EducationPolicy> = {}): EducationPolicy => ({
  id: `pol-${String(++policyIdCounter).padStart(3, "0")}`,
  educationChampionRole: true,
  pepReviewSchedule: true,
  attendanceMonitoring: true,
  homeworkSupportPlan: true,
  senCoordination: true,
  virtualSchoolPartnership: true,
  regularReview: true,
  ...overrides,
});

let trainingIdCounter = 0;
const makeTraining = (overrides: Partial<StaffEducationTraining> = {}): StaffEducationTraining => ({
  id: `train-${String(++trainingIdCounter).padStart(3, "0")}`,
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  educationSupport: true,
  pepProcess: true,
  attendanceImportance: true,
  senAwareness: true,
  homeworkStrategies: true,
  virtualSchoolProtocol: true,
  ...overrides,
});

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────

const OAK_HOUSE_RECORDS: EducationRecord[] = [
  makeRecord({
    childId: "child-alex", childName: "Alex", recordDate: "2026-02-01",
    educationArea: "attendance", progressLevel: "expected",
    pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
    documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
  }),
  makeRecord({
    childId: "child-alex", childName: "Alex", recordDate: "2026-03-01",
    educationArea: "academic_progress", progressLevel: "exceeding",
    pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
    documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
  }),
  makeRecord({
    childId: "child-alex", childName: "Alex", recordDate: "2026-04-01",
    educationArea: "pep_review", progressLevel: "expected",
    pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
    documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
  }),
  makeRecord({
    childId: "child-jordan", childName: "Jordan", recordDate: "2026-02-15",
    educationArea: "homework_support", progressLevel: "developing",
    pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
    documentedInPlan: true, virtualSchoolLinked: false, childViewsCaptured: true,
  }),
  makeRecord({
    childId: "child-jordan", childName: "Jordan", recordDate: "2026-03-15",
    educationArea: "extra_curricular", progressLevel: "expected",
    pepUpdated: true, schoolAttendanceGood: false, staffAdvocacyProvided: true,
    documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: false,
  }),
  makeRecord({
    childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-15",
    educationArea: "sen_support", progressLevel: "developing",
    pepUpdated: false, schoolAttendanceGood: true, staffAdvocacyProvided: false,
    documentedInPlan: false, virtualSchoolLinked: false, childViewsCaptured: true,
  }),
  makeRecord({
    childId: "child-morgan", childName: "Morgan", recordDate: "2026-01-20",
    educationArea: "careers_guidance", progressLevel: "expected",
    pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
    documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
  }),
  makeRecord({
    childId: "child-morgan", childName: "Morgan", recordDate: "2026-02-20",
    educationArea: "school_liaison", progressLevel: "exceeding",
    pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
    documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
  }),
  makeRecord({
    childId: "child-morgan", childName: "Morgan", recordDate: "2026-03-20",
    educationArea: "attendance", progressLevel: "expected",
    pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
    documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
  }),
  makeRecord({
    childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-20",
    educationArea: "academic_progress", progressLevel: "below",
    pepUpdated: false, schoolAttendanceGood: false, staffAdvocacyProvided: false,
    documentedInPlan: false, virtualSchoolLinked: false, childViewsCaptured: false,
  }),
];

const OAK_HOUSE_POLICY = makePolicy();

const OAK_HOUSE_TRAINING: StaffEducationTraining[] = [
  makeTraining({
    staffId: "staff-sarah", staffName: "Sarah Johnson",
    educationSupport: true, pepProcess: true, attendanceImportance: true,
    senAwareness: true, homeworkStrategies: true, virtualSchoolProtocol: true,
  }),
  makeTraining({
    staffId: "staff-tom", staffName: "Tom Richards",
    educationSupport: true, pepProcess: true, attendanceImportance: true,
    senAwareness: true, homeworkStrategies: false, virtualSchoolProtocol: false,
  }),
  makeTraining({
    staffId: "staff-lisa", staffName: "Lisa Williams",
    educationSupport: true, pepProcess: true, attendanceImportance: true,
    senAwareness: false, homeworkStrategies: true, virtualSchoolProtocol: true,
  }),
  makeTraining({
    staffId: "staff-darren", staffName: "Darren Laville",
    educationSupport: true, pepProcess: true, attendanceImportance: true,
    senAwareness: true, homeworkStrategies: true, virtualSchoolProtocol: true,
  }),
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateEducationQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEducationQuality", () => {
  it("returns score 0 for empty records (PRESENCE pattern)", () => {
    const result = evaluateEducationQuality([]);
    expect(result.score).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it("returns 0 rates for empty records", () => {
    const result = evaluateEducationQuality([]);
    expect(result.progressRate).toBe(0);
    expect(result.pepUpdatedRate).toBe(0);
    expect(result.attendanceRate).toBe(0);
    expect(result.childViewsRate).toBe(0);
  });

  it("calculates progressRate correctly (exceeding + expected)", () => {
    const records = [
      makeRecord({ progressLevel: "exceeding" }),
      makeRecord({ progressLevel: "expected" }),
      makeRecord({ progressLevel: "below" }),
    ];
    const result = evaluateEducationQuality(records);
    expect(result.progressRate).toBe(67);
  });

  it("counts only exceeding and expected for progressRate", () => {
    const records = [
      makeRecord({ progressLevel: "developing" }),
      makeRecord({ progressLevel: "below" }),
      makeRecord({ progressLevel: "significantly_below" }),
    ];
    const result = evaluateEducationQuality(records);
    expect(result.progressRate).toBe(0);
  });

  it("calculates pepUpdatedRate correctly", () => {
    const records = [
      makeRecord({ pepUpdated: true }),
      makeRecord({ pepUpdated: true }),
      makeRecord({ pepUpdated: false }),
    ];
    const result = evaluateEducationQuality(records);
    expect(result.pepUpdatedRate).toBe(67);
  });

  it("calculates attendanceRate correctly", () => {
    const records = [
      makeRecord({ schoolAttendanceGood: true }),
      makeRecord({ schoolAttendanceGood: false }),
    ];
    const result = evaluateEducationQuality(records);
    expect(result.attendanceRate).toBe(50);
  });

  it("calculates childViewsRate correctly", () => {
    const records = [
      makeRecord({ childViewsCaptured: true }),
      makeRecord({ childViewsCaptured: true }),
      makeRecord({ childViewsCaptured: true }),
      makeRecord({ childViewsCaptured: false }),
    ];
    const result = evaluateEducationQuality(records);
    expect(result.childViewsRate).toBe(75);
  });

  it("achieves max score 25 for perfect records", () => {
    const records = [
      makeRecord({
        progressLevel: "exceeding", pepUpdated: true,
        schoolAttendanceGood: true, childViewsCaptured: true,
      }),
    ];
    const result = evaluateEducationQuality(records);
    expect(result.score).toBe(25);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateEducationQuality(OAK_HOUSE_RECORDS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 10 records", () => {
    const result = evaluateEducationQuality(OAK_HOUSE_RECORDS);
    expect(result.totalRecords).toBe(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateEducationCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEducationCompliance", () => {
  it("returns score 0 for empty records (PRESENCE pattern)", () => {
    const result = evaluateEducationCompliance([]);
    expect(result.score).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it("returns 0 rates for empty records", () => {
    const result = evaluateEducationCompliance([]);
    expect(result.staffAdvocacyRate).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.virtualSchoolRate).toBe(0);
    expect(result.areaDiversity).toBe(0);
  });

  it("calculates staffAdvocacyRate correctly", () => {
    const records = [
      makeRecord({ staffAdvocacyProvided: true }),
      makeRecord({ staffAdvocacyProvided: false }),
    ];
    const result = evaluateEducationCompliance(records);
    expect(result.staffAdvocacyRate).toBe(50);
  });

  it("calculates documentedRate correctly", () => {
    const records = [
      makeRecord({ documentedInPlan: true }),
      makeRecord({ documentedInPlan: true }),
      makeRecord({ documentedInPlan: false }),
    ];
    const result = evaluateEducationCompliance(records);
    expect(result.documentedRate).toBe(67);
  });

  it("calculates virtualSchoolRate correctly", () => {
    const records = [
      makeRecord({ virtualSchoolLinked: true }),
      makeRecord({ virtualSchoolLinked: false }),
      makeRecord({ virtualSchoolLinked: false }),
    ];
    const result = evaluateEducationCompliance(records);
    expect(result.virtualSchoolRate).toBe(33);
  });

  it("calculates areaDiversity correctly", () => {
    const records = [
      makeRecord({ educationArea: "attendance" }),
      makeRecord({ educationArea: "academic_progress" }),
      makeRecord({ educationArea: "pep_review" }),
      makeRecord({ educationArea: "homework_support" }),
    ];
    const result = evaluateEducationCompliance(records);
    // 4 unique areas / 8 = 0.5
    expect(result.areaDiversity).toBe(0.5);
  });

  it("areaDiversity is 1 when all 8 areas covered", () => {
    const areas = [
      "attendance", "academic_progress", "pep_review", "homework_support",
      "extra_curricular", "sen_support", "careers_guidance", "school_liaison",
    ] as const;
    const records = areas.map((a) => makeRecord({ educationArea: a }));
    const result = evaluateEducationCompliance(records);
    expect(result.areaDiversity).toBe(1);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateEducationCompliance(OAK_HOUSE_RECORDS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo covers all 8 education areas", () => {
    const result = evaluateEducationCompliance(OAK_HOUSE_RECORDS);
    expect(result.areaDiversity).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateEducationPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEducationPolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluateEducationPolicy(null);
    expect(result.score).toBe(0);
  });

  it("returns all false for null policy", () => {
    const result = evaluateEducationPolicy(null);
    expect(result.educationChampionRole).toBe(false);
    expect(result.pepReviewSchedule).toBe(false);
    expect(result.attendanceMonitoring).toBe(false);
    expect(result.homeworkSupportPlan).toBe(false);
    expect(result.senCoordination).toBe(false);
    expect(result.virtualSchoolPartnership).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns max score 25 for full policy", () => {
    const result = evaluateEducationPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("awards 4 for educationChampionRole", () => {
    const result = evaluateEducationPolicy(makePolicy({
      educationChampionRole: true,
      pepReviewSchedule: false, attendanceMonitoring: false,
      homeworkSupportPlan: false, senCoordination: false,
      virtualSchoolPartnership: false, regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("awards 4 for pepReviewSchedule", () => {
    const result = evaluateEducationPolicy(makePolicy({
      educationChampionRole: false,
      pepReviewSchedule: true, attendanceMonitoring: false,
      homeworkSupportPlan: false, senCoordination: false,
      virtualSchoolPartnership: false, regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("awards 4 for attendanceMonitoring", () => {
    const result = evaluateEducationPolicy(makePolicy({
      educationChampionRole: false, pepReviewSchedule: false,
      attendanceMonitoring: true,
      homeworkSupportPlan: false, senCoordination: false,
      virtualSchoolPartnership: false, regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("awards 4 for homeworkSupportPlan", () => {
    const result = evaluateEducationPolicy(makePolicy({
      educationChampionRole: false, pepReviewSchedule: false,
      attendanceMonitoring: false,
      homeworkSupportPlan: true, senCoordination: false,
      virtualSchoolPartnership: false, regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("awards 3 for senCoordination", () => {
    const result = evaluateEducationPolicy(makePolicy({
      educationChampionRole: false, pepReviewSchedule: false,
      attendanceMonitoring: false, homeworkSupportPlan: false,
      senCoordination: true,
      virtualSchoolPartnership: false, regularReview: false,
    }));
    expect(result.score).toBe(3);
  });

  it("awards 3 for virtualSchoolPartnership", () => {
    const result = evaluateEducationPolicy(makePolicy({
      educationChampionRole: false, pepReviewSchedule: false,
      attendanceMonitoring: false, homeworkSupportPlan: false,
      senCoordination: false,
      virtualSchoolPartnership: true, regularReview: false,
    }));
    expect(result.score).toBe(3);
  });

  it("awards 3 for regularReview", () => {
    const result = evaluateEducationPolicy(makePolicy({
      educationChampionRole: false, pepReviewSchedule: false,
      attendanceMonitoring: false, homeworkSupportPlan: false,
      senCoordination: false, virtualSchoolPartnership: false,
      regularReview: true,
    }));
    expect(result.score).toBe(3);
  });

  it("sums weights correctly: 4+4+4+4+3+3+3 = 25", () => {
    const result = evaluateEducationPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateEducationPolicy(OAK_HOUSE_POLICY);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("reflects boolean values from policy", () => {
    const policy = makePolicy({ educationChampionRole: false, regularReview: false });
    const result = evaluateEducationPolicy(policy);
    expect(result.educationChampionRole).toBe(false);
    expect(result.regularReview).toBe(false);
    expect(result.pepReviewSchedule).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateStaffEducationReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffEducationReadiness", () => {
  it("returns score 0 for empty training (PRESENCE pattern)", () => {
    const result = evaluateStaffEducationReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns 0 rates for empty training", () => {
    const result = evaluateStaffEducationReadiness([]);
    expect(result.educationSupportRate).toBe(0);
    expect(result.pepProcessRate).toBe(0);
    expect(result.attendanceImportanceRate).toBe(0);
    expect(result.senAwarenessRate).toBe(0);
    expect(result.homeworkStrategiesRate).toBe(0);
    expect(result.virtualSchoolProtocolRate).toBe(0);
  });

  it("calculates educationSupportRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", educationSupport: true }),
      makeTraining({ staffId: "s2", educationSupport: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.educationSupportRate).toBe(50);
  });

  it("calculates pepProcessRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", pepProcess: true }),
      makeTraining({ staffId: "s2", pepProcess: true }),
      makeTraining({ staffId: "s3", pepProcess: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.pepProcessRate).toBe(67);
  });

  it("calculates attendanceImportanceRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", attendanceImportance: true }),
      makeTraining({ staffId: "s2", attendanceImportance: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.attendanceImportanceRate).toBe(50);
  });

  it("calculates senAwarenessRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", senAwareness: true }),
      makeTraining({ staffId: "s2", senAwareness: true }),
      makeTraining({ staffId: "s3", senAwareness: false }),
      makeTraining({ staffId: "s4", senAwareness: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.senAwarenessRate).toBe(50);
  });

  it("calculates homeworkStrategiesRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", homeworkStrategies: true }),
      makeTraining({ staffId: "s2", homeworkStrategies: false }),
      makeTraining({ staffId: "s3", homeworkStrategies: false }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.homeworkStrategiesRate).toBe(33);
  });

  it("calculates virtualSchoolProtocolRate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", virtualSchoolProtocol: true }),
      makeTraining({ staffId: "s2", virtualSchoolProtocol: true }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.virtualSchoolProtocolRate).toBe(100);
  });

  it("achieves max score 25 for fully trained staff", () => {
    const training = [
      makeTraining({
        staffId: "s1", educationSupport: true, pepProcess: true,
        attendanceImportance: true, senAwareness: true,
        homeworkStrategies: true, virtualSchoolProtocol: true,
      }),
    ];
    const result = evaluateStaffEducationReadiness(training);
    expect(result.score).toBe(25);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 4 staff", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.totalStaff).toBe(4);
  });

  it("Chamberlain House demo has 100% educationSupport", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.educationSupportRate).toBe(100);
  });

  it("Chamberlain House demo has 100% pepProcess", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.pepProcessRate).toBe(100);
  });

  it("Chamberlain House demo has 100% attendanceImportance", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.attendanceImportanceRate).toBe(100);
  });

  it("Chamberlain House demo has 75% senAwareness (3 of 4)", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.senAwarenessRate).toBe(75);
  });

  it("Chamberlain House demo has 75% homeworkStrategies (3 of 4)", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.homeworkStrategiesRate).toBe(75);
  });

  it("Chamberlain House demo has 75% virtualSchoolProtocol (3 of 4)", () => {
    const result = evaluateStaffEducationReadiness(OAK_HOUSE_TRAINING);
    expect(result.virtualSchoolProtocolRate).toBe(75);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildEducationProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildEducationProfiles", () => {
  it("returns empty array for empty records", () => {
    const result = buildChildEducationProfiles([]);
    expect(result).toHaveLength(0);
  });

  it("creates one profile per child", () => {
    const result = buildChildEducationProfiles(OAK_HOUSE_RECORDS);
    expect(result).toHaveLength(3);
  });

  it("groups records correctly per child", () => {
    const result = buildChildEducationProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.totalRecords).toBe(3);
  });

  it("calculates progressRate per child correctly", () => {
    const result = buildChildEducationProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    // Alex: 3 records, all exceeding/expected = 100%
    expect(alex!.progressRate).toBe(100);
  });

  it("calculates pepUpdatedRate per child correctly", () => {
    const result = buildChildEducationProfiles(OAK_HOUSE_RECORDS);
    const jordan = result.find((p) => p.childId === "child-jordan");
    // Jordan: 3 records, 2 pepUpdated = 67%
    expect(jordan!.pepUpdatedRate).toBe(67);
  });

  it("counts unique areas per child correctly", () => {
    const result = buildChildEducationProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    // Alex: attendance, academic_progress, pep_review = 3 unique
    expect(alex!.uniqueAreas).toBe(3);
  });

  it("frequency score: 0 for < 5 records", () => {
    const records = [makeRecord({ childId: "c1", childName: "C1" })];
    const result = buildChildEducationProfiles(records);
    // 1 record: freq=0, progress=1(100>=80->3), pep=1(100>=80->3), diversity=0(1 area < 2)
    // Total: 0+3+3+0 = 6
    expect(result[0].overallScore).toBe(6);
  });

  it("frequency score: 1 for >= 5 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ childId: "c1", childName: "C1", educationArea: "attendance" }),
    );
    const result = buildChildEducationProfiles(records);
    // freq=1, progress=3 (100%), pep=3 (100%), diversity=0 (1 area)
    expect(result[0].overallScore).toBe(7);
  });

  it("frequency score: 2 for >= 10 records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ childId: "c1", childName: "C1", educationArea: "attendance" }),
    );
    const result = buildChildEducationProfiles(records);
    // freq=2, progress=3 (100%), pep=3 (100%), diversity=0 (1 area)
    expect(result[0].overallScore).toBe(8);
  });

  it("diversity score: 1 for >= 2 areas", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "C1", educationArea: "attendance" }),
      makeRecord({ childId: "c1", childName: "C1", educationArea: "pep_review" }),
    ];
    const result = buildChildEducationProfiles(records);
    // freq=0, progress=3 (100%), pep=3 (100%), diversity=1
    expect(result[0].overallScore).toBe(7);
  });

  it("diversity score: 2 for >= 4 areas", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "C1", educationArea: "attendance" }),
      makeRecord({ childId: "c1", childName: "C1", educationArea: "pep_review" }),
      makeRecord({ childId: "c1", childName: "C1", educationArea: "homework_support" }),
      makeRecord({ childId: "c1", childName: "C1", educationArea: "sen_support" }),
    ];
    const result = buildChildEducationProfiles(records);
    // freq=0, progress=3 (100%), pep=3 (100%), diversity=2
    expect(result[0].overallScore).toBe(8);
  });

  it("progress score: 0 when all below", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "C1", progressLevel: "below" }),
      makeRecord({ childId: "c1", childName: "C1", progressLevel: "significantly_below" }),
    ];
    const result = buildChildEducationProfiles(records);
    // freq=0, progress=0, pep=3 (100%), diversity=0 (all academic_progress)
    expect(result[0].progressRate).toBe(0);
  });

  it("overallScore is clamped between 0 and 10", () => {
    const result = buildChildEducationProfiles(OAK_HOUSE_RECORDS);
    for (const profile of result) {
      expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      expect(profile.overallScore).toBeLessThanOrEqual(10);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateEducationAttainmentProgressIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateEducationAttainmentProgressIntelligence", () => {
  it("produces overall score 0-100", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces a valid rating", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all 4 evaluator results", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.educationQuality).toBeDefined();
    expect(result.educationCompliance).toBeDefined();
    expect(result.educationPolicy).toBeDefined();
    expect(result.staffEducationReadiness).toBeDefined();
  });

  it("overall score equals sum of 4 evaluator scores (capped)", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    const expectedSum = Math.round(
      result.educationQuality.score +
      result.educationCompliance.score +
      result.educationPolicy.score +
      result.staffEducationReadiness.score,
    );
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, expectedSum)));
  });

  it("includes child profiles", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.childProfiles.length).toBeGreaterThan(0);
  });

  it("includes 7 regulatory links", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Regulation 8 in regulatory links", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 8"))).toBe(true);
  });

  it("includes CHR 2015 Regulation 9 in regulatory links", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 9"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes NMS 8 in regulatory links", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 8"))).toBe(true);
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("includes Children and Families Act 2014 in regulatory links", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children and Families Act 2014"))).toBe(true);
  });

  it("includes Virtual School Head guidance in regulatory links", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Virtual School Head"))).toBe(true);
  });

  it("sets homeId correctly", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
  });

  it("sets period dates correctly", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("filters records by period", () => {
    const records = [
      makeRecord({ recordDate: "2026-03-15" }),
      makeRecord({ recordDate: "2025-12-01" }), // outside period
    ];
    const result = generateEducationAttainmentProgressIntelligence(
      records, null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.educationQuality.totalRecords).toBe(1);
  });

  it("includes assessedAt timestamp", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.assessedAt).toBeDefined();
    expect(result.assessedAt.length).toBeGreaterThan(0);
  });

  // Strengths
  it("generates strength for high progressRate", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ recordDate: "2026-03-01", progressLevel: "exceeding" }),
    );
    const result = generateEducationAttainmentProgressIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("Strong educational progress"))).toBe(true);
  });

  it("generates strength for high pepUpdatedRate", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ recordDate: "2026-03-01", pepUpdated: true }),
    );
    const result = generateEducationAttainmentProgressIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("PEP reviews consistently up to date"))).toBe(true);
  });

  it("generates strength for high attendanceRate", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ recordDate: "2026-03-01", schoolAttendanceGood: true }),
    );
    const result = generateEducationAttainmentProgressIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("Good school attendance rates"))).toBe(true);
  });

  it("generates strength for high documentedRate", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ recordDate: "2026-03-01", documentedInPlan: true }),
    );
    const result = generateEducationAttainmentProgressIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("Excellent education documentation"))).toBe(true);
  });

  // Actions
  it("generates action for empty records", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("No education records found"))).toBe(true);
  });

  it("generates URGENT action for null policy", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [makeRecord({ recordDate: "2026-03-01" })], null, [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action for empty training", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [makeRecord({ recordDate: "2026-03-01" })], makePolicy(), [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("generates action for low virtualSchool links", () => {
    const records = [
      makeRecord({ recordDate: "2026-03-01", virtualSchoolLinked: false }),
      makeRecord({ recordDate: "2026-03-02", virtualSchoolLinked: false }),
      makeRecord({ recordDate: "2026-03-03", virtualSchoolLinked: true }),
    ];
    const result = generateEducationAttainmentProgressIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("virtual school links"))).toBe(true);
  });

  it("generates action for low childViews", () => {
    const records = [
      makeRecord({ recordDate: "2026-03-01", childViewsCaptured: false }),
      makeRecord({ recordDate: "2026-03-02", childViewsCaptured: false }),
      makeRecord({ recordDate: "2026-03-03", childViewsCaptured: true }),
    ];
    const result = generateEducationAttainmentProgressIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("children's views"))).toBe(true);
  });

  it("generates no-action message when all is well", () => {
    const records = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ recordDate: "2026-03-01" }),
    );
    const result = generateEducationAttainmentProgressIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  // Rating thresholds
  it("rating is outstanding for score >= 80", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ recordDate: "2026-03-01" }),
    );
    const result = generateEducationAttainmentProgressIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rating is inadequate for score < 40", () => {
    const result = generateEducationAttainmentProgressIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Label utilities
// ══════════════════════════════════════════════════════════════════════════════

describe("getEducationAreaLabel", () => {
  it("returns Attendance for attendance", () => {
    expect(getEducationAreaLabel("attendance")).toBe("Attendance");
  });
  it("returns Academic Progress for academic_progress", () => {
    expect(getEducationAreaLabel("academic_progress")).toBe("Academic Progress");
  });
  it("returns PEP Review for pep_review", () => {
    expect(getEducationAreaLabel("pep_review")).toBe("PEP Review");
  });
  it("returns Homework Support for homework_support", () => {
    expect(getEducationAreaLabel("homework_support")).toBe("Homework Support");
  });
  it("returns Extra-Curricular for extra_curricular", () => {
    expect(getEducationAreaLabel("extra_curricular")).toBe("Extra-Curricular");
  });
  it("returns SEN Support for sen_support", () => {
    expect(getEducationAreaLabel("sen_support")).toBe("SEN Support");
  });
  it("returns Careers Guidance for careers_guidance", () => {
    expect(getEducationAreaLabel("careers_guidance")).toBe("Careers Guidance");
  });
  it("returns School Liaison for school_liaison", () => {
    expect(getEducationAreaLabel("school_liaison")).toBe("School Liaison");
  });
});

describe("getProgressLevelLabel", () => {
  it("returns Exceeding for exceeding", () => {
    expect(getProgressLevelLabel("exceeding")).toBe("Exceeding");
  });
  it("returns Expected for expected", () => {
    expect(getProgressLevelLabel("expected")).toBe("Expected");
  });
  it("returns Developing for developing", () => {
    expect(getProgressLevelLabel("developing")).toBe("Developing");
  });
  it("returns Below for below", () => {
    expect(getProgressLevelLabel("below")).toBe("Below");
  });
  it("returns Significantly Below for significantly_below", () => {
    expect(getProgressLevelLabel("significantly_below")).toBe("Significantly Below");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns Good for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns Requires Improvement for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns Inadequate for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. pct() helper edge cases (tested indirectly)
// ══════════════════════════════════════════════════════════════════════════════

describe("pct helper edge cases (via evaluators)", () => {
  it("handles zero denominator in educationQuality", () => {
    const result = evaluateEducationQuality([]);
    expect(result.progressRate).toBe(0);
    expect(result.pepUpdatedRate).toBe(0);
    expect(result.attendanceRate).toBe(0);
    expect(result.childViewsRate).toBe(0);
  });

  it("handles zero denominator in educationCompliance", () => {
    const result = evaluateEducationCompliance([]);
    expect(result.staffAdvocacyRate).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.virtualSchoolRate).toBe(0);
  });

  it("handles zero denominator in staffEducationReadiness", () => {
    const result = evaluateStaffEducationReadiness([]);
    expect(result.educationSupportRate).toBe(0);
    expect(result.pepProcessRate).toBe(0);
  });

  it("rounds percentages correctly", () => {
    const records = [
      makeRecord({ staffAdvocacyProvided: true }),
      makeRecord({ staffAdvocacyProvided: true }),
      makeRecord({ staffAdvocacyProvided: false }),
    ];
    const result = evaluateEducationCompliance(records);
    // 2/3 = 66.66... rounds to 67
    expect(result.staffAdvocacyRate).toBe(67);
  });
});
