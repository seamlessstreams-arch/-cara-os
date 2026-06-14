import { describe, it, expect } from "vitest";
import {
  computeAccessibilityMetrics,
  computeAccessibilityAlerts,
  generateAccessibilityCaraInsights,
  type HomeAccessibilityAssessmentRow,
} from "./home-accessibility-assessment-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<HomeAccessibilityAssessmentRow> = {}): HomeAccessibilityAssessmentRow {
  return {
    id: "row-1",
    home_id: "home-1",
    assessor_name: "Inspector A",
    assessor_id: "staff-1",
    assessment_date: "2026-05-01",
    accessibility_area: "ground_floor",
    compliance_level: "fully_accessible",
    adjustment_status: "not_required",
    need_type: "mobility",
    wheelchair_accessible: true,
    ramp_installed: true,
    grab_rails_fitted: true,
    visual_aids_provided: true,
    hearing_loop_available: true,
    signage_accessible: true,
    lighting_adequate: true,
    emergency_egress_accessible: true,
    cost_estimate: null,
    child_consulted: "Child A",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeAccessibilityMetrics ──────────────────────────────────────────

describe("computeAccessibilityMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeAccessibilityMetrics([]);
    expect(result.total_assessments).toBe(0);
    expect(result.not_accessible_count).toBe(0);
    expect(result.adjustments_needed_count).toBe(0);
    expect(result.completed_count).toBe(0);
    expect(result.deferred_count).toBe(0);
    expect(result.wheelchair_accessible_rate).toBe(0);
    expect(result.total_cost).toBe(0);
    expect(result.unique_assessors).toBe(0);
  });

  it("computes correct counts with populated data", () => {
    const rows = [
      makeRow({ compliance_level: "not_accessible", adjustment_status: "completed", cost_estimate: 500 }),
      makeRow({ id: "row-2", compliance_level: "adjustments_needed", adjustment_status: "deferred", cost_estimate: 1200, wheelchair_accessible: false }),
      makeRow({ id: "row-3", assessor_name: "Inspector B", compliance_level: "fully_accessible", adjustment_status: "not_required" }),
    ];
    const result = computeAccessibilityMetrics(rows);
    expect(result.total_assessments).toBe(3);
    expect(result.not_accessible_count).toBe(1);
    expect(result.adjustments_needed_count).toBe(1);
    expect(result.completed_count).toBe(1);
    expect(result.deferred_count).toBe(1);
    expect(result.total_cost).toBe(1700);
    expect(result.unique_assessors).toBe(2);
    // wheelchair_accessible: 2/3 = 66.7%
    expect(result.wheelchair_accessible_rate).toBe(66.7);
  });

  it("computes boolean rates at 100% when all true", () => {
    const rows = [makeRow(), makeRow({ id: "row-2" })];
    const result = computeAccessibilityMetrics(rows);
    expect(result.wheelchair_accessible_rate).toBe(100);
    expect(result.ramp_installed_rate).toBe(100);
    expect(result.grab_rails_fitted_rate).toBe(100);
    expect(result.lighting_adequate_rate).toBe(100);
    expect(result.emergency_egress_accessible_rate).toBe(100);
  });
});

// ── computeAccessibilityAlerts ───────────────────────────────────────────

describe("computeAccessibilityAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAccessibilityAlerts([])).toHaveLength(0);
  });

  it("raises critical alert for not_accessible in entrance_exit", () => {
    const rows = [makeRow({ compliance_level: "not_accessible", accessibility_area: "entrance_exit" })];
    const alerts = computeAccessibilityAlerts(rows);
    const match = alerts.filter((a) => a.type === "not_accessible_critical_area");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises critical alert for not_accessible in communal_areas", () => {
    const rows = [makeRow({ compliance_level: "not_accessible", accessibility_area: "communal_areas" })];
    const alerts = computeAccessibilityAlerts(rows);
    const match = alerts.filter((a) => a.type === "not_accessible_critical_area");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises high alert for adjustments_needed + deferred", () => {
    const rows = [makeRow({ compliance_level: "adjustments_needed", adjustment_status: "deferred" })];
    const alerts = computeAccessibilityAlerts(rows);
    const match = alerts.filter((a) => a.type === "adjustments_deferred");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises high alert for emergency egress not accessible", () => {
    const rows = [makeRow({ emergency_egress_accessible: false })];
    const alerts = computeAccessibilityAlerts(rows);
    const match = alerts.filter((a) => a.type === "emergency_egress_not_accessible");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises medium alert for child not consulted", () => {
    const rows = [makeRow({ child_consulted: null })];
    const alerts = computeAccessibilityAlerts(rows);
    const match = alerts.filter((a) => a.type === "child_not_consulted");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });

  it("raises medium alert for lighting not adequate", () => {
    const rows = [makeRow({ lighting_adequate: false })];
    const alerts = computeAccessibilityAlerts(rows);
    const match = alerts.filter((a) => a.type === "lighting_not_adequate");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });
});

// ── generateAccessibilityCaraInsights ────────────────────────────────────

describe("generateAccessibilityCaraInsights", () => {
  it("returns 3 insights", () => {
    const metrics = computeAccessibilityMetrics([makeRow()]);
    const alerts = computeAccessibilityAlerts([makeRow()]);
    const insights = generateAccessibilityCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });
});
