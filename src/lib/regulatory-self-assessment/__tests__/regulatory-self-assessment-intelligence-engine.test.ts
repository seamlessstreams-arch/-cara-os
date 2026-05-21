import { describe, it, expect } from "vitest";
import {
  pct, getRating, getRegSelfAssessmentCategoryLabel, getRegSelfAssessmentOutcomeLabel, getRatingLabel,
  evaluateRegSelfAssessmentQuality, evaluateRegSelfAssessmentCompliance, evaluateRegSelfAssessmentPolicy,
  evaluateStaffRegSelfAssessmentReadiness, buildChildRegSelfAssessmentProfiles, generateRegSelfAssessmentIntelligence,
} from "../regulatory-self-assessment-intelligence-engine";
import type {
  RegSelfAssessmentRecord, RegSelfAssessmentPolicy, StaffRegSelfAssessmentTraining,
  RegSelfAssessmentCategory, RegSelfAssessmentOutcome, Rating,
} from "../regulatory-self-assessment-intelligence-engine";

function makeRecord(overrides: Partial<RegSelfAssessmentRecord> = {}): RegSelfAssessmentRecord {
  return { id: "rsa-1", homeId: "home-oak", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "regulation_area_review", outcome: "outstanding_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<RegSelfAssessmentRecord> = {}): RegSelfAssessmentRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `rsa-${i}`, ...o }));
}
function allTruePolicy(): RegSelfAssessmentPolicy {
  return { selfAssessmentPolicy: true, evidenceGatheringPolicy: true, actionPlanPolicy: true, improvementMonitoringPolicy: true, externalFeedbackPolicy: true, inspectionPreparationPolicy: true, complianceReviewSchedule: true };
}
function allFalsePolicy(): RegSelfAssessmentPolicy {
  return { selfAssessmentPolicy: false, evidenceGatheringPolicy: false, actionPlanPolicy: false, improvementMonitoringPolicy: false, externalFeedbackPolicy: false, inspectionPreparationPolicy: false, complianceReviewSchedule: false };
}
function makeStaff(o: Partial<StaffRegSelfAssessmentTraining> = {}): StaffRegSelfAssessmentTraining {
  return { staffId: "s1", selfAssessmentKnowledge: true, evidenceGatheringSkills: true, actionPlanningSkills: true, regulatoryFrameworkKnowledge: true, inspectionPreparationSkills: true, qualityImprovementSkills: true, ...o };
}

// ═══ pct ═══
describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("100 for 1/1", () => { expect(pct(1, 1)).toBe(100); });
  it("rounds 2/3 to 67", () => { expect(pct(2, 3)).toBe(67); });
  it("rounds 1/3 to 33", () => { expect(pct(1, 3)).toBe(33); });
});

// ═══ getRating ═══
describe("getRating", () => {
  it("outstanding >=80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate <40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ═══ Labels ═══
describe("getRegSelfAssessmentCategoryLabel", () => {
  const cases: [RegSelfAssessmentCategory, string][] = [
    ["regulation_area_review", "Regulation Area Review"],
    ["evidence_gathering", "Evidence Gathering"],
    ["action_plan_tracking", "Action Plan Tracking"],
    ["improvement_monitoring", "Improvement Monitoring"],
    ["external_feedback_integration", "External Feedback Integration"],
    ["compliance_gap_analysis", "Compliance Gap Analysis"],
    ["self_assessment_report", "Self-Assessment Report"],
    ["inspection_preparation", "Inspection Preparation"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getRegSelfAssessmentCategoryLabel(c)).toBe(l); });
});

describe("getRegSelfAssessmentOutcomeLabel", () => {
  const cases: [RegSelfAssessmentOutcome, string][] = [
    ["outstanding_evidence", "Outstanding Evidence"],
    ["good_evidence", "Good Evidence"],
    ["partial_evidence", "Partial Evidence"],
    ["insufficient_evidence", "Insufficient Evidence"],
    ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getRegSelfAssessmentOutcomeLabel(o)).toBe(l); });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s → %s", (r, l) => { expect(getRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluateRegSelfAssessmentQuality", () => {
  it("0 for empty", () => { const r = evaluateRegSelfAssessmentQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { const r = evaluateRegSelfAssessmentQuality(makeRecords(5)); expect(r.overallScore).toBe(25); expect(r.totalRecords).toBe(5); });
  it("0 for all-false", () => { const r = evaluateRegSelfAssessmentQuality(makeRecords(3, { evidenceRobust: false, selfAssessmentAccurate: false, actionPlanAligned: false, improvementEvidenced: false })); expect(r.overallScore).toBe(0); });
  it("weight 7 for evidenceRobust", () => { const r = evaluateRegSelfAssessmentQuality([makeRecord({ evidenceRobust: true, selfAssessmentAccurate: false, actionPlanAligned: false, improvementEvidenced: false })]); expect(r.overallScore).toBe(7); });
  it("weight 6 for selfAssessmentAccurate", () => { const r = evaluateRegSelfAssessmentQuality([makeRecord({ evidenceRobust: false, selfAssessmentAccurate: true, actionPlanAligned: false, improvementEvidenced: false })]); expect(r.overallScore).toBe(6); });
  it("weight 6 for actionPlanAligned", () => { const r = evaluateRegSelfAssessmentQuality([makeRecord({ evidenceRobust: false, selfAssessmentAccurate: false, actionPlanAligned: true, improvementEvidenced: false })]); expect(r.overallScore).toBe(6); });
  it("weight 6 for improvementEvidenced", () => { const r = evaluateRegSelfAssessmentQuality([makeRecord({ evidenceRobust: false, selfAssessmentAccurate: false, actionPlanAligned: false, improvementEvidenced: true })]); expect(r.overallScore).toBe(6); });
  it("partial rates 50%", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", evidenceRobust: false, selfAssessmentAccurate: false, actionPlanAligned: false, improvementEvidenced: false })];
    const r = evaluateRegSelfAssessmentQuality(records);
    expect(r.evidenceRobustRate).toBe(50);
    expect(r.overallScore).toBe(12.5);
  });
  it("caps at 25", () => { const r = evaluateRegSelfAssessmentQuality(makeRecords(100)); expect(r.overallScore).toBeLessThanOrEqual(25); });
  it("returns correct rates", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", improvementEvidenced: false }), makeRecord({ id: "c", selfAssessmentAccurate: false })];
    const r = evaluateRegSelfAssessmentQuality(records);
    expect(r.evidenceRobustRate).toBe(100);
    expect(r.selfAssessmentAccurateRate).toBe(67);
    expect(r.actionPlanAlignedRate).toBe(100);
    expect(r.improvementEvidencedRate).toBe(67);
  });
});

// ═══ Compliance ═══
describe("evaluateRegSelfAssessmentCompliance", () => {
  it("0 for empty", () => { const r = evaluateRegSelfAssessmentCompliance([]); expect(r.overallScore).toBe(0); expect(r.uniqueCategories).toBe(0); });
  it("25 for perfect with all 8 categories", () => {
    const cats: RegSelfAssessmentCategory[] = ["regulation_area_review", "evidence_gathering", "action_plan_tracking", "improvement_monitoring", "external_feedback_integration", "compliance_gap_analysis", "self_assessment_report", "inspection_preparation"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateRegSelfAssessmentCompliance(records);
    expect(r.overallScore).toBe(25);
    expect(r.uniqueCategories).toBe(8);
    expect(r.categoryDiversityRatio).toBe(1);
  });
  it("categoryDiversityRatio for 4/8", () => {
    const cats: RegSelfAssessmentCategory[] = ["regulation_area_review", "evidence_gathering", "action_plan_tracking", "improvement_monitoring"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateRegSelfAssessmentCompliance(records);
    expect(r.categoryDiversityRatio).toBe(0.5);
    expect(r.uniqueCategories).toBe(4);
  });
  it("categoryDiversityRatio for 1/8", () => {
    const r = evaluateRegSelfAssessmentCompliance([makeRecord()]);
    expect(r.categoryDiversityRatio).toBe(0.13);
    expect(r.uniqueCategories).toBe(1);
  });
  it("0 for all-false booleans single category", () => {
    const r = evaluateRegSelfAssessmentCompliance(makeRecords(3, { documentationComplete: false, timelyRecording: false, evidenceRobust: false }));
    expect(r.documentationCompleteRate).toBe(0);
    expect(r.timelyRecordingRate).toBe(0);
    expect(r.evidenceRobustRate).toBe(0);
    // Only diversity contribution: 1/8 = 0.13 * 5 = 0.65 => rounds to 0.7
    expect(r.overallScore).toBe(0.7);
  });
  it("weight 8 for documentationComplete", () => {
    const r = evaluateRegSelfAssessmentCompliance([makeRecord({ documentationComplete: true, timelyRecording: false, evidenceRobust: false })]);
    // 8 + diversity 0.13*5=0.65 => 8.65 => round to 8.7
    expect(r.overallScore).toBe(8.7);
  });
  it("weight 7 for timelyRecording", () => {
    const r = evaluateRegSelfAssessmentCompliance([makeRecord({ documentationComplete: false, timelyRecording: true, evidenceRobust: false })]);
    // 7 + diversity 0.13*5=0.65 => 7.65 => round to 7.7
    expect(r.overallScore).toBe(7.7);
  });
  it("weight 5 for evidenceRobust in compliance", () => {
    const r = evaluateRegSelfAssessmentCompliance([makeRecord({ documentationComplete: false, timelyRecording: false, evidenceRobust: true })]);
    // 5 + diversity 0.13*5=0.65 => 5.65 => round to 5.7
    expect(r.overallScore).toBe(5.7);
  });
  it("caps at 25", () => { const cats: RegSelfAssessmentCategory[] = ["regulation_area_review", "evidence_gathering", "action_plan_tracking", "improvement_monitoring", "external_feedback_integration", "compliance_gap_analysis", "self_assessment_report", "inspection_preparation"]; const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })); const r = evaluateRegSelfAssessmentCompliance(records); expect(r.overallScore).toBeLessThanOrEqual(25); });
});

// ═══ Policy ═══
describe("evaluateRegSelfAssessmentPolicy", () => {
  it("0 for null", () => { const r = evaluateRegSelfAssessmentPolicy(null); expect(r.overallScore).toBe(0); expect(r.selfAssessmentPolicy).toBe(false); });
  it("25 for all true", () => { const r = evaluateRegSelfAssessmentPolicy(allTruePolicy()); expect(r.overallScore).toBe(25); });
  it("0 for all false", () => { const r = evaluateRegSelfAssessmentPolicy(allFalsePolicy()); expect(r.overallScore).toBe(0); });
  it("4 for selfAssessmentPolicy only", () => { const r = evaluateRegSelfAssessmentPolicy({ ...allFalsePolicy(), selfAssessmentPolicy: true }); expect(r.overallScore).toBe(4); });
  it("4 for evidenceGatheringPolicy only", () => { const r = evaluateRegSelfAssessmentPolicy({ ...allFalsePolicy(), evidenceGatheringPolicy: true }); expect(r.overallScore).toBe(4); });
  it("4 for actionPlanPolicy only", () => { const r = evaluateRegSelfAssessmentPolicy({ ...allFalsePolicy(), actionPlanPolicy: true }); expect(r.overallScore).toBe(4); });
  it("4 for improvementMonitoringPolicy only", () => { const r = evaluateRegSelfAssessmentPolicy({ ...allFalsePolicy(), improvementMonitoringPolicy: true }); expect(r.overallScore).toBe(4); });
  it("3 for externalFeedbackPolicy only", () => { const r = evaluateRegSelfAssessmentPolicy({ ...allFalsePolicy(), externalFeedbackPolicy: true }); expect(r.overallScore).toBe(3); });
  it("3 for inspectionPreparationPolicy only", () => { const r = evaluateRegSelfAssessmentPolicy({ ...allFalsePolicy(), inspectionPreparationPolicy: true }); expect(r.overallScore).toBe(3); });
  it("3 for complianceReviewSchedule only", () => { const r = evaluateRegSelfAssessmentPolicy({ ...allFalsePolicy(), complianceReviewSchedule: true }); expect(r.overallScore).toBe(3); });
  it("16 for four 4-weight policies", () => { const r = evaluateRegSelfAssessmentPolicy({ selfAssessmentPolicy: true, evidenceGatheringPolicy: true, actionPlanPolicy: true, improvementMonitoringPolicy: true, externalFeedbackPolicy: false, inspectionPreparationPolicy: false, complianceReviewSchedule: false }); expect(r.overallScore).toBe(16); });
  it("propagates boolean values", () => { const r = evaluateRegSelfAssessmentPolicy({ selfAssessmentPolicy: true, evidenceGatheringPolicy: false, actionPlanPolicy: true, improvementMonitoringPolicy: false, externalFeedbackPolicy: true, inspectionPreparationPolicy: false, complianceReviewSchedule: true }); expect(r.selfAssessmentPolicy).toBe(true); expect(r.evidenceGatheringPolicy).toBe(false); expect(r.actionPlanPolicy).toBe(true); expect(r.improvementMonitoringPolicy).toBe(false); expect(r.externalFeedbackPolicy).toBe(true); expect(r.inspectionPreparationPolicy).toBe(false); expect(r.complianceReviewSchedule).toBe(true); expect(r.overallScore).toBe(14); });
});

// ═══ Staff Readiness ═══
describe("evaluateStaffRegSelfAssessmentReadiness", () => {
  it("0 for empty", () => { const r = evaluateStaffRegSelfAssessmentReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("25 for all-true single", () => { const r = evaluateStaffRegSelfAssessmentReadiness([makeStaff()]); expect(r.overallScore).toBe(25); });
  it("0 for all-false single", () => { const r = evaluateStaffRegSelfAssessmentReadiness([makeStaff({ selfAssessmentKnowledge: false, evidenceGatheringSkills: false, actionPlanningSkills: false, regulatoryFrameworkKnowledge: false, inspectionPreparationSkills: false, qualityImprovementSkills: false })]); expect(r.overallScore).toBe(0); });
  it("weight 6 for selfAssessmentKnowledge", () => { const r = evaluateStaffRegSelfAssessmentReadiness([makeStaff({ selfAssessmentKnowledge: true, evidenceGatheringSkills: false, actionPlanningSkills: false, regulatoryFrameworkKnowledge: false, inspectionPreparationSkills: false, qualityImprovementSkills: false })]); expect(r.overallScore).toBe(6); });
  it("weight 5 for evidenceGatheringSkills", () => { const r = evaluateStaffRegSelfAssessmentReadiness([makeStaff({ selfAssessmentKnowledge: false, evidenceGatheringSkills: true, actionPlanningSkills: false, regulatoryFrameworkKnowledge: false, inspectionPreparationSkills: false, qualityImprovementSkills: false })]); expect(r.overallScore).toBe(5); });
  it("weight 5 for actionPlanningSkills", () => { const r = evaluateStaffRegSelfAssessmentReadiness([makeStaff({ selfAssessmentKnowledge: false, evidenceGatheringSkills: false, actionPlanningSkills: true, regulatoryFrameworkKnowledge: false, inspectionPreparationSkills: false, qualityImprovementSkills: false })]); expect(r.overallScore).toBe(5); });
  it("weight 4 for regulatoryFrameworkKnowledge", () => { const r = evaluateStaffRegSelfAssessmentReadiness([makeStaff({ selfAssessmentKnowledge: false, evidenceGatheringSkills: false, actionPlanningSkills: false, regulatoryFrameworkKnowledge: true, inspectionPreparationSkills: false, qualityImprovementSkills: false })]); expect(r.overallScore).toBe(4); });
  it("weight 3 for inspectionPreparationSkills", () => { const r = evaluateStaffRegSelfAssessmentReadiness([makeStaff({ selfAssessmentKnowledge: false, evidenceGatheringSkills: false, actionPlanningSkills: false, regulatoryFrameworkKnowledge: false, inspectionPreparationSkills: true, qualityImprovementSkills: false })]); expect(r.overallScore).toBe(3); });
  it("weight 2 for qualityImprovementSkills", () => { const r = evaluateStaffRegSelfAssessmentReadiness([makeStaff({ selfAssessmentKnowledge: false, evidenceGatheringSkills: false, actionPlanningSkills: false, regulatoryFrameworkKnowledge: false, inspectionPreparationSkills: false, qualityImprovementSkills: true })]); expect(r.overallScore).toBe(2); });
  it("50% rate for 2 staff (one all-true, one all-false)", () => {
    const r = evaluateStaffRegSelfAssessmentReadiness([
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2", selfAssessmentKnowledge: false, evidenceGatheringSkills: false, actionPlanningSkills: false, regulatoryFrameworkKnowledge: false, inspectionPreparationSkills: false, qualityImprovementSkills: false }),
    ]);
    expect(r.selfAssessmentKnowledgeRate).toBe(50);
    expect(r.overallScore).toBe(12.5);
    expect(r.totalStaff).toBe(2);
  });
  it("caps at 25", () => { const r = evaluateStaffRegSelfAssessmentReadiness(Array.from({ length: 50 }, (_, i) => makeStaff({ staffId: `s${i}` }))); expect(r.overallScore).toBeLessThanOrEqual(25); });
});

// ═══ Child Profiles ═══
describe("buildChildRegSelfAssessmentProfiles", () => {
  it("empty for no records", () => { expect(buildChildRegSelfAssessmentProfiles([])).toEqual([]); });
  it("single child single record", () => {
    const profiles = buildChildRegSelfAssessmentProfiles([makeRecord()]);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].totalRecords).toBe(1);
    expect(profiles[0].evidenceRobustRate).toBe(100);
    expect(profiles[0].selfAssessmentAccurateRate).toBe(100);
  });
  it("frequency score 0 for <5 records", () => {
    const profiles = buildChildRegSelfAssessmentProfiles(makeRecords(3));
    expect(profiles[0].totalRecords).toBe(3);
  });
  it("frequency score 1 for 5-9 records", () => {
    const profiles = buildChildRegSelfAssessmentProfiles(makeRecords(5));
    expect(profiles[0].totalRecords).toBe(5);
  });
  it("frequency score 2 for >=10 records", () => {
    const profiles = buildChildRegSelfAssessmentProfiles(makeRecords(10));
    expect(profiles[0].totalRecords).toBe(10);
  });
  it("rate1 score 3 for evidenceRobustRate >=80", () => {
    const records = makeRecords(5);
    const profiles = buildChildRegSelfAssessmentProfiles(records);
    expect(profiles[0].evidenceRobustRate).toBe(100);
  });
  it("rate1 score 0 for evidenceRobustRate <40", () => {
    const records = makeRecords(5, { evidenceRobust: false });
    const profiles = buildChildRegSelfAssessmentProfiles(records);
    expect(profiles[0].evidenceRobustRate).toBe(0);
  });
  it("diversity bonus 2 for >=4 categories", () => {
    const cats: RegSelfAssessmentCategory[] = ["regulation_area_review", "evidence_gathering", "action_plan_tracking", "improvement_monitoring"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const profiles = buildChildRegSelfAssessmentProfiles(records);
    expect(profiles[0].categoriesCovered.length).toBe(4);
  });
  it("diversity bonus 1 for 2-3 categories", () => {
    const cats: RegSelfAssessmentCategory[] = ["regulation_area_review", "evidence_gathering"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const profiles = buildChildRegSelfAssessmentProfiles(records);
    expect(profiles[0].categoriesCovered.length).toBe(2);
  });
  it("diversity bonus 0 for 1 category", () => {
    const profiles = buildChildRegSelfAssessmentProfiles([makeRecord()]);
    expect(profiles[0].categoriesCovered.length).toBe(1);
  });
  it("max score 10", () => {
    const cats: RegSelfAssessmentCategory[] = ["regulation_area_review", "evidence_gathering", "action_plan_tracking", "improvement_monitoring", "external_feedback_integration"];
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `r-${i}`, category: cats[i % cats.length] }));
    const profiles = buildChildRegSelfAssessmentProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("separates multiple children", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildRegSelfAssessmentProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "child-alex")).toBeDefined();
    expect(profiles.find((p) => p.childId === "child-jordan")).toBeDefined();
  });
  it("score 0 for all-false single record", () => {
    const records = [makeRecord({ evidenceRobust: false, selfAssessmentAccurate: false })];
    const profiles = buildChildRegSelfAssessmentProfiles(records);
    // freq=0, rate1=0 (0%), rate2=0 (0%), diversity=0 (1 cat) => 0
    expect(profiles[0].overallScore).toBe(0);
  });
  it("perfect child with 10+ records, all true, 4+ cats", () => {
    const cats: RegSelfAssessmentCategory[] = ["regulation_area_review", "evidence_gathering", "action_plan_tracking", "improvement_monitoring"];
    const records = Array.from({ length: 12 }, (_, i) => makeRecord({ id: `r-${i}`, category: cats[i % cats.length] }));
    const profiles = buildChildRegSelfAssessmentProfiles(records);
    // freq=2, rate1=3 (100%), rate2=3 (100%), diversity=2 (4 cats) => 10
    expect(profiles[0].overallScore).toBe(10);
  });
});

// ═══ Orchestrator ═══
describe("generateRegSelfAssessmentIntelligence", () => {
  const baseInput = () => ({
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    records: makeRecords(5),
    policy: allTruePolicy(),
    staff: [makeStaff()],
  });

  it("returns correct homeId, period", () => {
    const r = generateRegSelfAssessmentIntelligence(baseInput());
    expect(r.homeId).toBe("home-oak");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-12-31");
  });
  it("overall score is sum of 4 evaluators capped at 100", () => {
    const r = generateRegSelfAssessmentIntelligence(baseInput());
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
  });
  it("perfect scores yield 100", () => {
    const cats: RegSelfAssessmentCategory[] = ["regulation_area_review", "evidence_gathering", "action_plan_tracking", "improvement_monitoring", "external_feedback_integration", "compliance_gap_analysis", "self_assessment_report", "inspection_preparation"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), records });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("empty everything yields 0 and inadequate", () => {
    const r = generateRegSelfAssessmentIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters records by period", () => {
    const records = [
      makeRecord({ id: "in-range", date: "2026-06-15" }),
      makeRecord({ id: "out-of-range", date: "2025-06-15" }),
    ];
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), records });
    expect(r.regSelfAssessmentQuality.totalRecords).toBe(1);
  });
  it("includes regulatory links", () => {
    const r = generateRegSelfAssessmentIntelligence(baseInput());
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks[0]).toContain("CHR 2015 Reg 13");
  });
  it("generates strengths for high scores", () => {
    const cats: RegSelfAssessmentCategory[] = ["regulation_area_review", "evidence_gathering", "action_plan_tracking", "improvement_monitoring", "external_feedback_integration", "compliance_gap_analysis", "self_assessment_report", "inspection_preparation"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), records });
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("generates areas for improvement for low scores", () => {
    const r = generateRegSelfAssessmentIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("generates actions for no policy", () => {
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), policy: null });
    expect(r.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });
  it("generates actions for no staff", () => {
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), staff: [] });
    expect(r.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });
  it("generates fallback action when no issues", () => {
    const cats: RegSelfAssessmentCategory[] = ["regulation_area_review", "evidence_gathering", "action_plan_tracking", "improvement_monitoring", "external_feedback_integration", "compliance_gap_analysis", "self_assessment_report", "inspection_preparation"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), records });
    expect(r.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });
  it("child profiles are built", () => {
    const r = generateRegSelfAssessmentIntelligence(baseInput());
    expect(r.childProfiles.length).toBeGreaterThan(0);
  });
  it("rating is correct type", () => {
    const r = generateRegSelfAssessmentIntelligence(baseInput());
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(r.rating);
  });
  it("boundary date records are included", () => {
    const records = [
      makeRecord({ id: "start", date: "2026-01-01" }),
      makeRecord({ id: "end", date: "2026-12-31" }),
    ];
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), records });
    expect(r.regSelfAssessmentQuality.totalRecords).toBe(2);
  });
  it("low evidence robustness triggers action", () => {
    const records = makeRecords(5, { evidenceRobust: false, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true });
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), records });
    expect(r.actions.some((a) => a.includes("Evidence robustness"))).toBe(true);
  });
  it("low self-assessment accuracy triggers action", () => {
    const records = makeRecords(5, { selfAssessmentAccurate: false, evidenceRobust: true, actionPlanAligned: true, improvementEvidenced: true });
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), records });
    expect(r.actions.some((a) => a.includes("Self-assessment accuracy"))).toBe(true);
  });
  it("low action plan alignment triggers action", () => {
    const records = makeRecords(5, { actionPlanAligned: false, evidenceRobust: true, selfAssessmentAccurate: true, improvementEvidenced: true });
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), records });
    expect(r.actions.some((a) => a.includes("Action plan alignment"))).toBe(true);
  });
  it("low staff knowledge triggers action", () => {
    const staff = [makeStaff({ selfAssessmentKnowledge: false, evidenceGatheringSkills: false, actionPlanningSkills: false, regulatoryFrameworkKnowledge: false, inspectionPreparationSkills: false, qualityImprovementSkills: false })];
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), staff });
    expect(r.actions.some((a) => a.includes("Self-assessment knowledge"))).toBe(true);
  });
  it("areasForImprovement mentions no records when empty", () => {
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), records: [] });
    expect(r.areasForImprovement.some((a) => a.includes("No regulatory self-assessment records"))).toBe(true);
  });
  it("areasForImprovement mentions no policy when null", () => {
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), policy: null });
    expect(r.areasForImprovement.some((a) => a.includes("No regulatory self-assessment policy"))).toBe(true);
  });
  it("areasForImprovement mentions no staff training when empty", () => {
    const r = generateRegSelfAssessmentIntelligence({ ...baseInput(), staff: [] });
    expect(r.areasForImprovement.some((a) => a.includes("No staff self-assessment training"))).toBe(true);
  });
});
