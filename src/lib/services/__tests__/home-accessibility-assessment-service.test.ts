// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ACCESSIBILITY ASSESSMENT SERVICE TESTS
// Pure-function tests for accessibility metrics, alert identification,
// ARIA insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  ACCESSIBILITY_AREAS,
  COMPLIANCE_LEVELS,
  ADJUSTMENT_STATUSES,
  NEED_TYPES,
  _testing,
} from "../home-accessibility-assessment-service";

import type {
  HomeAccessibilityAssessmentRow,
  AccessibilityArea,
  ComplianceLevel,
  AdjustmentStatus,
  NeedType,
} from "../home-accessibility-assessment-service";

const {
  computeAccessibilityMetrics,
  computeAccessibilityAlerts,
  generateAccessibilityAriaInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<HomeAccessibilityAssessmentRow>,
): HomeAccessibilityAssessmentRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    assessor_name: "assessor_name" in (overrides ?? {}) ? overrides!.assessor_name! : "Staff A",
    assessor_id: "assessor_id" in (overrides ?? {}) ? overrides!.assessor_id! : null,
    assessment_date: "assessment_date" in (overrides ?? {}) ? overrides!.assessment_date! : now.toISOString().split("T")[0],
    accessibility_area: "accessibility_area" in (overrides ?? {}) ? overrides!.accessibility_area! : "entrance_exit",
    compliance_level: "compliance_level" in (overrides ?? {}) ? overrides!.compliance_level! : "fully_accessible",
    adjustment_status: "adjustment_status" in (overrides ?? {}) ? overrides!.adjustment_status! : "not_required",
    need_type: "need_type" in (overrides ?? {}) ? overrides!.need_type! : "mobility",
    wheelchair_accessible: "wheelchair_accessible" in (overrides ?? {}) ? overrides!.wheelchair_accessible! : true,
    ramp_installed: "ramp_installed" in (overrides ?? {}) ? overrides!.ramp_installed! : true,
    grab_rails_fitted: "grab_rails_fitted" in (overrides ?? {}) ? overrides!.grab_rails_fitted! : true,
    visual_aids_provided: "visual_aids_provided" in (overrides ?? {}) ? overrides!.visual_aids_provided! : true,
    hearing_loop_available: "hearing_loop_available" in (overrides ?? {}) ? overrides!.hearing_loop_available! : true,
    signage_accessible: "signage_accessible" in (overrides ?? {}) ? overrides!.signage_accessible! : true,
    lighting_adequate: "lighting_adequate" in (overrides ?? {}) ? overrides!.lighting_adequate! : true,
    emergency_egress_accessible: "emergency_egress_accessible" in (overrides ?? {}) ? overrides!.emergency_egress_accessible! : true,
    cost_estimate: "cost_estimate" in (overrides ?? {}) ? overrides!.cost_estimate! : null,
    child_consulted: "child_consulted" in (overrides ?? {}) ? (overrides!.child_consulted ?? null) : "Child A",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeAccessibilityMetrics ────────────────────────────────────────

describe("computeAccessibilityMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_assessments", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.total_assessments).toBe(0);
    });

    it("returns zero not_accessible_count", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.not_accessible_count).toBe(0);
    });

    it("returns zero adjustments_needed_count", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.adjustments_needed_count).toBe(0);
    });

    it("returns zero completed_count", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.completed_count).toBe(0);
    });

    it("returns zero deferred_count", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.deferred_count).toBe(0);
    });

    it("returns zero wheelchair_accessible_rate", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.wheelchair_accessible_rate).toBe(0);
    });

    it("returns zero ramp_installed_rate", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.ramp_installed_rate).toBe(0);
    });

    it("returns zero grab_rails_fitted_rate", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.grab_rails_fitted_rate).toBe(0);
    });

    it("returns zero visual_aids_provided_rate", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.visual_aids_provided_rate).toBe(0);
    });

    it("returns zero hearing_loop_available_rate", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.hearing_loop_available_rate).toBe(0);
    });

    it("returns zero signage_accessible_rate", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.signage_accessible_rate).toBe(0);
    });

    it("returns zero lighting_adequate_rate", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.lighting_adequate_rate).toBe(0);
    });

    it("returns zero emergency_egress_accessible_rate", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.emergency_egress_accessible_rate).toBe(0);
    });

    it("returns zero total_cost", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.total_cost).toBe(0);
    });

    it("returns empty area_breakdown", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.area_breakdown).toEqual({});
    });

    it("returns empty compliance_breakdown", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.compliance_breakdown).toEqual({});
    });

    it("returns zero unique_assessors", () => {
      const m = computeAccessibilityMetrics([]);
      expect(m.unique_assessors).toBe(0);
    });
  });

  describe("single row", () => {
    const row = makeRow({
      compliance_level: "fully_accessible",
      adjustment_status: "not_required",
      wheelchair_accessible: true,
      ramp_installed: true,
      grab_rails_fitted: true,
      visual_aids_provided: true,
      hearing_loop_available: true,
      signage_accessible: true,
      lighting_adequate: true,
      emergency_egress_accessible: true,
      cost_estimate: 500,
      accessibility_area: "entrance_exit",
      assessor_name: "Staff A",
    });

    it("returns total_assessments = 1", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.total_assessments).toBe(1);
    });

    it("returns wheelchair_accessible_rate = 100", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.wheelchair_accessible_rate).toBe(100);
    });

    it("returns ramp_installed_rate = 100", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.ramp_installed_rate).toBe(100);
    });

    it("returns grab_rails_fitted_rate = 100", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.grab_rails_fitted_rate).toBe(100);
    });

    it("returns visual_aids_provided_rate = 100", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.visual_aids_provided_rate).toBe(100);
    });

    it("returns hearing_loop_available_rate = 100", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.hearing_loop_available_rate).toBe(100);
    });

    it("returns signage_accessible_rate = 100", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.signage_accessible_rate).toBe(100);
    });

    it("returns lighting_adequate_rate = 100", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.lighting_adequate_rate).toBe(100);
    });

    it("returns emergency_egress_accessible_rate = 100", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.emergency_egress_accessible_rate).toBe(100);
    });

    it("returns not_accessible_count = 0", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.not_accessible_count).toBe(0);
    });

    it("returns total_cost = 500", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.total_cost).toBe(500);
    });

    it("returns area_breakdown with single entry", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.area_breakdown).toEqual({ entrance_exit: 1 });
    });

    it("returns compliance_breakdown with single entry", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.compliance_breakdown).toEqual({ fully_accessible: 1 });
    });

    it("returns unique_assessors = 1", () => {
      const m = computeAccessibilityMetrics([row]);
      expect(m.unique_assessors).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ compliance_level: "fully_accessible", adjustment_status: "not_required", accessibility_area: "entrance_exit", assessor_name: "Staff A", wheelchair_accessible: true, ramp_installed: true, grab_rails_fitted: true, visual_aids_provided: true, hearing_loop_available: true, signage_accessible: true, lighting_adequate: true, emergency_egress_accessible: true, cost_estimate: 100 }),
      makeRow({ compliance_level: "not_accessible", adjustment_status: "deferred", accessibility_area: "upper_floors", assessor_name: "Staff B", wheelchair_accessible: false, ramp_installed: false, grab_rails_fitted: false, visual_aids_provided: false, hearing_loop_available: false, signage_accessible: false, lighting_adequate: false, emergency_egress_accessible: false, cost_estimate: 2000 }),
      makeRow({ compliance_level: "adjustments_needed", adjustment_status: "completed", accessibility_area: "bathroom", assessor_name: "Staff C", wheelchair_accessible: true, ramp_installed: false, grab_rails_fitted: true, visual_aids_provided: false, hearing_loop_available: true, signage_accessible: false, lighting_adequate: true, emergency_egress_accessible: true, cost_estimate: 750 }),
    ];

    it("returns total_assessments = 3", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.total_assessments).toBe(3);
    });

    it("returns not_accessible_count = 1", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.not_accessible_count).toBe(1);
    });

    it("returns adjustments_needed_count = 1", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.adjustments_needed_count).toBe(1);
    });

    it("returns completed_count = 1", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.completed_count).toBe(1);
    });

    it("returns deferred_count = 1", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.deferred_count).toBe(1);
    });

    it("calculates wheelchair_accessible_rate correctly (2/3 = 66.7%)", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.wheelchair_accessible_rate).toBe(66.7);
    });

    it("calculates ramp_installed_rate correctly (1/3 = 33.3%)", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.ramp_installed_rate).toBe(33.3);
    });

    it("calculates grab_rails_fitted_rate correctly (2/3 = 66.7%)", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.grab_rails_fitted_rate).toBe(66.7);
    });

    it("calculates visual_aids_provided_rate correctly (1/3 = 33.3%)", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.visual_aids_provided_rate).toBe(33.3);
    });

    it("calculates hearing_loop_available_rate correctly (2/3 = 66.7%)", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.hearing_loop_available_rate).toBe(66.7);
    });

    it("calculates signage_accessible_rate correctly (1/3 = 33.3%)", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.signage_accessible_rate).toBe(33.3);
    });

    it("calculates lighting_adequate_rate correctly (2/3 = 66.7%)", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.lighting_adequate_rate).toBe(66.7);
    });

    it("calculates emergency_egress_accessible_rate correctly (2/3 = 66.7%)", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.emergency_egress_accessible_rate).toBe(66.7);
    });

    it("calculates total_cost correctly (100 + 2000 + 750 = 2850)", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.total_cost).toBe(2850);
    });

    it("groups area_breakdown correctly", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.area_breakdown).toEqual({
        entrance_exit: 1,
        upper_floors: 1,
        bathroom: 1,
      });
    });

    it("groups compliance_breakdown correctly", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.compliance_breakdown).toEqual({
        fully_accessible: 1,
        not_accessible: 1,
        adjustments_needed: 1,
      });
    });

    it("returns unique_assessors = 3", () => {
      const m = computeAccessibilityMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });

  describe("area_breakdown", () => {
    it("counts duplicate areas", () => {
      const rows = [
        makeRow({ accessibility_area: "entrance_exit" }),
        makeRow({ accessibility_area: "entrance_exit" }),
        makeRow({ accessibility_area: "bathroom" }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.area_breakdown).toEqual({ entrance_exit: 2, bathroom: 1 });
    });

    it("handles all 8 accessibility areas", () => {
      const rows = ACCESSIBILITY_AREAS.map((a) => makeRow({ accessibility_area: a }));
      const m = computeAccessibilityMetrics(rows);
      for (const a of ACCESSIBILITY_AREAS) {
        expect(m.area_breakdown[a]).toBe(1);
      }
    });
  });

  describe("compliance_breakdown", () => {
    it("counts duplicate compliance levels", () => {
      const rows = [
        makeRow({ compliance_level: "fully_accessible" }),
        makeRow({ compliance_level: "fully_accessible" }),
        makeRow({ compliance_level: "not_accessible" }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.compliance_breakdown).toEqual({ fully_accessible: 2, not_accessible: 1 });
    });

    it("handles all 5 compliance levels", () => {
      const rows = COMPLIANCE_LEVELS.map((c) => makeRow({ compliance_level: c }));
      const m = computeAccessibilityMetrics(rows);
      for (const c of COMPLIANCE_LEVELS) {
        expect(m.compliance_breakdown[c]).toBe(1);
      }
    });
  });

  describe("unique_assessors", () => {
    it("counts distinct assessors", () => {
      const rows = [
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff B" }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.unique_assessors).toBe(2);
    });

    it("returns 1 when all rows have the same assessor", () => {
      const rows = [
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.unique_assessors).toBe(1);
    });

    it("counts each unique assessor name", () => {
      const rows = [
        makeRow({ assessor_name: "Alice" }),
        makeRow({ assessor_name: "Bob" }),
        makeRow({ assessor_name: "Charlie" }),
        makeRow({ assessor_name: "Alice" }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });

  describe("percentage calculations with known values", () => {
    it("wheelchair_accessible_rate 0 when all false", () => {
      expect(computeAccessibilityMetrics([makeRow({ wheelchair_accessible: false })]).wheelchair_accessible_rate).toBe(0);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ wheelchair_accessible: true }),
        makeRow({ wheelchair_accessible: false }),
        makeRow({ wheelchair_accessible: false }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.wheelchair_accessible_rate).toBe(33.3);
    });

    it("returns 100 for all rates when single row has all flags true", () => {
      const rows = [
        makeRow({ wheelchair_accessible: true, ramp_installed: true, grab_rails_fitted: true, visual_aids_provided: true, hearing_loop_available: true, signage_accessible: true, lighting_adequate: true, emergency_egress_accessible: true }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.wheelchair_accessible_rate).toBe(100);
      expect(m.ramp_installed_rate).toBe(100);
      expect(m.grab_rails_fitted_rate).toBe(100);
      expect(m.visual_aids_provided_rate).toBe(100);
      expect(m.hearing_loop_available_rate).toBe(100);
      expect(m.signage_accessible_rate).toBe(100);
      expect(m.lighting_adequate_rate).toBe(100);
      expect(m.emergency_egress_accessible_rate).toBe(100);
    });

    it("returns 0 for all rates when single row has all flags false", () => {
      const rows = [
        makeRow({ wheelchair_accessible: false, ramp_installed: false, grab_rails_fitted: false, visual_aids_provided: false, hearing_loop_available: false, signage_accessible: false, lighting_adequate: false, emergency_egress_accessible: false }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.wheelchair_accessible_rate).toBe(0);
      expect(m.ramp_installed_rate).toBe(0);
      expect(m.grab_rails_fitted_rate).toBe(0);
      expect(m.visual_aids_provided_rate).toBe(0);
      expect(m.hearing_loop_available_rate).toBe(0);
      expect(m.signage_accessible_rate).toBe(0);
      expect(m.lighting_adequate_rate).toBe(0);
      expect(m.emergency_egress_accessible_rate).toBe(0);
    });
  });

  describe("counts", () => {
    it("counts not_accessible_count", () => {
      expect(computeAccessibilityMetrics([makeRow({ compliance_level: "not_accessible" })]).not_accessible_count).toBe(1);
    });

    it("does not count partially_accessible as not_accessible", () => {
      expect(computeAccessibilityMetrics([makeRow({ compliance_level: "partially_accessible" })]).not_accessible_count).toBe(0);
    });

    it("counts adjustments_needed_count", () => {
      expect(computeAccessibilityMetrics([makeRow({ compliance_level: "adjustments_needed" })]).adjustments_needed_count).toBe(1);
    });

    it("does not count fully_accessible as adjustments_needed", () => {
      expect(computeAccessibilityMetrics([makeRow({ compliance_level: "fully_accessible" })]).adjustments_needed_count).toBe(0);
    });

    it("counts completed_count", () => {
      expect(computeAccessibilityMetrics([makeRow({ adjustment_status: "completed" })]).completed_count).toBe(1);
    });

    it("does not count in_progress as completed", () => {
      expect(computeAccessibilityMetrics([makeRow({ adjustment_status: "in_progress" })]).completed_count).toBe(0);
    });

    it("counts deferred_count", () => {
      expect(computeAccessibilityMetrics([makeRow({ adjustment_status: "deferred" })]).deferred_count).toBe(1);
    });

    it("does not count approved as deferred", () => {
      expect(computeAccessibilityMetrics([makeRow({ adjustment_status: "approved" })]).deferred_count).toBe(0);
    });
  });

  describe("total_cost", () => {
    it("sums cost_estimate values", () => {
      const rows = [
        makeRow({ cost_estimate: 100 }),
        makeRow({ cost_estimate: 200 }),
        makeRow({ cost_estimate: 300 }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.total_cost).toBe(600);
    });

    it("treats null cost_estimate as zero", () => {
      const rows = [
        makeRow({ cost_estimate: 100 }),
        makeRow({ cost_estimate: null }),
        makeRow({ cost_estimate: 200 }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.total_cost).toBe(300);
    });

    it("returns 0 when all cost_estimates are null", () => {
      const rows = [
        makeRow({ cost_estimate: null }),
        makeRow({ cost_estimate: null }),
      ];
      const m = computeAccessibilityMetrics(rows);
      expect(m.total_cost).toBe(0);
    });
  });
});

// ── computeAccessibilityAlerts ────────────────────────────────────────

describe("computeAccessibilityAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeAccessibilityAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({ compliance_level: "fully_accessible", adjustment_status: "not_required", emergency_egress_accessible: true, child_consulted: "Child A", lighting_adequate: true }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("not_accessible_critical_area alert", () => {
    it("fires when entrance_exit is not_accessible", () => {
      const rows = [makeRow({ compliance_level: "not_accessible", accessibility_area: "entrance_exit" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_accessible_critical_area");
      expect(alert).toBeDefined();
    });

    it("fires when communal_areas is not_accessible", () => {
      const rows = [makeRow({ compliance_level: "not_accessible", accessibility_area: "communal_areas" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_accessible_critical_area");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ compliance_level: "not_accessible", accessibility_area: "entrance_exit" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_accessible_critical_area")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "acc-1", compliance_level: "not_accessible", accessibility_area: "entrance_exit" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_accessible_critical_area")!;
      expect(alert.record_id).toBe("acc-1");
    });

    it("replaces underscores in area name in message", () => {
      const rows = [makeRow({ compliance_level: "not_accessible", accessibility_area: "entrance_exit" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_accessible_critical_area")!;
      expect(alert.message).toContain("entrance exit");
    });

    it("does not fire for not_accessible in non-critical area like bathroom", () => {
      const rows = [makeRow({ compliance_level: "not_accessible", accessibility_area: "bathroom" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_accessible_critical_area");
      expect(alert).toBeUndefined();
    });

    it("does not fire for partially_accessible in entrance_exit", () => {
      const rows = [makeRow({ compliance_level: "partially_accessible", accessibility_area: "entrance_exit" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "not_accessible_critical_area");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple not_accessible critical areas", () => {
      const rows = [
        makeRow({ compliance_level: "not_accessible", accessibility_area: "entrance_exit" }),
        makeRow({ compliance_level: "not_accessible", accessibility_area: "communal_areas" }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      const critical = alerts.filter((a) => a.type === "not_accessible_critical_area");
      expect(critical).toHaveLength(2);
    });
  });

  describe("adjustments_deferred alert", () => {
    it("fires when adjustments_needed and status is deferred", () => {
      const rows = [makeRow({ compliance_level: "adjustments_needed", adjustment_status: "deferred" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "adjustments_deferred");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ compliance_level: "adjustments_needed", adjustment_status: "deferred" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "adjustments_deferred")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "acc-2", compliance_level: "adjustments_needed", adjustment_status: "deferred" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "adjustments_deferred")!;
      expect(alert.record_id).toBe("acc-2");
    });

    it("replaces underscores in area name in message", () => {
      const rows = [makeRow({ compliance_level: "adjustments_needed", adjustment_status: "deferred", accessibility_area: "outdoor_spaces" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "adjustments_deferred")!;
      expect(alert.message).toContain("outdoor spaces");
    });

    it("does not fire when adjustments_needed but status is in_progress", () => {
      const rows = [makeRow({ compliance_level: "adjustments_needed", adjustment_status: "in_progress" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "adjustments_deferred");
      expect(alert).toBeUndefined();
    });

    it("does not fire when deferred but compliance is fully_accessible", () => {
      const rows = [makeRow({ compliance_level: "fully_accessible", adjustment_status: "deferred" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "adjustments_deferred");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple deferred adjustments", () => {
      const rows = [
        makeRow({ compliance_level: "adjustments_needed", adjustment_status: "deferred" }),
        makeRow({ compliance_level: "adjustments_needed", adjustment_status: "deferred" }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      const deferred = alerts.filter((a) => a.type === "adjustments_deferred");
      expect(deferred).toHaveLength(2);
    });
  });

  describe("emergency_egress_not_accessible alert", () => {
    it("fires when emergency_egress_accessible is false", () => {
      const rows = [makeRow({ emergency_egress_accessible: false })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "emergency_egress_not_accessible");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ emergency_egress_accessible: false })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "emergency_egress_not_accessible")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "acc-3", emergency_egress_accessible: false })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "emergency_egress_not_accessible")!;
      expect(alert.record_id).toBe("acc-3");
    });

    it("includes area name in message", () => {
      const rows = [makeRow({ emergency_egress_accessible: false, accessibility_area: "upper_floors" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "emergency_egress_not_accessible")!;
      expect(alert.message).toContain("upper floors");
    });

    it("does not fire when emergency_egress_accessible is true", () => {
      const rows = [makeRow({ emergency_egress_accessible: true })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "emergency_egress_not_accessible");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple inaccessible egress", () => {
      const rows = [
        makeRow({ emergency_egress_accessible: false }),
        makeRow({ emergency_egress_accessible: false }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      const egress = alerts.filter((a) => a.type === "emergency_egress_not_accessible");
      expect(egress).toHaveLength(2);
    });
  });

  describe("child_not_consulted alert", () => {
    it("fires when child_consulted is null", () => {
      const rows = [makeRow({ child_consulted: null })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ child_consulted: null })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ child_consulted: null }),
        makeRow({ child_consulted: null }),
        makeRow({ child_consulted: null }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted")!;
      expect(alert.message).toContain("3");
    });

    it("uses singular wording for 1 assessment", () => {
      const rows = [makeRow({ child_consulted: null })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted")!;
      expect(alert.message).toContain("assessment has");
    });

    it("uses plural wording for multiple assessments", () => {
      const rows = [
        makeRow({ child_consulted: null }),
        makeRow({ child_consulted: null }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted")!;
      expect(alert.message).toContain("assessments have");
    });

    it("does not fire when all rows have child_consulted", () => {
      const rows = [makeRow({ child_consulted: "Child A" }), makeRow({ child_consulted: "Child B" })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_not_consulted");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ child_consulted: null }),
        makeRow({ child_consulted: null }),
        makeRow({ child_consulted: null }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      const notConsulted = alerts.filter((a) => a.type === "child_not_consulted");
      expect(notConsulted).toHaveLength(1);
    });
  });

  describe("lighting_not_adequate alert", () => {
    it("fires when lighting_adequate is false", () => {
      const rows = [makeRow({ lighting_adequate: false })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "lighting_not_adequate");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ lighting_adequate: false })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "lighting_not_adequate")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ lighting_adequate: false }),
        makeRow({ lighting_adequate: false }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "lighting_not_adequate")!;
      expect(alert.message).toContain("2");
    });

    it("uses singular wording for 1 area", () => {
      const rows = [makeRow({ lighting_adequate: false })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "lighting_not_adequate")!;
      expect(alert.message).toContain("area has");
    });

    it("uses plural wording for multiple areas", () => {
      const rows = [
        makeRow({ lighting_adequate: false }),
        makeRow({ lighting_adequate: false }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "lighting_not_adequate")!;
      expect(alert.message).toContain("areas have");
    });

    it("does not fire when all rows have adequate lighting", () => {
      const rows = [makeRow({ lighting_adequate: true }), makeRow({ lighting_adequate: true })];
      const alerts = computeAccessibilityAlerts(rows);
      const alert = alerts.find((a) => a.type === "lighting_not_adequate");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ lighting_adequate: false }),
        makeRow({ lighting_adequate: false }),
        makeRow({ lighting_adequate: false }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      const lighting = alerts.filter((a) => a.type === "lighting_not_adequate");
      expect(lighting).toHaveLength(1);
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const rows = [
        makeRow({ compliance_level: "not_accessible", accessibility_area: "entrance_exit", emergency_egress_accessible: false, child_consulted: null, lighting_adequate: false }),
        makeRow({ compliance_level: "adjustments_needed", adjustment_status: "deferred", emergency_egress_accessible: true, child_consulted: "Child B", lighting_adequate: true }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("not_accessible_critical_area");
      expect(types).toContain("adjustments_deferred");
      expect(types).toContain("emergency_egress_not_accessible");
      expect(types).toContain("child_not_consulted");
      expect(types).toContain("lighting_not_adequate");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ compliance_level: "not_accessible", accessibility_area: "entrance_exit", emergency_egress_accessible: false, child_consulted: null, lighting_adequate: false }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ compliance_level: "not_accessible", accessibility_area: "entrance_exit", emergency_egress_accessible: false, child_consulted: null, lighting_adequate: false }),
        makeRow({ compliance_level: "adjustments_needed", adjustment_status: "deferred", child_consulted: null, lighting_adequate: false }),
      ];
      const alerts = computeAccessibilityAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ compliance_level: "not_accessible", accessibility_area: "entrance_exit" })];
      const alerts = computeAccessibilityAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateAccessibilityAriaInsights ──────────────────────────────────

describe("generateAccessibilityAriaInsights", () => {
  it("returns exactly 3 insights", () => {
    const metrics = computeAccessibilityMetrics([]);
    const alerts = computeAccessibilityAlerts([]);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [teal]", () => {
    const metrics = computeAccessibilityMetrics([makeRow()]);
    const alerts = computeAccessibilityAlerts([makeRow()]);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[0]).toMatch(/^\[teal\]/);
  });

  it("first insight includes total_assessments count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes wheelchair_accessible_rate", () => {
    const rows = [makeRow({ wheelchair_accessible: true }), makeRow({ wheelchair_accessible: false })];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes emergency_egress_accessible_rate", () => {
    const rows = [makeRow({ emergency_egress_accessible: true }), makeRow({ emergency_egress_accessible: false })];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes total_cost", () => {
    const rows = [makeRow({ cost_estimate: 1500 })];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[0]).toContain("1,500");
  });

  it("second insight starts with [amber]", () => {
    const metrics = computeAccessibilityMetrics([makeRow()]);
    const alerts = computeAccessibilityAlerts([makeRow()]);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ compliance_level: "not_accessible", accessibility_area: "entrance_exit", emergency_egress_accessible: false }),
    ];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ compliance_level: "fully_accessible", adjustment_status: "not_required", emergency_egress_accessible: true, child_consulted: "Child A", lighting_adequate: true })];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[1]).toContain("No critical or high-priority accessibility alerts");
  });

  it("third insight starts with [reflect]", () => {
    const metrics = computeAccessibilityMetrics([makeRow()]);
    const alerts = computeAccessibilityAlerts([makeRow()]);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions not accessible when some areas are not accessible", () => {
    const rows = [makeRow({ compliance_level: "not_accessible" })];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("not accessible");
  });

  it("third insight asks about deferred when no not_accessible but some deferred", () => {
    const rows = [
      makeRow({ compliance_level: "fully_accessible", adjustment_status: "deferred" }),
    ];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("deferred");
  });

  it("third insight celebrates when no not_accessible and no deferred", () => {
    const rows = [
      makeRow({ compliance_level: "fully_accessible", adjustment_status: "not_required" }),
    ];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("No areas are currently assessed as not accessible");
  });

  it("uses singular assessor wording when unique_assessors is 1", () => {
    const rows = [makeRow({ assessor_name: "Staff A" })];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[0]).toContain("1 assessor");
  });

  it("uses plural assessors wording when unique_assessors > 1", () => {
    const rows = [
      makeRow({ assessor_name: "Staff A" }),
      makeRow({ assessor_name: "Staff B" }),
    ];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[0]).toContain("2 assessors");
  });

  it("all insights are non-empty strings", () => {
    const metrics = computeAccessibilityMetrics([makeRow()]);
    const alerts = computeAccessibilityAlerts([makeRow()]);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("uses singular area wording when 1 not accessible", () => {
    const rows = [makeRow({ compliance_level: "not_accessible" })];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("area has");
  });

  it("uses plural areas wording when multiple not accessible", () => {
    const rows = [
      makeRow({ compliance_level: "not_accessible" }),
      makeRow({ compliance_level: "not_accessible" }),
    ];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("areas have");
  });

  it("uses singular adjustment wording when 1 deferred", () => {
    const rows = [makeRow({ compliance_level: "fully_accessible", adjustment_status: "deferred" })];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("adjustment has");
  });

  it("uses plural adjustments wording when multiple deferred", () => {
    const rows = [
      makeRow({ compliance_level: "fully_accessible", adjustment_status: "deferred" }),
      makeRow({ compliance_level: "fully_accessible", adjustment_status: "deferred" }),
    ];
    const metrics = computeAccessibilityMetrics(rows);
    const alerts = computeAccessibilityAlerts(rows);
    const insights = generateAccessibilityAriaInsights(metrics, alerts);
    expect(insights[2]).toContain("adjustments have");
  });
});

// ── Enum validation ──────────────────────────────────────────────────────

describe("enum arrays", () => {
  it("ACCESSIBILITY_AREAS has 8 entries", () => {
    expect(ACCESSIBILITY_AREAS).toHaveLength(8);
  });

  it("ACCESSIBILITY_AREAS contains entrance_exit", () => {
    expect(ACCESSIBILITY_AREAS).toContain("entrance_exit");
  });

  it("ACCESSIBILITY_AREAS contains communal_areas", () => {
    expect(ACCESSIBILITY_AREAS).toContain("communal_areas");
  });

  it("COMPLIANCE_LEVELS has 5 entries", () => {
    expect(COMPLIANCE_LEVELS).toHaveLength(5);
  });

  it("COMPLIANCE_LEVELS contains not_accessible", () => {
    expect(COMPLIANCE_LEVELS).toContain("not_accessible");
  });

  it("COMPLIANCE_LEVELS contains fully_accessible", () => {
    expect(COMPLIANCE_LEVELS).toContain("fully_accessible");
  });

  it("ADJUSTMENT_STATUSES has 6 entries", () => {
    expect(ADJUSTMENT_STATUSES).toHaveLength(6);
  });

  it("ADJUSTMENT_STATUSES contains deferred", () => {
    expect(ADJUSTMENT_STATUSES).toContain("deferred");
  });

  it("ADJUSTMENT_STATUSES contains completed", () => {
    expect(ADJUSTMENT_STATUSES).toContain("completed");
  });

  it("NEED_TYPES has 7 entries", () => {
    expect(NEED_TYPES).toHaveLength(7);
  });

  it("NEED_TYPES contains mobility", () => {
    expect(NEED_TYPES).toContain("mobility");
  });

  it("NEED_TYPES contains multiple", () => {
    expect(NEED_TYPES).toContain("multiple");
  });
});
