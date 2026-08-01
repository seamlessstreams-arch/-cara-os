// ══════════════════════════════════════════════════════════════════════════════
// CARA — MAINTENANCE & REPAIRS SERVICE TESTS
// Pure-function tests for maintenance metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  MAINTENANCE_TYPES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  CONTRACTOR_STATUSES,
  _testing,
} from "../maintenance-repairs-service";

import type {
  MaintenanceRecord,
  MaintenanceType,
  MaintenancePriority,
  MaintenanceStatus,
  ContractorStatus,
} from "../maintenance-repairs-service";

const { computeMaintenanceMetrics, identifyMaintenanceAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<MaintenanceRecord>,
): MaintenanceRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    maintenance_type: "maintenance_type" in (overrides ?? {}) ? overrides!.maintenance_type! : "repair_request",
    reported_date: "reported_date" in (overrides ?? {}) ? overrides!.reported_date! : "2026-05-01",
    completed_date: "completed_date" in (overrides ?? {}) ? (overrides!.completed_date ?? null) : null,
    priority: "priority" in (overrides ?? {}) ? overrides!.priority! : "routine",
    status: "status" in (overrides ?? {}) ? overrides!.status! : "reported",
    description: "description" in (overrides ?? {}) ? overrides!.description! : "General repair",
    location: "location" in (overrides ?? {}) ? overrides!.location! : "Main building",
    contractor_used: "contractor_used" in (overrides ?? {}) ? overrides!.contractor_used! : false,
    contractor_name: "contractor_name" in (overrides ?? {}) ? (overrides!.contractor_name ?? null) : null,
    contractor_status: "contractor_status" in (overrides ?? {}) ? overrides!.contractor_status! : "not_required",
    cost: "cost" in (overrides ?? {}) ? (overrides!.cost ?? null) : null,
    children_impact_assessed: "children_impact_assessed" in (overrides ?? {}) ? overrides!.children_impact_assessed! : true,
    safeguarding_check_completed: "safeguarding_check_completed" in (overrides ?? {}) ? overrides!.safeguarding_check_completed! : true,
    certificate_obtained: "certificate_obtained" in (overrides ?? {}) ? overrides!.certificate_obtained! : false,
    days_to_completion: "days_to_completion" in (overrides ?? {}) ? (overrides!.days_to_completion ?? null) : null,
    reported_by: "reported_by" in (overrides ?? {}) ? overrides!.reported_by! : "Staff Member",
    completed_by: "completed_by" in (overrides ?? {}) ? (overrides!.completed_by ?? null) : null,
    issues_found: "issues_found" in (overrides ?? {}) ? overrides!.issues_found! : [],
    actions_taken: "actions_taken" in (overrides ?? {}) ? overrides!.actions_taken! : [],
    next_due_date: "next_due_date" in (overrides ?? {}) ? (overrides!.next_due_date ?? null) : null,
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

/** Return an ISO date string for N days from now (future) */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("MAINTENANCE_TYPES", () => {
    it("has exactly 10 items", () => {
      expect(MAINTENANCE_TYPES).toHaveLength(10);
    });

    it("contains repair_request", () => {
      expect(MAINTENANCE_TYPES).toContainEqual({ type: "repair_request", label: "Repair Request" });
    });

    it("contains planned_maintenance", () => {
      expect(MAINTENANCE_TYPES).toContainEqual({ type: "planned_maintenance", label: "Planned Maintenance" });
    });

    it("contains pat_testing", () => {
      expect(MAINTENANCE_TYPES).toContainEqual({ type: "pat_testing", label: "PAT Testing" });
    });

    it("contains gas_safety", () => {
      expect(MAINTENANCE_TYPES).toContainEqual({ type: "gas_safety", label: "Gas Safety" });
    });

    it("contains electrical_inspection", () => {
      expect(MAINTENANCE_TYPES).toContainEqual({ type: "electrical_inspection", label: "Electrical Inspection" });
    });

    it("contains plumbing", () => {
      expect(MAINTENANCE_TYPES).toContainEqual({ type: "plumbing", label: "Plumbing" });
    });

    it("contains decorating", () => {
      expect(MAINTENANCE_TYPES).toContainEqual({ type: "decorating", label: "Decorating" });
    });

    it("contains garden_grounds", () => {
      expect(MAINTENANCE_TYPES).toContainEqual({ type: "garden_grounds", label: "Garden & Grounds" });
    });

    it("contains appliance_repair", () => {
      expect(MAINTENANCE_TYPES).toContainEqual({ type: "appliance_repair", label: "Appliance Repair" });
    });

    it("contains other", () => {
      expect(MAINTENANCE_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = MAINTENANCE_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = MAINTENANCE_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of MAINTENANCE_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("MAINTENANCE_PRIORITIES", () => {
    it("has exactly 5 items", () => {
      expect(MAINTENANCE_PRIORITIES).toHaveLength(5);
    });

    it("contains emergency", () => {
      expect(MAINTENANCE_PRIORITIES).toContainEqual({ priority: "emergency", label: "Emergency" });
    });

    it("contains urgent", () => {
      expect(MAINTENANCE_PRIORITIES).toContainEqual({ priority: "urgent", label: "Urgent" });
    });

    it("contains routine", () => {
      expect(MAINTENANCE_PRIORITIES).toContainEqual({ priority: "routine", label: "Routine" });
    });

    it("contains low", () => {
      expect(MAINTENANCE_PRIORITIES).toContainEqual({ priority: "low", label: "Low" });
    });

    it("contains planned", () => {
      expect(MAINTENANCE_PRIORITIES).toContainEqual({ priority: "planned", label: "Planned" });
    });

    it("has unique priority values", () => {
      const priorities = MAINTENANCE_PRIORITIES.map((p) => p.priority);
      expect(new Set(priorities).size).toBe(priorities.length);
    });

    it("has unique labels", () => {
      const labels = MAINTENANCE_PRIORITIES.map((p) => p.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of MAINTENANCE_PRIORITIES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("MAINTENANCE_STATUSES", () => {
    it("has exactly 6 items", () => {
      expect(MAINTENANCE_STATUSES).toHaveLength(6);
    });

    it("contains reported", () => {
      expect(MAINTENANCE_STATUSES).toContainEqual({ status: "reported", label: "Reported" });
    });

    it("contains acknowledged", () => {
      expect(MAINTENANCE_STATUSES).toContainEqual({ status: "acknowledged", label: "Acknowledged" });
    });

    it("contains in_progress", () => {
      expect(MAINTENANCE_STATUSES).toContainEqual({ status: "in_progress", label: "In Progress" });
    });

    it("contains awaiting_parts", () => {
      expect(MAINTENANCE_STATUSES).toContainEqual({ status: "awaiting_parts", label: "Awaiting Parts" });
    });

    it("contains completed", () => {
      expect(MAINTENANCE_STATUSES).toContainEqual({ status: "completed", label: "Completed" });
    });

    it("contains cancelled", () => {
      expect(MAINTENANCE_STATUSES).toContainEqual({ status: "cancelled", label: "Cancelled" });
    });

    it("has unique status values", () => {
      const statuses = MAINTENANCE_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = MAINTENANCE_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of MAINTENANCE_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("CONTRACTOR_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(CONTRACTOR_STATUSES).toHaveLength(5);
    });

    it("contains approved", () => {
      expect(CONTRACTOR_STATUSES).toContainEqual({ status: "approved", label: "Approved" });
    });

    it("contains pending_approval", () => {
      expect(CONTRACTOR_STATUSES).toContainEqual({ status: "pending_approval", label: "Pending Approval" });
    });

    it("contains dbs_checked", () => {
      expect(CONTRACTOR_STATUSES).toContainEqual({ status: "dbs_checked", label: "DBS Checked" });
    });

    it("contains not_required", () => {
      expect(CONTRACTOR_STATUSES).toContainEqual({ status: "not_required", label: "Not Required" });
    });

    it("contains rejected", () => {
      expect(CONTRACTOR_STATUSES).toContainEqual({ status: "rejected", label: "Rejected" });
    });

    it("has unique status values", () => {
      const statuses = CONTRACTOR_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = CONTRACTOR_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of CONTRACTOR_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeMaintenanceMetrics ────────────────────────────────────────────

describe("computeMaintenanceMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_records", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.total_records).toBe(0);
    });

    it("returns zero repair_request_count", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.repair_request_count).toBe(0);
    });

    it("returns zero planned_maintenance_count", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.planned_maintenance_count).toBe(0);
    });

    it("returns zero pat_testing_count", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.pat_testing_count).toBe(0);
    });

    it("returns zero completed_count", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.completed_count).toBe(0);
    });

    it("returns zero open_count", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.open_count).toBe(0);
    });

    it("returns zero completion_rate", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.completion_rate).toBeNull();;
    });

    it("returns zero emergency_count", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.emergency_count).toBe(0);
    });

    it("returns zero urgent_count", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.urgent_count).toBe(0);
    });

    it("returns zero average_days_to_completion", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.average_days_to_completion).toBeNull();;
    });

    it("returns zero total_cost", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.total_cost).toBe(0);
    });

    it("returns zero contractor_used_rate", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.contractor_used_rate).toBeNull();;
    });

    it("returns zero children_impact_assessed_rate", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.children_impact_assessed_rate).toBeNull();;
    });

    it("returns zero safeguarding_check_rate", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.safeguarding_check_rate).toBeNull();;
    });

    it("returns zero certificate_obtained_rate", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.certificate_obtained_rate).toBeNull();;
    });

    it("returns zero overdue_count", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.overdue_count).toBe(0);
    });

    it("returns empty by_maintenance_type", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.by_maintenance_type).toEqual({});
    });

    it("returns empty by_priority", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.by_priority).toEqual({});
    });

    it("returns empty by_status", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.by_status).toEqual({});
    });

    it("returns empty by_contractor_status", () => {
      const m = computeMaintenanceMetrics([]);
      expect(m.by_contractor_status).toEqual({});
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      maintenance_type: "repair_request",
      status: "completed",
      priority: "routine",
      contractor_used: true,
      children_impact_assessed: true,
      safeguarding_check_completed: true,
      certificate_obtained: true,
      cost: 150.50,
      days_to_completion: 3,
      contractor_status: "approved",
    });

    it("returns total_records = 1", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.total_records).toBe(1);
    });

    it("returns repair_request_count = 1", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.repair_request_count).toBe(1);
    });

    it("returns planned_maintenance_count = 0", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.planned_maintenance_count).toBe(0);
    });

    it("returns pat_testing_count = 0", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.pat_testing_count).toBe(0);
    });

    it("returns completed_count = 1", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.completed_count).toBe(1);
    });

    it("returns open_count = 0 for completed record", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.open_count).toBe(0);
    });

    it("returns completion_rate = 100", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.completion_rate).toBe(100);
    });

    it("returns emergency_count = 0", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.emergency_count).toBe(0);
    });

    it("returns urgent_count = 0", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.urgent_count).toBe(0);
    });

    it("returns average_days_to_completion = 3", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.average_days_to_completion).toBe(3);
    });

    it("returns total_cost = 150.50", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.total_cost).toBe(150.50);
    });

    it("returns contractor_used_rate = 100", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.contractor_used_rate).toBe(100);
    });

    it("returns children_impact_assessed_rate = 100", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.children_impact_assessed_rate).toBe(100);
    });

    it("returns safeguarding_check_rate = 100", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.safeguarding_check_rate).toBe(100);
    });

    it("returns certificate_obtained_rate = 100", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.certificate_obtained_rate).toBe(100);
    });

    it("returns by_maintenance_type with single entry", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.by_maintenance_type).toEqual({ repair_request: 1 });
    });

    it("returns by_priority with single entry", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.by_priority).toEqual({ routine: 1 });
    });

    it("returns by_status with single entry", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.by_status).toEqual({ completed: 1 });
    });

    it("returns by_contractor_status with single entry", () => {
      const m = computeMaintenanceMetrics([record]);
      expect(m.by_contractor_status).toEqual({ approved: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ maintenance_type: "repair_request", status: "completed", priority: "emergency", contractor_used: true, children_impact_assessed: true, safeguarding_check_completed: true, certificate_obtained: true, cost: 200, days_to_completion: 2, contractor_status: "approved" }),
      makeRecord({ maintenance_type: "planned_maintenance", status: "reported", priority: "urgent", contractor_used: false, children_impact_assessed: false, safeguarding_check_completed: false, certificate_obtained: false, cost: 50, days_to_completion: null, contractor_status: "not_required" }),
      makeRecord({ maintenance_type: "pat_testing", status: "in_progress", priority: "routine", contractor_used: true, children_impact_assessed: true, safeguarding_check_completed: true, certificate_obtained: true, cost: null, days_to_completion: 5, contractor_status: "dbs_checked" }),
      makeRecord({ maintenance_type: "gas_safety", status: "cancelled", priority: "low", contractor_used: false, children_impact_assessed: false, safeguarding_check_completed: false, certificate_obtained: false, cost: 100, days_to_completion: null, contractor_status: "pending_approval" }),
      makeRecord({ maintenance_type: "electrical_inspection", status: "completed", priority: "planned", contractor_used: true, children_impact_assessed: true, safeguarding_check_completed: true, certificate_obtained: true, cost: 300, days_to_completion: 10, contractor_status: "approved" }),
    ];

    it("returns total_records = 5", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.total_records).toBe(5);
    });

    it("returns repair_request_count = 1", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.repair_request_count).toBe(1);
    });

    it("returns planned_maintenance_count = 1", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.planned_maintenance_count).toBe(1);
    });

    it("returns pat_testing_count = 1", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.pat_testing_count).toBe(1);
    });

    it("returns completed_count = 2", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.completed_count).toBe(2);
    });

    it("returns open_count = 2 (excludes completed and cancelled)", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.open_count).toBe(2);
    });

    it("calculates completion_rate correctly (2/5 = 40%)", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.completion_rate).toBe(40);
    });

    it("returns emergency_count = 1", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.emergency_count).toBe(1);
    });

    it("returns urgent_count = 1", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.urgent_count).toBe(1);
    });

    it("calculates average_days_to_completion correctly ((2+5+10)/3 = 5.7)", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.average_days_to_completion).toBe(5.7);
    });

    it("calculates total_cost correctly (200+50+100+300 = 650)", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.total_cost).toBe(650);
    });

    it("calculates contractor_used_rate correctly (3/5 = 60%)", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.contractor_used_rate).toBe(60);
    });

    it("calculates children_impact_assessed_rate correctly (3/5 = 60%)", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.children_impact_assessed_rate).toBe(60);
    });

    it("calculates safeguarding_check_rate correctly (3/5 = 60%)", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.safeguarding_check_rate).toBe(60);
    });

    it("calculates certificate_obtained_rate correctly (3/5 = 60%)", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.certificate_obtained_rate).toBe(60);
    });

    it("groups by_maintenance_type correctly", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.by_maintenance_type).toEqual({ repair_request: 1, planned_maintenance: 1, pat_testing: 1, gas_safety: 1, electrical_inspection: 1 });
    });

    it("groups by_priority correctly", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.by_priority).toEqual({ emergency: 1, urgent: 1, routine: 1, low: 1, planned: 1 });
    });

    it("groups by_status correctly", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.by_status).toEqual({ completed: 2, reported: 1, in_progress: 1, cancelled: 1 });
    });

    it("groups by_contractor_status correctly", () => {
      const m = computeMaintenanceMetrics(records);
      expect(m.by_contractor_status).toEqual({ approved: 2, not_required: 1, dbs_checked: 1, pending_approval: 1 });
    });
  });

  describe("maintenance type counts", () => {
    it("counts repair_request records", () => {
      const records = [
        makeRecord({ maintenance_type: "repair_request" }),
        makeRecord({ maintenance_type: "repair_request" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.repair_request_count).toBe(2);
    });

    it("counts planned_maintenance records", () => {
      const records = [
        makeRecord({ maintenance_type: "planned_maintenance" }),
        makeRecord({ maintenance_type: "planned_maintenance" }),
        makeRecord({ maintenance_type: "planned_maintenance" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.planned_maintenance_count).toBe(3);
    });

    it("counts pat_testing records", () => {
      const records = [
        makeRecord({ maintenance_type: "pat_testing" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.pat_testing_count).toBe(1);
    });

    it("does not count gas_safety as repair_request", () => {
      const records = [makeRecord({ maintenance_type: "gas_safety" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.repair_request_count).toBe(0);
    });

    it("does not count electrical_inspection as planned_maintenance", () => {
      const records = [makeRecord({ maintenance_type: "electrical_inspection" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.planned_maintenance_count).toBe(0);
    });

    it("does not count plumbing as pat_testing", () => {
      const records = [makeRecord({ maintenance_type: "plumbing" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.pat_testing_count).toBe(0);
    });

    it("does not count other as any specific type", () => {
      const records = [makeRecord({ maintenance_type: "other" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.repair_request_count).toBe(0);
      expect(m.planned_maintenance_count).toBe(0);
      expect(m.pat_testing_count).toBe(0);
    });
  });

  describe("completed_count and open_count", () => {
    it("counts completed records", () => {
      const records = [
        makeRecord({ status: "completed" }),
        makeRecord({ status: "completed" }),
        makeRecord({ status: "reported" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.completed_count).toBe(2);
    });

    it("counts open records (excluding completed and cancelled)", () => {
      const records = [
        makeRecord({ status: "reported" }),
        makeRecord({ status: "acknowledged" }),
        makeRecord({ status: "in_progress" }),
        makeRecord({ status: "awaiting_parts" }),
        makeRecord({ status: "completed" }),
        makeRecord({ status: "cancelled" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.open_count).toBe(4);
    });

    it("cancelled records are not open", () => {
      const records = [makeRecord({ status: "cancelled" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.open_count).toBe(0);
    });

    it("completed records are not open", () => {
      const records = [makeRecord({ status: "completed" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.open_count).toBe(0);
    });

    it("reported records are open", () => {
      const records = [makeRecord({ status: "reported" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.open_count).toBe(1);
    });

    it("acknowledged records are open", () => {
      const records = [makeRecord({ status: "acknowledged" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.open_count).toBe(1);
    });

    it("in_progress records are open", () => {
      const records = [makeRecord({ status: "in_progress" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.open_count).toBe(1);
    });

    it("awaiting_parts records are open", () => {
      const records = [makeRecord({ status: "awaiting_parts" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.open_count).toBe(1);
    });
  });

  describe("completion_rate", () => {
    it("returns 100 when all completed", () => {
      const records = [
        makeRecord({ status: "completed" }),
        makeRecord({ status: "completed" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.completion_rate).toBe(100);
    });

    it("returns 0 when none completed", () => {
      const records = [
        makeRecord({ status: "reported" }),
        makeRecord({ status: "in_progress" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.completion_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ status: "completed" }),
        makeRecord({ status: "reported" }),
        makeRecord({ status: "in_progress" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.completion_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ status: "completed" }),
        makeRecord({ status: "completed" }),
        makeRecord({ status: "reported" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.completion_rate).toBe(66.7);
    });

    it("uses all records as denominator including cancelled", () => {
      const records = [
        makeRecord({ status: "completed" }),
        makeRecord({ status: "cancelled" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.completion_rate).toBe(50);
    });
  });

  describe("emergency_count and urgent_count", () => {
    it("counts emergency priority records", () => {
      const records = [
        makeRecord({ priority: "emergency" }),
        makeRecord({ priority: "emergency" }),
        makeRecord({ priority: "routine" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.emergency_count).toBe(2);
    });

    it("counts urgent priority records", () => {
      const records = [
        makeRecord({ priority: "urgent" }),
        makeRecord({ priority: "urgent" }),
        makeRecord({ priority: "urgent" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.urgent_count).toBe(3);
    });

    it("does not count routine as emergency", () => {
      const records = [makeRecord({ priority: "routine" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.emergency_count).toBe(0);
    });

    it("does not count low as urgent", () => {
      const records = [makeRecord({ priority: "low" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.urgent_count).toBe(0);
    });

    it("does not count planned as emergency", () => {
      const records = [makeRecord({ priority: "planned" })];
      const m = computeMaintenanceMetrics(records);
      expect(m.emergency_count).toBe(0);
    });
  });

  describe("average_days_to_completion", () => {
    it("returns 0 when no records have days_to_completion", () => {
      const records = [
        makeRecord({ days_to_completion: null }),
        makeRecord({ days_to_completion: null }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.average_days_to_completion).toBeNull();;
    });

    it("calculates average from single record", () => {
      const records = [makeRecord({ days_to_completion: 7 })];
      const m = computeMaintenanceMetrics(records);
      expect(m.average_days_to_completion).toBe(7);
    });

    it("calculates average from multiple records", () => {
      const records = [
        makeRecord({ days_to_completion: 3 }),
        makeRecord({ days_to_completion: 5 }),
        makeRecord({ days_to_completion: 7 }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.average_days_to_completion).toBe(5);
    });

    it("excludes null days_to_completion from average", () => {
      const records = [
        makeRecord({ days_to_completion: 4 }),
        makeRecord({ days_to_completion: null }),
        makeRecord({ days_to_completion: 6 }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.average_days_to_completion).toBe(5);
    });

    it("rounds to one decimal place (1/3 = 0.3)", () => {
      const records = [
        makeRecord({ days_to_completion: 0 }),
        makeRecord({ days_to_completion: 0 }),
        makeRecord({ days_to_completion: 1 }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.average_days_to_completion).toBe(0.3);
    });

    it("rounds to one decimal place (2/3 = 0.7)", () => {
      const records = [
        makeRecord({ days_to_completion: 0 }),
        makeRecord({ days_to_completion: 1 }),
        makeRecord({ days_to_completion: 1 }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.average_days_to_completion).toBe(0.7);
    });

    it("handles zero days_to_completion", () => {
      const records = [makeRecord({ days_to_completion: 0 })];
      const m = computeMaintenanceMetrics(records);
      expect(m.average_days_to_completion).toBe(0);
    });
  });

  describe("total_cost", () => {
    it("sums non-null costs", () => {
      const records = [
        makeRecord({ cost: 100 }),
        makeRecord({ cost: 200.50 }),
        makeRecord({ cost: 50.25 }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.total_cost).toBe(350.75);
    });

    it("excludes null costs", () => {
      const records = [
        makeRecord({ cost: 100 }),
        makeRecord({ cost: null }),
        makeRecord({ cost: 200 }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.total_cost).toBe(300);
    });

    it("returns 0 when all costs are null", () => {
      const records = [
        makeRecord({ cost: null }),
        makeRecord({ cost: null }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.total_cost).toBe(0);
    });

    it("rounds to two decimal places", () => {
      const records = [
        makeRecord({ cost: 10.333 }),
        makeRecord({ cost: 20.667 }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.total_cost).toBe(31);
    });

    it("handles single cost", () => {
      const records = [makeRecord({ cost: 99.99 })];
      const m = computeMaintenanceMetrics(records);
      expect(m.total_cost).toBe(99.99);
    });
  });

  describe("contractor_used_rate", () => {
    it("returns 100 when all use contractors", () => {
      const records = [
        makeRecord({ contractor_used: true }),
        makeRecord({ contractor_used: true }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.contractor_used_rate).toBe(100);
    });

    it("returns 0 when none use contractors", () => {
      const records = [
        makeRecord({ contractor_used: false }),
        makeRecord({ contractor_used: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.contractor_used_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ contractor_used: true }),
        makeRecord({ contractor_used: false }),
        makeRecord({ contractor_used: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.contractor_used_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ contractor_used: true }),
        makeRecord({ contractor_used: true }),
        makeRecord({ contractor_used: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.contractor_used_rate).toBe(66.7);
    });
  });

  describe("children_impact_assessed_rate", () => {
    it("returns 100 when all assessed", () => {
      const records = [
        makeRecord({ children_impact_assessed: true }),
        makeRecord({ children_impact_assessed: true }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.children_impact_assessed_rate).toBe(100);
    });

    it("returns 0 when none assessed", () => {
      const records = [
        makeRecord({ children_impact_assessed: false }),
        makeRecord({ children_impact_assessed: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.children_impact_assessed_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ children_impact_assessed: true }),
        makeRecord({ children_impact_assessed: false }),
        makeRecord({ children_impact_assessed: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.children_impact_assessed_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ children_impact_assessed: true }),
        makeRecord({ children_impact_assessed: true }),
        makeRecord({ children_impact_assessed: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.children_impact_assessed_rate).toBe(66.7);
    });
  });

  describe("safeguarding_check_rate", () => {
    it("returns 100 when all checked", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: true }),
        makeRecord({ safeguarding_check_completed: true }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.safeguarding_check_rate).toBe(100);
    });

    it("returns 0 when none checked", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: false }),
        makeRecord({ safeguarding_check_completed: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.safeguarding_check_rate).toBe(0);
    });

    it("calculates 50% correctly", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: true }),
        makeRecord({ safeguarding_check_completed: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.safeguarding_check_rate).toBe(50);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: true }),
        makeRecord({ safeguarding_check_completed: false }),
        makeRecord({ safeguarding_check_completed: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.safeguarding_check_rate).toBe(33.3);
    });
  });

  describe("certificate_obtained_rate", () => {
    it("returns 100 when all obtained", () => {
      const records = [
        makeRecord({ certificate_obtained: true }),
        makeRecord({ certificate_obtained: true }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.certificate_obtained_rate).toBe(100);
    });

    it("returns 0 when none obtained", () => {
      const records = [
        makeRecord({ certificate_obtained: false }),
        makeRecord({ certificate_obtained: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.certificate_obtained_rate).toBe(0);
    });

    it("calculates with rounding (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ certificate_obtained: true }),
        makeRecord({ certificate_obtained: true }),
        makeRecord({ certificate_obtained: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.certificate_obtained_rate).toBe(66.7);
    });

    it("calculates (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ certificate_obtained: true }),
        makeRecord({ certificate_obtained: false }),
        makeRecord({ certificate_obtained: false }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.certificate_obtained_rate).toBe(33.3);
    });
  });

  describe("overdue_count", () => {
    it("counts records with past next_due_date", () => {
      const records = [
        makeRecord({ next_due_date: daysAgo(5) }),
        makeRecord({ next_due_date: daysAgo(10) }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.overdue_count).toBe(2);
    });

    it("does not count records with future next_due_date", () => {
      const records = [
        makeRecord({ next_due_date: daysFromNow(10) }),
        makeRecord({ next_due_date: daysFromNow(20) }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.overdue_count).toBe(0);
    });

    it("does not count records with null next_due_date", () => {
      const records = [
        makeRecord({ next_due_date: null }),
        makeRecord({ next_due_date: null }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.overdue_count).toBe(0);
    });

    it("counts mixed past/future/null correctly", () => {
      const records = [
        makeRecord({ next_due_date: daysAgo(5) }),
        makeRecord({ next_due_date: daysFromNow(5) }),
        makeRecord({ next_due_date: null }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.overdue_count).toBe(1);
    });

    it("counts multiple overdue among mixed records", () => {
      const records = [
        makeRecord({ next_due_date: daysAgo(1) }),
        makeRecord({ next_due_date: daysAgo(30) }),
        makeRecord({ next_due_date: daysFromNow(10) }),
        makeRecord({ next_due_date: null }),
        makeRecord({ next_due_date: daysAgo(7) }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.overdue_count).toBe(3);
    });
  });

  describe("by_maintenance_type breakdown", () => {
    it("counts each maintenance type separately", () => {
      const records = [
        makeRecord({ maintenance_type: "repair_request" }),
        makeRecord({ maintenance_type: "repair_request" }),
        makeRecord({ maintenance_type: "pat_testing" }),
        makeRecord({ maintenance_type: "gas_safety" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.by_maintenance_type).toEqual({ repair_request: 2, pat_testing: 1, gas_safety: 1 });
    });

    it("handles all ten maintenance types", () => {
      const types: MaintenanceType[] = ["repair_request", "planned_maintenance", "pat_testing", "gas_safety", "electrical_inspection", "plumbing", "decorating", "garden_grounds", "appliance_repair", "other"];
      const records = types.map((t) => makeRecord({ maintenance_type: t }));
      const m = computeMaintenanceMetrics(records);
      for (const t of types) {
        expect(m.by_maintenance_type[t]).toBe(1);
      }
    });
  });

  describe("by_priority breakdown", () => {
    it("counts each priority separately", () => {
      const records = [
        makeRecord({ priority: "emergency" }),
        makeRecord({ priority: "emergency" }),
        makeRecord({ priority: "urgent" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.by_priority).toEqual({ emergency: 2, urgent: 1 });
    });

    it("handles all five priorities", () => {
      const priorities: MaintenancePriority[] = ["emergency", "urgent", "routine", "low", "planned"];
      const records = priorities.map((p) => makeRecord({ priority: p }));
      const m = computeMaintenanceMetrics(records);
      for (const p of priorities) {
        expect(m.by_priority[p]).toBe(1);
      }
    });
  });

  describe("by_status breakdown", () => {
    it("counts each status separately", () => {
      const records = [
        makeRecord({ status: "reported" }),
        makeRecord({ status: "reported" }),
        makeRecord({ status: "completed" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.by_status).toEqual({ reported: 2, completed: 1 });
    });

    it("handles all six statuses", () => {
      const statuses: MaintenanceStatus[] = ["reported", "acknowledged", "in_progress", "awaiting_parts", "completed", "cancelled"];
      const records = statuses.map((s) => makeRecord({ status: s }));
      const m = computeMaintenanceMetrics(records);
      for (const s of statuses) {
        expect(m.by_status[s]).toBe(1);
      }
    });
  });

  describe("by_contractor_status breakdown", () => {
    it("counts each contractor status separately", () => {
      const records = [
        makeRecord({ contractor_status: "approved" }),
        makeRecord({ contractor_status: "approved" }),
        makeRecord({ contractor_status: "pending_approval" }),
      ];
      const m = computeMaintenanceMetrics(records);
      expect(m.by_contractor_status).toEqual({ approved: 2, pending_approval: 1 });
    });

    it("handles all five contractor statuses", () => {
      const statuses: ContractorStatus[] = ["approved", "pending_approval", "dbs_checked", "not_required", "rejected"];
      const records = statuses.map((s) => makeRecord({ contractor_status: s }));
      const m = computeMaintenanceMetrics(records);
      for (const s of statuses) {
        expect(m.by_contractor_status[s]).toBe(1);
      }
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: MaintenanceRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            maintenance_type: i % 3 === 0 ? "repair_request" : i % 3 === 1 ? "planned_maintenance" : "pat_testing",
            status: "completed",
            priority: "routine",
            contractor_used: true,
            children_impact_assessed: true,
            safeguarding_check_completed: true,
            certificate_obtained: true,
            cost: 10,
            days_to_completion: 5,
          }),
        );
      }
      const m = computeMaintenanceMetrics(records);
      expect(m.total_records).toBe(100);
      expect(m.completion_rate).toBe(100);
      expect(m.contractor_used_rate).toBe(100);
      expect(m.children_impact_assessed_rate).toBe(100);
      expect(m.safeguarding_check_rate).toBe(100);
      expect(m.certificate_obtained_rate).toBe(100);
      expect(m.total_cost).toBe(1000);
      expect(m.average_days_to_completion).toBe(5);
      // repair_request: i%3===0 => 34, planned_maintenance: i%3===1 => 33, pat_testing: i%3===2 => 33
      expect(m.repair_request_count).toBe(34);
      expect(m.planned_maintenance_count).toBe(33);
      expect(m.pat_testing_count).toBe(33);
    });
  });
});

// ── identifyMaintenanceAlerts ────────────────────────────────────────────

describe("identifyMaintenanceAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyMaintenanceAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          priority: "routine",
          status: "completed",
          contractor_used: false,
          children_impact_assessed: true,
          safeguarding_check_completed: true,
          next_due_date: daysFromNow(30),
        }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty for completed emergency (no outstanding)", () => {
      const records = [
        makeRecord({
          priority: "emergency",
          status: "completed",
        }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeUndefined();
    });

    it("returns empty for cancelled emergency (no outstanding)", () => {
      const records = [
        makeRecord({
          priority: "emergency",
          status: "cancelled",
        }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeUndefined();
    });
  });

  describe("emergency_outstanding alert", () => {
    it("fires for emergency priority with reported status", () => {
      const records = [makeRecord({ priority: "emergency", status: "reported", description: "Broken boiler", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeDefined();
    });

    it("fires for emergency priority with in_progress status", () => {
      const records = [makeRecord({ priority: "emergency", status: "in_progress", description: "Gas leak", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeDefined();
    });

    it("fires for emergency priority with acknowledged status", () => {
      const records = [makeRecord({ priority: "emergency", status: "acknowledged", description: "Flood", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeDefined();
    });

    it("fires for emergency priority with awaiting_parts status", () => {
      const records = [makeRecord({ priority: "emergency", status: "awaiting_parts", description: "Electric fault", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ priority: "emergency", status: "reported", description: "Broken boiler", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "em-1", priority: "emergency", status: "reported", description: "Leak", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding")!;
      expect(alert.id).toBe("em-1");
    });

    it("includes description in message", () => {
      const records = [makeRecord({ priority: "emergency", status: "reported", description: "Broken window", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding")!;
      expect(alert.message).toContain("Broken window");
    });

    it("includes reported_date in message", () => {
      const records = [makeRecord({ priority: "emergency", status: "reported", description: "Leak", reported_date: "2026-04-15" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding")!;
      expect(alert.message).toContain("2026-04-15");
    });

    it("fires per record for multiple emergencies", () => {
      const records = [
        makeRecord({ priority: "emergency", status: "reported", description: "Issue A", reported_date: "2026-05-01" }),
        makeRecord({ priority: "emergency", status: "in_progress", description: "Issue B", reported_date: "2026-04-01" }),
        makeRecord({ priority: "emergency", status: "acknowledged", description: "Issue C", reported_date: "2026-03-01" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const emergencyAlerts = alerts.filter((a) => a.type === "emergency_outstanding");
      expect(emergencyAlerts).toHaveLength(3);
    });

    it("does not fire for completed emergency", () => {
      const records = [makeRecord({ priority: "emergency", status: "completed" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeUndefined();
    });

    it("does not fire for cancelled emergency", () => {
      const records = [makeRecord({ priority: "emergency", status: "cancelled" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeUndefined();
    });

    it("does not fire for urgent priority", () => {
      const records = [makeRecord({ priority: "urgent", status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeUndefined();
    });

    it("does not fire for routine priority", () => {
      const records = [makeRecord({ priority: "routine", status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeUndefined();
    });

    it("message contains resolve immediately wording", () => {
      const records = [makeRecord({ priority: "emergency", status: "reported", description: "Leak", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding")!;
      expect(alert.message).toContain("resolve immediately");
    });
  });

  describe("contractor_no_safeguarding alert", () => {
    it("fires for contractor used without safeguarding check", () => {
      const records = [makeRecord({ contractor_used: true, safeguarding_check_completed: false, status: "reported", contractor_name: "ABC Plumbing", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ contractor_used: true, safeguarding_check_completed: false, status: "reported", contractor_name: "ABC Plumbing", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "ctr-1", contractor_used: true, safeguarding_check_completed: false, status: "reported", contractor_name: "XYZ", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding")!;
      expect(alert.id).toBe("ctr-1");
    });

    it("includes contractor_name in message", () => {
      const records = [makeRecord({ contractor_used: true, safeguarding_check_completed: false, status: "reported", contractor_name: "Fix-It Ltd", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding")!;
      expect(alert.message).toContain("Fix-It Ltd");
    });

    it("uses 'unknown' when contractor_name is null", () => {
      const records = [makeRecord({ contractor_used: true, safeguarding_check_completed: false, status: "reported", contractor_name: null, reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding")!;
      expect(alert.message).toContain("unknown");
    });

    it("includes reported_date in message", () => {
      const records = [makeRecord({ contractor_used: true, safeguarding_check_completed: false, status: "reported", contractor_name: "ABC", reported_date: "2026-03-20" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding")!;
      expect(alert.message).toContain("2026-03-20");
    });

    it("fires per record for multiple contractors without safeguarding", () => {
      const records = [
        makeRecord({ contractor_used: true, safeguarding_check_completed: false, status: "reported", contractor_name: "A", reported_date: "2026-05-01" }),
        makeRecord({ contractor_used: true, safeguarding_check_completed: false, status: "in_progress", contractor_name: "B", reported_date: "2026-04-01" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const ctrAlerts = alerts.filter((a) => a.type === "contractor_no_safeguarding");
      expect(ctrAlerts).toHaveLength(2);
    });

    it("does not fire when contractor_used is false", () => {
      const records = [makeRecord({ contractor_used: false, safeguarding_check_completed: false, status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding");
      expect(alert).toBeUndefined();
    });

    it("does not fire when safeguarding_check_completed is true", () => {
      const records = [makeRecord({ contractor_used: true, safeguarding_check_completed: true, status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding");
      expect(alert).toBeUndefined();
    });

    it("does not fire for cancelled status", () => {
      const records = [makeRecord({ contractor_used: true, safeguarding_check_completed: false, status: "cancelled" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding");
      expect(alert).toBeUndefined();
    });

    it("fires for completed status (contractor was used without check)", () => {
      const records = [makeRecord({ contractor_used: true, safeguarding_check_completed: false, status: "completed", contractor_name: "ABC", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding");
      expect(alert).toBeDefined();
    });
  });

  describe("urgent_outstanding alert", () => {
    it("fires when >= 1 urgent repair is outstanding", () => {
      const records = [makeRecord({ priority: "urgent", status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ priority: "urgent", status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding")!;
      expect(alert.severity).toBe("high");
    });

    it("has id urgent_outstanding", () => {
      const records = [makeRecord({ priority: "urgent", status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding")!;
      expect(alert.id).toBe("urgent_outstanding");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ priority: "urgent", status: "reported" }),
        makeRecord({ priority: "urgent", status: "in_progress" }),
        makeRecord({ priority: "urgent", status: "acknowledged" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding")!;
      expect(alert.message).toContain("3");
    });

    it("uses singular 'repair' for 1 outstanding", () => {
      const records = [makeRecord({ priority: "urgent", status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding")!;
      expect(alert.message).toContain("1 urgent repair");
      expect(alert.message).not.toContain("1 urgent repairs");
    });

    it("uses plural 'repairs' for multiple outstanding", () => {
      const records = [
        makeRecord({ priority: "urgent", status: "reported" }),
        makeRecord({ priority: "urgent", status: "in_progress" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding")!;
      expect(alert.message).toContain("2 urgent repairs");
    });

    it("does not fire when all urgent are completed", () => {
      const records = [
        makeRecord({ priority: "urgent", status: "completed" }),
        makeRecord({ priority: "urgent", status: "completed" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all urgent are cancelled", () => {
      const records = [
        makeRecord({ priority: "urgent", status: "cancelled" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding");
      expect(alert).toBeUndefined();
    });

    it("does not fire when no urgent records", () => {
      const records = [
        makeRecord({ priority: "routine", status: "reported" }),
        makeRecord({ priority: "low", status: "reported" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ priority: "urgent", status: "reported" }),
        makeRecord({ priority: "urgent", status: "in_progress" }),
        makeRecord({ priority: "urgent", status: "acknowledged" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const urgentAlerts = alerts.filter((a) => a.type === "urgent_outstanding");
      expect(urgentAlerts).toHaveLength(1);
    });

    it("message contains prioritise completion wording", () => {
      const records = [makeRecord({ priority: "urgent", status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding")!;
      expect(alert.message).toContain("prioritise completion");
    });

    it("excludes completed from count", () => {
      const records = [
        makeRecord({ priority: "urgent", status: "reported" }),
        makeRecord({ priority: "urgent", status: "completed" }),
        makeRecord({ priority: "urgent", status: "in_progress" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding")!;
      expect(alert.message).toContain("2 urgent repairs");
    });

    it("excludes cancelled from count", () => {
      const records = [
        makeRecord({ priority: "urgent", status: "reported" }),
        makeRecord({ priority: "urgent", status: "cancelled" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding")!;
      expect(alert.message).toContain("1 urgent repair");
    });
  });

  describe("no_impact_assessment alert", () => {
    it("fires when >= 3 records lack impact assessment", () => {
      const records = [
        makeRecord({ children_impact_assessed: false, status: "reported" }),
        makeRecord({ children_impact_assessed: false, status: "in_progress" }),
        makeRecord({ children_impact_assessed: false, status: "acknowledged" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_impact_assessment");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [
        makeRecord({ children_impact_assessed: false, status: "reported" }),
        makeRecord({ children_impact_assessed: false, status: "in_progress" }),
        makeRecord({ children_impact_assessed: false, status: "acknowledged" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_impact_assessment")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id no_impact_assessment", () => {
      const records = [
        makeRecord({ children_impact_assessed: false, status: "reported" }),
        makeRecord({ children_impact_assessed: false, status: "in_progress" }),
        makeRecord({ children_impact_assessed: false, status: "acknowledged" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_impact_assessment")!;
      expect(alert.id).toBe("no_impact_assessment");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ children_impact_assessed: false, status: "reported" }),
        makeRecord({ children_impact_assessed: false, status: "in_progress" }),
        makeRecord({ children_impact_assessed: false, status: "acknowledged" }),
        makeRecord({ children_impact_assessed: false, status: "awaiting_parts" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_impact_assessment")!;
      expect(alert.message).toContain("4");
    });

    it("does not fire when fewer than 3 records lack assessment", () => {
      const records = [
        makeRecord({ children_impact_assessed: false, status: "reported" }),
        makeRecord({ children_impact_assessed: false, status: "in_progress" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_impact_assessment");
      expect(alert).toBeUndefined();
    });

    it("fires at exactly threshold of 3", () => {
      const records = [
        makeRecord({ children_impact_assessed: false, status: "reported" }),
        makeRecord({ children_impact_assessed: false, status: "in_progress" }),
        makeRecord({ children_impact_assessed: false, status: "acknowledged" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_impact_assessment");
      expect(alert).toBeDefined();
    });

    it("does not fire when all have impact assessment", () => {
      const records = [
        makeRecord({ children_impact_assessed: true, status: "reported" }),
        makeRecord({ children_impact_assessed: true, status: "in_progress" }),
        makeRecord({ children_impact_assessed: true, status: "acknowledged" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_impact_assessment");
      expect(alert).toBeUndefined();
    });

    it("excludes cancelled records from count", () => {
      const records = [
        makeRecord({ children_impact_assessed: false, status: "reported" }),
        makeRecord({ children_impact_assessed: false, status: "in_progress" }),
        makeRecord({ children_impact_assessed: false, status: "cancelled" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_impact_assessment");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert", () => {
      const records = [
        makeRecord({ children_impact_assessed: false, status: "reported" }),
        makeRecord({ children_impact_assessed: false, status: "in_progress" }),
        makeRecord({ children_impact_assessed: false, status: "acknowledged" }),
        makeRecord({ children_impact_assessed: false, status: "awaiting_parts" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const noImpactAlerts = alerts.filter((a) => a.type === "no_impact_assessment");
      expect(noImpactAlerts).toHaveLength(1);
    });

    it("message contains ensure safety considered wording", () => {
      const records = [
        makeRecord({ children_impact_assessed: false, status: "reported" }),
        makeRecord({ children_impact_assessed: false, status: "in_progress" }),
        makeRecord({ children_impact_assessed: false, status: "acknowledged" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_impact_assessment")!;
      expect(alert.message).toContain("ensure safety considered");
    });

    it("includes completed-but-not-assessed records in count", () => {
      const records = [
        makeRecord({ children_impact_assessed: false, status: "completed" }),
        makeRecord({ children_impact_assessed: false, status: "reported" }),
        makeRecord({ children_impact_assessed: false, status: "in_progress" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_impact_assessment")!;
      expect(alert.message).toContain("3");
    });
  });

  describe("maintenance_overdue alert", () => {
    it("fires when >= 1 maintenance is overdue", () => {
      const records = [makeRecord({ next_due_date: daysAgo(5) })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ next_due_date: daysAgo(5) })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id maintenance_overdue", () => {
      const records = [makeRecord({ next_due_date: daysAgo(5) })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue")!;
      expect(alert.id).toBe("maintenance_overdue");
    });

    it("uses singular 'item is' for 1 overdue", () => {
      const records = [makeRecord({ next_due_date: daysAgo(5) })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue")!;
      expect(alert.message).toContain("1 planned maintenance item is overdue");
    });

    it("uses plural 'items are' for multiple overdue", () => {
      const records = [
        makeRecord({ next_due_date: daysAgo(5) }),
        makeRecord({ next_due_date: daysAgo(10) }),
        makeRecord({ next_due_date: daysAgo(15) }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue")!;
      expect(alert.message).toContain("3 planned maintenance items are overdue");
    });

    it("does not fire when all future", () => {
      const records = [
        makeRecord({ next_due_date: daysFromNow(10) }),
        makeRecord({ next_due_date: daysFromNow(20) }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all null", () => {
      const records = [
        makeRecord({ next_due_date: null }),
        makeRecord({ next_due_date: null }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert", () => {
      const records = [
        makeRecord({ next_due_date: daysAgo(5) }),
        makeRecord({ next_due_date: daysAgo(10) }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const overdueAlerts = alerts.filter((a) => a.type === "maintenance_overdue");
      expect(overdueAlerts).toHaveLength(1);
    });

    it("message contains schedule promptly wording", () => {
      const records = [makeRecord({ next_due_date: daysAgo(5) })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue")!;
      expect(alert.message).toContain("schedule promptly");
    });

    it("counts only overdue, not future or null", () => {
      const records = [
        makeRecord({ next_due_date: daysAgo(5) }),
        makeRecord({ next_due_date: daysFromNow(10) }),
        makeRecord({ next_due_date: null }),
        makeRecord({ next_due_date: daysAgo(15) }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue")!;
      expect(alert.message).toContain("2 planned maintenance items are overdue");
    });

    it("fires at exactly threshold of 1", () => {
      const records = [makeRecord({ next_due_date: daysAgo(1) })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue");
      expect(alert).toBeDefined();
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        makeRecord({ id: "r1", priority: "emergency", status: "reported", description: "Major issue", reported_date: "2026-05-01", contractor_used: true, safeguarding_check_completed: false, contractor_name: "ABC", children_impact_assessed: false, next_due_date: daysAgo(5) }),
        makeRecord({ id: "r2", priority: "urgent", status: "reported", children_impact_assessed: false }),
        makeRecord({ id: "r3", priority: "routine", status: "reported", children_impact_assessed: false }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("emergency_outstanding");
      expect(types).toContain("contractor_no_safeguarding");
      expect(types).toContain("urgent_outstanding");
      expect(types).toContain("no_impact_assessment");
      expect(types).toContain("maintenance_overdue");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({ priority: "emergency", status: "reported", description: "Major issue", reported_date: "2026-05-01", contractor_used: true, safeguarding_check_completed: false, contractor_name: "ABC", children_impact_assessed: false, next_due_date: daysAgo(5) }),
        makeRecord({ priority: "urgent", status: "reported", children_impact_assessed: false }),
        makeRecord({ priority: "routine", status: "reported", children_impact_assessed: false }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      // emergency_outstanding=1, contractor_no_safeguarding=1, urgent_outstanding=1, no_impact_assessment=1, maintenance_overdue=1
      expect(alerts).toHaveLength(5);
    });

    it("per-record alerts multiply while threshold alerts stay singular", () => {
      const records = [
        makeRecord({ priority: "emergency", status: "reported", description: "Issue A", reported_date: "2026-05-01", contractor_used: true, safeguarding_check_completed: false, contractor_name: "ABC", children_impact_assessed: false, next_due_date: daysAgo(5) }),
        makeRecord({ priority: "emergency", status: "in_progress", description: "Issue B", reported_date: "2026-04-01", contractor_used: true, safeguarding_check_completed: false, contractor_name: "DEF", children_impact_assessed: false, next_due_date: daysAgo(10) }),
        makeRecord({ priority: "urgent", status: "reported", children_impact_assessed: false }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      expect(alerts.filter((a) => a.type === "emergency_outstanding")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "contractor_no_safeguarding")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "urgent_outstanding")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "no_impact_assessment")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "maintenance_overdue")).toHaveLength(1);
    });

    it("emergency alert appears without other alert types when only emergency present", () => {
      const records = [
        makeRecord({ priority: "emergency", status: "reported", description: "Gas leak", reported_date: "2026-05-01", contractor_used: false, children_impact_assessed: true, safeguarding_check_completed: true }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("emergency_outstanding");
    });

    it("contractor_no_safeguarding alert appears without other alert types", () => {
      const records = [
        makeRecord({ priority: "routine", status: "reported", contractor_used: true, safeguarding_check_completed: false, contractor_name: "ABC", reported_date: "2026-05-01", children_impact_assessed: true }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("contractor_no_safeguarding");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ priority: "emergency", status: "reported", description: "Issue", reported_date: "2026-05-01" }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ priority: "emergency", status: "reported", description: "Issue", reported_date: "2026-05-01", contractor_used: true, safeguarding_check_completed: false, contractor_name: "ABC", children_impact_assessed: false, next_due_date: daysAgo(5) }),
        makeRecord({ priority: "urgent", status: "reported", children_impact_assessed: false }),
        makeRecord({ priority: "routine", status: "reported", children_impact_assessed: false }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ priority: "emergency", status: "reported", description: "Issue", reported_date: "2026-05-01" })];
      const alerts = identifyMaintenanceAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });

    it("id is always a non-empty string", () => {
      const records = [
        makeRecord({ priority: "emergency", status: "reported", description: "Issue", reported_date: "2026-05-01", contractor_used: true, safeguarding_check_completed: false, contractor_name: "ABC", children_impact_assessed: false, next_due_date: daysAgo(5) }),
        makeRecord({ priority: "urgent", status: "reported", children_impact_assessed: false }),
        makeRecord({ priority: "routine", status: "reported", children_impact_assessed: false }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.id).toBe("string");
        expect(alert.id.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("routine priority does not trigger emergency_outstanding", () => {
      const records = [makeRecord({ priority: "routine", status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_outstanding");
      expect(alert).toBeUndefined();
    });

    it("contractor with safeguarding check does not trigger contractor_no_safeguarding", () => {
      const records = [makeRecord({ contractor_used: true, safeguarding_check_completed: true, status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "contractor_no_safeguarding");
      expect(alert).toBeUndefined();
    });

    it("fully clean records trigger no alerts", () => {
      const records = [
        makeRecord({
          priority: "routine",
          status: "completed",
          contractor_used: false,
          children_impact_assessed: true,
          safeguarding_check_completed: true,
          next_due_date: daysFromNow(30),
        }),
      ];
      const alerts = identifyMaintenanceAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("low priority does not trigger urgent_outstanding", () => {
      const records = [makeRecord({ priority: "low", status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding");
      expect(alert).toBeUndefined();
    });

    it("planned priority does not trigger urgent_outstanding", () => {
      const records = [makeRecord({ priority: "planned", status: "reported" })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "urgent_outstanding");
      expect(alert).toBeUndefined();
    });

    it("null next_due_date does not trigger maintenance_overdue", () => {
      const records = [makeRecord({ next_due_date: null })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue");
      expect(alert).toBeUndefined();
    });

    it("future next_due_date does not trigger maintenance_overdue", () => {
      const records = [makeRecord({ next_due_date: daysFromNow(30) })];
      const alerts = identifyMaintenanceAlerts(records);
      const alert = alerts.find((a) => a.type === "maintenance_overdue");
      expect(alert).toBeUndefined();
    });
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRecord factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRecord();
    expect(r.home_id).toBe("home-1");
    expect(r.maintenance_type).toBe("repair_request");
    expect(r.reported_date).toBe("2026-05-01");
    expect(r.completed_date).toBeNull();
    expect(r.priority).toBe("routine");
    expect(r.status).toBe("reported");
    expect(r.description).toBe("General repair");
    expect(r.location).toBe("Main building");
    expect(r.contractor_used).toBe(false);
    expect(r.contractor_name).toBeNull();
    expect(r.contractor_status).toBe("not_required");
    expect(r.cost).toBeNull();
    expect(r.children_impact_assessed).toBe(true);
    expect(r.safeguarding_check_completed).toBe(true);
    expect(r.certificate_obtained).toBe(false);
    expect(r.days_to_completion).toBeNull();
    expect(r.reported_by).toBe("Staff Member");
    expect(r.completed_by).toBeNull();
    expect(r.issues_found).toEqual([]);
    expect(r.actions_taken).toEqual([]);
    expect(r.next_due_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ maintenance_type: "pat_testing", priority: "emergency" });
    expect(r.maintenance_type).toBe("pat_testing");
    expect(r.priority).toBe("emergency");
    // defaults still apply
    expect(r.status).toBe("reported");
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
    const r = makeRecord({ completed_date: null, contractor_name: null, cost: null, days_to_completion: null, completed_by: null, next_due_date: null, notes: null });
    expect(r.completed_date).toBeNull();
    expect(r.contractor_name).toBeNull();
    expect(r.cost).toBeNull();
    expect(r.days_to_completion).toBeNull();
    expect(r.completed_by).toBeNull();
    expect(r.next_due_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting notes to a string", () => {
    const r = makeRecord({ notes: "Test note" });
    expect(r.notes).toBe("Test note");
  });

  it("allows setting next_due_date to a date string", () => {
    const r = makeRecord({ next_due_date: "2026-12-31" });
    expect(r.next_due_date).toBe("2026-12-31");
  });

  it("allows setting issues_found array", () => {
    const r = makeRecord({ issues_found: ["broken pipe", "cracked tile"] });
    expect(r.issues_found).toEqual(["broken pipe", "cracked tile"]);
  });

  it("allows setting actions_taken array", () => {
    const r = makeRecord({ actions_taken: ["replaced pipe", "applied sealant"] });
    expect(r.actions_taken).toEqual(["replaced pipe", "applied sealant"]);
  });

  it("allows setting cost to a number", () => {
    const r = makeRecord({ cost: 250.75 });
    expect(r.cost).toBe(250.75);
  });

  it("allows setting days_to_completion to a number", () => {
    const r = makeRecord({ days_to_completion: 14 });
    expect(r.days_to_completion).toBe(14);
  });

  it("allows setting completed_date to a string", () => {
    const r = makeRecord({ completed_date: "2026-06-15" });
    expect(r.completed_date).toBe("2026-06-15");
  });

  it("allows setting completed_by to a string", () => {
    const r = makeRecord({ completed_by: "John Smith" });
    expect(r.completed_by).toBe("John Smith");
  });

  it("allows setting contractor_name to a string", () => {
    const r = makeRecord({ contractor_name: "ABC Plumbing" });
    expect(r.contractor_name).toBe("ABC Plumbing");
  });
});
