// ══════════════════════════════════════════════════════════════════════════════
// Activities & Enrichment Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateChildActivitiesCompliance,
  calculateHomeActivitiesMetrics,
  getActivityCategoryLabel,
  getBarrierLabel,
} from "../activities-engine";
import type {
  ChildActivitiesProfile,
  ActivityRecord,
  ActivityPlan,
} from "../activities-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeActivity(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return {
    id: "act-001",
    childId: "child-alex",
    name: "Football (Oakville FC U14)",
    category: "sport_team",
    participationLevel: "regular",
    startDate: "2025-09-01T10:00:00Z",
    frequency: "Twice weekly",
    venue: "Oakville Sports Centre",
    communityBased: true,
    cost: 25,
    fundedBy: "Home budget",
    childChosenActivity: true,
    sustainedFromPreviousPlacement: false,
    ...overrides,
  };
}

function makePlan(overrides: Partial<ActivityPlan> = {}): ActivityPlan {
  return {
    childId: "child-alex",
    lastReviewDate: "2026-04-01T10:00:00Z",
    nextReviewDate: "2026-07-01T10:00:00Z",
    interestsExplored: ["photography", "cooking", "skateboarding"],
    newExperiencesOffered: ["rock climbing taster", "photography workshop"],
    monthlyBudget: 100,
    monthlySpend: 85,
    preferredActivities: ["Football", "Gaming club"],
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ChildActivitiesProfile> = {}): ChildActivitiesProfile {
  return {
    childId: "child-alex",
    childName: "Alex",
    homeId: "home-oak",
    age: 14,
    activities: [
      makeActivity({ id: "act-001", category: "sport_team", name: "Football (Oakville FC U14)" }),
      makeActivity({ id: "act-002", category: "creative_arts", name: "Guitar Lessons", communityBased: true, cost: 30 }),
      makeActivity({ id: "act-003", category: "social_community", name: "Youth Club", communityBased: true, cost: 0 }),
      makeActivity({ id: "act-004", category: "hobbies_interests", name: "Gaming Club (home)", communityBased: false, cost: 0, childChosenActivity: true }),
    ],
    plan: makePlan(),
    activitiesCancelledAsPunishment: 0,
    barriersIdentified: ["transport"],
    barriersResolved: ["transport"],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildActivitiesCompliance", () => {
  it("marks compliant child with good activities", () => {
    const result = evaluateChildActivitiesCompliance(makeProfile(), NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.totalActiveActivities).toBe(4);
    expect(result.communityBasedCount).toBe(3);
    expect(result.diversityScore).toBeGreaterThan(0);
  });

  it("flags child with too few activities", () => {
    const profile = makeProfile({
      activities: [
        makeActivity({ id: "act-001", participationLevel: "dropped_out" }),
      ],
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("minimum"))).toBe(true);
  });

  it("warns about low community rate", () => {
    const profile = makeProfile({
      activities: [
        makeActivity({ id: "act-001", communityBased: false }),
        makeActivity({ id: "act-002", communityBased: false }),
        makeActivity({ id: "act-003", communityBased: false }),
      ],
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.communityRate).toBe(0);
    expect(result.warnings.some(w => w.includes("community"))).toBe(true);
  });

  it("warns about limited diversity", () => {
    const profile = makeProfile({
      activities: [
        makeActivity({ id: "act-001", category: "sport_team" }),
        makeActivity({ id: "act-002", category: "sport_team" }),
        makeActivity({ id: "act-003", category: "sport_team" }),
      ],
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.categoriesRepresented).toBe(1);
    expect(result.warnings.some(w => w.includes("diversity"))).toBe(true);
  });

  it("warns about low child choice", () => {
    const profile = makeProfile({
      activities: [
        makeActivity({ id: "act-001", childChosenActivity: false }),
        makeActivity({ id: "act-002", childChosenActivity: false }),
        makeActivity({ id: "act-003", childChosenActivity: false }),
        makeActivity({ id: "act-004", childChosenActivity: true }),
      ],
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.childChosenRate).toBe(25);
    expect(result.warnings.some(w => w.includes("child choice"))).toBe(true);
  });

  it("warns about no new experiences", () => {
    const profile = makeProfile({
      plan: makePlan({ newExperiencesOffered: [] }),
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.newExperiencesThisQuarter).toBe(0);
    expect(result.warnings.some(w => w.includes("new experiences"))).toBe(true);
  });

  it("warns about multiple drop-outs", () => {
    const profile = makeProfile({
      activities: [
        makeActivity({ id: "act-001" }),
        makeActivity({ id: "act-002" }),
        makeActivity({ id: "act-d1", participationLevel: "dropped_out", endDate: "2026-03-01" }),
        makeActivity({ id: "act-d2", participationLevel: "dropped_out", endDate: "2026-02-01" }),
        makeActivity({ id: "act-d3", participationLevel: "dropped_out", endDate: "2026-01-01" }),
      ],
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.droppedOutCount).toBe(3);
    expect(result.warnings.some(w => w.includes("dropped"))).toBe(true);
  });

  it("warns about low budget utilisation", () => {
    const profile = makeProfile({
      plan: makePlan({ monthlyBudget: 150, monthlySpend: 40 }),
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.budgetUtilisation).toBeLessThan(50);
    expect(result.warnings.some(w => w.includes("budget utilisation"))).toBe(true);
  });

  it("warns about unresolved barriers", () => {
    const profile = makeProfile({
      barriersIdentified: ["transport", "confidence", "financial"],
      barriersResolved: ["transport"],
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.unresolvedBarriers).toBe(2);
    expect(result.warnings.some(w => w.includes("barrier"))).toBe(true);
  });

  it("flags overdue plan review", () => {
    const profile = makeProfile({
      plan: makePlan({ nextReviewDate: "2026-04-01T10:00:00Z" }),
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.planReviewCurrent).toBe(false);
    expect(result.issues.some(i => i.includes("review overdue"))).toBe(true);
  });

  it("flags activities cancelled as punishment", () => {
    const profile = makeProfile({ activitiesCancelledAsPunishment: 2 });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("punishment"))).toBe(true);
  });

  it("counts achievements correctly", () => {
    const profile = makeProfile({
      activities: [
        makeActivity({ id: "act-001", achievements: ["County Cup Winner", "Player of Month"] }),
        makeActivity({ id: "act-002", achievements: ["Grade 3 Guitar"] }),
        makeActivity({ id: "act-003" }),
      ],
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.achievementsCount).toBe(3);
  });

  it("counts sustained activities from previous placement", () => {
    const profile = makeProfile({
      activities: [
        makeActivity({ id: "act-001", sustainedFromPreviousPlacement: true }),
        makeActivity({ id: "act-002", sustainedFromPreviousPlacement: true }),
        makeActivity({ id: "act-003", sustainedFromPreviousPlacement: false }),
      ],
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.sustainedFromPrevious).toBe(2);
  });

  it("calculates community rate correctly", () => {
    const profile = makeProfile({
      activities: [
        makeActivity({ id: "act-001", communityBased: true }),
        makeActivity({ id: "act-002", communityBased: true }),
        makeActivity({ id: "act-003", communityBased: false }),
        makeActivity({ id: "act-004", communityBased: false }),
      ],
    });
    const result = evaluateChildActivitiesCompliance(profile, NOW);
    expect(result.communityRate).toBe(50);
    expect(result.communityBasedCount).toBe(2);
    expect(result.inHomeCount).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeActivitiesMetrics", () => {
  it("calculates metrics for home", () => {
    const profiles = [
      makeProfile({ childId: "child-alex" }),
      makeProfile({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = calculateHomeActivitiesMetrics(profiles, "home-oak", NOW);
    expect(result.totalChildren).toBe(2);
    expect(result.averageActivitiesPerChild).toBe(4);
    expect(result.childrenWithNoActivities).toBe(0);
    expect(result.overallScore).toBeGreaterThan(50);
  });

  it("identifies children with no activities", () => {
    const profiles = [
      makeProfile({ childId: "child-alex" }),
      makeProfile({ childId: "child-jordan", childName: "Jordan", activities: [] }),
    ];
    const result = calculateHomeActivitiesMetrics(profiles, "home-oak", NOW);
    expect(result.childrenWithNoActivities).toBe(1);
  });

  it("identifies least represented categories", () => {
    const profiles = [
      makeProfile({ childId: "child-alex" }),
      makeProfile({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = calculateHomeActivitiesMetrics(profiles, "home-oak", NOW);
    expect(result.leastRepresentedCategories.length).toBeGreaterThan(0);
    // Categories with 0 count should appear first
    expect(result.leastRepresentedCategories[0].count).toBe(0);
  });

  it("identifies most common barriers", () => {
    const profiles = [
      makeProfile({
        childId: "child-alex",
        barriersIdentified: ["transport", "financial"],
        barriersResolved: [],
      }),
      makeProfile({
        childId: "child-jordan",
        childName: "Jordan",
        barriersIdentified: ["transport", "confidence"],
        barriersResolved: [],
      }),
    ];
    const result = calculateHomeActivitiesMetrics(profiles, "home-oak", NOW);
    expect(result.mostCommonBarriers[0].barrier).toBe("transport");
    expect(result.mostCommonBarriers[0].count).toBe(2);
  });

  it("handles empty profiles", () => {
    const result = calculateHomeActivitiesMetrics([], "home-oak", NOW);
    expect(result.totalChildren).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("calculates budget totals correctly", () => {
    const profiles = [
      makeProfile({ childId: "child-alex", plan: makePlan({ monthlyBudget: 100, monthlySpend: 85 }) }),
      makeProfile({ childId: "child-jordan", childName: "Jordan", plan: makePlan({ monthlyBudget: 120, monthlySpend: 90 }) }),
    ];
    const result = calculateHomeActivitiesMetrics(profiles, "home-oak", NOW);
    expect(result.totalMonthlyBudget).toBe(220);
    expect(result.totalMonthlySpend).toBe(175);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Helpers Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Label helpers", () => {
  it("getActivityCategoryLabel returns readable labels", () => {
    expect(getActivityCategoryLabel("sport_team")).toBe("Team Sports");
    expect(getActivityCategoryLabel("outdoor_adventure")).toBe("Outdoor/Adventure");
    expect(getActivityCategoryLabel("identity_heritage")).toBe("Identity/Heritage");
  });

  it("getBarrierLabel returns readable labels", () => {
    expect(getBarrierLabel("financial")).toBe("Financial");
    expect(getBarrierLabel("confidence")).toBe("Confidence/Anxiety");
    expect(getBarrierLabel("not_available_locally")).toBe("Not Available Locally");
  });
});
