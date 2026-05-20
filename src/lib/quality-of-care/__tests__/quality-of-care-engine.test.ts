import { describe, it, expect } from "vitest";
import {
  pct, getRating, getQualityDomainLabel, getReviewOutcomeLabel, getRatingLabel,
  evaluateReviewQuality, evaluateReviewCompliance, evaluateQualityPolicy,
  evaluateStaffQualityReadiness, buildChildQualityProfiles,
  generateQualityOfCareIntelligence,
} from "../quality-of-care-engine";
import type { QualityReviewRecord, QualityPolicy, StaffQualityTraining, QualityDomain } from "../quality-of-care-engine";

let _sid = 0;
function makeRecord(o: Partial<QualityReviewRecord> = {}): QualityReviewRecord {
  _sid++;
  return { id: `qr-${_sid}`, childId: "child-1", childName: "Alex", reviewDate: "2026-03-01", domain: "safety_welfare", outcome: "meets_standard", evidenceDocumented: true, childViewCaptured: true, actionPlanCreated: true, followUpCompleted: true, regulatoryAligned: true, improvementIdentified: true, ...o };
}
function makePolicy(o: Partial<QualityPolicy> = {}): QualityPolicy {
  return { id: "p-1", qualityAssuranceFramework: true, reg45ReviewSchedule: true, continuousImprovementPlan: true, outcomesMeasurementPolicy: true, childParticipationStrategy: true, auditSchedule: true, feedbackMechanism: true, ...o };
}
let _tid = 0;
function makeTraining(o: Partial<StaffQualityTraining> = {}): StaffQualityTraining {
  _tid++;
  return { id: `t-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, qualityAssuranceSkills: true, outcomesMonitoring: true, regulatoryKnowledge: true, reflectivePractice: true, dataAnalysis: true, childParticipation: true, ...o };
}

// ── pct ────────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("correct pct", () => { expect(pct(3, 4)).toBe(75); });
  it("rounds", () => { expect(pct(1, 3)).toBe(33); });
  it("100 for equal", () => { expect(pct(10, 10)).toBe(100); });
  it("0 for num=0", () => { expect(pct(0, 5)).toBe(0); });
});

// ── getRating ──────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); });
  it("outstanding at 100", () => { expect(getRating(100)).toBe("outstanding"); });
  it("good >= 60", () => { expect(getRating(60)).toBe("good"); });
  it("good at 79", () => { expect(getRating(79)).toBe("good"); });
  it("requires_improvement >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(0)).toBe("inadequate"); });
  it("inadequate at 39", () => { expect(getRating(39)).toBe("inadequate"); });
});

// ── labels ─────────────────────────────────────────────────────────────────

describe("labels", () => {
  it("domain labels", () => {
    expect(getQualityDomainLabel("safety_welfare")).toBe("Safety & Welfare");
    expect(getQualityDomainLabel("education_learning")).toBe("Education & Learning");
    expect(getQualityDomainLabel("health_wellbeing")).toBe("Health & Wellbeing");
    expect(getQualityDomainLabel("positive_relationships")).toBe("Positive Relationships");
    expect(getQualityDomainLabel("protection_children")).toBe("Protection of Children");
    expect(getQualityDomainLabel("leadership_management")).toBe("Leadership & Management");
    expect(getQualityDomainLabel("outcomes_progress")).toBe("Outcomes & Progress");
    expect(getQualityDomainLabel("child_voice")).toBe("Child Voice");
  });
  it("outcome labels", () => {
    expect(getReviewOutcomeLabel("exceeds_standard")).toBe("Exceeds Standard");
    expect(getReviewOutcomeLabel("meets_standard")).toBe("Meets Standard");
    expect(getReviewOutcomeLabel("partially_meets")).toBe("Partially Meets");
    expect(getReviewOutcomeLabel("does_not_meet")).toBe("Does Not Meet");
    expect(getReviewOutcomeLabel("not_assessed")).toBe("Not Assessed");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateReviewQuality ──────────────────────────────────────────────────

describe("evaluateReviewQuality", () => {
  it("zeros for empty", () => {
    const r = evaluateReviewQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalReviews).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("max 25 with perfect records", () => {
    const r = evaluateReviewQuality(Array.from({ length: 10 }, () => makeRecord()));
    expect(r.overallScore).toBe(25);
    expect(r.meetsStandardRate).toBe(100);
    expect(r.evidenceDocumentedRate).toBe(100);
    expect(r.childViewRate).toBe(100);
    expect(r.actionPlanRate).toBe(100);
  });
  it("meetsStandard counts exceeds and meets", () => {
    const s = [
      makeRecord({ outcome: "exceeds_standard" }),
      makeRecord({ outcome: "meets_standard" }),
      makeRecord({ outcome: "partially_meets" }),
      makeRecord({ outcome: "does_not_meet" }),
    ];
    expect(evaluateReviewQuality(s).meetsStandardRate).toBe(50);
  });
  it("evidence documented rate", () => {
    const s = [makeRecord({ evidenceDocumented: true }), makeRecord({ evidenceDocumented: false })];
    expect(evaluateReviewQuality(s).evidenceDocumentedRate).toBe(50);
  });
  it("child view rate", () => {
    const s = [makeRecord({ childViewCaptured: true }), makeRecord({ childViewCaptured: false }), makeRecord({ childViewCaptured: false })];
    expect(evaluateReviewQuality(s).childViewRate).toBe(33);
  });
  it("action plan rate", () => {
    const s = [makeRecord({ actionPlanCreated: true }), makeRecord({ actionPlanCreated: true }), makeRecord({ actionPlanCreated: false })];
    expect(evaluateReviewQuality(s).actionPlanRate).toBe(67);
  });
  it("caps at 25", () => {
    expect(evaluateReviewQuality(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25);
  });
  it("rating outstanding when score 25", () => {
    expect(evaluateReviewQuality(Array.from({ length: 5 }, () => makeRecord())).rating).toBe("outstanding");
  });
  it("rating inadequate when all poor", () => {
    const s = [makeRecord({ outcome: "does_not_meet", evidenceDocumented: false, childViewCaptured: false, actionPlanCreated: false })];
    expect(evaluateReviewQuality(s).rating).toBe("inadequate");
  });
  it("partial scoring", () => {
    const s = [
      makeRecord({ outcome: "meets_standard", childViewCaptured: true }),
      makeRecord({ outcome: "does_not_meet", childViewCaptured: false }),
    ];
    const r = evaluateReviewQuality(s);
    expect(r.overallScore).toBe(19);
  });
});

// ── evaluateReviewCompliance ───────────────────────────────────────────────

describe("evaluateReviewCompliance", () => {
  it("zeros for empty", () => {
    expect(evaluateReviewCompliance([]).overallScore).toBe(0);
  });
  it("max 25 with full diversity", () => {
    const domains: QualityDomain[] = ["safety_welfare", "education_learning", "health_wellbeing", "positive_relationships", "protection_children", "leadership_management", "outcomes_progress", "child_voice"];
    const r = evaluateReviewCompliance(domains.map((d) => makeRecord({ domain: d })));
    expect(r.overallScore).toBe(25);
    expect(r.domainDiversityRatio).toBe(100);
  });
  it("followUp rate", () => {
    const s = [makeRecord({ followUpCompleted: true }), makeRecord({ followUpCompleted: false })];
    expect(evaluateReviewCompliance(s).followUpRate).toBe(50);
  });
  it("regulatory aligned rate", () => {
    const s = [makeRecord({ regulatoryAligned: true }), makeRecord({ regulatoryAligned: false }), makeRecord({ regulatoryAligned: false })];
    expect(evaluateReviewCompliance(s).regulatoryAlignedRate).toBe(33);
  });
  it("improvement rate", () => {
    const s = [makeRecord({ improvementIdentified: true }), makeRecord({ improvementIdentified: false })];
    expect(evaluateReviewCompliance(s).improvementRate).toBe(50);
  });
  it("diversity 2/8=25%", () => {
    const s = [makeRecord({ domain: "safety_welfare" }), makeRecord({ domain: "education_learning" }), makeRecord({ domain: "safety_welfare" })];
    expect(evaluateReviewCompliance(s).domainDiversityRatio).toBe(25);
  });
  it("caps at 25", () => {
    const domains: QualityDomain[] = ["safety_welfare", "education_learning", "health_wellbeing", "positive_relationships", "protection_children", "leadership_management", "outcomes_progress", "child_voice"];
    expect(evaluateReviewCompliance(domains.map((d) => makeRecord({ domain: d }))).overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateQualityPolicy ──────────────────────────────────────────────────

describe("evaluateQualityPolicy", () => {
  it("null gives 0", () => {
    const r = evaluateQualityPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.qualityAssuranceFramework).toBe(false);
    expect(r.rating).toBe("inadequate");
  });
  it("all true gives 25", () => {
    expect(evaluateQualityPolicy(makePolicy()).overallScore).toBe(25);
  });
  it("first 4 at 4pts each", () => {
    expect(evaluateQualityPolicy(makePolicy({ childParticipationStrategy: false, auditSchedule: false, feedbackMechanism: false })).overallScore).toBe(16);
  });
  it("last 3 at 3pts each", () => {
    expect(evaluateQualityPolicy(makePolicy({ qualityAssuranceFramework: false, reg45ReviewSchedule: false, continuousImprovementPlan: false, outcomesMeasurementPolicy: false })).overallScore).toBe(9);
  });
  it("all false gives 0", () => {
    expect(evaluateQualityPolicy(makePolicy({ qualityAssuranceFramework: false, reg45ReviewSchedule: false, continuousImprovementPlan: false, outcomesMeasurementPolicy: false, childParticipationStrategy: false, auditSchedule: false, feedbackMechanism: false })).overallScore).toBe(0);
  });
  it("mirrors booleans", () => {
    const r = evaluateQualityPolicy(makePolicy({ qualityAssuranceFramework: false }));
    expect(r.qualityAssuranceFramework).toBe(false);
    expect(r.reg45ReviewSchedule).toBe(true);
  });
  it("single 4pt boolean = 4", () => {
    expect(evaluateQualityPolicy(makePolicy({ qualityAssuranceFramework: true, reg45ReviewSchedule: false, continuousImprovementPlan: false, outcomesMeasurementPolicy: false, childParticipationStrategy: false, auditSchedule: false, feedbackMechanism: false })).overallScore).toBe(4);
  });
  it("single 3pt boolean = 3", () => {
    expect(evaluateQualityPolicy(makePolicy({ qualityAssuranceFramework: false, reg45ReviewSchedule: false, continuousImprovementPlan: false, outcomesMeasurementPolicy: false, childParticipationStrategy: true, auditSchedule: false, feedbackMechanism: false })).overallScore).toBe(3);
  });
  it("outstanding rating when full", () => {
    expect(evaluateQualityPolicy(makePolicy()).rating).toBe("outstanding");
  });
});

// ── evaluateStaffQualityReadiness ──────────────────────────────────────────

describe("evaluateStaffQualityReadiness", () => {
  it("zeros for empty", () => {
    const r = evaluateStaffQualityReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("25 fully trained", () => {
    expect(evaluateStaffQualityReadiness([makeTraining()]).overallScore).toBe(25);
  });
  it("partial — qualityAssurance only = 6", () => {
    const t = makeTraining({ qualityAssuranceSkills: true, outcomesMonitoring: false, regulatoryKnowledge: false, reflectivePractice: false, dataAnalysis: false, childParticipation: false });
    expect(evaluateStaffQualityReadiness([t]).overallScore).toBe(6);
  });
  it("partial — childParticipation only = 2", () => {
    const t = makeTraining({ qualityAssuranceSkills: false, outcomesMonitoring: false, regulatoryKnowledge: false, reflectivePractice: false, dataAnalysis: false, childParticipation: true });
    expect(evaluateStaffQualityReadiness([t]).overallScore).toBe(2);
  });
  it("partial — outcomesMonitoring only = 5", () => {
    const t = makeTraining({ qualityAssuranceSkills: false, outcomesMonitoring: true, regulatoryKnowledge: false, reflectivePractice: false, dataAnalysis: false, childParticipation: false });
    expect(evaluateStaffQualityReadiness([t]).overallScore).toBe(5);
  });
  it("partial — dataAnalysis only = 3", () => {
    const t = makeTraining({ qualityAssuranceSkills: false, outcomesMonitoring: false, regulatoryKnowledge: false, reflectivePractice: false, dataAnalysis: true, childParticipation: false });
    expect(evaluateStaffQualityReadiness([t]).overallScore).toBe(3);
  });
  it("mixed rates", () => {
    const t1 = makeTraining({ qualityAssuranceSkills: true, outcomesMonitoring: false, regulatoryKnowledge: false, reflectivePractice: false, dataAnalysis: false, childParticipation: false });
    const t2 = makeTraining({ qualityAssuranceSkills: false, outcomesMonitoring: true, regulatoryKnowledge: false, reflectivePractice: false, dataAnalysis: false, childParticipation: false });
    const r = evaluateStaffQualityReadiness([t1, t2]);
    expect(r.qualityAssuranceRate).toBe(50);
    expect(r.outcomesMonitoringRate).toBe(50);
    expect(r.regulatoryKnowledgeRate).toBe(0);
  });
  it("totalStaff count", () => {
    expect(evaluateStaffQualityReadiness([makeTraining(), makeTraining(), makeTraining()]).totalStaff).toBe(3);
  });
  it("outstanding when fully trained", () => {
    expect(evaluateStaffQualityReadiness([makeTraining()]).rating).toBe("outstanding");
  });
});

// ── buildChildQualityProfiles ──────────────────────────────────────────────

describe("buildChildQualityProfiles", () => {
  it("empty gives []", () => { expect(buildChildQualityProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const s = [makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c2", childName: "B" })];
    const p = buildChildQualityProfiles(s);
    expect(p).toHaveLength(2);
    expect(p[0].totalReviews).toBe(2);
  });
  it("caps at 10", () => {
    const domains: QualityDomain[] = ["safety_welfare", "education_learning", "health_wellbeing", "positive_relationships", "protection_children"];
    const s = Array.from({ length: 12 }, (_, i) => makeRecord({ childId: "c1", childName: "A", domain: domains[i % domains.length] }));
    expect(buildChildQualityProfiles(s)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("freq scoring: 3 → 0", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", outcome: "does_not_meet", childViewCaptured: false, domain: "safety_welfare" }));
    expect(buildChildQualityProfiles(mk(3))[0].overallScore).toBe(0);
  });
  it("freq scoring: 5 → 1", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", outcome: "does_not_meet", childViewCaptured: false, domain: "safety_welfare" }));
    expect(buildChildQualityProfiles(mk(5))[0].overallScore).toBe(1);
  });
  it("freq scoring: 10 → 2", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", outcome: "does_not_meet", childViewCaptured: false, domain: "safety_welfare" }));
    expect(buildChildQualityProfiles(mk(10))[0].overallScore).toBe(2);
  });
  it("diversity: 4 domains → 2", () => {
    const domains: QualityDomain[] = ["safety_welfare", "education_learning", "health_wellbeing", "positive_relationships"];
    const s = domains.map((d) => makeRecord({ childId: "c1", childName: "A", outcome: "does_not_meet", childViewCaptured: false, domain: d }));
    expect(buildChildQualityProfiles(s)[0].overallScore).toBe(2);
  });
  it("perfect child gets 10", () => {
    const domains: QualityDomain[] = ["safety_welfare", "education_learning", "health_wellbeing", "positive_relationships", "protection_children"];
    const s = Array.from({ length: 10 }, (_, i) => makeRecord({ childId: "c1", childName: "A", domain: domains[i % domains.length] }));
    expect(buildChildQualityProfiles(s)[0].overallScore).toBe(10);
  });
  it("meetsStandardRate tracked", () => {
    const s = [
      makeRecord({ childId: "c1", childName: "A", outcome: "meets_standard" }),
      makeRecord({ childId: "c1", childName: "A", outcome: "does_not_meet" }),
    ];
    expect(buildChildQualityProfiles(s)[0].meetsStandardRate).toBe(50);
  });
  it("domainsCovered lists unique domains", () => {
    const s = [
      makeRecord({ childId: "c1", childName: "A", domain: "safety_welfare" }),
      makeRecord({ childId: "c1", childName: "A", domain: "education_learning" }),
      makeRecord({ childId: "c1", childName: "A", domain: "safety_welfare" }),
    ];
    const p = buildChildQualityProfiles(s)[0];
    expect(p.domainsCovered).toContain("safety_welfare");
    expect(p.domainsCovered).toContain("education_learning");
    expect(p.domainsCovered).toHaveLength(2);
  });
});

// ── generateQualityOfCareIntelligence ──────────────────────────────────────

describe("generateQualityOfCareIntelligence", () => {
  it("complete result", () => {
    const domains: QualityDomain[] = ["safety_welfare", "education_learning", "health_wellbeing", "positive_relationships", "protection_children", "leadership_management", "outcomes_progress", "child_voice"];
    const s = domains.map((d, i) => makeRecord({ childId: i < 4 ? "c1" : "c2", childName: i < 4 ? "A" : "B", domain: d }));
    const r = generateQualityOfCareIntelligence(s, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.homeId).toBe("oak-house");
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.regulatoryLinks).toHaveLength(7);
  });
  it("100 perfect", () => {
    const domains: QualityDomain[] = ["safety_welfare", "education_learning", "health_wellbeing", "positive_relationships", "protection_children", "leadership_management", "outcomes_progress", "child_voice"];
    const r = generateQualityOfCareIntelligence(domains.map((d) => makeRecord({ domain: d })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("0 empty", () => {
    const r = generateQualityOfCareIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("URGENT actions", () => {
    const r = generateQualityOfCareIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.filter((a) => a.startsWith("URGENT")).length).toBe(2);
  });
  it("strengths when >=80%", () => {
    const domains: QualityDomain[] = ["safety_welfare", "education_learning", "health_wellbeing", "positive_relationships", "protection_children", "leadership_management", "outcomes_progress", "child_voice"];
    const r = generateQualityOfCareIntelligence(domains.map((d) => makeRecord({ domain: d })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("improvements when <60%", () => {
    const s = [makeRecord({ outcome: "does_not_meet", evidenceDocumented: false, childViewCaptured: false, actionPlanCreated: false, followUpCompleted: false, regulatoryAligned: false, improvementIdentified: false })];
    const r = generateQualityOfCareIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("child view action when rate low", () => {
    const s = [makeRecord({ childViewCaptured: false })];
    const r = generateQualityOfCareIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.toLowerCase().includes("child") && a.toLowerCase().includes("voice"))).toBe(true);
  });
  it("child profiles included", () => {
    const s = [makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c2", childName: "B" })];
    const r = generateQualityOfCareIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.childProfiles).toHaveLength(2);
  });
  it("periodStart and periodEnd stored", () => {
    const r = generateQualityOfCareIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-06-01");
  });
  it("regulatory links reference correct legislation", () => {
    const r = generateQualityOfCareIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 45"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 13"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act"))).toBe(true);
  });
  it("overallScore capped at 100", () => {
    const r = generateQualityOfCareIntelligence(Array.from({ length: 20 }, () => makeRecord()), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("domain diversity action when coverage narrow", () => {
    const s = [makeRecord({ domain: "safety_welfare" })];
    const r = generateQualityOfCareIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.toLowerCase().includes("domain") || a.toLowerCase().includes("coverage"))).toBe(true);
  });
});
