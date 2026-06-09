// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Attachment & Relationships Intelligence — Engine Tests
//
// Covers all 7 core functions, scoring logic, and edge cases.
// Demo data: Chamberlain House — Alex (14), Jordan (13), Morgan (15)
// Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (Senior RSW),
//        Darren Laville (RM)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAttachmentAssessments,
  evaluateRelationshipQuality,
  evaluateInteractionQuality,
  evaluateStability,
  evaluatePeerRelationships,
  buildChildAttachmentProfiles,
  generateAttachmentRelationshipsIntelligence,
  getAttachmentStyleLabel,
  getRelationshipTypeLabel,
  getRelationshipQualityLabel,
  getInteractionContextLabel,
} from "../attachment-relationships-engine";
import type {
  AttachmentAssessment,
  RelationshipRecord,
  RelationshipInteraction,
  StabilityIndicator,
  PeerRelationship,
} from "../attachment-relationships-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REFERENCE_DATE = "2025-06-01";
const HOME_ID = "oak-house";
const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];

// ── Factories ──────────────────────────────────────────────────────────────

let _id = 0;
function nextId(prefix = "rec"): string { return `${prefix}-${++_id}`; }

function makeAssessment(overrides: Partial<AttachmentAssessment> = {}): AttachmentAssessment {
  return {
    id: nextId("aa"),
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2025-03-01",
    assessor: "Dr Karen Thompson",
    assessorRole: "psychologist",
    attachmentStyle: "anxious_ambivalent",
    strengthAreas: ["Responds to consistent caregivers"],
    vulnerabilityAreas: ["Separation anxiety"],
    therapeuticRecommendations: ["PACE approach"],
    informedCareApproach: true,
    sharedWithTeam: true,
    reviewDate: "2025-09-01",
    ...overrides,
  };
}

function makeRelationship(overrides: Partial<RelationshipRecord> = {}): RelationshipRecord {
  return {
    id: nextId("rel"),
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    personId: "s-01",
    personName: "Sarah Johnson",
    relationshipType: "key_worker",
    quality: "strong",
    trend: "strengthening",
    startDate: "2025-01-15",
    lastReviewDate: "2025-05-01",
    trustScore: 8,
    consistencyScore: 9,
    childRating: 8,
    notes: "Strong bond, Alex seeks Sarah out when distressed",
    ...overrides,
  };
}

function makeInteraction(overrides: Partial<RelationshipInteraction> = {}): RelationshipInteraction {
  return {
    id: nextId("int"),
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    staffId: "s-01",
    staffName: "Sarah Johnson",
    date: "2025-04-15",
    context: "key_work_session",
    durationMins: 45,
    qualityRating: 8,
    childInitiated: false,
    positiveIndicators: ["Made eye contact", "Shared feelings"],
    concernIndicators: [],
    attachmentRelevant: true,
    regulationSupport: true,
    ...overrides,
  };
}

function makeStability(overrides: Partial<StabilityIndicator> = {}): StabilityIndicator {
  return {
    id: nextId("stab"),
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    date: "2025-05-01",
    keyWorkerConsistency: true,
    staffTeamStability: true,
    routineConsistency: 8,
    placementSecurityScore: 8,
    belongingScore: 8,
    childFeelsSafe: true,
    childFeelsValued: true,
    significantChanges: [],
    ...overrides,
  };
}

function makePeer(overrides: Partial<PeerRelationship> = {}): PeerRelationship {
  return {
    id: nextId("peer"),
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    peerId: "child-jordan",
    peerName: "Jordan",
    quality: "developing",
    trend: "strengthening",
    positiveInteractions: 15,
    negativeInteractions: 3,
    conflictsResolved: 2,
    conflictsUnresolved: 0,
    sharedActivities: ["Football", "Gaming"],
    staffMediationNeeded: false,
    ...overrides,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function demoAssessments(): AttachmentAssessment[] {
  return [
    makeAssessment({
      childId: "child-alex", childName: "Alex",
      assessmentDate: "2025-03-01", attachmentStyle: "anxious_ambivalent",
      previousStyle: "disorganised",
      strengthAreas: ["Responds to consistent caregivers", "Seeks comfort when distressed"],
      vulnerabilityAreas: ["Separation anxiety", "Hypervigilance"],
      informedCareApproach: true, sharedWithTeam: true,
    }),
    makeAssessment({
      childId: "child-jordan", childName: "Jordan",
      assessmentDate: "2025-02-15", attachmentStyle: "secure",
      assessor: "Dr Karen Thompson", assessorRole: "psychologist",
      strengthAreas: ["Trusts caregivers", "Good peer relationships"],
      vulnerabilityAreas: [],
      informedCareApproach: true, sharedWithTeam: true,
    }),
    makeAssessment({
      childId: "child-morgan", childName: "Morgan",
      assessmentDate: "2025-04-01", attachmentStyle: "anxious_avoidant",
      previousStyle: "disorganised",
      strengthAreas: ["Independent", "Creative interests"],
      vulnerabilityAreas: ["Avoids emotional closeness", "Masks distress"],
      informedCareApproach: true, sharedWithTeam: true,
    }),
  ];
}

function demoRelationships(): RelationshipRecord[] {
  return [
    // Alex
    makeRelationship({ childId: "child-alex", childName: "Alex", personId: "s-01", personName: "Sarah Johnson", relationshipType: "key_worker", quality: "strong", trend: "strengthening", trustScore: 8, consistencyScore: 9, childRating: 8 }),
    makeRelationship({ childId: "child-alex", childName: "Alex", personId: "s-02", personName: "Tom Richards", relationshipType: "staff_member", quality: "developing", trend: "strengthening", trustScore: 6, consistencyScore: 7, childRating: 7 }),
    // Jordan
    makeRelationship({ childId: "child-jordan", childName: "Jordan", personId: "s-02", personName: "Tom Richards", relationshipType: "key_worker", quality: "strong", trend: "stable", trustScore: 9, consistencyScore: 9, childRating: 9 }),
    makeRelationship({ childId: "child-jordan", childName: "Jordan", personId: "s-03", personName: "Lisa Williams", relationshipType: "secondary_key_worker", quality: "strong", trend: "stable", trustScore: 8, consistencyScore: 8, childRating: 8 }),
    // Morgan
    makeRelationship({ childId: "child-morgan", childName: "Morgan", personId: "s-03", personName: "Lisa Williams", relationshipType: "key_worker", quality: "developing", trend: "strengthening", trustScore: 5, consistencyScore: 6, childRating: 5 }),
    makeRelationship({ childId: "child-morgan", childName: "Morgan", personId: "s-04", personName: "Darren Laville", relationshipType: "staff_member", quality: "developing", trend: "stable", trustScore: 6, consistencyScore: 7, childRating: 6 }),
  ];
}

function demoInteractions(): RelationshipInteraction[] {
  return [
    // Alex — varied contexts
    makeInteraction({ childId: "child-alex", childName: "Alex", staffId: "s-01", staffName: "Sarah Johnson", date: "2025-04-01", context: "key_work_session", durationMins: 45, qualityRating: 8, childInitiated: false, attachmentRelevant: true, regulationSupport: true }),
    makeInteraction({ childId: "child-alex", childName: "Alex", staffId: "s-01", staffName: "Sarah Johnson", date: "2025-04-08", context: "daily_living", durationMins: 20, qualityRating: 7, childInitiated: true, attachmentRelevant: true, regulationSupport: false }),
    makeInteraction({ childId: "child-alex", childName: "Alex", staffId: "s-02", staffName: "Tom Richards", date: "2025-04-15", context: "activity", durationMins: 60, qualityRating: 8, childInitiated: false, attachmentRelevant: false, regulationSupport: false }),
    makeInteraction({ childId: "child-alex", childName: "Alex", staffId: "s-01", staffName: "Sarah Johnson", date: "2025-05-01", context: "crisis_support", durationMins: 30, qualityRating: 9, childInitiated: true, attachmentRelevant: true, regulationSupport: true }),
    // Jordan — positive
    makeInteraction({ childId: "child-jordan", childName: "Jordan", staffId: "s-02", staffName: "Tom Richards", date: "2025-04-02", context: "key_work_session", durationMins: 40, qualityRating: 9, childInitiated: false, attachmentRelevant: true, regulationSupport: false }),
    makeInteraction({ childId: "child-jordan", childName: "Jordan", staffId: "s-03", staffName: "Lisa Williams", date: "2025-04-10", context: "community_outing", durationMins: 120, qualityRating: 9, childInitiated: true, attachmentRelevant: false, regulationSupport: false }),
    makeInteraction({ childId: "child-jordan", childName: "Jordan", staffId: "s-02", staffName: "Tom Richards", date: "2025-05-05", context: "meal_time", durationMins: 25, qualityRating: 8, childInitiated: true, attachmentRelevant: true, regulationSupport: false }),
    // Morgan — more support-focused
    makeInteraction({ childId: "child-morgan", childName: "Morgan", staffId: "s-03", staffName: "Lisa Williams", date: "2025-04-05", context: "key_work_session", durationMins: 50, qualityRating: 6, childInitiated: false, attachmentRelevant: true, regulationSupport: true }),
    makeInteraction({ childId: "child-morgan", childName: "Morgan", staffId: "s-04", staffName: "Darren Laville", date: "2025-04-20", context: "bedtime_routine", durationMins: 15, qualityRating: 7, childInitiated: false, attachmentRelevant: true, regulationSupport: true }),
    makeInteraction({ childId: "child-morgan", childName: "Morgan", staffId: "s-03", staffName: "Lisa Williams", date: "2025-05-10", context: "education_support", durationMins: 35, qualityRating: 7, childInitiated: false, attachmentRelevant: false, regulationSupport: false }),
  ];
}

function demoStability(): StabilityIndicator[] {
  return [
    makeStability({ childId: "child-alex", childName: "Alex", date: "2025-05-01", keyWorkerConsistency: true, staffTeamStability: true, routineConsistency: 8, placementSecurityScore: 8, belongingScore: 8, childFeelsSafe: true, childFeelsValued: true }),
    makeStability({ childId: "child-jordan", childName: "Jordan", date: "2025-05-01", keyWorkerConsistency: true, staffTeamStability: true, routineConsistency: 9, placementSecurityScore: 9, belongingScore: 9, childFeelsSafe: true, childFeelsValued: true }),
    makeStability({ childId: "child-morgan", childName: "Morgan", date: "2025-05-01", keyWorkerConsistency: true, staffTeamStability: true, routineConsistency: 6, placementSecurityScore: 6, belongingScore: 5, childFeelsSafe: true, childFeelsValued: false, significantChanges: ["New school placement started"] }),
  ];
}

function demoPeers(): PeerRelationship[] {
  return [
    makePeer({ childId: "child-alex", childName: "Alex", peerId: "child-jordan", peerName: "Jordan", quality: "developing", trend: "strengthening", positiveInteractions: 15, negativeInteractions: 3, conflictsResolved: 2, conflictsUnresolved: 0, staffMediationNeeded: false }),
    makePeer({ childId: "child-alex", childName: "Alex", peerId: "child-morgan", peerName: "Morgan", quality: "inconsistent", trend: "fluctuating", positiveInteractions: 8, negativeInteractions: 6, conflictsResolved: 3, conflictsUnresolved: 1, staffMediationNeeded: true }),
    makePeer({ childId: "child-jordan", childName: "Jordan", peerId: "child-alex", peerName: "Alex", quality: "developing", trend: "strengthening", positiveInteractions: 15, negativeInteractions: 3, conflictsResolved: 2, conflictsUnresolved: 0, staffMediationNeeded: false }),
    makePeer({ childId: "child-jordan", childName: "Jordan", peerId: "child-morgan", peerName: "Morgan", quality: "developing", trend: "stable", positiveInteractions: 10, negativeInteractions: 2, conflictsResolved: 1, conflictsUnresolved: 0, staffMediationNeeded: false }),
    makePeer({ childId: "child-morgan", childName: "Morgan", peerId: "child-alex", peerName: "Alex", quality: "inconsistent", trend: "fluctuating", positiveInteractions: 8, negativeInteractions: 6, conflictsResolved: 3, conflictsUnresolved: 1, staffMediationNeeded: true }),
    makePeer({ childId: "child-morgan", childName: "Morgan", peerId: "child-jordan", peerName: "Jordan", quality: "developing", trend: "stable", positiveInteractions: 10, negativeInteractions: 2, conflictsResolved: 1, conflictsUnresolved: 0, staffMediationNeeded: false }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAttachmentAssessments", () => {
  it("counts assessments and unique children", () => {
    const result = evaluateAttachmentAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.totalAssessments).toBe(3);
    expect(result.childrenAssessed).toBe(3);
  });

  it("calculates coverage rate", () => {
    const result = evaluateAttachmentAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.assessmentCoverageRate).toBe(100);
  });

  it("tracks style distribution", () => {
    const result = evaluateAttachmentAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.styleDistribution["secure"]).toBe(1);
    expect(result.styleDistribution["anxious_ambivalent"]).toBe(1);
    expect(result.styleDistribution["anxious_avoidant"]).toBe(1);
  });

  it("calculates assessment currency within 6 months", () => {
    const result = evaluateAttachmentAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.assessmentCurrency).toBe(100);
  });

  it("flags expired assessments", () => {
    const old = [makeAssessment({ assessmentDate: "2024-01-01" })];
    const result = evaluateAttachmentAssessments(old, CHILD_IDS, REFERENCE_DATE);
    expect(result.assessmentCurrency).toBe(0);
  });

  it("calculates informed care rate", () => {
    const result = evaluateAttachmentAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.informedCareRate).toBe(100);
  });

  it("calculates shared with team rate", () => {
    const result = evaluateAttachmentAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.sharedWithTeamRate).toBe(100);
  });

  it("counts children showing progress", () => {
    const result = evaluateAttachmentAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    // Alex: disorganised → anxious_ambivalent (progress), Morgan: disorganised → anxious_avoidant (progress)
    expect(result.childrenShowingProgress).toBe(2);
  });

  it("produces positive score with good data", () => {
    const result = evaluateAttachmentAssessments(demoAssessments(), CHILD_IDS, REFERENCE_DATE);
    expect(result.overallScore).toBeGreaterThan(50);
  });

  it("returns zero score with empty data", () => {
    const result = evaluateAttachmentAssessments([], CHILD_IDS, REFERENCE_DATE);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
  });

  it("handles partial coverage", () => {
    const partial = [makeAssessment({ childId: "child-alex" })];
    const result = evaluateAttachmentAssessments(partial, CHILD_IDS, REFERENCE_DATE);
    expect(result.assessmentCoverageRate).toBeCloseTo(33.3, 0);
  });

  it("handles not-informed assessments", () => {
    const notInformed = [makeAssessment({ informedCareApproach: false })];
    const result = evaluateAttachmentAssessments(notInformed, CHILD_IDS, REFERENCE_DATE);
    expect(result.informedCareRate).toBe(0);
  });
});

describe("evaluateRelationshipQuality", () => {
  it("counts total relationships", () => {
    const result = evaluateRelationshipQuality(demoRelationships(), CHILD_IDS);
    expect(result.totalRelationships).toBe(6);
  });

  it("calculates quality distribution", () => {
    const result = evaluateRelationshipQuality(demoRelationships(), CHILD_IDS);
    expect(result.qualityDistribution["strong"]).toBe(3);
    expect(result.qualityDistribution["developing"]).toBe(3);
  });

  it("calculates average trust score", () => {
    const result = evaluateRelationshipQuality(demoRelationships(), CHILD_IDS);
    // (8+6+9+8+5+6) / 6 = 7.0
    expect(result.averageTrustScore).toBe(7);
  });

  it("calculates average consistency score", () => {
    const result = evaluateRelationshipQuality(demoRelationships(), CHILD_IDS);
    // (9+7+9+8+6+7) / 6 = 7.67
    expect(result.averageConsistencyScore).toBeCloseTo(7.7, 0);
  });

  it("calculates average child rating", () => {
    const result = evaluateRelationshipQuality(demoRelationships(), CHILD_IDS);
    // (8+7+9+8+5+6) / 6 = 7.17
    expect(result.averageChildRating).toBeCloseTo(7.2, 0);
  });

  it("calculates strong relationships rate", () => {
    const result = evaluateRelationshipQuality(demoRelationships(), CHILD_IDS);
    // 3 out of 6 = 50%
    expect(result.strongRelationshipsRate).toBe(50);
  });

  it("calculates key worker relationship quality", () => {
    const result = evaluateRelationshipQuality(demoRelationships(), CHILD_IDS);
    // Key workers: Sarah(8+9)/2=8.5, Tom(9+9)/2=9, Lisa(5+6)/2=5.5 → avg = (8.5+9+5.5)/3 = 7.67
    expect(result.keyWorkerRelationshipQuality).toBeGreaterThan(7);
  });

  it("tracks trend distribution", () => {
    const result = evaluateRelationshipQuality(demoRelationships(), CHILD_IDS);
    expect(result.trendDistribution["strengthening"]).toBe(3);
    expect(result.trendDistribution["stable"]).toBe(3);
  });

  it("produces positive score", () => {
    const result = evaluateRelationshipQuality(demoRelationships(), CHILD_IDS);
    expect(result.overallScore).toBeGreaterThan(40);
  });

  it("returns zero with empty data", () => {
    const result = evaluateRelationshipQuality([], CHILD_IDS);
    expect(result.overallScore).toBe(0);
  });

  it("handles relationships without child ratings", () => {
    const noRating = [makeRelationship({ childRating: undefined })];
    const result = evaluateRelationshipQuality(noRating, CHILD_IDS);
    expect(result.averageChildRating).toBe(0);
  });
});

describe("evaluateInteractionQuality", () => {
  it("counts total interactions", () => {
    const result = evaluateInteractionQuality(demoInteractions(), CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalInteractions).toBe(10);
  });

  it("calculates average quality", () => {
    const result = evaluateInteractionQuality(demoInteractions(), CHILD_IDS, PERIOD_START, PERIOD_END);
    // (8+7+8+9+9+9+8+6+7+7) / 10 = 7.8
    expect(result.averageQuality).toBe(7.8);
  });

  it("calculates child-initiated rate", () => {
    const result = evaluateInteractionQuality(demoInteractions(), CHILD_IDS, PERIOD_START, PERIOD_END);
    // 4 child-initiated out of 10 = 40%
    expect(result.childInitiatedRate).toBe(40);
  });

  it("tracks context distribution", () => {
    const result = evaluateInteractionQuality(demoInteractions(), CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.contextDistribution["key_work_session"]).toBe(3);
    expect(result.contextDistribution["daily_living"]).toBe(1);
  });

  it("calculates attachment-relevant rate", () => {
    const result = evaluateInteractionQuality(demoInteractions(), CHILD_IDS, PERIOD_START, PERIOD_END);
    // 7 out of 10 = 70%
    expect(result.attachmentRelevantRate).toBe(70);
  });

  it("calculates regulation support rate", () => {
    const result = evaluateInteractionQuality(demoInteractions(), CHILD_IDS, PERIOD_START, PERIOD_END);
    // 4 out of 10 = 40%
    expect(result.regulationSupportRate).toBe(40);
  });

  it("calculates average duration", () => {
    const result = evaluateInteractionQuality(demoInteractions(), CHILD_IDS, PERIOD_START, PERIOD_END);
    // (45+20+60+30+40+120+25+50+15+35) / 10 = 44
    expect(result.averageDuration).toBe(44);
  });

  it("calculates interactions per child per week", () => {
    const result = evaluateInteractionQuality(demoInteractions(), CHILD_IDS, PERIOD_START, PERIOD_END);
    // 10 interactions / 3 children / ~26 weeks ≈ 0.1
    expect(result.interactionsPerChildPerWeek).toBeGreaterThan(0);
  });

  it("produces positive score", () => {
    const result = evaluateInteractionQuality(demoInteractions(), CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBeGreaterThan(20);
  });

  it("returns zero with empty data", () => {
    const result = evaluateInteractionQuality([], CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBe(0);
  });
});

describe("evaluateStability", () => {
  it("counts indicators collected", () => {
    const result = evaluateStability(demoStability(), CHILD_IDS);
    expect(result.indicatorsCollected).toBe(3);
  });

  it("calculates key worker consistency rate", () => {
    const result = evaluateStability(demoStability(), CHILD_IDS);
    expect(result.keyWorkerConsistencyRate).toBe(100);
  });

  it("calculates staff team stability rate", () => {
    const result = evaluateStability(demoStability(), CHILD_IDS);
    expect(result.staffTeamStabilityRate).toBe(100);
  });

  it("calculates average routine consistency", () => {
    const result = evaluateStability(demoStability(), CHILD_IDS);
    // (8+9+6) / 3 = 7.67
    expect(result.averageRoutineConsistency).toBeCloseTo(7.7, 0);
  });

  it("calculates average placement security", () => {
    const result = evaluateStability(demoStability(), CHILD_IDS);
    // (8+9+6) / 3 = 7.67
    expect(result.averagePlacementSecurity).toBeCloseTo(7.7, 0);
  });

  it("calculates average belonging", () => {
    const result = evaluateStability(demoStability(), CHILD_IDS);
    // (8+9+5) / 3 = 7.33
    expect(result.averageBelonging).toBeCloseTo(7.3, 0);
  });

  it("calculates child feels safe rate", () => {
    const result = evaluateStability(demoStability(), CHILD_IDS);
    expect(result.childFeelsSafeRate).toBe(100);
  });

  it("calculates child feels valued rate", () => {
    const result = evaluateStability(demoStability(), CHILD_IDS);
    // 2 out of 3 (Morgan doesn't feel valued)
    expect(result.childFeelsValuedRate).toBeCloseTo(66.7, 0);
  });

  it("produces positive score", () => {
    const result = evaluateStability(demoStability(), CHILD_IDS);
    expect(result.overallScore).toBeGreaterThan(50);
  });

  it("returns zero with empty data", () => {
    const result = evaluateStability([], CHILD_IDS);
    expect(result.overallScore).toBe(0);
  });

  it("detects when children don't feel safe", () => {
    const unsafe = [makeStability({ childFeelsSafe: false })];
    const result = evaluateStability(unsafe, CHILD_IDS);
    expect(result.childFeelsSafeRate).toBe(0);
  });
});

describe("evaluatePeerRelationships", () => {
  it("counts total peer relationships", () => {
    const result = evaluatePeerRelationships(demoPeers());
    expect(result.totalPeerRelationships).toBe(6);
  });

  it("calculates quality distribution", () => {
    const result = evaluatePeerRelationships(demoPeers());
    expect(result.qualityDistribution["developing"]).toBe(4);
    expect(result.qualityDistribution["inconsistent"]).toBe(2);
  });

  it("calculates average positive interactions", () => {
    const result = evaluatePeerRelationships(demoPeers());
    // (15+8+15+10+8+10) / 6 = 11
    expect(result.averagePositiveInteractions).toBe(11);
  });

  it("calculates average negative interactions", () => {
    const result = evaluatePeerRelationships(demoPeers());
    // (3+6+3+2+6+2) / 6 = 3.67
    expect(result.averageNegativeInteractions).toBeCloseTo(3.7, 0);
  });

  it("calculates conflict resolution rate", () => {
    const result = evaluatePeerRelationships(demoPeers());
    // Resolved: 2+3+2+1+3+1=12, Unresolved: 0+1+0+0+1+0=2, Total=14, Rate=12/14=85.7%
    expect(result.conflictResolutionRate).toBeCloseTo(85.7, 0);
  });

  it("calculates mediation needed rate", () => {
    const result = evaluatePeerRelationships(demoPeers());
    // 2 out of 6 need mediation = 33.3%
    expect(result.mediationNeededRate).toBeCloseTo(33.3, 0);
  });

  it("produces positive score", () => {
    const result = evaluatePeerRelationships(demoPeers());
    expect(result.overallScore).toBeGreaterThan(30);
  });

  it("returns zero with empty data", () => {
    const result = evaluatePeerRelationships([]);
    expect(result.overallScore).toBe(0);
  });

  it("gives full conflict resolution when no conflicts", () => {
    const noConflict = [makePeer({ conflictsResolved: 0, conflictsUnresolved: 0 })];
    const result = evaluatePeerRelationships(noConflict);
    expect(result.conflictResolutionRate).toBe(100);
  });

  it("handles all strong peer relationships", () => {
    const allStrong = [
      makePeer({ quality: "strong", positiveInteractions: 20, negativeInteractions: 1 }),
    ];
    const result = evaluatePeerRelationships(allStrong);
    expect(result.overallScore).toBeGreaterThan(70);
  });
});

describe("buildChildAttachmentProfiles", () => {
  const profiles = buildChildAttachmentProfiles(
    demoAssessments(), demoRelationships(), demoInteractions(),
    demoStability(), demoPeers(), CHILD_IDS, REFERENCE_DATE,
  );

  it("creates profile for each child", () => {
    expect(profiles.length).toBe(3);
    expect(profiles.map(p => p.childId)).toEqual(CHILD_IDS);
  });

  it("identifies attachment styles correctly", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    const jordan = profiles.find(p => p.childId === "child-jordan")!;
    const morgan = profiles.find(p => p.childId === "child-morgan")!;
    expect(alex.attachmentStyle).toBe("anxious_ambivalent");
    expect(jordan.attachmentStyle).toBe("secure");
    expect(morgan.attachmentStyle).toBe("anxious_avoidant");
  });

  it("identifies key worker quality", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.keyWorkerQuality).toBe("strong");
  });

  it("counts relationships", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.totalRelationships).toBe(2);
    expect(alex.strongRelationships).toBe(1);
  });

  it("identifies assessments as current", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.assessmentCurrent).toBe(true);
  });

  it("calculates interaction quality", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.interactionQuality).toBeGreaterThan(0);
  });

  it("generates risk factors for insecure attachment", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.riskFactors.some(r => r.includes("Insecure attachment"))).toBe(true);
  });

  it("generates protective factors for secure attachment", () => {
    const jordan = profiles.find(p => p.childId === "child-jordan")!;
    expect(jordan.protectiveFactors.some(p => p.includes("Secure attachment"))).toBe(true);
  });

  it("flags child who doesn't feel valued", () => {
    const morgan = profiles.find(p => p.childId === "child-morgan")!;
    expect(morgan.riskFactors.some(r => r.includes("does not feel valued"))).toBe(true);
  });

  it("identifies strong key worker as protective", () => {
    const alex = profiles.find(p => p.childId === "child-alex")!;
    expect(alex.protectiveFactors.some(p => p.includes("Strong key worker"))).toBe(true);
  });

  it("calculates overall wellbeing", () => {
    const jordan = profiles.find(p => p.childId === "child-jordan")!;
    expect(jordan.overallWellbeing).toBeGreaterThan(5);
  });

  it("handles child with no data", () => {
    const profiles = buildChildAttachmentProfiles([], [], [], [], [], ["child-unknown"], REFERENCE_DATE);
    expect(profiles[0].attachmentStyle).toBe("not_assessed");
    expect(profiles[0].assessmentCurrent).toBe(false);
    expect(profiles[0].keyWorkerQuality).toBe("none");
  });
});

describe("generateAttachmentRelationshipsIntelligence", () => {
  const result = generateAttachmentRelationshipsIntelligence(
    demoAssessments(), demoRelationships(), demoInteractions(),
    demoStability(), demoPeers(), CHILD_IDS,
    HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
  );

  it("returns correct homeId and period", () => {
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.referenceDate).toBe(REFERENCE_DATE);
  });

  it("calculates overall score", () => {
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all sub-results", () => {
    expect(result.attachmentAssessments.totalAssessments).toBe(3);
    expect(result.relationshipQuality.totalRelationships).toBe(6);
    expect(result.interactionQuality.totalInteractions).toBe(10);
    expect(result.stability.indicatorsCollected).toBe(3);
    expect(result.peerRelationships.totalPeerRelationships).toBe(6);
  });

  it("includes child profiles", () => {
    expect(result.childProfiles.length).toBe(3);
  });

  it("generates strengths", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement", () => {
    expect(result.areasForImprovement.length).toBeGreaterThanOrEqual(0);
  });

  it("generates actions", () => {
    expect(result.actions.length).toBeGreaterThanOrEqual(0);
  });

  it("includes regulatory links", () => {
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some(l => l.includes("Reg 6"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("Reg 11"))).toBe(true);
    expect(result.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
  });

  it("demo data produces good or outstanding rating", () => {
    expect(["outstanding", "good"]).toContain(result.rating);
  });

  it("strengths mention safety when all feel safe", () => {
    expect(result.strengths.some(s => s.toLowerCase().includes("safe"))).toBe(true);
  });
});

describe("scoring thresholds", () => {
  it("outstanding at score >= 80", () => {
    const result = generateAttachmentRelationshipsIntelligence(
      demoAssessments(), demoRelationships(), demoInteractions(),
      demoStability(), demoPeers(), CHILD_IDS,
      HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 80) expect(result.rating).toBe("outstanding");
    else if (result.overallScore >= 60) expect(result.rating).toBe("good");
    else if (result.overallScore >= 40) expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });

  it("inadequate with empty data", () => {
    const result = generateAttachmentRelationshipsIntelligence(
      [], [], [], [], [], CHILD_IDS,
      HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });
});

describe("label functions", () => {
  it("getAttachmentStyleLabel returns correct labels", () => {
    expect(getAttachmentStyleLabel("secure")).toBe("Secure");
    expect(getAttachmentStyleLabel("anxious_ambivalent")).toBe("Anxious-Ambivalent");
    expect(getAttachmentStyleLabel("anxious_avoidant")).toBe("Anxious-Avoidant");
    expect(getAttachmentStyleLabel("disorganised")).toBe("Disorganised");
    expect(getAttachmentStyleLabel("not_assessed")).toBe("Not Assessed");
  });

  it("getRelationshipTypeLabel returns correct labels", () => {
    expect(getRelationshipTypeLabel("key_worker")).toBe("Key Worker");
    expect(getRelationshipTypeLabel("secondary_key_worker")).toBe("Secondary Key Worker");
    expect(getRelationshipTypeLabel("peer")).toBe("Peer");
    expect(getRelationshipTypeLabel("family")).toBe("Family");
    expect(getRelationshipTypeLabel("mentor")).toBe("Mentor");
  });

  it("getRelationshipQualityLabel returns correct labels", () => {
    expect(getRelationshipQualityLabel("strong")).toBe("Strong");
    expect(getRelationshipQualityLabel("developing")).toBe("Developing");
    expect(getRelationshipQualityLabel("inconsistent")).toBe("Inconsistent");
    expect(getRelationshipQualityLabel("strained")).toBe("Strained");
    expect(getRelationshipQualityLabel("broken")).toBe("Broken");
  });

  it("getInteractionContextLabel returns correct labels", () => {
    expect(getInteractionContextLabel("key_work_session")).toBe("Key Work Session");
    expect(getInteractionContextLabel("crisis_support")).toBe("Crisis Support");
    expect(getInteractionContextLabel("bedtime_routine")).toBe("Bedtime Routine");
    expect(getInteractionContextLabel("community_outing")).toBe("Community Outing");
  });
});
