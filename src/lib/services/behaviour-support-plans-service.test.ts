import { describe, it, expect } from "vitest";
import {
  computeBspMetrics,
  identifyBspAlerts,
  type BehaviourSupportPlan,
} from "./behaviour-support-plans-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makePlan(overrides: Partial<BehaviourSupportPlan> = {}): BehaviourSupportPlan {
  return {
    id: "bsp-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    bsp_status: "active",
    created_date: "2026-04-01",
    review_date: null,
    next_review_date: null,
    created_by: "Staff A",
    reviewed_by: null,
    triggers: ["anxiety"],
    trigger_details: null,
    strategies: ["preventive"],
    strategy_details: null,
    positive_reinforcements: ["verbal praise"],
    de_escalation_steps: ["offer space"],
    effectiveness_rating: "effective",
    incidents_since_last_review: 2,
    child_involved_in_plan: true,
    child_views: "Likes the approach",
    parent_informed: true,
    social_worker_approved: true,
    psychologist_input: true,
    staff_briefed: true,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeBspMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeBspMetrics([], 5);
    expect(m.total_plans).toBe(0);
    expect(m.active_plans).toBe(0);
    expect(m.bsp_coverage).toBe(0);
    expect(m.child_involvement_rate).toBeNull();;
  });

  it("computes active/expired/draft counts and coverage", () => {
    const plans = [
      makePlan({ id: "1", child_id: "c1", bsp_status: "active" }),
      makePlan({ id: "2", child_id: "c2", bsp_status: "expired" }),
      makePlan({ id: "3", child_id: "c3", bsp_status: "draft" }),
    ];
    const m = computeBspMetrics(plans, 6);
    expect(m.total_plans).toBe(3);
    expect(m.active_plans).toBe(1);
    expect(m.expired_plans).toBe(1);
    expect(m.draft_plans).toBe(1);
    expect(m.children_with_bsp).toBe(3);
    expect(m.bsp_coverage).toBe(50);
  });

  it("computes effectiveness counts", () => {
    const plans = [
      makePlan({ id: "1", effectiveness_rating: "highly_effective" }),
      makePlan({ id: "2", effectiveness_rating: "not_effective" }),
      makePlan({ id: "3", effectiveness_rating: "not_yet_evaluated" }),
    ];
    const m = computeBspMetrics(plans, 3);
    expect(m.highly_effective_count).toBe(1);
    expect(m.not_effective_count).toBe(1);
    expect(m.not_evaluated_count).toBe(1);
  });

  it("computes boolean rates and average incidents", () => {
    const plans = [
      makePlan({ id: "1", child_involved_in_plan: true, staff_briefed: true, incidents_since_last_review: 4 }),
      makePlan({ id: "2", child_involved_in_plan: false, staff_briefed: false, incidents_since_last_review: 6 }),
    ];
    const m = computeBspMetrics(plans, 2);
    expect(m.child_involvement_rate).toBe(50);
    expect(m.staff_briefed_rate).toBe(50);
    expect(m.average_incidents).toBe(5);
  });

  it("builds strategy and trigger breakdowns from arrays", () => {
    const plans = [
      makePlan({ id: "1", strategies: ["preventive", "de_escalation"], triggers: ["anxiety", "transitions"] }),
      makePlan({ id: "2", strategies: ["preventive"], triggers: ["anxiety"] }),
    ];
    const m = computeBspMetrics(plans, 2);
    expect(m.by_strategy).toEqual({ preventive: 2, de_escalation: 1 });
    expect(m.by_trigger).toEqual({ anxiety: 2, transitions: 1 });
  });
});

describe("identifyBspAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyBspAlerts([], 5, NOW)).toEqual([]);
  });

  it("fires critical alert for active BSP rated not_effective", () => {
    const plans = [makePlan({ id: "b1", bsp_status: "active", effectiveness_rating: "not_effective", child_name: "Alice" })];
    const alerts = identifyBspAlerts(plans, 5, NOW);
    const a = alerts.find((a) => a.type === "bsp_not_effective");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("fires high alert for expired BSP", () => {
    const plans = [makePlan({ id: "b2", bsp_status: "expired" })];
    const alerts = identifyBspAlerts(plans, 5, NOW);
    expect(alerts.find((a) => a.type === "bsp_expired")).toBeDefined();
  });

  it("fires high alert for staff not briefed on active plan", () => {
    const plans = [makePlan({ id: "b3", bsp_status: "active", staff_briefed: false })];
    const alerts = identifyBspAlerts(plans, 5, NOW);
    expect(alerts.find((a) => a.type === "staff_not_briefed")).toBeDefined();
  });

  it("fires medium alert for review overdue on active plan", () => {
    const plans = [makePlan({ id: "b4", bsp_status: "active", next_review_date: "2025-01-01" })];
    const alerts = identifyBspAlerts(plans, 5, NOW);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeDefined();
  });

  it("does NOT fire review_overdue for expired plans", () => {
    const plans = [makePlan({ id: "b5", bsp_status: "expired", next_review_date: "2025-01-01" })];
    const alerts = identifyBspAlerts(plans, 5, NOW);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
  });

  it("fires medium alert for child not involved in active plan", () => {
    const plans = [makePlan({ id: "b6", bsp_status: "active", child_involved_in_plan: false })];
    const alerts = identifyBspAlerts(plans, 5, NOW);
    expect(alerts.find((a) => a.type === "child_not_involved")).toBeDefined();
  });
});
