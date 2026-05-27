// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME COMPETENCY LANDSCAPE INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeCompetencyLandscape,
  type HomeCompetencyLandscapeInput,
  type CompetencyProfileInput,
  type DevelopmentPlanInput,
} from "../home-competency-landscape-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makeProfile(overrides: Partial<CompetencyProfileInput> = {}): CompetencyProfileInput {
  return {
    id: "cp_1",
    staff_id: "s1",
    current_stage: "rsw",
    target_stage: "senior_rsw",
    readiness_score: 70,
    strengths_count: 3,
    development_areas_count: 2,
    last_assessed_date: "2026-03-15",
    next_review_date: "2026-09-15",
    ...overrides,
  };
}

function makePlan(overrides: Partial<DevelopmentPlanInput> = {}): DevelopmentPlanInput {
  return {
    id: "dp_1",
    staff_id: "s1",
    status: "active",
    total_actions: 4,
    completed_actions: 2,
    overdue_actions: 0,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeCompetencyLandscapeInput> = {}): HomeCompetencyLandscapeInput {
  return {
    today: TODAY,
    profiles: [],
    development_plans: [],
    total_staff: 5,
    ...overrides,
  };
}

// ── Outstanding scenario ────────────────────────────────────────────────────

function outstandingProfiles(): CompetencyProfileInput[] {
  return [
    makeProfile({ id: "cp_1", staff_id: "s1", current_stage: "registered_manager", target_stage: null, readiness_score: 92, strengths_count: 4, development_areas_count: 1 }),
    makeProfile({ id: "cp_2", staff_id: "s2", current_stage: "deputy_manager", target_stage: "registered_manager", readiness_score: 80, strengths_count: 3, development_areas_count: 2 }),
    makeProfile({ id: "cp_3", staff_id: "s3", current_stage: "senior_rsw", target_stage: "deputy_manager", readiness_score: 75, strengths_count: 3, development_areas_count: 2 }),
    makeProfile({ id: "cp_4", staff_id: "s4", current_stage: "rsw", target_stage: "senior_rsw", readiness_score: 72, strengths_count: 3, development_areas_count: 2 }),
    makeProfile({ id: "cp_5", staff_id: "s5", current_stage: "rsw", target_stage: "senior_rsw", readiness_score: 68, strengths_count: 2, development_areas_count: 2 }),
  ];
}

function outstandingPlans(): DevelopmentPlanInput[] {
  return [
    makePlan({ id: "dp_1", staff_id: "s2", total_actions: 5, completed_actions: 3, overdue_actions: 0 }),
    makePlan({ id: "dp_2", staff_id: "s3", total_actions: 4, completed_actions: 2, overdue_actions: 0 }),
    makePlan({ id: "dp_3", staff_id: "s4", total_actions: 3, completed_actions: 2, overdue_actions: 0 }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

describe("Home Competency Landscape Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_staff is 0", () => {
      const r = computeHomeCompetencyLandscape(baseInput({ total_staff: 0 }));
      expect(r.competency_rating).toBe("insufficient_data");
      expect(r.competency_score).toBe(0);
    });

    it("returns insufficient_data when no profiles and no plans", () => {
      const r = computeHomeCompetencyLandscape(baseInput({ profiles: [], development_plans: [] }));
      expect(r.competency_rating).toBe("insufficient_data");
    });
  });

  // ── Rating thresholds ──────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("outstanding — high readiness, good plans, diverse stages", () => {
      // avg readiness: (92+80+75+72+68)/5 = 387/5 = 77.4 → ≥75 → +5
      // pathway: 4/5 have target (s1 has null) = 80% → +3
      // plan engagement: 3 staff with plans / 5 = 60% → +4
      // overdue actions: 0 → +3
      // assessment currency: all next_review > today → 0 overdue → +3
      // stage diversity: RM, DM, Senior RSW, RSW = 4 → +3
      // dev balance: avg strengths = (4+3+3+3+2)/5=3.0, avg dev = (1+2+2+2+2)/5=1.8 → ≤2 AND ≥2 → +4
      // high readiness: 4/5 ≥ 70 (s5 is 68) = 80% → +3
      // Score: 52 + 5+3+4+3+3+3+4+3 = 80
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: outstandingProfiles(),
        development_plans: outstandingPlans(),
      }));
      expect(r.competency_score).toBe(80);
      expect(r.competency_rating).toBe("outstanding");
    });

    it("good — decent readiness with some gaps", () => {
      // avg readiness: (74+62+68+58+65)/5 = 327/5 = 65.4 → ≥65 → +3
      // pathway: 4/5 = 80% → +3
      // plan engagement: 2/5 = 40% → +2
      // overdue actions: 0 → +3
      // assessment: 0 overdue → +3
      // stages: deputy_manager, rsw = 2 → +1
      // dev balance: avg strengths = (3+3+3+2+3)/5=2.8, avg dev = (3+3+3+3+3)/5=3.0 → ≤3 → +2
      // high readiness: 1/5 ≥ 70 (74) = 20% → ≥15% → +0
      // Score: 52 + 3+3+2+3+3+1+2+0 = 69
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", current_stage: "deputy_manager", target_stage: "registered_manager", readiness_score: 74, strengths_count: 3, development_areas_count: 3 }),
        makeProfile({ id: "p2", staff_id: "s2", current_stage: "rsw", target_stage: "senior_rsw", readiness_score: 62, strengths_count: 3, development_areas_count: 3 }),
        makeProfile({ id: "p3", staff_id: "s3", current_stage: "rsw", target_stage: "team_leader", readiness_score: 68, strengths_count: 3, development_areas_count: 3 }),
        makeProfile({ id: "p4", staff_id: "s4", current_stage: "rsw", target_stage: "senior_rsw", readiness_score: 58, strengths_count: 2, development_areas_count: 3 }),
        makeProfile({ id: "p5", staff_id: "s5", current_stage: "rsw", target_stage: null, readiness_score: 65, strengths_count: 3, development_areas_count: 3 }),
      ];
      const plans = [
        makePlan({ id: "dp_1", staff_id: "s1" }),
        makePlan({ id: "dp_2", staff_id: "s2" }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ profiles, development_plans: plans }));
      expect(r.competency_score).toBe(69);
      expect(r.competency_rating).toBe("good");
    });

    it("adequate — low readiness, limited plans", () => {
      // avg readiness: (55+52+48+50+45)/5 = 250/5 = 50.0 → <55 → -4
      // pathway: 2/5 = 40% → +0
      // plan engagement: 1/5 = 20% → +0
      // overdue: 1 action → overdue_rate = 1/3 = 33% → >30 → -2
      // assessment: 1 overdue → 1/5 = 20% → ≤25 → +1
      // stages: rsw only = 1 → +0
      // dev balance: avg strengths = (1+2+1+2+1)/5=1.4, avg dev = (4+3+4+4+3)/5=3.6 → ≤4 → +0
      // high readiness: 0/5 ≥ 70 = 0% → <15 → -2
      // Score: 52 + (-4) + 0 + 0 + (-2) + 1 + 0 + 0 + (-2) = 45
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", current_stage: "rsw", target_stage: "senior_rsw", readiness_score: 55, strengths_count: 1, development_areas_count: 4 }),
        makeProfile({ id: "p2", staff_id: "s2", current_stage: "rsw", target_stage: "senior_rsw", readiness_score: 52, strengths_count: 2, development_areas_count: 3 }),
        makeProfile({ id: "p3", staff_id: "s3", current_stage: "rsw", target_stage: null, readiness_score: 48, strengths_count: 1, development_areas_count: 4 }),
        makeProfile({ id: "p4", staff_id: "s4", current_stage: "rsw", target_stage: null, readiness_score: 50, strengths_count: 2, development_areas_count: 4 }),
        makeProfile({ id: "p5", staff_id: "s5", current_stage: "rsw", target_stage: null, readiness_score: 45, strengths_count: 1, development_areas_count: 3, next_review_date: "2026-04-01" }),
      ];
      const plans = [
        makePlan({ id: "dp_1", staff_id: "s1", total_actions: 3, completed_actions: 0, overdue_actions: 1 }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ profiles, development_plans: plans }));
      expect(r.competency_score).toBe(45);
      expect(r.competency_rating).toBe("adequate");
    });

    it("inadequate — very low readiness, overdue everything", () => {
      // avg readiness: (40+35+38+42+30)/5 = 185/5 = 37 → <55 → -4
      // pathway: 1/5 = 20% → <40 → -2
      // plan engagement: 0/5 = 0% → <20 → -3
      // overdue: no plans → neutral (0)
      // assessment: 3 overdue → 3/5 = 60% → >50 → -2
      // stages: rsw only = 1 → +0
      // dev balance: avg strengths = 1.0, avg dev = (5+4+5+4+5)/5=4.6 → >4 → -3
      // high readiness: 0% → <15 → -2
      // Score: 52 + (-4) + (-2) + (-3) + 0 + (-2) + 0 + (-3) + (-2) = 36
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", current_stage: "rsw", target_stage: "senior_rsw", readiness_score: 40, strengths_count: 1, development_areas_count: 5, next_review_date: "2026-03-01" }),
        makeProfile({ id: "p2", staff_id: "s2", current_stage: "rsw", target_stage: null, readiness_score: 35, strengths_count: 1, development_areas_count: 4, next_review_date: "2026-04-01" }),
        makeProfile({ id: "p3", staff_id: "s3", current_stage: "rsw", target_stage: null, readiness_score: 38, strengths_count: 1, development_areas_count: 5 }),
        makeProfile({ id: "p4", staff_id: "s4", current_stage: "rsw", target_stage: null, readiness_score: 42, strengths_count: 1, development_areas_count: 4 }),
        makeProfile({ id: "p5", staff_id: "s5", current_stage: "rsw", target_stage: null, readiness_score: 30, strengths_count: 1, development_areas_count: 5, next_review_date: "2026-02-01" }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ profiles }));
      expect(r.competency_score).toBe(36);
      expect(r.competency_rating).toBe("inadequate");
    });
  });

  // ── Readiness Profile ──────────────────────────────────────────────────

  describe("readiness profile", () => {
    it("computes avg readiness score", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", readiness_score: 80 }),
        makeProfile({ id: "p2", staff_id: "s2", readiness_score: 60 }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ profiles }));
      expect(r.readiness.avg_readiness_score).toBe(70);
    });

    it("computes highest and lowest readiness", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", readiness_score: 90 }),
        makeProfile({ id: "p2", staff_id: "s2", readiness_score: 50 }),
        makeProfile({ id: "p3", staff_id: "s3", readiness_score: 72 }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ profiles }));
      expect(r.readiness.highest_readiness).toBe(90);
      expect(r.readiness.lowest_readiness).toBe(50);
    });

    it("computes staff_above_70 count and rate", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", readiness_score: 80 }),
        makeProfile({ id: "p2", staff_id: "s2", readiness_score: 70 }),
        makeProfile({ id: "p3", staff_id: "s3", readiness_score: 60 }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ profiles }));
      expect(r.readiness.staff_above_70).toBe(2);
      expect(r.readiness.staff_above_70_rate).toBe(67); // 2/3
    });

    it("computes staff_with_target count and rate", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", target_stage: "senior_rsw" }),
        makeProfile({ id: "p2", staff_id: "s2", target_stage: null }),
        makeProfile({ id: "p3", staff_id: "s3", target_stage: "deputy_manager" }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ profiles }));
      expect(r.readiness.staff_with_target).toBe(2);
      expect(r.readiness.staff_with_target_rate).toBe(67);
    });
  });

  // ── Stage Distribution ─────────────────────────────────────────────────

  describe("stage distribution", () => {
    it("groups staff by current stage", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", current_stage: "rsw" }),
        makeProfile({ id: "p2", staff_id: "s2", current_stage: "rsw" }),
        makeProfile({ id: "p3", staff_id: "s3", current_stage: "deputy_manager" }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ profiles }));
      expect(r.stage_distribution).toHaveLength(2);
      expect(r.stage_distribution[0]).toEqual({ stage: "rsw", count: 2 });
      expect(r.stage_distribution[1]).toEqual({ stage: "deputy_manager", count: 1 });
    });

    it("returns empty array when no profiles", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: [],
        development_plans: [makePlan()],
      }));
      expect(r.stage_distribution).toHaveLength(0);
    });
  });

  // ── Progression Profile ────────────────────────────────────────────────

  describe("progression profile", () => {
    it("counts plan statuses correctly", () => {
      const plans = [
        makePlan({ id: "dp_1", staff_id: "s1", status: "active" }),
        makePlan({ id: "dp_2", staff_id: "s2", status: "active" }),
        makePlan({ id: "dp_3", staff_id: "s3", status: "completed" }),
        makePlan({ id: "dp_4", staff_id: "s4", status: "paused" }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ development_plans: plans }));
      expect(r.progression.active_plans).toBe(2);
      expect(r.progression.completed_plans).toBe(1);
      expect(r.progression.paused_plans).toBe(1);
    });

    it("computes plan coverage rate", () => {
      const plans = [
        makePlan({ id: "dp_1", staff_id: "s1" }),
        makePlan({ id: "dp_2", staff_id: "s2" }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ development_plans: plans, total_staff: 5 }));
      expect(r.progression.plan_coverage_rate).toBe(40); // 2/5
    });

    it("computes action completion and overdue rates", () => {
      const plans = [
        makePlan({ id: "dp_1", staff_id: "s1", total_actions: 5, completed_actions: 3, overdue_actions: 1 }),
        makePlan({ id: "dp_2", staff_id: "s2", total_actions: 3, completed_actions: 1, overdue_actions: 0 }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ development_plans: plans }));
      expect(r.progression.total_actions).toBe(8);
      expect(r.progression.completed_actions).toBe(4);
      expect(r.progression.overdue_actions).toBe(1);
      expect(r.progression.action_completion_rate).toBe(50); // 4/8
      expect(r.progression.overdue_action_rate).toBe(13); // 1/8 = 12.5 → 13
    });
  });

  // ── Currency Profile ───────────────────────────────────────────────────

  describe("currency profile", () => {
    it("identifies overdue assessments", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", next_review_date: "2026-04-01" }), // overdue
        makeProfile({ id: "p2", staff_id: "s2", next_review_date: "2026-09-01" }), // not overdue
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ profiles }));
      expect(r.currency.overdue_assessments).toBe(1);
      expect(r.currency.overdue_assessment_rate).toBe(50);
    });

    it("computes avg days since assessment", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", last_assessed_date: "2026-05-16" }), // 10 days ago
        makeProfile({ id: "p2", staff_id: "s2", last_assessed_date: "2026-04-26" }), // 30 days ago
      ];
      const r = computeHomeCompetencyLandscape(baseInput({ profiles }));
      expect(r.currency.avg_days_since_assessment).toBe(20); // (10+30)/2
    });
  });

  // ── Scoring Modifiers ──────────────────────────────────────────────────

  describe("scoring modifiers", () => {
    it("modifier 1: avg readiness ≥75 gives +5", () => {
      const high = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile({ readiness_score: 80 })],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      const low = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile({ readiness_score: 50 })],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      // high: mod1 +5 (≥75), mod8 +3 (100% ≥70)
      // low: mod1 -4 (<55), mod8 -2 (0% <15%)
      // diff = (5+3) - (-4-2) = 14
      expect(high.competency_score - low.competency_score).toBe(14);
    });

    it("modifier 2: pathway ≥80% gives +3", () => {
      const high = computeHomeCompetencyLandscape(baseInput({
        profiles: [
          makeProfile({ id: "p1", staff_id: "s1", target_stage: "senior_rsw" }),
        ],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      const low = computeHomeCompetencyLandscape(baseInput({
        profiles: [
          makeProfile({ id: "p1", staff_id: "s1", target_stage: null }),
        ],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      // 100% → +3; 0% → -2; diff = 5
      expect(high.competency_score - low.competency_score).toBe(5);
    });

    it("modifier 3: plan engagement ≥60% gives +4", () => {
      // Both scenarios have a profile so neither hits insufficient_data
      const profile = [makeProfile({ id: "p1", staff_id: "s1" })];
      // 3/5 = 60% → +4
      const plans = [
        makePlan({ id: "dp_1", staff_id: "s1" }),
        makePlan({ id: "dp_2", staff_id: "s2" }),
        makePlan({ id: "dp_3", staff_id: "s3" }),
      ];
      const high = computeHomeCompetencyLandscape(baseInput({ profiles: profile, development_plans: plans }));
      // 0/5 = 0% → -3
      const low = computeHomeCompetencyLandscape(baseInput({ profiles: profile, development_plans: [] }));
      // high: mod3 +4, mod4 +3 (0 overdue)
      // low: mod3 -3, mod4 neutral (no plans)
      // diff = (4+3) - (-3+0) = 10
      expect(high.competency_score - low.competency_score).toBe(10);
    });

    it("modifier 4: 0 overdue actions gives +3", () => {
      const noOverdue = computeHomeCompetencyLandscape(baseInput({
        development_plans: [makePlan({ overdue_actions: 0, total_actions: 4 })],
      }));
      const withOverdue = computeHomeCompetencyLandscape(baseInput({
        development_plans: [makePlan({ overdue_actions: 2, total_actions: 4 })],
      }));
      // 0 overdue → +3; 2/4 = 50% > 30% → -2; diff = 5
      expect(noOverdue.competency_score - withOverdue.competency_score).toBe(5);
    });

    it("modifier 5: 0 overdue assessments gives +3", () => {
      const current = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile({ next_review_date: "2026-09-01" })],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      const overdue = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile({ next_review_date: "2026-03-01" })],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      // 0 overdue → +3; 100% overdue → -2; diff = 5
      expect(current.competency_score - overdue.competency_score).toBe(5);
    });

    it("modifier 6: ≥3 stages gives +3", () => {
      const diverse = computeHomeCompetencyLandscape(baseInput({
        profiles: [
          makeProfile({ id: "p1", staff_id: "s1", current_stage: "rsw" }),
          makeProfile({ id: "p2", staff_id: "s2", current_stage: "senior_rsw" }),
          makeProfile({ id: "p3", staff_id: "s3", current_stage: "deputy_manager" }),
        ],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      const uniform = computeHomeCompetencyLandscape(baseInput({
        profiles: [
          makeProfile({ id: "p1", staff_id: "s1", current_stage: "rsw" }),
          makeProfile({ id: "p2", staff_id: "s2", current_stage: "rsw" }),
          makeProfile({ id: "p3", staff_id: "s3", current_stage: "rsw" }),
        ],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      // 3 stages → +3; 1 stage → +0; diff = 3
      expect(diverse.competency_score - uniform.competency_score).toBe(3);
    });

    it("modifier 7: low dev areas and good strengths gives +4", () => {
      const balanced = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile({ strengths_count: 3, development_areas_count: 1 })],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      const heavy = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile({ strengths_count: 1, development_areas_count: 5 })],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      // ≤2 dev + ≥2 strengths → +4; >4 dev → -3; diff = 7
      expect(balanced.competency_score - heavy.competency_score).toBe(7);
    });

    it("modifier 8: ≥50% high readiness gives +3", () => {
      const high = computeHomeCompetencyLandscape(baseInput({
        profiles: [
          makeProfile({ id: "p1", staff_id: "s1", readiness_score: 75 }),
          makeProfile({ id: "p2", staff_id: "s2", readiness_score: 80 }),
        ],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      const low = computeHomeCompetencyLandscape(baseInput({
        profiles: [
          makeProfile({ id: "p1", staff_id: "s1", readiness_score: 50 }),
          makeProfile({ id: "p2", staff_id: "s2", readiness_score: 55 }),
        ],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      // high: 100% ≥70 → +3; low: 0% → -2; diff includes mod8 (5) + mod1 change
      // high avg: 77.5 → +5; low avg: 52.5 → -4; mod1 diff = 9
      // mod8 diff = 3 - (-2) = 5; total = 14
      expect(high.competency_score - low.competency_score).toBe(14);
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("generates strength for high avg readiness", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile({ readiness_score: 75 })],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      expect(r.strengths.some((s) => s.includes("readiness score"))).toBe(true);
    });

    it("generates strength for current assessments", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile()],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      expect(r.strengths.some((s) => s.includes("assessments are current"))).toBe(true);
    });

    it("generates strength for active plans on track", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        development_plans: [makePlan({ overdue_actions: 0 })],
      }));
      expect(r.strengths.some((s) => s.includes("no overdue actions"))).toBe(true);
    });

    it("generates strength for stage diversity", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", current_stage: "rsw" }),
        makeProfile({ id: "p2", staff_id: "s2", current_stage: "senior_rsw" }),
        makeProfile({ id: "p3", staff_id: "s3", current_stage: "deputy_manager" }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles,
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      expect(r.strengths.some((s) => s.includes("multiple role stages"))).toBe(true);
    });
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("generates concern for low readiness", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile({ readiness_score: 45 })],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      expect(r.concerns.some((c) => c.includes("readiness score"))).toBe(true);
    });

    it("generates concern for overdue assessments", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile({ next_review_date: "2026-03-01" })],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
    });

    it("generates concern for low plan coverage", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile()],
        development_plans: [],
      }));
      expect(r.concerns.some((c) => c.includes("development plans"))).toBe(true);
    });

    it("generates concern for overdue actions", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        development_plans: [makePlan({ overdue_actions: 2 })],
      }));
      expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
    });
  });

  // ── Recommendations ────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends overdue assessment completion", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile({ next_review_date: "2026-03-01" })],
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("competency assessment"))).toBe(true);
      expect(r.recommendations[0].regulatory_ref).toBe("Reg 32");
    });

    it("recommends overdue action resolution as immediate", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        development_plans: [makePlan({ overdue_actions: 3 })],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("overdue"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends development plan creation when low coverage", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile()],
        development_plans: [],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("development plans"))).toBe(true);
    });
  });

  // ── Insights ───────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for high readiness + stage diversity", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", current_stage: "rsw", readiness_score: 75 }),
        makeProfile({ id: "p2", staff_id: "s2", current_stage: "senior_rsw", readiness_score: 80 }),
        makeProfile({ id: "p3", staff_id: "s3", current_stage: "deputy_manager", readiness_score: 70 }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles,
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("multi-level workforce"))).toBe(true);
    });

    it("generates warning for low readiness individual", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", readiness_score: 40 }),
        makeProfile({ id: "p2", staff_id: "s2", readiness_score: 80 }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles,
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("lowest readiness"))).toBe(true);
    });

    it("generates warning for large readiness gap", () => {
      const profiles = [
        makeProfile({ id: "p1", staff_id: "s1", readiness_score: 90 }),
        makeProfile({ id: "p2", staff_id: "s2", readiness_score: 45 }),
      ];
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles,
        development_plans: [makePlan({ staff_id: "s1" })],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("readiness gap"))).toBe(true);
    });
  });

  // ── Headlines ──────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline mentions readiness score", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: outstandingProfiles(),
        development_plans: outstandingPlans(),
      }));
      expect(r.headline).toContain("outstanding");
    });

    it("inadequate headline mentions urgent attention", () => {
      const profiles = Array(5).fill(null).map((_, i) =>
        makeProfile({ id: `p${i}`, staff_id: `s${i}`, readiness_score: 35, strengths_count: 1, development_areas_count: 5, next_review_date: "2026-03-01" }),
      );
      const r = computeHomeCompetencyLandscape(baseInput({ profiles }));
      expect(r.headline).toContain("urgent");
    });

    it("insufficient_data headline", () => {
      const r = computeHomeCompetencyLandscape(baseInput({ total_staff: 0 }));
      expect(r.headline).toContain("cannot be assessed");
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles profiles only (no plans)", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile()],
      }));
      expect(r.competency_rating).not.toBe("insufficient_data");
      expect(r.progression.active_plans).toBe(0);
    });

    it("handles plans only (no profiles)", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        development_plans: [makePlan()],
      }));
      expect(r.competency_rating).not.toBe("insufficient_data");
      expect(r.readiness.avg_readiness_score).toBe(0);
    });

    it("score is clamped to [0, 100]", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: outstandingProfiles(),
        development_plans: outstandingPlans(),
      }));
      expect(r.competency_score).toBeGreaterThanOrEqual(0);
      expect(r.competency_score).toBeLessThanOrEqual(100);
    });

    it("single staff member works", () => {
      const r = computeHomeCompetencyLandscape(baseInput({
        profiles: [makeProfile()],
        development_plans: [makePlan({ staff_id: "s1" })],
        total_staff: 1,
      }));
      expect(r.competency_rating).not.toBe("insufficient_data");
    });
  });
});
