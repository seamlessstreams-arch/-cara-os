// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Emotional Regulation Support Intelligence — Engine Tests
//
// Covers all evaluators, helpers, label getters, child profiles, and the
// main orchestrator. 80+ tests covering empty, perfect, partial, and edge cases.
//
// Demo data: Chamberlain House — Alex (14), Jordan (13), Morgan (15)
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getStrategyTypeLabel,
  getOutcomeLevelLabel,
  getRatingLabel,
  getStrategyTypeLabels,
  getOutcomeLevelLabels,
  getRatingLabels,
  evaluateSessionEffectiveness,
  evaluateTherapeuticApproach,
  evaluateRegulationPolicy,
  evaluateStaffRegulationReadiness,
  buildChildRegulationProfiles,
  generateEmotionalRegulationSupportIntelligence,
} from "../emotional-regulation-support-engine";
import type {
  RegulationSession,
  RegulationPolicy,
  StaffRegulationTraining,
} from "../emotional-regulation-support-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const HOME_ID = "oak-house";
const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-19";

// ── Factories ──────────────────────────────────────────────────────────────

let _id = 0;
function nextId(prefix = "rec"): string { return `${prefix}-${++_id}`; }

function makeSession(overrides: Partial<RegulationSession> = {}): RegulationSession {
  return {
    id: nextId("rs"),
    childId: "child-alex",
    childName: "Alex",
    sessionDate: "2026-02-10",
    strategyType: "breathing_exercises",
    outcomeLevel: "effective",
    childLed: true,
    staffCoRegulated: true,
    emotionIdentified: true,
    copingPlanUpdated: true,
    recordedInCasefile: true,
    therapeuticApproach: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<RegulationPolicy> = {}): RegulationPolicy {
  return {
    id: nextId("rp"),
    emotionalRegulationFramework: true,
    coRegulationGuidance: true,
    therapeuticApproach: true,
    safeSpaceAvailable: true,
    sensoryToolsProvided: true,
    crisisDeescalation: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffRegulationTraining> = {}): StaffRegulationTraining {
  return {
    id: nextId("rt"),
    staffId: "s-01",
    staffName: "Sarah Johnson",
    emotionalRegulation: true,
    coRegulation: true,
    traumaInformed: true,
    sensoryProcessing: true,
    emotionCoaching: true,
    therapeuticApproach: true,
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

describe("getStrategyTypeLabel", () => {
  it("returns correct label for breathing_exercises", () => {
    expect(getStrategyTypeLabel("breathing_exercises")).toBe("Breathing Exercises");
  });
  it("returns correct label for grounding_techniques", () => {
    expect(getStrategyTypeLabel("grounding_techniques")).toBe("Grounding Techniques");
  });
  it("returns correct label for sensory_tools", () => {
    expect(getStrategyTypeLabel("sensory_tools")).toBe("Sensory Tools");
  });
  it("returns correct label for safe_space", () => {
    expect(getStrategyTypeLabel("safe_space")).toBe("Safe Space");
  });
  it("returns correct label for co_regulation", () => {
    expect(getStrategyTypeLabel("co_regulation")).toBe("Co-Regulation");
  });
  it("returns correct label for emotion_coaching", () => {
    expect(getStrategyTypeLabel("emotion_coaching")).toBe("Emotion Coaching");
  });
  it("returns correct label for mindfulness", () => {
    expect(getStrategyTypeLabel("mindfulness")).toBe("Mindfulness");
  });
  it("returns correct label for physical_activity", () => {
    expect(getStrategyTypeLabel("physical_activity")).toBe("Physical Activity");
  });
});

describe("getOutcomeLevelLabel", () => {
  it("returns correct label for very_effective", () => {
    expect(getOutcomeLevelLabel("very_effective")).toBe("Very Effective");
  });
  it("returns correct label for effective", () => {
    expect(getOutcomeLevelLabel("effective")).toBe("Effective");
  });
  it("returns correct label for partially_effective", () => {
    expect(getOutcomeLevelLabel("partially_effective")).toBe("Partially Effective");
  });
  it("returns correct label for not_effective", () => {
    expect(getOutcomeLevelLabel("not_effective")).toBe("Not Effective");
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
  it("getStrategyTypeLabels returns all 8 labels", () => {
    const labels = getStrategyTypeLabels();
    expect(Object.keys(labels)).toHaveLength(8);
    expect(labels.breathing_exercises).toBe("Breathing Exercises");
  });

  it("getOutcomeLevelLabels returns all 4 labels", () => {
    const labels = getOutcomeLevelLabels();
    expect(Object.keys(labels)).toHaveLength(4);
    expect(labels.very_effective).toBe("Very Effective");
  });

  it("getRatingLabels returns all 4 labels", () => {
    const labels = getRatingLabels();
    expect(Object.keys(labels)).toHaveLength(4);
    expect(labels.outstanding).toBe("Outstanding");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSessionEffectiveness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSessionEffectiveness", () => {
  it("returns 0 for empty array", () => {
    const result = evaluateSessionEffectiveness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.childLedRate).toBe(0);
    expect(result.coRegulatedRate).toBe(0);
    expect(result.recordedRate).toBe(0);
    expect(result.emotionIdentifiedRate).toBe(0);
  });

  it("returns perfect score for all sessions fully handled", () => {
    const sessions = [
      makeSession({ outcomeLevel: "very_effective", childLed: true, staffCoRegulated: true, emotionIdentified: true, recordedInCasefile: true }),
      makeSession({ childId: "child-jordan", childName: "Jordan", outcomeLevel: "effective", childLed: true, staffCoRegulated: true, emotionIdentified: true, recordedInCasefile: true }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.overallScore).toBe(25);
    expect(result.positiveOutcomeRate).toBe(100);
    expect(result.childLedRate).toBe(100);
    expect(result.coRegulatedRate).toBe(100);
    expect(result.recordedRate).toBe(100);
    expect(result.emotionIdentifiedRate).toBe(100);
  });

  it("returns 0 when all sessions have worst outcomes and no flags", () => {
    const sessions = [
      makeSession({ outcomeLevel: "not_effective", childLed: false, staffCoRegulated: false, emotionIdentified: false, recordedInCasefile: false }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.overallScore).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.childLedRate).toBe(0);
  });

  it("counts very_effective as positive outcome", () => {
    const sessions = [makeSession({ outcomeLevel: "very_effective" })];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.positiveOutcomeRate).toBe(100);
  });

  it("counts effective as positive outcome", () => {
    const sessions = [makeSession({ outcomeLevel: "effective" })];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.positiveOutcomeRate).toBe(100);
  });

  it("does not count partially_effective as positive outcome", () => {
    const sessions = [makeSession({ outcomeLevel: "partially_effective", childLed: false, staffCoRegulated: false, emotionIdentified: false, recordedInCasefile: false })];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.positiveOutcomeRate).toBe(0);
  });

  it("calculates correct rates for partial completion", () => {
    const sessions = [
      makeSession({ outcomeLevel: "effective", childLed: true, staffCoRegulated: true, emotionIdentified: true, recordedInCasefile: true }),
      makeSession({ childId: "child-jordan", outcomeLevel: "not_effective", childLed: false, staffCoRegulated: false, emotionIdentified: false, recordedInCasefile: false }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.positiveOutcomeRate).toBe(50);
    expect(result.childLedRate).toBe(50);
    expect(result.coRegulatedRate).toBe(50);
    expect(result.recordedRate).toBe(50);
    expect(result.emotionIdentifiedRate).toBe(50);
  });

  it("caps overall score at 25", () => {
    const sessions = [makeSession()];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns totalSessions matching input length", () => {
    const sessions = [makeSession(), makeSession(), makeSession()];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.totalSessions).toBe(3);
  });

  it("handles single session with only childLed", () => {
    const sessions = [
      makeSession({ outcomeLevel: "not_effective", childLed: true, staffCoRegulated: false, emotionIdentified: false, recordedInCasefile: false }),
    ];
    const result = evaluateSessionEffectiveness(sessions);
    expect(result.childLedRate).toBe(100);
    expect(result.positiveOutcomeRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateTherapeuticApproach
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTherapeuticApproach", () => {
  it("returns 0 for empty array", () => {
    const result = evaluateTherapeuticApproach([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.therapeuticRate).toBe(0);
    expect(result.copingPlanUpdateRate).toBe(0);
    expect(result.strategyDiversity).toBe(0);
  });

  it("returns perfect score when all sessions are ideal across all 8 strategies", () => {
    const types: Array<RegulationSession["strategyType"]> = [
      "breathing_exercises", "grounding_techniques", "sensory_tools", "safe_space",
      "co_regulation", "emotion_coaching", "mindfulness", "physical_activity",
    ];
    const sessions = types.map(strategyType =>
      makeSession({ strategyType, therapeuticApproach: true, copingPlanUpdated: true }),
    );
    const result = evaluateTherapeuticApproach(sessions);
    expect(result.overallScore).toBe(25);
    expect(result.therapeuticRate).toBe(100);
    expect(result.copingPlanUpdateRate).toBe(100);
    expect(result.strategyDiversity).toBe(8);
  });

  it("returns 0 when no sessions have therapeutic approach or coping plan and only 1 type", () => {
    const sessions = [
      makeSession({ therapeuticApproach: false, copingPlanUpdated: false }),
    ];
    const result = evaluateTherapeuticApproach(sessions);
    expect(result.therapeuticRate).toBe(0);
    expect(result.copingPlanUpdateRate).toBe(0);
    expect(result.strategyDiversity).toBe(1);
  });

  it("calculates therapeutic rate correctly", () => {
    const sessions = [
      makeSession({ therapeuticApproach: true }),
      makeSession({ therapeuticApproach: false }),
      makeSession({ therapeuticApproach: true }),
    ];
    const result = evaluateTherapeuticApproach(sessions);
    expect(result.therapeuticRate).toBe(67);
  });

  it("calculates coping plan update rate correctly", () => {
    const sessions = [
      makeSession({ copingPlanUpdated: true }),
      makeSession({ copingPlanUpdated: false }),
    ];
    const result = evaluateTherapeuticApproach(sessions);
    expect(result.copingPlanUpdateRate).toBe(50);
  });

  it("scores variety correctly with 3 types", () => {
    const sessions = [
      makeSession({ strategyType: "breathing_exercises" }),
      makeSession({ strategyType: "grounding_techniques" }),
      makeSession({ strategyType: "mindfulness" }),
    ];
    const result = evaluateTherapeuticApproach(sessions);
    expect(result.strategyDiversity).toBe(3);
  });

  it("caps overall score at 25", () => {
    const types: Array<RegulationSession["strategyType"]> = [
      "breathing_exercises", "grounding_techniques", "sensory_tools", "safe_space",
      "co_regulation", "emotion_coaching", "mindfulness", "physical_activity",
    ];
    const sessions = types.map(strategyType =>
      makeSession({ strategyType, therapeuticApproach: true, copingPlanUpdated: true }),
    );
    const result = evaluateTherapeuticApproach(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single strategy type with multiple sessions", () => {
    const sessions = [
      makeSession({ strategyType: "breathing_exercises" }),
      makeSession({ strategyType: "breathing_exercises" }),
      makeSession({ strategyType: "breathing_exercises" }),
    ];
    const result = evaluateTherapeuticApproach(sessions);
    expect(result.strategyDiversity).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateRegulationPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRegulationPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateRegulationPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.emotionalRegulationFramework).toBe(false);
    expect(result.coRegulationGuidance).toBe(false);
    expect(result.therapeuticApproach).toBe(false);
    expect(result.safeSpaceAvailable).toBe(false);
    expect(result.sensoryToolsProvided).toBe(false);
    expect(result.crisisDeescalation).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns 25 for a fully complete policy", () => {
    const policy = makePolicy();
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(25);
    expect(result.emotionalRegulationFramework).toBe(true);
    expect(result.coRegulationGuidance).toBe(true);
    expect(result.therapeuticApproach).toBe(true);
    expect(result.safeSpaceAvailable).toBe(true);
    expect(result.sensoryToolsProvided).toBe(true);
    expect(result.crisisDeescalation).toBe(true);
    expect(result.regularReview).toBe(true);
  });

  it("returns 0 when all booleans are false", () => {
    const policy = makePolicy({
      emotionalRegulationFramework: false,
      coRegulationGuidance: false,
      therapeuticApproach: false,
      safeSpaceAvailable: false,
      sensoryToolsProvided: false,
      crisisDeescalation: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(0);
  });

  it("scores emotionalRegulationFramework as 4 points", () => {
    const policy = makePolicy({
      emotionalRegulationFramework: true,
      coRegulationGuidance: false,
      therapeuticApproach: false,
      safeSpaceAvailable: false,
      sensoryToolsProvided: false,
      crisisDeescalation: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores coRegulationGuidance as 4 points", () => {
    const policy = makePolicy({
      emotionalRegulationFramework: false,
      coRegulationGuidance: true,
      therapeuticApproach: false,
      safeSpaceAvailable: false,
      sensoryToolsProvided: false,
      crisisDeescalation: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores therapeuticApproach as 4 points", () => {
    const policy = makePolicy({
      emotionalRegulationFramework: false,
      coRegulationGuidance: false,
      therapeuticApproach: true,
      safeSpaceAvailable: false,
      sensoryToolsProvided: false,
      crisisDeescalation: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores safeSpaceAvailable as 4 points", () => {
    const policy = makePolicy({
      emotionalRegulationFramework: false,
      coRegulationGuidance: false,
      therapeuticApproach: false,
      safeSpaceAvailable: true,
      sensoryToolsProvided: false,
      crisisDeescalation: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores sensoryToolsProvided as 3 points", () => {
    const policy = makePolicy({
      emotionalRegulationFramework: false,
      coRegulationGuidance: false,
      therapeuticApproach: false,
      safeSpaceAvailable: false,
      sensoryToolsProvided: true,
      crisisDeescalation: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("scores crisisDeescalation as 3 points", () => {
    const policy = makePolicy({
      emotionalRegulationFramework: false,
      coRegulationGuidance: false,
      therapeuticApproach: false,
      safeSpaceAvailable: false,
      sensoryToolsProvided: false,
      crisisDeescalation: true,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("scores regularReview as 3 points", () => {
    const policy = makePolicy({
      emotionalRegulationFramework: false,
      coRegulationGuidance: false,
      therapeuticApproach: false,
      safeSpaceAvailable: false,
      sensoryToolsProvided: false,
      crisisDeescalation: false,
      regularReview: true,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("caps score at 25", () => {
    const policy = makePolicy();
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores partial policy correctly (first 4 booleans true = 16)", () => {
    const policy = makePolicy({
      emotionalRegulationFramework: true,
      coRegulationGuidance: true,
      therapeuticApproach: true,
      safeSpaceAvailable: true,
      sensoryToolsProvided: false,
      crisisDeescalation: false,
      regularReview: false,
    });
    const result = evaluateRegulationPolicy(policy);
    expect(result.overallScore).toBe(16);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffRegulationReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffRegulationReadiness", () => {
  it("returns 0 for empty array", () => {
    const result = evaluateStaffRegulationReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.emotionalRegulationRate).toBe(0);
    expect(result.coRegulationRate).toBe(0);
    expect(result.traumaInformedRate).toBe(0);
    expect(result.sensoryProcessingRate).toBe(0);
    expect(result.emotionCoachingRate).toBe(0);
    expect(result.therapeuticApproachRate).toBe(0);
  });

  it("returns 25 when all staff have all training", () => {
    const training = [
      makeTraining(),
      makeTraining({ staffId: "s-02", staffName: "Tom Richards" }),
    ];
    const result = evaluateStaffRegulationReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.emotionalRegulationRate).toBe(100);
    expect(result.coRegulationRate).toBe(100);
    expect(result.traumaInformedRate).toBe(100);
  });

  it("returns 0 when no staff have any training", () => {
    const training = [
      makeTraining({
        emotionalRegulation: false, coRegulation: false,
        traumaInformed: false, sensoryProcessing: false,
        emotionCoaching: false, therapeuticApproach: false,
      }),
    ];
    const result = evaluateStaffRegulationReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("scores emotionalRegulation as 6 points max", () => {
    const training = [
      makeTraining({
        emotionalRegulation: true, coRegulation: false,
        traumaInformed: false, sensoryProcessing: false,
        emotionCoaching: false, therapeuticApproach: false,
      }),
    ];
    const result = evaluateStaffRegulationReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("scores coRegulation as 5 points max", () => {
    const training = [
      makeTraining({
        emotionalRegulation: false, coRegulation: true,
        traumaInformed: false, sensoryProcessing: false,
        emotionCoaching: false, therapeuticApproach: false,
      }),
    ];
    const result = evaluateStaffRegulationReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("scores traumaInformed as 5 points max", () => {
    const training = [
      makeTraining({
        emotionalRegulation: false, coRegulation: false,
        traumaInformed: true, sensoryProcessing: false,
        emotionCoaching: false, therapeuticApproach: false,
      }),
    ];
    const result = evaluateStaffRegulationReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("scores sensoryProcessing as 4 points max", () => {
    const training = [
      makeTraining({
        emotionalRegulation: false, coRegulation: false,
        traumaInformed: false, sensoryProcessing: true,
        emotionCoaching: false, therapeuticApproach: false,
      }),
    ];
    const result = evaluateStaffRegulationReadiness(training);
    expect(result.overallScore).toBe(4);
  });

  it("scores emotionCoaching as 3 points max", () => {
    const training = [
      makeTraining({
        emotionalRegulation: false, coRegulation: false,
        traumaInformed: false, sensoryProcessing: false,
        emotionCoaching: true, therapeuticApproach: false,
      }),
    ];
    const result = evaluateStaffRegulationReadiness(training);
    expect(result.overallScore).toBe(3);
  });

  it("scores therapeuticApproach as 2 points max", () => {
    const training = [
      makeTraining({
        emotionalRegulation: false, coRegulation: false,
        traumaInformed: false, sensoryProcessing: false,
        emotionCoaching: false, therapeuticApproach: true,
      }),
    ];
    const result = evaluateStaffRegulationReadiness(training);
    expect(result.overallScore).toBe(2);
  });

  it("calculates partial rates correctly with mixed training", () => {
    const training = [
      makeTraining({ emotionalRegulation: true, coRegulation: true, traumaInformed: true, sensoryProcessing: true, emotionCoaching: true, therapeuticApproach: true }),
      makeTraining({ staffId: "s-02", staffName: "Tom", emotionalRegulation: true, coRegulation: false, traumaInformed: false, sensoryProcessing: false, emotionCoaching: false, therapeuticApproach: false }),
    ];
    const result = evaluateStaffRegulationReadiness(training);
    expect(result.emotionalRegulationRate).toBe(100);
    expect(result.coRegulationRate).toBe(50);
    expect(result.traumaInformedRate).toBe(50);
    expect(result.totalStaff).toBe(2);
  });

  it("caps overall score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffRegulationReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildRegulationProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildRegulationProfiles", () => {
  it("returns empty array when no sessions", () => {
    const result = buildChildRegulationProfiles([]);
    expect(result).toHaveLength(0);
  });

  it("creates profile for child with sessions", () => {
    const sessions = [makeSession({ childId: "child-alex", childName: "Alex" })];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalSessions).toBe(1);
  });

  it("creates separate profiles for multiple children", () => {
    const sessions = [
      makeSession({ childId: "child-alex", childName: "Alex" }),
      makeSession({ childId: "child-jordan", childName: "Jordan", strategyType: "sensory_tools" }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles).toHaveLength(2);
    const alexProfile = profiles.find(p => p.childId === "child-alex");
    const jordanProfile = profiles.find(p => p.childId === "child-jordan");
    expect(alexProfile).toBeDefined();
    expect(jordanProfile).toBeDefined();
    expect(jordanProfile!.strategyTypes).toContain("sensory_tools");
  });

  it("calculates correct child-led rate", () => {
    const sessions = [
      makeSession({ childLed: true }),
      makeSession({ childLed: false }),
      makeSession({ childLed: true }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].childLedRate).toBe(67);
  });

  it("calculates correct positive outcome rate", () => {
    const sessions = [
      makeSession({ outcomeLevel: "very_effective" }),
      makeSession({ outcomeLevel: "effective" }),
      makeSession({ outcomeLevel: "not_effective" }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].positiveOutcomeRate).toBe(67);
  });

  it("calculates correct co-regulation rate", () => {
    const sessions = [
      makeSession({ staffCoRegulated: true }),
      makeSession({ staffCoRegulated: false }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].coRegulatedRate).toBe(50);
  });

  it("identifies risk factor for low positive outcome rate", () => {
    const sessions = [
      makeSession({ outcomeLevel: "not_effective", childLed: false, staffCoRegulated: false }),
      makeSession({ outcomeLevel: "partially_effective", childLed: false, staffCoRegulated: false }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].riskFactors).toContain("Low positive outcome rate from regulation sessions");
  });

  it("identifies risk factor for child rarely leading", () => {
    const sessions = [
      makeSession({ childLed: false }),
      makeSession({ childLed: false }),
      makeSession({ childLed: false }),
      makeSession({ childLed: true }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].riskFactors).toContain("Child rarely leads their own regulation — limited autonomy");
  });

  it("identifies risk factor for low co-regulation", () => {
    const sessions = [
      makeSession({ staffCoRegulated: false }),
      makeSession({ staffCoRegulated: false }),
      makeSession({ staffCoRegulated: true }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].riskFactors).toContain("Low co-regulation rate — child may lack adult support during dysregulation");
  });

  it("identifies risk factor for limited strategy variety", () => {
    const sessions = [
      makeSession({ strategyType: "breathing_exercises" }),
      makeSession({ strategyType: "breathing_exercises" }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].riskFactors).toContain("Limited strategy variety — child relies on single approach");
  });

  it("identifies risk factor for very few sessions", () => {
    const sessions = [makeSession()];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].riskFactors).toContain("Very few regulation sessions recorded — monitoring needed");
  });

  it("identifies protective factor for high positive outcome rate", () => {
    const sessions = [
      makeSession({ outcomeLevel: "very_effective" }),
      makeSession({ outcomeLevel: "effective" }),
      makeSession({ outcomeLevel: "effective" }),
      makeSession({ outcomeLevel: "effective" }),
      makeSession({ outcomeLevel: "effective" }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].protectiveFactors).toContain("High positive outcome rate from regulation sessions");
  });

  it("identifies protective factor for child frequently leading", () => {
    const sessions = [
      makeSession({ childLed: true }),
      makeSession({ childLed: true }),
      makeSession({ childLed: true }),
      makeSession({ childLed: false }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].protectiveFactors).toContain("Child frequently leads their own regulation — good autonomy");
  });

  it("identifies protective factor for strong co-regulation support", () => {
    const sessions = [
      makeSession({ staffCoRegulated: true }),
      makeSession({ staffCoRegulated: true }),
      makeSession({ staffCoRegulated: true }),
      makeSession({ staffCoRegulated: true }),
      makeSession({ staffCoRegulated: true }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].protectiveFactors).toContain("Strong co-regulation support from staff");
  });

  it("identifies protective factor for diverse strategies", () => {
    const sessions = [
      makeSession({ strategyType: "breathing_exercises" }),
      makeSession({ strategyType: "grounding_techniques" }),
      makeSession({ strategyType: "mindfulness" }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].protectiveFactors).toContain("Diverse range of regulation strategies used");
  });

  it("identifies protective factor for good volume of sessions", () => {
    const sessions = [
      makeSession(), makeSession(), makeSession(), makeSession(), makeSession(),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].protectiveFactors).toContain("Good volume of regulation sessions — consistent support");
  });

  it("caps child profile score at 10", () => {
    const sessions = [makeSession()];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("calculates correct score for perfect profile with diverse strategies", () => {
    const sessions = [
      makeSession({ strategyType: "breathing_exercises", outcomeLevel: "very_effective", childLed: true, staffCoRegulated: true }),
      makeSession({ strategyType: "grounding_techniques", outcomeLevel: "effective", childLed: true, staffCoRegulated: true }),
      makeSession({ strategyType: "mindfulness", outcomeLevel: "effective", childLed: true, staffCoRegulated: true }),
      makeSession({ strategyType: "emotion_coaching", outcomeLevel: "effective", childLed: true, staffCoRegulated: true }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    // positiveOutcome(100%)=3, childLed(100%)=3, coRegulated(100%)=2, diversity(4/8)=1 = 9
    expect(profiles[0].overallScore).toBe(9);
  });

  it("collects unique strategy types for a child", () => {
    const sessions = [
      makeSession({ strategyType: "breathing_exercises" }),
      makeSession({ strategyType: "mindfulness" }),
      makeSession({ strategyType: "breathing_exercises" }),
    ];
    const profiles = buildChildRegulationProfiles(sessions);
    expect(profiles[0].strategyTypes).toHaveLength(2);
    expect(profiles[0].strategyTypes).toContain("breathing_exercises");
    expect(profiles[0].strategyTypes).toContain("mindfulness");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateEmotionalRegulationSupportIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateEmotionalRegulationSupportIntelligence", () => {
  it("produces complete intelligence with all sections", () => {
    const sessions = [makeSession()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.sessionEffectiveness).toBeDefined();
    expect(result.therapeuticApproach).toBeDefined();
    expect(result.regulationPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("returns outstanding rating for perfect data", () => {
    const types: Array<RegulationSession["strategyType"]> = [
      "breathing_exercises", "grounding_techniques", "sensory_tools", "safe_space",
      "co_regulation", "emotion_coaching", "mindfulness", "physical_activity",
    ];
    const sessions = types.map(strategyType =>
      makeSession({ strategyType, outcomeLevel: "very_effective", childLed: true, staffCoRegulated: true, emotionIdentified: true, recordedInCasefile: true, therapeuticApproach: true, copingPlanUpdated: true }),
    );
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ staffId: "s-02", staffName: "Tom" })];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate rating for empty/poor data", () => {
    const result = generateEmotionalRegulationSupportIntelligence(
      [makeSession({ outcomeLevel: "not_effective", childLed: false, staffCoRegulated: false, emotionIdentified: false, recordedInCasefile: false, therapeuticApproach: false, copingPlanUpdated: false })],
      null,
      [],
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("caps overall score at 100", () => {
    const types: Array<RegulationSession["strategyType"]> = [
      "breathing_exercises", "grounding_techniques", "sensory_tools", "safe_space",
      "co_regulation", "emotion_coaching", "mindfulness", "physical_activity",
    ];
    const sessions = types.map(strategyType =>
      makeSession({ strategyType, outcomeLevel: "very_effective", childLed: true, staffCoRegulated: true, emotionIdentified: true, recordedInCasefile: true, therapeuticApproach: true, copingPlanUpdated: true }),
    );
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("sums all 4 evaluator scores", () => {
    const sessions = [makeSession()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    const expectedSum = result.sessionEffectiveness.overallScore + result.therapeuticApproach.overallScore +
      result.regulationPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("includes regulatory links", () => {
    const result = generateEmotionalRegulationSupportIntelligence([], null, [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("UNCRC Article 24"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("NICE CG158"))).toBe(true);
  });

  it("generates strength for strong session effectiveness", () => {
    const sessions = [
      makeSession({ outcomeLevel: "very_effective", childLed: true, staffCoRegulated: true, emotionIdentified: true, recordedInCasefile: true }),
      makeSession({ outcomeLevel: "effective", childLed: true, staffCoRegulated: true, emotionIdentified: true, recordedInCasefile: true }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Strong session effectiveness"))).toBe(true);
  });

  it("generates strength for high positive outcome rate", () => {
    const sessions = [
      makeSession({ outcomeLevel: "very_effective" }),
      makeSession({ outcomeLevel: "effective" }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("High positive outcome rate"))).toBe(true);
  });

  it("generates strength for children leading their own regulation", () => {
    const sessions = [
      makeSession({ childLed: true }),
      makeSession({ childLed: true }),
      makeSession({ childLed: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Children frequently lead their own regulation"))).toBe(true);
  });

  it("generates strength for excellent co-regulation", () => {
    const sessions = [
      makeSession({ staffCoRegulated: true }),
      makeSession({ staffCoRegulated: true }),
      makeSession({ staffCoRegulated: true }),
      makeSession({ staffCoRegulated: true }),
      makeSession({ staffCoRegulated: true }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Excellent co-regulation support"))).toBe(true);
  });

  it("generates strength for therapeutic approaches embedded", () => {
    const sessions = [
      makeSession({ therapeuticApproach: true }),
      makeSession({ therapeuticApproach: true }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Therapeutic approaches consistently embedded"))).toBe(true);
  });

  it("generates strength for coping plans regularly updated", () => {
    const sessions = [
      makeSession({ copingPlanUpdated: true }),
      makeSession({ copingPlanUpdated: true }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Coping plans regularly updated"))).toBe(true);
  });

  it("generates strength for wide range of strategies", () => {
    const types: Array<RegulationSession["strategyType"]> = [
      "breathing_exercises", "grounding_techniques", "sensory_tools", "safe_space", "mindfulness",
    ];
    const sessions = types.map(strategyType => makeSession({ strategyType }));
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Wide range of regulation strategies"))).toBe(true);
  });

  it("generates strength for comprehensive policy", () => {
    const policy = makePolicy();
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Comprehensive emotional regulation policy"))).toBe(true);
  });

  it("generates strength for safe spaces and sensory tools", () => {
    const policy = makePolicy({ safeSpaceAvailable: true, sensoryToolsProvided: true });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Safe spaces and sensory tools"))).toBe(true);
  });

  it("generates strength for strong staff readiness", () => {
    const training = [makeTraining()];
    const result = generateEmotionalRegulationSupportIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Strong staff readiness"))).toBe(true);
  });

  it("generates strength for emotional regulation training coverage", () => {
    const training = [makeTraining(), makeTraining({ staffId: "s-02" })];
    const result = generateEmotionalRegulationSupportIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Majority of staff trained in emotional regulation"))).toBe(true);
  });

  it("generates strength for co-regulation training coverage", () => {
    const training = [makeTraining(), makeTraining({ staffId: "s-02" })];
    const result = generateEmotionalRegulationSupportIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Strong co-regulation training coverage"))).toBe(true);
  });

  it("generates area for improvement for low positive outcomes", () => {
    const sessions = [
      makeSession({ outcomeLevel: "not_effective" }),
      makeSession({ outcomeLevel: "not_effective" }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Positive outcome rate from regulation sessions is below"))).toBe(true);
  });

  it("generates area for improvement for children rarely leading", () => {
    const sessions = [
      makeSession({ childLed: false }),
      makeSession({ childLed: false }),
      makeSession({ childLed: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Children rarely lead their own regulation"))).toBe(true);
  });

  it("generates area for improvement for inconsistent co-regulation", () => {
    const sessions = [
      makeSession({ staffCoRegulated: false }),
      makeSession({ staffCoRegulated: false }),
      makeSession({ staffCoRegulated: true }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Co-regulation support is inconsistent"))).toBe(true);
  });

  it("generates area for improvement for recording gaps", () => {
    const sessions = [
      makeSession({ recordedInCasefile: false }),
      makeSession({ recordedInCasefile: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Not all regulation sessions are recorded"))).toBe(true);
  });

  it("generates area for improvement for emotions not identified", () => {
    const sessions = [
      makeSession({ emotionIdentified: false }),
      makeSession({ emotionIdentified: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Emotions not consistently identified"))).toBe(true);
  });

  it("generates area for improvement for missing regulation framework", () => {
    const policy = makePolicy({ emotionalRegulationFramework: false });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("No emotional regulation framework"))).toBe(true);
  });

  it("generates area for improvement for missing co-regulation guidance", () => {
    const policy = makePolicy({ coRegulationGuidance: false });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Policy lacks co-regulation guidance"))).toBe(true);
  });

  it("generates area for improvement for missing crisis de-escalation", () => {
    const policy = makePolicy({ crisisDeescalation: false });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Crisis de-escalation procedures not included"))).toBe(true);
  });

  it("generates area for improvement for no safe space", () => {
    const policy = makePolicy({ safeSpaceAvailable: false });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("No safe space available"))).toBe(true);
  });

  it("generates area for improvement for no sensory tools", () => {
    const policy = makePolicy({ sensoryToolsProvided: false });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Sensory tools not provided"))).toBe(true);
  });

  it("generates area for improvement for insufficient ER training", () => {
    const training = [
      makeTraining({ emotionalRegulation: false }),
      makeTraining({ staffId: "s-02", emotionalRegulation: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Emotional regulation training coverage is insufficient"))).toBe(true);
  });

  it("generates area for improvement for low co-regulation training", () => {
    const training = [
      makeTraining({ coRegulation: false }),
      makeTraining({ staffId: "s-02", coRegulation: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Co-regulation training is low"))).toBe(true);
  });

  it("generates area for improvement for insufficient trauma-informed training", () => {
    const training = [
      makeTraining({ traumaInformed: false }),
      makeTraining({ staffId: "s-02", traumaInformed: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Trauma-informed practice training is insufficient"))).toBe(true);
  });

  it("generates action for reviewing low outcome strategies", () => {
    const sessions = [
      makeSession({ outcomeLevel: "not_effective" }),
      makeSession({ outcomeLevel: "not_effective" }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Review regulation strategies for children with low outcome rates"))).toBe(true);
  });

  it("generates action for developing child-led opportunities", () => {
    const sessions = [
      makeSession({ childLed: false }),
      makeSession({ childLed: false }),
      makeSession({ childLed: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Develop opportunities for children to lead their own regulation"))).toBe(true);
  });

  it("generates action for recording protocol", () => {
    const sessions = [
      makeSession({ recordedInCasefile: false }),
      makeSession({ recordedInCasefile: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Implement a recording protocol"))).toBe(true);
  });

  it("generates action for developing regulation framework", () => {
    const policy = makePolicy({ emotionalRegulationFramework: false });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Develop and embed an emotional regulation framework"))).toBe(true);
  });

  it("generates action for co-regulation guidance", () => {
    const policy = makePolicy({ coRegulationGuidance: false });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Add co-regulation guidance"))).toBe(true);
  });

  it("generates action for crisis de-escalation", () => {
    const policy = makePolicy({ crisisDeescalation: false });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Establish crisis de-escalation procedures"))).toBe(true);
  });

  it("generates action for safe space", () => {
    const policy = makePolicy({ safeSpaceAvailable: false });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Create a designated safe space"))).toBe(true);
  });

  it("generates action for sensory tools", () => {
    const policy = makePolicy({ sensoryToolsProvided: false });
    const result = generateEmotionalRegulationSupportIntelligence(
      [], policy, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Procure and make available sensory regulation tools"))).toBe(true);
  });

  it("generates action for emotional regulation training", () => {
    const training = [
      makeTraining({ emotionalRegulation: false }),
      makeTraining({ staffId: "s-02", emotionalRegulation: true }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Schedule emotional regulation training"))).toBe(true);
  });

  it("generates action for co-regulation training", () => {
    const training = [
      makeTraining({ coRegulation: false }),
      makeTraining({ staffId: "s-02", coRegulation: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Provide co-regulation training"))).toBe(true);
  });

  it("generates action for trauma-informed training", () => {
    const training = [
      makeTraining({ traumaInformed: false }),
      makeTraining({ staffId: "s-02", traumaInformed: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      [], null, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Deliver trauma-informed practice training"))).toBe(true);
  });

  it("handles all-empty data gracefully", () => {
    const result = generateEmotionalRegulationSupportIntelligence(
      [], null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toHaveLength(0);
  });

  it("assigns rating thresholds correctly for perfect data", () => {
    const types: Array<RegulationSession["strategyType"]> = [
      "breathing_exercises", "grounding_techniques", "sensory_tools", "safe_space",
      "co_regulation", "emotion_coaching", "mindfulness", "physical_activity",
    ];
    const sessions = types.map(strategyType =>
      makeSession({ strategyType, outcomeLevel: "very_effective", childLed: true, staffCoRegulated: true, emotionIdentified: true, recordedInCasefile: true, therapeuticApproach: true, copingPlanUpdated: true }),
    );
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, policy, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("includes child profiles in the result", () => {
    const sessions = [
      makeSession({ childId: "child-alex", childName: "Alex" }),
      makeSession({ childId: "child-jordan", childName: "Jordan", strategyType: "sensory_tools" }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles).toHaveLength(2);
    expect(result.childProfiles.some(p => p.childId === "child-alex")).toBe(true);
    expect(result.childProfiles.some(p => p.childId === "child-jordan")).toBe(true);
  });

  it("generates area for improvement for therapeutic underuse", () => {
    const sessions = [
      makeSession({ therapeuticApproach: false }),
      makeSession({ therapeuticApproach: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Therapeutic approaches underused"))).toBe(true);
  });

  it("generates area for improvement for coping plans not updated", () => {
    const sessions = [
      makeSession({ copingPlanUpdated: false }),
      makeSession({ copingPlanUpdated: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Coping plans not regularly updated"))).toBe(true);
  });

  it("generates area for improvement for limited strategy variety", () => {
    const sessions = [
      makeSession({ strategyType: "breathing_exercises" }),
      makeSession({ strategyType: "breathing_exercises" }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Limited variety of regulation strategies"))).toBe(true);
  });

  it("generates action for coping plan reviews", () => {
    const sessions = [
      makeSession({ copingPlanUpdated: false }),
      makeSession({ copingPlanUpdated: false }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Schedule regular coping plan reviews"))).toBe(true);
  });

  it("generates action for expanding strategy range", () => {
    const sessions = [
      makeSession({ strategyType: "breathing_exercises" }),
      makeSession({ strategyType: "breathing_exercises" }),
    ];
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions, null, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Expand the range of regulation strategies"))).toBe(true);
  });
});
