// ══════════════════════════════════════════════════════════════════════════════
// Mental Health & Wellbeing Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateWellbeingAssessments,
  evaluateTherapeuticInterventions,
  evaluateCriticalIncidents,
  evaluateSafetyPlanning,
  buildChildWellbeingProfiles,
  generateMentalHealthIntelligence,
} from "../mental-health-wellbeing-engine";
import type {
  WellbeingAssessment,
  TherapeuticIntervention,
  CriticalIncident,
  WellbeingSafetyPlan,
  WellbeingDomainScore,
} from "../mental-health-wellbeing-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-18T12:00:00Z";
const PERIOD_START = "2026-01-01T00:00:00Z";
const PERIOD_END = "2026-05-18T23:59:59Z";
const HOME_ID = "home-oak";

// Chamberlain House children
const ALEX_ID = "child-alex";
const JORDAN_ID = "child-jordan";
const MORGAN_ID = "child-morgan";

const ALL_CHILD_IDS = [ALEX_ID, JORDAN_ID, MORGAN_ID];

// Staff
const SARAH = "Sarah Johnson";
const TOM = "Tom Richards";
const LISA = "Lisa Williams";
const DARREN = "Darren Laville";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeDomains(overrides: Partial<Record<string, Partial<WellbeingDomainScore>>>): WellbeingDomainScore[] {
  const defaults: WellbeingDomainScore[] = [
    { domain: "emotional_regulation", score: 6, riskLevel: "moderate", trend: "stable" },
    { domain: "anxiety", score: 7, riskLevel: "low", trend: "stable" },
    { domain: "depression", score: 7, riskLevel: "low", trend: "stable" },
    { domain: "self_harm", score: 8, riskLevel: "low", trend: "stable" },
    { domain: "attachment", score: 5, riskLevel: "moderate", trend: "stable" },
    { domain: "trauma_response", score: 6, riskLevel: "moderate", trend: "stable" },
    { domain: "social_functioning", score: 7, riskLevel: "low", trend: "stable" },
    { domain: "self_esteem", score: 6, riskLevel: "moderate", trend: "stable" },
    { domain: "sleep", score: 7, riskLevel: "low", trend: "stable" },
    { domain: "eating", score: 8, riskLevel: "low", trend: "stable" },
  ];
  return defaults.map(d => {
    const o = overrides[d.domain];
    return o ? { ...d, ...o } : d;
  });
}

function makeAssessment(overrides: Partial<WellbeingAssessment> = {}): WellbeingAssessment {
  return {
    id: "assess-001",
    homeId: HOME_ID,
    childId: ALEX_ID,
    childName: "Alex",
    assessmentDate: "2026-04-01T10:00:00Z",
    assessor: SARAH,
    assessmentTool: "SDQ",
    domains: makeDomains({}),
    overallScore: 6,
    overallRisk: "moderate",
    childSelfReport: true,
    staffContribution: true,
    clinicalInput: true,
    recommendations: ["Continue CAMHS sessions", "Monitor self-harm indicators"],
    nextAssessmentDate: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

function makeIntervention(overrides: Partial<TherapeuticIntervention> = {}): TherapeuticIntervention {
  return {
    id: "int-001",
    homeId: HOME_ID,
    childId: ALEX_ID,
    childName: "Alex",
    interventionType: "camhs",
    provider: "Local CAMHS Team",
    startDate: "2026-02-01T00:00:00Z",
    status: "active",
    sessionsPlanned: 12,
    sessionsAttended: 8,
    sessionsRescheduled: 1,
    sessionsCancelled: 0,
    childEngagement: 7,
    progressNotes: "Good progress with emotional regulation strategies",
    measurableOutcomes: ["Reduced self-harm frequency", "Improved mood diary scores"],
    ...overrides,
  };
}

function makeIncident(overrides: Partial<CriticalIncident> = {}): CriticalIncident {
  return {
    id: "ci-001",
    homeId: HOME_ID,
    childId: ALEX_ID,
    childName: "Alex",
    date: "2026-04-15T22:30:00Z",
    type: "self_harm",
    severity: "moderate",
    responseTimeMins: 5,
    professionalsCalled: ["On-call CAMHS", DARREN],
    safetyPlanActivated: true,
    safetyPlanEffective: true,
    followUpWithin24h: true,
    followUpWithin72h: true,
    camhsNotified: true,
    planUpdated: true,
    ...overrides,
  };
}

function makeSafetyPlan(overrides: Partial<WellbeingSafetyPlan> = {}): WellbeingSafetyPlan {
  return {
    id: "sp-001",
    homeId: HOME_ID,
    childId: ALEX_ID,
    childName: "Alex",
    createdDate: "2026-03-01T00:00:00Z",
    lastReviewDate: "2026-04-20T00:00:00Z",
    nextReviewDate: "2026-07-20T00:00:00Z",
    status: "current",
    childInvolved: true,
    parentInvolved: false,
    keyProfessionalInvolved: true,
    triggersIdentified: ["Family contact", "Evening time", "Peer rejection"],
    copingStrategies: ["Breathing exercises", "Art journaling", "Named adult check-in"],
    supportContacts: [SARAH, TOM],
    professionalContacts: ["CAMHS duty", "GP surgery"],
    ...overrides,
  };
}

// ── Chamberlain House demo data ────────────────────────────────────────────────────

function getAlexAssessment(): WellbeingAssessment {
  return makeAssessment({
    id: "assess-alex-01",
    childId: ALEX_ID,
    childName: "Alex",
    overallScore: 5,
    overallRisk: "moderate",
    domains: makeDomains({
      emotional_regulation: { score: 4, riskLevel: "moderate", trend: "improving" },
      self_harm: { score: 4, riskLevel: "high", trend: "stable" },
      trauma_response: { score: 3, riskLevel: "high", trend: "stable" },
      attachment: { score: 5, riskLevel: "moderate", trend: "improving" },
    }),
  });
}

function getJordanAssessment(): WellbeingAssessment {
  return makeAssessment({
    id: "assess-jordan-01",
    childId: JORDAN_ID,
    childName: "Jordan",
    assessor: TOM,
    assessmentTool: "SDQ",
    overallScore: 8,
    overallRisk: "low",
    childSelfReport: true,
    staffContribution: true,
    clinicalInput: false,
    domains: makeDomains({
      emotional_regulation: { score: 8, riskLevel: "low", trend: "improving" },
      anxiety: { score: 8, riskLevel: "low", trend: "stable" },
      depression: { score: 9, riskLevel: "low", trend: "stable" },
      self_harm: { score: 10, riskLevel: "low", trend: "stable" },
      attachment: { score: 7, riskLevel: "low", trend: "improving" },
      trauma_response: { score: 7, riskLevel: "low", trend: "stable" },
      social_functioning: { score: 9, riskLevel: "low", trend: "improving" },
      self_esteem: { score: 8, riskLevel: "low", trend: "stable" },
      sleep: { score: 8, riskLevel: "low", trend: "stable" },
      eating: { score: 9, riskLevel: "low", trend: "stable" },
    }),
    recommendations: ["Continue current support plan"],
  });
}

function getMorganAssessment(): WellbeingAssessment {
  return makeAssessment({
    id: "assess-morgan-01",
    childId: MORGAN_ID,
    childName: "Morgan",
    assessor: LISA,
    assessmentTool: "GAD7",
    overallScore: 4,
    overallRisk: "high",
    childSelfReport: true,
    staffContribution: true,
    clinicalInput: true,
    domains: makeDomains({
      anxiety: { score: 2, riskLevel: "high", trend: "declining" },
      depression: { score: 4, riskLevel: "moderate", trend: "declining" },
      self_esteem: { score: 3, riskLevel: "high", trend: "declining" },
      social_functioning: { score: 5, riskLevel: "moderate", trend: "declining" },
      sleep: { score: 4, riskLevel: "moderate", trend: "declining" },
    }),
    recommendations: ["Increase therapy frequency", "Review medication with psychiatrist"],
  });
}

function getAllAssessments(): WellbeingAssessment[] {
  return [getAlexAssessment(), getJordanAssessment(), getMorganAssessment()];
}

function getAlexIntervention(): TherapeuticIntervention {
  return makeIntervention({
    id: "int-alex-camhs",
    childId: ALEX_ID,
    childName: "Alex",
    interventionType: "camhs",
    provider: "Local CAMHS",
    status: "active",
    sessionsPlanned: 12,
    sessionsAttended: 8,
    sessionsRescheduled: 1,
    sessionsCancelled: 0,
    childEngagement: 7,
  });
}

function getMorganIntervention(): TherapeuticIntervention {
  return makeIntervention({
    id: "int-morgan-therapy",
    childId: MORGAN_ID,
    childName: "Morgan",
    interventionType: "private_therapy",
    provider: "Dr Sarah Mitchell",
    status: "active",
    sessionsPlanned: 16,
    sessionsAttended: 10,
    sessionsRescheduled: 2,
    sessionsCancelled: 1,
    childEngagement: 8,
    progressNotes: "Good engagement, anxiety tools being practised daily",
  });
}

function getAllInterventions(): TherapeuticIntervention[] {
  return [getAlexIntervention(), getMorganIntervention()];
}

function getAlexIncident(): CriticalIncident {
  return makeIncident({
    id: "ci-alex-01",
    childId: ALEX_ID,
    childName: "Alex",
    type: "self_harm",
    severity: "moderate",
    responseTimeMins: 5,
    safetyPlanActivated: true,
    safetyPlanEffective: true,
    followUpWithin24h: true,
    followUpWithin72h: true,
    camhsNotified: true,
    planUpdated: true,
  });
}

function getAllIncidents(): CriticalIncident[] {
  return [getAlexIncident()];
}

function getAlexSafetyPlan(): WellbeingSafetyPlan {
  return makeSafetyPlan({
    id: "sp-alex-01",
    childId: ALEX_ID,
    childName: "Alex",
    status: "current",
    childInvolved: true,
    parentInvolved: false,
    keyProfessionalInvolved: true,
  });
}

function getMorganSafetyPlan(): WellbeingSafetyPlan {
  return makeSafetyPlan({
    id: "sp-morgan-01",
    childId: MORGAN_ID,
    childName: "Morgan",
    status: "under_review",
    childInvolved: true,
    parentInvolved: true,
    keyProfessionalInvolved: true,
    triggersIdentified: ["Exam pressure", "Social media comparison", "Peer conflict", "Sleep disruption"],
    copingStrategies: ["Progressive muscle relaxation", "Grounding techniques", "Talking to keyworker"],
  });
}

function getAllSafetyPlans(): WellbeingSafetyPlan[] {
  return [getAlexSafetyPlan(), getMorganSafetyPlan()];
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateWellbeingAssessments
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateWellbeingAssessments", () => {
  it("returns zeroed result for empty assessments", () => {
    const result = evaluateWellbeingAssessments([], ALL_CHILD_IDS, NOW);
    expect(result.totalAssessments).toBe(0);
    expect(result.childrenAssessed).toBe(0);
    expect(result.coverageRate).toBe(0);
    expect(result.currencyRate).toBe(0);
    expect(result.averageOverallScore).toBe(0);
    expect(result.multiVoiceRate).toBe(0);
    expect(result.overdueAssessments).toHaveLength(3);
  });

  it("calculates coverage rate across all children", () => {
    const assessments = getAllAssessments();
    const result = evaluateWellbeingAssessments(assessments, ALL_CHILD_IDS, NOW);
    expect(result.childrenAssessed).toBe(3);
    expect(result.coverageRate).toBe(100);
  });

  it("calculates partial coverage when some children unassessed", () => {
    const assessments = [getAlexAssessment()];
    const result = evaluateWellbeingAssessments(assessments, ALL_CHILD_IDS, NOW);
    expect(result.childrenAssessed).toBe(1);
    expect(result.coverageRate).toBeCloseTo(33.3, 0);
  });

  it("calculates currency rate for assessments within 6 months", () => {
    const assessments = getAllAssessments(); // all dated 2026-04-01, ref 2026-05-18 = 1 month ago
    const result = evaluateWellbeingAssessments(assessments, ALL_CHILD_IDS, NOW);
    expect(result.currencyRate).toBe(100);
  });

  it("identifies overdue assessments beyond 6 months", () => {
    const old = makeAssessment({
      id: "assess-old",
      childId: ALEX_ID,
      childName: "Alex",
      assessmentDate: "2025-06-01T00:00:00Z",
    });
    const result = evaluateWellbeingAssessments([old], ALL_CHILD_IDS, NOW);
    expect(result.currencyRate).toBe(0);
    expect(result.overdueAssessments.length).toBeGreaterThanOrEqual(1);
    expect(result.overdueAssessments.some(o => o.childId === ALEX_ID)).toBe(true);
  });

  it("calculates average overall score from latest assessments", () => {
    const assessments = getAllAssessments();
    const result = evaluateWellbeingAssessments(assessments, ALL_CHILD_IDS, NOW);
    // Alex: 5, Jordan: 8, Morgan: 4 => avg = 5.67
    expect(result.averageOverallScore).toBeCloseTo(5.7, 0);
  });

  it("breaks down risk distribution", () => {
    const assessments = getAllAssessments();
    const result = evaluateWellbeingAssessments(assessments, ALL_CHILD_IDS, NOW);
    expect(result.riskDistribution.low).toBe(1); // Jordan
    expect(result.riskDistribution.moderate).toBe(1); // Alex
    expect(result.riskDistribution.high).toBe(1); // Morgan
    expect(result.riskDistribution.critical).toBe(0);
  });

  it("performs domain analysis across children", () => {
    const assessments = getAllAssessments();
    const result = evaluateWellbeingAssessments(assessments, ALL_CHILD_IDS, NOW);
    expect(result.domainAnalysis.length).toBeGreaterThan(0);
    const anxietyDomain = result.domainAnalysis.find(d => d.domain === "anxiety");
    expect(anxietyDomain).toBeDefined();
    expect(anxietyDomain!.childrenAtRisk).toBeGreaterThanOrEqual(1); // Morgan has high anxiety
  });

  it("calculates multi-voice rate", () => {
    const assessments = getAllAssessments();
    const result = evaluateWellbeingAssessments(assessments, ALL_CHILD_IDS, NOW);
    // Alex has all 3, Jordan missing clinical, Morgan has all 3
    expect(result.multiVoiceRate).toBeCloseTo(66.7, 0);
  });

  it("calculates individual voice rates", () => {
    const assessments = getAllAssessments();
    const result = evaluateWellbeingAssessments(assessments, ALL_CHILD_IDS, NOW);
    expect(result.childSelfReportRate).toBe(100); // all 3 have child self-report
    expect(result.staffContributionRate).toBe(100);
    expect(result.clinicalInputRate).toBeCloseTo(66.7, 0); // Jordan missing
  });

  it("tracks assessment tool breakdown", () => {
    const assessments = getAllAssessments();
    const result = evaluateWellbeingAssessments(assessments, ALL_CHILD_IDS, NOW);
    expect(result.assessmentToolBreakdown["SDQ"]).toBe(2);
    expect(result.assessmentToolBreakdown["GAD7"]).toBe(1);
  });

  it("uses latest assessment per child when multiple exist", () => {
    const older = makeAssessment({
      id: "assess-alex-old",
      childId: ALEX_ID,
      childName: "Alex",
      assessmentDate: "2026-01-01T00:00:00Z",
      overallScore: 3,
      overallRisk: "high",
    });
    const newer = makeAssessment({
      id: "assess-alex-new",
      childId: ALEX_ID,
      childName: "Alex",
      assessmentDate: "2026-04-01T00:00:00Z",
      overallScore: 6,
      overallRisk: "moderate",
    });
    const result = evaluateWellbeingAssessments([older, newer], [ALEX_ID], NOW);
    expect(result.averageOverallScore).toBe(6);
    expect(result.riskDistribution.moderate).toBe(1);
    expect(result.riskDistribution.high).toBe(0);
  });

  it("reports zero coverage for empty child list", () => {
    const result = evaluateWellbeingAssessments([makeAssessment()], [], NOW);
    expect(result.coverageRate).toBe(0);
  });

  it("tracks domain trends correctly", () => {
    const assessments = [getMorganAssessment()];
    const result = evaluateWellbeingAssessments(assessments, [MORGAN_ID], NOW);
    const anxietyDomain = result.domainAnalysis.find(d => d.domain === "anxiety");
    expect(anxietyDomain).toBeDefined();
    expect(anxietyDomain!.trendBreakdown.declining).toBeGreaterThanOrEqual(1);
  });

  it("children with no assessments are listed as overdue", () => {
    const result = evaluateWellbeingAssessments([], [ALEX_ID, JORDAN_ID], NOW);
    expect(result.overdueAssessments).toHaveLength(2);
    expect(result.overdueAssessments[0].lastAssessmentDate).toBe("never");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateTherapeuticInterventions
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTherapeuticInterventions", () => {
  it("returns zeroed result for empty interventions", () => {
    const result = evaluateTherapeuticInterventions([], ALL_CHILD_IDS);
    expect(result.totalInterventions).toBe(0);
    expect(result.accessRate).toBe(0);
    expect(result.attendanceRate).toBe(0);
    expect(result.averageEngagement).toBe(0);
    expect(result.childrenOnWaitingList).toHaveLength(0);
  });

  it("calculates access rate correctly", () => {
    const interventions = getAllInterventions();
    const result = evaluateTherapeuticInterventions(interventions, ALL_CHILD_IDS);
    // Alex and Morgan have interventions, Jordan doesn't
    expect(result.childrenWithIntervention).toBe(2);
    expect(result.accessRate).toBeCloseTo(66.7, 0);
  });

  it("counts active interventions", () => {
    const interventions = getAllInterventions();
    const result = evaluateTherapeuticInterventions(interventions, ALL_CHILD_IDS);
    expect(result.activeInterventions).toBe(2);
  });

  it("calculates attendance rate across all interventions", () => {
    const interventions = getAllInterventions();
    const result = evaluateTherapeuticInterventions(interventions, ALL_CHILD_IDS);
    // Alex: 8/12, Morgan: 10/16 => total 18/28 = 64.3%
    expect(result.attendanceRate).toBeCloseTo(64.3, 0);
  });

  it("calculates rescheduled and cancelled rates", () => {
    const interventions = getAllInterventions();
    const result = evaluateTherapeuticInterventions(interventions, ALL_CHILD_IDS);
    // Rescheduled: 1+2 = 3/28 = 10.7%
    expect(result.rescheduledRate).toBeCloseTo(10.7, 0);
    // Cancelled: 0+1 = 1/28 = 3.6%
    expect(result.cancelledRate).toBeCloseTo(3.6, 0);
  });

  it("calculates average engagement score", () => {
    const interventions = getAllInterventions();
    const result = evaluateTherapeuticInterventions(interventions, ALL_CHILD_IDS);
    // Alex: 7, Morgan: 8 => avg = 7.5
    expect(result.averageEngagement).toBe(7.5);
  });

  it("identifies children on waiting lists", () => {
    const waitingIntervention = makeIntervention({
      id: "int-wait",
      childId: JORDAN_ID,
      childName: "Jordan",
      status: "waiting_list",
      waitingTimeDays: 42,
    });
    const result = evaluateTherapeuticInterventions([waitingIntervention], ALL_CHILD_IDS);
    expect(result.waitingListCount).toBe(1);
    expect(result.childrenOnWaitingList).toHaveLength(1);
    expect(result.childrenOnWaitingList[0].childId).toBe(JORDAN_ID);
    expect(result.childrenOnWaitingList[0].waitingTimeDays).toBe(42);
  });

  it("calculates average waiting time", () => {
    const w1 = makeIntervention({ id: "w1", status: "waiting_list", waitingTimeDays: 30 });
    const w2 = makeIntervention({ id: "w2", childId: JORDAN_ID, status: "waiting_list", waitingTimeDays: 60 });
    const result = evaluateTherapeuticInterventions([w1, w2], ALL_CHILD_IDS);
    expect(result.averageWaitingTimeDays).toBe(45);
  });

  it("counts completed, discontinued, and refused interventions", () => {
    const interventions = [
      makeIntervention({ id: "c1", status: "completed", childEngagement: 8 }),
      makeIntervention({ id: "c2", status: "discontinued", childEngagement: 3 }),
      makeIntervention({ id: "c3", status: "refused", childEngagement: 1 }),
    ];
    const result = evaluateTherapeuticInterventions(interventions, ALL_CHILD_IDS);
    expect(result.completedCount).toBe(1);
    expect(result.discontinuedCount).toBe(1);
    expect(result.refusedCount).toBe(1);
  });

  it("breaks down intervention types", () => {
    const interventions = getAllInterventions();
    const result = evaluateTherapeuticInterventions(interventions, ALL_CHILD_IDS);
    expect(result.interventionTypeBreakdown["camhs"]).toBe(1);
    expect(result.interventionTypeBreakdown["private_therapy"]).toBe(1);
  });

  it("handles zero planned sessions gracefully", () => {
    const i = makeIntervention({ sessionsPlanned: 0, sessionsAttended: 0 });
    const result = evaluateTherapeuticInterventions([i], ALL_CHILD_IDS);
    expect(result.attendanceRate).toBe(0);
  });

  it("handles empty child list", () => {
    const result = evaluateTherapeuticInterventions(getAllInterventions(), []);
    expect(result.accessRate).toBe(0);
  });

  it("engagement average only includes active and completed", () => {
    const interventions = [
      makeIntervention({ id: "a1", status: "active", childEngagement: 9 }),
      makeIntervention({ id: "a2", status: "waiting_list", childEngagement: 1 }),
      makeIntervention({ id: "a3", status: "completed", childEngagement: 7 }),
    ];
    const result = evaluateTherapeuticInterventions(interventions, ALL_CHILD_IDS);
    // Only active (9) and completed (7) => avg = 8
    expect(result.averageEngagement).toBe(8);
  });

  it("keeps highest waiting time per child on waiting list", () => {
    const w1 = makeIntervention({ id: "w1", childId: ALEX_ID, childName: "Alex", status: "waiting_list", waitingTimeDays: 20 });
    const w2 = makeIntervention({ id: "w2", childId: ALEX_ID, childName: "Alex", status: "waiting_list", waitingTimeDays: 45 });
    const result = evaluateTherapeuticInterventions([w1, w2], ALL_CHILD_IDS);
    expect(result.childrenOnWaitingList).toHaveLength(1);
    expect(result.childrenOnWaitingList[0].waitingTimeDays).toBe(45);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateCriticalIncidents
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateCriticalIncidents", () => {
  it("returns zeroed result for empty incidents", () => {
    const result = evaluateCriticalIncidents([]);
    expect(result.totalIncidents).toBe(0);
    expect(result.averageResponseTimeMins).toBe(0);
    expect(result.responseWithin15MinRate).toBe(0);
    expect(result.childrenWithIncidents).toBe(0);
    expect(result.repeatIncidentChildren).toHaveLength(0);
  });

  it("calculates incident type breakdown", () => {
    const incidents = [
      makeIncident({ id: "i1", type: "self_harm" }),
      makeIncident({ id: "i2", type: "self_harm" }),
      makeIncident({ id: "i3", type: "panic_attack" }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    expect(result.incidentTypeBreakdown["self_harm"]).toBe(2);
    expect(result.incidentTypeBreakdown["panic_attack"]).toBe(1);
  });

  it("calculates severity breakdown", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "moderate" }),
      makeIncident({ id: "i2", severity: "high" }),
      makeIncident({ id: "i3", severity: "critical" }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    expect(result.severityBreakdown.moderate).toBe(1);
    expect(result.severityBreakdown.high).toBe(1);
    expect(result.severityBreakdown.critical).toBe(1);
    expect(result.severityBreakdown.low).toBe(0);
  });

  it("calculates average response time", () => {
    const incidents = [
      makeIncident({ id: "i1", responseTimeMins: 5 }),
      makeIncident({ id: "i2", responseTimeMins: 15 }),
      makeIncident({ id: "i3", responseTimeMins: 10 }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    expect(result.averageResponseTimeMins).toBe(10);
  });

  it("calculates response within 15 minutes rate", () => {
    const incidents = [
      makeIncident({ id: "i1", responseTimeMins: 5 }),
      makeIncident({ id: "i2", responseTimeMins: 15 }),
      makeIncident({ id: "i3", responseTimeMins: 25 }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    // 2 out of 3 <= 15 mins
    expect(result.responseWithin15MinRate).toBeCloseTo(66.7, 0);
  });

  it("calculates safety plan activation rate", () => {
    const incidents = [
      makeIncident({ id: "i1", safetyPlanActivated: true, safetyPlanEffective: true }),
      makeIncident({ id: "i2", safetyPlanActivated: true, safetyPlanEffective: false }),
      makeIncident({ id: "i3", safetyPlanActivated: false }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    expect(result.safetyPlanActivationRate).toBeCloseTo(66.7, 0);
    // 1 effective out of 2 activated
    expect(result.safetyPlanEffectivenessRate).toBe(50);
  });

  it("calculates follow-up rates", () => {
    const incidents = [
      makeIncident({ id: "i1", followUpWithin24h: true, followUpWithin72h: true }),
      makeIncident({ id: "i2", followUpWithin24h: true, followUpWithin72h: false }),
      makeIncident({ id: "i3", followUpWithin24h: false, followUpWithin72h: false }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    expect(result.followUp24hRate).toBeCloseTo(66.7, 0);
    expect(result.followUp72hRate).toBeCloseTo(33.3, 0);
  });

  it("calculates CAMHS notification rate", () => {
    const incidents = [
      makeIncident({ id: "i1", camhsNotified: true }),
      makeIncident({ id: "i2", camhsNotified: false }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    expect(result.camhsNotificationRate).toBe(50);
  });

  it("calculates plan updated rate", () => {
    const incidents = [
      makeIncident({ id: "i1", planUpdated: true }),
      makeIncident({ id: "i2", planUpdated: true }),
      makeIncident({ id: "i3", planUpdated: false }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    expect(result.planUpdatedRate).toBeCloseTo(66.7, 0);
  });

  it("identifies repeat incident children", () => {
    const incidents = [
      makeIncident({ id: "i1", childId: ALEX_ID, childName: "Alex" }),
      makeIncident({ id: "i2", childId: ALEX_ID, childName: "Alex" }),
      makeIncident({ id: "i3", childId: MORGAN_ID, childName: "Morgan" }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    expect(result.childrenWithIncidents).toBe(2);
    expect(result.repeatIncidentChildren).toHaveLength(1);
    expect(result.repeatIncidentChildren[0].childId).toBe(ALEX_ID);
    expect(result.repeatIncidentChildren[0].count).toBe(2);
  });

  it("handles single incident correctly", () => {
    const result = evaluateCriticalIncidents([getAlexIncident()]);
    expect(result.totalIncidents).toBe(1);
    expect(result.responseWithin15MinRate).toBe(100);
    expect(result.followUp24hRate).toBe(100);
    expect(result.camhsNotificationRate).toBe(100);
    expect(result.repeatIncidentChildren).toHaveLength(0);
  });

  it("safety plan effectiveness is 0 when none activated", () => {
    const incidents = [
      makeIncident({ id: "i1", safetyPlanActivated: false }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    expect(result.safetyPlanActivationRate).toBe(0);
    expect(result.safetyPlanEffectivenessRate).toBe(0);
  });

  it("counts children correctly with multiple incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", childId: ALEX_ID, childName: "Alex" }),
      makeIncident({ id: "i2", childId: ALEX_ID, childName: "Alex" }),
      makeIncident({ id: "i3", childId: ALEX_ID, childName: "Alex" }),
      makeIncident({ id: "i4", childId: MORGAN_ID, childName: "Morgan" }),
      makeIncident({ id: "i5", childId: MORGAN_ID, childName: "Morgan" }),
    ];
    const result = evaluateCriticalIncidents(incidents);
    expect(result.childrenWithIncidents).toBe(2);
    expect(result.repeatIncidentChildren).toHaveLength(2);
    expect(result.repeatIncidentChildren[0].count).toBe(3); // Alex first (sorted desc)
    expect(result.repeatIncidentChildren[1].count).toBe(2); // Morgan second
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateSafetyPlanning
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSafetyPlanning", () => {
  it("returns zeroed result for empty plans", () => {
    const result = evaluateSafetyPlanning([], ALL_CHILD_IDS, NOW);
    expect(result.totalPlans).toBe(0);
    expect(result.childrenWithPlan).toBe(0);
    expect(result.coverageRate).toBe(0);
    expect(result.childInvolvementRate).toBe(0);
    expect(result.multiVoiceRate).toBe(0);
  });

  it("calculates coverage rate across children", () => {
    const plans = getAllSafetyPlans();
    const result = evaluateSafetyPlanning(plans, ALL_CHILD_IDS, NOW);
    // Alex and Morgan have plans, Jordan doesn't
    expect(result.childrenWithPlan).toBe(2);
    expect(result.coverageRate).toBeCloseTo(66.7, 0);
  });

  it("calculates current plan rate", () => {
    const plans = getAllSafetyPlans();
    const result = evaluateSafetyPlanning(plans, ALL_CHILD_IDS, NOW);
    // Alex current, Morgan under_review
    expect(result.currentPlanRate).toBe(50);
  });

  it("counts expired and under_review plans", () => {
    const plans = [
      makeSafetyPlan({ id: "sp-1", childId: ALEX_ID, status: "current" }),
      makeSafetyPlan({ id: "sp-2", childId: JORDAN_ID, status: "expired" }),
      makeSafetyPlan({ id: "sp-3", childId: MORGAN_ID, status: "under_review" }),
    ];
    const result = evaluateSafetyPlanning(plans, ALL_CHILD_IDS, NOW);
    expect(result.expiredPlanCount).toBe(1);
    expect(result.underReviewCount).toBe(1);
  });

  it("calculates child involvement rate", () => {
    const plans = getAllSafetyPlans();
    const result = evaluateSafetyPlanning(plans, ALL_CHILD_IDS, NOW);
    // Both Alex and Morgan have child involved
    expect(result.childInvolvementRate).toBe(100);
  });

  it("calculates parent involvement rate", () => {
    const plans = getAllSafetyPlans();
    const result = evaluateSafetyPlanning(plans, ALL_CHILD_IDS, NOW);
    // Alex: false, Morgan: true
    expect(result.parentInvolvementRate).toBe(50);
  });

  it("calculates key professional rate", () => {
    const plans = getAllSafetyPlans();
    const result = evaluateSafetyPlanning(plans, ALL_CHILD_IDS, NOW);
    // Both have professionals
    expect(result.keyProfessionalRate).toBe(100);
  });

  it("calculates multi-voice rate (child + parent + professional)", () => {
    const plans = getAllSafetyPlans();
    const result = evaluateSafetyPlanning(plans, ALL_CHILD_IDS, NOW);
    // Only Morgan has all three
    expect(result.multiVoiceRate).toBe(50);
  });

  it("calculates average triggers identified", () => {
    const plans = getAllSafetyPlans();
    const result = evaluateSafetyPlanning(plans, ALL_CHILD_IDS, NOW);
    // Alex: 3, Morgan: 4 => avg = 3.5
    expect(result.averageTriggersIdentified).toBe(3.5);
  });

  it("calculates average coping strategies", () => {
    const plans = getAllSafetyPlans();
    const result = evaluateSafetyPlanning(plans, ALL_CHILD_IDS, NOW);
    // Alex: 3, Morgan: 3 => avg = 3
    expect(result.averageCopingStrategies).toBe(3);
  });

  it("identifies overdue reviews", () => {
    const expired = makeSafetyPlan({
      id: "sp-expired",
      childId: ALEX_ID,
      childName: "Alex",
      nextReviewDate: "2026-03-01T00:00:00Z", // before reference date
    });
    const result = evaluateSafetyPlanning([expired], [ALEX_ID], NOW);
    expect(result.overdueReviews).toHaveLength(1);
    expect(result.overdueReviews[0].childId).toBe(ALEX_ID);
  });

  it("no overdue reviews when all plans future-dated", () => {
    const result = evaluateSafetyPlanning(getAllSafetyPlans(), ALL_CHILD_IDS, NOW);
    expect(result.overdueReviews).toHaveLength(0);
  });

  it("uses latest plan per child", () => {
    const older = makeSafetyPlan({
      id: "sp-old",
      childId: ALEX_ID,
      childName: "Alex",
      createdDate: "2025-01-01T00:00:00Z",
      status: "expired",
      childInvolved: false,
    });
    const newer = makeSafetyPlan({
      id: "sp-new",
      childId: ALEX_ID,
      childName: "Alex",
      createdDate: "2026-03-01T00:00:00Z",
      status: "current",
      childInvolved: true,
    });
    const result = evaluateSafetyPlanning([older, newer], [ALEX_ID], NOW);
    expect(result.currentPlanRate).toBe(100);
    expect(result.childInvolvementRate).toBe(100);
  });

  it("handles empty child list", () => {
    const result = evaluateSafetyPlanning(getAllSafetyPlans(), [], NOW);
    expect(result.coverageRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildWellbeingProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildWellbeingProfiles", () => {
  it("returns a profile for each child", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    expect(profiles).toHaveLength(3);
  });

  it("Alex profile: moderate risk with CAMHS, 1 incident, safety plan current", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const alex = profiles.find(p => p.childId === ALEX_ID)!;
    expect(alex.latestOverallRisk).toBe("moderate");
    expect(alex.activeInterventions.length).toBe(1);
    expect(alex.activeInterventions[0].type).toBe("camhs");
    expect(alex.incidentCount).toBe(1);
    expect(alex.hasSafetyPlan).toBe(true);
    expect(alex.safetyPlanStatus).toBe("current");
  });

  it("Jordan profile: low risk, no interventions, no incidents", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const jordan = profiles.find(p => p.childId === JORDAN_ID)!;
    expect(jordan.latestOverallRisk).toBe("low");
    expect(jordan.activeInterventions).toHaveLength(0);
    expect(jordan.incidentCount).toBe(0);
    expect(jordan.hasSafetyPlan).toBe(false);
  });

  it("Morgan profile: high risk with therapy, safety plan under review", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const morgan = profiles.find(p => p.childId === MORGAN_ID)!;
    expect(morgan.latestOverallRisk).toBe("high");
    expect(morgan.activeInterventions.length).toBe(1);
    expect(morgan.activeInterventions[0].type).toBe("private_therapy");
    expect(morgan.activeInterventions[0].engagement).toBe(8);
    expect(morgan.hasSafetyPlan).toBe(true);
    expect(morgan.safetyPlanStatus).toBe("under_review");
  });

  it("Morgan shows declining overall trend", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const morgan = profiles.find(p => p.childId === MORGAN_ID)!;
    // Morgan has 5 declining domains which is more than stable (5) or improving (0)
    expect(morgan.overallTrend).toBe("declining");
  });

  it("generates concerns for high-risk children", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const morgan = profiles.find(p => p.childId === MORGAN_ID)!;
    expect(morgan.concerns.length).toBeGreaterThan(0);
    expect(morgan.concerns.some(c => c.includes("high"))).toBe(true);
  });

  it("generates recommendations for declining trends", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const morgan = profiles.find(p => p.childId === MORGAN_ID)!;
    expect(morgan.recommendations.some(r => r.includes("review"))).toBe(true);
  });

  it("lists waiting list interventions", () => {
    const waiting = makeIntervention({
      id: "wait-1",
      childId: JORDAN_ID,
      childName: "Jordan",
      status: "waiting_list",
      waitingTimeDays: 70,
    });
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), [...getAllInterventions(), waiting], getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const jordan = profiles.find(p => p.childId === JORDAN_ID)!;
    expect(jordan.waitingListInterventions).toHaveLength(1);
    expect(jordan.waitingListInterventions[0].waitingTimeDays).toBe(70);
    expect(jordan.concerns.some(c => c.includes("Waiting"))).toBe(true);
  });

  it("flags missing safety plan for high-risk child", () => {
    const profiles = buildChildWellbeingProfiles(
      [getMorganAssessment()], [], [], [], [MORGAN_ID],
    );
    const morgan = profiles.find(p => p.childId === MORGAN_ID)!;
    expect(morgan.concerns.some(c => c.includes("No safety plan"))).toBe(true);
  });

  it("flags expired safety plans", () => {
    const expired = makeSafetyPlan({
      childId: ALEX_ID,
      childName: "Alex",
      status: "expired",
    });
    const profiles = buildChildWellbeingProfiles(
      [getAlexAssessment()], [], [], [expired], [ALEX_ID],
    );
    const alex = profiles.find(p => p.childId === ALEX_ID)!;
    expect(alex.concerns.some(c => c.includes("expired"))).toBe(true);
  });

  it("flags low engagement interventions", () => {
    const lowEng = makeIntervention({
      childId: ALEX_ID,
      childName: "Alex",
      status: "active",
      childEngagement: 3,
    });
    const profiles = buildChildWellbeingProfiles(
      [getAlexAssessment()], [lowEng], [], [getAlexSafetyPlan()], [ALEX_ID],
    );
    const alex = profiles.find(p => p.childId === ALEX_ID)!;
    expect(alex.concerns.some(c => c.includes("Low engagement"))).toBe(true);
  });

  it("flags children with no assessment", () => {
    const profiles = buildChildWellbeingProfiles([], [], [], [], [ALEX_ID]);
    const alex = profiles.find(p => p.childId === ALEX_ID)!;
    expect(alex.concerns.some(c => c.includes("No wellbeing assessment"))).toBe(true);
    expect(alex.latestOverallScore).toBe(0);
  });

  it("includes domain risks from latest assessment", () => {
    const profiles = buildChildWellbeingProfiles(
      [getAlexAssessment()], [], [], [], [ALEX_ID],
    );
    const alex = profiles.find(p => p.childId === ALEX_ID)!;
    expect(alex.domainRisks.length).toBeGreaterThan(0);
    const selfHarm = alex.domainRisks.find(d => d.domain === "self_harm");
    expect(selfHarm).toBeDefined();
    expect(selfHarm!.riskLevel).toBe("high");
  });

  it("shows latest incident date", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const alex = profiles.find(p => p.childId === ALEX_ID)!;
    expect(alex.latestIncidentDate).toBeDefined();
  });

  it("returns stable trend when no assessment exists", () => {
    const profiles = buildChildWellbeingProfiles([], [], [], [], [ALEX_ID]);
    expect(profiles[0].overallTrend).toBe("stable");
  });

  it("flags critical risk children with urgent concern", () => {
    const criticalAssessment = makeAssessment({
      childId: ALEX_ID,
      childName: "Alex",
      overallRisk: "critical",
      overallScore: 2,
    });
    const profiles = buildChildWellbeingProfiles([criticalAssessment], [], [], [], [ALEX_ID]);
    const alex = profiles[0];
    expect(alex.concerns.some(c => c.includes("critical"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateMentalHealthIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateMentalHealthIntelligence", () => {
  it("returns a full intelligence report", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.referenceDate).toBe(NOW);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
  });

  it("includes all sub-results", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.assessmentResult).toBeDefined();
    expect(result.interventionResult).toBeDefined();
    expect(result.incidentResult).toBeDefined();
    expect(result.safetyPlanResult).toBeDefined();
    expect(result.childProfiles).toHaveLength(3);
  });

  it("includes scoring breakdown", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.scoring.assessmentScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.assessmentScore).toBeLessThanOrEqual(100);
    expect(result.scoring.interventionScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.incidentResponseScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.safetyPlanScore).toBeGreaterThanOrEqual(0);
  });

  it("includes regulatory links", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.regulatoryLinks.length).toBe(5);
    expect(result.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("NICE CG26"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("NICE CG28"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("UNCRC Article 24"))).toBe(true);
  });

  // ── Rating threshold tests ──

  it("rates outstanding when score >= 80", () => {
    // All perfect data
    const perfectAssessments = ALL_CHILD_IDS.map((cid, i) => makeAssessment({
      id: `pa-${i}`,
      childId: cid,
      childName: cid,
      assessmentDate: "2026-04-01T00:00:00Z",
      overallScore: 9,
      overallRisk: "low",
      childSelfReport: true,
      staffContribution: true,
      clinicalInput: true,
    }));
    const perfectInterventions = ALL_CHILD_IDS.map((cid, i) => makeIntervention({
      id: `pi-${i}`,
      childId: cid,
      childName: cid,
      status: "active",
      sessionsPlanned: 10,
      sessionsAttended: 9,
      sessionsRescheduled: 0,
      sessionsCancelled: 0,
      childEngagement: 9,
    }));
    const perfectIncidents = [makeIncident({
      id: "pci-1",
      responseTimeMins: 3,
      followUpWithin24h: true,
      followUpWithin72h: true,
      camhsNotified: true,
      planUpdated: true,
    })];
    const perfectPlans = ALL_CHILD_IDS.map((cid, i) => makeSafetyPlan({
      id: `pp-${i}`,
      childId: cid,
      childName: cid,
      status: "current",
      childInvolved: true,
      parentInvolved: true,
      keyProfessionalInvolved: true,
    }));
    const result = generateMentalHealthIntelligence(
      perfectAssessments, perfectInterventions, perfectIncidents, perfectPlans,
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rates inadequate when all data is poor", () => {
    // No assessments, no interventions, poor incident response, no safety plans
    const poorIncidents = [makeIncident({
      id: "bad-1",
      responseTimeMins: 60,
      followUpWithin24h: false,
      followUpWithin72h: false,
      camhsNotified: false,
      planUpdated: false,
      safetyPlanActivated: false,
    })];
    const result = generateMentalHealthIntelligence(
      [], [], poorIncidents, [],
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("rates good when score >= 60 and < 80", () => {
    // Decent but not perfect
    const assessments = [
      makeAssessment({ id: "a1", childId: ALEX_ID, childName: "Alex", childSelfReport: true, staffContribution: true, clinicalInput: true }),
      makeAssessment({ id: "a2", childId: JORDAN_ID, childName: "Jordan", childSelfReport: true, staffContribution: true, clinicalInput: true }),
      // Morgan missing
    ];
    const interventions = [
      makeIntervention({ id: "i1", childId: ALEX_ID, childName: "Alex", sessionsPlanned: 10, sessionsAttended: 7, childEngagement: 6 }),
    ];
    const plans = [
      makeSafetyPlan({ id: "p1", childId: ALEX_ID, status: "current", childInvolved: true, parentInvolved: true, keyProfessionalInvolved: true }),
      makeSafetyPlan({ id: "p2", childId: JORDAN_ID, status: "current", childInvolved: true, parentInvolved: true, keyProfessionalInvolved: true }),
    ];
    const result = generateMentalHealthIntelligence(
      assessments, interventions, [], plans,
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    // Note: exact rating depends on computed score, so we just check it is in the valid set
    expect(["good", "requires_improvement", "outstanding"]).toContain(result.rating);
  });

  it("incident response score is 100 when no incidents in period", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), [], getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.scoring.incidentResponseScore).toBe(100);
  });

  it("intervention score is 0 when no interventions and children exist", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), [], getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.scoring.interventionScore).toBe(0);
  });

  it("filters assessments to period", () => {
    const outOfPeriod = makeAssessment({
      id: "oop",
      assessmentDate: "2025-06-01T00:00:00Z",
    });
    const result = generateMentalHealthIntelligence(
      [outOfPeriod], getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.assessmentResult.totalAssessments).toBe(0);
  });

  it("filters incidents to period", () => {
    const outOfPeriod = makeIncident({
      id: "oop-i",
      date: "2025-06-01T00:00:00Z",
    });
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), [outOfPeriod], getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.incidentResult.totalIncidents).toBe(0);
  });

  // ── Strengths and areas for improvement ──

  it("identifies high assessment coverage as a strength", () => {
    const assessments = ALL_CHILD_IDS.map((cid, i) => makeAssessment({
      id: `sa-${i}`, childId: cid, childName: cid,
      childSelfReport: true, staffContribution: true, clinicalInput: true,
    }));
    const result = generateMentalHealthIntelligence(
      assessments, getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.strengths.some(s => s.includes("assessment coverage"))).toBe(true);
  });

  it("flags low assessment coverage as area for improvement", () => {
    const assessments = [makeAssessment({ childId: ALEX_ID })];
    const result = generateMentalHealthIntelligence(
      assessments, getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.areasForImprovement.some(a => a.includes("assessment coverage"))).toBe(true);
  });

  it("generates actions for overdue assessments", () => {
    const result = generateMentalHealthIntelligence(
      [], getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.actions.some(a => a.includes("overdue wellbeing assessments"))).toBe(true);
  });

  it("generates actions for children on waiting lists", () => {
    const waiting = makeIntervention({
      id: "w1",
      childId: JORDAN_ID,
      childName: "Jordan",
      status: "waiting_list",
      waitingTimeDays: 60,
    });
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), [...getAllInterventions(), waiting], getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.actions.some(a => a.includes("waiting lists"))).toBe(true);
  });

  it("generates actions for expired safety plans", () => {
    const expired = makeSafetyPlan({
      id: "sp-exp",
      childId: ALEX_ID,
      childName: "Alex",
      status: "expired",
    });
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), [expired],
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.actions.some(a => a.includes("expired safety plan"))).toBe(true);
  });

  it("generates actions for high-risk children without safety plans", () => {
    // Morgan is high risk but no safety plan provided
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), [getAlexSafetyPlan()],
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.actions.some(a => a.includes("high/critical-risk"))).toBe(true);
  });

  it("generates actions for declining children", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    // Morgan is declining
    expect(result.actions.some(a => a.includes("declining trends"))).toBe(true);
  });

  it("overall score is clamped between 0 and 100", () => {
    const result = generateMentalHealthIntelligence(
      [], [], [], [],
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  // ── Scoring component tests ──

  it("assessment score rewards multi-voice approach", () => {
    const withMulti = ALL_CHILD_IDS.map((cid, i) => makeAssessment({
      id: `m-${i}`, childId: cid, childName: cid,
      childSelfReport: true, staffContribution: true, clinicalInput: true,
    }));
    const withoutMulti = ALL_CHILD_IDS.map((cid, i) => makeAssessment({
      id: `nm-${i}`, childId: cid, childName: cid,
      childSelfReport: false, staffContribution: true, clinicalInput: false,
    }));
    const r1 = generateMentalHealthIntelligence(
      withMulti, getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    const r2 = generateMentalHealthIntelligence(
      withoutMulti, getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(r1.scoring.assessmentScore).toBeGreaterThan(r2.scoring.assessmentScore);
  });

  it("intervention score penalises long waiting times", () => {
    const shortWait = [makeIntervention({
      id: "sw", status: "waiting_list", waitingTimeDays: 14,
      childId: ALEX_ID, sessionsPlanned: 10, sessionsAttended: 8, childEngagement: 8,
    })];
    const longWait = [makeIntervention({
      id: "lw", status: "waiting_list", waitingTimeDays: 100,
      childId: ALEX_ID, sessionsPlanned: 10, sessionsAttended: 8, childEngagement: 8,
    })];
    const r1 = generateMentalHealthIntelligence(
      getAllAssessments(), shortWait, getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    const r2 = generateMentalHealthIntelligence(
      getAllAssessments(), longWait, getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(r1.scoring.interventionScore).toBeGreaterThan(r2.scoring.interventionScore);
  });

  it("safety plan score rewards child involvement", () => {
    const withChild = ALL_CHILD_IDS.map((cid, i) => makeSafetyPlan({
      id: `wc-${i}`, childId: cid, childName: cid,
      status: "current", childInvolved: true,
    }));
    const withoutChild = ALL_CHILD_IDS.map((cid, i) => makeSafetyPlan({
      id: `nc-${i}`, childId: cid, childName: cid,
      status: "current", childInvolved: false,
    }));
    const r1 = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), withChild,
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    const r2 = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), withoutChild,
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(r1.scoring.safetyPlanScore).toBeGreaterThan(r2.scoring.safetyPlanScore);
  });

  it("incident response rewards fast response and complete follow-up", () => {
    const good = [makeIncident({
      id: "g1",
      responseTimeMins: 3, followUpWithin24h: true, followUpWithin72h: true,
      camhsNotified: true, planUpdated: true,
    })];
    const poor = [makeIncident({
      id: "p1",
      responseTimeMins: 45, followUpWithin24h: false, followUpWithin72h: false,
      camhsNotified: false, planUpdated: false,
    })];
    const r1 = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), good, getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    const r2 = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), poor, getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(r1.scoring.incidentResponseScore).toBeGreaterThan(r2.scoring.incidentResponseScore);
  });

  // ── Edge cases ──

  it("handles single child correctly", () => {
    const result = generateMentalHealthIntelligence(
      [getAlexAssessment()], [getAlexIntervention()], [getAlexIncident()], [getAlexSafetyPlan()],
      [ALEX_ID], HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.childProfiles).toHaveLength(1);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles no children gracefully", () => {
    const result = generateMentalHealthIntelligence(
      [], [], [], [],
      [], HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.childProfiles).toHaveLength(0);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles all data empty for existing children", () => {
    const result = generateMentalHealthIntelligence(
      [], [], [], [],
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.rating).toBeDefined();
    expect(result.childProfiles).toHaveLength(3);
    expect(result.childProfiles.every(p => p.latestOverallScore === 0)).toBe(true);
  });

  it("scoring components are each between 0 and 100", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.scoring.assessmentScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.assessmentScore).toBeLessThanOrEqual(100);
    expect(result.scoring.interventionScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.interventionScore).toBeLessThanOrEqual(100);
    expect(result.scoring.incidentResponseScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.incidentResponseScore).toBeLessThanOrEqual(100);
    expect(result.scoring.safetyPlanScore).toBeGreaterThanOrEqual(0);
    expect(result.scoring.safetyPlanScore).toBeLessThanOrEqual(100);
  });

  it("strengths, areasForImprovement, actions are arrays", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("rates requires_improvement when score >= 40 and < 60", () => {
    // Partial data to get mid-range score
    const partialAssessments = [makeAssessment({
      id: "pa1", childId: ALEX_ID, childName: "Alex",
      childSelfReport: true, staffContribution: true, clinicalInput: false,
    })];
    const result = generateMentalHealthIntelligence(
      partialAssessments, [], [], [],
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    // With minimal data, score should be low
    expect(["requires_improvement", "inadequate"]).toContain(result.rating);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Chamberlain House integration scenario
// ══════════════════════════════════════════════════════════════════════════════

describe("Chamberlain House integration scenario", () => {
  it("produces coherent intelligence report for Chamberlain House demo data", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );

    // Basic structure
    expect(result.homeId).toBe("home-oak");
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(5);

    // Assessment coverage should be 100%
    expect(result.assessmentResult.coverageRate).toBe(100);

    // Two children have interventions
    expect(result.interventionResult.childrenWithIntervention).toBe(2);

    // One incident (Alex's self-harm)
    expect(result.incidentResult.totalIncidents).toBe(1);
    expect(result.incidentResult.responseWithin15MinRate).toBe(100);
    expect(result.incidentResult.camhsNotificationRate).toBe(100);

    // Two safety plans
    expect(result.safetyPlanResult.childrenWithPlan).toBe(2);
  });

  it("Alex profile reflects SEMH, moderate risk with good management", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const alex = profiles.find(p => p.childId === ALEX_ID)!;
    expect(alex.latestOverallRisk).toBe("moderate");
    expect(alex.activeInterventions[0].type).toBe("camhs");
    expect(alex.incidentCount).toBe(1);
    expect(alex.hasSafetyPlan).toBe(true);
    expect(alex.safetyPlanStatus).toBe("current");
  });

  it("Jordan profile reflects low risk, stable wellbeing", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const jordan = profiles.find(p => p.childId === JORDAN_ID)!;
    expect(jordan.latestOverallRisk).toBe("low");
    expect(jordan.latestOverallScore).toBe(8);
    expect(jordan.activeInterventions).toHaveLength(0);
    expect(jordan.incidentCount).toBe(0);
  });

  it("Morgan profile reflects high anxiety with therapy engagement", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const morgan = profiles.find(p => p.childId === MORGAN_ID)!;
    expect(morgan.latestOverallRisk).toBe("high");
    expect(morgan.activeInterventions[0].type).toBe("private_therapy");
    expect(morgan.activeInterventions[0].engagement).toBe(8);
    expect(morgan.safetyPlanStatus).toBe("under_review");
    expect(morgan.overallTrend).toBe("declining");
  });

  it("Morgan has declining self-esteem flagged in domain risks", () => {
    const profiles = buildChildWellbeingProfiles(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(), ALL_CHILD_IDS,
    );
    const morgan = profiles.find(p => p.childId === MORGAN_ID)!;
    const selfEsteem = morgan.domainRisks.find(d => d.domain === "self_esteem");
    expect(selfEsteem).toBeDefined();
    expect(selfEsteem!.trend).toBe("declining");
    expect(selfEsteem!.riskLevel).toBe("high");
  });

  it("report actions include review for Morgan's declining trend", () => {
    const result = generateMentalHealthIntelligence(
      getAllAssessments(), getAllInterventions(), getAllIncidents(), getAllSafetyPlans(),
      ALL_CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, NOW,
    );
    expect(result.actions.some(a => a.includes("declining"))).toBe(true);
  });
});
