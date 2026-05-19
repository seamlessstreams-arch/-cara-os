// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Bereavement, Loss & Support Intelligence — Engine Tests
//
// Covers all evaluators, helpers, label getters, child profiles, and the
// main orchestrator. 80+ tests covering empty, perfect, partial, and edge cases.
//
// Demo data: Oak House — Alex (14), Jordan (13), Morgan (15)
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getLossTypeLabel,
  getSupportTypeLabel,
  getGriefStageLabel,
  getSupportOutcomeLabel,
  getRatingLabel,
  getLossTypeLabels,
  getSupportTypeLabels,
  getGriefStageLabels,
  getSupportOutcomeLabels,
  getRatingLabels,
  evaluateLossResponse,
  evaluateSupportQuality,
  evaluateBereavementPolicy,
  evaluateStaffBereavementReadiness,
  buildChildGriefProfiles,
  generateBereavementLossSupportIntelligence,
} from "../bereavement-loss-support-engine";
import type {
  LossEvent,
  SupportIntervention,
  BereavementPolicy,
  StaffBereavementTraining,
} from "../bereavement-loss-support-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const HOME_ID = "oak-house";
const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-19";

// ── Factories ──────────────────────────────────────────────────────────────

let _id = 0;
function nextId(prefix = "rec"): string { return `${prefix}-${++_id}`; }

function makeLossEvent(overrides: Partial<LossEvent> = {}): LossEvent {
  return {
    id: nextId("le"),
    childId: "child-alex",
    childName: "Alex",
    eventDate: "2026-02-10",
    lossType: "bereavement",
    description: "Grandparent passed away",
    impactAssessed: true,
    supportPlanCreated: true,
    supportPlanReviewed: true,
    ...overrides,
  };
}

function makeIntervention(overrides: Partial<SupportIntervention> = {}): SupportIntervention {
  return {
    id: nextId("si"),
    childId: "child-alex",
    childName: "Alex",
    lossEventId: "le-01",
    interventionDate: "2026-02-12",
    supportType: "keyworker",
    deliveredBy: "Sarah Johnson",
    childEngaged: true,
    outcome: "positive",
    followUpScheduled: true,
    followUpCompleted: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<BereavementPolicy> = {}): BereavementPolicy {
  return {
    id: nextId("bp"),
    policyReviewDate: "2026-01-10",
    policyCurrent: true,
    griefAwarenessIncluded: true,
    memoryWorkGuidance: true,
    specialistReferralPathway: true,
    culturalConsiderations: true,
    peerSupportFramework: true,
    staffSupportIncluded: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffBereavementTraining> = {}): StaffBereavementTraining {
  return {
    id: nextId("bt"),
    staffId: "s-01",
    staffName: "Sarah Johnson",
    griefAwareness: true,
    therapeuticResponse: true,
    memoryWorkSkills: true,
    culturalSensitivity: true,
    childDevelopmentGrief: true,
    referralPathways: true,
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

describe("getLossTypeLabel", () => {
  it("returns correct label for bereavement", () => {
    expect(getLossTypeLabel("bereavement")).toBe("Bereavement");
  });
  it("returns correct label for family_separation", () => {
    expect(getLossTypeLabel("family_separation")).toBe("Family Separation");
  });
  it("returns correct label for placement_move", () => {
    expect(getLossTypeLabel("placement_move")).toBe("Placement Move");
  });
  it("returns correct label for friendship_loss", () => {
    expect(getLossTypeLabel("friendship_loss")).toBe("Friendship Loss");
  });
  it("returns correct label for pet_loss", () => {
    expect(getLossTypeLabel("pet_loss")).toBe("Pet Loss");
  });
  it("returns correct label for relationship_breakdown", () => {
    expect(getLossTypeLabel("relationship_breakdown")).toBe("Relationship Breakdown");
  });
  it("returns correct label for other", () => {
    expect(getLossTypeLabel("other")).toBe("Other");
  });
});

describe("getSupportTypeLabel", () => {
  it("returns correct label for therapeutic", () => {
    expect(getSupportTypeLabel("therapeutic")).toBe("Therapeutic");
  });
  it("returns correct label for keyworker", () => {
    expect(getSupportTypeLabel("keyworker")).toBe("Keyworker");
  });
  it("returns correct label for peer_support", () => {
    expect(getSupportTypeLabel("peer_support")).toBe("Peer Support");
  });
  it("returns correct label for specialist_referral", () => {
    expect(getSupportTypeLabel("specialist_referral")).toBe("Specialist Referral");
  });
  it("returns correct label for memory_work", () => {
    expect(getSupportTypeLabel("memory_work")).toBe("Memory Work");
  });
  it("returns correct label for group_work", () => {
    expect(getSupportTypeLabel("group_work")).toBe("Group Work");
  });
  it("returns correct label for external_counselling", () => {
    expect(getSupportTypeLabel("external_counselling")).toBe("External Counselling");
  });
});

describe("getGriefStageLabel", () => {
  it("returns correct label for acute", () => {
    expect(getGriefStageLabel("acute")).toBe("Acute");
  });
  it("returns correct label for ongoing", () => {
    expect(getGriefStageLabel("ongoing")).toBe("Ongoing");
  });
  it("returns correct label for resolved", () => {
    expect(getGriefStageLabel("resolved")).toBe("Resolved");
  });
  it("returns correct label for recurring", () => {
    expect(getGriefStageLabel("recurring")).toBe("Recurring");
  });
  it("returns correct label for not_assessed", () => {
    expect(getGriefStageLabel("not_assessed")).toBe("Not Assessed");
  });
});

describe("getSupportOutcomeLabel", () => {
  it("returns correct label for positive", () => {
    expect(getSupportOutcomeLabel("positive")).toBe("Positive");
  });
  it("returns correct label for partially_positive", () => {
    expect(getSupportOutcomeLabel("partially_positive")).toBe("Partially Positive");
  });
  it("returns correct label for neutral", () => {
    expect(getSupportOutcomeLabel("neutral")).toBe("Neutral");
  });
  it("returns correct label for negative", () => {
    expect(getSupportOutcomeLabel("negative")).toBe("Negative");
  });
  it("returns correct label for too_early", () => {
    expect(getSupportOutcomeLabel("too_early")).toBe("Too Early");
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
  it("getLossTypeLabels returns all 7 labels", () => {
    const labels = getLossTypeLabels();
    expect(Object.keys(labels)).toHaveLength(7);
    expect(labels.bereavement).toBe("Bereavement");
  });

  it("getSupportTypeLabels returns all 7 labels", () => {
    const labels = getSupportTypeLabels();
    expect(Object.keys(labels)).toHaveLength(7);
    expect(labels.therapeutic).toBe("Therapeutic");
  });

  it("getGriefStageLabels returns all 5 labels", () => {
    const labels = getGriefStageLabels();
    expect(Object.keys(labels)).toHaveLength(5);
    expect(labels.acute).toBe("Acute");
  });

  it("getSupportOutcomeLabels returns all 5 labels", () => {
    const labels = getSupportOutcomeLabels();
    expect(Object.keys(labels)).toHaveLength(5);
    expect(labels.positive).toBe("Positive");
  });

  it("getRatingLabels returns all 4 labels", () => {
    const labels = getRatingLabels();
    expect(Object.keys(labels)).toHaveLength(4);
    expect(labels.outstanding).toBe("Outstanding");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateLossResponse
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateLossResponse", () => {
  it("returns 25 for empty array (no loss events = positive)", () => {
    const result = evaluateLossResponse([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalEvents).toBe(0);
  });

  it("returns perfect score for all events fully handled", () => {
    const events = [
      makeLossEvent({ impactAssessed: true, supportPlanCreated: true, supportPlanReviewed: true }),
      makeLossEvent({ childId: "child-jordan", childName: "Jordan", impactAssessed: true, supportPlanCreated: true, supportPlanReviewed: true }),
    ];
    const result = evaluateLossResponse(events);
    expect(result.overallScore).toBe(25);
    expect(result.impactAssessedRate).toBe(100);
    expect(result.supportPlanCreatedRate).toBe(100);
    expect(result.supportPlanReviewedRate).toBe(100);
    expect(result.allEventsWithPlansRate).toBe(100);
  });

  it("returns 0 when no events are assessed or planned", () => {
    const events = [
      makeLossEvent({ impactAssessed: false, supportPlanCreated: false, supportPlanReviewed: false }),
    ];
    const result = evaluateLossResponse(events);
    expect(result.overallScore).toBe(0);
    expect(result.impactAssessedRate).toBe(0);
    expect(result.supportPlanCreatedRate).toBe(0);
  });

  it("calculates correct rates for partial completion", () => {
    const events = [
      makeLossEvent({ impactAssessed: true, supportPlanCreated: true, supportPlanReviewed: true }),
      makeLossEvent({ childId: "child-jordan", impactAssessed: true, supportPlanCreated: false, supportPlanReviewed: false }),
    ];
    const result = evaluateLossResponse(events);
    expect(result.impactAssessedRate).toBe(100);
    expect(result.supportPlanCreatedRate).toBe(50);
    expect(result.supportPlanReviewedRate).toBe(50);
    expect(result.allEventsWithPlansRate).toBe(50);
  });

  it("caps overall score at 25", () => {
    const events = [
      makeLossEvent({ impactAssessed: true, supportPlanCreated: true, supportPlanReviewed: true }),
    ];
    const result = evaluateLossResponse(events);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns totalEvents matching input length", () => {
    const events = [makeLossEvent(), makeLossEvent(), makeLossEvent()];
    const result = evaluateLossResponse(events);
    expect(result.totalEvents).toBe(3);
  });

  it("handles single event with only impact assessed", () => {
    const events = [
      makeLossEvent({ impactAssessed: true, supportPlanCreated: false, supportPlanReviewed: false }),
    ];
    const result = evaluateLossResponse(events);
    expect(result.impactAssessedRate).toBe(100);
    expect(result.supportPlanCreatedRate).toBe(0);
    expect(result.overallScore).toBe(7); // only impactScore component
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSupportQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSupportQuality", () => {
  it("returns 0 for empty array", () => {
    const result = evaluateSupportQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalInterventions).toBe(0);
    expect(result.childEngagedRate).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.followUpCompletedRate).toBe(0);
    expect(result.supportTypeVariety).toBe(0);
  });

  it("returns perfect score when all interventions are ideal across all 7 types", () => {
    const types: Array<SupportIntervention["supportType"]> = [
      "therapeutic", "keyworker", "peer_support", "specialist_referral",
      "memory_work", "group_work", "external_counselling",
    ];
    const interventions = types.map(supportType =>
      makeIntervention({ supportType, childEngaged: true, outcome: "positive", followUpScheduled: true, followUpCompleted: true }),
    );
    const result = evaluateSupportQuality(interventions);
    expect(result.overallScore).toBe(25);
    expect(result.childEngagedRate).toBe(100);
    expect(result.positiveOutcomeRate).toBe(100);
    expect(result.followUpCompletedRate).toBe(100);
    expect(result.supportTypeVariety).toBe(7);
  });

  it("returns 0 when all interventions have no engagement, negative outcomes, no follow-up", () => {
    const interventions = [
      makeIntervention({ childEngaged: false, outcome: "negative", followUpScheduled: false, followUpCompleted: false }),
    ];
    const result = evaluateSupportQuality(interventions);
    expect(result.childEngagedRate).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.supportTypeVariety).toBe(1);
    // followUpCompletedRate = pct(0, 0) = 0 since no follow-ups scheduled
    expect(result.followUpCompletedRate).toBe(0);
  });

  it("counts partially_positive as positive outcome", () => {
    const interventions = [
      makeIntervention({ outcome: "partially_positive" }),
    ];
    const result = evaluateSupportQuality(interventions);
    expect(result.positiveOutcomeRate).toBe(100);
  });

  it("calculates follow-up rate based on scheduled follow-ups only", () => {
    const interventions = [
      makeIntervention({ followUpScheduled: true, followUpCompleted: true }),
      makeIntervention({ followUpScheduled: true, followUpCompleted: false }),
      makeIntervention({ followUpScheduled: false, followUpCompleted: false }),
    ];
    const result = evaluateSupportQuality(interventions);
    expect(result.followUpCompletedRate).toBe(50);
  });

  it("caps overall score at 25", () => {
    const types: Array<SupportIntervention["supportType"]> = [
      "therapeutic", "keyworker", "peer_support", "specialist_referral",
      "memory_work", "group_work", "external_counselling",
    ];
    const interventions = types.map(supportType =>
      makeIntervention({ supportType, childEngaged: true, outcome: "positive", followUpScheduled: true, followUpCompleted: true }),
    );
    const result = evaluateSupportQuality(interventions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("scores variety correctly with 3 types", () => {
    const interventions = [
      makeIntervention({ supportType: "therapeutic" }),
      makeIntervention({ supportType: "keyworker" }),
      makeIntervention({ supportType: "memory_work" }),
    ];
    const result = evaluateSupportQuality(interventions);
    expect(result.supportTypeVariety).toBe(3);
  });

  it("handles mixed engagement outcomes", () => {
    const interventions = [
      makeIntervention({ childEngaged: true, outcome: "positive" }),
      makeIntervention({ childEngaged: false, outcome: "neutral" }),
      makeIntervention({ childEngaged: true, outcome: "negative" }),
    ];
    const result = evaluateSupportQuality(interventions);
    expect(result.childEngagedRate).toBe(67);
    expect(result.positiveOutcomeRate).toBe(33);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateBereavementPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateBereavementPolicy", () => {
  it("returns 0 for empty array", () => {
    const result = evaluateBereavementPolicy([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPolicies).toBe(0);
    expect(result.policyCurrent).toBe(false);
  });

  it("returns 25 for a fully complete policy", () => {
    const policies = [makePolicy()];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBe(25);
    expect(result.policyCurrent).toBe(true);
    expect(result.griefAwarenessIncluded).toBe(true);
    expect(result.memoryWorkGuidance).toBe(true);
    expect(result.specialistReferralPathway).toBe(true);
    expect(result.culturalConsiderations).toBe(true);
    expect(result.peerSupportFramework).toBe(true);
    expect(result.staffSupportIncluded).toBe(true);
  });

  it("returns 0 when all booleans are false", () => {
    const policies = [makePolicy({
      policyCurrent: false,
      griefAwarenessIncluded: false,
      memoryWorkGuidance: false,
      specialistReferralPathway: false,
      culturalConsiderations: false,
      peerSupportFramework: false,
      staffSupportIncluded: false,
    })];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBe(0);
  });

  it("scores policyCurrent as 5 points", () => {
    const policies = [makePolicy({
      policyCurrent: true,
      griefAwarenessIncluded: false,
      memoryWorkGuidance: false,
      specialistReferralPathway: false,
      culturalConsiderations: false,
      peerSupportFramework: false,
      staffSupportIncluded: false,
    })];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBe(5);
  });

  it("scores griefAwarenessIncluded as 4 points", () => {
    const policies = [makePolicy({
      policyCurrent: false,
      griefAwarenessIncluded: true,
      memoryWorkGuidance: false,
      specialistReferralPathway: false,
      culturalConsiderations: false,
      peerSupportFramework: false,
      staffSupportIncluded: false,
    })];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBe(4);
  });

  it("scores memoryWorkGuidance as 4 points", () => {
    const policies = [makePolicy({
      policyCurrent: false,
      griefAwarenessIncluded: false,
      memoryWorkGuidance: true,
      specialistReferralPathway: false,
      culturalConsiderations: false,
      peerSupportFramework: false,
      staffSupportIncluded: false,
    })];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBe(4);
  });

  it("scores specialistReferralPathway as 4 points", () => {
    const policies = [makePolicy({
      policyCurrent: false,
      griefAwarenessIncluded: false,
      memoryWorkGuidance: false,
      specialistReferralPathway: true,
      culturalConsiderations: false,
      peerSupportFramework: false,
      staffSupportIncluded: false,
    })];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBe(4);
  });

  it("scores culturalConsiderations as 3 points", () => {
    const policies = [makePolicy({
      policyCurrent: false,
      griefAwarenessIncluded: false,
      memoryWorkGuidance: false,
      specialistReferralPathway: false,
      culturalConsiderations: true,
      peerSupportFramework: false,
      staffSupportIncluded: false,
    })];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBe(3);
  });

  it("scores peerSupportFramework as 3 points", () => {
    const policies = [makePolicy({
      policyCurrent: false,
      griefAwarenessIncluded: false,
      memoryWorkGuidance: false,
      specialistReferralPathway: false,
      culturalConsiderations: false,
      peerSupportFramework: true,
      staffSupportIncluded: false,
    })];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBe(3);
  });

  it("scores staffSupportIncluded as 2 points", () => {
    const policies = [makePolicy({
      policyCurrent: false,
      griefAwarenessIncluded: false,
      memoryWorkGuidance: false,
      specialistReferralPathway: false,
      culturalConsiderations: false,
      peerSupportFramework: false,
      staffSupportIncluded: true,
    })];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBe(2);
  });

  it("uses the most recent policy when multiple exist", () => {
    const policies = [
      makePolicy({ policyReviewDate: "2025-01-01", policyCurrent: false, griefAwarenessIncluded: false, memoryWorkGuidance: false, specialistReferralPathway: false, culturalConsiderations: false, peerSupportFramework: false, staffSupportIncluded: false }),
      makePolicy({ policyReviewDate: "2026-06-01", policyCurrent: true, griefAwarenessIncluded: true, memoryWorkGuidance: true, specialistReferralPathway: true, culturalConsiderations: true, peerSupportFramework: true, staffSupportIncluded: true }),
    ];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBe(25);
    expect(result.totalPolicies).toBe(2);
    expect(result.policyCurrent).toBe(true);
  });

  it("caps score at 25", () => {
    const policies = [makePolicy()];
    const result = evaluateBereavementPolicy(policies);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffBereavementReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffBereavementReadiness", () => {
  it("returns 0 for empty array", () => {
    const result = evaluateStaffBereavementReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.griefAwarenessRate).toBe(0);
    expect(result.therapeuticResponseRate).toBe(0);
    expect(result.memoryWorkSkillsRate).toBe(0);
    expect(result.culturalSensitivityRate).toBe(0);
    expect(result.childDevelopmentGriefRate).toBe(0);
    expect(result.referralPathwaysRate).toBe(0);
  });

  it("returns 25 when all staff have all training", () => {
    const training = [
      makeTraining(),
      makeTraining({ staffId: "s-02", staffName: "Tom Richards" }),
    ];
    const result = evaluateStaffBereavementReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.griefAwarenessRate).toBe(100);
    expect(result.therapeuticResponseRate).toBe(100);
  });

  it("returns 0 when no staff have any training", () => {
    const training = [
      makeTraining({
        griefAwareness: false, therapeuticResponse: false,
        memoryWorkSkills: false, culturalSensitivity: false,
        childDevelopmentGrief: false, referralPathways: false,
      }),
    ];
    const result = evaluateStaffBereavementReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("scores griefAwareness as 6 points max", () => {
    const training = [
      makeTraining({
        griefAwareness: true, therapeuticResponse: false,
        memoryWorkSkills: false, culturalSensitivity: false,
        childDevelopmentGrief: false, referralPathways: false,
      }),
    ];
    const result = evaluateStaffBereavementReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("scores therapeuticResponse as 5 points max", () => {
    const training = [
      makeTraining({
        griefAwareness: false, therapeuticResponse: true,
        memoryWorkSkills: false, culturalSensitivity: false,
        childDevelopmentGrief: false, referralPathways: false,
      }),
    ];
    const result = evaluateStaffBereavementReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("scores memoryWorkSkills as 4 points max", () => {
    const training = [
      makeTraining({
        griefAwareness: false, therapeuticResponse: false,
        memoryWorkSkills: true, culturalSensitivity: false,
        childDevelopmentGrief: false, referralPathways: false,
      }),
    ];
    const result = evaluateStaffBereavementReadiness(training);
    expect(result.overallScore).toBe(4);
  });

  it("scores culturalSensitivity as 4 points max", () => {
    const training = [
      makeTraining({
        griefAwareness: false, therapeuticResponse: false,
        memoryWorkSkills: false, culturalSensitivity: true,
        childDevelopmentGrief: false, referralPathways: false,
      }),
    ];
    const result = evaluateStaffBereavementReadiness(training);
    expect(result.overallScore).toBe(4);
  });

  it("scores childDevelopmentGrief as 3 points max", () => {
    const training = [
      makeTraining({
        griefAwareness: false, therapeuticResponse: false,
        memoryWorkSkills: false, culturalSensitivity: false,
        childDevelopmentGrief: true, referralPathways: false,
      }),
    ];
    const result = evaluateStaffBereavementReadiness(training);
    expect(result.overallScore).toBe(3);
  });

  it("scores referralPathways as 3 points max", () => {
    const training = [
      makeTraining({
        griefAwareness: false, therapeuticResponse: false,
        memoryWorkSkills: false, culturalSensitivity: false,
        childDevelopmentGrief: false, referralPathways: true,
      }),
    ];
    const result = evaluateStaffBereavementReadiness(training);
    expect(result.overallScore).toBe(3);
  });

  it("calculates partial rates correctly with mixed training", () => {
    const training = [
      makeTraining({ griefAwareness: true, therapeuticResponse: true, memoryWorkSkills: true, culturalSensitivity: true, childDevelopmentGrief: true, referralPathways: true }),
      makeTraining({ staffId: "s-02", staffName: "Tom", griefAwareness: true, therapeuticResponse: false, memoryWorkSkills: false, culturalSensitivity: false, childDevelopmentGrief: false, referralPathways: false }),
    ];
    const result = evaluateStaffBereavementReadiness(training);
    expect(result.griefAwarenessRate).toBe(100);
    expect(result.therapeuticResponseRate).toBe(50);
    expect(result.memoryWorkSkillsRate).toBe(50);
    expect(result.totalStaff).toBe(2);
  });

  it("caps overall score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffBereavementReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildGriefProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildGriefProfiles", () => {
  it("returns empty array when no events or interventions", () => {
    const result = buildChildGriefProfiles([], []);
    expect(result).toHaveLength(0);
  });

  it("creates profile for child with loss events and interventions", () => {
    const events = [makeLossEvent({ childId: "child-alex", childName: "Alex" })];
    const interventions = [
      makeIntervention({ childId: "child-alex", childName: "Alex", childEngaged: true, outcome: "positive" }),
    ];
    const profiles = buildChildGriefProfiles(events, interventions);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalLossEvents).toBe(1);
    expect(profiles[0].totalInterventions).toBe(1);
    expect(profiles[0].impactAssessed).toBe(true);
    expect(profiles[0].supportPlanInPlace).toBe(true);
  });

  it("returns score of 10 for children with no loss events but with interventions", () => {
    const interventions = [
      makeIntervention({ childId: "child-new", childName: "New Child" }),
    ];
    const profiles = buildChildGriefProfiles([], interventions);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].totalLossEvents).toBe(0);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("creates separate profiles for multiple children", () => {
    const events = [
      makeLossEvent({ childId: "child-alex", childName: "Alex" }),
      makeLossEvent({ childId: "child-jordan", childName: "Jordan", lossType: "family_separation" }),
    ];
    const profiles = buildChildGriefProfiles(events, []);
    expect(profiles).toHaveLength(2);
    const alexProfile = profiles.find(p => p.childId === "child-alex");
    const jordanProfile = profiles.find(p => p.childId === "child-jordan");
    expect(alexProfile).toBeDefined();
    expect(jordanProfile).toBeDefined();
    expect(jordanProfile!.lossTypes).toContain("family_separation");
  });

  it("identifies risk factors for unassessed loss", () => {
    const events = [
      makeLossEvent({ impactAssessed: false, supportPlanCreated: false }),
    ];
    const profiles = buildChildGriefProfiles(events, []);
    expect(profiles[0].riskFactors).toContain("Impact of loss not fully assessed");
    expect(profiles[0].riskFactors).toContain("Support plan not in place for all loss events");
    expect(profiles[0].riskFactors).toContain("No support interventions recorded despite loss events");
  });

  it("identifies risk factor for bereavement", () => {
    const events = [makeLossEvent({ lossType: "bereavement" })];
    const profiles = buildChildGriefProfiles(events, []);
    expect(profiles[0].riskFactors).toContain("Bereavement experienced — ongoing monitoring needed");
  });

  it("identifies risk factor for multiple loss events", () => {
    const events = [
      makeLossEvent({ id: "e1" }),
      makeLossEvent({ id: "e2", lossType: "placement_move" }),
    ];
    const profiles = buildChildGriefProfiles(events, []);
    expect(profiles[0].riskFactors).toContain("Multiple loss events — cumulative grief risk");
  });

  it("identifies risk factor for low engagement", () => {
    const events = [makeLossEvent()];
    const interventions = [
      makeIntervention({ childEngaged: false, outcome: "neutral" }),
      makeIntervention({ childEngaged: false, outcome: "neutral" }),
    ];
    const profiles = buildChildGriefProfiles(events, interventions);
    expect(profiles[0].riskFactors).toContain("Low engagement with support interventions");
  });

  it("identifies protective factor for assessed impact", () => {
    const events = [makeLossEvent({ impactAssessed: true })];
    const profiles = buildChildGriefProfiles(events, []);
    expect(profiles[0].protectiveFactors).toContain("Impact of loss has been assessed");
  });

  it("identifies protective factor for support plan in place", () => {
    const events = [makeLossEvent({ supportPlanCreated: true })];
    const profiles = buildChildGriefProfiles(events, []);
    expect(profiles[0].protectiveFactors).toContain("Support plan in place for all loss events");
  });

  it("identifies protective factor for high engagement", () => {
    const events = [makeLossEvent()];
    const interventions = [
      makeIntervention({ childEngaged: true, outcome: "positive" }),
      makeIntervention({ childEngaged: true, outcome: "positive" }),
    ];
    const profiles = buildChildGriefProfiles(events, interventions);
    expect(profiles[0].protectiveFactors).toContain("High engagement with support interventions");
  });

  it("identifies protective factor for positive outcomes", () => {
    const events = [makeLossEvent()];
    const interventions = [
      makeIntervention({ childEngaged: true, outcome: "positive" }),
      makeIntervention({ childEngaged: true, outcome: "positive" }),
    ];
    const profiles = buildChildGriefProfiles(events, interventions);
    expect(profiles[0].protectiveFactors).toContain("Positive outcomes from support interventions");
  });

  it("identifies protective factor for multiple interventions", () => {
    const events = [makeLossEvent()];
    const interventions = [
      makeIntervention({ childEngaged: true }),
      makeIntervention({ childEngaged: true }),
      makeIntervention({ childEngaged: true }),
    ];
    const profiles = buildChildGriefProfiles(events, interventions);
    expect(profiles[0].protectiveFactors).toContain("Multiple support interventions delivered");
  });

  it("identifies protective factor for memory work", () => {
    const events = [makeLossEvent()];
    const interventions = [
      makeIntervention({ supportType: "memory_work" }),
    ];
    const profiles = buildChildGriefProfiles(events, interventions);
    expect(profiles[0].protectiveFactors).toContain("Memory work undertaken to process loss");
  });

  it("caps child profile score at 10", () => {
    const events = [makeLossEvent()];
    const interventions = [
      makeIntervention({ childEngaged: true, outcome: "positive" }),
    ];
    const profiles = buildChildGriefProfiles(events, interventions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("calculates correct score for perfect profile", () => {
    const events = [makeLossEvent({ impactAssessed: true, supportPlanCreated: true })];
    const interventions = [
      makeIntervention({ childEngaged: true, outcome: "positive" }),
      makeIntervention({ childEngaged: true, outcome: "positive" }),
    ];
    const profiles = buildChildGriefProfiles(events, interventions);
    // impactAssessed=2, supportPlan=2, engagement(100%)=3, positive(100%)=3 = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("calculates engagement rate correctly", () => {
    const events = [makeLossEvent()];
    const interventions = [
      makeIntervention({ childEngaged: true }),
      makeIntervention({ childEngaged: false }),
      makeIntervention({ childEngaged: true }),
    ];
    const profiles = buildChildGriefProfiles(events, interventions);
    expect(profiles[0].engagementRate).toBe(67);
  });

  it("collects unique loss types for a child", () => {
    const events = [
      makeLossEvent({ id: "e1", lossType: "bereavement" }),
      makeLossEvent({ id: "e2", lossType: "placement_move" }),
      makeLossEvent({ id: "e3", lossType: "bereavement" }),
    ];
    const profiles = buildChildGriefProfiles(events, []);
    expect(profiles[0].lossTypes).toHaveLength(2);
    expect(profiles[0].lossTypes).toContain("bereavement");
    expect(profiles[0].lossTypes).toContain("placement_move");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateBereavementLossSupportIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateBereavementLossSupportIntelligence", () => {
  it("produces complete intelligence with all sections", () => {
    const events = [makeLossEvent()];
    const interventions = [makeIntervention()];
    const policies = [makePolicy()];
    const training = [makeTraining()];
    const result = generateBereavementLossSupportIntelligence(
      events, interventions, policies, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.lossResponse).toBeDefined();
    expect(result.supportQuality).toBeDefined();
    expect(result.bereavementPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("returns outstanding rating for perfect data", () => {
    const events = [makeLossEvent()];
    const types: Array<SupportIntervention["supportType"]> = [
      "therapeutic", "keyworker", "peer_support", "specialist_referral",
      "memory_work", "group_work", "external_counselling",
    ];
    const interventions = types.map(supportType =>
      makeIntervention({ supportType, childEngaged: true, outcome: "positive", followUpScheduled: true, followUpCompleted: true }),
    );
    const policies = [makePolicy()];
    const training = [makeTraining(), makeTraining({ staffId: "s-02", staffName: "Tom" })];
    const result = generateBereavementLossSupportIntelligence(
      events, interventions, policies, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate rating for empty/poor data", () => {
    const result = generateBereavementLossSupportIntelligence(
      [makeLossEvent({ impactAssessed: false, supportPlanCreated: false, supportPlanReviewed: false })],
      [],
      [],
      [],
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("caps overall score at 100", () => {
    const events = [makeLossEvent()];
    const types: Array<SupportIntervention["supportType"]> = [
      "therapeutic", "keyworker", "peer_support", "specialist_referral",
      "memory_work", "group_work", "external_counselling",
    ];
    const interventions = types.map(supportType =>
      makeIntervention({ supportType, childEngaged: true, outcome: "positive", followUpScheduled: true, followUpCompleted: true }),
    );
    const policies = [makePolicy()];
    const training = [makeTraining()];
    const result = generateBereavementLossSupportIntelligence(
      events, interventions, policies, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("sums all 4 evaluator scores", () => {
    const events = [makeLossEvent()];
    const interventions = [makeIntervention()];
    const policies = [makePolicy()];
    const training = [makeTraining()];
    const result = generateBereavementLossSupportIntelligence(
      events, interventions, policies, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    const expectedSum = result.lossResponse.overallScore + result.supportQuality.overallScore +
      result.bereavementPolicy.overallScore + result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("includes regulatory links", () => {
    const result = generateBereavementLossSupportIntelligence([], [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 14"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("Working Together 2023"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("UNCRC Article 39"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("NICE CG16"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("Children Act 1989"))).toBe(true);
  });

  it("generates strengths for strong loss response", () => {
    const events = [makeLossEvent()];
    const result = generateBereavementLossSupportIntelligence(
      events, [], [makePolicy()], [makeTraining()], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Strong response to loss events"))).toBe(true);
  });

  it("generates strength for no loss events", () => {
    const result = generateBereavementLossSupportIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("No loss events recorded"))).toBe(true);
  });

  it("generates strength for high child engagement", () => {
    const events = [makeLossEvent()];
    const interventions = [
      makeIntervention({ childEngaged: true, outcome: "positive" }),
      makeIntervention({ childEngaged: true, outcome: "positive" }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      events, interventions, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("High child engagement"))).toBe(true);
  });

  it("generates strength for positive outcomes", () => {
    const interventions = [
      makeIntervention({ childEngaged: true, outcome: "positive" }),
      makeIntervention({ childEngaged: true, outcome: "positive" }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], interventions, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Consistently positive outcomes"))).toBe(true);
  });

  it("generates strength for diverse support types", () => {
    const types: Array<SupportIntervention["supportType"]> = ["therapeutic", "keyworker", "peer_support", "memory_work"];
    const interventions = types.map(supportType =>
      makeIntervention({ supportType, childEngaged: true, outcome: "positive" }),
    );
    const result = generateBereavementLossSupportIntelligence(
      [], interventions, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Diverse range of support types"))).toBe(true);
  });

  it("generates strength for comprehensive policy", () => {
    const policies = [makePolicy()];
    const result = generateBereavementLossSupportIntelligence(
      [], [], policies, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Comprehensive bereavement and loss policy"))).toBe(true);
  });

  it("generates strength for current policy", () => {
    const policies = [makePolicy()];
    const result = generateBereavementLossSupportIntelligence(
      [], [], policies, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("policy is current"))).toBe(true);
  });

  it("generates strength for grief awareness training", () => {
    const training = [makeTraining(), makeTraining({ staffId: "s-02" })];
    const result = generateBereavementLossSupportIntelligence(
      [], [], [], training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("grief awareness training"))).toBe(true);
  });

  it("generates strength for strong staff readiness", () => {
    const training = [makeTraining()];
    const result = generateBereavementLossSupportIntelligence(
      [], [], [], training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Strong staff readiness"))).toBe(true);
  });

  it("generates strength for follow-up completion", () => {
    const interventions = [
      makeIntervention({ followUpScheduled: true, followUpCompleted: true }),
      makeIntervention({ followUpScheduled: true, followUpCompleted: true }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], interventions, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some(s => s.includes("Follow-up support is consistently completed"))).toBe(true);
  });

  it("generates area for improvement for unassessed impact", () => {
    const events = [makeLossEvent({ impactAssessed: false })];
    const result = generateBereavementLossSupportIntelligence(
      events, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("impact-assessed"))).toBe(true);
  });

  it("generates area for improvement for missing support plans", () => {
    const events = [makeLossEvent({ supportPlanCreated: false })];
    const result = generateBereavementLossSupportIntelligence(
      events, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Support plans not created"))).toBe(true);
  });

  it("generates area for improvement for unreviewed support plans", () => {
    const events = [makeLossEvent({ supportPlanReviewed: false })];
    const result = generateBereavementLossSupportIntelligence(
      events, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Support plans not consistently reviewed"))).toBe(true);
  });

  it("generates area for improvement for low child engagement", () => {
    const interventions = [
      makeIntervention({ childEngaged: false, outcome: "neutral" }),
      makeIntervention({ childEngaged: false, outcome: "neutral" }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], interventions, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Child engagement with support interventions is low"))).toBe(true);
  });

  it("generates area for improvement for outdated policy", () => {
    const policies = [makePolicy({ policyCurrent: false })];
    const result = generateBereavementLossSupportIntelligence(
      [], [], policies, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("policy is not current"))).toBe(true);
  });

  it("generates area for improvement for missing memory work guidance", () => {
    const policies = [makePolicy({ memoryWorkGuidance: false })];
    const result = generateBereavementLossSupportIntelligence(
      [], [], policies, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("memory work guidance"))).toBe(true);
  });

  it("generates area for improvement for missing cultural considerations", () => {
    const policies = [makePolicy({ culturalConsiderations: false })];
    const result = generateBereavementLossSupportIntelligence(
      [], [], policies, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("cultural considerations"))).toBe(true);
  });

  it("generates area for improvement for low grief awareness", () => {
    const training = [
      makeTraining({ griefAwareness: false }),
      makeTraining({ staffId: "s-02", griefAwareness: false }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], [], [], training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Grief awareness training coverage"))).toBe(true);
  });

  it("generates area for improvement for low therapeutic response training", () => {
    const training = [
      makeTraining({ therapeuticResponse: false }),
      makeTraining({ staffId: "s-02", therapeuticResponse: false }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], [], [], training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Therapeutic response training is low"))).toBe(true);
  });

  it("generates area for improvement for low cultural sensitivity training", () => {
    const training = [
      makeTraining({ culturalSensitivity: false }),
      makeTraining({ staffId: "s-02", culturalSensitivity: false }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], [], [], training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Cultural sensitivity training for grief"))).toBe(true);
  });

  it("generates action for incomplete impact assessments", () => {
    const events = [makeLossEvent({ impactAssessed: false })];
    const result = generateBereavementLossSupportIntelligence(
      events, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Complete impact assessments"))).toBe(true);
  });

  it("generates action for missing support plans", () => {
    const events = [makeLossEvent({ supportPlanCreated: false })];
    const result = generateBereavementLossSupportIntelligence(
      events, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Create tailored support plans"))).toBe(true);
  });

  it("generates action for outdated policy", () => {
    const policies = [makePolicy({ policyCurrent: false })];
    const result = generateBereavementLossSupportIntelligence(
      [], [], policies, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Review and update the bereavement and loss policy"))).toBe(true);
  });

  it("generates action for missing specialist referral pathway", () => {
    const policies = [makePolicy({ specialistReferralPathway: false })];
    const result = generateBereavementLossSupportIntelligence(
      [], [], policies, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("specialist referral pathways"))).toBe(true);
  });

  it("generates action for missing memory work guidance", () => {
    const policies = [makePolicy({ memoryWorkGuidance: false })];
    const result = generateBereavementLossSupportIntelligence(
      [], [], policies, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("memory work guidance"))).toBe(true);
  });

  it("generates action for grief awareness training gaps", () => {
    const training = [
      makeTraining({ griefAwareness: false }),
      makeTraining({ staffId: "s-02", griefAwareness: true }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], [], [], training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Schedule grief awareness training"))).toBe(true);
  });

  it("generates action for therapeutic response training gaps", () => {
    const training = [
      makeTraining({ therapeuticResponse: false }),
      makeTraining({ staffId: "s-02", therapeuticResponse: false }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], [], [], training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("therapeutic response training"))).toBe(true);
  });

  it("generates action for cultural sensitivity training gaps", () => {
    const training = [
      makeTraining({ culturalSensitivity: false }),
      makeTraining({ staffId: "s-02", culturalSensitivity: false }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], [], [], training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("cultural sensitivity training"))).toBe(true);
  });

  it("handles all-empty arrays gracefully", () => {
    const result = generateBereavementLossSupportIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(25); // only lossResponse returns 25 for empty
    expect(result.rating).toBe("inadequate"); // 25 < 40
    expect(result.childProfiles).toHaveLength(0);
  });

  it("assigns rating thresholds correctly", () => {
    // We test that the orchestrator correctly uses getRating
    const events = [makeLossEvent()]; // 25 points from lossResponse
    const types: Array<SupportIntervention["supportType"]> = [
      "therapeutic", "keyworker", "peer_support", "specialist_referral",
      "memory_work", "group_work", "external_counselling",
    ];
    const interventions = types.map(supportType =>
      makeIntervention({ supportType, childEngaged: true, outcome: "positive", followUpScheduled: true, followUpCompleted: true }),
    );
    const policies = [makePolicy()];
    const training = [makeTraining()];
    const result = generateBereavementLossSupportIntelligence(
      events, interventions, policies, training, HOME_ID, PERIOD_START, PERIOD_END,
    );
    // All 4 evaluators return max: 25+25+25+25=100
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("generates area for improvement for limited support variety", () => {
    const interventions = [
      makeIntervention({ supportType: "keyworker", childEngaged: true }),
      makeIntervention({ supportType: "keyworker", childEngaged: true }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], interventions, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Limited variety in support types"))).toBe(true);
  });

  it("generates area for improvement for inconsistent follow-up", () => {
    const interventions = [
      makeIntervention({ followUpScheduled: true, followUpCompleted: false }),
      makeIntervention({ followUpScheduled: true, followUpCompleted: false }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], interventions, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some(a => a.includes("Follow-up after interventions is inconsistent"))).toBe(true);
  });

  it("generates action for low engagement", () => {
    const interventions = [
      makeIntervention({ childEngaged: false }),
      makeIntervention({ childEngaged: false }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], interventions, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("Review engagement approach"))).toBe(true);
  });

  it("generates action for follow-up tracking", () => {
    const interventions = [
      makeIntervention({ followUpScheduled: true, followUpCompleted: false }),
      makeIntervention({ followUpScheduled: true, followUpCompleted: false }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      [], interventions, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some(a => a.includes("follow-up tracking system"))).toBe(true);
  });

  it("includes child profiles in the result", () => {
    const events = [
      makeLossEvent({ childId: "child-alex", childName: "Alex" }),
      makeLossEvent({ childId: "child-jordan", childName: "Jordan", lossType: "family_separation" }),
    ];
    const interventions = [
      makeIntervention({ childId: "child-alex" }),
      makeIntervention({ childId: "child-jordan", lossEventId: "le-02" }),
    ];
    const result = generateBereavementLossSupportIntelligence(
      events, interventions, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles).toHaveLength(2);
    expect(result.childProfiles.some(p => p.childId === "child-alex")).toBe(true);
    expect(result.childProfiles.some(p => p.childId === "child-jordan")).toBe(true);
  });
});
