// ══════════════════════════════════════════════════════════════════════════════
// Independence & Life Skills Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateChildIndependence,
  calculateHomeIndependenceMetrics,
  getDomainLabel,
  getLevelLabel,
} from "../independence-engine";
import type {
  ChildIndependenceProfile,
  SkillAssessment,
  IndependenceMilestone,
  IndependenceActivity,
  DocumentStatus,
} from "../independence-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeAssessment(overrides: Partial<SkillAssessment> = {}): SkillAssessment {
  return {
    domain: "daily_living",
    level: 3,
    assessedAt: "2026-04-01T10:00:00Z",
    assessedBy: "staff-sw-01",
    targets: ["Make bed daily", "Do own laundry"],
    evidence: ["Observed making bed", "Completed laundry cycle independently"],
    childSelfRating: 4,
    nextReviewDate: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

function makeMilestone(overrides: Partial<IndependenceMilestone> = {}): IndependenceMilestone {
  return {
    id: "ms-001",
    domain: "daily_living",
    description: "Cook a simple meal independently",
    targetDate: "2026-06-01T00:00:00Z",
    status: "active",
    supportNeeded: "Staff supervision in kitchen",
    ...overrides,
  };
}

function makeActivity(overrides: Partial<IndependenceActivity> = {}): IndependenceActivity {
  return {
    id: "act-001",
    domain: "cooking_nutrition",
    description: "Cooked pasta dish with support",
    date: "2026-05-10T17:00:00Z",
    duration: 45,
    childEngaged: true,
    outcomeNotes: "Followed recipe, needed help with oven only",
    facilitatedBy: "staff-sw-01",
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ChildIndependenceProfile> = {}): ChildIndependenceProfile {
  return {
    childId: "child-001",
    childName: "Jordan Williams",
    homeId: "home-oak",
    dateOfBirth: "2010-08-15T00:00:00Z", // 15 years old
    placementStartDate: "2024-01-01T00:00:00Z",
    hasPathwayPlan: false,
    personalAdvisorAssigned: false,
    skillAssessments: [
      makeAssessment({ domain: "daily_living", level: 3 }),
      makeAssessment({ domain: "cooking_nutrition", level: 2 }),
      makeAssessment({ domain: "money_management", level: 2 }),
      makeAssessment({ domain: "health_self_care", level: 3 }),
      makeAssessment({ domain: "relationships_social", level: 4 }),
      makeAssessment({ domain: "digital_skills", level: 4 }),
    ],
    milestones: [
      makeMilestone({ id: "ms-1", status: "achieved", achievedDate: "2026-03-01T00:00:00Z" }),
      makeMilestone({ id: "ms-2", status: "active" }),
      makeMilestone({ id: "ms-3", status: "active" }),
    ],
    activities: [
      makeActivity({ date: "2026-05-10T17:00:00Z" }),
      makeActivity({ id: "act-002", date: "2026-05-05T10:00:00Z" }),
    ],
    documents: [
      { type: "birth_certificate", obtained: true, obtainedDate: "2024-02-01T00:00:00Z" },
      { type: "ni_number", obtained: false },
      { type: "bank_account", obtained: false },
      { type: "passport", obtained: true, obtainedDate: "2024-06-01T00:00:00Z", expiryDate: "2034-06-01T00:00:00Z" },
    ],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Individual Evaluation Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildIndependence", () => {
  it("calculates overall readiness score", () => {
    const result = evaluateChildIndependence(makeProfile(), NOW);
    expect(result.overallReadiness).toBeGreaterThan(0);
    expect(result.overallReadiness).toBeLessThanOrEqual(100);
  });

  it("returns correct age", () => {
    const result = evaluateChildIndependence(makeProfile(), NOW);
    expect(result.ageYears).toBe(15);
  });

  it("calculates domain scores correctly", () => {
    const result = evaluateChildIndependence(makeProfile(), NOW);
    expect(result.domainScores.length).toBe(6);
    const dailyLiving = result.domainScores.find(d => d.domain === "daily_living");
    expect(dailyLiving?.level).toBe(3);
    expect(dailyLiving?.label).toBe("Daily Living");
  });

  it("does not require pathway plan for under 16", () => {
    const profile = makeProfile({ dateOfBirth: "2010-08-15T00:00:00Z" }); // 15
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.pathwayPlanStatus).toBe("not_required");
    expect(result.pathwayPlanCompliant).toBe(true);
  });

  it("flags missing pathway plan for 16+", () => {
    const profile = makeProfile({
      dateOfBirth: "2009-01-01T00:00:00Z", // 17
      hasPathwayPlan: false,
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.pathwayPlanStatus).toBe("overdue");
    expect(result.pathwayPlanCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Pathway Plan required"))).toBe(true);
  });

  it("passes pathway plan when current", () => {
    const profile = makeProfile({
      dateOfBirth: "2009-01-01T00:00:00Z", // 17
      hasPathwayPlan: true,
      pathwayPlanDate: "2026-03-01T00:00:00Z",
      pathwayPlanReviewDate: "2026-09-01T00:00:00Z", // future
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.pathwayPlanStatus).toBe("current");
    expect(result.pathwayPlanCompliant).toBe(true);
  });

  it("flags overdue pathway plan review", () => {
    const profile = makeProfile({
      dateOfBirth: "2009-01-01T00:00:00Z",
      hasPathwayPlan: true,
      pathwayPlanDate: "2025-06-01T00:00:00Z",
      pathwayPlanReviewDate: "2026-01-01T00:00:00Z", // past
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.pathwayPlanStatus).toBe("overdue");
    expect(result.pathwayPlanCompliant).toBe(false);
  });

  it("calculates milestone achievement rate", () => {
    const profile = makeProfile({
      milestones: [
        makeMilestone({ id: "m1", status: "achieved" }),
        makeMilestone({ id: "m2", status: "achieved" }),
        makeMilestone({ id: "m3", status: "active" }),
        makeMilestone({ id: "m4", status: "not_achieved" }),
      ],
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.milestonesAchieved).toBe(2);
    expect(result.milestoneAchievementRate).toBe(50);
  });

  it("counts activities in last 30 days", () => {
    const profile = makeProfile({
      activities: [
        makeActivity({ date: "2026-05-10T10:00:00Z" }),
        makeActivity({ id: "a2", date: "2026-05-01T10:00:00Z" }),
        makeActivity({ id: "a3", date: "2026-03-01T10:00:00Z" }), // > 30d ago
      ],
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.activitiesLast30Days).toBe(2);
  });

  it("calculates document readiness", () => {
    const profile = makeProfile({
      documents: [
        { type: "passport", obtained: true },
        { type: "birth_certificate", obtained: true },
        { type: "ni_number", obtained: false },
        { type: "bank_account", obtained: true },
      ],
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.documentReadiness).toBe(75); // 3 of 4 required
  });

  it("flags low document readiness for 16+", () => {
    const profile = makeProfile({
      dateOfBirth: "2009-01-01T00:00:00Z",
      hasPathwayPlan: true,
      pathwayPlanReviewDate: "2026-09-01T00:00:00Z",
      documents: [
        { type: "passport", obtained: false },
        { type: "birth_certificate", obtained: true },
        { type: "ni_number", obtained: false },
        { type: "bank_account", obtained: false },
      ],
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.issues.some(i => i.includes("Key documents"))).toBe(true);
  });

  it("flags missing personal advisor for 16+", () => {
    const profile = makeProfile({
      dateOfBirth: "2009-01-01T00:00:00Z",
      hasPathwayPlan: true,
      pathwayPlanReviewDate: "2026-09-01T00:00:00Z",
      personalAdvisorAssigned: false,
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.issues.some(i => i.includes("Personal Advisor"))).toBe(true);
  });

  it("assesses readiness for age", () => {
    // 15-year-old with high skills (4 average) — ahead
    const profile = makeProfile({
      skillAssessments: [
        makeAssessment({ domain: "daily_living", level: 4 }),
        makeAssessment({ domain: "cooking_nutrition", level: 4 }),
        makeAssessment({ domain: "money_management", level: 4 }),
        makeAssessment({ domain: "health_self_care", level: 4 }),
      ],
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.readinessForAge).toBe("ahead");
  });

  it("flags child significantly behind age expectations", () => {
    // 15-year-old expected 3.0 average, but scoring 1.5
    const profile = makeProfile({
      skillAssessments: [
        makeAssessment({ domain: "daily_living", level: 1 }),
        makeAssessment({ domain: "cooking_nutrition", level: 2 }),
        makeAssessment({ domain: "money_management", level: 1 }),
        makeAssessment({ domain: "health_self_care", level: 2 }),
      ],
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.readinessForAge).toBe("significantly_behind");
    expect(result.issues.some(i => i.includes("significantly below"))).toBe(true);
  });

  it("calculates months until leaving", () => {
    const profile = makeProfile({
      expectedLeavingDate: "2026-11-17T00:00:00Z", // 6 months from NOW
    });
    const result = evaluateChildIndependence(profile, NOW);
    expect(result.monthsUntilLeaving).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeIndependenceMetrics", () => {
  it("calculates basic metrics", () => {
    const profiles = [makeProfile(), makeProfile({ childId: "child-002", childName: "Aisha" })];
    const result = calculateHomeIndependenceMetrics(profiles, "home-oak", NOW);
    expect(result.childCount).toBe(2);
    expect(result.averageReadiness).toBeGreaterThan(0);
  });

  it("calculates pathway plan compliance", () => {
    const profiles = [
      makeProfile({ childId: "c1", dateOfBirth: "2009-01-01T00:00:00Z", hasPathwayPlan: true, pathwayPlanReviewDate: "2026-09-01T00:00:00Z" }),
      makeProfile({ childId: "c2", dateOfBirth: "2009-06-01T00:00:00Z", hasPathwayPlan: false }),
    ];
    const result = calculateHomeIndependenceMetrics(profiles, "home-oak", NOW);
    expect(result.childrenRequiringPathwayPlan).toBe(2);
    expect(result.pathwayPlanComplianceRate).toBe(50);
  });

  it("calculates activities per child per month", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        activities: [
          makeActivity({ date: "2026-05-10T10:00:00Z" }),
          makeActivity({ id: "a2", date: "2026-05-05T10:00:00Z" }),
        ],
      }),
      makeProfile({
        childId: "c2",
        activities: [makeActivity({ id: "a3", date: "2026-05-08T10:00:00Z" })],
      }),
    ];
    const result = calculateHomeIndependenceMetrics(profiles, "home-oak", NOW);
    expect(result.activitiesPerChildPerMonth).toBe(1.5); // 3 activities / 2 children
  });

  it("identifies weakest domains", () => {
    const profiles = [
      makeProfile({
        skillAssessments: [
          makeAssessment({ domain: "money_management", level: 1 }),
          makeAssessment({ domain: "daily_living", level: 4 }),
          makeAssessment({ domain: "cooking_nutrition", level: 2 }),
        ],
      }),
    ];
    const result = calculateHomeIndependenceMetrics(profiles, "home-oak", NOW);
    expect(result.weakestDomains).toContain("money_management");
  });

  it("identifies children behind", () => {
    const profiles = [
      makeProfile({
        childId: "c1",
        childName: "Low Skills Child",
        dateOfBirth: "2009-01-01T00:00:00Z", // 17 — expected 4.0
        skillAssessments: [
          makeAssessment({ domain: "daily_living", level: 2 }),
          makeAssessment({ domain: "cooking_nutrition", level: 1 }),
        ],
      }),
    ];
    const result = calculateHomeIndependenceMetrics(profiles, "home-oak", NOW);
    expect(result.behindChildren.length).toBe(1);
    expect(result.behindChildren[0].childName).toBe("Low Skills Child");
  });

  it("filters by homeId", () => {
    const profiles = [
      makeProfile({ childId: "c1", homeId: "home-oak" }),
      makeProfile({ childId: "c2", homeId: "home-other" }),
    ];
    const result = calculateHomeIndependenceMetrics(profiles, "home-oak", NOW);
    expect(result.childCount).toBe(1);
  });

  it("returns empty metrics for no profiles", () => {
    const result = calculateHomeIndependenceMetrics([], "home-oak", NOW);
    expect(result.childCount).toBe(0);
    expect(result.averageReadiness).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Helper functions", () => {
  it("getDomainLabel returns readable labels", () => {
    expect(getDomainLabel("daily_living")).toBe("Daily Living");
    expect(getDomainLabel("money_management")).toBe("Money Management");
    expect(getDomainLabel("housing_tenancy")).toBe("Housing & Tenancy");
  });

  it("getLevelLabel returns readable labels", () => {
    expect(getLevelLabel(1)).toBe("Not Started");
    expect(getLevelLabel(3)).toBe("Practising");
    expect(getLevelLabel(5)).toBe("Fully Independent");
  });
});
