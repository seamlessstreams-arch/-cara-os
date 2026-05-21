import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getFilingCabinetCategoryLabel,
  getFilingCabinetOutcomeLabel,
  getRatingLabel,
  evaluateFilingCabinetQuality,
  evaluateFilingCabinetCompliance,
  evaluateFilingCabinetPolicy,
  evaluateStaffFilingCabinetReadiness,
  buildChildFilingCabinetProfiles,
  generateFilingCabinetIntelligence,
} from "../filing-cabinet-intelligence-engine";
import type {
  FilingCabinetRecord,
  FilingCabinetPolicy,
  StaffFilingCabinetTraining,
  FilingCabinetCategory,
} from "../filing-cabinet-intelligence-engine";

// ── Test helpers ───────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<FilingCabinetRecord> = {}): FilingCabinetRecord {
  return {
    id: "fc-1",
    homeId: "home-oak",
    date: "2026-03-15",
    childId: "child-alex",
    childName: "Alex",
    category: "care_plan_filing",
    outcome: "correctly_filed",
    correctCategoryAssigned: true,
    retentionPolicyApplied: true,
    sensitivityMarked: true,
    accessControlSet: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<FilingCabinetPolicy> = {}): FilingCabinetPolicy {
  return {
    documentManagementPolicy: true,
    retentionSchedulePolicy: true,
    dataProtectionFilingPolicy: true,
    accessControlPolicy: true,
    documentDestructionPolicy: true,
    auditTrailPolicy: true,
    backupAndRecoveryPolicy: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffFilingCabinetTraining> = {}): StaffFilingCabinetTraining {
  return {
    staffId: "staff-sarah",
    documentManagementKnowledge: true,
    dataProtectionSkills: true,
    retentionPolicyKnowledge: true,
    accessControlSkills: true,
    auditTrailSkills: true,
    documentDestructionProcedure: true,
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

describe("getFilingCabinetCategoryLabel", () => {
  it("returns label for care_plan_filing", () => {
    expect(getFilingCabinetCategoryLabel("care_plan_filing")).toBe("Care Plan Filing");
  });
  it("returns label for risk_assessment_filing", () => {
    expect(getFilingCabinetCategoryLabel("risk_assessment_filing")).toBe("Risk Assessment Filing");
  });
  it("returns label for medical_record_filing", () => {
    expect(getFilingCabinetCategoryLabel("medical_record_filing")).toBe("Medical Record Filing");
  });
  it("returns label for education_record_filing", () => {
    expect(getFilingCabinetCategoryLabel("education_record_filing")).toBe("Education Record Filing");
  });
  it("returns label for safeguarding_record_filing", () => {
    expect(getFilingCabinetCategoryLabel("safeguarding_record_filing")).toBe("Safeguarding Record Filing");
  });
  it("returns label for placement_record_filing", () => {
    expect(getFilingCabinetCategoryLabel("placement_record_filing")).toBe("Placement Record Filing");
  });
  it("returns label for correspondence_filing", () => {
    expect(getFilingCabinetCategoryLabel("correspondence_filing")).toBe("Correspondence Filing");
  });
  it("returns label for legal_document_filing", () => {
    expect(getFilingCabinetCategoryLabel("legal_document_filing")).toBe("Legal Document Filing");
  });
});

describe("getFilingCabinetOutcomeLabel", () => {
  it("returns label for correctly_filed", () => {
    expect(getFilingCabinetOutcomeLabel("correctly_filed")).toBe("Correctly Filed");
  });
  it("returns label for partially_filed", () => {
    expect(getFilingCabinetOutcomeLabel("partially_filed")).toBe("Partially Filed");
  });
  it("returns label for misfiled", () => {
    expect(getFilingCabinetOutcomeLabel("misfiled")).toBe("Misfiled");
  });
  it("returns label for unfiled", () => {
    expect(getFilingCabinetOutcomeLabel("unfiled")).toBe("Unfiled");
  });
  it("returns label for not_applicable", () => {
    expect(getFilingCabinetOutcomeLabel("not_applicable")).toBe("Not Applicable");
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

// ── evaluateFilingCabinetQuality ──────────────────────────────────────────

describe("evaluateFilingCabinetQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateFilingCabinetQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.correctCategoryAssignedRate).toBe(0);
    expect(result.retentionPolicyAppliedRate).toBe(0);
    expect(result.sensitivityMarkedRate).toBe(0);
    expect(result.accessControlSetRate).toBe(0);
  });

  it("returns 25 for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "fc-2" })];
    const result = evaluateFilingCabinetQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.correctCategoryAssignedRate).toBe(100);
    expect(result.retentionPolicyAppliedRate).toBe(100);
    expect(result.sensitivityMarkedRate).toBe(100);
    expect(result.accessControlSetRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({ correctCategoryAssigned: false, retentionPolicyApplied: false, sensitivityMarked: false, accessControlSet: false })];
    const result = evaluateFilingCabinetQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("calculates correct mixed score", () => {
    const records = [
      makeRecord({ correctCategoryAssigned: true, retentionPolicyApplied: true, sensitivityMarked: false, accessControlSet: false }),
      makeRecord({ id: "fc-2", correctCategoryAssigned: true, retentionPolicyApplied: false, sensitivityMarked: true, accessControlSet: false }),
    ];
    const result = evaluateFilingCabinetQuality(records);
    // category: 100% -> 7, retention: 50% -> 3, sensitivity: 50% -> 3, access: 0% -> 0 = 13
    expect(result.correctCategoryAssignedRate).toBe(100);
    expect(result.retentionPolicyAppliedRate).toBe(50);
    expect(result.sensitivityMarkedRate).toBe(50);
    expect(result.accessControlSetRate).toBe(0);
    expect(result.overallScore).toBe(13);
  });

  it("handles single record with all true", () => {
    const result = evaluateFilingCabinetQuality([makeRecord()]);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(1);
  });

  it("score never exceeds 25", () => {
    const records = Array.from({ length: 20 }, (_, i) => makeRecord({ id: `fc-${i}` }));
    const result = evaluateFilingCabinetQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const records = [makeRecord({ correctCategoryAssigned: false, retentionPolicyApplied: false, sensitivityMarked: false, accessControlSet: false })];
    const result = evaluateFilingCabinetQuality(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("calculates weighted score for partial booleans", () => {
    // Only correctCategoryAssigned true => 7 points
    const records = [makeRecord({ retentionPolicyApplied: false, sensitivityMarked: false, accessControlSet: false })];
    const result = evaluateFilingCabinetQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("calculates weighted score for only retention true", () => {
    const records = [makeRecord({ correctCategoryAssigned: false, sensitivityMarked: false, accessControlSet: false })];
    const result = evaluateFilingCabinetQuality(records);
    expect(result.overallScore).toBe(6);
  });
});

// ── evaluateFilingCabinetCompliance ───────────────────────────────────────

describe("evaluateFilingCabinetCompliance", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateFilingCabinetCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.correctCategoryAssignedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("returns full score for perfect compliance with all 8 categories", () => {
    const categories: FilingCabinetCategory[] = [
      "care_plan_filing", "risk_assessment_filing", "medical_record_filing", "education_record_filing",
      "safeguarding_record_filing", "placement_record_filing", "correspondence_filing", "legal_document_filing",
    ];
    const records = categories.map((c, i) => makeRecord({ id: `fc-${i}`, category: c }));
    const result = evaluateFilingCabinetCompliance(records);
    // doc: 100% -> 8, timely: 100% -> 7, category: 100% -> 5, diversity: 1.0 -> 5 = 25
    expect(result.overallScore).toBe(25);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
  });

  it("returns minimal score for all-false compliance fields with 1 category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, correctCategoryAssigned: false })];
    const result = evaluateFilingCabinetCompliance(records);
    // doc: 0, timely: 0, category: 0, diversity: 1/8=0.13 -> 0.13*5=0.65 -> rounds to 0.6
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.correctCategoryAssignedRate).toBe(0);
    expect(result.overallScore).toBe(0.7);
  });

  it("calculates categoryDiversityRatio correctly for 4 categories", () => {
    const records = [
      makeRecord({ id: "fc-1", category: "care_plan_filing" }),
      makeRecord({ id: "fc-2", category: "risk_assessment_filing" }),
      makeRecord({ id: "fc-3", category: "medical_record_filing" }),
      makeRecord({ id: "fc-4", category: "education_record_filing" }),
    ];
    const result = evaluateFilingCabinetCompliance(records);
    expect(result.categoryDiversityRatio).toBe(0.5);
    expect(result.uniqueCategories).toBe(4);
  });

  it("handles partial compliance", () => {
    const records = [
      makeRecord({ id: "fc-1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "fc-2", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluateFilingCabinetCompliance(records);
    expect(result.documentationCompleteRate).toBe(50);
    expect(result.timelyRecordingRate).toBe(50);
  });

  it("diversity ratio uses Math.round formula", () => {
    const records = [
      makeRecord({ id: "fc-1", category: "care_plan_filing" }),
      makeRecord({ id: "fc-2", category: "risk_assessment_filing" }),
      makeRecord({ id: "fc-3", category: "medical_record_filing" }),
    ];
    const result = evaluateFilingCabinetCompliance(records);
    // 3/8 = 0.375 -> Math.round(0.375 * 100) / 100 = 0.38
    expect(result.categoryDiversityRatio).toBe(0.38);
  });

  it("score never exceeds 25", () => {
    const categories: FilingCabinetCategory[] = [
      "care_plan_filing", "risk_assessment_filing", "medical_record_filing", "education_record_filing",
      "safeguarding_record_filing", "placement_record_filing", "correspondence_filing", "legal_document_filing",
    ];
    const records = categories.map((c, i) => makeRecord({ id: `fc-${i}`, category: c }));
    const result = evaluateFilingCabinetCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("diversity ratio for 1 category", () => {
    const records = [makeRecord({ id: "fc-1", category: "care_plan_filing" })];
    const result = evaluateFilingCabinetCompliance(records);
    // 1/8 = 0.125 -> Math.round(0.125 * 100) / 100 = 0.13
    expect(result.categoryDiversityRatio).toBe(0.13);
    expect(result.uniqueCategories).toBe(1);
  });

  it("diversity ratio for 2 categories", () => {
    const records = [
      makeRecord({ id: "fc-1", category: "care_plan_filing" }),
      makeRecord({ id: "fc-2", category: "risk_assessment_filing" }),
    ];
    const result = evaluateFilingCabinetCompliance(records);
    // 2/8 = 0.25
    expect(result.categoryDiversityRatio).toBe(0.25);
  });
});

// ── evaluateFilingCabinetPolicy ───────────────────────────────────────────

describe("evaluateFilingCabinetPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateFilingCabinetPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.documentManagementPolicy).toBe(false);
    expect(result.retentionSchedulePolicy).toBe(false);
    expect(result.dataProtectionFilingPolicy).toBe(false);
    expect(result.accessControlPolicy).toBe(false);
    expect(result.documentDestructionPolicy).toBe(false);
    expect(result.auditTrailPolicy).toBe(false);
    expect(result.backupAndRecoveryPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateFilingCabinetPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateFilingCabinetPolicy(makePolicy({
      documentManagementPolicy: false,
      retentionSchedulePolicy: false,
      dataProtectionFilingPolicy: false,
      accessControlPolicy: false,
      documentDestructionPolicy: false,
      auditTrailPolicy: false,
      backupAndRecoveryPolicy: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("returns partial score correctly for 4-weight policies only", () => {
    // Only the 4-weight policies: 4+4+4+4 = 16
    const result = evaluateFilingCabinetPolicy(makePolicy({
      documentDestructionPolicy: false,
      auditTrailPolicy: false,
      backupAndRecoveryPolicy: false,
    }));
    expect(result.overallScore).toBe(16);
  });

  it("returns correct score for only 3-weight policies", () => {
    // Only the 3-weight policies: 3+3+3 = 9
    const result = evaluateFilingCabinetPolicy(makePolicy({
      documentManagementPolicy: false,
      retentionSchedulePolicy: false,
      dataProtectionFilingPolicy: false,
      accessControlPolicy: false,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("reflects boolean values in result", () => {
    const result = evaluateFilingCabinetPolicy(makePolicy({ documentManagementPolicy: false, backupAndRecoveryPolicy: false }));
    expect(result.documentManagementPolicy).toBe(false);
    expect(result.retentionSchedulePolicy).toBe(true);
    expect(result.backupAndRecoveryPolicy).toBe(false);
  });

  it("score never exceeds 25", () => {
    const result = evaluateFilingCabinetPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("single 4-weight policy gives score of 4", () => {
    const result = evaluateFilingCabinetPolicy(makePolicy({
      retentionSchedulePolicy: false,
      dataProtectionFilingPolicy: false,
      accessControlPolicy: false,
      documentDestructionPolicy: false,
      auditTrailPolicy: false,
      backupAndRecoveryPolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("single 3-weight policy gives score of 3", () => {
    const result = evaluateFilingCabinetPolicy(makePolicy({
      documentManagementPolicy: false,
      retentionSchedulePolicy: false,
      dataProtectionFilingPolicy: false,
      accessControlPolicy: false,
      auditTrailPolicy: false,
      backupAndRecoveryPolicy: false,
    }));
    expect(result.overallScore).toBe(3);
  });
});

// ── evaluateStaffFilingCabinetReadiness ───────────────────────────────────

describe("evaluateStaffFilingCabinetReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffFilingCabinetReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.documentManagementKnowledgeRate).toBe(0);
    expect(result.dataProtectionSkillsRate).toBe(0);
    expect(result.retentionPolicyKnowledgeRate).toBe(0);
    expect(result.accessControlSkillsRate).toBe(0);
    expect(result.auditTrailSkillsRate).toBe(0);
    expect(result.documentDestructionProcedureRate).toBe(0);
  });

  it("returns 25 for all-true training", () => {
    const training = [makeTraining(), makeTraining({ staffId: "staff-tom" })];
    const result = evaluateStaffFilingCabinetReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false training", () => {
    const training = [makeTraining({
      documentManagementKnowledge: false,
      dataProtectionSkills: false,
      retentionPolicyKnowledge: false,
      accessControlSkills: false,
      auditTrailSkills: false,
      documentDestructionProcedure: false,
    })];
    const result = evaluateStaffFilingCabinetReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("handles partial training", () => {
    const training = [
      makeTraining({ staffId: "staff-1" }),
      makeTraining({ staffId: "staff-2", documentManagementKnowledge: false, documentDestructionProcedure: false }),
    ];
    const result = evaluateStaffFilingCabinetReadiness(training);
    expect(result.documentManagementKnowledgeRate).toBe(50);
    expect(result.documentDestructionProcedureRate).toBe(50);
    expect(result.dataProtectionSkillsRate).toBe(100);
  });

  it("calculates weighted score correctly for single staff — only document management knowledge", () => {
    // Only document management knowledge = 6 * 1 = 6
    const training = [makeTraining({
      dataProtectionSkills: false,
      retentionPolicyKnowledge: false,
      accessControlSkills: false,
      auditTrailSkills: false,
      documentDestructionProcedure: false,
    })];
    const result = evaluateStaffFilingCabinetReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("calculates weighted score for data protection only", () => {
    const training = [makeTraining({
      documentManagementKnowledge: false,
      retentionPolicyKnowledge: false,
      accessControlSkills: false,
      auditTrailSkills: false,
      documentDestructionProcedure: false,
    })];
    const result = evaluateStaffFilingCabinetReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("calculates weighted score for document destruction only", () => {
    const training = [makeTraining({
      documentManagementKnowledge: false,
      dataProtectionSkills: false,
      retentionPolicyKnowledge: false,
      accessControlSkills: false,
      auditTrailSkills: false,
    })];
    const result = evaluateStaffFilingCabinetReadiness(training);
    expect(result.overallScore).toBe(2);
  });

  it("score never exceeds 25", () => {
    const training = Array.from({ length: 10 }, (_, i) => makeTraining({ staffId: `staff-${i}` }));
    const result = evaluateStaffFilingCabinetReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const training = [makeTraining({
      documentManagementKnowledge: false,
      dataProtectionSkills: false,
      retentionPolicyKnowledge: false,
      accessControlSkills: false,
      auditTrailSkills: false,
      documentDestructionProcedure: false,
    })];
    const result = evaluateStaffFilingCabinetReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── buildChildFilingCabinetProfiles ───────────────────────────────────────

describe("buildChildFilingCabinetProfiles", () => {
  it("returns empty array for empty records", () => {
    const profiles = buildChildFilingCabinetProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("builds profile for single child", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", childName: "Alex", category: "care_plan_filing" }),
      makeRecord({ id: "fc-2", childId: "child-alex", childName: "Alex", category: "risk_assessment_filing" }),
    ];
    const profiles = buildChildFilingCabinetProfiles(records);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalRecords).toBe(2);
  });

  it("builds profiles for multiple children", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "fc-2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "fc-3", childId: "child-morgan", childName: "Morgan" }),
    ];
    const profiles = buildChildFilingCabinetProfiles(records);
    expect(profiles).toHaveLength(3);
    const ids = profiles.map((p) => p.childId);
    expect(ids).toContain("child-alex");
    expect(ids).toContain("child-jordan");
    expect(ids).toContain("child-morgan");
  });

  it("calculates correctCategoryAssignedRate correctly", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", correctCategoryAssigned: true }),
      makeRecord({ id: "fc-2", childId: "child-alex", correctCategoryAssigned: false }),
    ];
    const profiles = buildChildFilingCabinetProfiles(records);
    expect(profiles[0].correctCategoryAssignedRate).toBe(50);
  });

  it("calculates retentionPolicyAppliedRate correctly", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", retentionPolicyApplied: true }),
      makeRecord({ id: "fc-2", childId: "child-alex", retentionPolicyApplied: true }),
      makeRecord({ id: "fc-3", childId: "child-alex", retentionPolicyApplied: false }),
    ];
    const profiles = buildChildFilingCabinetProfiles(records);
    expect(profiles[0].retentionPolicyAppliedRate).toBe(67);
  });

  it("tracks categoriesCovered", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", category: "care_plan_filing" }),
      makeRecord({ id: "fc-2", childId: "child-alex", category: "risk_assessment_filing" }),
      makeRecord({ id: "fc-3", childId: "child-alex", category: "care_plan_filing" }),
    ];
    const profiles = buildChildFilingCabinetProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
    expect(profiles[0].categoriesCovered).toContain("care_plan_filing");
    expect(profiles[0].categoriesCovered).toContain("risk_assessment_filing");
  });

  it("frequency score: 0 for <5 records", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
    ];
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=0, rate1=0 (0%), rate2=0 (0%), diversity=0 (1 cat)
    expect(profiles[0].overallScore).toBe(0);
  });

  it("frequency score: 1 for 5-9 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `fc-${i}`, childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false, category: "care_plan_filing" }),
    );
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=1, rate1=0, rate2=0, diversity=0 (1 cat) = 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("frequency score: 2 for 10+ records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `fc-${i}`, childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false, category: "care_plan_filing" }),
    );
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=2, rate1=0, rate2=0, diversity=0 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("rate1 score: 3 for >=80% category assignment rate", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `fc-${i}`, childId: "child-alex", correctCategoryAssigned: true, retentionPolicyApplied: false }),
    );
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=1, rate1=3 (100%), rate2=0, diversity=0 = 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("rate1 score: 2 for 60-79% category assignment rate", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", correctCategoryAssigned: true, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-2", childId: "child-alex", correctCategoryAssigned: true, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-3", childId: "child-alex", correctCategoryAssigned: true, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-4", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-5", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
    ];
    // category: 3/5 = 60%
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=1, rate1=2 (60%), rate2=0, diversity=0 = 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("rate1 score: 1 for 40-59% category assignment rate", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", correctCategoryAssigned: true, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-2", childId: "child-alex", correctCategoryAssigned: true, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-3", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-4", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-5", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
    ];
    // category: 2/5 = 40%
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=1, rate1=1 (40%), rate2=0, diversity=0 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("rate1 score: 0 for <40% category assignment rate", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", correctCategoryAssigned: true, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-2", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-3", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-4", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-5", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
    ];
    // category: 1/5 = 20%
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=1, rate1=0 (20%), rate2=0, diversity=0 = 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("rate2 score: 3 for >=80% retention policy rate", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `fc-${i}`, childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: true }),
    );
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=1, rate1=0, rate2=3 (100%), diversity=0 = 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("rate2 score: 2 for 60-79% retention policy rate", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: true }),
      makeRecord({ id: "fc-2", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: true }),
      makeRecord({ id: "fc-3", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: true }),
      makeRecord({ id: "fc-4", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-5", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
    ];
    // retention: 3/5 = 60%
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=1, rate1=0, rate2=2 (60%), diversity=0 = 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("diversity score: 2 for >=4 categories", () => {
    const categories: FilingCabinetCategory[] = ["care_plan_filing", "risk_assessment_filing", "medical_record_filing", "education_record_filing"];
    const records = categories.map((c, i) =>
      makeRecord({ id: `fc-${i}`, childId: "child-alex", category: c, correctCategoryAssigned: false, retentionPolicyApplied: false }),
    );
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=0, rate1=0, rate2=0, diversity=2 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("diversity score: 1 for 2-3 categories", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", category: "care_plan_filing", correctCategoryAssigned: false, retentionPolicyApplied: false }),
      makeRecord({ id: "fc-2", childId: "child-alex", category: "risk_assessment_filing", correctCategoryAssigned: false, retentionPolicyApplied: false }),
    ];
    const profiles = buildChildFilingCabinetProfiles(records);
    // freq=0, rate1=0, rate2=0, diversity=1 = 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("diversity score: 0 for 1 category", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", category: "care_plan_filing", correctCategoryAssigned: false, retentionPolicyApplied: false }),
    ];
    const profiles = buildChildFilingCabinetProfiles(records);
    expect(profiles[0].overallScore).toBe(0);
  });

  it("overallScore capped at 10", () => {
    // Max possible: freq=2(10+), rate1=3(100%), rate2=3(100%), diversity=2(4+) = 10
    const categories: FilingCabinetCategory[] = ["care_plan_filing", "risk_assessment_filing", "medical_record_filing", "education_record_filing"];
    const records: FilingCabinetRecord[] = [];
    for (let i = 0; i < 12; i++) {
      records.push(makeRecord({ id: `fc-${i}`, childId: "child-alex", category: categories[i % 4] }));
    }
    const profiles = buildChildFilingCabinetProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("overallScore is never negative", () => {
    const records = [
      makeRecord({ id: "fc-1", childId: "child-alex", correctCategoryAssigned: false, retentionPolicyApplied: false }),
    ];
    const profiles = buildChildFilingCabinetProfiles(records);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── generateFilingCabinetIntelligence (orchestrator) ──────────────────────

describe("generateFilingCabinetIntelligence", () => {
  const fullRecords: FilingCabinetRecord[] = [
    makeRecord({ id: "fc-1", date: "2026-02-01", childId: "child-alex", childName: "Alex", category: "care_plan_filing" }),
    makeRecord({ id: "fc-2", date: "2026-02-15", childId: "child-alex", childName: "Alex", category: "risk_assessment_filing" }),
    makeRecord({ id: "fc-3", date: "2026-03-01", childId: "child-alex", childName: "Alex", category: "medical_record_filing" }),
    makeRecord({ id: "fc-4", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "education_record_filing" }),
    makeRecord({ id: "fc-5", date: "2026-02-10", childId: "child-jordan", childName: "Jordan", category: "safeguarding_record_filing" }),
    makeRecord({ id: "fc-6", date: "2026-02-20", childId: "child-jordan", childName: "Jordan", category: "placement_record_filing" }),
    makeRecord({ id: "fc-7", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "correspondence_filing" }),
    makeRecord({ id: "fc-8", date: "2026-03-20", childId: "child-jordan", childName: "Jordan", category: "legal_document_filing" }),
    makeRecord({ id: "fc-9", date: "2026-02-05", childId: "child-morgan", childName: "Morgan", category: "care_plan_filing" }),
    makeRecord({ id: "fc-10", date: "2026-03-05", childId: "child-morgan", childName: "Morgan", category: "medical_record_filing" }),
    makeRecord({ id: "fc-11", date: "2026-03-25", childId: "child-morgan", childName: "Morgan", category: "education_record_filing" }),
    makeRecord({ id: "fc-12", date: "2026-04-01", childId: "child-morgan", childName: "Morgan", category: "safeguarding_record_filing" }),
  ];

  it("generates full intelligence report", () => {
    const result = generateFilingCabinetIntelligence({
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
    expect(result.filingCabinetQuality).toBeDefined();
    expect(result.filingCabinetCompliance).toBeDefined();
    expect(result.filingCabinetPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("handles empty records", () => {
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.filingCabinetQuality.overallScore).toBe(0);
    expect(result.filingCabinetCompliance.overallScore).toBe(0);
    expect(result.childProfiles).toEqual([]);
  });

  it("handles null policy", () => {
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: null,
      staff: [makeTraining()],
    });

    expect(result.filingCabinetPolicy.overallScore).toBe(0);
    expect(result.filingCabinetPolicy.documentManagementPolicy).toBe(false);
    expect(result.areasForImprovement).toEqual(expect.arrayContaining([expect.stringContaining("No document management policy")]));
    expect(result.actions).toEqual(expect.arrayContaining([expect.stringContaining("URGENT")]));
  });

  it("handles empty staff", () => {
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [],
    });

    expect(result.staffReadiness.overallScore).toBe(0);
    expect(result.staffReadiness.totalStaff).toBe(0);
    expect(result.areasForImprovement).toEqual(expect.arrayContaining([expect.stringContaining("No staff document management training")]));
  });

  it("filters records by date range", () => {
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2026-03-01",
      periodEnd: "2026-03-31",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.filingCabinetQuality.totalRecords).toBeLessThan(fullRecords.length);
    expect(result.filingCabinetQuality.totalRecords).toBeGreaterThan(0);
  });

  it("excludes records outside date range", () => {
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2027-01-01",
      periodEnd: "2027-12-31",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.filingCabinetQuality.totalRecords).toBe(0);
    expect(result.childProfiles).toEqual([]);
  });

  it("overall score is capped at 100", () => {
    const result = generateFilingCabinetIntelligence({
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
    const result = generateFilingCabinetIntelligence({
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
    const result = generateFilingCabinetIntelligence({
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
    const result = generateFilingCabinetIntelligence({
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
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.actions).toEqual(expect.arrayContaining([
      expect.stringContaining("URGENT: No document management policy"),
      expect.stringContaining("URGENT: No staff document management training"),
    ]));
  });

  it("generates default action when no issues", () => {
    const categories: FilingCabinetCategory[] = [
      "care_plan_filing", "risk_assessment_filing", "medical_record_filing", "education_record_filing",
      "safeguarding_record_filing", "placement_record_filing", "correspondence_filing", "legal_document_filing",
    ];
    const perfectRecords = categories.map((c, i) =>
      makeRecord({ id: `fc-${i}`, date: "2026-03-15", childId: "child-alex", childName: "Alex", category: c }),
    );
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: perfectRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.actions).toContain("No immediate actions required. Filing cabinet systems operating within expected standards.");
  });

  it("includes all 7 regulatory links", () => {
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 36 — Record keeping");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 37 — Record access");
    expect(result.regulatoryLinks).toContain("Data Protection Act 2018 — GDPR compliance");
    expect(result.regulatoryLinks).toContain("NMS 22 — Records and data");
    expect(result.regulatoryLinks).toContain("SCCIF — Leadership and management");
    expect(result.regulatoryLinks).toContain("Children Act 1989 s.26 — Case records");
    expect(result.regulatoryLinks).toContain("Quality Standards 2015 Standard 9");
  });

  it("generates child profiles from filtered records", () => {
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: fullRecords,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    expect(result.childProfiles.length).toBe(3);
    const childIds = result.childProfiles.map((p) => p.childId);
    expect(childIds).toContain("child-alex");
    expect(childIds).toContain("child-jordan");
    expect(childIds).toContain("child-morgan");
  });

  it("rating is outstanding for score >= 80", () => {
    const categories: FilingCabinetCategory[] = [
      "care_plan_filing", "risk_assessment_filing", "medical_record_filing", "education_record_filing",
      "safeguarding_record_filing", "placement_record_filing", "correspondence_filing", "legal_document_filing",
    ];
    const perfectRecords = categories.map((c, i) =>
      makeRecord({ id: `fc-${i}`, date: "2026-03-15", childId: "child-alex", category: c }),
    );
    const result = generateFilingCabinetIntelligence({
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
    const result = generateFilingCabinetIntelligence({
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

  it("actions mention low scoring children", () => {
    const records = [
      makeRecord({
        id: "fc-1", date: "2026-03-01", childId: "child-low", childName: "Low",
        correctCategoryAssigned: false, retentionPolicyApplied: false, sensitivityMarked: false, accessControlSet: false,
        documentationComplete: false, timelyRecording: false,
      }),
    ];
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });

    const lowChild = result.childProfiles.find((p) => p.childId === "child-low");
    expect(lowChild).toBeDefined();
    expect(lowChild!.overallScore).toBeLessThanOrEqual(3);
    expect(result.actions).toEqual(expect.arrayContaining([expect.stringContaining("child(ren) with low filing management scores")]));
  });

  it("handles everything empty — zero overall score", () => {
    const result = generateFilingCabinetIntelligence({
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

  it("perfect score generates outstanding rating", () => {
    const categories: FilingCabinetCategory[] = [
      "care_plan_filing", "risk_assessment_filing", "medical_record_filing", "education_record_filing",
      "safeguarding_record_filing", "placement_record_filing", "correspondence_filing", "legal_document_filing",
    ];
    const perfectRecords = categories.map((c, i) =>
      makeRecord({ id: `fc-${i}`, date: "2026-03-15", childId: "child-alex", category: c }),
    );
    const result = generateFilingCabinetIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: perfectRecords,
      policy: makePolicy(),
      staff: [makeTraining(), makeTraining({ staffId: "staff-tom" })],
    });

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });
});
