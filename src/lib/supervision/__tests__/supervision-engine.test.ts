/* ──────────────────────────────────────────────────────────────
   Supervision Intelligence Engine — Tests
   ────────────────────────────────────────────────────────────── */

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getSupervisionTypeLabel,
  getContentCoverageLabel,
  getRatingLabel,
  evaluateSupervisionQuality,
  evaluateSupervisionCompliance,
  evaluateSupervisionPolicy,
  evaluateStaffSupervisionReadiness,
  buildStaffSupervisionProfiles,
  generateSupervisionIntelligence,
} from "../supervision-engine";
import type {
  SupervisionSession,
  SupervisionPolicy,
  StaffSupervisionTraining,
} from "../supervision-engine";

// ── Factories ────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<SupervisionSession> = {}): SupervisionSession {
  return {
    id: "sess-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    sessionDate: "2026-03-15",
    supervisionType: "formal_one_to_one",
    contentCoverage: "comprehensive",
    reflectivePracticeIncluded: true,
    safeguardingDiscussed: true,
    wellbeingChecked: true,
    actionsFromPrevious: true,
    documentedProperly: true,
    withinTimescale: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<SupervisionPolicy> = {}): SupervisionPolicy {
  return {
    id: "policy-001",
    supervisionSchedule: true,
    reflectivePracticeRequirement: true,
    safeguardingAgenda: true,
    wellbeingFramework: true,
    newStarterProtocol: true,
    documentationStandards: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffSupervisionTraining> = {}): StaffSupervisionTraining {
  return {
    id: "train-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    supervisorySkills: true,
    reflectivePractice: true,
    safeguardingKnowledge: true,
    wellbeingSupport: true,
    documentationCompetency: true,
    feedbackDelivery: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns correct percentage", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
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
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("label helpers", () => {
  it("getSupervisionTypeLabel returns correct labels", () => {
    expect(getSupervisionTypeLabel("formal_one_to_one")).toBe("Formal 1:1 Supervision");
    expect(getSupervisionTypeLabel("reflective_practice")).toBe("Reflective Practice");
    expect(getSupervisionTypeLabel("group_supervision")).toBe("Group Supervision");
    expect(getSupervisionTypeLabel("management_oversight")).toBe("Management Oversight");
    expect(getSupervisionTypeLabel("clinical_supervision")).toBe("Clinical Supervision");
    expect(getSupervisionTypeLabel("ad_hoc")).toBe("Ad-Hoc Supervision");
    expect(getSupervisionTypeLabel("probationary")).toBe("Probationary Supervision");
    expect(getSupervisionTypeLabel("annual_appraisal")).toBe("Annual Appraisal");
  });

  it("getContentCoverageLabel returns correct labels", () => {
    expect(getContentCoverageLabel("comprehensive")).toBe("Comprehensive");
    expect(getContentCoverageLabel("adequate")).toBe("Adequate");
    expect(getContentCoverageLabel("partial")).toBe("Partial");
    expect(getContentCoverageLabel("minimal")).toBe("Minimal");
    expect(getContentCoverageLabel("not_recorded")).toBe("Not Recorded");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSupervisionQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSupervisionQuality", () => {
  it("returns all zeros for empty sessions", () => {
    const result = evaluateSupervisionQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.contentRate).toBe(0);
    expect(result.reflectiveRate).toBe(0);
    expect(result.safeguardingRate).toBe(0);
    expect(result.wellbeingRate).toBe(0);
  });

  it("returns max score for all-perfect sessions", () => {
    const sessions = [makeSession(), makeSession({ id: "sess-002" })];
    const result = evaluateSupervisionQuality(sessions);
    expect(result.contentRate).toBe(100);
    expect(result.reflectiveRate).toBe(100);
    expect(result.safeguardingRate).toBe(100);
    expect(result.wellbeingRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("counts adequate as good content coverage", () => {
    const sessions = [
      makeSession({ contentCoverage: "adequate" }),
      makeSession({ id: "sess-002", contentCoverage: "partial" }),
    ];
    const result = evaluateSupervisionQuality(sessions);
    expect(result.contentRate).toBe(50);
  });

  it("does not count partial, minimal, or not_recorded as good content", () => {
    const sessions = [
      makeSession({ contentCoverage: "partial" }),
      makeSession({ id: "sess-002", contentCoverage: "minimal" }),
      makeSession({ id: "sess-003", contentCoverage: "not_recorded" }),
    ];
    const result = evaluateSupervisionQuality(sessions);
    expect(result.contentRate).toBe(0);
  });

  it("calculates correct reflective practice rate", () => {
    const sessions = [
      makeSession({ reflectivePracticeIncluded: true }),
      makeSession({ id: "sess-002", reflectivePracticeIncluded: false }),
      makeSession({ id: "sess-003", reflectivePracticeIncluded: true }),
    ];
    const result = evaluateSupervisionQuality(sessions);
    expect(result.reflectiveRate).toBe(67);
  });

  it("calculates correct safeguarding rate", () => {
    const sessions = [
      makeSession({ safeguardingDiscussed: false }),
      makeSession({ id: "sess-002", safeguardingDiscussed: false }),
      makeSession({ id: "sess-003", safeguardingDiscussed: true }),
      makeSession({ id: "sess-004", safeguardingDiscussed: true }),
    ];
    const result = evaluateSupervisionQuality(sessions);
    expect(result.safeguardingRate).toBe(50);
  });

  it("calculates correct wellbeing rate", () => {
    const sessions = [
      makeSession({ wellbeingChecked: true }),
      makeSession({ id: "sess-002", wellbeingChecked: false }),
    ];
    const result = evaluateSupervisionQuality(sessions);
    expect(result.wellbeingRate).toBe(50);
  });

  it("weights correctly add up to 25 at maximum", () => {
    const sessions = [makeSession()];
    const result = evaluateSupervisionQuality(sessions);
    // 7 + 6 + 6 + 6 = 25
    expect(result.contentWeight).toBe(7);
    expect(result.reflectiveWeight).toBe(6);
    expect(result.safeguardingWeight).toBe(6);
    expect(result.wellbeingWeight).toBe(6);
    expect(result.overallScore).toBe(25);
  });

  it("applies partial weights for mixed sessions", () => {
    const sessions = [
      makeSession(),
      makeSession({
        id: "sess-002",
        contentCoverage: "partial",
        reflectivePracticeIncluded: false,
        safeguardingDiscussed: false,
        wellbeingChecked: false,
      }),
    ];
    const result = evaluateSupervisionQuality(sessions);
    expect(result.contentRate).toBe(50);
    expect(result.reflectiveRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSupervisionCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSupervisionCompliance", () => {
  it("returns all zeros for empty sessions", () => {
    const result = evaluateSupervisionCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.withinTimescaleRate).toBe(0);
    expect(result.actionsReviewedRate).toBe(0);
    expect(result.typeDiversityRatio).toBe(0);
  });

  it("returns max documented/timescale/actions scores for perfect sessions", () => {
    const sessions = [makeSession()];
    const result = evaluateSupervisionCompliance(sessions);
    expect(result.documentedRate).toBe(100);
    expect(result.withinTimescaleRate).toBe(100);
    expect(result.actionsReviewedRate).toBe(100);
  });

  it("calculates correct documented rate", () => {
    const sessions = [
      makeSession({ documentedProperly: true }),
      makeSession({ id: "sess-002", documentedProperly: false }),
      makeSession({ id: "sess-003", documentedProperly: true }),
    ];
    const result = evaluateSupervisionCompliance(sessions);
    expect(result.documentedRate).toBe(67);
  });

  it("calculates correct within-timescale rate", () => {
    const sessions = [
      makeSession({ withinTimescale: true }),
      makeSession({ id: "sess-002", withinTimescale: false }),
    ];
    const result = evaluateSupervisionCompliance(sessions);
    expect(result.withinTimescaleRate).toBe(50);
  });

  it("calculates correct actions reviewed rate", () => {
    const sessions = [
      makeSession({ actionsFromPrevious: false }),
      makeSession({ id: "sess-002", actionsFromPrevious: false }),
      makeSession({ id: "sess-003", actionsFromPrevious: true }),
    ];
    const result = evaluateSupervisionCompliance(sessions);
    expect(result.actionsReviewedRate).toBe(33);
  });

  it("calculates type diversity ratio from unique types", () => {
    const sessions = [
      makeSession({ supervisionType: "formal_one_to_one" }),
      makeSession({ id: "sess-002", supervisionType: "reflective_practice" }),
      makeSession({ id: "sess-003", supervisionType: "group_supervision" }),
      makeSession({ id: "sess-004", supervisionType: "clinical_supervision" }),
    ];
    const result = evaluateSupervisionCompliance(sessions);
    // 4 unique / 8 total types = 0.5
    expect(result.typeDiversityRatio).toBe(0.5);
  });

  it("diversity is 1.0 when all 8 types present", () => {
    const types = [
      "formal_one_to_one", "reflective_practice", "group_supervision",
      "management_oversight", "clinical_supervision", "ad_hoc",
      "probationary", "annual_appraisal",
    ] as const;
    const sessions = types.map((t, i) =>
      makeSession({ id: `sess-${i}`, supervisionType: t }),
    );
    const result = evaluateSupervisionCompliance(sessions);
    expect(result.typeDiversityRatio).toBe(1);
  });

  it("weights correctly for fully compliant single-type sessions", () => {
    const sessions = [makeSession()];
    const result = evaluateSupervisionCompliance(sessions);
    // documented 8 + timescale 7 + actions 5 + diversity (1/8 * 5 = 0.625 -> 0.6) = 20.6
    expect(result.documentedWeight).toBe(8);
    expect(result.withinTimescaleWeight).toBe(7);
    expect(result.actionsReviewedWeight).toBe(5);
    expect(result.overallScore).toBeGreaterThan(20);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSupervisionPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSupervisionPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateSupervisionPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.supervisionSchedule).toBe(false);
  });

  it("returns 25 for fully implemented policy", () => {
    const result = evaluateSupervisionPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("scores 4 for supervisionSchedule alone", () => {
    const policy = makePolicy({
      supervisionSchedule: true,
      reflectivePracticeRequirement: false,
      safeguardingAgenda: false,
      wellbeingFramework: false,
      newStarterProtocol: false,
      documentationStandards: false,
      regularReview: false,
    });
    const result = evaluateSupervisionPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores 4 for reflectivePracticeRequirement alone", () => {
    const policy = makePolicy({
      supervisionSchedule: false,
      reflectivePracticeRequirement: true,
      safeguardingAgenda: false,
      wellbeingFramework: false,
      newStarterProtocol: false,
      documentationStandards: false,
      regularReview: false,
    });
    const result = evaluateSupervisionPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores 4 for safeguardingAgenda alone", () => {
    const policy = makePolicy({
      supervisionSchedule: false,
      reflectivePracticeRequirement: false,
      safeguardingAgenda: true,
      wellbeingFramework: false,
      newStarterProtocol: false,
      documentationStandards: false,
      regularReview: false,
    });
    const result = evaluateSupervisionPolicy(policy);
    expect(result.overallScore).toBe(4);
  });

  it("scores 3 for newStarterProtocol alone", () => {
    const policy = makePolicy({
      supervisionSchedule: false,
      reflectivePracticeRequirement: false,
      safeguardingAgenda: false,
      wellbeingFramework: false,
      newStarterProtocol: true,
      documentationStandards: false,
      regularReview: false,
    });
    const result = evaluateSupervisionPolicy(policy);
    expect(result.overallScore).toBe(3);
  });

  it("adds up partial booleans correctly", () => {
    const policy = makePolicy({
      supervisionSchedule: true,    // 4
      reflectivePracticeRequirement: true, // 4
      safeguardingAgenda: false,    // 0
      wellbeingFramework: false,    // 0
      newStarterProtocol: true,     // 3
      documentationStandards: false, // 0
      regularReview: false,         // 0
    });
    const result = evaluateSupervisionPolicy(policy);
    expect(result.overallScore).toBe(11);
  });

  it("reflects boolean values in result", () => {
    const policy = makePolicy({ regularReview: false });
    const result = evaluateSupervisionPolicy(policy);
    expect(result.regularReview).toBe(false);
    expect(result.supervisionSchedule).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffSupervisionReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffSupervisionReadiness", () => {
  it("returns 0 for empty training array", () => {
    const result = evaluateStaffSupervisionReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.supervisorySkillsRate).toBe(0);
  });

  it("returns 25 for fully trained staff", () => {
    const training = [makeTraining(), makeTraining({ id: "train-002", staffId: "staff-tom" })];
    const result = evaluateStaffSupervisionReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.supervisorySkillsRate).toBe(100);
    expect(result.reflectivePracticeRate).toBe(100);
    expect(result.safeguardingKnowledgeRate).toBe(100);
  });

  it("calculates correct rates for mixed training", () => {
    const training = [
      makeTraining({ supervisorySkills: true, reflectivePractice: false }),
      makeTraining({ id: "train-002", staffId: "staff-tom", supervisorySkills: false, reflectivePractice: true }),
    ];
    const result = evaluateStaffSupervisionReadiness(training);
    expect(result.supervisorySkillsRate).toBe(50);
    expect(result.reflectivePracticeRate).toBe(50);
  });

  it("applies weight 6 for supervisory skills", () => {
    const training = [
      makeTraining({
        supervisorySkills: true,
        reflectivePractice: false,
        safeguardingKnowledge: false,
        wellbeingSupport: false,
        documentationCompetency: false,
        feedbackDelivery: false,
      }),
    ];
    const result = evaluateStaffSupervisionReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("applies weight 5 for reflective practice", () => {
    const training = [
      makeTraining({
        supervisorySkills: false,
        reflectivePractice: true,
        safeguardingKnowledge: false,
        wellbeingSupport: false,
        documentationCompetency: false,
        feedbackDelivery: false,
      }),
    ];
    const result = evaluateStaffSupervisionReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("applies weight 2 for feedback delivery", () => {
    const training = [
      makeTraining({
        supervisorySkills: false,
        reflectivePractice: false,
        safeguardingKnowledge: false,
        wellbeingSupport: false,
        documentationCompetency: false,
        feedbackDelivery: true,
      }),
    ];
    const result = evaluateStaffSupervisionReadiness(training);
    expect(result.overallScore).toBe(2);
  });

  it("handles single staff with partial training", () => {
    const training = [
      makeTraining({
        supervisorySkills: true,   // 6
        reflectivePractice: true,  // 5
        safeguardingKnowledge: true, // 5
        wellbeingSupport: false,   // 0
        documentationCompetency: false, // 0
        feedbackDelivery: false,   // 0
      }),
    ];
    const result = evaluateStaffSupervisionReadiness(training);
    expect(result.overallScore).toBe(16);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildStaffSupervisionProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildStaffSupervisionProfiles", () => {
  it("returns empty array for no sessions", () => {
    const profiles = buildStaffSupervisionProfiles([]);
    expect(profiles).toHaveLength(0);
  });

  it("groups sessions by staffId", () => {
    const sessions = [
      makeSession({ staffId: "staff-sarah" }),
      makeSession({ id: "sess-002", staffId: "staff-sarah" }),
      makeSession({ id: "sess-003", staffId: "staff-tom", staffName: "Tom Richards" }),
    ];
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles).toHaveLength(2);
  });

  it("sets correct session count per staff", () => {
    const sessions = Array.from({ length: 6 }, (_, i) =>
      makeSession({ id: `sess-${i}`, staffId: "staff-sarah" }),
    );
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].sessionCount).toBe(6);
  });

  it("frequency score: 0 for < 5 sessions", () => {
    const sessions = [
      makeSession(),
      makeSession({ id: "sess-002" }),
    ];
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].frequencyScore).toBe(0);
  });

  it("frequency score: 1 for >= 5 sessions", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `sess-${i}` }),
    );
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].frequencyScore).toBe(1);
  });

  it("frequency score: 2 for >= 10 sessions", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `sess-${i}` }),
    );
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].frequencyScore).toBe(2);
  });

  it("content score: 3 for contentRate >= 80", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `sess-${i}`, contentCoverage: i < 4 ? "comprehensive" : "partial" }),
    );
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].contentScore).toBe(3);
  });

  it("content score: 2 for contentRate >= 60 and < 80", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `sess-${i}`, contentCoverage: i < 3 ? "comprehensive" : "partial" }),
    );
    const profiles = buildStaffSupervisionProfiles(sessions);
    // 3/5 = 60%
    expect(profiles[0].contentScore).toBe(2);
  });

  it("content score: 1 for contentRate >= 40 and < 60", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `sess-${i}`, contentCoverage: i < 2 ? "comprehensive" : "partial" }),
    );
    const profiles = buildStaffSupervisionProfiles(sessions);
    // 2/5 = 40%
    expect(profiles[0].contentScore).toBe(1);
  });

  it("content score: 0 for contentRate < 40", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `sess-${i}`, contentCoverage: i < 1 ? "comprehensive" : "minimal" }),
    );
    const profiles = buildStaffSupervisionProfiles(sessions);
    // 1/5 = 20%
    expect(profiles[0].contentScore).toBe(0);
  });

  it("reflective score: 3 for reflectiveRate >= 80", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `sess-${i}`, reflectivePracticeIncluded: i < 4 }),
    );
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].reflectiveScore).toBe(3);
  });

  it("diversity score: 0 for single type", () => {
    const sessions = [makeSession()];
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].diversityScore).toBe(0);
  });

  it("diversity score: 1 for 2-3 unique types", () => {
    const sessions = [
      makeSession({ supervisionType: "formal_one_to_one" }),
      makeSession({ id: "sess-002", supervisionType: "reflective_practice" }),
    ];
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].diversityScore).toBe(1);
  });

  it("diversity score: 2 for >= 4 unique types", () => {
    const sessions = [
      makeSession({ supervisionType: "formal_one_to_one" }),
      makeSession({ id: "sess-002", supervisionType: "reflective_practice" }),
      makeSession({ id: "sess-003", supervisionType: "group_supervision" }),
      makeSession({ id: "sess-004", supervisionType: "clinical_supervision" }),
    ];
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].diversityScore).toBe(2);
  });

  it("caps overall score at 10", () => {
    // 10+ sessions (freq=2) + 100% content (content=3) + 100% reflective (reflective=3) + 4+ types (diversity=2) = 10
    const types = [
      "formal_one_to_one", "reflective_practice", "group_supervision",
      "management_oversight", "clinical_supervision",
    ] as const;
    const sessions = Array.from({ length: 12 }, (_, i) =>
      makeSession({ id: `sess-${i}`, supervisionType: types[i % types.length] }),
    );
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("uses staffName from first session for each staff", () => {
    const sessions = [
      makeSession({ staffId: "staff-tom", staffName: "Tom Richards" }),
      makeSession({ id: "sess-002", staffId: "staff-tom", staffName: "Thomas Richards" }),
    ];
    const profiles = buildStaffSupervisionProfiles(sessions);
    expect(profiles[0].staffName).toBe("Tom Richards");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateSupervisionIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateSupervisionIntelligence", () => {
  const baseSessions = [
    makeSession(),
    makeSession({ id: "sess-002", staffId: "staff-tom", staffName: "Tom Richards" }),
  ];
  const basePolicy = makePolicy();
  const baseTraining = [
    makeTraining(),
    makeTraining({ id: "train-002", staffId: "staff-tom", staffName: "Tom Richards" }),
  ];

  it("returns correct homeId, periodStart, periodEnd", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
  });

  it("sums evaluator scores and caps at 100", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("assigns rating based on overall score", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all four evaluator results", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.supervisionQuality).toBeDefined();
    expect(result.supervisionCompliance).toBeDefined();
    expect(result.supervisionPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
  });

  it("builds staff profiles", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.staffProfiles.length).toBe(2);
  });

  it("generates strengths for high-scoring evaluators (>= 20)", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    // All evaluators should score high with perfect data
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low-scoring evaluators (< 15)", () => {
    const poorSessions = [
      makeSession({
        contentCoverage: "minimal",
        reflectivePracticeIncluded: false,
        safeguardingDiscussed: false,
        wellbeingChecked: false,
        documentedProperly: false,
        withinTimescale: false,
        actionsFromPrevious: false,
      }),
    ];
    const result = generateSupervisionIntelligence(
      poorSessions, makePolicy({ supervisionSchedule: false, reflectivePracticeRequirement: false, safeguardingAgenda: false, wellbeingFramework: false, newStarterProtocol: false, documentationStandards: false, regularReview: false }),
      [],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("adds URGENT action when policy score is 0", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, null, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("adds URGENT action when staff training score is 0", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, [],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });

  it("adds conditional actions when rates < 50", () => {
    const poorSessions = [
      makeSession({
        contentCoverage: "minimal",
        reflectivePracticeIncluded: false,
        safeguardingDiscussed: false,
        wellbeingChecked: false,
      }),
    ];
    const result = generateSupervisionIntelligence(
      poorSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("Content coverage"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Reflective practice"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Safeguarding"))).toBe(true);
    expect(result.actions.some((a) => a.includes("wellbeing"))).toBe(true);
  });

  it("includes exactly 7 regulatory links", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Reg 33 in regulatory links", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 33"))).toBe(true);
  });

  it("includes Skills for Care in regulatory links", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Skills for Care"))).toBe(true);
  });

  it("includes Ofsted SCCIF in regulatory links", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Ofsted SCCIF"))).toBe(true);
  });

  it("handles empty sessions with non-null policy and training", () => {
    const result = generateSupervisionIntelligence(
      [], basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.supervisionQuality.overallScore).toBe(0);
    expect(result.supervisionCompliance.overallScore).toBe(0);
    expect(result.supervisionPolicy.overallScore).toBe(25);
    expect(result.staffReadiness.overallScore).toBe(25);
    expect(result.staffProfiles).toHaveLength(0);
  });

  it("handles all empty inputs", () => {
    const result = generateSupervisionIntelligence(
      [], null, [],
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.strengths).toHaveLength(0);
  });

  it("does not generate documentation action when documented rate >= 50", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("Documentation rate"))).toBe(false);
  });

  it("does not generate timescale action when within-timescale rate >= 50", () => {
    const result = generateSupervisionIntelligence(
      baseSessions, basePolicy, baseTraining,
      "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.actions.some((a) => a.includes("timescales"))).toBe(false);
  });
});
