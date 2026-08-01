import { describe, it, expect } from "vitest";
import {
  computeReg45Metrics,
  identifyReg45Alerts,
  type Reg45Report,
  type Reg45Action,
} from "./reg45-reports-service";

function makeReport(overrides: Partial<Reg45Report> = {}): Reg45Report {
  return {
    id: "rpt-1",
    home_id: "home-1",
    report_period_start: "2025-01-01",
    report_period_end: "2025-06-30",
    responsible_individual: "RI Person",
    visit_dates: ["2025-03-01", "2025-05-15"],
    visit_types: ["announced", "unannounced"],
    children_interviewed: ["Child A", "Child B"],
    staff_interviewed: ["Staff A"],
    overall_quality_rating: "good",
    evaluations: [
      { area: "quality_of_care", rating: "good", findings: "ok", recommendations: "none" },
    ],
    reg44_reports_reviewed: 6,
    reg44_actions_outstanding: 0,
    statement_of_purpose_compliant: true,
    key_strengths: ["Strong care"],
    areas_for_improvement: [],
    status: "distributed",
    approved_by: "Manager",
    approval_date: "2025-07-05",
    distribution_date: "2025-07-10",
    ofsted_sent: true,
    placing_authority_sent: true,
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-07-10T00:00:00Z",
    ...overrides,
  };
}

function makeAction(overrides: Partial<Reg45Action> = {}): Reg45Action {
  return {
    id: "act-1",
    home_id: "home-1",
    report_id: "rpt-1",
    action_description: "Improve signage",
    evaluation_area: "premises",
    priority: "medium",
    assigned_to: "Staff A",
    due_date: "2025-08-01",
    status: "open",
    completion_date: null,
    completion_notes: null,
    evidence_reference: null,
    created_at: "2025-07-01T00:00:00Z",
    updated_at: "2025-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeReg45Metrics", () => {
  it("returns zeroes for empty inputs", () => {
    const m = computeReg45Metrics([], []);
    expect(m.total_reports).toBe(0);
    expect(m.reports_this_year).toBe(0);
    expect(m.latest_overall_rating).toBeNull();
    expect(m.open_actions).toBe(0);
    expect(m.overdue_actions).toBe(0);
    expect(m.completed_actions).toBe(0);
    expect(m.avg_days_to_distribute).toBeNull();;
    expect(m.next_report_due).toBeNull();
  });

  it("counts action statuses correctly", () => {
    const actions = [
      makeAction({ status: "open" }),
      makeAction({ id: "a2", status: "in_progress" }),
      makeAction({ id: "a3", status: "overdue" }),
      makeAction({ id: "a4", status: "completed" }),
    ];
    const m = computeReg45Metrics([], actions);
    expect(m.open_actions).toBe(2);
    expect(m.overdue_actions).toBe(1);
    expect(m.completed_actions).toBe(1);
  });

  it("returns latest overall rating from most recent report", () => {
    const reports = [
      makeReport({ report_period_end: "2025-01-01", overall_quality_rating: "outstanding" }),
      makeReport({ id: "r2", report_period_end: "2025-06-30", overall_quality_rating: "requires_improvement" }),
    ];
    const m = computeReg45Metrics(reports, []);
    expect(m.latest_overall_rating).toBe("requires_improvement");
  });

  it("calculates average days to distribute", () => {
    const reports = [
      makeReport({ approval_date: "2025-07-01", distribution_date: "2025-07-11" }), // 10 days
      makeReport({ id: "r2", approval_date: "2025-07-01", distribution_date: "2025-07-21" }), // 20 days
    ];
    const m = computeReg45Metrics(reports, []);
    expect(m.avg_days_to_distribute).toBe(15);
  });

  it("calculates next report due 6 months after latest", () => {
    const reports = [makeReport({ report_period_end: "2025-06-30" })];
    const m = computeReg45Metrics(reports, []);
    expect(m.next_report_due).toBe("2025-12-30");
  });

  it("builds evaluation area breakdown from actions", () => {
    const actions = [
      makeAction({ evaluation_area: "premises" }),
      makeAction({ id: "a2", evaluation_area: "premises" }),
      makeAction({ id: "a3", evaluation_area: "staffing" }),
    ];
    const m = computeReg45Metrics([], actions);
    expect(m.by_evaluation_area).toEqual({ premises: 2, staffing: 1 });
  });
});

describe("identifyReg45Alerts", () => {
  const now = new Date("2025-08-15T00:00:00Z");

  it("returns empty for no data", () => {
    expect(identifyReg45Alerts([], [], now)).toEqual([]);
  });

  it("critical alert when report overdue by >6 months", () => {
    const reports = [makeReport({ report_period_end: "2024-12-01" })];
    const alerts = identifyReg45Alerts(reports, [], now);
    expect(alerts.some((a) => a.type === "report_overdue" && a.severity === "critical")).toBe(true);
  });

  it("critical alert when distributed but ofsted not sent", () => {
    const reports = [makeReport({ status: "distributed", ofsted_sent: false })];
    const alerts = identifyReg45Alerts(reports, [], now);
    expect(alerts.some((a) => a.type === "ofsted_not_sent" && a.severity === "critical")).toBe(true);
  });

  it("high alert when distributed but placing authority not sent", () => {
    const reports = [makeReport({ status: "distributed", placing_authority_sent: false })];
    const alerts = identifyReg45Alerts(reports, [], now);
    expect(alerts.some((a) => a.type === "placing_authority_not_sent" && a.severity === "high")).toBe(true);
  });

  it("critical alert for inadequate rating", () => {
    const reports = [makeReport({ overall_quality_rating: "inadequate" })];
    const alerts = identifyReg45Alerts(reports, [], now);
    expect(alerts.some((a) => a.type === "inadequate_rating" && a.severity === "critical")).toBe(true);
  });

  it("high alert for requires_improvement rating", () => {
    const reports = [makeReport({ overall_quality_rating: "requires_improvement" })];
    const alerts = identifyReg45Alerts(reports, [], now);
    expect(alerts.some((a) => a.type === "requires_improvement_rating" && a.severity === "high")).toBe(true);
  });

  it("high alert when no unannounced visit in approved report", () => {
    const reports = [makeReport({ status: "approved", visit_types: ["announced"] })];
    const alerts = identifyReg45Alerts(reports, [], now);
    expect(alerts.some((a) => a.type === "no_unannounced_visit" && a.severity === "high")).toBe(true);
  });

  it("high alert when no children interviewed", () => {
    const reports = [makeReport({ status: "approved", children_interviewed: [] })];
    const alerts = identifyReg45Alerts(reports, [], now);
    expect(alerts.some((a) => a.type === "no_children_interviewed")).toBe(true);
  });

  it("critical alert for overdue critical action", () => {
    const actions = [makeAction({ priority: "critical", status: "open", due_date: "2025-07-01" })];
    const alerts = identifyReg45Alerts([], actions, now);
    const overdueAlert = alerts.find((a) => a.type === "action_overdue");
    expect(overdueAlert).toBeDefined();
    expect(overdueAlert!.severity).toBe("critical");
  });

  it("critical alert for critical priority action not started", () => {
    const actions = [makeAction({ priority: "critical", status: "open", due_date: "2025-09-01" })];
    const alerts = identifyReg45Alerts([], actions, now);
    expect(alerts.some((a) => a.type === "critical_action_not_started" && a.severity === "critical")).toBe(true);
  });

  it("high alert for distribution overdue >28 days", () => {
    const reports = [
      makeReport({
        status: "approved",
        approval_date: "2025-07-01",
        distribution_date: null,
      }),
    ];
    const alerts = identifyReg45Alerts(reports, [], now);
    expect(alerts.some((a) => a.type === "distribution_overdue" && a.severity === "high")).toBe(true);
  });

  it("medium alert for stale draft >30 days", () => {
    const reports = [
      makeReport({
        status: "draft",
        created_at: "2025-06-01T00:00:00Z",
      }),
    ];
    const alerts = identifyReg45Alerts(reports, [], now);
    expect(alerts.some((a) => a.type === "draft_stale" && a.severity === "medium")).toBe(true);
  });
});
