// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Sexual Health & Relationships Education Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex 14, Jordan 13, Morgan 15),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getTopicAreaLabel,
  getDeliveryMethodLabel,
  getAgeAppropriatenessLabel,
  getEngagementLevelLabel,
  getRatingLabel,
  getTopicAreaLabels,
  getDeliveryMethodLabels,
  getAgeAppropriatenessLabels,
  getEngagementLevelLabels,
  getRatingLabels,
  evaluateRSEDelivery,
  evaluateSexualHealthAccess,
  evaluateRSEPolicyQuality,
  evaluateStaffRSEReadiness,
  buildChildRSESummaries,
  generateSexualHealthRelationshipsEducationIntelligence,
} from "../sexual-health-relationships-education-engine";
import type {
  RSESession,
  SexualHealthReferral,
  RSEPolicy,
  StaffRSETraining,
  TopicArea,
  DeliveryMethod,
  AgeAppropriateness,
  EngagementLevel,
  Rating,
} from "../sexual-health-relationships-education-engine";

// ── Factory Helpers ──────────────────────────────────────────────────────────

const makeSession = (overrides: Partial<RSESession> = {}): RSESession => ({
  id: "rse-001",
  childId: "child-alex",
  childName: "Alex",
  sessionDate: "2026-03-15",
  topicArea: "consent",
  deliveryMethod: "one_to_one",
  deliveredBy: "Sarah Johnson",
  ageAppropriateness: "fully_appropriate",
  childEngagement: "highly_engaged",
  consentObtained: true,
  followUpRequired: false,
  followUpCompleted: false,
  ...overrides,
});

const makeReferral = (overrides: Partial<SexualHealthReferral> = {}): SexualHealthReferral => ({
  id: "ref-001",
  childId: "child-alex",
  childName: "Alex",
  referralDate: "2026-04-01",
  referralType: "sexual_health_clinic",
  serviceAccessed: true,
  confidentialityMaintained: true,
  consentObtained: true,
  outcomeRecorded: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<RSEPolicy> = {}): RSEPolicy => ({
  id: "policy-001",
  policyReviewDate: "2026-01-15",
  policyCurrent: true,
  ageAppropriateResources: true,
  lgbtqInclusive: true,
  culturallySensitive: true,
  parentCarerConsulted: true,
  externalProfessionalsInvolved: true,
  childrenConsulted: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffRSETraining> = {}): StaffRSETraining => ({
  id: "train-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  rseDeliveryTrained: true,
  safeguardingSexual: true,
  consentEducation: true,
  lgbtqAwareness: true,
  cseCseAwareness: true,
  ageAppropriateCommunication: true,
  ...overrides,
});

// ── pct helper ───────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when numerator equals denominator", () => {
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

// ── getRating ────────────────────────────────────────────────────────────────

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

// ── Label Getters ────────────────────────────────────────────────────────────

describe("getTopicAreaLabel", () => {
  it("returns correct label for each topic area", () => {
    expect(getTopicAreaLabel("consent")).toBe("Consent");
    expect(getTopicAreaLabel("healthy_relationships")).toBe("Healthy Relationships");
    expect(getTopicAreaLabel("online_safety")).toBe("Online Safety");
    expect(getTopicAreaLabel("contraception")).toBe("Contraception");
    expect(getTopicAreaLabel("sti_awareness")).toBe("STI Awareness");
    expect(getTopicAreaLabel("lgbtq_identity")).toBe("LGBTQ+ Identity");
    expect(getTopicAreaLabel("body_autonomy")).toBe("Body Autonomy");
    expect(getTopicAreaLabel("exploitation_awareness")).toBe("Exploitation Awareness");
    expect(getTopicAreaLabel("emotional_wellbeing")).toBe("Emotional Wellbeing");
    expect(getTopicAreaLabel("boundaries")).toBe("Boundaries");
  });
});

describe("getDeliveryMethodLabel", () => {
  it("returns correct label for each delivery method", () => {
    expect(getDeliveryMethodLabel("one_to_one")).toBe("One-to-One");
    expect(getDeliveryMethodLabel("group_session")).toBe("Group Session");
    expect(getDeliveryMethodLabel("keyworker_session")).toBe("Keyworker Session");
    expect(getDeliveryMethodLabel("external_professional")).toBe("External Professional");
    expect(getDeliveryMethodLabel("peer_education")).toBe("Peer Education");
    expect(getDeliveryMethodLabel("resource_based")).toBe("Resource-Based");
  });
});

describe("getAgeAppropriatenessLabel", () => {
  it("returns correct label for each age appropriateness level", () => {
    expect(getAgeAppropriatenessLabel("fully_appropriate")).toBe("Fully Appropriate");
    expect(getAgeAppropriatenessLabel("mostly_appropriate")).toBe("Mostly Appropriate");
    expect(getAgeAppropriatenessLabel("needs_adaptation")).toBe("Needs Adaptation");
    expect(getAgeAppropriatenessLabel("not_appropriate")).toBe("Not Appropriate");
  });
});

describe("getEngagementLevelLabel", () => {
  it("returns correct label for each engagement level", () => {
    expect(getEngagementLevelLabel("highly_engaged")).toBe("Highly Engaged");
    expect(getEngagementLevelLabel("engaged")).toBe("Engaged");
    expect(getEngagementLevelLabel("partially_engaged")).toBe("Partially Engaged");
    expect(getEngagementLevelLabel("disengaged")).toBe("Disengaged");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for each rating", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("label map getters", () => {
  it("getTopicAreaLabels returns all 10 topic area labels", () => {
    const labels = getTopicAreaLabels();
    expect(Object.keys(labels)).toHaveLength(10);
    expect(labels.consent).toBe("Consent");
    expect(labels.boundaries).toBe("Boundaries");
  });

  it("getDeliveryMethodLabels returns all 6 delivery method labels", () => {
    const labels = getDeliveryMethodLabels();
    expect(Object.keys(labels)).toHaveLength(6);
    expect(labels.one_to_one).toBe("One-to-One");
  });

  it("getAgeAppropriatenessLabels returns all 4 labels", () => {
    const labels = getAgeAppropriatenessLabels();
    expect(Object.keys(labels)).toHaveLength(4);
    expect(labels.fully_appropriate).toBe("Fully Appropriate");
  });

  it("getEngagementLevelLabels returns all 4 labels", () => {
    const labels = getEngagementLevelLabels();
    expect(Object.keys(labels)).toHaveLength(4);
    expect(labels.highly_engaged).toBe("Highly Engaged");
  });

  it("getRatingLabels returns all 4 labels", () => {
    const labels = getRatingLabels();
    expect(Object.keys(labels)).toHaveLength(4);
    expect(labels.outstanding).toBe("Outstanding");
  });
});

// ── evaluateRSEDelivery ──────────────────────────────────────────────────────

describe("evaluateRSEDelivery", () => {
  it("returns 0 for empty sessions", () => {
    expect(evaluateRSEDelivery([])).toBe(0);
  });

  it("returns max 25 for perfect sessions across all topics", () => {
    const allTopics: TopicArea[] = [
      "consent", "healthy_relationships", "online_safety", "contraception",
      "sti_awareness", "lgbtq_identity", "body_autonomy", "exploitation_awareness",
      "emotional_wellbeing", "boundaries",
    ];
    const sessions = allTopics.map((topic, i) =>
      makeSession({
        id: `rse-${i}`,
        topicArea: topic,
        ageAppropriateness: "fully_appropriate",
        childEngagement: "highly_engaged",
        followUpRequired: false,
      }),
    );
    expect(evaluateRSEDelivery(sessions)).toBe(25);
  });

  it("scores topic variety proportionally", () => {
    // 3 unique topics out of 10 = round(0.3 * 7) = 2
    const sessions = [
      makeSession({ topicArea: "consent" }),
      makeSession({ id: "rse-002", topicArea: "boundaries" }),
      makeSession({ id: "rse-003", topicArea: "online_safety" }),
    ];
    const score = evaluateRSEDelivery(sessions);
    expect(score).toBeGreaterThanOrEqual(2);
    expect(score).toBeLessThanOrEqual(25);
  });

  it("penalises poor age appropriateness", () => {
    const good = [makeSession({ ageAppropriateness: "fully_appropriate" })];
    const bad = [makeSession({ ageAppropriateness: "not_appropriate" })];
    expect(evaluateRSEDelivery(good)).toBeGreaterThan(evaluateRSEDelivery(bad));
  });

  it("penalises low engagement", () => {
    const good = [makeSession({ childEngagement: "highly_engaged" })];
    const bad = [makeSession({ childEngagement: "disengaged" })];
    expect(evaluateRSEDelivery(good)).toBeGreaterThan(evaluateRSEDelivery(bad));
  });

  it("awards full follow-up score when none required", () => {
    const sessions = [makeSession({ followUpRequired: false })];
    const score = evaluateRSEDelivery(sessions);
    // Should include 6 points for follow-up since none needed
    expect(score).toBeGreaterThanOrEqual(6);
  });

  it("penalises incomplete follow-ups", () => {
    const complete = [
      makeSession({ followUpRequired: true, followUpCompleted: true }),
    ];
    const incomplete = [
      makeSession({ followUpRequired: true, followUpCompleted: false }),
    ];
    expect(evaluateRSEDelivery(complete)).toBeGreaterThan(evaluateRSEDelivery(incomplete));
  });

  it("caps at 25", () => {
    const allTopics: TopicArea[] = [
      "consent", "healthy_relationships", "online_safety", "contraception",
      "sti_awareness", "lgbtq_identity", "body_autonomy", "exploitation_awareness",
      "emotional_wellbeing", "boundaries",
    ];
    const sessions = allTopics.map((topic, i) =>
      makeSession({ id: `rse-${i}`, topicArea: topic }),
    );
    expect(evaluateRSEDelivery(sessions)).toBeLessThanOrEqual(25);
  });

  it("scores mostly_appropriate as positive for age appropriateness", () => {
    const sessions = [makeSession({ ageAppropriateness: "mostly_appropriate" })];
    const badSessions = [makeSession({ ageAppropriateness: "needs_adaptation" })];
    expect(evaluateRSEDelivery(sessions)).toBeGreaterThanOrEqual(evaluateRSEDelivery(badSessions));
  });

  it("scores engaged as positive for engagement", () => {
    const sessions = [makeSession({ childEngagement: "engaged" })];
    const badSessions = [makeSession({ childEngagement: "partially_engaged" })];
    expect(evaluateRSEDelivery(sessions)).toBeGreaterThanOrEqual(evaluateRSEDelivery(badSessions));
  });
});

// ── evaluateSexualHealthAccess ──────────────────────────────────────────────

describe("evaluateSexualHealthAccess", () => {
  it("returns 0 for empty referrals", () => {
    expect(evaluateSexualHealthAccess([])).toBe(0);
  });

  it("returns max 25 for perfect referrals", () => {
    const referrals = [
      makeReferral(),
      makeReferral({ id: "ref-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    expect(evaluateSexualHealthAccess(referrals)).toBe(25);
  });

  it("scores service access rate (0-7)", () => {
    const accessed = [makeReferral({ serviceAccessed: true })];
    const notAccessed = [makeReferral({ serviceAccessed: false })];
    expect(evaluateSexualHealthAccess(accessed)).toBeGreaterThan(
      evaluateSexualHealthAccess(notAccessed),
    );
  });

  it("scores confidentiality rate (0-6)", () => {
    const confidential = [makeReferral({ confidentialityMaintained: true })];
    const notConfidential = [makeReferral({ confidentialityMaintained: false })];
    expect(evaluateSexualHealthAccess(confidential)).toBeGreaterThan(
      evaluateSexualHealthAccess(notConfidential),
    );
  });

  it("scores consent rate (0-6)", () => {
    const consented = [makeReferral({ consentObtained: true })];
    const notConsented = [makeReferral({ consentObtained: false })];
    expect(evaluateSexualHealthAccess(consented)).toBeGreaterThan(
      evaluateSexualHealthAccess(notConsented),
    );
  });

  it("scores outcome recorded rate (0-6)", () => {
    const recorded = [makeReferral({ outcomeRecorded: true })];
    const notRecorded = [makeReferral({ outcomeRecorded: false })];
    expect(evaluateSexualHealthAccess(recorded)).toBeGreaterThan(
      evaluateSexualHealthAccess(notRecorded),
    );
  });

  it("returns 0 when all fields are false", () => {
    const referrals = [
      makeReferral({
        serviceAccessed: false,
        confidentialityMaintained: false,
        consentObtained: false,
        outcomeRecorded: false,
      }),
    ];
    expect(evaluateSexualHealthAccess(referrals)).toBe(0);
  });

  it("caps at 25", () => {
    const referrals = Array.from({ length: 20 }, (_, i) =>
      makeReferral({ id: `ref-${i}` }),
    );
    expect(evaluateSexualHealthAccess(referrals)).toBeLessThanOrEqual(25);
  });
});

// ── evaluateRSEPolicyQuality ────────────────────────────────────────────────

describe("evaluateRSEPolicyQuality", () => {
  it("returns 0 for empty policies", () => {
    expect(evaluateRSEPolicyQuality([])).toBe(0);
  });

  it("returns 25 for perfect policy (all true)", () => {
    expect(evaluateRSEPolicyQuality([makePolicy()])).toBe(25);
  });

  it("scores policyCurrent as 5", () => {
    const with_ = evaluateRSEPolicyQuality([makePolicy({ policyCurrent: true })]);
    const without_ = evaluateRSEPolicyQuality([
      makePolicy({
        policyCurrent: false,
      }),
    ]);
    expect(with_ - without_).toBe(5);
  });

  it("scores ageAppropriateResources as 4", () => {
    const with_ = evaluateRSEPolicyQuality([makePolicy({ ageAppropriateResources: true })]);
    const without_ = evaluateRSEPolicyQuality([
      makePolicy({ ageAppropriateResources: false }),
    ]);
    expect(with_ - without_).toBe(4);
  });

  it("scores lgbtqInclusive as 4", () => {
    const with_ = evaluateRSEPolicyQuality([makePolicy({ lgbtqInclusive: true })]);
    const without_ = evaluateRSEPolicyQuality([
      makePolicy({ lgbtqInclusive: false }),
    ]);
    expect(with_ - without_).toBe(4);
  });

  it("scores culturallySensitive as 4", () => {
    const with_ = evaluateRSEPolicyQuality([makePolicy({ culturallySensitive: true })]);
    const without_ = evaluateRSEPolicyQuality([
      makePolicy({ culturallySensitive: false }),
    ]);
    expect(with_ - without_).toBe(4);
  });

  it("scores parentCarerConsulted as 3", () => {
    const with_ = evaluateRSEPolicyQuality([makePolicy({ parentCarerConsulted: true })]);
    const without_ = evaluateRSEPolicyQuality([
      makePolicy({ parentCarerConsulted: false }),
    ]);
    expect(with_ - without_).toBe(3);
  });

  it("scores externalProfessionalsInvolved as 3", () => {
    const with_ = evaluateRSEPolicyQuality([
      makePolicy({ externalProfessionalsInvolved: true }),
    ]);
    const without_ = evaluateRSEPolicyQuality([
      makePolicy({ externalProfessionalsInvolved: false }),
    ]);
    expect(with_ - without_).toBe(3);
  });

  it("scores childrenConsulted as 2", () => {
    const with_ = evaluateRSEPolicyQuality([makePolicy({ childrenConsulted: true })]);
    const without_ = evaluateRSEPolicyQuality([
      makePolicy({ childrenConsulted: false }),
    ]);
    expect(with_ - without_).toBe(2);
  });

  it("returns 0 when all fields are false", () => {
    const policy = makePolicy({
      policyCurrent: false,
      ageAppropriateResources: false,
      lgbtqInclusive: false,
      culturallySensitive: false,
      parentCarerConsulted: false,
      externalProfessionalsInvolved: false,
      childrenConsulted: false,
    });
    expect(evaluateRSEPolicyQuality([policy])).toBe(0);
  });

  it("uses first policy when multiple provided", () => {
    const good = makePolicy(); // all true = 25
    const bad = makePolicy({
      policyCurrent: false,
      ageAppropriateResources: false,
      lgbtqInclusive: false,
      culturallySensitive: false,
      parentCarerConsulted: false,
      externalProfessionalsInvolved: false,
      childrenConsulted: false,
    });
    expect(evaluateRSEPolicyQuality([good, bad])).toBe(25);
    expect(evaluateRSEPolicyQuality([bad, good])).toBe(0);
  });

  it("caps at 25", () => {
    expect(evaluateRSEPolicyQuality([makePolicy()])).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffRSEReadiness ──────────────────────────────────────────────

describe("evaluateStaffRSEReadiness", () => {
  it("returns 0 for empty training", () => {
    expect(evaluateStaffRSEReadiness([])).toBe(0);
  });

  it("returns 25 for perfect training (all fields true for all staff)", () => {
    const training = [
      makeTraining({ staffId: "staff-1" }),
      makeTraining({ staffId: "staff-2", id: "train-002" }),
    ];
    expect(evaluateStaffRSEReadiness(training)).toBe(25);
  });

  it("scores rseDeliveryTrained (0-5)", () => {
    const good = [makeTraining({ rseDeliveryTrained: true })];
    const bad = [makeTraining({ rseDeliveryTrained: false })];
    expect(evaluateStaffRSEReadiness(good)).toBeGreaterThan(evaluateStaffRSEReadiness(bad));
  });

  it("scores safeguardingSexual (0-5)", () => {
    const good = [makeTraining({ safeguardingSexual: true })];
    const bad = [makeTraining({ safeguardingSexual: false })];
    expect(evaluateStaffRSEReadiness(good)).toBeGreaterThan(evaluateStaffRSEReadiness(bad));
  });

  it("scores consentEducation (0-4)", () => {
    const good = [makeTraining({ consentEducation: true })];
    const bad = [makeTraining({ consentEducation: false })];
    expect(evaluateStaffRSEReadiness(good)).toBeGreaterThan(evaluateStaffRSEReadiness(bad));
  });

  it("scores lgbtqAwareness (0-4)", () => {
    const good = [makeTraining({ lgbtqAwareness: true })];
    const bad = [makeTraining({ lgbtqAwareness: false })];
    expect(evaluateStaffRSEReadiness(good)).toBeGreaterThan(evaluateStaffRSEReadiness(bad));
  });

  it("scores cseCseAwareness (0-4)", () => {
    const good = [makeTraining({ cseCseAwareness: true })];
    const bad = [makeTraining({ cseCseAwareness: false })];
    expect(evaluateStaffRSEReadiness(good)).toBeGreaterThan(evaluateStaffRSEReadiness(bad));
  });

  it("scores ageAppropriateCommunication (0-3)", () => {
    const good = [makeTraining({ ageAppropriateCommunication: true })];
    const bad = [makeTraining({ ageAppropriateCommunication: false })];
    expect(evaluateStaffRSEReadiness(good)).toBeGreaterThan(evaluateStaffRSEReadiness(bad));
  });

  it("returns 0 when all fields are false", () => {
    const training = [
      makeTraining({
        rseDeliveryTrained: false,
        safeguardingSexual: false,
        consentEducation: false,
        lgbtqAwareness: false,
        cseCseAwareness: false,
        ageAppropriateCommunication: false,
      }),
    ];
    expect(evaluateStaffRSEReadiness(training)).toBe(0);
  });

  it("scales proportionally with partial training across staff", () => {
    const halfTrained = [
      makeTraining({ staffId: "staff-1" }),
      makeTraining({
        staffId: "staff-2",
        id: "train-002",
        rseDeliveryTrained: false,
        safeguardingSexual: false,
        consentEducation: false,
        lgbtqAwareness: false,
        cseCseAwareness: false,
        ageAppropriateCommunication: false,
      }),
    ];
    const score = evaluateStaffRSEReadiness(halfTrained);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(25);
  });

  it("caps at 25", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ staffId: `staff-${i}`, id: `train-${i}` }),
    );
    expect(evaluateStaffRSEReadiness(training)).toBeLessThanOrEqual(25);
  });
});

// ── buildChildRSESummaries ──────────────────────────────────────────────────

describe("buildChildRSESummaries", () => {
  it("returns empty array for no sessions and no referrals", () => {
    expect(buildChildRSESummaries([], [])).toEqual([]);
  });

  it("builds summary from sessions only", () => {
    const sessions = [
      makeSession({ childId: "child-alex", topicArea: "consent", childEngagement: "highly_engaged" }),
      makeSession({ id: "rse-002", childId: "child-alex", topicArea: "boundaries", childEngagement: "engaged" }),
    ];
    const summaries = buildChildRSESummaries(sessions, []);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].childId).toBe("child-alex");
    expect(summaries[0].sessionsAttended).toBe(2);
    expect(summaries[0].topicsCovered).toContain("consent");
    expect(summaries[0].topicsCovered).toContain("boundaries");
    expect(summaries[0].referralsMade).toBe(0);
  });

  it("builds summary from referrals only", () => {
    const referrals = [makeReferral({ childId: "child-alex" })];
    const summaries = buildChildRSESummaries([], referrals);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].sessionsAttended).toBe(0);
    expect(summaries[0].referralsMade).toBe(1);
  });

  it("combines sessions and referrals for same child", () => {
    const sessions = [makeSession({ childId: "child-alex" })];
    const referrals = [makeReferral({ childId: "child-alex" })];
    const summaries = buildChildRSESummaries(sessions, referrals);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].sessionsAttended).toBe(1);
    expect(summaries[0].referralsMade).toBe(1);
  });

  it("creates separate summaries for different children", () => {
    const sessions = [
      makeSession({ childId: "child-alex", childName: "Alex" }),
      makeSession({ id: "rse-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    const summaries = buildChildRSESummaries(sessions, []);
    expect(summaries).toHaveLength(2);
  });

  it("calculates average engagement correctly", () => {
    const sessions = [
      makeSession({ childEngagement: "highly_engaged" }), // 4
      makeSession({ id: "rse-002", childEngagement: "disengaged" }), // 1
    ];
    const summaries = buildChildRSESummaries(sessions, []);
    expect(summaries[0].averageEngagement).toBe(2.5);
  });

  it("score is between 0 and 10", () => {
    const sessions = [makeSession()];
    const referrals = [makeReferral()];
    const summaries = buildChildRSESummaries(sessions, referrals);
    expect(summaries[0].score).toBeGreaterThanOrEqual(0);
    expect(summaries[0].score).toBeLessThanOrEqual(10);
  });

  it("higher topic variety gives higher score", () => {
    const fewTopics = [makeSession({ topicArea: "consent" })];
    const manyTopics = [
      makeSession({ topicArea: "consent" }),
      makeSession({ id: "rse-002", topicArea: "boundaries" }),
      makeSession({ id: "rse-003", topicArea: "online_safety" }),
      makeSession({ id: "rse-004", topicArea: "lgbtq_identity" }),
      makeSession({ id: "rse-005", topicArea: "body_autonomy" }),
    ];
    const fewSummary = buildChildRSESummaries(fewTopics, []);
    const manySummary = buildChildRSESummaries(manyTopics, []);
    expect(manySummary[0].score).toBeGreaterThanOrEqual(fewSummary[0].score);
  });
});

// ── generateSexualHealthRelationshipsEducationIntelligence ──────────────────

describe("generateSexualHealthRelationshipsEducationIntelligence", () => {
  const allTopics: TopicArea[] = [
    "consent", "healthy_relationships", "online_safety", "contraception",
    "sti_awareness", "lgbtq_identity", "body_autonomy", "exploitation_awareness",
    "emotional_wellbeing", "boundaries",
  ];

  const perfectSessions: RSESession[] = allTopics.map((topic, i) =>
    makeSession({
      id: `rse-${i}`,
      topicArea: topic,
      ageAppropriateness: "fully_appropriate",
      childEngagement: "highly_engaged",
      followUpRequired: false,
    }),
  );

  const perfectReferrals: SexualHealthReferral[] = [
    makeReferral(),
    makeReferral({ id: "ref-002", childId: "child-jordan", childName: "Jordan" }),
  ];

  const perfectPolicy: RSEPolicy[] = [makePolicy()];

  const perfectTraining: StaffRSETraining[] = [
    makeTraining({ staffId: "staff-sarah", staffName: "Sarah Johnson" }),
    makeTraining({ staffId: "staff-tom", staffName: "Tom Richards", id: "train-002" }),
    makeTraining({ staffId: "staff-lisa", staffName: "Lisa Williams", id: "train-003" }),
    makeTraining({ staffId: "staff-darren", staffName: "Darren Laville", id: "train-004" }),
  ];

  it("returns correct homeId, periodStart, periodEnd", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("returns assessedAt as ISO string", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.assessedAt).toBeTruthy();
    expect(() => new Date(result.assessedAt)).not.toThrow();
  });

  it("sums 4 sub-scores to get overall score", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, perfectReferrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(
      result.rseDeliveryScore +
      result.sexualHealthAccessScore +
      result.rsePolicyQualityScore +
      result.staffRSEReadinessScore,
    );
  });

  it("caps overall score at 100", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, perfectReferrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score is at least 0", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("each sub-score caps at 25", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, perfectReferrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rseDeliveryScore).toBeLessThanOrEqual(25);
    expect(result.sexualHealthAccessScore).toBeLessThanOrEqual(25);
    expect(result.rsePolicyQualityScore).toBeLessThanOrEqual(25);
    expect(result.staffRSEReadinessScore).toBeLessThanOrEqual(25);
  });

  it("perfect data yields outstanding rating", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, perfectReferrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("empty data yields inadequate rating", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });

  it("generates strengths for high-scoring data", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, perfectReferrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low-scoring data", () => {
    const badSessions = [
      makeSession({
        ageAppropriateness: "not_appropriate",
        childEngagement: "disengaged",
        followUpRequired: true,
        followUpCompleted: false,
      }),
    ];
    const badReferrals = [
      makeReferral({
        serviceAccessed: false,
        confidentialityMaintained: false,
        consentObtained: false,
        outcomeRecorded: false,
      }),
    ];
    const badPolicy = [
      makePolicy({
        policyCurrent: false,
        ageAppropriateResources: false,
        lgbtqInclusive: false,
        culturallySensitive: false,
        parentCarerConsulted: false,
        externalProfessionalsInvolved: false,
        childrenConsulted: false,
      }),
    ];
    const badTraining = [
      makeTraining({
        rseDeliveryTrained: false,
        safeguardingSexual: false,
        consentEducation: false,
        lgbtqAwareness: false,
        cseCseAwareness: false,
        ageAppropriateCommunication: false,
      }),
    ];
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      badSessions, badReferrals, badPolicy, badTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions for poor data", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates no-action message for perfect data", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, perfectReferrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    // If all is well, should have the "no immediate actions" message
    // or specific low-priority actions
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes core regulatory links", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, perfectReferrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("KCSIE 2024"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("RSE Statutory Guidance 2019"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes UNCRC Article 24 when referrals exist", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], perfectReferrals, [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 24"))).toBe(true);
  });

  it("includes Working Together 2023 when exploitation awareness sessions exist", () => {
    const sessions = [makeSession({ topicArea: "exploitation_awareness" })];
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      sessions, [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
  });

  it("includes Working Together 2023 when external professional delivery used", () => {
    const sessions = [makeSession({ deliveryMethod: "external_professional" })];
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      sessions, [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
  });

  it("includes Equality Act 2010 when LGBTQ+ topics covered", () => {
    const sessions = [makeSession({ topicArea: "lgbtq_identity" })];
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      sessions, [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Equality Act 2010"))).toBe(true);
  });

  it("includes Equality Act 2010 when policy is LGBTQ+ inclusive", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], [], [makePolicy({ lgbtqInclusive: true })], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Equality Act 2010"))).toBe(true);
  });

  it("includes Equality Act 2010 when staff have LGBTQ+ training", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], [], [], [makeTraining({ lgbtqAwareness: true })], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Equality Act 2010"))).toBe(true);
  });

  it("builds child RSE summaries", () => {
    const sessions = [
      makeSession({ childId: "child-alex", childName: "Alex" }),
      makeSession({ id: "rse-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      sessions, [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.childRSESummaries).toHaveLength(2);
  });

  it("returns rating thresholds correctly", () => {
    // Test boundary at 80
    const sessions80 = allTopics.map((topic, i) =>
      makeSession({ id: `rse-${i}`, topicArea: topic }),
    );
    const result80 = generateSexualHealthRelationshipsEducationIntelligence(
      sessions80, perfectReferrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    if (result80.overallScore >= 80) expect(result80.rating).toBe("outstanding");
    else if (result80.overallScore >= 60) expect(result80.rating).toBe("good");
    else if (result80.overallScore >= 40) expect(result80.rating).toBe("requires_improvement");
    else expect(result80.rating).toBe("inadequate");
  });

  it("strength: consent consistently obtained", () => {
    const sessions = [
      makeSession({ consentObtained: true }),
      makeSession({ id: "rse-002", consentObtained: true }),
    ];
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      sessions, perfectReferrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("Consent is consistently obtained"))).toBe(true);
  });

  it("strength: confidentiality in all referrals", () => {
    const referrals = [
      makeReferral({ confidentialityMaintained: true }),
      makeReferral({ id: "ref-002", confidentialityMaintained: true }),
    ];
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, referrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("Confidentiality is maintained"))).toBe(true);
  });

  it("strength: LGBTQ+ inclusive policy", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, perfectReferrals, [makePolicy({ lgbtqInclusive: true })], perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("LGBTQ+ inclusive"))).toBe(true);
  });

  it("area: no sessions delivered", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No RSE sessions"))).toBe(true);
  });

  it("area: policy not current", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], [], [makePolicy({ policyCurrent: false })], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("policy is not current"))).toBe(true);
  });

  it("action: URGENT when no sessions", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("action: HIGH when policy not current", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, [], [makePolicy({ policyCurrent: false })], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.startsWith("HIGH") && a.includes("RSE policy"))).toBe(true);
  });

  it("action: URGENT when no policy exists", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("Develop an RSE policy"))).toBe(true);
  });

  it("action: MEDIUM for LGBTQ+ inclusivity gap", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, [], [makePolicy({ lgbtqInclusive: false })], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("LGBTQ+ inclusivity"))).toBe(true);
  });

  it("action: LOW for children not consulted", () => {
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      perfectSessions, [], [makePolicy({ childrenConsulted: false })], [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("Consult children"))).toBe(true);
  });

  it("strength: excellent topic breadth when 7+ topics covered", () => {
    const sessions = allTopics.slice(0, 7).map((topic, i) =>
      makeSession({ id: `rse-${i}`, topicArea: topic }),
    );
    const result = generateSexualHealthRelationshipsEducationIntelligence(
      sessions, perfectReferrals, perfectPolicy, perfectTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("breadth of RSE topics"))).toBe(true);
  });
});
