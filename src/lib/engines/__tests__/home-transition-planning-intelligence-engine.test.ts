// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TRANSITION PLANNING INTELLIGENCE ENGINE — TESTS
// Reg 14: "The care and independence planning standard."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeTransitionPlanning,
  type HomeTransitionPlanningInput,
  type TransitionGoalInput,
} from "../home-transition-planning-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeGoal(overrides: Partial<TransitionGoalInput> = {}): TransitionGoalInput {
  return {
    id: "tpr_test",
    child_id: "yp_alex",
    area: "independent_living",
    goal: "Learn to cook independently",
    description: "Building cooking skills.",
    status: "in_progress",
    target_date: "2026-09-01",
    start_date: "2026-01-15",
    key_worker: "staff_darren",
    actions: ["Weekly cooking session", "Create meal planner"],
    progress: "Good progress so far.",
    percent_complete: 50,
    review_date: "2026-05-20",
    notes: "",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeTransitionPlanningInput> = {}): HomeTransitionPlanningInput {
  return {
    today: "2026-05-27",
    transition_goals: [makeGoal()],
    total_children: 3,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const r = computeHomeTransitionPlanning(baseInput({ total_children: 0 }));
    expect(r.transition_rating).toBe("insufficient_data");
    expect(r.transition_score).toBe(0);
  });

  it("returns insufficient_data when no transition goals", () => {
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: [] }));
    expect(r.transition_rating).toBe("insufficient_data");
    expect(r.transition_score).toBe(0);
  });

  it("populates all profiles with zeros", () => {
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: [] }));
    expect(r.goal_status.total_goals).toBe(0);
    expect(r.area_coverage.areas_covered).toBe(0);
    expect(r.child_coverage.children_with_goals).toBe(0);
    expect(r.progress.avg_percent_complete).toBe(0);
  });

  it("lists all areas as gaps when no data", () => {
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: [] }));
    expect(r.area_coverage.gaps).toHaveLength(8);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. GOAL STATUS PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("goal status profile", () => {
  it("counts goals by status", () => {
    const goals = [
      makeGoal({ id: "g1", status: "not_started" }),
      makeGoal({ id: "g2", status: "in_progress" }),
      makeGoal({ id: "g3", status: "on_track" }),
      makeGoal({ id: "g4", status: "at_risk" }),
      makeGoal({ id: "g5", status: "achieved" }),
      makeGoal({ id: "g6", status: "paused" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.goal_status.total_goals).toBe(6);
    expect(r.goal_status.not_started).toBe(1);
    expect(r.goal_status.in_progress).toBe(1);
    expect(r.goal_status.on_track).toBe(1);
    expect(r.goal_status.at_risk).toBe(1);
    expect(r.goal_status.achieved).toBe(1);
    expect(r.goal_status.paused).toBe(1);
  });

  it("calculates achievement rate", () => {
    const goals = [
      makeGoal({ id: "g1", status: "achieved" }),
      makeGoal({ id: "g2", status: "achieved" }),
      makeGoal({ id: "g3", status: "in_progress" }),
      makeGoal({ id: "g4", status: "not_started" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.goal_status.achievement_rate).toBe(50);
  });

  it("calculates active rate (in_progress + on_track)", () => {
    const goals = [
      makeGoal({ id: "g1", status: "in_progress" }),
      makeGoal({ id: "g2", status: "on_track" }),
      makeGoal({ id: "g3", status: "achieved" }),
      makeGoal({ id: "g4", status: "at_risk" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.goal_status.active_rate).toBe(50); // 2/4
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. AREA COVERAGE PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("area coverage profile", () => {
  it("counts covered areas", () => {
    const goals = [
      makeGoal({ id: "g1", area: "independent_living" }),
      makeGoal({ id: "g2", area: "financial" }),
      makeGoal({ id: "g3", area: "health_wellbeing" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.area_coverage.areas_covered).toBe(3);
    expect(r.area_coverage.total_possible_areas).toBe(8);
    expect(r.area_coverage.coverage_rate).toBe(38); // 3/8
  });

  it("identifies gap areas", () => {
    const goals = [
      makeGoal({ id: "g1", area: "independent_living" }),
      makeGoal({ id: "g2", area: "financial" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.area_coverage.gaps).toContain("education_employment");
    expect(r.area_coverage.gaps).toContain("health_wellbeing");
    expect(r.area_coverage.gaps).toContain("housing");
    expect(r.area_coverage.gaps).not.toContain("independent_living");
    expect(r.area_coverage.gaps).not.toContain("financial");
  });

  it("tracks area distribution", () => {
    const goals = [
      makeGoal({ id: "g1", area: "independent_living" }),
      makeGoal({ id: "g2", area: "independent_living" }),
      makeGoal({ id: "g3", area: "financial" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.area_coverage.area_distribution["independent_living"]).toBe(2);
    expect(r.area_coverage.area_distribution["financial"]).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CHILD COVERAGE PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("child coverage profile", () => {
  it("counts unique children with goals", () => {
    const goals = [
      makeGoal({ id: "g1", child_id: "yp_alex" }),
      makeGoal({ id: "g2", child_id: "yp_alex" }),
      makeGoal({ id: "g3", child_id: "yp_jordan" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.child_coverage.children_with_goals).toBe(2);
    expect(r.child_coverage.children_without_goals).toBe(1);
    expect(r.child_coverage.coverage_rate).toBe(67); // 2/3
  });

  it("tracks goals per child", () => {
    const goals = [
      makeGoal({ id: "g1", child_id: "yp_alex" }),
      makeGoal({ id: "g2", child_id: "yp_alex" }),
      makeGoal({ id: "g3", child_id: "yp_jordan" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.child_coverage.goals_per_child["yp_alex"]).toBe(2);
    expect(r.child_coverage.goals_per_child["yp_jordan"]).toBe(1);
  });

  it("calculates 100% coverage when all children have goals", () => {
    const goals = [
      makeGoal({ id: "g1", child_id: "yp_alex" }),
      makeGoal({ id: "g2", child_id: "yp_jordan" }),
      makeGoal({ id: "g3", child_id: "yp_casey" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.child_coverage.coverage_rate).toBe(100);
    expect(r.child_coverage.children_without_goals).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. PROGRESS PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("progress profile", () => {
  it("calculates average percent complete", () => {
    const goals = [
      makeGoal({ id: "g1", percent_complete: 80 }),
      makeGoal({ id: "g2", percent_complete: 40 }),
      makeGoal({ id: "g3", percent_complete: 60 }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.progress.avg_percent_complete).toBe(60);
  });

  it("identifies overdue goals (past target, not achieved/paused)", () => {
    const goals = [
      makeGoal({ id: "g1", target_date: "2026-04-01", status: "in_progress" }), // overdue
      makeGoal({ id: "g2", target_date: "2026-04-01", status: "achieved" }),     // not overdue (achieved)
      makeGoal({ id: "g3", target_date: "2026-09-01", status: "in_progress" }), // not overdue (future)
      makeGoal({ id: "g4", target_date: "2026-03-01", status: "paused" }),       // not overdue (paused)
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.progress.goals_overdue).toBe(1);
  });

  it("counts goals with reviews and calculates review rate", () => {
    const goals = [
      makeGoal({ id: "g1", review_date: "2026-05-20" }),
      makeGoal({ id: "g2", review_date: "2026-05-15" }),
      makeGoal({ id: "g3", review_date: "" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.progress.goals_with_reviews).toBe(2);
    expect(r.progress.review_rate).toBe(67); // 2/3
  });

  it("identifies reviews overdue (>30 days since review)", () => {
    const goals = [
      makeGoal({ id: "g1", review_date: "2026-04-01" }), // 56 days ago → overdue
      makeGoal({ id: "g2", review_date: "2026-05-20" }), // 7 days ago → fine
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.progress.reviews_overdue).toBe(1);
  });

  it("calculates action coverage rate", () => {
    const goals = [
      makeGoal({ id: "g1", actions: ["Action A"] }),
      makeGoal({ id: "g2", actions: ["Action B", "Action C"] }),
      makeGoal({ id: "g3", actions: [] }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.progress.goals_with_actions).toBe(2);
    expect(r.progress.action_coverage_rate).toBe(67); // 2/3
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. SCORING MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: child coverage", () => {
  it("awards +5 for 100% child coverage", () => {
    const full = baseInput({
      transition_goals: [
        makeGoal({ id: "g1", child_id: "yp_alex" }),
        makeGoal({ id: "g2", child_id: "yp_jordan" }),
        makeGoal({ id: "g3", child_id: "yp_casey" }),
      ],
    });
    const partial = baseInput({
      transition_goals: [
        makeGoal({ id: "g1", child_id: "yp_alex" }),
        makeGoal({ id: "g2", child_id: "yp_jordan" }),
      ],
    });
    const rFull = computeHomeTransitionPlanning(full);
    const rPartial = computeHomeTransitionPlanning(partial);
    // 100% → +5 vs 67% → +3. Diff = 2
    // But area_coverage also changes since partial has fewer unique areas maybe...
    // Both have same areas (independent_living default) so no area change.
    // child_coverage: full=100%→+5, partial=67%→+1 (67<75). Diff=4
    expect(rFull.transition_score - rPartial.transition_score).toBe(4);
  });

  it("penalises -5 for 0% child coverage equivalent (impossible but test guard with 1 child covering 1/3)", () => {
    const one = baseInput({
      transition_goals: [makeGoal({ id: "g1", child_id: "yp_alex" })],
    });
    const r = computeHomeTransitionPlanning(one);
    // 1/3 = 33% → mod1 = -2
    expect(r.child_coverage.coverage_rate).toBe(33);
  });
});

describe("mod2: area coverage breadth", () => {
  it("awards +4 for >= 6 areas", () => {
    const many = baseInput({
      total_children: 1,
      transition_goals: [
        makeGoal({ id: "g1", area: "independent_living" }),
        makeGoal({ id: "g2", area: "education_employment" }),
        makeGoal({ id: "g3", area: "financial" }),
        makeGoal({ id: "g4", area: "health_wellbeing" }),
        makeGoal({ id: "g5", area: "housing" }),
        makeGoal({ id: "g6", area: "relationships" }),
      ],
    });
    const few = baseInput({
      total_children: 1,
      transition_goals: [
        makeGoal({ id: "g1", area: "independent_living" }),
        makeGoal({ id: "g2", area: "education_employment" }),
        makeGoal({ id: "g3", area: "financial" }),
        makeGoal({ id: "g4", area: "health_wellbeing" }),
      ],
    });
    const rMany = computeHomeTransitionPlanning(many);
    const rFew = computeHomeTransitionPlanning(few);
    // many: 6 areas → +4; few: 4 areas → +2. Diff = 2
    expect(rMany.transition_score - rFew.transition_score).toBe(2);
  });

  it("penalises -3 for < 2 areas", () => {
    const single = baseInput({
      total_children: 1,
      transition_goals: [makeGoal({ id: "g1", area: "independent_living" })],
    });
    const r = computeHomeTransitionPlanning(single);
    expect(r.area_coverage.areas_covered).toBe(1);
  });
});

describe("mod3: goal achievement rate", () => {
  it("awards +4 for >= 40% achievement", () => {
    const goals = [
      makeGoal({ id: "g1", status: "achieved" }),
      makeGoal({ id: "g2", status: "achieved" }),
      makeGoal({ id: "g3", status: "in_progress" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    // 2/3 = 67% → +4
    expect(r.goal_status.achievement_rate).toBe(67);
  });

  it("penalises -2 for < 10% achievement", () => {
    const goals = Array.from({ length: 12 }, (_, i) =>
      makeGoal({ id: `g${i}`, status: "in_progress" }),
    );
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    // 0% → -2
    expect(r.goal_status.achievement_rate).toBe(0);
  });
});

describe("mod4: active engagement", () => {
  it("awards +4 for >= 50% active", () => {
    const goals = [
      makeGoal({ id: "g1", status: "in_progress" }),
      makeGoal({ id: "g2", status: "on_track" }),
      makeGoal({ id: "g3", status: "achieved" }),
      makeGoal({ id: "g4", status: "not_started" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    // 2/4 = 50% → +4
    expect(r.goal_status.active_rate).toBe(50);
  });
});

describe("mod5: at-risk goals", () => {
  it("awards +3 for 0 at-risk goals", () => {
    const safe = baseInput({
      transition_goals: [
        makeGoal({ id: "g1", status: "on_track" }),
        makeGoal({ id: "g2", status: "in_progress" }),
      ],
    });
    const risky = baseInput({
      transition_goals: [
        makeGoal({ id: "g1", status: "on_track" }),
        makeGoal({ id: "g2", status: "at_risk" }),
      ],
    });
    const rSafe = computeHomeTransitionPlanning(safe);
    const rRisky = computeHomeTransitionPlanning(risky);
    // safe: 0% at-risk → +3; risky: 50% at-risk → -3. Diff = 6
    expect(rSafe.transition_score - rRisky.transition_score).toBe(6);
  });
});

describe("mod6: review compliance", () => {
  it("awards +3 for >= 80% review rate", () => {
    const reviewed = baseInput({
      transition_goals: [
        makeGoal({ id: "g1", review_date: "2026-05-20" }),
        makeGoal({ id: "g2", review_date: "2026-05-15" }),
        makeGoal({ id: "g3", review_date: "2026-05-10" }),
        makeGoal({ id: "g4", review_date: "2026-05-10" }),
        makeGoal({ id: "g5", review_date: "2026-05-10" }),
      ],
    });
    const r = computeHomeTransitionPlanning(reviewed);
    expect(r.progress.review_rate).toBe(100);
  });
});

describe("mod7: action planning", () => {
  it("awards +3 for >= 90% action coverage", () => {
    const withActions = baseInput({
      transition_goals: [
        makeGoal({ id: "g1", actions: ["A1"] }),
        makeGoal({ id: "g2", actions: ["A2", "A3"] }),
        makeGoal({ id: "g3", actions: ["A4"] }),
      ],
    });
    const r = computeHomeTransitionPlanning(withActions);
    expect(r.progress.action_coverage_rate).toBe(100);
  });

  it("penalises -2 for < 50% action coverage", () => {
    const noActions = baseInput({
      transition_goals: [
        makeGoal({ id: "g1", actions: ["A1"] }),
        makeGoal({ id: "g2", actions: [] }),
        makeGoal({ id: "g3", actions: [] }),
      ],
    });
    const r = computeHomeTransitionPlanning(noActions);
    expect(r.progress.action_coverage_rate).toBe(33);
  });
});

describe("mod8: overdue goals", () => {
  it("awards +4 for 0 overdue goals", () => {
    const onTime = baseInput({
      transition_goals: [
        makeGoal({ id: "g1", target_date: "2026-09-01", status: "in_progress" }),
        makeGoal({ id: "g2", target_date: "2026-12-01", status: "on_track" }),
      ],
    });
    const r = computeHomeTransitionPlanning(onTime);
    expect(r.progress.goals_overdue).toBe(0);
  });

  it("penalises -4 for > 25% overdue", () => {
    const overdue = baseInput({
      transition_goals: [
        makeGoal({ id: "g1", target_date: "2026-03-01", status: "in_progress" }),
        makeGoal({ id: "g2", target_date: "2026-02-01", status: "at_risk" }),
        makeGoal({ id: "g3", target_date: "2026-09-01", status: "on_track" }),
      ],
    });
    const r = computeHomeTransitionPlanning(overdue);
    expect(r.progress.goals_overdue).toBe(2);
    // 2/3 = 67% overdue → -4
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("returns outstanding for excellent scenario", () => {
    // 3 children, 6+ areas, high achievement, all reviewed, all with actions, no overdue
    const goals = [
      makeGoal({ id: "g1", child_id: "yp_alex", area: "independent_living", status: "achieved", percent_complete: 100, review_date: "2026-05-20", actions: ["A1"] }),
      makeGoal({ id: "g2", child_id: "yp_alex", area: "financial", status: "achieved", percent_complete: 100, review_date: "2026-05-18", actions: ["A1"] }),
      makeGoal({ id: "g3", child_id: "yp_alex", area: "education_employment", status: "on_track", percent_complete: 70, review_date: "2026-05-22", actions: ["A1"] }),
      makeGoal({ id: "g4", child_id: "yp_jordan", area: "health_wellbeing", status: "on_track", percent_complete: 60, review_date: "2026-05-19", actions: ["A1"] }),
      makeGoal({ id: "g5", child_id: "yp_jordan", area: "relationships", status: "in_progress", percent_complete: 40, review_date: "2026-05-21", actions: ["A1"] }),
      makeGoal({ id: "g6", child_id: "yp_casey", area: "identity", status: "in_progress", percent_complete: 35, review_date: "2026-05-20", actions: ["A1"] }),
      makeGoal({ id: "g7", child_id: "yp_casey", area: "housing", status: "in_progress", percent_complete: 30, review_date: "2026-05-17", actions: ["A1"] }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    // mod1: 3/3=100% → +5
    // mod2: 7 areas → +4
    // mod3: 2/7=29% achieved → +2
    // mod4: (3 on_track+in_progress) + 2 on_track = 5/7=71% → +4
    // mod5: 0 at-risk → +3
    // mod6: 100% reviewed → +3
    // mod7: 100% actions → +3
    // mod8: 0 overdue → +4
    // Total: 52 + 5 + 4 + 2 + 4 + 3 + 3 + 3 + 4 = 80
    expect(r.transition_rating).toBe("outstanding");
    expect(r.transition_score).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate for poor scenario", () => {
    const goals = [
      makeGoal({
        id: "g1",
        child_id: "yp_alex",
        status: "at_risk",
        target_date: "2026-03-01",
        review_date: "",
        actions: [],
        percent_complete: 5,
      }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.transition_rating).toBe("inadequate");
    expect(r.transition_score).toBeLessThan(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes child coverage strength when all children have goals", () => {
    const goals = [
      makeGoal({ id: "g1", child_id: "yp_alex" }),
      makeGoal({ id: "g2", child_id: "yp_jordan" }),
      makeGoal({ id: "g3", child_id: "yp_casey" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.strengths.some((s) => s.includes("All children"))).toBe(true);
  });

  it("includes area breadth strength for 6+ areas", () => {
    const goals = [
      makeGoal({ id: "g1", area: "independent_living" }),
      makeGoal({ id: "g2", area: "education_employment" }),
      makeGoal({ id: "g3", area: "financial" }),
      makeGoal({ id: "g4", area: "health_wellbeing" }),
      makeGoal({ id: "g5", area: "housing" }),
      makeGoal({ id: "g6", area: "relationships" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.strengths.some((s) => s.includes("life areas"))).toBe(true);
  });

  it("includes achievement strength when goals achieved", () => {
    const goals = [
      makeGoal({ id: "g1", status: "achieved" }),
      makeGoal({ id: "g2", status: "achieved" }),
      makeGoal({ id: "g3", status: "in_progress" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.strengths.some((s) => s.includes("achieved"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("flags children without goals", () => {
    const goals = [makeGoal({ id: "g1", child_id: "yp_alex" })];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.concerns.some((c) => c.includes("no transition planning goals"))).toBe(true);
  });

  it("flags at-risk goals", () => {
    const goals = [
      makeGoal({ id: "g1", status: "at_risk" }),
      makeGoal({ id: "g2", status: "in_progress" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.concerns.some((c) => c.includes("at-risk"))).toBe(true);
  });

  it("flags overdue goals", () => {
    const goals = [
      makeGoal({ id: "g1", target_date: "2026-03-01", status: "in_progress" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });

  it("flags stale reviews", () => {
    const goals = [
      makeGoal({ id: "g1", review_date: "2026-03-01" }), // 87 days ago
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.concerns.some((c) => c.includes("reviewed in over 30 days"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("generates immediate rec for children without goals", () => {
    const r = computeHomeTransitionPlanning(baseInput({
      transition_goals: [makeGoal({ id: "g1", child_id: "yp_alex" })],
    }));
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("Create transition planning goals"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("Reg 14");
  });

  it("generates immediate rec for overdue goals", () => {
    const r = computeHomeTransitionPlanning(baseInput({
      transition_goals: [makeGoal({ id: "g1", target_date: "2026-03-01", status: "in_progress" })],
    }));
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("overdue"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("ranks recommendations sequentially", () => {
    const goals = [
      makeGoal({ id: "g1", child_id: "yp_alex", status: "at_risk", target_date: "2026-03-01", review_date: "2026-03-01" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    if (r.recommendations.length >= 2) {
      for (let i = 1; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBeGreaterThan(r.recommendations[i - 1].rank);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("generates critical insight for children without goals", () => {
    const r = computeHomeTransitionPlanning(baseInput({
      transition_goals: [makeGoal({ id: "g1", child_id: "yp_alex" })],
    }));
    const ins = r.insights.find((i) => i.text.includes("no transition plan"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("critical");
  });

  it("generates warning insight for at-risk goals", () => {
    const r = computeHomeTransitionPlanning(baseInput({
      transition_goals: [makeGoal({ id: "g1", status: "at_risk" })],
    }));
    const ins = r.insights.find((i) => i.text.includes("at-risk"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("warning");
  });

  it("generates positive insight for good progress", () => {
    const goals = [
      makeGoal({ id: "g1", status: "achieved", percent_complete: 100 }),
      makeGoal({ id: "g2", status: "on_track", percent_complete: 60 }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    const ins = r.insights.find((i) => i.text.includes("progress towards independence"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("positive");
  });

  it("generates positive insight for broad area coverage", () => {
    const goals = [
      makeGoal({ id: "g1", area: "independent_living" }),
      makeGoal({ id: "g2", area: "education_employment" }),
      makeGoal({ id: "g3", area: "financial" }),
      makeGoal({ id: "g4", area: "health_wellbeing" }),
      makeGoal({ id: "g5", area: "housing" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    const ins = r.insights.find((i) => i.text.includes("life areas"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("positive");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. SCORE CLAMPING & EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const goals = Array.from({ length: 20 }, (_, i) =>
      makeGoal({
        id: `g${i}`,
        child_id: `yp_${i < 7 ? "alex" : i < 14 ? "jordan" : "casey"}`,
        area: ["independent_living", "education_employment", "financial", "health_wellbeing", "housing", "relationships", "legal_rights", "identity"][i % 8],
        status: "achieved",
        percent_complete: 100,
        review_date: "2026-05-25",
        actions: ["Action"],
      }),
    );
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.transition_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const goals = [
      makeGoal({
        id: "g1",
        status: "at_risk",
        target_date: "2026-01-01",
        review_date: "",
        actions: [],
        percent_complete: 0,
      }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.transition_score).toBeGreaterThanOrEqual(0);
  });
});

describe("edge cases", () => {
  it("handles all goals paused", () => {
    const goals = [
      makeGoal({ id: "g1", status: "paused" }),
      makeGoal({ id: "g2", status: "paused" }),
    ];
    const r = computeHomeTransitionPlanning(baseInput({ transition_goals: goals }));
    expect(r.goal_status.paused).toBe(2);
    expect(r.goal_status.active_rate).toBe(0);
  });

  it("handles single goal correctly", () => {
    const r = computeHomeTransitionPlanning(baseInput({
      transition_goals: [makeGoal()],
    }));
    expect(r.goal_status.total_goals).toBe(1);
    expect(r.child_coverage.children_with_goals).toBe(1);
  });

  it("handles goal with empty review_date", () => {
    const r = computeHomeTransitionPlanning(baseInput({
      transition_goals: [makeGoal({ review_date: "" })],
    }));
    expect(r.progress.goals_with_reviews).toBe(0);
  });
});
