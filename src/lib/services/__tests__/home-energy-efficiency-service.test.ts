// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ENERGY EFFICIENCY SERVICE TESTS
// Pure-function tests for energy efficiency metrics, alert identification,
// Cara insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  ENERGY_AREAS,
  EFFICIENCY_RATINGS,
  IMPROVEMENT_STATUSES,
  ASSESSMENT_TYPES,
  _testing,
} from "../home-energy-efficiency-service";

import type {
  HomeEnergyEfficiencyRow,
  EnergyArea,
  EfficiencyRating,
  ImprovementStatus,
  AssessmentType,
} from "../home-energy-efficiency-service";

const {
  computeEnergyEfficiencyMetrics,
  computeEnergyEfficiencyAlerts,
  generateEnergyEfficiencyCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<HomeEnergyEfficiencyRow>,
): HomeEnergyEfficiencyRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    assessor_name: "assessor_name" in (overrides ?? {}) ? overrides!.assessor_name! : "Staff A",
    assessor_id: "assessor_id" in (overrides ?? {}) ? (overrides!.assessor_id ?? null) : null,
    assessment_date: "assessment_date" in (overrides ?? {}) ? overrides!.assessment_date! : now.toISOString().split("T")[0],
    energy_area: "energy_area" in (overrides ?? {}) ? overrides!.energy_area! : "heating",
    efficiency_rating: "efficiency_rating" in (overrides ?? {}) ? overrides!.efficiency_rating! : "b_rating",
    improvement_status: "improvement_status" in (overrides ?? {}) ? overrides!.improvement_status! : "in_progress",
    assessment_type: "assessment_type" in (overrides ?? {}) ? overrides!.assessment_type! : "epc_assessment",
    current_epc_valid: "current_epc_valid" in (overrides ?? {}) ? overrides!.current_epc_valid! : true,
    smart_meter_installed: "smart_meter_installed" in (overrides ?? {}) ? overrides!.smart_meter_installed! : true,
    led_lighting_throughout: "led_lighting_throughout" in (overrides ?? {}) ? overrides!.led_lighting_throughout! : true,
    insulation_adequate: "insulation_adequate" in (overrides ?? {}) ? overrides!.insulation_adequate! : true,
    draught_proofing_done: "draught_proofing_done" in (overrides ?? {}) ? overrides!.draught_proofing_done! : true,
    renewable_energy_installed: "renewable_energy_installed" in (overrides ?? {}) ? overrides!.renewable_energy_installed! : true,
    energy_saving_measures_active: "energy_saving_measures_active" in (overrides ?? {}) ? overrides!.energy_saving_measures_active! : true,
    children_involved_in_saving: "children_involved_in_saving" in (overrides ?? {}) ? overrides!.children_involved_in_saving! : true,
    monthly_cost_estimate: "monthly_cost_estimate" in (overrides ?? {}) ? (overrides!.monthly_cost_estimate ?? null) : null,
    carbon_footprint_tonnes: "carbon_footprint_tonnes" in (overrides ?? {}) ? (overrides!.carbon_footprint_tonnes ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeEnergyEfficiencyMetrics ──────────────────────────────────────

describe("computeEnergyEfficiencyMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_assessments", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.total_assessments).toBe(0);
    });

    it("returns zero poor_rating_count", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.poor_rating_count).toBe(0);
    });

    it("returns zero improvement_identified_count", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.improvement_identified_count).toBe(0);
    });

    it("returns zero completed_count", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.completed_count).toBe(0);
    });

    it("returns zero deferred_count", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.deferred_count).toBe(0);
    });

    it("returns zero epc_valid_rate", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.epc_valid_rate).toBe(0);
    });

    it("returns zero smart_meter_rate", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.smart_meter_rate).toBe(0);
    });

    it("returns zero led_lighting_rate", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.led_lighting_rate).toBe(0);
    });

    it("returns zero insulation_rate", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.insulation_rate).toBe(0);
    });

    it("returns zero draught_proofing_rate", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.draught_proofing_rate).toBe(0);
    });

    it("returns zero renewable_rate", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.renewable_rate).toBe(0);
    });

    it("returns zero energy_saving_rate", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.energy_saving_rate).toBe(0);
    });

    it("returns zero children_involved_rate", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.children_involved_rate).toBe(0);
    });

    it("returns zero total_monthly_cost", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.total_monthly_cost).toBe(0);
    });

    it("returns zero total_carbon", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.total_carbon).toBe(0);
    });

    it("returns empty energy_area_breakdown", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.energy_area_breakdown).toEqual({});
    });

    it("returns empty rating_breakdown", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.rating_breakdown).toEqual({});
    });

    it("returns zero unique_assessors", () => {
      const m = computeEnergyEfficiencyMetrics([]);
      expect(m.unique_assessors).toBe(0);
    });
  });

  describe("single row", () => {
    const row = makeRow({
      efficiency_rating: "b_rating",
      improvement_status: "in_progress",
      current_epc_valid: true,
      smart_meter_installed: true,
      led_lighting_throughout: true,
      insulation_adequate: true,
      draught_proofing_done: true,
      renewable_energy_installed: true,
      energy_saving_measures_active: true,
      children_involved_in_saving: true,
      energy_area: "heating",
      assessor_name: "Staff A",
      monthly_cost_estimate: 150.50,
      carbon_footprint_tonnes: 2.5,
    });

    it("returns total_assessments = 1", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.total_assessments).toBe(1);
    });

    it("returns epc_valid_rate = 100", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.epc_valid_rate).toBe(100);
    });

    it("returns smart_meter_rate = 100", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.smart_meter_rate).toBe(100);
    });

    it("returns led_lighting_rate = 100", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.led_lighting_rate).toBe(100);
    });

    it("returns insulation_rate = 100", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.insulation_rate).toBe(100);
    });

    it("returns draught_proofing_rate = 100", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.draught_proofing_rate).toBe(100);
    });

    it("returns renewable_rate = 100", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.renewable_rate).toBe(100);
    });

    it("returns energy_saving_rate = 100", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.energy_saving_rate).toBe(100);
    });

    it("returns children_involved_rate = 100", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.children_involved_rate).toBe(100);
    });

    it("returns poor_rating_count = 0", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.poor_rating_count).toBe(0);
    });

    it("returns total_monthly_cost from single row", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.total_monthly_cost).toBe(150.50);
    });

    it("returns total_carbon from single row", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.total_carbon).toBe(2.5);
    });

    it("returns energy_area_breakdown with single entry", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.energy_area_breakdown).toEqual({ heating: 1 });
    });

    it("returns rating_breakdown with single entry", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.rating_breakdown).toEqual({ b_rating: 1 });
    });

    it("returns unique_assessors = 1", () => {
      const m = computeEnergyEfficiencyMetrics([row]);
      expect(m.unique_assessors).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ efficiency_rating: "b_rating", energy_area: "heating", assessor_name: "Staff A", current_epc_valid: true, smart_meter_installed: true, led_lighting_throughout: true, insulation_adequate: true, draught_proofing_done: true, renewable_energy_installed: true, energy_saving_measures_active: true, children_involved_in_saving: true, improvement_status: "in_progress", monthly_cost_estimate: 100, carbon_footprint_tonnes: 1.5 }),
      makeRow({ efficiency_rating: "e_rating", energy_area: "lighting", assessor_name: "Staff B", current_epc_valid: false, smart_meter_installed: false, led_lighting_throughout: false, insulation_adequate: false, draught_proofing_done: false, renewable_energy_installed: false, energy_saving_measures_active: false, children_involved_in_saving: false, improvement_status: "identified", monthly_cost_estimate: 200, carbon_footprint_tonnes: 3.0 }),
      makeRow({ efficiency_rating: "c_rating", energy_area: "insulation", assessor_name: "Staff C", current_epc_valid: true, smart_meter_installed: true, led_lighting_throughout: false, insulation_adequate: true, draught_proofing_done: true, renewable_energy_installed: false, energy_saving_measures_active: true, children_involved_in_saving: true, improvement_status: "completed", monthly_cost_estimate: 50, carbon_footprint_tonnes: 0.8 }),
    ];

    it("returns total_assessments = 3", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.total_assessments).toBe(3);
    });

    it("returns poor_rating_count = 1", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.poor_rating_count).toBe(1);
    });

    it("returns improvement_identified_count = 1", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.improvement_identified_count).toBe(1);
    });

    it("returns completed_count = 1", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.completed_count).toBe(1);
    });

    it("calculates epc_valid_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.epc_valid_rate).toBe(66.7);
    });

    it("calculates smart_meter_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.smart_meter_rate).toBe(66.7);
    });

    it("calculates led_lighting_rate correctly (1/3 = 33.3%)", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.led_lighting_rate).toBe(33.3);
    });

    it("calculates insulation_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.insulation_rate).toBe(66.7);
    });

    it("calculates draught_proofing_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.draught_proofing_rate).toBe(66.7);
    });

    it("calculates renewable_rate correctly (1/3 = 33.3%)", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.renewable_rate).toBe(33.3);
    });

    it("calculates energy_saving_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.energy_saving_rate).toBe(66.7);
    });

    it("calculates children_involved_rate correctly (2/3 = 66.7%)", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.children_involved_rate).toBe(66.7);
    });

    it("sums total_monthly_cost across rows", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.total_monthly_cost).toBe(350);
    });

    it("sums total_carbon across rows", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.total_carbon).toBe(5.3);
    });

    it("groups energy_area_breakdown correctly", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.energy_area_breakdown).toEqual({
        heating: 1,
        lighting: 1,
        insulation: 1,
      });
    });

    it("groups rating_breakdown correctly", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.rating_breakdown).toEqual({
        b_rating: 1,
        e_rating: 1,
        c_rating: 1,
      });
    });

    it("returns unique_assessors = 3", () => {
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });

  describe("poor_rating_count", () => {
    it("counts e_rating as poor", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ efficiency_rating: "e_rating" })]);
      expect(m.poor_rating_count).toBe(1);
    });

    it("counts f_rating as poor", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ efficiency_rating: "f_rating" })]);
      expect(m.poor_rating_count).toBe(1);
    });

    it("counts g_rating as poor", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ efficiency_rating: "g_rating" })]);
      expect(m.poor_rating_count).toBe(1);
    });

    it("does not count a_rating as poor", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ efficiency_rating: "a_rating" })]);
      expect(m.poor_rating_count).toBe(0);
    });

    it("does not count b_rating as poor", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ efficiency_rating: "b_rating" })]);
      expect(m.poor_rating_count).toBe(0);
    });

    it("does not count c_rating as poor", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ efficiency_rating: "c_rating" })]);
      expect(m.poor_rating_count).toBe(0);
    });

    it("does not count d_rating as poor", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ efficiency_rating: "d_rating" })]);
      expect(m.poor_rating_count).toBe(0);
    });

    it("does not count not_assessed as poor", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ efficiency_rating: "not_assessed" })]);
      expect(m.poor_rating_count).toBe(0);
    });

    it("counts multiple poor ratings", () => {
      const rows = [
        makeRow({ efficiency_rating: "e_rating" }),
        makeRow({ efficiency_rating: "f_rating" }),
        makeRow({ efficiency_rating: "g_rating" }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.poor_rating_count).toBe(3);
    });
  });

  describe("improvement status counts", () => {
    it("counts identified status", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ improvement_status: "identified" })]);
      expect(m.improvement_identified_count).toBe(1);
    });

    it("does not count costed as identified", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ improvement_status: "costed" })]);
      expect(m.improvement_identified_count).toBe(0);
    });

    it("counts completed status", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ improvement_status: "completed" })]);
      expect(m.completed_count).toBe(1);
    });

    it("does not count in_progress as completed", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ improvement_status: "in_progress" })]);
      expect(m.completed_count).toBe(0);
    });

    it("counts deferred status", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ improvement_status: "deferred" })]);
      expect(m.deferred_count).toBe(1);
    });

    it("does not count approved as deferred", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ improvement_status: "approved" })]);
      expect(m.deferred_count).toBe(0);
    });
  });

  describe("energy_area_breakdown", () => {
    it("counts duplicate areas", () => {
      const rows = [
        makeRow({ energy_area: "heating" }),
        makeRow({ energy_area: "heating" }),
        makeRow({ energy_area: "lighting" }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.energy_area_breakdown).toEqual({ heating: 2, lighting: 1 });
    });

    it("handles all 8 energy areas", () => {
      const rows = ENERGY_AREAS.map((a) => makeRow({ energy_area: a }));
      const m = computeEnergyEfficiencyMetrics(rows);
      for (const a of ENERGY_AREAS) {
        expect(m.energy_area_breakdown[a]).toBe(1);
      }
    });
  });

  describe("rating_breakdown", () => {
    it("counts duplicate ratings", () => {
      const rows = [
        makeRow({ efficiency_rating: "b_rating" }),
        makeRow({ efficiency_rating: "b_rating" }),
        makeRow({ efficiency_rating: "e_rating" }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.rating_breakdown).toEqual({ b_rating: 2, e_rating: 1 });
    });

    it("handles all 8 efficiency ratings", () => {
      const rows = EFFICIENCY_RATINGS.map((r) => makeRow({ efficiency_rating: r }));
      const m = computeEnergyEfficiencyMetrics(rows);
      for (const r of EFFICIENCY_RATINGS) {
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
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.unique_assessors).toBe(2);
    });

    it("returns 1 when all rows have the same assessor", () => {
      const rows = [
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.unique_assessors).toBe(1);
    });

    it("counts each unique assessor name", () => {
      const rows = [
        makeRow({ assessor_name: "Alice" }),
        makeRow({ assessor_name: "Bob" }),
        makeRow({ assessor_name: "Charlie" }),
        makeRow({ assessor_name: "Alice" }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });

  describe("percentage calculations with known values", () => {
    it("epc_valid_rate 0 when all false", () => {
      expect(computeEnergyEfficiencyMetrics([makeRow({ current_epc_valid: false })]).epc_valid_rate).toBe(0);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ current_epc_valid: true }),
        makeRow({ current_epc_valid: false }),
        makeRow({ current_epc_valid: false }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.epc_valid_rate).toBe(33.3);
    });

    it("returns 100 for all rates when single row has all flags true", () => {
      const rows = [
        makeRow({ current_epc_valid: true, smart_meter_installed: true, led_lighting_throughout: true, insulation_adequate: true, draught_proofing_done: true, renewable_energy_installed: true, energy_saving_measures_active: true, children_involved_in_saving: true }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.epc_valid_rate).toBe(100);
      expect(m.smart_meter_rate).toBe(100);
      expect(m.led_lighting_rate).toBe(100);
      expect(m.insulation_rate).toBe(100);
      expect(m.draught_proofing_rate).toBe(100);
      expect(m.renewable_rate).toBe(100);
      expect(m.energy_saving_rate).toBe(100);
      expect(m.children_involved_rate).toBe(100);
    });
  });

  describe("total_monthly_cost", () => {
    it("sums costs ignoring nulls", () => {
      const rows = [
        makeRow({ monthly_cost_estimate: 100 }),
        makeRow({ monthly_cost_estimate: null }),
        makeRow({ monthly_cost_estimate: 75.50 }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.total_monthly_cost).toBe(175.50);
    });

    it("returns 0 when all costs are null", () => {
      const rows = [
        makeRow({ monthly_cost_estimate: null }),
        makeRow({ monthly_cost_estimate: null }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.total_monthly_cost).toBe(0);
    });

    it("handles single cost", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ monthly_cost_estimate: 250.99 })]);
      expect(m.total_monthly_cost).toBe(250.99);
    });
  });

  describe("total_carbon", () => {
    it("sums carbon ignoring nulls", () => {
      const rows = [
        makeRow({ carbon_footprint_tonnes: 1.5 }),
        makeRow({ carbon_footprint_tonnes: null }),
        makeRow({ carbon_footprint_tonnes: 2.3 }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.total_carbon).toBe(3.8);
    });

    it("returns 0 when all carbon values are null", () => {
      const rows = [
        makeRow({ carbon_footprint_tonnes: null }),
        makeRow({ carbon_footprint_tonnes: null }),
      ];
      const m = computeEnergyEfficiencyMetrics(rows);
      expect(m.total_carbon).toBe(0);
    });

    it("handles single carbon value", () => {
      const m = computeEnergyEfficiencyMetrics([makeRow({ carbon_footprint_tonnes: 4.75 })]);
      expect(m.total_carbon).toBe(4.75);
    });
  });
});

// ── computeEnergyEfficiencyAlerts ───────────────────────────────────────

describe("computeEnergyEfficiencyAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeEnergyEfficiencyAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({ current_epc_valid: true, efficiency_rating: "b_rating", improvement_status: "in_progress", insulation_adequate: true, smart_meter_installed: true, children_involved_in_saving: true }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("epc_not_valid alert", () => {
    it("fires when EPC is not valid", () => {
      const rows = [makeRow({ current_epc_valid: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "epc_not_valid");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ current_epc_valid: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "epc_not_valid")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "epc-1", current_epc_valid: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "epc_not_valid")!;
      expect(alert.record_id).toBe("epc-1");
    });

    it("replaces underscores in energy area in message", () => {
      const rows = [makeRow({ current_epc_valid: false, energy_area: "windows_doors" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "epc_not_valid")!;
      expect(alert.message).toContain("windows doors");
    });

    it("does not fire when EPC is valid", () => {
      const rows = [makeRow({ current_epc_valid: true })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "epc_not_valid");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple invalid EPCs", () => {
      const rows = [
        makeRow({ current_epc_valid: false }),
        makeRow({ current_epc_valid: false }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const epcAlerts = alerts.filter((a) => a.type === "epc_not_valid");
      expect(epcAlerts).toHaveLength(2);
    });
  });

  describe("poor_rating_no_improvement alert", () => {
    it("fires when poor rating (e_rating) with deferred status", () => {
      const rows = [makeRow({ efficiency_rating: "e_rating", improvement_status: "deferred" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement");
      expect(alert).toBeDefined();
    });

    it("fires when poor rating (f_rating) with deferred status", () => {
      const rows = [makeRow({ efficiency_rating: "f_rating", improvement_status: "deferred" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement");
      expect(alert).toBeDefined();
    });

    it("fires when poor rating (g_rating) with deferred status", () => {
      const rows = [makeRow({ efficiency_rating: "g_rating", improvement_status: "deferred" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ efficiency_rating: "e_rating", improvement_status: "deferred" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "poor-1", efficiency_rating: "e_rating", improvement_status: "deferred" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement")!;
      expect(alert.record_id).toBe("poor-1");
    });

    it("does not fire when poor rating with identified status", () => {
      const rows = [makeRow({ efficiency_rating: "e_rating", improvement_status: "identified" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement");
      expect(alert).toBeUndefined();
    });

    it("does not fire when poor rating with costed status", () => {
      const rows = [makeRow({ efficiency_rating: "e_rating", improvement_status: "costed" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement");
      expect(alert).toBeUndefined();
    });

    it("does not fire when poor rating with approved status", () => {
      const rows = [makeRow({ efficiency_rating: "e_rating", improvement_status: "approved" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement");
      expect(alert).toBeUndefined();
    });

    it("does not fire when poor rating with in_progress status", () => {
      const rows = [makeRow({ efficiency_rating: "e_rating", improvement_status: "in_progress" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement");
      expect(alert).toBeUndefined();
    });

    it("does not fire when poor rating with completed status", () => {
      const rows = [makeRow({ efficiency_rating: "e_rating", improvement_status: "completed" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement");
      expect(alert).toBeUndefined();
    });

    it("does not fire for good rating with deferred status", () => {
      const rows = [makeRow({ efficiency_rating: "b_rating", improvement_status: "deferred" })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "poor_rating_no_improvement");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple poor + deferred", () => {
      const rows = [
        makeRow({ efficiency_rating: "e_rating", improvement_status: "deferred" }),
        makeRow({ efficiency_rating: "f_rating", improvement_status: "deferred" }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const poorAlerts = alerts.filter((a) => a.type === "poor_rating_no_improvement");
      expect(poorAlerts).toHaveLength(2);
    });
  });

  describe("insulation_inadequate_heating alert", () => {
    it("fires when heating area has inadequate insulation", () => {
      const rows = [makeRow({ energy_area: "heating", insulation_adequate: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "insulation_inadequate_heating");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ energy_area: "heating", insulation_adequate: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "insulation_inadequate_heating")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ins-1", energy_area: "heating", insulation_adequate: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "insulation_inadequate_heating")!;
      expect(alert.record_id).toBe("ins-1");
    });

    it("does not fire when insulation is adequate in heating area", () => {
      const rows = [makeRow({ energy_area: "heating", insulation_adequate: true })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "insulation_inadequate_heating");
      expect(alert).toBeUndefined();
    });

    it("does not fire when insulation is inadequate in non-heating area", () => {
      const rows = [makeRow({ energy_area: "lighting", insulation_adequate: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "insulation_inadequate_heating");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple heating + inadequate insulation", () => {
      const rows = [
        makeRow({ energy_area: "heating", insulation_adequate: false }),
        makeRow({ energy_area: "heating", insulation_adequate: false }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const insAlerts = alerts.filter((a) => a.type === "insulation_inadequate_heating");
      expect(insAlerts).toHaveLength(2);
    });
  });

  describe("smart_meter_not_installed alert", () => {
    it("fires when at least 1 assessment lacks smart meter", () => {
      const rows = [makeRow({ smart_meter_installed: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "smart_meter_not_installed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ smart_meter_installed: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "smart_meter_not_installed")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes count in message (singular)", () => {
      const rows = [makeRow({ smart_meter_installed: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "smart_meter_not_installed")!;
      expect(alert.message).toContain("1 assessment");
    });

    it("includes count in message (plural)", () => {
      const rows = [
        makeRow({ smart_meter_installed: false }),
        makeRow({ smart_meter_installed: false }),
        makeRow({ smart_meter_installed: false }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "smart_meter_not_installed")!;
      expect(alert.message).toContain("3 assessments");
    });

    it("does not fire when all have smart meters", () => {
      const rows = [makeRow({ smart_meter_installed: true }), makeRow({ smart_meter_installed: true })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "smart_meter_not_installed");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ smart_meter_installed: false }),
        makeRow({ smart_meter_installed: false }),
        makeRow({ smart_meter_installed: false }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const smartAlerts = alerts.filter((a) => a.type === "smart_meter_not_installed");
      expect(smartAlerts).toHaveLength(1);
    });
  });

  describe("children_not_involved alert", () => {
    it("fires when at least 1 assessment lacks children involvement", () => {
      const rows = [makeRow({ children_involved_in_saving: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_involved");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ children_involved_in_saving: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_involved")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes count in message (singular)", () => {
      const rows = [makeRow({ children_involved_in_saving: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_involved")!;
      expect(alert.message).toContain("1 assessment");
    });

    it("includes count in message (plural)", () => {
      const rows = [
        makeRow({ children_involved_in_saving: false }),
        makeRow({ children_involved_in_saving: false }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_involved")!;
      expect(alert.message).toContain("2 assessments");
    });

    it("does not fire when all involve children", () => {
      const rows = [makeRow({ children_involved_in_saving: true }), makeRow({ children_involved_in_saving: true })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const alert = alerts.find((a) => a.type === "children_not_involved");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ children_involved_in_saving: false }),
        makeRow({ children_involved_in_saving: false }),
        makeRow({ children_involved_in_saving: false }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const childAlerts = alerts.filter((a) => a.type === "children_not_involved");
      expect(childAlerts).toHaveLength(1);
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const rows = [
        makeRow({ current_epc_valid: false, efficiency_rating: "e_rating", improvement_status: "deferred", energy_area: "heating", insulation_adequate: false, smart_meter_installed: false, children_involved_in_saving: false }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("epc_not_valid");
      expect(types).toContain("poor_rating_no_improvement");
      expect(types).toContain("insulation_inadequate_heating");
      expect(types).toContain("smart_meter_not_installed");
      expect(types).toContain("children_not_involved");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ current_epc_valid: false, efficiency_rating: "e_rating", improvement_status: "deferred" }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ current_epc_valid: false, efficiency_rating: "e_rating", improvement_status: "deferred", energy_area: "heating", insulation_adequate: false, smart_meter_installed: false, children_involved_in_saving: false }),
      ];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ current_epc_valid: false })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateEnergyEfficiencyCaraInsights ─────────────────────────────────

describe("generateEnergyEfficiencyCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const insights = generateEnergyEfficiencyCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [orange]", () => {
    const insights = generateEnergyEfficiencyCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[orange\]/);
  });

  it("first insight includes total_assessments count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes epc_valid_rate", () => {
    const rows = [makeRow({ current_epc_valid: true }), makeRow({ current_epc_valid: false })];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes smart_meter_rate", () => {
    const rows = [makeRow({ smart_meter_installed: true }), makeRow({ smart_meter_installed: false })];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[0]).toContain("50%");
  });

  it("second insight starts with [amber]", () => {
    const insights = generateEnergyEfficiencyCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ current_epc_valid: false, energy_area: "heating", insulation_adequate: false }),
    ];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ current_epc_valid: true, efficiency_rating: "b_rating", improvement_status: "in_progress", insulation_adequate: true, smart_meter_installed: true, children_involved_in_saving: true })];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("second insight includes monthly cost", () => {
    const rows = [
      makeRow({ current_epc_valid: false, monthly_cost_estimate: 150.50 }),
    ];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[1]).toContain("150.50");
  });

  it("third insight starts with [reflect]", () => {
    const insights = generateEnergyEfficiencyCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions poor when some have poor ratings", () => {
    const rows = [makeRow({ efficiency_rating: "e_rating" })];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[2]).toContain("poor");
  });

  it("third insight asks about children involvement when no poor but not all involve children", () => {
    const rows = [
      makeRow({ efficiency_rating: "b_rating", children_involved_in_saving: false }),
      makeRow({ efficiency_rating: "b_rating", children_involved_in_saving: true }),
    ];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[2]).toContain("Children are involved");
  });

  it("third insight celebrates when all involve children and no poor ratings", () => {
    const rows = [
      makeRow({ efficiency_rating: "b_rating", children_involved_in_saving: true }),
      makeRow({ efficiency_rating: "b_rating", children_involved_in_saving: true }),
    ];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[2]).toContain("involve children in energy saving and no poor");
  });

  it("uses singular assessor wording when unique_assessors is 1", () => {
    const rows = [makeRow({ assessor_name: "Staff A" })];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[0]).toContain("1 assessor");
  });

  it("uses plural assessors wording when unique_assessors > 1", () => {
    const rows = [
      makeRow({ assessor_name: "Staff A" }),
      makeRow({ assessor_name: "Staff B" }),
    ];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[0]).toContain("2 assessors");
  });

  it("all insights are non-empty strings", () => {
    const insights = generateEnergyEfficiencyCaraInsights([makeRow()]);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("uses singular assessment wording when 1 poor", () => {
    const rows = [makeRow({ efficiency_rating: "e_rating" })];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[2]).toContain("assessment has");
  });

  it("uses plural assessments wording when multiple poor", () => {
    const rows = [
      makeRow({ efficiency_rating: "e_rating" }),
      makeRow({ efficiency_rating: "f_rating" }),
    ];
    const insights = generateEnergyEfficiencyCaraInsights(rows);
    expect(insights[2]).toContain("assessments have");
  });
});

// ── Enum completeness ───────────────────────────────────────────────────

describe("enum arrays", () => {
  it("ENERGY_AREAS has 8 entries", () => {
    expect(ENERGY_AREAS).toHaveLength(8);
  });

  it("EFFICIENCY_RATINGS has 8 entries", () => {
    expect(EFFICIENCY_RATINGS).toHaveLength(8);
  });

  it("IMPROVEMENT_STATUSES has 6 entries", () => {
    expect(IMPROVEMENT_STATUSES).toHaveLength(6);
  });

  it("ASSESSMENT_TYPES has 6 entries", () => {
    expect(ASSESSMENT_TYPES).toHaveLength(6);
  });

  it("ENERGY_AREAS contains expected values", () => {
    expect(ENERGY_AREAS).toContain("heating");
    expect(ENERGY_AREAS).toContain("lighting");
    expect(ENERGY_AREAS).toContain("insulation");
    expect(ENERGY_AREAS).toContain("windows_doors");
    expect(ENERGY_AREAS).toContain("water_heating");
    expect(ENERGY_AREAS).toContain("appliances");
    expect(ENERGY_AREAS).toContain("renewable_energy");
    expect(ENERGY_AREAS).toContain("ventilation");
  });

  it("EFFICIENCY_RATINGS contains expected values", () => {
    expect(EFFICIENCY_RATINGS).toContain("a_rating");
    expect(EFFICIENCY_RATINGS).toContain("b_rating");
    expect(EFFICIENCY_RATINGS).toContain("c_rating");
    expect(EFFICIENCY_RATINGS).toContain("d_rating");
    expect(EFFICIENCY_RATINGS).toContain("e_rating");
    expect(EFFICIENCY_RATINGS).toContain("f_rating");
    expect(EFFICIENCY_RATINGS).toContain("g_rating");
    expect(EFFICIENCY_RATINGS).toContain("not_assessed");
  });

  it("IMPROVEMENT_STATUSES contains expected values", () => {
    expect(IMPROVEMENT_STATUSES).toContain("identified");
    expect(IMPROVEMENT_STATUSES).toContain("costed");
    expect(IMPROVEMENT_STATUSES).toContain("approved");
    expect(IMPROVEMENT_STATUSES).toContain("in_progress");
    expect(IMPROVEMENT_STATUSES).toContain("completed");
    expect(IMPROVEMENT_STATUSES).toContain("deferred");
  });

  it("ASSESSMENT_TYPES contains expected values", () => {
    expect(ASSESSMENT_TYPES).toContain("epc_assessment");
    expect(ASSESSMENT_TYPES).toContain("utility_audit");
    expect(ASSESSMENT_TYPES).toContain("carbon_review");
    expect(ASSESSMENT_TYPES).toContain("cost_analysis");
    expect(ASSESSMENT_TYPES).toContain("improvement_check");
    expect(ASSESSMENT_TYPES).toContain("annual_review");
  });
});
