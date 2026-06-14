// ==============================================================================
// CARA -- HOME PEST CONTROL MANAGEMENT SERVICE TESTS
// Pure-function tests for pest control metrics, alert identification,
// Cara insights, constant validation, and edge cases.
// ==============================================================================

import { describe, it, expect } from "vitest";

import {
  PEST_TYPES,
  SEVERITY_LEVELS,
  TREATMENT_METHODS,
  COMPLIANCE_STATUSES,
  PEST_TYPE_LABELS,
  SEVERITY_LEVEL_LABELS,
  TREATMENT_METHOD_LABELS,
  COMPLIANCE_STATUS_LABELS,
  _testing,
} from "../home-pest-control-management-service";

import type {
  HomePestControlManagementRow,
  PestType,
  SeverityLevel,
  TreatmentMethod,
  ComplianceStatus,
} from "../home-pest-control-management-service";

const {
  computePestControlManagementMetrics,
  identifyPestControlManagementAlerts,
  generatePestControlManagementCaraInsights,
} = _testing;

// -- Helpers ------------------------------------------------------------------

function makeRow(
  overrides?: Partial<HomePestControlManagementRow>,
): HomePestControlManagementRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    inspection_date: "inspection_date" in (overrides ?? {}) ? overrides!.inspection_date! : "2026-05-01",
    inspector_name: "inspector_name" in (overrides ?? {}) ? overrides!.inspector_name! : "John Smith",
    pest_type: "pest_type" in (overrides ?? {}) ? overrides!.pest_type! : "Rodents",
    location: "location" in (overrides ?? {}) ? overrides!.location! : "Kitchen",
    severity: "severity" in (overrides ?? {}) ? overrides!.severity! : "None Found",
    treatment_required: "treatment_required" in (overrides ?? {}) ? overrides!.treatment_required! : false,
    treatment_method: "treatment_method" in (overrides ?? {}) ? (overrides!.treatment_method ?? null) : null,
    treatment_date: "treatment_date" in (overrides ?? {}) ? (overrides!.treatment_date ?? null) : null,
    treatment_completed: "treatment_completed" in (overrides ?? {}) ? overrides!.treatment_completed! : false,
    proofing_adequate: "proofing_adequate" in (overrides ?? {}) ? overrides!.proofing_adequate! : true,
    hygiene_satisfactory: "hygiene_satisfactory" in (overrides ?? {}) ? overrides!.hygiene_satisfactory! : true,
    food_storage_adequate: "food_storage_adequate" in (overrides ?? {}) ? overrides!.food_storage_adequate! : true,
    waste_management_ok: "waste_management_ok" in (overrides ?? {}) ? overrides!.waste_management_ok! : true,
    re_inspection_required: "re_inspection_required" in (overrides ?? {}) ? overrides!.re_inspection_required! : false,
    re_inspection_date: "re_inspection_date" in (overrides ?? {}) ? (overrides!.re_inspection_date ?? null) : null,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Clear",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

// ==============================================================================
// CONSTANTS
// ==============================================================================

describe("Constants", () => {
  describe("PEST_TYPES", () => {
    it("has exactly 11 items", () => {
      expect(PEST_TYPES).toHaveLength(11);
    });

    it("contains Rodents", () => {
      expect(PEST_TYPES).toContain("Rodents");
    });

    it("contains Cockroaches", () => {
      expect(PEST_TYPES).toContain("Cockroaches");
    });

    it("contains Bed Bugs", () => {
      expect(PEST_TYPES).toContain("Bed Bugs");
    });

    it("contains Ants", () => {
      expect(PEST_TYPES).toContain("Ants");
    });

    it("contains Flies", () => {
      expect(PEST_TYPES).toContain("Flies");
    });

    it("contains Wasps", () => {
      expect(PEST_TYPES).toContain("Wasps");
    });

    it("contains Moths", () => {
      expect(PEST_TYPES).toContain("Moths");
    });

    it("contains Birds", () => {
      expect(PEST_TYPES).toContain("Birds");
    });

    it("contains Fleas", () => {
      expect(PEST_TYPES).toContain("Fleas");
    });

    it("contains Stored Product Insects", () => {
      expect(PEST_TYPES).toContain("Stored Product Insects");
    });

    it("contains Other", () => {
      expect(PEST_TYPES).toContain("Other");
    });

    it("has unique values", () => {
      expect(new Set(PEST_TYPES).size).toBe(PEST_TYPES.length);
    });

    it("every entry is a non-empty string", () => {
      for (const t of PEST_TYPES) {
        expect(t.length).toBeGreaterThan(0);
      }
    });
  });

  describe("SEVERITY_LEVELS", () => {
    it("has exactly 5 items", () => {
      expect(SEVERITY_LEVELS).toHaveLength(5);
    });

    it("contains None Found", () => {
      expect(SEVERITY_LEVELS).toContain("None Found");
    });

    it("contains Low", () => {
      expect(SEVERITY_LEVELS).toContain("Low");
    });

    it("contains Moderate", () => {
      expect(SEVERITY_LEVELS).toContain("Moderate");
    });

    it("contains High", () => {
      expect(SEVERITY_LEVELS).toContain("High");
    });

    it("contains Infestation", () => {
      expect(SEVERITY_LEVELS).toContain("Infestation");
    });

    it("has unique values", () => {
      expect(new Set(SEVERITY_LEVELS).size).toBe(SEVERITY_LEVELS.length);
    });

    it("every entry is a non-empty string", () => {
      for (const v of SEVERITY_LEVELS) {
        expect(v.length).toBeGreaterThan(0);
      }
    });
  });

  describe("TREATMENT_METHODS", () => {
    it("has exactly 8 items", () => {
      expect(TREATMENT_METHODS).toHaveLength(8);
    });

    it("contains Baiting", () => {
      expect(TREATMENT_METHODS).toContain("Baiting");
    });

    it("contains Trapping", () => {
      expect(TREATMENT_METHODS).toContain("Trapping");
    });

    it("contains Spray Treatment", () => {
      expect(TREATMENT_METHODS).toContain("Spray Treatment");
    });

    it("contains Fumigation", () => {
      expect(TREATMENT_METHODS).toContain("Fumigation");
    });

    it("contains Heat Treatment", () => {
      expect(TREATMENT_METHODS).toContain("Heat Treatment");
    });

    it("contains Proofing", () => {
      expect(TREATMENT_METHODS).toContain("Proofing");
    });

    it("contains Environmental Control", () => {
      expect(TREATMENT_METHODS).toContain("Environmental Control");
    });

    it("contains Monitoring Only", () => {
      expect(TREATMENT_METHODS).toContain("Monitoring Only");
    });

    it("has unique values", () => {
      expect(new Set(TREATMENT_METHODS).size).toBe(TREATMENT_METHODS.length);
    });

    it("every entry is a non-empty string", () => {
      for (const v of TREATMENT_METHODS) {
        expect(v.length).toBeGreaterThan(0);
      }
    });
  });

  describe("COMPLIANCE_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(COMPLIANCE_STATUSES).toHaveLength(5);
    });

    it("contains Clear", () => {
      expect(COMPLIANCE_STATUSES).toContain("Clear");
    });

    it("contains Active Issue", () => {
      expect(COMPLIANCE_STATUSES).toContain("Active Issue");
    });

    it("contains Under Treatment", () => {
      expect(COMPLIANCE_STATUSES).toContain("Under Treatment");
    });

    it("contains Resolved", () => {
      expect(COMPLIANCE_STATUSES).toContain("Resolved");
    });

    it("contains Re-Inspection Due", () => {
      expect(COMPLIANCE_STATUSES).toContain("Re-Inspection Due");
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

  describe("PEST_TYPE_LABELS", () => {
    it("has exactly 11 items", () => {
      expect(PEST_TYPE_LABELS).toHaveLength(11);
    });

    it("has unique type values", () => {
      const types = PEST_TYPE_LABELS.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = PEST_TYPE_LABELS.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of PEST_TYPE_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches PEST_TYPES values", () => {
      const labelTypes = PEST_TYPE_LABELS.map((t) => t.type);
      for (const t of PEST_TYPES) {
        expect(labelTypes).toContain(t);
      }
    });
  });

  describe("SEVERITY_LEVEL_LABELS", () => {
    it("has exactly 5 items", () => {
      expect(SEVERITY_LEVEL_LABELS).toHaveLength(5);
    });

    it("has unique value fields", () => {
      const values = SEVERITY_LEVEL_LABELS.map((r) => r.value);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has unique labels", () => {
      const labels = SEVERITY_LEVEL_LABELS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of SEVERITY_LEVEL_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches SEVERITY_LEVELS values", () => {
      const labelValues = SEVERITY_LEVEL_LABELS.map((r) => r.value);
      for (const v of SEVERITY_LEVELS) {
        expect(labelValues).toContain(v);
      }
    });
  });

  describe("TREATMENT_METHOD_LABELS", () => {
    it("has exactly 8 items", () => {
      expect(TREATMENT_METHOD_LABELS).toHaveLength(8);
    });

    it("has unique value fields", () => {
      const values = TREATMENT_METHOD_LABELS.map((r) => r.value);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has unique labels", () => {
      const labels = TREATMENT_METHOD_LABELS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of TREATMENT_METHOD_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches TREATMENT_METHODS values", () => {
      const labelValues = TREATMENT_METHOD_LABELS.map((r) => r.value);
      for (const v of TREATMENT_METHODS) {
        expect(labelValues).toContain(v);
      }
    });
  });

  describe("COMPLIANCE_STATUS_LABELS", () => {
    it("has exactly 5 items", () => {
      expect(COMPLIANCE_STATUS_LABELS).toHaveLength(5);
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
// computePestControlManagementMetrics
// ==============================================================================

describe("computePestControlManagementMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_inspections", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.total_inspections).toBe(0);
    });

    it("returns zero active_issue_count", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.active_issue_count).toBe(0);
    });

    it("returns zero infestation_count", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.infestation_count).toBe(0);
    });

    it("returns zero treatment_required_count", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.treatment_required_count).toBe(0);
    });

    it("returns zero treatment_completion_rate", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.treatment_completion_rate).toBe(0);
    });

    it("returns zero proofing_rate", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.proofing_rate).toBe(0);
    });

    it("returns zero hygiene_rate", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.hygiene_rate).toBe(0);
    });

    it("returns zero food_storage_rate", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.food_storage_rate).toBe(0);
    });

    it("returns zero waste_management_rate", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.waste_management_rate).toBe(0);
    });

    it("returns zero re_inspection_due_count", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.re_inspection_due_count).toBe(0);
    });

    it("returns zero unique_locations", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.unique_locations).toBe(0);
    });

    it("returns zero unique_inspectors", () => {
      const m = computePestControlManagementMetrics([]);
      expect(m.unique_inspectors).toBe(0);
    });
  });

  describe("single clean record", () => {
    const record = makeRow({
      pest_type: "Rodents",
      location: "Kitchen",
      severity: "None Found",
      treatment_required: false,
      treatment_completed: false,
      proofing_adequate: true,
      hygiene_satisfactory: true,
      food_storage_adequate: true,
      waste_management_ok: true,
      re_inspection_required: false,
      compliance_status: "Clear",
      inspector_name: "John Smith",
    });

    it("returns total_inspections = 1", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.total_inspections).toBe(1);
    });

    it("returns active_issue_count = 0", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.active_issue_count).toBe(0);
    });

    it("returns infestation_count = 0", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.infestation_count).toBe(0);
    });

    it("returns treatment_required_count = 0", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.treatment_required_count).toBe(0);
    });

    it("returns treatment_completion_rate = 0 (no treatment required)", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.treatment_completion_rate).toBe(0);
    });

    it("returns proofing_rate = 100", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.proofing_rate).toBe(100);
    });

    it("returns hygiene_rate = 100", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.hygiene_rate).toBe(100);
    });

    it("returns food_storage_rate = 100", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.food_storage_rate).toBe(100);
    });

    it("returns waste_management_rate = 100", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.waste_management_rate).toBe(100);
    });

    it("returns re_inspection_due_count = 0", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.re_inspection_due_count).toBe(0);
    });

    it("returns unique_locations = 1", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.unique_locations).toBe(1);
    });

    it("returns unique_inspectors = 1", () => {
      const m = computePestControlManagementMetrics([record]);
      expect(m.unique_inspectors).toBe(1);
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRow({ pest_type: "Rodents", location: "Kitchen", severity: "Infestation", treatment_required: true, treatment_completed: true, proofing_adequate: true, hygiene_satisfactory: true, food_storage_adequate: true, waste_management_ok: true, re_inspection_required: true, compliance_status: "Active Issue", inspector_name: "Inspector A" }),
      makeRow({ pest_type: "Cockroaches", location: "Bathroom 1", severity: "High", treatment_required: true, treatment_completed: false, proofing_adequate: false, hygiene_satisfactory: false, food_storage_adequate: false, waste_management_ok: false, re_inspection_required: true, compliance_status: "Active Issue", inspector_name: "Inspector B" }),
      makeRow({ pest_type: "Ants", location: "Garden", severity: "Low", treatment_required: true, treatment_completed: true, proofing_adequate: true, hygiene_satisfactory: true, food_storage_adequate: true, waste_management_ok: true, re_inspection_required: false, compliance_status: "Resolved", inspector_name: "Inspector A" }),
      makeRow({ pest_type: "Flies", location: "Dining Room", severity: "None Found", treatment_required: false, treatment_completed: false, proofing_adequate: true, hygiene_satisfactory: true, food_storage_adequate: true, waste_management_ok: true, re_inspection_required: false, compliance_status: "Clear", inspector_name: "Inspector C" }),
      makeRow({ pest_type: "Bed Bugs", location: "Bedroom 1", severity: "Moderate", treatment_required: true, treatment_completed: false, proofing_adequate: false, hygiene_satisfactory: true, food_storage_adequate: true, waste_management_ok: false, re_inspection_required: true, compliance_status: "Under Treatment", inspector_name: "Inspector B" }),
    ];

    it("returns total_inspections = 5", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.total_inspections).toBe(5);
    });

    it("returns active_issue_count = 2", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.active_issue_count).toBe(2);
    });

    it("returns infestation_count = 1", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.infestation_count).toBe(1);
    });

    it("returns treatment_required_count = 4", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.treatment_required_count).toBe(4);
    });

    it("calculates treatment_completion_rate (2/4 = 50%)", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.treatment_completion_rate).toBe(50);
    });

    it("calculates proofing_rate (3/5 = 60%)", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.proofing_rate).toBe(60);
    });

    it("calculates hygiene_rate (4/5 = 80%)", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.hygiene_rate).toBe(80);
    });

    it("calculates food_storage_rate (4/5 = 80%)", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.food_storage_rate).toBe(80);
    });

    it("calculates waste_management_rate (3/5 = 60%)", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.waste_management_rate).toBe(60);
    });

    it("returns re_inspection_due_count = 3", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.re_inspection_due_count).toBe(3);
    });

    it("returns unique_locations = 5", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.unique_locations).toBe(5);
    });

    it("returns unique_inspectors = 3", () => {
      const m = computePestControlManagementMetrics(records);
      expect(m.unique_inspectors).toBe(3);
    });
  });

  describe("treatment_completion_rate", () => {
    it("returns 100 when all treatments completed", () => {
      const records = [
        makeRow({ treatment_required: true, treatment_completed: true }),
        makeRow({ treatment_required: true, treatment_completed: true }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.treatment_completion_rate).toBe(100);
    });

    it("returns 0 when no treatments completed", () => {
      const records = [
        makeRow({ treatment_required: true, treatment_completed: false }),
        makeRow({ treatment_required: true, treatment_completed: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.treatment_completion_rate).toBe(0);
    });

    it("returns 0 when no treatment required", () => {
      const records = [
        makeRow({ treatment_required: false, treatment_completed: false }),
        makeRow({ treatment_required: false, treatment_completed: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.treatment_completion_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ treatment_required: true, treatment_completed: true }),
        makeRow({ treatment_required: true, treatment_completed: false }),
        makeRow({ treatment_required: true, treatment_completed: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.treatment_completion_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ treatment_required: true, treatment_completed: true }),
        makeRow({ treatment_required: true, treatment_completed: true }),
        makeRow({ treatment_required: true, treatment_completed: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.treatment_completion_rate).toBe(66.7);
    });

    it("ignores rows where treatment not required", () => {
      const records = [
        makeRow({ treatment_required: true, treatment_completed: true }),
        makeRow({ treatment_required: false, treatment_completed: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.treatment_completion_rate).toBe(100);
    });
  });

  describe("proofing_rate", () => {
    it("returns 100 when all proofing adequate", () => {
      const records = [
        makeRow({ proofing_adequate: true }),
        makeRow({ proofing_adequate: true }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.proofing_rate).toBe(100);
    });

    it("returns 0 when no proofing adequate", () => {
      const records = [
        makeRow({ proofing_adequate: false }),
        makeRow({ proofing_adequate: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.proofing_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ proofing_adequate: true }),
        makeRow({ proofing_adequate: false }),
        makeRow({ proofing_adequate: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.proofing_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ proofing_adequate: true }),
        makeRow({ proofing_adequate: true }),
        makeRow({ proofing_adequate: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.proofing_rate).toBe(66.7);
    });
  });

  describe("hygiene_rate", () => {
    it("returns 100 when all hygiene satisfactory", () => {
      const records = [
        makeRow({ hygiene_satisfactory: true }),
        makeRow({ hygiene_satisfactory: true }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.hygiene_rate).toBe(100);
    });

    it("returns 0 when no hygiene satisfactory", () => {
      const records = [
        makeRow({ hygiene_satisfactory: false }),
        makeRow({ hygiene_satisfactory: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.hygiene_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ hygiene_satisfactory: true }),
        makeRow({ hygiene_satisfactory: false }),
        makeRow({ hygiene_satisfactory: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.hygiene_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ hygiene_satisfactory: true }),
        makeRow({ hygiene_satisfactory: true }),
        makeRow({ hygiene_satisfactory: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.hygiene_rate).toBe(66.7);
    });
  });

  describe("food_storage_rate", () => {
    it("returns 100 when all food storage adequate", () => {
      const records = [
        makeRow({ food_storage_adequate: true }),
        makeRow({ food_storage_adequate: true }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.food_storage_rate).toBe(100);
    });

    it("returns 0 when no food storage adequate", () => {
      const records = [
        makeRow({ food_storage_adequate: false }),
        makeRow({ food_storage_adequate: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.food_storage_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ food_storage_adequate: true }),
        makeRow({ food_storage_adequate: false }),
        makeRow({ food_storage_adequate: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.food_storage_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ food_storage_adequate: true }),
        makeRow({ food_storage_adequate: true }),
        makeRow({ food_storage_adequate: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.food_storage_rate).toBe(66.7);
    });
  });

  describe("waste_management_rate", () => {
    it("returns 100 when all waste management ok", () => {
      const records = [
        makeRow({ waste_management_ok: true }),
        makeRow({ waste_management_ok: true }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.waste_management_rate).toBe(100);
    });

    it("returns 0 when no waste management ok", () => {
      const records = [
        makeRow({ waste_management_ok: false }),
        makeRow({ waste_management_ok: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.waste_management_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ waste_management_ok: true }),
        makeRow({ waste_management_ok: false }),
        makeRow({ waste_management_ok: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.waste_management_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ waste_management_ok: true }),
        makeRow({ waste_management_ok: true }),
        makeRow({ waste_management_ok: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.waste_management_rate).toBe(66.7);
    });

    it("calculates rate (1/6 = 16.7%)", () => {
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRow({ waste_management_ok: i === 0 }),
      );
      const m = computePestControlManagementMetrics(records);
      expect(m.waste_management_rate).toBe(16.7);
    });
  });

  describe("active_issue_count", () => {
    it("counts Active Issue status", () => {
      const records = [makeRow({ compliance_status: "Active Issue" })];
      const m = computePestControlManagementMetrics(records);
      expect(m.active_issue_count).toBe(1);
    });

    it("does not count Clear", () => {
      const records = [makeRow({ compliance_status: "Clear" })];
      const m = computePestControlManagementMetrics(records);
      expect(m.active_issue_count).toBe(0);
    });

    it("does not count Under Treatment", () => {
      const records = [makeRow({ compliance_status: "Under Treatment" })];
      const m = computePestControlManagementMetrics(records);
      expect(m.active_issue_count).toBe(0);
    });

    it("does not count Resolved", () => {
      const records = [makeRow({ compliance_status: "Resolved" })];
      const m = computePestControlManagementMetrics(records);
      expect(m.active_issue_count).toBe(0);
    });

    it("does not count Re-Inspection Due", () => {
      const records = [makeRow({ compliance_status: "Re-Inspection Due" })];
      const m = computePestControlManagementMetrics(records);
      expect(m.active_issue_count).toBe(0);
    });

    it("counts multiple Active Issue records", () => {
      const records = [
        makeRow({ compliance_status: "Active Issue" }),
        makeRow({ compliance_status: "Active Issue" }),
        makeRow({ compliance_status: "Clear" }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.active_issue_count).toBe(2);
    });
  });

  describe("infestation_count", () => {
    it("counts Infestation severity", () => {
      const records = [makeRow({ severity: "Infestation" })];
      const m = computePestControlManagementMetrics(records);
      expect(m.infestation_count).toBe(1);
    });

    it("does not count None Found", () => {
      const records = [makeRow({ severity: "None Found" })];
      const m = computePestControlManagementMetrics(records);
      expect(m.infestation_count).toBe(0);
    });

    it("does not count Low", () => {
      const records = [makeRow({ severity: "Low" })];
      const m = computePestControlManagementMetrics(records);
      expect(m.infestation_count).toBe(0);
    });

    it("does not count Moderate", () => {
      const records = [makeRow({ severity: "Moderate" })];
      const m = computePestControlManagementMetrics(records);
      expect(m.infestation_count).toBe(0);
    });

    it("does not count High", () => {
      const records = [makeRow({ severity: "High" })];
      const m = computePestControlManagementMetrics(records);
      expect(m.infestation_count).toBe(0);
    });

    it("counts multiple infestations", () => {
      const records = [
        makeRow({ severity: "Infestation" }),
        makeRow({ severity: "Infestation" }),
        makeRow({ severity: "Low" }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.infestation_count).toBe(2);
    });
  });

  describe("re_inspection_due_count", () => {
    it("counts re_inspection_required = true", () => {
      const records = [
        makeRow({ re_inspection_required: true }),
        makeRow({ re_inspection_required: true }),
        makeRow({ re_inspection_required: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.re_inspection_due_count).toBe(2);
    });

    it("returns zero when no re-inspections required", () => {
      const records = [
        makeRow({ re_inspection_required: false }),
        makeRow({ re_inspection_required: false }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.re_inspection_due_count).toBe(0);
    });
  });

  describe("unique_locations", () => {
    it("counts distinct locations", () => {
      const records = [
        makeRow({ location: "Kitchen" }),
        makeRow({ location: "Bathroom 1" }),
        makeRow({ location: "Kitchen" }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.unique_locations).toBe(2);
    });

    it("returns 1 when all same location", () => {
      const records = [
        makeRow({ location: "Kitchen" }),
        makeRow({ location: "Kitchen" }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.unique_locations).toBe(1);
    });

    it("treats different locations as different", () => {
      const records = [
        makeRow({ location: "Kitchen" }),
        makeRow({ location: "Bathroom 1" }),
        makeRow({ location: "Bathroom 2" }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.unique_locations).toBe(3);
    });
  });

  describe("unique_inspectors", () => {
    it("counts distinct inspector names", () => {
      const records = [
        makeRow({ inspector_name: "Inspector A" }),
        makeRow({ inspector_name: "Inspector B" }),
        makeRow({ inspector_name: "Inspector A" }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.unique_inspectors).toBe(2);
    });

    it("returns 1 when all same inspector", () => {
      const records = [
        makeRow({ inspector_name: "John Smith" }),
        makeRow({ inspector_name: "John Smith" }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.unique_inspectors).toBe(1);
    });

    it("treats different names as different inspectors", () => {
      const records = [
        makeRow({ inspector_name: "Inspector A" }),
        makeRow({ inspector_name: "Inspector B" }),
        makeRow({ inspector_name: "Inspector C" }),
      ];
      const m = computePestControlManagementMetrics(records);
      expect(m.unique_inspectors).toBe(3);
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: HomePestControlManagementRow[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRow({
            pest_type: i % 2 === 0 ? "Rodents" : "Ants",
            proofing_adequate: i % 3 !== 0,
            hygiene_satisfactory: i % 4 !== 0,
            food_storage_adequate: i % 5 !== 0,
            waste_management_ok: i % 6 !== 0,
            compliance_status: "Clear",
            inspector_name: `Inspector ${i % 5}`,
            location: `Location ${i % 10}`,
          }),
        );
      }
      const m = computePestControlManagementMetrics(records);
      expect(m.total_inspections).toBe(100);
      expect(m.unique_inspectors).toBe(5);
      expect(m.unique_locations).toBe(10);
    });
  });
});

// ==============================================================================
// identifyPestControlManagementAlerts
// ==============================================================================

describe("identifyPestControlManagementAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyPestControlManagementAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRow({
          severity: "None Found",
          compliance_status: "Clear",
          treatment_required: false,
          hygiene_satisfactory: true,
          food_storage_adequate: true,
          proofing_adequate: true,
          re_inspection_required: false,
        }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  // -- infestation_found alert ------------------------------------------------

  describe("infestation_found alert", () => {
    it("fires when severity is Infestation", () => {
      const records = [makeRow({ severity: "Infestation" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "infestation_found");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRow({ severity: "Infestation" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "infestation_found")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-inf-1", severity: "Infestation" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "infestation_found")!;
      expect(alert.record_id).toBe("rec-inf-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ severity: "Infestation", location: "Bathroom 1" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "infestation_found")!;
      expect(alert.message).toContain("Bathroom 1");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRow({ severity: "Infestation", inspection_date: "2026-03-15" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "infestation_found")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("includes pest type in message", () => {
      const records = [makeRow({ severity: "Infestation", pest_type: "Cockroaches" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "infestation_found")!;
      expect(alert.message).toContain("Cockroaches");
    });

    it("does not fire when severity is None Found", () => {
      const records = [makeRow({ severity: "None Found" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "infestation_found");
      expect(alert).toBeUndefined();
    });

    it("does not fire when severity is Low", () => {
      const records = [makeRow({ severity: "Low" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "infestation_found");
      expect(alert).toBeUndefined();
    });

    it("does not fire when severity is Moderate", () => {
      const records = [makeRow({ severity: "Moderate" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "infestation_found");
      expect(alert).toBeUndefined();
    });

    it("does not fire when severity is High", () => {
      const records = [makeRow({ severity: "High" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "infestation_found");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple infestations", () => {
      const records = [
        makeRow({ severity: "Infestation" }),
        makeRow({ severity: "Infestation" }),
        makeRow({ severity: "Low" }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      const infAlerts = alerts.filter((a) => a.type === "infestation_found");
      expect(infAlerts).toHaveLength(2);
    });
  });

  // -- food_storage_active_pest alert -----------------------------------------

  describe("food_storage_active_pest alert", () => {
    it("fires when food storage inadequate with active issue", () => {
      const records = [makeRow({ food_storage_adequate: false, compliance_status: "Active Issue" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "food_storage_active_pest");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRow({ food_storage_adequate: false, compliance_status: "Active Issue" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "food_storage_active_pest")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-fs-1", food_storage_adequate: false, compliance_status: "Active Issue" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "food_storage_active_pest")!;
      expect(alert.record_id).toBe("rec-fs-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ food_storage_adequate: false, compliance_status: "Active Issue", location: "Kitchen" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "food_storage_active_pest")!;
      expect(alert.message).toContain("Kitchen");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRow({ food_storage_adequate: false, compliance_status: "Active Issue", inspection_date: "2026-04-20" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "food_storage_active_pest")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("does not fire when food storage adequate", () => {
      const records = [makeRow({ food_storage_adequate: true, compliance_status: "Active Issue" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "food_storage_active_pest");
      expect(alert).toBeUndefined();
    });

    it("does not fire when compliance status is Clear", () => {
      const records = [makeRow({ food_storage_adequate: false, compliance_status: "Clear" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "food_storage_active_pest");
      expect(alert).toBeUndefined();
    });

    it("does not fire when compliance status is Resolved", () => {
      const records = [makeRow({ food_storage_adequate: false, compliance_status: "Resolved" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "food_storage_active_pest");
      expect(alert).toBeUndefined();
    });

    it("does not fire when compliance status is Under Treatment", () => {
      const records = [makeRow({ food_storage_adequate: false, compliance_status: "Under Treatment" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "food_storage_active_pest");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple matching records", () => {
      const records = [
        makeRow({ food_storage_adequate: false, compliance_status: "Active Issue" }),
        makeRow({ food_storage_adequate: false, compliance_status: "Active Issue" }),
        makeRow({ food_storage_adequate: true, compliance_status: "Active Issue" }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      const fsAlerts = alerts.filter((a) => a.type === "food_storage_active_pest");
      expect(fsAlerts).toHaveLength(2);
    });
  });

  // -- hygiene_unsatisfactory alert -------------------------------------------

  describe("hygiene_unsatisfactory alert", () => {
    it("fires when hygiene_satisfactory is false", () => {
      const records = [makeRow({ hygiene_satisfactory: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hygiene_unsatisfactory");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRow({ hygiene_satisfactory: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hygiene_unsatisfactory")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-hyg-1", hygiene_satisfactory: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hygiene_unsatisfactory")!;
      expect(alert.record_id).toBe("rec-hyg-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ hygiene_satisfactory: false, location: "Utility Room" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hygiene_unsatisfactory")!;
      expect(alert.message).toContain("Utility Room");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRow({ hygiene_satisfactory: false, inspection_date: "2026-02-10" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hygiene_unsatisfactory")!;
      expect(alert.message).toContain("2026-02-10");
    });

    it("does not fire when hygiene_satisfactory is true", () => {
      const records = [makeRow({ hygiene_satisfactory: true })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "hygiene_unsatisfactory");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple unsatisfactory records", () => {
      const records = [
        makeRow({ hygiene_satisfactory: false }),
        makeRow({ hygiene_satisfactory: false }),
        makeRow({ hygiene_satisfactory: true }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      const hygAlerts = alerts.filter((a) => a.type === "hygiene_unsatisfactory");
      expect(hygAlerts).toHaveLength(2);
    });
  });

  // -- active_issue_no_treatment alert ----------------------------------------

  describe("active_issue_no_treatment alert", () => {
    it("fires when active issue without treatment required", () => {
      const records = [makeRow({ compliance_status: "Active Issue", treatment_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "active_issue_no_treatment");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRow({ compliance_status: "Active Issue", treatment_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "active_issue_no_treatment")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-aint-1", compliance_status: "Active Issue", treatment_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "active_issue_no_treatment")!;
      expect(alert.record_id).toBe("rec-aint-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ compliance_status: "Active Issue", treatment_required: false, location: "Bedroom 3" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "active_issue_no_treatment")!;
      expect(alert.message).toContain("Bedroom 3");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRow({ compliance_status: "Active Issue", treatment_required: false, inspection_date: "2026-02-20" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "active_issue_no_treatment")!;
      expect(alert.message).toContain("2026-02-20");
    });

    it("does not fire when treatment is required", () => {
      const records = [makeRow({ compliance_status: "Active Issue", treatment_required: true })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "active_issue_no_treatment");
      expect(alert).toBeUndefined();
    });

    it("does not fire when compliance status is Clear", () => {
      const records = [makeRow({ compliance_status: "Clear", treatment_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "active_issue_no_treatment");
      expect(alert).toBeUndefined();
    });

    it("does not fire when compliance status is Resolved", () => {
      const records = [makeRow({ compliance_status: "Resolved", treatment_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "active_issue_no_treatment");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple matching records", () => {
      const records = [
        makeRow({ compliance_status: "Active Issue", treatment_required: false }),
        makeRow({ compliance_status: "Active Issue", treatment_required: false }),
        makeRow({ compliance_status: "Active Issue", treatment_required: true }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      const aintAlerts = alerts.filter((a) => a.type === "active_issue_no_treatment");
      expect(aintAlerts).toHaveLength(2);
    });
  });

  // -- re_inspection_overdue alert --------------------------------------------

  describe("re_inspection_overdue alert", () => {
    it("fires when re-inspection required with past date", () => {
      const records = [makeRow({ re_inspection_required: true, re_inspection_date: "2020-01-01" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "re_inspection_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRow({ re_inspection_required: true, re_inspection_date: "2020-01-01" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "re_inspection_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-ri-1", re_inspection_required: true, re_inspection_date: "2020-01-01" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "re_inspection_overdue")!;
      expect(alert.record_id).toBe("rec-ri-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ re_inspection_required: true, re_inspection_date: "2020-01-01", location: "Laundry Room" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "re_inspection_overdue")!;
      expect(alert.message).toContain("Laundry Room");
    });

    it("includes re_inspection_date in message", () => {
      const records = [makeRow({ re_inspection_required: true, re_inspection_date: "2020-01-01" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "re_inspection_overdue")!;
      expect(alert.message).toContain("2020-01-01");
    });

    it("does not fire when re_inspection_required is false", () => {
      const records = [makeRow({ re_inspection_required: false, re_inspection_date: "2020-01-01" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "re_inspection_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when re_inspection_date is null", () => {
      const records = [makeRow({ re_inspection_required: true, re_inspection_date: null })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "re_inspection_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when re_inspection_date is in the future", () => {
      const records = [makeRow({ re_inspection_required: true, re_inspection_date: "2099-12-31" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "re_inspection_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple overdue records", () => {
      const records = [
        makeRow({ re_inspection_required: true, re_inspection_date: "2020-01-01" }),
        makeRow({ re_inspection_required: true, re_inspection_date: "2020-06-01" }),
        makeRow({ re_inspection_required: true, re_inspection_date: "2099-12-31" }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      const riAlerts = alerts.filter((a) => a.type === "re_inspection_overdue");
      expect(riAlerts).toHaveLength(2);
    });
  });

  // -- proofing_inadequate alert ----------------------------------------------

  describe("proofing_inadequate alert", () => {
    it("fires when proofing_adequate is false", () => {
      const records = [makeRow({ proofing_adequate: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "proofing_inadequate");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRow({ proofing_adequate: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "proofing_inadequate")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-pr-1", proofing_adequate: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "proofing_inadequate")!;
      expect(alert.record_id).toBe("rec-pr-1");
    });

    it("includes location in message", () => {
      const records = [makeRow({ proofing_adequate: false, location: "Garden Shed" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "proofing_inadequate")!;
      expect(alert.message).toContain("Garden Shed");
    });

    it("includes inspection_date in message", () => {
      const records = [makeRow({ proofing_adequate: false, inspection_date: "2026-03-01" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "proofing_inadequate")!;
      expect(alert.message).toContain("2026-03-01");
    });

    it("does not fire when proofing_adequate is true", () => {
      const records = [makeRow({ proofing_adequate: true })];
      const alerts = identifyPestControlManagementAlerts(records);
      const alert = alerts.find((a) => a.type === "proofing_inadequate");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple inadequate proofing records", () => {
      const records = [
        makeRow({ proofing_adequate: false }),
        makeRow({ proofing_adequate: false }),
        makeRow({ proofing_adequate: true }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      const prAlerts = alerts.filter((a) => a.type === "proofing_inadequate");
      expect(prAlerts).toHaveLength(2);
    });
  });

  // -- combined alerts --------------------------------------------------------

  describe("combined alerts", () => {
    it("can fire all alert types simultaneously", () => {
      const records = [
        makeRow({
          id: "r1",
          severity: "Infestation",
          food_storage_adequate: false,
          compliance_status: "Active Issue",
          treatment_required: false,
          hygiene_satisfactory: false,
          proofing_adequate: false,
          re_inspection_required: true,
          re_inspection_date: "2020-01-01",
        }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("infestation_found");
      expect(types).toContain("food_storage_active_pest");
      expect(types).toContain("hygiene_unsatisfactory");
      expect(types).toContain("active_issue_no_treatment");
      expect(types).toContain("re_inspection_overdue");
      expect(types).toContain("proofing_inadequate");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRow({
          severity: "Infestation",
          food_storage_adequate: false,
          compliance_status: "Active Issue",
          treatment_required: false,
          hygiene_satisfactory: false,
          proofing_adequate: false,
          re_inspection_required: true,
          re_inspection_date: "2020-01-01",
        }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      // infestation=1, food_storage=1, hygiene=1, active_no_treatment=1, re_inspection=1, proofing=1
      expect(alerts).toHaveLength(6);
    });

    it("per-record alerts multiply with multiple records", () => {
      const records = [
        makeRow({ severity: "Infestation" }),
        makeRow({ severity: "Infestation" }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      expect(alerts.filter((a) => a.type === "infestation_found")).toHaveLength(2);
    });
  });

  // -- alert structure --------------------------------------------------------

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const records = [
        makeRow({ severity: "Infestation", hygiene_satisfactory: false }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRow({
          severity: "Infestation",
          food_storage_adequate: false,
          compliance_status: "Active Issue",
          treatment_required: false,
          hygiene_satisfactory: false,
          proofing_adequate: false,
          re_inspection_required: true,
          re_inspection_date: "2020-01-01",
        }),
      ];
      const alerts = identifyPestControlManagementAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRow({ severity: "Infestation" })];
      const alerts = identifyPestControlManagementAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  // -- edge cases -------------------------------------------------------------

  describe("edge cases", () => {
    it("clean record triggers no alerts", () => {
      const records = [makeRow({ severity: "None Found", compliance_status: "Clear", treatment_required: false, hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true, re_inspection_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Low severity does not trigger infestation_found", () => {
      const records = [makeRow({ severity: "Low", compliance_status: "Clear", hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true, re_inspection_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const infAlerts = alerts.filter((a) => a.type === "infestation_found");
      expect(infAlerts).toHaveLength(0);
    });

    it("Moderate severity does not trigger infestation_found", () => {
      const records = [makeRow({ severity: "Moderate", compliance_status: "Clear", hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true, re_inspection_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const infAlerts = alerts.filter((a) => a.type === "infestation_found");
      expect(infAlerts).toHaveLength(0);
    });

    it("High severity does not trigger infestation_found", () => {
      const records = [makeRow({ severity: "High", compliance_status: "Clear", hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true, re_inspection_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const infAlerts = alerts.filter((a) => a.type === "infestation_found");
      expect(infAlerts).toHaveLength(0);
    });

    it("Clear status does not trigger active_issue_no_treatment", () => {
      const records = [makeRow({ compliance_status: "Clear", treatment_required: false, hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true, re_inspection_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const aintAlerts = alerts.filter((a) => a.type === "active_issue_no_treatment");
      expect(aintAlerts).toHaveLength(0);
    });

    it("Resolved status does not trigger food_storage_active_pest", () => {
      const records = [makeRow({ compliance_status: "Resolved", food_storage_adequate: false, hygiene_satisfactory: true, proofing_adequate: true, re_inspection_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const fsAlerts = alerts.filter((a) => a.type === "food_storage_active_pest");
      expect(fsAlerts).toHaveLength(0);
    });

    it("Under Treatment status does not trigger food_storage_active_pest", () => {
      const records = [makeRow({ compliance_status: "Under Treatment", food_storage_adequate: false, hygiene_satisfactory: true, proofing_adequate: true, re_inspection_required: false })];
      const alerts = identifyPestControlManagementAlerts(records);
      const fsAlerts = alerts.filter((a) => a.type === "food_storage_active_pest");
      expect(fsAlerts).toHaveLength(0);
    });

    it("future re_inspection_date does not trigger re_inspection_overdue", () => {
      const records = [makeRow({ re_inspection_required: true, re_inspection_date: "2099-12-31", hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true, compliance_status: "Clear" })];
      const alerts = identifyPestControlManagementAlerts(records);
      const riAlerts = alerts.filter((a) => a.type === "re_inspection_overdue");
      expect(riAlerts).toHaveLength(0);
    });
  });
});

// ==============================================================================
// generatePestControlManagementCaraInsights
// ==============================================================================

describe("generatePestControlManagementCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const records = [makeRow()];
    const insights = generatePestControlManagementCaraInsights(records);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty array", () => {
    const insights = generatePestControlManagementCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [lime]", () => {
    const records = [makeRow()];
    const insights = generatePestControlManagementCaraInsights(records);
    expect(insights[0]).toMatch(/^\[lime\]/);
  });

  it("second insight starts with [amber]", () => {
    const records = [makeRow()];
    const insights = generatePestControlManagementCaraInsights(records);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("third insight starts with [reflect]", () => {
    const records = [makeRow()];
    const insights = generatePestControlManagementCaraInsights(records);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("all insights are non-empty strings", () => {
    const records = [makeRow()];
    const insights = generatePestControlManagementCaraInsights(records);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  describe("first insight (lime) -- summary stats", () => {
    it("includes total inspection count", () => {
      const records = [makeRow(), makeRow(), makeRow()];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[0]).toContain("3 pest control inspections");
    });

    it("includes unique location count", () => {
      const records = [
        makeRow({ location: "Kitchen" }),
        makeRow({ location: "Bathroom 1" }),
      ];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[0]).toContain("2 locations");
    });

    it("uses singular location for count of 1", () => {
      const records = [makeRow({ location: "Kitchen" })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[0]).toContain("1 location");
    });

    it("includes unique inspector count", () => {
      const records = [
        makeRow({ inspector_name: "Inspector A" }),
        makeRow({ inspector_name: "Inspector B" }),
      ];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[0]).toContain("2 inspectors");
    });

    it("uses singular inspector for count of 1", () => {
      const records = [makeRow({ inspector_name: "Single Inspector" })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[0]).toContain("1 inspector");
    });

    it("includes proofing rate", () => {
      const records = [makeRow({ proofing_adequate: true })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[0]).toContain("100%");
    });

    it("uses singular inspection for count of 1", () => {
      const records = [makeRow()];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[0]).toContain("1 pest control inspection");
    });
  });

  describe("second insight (amber) -- priority concerns", () => {
    it("mentions critical and high alerts when present", () => {
      const records = [makeRow({ severity: "Infestation", hygiene_satisfactory: false })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high");
    });

    it("mentions infestation count when alerts present", () => {
      const records = [makeRow({ severity: "Infestation" })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[1]).toContain("infestation");
    });

    it("mentions no critical alerts when all clean", () => {
      const records = [makeRow({ severity: "None Found", compliance_status: "Clear", treatment_required: false, hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true, re_inspection_required: false })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[1]).toContain("No critical or high-priority");
    });

    it("mentions pest-free premises when no alerts", () => {
      const records = [makeRow({ severity: "None Found", compliance_status: "Clear", treatment_required: false, hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true, re_inspection_required: false })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[1]).toContain("pest-free");
    });

    it("uses singular for 1 infestation", () => {
      const records = [makeRow({ severity: "Infestation" })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[1]).toContain("infestation has");
    });

    it("uses plural for multiple infestations", () => {
      const records = [
        makeRow({ severity: "Infestation" }),
        makeRow({ severity: "Infestation" }),
      ];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[1]).toContain("infestations have");
    });

    it("uses singular for 1 active issue", () => {
      const records = [makeRow({ compliance_status: "Active Issue", treatment_required: false })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[1]).toContain("active issue remains");
    });

    it("uses plural for multiple active issues", () => {
      const records = [
        makeRow({ compliance_status: "Active Issue", treatment_required: false }),
        makeRow({ compliance_status: "Active Issue", treatment_required: false }),
      ];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[1]).toContain("active issues remain");
    });
  });

  describe("third insight (reflect) -- reflective question", () => {
    it("mentions infestations when present", () => {
      const records = [makeRow({ severity: "Infestation" })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[2]).toContain("infestation");
    });

    it("uses singular for 1 infestation", () => {
      const records = [makeRow({ severity: "Infestation" })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[2]).toContain("infestation has");
    });

    it("uses plural for multiple infestations", () => {
      const records = [
        makeRow({ severity: "Infestation" }),
        makeRow({ severity: "Infestation" }),
      ];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[2]).toContain("infestations have");
    });

    it("asks about active issues and re-inspections when no infestations but issues found", () => {
      const records = [makeRow({ severity: "Low", compliance_status: "Active Issue", treatment_required: false })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[2]).toContain("active");
    });

    it("asks about re-inspections when re-inspections due but no infestations", () => {
      const records = [makeRow({ severity: "Low", compliance_status: "Clear", re_inspection_required: true, hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[2]).toContain("re-inspection");
    });

    it("provides positive reflection when all clean", () => {
      const records = [makeRow({ severity: "None Found", compliance_status: "Clear", treatment_required: false, hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true, re_inspection_required: false })];
      const insights = generatePestControlManagementCaraInsights(records);
      expect(insights[2]).toContain("no infestations");
    });

    it("asks about staff awareness in positive reflection", () => {
      const records = [makeRow({ severity: "None Found", compliance_status: "Clear", treatment_required: false, hygiene_satisfactory: true, food_storage_adequate: true, proofing_adequate: true, re_inspection_required: false })];
      const insights = generatePestControlManagementCaraInsights(records);
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
    expect(r.inspection_date).toBe("2026-05-01");
    expect(r.inspector_name).toBe("John Smith");
    expect(r.pest_type).toBe("Rodents");
    expect(r.location).toBe("Kitchen");
    expect(r.severity).toBe("None Found");
    expect(r.treatment_required).toBe(false);
    expect(r.treatment_method).toBeNull();
    expect(r.treatment_date).toBeNull();
    expect(r.treatment_completed).toBe(false);
    expect(r.proofing_adequate).toBe(true);
    expect(r.hygiene_satisfactory).toBe(true);
    expect(r.food_storage_adequate).toBe(true);
    expect(r.waste_management_ok).toBe(true);
    expect(r.re_inspection_required).toBe(false);
    expect(r.re_inspection_date).toBeNull();
    expect(r.compliance_status).toBe("Clear");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ pest_type: "Cockroaches", compliance_status: "Active Issue" });
    expect(r.pest_type).toBe("Cockroaches");
    expect(r.compliance_status).toBe("Active Issue");
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
    const r = makeRow({ treatment_method: null, treatment_date: null, re_inspection_date: null, notes: null });
    expect(r.treatment_method).toBeNull();
    expect(r.treatment_date).toBeNull();
    expect(r.re_inspection_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting treatment_method", () => {
    const r = makeRow({ treatment_method: "Baiting" });
    expect(r.treatment_method).toBe("Baiting");
  });

  it("allows setting boolean fields", () => {
    const r = makeRow({ treatment_required: true, treatment_completed: true, proofing_adequate: false, hygiene_satisfactory: false, food_storage_adequate: false, waste_management_ok: false, re_inspection_required: true });
    expect(r.treatment_required).toBe(true);
    expect(r.treatment_completed).toBe(true);
    expect(r.proofing_adequate).toBe(false);
    expect(r.hygiene_satisfactory).toBe(false);
    expect(r.food_storage_adequate).toBe(false);
    expect(r.waste_management_ok).toBe(false);
    expect(r.re_inspection_required).toBe(true);
  });

  it("allows setting location", () => {
    const r = makeRow({ location: "Bathroom 2" });
    expect(r.location).toBe("Bathroom 2");
  });

  it("allows setting treatment_date", () => {
    const r = makeRow({ treatment_date: "2026-06-01" });
    expect(r.treatment_date).toBe("2026-06-01");
  });

  it("allows setting re_inspection_date", () => {
    const r = makeRow({ re_inspection_date: "2027-11-15" });
    expect(r.re_inspection_date).toBe("2027-11-15");
  });

  it("allows setting notes", () => {
    const r = makeRow({ notes: "Test note" });
    expect(r.notes).toBe("Test note");
  });

  it("allows setting severity", () => {
    const r = makeRow({ severity: "High" });
    expect(r.severity).toBe("High");
  });

  it("allows setting pest_type", () => {
    const r = makeRow({ pest_type: "Bed Bugs" });
    expect(r.pest_type).toBe("Bed Bugs");
  });

  it("allows setting inspector_name", () => {
    const r = makeRow({ inspector_name: "Jane Doe" });
    expect(r.inspector_name).toBe("Jane Doe");
  });

  it("allows setting inspection_date", () => {
    const r = makeRow({ inspection_date: "2026-06-15" });
    expect(r.inspection_date).toBe("2026-06-15");
  });
});
