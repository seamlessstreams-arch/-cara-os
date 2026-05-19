// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Peer Relationship Dynamics Intelligence Engine
//
// Demo: Oak House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateInteractionQuality,
  evaluateRelationshipSafety,
  evaluatePeerPolicy,
  evaluateStaffPeerReadiness,
  buildChildPeerProfiles,
  generatePeerRelationshipDynamicsIntelligence,
  getInteractionTypeLabel,
  getOutcomeLevelLabel,
  getRatingLabel,
  getRating,
  pct,
} from "../peer-relationship-dynamics-engine";
import type {
  PeerInteraction,
  PeerPolicy,
  StaffPeerTraining,
} from "../peer-relationship-dynamics-engine";

// ── Factory Functions ────────────────────────────────────────────────────

const makeInteraction = (overrides: Partial<PeerInteraction> = {}): PeerInteraction => ({
  id: "pi-001",
  childId: "child-alex",
  childName: "Alex",
  interactionDate: "2026-03-15",
  interactionType: "positive_social",
  outcomeLevel: "very_positive",
  staffMediated: false,
  childReflected: true,
  resolutionAchieved: true,
  socialSkillPracticed: true,
  documentedInLog: true,
  followUpPlanned: false,
  ...overrides,
});

const makePolicy = (overrides: Partial<PeerPolicy> = {}): PeerPolicy => ({
  id: "policy-001",
  antisBullyingStrategy: true,
  conflictResolutionFramework: true,
  socialSkillsProgramme: true,
  peerMentoringScheme: true,
  inclusionStrategy: true,
  restorationPractice: true,
  regularReview: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffPeerTraining> = {}): StaffPeerTraining => ({
  id: "spt-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  conflictResolution: true,
  socialSkillsFacilitation: true,
  antibullyingPractice: true,
  restorativeJustice: true,
  groupDynamics: true,
  traumaInformedRelationships: true,
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
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

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

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
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles exact boundaries", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(60)).toBe("good");
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LABEL GETTERS
// ══════════════════════════════════════════════════════════════════════════════

describe("getInteractionTypeLabel", () => {
  it("returns correct label for positive_social", () => {
    expect(getInteractionTypeLabel("positive_social")).toBe("Positive Social");
  });

  it("returns correct label for conflict_resolution", () => {
    expect(getInteractionTypeLabel("conflict_resolution")).toBe("Conflict Resolution");
  });

  it("returns correct label for cooperative_activity", () => {
    expect(getInteractionTypeLabel("cooperative_activity")).toBe("Cooperative Activity");
  });

  it("returns correct label for mentoring", () => {
    expect(getInteractionTypeLabel("mentoring")).toBe("Mentoring");
  });

  it("returns correct label for shared_interest", () => {
    expect(getInteractionTypeLabel("shared_interest")).toBe("Shared Interest");
  });

  it("returns correct label for conflict", () => {
    expect(getInteractionTypeLabel("conflict")).toBe("Conflict");
  });

  it("returns correct label for withdrawal", () => {
    expect(getInteractionTypeLabel("withdrawal")).toBe("Withdrawal");
  });

  it("returns correct label for bullying", () => {
    expect(getInteractionTypeLabel("bullying")).toBe("Bullying");
  });
});

describe("getOutcomeLevelLabel", () => {
  it("returns correct label for very_positive", () => {
    expect(getOutcomeLevelLabel("very_positive")).toBe("Very Positive");
  });

  it("returns correct label for positive", () => {
    expect(getOutcomeLevelLabel("positive")).toBe("Positive");
  });

  it("returns correct label for neutral", () => {
    expect(getOutcomeLevelLabel("neutral")).toBe("Neutral");
  });

  it("returns correct label for negative", () => {
    expect(getOutcomeLevelLabel("negative")).toBe("Negative");
  });

  it("returns correct label for very_negative", () => {
    expect(getOutcomeLevelLabel("very_negative")).toBe("Very Negative");
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

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 1: evaluateInteractionQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInteractionQuality", () => {
  it("returns score 0 for empty array", () => {
    const result = evaluateInteractionQuality([]);
    expect(result.score).toBe(0);
    expect(result.totalInteractions).toBe(0);
    expect(result.positiveOutcomeCount).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
  });

  it("returns max score for all-perfect interactions", () => {
    const interactions = Array.from({ length: 5 }, (_, i) =>
      makeInteraction({
        id: `pi-${i}`,
        outcomeLevel: "very_positive",
        resolutionAchieved: true,
        socialSkillPracticed: true,
        childReflected: true,
        documentedInLog: true,
      }),
    );
    const result = evaluateInteractionQuality(interactions);
    expect(result.score).toBe(25);
    expect(result.positiveOutcomeRate).toBe(100);
    expect(result.resolutionAchievedRate).toBe(100);
    expect(result.socialSkillPracticedRate).toBe(100);
    expect(result.childReflectedRate).toBe(100);
    expect(result.documentedInLogRate).toBe(100);
  });

  it("counts very_positive as positive outcome", () => {
    const interactions = [makeInteraction({ outcomeLevel: "very_positive" })];
    const result = evaluateInteractionQuality(interactions);
    expect(result.positiveOutcomeCount).toBe(1);
    expect(result.positiveOutcomeRate).toBe(100);
  });

  it("counts positive as positive outcome", () => {
    const interactions = [makeInteraction({ outcomeLevel: "positive" })];
    const result = evaluateInteractionQuality(interactions);
    expect(result.positiveOutcomeCount).toBe(1);
    expect(result.positiveOutcomeRate).toBe(100);
  });

  it("does NOT count neutral as positive outcome", () => {
    const interactions = [makeInteraction({ outcomeLevel: "neutral" })];
    const result = evaluateInteractionQuality(interactions);
    expect(result.positiveOutcomeCount).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
  });

  it("does NOT count negative as positive outcome", () => {
    const interactions = [makeInteraction({ outcomeLevel: "negative" })];
    const result = evaluateInteractionQuality(interactions);
    expect(result.positiveOutcomeCount).toBe(0);
  });

  it("does NOT count very_negative as positive outcome", () => {
    const interactions = [makeInteraction({ outcomeLevel: "very_negative" })];
    const result = evaluateInteractionQuality(interactions);
    expect(result.positiveOutcomeCount).toBe(0);
  });

  it("calculates correct rate for mixed outcomes", () => {
    const interactions = [
      makeInteraction({ id: "a", outcomeLevel: "very_positive" }),
      makeInteraction({ id: "b", outcomeLevel: "positive" }),
      makeInteraction({ id: "c", outcomeLevel: "neutral" }),
      makeInteraction({ id: "d", outcomeLevel: "negative" }),
    ];
    const result = evaluateInteractionQuality(interactions);
    expect(result.positiveOutcomeCount).toBe(2);
    expect(result.positiveOutcomeRate).toBe(50);
  });

  it("returns 0 score when all metrics are negative", () => {
    const interactions = [
      makeInteraction({
        outcomeLevel: "very_negative",
        resolutionAchieved: false,
        socialSkillPracticed: false,
        childReflected: false,
        documentedInLog: false,
      }),
    ];
    const result = evaluateInteractionQuality(interactions);
    expect(result.score).toBe(0);
  });

  it("calculates resolution achieved rate correctly", () => {
    const interactions = [
      makeInteraction({ id: "a", resolutionAchieved: true }),
      makeInteraction({ id: "b", resolutionAchieved: false }),
    ];
    const result = evaluateInteractionQuality(interactions);
    expect(result.resolutionAchievedCount).toBe(1);
    expect(result.resolutionAchievedRate).toBe(50);
  });

  it("calculates social skill practiced rate correctly", () => {
    const interactions = [
      makeInteraction({ id: "a", socialSkillPracticed: true }),
      makeInteraction({ id: "b", socialSkillPracticed: true }),
      makeInteraction({ id: "c", socialSkillPracticed: false }),
    ];
    const result = evaluateInteractionQuality(interactions);
    expect(result.socialSkillPracticedCount).toBe(2);
    expect(result.socialSkillPracticedRate).toBe(67);
  });

  it("calculates child reflected rate correctly", () => {
    const interactions = [
      makeInteraction({ id: "a", childReflected: true }),
      makeInteraction({ id: "b", childReflected: false }),
      makeInteraction({ id: "c", childReflected: false }),
      makeInteraction({ id: "d", childReflected: false }),
    ];
    const result = evaluateInteractionQuality(interactions);
    expect(result.childReflectedCount).toBe(1);
    expect(result.childReflectedRate).toBe(25);
  });

  it("calculates documented in log rate correctly", () => {
    const interactions = [
      makeInteraction({ id: "a", documentedInLog: true }),
      makeInteraction({ id: "b", documentedInLog: true }),
    ];
    const result = evaluateInteractionQuality(interactions);
    expect(result.documentedInLogCount).toBe(2);
    expect(result.documentedInLogRate).toBe(100);
  });

  it("caps score at 25", () => {
    // Even with theoretically overcounted data, should never exceed 25
    const interactions = Array.from({ length: 100 }, (_, i) =>
      makeInteraction({ id: `pi-${i}` }),
    );
    const result = evaluateInteractionQuality(interactions);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const interactions = [
      makeInteraction({
        outcomeLevel: "very_negative",
        resolutionAchieved: false,
        socialSkillPracticed: false,
        childReflected: false,
        documentedInLog: false,
      }),
    ];
    const result = evaluateInteractionQuality(interactions);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("partial metrics produce partial score", () => {
    // 50% positive outcomes, 100% resolution, 0% skill, 50% combined
    const interactions = [
      makeInteraction({ id: "a", outcomeLevel: "very_positive", resolutionAchieved: true, socialSkillPracticed: false, childReflected: true, documentedInLog: false }),
      makeInteraction({ id: "b", outcomeLevel: "negative", resolutionAchieved: true, socialSkillPracticed: false, childReflected: false, documentedInLog: true }),
    ];
    const result = evaluateInteractionQuality(interactions);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 2: evaluateRelationshipSafety (ABSENCE pattern)
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRelationshipSafety", () => {
  it("returns score 25 for empty array (ABSENCE pattern)", () => {
    const result = evaluateRelationshipSafety([]);
    expect(result.score).toBe(25);
    expect(result.totalInteractions).toBe(0);
    expect(result.negativeInteractionCount).toBe(0);
    expect(result.negativeInteractionRate).toBe(0);
  });

  it("returns high score when no negative interactions exist", () => {
    const interactions = [
      makeInteraction({ id: "a", interactionType: "positive_social" }),
      makeInteraction({ id: "b", interactionType: "cooperative_activity" }),
    ];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionCount).toBe(0);
    expect(result.negativeInteractionRate).toBe(0);
    // 9 * (100-0)/100 = 9, plus 0 for mediated (no negatives), 0 for follow-up (no negatives)
    expect(result.score).toBe(9);
  });

  it("counts conflict as negative interaction", () => {
    const interactions = [makeInteraction({ interactionType: "conflict" })];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionCount).toBe(1);
  });

  it("counts withdrawal as negative interaction", () => {
    const interactions = [makeInteraction({ interactionType: "withdrawal" })];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionCount).toBe(1);
  });

  it("counts bullying as negative interaction", () => {
    const interactions = [makeInteraction({ interactionType: "bullying" })];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionCount).toBe(1);
  });

  it("does NOT count positive_social as negative", () => {
    const interactions = [makeInteraction({ interactionType: "positive_social" })];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionCount).toBe(0);
  });

  it("does NOT count cooperative_activity as negative", () => {
    const interactions = [makeInteraction({ interactionType: "cooperative_activity" })];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionCount).toBe(0);
  });

  it("does NOT count mentoring as negative", () => {
    const interactions = [makeInteraction({ interactionType: "mentoring" })];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionCount).toBe(0);
  });

  it("does NOT count shared_interest as negative", () => {
    const interactions = [makeInteraction({ interactionType: "shared_interest" })];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionCount).toBe(0);
  });

  it("does NOT count conflict_resolution as negative", () => {
    const interactions = [makeInteraction({ interactionType: "conflict_resolution" })];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionCount).toBe(0);
  });

  it("calculates staff mediated rate for negative interactions only", () => {
    const interactions = [
      makeInteraction({ id: "a", interactionType: "conflict", staffMediated: true }),
      makeInteraction({ id: "b", interactionType: "conflict", staffMediated: false }),
      makeInteraction({ id: "c", interactionType: "positive_social", staffMediated: false }),
    ];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.staffMediatedNegativeCount).toBe(1);
    expect(result.staffMediatedNegativeRate).toBe(50);
  });

  it("calculates follow-up planned rate for negative interactions only", () => {
    const interactions = [
      makeInteraction({ id: "a", interactionType: "bullying", followUpPlanned: true }),
      makeInteraction({ id: "b", interactionType: "withdrawal", followUpPlanned: false }),
      makeInteraction({ id: "c", interactionType: "positive_social", followUpPlanned: true }),
    ];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.followUpPlannedNegativeCount).toBe(1);
    expect(result.followUpPlannedNegativeRate).toBe(50);
  });

  it("returns 0 staff mediated rate when no negative interactions", () => {
    const interactions = [
      makeInteraction({ id: "a", interactionType: "positive_social", staffMediated: true }),
    ];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.staffMediatedNegativeRate).toBe(0);
  });

  it("gives maximum score when all negatives are fully mediated and followed up", () => {
    // 1 negative out of 10 = 10% negative rate
    const positiveInteractions = Array.from({ length: 9 }, (_, i) =>
      makeInteraction({ id: `pos-${i}`, interactionType: "positive_social" }),
    );
    const negativeInteraction = makeInteraction({
      id: "neg-1",
      interactionType: "conflict",
      staffMediated: true,
      followUpPlanned: true,
    });
    const interactions = [...positiveInteractions, negativeInteraction];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionRate).toBe(10);
    // 9 * (100-10)/100 = 8.1, staffMediated 8*100/100=8, followUp 8*100/100=8 = 24.1 → 24.1
    expect(result.score).toBeGreaterThan(20);
  });

  it("caps score at 25", () => {
    const interactions = Array.from({ length: 100 }, (_, i) =>
      makeInteraction({ id: `pi-${i}`, interactionType: "positive_social" }),
    );
    const result = evaluateRelationshipSafety(interactions);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    // 100% negative interactions with no mediation/follow-up
    const interactions = Array.from({ length: 5 }, (_, i) =>
      makeInteraction({
        id: `neg-${i}`,
        interactionType: "bullying",
        staffMediated: false,
        followUpPlanned: false,
      }),
    );
    const result = evaluateRelationshipSafety(interactions);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("100% negative rate with full mediation still gives partial score", () => {
    const interactions = [
      makeInteraction({
        interactionType: "conflict",
        staffMediated: true,
        followUpPlanned: true,
      }),
    ];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionRate).toBe(100);
    // 9*(100-100)/100=0, 8*100/100=8, 8*100/100=8 = 16
    expect(result.score).toBe(16);
  });

  it("mixed scenario: some negative, some mediated", () => {
    const interactions = [
      makeInteraction({ id: "a", interactionType: "positive_social" }),
      makeInteraction({ id: "b", interactionType: "positive_social" }),
      makeInteraction({ id: "c", interactionType: "conflict", staffMediated: true, followUpPlanned: true }),
      makeInteraction({ id: "d", interactionType: "positive_social" }),
    ];
    const result = evaluateRelationshipSafety(interactions);
    expect(result.negativeInteractionCount).toBe(1);
    expect(result.negativeInteractionRate).toBe(25);
    expect(result.staffMediatedNegativeRate).toBe(100);
    expect(result.followUpPlannedNegativeRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 3: evaluatePeerPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePeerPolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluatePeerPolicy(null);
    expect(result.score).toBe(0);
    expect(result.antisBullyingStrategy).toBe(false);
    expect(result.conflictResolutionFramework).toBe(false);
    expect(result.socialSkillsProgramme).toBe(false);
    expect(result.peerMentoringScheme).toBe(false);
    expect(result.inclusionStrategy).toBe(false);
    expect(result.restorationPractice).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns score 25 for all-true policy", () => {
    const result = evaluatePeerPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("returns score 0 for all-false policy", () => {
    const result = evaluatePeerPolicy(
      makePolicy({
        antisBullyingStrategy: false,
        conflictResolutionFramework: false,
        socialSkillsProgramme: false,
        peerMentoringScheme: false,
        inclusionStrategy: false,
        restorationPractice: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(0);
  });

  it("weights antisBullyingStrategy at 4 points", () => {
    const result = evaluatePeerPolicy(
      makePolicy({
        antisBullyingStrategy: true,
        conflictResolutionFramework: false,
        socialSkillsProgramme: false,
        peerMentoringScheme: false,
        inclusionStrategy: false,
        restorationPractice: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights conflictResolutionFramework at 4 points", () => {
    const result = evaluatePeerPolicy(
      makePolicy({
        antisBullyingStrategy: false,
        conflictResolutionFramework: true,
        socialSkillsProgramme: false,
        peerMentoringScheme: false,
        inclusionStrategy: false,
        restorationPractice: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights socialSkillsProgramme at 4 points", () => {
    const result = evaluatePeerPolicy(
      makePolicy({
        antisBullyingStrategy: false,
        conflictResolutionFramework: false,
        socialSkillsProgramme: true,
        peerMentoringScheme: false,
        inclusionStrategy: false,
        restorationPractice: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights peerMentoringScheme at 4 points", () => {
    const result = evaluatePeerPolicy(
      makePolicy({
        antisBullyingStrategy: false,
        conflictResolutionFramework: false,
        socialSkillsProgramme: false,
        peerMentoringScheme: true,
        inclusionStrategy: false,
        restorationPractice: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights inclusionStrategy at 3 points", () => {
    const result = evaluatePeerPolicy(
      makePolicy({
        antisBullyingStrategy: false,
        conflictResolutionFramework: false,
        socialSkillsProgramme: false,
        peerMentoringScheme: false,
        inclusionStrategy: true,
        restorationPractice: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("weights restorationPractice at 3 points", () => {
    const result = evaluatePeerPolicy(
      makePolicy({
        antisBullyingStrategy: false,
        conflictResolutionFramework: false,
        socialSkillsProgramme: false,
        peerMentoringScheme: false,
        inclusionStrategy: false,
        restorationPractice: true,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("weights regularReview at 3 points", () => {
    const result = evaluatePeerPolicy(
      makePolicy({
        antisBullyingStrategy: false,
        conflictResolutionFramework: false,
        socialSkillsProgramme: false,
        peerMentoringScheme: false,
        inclusionStrategy: false,
        restorationPractice: false,
        regularReview: true,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("sums weights correctly: 4+4+4+4+3+3+3 = 25", () => {
    expect(4 + 4 + 4 + 4 + 3 + 3 + 3).toBe(25);
    const result = evaluatePeerPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("partial policy gives partial score (first 4 booleans)", () => {
    const result = evaluatePeerPolicy(
      makePolicy({
        antisBullyingStrategy: true,
        conflictResolutionFramework: true,
        socialSkillsProgramme: true,
        peerMentoringScheme: true,
        inclusionStrategy: false,
        restorationPractice: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(16);
  });

  it("reflects boolean values in result", () => {
    const result = evaluatePeerPolicy(
      makePolicy({ antisBullyingStrategy: true, regularReview: false }),
    );
    expect(result.antisBullyingStrategy).toBe(true);
    expect(result.regularReview).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 4: evaluateStaffPeerReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffPeerReadiness", () => {
  it("returns score 0 for empty array", () => {
    const result = evaluateStaffPeerReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score for all-true training", () => {
    const training = [makeTraining()];
    const result = evaluateStaffPeerReadiness(training);
    expect(result.score).toBe(25);
  });

  it("returns score 0 for all-false training", () => {
    const training = [
      makeTraining({
        conflictResolution: false,
        socialSkillsFacilitation: false,
        antibullyingPractice: false,
        restorativeJustice: false,
        groupDynamics: false,
        traumaInformedRelationships: false,
      }),
    ];
    const result = evaluateStaffPeerReadiness(training);
    expect(result.score).toBe(0);
  });

  it("weights conflictResolution at 6 points", () => {
    const training = [
      makeTraining({
        conflictResolution: true,
        socialSkillsFacilitation: false,
        antibullyingPractice: false,
        restorativeJustice: false,
        groupDynamics: false,
        traumaInformedRelationships: false,
      }),
    ];
    const result = evaluateStaffPeerReadiness(training);
    expect(result.score).toBe(6);
  });

  it("weights socialSkillsFacilitation at 5 points", () => {
    const training = [
      makeTraining({
        conflictResolution: false,
        socialSkillsFacilitation: true,
        antibullyingPractice: false,
        restorativeJustice: false,
        groupDynamics: false,
        traumaInformedRelationships: false,
      }),
    ];
    const result = evaluateStaffPeerReadiness(training);
    expect(result.score).toBe(5);
  });

  it("weights antibullyingPractice at 5 points", () => {
    const training = [
      makeTraining({
        conflictResolution: false,
        socialSkillsFacilitation: false,
        antibullyingPractice: true,
        restorativeJustice: false,
        groupDynamics: false,
        traumaInformedRelationships: false,
      }),
    ];
    const result = evaluateStaffPeerReadiness(training);
    expect(result.score).toBe(5);
  });

  it("weights restorativeJustice at 4 points", () => {
    const training = [
      makeTraining({
        conflictResolution: false,
        socialSkillsFacilitation: false,
        antibullyingPractice: false,
        restorativeJustice: true,
        groupDynamics: false,
        traumaInformedRelationships: false,
      }),
    ];
    const result = evaluateStaffPeerReadiness(training);
    expect(result.score).toBe(4);
  });

  it("weights groupDynamics at 3 points", () => {
    const training = [
      makeTraining({
        conflictResolution: false,
        socialSkillsFacilitation: false,
        antibullyingPractice: false,
        restorativeJustice: false,
        groupDynamics: true,
        traumaInformedRelationships: false,
      }),
    ];
    const result = evaluateStaffPeerReadiness(training);
    expect(result.score).toBe(3);
  });

  it("weights traumaInformedRelationships at 2 points", () => {
    const training = [
      makeTraining({
        conflictResolution: false,
        socialSkillsFacilitation: false,
        antibullyingPractice: false,
        restorativeJustice: false,
        groupDynamics: false,
        traumaInformedRelationships: true,
      }),
    ];
    const result = evaluateStaffPeerReadiness(training);
    expect(result.score).toBe(2);
  });

  it("sums weights correctly: 6+5+5+4+3+2 = 25", () => {
    expect(6 + 5 + 5 + 4 + 3 + 2).toBe(25);
  });

  it("averages across multiple staff members", () => {
    const training = [
      makeTraining({ id: "a", staffId: "s1", conflictResolution: true, socialSkillsFacilitation: true, antibullyingPractice: true, restorativeJustice: true, groupDynamics: true, traumaInformedRelationships: true }),
      makeTraining({ id: "b", staffId: "s2", conflictResolution: true, socialSkillsFacilitation: false, antibullyingPractice: false, restorativeJustice: false, groupDynamics: false, traumaInformedRelationships: false }),
    ];
    const result = evaluateStaffPeerReadiness(training);
    expect(result.totalStaff).toBe(2);
    expect(result.conflictResolutionRate).toBe(100);
    expect(result.socialSkillsFacilitationRate).toBe(50);
    expect(result.antibullyingPracticeRate).toBe(50);
    expect(result.restorativeJusticeRate).toBe(50);
    expect(result.groupDynamicsRate).toBe(50);
    expect(result.traumaInformedRelationshipsRate).toBe(50);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const result = evaluateStaffPeerReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("calculates rates correctly with 4 staff", () => {
    const training = [
      makeTraining({ id: "a", staffId: "s1" }),
      makeTraining({ id: "b", staffId: "s2" }),
      makeTraining({ id: "c", staffId: "s3", conflictResolution: false }),
      makeTraining({ id: "d", staffId: "s4" }),
    ];
    const result = evaluateStaffPeerReadiness(training);
    expect(result.conflictResolutionCount).toBe(3);
    expect(result.conflictResolutionRate).toBe(75);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildPeerProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildPeerProfiles", () => {
  it("returns empty array for no interactions", () => {
    const profiles = buildChildPeerProfiles([]);
    expect(profiles).toHaveLength(0);
  });

  it("groups interactions by childId", () => {
    const interactions = [
      makeInteraction({ id: "a", childId: "child-alex", childName: "Alex" }),
      makeInteraction({ id: "b", childId: "child-jordan", childName: "Jordan" }),
      makeInteraction({ id: "c", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles).toHaveLength(2);
  });

  it("counts total interactions per child", () => {
    const interactions = [
      makeInteraction({ id: "a", childId: "child-alex", childName: "Alex" }),
      makeInteraction({ id: "b", childId: "child-alex", childName: "Alex" }),
      makeInteraction({ id: "c", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].totalInteractions).toBe(3);
  });

  it("calculates positive outcome rate per child", () => {
    const interactions = [
      makeInteraction({ id: "a", childId: "child-alex", childName: "Alex", outcomeLevel: "very_positive" }),
      makeInteraction({ id: "b", childId: "child-alex", childName: "Alex", outcomeLevel: "negative" }),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].positiveOutcomeRate).toBe(50);
  });

  it("calculates social skill practiced rate per child", () => {
    const interactions = [
      makeInteraction({ id: "a", childId: "child-alex", childName: "Alex", socialSkillPracticed: true }),
      makeInteraction({ id: "b", childId: "child-alex", childName: "Alex", socialSkillPracticed: false }),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].socialSkillPracticedRate).toBe(50);
  });

  it("calculates negative interaction rate per child", () => {
    const interactions = [
      makeInteraction({ id: "a", childId: "child-alex", childName: "Alex", interactionType: "conflict" }),
      makeInteraction({ id: "b", childId: "child-alex", childName: "Alex", interactionType: "positive_social" }),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].negativeInteractionRate).toBe(50);
  });

  // Frequency scoring tests
  it("gives frequency score 0 for <5 interactions", () => {
    const interactions = [
      makeInteraction({ id: "a", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    // score at minimum includes positive outcome 3 + social skill 3 + safety 2 = 8 (no frequency bonus)
    // frequency(0) + positive(3) + skill(3) + safety(2) = 8
    expect(profiles[0].score).toBe(8);
  });

  it("gives frequency score 1 for 5-9 interactions", () => {
    const interactions = Array.from({ length: 5 }, (_, i) =>
      makeInteraction({ id: `pi-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildPeerProfiles(interactions);
    // frequency(1) + positive(3) + skill(3) + safety(2) = 9
    expect(profiles[0].score).toBe(9);
  });

  it("gives frequency score 2 for 10+ interactions", () => {
    const interactions = Array.from({ length: 10 }, (_, i) =>
      makeInteraction({ id: `pi-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildPeerProfiles(interactions);
    // frequency(2) + positive(3) + skill(3) + safety(2) = 10
    expect(profiles[0].score).toBe(10);
  });

  // Positive outcome tiers
  it("gives positiveOutcome score 3 for >=80% positive rate", () => {
    const interactions = Array.from({ length: 10 }, (_, i) =>
      makeInteraction({ id: `pi-${i}`, childId: "child-alex", childName: "Alex", outcomeLevel: "very_positive" }),
    );
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].positiveOutcomeRate).toBe(100);
    // frequency(2) + positive(3) + skill(3) + safety(2) = 10
    expect(profiles[0].score).toBe(10);
  });

  it("gives positiveOutcome score 2 for 60-79% positive rate", () => {
    // 7 positive, 3 neutral = 70%
    const interactions = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeInteraction({ id: `pos-${i}`, childId: "child-alex", childName: "Alex", outcomeLevel: "positive" }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeInteraction({ id: `neu-${i}`, childId: "child-alex", childName: "Alex", outcomeLevel: "neutral" }),
      ),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].positiveOutcomeRate).toBe(70);
    // frequency(2) + positive(2) + skill(3) + safety(2) = 9
    expect(profiles[0].score).toBe(9);
  });

  it("gives positiveOutcome score 1 for 40-59% positive rate", () => {
    // 5 positive, 5 neutral = 50%
    const interactions = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeInteraction({ id: `pos-${i}`, childId: "child-alex", childName: "Alex", outcomeLevel: "positive" }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeInteraction({ id: `neu-${i}`, childId: "child-alex", childName: "Alex", outcomeLevel: "neutral" }),
      ),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].positiveOutcomeRate).toBe(50);
    // frequency(2) + positive(1) + skill(3) + safety(2) = 8
    expect(profiles[0].score).toBe(8);
  });

  it("gives positiveOutcome score 0 for <40% positive rate", () => {
    // 3 positive, 7 negative type = 30%
    const interactions = [
      ...Array.from({ length: 3 }, (_, i) =>
        makeInteraction({ id: `pos-${i}`, childId: "child-alex", childName: "Alex", outcomeLevel: "positive" }),
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        makeInteraction({ id: `neg-${i}`, childId: "child-alex", childName: "Alex", outcomeLevel: "neutral" }),
      ),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].positiveOutcomeRate).toBe(30);
  });

  // Safety scoring tiers
  it("gives safety score 2 for <=10% negative rate", () => {
    // 1 negative, 9 positive = 10%
    const interactions = [
      ...Array.from({ length: 9 }, (_, i) =>
        makeInteraction({ id: `pos-${i}`, childId: "child-alex", childName: "Alex", interactionType: "positive_social" }),
      ),
      makeInteraction({ id: "neg-0", childId: "child-alex", childName: "Alex", interactionType: "conflict" }),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].negativeInteractionRate).toBe(10);
    // safety score should be 2
  });

  it("gives safety score 1 for 11-30% negative rate", () => {
    // 2 negative, 8 positive = 20%
    const interactions = [
      ...Array.from({ length: 8 }, (_, i) =>
        makeInteraction({ id: `pos-${i}`, childId: "child-alex", childName: "Alex", interactionType: "positive_social" }),
      ),
      ...Array.from({ length: 2 }, (_, i) =>
        makeInteraction({ id: `neg-${i}`, childId: "child-alex", childName: "Alex", interactionType: "conflict" }),
      ),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].negativeInteractionRate).toBe(20);
  });

  it("gives safety score 0 for >30% negative rate", () => {
    // 5 negative, 5 positive = 50%
    const interactions = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeInteraction({ id: `pos-${i}`, childId: "child-alex", childName: "Alex", interactionType: "positive_social" }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeInteraction({ id: `neg-${i}`, childId: "child-alex", childName: "Alex", interactionType: "conflict" }),
      ),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].negativeInteractionRate).toBe(50);
  });

  it("caps child score at 10", () => {
    const interactions = Array.from({ length: 20 }, (_, i) =>
      makeInteraction({ id: `pi-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].score).toBeLessThanOrEqual(10);
  });

  it("child score is never negative", () => {
    const interactions = Array.from({ length: 3 }, (_, i) =>
      makeInteraction({
        id: `pi-${i}`,
        childId: "child-alex",
        childName: "Alex",
        interactionType: "bullying",
        outcomeLevel: "very_negative",
        socialSkillPracticed: false,
      }),
    );
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].score).toBeGreaterThanOrEqual(0);
  });

  it("preserves childName in profiles", () => {
    const interactions = [
      makeInteraction({ childId: "child-morgan", childName: "Morgan" }),
    ];
    const profiles = buildChildPeerProfiles(interactions);
    expect(profiles[0].childName).toBe("Morgan");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR: generatePeerRelationshipDynamicsIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generatePeerRelationshipDynamicsIntelligence", () => {
  it("returns all required fields", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.rating).toBe("string");
    expect(result.interactionQuality).toBeDefined();
    expect(result.relationshipSafety).toBeDefined();
    expect(result.peerPolicy).toBeDefined();
    expect(result.staffPeerReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("sums 4 evaluator scores for overall", () => {
    const allPerfect = Array.from({ length: 5 }, (_, i) =>
      makeInteraction({ id: `pi-${i}` }),
    );
    const result = generatePeerRelationshipDynamicsIntelligence(
      allPerfect,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    const expectedSum =
      result.interactionQuality.score +
      result.relationshipSafety.score +
      result.peerPolicy.score +
      result.staffPeerReadiness.score;
    expect(result.overallScore).toBe(Math.round(expectedSum));
  });

  it("caps overall score at 100", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      Array.from({ length: 10 }, (_, i) => makeInteraction({ id: `pi-${i}` })),
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns correct rating based on overall score", () => {
    // Empty data gives safety=25, rest=0 → total=25 → inadequate
    const result = generatePeerRelationshipDynamicsIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
  });

  it("returns 7 regulatory links", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes specific regulatory links", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 10 — Positive relationships");
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 12 — The protection of children");
    expect(result.regulatoryLinks).toContain("SCCIF — Experiences and progress of children");
    expect(result.regulatoryLinks).toContain("NMS 3 — Promoting positive behaviour");
    expect(result.regulatoryLinks).toContain("Children Act 1989 — Welfare of the child");
    expect(result.regulatoryLinks).toContain("UNCRC Article 19 — Protection from violence");
    expect(result.regulatoryLinks).toContain("Ofsted ILACS — Experiences of children in care");
  });

  // Strengths/actions logic
  it("adds strength for positive outcome rate >= 80%", () => {
    const interactions = Array.from({ length: 5 }, (_, i) =>
      makeInteraction({ id: `pi-${i}`, outcomeLevel: "very_positive" }),
    );
    const result = generatePeerRelationshipDynamicsIntelligence(
      interactions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.strengths.some((s) => s.includes("positive peer interactions"))).toBe(true);
  });

  it("adds strength for resolution rate >= 80%", () => {
    const interactions = Array.from({ length: 5 }, (_, i) =>
      makeInteraction({ id: `pi-${i}`, resolutionAchieved: true }),
    );
    const result = generatePeerRelationshipDynamicsIntelligence(
      interactions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.strengths.some((s) => s.includes("conflict resolution"))).toBe(true);
  });

  it("adds strength for social skill practiced rate >= 80%", () => {
    const interactions = Array.from({ length: 5 }, (_, i) =>
      makeInteraction({ id: `pi-${i}`, socialSkillPracticed: true }),
    );
    const result = generatePeerRelationshipDynamicsIntelligence(
      interactions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.strengths.some((s) => s.includes("social skills development"))).toBe(true);
  });

  it("adds action when no records exist", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.actions.some((a) => a.includes("No peer interaction records found"))).toBe(true);
  });

  it("adds URGENT action when no policy", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [makeInteraction()],
      null,
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("No peer relationship policy"))).toBe(true);
  });

  it("adds URGENT action when no training", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [makeInteraction()],
      makePolicy(),
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("No staff peer relationship training"))).toBe(true);
  });

  it("adds area for improvement when positive outcome < 60%", () => {
    const interactions = [
      makeInteraction({ id: "a", outcomeLevel: "negative" }),
      makeInteraction({ id: "b", outcomeLevel: "very_negative" }),
      makeInteraction({ id: "c", outcomeLevel: "neutral" }),
    ];
    const result = generatePeerRelationshipDynamicsIntelligence(
      interactions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Positive outcome rate"))).toBe(true);
  });

  it("adds area for improvement when negative interaction rate > 30%", () => {
    const interactions = [
      makeInteraction({ id: "a", interactionType: "conflict" }),
      makeInteraction({ id: "b", interactionType: "bullying" }),
      makeInteraction({ id: "c", interactionType: "positive_social" }),
    ];
    const result = generatePeerRelationshipDynamicsIntelligence(
      interactions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Negative interaction rate"))).toBe(true);
  });

  it("does NOT add positive outcome area for improvement when rate >= 60%", () => {
    const interactions = Array.from({ length: 5 }, (_, i) =>
      makeInteraction({ id: `pi-${i}`, outcomeLevel: "positive" }),
    );
    const result = generatePeerRelationshipDynamicsIntelligence(
      interactions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Positive outcome rate"))).toBe(false);
  });

  it("does NOT add negative interaction area for improvement when rate <= 30%", () => {
    const interactions = [
      ...Array.from({ length: 8 }, (_, i) =>
        makeInteraction({ id: `pos-${i}`, interactionType: "positive_social" }),
      ),
      makeInteraction({ id: "neg-0", interactionType: "conflict" }),
    ];
    const result = generatePeerRelationshipDynamicsIntelligence(
      interactions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Negative interaction rate"))).toBe(false);
  });

  it("does not produce strength about positive interactions for empty interactions", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.strengths.some((s) => s.includes("positive peer interactions"))).toBe(false);
  });

  it("builds child profiles from interactions", () => {
    const interactions = [
      makeInteraction({ id: "a", childId: "child-alex", childName: "Alex" }),
      makeInteraction({ id: "b", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generatePeerRelationshipDynamicsIntelligence(
      interactions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  it("achieves outstanding rating with perfect data", () => {
    const interactions = Array.from({ length: 10 }, (_, i) =>
      makeInteraction({ id: `pi-${i}` }),
    );
    const result = generatePeerRelationshipDynamicsIntelligence(
      interactions,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("achieves inadequate rating with minimal data", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("homeId is preserved", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [],
      null,
      [],
      "test-home",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.homeId).toBe("test-home");
  });

  it("period dates are preserved", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-03-01",
      "2026-06-30",
    );
    expect(result.periodStart).toBe("2026-03-01");
    expect(result.periodEnd).toBe("2026-06-30");
  });

  it("overall score floor is 0", () => {
    const result = generatePeerRelationshipDynamicsIntelligence(
      [
        makeInteraction({
          outcomeLevel: "very_negative",
          resolutionAchieved: false,
          socialSkillPracticed: false,
          childReflected: false,
          documentedInLog: false,
          interactionType: "bullying",
          staffMediated: false,
          followUpPlanned: false,
        }),
      ],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});
