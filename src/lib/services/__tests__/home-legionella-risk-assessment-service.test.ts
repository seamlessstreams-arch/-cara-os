// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LEGIONELLA RISK ASSESSMENT SERVICE TESTS
// Pure-function tests for legionella risk metrics, alert identification,
// Cara insight generation, constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  WATER_SYSTEM_TYPES,
  RISK_LEVELS,
  LEGIONELLA_TEST_RESULTS,
  COMPLIANCE_STATUSES,
  _testing,
} from "../home-legionella-risk-assessment-service";

import type {
  HomeLegionellaRiskAssessmentRow,
  WaterSystemType,
  RiskLevel,
  LegionellaTestResult,
  ComplianceStatus,
} from "../home-legionella-risk-assessment-service";

const {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<HomeLegionellaRiskAssessmentRow>,
): HomeLegionellaRiskAssessmentRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : crypto.randomUUID(),
    assessment_date: "assessment_date" in (overrides ?? {}) ? overrides!.assessment_date! : now.toISOString().split("T")[0],
    assessor_name: "assessor_name" in (overrides ?? {}) ? overrides!.assessor_name! : "D. Laville",
    water_system_type: "water_system_type" in (overrides ?? {}) ? overrides!.water_system_type! : "Hot Water",
    risk_level: "risk_level" in (overrides ?? {}) ? overrides!.risk_level! : "Low",
    temperature_compliant: "temperature_compliant" in (overrides ?? {}) ? overrides!.temperature_compliant! : true,
    hot_water_temp_celsius: "hot_water_temp_celsius" in (overrides ?? {}) ? (overrides!.hot_water_temp_celsius ?? null) : null,
    cold_water_temp_celsius: "cold_water_temp_celsius" in (overrides ?? {}) ? (overrides!.cold_water_temp_celsius ?? null) : null,
    flushing_regime_compliant: "flushing_regime_compliant" in (overrides ?? {}) ? overrides!.flushing_regime_compliant! : true,
    water_treatment_in_place: "water_treatment_in_place" in (overrides ?? {}) ? overrides!.water_treatment_in_place! : true,
    legionella_test_completed: "legionella_test_completed" in (overrides ?? {}) ? overrides!.legionella_test_completed! : true,
    legionella_test_result: "legionella_test_result" in (overrides ?? {}) ? (overrides!.legionella_test_result ?? null) : "Negative",
    remedial_action_required: "remedial_action_required" in (overrides ?? {}) ? overrides!.remedial_action_required! : false,
    remedial_action_details: "remedial_action_details" in (overrides ?? {}) ? (overrides!.remedial_action_details ?? null) : null,
    next_assessment_date: "next_assessment_date" in (overrides ?? {}) ? (overrides!.next_assessment_date ?? null) : null,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Compliant",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── Enum completeness ───────────────────────────────────────────────────

describe("enum arrays", () => {
  it("WATER_SYSTEM_TYPES has 7 entries", () => {
    expect(WATER_SYSTEM_TYPES).toHaveLength(7);
  });

  it("WATER_SYSTEM_TYPES contains expected values", () => {
    expect(WATER_SYSTEM_TYPES).toContain("Hot Water");
    expect(WATER_SYSTEM_TYPES).toContain("Cold Water");
    expect(WATER_SYSTEM_TYPES).toContain("Cooling Tower");
    expect(WATER_SYSTEM_TYPES).toContain("Spa/Pool");
    expect(WATER_SYSTEM_TYPES).toContain("Shower");
    expect(WATER_SYSTEM_TYPES).toContain("Dead Leg");
    expect(WATER_SYSTEM_TYPES).toContain("Other");
  });

  it("RISK_LEVELS has 5 entries", () => {
    expect(RISK_LEVELS).toHaveLength(5);
  });

  it("RISK_LEVELS contains expected values", () => {
    expect(RISK_LEVELS).toContain("Low");
    expect(RISK_LEVELS).toContain("Medium");
    expect(RISK_LEVELS).toContain("Significant");
    expect(RISK_LEVELS).toContain("High");
    expect(RISK_LEVELS).toContain("Intolerable");
  });

  it("LEGIONELLA_TEST_RESULTS has 4 entries", () => {
    expect(LEGIONELLA_TEST_RESULTS).toHaveLength(4);
  });

  it("LEGIONELLA_TEST_RESULTS contains expected values", () => {
    expect(LEGIONELLA_TEST_RESULTS).toContain("Negative");
    expect(LEGIONELLA_TEST_RESULTS).toContain("Low Count");
    expect(LEGIONELLA_TEST_RESULTS).toContain("Action Level");
    expect(LEGIONELLA_TEST_RESULTS).toContain("Immediate Action");
  });

  it("COMPLIANCE_STATUSES has 4 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(4);
  });

  it("COMPLIANCE_STATUSES contains expected values", () => {
    expect(COMPLIANCE_STATUSES).toContain("Compliant");
    expect(COMPLIANCE_STATUSES).toContain("Minor Non-Compliance");
    expect(COMPLIANCE_STATUSES).toContain("Major Non-Compliance");
    expect(COMPLIANCE_STATUSES).toContain("Critical Non-Compliance");
  });
});

// ── computeMetrics ──────────────────────────────────────────────────────

describe("computeMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_assessments", () => {
      const m = computeMetrics([]);
      expect(m.total_assessments).toBe(0);
    });

    it("returns zero high_risk_count", () => {
      const m = computeMetrics([]);
      expect(m.high_risk_count).toBe(0);
    });

    it("returns zero intolerable_count", () => {
      const m = computeMetrics([]);
      expect(m.intolerable_count).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero temperature_compliance_rate", () => {
      const m = computeMetrics([]);
      expect(m.temperature_compliance_rate).toBe(0);
    });

    it("returns zero flushing_compliance_rate", () => {
      const m = computeMetrics([]);
      expect(m.flushing_compliance_rate).toBe(0);
    });

    it("returns zero water_treatment_rate", () => {
      const m = computeMetrics([]);
      expect(m.water_treatment_rate).toBe(0);
    });

    it("returns zero legionella_test_rate", () => {
      const m = computeMetrics([]);
      expect(m.legionella_test_rate).toBe(0);
    });

    it("returns zero remedial_action_count", () => {
      const m = computeMetrics([]);
      expect(m.remedial_action_count).toBe(0);
    });

    it("returns zero negative_test_rate", () => {
      const m = computeMetrics([]);
      expect(m.negative_test_rate).toBe(0);
    });

    it("returns zero unique_assessors", () => {
      const m = computeMetrics([]);
      expect(m.unique_assessors).toBe(0);
    });

    it("returns empty risk_breakdown", () => {
      const m = computeMetrics([]);
      expect(m.risk_breakdown).toEqual({});
    });

    it("returns empty system_type_breakdown", () => {
      const m = computeMetrics([]);
      expect(m.system_type_breakdown).toEqual({});
    });

    it("returns empty compliance_breakdown", () => {
      const m = computeMetrics([]);
      expect(m.compliance_breakdown).toEqual({});
    });
  });

  describe("single compliant row", () => {
    const row = makeRow({
      risk_level: "Low",
      compliance_status: "Compliant",
      water_system_type: "Hot Water",
      assessor_name: "D. Laville",
      temperature_compliant: true,
      flushing_regime_compliant: true,
      water_treatment_in_place: true,
      legionella_test_completed: true,
      legionella_test_result: "Negative",
      remedial_action_required: false,
    });

    it("returns total_assessments = 1", () => {
      const m = computeMetrics([row]);
      expect(m.total_assessments).toBe(1);
    });

    it("returns high_risk_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.high_risk_count).toBe(0);
    });

    it("returns intolerable_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.intolerable_count).toBe(0);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns temperature_compliance_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.temperature_compliance_rate).toBe(100);
    });

    it("returns flushing_compliance_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.flushing_compliance_rate).toBe(100);
    });

    it("returns water_treatment_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.water_treatment_rate).toBe(100);
    });

    it("returns legionella_test_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.legionella_test_rate).toBe(100);
    });

    it("returns remedial_action_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.remedial_action_count).toBe(0);
    });

    it("returns negative_test_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.negative_test_rate).toBe(100);
    });

    it("returns unique_assessors = 1", () => {
      const m = computeMetrics([row]);
      expect(m.unique_assessors).toBe(1);
    });

    it("returns risk_breakdown with single entry", () => {
      const m = computeMetrics([row]);
      expect(m.risk_breakdown).toEqual({ Low: 1 });
    });

    it("returns system_type_breakdown with single entry", () => {
      const m = computeMetrics([row]);
      expect(m.system_type_breakdown).toEqual({ "Hot Water": 1 });
    });

    it("returns compliance_breakdown with single entry", () => {
      const m = computeMetrics([row]);
      expect(m.compliance_breakdown).toEqual({ Compliant: 1 });
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ risk_level: "Low", compliance_status: "Compliant", water_system_type: "Hot Water", assessor_name: "Staff A", temperature_compliant: true, flushing_regime_compliant: true, water_treatment_in_place: true, legionella_test_completed: true, legionella_test_result: "Negative", remedial_action_required: false }),
      makeRow({ risk_level: "High", compliance_status: "Major Non-Compliance", water_system_type: "Cold Water", assessor_name: "Staff B", temperature_compliant: false, flushing_regime_compliant: false, water_treatment_in_place: false, legionella_test_completed: false, legionella_test_result: null, remedial_action_required: true }),
      makeRow({ risk_level: "Intolerable", compliance_status: "Critical Non-Compliance", water_system_type: "Shower", assessor_name: "Staff C", temperature_compliant: true, flushing_regime_compliant: false, water_treatment_in_place: true, legionella_test_completed: true, legionella_test_result: "Immediate Action", remedial_action_required: true }),
    ];

    it("returns total_assessments = 3", () => {
      const m = computeMetrics(rows);
      expect(m.total_assessments).toBe(3);
    });

    it("returns high_risk_count = 1", () => {
      const m = computeMetrics(rows);
      expect(m.high_risk_count).toBe(1);
    });

    it("returns intolerable_count = 1", () => {
      const m = computeMetrics(rows);
      expect(m.intolerable_count).toBe(1);
    });

    it("returns non_compliant_count = 2", () => {
      const m = computeMetrics(rows);
      expect(m.non_compliant_count).toBe(2);
    });

    it("calculates temperature_compliance_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMetrics(rows);
      expect(m.temperature_compliance_rate).toBe(66.7);
    });

    it("calculates flushing_compliance_rate correctly (1/3 = 33.3%)", () => {
      const m = computeMetrics(rows);
      expect(m.flushing_compliance_rate).toBe(33.3);
    });

    it("calculates water_treatment_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMetrics(rows);
      expect(m.water_treatment_rate).toBe(66.7);
    });

    it("calculates legionella_test_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMetrics(rows);
      expect(m.legionella_test_rate).toBe(66.7);
    });

    it("returns remedial_action_count = 2", () => {
      const m = computeMetrics(rows);
      expect(m.remedial_action_count).toBe(2);
    });

    it("calculates negative_test_rate correctly (1/2 tested = 50%)", () => {
      const m = computeMetrics(rows);
      expect(m.negative_test_rate).toBe(50);
    });

    it("returns unique_assessors = 3", () => {
      const m = computeMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });

    it("groups risk_breakdown correctly", () => {
      const m = computeMetrics(rows);
      expect(m.risk_breakdown).toEqual({ Low: 1, High: 1, Intolerable: 1 });
    });

    it("groups system_type_breakdown correctly", () => {
      const m = computeMetrics(rows);
      expect(m.system_type_breakdown).toEqual({ "Hot Water": 1, "Cold Water": 1, Shower: 1 });
    });

    it("groups compliance_breakdown correctly", () => {
      const m = computeMetrics(rows);
      expect(m.compliance_breakdown).toEqual({ Compliant: 1, "Major Non-Compliance": 1, "Critical Non-Compliance": 1 });
    });
  });

  describe("high_risk_count", () => {
    it("counts only High risk_level", () => {
      const rows = [
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Intolerable" }),
      ];
      const m = computeMetrics(rows);
      expect(m.high_risk_count).toBe(2);
    });

    it("does not count Low as High", () => {
      const m = computeMetrics([makeRow({ risk_level: "Low" })]);
      expect(m.high_risk_count).toBe(0);
    });

    it("does not count Medium as High", () => {
      const m = computeMetrics([makeRow({ risk_level: "Medium" })]);
      expect(m.high_risk_count).toBe(0);
    });

    it("does not count Significant as High", () => {
      const m = computeMetrics([makeRow({ risk_level: "Significant" })]);
      expect(m.high_risk_count).toBe(0);
    });

    it("does not count Intolerable as High", () => {
      const m = computeMetrics([makeRow({ risk_level: "Intolerable" })]);
      expect(m.high_risk_count).toBe(0);
    });
  });

  describe("intolerable_count", () => {
    it("counts only Intolerable risk_level", () => {
      const rows = [
        makeRow({ risk_level: "Intolerable" }),
        makeRow({ risk_level: "Intolerable" }),
        makeRow({ risk_level: "High" }),
      ];
      const m = computeMetrics(rows);
      expect(m.intolerable_count).toBe(2);
    });

    it("does not count High as Intolerable", () => {
      const m = computeMetrics([makeRow({ risk_level: "High" })]);
      expect(m.intolerable_count).toBe(0);
    });

    it("does not count Low as Intolerable", () => {
      const m = computeMetrics([makeRow({ risk_level: "Low" })]);
      expect(m.intolerable_count).toBe(0);
    });

    it("does not count Medium as Intolerable", () => {
      const m = computeMetrics([makeRow({ risk_level: "Medium" })]);
      expect(m.intolerable_count).toBe(0);
    });

    it("does not count Significant as Intolerable", () => {
      const m = computeMetrics([makeRow({ risk_level: "Significant" })]);
      expect(m.intolerable_count).toBe(0);
    });
  });

  describe("non_compliant_count", () => {
    it("counts all non-Compliant statuses", () => {
      const rows = [
        makeRow({ compliance_status: "Minor Non-Compliance" }),
        makeRow({ compliance_status: "Major Non-Compliance" }),
        makeRow({ compliance_status: "Critical Non-Compliance" }),
      ];
      const m = computeMetrics(rows);
      expect(m.non_compliant_count).toBe(3);
    });

    it("does not count Compliant", () => {
      const m = computeMetrics([makeRow({ compliance_status: "Compliant" })]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("counts Minor Non-Compliance", () => {
      const m = computeMetrics([makeRow({ compliance_status: "Minor Non-Compliance" })]);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts Major Non-Compliance", () => {
      const m = computeMetrics([makeRow({ compliance_status: "Major Non-Compliance" })]);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts Critical Non-Compliance", () => {
      const m = computeMetrics([makeRow({ compliance_status: "Critical Non-Compliance" })]);
      expect(m.non_compliant_count).toBe(1);
    });
  });

  describe("percentage calculations with known values", () => {
    it("returns 0 when all booleans false for single row", () => {
      const row = makeRow({
        temperature_compliant: false,
        flushing_regime_compliant: false,
        water_treatment_in_place: false,
        legionella_test_completed: false,
      });
      const m = computeMetrics([row]);
      expect(m.temperature_compliance_rate).toBe(0);
      expect(m.flushing_compliance_rate).toBe(0);
      expect(m.water_treatment_rate).toBe(0);
      expect(m.legionella_test_rate).toBe(0);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ temperature_compliant: true }),
        makeRow({ temperature_compliant: false }),
        makeRow({ temperature_compliant: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.temperature_compliance_rate).toBe(33.3);
    });

    it("mixed boolean rate (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ flushing_regime_compliant: true }),
        makeRow({ flushing_regime_compliant: true }),
        makeRow({ flushing_regime_compliant: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.flushing_compliance_rate).toBe(66.7);
    });

    it("50% rate for half true", () => {
      const rows = [
        makeRow({ water_treatment_in_place: true }),
        makeRow({ water_treatment_in_place: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.water_treatment_rate).toBe(50);
    });

    it("100% rate when all true", () => {
      const rows = [
        makeRow({ legionella_test_completed: true }),
        makeRow({ legionella_test_completed: true }),
      ];
      const m = computeMetrics(rows);
      expect(m.legionella_test_rate).toBe(100);
    });

    it("0% rate when all false", () => {
      const rows = [
        makeRow({ legionella_test_completed: false }),
        makeRow({ legionella_test_completed: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.legionella_test_rate).toBe(0);
    });

    it("25% rate (1/4)", () => {
      const rows = [
        makeRow({ temperature_compliant: true }),
        makeRow({ temperature_compliant: false }),
        makeRow({ temperature_compliant: false }),
        makeRow({ temperature_compliant: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.temperature_compliance_rate).toBe(25);
    });

    it("75% rate (3/4)", () => {
      const rows = [
        makeRow({ temperature_compliant: true }),
        makeRow({ temperature_compliant: true }),
        makeRow({ temperature_compliant: true }),
        makeRow({ temperature_compliant: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.temperature_compliance_rate).toBe(75);
    });
  });

  describe("negative_test_rate", () => {
    it("returns 100 when all tested rows are Negative", () => {
      const rows = [
        makeRow({ legionella_test_completed: true, legionella_test_result: "Negative" }),
        makeRow({ legionella_test_completed: true, legionella_test_result: "Negative" }),
      ];
      const m = computeMetrics(rows);
      expect(m.negative_test_rate).toBe(100);
    });

    it("returns 0 when no tested rows are Negative", () => {
      const rows = [
        makeRow({ legionella_test_completed: true, legionella_test_result: "Low Count" }),
        makeRow({ legionella_test_completed: true, legionella_test_result: "Action Level" }),
      ];
      const m = computeMetrics(rows);
      expect(m.negative_test_rate).toBe(0);
    });

    it("excludes untested rows from denominator", () => {
      const rows = [
        makeRow({ legionella_test_completed: true, legionella_test_result: "Negative" }),
        makeRow({ legionella_test_completed: false, legionella_test_result: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.negative_test_rate).toBe(100);
    });

    it("returns 0 when no tests completed", () => {
      const rows = [
        makeRow({ legionella_test_completed: false }),
        makeRow({ legionella_test_completed: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.negative_test_rate).toBe(0);
    });

    it("calculates 50% for mixed results", () => {
      const rows = [
        makeRow({ legionella_test_completed: true, legionella_test_result: "Negative" }),
        makeRow({ legionella_test_completed: true, legionella_test_result: "Low Count" }),
      ];
      const m = computeMetrics(rows);
      expect(m.negative_test_rate).toBe(50);
    });

    it("calculates correctly with Immediate Action result", () => {
      const rows = [
        makeRow({ legionella_test_completed: true, legionella_test_result: "Negative" }),
        makeRow({ legionella_test_completed: true, legionella_test_result: "Immediate Action" }),
        makeRow({ legionella_test_completed: true, legionella_test_result: "Negative" }),
      ];
      const m = computeMetrics(rows);
      expect(m.negative_test_rate).toBe(66.7);
    });
  });

  describe("remedial_action_count", () => {
    it("counts rows with remedial_action_required true", () => {
      const rows = [
        makeRow({ remedial_action_required: true }),
        makeRow({ remedial_action_required: true }),
        makeRow({ remedial_action_required: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.remedial_action_count).toBe(2);
    });

    it("returns 0 when none required", () => {
      const rows = [
        makeRow({ remedial_action_required: false }),
        makeRow({ remedial_action_required: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.remedial_action_count).toBe(0);
    });

    it("counts all when all required", () => {
      const rows = [
        makeRow({ remedial_action_required: true }),
        makeRow({ remedial_action_required: true }),
      ];
      const m = computeMetrics(rows);
      expect(m.remedial_action_count).toBe(2);
    });
  });

  describe("risk_breakdown", () => {
    it("counts duplicate risk levels", () => {
      const rows = [
        makeRow({ risk_level: "Low" }),
        makeRow({ risk_level: "Low" }),
        makeRow({ risk_level: "High" }),
      ];
      const m = computeMetrics(rows);
      expect(m.risk_breakdown).toEqual({ Low: 2, High: 1 });
    });

    it("handles all 5 risk levels", () => {
      const rows = RISK_LEVELS.map((r) => makeRow({ risk_level: r }));
      const m = computeMetrics(rows);
      for (const r of RISK_LEVELS) {
        expect(m.risk_breakdown[r]).toBe(1);
      }
    });
  });

  describe("system_type_breakdown", () => {
    it("counts duplicate system types", () => {
      const rows = [
        makeRow({ water_system_type: "Hot Water" }),
        makeRow({ water_system_type: "Hot Water" }),
        makeRow({ water_system_type: "Cold Water" }),
      ];
      const m = computeMetrics(rows);
      expect(m.system_type_breakdown).toEqual({ "Hot Water": 2, "Cold Water": 1 });
    });

    it("handles all 7 water system types", () => {
      const rows = WATER_SYSTEM_TYPES.map((t) => makeRow({ water_system_type: t }));
      const m = computeMetrics(rows);
      for (const t of WATER_SYSTEM_TYPES) {
        expect(m.system_type_breakdown[t]).toBe(1);
      }
    });

    it("tracks Spa/Pool type correctly", () => {
      const rows = [makeRow({ water_system_type: "Spa/Pool" })];
      const m = computeMetrics(rows);
      expect(m.system_type_breakdown["Spa/Pool"]).toBe(1);
    });

    it("tracks Dead Leg type correctly", () => {
      const rows = [makeRow({ water_system_type: "Dead Leg" })];
      const m = computeMetrics(rows);
      expect(m.system_type_breakdown["Dead Leg"]).toBe(1);
    });
  });

  describe("compliance_breakdown", () => {
    it("counts duplicate compliance statuses", () => {
      const rows = [
        makeRow({ compliance_status: "Compliant" }),
        makeRow({ compliance_status: "Compliant" }),
        makeRow({ compliance_status: "Minor Non-Compliance" }),
      ];
      const m = computeMetrics(rows);
      expect(m.compliance_breakdown).toEqual({ Compliant: 2, "Minor Non-Compliance": 1 });
    });

    it("handles all 4 compliance statuses", () => {
      const rows = COMPLIANCE_STATUSES.map((s) => makeRow({ compliance_status: s }));
      const m = computeMetrics(rows);
      for (const s of COMPLIANCE_STATUSES) {
        expect(m.compliance_breakdown[s]).toBe(1);
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
      const m = computeMetrics(rows);
      expect(m.unique_assessors).toBe(2);
    });

    it("returns 1 when all rows have the same assessor", () => {
      const rows = [
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
      ];
      const m = computeMetrics(rows);
      expect(m.unique_assessors).toBe(1);
    });

    it("counts each unique assessor name", () => {
      const rows = [
        makeRow({ assessor_name: "Alice" }),
        makeRow({ assessor_name: "Bob" }),
        makeRow({ assessor_name: "Charlie" }),
        makeRow({ assessor_name: "Alice" }),
      ];
      const m = computeMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });
});

// ── computeAlerts ──────────────────────────────────────────────────────

describe("computeAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({
          risk_level: "Low",
          compliance_status: "Compliant",
          temperature_compliant: true,
          flushing_regime_compliant: true,
          legionella_test_result: "Negative",
          remedial_action_required: false,
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts).toEqual([]);
    });

    it("returns empty array for Medium risk with no other issues", () => {
      const rows = [
        makeRow({
          risk_level: "Medium",
          temperature_compliant: true,
          flushing_regime_compliant: true,
          legionella_test_result: "Negative",
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts).toEqual([]);
    });

    it("returns empty array for Significant risk with no other issues", () => {
      const rows = [
        makeRow({
          risk_level: "Significant",
          temperature_compliant: true,
          flushing_regime_compliant: true,
          legionella_test_result: "Negative",
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("immediate_action_test_result alert", () => {
    it("fires for Immediate Action test result", () => {
      const rows = [makeRow({ legionella_test_result: "Immediate Action" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "immediate_action_test_result");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ legionella_test_result: "Immediate Action" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "immediate_action_test_result")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ia-1", legionella_test_result: "Immediate Action" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "immediate_action_test_result")!;
      expect(alert.record_id).toBe("ia-1");
    });

    it("includes water_system_type in message", () => {
      const rows = [makeRow({ legionella_test_result: "Immediate Action", water_system_type: "Hot Water" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "immediate_action_test_result")!;
      expect(alert.message).toContain("Hot Water");
    });

    it("includes assessment_date in message", () => {
      const rows = [makeRow({ legionella_test_result: "Immediate Action", assessment_date: "2026-05-01" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "immediate_action_test_result")!;
      expect(alert.message).toContain("2026-05-01");
    });

    it("message contains ACOP L8", () => {
      const rows = [makeRow({ legionella_test_result: "Immediate Action" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "immediate_action_test_result")!;
      expect(alert.message).toContain("ACOP L8");
    });

    it("does not fire for Negative result", () => {
      const rows = [makeRow({ legionella_test_result: "Negative" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "immediate_action_test_result");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Low Count result", () => {
      const rows = [makeRow({ legionella_test_result: "Low Count" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "immediate_action_test_result");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Action Level result", () => {
      const rows = [makeRow({ legionella_test_result: "Action Level" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "immediate_action_test_result");
      expect(alert).toBeUndefined();
    });

    it("does not fire for null result", () => {
      const rows = [makeRow({ legionella_test_result: null })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "immediate_action_test_result");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Immediate Action results", () => {
      const rows = [
        makeRow({ legionella_test_result: "Immediate Action" }),
        makeRow({ legionella_test_result: "Immediate Action" }),
      ];
      const alerts = computeAlerts(rows);
      const iaAlerts = alerts.filter((a) => a.type === "immediate_action_test_result");
      expect(iaAlerts).toHaveLength(2);
    });
  });

  describe("intolerable_risk alert", () => {
    it("fires for Intolerable risk level", () => {
      const rows = [makeRow({ risk_level: "Intolerable" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ risk_level: "Intolerable" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "int-1", risk_level: "Intolerable" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk")!;
      expect(alert.record_id).toBe("int-1");
    });

    it("includes water_system_type in message", () => {
      const rows = [makeRow({ risk_level: "Intolerable", water_system_type: "Cooling Tower" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk")!;
      expect(alert.message).toContain("Cooling Tower");
    });

    it("includes assessment_date in message", () => {
      const rows = [makeRow({ risk_level: "Intolerable", assessment_date: "2026-03-15" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("message contains ACOP L8", () => {
      const rows = [makeRow({ risk_level: "Intolerable" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk")!;
      expect(alert.message).toContain("ACOP L8");
    });

    it("does not fire for High risk", () => {
      const rows = [makeRow({ risk_level: "High" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Low risk", () => {
      const rows = [makeRow({ risk_level: "Low" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Medium risk", () => {
      const rows = [makeRow({ risk_level: "Medium" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Significant risk", () => {
      const rows = [makeRow({ risk_level: "Significant" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple intolerable", () => {
      const rows = [
        makeRow({ risk_level: "Intolerable" }),
        makeRow({ risk_level: "Intolerable" }),
      ];
      const alerts = computeAlerts(rows);
      const intAlerts = alerts.filter((a) => a.type === "intolerable_risk");
      expect(intAlerts).toHaveLength(2);
    });
  });

  describe("high_risk_no_remedial alert", () => {
    it("fires for High risk without remedial action", () => {
      const rows = [makeRow({ risk_level: "High", remedial_action_required: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ risk_level: "High", remedial_action_required: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "hr-1", risk_level: "High", remedial_action_required: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial")!;
      expect(alert.record_id).toBe("hr-1");
    });

    it("includes water_system_type in message", () => {
      const rows = [makeRow({ risk_level: "High", remedial_action_required: false, water_system_type: "Dead Leg" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial")!;
      expect(alert.message).toContain("Dead Leg");
    });

    it("includes assessment_date in message", () => {
      const rows = [makeRow({ risk_level: "High", remedial_action_required: false, assessment_date: "2026-04-20" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("does not fire when High risk has remedial action", () => {
      const rows = [makeRow({ risk_level: "High", remedial_action_required: true })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Low risk without remedial", () => {
      const rows = [makeRow({ risk_level: "Low", remedial_action_required: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Medium risk without remedial", () => {
      const rows = [makeRow({ risk_level: "Medium", remedial_action_required: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Significant risk without remedial", () => {
      const rows = [makeRow({ risk_level: "Significant", remedial_action_required: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Intolerable risk without remedial", () => {
      const rows = [makeRow({ risk_level: "Intolerable", remedial_action_required: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple High risk without remedial", () => {
      const rows = [
        makeRow({ risk_level: "High", remedial_action_required: false }),
        makeRow({ risk_level: "High", remedial_action_required: false }),
        makeRow({ risk_level: "High", remedial_action_required: true }),
      ];
      const alerts = computeAlerts(rows);
      const hrAlerts = alerts.filter((a) => a.type === "high_risk_no_remedial");
      expect(hrAlerts).toHaveLength(2);
    });
  });

  describe("temperature_non_compliant alert", () => {
    it("fires when temperature not compliant", () => {
      const rows = [makeRow({ temperature_compliant: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "temperature_non_compliant");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ temperature_compliant: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "temperature_non_compliant")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "temp-1", temperature_compliant: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "temperature_non_compliant")!;
      expect(alert.record_id).toBe("temp-1");
    });

    it("includes water_system_type in message", () => {
      const rows = [makeRow({ temperature_compliant: false, water_system_type: "Shower" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "temperature_non_compliant")!;
      expect(alert.message).toContain("Shower");
    });

    it("includes assessment_date in message", () => {
      const rows = [makeRow({ temperature_compliant: false, assessment_date: "2026-02-10" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "temperature_non_compliant")!;
      expect(alert.message).toContain("2026-02-10");
    });

    it("message contains legionella wording", () => {
      const rows = [makeRow({ temperature_compliant: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "temperature_non_compliant")!;
      expect(alert.message).toContain("legionella");
    });

    it("does not fire when temperature is compliant", () => {
      const rows = [makeRow({ temperature_compliant: true })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "temperature_non_compliant");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple non-compliant temperatures", () => {
      const rows = [
        makeRow({ temperature_compliant: false }),
        makeRow({ temperature_compliant: false }),
      ];
      const alerts = computeAlerts(rows);
      const tempAlerts = alerts.filter((a) => a.type === "temperature_non_compliant");
      expect(tempAlerts).toHaveLength(2);
    });
  });

  describe("flushing_non_compliant alert", () => {
    it("fires when flushing regime not compliant", () => {
      const rows = [makeRow({ flushing_regime_compliant: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "flushing_non_compliant");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ flushing_regime_compliant: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "flushing_non_compliant")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "flush-1", flushing_regime_compliant: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "flushing_non_compliant")!;
      expect(alert.record_id).toBe("flush-1");
    });

    it("includes water_system_type in message", () => {
      const rows = [makeRow({ flushing_regime_compliant: false, water_system_type: "Spa/Pool" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "flushing_non_compliant")!;
      expect(alert.message).toContain("Spa/Pool");
    });

    it("includes assessment_date in message", () => {
      const rows = [makeRow({ flushing_regime_compliant: false, assessment_date: "2026-01-05" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "flushing_non_compliant")!;
      expect(alert.message).toContain("2026-01-05");
    });

    it("message contains stagnation wording", () => {
      const rows = [makeRow({ flushing_regime_compliant: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "flushing_non_compliant")!;
      expect(alert.message).toContain("stagnation");
    });

    it("does not fire when flushing regime is compliant", () => {
      const rows = [makeRow({ flushing_regime_compliant: true })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "flushing_non_compliant");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple non-compliant flushing", () => {
      const rows = [
        makeRow({ flushing_regime_compliant: false }),
        makeRow({ flushing_regime_compliant: false }),
        makeRow({ flushing_regime_compliant: false }),
      ];
      const alerts = computeAlerts(rows);
      const flushAlerts = alerts.filter((a) => a.type === "flushing_non_compliant");
      expect(flushAlerts).toHaveLength(3);
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const rows = [
        makeRow({
          risk_level: "Intolerable",
          legionella_test_result: "Immediate Action",
          temperature_compliant: false,
          flushing_regime_compliant: false,
        }),
        makeRow({
          risk_level: "High",
          remedial_action_required: false,
        }),
      ];
      const alerts = computeAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("immediate_action_test_result");
      expect(types).toContain("intolerable_risk");
      expect(types).toContain("high_risk_no_remedial");
      expect(types).toContain("temperature_non_compliant");
      expect(types).toContain("flushing_non_compliant");
    });

    it("intolerable_risk and immediate_action_test_result can fire on same row", () => {
      const rows = [
        makeRow({ risk_level: "Intolerable", legionella_test_result: "Immediate Action" }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "intolerable_risk")).toBeDefined();
      expect(alerts.find((a) => a.type === "immediate_action_test_result")).toBeDefined();
    });

    it("per-record alerts multiply across rows", () => {
      const rows = [
        makeRow({ temperature_compliant: false, flushing_regime_compliant: false }),
        makeRow({ temperature_compliant: false, flushing_regime_compliant: false }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.filter((a) => a.type === "temperature_non_compliant")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "flushing_non_compliant")).toHaveLength(2);
    });

    it("High risk with remedial does not generate high_risk_no_remedial alert", () => {
      const rows = [
        makeRow({ risk_level: "High", remedial_action_required: true }),
      ];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_no_remedial");
      expect(alert).toBeUndefined();
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ risk_level: "Intolerable", temperature_compliant: false }),
      ];
      const alerts = computeAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({
          risk_level: "Intolerable",
          legionella_test_result: "Immediate Action",
          temperature_compliant: false,
          flushing_regime_compliant: false,
        }),
        makeRow({
          risk_level: "High",
          remedial_action_required: false,
        }),
      ];
      const alerts = computeAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ risk_level: "Intolerable" })];
      const alerts = computeAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("High risk with remedial action does not fire high_risk_no_remedial", () => {
      const rows = [makeRow({ risk_level: "High", remedial_action_required: true })];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "high_risk_no_remedial")).toBeUndefined();
    });

    it("Low Count test result does not fire immediate_action_test_result", () => {
      const rows = [makeRow({ legionella_test_result: "Low Count" })];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "immediate_action_test_result")).toBeUndefined();
    });

    it("Action Level test result does not fire immediate_action_test_result", () => {
      const rows = [makeRow({ legionella_test_result: "Action Level" })];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "immediate_action_test_result")).toBeUndefined();
    });

    it("water system types appear correctly in alert messages", () => {
      const systemTypes: WaterSystemType[] = ["Hot Water", "Cold Water", "Cooling Tower", "Spa/Pool", "Shower", "Dead Leg", "Other"];
      for (const sysType of systemTypes) {
        const rows = [makeRow({ temperature_compliant: false, water_system_type: sysType })];
        const alerts = computeAlerts(rows);
        const alert = alerts.find((a) => a.type === "temperature_non_compliant")!;
        expect(alert.message).toContain(sysType);
      }
    });
  });
});

// ── computeCaraInsights ────────────────────────────────────────────────

describe("computeCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const m = computeMetrics([]);
    const insights = computeCaraInsights(m);
    expect(insights).toHaveLength(3);
  });

  it("all insights are non-empty strings", () => {
    const m = computeMetrics([makeRow()]);
    const insights = computeCaraInsights(m);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("first insight includes total_assessments count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes temperature_compliance_rate", () => {
    const rows = [makeRow({ temperature_compliant: true }), makeRow({ temperature_compliant: false })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes flushing_compliance_rate", () => {
    const rows = [makeRow({ flushing_regime_compliant: true }), makeRow({ flushing_regime_compliant: false })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes legionella_test_rate", () => {
    const rows = [makeRow({ legionella_test_completed: true }), makeRow({ legionella_test_completed: false })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("50%");
  });

  it("second insight mentions intolerable and high when present", () => {
    const rows = [
      makeRow({ risk_level: "Intolerable" }),
      makeRow({ risk_level: "High" }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("intolerable");
    expect(insights[1]).toContain("high-risk");
  });

  it("second insight mentions no intolerable or high when none present", () => {
    const rows = [makeRow({
      risk_level: "Low",
      compliance_status: "Compliant",
      temperature_compliant: true,
      flushing_regime_compliant: true,
    })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("No intolerable or high-risk findings");
  });

  it("second insight includes remedial action count", () => {
    const rows = [
      makeRow({ remedial_action_required: true }),
      makeRow({ remedial_action_required: true }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("2 remedial");
  });

  it("second insight mentions ACOP L8 when no alerts", () => {
    const rows = [makeRow({ risk_level: "Low" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("ACOP L8");
  });

  it("third insight mentions intolerable or high when some have those levels", () => {
    const rows = [makeRow({ risk_level: "Intolerable" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("intolerable or high legionella risk");
  });

  it("third insight asks about water safety when no high/intolerable but compliance < 100", () => {
    const rows = [
      makeRow({ risk_level: "Low", temperature_compliant: false }),
      makeRow({ risk_level: "Low", temperature_compliant: true }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("ACOP L8");
  });

  it("third insight celebrates when all compliant and no high/intolerable", () => {
    const rows = [
      makeRow({ risk_level: "Low", temperature_compliant: true, flushing_regime_compliant: true }),
      makeRow({ risk_level: "Low", temperature_compliant: true, flushing_regime_compliant: true }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("All assessments show compliant");
  });

  it("uses singular assessor wording when unique_assessors is 1", () => {
    const rows = [makeRow({ assessor_name: "D. Laville" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("1 assessor");
  });

  it("uses plural assessors wording when unique_assessors > 1", () => {
    const rows = [
      makeRow({ assessor_name: "Staff A" }),
      makeRow({ assessor_name: "Staff B" }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("2 assessors");
  });

  it("uses singular assessment wording when 1 intolerable/high", () => {
    const rows = [makeRow({ risk_level: "High" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("assessment has");
  });

  it("uses plural assessments wording when multiple intolerable/high", () => {
    const rows = [
      makeRow({ risk_level: "High" }),
      makeRow({ risk_level: "Intolerable" }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("assessments have");
  });

  it("uses singular assessment wording for first insight with 1 row", () => {
    const rows = [makeRow()];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("1 legionella risk assessment");
  });

  it("uses plural assessments wording for first insight with multiple rows", () => {
    const rows = [makeRow(), makeRow()];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("2 legionella risk assessments");
  });

  it("uses singular finding wording for second insight with 1 high-risk", () => {
    const rows = [makeRow({ risk_level: "High" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("1 high-risk finding");
  });

  it("uses plural findings wording for second insight with multiple high-risk", () => {
    const rows = [makeRow({ risk_level: "High" }), makeRow({ risk_level: "High" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("2 high-risk findings");
  });

  it("uses singular action wording for second insight with 1 remedial", () => {
    const rows = [makeRow({ remedial_action_required: true })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("1 remedial action");
  });

  it("third insight mentions ACOP L8 when high/intolerable present", () => {
    const rows = [makeRow({ risk_level: "High" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("ACOP L8");
  });

  it("third insight mentions ACOP L8 when fully compliant", () => {
    const rows = [makeRow({ risk_level: "Low", temperature_compliant: true, flushing_regime_compliant: true })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("ACOP L8");
  });

  it("third insight asks about flushing compliance when below 100", () => {
    const rows = [
      makeRow({ risk_level: "Low", temperature_compliant: true, flushing_regime_compliant: false }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("flushing compliance");
  });
});

// ── Factory helper validation ──────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.assessor_name).toBe("D. Laville");
    expect(r.water_system_type).toBe("Hot Water");
    expect(r.risk_level).toBe("Low");
    expect(r.temperature_compliant).toBe(true);
    expect(r.hot_water_temp_celsius).toBeNull();
    expect(r.cold_water_temp_celsius).toBeNull();
    expect(r.flushing_regime_compliant).toBe(true);
    expect(r.water_treatment_in_place).toBe(true);
    expect(r.legionella_test_completed).toBe(true);
    expect(r.legionella_test_result).toBe("Negative");
    expect(r.remedial_action_required).toBe(false);
    expect(r.remedial_action_details).toBeNull();
    expect(r.next_assessment_date).toBeNull();
    expect(r.compliance_status).toBe("Compliant");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ risk_level: "High", compliance_status: "Major Non-Compliance" });
    expect(r.risk_level).toBe("High");
    expect(r.compliance_status).toBe("Major Non-Compliance");
    // defaults still apply
    expect(r.water_system_type).toBe("Hot Water");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRow();
    const r2 = makeRow();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRow({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRow({ hot_water_temp_celsius: null, cold_water_temp_celsius: null, remedial_action_details: null, next_assessment_date: null, notes: null });
    expect(r.hot_water_temp_celsius).toBeNull();
    expect(r.cold_water_temp_celsius).toBeNull();
    expect(r.remedial_action_details).toBeNull();
    expect(r.next_assessment_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ hot_water_temp_celsius: 55.5, cold_water_temp_celsius: 18.2, remedial_action_details: "Replace TMV", next_assessment_date: "2026-11-01", notes: "Follow-up needed" });
    expect(r.hot_water_temp_celsius).toBe(55.5);
    expect(r.cold_water_temp_celsius).toBe(18.2);
    expect(r.remedial_action_details).toBe("Replace TMV");
    expect(r.next_assessment_date).toBe("2026-11-01");
    expect(r.notes).toBe("Follow-up needed");
  });

  it("allows setting legionella_test_result to null", () => {
    const r = makeRow({ legionella_test_result: null });
    expect(r.legionella_test_result).toBeNull();
  });

  it("allows setting legionella_test_result to a value", () => {
    const r = makeRow({ legionella_test_result: "Action Level" });
    expect(r.legionella_test_result).toBe("Action Level");
  });
});
