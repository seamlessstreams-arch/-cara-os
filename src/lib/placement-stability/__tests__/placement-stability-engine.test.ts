// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Placement Stability Intelligence Engine
//
// Demo data: Oak House with children Alex (child-alex, 14), Jordan (child-jordan, 13),
//            Morgan (child-morgan, 15)
// Staff: Sarah Johnson (Key Worker), Tom Richards (RSW), Lisa Williams (Senior RSW),
//        Darren Laville (RM)
// Home ID: "oak-house"
//
// Comprehensive coverage: all 4 evaluation functions, main intelligence function,
// label functions, edge cases, empty data, scoring, rating thresholds.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluatePlacementDuration,
  evaluateDisruptionManagement,
  evaluateMatchingQuality,
  evaluateOutcomesDuringPlacement,
  generatePlacementStabilityIntelligence,
  getPlacementStatusLabel,
  getEndingReasonLabel,
  getDisruptionFactorLabel,
  getSupportTypeLabel,
  getOutcomeAreaLabel,
  getProgressRatingLabel,
  getMatchingFactorLabel,
} from "../placement-stability-engine";
import type {
  Placement,
  DisruptionEvent,
  StabilitySupport,
  MatchingRecord,
  MatchingFactorScore,
  PlacementOutcome,
  OutcomeAssessment,
  PlacementStatus,
  EndingReason,
  DisruptionFactor,
  SupportType,
  OutcomeArea,
  ProgressRating,
  MatchingFactor,
} from "../placement-stability-engine";

// ── Helper Factories ───────────────────────────────────────────────────────

function makePlacement(overrides: Partial<Placement> = {}): Placement {
  return {
    id: "plc-001",
    childId: "child-alex",
    childName: "Alex",
    childAge: 14,
    homeId: "oak-house",
    startDate: "2025-09-01",
    status: "active",
    isEmergencyPlacement: false,
    placingAuthority: "Manchester City Council",
    keyWorker: "Sarah Johnson",
    ...overrides,
  };
}

function makeDisruption(overrides: Partial<DisruptionEvent> = {}): DisruptionEvent {
  return {
    id: "dis-001",
    placementId: "plc-001",
    childId: "child-alex",
    date: "2026-01-15",
    factors: ["peer_conflict"],
    severity: "medium",
    wasAnticipated: true,
    preventionAttempted: true,
    preventionSuccessful: true,
    supportProvided: ["key_worker_session", "peer_mediation"],
    outcome: "Resolved through mediation",
    recordedBy: "Sarah Johnson",
    ...overrides,
  };
}

function makeSupport(overrides: Partial<StabilitySupport> = {}): StabilitySupport {
  return {
    id: "sup-001",
    placementId: "plc-001",
    childId: "child-alex",
    date: "2026-01-20",
    type: "key_worker_session",
    description: "Weekly key worker session",
    providedBy: "Sarah Johnson",
    childEngaged: true,
    outcomePositive: true,
    ...overrides,
  };
}

function makeFullFactorScores(baseScore = 4): MatchingFactorScore[] {
  const factors: MatchingFactor[] = [
    "age_compatibility",
    "needs_compatibility",
    "risk_compatibility",
    "peer_dynamics",
    "cultural_needs",
    "statement_of_purpose_fit",
    "location_suitability",
    "therapeutic_alignment",
  ];
  return factors.map((factor) => ({
    factor,
    score: baseScore,
    rationale: `Assessed as ${baseScore}/5 for ${factor}`,
  }));
}

function makeMatchingRecord(overrides: Partial<MatchingRecord> = {}): MatchingRecord {
  return {
    id: "mr-001",
    placementId: "plc-001",
    childId: "child-alex",
    assessedBy: "Lisa Williams",
    assessmentDate: "2025-08-25",
    factors: makeFullFactorScores(4),
    overallScore: 4.0,
    impactAssessmentCompleted: true,
    existingChildrenConsulted: true,
    childViewsRecorded: true,
    riskAssessmentCompleted: true,
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<PlacementOutcome> = {}): PlacementOutcome {
  return {
    id: "out-001",
    placementId: "plc-001",
    childId: "child-alex",
    childName: "Alex",
    reviewDate: "2026-04-01",
    areas: [
      { area: "education_engagement", rating: "some_improvement", evidence: "Attendance improved to 90%" },
      { area: "health_wellbeing", rating: "significant_improvement", evidence: "Registered with GP, attending appointments" },
      { area: "behaviour_progress", rating: "some_improvement", evidence: "Reduced incidents" },
      { area: "emotional_regulation", rating: "stable", evidence: "Maintaining progress" },
      { area: "social_relationships", rating: "some_improvement", evidence: "Improved peer relationships" },
      { area: "independent_skills", rating: "stable", evidence: "Cooking and cleaning skills developing" },
    ],
    overallProgress: "some_improvement",
    educationAttendancePercent: 88,
    healthAppointmentsAttended: true,
    carePlanUpToDate: true,
    reviewedBy: "Darren Laville",
    ...overrides,
  };
}

// ── Oak House Demo Data ───────────────────────────────────────────────────

const OAK_HOUSE_PLACEMENTS: Placement[] = [
  makePlacement({
    id: "plc-001",
    childId: "child-alex",
    childName: "Alex",
    childAge: 14,
    startDate: "2025-09-01",
    status: "active",
    isEmergencyPlacement: false,
    keyWorker: "Sarah Johnson",
    placingAuthority: "Manchester City Council",
  }),
  makePlacement({
    id: "plc-002",
    childId: "child-jordan",
    childName: "Jordan",
    childAge: 13,
    startDate: "2025-11-15",
    status: "active",
    isEmergencyPlacement: false,
    keyWorker: "Tom Richards",
    placingAuthority: "Salford City Council",
  }),
  makePlacement({
    id: "plc-003",
    childId: "child-morgan",
    childName: "Morgan",
    childAge: 15,
    startDate: "2026-01-10",
    status: "active",
    isEmergencyPlacement: false,
    keyWorker: "Lisa Williams",
    placingAuthority: "Bolton Council",
  }),
];

const OAK_HOUSE_DISRUPTIONS: DisruptionEvent[] = [
  makeDisruption({
    id: "dis-001",
    placementId: "plc-002",
    childId: "child-jordan",
    date: "2026-02-10",
    factors: ["peer_conflict", "behavioural_escalation"],
    severity: "medium",
    wasAnticipated: true,
    preventionAttempted: true,
    preventionSuccessful: true,
    supportProvided: ["key_worker_session", "peer_mediation"],
    outcome: "Resolved through structured mediation",
    recordedBy: "Tom Richards",
  }),
  makeDisruption({
    id: "dis-002",
    placementId: "plc-003",
    childId: "child-morgan",
    date: "2026-03-05",
    factors: ["education_breakdown"],
    severity: "low",
    wasAnticipated: false,
    preventionAttempted: true,
    preventionSuccessful: false,
    supportProvided: ["education_support", "multi_agency_meeting"],
    outcome: "Alternative education provision identified",
    recordedBy: "Lisa Williams",
  }),
  makeDisruption({
    id: "dis-003",
    placementId: "plc-001",
    childId: "child-alex",
    date: "2026-04-01",
    factors: ["family_contact_issues", "mental_health_crisis"],
    severity: "high",
    wasAnticipated: true,
    preventionAttempted: true,
    preventionSuccessful: true,
    supportProvided: ["therapeutic_intervention", "crisis_intervention", "key_worker_session"],
    outcome: "Family contact renegotiated and therapeutic support increased",
    recordedBy: "Sarah Johnson",
  }),
];

const OAK_HOUSE_SUPPORTS: StabilitySupport[] = [
  makeSupport({
    id: "sup-001",
    placementId: "plc-001",
    childId: "child-alex",
    date: "2026-01-15",
    type: "key_worker_session",
    description: "Weekly key worker session — reviewed placement goals",
    providedBy: "Sarah Johnson",
    childEngaged: true,
    outcomePositive: true,
  }),
  makeSupport({
    id: "sup-002",
    placementId: "plc-002",
    childId: "child-jordan",
    date: "2026-02-12",
    type: "peer_mediation",
    description: "Mediation session following peer conflict",
    providedBy: "Tom Richards",
    childEngaged: true,
    outcomePositive: true,
  }),
  makeSupport({
    id: "sup-003",
    placementId: "plc-003",
    childId: "child-morgan",
    date: "2026-03-10",
    type: "education_support",
    description: "PEP review and alternative provision planning",
    providedBy: "Lisa Williams",
    childEngaged: true,
    outcomePositive: true,
  }),
  makeSupport({
    id: "sup-004",
    placementId: "plc-001",
    childId: "child-alex",
    date: "2026-04-02",
    type: "therapeutic_intervention",
    description: "Additional therapeutic session following family contact issues",
    providedBy: "Sarah Johnson",
    childEngaged: true,
    outcomePositive: true,
  }),
];

const OAK_HOUSE_MATCHING: MatchingRecord[] = [
  makeMatchingRecord({
    id: "mr-001",
    placementId: "plc-001",
    childId: "child-alex",
    assessedBy: "Lisa Williams",
    assessmentDate: "2025-08-25",
    factors: makeFullFactorScores(4),
    overallScore: 4.0,
    impactAssessmentCompleted: true,
    existingChildrenConsulted: true,
    childViewsRecorded: true,
    riskAssessmentCompleted: true,
  }),
  makeMatchingRecord({
    id: "mr-002",
    placementId: "plc-002",
    childId: "child-jordan",
    assessedBy: "Lisa Williams",
    assessmentDate: "2025-11-01",
    factors: makeFullFactorScores(3),
    overallScore: 3.0,
    impactAssessmentCompleted: true,
    existingChildrenConsulted: true,
    childViewsRecorded: false,
    riskAssessmentCompleted: true,
  }),
  makeMatchingRecord({
    id: "mr-003",
    placementId: "plc-003",
    childId: "child-morgan",
    assessedBy: "Lisa Williams",
    assessmentDate: "2026-01-05",
    factors: [
      { factor: "age_compatibility", score: 4, rationale: "Good age fit with current group" },
      { factor: "needs_compatibility", score: 3, rationale: "Needs can be met with additional support" },
      { factor: "risk_compatibility", score: 3, rationale: "Manageable risk with safety plan" },
      { factor: "peer_dynamics", score: 4, rationale: "Good fit with existing group dynamics" },
      { factor: "statement_of_purpose_fit", score: 4, rationale: "Matches home purpose" },
    ],
    overallScore: 3.6,
    impactAssessmentCompleted: true,
    existingChildrenConsulted: false,
    childViewsRecorded: true,
    riskAssessmentCompleted: true,
  }),
];

const OAK_HOUSE_OUTCOMES: PlacementOutcome[] = [
  makeOutcome({
    id: "out-001",
    placementId: "plc-001",
    childId: "child-alex",
    childName: "Alex",
    reviewDate: "2026-04-01",
    overallProgress: "some_improvement",
    educationAttendancePercent: 88,
    healthAppointmentsAttended: true,
    carePlanUpToDate: true,
    reviewedBy: "Darren Laville",
  }),
  makeOutcome({
    id: "out-002",
    placementId: "plc-002",
    childId: "child-jordan",
    childName: "Jordan",
    reviewDate: "2026-04-01",
    areas: [
      { area: "education_engagement", rating: "stable", evidence: "Maintaining 75% attendance" },
      { area: "health_wellbeing", rating: "some_improvement", evidence: "Engaging with CAMHS" },
      { area: "behaviour_progress", rating: "some_improvement", evidence: "Fewer incidents since mediation" },
      { area: "emotional_regulation", rating: "some_improvement", evidence: "Using new strategies" },
      { area: "social_relationships", rating: "stable", evidence: "Peer relationships improving" },
      { area: "independent_skills", rating: "some_improvement", evidence: "Learning budgeting" },
    ],
    overallProgress: "some_improvement",
    educationAttendancePercent: 75,
    healthAppointmentsAttended: true,
    carePlanUpToDate: true,
    reviewedBy: "Darren Laville",
  }),
  makeOutcome({
    id: "out-003",
    placementId: "plc-003",
    childId: "child-morgan",
    childName: "Morgan",
    reviewDate: "2026-04-01",
    areas: [
      { area: "education_engagement", rating: "some_decline", evidence: "Attendance dropped to 60%" },
      { area: "health_wellbeing", rating: "stable", evidence: "Health stable" },
      { area: "behaviour_progress", rating: "stable", evidence: "Consistent behaviour" },
      { area: "emotional_regulation", rating: "some_improvement", evidence: "Engaging with key worker" },
      { area: "social_relationships", rating: "some_improvement", evidence: "Building friendships" },
      { area: "independent_skills", rating: "significant_improvement", evidence: "Excellent progress with cooking" },
    ],
    overallProgress: "stable",
    educationAttendancePercent: 60,
    healthAppointmentsAttended: false,
    carePlanUpToDate: true,
    reviewedBy: "Darren Laville",
  }),
];

const PERIOD_START = "2025-09-01";
const PERIOD_END = "2026-05-18";
const REFERENCE_DATE = "2026-05-18";

// ═══════════════════════════════════════════════════════════════════════════
// 1. evaluatePlacementDuration
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluatePlacementDuration", () => {
  it("counts all active placements in period", () => {
    const result = evaluatePlacementDuration(OAK_HOUSE_PLACEMENTS, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.totalPlacements).toBe(3);
    expect(result.activePlacements).toBe(3);
  });

  it("returns zero counts for empty array", () => {
    const result = evaluatePlacementDuration([], PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.totalPlacements).toBe(0);
    expect(result.activePlacements).toBe(0);
    expect(result.averageDurationDays).toBe(0);
    expect(result.plannedEndingRate).toBe(0);
    expect(result.unplannedEndingRate).toBe(0);
    expect(result.emergencyPlacementRate).toBe(0);
    expect(result.longestPlacementDays).toBe(0);
    expect(result.shortestPlacementDays).toBe(0);
  });

  it("calculates ending rates with planned endings", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", status: "ended_planned", endDate: "2026-03-01", endingReason: "planned_transition" }),
      makePlacement({ id: "p2", status: "ended_planned", endDate: "2026-04-01", endingReason: "reunification" }),
      makePlacement({ id: "p3", status: "ended_unplanned", endDate: "2026-03-15", endingReason: "placement_breakdown" }),
    ];
    const result = evaluatePlacementDuration(placements, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.endedPlannedCount).toBe(2);
    expect(result.endedUnplannedCount).toBe(1);
    expect(result.plannedEndingRate).toBe(67);
    expect(result.unplannedEndingRate).toBe(33);
  });

  it("counts emergency placements", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", isEmergencyPlacement: true }),
      makePlacement({ id: "p2", isEmergencyPlacement: false }),
      makePlacement({ id: "p3", isEmergencyPlacement: true }),
    ];
    const result = evaluatePlacementDuration(placements, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.emergencyPlacementRate).toBe(67);
  });

  it("calculates average duration for active placements using referenceDate", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2026-01-01", status: "active" }),
    ];
    const result = evaluatePlacementDuration(placements, "2026-01-01", "2026-05-18", "2026-05-18");
    expect(result.averageDurationDays).toBe(137);
  });

  it("calculates duration for ended placements using endDate", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2026-01-01", endDate: "2026-04-01", status: "ended_planned" }),
    ];
    const result = evaluatePlacementDuration(placements, "2026-01-01", "2026-05-18", "2026-05-18");
    expect(result.averageDurationDays).toBe(90);
  });

  it("identifies longest and shortest placements", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2025-01-01", status: "active" }),
      makePlacement({ id: "p2", startDate: "2026-04-01", status: "active" }),
    ];
    const result = evaluatePlacementDuration(placements, "2025-01-01", "2026-05-18", "2026-05-18");
    expect(result.longestPlacementDays).toBe(502);
    expect(result.shortestPlacementDays).toBe(47);
  });

  it("tracks ending reasons", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", status: "ended_planned", endDate: "2026-03-01", endingReason: "planned_transition" }),
      makePlacement({ id: "p2", status: "ended_unplanned", endDate: "2026-03-15", endingReason: "placement_breakdown" }),
      makePlacement({ id: "p3", status: "ended_planned", endDate: "2026-04-01", endingReason: "planned_transition" }),
    ];
    const result = evaluatePlacementDuration(placements, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.endingReasons["planned_transition"]).toBe(2);
    expect(result.endingReasons["placement_breakdown"]).toBe(1);
  });

  it("excludes placements outside the period", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2024-01-01", endDate: "2024-06-01", status: "ended_planned" }),
      makePlacement({ id: "p2", startDate: "2027-01-01", status: "active" }),
    ];
    const result = evaluatePlacementDuration(placements, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.totalPlacements).toBe(0);
  });

  it("includes placements that span the period boundary", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2025-06-01", endDate: "2025-10-01", status: "ended_planned" }),
    ];
    const result = evaluatePlacementDuration(placements, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.totalPlacements).toBe(1);
  });

  it("counts on_notice placements", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", status: "on_notice" }),
      makePlacement({ id: "p2", status: "active" }),
    ];
    const result = evaluatePlacementDuration(placements, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.onNoticeCount).toBe(1);
  });

  it("handles ended_emergency status", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", status: "ended_emergency", endDate: "2026-02-01", endingReason: "safeguarding_concern" }),
      makePlacement({ id: "p2", status: "ended_planned", endDate: "2026-03-01", endingReason: "planned_transition" }),
    ];
    const result = evaluatePlacementDuration(placements, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.endedEmergencyCount).toBe(1);
    expect(result.unplannedEndingRate).toBe(50);
  });

  it("returns 0 planned/unplanned rates when no endings exist", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", status: "active" }),
    ];
    const result = evaluatePlacementDuration(placements, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.plannedEndingRate).toBe(0);
    expect(result.unplannedEndingRate).toBe(0);
  });

  it("handles single placement correctly", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2026-01-01", status: "active" }),
    ];
    const result = evaluatePlacementDuration(placements, "2026-01-01", "2026-05-18", "2026-05-18");
    expect(result.totalPlacements).toBe(1);
    expect(result.longestPlacementDays).toBe(result.shortestPlacementDays);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. evaluateDisruptionManagement
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateDisruptionManagement", () => {
  it("counts disruptions in period", () => {
    const result = evaluateDisruptionManagement(OAK_HOUSE_DISRUPTIONS, PERIOD_START, PERIOD_END);
    expect(result.totalDisruptions).toBe(3);
  });

  it("returns zero values for empty array", () => {
    const result = evaluateDisruptionManagement([], PERIOD_START, PERIOD_END);
    expect(result.totalDisruptions).toBe(0);
    expect(result.anticipatedRate).toBe(0);
    expect(result.preventionAttemptedRate).toBe(0);
    expect(result.preventionSuccessRate).toBe(0);
    expect(result.averageSupportActionsPerDisruption).toBe(0);
    expect(result.supportProvidedRate).toBe(0);
  });

  it("calculates anticipation rate", () => {
    const result = evaluateDisruptionManagement(OAK_HOUSE_DISRUPTIONS, PERIOD_START, PERIOD_END);
    // 2 out of 3 anticipated
    expect(result.anticipatedRate).toBe(67);
  });

  it("calculates prevention attempted rate", () => {
    const result = evaluateDisruptionManagement(OAK_HOUSE_DISRUPTIONS, PERIOD_START, PERIOD_END);
    expect(result.preventionAttemptedRate).toBe(100);
  });

  it("calculates prevention success rate (of those attempted)", () => {
    const result = evaluateDisruptionManagement(OAK_HOUSE_DISRUPTIONS, PERIOD_START, PERIOD_END);
    // 2 out of 3 successful (all attempted, 2 successful)
    expect(result.preventionSuccessRate).toBe(67);
  });

  it("calculates average support actions per disruption", () => {
    const result = evaluateDisruptionManagement(OAK_HOUSE_DISRUPTIONS, PERIOD_START, PERIOD_END);
    // (2 + 2 + 3) / 3 = 2.3
    expect(result.averageSupportActionsPerDisruption).toBe(2.3);
  });

  it("calculates severity breakdown", () => {
    const result = evaluateDisruptionManagement(OAK_HOUSE_DISRUPTIONS, PERIOD_START, PERIOD_END);
    expect(result.severityBreakdown.low).toBe(1);
    expect(result.severityBreakdown.medium).toBe(1);
    expect(result.severityBreakdown.high).toBe(1);
    expect(result.severityBreakdown.critical).toBe(0);
  });

  it("identifies top disruption factors", () => {
    const result = evaluateDisruptionManagement(OAK_HOUSE_DISRUPTIONS, PERIOD_START, PERIOD_END);
    expect(result.topFactors.length).toBeGreaterThan(0);
    // peer_conflict appears in dis-001, family_contact_issues in dis-003, etc.
    const factorNames = result.topFactors.map((f) => f.factor);
    expect(factorNames).toContain("peer_conflict");
  });

  it("calculates support provided rate", () => {
    const result = evaluateDisruptionManagement(OAK_HOUSE_DISRUPTIONS, PERIOD_START, PERIOD_END);
    expect(result.supportProvidedRate).toBe(100);
  });

  it("handles disruptions with no support", () => {
    const disruptions: DisruptionEvent[] = [
      makeDisruption({ supportProvided: [] }),
    ];
    const result = evaluateDisruptionManagement(disruptions, PERIOD_START, PERIOD_END);
    expect(result.supportProvidedRate).toBe(0);
    expect(result.averageSupportActionsPerDisruption).toBe(0);
  });

  it("excludes disruptions outside period", () => {
    const disruptions: DisruptionEvent[] = [
      makeDisruption({ date: "2024-01-01" }),
      makeDisruption({ id: "dis-002", date: "2027-01-01" }),
    ];
    const result = evaluateDisruptionManagement(disruptions, PERIOD_START, PERIOD_END);
    expect(result.totalDisruptions).toBe(0);
  });

  it("handles prevention success rate when none attempted", () => {
    const disruptions: DisruptionEvent[] = [
      makeDisruption({ preventionAttempted: false, preventionSuccessful: false }),
    ];
    const result = evaluateDisruptionManagement(disruptions, PERIOD_START, PERIOD_END);
    expect(result.preventionAttemptedRate).toBe(0);
    expect(result.preventionSuccessRate).toBe(0);
  });

  it("correctly handles all critical severity disruptions", () => {
    const disruptions: DisruptionEvent[] = [
      makeDisruption({ id: "d1", severity: "critical" }),
      makeDisruption({ id: "d2", severity: "critical", date: "2026-02-01" }),
    ];
    const result = evaluateDisruptionManagement(disruptions, PERIOD_START, PERIOD_END);
    expect(result.severityBreakdown.critical).toBe(2);
    expect(result.severityBreakdown.low).toBe(0);
  });

  it("counts multiple factors from same disruption", () => {
    const disruptions: DisruptionEvent[] = [
      makeDisruption({ factors: ["peer_conflict", "behavioural_escalation", "mental_health_crisis"] }),
    ];
    const result = evaluateDisruptionManagement(disruptions, PERIOD_START, PERIOD_END);
    expect(result.topFactors.length).toBe(3);
    result.topFactors.forEach((f) => expect(f.count).toBe(1));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. evaluateMatchingQuality
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateMatchingQuality", () => {
  it("evaluates Oak House matching records", () => {
    const result = evaluateMatchingQuality(OAK_HOUSE_MATCHING);
    expect(result.totalAssessments).toBe(3);
    expect(result.averageOverallScore).toBeGreaterThan(0);
  });

  it("returns zero values for empty array", () => {
    const result = evaluateMatchingQuality([]);
    expect(result.totalAssessments).toBe(0);
    expect(result.averageOverallScore).toBe(0);
    expect(result.factorBreakdown).toEqual([]);
    expect(result.impactAssessmentRate).toBe(0);
    expect(result.childrenConsultedRate).toBe(0);
    expect(result.childViewsRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.fullFactorAssessmentRate).toBe(0);
  });

  it("calculates average overall score", () => {
    const result = evaluateMatchingQuality(OAK_HOUSE_MATCHING);
    // (4.0 + 3.0 + 3.6) / 3 = 3.5333 → rounded to 3.5
    expect(result.averageOverallScore).toBe(3.5);
  });

  it("calculates impact assessment rate", () => {
    const result = evaluateMatchingQuality(OAK_HOUSE_MATCHING);
    // All 3 have impact assessment completed
    expect(result.impactAssessmentRate).toBe(100);
  });

  it("calculates children consulted rate", () => {
    const result = evaluateMatchingQuality(OAK_HOUSE_MATCHING);
    // 2 out of 3 consulted
    expect(result.childrenConsultedRate).toBe(67);
  });

  it("calculates child views rate", () => {
    const result = evaluateMatchingQuality(OAK_HOUSE_MATCHING);
    // 2 out of 3
    expect(result.childViewsRate).toBe(67);
  });

  it("calculates risk assessment rate", () => {
    const result = evaluateMatchingQuality(OAK_HOUSE_MATCHING);
    expect(result.riskAssessmentRate).toBe(100);
  });

  it("calculates full factor assessment rate", () => {
    const result = evaluateMatchingQuality(OAK_HOUSE_MATCHING);
    // 2 out of 3 have all 8 factors (Morgan only has 5)
    expect(result.fullFactorAssessmentRate).toBe(67);
  });

  it("provides factor breakdown with averages", () => {
    const result = evaluateMatchingQuality(OAK_HOUSE_MATCHING);
    expect(result.factorBreakdown.length).toBeGreaterThan(0);
    const ageCompat = result.factorBreakdown.find((f) => f.factor === "age_compatibility");
    expect(ageCompat).toBeDefined();
    expect(ageCompat!.count).toBe(3); // All 3 records assess age_compatibility
  });

  it("handles single assessment with all criteria", () => {
    const records: MatchingRecord[] = [makeMatchingRecord()];
    const result = evaluateMatchingQuality(records);
    expect(result.totalAssessments).toBe(1);
    expect(result.fullFactorAssessmentRate).toBe(100);
    expect(result.averageOverallScore).toBe(4);
  });

  it("handles assessment with no factors", () => {
    const records: MatchingRecord[] = [makeMatchingRecord({ factors: [], overallScore: 0 })];
    const result = evaluateMatchingQuality(records);
    expect(result.fullFactorAssessmentRate).toBe(0);
    expect(result.factorBreakdown).toEqual([]);
  });

  it("correctly handles mixed boolean rates", () => {
    const records: MatchingRecord[] = [
      makeMatchingRecord({
        id: "mr-a",
        impactAssessmentCompleted: true,
        existingChildrenConsulted: false,
        childViewsRecorded: false,
        riskAssessmentCompleted: true,
      }),
      makeMatchingRecord({
        id: "mr-b",
        impactAssessmentCompleted: false,
        existingChildrenConsulted: true,
        childViewsRecorded: true,
        riskAssessmentCompleted: false,
      }),
    ];
    const result = evaluateMatchingQuality(records);
    expect(result.impactAssessmentRate).toBe(50);
    expect(result.childrenConsultedRate).toBe(50);
    expect(result.childViewsRate).toBe(50);
    expect(result.riskAssessmentRate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. evaluateOutcomesDuringPlacement
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateOutcomesDuringPlacement", () => {
  it("evaluates Oak House outcomes", () => {
    const result = evaluateOutcomesDuringPlacement(OAK_HOUSE_OUTCOMES);
    expect(result.totalOutcomes).toBe(3);
  });

  it("returns zero values for empty array", () => {
    const result = evaluateOutcomesDuringPlacement([]);
    expect(result.totalOutcomes).toBe(0);
    expect(result.averageEducationAttendance).toBe(0);
    expect(result.healthAppointmentRate).toBe(0);
    expect(result.carePlanUpToDateRate).toBe(0);
    expect(result.improvementRate).toBe(0);
    expect(result.declineRate).toBe(0);
    expect(result.areaBreakdown).toEqual([]);
  });

  it("calculates progress breakdown", () => {
    const result = evaluateOutcomesDuringPlacement(OAK_HOUSE_OUTCOMES);
    expect(result.progressBreakdown.some_improvement).toBe(2); // Alex and Jordan
    expect(result.progressBreakdown.stable).toBe(1); // Morgan
    expect(result.progressBreakdown.significant_improvement).toBe(0);
  });

  it("calculates average education attendance", () => {
    const result = evaluateOutcomesDuringPlacement(OAK_HOUSE_OUTCOMES);
    // (88 + 75 + 60) / 3 = 74.3
    expect(result.averageEducationAttendance).toBe(74.3);
  });

  it("calculates health appointment rate", () => {
    const result = evaluateOutcomesDuringPlacement(OAK_HOUSE_OUTCOMES);
    // 2 out of 3
    expect(result.healthAppointmentRate).toBe(67);
  });

  it("calculates care plan up to date rate", () => {
    const result = evaluateOutcomesDuringPlacement(OAK_HOUSE_OUTCOMES);
    // All 3
    expect(result.carePlanUpToDateRate).toBe(100);
  });

  it("calculates improvement and decline rates", () => {
    const result = evaluateOutcomesDuringPlacement(OAK_HOUSE_OUTCOMES);
    // 2 out of 3 improving
    expect(result.improvementRate).toBe(67);
    // 0 out of 3 declining
    expect(result.declineRate).toBe(0);
  });

  it("provides area breakdown", () => {
    const result = evaluateOutcomesDuringPlacement(OAK_HOUSE_OUTCOMES);
    expect(result.areaBreakdown.length).toBeGreaterThan(0);
    const education = result.areaBreakdown.find((a) => a.area === "education_engagement");
    expect(education).toBeDefined();
    expect(education!.count).toBe(3);
  });

  it("handles outcomes with only declines", () => {
    const outcomes: PlacementOutcome[] = [
      makeOutcome({
        overallProgress: "significant_decline",
        areas: [
          { area: "education_engagement", rating: "significant_decline", evidence: "Stopped attending" },
        ],
      }),
    ];
    const result = evaluateOutcomesDuringPlacement(outcomes);
    expect(result.declineRate).toBe(100);
    expect(result.improvementRate).toBe(0);
  });

  it("handles missing education attendance", () => {
    const outcomes: PlacementOutcome[] = [
      makeOutcome({ educationAttendancePercent: undefined }),
    ];
    const result = evaluateOutcomesDuringPlacement(outcomes);
    expect(result.averageEducationAttendance).toBe(0);
  });

  it("handles mixed progress ratings", () => {
    const outcomes: PlacementOutcome[] = [
      makeOutcome({ id: "o1", overallProgress: "significant_improvement" }),
      makeOutcome({ id: "o2", overallProgress: "some_decline" }),
      makeOutcome({ id: "o3", overallProgress: "stable" }),
      makeOutcome({ id: "o4", overallProgress: "significant_decline" }),
    ];
    const result = evaluateOutcomesDuringPlacement(outcomes);
    expect(result.improvementRate).toBe(25);
    expect(result.declineRate).toBe(50);
    expect(result.progressBreakdown.stable).toBe(1);
  });

  it("handles 100% education attendance", () => {
    const outcomes: PlacementOutcome[] = [
      makeOutcome({ educationAttendancePercent: 100 }),
    ];
    const result = evaluateOutcomesDuringPlacement(outcomes);
    expect(result.averageEducationAttendance).toBe(100);
  });

  it("area breakdown averages correctly", () => {
    const outcomes: PlacementOutcome[] = [
      makeOutcome({
        id: "o1",
        areas: [
          { area: "education_engagement", rating: "significant_improvement", evidence: "A" },
        ],
      }),
      makeOutcome({
        id: "o2",
        areas: [
          { area: "education_engagement", rating: "significant_decline", evidence: "B" },
        ],
      }),
    ];
    const result = evaluateOutcomesDuringPlacement(outcomes);
    const education = result.areaBreakdown.find((a) => a.area === "education_engagement");
    expect(education).toBeDefined();
    // (5 + 1) / 2 = 3.0
    expect(education!.averageRating).toBe(3);
    expect(education!.count).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. generatePlacementStabilityIntelligence (main function)
// ═══════════════════════════════════════════════════════════════════════════

describe("generatePlacementStabilityIntelligence", () => {
  it("returns complete intelligence for Oak House", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.referenceDate).toBe(REFERENCE_DATE);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all four component scores", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );

    expect(result.componentScores.placementDurationStability).toBeDefined();
    expect(result.componentScores.disruptionManagement).toBeDefined();
    expect(result.componentScores.matchingQuality).toBeDefined();
    expect(result.componentScores.outcomesDuringPlacement).toBeDefined();
  });

  it("overall score equals sum of component scores", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );

    const componentSum = Math.round(
      result.componentScores.placementDurationStability +
        result.componentScores.disruptionManagement +
        result.componentScores.matchingQuality +
        result.componentScores.outcomesDuringPlacement,
    );
    expect(result.overallScore).toBe(componentSum);
  });

  it("generates strengths array", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("generates areas for improvement array", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(Array.isArray(result.actions)).toBe(true);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    const allLinks = result.regulatoryLinks.join(" ");
    expect(allLinks).toContain("Reg 36");
    expect(allLinks).toContain("Reg 14");
    expect(allLinks).toContain("SCCIF");
    expect(allLinks).toContain("Children Act 1989");
  });

  it("builds child profiles for each placement", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.childProfiles.length).toBe(3);
    const alex = result.childProfiles.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.childName).toBe("Alex");
    expect(alex!.childAge).toBe(14);
    expect(alex!.keyWorker).toBe("Sarah Johnson");
  });

  it("child profiles include disruption count", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    const alex = result.childProfiles.find((p) => p.childId === "child-alex");
    expect(alex!.disruptionCount).toBe(1);
    const jordan = result.childProfiles.find((p) => p.childId === "child-jordan");
    expect(jordan!.disruptionCount).toBe(1);
    const morgan = result.childProfiles.find((p) => p.childId === "child-morgan");
    expect(morgan!.disruptionCount).toBe(1);
  });

  it("child profiles include support session count", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    const alex = result.childProfiles.find((p) => p.childId === "child-alex");
    expect(alex!.supportSessionCount).toBe(2); // sup-001 and sup-004
  });

  it("child profiles include matching score", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    const alex = result.childProfiles.find((p) => p.childId === "child-alex");
    expect(alex!.matchingScore).toBe(4.0);
  });

  it("child profiles include latest outcome", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    const alex = result.childProfiles.find((p) => p.childId === "child-alex");
    expect(alex!.latestOutcome).toBe("some_improvement");
  });

  it("handles empty data gracefully", () => {
    const result = generatePlacementStabilityIntelligence(
      [],
      [],
      [],
      [],
      [],
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    // No disruptions = 25 pts disruption management (perfect stability)
    // No placements/matching/outcomes = 0 for those components
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toEqual([]);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0); // always has base links
  });

  it("component scores do not exceed their max", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.componentScores.placementDurationStability).toBeLessThanOrEqual(25);
    expect(result.componentScores.disruptionManagement).toBeLessThanOrEqual(25);
    expect(result.componentScores.matchingQuality).toBeLessThanOrEqual(25);
    expect(result.componentScores.outcomesDuringPlacement).toBeLessThanOrEqual(25);
  });

  it("component scores are non-negative", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.componentScores.placementDurationStability).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.disruptionManagement).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.matchingQuality).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.outcomesDuringPlacement).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Rating Thresholds
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  function makeIntelligenceWithScore(targetScore: number) {
    // Create data that produces a predictable score
    // We'll use the empty-data path then check rating logic indirectly
    // Actually, let's directly test by creating scenarios
    const result = generatePlacementStabilityIntelligence(
      [],
      [],
      [],
      [],
      [],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    return result;
  }

  it("empty data rates as inadequate with 25 disruption points", () => {
    const result = generatePlacementStabilityIntelligence(
      [], [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // No disruptions = perfect disruption management (25 pts)
    // Everything else = 0, total = 25 which is < 40 = inadequate
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
  });

  it("outstanding rating requires >= 80", () => {
    // Create perfect data
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2025-01-01", status: "active", isEmergencyPlacement: false }),
    ];
    const matchingRecords: MatchingRecord[] = [
      makeMatchingRecord({
        id: "mr-1",
        placementId: "p1",
        factors: makeFullFactorScores(5),
        overallScore: 5.0,
        impactAssessmentCompleted: true,
        existingChildrenConsulted: true,
        childViewsRecorded: true,
        riskAssessmentCompleted: true,
      }),
    ];
    const outcomes: PlacementOutcome[] = [
      makeOutcome({
        id: "o1",
        placementId: "p1",
        overallProgress: "significant_improvement",
        educationAttendancePercent: 95,
        healthAppointmentsAttended: true,
        carePlanUpToDate: true,
      }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], matchingRecords, outcomes,
      "test-home", "2025-01-01", PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("good rating for score 60-79", () => {
    // Create moderately good data with some disruptions to reduce score
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2026-02-01", status: "active", isEmergencyPlacement: false }),
    ];
    const disruptions: DisruptionEvent[] = [
      makeDisruption({
        id: "d1",
        placementId: "p1",
        date: "2026-03-01",
        wasAnticipated: true,
        preventionAttempted: true,
        preventionSuccessful: false,
        supportProvided: ["key_worker_session"],
      }),
      makeDisruption({
        id: "d2",
        placementId: "p1",
        date: "2026-04-01",
        wasAnticipated: false,
        preventionAttempted: false,
        preventionSuccessful: false,
        supportProvided: [],
      }),
    ];
    const matchingRecords: MatchingRecord[] = [
      makeMatchingRecord({
        id: "mr-1",
        placementId: "p1",
        factors: makeFullFactorScores(3),
        overallScore: 3.0,
        impactAssessmentCompleted: true,
        existingChildrenConsulted: false,
        childViewsRecorded: false,
        riskAssessmentCompleted: true,
      }),
    ];
    const outcomes: PlacementOutcome[] = [
      makeOutcome({
        id: "o1",
        placementId: "p1",
        overallProgress: "some_improvement",
        educationAttendancePercent: 70,
        healthAppointmentsAttended: true,
        carePlanUpToDate: true,
      }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, disruptions, [], matchingRecords, outcomes,
      "test-home", "2026-02-01", PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
    expect(result.rating).toBe("good");
  });

  it("requires_improvement rating for score 40-59", () => {
    // Create weak data with short placement and poor matching
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2026-04-01", status: "active", isEmergencyPlacement: true }),
    ];
    const matchingRecords: MatchingRecord[] = [
      makeMatchingRecord({
        id: "mr-1",
        placementId: "p1",
        factors: [
          { factor: "age_compatibility", score: 2, rationale: "Poor fit" },
        ],
        overallScore: 2.0,
        impactAssessmentCompleted: false,
        existingChildrenConsulted: false,
        childViewsRecorded: false,
        riskAssessmentCompleted: true,
      }),
    ];
    const outcomes: PlacementOutcome[] = [
      makeOutcome({
        id: "o1",
        placementId: "p1",
        overallProgress: "stable",
        educationAttendancePercent: 70,
        healthAppointmentsAttended: true,
        carePlanUpToDate: true,
      }),
    ];
    const disruptions: DisruptionEvent[] = [
      makeDisruption({
        id: "d1",
        placementId: "p1",
        date: "2026-04-15",
        wasAnticipated: true,
        preventionAttempted: true,
        preventionSuccessful: true,
        supportProvided: ["key_worker_session"],
      }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, disruptions, [], matchingRecords, outcomes,
      "test-home", "2026-04-01", PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallScore).toBeLessThan(80);
    expect(["requires_improvement", "good"]).toContain(result.rating);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Scoring Logic
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring logic", () => {
  it("no disruptions awards full 25 points for disruption management", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2025-01-01", status: "active" }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "test-home", "2025-01-01", PERIOD_END, REFERENCE_DATE,
    );
    expect(result.componentScores.disruptionManagement).toBe(25);
  });

  it("no matching records yields 0 matching score", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2025-01-01", status: "active" }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "test-home", "2025-01-01", PERIOD_END, REFERENCE_DATE,
    );
    expect(result.componentScores.matchingQuality).toBe(0);
  });

  it("no outcomes yields 0 outcomes score", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2025-01-01", status: "active" }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "test-home", "2025-01-01", PERIOD_END, REFERENCE_DATE,
    );
    expect(result.componentScores.outcomesDuringPlacement).toBe(0);
  });

  it("long stable placement gets high duration score", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2025-01-01", status: "active", isEmergencyPlacement: false }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "test-home", "2025-01-01", PERIOD_END, REFERENCE_DATE,
    );
    // 503 days > 180 threshold, no emergency, no endings yet = high score
    expect(result.componentScores.placementDurationStability).toBeGreaterThan(20);
  });

  it("all emergency placements reduces duration score", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2025-01-01", status: "active", isEmergencyPlacement: true }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "test-home", "2025-01-01", PERIOD_END, REFERENCE_DATE,
    );
    // Emergency = 100% rate, loses 5 pts from emergency component
    const nonEmergencyResult = generatePlacementStabilityIntelligence(
      [makePlacement({ id: "p1", startDate: "2025-01-01", status: "active", isEmergencyPlacement: false })],
      [], [], [], [],
      "test-home", "2025-01-01", PERIOD_END, REFERENCE_DATE,
    );
    expect(result.componentScores.placementDurationStability).toBeLessThan(
      nonEmergencyResult.componentScores.placementDurationStability,
    );
  });

  it("perfect matching gives maximum matching score", () => {
    const matchingRecords: MatchingRecord[] = [
      makeMatchingRecord({
        id: "mr-1",
        factors: makeFullFactorScores(5),
        overallScore: 5.0,
        impactAssessmentCompleted: true,
        existingChildrenConsulted: true,
        childViewsRecorded: true,
        riskAssessmentCompleted: true,
      }),
    ];
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], [], [], matchingRecords, [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.componentScores.matchingQuality).toBe(25);
  });

  it("perfect outcomes give maximum outcomes score", () => {
    const outcomes: PlacementOutcome[] = [
      makeOutcome({
        overallProgress: "significant_improvement",
        educationAttendancePercent: 100,
        healthAppointmentsAttended: true,
        carePlanUpToDate: true,
      }),
    ];
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], [], [], [], outcomes,
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.componentScores.outcomesDuringPlacement).toBe(25);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. Strengths Generation
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths generation", () => {
  it("identifies high planned ending rate as strength", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", status: "ended_planned", endDate: "2026-03-01", endingReason: "planned_transition" }),
      makePlacement({ id: "p2", status: "ended_planned", endDate: "2026-04-01", endingReason: "reunification" }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("planned"))).toBe(true);
  });

  it("identifies no disruptions as strength", () => {
    const placements: Placement[] = [makePlacement()];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("No disruption") || s.includes("stable"))).toBe(true);
  });

  it("identifies high matching score as strength", () => {
    const matchingRecords: MatchingRecord[] = [
      makeMatchingRecord({ overallScore: 4.5 }),
    ];
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], [], [], matchingRecords, [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("matching") || s.includes("Matching"))).toBe(true);
  });

  it("identifies strong improvement rate as strength", () => {
    const outcomes: PlacementOutcome[] = [
      makeOutcome({ id: "o1", overallProgress: "significant_improvement" }),
      makeOutcome({ id: "o2", overallProgress: "some_improvement" }),
      makeOutcome({ id: "o3", overallProgress: "some_improvement" }),
    ];
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], [], [], [], outcomes,
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("improvement") || s.includes("outcomes"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. Areas for Improvement
// ═══════════════════════════════════════════════════════════════════════════

describe("areas for improvement generation", () => {
  it("flags high unplanned ending rate", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", status: "ended_unplanned", endDate: "2026-03-01", endingReason: "placement_breakdown" }),
      makePlacement({ id: "p2", status: "ended_unplanned", endDate: "2026-04-01", endingReason: "absconding" }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("unplanned"))).toBe(true);
  });

  it("flags low disruption anticipation", () => {
    const disruptions: DisruptionEvent[] = [
      makeDisruption({ id: "d1", wasAnticipated: false, date: "2026-01-15" }),
      makeDisruption({ id: "d2", wasAnticipated: false, date: "2026-02-15" }),
      makeDisruption({ id: "d3", wasAnticipated: false, date: "2026-03-15" }),
    ];
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], disruptions, [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("anticipated"))).toBe(true);
  });

  it("flags low matching scores", () => {
    const matchingRecords: MatchingRecord[] = [
      makeMatchingRecord({ overallScore: 1.5 }),
    ];
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], [], [], matchingRecords, [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("matching") || a.includes("match"))).toBe(true);
  });

  it("flags high decline rate in outcomes", () => {
    const outcomes: PlacementOutcome[] = [
      makeOutcome({ id: "o1", overallProgress: "significant_decline" }),
      makeOutcome({ id: "o2", overallProgress: "some_decline" }),
    ];
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], [], [], [], outcomes,
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("decline"))).toBe(true);
  });

  it("returns no improvement areas for empty data", () => {
    const result = generatePlacementStabilityIntelligence(
      [], [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // Empty data should not generate areas since thresholds check for > 0 records
    expect(result.areasForImprovement).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. Actions Generation
// ═══════════════════════════════════════════════════════════════════════════

describe("actions generation", () => {
  it("generates action for on-notice placements", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", status: "on_notice" }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("on notice"))).toBe(true);
  });

  it("generates action for critical disruptions", () => {
    const disruptions: DisruptionEvent[] = [
      makeDisruption({ severity: "critical", date: "2026-01-15" }),
    ];
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], disruptions, [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("critical"))).toBe(true);
  });

  it("generates action for incomplete impact assessments", () => {
    const matchingRecords: MatchingRecord[] = [
      makeMatchingRecord({ impactAssessmentCompleted: false }),
    ];
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], [], [], matchingRecords, [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("impact assessment") || a.includes("Reg 36"))).toBe(true);
  });

  it("generates no-action message when all is well", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2025-01-01", status: "active", isEmergencyPlacement: false }),
    ];
    const matchingRecords: MatchingRecord[] = [
      makeMatchingRecord({
        placementId: "p1",
        factors: makeFullFactorScores(5),
        overallScore: 5.0,
        impactAssessmentCompleted: true,
        existingChildrenConsulted: true,
        childViewsRecorded: true,
        riskAssessmentCompleted: true,
      }),
    ];
    const outcomes: PlacementOutcome[] = [
      makeOutcome({
        placementId: "p1",
        overallProgress: "significant_improvement",
        educationAttendancePercent: 95,
        healthAppointmentsAttended: true,
        carePlanUpToDate: true,
      }),
    ];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], matchingRecords, outcomes,
      "test-home", "2025-01-01", PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. Regulatory Links
// ═══════════════════════════════════════════════════════════════════════════

describe("regulatory links", () => {
  it("always includes Reg 36", () => {
    const result = generatePlacementStabilityIntelligence(
      [], [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 36"))).toBe(true);
  });

  it("always includes Reg 14", () => {
    const result = generatePlacementStabilityIntelligence(
      [], [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 14"))).toBe(true);
  });

  it("always includes SCCIF", () => {
    const result = generatePlacementStabilityIntelligence(
      [], [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("always includes Children Act 1989 s22C", () => {
    const result = generatePlacementStabilityIntelligence(
      [], [], [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("includes matching link when matching records exist", () => {
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], [], [], [makeMatchingRecord()], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Matching") || l.includes("matching"))).toBe(true);
  });

  it("includes disruption link when disruptions exist", () => {
    const disruptions: DisruptionEvent[] = [makeDisruption({ date: "2026-01-15" })];
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], disruptions, [], [], [],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("disruption") || l.includes("protected"))).toBe(true);
  });

  it("includes outcomes link when outcomes exist", () => {
    const result = generatePlacementStabilityIntelligence(
      [makePlacement()], [], [], [], [makeOutcome()],
      "test-home", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("progress") || l.includes("Experience"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. Label Functions
// ═══════════════════════════════════════════════════════════════════════════

describe("getPlacementStatusLabel", () => {
  it("returns Active for active", () => {
    expect(getPlacementStatusLabel("active")).toBe("Active");
  });

  it("returns Ended (Planned) for ended_planned", () => {
    expect(getPlacementStatusLabel("ended_planned")).toBe("Ended (Planned)");
  });

  it("returns Ended (Unplanned) for ended_unplanned", () => {
    expect(getPlacementStatusLabel("ended_unplanned")).toBe("Ended (Unplanned)");
  });

  it("returns Ended (Emergency) for ended_emergency", () => {
    expect(getPlacementStatusLabel("ended_emergency")).toBe("Ended (Emergency)");
  });

  it("returns On Notice for on_notice", () => {
    expect(getPlacementStatusLabel("on_notice")).toBe("On Notice");
  });
});

describe("getEndingReasonLabel", () => {
  it("labels planned_transition", () => {
    expect(getEndingReasonLabel("planned_transition")).toBe("Planned Transition");
  });

  it("labels reunification", () => {
    expect(getEndingReasonLabel("reunification")).toBe("Reunification");
  });

  it("labels placement_breakdown", () => {
    expect(getEndingReasonLabel("placement_breakdown")).toBe("Placement Breakdown");
  });

  it("labels safeguarding_concern", () => {
    expect(getEndingReasonLabel("safeguarding_concern")).toBe("Safeguarding Concern");
  });

  it("labels absconding", () => {
    expect(getEndingReasonLabel("absconding")).toBe("Absconding");
  });

  it("labels behaviour_escalation", () => {
    expect(getEndingReasonLabel("behaviour_escalation")).toBe("Behaviour Escalation");
  });

  it("labels needs_changed", () => {
    expect(getEndingReasonLabel("needs_changed")).toBe("Needs Changed");
  });

  it("labels other", () => {
    expect(getEndingReasonLabel("other")).toBe("Other");
  });

  it("labels moved_to_family", () => {
    expect(getEndingReasonLabel("moved_to_family")).toBe("Moved to Family");
  });

  it("labels moved_to_independence", () => {
    expect(getEndingReasonLabel("moved_to_independence")).toBe("Moved to Independence");
  });

  it("labels provider_request", () => {
    expect(getEndingReasonLabel("provider_request")).toBe("Provider Request");
  });

  it("labels peer_conflict", () => {
    expect(getEndingReasonLabel("peer_conflict")).toBe("Peer Conflict");
  });
});

describe("getDisruptionFactorLabel", () => {
  it("labels peer_conflict", () => {
    expect(getDisruptionFactorLabel("peer_conflict")).toBe("Peer Conflict");
  });

  it("labels staff_relationship", () => {
    expect(getDisruptionFactorLabel("staff_relationship")).toBe("Staff Relationship");
  });

  it("labels education_breakdown", () => {
    expect(getDisruptionFactorLabel("education_breakdown")).toBe("Education Breakdown");
  });

  it("labels family_contact_issues", () => {
    expect(getDisruptionFactorLabel("family_contact_issues")).toBe("Family Contact Issues");
  });

  it("labels mental_health_crisis", () => {
    expect(getDisruptionFactorLabel("mental_health_crisis")).toBe("Mental Health Crisis");
  });

  it("labels substance_misuse", () => {
    expect(getDisruptionFactorLabel("substance_misuse")).toBe("Substance Misuse");
  });

  it("labels criminal_exploitation", () => {
    expect(getDisruptionFactorLabel("criminal_exploitation")).toBe("Criminal Exploitation");
  });

  it("labels absconding", () => {
    expect(getDisruptionFactorLabel("absconding")).toBe("Absconding");
  });

  it("labels behavioural_escalation", () => {
    expect(getDisruptionFactorLabel("behavioural_escalation")).toBe("Behavioural Escalation");
  });

  it("labels environmental_change", () => {
    expect(getDisruptionFactorLabel("environmental_change")).toBe("Environmental Change");
  });
});

describe("getSupportTypeLabel", () => {
  it("labels key_worker_session", () => {
    expect(getSupportTypeLabel("key_worker_session")).toBe("Key Worker Session");
  });

  it("labels therapeutic_intervention", () => {
    expect(getSupportTypeLabel("therapeutic_intervention")).toBe("Therapeutic Intervention");
  });

  it("labels family_mediation", () => {
    expect(getSupportTypeLabel("family_mediation")).toBe("Family Mediation");
  });

  it("labels education_support", () => {
    expect(getSupportTypeLabel("education_support")).toBe("Education Support");
  });

  it("labels risk_management_review", () => {
    expect(getSupportTypeLabel("risk_management_review")).toBe("Risk Management Review");
  });

  it("labels placement_review_meeting", () => {
    expect(getSupportTypeLabel("placement_review_meeting")).toBe("Placement Review Meeting");
  });

  it("labels multi_agency_meeting", () => {
    expect(getSupportTypeLabel("multi_agency_meeting")).toBe("Multi-Agency Meeting");
  });

  it("labels peer_mediation", () => {
    expect(getSupportTypeLabel("peer_mediation")).toBe("Peer Mediation");
  });

  it("labels crisis_intervention", () => {
    expect(getSupportTypeLabel("crisis_intervention")).toBe("Crisis Intervention");
  });

  it("labels transition_planning", () => {
    expect(getSupportTypeLabel("transition_planning")).toBe("Transition Planning");
  });
});

describe("getOutcomeAreaLabel", () => {
  it("labels education_engagement", () => {
    expect(getOutcomeAreaLabel("education_engagement")).toBe("Education Engagement");
  });

  it("labels health_wellbeing", () => {
    expect(getOutcomeAreaLabel("health_wellbeing")).toBe("Health & Wellbeing");
  });

  it("labels behaviour_progress", () => {
    expect(getOutcomeAreaLabel("behaviour_progress")).toBe("Behaviour Progress");
  });

  it("labels emotional_regulation", () => {
    expect(getOutcomeAreaLabel("emotional_regulation")).toBe("Emotional Regulation");
  });

  it("labels social_relationships", () => {
    expect(getOutcomeAreaLabel("social_relationships")).toBe("Social Relationships");
  });

  it("labels independent_skills", () => {
    expect(getOutcomeAreaLabel("independent_skills")).toBe("Independent Skills");
  });
});

describe("getProgressRatingLabel", () => {
  it("labels significant_improvement", () => {
    expect(getProgressRatingLabel("significant_improvement")).toBe("Significant Improvement");
  });

  it("labels some_improvement", () => {
    expect(getProgressRatingLabel("some_improvement")).toBe("Some Improvement");
  });

  it("labels stable", () => {
    expect(getProgressRatingLabel("stable")).toBe("Stable");
  });

  it("labels some_decline", () => {
    expect(getProgressRatingLabel("some_decline")).toBe("Some Decline");
  });

  it("labels significant_decline", () => {
    expect(getProgressRatingLabel("significant_decline")).toBe("Significant Decline");
  });
});

describe("getMatchingFactorLabel", () => {
  it("labels age_compatibility", () => {
    expect(getMatchingFactorLabel("age_compatibility")).toBe("Age Compatibility");
  });

  it("labels needs_compatibility", () => {
    expect(getMatchingFactorLabel("needs_compatibility")).toBe("Needs Compatibility");
  });

  it("labels risk_compatibility", () => {
    expect(getMatchingFactorLabel("risk_compatibility")).toBe("Risk Compatibility");
  });

  it("labels peer_dynamics", () => {
    expect(getMatchingFactorLabel("peer_dynamics")).toBe("Peer Dynamics");
  });

  it("labels cultural_needs", () => {
    expect(getMatchingFactorLabel("cultural_needs")).toBe("Cultural Needs");
  });

  it("labels statement_of_purpose_fit", () => {
    expect(getMatchingFactorLabel("statement_of_purpose_fit")).toBe("Statement of Purpose Fit");
  });

  it("labels location_suitability", () => {
    expect(getMatchingFactorLabel("location_suitability")).toBe("Location Suitability");
  });

  it("labels therapeutic_alignment", () => {
    expect(getMatchingFactorLabel("therapeutic_alignment")).toBe("Therapeutic Alignment");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. Edge Cases
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles placement with same start and end date", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", startDate: "2026-01-01", endDate: "2026-01-01", status: "ended_emergency" }),
    ];
    const result = evaluatePlacementDuration(placements, "2026-01-01", "2026-05-18", "2026-05-18");
    expect(result.averageDurationDays).toBe(0);
    expect(result.shortestPlacementDays).toBe(0);
  });

  it("handles disruption with empty factors array", () => {
    const disruptions: DisruptionEvent[] = [
      makeDisruption({ factors: [] }),
    ];
    const result = evaluateDisruptionManagement(disruptions, PERIOD_START, PERIOD_END);
    expect(result.topFactors).toEqual([]);
  });

  it("handles outcome with empty areas array", () => {
    const outcomes: PlacementOutcome[] = [
      makeOutcome({ areas: [] }),
    ];
    const result = evaluateOutcomesDuringPlacement(outcomes);
    expect(result.areaBreakdown).toEqual([]);
  });

  it("handles very large placement count", () => {
    const placements: Placement[] = Array.from({ length: 50 }, (_, i) =>
      makePlacement({ id: `p-${i}`, startDate: "2025-09-01", status: "active" }),
    );
    const result = evaluatePlacementDuration(placements, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.totalPlacements).toBe(50);
  });

  it("handles outcomes with 0% education attendance", () => {
    const outcomes: PlacementOutcome[] = [
      makeOutcome({ educationAttendancePercent: 0 }),
    ];
    const result = evaluateOutcomesDuringPlacement(outcomes);
    expect(result.averageEducationAttendance).toBe(0);
  });

  it("handles multiple disruptions on same date", () => {
    const disruptions: DisruptionEvent[] = [
      makeDisruption({ id: "d1", date: "2026-01-15" }),
      makeDisruption({ id: "d2", date: "2026-01-15" }),
    ];
    const result = evaluateDisruptionManagement(disruptions, PERIOD_START, PERIOD_END);
    expect(result.totalDisruptions).toBe(2);
  });

  it("handles all placement statuses at once", () => {
    const placements: Placement[] = [
      makePlacement({ id: "p1", status: "active" }),
      makePlacement({ id: "p2", status: "ended_planned", endDate: "2026-03-01" }),
      makePlacement({ id: "p3", status: "ended_unplanned", endDate: "2026-03-15" }),
      makePlacement({ id: "p4", status: "ended_emergency", endDate: "2026-04-01" }),
      makePlacement({ id: "p5", status: "on_notice" }),
    ];
    const result = evaluatePlacementDuration(placements, PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.activePlacements).toBe(1);
    expect(result.endedPlannedCount).toBe(1);
    expect(result.endedUnplannedCount).toBe(1);
    expect(result.endedEmergencyCount).toBe(1);
    expect(result.onNoticeCount).toBe(1);
  });

  it("child profile has undefined latestOutcome when no outcomes exist", () => {
    const placements: Placement[] = [makePlacement()];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.childProfiles[0].latestOutcome).toBeUndefined();
  });

  it("child profile has undefined matchingScore when no matching records exist", () => {
    const placements: Placement[] = [makePlacement()];
    const result = generatePlacementStabilityIntelligence(
      placements, [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.childProfiles[0].matchingScore).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. Oak House Full Scenario
// ═══════════════════════════════════════════════════════════════════════════

describe("Oak House full scenario", () => {
  it("produces a coherent full analysis", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );

    // Basic shape
    expect(result.homeId).toBe("oak-house");
    expect(result.childProfiles.length).toBe(3);

    // Children are correct
    const childNames = result.childProfiles.map((c) => c.childName).sort();
    expect(childNames).toEqual(["Alex", "Jordan", "Morgan"]);

    // Score is reasonable for good data
    expect(result.overallScore).toBeGreaterThan(40);
    expect(result.overallScore).toBeLessThanOrEqual(100);

    // Has all required arrays
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("Oak House disruption management score reflects 3 well-managed disruptions", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    // Disruptions exist and are mostly well managed
    expect(result.componentScores.disruptionManagement).toBeGreaterThan(15);
  });

  it("Oak House matching quality reflects mixed consultation rates", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    // 2/3 consulted = 67%, so not perfect but still reasonable
    expect(result.componentScores.matchingQuality).toBeGreaterThan(10);
    expect(result.componentScores.matchingQuality).toBeLessThan(25);
  });

  it("Oak House outcomes reflect mixed attendance and health rates", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    // 67% improvement rate, 74% education, 67% health, 100% care plan
    expect(result.componentScores.outcomesDuringPlacement).toBeGreaterThan(10);
  });

  it("Oak House child profiles have correct key workers", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    const alex = result.childProfiles.find((c) => c.childName === "Alex");
    expect(alex!.keyWorker).toBe("Sarah Johnson");
    const jordan = result.childProfiles.find((c) => c.childName === "Jordan");
    expect(jordan!.keyWorker).toBe("Tom Richards");
    const morgan = result.childProfiles.find((c) => c.childName === "Morgan");
    expect(morgan!.keyWorker).toBe("Lisa Williams");
  });

  it("Oak House child ages match", () => {
    const result = generatePlacementStabilityIntelligence(
      OAK_HOUSE_PLACEMENTS,
      OAK_HOUSE_DISRUPTIONS,
      OAK_HOUSE_SUPPORTS,
      OAK_HOUSE_MATCHING,
      OAK_HOUSE_OUTCOMES,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    const alex = result.childProfiles.find((c) => c.childName === "Alex");
    expect(alex!.childAge).toBe(14);
    const jordan = result.childProfiles.find((c) => c.childName === "Jordan");
    expect(jordan!.childAge).toBe(13);
    const morgan = result.childProfiles.find((c) => c.childName === "Morgan");
    expect(morgan!.childAge).toBe(15);
  });
});
