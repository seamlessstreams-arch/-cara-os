import { describe, it, expect } from "vitest";
import {
  getRating,
  getPrivacyCategoryLabel,
  getPrivacyOutcomeLabel,
  getRatingLabel,
  evaluatePrivacyQuality,
  evaluatePrivacyCompliance,
  evaluatePrivacyPolicy,
  evaluateStaffPrivacyReadiness,
  buildChildPrivacyProfiles,
  generatePrivacyIntelligence,
} from "../privacy-engine";
import type {
  PrivacyRecord,
  PrivacyPolicy,
  StaffPrivacyTraining,
} from "../privacy-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<PrivacyRecord> = {}): PrivacyRecord {
  return {
    id: "rec-1",
    homeId: "oak-house",
    date: "2026-03-15",
    childId: "child-1",
    childName: "Test Child",
    category: "personal_space",
    outcome: "fully_respected",
    personalSpaceRespected: true,
    confidentialityMaintained: true,
    dignityPreserved: true,
    consentObtained: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<PrivacyPolicy> = {}): PrivacyPolicy {
  return {
    privacyPolicy: true,
    confidentialityProcedure: true,
    dataProtectionPolicy: true,
    dignityInCarePolicy: true,
    consentFramework: true,
    digitalPrivacyPolicy: true,
    informationSharingProtocol: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffPrivacyTraining> = {}): StaffPrivacyTraining {
  return {
    staffId: "staff-1",
    dataProtectionTraining: true,
    confidentialityAwareness: true,
    dignityInCareTraining: true,
    consentPractice: true,
    digitalPrivacySkills: true,
    informationSharingKnowledge: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("getPrivacyCategoryLabel", () => {
  it("returns human-readable labels for all 8 categories", () => {
    expect(getPrivacyCategoryLabel("personal_space")).toBe("Personal Space");
    expect(getPrivacyCategoryLabel("confidentiality")).toBe("Confidentiality");
    expect(getPrivacyCategoryLabel("dignity_care")).toBe("Dignity in Care");
    expect(getPrivacyCategoryLabel("data_protection")).toBe("Data Protection");
    expect(getPrivacyCategoryLabel("communication_privacy")).toBe("Communication Privacy");
    expect(getPrivacyCategoryLabel("medical_privacy")).toBe("Medical Privacy");
    expect(getPrivacyCategoryLabel("family_contact_privacy")).toBe("Family Contact Privacy");
    expect(getPrivacyCategoryLabel("digital_privacy")).toBe("Digital Privacy");
  });
});

describe("getPrivacyOutcomeLabel", () => {
  it("returns human-readable labels for all 5 outcomes", () => {
    expect(getPrivacyOutcomeLabel("fully_respected")).toBe("Fully Respected");
    expect(getPrivacyOutcomeLabel("minor_breach")).toBe("Minor Breach");
    expect(getPrivacyOutcomeLabel("significant_breach")).toBe("Significant Breach");
    expect(getPrivacyOutcomeLabel("privacy_violation")).toBe("Privacy Violation");
    expect(getPrivacyOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getRatingLabel", () => {
  it("formats rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: Privacy Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePrivacyQuality", () => {
  it("returns zeros for empty records", () => {
    const result = evaluatePrivacyQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.personalSpaceRespectedRate).toBeNull();
    expect(result.confidentialityMaintainedRate).toBeNull();
    expect(result.dignityPreservedRate).toBeNull();
    expect(result.consentObtainedRate).toBeNull();
  });

  it("returns max score (25) for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" })];
    const result = evaluatePrivacyQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(2);
    expect(result.personalSpaceRespectedRate).toBe(100);
    expect(result.confidentialityMaintainedRate).toBe(100);
    expect(result.dignityPreservedRate).toBe(100);
    expect(result.consentObtainedRate).toBe(100);
  });

  it("returns 0 score for all-false records", () => {
    const records = [makeRecord({
      personalSpaceRespected: false,
      confidentialityMaintained: false,
      dignityPreserved: false,
      consentObtained: false,
    })];
    const result = evaluatePrivacyQuality(records);
    expect(result.overallScore).toBe(0);
    expect(result.personalSpaceRespectedRate).toBe(0);
  });

  it("calculates mixed rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", personalSpaceRespected: true, confidentialityMaintained: true, dignityPreserved: false, consentObtained: false }),
      makeRecord({ id: "r2", personalSpaceRespected: true, confidentialityMaintained: false, dignityPreserved: true, consentObtained: false }),
    ];
    const result = evaluatePrivacyQuality(records);
    expect(result.personalSpaceRespectedRate).toBe(100);
    expect(result.confidentialityMaintainedRate).toBe(50);
    expect(result.dignityPreservedRate).toBe(50);
    expect(result.consentObtainedRate).toBe(0);
  });

  it("applies correct weights (7+6+6+6=25)", () => {
    // All rates at 100% -> raw = 7+6+6+6 = 25
    const records = [makeRecord()];
    const result = evaluatePrivacyQuality(records);
    expect(result.overallScore).toBe(25);

    // Only personalSpaceRespected at 100% -> raw = 7
    const records2 = [makeRecord({
      confidentialityMaintained: false,
      dignityPreserved: false,
      consentObtained: false,
    })];
    const result2 = evaluatePrivacyQuality(records2);
    expect(result2.overallScore).toBe(7);
  });

  it("caps score at 25", () => {
    const records = [makeRecord()];
    const result = evaluatePrivacyQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("only confidentialityMaintained true gives weight-6 score", () => {
    const records = [makeRecord({
      personalSpaceRespected: false,
      dignityPreserved: false,
      consentObtained: false,
    })];
    const result = evaluatePrivacyQuality(records);
    expect(result.overallScore).toBe(6);
    expect(result.confidentialityMaintainedRate).toBe(100);
  });

  it("handles large record sets", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `r-${i}`, personalSpaceRespected: i % 2 === 0 }),
    );
    const result = evaluatePrivacyQuality(records);
    expect(result.personalSpaceRespectedRate).toBe(50);
    expect(result.totalRecords).toBe(100);
  });

  it("only dignityPreserved true gives weight-6 score", () => {
    const records = [makeRecord({
      personalSpaceRespected: false,
      confidentialityMaintained: false,
      consentObtained: false,
    })];
    const result = evaluatePrivacyQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("only consentObtained true gives weight-6 score", () => {
    const records = [makeRecord({
      personalSpaceRespected: false,
      confidentialityMaintained: false,
      dignityPreserved: false,
    })];
    const result = evaluatePrivacyQuality(records);
    expect(result.overallScore).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Privacy Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePrivacyCompliance", () => {
  it("returns zeros for empty records", () => {
    const result = evaluatePrivacyCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationRate).toBeNull();
    expect(result.timelyRecordingRate).toBeNull();
    expect(result.confidentialityMaintainedRate).toBeNull();
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("returns max score for all-true records with full category coverage", () => {
    const categories: Array<PrivacyRecord["category"]> = [
      "personal_space", "confidentiality", "dignity_care", "data_protection",
      "communication_privacy", "medical_privacy", "family_contact_privacy", "digital_privacy",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluatePrivacyCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.uniqueCategories).toBe(8);
    expect(result.categoryDiversityRatio).toBe(1);
  });

  it("calculates documentation and timely rates", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "r2", documentationComplete: true, timelyRecording: false }),
      makeRecord({ id: "r3", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluatePrivacyCompliance(records);
    expect(result.documentationRate).toBe(67);
    expect(result.timelyRecordingRate).toBe(33);
  });

  it("calculates categoryDiversityRatio as decimal", () => {
    // 1 out of 8 categories -> Math.round((1/8)*100)/100 = 0.13
    const records = [makeRecord({ category: "personal_space" })];
    const result = evaluatePrivacyCompliance(records);
    expect(result.categoryDiversityRatio).toBe(0.13);
    expect(result.uniqueCategories).toBe(1);
  });

  it("two categories gives 0.25 diversity ratio", () => {
    const records = [
      makeRecord({ id: "r1", category: "personal_space" }),
      makeRecord({ id: "r2", category: "confidentiality" }),
    ];
    const result = evaluatePrivacyCompliance(records);
    expect(result.categoryDiversityRatio).toBe(0.25);
    expect(result.uniqueCategories).toBe(2);
  });

  it("applies correct weights (8+7+5+5=25)", () => {
    const categories: Array<PrivacyRecord["category"]> = [
      "personal_space", "confidentiality", "dignity_care", "data_protection",
      "communication_privacy", "medical_privacy", "family_contact_privacy", "digital_privacy",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluatePrivacyCompliance(records);
    expect(result.overallScore).toBe(25);
  });

  it("returns low score for all-false compliance with single category", () => {
    const records = [makeRecord({
      documentationComplete: false,
      timelyRecording: false,
      confidentialityMaintained: false,
    })];
    const result = evaluatePrivacyCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.confidentialityMaintainedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0.13);
    // raw = 0 + 0 + 0 + 0.13*5 = 0.65 -> Math.round(0.65*10)/10 = 0.7
    expect(result.overallScore).toBe(0.7);
  });

  it("four categories gives 0.5 diversity ratio", () => {
    const records = [
      makeRecord({ id: "r1", category: "personal_space" }),
      makeRecord({ id: "r2", category: "confidentiality" }),
      makeRecord({ id: "r3", category: "dignity_care" }),
      makeRecord({ id: "r4", category: "data_protection" }),
    ];
    const result = evaluatePrivacyCompliance(records);
    expect(result.categoryDiversityRatio).toBe(0.5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Privacy Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePrivacyPolicy", () => {
  it("returns zeros for null policy", () => {
    const result = evaluatePrivacyPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.privacyPolicy).toBe(false);
    expect(result.confidentialityProcedure).toBe(false);
    expect(result.dataProtectionPolicy).toBe(false);
    expect(result.dignityInCarePolicy).toBe(false);
    expect(result.consentFramework).toBe(false);
    expect(result.digitalPrivacyPolicy).toBe(false);
    expect(result.informationSharingProtocol).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluatePrivacyPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluatePrivacyPolicy(makePolicy({
      privacyPolicy: false,
      confidentialityProcedure: false,
      dataProtectionPolicy: false,
      dignityInCarePolicy: false,
      consentFramework: false,
      digitalPrivacyPolicy: false,
      informationSharingProtocol: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("weights first 4 at 4 points each", () => {
    // Only first policy true -> 4
    const result = evaluatePrivacyPolicy(makePolicy({
      privacyPolicy: true,
      confidentialityProcedure: false,
      dataProtectionPolicy: false,
      dignityInCarePolicy: false,
      consentFramework: false,
      digitalPrivacyPolicy: false,
      informationSharingProtocol: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    // Only last 3 true -> 3+3+3=9
    const result = evaluatePrivacyPolicy(makePolicy({
      privacyPolicy: false,
      confidentialityProcedure: false,
      dataProtectionPolicy: false,
      dignityInCarePolicy: false,
      consentFramework: true,
      digitalPrivacyPolicy: true,
      informationSharingProtocol: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("handles partial policy (first 4 only = 16)", () => {
    const result = evaluatePrivacyPolicy(makePolicy({
      consentFramework: false,
      digitalPrivacyPolicy: false,
      informationSharingProtocol: false,
    }));
    expect(result.overallScore).toBe(16);
  });

  it("single middle policy gives 4 points", () => {
    const result = evaluatePrivacyPolicy(makePolicy({
      privacyPolicy: false,
      confidentialityProcedure: false,
      dataProtectionPolicy: true,
      dignityInCarePolicy: false,
      consentFramework: false,
      digitalPrivacyPolicy: false,
      informationSharingProtocol: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("preserves boolean values in result", () => {
    const result = evaluatePrivacyPolicy(makePolicy({
      privacyPolicy: true,
      confidentialityProcedure: false,
    }));
    expect(result.privacyPolicy).toBe(true);
    expect(result.confidentialityProcedure).toBe(false);
  });

  it("second policy alone gives 4 points", () => {
    const result = evaluatePrivacyPolicy(makePolicy({
      privacyPolicy: false,
      confidentialityProcedure: true,
      dataProtectionPolicy: false,
      dignityInCarePolicy: false,
      consentFramework: false,
      digitalPrivacyPolicy: false,
      informationSharingProtocol: false,
    }));
    expect(result.overallScore).toBe(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Privacy Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffPrivacyReadiness", () => {
  it("returns zeros for empty staff", () => {
    const result = evaluateStaffPrivacyReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.dataProtectionTrainingRate).toBeNull();
    expect(result.confidentialityAwarenessRate).toBeNull();
    expect(result.dignityInCareTrainingRate).toBeNull();
    expect(result.consentPracticeRate).toBeNull();
    expect(result.digitalPrivacySkillsRate).toBeNull();
    expect(result.informationSharingKnowledgeRate).toBeNull();
  });

  it("returns max score for all-true staff", () => {
    const staff = [makeTraining(), makeTraining({ staffId: "staff-2" })];
    const result = evaluateStaffPrivacyReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeTraining({
      dataProtectionTraining: false,
      confidentialityAwareness: false,
      dignityInCareTraining: false,
      consentPractice: false,
      digitalPrivacySkills: false,
      informationSharingKnowledge: false,
    })];
    const result = evaluateStaffPrivacyReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weights (6+5+5+4+3+2=25)", () => {
    // Only dataProtectionTraining true -> raw = 6
    const staff = [makeTraining({
      confidentialityAwareness: false,
      dignityInCareTraining: false,
      consentPractice: false,
      digitalPrivacySkills: false,
      informationSharingKnowledge: false,
    })];
    const result = evaluateStaffPrivacyReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("calculates mixed rates correctly", () => {
    const staff = [
      makeTraining({ staffId: "s1", dataProtectionTraining: true, confidentialityAwareness: true, dignityInCareTraining: false, consentPractice: false, digitalPrivacySkills: false, informationSharingKnowledge: false }),
      makeTraining({ staffId: "s2", dataProtectionTraining: true, confidentialityAwareness: false, dignityInCareTraining: true, consentPractice: false, digitalPrivacySkills: false, informationSharingKnowledge: false }),
    ];
    const result = evaluateStaffPrivacyReadiness(staff);
    expect(result.dataProtectionTrainingRate).toBe(100);
    expect(result.confidentialityAwarenessRate).toBe(50);
    expect(result.dignityInCareTrainingRate).toBe(50);
    expect(result.consentPracticeRate).toBe(0);
  });

  it("only informationSharingKnowledge true gives weight-2 score", () => {
    const staff = [makeTraining({
      dataProtectionTraining: false,
      confidentialityAwareness: false,
      dignityInCareTraining: false,
      consentPractice: false,
      digitalPrivacySkills: false,
      informationSharingKnowledge: true,
    })];
    const result = evaluateStaffPrivacyReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("3 staff with mixed skills", () => {
    const staff = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2", dataProtectionTraining: false, confidentialityAwareness: false }),
      makeTraining({ staffId: "s3", dignityInCareTraining: false, consentPractice: false, digitalPrivacySkills: false, informationSharingKnowledge: false }),
    ];
    const result = evaluateStaffPrivacyReadiness(staff);
    expect(result.totalStaff).toBe(3);
    expect(result.dataProtectionTrainingRate).toBe(67);
    expect(result.confidentialityAwarenessRate).toBe(67);
  });

  it("only digitalPrivacySkills true gives weight-3 score", () => {
    const staff = [makeTraining({
      dataProtectionTraining: false,
      confidentialityAwareness: false,
      dignityInCareTraining: false,
      consentPractice: false,
      digitalPrivacySkills: true,
      informationSharingKnowledge: false,
    })];
    const result = evaluateStaffPrivacyReadiness(staff);
    expect(result.overallScore).toBe(3);
  });

  it("only consentPractice true gives weight-4 score", () => {
    const staff = [makeTraining({
      dataProtectionTraining: false,
      confidentialityAwareness: false,
      dignityInCareTraining: false,
      consentPractice: true,
      digitalPrivacySkills: false,
      informationSharingKnowledge: false,
    })];
    const result = evaluateStaffPrivacyReadiness(staff);
    expect(result.overallScore).toBe(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Privacy Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildPrivacyProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildPrivacyProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildPrivacyProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "c1")?.totalRecords).toBe(2);
    expect(profiles.find((p) => p.childId === "c2")?.totalRecords).toBe(1);
  });

  it("scores frequency: >=10 -> 2, >=5 -> 1, <5 -> 0", () => {
    const recs10 = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", personalSpaceRespected: false, confidentialityMaintained: false }),
    );
    const profiles10 = buildChildPrivacyProfiles(recs10);
    // freq=2, rate1(0%)=0, rate2(0%)=0, diversity(1cat)=0 -> score=2
    expect(profiles10[0].overallScore).toBe(2);

    const recs5 = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", personalSpaceRespected: false, confidentialityMaintained: false }),
    );
    const profiles5 = buildChildPrivacyProfiles(recs5);
    expect(profiles5[0].overallScore).toBe(1);

    const recs3 = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", personalSpaceRespected: false, confidentialityMaintained: false }),
    );
    const profiles3 = buildChildPrivacyProfiles(recs3);
    expect(profiles3[0].overallScore).toBe(0);
  });

  it("scores rate1 (personalSpaceRespectedRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, <40 -> 0", () => {
    // 5 records, 4 with personalSpaceRespected -> 80% -> 3 points
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", personalSpaceRespected: i < 4, confidentialityMaintained: false }),
    );
    const profiles = buildChildPrivacyProfiles(recs);
    // freq=1, rate1(80%)=3, rate2(0%)=0, diversity(1cat)=0 -> 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("scores rate2 (confidentialityMaintainedRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, <40 -> 0", () => {
    // 5 records, 3 with confidentialityMaintained -> 60% -> 2 points
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", personalSpaceRespected: false, confidentialityMaintained: i < 3 }),
    );
    const profiles = buildChildPrivacyProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(60%)=2, diversity(1)=0 -> 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("scores rate2 (confidentialityMaintainedRate): 40% -> 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", personalSpaceRespected: false, confidentialityMaintained: i < 2 }),
    );
    const profiles = buildChildPrivacyProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(40%)=1, diversity(1)=0 -> 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores diversity: >=4 -> 2, >=2 -> 1, <2 -> 0", () => {
    const categories: Array<PrivacyRecord["category"]> = [
      "personal_space", "confidentiality", "dignity_care", "data_protection",
    ];
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: cat, personalSpaceRespected: false, confidentialityMaintained: false }),
    );
    const profiles = buildChildPrivacyProfiles(recs);
    // freq(4)=0, rate1(0%)=0, rate2(0%)=0, diversity(4)=2 -> 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("2 categories gives diversity 1", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", category: "personal_space", personalSpaceRespected: false, confidentialityMaintained: false }),
      makeRecord({ id: "r2", childId: "c1", category: "confidentiality", personalSpaceRespected: false, confidentialityMaintained: false }),
    ];
    const profiles = buildChildPrivacyProfiles(recs);
    // freq(2)=0, rate1(0%)=0, rate2(0%)=0, diversity(2)=1 -> 1
    expect(profiles[0].overallScore).toBe(1);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });

  it("caps at 10", () => {
    // 10 records, all true, 4+ categories -> freq=2, rate1=3, rate2=3, diversity=2 -> 10
    const categories: Array<PrivacyRecord["category"]> = [
      "personal_space", "confidentiality", "dignity_care", "data_protection",
    ];
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", category: categories[i % 4] }),
    );
    const profiles = buildChildPrivacyProfiles(recs);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("preserves child name from first record", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex Updated" }),
    ];
    const profiles = buildChildPrivacyProfiles(recs);
    expect(profiles[0].childName).toBe("Alex");
  });

  it("single record with 1 category gives 0 diversity", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "c1", personalSpaceRespected: false, confidentialityMaintained: false }),
    ];
    const profiles = buildChildPrivacyProfiles(recs);
    expect(profiles[0].categoriesCovered).toHaveLength(1);
    expect(profiles[0].overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Master Generator: generatePrivacyIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generatePrivacyIntelligence", () => {
  it("returns correct structure with all data", () => {
    const records = [makeRecord()];
    const result = generatePrivacyIntelligence({
      homeId: "oak-house",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.rating).toBeDefined();
    expect(result.privacyQuality).toBeDefined();
    expect(result.privacyCompliance).toBeDefined();
    expect(result.privacyPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("sums 4 evaluator scores", () => {
    const records = [makeRecord()];
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    const expectedTotal =
      result.privacyQuality.overallScore +
      result.privacyCompliance.overallScore +
      result.privacyPolicy.overallScore +
      result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedTotal));
  });

  it("caps overall score at 100", () => {
    const records = [makeRecord()];
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("filters records to period", () => {
    const records = [
      makeRecord({ id: "r1", date: "2026-03-15" }),
      makeRecord({ id: "r2", date: "2025-01-01" }),  // out of period
      makeRecord({ id: "r3", date: "2027-01-01" }),  // out of period
    ];
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.privacyQuality.totalRecords).toBe(1);
  });

  it("returns outstanding for high scores", () => {
    const categories: Array<PrivacyRecord["category"]> = [
      "personal_space", "confidentiality", "dignity_care", "data_protection",
      "communication_privacy", "medical_privacy", "family_contact_privacy", "digital_privacy",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate for empty data", () => {
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for metrics >= 80%", () => {
    const categories: Array<PrivacyRecord["category"]> = [
      "personal_space", "confidentiality", "dignity_care", "data_protection",
      "communication_privacy", "medical_privacy", "family_contact_privacy", "digital_privacy",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for metrics < 60%", () => {
    const records = [makeRecord({
      personalSpaceRespected: false,
      confidentialityMaintained: false,
      dignityPreserved: false,
      consentObtained: false,
      documentationComplete: false,
      timelyRecording: false,
    })];
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions when policy score is 0", () => {
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: null,
      staff: [makeTraining()],
    });
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions when staff score is 0", () => {
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: makePolicy(),
      staff: [],
    });
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates actions for low metrics (<50%)", () => {
    const records = [makeRecord({
      personalSpaceRespected: false,
      confidentialityMaintained: false,
      consentObtained: false,
      documentationComplete: false,
      timelyRecording: false,
    })];
    const staff = [makeTraining({ dignityInCareTraining: false })];
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makePolicy(),
      staff,
    });
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
    ];
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.childProfiles).toHaveLength(2);
  });

  it("includes all 7 regulatory links", () => {
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Reg 10");
    expect(result.regulatoryLinks[1]).toContain("Reg 21");
  });

  it("no strengths when all metrics are low", () => {
    const records = [makeRecord({
      personalSpaceRespected: false,
      confidentialityMaintained: false,
      dignityPreserved: false,
      consentObtained: false,
      documentationComplete: false,
      timelyRecording: false,
    })];
    const staff = [makeTraining({
      dataProtectionTraining: false,
      confidentialityAwareness: false,
      dignityInCareTraining: false,
      consentPractice: false,
      digitalPrivacySkills: false,
      informationSharingKnowledge: false,
    })];
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: null,
      staff,
    });
    expect(result.strengths).toHaveLength(0);
  });

  it("no areas for improvement when all metrics high", () => {
    const categories: Array<PrivacyRecord["category"]> = [
      "personal_space", "confidentiality", "dignity_care", "data_protection",
      "communication_privacy", "medical_privacy", "family_contact_privacy", "digital_privacy",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("empty childProfiles when no records in period", () => {
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.childProfiles).toHaveLength(0);
  });

  it("includes records on period boundaries", () => {
    const records = [
      makeRecord({ id: "r1", date: "2026-01-01" }),
      makeRecord({ id: "r2", date: "2026-12-31" }),
    ];
    const result = generatePrivacyIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.privacyQuality.totalRecords).toBe(2);
  });
});
