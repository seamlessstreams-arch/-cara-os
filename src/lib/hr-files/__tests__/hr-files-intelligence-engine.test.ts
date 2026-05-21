import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getHrFilesCategoryLabel,
  getHrFilesOutcomeLabel,
  getRatingLabel,
  evaluateHrFilesQuality,
  evaluateHrFilesCompliance,
  evaluateHrFilesPolicy,
  evaluateStaffHrFilesReadiness,
  buildChildHrFilesProfiles,
  generateHrFilesIntelligence,
} from "../hr-files-intelligence-engine";
import type {
  HrFilesRecord,
  HrFilesPolicy,
  StaffHrFilesTraining,
  HrFilesCategory,
} from "../hr-files-intelligence-engine";

// ── Test helpers ───────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<HrFilesRecord> = {}): HrFilesRecord {
  return {
    id: "hr-1",
    homeId: "home-oak",
    date: "2026-03-15",
    childId: "staff-sarah",
    childName: "Sarah Johnson",
    category: "supervision_record",
    outcome: "fully_compliant",
    recordAccurate: true,
    signaturesObtained: true,
    actionPointsDocumented: true,
    timeframesMet: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<HrFilesPolicy> = {}): HrFilesPolicy {
  return {
    supervisionPolicy: true,
    mandatoryTrainingPolicy: true,
    saferRecruitmentPolicy: true,
    dbsRenewalPolicy: true,
    absenceManagementPolicy: true,
    performanceReviewPolicy: true,
    disciplinaryPolicy: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffHrFilesTraining> = {}): StaffHrFilesTraining {
  return {
    staffId: "staff-sarah",
    hrPolicyKnowledge: true,
    supervisionSkills: true,
    saferRecruitmentKnowledge: true,
    trainingComplianceSkills: true,
    absenceManagementSkills: true,
    performanceReviewSkills: true,
    ...overrides,
  };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 for zero denominator", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 for 0/0", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("returns 100 for equal values", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds correctly", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for 80+", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for below 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ── Label functions ────────────────────────────────────────────────────────

describe("getHrFilesCategoryLabel", () => {
  it("returns label for supervision_record", () => {
    expect(getHrFilesCategoryLabel("supervision_record")).toBe("Supervision Record");
  });
  it("returns label for training_completion", () => {
    expect(getHrFilesCategoryLabel("training_completion")).toBe("Training Completion");
  });
  it("returns label for dbs_check", () => {
    expect(getHrFilesCategoryLabel("dbs_check")).toBe("DBS Check");
  });
  it("returns label for probation_review", () => {
    expect(getHrFilesCategoryLabel("probation_review")).toBe("Probation Review");
  });
  it("returns label for absence_management", () => {
    expect(getHrFilesCategoryLabel("absence_management")).toBe("Absence Management");
  });
  it("returns label for performance_review", () => {
    expect(getHrFilesCategoryLabel("performance_review")).toBe("Performance Review");
  });
  it("returns label for disciplinary_record", () => {
    expect(getHrFilesCategoryLabel("disciplinary_record")).toBe("Disciplinary Record");
  });
  it("returns label for recruitment_record", () => {
    expect(getHrFilesCategoryLabel("recruitment_record")).toBe("Recruitment Record");
  });
});

describe("getHrFilesOutcomeLabel", () => {
  it("returns label for fully_compliant", () => {
    expect(getHrFilesOutcomeLabel("fully_compliant")).toBe("Fully Compliant");
  });
  it("returns label for partially_compliant", () => {
    expect(getHrFilesOutcomeLabel("partially_compliant")).toBe("Partially Compliant");
  });
  it("returns label for overdue", () => {
    expect(getHrFilesOutcomeLabel("overdue")).toBe("Overdue");
  });
  it("returns label for non_compliant", () => {
    expect(getHrFilesOutcomeLabel("non_compliant")).toBe("Non-Compliant");
  });
  it("returns label for not_applicable", () => {
    expect(getHrFilesOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns Good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns Requires Improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns Inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateHrFilesQuality ────────────────────────────────────────────────

describe("evaluateHrFilesQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateHrFilesQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.recordAccurateRate).toBe(0);
    expect(result.signaturesObtainedRate).toBe(0);
    expect(result.actionPointsDocumentedRate).toBe(0);
    expect(result.timeframesMetRate).toBe(0);
  });

  it("returns 25 for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "hr-2" })];
    const result = evaluateHrFilesQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.recordAccurateRate).toBe(100);
    expect(result.signaturesObtainedRate).toBe(100);
    expect(result.actionPointsDocumentedRate).toBe(100);
    expect(result.timeframesMetRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({ recordAccurate: false, signaturesObtained: false, actionPointsDocumented: false, timeframesMet: false })];
    const result = evaluateHrFilesQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("calculates correct mixed score", () => {
    const records = [
      makeRecord({ recordAccurate: true, signaturesObtained: true, actionPointsDocumented: false, timeframesMet: false }),
      makeRecord({ id: "hr-2", recordAccurate: true, signaturesObtained: false, actionPointsDocumented: true, timeframesMet: false }),
    ];
    const result = evaluateHrFilesQuality(records);
    // recordAccurate: 100% -> 7, signatures: 50% -> 3, actionPoints: 50% -> 3, timeframes: 0% -> 0 = 13
    expect(result.recordAccurateRate).toBe(100);
    expect(result.signaturesObtainedRate).toBe(50);
    expect(result.actionPointsDocumentedRate).toBe(50);
    expect(result.timeframesMetRate).toBe(0);
    expect(result.overallScore).toBe(13);
  });

  it("handles single record with all true", () => {
    const result = evaluateHrFilesQuality([makeRecord()]);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(1);
  });

  it("score never exceeds 25", () => {
    const records = Array.from({ length: 20 }, (_, i) => makeRecord({ id: `hr-${i}` }));
    const result = evaluateHrFilesQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const records = [makeRecord({ recordAccurate: false, signaturesObtained: false, actionPointsDocumented: false, timeframesMet: false })];
    const result = evaluateHrFilesQuality(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("calculates weighted score correctly for single boolean", () => {
    // Only recordAccurate = 7
    const records = [makeRecord({ signaturesObtained: false, actionPointsDocumented: false, timeframesMet: false })];
    const result = evaluateHrFilesQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("calculates weighted score for signaturesObtained only", () => {
    const records = [makeRecord({ recordAccurate: false, actionPointsDocumented: false, timeframesMet: false })];
    const result = evaluateHrFilesQuality(records);
    expect(result.overallScore).toBe(6);
  });
});

// ── evaluateHrFilesCompliance ─────────────────────────────────────────────

describe("evaluateHrFilesCompliance", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateHrFilesCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.recordAccurateRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("returns full score for perfect compliance with all 8 categories", () => {
    const categories: HrFilesCategory[] = [
      "supervision_record", "training_completion", "dbs_check", "probation_review",
      "absence_management", "performance_review", "disciplinary_record", "recruitment_record",
    ];
    const records = categories.map((c, i) => makeRecord({ id: `hr-${i}`, category: c }));
    const result = evaluateHrFilesCompliance(records);
    // doc: 100% -> 8, timely: 100% -> 7, recordAccurate: 100% -> 5, diversity: 1.0 -> 5 = 25
    expect(result.overallScore).toBe(25);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
  });

  it("returns low score for all-false compliance fields with 1 category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, recordAccurate: false })];
    const result = evaluateHrFilesCompliance(records);
    // doc: 0, timely: 0, recordAccurate: 0, diversity: 1/8=0.13 -> 0.13*5=0.65 -> rounds to 0.6
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.recordAccurateRate).toBe(0);
    expect(result.overallScore).toBe(0.7);
  });

  it("calculates categoryDiversityRatio correctly for 4 categories", () => {
    const records = [
      makeRecord({ id: "hr-1", category: "supervision_record" }),
      makeRecord({ id: "hr-2", category: "training_completion" }),
      makeRecord({ id: "hr-3", category: "dbs_check" }),
      makeRecord({ id: "hr-4", category: "probation_review" }),
    ];
    const result = evaluateHrFilesCompliance(records);
    expect(result.categoryDiversityRatio).toBe(0.5);
    expect(result.uniqueCategories).toBe(4);
  });

  it("handles partial compliance", () => {
    const records = [
      makeRecord({ id: "hr-1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "hr-2", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluateHrFilesCompliance(records);
    expect(result.documentationCompleteRate).toBe(50);
    expect(result.timelyRecordingRate).toBe(50);
  });

  it("diversity ratio uses Math.round formula", () => {
    const records = [
      makeRecord({ id: "hr-1", category: "supervision_record" }),
      makeRecord({ id: "hr-2", category: "training_completion" }),
      makeRecord({ id: "hr-3", category: "dbs_check" }),
    ];
    const result = evaluateHrFilesCompliance(records);
    // 3/8 = 0.375 -> Math.round(0.375 * 100) / 100 = 0.38
    expect(result.categoryDiversityRatio).toBe(0.38);
  });

  it("score never exceeds 25", () => {
    const categories: HrFilesCategory[] = [
      "supervision_record", "training_completion", "dbs_check", "probation_review",
      "absence_management", "performance_review", "disciplinary_record", "recruitment_record",
    ];
    const records = categories.map((c, i) => makeRecord({ id: `hr-${i}`, category: c }));
    const result = evaluateHrFilesCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("calculates diversity for 2 categories", () => {
    const records = [
      makeRecord({ id: "hr-1", category: "supervision_record" }),
      makeRecord({ id: "hr-2", category: "training_completion" }),
    ];
    const result = evaluateHrFilesCompliance(records);
    // 2/8 = 0.25
    expect(result.categoryDiversityRatio).toBe(0.25);
    expect(result.uniqueCategories).toBe(2);
  });

  it("calculates diversity for 7 categories", () => {
    const categories: HrFilesCategory[] = [
      "supervision_record", "training_completion", "dbs_check", "probation_review",
      "absence_management", "performance_review", "disciplinary_record",
    ];
    const records = categories.map((c, i) => makeRecord({ id: `hr-${i}`, category: c }));
    const result = evaluateHrFilesCompliance(records);
    // 7/8 = 0.875 -> Math.round(0.875 * 100) / 100 = 0.88
    expect(result.categoryDiversityRatio).toBe(0.88);
    expect(result.uniqueCategories).toBe(7);
  });
});

// ── evaluateHrFilesPolicy ─────────────────────────────────────────────────

describe("evaluateHrFilesPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateHrFilesPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.supervisionPolicy).toBe(false);
    expect(result.mandatoryTrainingPolicy).toBe(false);
    expect(result.saferRecruitmentPolicy).toBe(false);
    expect(result.dbsRenewalPolicy).toBe(false);
    expect(result.absenceManagementPolicy).toBe(false);
    expect(result.performanceReviewPolicy).toBe(false);
    expect(result.disciplinaryPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateHrFilesPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateHrFilesPolicy(makePolicy({
      supervisionPolicy: false,
      mandatoryTrainingPolicy: false,
      saferRecruitmentPolicy: false,
      dbsRenewalPolicy: false,
      absenceManagementPolicy: false,
      performanceReviewPolicy: false,
      disciplinaryPolicy: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("returns partial score correctly — only 4-weight policies", () => {
    // Only the 4-weight policies: 4+4+4+4 = 16
    const result = evaluateHrFilesPolicy(makePolicy({
      absenceManagementPolicy: false,
      performanceReviewPolicy: false,
      disciplinaryPolicy: false,
    }));
    expect(result.overallScore).toBe(16);
  });

  it("returns correct score for only 3-weight policies", () => {
    // Only the 3-weight policies: 3+3+3 = 9
    const result = evaluateHrFilesPolicy(makePolicy({
      supervisionPolicy: false,
      mandatoryTrainingPolicy: false,
      saferRecruitmentPolicy: false,
      dbsRenewalPolicy: false,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("reflects boolean values in result", () => {
    const result = evaluateHrFilesPolicy(makePolicy({ supervisionPolicy: false, disciplinaryPolicy: false }));
    expect(result.supervisionPolicy).toBe(false);
    expect(result.mandatoryTrainingPolicy).toBe(true);
    expect(result.disciplinaryPolicy).toBe(false);
  });

  it("score never exceeds 25", () => {
    const result = evaluateHrFilesPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns single 4-weight policy score", () => {
    const result = evaluateHrFilesPolicy(makePolicy({
      mandatoryTrainingPolicy: false,
      saferRecruitmentPolicy: false,
      dbsRenewalPolicy: false,
      absenceManagementPolicy: false,
      performanceReviewPolicy: false,
      disciplinaryPolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("returns single 3-weight policy score", () => {
    const result = evaluateHrFilesPolicy(makePolicy({
      supervisionPolicy: false,
      mandatoryTrainingPolicy: false,
      saferRecruitmentPolicy: false,
      dbsRenewalPolicy: false,
      performanceReviewPolicy: false,
      disciplinaryPolicy: false,
    }));
    expect(result.overallScore).toBe(3);
  });
});

// ── evaluateStaffHrFilesReadiness ─────────────────────────────────────────

describe("evaluateStaffHrFilesReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffHrFilesReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.hrPolicyKnowledgeRate).toBe(0);
    expect(result.supervisionSkillsRate).toBe(0);
    expect(result.saferRecruitmentKnowledgeRate).toBe(0);
    expect(result.trainingComplianceSkillsRate).toBe(0);
    expect(result.absenceManagementSkillsRate).toBe(0);
    expect(result.performanceReviewSkillsRate).toBe(0);
  });

  it("returns 25 for all-true training", () => {
    const training = [makeTraining(), makeTraining({ staffId: "staff-tom" })];
    const result = evaluateStaffHrFilesReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false training", () => {
    const training = [makeTraining({
      hrPolicyKnowledge: false,
      supervisionSkills: false,
      saferRecruitmentKnowledge: false,
      trainingComplianceSkills: false,
      absenceManagementSkills: false,
      performanceReviewSkills: false,
    })];
    const result = evaluateStaffHrFilesReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("handles partial training", () => {
    const training = [
      makeTraining({ staffId: "staff-1" }),
      makeTraining({ staffId: "staff-2", hrPolicyKnowledge: false, performanceReviewSkills: false }),
    ];
    const result = evaluateStaffHrFilesReadiness(training);
    expect(result.hrPolicyKnowledgeRate).toBe(50);
    expect(result.performanceReviewSkillsRate).toBe(50);
    expect(result.supervisionSkillsRate).toBe(100);
  });

  it("calculates weighted score correctly for single staff — only hrPolicyKnowledge", () => {
    // Only hrPolicyKnowledge = 6
    const training = [makeTraining({
      supervisionSkills: false,
      saferRecruitmentKnowledge: false,
      trainingComplianceSkills: false,
      absenceManagementSkills: false,
      performanceReviewSkills: false,
    })];
    const result = evaluateStaffHrFilesReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("calculates weighted score correctly for single staff — only supervisionSkills", () => {
    const training = [makeTraining({
      hrPolicyKnowledge: false,
      saferRecruitmentKnowledge: false,
      trainingComplianceSkills: false,
      absenceManagementSkills: false,
      performanceReviewSkills: false,
    })];
    const result = evaluateStaffHrFilesReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("calculates weighted score correctly for single staff — only performanceReviewSkills", () => {
    const training = [makeTraining({
      hrPolicyKnowledge: false,
      supervisionSkills: false,
      saferRecruitmentKnowledge: false,
      trainingComplianceSkills: false,
      absenceManagementSkills: false,
    })];
    const result = evaluateStaffHrFilesReadiness(training);
    expect(result.overallScore).toBe(2);
  });

  it("score never exceeds 25", () => {
    const training = Array.from({ length: 10 }, (_, i) => makeTraining({ staffId: `staff-${i}` }));
    const result = evaluateStaffHrFilesReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const training = [makeTraining({
      hrPolicyKnowledge: false,
      supervisionSkills: false,
      saferRecruitmentKnowledge: false,
      trainingComplianceSkills: false,
      absenceManagementSkills: false,
      performanceReviewSkills: false,
    })];
    const result = evaluateStaffHrFilesReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── buildChildHrFilesProfiles ─────────────────────────────────────────────

describe("buildChildHrFilesProfiles", () => {
  it("returns empty array for empty records", () => {
    const profiles = buildChildHrFilesProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("builds profile for single staff member", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", childName: "Sarah Johnson", category: "supervision_record" }),
      makeRecord({ id: "hr-2", childId: "staff-sarah", childName: "Sarah Johnson", category: "training_completion" }),
    ];
    const profiles = buildChildHrFilesProfiles(records);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("staff-sarah");
    expect(profiles[0].childName).toBe("Sarah Johnson");
    expect(profiles[0].totalRecords).toBe(2);
  });

  it("builds profiles for multiple staff members", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", childName: "Sarah Johnson" }),
      makeRecord({ id: "hr-2", childId: "staff-tom", childName: "Tom Richards" }),
      makeRecord({ id: "hr-3", childId: "staff-lisa", childName: "Lisa Williams" }),
    ];
    const profiles = buildChildHrFilesProfiles(records);
    expect(profiles).toHaveLength(3);
    const ids = profiles.map((p) => p.childId);
    expect(ids).toContain("staff-sarah");
    expect(ids).toContain("staff-tom");
    expect(ids).toContain("staff-lisa");
  });

  it("calculates recordAccurateRate correctly", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", recordAccurate: true }),
      makeRecord({ id: "hr-2", childId: "staff-sarah", recordAccurate: false }),
    ];
    const profiles = buildChildHrFilesProfiles(records);
    expect(profiles[0].recordAccurateRate).toBe(50);
  });

  it("calculates signaturesObtainedRate correctly", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", signaturesObtained: true }),
      makeRecord({ id: "hr-2", childId: "staff-sarah", signaturesObtained: true }),
      makeRecord({ id: "hr-3", childId: "staff-sarah", signaturesObtained: false }),
    ];
    const profiles = buildChildHrFilesProfiles(records);
    expect(profiles[0].signaturesObtainedRate).toBe(67);
  });

  it("tracks categoriesCovered", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", category: "supervision_record" }),
      makeRecord({ id: "hr-2", childId: "staff-sarah", category: "training_completion" }),
      makeRecord({ id: "hr-3", childId: "staff-sarah", category: "supervision_record" }),
    ];
    const profiles = buildChildHrFilesProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
    expect(profiles[0].categoriesCovered).toContain("supervision_record");
    expect(profiles[0].categoriesCovered).toContain("training_completion");
  });

  it("frequency score: 0 for <5 records", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
    ];
    const profiles = buildChildHrFilesProfiles(records);
    // freq=0, rate1=0 (0%), rate2=0 (0%), diversity=0 (1 cat)
    expect(profiles[0].overallScore).toBe(0);
  });

  it("frequency score: 1 for 5-9 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `hr-${i}`, childId: "staff-sarah", recordAccurate: false, signaturesObtained: false, category: "supervision_record" }),
    );
    const profiles = buildChildHrFilesProfiles(records);
    // freq=1, rate1=0, rate2=0, diversity=0 (1 cat) = 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("frequency score: 2 for 10+ records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `hr-${i}`, childId: "staff-sarah", recordAccurate: false, signaturesObtained: false, category: "supervision_record" }),
    );
    const profiles = buildChildHrFilesProfiles(records);
    // freq=2, rate1=0, rate2=0, diversity=0 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("rate1 score: 3 for >=80% recordAccurateRate", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `hr-${i}`, childId: "staff-sarah", recordAccurate: true, signaturesObtained: false }),
    );
    const profiles = buildChildHrFilesProfiles(records);
    // freq=1, rate1=3 (100%), rate2=0, diversity=0 = 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("rate1 score: 2 for 60-79% recordAccurateRate", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", recordAccurate: true, signaturesObtained: false }),
      makeRecord({ id: "hr-2", childId: "staff-sarah", recordAccurate: true, signaturesObtained: false }),
      makeRecord({ id: "hr-3", childId: "staff-sarah", recordAccurate: true, signaturesObtained: false }),
      makeRecord({ id: "hr-4", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
      makeRecord({ id: "hr-5", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
    ];
    // recordAccurate: 3/5 = 60%
    const profiles = buildChildHrFilesProfiles(records);
    // freq=1, rate1=2 (60%), rate2=0, diversity=0 = 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("rate1 score: 1 for 40-59% recordAccurateRate", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", recordAccurate: true, signaturesObtained: false }),
      makeRecord({ id: "hr-2", childId: "staff-sarah", recordAccurate: true, signaturesObtained: false }),
      makeRecord({ id: "hr-3", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
      makeRecord({ id: "hr-4", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
      makeRecord({ id: "hr-5", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
    ];
    // recordAccurate: 2/5 = 40%
    const profiles = buildChildHrFilesProfiles(records);
    // freq=1, rate1=1 (40%), rate2=0, diversity=0 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("rate1 score: 0 for <40% recordAccurateRate", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", recordAccurate: true, signaturesObtained: false }),
      makeRecord({ id: "hr-2", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
      makeRecord({ id: "hr-3", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
      makeRecord({ id: "hr-4", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
      makeRecord({ id: "hr-5", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
    ];
    // recordAccurate: 1/5 = 20%
    const profiles = buildChildHrFilesProfiles(records);
    // freq=1, rate1=0 (20%), rate2=0, diversity=0 = 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("rate2 score: 3 for >=80% signaturesObtainedRate", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `hr-${i}`, childId: "staff-sarah", recordAccurate: false, signaturesObtained: true }),
    );
    const profiles = buildChildHrFilesProfiles(records);
    // freq=1, rate1=0, rate2=3 (100%), diversity=0 = 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("rate2 score: 2 for 60-79% signaturesObtainedRate", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", recordAccurate: false, signaturesObtained: true }),
      makeRecord({ id: "hr-2", childId: "staff-sarah", recordAccurate: false, signaturesObtained: true }),
      makeRecord({ id: "hr-3", childId: "staff-sarah", recordAccurate: false, signaturesObtained: true }),
      makeRecord({ id: "hr-4", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
      makeRecord({ id: "hr-5", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
    ];
    // signaturesObtained: 3/5 = 60%
    const profiles = buildChildHrFilesProfiles(records);
    // freq=1, rate1=0, rate2=2, diversity=0 = 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("diversity score: 2 for >=4 categories", () => {
    const categories: HrFilesCategory[] = ["supervision_record", "training_completion", "dbs_check", "probation_review"];
    const records = categories.map((c, i) =>
      makeRecord({ id: `hr-${i}`, childId: "staff-sarah", category: c, recordAccurate: false, signaturesObtained: false }),
    );
    const profiles = buildChildHrFilesProfiles(records);
    // freq=0, rate1=0, rate2=0, diversity=2 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("diversity score: 1 for 2-3 categories", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", category: "supervision_record", recordAccurate: false, signaturesObtained: false }),
      makeRecord({ id: "hr-2", childId: "staff-sarah", category: "training_completion", recordAccurate: false, signaturesObtained: false }),
    ];
    const profiles = buildChildHrFilesProfiles(records);
    // freq=0, rate1=0, rate2=0, diversity=1 = 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("diversity score: 0 for 1 category", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", category: "supervision_record", recordAccurate: false, signaturesObtained: false }),
    ];
    const profiles = buildChildHrFilesProfiles(records);
    expect(profiles[0].overallScore).toBe(0);
  });

  it("overallScore capped at 10", () => {
    // Max possible: freq=2(10+), rate1=3(100%), rate2=3(100%), diversity=2(4+) = 10
    const categories: HrFilesCategory[] = ["supervision_record", "training_completion", "dbs_check", "probation_review"];
    const records: HrFilesRecord[] = [];
    for (let i = 0; i < 12; i++) {
      records.push(makeRecord({ id: `hr-${i}`, childId: "staff-sarah", category: categories[i % 4] }));
    }
    const profiles = buildChildHrFilesProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("overallScore is never negative", () => {
    const records = [
      makeRecord({ id: "hr-1", childId: "staff-sarah", recordAccurate: false, signaturesObtained: false }),
    ];
    const profiles = buildChildHrFilesProfiles(records);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── generateHrFilesIntelligence (orchestrator) ────────────────────────────

describe("generateHrFilesIntelligence", () => {
  const fullRecords: HrFilesRecord[] = [
    makeRecord({ id: "hr-1", date: "2026-02-01", childId: "staff-sarah", childName: "Sarah Johnson", category: "supervision_record" }),
    makeRecord({ id: "hr-2", date: "2026-02-15", childId: "staff-sarah", childName: "Sarah Johnson", category: "training_completion" }),
    makeRecord({ id: "hr-3", date: "2026-03-01", childId: "staff-sarah", childName: "Sarah Johnson", category: "dbs_check" }),
    makeRecord({ id: "hr-4", date: "2026-03-15", childId: "staff-tom", childName: "Tom Richards", category: "probation_review" }),
    makeRecord({ id: "hr-5", date: "2026-02-10", childId: "staff-tom", childName: "Tom Richards", category: "absence_management" }),
    makeRecord({ id: "hr-6", date: "2026-02-20", childId: "staff-tom", childName: "Tom Richards", category: "performance_review" }),
    makeRecord({ id: "hr-7", date: "2026-03-10", childId: "staff-lisa", childName: "Lisa Williams", category: "disciplinary_record" }),
    makeRecord({ id: "hr-8", date: "2026-03-20", childId: "staff-lisa", childName: "Lisa Williams", category: "recruitment_record" }),
    makeRecord({ id: "hr-9", date: "2026-02-05", childId: "staff-lisa", childName: "Lisa Williams", category: "supervision_record" }),
    makeRecord({ id: "hr-10", date: "2026-03-05", childId: "staff-darren", childName: "Darren Laville", category: "training_completion" }),
    makeRecord({ id: "hr-11", date: "2026-03-25", childId: "staff-darren", childName: "Darren Laville", category: "dbs_check" }),
    makeRecord({ id: "hr-12", date: "2026-04-01", childId: "staff-darren", childName: "Darren Laville", category: "absence_management" }),
  ];

  it("generates full intelligence report", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.hrFilesQuality).toBeDefined();
    expect(result.hrFilesCompliance).toBeDefined();
    expect(result.hrFilesPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("handles empty records", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.hrFilesQuality.overallScore).toBe(0);
    expect(result.hrFilesCompliance.overallScore).toBe(0);
    expect(result.childProfiles).toEqual([]);
  });

  it("handles null policy", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: null,
      staff: [makeTraining()],
    });

    expect(result.hrFilesPolicy.overallScore).toBe(0);
    expect(result.hrFilesPolicy.supervisionPolicy).toBe(false);
    expect(result.areasForImprovement).toEqual(expect.arrayContaining([expect.stringContaining("No HR files policy")]));
    expect(result.actions).toEqual(expect.arrayContaining([expect.stringContaining("URGENT")]));
  });

  it("handles empty staff", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [],
    });

    expect(result.staffReadiness.overallScore).toBe(0);
    expect(result.staffReadiness.totalStaff).toBe(0);
    expect(result.areasForImprovement).toEqual(expect.arrayContaining([expect.stringContaining("No staff HR training")]));
  });

  it("filters records by date range", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-03-01",
      periodEnd: "2026-03-31",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.hrFilesQuality.totalRecords).toBeLessThan(fullRecords.length);
    expect(result.hrFilesQuality.totalRecords).toBeGreaterThan(0);
  });

  it("excludes records outside date range", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2027-01-01",
      periodEnd: "2027-12-31",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.hrFilesQuality.totalRecords).toBe(0);
    expect(result.childProfiles).toEqual([]);
  });

  it("overall score is capped at 100", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score is rounded to nearest integer", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.overallScore).toBe(Math.round(result.overallScore));
  });

  it("generates strengths for high scores", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low scores", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.areasForImprovement).toEqual(expect.arrayContaining([expect.stringContaining("Inadequate")]));
  });

  it("generates actions for missing everything", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.actions).toEqual(expect.arrayContaining([
      expect.stringContaining("URGENT: No HR files policy"),
      expect.stringContaining("URGENT: No staff HR training"),
    ]));
  });

  it("generates default action when no issues", () => {
    const categories: HrFilesCategory[] = [
      "supervision_record", "training_completion", "dbs_check", "probation_review",
      "absence_management", "performance_review", "disciplinary_record", "recruitment_record",
    ];
    const perfectRecords = categories.map((c, i) =>
      makeRecord({ id: `hr-${i}`, date: "2026-03-15", childId: "staff-sarah", childName: "Sarah Johnson", category: c }),
    );
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: perfectRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.actions).toContain("No immediate actions required. HR files systems operating within expected standards.");
  });

  it("includes all 7 regulatory links", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 32 — Fitness of workers");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 33 — Employment of staff");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 13 — Leadership and management");
    expect(result.regulatoryLinks).toContain("NMS 19 — Staffing");
    expect(result.regulatoryLinks).toContain("SCCIF — Leadership and management");
    expect(result.regulatoryLinks).toContain("Children Act 1989 — Duty of care");
    expect(result.regulatoryLinks).toContain("Quality Standards 2015 Standard 7");
  });

  it("generates child profiles from filtered records", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.childProfiles.length).toBe(4);
    const childIds = result.childProfiles.map((p) => p.childId);
    expect(childIds).toContain("staff-sarah");
    expect(childIds).toContain("staff-tom");
    expect(childIds).toContain("staff-lisa");
    expect(childIds).toContain("staff-darren");
  });

  it("rating is outstanding for score >= 80", () => {
    const categories: HrFilesCategory[] = [
      "supervision_record", "training_completion", "dbs_check", "probation_review",
      "absence_management", "performance_review", "disciplinary_record", "recruitment_record",
    ];
    const perfectRecords = categories.map((c, i) =>
      makeRecord({ id: `hr-${i}`, date: "2026-03-15", childId: "staff-sarah", category: c }),
    );
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: perfectRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rating is inadequate for score < 40", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("actions mention low scoring staff members", () => {
    // Create a staff member with very low scores
    const records = [
      makeRecord({
        id: "hr-1", date: "2026-03-01", childId: "staff-low", childName: "Low Scorer",
        recordAccurate: false, signaturesObtained: false, actionPointsDocumented: false, timeframesMet: false,
        documentationComplete: false, timelyRecording: false,
      }),
    ];
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    // Staff member should have low score, triggering action
    const lowStaff = result.childProfiles.find((p) => p.childId === "staff-low");
    expect(lowStaff).toBeDefined();
    expect(lowStaff!.overallScore).toBeLessThanOrEqual(3);
    expect(result.actions).toEqual(expect.arrayContaining([expect.stringContaining("staff member(s) with low HR file scores")]));
  });

  it("handles records with all booleans false", () => {
    const records = [
      makeRecord({
        id: "hr-1", date: "2026-03-01",
        recordAccurate: false, signaturesObtained: false, actionPointsDocumented: false, timeframesMet: false,
        documentationComplete: false, timelyRecording: false,
      }),
    ];
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: null,
      staff: [],
    });

    expect(result.hrFilesQuality.overallScore).toBe(0);
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("perfect score is exactly 100", () => {
    const categories: HrFilesCategory[] = [
      "supervision_record", "training_completion", "dbs_check", "probation_review",
      "absence_management", "performance_review", "disciplinary_record", "recruitment_record",
    ];
    const perfectRecords = categories.map((c, i) =>
      makeRecord({ id: `hr-${i}`, date: "2026-03-15", category: c }),
    );
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: perfectRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    // quality=25, compliance=25, policy=25, staff=25 = 100
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("zero score is exactly 0", () => {
    const result = generateHrFilesIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });
});
