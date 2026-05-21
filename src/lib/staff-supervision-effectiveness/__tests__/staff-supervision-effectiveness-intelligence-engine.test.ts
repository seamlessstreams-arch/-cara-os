import { describe, it, expect } from "vitest";
import {
  pct, getRating, getStaffSupervisionEffectivenessCategoryLabel, getStaffSupervisionEffectivenessOutcomeLabel, getRatingLabel,
  evaluateStaffSupervisionEffectivenessQuality, evaluateStaffSupervisionEffectivenessCompliance, evaluateStaffSupervisionEffectivenessPolicy,
  evaluateStaffSupervisionEffectivenessReadiness, buildStaffSupervisionProfiles, generateStaffSupervisionEffectivenessIntelligence,
} from "../staff-supervision-effectiveness-intelligence-engine";
import type {
  StaffSupervisionEffectivenessRecord, StaffSupervisionEffectivenessPolicy, StaffSupervisionEffectivenessTraining,
  StaffSupervisionEffectivenessCategory, StaffSupervisionEffectivenessOutcome, Rating,
} from "../staff-supervision-effectiveness-intelligence-engine";

function makeRecord(overrides: Partial<StaffSupervisionEffectivenessRecord> = {}): StaffSupervisionEffectivenessRecord {
  return { id: "sse-1", homeId: "home-oak", date: "2025-03-15", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "formal_supervision", outcome: "highly_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<StaffSupervisionEffectivenessRecord> = {}): StaffSupervisionEffectivenessRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `sse-${i}`, ...o }));
}
function allTruePolicy(): StaffSupervisionEffectivenessPolicy {
  return { supervisionFramework: true, frequencyStandards: true, safeguardingRequirement: true, reflectivePracticePolicy: true, supervisionRecordTemplate: true, escalationProcedure: true, newStarterSupervisionPolicy: true };
}
function allFalsePolicy(): StaffSupervisionEffectivenessPolicy {
  return { supervisionFramework: false, frequencyStandards: false, safeguardingRequirement: false, reflectivePracticePolicy: false, supervisionRecordTemplate: false, escalationProcedure: false, newStarterSupervisionPolicy: false };
}
function makeTraining(o: Partial<StaffSupervisionEffectivenessTraining> = {}): StaffSupervisionEffectivenessTraining {
  return { staffId: "s1", supervisionFacilitationSkills: true, reflectivePracticeKnowledge: true, safeguardingSupervisionSkills: true, performanceManagementSkills: true, mentoringCoachingSkills: true, documentationStandards: true, ...o };
}

// ═══ pct ═══
describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("100 for 1/1", () => { expect(pct(1, 1)).toBe(100); });
  it("rounds 2/3 to 67", () => { expect(pct(2, 3)).toBe(67); });
  it("rounds 1/3 to 33", () => { expect(pct(1, 3)).toBe(33); });
  it("0 for 0/0", () => { expect(pct(0, 0)).toBe(0); });
  it("0 for 0/10", () => { expect(pct(0, 10)).toBe(0); });
  it("50 for 1/2", () => { expect(pct(1, 2)).toBe(50); });
});

// ═══ getRating ═══
describe("getRating", () => {
  it("outstanding >=80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate <40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
  it("boundary 80 is outstanding", () => { expect(getRating(80)).toBe("outstanding"); });
  it("boundary 60 is good", () => { expect(getRating(60)).toBe("good"); });
  it("boundary 40 is requires_improvement", () => { expect(getRating(40)).toBe("requires_improvement"); });
});

// ═══ Labels ═══
describe("getStaffSupervisionEffectivenessCategoryLabel", () => {
  const cases: [StaffSupervisionEffectivenessCategory, string][] = [
    ["formal_supervision", "Formal Supervision"],
    ["reflective_practice", "Reflective Practice"],
    ["case_discussion", "Case Discussion"],
    ["safeguarding_supervision", "Safeguarding Supervision"],
    ["clinical_supervision", "Clinical Supervision"],
    ["performance_review", "Performance Review"],
    ["peer_supervision", "Peer Supervision"],
    ["management_oversight", "Management Oversight"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getStaffSupervisionEffectivenessCategoryLabel(c)).toBe(l); });
});

describe("getStaffSupervisionEffectivenessOutcomeLabel", () => {
  const cases: [StaffSupervisionEffectivenessOutcome, string][] = [
    ["highly_effective", "Highly Effective"],
    ["effective", "Effective"],
    ["partially_effective", "Partially Effective"],
    ["ineffective", "Ineffective"],
    ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getStaffSupervisionEffectivenessOutcomeLabel(o)).toBe(l); });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s → %s", (r, l) => { expect(getRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluateStaffSupervisionEffectivenessQuality", () => {
  it("0 for empty", () => { const r = evaluateStaffSupervisionEffectivenessQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { expect(evaluateStaffSupervisionEffectivenessQuality(makeRecords(5)).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffSupervisionEffectivenessQuality(makeRecords(3, { safeguardingDiscussed: false, wellbeingChecked: false, actionPointsSet: false, previousActionsReviewed: false })).overallScore).toBe(0); });
  it("weight 7 for safeguardingDiscussed", () => { expect(evaluateStaffSupervisionEffectivenessQuality([makeRecord({ safeguardingDiscussed: true, wellbeingChecked: false, actionPointsSet: false, previousActionsReviewed: false })]).overallScore).toBe(7); });
  it("weight 6 for wellbeingChecked", () => { expect(evaluateStaffSupervisionEffectivenessQuality([makeRecord({ safeguardingDiscussed: false, wellbeingChecked: true, actionPointsSet: false, previousActionsReviewed: false })]).overallScore).toBe(6); });
  it("weight 6 for actionPointsSet", () => { expect(evaluateStaffSupervisionEffectivenessQuality([makeRecord({ safeguardingDiscussed: false, wellbeingChecked: false, actionPointsSet: true, previousActionsReviewed: false })]).overallScore).toBe(6); });
  it("weight 6 for previousActionsReviewed", () => { expect(evaluateStaffSupervisionEffectivenessQuality([makeRecord({ safeguardingDiscussed: false, wellbeingChecked: false, actionPointsSet: false, previousActionsReviewed: true })]).overallScore).toBe(6); });
  it("50% partial = 12.5", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", safeguardingDiscussed: false, wellbeingChecked: false, actionPointsSet: false, previousActionsReviewed: false })];
    expect(evaluateStaffSupervisionEffectivenessQuality(records).overallScore).toBe(12.5);
  });
  it("caps at 25", () => { expect(evaluateStaffSupervisionEffectivenessQuality(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
  it("returns correct rates", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", safeguardingDiscussed: false })];
    const r = evaluateStaffSupervisionEffectivenessQuality(records);
    expect(r.safeguardingDiscussedRate).toBe(50);
    expect(r.wellbeingCheckedRate).toBe(100);
  });
  it("totalRecords matches input length", () => {
    expect(evaluateStaffSupervisionEffectivenessQuality(makeRecords(7)).totalRecords).toBe(7);
  });
  it("weights sum to 25", () => {
    expect(evaluateStaffSupervisionEffectivenessQuality([makeRecord()]).overallScore).toBe(7 + 6 + 6 + 6);
  });
  it("empty returns all zeros", () => {
    const r = evaluateStaffSupervisionEffectivenessQuality([]);
    expect(r.safeguardingDiscussedRate).toBe(0);
    expect(r.wellbeingCheckedRate).toBe(0);
    expect(r.actionPointsSetRate).toBe(0);
    expect(r.previousActionsReviewedRate).toBe(0);
  });
  it("single record all false returns 0", () => {
    const r = evaluateStaffSupervisionEffectivenessQuality([makeRecord({ safeguardingDiscussed: false, wellbeingChecked: false, actionPointsSet: false, previousActionsReviewed: false })]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(1);
  });
});

// ═══ Compliance ═══
describe("evaluateStaffSupervisionEffectivenessCompliance", () => {
  it("0 for empty", () => { expect(evaluateStaffSupervisionEffectivenessCompliance([]).overallScore).toBe(0); });
  it("25 for perfect with 8 categories", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice", "case_discussion", "safeguarding_supervision", "clinical_supervision", "performance_review", "peer_supervision", "management_oversight"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    expect(evaluateStaffSupervisionEffectivenessCompliance(records).overallScore).toBe(25);
  });
  it("4/8 = 0.5 ratio", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice", "case_discussion", "safeguarding_supervision"];
    const r = evaluateStaffSupervisionEffectivenessCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })));
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
  it("single category = 0.13", () => { expect(evaluateStaffSupervisionEffectivenessCompliance(makeRecords(5)).categoryDiversityRatio).toBe(0.13); });
  it("caps at 25", () => { expect(evaluateStaffSupervisionEffectivenessCompliance(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
  it("0 for all false docs", () => {
    const r = evaluateStaffSupervisionEffectivenessCompliance(makeRecords(3, { documentationComplete: false, timelyRecording: false, safeguardingDiscussed: false }));
    expect(r.documentationCompleteRate).toBe(0);
    expect(r.timelyRecordingRate).toBe(0);
    expect(r.safeguardingDiscussedRate).toBe(0);
  });
  it("documentation weight 8", () => {
    const r = evaluateStaffSupervisionEffectivenessCompliance([makeRecord({ documentationComplete: true, timelyRecording: false, safeguardingDiscussed: false })]);
    // 8 + 0 + 0 + 0.13*5 = 8.65 -> round to 8.7
    expect(r.overallScore).toBe(8.7);
  });
  it("timely recording weight 7", () => {
    const r = evaluateStaffSupervisionEffectivenessCompliance([makeRecord({ documentationComplete: false, timelyRecording: true, safeguardingDiscussed: false })]);
    // 0 + 7 + 0 + 0.13*5 = 7.65 -> round to 7.7
    expect(r.overallScore).toBe(7.7);
  });
  it("safeguardingDiscussed reuse weight 5", () => {
    const r = evaluateStaffSupervisionEffectivenessCompliance([makeRecord({ documentationComplete: false, timelyRecording: false, safeguardingDiscussed: true })]);
    // 0 + 0 + 5 + 0.13*5 = 5.65 -> round to 5.7
    expect(r.overallScore).toBe(5.7);
  });
  it("2/8 categories = 0.25 ratio", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice"];
    const r = evaluateStaffSupervisionEffectivenessCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })));
    expect(r.categoryDiversityRatio).toBe(0.25);
  });
  it("8/8 categories = 1 ratio", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice", "case_discussion", "safeguarding_supervision", "clinical_supervision", "performance_review", "peer_supervision", "management_oversight"];
    const r = evaluateStaffSupervisionEffectivenessCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })));
    expect(r.categoryDiversityRatio).toBe(1);
  });
  it("empty returns all zeros", () => {
    const r = evaluateStaffSupervisionEffectivenessCompliance([]);
    expect(r.totalRecords).toBe(0);
    expect(r.documentationCompleteRate).toBe(0);
    expect(r.timelyRecordingRate).toBe(0);
    expect(r.safeguardingDiscussedRate).toBe(0);
    expect(r.categoryDiversityRatio).toBe(0);
    expect(r.uniqueCategories).toBe(0);
  });
  it("3/8 categories = 0.38 ratio", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice", "case_discussion"];
    const r = evaluateStaffSupervisionEffectivenessCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })));
    expect(r.categoryDiversityRatio).toBe(0.38);
  });
  it("uniqueCategories counts distinct categories", () => {
    const records = [makeRecord({ id: "a", category: "formal_supervision" }), makeRecord({ id: "b", category: "formal_supervision" }), makeRecord({ id: "c", category: "peer_supervision" })];
    expect(evaluateStaffSupervisionEffectivenessCompliance(records).uniqueCategories).toBe(2);
  });
});

// ═══ Policy ═══
describe("evaluateStaffSupervisionEffectivenessPolicy", () => {
  it("0 for null", () => { expect(evaluateStaffSupervisionEffectivenessPolicy(null).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffSupervisionEffectivenessPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffSupervisionEffectivenessPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("supervisionFramework = 4", () => { expect(evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), supervisionFramework: true }).overallScore).toBe(4); });
  it("frequencyStandards = 4", () => { expect(evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), frequencyStandards: true }).overallScore).toBe(4); });
  it("safeguardingRequirement = 4", () => { expect(evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), safeguardingRequirement: true }).overallScore).toBe(4); });
  it("reflectivePracticePolicy = 4", () => { expect(evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), reflectivePracticePolicy: true }).overallScore).toBe(4); });
  it("supervisionRecordTemplate = 3", () => { expect(evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), supervisionRecordTemplate: true }).overallScore).toBe(3); });
  it("escalationProcedure = 3", () => { expect(evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), escalationProcedure: true }).overallScore).toBe(3); });
  it("newStarterSupervisionPolicy = 3", () => { expect(evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), newStarterSupervisionPolicy: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluateStaffSupervisionEffectivenessPolicy(allTruePolicy()).overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3); });
  it("null returns all false booleans", () => {
    const r = evaluateStaffSupervisionEffectivenessPolicy(null);
    expect(r.supervisionFramework).toBe(false);
    expect(r.frequencyStandards).toBe(false);
    expect(r.safeguardingRequirement).toBe(false);
    expect(r.reflectivePracticePolicy).toBe(false);
    expect(r.supervisionRecordTemplate).toBe(false);
    expect(r.escalationProcedure).toBe(false);
    expect(r.newStarterSupervisionPolicy).toBe(false);
  });
  it("passes through boolean values", () => {
    const p = { ...allFalsePolicy(), supervisionFramework: true, safeguardingRequirement: true };
    const r = evaluateStaffSupervisionEffectivenessPolicy(p);
    expect(r.supervisionFramework).toBe(true);
    expect(r.safeguardingRequirement).toBe(true);
    expect(r.frequencyStandards).toBe(false);
  });
  it("partial policy = 4+4+3 = 11", () => {
    const r = evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), supervisionFramework: true, safeguardingRequirement: true, escalationProcedure: true });
    expect(r.overallScore).toBe(11);
  });
  it("two weight-3 fields = 6", () => {
    const r = evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), supervisionRecordTemplate: true, newStarterSupervisionPolicy: true });
    expect(r.overallScore).toBe(6);
  });
  it("all weight-4 fields only = 16", () => {
    const r = evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), supervisionFramework: true, frequencyStandards: true, safeguardingRequirement: true, reflectivePracticePolicy: true });
    expect(r.overallScore).toBe(16);
  });
  it("all weight-3 fields only = 9", () => {
    const r = evaluateStaffSupervisionEffectivenessPolicy({ ...allFalsePolicy(), supervisionRecordTemplate: true, escalationProcedure: true, newStarterSupervisionPolicy: true });
    expect(r.overallScore).toBe(9);
  });
});

// ═══ Supervisor Readiness ═══
describe("evaluateStaffSupervisionEffectivenessReadiness", () => {
  it("0 for empty", () => { expect(evaluateStaffSupervisionEffectivenessReadiness([]).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffSupervisionEffectivenessReadiness([makeTraining()]).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffSupervisionEffectivenessReadiness([makeTraining({ supervisionFacilitationSkills: false, reflectivePracticeKnowledge: false, safeguardingSupervisionSkills: false, performanceManagementSkills: false, mentoringCoachingSkills: false, documentationStandards: false })]).overallScore).toBe(0); });
  it("supervisionFacilitationSkills = 6", () => { expect(evaluateStaffSupervisionEffectivenessReadiness([makeTraining({ supervisionFacilitationSkills: true, reflectivePracticeKnowledge: false, safeguardingSupervisionSkills: false, performanceManagementSkills: false, mentoringCoachingSkills: false, documentationStandards: false })]).overallScore).toBe(6); });
  it("reflectivePracticeKnowledge = 5", () => { expect(evaluateStaffSupervisionEffectivenessReadiness([makeTraining({ supervisionFacilitationSkills: false, reflectivePracticeKnowledge: true, safeguardingSupervisionSkills: false, performanceManagementSkills: false, mentoringCoachingSkills: false, documentationStandards: false })]).overallScore).toBe(5); });
  it("safeguardingSupervisionSkills = 5", () => { expect(evaluateStaffSupervisionEffectivenessReadiness([makeTraining({ supervisionFacilitationSkills: false, reflectivePracticeKnowledge: false, safeguardingSupervisionSkills: true, performanceManagementSkills: false, mentoringCoachingSkills: false, documentationStandards: false })]).overallScore).toBe(5); });
  it("performanceManagementSkills = 4", () => { expect(evaluateStaffSupervisionEffectivenessReadiness([makeTraining({ supervisionFacilitationSkills: false, reflectivePracticeKnowledge: false, safeguardingSupervisionSkills: false, performanceManagementSkills: true, mentoringCoachingSkills: false, documentationStandards: false })]).overallScore).toBe(4); });
  it("mentoringCoachingSkills = 3", () => { expect(evaluateStaffSupervisionEffectivenessReadiness([makeTraining({ supervisionFacilitationSkills: false, reflectivePracticeKnowledge: false, safeguardingSupervisionSkills: false, performanceManagementSkills: false, mentoringCoachingSkills: true, documentationStandards: false })]).overallScore).toBe(3); });
  it("documentationStandards = 2", () => { expect(evaluateStaffSupervisionEffectivenessReadiness([makeTraining({ supervisionFacilitationSkills: false, reflectivePracticeKnowledge: false, safeguardingSupervisionSkills: false, performanceManagementSkills: false, mentoringCoachingSkills: false, documentationStandards: true })]).overallScore).toBe(2); });
  it("weights sum to 25", () => { expect(evaluateStaffSupervisionEffectivenessReadiness([makeTraining()]).overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2); });
  it("mixed supervisors", () => {
    const t = [makeTraining({ staffId: "s1" }), makeTraining({ staffId: "s2", supervisionFacilitationSkills: false, documentationStandards: false })];
    expect(evaluateStaffSupervisionEffectivenessReadiness(t).overallScore).toBe(21);
  });
  it("empty array returns all zeros", () => {
    const r = evaluateStaffSupervisionEffectivenessReadiness([]);
    expect(r.totalSupervisors).toBe(0);
    expect(r.supervisionFacilitationSkillsRate).toBe(0);
    expect(r.reflectivePracticeKnowledgeRate).toBe(0);
    expect(r.safeguardingSupervisionSkillsRate).toBe(0);
    expect(r.performanceManagementSkillsRate).toBe(0);
    expect(r.mentoringCoachingSkillsRate).toBe(0);
    expect(r.documentationStandardsRate).toBe(0);
  });
  it("totalSupervisors reflects count", () => {
    expect(evaluateStaffSupervisionEffectivenessReadiness([makeTraining({ staffId: "s1" }), makeTraining({ staffId: "s2" }), makeTraining({ staffId: "s3" })]).totalSupervisors).toBe(3);
  });
  it("rates reflect proportions", () => {
    const t = [
      makeTraining({ staffId: "s1", supervisionFacilitationSkills: true }),
      makeTraining({ staffId: "s2", supervisionFacilitationSkills: false }),
      makeTraining({ staffId: "s3", supervisionFacilitationSkills: true }),
    ];
    expect(evaluateStaffSupervisionEffectivenessReadiness(t).supervisionFacilitationSkillsRate).toBe(67);
  });
  it("half supervisors trained = 50% rates", () => {
    const t = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2", supervisionFacilitationSkills: false, reflectivePracticeKnowledge: false, safeguardingSupervisionSkills: false, performanceManagementSkills: false, mentoringCoachingSkills: false, documentationStandards: false }),
    ];
    const r = evaluateStaffSupervisionEffectivenessReadiness(t);
    expect(r.supervisionFacilitationSkillsRate).toBe(50);
    expect(r.reflectivePracticeKnowledgeRate).toBe(50);
  });
});

// ═══ Staff Profiles ═══
describe("buildStaffSupervisionProfiles", () => {
  it("empty for no records", () => { expect(buildStaffSupervisionProfiles([])).toEqual([]); });
  it("groups by staffId", () => {
    const profiles = buildStaffSupervisionProfiles([makeRecord({ id: "a", staffId: "s1" }), makeRecord({ id: "b", staffId: "s2" }), makeRecord({ id: "c", staffId: "s1" })]);
    expect(profiles).toHaveLength(2);
  });
  it("freq=0 for <5", () => {
    const profiles = buildStaffSupervisionProfiles(makeRecords(4, { staffId: "s1" }));
    expect(profiles[0].overallScore).toBe(6);
  });
  it("freq=1 for 5-9", () => {
    const profiles = buildStaffSupervisionProfiles(makeRecords(5, { staffId: "s1" }));
    expect(profiles[0].overallScore).toBe(7);
  });
  it("freq=2 for >=10", () => {
    const profiles = buildStaffSupervisionProfiles(makeRecords(10, { staffId: "s1" }));
    expect(profiles[0].overallScore).toBe(8);
  });
  it("diversity 2 for >=4 cats", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice", "case_discussion", "safeguarding_supervision"];
    expect(buildStaffSupervisionProfiles(cats.map((c, i) => makeRecord({ id: `r-${i}`, staffId: "s1", category: c })))[0].overallScore).toBe(8);
  });
  it("diversity 1 for 2-3 cats", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice"];
    expect(buildStaffSupervisionProfiles(cats.map((c, i) => makeRecord({ id: `r-${i}`, staffId: "s1", category: c })))[0].overallScore).toBe(7);
  });
  it("diversity 0 for 1 cat", () => {
    expect(buildStaffSupervisionProfiles([makeRecord({ staffId: "s1" })])[0].categoriesCovered).toHaveLength(1);
  });
  it("caps at 10", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice", "case_discussion", "safeguarding_supervision", "clinical_supervision", "performance_review", "peer_supervision", "management_oversight"];
    expect(buildStaffSupervisionProfiles(cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, staffId: "s1", category: c }))))[0].overallScore).toBe(10);
  });
  it("rate1 thresholds: 0 for <40", () => {
    const records = makeRecords(5, { staffId: "s1", safeguardingDiscussed: false });
    records[0].safeguardingDiscussed = true; // 1/5 = 20%
    const profiles = buildStaffSupervisionProfiles(records);
    // freq=1, rate1=0 (20%), rate2=3 (100%), div=0
    expect(profiles[0].overallScore).toBe(4);
  });
  it("rate1 thresholds: 1 for 40-59", () => {
    const records = makeRecords(5, { staffId: "s1", safeguardingDiscussed: false });
    records[0].safeguardingDiscussed = true;
    records[1].safeguardingDiscussed = true; // 2/5 = 40%
    const profiles = buildStaffSupervisionProfiles(records);
    // freq=1, rate1=1 (40%), rate2=3 (100%), div=0
    expect(profiles[0].overallScore).toBe(5);
  });
  it("rate1 thresholds: 2 for 60-79", () => {
    const records = makeRecords(5, { staffId: "s1", safeguardingDiscussed: false });
    records[0].safeguardingDiscussed = true;
    records[1].safeguardingDiscussed = true;
    records[2].safeguardingDiscussed = true; // 3/5 = 60%
    const profiles = buildStaffSupervisionProfiles(records);
    // freq=1, rate1=2 (60%), rate2=3 (100%), div=0
    expect(profiles[0].overallScore).toBe(6);
  });
  it("rate2 thresholds: 0 for <40", () => {
    const records = makeRecords(5, { staffId: "s1", wellbeingChecked: false });
    records[0].wellbeingChecked = true; // 1/5 = 20%
    const profiles = buildStaffSupervisionProfiles(records);
    // freq=1, rate1=3 (100%), rate2=0 (20%), div=0
    expect(profiles[0].overallScore).toBe(4);
  });
  it("rate2 thresholds: 1 for 40-59", () => {
    const records = makeRecords(5, { staffId: "s1", wellbeingChecked: false });
    records[0].wellbeingChecked = true;
    records[1].wellbeingChecked = true; // 2/5 = 40%
    const profiles = buildStaffSupervisionProfiles(records);
    // freq=1, rate1=3 (100%), rate2=1 (40%), div=0
    expect(profiles[0].overallScore).toBe(5);
  });
  it("preserves staff name", () => {
    const profiles = buildStaffSupervisionProfiles([makeRecord({ staffId: "s1", staffName: "Sarah Johnson" })]);
    expect(profiles[0].staffName).toBe("Sarah Johnson");
  });
  it("categoriesCovered lists unique categories", () => {
    const records = [
      makeRecord({ id: "a", staffId: "s1", category: "formal_supervision" }),
      makeRecord({ id: "b", staffId: "s1", category: "case_discussion" }),
      makeRecord({ id: "c", staffId: "s1", category: "formal_supervision" }),
    ];
    const profiles = buildStaffSupervisionProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });
  it("rate2 thresholds: 2 for 60-79", () => {
    const records = makeRecords(5, { staffId: "s1", wellbeingChecked: false });
    records[0].wellbeingChecked = true;
    records[1].wellbeingChecked = true;
    records[2].wellbeingChecked = true; // 3/5 = 60%
    const profiles = buildStaffSupervisionProfiles(records);
    // freq=1, rate1=3 (100%), rate2=2 (60%), div=0
    expect(profiles[0].overallScore).toBe(6);
  });
  it("rate1 thresholds: 3 for >=80", () => {
    const records = makeRecords(5, { staffId: "s1" }); // all safeguardingDiscussed = true = 100%
    const profiles = buildStaffSupervisionProfiles(records);
    // freq=1, rate1=3 (100%), rate2=3 (100%), div=0
    expect(profiles[0].overallScore).toBe(7);
  });
  it("rate2 thresholds: 3 for >=80", () => {
    const records = makeRecords(5, { staffId: "s1" }); // all wellbeingChecked = true = 100%
    const profiles = buildStaffSupervisionProfiles(records);
    expect(profiles[0].overallScore).toBe(7);
  });
  it("safeguardingDiscussedRate calculated correctly", () => {
    const records = [
      makeRecord({ id: "a", staffId: "s1", safeguardingDiscussed: true }),
      makeRecord({ id: "b", staffId: "s1", safeguardingDiscussed: false }),
    ];
    const profiles = buildStaffSupervisionProfiles(records);
    expect(profiles[0].safeguardingDiscussedRate).toBe(50);
  });
  it("wellbeingCheckedRate calculated correctly", () => {
    const records = [
      makeRecord({ id: "a", staffId: "s1", wellbeingChecked: true }),
      makeRecord({ id: "b", staffId: "s1", wellbeingChecked: false }),
      makeRecord({ id: "c", staffId: "s1", wellbeingChecked: true }),
    ];
    const profiles = buildStaffSupervisionProfiles(records);
    expect(profiles[0].wellbeingCheckedRate).toBe(67);
  });
  it("multiple staff grouped separately", () => {
    const records = [
      makeRecord({ id: "a", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "b", staffId: "s2", staffName: "Tom" }),
      makeRecord({ id: "c", staffId: "s1", staffName: "Sarah" }),
      makeRecord({ id: "d", staffId: "s2", staffName: "Tom" }),
      makeRecord({ id: "e", staffId: "s2", staffName: "Tom" }),
    ];
    const profiles = buildStaffSupervisionProfiles(records);
    const sarahProfile = profiles.find(p => p.staffId === "s1");
    const tomProfile = profiles.find(p => p.staffId === "s2");
    expect(sarahProfile!.totalRecords).toBe(2);
    expect(tomProfile!.totalRecords).toBe(3);
  });
});

// ═══ Orchestrator ═══
describe("generateStaffSupervisionEffectivenessIntelligence", () => {
  it("outstanding for perfect data", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice", "case_discussion", "safeguarding_supervision", "clinical_supervision", "performance_review", "peer_supervision", "management_oversight"];
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), training: [makeTraining()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, training: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [makeRecord({ date: "2025-06-15" }), makeRecord({ id: "out", date: "2024-01-01" })], policy: allTruePolicy(), training: [makeTraining()] });
    expect(r.staffSupervisionEffectivenessQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [makeRecord()], policy: allTruePolicy(), training: [makeTraining()] });
    expect(r.staffSupervisionEffectivenessQuality).toBeDefined();
    expect(r.staffSupervisionEffectivenessCompliance).toBeDefined();
    expect(r.staffSupervisionEffectivenessPolicy).toBeDefined();
    expect(r.supervisorReadiness).toBeDefined();
  });
  it("includes regulatory links", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, training: [] });
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 33"))).toBe(true);
  });
  it("actions when policy null", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, training: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
  it("homeId passes through", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-maple", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, training: [] });
    expect(r.homeId).toBe("home-maple");
  });
  it("periodStart and periodEnd pass through", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-06-30", records: [], policy: null, training: [] });
    expect(r.periodStart).toBe("2025-01-01");
    expect(r.periodEnd).toBe("2025-06-30");
  });
  it("strengths populated for high scores", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice", "case_discussion", "safeguarding_supervision", "clinical_supervision", "performance_review", "peer_supervision", "management_oversight"];
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), training: [makeTraining()] });
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("areasForImprovement populated for low scores", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, training: [] });
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("staffProfiles populated from period records", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: [makeRecord({ staffId: "s1", staffName: "Sarah" }), makeRecord({ id: "sse-2", staffId: "s2", staffName: "Tom" })],
      policy: allTruePolicy(), training: [makeTraining()],
    });
    expect(r.staffProfiles).toHaveLength(2);
  });
  it("overall score is sum of 4 evaluators capped at 100", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: [makeRecord()], policy: allTruePolicy(), training: [makeTraining()],
    });
    const expected = r.staffSupervisionEffectivenessQuality.overallScore + r.staffSupervisionEffectivenessCompliance.overallScore + r.staffSupervisionEffectivenessPolicy.overallScore + r.supervisorReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(100, Math.round(expected)));
  });
  it("regulatory links contain all 7 entries", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, training: [] });
    expect(r.regulatoryLinks).toHaveLength(7);
    expect(r.regulatoryLinks.some(l => l.includes("KCSIE 2024"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("NMS 19"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("Quality Standards 2015"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 32"))).toBe(true);
  });
  it("no actions message for well-operating system", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice", "case_discussion", "safeguarding_supervision", "clinical_supervision", "performance_review", "peer_supervision", "management_oversight"];
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), training: [makeTraining()] });
    expect(r.actions.some(a => a.includes("No immediate actions"))).toBe(true);
  });
  it("records outside period are excluded", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({
      homeId: "home-oak", periodStart: "2025-03-01", periodEnd: "2025-03-31",
      records: [
        makeRecord({ id: "a", date: "2025-03-15" }),
        makeRecord({ id: "b", date: "2025-02-01" }),
        makeRecord({ id: "c", date: "2025-04-01" }),
      ],
      policy: allTruePolicy(), training: [makeTraining()],
    });
    expect(r.staffSupervisionEffectivenessQuality.totalRecords).toBe(1);
  });
  it("good rating for 60-79 score", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: [makeRecord()],
      policy: allTruePolicy(), training: [makeTraining()],
    });
    expect(r.overallScore).toBeGreaterThanOrEqual(60);
  });
  it("empty records produce areasForImprovement about missing records", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: allTruePolicy(), training: [makeTraining()] });
    expect(r.areasForImprovement.some(a => a.includes("No supervision records"))).toBe(true);
  });
  it("null policy produces areasForImprovement", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, training: [makeTraining()] });
    expect(r.areasForImprovement.some(a => a.includes("No supervision policy"))).toBe(true);
  });
  it("empty training produces areasForImprovement", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: allTruePolicy(), training: [] });
    expect(r.areasForImprovement.some(a => a.includes("No supervisor training"))).toBe(true);
  });
  it("URGENT actions for missing training", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [makeRecord()], policy: allTruePolicy(), training: [] });
    expect(r.actions.some(a => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });
  it("staffProfiles empty when no records in period", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [makeRecord({ date: "2024-01-01" })], policy: allTruePolicy(), training: [makeTraining()] });
    expect(r.staffProfiles).toHaveLength(0);
  });
  it("low safeguarding rate triggers action", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: makeRecords(5, { safeguardingDiscussed: false }),
      policy: allTruePolicy(), training: [makeTraining()],
    });
    expect(r.actions.some(a => a.includes("safeguarding") || a.includes("Safeguarding"))).toBe(true);
  });
  it("low wellbeing rate triggers action", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: makeRecords(5, { wellbeingChecked: false }),
      policy: allTruePolicy(), training: [makeTraining()],
    });
    expect(r.actions.some(a => a.includes("Wellbeing") || a.includes("wellbeing"))).toBe(true);
  });
  it("low documentation rate triggers action", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: makeRecords(5, { documentationComplete: false }),
      policy: allTruePolicy(), training: [makeTraining()],
    });
    expect(r.actions.some(a => a.includes("Documentation") || a.includes("documentation"))).toBe(true);
  });
  it("strength for high safeguarding rate", () => {
    const cats: StaffSupervisionEffectivenessCategory[] = ["formal_supervision", "reflective_practice", "case_discussion", "safeguarding_supervision", "clinical_supervision", "performance_review", "peer_supervision", "management_oversight"];
    const r = generateStaffSupervisionEffectivenessIntelligence({
      homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
      records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })),
      policy: allTruePolicy(), training: [makeTraining()],
    });
    expect(r.strengths.some(s => s.includes("Safeguarding") || s.includes("safeguarding"))).toBe(true);
  });
  it("overall rating derives from overall score", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence({ homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31", records: [], policy: null, training: [] });
    expect(r.rating).toBe(getRating(r.overallScore));
  });
});
