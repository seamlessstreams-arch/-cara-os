import { describe, it, expect } from "vitest";
import {
  computeKeyHoldingMetrics,
  identifyKeyHoldingAlerts,
  type KeyHoldingRecord,
} from "./key-holding-service";

function makeRecord(overrides: Partial<KeyHoldingRecord> = {}): KeyHoldingRecord {
  return {
    id: "kh-1",
    home_id: "home-1",
    key_event_type: "key_issued",
    key_type: "front_door",
    key_status: "in_use",
    audit_result: "all_accounted",
    event_date: "2026-05-10",
    key_number: "FD-001",
    holder_name: "Jane Doe",
    holder_role: "Senior Carer",
    all_keys_accounted: true,
    register_updated: true,
    lock_changed_after_loss: false,
    incident_reported: false,
    police_notified: false,
    manager_informed: true,
    spare_keys_secure: true,
    medication_keys_separate: true,
    keys_checked_count: 10,
    keys_missing_count: 0,
    issues_found: [],
    actions_taken: [],
    recorded_by: "Admin",
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

describe("key-holding-service", () => {
  // -- computeKeyHoldingMetrics --------------------------------------------------

  describe("computeKeyHoldingMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeKeyHoldingMetrics([]);
      expect(m.total_events).toBe(0);
      expect(m.keys_issued_count).toBe(0);
      expect(m.keys_lost_count).toBe(0);
      expect(m.keys_stolen_count).toBe(0);
      expect(m.all_accounted_rate).toBeNull();;
      expect(m.total_keys_checked).toBe(0);
      expect(m.total_keys_missing).toBe(0);
    });

    it("counts event types correctly", () => {
      const records = [
        makeRecord({ key_event_type: "key_issued" }),
        makeRecord({ id: "r2", key_event_type: "key_returned" }),
        makeRecord({ id: "r3", key_event_type: "key_lost" }),
        makeRecord({ id: "r4", key_event_type: "key_stolen" }),
        makeRecord({ id: "r5", key_event_type: "key_audit" }),
      ];
      const m = computeKeyHoldingMetrics(records);
      expect(m.keys_issued_count).toBe(1);
      expect(m.keys_returned_count).toBe(1);
      expect(m.keys_lost_count).toBe(1);
      expect(m.keys_stolen_count).toBe(1);
      expect(m.audits_count).toBe(1);
    });

    it("computes all_accounted_rate and discrepancy count", () => {
      const records = [
        makeRecord({ all_keys_accounted: true, audit_result: "all_accounted" }),
        makeRecord({ id: "r2", all_keys_accounted: false, audit_result: "discrepancy_found" }),
      ];
      const m = computeKeyHoldingMetrics(records);
      expect(m.all_accounted_rate).toBe(50);
      expect(m.discrepancy_count).toBe(1);
    });

    it("computes boolean rates", () => {
      const records = [
        makeRecord({ register_updated: true, spare_keys_secure: true, medication_keys_separate: false }),
        makeRecord({ id: "r2", register_updated: false, spare_keys_secure: false, medication_keys_separate: true }),
      ];
      const m = computeKeyHoldingMetrics(records);
      expect(m.register_updated_rate).toBe(50);
      expect(m.spare_keys_secure_rate).toBe(50);
      expect(m.medication_keys_separate_rate).toBe(50);
    });

    it("sums keys checked and missing", () => {
      const records = [
        makeRecord({ keys_checked_count: 10, keys_missing_count: 1 }),
        makeRecord({ id: "r2", keys_checked_count: 15, keys_missing_count: 2 }),
      ];
      const m = computeKeyHoldingMetrics(records);
      expect(m.total_keys_checked).toBe(25);
      expect(m.total_keys_missing).toBe(3);
    });
  });

  // -- identifyKeyHoldingAlerts --------------------------------------------------

  describe("identifyKeyHoldingAlerts", () => {
    it("returns no alerts for empty data", () => {
      expect(identifyKeyHoldingAlerts([])).toHaveLength(0);
    });

    it("fires critical key_stolen", () => {
      const records = [makeRecord({ key_event_type: "key_stolen" })];
      const alerts = identifyKeyHoldingAlerts(records);
      const stolen = alerts.find((a) => a.type === "key_stolen");
      expect(stolen).toBeDefined();
      expect(stolen!.severity).toBe("critical");
    });

    it("fires high lost_no_lock_change when key lost without lock change", () => {
      const records = [makeRecord({ key_event_type: "key_lost", lock_changed_after_loss: false })];
      const alerts = identifyKeyHoldingAlerts(records);
      expect(alerts.find((a) => a.type === "lost_no_lock_change")).toBeDefined();
    });

    it("fires high audit_discrepancy when >= 1 discrepancy found", () => {
      const records = [makeRecord({ audit_result: "discrepancy_found" })];
      const alerts = identifyKeyHoldingAlerts(records);
      expect(alerts.find((a) => a.type === "audit_discrepancy")).toBeDefined();
    });

    it("fires medium medication_keys_not_separate when >= 2 not separate", () => {
      const records = [
        makeRecord({ medication_keys_separate: false }),
        makeRecord({ id: "r2", medication_keys_separate: false }),
      ];
      const alerts = identifyKeyHoldingAlerts(records);
      expect(alerts.find((a) => a.type === "medication_keys_not_separate")).toBeDefined();
    });

    it("fires medium register_not_updated when >= 3 not updated", () => {
      const records = Array.from({ length: 3 }, (_, i) =>
        makeRecord({ id: `r${i}`, register_updated: false }),
      );
      const alerts = identifyKeyHoldingAlerts(records);
      expect(alerts.find((a) => a.type === "register_not_updated")).toBeDefined();
    });

    it("does NOT fire register_not_updated when only 2 not updated", () => {
      const records = [
        makeRecord({ register_updated: false }),
        makeRecord({ id: "r2", register_updated: false }),
      ];
      const alerts = identifyKeyHoldingAlerts(records);
      expect(alerts.find((a) => a.type === "register_not_updated")).toBeUndefined();
    });
  });
});
