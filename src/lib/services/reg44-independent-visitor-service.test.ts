import { describe, it, expect } from "vitest";
import {
  computeReg44IndependentVisitorMetrics,
  computeReg44IndependentVisitorAlerts,
  type Reg44IndependentVisitorReportRow,
} from "./reg44-independent-visitor-service";

function makeRow(overrides: Partial<Reg44IndependentVisitorReportRow> = {}): Reg44IndependentVisitorReportRow {
  return {
    id: "row-1",
    home_id: "home-1",
    visitor_name: "Visitor A",
    visit_date: "2025-03-01",
    report_date: "2025-03-05",
    area_inspected: "overall_experience",
    finding_severity: "minor_observation",
    finding_summary: "All fine",
    recommendation: null,
    action_status: "completed",
    report_status: "closed",
    children_spoken_to: 3,
    staff_spoken_to: 2,
    records_reviewed: true,
    previous_actions_followed_up: true,
    child_views_captured: true,
    manager_response: "Acknowledged",
    response_date: "2025-03-10",
    created_at: "2025-03-01T00:00:00Z",
    updated_at: "2025-03-10T00:00:00Z",
    ...overrides,
  };
}

describe("computeReg44IndependentVisitorMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeReg44IndependentVisitorMetrics([]);
    expect(m.total_reports).toBe(0);
    expect(m.serious_concern_count).toBe(0);
    expect(m.concern_count).toBe(0);
    expect(m.overdue_action_count).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.children_spoken_to_rate).toBeNull();;
    expect(m.records_reviewed_rate).toBeNull();;
    expect(m.previous_actions_rate).toBeNull();;
    expect(m.child_views_rate).toBeNull();;
    expect(m.manager_responded_rate).toBeNull();;
    expect(m.unique_visitors).toBe(0);
  });

  it("counts severity types correctly", () => {
    const rows = [
      makeRow({ finding_severity: "serious_concern" }),
      makeRow({ id: "r2", finding_severity: "serious_concern" }),
      makeRow({ id: "r3", finding_severity: "concern" }),
      makeRow({ id: "r4", finding_severity: "minor_observation" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.serious_concern_count).toBe(2);
    expect(m.concern_count).toBe(1);
    expect(m.severity_breakdown).toEqual({
      serious_concern: 2,
      concern: 1,
      minor_observation: 1,
    });
  });

  it("counts overdue and not started actions", () => {
    const rows = [
      makeRow({ action_status: "overdue" }),
      makeRow({ id: "r2", action_status: "not_started" }),
      makeRow({ id: "r3", action_status: "not_started" }),
      makeRow({ id: "r4", action_status: "completed" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.overdue_action_count).toBe(1);
    expect(m.not_started_count).toBe(2);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ children_spoken_to: 3, records_reviewed: true, child_views_captured: true, manager_response: "Yes" }),
      makeRow({ id: "r2", children_spoken_to: 0, records_reviewed: false, child_views_captured: false, manager_response: null }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.children_spoken_to_rate).toBe(50);
    expect(m.records_reviewed_rate).toBe(50);
    expect(m.child_views_rate).toBe(50);
    expect(m.manager_responded_rate).toBe(50);
  });

  it("counts unique visitors", () => {
    const rows = [
      makeRow({ visitor_name: "Alice" }),
      makeRow({ id: "r2", visitor_name: "Alice" }),
      makeRow({ id: "r3", visitor_name: "Bob" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.unique_visitors).toBe(2);
  });
});

describe("computeReg44IndependentVisitorAlerts", () => {
  it("returns empty for no data", () => {
    expect(computeReg44IndependentVisitorAlerts([])).toEqual([]);
  });

  it("critical alert for serious concern not actioned", () => {
    const rows = [makeRow({ finding_severity: "serious_concern", action_status: "not_started" })];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    expect(alerts.some((a) => a.type === "serious_concern_not_actioned" && a.severity === "critical")).toBe(true);
  });

  it("no alert when serious concern is completed", () => {
    const rows = [makeRow({ finding_severity: "serious_concern", action_status: "completed" })];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    expect(alerts.some((a) => a.type === "serious_concern_not_actioned")).toBe(false);
  });

  it("high alert for overdue actions", () => {
    const rows = [makeRow({ action_status: "overdue" })];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    expect(alerts.some((a) => a.type === "overdue_action" && a.severity === "high")).toBe(true);
  });

  it("high alert when child views not captured in >1 reports", () => {
    const rows = [
      makeRow({ child_views_captured: false }),
      makeRow({ id: "r2", child_views_captured: false }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    expect(alerts.some((a) => a.type === "child_views_not_captured" && a.severity === "high")).toBe(true);
  });

  it("no child views alert for exactly 1 missing", () => {
    const rows = [makeRow({ child_views_captured: false })];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    expect(alerts.some((a) => a.type === "child_views_not_captured")).toBe(false);
  });

  it("medium alert for manager no response on submitted report", () => {
    const rows = [makeRow({ report_status: "submitted", manager_response: null })];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    expect(alerts.some((a) => a.type === "manager_no_response" && a.severity === "medium")).toBe(true);
  });

  it("no manager alert when response exists", () => {
    const rows = [makeRow({ report_status: "submitted", manager_response: "All good" })];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    expect(alerts.some((a) => a.type === "manager_no_response")).toBe(false);
  });
});
