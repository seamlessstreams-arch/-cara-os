// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME GAS SAFETY SERVICE TESTS
// Pure-function tests for gas safety metrics, alert identification,
// ARIA insights, constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  INSPECTION_TYPES,
  RESULT_VALUES,
  COMPLIANCE_STATUSES,
  INSPECTION_TYPE_LABELS,
  RESULT_LABELS,
  COMPLIANCE_STATUS_LABELS,
  _testing,
} from "../home-gas-safety-service";

import type {
  HomeGasSafetyRow,
  InspectionType,
  ResultValue,
  ComplianceStatus,
} from "../home-gas-safety-service";

const {
  computeGasSafetyMetrics,
  identifyGasSafetyAlerts,
  generateGasSafetyAriaInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<HomeGasSafetyRow>,
): HomeGasSafetyRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    inspection_date: "inspection_date" in (overrides ?? {}) ? overrides!.inspection_date! : "2026-05-01",
    engineer_name: "engineer_name" in (overrides ?? {}) ? overrides!.engineer_name! : "John Smith",
    gas_safe_registration: "gas_safe_registration" in (overrides ?? {}) ? overrides!.gas_safe_registration! : "GS-123456",
    inspection_type: "inspection_type" in (overrides ?? {}) ? overrides!.inspection_type! : "Annual CP12",
    appliance_location: "appliance_location" in (overrides ?? {}) ? overrides!.appliance_location! : "Kitchen",
    result: "result" in (overrides ?? {}) ? overrides!.result! : "Safe",
    defects_found: "defects_found" in (overrides ?? {}) ? overrides!.defects_found! : 0,
    remedial_completed: "remedial_completed" in (overrides ?? {}) ? overrides!.remedial_completed! : false,
    certificate_issued: "certificate_issued" in (overrides ?? {}) ? overrides!.certificate_issued! : true,
    certificate_number: "certificate_number" in (overrides ?? {}) ? (overrides!.certificate_number ?? null) : "CP12-001",
    carbon_monoxide_alarm_tested: "carbon_monoxide_alarm_tested" in (overrides ?? {}) ? overrides!.carbon_monoxide_alarm_tested! : true,
    next_inspection_date: "next_inspection_date" in (overrides ?? {}) ? (overrides!.next_inspection_date ?? null) : null,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Compliant",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

/** Return an ISO date string for N days ago from now */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Return an ISO date string for N days in the future from now */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  describe("INSPECTION_TYPES", () => {
    it("has exactly 6 items", () => {
      expect(INSPECTION_TYPES).toHaveLength(6);
    });

    it("contains Annual CP12", () => {
      expect(INSPECTION_TYPES).toContain("Annual CP12");
    });

    it("contains Boiler Service", () => {
      expect(INSPECTION_TYPES).toContain("Boiler Service");
    });

    it("contains Appliance Check", () => {
      expect(INSPECTION_TYPES).toContain("Appliance Check");
    });

    it("contains Flue Inspection", () => {
      expect(INSPECTION_TYPES).toContain("Flue Inspection");
    });

    it("contains Emergency Call-out", () => {
      expect(INSPECTION_TYPES).toContain("Emergency Call-out");
    });

    it("contains Installation", () => {
      expect(INSPECTION_TYPES).toContain("Installation");
    });

    it("has unique values", () => {
      expect(new Set(INSPECTION_TYPES).size).toBe(INSPECTION_TYPES.length);
    });

    it("every entry is a non-empty string", () => {
      for (const t of INSPECTION_TYPES) {
        expect(t.length).toBeGreaterThan(0);
      }
    });
  });

  describe("RESULT_VALUES", () => {
    it("has exactly 4 items", () => {
      expect(RESULT_VALUES).toHaveLength(4);
    });

    it("contains Safe", () => {
      expect(RESULT_VALUES).toContain("Safe");
    });

    it("contains At Risk", () => {
      expect(RESULT_VALUES).toContain("At Risk");
    });

    it("contains Immediately Dangerous", () => {
      expect(RESULT_VALUES).toContain("Immediately Dangerous");
    });

    it("contains Not Inspected", () => {
      expect(RESULT_VALUES).toContain("Not Inspected");
    });

    it("has unique values", () => {
      expect(new Set(RESULT_VALUES).size).toBe(RESULT_VALUES.length);
    });

    it("every entry is a non-empty string", () => {
      for (const v of RESULT_VALUES) {
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

    it("contains Conditional", () => {
      expect(COMPLIANCE_STATUSES).toContain("Conditional");
    });

    it("contains Expired", () => {
      expect(COMPLIANCE_STATUSES).toContain("Expired");
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

  describe("INSPECTION_TYPE_LABELS", () => {
    it("has exactly 6 items", () => {
      expect(INSPECTION_TYPE_LABELS).toHaveLength(6);
    });

    it("has unique type values", () => {
      const types = INSPECTION_TYPE_LABELS.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = INSPECTION_TYPE_LABELS.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of INSPECTION_TYPE_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches INSPECTION_TYPES values", () => {
      const labelTypes = INSPECTION_TYPE_LABELS.map((t) => t.type);
      for (const t of INSPECTION_TYPES) {
        expect(labelTypes).toContain(t);
      }
    });
  });

  describe("RESULT_LABELS", () => {
    it("has exactly 4 items", () => {
      expect(RESULT_LABELS).toHaveLength(4);
    });

    it("has unique value fields", () => {
      const values = RESULT_LABELS.map((r) => r.value);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has unique labels", () => {
      const labels = RESULT_LABELS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of RESULT_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches RESULT_VALUES values", () => {
      const labelValues = RESULT_LABELS.map((r) => r.value);
      for (const v of RESULT_VALUES) {
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
// computeGasSafetyMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeGasSafetyMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_inspections", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.total_inspections).toBe(0);
    });

    it("returns zero immediately_dangerous_count", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.immediately_dangerous_count).toBe(0);
    });

    it("returns zero at_risk_count", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.at_risk_count).toBe(0);
    });

    it("returns zero safe_count", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.safe_count).toBe(0);
    });

    it("returns zero certificate_rate", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.certificate_rate).toBe(0);
    });

    it("returns zero remedial_completion_rate", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns zero co_alarm_rate", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.co_alarm_rate).toBe(0);
    });

    it("returns zero next_inspection_scheduled_rate", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.next_inspection_scheduled_rate).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero defects_total", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.defects_total).toBe(0);
    });

    it("returns zero unique_engineers", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.unique_engineers).toBe(0);
    });

    it("returns empty by_inspection_type", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.by_inspection_type).toEqual({});
    });

    it("returns empty by_result", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.by_result).toEqual({});
    });

    it("returns empty by_compliance_status", () => {
      const m = computeGasSafetyMetrics([]);
      expect(m.by_compliance_status).toEqual({});
    });
  });

  describe("single safe record", () => {
    const record = makeRecord({
      inspection_type: "Annual CP12",
      result: "Safe",
      defects_found: 0,
      remedial_completed: false,
      certificate_issued: true,
      carbon_monoxide_alarm_tested: true,
      next_inspection_date: "2027-05-01",
      compliance_status: "Compliant",
      engineer_name: "John Smith",
    });

    it("returns total_inspections = 1", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.total_inspections).toBe(1);
    });

    it("returns immediately_dangerous_count = 0", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.immediately_dangerous_count).toBe(0);
    });

    it("returns at_risk_count = 0", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.at_risk_count).toBe(0);
    });

    it("returns safe_count = 1", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.safe_count).toBe(1);
    });

    it("returns certificate_rate = 100", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.certificate_rate).toBe(100);
    });

    it("returns remedial_completion_rate = 0 (no defects so no applicable records)", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns co_alarm_rate = 100", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.co_alarm_rate).toBe(100);
    });

    it("returns next_inspection_scheduled_rate = 100", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.next_inspection_scheduled_rate).toBe(100);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns defects_total = 0", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.defects_total).toBe(0);
    });

    it("returns unique_engineers = 1", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.unique_engineers).toBe(1);
    });

    it("returns by_inspection_type with single entry", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.by_inspection_type).toEqual({ "Annual CP12": 1 });
    });

    it("returns by_result with single entry", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.by_result).toEqual({ Safe: 1 });
    });

    it("returns by_compliance_status with single entry", () => {
      const m = computeGasSafetyMetrics([record]);
      expect(m.by_compliance_status).toEqual({ Compliant: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ inspection_type: "Annual CP12", result: "Safe", defects_found: 0, certificate_issued: true, carbon_monoxide_alarm_tested: true, compliance_status: "Compliant", next_inspection_date: "2027-05-01", engineer_name: "Engineer A" }),
      makeRecord({ inspection_type: "Boiler Service", result: "At Risk", defects_found: 3, remedial_completed: false, certificate_issued: false, carbon_monoxide_alarm_tested: true, compliance_status: "Non-Compliant", next_inspection_date: null, engineer_name: "Engineer B" }),
      makeRecord({ inspection_type: "Appliance Check", result: "Immediately Dangerous", defects_found: 2, remedial_completed: true, certificate_issued: true, carbon_monoxide_alarm_tested: false, compliance_status: "Non-Compliant", next_inspection_date: "2027-01-01", engineer_name: "Engineer A" }),
      makeRecord({ inspection_type: "Flue Inspection", result: "Safe", defects_found: 1, remedial_completed: true, certificate_issued: true, carbon_monoxide_alarm_tested: true, compliance_status: "Compliant", next_inspection_date: "2027-06-01", engineer_name: "Engineer C" }),
      makeRecord({ inspection_type: "Emergency Call-out", result: "Not Inspected", defects_found: 0, certificate_issued: false, carbon_monoxide_alarm_tested: true, compliance_status: "Expired", next_inspection_date: null, engineer_name: "Engineer B" }),
    ];

    it("returns total_inspections = 5", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.total_inspections).toBe(5);
    });

    it("returns immediately_dangerous_count = 1", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.immediately_dangerous_count).toBe(1);
    });

    it("returns at_risk_count = 1", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.at_risk_count).toBe(1);
    });

    it("returns safe_count = 2", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.safe_count).toBe(2);
    });

    it("calculates certificate_rate (3/5 = 60%)", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.certificate_rate).toBe(60);
    });

    it("calculates remedial_completion_rate (2/3 = 66.7%)", () => {
      // defects_found > 0: records 1,2,3 = 3 applicable; completed: records 2,3 = 2
      const m = computeGasSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(66.7);
    });

    it("calculates co_alarm_rate (4/5 = 80%)", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.co_alarm_rate).toBe(80);
    });

    it("calculates next_inspection_scheduled_rate (3/5 = 60%)", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.next_inspection_scheduled_rate).toBe(60);
    });

    it("returns non_compliant_count = 3 (Non-Compliant + Expired)", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(3);
    });

    it("returns defects_total = 6", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.defects_total).toBe(6);
    });

    it("returns unique_engineers = 3", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.unique_engineers).toBe(3);
    });

    it("groups by_inspection_type correctly", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.by_inspection_type).toEqual({
        "Annual CP12": 1,
        "Boiler Service": 1,
        "Appliance Check": 1,
        "Flue Inspection": 1,
        "Emergency Call-out": 1,
      });
    });

    it("groups by_result correctly", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.by_result).toEqual({
        Safe: 2,
        "At Risk": 1,
        "Immediately Dangerous": 1,
        "Not Inspected": 1,
      });
    });

    it("groups by_compliance_status correctly", () => {
      const m = computeGasSafetyMetrics(records);
      expect(m.by_compliance_status).toEqual({
        Compliant: 2,
        "Non-Compliant": 2,
        Expired: 1,
      });
    });
  });

  describe("immediately_dangerous_count", () => {
    it("counts only Immediately Dangerous results", () => {
      const records = [
        makeRecord({ result: "Immediately Dangerous" }),
        makeRecord({ result: "Immediately Dangerous" }),
        makeRecord({ result: "Safe" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.immediately_dangerous_count).toBe(2);
    });

    it("does not count At Risk as Immediately Dangerous", () => {
      const records = [makeRecord({ result: "At Risk" })];
      const m = computeGasSafetyMetrics(records);
      expect(m.immediately_dangerous_count).toBe(0);
    });

    it("does not count Not Inspected as Immediately Dangerous", () => {
      const records = [makeRecord({ result: "Not Inspected" })];
      const m = computeGasSafetyMetrics(records);
      expect(m.immediately_dangerous_count).toBe(0);
    });

    it("does not count Safe as Immediately Dangerous", () => {
      const records = [makeRecord({ result: "Safe" })];
      const m = computeGasSafetyMetrics(records);
      expect(m.immediately_dangerous_count).toBe(0);
    });
  });

  describe("at_risk_count", () => {
    it("counts only At Risk results", () => {
      const records = [
        makeRecord({ result: "At Risk" }),
        makeRecord({ result: "At Risk" }),
        makeRecord({ result: "Safe" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.at_risk_count).toBe(2);
    });

    it("does not count Immediately Dangerous as At Risk", () => {
      const records = [makeRecord({ result: "Immediately Dangerous" })];
      const m = computeGasSafetyMetrics(records);
      expect(m.at_risk_count).toBe(0);
    });
  });

  describe("safe_count", () => {
    it("counts only Safe results", () => {
      const records = [
        makeRecord({ result: "Safe" }),
        makeRecord({ result: "Safe" }),
        makeRecord({ result: "At Risk" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.safe_count).toBe(2);
    });
  });

  describe("certificate_rate", () => {
    it("returns 100 when all certificates issued", () => {
      const records = [
        makeRecord({ certificate_issued: true }),
        makeRecord({ certificate_issued: true }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.certificate_rate).toBe(100);
    });

    it("returns 0 when no certificates issued", () => {
      const records = [
        makeRecord({ certificate_issued: false }),
        makeRecord({ certificate_issued: false }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.certificate_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ certificate_issued: true }),
        makeRecord({ certificate_issued: false }),
        makeRecord({ certificate_issued: false }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.certificate_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ certificate_issued: true }),
        makeRecord({ certificate_issued: true }),
        makeRecord({ certificate_issued: false }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.certificate_rate).toBe(66.7);
    });
  });

  describe("remedial_completion_rate", () => {
    it("only considers records where defects_found > 0", () => {
      const records = [
        makeRecord({ defects_found: 0, remedial_completed: false }),
        makeRecord({ defects_found: 2, remedial_completed: true }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(100);
    });

    it("returns 0 when no records have defects", () => {
      const records = [
        makeRecord({ defects_found: 0, remedial_completed: false }),
        makeRecord({ defects_found: 0, remedial_completed: false }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns 0 when all defective records are unremediated", () => {
      const records = [
        makeRecord({ defects_found: 3, remedial_completed: false }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns 100 when all defective records are remediated", () => {
      const records = [
        makeRecord({ defects_found: 5, remedial_completed: true }),
        makeRecord({ defects_found: 2, remedial_completed: true }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(100);
    });

    it("calculates rate with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ defects_found: 1, remedial_completed: true }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ defects_found: 1, remedial_completed: true }),
        makeRecord({ defects_found: 1, remedial_completed: true }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(66.7);
    });

    it("calculates rate (1/6 = 16.7%)", () => {
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRecord({ defects_found: 1, remedial_completed: i === 0 }),
      );
      const m = computeGasSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(16.7);
    });
  });

  describe("co_alarm_rate", () => {
    it("returns 100 when all CO alarms tested", () => {
      const records = [
        makeRecord({ carbon_monoxide_alarm_tested: true }),
        makeRecord({ carbon_monoxide_alarm_tested: true }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.co_alarm_rate).toBe(100);
    });

    it("returns 0 when no CO alarms tested", () => {
      const records = [
        makeRecord({ carbon_monoxide_alarm_tested: false }),
        makeRecord({ carbon_monoxide_alarm_tested: false }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.co_alarm_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ carbon_monoxide_alarm_tested: true }),
        makeRecord({ carbon_monoxide_alarm_tested: false }),
        makeRecord({ carbon_monoxide_alarm_tested: false }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.co_alarm_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ carbon_monoxide_alarm_tested: true }),
        makeRecord({ carbon_monoxide_alarm_tested: true }),
        makeRecord({ carbon_monoxide_alarm_tested: false }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.co_alarm_rate).toBe(66.7);
    });
  });

  describe("next_inspection_scheduled_rate", () => {
    it("returns 100 when all have next_inspection_date", () => {
      const records = [
        makeRecord({ next_inspection_date: "2027-01-01" }),
        makeRecord({ next_inspection_date: "2028-01-01" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.next_inspection_scheduled_rate).toBe(100);
    });

    it("returns 0 when none have next_inspection_date", () => {
      const records = [
        makeRecord({ next_inspection_date: null }),
        makeRecord({ next_inspection_date: null }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.next_inspection_scheduled_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ next_inspection_date: "2027-01-01" }),
        makeRecord({ next_inspection_date: null }),
        makeRecord({ next_inspection_date: null }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.next_inspection_scheduled_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ next_inspection_date: "2027-01-01" }),
        makeRecord({ next_inspection_date: "2028-01-01" }),
        makeRecord({ next_inspection_date: null }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.next_inspection_scheduled_rate).toBe(66.7);
    });
  });

  describe("non_compliant_count", () => {
    it("counts Non-Compliant", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant" })];
      const m = computeGasSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts Expired", () => {
      const records = [makeRecord({ compliance_status: "Expired" })];
      const m = computeGasSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts both Non-Compliant and Expired together", () => {
      const records = [
        makeRecord({ compliance_status: "Non-Compliant" }),
        makeRecord({ compliance_status: "Expired" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });

    it("does not count Compliant", () => {
      const records = [makeRecord({ compliance_status: "Compliant" })];
      const m = computeGasSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Conditional", () => {
      const records = [makeRecord({ compliance_status: "Conditional" })];
      const m = computeGasSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });
  });

  describe("defects_total", () => {
    it("sums defects_found across all records", () => {
      const records = [
        makeRecord({ defects_found: 2 }),
        makeRecord({ defects_found: 3 }),
        makeRecord({ defects_found: 0 }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.defects_total).toBe(5);
    });

    it("returns zero when all records have zero defects", () => {
      const records = [
        makeRecord({ defects_found: 0 }),
        makeRecord({ defects_found: 0 }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.defects_total).toBe(0);
    });

    it("handles a single record with many defects", () => {
      const records = [makeRecord({ defects_found: 15 })];
      const m = computeGasSafetyMetrics(records);
      expect(m.defects_total).toBe(15);
    });
  });

  describe("unique_engineers", () => {
    it("counts distinct engineer names", () => {
      const records = [
        makeRecord({ engineer_name: "Engineer A" }),
        makeRecord({ engineer_name: "Engineer B" }),
        makeRecord({ engineer_name: "Engineer A" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.unique_engineers).toBe(2);
    });

    it("returns 1 when all same engineer", () => {
      const records = [
        makeRecord({ engineer_name: "John Smith" }),
        makeRecord({ engineer_name: "John Smith" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.unique_engineers).toBe(1);
    });

    it("treats different names as different engineers", () => {
      const records = [
        makeRecord({ engineer_name: "Engineer A" }),
        makeRecord({ engineer_name: "Engineer B" }),
        makeRecord({ engineer_name: "Engineer C" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.unique_engineers).toBe(3);
    });
  });

  describe("by_inspection_type breakdown", () => {
    it("counts each inspection type separately", () => {
      const records = [
        makeRecord({ inspection_type: "Annual CP12" }),
        makeRecord({ inspection_type: "Annual CP12" }),
        makeRecord({ inspection_type: "Boiler Service" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.by_inspection_type).toEqual({ "Annual CP12": 2, "Boiler Service": 1 });
    });

    it("handles all six inspection types", () => {
      const types: InspectionType[] = ["Annual CP12", "Boiler Service", "Appliance Check", "Flue Inspection", "Emergency Call-out", "Installation"];
      const records = types.map((t) => makeRecord({ inspection_type: t }));
      const m = computeGasSafetyMetrics(records);
      for (const t of types) {
        expect(m.by_inspection_type[t]).toBe(1);
      }
    });
  });

  describe("by_result breakdown", () => {
    it("counts each result value separately", () => {
      const records = [
        makeRecord({ result: "Safe" }),
        makeRecord({ result: "Safe" }),
        makeRecord({ result: "At Risk" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.by_result).toEqual({ Safe: 2, "At Risk": 1 });
    });

    it("handles all four result values", () => {
      const results: ResultValue[] = ["Safe", "At Risk", "Immediately Dangerous", "Not Inspected"];
      const records = results.map((r) => makeRecord({ result: r }));
      const m = computeGasSafetyMetrics(records);
      for (const r of results) {
        expect(m.by_result[r]).toBe(1);
      }
    });
  });

  describe("by_compliance_status breakdown", () => {
    it("counts each compliance status separately", () => {
      const records = [
        makeRecord({ compliance_status: "Compliant" }),
        makeRecord({ compliance_status: "Compliant" }),
        makeRecord({ compliance_status: "Non-Compliant" }),
      ];
      const m = computeGasSafetyMetrics(records);
      expect(m.by_compliance_status).toEqual({ Compliant: 2, "Non-Compliant": 1 });
    });

    it("handles all four compliance statuses", () => {
      const statuses: ComplianceStatus[] = ["Compliant", "Non-Compliant", "Conditional", "Expired"];
      const records = statuses.map((s) => makeRecord({ compliance_status: s }));
      const m = computeGasSafetyMetrics(records);
      for (const s of statuses) {
        expect(m.by_compliance_status[s]).toBe(1);
      }
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: HomeGasSafetyRow[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            inspection_type: i % 2 === 0 ? "Annual CP12" : "Boiler Service",
            result: i % 4 === 0 ? "Safe" : "At Risk",
            defects_found: i % 3 === 0 ? 0 : 1,
            remedial_completed: i % 2 === 0,
            certificate_issued: i % 5 !== 0,
            carbon_monoxide_alarm_tested: i % 10 !== 0,
            compliance_status: "Compliant",
            engineer_name: `Engineer ${i % 5}`,
          }),
        );
      }
      const m = computeGasSafetyMetrics(records);
      expect(m.total_inspections).toBe(100);
      expect(m.unique_engineers).toBe(5);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyGasSafetyAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyGasSafetyAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyGasSafetyAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          result: "Safe",
          compliance_status: "Compliant",
          remedial_completed: false,
          carbon_monoxide_alarm_tested: true,
          next_inspection_date: daysFromNow(30),
        }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  // ── immediately_dangerous alert ────────────────────────────────────────

  describe("immediately_dangerous alert", () => {
    it("fires when result is Immediately Dangerous", () => {
      const records = [makeRecord({ result: "Immediately Dangerous" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "immediately_dangerous");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ result: "Immediately Dangerous" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "immediately_dangerous")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-id-1", result: "Immediately Dangerous" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "immediately_dangerous")!;
      expect(alert.record_id).toBe("rec-id-1");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ result: "Immediately Dangerous", inspection_type: "Annual CP12" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "immediately_dangerous")!;
      expect(alert.message).toContain("Annual CP12");
    });

    it("includes appliance_location in message", () => {
      const records = [makeRecord({ result: "Immediately Dangerous", appliance_location: "Kitchen" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "immediately_dangerous")!;
      expect(alert.message).toContain("Kitchen");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ result: "Immediately Dangerous", inspection_date: "2026-03-15" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "immediately_dangerous")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("includes Gas Safety Regulations reference in message", () => {
      const records = [makeRecord({ result: "Immediately Dangerous" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "immediately_dangerous")!;
      expect(alert.message).toContain("Gas Safety");
    });

    it("does not fire when result is Safe", () => {
      const records = [makeRecord({ result: "Safe" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "immediately_dangerous");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is At Risk", () => {
      const records = [makeRecord({ result: "At Risk" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "immediately_dangerous");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Not Inspected", () => {
      const records = [makeRecord({ result: "Not Inspected" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "immediately_dangerous");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Immediately Dangerous records", () => {
      const records = [
        makeRecord({ result: "Immediately Dangerous" }),
        makeRecord({ result: "Immediately Dangerous" }),
        makeRecord({ result: "Safe" }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      const idAlerts = alerts.filter((a) => a.type === "immediately_dangerous");
      expect(idAlerts).toHaveLength(2);
    });
  });

  // ── at_risk_unremediated alert ─────────────────────────────────────────

  describe("at_risk_unremediated alert", () => {
    it("fires when result is At Risk and remedial_completed is false", () => {
      const records = [makeRecord({ result: "At Risk", remedial_completed: false })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "at_risk_unremediated");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ result: "At Risk", remedial_completed: false })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "at_risk_unremediated")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-ar-1", result: "At Risk", remedial_completed: false })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "at_risk_unremediated")!;
      expect(alert.record_id).toBe("rec-ar-1");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ result: "At Risk", remedial_completed: false, inspection_type: "Boiler Service" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "at_risk_unremediated")!;
      expect(alert.message).toContain("Boiler Service");
    });

    it("includes appliance_location in message", () => {
      const records = [makeRecord({ result: "At Risk", remedial_completed: false, appliance_location: "Utility Room" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "at_risk_unremediated")!;
      expect(alert.message).toContain("Utility Room");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ result: "At Risk", remedial_completed: false, inspection_date: "2026-04-20" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "at_risk_unremediated")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("does not fire when result is At Risk but remedial_completed is true", () => {
      const records = [makeRecord({ result: "At Risk", remedial_completed: true })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "at_risk_unremediated");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Safe", () => {
      const records = [makeRecord({ result: "Safe", remedial_completed: false })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "at_risk_unremediated");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Immediately Dangerous", () => {
      const records = [makeRecord({ result: "Immediately Dangerous", remedial_completed: false })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "at_risk_unremediated");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Not Inspected", () => {
      const records = [makeRecord({ result: "Not Inspected", remedial_completed: false })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "at_risk_unremediated");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple At Risk unremediated records", () => {
      const records = [
        makeRecord({ result: "At Risk", remedial_completed: false }),
        makeRecord({ result: "At Risk", remedial_completed: false }),
        makeRecord({ result: "At Risk", remedial_completed: true }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      const arAlerts = alerts.filter((a) => a.type === "at_risk_unremediated");
      expect(arAlerts).toHaveLength(2);
    });
  });

  // ── non_compliant alert ────────────────────────────────────────────────

  describe("non_compliant alert", () => {
    it("fires when compliance_status is Non-Compliant", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-nc-1", compliance_status: "Non-Compliant" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.record_id).toBe("rec-nc-1");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant", inspection_type: "Flue Inspection" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("Flue Inspection");
    });

    it("includes appliance_location in message", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant", appliance_location: "Bathroom" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("Bathroom");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant", inspection_date: "2026-01-15" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("2026-01-15");
    });

    it("includes Gas Safety Regulations reference in message", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("Gas Safety Regulations");
    });

    it("does not fire for Compliant status", () => {
      const records = [makeRecord({ compliance_status: "Compliant" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Conditional status", () => {
      const records = [makeRecord({ compliance_status: "Conditional" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Expired status (handled separately)", () => {
      const records = [makeRecord({ compliance_status: "Expired" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Non-Compliant records", () => {
      const records = [
        makeRecord({ compliance_status: "Non-Compliant" }),
        makeRecord({ compliance_status: "Non-Compliant" }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant");
      expect(ncAlerts).toHaveLength(2);
    });
  });

  // ── expired_compliance alert ───────────────────────────────────────────

  describe("expired_compliance alert", () => {
    it("fires when compliance_status is Expired", () => {
      const records = [makeRecord({ compliance_status: "Expired" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "expired_compliance");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ compliance_status: "Expired" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "expired_compliance")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-exp-1", compliance_status: "Expired" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "expired_compliance")!;
      expect(alert.record_id).toBe("rec-exp-1");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ compliance_status: "Expired", inspection_type: "Annual CP12" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "expired_compliance")!;
      expect(alert.message).toContain("Annual CP12");
    });

    it("includes appliance_location in message", () => {
      const records = [makeRecord({ compliance_status: "Expired", appliance_location: "Living Room" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "expired_compliance")!;
      expect(alert.message).toContain("Living Room");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ compliance_status: "Expired", inspection_date: "2025-06-01" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "expired_compliance")!;
      expect(alert.message).toContain("2025-06-01");
    });

    it("does not fire for Compliant status", () => {
      const records = [makeRecord({ compliance_status: "Compliant" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "expired_compliance");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Conditional status", () => {
      const records = [makeRecord({ compliance_status: "Conditional" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "expired_compliance");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Non-Compliant status (handled separately)", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "expired_compliance");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Expired records", () => {
      const records = [
        makeRecord({ compliance_status: "Expired" }),
        makeRecord({ compliance_status: "Expired" }),
        makeRecord({ compliance_status: "Expired" }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      const expAlerts = alerts.filter((a) => a.type === "expired_compliance");
      expect(expAlerts).toHaveLength(3);
    });
  });

  // ── co_alarm_not_tested alert ──────────────────────────────────────────

  describe("co_alarm_not_tested alert", () => {
    it("fires when carbon_monoxide_alarm_tested is false", () => {
      const records = [makeRecord({ carbon_monoxide_alarm_tested: false })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "co_alarm_not_tested");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ carbon_monoxide_alarm_tested: false })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "co_alarm_not_tested")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-co-1", carbon_monoxide_alarm_tested: false })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "co_alarm_not_tested")!;
      expect(alert.record_id).toBe("rec-co-1");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ carbon_monoxide_alarm_tested: false, inspection_type: "Appliance Check" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "co_alarm_not_tested")!;
      expect(alert.message).toContain("Appliance Check");
    });

    it("includes appliance_location in message", () => {
      const records = [makeRecord({ carbon_monoxide_alarm_tested: false, appliance_location: "Bedroom 2" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "co_alarm_not_tested")!;
      expect(alert.message).toContain("Bedroom 2");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ carbon_monoxide_alarm_tested: false, inspection_date: "2026-02-10" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "co_alarm_not_tested")!;
      expect(alert.message).toContain("2026-02-10");
    });

    it("does not fire when carbon_monoxide_alarm_tested is true", () => {
      const records = [makeRecord({ carbon_monoxide_alarm_tested: true })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "co_alarm_not_tested");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple untested CO alarm records", () => {
      const records = [
        makeRecord({ carbon_monoxide_alarm_tested: false }),
        makeRecord({ carbon_monoxide_alarm_tested: false }),
        makeRecord({ carbon_monoxide_alarm_tested: true }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      const coAlerts = alerts.filter((a) => a.type === "co_alarm_not_tested");
      expect(coAlerts).toHaveLength(2);
    });
  });

  // ── inspection_overdue alert ──────────────────────────────────────────

  describe("inspection_overdue alert", () => {
    it("fires when next_inspection_date is in the past", () => {
      const records = [makeRecord({ next_inspection_date: daysAgo(1) })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ next_inspection_date: daysAgo(5) })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-over-1", next_inspection_date: daysAgo(10) })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue")!;
      expect(alert.record_id).toBe("rec-over-1");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ next_inspection_date: daysAgo(1), inspection_type: "Annual CP12" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue")!;
      expect(alert.message).toContain("Annual CP12");
    });

    it("includes appliance_location in message", () => {
      const records = [makeRecord({ next_inspection_date: daysAgo(1), appliance_location: "Kitchen" })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue")!;
      expect(alert.message).toContain("Kitchen");
    });

    it("includes next_inspection_date in message", () => {
      const past = daysAgo(7);
      const records = [makeRecord({ next_inspection_date: past })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue")!;
      expect(alert.message).toContain(past);
    });

    it("does not fire when next_inspection_date is in the future", () => {
      const records = [makeRecord({ next_inspection_date: daysFromNow(30) })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when next_inspection_date is null", () => {
      const records = [makeRecord({ next_inspection_date: null })];
      const alerts = identifyGasSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple overdue records", () => {
      const records = [
        makeRecord({ next_inspection_date: daysAgo(10) }),
        makeRecord({ next_inspection_date: daysAgo(20) }),
        makeRecord({ next_inspection_date: daysFromNow(5) }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      const overdueAlerts = alerts.filter((a) => a.type === "inspection_overdue");
      expect(overdueAlerts).toHaveLength(2);
    });
  });

  // ── combined alerts ───────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can fire all alert types simultaneously", () => {
      const records = [
        makeRecord({
          id: "r1",
          result: "Immediately Dangerous",
          compliance_status: "Non-Compliant",
          carbon_monoxide_alarm_tested: false,
          next_inspection_date: daysAgo(5),
        }),
        makeRecord({
          id: "r2",
          result: "At Risk",
          remedial_completed: false,
          compliance_status: "Expired",
        }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("immediately_dangerous");
      expect(types).toContain("at_risk_unremediated");
      expect(types).toContain("non_compliant");
      expect(types).toContain("expired_compliance");
      expect(types).toContain("co_alarm_not_tested");
      expect(types).toContain("inspection_overdue");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({
          result: "Immediately Dangerous",
          compliance_status: "Non-Compliant",
          carbon_monoxide_alarm_tested: false,
          next_inspection_date: daysAgo(5),
        }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      // immediately_dangerous=1, non_compliant=1, co_alarm_not_tested=1, inspection_overdue=1
      expect(alerts).toHaveLength(4);
    });

    it("per-record alerts multiply with multiple records", () => {
      const records = [
        makeRecord({ result: "Immediately Dangerous" }),
        makeRecord({ result: "Immediately Dangerous" }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      expect(alerts.filter((a) => a.type === "immediately_dangerous")).toHaveLength(2);
    });
  });

  // ── alert structure ───────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const records = [
        makeRecord({ result: "Immediately Dangerous", carbon_monoxide_alarm_tested: false, next_inspection_date: daysAgo(1) }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({
          result: "Immediately Dangerous",
          compliance_status: "Non-Compliant",
          carbon_monoxide_alarm_tested: false,
          next_inspection_date: daysAgo(5),
        }),
      ];
      const alerts = identifyGasSafetyAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ result: "Immediately Dangerous" })];
      const alerts = identifyGasSafetyAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  // ── edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("Safe result with no issues triggers no alerts when next_inspection_date is future", () => {
      const records = [makeRecord({ result: "Safe", compliance_status: "Compliant", carbon_monoxide_alarm_tested: true, next_inspection_date: daysFromNow(365) })];
      const alerts = identifyGasSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("high defects_found alone do not trigger any alert when result is Safe", () => {
      const records = [makeRecord({ defects_found: 50, result: "Safe", compliance_status: "Compliant", carbon_monoxide_alarm_tested: true, next_inspection_date: daysFromNow(30) })];
      const alerts = identifyGasSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("At Risk with remedial_completed does not fire at_risk_unremediated", () => {
      const records = [makeRecord({ result: "At Risk", remedial_completed: true, compliance_status: "Compliant", carbon_monoxide_alarm_tested: true, next_inspection_date: daysFromNow(30) })];
      const alerts = identifyGasSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Conditional compliance does not trigger non_compliant or expired_compliance", () => {
      const records = [makeRecord({ compliance_status: "Conditional", result: "Safe", carbon_monoxide_alarm_tested: true, next_inspection_date: daysFromNow(30) })];
      const alerts = identifyGasSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Not Inspected result does not trigger immediately_dangerous or at_risk_unremediated", () => {
      const records = [makeRecord({ result: "Not Inspected", remedial_completed: false, compliance_status: "Compliant", carbon_monoxide_alarm_tested: true, next_inspection_date: daysFromNow(30) })];
      const alerts = identifyGasSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateGasSafetyAriaInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("generateGasSafetyAriaInsights", () => {
  it("returns exactly 3 insights", () => {
    const records = [makeRecord()];
    const insights = generateGasSafetyAriaInsights(records);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty array", () => {
    const insights = generateGasSafetyAriaInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [red]", () => {
    const records = [makeRecord()];
    const insights = generateGasSafetyAriaInsights(records);
    expect(insights[0]).toMatch(/^\[red\]/);
  });

  it("second insight starts with [amber]", () => {
    const records = [makeRecord()];
    const insights = generateGasSafetyAriaInsights(records);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("third insight starts with [reflect]", () => {
    const records = [makeRecord()];
    const insights = generateGasSafetyAriaInsights(records);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("all insights are non-empty strings", () => {
    const records = [makeRecord()];
    const insights = generateGasSafetyAriaInsights(records);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  describe("first insight (red) — summary stats", () => {
    it("includes total inspection count", () => {
      const records = [makeRecord(), makeRecord(), makeRecord()];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[0]).toContain("3 gas safety inspections");
    });

    it("includes unique engineer count", () => {
      const records = [
        makeRecord({ engineer_name: "Engineer A" }),
        makeRecord({ engineer_name: "Engineer B" }),
      ];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[0]).toContain("2 engineers");
    });

    it("uses singular engineer for count of 1", () => {
      const records = [makeRecord({ engineer_name: "Single Engineer" })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[0]).toContain("1 engineer");
    });

    it("includes Immediately Dangerous count", () => {
      const records = [makeRecord({ result: "Immediately Dangerous" })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[0]).toContain("1 Immediately Dangerous");
    });

    it("includes At Risk count", () => {
      const records = [makeRecord({ result: "At Risk" }), makeRecord({ result: "At Risk" })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[0]).toContain("2 At Risk");
    });

    it("includes defects total", () => {
      const records = [makeRecord({ defects_found: 5 }), makeRecord({ defects_found: 3 })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[0]).toContain("8 total defects");
    });
  });

  describe("second insight (amber) — priority concerns", () => {
    it("mentions critical and high alerts when present", () => {
      const records = [makeRecord({ result: "Immediately Dangerous", compliance_status: "Non-Compliant" })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high");
    });

    it("mentions remedial completion rate when alerts present", () => {
      const records = [makeRecord({ result: "Immediately Dangerous", defects_found: 2, remedial_completed: true })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[1]).toContain("100%");
    });

    it("mentions no critical alerts when all clean", () => {
      const records = [makeRecord({ result: "Safe", compliance_status: "Compliant", carbon_monoxide_alarm_tested: true, next_inspection_date: daysFromNow(365) })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[1]).toContain("No critical or high-priority");
    });

    it("mentions Gas Safety Regulations when no alerts", () => {
      const records = [makeRecord({ result: "Safe", compliance_status: "Compliant", carbon_monoxide_alarm_tested: true, next_inspection_date: daysFromNow(365) })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[1]).toContain("Gas Safety Regulations");
    });

    it("uses singular for 1 non-compliant inspection", () => {
      const records = [makeRecord({ result: "Immediately Dangerous", compliance_status: "Non-Compliant" })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[1]).toContain("inspection has");
    });

    it("uses plural for multiple non-compliant inspections", () => {
      const records = [
        makeRecord({ result: "Immediately Dangerous", compliance_status: "Non-Compliant" }),
        makeRecord({ result: "Immediately Dangerous", compliance_status: "Expired" }),
      ];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[1]).toContain("inspections have");
    });
  });

  describe("third insight (reflect) — reflective question", () => {
    it("mentions Immediately Dangerous and At Risk counts when present", () => {
      const records = [makeRecord({ result: "Immediately Dangerous" }), makeRecord({ result: "At Risk" })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[2]).toContain("1 Immediately Dangerous");
      expect(insights[2]).toContain("1 At Risk");
    });

    it("asks about remedial tracking when no dangerous results but incomplete remedial", () => {
      const records = [makeRecord({ result: "Safe", defects_found: 2, remedial_completed: false })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[2]).toContain("remedial");
    });

    it("provides positive reflection when all clean", () => {
      const records = [makeRecord({ result: "Safe", defects_found: 0 })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[2]).toContain("no Immediately Dangerous or At Risk");
    });

    it("asks about staff awareness in positive reflection", () => {
      const records = [makeRecord({ result: "Safe", defects_found: 0 })];
      const insights = generateGasSafetyAriaInsights(records);
      expect(insights[2]).toContain("staff");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// makeRecord factory helper validation
// ══════════════════════════════════════════════════════════════════════════════

describe("makeRecord factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRecord();
    expect(r.home_id).toBe("home-1");
    expect(r.inspection_date).toBe("2026-05-01");
    expect(r.engineer_name).toBe("John Smith");
    expect(r.gas_safe_registration).toBe("GS-123456");
    expect(r.inspection_type).toBe("Annual CP12");
    expect(r.appliance_location).toBe("Kitchen");
    expect(r.result).toBe("Safe");
    expect(r.certificate_number).toBe("CP12-001");
    expect(r.defects_found).toBe(0);
    expect(r.remedial_completed).toBe(false);
    expect(r.certificate_issued).toBe(true);
    expect(r.carbon_monoxide_alarm_tested).toBe(true);
    expect(r.next_inspection_date).toBeNull();
    expect(r.compliance_status).toBe("Compliant");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ inspection_type: "Boiler Service", result: "At Risk" });
    expect(r.inspection_type).toBe("Boiler Service");
    expect(r.result).toBe("At Risk");
    // defaults still apply
    expect(r.compliance_status).toBe("Compliant");
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
    const r = makeRecord({ certificate_number: null, next_inspection_date: null, notes: null });
    expect(r.certificate_number).toBeNull();
    expect(r.next_inspection_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting defects_found", () => {
    const r = makeRecord({ defects_found: 7 });
    expect(r.defects_found).toBe(7);
  });

  it("allows setting boolean fields", () => {
    const r = makeRecord({ remedial_completed: true, certificate_issued: false, carbon_monoxide_alarm_tested: false });
    expect(r.remedial_completed).toBe(true);
    expect(r.certificate_issued).toBe(false);
    expect(r.carbon_monoxide_alarm_tested).toBe(false);
  });

  it("allows setting gas_safe_registration", () => {
    const r = makeRecord({ gas_safe_registration: "GS-999999" });
    expect(r.gas_safe_registration).toBe("GS-999999");
  });

  it("allows setting appliance_location", () => {
    const r = makeRecord({ appliance_location: "Utility Room" });
    expect(r.appliance_location).toBe("Utility Room");
  });
});
