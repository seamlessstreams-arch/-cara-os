// ══════════════════════════════════════════════════════════════════════════════
// CARA — ENVIRONMENTAL IMPACT ASSESSMENT SERVICE TESTS
// Pure-function tests for environmental impact metrics, alert identification,
// Cara insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  ASSESSMENT_AREAS,
  PERFORMANCE_RATINGS,
  IMPROVEMENT_STATUSES,
  MEASUREMENT_PERIODS,
  _testing,
} from "../environmental-impact-assessment-service";

import type {
  EnvironmentalImpactAssessmentRow,
  AssessmentArea,
  PerformanceRating,
  ImprovementStatus,
  MeasurementPeriod,
} from "../environmental-impact-assessment-service";

const {
  computeEnvironmentalImpactMetrics,
  computeEnvironmentalImpactAlerts,
  generateEnvironmentalImpactCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<EnvironmentalImpactAssessmentRow>,
): EnvironmentalImpactAssessmentRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    assessment_date: "assessment_date" in (overrides ?? {}) ? overrides!.assessment_date! : now.toISOString().split("T")[0],
    assessment_area: "assessment_area" in (overrides ?? {}) ? overrides!.assessment_area! : "energy_efficiency",
    performance_rating: "performance_rating" in (overrides ?? {}) ? overrides!.performance_rating! : "good",
    improvement_status: "improvement_status" in (overrides ?? {}) ? overrides!.improvement_status! : "in_progress",
    measurement_period: "measurement_period" in (overrides ?? {}) ? overrides!.measurement_period! : "monthly",
    assessor_name: "assessor_name" in (overrides ?? {}) ? overrides!.assessor_name! : "Staff A",
    baseline_value: "baseline_value" in (overrides ?? {}) ? (overrides!.baseline_value ?? null) : null,
    current_value: "current_value" in (overrides ?? {}) ? (overrides!.current_value ?? null) : null,
    target_value: "target_value" in (overrides ?? {}) ? (overrides!.target_value ?? null) : null,
    children_involved: "children_involved" in (overrides ?? {}) ? overrides!.children_involved! : true,
    staff_trained: "staff_trained" in (overrides ?? {}) ? overrides!.staff_trained! : true,
    cost_saving_identified: "cost_saving_identified" in (overrides ?? {}) ? overrides!.cost_saving_identified! : true,
    action_plan_created: "action_plan_created" in (overrides ?? {}) ? overrides!.action_plan_created! : true,
    progress_monitored: "progress_monitored" in (overrides ?? {}) ? overrides!.progress_monitored! : true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeEnvironmentalImpactMetrics ────────────────────────────────────

describe("computeEnvironmentalImpactMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_assessments", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.total_assessments).toBe(0);
    });

    it("returns zero poor_count", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.poor_count).toBe(0);
    });

    it("returns zero below_standard_count", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.below_standard_count).toBe(0);
    });

    it("returns zero not_started_count", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.not_started_count).toBe(0);
    });

    it("returns zero no_action_plan_count", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.no_action_plan_count).toBe(0);
    });

    it("returns zero children_involved_rate", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.children_involved_rate).toBe(0);
    });

    it("returns zero staff_trained_rate", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.staff_trained_rate).toBe(0);
    });

    it("returns zero cost_saving_rate", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.cost_saving_rate).toBe(0);
    });

    it("returns zero action_plan_rate", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.action_plan_rate).toBe(0);
    });

    it("returns zero progress_monitored_rate", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.progress_monitored_rate).toBe(0);
    });

    it("returns empty area_breakdown", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.area_breakdown).toEqual({});
    });

    it("returns empty rating_breakdown", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.rating_breakdown).toEqual({});
    });

    it("returns zero unique_assessors", () => {
      const m = computeEnvironmentalImpactMetrics([]);
      expect(m.unique_assessors).toBe(0);
    });
  });

  describe("single row", () => {
    const row = makeRow({
      performance_rating: "good",
      improvement_status: "in_progress",
      children_involved: true,
      staff_trained: true,
      cost_saving_identified: true,
      action_plan_created: true,
      progress_monitored: true,
      assessment_area: "energy_efficiency",
      assessor_name: "Staff A",
    });

    it("returns total_assessments = 1", () => {
      const m = computeEnvironmentalImpactMetrics([row]);
      expect(m.total_assessments).toBe(1);
    });

    it("returns children_involved_rate = 100", () => {
      const m = computeEnvironmentalImpactMetrics([row]);
      expect(m.children_involved_rate).toBe(100);
    });

    it("returns staff_trained_rate = 100", () => {
      const m = computeEnvironmentalImpactMetrics([row]);
      expect(m.staff_trained_rate).toBe(100);
    });

    it("returns cost_saving_rate = 100", () => {
      const m = computeEnvironmentalImpactMetrics([row]);
      expect(m.cost_saving_rate).toBe(100);
    });

    it("returns action_plan_rate = 100", () => {
      const m = computeEnvironmentalImpactMetrics([row]);
      expect(m.action_plan_rate).toBe(100);
    });

    it("returns progress_monitored_rate = 100", () => {
      const m = computeEnvironmentalImpactMetrics([row]);
      expect(m.progress_monitored_rate).toBe(100);
    });

    it("returns poor_count = 0", () => {
      const m = computeEnvironmentalImpactMetrics([row]);
      expect(m.poor_count).toBe(0);
    });

    it("returns area_breakdown with single entry", () => {
      const m = computeEnvironmentalImpactMetrics([row]);
      expect(m.area_breakdown).toEqual({ energy_efficiency: 1 });
    });

    it("returns rating_breakdown with single entry", () => {
      const m = computeEnvironmentalImpactMetrics([row]);
      expect(m.rating_breakdown).toEqual({ good: 1 });
    });

    it("returns unique_assessors = 1", () => {
      const m = computeEnvironmentalImpactMetrics([row]);
      expect(m.unique_assessors).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ performance_rating: "good", assessment_area: "energy_efficiency", assessor_name: "Staff A", children_involved: true, staff_trained: true, cost_saving_identified: true, action_plan_created: true, progress_monitored: true, improvement_status: "in_progress" }),
      makeRow({ performance_rating: "poor", assessment_area: "waste_management", assessor_name: "Staff B", children_involved: false, staff_trained: true, cost_saving_identified: false, action_plan_created: false, progress_monitored: false, improvement_status: "not_started" }),
      makeRow({ performance_rating: "below_standard", assessment_area: "water_conservation", assessor_name: "Staff C", children_involved: true, staff_trained: false, cost_saving_identified: true, action_plan_created: true, progress_monitored: true, improvement_status: "planning" }),
    ];

    it("returns total_assessments = 3", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.total_assessments).toBe(3);
    });

    it("returns poor_count = 1", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.poor_count).toBe(1);
    });

    it("returns below_standard_count = 1", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.below_standard_count).toBe(1);
    });

    it("returns not_started_count = 1", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.not_started_count).toBe(1);
    });

    it("returns no_action_plan_count = 1", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.no_action_plan_count).toBe(1);
    });

    it("calculates children_involved_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.children_involved_rate).toBe(66.7);
    });

    it("calculates staff_trained_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.staff_trained_rate).toBe(66.7);
    });

    it("calculates cost_saving_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.cost_saving_rate).toBe(66.7);
    });

    it("calculates action_plan_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.action_plan_rate).toBe(66.7);
    });

    it("calculates progress_monitored_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.progress_monitored_rate).toBe(66.7);
    });

    it("groups area_breakdown correctly", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.area_breakdown).toEqual({
        energy_efficiency: 1,
        waste_management: 1,
        water_conservation: 1,
      });
    });

    it("groups rating_breakdown correctly", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.rating_breakdown).toEqual({
        good: 1,
        poor: 1,
        below_standard: 1,
      });
    });

    it("returns unique_assessors = 3", () => {
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });

  describe("area_breakdown", () => {
    it("counts duplicate areas", () => {
      const rows = [
        makeRow({ assessment_area: "energy_efficiency" }),
        makeRow({ assessment_area: "energy_efficiency" }),
        makeRow({ assessment_area: "biodiversity" }),
      ];
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.area_breakdown).toEqual({ energy_efficiency: 2, biodiversity: 1 });
    });

    it("handles all 10 assessment areas", () => {
      const rows = ASSESSMENT_AREAS.map((a) => makeRow({ assessment_area: a }));
      const m = computeEnvironmentalImpactMetrics(rows);
      for (const a of ASSESSMENT_AREAS) {
        expect(m.area_breakdown[a]).toBe(1);
      }
    });
  });

  describe("rating_breakdown", () => {
    it("counts duplicate ratings", () => {
      const rows = [
        makeRow({ performance_rating: "good" }),
        makeRow({ performance_rating: "good" }),
        makeRow({ performance_rating: "poor" }),
      ];
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.rating_breakdown).toEqual({ good: 2, poor: 1 });
    });

    it("handles all 5 performance ratings", () => {
      const rows = PERFORMANCE_RATINGS.map((r) => makeRow({ performance_rating: r }));
      const m = computeEnvironmentalImpactMetrics(rows);
      for (const r of PERFORMANCE_RATINGS) {
        expect(m.rating_breakdown[r]).toBe(1);
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
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.unique_assessors).toBe(2);
    });

    it("returns 1 when all rows have the same assessor", () => {
      const rows = [
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
      ];
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.unique_assessors).toBe(1);
    });

    it("counts each unique assessor name", () => {
      const rows = [
        makeRow({ assessor_name: "Alice" }),
        makeRow({ assessor_name: "Bob" }),
        makeRow({ assessor_name: "Charlie" }),
        makeRow({ assessor_name: "Alice" }),
      ];
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });

  describe("percentage calculations with known values", () => {
    it("children_involved_rate 0 when all false", () => {
      expect(computeEnvironmentalImpactMetrics([makeRow({ children_involved: false })]).children_involved_rate).toBe(0);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ children_involved: true }),
        makeRow({ children_involved: false }),
        makeRow({ children_involved: false }),
      ];
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.children_involved_rate).toBe(33.3);
    });

    it("returns 100 for all rates when single row has all flags true", () => {
      const rows = [
        makeRow({ children_involved: true, staff_trained: true, cost_saving_identified: true, action_plan_created: true, progress_monitored: true }),
      ];
      const m = computeEnvironmentalImpactMetrics(rows);
      expect(m.children_involved_rate).toBe(100);
      expect(m.staff_trained_rate).toBe(100);
      expect(m.cost_saving_rate).toBe(100);
      expect(m.action_plan_rate).toBe(100);
      expect(m.progress_monitored_rate).toBe(100);
    });
  });

  describe("counts", () => {
    it("counts poor_count", () => {
      expect(computeEnvironmentalImpactMetrics([makeRow({ performance_rating: "poor" })]).poor_count).toBe(1);
    });

    it("does not count satisfactory as poor", () => {
      expect(computeEnvironmentalImpactMetrics([makeRow({ performance_rating: "satisfactory" })]).poor_count).toBe(0);
    });

    it("counts below_standard_count", () => {
      expect(computeEnvironmentalImpactMetrics([makeRow({ performance_rating: "below_standard" })]).below_standard_count).toBe(1);
    });

    it("counts not_started_count", () => {
      expect(computeEnvironmentalImpactMetrics([makeRow({ improvement_status: "not_started" })]).not_started_count).toBe(1);
    });

    it("does not count planning as not_started", () => {
      expect(computeEnvironmentalImpactMetrics([makeRow({ improvement_status: "planning" })]).not_started_count).toBe(0);
    });

    it("counts no_action_plan_count when action_plan_created is false", () => {
      expect(computeEnvironmentalImpactMetrics([makeRow({ action_plan_created: false })]).no_action_plan_count).toBe(1);
    });

    it("does not count no_action_plan_count when action_plan_created is true", () => {
      expect(computeEnvironmentalImpactMetrics([makeRow({ action_plan_created: true })]).no_action_plan_count).toBe(0);
    });
  });
});

// ── computeEnvironmentalImpactAlerts ────────────────────────────────────

describe("computeEnvironmentalImpactAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeEnvironmentalImpactAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({ performance_rating: "good", improvement_status: "in_progress", action_plan_created: true, progress_monitored: true, children_involved: true }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("poor_no_action_plan alert", () => {
    it("fires when poor rating and no action plan", () => {
      const rows = [makeRow({ performance_rating: "poor", action_plan_created: false })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_no_action_plan");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ performance_rating: "poor", action_plan_created: false })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_no_action_plan")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "eia-1", performance_rating: "poor", action_plan_created: false })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_no_action_plan")!;
      expect(alert.record_id).toBe("eia-1");
    });

    it("replaces underscores in area in message", () => {
      const rows = [makeRow({ performance_rating: "poor", action_plan_created: false, assessment_area: "waste_management" })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_no_action_plan")!;
      expect(alert.message).toContain("waste management");
    });

    it("does not fire for poor with action plan", () => {
      const rows = [makeRow({ performance_rating: "poor", action_plan_created: true })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_no_action_plan");
      expect(alert).toBeUndefined();
    });

    it("does not fire for good rating without action plan", () => {
      const rows = [makeRow({ performance_rating: "good", action_plan_created: false })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_no_action_plan");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple poor + no action plan", () => {
      const rows = [
        makeRow({ performance_rating: "poor", action_plan_created: false }),
        makeRow({ performance_rating: "poor", action_plan_created: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const critical = alerts.filter((a) => a.type === "poor_no_action_plan");
      expect(critical).toHaveLength(2);
    });
  });

  describe("below_standard_not_started alert", () => {
    it("fires when below_standard with not_started improvement", () => {
      const rows = [makeRow({ performance_rating: "below_standard", improvement_status: "not_started" })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "below_standard_not_started");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ performance_rating: "below_standard", improvement_status: "not_started" })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "below_standard_not_started")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "eia-2", performance_rating: "below_standard", improvement_status: "not_started" })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "below_standard_not_started")!;
      expect(alert.record_id).toBe("eia-2");
    });

    it("does not fire when improvement is in_progress", () => {
      const rows = [makeRow({ performance_rating: "below_standard", improvement_status: "in_progress" })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "below_standard_not_started");
      expect(alert).toBeUndefined();
    });

    it("does not fire for good rating with not_started improvement", () => {
      const rows = [makeRow({ performance_rating: "good", improvement_status: "not_started" })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "below_standard_not_started");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple below_standard + not_started", () => {
      const rows = [
        makeRow({ performance_rating: "below_standard", improvement_status: "not_started" }),
        makeRow({ performance_rating: "below_standard", improvement_status: "not_started" }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const high = alerts.filter((a) => a.type === "below_standard_not_started");
      expect(high).toHaveLength(2);
    });
  });

  describe("multiple_no_progress_monitoring alert", () => {
    it("fires when 2 or more assessments lack progress monitoring", () => {
      const rows = [
        makeRow({ progress_monitored: false }),
        makeRow({ progress_monitored: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_no_progress_monitoring");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [
        makeRow({ progress_monitored: false }),
        makeRow({ progress_monitored: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_no_progress_monitoring")!;
      expect(alert.severity).toBe("high");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ progress_monitored: false }),
        makeRow({ progress_monitored: false }),
        makeRow({ progress_monitored: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_no_progress_monitoring")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 assessment lacks progress monitoring", () => {
      const rows = [makeRow({ progress_monitored: false })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_no_progress_monitoring");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all have progress monitoring", () => {
      const rows = [makeRow({ progress_monitored: true }), makeRow({ progress_monitored: true })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "multiple_no_progress_monitoring");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ progress_monitored: false }),
        makeRow({ progress_monitored: false }),
        makeRow({ progress_monitored: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const monitoring = alerts.filter((a) => a.type === "multiple_no_progress_monitoring");
      expect(monitoring).toHaveLength(1);
    });
  });

  describe("children_not_involved alert", () => {
    it("fires when 2 or more assessments do not involve children", () => {
      const rows = [
        makeRow({ children_involved: false }),
        makeRow({ children_involved: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_involved");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [
        makeRow({ children_involved: false }),
        makeRow({ children_involved: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_involved")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ children_involved: false }),
        makeRow({ children_involved: false }),
        makeRow({ children_involved: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_involved")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 assessment lacks children involvement", () => {
      const rows = [makeRow({ children_involved: false })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_involved");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all involve children", () => {
      const rows = [makeRow({ children_involved: true }), makeRow({ children_involved: true })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_involved");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ children_involved: false }),
        makeRow({ children_involved: false }),
        makeRow({ children_involved: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const involved = alerts.filter((a) => a.type === "children_not_involved");
      expect(involved).toHaveLength(1);
    });
  });

  describe("combined alerts", () => {
    it("can fire all four alert types simultaneously", () => {
      const rows = [
        makeRow({ performance_rating: "poor", action_plan_created: false, children_involved: false, progress_monitored: false, improvement_status: "not_started" }),
        makeRow({ performance_rating: "below_standard", improvement_status: "not_started", children_involved: false, progress_monitored: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("poor_no_action_plan");
      expect(types).toContain("below_standard_not_started");
      expect(types).toContain("multiple_no_progress_monitoring");
      expect(types).toContain("children_not_involved");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ performance_rating: "poor", action_plan_created: false, improvement_status: "not_started" }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ performance_rating: "poor", action_plan_created: false, children_involved: false, progress_monitored: false, improvement_status: "not_started" }),
        makeRow({ performance_rating: "below_standard", improvement_status: "not_started", children_involved: false, progress_monitored: false }),
      ];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ performance_rating: "poor", action_plan_created: false })];
      const alerts = computeEnvironmentalImpactAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateEnvironmentalImpactCaraInsights ──────────────────────────────

describe("generateEnvironmentalImpactCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const metrics = computeEnvironmentalImpactMetrics([]);
    const alerts = computeEnvironmentalImpactAlerts([]);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [cyan]", () => {
    const metrics = computeEnvironmentalImpactMetrics([makeRow()]);
    const alerts = computeEnvironmentalImpactAlerts([makeRow()]);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[0]).toMatch(/^\[cyan\]/);
  });

  it("first insight includes total_assessments count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes children_involved_rate", () => {
    const rows = [makeRow({ children_involved: true }), makeRow({ children_involved: false })];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("50%");
  });

  it("second insight starts with [amber]", () => {
    const metrics = computeEnvironmentalImpactMetrics([makeRow()]);
    const alerts = computeEnvironmentalImpactAlerts([makeRow()]);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ performance_rating: "poor", action_plan_created: false, progress_monitored: false }),
      makeRow({ progress_monitored: false }),
    ];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ performance_rating: "good", improvement_status: "in_progress", action_plan_created: true, progress_monitored: true, children_involved: true })];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("third insight starts with [reflect]", () => {
    const metrics = computeEnvironmentalImpactMetrics([makeRow()]);
    const alerts = computeEnvironmentalImpactAlerts([makeRow()]);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions poor when some are poor", () => {
    const rows = [makeRow({ performance_rating: "poor" })];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("poor");
  });

  it("third insight asks about children involvement when no poor but not all involve children", () => {
    const rows = [
      makeRow({ performance_rating: "good", children_involved: false }),
      makeRow({ performance_rating: "good", children_involved: true }),
    ];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("Children are involved");
  });

  it("third insight celebrates when all involve children and no poor ratings", () => {
    const rows = [
      makeRow({ performance_rating: "good", children_involved: true }),
      makeRow({ performance_rating: "good", children_involved: true }),
    ];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("involve children and no poor");
  });

  it("uses singular assessor wording when unique_assessors is 1", () => {
    const rows = [makeRow({ assessor_name: "Staff A" })];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("1 assessor");
  });

  it("uses plural assessors wording when unique_assessors > 1", () => {
    const rows = [
      makeRow({ assessor_name: "Staff A" }),
      makeRow({ assessor_name: "Staff B" }),
    ];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("2 assessors");
  });

  it("all insights are non-empty strings", () => {
    const metrics = computeEnvironmentalImpactMetrics([makeRow()]);
    const alerts = computeEnvironmentalImpactAlerts([makeRow()]);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("uses singular assessment wording when 1 poor", () => {
    const rows = [makeRow({ performance_rating: "poor" })];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("assessment has");
  });

  it("uses plural assessments wording when multiple poor", () => {
    const rows = [
      makeRow({ performance_rating: "poor" }),
      makeRow({ performance_rating: "poor" }),
    ];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("assessments have");
  });
});
