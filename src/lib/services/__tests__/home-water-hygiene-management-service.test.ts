// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME WATER HYGIENE MANAGEMENT SERVICE TESTS
// Pure-function tests for water hygiene metrics, alert identification,
// ARIA insights, constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  CHECK_TYPES,
  SAMPLE_RESULTS,
  COMPLIANCE_STATUSES,
  CHECK_TYPE_LABELS,
  SAMPLE_RESULT_LABELS,
  COMPLIANCE_STATUS_LABELS,
  _testing,
} from "../home-water-hygiene-management-service";

import type {
  HomeWaterHygieneManagementRow,
  CheckType,
  SampleResult,
  ComplianceStatus,
} from "../home-water-hygiene-management-service";

const {
  computeWaterHygieneManagementMetrics,
  identifyWaterHygieneManagementAlerts,
  generateWaterHygieneManagementAriaInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRow(
  overrides?: Partial<HomeWaterHygieneManagementRow>,
): HomeWaterHygieneManagementRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    check_date: "check_date" in (overrides ?? {}) ? overrides!.check_date! : "2026-05-01",
    checker_name: "checker_name" in (overrides ?? {}) ? overrides!.checker_name! : "John Smith",
    check_type: "check_type" in (overrides ?? {}) ? overrides!.check_type! : "Temperature Monitoring",
    location: "location" in (overrides ?? {}) ? overrides!.location! : "Kitchen",
    hot_water_temp: "hot_water_temp" in (overrides ?? {}) ? (overrides!.hot_water_temp ?? null) : 60,
    cold_water_temp: "cold_water_temp" in (overrides ?? {}) ? (overrides!.cold_water_temp ?? null) : 15,
    return_temp: "return_temp" in (overrides ?? {}) ? (overrides!.return_temp ?? null) : null,
    hot_temp_compliant: "hot_temp_compliant" in (overrides ?? {}) ? overrides!.hot_temp_compliant! : true,
    cold_temp_compliant: "cold_temp_compliant" in (overrides ?? {}) ? overrides!.cold_temp_compliant! : true,
    flushing_completed: "flushing_completed" in (overrides ?? {}) ? overrides!.flushing_completed! : true,
    tmv_functioning: "tmv_functioning" in (overrides ?? {}) ? (overrides!.tmv_functioning ?? null) : null,
    showerhead_descaled: "showerhead_descaled" in (overrides ?? {}) ? (overrides!.showerhead_descaled ?? null) : null,
    dead_legs_identified: "dead_legs_identified" in (overrides ?? {}) ? overrides!.dead_legs_identified! : false,
    sample_taken: "sample_taken" in (overrides ?? {}) ? overrides!.sample_taken! : false,
    sample_result: "sample_result" in (overrides ?? {}) ? (overrides!.sample_result ?? null) : null,
    next_check_date: "next_check_date" in (overrides ?? {}) ? (overrides!.next_check_date ?? null) : null,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Compliant",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  describe("CHECK_TYPES", () => {
    it("has exactly 9 items", () => {
      expect(CHECK_TYPES).toHaveLength(9);
    });

    it("contains Temperature Monitoring", () => {
      expect(CHECK_TYPES).toContain("Temperature Monitoring");
    });

    it("contains Weekly Flushing", () => {
      expect(CHECK_TYPES).toContain("Weekly Flushing");
    });

    it("contains Monthly Flushing", () => {
      expect(CHECK_TYPES).toContain("Monthly Flushing");
    });

    it("contains Quarterly Review", () => {
      expect(CHECK_TYPES).toContain("Quarterly Review");
    });

    it("contains Showerhead Descale", () => {
      expect(CHECK_TYPES).toContain("Showerhead Descale");
    });

    it("contains TMV Service", () => {
      expect(CHECK_TYPES).toContain("TMV Service");
    });

    it("contains Dead Leg Check", () => {
      expect(CHECK_TYPES).toContain("Dead Leg Check");
    });

    it("contains Water Sampling", () => {
      expect(CHECK_TYPES).toContain("Water Sampling");
    });

    it("contains Annual Review", () => {
      expect(CHECK_TYPES).toContain("Annual Review");
    });

    it("has unique values", () => {
      expect(new Set(CHECK_TYPES).size).toBe(CHECK_TYPES.length);
    });

    it("every entry is a non-empty string", () => {
      for (const t of CHECK_TYPES) {
        expect(t.length).toBeGreaterThan(0);
      }
    });
  });

  describe("SAMPLE_RESULTS", () => {
    it("has exactly 4 items", () => {
      expect(SAMPLE_RESULTS).toHaveLength(4);
    });

    it("contains Clear", () => {
      expect(SAMPLE_RESULTS).toContain("Clear");
    });

    it("contains Legionella Detected", () => {
      expect(SAMPLE_RESULTS).toContain("Legionella Detected");
    });

    it("contains Elevated Count", () => {
      expect(SAMPLE_RESULTS).toContain("Elevated Count");
    });

    it("contains Acceptable", () => {
      expect(SAMPLE_RESULTS).toContain("Acceptable");
    });

    it("has unique values", () => {
      expect(new Set(SAMPLE_RESULTS).size).toBe(SAMPLE_RESULTS.length);
    });

    it("every entry is a non-empty string", () => {
      for (const v of SAMPLE_RESULTS) {
        expect(v.length).toBeGreaterThan(0);
      }
    });
  });

  describe("COMPLIANCE_STATUSES", () => {
    it("has exactly 4 items", () => {
      expect(COMPLIANCE_STATUSES).toHaveLength(4);
    });

    it("contains Compliant", () => {
      expect(COMPLIANCE_STATUSES).toContain("Compliant");
    });

    it("contains Non-Compliant", () => {
      expect(COMPLIANCE_STATUSES).toContain("Non-Compliant");
    });

    it("contains Action Required", () => {
      expect(COMPLIANCE_STATUSES).toContain("Action Required");
    });

    it("contains Overdue", () => {
      expect(COMPLIANCE_STATUSES).toContain("Overdue");
    });

    it("has unique values", () => {
      expect(new Set(COMPLIANCE_STATUSES).size).toBe(COMPLIANCE_STATUSES.length);
    });

    it("every entry is a non-empty string", () => {
      for (const s of COMPLIANCE_STATUSES) {
        expect(s.length).toBeGreaterThan(0);
      }
    });
  });

  describe("CHECK_TYPE_LABELS", () => {
    it("has exactly 9 items", () => {
      expect(CHECK_TYPE_LABELS).toHaveLength(9);
    });

    it("has unique type values", () => {
      const types = CHECK_TYPE_LABELS.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = CHECK_TYPE_LABELS.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of CHECK_TYPE_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches CHECK_TYPES values", () => {
      const labelTypes = CHECK_TYPE_LABELS.map((t) => t.type);
      for (const t of CHECK_TYPES) {
        expect(labelTypes).toContain(t);
      }
    });
  });

  describe("SAMPLE_RESULT_LABELS", () => {
    it("has exactly 4 items", () => {
      expect(SAMPLE_RESULT_LABELS).toHaveLength(4);
    });

    it("has unique value fields", () => {
      const values = SAMPLE_RESULT_LABELS.map((r) => r.value);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has unique labels", () => {
      const labels = SAMPLE_RESULT_LABELS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of SAMPLE_RESULT_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches SAMPLE_RESULTS values", () => {
      const labelValues = SAMPLE_RESULT_LABELS.map((r) => r.value);
      for (const v of SAMPLE_RESULTS) {
        expect(labelValues).toContain(v);
      }
    });
  });

  describe("COMPLIANCE_STATUS_LABELS", () => {
    it("has exactly 4 items", () => {
      expect(COMPLIANCE_STATUS_LABELS).toHaveLength(4);
    });

    it("has unique status fields", () => {
      const statuses = COMPLIANCE_STATUS_LABELS.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = COMPLIANCE_STATUS_LABELS.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of COMPLIANCE_STATUS_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches COMPLIANCE_STATUSES values", () => {
      const labelStatuses = COMPLIANCE_STATUS_LABELS.map((s) => s.status);
      for (const s of COMPLIANCE_STATUSES) {
        expect(labelStatuses).toContain(s);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeWaterHygieneManagementMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeWaterHygieneManagementMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_checks", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.total_checks).toBe(0);
    });

    it("returns zero hot_temp_compliant_rate", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.hot_temp_compliant_rate).toBe(0);
    });

    it("returns zero cold_temp_compliant_rate", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.cold_temp_compliant_rate).toBe(0);
    });

    it("returns zero flushing_rate", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.flushing_rate).toBe(0);
    });

    it("returns zero sample_taken_rate", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.sample_taken_rate).toBe(0);
    });

    it("returns zero legionella_detected_count", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.legionella_detected_count).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero action_required_count", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.action_required_count).toBe(0);
    });

    it("returns zero dead_legs_count", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.dead_legs_count).toBe(0);
    });

    it("returns zero avg_hot_temp", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.avg_hot_temp).toBe(0);
    });

    it("returns zero avg_cold_temp", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.avg_cold_temp).toBe(0);
    });

    it("returns zero unique_locations", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.unique_locations).toBe(0);
    });

    it("returns zero unique_checkers", () => {
      const m = computeWaterHygieneManagementMetrics([]);
      expect(m.unique_checkers).toBe(0);
    });
  });

  describe("single compliant record", () => {
    const record = makeRow({
      check_type: "Temperature Monitoring",
      location: "Kitchen",
      hot_water_temp: 60,
      cold_water_temp: 15,
      hot_temp_compliant: true,
      cold_temp_compliant: true,
      flushing_completed: true,
      dead_legs_identified: false,
      sample_taken: true,
      sample_result: "Clear",
      compliance_status: "Compliant",
      checker_name: "John Smith",
    });

    it("returns total_checks = 1", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.total_checks).toBe(1);
    });

    it("returns hot_temp_compliant_rate = 100", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.hot_temp_compliant_rate).toBe(100);
    });

    it("returns cold_temp_compliant_rate = 100", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.cold_temp_compliant_rate).toBe(100);
    });

    it("returns flushing_rate = 100", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.flushing_rate).toBe(100);
    });

    it("returns sample_taken_rate = 100", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.sample_taken_rate).toBe(100);
    });

    it("returns legionella_detected_count = 0", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.legionella_detected_count).toBe(0);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns action_required_count = 0", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.action_required_count).toBe(0);
    });

    it("returns dead_legs_count = 0", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.dead_legs_count).toBe(0);
    });

    it("returns avg_hot_temp = 60", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.avg_hot_temp).toBe(60);
    });

    it("returns avg_cold_temp = 15", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.avg_cold_temp).toBe(15);
    });

    it("returns unique_locations = 1", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.unique_locations).toBe(1);
    });

    it("returns unique_checkers = 1", () => {
      const m = computeWaterHygieneManagementMetrics([record]);
      expect(m.unique_checkers).toBe(1);
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRow({ check_type: "Temperature Monitoring", location: "Kitchen", hot_water_temp: 62, cold_water_temp: 14, hot_temp_compliant: true, cold_temp_compliant: true, flushing_completed: true, dead_legs_identified: false, sample_taken: true, sample_result: "Clear", compliance_status: "Compliant", checker_name: "Checker A" }),
      makeRow({ check_type: "Weekly Flushing", location: "Bathroom 1", hot_water_temp: 45, cold_water_temp: 22, hot_temp_compliant: false, cold_temp_compliant: false, flushing_completed: false, dead_legs_identified: true, sample_taken: false, sample_result: null, compliance_status: "Non-Compliant", checker_name: "Checker B" }),
      makeRow({ check_type: "Water Sampling", location: "Bathroom 2", hot_water_temp: 58, cold_water_temp: 18, hot_temp_compliant: true, cold_temp_compliant: true, flushing_completed: true, dead_legs_identified: false, sample_taken: true, sample_result: "Legionella Detected", compliance_status: "Action Required", checker_name: "Checker A" }),
      makeRow({ check_type: "Dead Leg Check", location: "Utility Room", hot_water_temp: null, cold_water_temp: null, hot_temp_compliant: false, cold_temp_compliant: true, flushing_completed: true, dead_legs_identified: true, sample_taken: false, sample_result: null, compliance_status: "Compliant", checker_name: "Checker C" }),
      makeRow({ check_type: "Showerhead Descale", location: "Bathroom 1", hot_water_temp: 55, cold_water_temp: 16, hot_temp_compliant: true, cold_temp_compliant: true, flushing_completed: false, dead_legs_identified: false, sample_taken: false, sample_result: null, compliance_status: "Compliant", checker_name: "Checker B" }),
    ];

    it("returns total_checks = 5", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.total_checks).toBe(5);
    });

    it("calculates hot_temp_compliant_rate (3/5 = 60%)", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.hot_temp_compliant_rate).toBe(60);
    });

    it("calculates cold_temp_compliant_rate (4/5 = 80%)", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.cold_temp_compliant_rate).toBe(80);
    });

    it("calculates flushing_rate (3/5 = 60%)", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.flushing_rate).toBe(60);
    });

    it("calculates sample_taken_rate (2/5 = 40%)", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.sample_taken_rate).toBe(40);
    });

    it("returns legionella_detected_count = 1", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.legionella_detected_count).toBe(1);
    });

    it("returns non_compliant_count = 1", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("returns action_required_count = 1", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.action_required_count).toBe(1);
    });

    it("returns dead_legs_count = 2", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.dead_legs_count).toBe(2);
    });

    it("calculates avg_hot_temp from non-null values (62+45+58+55)/4 = 55", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_hot_temp).toBe(55);
    });

    it("calculates avg_cold_temp from non-null values (14+22+18+16)/4 = 17.5", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_cold_temp).toBe(17.5);
    });

    it("returns unique_locations = 4 (Kitchen, Bathroom 1, Bathroom 2, Utility Room)", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.unique_locations).toBe(4);
    });

    it("returns unique_checkers = 3", () => {
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.unique_checkers).toBe(3);
    });
  });

  describe("hot_temp_compliant_rate", () => {
    it("returns 100 when all hot temps compliant", () => {
      const records = [
        makeRow({ hot_temp_compliant: true }),
        makeRow({ hot_temp_compliant: true }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.hot_temp_compliant_rate).toBe(100);
    });

    it("returns 0 when no hot temps compliant", () => {
      const records = [
        makeRow({ hot_temp_compliant: false }),
        makeRow({ hot_temp_compliant: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.hot_temp_compliant_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ hot_temp_compliant: true }),
        makeRow({ hot_temp_compliant: false }),
        makeRow({ hot_temp_compliant: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.hot_temp_compliant_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ hot_temp_compliant: true }),
        makeRow({ hot_temp_compliant: true }),
        makeRow({ hot_temp_compliant: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.hot_temp_compliant_rate).toBe(66.7);
    });
  });

  describe("cold_temp_compliant_rate", () => {
    it("returns 100 when all cold temps compliant", () => {
      const records = [
        makeRow({ cold_temp_compliant: true }),
        makeRow({ cold_temp_compliant: true }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.cold_temp_compliant_rate).toBe(100);
    });

    it("returns 0 when no cold temps compliant", () => {
      const records = [
        makeRow({ cold_temp_compliant: false }),
        makeRow({ cold_temp_compliant: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.cold_temp_compliant_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ cold_temp_compliant: true }),
        makeRow({ cold_temp_compliant: false }),
        makeRow({ cold_temp_compliant: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.cold_temp_compliant_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ cold_temp_compliant: true }),
        makeRow({ cold_temp_compliant: true }),
        makeRow({ cold_temp_compliant: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.cold_temp_compliant_rate).toBe(66.7);
    });
  });

  describe("flushing_rate", () => {
    it("returns 100 when all flushing completed", () => {
      const records = [
        makeRow({ flushing_completed: true }),
        makeRow({ flushing_completed: true }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.flushing_rate).toBe(100);
    });

    it("returns 0 when no flushing completed", () => {
      const records = [
        makeRow({ flushing_completed: false }),
        makeRow({ flushing_completed: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.flushing_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ flushing_completed: true }),
        makeRow({ flushing_completed: false }),
        makeRow({ flushing_completed: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.flushing_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ flushing_completed: true }),
        makeRow({ flushing_completed: true }),
        makeRow({ flushing_completed: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.flushing_rate).toBe(66.7);
    });

    it("calculates rate (1/6 = 16.7%)", () => {
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRow({ flushing_completed: i === 0 }),
      );
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.flushing_rate).toBe(16.7);
    });
  });

  describe("sample_taken_rate", () => {
    it("returns 100 when all samples taken", () => {
      const records = [
        makeRow({ sample_taken: true }),
        makeRow({ sample_taken: true }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.sample_taken_rate).toBe(100);
    });

    it("returns 0 when no samples taken", () => {
      const records = [
        makeRow({ sample_taken: false }),
        makeRow({ sample_taken: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.sample_taken_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ sample_taken: true }),
        makeRow({ sample_taken: false }),
        makeRow({ sample_taken: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.sample_taken_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ sample_taken: true }),
        makeRow({ sample_taken: true }),
        makeRow({ sample_taken: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.sample_taken_rate).toBe(66.7);
    });
  });

  describe("legionella_detected_count", () => {
    it("counts only Legionella Detected results", () => {
      const records = [
        makeRow({ sample_result: "Legionella Detected" }),
        makeRow({ sample_result: "Legionella Detected" }),
        makeRow({ sample_result: "Clear" }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.legionella_detected_count).toBe(2);
    });

    it("does not count Clear as Legionella Detected", () => {
      const records = [makeRow({ sample_result: "Clear" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.legionella_detected_count).toBe(0);
    });

    it("does not count Elevated Count as Legionella Detected", () => {
      const records = [makeRow({ sample_result: "Elevated Count" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.legionella_detected_count).toBe(0);
    });

    it("does not count Acceptable as Legionella Detected", () => {
      const records = [makeRow({ sample_result: "Acceptable" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.legionella_detected_count).toBe(0);
    });

    it("does not count null as Legionella Detected", () => {
      const records = [makeRow({ sample_result: null })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.legionella_detected_count).toBe(0);
    });
  });

  describe("non_compliant_count", () => {
    it("counts Non-Compliant", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("does not count Compliant", () => {
      const records = [makeRow({ compliance_status: "Compliant" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Action Required", () => {
      const records = [makeRow({ compliance_status: "Action Required" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Overdue", () => {
      const records = [makeRow({ compliance_status: "Overdue" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("counts multiple Non-Compliant records", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });
  });

  describe("action_required_count", () => {
    it("counts Action Required", () => {
      const records = [makeRow({ compliance_status: "Action Required" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.action_required_count).toBe(1);
    });

    it("does not count Compliant", () => {
      const records = [makeRow({ compliance_status: "Compliant" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.action_required_count).toBe(0);
    });

    it("does not count Non-Compliant", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.action_required_count).toBe(0);
    });

    it("does not count Overdue", () => {
      const records = [makeRow({ compliance_status: "Overdue" })];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.action_required_count).toBe(0);
    });

    it("counts multiple Action Required records", () => {
      const records = [
        makeRow({ compliance_status: "Action Required" }),
        makeRow({ compliance_status: "Action Required" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.action_required_count).toBe(2);
    });
  });

  describe("dead_legs_count", () => {
    it("counts dead_legs_identified = true", () => {
      const records = [
        makeRow({ dead_legs_identified: true }),
        makeRow({ dead_legs_identified: true }),
        makeRow({ dead_legs_identified: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.dead_legs_count).toBe(2);
    });

    it("returns zero when no dead legs identified", () => {
      const records = [
        makeRow({ dead_legs_identified: false }),
        makeRow({ dead_legs_identified: false }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.dead_legs_count).toBe(0);
    });
  });

  describe("avg_hot_temp", () => {
    it("calculates average from non-null hot temps", () => {
      const records = [
        makeRow({ hot_water_temp: 60 }),
        makeRow({ hot_water_temp: 62 }),
        makeRow({ hot_water_temp: null }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_hot_temp).toBe(61);
    });

    it("returns 0 when all hot temps are null", () => {
      const records = [
        makeRow({ hot_water_temp: null }),
        makeRow({ hot_water_temp: null }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_hot_temp).toBe(0);
    });

    it("returns single value when only one non-null", () => {
      const records = [
        makeRow({ hot_water_temp: 58 }),
        makeRow({ hot_water_temp: null }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_hot_temp).toBe(58);
    });

    it("rounds to 1 decimal place", () => {
      const records = [
        makeRow({ hot_water_temp: 60 }),
        makeRow({ hot_water_temp: 61 }),
        makeRow({ hot_water_temp: 62 }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_hot_temp).toBe(61);
    });

    it("rounds correctly for non-terminating decimals (59+60+62)/3 = 60.3", () => {
      const records = [
        makeRow({ hot_water_temp: 59 }),
        makeRow({ hot_water_temp: 60 }),
        makeRow({ hot_water_temp: 62 }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_hot_temp).toBe(60.3);
    });
  });

  describe("avg_cold_temp", () => {
    it("calculates average from non-null cold temps", () => {
      const records = [
        makeRow({ cold_water_temp: 14 }),
        makeRow({ cold_water_temp: 16 }),
        makeRow({ cold_water_temp: null }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_cold_temp).toBe(15);
    });

    it("returns 0 when all cold temps are null", () => {
      const records = [
        makeRow({ cold_water_temp: null }),
        makeRow({ cold_water_temp: null }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_cold_temp).toBe(0);
    });

    it("returns single value when only one non-null", () => {
      const records = [
        makeRow({ cold_water_temp: 12 }),
        makeRow({ cold_water_temp: null }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_cold_temp).toBe(12);
    });

    it("rounds to 1 decimal place", () => {
      const records = [
        makeRow({ cold_water_temp: 14 }),
        makeRow({ cold_water_temp: 15 }),
        makeRow({ cold_water_temp: 16 }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_cold_temp).toBe(15);
    });

    it("rounds correctly for non-terminating decimals (13+14+16)/3 = 14.3", () => {
      const records = [
        makeRow({ cold_water_temp: 13 }),
        makeRow({ cold_water_temp: 14 }),
        makeRow({ cold_water_temp: 16 }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.avg_cold_temp).toBe(14.3);
    });
  });

  describe("unique_locations", () => {
    it("counts distinct locations", () => {
      const records = [
        makeRow({ location: "Kitchen" }),
        makeRow({ location: "Bathroom 1" }),
        makeRow({ location: "Kitchen" }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.unique_locations).toBe(2);
    });

    it("returns 1 when all same location", () => {
      const records = [
        makeRow({ location: "Kitchen" }),
        makeRow({ location: "Kitchen" }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.unique_locations).toBe(1);
    });

    it("treats different locations as different", () => {
      const records = [
        makeRow({ location: "Kitchen" }),
        makeRow({ location: "Bathroom 1" }),
        makeRow({ location: "Bathroom 2" }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.unique_locations).toBe(3);
    });
  });

  describe("unique_checkers", () => {
    it("counts distinct checker names", () => {
      const records = [
        makeRow({ checker_name: "Checker A" }),
        makeRow({ checker_name: "Checker B" }),
        makeRow({ checker_name: "Checker A" }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.unique_checkers).toBe(2);
    });

    it("returns 1 when all same checker", () => {
      const records = [
        makeRow({ checker_name: "John Smith" }),
        makeRow({ checker_name: "John Smith" }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.unique_checkers).toBe(1);
    });

    it("treats different names as different checkers", () => {
      const records = [
        makeRow({ checker_name: "Checker A" }),
        makeRow({ checker_name: "Checker B" }),
        makeRow({ checker_name: "Checker C" }),
      ];
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.unique_checkers).toBe(3);
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: HomeWaterHygieneManagementRow[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRow({
            check_type: i % 2 === 0 ? "Temperature Monitoring" : "Weekly Flushing",
            hot_temp_compliant: i % 3 !== 0,
            cold_temp_compliant: i % 4 !== 0,
            flushing_completed: i % 5 !== 0,
            sample_taken: i % 2 === 0,
            compliance_status: "Compliant",
            checker_name: `Checker ${i % 5}`,
            location: `Location ${i % 10}`,
          }),
        );
      }
      const m = computeWaterHygieneManagementMetrics(records);
      expect(m.total_checks).toBe(100);
      expect(m.unique_checkers).toBe(5);
      expect(m.unique_locations).toBe(10);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyWaterHygieneManagementAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyWaterHygieneManagementAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyWaterHygieneManagementAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRow({
          sample_result: null,
          hot_water_temp: 60,
          cold_water_temp: 15,
          compliance_status: "Compliant",
          flushing_completed: true,
          dead_legs_identified: false,
        }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  // ── legionella_detected alert ────────────────────────────────────────

  describe("legionella_detected alert", () => {
    it("fires when sample_result is Legionella Detected", () => {
      const records = [makeRow({ sample_result: "Legionella Detected" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_detected");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRow({ sample_result: "Legionella Detected" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_detected")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-leg-1", sample_result: "Legionella Detected" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_detected")!;
      expect(alert.record_id).toBe("rec-leg-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ sample_result: "Legionella Detected", location: "Bathroom 1" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_detected")!;
      expect(alert.message).toContain("Bathroom 1");
    });

    it("includes check_date in message", () => {
      const records = [makeRow({ sample_result: "Legionella Detected", check_date: "2026-03-15" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_detected")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("includes HSG274 reference in message", () => {
      const records = [makeRow({ sample_result: "Legionella Detected" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_detected")!;
      expect(alert.message).toContain("HSG274");
    });

    it("does not fire when sample_result is Clear", () => {
      const records = [makeRow({ sample_result: "Clear" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_detected");
      expect(alert).toBeUndefined();
    });

    it("does not fire when sample_result is Elevated Count", () => {
      const records = [makeRow({ sample_result: "Elevated Count" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_detected");
      expect(alert).toBeUndefined();
    });

    it("does not fire when sample_result is Acceptable", () => {
      const records = [makeRow({ sample_result: "Acceptable" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_detected");
      expect(alert).toBeUndefined();
    });

    it("does not fire when sample_result is null", () => {
      const records = [makeRow({ sample_result: null })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "legionella_detected");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Legionella Detected records", () => {
      const records = [
        makeRow({ sample_result: "Legionella Detected" }),
        makeRow({ sample_result: "Legionella Detected" }),
        makeRow({ sample_result: "Clear" }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const legAlerts = alerts.filter((a) => a.type === "legionella_detected");
      expect(legAlerts).toHaveLength(2);
    });
  });

  // ── hot_water_low alert ──────────────────────────────────────────────

  describe("hot_water_low alert", () => {
    it("fires when hot_water_temp is below 50", () => {
      const records = [makeRow({ hot_water_temp: 49 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hot_water_low");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRow({ hot_water_temp: 45 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hot_water_low")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-hot-1", hot_water_temp: 40 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hot_water_low")!;
      expect(alert.record_id).toBe("rec-hot-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ hot_water_temp: 48, location: "Bathroom 2" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hot_water_low")!;
      expect(alert.message).toContain("Bathroom 2");
    });

    it("includes check_date in message", () => {
      const records = [makeRow({ hot_water_temp: 48, check_date: "2026-04-20" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hot_water_low")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("includes temperature value in message", () => {
      const records = [makeRow({ hot_water_temp: 42 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hot_water_low")!;
      expect(alert.message).toContain("42");
    });

    it("includes 50 degrees C threshold reference in message", () => {
      const records = [makeRow({ hot_water_temp: 48 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hot_water_low")!;
      expect(alert.message).toContain("50");
    });

    it("does not fire when hot_water_temp is exactly 50", () => {
      const records = [makeRow({ hot_water_temp: 50 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hot_water_low");
      expect(alert).toBeUndefined();
    });

    it("does not fire when hot_water_temp is above 50", () => {
      const records = [makeRow({ hot_water_temp: 60 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hot_water_low");
      expect(alert).toBeUndefined();
    });

    it("does not fire when hot_water_temp is null", () => {
      const records = [makeRow({ hot_water_temp: null })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hot_water_low");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple low hot water records", () => {
      const records = [
        makeRow({ hot_water_temp: 45 }),
        makeRow({ hot_water_temp: 48 }),
        makeRow({ hot_water_temp: 60 }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const hotAlerts = alerts.filter((a) => a.type === "hot_water_low");
      expect(hotAlerts).toHaveLength(2);
    });
  });

  // ── cold_water_high alert ────────────────────────────────────────────

  describe("cold_water_high alert", () => {
    it("fires when cold_water_temp is above 20", () => {
      const records = [makeRow({ cold_water_temp: 21 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "cold_water_high");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRow({ cold_water_temp: 25 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "cold_water_high")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-cold-1", cold_water_temp: 22 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "cold_water_high")!;
      expect(alert.record_id).toBe("rec-cold-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ cold_water_temp: 23, location: "Utility Room" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "cold_water_high")!;
      expect(alert.message).toContain("Utility Room");
    });

    it("includes check_date in message", () => {
      const records = [makeRow({ cold_water_temp: 23, check_date: "2026-02-10" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "cold_water_high")!;
      expect(alert.message).toContain("2026-02-10");
    });

    it("includes temperature value in message", () => {
      const records = [makeRow({ cold_water_temp: 24 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "cold_water_high")!;
      expect(alert.message).toContain("24");
    });

    it("includes 20 degrees C threshold reference in message", () => {
      const records = [makeRow({ cold_water_temp: 22 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "cold_water_high")!;
      expect(alert.message).toContain("20");
    });

    it("does not fire when cold_water_temp is exactly 20", () => {
      const records = [makeRow({ cold_water_temp: 20 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "cold_water_high");
      expect(alert).toBeUndefined();
    });

    it("does not fire when cold_water_temp is below 20", () => {
      const records = [makeRow({ cold_water_temp: 15 })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "cold_water_high");
      expect(alert).toBeUndefined();
    });

    it("does not fire when cold_water_temp is null", () => {
      const records = [makeRow({ cold_water_temp: null })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "cold_water_high");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple high cold water records", () => {
      const records = [
        makeRow({ cold_water_temp: 22 }),
        makeRow({ cold_water_temp: 25 }),
        makeRow({ cold_water_temp: 15 }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const coldAlerts = alerts.filter((a) => a.type === "cold_water_high");
      expect(coldAlerts).toHaveLength(2);
    });
  });

  // ── non_compliant alert ──────────────────────────────────────────────

  describe("non_compliant alert", () => {
    it("fires when compliance_status is Non-Compliant", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-nc-1", compliance_status: "Non-Compliant" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.record_id).toBe("rec-nc-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant", location: "Kitchen" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("Kitchen");
    });

    it("includes check_date in message", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant", check_date: "2026-01-15" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("2026-01-15");
    });

    it("includes HSG274 reference in message", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("HSG274");
    });

    it("does not fire for Compliant status", () => {
      const records = [makeRow({ compliance_status: "Compliant" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Action Required status", () => {
      const records = [makeRow({ compliance_status: "Action Required" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Overdue status", () => {
      const records = [makeRow({ compliance_status: "Overdue" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Non-Compliant records", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant");
      expect(ncAlerts).toHaveLength(2);
    });
  });

  // ── flushing_incomplete alert ────────────────────────────────────────

  describe("flushing_incomplete alert", () => {
    it("fires when flushing_completed is false", () => {
      const records = [makeRow({ flushing_completed: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "flushing_incomplete");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRow({ flushing_completed: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "flushing_incomplete")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-flush-1", flushing_completed: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "flushing_incomplete")!;
      expect(alert.record_id).toBe("rec-flush-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ flushing_completed: false, location: "Bedroom 3" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "flushing_incomplete")!;
      expect(alert.message).toContain("Bedroom 3");
    });

    it("includes check_date in message", () => {
      const records = [makeRow({ flushing_completed: false, check_date: "2026-02-20" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "flushing_incomplete")!;
      expect(alert.message).toContain("2026-02-20");
    });

    it("does not fire when flushing_completed is true", () => {
      const records = [makeRow({ flushing_completed: true })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "flushing_incomplete");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple incomplete flushing records", () => {
      const records = [
        makeRow({ flushing_completed: false }),
        makeRow({ flushing_completed: false }),
        makeRow({ flushing_completed: true }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const flushAlerts = alerts.filter((a) => a.type === "flushing_incomplete");
      expect(flushAlerts).toHaveLength(2);
    });
  });

  // ── dead_legs_found alert ────────────────────────────────────────────

  describe("dead_legs_found alert", () => {
    it("fires when dead_legs_identified is true", () => {
      const records = [makeRow({ dead_legs_identified: true })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "dead_legs_found");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRow({ dead_legs_identified: true })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "dead_legs_found")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-dl-1", dead_legs_identified: true })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "dead_legs_found")!;
      expect(alert.record_id).toBe("rec-dl-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ dead_legs_identified: true, location: "Laundry Room" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "dead_legs_found")!;
      expect(alert.message).toContain("Laundry Room");
    });

    it("includes check_date in message", () => {
      const records = [makeRow({ dead_legs_identified: true, check_date: "2026-03-01" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "dead_legs_found")!;
      expect(alert.message).toContain("2026-03-01");
    });

    it("includes Legionella risk reference in message", () => {
      const records = [makeRow({ dead_legs_identified: true })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "dead_legs_found")!;
      expect(alert.message).toContain("Legionella");
    });

    it("does not fire when dead_legs_identified is false", () => {
      const records = [makeRow({ dead_legs_identified: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "dead_legs_found");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple dead legs records", () => {
      const records = [
        makeRow({ dead_legs_identified: true }),
        makeRow({ dead_legs_identified: true }),
        makeRow({ dead_legs_identified: false }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const dlAlerts = alerts.filter((a) => a.type === "dead_legs_found");
      expect(dlAlerts).toHaveLength(2);
    });
  });

  // ── combined alerts ──────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can fire all alert types simultaneously", () => {
      const records = [
        makeRow({
          id: "r1",
          sample_result: "Legionella Detected",
          hot_water_temp: 45,
          cold_water_temp: 25,
          compliance_status: "Non-Compliant",
          flushing_completed: false,
          dead_legs_identified: true,
        }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("legionella_detected");
      expect(types).toContain("hot_water_low");
      expect(types).toContain("cold_water_high");
      expect(types).toContain("non_compliant");
      expect(types).toContain("flushing_incomplete");
      expect(types).toContain("dead_legs_found");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRow({
          sample_result: "Legionella Detected",
          hot_water_temp: 45,
          cold_water_temp: 25,
          compliance_status: "Non-Compliant",
          flushing_completed: false,
          dead_legs_identified: true,
        }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      // legionella=1, hot_water_low=1, cold_water_high=1, non_compliant=1, flushing_incomplete=1, dead_legs_found=1
      expect(alerts).toHaveLength(6);
    });

    it("per-record alerts multiply with multiple records", () => {
      const records = [
        makeRow({ sample_result: "Legionella Detected" }),
        makeRow({ sample_result: "Legionella Detected" }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      expect(alerts.filter((a) => a.type === "legionella_detected")).toHaveLength(2);
    });
  });

  // ── alert structure ──────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const records = [
        makeRow({ sample_result: "Legionella Detected", flushing_completed: false }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRow({
          sample_result: "Legionella Detected",
          hot_water_temp: 45,
          cold_water_temp: 25,
          compliance_status: "Non-Compliant",
          flushing_completed: false,
          dead_legs_identified: true,
        }),
      ];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRow({ sample_result: "Legionella Detected" })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  // ── edge cases ───────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("clean record triggers no alerts", () => {
      const records = [makeRow({ sample_result: null, hot_water_temp: 60, cold_water_temp: 15, compliance_status: "Compliant", flushing_completed: true, dead_legs_identified: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("hot_water_temp exactly at 50 does not trigger hot_water_low", () => {
      const records = [makeRow({ hot_water_temp: 50, cold_water_temp: 15, compliance_status: "Compliant", flushing_completed: true, dead_legs_identified: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const hotAlerts = alerts.filter((a) => a.type === "hot_water_low");
      expect(hotAlerts).toHaveLength(0);
    });

    it("cold_water_temp exactly at 20 does not trigger cold_water_high", () => {
      const records = [makeRow({ hot_water_temp: 60, cold_water_temp: 20, compliance_status: "Compliant", flushing_completed: true, dead_legs_identified: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const coldAlerts = alerts.filter((a) => a.type === "cold_water_high");
      expect(coldAlerts).toHaveLength(0);
    });

    it("Compliant status does not trigger non_compliant alert", () => {
      const records = [makeRow({ compliance_status: "Compliant", hot_water_temp: 60, cold_water_temp: 15, flushing_completed: true, dead_legs_identified: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant");
      expect(ncAlerts).toHaveLength(0);
    });

    it("Action Required status does not trigger non_compliant alert", () => {
      const records = [makeRow({ compliance_status: "Action Required", hot_water_temp: 60, cold_water_temp: 15, flushing_completed: true, dead_legs_identified: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant");
      expect(ncAlerts).toHaveLength(0);
    });

    it("Overdue status does not trigger non_compliant alert", () => {
      const records = [makeRow({ compliance_status: "Overdue", hot_water_temp: 60, cold_water_temp: 15, flushing_completed: true, dead_legs_identified: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant");
      expect(ncAlerts).toHaveLength(0);
    });

    it("null temps do not trigger temperature alerts", () => {
      const records = [makeRow({ hot_water_temp: null, cold_water_temp: null, compliance_status: "Compliant", flushing_completed: true, dead_legs_identified: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Elevated Count sample result does not trigger legionella_detected", () => {
      const records = [makeRow({ sample_result: "Elevated Count", hot_water_temp: 60, cold_water_temp: 15, compliance_status: "Compliant", flushing_completed: true, dead_legs_identified: false })];
      const alerts = identifyWaterHygieneManagementAlerts(records);
      const legAlerts = alerts.filter((a) => a.type === "legionella_detected");
      expect(legAlerts).toHaveLength(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateWaterHygieneManagementAriaInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("generateWaterHygieneManagementAriaInsights", () => {
  it("returns exactly 3 insights", () => {
    const records = [makeRow()];
    const insights = generateWaterHygieneManagementAriaInsights(records);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty array", () => {
    const insights = generateWaterHygieneManagementAriaInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [cyan]", () => {
    const records = [makeRow()];
    const insights = generateWaterHygieneManagementAriaInsights(records);
    expect(insights[0]).toMatch(/^\[cyan\]/);
  });

  it("second insight starts with [amber]", () => {
    const records = [makeRow()];
    const insights = generateWaterHygieneManagementAriaInsights(records);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("third insight starts with [reflect]", () => {
    const records = [makeRow()];
    const insights = generateWaterHygieneManagementAriaInsights(records);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("all insights are non-empty strings", () => {
    const records = [makeRow()];
    const insights = generateWaterHygieneManagementAriaInsights(records);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  describe("first insight (cyan) — summary stats", () => {
    it("includes total check count", () => {
      const records = [makeRow(), makeRow(), makeRow()];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[0]).toContain("3 water hygiene checks");
    });

    it("includes unique location count", () => {
      const records = [
        makeRow({ location: "Kitchen" }),
        makeRow({ location: "Bathroom 1" }),
      ];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[0]).toContain("2 locations");
    });

    it("uses singular location for count of 1", () => {
      const records = [makeRow({ location: "Kitchen" })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[0]).toContain("1 location");
    });

    it("includes unique checker count", () => {
      const records = [
        makeRow({ checker_name: "Checker A" }),
        makeRow({ checker_name: "Checker B" }),
      ];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[0]).toContain("2 checkers");
    });

    it("uses singular checker for count of 1", () => {
      const records = [makeRow({ checker_name: "Single Checker" })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[0]).toContain("1 checker");
    });

    it("includes hot water compliance rate", () => {
      const records = [makeRow({ hot_temp_compliant: true })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[0]).toContain("100%");
    });

    it("includes average hot water temperature", () => {
      const records = [makeRow({ hot_water_temp: 60 })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[0]).toContain("60");
    });

    it("includes average cold water temperature", () => {
      const records = [makeRow({ cold_water_temp: 15 })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[0]).toContain("15");
    });
  });

  describe("second insight (amber) — priority concerns", () => {
    it("mentions critical and high alerts when present", () => {
      const records = [makeRow({ sample_result: "Legionella Detected", compliance_status: "Non-Compliant" })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high");
    });

    it("mentions Legionella detection count when alerts present", () => {
      const records = [makeRow({ sample_result: "Legionella Detected" })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[1]).toContain("Legionella");
    });

    it("mentions no critical alerts when all clean", () => {
      const records = [makeRow({ sample_result: null, hot_water_temp: 60, cold_water_temp: 15, compliance_status: "Compliant", flushing_completed: true, dead_legs_identified: false })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[1]).toContain("No critical or high-priority");
    });

    it("mentions HSG274 and ACOP L8 when no alerts", () => {
      const records = [makeRow({ sample_result: null, hot_water_temp: 60, cold_water_temp: 15, compliance_status: "Compliant", flushing_completed: true, dead_legs_identified: false })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[1]).toContain("HSG274");
      expect(insights[1]).toContain("ACOP L8");
    });

    it("uses singular for 1 Legionella sample", () => {
      const records = [makeRow({ sample_result: "Legionella Detected" })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[1]).toContain("sample has");
    });

    it("uses plural for multiple Legionella samples", () => {
      const records = [
        makeRow({ sample_result: "Legionella Detected" }),
        makeRow({ sample_result: "Legionella Detected" }),
      ];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[1]).toContain("samples have");
    });

    it("uses singular for 1 non-compliant check", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[1]).toContain("check is");
    });

    it("uses plural for multiple non-compliant checks", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
      ];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[1]).toContain("checks are");
    });
  });

  describe("third insight (reflect) — reflective question", () => {
    it("mentions Legionella detections when present", () => {
      const records = [makeRow({ sample_result: "Legionella Detected" })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[2]).toContain("Legionella");
    });

    it("uses singular for 1 detection", () => {
      const records = [makeRow({ sample_result: "Legionella Detected" })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[2]).toContain("detection has");
    });

    it("uses plural for multiple detections", () => {
      const records = [
        makeRow({ sample_result: "Legionella Detected" }),
        makeRow({ sample_result: "Legionella Detected" }),
      ];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[2]).toContain("detections have");
    });

    it("asks about dead legs and compliance when no Legionella but issues found", () => {
      const records = [makeRow({ sample_result: null, hot_water_temp: 60, cold_water_temp: 15, dead_legs_identified: true, compliance_status: "Compliant", flushing_completed: true })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[2]).toContain("dead");
    });

    it("asks about dead legs when non-compliant but no legionella", () => {
      const records = [makeRow({ sample_result: null, hot_water_temp: 60, cold_water_temp: 15, dead_legs_identified: false, compliance_status: "Non-Compliant", flushing_completed: true })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[2]).toContain("Non-Compliant");
    });

    it("provides positive reflection when all clean", () => {
      const records = [makeRow({ sample_result: null, hot_water_temp: 60, cold_water_temp: 15, dead_legs_identified: false, compliance_status: "Compliant", flushing_completed: true })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[2]).toContain("no Legionella detections");
    });

    it("asks about staff awareness in positive reflection", () => {
      const records = [makeRow({ sample_result: null, hot_water_temp: 60, cold_water_temp: 15, dead_legs_identified: false, compliance_status: "Compliant", flushing_completed: true })];
      const insights = generateWaterHygieneManagementAriaInsights(records);
      expect(insights[2]).toContain("staff");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// makeRow factory helper validation
// ══════════════════════════════════════════════════════════════════════════════

describe("makeRow factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.check_date).toBe("2026-05-01");
    expect(r.checker_name).toBe("John Smith");
    expect(r.check_type).toBe("Temperature Monitoring");
    expect(r.location).toBe("Kitchen");
    expect(r.hot_water_temp).toBe(60);
    expect(r.cold_water_temp).toBe(15);
    expect(r.return_temp).toBeNull();
    expect(r.hot_temp_compliant).toBe(true);
    expect(r.cold_temp_compliant).toBe(true);
    expect(r.flushing_completed).toBe(true);
    expect(r.tmv_functioning).toBeNull();
    expect(r.showerhead_descaled).toBeNull();
    expect(r.dead_legs_identified).toBe(false);
    expect(r.sample_taken).toBe(false);
    expect(r.sample_result).toBeNull();
    expect(r.next_check_date).toBeNull();
    expect(r.compliance_status).toBe("Compliant");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ check_type: "Weekly Flushing", compliance_status: "Non-Compliant" });
    expect(r.check_type).toBe("Weekly Flushing");
    expect(r.compliance_status).toBe("Non-Compliant");
    // defaults still apply
    expect(r.location).toBe("Kitchen");
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
    const r = makeRow({ hot_water_temp: null, cold_water_temp: null, return_temp: null, sample_result: null, next_check_date: null, notes: null });
    expect(r.hot_water_temp).toBeNull();
    expect(r.cold_water_temp).toBeNull();
    expect(r.return_temp).toBeNull();
    expect(r.sample_result).toBeNull();
    expect(r.next_check_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting temperature values", () => {
    const r = makeRow({ hot_water_temp: 55, cold_water_temp: 18, return_temp: 50 });
    expect(r.hot_water_temp).toBe(55);
    expect(r.cold_water_temp).toBe(18);
    expect(r.return_temp).toBe(50);
  });

  it("allows setting boolean fields", () => {
    const r = makeRow({ hot_temp_compliant: false, cold_temp_compliant: false, flushing_completed: false, dead_legs_identified: true, sample_taken: true });
    expect(r.hot_temp_compliant).toBe(false);
    expect(r.cold_temp_compliant).toBe(false);
    expect(r.flushing_completed).toBe(false);
    expect(r.dead_legs_identified).toBe(true);
    expect(r.sample_taken).toBe(true);
  });

  it("allows setting location", () => {
    const r = makeRow({ location: "Bathroom 2" });
    expect(r.location).toBe("Bathroom 2");
  });

  it("allows setting next_check_date", () => {
    const r = makeRow({ next_check_date: "2027-11-15" });
    expect(r.next_check_date).toBe("2027-11-15");
  });

  it("allows setting notes", () => {
    const r = makeRow({ notes: "Test note" });
    expect(r.notes).toBe("Test note");
  });

  it("allows setting sample_result", () => {
    const r = makeRow({ sample_result: "Legionella Detected" });
    expect(r.sample_result).toBe("Legionella Detected");
  });

  it("allows setting tmv_functioning", () => {
    const r = makeRow({ tmv_functioning: true });
    expect(r.tmv_functioning).toBe(true);
  });

  it("allows setting showerhead_descaled", () => {
    const r = makeRow({ showerhead_descaled: true });
    expect(r.showerhead_descaled).toBe(true);
  });

  it("allows setting checker_name", () => {
    const r = makeRow({ checker_name: "Jane Doe" });
    expect(r.checker_name).toBe("Jane Doe");
  });

  it("allows setting check_date", () => {
    const r = makeRow({ check_date: "2026-06-15" });
    expect(r.check_date).toBe("2026-06-15");
  });
});
