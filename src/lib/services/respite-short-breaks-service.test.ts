import { describe, it, expect } from "vitest";
import {
  computeRespiteMetrics,
  identifyRespiteAlerts,
  type RespiteRecord,
} from "./respite-short-breaks-service";

function makeRecord(overrides: Partial<RespiteRecord> = {}): RespiteRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "c1",
    break_type: "planned_respite",
    break_reason: "child_request",
    break_status: "completed",
    start_date: "2025-04-01",
    end_date: "2025-04-03",
    duration_nights: 2,
    provider_name: "Provider A",
    provider_type: "host_family",
    child_views_sought: true,
    child_wants_break: true,
    social_worker_approved: true,
    risk_assessment_completed: true,
    child_impact: "positive",
    child_feedback: "Enjoyed it",
    return_plan_in_place: true,
    notes: null,
    created_at: "2025-04-01T00:00:00Z",
    updated_at: "2025-04-03T00:00:00Z",
    ...overrides,
  };
}

describe("computeRespiteMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeRespiteMetrics([], 0);
    expect(m.total_breaks).toBe(0);
    expect(m.children_with_breaks).toBe(0);
    expect(m.break_usage_rate).toBeNull();; expect(m.planned_count).toBe(0);
    expect(m.emergency_count).toBe(0);
    expect(m.total_nights).toBe(0);
    expect(m.average_duration).toBeNull();; expect(m.child_views_sought_rate).toBeNull();; expect(m.positive_impact_rate).toBeNull();; expect(m.negative_impact_rate).toBeNull();; });

  it("counts break types", () => {
    const records = [
      makeRecord({ break_type: "planned_respite" }),
      makeRecord({ id: "r2", break_type: "emergency_break" }),
      makeRecord({ id: "r3", break_type: "planned_respite" }),
    ];
    const m = computeRespiteMetrics(records, 3);
    expect(m.planned_count).toBe(2);
    expect(m.emergency_count).toBe(1);
  });

  it("counts break statuses", () => {
    const records = [
      makeRecord({ break_status: "completed" }),
      makeRecord({ id: "r2", break_status: "cancelled" }),
      makeRecord({ id: "r3", break_status: "cut_short" }),
    ];
    const m = computeRespiteMetrics(records, 3);
    expect(m.completed_count).toBe(1);
    expect(m.cancelled_count).toBe(1);
    expect(m.cut_short_count).toBe(1);
  });

  it("calculates total nights and average duration", () => {
    const records = [
      makeRecord({ duration_nights: 2 }),
      makeRecord({ id: "r2", duration_nights: 4 }),
    ];
    const m = computeRespiteMetrics(records, 2);
    expect(m.total_nights).toBe(6);
    expect(m.average_duration).toBe(3);
  });

  it("calculates break usage rate", () => {
    const records = [
      makeRecord({ child_id: "c1" }),
      makeRecord({ id: "r2", child_id: "c1" }),
      makeRecord({ id: "r3", child_id: "c2" }),
    ];
    const m = computeRespiteMetrics(records, 4);
    expect(m.children_with_breaks).toBe(2);
    expect(m.break_usage_rate).toBe(50);
  });

  it("calculates positive and negative impact rates (excluding not_assessed)", () => {
    const records = [
      makeRecord({ child_impact: "positive" }),
      makeRecord({ id: "r2", child_impact: "negative" }),
      makeRecord({ id: "r3", child_impact: "not_assessed" }),
    ];
    const m = computeRespiteMetrics(records, 3);
    expect(m.positive_impact_rate).toBe(50);
    expect(m.negative_impact_rate).toBe(50);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ child_views_sought: true, social_worker_approved: true }),
      makeRecord({ id: "r2", child_views_sought: false, social_worker_approved: false }),
    ];
    const m = computeRespiteMetrics(records, 2);
    expect(m.child_views_sought_rate).toBe(50);
    expect(m.social_worker_approved_rate).toBe(50);
  });
});

describe("identifyRespiteAlerts", () => {
  it("returns empty for no data", () => {
    expect(identifyRespiteAlerts([])).toEqual([]);
  });

  it("critical alert for very negative impact", () => {
    const records = [makeRecord({ child_impact: "very_negative" })];
    const alerts = identifyRespiteAlerts(records);
    expect(alerts.some((a) => a.type === "very_negative_impact" && a.severity === "critical")).toBe(true);
  });

  it("no critical alert for just negative impact", () => {
    const records = [makeRecord({ child_impact: "negative" })];
    const alerts = identifyRespiteAlerts(records);
    expect(alerts.some((a) => a.type === "very_negative_impact")).toBe(false);
  });

  it("high alert for emergency break without risk assessment", () => {
    const records = [makeRecord({ break_type: "emergency_break", risk_assessment_completed: false })];
    const alerts = identifyRespiteAlerts(records);
    expect(alerts.some((a) => a.type === "emergency_no_risk_ax" && a.severity === "high")).toBe(true);
  });

  it("high alert when >= 2 breaks without child views (non-cancelled)", () => {
    const records = [
      makeRecord({ child_views_sought: false, break_status: "completed" }),
      makeRecord({ id: "r2", child_views_sought: false, break_status: "completed" }),
    ];
    const alerts = identifyRespiteAlerts(records);
    expect(alerts.some((a) => a.type === "child_views_missing" && a.severity === "high")).toBe(true);
  });

  it("no child_views_missing alert when cancelled breaks lack views", () => {
    const records = [
      makeRecord({ child_views_sought: false, break_status: "cancelled" }),
      makeRecord({ id: "r2", child_views_sought: false, break_status: "cancelled" }),
    ];
    const alerts = identifyRespiteAlerts(records);
    expect(alerts.some((a) => a.type === "child_views_missing")).toBe(false);
  });

  it("medium alert when >= 2 breaks cut short", () => {
    const records = [
      makeRecord({ break_status: "cut_short" }),
      makeRecord({ id: "r2", break_status: "cut_short" }),
    ];
    const alerts = identifyRespiteAlerts(records);
    expect(alerts.some((a) => a.type === "breaks_cut_short" && a.severity === "medium")).toBe(true);
  });

  it("medium alert when active breaks have no return plan", () => {
    const records = [makeRecord({ break_status: "in_progress", return_plan_in_place: false })];
    const alerts = identifyRespiteAlerts(records);
    expect(alerts.some((a) => a.type === "no_return_plan" && a.severity === "medium")).toBe(true);
  });
});
