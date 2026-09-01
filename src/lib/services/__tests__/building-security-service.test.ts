// ══════════════════════════════════════════════════════════════════════════════
// CARA — BUILDING SECURITY SERVICE TESTS
// Pure-function tests for security metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";

import {
  SECURITY_EVENT_TYPES,
  SECURITY_STATUSES,
  ALARM_STATUSES,
  KEY_MANAGEMENT_STATUSES,
  _testing,
} from "../building-security-service";

import type {
  SecurityRecord,
  SecurityEventType,
  SecurityStatus,
  AlarmStatus,
  KeyManagement,
} from "../building-security-service";

const { computeSecurityMetrics, identifySecurityAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<SecurityRecord>,
): SecurityRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    event_type: "event_type" in (overrides ?? {}) ? overrides!.event_type! : "routine_check",
    event_date: "event_date" in (overrides ?? {}) ? overrides!.event_date! : "2026-05-01",
    security_status: "security_status" in (overrides ?? {}) ? overrides!.security_status! : "secure",
    alarm_status: "alarm_status" in (overrides ?? {}) ? overrides!.alarm_status! : "operational",
    key_management: "key_management" in (overrides ?? {}) ? overrides!.key_management! : "all_accounted",
    all_doors_secure: "all_doors_secure" in (overrides ?? {}) ? overrides!.all_doors_secure! : true,
    all_windows_secure: "all_windows_secure" in (overrides ?? {}) ? overrides!.all_windows_secure! : true,
    external_lighting_working: "external_lighting_working" in (overrides ?? {}) ? overrides!.external_lighting_working! : true,
    perimeter_secure: "perimeter_secure" in (overrides ?? {}) ? overrides!.perimeter_secure! : true,
    visitors_log_checked: "visitors_log_checked" in (overrides ?? {}) ? overrides!.visitors_log_checked! : true,
    children_accounted_for: "children_accounted_for" in (overrides ?? {}) ? overrides!.children_accounted_for! : true,
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
  describe("SECURITY_EVENT_TYPES", () => {
    it("has exactly 10 items", () => {
      expect(SECURITY_EVENT_TYPES).toHaveLength(10);
    });

    it("contains routine_check", () => {
      expect(SECURITY_EVENT_TYPES).toContainEqual({ type: "routine_check", label: "Routine Check" });
    });

    it("contains alarm_test", () => {
      expect(SECURITY_EVENT_TYPES).toContainEqual({ type: "alarm_test", label: "Alarm Test" });
    });

    it("contains key_audit", () => {
      expect(SECURITY_EVENT_TYPES).toContainEqual({ type: "key_audit", label: "Key Audit" });
    });

    it("contains perimeter_inspection", () => {
      expect(SECURITY_EVENT_TYPES).toContainEqual({ type: "perimeter_inspection", label: "Perimeter Inspection" });
    });

    it("contains lock_check", () => {
      expect(SECURITY_EVENT_TYPES).toContainEqual({ type: "lock_check", label: "Lock Check" });
    });

    it("contains security_incident", () => {
      expect(SECURITY_EVENT_TYPES).toContainEqual({ type: "security_incident", label: "Security Incident" });
    });

    it("contains access_control_review", () => {
      expect(SECURITY_EVENT_TYPES).toContainEqual({ type: "access_control_review", label: "Access Control Review" });
    });

    it("contains lighting_check", () => {
      expect(SECURITY_EVENT_TYPES).toContainEqual({ type: "lighting_check", label: "Lighting Check" });
    });

    it("contains cctv_check", () => {
      expect(SECURITY_EVENT_TYPES).toContainEqual({ type: "cctv_check", label: "CCTV Check" });
    });

    it("contains other", () => {
      expect(SECURITY_EVENT_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = SECURITY_EVENT_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = SECURITY_EVENT_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of SECURITY_EVENT_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("SECURITY_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(SECURITY_STATUSES).toHaveLength(5);
    });

    it("contains secure", () => {
      expect(SECURITY_STATUSES).toContainEqual({ status: "secure", label: "Secure" });
    });

    it("contains minor_issue", () => {
      expect(SECURITY_STATUSES).toContainEqual({ status: "minor_issue", label: "Minor Issue" });
    });

    it("contains major_issue", () => {
      expect(SECURITY_STATUSES).toContainEqual({ status: "major_issue", label: "Major Issue" });
    });

    it("contains breach", () => {
      expect(SECURITY_STATUSES).toContainEqual({ status: "breach", label: "Breach" });
    });

    it("contains not_checked", () => {
      expect(SECURITY_STATUSES).toContainEqual({ status: "not_checked", label: "Not Checked" });
    });

    it("has unique status values", () => {
      const statuses = SECURITY_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = SECURITY_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of SECURITY_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("ALARM_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(ALARM_STATUSES).toHaveLength(5);
    });

    it("contains operational", () => {
      expect(ALARM_STATUSES).toContainEqual({ status: "operational", label: "Operational" });
    });

    it("contains fault_detected", () => {
      expect(ALARM_STATUSES).toContainEqual({ status: "fault_detected", label: "Fault Detected" });
    });

    it("contains disabled", () => {
      expect(ALARM_STATUSES).toContainEqual({ status: "disabled", label: "Disabled" });
    });

    it("contains not_installed", () => {
      expect(ALARM_STATUSES).toContainEqual({ status: "not_installed", label: "Not Installed" });
    });

    it("contains not_tested", () => {
      expect(ALARM_STATUSES).toContainEqual({ status: "not_tested", label: "Not Tested" });
    });

    it("has unique status values", () => {
      const statuses = ALARM_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = ALARM_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of ALARM_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("KEY_MANAGEMENT_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(KEY_MANAGEMENT_STATUSES).toHaveLength(5);
    });

    it("contains all_accounted", () => {
      expect(KEY_MANAGEMENT_STATUSES).toContainEqual({ status: "all_accounted", label: "All Accounted" });
    });

    it("contains key_missing", () => {
      expect(KEY_MANAGEMENT_STATUSES).toContainEqual({ status: "key_missing", label: "Key Missing" });
    });

    it("contains key_replaced", () => {
      expect(KEY_MANAGEMENT_STATUSES).toContainEqual({ status: "key_replaced", label: "Key Replaced" });
    });

    it("contains audit_due", () => {
      expect(KEY_MANAGEMENT_STATUSES).toContainEqual({ status: "audit_due", label: "Audit Due" });
    });

    it("contains not_checked", () => {
      expect(KEY_MANAGEMENT_STATUSES).toContainEqual({ status: "not_checked", label: "Not Checked" });
    });

    it("has unique status values", () => {
      const statuses = KEY_MANAGEMENT_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = KEY_MANAGEMENT_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of KEY_MANAGEMENT_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeSecurityMetrics ────────────────────────────────────────────────

describe("computeSecurityMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_records", () => {
      const m = computeSecurityMetrics([]);
      expect(m.total_records).toBe(0);
    });

    it("returns zero routine_check_count", () => {
      const m = computeSecurityMetrics([]);
      expect(m.routine_check_count).toBe(0);
    });

    it("returns zero security_incident_count", () => {
      const m = computeSecurityMetrics([]);
      expect(m.security_incident_count).toBe(0);
    });

    it("returns zero secure_rate", () => {
      const m = computeSecurityMetrics([]);
      expect(m.secure_rate).toBeNull();;
    });

    it("returns zero breach_count", () => {
      const m = computeSecurityMetrics([]);
      expect(m.breach_count).toBe(0);
    });

    it("returns zero major_issue_count", () => {
      const m = computeSecurityMetrics([]);
      expect(m.major_issue_count).toBe(0);
    });

    it("returns zero alarm_operational_rate", () => {
      const m = computeSecurityMetrics([]);
      expect(m.alarm_operational_rate).toBeNull();;
    });

    it("returns zero alarm_fault_count", () => {
      const m = computeSecurityMetrics([]);
      expect(m.alarm_fault_count).toBe(0);
    });

    it("returns zero keys_accounted_rate", () => {
      const m = computeSecurityMetrics([]);
      expect(m.keys_accounted_rate).toBeNull();;
    });

    it("returns zero key_missing_count", () => {
      const m = computeSecurityMetrics([]);
      expect(m.key_missing_count).toBe(0);
    });

    it("returns zero doors_secure_rate", () => {
      const m = computeSecurityMetrics([]);
      expect(m.doors_secure_rate).toBeNull();;
    });

    it("returns zero windows_secure_rate", () => {
      const m = computeSecurityMetrics([]);
      expect(m.windows_secure_rate).toBeNull();;
    });

    it("returns zero lighting_working_rate", () => {
      const m = computeSecurityMetrics([]);
      expect(m.lighting_working_rate).toBeNull();;
    });

    it("returns zero perimeter_secure_rate", () => {
      const m = computeSecurityMetrics([]);
      expect(m.perimeter_secure_rate).toBeNull();;
    });

    it("returns zero children_accounted_rate", () => {
      const m = computeSecurityMetrics([]);
      expect(m.children_accounted_rate).toBeNull();;
    });

    it("returns zero check_overdue_count", () => {
      const m = computeSecurityMetrics([]);
      expect(m.check_overdue_count).toBe(0);
    });

    it("returns empty by_event_type", () => {
      const m = computeSecurityMetrics([]);
      expect(m.by_event_type).toEqual({});
    });

    it("returns empty by_security_status", () => {
      const m = computeSecurityMetrics([]);
      expect(m.by_security_status).toEqual({});
    });

    it("returns empty by_alarm_status", () => {
      const m = computeSecurityMetrics([]);
      expect(m.by_alarm_status).toEqual({});
    });

    it("returns empty by_key_management", () => {
      const m = computeSecurityMetrics([]);
      expect(m.by_key_management).toEqual({});
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      event_type: "routine_check",
      security_status: "secure",
      alarm_status: "operational",
      key_management: "all_accounted",
      all_doors_secure: true,
      all_windows_secure: true,
      external_lighting_working: true,
      perimeter_secure: true,
      children_accounted_for: true,
    });

    it("returns total_records = 1", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.total_records).toBe(1);
    });

    it("returns routine_check_count = 1", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.routine_check_count).toBe(1);
    });

    it("returns security_incident_count = 0", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.security_incident_count).toBe(0);
    });

    it("returns secure_rate = 100", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.secure_rate).toBe(100);
    });

    it("returns breach_count = 0", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.breach_count).toBe(0);
    });

    it("returns major_issue_count = 0", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.major_issue_count).toBe(0);
    });

    it("returns alarm_operational_rate = 100", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.alarm_operational_rate).toBe(100);
    });

    it("returns alarm_fault_count = 0", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.alarm_fault_count).toBe(0);
    });

    it("returns keys_accounted_rate = 100", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.keys_accounted_rate).toBe(100);
    });

    it("returns key_missing_count = 0", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.key_missing_count).toBe(0);
    });

    it("returns doors_secure_rate = 100", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.doors_secure_rate).toBe(100);
    });

    it("returns windows_secure_rate = 100", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.windows_secure_rate).toBe(100);
    });

    it("returns lighting_working_rate = 100", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.lighting_working_rate).toBe(100);
    });

    it("returns perimeter_secure_rate = 100", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.perimeter_secure_rate).toBe(100);
    });

    it("returns children_accounted_rate = 100", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.children_accounted_rate).toBe(100);
    });

    it("returns by_event_type with single entry", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.by_event_type).toEqual({ routine_check: 1 });
    });

    it("returns by_security_status with single entry", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.by_security_status).toEqual({ secure: 1 });
    });

    it("returns by_alarm_status with single entry", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.by_alarm_status).toEqual({ operational: 1 });
    });

    it("returns by_key_management with single entry", () => {
      const m = computeSecurityMetrics([record]);
      expect(m.by_key_management).toEqual({ all_accounted: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ event_type: "routine_check", security_status: "secure", alarm_status: "operational", key_management: "all_accounted", all_doors_secure: true, all_windows_secure: true, external_lighting_working: true, perimeter_secure: true, children_accounted_for: true }),
      makeRecord({ event_type: "security_incident", security_status: "breach", alarm_status: "fault_detected", key_management: "key_missing", all_doors_secure: false, all_windows_secure: false, external_lighting_working: false, perimeter_secure: false, children_accounted_for: false }),
      makeRecord({ event_type: "alarm_test", security_status: "minor_issue", alarm_status: "disabled", key_management: "key_replaced", all_doors_secure: true, all_windows_secure: true, external_lighting_working: true, perimeter_secure: true, children_accounted_for: true }),
      makeRecord({ event_type: "key_audit", security_status: "major_issue", alarm_status: "not_installed", key_management: "audit_due", all_doors_secure: false, all_windows_secure: false, external_lighting_working: false, perimeter_secure: false, children_accounted_for: true }),
      makeRecord({ event_type: "perimeter_inspection", security_status: "secure", alarm_status: "operational", key_management: "all_accounted", all_doors_secure: true, all_windows_secure: true, external_lighting_working: true, perimeter_secure: true, children_accounted_for: true }),
    ];

    it("returns total_records = 5", () => {
      const m = computeSecurityMetrics(records);
      expect(m.total_records).toBe(5);
    });

    it("returns routine_check_count = 1", () => {
      const m = computeSecurityMetrics(records);
      expect(m.routine_check_count).toBe(1);
    });

    it("returns security_incident_count = 1", () => {
      const m = computeSecurityMetrics(records);
      expect(m.security_incident_count).toBe(1);
    });

    it("calculates secure_rate correctly (2/5 = 40%)", () => {
      const m = computeSecurityMetrics(records);
      expect(m.secure_rate).toBe(40);
    });

    it("returns breach_count = 1", () => {
      const m = computeSecurityMetrics(records);
      expect(m.breach_count).toBe(1);
    });

    it("returns major_issue_count = 1", () => {
      const m = computeSecurityMetrics(records);
      expect(m.major_issue_count).toBe(1);
    });

    it("calculates alarm_operational_rate correctly (2/5 = 40%)", () => {
      const m = computeSecurityMetrics(records);
      expect(m.alarm_operational_rate).toBe(40);
    });

    it("returns alarm_fault_count = 1", () => {
      const m = computeSecurityMetrics(records);
      expect(m.alarm_fault_count).toBe(1);
    });

    it("calculates keys_accounted_rate correctly (2/5 = 40%)", () => {
      const m = computeSecurityMetrics(records);
      expect(m.keys_accounted_rate).toBe(40);
    });

    it("returns key_missing_count = 1", () => {
      const m = computeSecurityMetrics(records);
      expect(m.key_missing_count).toBe(1);
    });

    it("calculates doors_secure_rate correctly (3/5 = 60%)", () => {
      const m = computeSecurityMetrics(records);
      expect(m.doors_secure_rate).toBe(60);
    });

    it("calculates windows_secure_rate correctly (3/5 = 60%)", () => {
      const m = computeSecurityMetrics(records);
      expect(m.windows_secure_rate).toBe(60);
    });

    it("calculates lighting_working_rate correctly (3/5 = 60%)", () => {
      const m = computeSecurityMetrics(records);
      expect(m.lighting_working_rate).toBe(60);
    });

    it("calculates perimeter_secure_rate correctly (3/5 = 60%)", () => {
      const m = computeSecurityMetrics(records);
      expect(m.perimeter_secure_rate).toBe(60);
    });

    it("calculates children_accounted_rate correctly (4/5 = 80%)", () => {
      const m = computeSecurityMetrics(records);
      expect(m.children_accounted_rate).toBe(80);
    });

    it("groups by_event_type correctly", () => {
      const m = computeSecurityMetrics(records);
      expect(m.by_event_type).toEqual({ routine_check: 1, security_incident: 1, alarm_test: 1, key_audit: 1, perimeter_inspection: 1 });
    });

    it("groups by_security_status correctly", () => {
      const m = computeSecurityMetrics(records);
      expect(m.by_security_status).toEqual({ secure: 2, breach: 1, minor_issue: 1, major_issue: 1 });
    });

    it("groups by_alarm_status correctly", () => {
      const m = computeSecurityMetrics(records);
      expect(m.by_alarm_status).toEqual({ operational: 2, fault_detected: 1, disabled: 1, not_installed: 1 });
    });

    it("groups by_key_management correctly", () => {
      const m = computeSecurityMetrics(records);
      expect(m.by_key_management).toEqual({ all_accounted: 2, key_missing: 1, key_replaced: 1, audit_due: 1 });
    });
  });

  describe("event type counts", () => {
    it("counts routine_check events", () => {
      const records = [
        makeRecord({ event_type: "routine_check" }),
        makeRecord({ event_type: "routine_check" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.routine_check_count).toBe(2);
    });

    it("counts security_incident events", () => {
      const records = [
        makeRecord({ event_type: "security_incident" }),
        makeRecord({ event_type: "security_incident" }),
        makeRecord({ event_type: "security_incident" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.security_incident_count).toBe(3);
    });

    it("does not count alarm_test as routine_check", () => {
      const records = [makeRecord({ event_type: "alarm_test" })];
      const m = computeSecurityMetrics(records);
      expect(m.routine_check_count).toBe(0);
    });

    it("does not count key_audit as security_incident", () => {
      const records = [makeRecord({ event_type: "key_audit" })];
      const m = computeSecurityMetrics(records);
      expect(m.security_incident_count).toBe(0);
    });

    it("does not count perimeter_inspection as routine_check", () => {
      const records = [makeRecord({ event_type: "perimeter_inspection" })];
      const m = computeSecurityMetrics(records);
      expect(m.routine_check_count).toBe(0);
    });

    it("does not count lock_check as security_incident", () => {
      const records = [makeRecord({ event_type: "lock_check" })];
      const m = computeSecurityMetrics(records);
      expect(m.security_incident_count).toBe(0);
    });

    it("does not count other as any specific type", () => {
      const records = [makeRecord({ event_type: "other" })];
      const m = computeSecurityMetrics(records);
      expect(m.routine_check_count).toBe(0);
      expect(m.security_incident_count).toBe(0);
    });
  });

  describe("secure_rate", () => {
    it("returns 100 when all secure", () => {
      const records = [
        makeRecord({ security_status: "secure" }),
        makeRecord({ security_status: "secure" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.secure_rate).toBe(100);
    });

    it("returns 0 when none secure", () => {
      const records = [
        makeRecord({ security_status: "breach" }),
        makeRecord({ security_status: "major_issue" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.secure_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ security_status: "secure" }),
        makeRecord({ security_status: "breach" }),
        makeRecord({ security_status: "major_issue" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.secure_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ security_status: "secure" }),
        makeRecord({ security_status: "secure" }),
        makeRecord({ security_status: "breach" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.secure_rate).toBe(66.7);
    });

    it("uses all records as denominator", () => {
      const records = [
        makeRecord({ security_status: "secure" }),
        makeRecord({ security_status: "minor_issue" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.secure_rate).toBe(50);
    });
  });

  describe("breach_count and major_issue_count", () => {
    it("counts breach records accurately", () => {
      const records = [
        makeRecord({ security_status: "breach" }),
        makeRecord({ security_status: "breach" }),
        makeRecord({ security_status: "secure" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.breach_count).toBe(2);
    });

    it("counts major_issue records accurately", () => {
      const records = [
        makeRecord({ security_status: "major_issue" }),
        makeRecord({ security_status: "major_issue" }),
        makeRecord({ security_status: "major_issue" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.major_issue_count).toBe(3);
    });

    it("does not count minor_issue as breach", () => {
      const records = [makeRecord({ security_status: "minor_issue" })];
      const m = computeSecurityMetrics(records);
      expect(m.breach_count).toBe(0);
    });

    it("does not count minor_issue as major_issue", () => {
      const records = [makeRecord({ security_status: "minor_issue" })];
      const m = computeSecurityMetrics(records);
      expect(m.major_issue_count).toBe(0);
    });

    it("does not count not_checked as breach", () => {
      const records = [makeRecord({ security_status: "not_checked" })];
      const m = computeSecurityMetrics(records);
      expect(m.breach_count).toBe(0);
    });
  });

  describe("alarm_operational_rate", () => {
    it("returns 100 when all operational", () => {
      const records = [
        makeRecord({ alarm_status: "operational" }),
        makeRecord({ alarm_status: "operational" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.alarm_operational_rate).toBe(100);
    });

    it("returns 0 when none operational", () => {
      const records = [
        makeRecord({ alarm_status: "fault_detected" }),
        makeRecord({ alarm_status: "disabled" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.alarm_operational_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ alarm_status: "operational" }),
        makeRecord({ alarm_status: "fault_detected" }),
        makeRecord({ alarm_status: "disabled" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.alarm_operational_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ alarm_status: "operational" }),
        makeRecord({ alarm_status: "operational" }),
        makeRecord({ alarm_status: "disabled" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.alarm_operational_rate).toBe(66.7);
    });
  });

  describe("alarm_fault_count", () => {
    it("counts fault_detected records", () => {
      const records = [
        makeRecord({ alarm_status: "fault_detected" }),
        makeRecord({ alarm_status: "fault_detected" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.alarm_fault_count).toBe(2);
    });

    it("does not count disabled as fault_detected", () => {
      const records = [makeRecord({ alarm_status: "disabled" })];
      const m = computeSecurityMetrics(records);
      expect(m.alarm_fault_count).toBe(0);
    });

    it("does not count not_tested as fault_detected", () => {
      const records = [makeRecord({ alarm_status: "not_tested" })];
      const m = computeSecurityMetrics(records);
      expect(m.alarm_fault_count).toBe(0);
    });
  });

  describe("keys_accounted_rate", () => {
    it("returns 100 when all accounted", () => {
      const records = [
        makeRecord({ key_management: "all_accounted" }),
        makeRecord({ key_management: "all_accounted" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.keys_accounted_rate).toBe(100);
    });

    it("returns 0 when none accounted", () => {
      const records = [
        makeRecord({ key_management: "key_missing" }),
        makeRecord({ key_management: "audit_due" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.keys_accounted_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ key_management: "all_accounted" }),
        makeRecord({ key_management: "key_missing" }),
        makeRecord({ key_management: "audit_due" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.keys_accounted_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ key_management: "all_accounted" }),
        makeRecord({ key_management: "all_accounted" }),
        makeRecord({ key_management: "key_missing" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.keys_accounted_rate).toBe(66.7);
    });
  });

  describe("key_missing_count", () => {
    it("counts key_missing records", () => {
      const records = [
        makeRecord({ key_management: "key_missing" }),
        makeRecord({ key_management: "key_missing" }),
        makeRecord({ key_management: "all_accounted" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.key_missing_count).toBe(2);
    });

    it("does not count key_replaced as key_missing", () => {
      const records = [makeRecord({ key_management: "key_replaced" })];
      const m = computeSecurityMetrics(records);
      expect(m.key_missing_count).toBe(0);
    });

    it("does not count audit_due as key_missing", () => {
      const records = [makeRecord({ key_management: "audit_due" })];
      const m = computeSecurityMetrics(records);
      expect(m.key_missing_count).toBe(0);
    });
  });

  describe("doors_secure_rate", () => {
    it("returns 100 when all doors secure", () => {
      const records = [
        makeRecord({ all_doors_secure: true }),
        makeRecord({ all_doors_secure: true }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.doors_secure_rate).toBe(100);
    });

    it("returns 0 when no doors secure", () => {
      const records = [
        makeRecord({ all_doors_secure: false }),
        makeRecord({ all_doors_secure: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.doors_secure_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ all_doors_secure: true }),
        makeRecord({ all_doors_secure: false }),
        makeRecord({ all_doors_secure: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.doors_secure_rate).toBe(33.3);
    });
  });

  describe("windows_secure_rate", () => {
    it("returns 100 when all windows secure", () => {
      const records = [
        makeRecord({ all_windows_secure: true }),
        makeRecord({ all_windows_secure: true }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.windows_secure_rate).toBe(100);
    });

    it("returns 0 when no windows secure", () => {
      const records = [
        makeRecord({ all_windows_secure: false }),
        makeRecord({ all_windows_secure: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.windows_secure_rate).toBe(0);
    });

    it("calculates with rounding (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ all_windows_secure: true }),
        makeRecord({ all_windows_secure: true }),
        makeRecord({ all_windows_secure: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.windows_secure_rate).toBe(66.7);
    });
  });

  describe("lighting_working_rate", () => {
    it("returns 100 when all lighting working", () => {
      const records = [
        makeRecord({ external_lighting_working: true }),
        makeRecord({ external_lighting_working: true }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.lighting_working_rate).toBe(100);
    });

    it("returns 0 when no lighting working", () => {
      const records = [
        makeRecord({ external_lighting_working: false }),
        makeRecord({ external_lighting_working: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.lighting_working_rate).toBe(0);
    });

    it("calculates 50% correctly", () => {
      const records = [
        makeRecord({ external_lighting_working: true }),
        makeRecord({ external_lighting_working: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.lighting_working_rate).toBe(50);
    });
  });

  describe("perimeter_secure_rate", () => {
    it("returns 100 when all perimeters secure", () => {
      const records = [
        makeRecord({ perimeter_secure: true }),
        makeRecord({ perimeter_secure: true }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.perimeter_secure_rate).toBe(100);
    });

    it("returns 0 when no perimeters secure", () => {
      const records = [
        makeRecord({ perimeter_secure: false }),
        makeRecord({ perimeter_secure: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.perimeter_secure_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ perimeter_secure: true }),
        makeRecord({ perimeter_secure: false }),
        makeRecord({ perimeter_secure: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.perimeter_secure_rate).toBe(33.3);
    });
  });

  describe("children_accounted_rate", () => {
    it("returns 100 when all children accounted", () => {
      const records = [
        makeRecord({ children_accounted_for: true }),
        makeRecord({ children_accounted_for: true }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.children_accounted_rate).toBe(100);
    });

    it("returns 0 when no children accounted", () => {
      const records = [
        makeRecord({ children_accounted_for: false }),
        makeRecord({ children_accounted_for: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.children_accounted_rate).toBe(0);
    });

    it("calculates with rounding (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ children_accounted_for: true }),
        makeRecord({ children_accounted_for: true }),
        makeRecord({ children_accounted_for: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.children_accounted_rate).toBe(66.7);
    });

    it("calculates (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ children_accounted_for: true }),
        makeRecord({ children_accounted_for: false }),
        makeRecord({ children_accounted_for: false }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.children_accounted_rate).toBe(33.3);
    });
  });

  describe("check_overdue_count", () => {
    it("counts records with past next_check_date", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(5) }),
        makeRecord({ next_check_date: daysAgo(10) }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.check_overdue_count).toBe(2);
    });

    it("does not count records with future next_check_date", () => {
      const records = [
        makeRecord({ next_check_date: daysFromNow(10) }),
        makeRecord({ next_check_date: daysFromNow(20) }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.check_overdue_count).toBe(0);
    });

    it("does not count records with null next_check_date", () => {
      const records = [
        makeRecord({ next_check_date: null }),
        makeRecord({ next_check_date: null }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.check_overdue_count).toBe(0);
    });

    it("counts mixed past/future/null correctly", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(5) }),
        makeRecord({ next_check_date: daysFromNow(5) }),
        makeRecord({ next_check_date: null }),
      ];
      const m = computeSecurityMetrics(records);
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
      const m = computeSecurityMetrics(records);
      expect(m.check_overdue_count).toBe(3);
    });
  });

  describe("by_event_type breakdown", () => {
    it("counts each event type separately", () => {
      const records = [
        makeRecord({ event_type: "routine_check" }),
        makeRecord({ event_type: "routine_check" }),
        makeRecord({ event_type: "security_incident" }),
        makeRecord({ event_type: "alarm_test" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.by_event_type).toEqual({ routine_check: 2, security_incident: 1, alarm_test: 1 });
    });

    it("handles all ten event types", () => {
      const types: SecurityEventType[] = ["routine_check", "alarm_test", "key_audit", "perimeter_inspection", "lock_check", "security_incident", "access_control_review", "lighting_check", "cctv_check", "other"];
      const records = types.map((t) => makeRecord({ event_type: t }));
      const m = computeSecurityMetrics(records);
      for (const t of types) {
        expect(m.by_event_type[t]).toBe(1);
      }
    });
  });

  describe("by_security_status breakdown", () => {
    it("counts each security status separately", () => {
      const records = [
        makeRecord({ security_status: "secure" }),
        makeRecord({ security_status: "secure" }),
        makeRecord({ security_status: "breach" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.by_security_status).toEqual({ secure: 2, breach: 1 });
    });

    it("handles all five security statuses", () => {
      const statuses: SecurityStatus[] = ["secure", "minor_issue", "major_issue", "breach", "not_checked"];
      const records = statuses.map((s) => makeRecord({ security_status: s }));
      const m = computeSecurityMetrics(records);
      for (const s of statuses) {
        expect(m.by_security_status[s]).toBe(1);
      }
    });
  });

  describe("by_alarm_status breakdown", () => {
    it("counts each alarm status separately", () => {
      const records = [
        makeRecord({ alarm_status: "operational" }),
        makeRecord({ alarm_status: "operational" }),
        makeRecord({ alarm_status: "fault_detected" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.by_alarm_status).toEqual({ operational: 2, fault_detected: 1 });
    });

    it("handles all five alarm statuses", () => {
      const statuses: AlarmStatus[] = ["operational", "fault_detected", "disabled", "not_installed", "not_tested"];
      const records = statuses.map((s) => makeRecord({ alarm_status: s }));
      const m = computeSecurityMetrics(records);
      for (const s of statuses) {
        expect(m.by_alarm_status[s]).toBe(1);
      }
    });
  });

  describe("by_key_management breakdown", () => {
    it("counts each key management status separately", () => {
      const records = [
        makeRecord({ key_management: "all_accounted" }),
        makeRecord({ key_management: "all_accounted" }),
        makeRecord({ key_management: "key_missing" }),
      ];
      const m = computeSecurityMetrics(records);
      expect(m.by_key_management).toEqual({ all_accounted: 2, key_missing: 1 });
    });

    it("handles all five key management statuses", () => {
      const statuses: KeyManagement[] = ["all_accounted", "key_missing", "key_replaced", "audit_due", "not_checked"];
      const records = statuses.map((s) => makeRecord({ key_management: s }));
      const m = computeSecurityMetrics(records);
      for (const s of statuses) {
        expect(m.by_key_management[s]).toBe(1);
      }
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: SecurityRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            event_type: i % 3 === 0 ? "routine_check" : i % 3 === 1 ? "security_incident" : "alarm_test",
            security_status: "secure",
            alarm_status: "operational",
            key_management: "all_accounted",
            all_doors_secure: true,
            all_windows_secure: true,
            external_lighting_working: true,
            perimeter_secure: true,
            children_accounted_for: true,
          }),
        );
      }
      const m = computeSecurityMetrics(records);
      expect(m.total_records).toBe(100);
      expect(m.secure_rate).toBe(100);
      expect(m.alarm_operational_rate).toBe(100);
      expect(m.keys_accounted_rate).toBe(100);
      expect(m.doors_secure_rate).toBe(100);
      expect(m.windows_secure_rate).toBe(100);
      expect(m.lighting_working_rate).toBe(100);
      expect(m.perimeter_secure_rate).toBe(100);
      expect(m.children_accounted_rate).toBe(100);
      // routine_check: i%3===0 => 34, security_incident: i%3===1 => 33, alarm_test: i%3===2 => 33
      expect(m.routine_check_count).toBe(34);
      expect(m.security_incident_count).toBe(33);
    });
  });
});

// ── identifySecurityAlerts ────────────────────────────────────────────────

describe("identifySecurityAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifySecurityAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          security_status: "secure",
          children_accounted_for: true,
          key_management: "all_accounted",
          alarm_status: "operational",
          next_check_date: daysFromNow(30),
        }),
      ];
      const alerts = identifySecurityAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty for single well-formed record with future check", () => {
      const records = [
        makeRecord({
          security_status: "secure",
          children_accounted_for: true,
          key_management: "all_accounted",
          alarm_status: "operational",
          next_check_date: daysFromNow(10),
        }),
      ];
      const alerts = identifySecurityAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty when security_status is minor_issue (not breach)", () => {
      const records = [
        makeRecord({
          security_status: "minor_issue",
          children_accounted_for: true,
          key_management: "all_accounted",
          alarm_status: "operational",
        }),
      ];
      const alerts = identifySecurityAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("security_breach alert", () => {
    it("fires for security_status = breach", () => {
      const records = [makeRecord({ security_status: "breach", event_date: "2026-05-01" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "security_breach");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ security_status: "breach", event_date: "2026-05-01" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "security_breach")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "breach-1", security_status: "breach", event_date: "2026-05-01" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "security_breach")!;
      expect(alert.id).toBe("breach-1");
    });

    it("includes event_date in message", () => {
      const records = [makeRecord({ security_status: "breach", event_date: "2026-04-15" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "security_breach")!;
      expect(alert.message).toContain("2026-04-15");
    });

    it("fires per record for multiple breaches", () => {
      const records = [
        makeRecord({ security_status: "breach", event_date: "2026-05-01" }),
        makeRecord({ security_status: "breach", event_date: "2026-04-01" }),
        makeRecord({ security_status: "breach", event_date: "2026-03-01" }),
      ];
      const alerts = identifySecurityAlerts(records);
      const breachAlerts = alerts.filter((a) => a.type === "security_breach");
      expect(breachAlerts).toHaveLength(3);
    });

    it("does not fire for secure status", () => {
      const records = [makeRecord({ security_status: "secure" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "security_breach");
      expect(alert).toBeUndefined();
    });

    it("does not fire for minor_issue status", () => {
      const records = [makeRecord({ security_status: "minor_issue" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "security_breach");
      expect(alert).toBeUndefined();
    });

    it("does not fire for major_issue status", () => {
      const records = [makeRecord({ security_status: "major_issue" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "security_breach");
      expect(alert).toBeUndefined();
    });

    it("does not fire for not_checked status", () => {
      const records = [makeRecord({ security_status: "not_checked" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "security_breach");
      expect(alert).toBeUndefined();
    });

    it("message contains investigate immediately wording", () => {
      const records = [makeRecord({ security_status: "breach", event_date: "2026-05-01" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "security_breach")!;
      expect(alert.message).toContain("investigate immediately");
    });
  });

  describe("children_not_accounted alert", () => {
    it("fires for children_accounted_for = false", () => {
      const records = [makeRecord({ children_accounted_for: false, event_date: "2026-05-01" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_accounted");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ children_accounted_for: false, event_date: "2026-05-01" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_accounted")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "child-1", children_accounted_for: false, event_date: "2026-05-01" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_accounted")!;
      expect(alert.id).toBe("child-1");
    });

    it("includes event_date in message", () => {
      const records = [makeRecord({ children_accounted_for: false, event_date: "2026-03-20" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_accounted")!;
      expect(alert.message).toContain("2026-03-20");
    });

    it("fires per record for multiple unaccounted records", () => {
      const records = [
        makeRecord({ children_accounted_for: false, event_date: "2026-05-01" }),
        makeRecord({ children_accounted_for: false, event_date: "2026-04-01" }),
      ];
      const alerts = identifySecurityAlerts(records);
      const childAlerts = alerts.filter((a) => a.type === "children_not_accounted");
      expect(childAlerts).toHaveLength(2);
    });

    it("does not fire when children_accounted_for = true", () => {
      const records = [makeRecord({ children_accounted_for: true })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_accounted");
      expect(alert).toBeUndefined();
    });

    it("message contains verify immediately wording", () => {
      const records = [makeRecord({ children_accounted_for: false, event_date: "2026-05-01" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_accounted")!;
      expect(alert.message).toContain("verify immediately");
    });
  });

  describe("key_missing alert", () => {
    it("fires when >= 1 key is missing", () => {
      const records = [makeRecord({ key_management: "key_missing" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ key_management: "key_missing" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing")!;
      expect(alert.severity).toBe("high");
    });

    it("has id key_missing", () => {
      const records = [makeRecord({ key_management: "key_missing" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing")!;
      expect(alert.id).toBe("key_missing");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ key_management: "key_missing" }),
        makeRecord({ key_management: "key_missing" }),
        makeRecord({ key_management: "key_missing" }),
      ];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing")!;
      expect(alert.message).toContain("3");
    });

    it("uses singular 'key' for 1 missing", () => {
      const records = [makeRecord({ key_management: "key_missing" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing")!;
      expect(alert.message).toContain("1 missing key");
      expect(alert.message).not.toContain("1 missing keys");
    });

    it("uses plural 'keys' for multiple missing", () => {
      const records = [
        makeRecord({ key_management: "key_missing" }),
        makeRecord({ key_management: "key_missing" }),
      ];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing")!;
      expect(alert.message).toContain("2 missing keys");
    });

    it("does not fire when key_management = all_accounted", () => {
      const records = [makeRecord({ key_management: "all_accounted" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing");
      expect(alert).toBeUndefined();
    });

    it("does not fire when key_management = key_replaced", () => {
      const records = [makeRecord({ key_management: "key_replaced" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing");
      expect(alert).toBeUndefined();
    });

    it("does not fire when key_management = audit_due", () => {
      const records = [makeRecord({ key_management: "audit_due" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing");
      expect(alert).toBeUndefined();
    });

    it("does not fire when key_management = not_checked", () => {
      const records = [makeRecord({ key_management: "not_checked" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ key_management: "key_missing" }),
        makeRecord({ key_management: "key_missing" }),
        makeRecord({ key_management: "key_missing" }),
      ];
      const alerts = identifySecurityAlerts(records);
      const keyAlerts = alerts.filter((a) => a.type === "key_missing");
      expect(keyAlerts).toHaveLength(1);
    });

    it("message contains replace locks wording", () => {
      const records = [makeRecord({ key_management: "key_missing" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing")!;
      expect(alert.message).toContain("replace locks if necessary");
    });

    it("fires at exactly threshold of 1", () => {
      const records = [makeRecord({ key_management: "key_missing" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing");
      expect(alert).toBeDefined();
    });
  });

  describe("alarm_fault alert", () => {
    it("fires when >= 1 alarm fault detected", () => {
      const records = [makeRecord({ alarm_status: "fault_detected" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ alarm_status: "fault_detected" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault")!;
      expect(alert.severity).toBe("high");
    });

    it("has id alarm_fault", () => {
      const records = [makeRecord({ alarm_status: "fault_detected" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault")!;
      expect(alert.id).toBe("alarm_fault");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ alarm_status: "fault_detected" }),
        makeRecord({ alarm_status: "fault_detected" }),
        makeRecord({ alarm_status: "fault_detected" }),
      ];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault")!;
      expect(alert.message).toContain("3");
    });

    it("uses singular 'fault' for 1 fault", () => {
      const records = [makeRecord({ alarm_status: "fault_detected" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault")!;
      expect(alert.message).toContain("1 alarm fault");
      expect(alert.message).not.toContain("1 alarm faults");
    });

    it("uses plural 'faults' for multiple faults", () => {
      const records = [
        makeRecord({ alarm_status: "fault_detected" }),
        makeRecord({ alarm_status: "fault_detected" }),
      ];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault")!;
      expect(alert.message).toContain("2 alarm faults");
    });

    it("does not fire when alarm_status = operational", () => {
      const records = [makeRecord({ alarm_status: "operational" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault");
      expect(alert).toBeUndefined();
    });

    it("does not fire when alarm_status = disabled", () => {
      const records = [makeRecord({ alarm_status: "disabled" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault");
      expect(alert).toBeUndefined();
    });

    it("does not fire when alarm_status = not_installed", () => {
      const records = [makeRecord({ alarm_status: "not_installed" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault");
      expect(alert).toBeUndefined();
    });

    it("does not fire when alarm_status = not_tested", () => {
      const records = [makeRecord({ alarm_status: "not_tested" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ alarm_status: "fault_detected" }),
        makeRecord({ alarm_status: "fault_detected" }),
      ];
      const alerts = identifySecurityAlerts(records);
      const alarmAlerts = alerts.filter((a) => a.type === "alarm_fault");
      expect(alarmAlerts).toHaveLength(1);
    });

    it("message contains arrange repair wording", () => {
      const records = [makeRecord({ alarm_status: "fault_detected" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault")!;
      expect(alert.message).toContain("arrange repair");
    });

    it("fires at exactly threshold of 1", () => {
      const records = [makeRecord({ alarm_status: "fault_detected" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault");
      expect(alert).toBeDefined();
    });
  });

  describe("check_overdue alert", () => {
    it("fires when >= 1 check is overdue", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id check_overdue", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.id).toBe("check_overdue");
    });

    it("uses singular 'check is' for 1 overdue", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("1 security check is overdue");
    });

    it("uses plural 'checks are' for multiple overdue", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(5) }),
        makeRecord({ next_check_date: daysAgo(10) }),
        makeRecord({ next_check_date: daysAgo(15) }),
      ];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("3 security checks are overdue");
    });

    it("does not fire when all checks are in the future", () => {
      const records = [
        makeRecord({ next_check_date: daysFromNow(10) }),
        makeRecord({ next_check_date: daysFromNow(20) }),
      ];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all next_check_date are null", () => {
      const records = [
        makeRecord({ next_check_date: null }),
        makeRecord({ next_check_date: null }),
      ];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ next_check_date: daysAgo(5) }),
        makeRecord({ next_check_date: daysAgo(10) }),
      ];
      const alerts = identifySecurityAlerts(records);
      const overdueAlerts = alerts.filter((a) => a.type === "check_overdue");
      expect(overdueAlerts).toHaveLength(1);
    });

    it("message contains schedule promptly wording", () => {
      const records = [makeRecord({ next_check_date: daysAgo(5) })];
      const alerts = identifySecurityAlerts(records);
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
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue")!;
      expect(alert.message).toContain("2 security checks are overdue");
    });

    it("fires at exactly threshold of 1", () => {
      const records = [makeRecord({ next_check_date: daysAgo(1) })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeDefined();
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        makeRecord({ id: "r1", security_status: "breach", event_date: "2026-05-01", children_accounted_for: false, key_management: "key_missing", alarm_status: "fault_detected", next_check_date: daysAgo(5) }),
      ];
      const alerts = identifySecurityAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("security_breach");
      expect(types).toContain("children_not_accounted");
      expect(types).toContain("key_missing");
      expect(types).toContain("alarm_fault");
      expect(types).toContain("check_overdue");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({ security_status: "breach", event_date: "2026-05-01", children_accounted_for: false, key_management: "key_missing", alarm_status: "fault_detected", next_check_date: daysAgo(5) }),
      ];
      const alerts = identifySecurityAlerts(records);
      // security_breach=1, children_not_accounted=1, key_missing=1, alarm_fault=1, check_overdue=1
      expect(alerts).toHaveLength(5);
    });

    it("per-record alerts multiply while threshold alerts stay singular", () => {
      const records = [
        makeRecord({ security_status: "breach", event_date: "2026-05-01", children_accounted_for: false, key_management: "key_missing", alarm_status: "fault_detected", next_check_date: daysAgo(5) }),
        makeRecord({ security_status: "breach", event_date: "2026-04-01", children_accounted_for: false, key_management: "key_missing", alarm_status: "fault_detected", next_check_date: daysAgo(10) }),
      ];
      const alerts = identifySecurityAlerts(records);
      expect(alerts.filter((a) => a.type === "security_breach")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "children_not_accounted")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "key_missing")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "alarm_fault")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "check_overdue")).toHaveLength(1);
    });

    it("breach alert appears without other alert types when only breach present", () => {
      const records = [
        makeRecord({ security_status: "breach", event_date: "2026-05-01", children_accounted_for: true, key_management: "all_accounted", alarm_status: "operational" }),
      ];
      const alerts = identifySecurityAlerts(records);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("security_breach");
    });

    it("children_not_accounted alert appears without other alert types", () => {
      const records = [
        makeRecord({ security_status: "secure", children_accounted_for: false, event_date: "2026-05-01", key_management: "all_accounted", alarm_status: "operational" }),
      ];
      const alerts = identifySecurityAlerts(records);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("children_not_accounted");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ security_status: "breach", event_date: "2026-05-01" }),
      ];
      const alerts = identifySecurityAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ security_status: "breach", event_date: "2026-05-01", children_accounted_for: false, key_management: "key_missing", alarm_status: "fault_detected", next_check_date: daysAgo(5) }),
      ];
      const alerts = identifySecurityAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ security_status: "breach", event_date: "2026-05-01" })];
      const alerts = identifySecurityAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });

    it("id is always a non-empty string", () => {
      const records = [
        makeRecord({ security_status: "breach", event_date: "2026-05-01", key_management: "key_missing", alarm_status: "fault_detected", next_check_date: daysAgo(5), children_accounted_for: false }),
      ];
      const alerts = identifySecurityAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.id).toBe("string");
        expect(alert.id.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("secure status does not trigger security_breach", () => {
      const records = [makeRecord({ security_status: "secure" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "security_breach");
      expect(alert).toBeUndefined();
    });

    it("children_accounted_for=true does not trigger children_not_accounted", () => {
      const records = [makeRecord({ children_accounted_for: true })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_accounted");
      expect(alert).toBeUndefined();
    });

    it("fully clean records trigger no alerts", () => {
      const records = [
        makeRecord({
          security_status: "secure",
          children_accounted_for: true,
          key_management: "all_accounted",
          alarm_status: "operational",
          next_check_date: daysFromNow(30),
        }),
      ];
      const alerts = identifySecurityAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("key_replaced does not trigger key_missing alert", () => {
      const records = [makeRecord({ key_management: "key_replaced" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "key_missing");
      expect(alert).toBeUndefined();
    });

    it("disabled alarm does not trigger alarm_fault alert", () => {
      const records = [makeRecord({ alarm_status: "disabled" })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "alarm_fault");
      expect(alert).toBeUndefined();
    });

    it("null next_check_date does not trigger check_overdue", () => {
      const records = [makeRecord({ next_check_date: null })];
      const alerts = identifySecurityAlerts(records);
      const alert = alerts.find((a) => a.type === "check_overdue");
      expect(alert).toBeUndefined();
    });

    it("future next_check_date does not trigger check_overdue", () => {
      const records = [makeRecord({ next_check_date: daysFromNow(30) })];
      const alerts = identifySecurityAlerts(records);
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
    expect(r.event_type).toBe("routine_check");
    expect(r.event_date).toBe("2026-05-01");
    expect(r.security_status).toBe("secure");
    expect(r.alarm_status).toBe("operational");
    expect(r.key_management).toBe("all_accounted");
    expect(r.all_doors_secure).toBe(true);
    expect(r.all_windows_secure).toBe(true);
    expect(r.external_lighting_working).toBe(true);
    expect(r.perimeter_secure).toBe(true);
    expect(r.visitors_log_checked).toBe(true);
    expect(r.children_accounted_for).toBe(true);
    expect(r.issues_found).toEqual([]);
    expect(r.actions_taken).toEqual([]);
    expect(r.checked_by).toBe("Staff Member");
    expect(r.next_check_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ event_type: "security_incident", security_status: "breach" });
    expect(r.event_type).toBe("security_incident");
    expect(r.security_status).toBe("breach");
    // defaults still apply
    expect(r.alarm_status).toBe("operational");
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
    const r = makeRecord({ next_check_date: null, notes: null });
    expect(r.next_check_date).toBeNull();
    expect(r.notes).toBeNull();
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
    const r = makeRecord({ issues_found: ["broken window", "door ajar"] });
    expect(r.issues_found).toEqual(["broken window", "door ajar"]);
  });

  it("allows setting actions_taken array", () => {
    const r = makeRecord({ actions_taken: ["repaired lock", "replaced bulb"] });
    expect(r.actions_taken).toEqual(["repaired lock", "replaced bulb"]);
  });
});
