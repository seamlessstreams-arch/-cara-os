// ==============================================================================
// CARA -- HOME EMERGENCY LIGHTING SERVICE TESTS
// Pure-function tests for emergency lighting metrics, alert identification,
// Cara insights, constant validation, and edge cases.
// ==============================================================================

import { describe, it, expect } from "vitest";

import {
  TEST_TYPES,
  LUMINAIRE_TYPES,
  TEST_RESULTS,
  BATTERY_CONDITIONS,
  COMPLIANCE_STATUSES,
  TEST_TYPE_LABELS,
  LUMINAIRE_TYPE_LABELS,
  TEST_RESULT_LABELS,
  BATTERY_CONDITION_LABELS,
  COMPLIANCE_STATUS_LABELS,
  _testing,
} from "../home-emergency-lighting-service";

import type {
  HomeEmergencyLightingRow,
  TestType,
  LuminaireType,
  TestResult,
  BatteryCondition,
  ComplianceStatus,
} from "../home-emergency-lighting-service";

const {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
} = _testing;

// -- Helpers ------------------------------------------------------------------

function makeRow(
  overrides?: Partial<HomeEmergencyLightingRow>,
): HomeEmergencyLightingRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    test_date: "test_date" in (overrides ?? {}) ? overrides!.test_date! : "2026-05-01",
    tester_name: "tester_name" in (overrides ?? {}) ? overrides!.tester_name! : "John Smith",
    test_type: "test_type" in (overrides ?? {}) ? overrides!.test_type! : "Monthly Function Test",
    location: "location" in (overrides ?? {}) ? overrides!.location! : "Main Hallway",
    luminaire_type: "luminaire_type" in (overrides ?? {}) ? overrides!.luminaire_type! : "Self-Contained",
    test_result: "test_result" in (overrides ?? {}) ? overrides!.test_result! : "Pass",
    battery_condition: "battery_condition" in (overrides ?? {}) ? overrides!.battery_condition! : "Good",
    duration_minutes: "duration_minutes" in (overrides ?? {}) ? (overrides!.duration_minutes ?? null) : null,
    illumination_adequate: "illumination_adequate" in (overrides ?? {}) ? overrides!.illumination_adequate! : true,
    escape_route_covered: "escape_route_covered" in (overrides ?? {}) ? overrides!.escape_route_covered! : true,
    signage_visible: "signage_visible" in (overrides ?? {}) ? overrides!.signage_visible! : true,
    fault_identified: "fault_identified" in (overrides ?? {}) ? overrides!.fault_identified! : false,
    fault_rectified: "fault_rectified" in (overrides ?? {}) ? overrides!.fault_rectified! : false,
    next_test_date: "next_test_date" in (overrides ?? {}) ? (overrides!.next_test_date ?? null) : null,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Compliant",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

// ==============================================================================
// CONSTANTS
// ==============================================================================

describe("Constants", () => {
  describe("TEST_TYPES", () => {
    it("has exactly 6 items", () => {
      expect(TEST_TYPES).toHaveLength(6);
    });

    it("contains Monthly Function Test", () => {
      expect(TEST_TYPES).toContain("Monthly Function Test");
    });

    it("contains Annual Duration Test", () => {
      expect(TEST_TYPES).toContain("Annual Duration Test");
    });

    it("contains Quarterly Inspection", () => {
      expect(TEST_TYPES).toContain("Quarterly Inspection");
    });

    it("contains Post-Fault Retest", () => {
      expect(TEST_TYPES).toContain("Post-Fault Retest");
    });

    it("contains Commissioning", () => {
      expect(TEST_TYPES).toContain("Commissioning");
    });

    it("contains Replacement", () => {
      expect(TEST_TYPES).toContain("Replacement");
    });

    it("has unique values", () => {
      expect(new Set(TEST_TYPES).size).toBe(TEST_TYPES.length);
    });

    it("every entry is a non-empty string", () => {
      for (const t of TEST_TYPES) {
        expect(t.length).toBeGreaterThan(0);
      }
    });
  });

  describe("LUMINAIRE_TYPES", () => {
    it("has exactly 6 items", () => {
      expect(LUMINAIRE_TYPES).toHaveLength(6);
    });

    it("contains Self-Contained", () => {
      expect(LUMINAIRE_TYPES).toContain("Self-Contained");
    });

    it("contains Central Battery", () => {
      expect(LUMINAIRE_TYPES).toContain("Central Battery");
    });

    it("contains Maintained", () => {
      expect(LUMINAIRE_TYPES).toContain("Maintained");
    });

    it("contains Non-Maintained", () => {
      expect(LUMINAIRE_TYPES).toContain("Non-Maintained");
    });

    it("contains Combined", () => {
      expect(LUMINAIRE_TYPES).toContain("Combined");
    });

    it("contains Exit Sign", () => {
      expect(LUMINAIRE_TYPES).toContain("Exit Sign");
    });

    it("has unique values", () => {
      expect(new Set(LUMINAIRE_TYPES).size).toBe(LUMINAIRE_TYPES.length);
    });

    it("every entry is a non-empty string", () => {
      for (const l of LUMINAIRE_TYPES) {
        expect(l.length).toBeGreaterThan(0);
      }
    });
  });

  describe("TEST_RESULTS", () => {
    it("has exactly 4 items", () => {
      expect(TEST_RESULTS).toHaveLength(4);
    });

    it("contains Pass", () => {
      expect(TEST_RESULTS).toContain("Pass");
    });

    it("contains Fail", () => {
      expect(TEST_RESULTS).toContain("Fail");
    });

    it("contains Partial", () => {
      expect(TEST_RESULTS).toContain("Partial");
    });

    it("contains Not Tested", () => {
      expect(TEST_RESULTS).toContain("Not Tested");
    });

    it("has unique values", () => {
      expect(new Set(TEST_RESULTS).size).toBe(TEST_RESULTS.length);
    });

    it("every entry is a non-empty string", () => {
      for (const r of TEST_RESULTS) {
        expect(r.length).toBeGreaterThan(0);
      }
    });
  });

  describe("BATTERY_CONDITIONS", () => {
    it("has exactly 6 items", () => {
      expect(BATTERY_CONDITIONS).toHaveLength(6);
    });

    it("contains Good", () => {
      expect(BATTERY_CONDITIONS).toContain("Good");
    });

    it("contains Fair", () => {
      expect(BATTERY_CONDITIONS).toContain("Fair");
    });

    it("contains Poor", () => {
      expect(BATTERY_CONDITIONS).toContain("Poor");
    });

    it("contains Failed", () => {
      expect(BATTERY_CONDITIONS).toContain("Failed");
    });

    it("contains Replaced", () => {
      expect(BATTERY_CONDITIONS).toContain("Replaced");
    });

    it("contains N/A", () => {
      expect(BATTERY_CONDITIONS).toContain("N/A");
    });

    it("has unique values", () => {
      expect(new Set(BATTERY_CONDITIONS).size).toBe(BATTERY_CONDITIONS.length);
    });

    it("every entry is a non-empty string", () => {
      for (const b of BATTERY_CONDITIONS) {
        expect(b.length).toBeGreaterThan(0);
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

    it("contains Remedial Required", () => {
      expect(COMPLIANCE_STATUSES).toContain("Remedial Required");
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

  describe("TEST_TYPE_LABELS", () => {
    it("has exactly 6 items", () => {
      expect(TEST_TYPE_LABELS).toHaveLength(6);
    });

    it("has unique type values", () => {
      const types = TEST_TYPE_LABELS.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = TEST_TYPE_LABELS.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of TEST_TYPE_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches TEST_TYPES values", () => {
      const labelTypes = TEST_TYPE_LABELS.map((t) => t.type);
      for (const t of TEST_TYPES) {
        expect(labelTypes).toContain(t);
      }
    });
  });

  describe("LUMINAIRE_TYPE_LABELS", () => {
    it("has exactly 6 items", () => {
      expect(LUMINAIRE_TYPE_LABELS).toHaveLength(6);
    });

    it("has unique type values", () => {
      const types = LUMINAIRE_TYPE_LABELS.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = LUMINAIRE_TYPE_LABELS.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of LUMINAIRE_TYPE_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches LUMINAIRE_TYPES values", () => {
      const labelTypes = LUMINAIRE_TYPE_LABELS.map((t) => t.type);
      for (const l of LUMINAIRE_TYPES) {
        expect(labelTypes).toContain(l);
      }
    });
  });

  describe("TEST_RESULT_LABELS", () => {
    it("has exactly 4 items", () => {
      expect(TEST_RESULT_LABELS).toHaveLength(4);
    });

    it("has unique result values", () => {
      const results = TEST_RESULT_LABELS.map((r) => r.result);
      expect(new Set(results).size).toBe(results.length);
    });

    it("has unique labels", () => {
      const labels = TEST_RESULT_LABELS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of TEST_RESULT_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches TEST_RESULTS values", () => {
      const labelResults = TEST_RESULT_LABELS.map((r) => r.result);
      for (const r of TEST_RESULTS) {
        expect(labelResults).toContain(r);
      }
    });
  });

  describe("BATTERY_CONDITION_LABELS", () => {
    it("has exactly 6 items", () => {
      expect(BATTERY_CONDITION_LABELS).toHaveLength(6);
    });

    it("has unique condition values", () => {
      const conditions = BATTERY_CONDITION_LABELS.map((b) => b.condition);
      expect(new Set(conditions).size).toBe(conditions.length);
    });

    it("has unique labels", () => {
      const labels = BATTERY_CONDITION_LABELS.map((b) => b.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of BATTERY_CONDITION_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches BATTERY_CONDITIONS values", () => {
      const labelConditions = BATTERY_CONDITION_LABELS.map((b) => b.condition);
      for (const b of BATTERY_CONDITIONS) {
        expect(labelConditions).toContain(b);
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

// ==============================================================================
// computeMetrics
// ==============================================================================

describe("computeMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_tests", () => {
      const m = computeMetrics([]);
      expect(m.total_tests).toBe(0);
    });

    it("returns zero pass_count", () => {
      const m = computeMetrics([]);
      expect(m.pass_count).toBe(0);
    });

    it("returns zero fail_count", () => {
      const m = computeMetrics([]);
      expect(m.fail_count).toBe(0);
    });

    it("returns zero partial_count", () => {
      const m = computeMetrics([]);
      expect(m.partial_count).toBe(0);
    });

    it("returns zero pass_rate", () => {
      const m = computeMetrics([]);
      expect(m.pass_rate).toBe(0);
    });

    it("returns zero battery_good_rate", () => {
      const m = computeMetrics([]);
      expect(m.battery_good_rate).toBe(0);
    });

    it("returns zero battery_poor_rate", () => {
      const m = computeMetrics([]);
      expect(m.battery_poor_rate).toBe(0);
    });

    it("returns zero escape_route_rate", () => {
      const m = computeMetrics([]);
      expect(m.escape_route_rate).toBe(0);
    });

    it("returns zero signage_rate", () => {
      const m = computeMetrics([]);
      expect(m.signage_rate).toBe(0);
    });

    it("returns zero illumination_rate", () => {
      const m = computeMetrics([]);
      expect(m.illumination_rate).toBe(0);
    });

    it("returns zero fault_count", () => {
      const m = computeMetrics([]);
      expect(m.fault_count).toBe(0);
    });

    it("returns zero fault_rectified_rate", () => {
      const m = computeMetrics([]);
      expect(m.fault_rectified_rate).toBe(0);
    });

    it("returns zero avg_duration", () => {
      const m = computeMetrics([]);
      expect(m.avg_duration).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero remedial_count", () => {
      const m = computeMetrics([]);
      expect(m.remedial_count).toBe(0);
    });

    it("returns zero unique_locations", () => {
      const m = computeMetrics([]);
      expect(m.unique_locations).toBe(0);
    });

    it("returns zero unique_testers", () => {
      const m = computeMetrics([]);
      expect(m.unique_testers).toBe(0);
    });
  });

  describe("single compliant record", () => {
    const record = makeRow({
      location: "Main Hallway",
      test_type: "Monthly Function Test",
      test_result: "Pass",
      battery_condition: "Good",
      duration_minutes: 60,
      illumination_adequate: true,
      escape_route_covered: true,
      signage_visible: true,
      fault_identified: false,
      fault_rectified: false,
      compliance_status: "Compliant",
      tester_name: "John Smith",
    });

    it("returns total_tests = 1", () => {
      const m = computeMetrics([record]);
      expect(m.total_tests).toBe(1);
    });

    it("returns pass_count = 1", () => {
      const m = computeMetrics([record]);
      expect(m.pass_count).toBe(1);
    });

    it("returns fail_count = 0", () => {
      const m = computeMetrics([record]);
      expect(m.fail_count).toBe(0);
    });

    it("returns partial_count = 0", () => {
      const m = computeMetrics([record]);
      expect(m.partial_count).toBe(0);
    });

    it("returns pass_rate = 100", () => {
      const m = computeMetrics([record]);
      expect(m.pass_rate).toBe(100);
    });

    it("returns battery_good_rate = 100", () => {
      const m = computeMetrics([record]);
      expect(m.battery_good_rate).toBe(100);
    });

    it("returns battery_poor_rate = 0", () => {
      const m = computeMetrics([record]);
      expect(m.battery_poor_rate).toBe(0);
    });

    it("returns escape_route_rate = 100", () => {
      const m = computeMetrics([record]);
      expect(m.escape_route_rate).toBe(100);
    });

    it("returns signage_rate = 100", () => {
      const m = computeMetrics([record]);
      expect(m.signage_rate).toBe(100);
    });

    it("returns illumination_rate = 100", () => {
      const m = computeMetrics([record]);
      expect(m.illumination_rate).toBe(100);
    });

    it("returns fault_count = 0", () => {
      const m = computeMetrics([record]);
      expect(m.fault_count).toBe(0);
    });

    it("returns fault_rectified_rate = 0 (no faults)", () => {
      const m = computeMetrics([record]);
      expect(m.fault_rectified_rate).toBe(0);
    });

    it("returns avg_duration = 60", () => {
      const m = computeMetrics([record]);
      expect(m.avg_duration).toBe(60);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeMetrics([record]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns remedial_count = 0", () => {
      const m = computeMetrics([record]);
      expect(m.remedial_count).toBe(0);
    });

    it("returns unique_locations = 1", () => {
      const m = computeMetrics([record]);
      expect(m.unique_locations).toBe(1);
    });

    it("returns unique_testers = 1", () => {
      const m = computeMetrics([record]);
      expect(m.unique_testers).toBe(1);
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRow({ location: "Main Hallway", test_result: "Pass", battery_condition: "Good", duration_minutes: 60, illumination_adequate: true, escape_route_covered: true, signage_visible: true, fault_identified: false, fault_rectified: false, compliance_status: "Compliant", tester_name: "Tester A" }),
      makeRow({ location: "Stairwell A", test_result: "Fail", battery_condition: "Failed", duration_minutes: 30, illumination_adequate: false, escape_route_covered: false, signage_visible: false, fault_identified: true, fault_rectified: false, compliance_status: "Non-Compliant", tester_name: "Tester B" }),
      makeRow({ location: "Landing", test_result: "Pass", battery_condition: "Fair", duration_minutes: 90, illumination_adequate: true, escape_route_covered: true, signage_visible: true, fault_identified: false, fault_rectified: false, compliance_status: "Compliant", tester_name: "Tester A" }),
      makeRow({ location: "Kitchen Exit", test_result: "Partial", battery_condition: "Poor", duration_minutes: null, illumination_adequate: true, escape_route_covered: false, signage_visible: true, fault_identified: true, fault_rectified: true, compliance_status: "Remedial Required", tester_name: "Tester C" }),
      makeRow({ location: "Front Door", test_result: "Pass", battery_condition: "Replaced", duration_minutes: 45, illumination_adequate: false, escape_route_covered: true, signage_visible: false, fault_identified: false, fault_rectified: false, compliance_status: "Compliant", tester_name: "Tester B" }),
    ];

    it("returns total_tests = 5", () => {
      const m = computeMetrics(records);
      expect(m.total_tests).toBe(5);
    });

    it("returns pass_count = 3", () => {
      const m = computeMetrics(records);
      expect(m.pass_count).toBe(3);
    });

    it("returns fail_count = 1", () => {
      const m = computeMetrics(records);
      expect(m.fail_count).toBe(1);
    });

    it("returns partial_count = 1", () => {
      const m = computeMetrics(records);
      expect(m.partial_count).toBe(1);
    });

    it("calculates pass_rate (3/5 = 60%)", () => {
      const m = computeMetrics(records);
      expect(m.pass_rate).toBe(60);
    });

    it("calculates battery_good_rate (Good+Fair = 2/5 = 40%)", () => {
      const m = computeMetrics(records);
      expect(m.battery_good_rate).toBe(40);
    });

    it("calculates battery_poor_rate (Poor+Failed = 2/5 = 40%)", () => {
      const m = computeMetrics(records);
      expect(m.battery_poor_rate).toBe(40);
    });

    it("calculates escape_route_rate (3/5 = 60%)", () => {
      const m = computeMetrics(records);
      expect(m.escape_route_rate).toBe(60);
    });

    it("calculates signage_rate (3/5 = 60%)", () => {
      const m = computeMetrics(records);
      expect(m.signage_rate).toBe(60);
    });

    it("calculates illumination_rate (3/5 = 60%)", () => {
      const m = computeMetrics(records);
      expect(m.illumination_rate).toBe(60);
    });

    it("returns fault_count = 2", () => {
      const m = computeMetrics(records);
      expect(m.fault_count).toBe(2);
    });

    it("calculates fault_rectified_rate (1/2 faults rectified = 50%)", () => {
      const m = computeMetrics(records);
      expect(m.fault_rectified_rate).toBe(50);
    });

    it("calculates avg_duration ((60+30+90+45)/4 = 56.3, excludes null)", () => {
      const m = computeMetrics(records);
      expect(m.avg_duration).toBe(56.3);
    });

    it("returns non_compliant_count = 1", () => {
      const m = computeMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("returns remedial_count = 1", () => {
      const m = computeMetrics(records);
      expect(m.remedial_count).toBe(1);
    });

    it("returns unique_locations = 5", () => {
      const m = computeMetrics(records);
      expect(m.unique_locations).toBe(5);
    });

    it("returns unique_testers = 3", () => {
      const m = computeMetrics(records);
      expect(m.unique_testers).toBe(3);
    });
  });

  describe("pass_rate", () => {
    it("returns 100 when all pass", () => {
      const records = [
        makeRow({ test_result: "Pass" }),
        makeRow({ test_result: "Pass" }),
      ];
      const m = computeMetrics(records);
      expect(m.pass_rate).toBe(100);
    });

    it("returns 0 when none pass", () => {
      const records = [
        makeRow({ test_result: "Fail" }),
        makeRow({ test_result: "Fail" }),
      ];
      const m = computeMetrics(records);
      expect(m.pass_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ test_result: "Pass" }),
        makeRow({ test_result: "Fail" }),
        makeRow({ test_result: "Fail" }),
      ];
      const m = computeMetrics(records);
      expect(m.pass_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ test_result: "Pass" }),
        makeRow({ test_result: "Pass" }),
        makeRow({ test_result: "Fail" }),
      ];
      const m = computeMetrics(records);
      expect(m.pass_rate).toBe(66.7);
    });
  });

  describe("battery_good_rate", () => {
    it("returns 100 when all Good", () => {
      const records = [
        makeRow({ battery_condition: "Good" }),
        makeRow({ battery_condition: "Good" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_good_rate).toBe(100);
    });

    it("returns 100 when all Fair", () => {
      const records = [
        makeRow({ battery_condition: "Fair" }),
        makeRow({ battery_condition: "Fair" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_good_rate).toBe(100);
    });

    it("includes both Good and Fair", () => {
      const records = [
        makeRow({ battery_condition: "Good" }),
        makeRow({ battery_condition: "Fair" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_good_rate).toBe(100);
    });

    it("returns 0 when none Good or Fair", () => {
      const records = [
        makeRow({ battery_condition: "Poor" }),
        makeRow({ battery_condition: "Failed" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_good_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ battery_condition: "Good" }),
        makeRow({ battery_condition: "Poor" }),
        makeRow({ battery_condition: "Failed" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_good_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ battery_condition: "Good" }),
        makeRow({ battery_condition: "Fair" }),
        makeRow({ battery_condition: "Failed" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_good_rate).toBe(66.7);
    });

    it("does not count Replaced as good", () => {
      const records = [
        makeRow({ battery_condition: "Replaced" }),
        makeRow({ battery_condition: "N/A" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_good_rate).toBe(0);
    });
  });

  describe("battery_poor_rate", () => {
    it("returns 100 when all Poor", () => {
      const records = [
        makeRow({ battery_condition: "Poor" }),
        makeRow({ battery_condition: "Poor" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_poor_rate).toBe(100);
    });

    it("returns 100 when all Failed", () => {
      const records = [
        makeRow({ battery_condition: "Failed" }),
        makeRow({ battery_condition: "Failed" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_poor_rate).toBe(100);
    });

    it("includes both Poor and Failed", () => {
      const records = [
        makeRow({ battery_condition: "Poor" }),
        makeRow({ battery_condition: "Failed" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_poor_rate).toBe(100);
    });

    it("returns 0 when none Poor or Failed", () => {
      const records = [
        makeRow({ battery_condition: "Good" }),
        makeRow({ battery_condition: "Fair" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_poor_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ battery_condition: "Poor" }),
        makeRow({ battery_condition: "Good" }),
        makeRow({ battery_condition: "Fair" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_poor_rate).toBe(33.3);
    });

    it("does not count Replaced as poor", () => {
      const records = [
        makeRow({ battery_condition: "Replaced" }),
        makeRow({ battery_condition: "N/A" }),
      ];
      const m = computeMetrics(records);
      expect(m.battery_poor_rate).toBe(0);
    });
  });

  describe("escape_route_rate", () => {
    it("returns 100 when all escape routes covered", () => {
      const records = [
        makeRow({ escape_route_covered: true }),
        makeRow({ escape_route_covered: true }),
      ];
      const m = computeMetrics(records);
      expect(m.escape_route_rate).toBe(100);
    });

    it("returns 0 when no escape routes covered", () => {
      const records = [
        makeRow({ escape_route_covered: false }),
        makeRow({ escape_route_covered: false }),
      ];
      const m = computeMetrics(records);
      expect(m.escape_route_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ escape_route_covered: true }),
        makeRow({ escape_route_covered: false }),
        makeRow({ escape_route_covered: false }),
      ];
      const m = computeMetrics(records);
      expect(m.escape_route_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ escape_route_covered: true }),
        makeRow({ escape_route_covered: true }),
        makeRow({ escape_route_covered: false }),
      ];
      const m = computeMetrics(records);
      expect(m.escape_route_rate).toBe(66.7);
    });
  });

  describe("signage_rate", () => {
    it("returns 100 when all signage visible", () => {
      const records = [
        makeRow({ signage_visible: true }),
        makeRow({ signage_visible: true }),
      ];
      const m = computeMetrics(records);
      expect(m.signage_rate).toBe(100);
    });

    it("returns 0 when no signage visible", () => {
      const records = [
        makeRow({ signage_visible: false }),
        makeRow({ signage_visible: false }),
      ];
      const m = computeMetrics(records);
      expect(m.signage_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ signage_visible: true }),
        makeRow({ signage_visible: false }),
        makeRow({ signage_visible: false }),
      ];
      const m = computeMetrics(records);
      expect(m.signage_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ signage_visible: true }),
        makeRow({ signage_visible: true }),
        makeRow({ signage_visible: false }),
      ];
      const m = computeMetrics(records);
      expect(m.signage_rate).toBe(66.7);
    });
  });

  describe("illumination_rate", () => {
    it("returns 100 when all illumination adequate", () => {
      const records = [
        makeRow({ illumination_adequate: true }),
        makeRow({ illumination_adequate: true }),
      ];
      const m = computeMetrics(records);
      expect(m.illumination_rate).toBe(100);
    });

    it("returns 0 when no illumination adequate", () => {
      const records = [
        makeRow({ illumination_adequate: false }),
        makeRow({ illumination_adequate: false }),
      ];
      const m = computeMetrics(records);
      expect(m.illumination_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ illumination_adequate: true }),
        makeRow({ illumination_adequate: false }),
        makeRow({ illumination_adequate: false }),
      ];
      const m = computeMetrics(records);
      expect(m.illumination_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ illumination_adequate: true }),
        makeRow({ illumination_adequate: true }),
        makeRow({ illumination_adequate: false }),
      ];
      const m = computeMetrics(records);
      expect(m.illumination_rate).toBe(66.7);
    });

    it("calculates rate (1/6 = 16.7%)", () => {
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRow({ illumination_adequate: i === 0 }),
      );
      const m = computeMetrics(records);
      expect(m.illumination_rate).toBe(16.7);
    });
  });

  describe("fault_count", () => {
    it("counts fault_identified = true", () => {
      const records = [
        makeRow({ fault_identified: true }),
        makeRow({ fault_identified: true }),
        makeRow({ fault_identified: false }),
      ];
      const m = computeMetrics(records);
      expect(m.fault_count).toBe(2);
    });

    it("returns 0 when no faults", () => {
      const records = [
        makeRow({ fault_identified: false }),
        makeRow({ fault_identified: false }),
      ];
      const m = computeMetrics(records);
      expect(m.fault_count).toBe(0);
    });
  });

  describe("fault_rectified_rate", () => {
    it("returns 100 when all faults rectified", () => {
      const records = [
        makeRow({ fault_identified: true, fault_rectified: true }),
        makeRow({ fault_identified: true, fault_rectified: true }),
      ];
      const m = computeMetrics(records);
      expect(m.fault_rectified_rate).toBe(100);
    });

    it("returns 0 when no faults rectified", () => {
      const records = [
        makeRow({ fault_identified: true, fault_rectified: false }),
        makeRow({ fault_identified: true, fault_rectified: false }),
      ];
      const m = computeMetrics(records);
      expect(m.fault_rectified_rate).toBe(0);
    });

    it("returns 0 when no faults identified", () => {
      const records = [
        makeRow({ fault_identified: false }),
        makeRow({ fault_identified: false }),
      ];
      const m = computeMetrics(records);
      expect(m.fault_rectified_rate).toBe(0);
    });

    it("calculates mixed rate (1/2 = 50%)", () => {
      const records = [
        makeRow({ fault_identified: true, fault_rectified: true }),
        makeRow({ fault_identified: true, fault_rectified: false }),
      ];
      const m = computeMetrics(records);
      expect(m.fault_rectified_rate).toBe(50);
    });

    it("calculates rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ fault_identified: true, fault_rectified: true }),
        makeRow({ fault_identified: true, fault_rectified: false }),
        makeRow({ fault_identified: true, fault_rectified: false }),
      ];
      const m = computeMetrics(records);
      expect(m.fault_rectified_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ fault_identified: true, fault_rectified: true }),
        makeRow({ fault_identified: true, fault_rectified: true }),
        makeRow({ fault_identified: true, fault_rectified: false }),
      ];
      const m = computeMetrics(records);
      expect(m.fault_rectified_rate).toBe(66.7);
    });

    it("ignores rows where fault_identified is false", () => {
      const records = [
        makeRow({ fault_identified: true, fault_rectified: true }),
        makeRow({ fault_identified: false, fault_rectified: false }),
      ];
      const m = computeMetrics(records);
      expect(m.fault_rectified_rate).toBe(100);
    });

    it("scopes to fault_identified rows only (2/2 = 100%)", () => {
      const records = [
        makeRow({ fault_identified: true, fault_rectified: true }),
        makeRow({ fault_identified: true, fault_rectified: true }),
        makeRow({ fault_identified: false, fault_rectified: false }),
        makeRow({ fault_identified: false, fault_rectified: false }),
      ];
      const m = computeMetrics(records);
      expect(m.fault_rectified_rate).toBe(100);
    });
  });

  describe("avg_duration", () => {
    it("returns exact value for single record", () => {
      const records = [makeRow({ duration_minutes: 60 })];
      const m = computeMetrics(records);
      expect(m.avg_duration).toBe(60);
    });

    it("calculates average of two records", () => {
      const records = [
        makeRow({ duration_minutes: 30 }),
        makeRow({ duration_minutes: 60 }),
      ];
      const m = computeMetrics(records);
      expect(m.avg_duration).toBe(45);
    });

    it("calculates average with 1 decimal place", () => {
      const records = [
        makeRow({ duration_minutes: 30 }),
        makeRow({ duration_minutes: 60 }),
        makeRow({ duration_minutes: 14 }),
      ];
      const m = computeMetrics(records);
      // (30+60+14)/3 = 34.666... => 34.7
      expect(m.avg_duration).toBe(34.7);
    });

    it("returns 0 for empty array", () => {
      const m = computeMetrics([]);
      expect(m.avg_duration).toBe(0);
    });

    it("excludes null duration_minutes", () => {
      const records = [
        makeRow({ duration_minutes: 60 }),
        makeRow({ duration_minutes: null }),
      ];
      const m = computeMetrics(records);
      expect(m.avg_duration).toBe(60);
    });

    it("returns 0 when all durations are null", () => {
      const records = [
        makeRow({ duration_minutes: null }),
        makeRow({ duration_minutes: null }),
      ];
      const m = computeMetrics(records);
      expect(m.avg_duration).toBe(0);
    });

    it("handles all same values", () => {
      const records = [
        makeRow({ duration_minutes: 30 }),
        makeRow({ duration_minutes: 30 }),
        makeRow({ duration_minutes: 30 }),
      ];
      const m = computeMetrics(records);
      expect(m.avg_duration).toBe(30);
    });

    it("handles large duration values", () => {
      const records = [
        makeRow({ duration_minutes: 180 }),
        makeRow({ duration_minutes: 120 }),
      ];
      const m = computeMetrics(records);
      expect(m.avg_duration).toBe(150);
    });
  });

  describe("non_compliant_count", () => {
    it("counts Non-Compliant status", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const m = computeMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("does not count Compliant", () => {
      const records = [makeRow({ compliance_status: "Compliant" })];
      const m = computeMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Remedial Required", () => {
      const records = [makeRow({ compliance_status: "Remedial Required" })];
      const m = computeMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Overdue", () => {
      const records = [makeRow({ compliance_status: "Overdue" })];
      const m = computeMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("counts multiple Non-Compliant records", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const m = computeMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });
  });

  describe("remedial_count", () => {
    it("counts Remedial Required status", () => {
      const records = [makeRow({ compliance_status: "Remedial Required" })];
      const m = computeMetrics(records);
      expect(m.remedial_count).toBe(1);
    });

    it("does not count Compliant", () => {
      const records = [makeRow({ compliance_status: "Compliant" })];
      const m = computeMetrics(records);
      expect(m.remedial_count).toBe(0);
    });

    it("does not count Non-Compliant", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const m = computeMetrics(records);
      expect(m.remedial_count).toBe(0);
    });

    it("does not count Overdue", () => {
      const records = [makeRow({ compliance_status: "Overdue" })];
      const m = computeMetrics(records);
      expect(m.remedial_count).toBe(0);
    });

    it("counts multiple Remedial Required records", () => {
      const records = [
        makeRow({ compliance_status: "Remedial Required" }),
        makeRow({ compliance_status: "Remedial Required" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const m = computeMetrics(records);
      expect(m.remedial_count).toBe(2);
    });
  });

  describe("unique_locations", () => {
    it("counts distinct locations", () => {
      const records = [
        makeRow({ location: "Main Hallway" }),
        makeRow({ location: "Stairwell A" }),
        makeRow({ location: "Main Hallway" }),
      ];
      const m = computeMetrics(records);
      expect(m.unique_locations).toBe(2);
    });

    it("returns 1 when all same location", () => {
      const records = [
        makeRow({ location: "Main Hallway" }),
        makeRow({ location: "Main Hallway" }),
      ];
      const m = computeMetrics(records);
      expect(m.unique_locations).toBe(1);
    });

    it("treats different locations as different", () => {
      const records = [
        makeRow({ location: "Main Hallway" }),
        makeRow({ location: "Stairwell A" }),
        makeRow({ location: "Kitchen Exit" }),
      ];
      const m = computeMetrics(records);
      expect(m.unique_locations).toBe(3);
    });
  });

  describe("unique_testers", () => {
    it("counts distinct tester names", () => {
      const records = [
        makeRow({ tester_name: "Tester A" }),
        makeRow({ tester_name: "Tester B" }),
        makeRow({ tester_name: "Tester A" }),
      ];
      const m = computeMetrics(records);
      expect(m.unique_testers).toBe(2);
    });

    it("returns 1 when all same tester", () => {
      const records = [
        makeRow({ tester_name: "John Smith" }),
        makeRow({ tester_name: "John Smith" }),
      ];
      const m = computeMetrics(records);
      expect(m.unique_testers).toBe(1);
    });

    it("treats different names as different testers", () => {
      const records = [
        makeRow({ tester_name: "Tester A" }),
        makeRow({ tester_name: "Tester B" }),
        makeRow({ tester_name: "Tester C" }),
      ];
      const m = computeMetrics(records);
      expect(m.unique_testers).toBe(3);
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: HomeEmergencyLightingRow[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRow({
            test_result: i % 2 === 0 ? "Pass" : "Fail",
            battery_condition: i % 3 === 0 ? "Good" : "Poor",
            illumination_adequate: i % 4 !== 0,
            escape_route_covered: i % 5 !== 0,
            signage_visible: i % 6 !== 0,
            compliance_status: "Compliant",
            tester_name: `Tester ${i % 5}`,
            location: `Location ${i % 10}`,
          }),
        );
      }
      const m = computeMetrics(records);
      expect(m.total_tests).toBe(100);
      expect(m.unique_testers).toBe(5);
      expect(m.unique_locations).toBe(10);
    });
  });
});

// ==============================================================================
// computeAlerts
// ==============================================================================

describe("computeAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = computeAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRow({
          test_result: "Pass",
          escape_route_covered: true,
          battery_condition: "Good",
          compliance_status: "Compliant",
          fault_identified: false,
          illumination_adequate: true,
        }),
      ];
      const alerts = computeAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  // -- fail_escape_route alert ------------------------------------------------

  describe("fail_escape_route alert", () => {
    it("fires when test_result is Fail and escape_route_covered is false", () => {
      const records = [makeRow({ test_result: "Fail", escape_route_covered: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fail_escape_route");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRow({ test_result: "Fail", escape_route_covered: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fail_escape_route")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-fer-1", test_result: "Fail", escape_route_covered: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fail_escape_route")!;
      expect(alert.record_id).toBe("rec-fer-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ test_result: "Fail", escape_route_covered: false, location: "Stairwell B" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fail_escape_route")!;
      expect(alert.message).toContain("Stairwell B");
    });

    it("includes test_date in message", () => {
      const records = [makeRow({ test_result: "Fail", escape_route_covered: false, test_date: "2026-03-15" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fail_escape_route")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("does not fire when test_result is Pass", () => {
      const records = [makeRow({ test_result: "Pass", escape_route_covered: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fail_escape_route");
      expect(alert).toBeUndefined();
    });

    it("does not fire when escape_route_covered is true", () => {
      const records = [makeRow({ test_result: "Fail", escape_route_covered: true })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fail_escape_route");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple failing records", () => {
      const records = [
        makeRow({ test_result: "Fail", escape_route_covered: false }),
        makeRow({ test_result: "Fail", escape_route_covered: false }),
        makeRow({ test_result: "Pass", escape_route_covered: true }),
      ];
      const alerts = computeAlerts(records);
      const ferAlerts = alerts.filter((a) => a.type === "fail_escape_route");
      expect(ferAlerts).toHaveLength(2);
    });
  });

  // -- failed_battery alert ---------------------------------------------------

  describe("failed_battery alert", () => {
    it("fires when battery_condition is Failed", () => {
      const records = [makeRow({ battery_condition: "Failed" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_battery");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRow({ battery_condition: "Failed" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_battery")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-fb-1", battery_condition: "Failed" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_battery")!;
      expect(alert.record_id).toBe("rec-fb-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ battery_condition: "Failed", location: "Kitchen Exit" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_battery")!;
      expect(alert.message).toContain("Kitchen Exit");
    });

    it("includes test_date in message", () => {
      const records = [makeRow({ battery_condition: "Failed", test_date: "2026-04-20" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_battery")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("does not fire when battery_condition is Good", () => {
      const records = [makeRow({ battery_condition: "Good" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_battery");
      expect(alert).toBeUndefined();
    });

    it("does not fire when battery_condition is Poor", () => {
      const records = [makeRow({ battery_condition: "Poor" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_battery");
      expect(alert).toBeUndefined();
    });

    it("does not fire when battery_condition is Fair", () => {
      const records = [makeRow({ battery_condition: "Fair" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "failed_battery");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple failed batteries", () => {
      const records = [
        makeRow({ battery_condition: "Failed" }),
        makeRow({ battery_condition: "Failed" }),
        makeRow({ battery_condition: "Good" }),
      ];
      const alerts = computeAlerts(records);
      const fbAlerts = alerts.filter((a) => a.type === "failed_battery");
      expect(fbAlerts).toHaveLength(2);
    });
  });

  // -- non_compliant_status alert ---------------------------------------------

  describe("non_compliant_status alert", () => {
    it("fires when compliance_status is Non-Compliant", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-nc-1", compliance_status: "Non-Compliant" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.record_id).toBe("rec-nc-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant", location: "Landing" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.message).toContain("Landing");
    });

    it("includes test_date in message", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant", test_date: "2026-02-20" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.message).toContain("2026-02-20");
    });

    it("does not fire when compliance_status is Compliant", () => {
      const records = [makeRow({ compliance_status: "Compliant" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeUndefined();
    });

    it("does not fire when compliance_status is Remedial Required", () => {
      const records = [makeRow({ compliance_status: "Remedial Required" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeUndefined();
    });

    it("does not fire when compliance_status is Overdue", () => {
      const records = [makeRow({ compliance_status: "Overdue" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Non-Compliant records", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const alerts = computeAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_status");
      expect(ncAlerts).toHaveLength(2);
    });
  });

  // -- fault_not_rectified alert ----------------------------------------------

  describe("fault_not_rectified alert", () => {
    it("fires when fault_identified and not fault_rectified", () => {
      const records = [makeRow({ fault_identified: true, fault_rectified: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fault_not_rectified");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRow({ fault_identified: true, fault_rectified: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fault_not_rectified")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-fnr-1", fault_identified: true, fault_rectified: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fault_not_rectified")!;
      expect(alert.record_id).toBe("rec-fnr-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ fault_identified: true, fault_rectified: false, location: "Utility Room" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fault_not_rectified")!;
      expect(alert.message).toContain("Utility Room");
    });

    it("includes test_date in message", () => {
      const records = [makeRow({ fault_identified: true, fault_rectified: false, test_date: "2026-03-01" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fault_not_rectified")!;
      expect(alert.message).toContain("2026-03-01");
    });

    it("does not fire when fault_identified is false", () => {
      const records = [makeRow({ fault_identified: false, fault_rectified: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fault_not_rectified");
      expect(alert).toBeUndefined();
    });

    it("does not fire when fault_rectified is true", () => {
      const records = [makeRow({ fault_identified: true, fault_rectified: true })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "fault_not_rectified");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple unrectified faults", () => {
      const records = [
        makeRow({ fault_identified: true, fault_rectified: false }),
        makeRow({ fault_identified: true, fault_rectified: false }),
        makeRow({ fault_identified: true, fault_rectified: true }),
      ];
      const alerts = computeAlerts(records);
      const fnrAlerts = alerts.filter((a) => a.type === "fault_not_rectified");
      expect(fnrAlerts).toHaveLength(2);
    });
  });

  // -- partial_result alert ---------------------------------------------------

  describe("partial_result alert", () => {
    it("fires when test_result is Partial", () => {
      const records = [makeRow({ test_result: "Partial" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "partial_result");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRow({ test_result: "Partial" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "partial_result")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-pr-1", test_result: "Partial" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "partial_result")!;
      expect(alert.record_id).toBe("rec-pr-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ test_result: "Partial", location: "Back Corridor" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "partial_result")!;
      expect(alert.message).toContain("Back Corridor");
    });

    it("includes test_date in message", () => {
      const records = [makeRow({ test_result: "Partial", test_date: "2026-01-15" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "partial_result")!;
      expect(alert.message).toContain("2026-01-15");
    });

    it("does not fire when test_result is Pass", () => {
      const records = [makeRow({ test_result: "Pass" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "partial_result");
      expect(alert).toBeUndefined();
    });

    it("does not fire when test_result is Fail", () => {
      const records = [makeRow({ test_result: "Fail" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "partial_result");
      expect(alert).toBeUndefined();
    });

    it("does not fire when test_result is Not Tested", () => {
      const records = [makeRow({ test_result: "Not Tested" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "partial_result");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple partial results", () => {
      const records = [
        makeRow({ test_result: "Partial" }),
        makeRow({ test_result: "Partial" }),
        makeRow({ test_result: "Pass" }),
      ];
      const alerts = computeAlerts(records);
      const prAlerts = alerts.filter((a) => a.type === "partial_result");
      expect(prAlerts).toHaveLength(2);
    });
  });

  // -- illumination_inadequate alert ------------------------------------------

  describe("illumination_inadequate alert", () => {
    it("fires when illumination_adequate is false", () => {
      const records = [makeRow({ illumination_adequate: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "illumination_inadequate");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRow({ illumination_adequate: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "illumination_inadequate")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-ii-1", illumination_adequate: false })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "illumination_inadequate")!;
      expect(alert.record_id).toBe("rec-ii-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ illumination_adequate: false, location: "Fire Escape" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "illumination_inadequate")!;
      expect(alert.message).toContain("Fire Escape");
    });

    it("includes test_date in message", () => {
      const records = [makeRow({ illumination_adequate: false, test_date: "2026-02-10" })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "illumination_inadequate")!;
      expect(alert.message).toContain("2026-02-10");
    });

    it("does not fire when illumination_adequate is true", () => {
      const records = [makeRow({ illumination_adequate: true })];
      const alerts = computeAlerts(records);
      const alert = alerts.find((a) => a.type === "illumination_inadequate");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple inadequate records", () => {
      const records = [
        makeRow({ illumination_adequate: false }),
        makeRow({ illumination_adequate: false }),
        makeRow({ illumination_adequate: true }),
      ];
      const alerts = computeAlerts(records);
      const iiAlerts = alerts.filter((a) => a.type === "illumination_inadequate");
      expect(iiAlerts).toHaveLength(2);
    });
  });

  // -- combined alerts --------------------------------------------------------

  describe("combined alerts", () => {
    it("can fire all alert types simultaneously", () => {
      const records = [
        makeRow({
          id: "r1",
          test_result: "Fail",
          escape_route_covered: false,
          battery_condition: "Failed",
          compliance_status: "Non-Compliant",
          fault_identified: true,
          fault_rectified: false,
          illumination_adequate: false,
        }),
      ];
      const alerts = computeAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("fail_escape_route");
      expect(types).toContain("failed_battery");
      expect(types).toContain("non_compliant_status");
      expect(types).toContain("fault_not_rectified");
      expect(types).toContain("illumination_inadequate");
    });

    it("fires partial_result in combined scenario", () => {
      const records = [
        makeRow({
          test_result: "Partial",
          illumination_adequate: false,
        }),
      ];
      const alerts = computeAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("partial_result");
      expect(types).toContain("illumination_inadequate");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRow({
          test_result: "Fail",
          escape_route_covered: false,
          battery_condition: "Failed",
          compliance_status: "Non-Compliant",
          fault_identified: true,
          fault_rectified: false,
          illumination_adequate: false,
        }),
      ];
      const alerts = computeAlerts(records);
      // fail_escape_route=1, failed_battery=1, non_compliant=1, fault_not_rectified=1, illumination_inadequate=1
      // note: partial_result not fired because test_result is Fail not Partial
      expect(alerts).toHaveLength(5);
    });

    it("per-record alerts multiply with multiple records", () => {
      const records = [
        makeRow({ battery_condition: "Failed" }),
        makeRow({ battery_condition: "Failed" }),
      ];
      const alerts = computeAlerts(records);
      expect(alerts.filter((a) => a.type === "failed_battery")).toHaveLength(2);
    });
  });

  // -- alert structure --------------------------------------------------------

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const records = [
        makeRow({ battery_condition: "Failed", illumination_adequate: false }),
      ];
      const alerts = computeAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRow({
          test_result: "Fail",
          escape_route_covered: false,
          battery_condition: "Failed",
          compliance_status: "Non-Compliant",
          fault_identified: true,
          fault_rectified: false,
          illumination_adequate: false,
        }),
      ];
      const alerts = computeAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRow({ battery_condition: "Failed" })];
      const alerts = computeAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  // -- edge cases -------------------------------------------------------------

  describe("edge cases", () => {
    it("clean record triggers no alerts", () => {
      const records = [makeRow({ test_result: "Pass", escape_route_covered: true, battery_condition: "Good", compliance_status: "Compliant", fault_identified: false, illumination_adequate: true })];
      const alerts = computeAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Compliant status does not trigger non_compliant_status", () => {
      const records = [makeRow({ compliance_status: "Compliant", test_result: "Pass", escape_route_covered: true, battery_condition: "Good", fault_identified: false, illumination_adequate: true })];
      const alerts = computeAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_status");
      expect(ncAlerts).toHaveLength(0);
    });

    it("Remedial Required status does not trigger non_compliant_status", () => {
      const records = [makeRow({ compliance_status: "Remedial Required", test_result: "Pass", escape_route_covered: true, battery_condition: "Good", fault_identified: false, illumination_adequate: true })];
      const alerts = computeAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_status");
      expect(ncAlerts).toHaveLength(0);
    });

    it("Overdue status does not trigger non_compliant_status", () => {
      const records = [makeRow({ compliance_status: "Overdue", test_result: "Pass", escape_route_covered: true, battery_condition: "Good", fault_identified: false, illumination_adequate: true })];
      const alerts = computeAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_status");
      expect(ncAlerts).toHaveLength(0);
    });

    it("fault_identified false with fault_rectified false does not trigger fault_not_rectified", () => {
      const records = [makeRow({ fault_identified: false, fault_rectified: false, test_result: "Pass", escape_route_covered: true, battery_condition: "Good", compliance_status: "Compliant", illumination_adequate: true })];
      const alerts = computeAlerts(records);
      const fnrAlerts = alerts.filter((a) => a.type === "fault_not_rectified");
      expect(fnrAlerts).toHaveLength(0);
    });

    it("fault_identified true with fault_rectified true does not trigger fault_not_rectified", () => {
      const records = [makeRow({ fault_identified: true, fault_rectified: true, test_result: "Pass", escape_route_covered: true, battery_condition: "Good", compliance_status: "Compliant", illumination_adequate: true })];
      const alerts = computeAlerts(records);
      const fnrAlerts = alerts.filter((a) => a.type === "fault_not_rectified");
      expect(fnrAlerts).toHaveLength(0);
    });

    it("Fail result with escape_route_covered true does not trigger fail_escape_route", () => {
      const records = [makeRow({ test_result: "Fail", escape_route_covered: true, battery_condition: "Good", compliance_status: "Compliant", fault_identified: false, illumination_adequate: true })];
      const alerts = computeAlerts(records);
      const ferAlerts = alerts.filter((a) => a.type === "fail_escape_route");
      expect(ferAlerts).toHaveLength(0);
    });
  });
});

// ==============================================================================
// generateCaraInsights
// ==============================================================================

describe("generateCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const records = [makeRow()];
    const insights = generateCaraInsights(records);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty array", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [yellow]", () => {
    const records = [makeRow()];
    const insights = generateCaraInsights(records);
    expect(insights[0]).toMatch(/^\[yellow\]/);
  });

  it("second insight starts with [amber]", () => {
    const records = [makeRow()];
    const insights = generateCaraInsights(records);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("third insight starts with [reflect]", () => {
    const records = [makeRow()];
    const insights = generateCaraInsights(records);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("all insights are non-empty strings", () => {
    const records = [makeRow()];
    const insights = generateCaraInsights(records);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  describe("first insight (yellow) -- summary stats", () => {
    it("includes total test count", () => {
      const records = [makeRow(), makeRow(), makeRow()];
      const insights = generateCaraInsights(records);
      expect(insights[0]).toContain("3 emergency lighting tests");
    });

    it("includes unique location count", () => {
      const records = [
        makeRow({ location: "Main Hallway" }),
        makeRow({ location: "Stairwell A" }),
      ];
      const insights = generateCaraInsights(records);
      expect(insights[0]).toContain("2 locations");
    });

    it("uses singular location for count of 1", () => {
      const records = [makeRow({ location: "Main Hallway" })];
      const insights = generateCaraInsights(records);
      expect(insights[0]).toContain("1 location");
    });

    it("includes unique tester count", () => {
      const records = [
        makeRow({ tester_name: "Tester A" }),
        makeRow({ tester_name: "Tester B" }),
      ];
      const insights = generateCaraInsights(records);
      expect(insights[0]).toContain("2 testers");
    });

    it("uses singular tester for count of 1", () => {
      const records = [makeRow({ tester_name: "Single Tester" })];
      const insights = generateCaraInsights(records);
      expect(insights[0]).toContain("1 tester");
    });

    it("includes pass rate", () => {
      const records = [makeRow({ test_result: "Pass" })];
      const insights = generateCaraInsights(records);
      expect(insights[0]).toContain("100%");
    });

    it("uses singular test for count of 1", () => {
      const records = [makeRow()];
      const insights = generateCaraInsights(records);
      expect(insights[0]).toContain("1 emergency lighting test");
    });
  });

  describe("second insight (amber) -- priority concerns", () => {
    it("mentions critical and high alerts when present", () => {
      const records = [makeRow({ test_result: "Fail", escape_route_covered: false, compliance_status: "Non-Compliant" })];
      const insights = generateCaraInsights(records);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high");
    });

    it("mentions non-compliant count when alerts present", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const insights = generateCaraInsights(records);
      expect(insights[1]).toContain("non-compliant");
    });

    it("mentions no critical alerts when all clean", () => {
      const records = [makeRow({ test_result: "Pass", escape_route_covered: true, battery_condition: "Good", compliance_status: "Compliant", fault_identified: false, illumination_adequate: true })];
      const insights = generateCaraInsights(records);
      expect(insights[1]).toContain("No critical or high-priority");
    });

    it("mentions fire safety standards when no alerts", () => {
      const records = [makeRow({ test_result: "Pass", escape_route_covered: true, battery_condition: "Good", compliance_status: "Compliant", fault_identified: false, illumination_adequate: true })];
      const insights = generateCaraInsights(records);
      expect(insights[1]).toContain("fire safety");
    });

    it("uses singular for 1 non-compliant test", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const insights = generateCaraInsights(records);
      expect(insights[1]).toContain("test is");
    });

    it("uses plural for multiple non-compliant tests", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
      ];
      const insights = generateCaraInsights(records);
      expect(insights[1]).toContain("tests are");
    });

    it("uses singular for 1 test requiring remedial action", () => {
      const records = [makeRow({ compliance_status: "Remedial Required", battery_condition: "Failed" })];
      const insights = generateCaraInsights(records);
      expect(insights[1]).toContain("test requires");
    });

    it("uses plural for multiple tests requiring remedial action", () => {
      const records = [
        makeRow({ compliance_status: "Remedial Required", battery_condition: "Failed" }),
        makeRow({ compliance_status: "Remedial Required", battery_condition: "Failed" }),
      ];
      const insights = generateCaraInsights(records);
      expect(insights[1]).toContain("tests require");
    });
  });

  describe("third insight (reflect) -- reflective question", () => {
    it("mentions non-compliant when present", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const insights = generateCaraInsights(records);
      expect(insights[2]).toContain("non-compliant");
    });

    it("uses singular for 1 non-compliant test", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const insights = generateCaraInsights(records);
      expect(insights[2]).toContain("test has");
    });

    it("uses plural for multiple non-compliant tests", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
      ];
      const insights = generateCaraInsights(records);
      expect(insights[2]).toContain("tests have");
    });

    it("asks about remedial action and faults when no non-compliant but issues found", () => {
      const records = [makeRow({ compliance_status: "Remedial Required", fault_identified: true, fault_rectified: false, battery_condition: "Failed" })];
      const insights = generateCaraInsights(records);
      expect(insights[2]).toContain("remedial");
    });

    it("asks about faults when faults identified but no non-compliant", () => {
      const records = [makeRow({ compliance_status: "Compliant", fault_identified: true, fault_rectified: true, test_result: "Pass", escape_route_covered: true, battery_condition: "Good", illumination_adequate: true })];
      const insights = generateCaraInsights(records);
      expect(insights[2]).toContain("fault");
    });

    it("provides positive reflection when all clean", () => {
      const records = [makeRow({ compliance_status: "Compliant", fault_identified: false, test_result: "Pass", escape_route_covered: true, battery_condition: "Good", illumination_adequate: true })];
      const insights = generateCaraInsights(records);
      expect(insights[2]).toContain("no non-compliant");
    });

    it("asks about staff awareness in positive reflection", () => {
      const records = [makeRow({ compliance_status: "Compliant", fault_identified: false, test_result: "Pass", escape_route_covered: true, battery_condition: "Good", illumination_adequate: true })];
      const insights = generateCaraInsights(records);
      expect(insights[2]).toContain("staff");
    });
  });
});

// ==============================================================================
// makeRow factory helper validation
// ==============================================================================

describe("makeRow factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.test_date).toBe("2026-05-01");
    expect(r.tester_name).toBe("John Smith");
    expect(r.test_type).toBe("Monthly Function Test");
    expect(r.location).toBe("Main Hallway");
    expect(r.luminaire_type).toBe("Self-Contained");
    expect(r.test_result).toBe("Pass");
    expect(r.battery_condition).toBe("Good");
    expect(r.duration_minutes).toBeNull();
    expect(r.illumination_adequate).toBe(true);
    expect(r.escape_route_covered).toBe(true);
    expect(r.signage_visible).toBe(true);
    expect(r.fault_identified).toBe(false);
    expect(r.fault_rectified).toBe(false);
    expect(r.next_test_date).toBeNull();
    expect(r.compliance_status).toBe("Compliant");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ test_type: "Annual Duration Test", compliance_status: "Non-Compliant" });
    expect(r.test_type).toBe("Annual Duration Test");
    expect(r.compliance_status).toBe("Non-Compliant");
    // defaults still apply
    expect(r.location).toBe("Main Hallway");
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
    const r = makeRow({ duration_minutes: null, next_test_date: null, notes: null });
    expect(r.duration_minutes).toBeNull();
    expect(r.next_test_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting test_type", () => {
    const r = makeRow({ test_type: "Quarterly Inspection" });
    expect(r.test_type).toBe("Quarterly Inspection");
  });

  it("allows setting luminaire_type", () => {
    const r = makeRow({ luminaire_type: "Exit Sign" });
    expect(r.luminaire_type).toBe("Exit Sign");
  });

  it("allows setting test_result", () => {
    const r = makeRow({ test_result: "Fail" });
    expect(r.test_result).toBe("Fail");
  });

  it("allows setting battery_condition", () => {
    const r = makeRow({ battery_condition: "Poor" });
    expect(r.battery_condition).toBe("Poor");
  });

  it("allows setting boolean fields", () => {
    const r = makeRow({
      illumination_adequate: false,
      escape_route_covered: false,
      signage_visible: false,
      fault_identified: true,
      fault_rectified: true,
    });
    expect(r.illumination_adequate).toBe(false);
    expect(r.escape_route_covered).toBe(false);
    expect(r.signage_visible).toBe(false);
    expect(r.fault_identified).toBe(true);
    expect(r.fault_rectified).toBe(true);
  });

  it("allows setting location", () => {
    const r = makeRow({ location: "Kitchen Exit" });
    expect(r.location).toBe("Kitchen Exit");
  });

  it("allows setting duration_minutes", () => {
    const r = makeRow({ duration_minutes: 90 });
    expect(r.duration_minutes).toBe(90);
  });

  it("allows setting next_test_date", () => {
    const r = makeRow({ next_test_date: "2026-06-01" });
    expect(r.next_test_date).toBe("2026-06-01");
  });

  it("allows setting notes", () => {
    const r = makeRow({ notes: "Test note" });
    expect(r.notes).toBe("Test note");
  });

  it("allows setting compliance_status", () => {
    const r = makeRow({ compliance_status: "Overdue" });
    expect(r.compliance_status).toBe("Overdue");
  });

  it("allows setting tester_name", () => {
    const r = makeRow({ tester_name: "Jane Doe" });
    expect(r.tester_name).toBe("Jane Doe");
  });

  it("allows setting test_date", () => {
    const r = makeRow({ test_date: "2026-06-15" });
    expect(r.test_date).toBe("2026-06-15");
  });
});
