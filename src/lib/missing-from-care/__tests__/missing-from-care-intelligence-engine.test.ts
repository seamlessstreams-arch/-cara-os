// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Missing-from-Care Intelligence Engine (4-Evaluator Pattern)
//
// Demo: Chamberlain House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateMissingFromCareIntelligenceQuality,
  evaluateMissingFromCareIntelligenceCompliance,
  evaluateMissingFromCareIntelligencePolicy,
  evaluateStaffMissingFromCareIntelligenceReadiness,
  buildChildMissingFromCareIntelligenceProfiles,
  generateMissingFromCareIntelligenceResult,
  getRatingIntel,
  getMissingFromCareIntelligenceRatingLabel,
  getMissingFromCareIntelligenceCategoryLabel,
  getMissingFromCareIntelligenceOutcomeLabel,
  pctIntel,
} from "../missing-from-care-intelligence-engine";
import type {
  MissingFromCareIntelligenceRecord,
  MissingFromCareIntelligencePolicy,
  StaffMissingFromCareIntelligenceTraining,
} from "../missing-from-care-intelligence-engine";

// -- Test Fixtures: Chamberlain House Demo Data ----------------------------------------

const makeRecord = (overrides: Partial<MissingFromCareIntelligenceRecord> = {}): MissingFromCareIntelligenceRecord => ({
  id: "mfci-001",
  homeId: "home-oak",
  date: "2025-05-05",
  childId: "child-alex",
  childName: "Alex",
  category: "missing_episode_response",
  outcome: "child_found_safe",
  immediateResponseFollowed: true,
  policeNotifiedAppropriately: true,
  returnInterviewCompleted: true,
  safetyPlanUpdated: true,
  documentationComplete: true,
  timelyRecording: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<MissingFromCareIntelligencePolicy> = {}): MissingFromCareIntelligencePolicy => ({
  missingChildrenPolicy: true,
  returnHomeInterviewPolicy: true,
  policeNotificationProtocol: true,
  riskAssessmentFramework: true,
  preventionStrategy: true,
  multiAgencyMissingProtocol: true,
  debriefAndLearningPolicy: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffMissingFromCareIntelligenceTraining> = {}): StaffMissingFromCareIntelligenceTraining => ({
  staffId: "staff-sarah",
  missingResponseProcedures: true,
  returnInterviewSkills: true,
  riskAssessmentSkills: true,
  policeNotificationKnowledge: true,
  preventionStrategies: true,
  deEscalationSkills: true,
  ...overrides,
});

// 12 records across Alex/Jordan/Morgan, all 8 categories
const OAK_HOUSE_RECORDS: MissingFromCareIntelligenceRecord[] = [
  makeRecord({ id: "mfci-001", childId: "child-alex", childName: "Alex", date: "2025-02-10", category: "missing_episode_response", outcome: "child_found_safe" }),
  makeRecord({ id: "mfci-002", childId: "child-alex", childName: "Alex", date: "2025-03-15", category: "return_home_interview", outcome: "child_returned_voluntarily" }),
  makeRecord({ id: "mfci-003", childId: "child-alex", childName: "Alex", date: "2025-04-02", category: "risk_assessment_review", outcome: "concerns_identified" }),
  makeRecord({ id: "mfci-004", childId: "child-alex", childName: "Alex", date: "2025-05-01", category: "safety_planning", outcome: "not_applicable" }),
  makeRecord({ id: "mfci-005", childId: "child-jordan", childName: "Jordan", date: "2025-02-20", category: "police_notification", outcome: "child_found_safe" }),
  makeRecord({ id: "mfci-006", childId: "child-jordan", childName: "Jordan", date: "2025-03-18", category: "multi_agency_response", outcome: "child_returned_voluntarily" }),
  makeRecord({ id: "mfci-007", childId: "child-jordan", childName: "Jordan", date: "2025-04-10", category: "missing_prevention", outcome: "ongoing_risk" }),
  makeRecord({ id: "mfci-008", childId: "child-jordan", childName: "Jordan", date: "2025-05-05", category: "pattern_analysis", outcome: "not_applicable" }),
  makeRecord({ id: "mfci-009", childId: "child-morgan", childName: "Morgan", date: "2025-03-22", category: "missing_episode_response", outcome: "concerns_identified" }),
  makeRecord({ id: "mfci-010", childId: "child-morgan", childName: "Morgan", date: "2025-04-15", category: "return_home_interview", outcome: "child_found_safe" }),
  makeRecord({ id: "mfci-011", childId: "child-morgan", childName: "Morgan", date: "2025-05-02", category: "risk_assessment_review", outcome: "ongoing_risk" }),
  makeRecord({ id: "mfci-012", childId: "child-morgan", childName: "Morgan", date: "2025-06-14", category: "safety_planning", outcome: "not_applicable" }),
];

const OAK_HOUSE_POLICY: MissingFromCareIntelligencePolicy = makePolicy();

const OAK_HOUSE_STAFF: StaffMissingFromCareIntelligenceTraining[] = [
  makeTraining({ staffId: "staff-sarah" }),
  makeTraining({ staffId: "staff-tom" }),
  makeTraining({ staffId: "staff-lisa" }),
  makeTraining({ staffId: "staff-darren" }),
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. pctIntel helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pctIntel helper", () => {
  it("returns 0 for zero denominator", () => {
    expect(pctIntel(5, 0)).toBe(0);
  });

  it("returns 0 for zero numerator and zero denominator", () => {
    expect(pctIntel(0, 0)).toBe(0);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pctIntel(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pctIntel(1, 2)).toBe(50);
  });

  it("rounds correctly for 1/3", () => {
    expect(pctIntel(1, 3)).toBe(33);
  });

  it("rounds correctly for 2/3", () => {
    expect(pctIntel(2, 3)).toBe(67);
  });

  it("returns 0 for zero numerator", () => {
    expect(pctIntel(0, 10)).toBe(0);
  });

  it("returns 200 for 2x numerator", () => {
    expect(pctIntel(20, 10)).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. getRatingIntel
// ══════════════════════════════════════════════════════════════════════════════

describe("getRatingIntel", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRatingIntel(80)).toBe("outstanding");
    expect(getRatingIntel(100)).toBe("outstanding");
    expect(getRatingIntel(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRatingIntel(60)).toBe("good");
    expect(getRatingIntel(79)).toBe("good");
    expect(getRatingIntel(70)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRatingIntel(40)).toBe("requires_improvement");
    expect(getRatingIntel(59)).toBe("requires_improvement");
    expect(getRatingIntel(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRatingIntel(0)).toBe("inadequate");
    expect(getRatingIntel(39)).toBe("inadequate");
    expect(getRatingIntel(20)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Label utilities
// ══════════════════════════════════════════════════════════════════════════════

describe("getMissingFromCareIntelligenceCategoryLabel", () => {
  it("returns Missing Episode Response for missing_episode_response", () => {
    expect(getMissingFromCareIntelligenceCategoryLabel("missing_episode_response")).toBe("Missing Episode Response");
  });
  it("returns Return Home Interview for return_home_interview", () => {
    expect(getMissingFromCareIntelligenceCategoryLabel("return_home_interview")).toBe("Return Home Interview");
  });
  it("returns Risk Assessment Review for risk_assessment_review", () => {
    expect(getMissingFromCareIntelligenceCategoryLabel("risk_assessment_review")).toBe("Risk Assessment Review");
  });
  it("returns Police Notification for police_notification", () => {
    expect(getMissingFromCareIntelligenceCategoryLabel("police_notification")).toBe("Police Notification");
  });
  it("returns Multi-Agency Response for multi_agency_response", () => {
    expect(getMissingFromCareIntelligenceCategoryLabel("multi_agency_response")).toBe("Multi-Agency Response");
  });
  it("returns Safety Planning for safety_planning", () => {
    expect(getMissingFromCareIntelligenceCategoryLabel("safety_planning")).toBe("Safety Planning");
  });
  it("returns Missing Prevention for missing_prevention", () => {
    expect(getMissingFromCareIntelligenceCategoryLabel("missing_prevention")).toBe("Missing Prevention");
  });
  it("returns Pattern Analysis for pattern_analysis", () => {
    expect(getMissingFromCareIntelligenceCategoryLabel("pattern_analysis")).toBe("Pattern Analysis");
  });
});

describe("getMissingFromCareIntelligenceOutcomeLabel", () => {
  it("returns Child Found Safe for child_found_safe", () => {
    expect(getMissingFromCareIntelligenceOutcomeLabel("child_found_safe")).toBe("Child Found Safe");
  });
  it("returns Child Returned Voluntarily for child_returned_voluntarily", () => {
    expect(getMissingFromCareIntelligenceOutcomeLabel("child_returned_voluntarily")).toBe("Child Returned Voluntarily");
  });
  it("returns Concerns Identified for concerns_identified", () => {
    expect(getMissingFromCareIntelligenceOutcomeLabel("concerns_identified")).toBe("Concerns Identified");
  });
  it("returns Ongoing Risk for ongoing_risk", () => {
    expect(getMissingFromCareIntelligenceOutcomeLabel("ongoing_risk")).toBe("Ongoing Risk");
  });
  it("returns Not Applicable for not_applicable", () => {
    expect(getMissingFromCareIntelligenceOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getMissingFromCareIntelligenceRatingLabel", () => {
  it("returns Outstanding for outstanding", () => {
    expect(getMissingFromCareIntelligenceRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns Good for good", () => {
    expect(getMissingFromCareIntelligenceRatingLabel("good")).toBe("Good");
  });
  it("returns Requires Improvement for requires_improvement", () => {
    expect(getMissingFromCareIntelligenceRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns Inadequate for inadequate", () => {
    expect(getMissingFromCareIntelligenceRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateMissingFromCareIntelligenceQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMissingFromCareIntelligenceQuality", () => {
  it("returns score 0 for empty records", () => {
    const result = evaluateMissingFromCareIntelligenceQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it("returns zero rates for empty records", () => {
    const result = evaluateMissingFromCareIntelligenceQuality([]);
    expect(result.immediateResponseFollowedRate).toBe(0);
    expect(result.policeNotifiedAppropriatelyRate).toBe(0);
    expect(result.returnInterviewCompletedRate).toBe(0);
    expect(result.safetyPlanUpdatedRate).toBe(0);
  });

  it("calculates immediateResponseFollowed rate correctly", () => {
    const records = [
      makeRecord({ id: "1", immediateResponseFollowed: true }),
      makeRecord({ id: "2", immediateResponseFollowed: false }),
      makeRecord({ id: "3", immediateResponseFollowed: true }),
    ];
    const result = evaluateMissingFromCareIntelligenceQuality(records);
    expect(result.immediateResponseFollowedRate).toBe(67);
  });

  it("calculates policeNotifiedAppropriately rate correctly", () => {
    const records = [
      makeRecord({ id: "1", policeNotifiedAppropriately: true }),
      makeRecord({ id: "2", policeNotifiedAppropriately: false }),
    ];
    const result = evaluateMissingFromCareIntelligenceQuality(records);
    expect(result.policeNotifiedAppropriatelyRate).toBe(50);
  });

  it("calculates returnInterviewCompleted rate correctly", () => {
    const records = [
      makeRecord({ id: "1", returnInterviewCompleted: true }),
      makeRecord({ id: "2", returnInterviewCompleted: false }),
      makeRecord({ id: "3", returnInterviewCompleted: true }),
    ];
    const result = evaluateMissingFromCareIntelligenceQuality(records);
    expect(result.returnInterviewCompletedRate).toBe(67);
  });

  it("calculates safetyPlanUpdated rate correctly", () => {
    const records = [
      makeRecord({ id: "1", safetyPlanUpdated: true }),
      makeRecord({ id: "2", safetyPlanUpdated: false }),
    ];
    const result = evaluateMissingFromCareIntelligenceQuality(records);
    expect(result.safetyPlanUpdatedRate).toBe(50);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateMissingFromCareIntelligenceQuality(OAK_HOUSE_RECORDS);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 12 total records", () => {
    const result = evaluateMissingFromCareIntelligenceQuality(OAK_HOUSE_RECORDS);
    expect(result.totalRecords).toBe(12);
  });

  it("Chamberlain House demo has 100% immediate response rate", () => {
    const result = evaluateMissingFromCareIntelligenceQuality(OAK_HOUSE_RECORDS);
    expect(result.immediateResponseFollowedRate).toBe(100);
  });

  it("Chamberlain House demo quality score is 25", () => {
    const result = evaluateMissingFromCareIntelligenceQuality(OAK_HOUSE_RECORDS);
    expect(result.overallScore).toBe(25);
  });

  it("all-false booleans yield score 0", () => {
    const records = [
      makeRecord({
        id: "1",
        immediateResponseFollowed: false,
        policeNotifiedAppropriately: false,
        returnInterviewCompleted: false,
        safetyPlanUpdated: false,
      }),
    ];
    const result = evaluateMissingFromCareIntelligenceQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("weighted score: only immediateResponseFollowed true gives 7", () => {
    const records = [
      makeRecord({
        id: "1",
        immediateResponseFollowed: true,
        policeNotifiedAppropriately: false,
        returnInterviewCompleted: false,
        safetyPlanUpdated: false,
      }),
    ];
    const result = evaluateMissingFromCareIntelligenceQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("weighted score: only policeNotifiedAppropriately true gives 6", () => {
    const records = [
      makeRecord({
        id: "1",
        immediateResponseFollowed: false,
        policeNotifiedAppropriately: true,
        returnInterviewCompleted: false,
        safetyPlanUpdated: false,
      }),
    ];
    const result = evaluateMissingFromCareIntelligenceQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("weighted score: only returnInterviewCompleted true gives 6", () => {
    const records = [
      makeRecord({
        id: "1",
        immediateResponseFollowed: false,
        policeNotifiedAppropriately: false,
        returnInterviewCompleted: true,
        safetyPlanUpdated: false,
      }),
    ];
    const result = evaluateMissingFromCareIntelligenceQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("weighted score: only safetyPlanUpdated true gives 6", () => {
    const records = [
      makeRecord({
        id: "1",
        immediateResponseFollowed: false,
        policeNotifiedAppropriately: false,
        returnInterviewCompleted: false,
        safetyPlanUpdated: true,
      }),
    ];
    const result = evaluateMissingFromCareIntelligenceQuality(records);
    expect(result.overallScore).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. evaluateMissingFromCareIntelligenceCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMissingFromCareIntelligenceCompliance", () => {
  it("returns score 0 for empty records", () => {
    const result = evaluateMissingFromCareIntelligenceCompliance([]);
    expect(result.overallScore).toBe(0);
  });

  it("returns zero rates for empty records", () => {
    const result = evaluateMissingFromCareIntelligenceCompliance([]);
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.immediateResponseFollowedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("calculates documentation complete rate correctly", () => {
    const records = [
      makeRecord({ id: "1", documentationComplete: true }),
      makeRecord({ id: "2", documentationComplete: false }),
      makeRecord({ id: "3", documentationComplete: true }),
    ];
    const result = evaluateMissingFromCareIntelligenceCompliance(records);
    expect(result.documentationCompleteRate).toBe(67);
  });

  it("calculates timely recording rate correctly", () => {
    const records = [
      makeRecord({ id: "1", timelyRecording: true }),
      makeRecord({ id: "2", timelyRecording: false }),
    ];
    const result = evaluateMissingFromCareIntelligenceCompliance(records);
    expect(result.timelyRecordingRate).toBe(50);
  });

  it("calculates immediate response followed rate correctly", () => {
    const records = [
      makeRecord({ id: "1", immediateResponseFollowed: true }),
      makeRecord({ id: "2", immediateResponseFollowed: true }),
      makeRecord({ id: "3", immediateResponseFollowed: false }),
    ];
    const result = evaluateMissingFromCareIntelligenceCompliance(records);
    expect(result.immediateResponseFollowedRate).toBe(67);
  });

  it("calculates category diversity ratio correctly for 2 categories", () => {
    const records = [
      makeRecord({ id: "1", category: "missing_episode_response" }),
      makeRecord({ id: "2", category: "return_home_interview" }),
      makeRecord({ id: "3", category: "missing_episode_response" }),
    ];
    const result = evaluateMissingFromCareIntelligenceCompliance(records);
    // 2/8 = 0.25
    expect(result.categoryDiversityRatio).toBe(0.25);
    expect(result.uniqueCategories).toBe(2);
  });

  it("calculates category diversity ratio correctly for 3 categories", () => {
    const records = [
      makeRecord({ id: "1", category: "missing_episode_response" }),
      makeRecord({ id: "2", category: "return_home_interview" }),
      makeRecord({ id: "3", category: "police_notification" }),
    ];
    const result = evaluateMissingFromCareIntelligenceCompliance(records);
    // 3/8 = 0.375 -> rounds to 0.38
    expect(result.categoryDiversityRatio).toBe(0.38);
    expect(result.uniqueCategories).toBe(3);
  });

  it("Chamberlain House demo has 100% documentation rate", () => {
    const result = evaluateMissingFromCareIntelligenceCompliance(OAK_HOUSE_RECORDS);
    expect(result.documentationCompleteRate).toBe(100);
  });

  it("Chamberlain House demo has 100% timely recording rate", () => {
    const result = evaluateMissingFromCareIntelligenceCompliance(OAK_HOUSE_RECORDS);
    expect(result.timelyRecordingRate).toBe(100);
  });

  it("Chamberlain House demo has 100% immediate response rate", () => {
    const result = evaluateMissingFromCareIntelligenceCompliance(OAK_HOUSE_RECORDS);
    expect(result.immediateResponseFollowedRate).toBe(100);
  });

  it("Chamberlain House demo has full category diversity (8/8 = 1)", () => {
    const result = evaluateMissingFromCareIntelligenceCompliance(OAK_HOUSE_RECORDS);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateMissingFromCareIntelligenceCompliance(OAK_HOUSE_RECORDS);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo compliance score is 25", () => {
    const result = evaluateMissingFromCareIntelligenceCompliance(OAK_HOUSE_RECORDS);
    expect(result.overallScore).toBe(25);
  });

  it("single record with all false gives low score", () => {
    const records = [
      makeRecord({
        id: "1",
        documentationComplete: false,
        timelyRecording: false,
        immediateResponseFollowed: false,
        category: "missing_episode_response",
      }),
    ];
    const result = evaluateMissingFromCareIntelligenceCompliance(records);
    // Only diversity: 1/8 = 0.13 => 0.13*5 = 0.65 => rounds to 0.6
    expect(result.overallScore).toBeLessThanOrEqual(5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. evaluateMissingFromCareIntelligencePolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMissingFromCareIntelligencePolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(null);
    expect(result.overallScore).toBe(0);
  });

  it("returns all false booleans for null policy", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(null);
    expect(result.missingChildrenPolicy).toBe(false);
    expect(result.returnHomeInterviewPolicy).toBe(false);
    expect(result.policeNotificationProtocol).toBe(false);
    expect(result.riskAssessmentFramework).toBe(false);
    expect(result.preventionStrategy).toBe(false);
    expect(result.multiAgencyMissingProtocol).toBe(false);
    expect(result.debriefAndLearningPolicy).toBe(false);
  });

  it("scores full 25 for all-true policy", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(OAK_HOUSE_POLICY);
    expect(result.overallScore).toBe(25);
  });

  it("mirrors policy booleans correctly", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(OAK_HOUSE_POLICY);
    expect(result.missingChildrenPolicy).toBe(true);
    expect(result.returnHomeInterviewPolicy).toBe(true);
    expect(result.policeNotificationProtocol).toBe(true);
    expect(result.riskAssessmentFramework).toBe(true);
    expect(result.preventionStrategy).toBe(true);
    expect(result.multiAgencyMissingProtocol).toBe(true);
    expect(result.debriefAndLearningPolicy).toBe(true);
  });

  it("missingChildrenPolicy contributes 4 points", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(makePolicy({ missingChildrenPolicy: false }));
    expect(result.overallScore).toBe(21);
  });

  it("returnHomeInterviewPolicy contributes 4 points", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(makePolicy({ returnHomeInterviewPolicy: false }));
    expect(result.overallScore).toBe(21);
  });

  it("policeNotificationProtocol contributes 4 points", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(makePolicy({ policeNotificationProtocol: false }));
    expect(result.overallScore).toBe(21);
  });

  it("riskAssessmentFramework contributes 4 points", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(makePolicy({ riskAssessmentFramework: false }));
    expect(result.overallScore).toBe(21);
  });

  it("preventionStrategy contributes 3 points", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(makePolicy({ preventionStrategy: false }));
    expect(result.overallScore).toBe(22);
  });

  it("multiAgencyMissingProtocol contributes 3 points", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(makePolicy({ multiAgencyMissingProtocol: false }));
    expect(result.overallScore).toBe(22);
  });

  it("debriefAndLearningPolicy contributes 3 points", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(makePolicy({ debriefAndLearningPolicy: false }));
    expect(result.overallScore).toBe(22);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(OAK_HOUSE_POLICY);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("all-false policy scores 0", () => {
    const result = evaluateMissingFromCareIntelligencePolicy(makePolicy({
      missingChildrenPolicy: false,
      returnHomeInterviewPolicy: false,
      policeNotificationProtocol: false,
      riskAssessmentFramework: false,
      preventionStrategy: false,
      multiAgencyMissingProtocol: false,
      debriefAndLearningPolicy: false,
    }));
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. evaluateStaffMissingFromCareIntelligenceReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffMissingFromCareIntelligenceReadiness", () => {
  it("returns score 0 for empty training", () => {
    const result = evaluateStaffMissingFromCareIntelligenceReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns zero rates for empty training", () => {
    const result = evaluateStaffMissingFromCareIntelligenceReadiness([]);
    expect(result.missingResponseProceduresRate).toBe(0);
    expect(result.returnInterviewSkillsRate).toBe(0);
    expect(result.riskAssessmentSkillsRate).toBe(0);
    expect(result.policeNotificationKnowledgeRate).toBe(0);
    expect(result.preventionStrategiesRate).toBe(0);
    expect(result.deEscalationSkillsRate).toBe(0);
  });

  it("calculates missingResponseProcedures rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", missingResponseProcedures: true }),
      makeTraining({ staffId: "s2", missingResponseProcedures: false }),
    ];
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(training);
    expect(result.missingResponseProceduresRate).toBe(50);
  });

  it("calculates returnInterviewSkills rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", returnInterviewSkills: true }),
      makeTraining({ staffId: "s2", returnInterviewSkills: true }),
      makeTraining({ staffId: "s3", returnInterviewSkills: false }),
    ];
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(training);
    expect(result.returnInterviewSkillsRate).toBe(67);
  });

  it("calculates riskAssessmentSkills rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", riskAssessmentSkills: true }),
      makeTraining({ staffId: "s2", riskAssessmentSkills: false }),
    ];
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(training);
    expect(result.riskAssessmentSkillsRate).toBe(50);
  });

  it("calculates policeNotificationKnowledge rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", policeNotificationKnowledge: true }),
      makeTraining({ staffId: "s2", policeNotificationKnowledge: false }),
      makeTraining({ staffId: "s3", policeNotificationKnowledge: true }),
    ];
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(training);
    expect(result.policeNotificationKnowledgeRate).toBe(67);
  });

  it("calculates preventionStrategies rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", preventionStrategies: true }),
      makeTraining({ staffId: "s2", preventionStrategies: false }),
    ];
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(training);
    expect(result.preventionStrategiesRate).toBe(50);
  });

  it("calculates deEscalationSkills rate correctly", () => {
    const training = [
      makeTraining({ staffId: "s1", deEscalationSkills: true }),
      makeTraining({ staffId: "s2", deEscalationSkills: true }),
    ];
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(training);
    expect(result.deEscalationSkillsRate).toBe(100);
  });

  it("Chamberlain House demo has 100% across all training skills", () => {
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(OAK_HOUSE_STAFF);
    expect(result.missingResponseProceduresRate).toBe(100);
    expect(result.returnInterviewSkillsRate).toBe(100);
    expect(result.riskAssessmentSkillsRate).toBe(100);
    expect(result.policeNotificationKnowledgeRate).toBe(100);
    expect(result.preventionStrategiesRate).toBe(100);
    expect(result.deEscalationSkillsRate).toBe(100);
  });

  it("Chamberlain House demo staff readiness score is 25", () => {
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(OAK_HOUSE_STAFF);
    expect(result.overallScore).toBe(25);
  });

  it("Chamberlain House demo total staff is 4", () => {
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(OAK_HOUSE_STAFF);
    expect(result.totalStaff).toBe(4);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(OAK_HOUSE_STAFF);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("all-false skills score 0", () => {
    const training = [
      makeTraining({
        staffId: "s1",
        missingResponseProcedures: false,
        returnInterviewSkills: false,
        riskAssessmentSkills: false,
        policeNotificationKnowledge: false,
        preventionStrategies: false,
        deEscalationSkills: false,
      }),
    ];
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("weighted score: only missingResponseProcedures true gives 6", () => {
    const training = [
      makeTraining({
        staffId: "s1",
        missingResponseProcedures: true,
        returnInterviewSkills: false,
        riskAssessmentSkills: false,
        policeNotificationKnowledge: false,
        preventionStrategies: false,
        deEscalationSkills: false,
      }),
    ];
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("weighted score: only deEscalationSkills true gives 2", () => {
    const training = [
      makeTraining({
        staffId: "s1",
        missingResponseProcedures: false,
        returnInterviewSkills: false,
        riskAssessmentSkills: false,
        policeNotificationKnowledge: false,
        preventionStrategies: false,
        deEscalationSkills: true,
      }),
    ];
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(training);
    expect(result.overallScore).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. buildChildMissingFromCareIntelligenceProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildMissingFromCareIntelligenceProfiles", () => {
  it("returns empty array for no records", () => {
    const result = buildChildMissingFromCareIntelligenceProfiles([]);
    expect(result).toHaveLength(0);
  });

  it("creates profiles grouped by child", () => {
    const result = buildChildMissingFromCareIntelligenceProfiles(OAK_HOUSE_RECORDS);
    expect(result).toHaveLength(3);
  });

  it("counts records per child correctly", () => {
    const result = buildChildMissingFromCareIntelligenceProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.totalRecords).toBe(4);
    const jordan = result.find((p) => p.childId === "child-jordan");
    expect(jordan!.totalRecords).toBe(4);
    const morgan = result.find((p) => p.childId === "child-morgan");
    expect(morgan!.totalRecords).toBe(4);
  });

  it("calculates immediate response rate per child", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", immediateResponseFollowed: true }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", immediateResponseFollowed: false }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.immediateResponseFollowedRate).toBe(50);
  });

  it("calculates return interview rate per child", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", returnInterviewCompleted: true }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", returnInterviewCompleted: false }),
      makeRecord({ id: "3", childId: "child-a", childName: "A", returnInterviewCompleted: true }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.returnInterviewCompletedRate).toBe(67);
  });

  it("tracks categories covered per child", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", category: "missing_episode_response" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", category: "return_home_interview" }),
      makeRecord({ id: "3", childId: "child-a", childName: "A", category: "missing_episode_response" }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.categoriesCovered).toHaveLength(2);
    expect(childA!.categoriesCovered).toContain("missing_episode_response");
    expect(childA!.categoriesCovered).toContain("return_home_interview");
  });

  it("frequency score: >= 10 records gives 2 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-a",
        childName: "A",
        immediateResponseFollowed: false,
        returnInterviewCompleted: false,
        category: "missing_episode_response",
      }),
    );
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=2, rate1=0, rate2=0, diversity=0
    expect(childA!.overallScore).toBe(2);
  });

  it("frequency score: >= 5 records gives 1 point", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-a",
        childName: "A",
        immediateResponseFollowed: false,
        returnInterviewCompleted: false,
        category: "missing_episode_response",
      }),
    );
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
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
        immediateResponseFollowed: false,
        returnInterviewCompleted: false,
        category: "missing_episode_response",
      }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
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
        immediateResponseFollowed: true,
        returnInterviewCompleted: false,
        category: "missing_episode_response",
      }),
    );
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=1, rate1=3 (100%), rate2=0, diversity=0
    expect(childA!.overallScore).toBe(4);
  });

  it("rate1 score: >= 60% gives 2 points", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", immediateResponseFollowed: true, returnInterviewCompleted: false, category: "missing_episode_response" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", immediateResponseFollowed: true, returnInterviewCompleted: false, category: "missing_episode_response" }),
      makeRecord({ id: "3", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "missing_episode_response" }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, rate1=2 (67%), rate2=0, diversity=0
    expect(childA!.overallScore).toBe(2);
  });

  it("rate1 score: >= 40% gives 1 point", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", immediateResponseFollowed: true, returnInterviewCompleted: false, category: "missing_episode_response" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "missing_episode_response" }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
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
        immediateResponseFollowed: false,
        returnInterviewCompleted: true,
        category: "missing_episode_response",
      }),
    );
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=1, rate1=0, rate2=3 (100%), diversity=0
    expect(childA!.overallScore).toBe(4);
  });

  it("rate2 score: >= 60% gives 2 points", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: true, category: "missing_episode_response" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: true, category: "missing_episode_response" }),
      makeRecord({ id: "3", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "missing_episode_response" }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, rate1=0, rate2=2 (67%), diversity=0
    expect(childA!.overallScore).toBe(2);
  });

  it("rate2 score: >= 40% gives 1 point", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: true, category: "missing_episode_response" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "missing_episode_response" }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, rate1=0, rate2=1 (50%), diversity=0
    expect(childA!.overallScore).toBe(1);
  });

  it("diversity score: >= 4 unique categories gives 2 points", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "missing_episode_response" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "return_home_interview" }),
      makeRecord({ id: "3", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "risk_assessment_review" }),
      makeRecord({ id: "4", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "police_notification" }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, rate1=0, rate2=0, diversity=2
    expect(childA!.overallScore).toBe(2);
  });

  it("diversity score: >= 2 unique categories gives 1 point", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "missing_episode_response" }),
      makeRecord({ id: "2", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "return_home_interview" }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    // freq=0, rate1=0, rate2=0, diversity=1
    expect(childA!.overallScore).toBe(1);
  });

  it("diversity score: 1 category gives 0 points", () => {
    const records = [
      makeRecord({ id: "1", childId: "child-a", childName: "A", immediateResponseFollowed: false, returnInterviewCompleted: false, category: "missing_episode_response" }),
    ];
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.overallScore).toBe(0);
  });

  it("score is clamped to 0-10", () => {
    const result = buildChildMissingFromCareIntelligenceProfiles(OAK_HOUSE_RECORDS);
    for (const profile of result) {
      expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      expect(profile.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("Chamberlain House Alex has 100% immediate response rate", () => {
    const result = buildChildMissingFromCareIntelligenceProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.immediateResponseFollowedRate).toBe(100);
  });

  it("Chamberlain House Alex has 100% return interview rate", () => {
    const result = buildChildMissingFromCareIntelligenceProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.returnInterviewCompletedRate).toBe(100);
  });

  it("Chamberlain House Alex has 4 categories covered", () => {
    const result = buildChildMissingFromCareIntelligenceProfiles(OAK_HOUSE_RECORDS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.categoriesCovered).toHaveLength(4);
  });

  it("child profile score cannot exceed 10", () => {
    // Perfect data: freq >= 10, rate1 100%, rate2 100%, diversity >= 4
    const categories: MissingFromCareIntelligenceRecord["category"][] = [
      "missing_episode_response", "return_home_interview", "risk_assessment_review", "police_notification",
      "multi_agency_response", "safety_planning", "missing_prevention", "pattern_analysis",
    ];
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-a",
        childName: "A",
        immediateResponseFollowed: true,
        returnInterviewCompleted: true,
        category: categories[i % 8],
      }),
    );
    const result = buildChildMissingFromCareIntelligenceProfiles(records);
    const childA = result.find((p) => p.childId === "child-a");
    expect(childA!.overallScore).toBeLessThanOrEqual(10);
    // freq=2 + rate1=3 + rate2=3 + diversity=2 = 10
    expect(childA!.overallScore).toBe(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. generateMissingFromCareIntelligenceResult (Orchestrator)
// ══════════════════════════════════════════════════════════════════════════════

describe("generateMissingFromCareIntelligenceResult", () => {
  const makeInput = (overrides: Partial<Parameters<typeof generateMissingFromCareIntelligenceResult>[0]> = {}) => ({
    homeId: "home-oak",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    records: OAK_HOUSE_RECORDS,
    policy: OAK_HOUSE_POLICY,
    staff: OAK_HOUSE_STAFF,
    ...overrides,
  });

  it("produces overall score 0-100", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces a valid rating", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all 4 evaluator results", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.quality).toBeDefined();
    expect(result.compliance).toBeDefined();
    expect(result.policy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
  });

  it("overall score equals sum of 4 evaluator scores", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    const expectedSum = Math.round(
      result.quality.overallScore +
      result.compliance.overallScore +
      result.policy.overallScore +
      result.staffReadiness.overallScore,
    );
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, expectedSum)));
  });

  it("includes child profiles", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.childProfiles.length).toBeGreaterThan(0);
  });

  it("includes 3 child profiles for Chamberlain House demo", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.childProfiles).toHaveLength(3);
  });

  it("includes exactly 7 regulatory links", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("includes CHR 2015 Reg 34 in regulatory links", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 34"))).toBe(true);
  });

  it("includes CHR 2015 Reg 12 in regulatory links", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
  });

  it("includes KCSIE 2024 in regulatory links", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.regulatoryLinks.some((l) => l.includes("KCSIE 2024"))).toBe(true);
  });

  it("includes NMS 5 in regulatory links", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 5"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes Statutory guidance on missing children 2014 in regulatory links", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.regulatoryLinks.some((l) => l.includes("Statutory guidance on missing children 2014"))).toBe(true);
  });

  it("includes Working Together 2023 in regulatory links", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
  });

  it("sets homeId correctly", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput({ records: [], policy: null, staff: [] }));
    expect(result.homeId).toBe("home-oak");
  });

  it("sets period dates correctly", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput({ records: [], policy: null, staff: [] }));
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-12-31");
  });

  it("Chamberlain House demo is rated outstanding (100/100)", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("empty data produces inadequate rating", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput({ records: [], policy: null, staff: [] }));
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for outstanding data", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates areas for improvement for empty records", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput({ records: [], policy: null, staff: [] }));
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("generates actions for missing policy", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput({ policy: null }));
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates actions for missing training", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput({ staff: [] }));
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("generates no-action message when everything is good", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  it("filters records by period", () => {
    // Only include records in Q1 2025
    const result = generateMissingFromCareIntelligenceResult(makeInput({ periodStart: "2025-01-01", periodEnd: "2025-03-31" }));
    // Alex: mfci-001 (Feb), mfci-002 (Mar) = 2
    // Jordan: mfci-005 (Feb), mfci-006 (Mar) = 2
    // Morgan: mfci-009 (Mar) = 1
    // Total in period: 5
    expect(result.quality.totalRecords).toBe(5);
  });

  it("excludes records outside period", () => {
    // No records should match July 2025
    const result = generateMissingFromCareIntelligenceResult(makeInput({ periodStart: "2025-07-01", periodEnd: "2025-07-31" }));
    expect(result.quality.totalRecords).toBe(0);
  });

  it("overall score cannot exceed 100 even with perfect data", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput());
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes areasForImprovement when no missing-from-care policy", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput({ policy: null }));
    expect(result.areasForImprovement.some((a) => a.includes("No missing-from-care policy"))).toBe(true);
  });

  it("includes areasForImprovement when no staff training records", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput({ staff: [] }));
    expect(result.areasForImprovement.some((a) => a.includes("No staff missing-from-care training"))).toBe(true);
  });

  it("includes areasForImprovement when no records in period", () => {
    const result = generateMissingFromCareIntelligenceResult(makeInput({ records: [] }));
    expect(result.areasForImprovement.some((a) => a.includes("No missing-from-care records"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Edge cases via evaluators
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases via evaluators", () => {
  it("handles zero denominator in quality evaluator", () => {
    const result = evaluateMissingFromCareIntelligenceQuality([]);
    expect(result.immediateResponseFollowedRate).toBe(0);
    expect(result.policeNotifiedAppropriatelyRate).toBe(0);
    expect(result.returnInterviewCompletedRate).toBe(0);
    expect(result.safetyPlanUpdatedRate).toBe(0);
  });

  it("handles zero denominator in compliance evaluator", () => {
    const result = evaluateMissingFromCareIntelligenceCompliance([]);
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.immediateResponseFollowedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
  });

  it("handles zero denominator in staff readiness evaluator", () => {
    const result = evaluateStaffMissingFromCareIntelligenceReadiness([]);
    expect(result.missingResponseProceduresRate).toBe(0);
    expect(result.returnInterviewSkillsRate).toBe(0);
    expect(result.riskAssessmentSkillsRate).toBe(0);
    expect(result.policeNotificationKnowledgeRate).toBe(0);
    expect(result.preventionStrategiesRate).toBe(0);
    expect(result.deEscalationSkillsRate).toBe(0);
  });

  it("single record with all false booleans scores low in quality", () => {
    const records = [
      makeRecord({
        id: "1",
        immediateResponseFollowed: false,
        policeNotifiedAppropriately: false,
        returnInterviewCompleted: false,
        safetyPlanUpdated: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    ];
    const qualityResult = evaluateMissingFromCareIntelligenceQuality(records);
    expect(qualityResult.overallScore).toBe(0);
    const complianceResult = evaluateMissingFromCareIntelligenceCompliance(records);
    expect(complianceResult.overallScore).toBeLessThanOrEqual(5);
  });

  it("mixed record data calculates correctly", () => {
    const records = [
      makeRecord({ id: "1", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: true }),
      makeRecord({ id: "2", immediateResponseFollowed: false, policeNotifiedAppropriately: false, returnInterviewCompleted: false, safetyPlanUpdated: false }),
      makeRecord({ id: "3", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: false, safetyPlanUpdated: true }),
    ];
    const result = evaluateMissingFromCareIntelligenceQuality(records);
    expect(result.immediateResponseFollowedRate).toBe(67);
    expect(result.policeNotifiedAppropriatelyRate).toBe(67);
    expect(result.returnInterviewCompletedRate).toBe(33);
    expect(result.safetyPlanUpdatedRate).toBe(67);
  });

  it("compliance with only 1 category has low diversity ratio", () => {
    const records = [
      makeRecord({ id: "1", category: "missing_episode_response" }),
      makeRecord({ id: "2", category: "missing_episode_response" }),
    ];
    const result = evaluateMissingFromCareIntelligenceCompliance(records);
    // 1/8 = 0.125 -> rounds to 0.13
    expect(result.categoryDiversityRatio).toBe(0.13);
  });

  it("compliance with all 8 categories gives diversity ratio 1", () => {
    const categories: MissingFromCareIntelligenceRecord["category"][] = [
      "missing_episode_response", "return_home_interview", "risk_assessment_review", "police_notification",
      "multi_agency_response", "safety_planning", "missing_prevention", "pattern_analysis",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateMissingFromCareIntelligenceCompliance(records);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
  });

  it("staff with mixed skills produces correct weighted score", () => {
    const training = [
      makeTraining({ staffId: "s1", missingResponseProcedures: true, returnInterviewSkills: true, riskAssessmentSkills: false, policeNotificationKnowledge: false, preventionStrategies: false, deEscalationSkills: false }),
      makeTraining({ staffId: "s2", missingResponseProcedures: false, returnInterviewSkills: false, riskAssessmentSkills: true, policeNotificationKnowledge: true, preventionStrategies: true, deEscalationSkills: true }),
    ];
    const result = evaluateStaffMissingFromCareIntelligenceReadiness(training);
    // Each skill at 50%: (50/100)*6 + (50/100)*5 + (50/100)*5 + (50/100)*4 + (50/100)*3 + (50/100)*2
    // = 3 + 2.5 + 2.5 + 2 + 1.5 + 1 = 12.5
    expect(result.overallScore).toBe(12.5);
  });
});
