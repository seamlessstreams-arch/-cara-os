// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR SUPPORT PLANS SERVICE TESTS
// Pure-function unit tests for BSP metrics computation, alert identification,
// constant validation, and CRUD fallback behaviour (Supabase disabled).
// CHR 2015 Reg 19 (behaviour management — positive strategies),
// Reg 20 (restraint — proportionate responses),
// Reg 6 (quality and purpose of care — individual planning).
//
// SCCIF: Overall Experiences — "Children are supported to manage
// their behaviour." "Behaviour support plans are individualised."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  BSP_STATUSES,
  STRATEGY_CATEGORIES,
  TRIGGER_CATEGORIES,
  EFFECTIVENESS_RATINGS,
  listPlans,
  createPlan,
  updatePlan,
} from "../behaviour-support-plans-service";

import type {
  BehaviourSupportPlan,
  BspStatus,
  StrategyCategory,
  TriggerCategory,
  EffectivenessRating,
} from "../behaviour-support-plans-service";

const { computeBspMetrics, identifyBspAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

/** Build a minimal BehaviourSupportPlan with sensible defaults. */
function makePlan(overrides: Partial<BehaviourSupportPlan> = {}): BehaviourSupportPlan {
  return {
    id: "bsp-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    bsp_status: "active",
    created_date: "2025-06-01",
    review_date: null,
    next_review_date: null,
    created_by: "Staff A",
    reviewed_by: null,
    triggers: ["anxiety"],
    trigger_details: null,
    strategies: ["preventive"],
    strategy_details: null,
    positive_reinforcements: ["praise"],
    de_escalation_steps: ["calm voice"],
    effectiveness_rating: "effective",
    incidents_since_last_review: 2,
    child_involved_in_plan: true,
    child_views: "Feels supported",
    parent_informed: true,
    social_worker_approved: true,
    psychologist_input: true,
    staff_briefed: true,
    notes: null,
    created_at: "2025-06-01T10:00:00.000Z",
    updated_at: "2025-06-01T10:00:00.000Z",
    ...overrides,
  } as BehaviourSupportPlan;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("BSP_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(BSP_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = BSP_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = BSP_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes active", () => {
    expect(BSP_STATUSES.find((s) => s.status === "active")).toBeTruthy();
  });

  it("includes under_review", () => {
    expect(BSP_STATUSES.find((s) => s.status === "under_review")).toBeTruthy();
  });

  it("includes expired", () => {
    expect(BSP_STATUSES.find((s) => s.status === "expired")).toBeTruthy();
  });

  it("includes draft", () => {
    expect(BSP_STATUSES.find((s) => s.status === "draft")).toBeTruthy();
  });

  it("includes superseded", () => {
    expect(BSP_STATUSES.find((s) => s.status === "superseded")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of BSP_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("STRATEGY_CATEGORIES", () => {
  it("has exactly 10 entries", () => {
    expect(STRATEGY_CATEGORIES).toHaveLength(10);
  });

  it("contains unique category values", () => {
    const values = STRATEGY_CATEGORIES.map((s) => s.category);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = STRATEGY_CATEGORIES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes preventive and de_escalation", () => {
    expect(STRATEGY_CATEGORIES.find((s) => s.category === "preventive")).toBeTruthy();
    expect(STRATEGY_CATEGORIES.find((s) => s.category === "de_escalation")).toBeTruthy();
  });

  it("includes positive_reinforcement and environmental_adjustment", () => {
    expect(STRATEGY_CATEGORIES.find((s) => s.category === "positive_reinforcement")).toBeTruthy();
    expect(STRATEGY_CATEGORIES.find((s) => s.category === "environmental_adjustment")).toBeTruthy();
  });

  it("includes communication_support and sensory_regulation", () => {
    expect(STRATEGY_CATEGORIES.find((s) => s.category === "communication_support")).toBeTruthy();
    expect(STRATEGY_CATEGORIES.find((s) => s.category === "sensory_regulation")).toBeTruthy();
  });

  it("includes therapeutic and routine_structure", () => {
    expect(STRATEGY_CATEGORIES.find((s) => s.category === "therapeutic")).toBeTruthy();
    expect(STRATEGY_CATEGORIES.find((s) => s.category === "routine_structure")).toBeTruthy();
  });

  it("includes relationship_based and other", () => {
    expect(STRATEGY_CATEGORIES.find((s) => s.category === "relationship_based")).toBeTruthy();
    expect(STRATEGY_CATEGORIES.find((s) => s.category === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of STRATEGY_CATEGORIES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("TRIGGER_CATEGORIES", () => {
  it("has exactly 11 entries", () => {
    expect(TRIGGER_CATEGORIES).toHaveLength(11);
  });

  it("contains unique category values", () => {
    const values = TRIGGER_CATEGORIES.map((t) => t.category);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = TRIGGER_CATEGORIES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes transitions and sensory_overload", () => {
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "transitions")).toBeTruthy();
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "sensory_overload")).toBeTruthy();
  });

  it("includes peer_conflict and contact_related", () => {
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "peer_conflict")).toBeTruthy();
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "contact_related")).toBeTruthy();
  });

  it("includes anxiety and frustration", () => {
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "anxiety")).toBeTruthy();
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "frustration")).toBeTruthy();
  });

  it("includes unmet_need and change_of_routine", () => {
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "unmet_need")).toBeTruthy();
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "change_of_routine")).toBeTruthy();
  });

  it("includes specific_time, unknown, and other", () => {
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "specific_time")).toBeTruthy();
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "unknown")).toBeTruthy();
    expect(TRIGGER_CATEGORIES.find((t) => t.category === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const t of TRIGGER_CATEGORIES) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });
});

describe("EFFECTIVENESS_RATINGS", () => {
  it("has exactly 5 entries", () => {
    expect(EFFECTIVENESS_RATINGS).toHaveLength(5);
  });

  it("contains unique rating values", () => {
    const values = EFFECTIVENESS_RATINGS.map((r) => r.rating);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = EFFECTIVENESS_RATINGS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes highly_effective", () => {
    expect(EFFECTIVENESS_RATINGS.find((r) => r.rating === "highly_effective")).toBeTruthy();
  });

  it("includes effective", () => {
    expect(EFFECTIVENESS_RATINGS.find((r) => r.rating === "effective")).toBeTruthy();
  });

  it("includes partially_effective", () => {
    expect(EFFECTIVENESS_RATINGS.find((r) => r.rating === "partially_effective")).toBeTruthy();
  });

  it("includes not_effective", () => {
    expect(EFFECTIVENESS_RATINGS.find((r) => r.rating === "not_effective")).toBeTruthy();
  });

  it("includes not_yet_evaluated", () => {
    expect(EFFECTIVENESS_RATINGS.find((r) => r.rating === "not_yet_evaluated")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const r of EFFECTIVENESS_RATINGS) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeBspMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeBspMetrics", () => {
  it("returns zeroed metrics for empty plans array", () => {
    const m = computeBspMetrics([], 0);
    expect(m.total_plans).toBe(0);
    expect(m.active_plans).toBe(0);
    expect(m.expired_plans).toBe(0);
    expect(m.draft_plans).toBe(0);
    expect(m.children_with_bsp).toBe(0);
    expect(m.bsp_coverage).toBe(0);
    expect(m.highly_effective_count).toBe(0);
    expect(m.effective_count).toBe(0);
    expect(m.not_effective_count).toBe(0);
    expect(m.not_evaluated_count).toBe(0);
    expect(m.child_involvement_rate).toBe(0);
    expect(m.social_worker_approved_rate).toBe(0);
    expect(m.psychologist_input_rate).toBe(0);
    expect(m.staff_briefed_rate).toBe(0);
    expect(m.parent_informed_rate).toBe(0);
    expect(m.child_views_rate).toBe(0);
    expect(m.average_incidents).toBe(0);
    expect(Object.keys(m.by_bsp_status)).toHaveLength(0);
    expect(Object.keys(m.by_strategy)).toHaveLength(0);
    expect(Object.keys(m.by_trigger)).toHaveLength(0);
    expect(Object.keys(m.by_effectiveness)).toHaveLength(0);
  });

  // ── total_plans ─────────────────────────────────────────────────────

  it("total_plans equals the number of plans", () => {
    const plans = [
      makePlan({ id: "bsp1" }),
      makePlan({ id: "bsp2" }),
      makePlan({ id: "bsp3" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.total_plans).toBe(3);
  });

  it("total_plans is 1 for single plan", () => {
    const m = computeBspMetrics([makePlan()], 5);
    expect(m.total_plans).toBe(1);
  });

  // ── active_plans ────────────────────────────────────────────────────

  it("active_plans counts plans with status active", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "active" }),
      makePlan({ id: "bsp2", bsp_status: "active" }),
      makePlan({ id: "bsp3", bsp_status: "expired" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.active_plans).toBe(2);
  });

  it("active_plans is 0 when no plans are active", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "expired" }),
      makePlan({ id: "bsp2", bsp_status: "draft" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.active_plans).toBe(0);
  });

  it("active_plans does not count under_review", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "under_review" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.active_plans).toBe(0);
  });

  // ── expired_plans ───────────────────────────────────────────────────

  it("expired_plans counts plans with status expired", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "expired" }),
      makePlan({ id: "bsp2", bsp_status: "expired" }),
      makePlan({ id: "bsp3", bsp_status: "active" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.expired_plans).toBe(2);
  });

  it("expired_plans is 0 when no plans are expired", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "active" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.expired_plans).toBe(0);
  });

  // ── draft_plans ─────────────────────────────────────────────────────

  it("draft_plans counts plans with status draft", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "draft" }),
      makePlan({ id: "bsp2", bsp_status: "draft" }),
      makePlan({ id: "bsp3", bsp_status: "active" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.draft_plans).toBe(2);
  });

  it("draft_plans is 0 when no plans are draft", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "active" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.draft_plans).toBe(0);
  });

  // ── children_with_bsp ───────────────────────────────────────────────

  it("children_with_bsp counts unique child IDs", () => {
    const plans = [
      makePlan({ id: "bsp1", child_id: "child-1" }),
      makePlan({ id: "bsp2", child_id: "child-1" }),
      makePlan({ id: "bsp3", child_id: "child-2" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.children_with_bsp).toBe(2);
  });

  it("children_with_bsp is 1 when all plans belong to same child", () => {
    const plans = [
      makePlan({ id: "bsp1", child_id: "child-1" }),
      makePlan({ id: "bsp2", child_id: "child-1" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.children_with_bsp).toBe(1);
  });

  it("children_with_bsp equals plan count when each plan has different child", () => {
    const plans = [
      makePlan({ id: "bsp1", child_id: "child-1" }),
      makePlan({ id: "bsp2", child_id: "child-2" }),
      makePlan({ id: "bsp3", child_id: "child-3" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.children_with_bsp).toBe(3);
  });

  // ── bsp_coverage ────────────────────────────────────────────────────

  it("bsp_coverage is 100 when all children have BSP", () => {
    const plans = [
      makePlan({ id: "bsp1", child_id: "child-1" }),
      makePlan({ id: "bsp2", child_id: "child-2" }),
    ];
    const m = computeBspMetrics(plans, 2);
    expect(m.bsp_coverage).toBe(100);
  });

  it("bsp_coverage is 50 when half children have BSP", () => {
    const plans = [
      makePlan({ id: "bsp1", child_id: "child-1" }),
    ];
    const m = computeBspMetrics(plans, 2);
    expect(m.bsp_coverage).toBe(50);
  });

  it("bsp_coverage is 0 when totalChildren is 0", () => {
    const m = computeBspMetrics([], 0);
    expect(m.bsp_coverage).toBe(0);
  });

  it("bsp_coverage rounds to one decimal place", () => {
    const plans = [
      makePlan({ id: "bsp1", child_id: "child-1" }),
    ];
    const m = computeBspMetrics(plans, 3);
    expect(m.bsp_coverage).toBe(33.3);
  });

  it("bsp_coverage handles duplicate child IDs correctly", () => {
    const plans = [
      makePlan({ id: "bsp1", child_id: "child-1" }),
      makePlan({ id: "bsp2", child_id: "child-1" }),
    ];
    const m = computeBspMetrics(plans, 4);
    expect(m.bsp_coverage).toBe(25);
  });

  // ── highly_effective_count ──────────────────────────────────────────

  it("highly_effective_count counts highly_effective plans", () => {
    const plans = [
      makePlan({ id: "bsp1", effectiveness_rating: "highly_effective" }),
      makePlan({ id: "bsp2", effectiveness_rating: "highly_effective" }),
      makePlan({ id: "bsp3", effectiveness_rating: "effective" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.highly_effective_count).toBe(2);
  });

  it("highly_effective_count is 0 when none highly_effective", () => {
    const plans = [
      makePlan({ id: "bsp1", effectiveness_rating: "effective" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.highly_effective_count).toBe(0);
  });

  // ── effective_count ─────────────────────────────────────────────────

  it("effective_count counts effective plans", () => {
    const plans = [
      makePlan({ id: "bsp1", effectiveness_rating: "effective" }),
      makePlan({ id: "bsp2", effectiveness_rating: "effective" }),
      makePlan({ id: "bsp3", effectiveness_rating: "not_effective" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.effective_count).toBe(2);
  });

  it("effective_count is 0 when none effective", () => {
    const plans = [
      makePlan({ id: "bsp1", effectiveness_rating: "not_effective" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.effective_count).toBe(0);
  });

  // ── not_effective_count ─────────────────────────────────────────────

  it("not_effective_count counts not_effective plans", () => {
    const plans = [
      makePlan({ id: "bsp1", effectiveness_rating: "not_effective" }),
      makePlan({ id: "bsp2", effectiveness_rating: "not_effective" }),
      makePlan({ id: "bsp3", effectiveness_rating: "effective" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.not_effective_count).toBe(2);
  });

  it("not_effective_count is 0 when none not_effective", () => {
    const plans = [
      makePlan({ id: "bsp1", effectiveness_rating: "effective" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.not_effective_count).toBe(0);
  });

  // ── not_evaluated_count ─────────────────────────────────────────────

  it("not_evaluated_count counts not_yet_evaluated plans", () => {
    const plans = [
      makePlan({ id: "bsp1", effectiveness_rating: "not_yet_evaluated" }),
      makePlan({ id: "bsp2", effectiveness_rating: "not_yet_evaluated" }),
      makePlan({ id: "bsp3", effectiveness_rating: "effective" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.not_evaluated_count).toBe(2);
  });

  it("not_evaluated_count is 0 when none not_yet_evaluated", () => {
    const plans = [
      makePlan({ id: "bsp1", effectiveness_rating: "effective" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.not_evaluated_count).toBe(0);
  });

  // ── child_involvement_rate ──────────────────────────────────────────

  it("child_involvement_rate is 100 when all plans have child involved", () => {
    const plans = [
      makePlan({ id: "bsp1", child_involved_in_plan: true }),
      makePlan({ id: "bsp2", child_involved_in_plan: true }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.child_involvement_rate).toBe(100);
  });

  it("child_involvement_rate is 0 when no plans have child involved", () => {
    const plans = [
      makePlan({ id: "bsp1", child_involved_in_plan: false }),
      makePlan({ id: "bsp2", child_involved_in_plan: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.child_involvement_rate).toBe(0);
  });

  it("child_involvement_rate is 50 when half have child involved", () => {
    const plans = [
      makePlan({ id: "bsp1", child_involved_in_plan: true }),
      makePlan({ id: "bsp2", child_involved_in_plan: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.child_involvement_rate).toBe(50);
  });

  it("child_involvement_rate rounds to one decimal place", () => {
    const plans = [
      makePlan({ id: "bsp1", child_involved_in_plan: true }),
      makePlan({ id: "bsp2", child_involved_in_plan: false }),
      makePlan({ id: "bsp3", child_involved_in_plan: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.child_involvement_rate).toBe(33.3);
  });

  // ── social_worker_approved_rate ─────────────────────────────────────

  it("social_worker_approved_rate is 100 when all plans approved", () => {
    const plans = [
      makePlan({ id: "bsp1", social_worker_approved: true }),
      makePlan({ id: "bsp2", social_worker_approved: true }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.social_worker_approved_rate).toBe(100);
  });

  it("social_worker_approved_rate is 0 when no plans approved", () => {
    const plans = [
      makePlan({ id: "bsp1", social_worker_approved: false }),
      makePlan({ id: "bsp2", social_worker_approved: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.social_worker_approved_rate).toBe(0);
  });

  it("social_worker_approved_rate is 50 when half approved", () => {
    const plans = [
      makePlan({ id: "bsp1", social_worker_approved: true }),
      makePlan({ id: "bsp2", social_worker_approved: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.social_worker_approved_rate).toBe(50);
  });

  it("social_worker_approved_rate rounds to one decimal place", () => {
    const plans = [
      makePlan({ id: "bsp1", social_worker_approved: true }),
      makePlan({ id: "bsp2", social_worker_approved: false }),
      makePlan({ id: "bsp3", social_worker_approved: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.social_worker_approved_rate).toBe(33.3);
  });

  // ── psychologist_input_rate ─────────────────────────────────────────

  it("psychologist_input_rate is 100 when all plans have psychologist input", () => {
    const plans = [
      makePlan({ id: "bsp1", psychologist_input: true }),
      makePlan({ id: "bsp2", psychologist_input: true }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.psychologist_input_rate).toBe(100);
  });

  it("psychologist_input_rate is 0 when no plans have psychologist input", () => {
    const plans = [
      makePlan({ id: "bsp1", psychologist_input: false }),
      makePlan({ id: "bsp2", psychologist_input: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.psychologist_input_rate).toBe(0);
  });

  it("psychologist_input_rate is 50 when half have input", () => {
    const plans = [
      makePlan({ id: "bsp1", psychologist_input: true }),
      makePlan({ id: "bsp2", psychologist_input: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.psychologist_input_rate).toBe(50);
  });

  it("psychologist_input_rate rounds to one decimal place", () => {
    const plans = [
      makePlan({ id: "bsp1", psychologist_input: true }),
      makePlan({ id: "bsp2", psychologist_input: false }),
      makePlan({ id: "bsp3", psychologist_input: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.psychologist_input_rate).toBe(33.3);
  });

  // ── staff_briefed_rate ──────────────────────────────────────────────

  it("staff_briefed_rate is 100 when all plans have staff briefed", () => {
    const plans = [
      makePlan({ id: "bsp1", staff_briefed: true }),
      makePlan({ id: "bsp2", staff_briefed: true }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.staff_briefed_rate).toBe(100);
  });

  it("staff_briefed_rate is 0 when no plans have staff briefed", () => {
    const plans = [
      makePlan({ id: "bsp1", staff_briefed: false }),
      makePlan({ id: "bsp2", staff_briefed: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.staff_briefed_rate).toBe(0);
  });

  it("staff_briefed_rate is 50 when half briefed", () => {
    const plans = [
      makePlan({ id: "bsp1", staff_briefed: true }),
      makePlan({ id: "bsp2", staff_briefed: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.staff_briefed_rate).toBe(50);
  });

  it("staff_briefed_rate rounds to one decimal place", () => {
    const plans = [
      makePlan({ id: "bsp1", staff_briefed: true }),
      makePlan({ id: "bsp2", staff_briefed: false }),
      makePlan({ id: "bsp3", staff_briefed: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.staff_briefed_rate).toBe(33.3);
  });

  // ── parent_informed_rate ────────────────────────────────────────────

  it("parent_informed_rate is 100 when all plans have parent informed", () => {
    const plans = [
      makePlan({ id: "bsp1", parent_informed: true }),
      makePlan({ id: "bsp2", parent_informed: true }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.parent_informed_rate).toBe(100);
  });

  it("parent_informed_rate is 0 when no plans have parent informed", () => {
    const plans = [
      makePlan({ id: "bsp1", parent_informed: false }),
      makePlan({ id: "bsp2", parent_informed: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.parent_informed_rate).toBe(0);
  });

  it("parent_informed_rate is 50 when half informed", () => {
    const plans = [
      makePlan({ id: "bsp1", parent_informed: true }),
      makePlan({ id: "bsp2", parent_informed: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.parent_informed_rate).toBe(50);
  });

  it("parent_informed_rate rounds to one decimal place", () => {
    const plans = [
      makePlan({ id: "bsp1", parent_informed: true }),
      makePlan({ id: "bsp2", parent_informed: false }),
      makePlan({ id: "bsp3", parent_informed: false }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.parent_informed_rate).toBe(33.3);
  });

  // ── child_views_rate ────────────────────────────────────────────────

  it("child_views_rate is 100 when all plans have child views", () => {
    const plans = [
      makePlan({ id: "bsp1", child_views: "Feels safe" }),
      makePlan({ id: "bsp2", child_views: "Good plan" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.child_views_rate).toBe(100);
  });

  it("child_views_rate is 0 when no plans have child views", () => {
    const plans = [
      makePlan({ id: "bsp1", child_views: null }),
      makePlan({ id: "bsp2", child_views: null }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.child_views_rate).toBe(0);
  });

  it("child_views_rate is 50 when half have views", () => {
    const plans = [
      makePlan({ id: "bsp1", child_views: "Views" }),
      makePlan({ id: "bsp2", child_views: null }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.child_views_rate).toBe(50);
  });

  it("child_views_rate rounds to one decimal place", () => {
    const plans = [
      makePlan({ id: "bsp1", child_views: "Yes" }),
      makePlan({ id: "bsp2", child_views: null }),
      makePlan({ id: "bsp3", child_views: null }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.child_views_rate).toBe(33.3);
  });

  it("child_views_rate counts non-null values including empty string", () => {
    const plans = [
      makePlan({ id: "bsp1", child_views: "" }),
      makePlan({ id: "bsp2", child_views: null }),
    ];
    const m = computeBspMetrics(plans, 10);
    // empty string is not null, so it counts
    expect(m.child_views_rate).toBe(50);
  });

  // ── average_incidents ───────────────────────────────────────────────

  it("average_incidents is sum divided by plan count", () => {
    const plans = [
      makePlan({ id: "bsp1", incidents_since_last_review: 4 }),
      makePlan({ id: "bsp2", incidents_since_last_review: 6 }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.average_incidents).toBe(5);
  });

  it("average_incidents is 0 for empty plans", () => {
    const m = computeBspMetrics([], 10);
    expect(m.average_incidents).toBe(0);
  });

  it("average_incidents is 0 when all incidents are 0", () => {
    const plans = [
      makePlan({ id: "bsp1", incidents_since_last_review: 0 }),
      makePlan({ id: "bsp2", incidents_since_last_review: 0 }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.average_incidents).toBe(0);
  });

  it("average_incidents rounds to one decimal place", () => {
    const plans = [
      makePlan({ id: "bsp1", incidents_since_last_review: 1 }),
      makePlan({ id: "bsp2", incidents_since_last_review: 2 }),
      makePlan({ id: "bsp3", incidents_since_last_review: 3 }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.average_incidents).toBe(2);
  });

  it("average_incidents rounds correctly for non-integer result", () => {
    const plans = [
      makePlan({ id: "bsp1", incidents_since_last_review: 1 }),
      makePlan({ id: "bsp2", incidents_since_last_review: 0 }),
      makePlan({ id: "bsp3", incidents_since_last_review: 0 }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.average_incidents).toBe(0.3);
  });

  it("average_incidents for single plan equals that plan's incidents", () => {
    const plans = [
      makePlan({ id: "bsp1", incidents_since_last_review: 7 }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.average_incidents).toBe(7);
  });

  // ── by_bsp_status ───────────────────────────────────────────────────

  it("by_bsp_status groups counts by status", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "active" }),
      makePlan({ id: "bsp2", bsp_status: "active" }),
      makePlan({ id: "bsp3", bsp_status: "expired" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.by_bsp_status["active"]).toBe(2);
    expect(m.by_bsp_status["expired"]).toBe(1);
  });

  it("by_bsp_status is empty for no plans", () => {
    const m = computeBspMetrics([], 10);
    expect(Object.keys(m.by_bsp_status)).toHaveLength(0);
  });

  it("by_bsp_status has one entry per unique status", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "active" }),
      makePlan({ id: "bsp2", bsp_status: "expired" }),
      makePlan({ id: "bsp3", bsp_status: "draft" }),
      makePlan({ id: "bsp4", bsp_status: "draft" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(Object.keys(m.by_bsp_status)).toHaveLength(3);
  });

  it("by_bsp_status values sum to total_plans", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "active" }),
      makePlan({ id: "bsp2", bsp_status: "expired" }),
      makePlan({ id: "bsp3", bsp_status: "draft" }),
      makePlan({ id: "bsp4", bsp_status: "superseded" }),
    ];
    const m = computeBspMetrics(plans, 10);
    const sum = Object.values(m.by_bsp_status).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_plans);
  });

  it("by_bsp_status has 5 entries when all statuses represented", () => {
    const statuses: BspStatus[] = ["active", "under_review", "expired", "draft", "superseded"];
    const plans = statuses.map((status, i) =>
      makePlan({ id: `bsp${i}`, bsp_status: status }),
    );
    const m = computeBspMetrics(plans, 10);
    expect(Object.keys(m.by_bsp_status)).toHaveLength(5);
  });

  // ── by_strategy ─────────────────────────────────────────────────────

  it("by_strategy counts across all strategy array items", () => {
    const plans = [
      makePlan({ id: "bsp1", strategies: ["preventive", "de_escalation"] }),
      makePlan({ id: "bsp2", strategies: ["preventive"] }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.by_strategy["preventive"]).toBe(2);
    expect(m.by_strategy["de_escalation"]).toBe(1);
  });

  it("by_strategy is empty for no plans", () => {
    const m = computeBspMetrics([], 10);
    expect(Object.keys(m.by_strategy)).toHaveLength(0);
  });

  it("by_strategy counts each item in strategy array individually", () => {
    const plans = [
      makePlan({ id: "bsp1", strategies: ["preventive", "therapeutic", "sensory_regulation"] }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.by_strategy["preventive"]).toBe(1);
    expect(m.by_strategy["therapeutic"]).toBe(1);
    expect(m.by_strategy["sensory_regulation"]).toBe(1);
    expect(Object.keys(m.by_strategy)).toHaveLength(3);
  });

  it("by_strategy sums may exceed total_plans due to multi-value arrays", () => {
    const plans = [
      makePlan({ id: "bsp1", strategies: ["preventive", "de_escalation"] }),
      makePlan({ id: "bsp2", strategies: ["preventive", "therapeutic"] }),
    ];
    const m = computeBspMetrics(plans, 10);
    const sum = Object.values(m.by_strategy).reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(m.total_plans);
  });

  it("by_strategy handles empty strategies array", () => {
    const plans = [
      makePlan({ id: "bsp1", strategies: [] as any }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(Object.keys(m.by_strategy)).toHaveLength(0);
  });

  it("by_strategy has 10 entries when all categories represented", () => {
    const categories: StrategyCategory[] = [
      "preventive", "de_escalation", "positive_reinforcement",
      "environmental_adjustment", "communication_support", "sensory_regulation",
      "therapeutic", "routine_structure", "relationship_based", "other",
    ];
    const plans = [
      makePlan({ id: "bsp1", strategies: categories }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(Object.keys(m.by_strategy)).toHaveLength(10);
  });

  // ── by_trigger ──────────────────────────────────────────────────────

  it("by_trigger counts across all trigger array items", () => {
    const plans = [
      makePlan({ id: "bsp1", triggers: ["anxiety", "frustration"] }),
      makePlan({ id: "bsp2", triggers: ["anxiety"] }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.by_trigger["anxiety"]).toBe(2);
    expect(m.by_trigger["frustration"]).toBe(1);
  });

  it("by_trigger is empty for no plans", () => {
    const m = computeBspMetrics([], 10);
    expect(Object.keys(m.by_trigger)).toHaveLength(0);
  });

  it("by_trigger counts each item in trigger array individually", () => {
    const plans = [
      makePlan({ id: "bsp1", triggers: ["anxiety", "transitions", "peer_conflict"] }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.by_trigger["anxiety"]).toBe(1);
    expect(m.by_trigger["transitions"]).toBe(1);
    expect(m.by_trigger["peer_conflict"]).toBe(1);
    expect(Object.keys(m.by_trigger)).toHaveLength(3);
  });

  it("by_trigger sums may exceed total_plans due to multi-value arrays", () => {
    const plans = [
      makePlan({ id: "bsp1", triggers: ["anxiety", "frustration"] }),
      makePlan({ id: "bsp2", triggers: ["anxiety", "transitions"] }),
    ];
    const m = computeBspMetrics(plans, 10);
    const sum = Object.values(m.by_trigger).reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(m.total_plans);
  });

  it("by_trigger handles empty triggers array", () => {
    const plans = [
      makePlan({ id: "bsp1", triggers: [] as any }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(Object.keys(m.by_trigger)).toHaveLength(0);
  });

  it("by_trigger has 11 entries when all categories represented", () => {
    const categories: TriggerCategory[] = [
      "transitions", "sensory_overload", "peer_conflict", "contact_related",
      "anxiety", "frustration", "unmet_need", "change_of_routine",
      "specific_time", "unknown", "other",
    ];
    const plans = [
      makePlan({ id: "bsp1", triggers: categories }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(Object.keys(m.by_trigger)).toHaveLength(11);
  });

  // ── by_effectiveness ────────────────────────────────────────────────

  it("by_effectiveness groups counts by rating", () => {
    const plans = [
      makePlan({ id: "bsp1", effectiveness_rating: "effective" }),
      makePlan({ id: "bsp2", effectiveness_rating: "effective" }),
      makePlan({ id: "bsp3", effectiveness_rating: "not_effective" }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.by_effectiveness["effective"]).toBe(2);
    expect(m.by_effectiveness["not_effective"]).toBe(1);
  });

  it("by_effectiveness is empty for no plans", () => {
    const m = computeBspMetrics([], 10);
    expect(Object.keys(m.by_effectiveness)).toHaveLength(0);
  });

  it("by_effectiveness values sum to total_plans", () => {
    const plans = [
      makePlan({ id: "bsp1", effectiveness_rating: "effective" }),
      makePlan({ id: "bsp2", effectiveness_rating: "not_effective" }),
      makePlan({ id: "bsp3", effectiveness_rating: "highly_effective" }),
    ];
    const m = computeBspMetrics(plans, 10);
    const sum = Object.values(m.by_effectiveness).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_plans);
  });

  it("by_effectiveness has 5 entries when all ratings represented", () => {
    const ratings: EffectivenessRating[] = [
      "highly_effective", "effective", "partially_effective", "not_effective", "not_yet_evaluated",
    ];
    const plans = ratings.map((rating, i) =>
      makePlan({ id: `bsp${i}`, effectiveness_rating: rating }),
    );
    const m = computeBspMetrics(plans, 10);
    expect(Object.keys(m.by_effectiveness)).toHaveLength(5);
  });

  // ── mixed multi-plan scenario ─────────────────────────────────────

  it("correctly computes metrics for mixed multi-plan scenario", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_id: "child-1", bsp_status: "active",
        effectiveness_rating: "highly_effective",
        child_involved_in_plan: true, social_worker_approved: true,
        psychologist_input: true, staff_briefed: true,
        parent_informed: true, child_views: "Positive",
        incidents_since_last_review: 1,
        strategies: ["preventive", "de_escalation"],
        triggers: ["anxiety", "transitions"],
      }),
      makePlan({
        id: "bsp2", child_id: "child-2", bsp_status: "expired",
        effectiveness_rating: "not_effective",
        child_involved_in_plan: false, social_worker_approved: false,
        psychologist_input: false, staff_briefed: false,
        parent_informed: false, child_views: null,
        incidents_since_last_review: 5,
        strategies: ["therapeutic"],
        triggers: ["frustration"],
      }),
      makePlan({
        id: "bsp3", child_id: "child-3", bsp_status: "draft",
        effectiveness_rating: "not_yet_evaluated",
        child_involved_in_plan: true, social_worker_approved: false,
        psychologist_input: false, staff_briefed: false,
        parent_informed: true, child_views: null,
        incidents_since_last_review: 0,
        strategies: ["preventive"],
        triggers: ["anxiety"],
      }),
    ];
    const m = computeBspMetrics(plans, 6);
    expect(m.total_plans).toBe(3);
    expect(m.active_plans).toBe(1);
    expect(m.expired_plans).toBe(1);
    expect(m.draft_plans).toBe(1);
    expect(m.children_with_bsp).toBe(3);
    expect(m.bsp_coverage).toBe(50);
    expect(m.highly_effective_count).toBe(1);
    expect(m.effective_count).toBe(0);
    expect(m.not_effective_count).toBe(1);
    expect(m.not_evaluated_count).toBe(1);
    expect(m.child_involvement_rate).toBe(66.7);
    expect(m.social_worker_approved_rate).toBe(33.3);
    expect(m.psychologist_input_rate).toBe(33.3);
    expect(m.staff_briefed_rate).toBe(33.3);
    expect(m.parent_informed_rate).toBe(66.7);
    expect(m.child_views_rate).toBe(33.3);
    expect(m.average_incidents).toBe(2);
    expect(m.by_bsp_status["active"]).toBe(1);
    expect(m.by_bsp_status["expired"]).toBe(1);
    expect(m.by_bsp_status["draft"]).toBe(1);
    expect(m.by_strategy["preventive"]).toBe(2);
    expect(m.by_strategy["de_escalation"]).toBe(1);
    expect(m.by_strategy["therapeutic"]).toBe(1);
    expect(m.by_trigger["anxiety"]).toBe(2);
    expect(m.by_trigger["transitions"]).toBe(1);
    expect(m.by_trigger["frustration"]).toBe(1);
    expect(m.by_effectiveness["highly_effective"]).toBe(1);
    expect(m.by_effectiveness["not_effective"]).toBe(1);
    expect(m.by_effectiveness["not_yet_evaluated"]).toBe(1);
  });

  // ── large dataset ─────────────────────────────────────────────────

  it("handles large plans array efficiently", () => {
    const statuses: BspStatus[] = ["active", "under_review", "expired", "draft", "superseded"];
    const ratings: EffectivenessRating[] = [
      "highly_effective", "effective", "partially_effective", "not_effective", "not_yet_evaluated",
    ];
    const plans: BehaviourSupportPlan[] = [];
    for (let i = 0; i < 100; i++) {
      plans.push(
        makePlan({
          id: `bsp-${i}`,
          child_id: `child-${i % 20}`,
          bsp_status: statuses[i % 5],
          effectiveness_rating: ratings[i % 5],
          child_involved_in_plan: i % 2 === 0,
          social_worker_approved: i % 3 === 0,
          psychologist_input: i % 4 === 0,
          staff_briefed: i % 2 === 0,
          parent_informed: i % 3 === 0,
          child_views: i % 2 === 0 ? "views" : null,
          incidents_since_last_review: i % 10,
          strategies: ["preventive", "therapeutic"] as any,
          triggers: ["anxiety", "frustration"] as any,
        }),
      );
    }
    const m = computeBspMetrics(plans, 50);
    expect(m.total_plans).toBe(100);
    expect(m.children_with_bsp).toBe(20);
    expect(m.bsp_coverage).toBe(40);
  });

  // ── single plan with all flags true ───────────────────────────────

  it("single plan with all boolean flags true", () => {
    const plans = [
      makePlan({
        id: "bsp1",
        child_involved_in_plan: true,
        social_worker_approved: true,
        psychologist_input: true,
        staff_briefed: true,
        parent_informed: true,
        child_views: "Views recorded",
      }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.child_involvement_rate).toBe(100);
    expect(m.social_worker_approved_rate).toBe(100);
    expect(m.psychologist_input_rate).toBe(100);
    expect(m.staff_briefed_rate).toBe(100);
    expect(m.parent_informed_rate).toBe(100);
    expect(m.child_views_rate).toBe(100);
  });

  it("single plan with all boolean flags false", () => {
    const plans = [
      makePlan({
        id: "bsp1",
        child_involved_in_plan: false,
        social_worker_approved: false,
        psychologist_input: false,
        staff_briefed: false,
        parent_informed: false,
        child_views: null,
      }),
    ];
    const m = computeBspMetrics(plans, 10);
    expect(m.child_involvement_rate).toBe(0);
    expect(m.social_worker_approved_rate).toBe(0);
    expect(m.psychologist_input_rate).toBe(0);
    expect(m.staff_briefed_rate).toBe(0);
    expect(m.parent_informed_rate).toBe(0);
    expect(m.child_views_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyBspAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyBspAlerts", () => {
  // ── no alerts when clean ───────────────────────────────────────────

  it("returns empty array for empty plans", () => {
    const alerts = identifyBspAlerts([], 0, now);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all data is clean", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        effectiveness_rating: "effective",
        staff_briefed: true,
        child_involved_in_plan: true,
        next_review_date: null,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts).toEqual([]);
  });

  it("returns empty array for draft plans with issues", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "draft",
        effectiveness_rating: "not_effective",
        staff_briefed: false,
        child_involved_in_plan: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    // draft status means not active, so no active-only alerts
    // not_effective only triggers when active
    // staff_not_briefed only triggers when active
    // child_not_involved only triggers when active
    expect(alerts).toEqual([]);
  });

  // ── bsp_not_effective alert ────────────────────────────────────────

  it("generates bsp_not_effective alert for active + not_effective", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        effectiveness_rating: "not_effective",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "bsp_not_effective");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("critical");
    expect(alert!.id).toBe("bsp1");
  });

  it("bsp_not_effective alert includes child name", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Bob Jones", bsp_status: "active",
        effectiveness_rating: "not_effective",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "bsp_not_effective");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("bsp_not_effective alert message mentions not effective", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        effectiveness_rating: "not_effective",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "bsp_not_effective");
    expect(alert!.message.toLowerCase()).toContain("not effective");
  });

  it("no bsp_not_effective alert when rating is effective", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        effectiveness_rating: "effective",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "bsp_not_effective")).toBeUndefined();
  });

  it("no bsp_not_effective alert when rating is highly_effective", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        effectiveness_rating: "highly_effective",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "bsp_not_effective")).toBeUndefined();
  });

  it("no bsp_not_effective alert when rating is partially_effective or not_yet_evaluated", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "active", effectiveness_rating: "partially_effective" }),
      makePlan({ id: "bsp2", bsp_status: "active", effectiveness_rating: "not_yet_evaluated" }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "bsp_not_effective")).toBeUndefined();
  });

  it("no bsp_not_effective alert when not active even if not_effective", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "expired",
        effectiveness_rating: "not_effective",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "bsp_not_effective")).toBeUndefined();
  });

  it("generates multiple bsp_not_effective alerts for different plans", () => {
    const plans = [
      makePlan({ id: "bsp1", child_name: "Alice", bsp_status: "active", effectiveness_rating: "not_effective" }),
      makePlan({ id: "bsp2", child_name: "Bob", bsp_status: "active", effectiveness_rating: "not_effective" }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const effectAlerts = alerts.filter((a) => a.type === "bsp_not_effective");
    expect(effectAlerts).toHaveLength(2);
  });

  // ── bsp_expired alert ─────────────────────────────────────────────

  it("generates bsp_expired alert for expired status", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "expired",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "bsp_expired");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("bsp1");
  });

  it("bsp_expired alert includes child name", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Carol Davies", bsp_status: "expired",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "bsp_expired");
    expect(alert!.message).toContain("Carol Davies");
  });

  it("bsp_expired alert message mentions expired", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "expired",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "bsp_expired");
    expect(alert!.message.toLowerCase()).toContain("expired");
  });

  it("no bsp_expired alert when status is active", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "active" }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "bsp_expired")).toBeUndefined();
  });

  it("no bsp_expired alert when status is draft", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "draft" }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "bsp_expired")).toBeUndefined();
  });

  it("generates multiple bsp_expired alerts for different plans", () => {
    const plans = [
      makePlan({ id: "bsp1", child_name: "Alice", bsp_status: "expired" }),
      makePlan({ id: "bsp2", child_name: "Bob", bsp_status: "expired" }),
      makePlan({ id: "bsp3", child_name: "Carol", bsp_status: "active" }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const expiredAlerts = alerts.filter((a) => a.type === "bsp_expired");
    expect(expiredAlerts).toHaveLength(2);
  });

  // ── staff_not_briefed alert ────────────────────────────────────────

  it("generates staff_not_briefed alert for active + not briefed", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        staff_briefed: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "staff_not_briefed");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("bsp1");
  });

  it("staff_not_briefed alert includes child name", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Bob Jones", bsp_status: "active",
        staff_briefed: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "staff_not_briefed");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("staff_not_briefed alert message mentions staff", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        staff_briefed: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "staff_not_briefed");
    expect(alert!.message.toLowerCase()).toContain("staff");
  });

  it("no staff_not_briefed alert when staff briefed is true", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        staff_briefed: true,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "staff_not_briefed")).toBeUndefined();
  });

  it("no staff_not_briefed alert when not active even if not briefed", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "expired",
        staff_briefed: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "staff_not_briefed")).toBeUndefined();
  });

  it("no staff_not_briefed alert for draft plan with staff not briefed", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "draft",
        staff_briefed: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "staff_not_briefed")).toBeUndefined();
  });

  it("generates multiple staff_not_briefed alerts for different plans", () => {
    const plans = [
      makePlan({ id: "bsp1", child_name: "Alice", bsp_status: "active", staff_briefed: false }),
      makePlan({ id: "bsp2", child_name: "Bob", bsp_status: "active", staff_briefed: false }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const staffAlerts = alerts.filter((a) => a.type === "staff_not_briefed");
    expect(staffAlerts).toHaveLength(2);
  });

  // ── review_overdue alert ──────────────────────────────────────────

  it("generates review_overdue alert for active + past next_review_date", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 7);
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        next_review_date: pastDate.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("medium");
    expect(alert!.id).toBe("bsp1");
  });

  it("review_overdue alert includes child name", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 14);
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Carol Davies", bsp_status: "active",
        next_review_date: pastDate.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert!.message).toContain("Carol Davies");
  });

  it("review_overdue alert message mentions overdue date", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 7);
    const dateStr = pastDate.toISOString().split("T")[0];
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        next_review_date: dateStr,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert!.message).toContain(dateStr);
  });

  it("no review_overdue alert when next_review_date is in the future", () => {
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 30);
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        next_review_date: futureDate.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
  });

  it("no review_overdue alert when next_review_date is null", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        next_review_date: null,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
  });

  it("no review_overdue alert when not active even if review overdue", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 7);
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "expired",
        next_review_date: pastDate.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
  });

  it("generates multiple review_overdue alerts for different plans", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 7);
    const plans = [
      makePlan({ id: "bsp1", child_name: "Alice", bsp_status: "active", next_review_date: pastDate.toISOString().split("T")[0] }),
      makePlan({ id: "bsp2", child_name: "Bob", bsp_status: "active", next_review_date: pastDate.toISOString().split("T")[0] }),
      makePlan({ id: "bsp3", child_name: "Carol", bsp_status: "active", next_review_date: null }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const reviewAlerts = alerts.filter((a) => a.type === "review_overdue");
    expect(reviewAlerts).toHaveLength(2);
  });

  // ── child_not_involved alert ──────────────────────────────────────

  it("generates child_not_involved alert for active + not involved", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        child_involved_in_plan: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "child_not_involved");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("medium");
    expect(alert!.id).toBe("bsp1");
  });

  it("child_not_involved alert includes child name", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Bob Jones", bsp_status: "active",
        child_involved_in_plan: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "child_not_involved");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("child_not_involved alert message mentions participation or involved", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        child_involved_in_plan: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "child_not_involved");
    expect(alert!.message.toLowerCase()).toMatch(/involved|participation/);
  });

  it("no child_not_involved alert when child is involved", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        child_involved_in_plan: true,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "child_not_involved")).toBeUndefined();
  });

  it("no child_not_involved alert when not active even if not involved", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "expired",
        child_involved_in_plan: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    expect(alerts.find((a) => a.type === "child_not_involved")).toBeUndefined();
  });

  it("generates multiple child_not_involved alerts for different plans", () => {
    const plans = [
      makePlan({ id: "bsp1", child_name: "Alice", bsp_status: "active", child_involved_in_plan: false }),
      makePlan({ id: "bsp2", child_name: "Bob", bsp_status: "active", child_involved_in_plan: false }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const involvedAlerts = alerts.filter((a) => a.type === "child_not_involved");
    expect(involvedAlerts).toHaveLength(2);
  });

  // ── combined alerts ───────────────────────────────────────────────

  it("generates all five alert types together when conditions are met", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 7);
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        effectiveness_rating: "not_effective",
        staff_briefed: false,
        child_involved_in_plan: false,
        next_review_date: pastDate.toISOString().split("T")[0],
      }),
      makePlan({
        id: "bsp2", child_name: "Bob", bsp_status: "expired",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("bsp_not_effective");
    expect(types).toContain("bsp_expired");
    expect(types).toContain("staff_not_briefed");
    expect(types).toContain("review_overdue");
    expect(types).toContain("child_not_involved");
  });

  it("alert severity values are correct types", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 7);
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        effectiveness_rating: "not_effective",
        staff_briefed: false,
        child_involved_in_plan: false,
        next_review_date: pastDate.toISOString().split("T")[0],
      }),
      makePlan({
        id: "bsp2", child_name: "Bob", bsp_status: "expired",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    for (const alert of alerts) {
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("each alert has a non-empty message", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        effectiveness_rating: "not_effective",
        staff_briefed: false,
        child_involved_in_plan: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty id", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "active",
        effectiveness_rating: "not_effective",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    for (const alert of alerts) {
      expect(alert.id.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty type", () => {
    const plans = [
      makePlan({
        id: "bsp1", child_name: "Alice", bsp_status: "expired",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    for (const alert of alerts) {
      expect(alert.type.length).toBeGreaterThan(0);
    }
  });

  it("bsp_not_effective is critical severity", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        effectiveness_rating: "not_effective",
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "bsp_not_effective");
    expect(alert!.severity).toBe("critical");
  });

  it("bsp_expired is high severity", () => {
    const plans = [
      makePlan({ id: "bsp1", bsp_status: "expired" }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "bsp_expired");
    expect(alert!.severity).toBe("high");
  });

  it("staff_not_briefed is high severity", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        staff_briefed: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "staff_not_briefed");
    expect(alert!.severity).toBe("high");
  });

  it("review_overdue is medium severity", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 7);
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        next_review_date: pastDate.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert!.severity).toBe("medium");
  });

  it("child_not_involved is medium severity", () => {
    const plans = [
      makePlan({
        id: "bsp1", bsp_status: "active",
        child_involved_in_plan: false,
      }),
    ];
    const alerts = identifyBspAlerts(plans, 5, now);
    const alert = alerts.find((a) => a.type === "child_not_involved");
    expect(alert!.severity).toBe("medium");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listPlans ─────────────────────────────────────────────────────

  it("listPlans returns ok: true with empty array", async () => {
    const result = await listPlans("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlans returns ok: true with childId filter", async () => {
    const result = await listPlans("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlans returns ok: true with bspStatus filter", async () => {
    const result = await listPlans("home-1", { bspStatus: "active" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlans returns ok: true with effectivenessRating filter", async () => {
    const result = await listPlans("home-1", { effectivenessRating: "effective" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlans returns ok: true with limit filter", async () => {
    const result = await listPlans("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPlans returns ok: true with all filters combined", async () => {
    const result = await listPlans("home-1", {
      childId: "child-1",
      bspStatus: "active",
      effectivenessRating: "highly_effective",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createPlan ────────────────────────────────────────────────────

  it("createPlan returns ok: false with error message", async () => {
    const result = await createPlan({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      bspStatus: "active",
      createdDate: "2025-06-01",
      createdBy: "Staff A",
      triggers: ["anxiety"],
      strategies: ["preventive"],
      positiveReinforcements: ["praise"],
      deEscalationSteps: ["calm voice"],
      effectivenessRating: "effective",
      incidentsSinceLastReview: 2,
      childInvolvedInPlan: true,
      parentInformed: true,
      socialWorkerApproved: true,
      psychologistInput: true,
      staffBriefed: true,
    });
    expect(result.ok).toBe(false);
  });

  it("createPlan error message mentions Supabase", async () => {
    const result = await createPlan({
      homeId: "home-1",
      childName: "Alice",
      childId: "child-1",
      bspStatus: "active",
      createdDate: "2025-06-01",
      createdBy: "Staff A",
      triggers: ["anxiety"],
      strategies: ["preventive"],
      positiveReinforcements: [],
      deEscalationSteps: [],
      effectivenessRating: "effective",
      incidentsSinceLastReview: 0,
      childInvolvedInPlan: true,
      parentInformed: true,
      socialWorkerApproved: true,
      psychologistInput: false,
      staffBriefed: true,
    });
    if (!result.ok) {
      expect(result.error!.toLowerCase()).toContain("supabase");
    }
  });

  // ── updatePlan ────────────────────────────────────────────────────

  it("updatePlan returns ok: false with error message", async () => {
    const result = await updatePlan("bsp-1", { bsp_status: "expired" });
    expect(result.ok).toBe(false);
  });

  it("updatePlan error message mentions Supabase", async () => {
    const result = await updatePlan("bsp-1", { staff_briefed: true });
    if (!result.ok) {
      expect(result.error!.toLowerCase()).toContain("supabase");
    }
  });
});
