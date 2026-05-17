// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Children's Outcomes — Progress Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateChildProgress,
  analyzeCohort,
  analyzeDomainTrends,
  getDomainLabel,
  getAllDomains,
  ratingToLabel,
} from "../progress-engine";
import type {
  ChildProfile,
  OutcomeAssessment,
  ChildGoal,
  ProgressReview,
  OutcomeDomain,
  ProgressRating,
} from "../progress-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeOutcome(
  domain: OutcomeDomain,
  rating: ProgressRating = 4,
  trend: "improving" | "stable" | "declining" = "stable",
): OutcomeAssessment {
  return {
    domain,
    rating,
    trend,
    lastAssessedAt: "2026-05-01T10:00:00Z",
    assessedBy: "user-tl-1",
    evidence: ["Care plan review", "Keyworker session notes"],
    targets: ["Continue engagement with therapy"],
    barriers: [],
  };
}

function makeGoal(overrides: Partial<ChildGoal> = {}): ChildGoal {
  return {
    id: "goal-001",
    domain: "education",
    description: "Achieve 90% school attendance this term",
    targetDate: "2026-07-20T00:00:00Z",
    status: "active",
    milestones: [
      { description: "Attend 5 full days in first week", achieved: true, achievedAt: "2026-04-15" },
      { description: "Join after-school club", achieved: false },
    ],
    createdAt: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function makeReview(overrides: Partial<ProgressReview> = {}): ProgressReview {
  return {
    id: "review-001",
    date: "2026-05-01T10:00:00Z",
    type: "keyworker",
    overallProgress: 4,
    domainRatings: [
      { domain: "safety", rating: 4 },
      { domain: "health", rating: 3 },
      { domain: "education", rating: 4 },
      { domain: "positive_contribution", rating: 4 },
      { domain: "economic_wellbeing", rating: 3 },
      { domain: "identity", rating: 4 },
      { domain: "emotional_wellbeing", rating: 3 },
    ],
    childVoice: "I feel happy here. I like my school and my keyworker.",
    strengthsIdentified: ["School engagement", "Positive peer relationships"],
    areasForDevelopment: ["Emotional regulation", "Independence skills"],
    reviewedBy: "user-tl-1",
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ChildProfile> = {}): ChildProfile {
  return {
    childId: "child-jordan",
    childName: "Jordan Williams",
    homeId: "home-oak",
    dateOfBirth: "2010-06-15T00:00:00Z",
    placementStartDate: "2024-09-01T00:00:00Z",
    keyworkerId: "staff-001",
    keyworkerName: "Sarah Mitchell",
    currentOutcomes: [
      makeOutcome("safety", 4, "stable"),
      makeOutcome("health", 3, "improving"),
      makeOutcome("education", 4, "improving"),
      makeOutcome("positive_contribution", 4, "stable"),
      makeOutcome("economic_wellbeing", 3, "stable"),
      makeOutcome("identity", 4, "stable"),
      makeOutcome("emotional_wellbeing", 3, "improving"),
    ],
    goals: [
      makeGoal({ id: "g1", status: "achieved", achievedAt: "2026-04-20" }),
      makeGoal({ id: "g2", status: "active" }),
      makeGoal({ id: "g3", domain: "emotional_wellbeing", description: "Use calm-down strategies independently", status: "active" }),
    ],
    reviews: [
      makeReview({ id: "r1", date: "2026-05-01T10:00:00Z" }),
      makeReview({ id: "r2", date: "2026-04-03T10:00:00Z" }),
      makeReview({ id: "r3", date: "2026-03-06T10:00:00Z" }),
    ],
    riskLevel: "medium",
    legalStatus: "section_31",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluateChildProgress
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildProgress", () => {
  it("calculates overall rating as average of domain ratings", () => {
    const profile = makeProfile();
    const result = evaluateChildProgress(profile, FIXED_NOW);
    // (4+3+4+4+3+4+3) / 7 = 25/7 ≈ 3.6
    expect(result.overallRating).toBeCloseTo(3.6, 1);
  });

  it("determines overall trend from domain trends", () => {
    const profile = makeProfile(); // 3 improving, 4 stable, 0 declining
    const result = evaluateChildProgress(profile, FIXED_NOW);
    expect(result.overallTrend).toBe("improving");
  });

  it("detects declining trend when more domains declining", () => {
    const profile = makeProfile({
      currentOutcomes: [
        makeOutcome("safety", 3, "declining"),
        makeOutcome("health", 2, "declining"),
        makeOutcome("education", 3, "declining"),
        makeOutcome("positive_contribution", 3, "stable"),
        makeOutcome("economic_wellbeing", 3, "stable"),
        makeOutcome("identity", 3, "stable"),
        makeOutcome("emotional_wellbeing", 2, "declining"),
      ],
    });
    const result = evaluateChildProgress(profile, FIXED_NOW);
    expect(result.overallTrend).toBe("declining");
  });

  it("generates domain summary for all 7 domains", () => {
    const result = evaluateChildProgress(makeProfile(), FIXED_NOW);
    expect(result.domainSummary).toHaveLength(7);
    expect(result.domainSummary[0].label).toBe("Being Safe");
  });

  it("counts goals achieved and active", () => {
    const result = evaluateChildProgress(makeProfile(), FIXED_NOW);
    expect(result.goalsAchieved).toBe(1);
    expect(result.goalsActive).toBe(2);
    expect(result.goalAchievementRate).toBe(33); // 1/3
  });

  it("detects review overdue (>28 days)", () => {
    const profile = makeProfile({
      reviews: [makeReview({ date: "2026-04-01T10:00:00Z" })], // 45 days ago
    });
    const result = evaluateChildProgress(profile, FIXED_NOW);
    expect(result.reviewOverdue).toBe(true);
    expect(result.daysSinceLastReview).toBeGreaterThan(28);
  });

  it("marks review not overdue when recent", () => {
    const result = evaluateChildProgress(makeProfile(), FIXED_NOW);
    expect(result.reviewOverdue).toBe(false);
    expect(result.daysSinceLastReview).toBeLessThanOrEqual(28);
  });

  it("counts reviews in last 3 months", () => {
    const result = evaluateChildProgress(makeProfile(), FIXED_NOW);
    expect(result.reviewsInPeriod).toBe(3);
  });

  it("identifies strength areas (rating >= 4)", () => {
    const result = evaluateChildProgress(makeProfile(), FIXED_NOW);
    expect(result.strengthAreas).toContain("safety");
    expect(result.strengthAreas).toContain("education");
    expect(result.strengthAreas).not.toContain("health"); // rating 3
  });

  it("identifies concern areas (rating <= 2 or declining)", () => {
    const profile = makeProfile({
      currentOutcomes: [
        makeOutcome("safety", 4, "stable"),
        makeOutcome("health", 2, "declining"),
        makeOutcome("education", 4, "stable"),
        makeOutcome("positive_contribution", 3, "stable"),
        makeOutcome("economic_wellbeing", 3, "stable"),
        makeOutcome("identity", 3, "declining"),
        makeOutcome("emotional_wellbeing", 1, "declining"),
      ],
    });
    const result = evaluateChildProgress(profile, FIXED_NOW);
    expect(result.concernAreas).toContain("health");
    expect(result.concernAreas).toContain("identity");
    expect(result.concernAreas).toContain("emotional_wellbeing");
  });

  it("generates recommendations for overdue reviews", () => {
    const profile = makeProfile({
      reviews: [makeReview({ date: "2026-04-01T10:00:00Z" })],
    });
    const result = evaluateChildProgress(profile, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("overdue"))).toBe(true);
  });

  it("generates recommendations for low-rated domains", () => {
    const profile = makeProfile({
      currentOutcomes: [
        makeOutcome("safety", 2, "declining"),
        ...["health", "education", "positive_contribution", "economic_wellbeing", "identity", "emotional_wellbeing"].map(d =>
          makeOutcome(d as OutcomeDomain, 3, "stable"),
        ),
      ],
    });
    const result = evaluateChildProgress(profile, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("Being Safe"))).toBe(true);
  });

  it("handles child with no reviews", () => {
    const profile = makeProfile({ reviews: [] });
    const result = evaluateChildProgress(profile, FIXED_NOW);
    expect(result.lastReviewDate).toBeNull();
    expect(result.daysSinceLastReview).toBeNull();
    expect(result.reviewsInPeriod).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyzeCohort
// ══════════════════════════════════════════════════════════════════════════════

describe("analyzeCohort", () => {
  it("calculates average overall rating for cohort", () => {
    const profiles = [
      makeProfile({ childId: "c1" }),
      makeProfile({ childId: "c2" }),
    ];
    const result = analyzeCohort(profiles, "home-oak", FIXED_NOW);
    expect(result.averageOverallRating).toBeCloseTo(3.6, 1);
    expect(result.childCount).toBe(2);
  });

  it("counts improving/stable/declining children", () => {
    const profiles = [
      makeProfile({ childId: "c1" }), // improving (3 improving domains)
      makeProfile({
        childId: "c2",
        currentOutcomes: getAllDomains().map(d => makeOutcome(d, 3, "stable")),
      }),
    ];
    const result = analyzeCohort(profiles, "home-oak", FIXED_NOW);
    expect(result.childrenImproving).toBe(1);
    expect(result.childrenStable).toBe(1);
    expect(result.childrenDeclining).toBe(0);
  });

  it("identifies cohort strength domains", () => {
    const profiles = [
      makeProfile({ childId: "c1" }),
      makeProfile({ childId: "c2" }),
    ];
    const result = analyzeCohort(profiles, "home-oak", FIXED_NOW);
    // safety, education, positive_contribution, identity all rated 4
    expect(result.strengthDomains).toContain("safety");
    expect(result.strengthDomains).toContain("education");
  });

  it("calculates goal achievement rate across cohort", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        goals: [
          makeGoal({ id: "g1", status: "achieved" }),
          makeGoal({ id: "g2", status: "active" }),
        ],
      }),
      makeProfile({
        childId: "c2",
        goals: [
          makeGoal({ id: "g3", status: "achieved" }),
          makeGoal({ id: "g4", status: "achieved" }),
        ],
      }),
    ];
    const result = analyzeCohort(profiles, "home-oak", FIXED_NOW);
    expect(result.goalAchievementRate).toBe(75); // 3/4
  });

  it("calculates review compliance rate", () => {
    const profiles = [
      makeProfile({ childId: "c1" }), // compliant
      makeProfile({
        childId: "c2",
        reviews: [makeReview({ date: "2026-03-01T10:00:00Z" })], // overdue
      }),
    ];
    const result = analyzeCohort(profiles, "home-oak", FIXED_NOW);
    expect(result.reviewComplianceRate).toBe(50); // 1/2
  });

  it("rates outstanding for exceptional cohort", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        currentOutcomes: getAllDomains().map(d => makeOutcome(d, 5, "improving")),
      }),
      makeProfile({
        childId: "c2",
        currentOutcomes: getAllDomains().map(d => makeOutcome(d, 4, "improving")),
      }),
    ];
    const result = analyzeCohort(profiles, "home-oak", FIXED_NOW);
    expect(result.ofstedRating).toBe("outstanding");
  });

  it("rates requires_improvement for struggling cohort", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        currentOutcomes: getAllDomains().map(d => makeOutcome(d, 3, "stable")),
      }),
      makeProfile({
        childId: "c2",
        currentOutcomes: getAllDomains().map(d => makeOutcome(d, 2, "declining")),
      }),
    ];
    const result = analyzeCohort(profiles, "home-oak", FIXED_NOW);
    expect(["requires_improvement", "good"]).toContain(result.ofstedRating);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyzeDomainTrends
// ══════════════════════════════════════════════════════════════════════════════

describe("analyzeDomainTrends", () => {
  it("returns trend analysis for each domain", () => {
    const profile = makeProfile();
    const trends = analyzeDomainTrends(profile);
    expect(trends).toHaveLength(7);
    expect(trends[0].domain).toBe("safety");
    expect(trends[0].currentRating).toBe(4);
  });

  it("calculates change from previous review", () => {
    const profile = makeProfile({
      reviews: [
        makeReview({ id: "r1", date: "2026-05-01T10:00:00Z", domainRatings: [{ domain: "safety", rating: 4 }] }),
        makeReview({ id: "r2", date: "2026-04-01T10:00:00Z", domainRatings: [{ domain: "safety", rating: 3 }] }),
      ],
    });
    const trends = analyzeDomainTrends(profile);
    const safety = trends.find(t => t.domain === "safety");
    expect(safety?.previousRating).toBe(3);
    expect(safety?.change).toBe(1);
  });

  it("returns null previous rating when no history", () => {
    const profile = makeProfile({ reviews: [] });
    const trends = analyzeDomainTrends(profile);
    expect(trends[0].previousRating).toBeNull();
    expect(trends[0].change).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getDomainLabel returns labels for all domains", () => {
    expect(getDomainLabel("safety")).toBe("Being Safe");
    expect(getDomainLabel("health")).toBe("Being Healthy");
    expect(getDomainLabel("education")).toBe("Enjoying & Achieving");
    expect(getDomainLabel("emotional_wellbeing")).toBe("Emotional Wellbeing");
  });

  it("getAllDomains returns all 7 domains", () => {
    const domains = getAllDomains();
    expect(domains).toHaveLength(7);
    expect(domains).toContain("safety");
    expect(domains).toContain("emotional_wellbeing");
  });

  it("ratingToLabel returns correct labels", () => {
    expect(ratingToLabel(1)).toBe("Significant Concern");
    expect(ratingToLabel(3)).toBe("Expected Progress");
    expect(ratingToLabel(5)).toBe("Exceptional Progress");
  });
});
