import { describe, it, expect } from "vitest";
import {
  computeDischargeMetrics,
  identifyDischargeAlerts,
  DischargeReview,
} from "./discharge-transition-service";

function makeReview(overrides: Partial<DischargeReview> = {}): DischargeReview {
  return {
    id: "dr-1",
    home_id: "home-1",
    child_name: "Alice",
    child_id: "child-1",
    discharge_reason: "planned_move",
    planned_date: "2026-06-15",
    actual_date: null,
    readiness_level: "fully_ready",
    review_status: "completed",
    review_date: "2026-05-01",
    reviewed_by: "Manager A",
    destination: "Foster placement",
    support_packages: ["pathway_plan", "personal_adviser"],
    child_views_recorded: true,
    child_wants_to_leave: true,
    social_worker_involved: true,
    family_consulted: true,
    education_plan_in_place: true,
    health_needs_transferred: true,
    life_story_work_complete: true,
    goodbye_event_planned: true,
    notes: null,
    created_at: "2026-05-01T09:00:00Z",
    updated_at: "2026-05-01T09:00:00Z",
    ...overrides,
  };
}

// ── computeDischargeMetrics ────────────────────────────────────────────

describe("computeDischargeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeDischargeMetrics([]);
    expect(m.total_reviews).toBe(0);
    expect(m.fully_ready_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.unplanned_breakdowns).toBe(0);
  });

  it("calculates correct metrics for populated data", () => {
    const reviews = [
      makeReview({ readiness_level: "fully_ready", review_status: "completed" }),
      makeReview({ id: "dr-2", readiness_level: "not_ready", review_status: "overdue", child_views_recorded: false, social_worker_involved: false }),
      makeReview({ id: "dr-3", discharge_reason: "unplanned_breakdown", readiness_level: "not_assessed", review_status: "scheduled" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.total_reviews).toBe(3);
    expect(m.fully_ready_count).toBe(1);
    expect(m.not_ready_count).toBe(1);
    expect(m.not_assessed_count).toBe(1);
    expect(m.completed_reviews).toBe(1);
    expect(m.overdue_reviews).toBe(1);
    expect(m.unplanned_breakdowns).toBe(1);
    expect(m.child_views_rate).toBe(66.7);
    expect(m.social_worker_involved_rate).toBe(66.7);
  });

  it("counts support packages correctly", () => {
    const reviews = [
      makeReview({ support_packages: ["pathway_plan", "financial_support"] }),
      makeReview({ id: "dr-2", support_packages: ["pathway_plan"] }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.by_support_package["pathway_plan"]).toBe(2);
    expect(m.by_support_package["financial_support"]).toBe(1);
  });
});

// ── identifyDischargeAlerts ────────────────────────────────────────────

describe("identifyDischargeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyDischargeAlerts([])).toEqual([]);
  });

  it("alerts critical for child not ready with no actual date", () => {
    const reviews = [
      makeReview({ readiness_level: "not_ready", actual_date: null }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const notReady = alerts.find((a) => a.type === "not_ready");
    expect(notReady).toBeDefined();
    expect(notReady!.severity).toBe("critical");
  });

  it("does not alert not_ready if already discharged", () => {
    const reviews = [
      makeReview({ readiness_level: "not_ready", actual_date: "2026-05-20" }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    expect(alerts.find((a) => a.type === "not_ready")).toBeUndefined();
  });

  it("alerts high for overdue review status", () => {
    const reviews = [makeReview({ review_status: "overdue" })];
    const alerts = identifyDischargeAlerts(reviews);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeDefined();
  });

  it("alerts high for health not transferred when child has left", () => {
    const reviews = [
      makeReview({ health_needs_transferred: false, actual_date: "2026-05-20" }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    expect(alerts.find((a) => a.type === "health_not_transferred")).toBeDefined();
  });

  it("alerts high for unplanned breakdown", () => {
    const reviews = [makeReview({ discharge_reason: "unplanned_breakdown" })];
    const alerts = identifyDischargeAlerts(reviews);
    expect(alerts.find((a) => a.type === "unplanned_breakdown")).toBeDefined();
  });

  it("alerts medium for child views not recorded when still in placement", () => {
    const reviews = [makeReview({ child_views_recorded: false, actual_date: null })];
    const alerts = identifyDischargeAlerts(reviews);
    expect(alerts.find((a) => a.type === "child_views_missing")).toBeDefined();
  });

  it("does not alert child_views_missing if child has left", () => {
    const reviews = [makeReview({ child_views_recorded: false, actual_date: "2026-05-20" })];
    const alerts = identifyDischargeAlerts(reviews);
    expect(alerts.find((a) => a.type === "child_views_missing")).toBeUndefined();
  });
});
