import { describe, it, expect } from "vitest";
import {
  pct, getRating, getSafeguardingOversightIntelligenceCategoryLabel, getSafeguardingOversightIntelligenceOutcomeLabel, getIntelligenceRatingLabel,
  evaluateSafeguardingOversightQuality, evaluateSafeguardingOversightCompliance, evaluateSafeguardingOversightPolicy,
  evaluateStaffSafeguardingOversightReadiness, buildChildSafeguardingOversightProfiles, generateSafeguardingOversightIntelligenceResult,
} from "../safeguarding-oversight-intelligence-engine";
import type {
  SafeguardingOversightRecord, SafeguardingOversightPolicy, StaffSafeguardingOversightTraining,
  SafeguardingOversightIntelligenceCategory, SafeguardingOversightIntelligenceOutcome, Rating,
} from "../safeguarding-oversight-intelligence-engine";

function makeRecord(overrides: Partial<SafeguardingOversightRecord> = {}): SafeguardingOversightRecord {
  return { id: "so-1", homeId: "home-oak", date: "2025-03-15", childId: "child-alex", childName: "Alex", category: "safeguarding_referral", outcome: "effective_safeguarding", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<SafeguardingOversightRecord> = {}): SafeguardingOversightRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `so-${i}`, ...o }));
}
function allTruePolicy(): SafeguardingOversightPolicy {
  return { safeguardingPolicy: true, saferRecruitmentPolicy: true, whistleblowingPolicy: true, allegationsManagementPolicy: true, onlineSafetyPolicy: true, bodyMapProtocol: true, safeguardingSupervisionPolicy: true };
}
function allFalsePolicy(): SafeguardingOversightPolicy {
  return { safeguardingPolicy: false, saferRecruitmentPolicy: false, whistleblowingPolicy: false, allegationsManagementPolicy: false, onlineSafetyPolicy: false, bodyMapProtocol: false, safeguardingSupervisionPolicy: false };
}
function makeStaff(o: Partial<StaffSafeguardingOversightTraining> = {}): StaffSafeguardingOversightTraining {
  return { staffId: "s1", safeguardingAwareness: true, recognisingSigns: true, referralProcedures: true, recordKeepingSkills: true, multiAgencyWorking: true, onlineSafetyKnowledge: true, ...o };
}

// ═══ pct ═══
describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("100 for 1/1", () => { expect(pct(1, 1)).toBe(100); });
  it("rounds 2/3 to 67", () => { expect(pct(2, 3)).toBe(67); });
  it("rounds 1/3 to 33", () => { expect(pct(1, 3)).toBe(33); });
  it("0 for 0/5", () => { expect(pct(0, 5)).toBe(0); });
  it("50 for 1/2", () => { expect(pct(1, 2)).toBe(50); });
});

// ═══ getRating ═══
describe("getRating", () => {
  it("outstanding for 80", () => { expect(getRating(80)).toBe("outstanding"); });
  it("outstanding for 100", () => { expect(getRating(100)).toBe("outstanding"); });
  it("outstanding for 95", () => { expect(getRating(95)).toBe("outstanding"); });
  it("good for 60", () => { expect(getRating(60)).toBe("good"); });
  it("good for 79", () => { expect(getRating(79)).toBe("good"); });
  it("good for 70", () => { expect(getRating(70)).toBe("good"); });
  it("requires_improvement for 40", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("requires_improvement for 59", () => { expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate for 39", () => { expect(getRating(39)).toBe("inadequate"); });
  it("inadequate for 0", () => { expect(getRating(0)).toBe("inadequate"); });
  it("inadequate for 10", () => { expect(getRating(10)).toBe("inadequate"); });
});

// ═══ Labels ═══
describe("getSafeguardingOversightIntelligenceCategoryLabel", () => {
  const cases: [SafeguardingOversightIntelligenceCategory, string][] = [
    ["safeguarding_referral", "Safeguarding Referral"],
    ["concern_assessment", "Concern Assessment"],
    ["multi_agency_strategy", "Multi-Agency Strategy"],
    ["dbs_compliance_check", "DBS Compliance Check"],
    ["safeguarding_training", "Safeguarding Training"],
    ["threshold_decision", "Threshold Decision"],
    ["section47_investigation", "Section 47 Investigation"],
    ["safeguarding_audit", "Safeguarding Audit"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getSafeguardingOversightIntelligenceCategoryLabel(c)).toBe(l); });
});

describe("getSafeguardingOversightIntelligenceOutcomeLabel", () => {
  const cases: [SafeguardingOversightIntelligenceOutcome, string][] = [
    ["effective_safeguarding", "Effective Safeguarding"],
    ["partially_effective", "Partially Effective"],
    ["concerns_identified", "Concerns Identified"],
    ["safeguarding_failure", "Safeguarding Failure"],
    ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getSafeguardingOversightIntelligenceOutcomeLabel(o)).toBe(l); });
});

describe("getIntelligenceRatingLabel", () => {
  const cases: [Rating, string][] = [
    ["outstanding", "Outstanding"],
    ["good", "Good"],
    ["requires_improvement", "Requires Improvement"],
    ["inadequate", "Inadequate"],
  ];
  it.each(cases)("%s → %s", (r, l) => { expect(getIntelligenceRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluateSafeguardingOversightQuality", () => {
  it("0 for empty", () => {
    const r = evaluateSafeguardingOversightQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.riskAssessmentCompletedRate).toBe(0);
    expect(r.safeguardingLeadInformedRate).toBe(0);
    expect(r.multiAgencyEngagedRate).toBe(0);
    expect(r.childViewCapturedRate).toBe(0);
  });
  it("25 for perfect", () => { expect(evaluateSafeguardingOversightQuality(makeRecords(5)).overallScore).toBe(25); });
  it("0 for all-false", () => {
    expect(evaluateSafeguardingOversightQuality(makeRecords(3, { riskAssessmentCompleted: false, safeguardingLeadInformed: false, multiAgencyEngaged: false, childViewCaptured: false })).overallScore).toBe(0);
  });
  it("weight 7 for riskAssessmentCompleted", () => {
    expect(evaluateSafeguardingOversightQuality([makeRecord({ riskAssessmentCompleted: true, safeguardingLeadInformed: false, multiAgencyEngaged: false, childViewCaptured: false })]).overallScore).toBe(7);
  });
  it("weight 6 for safeguardingLeadInformed", () => {
    expect(evaluateSafeguardingOversightQuality([makeRecord({ riskAssessmentCompleted: false, safeguardingLeadInformed: true, multiAgencyEngaged: false, childViewCaptured: false })]).overallScore).toBe(6);
  });
  it("weight 6 for multiAgencyEngaged", () => {
    expect(evaluateSafeguardingOversightQuality([makeRecord({ riskAssessmentCompleted: false, safeguardingLeadInformed: false, multiAgencyEngaged: true, childViewCaptured: false })]).overallScore).toBe(6);
  });
  it("weight 6 for childViewCaptured", () => {
    expect(evaluateSafeguardingOversightQuality([makeRecord({ riskAssessmentCompleted: false, safeguardingLeadInformed: false, multiAgencyEngaged: false, childViewCaptured: true })]).overallScore).toBe(6);
  });
  it("weights sum to 25", () => {
    expect(evaluateSafeguardingOversightQuality([makeRecord()]).overallScore).toBe(7 + 6 + 6 + 6);
  });
  it("50% partial = 12.5", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", riskAssessmentCompleted: false, safeguardingLeadInformed: false, multiAgencyEngaged: false, childViewCaptured: false })];
    expect(evaluateSafeguardingOversightQuality(records).overallScore).toBe(12.5);
  });
  it("caps at 25", () => { expect(evaluateSafeguardingOversightQuality(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
  it("reports correct rates", () => {
    const records = [
      makeRecord({ id: "a", riskAssessmentCompleted: true, safeguardingLeadInformed: true, multiAgencyEngaged: false, childViewCaptured: false }),
      makeRecord({ id: "b", riskAssessmentCompleted: false, safeguardingLeadInformed: true, multiAgencyEngaged: true, childViewCaptured: false }),
    ];
    const r = evaluateSafeguardingOversightQuality(records);
    expect(r.riskAssessmentCompletedRate).toBe(50);
    expect(r.safeguardingLeadInformedRate).toBe(100);
    expect(r.multiAgencyEngagedRate).toBe(50);
    expect(r.childViewCapturedRate).toBe(0);
  });
  it("single record all true", () => {
    const r = evaluateSafeguardingOversightQuality([makeRecord()]);
    expect(r.totalRecords).toBe(1);
    expect(r.riskAssessmentCompletedRate).toBe(100);
  });
  it("handles large dataset", () => {
    const r = evaluateSafeguardingOversightQuality(makeRecords(500));
    expect(r.overallScore).toBe(25);
    expect(r.totalRecords).toBe(500);
  });
});

// ═══ Compliance ═══
describe("evaluateSafeguardingOversightCompliance", () => {
  it("0 for empty", () => {
    const r = evaluateSafeguardingOversightCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.documentationCompleteRate).toBe(0);
    expect(r.timelyRecordingRate).toBe(0);
    expect(r.riskAssessmentCompletedRate).toBe(0);
    expect(r.categoryDiversityRatio).toBe(0);
    expect(r.uniqueCategories).toBe(0);
  });
  it("25 for perfect with 8 categories", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check", "safeguarding_training", "threshold_decision", "section47_investigation", "safeguarding_audit"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    expect(evaluateSafeguardingOversightCompliance(records).overallScore).toBe(25);
  });
  it("4/8 = 0.5 ratio", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check"];
    const r = evaluateSafeguardingOversightCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })));
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
  it("single category = 0.13", () => {
    expect(evaluateSafeguardingOversightCompliance(makeRecords(5)).categoryDiversityRatio).toBe(0.13);
  });
  it("caps at 25", () => {
    expect(evaluateSafeguardingOversightCompliance(makeRecords(100)).overallScore).toBeLessThanOrEqual(25);
  });
  it("2/8 = 0.25 ratio", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment"];
    const r = evaluateSafeguardingOversightCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })));
    expect(r.categoryDiversityRatio).toBe(0.25);
  });
  it("documentation weight 8", () => {
    const r = evaluateSafeguardingOversightCompliance([makeRecord({ documentationComplete: true, timelyRecording: false, riskAssessmentCompleted: false })]);
    // 8 + 0 + 0 + (1/8)*5 = 8 + 0.63 = 8.6
    expect(r.overallScore).toBeGreaterThanOrEqual(8);
  });
  it("all false booleans still gets diversity score", () => {
    const r = evaluateSafeguardingOversightCompliance([makeRecord({ documentationComplete: false, timelyRecording: false, riskAssessmentCompleted: false })]);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.categoryDiversityRatio).toBe(0.13);
  });
  it("reports correct unique categories count", () => {
    const records = [
      makeRecord({ id: "a", category: "safeguarding_referral" }),
      makeRecord({ id: "b", category: "safeguarding_referral" }),
      makeRecord({ id: "c", category: "concern_assessment" }),
    ];
    const r = evaluateSafeguardingOversightCompliance(records);
    expect(r.uniqueCategories).toBe(2);
  });
  it("6/8 categories = 0.75", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check", "safeguarding_training", "threshold_decision"];
    const r = evaluateSafeguardingOversightCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })));
    expect(r.categoryDiversityRatio).toBe(0.75);
  });
  it("8/8 categories = 1", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check", "safeguarding_training", "threshold_decision", "section47_investigation", "safeguarding_audit"];
    const r = evaluateSafeguardingOversightCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })));
    expect(r.categoryDiversityRatio).toBe(1);
  });
});

// ═══ Policy ═══
describe("evaluateSafeguardingOversightPolicy", () => {
  it("0 for null", () => {
    const r = evaluateSafeguardingOversightPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.safeguardingPolicy).toBe(false);
    expect(r.saferRecruitmentPolicy).toBe(false);
    expect(r.whistleblowingPolicy).toBe(false);
    expect(r.allegationsManagementPolicy).toBe(false);
    expect(r.onlineSafetyPolicy).toBe(false);
    expect(r.bodyMapProtocol).toBe(false);
    expect(r.safeguardingSupervisionPolicy).toBe(false);
  });
  it("25 for all-true", () => { expect(evaluateSafeguardingOversightPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateSafeguardingOversightPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("safeguardingPolicy = 4", () => { expect(evaluateSafeguardingOversightPolicy({ ...allFalsePolicy(), safeguardingPolicy: true }).overallScore).toBe(4); });
  it("saferRecruitmentPolicy = 4", () => { expect(evaluateSafeguardingOversightPolicy({ ...allFalsePolicy(), saferRecruitmentPolicy: true }).overallScore).toBe(4); });
  it("whistleblowingPolicy = 4", () => { expect(evaluateSafeguardingOversightPolicy({ ...allFalsePolicy(), whistleblowingPolicy: true }).overallScore).toBe(4); });
  it("allegationsManagementPolicy = 4", () => { expect(evaluateSafeguardingOversightPolicy({ ...allFalsePolicy(), allegationsManagementPolicy: true }).overallScore).toBe(4); });
  it("onlineSafetyPolicy = 3", () => { expect(evaluateSafeguardingOversightPolicy({ ...allFalsePolicy(), onlineSafetyPolicy: true }).overallScore).toBe(3); });
  it("bodyMapProtocol = 3", () => { expect(evaluateSafeguardingOversightPolicy({ ...allFalsePolicy(), bodyMapProtocol: true }).overallScore).toBe(3); });
  it("safeguardingSupervisionPolicy = 3", () => { expect(evaluateSafeguardingOversightPolicy({ ...allFalsePolicy(), safeguardingSupervisionPolicy: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluateSafeguardingOversightPolicy(allTruePolicy()).overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3); });
  it("first 4 policies = 16", () => {
    const r = evaluateSafeguardingOversightPolicy({ ...allFalsePolicy(), safeguardingPolicy: true, saferRecruitmentPolicy: true, whistleblowingPolicy: true, allegationsManagementPolicy: true });
    expect(r.overallScore).toBe(16);
  });
  it("last 3 policies = 9", () => {
    const r = evaluateSafeguardingOversightPolicy({ ...allFalsePolicy(), onlineSafetyPolicy: true, bodyMapProtocol: true, safeguardingSupervisionPolicy: true });
    expect(r.overallScore).toBe(9);
  });
  it("all-true reflects correct booleans", () => {
    const r = evaluateSafeguardingOversightPolicy(allTruePolicy());
    expect(r.safeguardingPolicy).toBe(true);
    expect(r.saferRecruitmentPolicy).toBe(true);
    expect(r.whistleblowingPolicy).toBe(true);
    expect(r.allegationsManagementPolicy).toBe(true);
    expect(r.onlineSafetyPolicy).toBe(true);
    expect(r.bodyMapProtocol).toBe(true);
    expect(r.safeguardingSupervisionPolicy).toBe(true);
  });
  it("all-false reflects correct booleans", () => {
    const r = evaluateSafeguardingOversightPolicy(allFalsePolicy());
    expect(r.safeguardingPolicy).toBe(false);
    expect(r.bodyMapProtocol).toBe(false);
  });
});

// ═══ Staff Readiness ═══
describe("evaluateStaffSafeguardingOversightReadiness", () => {
  it("0 for empty", () => {
    const r = evaluateStaffSafeguardingOversightReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.safeguardingAwarenessRate).toBe(0);
    expect(r.recognisingSignsRate).toBe(0);
    expect(r.referralProceduresRate).toBe(0);
    expect(r.recordKeepingSkillsRate).toBe(0);
    expect(r.multiAgencyWorkingRate).toBe(0);
    expect(r.onlineSafetyKnowledgeRate).toBe(0);
  });
  it("25 for all-true", () => { expect(evaluateStaffSafeguardingOversightReadiness([makeStaff()]).overallScore).toBe(25); });
  it("0 for all-false", () => {
    expect(evaluateStaffSafeguardingOversightReadiness([makeStaff({ safeguardingAwareness: false, recognisingSigns: false, referralProcedures: false, recordKeepingSkills: false, multiAgencyWorking: false, onlineSafetyKnowledge: false })]).overallScore).toBe(0);
  });
  it("safeguardingAwareness = 6", () => {
    expect(evaluateStaffSafeguardingOversightReadiness([makeStaff({ safeguardingAwareness: true, recognisingSigns: false, referralProcedures: false, recordKeepingSkills: false, multiAgencyWorking: false, onlineSafetyKnowledge: false })]).overallScore).toBe(6);
  });
  it("recognisingSigns = 5", () => {
    expect(evaluateStaffSafeguardingOversightReadiness([makeStaff({ safeguardingAwareness: false, recognisingSigns: true, referralProcedures: false, recordKeepingSkills: false, multiAgencyWorking: false, onlineSafetyKnowledge: false })]).overallScore).toBe(5);
  });
  it("referralProcedures = 5", () => {
    expect(evaluateStaffSafeguardingOversightReadiness([makeStaff({ safeguardingAwareness: false, recognisingSigns: false, referralProcedures: true, recordKeepingSkills: false, multiAgencyWorking: false, onlineSafetyKnowledge: false })]).overallScore).toBe(5);
  });
  it("recordKeepingSkills = 4", () => {
    expect(evaluateStaffSafeguardingOversightReadiness([makeStaff({ safeguardingAwareness: false, recognisingSigns: false, referralProcedures: false, recordKeepingSkills: true, multiAgencyWorking: false, onlineSafetyKnowledge: false })]).overallScore).toBe(4);
  });
  it("multiAgencyWorking = 3", () => {
    expect(evaluateStaffSafeguardingOversightReadiness([makeStaff({ safeguardingAwareness: false, recognisingSigns: false, referralProcedures: false, recordKeepingSkills: false, multiAgencyWorking: true, onlineSafetyKnowledge: false })]).overallScore).toBe(3);
  });
  it("onlineSafetyKnowledge = 2", () => {
    expect(evaluateStaffSafeguardingOversightReadiness([makeStaff({ safeguardingAwareness: false, recognisingSigns: false, referralProcedures: false, recordKeepingSkills: false, multiAgencyWorking: false, onlineSafetyKnowledge: true })]).overallScore).toBe(2);
  });
  it("weights sum to 25", () => { expect(evaluateStaffSafeguardingOversightReadiness([makeStaff()]).overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2); });
  it("mixed staff averages correctly", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", safeguardingAwareness: false, onlineSafetyKnowledge: false })];
    expect(evaluateStaffSafeguardingOversightReadiness(staff).overallScore).toBe(21);
  });
  it("3 staff all-true", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2" }), makeStaff({ staffId: "s3" })];
    const r = evaluateStaffSafeguardingOversightReadiness(staff);
    expect(r.totalStaff).toBe(3);
    expect(r.overallScore).toBe(25);
  });
  it("reports correct rates for mixed staff", () => {
    const staff = [
      makeStaff({ staffId: "s1", safeguardingAwareness: true, recognisingSigns: false }),
      makeStaff({ staffId: "s2", safeguardingAwareness: false, recognisingSigns: true }),
    ];
    const r = evaluateStaffSafeguardingOversightReadiness(staff);
    expect(r.safeguardingAwarenessRate).toBe(50);
    expect(r.recognisingSignsRate).toBe(50);
  });
});

// ═══ Child Profiles ═══
describe("buildChildSafeguardingOversightProfiles", () => {
  it("empty for no records", () => { expect(buildChildSafeguardingOversightProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const profiles = buildChildSafeguardingOversightProfiles([makeRecord({ id: "a", childId: "c1" }), makeRecord({ id: "b", childId: "c2" }), makeRecord({ id: "c", childId: "c1" })]);
    expect(profiles).toHaveLength(2);
  });
  it("freq=0 for <5", () => {
    expect(buildChildSafeguardingOversightProfiles(makeRecords(4, { childId: "c1" }))[0].overallScore).toBe(6);
  });
  it("freq=1 for 5-9", () => {
    expect(buildChildSafeguardingOversightProfiles(makeRecords(5, { childId: "c1" }))[0].overallScore).toBe(7);
  });
  it("freq=2 for >=10", () => {
    expect(buildChildSafeguardingOversightProfiles(makeRecords(10, { childId: "c1" }))[0].overallScore).toBe(8);
  });
  it("diversity 2 for >=4 cats", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check"];
    expect(buildChildSafeguardingOversightProfiles(cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c })))[0].overallScore).toBe(8);
  });
  it("diversity 1 for 2-3 cats", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment"];
    expect(buildChildSafeguardingOversightProfiles(cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c })))[0].overallScore).toBe(7);
  });
  it("diversity 0 for 1 cat", () => {
    expect(buildChildSafeguardingOversightProfiles([makeRecord({ childId: "c1" })])[0].overallScore).toBe(6);
  });
  it("caps at 10", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check", "safeguarding_training", "threshold_decision", "section47_investigation", "safeguarding_audit"];
    expect(buildChildSafeguardingOversightProfiles(cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", category: c }))))[0].overallScore).toBe(10);
  });
  it("rate1 scoring thresholds", () => {
    // rate1 (riskAssessmentCompletedRate): >=80→3, >=60→2, >=40→1, <40→0
    // 3 out of 4 = 75% → rate1=2, rate2=3, diversity=0, freq=0 = 5
    const records = [
      makeRecord({ id: "a", childId: "c1", riskAssessmentCompleted: true }),
      makeRecord({ id: "b", childId: "c1", riskAssessmentCompleted: true }),
      makeRecord({ id: "c", childId: "c1", riskAssessmentCompleted: true }),
      makeRecord({ id: "d", childId: "c1", riskAssessmentCompleted: false }),
    ];
    const profile = buildChildSafeguardingOversightProfiles(records)[0];
    expect(profile.riskAssessmentCompletedRate).toBe(75);
    expect(profile.overallScore).toBe(5);
  });
  it("rate2 scoring thresholds", () => {
    // 2 out of 4 = 50% → rate2=1, rate1=3, diversity=0, freq=0 = 4
    const records = [
      makeRecord({ id: "a", childId: "c1", safeguardingLeadInformed: true }),
      makeRecord({ id: "b", childId: "c1", safeguardingLeadInformed: true }),
      makeRecord({ id: "c", childId: "c1", safeguardingLeadInformed: false }),
      makeRecord({ id: "d", childId: "c1", safeguardingLeadInformed: false }),
    ];
    const profile = buildChildSafeguardingOversightProfiles(records)[0];
    expect(profile.safeguardingLeadInformedRate).toBe(50);
    expect(profile.overallScore).toBe(4);
  });
  it("zero rates give 0 for rate scores", () => {
    const records = makeRecords(3, { childId: "c1", riskAssessmentCompleted: false, safeguardingLeadInformed: false });
    const profile = buildChildSafeguardingOversightProfiles(records)[0];
    expect(profile.riskAssessmentCompletedRate).toBe(0);
    expect(profile.safeguardingLeadInformedRate).toBe(0);
    expect(profile.overallScore).toBe(0);
  });
  it("preserves child name", () => {
    const profiles = buildChildSafeguardingOversightProfiles([makeRecord({ childId: "c1", childName: "Jordan" })]);
    expect(profiles[0].childName).toBe("Jordan");
  });
  it("categoriesCovered lists unique categories", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", category: "safeguarding_referral" }),
      makeRecord({ id: "b", childId: "c1", category: "safeguarding_referral" }),
      makeRecord({ id: "c", childId: "c1", category: "concern_assessment" }),
    ];
    const profile = buildChildSafeguardingOversightProfiles(records)[0];
    expect(profile.categoriesCovered).toHaveLength(2);
    expect(profile.categoriesCovered).toContain("safeguarding_referral");
    expect(profile.categoriesCovered).toContain("concern_assessment");
  });
  it("multiple children independent scoring", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", childName: "Alex", riskAssessmentCompleted: true, safeguardingLeadInformed: true }),
      makeRecord({ id: "b", childId: "c2", childName: "Jordan", riskAssessmentCompleted: false, safeguardingLeadInformed: false }),
    ];
    const profiles = buildChildSafeguardingOversightProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].overallScore).toBeGreaterThan(profiles[1].overallScore);
  });
});

// ═══ Orchestrator ═══
describe("generateSafeguardingOversightIntelligenceResult", () => {
  it("outstanding for perfect data", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check", "safeguarding_training", "threshold_decision", "section47_investigation", "safeguarding_audit"];
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [makeRecord({ date: "2025-06-15" }), makeRecord({ id: "out", date: "2024-01-01" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.safeguardingOversightQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.safeguardingOversightQuality).toBeDefined();
    expect(r.safeguardingOversightCompliance).toBeDefined();
    expect(r.safeguardingOversightPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });
  it("includes child profiles", () => {
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [makeRecord({ childId: "c1" }), makeRecord({ id: "b", childId: "c2" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.childProfiles).toHaveLength(2);
  });
  it("includes regulatory links", () => {
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 32"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 34"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("KCSIE 2024"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("NMS 3"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("Working Together 2023"))).toBe(true);
  });
  it("actions when policy null", () => {
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
  it("caps overall at 100", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check", "safeguarding_training", "threshold_decision", "section47_investigation", "safeguarding_audit"];
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("strengths for outstanding", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check", "safeguarding_training", "threshold_decision", "section47_investigation", "safeguarding_audit"];
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("Outstanding"))).toBe(true);
  });
  it("areas for improvement for empty data", () => {
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
    expect(r.areasForImprovement.some(a => a.includes("No safeguarding oversight records"))).toBe(true);
    expect(r.areasForImprovement.some(a => a.includes("No safeguarding policy"))).toBe(true);
    expect(r.areasForImprovement.some(a => a.includes("No staff safeguarding training"))).toBe(true);
  });
  it("preserves homeId and period", () => {
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-willow", periodStart: "2025-06-01", periodEnd: "2025-12-31", records: [], policy: null, staff: [] });
    expect(r.homeId).toBe("home-willow");
    expect(r.periodStart).toBe("2025-06-01");
    expect(r.periodEnd).toBe("2025-12-31");
  });
  it("partial data gives intermediate rating", () => {
    const r = generateSafeguardingOversightIntelligenceResult({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: [makeRecord()],
      policy: allTruePolicy(),
      staff: [],
    });
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(100);
  });
  it("no actions message when all is well", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check", "safeguarding_training", "threshold_decision", "section47_investigation", "safeguarding_audit"];
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("No immediate actions"))).toBe(true);
  });
  it("excludes out-of-period records from child profiles", () => {
    const r = generateSafeguardingOversightIntelligenceResult({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: [
        makeRecord({ id: "in", date: "2025-06-01", childId: "c1" }),
        makeRecord({ id: "out", date: "2024-01-01", childId: "c1" }),
      ],
      policy: null, staff: [],
    });
    expect(r.childProfiles).toHaveLength(1);
    expect(r.childProfiles[0].totalRecords).toBe(1);
  });
  it("strengths include DSL informed when high", () => {
    const cats: SafeguardingOversightIntelligenceCategory[] = ["safeguarding_referral", "concern_assessment", "multi_agency_strategy", "dbs_compliance_check", "safeguarding_training", "threshold_decision", "section47_investigation", "safeguarding_audit"];
    const r = generateSafeguardingOversightIntelligenceResult({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.some(s => s.includes("safeguarding lead informed"))).toBe(true);
  });
  it("actions for low risk assessment rate", () => {
    const r = generateSafeguardingOversightIntelligenceResult({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: [
        makeRecord({ id: "a", riskAssessmentCompleted: false }),
        makeRecord({ id: "b", riskAssessmentCompleted: false }),
        makeRecord({ id: "c", riskAssessmentCompleted: false }),
      ],
      policy: allTruePolicy(), staff: [makeStaff()],
    });
    expect(r.actions.some(a => a.includes("HIGH: Risk assessment"))).toBe(true);
  });
  it("actions for low multi-agency engagement", () => {
    const r = generateSafeguardingOversightIntelligenceResult({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: [
        makeRecord({ id: "a", multiAgencyEngaged: false }),
        makeRecord({ id: "b", multiAgencyEngaged: false }),
        makeRecord({ id: "c", multiAgencyEngaged: false }),
      ],
      policy: allTruePolicy(), staff: [makeStaff()],
    });
    expect(r.actions.some(a => a.includes("Multi-agency engagement"))).toBe(true);
  });
  it("areas for improvement for low quality score", () => {
    const r = generateSafeguardingOversightIntelligenceResult({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: [makeRecord({ riskAssessmentCompleted: false, safeguardingLeadInformed: false, multiAgencyEngaged: false, childViewCaptured: false })],
      policy: null, staff: [],
    });
    expect(r.areasForImprovement.some(a => a.includes("quality needs improvement"))).toBe(true);
  });
});
