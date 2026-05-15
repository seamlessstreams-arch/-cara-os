// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REG 44 INDEPENDENT VISITOR REPORTS SERVICE TESTS
// Pure-function unit tests for Reg 44 independent visitor report metrics,
// alert identification, ARIA insight generation, constant validation,
// and CRUD fallback behaviour. Covers severity breakdowns, status breakdowns,
// unique visitor counting, percentage calculations, and all alert conditions.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  _testing,
  VISIT_AREAS,
  VISIT_AREA_VALUES,
  FINDING_SEVERITIES,
  FINDING_SEVERITY_VALUES,
  ACTION_STATUSES,
  ACTION_STATUS_VALUES,
  REPORT_STATUSES,
  REPORT_STATUS_VALUES,
  listReg44IndependentVisitorReports,
  createReg44IndependentVisitorReport,
} from "../reg44-independent-visitor-service";

import type { Reg44IndependentVisitorReportRow } from "../reg44-independent-visitor-service";

const {
  computeReg44IndependentVisitorMetrics,
  computeReg44IndependentVisitorAlerts,
  generateReg44IndependentVisitorAriaInsights,
} = _testing;

// ── Helpers ──────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<Reg44IndependentVisitorReportRow>,
): Reg44IndependentVisitorReportRow {
  return {
    id: overrides?.id ?? "row-1",
    home_id: overrides?.home_id ?? "home-1",
    visitor_name: overrides?.visitor_name ?? "Jane Independent",
    visit_date: overrides?.visit_date ?? "2026-05-01",
    report_date: overrides?.report_date ?? "2026-05-02",
    area_inspected: overrides?.area_inspected ?? "overall_experience",
    finding_severity: overrides?.finding_severity ?? "minor_observation",
    finding_summary: overrides?.finding_summary ?? "General observation",
    recommendation:
      "recommendation" in (overrides ?? {})
        ? (overrides!.recommendation ?? null)
        : null,
    action_status: overrides?.action_status ?? "not_started",
    report_status: overrides?.report_status ?? "submitted",
    children_spoken_to: overrides?.children_spoken_to ?? 3,
    staff_spoken_to: overrides?.staff_spoken_to ?? 2,
    records_reviewed: overrides?.records_reviewed ?? true,
    previous_actions_followed_up:
      overrides?.previous_actions_followed_up ?? true,
    child_views_captured: overrides?.child_views_captured ?? true,
    manager_response:
      "manager_response" in (overrides ?? {})
        ? (overrides!.manager_response ?? null)
        : null,
    response_date:
      "response_date" in (overrides ?? {})
        ? (overrides!.response_date ?? null)
        : null,
    created_at: overrides?.created_at ?? "2026-05-02T10:00:00Z",
    updated_at: overrides?.updated_at ?? "2026-05-02T10:00:00Z",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Constants validation
// ══════════════════════════════════════════════════════════════════════════════

describe("constants", () => {
  it("VISIT_AREA_VALUES has 10 entries", () => {
    expect(VISIT_AREA_VALUES).toHaveLength(10);
  });

  it("VISIT_AREAS labels match values", () => {
    expect(VISIT_AREAS).toHaveLength(VISIT_AREA_VALUES.length);
    for (const entry of VISIT_AREAS) {
      expect(VISIT_AREA_VALUES).toContain(entry.area);
    }
  });

  it("FINDING_SEVERITY_VALUES has 5 entries", () => {
    expect(FINDING_SEVERITY_VALUES).toHaveLength(5);
  });

  it("FINDING_SEVERITIES labels match values", () => {
    expect(FINDING_SEVERITIES).toHaveLength(FINDING_SEVERITY_VALUES.length);
    for (const entry of FINDING_SEVERITIES) {
      expect(FINDING_SEVERITY_VALUES).toContain(entry.severity);
    }
  });

  it("ACTION_STATUS_VALUES has 5 entries", () => {
    expect(ACTION_STATUS_VALUES).toHaveLength(5);
  });

  it("ACTION_STATUSES labels match values", () => {
    expect(ACTION_STATUSES).toHaveLength(ACTION_STATUS_VALUES.length);
    for (const entry of ACTION_STATUSES) {
      expect(ACTION_STATUS_VALUES).toContain(entry.status);
    }
  });

  it("REPORT_STATUS_VALUES has 5 entries", () => {
    expect(REPORT_STATUS_VALUES).toHaveLength(5);
  });

  it("REPORT_STATUSES labels match values", () => {
    expect(REPORT_STATUSES).toHaveLength(REPORT_STATUS_VALUES.length);
    for (const entry of REPORT_STATUSES) {
      expect(REPORT_STATUS_VALUES).toContain(entry.status);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeReg44IndependentVisitorMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeReg44IndependentVisitorMetrics", () => {
  // ── Empty input ──────────────────────────────────────────────────────────

  it("returns zeroes for empty array", () => {
    const m = computeReg44IndependentVisitorMetrics([]);
    expect(m.total_reports).toBe(0);
    expect(m.serious_concern_count).toBe(0);
    expect(m.concern_count).toBe(0);
    expect(m.overdue_action_count).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.children_spoken_to_rate).toBe(0);
    expect(m.records_reviewed_rate).toBe(0);
    expect(m.previous_actions_rate).toBe(0);
    expect(m.child_views_rate).toBe(0);
    expect(m.manager_responded_rate).toBe(0);
    expect(m.unique_visitors).toBe(0);
    expect(Object.keys(m.severity_breakdown)).toHaveLength(0);
    expect(Object.keys(m.status_breakdown)).toHaveLength(0);
  });

  // ── Single row ─────────────────────────────────────────────────────────

  it("computes metrics for a single row", () => {
    const row = makeRow({
      finding_severity: "concern",
      action_status: "in_progress",
      children_spoken_to: 2,
      records_reviewed: true,
      previous_actions_followed_up: true,
      child_views_captured: true,
      manager_response: "Acknowledged",
    });
    const m = computeReg44IndependentVisitorMetrics([row]);
    expect(m.total_reports).toBe(1);
    expect(m.concern_count).toBe(1);
    expect(m.serious_concern_count).toBe(0);
    expect(m.overdue_action_count).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.children_spoken_to_rate).toBe(100);
    expect(m.records_reviewed_rate).toBe(100);
    expect(m.previous_actions_rate).toBe(100);
    expect(m.child_views_rate).toBe(100);
    expect(m.manager_responded_rate).toBe(100);
    expect(m.unique_visitors).toBe(1);
  });

  // ── Multiple rows ──────────────────────────────────────────────────────

  it("counts serious concerns correctly across multiple rows", () => {
    const rows = [
      makeRow({ id: "r1", finding_severity: "serious_concern" }),
      makeRow({ id: "r2", finding_severity: "serious_concern" }),
      makeRow({ id: "r3", finding_severity: "concern" }),
      makeRow({ id: "r4", finding_severity: "minor_observation" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.serious_concern_count).toBe(2);
    expect(m.concern_count).toBe(1);
  });

  it("counts overdue and not_started actions", () => {
    const rows = [
      makeRow({ id: "r1", action_status: "overdue" }),
      makeRow({ id: "r2", action_status: "overdue" }),
      makeRow({ id: "r3", action_status: "not_started" }),
      makeRow({ id: "r4", action_status: "completed" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.overdue_action_count).toBe(2);
    expect(m.not_started_count).toBe(1);
  });

  // ── Percentage calculations ────────────────────────────────────────────

  it("calculates children_spoken_to_rate correctly", () => {
    const rows = [
      makeRow({ id: "r1", children_spoken_to: 3 }),
      makeRow({ id: "r2", children_spoken_to: 0 }),
      makeRow({ id: "r3", children_spoken_to: 1 }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    // 2 out of 3 => 66.7%
    expect(m.children_spoken_to_rate).toBe(66.7);
  });

  it("calculates records_reviewed_rate correctly", () => {
    const rows = [
      makeRow({ id: "r1", records_reviewed: true }),
      makeRow({ id: "r2", records_reviewed: false }),
      makeRow({ id: "r3", records_reviewed: true }),
      makeRow({ id: "r4", records_reviewed: true }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    // 3 out of 4 => 75.0%
    expect(m.records_reviewed_rate).toBe(75);
  });

  it("calculates previous_actions_rate correctly", () => {
    const rows = [
      makeRow({ id: "r1", previous_actions_followed_up: true }),
      makeRow({ id: "r2", previous_actions_followed_up: false }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    // 1 out of 2 => 50.0%
    expect(m.previous_actions_rate).toBe(50);
  });

  it("calculates child_views_rate correctly", () => {
    const rows = [
      makeRow({ id: "r1", child_views_captured: true }),
      makeRow({ id: "r2", child_views_captured: true }),
      makeRow({ id: "r3", child_views_captured: false }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    // 2 out of 3 => 66.7%
    expect(m.child_views_rate).toBe(66.7);
  });

  it("calculates manager_responded_rate correctly", () => {
    const rows = [
      makeRow({ id: "r1", manager_response: "Noted" }),
      makeRow({ id: "r2", manager_response: null }),
      makeRow({ id: "r3", manager_response: "Actioned" }),
      makeRow({ id: "r4", manager_response: "" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    // 2 out of 4 (null and empty string don't count) => 50.0%
    expect(m.manager_responded_rate).toBe(50);
  });

  it("treats whitespace-only manager_response as not responded", () => {
    const rows = [
      makeRow({ id: "r1", manager_response: "   " }),
      makeRow({ id: "r2", manager_response: "Response given" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    // Only 1 out of 2 valid
    expect(m.manager_responded_rate).toBe(50);
  });

  // ── Severity breakdown ─────────────────────────────────────────────────

  it("produces correct severity_breakdown", () => {
    const rows = [
      makeRow({ id: "r1", finding_severity: "commendation" }),
      makeRow({ id: "r2", finding_severity: "commendation" }),
      makeRow({ id: "r3", finding_severity: "concern" }),
      makeRow({ id: "r4", finding_severity: "serious_concern" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.severity_breakdown).toEqual({
      commendation: 2,
      concern: 1,
      serious_concern: 1,
    });
  });

  // ── Status breakdown ───────────────────────────────────────────────────

  it("produces correct status_breakdown", () => {
    const rows = [
      makeRow({ id: "r1", report_status: "draft" }),
      makeRow({ id: "r2", report_status: "submitted" }),
      makeRow({ id: "r3", report_status: "submitted" }),
      makeRow({ id: "r4", report_status: "closed" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.status_breakdown).toEqual({
      draft: 1,
      submitted: 2,
      closed: 1,
    });
  });

  // ── Unique visitors ────────────────────────────────────────────────────

  it("counts unique visitors correctly", () => {
    const rows = [
      makeRow({ id: "r1", visitor_name: "Alice" }),
      makeRow({ id: "r2", visitor_name: "Bob" }),
      makeRow({ id: "r3", visitor_name: "Alice" }),
      makeRow({ id: "r4", visitor_name: "Carol" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.unique_visitors).toBe(3);
  });

  it("returns unique_visitors as 1 for single visitor across multiple rows", () => {
    const rows = [
      makeRow({ id: "r1", visitor_name: "Same Visitor" }),
      makeRow({ id: "r2", visitor_name: "Same Visitor" }),
      makeRow({ id: "r3", visitor_name: "Same Visitor" }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.unique_visitors).toBe(1);
  });

  // ── All rates at 0% ───────────────────────────────────────────────────

  it("returns 0% rates when all flags are false/zero", () => {
    const rows = [
      makeRow({
        id: "r1",
        children_spoken_to: 0,
        records_reviewed: false,
        previous_actions_followed_up: false,
        child_views_captured: false,
        manager_response: null,
      }),
    ];
    const m = computeReg44IndependentVisitorMetrics(rows);
    expect(m.children_spoken_to_rate).toBe(0);
    expect(m.records_reviewed_rate).toBe(0);
    expect(m.previous_actions_rate).toBe(0);
    expect(m.child_views_rate).toBe(0);
    expect(m.manager_responded_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeReg44IndependentVisitorAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeReg44IndependentVisitorAlerts", () => {
  // ── Empty input ──────────────────────────────────────────────────────────

  it("returns no alerts for empty array", () => {
    const alerts = computeReg44IndependentVisitorAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  // ── Critical: serious concern not actioned ─────────────────────────────

  it("raises critical alert for serious_concern with action not completed", () => {
    const rows = [
      makeRow({
        id: "r1",
        finding_severity: "serious_concern",
        action_status: "not_started",
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const critical = alerts.filter(
      (a) => a.type === "serious_concern_not_actioned",
    );
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
    expect(critical[0].record_id).toBe("r1");
  });

  it("does NOT raise alert when serious_concern action is completed", () => {
    const rows = [
      makeRow({
        id: "r1",
        finding_severity: "serious_concern",
        action_status: "completed",
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const critical = alerts.filter(
      (a) => a.type === "serious_concern_not_actioned",
    );
    expect(critical).toHaveLength(0);
  });

  it("raises critical for serious_concern with in_progress status", () => {
    const rows = [
      makeRow({
        id: "r1",
        finding_severity: "serious_concern",
        action_status: "in_progress",
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const critical = alerts.filter(
      (a) => a.type === "serious_concern_not_actioned",
    );
    expect(critical).toHaveLength(1);
  });

  it("raises critical for serious_concern with escalated status", () => {
    const rows = [
      makeRow({
        id: "r1",
        finding_severity: "serious_concern",
        action_status: "escalated",
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const critical = alerts.filter(
      (a) => a.type === "serious_concern_not_actioned",
    );
    expect(critical).toHaveLength(1);
  });

  // ── High: overdue actions ──────────────────────────────────────────────

  it("raises high alert for overdue actions", () => {
    const rows = [
      makeRow({ id: "r1", action_status: "overdue" }),
      makeRow({ id: "r2", action_status: "overdue" }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const overdue = alerts.filter((a) => a.type === "overdue_action");
    expect(overdue).toHaveLength(2);
    expect(overdue[0].severity).toBe("high");
    expect(overdue[0].record_id).toBe("r1");
    expect(overdue[1].record_id).toBe("r2");
  });

  it("does NOT raise overdue alert when action is not overdue", () => {
    const rows = [
      makeRow({ id: "r1", action_status: "in_progress" }),
      makeRow({ id: "r2", action_status: "completed" }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const overdue = alerts.filter((a) => a.type === "overdue_action");
    expect(overdue).toHaveLength(0);
  });

  // ── High: child views not captured in multiple reports ─────────────────

  it("raises high alert when child views not captured in more than 1 report", () => {
    const rows = [
      makeRow({ id: "r1", child_views_captured: false }),
      makeRow({ id: "r2", child_views_captured: false }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const childViews = alerts.filter(
      (a) => a.type === "child_views_not_captured",
    );
    expect(childViews).toHaveLength(1);
    expect(childViews[0].severity).toBe("high");
    expect(childViews[0].message).toContain("2 Reg 44 reports");
  });

  it("does NOT raise child views alert when only 1 report missing views", () => {
    const rows = [
      makeRow({ id: "r1", child_views_captured: false }),
      makeRow({ id: "r2", child_views_captured: true }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const childViews = alerts.filter(
      (a) => a.type === "child_views_not_captured",
    );
    expect(childViews).toHaveLength(0);
  });

  it("does NOT raise child views alert when all views captured", () => {
    const rows = [
      makeRow({ id: "r1", child_views_captured: true }),
      makeRow({ id: "r2", child_views_captured: true }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const childViews = alerts.filter(
      (a) => a.type === "child_views_not_captured",
    );
    expect(childViews).toHaveLength(0);
  });

  // ── Medium: manager not responded to submitted reports ─────────────────

  it("raises medium alert when manager has not responded to submitted report", () => {
    const rows = [
      makeRow({
        id: "r1",
        report_status: "submitted",
        manager_response: null,
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const noResponse = alerts.filter(
      (a) => a.type === "manager_no_response",
    );
    expect(noResponse).toHaveLength(1);
    expect(noResponse[0].severity).toBe("medium");
    expect(noResponse[0].record_id).toBe("r1");
  });

  it("raises medium alert when manager_response is empty string", () => {
    const rows = [
      makeRow({
        id: "r1",
        report_status: "submitted",
        manager_response: "",
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const noResponse = alerts.filter(
      (a) => a.type === "manager_no_response",
    );
    expect(noResponse).toHaveLength(1);
  });

  it("raises medium alert when manager_response is whitespace only", () => {
    const rows = [
      makeRow({
        id: "r1",
        report_status: "submitted",
        manager_response: "   ",
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const noResponse = alerts.filter(
      (a) => a.type === "manager_no_response",
    );
    expect(noResponse).toHaveLength(1);
  });

  it("does NOT raise alert when manager has responded to submitted report", () => {
    const rows = [
      makeRow({
        id: "r1",
        report_status: "submitted",
        manager_response: "Acknowledged and actioning",
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const noResponse = alerts.filter(
      (a) => a.type === "manager_no_response",
    );
    expect(noResponse).toHaveLength(0);
  });

  it("does NOT raise manager response alert for non-submitted reports", () => {
    const rows = [
      makeRow({
        id: "r1",
        report_status: "draft",
        manager_response: null,
      }),
      makeRow({
        id: "r2",
        report_status: "closed",
        manager_response: null,
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const noResponse = alerts.filter(
      (a) => a.type === "manager_no_response",
    );
    expect(noResponse).toHaveLength(0);
  });

  // ── Combined alerts ────────────────────────────────────────────────────

  it("can raise multiple alert types simultaneously", () => {
    const rows = [
      makeRow({
        id: "r1",
        finding_severity: "serious_concern",
        action_status: "overdue",
        child_views_captured: false,
        report_status: "submitted",
        manager_response: null,
      }),
      makeRow({
        id: "r2",
        finding_severity: "minor_observation",
        action_status: "completed",
        child_views_captured: false,
        report_status: "submitted",
        manager_response: "Done",
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);

    const types = alerts.map((a) => a.type);
    expect(types).toContain("serious_concern_not_actioned");
    expect(types).toContain("overdue_action");
    expect(types).toContain("child_views_not_captured");
    expect(types).toContain("manager_no_response");
  });

  // ── Clean data produces no alerts ──────────────────────────────────────

  it("returns no alerts for fully compliant data", () => {
    const rows = [
      makeRow({
        id: "r1",
        finding_severity: "commendation",
        action_status: "completed",
        child_views_captured: true,
        report_status: "closed",
        manager_response: "Good work",
      }),
      makeRow({
        id: "r2",
        finding_severity: "minor_observation",
        action_status: "completed",
        child_views_captured: true,
        report_status: "reviewed_by_manager",
        manager_response: "Noted",
      }),
    ];
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    expect(alerts).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateReg44IndependentVisitorAriaInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("generateReg44IndependentVisitorAriaInsights", () => {
  it("returns exactly 3 insights", () => {
    const metrics = computeReg44IndependentVisitorMetrics([makeRow()]);
    const alerts = computeReg44IndependentVisitorAlerts([makeRow()]);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty data", () => {
    const metrics = computeReg44IndependentVisitorMetrics([]);
    const alerts = computeReg44IndependentVisitorAlerts([]);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [slate]", () => {
    const metrics = computeReg44IndependentVisitorMetrics([makeRow()]);
    const alerts = computeReg44IndependentVisitorAlerts([makeRow()]);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[0]).toMatch(/^\[slate\]/);
  });

  it("first insight includes total reports count", () => {
    const rows = [makeRow({ id: "r1" }), makeRow({ id: "r2" })];
    const metrics = computeReg44IndependentVisitorMetrics(rows);
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[0]).toContain("2 Reg 44 independent visitor reports");
  });

  it("first insight uses singular for 1 visitor", () => {
    const rows = [makeRow({ visitor_name: "Single Visitor" })];
    const metrics = computeReg44IndependentVisitorMetrics(rows);
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[0]).toContain("1 independent visitor");
    expect(insights[0]).not.toContain("1 independent visitors");
  });

  it("first insight uses plural for multiple visitors", () => {
    const rows = [
      makeRow({ id: "r1", visitor_name: "Alice" }),
      makeRow({ id: "r2", visitor_name: "Bob" }),
    ];
    const metrics = computeReg44IndependentVisitorMetrics(rows);
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[0]).toContain("2 independent visitors");
  });

  it("second insight starts with [amber]", () => {
    const metrics = computeReg44IndependentVisitorMetrics([makeRow()]);
    const alerts = computeReg44IndependentVisitorAlerts([makeRow()]);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical/high alerts when present", () => {
    const rows = [
      makeRow({
        id: "r1",
        finding_severity: "serious_concern",
        action_status: "not_started",
      }),
    ];
    const metrics = computeReg44IndependentVisitorMetrics(rows);
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[1]).toContain("1 critical");
  });

  it("second insight says no alerts when data is clean", () => {
    const rows = [
      makeRow({
        id: "r1",
        finding_severity: "commendation",
        action_status: "completed",
        child_views_captured: true,
        report_status: "closed",
        manager_response: "OK",
      }),
    ];
    const metrics = computeReg44IndependentVisitorMetrics(rows);
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("third insight starts with [reflect]", () => {
    const metrics = computeReg44IndependentVisitorMetrics([makeRow()]);
    const alerts = computeReg44IndependentVisitorAlerts([makeRow()]);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight asks about child views when rate < 100%", () => {
    const rows = [
      makeRow({ id: "r1", child_views_captured: true }),
      makeRow({ id: "r2", child_views_captured: false }),
    ];
    const metrics = computeReg44IndependentVisitorMetrics(rows);
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[2]).toContain("Child views were captured in 50%");
  });

  it("third insight asks about previous actions when child views at 100% but actions < 100%", () => {
    const rows = [
      makeRow({
        id: "r1",
        child_views_captured: true,
        previous_actions_followed_up: true,
      }),
      makeRow({
        id: "r2",
        child_views_captured: true,
        previous_actions_followed_up: false,
      }),
    ];
    const metrics = computeReg44IndependentVisitorMetrics(rows);
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[2]).toContain("Previous actions were followed up in 50%");
  });

  it("third insight is positive when all indicators at 100%", () => {
    const rows = [
      makeRow({
        id: "r1",
        child_views_captured: true,
        previous_actions_followed_up: true,
      }),
      makeRow({
        id: "r2",
        child_views_captured: true,
        previous_actions_followed_up: true,
      }),
    ];
    const metrics = computeReg44IndependentVisitorMetrics(rows);
    const alerts = computeReg44IndependentVisitorAlerts(rows);
    const insights = generateReg44IndependentVisitorAriaInsights(
      metrics,
      alerts,
    );
    expect(insights[2]).toContain(
      "Independent oversight indicators are strong",
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD fallbacks (Supabase not configured)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD fallbacks", () => {
  it("listReg44IndependentVisitorReports returns empty array when Supabase is disabled", async () => {
    const result = await listReg44IndependentVisitorReports("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createReg44IndependentVisitorReport returns error when Supabase is disabled", async () => {
    const result = await createReg44IndependentVisitorReport({
      homeId: "home-1",
      visitorName: "Test Visitor",
      visitDate: "2026-05-01",
      reportDate: "2026-05-02",
      areaInspected: "safeguarding",
      findingSeverity: "minor_observation",
      findingSummary: "Test finding",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
