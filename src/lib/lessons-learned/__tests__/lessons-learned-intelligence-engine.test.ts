import { describe, it, expect } from "vitest";
import {
  pct, getRating, getLessonsLearnedCategoryLabel, getLessonsLearnedOutcomeLabel, getRatingLabel,
  evaluateLessonsLearnedQuality, evaluateLessonsLearnedCompliance, evaluateLessonsLearnedPolicy,
  evaluateStaffLessonsLearnedReadiness, buildChildLessonsLearnedProfiles, generateLessonsLearnedIntelligence,
} from "../lessons-learned-intelligence-engine";
import type {
  LessonsLearnedRecord, LessonsLearnedPolicy, StaffLessonsLearnedTraining,
  LessonsLearnedCategory, LessonsLearnedOutcome, Rating,
} from "../lessons-learned-intelligence-engine";

function makeRecord(overrides: Partial<LessonsLearnedRecord> = {}): LessonsLearnedRecord {
  return { id: "ll-1", homeId: "home-oak", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "incident_debrief", outcome: "fully_embedded", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<LessonsLearnedRecord> = {}): LessonsLearnedRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `ll-${i}`, ...o }));
}
function allTruePolicy(): LessonsLearnedPolicy {
  return { lessonsLearnedPolicy: true, postIncidentReviewPolicy: true, complaintLearningPolicy: true, practiceImprovementFramework: true, knowledgeSharingPolicy: true, externalLearningIntegration: true, auditAndReviewSchedule: true };
}
function allFalsePolicy(): LessonsLearnedPolicy {
  return { lessonsLearnedPolicy: false, postIncidentReviewPolicy: false, complaintLearningPolicy: false, practiceImprovementFramework: false, knowledgeSharingPolicy: false, externalLearningIntegration: false, auditAndReviewSchedule: false };
}
function makeStaff(o: Partial<StaffLessonsLearnedTraining> = {}): StaffLessonsLearnedTraining {
  return { staffId: "s1", reflectivePracticeSkills: true, rootCauseAnalysisKnowledge: true, documentationSkills: true, improvementPlanningSkills: true, debriefFacilitationSkills: true, knowledgeSharingAbility: true, ...o };
}

// ═══ pct ═══
describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("100 for 1/1", () => { expect(pct(1, 1)).toBe(100); });
  it("rounds 2/3 to 67", () => { expect(pct(2, 3)).toBe(67); });
  it("rounds 1/3 to 33", () => { expect(pct(1, 3)).toBe(33); });
  it("0 for 0/0", () => { expect(pct(0, 0)).toBe(0); });
  it("0 for 0/5", () => { expect(pct(0, 5)).toBe(0); });
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
describe("getLessonsLearnedCategoryLabel", () => {
  const cases: [LessonsLearnedCategory, string][] = [
    ["incident_debrief", "Incident Debrief"], ["complaint_learning", "Complaint Learning"],
    ["safeguarding_review", "Safeguarding Review"], ["practice_improvement", "Practice Improvement"],
    ["policy_update", "Policy Update"], ["training_outcome", "Training Outcome"],
    ["near_miss_analysis", "Near Miss Analysis"], ["external_inspection_learning", "External Inspection Learning"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getLessonsLearnedCategoryLabel(c)).toBe(l); });
});

describe("getLessonsLearnedOutcomeLabel", () => {
  const cases: [LessonsLearnedOutcome, string][] = [
    ["fully_embedded", "Fully Embedded"], ["partially_embedded", "Partially Embedded"],
    ["action_planned", "Action Planned"], ["not_actioned", "Not Actioned"], ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getLessonsLearnedOutcomeLabel(o)).toBe(l); });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s → %s", (r, l) => { expect(getRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluateLessonsLearnedQuality", () => {
  it("0 for empty", () => { const r = evaluateLessonsLearnedQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { const r = evaluateLessonsLearnedQuality(makeRecords(5)); expect(r.overallScore).toBe(25); });
  it("0 for all-false", () => { const r = evaluateLessonsLearnedQuality(makeRecords(3, { rootCauseIdentified: false, lessonsDocumented: false, staffBriefingCompleted: false, improvementMeasurable: false })); expect(r.overallScore).toBe(0); });
  it("weight 7 for rootCauseIdentified", () => { expect(evaluateLessonsLearnedQuality([makeRecord({ rootCauseIdentified: true, lessonsDocumented: false, staffBriefingCompleted: false, improvementMeasurable: false })]).overallScore).toBe(7); });
  it("weight 6 for lessonsDocumented", () => { expect(evaluateLessonsLearnedQuality([makeRecord({ rootCauseIdentified: false, lessonsDocumented: true, staffBriefingCompleted: false, improvementMeasurable: false })]).overallScore).toBe(6); });
  it("weight 6 for staffBriefingCompleted", () => { expect(evaluateLessonsLearnedQuality([makeRecord({ rootCauseIdentified: false, lessonsDocumented: false, staffBriefingCompleted: true, improvementMeasurable: false })]).overallScore).toBe(6); });
  it("weight 6 for improvementMeasurable", () => { expect(evaluateLessonsLearnedQuality([makeRecord({ rootCauseIdentified: false, lessonsDocumented: false, staffBriefingCompleted: false, improvementMeasurable: true })]).overallScore).toBe(6); });
  it("50% partial = 12.5", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", rootCauseIdentified: false, lessonsDocumented: false, staffBriefingCompleted: false, improvementMeasurable: false })];
    expect(evaluateLessonsLearnedQuality(records).overallScore).toBe(12.5);
  });
  it("caps at 25", () => { expect(evaluateLessonsLearnedQuality(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
  it("totalRecords reflects input length", () => { expect(evaluateLessonsLearnedQuality(makeRecords(7)).totalRecords).toBe(7); });
  it("rates are 100 for all-true", () => {
    const r = evaluateLessonsLearnedQuality(makeRecords(3));
    expect(r.rootCauseIdentifiedRate).toBe(100);
    expect(r.lessonsDocumentedRate).toBe(100);
    expect(r.staffBriefingCompletedRate).toBe(100);
    expect(r.improvementMeasurableRate).toBe(100);
  });
  it("rates are 0 for all-false", () => {
    const r = evaluateLessonsLearnedQuality(makeRecords(3, { rootCauseIdentified: false, lessonsDocumented: false, staffBriefingCompleted: false, improvementMeasurable: false }));
    expect(r.rootCauseIdentifiedRate).toBe(0);
    expect(r.lessonsDocumentedRate).toBe(0);
  });
  it("mixed rates", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", rootCauseIdentified: false }), makeRecord({ id: "c", rootCauseIdentified: false })];
    const r = evaluateLessonsLearnedQuality(records);
    expect(r.rootCauseIdentifiedRate).toBe(33);
  });
  it("single record all true", () => {
    const r = evaluateLessonsLearnedQuality([makeRecord()]);
    expect(r.overallScore).toBe(25);
    expect(r.totalRecords).toBe(1);
  });
});

// ═══ Compliance ═══
describe("evaluateLessonsLearnedCompliance", () => {
  it("0 for empty", () => { expect(evaluateLessonsLearnedCompliance([]).overallScore).toBe(0); });
  it("25 for perfect with all 8 categories", () => {
    const cats: LessonsLearnedCategory[] = ["incident_debrief", "complaint_learning", "safeguarding_review", "practice_improvement", "policy_update", "training_outcome", "near_miss_analysis", "external_inspection_learning"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    expect(evaluateLessonsLearnedCompliance(records).overallScore).toBe(25);
  });
  it("4/8 categories = 0.5 ratio", () => {
    const cats: LessonsLearnedCategory[] = ["incident_debrief", "complaint_learning", "safeguarding_review", "practice_improvement"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateLessonsLearnedCompliance(records);
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
  it("single category = 0.13 ratio", () => { expect(evaluateLessonsLearnedCompliance(makeRecords(5)).categoryDiversityRatio).toBe(0.13); });
  it("caps at 25", () => { expect(evaluateLessonsLearnedCompliance(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
  it("empty returns zero uniqueCategories", () => { expect(evaluateLessonsLearnedCompliance([]).uniqueCategories).toBe(0); });
  it("documentation rate correct", () => {
    const records = [makeRecord({ id: "a", documentationComplete: true }), makeRecord({ id: "b", documentationComplete: false })];
    expect(evaluateLessonsLearnedCompliance(records).documentationCompleteRate).toBe(50);
  });
  it("timely recording rate correct", () => {
    const records = [makeRecord({ id: "a", timelyRecording: true }), makeRecord({ id: "b", timelyRecording: false }), makeRecord({ id: "c", timelyRecording: false })];
    expect(evaluateLessonsLearnedCompliance(records).timelyRecordingRate).toBe(33);
  });
  it("root cause rate in compliance", () => {
    const records = [makeRecord({ id: "a", rootCauseIdentified: false }), makeRecord({ id: "b", rootCauseIdentified: true })];
    expect(evaluateLessonsLearnedCompliance(records).rootCauseIdentifiedRate).toBe(50);
  });
  it("2/8 categories = 0.25 ratio", () => {
    const cats: LessonsLearnedCategory[] = ["incident_debrief", "complaint_learning"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    expect(evaluateLessonsLearnedCompliance(records).categoryDiversityRatio).toBe(0.25);
  });
  it("all false booleans still has diversity score", () => {
    const cats: LessonsLearnedCategory[] = ["incident_debrief", "complaint_learning", "safeguarding_review", "practice_improvement"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c, documentationComplete: false, timelyRecording: false, rootCauseIdentified: false }));
    const r = evaluateLessonsLearnedCompliance(records);
    expect(r.overallScore).toBe(2.5); // only diversity: 0.5 * 5 = 2.5
  });
});

// ═══ Policy ═══
describe("evaluateLessonsLearnedPolicy", () => {
  it("0 for null", () => { expect(evaluateLessonsLearnedPolicy(null).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateLessonsLearnedPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateLessonsLearnedPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("lessonsLearnedPolicy = 4", () => { expect(evaluateLessonsLearnedPolicy({ ...allFalsePolicy(), lessonsLearnedPolicy: true }).overallScore).toBe(4); });
  it("postIncidentReviewPolicy = 4", () => { expect(evaluateLessonsLearnedPolicy({ ...allFalsePolicy(), postIncidentReviewPolicy: true }).overallScore).toBe(4); });
  it("complaintLearningPolicy = 4", () => { expect(evaluateLessonsLearnedPolicy({ ...allFalsePolicy(), complaintLearningPolicy: true }).overallScore).toBe(4); });
  it("practiceImprovementFramework = 4", () => { expect(evaluateLessonsLearnedPolicy({ ...allFalsePolicy(), practiceImprovementFramework: true }).overallScore).toBe(4); });
  it("knowledgeSharingPolicy = 3", () => { expect(evaluateLessonsLearnedPolicy({ ...allFalsePolicy(), knowledgeSharingPolicy: true }).overallScore).toBe(3); });
  it("externalLearningIntegration = 3", () => { expect(evaluateLessonsLearnedPolicy({ ...allFalsePolicy(), externalLearningIntegration: true }).overallScore).toBe(3); });
  it("auditAndReviewSchedule = 3", () => { expect(evaluateLessonsLearnedPolicy({ ...allFalsePolicy(), auditAndReviewSchedule: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluateLessonsLearnedPolicy(allTruePolicy()).overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3); });
  it("null returns all false booleans", () => {
    const r = evaluateLessonsLearnedPolicy(null);
    expect(r.lessonsLearnedPolicy).toBe(false);
    expect(r.postIncidentReviewPolicy).toBe(false);
    expect(r.complaintLearningPolicy).toBe(false);
    expect(r.practiceImprovementFramework).toBe(false);
    expect(r.knowledgeSharingPolicy).toBe(false);
    expect(r.externalLearningIntegration).toBe(false);
    expect(r.auditAndReviewSchedule).toBe(false);
  });
  it("partial policy", () => {
    const p = { ...allFalsePolicy(), lessonsLearnedPolicy: true, postIncidentReviewPolicy: true, knowledgeSharingPolicy: true };
    expect(evaluateLessonsLearnedPolicy(p).overallScore).toBe(11); // 4+4+3
  });
});

// ═══ Staff Readiness ═══
describe("evaluateStaffLessonsLearnedReadiness", () => {
  it("0 for empty", () => { expect(evaluateStaffLessonsLearnedReadiness([]).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffLessonsLearnedReadiness([makeStaff()]).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffLessonsLearnedReadiness([makeStaff({ reflectivePracticeSkills: false, rootCauseAnalysisKnowledge: false, documentationSkills: false, improvementPlanningSkills: false, debriefFacilitationSkills: false, knowledgeSharingAbility: false })]).overallScore).toBe(0); });
  it("reflectivePracticeSkills = 6", () => { expect(evaluateStaffLessonsLearnedReadiness([makeStaff({ reflectivePracticeSkills: true, rootCauseAnalysisKnowledge: false, documentationSkills: false, improvementPlanningSkills: false, debriefFacilitationSkills: false, knowledgeSharingAbility: false })]).overallScore).toBe(6); });
  it("rootCauseAnalysisKnowledge = 5", () => { expect(evaluateStaffLessonsLearnedReadiness([makeStaff({ reflectivePracticeSkills: false, rootCauseAnalysisKnowledge: true, documentationSkills: false, improvementPlanningSkills: false, debriefFacilitationSkills: false, knowledgeSharingAbility: false })]).overallScore).toBe(5); });
  it("documentationSkills = 5", () => { expect(evaluateStaffLessonsLearnedReadiness([makeStaff({ reflectivePracticeSkills: false, rootCauseAnalysisKnowledge: false, documentationSkills: true, improvementPlanningSkills: false, debriefFacilitationSkills: false, knowledgeSharingAbility: false })]).overallScore).toBe(5); });
  it("improvementPlanningSkills = 4", () => { expect(evaluateStaffLessonsLearnedReadiness([makeStaff({ reflectivePracticeSkills: false, rootCauseAnalysisKnowledge: false, documentationSkills: false, improvementPlanningSkills: true, debriefFacilitationSkills: false, knowledgeSharingAbility: false })]).overallScore).toBe(4); });
  it("debriefFacilitationSkills = 3", () => { expect(evaluateStaffLessonsLearnedReadiness([makeStaff({ reflectivePracticeSkills: false, rootCauseAnalysisKnowledge: false, documentationSkills: false, improvementPlanningSkills: false, debriefFacilitationSkills: true, knowledgeSharingAbility: false })]).overallScore).toBe(3); });
  it("knowledgeSharingAbility = 2", () => { expect(evaluateStaffLessonsLearnedReadiness([makeStaff({ reflectivePracticeSkills: false, rootCauseAnalysisKnowledge: false, documentationSkills: false, improvementPlanningSkills: false, debriefFacilitationSkills: false, knowledgeSharingAbility: true })]).overallScore).toBe(2); });
  it("weights sum to 25", () => { expect(evaluateStaffLessonsLearnedReadiness([makeStaff()]).overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2); });
  it("mixed staff partial", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", reflectivePracticeSkills: false, knowledgeSharingAbility: false })];
    const r = evaluateStaffLessonsLearnedReadiness(staff);
    expect(r.totalStaff).toBe(2);
    expect(r.overallScore).toBe(21); // 3+5+5+4+3+1
  });
  it("empty returns zero rates", () => {
    const r = evaluateStaffLessonsLearnedReadiness([]);
    expect(r.totalStaff).toBe(0);
    expect(r.reflectivePracticeSkillsRate).toBe(0);
    expect(r.rootCauseAnalysisKnowledgeRate).toBe(0);
  });
  it("3 staff mixed", () => {
    const staff = [
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2", reflectivePracticeSkills: false, documentationSkills: false }),
      makeStaff({ staffId: "s3", reflectivePracticeSkills: false, rootCauseAnalysisKnowledge: false, documentationSkills: false }),
    ];
    const r = evaluateStaffLessonsLearnedReadiness(staff);
    expect(r.totalStaff).toBe(3);
    expect(r.reflectivePracticeSkillsRate).toBe(33);
    expect(r.rootCauseAnalysisKnowledgeRate).toBe(67);
    expect(r.documentationSkillsRate).toBe(33);
  });
});

// ═══ Child Profiles ═══
describe("buildChildLessonsLearnedProfiles", () => {
  it("empty for no records", () => { expect(buildChildLessonsLearnedProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const profiles = buildChildLessonsLearnedProfiles([makeRecord({ id: "a", childId: "c1" }), makeRecord({ id: "b", childId: "c2" }), makeRecord({ id: "c", childId: "c1" })]);
    expect(profiles).toHaveLength(2);
  });
  it("freq=0 for <5", () => { expect(buildChildLessonsLearnedProfiles(makeRecords(4, { childId: "c1" }))[0].overallScore).toBe(6); });
  it("freq=1 for 5-9", () => { expect(buildChildLessonsLearnedProfiles(makeRecords(5, { childId: "c1" }))[0].overallScore).toBe(7); });
  it("freq=2 for >=10", () => { expect(buildChildLessonsLearnedProfiles(makeRecords(10, { childId: "c1" }))[0].overallScore).toBe(8); });
  it("diversity 2 for >=4 cats", () => {
    const cats: LessonsLearnedCategory[] = ["incident_debrief", "complaint_learning", "safeguarding_review", "practice_improvement"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c }));
    expect(buildChildLessonsLearnedProfiles(records)[0].overallScore).toBe(8); // 0+3+3+2
  });
  it("caps at 10", () => {
    const cats: LessonsLearnedCategory[] = ["incident_debrief", "complaint_learning", "safeguarding_review", "practice_improvement", "policy_update", "training_outcome", "near_miss_analysis", "external_inspection_learning"];
    const records = cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", category: c })));
    expect(buildChildLessonsLearnedProfiles(records)[0].overallScore).toBe(10);
  });
  it("rate1 score boundaries", () => {
    // 2 out of 3 rootCauseIdentified => 67% => rate1Score = 2
    const records = [
      makeRecord({ id: "a", childId: "c1", rootCauseIdentified: true }),
      makeRecord({ id: "b", childId: "c1", rootCauseIdentified: true }),
      makeRecord({ id: "c", childId: "c1", rootCauseIdentified: false }),
    ];
    const p = buildChildLessonsLearnedProfiles(records)[0];
    expect(p.rootCauseIdentifiedRate).toBe(67);
    // freq=0, rate1=2 (67%), rate2=3 (100%), diversity=0 => 5
    expect(p.overallScore).toBe(5);
  });
  it("rate2 score boundaries — 40% threshold", () => {
    // 2 out of 5 lessonsDocumented => 40% => rate2Score = 1
    const records = [
      makeRecord({ id: "a", childId: "c1", lessonsDocumented: true }),
      makeRecord({ id: "b", childId: "c1", lessonsDocumented: true }),
      makeRecord({ id: "c", childId: "c1", lessonsDocumented: false }),
      makeRecord({ id: "d", childId: "c1", lessonsDocumented: false }),
      makeRecord({ id: "e", childId: "c1", lessonsDocumented: false }),
    ];
    const p = buildChildLessonsLearnedProfiles(records)[0];
    expect(p.lessonsDocumentedRate).toBe(40);
    // freq=1 (5 records), rate1=3 (100%), rate2=1 (40%), diversity=0 => 5
    expect(p.overallScore).toBe(5);
  });
  it("diversity 1 for 2-3 cats", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", category: "incident_debrief" }),
      makeRecord({ id: "b", childId: "c1", category: "complaint_learning" }),
    ];
    const p = buildChildLessonsLearnedProfiles(records)[0];
    expect(p.categoriesCovered).toHaveLength(2);
    // freq=0, rate1=3, rate2=3, diversity=1 => 7
    expect(p.overallScore).toBe(7);
  });
  it("diversity 0 for single cat", () => {
    const records = [makeRecord({ id: "a", childId: "c1" })];
    const p = buildChildLessonsLearnedProfiles(records)[0];
    expect(p.categoriesCovered).toHaveLength(1);
    // freq=0, rate1=3, rate2=3, diversity=0 => 6
    expect(p.overallScore).toBe(6);
  });
  it("low rates give low scores", () => {
    const records = [makeRecord({ id: "a", childId: "c1", rootCauseIdentified: false, lessonsDocumented: false })];
    const p = buildChildLessonsLearnedProfiles(records)[0];
    expect(p.rootCauseIdentifiedRate).toBe(0);
    expect(p.lessonsDocumentedRate).toBe(0);
    // freq=0, rate1=0, rate2=0, diversity=0 => 0
    expect(p.overallScore).toBe(0);
  });
  it("multiple children separate profiles", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "b", childId: "c2", childName: "Jordan" }),
      makeRecord({ id: "c", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "d", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildLessonsLearnedProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalRecords).toBe(2);
    expect(profiles[1].childName).toBe("Jordan");
    expect(profiles[1].totalRecords).toBe(2);
  });
  it("rate1 at exactly 80% gives score 3", () => {
    const records = [
      ...makeRecords(4, { childId: "c1", rootCauseIdentified: true }),
      makeRecord({ id: "ll-extra", childId: "c1", rootCauseIdentified: false }),
    ];
    const p = buildChildLessonsLearnedProfiles(records)[0];
    expect(p.rootCauseIdentifiedRate).toBe(80);
    // freq=1, rate1=3, rate2=3(all lessonsDocumented=true by default=100%), diversity=0 => 7
    expect(p.overallScore).toBe(7);
  });
  it("rate1 at exactly 60% gives score 2", () => {
    const records = [
      ...makeRecords(3, { childId: "c1", rootCauseIdentified: true }),
      makeRecord({ id: "ll-f1", childId: "c1", rootCauseIdentified: false }),
      makeRecord({ id: "ll-f2", childId: "c1", rootCauseIdentified: false }),
    ];
    const p = buildChildLessonsLearnedProfiles(records)[0];
    expect(p.rootCauseIdentifiedRate).toBe(60);
    // freq=1, rate1=2, rate2=3, diversity=0 => 6
    expect(p.overallScore).toBe(6);
  });
  it("rate2 below 40% gives score 0", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", lessonsDocumented: true }),
      makeRecord({ id: "b", childId: "c1", lessonsDocumented: false }),
      makeRecord({ id: "c", childId: "c1", lessonsDocumented: false }),
      makeRecord({ id: "d", childId: "c1", lessonsDocumented: false }),
    ];
    const p = buildChildLessonsLearnedProfiles(records)[0];
    expect(p.lessonsDocumentedRate).toBe(25);
    // freq=0, rate1=3, rate2=0, diversity=0 => 3
    expect(p.overallScore).toBe(3);
  });
});

// ═══ Orchestrator ═══
describe("generateLessonsLearnedIntelligence", () => {
  it("outstanding for perfect data", () => {
    const cats: LessonsLearnedCategory[] = ["incident_debrief", "complaint_learning", "safeguarding_review", "practice_improvement", "policy_update", "training_outcome", "near_miss_analysis", "external_inspection_learning"];
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ date: "2026-06-15" }), makeRecord({ id: "out", date: "2025-01-01" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.lessonsLearnedQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.lessonsLearnedQuality).toBeDefined();
    expect(r.lessonsLearnedCompliance).toBeDefined();
    expect(r.lessonsLearnedPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });
  it("includes regulatory links", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 13"))).toBe(true);
  });
  it("actions when policy null", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
  it("score capping at 100", () => {
    // Even with max scores in all areas, overall cannot exceed 100
    const cats: LessonsLearnedCategory[] = ["incident_debrief", "complaint_learning", "safeguarding_review", "practice_improvement", "policy_update", "training_outcome", "near_miss_analysis", "external_inspection_learning"];
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("homeId propagated", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.homeId).toBe("home-oak");
  });
  it("period propagated", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-12-31");
  });
  it("child profiles included", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ date: "2026-03-15", childId: "c1" }), makeRecord({ id: "ll-2", date: "2026-04-15", childId: "c2", childName: "Jordan" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.childProfiles).toHaveLength(2);
  });
  it("strengths populated when score high", () => {
    const cats: LessonsLearnedCategory[] = ["incident_debrief", "complaint_learning", "safeguarding_review", "practice_improvement", "policy_update", "training_outcome", "near_miss_analysis", "external_inspection_learning"];
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("areas for improvement when empty data", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("actions default when nothing to do", () => {
    const cats: LessonsLearnedCategory[] = ["incident_debrief", "complaint_learning", "safeguarding_review", "practice_improvement", "policy_update", "training_outcome", "near_miss_analysis", "external_inspection_learning"];
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("No immediate actions required"))).toBe(true);
  });
  it("null policy generates URGENT action", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: null, staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("empty staff generates URGENT action", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [] });
    expect(r.actions.some(a => a.includes("URGENT") && a.includes("staff"))).toBe(true);
  });
  it("date filtering excludes out-of-range records", () => {
    const records = [
      makeRecord({ id: "in1", date: "2026-06-15" }),
      makeRecord({ id: "in2", date: "2026-07-15" }),
      makeRecord({ id: "before", date: "2025-12-31" }),
      makeRecord({ id: "after", date: "2027-01-01" }),
    ];
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.lessonsLearnedQuality.totalRecords).toBe(2);
  });
  it("regulatory links always have 7 items", () => {
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks).toHaveLength(7);
    expect(r.regulatoryLinks.some(l => l.includes("WTSC 2023"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("Quality Standards 2015"))).toBe(true);
  });
  it("low quality triggers HIGH action", () => {
    const records = [makeRecord({ rootCauseIdentified: false, lessonsDocumented: false })];
    const r = generateLessonsLearnedIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("HIGH"))).toBe(true);
  });
});
