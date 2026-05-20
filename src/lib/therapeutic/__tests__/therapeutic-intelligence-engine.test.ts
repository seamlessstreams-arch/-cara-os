import { describe, it, expect } from "vitest";
import {
  pct, getRating, getTherapeuticCategoryLabel, getTherapeuticOutcomeLabel, getRatingLabel,
  evaluateTherapeuticQuality, evaluateTherapeuticCompliance, evaluateTherapeuticPolicy,
  evaluateStaffTherapeuticReadiness, buildChildTherapeuticProfiles, generateTherapeuticIntelligence,
} from "../therapeutic-intelligence-engine";
import type {
  TherapeuticRecord, TherapeuticPolicy, StaffTherapeuticTraining,
  TherapeuticCategory, TherapeuticOutcome, Rating,
} from "../therapeutic-intelligence-engine";

function makeRecord(o: Partial<TherapeuticRecord> = {}): TherapeuticRecord {
  return { id: "t-1", homeId: "home-oak", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "individual_therapy", outcome: "positive_progress", therapeuticGoalAligned: true, voiceOfChildIncluded: true, evidenceBasedApproach: true, wellbeingImpactRecorded: true, documentationComplete: true, timelyRecording: true, ...o };
}
function makeRecords(n: number, o: Partial<TherapeuticRecord> = {}): TherapeuticRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `t-${i}`, ...o }));
}
function allTruePolicy(): TherapeuticPolicy {
  return { therapeuticCareModel: true, traumaInformedPolicy: true, emotionalRegulationFramework: true, mentalHealthSupportPolicy: true, crisisInterventionProtocol: true, wellbeingMonitoringPolicy: true, therapeuticSupervisionPolicy: true };
}
function allFalsePolicy(): TherapeuticPolicy {
  return { therapeuticCareModel: false, traumaInformedPolicy: false, emotionalRegulationFramework: false, mentalHealthSupportPolicy: false, crisisInterventionProtocol: false, wellbeingMonitoringPolicy: false, therapeuticSupervisionPolicy: false };
}
function makeStaff(o: Partial<StaffTherapeuticTraining> = {}): StaffTherapeuticTraining {
  return { staffId: "s1", therapeuticCareKnowledge: true, traumaInformedPractice: true, emotionalRegulationSkills: true, mentalHealthAwareness: true, crisisDeEscalation: true, therapeuticRelationshipBuilding: true, ...o };
}

describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("rounds 2/3 to 67", () => { expect(pct(2, 3)).toBe(67); });
});

describe("getRating", () => {
  it("outstanding ≥80", () => { expect(getRating(80)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("inadequate <40", () => { expect(getRating(0)).toBe("inadequate"); });
});

describe("getTherapeuticCategoryLabel", () => {
  const cases: [TherapeuticCategory, string][] = [
    ["individual_therapy", "Individual Therapy"], ["group_therapy", "Group Therapy"], ["crisis_intervention", "Crisis Intervention"],
    ["emotional_regulation", "Emotional Regulation"], ["trauma_informed_care", "Trauma-Informed Care"], ["wellbeing_assessment", "Wellbeing Assessment"],
    ["therapeutic_activity", "Therapeutic Activity"], ["mental_health_review", "Mental Health Review"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getTherapeuticCategoryLabel(c)).toBe(l); });
});

describe("getTherapeuticOutcomeLabel", () => {
  const cases: [TherapeuticOutcome, string][] = [
    ["positive_progress", "Positive Progress"], ["maintaining", "Maintaining"], ["some_improvement", "Some Improvement"],
    ["no_change", "No Change"], ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getTherapeuticOutcomeLabel(o)).toBe(l); });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s → %s", (r, l) => { expect(getRatingLabel(r)).toBe(l); });
});

describe("evaluateTherapeuticQuality", () => {
  it("0 for empty", () => { const r = evaluateTherapeuticQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { expect(evaluateTherapeuticQuality(makeRecords(5)).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateTherapeuticQuality(makeRecords(3, { therapeuticGoalAligned: false, voiceOfChildIncluded: false, evidenceBasedApproach: false, wellbeingImpactRecorded: false })).overallScore).toBe(0); });
  it("weight 7 for therapeuticGoalAligned", () => { expect(evaluateTherapeuticQuality([makeRecord({ therapeuticGoalAligned: true, voiceOfChildIncluded: false, evidenceBasedApproach: false, wellbeingImpactRecorded: false })]).overallScore).toBe(7); });
  it("weight 6 for voiceOfChildIncluded", () => { expect(evaluateTherapeuticQuality([makeRecord({ therapeuticGoalAligned: false, voiceOfChildIncluded: true, evidenceBasedApproach: false, wellbeingImpactRecorded: false })]).overallScore).toBe(6); });
  it("weight 6 for evidenceBasedApproach", () => { expect(evaluateTherapeuticQuality([makeRecord({ therapeuticGoalAligned: false, voiceOfChildIncluded: false, evidenceBasedApproach: true, wellbeingImpactRecorded: false })]).overallScore).toBe(6); });
  it("weight 6 for wellbeingImpactRecorded", () => { expect(evaluateTherapeuticQuality([makeRecord({ therapeuticGoalAligned: false, voiceOfChildIncluded: false, evidenceBasedApproach: false, wellbeingImpactRecorded: true })]).overallScore).toBe(6); });
  it("50% partial = 12.5", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", therapeuticGoalAligned: false, voiceOfChildIncluded: false, evidenceBasedApproach: false, wellbeingImpactRecorded: false })];
    expect(evaluateTherapeuticQuality(records).overallScore).toBe(12.5);
  });
  it("caps at 25", () => { expect(evaluateTherapeuticQuality(makeRecords(100)).overallScore).toBeLessThanOrEqual(25); });
});

describe("evaluateTherapeuticCompliance", () => {
  it("0 for empty", () => { expect(evaluateTherapeuticCompliance([]).overallScore).toBe(0); });
  it("25 for perfect with all 8 categories", () => {
    const cats: TherapeuticCategory[] = ["individual_therapy", "group_therapy", "crisis_intervention", "emotional_regulation", "trauma_informed_care", "wellbeing_assessment", "therapeutic_activity", "mental_health_review"];
    expect(evaluateTherapeuticCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }))).overallScore).toBe(25);
  });
  it("single category = 0.13 ratio", () => { expect(evaluateTherapeuticCompliance(makeRecords(5)).categoryDiversityRatio).toBe(0.13); });
  it("4/8 = 0.5 ratio", () => {
    const cats: TherapeuticCategory[] = ["individual_therapy", "group_therapy", "crisis_intervention", "emotional_regulation"];
    expect(evaluateTherapeuticCompliance(cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }))).categoryDiversityRatio).toBe(0.5);
  });
});

describe("evaluateTherapeuticPolicy", () => {
  it("0 for null", () => { expect(evaluateTherapeuticPolicy(null).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateTherapeuticPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateTherapeuticPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("therapeuticCareModel = 4", () => { expect(evaluateTherapeuticPolicy({ ...allFalsePolicy(), therapeuticCareModel: true }).overallScore).toBe(4); });
  it("traumaInformedPolicy = 4", () => { expect(evaluateTherapeuticPolicy({ ...allFalsePolicy(), traumaInformedPolicy: true }).overallScore).toBe(4); });
  it("emotionalRegulationFramework = 4", () => { expect(evaluateTherapeuticPolicy({ ...allFalsePolicy(), emotionalRegulationFramework: true }).overallScore).toBe(4); });
  it("mentalHealthSupportPolicy = 4", () => { expect(evaluateTherapeuticPolicy({ ...allFalsePolicy(), mentalHealthSupportPolicy: true }).overallScore).toBe(4); });
  it("crisisInterventionProtocol = 3", () => { expect(evaluateTherapeuticPolicy({ ...allFalsePolicy(), crisisInterventionProtocol: true }).overallScore).toBe(3); });
  it("wellbeingMonitoringPolicy = 3", () => { expect(evaluateTherapeuticPolicy({ ...allFalsePolicy(), wellbeingMonitoringPolicy: true }).overallScore).toBe(3); });
  it("therapeuticSupervisionPolicy = 3", () => { expect(evaluateTherapeuticPolicy({ ...allFalsePolicy(), therapeuticSupervisionPolicy: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluateTherapeuticPolicy(allTruePolicy()).overallScore).toBe(4+4+4+4+3+3+3); });
});

describe("evaluateStaffTherapeuticReadiness", () => {
  it("0 for empty", () => { expect(evaluateStaffTherapeuticReadiness([]).overallScore).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffTherapeuticReadiness([makeStaff()]).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffTherapeuticReadiness([makeStaff({ therapeuticCareKnowledge: false, traumaInformedPractice: false, emotionalRegulationSkills: false, mentalHealthAwareness: false, crisisDeEscalation: false, therapeuticRelationshipBuilding: false })]).overallScore).toBe(0); });
  it("therapeuticCareKnowledge = 6", () => { expect(evaluateStaffTherapeuticReadiness([makeStaff({ therapeuticCareKnowledge: true, traumaInformedPractice: false, emotionalRegulationSkills: false, mentalHealthAwareness: false, crisisDeEscalation: false, therapeuticRelationshipBuilding: false })]).overallScore).toBe(6); });
  it("traumaInformedPractice = 5", () => { expect(evaluateStaffTherapeuticReadiness([makeStaff({ therapeuticCareKnowledge: false, traumaInformedPractice: true, emotionalRegulationSkills: false, mentalHealthAwareness: false, crisisDeEscalation: false, therapeuticRelationshipBuilding: false })]).overallScore).toBe(5); });
  it("emotionalRegulationSkills = 5", () => { expect(evaluateStaffTherapeuticReadiness([makeStaff({ therapeuticCareKnowledge: false, traumaInformedPractice: false, emotionalRegulationSkills: true, mentalHealthAwareness: false, crisisDeEscalation: false, therapeuticRelationshipBuilding: false })]).overallScore).toBe(5); });
  it("mentalHealthAwareness = 4", () => { expect(evaluateStaffTherapeuticReadiness([makeStaff({ therapeuticCareKnowledge: false, traumaInformedPractice: false, emotionalRegulationSkills: false, mentalHealthAwareness: true, crisisDeEscalation: false, therapeuticRelationshipBuilding: false })]).overallScore).toBe(4); });
  it("crisisDeEscalation = 3", () => { expect(evaluateStaffTherapeuticReadiness([makeStaff({ therapeuticCareKnowledge: false, traumaInformedPractice: false, emotionalRegulationSkills: false, mentalHealthAwareness: false, crisisDeEscalation: true, therapeuticRelationshipBuilding: false })]).overallScore).toBe(3); });
  it("therapeuticRelationshipBuilding = 2", () => { expect(evaluateStaffTherapeuticReadiness([makeStaff({ therapeuticCareKnowledge: false, traumaInformedPractice: false, emotionalRegulationSkills: false, mentalHealthAwareness: false, crisisDeEscalation: false, therapeuticRelationshipBuilding: true })]).overallScore).toBe(2); });
  it("weights sum to 25", () => { expect(evaluateStaffTherapeuticReadiness([makeStaff()]).overallScore).toBe(6+5+5+4+3+2); });
  it("mixed staff", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", therapeuticCareKnowledge: false, therapeuticRelationshipBuilding: false })];
    expect(evaluateStaffTherapeuticReadiness(staff).overallScore).toBe(21);
  });
});

describe("buildChildTherapeuticProfiles", () => {
  it("empty for no records", () => { expect(buildChildTherapeuticProfiles([])).toEqual([]); });
  it("groups by childId", () => { expect(buildChildTherapeuticProfiles([makeRecord({ id: "a", childId: "c1" }), makeRecord({ id: "b", childId: "c2" })])).toHaveLength(2); });
  it("freq=0 for <5", () => { expect(buildChildTherapeuticProfiles(makeRecords(4, { childId: "c1" }))[0].overallScore).toBe(6); });
  it("freq=1 for 5-9", () => { expect(buildChildTherapeuticProfiles(makeRecords(5, { childId: "c1" }))[0].overallScore).toBe(7); });
  it("freq=2 for >=10", () => { expect(buildChildTherapeuticProfiles(makeRecords(10, { childId: "c1" }))[0].overallScore).toBe(8); });
  it("diversity 2 for >=4 cats", () => {
    const cats: TherapeuticCategory[] = ["individual_therapy", "group_therapy", "crisis_intervention", "emotional_regulation"];
    expect(buildChildTherapeuticProfiles(cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c })))[0].overallScore).toBe(8);
  });
  it("caps at 10", () => {
    const cats: TherapeuticCategory[] = ["individual_therapy", "group_therapy", "crisis_intervention", "emotional_regulation", "trauma_informed_care", "wellbeing_assessment", "therapeutic_activity", "mental_health_review"];
    expect(buildChildTherapeuticProfiles(cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", category: c }))))[0].overallScore).toBe(10);
  });
});

describe("generateTherapeuticIntelligence", () => {
  it("outstanding for perfect data", () => {
    const cats: TherapeuticCategory[] = ["individual_therapy", "group_therapy", "crisis_intervention", "emotional_regulation", "trauma_informed_care", "wellbeing_assessment", "therapeutic_activity", "mental_health_review"];
    const r = generateTherapeuticIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generateTherapeuticIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generateTherapeuticIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ date: "2026-06-15" }), makeRecord({ id: "out", date: "2025-01-01" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.therapeuticQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generateTherapeuticIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.therapeuticQuality).toBeDefined();
    expect(r.therapeuticCompliance).toBeDefined();
    expect(r.therapeuticPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });
  it("includes regulatory links", () => {
    const r = generateTherapeuticIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 6"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("NMS 3"))).toBe(true);
  });
  it("actions when policy null", () => {
    const r = generateTherapeuticIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
  it("strengths for outstanding", () => {
    const cats: TherapeuticCategory[] = ["individual_therapy", "group_therapy", "crisis_intervention", "emotional_regulation", "trauma_informed_care", "wellbeing_assessment", "therapeutic_activity", "mental_health_review"];
    const r = generateTherapeuticIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.strengths.some(s => s.includes("Outstanding"))).toBe(true);
  });
  it("no-action message when good", () => {
    const cats: TherapeuticCategory[] = ["individual_therapy", "group_therapy", "crisis_intervention", "emotional_regulation", "trauma_informed_care", "wellbeing_assessment", "therapeutic_activity", "mental_health_review"];
    const r = generateTherapeuticIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("No immediate actions required"))).toBe(true);
  });
});
