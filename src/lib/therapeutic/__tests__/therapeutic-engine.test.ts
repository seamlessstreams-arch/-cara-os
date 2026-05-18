// ══════════════════════════════════════════════════════════════════════════════
// Therapeutic Support & Emotional Wellbeing — Tests
// CHR 2015 Reg 6 (Quality & Purpose), Reg 10 (Health & Wellbeing)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateTherapeuticCompliance,
  calculateHomeTherapeuticMetrics,
  getModelLabel,
  getWellbeingDomainLabel,
  getRegulationLevelLabel,
} from "../therapeutic-engine";
import type {
  ChildTherapeuticProfile,
  HomeTherapeuticConfig,
  WellbeingScore,
  TherapeuticIntervention,
  CrisisEvent,
} from "../therapeutic-engine";

// ── Fixtures ────────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeConfig(overrides: Partial<HomeTherapeuticConfig> = {}): HomeTherapeuticConfig {
  return {
    homeId: "home-oak",
    primaryTherapeuticModel: "pace",
    supportingModels: ["dyadic_developmental_psychotherapy", "theraplay"],
    therapeuticConsultant: "Dr Sarah Mitchell",
    consultationFrequency: "monthly",
    lastConsultation: "2026-05-05T10:00:00Z",
    nextConsultation: "2026-06-02T10:00:00Z",
    trainedStaffPercentage: 92,
    reflectivePracticeFrequency: "fortnightly",
    lastReflectivePractice: "2026-05-10T14:00:00Z",
    sdqFrequency: "quarterly",
    wellbeingReviewFrequency: "monthly",
    maxCrisisEventsBeforeEscalation: 3,
    minimumTherapeuticHoursPerWeek: 4,
    ...overrides,
  };
}

function makeWellbeing(overrides: Partial<WellbeingScore> = {}): WellbeingScore {
  return {
    domain: "emotional_regulation",
    score: 72,
    trend: "improving",
    lastAssessed: "2026-05-10T10:00:00Z",
    targetScore: 80,
    ...overrides,
  };
}

function makeIntervention(overrides: Partial<TherapeuticIntervention> = {}): TherapeuticIntervention {
  return {
    id: "int-001",
    type: "individual_therapy",
    provider: "Dr Sarah Mitchell",
    startDate: "2026-01-15T09:00:00Z",
    frequency: "weekly",
    sessionsAttended: 18,
    sessionsMissed: 2,
    effectiveness: 78,
    childFeedback: 72,
    active: true,
    ...overrides,
  };
}

function makeCrisis(overrides: Partial<CrisisEvent> = {}): CrisisEvent {
  return {
    id: "crisis-001",
    date: "2026-05-14T20:30:00Z",
    trigger: "Contact with birth family",
    severity: "moderate",
    interventionUsed: "PACE approach — co-regulation",
    deEscalationTime: 25,
    outcome: "Child settled after 1:1 with key worker",
    followUpCompleted: true,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ChildTherapeuticProfile> = {}): ChildTherapeuticProfile {
  return {
    childId: "child-alex",
    childName: "Alex",
    primaryModel: "pace",
    secondaryModels: ["theraplay"],
    emotionalRegulationLevel: "developing",
    mentalHealthStatus: "improving",
    wellbeingScores: [
      makeWellbeing({ domain: "emotional_regulation", score: 72, trend: "improving" }),
      makeWellbeing({ domain: "attachment_security", score: 65, trend: "improving" }),
      makeWellbeing({ domain: "self_esteem", score: 68, trend: "stable" }),
      makeWellbeing({ domain: "peer_relationships", score: 70, trend: "improving" }),
      makeWellbeing({ domain: "trauma_recovery", score: 60, trend: "improving" }),
      makeWellbeing({ domain: "anxiety_management", score: 62, trend: "stable" }),
      makeWellbeing({ domain: "resilience", score: 75, trend: "improving" }),
      makeWellbeing({ domain: "identity", score: 70, trend: "stable" }),
    ],
    interventions: [makeIntervention()],
    camhsReferral: {
      status: "active_treatment",
      referralDate: "2025-11-01",
      acceptedDate: "2025-12-15",
      firstAppointment: "2026-01-10",
      lastAppointment: "2026-05-08",
      nextAppointment: "2026-06-05",
      tier: 3,
      clinician: "Dr Emily Carter",
    },
    crisisEvents: [makeCrisis()],
    sdqScore: 18,
    sdqDate: "2026-04-01T10:00:00Z",
    safetyPlanInPlace: true,
    safetyPlanReviewDate: "2026-06-01",
    therapeuticGoals: [
      "Develop co-regulation strategies",
      "Build secure attachment with key worker",
      "Process early trauma through life story work",
    ],
    protectiveFactors: ["Strong key-worker relationship", "Engaged with CAMHS", "Enjoys football"],
    riskFactors: ["Early trauma", "Attachment disruption", "Contact with birth family triggers"],
    keyRelationships: ["Key worker: Sarah", "CAMHS clinician: Dr Carter", "Football coach: Dave"],
    lastTherapeuticReview: "2026-05-01T10:00:00Z",
    nextTherapeuticReview: "2026-06-01T10:00:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTherapeuticCompliance", () => {
  it("marks compliant when all children have active support and good wellbeing", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Alex" }),
      makeProfile({ childId: "c2", childName: "Jordan", mentalHealthStatus: "stable" }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.overallScore).toBeGreaterThan(70);
  });

  it("flags low staff training percentage", () => {
    const config = makeConfig({ trainedStaffPercentage: 60 });
    const result = evaluateTherapeuticCompliance([makeProfile()], config, NOW);
    expect(result.issues.some((i) => i.includes("staff trained"))).toBe(true);
    expect(result.staffTrainingScore).toBeLessThan(100);
  });

  it("warns about staff training between 80-90%", () => {
    const config = makeConfig({ trainedStaffPercentage: 85 });
    const result = evaluateTherapeuticCompliance([makeProfile()], config, NOW);
    expect(result.warnings.some((w) => w.includes("Staff training"))).toBe(true);
  });

  it("flags overdue therapeutic consultation", () => {
    const config = makeConfig({ lastConsultation: "2026-01-01T10:00:00Z" });
    const result = evaluateTherapeuticCompliance([makeProfile()], config, NOW);
    expect(result.issues.some((i) => i.includes("consultation overdue"))).toBe(true);
    expect(result.modelAdherenceScore).toBeLessThan(makeConfig().trainedStaffPercentage * 1.25);
  });

  it("warns about consultation approaching overdue", () => {
    const config = makeConfig({ lastConsultation: "2026-03-10T10:00:00Z" });
    const result = evaluateTherapeuticCompliance([makeProfile()], config, NOW);
    expect(result.warnings.some((w) => w.includes("consultation approaching overdue"))).toBe(true);
  });

  it("warns about overdue reflective practice", () => {
    const config = makeConfig({ lastReflectivePractice: "2026-04-01T10:00:00Z" });
    const result = evaluateTherapeuticCompliance([makeProfile()], config, NOW);
    expect(result.warnings.some((w) => w.includes("Reflective practice overdue"))).toBe(true);
  });

  it("flags children without active intervention who need support", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        childName: "Sam",
        mentalHealthStatus: "declining",
        interventions: [makeIntervention({ active: false })],
      }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.childrenWithoutSupport).toContain("Sam");
    expect(result.issues.some((i) => i.includes("no active intervention"))).toBe(true);
  });

  it("does not flag stable children without interventions", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        childName: "Jordan",
        mentalHealthStatus: "stable",
        interventions: [],
      }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.childrenWithoutSupport).not.toContain("Jordan");
  });

  it("flags children declining across 3+ wellbeing domains", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        childName: "Morgan",
        wellbeingScores: [
          makeWellbeing({ domain: "emotional_regulation", trend: "declining" }),
          makeWellbeing({ domain: "self_esteem", trend: "declining" }),
          makeWellbeing({ domain: "peer_relationships", trend: "declining" }),
          makeWellbeing({ domain: "resilience", trend: "stable" }),
        ],
      }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.childrenDeclining).toContain("Morgan");
    expect(result.issues.some((i) => i.includes("declining across 3+"))).toBe(true);
  });

  it("flags children in crisis", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Sam", mentalHealthStatus: "crisis" }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.childrenInCrisis).toContain("Sam");
    expect(result.issues.some((i) => i.includes("crisis"))).toBe(true);
  });

  it("flags incomplete crisis follow-ups", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        crisisEvents: [
          makeCrisis({ id: "cr1", followUpCompleted: true }),
          makeCrisis({ id: "cr2", followUpCompleted: false }),
        ],
      }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.issues.some((i) => i.includes("follow-up completion"))).toBe(true);
  });

  it("flags overdue SDQ assessments", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Alex", sdqDate: "2025-12-01T10:00:00Z" }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.sdqOverdue).toContain("Alex");
    expect(result.warnings.some((w) => w.includes("SDQ overdue"))).toBe(true);
  });

  it("flags missing SDQ date", () => {
    const profiles = [
      makeProfile({ childId: "c1", childName: "Jordan", sdqDate: undefined, sdqScore: undefined }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.sdqOverdue).toContain("Jordan");
  });

  it("warns about CAMHS waiting list", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        childName: "Morgan",
        camhsReferral: { status: "on_waiting_list", referralDate: "2026-03-01", tier: 3, waitingWeeks: 10 },
      }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.camhsWaitingList).toContain("Morgan");
    expect(result.warnings.some((w) => w.includes("CAMHS waiting list"))).toBe(true);
  });

  it("flags overdue therapeutic review", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        childName: "Sam",
        nextTherapeuticReview: "2026-05-01T10:00:00Z",
      }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.therapeuticReviewOverdue).toContain("Sam");
    expect(result.issues.some((i) => i.includes("Therapeutic review overdue"))).toBe(true);
  });

  it("calculates wellbeing progress score from average scores", () => {
    const profiles = [
      makeProfile({
        wellbeingScores: [
          makeWellbeing({ score: 80 }),
          makeWellbeing({ score: 85 }),
          makeWellbeing({ score: 90 }),
        ],
      }),
    ];
    const result = evaluateTherapeuticCompliance(profiles, makeConfig(), NOW);
    expect(result.wellbeingProgressScore).toBe(85);
    expect(result.averageWellbeingScore).toBe(85);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeTherapeuticMetrics", () => {
  it("calculates overall wellbeing score across all children", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        wellbeingScores: [makeWellbeing({ score: 70 }), makeWellbeing({ score: 80 })],
      }),
      makeProfile({
        childId: "c2",
        wellbeingScores: [makeWellbeing({ score: 60 }), makeWellbeing({ score: 70 })],
      }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, makeConfig(), NOW);
    // Child 1: avg 75, Child 2: avg 65 → home avg: 70
    expect(result.overallWellbeingScore).toBe(70);
  });

  it("counts active interventions", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        interventions: [
          makeIntervention({ id: "i1", active: true }),
          makeIntervention({ id: "i2", active: false }),
        ],
      }),
      makeProfile({
        childId: "c2",
        interventions: [makeIntervention({ id: "i3", active: true })],
      }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, makeConfig(), NOW);
    expect(result.totalActiveInterventions).toBe(2);
  });

  it("calculates intervention attendance rate", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        interventions: [makeIntervention({ sessionsAttended: 8, sessionsMissed: 2, active: true })],
      }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, makeConfig(), NOW);
    expect(result.interventionAttendanceRate).toBe(80);
  });

  it("warns about low attendance rate", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        interventions: [makeIntervention({ sessionsAttended: 5, sessionsMissed: 5, active: true })],
      }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, makeConfig(), NOW);
    expect(result.interventionAttendanceRate).toBe(50);
    expect(result.warnings.some((w) => w.includes("attendance rate"))).toBe(true);
  });

  it("categorises children by mental health status", () => {
    const profiles = [
      makeProfile({ childId: "c1", mentalHealthStatus: "improving" }),
      makeProfile({ childId: "c2", mentalHealthStatus: "stable" }),
      makeProfile({ childId: "c3", mentalHealthStatus: "declining" }),
      makeProfile({ childId: "c4", mentalHealthStatus: "crisis" }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, makeConfig(), NOW);
    expect(result.childrenImproving).toBe(1);
    expect(result.childrenStable).toBe(1);
    expect(result.childrenDeclining).toBe(1);
    expect(result.childrenInCrisis).toBe(1);
  });

  it("counts crisis events in last 30 days", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        crisisEvents: [
          makeCrisis({ id: "cr1", date: "2026-05-14T20:00:00Z", deEscalationTime: 20 }),
          makeCrisis({ id: "cr2", date: "2026-05-10T15:00:00Z", deEscalationTime: 30 }),
          makeCrisis({ id: "cr3", date: "2026-01-01T10:00:00Z", deEscalationTime: 60 }),
        ],
      }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, makeConfig(), NOW);
    expect(result.crisisEventsThisMonth).toBe(2);
    expect(result.averageDeEscalationTime).toBe(25);
  });

  it("counts CAMHS statuses", () => {
    const profiles = [
      makeProfile({ childId: "c1", camhsReferral: { status: "active_treatment", tier: 3 } }),
      makeProfile({ childId: "c2", camhsReferral: { status: "on_waiting_list", tier: 2, waitingWeeks: 8 } }),
      makeProfile({ childId: "c3", camhsReferral: { status: "not_referred", tier: 1 } }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, makeConfig(), NOW);
    expect(result.camhsActiveCount).toBe(1);
    expect(result.camhsWaitingCount).toBe(1);
  });

  it("calculates SDQ average", () => {
    const profiles = [
      makeProfile({ childId: "c1", sdqScore: 18 }),
      makeProfile({ childId: "c2", sdqScore: 22 }),
      makeProfile({ childId: "c3", sdqScore: 14 }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, makeConfig(), NOW);
    expect(result.sdqAverageScore).toBe(18);
  });

  it("calculates model adherence rate", () => {
    const config = makeConfig({ primaryTherapeuticModel: "pace" });
    const profiles = [
      makeProfile({ childId: "c1", primaryModel: "pace" }),
      makeProfile({ childId: "c2", primaryModel: "cbt", secondaryModels: ["pace"] }),
      makeProfile({ childId: "c3", primaryModel: "cbt", secondaryModels: [] }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, config, NOW);
    expect(result.modelAdherenceRate).toBe(67);
  });

  it("warns about insufficient therapeutic hours", () => {
    const config = makeConfig({ minimumTherapeuticHoursPerWeek: 10 });
    const profiles = [
      makeProfile({
        childId: "c1",
        interventions: [makeIntervention({ frequency: "weekly", active: true })],
      }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, config, NOW);
    expect(result.therapeuticHoursThisWeek).toBe(1);
    expect(result.warnings.some((w) => w.includes("Therapeutic hours"))).toBe(true);
  });

  it("generates child wellbeing summaries", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        childName: "Alex",
        mentalHealthStatus: "improving",
        emotionalRegulationLevel: "developing",
        wellbeingScores: [
          makeWellbeing({ domain: "emotional_regulation", score: 70, trend: "improving" }),
          makeWellbeing({ domain: "self_esteem", score: 65, trend: "improving" }),
          makeWellbeing({ domain: "resilience", score: 60, trend: "stable" }),
        ],
        interventions: [makeIntervention({ active: true })],
        camhsReferral: { status: "active_treatment", tier: 3 },
      }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, makeConfig(), NOW);
    expect(result.childMetrics).toHaveLength(1);
    expect(result.childMetrics[0].childName).toBe("Alex");
    expect(result.childMetrics[0].trend).toBe("improving");
    expect(result.childMetrics[0].activeInterventions).toBe(1);
    expect(result.childMetrics[0].camhsStatus).toBe("active_treatment");
  });

  it("calculates days stable from last crisis", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        crisisEvents: [makeCrisis({ date: "2026-05-14T20:00:00Z" })],
      }),
    ];
    const result = calculateHomeTherapeuticMetrics(profiles, makeConfig(), NOW);
    expect(result.childMetrics[0].daysStable).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("Label helpers", () => {
  it("getModelLabel returns readable labels", () => {
    expect(getModelLabel("pace")).toBe("PACE (Playfulness, Acceptance, Curiosity, Empathy)");
    expect(getModelLabel("emdr")).toBe("Eye Movement Desensitisation & Reprocessing (EMDR)");
    expect(getModelLabel("dyadic_developmental_psychotherapy")).toBe("Dyadic Developmental Psychotherapy (DDP)");
  });

  it("getWellbeingDomainLabel returns readable labels", () => {
    expect(getWellbeingDomainLabel("emotional_regulation")).toBe("Emotional Regulation");
    expect(getWellbeingDomainLabel("trauma_recovery")).toBe("Trauma Recovery");
    expect(getWellbeingDomainLabel("identity")).toBe("Identity & Self-Worth");
  });

  it("getRegulationLevelLabel returns readable labels", () => {
    expect(getRegulationLevelLabel("emerging")).toBe("Emerging");
    expect(getRegulationLevelLabel("secure")).toBe("Secure");
  });
});
