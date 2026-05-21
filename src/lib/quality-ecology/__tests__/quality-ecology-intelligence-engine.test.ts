import { describe, it, expect } from "vitest";
import {
  pct, getRating, getQualityEcologyCategoryLabel, getQualityEcologyOutcomeLabel, getRatingLabel,
  evaluateQualityEcologyQuality, evaluateQualityEcologyCompliance, evaluateQualityEcologyPolicy,
  evaluateStaffQualityEcologyReadiness, buildChildQualityEcologyProfiles, generateQualityEcologyIntelligence,
} from "../quality-ecology-intelligence-engine";
import type {
  QualityEcologyRecord, QualityEcologyPolicy, StaffQualityEcologyTraining,
  QualityEcologyCategory, QualityEcologyOutcome, Rating,
} from "../quality-ecology-intelligence-engine";

function makeRecord(overrides: Partial<QualityEcologyRecord> = {}): QualityEcologyRecord {
  return { id: "qe-1", homeId: "home-oak", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "lifecycle_management", outcome: "fully_compliant", qualityCheckPassed: true, auditTrailComplete: true, lifecycleCorrect: true, recordIntegrityVerified: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<QualityEcologyRecord> = {}): QualityEcologyRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `qe-${i}`, ...o }));
}
function allTruePolicy(): QualityEcologyPolicy {
  return { qualityAssurancePolicy: true, recordLockingPolicy: true, auditTrailPolicy: true, lifecycleManagementPolicy: true, amendmentPolicy: true, qaSamplingPolicy: true, escalationPolicy: true };
}
function allFalsePolicy(): QualityEcologyPolicy {
  return { qualityAssurancePolicy: false, recordLockingPolicy: false, auditTrailPolicy: false, lifecycleManagementPolicy: false, amendmentPolicy: false, qaSamplingPolicy: false, escalationPolicy: false };
}
function makeStaff(o: Partial<StaffQualityEcologyTraining> = {}): StaffQualityEcologyTraining {
  return { staffId: "s1", qualityAssuranceKnowledge: true, recordLockingSkills: true, auditTrailSkills: true, lifecycleManagementSkills: true, qaSamplingSkills: true, amendmentProcedureKnowledge: true, ...o };
}

// ═══ pct ═══
describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("100 for 1/1", () => { expect(pct(1, 1)).toBe(100); });
  it("rounds 2/3 to 67", () => { expect(pct(2, 3)).toBe(67); });
  it("rounds 1/3 to 33", () => { expect(pct(1, 3)).toBe(33); });
  it("0 for 0/5", () => { expect(pct(0, 5)).toBe(0); });
});

// ═══ getRating ═══
describe("getRating", () => {
  it("outstanding ≥80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate <40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ═══ Labels ═══
describe("getQualityEcologyCategoryLabel", () => {
  const cases: [QualityEcologyCategory, string][] = [
    ["lifecycle_management", "Lifecycle Management"], ["record_locking", "Record Locking"], ["audit_trail", "Audit Trail"],
    ["qa_sampling", "QA Sampling"], ["compliance_monitoring", "Compliance Monitoring"], ["escalation_management", "Escalation Management"],
    ["amendment_tracking", "Amendment Tracking"], ["quality_review", "Quality Review"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getQualityEcologyCategoryLabel(c)).toBe(l); });
});

describe("getQualityEcologyOutcomeLabel", () => {
  const cases: [QualityEcologyOutcome, string][] = [
    ["fully_compliant", "Fully Compliant"], ["partially_compliant", "Partially Compliant"],
    ["non_compliant", "Non-Compliant"], ["overdue", "Overdue"], ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getQualityEcologyOutcomeLabel(o)).toBe(l); });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s → %s", (r, l) => { expect(getRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluateQualityEcologyQuality", () => {
  it("0 for empty", () => { const r = evaluateQualityEcologyQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { const r = evaluateQualityEcologyQuality(makeRecords(5)); expect(r.overallScore).toBe(25); expect(r.totalRecords).toBe(5); });
  it("0 for all-false", () => { const r = evaluateQualityEcologyQuality(makeRecords(3, { qualityCheckPassed: false, auditTrailComplete: false, lifecycleCorrect: false, recordIntegrityVerified: false })); expect(r.overallScore).toBe(0); });
  it("weight 7 for qualityCheckPassed", () => { const r = evaluateQualityEcologyQuality([makeRecord({ qualityCheckPassed: true, auditTrailComplete: false, lifecycleCorrect: false, recordIntegrityVerified: false })]); expect(r.overallScore).toBe(7); });
  it("weight 6 for auditTrailComplete", () => { const r = evaluateQualityEcologyQuality([makeRecord({ qualityCheckPassed: false, auditTrailComplete: true, lifecycleCorrect: false, recordIntegrityVerified: false })]); expect(r.overallScore).toBe(6); });
  it("weight 6 for lifecycleCorrect", () => { const r = evaluateQualityEcologyQuality([makeRecord({ qualityCheckPassed: false, auditTrailComplete: false, lifecycleCorrect: true, recordIntegrityVerified: false })]); expect(r.overallScore).toBe(6); });
  it("weight 6 for recordIntegrityVerified", () => { const r = evaluateQualityEcologyQuality([makeRecord({ qualityCheckPassed: false, auditTrailComplete: false, lifecycleCorrect: false, recordIntegrityVerified: true })]); expect(r.overallScore).toBe(6); });
  it("partial rates 50%", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", qualityCheckPassed: false, auditTrailComplete: false, lifecycleCorrect: false, recordIntegrityVerified: false })];
    const r = evaluateQualityEcologyQuality(records);
    expect(r.qualityCheckPassedRate).toBe(50);
    expect(r.overallScore).toBe(12.5);
  });
  it("caps at 25", () => { const r = evaluateQualityEcologyQuality(makeRecords(100)); expect(r.overallScore).toBeLessThanOrEqual(25); });
  it("weights sum to 25", () => { const r = evaluateQualityEcologyQuality([makeRecord()]); expect(r.overallScore).toBe(7 + 6 + 6 + 6); });
  it("rates are percentages", () => {
    const r = evaluateQualityEcologyQuality([makeRecord({ id: "a" }), makeRecord({ id: "b" }), makeRecord({ id: "c", qualityCheckPassed: false })]);
    expect(r.qualityCheckPassedRate).toBe(67);
    expect(r.auditTrailCompleteRate).toBe(100);
  });
});

// ═══ Compliance ═══
describe("evaluateQualityEcologyCompliance", () => {
  it("0 for empty", () => { const r = evaluateQualityEcologyCompliance([]); expect(r.overallScore).toBe(0); expect(r.uniqueCategories).toBe(0); });
  it("25 for perfect with all 8 categories", () => {
    const cats: QualityEcologyCategory[] = ["lifecycle_management", "record_locking", "audit_trail", "qa_sampling", "compliance_monitoring", "escalation_management", "amendment_tracking", "quality_review"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateQualityEcologyCompliance(records);
    expect(r.overallScore).toBe(25);
    expect(r.uniqueCategories).toBe(8);
    expect(r.categoryDiversityRatio).toBe(1);
  });
  it("categoryDiversityRatio for 4/8", () => {
    const cats: QualityEcologyCategory[] = ["lifecycle_management", "record_locking", "audit_trail", "qa_sampling"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateQualityEcologyCompliance(records);
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
  it("single category ratio", () => { const r = evaluateQualityEcologyCompliance(makeRecords(5)); expect(r.uniqueCategories).toBe(1); expect(r.categoryDiversityRatio).toBe(0.13); });
  it("weight 8 for documentationComplete", () => {
    const records = [makeRecord({ documentationComplete: true, timelyRecording: false, qualityCheckPassed: false })];
    const r = evaluateQualityEcologyCompliance(records);
    const catRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((8 + catRatio * 5) * 10) / 10;
    expect(r.overallScore).toBe(expected);
  });
  it("weight 7 for timelyRecording", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: true, qualityCheckPassed: false })];
    const r = evaluateQualityEcologyCompliance(records);
    const catRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((7 + catRatio * 5) * 10) / 10;
    expect(r.overallScore).toBe(expected);
  });
  it("weight 5 for qualityCheckPassed", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, qualityCheckPassed: true })];
    const r = evaluateQualityEcologyCompliance(records);
    const catRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((5 + catRatio * 5) * 10) / 10;
    expect(r.overallScore).toBe(expected);
  });
  it("caps at 25", () => { const r = evaluateQualityEcologyCompliance(makeRecords(100)); expect(r.overallScore).toBeLessThanOrEqual(25); });
  it("diversity ratio for 3 categories", () => {
    const cats: QualityEcologyCategory[] = ["lifecycle_management", "record_locking", "audit_trail"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateQualityEcologyCompliance(records);
    expect(r.categoryDiversityRatio).toBe(0.38);
  });
});

// ═══ Policy ═══
describe("evaluateQualityEcologyPolicy", () => {
  it("0 for null", () => { const r = evaluateQualityEcologyPolicy(null); expect(r.overallScore).toBe(0); expect(r.qualityAssurancePolicy).toBe(false); });
  it("25 for all-true", () => { expect(evaluateQualityEcologyPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateQualityEcologyPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("qualityAssurancePolicy = 4", () => { expect(evaluateQualityEcologyPolicy({ ...allFalsePolicy(), qualityAssurancePolicy: true }).overallScore).toBe(4); });
  it("recordLockingPolicy = 4", () => { expect(evaluateQualityEcologyPolicy({ ...allFalsePolicy(), recordLockingPolicy: true }).overallScore).toBe(4); });
  it("auditTrailPolicy = 4", () => { expect(evaluateQualityEcologyPolicy({ ...allFalsePolicy(), auditTrailPolicy: true }).overallScore).toBe(4); });
  it("lifecycleManagementPolicy = 4", () => { expect(evaluateQualityEcologyPolicy({ ...allFalsePolicy(), lifecycleManagementPolicy: true }).overallScore).toBe(4); });
  it("amendmentPolicy = 3", () => { expect(evaluateQualityEcologyPolicy({ ...allFalsePolicy(), amendmentPolicy: true }).overallScore).toBe(3); });
  it("qaSamplingPolicy = 3", () => { expect(evaluateQualityEcologyPolicy({ ...allFalsePolicy(), qaSamplingPolicy: true }).overallScore).toBe(3); });
  it("escalationPolicy = 3", () => { expect(evaluateQualityEcologyPolicy({ ...allFalsePolicy(), escalationPolicy: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluateQualityEcologyPolicy(allTruePolicy()).overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3); });
  it("partial: one disabled = 22", () => { expect(evaluateQualityEcologyPolicy({ ...allTruePolicy(), escalationPolicy: false }).overallScore).toBe(22); });
  it("partial: two disabled = 19", () => { expect(evaluateQualityEcologyPolicy({ ...allTruePolicy(), escalationPolicy: false, qaSamplingPolicy: false }).overallScore).toBe(19); });
  it("null policy returns all false booleans", () => {
    const r = evaluateQualityEcologyPolicy(null);
    expect(r.recordLockingPolicy).toBe(false);
    expect(r.auditTrailPolicy).toBe(false);
    expect(r.lifecycleManagementPolicy).toBe(false);
    expect(r.amendmentPolicy).toBe(false);
    expect(r.qaSamplingPolicy).toBe(false);
    expect(r.escalationPolicy).toBe(false);
  });
});

// ═══ Staff Readiness ═══
describe("evaluateStaffQualityEcologyReadiness", () => {
  it("0 for empty", () => { const r = evaluateStaffQualityEcologyReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffQualityEcologyReadiness([makeStaff()]).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffQualityEcologyReadiness([makeStaff({ qualityAssuranceKnowledge: false, recordLockingSkills: false, auditTrailSkills: false, lifecycleManagementSkills: false, qaSamplingSkills: false, amendmentProcedureKnowledge: false })]).overallScore).toBe(0); });
  it("qualityAssuranceKnowledge = 6", () => { expect(evaluateStaffQualityEcologyReadiness([makeStaff({ qualityAssuranceKnowledge: true, recordLockingSkills: false, auditTrailSkills: false, lifecycleManagementSkills: false, qaSamplingSkills: false, amendmentProcedureKnowledge: false })]).overallScore).toBe(6); });
  it("recordLockingSkills = 5", () => { expect(evaluateStaffQualityEcologyReadiness([makeStaff({ qualityAssuranceKnowledge: false, recordLockingSkills: true, auditTrailSkills: false, lifecycleManagementSkills: false, qaSamplingSkills: false, amendmentProcedureKnowledge: false })]).overallScore).toBe(5); });
  it("auditTrailSkills = 5", () => { expect(evaluateStaffQualityEcologyReadiness([makeStaff({ qualityAssuranceKnowledge: false, recordLockingSkills: false, auditTrailSkills: true, lifecycleManagementSkills: false, qaSamplingSkills: false, amendmentProcedureKnowledge: false })]).overallScore).toBe(5); });
  it("lifecycleManagementSkills = 4", () => { expect(evaluateStaffQualityEcologyReadiness([makeStaff({ qualityAssuranceKnowledge: false, recordLockingSkills: false, auditTrailSkills: false, lifecycleManagementSkills: true, qaSamplingSkills: false, amendmentProcedureKnowledge: false })]).overallScore).toBe(4); });
  it("qaSamplingSkills = 3", () => { expect(evaluateStaffQualityEcologyReadiness([makeStaff({ qualityAssuranceKnowledge: false, recordLockingSkills: false, auditTrailSkills: false, lifecycleManagementSkills: false, qaSamplingSkills: true, amendmentProcedureKnowledge: false })]).overallScore).toBe(3); });
  it("amendmentProcedureKnowledge = 2", () => { expect(evaluateStaffQualityEcologyReadiness([makeStaff({ qualityAssuranceKnowledge: false, recordLockingSkills: false, auditTrailSkills: false, lifecycleManagementSkills: false, qaSamplingSkills: false, amendmentProcedureKnowledge: true })]).overallScore).toBe(2); });
  it("weights sum to 25", () => { expect(evaluateStaffQualityEcologyReadiness([makeStaff()]).overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2); });
  it("mixed staff partial", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", qualityAssuranceKnowledge: false, amendmentProcedureKnowledge: false })];
    const r = evaluateStaffQualityEcologyReadiness(staff);
    expect(r.totalStaff).toBe(2);
    expect(r.qualityAssuranceKnowledgeRate).toBe(50);
    // (50/100)*6 + 5 + 5 + 4 + 3 + (50/100)*2 = 3+5+5+4+3+1 = 21
    expect(r.overallScore).toBe(21);
  });
  it("three staff with one all-false", () => {
    const staff = [
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2" }),
      makeStaff({ staffId: "s3", qualityAssuranceKnowledge: false, recordLockingSkills: false, auditTrailSkills: false, lifecycleManagementSkills: false, qaSamplingSkills: false, amendmentProcedureKnowledge: false }),
    ];
    const r = evaluateStaffQualityEcologyReadiness(staff);
    expect(r.totalStaff).toBe(3);
    expect(r.qualityAssuranceKnowledgeRate).toBe(67);
  });
  it("rates are percentages 0-100", () => {
    const r = evaluateStaffQualityEcologyReadiness([makeStaff()]);
    expect(r.qualityAssuranceKnowledgeRate).toBe(100);
    expect(r.recordLockingSkillsRate).toBe(100);
  });
});

// ═══ Child Profiles ═══
describe("buildChildQualityEcologyProfiles", () => {
  it("empty for no records", () => { expect(buildChildQualityEcologyProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const profiles = buildChildQualityEcologyProfiles([makeRecord({ id: "a", childId: "c1", childName: "A" }), makeRecord({ id: "b", childId: "c2", childName: "B" }), makeRecord({ id: "c", childId: "c1", childName: "A" })]);
    expect(profiles).toHaveLength(2);
    expect(profiles.find(p => p.childId === "c1")!.totalRecords).toBe(2);
  });
  it("freq=0 for <5", () => { const p = buildChildQualityEcologyProfiles(makeRecords(4, { childId: "c1" })); expect(p[0].overallScore).toBe(6); /* 0+3+3+0 */ });
  it("freq=1 for 5-9", () => { const p = buildChildQualityEcologyProfiles(makeRecords(5, { childId: "c1" })); expect(p[0].overallScore).toBe(7); });
  it("freq=2 for >=10", () => { const p = buildChildQualityEcologyProfiles(makeRecords(10, { childId: "c1" })); expect(p[0].overallScore).toBe(8); });
  it("diversity bonus 1 for 2 cats", () => {
    const records = [makeRecord({ id: "a", childId: "c1", category: "lifecycle_management" }), makeRecord({ id: "b", childId: "c1", category: "record_locking" })];
    const p = buildChildQualityEcologyProfiles(records);
    expect(p[0].overallScore).toBe(7); // 0+3+3+1
  });
  it("diversity bonus 2 for >=4 cats", () => {
    const cats: QualityEcologyCategory[] = ["lifecycle_management", "record_locking", "audit_trail", "qa_sampling"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c }));
    const p = buildChildQualityEcologyProfiles(records);
    expect(p[0].overallScore).toBe(8); // 0+3+3+2
  });
  it("caps at 10", () => {
    const cats: QualityEcologyCategory[] = ["lifecycle_management", "record_locking", "audit_trail", "qa_sampling", "compliance_monitoring", "escalation_management", "amendment_tracking", "quality_review"];
    const records = cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", category: c })));
    const p = buildChildQualityEcologyProfiles(records);
    expect(p[0].overallScore).toBe(10);
  });
  it("rate1 bands: <40→0, >=40→1, >=60→2, >=80→3", () => {
    // all false qualityCheckPassed = 0% rate → rate1 = 0
    const p1 = buildChildQualityEcologyProfiles(makeRecords(3, { childId: "c1", qualityCheckPassed: false }));
    expect(p1[0].qualityCheckPassedRate).toBe(0);

    // 2/3 = 67% → rate1 = 2
    const recs = [makeRecord({ id: "a", childId: "c1" }), makeRecord({ id: "b", childId: "c1" }), makeRecord({ id: "c", childId: "c1", qualityCheckPassed: false })];
    const p2 = buildChildQualityEcologyProfiles(recs);
    expect(p2[0].qualityCheckPassedRate).toBe(67);
  });
  it("rate2 bands: <40→0, >=40→1, >=60→2, >=80→3", () => {
    // all false auditTrailComplete = 0% rate → rate2 = 0
    const p1 = buildChildQualityEcologyProfiles(makeRecords(3, { childId: "c1", auditTrailComplete: false }));
    expect(p1[0].auditTrailCompleteRate).toBe(0);
  });
  it("categoriesCovered returns unique categories", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", category: "lifecycle_management" }),
      makeRecord({ id: "b", childId: "c1", category: "lifecycle_management" }),
      makeRecord({ id: "c", childId: "c1", category: "record_locking" }),
    ];
    const p = buildChildQualityEcologyProfiles(records);
    expect(p[0].categoriesCovered).toHaveLength(2);
    expect(p[0].categoriesCovered).toContain("lifecycle_management");
    expect(p[0].categoriesCovered).toContain("record_locking");
  });
  it("low quality rates give low score", () => {
    const p = buildChildQualityEcologyProfiles(makeRecords(2, { childId: "c1", qualityCheckPassed: false, auditTrailComplete: false }));
    expect(p[0].overallScore).toBe(0); // 0 freq + 0 rate1 + 0 rate2 + 0 diversity
  });
  it("40% rate gives score 1", () => {
    // 2/5 = 40% → rate1 = 1
    const recs = [
      makeRecord({ id: "a", childId: "c1", qualityCheckPassed: true, auditTrailComplete: false }),
      makeRecord({ id: "b", childId: "c1", qualityCheckPassed: true, auditTrailComplete: false }),
      makeRecord({ id: "c", childId: "c1", qualityCheckPassed: false, auditTrailComplete: false }),
      makeRecord({ id: "d", childId: "c1", qualityCheckPassed: false, auditTrailComplete: false }),
      makeRecord({ id: "e", childId: "c1", qualityCheckPassed: false, auditTrailComplete: false }),
    ];
    const p = buildChildQualityEcologyProfiles(recs);
    expect(p[0].qualityCheckPassedRate).toBe(40);
    // freq=1, rate1=1, rate2=0, diversity=0
    expect(p[0].overallScore).toBe(2);
  });
  it("single child single record", () => {
    const p = buildChildQualityEcologyProfiles([makeRecord({ childId: "c1" })]);
    expect(p).toHaveLength(1);
    expect(p[0].totalRecords).toBe(1);
    expect(p[0].qualityCheckPassedRate).toBe(100);
    expect(p[0].auditTrailCompleteRate).toBe(100);
  });
});

// ═══ Orchestrator ═══
describe("generateQualityEcologyIntelligence", () => {
  it("outstanding for perfect data", () => {
    const cats: QualityEcologyCategory[] = ["lifecycle_management", "record_locking", "audit_trail", "qa_sampling", "compliance_monitoring", "escalation_management", "amendment_tracking", "quality_review"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ id: "in", date: "2026-06-15" }), makeRecord({ id: "out", date: "2025-01-01" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.qualityEcologyQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.qualityEcologyQuality).toBeDefined();
    expect(r.qualityEcologyCompliance).toBeDefined();
    expect(r.qualityEcologyPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });
  it("includes child profiles", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ childId: "c1" }), makeRecord({ id: "b", childId: "c2" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.childProfiles).toHaveLength(2);
  });
  it("includes regulatory links", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.length).toBeGreaterThan(0);
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 36"))).toBe(true);
  });
  it("strengths for outstanding", () => {
    const cats: QualityEcologyCategory[] = ["lifecycle_management", "record_locking", "audit_trail", "qa_sampling", "compliance_monitoring", "escalation_management", "amendment_tracking", "quality_review"];
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("areas for improvement when no records", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("actions when policy null", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
  it("caps overall score at 100", () => {
    const cats: QualityEcologyCategory[] = ["lifecycle_management", "record_locking", "audit_trail", "qa_sampling", "compliance_monitoring", "escalation_management", "amendment_tracking", "quality_review"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("null policy gives 0 policy score", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: null, staff: [makeStaff()] });
    expect(r.qualityEcologyPolicy.overallScore).toBe(0);
  });
  it("empty staff gives 0 staff score", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [] });
    expect(r.staffReadiness.overallScore).toBe(0);
  });
  it("homeId is passed through", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-maple", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.homeId).toBe("home-maple");
  });
  it("periodStart and periodEnd are passed through", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-02-01", periodEnd: "2026-06-30", records: [], policy: null, staff: [] });
    expect(r.periodStart).toBe("2026-02-01");
    expect(r.periodEnd).toBe("2026-06-30");
  });
  it("date filtering excludes records outside period", () => {
    const records = [
      makeRecord({ id: "before", date: "2025-12-31" }),
      makeRecord({ id: "start", date: "2026-01-01" }),
      makeRecord({ id: "mid", date: "2026-06-15" }),
      makeRecord({ id: "end", date: "2026-12-31" }),
      makeRecord({ id: "after", date: "2027-01-01" }),
    ];
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.qualityEcologyQuality.totalRecords).toBe(3);
  });
  it("strengths mention quality check rate >=90%", () => {
    const records = makeRecords(10);
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("Quality check pass rate"))).toBe(true);
  });
  it("areas for improvement for low quality check rate", () => {
    const records = makeRecords(5, { qualityCheckPassed: false });
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.areasForImprovement.some(a => a.includes("Quality check pass rate"))).toBe(true);
  });
  it("actions for low quality check rate (<50%)", () => {
    const records = makeRecords(5, { qualityCheckPassed: false });
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("HIGH"))).toBe(true);
  });
  it("no actions needed message when all good", () => {
    const cats: QualityEcologyCategory[] = ["lifecycle_management", "record_locking", "audit_trail", "qa_sampling", "compliance_monitoring", "escalation_management", "amendment_tracking", "quality_review"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("No immediate actions required"))).toBe(true);
  });
  it("includes regulatory link for Data Protection Act 2018", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some(l => l.includes("Data Protection Act 2018"))).toBe(true);
  });
  it("includes regulatory link for NMS 22", () => {
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some(l => l.includes("NMS 22"))).toBe(true);
  });
  it("child profiles with low scores generate actions", () => {
    const records = makeRecords(3, { childId: "c1", qualityCheckPassed: false, auditTrailComplete: false });
    const r = generateQualityEcologyIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("child(ren) with low quality ecology scores"))).toBe(true);
  });
});
