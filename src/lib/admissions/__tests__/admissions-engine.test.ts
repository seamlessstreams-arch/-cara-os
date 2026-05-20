import { describe, it, expect } from "vitest";
import {
  pct, getRating, getAdmissionCategoryLabel, getAdmissionOutcomeLabel, getRatingLabel,
  evaluateAdmissionQuality, evaluateAdmissionCompliance, evaluateAdmissionPolicy,
  evaluateStaffAdmissionReadiness, buildChildAdmissionProfiles,
  generateAdmissionsIntelligence,
} from "../admissions-engine";
import type { AdmissionRecord, AdmissionPolicy, StaffAdmissionTraining, AdmissionCategory } from "../admissions-engine";

let _sid = 0;
function makeRecord(o: Partial<AdmissionRecord> = {}): AdmissionRecord {
  _sid++;
  return { id: `ar-${_sid}`, childId: "child-1", childName: "Alex", admissionDate: "2026-03-01", category: "pre_admission_assessment", thoroughAssessment: true, childConsulted: true, impactOnResidentsConsidered: true, transitionPlanInPlace: true, documentationComplete: true, timelyProcess: true, ...o };
}
function makePolicy(o: Partial<AdmissionPolicy> = {}): AdmissionPolicy {
  return { id: "p-1", admissionsPolicy: true, matchingCriteria: true, transitionProtocol: true, impactAssessmentFramework: true, childParticipationGuidance: true, emergencyAdmissionProcedure: true, reviewSchedule: true, ...o };
}
let _tid = 0;
function makeTraining(o: Partial<StaffAdmissionTraining> = {}): StaffAdmissionTraining {
  _tid++;
  return { id: `t-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, assessmentSkills: true, matchingExpertise: true, transitionPlanning: true, childParticipationSkills: true, riskAssessment: true, familyEngagement: true, ...o };
}

describe("pct", () => {
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("correct pct", () => { expect(pct(3, 4)).toBe(75); });
  it("rounds", () => { expect(pct(1, 3)).toBe(33); });
  it("100 for equal", () => { expect(pct(10, 10)).toBe(100); });
  it("0 for num=0", () => { expect(pct(0, 5)).toBe(0); });
});

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); });
  it("outstanding at 100", () => { expect(getRating(100)).toBe("outstanding"); });
  it("good >= 60", () => { expect(getRating(60)).toBe("good"); });
  it("good at 79", () => { expect(getRating(79)).toBe("good"); });
  it("requires_improvement >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(0)).toBe("inadequate"); });
  it("inadequate at 39", () => { expect(getRating(39)).toBe("inadequate"); });
});

describe("labels", () => {
  it("category labels", () => {
    expect(getAdmissionCategoryLabel("pre_admission_assessment")).toBe("Pre-Admission Assessment");
    expect(getAdmissionCategoryLabel("matching_process")).toBe("Matching Process");
    expect(getAdmissionCategoryLabel("transition_planning")).toBe("Transition Planning");
    expect(getAdmissionCategoryLabel("child_participation")).toBe("Child Participation");
    expect(getAdmissionCategoryLabel("impact_assessment")).toBe("Impact Assessment");
    expect(getAdmissionCategoryLabel("placement_planning")).toBe("Placement Planning");
    expect(getAdmissionCategoryLabel("family_consultation")).toBe("Family Consultation");
    expect(getAdmissionCategoryLabel("information_gathering")).toBe("Information Gathering");
  });
  it("outcome labels", () => {
    expect(getAdmissionOutcomeLabel("fully_completed")).toBe("Fully Completed");
    expect(getAdmissionOutcomeLabel("emergency_override")).toBe("Emergency Override");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluateAdmissionQuality", () => {
  it("zeros for empty", () => {
    const r = evaluateAdmissionQuality([]);
    expect(r.overallScore).toBe(0); expect(r.totalAdmissions).toBe(0);
  });
  it("max 25 with perfect records", () => {
    const r = evaluateAdmissionQuality(Array.from({ length: 10 }, () => makeRecord()));
    expect(r.overallScore).toBe(25); expect(r.thoroughAssessmentRate).toBe(100);
  });
  it("thoroughAssessment rate", () => {
    const s = [makeRecord({ thoroughAssessment: true }), makeRecord({ thoroughAssessment: false })];
    expect(evaluateAdmissionQuality(s).thoroughAssessmentRate).toBe(50);
  });
  it("childConsulted rate", () => {
    const s = [makeRecord({ childConsulted: true }), makeRecord({ childConsulted: false }), makeRecord({ childConsulted: false })];
    expect(evaluateAdmissionQuality(s).childConsultedRate).toBe(33);
  });
  it("impactConsidered rate", () => {
    const s = [makeRecord({ impactOnResidentsConsidered: true }), makeRecord({ impactOnResidentsConsidered: false })];
    expect(evaluateAdmissionQuality(s).impactConsideredRate).toBe(50);
  });
  it("transitionPlan rate", () => {
    const s = [makeRecord({ transitionPlanInPlace: true }), makeRecord({ transitionPlanInPlace: true }), makeRecord({ transitionPlanInPlace: false })];
    expect(evaluateAdmissionQuality(s).transitionPlanRate).toBe(67);
  });
  it("caps at 25", () => { expect(evaluateAdmissionQuality(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25); });
  it("rating outstanding", () => { expect(evaluateAdmissionQuality(Array.from({ length: 5 }, () => makeRecord())).rating).toBe("outstanding"); });
  it("rating inadequate when poor", () => {
    const s = [makeRecord({ thoroughAssessment: false, childConsulted: false, impactOnResidentsConsidered: false, transitionPlanInPlace: false })];
    expect(evaluateAdmissionQuality(s).rating).toBe("inadequate");
  });
});

describe("evaluateAdmissionCompliance", () => {
  it("zeros for empty", () => { expect(evaluateAdmissionCompliance([]).overallScore).toBe(0); });
  it("max 25 with full diversity", () => {
    const cats: AdmissionCategory[] = ["pre_admission_assessment", "matching_process", "transition_planning", "child_participation", "impact_assessment", "placement_planning", "family_consultation", "information_gathering"];
    const r = evaluateAdmissionCompliance(cats.map((c) => makeRecord({ category: c })));
    expect(r.overallScore).toBe(25); expect(r.categoryDiversityRatio).toBe(100);
  });
  it("documentation rate", () => {
    const s = [makeRecord({ documentationComplete: true }), makeRecord({ documentationComplete: false })];
    expect(evaluateAdmissionCompliance(s).documentationRate).toBe(50);
  });
  it("timely rate", () => {
    const s = [makeRecord({ timelyProcess: true }), makeRecord({ timelyProcess: false }), makeRecord({ timelyProcess: false })];
    expect(evaluateAdmissionCompliance(s).timelyRate).toBe(33);
  });
  it("diversity 2/8=25%", () => {
    const s = [makeRecord({ category: "pre_admission_assessment" }), makeRecord({ category: "matching_process" }), makeRecord({ category: "pre_admission_assessment" })];
    expect(evaluateAdmissionCompliance(s).categoryDiversityRatio).toBe(25);
  });
});

describe("evaluateAdmissionPolicy", () => {
  it("null gives 0", () => { const r = evaluateAdmissionPolicy(null); expect(r.overallScore).toBe(0); expect(r.admissionsPolicy).toBe(false); });
  it("all true gives 25", () => { expect(evaluateAdmissionPolicy(makePolicy()).overallScore).toBe(25); });
  it("first 4 at 4pts", () => { expect(evaluateAdmissionPolicy(makePolicy({ childParticipationGuidance: false, emergencyAdmissionProcedure: false, reviewSchedule: false })).overallScore).toBe(16); });
  it("last 3 at 3pts", () => { expect(evaluateAdmissionPolicy(makePolicy({ admissionsPolicy: false, matchingCriteria: false, transitionProtocol: false, impactAssessmentFramework: false })).overallScore).toBe(9); });
  it("all false gives 0", () => { expect(evaluateAdmissionPolicy(makePolicy({ admissionsPolicy: false, matchingCriteria: false, transitionProtocol: false, impactAssessmentFramework: false, childParticipationGuidance: false, emergencyAdmissionProcedure: false, reviewSchedule: false })).overallScore).toBe(0); });
  it("mirrors booleans", () => { const r = evaluateAdmissionPolicy(makePolicy({ admissionsPolicy: false })); expect(r.admissionsPolicy).toBe(false); expect(r.matchingCriteria).toBe(true); });
  it("single 4pt = 4", () => { expect(evaluateAdmissionPolicy(makePolicy({ admissionsPolicy: true, matchingCriteria: false, transitionProtocol: false, impactAssessmentFramework: false, childParticipationGuidance: false, emergencyAdmissionProcedure: false, reviewSchedule: false })).overallScore).toBe(4); });
  it("single 3pt = 3", () => { expect(evaluateAdmissionPolicy(makePolicy({ admissionsPolicy: false, matchingCriteria: false, transitionProtocol: false, impactAssessmentFramework: false, childParticipationGuidance: true, emergencyAdmissionProcedure: false, reviewSchedule: false })).overallScore).toBe(3); });
});

describe("evaluateStaffAdmissionReadiness", () => {
  it("zeros for empty", () => { expect(evaluateStaffAdmissionReadiness([]).overallScore).toBe(0); });
  it("25 fully trained", () => { expect(evaluateStaffAdmissionReadiness([makeTraining()]).overallScore).toBe(25); });
  it("assessmentSkills only = 6", () => {
    const t = makeTraining({ assessmentSkills: true, matchingExpertise: false, transitionPlanning: false, childParticipationSkills: false, riskAssessment: false, familyEngagement: false });
    expect(evaluateStaffAdmissionReadiness([t]).overallScore).toBe(6);
  });
  it("familyEngagement only = 2", () => {
    const t = makeTraining({ assessmentSkills: false, matchingExpertise: false, transitionPlanning: false, childParticipationSkills: false, riskAssessment: false, familyEngagement: true });
    expect(evaluateStaffAdmissionReadiness([t]).overallScore).toBe(2);
  });
  it("mixed rates", () => {
    const t1 = makeTraining({ assessmentSkills: true, matchingExpertise: false, transitionPlanning: false, childParticipationSkills: false, riskAssessment: false, familyEngagement: false });
    const t2 = makeTraining({ assessmentSkills: false, matchingExpertise: true, transitionPlanning: false, childParticipationSkills: false, riskAssessment: false, familyEngagement: false });
    const r = evaluateStaffAdmissionReadiness([t1, t2]);
    expect(r.assessmentSkillsRate).toBe(50); expect(r.matchingExpertiseRate).toBe(50);
  });
  it("totalStaff count", () => { expect(evaluateStaffAdmissionReadiness([makeTraining(), makeTraining()]).totalStaff).toBe(2); });
});

describe("buildChildAdmissionProfiles", () => {
  it("empty gives []", () => { expect(buildChildAdmissionProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const s = [makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c2", childName: "B" })];
    const p = buildChildAdmissionProfiles(s);
    expect(p).toHaveLength(2); expect(p[0].totalRecords).toBe(2);
  });
  it("caps at 10", () => {
    const cats: AdmissionCategory[] = ["pre_admission_assessment", "matching_process", "transition_planning", "child_participation", "impact_assessment"];
    const s = Array.from({ length: 12 }, (_, i) => makeRecord({ childId: "c1", childName: "A", category: cats[i % cats.length] }));
    expect(buildChildAdmissionProfiles(s)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("freq scoring: 3 → 0", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", thoroughAssessment: false, childConsulted: false, category: "pre_admission_assessment" }));
    expect(buildChildAdmissionProfiles(mk(3))[0].overallScore).toBe(0);
  });
  it("freq scoring: 5 → 1", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", thoroughAssessment: false, childConsulted: false, category: "pre_admission_assessment" }));
    expect(buildChildAdmissionProfiles(mk(5))[0].overallScore).toBe(1);
  });
  it("freq scoring: 10 → 2", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", thoroughAssessment: false, childConsulted: false, category: "pre_admission_assessment" }));
    expect(buildChildAdmissionProfiles(mk(10))[0].overallScore).toBe(2);
  });
  it("diversity: 4 categories → 2", () => {
    const cats: AdmissionCategory[] = ["pre_admission_assessment", "matching_process", "transition_planning", "child_participation"];
    const s = cats.map((c) => makeRecord({ childId: "c1", childName: "A", thoroughAssessment: false, childConsulted: false, category: c }));
    expect(buildChildAdmissionProfiles(s)[0].overallScore).toBe(2);
  });
  it("perfect child gets 10", () => {
    const cats: AdmissionCategory[] = ["pre_admission_assessment", "matching_process", "transition_planning", "child_participation", "impact_assessment"];
    const s = Array.from({ length: 10 }, (_, i) => makeRecord({ childId: "c1", childName: "A", category: cats[i % cats.length] }));
    expect(buildChildAdmissionProfiles(s)[0].overallScore).toBe(10);
  });
});

describe("generateAdmissionsIntelligence", () => {
  it("complete result", () => {
    const cats: AdmissionCategory[] = ["pre_admission_assessment", "matching_process", "transition_planning", "child_participation", "impact_assessment", "placement_planning", "family_consultation", "information_gathering"];
    const s = cats.map((c, i) => makeRecord({ childId: i < 4 ? "c1" : "c2", childName: i < 4 ? "A" : "B", category: c }));
    const r = generateAdmissionsIntelligence(s, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.homeId).toBe("oak-house"); expect(r.overallScore).toBeLessThanOrEqual(100); expect(r.regulatoryLinks).toHaveLength(7);
  });
  it("100 perfect", () => {
    const cats: AdmissionCategory[] = ["pre_admission_assessment", "matching_process", "transition_planning", "child_participation", "impact_assessment", "placement_planning", "family_consultation", "information_gathering"];
    const r = generateAdmissionsIntelligence(cats.map((c) => makeRecord({ category: c })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("0 empty", () => {
    const r = generateAdmissionsIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("URGENT actions", () => {
    const r = generateAdmissionsIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.filter((a) => a.startsWith("URGENT")).length).toBe(2);
  });
  it("strengths >=80%", () => {
    const cats: AdmissionCategory[] = ["pre_admission_assessment", "matching_process", "transition_planning", "child_participation", "impact_assessment", "placement_planning", "family_consultation", "information_gathering"];
    const r = generateAdmissionsIntelligence(cats.map((c) => makeRecord({ category: c })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("improvements <60%", () => {
    const s = [makeRecord({ thoroughAssessment: false, childConsulted: false, impactOnResidentsConsidered: false, transitionPlanInPlace: false, documentationComplete: false, timelyProcess: false })];
    const r = generateAdmissionsIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("child consultation action when low", () => {
    const s = [makeRecord({ childConsulted: false })];
    const r = generateAdmissionsIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.toLowerCase().includes("child") && a.toLowerCase().includes("consult"))).toBe(true);
  });
  it("child profiles included", () => {
    const s = [makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c2", childName: "B" })];
    const r = generateAdmissionsIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.childProfiles).toHaveLength(2);
  });
  it("regulatory links", () => {
    const r = generateAdmissionsIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 12"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 14"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 20"))).toBe(true);
  });
  it("overallScore capped at 100", () => {
    const r = generateAdmissionsIntelligence(Array.from({ length: 20 }, () => makeRecord()), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
});
