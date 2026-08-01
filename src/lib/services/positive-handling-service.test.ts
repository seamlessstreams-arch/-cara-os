import { describe, it, expect } from "vitest";
import {
  computePositiveHandlingMetrics,
  identifyPositiveHandlingAlerts,
} from "./positive-handling-service";
import type { PositiveHandlingRecord } from "./positive-handling-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PositiveHandlingRecord> = {}): PositiveHandlingRecord {
  return {
    id: "ph-1",
    home_id: "home-1",
    plan_type: "positive_handling_plan",
    review_outcome: "plan_effective",
    trigger_category: "emotional",
    intervention_level: "verbal_de_escalation",
    review_date: "2026-05-01",
    child_name: "Alex",
    child_id: "child-1",
    triggers_identified: true,
    early_warning_signs: true,
    de_escalation_steps: true,
    calming_strategies: true,
    staff_trained: true,
    child_consulted: true,
    parent_informed: true,
    social_worker_informed: true,
    plan_accessible: true,
    regularly_reviewed: true,
    post_incident_support: true,
    medication_considered: false,
    issues_found: [],
    actions_taken: [],
    reviewed_by: "Staff A",
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePositiveHandlingMetrics -------------------------------------------

describe("computePositiveHandlingMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePositiveHandlingMetrics([]);
    expect(m.total_reviews).toBe(0);
    expect(m.effective_count).toBe(0);
    expect(m.needs_revision_count).toBe(0);
    expect(m.escalation_required_count).toBe(0);
    expect(m.triggers_identified_rate).toBeNull();;
    expect(m.early_warning_rate).toBeNull();;
    expect(m.de_escalation_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts effective, needs_revision, and escalation outcomes", () => {
    const records = [
      makeRecord({ id: "1", review_outcome: "plan_effective" }),
      makeRecord({ id: "2", review_outcome: "plan_effective" }),
      makeRecord({ id: "3", review_outcome: "plan_needs_revision" }),
      makeRecord({ id: "4", review_outcome: "escalation_required" }),
      makeRecord({ id: "5", review_outcome: "plan_partially_effective" }),
    ];
    const m = computePositiveHandlingMetrics(records);
    expect(m.total_reviews).toBe(5);
    expect(m.effective_count).toBe(2);
    expect(m.needs_revision_count).toBe(1);
    expect(m.escalation_required_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", triggers_identified: true, staff_trained: true }),
      makeRecord({ id: "2", triggers_identified: false, staff_trained: false }),
    ];
    const m = computePositiveHandlingMetrics(records);
    expect(m.triggers_identified_rate).toBe(50);
    expect(m.staff_trained_rate).toBe(50);
  });

  it("counts unique children correctly", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computePositiveHandlingMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("populates breakdown records by plan_type, trigger_category, etc.", () => {
    const records = [
      makeRecord({ id: "1", plan_type: "positive_handling_plan", trigger_category: "emotional", intervention_level: "verbal_de_escalation" }),
      makeRecord({ id: "2", plan_type: "de_escalation_strategy", trigger_category: "sensory", intervention_level: "guided_away" }),
    ];
    const m = computePositiveHandlingMetrics(records);
    expect(m.by_plan_type).toEqual({ positive_handling_plan: 1, de_escalation_strategy: 1 });
    expect(m.by_trigger_category).toEqual({ emotional: 1, sensory: 1 });
    expect(m.by_intervention_level).toEqual({ verbal_de_escalation: 1, guided_away: 1 });
  });

  it("computes 100% rates when all booleans are true", () => {
    const records = [makeRecord(), makeRecord({ id: "2" })];
    const m = computePositiveHandlingMetrics(records);
    expect(m.triggers_identified_rate).toBe(100);
    expect(m.child_consulted_rate).toBe(100);
    expect(m.plan_accessible_rate).toBe(100);
    expect(m.regularly_reviewed_rate).toBe(100);
  });
});

// -- identifyPositiveHandlingAlerts -------------------------------------------

describe("identifyPositiveHandlingAlerts", () => {
  it("returns empty alerts for empty records", () => {
    const alerts = identifyPositiveHandlingAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("returns empty alerts when all records are compliant", () => {
    const alerts = identifyPositiveHandlingAlerts([makeRecord()]);
    expect(alerts).toHaveLength(0);
  });

  it("fires critical alert for escalation_required with staff not trained", () => {
    const records = [
      makeRecord({ review_outcome: "escalation_required", staff_trained: false }),
    ];
    const alerts = identifyPositiveHandlingAlerts(records);
    const critical = alerts.filter((a) => a.type === "escalation_untrained");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("fires high alert when 1 plan has no de-escalation steps (threshold >= 1)", () => {
    const records = [makeRecord({ de_escalation_steps: false })];
    const alerts = identifyPositiveHandlingAlerts(records);
    const deEsc = alerts.filter((a) => a.type === "no_de_escalation");
    expect(deEsc).toHaveLength(1);
    expect(deEsc[0].severity).toBe("high");
  });

  it("fires high alert when 1 plan has child not consulted (threshold >= 1)", () => {
    const records = [makeRecord({ child_consulted: false })];
    const alerts = identifyPositiveHandlingAlerts(records);
    const notConsulted = alerts.filter((a) => a.type === "child_not_consulted");
    expect(notConsulted).toHaveLength(1);
    expect(notConsulted[0].severity).toBe("high");
  });

  it("fires medium alert for plan_not_accessible at threshold of 2", () => {
    // 1 not accessible should NOT trigger
    const alerts1 = identifyPositiveHandlingAlerts([makeRecord({ plan_accessible: false })]);
    expect(alerts1.filter((a) => a.type === "plan_not_accessible")).toHaveLength(0);

    // 2 not accessible SHOULD trigger
    const alerts2 = identifyPositiveHandlingAlerts([
      makeRecord({ id: "1", plan_accessible: false }),
      makeRecord({ id: "2", plan_accessible: false }),
    ]);
    const medium = alerts2.filter((a) => a.type === "plan_not_accessible");
    expect(medium).toHaveLength(1);
    expect(medium[0].severity).toBe("medium");
  });

  it("fires medium alert for not_regularly_reviewed at threshold of 2", () => {
    const alerts1 = identifyPositiveHandlingAlerts([makeRecord({ regularly_reviewed: false })]);
    expect(alerts1.filter((a) => a.type === "not_regularly_reviewed")).toHaveLength(0);

    const alerts2 = identifyPositiveHandlingAlerts([
      makeRecord({ id: "1", regularly_reviewed: false }),
      makeRecord({ id: "2", regularly_reviewed: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "not_regularly_reviewed")).toHaveLength(1);
  });
});
