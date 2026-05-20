// ══════════════════════════════════════════════════════════════════════════════
// Delegated Authority Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getAuthorityCategoryLabel,
  getDecisionOutcomeLabel,
  getRatingLabel,
  evaluateAuthorityQuality,
  evaluateAuthorityCompliance,
  evaluateAuthorityPolicy,
  evaluateStaffAuthorityReadiness,
  buildChildAuthorityProfiles,
  generateDelegatedAuthorityIntelligence,
} from "../delegated-authority-engine";
import type {
  AuthorityDecision,
  AuthorityPolicy,
  StaffAuthorityTraining,
  AuthorityCategory,
} from "../delegated-authority-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeDecision(overrides: Partial<AuthorityDecision> = {}): AuthorityDecision {
  return {
    id: "dec-001",
    childId: "child-alex",
    childName: "Alex",
    decisionDate: "2026-03-15",
    category: "education_decisions",
    outcome: "approved_timely",
    childConsulted: true,
    decisionDocumented: true,
    parentNotified: true,
    withinDelegatedScope: true,
    staffMadeDecision: true,
    outcomeRecorded: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<AuthorityPolicy> = {}): AuthorityPolicy {
  return {
    id: "pol-001",
    delegatedAuthorityMatrix: true,
    clearDecisionFramework: true,
    staffEmpowermentGuidance: true,
    escalationProtocol: true,
    parentalNotificationProcess: true,
    childParticipationFramework: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffAuthorityTraining> = {}): StaffAuthorityTraining {
  return {
    id: "tr-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    delegatedAuthorityUnderstanding: true,
    decisionMakingConfidence: true,
    scopeRecognition: true,
    documentationCompetency: true,
    escalationAwareness: true,
    childConsultationSkills: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(pct(0, 0)).toBe(0);
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
// getRating
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
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getAuthorityCategoryLabel", () => {
  it("returns correct label for education_decisions", () => {
    expect(getAuthorityCategoryLabel("education_decisions")).toBe("Education Decisions");
  });

  it("returns correct label for health_appointments", () => {
    expect(getAuthorityCategoryLabel("health_appointments")).toBe("Health Appointments");
  });

  it("returns correct label for social_activities", () => {
    expect(getAuthorityCategoryLabel("social_activities")).toBe("Social Activities");
  });

  it("returns correct label for overnight_stays", () => {
    expect(getAuthorityCategoryLabel("overnight_stays")).toBe("Overnight Stays");
  });

  it("returns correct label for haircuts_appearance", () => {
    expect(getAuthorityCategoryLabel("haircuts_appearance")).toBe("Haircuts & Appearance");
  });

  it("returns correct label for travel_permissions", () => {
    expect(getAuthorityCategoryLabel("travel_permissions")).toBe("Travel Permissions");
  });

  it("returns correct label for religious_observance", () => {
    expect(getAuthorityCategoryLabel("religious_observance")).toBe("Religious Observance");
  });

  it("returns correct label for emergency_medical", () => {
    expect(getAuthorityCategoryLabel("emergency_medical")).toBe("Emergency Medical");
  });
});

describe("getDecisionOutcomeLabel", () => {
  it("returns correct label for approved_timely", () => {
    expect(getDecisionOutcomeLabel("approved_timely")).toBe("Approved (Timely)");
  });

  it("returns correct label for approved_delayed", () => {
    expect(getDecisionOutcomeLabel("approved_delayed")).toBe("Approved (Delayed)");
  });

  it("returns correct label for referred_up", () => {
    expect(getDecisionOutcomeLabel("referred_up")).toBe("Referred Up");
  });

  it("returns correct label for denied", () => {
    expect(getDecisionOutcomeLabel("denied")).toBe("Denied");
  });

  it("returns correct label for not_assessed", () => {
    expect(getDecisionOutcomeLabel("not_assessed")).toBe("Not Assessed");
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
// Evaluator 1: evaluateAuthorityQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAuthorityQuality", () => {
  it("returns all zeros for empty decisions", () => {
    const result = evaluateAuthorityQuality([]);
    expect(result.totalDecisions).toBe(0);
    expect(result.timelyApprovalRate).toBe(0);
    expect(result.childConsultedRate).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.outcomeRecordedRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns perfect score for all-true decisions", () => {
    const decisions = Array.from({ length: 5 }, (_, i) =>
      makeDecision({ id: `dec-${i}` }),
    );
    const result = evaluateAuthorityQuality(decisions);
    expect(result.timelyApprovalRate).toBe(100);
    expect(result.childConsultedRate).toBe(100);
    expect(result.documentedRate).toBe(100);
    expect(result.outcomeRecordedRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates partial scores correctly", () => {
    const decisions = [
      makeDecision({ id: "d1", outcome: "approved_timely", childConsulted: true, decisionDocumented: true, outcomeRecorded: true }),
      makeDecision({ id: "d2", outcome: "approved_delayed", childConsulted: false, decisionDocumented: false, outcomeRecorded: false }),
    ];
    const result = evaluateAuthorityQuality(decisions);
    expect(result.timelyApprovalRate).toBe(50);
    expect(result.childConsultedRate).toBe(50);
    expect(result.documentedRate).toBe(50);
    expect(result.outcomeRecordedRate).toBe(50);
    // (50/100)*7 + (50/100)*6 + (50/100)*6 + (50/100)*6 = 3.5+3+3+3 = 12.5
    expect(result.score).toBe(12.5);
  });

  it("caps score at 25", () => {
    // All metrics at 100 should result in exactly 25
    const decisions = [makeDecision()];
    const result = evaluateAuthorityQuality(decisions);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBe(25);
  });

  it("includes strengths when rates are high", () => {
    const decisions = Array.from({ length: 5 }, (_, i) =>
      makeDecision({ id: `dec-${i}` }),
    );
    const result = evaluateAuthorityQuality(decisions);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });

  it("includes concerns when rates are low", () => {
    const decisions = Array.from({ length: 5 }, (_, i) =>
      makeDecision({
        id: `dec-${i}`,
        outcome: "denied",
        childConsulted: false,
        decisionDocumented: false,
        outcomeRecorded: false,
      }),
    );
    const result = evaluateAuthorityQuality(decisions);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.timelyApprovalRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: evaluateAuthorityCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAuthorityCompliance", () => {
  it("returns all zeros for empty decisions", () => {
    const result = evaluateAuthorityCompliance([]);
    expect(result.totalDecisions).toBe(0);
    expect(result.parentNotifiedRate).toBe(0);
    expect(result.withinScopeRate).toBe(0);
    expect(result.staffDecisionRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns perfect score for all-true decisions across all categories", () => {
    const categories: AuthorityCategory[] = [
      "education_decisions", "health_appointments", "social_activities",
      "overnight_stays", "haircuts_appearance", "travel_permissions",
      "religious_observance", "emergency_medical",
    ];
    const decisions = categories.map((cat, i) =>
      makeDecision({ id: `dec-${i}`, category: cat }),
    );
    const result = evaluateAuthorityCompliance(decisions);
    expect(result.parentNotifiedRate).toBe(100);
    expect(result.withinScopeRate).toBe(100);
    expect(result.staffDecisionRate).toBe(100);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.score).toBe(25);
  });

  it("calculates diversity ratio correctly", () => {
    const decisions = [
      makeDecision({ id: "d1", category: "education_decisions" }),
      makeDecision({ id: "d2", category: "health_appointments" }),
      makeDecision({ id: "d3", category: "social_activities" }),
      makeDecision({ id: "d4", category: "overnight_stays" }),
    ];
    const result = evaluateAuthorityCompliance(decisions);
    expect(result.uniqueCategories).toBe(4);
    expect(result.categoryDiversityRatio).toBe(0.5);
  });

  it("calculates partial compliance scores", () => {
    const decisions = [
      makeDecision({ id: "d1", parentNotified: true, withinDelegatedScope: true, staffMadeDecision: true }),
      makeDecision({ id: "d2", parentNotified: false, withinDelegatedScope: false, staffMadeDecision: false }),
    ];
    const result = evaluateAuthorityCompliance(decisions);
    expect(result.parentNotifiedRate).toBe(50);
    expect(result.withinScopeRate).toBe(50);
    expect(result.staffDecisionRate).toBe(50);
  });

  it("caps score at 25", () => {
    const categories: AuthorityCategory[] = [
      "education_decisions", "health_appointments", "social_activities",
      "overnight_stays", "haircuts_appearance", "travel_permissions",
      "religious_observance", "emergency_medical",
    ];
    const decisions = categories.map((cat, i) =>
      makeDecision({ id: `dec-${i}`, category: cat }),
    );
    const result = evaluateAuthorityCompliance(decisions);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("includes concerns when rates are low", () => {
    const decisions = Array.from({ length: 5 }, (_, i) =>
      makeDecision({
        id: `dec-${i}`,
        parentNotified: false,
        withinDelegatedScope: false,
        staffMadeDecision: false,
      }),
    );
    const result = evaluateAuthorityCompliance(decisions);
    expect(result.concerns.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: evaluateAuthorityPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAuthorityPolicy", () => {
  it("returns 0 score and all false for null policy", () => {
    const result = evaluateAuthorityPolicy(null);
    expect(result.score).toBe(0);
    expect(result.delegatedAuthorityMatrix).toBe(false);
    expect(result.clearDecisionFramework).toBe(false);
    expect(result.staffEmpowermentGuidance).toBe(false);
    expect(result.escalationProtocol).toBe(false);
    expect(result.parentalNotificationProcess).toBe(false);
    expect(result.childParticipationFramework).toBe(false);
    expect(result.regularReview).toBe(false);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns perfect 25 for fully compliant policy", () => {
    const result = evaluateAuthorityPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });

  it("weights 4-point booleans correctly", () => {
    // Only the four 4-point booleans
    const result = evaluateAuthorityPolicy(makePolicy({
      parentalNotificationProcess: false,
      childParticipationFramework: false,
      regularReview: false,
    }));
    expect(result.score).toBe(16); // 4+4+4+4 = 16
  });

  it("weights 3-point booleans correctly", () => {
    // Only the three 3-point booleans
    const result = evaluateAuthorityPolicy(makePolicy({
      delegatedAuthorityMatrix: false,
      clearDecisionFramework: false,
      staffEmpowermentGuidance: false,
      escalationProtocol: false,
    }));
    expect(result.score).toBe(9); // 3+3+3 = 9
  });

  it("reports concerns for missing components", () => {
    const result = evaluateAuthorityPolicy(makePolicy({
      delegatedAuthorityMatrix: false,
      escalationProtocol: false,
    }));
    expect(result.concerns.some((c) => c.includes("authority matrix"))).toBe(true);
    expect(result.concerns.some((c) => c.includes("escalation protocol"))).toBe(true);
  });

  it("reports strength for 5+ components", () => {
    const result = evaluateAuthorityPolicy(makePolicy({
      regularReview: false,
      childParticipationFramework: false,
    }));
    expect(result.strengths.some((s) => s.includes("5/7"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: evaluateStaffAuthorityReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffAuthorityReadiness", () => {
  it("returns all zeros for empty training", () => {
    const result = evaluateStaffAuthorityReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.delegatedAuthorityUnderstandingRate).toBe(0);
    expect(result.decisionMakingConfidenceRate).toBe(0);
    expect(result.scopeRecognitionRate).toBe(0);
    expect(result.documentationCompetencyRate).toBe(0);
    expect(result.escalationAwarenessRate).toBe(0);
    expect(result.childConsultationSkillsRate).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns perfect 25 for fully trained staff", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
    ];
    const result = evaluateStaffAuthorityReadiness(training);
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("calculates partial rates correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", delegatedAuthorityUnderstanding: true, decisionMakingConfidence: false }),
      makeTraining({ id: "t2", staffId: "s2", delegatedAuthorityUnderstanding: false, decisionMakingConfidence: true }),
    ];
    const result = evaluateStaffAuthorityReadiness(training);
    expect(result.delegatedAuthorityUnderstandingRate).toBe(50);
    expect(result.decisionMakingConfidenceRate).toBe(50);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffAuthorityReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("includes concerns when rates are low", () => {
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        delegatedAuthorityUnderstanding: false,
        decisionMakingConfidence: false,
        scopeRecognition: false,
        documentationCompetency: false,
        escalationAwareness: false,
        childConsultationSkills: false,
      }),
      makeTraining({
        id: "t2",
        staffId: "s2",
        delegatedAuthorityUnderstanding: false,
        decisionMakingConfidence: false,
        scopeRecognition: false,
        documentationCompetency: false,
        escalationAwareness: false,
        childConsultationSkills: false,
      }),
    ];
    const result = evaluateStaffAuthorityReadiness(training);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("weights skills correctly: understanding=6, confidence=5, scope=5, doc=4, escalation=3, consultation=2", () => {
    // Single staff with only understanding true
    const t1 = [makeTraining({
      delegatedAuthorityUnderstanding: true,
      decisionMakingConfidence: false,
      scopeRecognition: false,
      documentationCompetency: false,
      escalationAwareness: false,
      childConsultationSkills: false,
    })];
    const r1 = evaluateStaffAuthorityReadiness(t1);
    expect(r1.score).toBe(6);

    // Single staff with only confidence true
    const t2 = [makeTraining({
      delegatedAuthorityUnderstanding: false,
      decisionMakingConfidence: true,
      scopeRecognition: false,
      documentationCompetency: false,
      escalationAwareness: false,
      childConsultationSkills: false,
    })];
    const r2 = evaluateStaffAuthorityReadiness(t2);
    expect(r2.score).toBe(5);

    // Single staff with only consultation true
    const t3 = [makeTraining({
      delegatedAuthorityUnderstanding: false,
      decisionMakingConfidence: false,
      scopeRecognition: false,
      documentationCompetency: false,
      escalationAwareness: false,
      childConsultationSkills: true,
    })];
    const r3 = evaluateStaffAuthorityReadiness(t3);
    expect(r3.score).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Authority Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildAuthorityProfiles", () => {
  it("returns empty array for no decisions", () => {
    const profiles = buildChildAuthorityProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("groups decisions by childId", () => {
    const decisions = [
      makeDecision({ id: "d1", childId: "child-alex", childName: "Alex" }),
      makeDecision({ id: "d2", childId: "child-jordan", childName: "Jordan" }),
      makeDecision({ id: "d3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildAuthorityProfiles(decisions);
    expect(profiles.length).toBe(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.totalDecisions).toBe(2);
  });

  it("calculates frequency score: 0 for < 5 decisions", () => {
    const decisions = [
      makeDecision({ id: "d1", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildAuthorityProfiles(decisions);
    // freq=0, rate1=3 (100%>=80), rate2=3 (100%>=80), diversity=0 (1 cat) = 6
    expect(profiles[0].authorityScore).toBe(6);
  });

  it("calculates frequency score: 1 for 5-9 decisions", () => {
    const decisions = Array.from({ length: 5 }, (_, i) =>
      makeDecision({ id: `d-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildAuthorityProfiles(decisions);
    // freq=1, rate1=3, rate2=3, diversity=0 (1 cat) = 7
    expect(profiles[0].authorityScore).toBe(7);
  });

  it("calculates frequency score: 2 for >= 10 decisions", () => {
    const decisions = Array.from({ length: 10 }, (_, i) =>
      makeDecision({ id: `d-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildAuthorityProfiles(decisions);
    // freq=2, rate1=3, rate2=3, diversity=0 (1 cat) = 8
    expect(profiles[0].authorityScore).toBe(8);
  });

  it("caps authorityScore at 10", () => {
    const categories: AuthorityCategory[] = [
      "education_decisions", "health_appointments", "social_activities",
      "overnight_stays", "haircuts_appearance", "travel_permissions",
      "religious_observance", "emergency_medical",
    ];
    // 10 decisions, all timely, all consulted, 8 categories
    const decisions = Array.from({ length: 10 }, (_, i) =>
      makeDecision({
        id: `d-${i}`,
        childId: "child-alex",
        childName: "Alex",
        category: categories[i % categories.length],
      }),
    );
    const profiles = buildChildAuthorityProfiles(decisions);
    // freq=2, rate1=3, rate2=3, diversity=2 = 10 (capped)
    expect(profiles[0].authorityScore).toBe(10);
  });

  it("calculates diversity bonus: 0 for 1 category", () => {
    const decisions = [
      makeDecision({ id: "d1", childId: "c1", childName: "A", category: "education_decisions" }),
    ];
    const profiles = buildChildAuthorityProfiles(decisions);
    expect(profiles[0].uniqueCategories).toBe(1);
  });

  it("calculates diversity bonus: 1 for 2-3 categories", () => {
    const decisions = [
      makeDecision({ id: "d1", childId: "c1", childName: "A", category: "education_decisions" }),
      makeDecision({ id: "d2", childId: "c1", childName: "A", category: "health_appointments" }),
    ];
    const profiles = buildChildAuthorityProfiles(decisions);
    expect(profiles[0].uniqueCategories).toBe(2);
    // freq=0, rate1=3, rate2=3, div=1 = 7
    expect(profiles[0].authorityScore).toBe(7);
  });

  it("calculates diversity bonus: 2 for 4+ categories", () => {
    const decisions = [
      makeDecision({ id: "d1", childId: "c1", childName: "A", category: "education_decisions" }),
      makeDecision({ id: "d2", childId: "c1", childName: "A", category: "health_appointments" }),
      makeDecision({ id: "d3", childId: "c1", childName: "A", category: "social_activities" }),
      makeDecision({ id: "d4", childId: "c1", childName: "A", category: "overnight_stays" }),
    ];
    const profiles = buildChildAuthorityProfiles(decisions);
    expect(profiles[0].uniqueCategories).toBe(4);
    // freq=0, rate1=3, rate2=3, div=2 = 8
    expect(profiles[0].authorityScore).toBe(8);
  });

  it("calculates rate1 threshold: 0 when timelyApprovalRate < 40%", () => {
    const decisions = Array.from({ length: 5 }, (_, i) =>
      makeDecision({
        id: `d-${i}`,
        childId: "c1",
        childName: "A",
        outcome: i === 0 ? "approved_timely" : "denied",
      }),
    );
    const profiles = buildChildAuthorityProfiles(decisions);
    // 1/5 = 20% timely → rate1=0
    expect(profiles[0].timelyApprovalRate).toBe(20);
  });

  it("calculates rate2 threshold: 0 when childConsultedRate < 40%", () => {
    const decisions = Array.from({ length: 5 }, (_, i) =>
      makeDecision({
        id: `d-${i}`,
        childId: "c1",
        childName: "A",
        childConsulted: i === 0,
      }),
    );
    const profiles = buildChildAuthorityProfiles(decisions);
    expect(profiles[0].childConsultedRate).toBe(20);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Generator: generateDelegatedAuthorityIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateDelegatedAuthorityIntelligence", () => {
  const categories: AuthorityCategory[] = [
    "education_decisions", "health_appointments", "social_activities",
    "overnight_stays", "haircuts_appearance", "travel_permissions",
    "religious_observance", "emergency_medical",
  ];

  function makePerfectDecisions(count: number): AuthorityDecision[] {
    return Array.from({ length: count }, (_, i) =>
      makeDecision({
        id: `d-${i}`,
        childId: i < count / 2 ? "child-alex" : "child-jordan",
        childName: i < count / 2 ? "Alex" : "Jordan",
        decisionDate: "2026-03-15",
        category: categories[i % categories.length],
      }),
    );
  }

  it("produces a complete intelligence result", () => {
    const decisions = makePerfectDecisions(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateDelegatedAuthorityIntelligence(
      decisions, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.rating).toBeDefined();
    expect(result.authorityQuality).toBeDefined();
    expect(result.authorityCompliance).toBeDefined();
    expect(result.authorityPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("achieves 100 overall score with perfect data", () => {
    const decisions = makePerfectDecisions(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateDelegatedAuthorityIntelligence(
      decisions, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 overall score with empty data and no policy", () => {
    const result = generateDelegatedAuthorityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overall score at 100", () => {
    // Even with perfect scores, should not exceed 100
    const decisions = makePerfectDecisions(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateDelegatedAuthorityIntelligence(
      decisions, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateDelegatedAuthorityIntelligence(
      [makeDecision()], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT actions when no staff training", () => {
    const result = generateDelegatedAuthorityIntelligence(
      [makeDecision()], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("staff"))).toBe(true);
  });

  it("includes strengths for high-scoring evaluators (score >= 20)", () => {
    const decisions = makePerfectDecisions(16);
    const policy = makePolicy();
    const training = [makeTraining()];

    const result = generateDelegatedAuthorityIntelligence(
      decisions, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    // With perfect data, all evaluators should score >= 20
    expect(result.strengths.some((s) => s.includes("strong"))).toBe(true);
  });

  it("includes areas for improvement for low-scoring evaluators (score < 15)", () => {
    const result = generateDelegatedAuthorityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.areasForImprovement.some((a) => a.includes("needs improvement"))).toBe(true);
  });

  it("returns exactly 7 regulatory links", () => {
    const result = generateDelegatedAuthorityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("filters decisions to period", () => {
    const decisions = [
      makeDecision({ id: "d1", decisionDate: "2025-12-01" }), // before period
      makeDecision({ id: "d2", decisionDate: "2026-03-15" }), // in period
      makeDecision({ id: "d3", decisionDate: "2026-06-01" }), // after period
    ];

    const result = generateDelegatedAuthorityIntelligence(
      decisions, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.authorityQuality.totalDecisions).toBe(1);
  });

  it("builds child profiles from period-filtered decisions", () => {
    const decisions = [
      makeDecision({ id: "d1", childId: "c1", childName: "Alex", decisionDate: "2026-03-15" }),
      makeDecision({ id: "d2", childId: "c2", childName: "Jordan", decisionDate: "2026-03-15" }),
      makeDecision({ id: "d3", childId: "c1", childName: "Alex", decisionDate: "2025-06-01" }), // outside period
    ];

    const result = generateDelegatedAuthorityIntelligence(
      decisions, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.childProfiles.length).toBe(2);
    const alex = result.childProfiles.find((p) => p.childId === "c1");
    expect(alex!.totalDecisions).toBe(1);
  });

  it("generates conditional actions when rates are below 50%", () => {
    const decisions = Array.from({ length: 5 }, (_, i) =>
      makeDecision({
        id: `d-${i}`,
        decisionDate: "2026-03-15",
        outcome: "denied",
        childConsulted: false,
        parentNotified: false,
        withinDelegatedScope: false,
        decisionDocumented: false,
        outcomeRecorded: false,
      }),
    );

    const result = generateDelegatedAuthorityIntelligence(
      decisions, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("Timely approval rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Child consultation rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Parent notification rate"))).toBe(true);
  });

  it("includes assessedAt timestamp", () => {
    const result = generateDelegatedAuthorityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.assessedAt).toBeDefined();
    expect(typeof result.assessedAt).toBe("string");
  });

  it("generates no-action message when everything is perfect", () => {
    const decisions = makePerfectDecisions(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateDelegatedAuthorityIntelligence(
      decisions, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });
});
