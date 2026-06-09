// ══════════════════════════════════════════════════════════════════════════════
// TESTS -- Missing From Care Intelligence Engine (4-Evaluator Pattern)
//
// Demo: Chamberlain House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateQuality,
  evaluateCompliance,
  evaluatePolicy,
  evaluateStaffReadiness,
  buildChildProfiles,
  generateMissingFromCareIntelligence,
  getRating,
  getRatingLabel,
  getMissingFromCareCategoryLabel,
  getMissingFromCareOutcomeLabel,
  pct,
} from "../missing-from-care-engine";
import type {
  MissingFromCareRecord,
  MissingFromCarePolicy,
  StaffMissingFromCareTraining,
} from "../missing-from-care-engine";

// -- Test Fixtures: Chamberlain House Demo Data ----------------------------------------

const makeRecord = (overrides: Partial<MissingFromCareRecord> = {}): MissingFromCareRecord => ({
  id: "mfc-001",
  homeId: "home-oak",
  date: "2026-05-05",
  childId: "child-alex",
  childName: "Alex",
  category: "missing_episode",
  outcome: "resolved_safely",
  policeNotifiedTimely: true,
  returnInterviewCompleted: true,
  riskAssessmentUpdated: true,
  preventionPlanReviewed: true,
  documentationComplete: true,
  timelyRecording: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<MissingFromCarePolicy> = {}): MissingFromCarePolicy => ({
  missingPersonsPolicy: true,
  policeNotificationProcedure: true,
  returnInterviewFramework: true,
  riskAssessmentPolicy: true,
  preventionStrategyPolicy: true,
  debriefProcedure: true,
  patternAnalysisPolicy: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffMissingFromCareTraining> = {}): StaffMissingFromCareTraining => ({
  staffId: "staff-sarah",
  missingPersonsResponse: true,
  returnInterviewConduct: true,
  riskAssessmentSkills: true,
  policeNotificationProcess: true,
  patternRecognition: true,
  preventionPlanning: true,
  ...overrides,
});

// Chamberlain House demo data: 12 records across Alex/Jordan/Morgan, all 8 categories
const OAK_HOUSE_RECORDS: MissingFromCareRecord[] = [
  makeRecord({ id: "mfc-001", childId: "child-alex", childName: "Alex", date: "2026-02-10", category: "missing_episode", outcome: "resolved_safely" }),
  makeRecord({ id: "mfc-002", childId: "child-alex", childName: "Alex", date: "2026-03-15", category: "return_interview", outcome: "resolved_safely" }),
  makeRecord({ id: "mfc-003", childId: "child-alex", childName: "Alex", date: "2026-04-02", category: "risk_assessment", outcome: "resolved_with_concern" }),
  makeRecord({ id: "mfc-004", childId: "child-alex", childName: "Alex", date: "2026-05-01", category: "prevention_plan", outcome: "ongoing_monitoring" }),
  makeRecord({ id: "mfc-005", childId: "child-jordan", childName: "Jordan", date: "2026-02-20", category: "absent_episode", outcome: "resolved_safely" }),
  makeRecord({ id: "mfc-006", childId: "child-jordan", childName: "Jordan", date: "2026-03-18", category: "police_notification", outcome: "resolved_safely" }),
  makeRecord({ id: "mfc-007", childId: "child-jordan", childName: "Jordan", date: "2026-04-10", category: "pattern_analysis", outcome: "ongoing_monitoring" }),
  makeRecord({ id: "mfc-008", childId: "child-jordan", childName: "Jordan", date: "2026-05-05", category: "debrief_session", outcome: "resolved_safely" }),
  makeRecord({ id: "mfc-009", childId: "child-morgan", childName: "Morgan", date: "2026-03-22", category: "missing_episode", outcome: "escalated" }),
  makeRecord({ id: "mfc-010", childId: "child-morgan", childName: "Morgan", date: "2026-04-15", category: "return_interview", outcome: "resolved_safely" }),
  makeRecord({ id: "mfc-011", childId: "child-morgan", childName: "Morgan", date: "2026-05-02", category: "risk_assessment", outcome: "resolved_with_concern" }),
  makeRecord({ id: "mfc-012", childId: "child-morgan", childName: "Morgan", date: "2026-05-14", category: "prevention_plan", outcome: "not_applicable" }),
];

const OAK_HOUSE_POLICY: MissingFromCarePolicy = makePolicy();

const OAK_HOUSE_TRAINING: StaffMissingFromCareTraining[] = [
  makeTraining({ staffId: "staff-sarah" }),
  makeTraining({ staffId: "staff-tom" }),
  makeTraining({ staffId: "staff-lisa" }),
  makeTraining({ staffId: "staff-darren" }),
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct helper", () => {
  it("returns 0 for zero denominator", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 for zero numerator and zero denominator", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("rounds correctly for 1/3", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("rounds correctly for 2/3", () => {
    expect(pct(2, 3)).toBe(67);
  });

  it("returns 0 for zero numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 200 for 2x numerator", () => {
    expect(pct(20, 10)).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
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
// 3. Label utilities
// ══════════════════════════════════════════════════════════════════════════════

describe("getMissingFromCareCategoryLabel", () => {
  it("returns Missing Episode for missing_episode", () => {
    expect(getMissingFromCareCategoryLabel("missing_episode")).toBe("Missing Episode");
  });
  it("returns Absent Episode for absent_episode", () => {
    expect(getMissingFromCareCategoryLabel("absent_episode")).toBe("Absent Episode");
  });
  it("returns Return Interview for return_interview", () => {
    expect(getMissingFromCareCategoryLabel("return_interview")).toBe("Return Interview");
  });
  it("returns Risk Assessment for risk_assessment", () => {
    expect(getMissingFromCareCategoryLabel("risk_assessment")).toBe("Risk Assessment");
  });
  it("returns Police Notification for police_notification", () => {
    expect(getMissingFromCareCategoryLabel("police_notification")).toBe("Police Notification");
  });
  it("returns Pattern Analysis for pattern_analysis", () => {
    expect(getMissingFromCareCategoryLabel("pattern_analysis")).toBe("Pattern Analysis");
  });
  it("returns Prevention Plan for prevention_plan", () => {
    expect(getMissingFromCareCategoryLabel("prevention_plan")).toBe("Prevention Plan");
  });
  it("returns Debrief Session for debrief_session", () => {
    expect(getMissingFromCareCategoryLabel("debrief_session")).toBe("Debrief Session");
  });
});

describe("getMissingFromCareOutcomeLabel", () => {
  it("returns Resolved Safely for resolved_safely", () => {
    expect(getMissingFromCareOutcomeLabel("resolved_safely")).toBe("Resolved Safely");
  });
  it("returns Resolved with Concern for resolved_with_concern", () => {
    expect(getMissingFromCareOutcomeLabel("resolved_with_concern")).toBe("Resolved with Concern");
  });
  it("returns Ongoing Monitoring for ongoing_monitoring", () => {
    expect(getMissingFromCareOutcomeLabel("ongoing_monitoring")).toBe("Ongoing Monitoring");
  });
  it("returns Escalated for escalated", () => {
    expect(getMissingFromCareOutcomeLabel("escalated")).toBe("Escalated");
  });
  it("returns Not Applicable for not_applicable", () => {
    expect(getMissingFromCareOutcomeLabel("not_applicable")).toBe("Not Applicable");
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
// 4. evaluateQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateQuality", () => {
  it("returns score 0 for empty records", () => {
    const result = evaluateQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it("returns zero rates for empty records", () => {
    const result = evaluateQuality([]);
    expect(result.policeNotifiedTimelyRate).toBe(0);
    expect(result.returnInterviewCompletedRate).toBe(0);
    expect(result.riskAssessmentUpdatedRate).toBe(0);
    expect(result.preventionPlanReviewedRate).toBe(0);
  });

  it("calculates policeNotifiedTimely rate correctly", () => {
    const records = [
      makeRecord({ id: "1", policeNotifiedTimely: true }),
      makeRecord({ id: "2", policeNotifiedTimely: false }),
      makeRecord({ id: "3", policeNotifiedTimely: true }),
    ];
    const result = evaluateQuality(records);
    expect(result.policeNotifiedTimelyRate).toBe(67);
  });

  it("calculates returnInterviewCompleted rate correctly", () => {
    const records = [
      makeRecord({ id: "1", returnInterviewCompleted: true }),
      makeRecord({ id: "2", returnInterviewCompleted: false }),
    ];
    const result = evaluateQuality(records);
    expect(result.returnInterviewCompletedRate).toBe(50);
  });

  it("calculates riskAssessmentUpdated rate correctly", () => {
    const records = [
      makeRecord({ id: "1", riskAssessmentUpdated: true }),
      makeRecord({ id: "2", riskAssessmentUpdated: false }),
      makeRecord({ id: "3", riskAssessmentUpdated: true }),
    ];
    const result = evaluateQuality(records);
    expect(result.riskAssessmentUpdatedRate).toBe(67);
  });

  it("calculates preventionPlanReviewed rate correctly", () => {
    const records = [
      makeRecord({ id: "1", preventionPlanReviewed: true }),
      makeRecord({ id: "2", preventionPlanReviewed: false }),
    ];
    const result = evaluateQuality(records);
    expect(result.preventionPlanReviewedRate).toBe(50);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateQuality(OAK_HOUSE_RECORDS);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 12 total records", () => {
    const result = evaluateQuality(OAK_HOUSE_RECORDS);
    expect(result.totalRecords).toBe(12);
  });

  it("Chamberlain House demo has 100% police notification rate", () => {
    const result = evaluateQuality(OAK_HOUSE_RECORDS);
    expect(result.policeNotifiedTimelyRate).toBe(100);
  });

  it("Chamberlain House demo quality score is 25", () => {
    const result = evaluateQuality(OAK_HOUSE_RECORDS);
    expect(result.overallScore).toBe(25);
  });

  it("all-false booleans yield score 0", () => {
    const records = [
      makeRecord({
        id: "1",
        policeNotifiedTimely: false,
        returnInterviewCompleted: false,
        riskAssessmentUpdated: false,
        preventionPlanReviewed: false,
      }),
    ];
    const result = evaluateQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("weighted score calculation: only policeNotifiedTimely true gives 7", () => {
    const records = [
      makeRecord({
        id: "1",
        policeNotifiedTimely: true,
        returnInterviewCompleted: false,
        riskAssessmentUpdated: false,
        preventionPlanReviewed: false,
      }),
    ];
    const result = evaluateQuality(records);
    expect(result.overallScore).toBe(7);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. evaluateCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateCompliance", () => {
  it("returns score 0 for empty records", () => {
    const result = evaluateCompliance([]);
    expect(result.overallScore).toBe(0);
  });

  it("returns zero rates for empty records", () => {
    const result = evaluateCompliance([]);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.returnInterviewCompletedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
  });

  it("calculates documentation rate correctly", () => {
    const records = [
      makeRecord({ id: "1", documentationComplete: true }),
      makeRecord({ id: "2", documentationComplete: false }),
      makeRecord({ id: "3", documentationComplete: true }),
    ];
    const result = evaluateCompliance(records);
    expect(result.documentationRate).toBe(67);
  });

  it("calculates timely recording rate correctly", () => {
    const records = [
      makeRecord({ id: "1", timelyRecording: true }),
      makeRecord({ id: "2", timelyRecording: false }),
    ];
    const result = evaluateCompliance(records);
    expect(result.timelyRecordingRate).toBe(50);
  });

  it("calculates return interview completed rate correctly", () => {
    const records = [
      makeRecord({ id: "1", returnInterviewCompleted: true }),
      makeRecord({ id: "2", returnInterviewCompleted: true }),
      makeRecord({ id: "3", returnInterviewCompleted: false }),
    ];
    const result = evaluateCompliance(records);
    expect(result.returnInterviewCompletedRate).toBe(67);
  });

  it("calculates category diversity ratio correctly", () => {
    const records = [
      makeRecord({ id: "1", category: "missing_episode" }),
      makeRecord({ id: "2", category: "return_interview" }),
      makeRecord({ id: "3", category: "missing_episode" }),
    ];
    const result = evaluateCompliance(records);
    // 2 unique out of 8 total categories = 25%
    expect(result.categoryDiversityRatio).toBe(25);
  });

  it("Chamberlain House demo has 100% documentation rate", () => {
    const result = evaluateCompliance(OAK_HOUSE_RECORDS);
    expect(result.documentationRate).toBe(100);
  });

  it("Chamberlain House demo has 100% timely recording rate", () => {
    const result = evaluateCompliance(OAK_HOUSE_RECORDS);
    expect(result.timelyRecordingRate).toBe(100);
  });

  it("Chamberlain House demo has 100% return interview rate", () => {
    const result = evaluateCompliance(OAK_HOUSE_RECORDS);
    expect(result.returnInterviewCompletedRate).toBe(100);
  });

  it("Chamberlain House demo has 100% category diversity (8/8 categories)", () => {
    const result = evaluateCompliance(OAK_HOUSE_RECORDS);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateCompliance(OAK_HOUSE_RECORDS);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo compliance score is 25", () => {
    const result = evaluateCompliance(OAK_HOUSE_RECORDS);
    expect(result.overallScore).toBe(25);
  });

  it("single record with all false gives low score", () => {
    const records = [
      makeRecord({
        id: "1",
        documentationComplete: false,
        timelyRecording: false,
        returnInterviewCompleted: false,
        category: "missing_episode",
      }),
    ];
    const result = evaluateCompliance(records);
    // Only diversity: 1/8 = 13% => 0.13*5 = 0.65 => rounds to 0.7
    expect(result.overallScore).toBeLessThanOrEqual(5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. evaluatePolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluatePolicy(null);
    expect(result.overallScore).toBe(0);
  });

  it("returns all false booleans for null policy", () => {
    const result = evaluatePolicy(null);
    expect(result.missingPersonsPolicy).toBe(false);
    expect(result.policeNotificationProcedure).toBe(false);
    expect(result.returnInterviewFramework).toBe(false);
    expect(result.riskAssessmentPolicy).toBe(false);
    expect(result.preventionStrategyPolicy).toBe(false);
    expect(result.debriefProcedure).toBe(false);
    expect(result.patternAnalysisPolicy).toBe(false);
  });

  it("scores full 25 for all-true policy", () => {
    const result = evaluatePolicy(OAK_HOUSE_POLICY);
    expect(result.overallScore).toBe(25);
  });

  it("mirrors policy booleans correctly", () => {
    const result = evaluatePolicy(OAK_HOUSE_POLICY);
    expect(result.missingPersonsPolicy).toBe(true);
    expect(result.policeNotificationProcedure).toBe(true);
    expect(result.returnInterviewFramework).toBe(true);
    expect(result.riskAssessmentPolicy).toBe(true);
    expect(result.preventionStrategyPolicy).toBe(true);
    expect(result.debriefProcedure).toBe(true);
    expect(result.patternAnalysisPolicy).toBe(true);
  });

  it("missingPersonsPolicy contributes 4 points", () => {
    const result = evaluatePolicy(makePolicy({ missingPersonsPolicy: false }));
    expect(result.overallScore).toBe(21);
  });

  it("policeNotificationProcedure contributes 4 points", () => {
    const result = evaluatePolicy(makePolicy({ policeNotificationProcedure: false }));
    expect(result.overallScore).toBe(21);
  });

  it("returnInterviewFramework contributes 4 points", () => {
    const result = evaluatePolicy(makePolicy({ returnInterviewFramework: false }));
    expect(result.overallScore).toBe(21);
  });

  it("riskAssessmentPolicy contributes 4 points", () => {
    const result = evaluatePolicy(makePolicy({ riskAssessmentPolicy: false }));
    expect(result.overallScore).toBe(21);
  });

  it("preventionStrategyPolicy contributes 3 points", () => {
    const result = evaluatePolicy(makePolicy({ preventionStrategyPolicy: false }));
    expect(result.overallScore).toBe(22);
  });

  it("debriefProcedure contributes 3 points", () => {
    const result = evaluatePolicy(makePolicy({ debriefProcedure: false }));
    expect(result.overallScore).toBe(22);
  });

  it("patternAnalysisPolicy contributes 3 points", () => {
    const result = evaluatePolicy(makePolicy({ patternAnalysisPolicy: false }));
    expect(result.overallScore).toBe(22);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluatePolicy(OAK_HOUSE_POLICY);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("all-false policy scores 0", () => {
    const result = evaluatePolicy(makePolicy({
      missingPersonsPolicy: false,
      policeNotificationProcedure: false,
      returnInterviewFramework: false,
      riskAssessmentPolicy: false,
      preventionStrategyPolicy: false,
      debriefProcedure: false,
      patternAnalysisPolicy: false,
    }));
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. evaluateStaffReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffReadiness", () => {
  it("returns score 0 for empty training", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.overallScore).toBe(0);
  });

  it("returns zero rates for empty training", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.missingPersonsResponseRate).toBe(0);
    expect(result.returnInterviewConductRate).toBe(0);
    expect(result.riskAssessmentSkillsRate).toBe(0);
    expect(result.policeNotificationProcessRate).toBe(0);
    expect(result.patternRecognitionRate).toBe(0);
    expect(result.preventionPlanningRate).toBe(0);
  });

  it("calculates missingPersonsResponse rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", missingPersonsResponse: true }),
      makeTraining({ staffId: "s2", missingPersonsResponse: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.missingPersonsResponseRate).toBe(50);
  });

  it("calculates returnInterviewConduct rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", returnInterviewConduct: true }),
      makeTraining({ staffId: "s2", returnInterviewConduct: true }),
      makeTraining({ staffId: "s3", returnInterviewConduct: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.returnInterviewConductRate).toBe(67);
  });

  it("calculates riskAssessmentSkills rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", riskAssessmentSkills: true }),
      makeTraining({ staffId: "s2", riskAssessmentSkills: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.riskAssessmentSkillsRate).toBe(50);
  });

  it("calculates policeNotificationProcess rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", policeNotificationProcess: true }),
      makeTraining({ staffId: "s2", policeNotificationProcess: false }),
      makeTraining({ staffId: "s3", policeNotificationProcess: true }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.policeNotificationProcessRate).toBe(67);
  });

  it("calculates patternRecognition rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", patternRecognition: true }),
      makeTraining({ staffId: "s2", patternRecognition: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.patternRecognitionRate).toBe(50);
  });

  it("calculates preventionPlanning rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", preventionPlanning: true }),
      makeTraining({ staffId: "s2", preventionPlanning: true }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.preventionPlanningRate).toBe(100);
  });

  it("Chamberlain House demo has 100% across all training skills", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.missingPersonsResponseRate).toBe(100);
    expect(result.returnInterviewConductRate).toBe(100);
    expect(result.riskAssessmentSkillsRate).toBe(100);
    expect(result.policeNotificationProcessRate).toBe(100);
    expect(result.patternRecognitionRate).toBe(100);
    expect(result.preventionPlanningRate).toBe(100);
  });

  it("Chamberlain House demo staff readiness score is 25", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.overallScore).toBe(25);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("all-false skills score 0", () => {
    const training = [
      makeTraining({
        staffId: "s1",
        missingPersonsResponse: false,
        returnInterviewConduct: false,
        riskAssessmentSkills: false,
        policeNotificationProcess: false,
        patternRecognition: false,
        preventionPlanning: false,
      }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. buildChildProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildProfiles", () => {
  it("returns empty array for no records", () => {
    const result = buildChildProfiles([]);
    expect(result).toHaveLength(0);
  });

  it("creates profiles grouped by child", () => {
    const result = buildChildProfiles(OAK_HOUSE_RECORDS);
    expect(result).toHaveLength(3);
  });

  it("counts records per child correctly", () => {
    const result = buildChildProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.totalRecords).toBe(4);
    const jordan = result.find((p) => p.childId === "child-jordan");
    expect(jordan!.totalRecords).toBe(4);
    const morgan = result.find((p) => p.childId === "child-morgan");
    expect(morgan!.totalRecords).toBe(4);
  });

  it("calculates return interview rate per child", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", returnInterviewCompleted: true }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", returnInterviewCompleted: false }),
    ];
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.returnInterviewCompletedRate).toBe(50);
  });

  it("calculates risk assessment rate per child", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", riskAssessmentUpdated: true }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", riskAssessmentUpdated: false }),
      makeRecord({ id: "3", childId: "child-a", childName: "A", riskAssessmentUpdated: true }),
    ];
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.riskAssessmentUpdatedRate).toBe(67);
  });

  it("tracks categories covered per child", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", category: "missing_episode" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", category: "return_interview" }),
      makeRecord({ id: "3", childId: "child-a", childName: "A", category: "missing_episode" }),
    ];
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.categoriesCovered).toHaveLength(2);
    expect(childA!.categoriesCovered).toContain("missing_episode");
    expect(childA!.categoriesCovered).toContain("return_interview");
  });

  it("frequency score: >= 10 records gives 2 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-a",
        childName: "A",
        returnInterviewCompleted: false,
        riskAssessmentUpdated: false,
        category: "missing_episode",
      }),
    );
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=2, rate1=0, rate2=0, diversity=0 (only 1 category)
    expect(childA!.overallScore).toBe(2);
  });

  it("frequency score: >= 5 records gives 1 point", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-a",
        childName: "A",
        returnInterviewCompleted: false,
        riskAssessmentUpdated: false,
        category: "missing_episode",
      }),
    );
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=1, rate1=0, rate2=0, diversity=0
    expect(childA!.overallScore).toBe(1);
  });

  it("frequency score: < 5 records gives 0 points", () => {
    const records = [
      makeRecord({
        id: "1",
        childId: "child-a",
        childName: "A",
        returnInterviewCompleted: false,
        riskAssessmentUpdated: false,
        category: "missing_episode",
      }),
    ];
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, rate1=0, rate2=0, diversity=0
    expect(childA!.overallScore).toBe(0);
  });

  it("rate1 score: >= 80% gives 3 points", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-a",
        childName: "A",
        returnInterviewCompleted: true,
        riskAssessmentUpdated: false,
        category: "missing_episode",
      }),
    );
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=1, rate1=3 (100%), rate2=0, diversity=0
    expect(childA!.overallScore).toBe(4);
  });

  it("rate1 score: >= 60% gives 2 points", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", returnInterviewCompleted: true, riskAssessmentUpdated: false, category: "missing_episode" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", returnInterviewCompleted: true, riskAssessmentUpdated: false, category: "missing_episode" }),
      makeRecord({ id: "3", childId: "child-a", childName: "A", returnInterviewCompleted: false, riskAssessmentUpdated: false, category: "missing_episode" }),
    ];
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, rate1=2 (67%), rate2=0, diversity=0
    expect(childA!.overallScore).toBe(2);
  });

  it("rate1 score: >= 40% gives 1 point", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", returnInterviewCompleted: true, riskAssessmentUpdated: false, category: "missing_episode" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", returnInterviewCompleted: false, riskAssessmentUpdated: false, category: "missing_episode" }),
    ];
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, rate1=1 (50%), rate2=0, diversity=0
    expect(childA!.overallScore).toBe(1);
  });

  it("rate2 score: >= 80% gives 3 points", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-a",
        childName: "A",
        returnInterviewCompleted: false,
        riskAssessmentUpdated: true,
        category: "missing_episode",
      }),
    );
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=1, rate1=0, rate2=3 (100%), diversity=0
    expect(childA!.overallScore).toBe(4);
  });

  it("diversity score: >= 4 unique categories gives 2 points", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", returnInterviewCompleted: false, riskAssessmentUpdated: false, category: "missing_episode" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", returnInterviewCompleted: false, riskAssessmentUpdated: false, category: "return_interview" }),
      makeRecord({ id: "3", childId: "child-a", childName: "A", returnInterviewCompleted: false, riskAssessmentUpdated: false, category: "risk_assessment" }),
      makeRecord({ id: "4", childId: "child-a", childName: "A", returnInterviewCompleted: false, riskAssessmentUpdated: false, category: "police_notification" }),
    ];
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, rate1=0, rate2=0, diversity=2
    expect(childA!.overallScore).toBe(2);
  });

  it("diversity score: >= 2 unique categories gives 1 point", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", returnInterviewCompleted: false, riskAssessmentUpdated: false, category: "missing_episode" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", returnInterviewCompleted: false, riskAssessmentUpdated: false, category: "return_interview" }),
    ];
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, rate1=0, rate2=0, diversity=1
    expect(childA!.overallScore).toBe(1);
  });

  it("score is clamped to 0-10", () => {
    const result = buildChildProfiles(OAK_HOUSE_RECORDS);
    for (const profile of result) {
      expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      expect(profile.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("Chamberlain House Alex has 100% return interview rate", () => {
    const result = buildChildProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.returnInterviewCompletedRate).toBe(100);
  });

  it("Chamberlain House Alex has 100% risk assessment rate", () => {
    const result = buildChildProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.riskAssessmentUpdatedRate).toBe(100);
  });

  it("Chamberlain House Alex has 4 categories covered", () => {
    const result = buildChildProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.categoriesCovered).toHaveLength(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. generateMissingFromCareIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateMissingFromCareIntelligence", () => {
  it("produces overall score 0-100", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("flags 0% documentation / timely recording (worst case must not be hidden by a >0 guard)", () => {
    // Every episode undocumented + recorded late — the worst possible state. The
    // improvement areas must surface; previously a `rate > 0` guard suppressed 0%.
    const records = OAK_HOUSE_RECORDS.map((r) => ({ ...r, documentationComplete: false, timelyRecording: false }));
    const result = generateMissingFromCareIntelligence(
      records, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING, "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("documentation"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("recording"))).toBe(true);
  });

  it("produces a valid rating", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all 4 evaluator results", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.quality).toBeDefined();
    expect(result.compliance).toBeDefined();
    expect(result.policy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
  });

  it("overall score equals sum of 4 evaluator scores", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    const expectedSum = Math.round(
      result.quality.overallScore +
      result.compliance.overallScore +
      result.policy.overallScore +
      result.staffReadiness.overallScore,
    );
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, expectedSum)));
  });

  it("includes child profiles", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.childProfiles.length).toBeGreaterThan(0);
  });

  it("includes 3 child profiles for Chamberlain House demo", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.childProfiles).toHaveLength(3);
  });

  it("includes exactly 7 regulatory links", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("includes CHR 2015 Reg 34(1)(f) in regulatory links", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 34(1)(f)"))).toBe(true);
  });

  it("includes DfE Statutory Guidance in regulatory links", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("DfE Statutory Guidance"))).toBe(true);
  });

  it("includes CHR 2015 Reg 40 in regulatory links", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 40"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("includes Local protocol in regulatory links", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Local protocol"))).toBe(true);
  });

  it("includes Quality Standards 2015 in regulatory links", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Quality Standards 2015"))).toBe(true);
  });

  it("sets homeId correctly", () => {
    const result = generateMissingFromCareIntelligence(
      [], null, [], "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.homeId).toBe("home-oak");
  });

  it("sets period dates correctly", () => {
    const result = generateMissingFromCareIntelligence(
      [], null, [], "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
  });

  it("Chamberlain House demo is rated outstanding (100/100)", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("empty data produces inadequate rating", () => {
    const result = generateMissingFromCareIntelligence(
      [], null, [], "test", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("includes assessedAt", () => {
    const result = generateMissingFromCareIntelligence(
      [], null, [], "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.assessedAt).toBeDefined();
    expect(result.assessedAt.length).toBeGreaterThan(0);
  });

  it("generates strengths for outstanding data", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates areas for improvement for empty records", () => {
    const result = generateMissingFromCareIntelligence(
      [], null, [], "test", "2026-01-01", "2026-05-20",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("generates actions for missing policy", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, null, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates actions for missing training", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, [],
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("generates actions for no records", () => {
    const result = generateMissingFromCareIntelligence(
      [], OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("No missing from care records found"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Edge cases via evaluators
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases via evaluators", () => {
  it("handles zero denominator in quality evaluator", () => {
    const result = evaluateQuality([]);
    expect(result.policeNotifiedTimelyRate).toBe(0);
    expect(result.returnInterviewCompletedRate).toBe(0);
    expect(result.riskAssessmentUpdatedRate).toBe(0);
    expect(result.preventionPlanReviewedRate).toBe(0);
  });

  it("handles zero denominator in compliance evaluator", () => {
    const result = evaluateCompliance([]);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.returnInterviewCompletedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
  });

  it("handles zero denominator in staff readiness evaluator", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.missingPersonsResponseRate).toBe(0);
    expect(result.returnInterviewConductRate).toBe(0);
    expect(result.riskAssessmentSkillsRate).toBe(0);
    expect(result.policeNotificationProcessRate).toBe(0);
    expect(result.patternRecognitionRate).toBe(0);
    expect(result.preventionPlanningRate).toBe(0);
  });

  it("single record with all false booleans scores low in quality", () => {
    const records = [
      makeRecord({
        id: "1",
        policeNotifiedTimely: false,
        returnInterviewCompleted: false,
        riskAssessmentUpdated: false,
        preventionPlanReviewed: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    ];
    const qualityResult = evaluateQuality(records);
    expect(qualityResult.overallScore).toBe(0);
    const complianceResult = evaluateCompliance(records);
    // Only diversity: 1/8 = 13% => 0.13*5 = 0.65 => rounds to 0.7
    expect(complianceResult.overallScore).toBeLessThanOrEqual(5);
  });

  it("mixed record data calculates correctly", () => {
    const records = [
      makeRecord({ id: "1", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: true, preventionPlanReviewed: true }),
      makeRecord({ id: "2", policeNotifiedTimely: false, returnInterviewCompleted: false, riskAssessmentUpdated: false, preventionPlanReviewed: false }),
      makeRecord({ id: "3", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: false, preventionPlanReviewed: true }),
    ];
    const result = evaluateQuality(records);
    expect(result.policeNotifiedTimelyRate).toBe(67);
    expect(result.returnInterviewCompletedRate).toBe(67);
    expect(result.riskAssessmentUpdatedRate).toBe(33);
    expect(result.preventionPlanReviewedRate).toBe(67);
  });

  it("overall score cannot exceed 100 even with perfect data", () => {
    const result = generateMissingFromCareIntelligence(
      OAK_HOUSE_RECORDS, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING,
      "home-oak", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("child profile score cannot exceed 10", () => {
    // Perfect data: freq >= 10, rate1 100%, rate2 100%, diversity >= 4
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-a",
        childName: "A",
        returnInterviewCompleted: true,
        riskAssessmentUpdated: true,
        category: (["missing_episode", "absent_episode", "return_interview", "risk_assessment", "police_notification", "pattern_analysis", "prevention_plan", "debrief_session"][i % 8]) as any,
      }),
    );
    const result = buildChildProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.overallScore).toBeLessThanOrEqual(10);
    // freq=2 + rate1=3 + rate2=3 + diversity=2 = 10
    expect(childA!.overallScore).toBe(10);
  });
});
