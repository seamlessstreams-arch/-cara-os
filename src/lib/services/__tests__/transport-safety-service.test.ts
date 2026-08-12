// ══════════════════════════════════════════════════════════════════════════════
// CARA — TRANSPORT SAFETY SERVICE TESTS
// Pure-function tests for transport safety metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";

import {
  TRANSPORT_EVENT_TYPES,
  VEHICLE_STATUSES,
  JOURNEY_PURPOSES,
  DRIVER_COMPLIANCE_STATUSES,
  _testing,
} from "../transport-safety-service";

import type {
  TransportRecord,
  TransportEventType,
  VehicleStatus,
  JourneyPurpose,
  DriverCompliance,
} from "../transport-safety-service";

const { computeTransportMetrics, identifyTransportAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<TransportRecord>,
): TransportRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    event_type: "event_type" in (overrides ?? {}) ? overrides!.event_type! : "journey_log",
    event_date: "event_date" in (overrides ?? {}) ? overrides!.event_date! : "2026-05-01",
    vehicle_registration: "vehicle_registration" in (overrides ?? {}) ? overrides!.vehicle_registration! : "AB12 CDE",
    vehicle_status: "vehicle_status" in (overrides ?? {}) ? overrides!.vehicle_status! : "roadworthy",
    journey_purpose: "journey_purpose" in (overrides ?? {}) ? (overrides!.journey_purpose ?? null) : "school_run",
    driver_name: "driver_name" in (overrides ?? {}) ? overrides!.driver_name! : "John Smith",
    driver_compliance: "driver_compliance" in (overrides ?? {}) ? overrides!.driver_compliance! : "fully_compliant",
    children_transported: "children_transported" in (overrides ?? {}) ? overrides!.children_transported! : ["child-1", "child-2"],
    seatbelts_checked: "seatbelts_checked" in (overrides ?? {}) ? overrides!.seatbelts_checked! : true,
    child_locks_engaged: "child_locks_engaged" in (overrides ?? {}) ? overrides!.child_locks_engaged! : true,
    risk_assessment_completed: "risk_assessment_completed" in (overrides ?? {}) ? overrides!.risk_assessment_completed! : true,
    insurance_valid: "insurance_valid" in (overrides ?? {}) ? overrides!.insurance_valid! : true,
    mot_valid: "mot_valid" in (overrides ?? {}) ? overrides!.mot_valid! : true,
    mileage: "mileage" in (overrides ?? {}) ? (overrides!.mileage ?? null) : 15000,
    issues_identified: "issues_identified" in (overrides ?? {}) ? overrides!.issues_identified! : [],
    actions_taken: "actions_taken" in (overrides ?? {}) ? overrides!.actions_taken! : [],
    conducted_by: "conducted_by" in (overrides ?? {}) ? overrides!.conducted_by! : "Manager",
    next_check_date: "next_check_date" in (overrides ?? {}) ? (overrides!.next_check_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

/** Return an ISO date string for N days ago from now */
function daysAgo(n: number): string {
  const d = new Date(todayStr());
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Return an ISO date string for N days in the future from now */
function daysFromNow(n: number): string {
  const d = new Date(todayStr());
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("TRANSPORT_EVENT_TYPES", () => {
    it("has exactly 9 items", () => {
      expect(TRANSPORT_EVENT_TYPES).toHaveLength(9);
    });

    it("contains vehicle_inspection", () => {
      expect(TRANSPORT_EVENT_TYPES).toContainEqual({ type: "vehicle_inspection", label: "Vehicle Inspection" });
    });

    it("contains journey_log", () => {
      expect(TRANSPORT_EVENT_TYPES).toContainEqual({ type: "journey_log", label: "Journey Log" });
    });

    it("contains driver_check", () => {
      expect(TRANSPORT_EVENT_TYPES).toContainEqual({ type: "driver_check", label: "Driver Check" });
    });

    it("contains risk_assessment", () => {
      expect(TRANSPORT_EVENT_TYPES).toContainEqual({ type: "risk_assessment", label: "Risk Assessment" });
    });

    it("contains incident", () => {
      expect(TRANSPORT_EVENT_TYPES).toContainEqual({ type: "incident", label: "Incident" });
    });

    it("contains maintenance", () => {
      expect(TRANSPORT_EVENT_TYPES).toContainEqual({ type: "maintenance", label: "Maintenance" });
    });

    it("contains insurance_renewal", () => {
      expect(TRANSPORT_EVENT_TYPES).toContainEqual({ type: "insurance_renewal", label: "Insurance Renewal" });
    });

    it("contains mot_check", () => {
      expect(TRANSPORT_EVENT_TYPES).toContainEqual({ type: "mot_check", label: "MOT Check" });
    });

    it("contains other", () => {
      expect(TRANSPORT_EVENT_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = TRANSPORT_EVENT_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = TRANSPORT_EVENT_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of TRANSPORT_EVENT_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("VEHICLE_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(VEHICLE_STATUSES).toHaveLength(5);
    });

    it("contains roadworthy", () => {
      expect(VEHICLE_STATUSES).toContainEqual({ status: "roadworthy", label: "Roadworthy" });
    });

    it("contains minor_defects", () => {
      expect(VEHICLE_STATUSES).toContainEqual({ status: "minor_defects", label: "Minor Defects" });
    });

    it("contains major_defects", () => {
      expect(VEHICLE_STATUSES).toContainEqual({ status: "major_defects", label: "Major Defects" });
    });

    it("contains off_road", () => {
      expect(VEHICLE_STATUSES).toContainEqual({ status: "off_road", label: "Off Road" });
    });

    it("contains not_checked", () => {
      expect(VEHICLE_STATUSES).toContainEqual({ status: "not_checked", label: "Not Checked" });
    });

    it("has unique status values", () => {
      const statuses = VEHICLE_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = VEHICLE_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of VEHICLE_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("JOURNEY_PURPOSES", () => {
    it("has exactly 8 items", () => {
      expect(JOURNEY_PURPOSES).toHaveLength(8);
    });

    it("contains school_run", () => {
      expect(JOURNEY_PURPOSES).toContainEqual({ purpose: "school_run", label: "School Run" });
    });

    it("contains medical_appointment", () => {
      expect(JOURNEY_PURPOSES).toContainEqual({ purpose: "medical_appointment", label: "Medical Appointment" });
    });

    it("contains contact_visit", () => {
      expect(JOURNEY_PURPOSES).toContainEqual({ purpose: "contact_visit", label: "Contact Visit" });
    });

    it("contains activity_outing", () => {
      expect(JOURNEY_PURPOSES).toContainEqual({ purpose: "activity_outing", label: "Activity/Outing" });
    });

    it("contains court_hearing", () => {
      expect(JOURNEY_PURPOSES).toContainEqual({ purpose: "court_hearing", label: "Court Hearing" });
    });

    it("contains emergency", () => {
      expect(JOURNEY_PURPOSES).toContainEqual({ purpose: "emergency", label: "Emergency" });
    });

    it("contains shopping", () => {
      expect(JOURNEY_PURPOSES).toContainEqual({ purpose: "shopping", label: "Shopping" });
    });

    it("contains other", () => {
      expect(JOURNEY_PURPOSES).toContainEqual({ purpose: "other", label: "Other" });
    });

    it("has unique purpose values", () => {
      const purposes = JOURNEY_PURPOSES.map((p) => p.purpose);
      expect(new Set(purposes).size).toBe(purposes.length);
    });

    it("has unique labels", () => {
      const labels = JOURNEY_PURPOSES.map((p) => p.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of JOURNEY_PURPOSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("DRIVER_COMPLIANCE_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(DRIVER_COMPLIANCE_STATUSES).toHaveLength(5);
    });

    it("contains fully_compliant", () => {
      expect(DRIVER_COMPLIANCE_STATUSES).toContainEqual({ compliance: "fully_compliant", label: "Fully Compliant" });
    });

    it("contains licence_expiring", () => {
      expect(DRIVER_COMPLIANCE_STATUSES).toContainEqual({ compliance: "licence_expiring", label: "Licence Expiring" });
    });

    it("contains insurance_issue", () => {
      expect(DRIVER_COMPLIANCE_STATUSES).toContainEqual({ compliance: "insurance_issue", label: "Insurance Issue" });
    });

    it("contains not_checked", () => {
      expect(DRIVER_COMPLIANCE_STATUSES).toContainEqual({ compliance: "not_checked", label: "Not Checked" });
    });

    it("contains non_compliant", () => {
      expect(DRIVER_COMPLIANCE_STATUSES).toContainEqual({ compliance: "non_compliant", label: "Non-Compliant" });
    });

    it("has unique compliance values", () => {
      const compliances = DRIVER_COMPLIANCE_STATUSES.map((c) => c.compliance);
      expect(new Set(compliances).size).toBe(compliances.length);
    });

    it("has unique labels", () => {
      const labels = DRIVER_COMPLIANCE_STATUSES.map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of DRIVER_COMPLIANCE_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeTransportMetrics ────────────────────────────────────────────────

describe("computeTransportMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_records", () => {
      const m = computeTransportMetrics([]);
      expect(m.total_records).toBe(0);
    });

    it("returns zero journey_count", () => {
      const m = computeTransportMetrics([]);
      expect(m.journey_count).toBe(0);
    });

    it("returns zero inspection_count", () => {
      const m = computeTransportMetrics([]);
      expect(m.inspection_count).toBe(0);
    });

    it("returns zero incident_count", () => {
      const m = computeTransportMetrics([]);
      expect(m.incident_count).toBe(0);
    });

    it("returns zero roadworthy_rate", () => {
      const m = computeTransportMetrics([]);
      expect(m.roadworthy_rate).toBeNull();;
    });

    it("returns zero major_defects_count", () => {
      const m = computeTransportMetrics([]);
      expect(m.major_defects_count).toBe(0);
    });

    it("returns zero driver_compliant_rate", () => {
      const m = computeTransportMetrics([]);
      expect(m.driver_compliant_rate).toBeNull();;
    });

    it("returns zero non_compliant_driver_count", () => {
      const m = computeTransportMetrics([]);
      expect(m.non_compliant_driver_count).toBe(0);
    });

    it("returns zero seatbelts_checked_rate", () => {
      const m = computeTransportMetrics([]);
      expect(m.seatbelts_checked_rate).toBeNull();;
    });

    it("returns zero child_locks_rate", () => {
      const m = computeTransportMetrics([]);
      expect(m.child_locks_rate).toBeNull();;
    });

    it("returns zero risk_assessment_rate", () => {
      const m = computeTransportMetrics([]);
      expect(m.risk_assessment_rate).toBeNull();;
    });

    it("returns zero insurance_valid_rate", () => {
      const m = computeTransportMetrics([]);
      expect(m.insurance_valid_rate).toBeNull();;
    });

    it("returns zero mot_valid_rate", () => {
      const m = computeTransportMetrics([]);
      expect(m.mot_valid_rate).toBeNull();;
    });

    it("returns zero children_transported_count", () => {
      const m = computeTransportMetrics([]);
      expect(m.children_transported_count).toBe(0);
    });

    it("returns zero check_overdue_count", () => {
      const m = computeTransportMetrics([]);
      expect(m.check_overdue_count).toBe(0);
    });

    it("returns empty by_event_type", () => {
      const m = computeTransportMetrics([]);
      expect(m.by_event_type).toEqual({});
    });

    it("returns empty by_vehicle_status", () => {
      const m = computeTransportMetrics([]);
      expect(m.by_vehicle_status).toEqual({});
    });

    it("returns empty by_journey_purpose", () => {
      const m = computeTransportMetrics([]);
      expect(m.by_journey_purpose).toEqual({});
    });

    it("returns empty by_driver_compliance", () => {
      const m = computeTransportMetrics([]);
      expect(m.by_driver_compliance).toEqual({});
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      event_type: "journey_log",
      vehicle_status: "roadworthy",
      driver_compliance: "fully_compliant",
      seatbelts_checked: true,
      child_locks_engaged: true,
      risk_assessment_completed: true,
      insurance_valid: true,
      mot_valid: true,
      children_transported: ["child-1", "child-2"],
      journey_purpose: "school_run",
    });

    it("returns total_records = 1", () => {
      const m = computeTransportMetrics([record]);
      expect(m.total_records).toBe(1);
    });

    it("returns journey_count = 1", () => {
      const m = computeTransportMetrics([record]);
      expect(m.journey_count).toBe(1);
    });

    it("returns inspection_count = 0", () => {
      const m = computeTransportMetrics([record]);
      expect(m.inspection_count).toBe(0);
    });

    it("returns incident_count = 0", () => {
      const m = computeTransportMetrics([record]);
      expect(m.incident_count).toBe(0);
    });

    it("returns roadworthy_rate = 100", () => {
      const m = computeTransportMetrics([record]);
      expect(m.roadworthy_rate).toBe(100);
    });

    it("returns major_defects_count = 0", () => {
      const m = computeTransportMetrics([record]);
      expect(m.major_defects_count).toBe(0);
    });

    it("returns driver_compliant_rate = 100", () => {
      const m = computeTransportMetrics([record]);
      expect(m.driver_compliant_rate).toBe(100);
    });

    it("returns non_compliant_driver_count = 0", () => {
      const m = computeTransportMetrics([record]);
      expect(m.non_compliant_driver_count).toBe(0);
    });

    it("returns seatbelts_checked_rate = 100", () => {
      const m = computeTransportMetrics([record]);
      expect(m.seatbelts_checked_rate).toBe(100);
    });

    it("returns child_locks_rate = 100", () => {
      const m = computeTransportMetrics([record]);
      expect(m.child_locks_rate).toBe(100);
    });

    it("returns risk_assessment_rate = 100", () => {
      const m = computeTransportMetrics([record]);
      expect(m.risk_assessment_rate).toBe(100);
    });

    it("returns insurance_valid_rate = 100", () => {
      const m = computeTransportMetrics([record]);
      expect(m.insurance_valid_rate).toBe(100);
    });

    it("returns mot_valid_rate = 100", () => {
      const m = computeTransportMetrics([record]);
      expect(m.mot_valid_rate).toBe(100);
    });

    it("returns children_transported_count = 2", () => {
      const m = computeTransportMetrics([record]);
      expect(m.children_transported_count).toBe(2);
    });

    it("returns check_overdue_count = 0 when next_check_date is null", () => {
      const m = computeTransportMetrics([record]);
      expect(m.check_overdue_count).toBe(0);
    });

    it("returns by_event_type with single entry", () => {
      const m = computeTransportMetrics([record]);
      expect(m.by_event_type).toEqual({ journey_log: 1 });
    });

    it("returns by_vehicle_status with single entry", () => {
      const m = computeTransportMetrics([record]);
      expect(m.by_vehicle_status).toEqual({ roadworthy: 1 });
    });

    it("returns by_journey_purpose with single entry", () => {
      const m = computeTransportMetrics([record]);
      expect(m.by_journey_purpose).toEqual({ school_run: 1 });
    });

    it("returns by_driver_compliance with single entry", () => {
      const m = computeTransportMetrics([record]);
      expect(m.by_driver_compliance).toEqual({ fully_compliant: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ event_type: "journey_log", vehicle_status: "roadworthy", driver_compliance: "fully_compliant", seatbelts_checked: true, child_locks_engaged: true, risk_assessment_completed: true, insurance_valid: true, mot_valid: true, children_transported: ["c1", "c2"], journey_purpose: "school_run" }),
      makeRecord({ event_type: "vehicle_inspection", vehicle_status: "minor_defects", driver_compliance: "licence_expiring", seatbelts_checked: false, child_locks_engaged: false, risk_assessment_completed: false, insurance_valid: false, mot_valid: true, children_transported: ["c3"], journey_purpose: null }),
      makeRecord({ event_type: "incident", vehicle_status: "major_defects", driver_compliance: "non_compliant", seatbelts_checked: true, child_locks_engaged: false, risk_assessment_completed: true, insurance_valid: true, mot_valid: false, children_transported: [], journey_purpose: "emergency" }),
      makeRecord({ event_type: "journey_log", vehicle_status: "roadworthy", driver_compliance: "fully_compliant", seatbelts_checked: false, child_locks_engaged: true, risk_assessment_completed: false, insurance_valid: true, mot_valid: true, children_transported: ["c4", "c5", "c6"], journey_purpose: "medical_appointment" }),
      makeRecord({ event_type: "maintenance", vehicle_status: "off_road", driver_compliance: "not_checked", seatbelts_checked: true, child_locks_engaged: true, risk_assessment_completed: true, insurance_valid: false, mot_valid: false, children_transported: [], journey_purpose: null }),
    ];

    it("returns total_records = 5", () => {
      const m = computeTransportMetrics(records);
      expect(m.total_records).toBe(5);
    });

    it("returns journey_count = 2", () => {
      const m = computeTransportMetrics(records);
      expect(m.journey_count).toBe(2);
    });

    it("returns inspection_count = 1", () => {
      const m = computeTransportMetrics(records);
      expect(m.inspection_count).toBe(1);
    });

    it("returns incident_count = 1", () => {
      const m = computeTransportMetrics(records);
      expect(m.incident_count).toBe(1);
    });

    it("calculates roadworthy_rate correctly (2/5 = 40%)", () => {
      const m = computeTransportMetrics(records);
      expect(m.roadworthy_rate).toBe(40);
    });

    it("returns major_defects_count = 1", () => {
      const m = computeTransportMetrics(records);
      expect(m.major_defects_count).toBe(1);
    });

    it("calculates driver_compliant_rate correctly (2/5 = 40%)", () => {
      const m = computeTransportMetrics(records);
      expect(m.driver_compliant_rate).toBe(40);
    });

    it("returns non_compliant_driver_count = 1", () => {
      const m = computeTransportMetrics(records);
      expect(m.non_compliant_driver_count).toBe(1);
    });

    it("calculates seatbelts_checked_rate from journey_log records only (1/2 = 50%)", () => {
      // journey_log records: rec0 (checked=true), rec3 (checked=false) => 1/2
      const m = computeTransportMetrics(records);
      expect(m.seatbelts_checked_rate).toBe(50);
    });

    it("calculates child_locks_rate from journey_log records only (2/2 = 100%)", () => {
      // journey_log records: rec0 (engaged=true), rec3 (engaged=true) => 2/2
      const m = computeTransportMetrics(records);
      expect(m.child_locks_rate).toBe(100);
    });

    it("calculates risk_assessment_rate (3/5 = 60%)", () => {
      const m = computeTransportMetrics(records);
      expect(m.risk_assessment_rate).toBe(60);
    });

    it("calculates insurance_valid_rate (3/5 = 60%)", () => {
      const m = computeTransportMetrics(records);
      expect(m.insurance_valid_rate).toBe(60);
    });

    it("calculates mot_valid_rate (3/5 = 60%)", () => {
      const m = computeTransportMetrics(records);
      expect(m.mot_valid_rate).toBe(60);
    });

    it("sums children_transported_count (2+1+0+3+0 = 6)", () => {
      const m = computeTransportMetrics(records);
      expect(m.children_transported_count).toBe(6);
    });

    it("groups by_event_type correctly", () => {
      const m = computeTransportMetrics(records);
      expect(m.by_event_type).toEqual({ journey_log: 2, vehicle_inspection: 1, incident: 1, maintenance: 1 });
    });

    it("groups by_vehicle_status correctly", () => {
      const m = computeTransportMetrics(records);
      expect(m.by_vehicle_status).toEqual({ roadworthy: 2, minor_defects: 1, major_defects: 1, off_road: 1 });
    });

    it("groups by_journey_purpose correctly (excludes null)", () => {
      const m = computeTransportMetrics(records);
      expect(m.by_journey_purpose).toEqual({ school_run: 1, emergency: 1, medical_appointment: 1 });
    });

    it("groups by_driver_compliance correctly", () => {
      const m = computeTransportMetrics(records);
      expect(m.by_driver_compliance).toEqual({ fully_compliant: 2, licence_expiring: 1, non_compliant: 1, not_checked: 1 });
    });
  });

  describe("event type counts", () => {
    it("counts journey_log events", () => {
      const records = [makeRecord({ event_type: "journey_log" }), makeRecord({ event_type: "journey_log" })];
      const m = computeTransportMetrics(records);
      expect(m.journey_count).toBe(2);
    });

    it("counts vehicle_inspection events", () => {
      const records = [makeRecord({ event_type: "vehicle_inspection" }), makeRecord({ event_type: "vehicle_inspection" }), makeRecord({ event_type: "vehicle_inspection" })];
      const m = computeTransportMetrics(records);
      expect(m.inspection_count).toBe(3);
    });

    it("counts incident events", () => {
      const records = [makeRecord({ event_type: "incident" })];
      const m = computeTransportMetrics(records);
      expect(m.incident_count).toBe(1);
    });

    it("does not count maintenance as journey", () => {
      const records = [makeRecord({ event_type: "maintenance" })];
      const m = computeTransportMetrics(records);
      expect(m.journey_count).toBe(0);
    });

    it("does not count driver_check as inspection", () => {
      const records = [makeRecord({ event_type: "driver_check" })];
      const m = computeTransportMetrics(records);
      expect(m.inspection_count).toBe(0);
    });

    it("does not count other as incident", () => {
      const records = [makeRecord({ event_type: "other" })];
      const m = computeTransportMetrics(records);
      expect(m.incident_count).toBe(0);
    });
  });

  describe("roadworthy_rate", () => {
    it("returns 100 when all roadworthy", () => {
      const records = [makeRecord({ vehicle_status: "roadworthy" }), makeRecord({ vehicle_status: "roadworthy" })];
      const m = computeTransportMetrics(records);
      expect(m.roadworthy_rate).toBe(100);
    });

    it("returns 0 when none roadworthy", () => {
      const records = [makeRecord({ vehicle_status: "minor_defects" }), makeRecord({ vehicle_status: "major_defects" })];
      const m = computeTransportMetrics(records);
      expect(m.roadworthy_rate).toBe(0);
    });

    it("calculates rate with rounding (1/3 = 33.3%)", () => {
      const records = [makeRecord({ vehicle_status: "roadworthy" }), makeRecord({ vehicle_status: "minor_defects" }), makeRecord({ vehicle_status: "major_defects" })];
      const m = computeTransportMetrics(records);
      expect(m.roadworthy_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [makeRecord({ vehicle_status: "roadworthy" }), makeRecord({ vehicle_status: "roadworthy" }), makeRecord({ vehicle_status: "off_road" })];
      const m = computeTransportMetrics(records);
      expect(m.roadworthy_rate).toBe(66.7);
    });
  });

  describe("driver_compliant_rate and non_compliant_driver_count", () => {
    it("returns 100 when all fully_compliant", () => {
      const records = [makeRecord({ driver_compliance: "fully_compliant" }), makeRecord({ driver_compliance: "fully_compliant" })];
      const m = computeTransportMetrics(records);
      expect(m.driver_compliant_rate).toBe(100);
    });

    it("returns 0 when none fully_compliant", () => {
      const records = [makeRecord({ driver_compliance: "non_compliant" }), makeRecord({ driver_compliance: "licence_expiring" })];
      const m = computeTransportMetrics(records);
      expect(m.driver_compliant_rate).toBe(0);
    });

    it("calculates rate with rounding (1/3 = 33.3%)", () => {
      const records = [makeRecord({ driver_compliance: "fully_compliant" }), makeRecord({ driver_compliance: "non_compliant" }), makeRecord({ driver_compliance: "licence_expiring" })];
      const m = computeTransportMetrics(records);
      expect(m.driver_compliant_rate).toBe(33.3);
    });

    it("counts non_compliant drivers accurately", () => {
      const records = [makeRecord({ driver_compliance: "non_compliant" }), makeRecord({ driver_compliance: "non_compliant" }), makeRecord({ driver_compliance: "fully_compliant" })];
      const m = computeTransportMetrics(records);
      expect(m.non_compliant_driver_count).toBe(2);
    });

    it("does not count licence_expiring as non_compliant", () => {
      const records = [makeRecord({ driver_compliance: "licence_expiring" })];
      const m = computeTransportMetrics(records);
      expect(m.non_compliant_driver_count).toBe(0);
    });

    it("does not count insurance_issue as non_compliant", () => {
      const records = [makeRecord({ driver_compliance: "insurance_issue" })];
      const m = computeTransportMetrics(records);
      expect(m.non_compliant_driver_count).toBe(0);
    });

    it("does not count not_checked as non_compliant", () => {
      const records = [makeRecord({ driver_compliance: "not_checked" })];
      const m = computeTransportMetrics(records);
      expect(m.non_compliant_driver_count).toBe(0);
    });
  });

  describe("seatbelts_checked_rate", () => {
    it("uses journey_log records as denominator", () => {
      const records = [
        makeRecord({ event_type: "journey_log", seatbelts_checked: true }),
        makeRecord({ event_type: "vehicle_inspection", seatbelts_checked: false }),
      ];
      // Only 1 journey_log, seatbelts_checked=true => 100%
      const m = computeTransportMetrics(records);
      expect(m.seatbelts_checked_rate).toBe(100);
    });

    it("returns 0 when no journey_log records exist", () => {
      const records = [makeRecord({ event_type: "vehicle_inspection", seatbelts_checked: true })];
      const m = computeTransportMetrics(records);
      expect(m.seatbelts_checked_rate).toBeNull();;
    });

    it("returns 0 when no seatbelts checked in journey records", () => {
      const records = [makeRecord({ event_type: "journey_log", seatbelts_checked: false }), makeRecord({ event_type: "journey_log", seatbelts_checked: false })];
      const m = computeTransportMetrics(records);
      expect(m.seatbelts_checked_rate).toBe(0);
    });

    it("calculates rate with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ event_type: "journey_log", seatbelts_checked: true }),
        makeRecord({ event_type: "journey_log", seatbelts_checked: false }),
        makeRecord({ event_type: "journey_log", seatbelts_checked: false }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.seatbelts_checked_rate).toBe(33.3);
    });
  });

  describe("child_locks_rate", () => {
    it("uses journey_log records as denominator", () => {
      const records = [
        makeRecord({ event_type: "journey_log", child_locks_engaged: true }),
        makeRecord({ event_type: "maintenance", child_locks_engaged: false }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.child_locks_rate).toBe(100);
    });

    it("returns 0 when no journey_log records exist", () => {
      const records = [makeRecord({ event_type: "vehicle_inspection", child_locks_engaged: true })];
      const m = computeTransportMetrics(records);
      expect(m.child_locks_rate).toBeNull();;
    });

    it("returns 0 when no child locks engaged in journey records", () => {
      const records = [makeRecord({ event_type: "journey_log", child_locks_engaged: false })];
      const m = computeTransportMetrics(records);
      expect(m.child_locks_rate).toBe(0);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ event_type: "journey_log", child_locks_engaged: true }),
        makeRecord({ event_type: "journey_log", child_locks_engaged: true }),
        makeRecord({ event_type: "journey_log", child_locks_engaged: false }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.child_locks_rate).toBe(66.7);
    });
  });

  describe("risk_assessment_rate", () => {
    it("uses all records as denominator", () => {
      const records = [
        makeRecord({ risk_assessment_completed: true }),
        makeRecord({ risk_assessment_completed: false }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.risk_assessment_rate).toBe(50);
    });

    it("returns 100 when all completed", () => {
      const records = [makeRecord({ risk_assessment_completed: true }), makeRecord({ risk_assessment_completed: true })];
      const m = computeTransportMetrics(records);
      expect(m.risk_assessment_rate).toBe(100);
    });

    it("returns 0 when none completed", () => {
      const records = [makeRecord({ risk_assessment_completed: false }), makeRecord({ risk_assessment_completed: false })];
      const m = computeTransportMetrics(records);
      expect(m.risk_assessment_rate).toBe(0);
    });
  });

  describe("insurance_valid_rate", () => {
    it("uses all records as denominator", () => {
      const records = [makeRecord({ insurance_valid: true }), makeRecord({ insurance_valid: false })];
      const m = computeTransportMetrics(records);
      expect(m.insurance_valid_rate).toBe(50);
    });

    it("returns 100 when all valid", () => {
      const records = [makeRecord({ insurance_valid: true }), makeRecord({ insurance_valid: true })];
      const m = computeTransportMetrics(records);
      expect(m.insurance_valid_rate).toBe(100);
    });

    it("returns 0 when none valid", () => {
      const records = [makeRecord({ insurance_valid: false })];
      const m = computeTransportMetrics(records);
      expect(m.insurance_valid_rate).toBe(0);
    });
  });

  describe("mot_valid_rate", () => {
    it("uses all records as denominator", () => {
      const records = [makeRecord({ mot_valid: true }), makeRecord({ mot_valid: false })];
      const m = computeTransportMetrics(records);
      expect(m.mot_valid_rate).toBe(50);
    });

    it("returns 100 when all valid", () => {
      const records = [makeRecord({ mot_valid: true }), makeRecord({ mot_valid: true })];
      const m = computeTransportMetrics(records);
      expect(m.mot_valid_rate).toBe(100);
    });

    it("returns 0 when none valid", () => {
      const records = [makeRecord({ mot_valid: false })];
      const m = computeTransportMetrics(records);
      expect(m.mot_valid_rate).toBe(0);
    });

    it("calculates rate with rounding (1/3 = 33.3%)", () => {
      const records = [makeRecord({ mot_valid: true }), makeRecord({ mot_valid: false }), makeRecord({ mot_valid: false })];
      const m = computeTransportMetrics(records);
      expect(m.mot_valid_rate).toBe(33.3);
    });
  });

  describe("children_transported_count", () => {
    it("sums children_transported array lengths", () => {
      const records = [
        makeRecord({ children_transported: ["c1", "c2", "c3"] }),
        makeRecord({ children_transported: ["c4"] }),
        makeRecord({ children_transported: [] }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.children_transported_count).toBe(4);
    });

    it("returns 0 when all arrays are empty", () => {
      const records = [makeRecord({ children_transported: [] }), makeRecord({ children_transported: [] })];
      const m = computeTransportMetrics(records);
      expect(m.children_transported_count).toBe(0);
    });

    it("counts single child correctly", () => {
      const records = [makeRecord({ children_transported: ["only-child"] })];
      const m = computeTransportMetrics(records);
      expect(m.children_transported_count).toBe(1);
    });
  });

  describe("check_overdue_count", () => {
    it("counts records with past next_check_date", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) }), makeRecord({ next_check_date: daysAgo(10) })];
      const m = computeTransportMetrics(records);
      expect(m.check_overdue_count).toBe(2);
    });

    it("excludes null next_check_date", () => {
      const records = [makeRecord({ next_check_date: null }), makeRecord({ next_check_date: null })];
      const m = computeTransportMetrics(records);
      expect(m.check_overdue_count).toBe(0);
    });

    it("excludes future next_check_date", () => {
      const records = [makeRecord({ next_check_date: daysFromNow(30) })];
      const m = computeTransportMetrics(records);
      expect(m.check_overdue_count).toBe(0);
    });

    it("counts only past dates, not future or null", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(1) }),
        makeRecord({ next_check_date: daysFromNow(10) }),
        makeRecord({ next_check_date: null }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.check_overdue_count).toBe(1);
    });
  });

  describe("by_journey_purpose", () => {
    it("only counts records where journey_purpose is not null", () => {
      const records = [
        makeRecord({ journey_purpose: "school_run" }),
        makeRecord({ journey_purpose: null }),
        makeRecord({ journey_purpose: "emergency" }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.by_journey_purpose).toEqual({ school_run: 1, emergency: 1 });
    });

    it("returns empty object when all journey_purpose are null", () => {
      const records = [makeRecord({ journey_purpose: null }), makeRecord({ journey_purpose: null })];
      const m = computeTransportMetrics(records);
      expect(m.by_journey_purpose).toEqual({});
    });

    it("counts multiple records with same purpose", () => {
      const records = [
        makeRecord({ journey_purpose: "school_run" }),
        makeRecord({ journey_purpose: "school_run" }),
        makeRecord({ journey_purpose: "school_run" }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.by_journey_purpose).toEqual({ school_run: 3 });
    });

    it("handles all eight journey purposes", () => {
      const purposes: JourneyPurpose[] = ["school_run", "medical_appointment", "contact_visit", "activity_outing", "court_hearing", "emergency", "shopping", "other"];
      const records = purposes.map((p) => makeRecord({ journey_purpose: p }));
      const m = computeTransportMetrics(records);
      for (const p of purposes) {
        expect(m.by_journey_purpose[p]).toBe(1);
      }
    });
  });

  describe("by_event_type breakdown", () => {
    it("counts each event type separately", () => {
      const records = [
        makeRecord({ event_type: "journey_log" }),
        makeRecord({ event_type: "journey_log" }),
        makeRecord({ event_type: "incident" }),
        makeRecord({ event_type: "maintenance" }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.by_event_type).toEqual({ journey_log: 2, incident: 1, maintenance: 1 });
    });

    it("handles all nine event types", () => {
      const types: TransportEventType[] = ["vehicle_inspection", "journey_log", "driver_check", "risk_assessment", "incident", "maintenance", "insurance_renewal", "mot_check", "other"];
      const records = types.map((t) => makeRecord({ event_type: t }));
      const m = computeTransportMetrics(records);
      for (const t of types) {
        expect(m.by_event_type[t]).toBe(1);
      }
    });
  });

  describe("by_vehicle_status breakdown", () => {
    it("counts each vehicle status separately", () => {
      const records = [
        makeRecord({ vehicle_status: "roadworthy" }),
        makeRecord({ vehicle_status: "roadworthy" }),
        makeRecord({ vehicle_status: "major_defects" }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.by_vehicle_status).toEqual({ roadworthy: 2, major_defects: 1 });
    });

    it("handles all five vehicle statuses", () => {
      const statuses: VehicleStatus[] = ["roadworthy", "minor_defects", "major_defects", "off_road", "not_checked"];
      const records = statuses.map((s) => makeRecord({ vehicle_status: s }));
      const m = computeTransportMetrics(records);
      for (const s of statuses) {
        expect(m.by_vehicle_status[s]).toBe(1);
      }
    });
  });

  describe("by_driver_compliance breakdown", () => {
    it("counts each driver compliance separately", () => {
      const records = [
        makeRecord({ driver_compliance: "fully_compliant" }),
        makeRecord({ driver_compliance: "fully_compliant" }),
        makeRecord({ driver_compliance: "non_compliant" }),
      ];
      const m = computeTransportMetrics(records);
      expect(m.by_driver_compliance).toEqual({ fully_compliant: 2, non_compliant: 1 });
    });

    it("handles all five driver compliance statuses", () => {
      const compliances: DriverCompliance[] = ["fully_compliant", "licence_expiring", "insurance_issue", "not_checked", "non_compliant"];
      const records = compliances.map((c) => makeRecord({ driver_compliance: c }));
      const m = computeTransportMetrics(records);
      for (const c of compliances) {
        expect(m.by_driver_compliance[c]).toBe(1);
      }
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: TransportRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            event_type: i % 3 === 0 ? "journey_log" : i % 3 === 1 ? "vehicle_inspection" : "incident",
            vehicle_status: i % 2 === 0 ? "roadworthy" : "minor_defects",
            driver_compliance: "fully_compliant",
            seatbelts_checked: true,
            child_locks_engaged: true,
            risk_assessment_completed: true,
            insurance_valid: true,
            mot_valid: true,
            children_transported: ["c1"],
            journey_purpose: i % 3 === 0 ? "school_run" : null,
          }),
        );
      }
      const m = computeTransportMetrics(records);
      expect(m.total_records).toBe(100);
      expect(m.driver_compliant_rate).toBe(100);
      expect(m.risk_assessment_rate).toBe(100);
      expect(m.insurance_valid_rate).toBe(100);
      expect(m.mot_valid_rate).toBe(100);
      expect(m.children_transported_count).toBe(100);
    });
  });
});

// ── identifyTransportAlerts ────────────────────────────────────────────────

describe("identifyTransportAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyTransportAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          vehicle_status: "roadworthy",
          driver_compliance: "fully_compliant",
          insurance_valid: true,
          mot_valid: true,
          event_type: "journey_log",
          next_check_date: daysFromNow(30),
        }),
      ];
      const alerts = identifyTransportAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty for well-formed records without issues", () => {
      const records = [
        makeRecord({ vehicle_status: "roadworthy", driver_compliance: "fully_compliant", insurance_valid: true, mot_valid: true, event_type: "vehicle_inspection", next_check_date: null }),
        makeRecord({ vehicle_status: "roadworthy", driver_compliance: "fully_compliant", insurance_valid: true, mot_valid: true, event_type: "journey_log", next_check_date: daysFromNow(15) }),
      ];
      const alerts = identifyTransportAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("major_defects alert", () => {
    it("fires for vehicle_status=major_defects", () => {
      const records = [makeRecord({ vehicle_status: "major_defects" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ vehicle_status: "major_defects" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "rec-major-1", vehicle_status: "major_defects" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects")!;
      expect(alert.id).toBe("rec-major-1");
    });

    it("includes vehicle_registration in message", () => {
      const records = [makeRecord({ vehicle_status: "major_defects", vehicle_registration: "XY99 ZZZ" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects")!;
      expect(alert.message).toContain("XY99 ZZZ");
    });

    it("includes event_date in message", () => {
      const date = "2026-04-15";
      const records = [makeRecord({ vehicle_status: "major_defects", event_date: date })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects")!;
      expect(alert.message).toContain(date);
    });

    it("fires per record for multiple major_defects", () => {
      const records = [
        makeRecord({ vehicle_status: "major_defects" }),
        makeRecord({ vehicle_status: "major_defects" }),
        makeRecord({ vehicle_status: "major_defects" }),
      ];
      const alerts = identifyTransportAlerts(records);
      const majorAlerts = alerts.filter((a) => a.type === "major_defects");
      expect(majorAlerts).toHaveLength(3);
    });

    it("does not fire for roadworthy status", () => {
      const records = [makeRecord({ vehicle_status: "roadworthy" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects");
      expect(alert).toBeUndefined();
    });

    it("does not fire for minor_defects status", () => {
      const records = [makeRecord({ vehicle_status: "minor_defects" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects");
      expect(alert).toBeUndefined();
    });

    it("does not fire for off_road status", () => {
      const records = [makeRecord({ vehicle_status: "off_road" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects");
      expect(alert).toBeUndefined();
    });

    it("does not fire for not_checked status", () => {
      const records = [makeRecord({ vehicle_status: "not_checked" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects");
      expect(alert).toBeUndefined();
    });

    it("message contains do not use until repaired wording", () => {
      const records = [makeRecord({ vehicle_status: "major_defects" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects")!;
      expect(alert.message).toContain("do not use until repaired");
    });
  });

  describe("non_compliant_driver alert", () => {
    it("fires for driver_compliance=non_compliant", () => {
      const records = [makeRecord({ driver_compliance: "non_compliant" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ driver_compliance: "non_compliant" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "rec-nc-drv-1", driver_compliance: "non_compliant" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver")!;
      expect(alert.id).toBe("rec-nc-drv-1");
    });

    it("includes driver_name in message", () => {
      const records = [makeRecord({ driver_compliance: "non_compliant", driver_name: "Jane Doe" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver")!;
      expect(alert.message).toContain("Jane Doe");
    });

    it("includes event_date in message", () => {
      const date = "2026-03-20";
      const records = [makeRecord({ driver_compliance: "non_compliant", event_date: date })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver")!;
      expect(alert.message).toContain(date);
    });

    it("fires per record for multiple non_compliant drivers", () => {
      const records = [
        makeRecord({ driver_compliance: "non_compliant", driver_name: "Driver A" }),
        makeRecord({ driver_compliance: "non_compliant", driver_name: "Driver B" }),
      ];
      const alerts = identifyTransportAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_driver");
      expect(ncAlerts).toHaveLength(2);
    });

    it("does not fire for fully_compliant status", () => {
      const records = [makeRecord({ driver_compliance: "fully_compliant" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver");
      expect(alert).toBeUndefined();
    });

    it("does not fire for licence_expiring status", () => {
      const records = [makeRecord({ driver_compliance: "licence_expiring" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver");
      expect(alert).toBeUndefined();
    });

    it("does not fire for insurance_issue status", () => {
      const records = [makeRecord({ driver_compliance: "insurance_issue" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver");
      expect(alert).toBeUndefined();
    });

    it("does not fire for not_checked status", () => {
      const records = [makeRecord({ driver_compliance: "not_checked" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver");
      expect(alert).toBeUndefined();
    });

    it("message contains do not permit driving wording", () => {
      const records = [makeRecord({ driver_compliance: "non_compliant" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver")!;
      expect(alert.message).toContain("do not permit driving");
    });
  });

  describe("documentation_invalid alert", () => {
    it("fires when insurance_valid=false and mot_valid=false", () => {
      const records = [makeRecord({ insurance_valid: false, mot_valid: false })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid");
      expect(alert).toBeDefined();
    });

    it("fires when only insurance_valid=false", () => {
      const records = [makeRecord({ insurance_valid: false, mot_valid: true })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid");
      expect(alert).toBeDefined();
    });

    it("fires when only mot_valid=false", () => {
      const records = [makeRecord({ insurance_valid: true, mot_valid: false })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ insurance_valid: false, mot_valid: false })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "rec-doc-1", insurance_valid: false })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid")!;
      expect(alert.id).toBe("rec-doc-1");
    });

    it("includes vehicle_registration in message", () => {
      const records = [makeRecord({ insurance_valid: false, vehicle_registration: "AA11 BBB" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid")!;
      expect(alert.message).toContain("AA11 BBB");
    });

    it("includes event_date in message", () => {
      const date = "2026-02-28";
      const records = [makeRecord({ insurance_valid: false, event_date: date })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid")!;
      expect(alert.message).toContain(date);
    });

    it("message says insurance and MOT when both invalid", () => {
      const records = [makeRecord({ insurance_valid: false, mot_valid: false })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid")!;
      expect(alert.message).toContain("insurance and MOT");
    });

    it("message says insurance when only insurance invalid", () => {
      const records = [makeRecord({ insurance_valid: false, mot_valid: true })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid")!;
      expect(alert.message).toContain("insurance");
      expect(alert.message).not.toContain("MOT");
    });

    it("message says MOT when only MOT invalid", () => {
      const records = [makeRecord({ insurance_valid: true, mot_valid: false })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid")!;
      expect(alert.message).toContain("MOT");
      expect(alert.message).not.toContain("insurance");
    });

    it("fires per record for multiple invalid documentation", () => {
      const records = [
        makeRecord({ insurance_valid: false, mot_valid: true }),
        makeRecord({ insurance_valid: true, mot_valid: false }),
        makeRecord({ insurance_valid: false, mot_valid: false }),
      ];
      const alerts = identifyTransportAlerts(records);
      const docAlerts = alerts.filter((a) => a.type === "documentation_invalid");
      expect(docAlerts).toHaveLength(3);
    });

    it("does not fire when both insurance and MOT are valid", () => {
      const records = [makeRecord({ insurance_valid: true, mot_valid: true })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid");
      expect(alert).toBeUndefined();
    });

    it("message contains do not use wording", () => {
      const records = [makeRecord({ insurance_valid: false })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid")!;
      expect(alert.message).toContain("do not use");
    });
  });

  describe("transport_incident alert", () => {
    it("fires when >= 1 incident record exists", () => {
      const records = [makeRecord({ event_type: "incident" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "transport_incident");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ event_type: "incident" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "transport_incident")!;
      expect(alert.severity).toBe("high");
    });

    it("has id transport_incident", () => {
      const records = [makeRecord({ event_type: "incident" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "transport_incident")!;
      expect(alert.id).toBe("transport_incident");
    });

    it("uses singular message for 1 incident", () => {
      const records = [makeRecord({ event_type: "incident" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "transport_incident")!;
      expect(alert.message).toContain("1 transport incident recorded");
    });

    it("uses plural message for multiple incidents", () => {
      const records = [
        makeRecord({ event_type: "incident" }),
        makeRecord({ event_type: "incident" }),
        makeRecord({ event_type: "incident" }),
      ];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "transport_incident")!;
      expect(alert.message).toContain("3 transport incidents recorded");
    });

    it("includes count of 2 correctly", () => {
      const records = [makeRecord({ event_type: "incident" }), makeRecord({ event_type: "incident" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "transport_incident")!;
      expect(alert.message).toContain("2 transport incidents recorded");
    });

    it("does not fire when no incident records exist", () => {
      const records = [
        makeRecord({ event_type: "journey_log" }),
        makeRecord({ event_type: "vehicle_inspection" }),
      ];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "transport_incident");
      expect(alert).toBeUndefined();
    });

    it("does not count maintenance as incident", () => {
      const records = [makeRecord({ event_type: "maintenance" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "transport_incident");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert, not per record", () => {
      const records = [makeRecord({ event_type: "incident" }), makeRecord({ event_type: "incident" })];
      const alerts = identifyTransportAlerts(records);
      const incAlerts = alerts.filter((a) => a.type === "transport_incident");
      expect(incAlerts).toHaveLength(1);
    });

    it("message contains review and address wording", () => {
      const records = [makeRecord({ event_type: "incident" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "transport_incident")!;
      expect(alert.message).toContain("review and address");
    });
  });

  describe("check_overdue alert", () => {
    it("fires when >= 1 record has past next_check_date", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id check_overdue", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.id).toBe("check_overdue");
    });

    it("uses singular message for 1 overdue check", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("1 vehicle check is overdue");
    });

    it("uses plural message for multiple overdue checks", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(5) }),
        makeRecord({ next_check_date: daysAgo(10) }),
        makeRecord({ next_check_date: daysAgo(15) }),
      ];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("3 vehicle checks are overdue");
    });

    it("includes count of 2 correctly", () => {
      const records = [makeRecord({ next_check_date: daysAgo(1) }), makeRecord({ next_check_date: daysAgo(2) })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("2 vehicle checks are overdue");
    });

    it("does not fire when no overdue checks", () => {
      const records = [makeRecord({ next_check_date: daysFromNow(30) }), makeRecord({ next_check_date: null })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });

    it("excludes null next_check_date from count", () => {
      const records = [makeRecord({ next_check_date: null }), makeRecord({ next_check_date: null })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });

    it("excludes future next_check_date from count", () => {
      const records = [makeRecord({ next_check_date: daysFromNow(10) })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert, not per record", () => {
      const records = [makeRecord({ next_check_date: daysAgo(1) }), makeRecord({ next_check_date: daysAgo(2) })];
      const alerts = identifyTransportAlerts(records);
      const overdueAlerts = alerts.filter((a) => a.type === "check_overdue");
      expect(overdueAlerts).toHaveLength(1);
    });

    it("message contains schedule promptly wording", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("schedule promptly");
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        makeRecord({
          id: "r1",
          vehicle_status: "major_defects",
          driver_compliance: "non_compliant",
          insurance_valid: false,
          mot_valid: false,
          event_type: "incident",
          next_check_date: daysAgo(5),
        }),
      ];
      const alerts = identifyTransportAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("major_defects");
      expect(types).toContain("non_compliant_driver");
      expect(types).toContain("documentation_invalid");
      expect(types).toContain("transport_incident");
      expect(types).toContain("check_overdue");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({
          vehicle_status: "major_defects",
          driver_compliance: "non_compliant",
          insurance_valid: false,
          mot_valid: false,
          event_type: "incident",
          next_check_date: daysAgo(5),
        }),
      ];
      const alerts = identifyTransportAlerts(records);
      // major_defects=1, non_compliant_driver=1, documentation_invalid=1, transport_incident=1, check_overdue=1
      expect(alerts).toHaveLength(5);
    });

    it("per-record alerts multiply while threshold alerts stay singular", () => {
      const records = [
        makeRecord({ vehicle_status: "major_defects", driver_compliance: "non_compliant", insurance_valid: false, event_type: "incident", next_check_date: daysAgo(1) }),
        makeRecord({ vehicle_status: "major_defects", driver_compliance: "non_compliant", insurance_valid: false, event_type: "incident", next_check_date: daysAgo(2) }),
      ];
      const alerts = identifyTransportAlerts(records);
      expect(alerts.filter((a) => a.type === "major_defects")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "non_compliant_driver")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "documentation_invalid")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "transport_incident")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "check_overdue")).toHaveLength(1);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ vehicle_status: "major_defects", event_type: "incident", next_check_date: daysAgo(1) }),
      ];
      const alerts = identifyTransportAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ vehicle_status: "major_defects", driver_compliance: "non_compliant", insurance_valid: false, mot_valid: false, event_type: "incident", next_check_date: daysAgo(1) }),
      ];
      const alerts = identifyTransportAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ vehicle_status: "major_defects" })];
      const alerts = identifyTransportAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("roadworthy vehicle does not trigger major_defects", () => {
      const records = [makeRecord({ vehicle_status: "roadworthy" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "major_defects");
      expect(alert).toBeUndefined();
    });

    it("fully_compliant driver does not trigger non_compliant_driver", () => {
      const records = [makeRecord({ driver_compliance: "fully_compliant" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_driver");
      expect(alert).toBeUndefined();
    });

    it("valid insurance and MOT does not trigger documentation_invalid", () => {
      const records = [makeRecord({ insurance_valid: true, mot_valid: true })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "documentation_invalid");
      expect(alert).toBeUndefined();
    });

    it("non-incident event does not trigger transport_incident", () => {
      const records = [makeRecord({ event_type: "journey_log" })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "transport_incident");
      expect(alert).toBeUndefined();
    });

    it("future next_check_date does not trigger check_overdue", () => {
      const records = [makeRecord({ next_check_date: daysFromNow(30) })];
      const alerts = identifyTransportAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });

    it("clean record triggers no alerts at all", () => {
      const records = [makeRecord({ vehicle_status: "roadworthy", driver_compliance: "fully_compliant", insurance_valid: true, mot_valid: true, event_type: "journey_log", next_check_date: null })];
      const alerts = identifyTransportAlerts(records);
      expect(alerts).toHaveLength(0);
    });
  });
});

// ── Factory helper validation ──────────────────────────────────────────────

describe("makeRecord factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRecord();
    expect(r.home_id).toBe("home-1");
    expect(r.event_type).toBe("journey_log");
    expect(r.event_date).toBe("2026-05-01");
    expect(r.vehicle_registration).toBe("AB12 CDE");
    expect(r.vehicle_status).toBe("roadworthy");
    expect(r.journey_purpose).toBe("school_run");
    expect(r.driver_name).toBe("John Smith");
    expect(r.driver_compliance).toBe("fully_compliant");
    expect(r.children_transported).toEqual(["child-1", "child-2"]);
    expect(r.seatbelts_checked).toBe(true);
    expect(r.child_locks_engaged).toBe(true);
    expect(r.risk_assessment_completed).toBe(true);
    expect(r.insurance_valid).toBe(true);
    expect(r.mot_valid).toBe(true);
    expect(r.mileage).toBe(15000);
    expect(r.issues_identified).toEqual([]);
    expect(r.actions_taken).toEqual([]);
    expect(r.conducted_by).toBe("Manager");
    expect(r.next_check_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ event_type: "incident", vehicle_status: "major_defects" });
    expect(r.event_type).toBe("incident");
    expect(r.vehicle_status).toBe("major_defects");
    // defaults still apply
    expect(r.driver_compliance).toBe("fully_compliant");
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
    const r = makeRecord({ journey_purpose: null, mileage: null, next_check_date: null, notes: null });
    expect(r.journey_purpose).toBeNull();
    expect(r.mileage).toBeNull();
    expect(r.next_check_date).toBeNull();
    expect(r.notes).toBeNull();
  });
});
