// ══════════════════════════════════════════════════════════════════════════════
// CARA — WATER SAFETY SERVICE TESTS
// Pure-function tests for water safety metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";

import {
  WATER_CHECK_TYPES,
  WATER_LOCATIONS,
  TEMPERATURE_COMPLIANCES,
  RISK_LEVELS,
  _testing,
} from "../water-safety-service";

import type {
  WaterSafetyRecord,
  WaterCheckType,
  WaterLocation,
  TemperatureCompliance,
  RiskLevel,
} from "../water-safety-service";

const { computeWaterSafetyMetrics, identifyWaterSafetyAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<WaterSafetyRecord>,
): WaterSafetyRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    check_type: "check_type" in (overrides ?? {}) ? overrides!.check_type! : "temperature_check",
    check_date: "check_date" in (overrides ?? {}) ? overrides!.check_date! : "2026-05-01",
    location: "location" in (overrides ?? {}) ? overrides!.location! : "bathroom_1",
    hot_water_temp: "hot_water_temp" in (overrides ?? {}) ? (overrides!.hot_water_temp ?? null) : null,
    cold_water_temp: "cold_water_temp" in (overrides ?? {}) ? (overrides!.cold_water_temp ?? null) : null,
    temperature_compliance: "temperature_compliance" in (overrides ?? {}) ? overrides!.temperature_compliance! : "compliant",
    risk_level: "risk_level" in (overrides ?? {}) ? overrides!.risk_level! : "low",
    tmv_fitted: "tmv_fitted" in (overrides ?? {}) ? overrides!.tmv_fitted! : false,
    tmv_operational: "tmv_operational" in (overrides ?? {}) ? overrides!.tmv_operational! : false,
    flushing_completed: "flushing_completed" in (overrides ?? {}) ? overrides!.flushing_completed! : false,
    legionella_assessment_current: "legionella_assessment_current" in (overrides ?? {}) ? overrides!.legionella_assessment_current! : true,
    scalding_risk_mitigated: "scalding_risk_mitigated" in (overrides ?? {}) ? overrides!.scalding_risk_mitigated! : false,
    issues_found: "issues_found" in (overrides ?? {}) ? overrides!.issues_found! : [],
    actions_taken: "actions_taken" in (overrides ?? {}) ? overrides!.actions_taken! : [],
    checked_by: "checked_by" in (overrides ?? {}) ? overrides!.checked_by! : "Staff Member",
    next_check_date: "next_check_date" in (overrides ?? {}) ? (overrides!.next_check_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

/** Return an ISO date string for N days ago from now */
function daysAgo(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Return an ISO date string for N days from now (future) */
function daysFromNow(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("WATER_CHECK_TYPES", () => {
    it("has exactly 10 items", () => {
      expect(WATER_CHECK_TYPES).toHaveLength(10);
    });

    it("contains temperature_check", () => {
      expect(WATER_CHECK_TYPES).toContainEqual({ type: "temperature_check", label: "Temperature Check" });
    });

    it("contains legionella_risk_assessment", () => {
      expect(WATER_CHECK_TYPES).toContainEqual({ type: "legionella_risk_assessment", label: "Legionella Risk Assessment" });
    });

    it("contains flushing_record", () => {
      expect(WATER_CHECK_TYPES).toContainEqual({ type: "flushing_record", label: "Flushing Record" });
    });

    it("contains shower_head_clean", () => {
      expect(WATER_CHECK_TYPES).toContainEqual({ type: "shower_head_clean", label: "Shower Head Clean" });
    });

    it("contains tmv_check", () => {
      expect(WATER_CHECK_TYPES).toContainEqual({ type: "tmv_check", label: "TMV Check" });
    });

    it("contains dead_leg_flush", () => {
      expect(WATER_CHECK_TYPES).toContainEqual({ type: "dead_leg_flush", label: "Dead Leg Flush" });
    });

    it("contains water_tank_inspection", () => {
      expect(WATER_CHECK_TYPES).toContainEqual({ type: "water_tank_inspection", label: "Water Tank Inspection" });
    });

    it("contains scalding_risk_assessment", () => {
      expect(WATER_CHECK_TYPES).toContainEqual({ type: "scalding_risk_assessment", label: "Scalding Risk Assessment" });
    });

    it("contains water_quality_test", () => {
      expect(WATER_CHECK_TYPES).toContainEqual({ type: "water_quality_test", label: "Water Quality Test" });
    });

    it("contains other", () => {
      expect(WATER_CHECK_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = WATER_CHECK_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = WATER_CHECK_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of WATER_CHECK_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("WATER_LOCATIONS", () => {
    it("has exactly 9 items", () => {
      expect(WATER_LOCATIONS).toHaveLength(9);
    });

    it("contains bathroom_1", () => {
      expect(WATER_LOCATIONS).toContainEqual({ location: "bathroom_1", label: "Bathroom 1" });
    });

    it("contains bathroom_2", () => {
      expect(WATER_LOCATIONS).toContainEqual({ location: "bathroom_2", label: "Bathroom 2" });
    });

    it("contains en_suite", () => {
      expect(WATER_LOCATIONS).toContainEqual({ location: "en_suite", label: "En Suite" });
    });

    it("contains kitchen", () => {
      expect(WATER_LOCATIONS).toContainEqual({ location: "kitchen", label: "Kitchen" });
    });

    it("contains utility_room", () => {
      expect(WATER_LOCATIONS).toContainEqual({ location: "utility_room", label: "Utility Room" });
    });

    it("contains downstairs_toilet", () => {
      expect(WATER_LOCATIONS).toContainEqual({ location: "downstairs_toilet", label: "Downstairs Toilet" });
    });

    it("contains staff_bathroom", () => {
      expect(WATER_LOCATIONS).toContainEqual({ location: "staff_bathroom", label: "Staff Bathroom" });
    });

    it("contains laundry", () => {
      expect(WATER_LOCATIONS).toContainEqual({ location: "laundry", label: "Laundry" });
    });

    it("contains other", () => {
      expect(WATER_LOCATIONS).toContainEqual({ location: "other", label: "Other" });
    });

    it("has unique location values", () => {
      const locations = WATER_LOCATIONS.map((l) => l.location);
      expect(new Set(locations).size).toBe(locations.length);
    });

    it("has unique labels", () => {
      const labels = WATER_LOCATIONS.map((l) => l.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of WATER_LOCATIONS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("TEMPERATURE_COMPLIANCES", () => {
    it("has exactly 5 items", () => {
      expect(TEMPERATURE_COMPLIANCES).toHaveLength(5);
    });

    it("contains compliant", () => {
      expect(TEMPERATURE_COMPLIANCES).toContainEqual({ status: "compliant", label: "Compliant" });
    });

    it("contains too_hot", () => {
      expect(TEMPERATURE_COMPLIANCES).toContainEqual({ status: "too_hot", label: "Too Hot" });
    });

    it("contains too_cold", () => {
      expect(TEMPERATURE_COMPLIANCES).toContainEqual({ status: "too_cold", label: "Too Cold" });
    });

    it("contains not_tested", () => {
      expect(TEMPERATURE_COMPLIANCES).toContainEqual({ status: "not_tested", label: "Not Tested" });
    });

    it("contains tmv_fault", () => {
      expect(TEMPERATURE_COMPLIANCES).toContainEqual({ status: "tmv_fault", label: "TMV Fault" });
    });

    it("has unique status values", () => {
      const statuses = TEMPERATURE_COMPLIANCES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = TEMPERATURE_COMPLIANCES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of TEMPERATURE_COMPLIANCES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("RISK_LEVELS", () => {
    it("has exactly 5 items", () => {
      expect(RISK_LEVELS).toHaveLength(5);
    });

    it("contains low", () => {
      expect(RISK_LEVELS).toContainEqual({ level: "low", label: "Low" });
    });

    it("contains medium", () => {
      expect(RISK_LEVELS).toContainEqual({ level: "medium", label: "Medium" });
    });

    it("contains high", () => {
      expect(RISK_LEVELS).toContainEqual({ level: "high", label: "High" });
    });

    it("contains very_high", () => {
      expect(RISK_LEVELS).toContainEqual({ level: "very_high", label: "Very High" });
    });

    it("contains not_assessed", () => {
      expect(RISK_LEVELS).toContainEqual({ level: "not_assessed", label: "Not Assessed" });
    });

    it("has unique level values", () => {
      const levels = RISK_LEVELS.map((l) => l.level);
      expect(new Set(levels).size).toBe(levels.length);
    });

    it("has unique labels", () => {
      const labels = RISK_LEVELS.map((l) => l.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of RISK_LEVELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeWaterSafetyMetrics ────────────────────────────────────────────

describe("computeWaterSafetyMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_records", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.total_records).toBe(0);
    });

    it("returns zero temperature_check_count", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.temperature_check_count).toBe(0);
    });

    it("returns zero legionella_assessment_count", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.legionella_assessment_count).toBe(0);
    });

    it("returns zero flushing_count", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.flushing_count).toBe(0);
    });

    it("returns zero tmv_check_count", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.tmv_check_count).toBe(0);
    });

    it("returns zero compliant_rate", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.compliant_rate).toBeNull();;
    });

    it("returns zero too_hot_count", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.too_hot_count).toBe(0);
    });

    it("returns zero too_cold_count", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.too_cold_count).toBe(0);
    });

    it("returns zero tmv_fault_count", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.tmv_fault_count).toBe(0);
    });

    it("returns zero tmv_fitted_rate", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.tmv_fitted_rate).toBeNull();;
    });

    it("returns zero tmv_operational_rate", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.tmv_operational_rate).toBeNull();;
    });

    it("returns zero flushing_completed_rate", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.flushing_completed_rate).toBeNull();;
    });

    it("returns zero legionella_assessment_current_rate", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.legionella_assessment_current_rate).toBeNull();;
    });

    it("returns zero scalding_risk_mitigated_rate", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.scalding_risk_mitigated_rate).toBeNull();;
    });

    it("returns zero high_risk_count", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.high_risk_count).toBe(0);
    });

    it("returns zero very_high_risk_count", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.very_high_risk_count).toBe(0);
    });

    it("returns zero average_hot_temp", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.average_hot_temp).toBeNull();;
    });

    it("returns zero average_cold_temp", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.average_cold_temp).toBeNull();;
    });

    it("returns zero check_overdue_count", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.check_overdue_count).toBe(0);
    });

    it("returns empty by_check_type", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.by_check_type).toEqual({});
    });

    it("returns empty by_location", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.by_location).toEqual({});
    });

    it("returns empty by_temperature_compliance", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.by_temperature_compliance).toEqual({});
    });

    it("returns empty by_risk_level", () => {
      const m = computeWaterSafetyMetrics([]);
      expect(m.by_risk_level).toEqual({});
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      check_type: "temperature_check",
      temperature_compliance: "compliant",
      risk_level: "low",
      tmv_fitted: true,
      tmv_operational: true,
      flushing_completed: true,
      legionella_assessment_current: true,
      scalding_risk_mitigated: true,
      location: "kitchen",
      hot_water_temp: 55.0,
      cold_water_temp: 10.0,
    });

    it("returns total_records = 1", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.total_records).toBe(1);
    });

    it("returns temperature_check_count = 1", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.temperature_check_count).toBe(1);
    });

    it("returns legionella_assessment_count = 0", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.legionella_assessment_count).toBe(0);
    });

    it("returns flushing_count = 0", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.flushing_count).toBe(0);
    });

    it("returns tmv_check_count = 0", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.tmv_check_count).toBe(0);
    });

    it("returns compliant_rate = 100", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.compliant_rate).toBe(100);
    });

    it("returns tmv_fitted_rate = 100", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.tmv_fitted_rate).toBe(100);
    });

    it("returns tmv_operational_rate = 100", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.tmv_operational_rate).toBe(100);
    });

    it("returns flushing_completed_rate = 100", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.flushing_completed_rate).toBe(100);
    });

    it("returns legionella_assessment_current_rate = 100", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.legionella_assessment_current_rate).toBe(100);
    });

    it("returns scalding_risk_mitigated_rate = 100", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.scalding_risk_mitigated_rate).toBe(100);
    });

    it("returns average_hot_temp = 55", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.average_hot_temp).toBe(55);
    });

    it("returns average_cold_temp = 10", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.average_cold_temp).toBe(10);
    });

    it("returns by_check_type with single entry", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.by_check_type).toEqual({ temperature_check: 1 });
    });

    it("returns by_location with single entry", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.by_location).toEqual({ kitchen: 1 });
    });

    it("returns by_temperature_compliance with single entry", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.by_temperature_compliance).toEqual({ compliant: 1 });
    });

    it("returns by_risk_level with single entry", () => {
      const m = computeWaterSafetyMetrics([record]);
      expect(m.by_risk_level).toEqual({ low: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ check_type: "temperature_check", temperature_compliance: "compliant", risk_level: "low", location: "bathroom_1", tmv_fitted: true, tmv_operational: true, flushing_completed: true, legionella_assessment_current: true, scalding_risk_mitigated: true, hot_water_temp: 50, cold_water_temp: 10 }),
      makeRecord({ check_type: "legionella_risk_assessment", temperature_compliance: "too_hot", risk_level: "high", location: "kitchen", tmv_fitted: false, tmv_operational: false, flushing_completed: false, legionella_assessment_current: false, scalding_risk_mitigated: false, hot_water_temp: 65, cold_water_temp: 15 }),
      makeRecord({ check_type: "flushing_record", temperature_compliance: "too_cold", risk_level: "very_high", location: "en_suite", tmv_fitted: true, tmv_operational: true, flushing_completed: true, legionella_assessment_current: true, scalding_risk_mitigated: true, hot_water_temp: 40, cold_water_temp: 20 }),
      makeRecord({ check_type: "tmv_check", temperature_compliance: "tmv_fault", risk_level: "medium", location: "utility_room", tmv_fitted: false, tmv_operational: false, flushing_completed: false, legionella_assessment_current: false, scalding_risk_mitigated: false, hot_water_temp: 58, cold_water_temp: 12 }),
      makeRecord({ check_type: "shower_head_clean", temperature_compliance: "not_tested", risk_level: "not_assessed", location: "staff_bathroom", tmv_fitted: true, tmv_operational: false, flushing_completed: true, legionella_assessment_current: true, scalding_risk_mitigated: true, hot_water_temp: null, cold_water_temp: null }),
    ];

    it("returns total_records = 5", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.total_records).toBe(5);
    });

    it("returns temperature_check_count = 1", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.temperature_check_count).toBe(1);
    });

    it("returns legionella_assessment_count = 1", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.legionella_assessment_count).toBe(1);
    });

    it("returns flushing_count = 1", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.flushing_count).toBe(1);
    });

    it("returns tmv_check_count = 1", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_check_count).toBe(1);
    });

    it("calculates compliant_rate correctly (1/5 = 20%)", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.compliant_rate).toBe(20);
    });

    it("returns too_hot_count = 1", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.too_hot_count).toBe(1);
    });

    it("returns too_cold_count = 1", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.too_cold_count).toBe(1);
    });

    it("returns tmv_fault_count = 1", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_fault_count).toBe(1);
    });

    it("returns high_risk_count = 1", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.high_risk_count).toBe(1);
    });

    it("returns very_high_risk_count = 1", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.very_high_risk_count).toBe(1);
    });

    it("calculates tmv_fitted_rate correctly (3/5 = 60%)", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_fitted_rate).toBe(60);
    });

    it("calculates tmv_operational_rate correctly (2/5 = 40%)", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_operational_rate).toBe(40);
    });

    it("calculates flushing_completed_rate correctly (3/5 = 60%)", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.flushing_completed_rate).toBe(60);
    });

    it("calculates legionella_assessment_current_rate correctly (3/5 = 60%)", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.legionella_assessment_current_rate).toBe(60);
    });

    it("calculates scalding_risk_mitigated_rate correctly (3/5 = 60%)", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.scalding_risk_mitigated_rate).toBe(60);
    });

    it("calculates average_hot_temp correctly ((50+65+40+58)/4 = 53.3)", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_hot_temp).toBe(53.3);
    });

    it("calculates average_cold_temp correctly ((10+15+20+12)/4 = 14.3)", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_cold_temp).toBe(14.3);
    });

    it("groups by_check_type correctly", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.by_check_type).toEqual({ temperature_check: 1, legionella_risk_assessment: 1, flushing_record: 1, tmv_check: 1, shower_head_clean: 1 });
    });

    it("groups by_location correctly", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.by_location).toEqual({ bathroom_1: 1, kitchen: 1, en_suite: 1, utility_room: 1, staff_bathroom: 1 });
    });

    it("groups by_temperature_compliance correctly", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.by_temperature_compliance).toEqual({ compliant: 1, too_hot: 1, too_cold: 1, tmv_fault: 1, not_tested: 1 });
    });

    it("groups by_risk_level correctly", () => {
      const m = computeWaterSafetyMetrics(records);
      expect(m.by_risk_level).toEqual({ low: 1, high: 1, very_high: 1, medium: 1, not_assessed: 1 });
    });
  });

  describe("check type counts", () => {
    it("counts temperature_check events", () => {
      const records = [
        makeRecord({ check_type: "temperature_check" }),
        makeRecord({ check_type: "temperature_check" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.temperature_check_count).toBe(2);
    });

    it("counts legionella_risk_assessment events", () => {
      const records = [
        makeRecord({ check_type: "legionella_risk_assessment" }),
        makeRecord({ check_type: "legionella_risk_assessment" }),
        makeRecord({ check_type: "legionella_risk_assessment" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.legionella_assessment_count).toBe(3);
    });

    it("counts flushing_record events", () => {
      const records = [
        makeRecord({ check_type: "flushing_record" }),
        makeRecord({ check_type: "flushing_record" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.flushing_count).toBe(2);
    });

    it("counts tmv_check events", () => {
      const records = [
        makeRecord({ check_type: "tmv_check" }),
        makeRecord({ check_type: "tmv_check" }),
        makeRecord({ check_type: "tmv_check" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_check_count).toBe(3);
    });

    it("does not count shower_head_clean as temperature_check", () => {
      const records = [makeRecord({ check_type: "shower_head_clean" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.temperature_check_count).toBe(0);
    });

    it("does not count dead_leg_flush as flushing_record", () => {
      const records = [makeRecord({ check_type: "dead_leg_flush" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.flushing_count).toBe(0);
    });

    it("does not count other as any specific type", () => {
      const records = [makeRecord({ check_type: "other" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.temperature_check_count).toBe(0);
      expect(m.legionella_assessment_count).toBe(0);
      expect(m.flushing_count).toBe(0);
      expect(m.tmv_check_count).toBe(0);
    });
  });

  describe("compliant_rate", () => {
    it("returns 100 when all compliant", () => {
      const records = [
        makeRecord({ temperature_compliance: "compliant" }),
        makeRecord({ temperature_compliance: "compliant" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.compliant_rate).toBe(100);
    });

    it("returns 0 when none compliant", () => {
      const records = [
        makeRecord({ temperature_compliance: "too_hot" }),
        makeRecord({ temperature_compliance: "too_cold" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.compliant_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ temperature_compliance: "compliant" }),
        makeRecord({ temperature_compliance: "too_hot" }),
        makeRecord({ temperature_compliance: "too_cold" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.compliant_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ temperature_compliance: "compliant" }),
        makeRecord({ temperature_compliance: "compliant" }),
        makeRecord({ temperature_compliance: "too_hot" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.compliant_rate).toBe(66.7);
    });

    it("uses all records as denominator", () => {
      const records = [
        makeRecord({ temperature_compliance: "compliant" }),
        makeRecord({ temperature_compliance: "not_tested" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.compliant_rate).toBe(50);
    });
  });

  describe("too_hot_count and too_cold_count", () => {
    it("counts too_hot records accurately", () => {
      const records = [
        makeRecord({ temperature_compliance: "too_hot" }),
        makeRecord({ temperature_compliance: "too_hot" }),
        makeRecord({ temperature_compliance: "compliant" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.too_hot_count).toBe(2);
    });

    it("counts too_cold records accurately", () => {
      const records = [
        makeRecord({ temperature_compliance: "too_cold" }),
        makeRecord({ temperature_compliance: "too_cold" }),
        makeRecord({ temperature_compliance: "too_cold" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.too_cold_count).toBe(3);
    });

    it("does not count not_tested as too_hot", () => {
      const records = [makeRecord({ temperature_compliance: "not_tested" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.too_hot_count).toBe(0);
    });

    it("does not count compliant as too_cold", () => {
      const records = [makeRecord({ temperature_compliance: "compliant" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.too_cold_count).toBe(0);
    });

    it("does not count tmv_fault as too_hot", () => {
      const records = [makeRecord({ temperature_compliance: "tmv_fault" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.too_hot_count).toBe(0);
    });
  });

  describe("tmv_fault_count", () => {
    it("counts tmv_fault records", () => {
      const records = [
        makeRecord({ temperature_compliance: "tmv_fault" }),
        makeRecord({ temperature_compliance: "tmv_fault" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_fault_count).toBe(2);
    });

    it("does not count too_hot as tmv_fault", () => {
      const records = [makeRecord({ temperature_compliance: "too_hot" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_fault_count).toBe(0);
    });

    it("does not count not_tested as tmv_fault", () => {
      const records = [makeRecord({ temperature_compliance: "not_tested" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_fault_count).toBe(0);
    });
  });

  describe("tmv_fitted_rate", () => {
    it("returns 100 when all fitted", () => {
      const records = [
        makeRecord({ tmv_fitted: true }),
        makeRecord({ tmv_fitted: true }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_fitted_rate).toBe(100);
    });

    it("returns 0 when none fitted", () => {
      const records = [
        makeRecord({ tmv_fitted: false }),
        makeRecord({ tmv_fitted: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_fitted_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ tmv_fitted: true }),
        makeRecord({ tmv_fitted: false }),
        makeRecord({ tmv_fitted: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_fitted_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ tmv_fitted: true }),
        makeRecord({ tmv_fitted: true }),
        makeRecord({ tmv_fitted: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_fitted_rate).toBe(66.7);
    });
  });

  describe("tmv_operational_rate", () => {
    it("returns 100 when all operational", () => {
      const records = [
        makeRecord({ tmv_operational: true }),
        makeRecord({ tmv_operational: true }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_operational_rate).toBe(100);
    });

    it("returns 0 when none operational", () => {
      const records = [
        makeRecord({ tmv_operational: false }),
        makeRecord({ tmv_operational: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_operational_rate).toBe(0);
    });

    it("calculates 50% correctly", () => {
      const records = [
        makeRecord({ tmv_operational: true }),
        makeRecord({ tmv_operational: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.tmv_operational_rate).toBe(50);
    });
  });

  describe("flushing_completed_rate", () => {
    it("returns 100 when all completed", () => {
      const records = [
        makeRecord({ flushing_completed: true }),
        makeRecord({ flushing_completed: true }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.flushing_completed_rate).toBe(100);
    });

    it("returns 0 when none completed", () => {
      const records = [
        makeRecord({ flushing_completed: false }),
        makeRecord({ flushing_completed: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.flushing_completed_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ flushing_completed: true }),
        makeRecord({ flushing_completed: false }),
        makeRecord({ flushing_completed: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.flushing_completed_rate).toBe(33.3);
    });
  });

  describe("legionella_assessment_current_rate", () => {
    it("returns 100 when all current", () => {
      const records = [
        makeRecord({ legionella_assessment_current: true }),
        makeRecord({ legionella_assessment_current: true }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.legionella_assessment_current_rate).toBe(100);
    });

    it("returns 0 when none current", () => {
      const records = [
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.legionella_assessment_current_rate).toBe(0);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ legionella_assessment_current: true }),
        makeRecord({ legionella_assessment_current: true }),
        makeRecord({ legionella_assessment_current: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.legionella_assessment_current_rate).toBe(66.7);
    });
  });

  describe("scalding_risk_mitigated_rate", () => {
    it("returns 100 when all mitigated", () => {
      const records = [
        makeRecord({ scalding_risk_mitigated: true }),
        makeRecord({ scalding_risk_mitigated: true }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.scalding_risk_mitigated_rate).toBe(100);
    });

    it("returns 0 when none mitigated", () => {
      const records = [
        makeRecord({ scalding_risk_mitigated: false }),
        makeRecord({ scalding_risk_mitigated: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.scalding_risk_mitigated_rate).toBe(0);
    });

    it("calculates (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ scalding_risk_mitigated: true }),
        makeRecord({ scalding_risk_mitigated: false }),
        makeRecord({ scalding_risk_mitigated: false }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.scalding_risk_mitigated_rate).toBe(33.3);
    });
  });

  describe("high_risk_count and very_high_risk_count", () => {
    it("counts high risk records", () => {
      const records = [
        makeRecord({ risk_level: "high" }),
        makeRecord({ risk_level: "high" }),
        makeRecord({ risk_level: "low" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.high_risk_count).toBe(2);
    });

    it("counts very_high risk records", () => {
      const records = [
        makeRecord({ risk_level: "very_high" }),
        makeRecord({ risk_level: "very_high" }),
        makeRecord({ risk_level: "very_high" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.very_high_risk_count).toBe(3);
    });

    it("does not count medium as high", () => {
      const records = [makeRecord({ risk_level: "medium" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.high_risk_count).toBe(0);
    });

    it("does not count high as very_high", () => {
      const records = [makeRecord({ risk_level: "high" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.very_high_risk_count).toBe(0);
    });

    it("does not count not_assessed as high", () => {
      const records = [makeRecord({ risk_level: "not_assessed" })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.high_risk_count).toBe(0);
    });
  });

  describe("average_hot_temp", () => {
    it("returns 0 when no records have hot_water_temp", () => {
      const records = [
        makeRecord({ hot_water_temp: null }),
        makeRecord({ hot_water_temp: null }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_hot_temp).toBeNull();;
    });

    it("returns the single value when one record has hot_water_temp", () => {
      const records = [makeRecord({ hot_water_temp: 55.5 })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_hot_temp).toBe(55.5);
    });

    it("averages multiple hot temps with rounding", () => {
      const records = [
        makeRecord({ hot_water_temp: 50 }),
        makeRecord({ hot_water_temp: 55 }),
        makeRecord({ hot_water_temp: 60 }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_hot_temp).toBe(55);
    });

    it("skips null hot_water_temp in average", () => {
      const records = [
        makeRecord({ hot_water_temp: 50 }),
        makeRecord({ hot_water_temp: null }),
        makeRecord({ hot_water_temp: 60 }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_hot_temp).toBe(55);
    });

    it("rounds to one decimal place (53.333... -> 53.3)", () => {
      const records = [
        makeRecord({ hot_water_temp: 50 }),
        makeRecord({ hot_water_temp: 55 }),
        makeRecord({ hot_water_temp: 55 }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_hot_temp).toBe(53.3);
    });
  });

  describe("average_cold_temp", () => {
    it("returns 0 when no records have cold_water_temp", () => {
      const records = [
        makeRecord({ cold_water_temp: null }),
        makeRecord({ cold_water_temp: null }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_cold_temp).toBeNull();;
    });

    it("returns the single value when one record has cold_water_temp", () => {
      const records = [makeRecord({ cold_water_temp: 12.5 })];
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_cold_temp).toBe(12.5);
    });

    it("averages multiple cold temps", () => {
      const records = [
        makeRecord({ cold_water_temp: 10 }),
        makeRecord({ cold_water_temp: 15 }),
        makeRecord({ cold_water_temp: 20 }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_cold_temp).toBe(15);
    });

    it("skips null cold_water_temp in average", () => {
      const records = [
        makeRecord({ cold_water_temp: 10 }),
        makeRecord({ cold_water_temp: null }),
        makeRecord({ cold_water_temp: 20 }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_cold_temp).toBe(15);
    });

    it("rounds to one decimal place (13.333... -> 13.3)", () => {
      const records = [
        makeRecord({ cold_water_temp: 10 }),
        makeRecord({ cold_water_temp: 15 }),
        makeRecord({ cold_water_temp: 15 }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.average_cold_temp).toBe(13.3);
    });
  });

  describe("check_overdue_count", () => {
    it("counts records with past next_check_date", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(5) }),
        makeRecord({ next_check_date: daysAgo(10) }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.check_overdue_count).toBe(2);
    });

    it("does not count records with future next_check_date", () => {
      const records = [
        makeRecord({ next_check_date: daysFromNow(10) }),
        makeRecord({ next_check_date: daysFromNow(20) }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.check_overdue_count).toBe(0);
    });

    it("does not count records with null next_check_date", () => {
      const records = [
        makeRecord({ next_check_date: null }),
        makeRecord({ next_check_date: null }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.check_overdue_count).toBe(0);
    });

    it("counts mixed past/future/null correctly", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(5) }),
        makeRecord({ next_check_date: daysFromNow(5) }),
        makeRecord({ next_check_date: null }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.check_overdue_count).toBe(1);
    });

    it("counts multiple overdue among mixed records", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(1) }),
        makeRecord({ next_check_date: daysAgo(30) }),
        makeRecord({ next_check_date: daysFromNow(10) }),
        makeRecord({ next_check_date: null }),
        makeRecord({ next_check_date: daysAgo(7) }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.check_overdue_count).toBe(3);
    });
  });

  describe("by_check_type breakdown", () => {
    it("counts each check type separately", () => {
      const records = [
        makeRecord({ check_type: "temperature_check" }),
        makeRecord({ check_type: "temperature_check" }),
        makeRecord({ check_type: "flushing_record" }),
        makeRecord({ check_type: "tmv_check" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.by_check_type).toEqual({ temperature_check: 2, flushing_record: 1, tmv_check: 1 });
    });

    it("handles all ten check types", () => {
      const types: WaterCheckType[] = ["temperature_check", "legionella_risk_assessment", "flushing_record", "shower_head_clean", "tmv_check", "dead_leg_flush", "water_tank_inspection", "scalding_risk_assessment", "water_quality_test", "other"];
      const records = types.map((t) => makeRecord({ check_type: t }));
      const m = computeWaterSafetyMetrics(records);
      for (const t of types) {
        expect(m.by_check_type[t]).toBe(1);
      }
    });
  });

  describe("by_location breakdown", () => {
    it("counts each location separately", () => {
      const records = [
        makeRecord({ location: "kitchen" }),
        makeRecord({ location: "kitchen" }),
        makeRecord({ location: "bathroom_1" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.by_location).toEqual({ kitchen: 2, bathroom_1: 1 });
    });

    it("handles all nine locations", () => {
      const locations: WaterLocation[] = ["bathroom_1", "bathroom_2", "en_suite", "kitchen", "utility_room", "downstairs_toilet", "staff_bathroom", "laundry", "other"];
      const records = locations.map((l) => makeRecord({ location: l }));
      const m = computeWaterSafetyMetrics(records);
      for (const l of locations) {
        expect(m.by_location[l]).toBe(1);
      }
    });
  });

  describe("by_temperature_compliance breakdown", () => {
    it("counts each compliance status separately", () => {
      const records = [
        makeRecord({ temperature_compliance: "compliant" }),
        makeRecord({ temperature_compliance: "compliant" }),
        makeRecord({ temperature_compliance: "too_hot" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.by_temperature_compliance).toEqual({ compliant: 2, too_hot: 1 });
    });

    it("handles all five compliance statuses", () => {
      const statuses: TemperatureCompliance[] = ["compliant", "too_hot", "too_cold", "not_tested", "tmv_fault"];
      const records = statuses.map((s) => makeRecord({ temperature_compliance: s }));
      const m = computeWaterSafetyMetrics(records);
      for (const s of statuses) {
        expect(m.by_temperature_compliance[s]).toBe(1);
      }
    });
  });

  describe("by_risk_level breakdown", () => {
    it("counts each risk level separately", () => {
      const records = [
        makeRecord({ risk_level: "low" }),
        makeRecord({ risk_level: "low" }),
        makeRecord({ risk_level: "high" }),
      ];
      const m = computeWaterSafetyMetrics(records);
      expect(m.by_risk_level).toEqual({ low: 2, high: 1 });
    });

    it("handles all five risk levels", () => {
      const levels: RiskLevel[] = ["low", "medium", "high", "very_high", "not_assessed"];
      const records = levels.map((l) => makeRecord({ risk_level: l }));
      const m = computeWaterSafetyMetrics(records);
      for (const l of levels) {
        expect(m.by_risk_level[l]).toBe(1);
      }
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: WaterSafetyRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            check_type: i % 4 === 0 ? "temperature_check" : i % 4 === 1 ? "legionella_risk_assessment" : i % 4 === 2 ? "flushing_record" : "tmv_check",
            temperature_compliance: "compliant",
            risk_level: "low",
            tmv_fitted: true,
            tmv_operational: true,
            flushing_completed: true,
            legionella_assessment_current: true,
            scalding_risk_mitigated: true,
            hot_water_temp: 55,
            cold_water_temp: 10,
          }),
        );
      }
      const m = computeWaterSafetyMetrics(records);
      expect(m.total_records).toBe(100);
      expect(m.compliant_rate).toBe(100);
      expect(m.tmv_fitted_rate).toBe(100);
      expect(m.tmv_operational_rate).toBe(100);
      expect(m.flushing_completed_rate).toBe(100);
      expect(m.legionella_assessment_current_rate).toBe(100);
      expect(m.scalding_risk_mitigated_rate).toBe(100);
      expect(m.average_hot_temp).toBe(55);
      expect(m.average_cold_temp).toBe(10);
      // temperature_check: i%4===0 => 25, legionella: i%4===1 => 25, flushing: i%4===2 => 25, tmv: i%4===3 => 25
      expect(m.temperature_check_count).toBe(25);
      expect(m.legionella_assessment_count).toBe(25);
      expect(m.flushing_count).toBe(25);
      expect(m.tmv_check_count).toBe(25);
    });
  });
});

// ── identifyWaterSafetyAlerts ────────────────────────────────────────────

describe("identifyWaterSafetyAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyWaterSafetyAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          temperature_compliance: "compliant",
          risk_level: "low",
          legionella_assessment_current: true,
          next_check_date: daysFromNow(30),
        }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty for single well-formed record with future check", () => {
      const records = [
        makeRecord({
          temperature_compliance: "compliant",
          risk_level: "low",
          legionella_assessment_current: true,
          next_check_date: daysFromNow(10),
        }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty when temperature_compliance is too_cold (not too_hot)", () => {
      const records = [
        makeRecord({
          temperature_compliance: "too_cold",
          risk_level: "low",
          legionella_assessment_current: true,
        }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty when risk_level is medium (not very_high)", () => {
      const records = [
        makeRecord({
          temperature_compliance: "compliant",
          risk_level: "medium",
          legionella_assessment_current: true,
        }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("scalding_risk alert", () => {
    it("fires for temperature_compliance = too_hot", () => {
      const records = [makeRecord({ temperature_compliance: "too_hot", check_date: "2026-05-01", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ temperature_compliance: "too_hot", check_date: "2026-05-01", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "scald-1", temperature_compliance: "too_hot", check_date: "2026-05-01", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk")!;
      expect(alert.id).toBe("scald-1");
    });

    it("includes check_date in message", () => {
      const records = [makeRecord({ temperature_compliance: "too_hot", check_date: "2026-04-15", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk")!;
      expect(alert.message).toContain("2026-04-15");
    });

    it("includes location with underscores replaced by spaces", () => {
      const records = [makeRecord({ temperature_compliance: "too_hot", check_date: "2026-05-01", location: "utility_room" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk")!;
      expect(alert.message).toContain("utility room");
    });

    it("fires per record for multiple too_hot records", () => {
      const records = [
        makeRecord({ temperature_compliance: "too_hot", check_date: "2026-05-01", location: "kitchen" }),
        makeRecord({ temperature_compliance: "too_hot", check_date: "2026-04-01", location: "bathroom_1" }),
        makeRecord({ temperature_compliance: "too_hot", check_date: "2026-03-01", location: "en_suite" }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const scaldAlerts = alerts.filter((a) => a.type === "scalding_risk");
      expect(scaldAlerts).toHaveLength(3);
    });

    it("does not fire for compliant status", () => {
      const records = [makeRecord({ temperature_compliance: "compliant" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for too_cold status", () => {
      const records = [makeRecord({ temperature_compliance: "too_cold" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for not_tested status", () => {
      const records = [makeRecord({ temperature_compliance: "not_tested" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for tmv_fault status", () => {
      const records = [makeRecord({ temperature_compliance: "tmv_fault" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk");
      expect(alert).toBeUndefined();
    });

    it("message contains immediate action required wording", () => {
      const records = [makeRecord({ temperature_compliance: "too_hot", check_date: "2026-05-01", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk")!;
      expect(alert.message).toContain("immediate action required");
    });
  });

  describe("very_high_risk alert", () => {
    it("fires for risk_level = very_high", () => {
      const records = [makeRecord({ risk_level: "very_high", check_date: "2026-05-01", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ risk_level: "very_high", check_date: "2026-05-01", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "risk-1", risk_level: "very_high", check_date: "2026-05-01", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk")!;
      expect(alert.id).toBe("risk-1");
    });

    it("includes check_date in message", () => {
      const records = [makeRecord({ risk_level: "very_high", check_date: "2026-03-20", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk")!;
      expect(alert.message).toContain("2026-03-20");
    });

    it("includes location with underscores replaced by spaces", () => {
      const records = [makeRecord({ risk_level: "very_high", check_date: "2026-05-01", location: "staff_bathroom" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk")!;
      expect(alert.message).toContain("staff bathroom");
    });

    it("fires per record for multiple very_high records", () => {
      const records = [
        makeRecord({ risk_level: "very_high", check_date: "2026-05-01", location: "kitchen" }),
        makeRecord({ risk_level: "very_high", check_date: "2026-04-01", location: "bathroom_1" }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const riskAlerts = alerts.filter((a) => a.type === "very_high_risk");
      expect(riskAlerts).toHaveLength(2);
    });

    it("does not fire for low risk", () => {
      const records = [makeRecord({ risk_level: "low" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for medium risk", () => {
      const records = [makeRecord({ risk_level: "medium" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for high risk", () => {
      const records = [makeRecord({ risk_level: "high" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for not_assessed risk", () => {
      const records = [makeRecord({ risk_level: "not_assessed" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk");
      expect(alert).toBeUndefined();
    });

    it("message contains escalate immediately wording", () => {
      const records = [makeRecord({ risk_level: "very_high", check_date: "2026-05-01", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk")!;
      expect(alert.message).toContain("escalate immediately");
    });
  });

  describe("tmv_fault alert", () => {
    it("fires when >= 1 TMV fault is detected", () => {
      const records = [makeRecord({ temperature_compliance: "tmv_fault" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ temperature_compliance: "tmv_fault" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault")!;
      expect(alert.severity).toBe("high");
    });

    it("has id tmv_fault", () => {
      const records = [makeRecord({ temperature_compliance: "tmv_fault" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault")!;
      expect(alert.id).toBe("tmv_fault");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ temperature_compliance: "tmv_fault" }),
        makeRecord({ temperature_compliance: "tmv_fault" }),
        makeRecord({ temperature_compliance: "tmv_fault" }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault")!;
      expect(alert.message).toContain("3");
    });

    it("uses singular 'fault' for 1 fault", () => {
      const records = [makeRecord({ temperature_compliance: "tmv_fault" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault")!;
      expect(alert.message).toContain("1 TMV fault");
      expect(alert.message).not.toContain("1 TMV faults");
    });

    it("uses plural 'faults' for multiple faults", () => {
      const records = [
        makeRecord({ temperature_compliance: "tmv_fault" }),
        makeRecord({ temperature_compliance: "tmv_fault" }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault")!;
      expect(alert.message).toContain("2 TMV faults");
    });

    it("does not fire when temperature_compliance = compliant", () => {
      const records = [makeRecord({ temperature_compliance: "compliant" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault");
      expect(alert).toBeUndefined();
    });

    it("does not fire when temperature_compliance = too_hot", () => {
      const records = [makeRecord({ temperature_compliance: "too_hot" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault");
      expect(alert).toBeUndefined();
    });

    it("does not fire when temperature_compliance = too_cold", () => {
      const records = [makeRecord({ temperature_compliance: "too_cold" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault");
      expect(alert).toBeUndefined();
    });

    it("does not fire when temperature_compliance = not_tested", () => {
      const records = [makeRecord({ temperature_compliance: "not_tested" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ temperature_compliance: "tmv_fault" }),
        makeRecord({ temperature_compliance: "tmv_fault" }),
        makeRecord({ temperature_compliance: "tmv_fault" }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const tmvAlerts = alerts.filter((a) => a.type === "tmv_fault");
      expect(tmvAlerts).toHaveLength(1);
    });

    it("message contains arrange repair wording", () => {
      const records = [makeRecord({ temperature_compliance: "tmv_fault" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault")!;
      expect(alert.message).toContain("arrange repair");
    });

    it("fires at exactly threshold of 1", () => {
      const records = [makeRecord({ temperature_compliance: "tmv_fault" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault");
      expect(alert).toBeDefined();
    });
  });

  describe("legionella_lapsed alert", () => {
    it("fires when >= 2 records lack current legionella assessment", () => {
      const records = [
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: false }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_lapsed");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: false }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_lapsed")!;
      expect(alert.severity).toBe("high");
    });

    it("has id legionella_lapsed", () => {
      const records = [
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: false }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_lapsed")!;
      expect(alert.id).toBe("legionella_lapsed");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: false }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_lapsed")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 record lacks current assessment (below threshold)", () => {
      const records = [makeRecord({ legionella_assessment_current: false })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_lapsed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all assessments are current", () => {
      const records = [
        makeRecord({ legionella_assessment_current: true }),
        makeRecord({ legionella_assessment_current: true }),
        makeRecord({ legionella_assessment_current: true }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_lapsed");
      expect(alert).toBeUndefined();
    });

    it("fires at exactly threshold of 2", () => {
      const records = [
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: false }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_lapsed");
      expect(alert).toBeDefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: false }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const legAlerts = alerts.filter((a) => a.type === "legionella_lapsed");
      expect(legAlerts).toHaveLength(1);
    });

    it("message contains arrange assessment urgently wording", () => {
      const records = [
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: false }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_lapsed")!;
      expect(alert.message).toContain("arrange assessment urgently");
    });

    it("counts only non-current records, not current ones", () => {
      const records = [
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: true }),
        makeRecord({ legionella_assessment_current: false }),
        makeRecord({ legionella_assessment_current: true }),
        makeRecord({ legionella_assessment_current: false }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_lapsed")!;
      expect(alert.message).toContain("3");
    });
  });

  describe("check_overdue alert", () => {
    it("fires when >= 1 check is overdue", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id check_overdue", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.id).toBe("check_overdue");
    });

    it("uses singular 'check is' for 1 overdue", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("1 water safety check is overdue");
    });

    it("uses plural 'checks are' for multiple overdue", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(5) }),
        makeRecord({ next_check_date: daysAgo(10) }),
        makeRecord({ next_check_date: daysAgo(15) }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("3 water safety checks are overdue");
    });

    it("does not fire when all checks are in the future", () => {
      const records = [
        makeRecord({ next_check_date: daysFromNow(10) }),
        makeRecord({ next_check_date: daysFromNow(20) }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all next_check_date are null", () => {
      const records = [
        makeRecord({ next_check_date: null }),
        makeRecord({ next_check_date: null }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(5) }),
        makeRecord({ next_check_date: daysAgo(10) }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const overdueAlerts = alerts.filter((a) => a.type === "check_overdue");
      expect(overdueAlerts).toHaveLength(1);
    });

    it("message contains schedule promptly wording", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("schedule promptly");
    });

    it("counts only overdue checks, not future or null", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(5) }),
        makeRecord({ next_check_date: daysFromNow(10) }),
        makeRecord({ next_check_date: null }),
        makeRecord({ next_check_date: daysAgo(15) }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("2 water safety checks are overdue");
    });

    it("fires at exactly threshold of 1", () => {
      const records = [makeRecord({ next_check_date: daysAgo(1) })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeDefined();
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        makeRecord({ id: "r1", temperature_compliance: "too_hot", risk_level: "very_high", check_date: "2026-05-01", location: "kitchen", legionella_assessment_current: false, next_check_date: daysAgo(5) }),
        makeRecord({ id: "r2", temperature_compliance: "tmv_fault", legionella_assessment_current: false, next_check_date: daysAgo(10) }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("scalding_risk");
      expect(types).toContain("very_high_risk");
      expect(types).toContain("tmv_fault");
      expect(types).toContain("legionella_lapsed");
      expect(types).toContain("check_overdue");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({ temperature_compliance: "too_hot", risk_level: "very_high", check_date: "2026-05-01", location: "kitchen", legionella_assessment_current: false, next_check_date: daysAgo(5) }),
        makeRecord({ temperature_compliance: "tmv_fault", legionella_assessment_current: false, next_check_date: daysAgo(10) }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      // scalding_risk=1, very_high_risk=1, tmv_fault=1, legionella_lapsed=1, check_overdue=1
      expect(alerts).toHaveLength(5);
    });

    it("per-record alerts multiply while threshold alerts stay singular", () => {
      const records = [
        makeRecord({ temperature_compliance: "too_hot", risk_level: "very_high", check_date: "2026-05-01", location: "kitchen", legionella_assessment_current: false, next_check_date: daysAgo(5) }),
        makeRecord({ temperature_compliance: "too_hot", risk_level: "very_high", check_date: "2026-04-01", location: "bathroom_1", legionella_assessment_current: false, next_check_date: daysAgo(10) }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      expect(alerts.filter((a) => a.type === "scalding_risk")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "very_high_risk")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "legionella_lapsed")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "check_overdue")).toHaveLength(1);
    });

    it("scalding_risk alert appears without other alert types when only too_hot present", () => {
      const records = [
        makeRecord({ temperature_compliance: "too_hot", check_date: "2026-05-01", location: "kitchen", risk_level: "low", legionella_assessment_current: true }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("scalding_risk");
    });

    it("very_high_risk alert appears without other alert types", () => {
      const records = [
        makeRecord({ temperature_compliance: "compliant", risk_level: "very_high", check_date: "2026-05-01", location: "kitchen", legionella_assessment_current: true }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("very_high_risk");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ temperature_compliance: "too_hot", check_date: "2026-05-01", location: "kitchen" }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ temperature_compliance: "too_hot", risk_level: "very_high", check_date: "2026-05-01", location: "kitchen", legionella_assessment_current: false, next_check_date: daysAgo(5) }),
        makeRecord({ temperature_compliance: "tmv_fault", legionella_assessment_current: false }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ temperature_compliance: "too_hot", check_date: "2026-05-01", location: "kitchen" })];
      const alerts = identifyWaterSafetyAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });

    it("id is always a non-empty string", () => {
      const records = [
        makeRecord({ temperature_compliance: "too_hot", risk_level: "very_high", check_date: "2026-05-01", location: "kitchen", legionella_assessment_current: false, next_check_date: daysAgo(5) }),
        makeRecord({ temperature_compliance: "tmv_fault", legionella_assessment_current: false }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.id).toBe("string");
        expect(alert.id.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("compliant temperature does not trigger scalding_risk", () => {
      const records = [makeRecord({ temperature_compliance: "compliant" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "scalding_risk");
      expect(alert).toBeUndefined();
    });

    it("low risk does not trigger very_high_risk", () => {
      const records = [makeRecord({ risk_level: "low" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk");
      expect(alert).toBeUndefined();
    });

    it("high risk does not trigger very_high_risk", () => {
      const records = [makeRecord({ risk_level: "high" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "very_high_risk");
      expect(alert).toBeUndefined();
    });

    it("fully clean records trigger no alerts", () => {
      const records = [
        makeRecord({
          temperature_compliance: "compliant",
          risk_level: "low",
          legionella_assessment_current: true,
          next_check_date: daysFromNow(30),
        }),
      ];
      const alerts = identifyWaterSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("not_tested temperature does not trigger tmv_fault alert", () => {
      const records = [makeRecord({ temperature_compliance: "not_tested" })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "tmv_fault");
      expect(alert).toBeUndefined();
    });

    it("null next_check_date does not trigger check_overdue", () => {
      const records = [makeRecord({ next_check_date: null })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });

    it("future next_check_date does not trigger check_overdue", () => {
      const records = [makeRecord({ next_check_date: daysFromNow(30) })];
      const alerts = identifyWaterSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRecord factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRecord();
    expect(r.home_id).toBe("home-1");
    expect(r.check_type).toBe("temperature_check");
    expect(r.check_date).toBe("2026-05-01");
    expect(r.location).toBe("bathroom_1");
    expect(r.temperature_compliance).toBe("compliant");
    expect(r.risk_level).toBe("low");
    expect(r.tmv_fitted).toBe(false);
    expect(r.tmv_operational).toBe(false);
    expect(r.flushing_completed).toBe(false);
    expect(r.legionella_assessment_current).toBe(true);
    expect(r.scalding_risk_mitigated).toBe(false);
    expect(r.hot_water_temp).toBeNull();
    expect(r.cold_water_temp).toBeNull();
    expect(r.issues_found).toEqual([]);
    expect(r.actions_taken).toEqual([]);
    expect(r.checked_by).toBe("Staff Member");
    expect(r.next_check_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ check_type: "flushing_record", temperature_compliance: "too_hot" });
    expect(r.check_type).toBe("flushing_record");
    expect(r.temperature_compliance).toBe("too_hot");
    // defaults still apply
    expect(r.risk_level).toBe("low");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRecord();
    const r2 = makeRecord();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRecord({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRecord({ next_check_date: null, notes: null, hot_water_temp: null, cold_water_temp: null });
    expect(r.next_check_date).toBeNull();
    expect(r.notes).toBeNull();
    expect(r.hot_water_temp).toBeNull();
    expect(r.cold_water_temp).toBeNull();
  });

  it("allows setting notes to a string", () => {
    const r = makeRecord({ notes: "Test note" });
    expect(r.notes).toBe("Test note");
  });

  it("allows setting next_check_date to a date string", () => {
    const r = makeRecord({ next_check_date: "2026-12-31" });
    expect(r.next_check_date).toBe("2026-12-31");
  });

  it("allows setting issues_found array", () => {
    const r = makeRecord({ issues_found: ["high temp", "leaking valve"] });
    expect(r.issues_found).toEqual(["high temp", "leaking valve"]);
  });

  it("allows setting actions_taken array", () => {
    const r = makeRecord({ actions_taken: ["adjusted TMV", "flushed outlet"] });
    expect(r.actions_taken).toEqual(["adjusted TMV", "flushed outlet"]);
  });

  it("allows setting hot_water_temp to a number", () => {
    const r = makeRecord({ hot_water_temp: 55.5 });
    expect(r.hot_water_temp).toBe(55.5);
  });

  it("allows setting cold_water_temp to a number", () => {
    const r = makeRecord({ cold_water_temp: 12.3 });
    expect(r.cold_water_temp).toBe(12.3);
  });
});
