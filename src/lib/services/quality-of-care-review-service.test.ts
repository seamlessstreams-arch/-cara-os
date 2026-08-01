import { describe, it, expect } from "vitest";
import {
  computeQualityOfCareMetrics,
  computeQualityOfCareAlerts,
} from "./quality-of-care-review-service";
import type { QualityOfCareReviewRow } from "./quality-of-care-review-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<QualityOfCareReviewRow> = {}): QualityOfCareReviewRow {
  return {
    id: "qoc-1",
    home_id: "home-1",
    review_date: "2026-05-01",
    review_period_start: "2025-11-01",
    review_period_end: "2026-05-01",
    review_domain: "overall_experiences",
    domain_rating: "good",
    review_frequency: "six_monthly",
    action_priority: "low",
    reviewer_name: "Manager A",
    children_consulted: true,
    staff_consulted: true,
    external_feedback_included: true,
    reg44_reports_reviewed: true,
    improvement_actions_identified: false,
    actions_assigned: false,
    shared_with_ofsted: true,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeQualityOfCareMetrics ----------------------------------------------

describe("computeQualityOfCareMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeQualityOfCareMetrics([]);
    expect(m.total_reviews).toBe(0);
    expect(m.inadequate_count).toBe(0);
    expect(m.requires_improvement_count).toBe(0);
    expect(m.immediate_priority_count).toBe(0);
    expect(m.actions_not_assigned_count).toBe(0);
    expect(m.children_consulted_rate).toBeNull();;
    expect(m.staff_consulted_rate).toBeNull();;
    expect(m.external_feedback_rate).toBeNull();;
    expect(m.reg44_reviewed_rate).toBeNull();;
    expect(m.shared_with_ofsted_rate).toBeNull();;
    expect(m.unique_reviewers).toBe(0);
  });

  it("counts inadequate and requires_improvement ratings", () => {
    const rows = [
      makeRow({ id: "1", domain_rating: "inadequate" }),
      makeRow({ id: "2", domain_rating: "requires_improvement" }),
      makeRow({ id: "3", domain_rating: "requires_improvement" }),
      makeRow({ id: "4", domain_rating: "good" }),
    ];
    const m = computeQualityOfCareMetrics(rows);
    expect(m.inadequate_count).toBe(1);
    expect(m.requires_improvement_count).toBe(2);
  });

  it("counts immediate priority actions", () => {
    const rows = [
      makeRow({ id: "1", action_priority: "immediate" }),
      makeRow({ id: "2", action_priority: "high" }),
    ];
    const m = computeQualityOfCareMetrics(rows);
    expect(m.immediate_priority_count).toBe(1);
  });

  it("counts actions not assigned when improvement actions identified", () => {
    const rows = [
      makeRow({ id: "1", improvement_actions_identified: true, actions_assigned: false }),
      makeRow({ id: "2", improvement_actions_identified: true, actions_assigned: true }),
      makeRow({ id: "3", improvement_actions_identified: false, actions_assigned: false }),
    ];
    const m = computeQualityOfCareMetrics(rows);
    expect(m.actions_not_assigned_count).toBe(1);
  });

  it("computes boolean rates at 50%", () => {
    const rows = [
      makeRow({ id: "1", children_consulted: true, staff_consulted: true }),
      makeRow({ id: "2", children_consulted: false, staff_consulted: false }),
    ];
    const m = computeQualityOfCareMetrics(rows);
    expect(m.children_consulted_rate).toBe(50);
    expect(m.staff_consulted_rate).toBe(50);
  });

  it("computes 100% rates when all booleans are true", () => {
    const rows = [makeRow(), makeRow({ id: "2" })];
    const m = computeQualityOfCareMetrics(rows);
    expect(m.children_consulted_rate).toBe(100);
    expect(m.staff_consulted_rate).toBe(100);
    expect(m.external_feedback_rate).toBe(100);
    expect(m.reg44_reviewed_rate).toBe(100);
    expect(m.shared_with_ofsted_rate).toBe(100);
  });

  it("counts unique reviewers", () => {
    const rows = [
      makeRow({ id: "1", reviewer_name: "Manager A" }),
      makeRow({ id: "2", reviewer_name: "Manager A" }),
      makeRow({ id: "3", reviewer_name: "Manager B" }),
    ];
    const m = computeQualityOfCareMetrics(rows);
    expect(m.unique_reviewers).toBe(2);
  });

  it("populates domain and rating breakdowns", () => {
    const rows = [
      makeRow({ id: "1", review_domain: "overall_experiences", domain_rating: "good" }),
      makeRow({ id: "2", review_domain: "health_wellbeing", domain_rating: "inadequate" }),
    ];
    const m = computeQualityOfCareMetrics(rows);
    expect(m.domain_breakdown).toEqual({ overall_experiences: 1, health_wellbeing: 1 });
    expect(m.rating_breakdown).toEqual({ good: 1, inadequate: 1 });
  });
});

// -- computeQualityOfCareAlerts -----------------------------------------------

describe("computeQualityOfCareAlerts", () => {
  it("returns empty alerts for empty rows", () => {
    expect(computeQualityOfCareAlerts([])).toHaveLength(0);
  });

  it("returns empty alerts for fully compliant rows", () => {
    expect(computeQualityOfCareAlerts([makeRow()])).toHaveLength(0);
  });

  it("fires critical alert for inadequate rating with immediate priority", () => {
    const rows = [makeRow({ domain_rating: "inadequate", action_priority: "immediate" })];
    const alerts = computeQualityOfCareAlerts(rows);
    const critical = alerts.filter((a) => a.type === "inadequate_immediate");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("does NOT fire critical for inadequate without immediate priority", () => {
    const rows = [makeRow({ domain_rating: "inadequate", action_priority: "high" })];
    const alerts = computeQualityOfCareAlerts(rows);
    expect(alerts.filter((a) => a.type === "inadequate_immediate")).toHaveLength(0);
  });

  it("fires high alert for requires_improvement without actions assigned", () => {
    const rows = [makeRow({ domain_rating: "requires_improvement", actions_assigned: false })];
    const alerts = computeQualityOfCareAlerts(rows);
    expect(alerts.filter((a) => a.type === "improvement_actions_not_assigned")).toHaveLength(1);
    expect(alerts.find((a) => a.type === "improvement_actions_not_assigned")!.severity).toBe("high");
  });

  it("fires high alert for children not consulted at threshold of 2", () => {
    const alerts1 = computeQualityOfCareAlerts([makeRow({ children_consulted: false })]);
    expect(alerts1.filter((a) => a.type === "children_not_consulted")).toHaveLength(0);

    const alerts2 = computeQualityOfCareAlerts([
      makeRow({ id: "1", children_consulted: false }),
      makeRow({ id: "2", children_consulted: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "children_not_consulted")).toHaveLength(1);
    expect(alerts2.find((a) => a.type === "children_not_consulted")!.severity).toBe("high");
  });

  it("fires medium alert for reg44 not reviewed (threshold >= 1)", () => {
    const rows = [makeRow({ reg44_reports_reviewed: false })];
    const alerts = computeQualityOfCareAlerts(rows);
    expect(alerts.filter((a) => a.type === "reg44_not_reviewed")).toHaveLength(1);
    expect(alerts.find((a) => a.type === "reg44_not_reviewed")!.severity).toBe("medium");
  });
});
