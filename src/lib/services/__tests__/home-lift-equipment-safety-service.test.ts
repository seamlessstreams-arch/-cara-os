// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LIFT EQUIPMENT SAFETY SERVICE TESTS
// Pure-function tests for lift equipment safety metrics, alert identification,
// Cara insights, constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  EQUIPMENT_TYPES,
  INSPECTION_TYPES,
  RESULT_VALUES,
  COMPLIANCE_STATUSES,
  EQUIPMENT_TYPE_LABELS,
  INSPECTION_TYPE_LABELS,
  RESULT_LABELS,
  COMPLIANCE_STATUS_LABELS,
  _testing,
} from "../home-lift-equipment-safety-service";

import type {
  HomeLiftEquipmentSafetyRow,
  EquipmentType,
  InspectionType,
  ResultValue,
  ComplianceStatus,
} from "../home-lift-equipment-safety-service";

const {
  computeLiftEquipmentSafetyMetrics,
  identifyLiftEquipmentSafetyAlerts,
  generateLiftEquipmentSafetyCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<HomeLiftEquipmentSafetyRow>,
): HomeLiftEquipmentSafetyRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    inspection_date: "inspection_date" in (overrides ?? {}) ? overrides!.inspection_date! : "2026-05-01",
    inspector_name: "inspector_name" in (overrides ?? {}) ? overrides!.inspector_name! : "John Smith",
    equipment_type: "equipment_type" in (overrides ?? {}) ? overrides!.equipment_type! : "Passenger Lift",
    equipment_location: "equipment_location" in (overrides ?? {}) ? overrides!.equipment_location! : "Ground Floor",
    inspection_type: "inspection_type" in (overrides ?? {}) ? overrides!.inspection_type! : "LOLER Thorough Examination",
    result: "result" in (overrides ?? {}) ? overrides!.result! : "Satisfactory",
    defects_found: "defects_found" in (overrides ?? {}) ? overrides!.defects_found! : 0,
    remedial_completed: "remedial_completed" in (overrides ?? {}) ? overrides!.remedial_completed! : false,
    certificate_issued: "certificate_issued" in (overrides ?? {}) ? overrides!.certificate_issued! : true,
    safe_working_load_confirmed: "safe_working_load_confirmed" in (overrides ?? {}) ? overrides!.safe_working_load_confirmed! : true,
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
  describe("EQUIPMENT_TYPES", () => {
    it("has exactly 6 items", () => {
      expect(EQUIPMENT_TYPES).toHaveLength(6);
    });

    it("contains Passenger Lift", () => {
      expect(EQUIPMENT_TYPES).toContain("Passenger Lift");
    });

    it("contains Stairlift", () => {
      expect(EQUIPMENT_TYPES).toContain("Stairlift");
    });

    it("contains Platform Lift", () => {
      expect(EQUIPMENT_TYPES).toContain("Platform Lift");
    });

    it("contains Hoist", () => {
      expect(EQUIPMENT_TYPES).toContain("Hoist");
    });

    it("contains Bath Hoist", () => {
      expect(EQUIPMENT_TYPES).toContain("Bath Hoist");
    });

    it("contains Ceiling Track Hoist", () => {
      expect(EQUIPMENT_TYPES).toContain("Ceiling Track Hoist");
    });

    it("has unique values", () => {
      expect(new Set(EQUIPMENT_TYPES).size).toBe(EQUIPMENT_TYPES.length);
    });

    it("every entry is a non-empty string", () => {
      for (const t of EQUIPMENT_TYPES) {
        expect(t.length).toBeGreaterThan(0);
      }
    });
  });

  describe("INSPECTION_TYPES", () => {
    it("has exactly 5 items", () => {
      expect(INSPECTION_TYPES).toHaveLength(5);
    });

    it("contains LOLER Thorough Examination", () => {
      expect(INSPECTION_TYPES).toContain("LOLER Thorough Examination");
    });

    it("contains 6-Monthly Service", () => {
      expect(INSPECTION_TYPES).toContain("6-Monthly Service");
    });

    it("contains Annual Service", () => {
      expect(INSPECTION_TYPES).toContain("Annual Service");
    });

    it("contains Maintenance Call", () => {
      expect(INSPECTION_TYPES).toContain("Maintenance Call");
    });

    it("contains Emergency Repair", () => {
      expect(INSPECTION_TYPES).toContain("Emergency Repair");
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
    it("has exactly 5 items", () => {
      expect(RESULT_VALUES).toHaveLength(5);
    });

    it("contains Satisfactory", () => {
      expect(RESULT_VALUES).toContain("Satisfactory");
    });

    it("contains Minor Defects", () => {
      expect(RESULT_VALUES).toContain("Minor Defects");
    });

    it("contains Major Defects", () => {
      expect(RESULT_VALUES).toContain("Major Defects");
    });

    it("contains Prohibited Use", () => {
      expect(RESULT_VALUES).toContain("Prohibited Use");
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

    it("contains Non-Compliant", () => {
      expect(COMPLIANCE_STATUSES).toContain("Non-Compliant");
    });

    it("contains Conditional", () => {
      expect(COMPLIANCE_STATUSES).toContain("Conditional");
    });

    it("contains Prohibited", () => {
      expect(COMPLIANCE_STATUSES).toContain("Prohibited");
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

  describe("EQUIPMENT_TYPE_LABELS", () => {
    it("has exactly 6 items", () => {
      expect(EQUIPMENT_TYPE_LABELS).toHaveLength(6);
    });

    it("has unique type values", () => {
      const types = EQUIPMENT_TYPE_LABELS.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = EQUIPMENT_TYPE_LABELS.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of EQUIPMENT_TYPE_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches EQUIPMENT_TYPES values", () => {
      const labelTypes = EQUIPMENT_TYPE_LABELS.map((t) => t.type);
      for (const t of EQUIPMENT_TYPES) {
        expect(labelTypes).toContain(t);
      }
    });
  });

  describe("INSPECTION_TYPE_LABELS", () => {
    it("has exactly 5 items", () => {
      expect(INSPECTION_TYPE_LABELS).toHaveLength(5);
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
    it("has exactly 5 items", () => {
      expect(RESULT_LABELS).toHaveLength(5);
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
// computeLiftEquipmentSafetyMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeLiftEquipmentSafetyMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_inspections", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.total_inspections).toBe(0);
    });

    it("returns zero prohibited_count", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.prohibited_count).toBe(0);
    });

    it("returns zero major_defects_count", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.major_defects_count).toBe(0);
    });

    it("returns zero minor_defects_count", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.minor_defects_count).toBe(0);
    });

    it("returns zero remedial_completion_rate", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns zero certificate_rate", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.certificate_rate).toBe(0);
    });

    it("returns zero swl_confirmed_rate", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.swl_confirmed_rate).toBe(0);
    });

    it("returns zero next_inspection_rate", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.next_inspection_rate).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero defects_total", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.defects_total).toBe(0);
    });

    it("returns zero unique_inspectors", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.unique_inspectors).toBe(0);
    });

    it("returns empty by_equipment_type", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.by_equipment_type).toEqual({});
    });

    it("returns empty by_inspection_type", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.by_inspection_type).toEqual({});
    });

    it("returns empty by_result", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.by_result).toEqual({});
    });

    it("returns empty by_compliance_status", () => {
      const m = computeLiftEquipmentSafetyMetrics([]);
      expect(m.by_compliance_status).toEqual({});
    });
  });

  describe("single satisfactory record", () => {
    const record = makeRecord({
      equipment_type: "Passenger Lift",
      inspection_type: "LOLER Thorough Examination",
      result: "Satisfactory",
      defects_found: 0,
      remedial_completed: false,
      certificate_issued: true,
      safe_working_load_confirmed: true,
      next_inspection_date: "2027-05-01",
      compliance_status: "Compliant",
      inspector_name: "John Smith",
    });

    it("returns total_inspections = 1", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.total_inspections).toBe(1);
    });

    it("returns prohibited_count = 0", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.prohibited_count).toBe(0);
    });

    it("returns major_defects_count = 0", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.major_defects_count).toBe(0);
    });

    it("returns minor_defects_count = 0", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.minor_defects_count).toBe(0);
    });

    it("returns certificate_rate = 100", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.certificate_rate).toBe(100);
    });

    it("returns remedial_completion_rate = 0 (no defects so no applicable records)", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns swl_confirmed_rate = 100", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.swl_confirmed_rate).toBe(100);
    });

    it("returns next_inspection_rate = 100", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.next_inspection_rate).toBe(100);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns defects_total = 0", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.defects_total).toBe(0);
    });

    it("returns unique_inspectors = 1", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.unique_inspectors).toBe(1);
    });

    it("returns by_equipment_type with single entry", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.by_equipment_type).toEqual({ "Passenger Lift": 1 });
    });

    it("returns by_inspection_type with single entry", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.by_inspection_type).toEqual({ "LOLER Thorough Examination": 1 });
    });

    it("returns by_result with single entry", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.by_result).toEqual({ Satisfactory: 1 });
    });

    it("returns by_compliance_status with single entry", () => {
      const m = computeLiftEquipmentSafetyMetrics([record]);
      expect(m.by_compliance_status).toEqual({ Compliant: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ equipment_type: "Passenger Lift", inspection_type: "LOLER Thorough Examination", result: "Satisfactory", defects_found: 0, certificate_issued: true, safe_working_load_confirmed: true, compliance_status: "Compliant", next_inspection_date: "2027-05-01", inspector_name: "Inspector A" }),
      makeRecord({ equipment_type: "Stairlift", inspection_type: "6-Monthly Service", result: "Major Defects", defects_found: 3, remedial_completed: false, certificate_issued: false, safe_working_load_confirmed: true, compliance_status: "Non-Compliant", next_inspection_date: null, inspector_name: "Inspector B" }),
      makeRecord({ equipment_type: "Hoist", inspection_type: "Annual Service", result: "Prohibited Use", defects_found: 2, remedial_completed: true, certificate_issued: true, safe_working_load_confirmed: false, compliance_status: "Prohibited", next_inspection_date: "2027-01-01", inspector_name: "Inspector A" }),
      makeRecord({ equipment_type: "Bath Hoist", inspection_type: "Maintenance Call", result: "Minor Defects", defects_found: 1, remedial_completed: true, certificate_issued: true, safe_working_load_confirmed: true, compliance_status: "Compliant", next_inspection_date: "2027-06-01", inspector_name: "Inspector C" }),
      makeRecord({ equipment_type: "Ceiling Track Hoist", inspection_type: "Emergency Repair", result: "Not Tested", defects_found: 0, certificate_issued: false, safe_working_load_confirmed: true, compliance_status: "Conditional", next_inspection_date: null, inspector_name: "Inspector B" }),
    ];

    it("returns total_inspections = 5", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.total_inspections).toBe(5);
    });

    it("returns prohibited_count = 1", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.prohibited_count).toBe(1);
    });

    it("returns major_defects_count = 1", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.major_defects_count).toBe(1);
    });

    it("returns minor_defects_count = 1", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.minor_defects_count).toBe(1);
    });

    it("calculates certificate_rate (3/5 = 60%)", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.certificate_rate).toBe(60);
    });

    it("calculates remedial_completion_rate (2/3 = 66.7%)", () => {
      // defects_found > 0: records 1,2,3 = 3 applicable; completed: records 2,3 = 2
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(66.7);
    });

    it("calculates swl_confirmed_rate (4/5 = 80%)", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.swl_confirmed_rate).toBe(80);
    });

    it("calculates next_inspection_rate (3/5 = 60%)", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.next_inspection_rate).toBe(60);
    });

    it("returns non_compliant_count = 2 (Non-Compliant + Prohibited)", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });

    it("returns defects_total = 6", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.defects_total).toBe(6);
    });

    it("returns unique_inspectors = 3", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.unique_inspectors).toBe(3);
    });

    it("groups by_equipment_type correctly", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.by_equipment_type).toEqual({
        "Passenger Lift": 1,
        "Stairlift": 1,
        "Hoist": 1,
        "Bath Hoist": 1,
        "Ceiling Track Hoist": 1,
      });
    });

    it("groups by_inspection_type correctly", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.by_inspection_type).toEqual({
        "LOLER Thorough Examination": 1,
        "6-Monthly Service": 1,
        "Annual Service": 1,
        "Maintenance Call": 1,
        "Emergency Repair": 1,
      });
    });

    it("groups by_result correctly", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.by_result).toEqual({
        Satisfactory: 1,
        "Major Defects": 1,
        "Prohibited Use": 1,
        "Minor Defects": 1,
        "Not Tested": 1,
      });
    });

    it("groups by_compliance_status correctly", () => {
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.by_compliance_status).toEqual({
        Compliant: 2,
        "Non-Compliant": 1,
        Prohibited: 1,
        Conditional: 1,
      });
    });
  });

  describe("prohibited_count", () => {
    it("counts only Prohibited Use results", () => {
      const records = [
        makeRecord({ result: "Prohibited Use" }),
        makeRecord({ result: "Prohibited Use" }),
        makeRecord({ result: "Satisfactory" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.prohibited_count).toBe(2);
    });

    it("does not count Major Defects as Prohibited Use", () => {
      const records = [makeRecord({ result: "Major Defects" })];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.prohibited_count).toBe(0);
    });

    it("does not count Minor Defects as Prohibited Use", () => {
      const records = [makeRecord({ result: "Minor Defects" })];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.prohibited_count).toBe(0);
    });

    it("does not count Not Tested as Prohibited Use", () => {
      const records = [makeRecord({ result: "Not Tested" })];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.prohibited_count).toBe(0);
    });

    it("does not count Satisfactory as Prohibited Use", () => {
      const records = [makeRecord({ result: "Satisfactory" })];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.prohibited_count).toBe(0);
    });
  });

  describe("major_defects_count", () => {
    it("counts only Major Defects results", () => {
      const records = [
        makeRecord({ result: "Major Defects" }),
        makeRecord({ result: "Major Defects" }),
        makeRecord({ result: "Satisfactory" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.major_defects_count).toBe(2);
    });

    it("does not count Prohibited Use as Major Defects", () => {
      const records = [makeRecord({ result: "Prohibited Use" })];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.major_defects_count).toBe(0);
    });
  });

  describe("minor_defects_count", () => {
    it("counts only Minor Defects results", () => {
      const records = [
        makeRecord({ result: "Minor Defects" }),
        makeRecord({ result: "Minor Defects" }),
        makeRecord({ result: "Satisfactory" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.minor_defects_count).toBe(2);
    });

    it("does not count Major Defects as Minor Defects", () => {
      const records = [makeRecord({ result: "Major Defects" })];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.minor_defects_count).toBe(0);
    });
  });

  describe("certificate_rate", () => {
    it("returns 100 when all certificates issued", () => {
      const records = [
        makeRecord({ certificate_issued: true }),
        makeRecord({ certificate_issued: true }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.certificate_rate).toBe(100);
    });

    it("returns 0 when no certificates issued", () => {
      const records = [
        makeRecord({ certificate_issued: false }),
        makeRecord({ certificate_issued: false }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.certificate_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ certificate_issued: true }),
        makeRecord({ certificate_issued: false }),
        makeRecord({ certificate_issued: false }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.certificate_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ certificate_issued: true }),
        makeRecord({ certificate_issued: true }),
        makeRecord({ certificate_issued: false }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.certificate_rate).toBe(66.7);
    });
  });

  describe("remedial_completion_rate", () => {
    it("only considers records where defects_found > 0", () => {
      const records = [
        makeRecord({ defects_found: 0, remedial_completed: false }),
        makeRecord({ defects_found: 2, remedial_completed: true }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(100);
    });

    it("returns 0 when no records have defects", () => {
      const records = [
        makeRecord({ defects_found: 0, remedial_completed: false }),
        makeRecord({ defects_found: 0, remedial_completed: false }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns 0 when all defective records are unremediated", () => {
      const records = [
        makeRecord({ defects_found: 3, remedial_completed: false }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(0);
    });

    it("returns 100 when all defective records are remediated", () => {
      const records = [
        makeRecord({ defects_found: 5, remedial_completed: true }),
        makeRecord({ defects_found: 2, remedial_completed: true }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(100);
    });

    it("calculates rate with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ defects_found: 1, remedial_completed: true }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ defects_found: 1, remedial_completed: true }),
        makeRecord({ defects_found: 1, remedial_completed: true }),
        makeRecord({ defects_found: 1, remedial_completed: false }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(66.7);
    });

    it("calculates rate (1/6 = 16.7%)", () => {
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRecord({ defects_found: 1, remedial_completed: i === 0 }),
      );
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.remedial_completion_rate).toBe(16.7);
    });
  });

  describe("swl_confirmed_rate", () => {
    it("returns 100 when all SWL confirmed", () => {
      const records = [
        makeRecord({ safe_working_load_confirmed: true }),
        makeRecord({ safe_working_load_confirmed: true }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.swl_confirmed_rate).toBe(100);
    });

    it("returns 0 when no SWL confirmed", () => {
      const records = [
        makeRecord({ safe_working_load_confirmed: false }),
        makeRecord({ safe_working_load_confirmed: false }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.swl_confirmed_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ safe_working_load_confirmed: true }),
        makeRecord({ safe_working_load_confirmed: false }),
        makeRecord({ safe_working_load_confirmed: false }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.swl_confirmed_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ safe_working_load_confirmed: true }),
        makeRecord({ safe_working_load_confirmed: true }),
        makeRecord({ safe_working_load_confirmed: false }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.swl_confirmed_rate).toBe(66.7);
    });
  });

  describe("next_inspection_rate", () => {
    it("returns 100 when all have next_inspection_date", () => {
      const records = [
        makeRecord({ next_inspection_date: "2027-01-01" }),
        makeRecord({ next_inspection_date: "2028-01-01" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.next_inspection_rate).toBe(100);
    });

    it("returns 0 when none have next_inspection_date", () => {
      const records = [
        makeRecord({ next_inspection_date: null }),
        makeRecord({ next_inspection_date: null }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.next_inspection_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ next_inspection_date: "2027-01-01" }),
        makeRecord({ next_inspection_date: null }),
        makeRecord({ next_inspection_date: null }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.next_inspection_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ next_inspection_date: "2027-01-01" }),
        makeRecord({ next_inspection_date: "2028-01-01" }),
        makeRecord({ next_inspection_date: null }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.next_inspection_rate).toBe(66.7);
    });
  });

  describe("non_compliant_count", () => {
    it("counts Non-Compliant", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant" })];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts Prohibited", () => {
      const records = [makeRecord({ compliance_status: "Prohibited" })];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts both Non-Compliant and Prohibited together", () => {
      const records = [
        makeRecord({ compliance_status: "Non-Compliant" }),
        makeRecord({ compliance_status: "Prohibited" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });

    it("does not count Compliant", () => {
      const records = [makeRecord({ compliance_status: "Compliant" })];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Conditional", () => {
      const records = [makeRecord({ compliance_status: "Conditional" })];
      const m = computeLiftEquipmentSafetyMetrics(records);
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
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.defects_total).toBe(5);
    });

    it("returns zero when all records have zero defects", () => {
      const records = [
        makeRecord({ defects_found: 0 }),
        makeRecord({ defects_found: 0 }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.defects_total).toBe(0);
    });

    it("handles a single record with many defects", () => {
      const records = [makeRecord({ defects_found: 15 })];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.defects_total).toBe(15);
    });
  });

  describe("unique_inspectors", () => {
    it("counts distinct inspector names", () => {
      const records = [
        makeRecord({ inspector_name: "Inspector A" }),
        makeRecord({ inspector_name: "Inspector B" }),
        makeRecord({ inspector_name: "Inspector A" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.unique_inspectors).toBe(2);
    });

    it("returns 1 when all same inspector", () => {
      const records = [
        makeRecord({ inspector_name: "John Smith" }),
        makeRecord({ inspector_name: "John Smith" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.unique_inspectors).toBe(1);
    });

    it("treats different names as different inspectors", () => {
      const records = [
        makeRecord({ inspector_name: "Inspector A" }),
        makeRecord({ inspector_name: "Inspector B" }),
        makeRecord({ inspector_name: "Inspector C" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.unique_inspectors).toBe(3);
    });
  });

  describe("by_equipment_type breakdown", () => {
    it("counts each equipment type separately", () => {
      const records = [
        makeRecord({ equipment_type: "Passenger Lift" }),
        makeRecord({ equipment_type: "Passenger Lift" }),
        makeRecord({ equipment_type: "Stairlift" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.by_equipment_type).toEqual({ "Passenger Lift": 2, "Stairlift": 1 });
    });

    it("handles all six equipment types", () => {
      const types: EquipmentType[] = ["Passenger Lift", "Stairlift", "Platform Lift", "Hoist", "Bath Hoist", "Ceiling Track Hoist"];
      const records = types.map((t) => makeRecord({ equipment_type: t }));
      const m = computeLiftEquipmentSafetyMetrics(records);
      for (const t of types) {
        expect(m.by_equipment_type[t]).toBe(1);
      }
    });
  });

  describe("by_inspection_type breakdown", () => {
    it("counts each inspection type separately", () => {
      const records = [
        makeRecord({ inspection_type: "LOLER Thorough Examination" }),
        makeRecord({ inspection_type: "LOLER Thorough Examination" }),
        makeRecord({ inspection_type: "6-Monthly Service" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.by_inspection_type).toEqual({ "LOLER Thorough Examination": 2, "6-Monthly Service": 1 });
    });

    it("handles all five inspection types", () => {
      const types: InspectionType[] = ["LOLER Thorough Examination", "6-Monthly Service", "Annual Service", "Maintenance Call", "Emergency Repair"];
      const records = types.map((t) => makeRecord({ inspection_type: t }));
      const m = computeLiftEquipmentSafetyMetrics(records);
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
        makeRecord({ result: "Major Defects" }),
      ];
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.by_result).toEqual({ Satisfactory: 2, "Major Defects": 1 });
    });

    it("handles all five result values", () => {
      const results: ResultValue[] = ["Satisfactory", "Minor Defects", "Major Defects", "Prohibited Use", "Not Tested"];
      const records = results.map((r) => makeRecord({ result: r }));
      const m = computeLiftEquipmentSafetyMetrics(records);
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
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.by_compliance_status).toEqual({ Compliant: 2, "Non-Compliant": 1 });
    });

    it("handles all four compliance statuses", () => {
      const statuses: ComplianceStatus[] = ["Compliant", "Non-Compliant", "Conditional", "Prohibited"];
      const records = statuses.map((s) => makeRecord({ compliance_status: s }));
      const m = computeLiftEquipmentSafetyMetrics(records);
      for (const s of statuses) {
        expect(m.by_compliance_status[s]).toBe(1);
      }
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: HomeLiftEquipmentSafetyRow[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            equipment_type: i % 2 === 0 ? "Passenger Lift" : "Stairlift",
            inspection_type: i % 3 === 0 ? "LOLER Thorough Examination" : "6-Monthly Service",
            result: i % 4 === 0 ? "Satisfactory" : "Minor Defects",
            defects_found: i % 3 === 0 ? 0 : 1,
            remedial_completed: i % 2 === 0,
            certificate_issued: i % 5 !== 0,
            safe_working_load_confirmed: i % 10 !== 0,
            compliance_status: "Compliant",
            inspector_name: `Inspector ${i % 5}`,
          }),
        );
      }
      const m = computeLiftEquipmentSafetyMetrics(records);
      expect(m.total_inspections).toBe(100);
      expect(m.unique_inspectors).toBe(5);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyLiftEquipmentSafetyAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyLiftEquipmentSafetyAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyLiftEquipmentSafetyAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          result: "Satisfactory",
          compliance_status: "Compliant",
          safe_working_load_confirmed: true,
        }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  // ── prohibited_use alert ──────────────────────────────────────────────

  describe("prohibited_use alert", () => {
    it("fires when result is Prohibited Use", () => {
      const records = [makeRecord({ result: "Prohibited Use" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ result: "Prohibited Use" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-id-1", result: "Prohibited Use" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use")!;
      expect(alert.record_id).toBe("rec-id-1");
    });

    it("includes equipment_type in message", () => {
      const records = [makeRecord({ result: "Prohibited Use", equipment_type: "Stairlift" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use")!;
      expect(alert.message).toContain("Stairlift");
    });

    it("includes equipment_location in message", () => {
      const records = [makeRecord({ result: "Prohibited Use", equipment_location: "First Floor" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use")!;
      expect(alert.message).toContain("First Floor");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ result: "Prohibited Use", inspection_date: "2026-03-15" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("includes LOLER reference in message", () => {
      const records = [makeRecord({ result: "Prohibited Use" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use")!;
      expect(alert.message).toContain("LOLER");
    });

    it("does not fire when result is Satisfactory", () => {
      const records = [makeRecord({ result: "Satisfactory" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Major Defects", () => {
      const records = [makeRecord({ result: "Major Defects" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Minor Defects", () => {
      const records = [makeRecord({ result: "Minor Defects" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Not Tested", () => {
      const records = [makeRecord({ result: "Not Tested" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_use");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Prohibited Use records", () => {
      const records = [
        makeRecord({ result: "Prohibited Use" }),
        makeRecord({ result: "Prohibited Use" }),
        makeRecord({ result: "Satisfactory" }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const puAlerts = alerts.filter((a) => a.type === "prohibited_use");
      expect(puAlerts).toHaveLength(2);
    });
  });

  // ── major_defects_unremediated alert ──────────────────────────────────

  describe("major_defects_unremediated alert", () => {
    it("fires when result is Major Defects and remedial_completed is false", () => {
      const records = [makeRecord({ result: "Major Defects", remedial_completed: false })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ result: "Major Defects", remedial_completed: false })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-md-1", result: "Major Defects", remedial_completed: false })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated")!;
      expect(alert.record_id).toBe("rec-md-1");
    });

    it("includes equipment_type in message", () => {
      const records = [makeRecord({ result: "Major Defects", remedial_completed: false, equipment_type: "Platform Lift" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated")!;
      expect(alert.message).toContain("Platform Lift");
    });

    it("includes equipment_location in message", () => {
      const records = [makeRecord({ result: "Major Defects", remedial_completed: false, equipment_location: "Entrance Hall" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated")!;
      expect(alert.message).toContain("Entrance Hall");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ result: "Major Defects", remedial_completed: false, inspection_date: "2026-04-20" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("does not fire when result is Major Defects but remedial_completed is true", () => {
      const records = [makeRecord({ result: "Major Defects", remedial_completed: true })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Satisfactory", () => {
      const records = [makeRecord({ result: "Satisfactory", remedial_completed: false })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Minor Defects", () => {
      const records = [makeRecord({ result: "Minor Defects", remedial_completed: false })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Prohibited Use", () => {
      const records = [makeRecord({ result: "Prohibited Use", remedial_completed: false })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated");
      expect(alert).toBeUndefined();
    });

    it("does not fire when result is Not Tested", () => {
      const records = [makeRecord({ result: "Not Tested", remedial_completed: false })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects_unremediated");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Major Defects unremediated records", () => {
      const records = [
        makeRecord({ result: "Major Defects", remedial_completed: false }),
        makeRecord({ result: "Major Defects", remedial_completed: false }),
        makeRecord({ result: "Major Defects", remedial_completed: true }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const mdAlerts = alerts.filter((a) => a.type === "major_defects_unremediated");
      expect(mdAlerts).toHaveLength(2);
    });
  });

  // ── non_compliant alert ───────────────────────────────────────────────

  describe("non_compliant alert", () => {
    it("fires when compliance_status is Non-Compliant", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-nc-1", compliance_status: "Non-Compliant" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.record_id).toBe("rec-nc-1");
    });

    it("includes equipment_type in message", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant", equipment_type: "Hoist" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("Hoist");
    });

    it("includes equipment_location in message", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant", equipment_location: "Bathroom" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("Bathroom");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant", inspection_date: "2026-01-15" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("2026-01-15");
    });

    it("includes LOLER Regulations reference in message", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("Lifting Operations and Lifting Equipment Regulations");
    });

    it("does not fire for Compliant status", () => {
      const records = [makeRecord({ compliance_status: "Compliant" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Conditional status", () => {
      const records = [makeRecord({ compliance_status: "Conditional" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Prohibited status (handled separately)", () => {
      const records = [makeRecord({ compliance_status: "Prohibited" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Non-Compliant records", () => {
      const records = [
        makeRecord({ compliance_status: "Non-Compliant" }),
        makeRecord({ compliance_status: "Non-Compliant" }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant");
      expect(ncAlerts).toHaveLength(2);
    });
  });

  // ── prohibited_compliance alert ───────────────────────────────────────

  describe("prohibited_compliance alert", () => {
    it("fires when compliance_status is Prohibited", () => {
      const records = [makeRecord({ compliance_status: "Prohibited" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_compliance");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ compliance_status: "Prohibited" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_compliance")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-proh-1", compliance_status: "Prohibited" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_compliance")!;
      expect(alert.record_id).toBe("rec-proh-1");
    });

    it("includes equipment_type in message", () => {
      const records = [makeRecord({ compliance_status: "Prohibited", equipment_type: "Bath Hoist" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_compliance")!;
      expect(alert.message).toContain("Bath Hoist");
    });

    it("includes equipment_location in message", () => {
      const records = [makeRecord({ compliance_status: "Prohibited", equipment_location: "Bedroom 3" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_compliance")!;
      expect(alert.message).toContain("Bedroom 3");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ compliance_status: "Prohibited", inspection_date: "2025-12-01" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_compliance")!;
      expect(alert.message).toContain("2025-12-01");
    });

    it("does not fire for Compliant status", () => {
      const records = [makeRecord({ compliance_status: "Compliant" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_compliance");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Conditional status", () => {
      const records = [makeRecord({ compliance_status: "Conditional" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_compliance");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Non-Compliant status (handled separately)", () => {
      const records = [makeRecord({ compliance_status: "Non-Compliant" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "prohibited_compliance");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Prohibited records", () => {
      const records = [
        makeRecord({ compliance_status: "Prohibited" }),
        makeRecord({ compliance_status: "Prohibited" }),
        makeRecord({ compliance_status: "Prohibited" }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const prohAlerts = alerts.filter((a) => a.type === "prohibited_compliance");
      expect(prohAlerts).toHaveLength(3);
    });
  });

  // ── swl_not_confirmed alert ───────────────────────────────────────────

  describe("swl_not_confirmed alert", () => {
    it("fires when safe_working_load_confirmed is false", () => {
      const records = [makeRecord({ safe_working_load_confirmed: false })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "swl_not_confirmed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ safe_working_load_confirmed: false })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "swl_not_confirmed")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRecord({ id: "rec-swl-1", safe_working_load_confirmed: false })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "swl_not_confirmed")!;
      expect(alert.record_id).toBe("rec-swl-1");
    });

    it("includes equipment_type in message", () => {
      const records = [makeRecord({ safe_working_load_confirmed: false, equipment_type: "Ceiling Track Hoist" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "swl_not_confirmed")!;
      expect(alert.message).toContain("Ceiling Track Hoist");
    });

    it("includes equipment_location in message", () => {
      const records = [makeRecord({ safe_working_load_confirmed: false, equipment_location: "Bedroom 2" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "swl_not_confirmed")!;
      expect(alert.message).toContain("Bedroom 2");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRecord({ safe_working_load_confirmed: false, inspection_date: "2026-02-10" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "swl_not_confirmed")!;
      expect(alert.message).toContain("2026-02-10");
    });

    it("does not fire when safe_working_load_confirmed is true", () => {
      const records = [makeRecord({ safe_working_load_confirmed: true })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const alert = alerts.find((a) => a.type === "swl_not_confirmed");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple unconfirmed SWL records", () => {
      const records = [
        makeRecord({ safe_working_load_confirmed: false }),
        makeRecord({ safe_working_load_confirmed: false }),
        makeRecord({ safe_working_load_confirmed: true }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const swlAlerts = alerts.filter((a) => a.type === "swl_not_confirmed");
      expect(swlAlerts).toHaveLength(2);
    });
  });

  // ── combined alerts ──────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can fire all alert types simultaneously", () => {
      const records = [
        makeRecord({
          id: "r1",
          result: "Prohibited Use",
          compliance_status: "Non-Compliant",
          safe_working_load_confirmed: false,
        }),
        makeRecord({
          id: "r2",
          result: "Major Defects",
          remedial_completed: false,
          compliance_status: "Prohibited",
        }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("prohibited_use");
      expect(types).toContain("major_defects_unremediated");
      expect(types).toContain("non_compliant");
      expect(types).toContain("prohibited_compliance");
      expect(types).toContain("swl_not_confirmed");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({
          result: "Prohibited Use",
          compliance_status: "Non-Compliant",
          safe_working_load_confirmed: false,
        }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      // prohibited_use=1, non_compliant=1, swl_not_confirmed=1
      expect(alerts).toHaveLength(3);
    });

    it("per-record alerts multiply with multiple records", () => {
      const records = [
        makeRecord({ result: "Prohibited Use" }),
        makeRecord({ result: "Prohibited Use" }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      expect(alerts.filter((a) => a.type === "prohibited_use")).toHaveLength(2);
    });
  });

  // ── alert structure ──────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const records = [
        makeRecord({ result: "Prohibited Use", safe_working_load_confirmed: false }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({
          result: "Prohibited Use",
          compliance_status: "Non-Compliant",
          safe_working_load_confirmed: false,
        }),
      ];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ result: "Prohibited Use" })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  // ── edge cases ───────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("Satisfactory result with no issues triggers no alerts", () => {
      const records = [makeRecord({ result: "Satisfactory", compliance_status: "Compliant", safe_working_load_confirmed: true })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("high defects_found alone do not trigger any alert when result is Satisfactory", () => {
      const records = [makeRecord({ defects_found: 50, result: "Satisfactory", compliance_status: "Compliant", safe_working_load_confirmed: true })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Major Defects with remedial_completed does not fire major_defects_unremediated", () => {
      const records = [makeRecord({ result: "Major Defects", remedial_completed: true, compliance_status: "Compliant", safe_working_load_confirmed: true })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Conditional compliance does not trigger non_compliant or prohibited_compliance", () => {
      const records = [makeRecord({ compliance_status: "Conditional", result: "Satisfactory", safe_working_load_confirmed: true })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Not Tested result does not trigger prohibited_use or major_defects_unremediated", () => {
      const records = [makeRecord({ result: "Not Tested", remedial_completed: false, compliance_status: "Compliant", safe_working_load_confirmed: true })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Minor Defects unremediated does not fire major_defects_unremediated", () => {
      const records = [makeRecord({ result: "Minor Defects", remedial_completed: false, compliance_status: "Compliant", safe_working_load_confirmed: true })];
      const alerts = identifyLiftEquipmentSafetyAlerts(records);
      expect(alerts).toHaveLength(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateLiftEquipmentSafetyCaraInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("generateLiftEquipmentSafetyCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const records = [makeRecord()];
    const insights = generateLiftEquipmentSafetyCaraInsights(records);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty array", () => {
    const insights = generateLiftEquipmentSafetyCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [red]", () => {
    const records = [makeRecord()];
    const insights = generateLiftEquipmentSafetyCaraInsights(records);
    expect(insights[0]).toMatch(/^\[red\]/);
  });

  it("second insight starts with [amber]", () => {
    const records = [makeRecord()];
    const insights = generateLiftEquipmentSafetyCaraInsights(records);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("third insight starts with [reflect]", () => {
    const records = [makeRecord()];
    const insights = generateLiftEquipmentSafetyCaraInsights(records);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("all insights are non-empty strings", () => {
    const records = [makeRecord()];
    const insights = generateLiftEquipmentSafetyCaraInsights(records);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  describe("first insight (red) — summary stats", () => {
    it("includes total inspection count", () => {
      const records = [makeRecord(), makeRecord(), makeRecord()];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[0]).toContain("3 lift equipment safety inspections");
    });

    it("includes unique inspector count", () => {
      const records = [
        makeRecord({ inspector_name: "Inspector A" }),
        makeRecord({ inspector_name: "Inspector B" }),
      ];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[0]).toContain("2 inspectors");
    });

    it("uses singular inspector for count of 1", () => {
      const records = [makeRecord({ inspector_name: "Single Inspector" })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[0]).toContain("1 inspector");
    });

    it("includes Prohibited Use count", () => {
      const records = [makeRecord({ result: "Prohibited Use" })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[0]).toContain("1 Prohibited Use");
    });

    it("includes Major Defects count", () => {
      const records = [makeRecord({ result: "Major Defects" }), makeRecord({ result: "Major Defects" })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[0]).toContain("2 Major Defects");
    });

    it("includes Minor Defects count", () => {
      const records = [makeRecord({ result: "Minor Defects" })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[0]).toContain("1 Minor Defects");
    });

    it("includes defects total", () => {
      const records = [makeRecord({ defects_found: 5 }), makeRecord({ defects_found: 3 })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[0]).toContain("8 total defects");
    });
  });

  describe("second insight (amber) — priority concerns", () => {
    it("mentions critical and high alerts when present", () => {
      const records = [makeRecord({ result: "Prohibited Use", compliance_status: "Non-Compliant" })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high");
    });

    it("mentions remedial completion rate when alerts present", () => {
      const records = [makeRecord({ result: "Prohibited Use", defects_found: 2, remedial_completed: true })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[1]).toContain("100%");
    });

    it("mentions no critical alerts when all clean", () => {
      const records = [makeRecord({ result: "Satisfactory", compliance_status: "Compliant", safe_working_load_confirmed: true })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[1]).toContain("No critical or high-priority");
    });

    it("mentions LOLER 1998 compliance when no alerts", () => {
      const records = [makeRecord({ result: "Satisfactory", compliance_status: "Compliant", safe_working_load_confirmed: true })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[1]).toContain("LOLER 1998");
    });

    it("uses singular for 1 non-compliant inspection", () => {
      const records = [makeRecord({ result: "Prohibited Use", compliance_status: "Non-Compliant" })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[1]).toContain("inspection has");
    });

    it("uses plural for multiple non-compliant inspections", () => {
      const records = [
        makeRecord({ result: "Prohibited Use", compliance_status: "Non-Compliant" }),
        makeRecord({ result: "Prohibited Use", compliance_status: "Prohibited" }),
      ];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[1]).toContain("inspections have");
    });
  });

  describe("third insight (reflect) — reflective question", () => {
    it("mentions Prohibited Use and Major Defects counts when present", () => {
      const records = [makeRecord({ result: "Prohibited Use" }), makeRecord({ result: "Major Defects" })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[2]).toContain("1 Prohibited Use");
      expect(insights[2]).toContain("1 Major Defects");
    });

    it("asks about remedial tracking when no dangerous results but incomplete remedial", () => {
      const records = [makeRecord({ result: "Satisfactory", defects_found: 2, remedial_completed: false })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[2]).toContain("remedial");
    });

    it("provides positive reflection when all clean", () => {
      const records = [makeRecord({ result: "Satisfactory", defects_found: 0 })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
      expect(insights[2]).toContain("no Prohibited Use or Major Defects");
    });

    it("asks about staff awareness in positive reflection", () => {
      const records = [makeRecord({ result: "Satisfactory", defects_found: 0 })];
      const insights = generateLiftEquipmentSafetyCaraInsights(records);
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
    expect(r.equipment_type).toBe("Passenger Lift");
    expect(r.equipment_location).toBe("Ground Floor");
    expect(r.inspection_type).toBe("LOLER Thorough Examination");
    expect(r.result).toBe("Satisfactory");
    expect(r.defects_found).toBe(0);
    expect(r.remedial_completed).toBe(false);
    expect(r.certificate_issued).toBe(true);
    expect(r.safe_working_load_confirmed).toBe(true);
    expect(r.next_inspection_date).toBeNull();
    expect(r.compliance_status).toBe("Compliant");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ equipment_type: "Stairlift", result: "Major Defects" });
    expect(r.equipment_type).toBe("Stairlift");
    expect(r.result).toBe("Major Defects");
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
    const r = makeRecord({ next_inspection_date: null, notes: null });
    expect(r.next_inspection_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting defects_found", () => {
    const r = makeRecord({ defects_found: 7 });
    expect(r.defects_found).toBe(7);
  });

  it("allows setting boolean fields", () => {
    const r = makeRecord({ remedial_completed: true, certificate_issued: false, safe_working_load_confirmed: false });
    expect(r.remedial_completed).toBe(true);
    expect(r.certificate_issued).toBe(false);
    expect(r.safe_working_load_confirmed).toBe(false);
  });

  it("allows setting equipment_location", () => {
    const r = makeRecord({ equipment_location: "Second Floor Landing" });
    expect(r.equipment_location).toBe("Second Floor Landing");
  });

  it("allows setting next_inspection_date", () => {
    const r = makeRecord({ next_inspection_date: "2027-11-15" });
    expect(r.next_inspection_date).toBe("2027-11-15");
  });

  it("allows setting notes", () => {
    const r = makeRecord({ notes: "Test note" });
    expect(r.notes).toBe("Test note");
  });
});
