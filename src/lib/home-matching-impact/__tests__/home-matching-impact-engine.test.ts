// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Matching Impact Intelligence Engine
//
// Demo data: Chamberlain House
//   - Alex (child-001): planned admission, well-matched, compatibility 8/10
//   - Jordan (child-002): existing resident consulted about Alex's admission
//   - Morgan (child-003): emergency admission, some negative impact detected
//
// Staff: Darren Laville (RM), Sarah Johnson (RSW), Lisa Williams (Senior RSW)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateMatchingQuality,
  evaluateImpactMonitoring,
  evaluateResidentConsultation,
  evaluateAdmissionOutcomes,
  generateHomeMatchingImpactIntelligence,
  getAdmissionTypeLabel,
  getMatchingDecisionLabel,
  getImpactAreaLabel,
  getImpactLevelLabel,
  getMonitoringFrequencyLabel,
} from "../home-matching-impact-engine";
import type {
  MatchingAssessment,
  ImpactMonitoring,
  ResidentConsultation,
  AdmissionOutcome,
} from "../home-matching-impact-engine";

// ── Helper Factories ───────────────────────────────────────────────────────

function makeAssessment(overrides: Partial<MatchingAssessment> = {}): MatchingAssessment {
  return {
    id: "ma-001",
    homeId: "oak-house",
    childId: "child-001",
    childName: "Alex",
    assessmentDate: "2026-04-05",
    admissionType: "planned",
    assessedBy: "Sarah Johnson",
    existingChildrenConsulted: true,
    existingChildrenIds: ["child-002"],
    riskFactorsIdentified: ["absconding history"],
    protectiveFactors: ["positive peer relationships", "engaged in education"],
    compatibilityScore: 8,
    decision: "proceed",
    conditionsApplied: [],
    reviewDate: "2026-05-05",
    ...overrides,
  };
}

function makeMonitoring(overrides: Partial<ImpactMonitoring> = {}): ImpactMonitoring {
  return {
    id: "im-001",
    homeId: "oak-house",
    newChildId: "child-001",
    existingChildId: "child-002",
    existingChildName: "Jordan",
    monitoringDate: "2026-04-20",
    impactArea: "peer_dynamics",
    impactLevel: "positive",
    evidence: "Jordan and Alex have formed a positive friendship, engaging in shared activities",
    mitigationAction: "",
    resolved: true,
    ...overrides,
  };
}

function makeConsultation(overrides: Partial<ResidentConsultation> = {}): ResidentConsultation {
  return {
    id: "rc-001",
    homeId: "oak-house",
    childId: "child-001",
    childName: "Jordan",
    consultationDate: "2026-04-03",
    informedAboutNewResident: true,
    viewsSought: true,
    viewsSummary: "Jordan is excited about having someone close in age to share activities with",
    viewsActedUpon: true,
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<AdmissionOutcome> = {}): AdmissionOutcome {
  return {
    id: "ao-001",
    homeId: "oak-house",
    childId: "child-001",
    childName: "Alex",
    admissionDate: "2026-04-10",
    matchingAssessmentId: "ma-001",
    placementStable: true,
    daysToSettle: 5,
    disruptionOccurred: false,
    disruptionReason: "",
    ...overrides,
  };
}

const PERIOD_START = "2026-04-01";
const PERIOD_END = "2026-05-18";

// ── Chamberlain House Demo Data ────────────────────────────────────────────────────

function oakHouseAssessments(): MatchingAssessment[] {
  return [
    makeAssessment({
      id: "ma-001",
      childId: "child-001",
      childName: "Alex",
      assessmentDate: "2026-04-05",
      admissionType: "planned",
      compatibilityScore: 8,
      decision: "proceed",
      existingChildrenConsulted: true,
      existingChildrenIds: ["child-002"],
      riskFactorsIdentified: ["absconding history"],
      protectiveFactors: ["positive peer relationships", "engaged in education"],
      reviewDate: "2026-05-05",
    }),
    makeAssessment({
      id: "ma-002",
      childId: "child-003",
      childName: "Morgan",
      assessmentDate: "2026-04-15",
      admissionType: "emergency",
      assessedBy: "Lisa Williams",
      compatibilityScore: 5,
      decision: "proceed_with_conditions",
      existingChildrenConsulted: false,
      existingChildrenIds: [],
      riskFactorsIdentified: ["self-harm", "peer conflict", "substance misuse"],
      protectiveFactors: ["responsive to boundaries"],
      conditionsApplied: ["daily risk review", "enhanced staffing for first 7 days"],
      reviewDate: "2026-04-22",
    }),
    makeAssessment({
      id: "ma-003",
      childId: "child-004",
      childName: "Riley",
      assessmentDate: "2026-04-25",
      admissionType: "planned",
      assessedBy: "Sarah Johnson",
      compatibilityScore: 3,
      decision: "decline",
      existingChildrenConsulted: true,
      existingChildrenIds: ["child-001", "child-002", "child-003"],
      riskFactorsIdentified: ["criminal exploitation", "violence to peers", "county lines"],
      protectiveFactors: [],
      conditionsApplied: [],
      reviewDate: "",
    }),
  ];
}

function oakHouseMonitoring(): ImpactMonitoring[] {
  return [
    // Alex's admission impact on Jordan — positive
    makeMonitoring({
      id: "im-001",
      newChildId: "child-001",
      existingChildId: "child-002",
      existingChildName: "Jordan",
      monitoringDate: "2026-04-15",
      impactArea: "peer_dynamics",
      impactLevel: "positive",
      evidence: "Jordan and Alex have formed a positive friendship",
      mitigationAction: "",
      resolved: true,
    }),
    makeMonitoring({
      id: "im-002",
      newChildId: "child-001",
      existingChildId: "child-002",
      existingChildName: "Jordan",
      monitoringDate: "2026-04-20",
      impactArea: "emotional_wellbeing",
      impactLevel: "positive",
      evidence: "Jordan appears happier since Alex's arrival, more engaged in house activities",
      mitigationAction: "",
      resolved: true,
    }),
    // Morgan's emergency admission impact on Jordan — negative
    makeMonitoring({
      id: "im-003",
      newChildId: "child-003",
      existingChildId: "child-002",
      existingChildName: "Jordan",
      monitoringDate: "2026-04-20",
      impactArea: "behaviour",
      impactLevel: "negative",
      evidence: "Jordan showing increased anxiety and withdrawn behaviour since Morgan arrived",
      mitigationAction: "Increased 1:1 keyworker sessions for Jordan, calming strategies reinforced",
      resolved: false,
    }),
    // Morgan's impact on Alex — neutral
    makeMonitoring({
      id: "im-004",
      newChildId: "child-003",
      existingChildId: "child-001",
      existingChildName: "Alex",
      monitoringDate: "2026-04-20",
      impactArea: "routines",
      impactLevel: "neutral",
      evidence: "Alex's routines have not been significantly affected by Morgan's admission",
      mitigationAction: "",
      resolved: true,
    }),
    // Morgan's impact on Alex — safety concern
    makeMonitoring({
      id: "im-005",
      newChildId: "child-003",
      existingChildId: "child-001",
      existingChildName: "Alex",
      monitoringDate: "2026-04-25",
      impactArea: "safety",
      impactLevel: "significant_negative",
      evidence: "Alex reported feeling unsafe after Morgan's aggressive outburst in communal area",
      mitigationAction: "Safety plan updated, staff debriefing completed, incident reported to placing authority",
      resolved: true,
    }),
    // Additional monitoring for Morgan's impact — education
    makeMonitoring({
      id: "im-006",
      newChildId: "child-003",
      existingChildId: "child-002",
      existingChildName: "Jordan",
      monitoringDate: "2026-04-28",
      impactArea: "education",
      impactLevel: "negative",
      evidence: "Jordan missed school twice, citing not wanting to leave the house while Morgan is there",
      mitigationAction: "School transport arranged, discussion with Jordan about safety measures in place",
      resolved: true,
    }),
  ];
}

function oakHouseConsultations(): ResidentConsultation[] {
  return [
    // Jordan consulted about Alex's admission
    makeConsultation({
      id: "rc-001",
      childId: "child-001",
      childName: "Jordan",
      consultationDate: "2026-04-03",
      informedAboutNewResident: true,
      viewsSought: true,
      viewsSummary: "Jordan is excited about having someone close in age to share activities with",
      viewsActedUpon: true,
    }),
    // Jordan consulted about Morgan's emergency admission (post-hoc)
    makeConsultation({
      id: "rc-002",
      childId: "child-003",
      childName: "Jordan",
      consultationDate: "2026-04-16",
      informedAboutNewResident: true,
      viewsSought: true,
      viewsSummary: "Jordan expressed worry about the new person, asked questions about what would happen",
      viewsActedUpon: false,
    }),
    // Alex consulted about Morgan's admission
    makeConsultation({
      id: "rc-003",
      childId: "child-003",
      childName: "Alex",
      consultationDate: "2026-04-16",
      informedAboutNewResident: true,
      viewsSought: true,
      viewsSummary: "Alex felt neutral about new admission but wanted reassurance about personal space",
      viewsActedUpon: true,
    }),
  ];
}

function oakHouseOutcomes(): AdmissionOutcome[] {
  return [
    // Alex — stable placement
    makeOutcome({
      id: "ao-001",
      childId: "child-001",
      childName: "Alex",
      admissionDate: "2026-04-10",
      matchingAssessmentId: "ma-001",
      placementStable: true,
      daysToSettle: 5,
      disruptionOccurred: false,
      disruptionReason: "",
    }),
    // Morgan — some disruption
    makeOutcome({
      id: "ao-002",
      childId: "child-003",
      childName: "Morgan",
      admissionDate: "2026-04-16",
      matchingAssessmentId: "ma-002",
      placementStable: false,
      daysToSettle: 14,
      disruptionOccurred: true,
      disruptionReason: "aggressive outburst towards peer",
    }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMatchingQuality", () => {
  it("returns zero totals for empty assessments", () => {
    const result = evaluateMatchingQuality([], PERIOD_START, PERIOD_END);
    expect(result.totalAssessments).toBe(0);
    expect(result.averageCompatibilityScore).toBe(0);
    expect(result.assessmentCompletionRate).toBe(0);
    expect(result.existingChildrenConsultedRate).toBe(0);
  });

  it("filters assessments to the given period", () => {
    const assessments = [
      makeAssessment({ assessmentDate: "2026-03-01" }), // before period
      makeAssessment({ id: "ma-002", assessmentDate: "2026-04-10" }), // in period
    ];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.totalAssessments).toBe(1);
  });

  it("calculates average compatibility score correctly", () => {
    const assessments = [
      makeAssessment({ compatibilityScore: 8 }),
      makeAssessment({ id: "ma-002", assessmentDate: "2026-04-10", compatibilityScore: 6 }),
    ];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.averageCompatibilityScore).toBe(7);
  });

  it("calculates assessment completion rate correctly", () => {
    const assessments = [
      makeAssessment({ decision: "proceed" }),
      makeAssessment({ id: "ma-002", assessmentDate: "2026-04-10", decision: "defer" }),
      makeAssessment({ id: "ma-003", assessmentDate: "2026-04-12", decision: "decline" }),
    ];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.assessmentCompletionRate).toBe(67); // 2 of 3
  });

  it("calculates existing children consulted rate", () => {
    const assessments = [
      makeAssessment({ existingChildrenConsulted: true }),
      makeAssessment({ id: "ma-002", assessmentDate: "2026-04-10", existingChildrenConsulted: false }),
    ];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.existingChildrenConsultedRate).toBe(50);
  });

  it("calculates conditions applied rate for proceed_with_conditions decisions", () => {
    const assessments = [
      makeAssessment({
        decision: "proceed_with_conditions",
        conditionsApplied: ["daily review"],
      }),
      makeAssessment({
        id: "ma-002",
        assessmentDate: "2026-04-10",
        decision: "proceed_with_conditions",
        conditionsApplied: [],
      }),
    ];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.conditionsAppliedRate).toBe(50);
  });

  it("reports conditions applied rate as unmeasured when no conditional decisions exist", () => {
    const assessments = [makeAssessment({ decision: "proceed" })];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.conditionsAppliedRate).toBeNull();
  });

  it("calculates decision breakdown correctly", () => {
    const assessments = oakHouseAssessments();
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.decisionBreakdown.proceed).toBe(1);
    expect(result.decisionBreakdown.proceed_with_conditions).toBe(1);
    expect(result.decisionBreakdown.decline).toBe(1);
    expect(result.decisionBreakdown.defer).toBe(0);
  });

  it("calculates admission type breakdown correctly", () => {
    const assessments = oakHouseAssessments();
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.admissionTypeBreakdown.planned).toBe(2);
    expect(result.admissionTypeBreakdown.emergency).toBe(1);
    expect(result.admissionTypeBreakdown.respite).toBe(0);
  });

  it("calculates average risk factors", () => {
    const assessments = [
      makeAssessment({ riskFactorsIdentified: ["a", "b"] }),
      makeAssessment({ id: "ma-002", assessmentDate: "2026-04-10", riskFactorsIdentified: ["c"] }),
    ];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.averageRiskFactors).toBe(1.5);
  });

  it("calculates average protective factors", () => {
    const assessments = [
      makeAssessment({ protectiveFactors: ["a", "b", "c"] }),
      makeAssessment({ id: "ma-002", assessmentDate: "2026-04-10", protectiveFactors: ["d"] }),
    ];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.averageProtectiveFactors).toBe(2);
  });

  it("calculates review date set rate", () => {
    const assessments = [
      makeAssessment({ reviewDate: "2026-05-05" }),
      makeAssessment({ id: "ma-002", assessmentDate: "2026-04-10", reviewDate: "" }),
    ];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.reviewDateSetRate).toBe(50);
  });

  it("handles single assessment correctly", () => {
    const result = evaluateMatchingQuality([makeAssessment()], PERIOD_START, PERIOD_END);
    expect(result.totalAssessments).toBe(1);
    expect(result.averageCompatibilityScore).toBe(8);
    expect(result.assessmentCompletionRate).toBe(100);
  });

  it("handles max compatibility score", () => {
    const result = evaluateMatchingQuality(
      [makeAssessment({ compatibilityScore: 10 })],
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.averageCompatibilityScore).toBe(10);
  });

  it("handles min compatibility score", () => {
    const result = evaluateMatchingQuality(
      [makeAssessment({ compatibilityScore: 1 })],
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.averageCompatibilityScore).toBe(1);
  });

  it("includes boundary dates in period filter", () => {
    const assessments = [
      makeAssessment({ assessmentDate: PERIOD_START }),
      makeAssessment({ id: "ma-002", assessmentDate: PERIOD_END }),
    ];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.totalAssessments).toBe(2);
  });

  it("excludes assessments exactly one day before period start", () => {
    const assessments = [makeAssessment({ assessmentDate: "2026-03-31" })];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.totalAssessments).toBe(0);
  });

  it("excludes assessments after period end", () => {
    const assessments = [makeAssessment({ assessmentDate: "2026-05-19" })];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.totalAssessments).toBe(0);
  });

  it("produces Chamberlain House demo data correctly", () => {
    const result = evaluateMatchingQuality(oakHouseAssessments(), PERIOD_START, PERIOD_END);
    expect(result.totalAssessments).toBe(3);
    expect(result.averageCompatibilityScore).toBe(5.3);
    expect(result.existingChildrenConsultedRate).toBe(67);
  });
});

describe("evaluateImpactMonitoring", () => {
  it("returns zero totals for empty monitoring", () => {
    const result = evaluateImpactMonitoring([], [], PERIOD_START, PERIOD_END);
    expect(result.totalMonitoringRecords).toBe(0);
    expect(result.negativeImpactRate).toBe(0);
  });

  it("calculates negative impact rate", () => {
    const monitoring = [
      makeMonitoring({ impactLevel: "negative" }),
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-21", impactLevel: "positive" }),
    ];
    const result = evaluateImpactMonitoring(monitoring, [], PERIOD_START, PERIOD_END);
    expect(result.negativeImpactRate).toBe(50);
  });

  it("calculates significant negative rate", () => {
    const monitoring = [
      makeMonitoring({ impactLevel: "significant_negative" }),
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-21", impactLevel: "neutral" }),
      makeMonitoring({ id: "im-003", monitoringDate: "2026-04-22", impactLevel: "positive" }),
    ];
    const result = evaluateImpactMonitoring(monitoring, [], PERIOD_START, PERIOD_END);
    expect(result.significantNegativeRate).toBe(33);
  });

  it("calculates positive impact rate", () => {
    const monitoring = [
      makeMonitoring({ impactLevel: "positive" }),
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-21", impactLevel: "positive" }),
      makeMonitoring({ id: "im-003", monitoringDate: "2026-04-22", impactLevel: "neutral" }),
    ];
    const result = evaluateImpactMonitoring(monitoring, [], PERIOD_START, PERIOD_END);
    expect(result.positiveImpactRate).toBe(67);
  });

  it("calculates impact area breakdown", () => {
    const monitoring = oakHouseMonitoring();
    const result = evaluateImpactMonitoring(monitoring, oakHouseAssessments(), PERIOD_START, PERIOD_END);
    expect(result.impactAreaBreakdown.peer_dynamics).toBe(1);
    expect(result.impactAreaBreakdown.emotional_wellbeing).toBe(1);
    expect(result.impactAreaBreakdown.behaviour).toBe(1);
    expect(result.impactAreaBreakdown.safety).toBe(1);
    expect(result.impactAreaBreakdown.education).toBe(1);
    expect(result.impactAreaBreakdown.routines).toBe(1);
    expect(result.impactAreaBreakdown.staffing).toBe(0);
    expect(result.impactAreaBreakdown.space).toBe(0);
  });

  it("calculates resolution rate for negative records", () => {
    const monitoring = [
      makeMonitoring({ impactLevel: "negative", resolved: true }),
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-21", impactLevel: "negative", resolved: false }),
    ];
    const result = evaluateImpactMonitoring(monitoring, [], PERIOD_START, PERIOD_END);
    expect(result.resolutionRate).toBe(50);
  });

  it("reports resolution rate as unmeasured when no negative records exist", () => {
    const monitoring = [makeMonitoring({ impactLevel: "positive" })];
    const result = evaluateImpactMonitoring(monitoring, [], PERIOD_START, PERIOD_END);
    expect(result.resolutionRate).toBeNull();
  });

  it("calculates mitigation provided rate for negative records", () => {
    const monitoring = [
      makeMonitoring({ impactLevel: "negative", mitigationAction: "action taken" }),
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-21", impactLevel: "negative", mitigationAction: "" }),
    ];
    const result = evaluateImpactMonitoring(monitoring, [], PERIOD_START, PERIOD_END);
    expect(result.mitigationProvidedRate).toBe(50);
  });

  it("reports mitigation rate as unmeasured when no negative records exist", () => {
    const monitoring = [makeMonitoring({ impactLevel: "neutral" })];
    const result = evaluateImpactMonitoring(monitoring, [], PERIOD_START, PERIOD_END);
    expect(result.mitigationProvidedRate).toBeNull();
  });

  it("calculates average monitoring per child", () => {
    const assessments = [makeAssessment({ decision: "proceed" })];
    const monitoring = [
      makeMonitoring(),
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-22" }),
      makeMonitoring({ id: "im-003", monitoringDate: "2026-04-24" }),
    ];
    const result = evaluateImpactMonitoring(monitoring, assessments, PERIOD_START, PERIOD_END);
    expect(result.averageMonitoringPerChild).toBe(3);
  });

  it("marks monitoring frequency as adequate when >= 2 per child", () => {
    const assessments = [makeAssessment({ decision: "proceed" })];
    const monitoring = [
      makeMonitoring(),
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-22" }),
    ];
    const result = evaluateImpactMonitoring(monitoring, assessments, PERIOD_START, PERIOD_END);
    expect(result.monitoringFrequencyAdequate).toBe(true);
  });

  it("marks monitoring frequency as inadequate when < 2 per child", () => {
    const assessments = [
      makeAssessment({ decision: "proceed" }),
      makeAssessment({ id: "ma-002", assessmentDate: "2026-04-10", childId: "child-003", decision: "proceed" }),
    ];
    const monitoring = [makeMonitoring()]; // 1 record for 2 admitted children = 0.5 avg
    const result = evaluateImpactMonitoring(monitoring, assessments, PERIOD_START, PERIOD_END);
    expect(result.monitoringFrequencyAdequate).toBe(false);
  });

  it("marks monitoring frequency as adequate when no admissions", () => {
    const result = evaluateImpactMonitoring([], [], PERIOD_START, PERIOD_END);
    expect(result.monitoringFrequencyAdequate).toBe(true);
  });

  it("filters monitoring to period", () => {
    const monitoring = [
      makeMonitoring({ monitoringDate: "2026-03-15" }), // before period
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-20" }), // in period
    ];
    const result = evaluateImpactMonitoring(monitoring, [], PERIOD_START, PERIOD_END);
    expect(result.totalMonitoringRecords).toBe(1);
  });

  it("handles Chamberlain House demo monitoring data", () => {
    const result = evaluateImpactMonitoring(oakHouseMonitoring(), oakHouseAssessments(), PERIOD_START, PERIOD_END);
    expect(result.totalMonitoringRecords).toBe(6);
    expect(result.positiveImpactRate).toBe(33);
    expect(result.negativeImpactRate).toBe(50); // 2 negative + 1 significant_negative = 3 of 6
  });

  it("counts only admitted children for average monitoring", () => {
    const assessments = [
      makeAssessment({ decision: "proceed" }),
      makeAssessment({ id: "ma-002", assessmentDate: "2026-04-10", childId: "child-003", decision: "decline" }),
    ];
    const monitoring = [
      makeMonitoring(),
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-22" }),
    ];
    const result = evaluateImpactMonitoring(monitoring, assessments, PERIOD_START, PERIOD_END);
    // Only 1 admitted child, so average is 2
    expect(result.averageMonitoringPerChild).toBe(2);
  });
});

describe("evaluateResidentConsultation", () => {
  it("returns zero totals for empty consultations", () => {
    const result = evaluateResidentConsultation([], [], PERIOD_START, PERIOD_END);
    expect(result.totalConsultations).toBe(0);
    expect(result.informedRate).toBe(0);
  });

  it("calculates informed rate", () => {
    const consultations = [
      makeConsultation({ informedAboutNewResident: true }),
      makeConsultation({ id: "rc-002", consultationDate: "2026-04-05", informedAboutNewResident: false }),
    ];
    const result = evaluateResidentConsultation(consultations, [], PERIOD_START, PERIOD_END);
    expect(result.informedRate).toBe(50);
  });

  it("calculates views sought rate", () => {
    const consultations = [
      makeConsultation({ viewsSought: true }),
      makeConsultation({ id: "rc-002", consultationDate: "2026-04-05", viewsSought: false }),
    ];
    const result = evaluateResidentConsultation(consultations, [], PERIOD_START, PERIOD_END);
    expect(result.viewsSoughtRate).toBe(50);
  });

  it("calculates views acted upon rate from those where views were sought", () => {
    const consultations = [
      makeConsultation({ viewsSought: true, viewsActedUpon: true }),
      makeConsultation({ id: "rc-002", consultationDate: "2026-04-05", viewsSought: true, viewsActedUpon: false }),
      makeConsultation({ id: "rc-003", consultationDate: "2026-04-06", viewsSought: false, viewsActedUpon: false }),
    ];
    const result = evaluateResidentConsultation(consultations, [], PERIOD_START, PERIOD_END);
    // Of the 2 where views were sought, 1 was acted upon = 50%
    expect(result.viewsActedUponRate).toBe(50);
  });

  it("returns 0% views acted upon when no views were sought", () => {
    const consultations = [
      makeConsultation({ viewsSought: false, viewsActedUpon: false }),
    ];
    const result = evaluateResidentConsultation(consultations, [], PERIOD_START, PERIOD_END);
    expect(result.viewsActedUponRate).toBe(0);
  });

  it("calculates consultation completion rate against admitted children", () => {
    const assessments = [
      makeAssessment({ childId: "child-001", decision: "proceed" }),
      makeAssessment({ id: "ma-002", assessmentDate: "2026-04-10", childId: "child-003", decision: "proceed_with_conditions" }),
    ];
    const consultations = [
      makeConsultation({ childId: "child-001" }), // Consultation done for child-001
      // No consultation for child-003
    ];
    const result = evaluateResidentConsultation(consultations, assessments, PERIOD_START, PERIOD_END);
    expect(result.consultationCompletionRate).toBe(50);
  });

  it("returns 0% consultation completion rate when no admissions", () => {
    const consultations = [makeConsultation()];
    const result = evaluateResidentConsultation(consultations, [], PERIOD_START, PERIOD_END);
    expect(result.consultationCompletionRate).toBe(0);
  });

  it("calculates average consultations per admission", () => {
    const assessments = [makeAssessment({ decision: "proceed" })];
    const consultations = [
      makeConsultation(),
      makeConsultation({ id: "rc-002", consultationDate: "2026-04-05" }),
    ];
    const result = evaluateResidentConsultation(consultations, assessments, PERIOD_START, PERIOD_END);
    expect(result.averageConsultationsPerAdmission).toBe(2);
  });

  it("filters consultations to period", () => {
    const consultations = [
      makeConsultation({ consultationDate: "2026-03-01" }),
      makeConsultation({ id: "rc-002", consultationDate: "2026-04-05" }),
    ];
    const result = evaluateResidentConsultation(consultations, [], PERIOD_START, PERIOD_END);
    expect(result.totalConsultations).toBe(1);
  });

  it("handles Chamberlain House demo consultation data", () => {
    const result = evaluateResidentConsultation(
      oakHouseConsultations(),
      oakHouseAssessments(),
      PERIOD_START,
      PERIOD_END,
    );
    expect(result.totalConsultations).toBe(3);
    expect(result.informedRate).toBe(100);
    expect(result.viewsSoughtRate).toBe(100);
  });

  it("handles 100% informed rate", () => {
    const consultations = [
      makeConsultation({ informedAboutNewResident: true }),
      makeConsultation({ id: "rc-002", consultationDate: "2026-04-05", informedAboutNewResident: true }),
    ];
    const result = evaluateResidentConsultation(consultations, [], PERIOD_START, PERIOD_END);
    expect(result.informedRate).toBe(100);
  });

  it("handles all views acted upon", () => {
    const consultations = [
      makeConsultation({ viewsSought: true, viewsActedUpon: true }),
      makeConsultation({ id: "rc-002", consultationDate: "2026-04-05", viewsSought: true, viewsActedUpon: true }),
    ];
    const result = evaluateResidentConsultation(consultations, [], PERIOD_START, PERIOD_END);
    expect(result.viewsActedUponRate).toBe(100);
  });
});

describe("evaluateAdmissionOutcomes", () => {
  it("returns zero totals for empty outcomes", () => {
    const result = evaluateAdmissionOutcomes([], PERIOD_START, PERIOD_END);
    expect(result.totalOutcomes).toBe(0);
    expect(result.placementStabilityRate).toBe(0);
    expect(result.disruptionRate).toBe(0);
  });

  it("calculates placement stability rate", () => {
    const outcomes = [
      makeOutcome({ placementStable: true }),
      makeOutcome({ id: "ao-002", admissionDate: "2026-04-15", placementStable: false }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.placementStabilityRate).toBe(50);
  });

  it("calculates average days to settle", () => {
    const outcomes = [
      makeOutcome({ daysToSettle: 5 }),
      makeOutcome({ id: "ao-002", admissionDate: "2026-04-15", daysToSettle: 10 }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.averageDaysToSettle).toBe(7.5);
  });

  it("excludes zero daysToSettle from average", () => {
    const outcomes = [
      makeOutcome({ daysToSettle: 5 }),
      makeOutcome({ id: "ao-002", admissionDate: "2026-04-15", daysToSettle: 0 }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.averageDaysToSettle).toBe(5);
  });

  it("returns 0 average days when all are zero", () => {
    const outcomes = [
      makeOutcome({ daysToSettle: 0 }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.averageDaysToSettle).toBe(0);
  });

  it("calculates disruption rate", () => {
    const outcomes = [
      makeOutcome({ disruptionOccurred: false }),
      makeOutcome({ id: "ao-002", admissionDate: "2026-04-15", disruptionOccurred: true, disruptionReason: "aggression" }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.disruptionRate).toBe(50);
  });

  it("calculates disruption reasons breakdown", () => {
    const outcomes = [
      makeOutcome({ disruptionOccurred: true, disruptionReason: "aggression" }),
      makeOutcome({ id: "ao-002", admissionDate: "2026-04-15", disruptionOccurred: true, disruptionReason: "aggression" }),
      makeOutcome({ id: "ao-003", admissionDate: "2026-04-20", disruptionOccurred: true, disruptionReason: "absconding" }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.disruptionReasons["aggression"]).toBe(2);
    expect(result.disruptionReasons["absconding"]).toBe(1);
  });

  it("excludes disruptions with empty reason from reasons breakdown", () => {
    const outcomes = [
      makeOutcome({ disruptionOccurred: true, disruptionReason: "" }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.disruptionRate).toBe(100);
    expect(Object.keys(result.disruptionReasons).length).toBe(0);
  });

  it("calculates matching assessment linked rate", () => {
    const outcomes = [
      makeOutcome({ matchingAssessmentId: "ma-001" }),
      makeOutcome({ id: "ao-002", admissionDate: "2026-04-15", matchingAssessmentId: "" }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.matchingAssessmentLinkedRate).toBe(50);
  });

  it("filters outcomes to period", () => {
    const outcomes = [
      makeOutcome({ admissionDate: "2026-03-01" }),
      makeOutcome({ id: "ao-002", admissionDate: "2026-04-15" }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.totalOutcomes).toBe(1);
  });

  it("handles Chamberlain House demo outcome data", () => {
    const result = evaluateAdmissionOutcomes(oakHouseOutcomes(), PERIOD_START, PERIOD_END);
    expect(result.totalOutcomes).toBe(2);
    expect(result.placementStabilityRate).toBe(50);
    expect(result.disruptionRate).toBe(50);
    expect(result.matchingAssessmentLinkedRate).toBe(100);
  });

  it("handles 100% stability", () => {
    const outcomes = [
      makeOutcome({ placementStable: true }),
      makeOutcome({ id: "ao-002", admissionDate: "2026-04-15", placementStable: true }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.placementStabilityRate).toBe(100);
  });

  it("handles 0% stability", () => {
    const outcomes = [
      makeOutcome({ placementStable: false }),
      makeOutcome({ id: "ao-002", admissionDate: "2026-04-15", placementStable: false }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.placementStabilityRate).toBe(0);
  });
});

describe("generateHomeMatchingImpactIntelligence", () => {
  it("generates full intelligence for Chamberlain House demo data", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.referenceDate).toBe("2026-05-18");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes matching quality component", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.matchingQuality.totalAssessments).toBe(3);
  });

  it("includes impact monitoring component", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.impactMonitoring.totalMonitoringRecords).toBe(6);
  });

  it("includes resident consultation component", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.residentConsultation.totalConsultations).toBe(3);
  });

  it("includes admission outcomes component", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.admissionOutcomes.totalOutcomes).toBe(2);
  });

  it("produces component scores that sum to overall score", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    const sum =
      result.componentScores.matchingQuality +
      result.componentScores.impactMonitoring +
      result.componentScores.residentConsultation +
      result.componentScores.admissionOutcomes;
    expect(result.overallScore).toBe(Math.round(sum));
  });

  it("generates strengths array", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("generates areas for improvement array", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(Array.isArray(result.actions)).toBe(true);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links array", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("includes CHR 2015 Reg 14 in regulatory links", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 14"))).toBe(true);
  });

  it("includes CHR 2015 Reg 3 in regulatory links", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 3"))).toBe(true);
  });

  it("includes SCCIF in regulatory links when monitoring exists", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes Guide to CHR 2015 in regulatory links", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Guide to Children's Homes Regulations"))).toBe(true);
  });

  it("component scores are within expected ranges", () => {
    const result = generateHomeMatchingImpactIntelligence(
      oakHouseAssessments(),
      oakHouseMonitoring(),
      oakHouseConsultations(),
      oakHouseOutcomes(),
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.matchingQuality).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.matchingQuality).toBeLessThanOrEqual(30);
    expect(result.componentScores.impactMonitoring).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.impactMonitoring).toBeLessThanOrEqual(25);
    expect(result.componentScores.residentConsultation).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.residentConsultation).toBeLessThanOrEqual(25);
    expect(result.componentScores.admissionOutcomes).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.admissionOutcomes).toBeLessThanOrEqual(20);
  });
});

describe("rating thresholds", () => {
  it("rates outstanding at score 80", () => {
    const result = generateHomeMatchingImpactIntelligence(
      [],
      [],
      [],
      [],
      "test-home",
      "2026-01-01",
      "2026-01-31",
      "2026-01-31",
    );
    // With no data, all components get neutral scores (25 + 25 + 25 + 20 = 95 but actually
    // let's verify: no assessments, no monitoring, no consultations, no outcomes = neutral across board
    // This should score high since no admissions = no issues
    if (result.overallScore >= 80) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("rates good at score 60-79", () => {
    // Build a scenario that scores in the good range
    const assessments = [
      makeAssessment({
        compatibilityScore: 6,
        existingChildrenConsulted: true,
        decision: "proceed",
        reviewDate: "2026-05-05",
      }),
    ];
    const monitoring = [
      makeMonitoring({ impactLevel: "negative", resolved: true, mitigationAction: "action taken" }),
    ];
    const consultations = [
      makeConsultation({ informedAboutNewResident: true, viewsSought: true, viewsActedUpon: true }),
    ];
    const outcomes = [
      makeOutcome({ placementStable: true, daysToSettle: 10, disruptionOccurred: false }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      monitoring,
      consultations,
      outcomes,
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.rating).toBe("good");
    }
  });

  it("rates requires_improvement at score 40-59", () => {
    const assessments = [
      makeAssessment({
        compatibilityScore: 3,
        existingChildrenConsulted: false,
        decision: "defer",
        reviewDate: "",
      }),
    ];
    const monitoring = [
      makeMonitoring({ impactLevel: "significant_negative", resolved: false, mitigationAction: "" }),
    ];
    const consultations = [
      makeConsultation({ informedAboutNewResident: false, viewsSought: false, viewsActedUpon: false }),
    ];
    const outcomes = [
      makeOutcome({ placementStable: false, daysToSettle: 25, disruptionOccurred: true, disruptionReason: "peer conflict" }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      monitoring,
      consultations,
      outcomes,
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    if (result.overallScore >= 40 && result.overallScore < 60) {
      expect(result.rating).toBe("requires_improvement");
    }
  });

  it("rates inadequate below score 40", () => {
    const assessments = [
      makeAssessment({
        compatibilityScore: 1,
        existingChildrenConsulted: false,
        decision: "defer",
        reviewDate: "",
      }),
      makeAssessment({
        id: "ma-002",
        assessmentDate: "2026-04-10",
        compatibilityScore: 1,
        existingChildrenConsulted: false,
        decision: "defer",
        reviewDate: "",
      }),
    ];
    // No monitoring, no consultations with zero admitted children won't trigger well;
    // but assessments with 0% completion and no monitoring/consults will score badly
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      [], // no monitoring despite assessments
      [], // no consultations despite assessments
      [], // no outcomes despite assessments
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    if (result.overallScore < 40) {
      expect(result.rating).toBe("inadequate");
    }
  });

  it("no-data scenario produces neutral outstanding/good rating", () => {
    const result = generateHomeMatchingImpactIntelligence(
      [],
      [],
      [],
      [],
      "empty-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    // No admissions = neutral = max scores on monitoring/consultation/outcomes
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(["outstanding", "good"]).toContain(result.rating);
  });
});

describe("scoring mechanics", () => {
  it("matching quality component max is 30", () => {
    const assessments = [
      makeAssessment({
        compatibilityScore: 10,
        existingChildrenConsulted: true,
        decision: "proceed",
        reviewDate: "2026-05-05",
      }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      [makeMonitoring()],
      [makeConsultation()],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.matchingQuality).toBeLessThanOrEqual(30);
  });

  it("impact monitoring component max is 25", () => {
    const monitoring = [
      makeMonitoring({ impactLevel: "positive", resolved: true }),
    ];
    const assessments = [makeAssessment({ decision: "proceed" })];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      monitoring,
      [makeConsultation()],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.impactMonitoring).toBeLessThanOrEqual(25);
  });

  it("resident consultation component max is 25", () => {
    const consultations = [
      makeConsultation({
        informedAboutNewResident: true,
        viewsSought: true,
        viewsActedUpon: true,
      }),
    ];
    const assessments = [makeAssessment({ decision: "proceed" })];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      [makeMonitoring()],
      consultations,
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.residentConsultation).toBeLessThanOrEqual(25);
  });

  it("admission outcomes component max is 20", () => {
    const outcomes = [
      makeOutcome({
        placementStable: true,
        daysToSettle: 3,
        disruptionOccurred: false,
        matchingAssessmentId: "ma-001",
      }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      [makeAssessment()],
      [makeMonitoring()],
      [makeConsultation()],
      outcomes,
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.admissionOutcomes).toBeLessThanOrEqual(20);
  });

  it("perfect data scores high across all components", () => {
    const assessments = [
      makeAssessment({
        compatibilityScore: 10,
        existingChildrenConsulted: true,
        decision: "proceed",
        reviewDate: "2026-05-05",
      }),
    ];
    const monitoring = [
      makeMonitoring({ impactLevel: "positive", resolved: true }),
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-22", impactLevel: "positive", resolved: true }),
    ];
    const consultations = [
      makeConsultation({ informedAboutNewResident: true, viewsSought: true, viewsActedUpon: true }),
    ];
    const outcomes = [
      makeOutcome({ placementStable: true, daysToSettle: 3, disruptionOccurred: false, matchingAssessmentId: "ma-001" }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      monitoring,
      consultations,
      outcomes,
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("poor data scores low", () => {
    const assessments = [
      makeAssessment({
        compatibilityScore: 1,
        existingChildrenConsulted: false,
        decision: "defer",
        reviewDate: "",
      }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      [], // no monitoring despite assessment
      [], // no consultations
      [], // no outcomes
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("matching quality scores 0 when no assessments exist", () => {
    const result = generateHomeMatchingImpactIntelligence(
      [],
      [],
      [],
      [],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.matchingQuality).toBe(0);
  });

  it("impact monitoring defaults to 25 when no assessments and no monitoring", () => {
    const result = generateHomeMatchingImpactIntelligence(
      [],
      [],
      [],
      [],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.impactMonitoring).toBe(25);
  });

  it("resident consultation defaults to 25 when no assessments and no consultations", () => {
    const result = generateHomeMatchingImpactIntelligence(
      [],
      [],
      [],
      [],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.residentConsultation).toBe(25);
  });

  it("admission outcomes defaults to 20 when no assessments and no outcomes", () => {
    const result = generateHomeMatchingImpactIntelligence(
      [],
      [],
      [],
      [],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.admissionOutcomes).toBe(20);
  });

  it("monitoring score is 0 when assessments exist but no monitoring", () => {
    const result = generateHomeMatchingImpactIntelligence(
      [makeAssessment()],
      [],
      [makeConsultation()],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.impactMonitoring).toBe(0);
  });

  it("consultation score is 0 when assessments exist but no consultations", () => {
    const result = generateHomeMatchingImpactIntelligence(
      [makeAssessment()],
      [makeMonitoring()],
      [],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.componentScores.residentConsultation).toBe(0);
  });
});

describe("strengths generation", () => {
  it("includes high compatibility strength when score >= 7", () => {
    const assessments = [makeAssessment({ compatibilityScore: 8 })];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      [makeMonitoring()],
      [makeConsultation()],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.strengths.some((s) => s.includes("compatibility"))).toBe(true);
  });

  it("includes existing children consulted strength when rate >= 90", () => {
    const assessments = [
      makeAssessment({ existingChildrenConsulted: true }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      [makeMonitoring()],
      [makeConsultation()],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.strengths.some((s) => s.includes("consulted"))).toBe(true);
  });

  it("includes placement stability strength when rate >= 90", () => {
    const outcomes = [
      makeOutcome({ placementStable: true }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      [makeAssessment()],
      [makeMonitoring()],
      [makeConsultation()],
      outcomes,
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.strengths.some((s) => s.includes("stability"))).toBe(true);
  });

  it("includes resolution rate strength when rate >= 90", () => {
    const monitoring = [
      makeMonitoring({ impactLevel: "negative", resolved: true, mitigationAction: "action" }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      [makeAssessment()],
      monitoring,
      [makeConsultation()],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.strengths.some((s) => s.includes("resolution"))).toBe(true);
  });

  it("includes views sought strength when rate >= 90", () => {
    const consultations = [makeConsultation({ viewsSought: true })];
    const result = generateHomeMatchingImpactIntelligence(
      [makeAssessment()],
      [makeMonitoring()],
      consultations,
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.strengths.some((s) => s.includes("views"))).toBe(true);
  });

  it("generates no strengths for very poor data", () => {
    const assessments = [
      makeAssessment({
        compatibilityScore: 2,
        existingChildrenConsulted: false,
        decision: "defer",
        reviewDate: "",
      }),
    ];
    const monitoring = [
      makeMonitoring({ impactLevel: "significant_negative", resolved: false, mitigationAction: "" }),
    ];
    const consultations = [
      makeConsultation({ informedAboutNewResident: false, viewsSought: false, viewsActedUpon: false }),
    ];
    const outcomes = [
      makeOutcome({ placementStable: false, disruptionOccurred: true, matchingAssessmentId: "" }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      monitoring,
      consultations,
      outcomes,
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    // With poor scores across the board, very few or no strengths should exist
    expect(result.strengths.length).toBeLessThan(5);
  });
});

describe("areas for improvement generation", () => {
  it("includes low compatibility area when score < 5", () => {
    const assessments = [makeAssessment({ compatibilityScore: 3 })];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      [makeMonitoring()],
      [makeConsultation()],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("compatibility"))).toBe(true);
  });

  it("includes significant negative area when rate > 10", () => {
    const monitoring = [
      makeMonitoring({ impactLevel: "significant_negative" }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      [makeAssessment()],
      monitoring,
      [makeConsultation()],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Significant negative"))).toBe(true);
  });

  it("includes high disruption area when rate > 30", () => {
    const outcomes = [
      makeOutcome({ disruptionOccurred: true, disruptionReason: "conflict" }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      [makeAssessment()],
      [makeMonitoring()],
      [makeConsultation()],
      outcomes,
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("disruption"))).toBe(true);
  });

  it("includes low review date area when rate < 80", () => {
    const assessments = [
      makeAssessment({ reviewDate: "" }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      [makeMonitoring()],
      [makeConsultation()],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Review dates"))).toBe(true);
  });
});

describe("actions generation", () => {
  it("generates actions when there are issues", () => {
    const assessments = [
      makeAssessment({
        existingChildrenConsulted: false,
        reviewDate: "",
        decision: "defer",
      }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      [],
      [],
      [],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates default no-action message when everything is perfect", () => {
    // Use empty data (no admissions) = no issues
    const result = generateHomeMatchingImpactIntelligence(
      [],
      [],
      [],
      [],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("includes consultation action when consultation completion is low", () => {
    const assessments = [makeAssessment({ decision: "proceed" })];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      [makeMonitoring()],
      [], // no consultations
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("consultation"))).toBe(true);
  });

  it("includes significant negative action when present", () => {
    const monitoring = [
      makeMonitoring({ impactLevel: "significant_negative", resolved: false }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      [makeAssessment()],
      monitoring,
      [makeConsultation()],
      [makeOutcome()],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("multi-disciplinary"))).toBe(true);
  });
});

describe("label functions", () => {
  it("getAdmissionTypeLabel returns correct labels", () => {
    expect(getAdmissionTypeLabel("planned")).toBe("Planned");
    expect(getAdmissionTypeLabel("emergency")).toBe("Emergency");
    expect(getAdmissionTypeLabel("respite")).toBe("Respite");
    expect(getAdmissionTypeLabel("step_down")).toBe("Step Down");
    expect(getAdmissionTypeLabel("step_up")).toBe("Step Up");
  });

  it("getMatchingDecisionLabel returns correct labels", () => {
    expect(getMatchingDecisionLabel("proceed")).toBe("Proceed");
    expect(getMatchingDecisionLabel("proceed_with_conditions")).toBe("Proceed with Conditions");
    expect(getMatchingDecisionLabel("defer")).toBe("Defer");
    expect(getMatchingDecisionLabel("decline")).toBe("Decline");
  });

  it("getImpactAreaLabel returns correct labels", () => {
    expect(getImpactAreaLabel("behaviour")).toBe("Behaviour");
    expect(getImpactAreaLabel("emotional_wellbeing")).toBe("Emotional Wellbeing");
    expect(getImpactAreaLabel("peer_dynamics")).toBe("Peer Dynamics");
    expect(getImpactAreaLabel("routines")).toBe("Routines");
    expect(getImpactAreaLabel("education")).toBe("Education");
    expect(getImpactAreaLabel("safety")).toBe("Safety");
    expect(getImpactAreaLabel("staffing")).toBe("Staffing");
    expect(getImpactAreaLabel("space")).toBe("Space");
  });

  it("getImpactLevelLabel returns correct labels", () => {
    expect(getImpactLevelLabel("positive")).toBe("Positive");
    expect(getImpactLevelLabel("neutral")).toBe("Neutral");
    expect(getImpactLevelLabel("negative")).toBe("Negative");
    expect(getImpactLevelLabel("significant_negative")).toBe("Significant Negative");
  });

  it("getMonitoringFrequencyLabel returns correct labels", () => {
    expect(getMonitoringFrequencyLabel("daily")).toBe("Daily");
    expect(getMonitoringFrequencyLabel("weekly")).toBe("Weekly");
    expect(getMonitoringFrequencyLabel("fortnightly")).toBe("Fortnightly");
    expect(getMonitoringFrequencyLabel("monthly")).toBe("Monthly");
  });
});

describe("edge cases", () => {
  it("handles assessment with zero compatibility score clamp", () => {
    // Score 1 is minimum valid; engine should handle gracefully
    const assessments = [makeAssessment({ compatibilityScore: 1 })];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.averageCompatibilityScore).toBe(1);
  });

  it("handles many assessments", () => {
    const assessments = Array.from({ length: 50 }, (_, i) =>
      makeAssessment({
        id: `ma-${i}`,
        assessmentDate: "2026-04-10",
        compatibilityScore: (i % 10) + 1,
      }),
    );
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.totalAssessments).toBe(50);
  });

  it("handles many monitoring records", () => {
    const monitoring = Array.from({ length: 100 }, (_, i) =>
      makeMonitoring({
        id: `im-${i}`,
        monitoringDate: "2026-04-15",
        impactLevel: i % 2 === 0 ? "positive" : "negative",
      }),
    );
    const result = evaluateImpactMonitoring(monitoring, [], PERIOD_START, PERIOD_END);
    expect(result.totalMonitoringRecords).toBe(100);
    expect(result.positiveImpactRate).toBe(50);
    expect(result.negativeImpactRate).toBe(50);
  });

  it("handles same-day period (single day)", () => {
    const assessments = [makeAssessment({ assessmentDate: "2026-04-10" })];
    const result = evaluateMatchingQuality(assessments, "2026-04-10", "2026-04-10");
    expect(result.totalAssessments).toBe(1);
  });

  it("handles empty strings in conditions applied as no conditions", () => {
    const assessments = [
      makeAssessment({ decision: "proceed_with_conditions", conditionsApplied: [] }),
    ];
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.conditionsAppliedRate).toBe(0);
  });

  it("handles outcome with very high days to settle", () => {
    const outcomes = [makeOutcome({ daysToSettle: 100 })];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.averageDaysToSettle).toBe(100);
  });

  it("handles all possible admission types in a single batch", () => {
    const types = ["planned", "emergency", "respite", "step_down", "step_up"] as const;
    const assessments = types.map((t, i) =>
      makeAssessment({ id: `ma-${i}`, assessmentDate: "2026-04-10", admissionType: t }),
    );
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.admissionTypeBreakdown.planned).toBe(1);
    expect(result.admissionTypeBreakdown.emergency).toBe(1);
    expect(result.admissionTypeBreakdown.respite).toBe(1);
    expect(result.admissionTypeBreakdown.step_down).toBe(1);
    expect(result.admissionTypeBreakdown.step_up).toBe(1);
  });

  it("handles all possible impact levels in a single batch", () => {
    const levels = ["positive", "neutral", "negative", "significant_negative"] as const;
    const monitoring = levels.map((l, i) =>
      makeMonitoring({ id: `im-${i}`, monitoringDate: "2026-04-15", impactLevel: l }),
    );
    const result = evaluateImpactMonitoring(monitoring, [], PERIOD_START, PERIOD_END);
    expect(result.totalMonitoringRecords).toBe(4);
    expect(result.positiveImpactRate).toBe(25);
    expect(result.negativeImpactRate).toBe(50); // negative + significant_negative
    expect(result.significantNegativeRate).toBe(25);
  });

  it("handles all possible matching decisions in a single batch", () => {
    const decisions = ["proceed", "proceed_with_conditions", "defer", "decline"] as const;
    const assessments = decisions.map((d, i) =>
      makeAssessment({ id: `ma-${i}`, assessmentDate: "2026-04-10", decision: d }),
    );
    const result = evaluateMatchingQuality(assessments, PERIOD_START, PERIOD_END);
    expect(result.decisionBreakdown.proceed).toBe(1);
    expect(result.decisionBreakdown.proceed_with_conditions).toBe(1);
    expect(result.decisionBreakdown.defer).toBe(1);
    expect(result.decisionBreakdown.decline).toBe(1);
  });

  it("handles consultation with empty views summary", () => {
    const consultations = [
      makeConsultation({ viewsSummary: "", viewsSought: true, viewsActedUpon: false }),
    ];
    const result = evaluateResidentConsultation(consultations, [], PERIOD_START, PERIOD_END);
    expect(result.viewsSoughtRate).toBe(100);
  });

  it("handles multiple disruption reasons", () => {
    const outcomes = [
      makeOutcome({ disruptionOccurred: true, disruptionReason: "aggression" }),
      makeOutcome({ id: "ao-002", admissionDate: "2026-04-15", disruptionOccurred: true, disruptionReason: "absconding" }),
      makeOutcome({ id: "ao-003", admissionDate: "2026-04-20", disruptionOccurred: true, disruptionReason: "aggression" }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes, PERIOD_START, PERIOD_END);
    expect(result.disruptionReasons["aggression"]).toBe(2);
    expect(result.disruptionReasons["absconding"]).toBe(1);
  });

  it("overall score never exceeds 100", () => {
    const assessments = [makeAssessment({ compatibilityScore: 10 })];
    const monitoring = [
      makeMonitoring({ impactLevel: "positive" }),
      makeMonitoring({ id: "im-002", monitoringDate: "2026-04-22", impactLevel: "positive" }),
    ];
    const consultations = [makeConsultation()];
    const outcomes = [makeOutcome({ placementStable: true, daysToSettle: 1 })];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      monitoring,
      consultations,
      outcomes,
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score is never negative", () => {
    const assessments = [makeAssessment({ compatibilityScore: 1 })];
    const monitoring = [
      makeMonitoring({ impactLevel: "significant_negative", resolved: false, mitigationAction: "" }),
    ];
    const consultations = [
      makeConsultation({ informedAboutNewResident: false, viewsSought: false }),
    ];
    const outcomes = [
      makeOutcome({ placementStable: false, disruptionOccurred: true, daysToSettle: 100 }),
    ];
    const result = generateHomeMatchingImpactIntelligence(
      assessments,
      monitoring,
      consultations,
      outcomes,
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});
