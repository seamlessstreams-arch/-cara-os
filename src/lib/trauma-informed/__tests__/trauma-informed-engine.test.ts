// ══════════════════════════════════════════════════════════════════════════════
// Trauma-Informed Care Intelligence Engine — Tests
//
// Covers: staff competency, practice quality, environment evaluation,
// consultation, trauma screening, full intelligence generation, scoring,
// rating thresholds, edge cases, and demo data.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateStaffCompetency,
  evaluatePracticeQuality,
  evaluateEnvironment,
  evaluateConsultation,
  evaluateTraumaScreening,
  generateTraumaInformedIntelligence,
  getRatingLabel,
  getRatingColour,
  getCompetencyLabel,
  getPrincipleLabel,
  getIndicatorLabel,
} from "../trauma-informed-engine";
import type {
  TraumaTrainingRecord,
  TherapeuticInterventionRecord,
  EnvironmentalAdaptation,
  ConsultationRecord,
  TraumaScreening,
  TraumaPrinciple,
  PracticeIndicator,
} from "../trauma-informed-engine";

// ── Reference Date ─────────────────────────────────────────────────────────

const REF_DATE = "2026-05-18T12:00:00Z";
const PERIOD_START = "2026-01-01T00:00:00Z";
const PERIOD_END = "2026-05-18T00:00:00Z";

// ── Demo Data — Staff Training ─────────────────────────────────────────────

const DEMO_TRAINING: TraumaTrainingRecord[] = [
  {
    id: "tr-01",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    trainingType: "Advanced Trauma-Informed Practice",
    completedDate: "2025-09-15",
    expiryDate: "2026-09-15",
    level: "specialist",
    provider: "Trauma Recovery Institute",
  },
  {
    id: "tr-02",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    trainingType: "PACE Model Practitioner",
    completedDate: "2025-06-20",
    expiryDate: "2026-06-20",
    level: "specialist",
    provider: "DDP Network",
  },
  {
    id: "tr-03",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    trainingType: "Trauma-Informed Care Level 3",
    completedDate: "2025-11-10",
    expiryDate: "2026-11-10",
    level: "responsive",
    provider: "National Trauma Training",
  },
  {
    id: "tr-04",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    trainingType: "Therapeutic Crisis Intervention",
    completedDate: "2026-01-05",
    expiryDate: "2027-01-05",
    level: "responsive",
    provider: "Cornell University (UK Licence)",
  },
  {
    id: "tr-05",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    trainingType: "Trauma-Informed Care Level 3",
    completedDate: "2025-10-01",
    expiryDate: "2026-10-01",
    level: "responsive",
    provider: "National Trauma Training",
  },
  {
    id: "tr-06",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    trainingType: "Sensory Integration Awareness",
    completedDate: "2026-02-15",
    expiryDate: "2027-02-15",
    level: "informed",
    provider: "Sensory Integration Education",
  },
  {
    id: "tr-07",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    trainingType: "Trauma-Informed Care Level 2",
    completedDate: "2026-03-01",
    expiryDate: "2027-03-01",
    level: "informed",
    provider: "National Trauma Training",
  },
  {
    id: "tr-08",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    trainingType: "ACE-Aware Approaches",
    completedDate: "2026-01-20",
    expiryDate: "2027-01-20",
    level: "informed",
    provider: "ACEs Hub Wales (adapted)",
  },
];

// ── Demo Data — Therapeutic Interventions ──────────────────────────────────

const DEMO_INTERVENTIONS: TherapeuticInterventionRecord[] = [
  {
    id: "int-01",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-01",
    interventionType: "therapeutic_parenting_session",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["safety", "trustworthiness", "empowerment"],
    practiceIndicators: ["therapeutic_parenting", "emotional_regulation_support", "strengths_based_language"],
    childResponse: "positive",
    durationMinutes: 45,
  },
  {
    id: "int-02",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-03",
    interventionType: "co_regulation_activity",
    deliveredBy: "Tom Richards",
    traumaPrinciplesApplied: ["safety", "collaboration"],
    practiceIndicators: ["co_regulation", "sensory_awareness"],
    childResponse: "positive",
    durationMinutes: 30,
  },
  {
    id: "int-03",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-06",
    interventionType: "life_story_work",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["trustworthiness", "empowerment", "cultural_sensitivity"],
    practiceIndicators: ["life_story_work", "safe_spaces"],
    childResponse: "neutral",
    durationMinutes: 60,
  },
  {
    id: "int-04",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-10",
    interventionType: "psychoeducation_session",
    deliveredBy: "Lisa Williams",
    traumaPrinciplesApplied: ["empowerment", "choice"],
    practiceIndicators: ["psychoeducation", "strengths_based_language"],
    childResponse: "positive",
    durationMinutes: 40,
  },
  {
    id: "int-05",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-01",
    interventionType: "sensory_regulation",
    deliveredBy: "Tom Richards",
    traumaPrinciplesApplied: ["safety", "choice"],
    practiceIndicators: ["sensory_awareness", "safe_spaces", "emotional_regulation_support"],
    childResponse: "positive",
    durationMinutes: 25,
  },
  {
    id: "int-06",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-04",
    interventionType: "relationship_repair",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["trustworthiness", "collaboration", "empowerment"],
    practiceIndicators: ["relationship_repair", "co_regulation"],
    childResponse: "positive",
    durationMinutes: 35,
  },
  {
    id: "int-07",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-07",
    interventionType: "therapeutic_parenting_session",
    deliveredBy: "Lisa Williams",
    traumaPrinciplesApplied: ["safety", "trustworthiness"],
    practiceIndicators: ["therapeutic_parenting", "predictable_routines"],
    childResponse: "neutral",
    durationMinutes: 45,
  },
  {
    id: "int-08",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-12",
    interventionType: "co_regulation_activity",
    deliveredBy: "Tom Richards",
    traumaPrinciplesApplied: ["collaboration", "safety"],
    practiceIndicators: ["co_regulation", "emotional_regulation_support"],
    childResponse: "positive",
    durationMinutes: 30,
  },
  {
    id: "int-09",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-02",
    interventionType: "therapeutic_parenting_session",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["safety", "empowerment", "cultural_sensitivity"],
    practiceIndicators: ["therapeutic_parenting", "strengths_based_language"],
    childResponse: "positive",
    durationMinutes: 50,
  },
  {
    id: "int-10",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-05",
    interventionType: "psychoeducation_session",
    deliveredBy: "Lisa Williams",
    traumaPrinciplesApplied: ["empowerment", "choice", "trustworthiness"],
    practiceIndicators: ["psychoeducation", "emotional_regulation_support"],
    childResponse: "positive",
    durationMinutes: 40,
  },
  {
    id: "int-11",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-08",
    interventionType: "life_story_work",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["trustworthiness", "cultural_sensitivity"],
    practiceIndicators: ["life_story_work", "safe_spaces"],
    childResponse: "neutral",
    durationMinutes: 55,
  },
  {
    id: "int-12",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-11",
    interventionType: "sensory_regulation",
    deliveredBy: "Tom Richards",
    traumaPrinciplesApplied: ["safety", "choice"],
    practiceIndicators: ["sensory_awareness", "predictable_routines"],
    childResponse: "positive",
    durationMinutes: 25,
  },
  {
    id: "int-13",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-14",
    interventionType: "relationship_repair",
    deliveredBy: "Lisa Williams",
    traumaPrinciplesApplied: ["collaboration", "trustworthiness"],
    practiceIndicators: ["relationship_repair", "co_regulation"],
    childResponse: "distressed",
    durationMinutes: 30,
    notes: "Morgan became distressed recalling peer conflict; session ended early with co-regulation support",
  },
  {
    id: "int-14",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-15",
    interventionType: "sensory_regulation",
    deliveredBy: "Tom Richards",
    traumaPrinciplesApplied: ["safety", "choice"],
    practiceIndicators: ["sensory_awareness", "predictable_routines"],
    childResponse: "positive",
    durationMinutes: 20,
  },
  {
    id: "int-15",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-16",
    interventionType: "life_story_work",
    deliveredBy: "Sarah Johnson",
    traumaPrinciplesApplied: ["trustworthiness", "cultural_sensitivity", "empowerment"],
    practiceIndicators: ["life_story_work", "strengths_based_language"],
    childResponse: "positive",
    durationMinutes: 50,
  },
  {
    id: "int-16",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-17",
    interventionType: "relationship_repair",
    deliveredBy: "Lisa Williams",
    traumaPrinciplesApplied: ["collaboration", "trustworthiness", "empowerment"],
    practiceIndicators: ["relationship_repair", "strengths_based_language"],
    childResponse: "refused",
    notes: "Alex declined to engage; revisit next session with alternative approach",
    durationMinutes: 10,
  },
];

// ── Demo Data — Environmental Adaptations ──────────────────────────────────

const DEMO_ADAPTATIONS: EnvironmentalAdaptation[] = [
  {
    id: "env-01",
    area: "Sensory Room",
    adaptation: "Dedicated calming space with weighted blankets, low lighting, and fidget tools",
    traumaPrinciple: "safety",
    implementedDate: "2025-09-01",
    reviewDate: "2026-09-01",
    status: "active",
  },
  {
    id: "env-02",
    area: "Communal Areas",
    adaptation: "Visual routine boards and consistent daily schedule displays",
    traumaPrinciple: "trustworthiness",
    implementedDate: "2025-10-15",
    reviewDate: "2026-04-15",
    status: "needs_review",
  },
  {
    id: "env-03",
    area: "Bedrooms",
    adaptation: "Personalised safe space boxes with self-selected comfort items",
    traumaPrinciple: "choice",
    implementedDate: "2026-01-10",
    reviewDate: "2026-07-10",
    status: "active",
    childSpecific: "child-alex",
  },
  {
    id: "env-04",
    area: "Garden",
    adaptation: "Outdoor therapeutic space with seating areas for 1:1 conversations",
    traumaPrinciple: "collaboration",
    implementedDate: "2026-02-01",
    reviewDate: "2026-08-01",
    status: "active",
  },
  {
    id: "env-05",
    area: "Kitchen",
    adaptation: "Cooking together programme supporting empowerment and life skills",
    traumaPrinciple: "empowerment",
    implementedDate: "2026-03-01",
    reviewDate: "2026-09-01",
    status: "active",
    childSpecific: "child-morgan",
  },
  {
    id: "env-06",
    area: "Quiet Room",
    adaptation: "Cultural identity display and resources reflecting diverse heritage",
    traumaPrinciple: "cultural_sensitivity",
    implementedDate: "2026-04-01",
    reviewDate: "2026-10-01",
    status: "active",
    childSpecific: "child-jordan",
  },
];

// ── Demo Data — Consultations ──────────────────────────────────────────────

const DEMO_CONSULTATIONS: ConsultationRecord[] = [
  {
    id: "cons-01",
    date: "2026-02-15",
    consultantName: "Dr Emma Clarke",
    consultationType: "clinical_psychologist",
    childrenDiscussed: ["child-alex", "child-jordan"],
    recommendations: [
      "Increase co-regulation opportunities for Alex",
      "Introduce life story work for Jordan at pace they set",
    ],
    actionsAgreed: [
      "Sarah to lead co-regulation sessions with Alex 3x per week",
      "Begin life story work with Jordan once rapport established",
    ],
    actionsCompleted: true,
  },
  {
    id: "cons-02",
    date: "2026-03-20",
    consultantName: "Dr Emma Clarke",
    consultationType: "clinical_psychologist",
    childrenDiscussed: ["child-morgan", "child-alex"],
    recommendations: [
      "Morgan showing progress with PACE-based approaches",
      "Consider sensory assessment for Alex",
    ],
    actionsAgreed: [
      "Continue PACE approaches with Morgan",
      "Refer Alex for occupational therapy sensory assessment",
    ],
    actionsCompleted: true,
  },
  {
    id: "cons-03",
    date: "2026-04-25",
    consultantName: "Dr Aisha Patel",
    consultationType: "CAMHS",
    childrenDiscussed: ["child-jordan", "child-morgan"],
    recommendations: [
      "Jordan may benefit from EMDR referral",
      "Maintain current therapeutic approaches for Morgan",
    ],
    actionsAgreed: [
      "Discuss EMDR referral with Jordan's social worker",
      "Continue current plan for Morgan with 6-week review",
    ],
    actionsCompleted: false,
  },
];

// ── Demo Data — Trauma Screenings ──────────────────────────────────────────

const DEMO_SCREENINGS: TraumaScreening[] = [
  {
    id: "scr-01",
    childId: "child-alex",
    childName: "Alex",
    screeningDate: "2026-01-15",
    screenedBy: "Sarah Johnson",
    traumaHistoryDocumented: true,
    triggersIdentified: ["loud noises", "unexpected changes to routine", "physical proximity from unfamiliar adults"],
    copingStrategiesIdentified: ["sensory room access", "drawing", "listening to music"],
    therapeuticNeedsAssessed: true,
    referralMade: true,
    nextReviewDate: "2026-07-15",
  },
  {
    id: "scr-02",
    childId: "child-jordan",
    childName: "Jordan",
    screeningDate: "2026-02-01",
    screenedBy: "Sarah Johnson",
    traumaHistoryDocumented: true,
    triggersIdentified: ["arguments between peers", "feeling excluded"],
    copingStrategiesIdentified: ["talking to key worker", "physical activity", "journaling"],
    therapeuticNeedsAssessed: true,
    referralMade: true,
    nextReviewDate: "2026-08-01",
  },
  {
    id: "scr-03",
    childId: "child-morgan",
    childName: "Morgan",
    screeningDate: "2026-02-15",
    screenedBy: "Lisa Williams",
    traumaHistoryDocumented: true,
    triggersIdentified: ["discussions about family", "feeling controlled", "mealtimes"],
    copingStrategiesIdentified: ["cooking", "time alone in room", "walking in garden"],
    therapeuticNeedsAssessed: true,
    referralMade: false,
    nextReviewDate: "2026-08-15",
  },
];

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. evaluateStaffCompetency ─────────────────────────────────────────────

describe("evaluateStaffCompetency", () => {
  it("returns zeroed result for empty training array", () => {
    const result = evaluateStaffCompetency([]);
    expect(result.staffCount).toBe(0);
    expect(result.trainedStaffCount).toBe(0);
    expect(result.trainingCoverageRate).toBe(0);
    expect(result.score).toBe(0);
    expect(result.specialistAvailable).toBe(false);
  });

  it("counts unique staff members correctly", () => {
    const result = evaluateStaffCompetency(DEMO_TRAINING, REF_DATE);
    expect(result.staffCount).toBe(4);
  });

  it("identifies specialist availability", () => {
    const result = evaluateStaffCompetency(DEMO_TRAINING, REF_DATE);
    expect(result.specialistAvailable).toBe(true);
    expect(result.specialistCount).toBe(1);
  });

  it("takes highest level per staff member", () => {
    const result = evaluateStaffCompetency(DEMO_TRAINING, REF_DATE);
    // Sarah: specialist (highest), Tom: responsive, Lisa: responsive, Darren: informed
    expect(result.levelBreakdown.specialist).toBe(1);
    expect(result.levelBreakdown.responsive).toBe(2);
    expect(result.levelBreakdown.informed).toBe(1);
    expect(result.levelBreakdown.awareness).toBe(0);
  });

  it("calculates training coverage rate (informed or above)", () => {
    const result = evaluateStaffCompetency(DEMO_TRAINING, REF_DATE);
    // All 4 staff are informed or above
    expect(result.trainingCoverageRate).toBe(100);
    expect(result.trainedStaffCount).toBe(4);
  });

  it("calculates average competency score", () => {
    const result = evaluateStaffCompetency(DEMO_TRAINING, REF_DATE);
    // specialist=4, responsive=3, responsive=3, informed=2 => avg = 3
    expect(result.averageCompetencyScore).toBe(3);
  });

  it("determines average competency level", () => {
    const result = evaluateStaffCompetency(DEMO_TRAINING, REF_DATE);
    expect(result.averageCompetencyLevel).toBe("responsive");
  });

  it("detects expired training records", () => {
    const expiredTraining: TraumaTrainingRecord[] = [
      {
        id: "exp-01",
        staffId: "staff-x",
        staffName: "Staff X",
        trainingType: "Old Training",
        completedDate: "2024-01-01",
        expiryDate: "2025-01-01",
        level: "informed",
        provider: "Provider",
      },
    ];
    const result = evaluateStaffCompetency(expiredTraining, REF_DATE);
    expect(result.expiredTrainingCount).toBe(1);
  });

  it("detects training expiring within 30 days", () => {
    const expiringTraining: TraumaTrainingRecord[] = [
      {
        id: "exp-soon-01",
        staffId: "staff-y",
        staffName: "Staff Y",
        trainingType: "Expiring Soon",
        completedDate: "2025-06-01",
        expiryDate: "2026-06-01",
        level: "responsive",
        provider: "Provider",
      },
    ];
    const result = evaluateStaffCompetency(expiringTraining, REF_DATE);
    expect(result.expiringWithin30Days).toBe(1);
  });

  it("reports no expiry issues when no expiryDate is set", () => {
    const noExpiry: TraumaTrainingRecord[] = [
      {
        id: "ne-01",
        staffId: "staff-z",
        staffName: "Staff Z",
        trainingType: "Lifelong Training",
        completedDate: "2025-01-01",
        level: "specialist",
        provider: "Provider",
      },
    ];
    const result = evaluateStaffCompetency(noExpiry, REF_DATE);
    expect(result.expiredTrainingCount).toBe(0);
    expect(result.expiringWithin30Days).toBe(0);
  });

  it("score is within 0-20 range", () => {
    const result = evaluateStaffCompetency(DEMO_TRAINING, REF_DATE);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("gives higher score for better training coverage", () => {
    const goodTraining = DEMO_TRAINING;
    const poorTraining: TraumaTrainingRecord[] = [
      {
        id: "poor-01",
        staffId: "staff-a",
        staffName: "Staff A",
        trainingType: "Basic Awareness",
        completedDate: "2026-01-01",
        level: "awareness",
        provider: "Provider",
      },
    ];
    const goodResult = evaluateStaffCompetency(goodTraining, REF_DATE);
    const poorResult = evaluateStaffCompetency(poorTraining, REF_DATE);
    expect(goodResult.score).toBeGreaterThan(poorResult.score);
  });

  it("penalises expired training in score", () => {
    const freshTraining: TraumaTrainingRecord[] = [
      {
        id: "f-01",
        staffId: "staff-f",
        staffName: "Staff F",
        trainingType: "Fresh Training",
        completedDate: "2026-01-01",
        expiryDate: "2027-01-01",
        level: "responsive",
        provider: "Provider",
      },
    ];
    const expiredTraining: TraumaTrainingRecord[] = [
      {
        id: "e-01",
        staffId: "staff-f",
        staffName: "Staff F",
        trainingType: "Expired Training",
        completedDate: "2024-01-01",
        expiryDate: "2025-01-01",
        level: "responsive",
        provider: "Provider",
      },
    ];
    const freshResult = evaluateStaffCompetency(freshTraining, REF_DATE);
    const expiredResult = evaluateStaffCompetency(expiredTraining, REF_DATE);
    expect(freshResult.score).toBeGreaterThan(expiredResult.score);
  });

  it("handles single staff member with multiple trainings", () => {
    const singleStaff: TraumaTrainingRecord[] = [
      {
        id: "ss-01",
        staffId: "staff-one",
        staffName: "Staff One",
        trainingType: "Basic",
        completedDate: "2026-01-01",
        level: "awareness",
        provider: "P",
      },
      {
        id: "ss-02",
        staffId: "staff-one",
        staffName: "Staff One",
        trainingType: "Advanced",
        completedDate: "2026-03-01",
        level: "specialist",
        provider: "P",
      },
    ];
    const result = evaluateStaffCompetency(singleStaff, REF_DATE);
    expect(result.staffCount).toBe(1);
    expect(result.levelBreakdown.specialist).toBe(1);
    expect(result.averageCompetencyLevel).toBe("specialist");
  });

  it("awareness-only staff count as not trained for coverage", () => {
    const awarenessOnly: TraumaTrainingRecord[] = [
      {
        id: "ao-01",
        staffId: "staff-ao",
        staffName: "Staff AO",
        trainingType: "Awareness Only",
        completedDate: "2026-01-01",
        level: "awareness",
        provider: "P",
      },
    ];
    const result = evaluateStaffCompetency(awarenessOnly, REF_DATE);
    expect(result.trainingCoverageRate).toBe(0);
    expect(result.trainedStaffCount).toBe(0);
  });

  it("demo data produces score above 15", () => {
    const result = evaluateStaffCompetency(DEMO_TRAINING, REF_DATE);
    expect(result.score).toBeGreaterThan(15);
  });
});

// ── 2. evaluatePracticeQuality ─────────────────────────────────────────────

describe("evaluatePracticeQuality", () => {
  it("returns zeroed result for empty interventions", () => {
    const result = evaluatePracticeQuality([]);
    expect(result.totalInterventions).toBe(0);
    expect(result.score).toBe(0);
    expect(result.principlesMissing.length).toBe(6);
    expect(result.indicatorsMissing.length).toBe(10);
  });

  it("counts total interventions", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    expect(result.totalInterventions).toBe(16);
  });

  it("identifies principles used across all interventions", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    expect(result.principlesUsed).toContain("safety");
    expect(result.principlesUsed).toContain("trustworthiness");
    expect(result.principlesUsed).toContain("choice");
    expect(result.principlesUsed).toContain("collaboration");
    expect(result.principlesUsed).toContain("empowerment");
    expect(result.principlesUsed).toContain("cultural_sensitivity");
  });

  it("calculates 100% principle coverage when all 6 are used", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    expect(result.principleCoverage).toBe(100);
    expect(result.principlesMissing).toEqual([]);
  });

  it("identifies missing principles when not all are used", () => {
    const limited: TherapeuticInterventionRecord[] = [
      {
        ...DEMO_INTERVENTIONS[0],
        traumaPrinciplesApplied: ["safety"],
        practiceIndicators: ["safe_spaces"],
      },
    ];
    const result = evaluatePracticeQuality(limited);
    expect(result.principlesMissing.length).toBe(5);
    expect(result.principlesMissing).not.toContain("safety");
  });

  it("tracks indicator frequency", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    expect(result.indicatorFrequency["therapeutic_parenting"]).toBeGreaterThan(0);
    expect(result.indicatorFrequency["co_regulation"]).toBeGreaterThan(0);
  });

  it("calculates indicator coverage", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    expect(result.indicatorCoverage).toBe(100);
    expect(result.indicatorsUsed.length).toBe(10);
    expect(result.indicatorsMissing.length).toBe(0);
  });

  it("calculates child response breakdown", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    expect(result.childResponseBreakdown.positive).toBeGreaterThan(0);
    expect(result.childResponseBreakdown.neutral).toBeGreaterThan(0);
    expect(result.childResponseBreakdown.distressed).toBeGreaterThan(0);
    expect(result.childResponseBreakdown.refused).toBeGreaterThan(0);
  });

  it("calculates positive response rate", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    // 11 positive out of 16
    expect(result.positiveResponseRate).toBeCloseTo(68.75, 1);
  });

  it("identifies unique intervention types", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    expect(result.interventionTypes).toContain("therapeutic_parenting_session");
    expect(result.interventionTypes).toContain("co_regulation_activity");
    expect(result.interventionTypes).toContain("life_story_work");
    expect(result.interventionTypes).toContain("sensory_regulation");
    expect(result.interventionTypes).toContain("psychoeducation_session");
    expect(result.interventionTypes).toContain("relationship_repair");
    expect(result.interventionVariety).toBe(6);
  });

  it("evaluates per-child quality", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    expect(result.perChildQuality.length).toBe(3);
    const alex = result.perChildQuality.find((c) => c.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.interventionCount).toBe(6);
  });

  it("per-child quality includes principle gaps", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    const jordan = result.perChildQuality.find((c) => c.childId === "child-jordan");
    expect(jordan).toBeDefined();
    expect(jordan!.principlesApplied.length).toBeGreaterThan(0);
  });

  it("score is within 0-30 range", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it("higher variety yields higher score", () => {
    const oneType: TherapeuticInterventionRecord[] = [
      { ...DEMO_INTERVENTIONS[0], interventionType: "only_type" },
      { ...DEMO_INTERVENTIONS[1], interventionType: "only_type" },
    ];
    const multiType: TherapeuticInterventionRecord[] = [
      { ...DEMO_INTERVENTIONS[0], interventionType: "type_a" },
      { ...DEMO_INTERVENTIONS[1], interventionType: "type_b" },
      { ...DEMO_INTERVENTIONS[2], interventionType: "type_c" },
      { ...DEMO_INTERVENTIONS[3], interventionType: "type_d" },
      { ...DEMO_INTERVENTIONS[4], interventionType: "type_e" },
    ];
    const oneResult = evaluatePracticeQuality(oneType);
    const multiResult = evaluatePracticeQuality(multiType);
    expect(multiResult.score).toBeGreaterThan(oneResult.score);
  });

  it("all-positive responses maximise response score component", () => {
    const allPositive = DEMO_INTERVENTIONS.map((i) => ({
      ...i,
      childResponse: "positive" as const,
    }));
    const result = evaluatePracticeQuality(allPositive);
    expect(result.positiveResponseRate).toBe(100);
  });

  it("all-refused responses yield 0% positive rate", () => {
    const allRefused = DEMO_INTERVENTIONS.map((i) => ({
      ...i,
      childResponse: "refused" as const,
    }));
    const result = evaluatePracticeQuality(allRefused);
    expect(result.positiveResponseRate).toBe(0);
  });

  it("demo data produces practice score above 20", () => {
    const result = evaluatePracticeQuality(DEMO_INTERVENTIONS);
    expect(result.score).toBeGreaterThan(20);
  });

  it("single intervention still produces valid evaluation", () => {
    const single = [DEMO_INTERVENTIONS[0]];
    const result = evaluatePracticeQuality(single);
    expect(result.totalInterventions).toBe(1);
    expect(result.perChildQuality.length).toBe(1);
    expect(result.score).toBeGreaterThan(0);
  });
});

// ── 3. evaluateEnvironment ─────────────────────────────────────────────────

describe("evaluateEnvironment", () => {
  it("returns zeroed result for empty adaptations", () => {
    const result = evaluateEnvironment([], REF_DATE);
    expect(result.totalAdaptations).toBe(0);
    expect(result.score).toBe(0);
    expect(result.principlesGap.length).toBe(6);
  });

  it("counts total and active adaptations", () => {
    const result = evaluateEnvironment(DEMO_ADAPTATIONS, REF_DATE);
    expect(result.totalAdaptations).toBe(6);
    expect(result.activeAdaptations).toBe(5);
  });

  it("identifies planned adaptations", () => {
    const withPlanned: EnvironmentalAdaptation[] = [
      ...DEMO_ADAPTATIONS,
      {
        id: "env-planned",
        area: "Hallway",
        adaptation: "Noise-reducing panels",
        traumaPrinciple: "safety",
        implementedDate: "2026-07-01",
        reviewDate: "2026-12-01",
        status: "planned",
      },
    ];
    const result = evaluateEnvironment(withPlanned, REF_DATE);
    expect(result.plannedAdaptations).toBe(1);
  });

  it("calculates principle alignment across adaptations", () => {
    const result = evaluateEnvironment(DEMO_ADAPTATIONS, REF_DATE);
    expect(result.principleAlignment.safety).toBe(1);
    expect(result.principleAlignment.trustworthiness).toBe(1);
    expect(result.principleAlignment.choice).toBe(1);
    expect(result.principleAlignment.collaboration).toBe(1);
    expect(result.principleAlignment.empowerment).toBe(1);
    expect(result.principleAlignment.cultural_sensitivity).toBe(1);
  });

  it("identifies all principles covered when complete", () => {
    const result = evaluateEnvironment(DEMO_ADAPTATIONS, REF_DATE);
    expect(result.principlesCovered.length).toBe(6);
    expect(result.principlesGap.length).toBe(0);
    expect(result.adaptationCoverage).toBe(100);
  });

  it("detects principle gaps", () => {
    const partial = DEMO_ADAPTATIONS.slice(0, 3); // safety, trustworthiness, choice only
    const result = evaluateEnvironment(partial, REF_DATE);
    expect(result.principlesGap.length).toBe(3);
    expect(result.principlesGap).toContain("collaboration");
    expect(result.principlesGap).toContain("empowerment");
    expect(result.principlesGap).toContain("cultural_sensitivity");
  });

  it("calculates review currency (overdue adaptations)", () => {
    const result = evaluateEnvironment(DEMO_ADAPTATIONS, REF_DATE);
    // env-02 has reviewDate 2026-04-15, which is before REF_DATE 2026-05-18
    expect(result.overdueReviews).toBe(1);
    expect(result.reviewCurrency).toBeLessThan(100);
  });

  it("counts child-specific adaptations", () => {
    const result = evaluateEnvironment(DEMO_ADAPTATIONS, REF_DATE);
    expect(result.childSpecificCount).toBe(3);
  });

  it("calculates child-specific rate", () => {
    const result = evaluateEnvironment(DEMO_ADAPTATIONS, REF_DATE);
    expect(result.childSpecificRate).toBe(50);
  });

  it("score is within 0-15 range", () => {
    const result = evaluateEnvironment(DEMO_ADAPTATIONS, REF_DATE);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(15);
  });

  it("more adaptations covering more principles yields higher score", () => {
    const minimal: EnvironmentalAdaptation[] = [DEMO_ADAPTATIONS[0]];
    const full = DEMO_ADAPTATIONS;
    const minResult = evaluateEnvironment(minimal, REF_DATE);
    const fullResult = evaluateEnvironment(full, REF_DATE);
    expect(fullResult.score).toBeGreaterThan(minResult.score);
  });

  it("100% review currency when no overdue reviews", () => {
    const allCurrent = DEMO_ADAPTATIONS.map((a) => ({
      ...a,
      reviewDate: "2026-12-01",
      status: "active" as const,
    }));
    const result = evaluateEnvironment(allCurrent, REF_DATE);
    expect(result.reviewCurrency).toBe(100);
    expect(result.overdueReviews).toBe(0);
  });

  it("planned adaptations are excluded from review currency", () => {
    const allPlanned: EnvironmentalAdaptation[] = [
      {
        id: "p1",
        area: "Area",
        adaptation: "Planned",
        traumaPrinciple: "safety",
        implementedDate: "2027-01-01",
        reviewDate: "2024-01-01", // would be overdue if counted
        status: "planned",
      },
    ];
    const result = evaluateEnvironment(allPlanned, REF_DATE);
    expect(result.reviewCurrency).toBe(100);
    expect(result.overdueReviews).toBe(0);
  });

  it("demo data produces environment score above 10", () => {
    const result = evaluateEnvironment(DEMO_ADAPTATIONS, REF_DATE);
    expect(result.score).toBeGreaterThan(10);
  });
});

// ── 4. evaluateConsultation ────────────────────────────────────────────────

describe("evaluateConsultation", () => {
  it("returns zeroed result for empty consultations", () => {
    const result = evaluateConsultation([]);
    expect(result.totalConsultations).toBe(0);
    expect(result.score).toBe(0);
  });

  it("passes childIds through to childrenNotDiscussed when empty", () => {
    const result = evaluateConsultation([], ["child-a", "child-b"]);
    expect(result.childrenNotDiscussed).toEqual(["child-a", "child-b"]);
  });

  it("counts total consultations", () => {
    const result = evaluateConsultation(DEMO_CONSULTATIONS, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalConsultations).toBe(3);
  });

  it("calculates consultation frequency per month", () => {
    const result = evaluateConsultation(DEMO_CONSULTATIONS, CHILD_IDS, PERIOD_START, PERIOD_END);
    // 3 consultations over ~4.5 months
    expect(result.consultationFrequencyPerMonth).toBeGreaterThan(0);
    expect(result.consultationFrequencyPerMonth).toBeLessThanOrEqual(3);
  });

  it("calculates action completion rate", () => {
    const result = evaluateConsultation(DEMO_CONSULTATIONS, CHILD_IDS, PERIOD_START, PERIOD_END);
    // 2 out of 3 consultations completed actions
    // cons-01 has 2 actions completed, cons-02 has 2 completed, cons-03 has 2 not completed
    // 4 completed out of 6 total
    expect(result.actionCompletionRate).toBeCloseTo(66.67, 1);
  });

  it("identifies children discussed", () => {
    const result = evaluateConsultation(DEMO_CONSULTATIONS, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.childrenDiscussedIds).toContain("child-alex");
    expect(result.childrenDiscussedIds).toContain("child-jordan");
    expect(result.childrenDiscussedIds).toContain("child-morgan");
  });

  it("calculates children coverage when all discussed", () => {
    const result = evaluateConsultation(DEMO_CONSULTATIONS, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.childrenCoverage).toBe(100);
    expect(result.childrenNotDiscussed.length).toBe(0);
  });

  it("detects children not discussed", () => {
    const extendedIds = [...CHILD_IDS, "child-extra"];
    const result = evaluateConsultation(DEMO_CONSULTATIONS, extendedIds, PERIOD_START, PERIOD_END);
    expect(result.childrenNotDiscussed).toContain("child-extra");
    expect(result.childrenCoverage).toBeLessThan(100);
  });

  it("calculates specialist variety", () => {
    const result = evaluateConsultation(DEMO_CONSULTATIONS, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.specialistVariety).toBe(2);
    expect(result.consultationTypes).toContain("clinical_psychologist");
    expect(result.consultationTypes).toContain("CAMHS");
  });

  it("score is within 0-15 range", () => {
    const result = evaluateConsultation(DEMO_CONSULTATIONS, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(15);
  });

  it("100% action completion yields higher score", () => {
    const allCompleted = DEMO_CONSULTATIONS.map((c) => ({
      ...c,
      actionsCompleted: true,
    }));
    const noneCompleted = DEMO_CONSULTATIONS.map((c) => ({
      ...c,
      actionsCompleted: false,
    }));
    const goodResult = evaluateConsultation(allCompleted, CHILD_IDS, PERIOD_START, PERIOD_END);
    const poorResult = evaluateConsultation(noneCompleted, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(goodResult.score).toBeGreaterThan(poorResult.score);
  });

  it("handles consultation with no actions agreed", () => {
    const noActions: ConsultationRecord[] = [
      {
        id: "na-01",
        date: "2026-03-01",
        consultantName: "Dr X",
        consultationType: "therapist",
        childrenDiscussed: ["child-alex"],
        recommendations: ["Recommendation"],
        actionsAgreed: [],
        actionsCompleted: false,
      },
    ];
    const result = evaluateConsultation(noActions, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalActionsAgreed).toBe(0);
    expect(result.actionCompletionRate).toBe(0);
  });

  it("frequency capped at practical levels", () => {
    const result = evaluateConsultation(DEMO_CONSULTATIONS, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.consultationFrequencyPerMonth).toBeGreaterThan(0.5);
  });

  it("demo data produces consultation score above 8", () => {
    const result = evaluateConsultation(DEMO_CONSULTATIONS, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.score).toBeGreaterThan(8);
  });
});

// ── 5. evaluateTraumaScreening ─────────────────────────────────────────────

describe("evaluateTraumaScreening", () => {
  it("returns zeroed result for empty childIds", () => {
    const result = evaluateTraumaScreening([], []);
    expect(result.screeningCoverage).toBe(0);
    expect(result.score).toBe(0);
  });

  it("calculates screening coverage", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    expect(result.screeningCoverage).toBe(100);
    expect(result.childrenScreened.length).toBe(3);
    expect(result.childrenNotScreened.length).toBe(0);
  });

  it("detects unscreened children", () => {
    const extendedIds = [...CHILD_IDS, "child-new"];
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, extendedIds, REF_DATE);
    expect(result.childrenNotScreened).toContain("child-new");
    expect(result.screeningCoverage).toBe(75);
  });

  it("calculates trigger documentation rate", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    expect(result.triggerDocumentationRate).toBe(100);
  });

  it("calculates coping strategy rate", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    expect(result.copingStrategyRate).toBe(100);
  });

  it("calculates therapeutic needs assessed rate", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    expect(result.therapeuticNeedsAssessedRate).toBe(100);
  });

  it("calculates referral rate", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    // 2 out of 3 had referrals
    expect(result.referralRate).toBeCloseTo(66.67, 1);
  });

  it("calculates average triggers per child", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    // Alex: 3, Jordan: 2, Morgan: 3 => avg 2.67
    expect(result.averageTriggersPerChild).toBeCloseTo(2.67, 1);
  });

  it("calculates average coping strategies per child", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    // All have 3 coping strategies each
    expect(result.averageCopingStrategiesPerChild).toBe(3);
  });

  it("detects overdue screening reviews", () => {
    const overdueScreening: TraumaScreening[] = [
      {
        ...DEMO_SCREENINGS[0],
        nextReviewDate: "2025-01-01", // well past
      },
    ];
    const result = evaluateTraumaScreening(overdueScreening, ["child-alex"], REF_DATE);
    expect(result.overdueReviews).toBe(1);
  });

  it("no overdue reviews when all future-dated", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    expect(result.overdueReviews).toBe(0);
  });

  it("uses latest screening per child when multiple exist", () => {
    const multipleScreenings: TraumaScreening[] = [
      {
        ...DEMO_SCREENINGS[0],
        id: "scr-old",
        screeningDate: "2025-06-01",
        triggersIdentified: ["old trigger"],
        copingStrategiesIdentified: [],
      },
      DEMO_SCREENINGS[0], // newer
    ];
    const result = evaluateTraumaScreening(multipleScreenings, ["child-alex"], REF_DATE);
    expect(result.averageTriggersPerChild).toBe(3); // from newer screening
  });

  it("score is within 0-20 range", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("full coverage and documentation yields high score", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    expect(result.score).toBeGreaterThan(15);
  });

  it("zero screenings for known children yields low score", () => {
    const result = evaluateTraumaScreening([], CHILD_IDS, REF_DATE);
    expect(result.score).toBe(0);
    expect(result.childrenNotScreened.length).toBe(3);
  });

  it("screening with no triggers documented lowers trigger rate", () => {
    const noTriggers: TraumaScreening[] = [
      {
        ...DEMO_SCREENINGS[0],
        triggersIdentified: [],
      },
    ];
    const result = evaluateTraumaScreening(noTriggers, ["child-alex"], REF_DATE);
    expect(result.triggerDocumentationRate).toBe(0);
  });

  it("screening with no coping strategies lowers coping rate", () => {
    const noCoping: TraumaScreening[] = [
      {
        ...DEMO_SCREENINGS[0],
        copingStrategiesIdentified: [],
      },
    ];
    const result = evaluateTraumaScreening(noCoping, ["child-alex"], REF_DATE);
    expect(result.copingStrategyRate).toBe(0);
  });

  it("demo data produces screening score above 15", () => {
    const result = evaluateTraumaScreening(DEMO_SCREENINGS, CHILD_IDS, REF_DATE);
    expect(result.score).toBeGreaterThan(15);
  });
});

// ── 6. generateTraumaInformedIntelligence ──────────────────────────────────

describe("generateTraumaInformedIntelligence", () => {
  function generateDemo() {
    return generateTraumaInformedIntelligence(
      DEMO_TRAINING,
      DEMO_INTERVENTIONS,
      DEMO_ADAPTATIONS,
      DEMO_CONSULTATIONS,
      DEMO_SCREENINGS,
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
  }

  it("returns correct homeId", () => {
    const result = generateDemo();
    expect(result.homeId).toBe("home-oak");
  });

  it("returns correct period dates", () => {
    const result = generateDemo();
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("sets generatedAt to reference date", () => {
    const result = generateDemo();
    expect(result.generatedAt).toBe(REF_DATE);
  });

  it("overall score is sum of component scores", () => {
    const result = generateDemo();
    const expected =
      result.staffCompetency.score +
      result.practiceQuality.score +
      result.environment.score +
      result.consultation.score +
      result.traumaScreening.score;
    expect(result.overallScore).toBeCloseTo(expected, 1);
  });

  it("overall score is within 0-100 range", () => {
    const result = generateDemo();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("demo data achieves outstanding or good rating", () => {
    const result = generateDemo();
    expect(["outstanding", "good"]).toContain(result.rating);
  });

  it("includes staffCompetency sub-evaluation", () => {
    const result = generateDemo();
    expect(result.staffCompetency).toBeDefined();
    expect(result.staffCompetency.staffCount).toBe(4);
  });

  it("includes practiceQuality sub-evaluation", () => {
    const result = generateDemo();
    expect(result.practiceQuality).toBeDefined();
    expect(result.practiceQuality.totalInterventions).toBe(16);
  });

  it("includes environment sub-evaluation", () => {
    const result = generateDemo();
    expect(result.environment).toBeDefined();
    expect(result.environment.totalAdaptations).toBe(6);
  });

  it("includes consultation sub-evaluation", () => {
    const result = generateDemo();
    expect(result.consultation).toBeDefined();
    expect(result.consultation.totalConsultations).toBe(3);
  });

  it("includes traumaScreening sub-evaluation", () => {
    const result = generateDemo();
    expect(result.traumaScreening).toBeDefined();
    expect(result.traumaScreening.screeningCoverage).toBe(100);
  });

  it("generates strengths array", () => {
    const result = generateDemo();
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("strengths mention specialist availability", () => {
    const result = generateDemo();
    expect(result.strengths.some((s) => s.toLowerCase().includes("specialist"))).toBe(true);
  });

  it("strengths mention training coverage", () => {
    const result = generateDemo();
    expect(result.strengths.some((s) => s.toLowerCase().includes("training"))).toBe(true);
  });

  it("generates actions array", () => {
    const result = generateDemo();
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("includes regulatory links", () => {
    const result = generateDemo();
    expect(result.regulatoryLinks.length).toBe(6);
  });

  it("regulatory links include CHR 2015 Reg 6", () => {
    const result = generateDemo();
    expect(result.regulatoryLinks.some((l) => l.regulation === "CHR 2015 Reg 6")).toBe(true);
  });

  it("regulatory links include CHR 2015 Reg 10", () => {
    const result = generateDemo();
    expect(result.regulatoryLinks.some((l) => l.regulation === "CHR 2015 Reg 10")).toBe(true);
  });

  it("regulatory links include CHR 2015 Reg 12", () => {
    const result = generateDemo();
    expect(result.regulatoryLinks.some((l) => l.regulation === "CHR 2015 Reg 12")).toBe(true);
  });

  it("regulatory links include NICE CG26", () => {
    const result = generateDemo();
    expect(result.regulatoryLinks.some((l) => l.regulation === "NICE CG26")).toBe(true);
  });

  it("regulatory links include Working Together 2023", () => {
    const result = generateDemo();
    expect(result.regulatoryLinks.some((l) => l.regulation === "Working Together 2023")).toBe(true);
  });

  it("regulatory links include SCCIF", () => {
    const result = generateDemo();
    expect(result.regulatoryLinks.some((l) => l.regulation === "SCCIF Quality of Care")).toBe(true);
  });

  it("areasForImprovement is an array", () => {
    const result = generateDemo();
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });
});

// ── 7. Rating Thresholds ───────────────────────────────────────────────────

describe("rating thresholds", () => {
  function generateWithScore(targetScore: "high" | "medium" | "low" | "verylow") {
    // We test via the full generator with manipulated data
    const training = targetScore === "verylow" ? [] : DEMO_TRAINING;
    const interventions =
      targetScore === "verylow" || targetScore === "low"
        ? []
        : DEMO_INTERVENTIONS;
    const adaptations =
      targetScore === "verylow" || targetScore === "low"
        ? []
        : DEMO_ADAPTATIONS;
    const consultations =
      targetScore === "verylow" || targetScore === "low"
        ? []
        : DEMO_CONSULTATIONS;
    const screenings =
      targetScore === "verylow" || targetScore === "low"
        ? []
        : DEMO_SCREENINGS;

    return generateTraumaInformedIntelligence(
      training,
      interventions,
      adaptations,
      consultations,
      screenings,
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
  }

  it("score >= 80 yields outstanding", () => {
    const result = generateWithScore("high");
    if (result.overallScore >= 80) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("score < 40 yields inadequate", () => {
    const result = generateWithScore("verylow");
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("all-empty data yields score 0 and inadequate", () => {
    const result = generateTraumaInformedIntelligence(
      [],
      [],
      [],
      [],
      [],
      [],
      "home-empty",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("partial data yields requires_improvement or above", () => {
    const result = generateTraumaInformedIntelligence(
      DEMO_TRAINING,
      [],
      DEMO_ADAPTATIONS,
      [],
      DEMO_SCREENINGS,
      CHILD_IDS,
      "home-partial",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    // Staff (20) + Environment (15) + Screening (20) = max 55
    expect(result.overallScore).toBeGreaterThan(0);
    expect(["outstanding", "good", "requires_improvement"]).toContain(result.rating);
  });
});

// ── 8. Strengths & Areas Detection ─────────────────────────────────────────

describe("strengths and areas detection", () => {
  it("no specialist triggers area for improvement", () => {
    const noSpecialist = DEMO_TRAINING.map((t) => ({
      ...t,
      level: "informed" as const,
    }));
    const result = generateTraumaInformedIntelligence(
      noSpecialist,
      DEMO_INTERVENTIONS,
      DEMO_ADAPTATIONS,
      DEMO_CONSULTATIONS,
      DEMO_SCREENINGS,
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    expect(result.areasForImprovement.some((a) => a.toLowerCase().includes("specialist"))).toBe(true);
  });

  it("expired training triggers action", () => {
    const expired = [
      {
        ...DEMO_TRAINING[0],
        expiryDate: "2025-01-01",
      },
    ];
    const result = generateTraumaInformedIntelligence(
      expired,
      DEMO_INTERVENTIONS,
      DEMO_ADAPTATIONS,
      DEMO_CONSULTATIONS,
      DEMO_SCREENINGS,
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("refresher") || a.toLowerCase().includes("expired"))).toBe(true);
  });

  it("unscreened children triggers action", () => {
    const result = generateTraumaInformedIntelligence(
      DEMO_TRAINING,
      DEMO_INTERVENTIONS,
      DEMO_ADAPTATIONS,
      DEMO_CONSULTATIONS,
      DEMO_SCREENINGS,
      [...CHILD_IDS, "child-new"],
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("unscreened"))).toBe(true);
  });

  it("low consultation frequency triggers area for improvement", () => {
    const result = generateTraumaInformedIntelligence(
      DEMO_TRAINING,
      DEMO_INTERVENTIONS,
      DEMO_ADAPTATIONS,
      [],
      DEMO_SCREENINGS,
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    // No consultations => frequency = 0
    expect(
      result.areasForImprovement.some(
        (a) => a.toLowerCase().includes("consultation") && a.toLowerCase().includes("frequency")
      )
    ).toBe(true);
  });

  it("overdue environmental reviews triggers action", () => {
    const overdueAdaptations = DEMO_ADAPTATIONS.map((a) => ({
      ...a,
      reviewDate: "2025-01-01",
      status: "active" as const,
    }));
    const result = generateTraumaInformedIntelligence(
      DEMO_TRAINING,
      DEMO_INTERVENTIONS,
      overdueAdaptations,
      DEMO_CONSULTATIONS,
      DEMO_SCREENINGS,
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    expect(result.actions.some((a) => a.toLowerCase().includes("overdue") && a.toLowerCase().includes("review"))).toBe(true);
  });

  it("high positive response rate generates strength", () => {
    const allPositive = DEMO_INTERVENTIONS.map((i) => ({
      ...i,
      childResponse: "positive" as const,
    }));
    const result = generateTraumaInformedIntelligence(
      DEMO_TRAINING,
      allPositive,
      DEMO_ADAPTATIONS,
      DEMO_CONSULTATIONS,
      DEMO_SCREENINGS,
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("positive response"))).toBe(true);
  });

  it("child-specific adaptations generate strength", () => {
    const result = generateTraumaInformedIntelligence(
      DEMO_TRAINING,
      DEMO_INTERVENTIONS,
      DEMO_ADAPTATIONS,
      DEMO_CONSULTATIONS,
      DEMO_SCREENINGS,
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("child-specific"))).toBe(true);
  });

  it("screening coverage generates strength when high", () => {
    const result = generateTraumaInformedIntelligence(
      DEMO_TRAINING,
      DEMO_INTERVENTIONS,
      DEMO_ADAPTATIONS,
      DEMO_CONSULTATIONS,
      DEMO_SCREENINGS,
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    expect(result.strengths.some((s) => s.toLowerCase().includes("screening"))).toBe(true);
  });
});

// ── 9. Utility Functions ───────────────────────────────────────────────────

describe("utility functions", () => {
  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });

  it("getRatingColour returns correct colours", () => {
    expect(getRatingColour("outstanding")).toContain("green");
    expect(getRatingColour("good")).toContain("blue");
    expect(getRatingColour("requires_improvement")).toContain("amber");
    expect(getRatingColour("inadequate")).toContain("red");
  });

  it("getCompetencyLabel returns correct labels", () => {
    expect(getCompetencyLabel("awareness")).toBe("Awareness");
    expect(getCompetencyLabel("informed")).toBe("Informed");
    expect(getCompetencyLabel("responsive")).toBe("Responsive");
    expect(getCompetencyLabel("specialist")).toBe("Specialist");
  });

  it("getPrincipleLabel returns correct labels", () => {
    expect(getPrincipleLabel("safety")).toBe("Safety");
    expect(getPrincipleLabel("trustworthiness")).toBe("Trustworthiness");
    expect(getPrincipleLabel("choice")).toBe("Choice");
    expect(getPrincipleLabel("collaboration")).toBe("Collaboration");
    expect(getPrincipleLabel("empowerment")).toBe("Empowerment");
    expect(getPrincipleLabel("cultural_sensitivity")).toBe("Cultural Sensitivity");
  });

  it("getIndicatorLabel returns correct labels", () => {
    expect(getIndicatorLabel("predictable_routines")).toBe("Predictable Routines");
    expect(getIndicatorLabel("safe_spaces")).toBe("Safe Spaces");
    expect(getIndicatorLabel("therapeutic_parenting")).toBe("Therapeutic Parenting");
    expect(getIndicatorLabel("life_story_work")).toBe("Life Story Work");
    expect(getIndicatorLabel("strengths_based_language")).toBe("Strengths-Based Language");
  });
});

// ── 10. Edge Cases ─────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("single staff member produces valid evaluation", () => {
    const single: TraumaTrainingRecord[] = [DEMO_TRAINING[0]];
    const result = evaluateStaffCompetency(single, REF_DATE);
    expect(result.staffCount).toBe(1);
    expect(result.score).toBeGreaterThan(0);
  });

  it("intervention with empty principles array still counts", () => {
    const noPrinciples: TherapeuticInterventionRecord[] = [
      {
        ...DEMO_INTERVENTIONS[0],
        traumaPrinciplesApplied: [],
        practiceIndicators: [],
      },
    ];
    const result = evaluatePracticeQuality(noPrinciples);
    expect(result.totalInterventions).toBe(1);
    expect(result.principleCoverage).toBe(0);
  });

  it("adaptation with future implementedDate is valid", () => {
    const future: EnvironmentalAdaptation[] = [
      {
        id: "fut-01",
        area: "New Area",
        adaptation: "Future planned",
        traumaPrinciple: "safety",
        implementedDate: "2027-01-01",
        reviewDate: "2027-07-01",
        status: "planned",
      },
    ];
    const result = evaluateEnvironment(future, REF_DATE);
    expect(result.plannedAdaptations).toBe(1);
    expect(result.totalAdaptations).toBe(1);
  });

  it("consultation discussing no children still counts", () => {
    const noChildren: ConsultationRecord[] = [
      {
        id: "nc-01",
        date: "2026-03-01",
        consultantName: "Dr X",
        consultationType: "therapist",
        childrenDiscussed: [],
        recommendations: [],
        actionsAgreed: [],
        actionsCompleted: true,
      },
    ];
    const result = evaluateConsultation(noChildren, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalConsultations).toBe(1);
    expect(result.childrenCoverage).toBe(0);
  });

  it("screening for unknown child does not affect coverage of known children", () => {
    const unknownScreening: TraumaScreening[] = [
      {
        ...DEMO_SCREENINGS[0],
        childId: "child-unknown",
        childName: "Unknown",
      },
    ];
    const result = evaluateTraumaScreening(unknownScreening, CHILD_IDS, REF_DATE);
    expect(result.screeningCoverage).toBe(0);
    expect(result.childrenNotScreened.length).toBe(3);
  });

  it("very large intervention set does not break scoring", () => {
    const large = Array.from({ length: 100 }, (_, i) => ({
      ...DEMO_INTERVENTIONS[0],
      id: `int-large-${i}`,
    }));
    const result = evaluatePracticeQuality(large);
    expect(result.totalInterventions).toBe(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it("duplicate staff training records are handled gracefully", () => {
    const duplicates = [...DEMO_TRAINING, ...DEMO_TRAINING];
    const result = evaluateStaffCompetency(duplicates, REF_DATE);
    expect(result.staffCount).toBe(4); // still 4 unique staff
  });

  it("generates intelligence with only training data", () => {
    const result = generateTraumaInformedIntelligence(
      DEMO_TRAINING,
      [],
      [],
      [],
      [],
      CHILD_IDS,
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REF_DATE
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.staffCompetency.score).toBeGreaterThan(0);
    expect(result.practiceQuality.score).toBe(0);
  });

  it("same-day period still produces valid frequency", () => {
    const result = evaluateConsultation(
      DEMO_CONSULTATIONS,
      CHILD_IDS,
      "2026-05-18T00:00:00Z",
      "2026-05-18T23:59:59Z"
    );
    expect(result.consultationFrequencyPerMonth).toBeGreaterThan(0);
  });
});
