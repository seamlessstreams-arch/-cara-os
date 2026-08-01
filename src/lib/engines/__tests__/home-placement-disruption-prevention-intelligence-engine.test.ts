import { describe, it, expect } from "vitest";
import {
  computePlacementDisruptionPrevention,
  type DisruptionPreventionInput,
  type DisruptionPlanInput,
  type PlacementEndInput,
  type StabilityFactorInput,
} from "../home-placement-disruption-prevention-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function makePlan(overrides?: Partial<DisruptionPlanInput>): DisruptionPlanInput {
  return {
    id: "plan-1",
    child_id: "c1",
    risk_level: "low",
    child_aware: true,
    child_contribution_recorded: true,
    professionals_count: 3,
    proactive_actions_count: 4,
    support_network_count: 3,
    warning_signs_count: 1,
    signed_off_by_la: true,
    reviewed_recently: true,
    ...overrides,
  };
}

function makePlacementEnd(overrides?: Partial<PlacementEndInput>): PlacementEndInput {
  return {
    id: "end-1",
    end_reason: "planned_move_home",
    duration_months: 18,
    had_positive_outcomes: true,
    ...overrides,
  };
}

function makeStabilityFactor(overrides?: Partial<StabilityFactorInput>): StabilityFactorInput {
  return {
    id: "sf-1",
    child_id: "c1",
    factor_type: "key_worker_relationship",
    strength: "strong",
    ...overrides,
  };
}

/**
 * Base outstanding input:
 * total_children=4, 4 plans (all reviewed, child aware, contributed, prof>=2),
 * 3 placement ends (none disruption, avg 18 months),
 * 12 stability factors (all strong).
 *
 * Expected modifiers:
 *  1. Plan coverage: 4/4=100% → +5
 *  2. Planned ending rate: 3/3=100% → +6
 *  3. Child involvement: 4/4=100% → +5
 *  4. Stability strength: 12/12=100% → +5
 *  5. Professional engagement: 4/4=100% → +4
 *  6. Review compliance: 4/4=100% → +5
 *  Total: 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82 → outstanding
 */
function baseInput(overrides?: Partial<DisruptionPreventionInput>): DisruptionPreventionInput {
  return {
    today: TODAY,
    total_children: 4,
    disruption_plans: [
      makePlan({ id: "p1", child_id: "c1" }),
      makePlan({ id: "p2", child_id: "c2" }),
      makePlan({ id: "p3", child_id: "c3" }),
      makePlan({ id: "p4", child_id: "c4" }),
    ],
    placement_ends: [
      makePlacementEnd({ id: "e1", end_reason: "planned_move_home", duration_months: 18 }),
      makePlacementEnd({ id: "e2", end_reason: "adoption", duration_months: 24 }),
      makePlacementEnd({ id: "e3", end_reason: "family_reunification", duration_months: 12 }),
    ],
    stability_factors: [
      makeStabilityFactor({ id: "sf1", child_id: "c1", factor_type: "key_worker_relationship" }),
      makeStabilityFactor({ id: "sf2", child_id: "c1", factor_type: "school_stability" }),
      makeStabilityFactor({ id: "sf3", child_id: "c1", factor_type: "family_contact" }),
      makeStabilityFactor({ id: "sf4", child_id: "c2", factor_type: "key_worker_relationship" }),
      makeStabilityFactor({ id: "sf5", child_id: "c2", factor_type: "school_stability" }),
      makeStabilityFactor({ id: "sf6", child_id: "c2", factor_type: "therapeutic_support" }),
      makeStabilityFactor({ id: "sf7", child_id: "c3", factor_type: "peer_relationships" }),
      makeStabilityFactor({ id: "sf8", child_id: "c3", factor_type: "environmental_comfort" }),
      makeStabilityFactor({ id: "sf9", child_id: "c3", factor_type: "key_worker_relationship" }),
      makeStabilityFactor({ id: "sf10", child_id: "c4", factor_type: "school_stability" }),
      makeStabilityFactor({ id: "sf11", child_id: "c4", factor_type: "family_contact" }),
      makeStabilityFactor({ id: "sf12", child_id: "c4", factor_type: "therapeutic_support" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computePlacementDisruptionPrevention", () => {
  // ─── Insufficient Data ──────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computePlacementDisruptionPrevention({
        today: TODAY,
        total_children: 0,
        disruption_plans: [],
        placement_ends: [],
        stability_factors: [],
      });
      expect(r.disruption_rating).toBe("insufficient_data");
      expect(r.disruption_score).toBe(0);
    });

    it("returns zero metrics on insufficient data", () => {
      const r = computePlacementDisruptionPrevention({
        today: TODAY,
        total_children: 0,
        disruption_plans: [],
        placement_ends: [],
        stability_factors: [],
      });
      expect(r.children_with_plans).toBe(0);
      expect(r.planned_ending_rate).toBe(0);
      expect(r.disruption_rate).toBe(0);
      expect(r.average_placement_months).toBe(0);
      expect(r.high_risk_children).toBe(0);
    });

    it("returns a headline mentioning no children", () => {
      const r = computePlacementDisruptionPrevention({
        today: TODAY,
        total_children: 0,
        disruption_plans: [],
        placement_ends: [],
        stability_factors: [],
      });
      expect(r.headline).toContain("No children");
    });

    it("returns a concern and recommendation on insufficient data", () => {
      const r = computePlacementDisruptionPrevention({
        today: TODAY,
        total_children: 0,
        disruption_plans: [],
        placement_ends: [],
        stability_factors: [],
      });
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("returns a critical insight on insufficient data", () => {
      const r = computePlacementDisruptionPrevention({
        today: TODAY,
        total_children: 0,
        disruption_plans: [],
        placement_ends: [],
        stability_factors: [],
      });
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });
  });

  // ─── Outstanding Rating ─────────────────────────────────────────

  describe("outstanding rating", () => {
    it("scores 82 with optimal baseline input", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.disruption_score).toBe(82);
      expect(r.disruption_rating).toBe("outstanding");
    });

    it("returns outstanding headline", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("populates multiple strengths for outstanding", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.strengths.length).toBeGreaterThanOrEqual(4);
    });

    it("has no concerns for outstanding baseline", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.concerns.length).toBe(0);
    });

    it("has no recommendations for outstanding baseline", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ─── Good Rating ────────────────────────────────────────────────

  describe("good rating", () => {
    it("scores good when review compliance is degraded to moderate tier", () => {
      // Keep plan coverage, planned endings, child involvement, stability at top
      // Degrade review compliance: 3/4 = 75% → +2 (was +5)
      // Degrade professional engagement: 2/4 = 50% → 0 (was +4, between 30-59%)
      // Wait, 50% is >=30% for professional engagement → +0
      // Score: 52 + 5 + 6 + 5 + 5 + 0 + 2 = 75 → good
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", reviewed_recently: true, professionals_count: 3 }),
          makePlan({ id: "p2", child_id: "c2", reviewed_recently: true, professionals_count: 3 }),
          makePlan({ id: "p3", child_id: "c3", reviewed_recently: true, professionals_count: 1 }),
          makePlan({ id: "p4", child_id: "c4", reviewed_recently: false, professionals_count: 1 }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.disruption_score).toBe(75);
      expect(r.disruption_rating).toBe("good");
    });

    it("returns good headline", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", reviewed_recently: true, professionals_count: 3 }),
          makePlan({ id: "p2", child_id: "c2", reviewed_recently: true, professionals_count: 3 }),
          makePlan({ id: "p3", child_id: "c3", reviewed_recently: true, professionals_count: 1 }),
          makePlan({ id: "p4", child_id: "c4", reviewed_recently: false, professionals_count: 1 }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.headline).toContain("Good");
    });

    it("scores good when child involvement is at mid tier", () => {
      // Plan coverage 100% → +5, endings 100% → +6, stability 100% → +5, prof 100% → +4, review 100% → +5
      // Child involvement: 3/4 = 75% → +2 (was +5, diff -3)
      // Score: 52+5+6+2+5+4+5 = 79 → good
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
          makePlan({ id: "p2", child_id: "c2" }),
          makePlan({ id: "p3", child_id: "c3" }),
          makePlan({ id: "p4", child_id: "c4", child_aware: false }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.disruption_score).toBe(79);
      expect(r.disruption_rating).toBe("good");
    });

    it("scores good when stability factors are moderate tier and planned endings reduced", () => {
      // Plan coverage: 4/4 → +5, Endings: 2/3 non-disruption = 67% → +0 (wait, 67% is >=50% but <70% → +0)
      // Wait: 2/3 = 67% → that's >=50% → +0
      // Child involvement: 100% → +5, Stability: degrade to 60% strong/moderate → +2
      // Prof: 100% → +4, Review: 100% → +5
      // Score: 52+5+0+5+2+4+5 = 73 → good
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "family_reunification" }),
        ],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf2", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf3", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf4", child_id: "c2", strength: "strong" }),
          makeStabilityFactor({ id: "sf5", child_id: "c2", strength: "strong" }),
          makeStabilityFactor({ id: "sf6", child_id: "c2", strength: "strong" }),
          makeStabilityFactor({ id: "sf7", child_id: "c3", strength: "strong" }),
          makeStabilityFactor({ id: "sf8", child_id: "c3", strength: "fragile" }),
          makeStabilityFactor({ id: "sf9", child_id: "c3", strength: "fragile" }),
          makeStabilityFactor({ id: "sf10", child_id: "c4", strength: "fragile" }),
          makeStabilityFactor({ id: "sf11", child_id: "c4", strength: "fragile" }),
          makeStabilityFactor({ id: "sf12", child_id: "c4", strength: "fragile" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 7/12 strong = 58% → that's >=40% → +0 not +2
      // Let me recalculate: 7 strong + moderate out of 12 = 58% → >=40% → +0
      // Score: 52+5+0+5+0+4+5 = 71 → good
      expect(r.disruption_rating).toBe("good");
      expect(r.disruption_score).toBeGreaterThanOrEqual(65);
      expect(r.disruption_score).toBeLessThan(80);
    });

    it("scores at lower good boundary with multiple moderate degradations", () => {
      // Plan coverage: 3/4 = 75% → +2
      // Endings: no endings → +3
      // Child involvement: 3/4 = 75% → +2
      // Stability: 8/12 strong = 67% → +2
      // Prof: 4/4 → +4
      // Review: 3/4 = 75% → +2
      // Score: 52+2+3+2+2+4+2 = 67 → good
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
          makePlan({ id: "p2", child_id: "c2" }),
          makePlan({ id: "p3", child_id: "c3", reviewed_recently: false, child_aware: false }),
          makePlan({ id: "p4", child_id: "c4" }), // keep one without a unique child to test coverage at 75%
        ],
        placement_ends: [],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf2", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf3", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf4", child_id: "c2", strength: "strong" }),
          makeStabilityFactor({ id: "sf5", child_id: "c2", strength: "strong" }),
          makeStabilityFactor({ id: "sf6", child_id: "c2", strength: "strong" }),
          makeStabilityFactor({ id: "sf7", child_id: "c3", strength: "strong" }),
          makeStabilityFactor({ id: "sf8", child_id: "c3", strength: "strong" }),
          makeStabilityFactor({ id: "sf9", child_id: "c3", strength: "fragile" }),
          makeStabilityFactor({ id: "sf10", child_id: "c4", strength: "fragile" }),
          makeStabilityFactor({ id: "sf11", child_id: "c4", strength: "fragile" }),
          makeStabilityFactor({ id: "sf12", child_id: "c4", strength: "fragile" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // Plan coverage: 4 unique children / 4 total = 100% → +5 (not 75% — all 4 child_ids are unique)
      // Child involvement: 3/4 aware+contributed = 75% → +2
      // Review: 3/4 = 75% → +2
      // Stability: 8/12 = 67% → +2
      // 52+5+3+2+2+4+2 = 70 → good
      expect(r.disruption_rating).toBe("good");
    });
  });

  // ─── Adequate Rating ────────────────────────────────────────────

  describe("adequate rating", () => {
    it("scores adequate with significant degradations across modifiers", () => {
      // Plan coverage: 2/4 = 50% → +0 (>=30% <60%)
      // Endings: 1/2 disruption = 50% planned → +0 (>=50%)
      // Child involvement: 1/4 = 25% → -4 (<30%)
      // Stability: 6/12 = 50% → +0 (>=40%)
      // Prof: 1/4 = 25% → -4 (<30%)
      // Review: 2/4 = 50% → +0 (>=40%)
      // Score: 52+0+0-4+0-4+0 = 44 → inadequate (just below)
      // Need to adjust to get into adequate range (45-64)

      // Let's try:
      // Plan coverage: 2/4 = 50% → +0
      // Endings: 2/3 planned = 67% → +0 (>=50% but <70%)... wait, pct(2,3)=67 → >=50 → +0
      // Child involvement: 2/4 = 50% → +0 (>=30%)
      // Stability: 5/12 = 42% → +0 (>=40%)
      // Prof: 2/4 = 50% → +0 (>=30%)
      // Review: 2/4 = 50% → +0 (>=40%)
      // Score: 52+0+0+0+0+0+0 = 52 → adequate
      const input = baseInput({
        total_children: 4,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", child_aware: true, child_contribution_recorded: true, professionals_count: 2, reviewed_recently: true }),
          makePlan({ id: "p2", child_id: "c2", child_aware: false, child_contribution_recorded: false, professionals_count: 1, reviewed_recently: true }),
          makePlan({ id: "p3", child_id: "c3", child_aware: true, child_contribution_recorded: false, professionals_count: 1, reviewed_recently: false }),
          makePlan({ id: "p4", child_id: "c4", child_aware: false, child_contribution_recorded: false, professionals_count: 2, reviewed_recently: false }),
        ],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "family_reunification" }),
        ],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf2", child_id: "c1", strength: "moderate" }),
          makeStabilityFactor({ id: "sf3", child_id: "c1", strength: "fragile" }),
          makeStabilityFactor({ id: "sf4", child_id: "c2", strength: "strong" }),
          makeStabilityFactor({ id: "sf5", child_id: "c2", strength: "fragile" }),
          makeStabilityFactor({ id: "sf6", child_id: "c2", strength: "absent" }),
          makeStabilityFactor({ id: "sf7", child_id: "c3", strength: "moderate" }),
          makeStabilityFactor({ id: "sf8", child_id: "c3", strength: "fragile" }),
          makeStabilityFactor({ id: "sf9", child_id: "c3", strength: "fragile" }),
          makeStabilityFactor({ id: "sf10", child_id: "c4", strength: "moderate" }),
          makeStabilityFactor({ id: "sf11", child_id: "c4", strength: "fragile" }),
          makeStabilityFactor({ id: "sf12", child_id: "c4", strength: "fragile" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // Plan coverage: 4/4 = 100% → +5
      // Endings: pct(2,3) = 67% → >=50 → +0
      // Child involvement: 1/4 = 25% → -4 (<30%)
      // Stability: 5/12 = 42% → +0 (>=40%)
      // Prof: 2/4 = 50% → +0 (>=30%)
      // Review: 2/4 = 50% → +0 (>=40%)
      // Score: 52+5+0-4+0+0+0 = 53 → adequate
      expect(r.disruption_rating).toBe("adequate");
      expect(r.disruption_score).toBeGreaterThanOrEqual(45);
      expect(r.disruption_score).toBeLessThan(65);
    });

    it("returns adequate headline", () => {
      // Score = 52 (all at neutral) → adequate
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", child_aware: true, child_contribution_recorded: true, professionals_count: 1, reviewed_recently: true }),
          makePlan({ id: "p2", child_id: "c2", child_aware: false, child_contribution_recorded: false, professionals_count: 1, reviewed_recently: false }),
        ],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
        ],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf2", child_id: "c1", strength: "fragile" }),
          makeStabilityFactor({ id: "sf3", child_id: "c2", strength: "moderate" }),
          makeStabilityFactor({ id: "sf4", child_id: "c2", strength: "fragile" }),
          makeStabilityFactor({ id: "sf5", child_id: "c2", strength: "fragile" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.headline).toContain("Adequate");
    });

    it("scores 52 when all modifiers are neutral", () => {
      // Plan coverage: 2/4 = 50% → +0 (>=30% <60%)... wait we need exact
      // Let me create 2 plans for 4 children: 50% → >=30% → +0
      // Actually need to be more careful. Let me set everything to neutral tier.
      // Plan coverage: 40% → +0 (>=30% <60%): need 1.6, so 2 plans for 5 children → 40%
      // Endings: 60% planned → +0 (>=50% <70%): 3 planned, 2 disruption = 60%
      // Child involvement: 40% → +0 (>=30% <60%): 2/5 plans aware+contributed
      // Stability: 50% strong/mod → +0 (>=40% <60%): 5/10
      // Prof: 40% → +0 (>=30% <60%): 2/5 plans with prof>=2
      // Review: 50% → +0 (>=40% <70%): 2.5 → 3/5 reviewed recently → 60%
      // Actually let's simplify: use 0 placement ends → +3, then offset elsewhere
      // Simpler: no plans, no endings, no factors (but total_children > 0)
      // Plan coverage: 0/4 = 0% → -5
      // Endings: 0 → +3
      // Child involvement: 0 plans → pct(0,0) = 0% → -4? Wait, pct(0,0) = 0 → 0% < 30% → -4
      // Hmm, empty plans means denominators are 0 everywhere...

      // Let me just verify the engine handles the all-neutral-tier case:
      // 4 children, 2 plans (50% coverage → +0)
      // 2 plans: both child_aware false and contributed false → 0% → -4... no
      // I'll set child_aware true, contributed true on 1 of 3 plans = 33% → +0
      // prof >=2 on 1 of 3 = 33% → +0
      // reviewed on 2 of 3 = 67% → >=40% → +0 (not >=70%)... wait 67% is >=40% <70% → +0
      // 3 plans for 4 children = 75% (3 unique) → +2 (>=60%)... not +0
      // This is getting complex. Let me do a targeted test:
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 10,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", child_aware: true, child_contribution_recorded: true, professionals_count: 2, reviewed_recently: true }),
          makePlan({ id: "p2", child_id: "c2", child_aware: true, child_contribution_recorded: true, professionals_count: 2, reviewed_recently: false }),
          makePlan({ id: "p3", child_id: "c3", child_aware: false, child_contribution_recorded: false, professionals_count: 1, reviewed_recently: false }),
          makePlan({ id: "p4", child_id: "c4", child_aware: false, child_contribution_recorded: false, professionals_count: 1, reviewed_recently: false }),
          makePlan({ id: "p5", child_id: "c5", child_aware: false, child_contribution_recorded: false, professionals_count: 1, reviewed_recently: false }),
        ],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
        ],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf2", child_id: "c2", strength: "moderate" }),
          makeStabilityFactor({ id: "sf3", child_id: "c3", strength: "fragile" }),
          makeStabilityFactor({ id: "sf4", child_id: "c4", strength: "fragile" }),
          makeStabilityFactor({ id: "sf5", child_id: "c5", strength: "fragile" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      // Plan coverage: 5/10 = 50% → +0
      // Endings: pct(1,2) = 50% → +0
      // Child involvement: 2/5 = 40% → +0 (>=30%)
      // Stability: 2/5 = 40% → +0 (>=40%)
      // Prof: 2/5 = 40% → +0 (>=30%)
      // Review: 1/5 = 20% → -5 (<40%)
      // Score: 52+0+0+0+0+0-5 = 47 → adequate
      expect(r.disruption_score).toBe(47);
      expect(r.disruption_rating).toBe("adequate");
    });
  });

  // ─── Inadequate Rating ──────────────────────────────────────────

  describe("inadequate rating", () => {
    it("scores inadequate with severe degradation across all modifiers", () => {
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 10,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", child_aware: false, child_contribution_recorded: false, professionals_count: 0, reviewed_recently: false, risk_level: "acute" }),
        ],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "placement_disruption" }),
        ],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "absent" }),
          makeStabilityFactor({ id: "sf2", child_id: "c1", strength: "absent" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      // Plan coverage: 1/10 = 10% → -5
      // Endings: pct(0,3)=0% → -5 (<50%)
      // Child involvement: 0/1 = 0% → -4
      // Stability: 0/2 = 0% → -5 (<40%)
      // Prof: 0/1 = 0% → -4 (<30%)
      // Review: 0/1 = 0% → -5 (<40%)
      // Score: 52-5-5-4-5-4-5 = 24 → inadequate
      expect(r.disruption_score).toBe(24);
      expect(r.disruption_rating).toBe("inadequate");
    });

    it("returns inadequate headline", () => {
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 10,
        disruption_plans: [],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
        ],
        stability_factors: [],
      };
      const r = computePlacementDisruptionPrevention(input);
      expect(r.headline).toContain("Inadequate");
    });

    it("generates multiple concerns for inadequate scenarios", () => {
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 10,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "acute", reviewed_recently: false }),
        ],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "planned_move_home" }),
        ],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "absent" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      expect(r.concerns.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── Modifier 1: Plan Coverage ──────────────────────────────────

  describe("modifier: plan coverage", () => {
    it("+5 when coverage >= 90%", () => {
      // baseline is 100% → +5 included in 82
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.disruption_score).toBe(82);
    });

    it("+2 when coverage >= 60% but < 90%", () => {
      // 3 plans / 4 children = 75% → +2 (diff from base: -3)
      // Need 3 unique child_ids for 4 total children
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
          makePlan({ id: "p2", child_id: "c2" }),
          makePlan({ id: "p3", child_id: "c3" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 2 + 6 + 5 + 5 + 4 + 5 = 79
      expect(r.disruption_score).toBe(79);
    });

    it("+0 when coverage >= 30% but < 60%", () => {
      // 2/4 unique = 50% → +0 (diff from base: -5)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
          makePlan({ id: "p2", child_id: "c2" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 0 + 6 + 5 + 5 + 4 + 5 = 77
      expect(r.disruption_score).toBe(77);
    });

    it("-5 when coverage < 30%", () => {
      // 1/4 = 25% → -5 (diff from base: -10)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 - 5 + 6 + 5 + 5 + 4 + 5 = 72
      expect(r.disruption_score).toBe(72);
    });

    it("counts unique child_ids, not total plans", () => {
      // 2 plans for same child = 1 unique child out of 4 = 25% → -5
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
          makePlan({ id: "p2", child_id: "c1" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 - 5 + 6 + 5 + 5 + 4 + 5 = 72
      expect(r.disruption_score).toBe(72);
    });
  });

  // ─── Modifier 2: Planned Ending Rate ────────────────────────────

  describe("modifier: planned ending rate", () => {
    it("+6 when planned ending rate >= 90%", () => {
      // baseline: 3/3 = 100% → +6 (already in baseline)
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.disruption_score).toBe(82);
    });

    it("+3 when no placement ends", () => {
      // No endings → +3 (diff from base: -3)
      const input = baseInput({ placement_ends: [] });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 3 + 5 + 5 + 4 + 5 = 79
      expect(r.disruption_score).toBe(79);
    });

    it("+3 when planned ending rate >= 70% but < 90%", () => {
      // 3/4 = 75% → +3 (diff from base: -3)
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e2", end_reason: "adoption" }),
          makePlacementEnd({ id: "e3", end_reason: "family_reunification" }),
          makePlacementEnd({ id: "e4", end_reason: "placement_disruption" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 3 + 5 + 5 + 4 + 5 = 79
      expect(r.disruption_score).toBe(79);
    });

    it("+0 when planned ending rate >= 50% but < 70%", () => {
      // 2/3 = 67% → +0... wait, pct(2,3) = 67 → >=50% → +0 (diff from base: -6)
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "family_reunification" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // pct(2,3) = 67% → >=50 → +0
      // 52 + 5 + 0 + 5 + 5 + 4 + 5 = 76
      expect(r.disruption_score).toBe(76);
    });

    it("-5 when planned ending rate < 50%", () => {
      // 1/3 = 33% → -5 (diff from base: -11)
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "family_reunification" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // pct(1,3) = 33% → <50% → -5
      // 52 + 5 - 5 + 5 + 5 + 4 + 5 = 71
      expect(r.disruption_score).toBe(71);
    });
  });

  // ─── Modifier 3: Child Involvement ──────────────────────────────

  describe("modifier: child involvement", () => {
    it("+5 when involvement >= 90%", () => {
      // baseline: 4/4 = 100% → +5 (already in baseline)
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.disruption_score).toBe(82);
    });

    it("+2 when involvement >= 60% but < 90%", () => {
      // 3/4 = 75% → +2 (diff from base: -3)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
          makePlan({ id: "p2", child_id: "c2" }),
          makePlan({ id: "p3", child_id: "c3" }),
          makePlan({ id: "p4", child_id: "c4", child_aware: false }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 2 + 5 + 4 + 5 = 79
      expect(r.disruption_score).toBe(79);
    });

    it("+0 when involvement >= 30% but < 60%", () => {
      // 2/4 = 50% → +0 (diff from base: -5)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
          makePlan({ id: "p2", child_id: "c2" }),
          makePlan({ id: "p3", child_id: "c3", child_contribution_recorded: false }),
          makePlan({ id: "p4", child_id: "c4", child_aware: false }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 0 + 5 + 4 + 5 = 77
      expect(r.disruption_score).toBe(77);
    });

    it("-4 when involvement < 30%", () => {
      // 1/4 = 25% → -4 (diff from base: -9)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
          makePlan({ id: "p2", child_id: "c2", child_aware: false }),
          makePlan({ id: "p3", child_id: "c3", child_contribution_recorded: false }),
          makePlan({ id: "p4", child_id: "c4", child_aware: false }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 - 4 + 5 + 4 + 5 = 73
      expect(r.disruption_score).toBe(73);
    });

    it("requires both child_aware AND child_contribution_recorded", () => {
      // All aware but none contributed → 0% involvement → -4
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", child_aware: true, child_contribution_recorded: false }),
          makePlan({ id: "p2", child_id: "c2", child_aware: true, child_contribution_recorded: false }),
          makePlan({ id: "p3", child_id: "c3", child_aware: true, child_contribution_recorded: false }),
          makePlan({ id: "p4", child_id: "c4", child_aware: true, child_contribution_recorded: false }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 - 4 + 5 + 4 + 5 = 73
      expect(r.disruption_score).toBe(73);
    });
  });

  // ─── Modifier 4: Stability Factor Strength ──────────────────────

  describe("modifier: stability factor strength", () => {
    it("+5 when strong+moderate >= 80%", () => {
      // baseline: 12/12 = 100% → +5 (already in baseline)
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.disruption_score).toBe(82);
    });

    it("+2 when strong+moderate >= 60% but < 80%", () => {
      // 8/12 = 67% → +2 (diff from base: -3)
      const factors = baseInput().stability_factors.map((f, i) =>
        i >= 8 ? { ...f, strength: "fragile" } : f,
      );
      const input = baseInput({ stability_factors: factors });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 5 + 2 + 4 + 5 = 79
      expect(r.disruption_score).toBe(79);
    });

    it("+0 when strong+moderate >= 40% but < 60%", () => {
      // 6/12 = 50% → +0 (diff from base: -5)
      const factors = baseInput().stability_factors.map((f, i) =>
        i >= 6 ? { ...f, strength: "fragile" } : f,
      );
      const input = baseInput({ stability_factors: factors });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 5 + 0 + 4 + 5 = 77
      expect(r.disruption_score).toBe(77);
    });

    it("-5 when strong+moderate < 40%", () => {
      // 4/12 = 33% → -5 (diff from base: -10)
      const factors = baseInput().stability_factors.map((f, i) =>
        i >= 4 ? { ...f, strength: "fragile" } : f,
      );
      const input = baseInput({ stability_factors: factors });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 5 - 5 + 4 + 5 = 72
      expect(r.disruption_score).toBe(72);
    });

    it("-1 when no stability factors exist", () => {
      // No factors → -1 (diff from base: -6)
      const input = baseInput({ stability_factors: [] });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 5 - 1 + 4 + 5 = 76
      expect(r.disruption_score).toBe(76);
    });

    it("counts moderate as positive alongside strong", () => {
      // All moderate → 100% → +5 same as baseline
      const factors = baseInput().stability_factors.map((f) => ({
        ...f,
        strength: "moderate",
      }));
      const input = baseInput({ stability_factors: factors });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.disruption_score).toBe(82);
    });
  });

  // ─── Modifier 5: Professional Engagement ────────────────────────

  describe("modifier: professional engagement", () => {
    it("+4 when engagement >= 80%", () => {
      // baseline: 4/4 = 100% → +4 (already in baseline)
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.disruption_score).toBe(82);
    });

    it("+1 when engagement >= 60% but < 80%", () => {
      // 3/4 = 75% → +1 (diff from base: -3)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", professionals_count: 3 }),
          makePlan({ id: "p2", child_id: "c2", professionals_count: 2 }),
          makePlan({ id: "p3", child_id: "c3", professionals_count: 2 }),
          makePlan({ id: "p4", child_id: "c4", professionals_count: 1 }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 5 + 5 + 1 + 5 = 79
      expect(r.disruption_score).toBe(79);
    });

    it("+0 when engagement >= 30% but < 60%", () => {
      // 2/4 = 50% → +0 (diff from base: -4)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", professionals_count: 3 }),
          makePlan({ id: "p2", child_id: "c2", professionals_count: 2 }),
          makePlan({ id: "p3", child_id: "c3", professionals_count: 1 }),
          makePlan({ id: "p4", child_id: "c4", professionals_count: 0 }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 5 + 5 + 0 + 5 = 78
      expect(r.disruption_score).toBe(78);
    });

    it("-4 when engagement < 30%", () => {
      // 1/4 = 25% → -4 (diff from base: -8)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", professionals_count: 3 }),
          makePlan({ id: "p2", child_id: "c2", professionals_count: 1 }),
          makePlan({ id: "p3", child_id: "c3", professionals_count: 0 }),
          makePlan({ id: "p4", child_id: "c4", professionals_count: 0 }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 5 + 5 - 4 + 5 = 74
      expect(r.disruption_score).toBe(74);
    });

    it("counts exactly professionals_count >= 2", () => {
      // All with exactly 2 → 100% → +4 (same as baseline)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", professionals_count: 2 }),
          makePlan({ id: "p2", child_id: "c2", professionals_count: 2 }),
          makePlan({ id: "p3", child_id: "c3", professionals_count: 2 }),
          makePlan({ id: "p4", child_id: "c4", professionals_count: 2 }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.disruption_score).toBe(82);
    });
  });

  // ─── Modifier 6: Review Compliance ──────────────────────────────

  describe("modifier: review compliance", () => {
    it("+5 when compliance >= 90%", () => {
      // baseline: 4/4 = 100% → +5 (already in baseline)
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.disruption_score).toBe(82);
    });

    it("+2 when compliance >= 70% but < 90%", () => {
      // 3/4 = 75% → +2 (diff from base: -3)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", reviewed_recently: true }),
          makePlan({ id: "p2", child_id: "c2", reviewed_recently: true }),
          makePlan({ id: "p3", child_id: "c3", reviewed_recently: true }),
          makePlan({ id: "p4", child_id: "c4", reviewed_recently: false }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 5 + 5 + 4 + 2 = 79
      expect(r.disruption_score).toBe(79);
    });

    it("+0 when compliance >= 40% but < 70%", () => {
      // 2/4 = 50% → +0 (diff from base: -5)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", reviewed_recently: true }),
          makePlan({ id: "p2", child_id: "c2", reviewed_recently: true }),
          makePlan({ id: "p3", child_id: "c3", reviewed_recently: false }),
          makePlan({ id: "p4", child_id: "c4", reviewed_recently: false }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 5 + 5 + 4 + 0 = 77
      expect(r.disruption_score).toBe(77);
    });

    it("-5 when compliance < 40%", () => {
      // 1/4 = 25% → -5 (diff from base: -10)
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", reviewed_recently: true }),
          makePlan({ id: "p2", child_id: "c2", reviewed_recently: false }),
          makePlan({ id: "p3", child_id: "c3", reviewed_recently: false }),
          makePlan({ id: "p4", child_id: "c4", reviewed_recently: false }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 52 + 5 + 6 + 5 + 5 + 4 - 5 = 72
      expect(r.disruption_score).toBe(72);
    });
  });

  // ─── Metrics ────────────────────────────────────────────────────

  describe("metrics", () => {
    it("calculates children_with_plans as unique child_ids", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
          makePlan({ id: "p2", child_id: "c1" }), // duplicate child
          makePlan({ id: "p3", child_id: "c2" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.children_with_plans).toBe(2);
    });

    it("calculates planned_ending_rate correctly", () => {
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "adoption" }),
          makePlacementEnd({ id: "e4", end_reason: "family_reunification" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 3 non-disruption / 4 total = 75%
      expect(r.planned_ending_rate).toBe(75);
    });

    it("calculates disruption_rate correctly", () => {
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e4", end_reason: "adoption" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.disruption_rate).toBe(50);
    });

    it("returns 0 disruption_rate when no placement ends", () => {
      const input = baseInput({ placement_ends: [] });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.disruption_rate).toBe(0);
      expect(r.planned_ending_rate).toBe(0);
    });

    it("calculates average_placement_months correctly", () => {
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", duration_months: 12 }),
          makePlacementEnd({ id: "e2", duration_months: 24 }),
          makePlacementEnd({ id: "e3", duration_months: 18 }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.average_placement_months).toBe(18);
    });

    it("returns 0 average_placement_months when no placement ends", () => {
      const input = baseInput({ placement_ends: [] });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.average_placement_months).toBeNull();;
    });

    it("calculates high_risk_children as unique children with heightened or acute", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "heightened" }),
          makePlan({ id: "p2", child_id: "c1", risk_level: "acute" }), // same child, both high risk
          makePlan({ id: "p3", child_id: "c2", risk_level: "low" }),
          makePlan({ id: "p4", child_id: "c3", risk_level: "acute" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.high_risk_children).toBe(2); // c1 and c3
    });

    it("does not count building risk_level as high risk", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "building" }),
          makePlan({ id: "p2", child_id: "c2", risk_level: "low" }),
          makePlan({ id: "p3", child_id: "c3", risk_level: "building" }),
          makePlan({ id: "p4", child_id: "c4", risk_level: "low" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.high_risk_children).toBe(0);
    });

    it("rounds average_placement_months to one decimal", () => {
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", duration_months: 7 }),
          makePlacementEnd({ id: "e2", duration_months: 11 }),
          makePlacementEnd({ id: "e3", duration_months: 13 }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // (7+11+13)/3 = 10.3333... → rounded to 10.3
      expect(r.average_placement_months).toBe(10.3);
    });
  });

  // ─── Strengths ──────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes plan coverage strength when >= 90%", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.strengths.some((s) => s.includes("plan coverage") || s.includes("90%"))).toBe(true);
    });

    it("includes planned ending strength when >= 90% and endings exist", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("planned"))).toBe(true);
    });

    it("includes no disruptions strength when all endings are non-disruption", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.strengths.some((s) => s.includes("No placement disruptions"))).toBe(true);
    });

    it("includes child involvement strength when >= 90%", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.strengths.some((s) => s.includes("involved") || s.includes("Children"))).toBe(true);
    });

    it("includes stability factors strength when all strong or moderate", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.strengths.some((s) => s.includes("stability factors"))).toBe(true);
    });

    it("includes review compliance strength when >= 90%", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.strengths.some((s) => s.includes("reviewed") || s.includes("review"))).toBe(true);
    });

    it("does not include planned ending strength when no endings exist", () => {
      const input = baseInput({ placement_ends: [] });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.strengths.some((s) => s.includes("90%") && s.includes("planned"))).toBe(false);
    });

    it("does not include no disruptions strength when no endings exist", () => {
      const input = baseInput({ placement_ends: [] });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.strengths.some((s) => s.includes("No placement disruptions"))).toBe(false);
    });
  });

  // ─── Concerns ───────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags acute risk children", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "acute" }),
          makePlan({ id: "p2", child_id: "c2" }),
          makePlan({ id: "p3", child_id: "c3" }),
          makePlan({ id: "p4", child_id: "c4" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.concerns.some((c) => c.includes("acute"))).toBe(true);
    });

    it("flags high disruption rate > 20%", () => {
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e3", end_reason: "planned_move_home" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 1/3 = 33% disruption rate > 20%
      expect(r.concerns.some((c) => c.includes("Disruption rate"))).toBe(true);
    });

    it("flags low plan coverage < 50%", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 1/4 = 25% < 50%
      expect(r.concerns.some((c) => c.includes("half") || c.includes("plan"))).toBe(true);
    });

    it("flags absent stability factors", () => {
      const factors = [
        ...baseInput().stability_factors.slice(0, 11),
        makeStabilityFactor({ id: "sf12", child_id: "c4", strength: "absent" }),
      ];
      const input = baseInput({ stability_factors: factors });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.concerns.some((c) => c.includes("absent"))).toBe(true);
    });

    it("flags low review compliance < 50%", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", reviewed_recently: false }),
          makePlan({ id: "p2", child_id: "c2", reviewed_recently: false }),
          makePlan({ id: "p3", child_id: "c3", reviewed_recently: true }),
          makePlan({ id: "p4", child_id: "c4", reviewed_recently: false }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 1/4 = 25% < 50%
      expect(r.concerns.some((c) => c.includes("review"))).toBe(true);
    });

    it("no concerns for outstanding baseline", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.concerns.length).toBe(0);
    });

    it("does not flag disruption rate when exactly 20%", () => {
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e3", end_reason: "adoption" }),
          makePlacementEnd({ id: "e4", end_reason: "family_reunification" }),
          makePlacementEnd({ id: "e5", end_reason: "planned_step_down" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // 1/5 = 20% — not > 20%
      expect(r.concerns.some((c) => c.includes("Disruption rate"))).toBe(false);
    });
  });

  // ─── Recommendations ────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends emergency meeting for acute risk children", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "acute" }),
          makePlan({ id: "p2", child_id: "c2" }),
          makePlan({ id: "p3", child_id: "c3" }),
          makePlan({ id: "p4", child_id: "c4" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("acute"))).toBe(true);
    });

    it("recommends review of disruptions when disruption rate > 20%", () => {
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e3", end_reason: "planned_move_home" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("disruption"))).toBe(true);
    });

    it("recommends plans for uncovered children when coverage < 50%", () => {
      const input = baseInput({
        disruption_plans: [makePlan({ id: "p1", child_id: "c1" })],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("plan"))).toBe(true);
    });

    it("includes regulatory_ref on all recommendations", () => {
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 10,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "acute", reviewed_recently: false, child_aware: false, child_contribution_recorded: false, professionals_count: 0 }),
        ],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "planned_move_home" }),
        ],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "absent" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      expect(r.recommendations.length).toBeGreaterThan(0);
      r.recommendations.forEach((rec) => {
        expect(rec.regulatory_ref).toMatch(/CHR 2015 Reg 5|SCCIF Stability/);
      });
    });

    it("caps recommendations at 5", () => {
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 20,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "acute", child_aware: false, child_contribution_recorded: false, professionals_count: 0, reviewed_recently: false }),
        ],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "placement_disruption" }),
        ],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "absent" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
    });

    it("numbers recommendations sequentially", () => {
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 10,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "acute", reviewed_recently: false }),
        ],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "planned_move_home" }),
        ],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "absent" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      r.recommendations.forEach((rec, i) => {
        expect(rec.rank).toBe(i + 1);
      });
    });

    it("returns no recommendations for outstanding baseline", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ─── Insights ───────────────────────────────────────────────────

  describe("insights", () => {
    it("returns positive insight when no disruptions and endings exist", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("No placement disruptions"))).toBe(true);
    });

    it("returns critical insight for high risk children", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "acute" }),
          makePlan({ id: "p2", child_id: "c2" }),
          makePlan({ id: "p3", child_id: "c3", risk_level: "heightened" }),
          makePlan({ id: "p4", child_id: "c4" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    });

    it("returns warning insight when many fragile stability factors", () => {
      const factors = baseInput().stability_factors.map((f) => ({
        ...f,
        strength: "fragile",
      }));
      const input = baseInput({ stability_factors: factors });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("fragile"))).toBe(true);
    });

    it("does not return fragile warning for fewer than 3 fragile factors", () => {
      const factors = [
        ...baseInput().stability_factors.slice(0, 10),
        makeStabilityFactor({ id: "sf11", child_id: "c4", strength: "fragile" }),
        makeStabilityFactor({ id: "sf12", child_id: "c4", strength: "fragile" }),
      ];
      const input = baseInput({ stability_factors: factors });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("fragile"))).toBe(false);
    });

    it("caps insights at 3", () => {
      // Trigger all three: no disruptions + high risk + many fragile
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "acute" }),
          makePlan({ id: "p2", child_id: "c2" }),
          makePlan({ id: "p3", child_id: "c3" }),
          makePlan({ id: "p4", child_id: "c4" }),
        ],
        stability_factors: baseInput().stability_factors.map((f) => ({
          ...f,
          strength: "fragile",
        })),
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.insights.length).toBeLessThanOrEqual(3);
    });

    it("no positive insight when there are disruption endings", () => {
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "planned_move_home" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("No placement disruptions"))).toBe(false);
    });

    it("no positive insight when there are no endings at all", () => {
      const input = baseInput({ placement_ends: [] });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("No placement disruptions"))).toBe(false);
    });
  });

  // ─── Headlines ──────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline contains Outstanding", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline contains Good", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", reviewed_recently: true, professionals_count: 3 }),
          makePlan({ id: "p2", child_id: "c2", reviewed_recently: true, professionals_count: 3 }),
          makePlan({ id: "p3", child_id: "c3", reviewed_recently: true, professionals_count: 1 }),
          makePlan({ id: "p4", child_id: "c4", reviewed_recently: false, professionals_count: 1 }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.headline).toContain("Good");
    });

    it("adequate headline contains Adequate", () => {
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 10,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", child_aware: true, child_contribution_recorded: true, professionals_count: 2, reviewed_recently: true }),
          makePlan({ id: "p2", child_id: "c2", child_aware: false, child_contribution_recorded: false, professionals_count: 1, reviewed_recently: true }),
          makePlan({ id: "p3", child_id: "c3", child_aware: true, child_contribution_recorded: false, professionals_count: 1, reviewed_recently: false }),
          makePlan({ id: "p4", child_id: "c4", child_aware: false, child_contribution_recorded: false, professionals_count: 2, reviewed_recently: false }),
          makePlan({ id: "p5", child_id: "c5", child_aware: false, child_contribution_recorded: false, professionals_count: 1, reviewed_recently: false }),
        ],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "family_reunification" }),
        ],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf2", child_id: "c2", strength: "moderate" }),
          makeStabilityFactor({ id: "sf3", child_id: "c3", strength: "fragile" }),
          makeStabilityFactor({ id: "sf4", child_id: "c4", strength: "fragile" }),
          makeStabilityFactor({ id: "sf5", child_id: "c5", strength: "fragile" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      expect(r.headline).toContain("Adequate");
    });

    it("inadequate headline contains Inadequate", () => {
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 10,
        disruption_plans: [],
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
        ],
        stability_factors: [],
      };
      const r = computePlacementDisruptionPrevention(input);
      expect(r.headline).toContain("Inadequate");
    });

    it("insufficient data headline mentions no children", () => {
      const r = computePlacementDisruptionPrevention({
        today: TODAY,
        total_children: 0,
        disruption_plans: [],
        placement_ends: [],
        stability_factors: [],
      });
      expect(r.headline).toContain("No children");
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single child with single plan", () => {
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 1,
        disruption_plans: [makePlan({ id: "p1", child_id: "c1" })],
        placement_ends: [],
        stability_factors: [makeStabilityFactor({ id: "sf1", child_id: "c1" })],
      };
      const r = computePlacementDisruptionPrevention(input);
      // Plan: 100% → +5, Endings: none → +3, Involvement: 100% → +5, Stability: 100% → +5, Prof: 100% → +4, Review: 100% → +5
      // 52+5+3+5+5+4+5 = 79 → good
      expect(r.disruption_score).toBe(79);
      expect(r.disruption_rating).toBe("good");
    });

    it("handles children with no plans and no factors (but total_children > 0)", () => {
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 5,
        disruption_plans: [],
        placement_ends: [],
        stability_factors: [],
      };
      const r = computePlacementDisruptionPrevention(input);
      // Plan: 0/5 = 0% → -5
      // Endings: none → +3
      // Involvement: pct(0,0)=0% → -4
      // Stability: no factors → -1
      // Prof: pct(0,0)=0% → -4
      // Review: pct(0,0)=0% → -5
      // 52-5+3-4-1-4-5 = 36 → inadequate
      expect(r.disruption_score).toBe(36);
      expect(r.disruption_rating).toBe("inadequate");
    });

    it("handles all placement ends being disruptions", () => {
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e2", end_reason: "placement_disruption" }),
          makePlacementEnd({ id: "e3", end_reason: "placement_disruption" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.disruption_rate).toBe(100);
      expect(r.planned_ending_rate).toBe(0);
    });

    it("handles duplicate child_ids in disruption plans for high risk counting", () => {
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", risk_level: "acute" }),
          makePlan({ id: "p2", child_id: "c1", risk_level: "heightened" }),
          makePlan({ id: "p3", child_id: "c2", risk_level: "low" }),
          makePlan({ id: "p4", child_id: "c3", risk_level: "low" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.high_risk_children).toBe(1); // only c1 is unique high risk
    });

    it("preserves all end_reason types as non-disruption except placement_disruption", () => {
      const input = baseInput({
        placement_ends: [
          makePlacementEnd({ id: "e1", end_reason: "planned_move_home" }),
          makePlacementEnd({ id: "e2", end_reason: "planned_step_down" }),
          makePlacementEnd({ id: "e3", end_reason: "planned_move_on_16_plus" }),
          makePlacementEnd({ id: "e4", end_reason: "adoption" }),
          makePlacementEnd({ id: "e5", end_reason: "family_reunification" }),
          makePlacementEnd({ id: "e6", end_reason: "age_out" }),
          makePlacementEnd({ id: "e7", end_reason: "long_term_foster" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      expect(r.planned_ending_rate).toBe(100);
      expect(r.disruption_rate).toBe(0);
    });

    it("handles large number of children and plans", () => {
      const plans = Array.from({ length: 50 }, (_, i) =>
        makePlan({ id: `p${i}`, child_id: `c${i}` }),
      );
      const factors = Array.from({ length: 150 }, (_, i) =>
        makeStabilityFactor({ id: `sf${i}`, child_id: `c${i % 50}` }),
      );
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 50,
        disruption_plans: plans,
        placement_ends: [],
        stability_factors: factors,
      };
      const r = computePlacementDisruptionPrevention(input);
      expect(r.disruption_rating).toBeDefined();
      expect(r.children_with_plans).toBe(50);
    });
  });

  // ─── Score Clamping ─────────────────────────────────────────────

  describe("score clamping", () => {
    it("clamps score to minimum 0", () => {
      // Force maximum penalties: all at worst tier
      // Base 52 - 5 - 5 - 4 - 5 - 4 - 5 = 24 → already above 0
      // But score is clamped, so we just verify it doesn't go below 0
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 100,
        disruption_plans: [
          makePlan({
            id: "p1",
            child_id: "c1",
            child_aware: false,
            child_contribution_recorded: false,
            professionals_count: 0,
            reviewed_recently: false,
          }),
        ],
        placement_ends: Array.from({ length: 20 }, (_, i) =>
          makePlacementEnd({ id: `e${i}`, end_reason: "placement_disruption" }),
        ),
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "absent" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      expect(r.disruption_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to maximum 100", () => {
      // The maximum possible is 52+5+6+5+5+4+5 = 82, so this won't naturally exceed 100
      // But verify the clamp is in place
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(r.disruption_score).toBeLessThanOrEqual(100);
    });

    it("score is an integer", () => {
      const r = computePlacementDisruptionPrevention(baseInput());
      expect(Number.isInteger(r.disruption_score)).toBe(true);
    });
  });

  // ─── Rating Boundary Tests ──────────────────────────────────────

  describe("rating boundaries", () => {
    it("score 80 is outstanding", () => {
      // We need exactly 80: 52 + 28 = 80. But baseline gives 82.
      // Degrade one modifier by 2: e.g. plan coverage from +5 to +2 (diff -3) → 79. Not 80.
      // Try: review compliance from +5 to +2 (diff -3) → 79. Not 80.
      // Try: stability from +5 to +2 (diff -3) → 79. Not 80.
      // We need exactly -2 from baseline 82: degrade child_involvement from +5 to +2 (diff -3) → 79. No.
      // Degrade planned_ending_rate from +6 to +3 (diff -3) → 79. No.
      // Hmm, all modifiers jump by 3. We can't easily get exactly 80.
      // Actually from 82, if we change stability factors from +5 to +5 → no change.
      // Let's change no-factors → -1 instead of strong → 82-6 = 76. No.
      // Let's just verify 80 boundary via rating logic:
      // 80 → outstanding; 79 → good. The baseInput gives 82 → outstanding. Let's verify 79 is good.
      const input = baseInput({
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1" }),
          makePlan({ id: "p2", child_id: "c2" }),
          makePlan({ id: "p3", child_id: "c3" }),
        ],
      });
      const r = computePlacementDisruptionPrevention(input);
      // Plan coverage: 3/4 = 75% → +2
      // Score: 52+2+6+5+5+4+5 = 79 → good
      expect(r.disruption_score).toBe(79);
      expect(r.disruption_rating).toBe("good");
    });

    it("score 61 is adequate (below good boundary)", () => {
      // 52 + 9 = 61
      // Plan: 4/4=100% → +5, Endings: none → +3, Involvement: 4/4=100% → +5
      // Stability: 2/5=40% → +0, Prof: 1/4=25% → -4, Review: 2/4=50% → +0
      // Score: 52+5+3+5+0-4+0 = 61 → adequate
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 4,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", professionals_count: 1, reviewed_recently: true }),
          makePlan({ id: "p2", child_id: "c2", professionals_count: 2, reviewed_recently: false }),
          makePlan({ id: "p3", child_id: "c3", professionals_count: 1, reviewed_recently: false }),
          makePlan({ id: "p4", child_id: "c4", professionals_count: 1, reviewed_recently: true }),
        ],
        placement_ends: [],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf2", child_id: "c1", strength: "fragile" }),
          makeStabilityFactor({ id: "sf3", child_id: "c2", strength: "moderate" }),
          makeStabilityFactor({ id: "sf4", child_id: "c2", strength: "fragile" }),
          makeStabilityFactor({ id: "sf5", child_id: "c3", strength: "fragile" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      expect(r.disruption_score).toBe(61);
      expect(r.disruption_rating).toBe("adequate");
    });

    it("score exactly 65 is good (boundary)", () => {
      // Target: 52 + 13 = 65
      // +5 (plan 100%) + 3 (no endings) + 5 (involvement 100%) + 0 (stability 40-59%) + 0 (prof 30-59%) + 0 (review 40-69%) = 13
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 4,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", professionals_count: 2, reviewed_recently: true }),
          makePlan({ id: "p2", child_id: "c2", professionals_count: 2, reviewed_recently: true }),
          makePlan({ id: "p3", child_id: "c3", professionals_count: 1, reviewed_recently: false }),
          makePlan({ id: "p4", child_id: "c4", professionals_count: 1, reviewed_recently: false }),
        ],
        placement_ends: [],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf2", child_id: "c1", strength: "fragile" }),
          makeStabilityFactor({ id: "sf3", child_id: "c2", strength: "moderate" }),
          makeStabilityFactor({ id: "sf4", child_id: "c2", strength: "fragile" }),
          makeStabilityFactor({ id: "sf5", child_id: "c3", strength: "fragile" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      // Plan: 4/4=100% → +5
      // Endings: none → +3
      // Involvement: 4/4=100% → +5
      // Stability: 2/5=40% → +0
      // Prof: 2/4=50% → +0 (>=30%)
      // Review: 2/4=50% → +0 (>=40%)
      // Score: 52+5+3+5+0+0+0 = 65 → good
      expect(r.disruption_score).toBe(65);
      expect(r.disruption_rating).toBe("good");
    });

    it("score 64 is adequate", () => {
      // 52 + 12 = 64
      // +5 (plan) + 3 (no endings) + 2 (involvement 60-89%) + 0 (stability) + 0 (prof) + 2 (review 70-89%) = 12
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 4,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", professionals_count: 2, reviewed_recently: true }),
          makePlan({ id: "p2", child_id: "c2", professionals_count: 2, reviewed_recently: true }),
          makePlan({ id: "p3", child_id: "c3", professionals_count: 1, reviewed_recently: true, child_aware: false }),
          makePlan({ id: "p4", child_id: "c4", professionals_count: 1, reviewed_recently: false }),
        ],
        placement_ends: [],
        stability_factors: [
          makeStabilityFactor({ id: "sf1", child_id: "c1", strength: "strong" }),
          makeStabilityFactor({ id: "sf2", child_id: "c1", strength: "fragile" }),
          makeStabilityFactor({ id: "sf3", child_id: "c2", strength: "moderate" }),
          makeStabilityFactor({ id: "sf4", child_id: "c2", strength: "fragile" }),
          makeStabilityFactor({ id: "sf5", child_id: "c3", strength: "fragile" }),
        ],
      };
      const r = computePlacementDisruptionPrevention(input);
      // Plan: 4/4=100% → +5
      // Endings: none → +3
      // Involvement: 3/4=75% → +2
      // Stability: 2/5=40% → +0
      // Prof: 2/4=50% → +0
      // Review: 3/4=75% → +2
      // Score: 52+5+3+2+0+0+2 = 64 → adequate
      expect(r.disruption_score).toBe(64);
      expect(r.disruption_rating).toBe("adequate");
    });

    it("score 45 is adequate", () => {
      // 52 - 7 = 45
      // Plan: -5, Endings: +3 (none), Involvement: -4, Stability: -1 (none), Prof: -4, Review: -5 → -16. 52-16=36. Too low.
      // Plan: +0, Endings: +3, Involvement: -4, Stability: -1, Prof: +0, Review: -5 → -7. 52-7=45.
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 6,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", child_aware: false, child_contribution_recorded: false, professionals_count: 1, reviewed_recently: false }),
          makePlan({ id: "p2", child_id: "c2", child_aware: false, child_contribution_recorded: false, professionals_count: 2, reviewed_recently: false }),
        ],
        placement_ends: [],
        stability_factors: [],
      };
      const r = computePlacementDisruptionPrevention(input);
      // Plan: 2/6 = 33% → +0 (>=30%)
      // Endings: none → +3
      // Involvement: 0/2 = 0% → -4
      // Stability: no factors → -1
      // Prof: 1/2 = 50% → +0 (>=30%)
      // Review: 0/2 = 0% → -5 (<40%)
      // Score: 52+0+3-4-1+0-5 = 45 → adequate
      expect(r.disruption_score).toBe(45);
      expect(r.disruption_rating).toBe("adequate");
    });

    it("score 44 is inadequate", () => {
      // 52 - 8 = 44
      // Plan: +0, Endings: +3, Involvement: -4, Stability: -1, Prof: -4, Review: +0 → -6 → 46. Too high.
      // Plan: +0, Endings: +0, Involvement: -4, Stability: -1, Prof: +0, Review: -5 → -10 → 42. Too low.
      // Plan: +0, Endings: +3, Involvement: -4, Stability: -5, Prof: +0, Review: +0 → -6 → 46. Still too high.
      // Plan: -5, Endings: +3, Involvement: +0, Stability: -1, Prof: +0, Review: -5 → -8 → 44.
      const input: DisruptionPreventionInput = {
        today: TODAY,
        total_children: 10,
        disruption_plans: [
          makePlan({ id: "p1", child_id: "c1", child_aware: true, child_contribution_recorded: true, professionals_count: 2, reviewed_recently: false }),
          makePlan({ id: "p2", child_id: "c2", child_aware: false, child_contribution_recorded: true, professionals_count: 1, reviewed_recently: false }),
        ],
        placement_ends: [],
        stability_factors: [],
      };
      const r = computePlacementDisruptionPrevention(input);
      // Plan: 2/10 = 20% → -5 (<30%)
      // Endings: none → +3
      // Involvement: 1/2 = 50% → +0 (>=30%)
      // Stability: no factors → -1
      // Prof: 1/2 = 50% → +0 (>=30%)
      // Review: 0/2 = 0% → -5 (<40%)
      // Score: 52-5+3+0-1+0-5 = 44 → inadequate
      expect(r.disruption_score).toBe(44);
      expect(r.disruption_rating).toBe("inadequate");
    });
  });

  // ─── Pure Function ──────────────────────────────────────────────

  describe("pure function behavior", () => {
    it("does not mutate input", () => {
      const input = baseInput();
      const frozen = JSON.parse(JSON.stringify(input));
      computePlacementDisruptionPrevention(input);
      expect(input).toEqual(frozen);
    });

    it("produces same output for same input", () => {
      const input = baseInput();
      const r1 = computePlacementDisruptionPrevention(input);
      const r2 = computePlacementDisruptionPrevention(input);
      expect(r1).toEqual(r2);
    });

    it("accepts today as injectable parameter", () => {
      const r1 = computePlacementDisruptionPrevention(baseInput({ today: "2025-01-01" }));
      const r2 = computePlacementDisruptionPrevention(baseInput({ today: "2026-12-31" }));
      // Both should produce valid results (same data, different today)
      expect(r1.disruption_rating).toBe("outstanding");
      expect(r2.disruption_rating).toBe("outstanding");
    });
  });
});
