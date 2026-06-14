// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ELECTRICAL SAFETY SERVICE TESTS
// Pure-function tests for electrical safety metrics, alert identification,
// Cara insights, constant validation, and edge cases.
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
} from "../home-electrical-safety-service";

import type {
  HomeElectricalSafetyRow,
  InspectionType,
  ResultValue,
  ComplianceStatus,
} from "../home-electrical-safety-service";

const {
  computeElectricalSafetyMetrics,
  identifyElectricalSafetyAlerts,
  generateElectricalSafetyCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<HomeElectricalSafetyRow>,
): HomeElectricalSafetyRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    inspection_date: "inspection_date" in (overrides ?? {}) ? overrides!.inspection_date! : "2026-05-01",
    inspector_name: "inspector_name" in (overrides ?? {}) ? overrides!.inspector_name! : "John Smith",
    inspection_type: "inspection_type" in (overrides ?? {}) ? overrides!.inspection_type! : "EICR",
    result: "result" in (overrides ?? {}) ? overrides!.result! : "Satisfactory",
    certificate_number: "certificate_number" in (overrides ?? {}) ? (overrides!.certificate_number ?? null) : "CERT-001",
    defects_found: "defects_found" in (overrides ?? {}) ? overrides!.defects_found! : 0,
    c1_defects: "c1_defects" in (overrides ?? {}) ? overrides!.c1_defects! : 0,
    c2_defects: "c2_defects" in (overrides ?? {}) ? overrides!.c2_defects! : 0,
    c3_defects: "c3_defects" in (overrides ?? {}) ? overrides!.c3_defects! : 0,
    fi_defects: "fi_defects" in (overrides ?? {}) ? overrides!.fi_defects! : 0,
    remedial_completed: "remedial_completed" in (overrides ?? {}) ? overrides!.remedial_completed! : false,
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

    it("contains EICR", () => {
      expect(INSPECTION_TYPES).toContain("EICR");
    });

    it("contains PAT Testing", () => {
      expect(INSPECTION_TYPES).toContain("PAT Testing");
    });

    it("contains Emergency Lighting", () => {
      expect(INSPECTION_TYPES).toContain("Emergency Lighting");
    });

    it("contains Fire Alarm", () => {
      expect(INSPECTION_TYPES).toContain("Fire Alarm");
    });

    it("contains Lightning Protection", () => {
      expect(INSPECTION_TYPES).toContain("Lightning Protection");
    });

    it("contains Visual Inspection", () => {
      expect(INSPECTION_TYPES).toContain("Visual Inspection");
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

    it("contains Satisfactory", () => {
      expect(RESULT_VALUES).toContain("Satisfactory");
    });

    it("contains Unsatisfactory", () => {
      expect(RESULT_VALUES).toContain("Unsatisfactory");
    });

    it("contains Further Investigation", () => {
      expect(RESULT_VALUES).toContain("Further Investigation");
    });

    it("contains Not Tested", () => {
      expect(RESULT_VALUES).toContain("Not Tested");
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

    it("contains Minor Non-Compliance", () => {
      expect(COMPLIANCE_STATUSES).toContain("Minor Non-Compliance");
    });

    it("contains Major Non-Compliance", () => {
      expect(COMPLIANCE_STATUSES).toContain("Major Non-Compliance");
    });

    it("contains Critical Non-Compliance", () => {
      expect(COMPLIANCE_STATUSES).toContain("Critical Non-Compliance");
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
// computeElectricalSafetyMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeElectricalSafetyMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_inspections", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.total_inspections).toBe(0);
    });

    it("returns zero unsatisfactory_count", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.unsatisfactory_count).toBe(0);
    });

    it("returns zero c1_total", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.c1_total).toBe(0);
    });

    it("returns zero c2_total", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.c2_total).toBe(0);
    });

    it("returns zero c3_total", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.c3_total).toBe(0);
    });

    it("returns zero fi_total", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.fi_total).toBe(0);
    });

    it("returns zero remedial_completion_rate", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns zero satisfactory_rate", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.satisfactory_rate).toBe(0);
    });

    it("returns zero next_inspection_scheduled_rate", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.next_inspection_scheduled_rate).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero unique_inspectors", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.unique_inspectors).toBe(0);
    });

    it("returns empty by_inspection_type", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.by_inspection_type).toEqual({});
    });

    it("returns empty by_result", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.by_result).toEqual({});
    });

    it("returns empty by_compliance_status", () => {
      const m = computeElectricalSafetyMetrics([]);
      expect(m.by_compliance_status).toEqual({});
    });
  });

  describe("single satisfactory record", () => {
    const record = makeRecord({
      inspection_type: "EICR",
      result: "Satisfactory",
      defects_found: 0,
      c1_defects: 0,
      c2_defects: 0,
      c3_defects: 0,
      fi_defects: 0,
      remedial_completed: false,
      next_inspection_date: "2031-05-01",
      compliance_status: "Compliant",
      inspector_name: "John Smith",
    });

    it("returns total_inspections = 1", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.total_inspections).toBe(1);
    });

    it("returns unsatisfactory_count = 0", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.unsatisfactory_count).toBe(0);
    });

    it("returns c1_total = 0", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.c1_total).toBe(0);
    });

    it("returns c2_total = 0", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.c2_total).toBe(0);
    });

    it("returns c3_total = 0", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.c3_total).toBe(0);
    });

    it("returns fi_total = 0", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.fi_total).toBe(0);
    });

    it("returns remedial_completion_rate = 0 (no defects so no applicable records)", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns satisfactory_rate = 100", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.satisfactory_rate).toBe(100);
    });

    it("returns next_inspection_scheduled_rate = 100", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.next_inspection_scheduled_rate).toBe(100);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns unique_inspectors = 1", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.unique_inspectors).toBe(1);
    });

    it("returns by_inspection_type with single entry", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.by_inspection_type).toEqual({ EICR: 1 });
    });

    it("returns by_result with single entry", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.by_result).toEqual({ Satisfactory: 1 });
    });

    it("returns by_compliance_status with single entry", () => {
      const m = computeElectricalSafetyMetrics([record]);
      expect(m.by_compliance_status).toEqual({ Compliant: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ inspection_type: "EICR", result: "Satisfactory", defects_found: 0, c1_defects: 0, c2_defects: 0, c3_defects: 0, fi_defects: 0, compliance_status: "Compliant", next_inspection_date: "2031-05-01", inspector_name: "Inspector A" }),
      makeRecord({ inspection_type: "PAT Testing", result: "Unsatisfactory", defects_found: 3, c1_defects: 1, c2_defects: 1, c3_defects: 1, fi_defects: 0, remedial_completed: false, compliance_status: "Major Non-Compliance", next_inspection_date: null, inspector_name: "Inspector B" }),
      makeRecord({ inspection_type: "Emergency Lighting", result: "Further Investigation", defects_found: 2, c1_defects: 0, c2_defects: 2, c3_defects: 0, fi_defects: 0, remedial_completed: true, compliance_status: "Minor Non-Compliance", next_inspection_date: "2027-01-01", inspector_name: "Inspector A" }),
      makeRecord({ inspection_type: "Fire Alarm", result: "Satisfactory", defects_found: 1, c1_defects: 0, c2_defects: 0, c3_defects: 0, fi_defects: 1, remedial_completed: true, compliance_status: "Compliant", next_inspection_date: "2027-06-01", inspector_name: "Inspector C" }),
      makeRecord({ inspection_type: "Visual Inspection", result: "Not Tested", defects_found: 0, c1_defects: 0, c2_defects: 0, c3_defects: 0, fi_defects: 0, compliance_status: "Critical Non-Compliance", next_inspection_date: null, inspector_name: "Inspector B" }),
    ];

    it("returns total_inspections = 5", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.total_inspections).toBe(5);
    });

    it("returns unsatisfactory_count = 1", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.unsatisfactory_count).toBe(1);
    });

    it("returns c1_total = 1", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.c1_total).toBe(1);
    });

    it("returns c2_total = 3", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.c2_total).toBe(3);
    });

    it("returns c3_total = 1", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.c3_total).toBe(1);
    });

    it("returns fi_total = 1", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.fi_total).toBe(1);
    });

    it("calculates remedial_completion_rate (2/3 = 66.7%)", () => {
      // defects_found > 0: records 1,2,3 = 3 applicable; completed: records 2,3 = 2
      const m = computeElectricalSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(66.7);
    });

    it("calculates satisfactory_rate (2/5 = 40%)", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.satisfactory_rate).toBe(40);
    });

    it("calculates next_inspection_scheduled_rate (3/5 = 60%)", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.next_inspection_scheduled_rate).toBe(60);
    });

    it("returns non_compliant_count = 2 (Major + Critical)", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });

    it("returns unique_inspectors = 3", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.unique_inspectors).toBe(3);
    });

    it("groups by_inspection_type correctly", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.by_inspection_type).toEqual({
        EICR: 1,
        "PAT Testing": 1,
        "Emergency Lighting": 1,
        "Fire Alarm": 1,
        "Visual Inspection": 1,
      });
    });

    it("groups by_result correctly", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.by_result).toEqual({
        Satisfactory: 2,
        Unsatisfactory: 1,
        "Further Investigation": 1,
        "Not Tested": 1,
      });
    });

    it("groups by_compliance_status correctly", () => {
      const m = computeElectricalSafetyMetrics(records);
      expect(m.by_compliance_status).toEqual({
        Compliant: 2,
        "Minor Non-Compliance": 1,
        "Major Non-Compliance": 1,
        "Critical Non-Compliance": 1,
      });
    });
  });

  describe("unsatisfactory_count", () => {
    it("counts only Unsatisfactory results", () => {
      const records = [
        makeRecord({ result: "Unsatisfactory" }),
        makeRecord({ result: "Unsatisfactory" }),
        makeRecord({ result: "Satisfactory" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.unsatisfactory_count).toBe(2);
    });

    it("does not count Further Investigation as unsatisfactory", () => {
      const records = [makeRecord({ result: "Further Investigation" })];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.unsatisfactory_count).toBe(0);
    });

    it("does not count Not Tested as unsatisfactory", () => {
      const records = [makeRecord({ result: "Not Tested" })];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.unsatisfactory_count).toBe(0);
    });

    it("does not count Satisfactory as unsatisfactory", () => {
      const records = [makeRecord({ result: "Satisfactory" })];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.unsatisfactory_count).toBe(0);
    });
  });

  describe("defect totals (c1, c2, c3, fi)", () => {
    it("sums c1_defects across all records", () => {
      const records = [
        makeRecord({ c1_defects: 2 }),
        makeRecord({ c1_defects: 3 }),
        makeRecord({ c1_defects: 0 }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.c1_total).toBe(5);
    });

    it("sums c2_defects across all records", () => {
      const records = [
        makeRecord({ c2_defects: 1 }),
        makeRecord({ c2_defects: 4 }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.c2_total).toBe(5);
    });

    it("sums c3_defects across all records", () => {
      const records = [
        makeRecord({ c3_defects: 10 }),
        makeRecord({ c3_defects: 5 }),
        makeRecord({ c3_defects: 3 }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.c3_total).toBe(18);
    });

    it("sums fi_defects across all records", () => {
      const records = [
        makeRecord({ fi_defects: 2 }),
        makeRecord({ fi_defects: 2 }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.fi_total).toBe(4);
    });

    it("returns zero for each when all records have zero defects", () => {
      const records = [
        makeRecord({ c1_defects: 0, c2_defects: 0, c3_defects: 0, fi_defects: 0 }),
        makeRecord({ c1_defects: 0, c2_defects: 0, c3_defects: 0, fi_defects: 0 }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.c1_total).toBe(0);
      expect(m.c2_total).toBe(0);
      expect(m.c3_total).toBe(0);
      expect(m.fi_total).toBe(0);
    });

    it("handles a single record with multiple defects", () => {
      const records = [makeRecord({ c1_defects: 1, c2_defects: 2, c3_defects: 3, fi_defects: 4 })];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.c1_total).toBe(1);
      expect(m.c2_total).toBe(2);
      expect(m.c3_total).toBe(3);
      expect(m.fi_total).toBe(4);
    });
  });

  describe("remedial_completion_rate", () => {
    it("only considers records where defects_found > 0", () => {
      const records = [
        makeRecord({ defects_found: 0, remedial_completed: false }),
        makeRecord({ defects_found: 2, remedial_completed: true }),
      ];
      // applicable = 1, completed = 1, rate = 100
      const m = computeElectricalSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(100);
    });

    it("returns 0 when no records have defects", () => {
      const records = [
        makeRecord({ defects_found: 0, remedial_completed: false }),
        makeRecord({ defects_found: 0, remedial_completed: false }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns 0 when all defective records are unremediated", () => {
      const records = [
        makeRecord({ defects_found: 3, remedial_completed: false }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns 100 when all defective records are remediated", () => {
      const records = [
        makeRecord({ defects_found: 5, remedial_completed: true }),
        makeRecord({ defects_found: 2, remedial_completed: true }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(100);
    });

    it("calculates rate with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ defects_found: 1, remedial_completed: true }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ defects_found: 1, remedial_completed: true }),
        makeRecord({ defects_found: 1, remedial_completed: true }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(66.7);
    });

    it("calculates rate (1/6 = 16.7%)", () => {
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRecord({ defects_found: 1, remedial_completed: i === 0 }),
      );
      const m = computeElectricalSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(16.7);
    });
  });

  describe("satisfactory_rate", () => {
    it("returns 100 when all satisfactory", () => {
      const records = [
        makeRecord({ result: "Satisfactory" }),
        makeRecord({ result: "Satisfactory" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.satisfactory_rate).toBe(100);
    });

    it("returns 0 when none satisfactory", () => {
      const records = [
        makeRecord({ result: "Unsatisfactory" }),
        makeRecord({ result: "Further Investigation" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.satisfactory_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ result: "Satisfactory" }),
        makeRecord({ result: "Unsatisfactory" }),
        makeRecord({ result: "Not Tested" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.satisfactory_rate).toBe(33.3);
    });

    it("calculates rate (3/4 = 75%)", () => {
      const records = [
        makeRecord({ result: "Satisfactory" }),
        makeRecord({ result: "Satisfactory" }),
        makeRecord({ result: "Satisfactory" }),
        makeRecord({ result: "Unsatisfactory" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.satisfactory_rate).toBe(75);
    });
  });

  describe("next_inspection_scheduled_rate", () => {
    it("returns 100 when all have next_inspection_date", () => {
      const records = [
        makeRecord({ next_inspection_date: "2031-01-01" }),
        makeRecord({ next_inspection_date: "2032-01-01" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.next_inspection_scheduled_rate).toBe(100);
    });

    it("returns 0 when none have next_inspection_date", () => {
      const records = [
        makeRecord({ next_inspection_date: null }),
        makeRecord({ next_inspection_date: null }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.next_inspection_scheduled_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ next_inspection_date: "2031-01-01" }),
        makeRecord({ next_inspection_date: null }),
        makeRecord({ next_inspection_date: null }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.next_inspection_scheduled_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ next_inspection_date: "2031-01-01" }),
        makeRecord({ next_inspection_date: "2032-01-01" }),
        makeRecord({ next_inspection_date: null }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.next_inspection_scheduled_rate).toBe(66.7);
    });
  });

  describe("non_compliant_count", () => {
    it("counts Major Non-Compliance", () => {
      const records = [makeRecord({ compliance_status: "Major Non-Compliance" })];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts Critical Non-Compliance", () => {
      const records = [makeRecord({ compliance_status: "Critical Non-Compliance" })];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts both Major and Critical together", () => {
      const records = [
        makeRecord({ compliance_status: "Major Non-Compliance" }),
        makeRecord({ compliance_status: "Critical Non-Compliance" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });

    it("does not count Compliant", () => {
      const records = [makeRecord({ compliance_status: "Compliant" })];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Minor Non-Compliance", () => {
      const records = [makeRecord({ compliance_status: "Minor Non-Compliance" })];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });
  });

  describe("unique_inspectors", () => {
    it("counts distinct inspector names", () => {
      const records = [
        makeRecord({ inspector_name: "Inspector A" }),
        makeRecord({ inspector_name: "Inspector B" }),
        makeRecord({ inspector_name: "Inspector A" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.unique_inspectors).toBe(2);
    });

    it("returns 1 when all same inspector", () => {
      const records = [
        makeRecord({ inspector_name: "John Smith" }),
        makeRecord({ inspector_name: "John Smith" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.unique_inspectors).toBe(1);
    });

    it("treats different names as different inspectors", () => {
      const records = [
        makeRecord({ inspector_name: "Inspector A" }),
        makeRecord({ inspector_name: "Inspector B" }),
        makeRecord({ inspector_name: "Inspector C" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.unique_inspectors).toBe(3);
    });
  });

  describe("by_inspection_type breakdown", () => {
    it("counts each inspection type separately", () => {
      const records = [
        makeRecord({ inspection_type: "EICR" }),
        makeRecord({ inspection_type: "EICR" }),
        makeRecord({ inspection_type: "PAT Testing" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.by_inspection_type).toEqual({ EICR: 2, "PAT Testing": 1 });
    });

    it("handles all six inspection types", () => {
      const types: InspectionType[] = ["EICR", "PAT Testing", "Emergency Lighting", "Fire Alarm", "Lightning Protection", "Visual Inspection"];
      const records = types.map((t) => makeRecord({ inspection_type: t }));
      const m = computeElectricalSafetyMetrics(records);
      for (const t of types) {
        expect(m.by_inspection_type[t]).toBe(1);
      }
    });
  });

  describe("by_result breakdown", () => {
    it("counts each result value separately", () => {
      const records = [
        makeRecord({ result: "Satisfactory" }),
        makeRecord({ result: "Satisfactory" }),
        makeRecord({ result: "Unsatisfactory" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.by_result).toEqual({ Satisfactory: 2, Unsatisfactory: 1 });
    });

    it("handles all four result values", () => {
      const results: ResultValue[] = ["Satisfactory", "Unsatisfactory", "Further Investigation", "Not Tested"];
      const records = results.map((r) => makeRecord({ result: r }));
      const m = computeElectricalSafetyMetrics(records);
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
        makeRecord({ compliance_status: "Major Non-Compliance" }),
      ];
      const m = computeElectricalSafetyMetrics(records);
      expect(m.by_compliance_status).toEqual({ Compliant: 2, "Major Non-Compliance": 1 });
    });

    it("handles all four compliance statuses", () => {
      const statuses: ComplianceStatus[] = ["Compliant", "Minor Non-Compliance", "Major Non-Compliance", "Critical Non-Compliance"];
      const records = statuses.map((s) => makeRecord({ compliance_status: s }));
      const m = computeElectricalSafetyMetrics(records);
      for (const s of statuses) {
        expect(m.by_compliance_status[s]).toBe(1);
      }
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: HomeElectricalSafetyRow[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            inspection_type: i % 2 === 0 ? "EICR" : "PAT Testing",
            result: i % 4 === 0 ? "Satisfactory" : "Unsatisfactory",
            defects_found: i % 3 === 0 ? 0 : 1,
            c1_defects: i % 10 === 0 ? 1 : 0,
            c2_defects: i % 5 === 0 ? 1 : 0,
            c3_defects: 1,
            fi_defects: 0,
            remedial_completed: i % 2 === 0,
            compliance_status: "Compliant",
            inspector_name: `Inspector ${i % 5}`,
          }),
        );
      }
      const m = computeElectricalSafetyMetrics(records);
      expect(m.total_inspections).toBe(100);
      expect(m.c3_total).toBe(100);
      expect(m.unique_inspectors).toBe(5);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyElectricalSafetyAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyElectricalSafetyAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyElectricalSafetyAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          result: "Satisfactory",
          c1_defects: 0,
          c2_defects: 0,
          compliance_status: "Compliant",
          remedial_completed: false,
          next_inspection_date: daysFromNow(30),
        }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  // ── c1_danger_present alert ─────────────────────────────────────────────

  describe("c1_danger_present alert", () => {
    it("fires when c1_defects > 0", () => {
      const records = [makeRecord({ c1_defects: 1 })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c1_danger_present");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ c1_defects: 1 })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c1_danger_present")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-c1-1", c1_defects: 2 })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c1_danger_present")!;
      expect(alert.record_id).toBe("rec-c1-1");
    });

    it("includes defect count in message", () => {
      const records = [makeRecord({ c1_defects: 3, inspection_type: "EICR", inspection_date: "2026-05-01" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c1_danger_present")!;
      expect(alert.message).toContain("3 C1");
    });

    it("uses singular defect for count of 1", () => {
      const records = [makeRecord({ c1_defects: 1 })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c1_danger_present")!;
      expect(alert.message).toContain("defect");
      expect(alert.message).not.toContain("defects");
    });

    it("uses plural defects for count > 1", () => {
      const records = [makeRecord({ c1_defects: 2 })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c1_danger_present")!;
      expect(alert.message).toContain("defects");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ c1_defects: 1, inspection_type: "PAT Testing" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c1_danger_present")!;
      expect(alert.message).toContain("PAT Testing");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ c1_defects: 1, inspection_date: "2026-03-15" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c1_danger_present")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("includes BS 7671 reference in message", () => {
      const records = [makeRecord({ c1_defects: 1 })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c1_danger_present")!;
      expect(alert.message).toContain("BS 7671");
    });

    it("does not fire when c1_defects = 0", () => {
      const records = [makeRecord({ c1_defects: 0 })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c1_danger_present");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple records with C1 defects", () => {
      const records = [
        makeRecord({ c1_defects: 1 }),
        makeRecord({ c1_defects: 2 }),
        makeRecord({ c1_defects: 0 }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      const c1Alerts = alerts.filter((a) => a.type === "c1_danger_present");
      expect(c1Alerts).toHaveLength(2);
    });
  });

  // ── unsatisfactory_unremediated alert ──────────────────────────────────

  describe("unsatisfactory_unremediated alert", () => {
    it("fires when result is Unsatisfactory and remedial_completed is false", () => {
      const records = [makeRecord({ result: "Unsatisfactory", remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "unsatisfactory_unremediated");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ result: "Unsatisfactory", remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "unsatisfactory_unremediated")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-unsat-1", result: "Unsatisfactory", remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "unsatisfactory_unremediated")!;
      expect(alert.record_id).toBe("rec-unsat-1");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ result: "Unsatisfactory", remedial_completed: false, inspection_type: "EICR" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "unsatisfactory_unremediated")!;
      expect(alert.message).toContain("EICR");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ result: "Unsatisfactory", remedial_completed: false, inspection_date: "2026-04-20" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "unsatisfactory_unremediated")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("does not fire when result is Unsatisfactory but remedial_completed is true", () => {
      const records = [makeRecord({ result: "Unsatisfactory", remedial_completed: true })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "unsatisfactory_unremediated");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Satisfactory", () => {
      const records = [makeRecord({ result: "Satisfactory", remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "unsatisfactory_unremediated");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Further Investigation", () => {
      const records = [makeRecord({ result: "Further Investigation", remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "unsatisfactory_unremediated");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Not Tested", () => {
      const records = [makeRecord({ result: "Not Tested", remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "unsatisfactory_unremediated");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple unsatisfactory unremediated records", () => {
      const records = [
        makeRecord({ result: "Unsatisfactory", remedial_completed: false }),
        makeRecord({ result: "Unsatisfactory", remedial_completed: false }),
        makeRecord({ result: "Unsatisfactory", remedial_completed: true }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      const unAlerts = alerts.filter((a) => a.type === "unsatisfactory_unremediated");
      expect(unAlerts).toHaveLength(2);
    });
  });

  // ── c2_potentially_dangerous alert ────────────────────────────────────

  describe("c2_potentially_dangerous alert", () => {
    it("fires when c2_defects > 0 and remedial_completed is false", () => {
      const records = [makeRecord({ c2_defects: 1, remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c2_potentially_dangerous");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ c2_defects: 1, remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c2_potentially_dangerous")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-c2-1", c2_defects: 3, remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c2_potentially_dangerous")!;
      expect(alert.record_id).toBe("rec-c2-1");
    });

    it("includes defect count in message", () => {
      const records = [makeRecord({ c2_defects: 4, remedial_completed: false, inspection_type: "EICR" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c2_potentially_dangerous")!;
      expect(alert.message).toContain("4 C2");
    });

    it("uses singular defect for count of 1", () => {
      const records = [makeRecord({ c2_defects: 1, remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c2_potentially_dangerous")!;
      expect(alert.message).toContain("defect");
      expect(alert.message).not.toContain("defects");
    });

    it("uses plural defects for count > 1", () => {
      const records = [makeRecord({ c2_defects: 5, remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c2_potentially_dangerous")!;
      expect(alert.message).toContain("defects");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ c2_defects: 1, remedial_completed: false, inspection_type: "Emergency Lighting" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c2_potentially_dangerous")!;
      expect(alert.message).toContain("Emergency Lighting");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ c2_defects: 1, remedial_completed: false, inspection_date: "2026-02-10" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c2_potentially_dangerous")!;
      expect(alert.message).toContain("2026-02-10");
    });

    it("does not fire when c2_defects > 0 but remedial_completed is true", () => {
      const records = [makeRecord({ c2_defects: 3, remedial_completed: true })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c2_potentially_dangerous");
      expect(alert).toBeUndefined();
    });

    it("does not fire when c2_defects = 0", () => {
      const records = [makeRecord({ c2_defects: 0, remedial_completed: false })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "c2_potentially_dangerous");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple records with C2 defects unremediated", () => {
      const records = [
        makeRecord({ c2_defects: 1, remedial_completed: false }),
        makeRecord({ c2_defects: 2, remedial_completed: false }),
        makeRecord({ c2_defects: 1, remedial_completed: true }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      const c2Alerts = alerts.filter((a) => a.type === "c2_potentially_dangerous");
      expect(c2Alerts).toHaveLength(2);
    });
  });

  // ── critical_non_compliance alert ─────────────────────────────────────

  describe("critical_non_compliance alert", () => {
    it("fires when compliance_status is Critical Non-Compliance", () => {
      const records = [makeRecord({ compliance_status: "Critical Non-Compliance" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "critical_non_compliance");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ compliance_status: "Critical Non-Compliance" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "critical_non_compliance")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-cnc-1", compliance_status: "Critical Non-Compliance" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "critical_non_compliance")!;
      expect(alert.record_id).toBe("rec-cnc-1");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ compliance_status: "Critical Non-Compliance", inspection_type: "Fire Alarm" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "critical_non_compliance")!;
      expect(alert.message).toContain("Fire Alarm");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ compliance_status: "Critical Non-Compliance", inspection_date: "2026-01-15" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "critical_non_compliance")!;
      expect(alert.message).toContain("2026-01-15");
    });

    it("includes BS 7671 reference in message", () => {
      const records = [makeRecord({ compliance_status: "Critical Non-Compliance" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "critical_non_compliance")!;
      expect(alert.message).toContain("BS 7671");
    });

    it("does not fire for Compliant status", () => {
      const records = [makeRecord({ compliance_status: "Compliant" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "critical_non_compliance");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Minor Non-Compliance", () => {
      const records = [makeRecord({ compliance_status: "Minor Non-Compliance" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "critical_non_compliance");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Major Non-Compliance (handled separately)", () => {
      const records = [makeRecord({ compliance_status: "Major Non-Compliance" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "critical_non_compliance");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Critical Non-Compliance records", () => {
      const records = [
        makeRecord({ compliance_status: "Critical Non-Compliance" }),
        makeRecord({ compliance_status: "Critical Non-Compliance" }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      const cncAlerts = alerts.filter((a) => a.type === "critical_non_compliance");
      expect(cncAlerts).toHaveLength(2);
    });
  });

  // ── major_non_compliance alert ────────────────────────────────────────

  describe("major_non_compliance alert", () => {
    it("fires when compliance_status is Major Non-Compliance", () => {
      const records = [makeRecord({ compliance_status: "Major Non-Compliance" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_non_compliance");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ compliance_status: "Major Non-Compliance" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_non_compliance")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-mnc-1", compliance_status: "Major Non-Compliance" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_non_compliance")!;
      expect(alert.record_id).toBe("rec-mnc-1");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ compliance_status: "Major Non-Compliance", inspection_type: "Lightning Protection" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_non_compliance")!;
      expect(alert.message).toContain("Lightning Protection");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ compliance_status: "Major Non-Compliance", inspection_date: "2026-06-01" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_non_compliance")!;
      expect(alert.message).toContain("2026-06-01");
    });

    it("does not fire for Compliant status", () => {
      const records = [makeRecord({ compliance_status: "Compliant" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_non_compliance");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Minor Non-Compliance", () => {
      const records = [makeRecord({ compliance_status: "Minor Non-Compliance" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_non_compliance");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Major Non-Compliance records", () => {
      const records = [
        makeRecord({ compliance_status: "Major Non-Compliance" }),
        makeRecord({ compliance_status: "Major Non-Compliance" }),
        makeRecord({ compliance_status: "Major Non-Compliance" }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      const mncAlerts = alerts.filter((a) => a.type === "major_non_compliance");
      expect(mncAlerts).toHaveLength(3);
    });
  });

  // ── inspection_overdue alert ──────────────────────────────────────────

  describe("inspection_overdue alert", () => {
    it("fires when next_inspection_date is in the past", () => {
      const records = [makeRecord({ next_inspection_date: daysAgo(1) })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ next_inspection_date: daysAgo(5) })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-over-1", next_inspection_date: daysAgo(10) })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue")!;
      expect(alert.record_id).toBe("rec-over-1");
    });

    it("includes inspection_type in message", () => {
      const records = [makeRecord({ next_inspection_date: daysAgo(1), inspection_type: "EICR" })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue")!;
      expect(alert.message).toContain("EICR");
    });

    it("includes next_inspection_date in message", () => {
      const past = daysAgo(7);
      const records = [makeRecord({ next_inspection_date: past })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue")!;
      expect(alert.message).toContain(past);
    });

    it("does not fire when next_inspection_date is in the future", () => {
      const records = [makeRecord({ next_inspection_date: daysFromNow(30) })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when next_inspection_date is null", () => {
      const records = [makeRecord({ next_inspection_date: null })];
      const alerts = identifyElectricalSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "inspection_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple overdue records", () => {
      const records = [
        makeRecord({ next_inspection_date: daysAgo(10) }),
        makeRecord({ next_inspection_date: daysAgo(20) }),
        makeRecord({ next_inspection_date: daysFromNow(5) }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
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
          c1_defects: 1,
          c2_defects: 1,
          result: "Unsatisfactory",
          remedial_completed: false,
          compliance_status: "Critical Non-Compliance",
          next_inspection_date: daysAgo(5),
        }),
        makeRecord({
          id: "r2",
          compliance_status: "Major Non-Compliance",
        }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("c1_danger_present");
      expect(types).toContain("unsatisfactory_unremediated");
      expect(types).toContain("c2_potentially_dangerous");
      expect(types).toContain("critical_non_compliance");
      expect(types).toContain("major_non_compliance");
      expect(types).toContain("inspection_overdue");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({
          c1_defects: 1,
          c2_defects: 1,
          result: "Unsatisfactory",
          remedial_completed: false,
          compliance_status: "Critical Non-Compliance",
          next_inspection_date: daysAgo(5),
        }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      // c1_danger_present=1, unsatisfactory_unremediated=1, c2_potentially_dangerous=1,
      // critical_non_compliance=1, inspection_overdue=1
      expect(alerts).toHaveLength(5);
    });

    it("per-record alerts multiply with multiple records", () => {
      const records = [
        makeRecord({ c1_defects: 1, result: "Unsatisfactory", remedial_completed: false }),
        makeRecord({ c1_defects: 2, result: "Unsatisfactory", remedial_completed: false }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      expect(alerts.filter((a) => a.type === "c1_danger_present")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "unsatisfactory_unremediated")).toHaveLength(2);
    });
  });

  // ── alert structure ───────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const records = [
        makeRecord({ c1_defects: 1, result: "Unsatisfactory", remedial_completed: false, next_inspection_date: daysAgo(1) }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({
          c1_defects: 1,
          c2_defects: 1,
          result: "Unsatisfactory",
          remedial_completed: false,
          compliance_status: "Critical Non-Compliance",
          next_inspection_date: daysAgo(5),
        }),
      ];
      const alerts = identifyElectricalSafetyAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ c1_defects: 1 })];
      const alerts = identifyElectricalSafetyAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  // ── edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("Satisfactory result with no defects triggers no alerts when next_inspection_date is future", () => {
      const records = [makeRecord({ result: "Satisfactory", c1_defects: 0, c2_defects: 0, compliance_status: "Compliant", next_inspection_date: daysFromNow(365) })];
      const alerts = identifyElectricalSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("high c3_defects alone do not trigger any alert", () => {
      const records = [makeRecord({ c3_defects: 50, c1_defects: 0, c2_defects: 0, result: "Satisfactory", compliance_status: "Compliant", next_inspection_date: daysFromNow(30) })];
      const alerts = identifyElectricalSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("high fi_defects alone do not trigger any alert", () => {
      const records = [makeRecord({ fi_defects: 20, c1_defects: 0, c2_defects: 0, result: "Satisfactory", compliance_status: "Compliant", next_inspection_date: daysFromNow(30) })];
      const alerts = identifyElectricalSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Unsatisfactory with remedial_completed does not fire unsatisfactory_unremediated", () => {
      const records = [makeRecord({ result: "Unsatisfactory", remedial_completed: true, c1_defects: 0, c2_defects: 0, compliance_status: "Compliant", next_inspection_date: daysFromNow(30) })];
      const alerts = identifyElectricalSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("c2_defects with remedial_completed does not fire c2_potentially_dangerous", () => {
      const records = [makeRecord({ c2_defects: 5, remedial_completed: true, c1_defects: 0, result: "Satisfactory", compliance_status: "Compliant", next_inspection_date: daysFromNow(30) })];
      const alerts = identifyElectricalSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateElectricalSafetyCaraInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("generateElectricalSafetyCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const records = [makeRecord()];
    const insights = generateElectricalSafetyCaraInsights(records);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty array", () => {
    const insights = generateElectricalSafetyCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [red]", () => {
    const records = [makeRecord()];
    const insights = generateElectricalSafetyCaraInsights(records);
    expect(insights[0]).toMatch(/^\[red\]/);
  });

  it("second insight starts with [amber]", () => {
    const records = [makeRecord()];
    const insights = generateElectricalSafetyCaraInsights(records);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("third insight starts with [reflect]", () => {
    const records = [makeRecord()];
    const insights = generateElectricalSafetyCaraInsights(records);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("all insights are non-empty strings", () => {
    const records = [makeRecord()];
    const insights = generateElectricalSafetyCaraInsights(records);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  describe("first insight (red) — summary stats", () => {
    it("includes total inspection count", () => {
      const records = [makeRecord(), makeRecord(), makeRecord()];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[0]).toContain("3 electrical safety inspections");
    });

    it("includes unique inspector count", () => {
      const records = [
        makeRecord({ inspector_name: "Inspector A" }),
        makeRecord({ inspector_name: "Inspector B" }),
      ];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[0]).toContain("2 inspectors");
    });

    it("uses singular inspector for count of 1", () => {
      const records = [makeRecord({ inspector_name: "Single Inspector" })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[0]).toContain("1 inspector");
    });

    it("includes satisfactory rate", () => {
      const records = [
        makeRecord({ result: "Satisfactory" }),
        makeRecord({ result: "Unsatisfactory" }),
      ];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[0]).toContain("50%");
    });

    it("includes C1 defect total", () => {
      const records = [makeRecord({ c1_defects: 3 })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[0]).toContain("3 C1");
    });

    it("includes C2 defect total", () => {
      const records = [makeRecord({ c2_defects: 7 })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[0]).toContain("7 C2");
    });

    it("includes C3 defect total", () => {
      const records = [makeRecord({ c3_defects: 12 })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[0]).toContain("12 C3");
    });

    it("includes FI defect total", () => {
      const records = [makeRecord({ fi_defects: 5 })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[0]).toContain("5 FI");
    });
  });

  describe("second insight (amber) — priority concerns", () => {
    it("mentions critical and high alerts when present", () => {
      const records = [makeRecord({ c1_defects: 1, compliance_status: "Major Non-Compliance" })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high");
    });

    it("mentions remedial completion rate", () => {
      const records = [makeRecord({ defects_found: 2, remedial_completed: true })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[1]).toContain("100%");
    });

    it("mentions no critical alerts when all clean", () => {
      const records = [makeRecord({ result: "Satisfactory", compliance_status: "Compliant", c1_defects: 0, c2_defects: 0, next_inspection_date: daysFromNow(365) })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[1]).toContain("No critical or high-priority");
    });

    it("mentions BS 7671 when no alerts", () => {
      const records = [makeRecord({ result: "Satisfactory", compliance_status: "Compliant", c1_defects: 0, c2_defects: 0, next_inspection_date: daysFromNow(365) })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[1]).toContain("BS 7671");
    });

    it("uses singular for 1 non-compliant inspection", () => {
      const records = [makeRecord({ c1_defects: 1, compliance_status: "Critical Non-Compliance" })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[1]).toContain("inspection has");
    });

    it("uses plural for multiple non-compliant inspections", () => {
      const records = [
        makeRecord({ c1_defects: 1, compliance_status: "Critical Non-Compliance" }),
        makeRecord({ c1_defects: 1, compliance_status: "Major Non-Compliance" }),
      ];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[1]).toContain("inspections have");
    });
  });

  describe("third insight (reflect) — reflective question", () => {
    it("mentions C1 and C2 defects when present", () => {
      const records = [makeRecord({ c1_defects: 2, c2_defects: 3 })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[2]).toContain("2 C1");
      expect(insights[2]).toContain("3 C2");
    });

    it("asks about remedial tracking when no C1/C2 but incomplete remedial", () => {
      const records = [makeRecord({ c1_defects: 0, c2_defects: 0, defects_found: 2, remedial_completed: false })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[2]).toContain("remedial");
    });

    it("provides positive reflection when all clean", () => {
      const records = [makeRecord({ c1_defects: 0, c2_defects: 0, defects_found: 0 })];
      const insights = generateElectricalSafetyCaraInsights(records);
      expect(insights[2]).toContain("no C1 or C2 defects");
    });

    it("asks about staff awareness in positive reflection", () => {
      const records = [makeRecord({ c1_defects: 0, c2_defects: 0, defects_found: 0 })];
      const insights = generateElectricalSafetyCaraInsights(records);
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
    expect(r.inspector_name).toBe("John Smith");
    expect(r.inspection_type).toBe("EICR");
    expect(r.result).toBe("Satisfactory");
    expect(r.certificate_number).toBe("CERT-001");
    expect(r.defects_found).toBe(0);
    expect(r.c1_defects).toBe(0);
    expect(r.c2_defects).toBe(0);
    expect(r.c3_defects).toBe(0);
    expect(r.fi_defects).toBe(0);
    expect(r.remedial_completed).toBe(false);
    expect(r.next_inspection_date).toBeNull();
    expect(r.compliance_status).toBe("Compliant");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ inspection_type: "PAT Testing", result: "Unsatisfactory" });
    expect(r.inspection_type).toBe("PAT Testing");
    expect(r.result).toBe("Unsatisfactory");
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

  it("allows setting defect counts", () => {
    const r = makeRecord({ c1_defects: 5, c2_defects: 10, c3_defects: 15, fi_defects: 2 });
    expect(r.c1_defects).toBe(5);
    expect(r.c2_defects).toBe(10);
    expect(r.c3_defects).toBe(15);
    expect(r.fi_defects).toBe(2);
  });

  it("allows setting boolean fields", () => {
    const r = makeRecord({ remedial_completed: true });
    expect(r.remedial_completed).toBe(true);
  });
});
