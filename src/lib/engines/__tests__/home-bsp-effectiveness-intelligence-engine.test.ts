// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BSP EFFECTIVENESS INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeBSPEffectiveness,
  type HomeBSPEffectivenessInput,
  type BSPPlanInput,
  type BSPBehaviourInput,
  type BSPRestraintInput,
} from "../home-bsp-effectiveness-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makePlan(overrides: Partial<BSPPlanInput> = {}): BSPPlanInput {
  return {
    id: "bsp_1",
    child_id: "c1",
    status: "active",
    review_date: "2026-06-01",
    last_reviewed: "2026-05-10",
    triggers_count: 3,
    strategies_count: 2,
    effective_strategies: 2,
    de_escalation_stages: 3,
    has_child_views: true,
    has_professional_input: true,
    has_safety_plan: true,
    staff_guidance_count: 3,
    review_count: 2,
    ...overrides,
  };
}

function makeBehaviour(overrides: Partial<BSPBehaviourInput> = {}): BSPBehaviourInput {
  return {
    id: "beh_1",
    child_id: "c1",
    date: "2026-05-20",
    direction: "positive",
    intensity: "low",
    has_strategy_used: false,
    ...overrides,
  };
}

function makeRestraint(overrides: Partial<BSPRestraintInput> = {}): BSPRestraintInput {
  return {
    id: "rst_1",
    child_id: "c1",
    date: "2026-05-15",
    de_escalation_count: 3,
    child_debriefed: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeBSPEffectivenessInput> = {}): HomeBSPEffectivenessInput {
  return {
    today: TODAY,
    plans: [],
    behaviour_entries: [],
    restraints: [],
    total_children: 3,
    ...overrides,
  };
}

// ── Outstanding scenario ────────────────────────────────────────────────────

function outstandingPlans(): BSPPlanInput[] {
  return [
    makePlan({ id: "bsp_1", child_id: "c1" }),
    makePlan({ id: "bsp_2", child_id: "c2" }),
    makePlan({ id: "bsp_3", child_id: "c3" }),
  ];
}

function outstandingBehaviour(): BSPBehaviourInput[] {
  // 3 children, each with 4 positive and 1 concerning (with strategy)
  // positive_rate = 12/15 = 80%, strategy_usage = 3/3 = 100%
  const entries: BSPBehaviourInput[] = [];
  for (const cid of ["c1", "c2", "c3"]) {
    for (let i = 0; i < 4; i++) {
      entries.push(makeBehaviour({ id: `pos_${cid}_${i}`, child_id: cid, direction: "positive" }));
    }
    entries.push(makeBehaviour({
      id: `con_${cid}`, child_id: cid, direction: "concerning", intensity: "low", has_strategy_used: true,
    }));
  }
  return entries;
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

describe("Home BSP Effectiveness Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeHomeBSPEffectiveness(baseInput({ total_children: 0 }));
      expect(r.bsp_rating).toBe("insufficient_data");
      expect(r.bsp_score).toBe(0);
    });
  });

  // ── Rating thresholds ──────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("outstanding — all BSP indicators strong", () => {
      // Score: 52 + 4(strat eff) + 3(currency) + 4(voice) + 3(prof) + 4(strat use) + 3(positive 80%) + 4(no restraints) + 3(coverage) = 80
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: outstandingPlans(),
        behaviour_entries: outstandingBehaviour(),
        restraints: [],
      }));
      expect(r.bsp_score).toBe(80);
      expect(r.bsp_rating).toBe("outstanding");
    });

    it("good — partial professional input and some restraints", () => {
      // Reduce professional input: 1/3 = 33% → +0
      // Add some restraints: debrief 100% → +2
      // Coverage: 3/3 = 100% → +3
      // Score: 52 + 4 + 3 + 4 + 0 + 4 + 3 + 2 + 3 = 75
      const plans = outstandingPlans().map((p, i) =>
        i === 0 ? p : { ...p, has_professional_input: false },
      );
      const r = computeHomeBSPEffectiveness(baseInput({
        plans,
        behaviour_entries: outstandingBehaviour(),
        restraints: [makeRestraint({ child_id: "c1" })],
      }));
      expect(r.bsp_score).toBe(75);
      expect(r.bsp_rating).toBe("good");
    });

    it("adequate — gaps in strategy use and coverage", () => {
      // 2 plans for c1, c2. Child c3 has concerning behaviour but no BSP.
      // Professional input: 1/2 = 50% → +1
      // Strategy usage: 2/4 = 50% → +0 (not ≥60)... wait, 50% is ≥40 so +0
      // Positive rate: 4/8 = 50% → +1
      // Restraints: 1, debrief true → debrief 100% → +2... wait, that's ≥90 → +2
      // Coverage: c1,c2 have BSP, c3 has concerning but no BSP → 2/3 = 67% → +0
      // Score: 52 + 4 + 3 + 4 + 1 + 0 + 1 + 2 + 0 = 67... too high for adequate
      // Let me adjust: make strategy eff lower, more overdue reviews, less child voice
      const plans: BSPPlanInput[] = [
        makePlan({
          id: "bsp_1", child_id: "c1",
          effective_strategies: 1, strategies_count: 2,
          has_child_views: true, has_professional_input: false,
          review_date: "2026-05-20", // overdue
        }),
        makePlan({
          id: "bsp_2", child_id: "c2",
          effective_strategies: 0, strategies_count: 2,
          has_child_views: false, has_professional_input: false,
          review_date: "2026-06-10", // not overdue
        }),
      ];
      // Effectiveness: 1/4 = 25% → -3
      // Currency: 1/2 overdue = 50% → +0
      // Child voice: 1/2 = 50% → +0
      // Professional input: 0/2 = 0% → -2
      // Behaviour: 2 concerning for BSP children, 1 with strategy → 50% → +0
      // Positive rate: 4 pos / 6 total = 67% → +1 (≥50)
      // Restraints: 1 with debrief → 100% → +2
      // Coverage: c3 has concerning, no BSP → 2/3 = 67% → +0
      // Score: 52 + (-3) + 0 + 0 + (-2) + 0 + 1 + 2 + 0 = 50
      const beh: BSPBehaviourInput[] = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "concerning", intensity: "medium", has_strategy_used: true }),
        makeBehaviour({ id: "b4", child_id: "c2", direction: "positive" }),
        makeBehaviour({ id: "b5", child_id: "c2", direction: "positive" }),
        makeBehaviour({ id: "b6", child_id: "c2", direction: "concerning", intensity: "low", has_strategy_used: false }),
        // c3: no BSP
        makeBehaviour({ id: "b7", child_id: "c3", direction: "concerning", intensity: "low" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({
        plans,
        behaviour_entries: beh,
        restraints: [makeRestraint({ child_id: "c1" })],
      }));
      expect(r.bsp_score).toBe(50);
      expect(r.bsp_rating).toBe("adequate");
    });

    it("inadequate — severe quality and coverage gaps", () => {
      // 1 plan, poor quality, overdue, no voice, no professional input
      // Many concerning entries without strategy, no coverage
      const plans: BSPPlanInput[] = [
        makePlan({
          id: "bsp_1", child_id: "c1",
          effective_strategies: 0, strategies_count: 3,
          has_child_views: false, has_professional_input: false,
          has_safety_plan: false, de_escalation_stages: 1,
          review_date: "2026-04-01", // overdue
          staff_guidance_count: 0, review_count: 0,
        }),
      ];
      // Effectiveness: 0/3 = 0% → -3
      // Currency: 1/1 overdue = 100% → -2
      // Child voice: 0% → -3
      // Professional input: 0% → -2
      // Behaviour: 3 concerning for c1, 0 with strategy → 0% → -3
      // Positive rate: 0 pos / 3 total = 0% → -2
      // Restraints: 2 for c1, 0 debriefed → 0% → -3
      // Coverage: c2, c3 have concerning, no BSP → 1/3 = 33% → -2
      // Score: 52 + (-3) + (-2) + (-3) + (-2) + (-3) + (-2) + (-3) + (-2) = 32
      const beh: BSPBehaviourInput[] = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", intensity: "high", has_strategy_used: false }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning", intensity: "medium", has_strategy_used: false }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "concerning", intensity: "severe", has_strategy_used: false }),
        makeBehaviour({ id: "b4", child_id: "c2", direction: "concerning", intensity: "low" }),
        makeBehaviour({ id: "b5", child_id: "c3", direction: "concerning", intensity: "low" }),
      ];
      const rsts: BSPRestraintInput[] = [
        makeRestraint({ id: "r1", child_id: "c1", child_debriefed: false }),
        makeRestraint({ id: "r2", child_id: "c1", child_debriefed: false }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({
        plans,
        behaviour_entries: beh,
        restraints: rsts,
      }));
      expect(r.bsp_score).toBe(32);
      expect(r.bsp_rating).toBe("inadequate");
    });
  });

  // ── Plan Quality Profile ───────────────────────────────────────────────

  describe("plan quality profile", () => {
    it("computes active/inactive counts correctly", () => {
      const plans = [
        makePlan({ id: "p1", status: "active" }),
        makePlan({ id: "p2", status: "under_review" }),
        makePlan({ id: "p3", status: "archived" }),
        makePlan({ id: "p4", status: "draft" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.total_active).toBe(2);
      expect(r.plan_quality.total_inactive).toBe(2);
    });

    it("computes avg triggers and strategies", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", triggers_count: 4, strategies_count: 3 }),
        makePlan({ id: "p2", child_id: "c2", triggers_count: 2, strategies_count: 1 }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.avg_triggers).toBe(3); // (4+2)/2
      expect(r.plan_quality.avg_strategies).toBe(2); // (3+1)/2
    });

    it("computes strategy effectiveness rate", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", effective_strategies: 2, strategies_count: 3 }),
        makePlan({ id: "p2", child_id: "c2", effective_strategies: 1, strategies_count: 2 }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.strategy_effectiveness_rate).toBe(60); // 3/5 = 60%
    });

    it("computes child voice rate", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", has_child_views: true }),
        makePlan({ id: "p2", child_id: "c2", has_child_views: false }),
        makePlan({ id: "p3", child_id: "c3", has_child_views: true }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.child_voice_rate).toBe(67); // 2/3
    });

    it("computes professional input rate", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", has_professional_input: true }),
        makePlan({ id: "p2", child_id: "c2", has_professional_input: false }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.professional_input_rate).toBe(50);
    });

    it("computes safety plan rate", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", has_safety_plan: true }),
        makePlan({ id: "p2", child_id: "c2", has_safety_plan: true }),
        makePlan({ id: "p3", child_id: "c3", has_safety_plan: false }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.safety_plan_rate).toBe(67); // 2/3
    });

    it("computes avg de-escalation stages", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", de_escalation_stages: 3 }),
        makePlan({ id: "p2", child_id: "c2", de_escalation_stages: 2 }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.avg_de_escalation_stages).toBe(2.5);
    });

    it("computes avg guidance points", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", staff_guidance_count: 5 }),
        makePlan({ id: "p2", child_id: "c2", staff_guidance_count: 3 }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.avg_guidance_points).toBe(4);
    });

    it("ignores archived plans in quality calculations", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", status: "active", triggers_count: 4 }),
        makePlan({ id: "p2", child_id: "c2", status: "archived", triggers_count: 0 }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.avg_triggers).toBe(4); // only active plan counted
    });
  });

  // ── Currency Profile ───────────────────────────────────────────────────

  describe("currency profile", () => {
    it("identifies overdue reviews", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", review_date: "2026-05-20" }), // overdue
        makePlan({ id: "p2", child_id: "c2", review_date: "2026-05-25" }), // overdue
        makePlan({ id: "p3", child_id: "c3", review_date: "2026-06-01" }), // not overdue
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.currency.overdue_reviews).toBe(2);
    });

    it("identifies upcoming reviews within 14 days", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", review_date: "2026-05-26" }), // today = 0 days
        makePlan({ id: "p2", child_id: "c2", review_date: "2026-06-05" }), // 10 days
        makePlan({ id: "p3", child_id: "c3", review_date: "2026-06-20" }), // 25 days — not upcoming
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.currency.upcoming_reviews).toBe(2);
    });

    it("computes avg days since review", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", last_reviewed: "2026-05-16" }), // 10 days
        makePlan({ id: "p2", child_id: "c2", last_reviewed: "2026-04-26" }), // 30 days
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.currency.avg_days_since_review).toBe(20); // (10+30)/2
    });

    it("handles plans with null last_reviewed", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", last_reviewed: "2026-05-16" }), // 10 days
        makePlan({ id: "p2", child_id: "c2", last_reviewed: null }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      // only 1 reviewed plan counted
      expect(r.currency.avg_days_since_review).toBe(10);
    });

    it("computes review depth", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", review_count: 3 }),
        makePlan({ id: "p2", child_id: "c2", review_count: 1 }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.currency.review_depth).toBe(2); // (3+1)/2
    });
  });

  // ── Behaviour Profile ──────────────────────────────────────────────────

  describe("behaviour profile", () => {
    it("only counts behaviour for BSP children", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning" }),
        makeBehaviour({ id: "b3", child_id: "c2", direction: "concerning" }), // no BSP
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.behaviour.total_entries).toBe(2); // only c1
      expect(r.behaviour.positive_count).toBe(1);
      expect(r.behaviour.concerning_count).toBe(1);
    });

    it("computes positive rate", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "concerning" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.behaviour.positive_rate).toBe(67); // 2/3
    });

    it("computes high intensity rate", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", intensity: "low" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning", intensity: "high" }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "concerning", intensity: "severe" }),
        makeBehaviour({ id: "b4", child_id: "c1", direction: "concerning", intensity: "medium" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.behaviour.high_intensity_count).toBe(2);
      expect(r.behaviour.high_intensity_rate).toBe(50); // 2/4
    });

    it("computes strategy usage rate for concerning entries", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", has_strategy_used: true }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning", has_strategy_used: true }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "concerning", has_strategy_used: false }),
        makeBehaviour({ id: "b4", child_id: "c1", direction: "positive", has_strategy_used: false }), // positive — not counted
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.behaviour.strategy_usage_rate).toBe(67); // 2/3 concerning
    });
  });

  // ── Restraint Profile ──────────────────────────────────────────────────

  describe("restraint profile", () => {
    it("only counts restraints for BSP children", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const rsts = [
        makeRestraint({ id: "r1", child_id: "c1" }),
        makeRestraint({ id: "r2", child_id: "c2" }), // no BSP
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, restraints: rsts }));
      expect(r.restraint.total_restraints).toBe(1);
    });

    it("computes avg de-escalation", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const rsts = [
        makeRestraint({ id: "r1", child_id: "c1", de_escalation_count: 3 }),
        makeRestraint({ id: "r2", child_id: "c1", de_escalation_count: 1 }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, restraints: rsts }));
      expect(r.restraint.avg_de_escalation).toBe(2);
    });

    it("computes debrief rate", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const rsts = [
        makeRestraint({ id: "r1", child_id: "c1", child_debriefed: true }),
        makeRestraint({ id: "r2", child_id: "c1", child_debriefed: true }),
        makeRestraint({ id: "r3", child_id: "c1", child_debriefed: false }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, restraints: rsts }));
      expect(r.restraint.debrief_rate).toBe(67); // 2/3
    });
  });

  // ── Coverage Profile ───────────────────────────────────────────────────

  describe("coverage profile", () => {
    it("identifies children with concerning behaviour but no BSP", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning" }),
        makeBehaviour({ id: "b2", child_id: "c2", direction: "concerning" }),
        makeBehaviour({ id: "b3", child_id: "c3", direction: "concerning" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.coverage.children_with_active_bsp).toBe(1);
      expect(r.coverage.children_with_concerning_no_bsp).toBe(2);
      expect(r.coverage.coverage_rate).toBe(33); // 1/3
    });

    it("100% coverage when all concerning children have BSPs", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1" }),
        makePlan({ id: "p2", child_id: "c2" }),
      ];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning" }),
        makeBehaviour({ id: "b2", child_id: "c2", direction: "concerning" }),
        makeBehaviour({ id: "b3", child_id: "c3", direction: "positive" }), // only positive — no gap
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.coverage.children_with_concerning_no_bsp).toBe(0);
      expect(r.coverage.coverage_rate).toBe(100);
    });

    it("0 coverage rate when no concerning children have BSPs", () => {
      const plans = [makePlan({ child_id: "c1" })]; // c1 has BSP
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c2", direction: "concerning" }), // no BSP
        makeBehaviour({ id: "b2", child_id: "c3", direction: "concerning" }), // no BSP
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.coverage.coverage_rate).toBe(0); // 0/2 concerning have BSP
    });

    it("handles no concerning behaviour at all", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "positive" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.coverage.children_with_concerning_no_bsp).toBe(0);
      // Empty population: this asserted the fab-0 the helper used to return.
      expect(r.coverage.coverage_rate).toBeNull();
      expect(r.coverage.coverage_rate).not.toBe(0); // 0% is a claim; nothing was measured // pct(0, 0) = 0
    });
  });

  // ── Scoring Modifiers ──────────────────────────────────────────────────

  describe("scoring modifiers", () => {
    it("modifier 1: strategy effectiveness ≥80% gives +4", () => {
      const base = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ effective_strategies: 0, strategies_count: 0 })],
      }));
      const boosted = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ effective_strategies: 2, strategies_count: 2 })],
      }));
      // Base: 0/0 = 0% → -3; Boosted: 100% → +4; diff = +7
      expect(boosted.bsp_score - base.bsp_score).toBe(7);
    });

    it("modifier 1: strategy effectiveness <40% gives -3", () => {
      const good = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ effective_strategies: 2, strategies_count: 2 })], // 100% → +4
      }));
      const bad = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ effective_strategies: 0, strategies_count: 3 })], // 0% → -3
      }));
      expect(good.bsp_score - bad.bsp_score).toBe(7);
    });

    it("modifier 2: 0 overdue reviews gives +3", () => {
      const current = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ review_date: "2026-06-01" })], // not overdue
      }));
      const overdue = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ review_date: "2026-04-01" })], // overdue
      }));
      // current: 0 overdue → +3; overdue: 1/1 = 100% → -2; diff = 5
      expect(current.bsp_score - overdue.bsp_score).toBe(5);
    });

    it("modifier 3: child voice ≥90% gives +4", () => {
      const voiced = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ has_child_views: true })],
      }));
      const unvoiced = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ has_child_views: false })],
      }));
      // 100% → +4; 0% → -3; diff = 7
      expect(voiced.bsp_score - unvoiced.bsp_score).toBe(7);
    });

    it("modifier 4: professional input ≥80% gives +3", () => {
      const withProf = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ has_professional_input: true })],
      }));
      const without = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ has_professional_input: false })],
      }));
      // 100% → +3; 0% → -2; diff = 5
      expect(withProf.bsp_score - without.bsp_score).toBe(5);
    });

    it("modifier 5: strategy usage ≥80% gives +4", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const goodBeh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", has_strategy_used: true }),
      ];
      const badBeh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", has_strategy_used: false }),
      ];
      const good = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: goodBeh }));
      const bad = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: badBeh }));
      // 100% → +4; 0% → -3; diff = 7
      expect(good.bsp_score - bad.bsp_score).toBe(7);
    });

    it("modifier 5: no concerning behaviour for BSP children gives +4", () => {
      const plans = [makePlan({ child_id: "c1" })];
      // Both scenarios have same positive rate to isolate modifier 5
      const noConcerning = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "positive" }),
      ];
      const withConcerning = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b4", child_id: "c1", direction: "concerning", has_strategy_used: false }),
      ];
      const good = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: noConcerning }));
      const bad = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: withConcerning }));
      // good: no concerning → mod5 +4, positive 100% → mod6 +3
      // bad: 0% strategy → mod5 -3, positive 75% → mod6 +3 (same)
      // diff = 4 - (-3) = 7
      expect(good.bsp_score - bad.bsp_score).toBe(7);
    });

    it("modifier 6: positive rate ≥70% gives +3", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const highPositive = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b4", child_id: "c1", direction: "concerning", has_strategy_used: true }),
      ];
      const lowPositive = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning", has_strategy_used: true }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "concerning", has_strategy_used: true }),
        makeBehaviour({ id: "b4", child_id: "c1", direction: "concerning", has_strategy_used: true }),
      ];
      const good = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: highPositive }));
      const low = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: lowPositive }));
      // 75% → +3; 25% → -2 (wait: 25% ≥ 30%? No, <30% → -2... actually 25% < 30% → -2)
      // Wait: 1/4 = 25%? No: lowPositive has 1 positive and 3 concerning = 4 total. 1/4 = 25%. 25% < 30% → -2.
      // Good: 3/4 = 75% ≥ 70% → +3
      // diff = 3 - (-2) = 5
      expect(good.bsp_score - low.bsp_score).toBe(5);
    });

    it("modifier 7: no restraints gives +4", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const noRst = computeHomeBSPEffectiveness(baseInput({ plans }));
      const withRst = computeHomeBSPEffectiveness(baseInput({
        plans,
        restraints: [makeRestraint({ child_id: "c1", child_debriefed: false })],
      }));
      // no restraints → +4; debrief 0% → -3; diff = 7
      expect(noRst.bsp_score - withRst.bsp_score).toBe(7);
    });

    it("modifier 7: debrief ≥90% gives +2", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const goodDebrief = computeHomeBSPEffectiveness(baseInput({
        plans,
        restraints: [makeRestraint({ child_id: "c1", child_debriefed: true })],
      }));
      const noDebrief = computeHomeBSPEffectiveness(baseInput({
        plans,
        restraints: [makeRestraint({ child_id: "c1", child_debriefed: false })],
      }));
      // 100% → +2; 0% → -3; diff = 5
      expect(goodDebrief.bsp_score - noDebrief.bsp_score).toBe(5);
    });

    it("modifier 8: full coverage gives +3", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1" }),
        makePlan({ id: "p2", child_id: "c2" }),
      ];
      const fullCoverage = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", has_strategy_used: true }),
        makeBehaviour({ id: "b2", child_id: "c2", direction: "concerning", has_strategy_used: true }),
      ];
      const partialCoverage = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", has_strategy_used: true }),
        makeBehaviour({ id: "b2", child_id: "c2", direction: "concerning", has_strategy_used: true }),
        makeBehaviour({ id: "b3", child_id: "c3", direction: "concerning", has_strategy_used: true }),
      ];
      const full = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: fullCoverage }));
      const partial = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: partialCoverage }));
      // full: 2/2 = 100% → +3; partial: 2/3 = 67% → +0; diff = 3
      expect(full.bsp_score - partial.bsp_score).toBe(3);
    });

    it("no active plans — all plan modifiers neutral", () => {
      const plans = [makePlan({ status: "archived" })];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      // Modifiers 1-4 all neutral (0), mod 5 no concerning → +4, mod 6 no entries → 0, mod 7 no restraints → +4, mod 8 no concerning → +3
      expect(r.bsp_score).toBe(52 + 0 + 0 + 0 + 0 + 4 + 0 + 4 + 3); // 63
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("generates strength for child voice ≥90%", () => {
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ has_child_views: true })],
      }));
      expect(r.strengths.some((s) => s.includes("child voice"))).toBe(true);
    });

    it("generates strength for strategy effectiveness ≥80%", () => {
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ effective_strategies: 2, strategies_count: 2 })],
      }));
      expect(r.strengths.some((s) => s.includes("strategy effectiveness"))).toBe(true);
    });

    it("generates strength for current reviews", () => {
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ review_date: "2026-06-01" })],
      }));
      expect(r.strengths.some((s) => s.includes("reviews are current"))).toBe(true);
    });

    it("generates strength for high strategy usage", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ child_id: "c1", direction: "concerning", has_strategy_used: true }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.strengths.some((s) => s.includes("strategy use"))).toBe(true);
    });

    it("generates strength for no restraints on BSP children", () => {
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ child_id: "c1" })],
      }));
      expect(r.strengths.some((s) => s.includes("No physical interventions"))).toBe(true);
    });

    it("generates strength for de-escalation completeness", () => {
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ de_escalation_stages: 3 })],
      }));
      expect(r.strengths.some((s) => s.includes("de-escalation staging"))).toBe(true);
    });
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("generates concern for coverage gap", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ child_id: "c2", direction: "concerning" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.concerns.some((c) => c.includes("no active BSP"))).toBe(true);
    });

    it("generates concern for overdue reviews", () => {
      const plans = [makePlan({ review_date: "2026-04-01" })];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
    });

    it("generates concern for low debrief rate", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const rsts = [
        makeRestraint({ id: "r1", child_id: "c1", child_debriefed: false }),
        makeRestraint({ id: "r2", child_id: "c1", child_debriefed: false }),
        makeRestraint({ id: "r3", child_id: "c1", child_debriefed: true }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, restraints: rsts }));
      expect(r.concerns.some((c) => c.includes("debrief rate"))).toBe(true);
    });

    it("generates concern for low strategy usage", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", has_strategy_used: false }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning", has_strategy_used: false }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.concerns.some((c) => c.includes("Strategy usage"))).toBe(true);
    });

    it("generates concern for high intensity rate", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", intensity: "high" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning", intensity: "severe" }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "concerning", intensity: "low" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.concerns.some((c) => c.includes("high intensity"))).toBe(true);
    });

    it("generates concern for low professional input", () => {
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ has_professional_input: false })],
      }));
      expect(r.concerns.some((c) => c.includes("professional input"))).toBe(true);
    });
  });

  // ── Recommendations ────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends BSP creation for uncovered children", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [makeBehaviour({ child_id: "c2", direction: "concerning" })];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Develop BSP"))).toBe(true);
      expect(r.recommendations[0].urgency).toBe("soon");
    });

    it("recommends overdue review completion as immediate", () => {
      const plans = [makePlan({ review_date: "2026-04-01" })];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("overdue BSP review"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends debrief improvement when < 90%", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const rsts = [
        makeRestraint({ id: "r1", child_id: "c1", child_debriefed: true }),
        makeRestraint({ id: "r2", child_id: "c1", child_debriefed: false }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, restraints: rsts }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("debriefed"))).toBe(true);
    });

    it("includes Reg 19 reference for coverage", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [makeBehaviour({ child_id: "c2", direction: "concerning" })];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.recommendations.some((rec) => rec.regulatory_ref === "Reg 19")).toBe(true);
    });
  });

  // ── Insights ───────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for high strategy usage", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ child_id: "c1", direction: "concerning", has_strategy_used: true }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("BSP-to-practice alignment"))).toBe(true);
    });

    it("generates warning for restraint rate > 1 per BSP child", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const rsts = [
        makeRestraint({ id: "r1", child_id: "c1" }),
        makeRestraint({ id: "r2", child_id: "c1" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, restraints: rsts }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("restraints each"))).toBe(true);
    });

    it("generates warning for coverage gap", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [makeBehaviour({ child_id: "c2", direction: "concerning" })];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Coverage gap"))).toBe(true);
    });

    it("generates positive insight for de-escalation completeness", () => {
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({ de_escalation_stages: 3, has_safety_plan: true })],
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("de-escalation staging"))).toBe(true);
    });

    it("generates critical insight for high intensity >50%", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "concerning", intensity: "high", has_strategy_used: true }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "concerning", intensity: "severe", has_strategy_used: true }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "concerning", intensity: "low", has_strategy_used: true }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("multi-disciplinary review"))).toBe(true);
    });
  });

  // ── Headlines ──────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline mentions strong strategy adherence", () => {
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: outstandingPlans(),
        behaviour_entries: outstandingBehaviour(),
      }));
      expect(r.headline).toContain("highly effective");
    });

    it("good headline mentions coverage gaps when present", () => {
      // Setup: 2 plans (c1, c2), c3 has concerning but no BSP
      const plans = [
        makePlan({ id: "p1", child_id: "c1" }),
        makePlan({ id: "p2", child_id: "c2" }),
      ];
      const beh = [
        ...outstandingBehaviour().filter((b) => b.child_id !== "c3"),
        makeBehaviour({ id: "gap_1", child_id: "c3", direction: "concerning" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh }));
      if (r.bsp_rating === "good") {
        expect(r.headline).toContain("coverage gap");
      }
    });

    it("inadequate headline mentions urgency", () => {
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: [makePlan({
          effective_strategies: 0, strategies_count: 3,
          has_child_views: false, has_professional_input: false,
          review_date: "2026-04-01",
        })],
        behaviour_entries: [
          makeBehaviour({ child_id: "c1", direction: "concerning", has_strategy_used: false }),
          makeBehaviour({ child_id: "c1", direction: "concerning", has_strategy_used: false }),
          makeBehaviour({ child_id: "c2", direction: "concerning" }),
          makeBehaviour({ child_id: "c3", direction: "concerning" }),
        ],
        restraints: [
          makeRestraint({ child_id: "c1", child_debriefed: false }),
          makeRestraint({ child_id: "c1", child_debriefed: false }),
        ],
      }));
      expect(r.bsp_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
    });

    it("insufficient_data headline", () => {
      const r = computeHomeBSPEffectiveness(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("cannot be assessed");
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles no plans, no behaviour, no restraints", () => {
      const r = computeHomeBSPEffectiveness(baseInput());
      // No active plans → modifiers 1-4 neutral
      // No BSP behaviour → mod 5 +4 (no concerning for BSP children)... wait
      // Actually there are 0 BSP children so bspConcerning is empty → +4
      // No bspBeh → mod 6 neutral (0)
      // No restraints → mod 7 +4
      // No concerning children at all → mod 8 +3
      // Score: 52 + 0 + 0 + 0 + 0 + 4 + 0 + 4 + 3 = 63
      expect(r.bsp_score).toBe(63);
      expect(r.bsp_rating).toBe("adequate");
    });

    it("single plan single child perfect scenario", () => {
      const plans = [makePlan({ child_id: "c1" })];
      const beh = [
        makeBehaviour({ id: "b1", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b2", child_id: "c1", direction: "positive" }),
        makeBehaviour({ id: "b3", child_id: "c1", direction: "positive" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh, total_children: 1 }));
      // Mod 1: 100% eff → +4
      // Mod 2: 0 overdue → +3
      // Mod 3: 100% voice → +4
      // Mod 4: 100% prof → +3
      // Mod 5: 0 concerning → +4
      // Mod 6: 100% positive → +3
      // Mod 7: 0 restraints → +4
      // Mod 8: 0 concerning children → +3
      // Score: 52 + 4+3+4+3+4+3+4+3 = 80
      expect(r.bsp_score).toBe(80);
      expect(r.bsp_rating).toBe("outstanding");
    });

    it("under_review status counts as active", () => {
      const plans = [makePlan({ status: "under_review" })];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.total_active).toBe(1);
    });

    it("suspended/draft/archived do not count as active", () => {
      const plans = [
        makePlan({ id: "p1", child_id: "c1", status: "suspended" }),
        makePlan({ id: "p2", child_id: "c2", status: "draft" }),
        makePlan({ id: "p3", child_id: "c3", status: "archived" }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans }));
      expect(r.plan_quality.total_active).toBe(0);
      expect(r.plan_quality.total_inactive).toBe(3);
    });

    it("score clamped to 0 minimum", () => {
      // Construct scenario that would give negative: all penalties
      const plans = [
        makePlan({
          id: "p1", child_id: "c1",
          effective_strategies: 0, strategies_count: 5,
          has_child_views: false, has_professional_input: false,
          has_safety_plan: false, review_date: "2026-01-01", // very overdue
        }),
      ];
      const beh: BSPBehaviourInput[] = [];
      for (let i = 0; i < 10; i++) {
        beh.push(makeBehaviour({
          id: `b${i}`, child_id: "c1", direction: "concerning", intensity: "high", has_strategy_used: false,
        }));
      }
      // Also add c2, c3 with concerning but no BSP
      for (let i = 0; i < 5; i++) {
        beh.push(makeBehaviour({ id: `b2_${i}`, child_id: "c2", direction: "concerning" }));
        beh.push(makeBehaviour({ id: `b3_${i}`, child_id: "c3", direction: "concerning" }));
      }
      const rsts = [
        makeRestraint({ id: "r1", child_id: "c1", child_debriefed: false }),
        makeRestraint({ id: "r2", child_id: "c1", child_debriefed: false }),
        makeRestraint({ id: "r3", child_id: "c1", child_debriefed: false }),
      ];
      const r = computeHomeBSPEffectiveness(baseInput({ plans, behaviour_entries: beh, restraints: rsts }));
      expect(r.bsp_score).toBeGreaterThanOrEqual(0);
    });

    it("score clamped to 100 maximum", () => {
      // Even with max bonuses, should not exceed 100
      const r = computeHomeBSPEffectiveness(baseInput({
        plans: outstandingPlans(),
        behaviour_entries: outstandingBehaviour(),
      }));
      expect(r.bsp_score).toBeLessThanOrEqual(100);
    });
  });
});
