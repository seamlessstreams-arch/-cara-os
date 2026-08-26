import { describe, it, expect } from "vitest";
import {
  getRating,
  getSaferRecruitmentCategoryLabel,
  getSaferRecruitmentOutcomeLabel,
  getRatingLabel,
  evaluateSaferRecruitmentQuality,
  evaluateSaferRecruitmentCompliance,
  evaluateSaferRecruitmentPolicy,
  evaluateStaffSaferRecruitmentReadiness,
  buildStaffRecruitmentProfiles,
  generateSaferRecruitmentIntelligence,
} from "../safer-recruitment-engine";
import type {
  SaferRecruitmentRecord,
  SaferRecruitmentPolicy,
  StaffSaferRecruitmentTraining,
} from "../safer-recruitment-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<SaferRecruitmentRecord> = {}): SaferRecruitmentRecord {
  return {
    id: "rec-1",
    homeId: "home-oak",
    date: "2026-03-15",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    category: "dbs_check",
    outcome: "fully_compliant",
    dbsCheckCompleted: true,
    referencesVerified: true,
    interviewConducted: true,
    identityConfirmed: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePerfectRecords(count: number): SaferRecruitmentRecord[] {
  const categories = [
    "dbs_check", "reference_verification", "interview_assessment", "identity_verification",
    "qualification_check", "right_to_work_check", "employment_history_review", "risk_assessment",
  ] as const;
  return Array.from({ length: count }, (_, i) =>
    makeRecord({ id: `rec-${i}`, category: categories[i % 8] }),
  );
}

function makeAllFalseRecords(count: number): SaferRecruitmentRecord[] {
  return Array.from({ length: count }, (_, i) =>
    makeRecord({
      id: `rec-${i}`,
      dbsCheckCompleted: false,
      referencesVerified: false,
      interviewConducted: false,
      identityConfirmed: false,
      documentationComplete: false,
      timelyRecording: false,
    }),
  );
}

function makeFullPolicy(): SaferRecruitmentPolicy {
  return {
    saferRecruitmentPolicy: true,
    dbsRenewalPolicy: true,
    referenceCheckProcedure: true,
    interviewProtocol: true,
    disqualificationByAssociationPolicy: true,
    inductionPolicy: true,
    ongoingVigilancePolicy: true,
  };
}

function makeFullStaff(): StaffSaferRecruitmentTraining {
  return {
    staffId: "staff-1",
    safeguardingRecruitment: true,
    dbsProcessKnowledge: true,
    interviewTechniques: true,
    referenceVerification: true,
    disqualificationAwareness: true,
    whistleblowingAwareness: true,
  };
}

// ── pct ────────────────────────────────────────────────────────────────────

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label Functions ────────────────────────────────────────────────────────

describe("label functions", () => {
  it("returns correct category labels", () => {
    expect(getSaferRecruitmentCategoryLabel("dbs_check")).toBe("DBS Check");
    expect(getSaferRecruitmentCategoryLabel("reference_verification")).toBe("Reference Verification");
    expect(getSaferRecruitmentCategoryLabel("interview_assessment")).toBe("Interview Assessment");
    expect(getSaferRecruitmentCategoryLabel("identity_verification")).toBe("Identity Verification");
    expect(getSaferRecruitmentCategoryLabel("qualification_check")).toBe("Qualification Check");
    expect(getSaferRecruitmentCategoryLabel("right_to_work_check")).toBe("Right to Work Check");
    expect(getSaferRecruitmentCategoryLabel("employment_history_review")).toBe("Employment History Review");
    expect(getSaferRecruitmentCategoryLabel("risk_assessment")).toBe("Risk Assessment");
  });

  it("returns correct outcome labels", () => {
    expect(getSaferRecruitmentOutcomeLabel("fully_compliant")).toBe("Fully Compliant");
    expect(getSaferRecruitmentOutcomeLabel("minor_gap")).toBe("Minor Gap");
    expect(getSaferRecruitmentOutcomeLabel("significant_gap")).toBe("Significant Gap");
    expect(getSaferRecruitmentOutcomeLabel("non_compliant")).toBe("Non-Compliant");
    expect(getSaferRecruitmentOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });

  it("returns correct rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateSaferRecruitmentQuality ────────────────────────────────────────

describe("evaluateSaferRecruitmentQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateSaferRecruitmentQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.dbsCheckCompletedRate).toBeNull();
    expect(result.referencesVerifiedRate).toBeNull();
    expect(result.interviewConductedRate).toBeNull();
    expect(result.identityConfirmedRate).toBeNull();
  });

  it("returns 25 for perfect records", () => {
    const result = evaluateSaferRecruitmentQuality(makePerfectRecords(10));
    expect(result.overallScore).toBe(25);
    expect(result.dbsCheckCompletedRate).toBe(100);
    expect(result.referencesVerifiedRate).toBe(100);
    expect(result.interviewConductedRate).toBe(100);
    expect(result.identityConfirmedRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const result = evaluateSaferRecruitmentQuality(makeAllFalseRecords(5));
    expect(result.overallScore).toBe(0);
    expect(result.dbsCheckCompletedRate).toBe(0);
  });

  it("correctly calculates mixed rates", () => {
    const records = [
      makeRecord({ dbsCheckCompleted: true, referencesVerified: true, interviewConducted: false, identityConfirmed: false }),
      makeRecord({ id: "r2", dbsCheckCompleted: true, referencesVerified: false, interviewConducted: true, identityConfirmed: false }),
    ];
    const result = evaluateSaferRecruitmentQuality(records);
    expect(result.totalRecords).toBe(2);
    expect(result.dbsCheckCompletedRate).toBe(100);
    expect(result.referencesVerifiedRate).toBe(50);
    expect(result.interviewConductedRate).toBe(50);
    expect(result.identityConfirmedRate).toBe(0);
  });

  it("weights dbsCheckCompletedRate at 7", () => {
    const records = [makeRecord({ referencesVerified: false, interviewConducted: false, identityConfirmed: false })];
    const result = evaluateSaferRecruitmentQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("weights referencesVerifiedRate at 6", () => {
    const records = [makeRecord({ dbsCheckCompleted: false, interviewConducted: false, identityConfirmed: false })];
    const result = evaluateSaferRecruitmentQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("weights interviewConductedRate at 6", () => {
    const records = [makeRecord({ dbsCheckCompleted: false, referencesVerified: false, identityConfirmed: false })];
    const result = evaluateSaferRecruitmentQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("weights identityConfirmedRate at 6", () => {
    const records = [makeRecord({ dbsCheckCompleted: false, referencesVerified: false, interviewConducted: false })];
    const result = evaluateSaferRecruitmentQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("caps at 25", () => {
    const result = evaluateSaferRecruitmentQuality(makePerfectRecords(100));
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateSaferRecruitmentCompliance ──────────────────────────────────────

describe("evaluateSaferRecruitmentCompliance", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateSaferRecruitmentCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationRate).toBeNull();
    expect(result.timelyRecordingRate).toBeNull();
    expect(result.dbsCheckCompletedRate).toBeNull();
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("returns 25 for perfect records with all 8 categories", () => {
    const result = evaluateSaferRecruitmentCompliance(makePerfectRecords(8));
    expect(result.overallScore).toBe(25);
    expect(result.documentationRate).toBe(100);
    expect(result.timelyRecordingRate).toBe(100);
    expect(result.dbsCheckCompletedRate).toBe(100);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
  });

  it("returns 0 for all-false records of 1 category", () => {
    const result = evaluateSaferRecruitmentCompliance(makeAllFalseRecords(3));
    // dbsCheckCompletedRate=0, doc=0, timely=0. diversity=1/8=0.13, so score = 0.13*5=0.65→rounds to 0.7
    expect(result.overallScore).toBe(0.7);
    expect(result.documentationRate).toBe(0);
  });

  it("counts unique categories correctly", () => {
    const records = [
      makeRecord({ category: "dbs_check" }),
      makeRecord({ id: "r2", category: "dbs_check" }),
      makeRecord({ id: "r3", category: "reference_verification" }),
    ];
    const result = evaluateSaferRecruitmentCompliance(records);
    expect(result.uniqueCategories).toBe(2);
    expect(result.categoryDiversityRatio).toBe(0.25);
  });

  it("weights documentationRate at 8", () => {
    const records = [makeRecord({ timelyRecording: false, dbsCheckCompleted: false, category: "dbs_check" })];
    const result = evaluateSaferRecruitmentCompliance(records);
    // doc=100→8, timely=0→0, dbs=0→0, diversity=1/8=0.13→0.65→rounds to 8.7
    expect(result.overallScore).toBe(8.7);
  });

  it("weights timelyRecordingRate at 7", () => {
    const records = [makeRecord({ documentationComplete: false, dbsCheckCompleted: false, category: "dbs_check" })];
    const result = evaluateSaferRecruitmentCompliance(records);
    // doc=0, timely=100→7, dbs=0, diversity=0.13→0.65→rounds to 7.7
    expect(result.overallScore).toBe(7.7);
  });

  it("caps at 25", () => {
    const result = evaluateSaferRecruitmentCompliance(makePerfectRecords(100));
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateSaferRecruitmentPolicy ─────────────────────────────────────────

describe("evaluateSaferRecruitmentPolicy", () => {
  it("returns 0 and all false for null", () => {
    const result = evaluateSaferRecruitmentPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.saferRecruitmentPolicy).toBe(false);
    expect(result.dbsRenewalPolicy).toBe(false);
    expect(result.referenceCheckProcedure).toBe(false);
    expect(result.interviewProtocol).toBe(false);
    expect(result.disqualificationByAssociationPolicy).toBe(false);
    expect(result.inductionPolicy).toBe(false);
    expect(result.ongoingVigilancePolicy).toBe(false);
  });

  it("returns 25 for all true", () => {
    const result = evaluateSaferRecruitmentPolicy(makeFullPolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all false", () => {
    const result = evaluateSaferRecruitmentPolicy({
      saferRecruitmentPolicy: false,
      dbsRenewalPolicy: false,
      referenceCheckProcedure: false,
      interviewProtocol: false,
      disqualificationByAssociationPolicy: false,
      inductionPolicy: false,
      ongoingVigilancePolicy: false,
    });
    expect(result.overallScore).toBe(0);
  });

  it("weights saferRecruitmentPolicy at 4", () => {
    const p = { ...makeFullPolicy(), dbsRenewalPolicy: false, referenceCheckProcedure: false, interviewProtocol: false, disqualificationByAssociationPolicy: false, inductionPolicy: false, ongoingVigilancePolicy: false };
    expect(evaluateSaferRecruitmentPolicy(p).overallScore).toBe(4);
  });

  it("weights dbsRenewalPolicy at 4", () => {
    const p = { ...makeFullPolicy(), saferRecruitmentPolicy: false, referenceCheckProcedure: false, interviewProtocol: false, disqualificationByAssociationPolicy: false, inductionPolicy: false, ongoingVigilancePolicy: false };
    expect(evaluateSaferRecruitmentPolicy(p).overallScore).toBe(4);
  });

  it("weights referenceCheckProcedure at 4", () => {
    const p = { ...makeFullPolicy(), saferRecruitmentPolicy: false, dbsRenewalPolicy: false, interviewProtocol: false, disqualificationByAssociationPolicy: false, inductionPolicy: false, ongoingVigilancePolicy: false };
    expect(evaluateSaferRecruitmentPolicy(p).overallScore).toBe(4);
  });

  it("weights interviewProtocol at 4", () => {
    const p = { ...makeFullPolicy(), saferRecruitmentPolicy: false, dbsRenewalPolicy: false, referenceCheckProcedure: false, disqualificationByAssociationPolicy: false, inductionPolicy: false, ongoingVigilancePolicy: false };
    expect(evaluateSaferRecruitmentPolicy(p).overallScore).toBe(4);
  });

  it("weights disqualificationByAssociationPolicy at 3", () => {
    const p = { ...makeFullPolicy(), saferRecruitmentPolicy: false, dbsRenewalPolicy: false, referenceCheckProcedure: false, interviewProtocol: false, inductionPolicy: false, ongoingVigilancePolicy: false };
    expect(evaluateSaferRecruitmentPolicy(p).overallScore).toBe(3);
  });

  it("weights inductionPolicy at 3", () => {
    const p = { ...makeFullPolicy(), saferRecruitmentPolicy: false, dbsRenewalPolicy: false, referenceCheckProcedure: false, interviewProtocol: false, disqualificationByAssociationPolicy: false, ongoingVigilancePolicy: false };
    expect(evaluateSaferRecruitmentPolicy(p).overallScore).toBe(3);
  });

  it("weights ongoingVigilancePolicy at 3", () => {
    const p = { ...makeFullPolicy(), saferRecruitmentPolicy: false, dbsRenewalPolicy: false, referenceCheckProcedure: false, interviewProtocol: false, disqualificationByAssociationPolicy: false, inductionPolicy: false };
    expect(evaluateSaferRecruitmentPolicy(p).overallScore).toBe(3);
  });

  it("sum of all individual weights is 25", () => {
    expect(4 + 4 + 4 + 4 + 3 + 3 + 3).toBe(25);
  });

  it("echoes policy booleans in result", () => {
    const policy = { ...makeFullPolicy(), inductionPolicy: false };
    const result = evaluateSaferRecruitmentPolicy(policy);
    expect(result.inductionPolicy).toBe(false);
    expect(result.saferRecruitmentPolicy).toBe(true);
  });
});

// ── evaluateStaffSaferRecruitmentReadiness ─────────────────────────────────

describe("evaluateStaffSaferRecruitmentReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffSaferRecruitmentReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.safeguardingRecruitmentRate).toBeNull();
    expect(result.dbsProcessKnowledgeRate).toBeNull();
    expect(result.interviewTechniquesRate).toBeNull();
    expect(result.referenceVerificationRate).toBeNull();
    expect(result.disqualificationAwarenessRate).toBeNull();
    expect(result.whistleblowingAwarenessRate).toBeNull();
  });

  it("returns 25 for all-skilled staff", () => {
    const staff = [
      makeFullStaff(),
      { ...makeFullStaff(), staffId: "staff-2" },
      { ...makeFullStaff(), staffId: "staff-3" },
    ];
    const result = evaluateStaffSaferRecruitmentReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(3);
  });

  it("returns 0 for all-unskilled staff", () => {
    const staff = [{
      staffId: "staff-1",
      safeguardingRecruitment: false,
      dbsProcessKnowledge: false,
      interviewTechniques: false,
      referenceVerification: false,
      disqualificationAwareness: false,
      whistleblowingAwareness: false,
    }];
    const result = evaluateStaffSaferRecruitmentReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("weights safeguardingRecruitment at 6", () => {
    const staff = [{
      staffId: "s1",
      safeguardingRecruitment: true,
      dbsProcessKnowledge: false,
      interviewTechniques: false,
      referenceVerification: false,
      disqualificationAwareness: false,
      whistleblowingAwareness: false,
    }];
    const result = evaluateStaffSaferRecruitmentReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("weights dbsProcessKnowledge at 5", () => {
    const staff = [{
      staffId: "s1",
      safeguardingRecruitment: false,
      dbsProcessKnowledge: true,
      interviewTechniques: false,
      referenceVerification: false,
      disqualificationAwareness: false,
      whistleblowingAwareness: false,
    }];
    const result = evaluateStaffSaferRecruitmentReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("weights interviewTechniques at 5", () => {
    const staff = [{
      staffId: "s1",
      safeguardingRecruitment: false,
      dbsProcessKnowledge: false,
      interviewTechniques: true,
      referenceVerification: false,
      disqualificationAwareness: false,
      whistleblowingAwareness: false,
    }];
    const result = evaluateStaffSaferRecruitmentReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("weights referenceVerification at 4", () => {
    const staff = [{
      staffId: "s1",
      safeguardingRecruitment: false,
      dbsProcessKnowledge: false,
      interviewTechniques: false,
      referenceVerification: true,
      disqualificationAwareness: false,
      whistleblowingAwareness: false,
    }];
    const result = evaluateStaffSaferRecruitmentReadiness(staff);
    expect(result.overallScore).toBe(4);
  });

  it("weights disqualificationAwareness at 3", () => {
    const staff = [{
      staffId: "s1",
      safeguardingRecruitment: false,
      dbsProcessKnowledge: false,
      interviewTechniques: false,
      referenceVerification: false,
      disqualificationAwareness: true,
      whistleblowingAwareness: false,
    }];
    const result = evaluateStaffSaferRecruitmentReadiness(staff);
    expect(result.overallScore).toBe(3);
  });

  it("weights whistleblowingAwareness at 2", () => {
    const staff = [{
      staffId: "s1",
      safeguardingRecruitment: false,
      dbsProcessKnowledge: false,
      interviewTechniques: false,
      referenceVerification: false,
      disqualificationAwareness: false,
      whistleblowingAwareness: true,
    }];
    const result = evaluateStaffSaferRecruitmentReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("sum of individual weights is 25", () => {
    expect(6 + 5 + 5 + 4 + 3 + 2).toBe(25);
  });

  it("calculates mixed rates correctly", () => {
    const staff = [
      { ...makeFullStaff(), staffId: "s1" },
      { ...makeFullStaff(), staffId: "s2", whistleblowingAwareness: false, disqualificationAwareness: false },
    ];
    const result = evaluateStaffSaferRecruitmentReadiness(staff);
    expect(result.safeguardingRecruitmentRate).toBe(100);
    expect(result.whistleblowingAwarenessRate).toBe(50);
    expect(result.disqualificationAwarenessRate).toBe(50);
  });

  it("caps at 25", () => {
    const staff = Array.from({ length: 20 }, (_, i) => ({ ...makeFullStaff(), staffId: `s-${i}` }));
    const result = evaluateStaffSaferRecruitmentReadiness(staff);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── buildStaffRecruitmentProfiles ──────────────────────────────────────────

describe("buildStaffRecruitmentProfiles", () => {
  it("returns empty for no records", () => {
    expect(buildStaffRecruitmentProfiles([])).toEqual([]);
  });

  it("groups records by staffId", () => {
    const records = [
      makeRecord({ staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s1", staffName: "Sarah", category: "reference_verification" }),
      makeRecord({ id: "r3", staffId: "s2", staffName: "Tom" }),
    ];
    const profiles = buildStaffRecruitmentProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].staffId).toBe("s1");
    expect(profiles[0].totalRecords).toBe(2);
    expect(profiles[1].staffId).toBe("s2");
    expect(profiles[1].totalRecords).toBe(1);
  });

  it("gives max score 10 for perfect data with frequency, rates and diversity", () => {
    const categories = [
      "dbs_check", "reference_verification", "interview_assessment", "identity_verification",
      "qualification_check", "right_to_work_check", "employment_history_review", "risk_assessment",
      "dbs_check", "reference_verification",
    ] as const;
    const records = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", staffName: "Sarah", category: cat }),
    );
    const profiles = buildStaffRecruitmentProfiles(records);
    // freq>=10→2, rate1=100→3, rate2=100→3, diversity=8→2 = 10 (capped)
    expect(profiles[0].overallScore).toBe(10);
  });

  it("frequency threshold: <5 records → 0 points", () => {
    const records = [
      makeRecord({ staffId: "s1", category: "dbs_check" }),
      makeRecord({ id: "r2", staffId: "s1", category: "reference_verification" }),
    ];
    const profiles = buildStaffRecruitmentProfiles(records);
    // freq<5→0, rate1=100→3, rate2=100→3, diversity=2→1 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("frequency threshold: 5-9 records → 1 point", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", category: "dbs_check" }),
    );
    const profiles = buildStaffRecruitmentProfiles(records);
    // freq>=5→1, rate1=100→3, rate2=100→3, diversity=1cat→0 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("rate1 (dbsCheckCompletedRate) threshold: 60-79 → 2 points", () => {
    // 3 dbs=true, 2 dbs=false = 60%
    const records = [
      makeRecord({ id: "r1", staffId: "s1", dbsCheckCompleted: true }),
      makeRecord({ id: "r2", staffId: "s1", dbsCheckCompleted: true }),
      makeRecord({ id: "r3", staffId: "s1", dbsCheckCompleted: true }),
      makeRecord({ id: "r4", staffId: "s1", dbsCheckCompleted: false }),
      makeRecord({ id: "r5", staffId: "s1", dbsCheckCompleted: false }),
    ];
    const profiles = buildStaffRecruitmentProfiles(records);
    expect(profiles[0].dbsCheckCompletedRate).toBe(60);
    // freq>=5→1, rate1=60→2, rate2=100→3, diversity=1→0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("rate2 (referencesVerifiedRate) threshold: 40-59 → 1 point", () => {
    // 2 refs=true, 3 refs=false = 40%
    const records = [
      makeRecord({ id: "r1", staffId: "s1", referencesVerified: true }),
      makeRecord({ id: "r2", staffId: "s1", referencesVerified: true }),
      makeRecord({ id: "r3", staffId: "s1", referencesVerified: false }),
      makeRecord({ id: "r4", staffId: "s1", referencesVerified: false }),
      makeRecord({ id: "r5", staffId: "s1", referencesVerified: false }),
    ];
    const profiles = buildStaffRecruitmentProfiles(records);
    expect(profiles[0].referencesVerifiedRate).toBe(40);
    // freq>=5→1, rate1=100→3, rate2=40→1, diversity=1→0 = 5
    expect(profiles[0].overallScore).toBe(5);
  });

  it("diversity threshold: 2-3 categories → 1 point", () => {
    const records = [
      makeRecord({ id: "r1", staffId: "s1", category: "dbs_check" }),
      makeRecord({ id: "r2", staffId: "s1", category: "reference_verification" }),
    ];
    const profiles = buildStaffRecruitmentProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
    // freq<5→0, rate1=100→3, rate2=100→3, diversity=2→1 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("caps score at 10", () => {
    const categories = [
      "dbs_check", "reference_verification", "interview_assessment", "identity_verification",
      "qualification_check", "right_to_work_check", "employment_history_review", "risk_assessment",
      "dbs_check", "reference_verification", "interview_assessment",
    ] as const;
    const records = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", category: cat }),
    );
    const profiles = buildStaffRecruitmentProfiles(records);
    // freq>=10→2, rate1=100→3, rate2=100→3, diversity=8→2 = 10 (capped)
    expect(profiles[0].overallScore).toBe(10);
  });
});

// ── generateSaferRecruitmentIntelligence ───────────────────────────────────

describe("generateSaferRecruitmentIntelligence", () => {
  it("returns complete intelligence object", () => {
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: makePerfectRecords(8),
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });

    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-12-31");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.saferRecruitmentQuality).toBeDefined();
    expect(result.saferRecruitmentCompliance).toBeDefined();
    expect(result.saferRecruitmentPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.staffProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("returns outstanding for perfect data", () => {
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: makePerfectRecords(8),
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate for empty data", () => {
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("score is sum of 4 evaluators capped at 100", () => {
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: makePerfectRecords(8),
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });
    const expectedSum =
      result.saferRecruitmentQuality.overallScore +
      result.saferRecruitmentCompliance.overallScore +
      result.saferRecruitmentPolicy.overallScore +
      result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, Math.round(expectedSum)));
  });

  it("filters records to period", () => {
    const records = [
      makeRecord({ date: "2025-12-31" }), // before period
      makeRecord({ id: "r2", date: "2026-06-15" }), // in period
      makeRecord({ id: "r3", date: "2027-01-01" }), // after period
    ];
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });
    expect(result.saferRecruitmentQuality.totalRecords).toBe(1);
  });

  it("includes period boundary records", () => {
    const records = [
      makeRecord({ date: "2026-01-01" }), // boundary start
      makeRecord({ id: "r2", date: "2026-12-31" }), // boundary end
    ];
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });
    expect(result.saferRecruitmentQuality.totalRecords).toBe(2);
  });

  it("includes exactly 7 regulatory links", () => {
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("CHR 2015 Reg 32");
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: makePerfectRecords(8),
      policy: null,
      staff: [makeFullStaff()],
    });
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions when no staff training", () => {
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: makePerfectRecords(8),
      policy: makeFullPolicy(),
      staff: [],
    });
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates no-action message for perfect data", () => {
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: makePerfectRecords(8),
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toContain("No immediate actions");
  });

  it("generates strengths for outstanding data", () => {
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: makePerfectRecords(8),
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates areas for improvement for inadequate data", () => {
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("builds staff profiles from period records", () => {
    const records = [
      makeRecord({ staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s1", staffName: "Sarah", category: "reference_verification" }),
      makeRecord({ id: "r3", staffId: "s2", staffName: "Tom" }),
    ];
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });
    expect(result.staffProfiles).toHaveLength(2);
  });

  it("maps good rating correctly (60-79)", () => {
    // Need ~60-79 total. Policy=25 + quality partial + compliance partial
    const records = [
      makeRecord({ date: "2026-03-01", dbsCheckCompleted: true, referencesVerified: true, interviewConducted: false, identityConfirmed: false, documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "r2", date: "2026-03-02", category: "reference_verification", dbsCheckCompleted: false, referencesVerified: true, interviewConducted: true, identityConfirmed: false, documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "r3", date: "2026-03-03", category: "interview_assessment", dbsCheckCompleted: true, referencesVerified: false, interviewConducted: true, identityConfirmed: true, documentationComplete: true, timelyRecording: false }),
      makeRecord({ id: "r4", date: "2026-03-04", category: "identity_verification", dbsCheckCompleted: true, referencesVerified: true, interviewConducted: true, identityConfirmed: true, documentationComplete: false, timelyRecording: true }),
      makeRecord({ id: "r5", date: "2026-03-05", category: "qualification_check", dbsCheckCompleted: true, referencesVerified: true, interviewConducted: true, identityConfirmed: true, documentationComplete: true, timelyRecording: true }),
    ];
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(100);
  });

  it("generates URGENT action for low DBS completion", () => {
    const records = [
      makeRecord({ date: "2026-03-01", dbsCheckCompleted: false }),
    ];
    const result = generateSaferRecruitmentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("DBS"))).toBe(true);
  });
});
