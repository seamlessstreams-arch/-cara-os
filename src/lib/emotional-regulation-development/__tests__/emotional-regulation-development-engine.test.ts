// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Emotional Regulation Development Intelligence — Engine Tests
//
// Covers all evaluators, helpers, label getters, child profiles, and the
// main orchestrator. 50+ tests covering empty, perfect, partial, and edge cases.
//
// Demo data: Chamberlain House — Alex, Jordan, Morgan
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getRegulationStrategyLabel,
  getEmotionalStateLabel,
  getRatingLabel,
  getRegulationStrategyLabels,
  getEmotionalStateLabels,
  getRatingLabels,
  evaluateRegulationQuality,
  evaluateRegulationCompliance,
  evaluateRegulationPolicy,
  evaluateStaffEmotionalRegulationReadiness,
  buildChildEmotionalRegulationProfiles,
  generateEmotionalRegulationDevelopmentIntelligence,
} from "../emotional-regulation-development-engine";
import type {
  RegulationSession,
  EmotionalRegulationPolicy,
  StaffEmotionalRegulationTraining,
} from "../emotional-regulation-development-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const HOME_ID = "oak-house";
const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-20";

// ── Factories ──────────────────────────────────────────────────────────────

let _id = 0;
function nextId(prefix = "rec"): string { return `${prefix}-${++_id}`; }

function makeSession(overrides: Partial<RegulationSession> = {}): RegulationSession {
  return {
    id: nextId("rs"),
    childId: "child-alex",
    childName: "Alex",
    sessionDate: "2026-02-10",
    strategyUsed: "deep_breathing",
    emotionalStateBefore: "moderately_dysregulated",
    emotionalStateAfter: "calm_regulated",
    staffGuided: true,
    childInitiated: true,
    progressNoted: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<EmotionalRegulationPolicy> = {}): EmotionalRegulationPolicy {
  return {
    id: nextId("ep"),
    emotionalWellbeingStrategy: true,
    therapeuticApproachFramework: true,
    crisisInterventionProtocol: true,
    deEscalationProcedure: true,
    sensoryEnvironmentPolicy: true,
    staffEmotionalSupportGuidance: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffEmotionalRegulationTraining> = {}): StaffEmotionalRegulationTraining {
  return {
    id: nextId("st"),
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    emotionalLiteracy: true,
    deEscalationTechniques: true,
    therapeuticApproaches: true,
    traumaInformedCare: true,
    crisisIntervention: true,
    reflectivePractice: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct()
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating()
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getRegulationStrategyLabel", () => {
  it("returns correct label for deep_breathing", () => {
    expect(getRegulationStrategyLabel("deep_breathing")).toBe("Deep Breathing");
  });
  it("returns correct label for grounding_technique", () => {
    expect(getRegulationStrategyLabel("grounding_technique")).toBe("Grounding Technique");
  });
  it("returns correct label for mindfulness", () => {
    expect(getRegulationStrategyLabel("mindfulness")).toBe("Mindfulness");
  });
  it("returns correct label for physical_activity", () => {
    expect(getRegulationStrategyLabel("physical_activity")).toBe("Physical Activity");
  });
  it("returns correct label for creative_expression", () => {
    expect(getRegulationStrategyLabel("creative_expression")).toBe("Creative Expression");
  });
  it("returns correct label for talking_therapy", () => {
    expect(getRegulationStrategyLabel("talking_therapy")).toBe("Talking Therapy");
  });
  it("returns correct label for sensory_tool", () => {
    expect(getRegulationStrategyLabel("sensory_tool")).toBe("Sensory Tool");
  });
  it("returns correct label for safe_space_use", () => {
    expect(getRegulationStrategyLabel("safe_space_use")).toBe("Safe Space Use");
  });
});

describe("getEmotionalStateLabel", () => {
  it("returns correct label for calm_regulated", () => {
    expect(getEmotionalStateLabel("calm_regulated")).toBe("Calm / Regulated");
  });
  it("returns correct label for mildly_dysregulated", () => {
    expect(getEmotionalStateLabel("mildly_dysregulated")).toBe("Mildly Dysregulated");
  });
  it("returns correct label for moderately_dysregulated", () => {
    expect(getEmotionalStateLabel("moderately_dysregulated")).toBe("Moderately Dysregulated");
  });
  it("returns correct label for highly_dysregulated", () => {
    expect(getEmotionalStateLabel("highly_dysregulated")).toBe("Highly Dysregulated");
  });
  it("returns correct label for crisis", () => {
    expect(getEmotionalStateLabel("crisis")).toBe("Crisis");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns correct label for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns correct label for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns correct label for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("label map getters", () => {
  it("getRegulationStrategyLabels returns all 8 labels", () => {
    const labels = getRegulationStrategyLabels();
    expect(Object.keys(labels)).toHaveLength(8);
    expect(labels.deep_breathing).toBe("Deep Breathing");
  });

  it("getEmotionalStateLabels returns all 5 labels", () => {
    const labels = getEmotionalStateLabels();
    expect(Object.keys(labels)).toHaveLength(5);
    expect(labels.calm_regulated).toBe("Calm / Regulated");
  });

  it("getRatingLabels returns all 4 labels", () => {
    const labels = getRatingLabels();
    expect(Object.keys(labels)).toHaveLength(4);
    expect(labels.outstanding).toBe("Outstanding");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateRegulationQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRegulationQuality", () => {
  it("returns 0 for empty array", () => {
    const result = evaluateRegulationQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.improvementRate).toBe(0);
    expect(result.childInitiatedRate).toBe(0);
    expect(result.progressRate).toBe(0);
    expect(result.strategyEffectivenessRate).toBe(0);
  });

  it("returns perfect score for all sessions showing improvement", () => {
    const sessions = [
      makeSession({ emotionalStateBefore: "crisis", emotionalStateAfter: "calm_regulated", childInitiated: true, progressNoted: true }),
      makeSession({ childId: "child-jordan", childName: "Jordan", emotionalStateBefore: "highly_dysregulated", emotionalStateAfter: "mildly_dysregulated", childInitiated: true, progressNoted: true }),
    ];
    const result = evaluateRegulationQuality(sessions);
    expect(result.overallScore).toBe(25);
    expect(result.improvementRate).toBe(100);
    expect(result.childInitiatedRate).toBe(100);
    expect(result.progressRate).toBe(100);
    expect(result.strategyEffectivenessRate).toBe(100);
  });

  it("returns 0 when no improvement and no flags", () => {
    const sessions = [
      makeSession({ emotionalStateBefore: "calm_regulated", emotionalStateAfter: "crisis", childInitiated: false, progressNoted: false }),
    ];
    const result = evaluateRegulationQuality(sessions);
    expect(result.overallScore).toBe(0);
    expect(result.improvementRate).toBe(0);
    expect(result.childInitiatedRate).toBe(0);
  });

  it("detects improvement when afterRank < beforeRank", () => {
    const sessions = [makeSession({ emotionalStateBefore: "highly_dysregulated", emotionalStateAfter: "mildly_dysregulated" })];
    const result = evaluateRegulationQuality(sessions);
    expect(result.improvementRate).toBe(100);
  });

  it("does not count same state as improvement", () => {
    const sessions = [makeSession({ emotionalStateBefore: "moderately_dysregulated", emotionalStateAfter: "moderately_dysregulated", childInitiated: false, progressNoted: false })];
    const result = evaluateRegulationQuality(sessions);
    expect(result.improvementRate).toBe(0);
  });

  it("does not count worsening as improvement", () => {
    const sessions = [makeSession({ emotionalStateBefore: "calm_regulated", emotionalStateAfter: "mildly_dysregulated", childInitiated: false, progressNoted: false })];
    const result = evaluateRegulationQuality(sessions);
    expect(result.improvementRate).toBe(0);
  });

  it("calculates correct rates for partial data", () => {
    const sessions = [
      makeSession({ emotionalStateBefore: "crisis", emotionalStateAfter: "calm_regulated", childInitiated: true, progressNoted: true }),
      makeSession({ emotionalStateBefore: "calm_regulated", emotionalStateAfter: "calm_regulated", childInitiated: false, progressNoted: false }),
    ];
    const result = evaluateRegulationQuality(sessions);
    expect(result.improvementRate).toBe(50);
    expect(result.childInitiatedRate).toBe(50);
    expect(result.progressRate).toBe(50);
  });

  it("caps overall score at 25", () => {
    const sessions = [makeSession()];
    const result = evaluateRegulationQuality(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns totalSessions matching input length", () => {
    const sessions = [makeSession(), makeSession(), makeSession()];
    const result = evaluateRegulationQuality(sessions);
    expect(result.totalSessions).toBe(3);
  });

  it("strategy effectiveness equals improvement (both use same check)", () => {
    const sessions = [
      makeSession({ emotionalStateBefore: "crisis", emotionalStateAfter: "calm_regulated" }),
      makeSession({ emotionalStateBefore: "calm_regulated", emotionalStateAfter: "calm_regulated" }),
    ];
    const result = evaluateRegulationQuality(sessions);
    expect(result.strategyEffectivenessRate).toBe(result.improvementRate);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateRegulationCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRegulationCompliance", () => {
  it("returns 0 for empty array", () => {
    const result = evaluateRegulationCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
    expect(result.strategyDiversityRatio).toBe(0);
  });

  it("returns perfect score for fully compliant sessions with all 8 strategies", () => {
    const strategies: Array<RegulationSession["strategyUsed"]> = [
      "deep_breathing", "grounding_technique", "mindfulness", "physical_activity",
      "creative_expression", "talking_therapy", "sensory_tool", "safe_space_use",
    ];
    const sessions = strategies.map(strategyUsed =>
      makeSession({ strategyUsed, documentedInPlan: true, staffSupported: true, feedbackGiven: true }),
    );
    const result = evaluateRegulationCompliance(sessions);
    expect(result.overallScore).toBe(25);
    expect(result.documentedRate).toBe(100);
    expect(result.staffSupportedRate).toBe(100);
    expect(result.feedbackRate).toBe(100);
    expect(result.strategyDiversityRatio).toBe(100);
  });

  it("returns 0 when no compliance flags and single strategy", () => {
    const sessions = [
      makeSession({ documentedInPlan: false, staffSupported: false, feedbackGiven: false }),
    ];
    const result = evaluateRegulationCompliance(sessions);
    expect(result.documentedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
  });

  it("calculates documented rate correctly", () => {
    const sessions = [
      makeSession({ documentedInPlan: true }),
      makeSession({ documentedInPlan: false }),
      makeSession({ documentedInPlan: true }),
    ];
    const result = evaluateRegulationCompliance(sessions);
    expect(result.documentedRate).toBe(67);
  });

  it("calculates staff supported rate correctly", () => {
    const sessions = [
      makeSession({ staffSupported: true }),
      makeSession({ staffSupported: false }),
    ];
    const result = evaluateRegulationCompliance(sessions);
    expect(result.staffSupportedRate).toBe(50);
  });

  it("calculates feedback rate correctly", () => {
    const sessions = [
      makeSession({ feedbackGiven: true }),
      makeSession({ feedbackGiven: false }),
      makeSession({ feedbackGiven: false }),
    ];
    const result = evaluateRegulationCompliance(sessions);
    expect(result.feedbackRate).toBe(33);
  });

  it("calculates strategy diversity as percentage of 8", () => {
    const sessions = [
      makeSession({ strategyUsed: "deep_breathing" }),
      makeSession({ strategyUsed: "mindfulness" }),
      makeSession({ strategyUsed: "physical_activity" }),
      makeSession({ strategyUsed: "deep_breathing" }),
    ];
    const result = evaluateRegulationCompliance(sessions);
    // 3 unique / 8 = 37.5 -> rounds to 38
    expect(result.strategyDiversityRatio).toBe(38);
  });

  it("caps overall score at 25", () => {
    const strategies: Array<RegulationSession["strategyUsed"]> = [
      "deep_breathing", "grounding_technique", "mindfulness", "physical_activity",
      "creative_expression", "talking_therapy", "sensory_tool", "safe_space_use",
    ];
    const sessions = strategies.map(strategyUsed =>
      makeSession({ strategyUsed, documentedInPlan: true, staffSupported: true, feedbackGiven: true }),
    );
    const result = evaluateRegulationCompliance(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single strategy type with multiple sessions", () => {
    const sessions = [
      makeSession({ strategyUsed: "deep_breathing" }),
      makeSession({ strategyUsed: "deep_breathing" }),
      makeSession({ strategyUsed: "deep_breathing" }),
    ];
    const result = evaluateRegulationCompliance(sessions);
    // 1/8 = 12.5 -> 13
    expect(result.strategyDiversityRatio).toBe(13);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateRegulationPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRegulationPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateRegulationPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.emotionalWellbeingStrategy).toBe(false);
    expect(result.therapeuticApproachFramework).toBe(false);
    expect(result.crisisInterventionProtocol).toBe(false);
    expect(result.deEscalationProcedure).toBe(false);
    expect(result.sensoryEnvironmentPolicy).toBe(false);
    expect(result.staffEmotionalSupportGuidance).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns 25 for a fully complete policy", () => {
    const policy = makePolicy();
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 when all booleans are false", () => {
    const policy = makePolicy({
      emotionalWellbeingStrategy: false,
      therapeuticApproachFramework: false,
      crisisInterventionProtocol: false,
      deEscalationProcedure: false,
      sensoryEnvironmentPolicy: false,
      staffEmotionalSupportGuidance: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(0);
  });

  it("scores emotionalWellbeingStrategy as 4 points", () => {
    const policy = makePolicy({
      emotionalWellbeingStrategy: true,
      therapeuticApproachFramework: false,
      crisisInterventionProtocol: false,
      deEscalationProcedure: false,
      sensoryEnvironmentPolicy: false,
      staffEmotionalSupportGuidance: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores therapeuticApproachFramework as 4 points", () => {
    const policy = makePolicy({
      emotionalWellbeingStrategy: false,
      therapeuticApproachFramework: true,
      crisisInterventionProtocol: false,
      deEscalationProcedure: false,
      sensoryEnvironmentPolicy: false,
      staffEmotionalSupportGuidance: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores crisisInterventionProtocol as 4 points", () => {
    const policy = makePolicy({
      emotionalWellbeingStrategy: false,
      therapeuticApproachFramework: false,
      crisisInterventionProtocol: true,
      deEscalationProcedure: false,
      sensoryEnvironmentPolicy: false,
      staffEmotionalSupportGuidance: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores deEscalationProcedure as 4 points", () => {
    const policy = makePolicy({
      emotionalWellbeingStrategy: false,
      therapeuticApproachFramework: false,
      crisisInterventionProtocol: false,
      deEscalationProcedure: true,
      sensoryEnvironmentPolicy: false,
      staffEmotionalSupportGuidance: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores sensoryEnvironmentPolicy as 3 points", () => {
    const policy = makePolicy({
      emotionalWellbeingStrategy: false,
      therapeuticApproachFramework: false,
      crisisInterventionProtocol: false,
      deEscalationProcedure: false,
      sensoryEnvironmentPolicy: true,
      staffEmotionalSupportGuidance: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("scores staffEmotionalSupportGuidance as 3 points", () => {
    const policy = makePolicy({
      emotionalWellbeingStrategy: false,
      therapeuticApproachFramework: false,
      crisisInterventionProtocol: false,
      deEscalationProcedure: false,
      sensoryEnvironmentPolicy: false,
      staffEmotionalSupportGuidance: true,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("scores regularReview as 3 points", () => {
    const policy = makePolicy({
      emotionalWellbeingStrategy: false,
      therapeuticApproachFramework: false,
      crisisInterventionProtocol: false,
      deEscalationProcedure: false,
      sensoryEnvironmentPolicy: false,
      staffEmotionalSupportGuidance: false,
      regularReview: true,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("scores partial policy correctly (first 4 booleans true = 16)", () => {
    const policy = makePolicy({
      emotionalWellbeingStrategy: true,
      therapeuticApproachFramework: true,
      crisisInterventionProtocol: true,
      deEscalationProcedure: true,
      sensoryEnvironmentPolicy: false,
      staffEmotionalSupportGuidance: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(16);
  });

  it("mirrors boolean values from policy", () => {
    const policy = makePolicy({ emotionalWellbeingStrategy: true, regularReview: false });
    const result = evaluateRegulationPolicy(policy);
    expect(result.emotionalWellbeingStrategy).toBe(true);
    expect(result.regularReview).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffEmotionalRegulationReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffEmotionalRegulationReadiness", () => {
  it("returns 0 for empty array", () => {
    const result = evaluateStaffEmotionalRegulationReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.emotionalLiteracyRate).toBe(0);
    expect(result.deEscalationTechniquesRate).toBe(0);
    expect(result.therapeuticApproachesRate).toBe(0);
    expect(result.traumaInformedCareRate).toBe(0);
    expect(result.crisisInterventionRate).toBe(0);
    expect(result.reflectivePracticeRate).toBe(0);
  });

  it("returns 25 when all staff have all training", () => {
    const training = [
      makeTraining(),
      makeTraining({ staffId: "staff-tom", staffName: "Tom Richards" }),
    ];
    const result = evaluateStaffEmotionalRegulationReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.emotionalLiteracyRate).toBe(100);
    expect(result.deEscalationTechniquesRate).toBe(100);
    expect(result.therapeuticApproachesRate).toBe(100);
  });

  it("returns 0 when no staff have any training", () => {
    const training = [
      makeTraining({
        emotionalLiteracy: false, deEscalationTechniques: false,
        therapeuticApproaches: false, traumaInformedCare: false,
        crisisIntervention: false, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffEmotionalRegulationReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("scores emotionalLiteracy as 6 points max", () => {
    const training = [
      makeTraining({
        emotionalLiteracy: true, deEscalationTechniques: false,
        therapeuticApproaches: false, traumaInformedCare: false,
        crisisIntervention: false, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffEmotionalRegulationReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("scores deEscalationTechniques as 5 points max", () => {
    const training = [
      makeTraining({
        emotionalLiteracy: false, deEscalationTechniques: true,
        therapeuticApproaches: false, traumaInformedCare: false,
        crisisIntervention: false, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffEmotionalRegulationReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("scores therapeuticApproaches as 5 points max", () => {
    const training = [
      makeTraining({
        emotionalLiteracy: false, deEscalationTechniques: false,
        therapeuticApproaches: true, traumaInformedCare: false,
        crisisIntervention: false, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffEmotionalRegulationReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("scores traumaInformedCare as 4 points max", () => {
    const training = [
      makeTraining({
        emotionalLiteracy: false, deEscalationTechniques: false,
        therapeuticApproaches: false, traumaInformedCare: true,
        crisisIntervention: false, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffEmotionalRegulationReadiness(training);
    expect(result.overallScore).toBe(4);
  });

  it("scores crisisIntervention as 3 points max", () => {
    const training = [
      makeTraining({
        emotionalLiteracy: false, deEscalationTechniques: false,
        therapeuticApproaches: false, traumaInformedCare: false,
        crisisIntervention: true, reflectivePractice: false,
      }),
    ];
    const result = evaluateStaffEmotionalRegulationReadiness(training);
    expect(result.overallScore).toBe(3);
  });

  it("scores reflectivePractice as 2 points max", () => {
    const training = [
      makeTraining({
        emotionalLiteracy: false, deEscalationTechniques: false,
        therapeuticApproaches: false, traumaInformedCare: false,
        crisisIntervention: false, reflectivePractice: true,
      }),
    ];
    const result = evaluateStaffEmotionalRegulationReadiness(training);
    expect(result.overallScore).toBe(2);
  });

  it("calculates partial rates correctly with mixed training", () => {
    const training = [
      makeTraining({ emotionalLiteracy: true, deEscalationTechniques: true, therapeuticApproaches: true, traumaInformedCare: true, crisisIntervention: true, reflectivePractice: true }),
      makeTraining({ staffId: "staff-tom", staffName: "Tom", emotionalLiteracy: true, deEscalationTechniques: false, therapeuticApproaches: false, traumaInformedCare: false, crisisIntervention: false, reflectivePractice: false }),
    ];
    const result = evaluateStaffEmotionalRegulationReadiness(training);
    expect(result.emotionalLiteracyRate).toBe(100);
    expect(result.deEscalationTechniquesRate).toBe(50);
    expect(result.therapeuticApproachesRate).toBe(50);
    expect(result.totalStaff).toBe(2);
  });

  it("caps overall score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffEmotionalRegulationReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildEmotionalRegulationProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildEmotionalRegulationProfiles", () => {
  it("returns empty array when no sessions", () => {
    const result = buildChildEmotionalRegulationProfiles([]);
    expect(result).toHaveLength(0);
  });

  it("creates profile for child with sessions", () => {
    const sessions = [makeSession({ childId: "child-alex", childName: "Alex" })];
    const profiles = buildChildEmotionalRegulationProfiles(sessions);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalSessions).toBe(1);
  });

  it("creates separate profiles for multiple children", () => {
    const sessions = [
      makeSession({ childId: "child-alex", childName: "Alex" }),
      makeSession({ childId: "child-jordan", childName: "Jordan", strategyUsed: "sensory_tool" }),
    ];
    const profiles = buildChildEmotionalRegulationProfiles(sessions);
    expect(profiles).toHaveLength(2);
    const alexProfile = profiles.find(p => p.childId === "child-alex");
    const jordanProfile = profiles.find(p => p.childId === "child-jordan");
    expect(alexProfile).toBeDefined();
    expect(jordanProfile).toBeDefined();
  });

  it("calculates correct improvement rate", () => {
    const sessions = [
      makeSession({ emotionalStateBefore: "crisis", emotionalStateAfter: "calm_regulated" }),
      makeSession({ emotionalStateBefore: "calm_regulated", emotionalStateAfter: "calm_regulated" }),
      makeSession({ emotionalStateBefore: "highly_dysregulated", emotionalStateAfter: "mildly_dysregulated" }),
    ];
    const profiles = buildChildEmotionalRegulationProfiles(sessions);
    expect(profiles[0].improvementRate).toBe(67);
  });

  it("calculates correct child-initiated rate", () => {
    const sessions = [
      makeSession({ childInitiated: true }),
      makeSession({ childInitiated: false }),
      makeSession({ childInitiated: true }),
    ];
    const profiles = buildChildEmotionalRegulationProfiles(sessions);
    expect(profiles[0].childInitiatedRate).toBe(67);
  });

  it("scores frequency component correctly for >= 10 sessions", () => {
    const sessions = Array.from({ length: 10 }, () => makeSession({
      emotionalStateBefore: "moderately_dysregulated",
      emotionalStateAfter: "calm_regulated",
      childInitiated: true,
      strategyUsed: "deep_breathing",
    }));
    const profiles = buildChildEmotionalRegulationProfiles(sessions);
    // frequency: 2, improvement(100%): 3, childInitiated(100%): 3, diversity(1 strategy): 0 -> 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("scores frequency component correctly for >= 5 sessions", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({
      emotionalStateBefore: "calm_regulated",
      emotionalStateAfter: "calm_regulated",
      childInitiated: false,
      strategyUsed: "deep_breathing",
    }));
    const profiles = buildChildEmotionalRegulationProfiles(sessions);
    // frequency: 1, improvement(0%): 0, childInitiated(0%): 0, diversity(1): 0 -> 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("scores diversity component correctly for >= 4 strategies", () => {
    const sessions = [
      makeSession({ strategyUsed: "deep_breathing", emotionalStateBefore: "calm_regulated", emotionalStateAfter: "calm_regulated", childInitiated: false }),
      makeSession({ strategyUsed: "mindfulness", emotionalStateBefore: "calm_regulated", emotionalStateAfter: "calm_regulated", childInitiated: false }),
      makeSession({ strategyUsed: "physical_activity", emotionalStateBefore: "calm_regulated", emotionalStateAfter: "calm_regulated", childInitiated: false }),
      makeSession({ strategyUsed: "creative_expression", emotionalStateBefore: "calm_regulated", emotionalStateAfter: "calm_regulated", childInitiated: false }),
    ];
    const profiles = buildChildEmotionalRegulationProfiles(sessions);
    // frequency(<5): 0, improvement(0%): 0, childInitiated(0%): 0, diversity(4): 2 -> 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("scores diversity component correctly for >= 2 strategies", () => {
    const sessions = [
      makeSession({ strategyUsed: "deep_breathing", emotionalStateBefore: "calm_regulated", emotionalStateAfter: "calm_regulated", childInitiated: false }),
      makeSession({ strategyUsed: "mindfulness", emotionalStateBefore: "calm_regulated", emotionalStateAfter: "calm_regulated", childInitiated: false }),
    ];
    const profiles = buildChildEmotionalRegulationProfiles(sessions);
    // frequency(<5): 0, improvement(0%): 0, childInitiated(0%): 0, diversity(2): 1 -> 1
    expect(profiles[0].overallScore).toBe(1);
  });

  it("caps child profile score at 10", () => {
    const sessions = Array.from({ length: 12 }, (_, i) => makeSession({
      strategyUsed: (["deep_breathing", "grounding_technique", "mindfulness", "physical_activity", "creative_expression"] as const)[i % 5],
      emotionalStateBefore: "crisis",
      emotionalStateAfter: "calm_regulated",
      childInitiated: true,
    }));
    const profiles = buildChildEmotionalRegulationProfiles(sessions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("produces perfect 10 with max frequency, improvement, childInitiated, and diversity", () => {
    const strategies: Array<RegulationSession["strategyUsed"]> = [
      "deep_breathing", "grounding_technique", "mindfulness", "physical_activity",
      "creative_expression", "talking_therapy", "sensory_tool", "safe_space_use",
      "deep_breathing", "grounding_technique",
    ];
    const sessions = strategies.map(strategyUsed => makeSession({
      strategyUsed,
      emotionalStateBefore: "crisis",
      emotionalStateAfter: "calm_regulated",
      childInitiated: true,
    }));
    const profiles = buildChildEmotionalRegulationProfiles(sessions);
    // frequency(10): 2, improvement(100%): 3, childInitiated(100%): 3, diversity(8): 2 -> 10
    expect(profiles[0].overallScore).toBe(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateEmotionalRegulationDevelopmentIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateEmotionalRegulationDevelopmentIntelligence", () => {
  it("produces complete intelligence with all sections", () => {
    const sessions = [makeSession()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.regulationQuality).toBeDefined();
    expect(result.regulationCompliance).toBeDefined();
    expect(result.regulationPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("returns outstanding rating for perfect data", () => {
    const strategies: Array<RegulationSession["strategyUsed"]> = [
      "deep_breathing", "grounding_technique", "mindfulness", "physical_activity",
      "creative_expression", "talking_therapy", "sensory_tool", "safe_space_use",
    ];
    const sessions = strategies.map(strategyUsed =>
      makeSession({
        strategyUsed,
        emotionalStateBefore: "crisis",
        emotionalStateAfter: "calm_regulated",
        childInitiated: true,
        progressNoted: true,
        documentedInPlan: true,
        staffSupported: true,
        feedbackGiven: true,
      }),
    );
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ staffId: "staff-tom", staffName: "Tom" })];
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate rating for empty/poor data", () => {
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      [makeSession({
        emotionalStateBefore: "calm_regulated",
        emotionalStateAfter: "crisis",
        childInitiated: false,
        progressNoted: false,
        documentedInPlan: false,
        staffSupported: false,
        feedbackGiven: false,
      })],
      null,
      [],
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("caps overall score at 100", () => {
    const strategies: Array<RegulationSession["strategyUsed"]> = [
      "deep_breathing", "grounding_technique", "mindfulness", "physical_activity",
      "creative_expression", "talking_therapy", "sensory_tool", "safe_space_use",
    ];
    const sessions = strategies.map(strategyUsed =>
      makeSession({ strategyUsed, emotionalStateBefore: "crisis", emotionalStateAfter: "calm_regulated" }),
    );
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("sums all 4 evaluator scores", () => {
    const sessions = [makeSession()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    const expectedSum = result.regulationQuality.overallScore + result.regulationCompliance.overallScore +
      result.regulationPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("includes regulatory links", () => {
    const result = generateEmotionalRegulationDevelopmentIntelligence([], null, [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some(l => l.includes("CHR 2015 Regulation 6"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("CHR 2015 Regulation 12"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("UNCRC Article 39"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("NICE CG158"))).toBe(true);
  });

  it("generates URGENT action for missing sessions", () => {
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      [], makePolicy(), [makeTraining()], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("URGENT") && a.includes("No regulation sessions recorded"))).toBe(true);
  });

  it("generates URGENT action for missing policy", () => {
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      [makeSession()], null, [makeTraining()], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("URGENT") && a.includes("No emotional regulation policy"))).toBe(true);
  });

  it("generates URGENT action for missing training", () => {
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      [makeSession()], makePolicy(), [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("URGENT") && a.includes("No staff emotional regulation training records"))).toBe(true);
  });

  it("generates strength for high improvement rate", () => {
    const sessions = [
      makeSession({ emotionalStateBefore: "crisis", emotionalStateAfter: "calm_regulated" }),
      makeSession({ emotionalStateBefore: "highly_dysregulated", emotionalStateAfter: "mildly_dysregulated" }),
    ];
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("High emotional state improvement rate"))).toBe(true);
  });

  it("generates strength for high child-initiated rate", () => {
    const sessions = [
      makeSession({ childInitiated: true }),
      makeSession({ childInitiated: true }),
    ];
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Children frequently initiate their own regulation"))).toBe(true);
  });

  it("generates strength for comprehensive policy", () => {
    const policy = makePolicy();
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Comprehensive emotional regulation policy"))).toBe(true);
  });

  it("generates strength for strong staff readiness", () => {
    const training = [makeTraining()];
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Strong staff readiness"))).toBe(true);
  });

  it("generates area for improvement for low improvement rate", () => {
    const sessions = [
      makeSession({ emotionalStateBefore: "calm_regulated", emotionalStateAfter: "crisis" }),
      makeSession({ emotionalStateBefore: "calm_regulated", emotionalStateAfter: "moderately_dysregulated" }),
    ];
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Emotional state improvement rate is below"))).toBe(true);
  });

  it("generates area for improvement for missing wellbeing strategy", () => {
    const policy = makePolicy({ emotionalWellbeingStrategy: false });
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("No emotional wellbeing strategy"))).toBe(true);
  });

  it("handles all-empty data gracefully", () => {
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toHaveLength(0);
  });

  it("includes child profiles in the result", () => {
    const sessions = [
      makeSession({ childId: "child-alex", childName: "Alex" }),
      makeSession({ childId: "child-jordan", childName: "Jordan", strategyUsed: "sensory_tool" }),
    ];
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles).toHaveLength(2);
    expect(result.childProfiles.some(p => p.childId === "child-alex")).toBe(true);
    expect(result.childProfiles.some(p => p.childId === "child-jordan")).toBe(true);
  });

  it("assigns rating 100 for perfect data across all evaluators", () => {
    const strategies: Array<RegulationSession["strategyUsed"]> = [
      "deep_breathing", "grounding_technique", "mindfulness", "physical_activity",
      "creative_expression", "talking_therapy", "sensory_tool", "safe_space_use",
    ];
    const sessions = strategies.map(strategyUsed =>
      makeSession({
        strategyUsed,
        emotionalStateBefore: "crisis",
        emotionalStateAfter: "calm_regulated",
        childInitiated: true,
        progressNoted: true,
        documentedInPlan: true,
        staffSupported: true,
        feedbackGiven: true,
      }),
    );
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });
});
