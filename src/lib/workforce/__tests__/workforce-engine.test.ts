import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getWorkforceCategoryLabel,
  getWorkforceOutcomeLabel,
  getRatingLabel,
  evaluateWorkforceQuality,
  evaluateWorkforceCompliance,
  evaluateWorkforcePolicy,
  evaluateStaffWorkforceReadiness,
  buildStaffWorkforceProfiles,
  generateWorkforceIntelligence,
} from "../workforce-engine";
import type {
  WorkforceRecord,
  WorkforcePolicy,
  StaffWorkforceTraining,
} from "../workforce-engine";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<WorkforceRecord> = {}): WorkforceRecord {
  return {
    id: "rec-1",
    homeId: "home-oak",
    date: "2026-03-15",
    staffId: "staff-1",
    staffName: "Test Staff",
    category: "dbs_compliance",
    outcome: "compliant",
    dbsCurrent: true,
    qualificationMet: true,
    trainingUpToDate: true,
    supervisionCurrent: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<WorkforcePolicy> = {}): WorkforcePolicy {
  return {
    saferRecruitmentPolicy: true,
    dbsRenewalPolicy: true,
    qualificationFramework: true,
    mandatoryTrainingPolicy: true,
    supervisionPolicy: true,
    agencyStaffPolicy: true,
    workforceDevStrategy: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffWorkforceTraining> = {}): StaffWorkforceTraining {
  return {
    staffId: "staff-1",
    saferRecruitment: true,
    dbsProcessKnowledge: true,
    qualificationAssessment: true,
    supervisionSkills: true,
    trainingCoordination: true,
    regulatoryCompliance: true,
    ...overrides,
  };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => { expect(pct(5, 0)).toBe(0); });
  it("returns 100 for equal num and den", () => { expect(pct(10, 10)).toBe(100); });
  it("returns 50 for half", () => { expect(pct(5, 10)).toBe(50); });
  it("rounds to nearest integer", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
  it("returns 0 for 0 numerator", () => { expect(pct(0, 10)).toBe(0); });
});

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ── Label Helpers ──────────────────────────────────────────────────────────

describe("getWorkforceCategoryLabel", () => {
  it("returns human-readable labels", () => {
    expect(getWorkforceCategoryLabel("dbs_compliance")).toBe("DBS Compliance");
    expect(getWorkforceCategoryLabel("qualification_level")).toBe("Qualification Level");
    expect(getWorkforceCategoryLabel("mandatory_training")).toBe("Mandatory Training");
    expect(getWorkforceCategoryLabel("safeguarding_training")).toBe("Safeguarding Training");
    expect(getWorkforceCategoryLabel("supervision_record")).toBe("Supervision Record");
    expect(getWorkforceCategoryLabel("restraint_training")).toBe("Restraint Training");
    expect(getWorkforceCategoryLabel("first_aid_certification")).toBe("First Aid Certification");
    expect(getWorkforceCategoryLabel("medication_competency")).toBe("Medication Competency");
  });
});

describe("getWorkforceOutcomeLabel", () => {
  it("returns human-readable labels", () => {
    expect(getWorkforceOutcomeLabel("compliant")).toBe("Compliant");
    expect(getWorkforceOutcomeLabel("action_needed")).toBe("Action Needed");
    expect(getWorkforceOutcomeLabel("non_compliant")).toBe("Non-Compliant");
    expect(getWorkforceOutcomeLabel("expired")).toBe("Expired");
    expect(getWorkforceOutcomeLabel("exempt")).toBe("Exempt");
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

// ── Evaluator 1: Workforce Quality ────────────────────────────────────────

describe("evaluateWorkforceQuality", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateWorkforceQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalRecords).toBe(0);
    expect(result.dbsCurrentRate).toBe(0);
  });

  it("returns max score for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2" })];
    const result = evaluateWorkforceQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalRecords).toBe(2);
    expect(result.dbsCurrentRate).toBe(100);
    expect(result.qualificationMetRate).toBe(100);
  });

  it("returns 0 for all-false records", () => {
    const records = [makeRecord({ dbsCurrent: false, qualificationMet: false, trainingUpToDate: false, supervisionCurrent: false })];
    const result = evaluateWorkforceQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("calculates mixed rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", dbsCurrent: true, qualificationMet: false, trainingUpToDate: true, supervisionCurrent: false }),
      makeRecord({ id: "r2", dbsCurrent: true, qualificationMet: true, trainingUpToDate: false, supervisionCurrent: false }),
    ];
    const result = evaluateWorkforceQuality(records);
    expect(result.dbsCurrentRate).toBe(100);
    expect(result.qualificationMetRate).toBe(50);
    expect(result.trainingUpToDateRate).toBe(50);
    expect(result.supervisionCurrentRate).toBe(0);
  });

  it("applies correct weights (7+6+6+6=25)", () => {
    const records = [makeRecord({ qualificationMet: false, trainingUpToDate: false, supervisionCurrent: false })];
    const result = evaluateWorkforceQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("caps score at 25", () => {
    const result = evaluateWorkforceQuality([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("single record with only dbsCurrent true gives weight-7 score", () => {
    const records = [makeRecord({ qualificationMet: false, trainingUpToDate: false, supervisionCurrent: false })];
    const result = evaluateWorkforceQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("handles large record sets", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({ id: `r-${i}`, dbsCurrent: i % 2 === 0 }),
    );
    const result = evaluateWorkforceQuality(records);
    expect(result.dbsCurrentRate).toBe(50);
    expect(result.totalRecords).toBe(100);
  });

  it("rating maps correctly for low score", () => {
    const records = [makeRecord({ dbsCurrent: false, qualificationMet: false, trainingUpToDate: false, supervisionCurrent: false })];
    const result = evaluateWorkforceQuality(records);
    expect(result.rating).toBe("inadequate");
  });

  it("only qualificationMet true gives weight-6 score", () => {
    const records = [makeRecord({ dbsCurrent: false, trainingUpToDate: false, supervisionCurrent: false })];
    const result = evaluateWorkforceQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("only trainingUpToDate true gives weight-6 score", () => {
    const records = [makeRecord({ dbsCurrent: false, qualificationMet: false, supervisionCurrent: false })];
    const result = evaluateWorkforceQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("only supervisionCurrent true gives weight-6 score", () => {
    const records = [makeRecord({ dbsCurrent: false, qualificationMet: false, trainingUpToDate: false })];
    const result = evaluateWorkforceQuality(records);
    expect(result.overallScore).toBe(6);
  });
});

// ── Evaluator 2: Workforce Compliance ─────────────────────────────────────

describe("evaluateWorkforceCompliance", () => {
  it("returns zeros for empty records", () => {
    const result = evaluateWorkforceCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.documentationRate).toBe(0);
  });

  it("calculates documentation and timely rates", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "r2", documentationComplete: true, timelyRecording: false }),
      makeRecord({ id: "r3", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluateWorkforceCompliance(records);
    expect(result.documentationRate).toBe(67);
    expect(result.timelyRecordingRate).toBe(33);
  });

  it("calculates category diversity correctly", () => {
    const records = [makeRecord({ category: "dbs_compliance" })];
    const result = evaluateWorkforceCompliance(records);
    expect(result.categoryDiversityRatio).toBe(13);
  });

  it("returns high diversity for many categories", () => {
    const categories: Array<WorkforceRecord["category"]> = [
      "dbs_compliance", "qualification_level", "mandatory_training", "safeguarding_training",
      "supervision_record", "restraint_training", "first_aid_certification", "medication_competency",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateWorkforceCompliance(records);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("applies correct weights (8+7+5+5=25)", () => {
    const categories: Array<WorkforceRecord["category"]> = [
      "dbs_compliance", "qualification_level", "mandatory_training", "safeguarding_training",
      "supervision_record", "restraint_training", "first_aid_certification", "medication_competency",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateWorkforceCompliance(records);
    expect(result.overallScore).toBe(25);
  });

  it("two categories gives 25% diversity", () => {
    const records = [
      makeRecord({ id: "r1", category: "dbs_compliance" }),
      makeRecord({ id: "r2", category: "qualification_level" }),
    ];
    const result = evaluateWorkforceCompliance(records);
    expect(result.categoryDiversityRatio).toBe(25);
  });

  it("all compliance false with single category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, supervisionCurrent: false })];
    const result = evaluateWorkforceCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.overallScore).toBe(1); // only diversity 13% * 5 = 0.65 -> 1
  });

  it("returns perfect compliance with all flags and all categories", () => {
    const categories: Array<WorkforceRecord["category"]> = [
      "dbs_compliance", "qualification_level", "mandatory_training", "safeguarding_training",
      "supervision_record", "restraint_training", "first_aid_certification", "medication_competency",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateWorkforceCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
  });
});

// ── Evaluator 3: Workforce Policy ─────────────────────────────────────────

describe("evaluateWorkforcePolicy", () => {
  it("returns zeros for null policy", () => {
    const result = evaluateWorkforcePolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.saferRecruitmentPolicy).toBe(false);
  });

  it("returns 25 for all-true policy", () => {
    const result = evaluateWorkforcePolicy(makePolicy());
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 for all-false policy", () => {
    const result = evaluateWorkforcePolicy(makePolicy({
      saferRecruitmentPolicy: false, dbsRenewalPolicy: false, qualificationFramework: false,
      mandatoryTrainingPolicy: false, supervisionPolicy: false, agencyStaffPolicy: false, workforceDevStrategy: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("weights first 4 at 4 points each", () => {
    const result = evaluateWorkforcePolicy(makePolicy({
      saferRecruitmentPolicy: true, dbsRenewalPolicy: false, qualificationFramework: false,
      mandatoryTrainingPolicy: false, supervisionPolicy: false, agencyStaffPolicy: false, workforceDevStrategy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    const result = evaluateWorkforcePolicy(makePolicy({
      saferRecruitmentPolicy: false, dbsRenewalPolicy: false, qualificationFramework: false,
      mandatoryTrainingPolicy: false, supervisionPolicy: true, agencyStaffPolicy: true, workforceDevStrategy: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("handles partial policy (first 4 only = 16)", () => {
    const result = evaluateWorkforcePolicy(makePolicy({
      supervisionPolicy: false, agencyStaffPolicy: false, workforceDevStrategy: false,
    }));
    expect(result.overallScore).toBe(16);
    expect(result.rating).toBe("good");
  });

  it("preserves boolean values in result", () => {
    const result = evaluateWorkforcePolicy(makePolicy({ saferRecruitmentPolicy: true, dbsRenewalPolicy: false }));
    expect(result.saferRecruitmentPolicy).toBe(true);
    expect(result.dbsRenewalPolicy).toBe(false);
  });

  it("single middle policy gives 4 points", () => {
    const result = evaluateWorkforcePolicy(makePolicy({
      saferRecruitmentPolicy: false, dbsRenewalPolicy: false, qualificationFramework: true,
      mandatoryTrainingPolicy: false, supervisionPolicy: false, agencyStaffPolicy: false, workforceDevStrategy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("rating for score 9 -> 36 -> inadequate", () => {
    const result = evaluateWorkforcePolicy(makePolicy({
      saferRecruitmentPolicy: false, dbsRenewalPolicy: false, qualificationFramework: false,
      mandatoryTrainingPolicy: false, supervisionPolicy: true, agencyStaffPolicy: true, workforceDevStrategy: true,
    }));
    expect(result.overallScore).toBe(9);
    expect(result.rating).toBe("inadequate");
  });

  it("two high-weight policies give 8 points", () => {
    const result = evaluateWorkforcePolicy(makePolicy({
      saferRecruitmentPolicy: true, dbsRenewalPolicy: true, qualificationFramework: false,
      mandatoryTrainingPolicy: false, supervisionPolicy: false, agencyStaffPolicy: false, workforceDevStrategy: false,
    }));
    expect(result.overallScore).toBe(8);
  });
});

// ── Evaluator 4: Staff Readiness ───────────────────────────────────────────

describe("evaluateStaffWorkforceReadiness", () => {
  it("returns zeros for empty staff", () => {
    const result = evaluateStaffWorkforceReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score for all-true staff", () => {
    const staff = [makeTraining(), makeTraining({ staffId: "staff-2" })];
    const result = evaluateStaffWorkforceReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("outstanding");
    expect(result.totalStaff).toBe(2);
  });

  it("returns 0 for all-false staff", () => {
    const staff = [makeTraining({
      saferRecruitment: false, dbsProcessKnowledge: false, qualificationAssessment: false,
      supervisionSkills: false, trainingCoordination: false, regulatoryCompliance: false,
    })];
    const result = evaluateStaffWorkforceReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weights (6+5+5+4+3+2=25)", () => {
    const staff = [makeTraining({
      dbsProcessKnowledge: false, qualificationAssessment: false, supervisionSkills: false,
      trainingCoordination: false, regulatoryCompliance: false,
    })];
    const result = evaluateStaffWorkforceReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("only regulatoryCompliance true gives weight-2 score", () => {
    const staff = [makeTraining({
      saferRecruitment: false, dbsProcessKnowledge: false, qualificationAssessment: false,
      supervisionSkills: false, trainingCoordination: false, regulatoryCompliance: true,
    })];
    const result = evaluateStaffWorkforceReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("calculates mixed rates correctly", () => {
    const staff = [
      makeTraining({ staffId: "s-1", saferRecruitment: true, dbsProcessKnowledge: true, qualificationAssessment: false, supervisionSkills: false, trainingCoordination: false, regulatoryCompliance: false }),
      makeTraining({ staffId: "s-2", saferRecruitment: true, dbsProcessKnowledge: false, qualificationAssessment: true, supervisionSkills: false, trainingCoordination: false, regulatoryCompliance: false }),
    ];
    const result = evaluateStaffWorkforceReadiness(staff);
    expect(result.saferRecruitmentRate).toBe(100);
    expect(result.dbsProcessKnowledgeRate).toBe(50);
    expect(result.qualificationAssessmentRate).toBe(50);
  });

  it("3 staff with mixed skills", () => {
    const staff = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2", saferRecruitment: false, dbsProcessKnowledge: false }),
      makeTraining({ staffId: "s3", qualificationAssessment: false, supervisionSkills: false, trainingCoordination: false, regulatoryCompliance: false }),
    ];
    const result = evaluateStaffWorkforceReadiness(staff);
    expect(result.totalStaff).toBe(3);
    expect(result.saferRecruitmentRate).toBe(67);
  });

  it("single staff all true gives 25", () => {
    const staff = [makeTraining()];
    const result = evaluateStaffWorkforceReadiness(staff);
    expect(result.overallScore).toBe(25);
  });

  it("only trainingCoordination true gives weight-3 score", () => {
    const staff = [makeTraining({
      saferRecruitment: false, dbsProcessKnowledge: false, qualificationAssessment: false,
      supervisionSkills: false, trainingCoordination: true, regulatoryCompliance: false,
    })];
    const result = evaluateStaffWorkforceReadiness(staff);
    expect(result.overallScore).toBe(3);
  });

  it("only supervisionSkills true gives weight-4 score", () => {
    const staff = [makeTraining({
      saferRecruitment: false, dbsProcessKnowledge: false, qualificationAssessment: false,
      supervisionSkills: true, trainingCoordination: false, regulatoryCompliance: false,
    })];
    const result = evaluateStaffWorkforceReadiness(staff);
    expect(result.overallScore).toBe(4);
  });
});

// ── Staff Profiles ─────────────────────────────────────────────────────────

describe("buildStaffWorkforceProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildStaffWorkforceProfiles([])).toEqual([]);
  });

  it("groups by staffId", () => {
    const records = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s2", staffName: "Tom" }),
      makeRecord({ id: "r3", staffId: "s1", staffName: "Sarah" }),
    ];
    const profiles = buildStaffWorkforceProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.staffId === "s1")?.totalRecords).toBe(2);
  });

  it("scores frequency: >=10 -> 2, >=5 -> 1, <5 -> 0", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", dbsCurrent: false, qualificationMet: false }),
    );
    const profiles = buildStaffWorkforceProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores rate1 (dbsCurrentRate): >=80 -> 3", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", dbsCurrent: i < 4, qualificationMet: false }),
    );
    const profiles = buildStaffWorkforceProfiles(recs);
    // freq=1, rate1(80%)=3, rate2(0%)=0, diversity(1)=0 -> 4
    expect(profiles[0].overallScore).toBe(4);
  });

  it("scores diversity: >=4 -> 2, >=2 -> 1", () => {
    const categories: Array<WorkforceRecord["category"]> = [
      "dbs_compliance", "qualification_level", "mandatory_training", "safeguarding_training",
    ];
    const recs = categories.map((cat, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", category: cat, dbsCurrent: false, qualificationMet: false }),
    );
    const profiles = buildStaffWorkforceProfiles(recs);
    expect(profiles[0].overallScore).toBe(2);
  });

  it("caps at 10", () => {
    const categories: Array<WorkforceRecord["category"]> = [
      "dbs_compliance", "qualification_level", "mandatory_training", "safeguarding_training",
    ];
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", category: categories[i % 4] }),
    );
    const profiles = buildStaffWorkforceProfiles(recs);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("2 categories gives diversity 1", () => {
    const recs = [
      makeRecord({ id: "r1", staffId: "s1", category: "dbs_compliance", dbsCurrent: false, qualificationMet: false }),
      makeRecord({ id: "r2", staffId: "s1", category: "qualification_level", dbsCurrent: false, qualificationMet: false }),
    ];
    const profiles = buildStaffWorkforceProfiles(recs);
    expect(profiles[0].overallScore).toBe(1);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });

  it("rate2 qualificationMetRate 60% -> 2 points", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", dbsCurrent: false, qualificationMet: i < 3 }),
    );
    const profiles = buildStaffWorkforceProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(60%)=2, diversity(1)=0 -> 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("preserves staff name from first record", () => {
    const recs = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s1", staffName: "Sarah Updated" }),
    ];
    const profiles = buildStaffWorkforceProfiles(recs);
    expect(profiles[0].staffName).toBe("Sarah");
  });

  it("rate1 40% -> 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", dbsCurrent: i < 2, qualificationMet: false }),
    );
    const profiles = buildStaffWorkforceProfiles(recs);
    // freq=1, rate1(40%)=1, rate2(0%)=0, diversity(1)=0 -> 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("single record with all true gives max individual scores", () => {
    const recs = [makeRecord({ staffId: "s1" })];
    const profiles = buildStaffWorkforceProfiles(recs);
    // freq(1)=0, rate1(100%)=3, rate2(100%)=3, diversity(1)=0 -> 6
    expect(profiles[0].overallScore).toBe(6);
    expect(profiles[0].dbsCurrentRate).toBe(100);
    expect(profiles[0].qualificationMetRate).toBe(100);
  });

  it("frequency 5 records gives 1 point", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, staffId: "s1", dbsCurrent: false, qualificationMet: false }),
    );
    const profiles = buildStaffWorkforceProfiles(recs);
    // freq=1, rate1(0%)=0, rate2(0%)=0, diversity(1)=0 -> 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("multiple staff sorted correctly", () => {
    const recs = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s2", staffName: "Tom", dbsCurrent: false, qualificationMet: false }),
    ];
    const profiles = buildStaffWorkforceProfiles(recs);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].staffId).toBe("s1");
    expect(profiles[1].staffId).toBe("s2");
  });
});

// ── Master Generator ───────────────────────────────────────────────────────

describe("generateWorkforceIntelligence", () => {
  it("returns correct structure with all data", () => {
    const result = generateWorkforceIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [makeRecord()],
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.workforceQuality).toBeDefined();
    expect(result.workforceCompliance).toBeDefined();
    expect(result.workforcePolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.staffProfiles).toBeDefined();
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("sums 4 evaluator scores", () => {
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: makePolicy(), staff: [makeTraining()],
    });
    const expectedTotal = result.workforceQuality.overallScore + result.workforceCompliance.overallScore + result.workforcePolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedTotal));
  });

  it("caps overall score at 100", () => {
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns inadequate for empty data", () => {
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [], policy: null, staff: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates strengths for metrics >= 80%", () => {
    const categories: Array<WorkforceRecord["category"]> = [
      "dbs_compliance", "qualification_level", "mandatory_training", "safeguarding_training",
      "supervision_record", "restraint_training", "first_aid_certification", "medication_competency",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low metrics", () => {
    const records = [makeRecord({
      dbsCurrent: false, qualificationMet: false, trainingUpToDate: false,
      supervisionCurrent: false, documentationComplete: false, timelyRecording: false,
    })];
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: null, staff: [makeTraining()],
    });
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT actions when staff is empty", () => {
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [makeRecord()], policy: makePolicy(), staff: [],
    });
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("builds staff profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "r2", staffId: "s2", staffName: "Tom" }),
    ];
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.staffProfiles).toHaveLength(2);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [], policy: null, staff: [],
    });
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("Reg 31");
  });

  it("no areas for improvement when all metrics high", () => {
    const categories: Array<WorkforceRecord["category"]> = [
      "dbs_compliance", "qualification_level", "mandatory_training", "safeguarding_training",
      "supervision_record", "restraint_training", "first_aid_certification", "medication_competency",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("empty staffProfiles when no records", () => {
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records: [], policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.staffProfiles).toHaveLength(0);
  });

  it("returns outstanding for fully compliant data", () => {
    const categories: Array<WorkforceRecord["category"]> = [
      "dbs_compliance", "qualification_level", "mandatory_training", "safeguarding_training",
      "supervision_record", "restraint_training", "first_aid_certification", "medication_competency",
    ];
    const records = categories.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBe(100);
  });

  it("generates actions for low metrics (<50%)", () => {
    const records = [makeRecord({
      dbsCurrent: false, qualificationMet: false, trainingUpToDate: false,
      documentationComplete: false, timelyRecording: false,
    })];
    const staff = [makeTraining({ supervisionSkills: false })];
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff,
    });
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("no strengths when all metrics are low", () => {
    const records = [makeRecord({
      dbsCurrent: false, qualificationMet: false, trainingUpToDate: false,
      supervisionCurrent: false, documentationComplete: false, timelyRecording: false,
    })];
    const staff = [makeTraining({
      saferRecruitment: false, dbsProcessKnowledge: false, qualificationAssessment: false,
      supervisionSkills: false, trainingCoordination: false, regulatoryCompliance: false,
    })];
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: null, staff,
    });
    expect(result.strengths).toHaveLength(0);
  });

  it("handles mixed staff and categories in profiles", () => {
    const records = [
      makeRecord({ id: "r1", staffId: "s1", staffName: "Sarah", category: "dbs_compliance" }),
      makeRecord({ id: "r2", staffId: "s1", staffName: "Sarah", category: "qualification_level" }),
      makeRecord({ id: "r3", staffId: "s2", staffName: "Tom", category: "mandatory_training" }),
    ];
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy(), staff: [makeTraining()],
    });
    expect(result.staffProfiles).toHaveLength(2);
    const sarah = result.staffProfiles.find(p => p.staffId === "s1");
    expect(sarah?.categoriesCovered).toHaveLength(2);
  });

  it("good rating for partial compliance", () => {
    const records = [
      makeRecord({ id: "r1", category: "dbs_compliance", supervisionCurrent: false, qualificationMet: false }),
      makeRecord({ id: "r2", category: "qualification_level", supervisionCurrent: false, dbsCurrent: false }),
      makeRecord({ id: "r3", category: "mandatory_training", supervisionCurrent: false, trainingUpToDate: false }),
    ];
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy({ supervisionPolicy: false, agencyStaffPolicy: false, workforceDevStrategy: false }),
      staff: [makeTraining({ regulatoryCompliance: false, trainingCoordination: false, supervisionSkills: false })],
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
    expect(result.rating).toBe("good");
  });

  it("requires_improvement rating", () => {
    const records = [
      makeRecord({ id: "r1", category: "dbs_compliance", qualificationMet: false }),
      makeRecord({ id: "r2", category: "qualification_level", dbsCurrent: false }),
      makeRecord({ id: "r3", category: "mandatory_training", supervisionCurrent: false, documentationComplete: false }),
      makeRecord({ id: "r4", category: "safeguarding_training", trainingUpToDate: false, timelyRecording: false }),
    ];
    const result = generateWorkforceIntelligence({
      homeId: "h", periodStart: "s", periodEnd: "e",
      records, policy: makePolicy({
        saferRecruitmentPolicy: false, dbsRenewalPolicy: false, supervisionPolicy: false, agencyStaffPolicy: false, workforceDevStrategy: false,
      }), staff: [makeTraining({ saferRecruitment: false, supervisionSkills: false, trainingCoordination: false, regulatoryCompliance: false })],
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallScore).toBeLessThan(60);
    expect(result.rating).toBe("requires_improvement");
  });
});
