import { describe, it, expect } from "vitest";
import { _testing, type KeyHoldingRecord } from "../key-holding-service";

const { computeKeyHoldingMetrics, identifyKeyHoldingAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<KeyHoldingRecord>): KeyHoldingRecord {
  return {
    id: overrides?.id ?? "k-1",
    home_id: overrides?.home_id ?? "home-1",
    key_event_type: overrides?.key_event_type ?? "key_issued",
    key_type: overrides?.key_type ?? "front_door",
    key_status: overrides?.key_status ?? "in_use",
    audit_result: overrides?.audit_result ?? "all_accounted",
    event_date: overrides?.event_date ?? now.toISOString().split("T")[0],
    key_number: overrides?.key_number ?? "KEY-001",
    holder_name: overrides?.holder_name ?? "Staff A",
    holder_role: overrides?.holder_role ?? "Care Worker",
    all_keys_accounted: overrides?.all_keys_accounted ?? true,
    register_updated: overrides?.register_updated ?? true,
    lock_changed_after_loss: overrides?.lock_changed_after_loss ?? true,
    incident_reported: overrides?.incident_reported ?? true,
    police_notified: overrides?.police_notified ?? false,
    manager_informed: overrides?.manager_informed ?? true,
    spare_keys_secure: overrides?.spare_keys_secure ?? true,
    medication_keys_separate: overrides?.medication_keys_separate ?? true,
    keys_checked_count: overrides?.keys_checked_count ?? 10,
    keys_missing_count: overrides?.keys_missing_count ?? 0,
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    recorded_by: overrides?.recorded_by ?? "Staff A",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("key-holding-service", () => {
  // ── computeKeyHoldingMetrics ────────────────────────────────────────

  describe("computeKeyHoldingMetrics", () => {
    describe("empty records", () => {
      it("returns zeros for all fields", () => {
        const m = computeKeyHoldingMetrics([]);
        expect(m.total_events).toBe(0);
        expect(m.keys_issued_count).toBe(0);
        expect(m.keys_returned_count).toBe(0);
        expect(m.keys_lost_count).toBe(0);
        expect(m.keys_stolen_count).toBe(0);
        expect(m.audits_count).toBe(0);
        expect(m.all_accounted_rate).toBe(0);
        expect(m.discrepancy_count).toBe(0);
        expect(m.register_updated_rate).toBe(0);
        expect(m.lock_changed_rate).toBe(0);
        expect(m.spare_keys_secure_rate).toBe(0);
        expect(m.medication_keys_separate_rate).toBe(0);
        expect(m.total_keys_checked).toBe(0);
        expect(m.total_keys_missing).toBe(0);
      });

      it("returns empty breakdowns", () => {
        const m = computeKeyHoldingMetrics([]);
        expect(m.by_key_event_type).toEqual({});
        expect(m.by_key_type).toEqual({});
        expect(m.by_key_status).toEqual({});
        expect(m.by_audit_result).toEqual({});
      });
    });

    describe("single record defaults", () => {
      it("returns correct counts", () => {
        const m = computeKeyHoldingMetrics([makeRecord()]);
        expect(m.total_events).toBe(1);
        expect(m.keys_issued_count).toBe(1);
        expect(m.keys_returned_count).toBe(0);
        expect(m.keys_lost_count).toBe(0);
        expect(m.keys_stolen_count).toBe(0);
        expect(m.audits_count).toBe(0);
      });

      it("returns 100% for all boolean rates with defaults", () => {
        const m = computeKeyHoldingMetrics([makeRecord()]);
        expect(m.all_accounted_rate).toBe(100);
        expect(m.register_updated_rate).toBe(100);
        expect(m.lock_changed_rate).toBe(100);
        expect(m.spare_keys_secure_rate).toBe(100);
        expect(m.medication_keys_separate_rate).toBe(100);
      });

      it("returns correct key totals", () => {
        const m = computeKeyHoldingMetrics([makeRecord()]);
        expect(m.total_keys_checked).toBe(10);
        expect(m.total_keys_missing).toBe(0);
      });
    });

    describe("event type counting", () => {
      it("counts key_issued", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ key_event_type: "key_issued" })]);
        expect(m.keys_issued_count).toBe(1);
      });

      it("counts key_returned", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ key_event_type: "key_returned" })]);
        expect(m.keys_returned_count).toBe(1);
      });

      it("counts key_lost", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ key_event_type: "key_lost" })]);
        expect(m.keys_lost_count).toBe(1);
      });

      it("counts key_stolen", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ key_event_type: "key_stolen" })]);
        expect(m.keys_stolen_count).toBe(1);
      });

      it("counts key_audit", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ key_event_type: "key_audit" })]);
        expect(m.audits_count).toBe(1);
      });
    });

    describe("discrepancy_count", () => {
      it("counts discrepancy_found", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ audit_result: "discrepancy_found" })]);
        expect(m.discrepancy_count).toBe(1);
      });

      it("does not count all_accounted", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ audit_result: "all_accounted" })]);
        expect(m.discrepancy_count).toBe(0);
      });

      it("does not count keys_missing", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ audit_result: "keys_missing" })]);
        expect(m.discrepancy_count).toBe(0);
      });
    });

    describe("boolean rates", () => {
      it("all_accounted_rate 0 when false", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ all_keys_accounted: false })]);
        expect(m.all_accounted_rate).toBe(0);
      });

      it("register_updated_rate 0 when false", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ register_updated: false })]);
        expect(m.register_updated_rate).toBe(0);
      });

      it("lock_changed_rate 0 when false", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ lock_changed_after_loss: false })]);
        expect(m.lock_changed_rate).toBe(0);
      });

      it("spare_keys_secure_rate 0 when false", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ spare_keys_secure: false })]);
        expect(m.spare_keys_secure_rate).toBe(0);
      });

      it("medication_keys_separate_rate 0 when false", () => {
        const m = computeKeyHoldingMetrics([makeRecord({ medication_keys_separate: false })]);
        expect(m.medication_keys_separate_rate).toBe(0);
      });

      it("calculates mixed boolean rates correctly", () => {
        const records = [
          makeRecord({ all_keys_accounted: true }),
          makeRecord({ all_keys_accounted: false }),
          makeRecord({ all_keys_accounted: true }),
        ];
        const m = computeKeyHoldingMetrics(records);
        expect(m.all_accounted_rate).toBe(66.7);
      });
    });

    describe("key totals", () => {
      it("sums keys_checked_count", () => {
        const records = [
          makeRecord({ keys_checked_count: 5 }),
          makeRecord({ keys_checked_count: 8 }),
        ];
        const m = computeKeyHoldingMetrics(records);
        expect(m.total_keys_checked).toBe(13);
      });

      it("sums keys_missing_count", () => {
        const records = [
          makeRecord({ keys_missing_count: 2 }),
          makeRecord({ keys_missing_count: 3 }),
        ];
        const m = computeKeyHoldingMetrics(records);
        expect(m.total_keys_missing).toBe(5);
      });
    });

    describe("by_key_event_type breakdown", () => {
      it("counts all 10 event types", () => {
        const types = [
          "key_issued", "key_returned", "key_audit", "key_lost", "key_stolen",
          "lock_changed", "key_cut", "master_key_check", "spare_key_audit", "other",
        ] as const;
        const records = types.map((t) => makeRecord({ key_event_type: t }));
        const m = computeKeyHoldingMetrics(records);
        for (const t of types) expect(m.by_key_event_type[t]).toBe(1);
      });
    });

    describe("by_key_type breakdown", () => {
      it("counts all 10 key types", () => {
        const types = [
          "front_door", "back_door", "bedroom", "office", "medication_cabinet",
          "secure_storage", "vehicle", "garden_shed", "master_key", "other",
        ] as const;
        const records = types.map((t) => makeRecord({ key_type: t }));
        const m = computeKeyHoldingMetrics(records);
        for (const t of types) expect(m.by_key_type[t]).toBe(1);
      });
    });

    describe("by_key_status breakdown", () => {
      it("counts all 6 statuses", () => {
        const statuses = ["in_use", "returned", "lost", "stolen", "destroyed", "spare"] as const;
        const records = statuses.map((s) => makeRecord({ key_status: s }));
        const m = computeKeyHoldingMetrics(records);
        for (const s of statuses) expect(m.by_key_status[s]).toBe(1);
      });
    });

    describe("by_audit_result breakdown", () => {
      it("counts all 5 audit results", () => {
        const results = [
          "all_accounted", "discrepancy_found", "keys_missing", "not_audited", "partial_audit",
        ] as const;
        const records = results.map((r) => makeRecord({ audit_result: r }));
        const m = computeKeyHoldingMetrics(records);
        for (const r of results) expect(m.by_audit_result[r]).toBe(1);
      });
    });
  });

  // ── identifyKeyHoldingAlerts ────────────────────────────────────────

  describe("identifyKeyHoldingAlerts", () => {
    describe("no alerts", () => {
      it("returns empty for clean records", () => {
        const alerts = identifyKeyHoldingAlerts([makeRecord()]);
        expect(alerts).toEqual([]);
      });

      it("returns empty for empty records", () => {
        const alerts = identifyKeyHoldingAlerts([]);
        expect(alerts).toEqual([]);
      });
    });

    describe("key_stolen alert", () => {
      it("fires for stolen key", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ key_event_type: "key_stolen", key_type: "back_door", event_date: "2026-05-14" }),
        ]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe("key_stolen");
        expect(alerts[0].severity).toBe("critical");
        expect(alerts[0].message).toContain("back door");
        expect(alerts[0].message).toContain("2026-05-14");
        expect(alerts[0].message).toContain("change locks immediately");
      });

      it("fires per-record for multiple stolen keys", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ id: "k-1", key_event_type: "key_stolen", key_type: "front_door" }),
          makeRecord({ id: "k-2", key_event_type: "key_stolen", key_type: "medication_cabinet" }),
        ]);
        const stolen = alerts.filter((a) => a.type === "key_stolen");
        expect(stolen).toHaveLength(2);
        expect(stolen[0].id).toBe("k-1");
        expect(stolen[1].id).toBe("k-2");
      });

      it("replaces underscores in key type", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ key_event_type: "key_stolen", key_type: "medication_cabinet" }),
        ]);
        expect(alerts[0].message).toContain("medication cabinet");
      });

      it("does not fire for key_lost", () => {
        const alerts = identifyKeyHoldingAlerts([makeRecord({ key_event_type: "key_lost" })]);
        const stolen = alerts.filter((a) => a.type === "key_stolen");
        expect(stolen).toHaveLength(0);
      });
    });

    describe("lost_no_lock_change alert", () => {
      it("fires for 1 lost key without lock change", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ key_event_type: "key_lost", lock_changed_after_loss: false }),
        ]);
        const a = alerts.find((x) => x.type === "lost_no_lock_change");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("1 lost key has");
      });

      it("uses plural for 2+", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ key_event_type: "key_lost", lock_changed_after_loss: false }),
          makeRecord({ key_event_type: "key_lost", lock_changed_after_loss: false }),
        ]);
        const a = alerts.find((x) => x.type === "lost_no_lock_change");
        expect(a!.message).toContain("2 lost keys have");
      });

      it("does not fire for lost key with lock changed", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ key_event_type: "key_lost", lock_changed_after_loss: true }),
        ]);
        const a = alerts.find((x) => x.type === "lost_no_lock_change");
        expect(a).toBeUndefined();
      });

      it("does not fire for non-lost key without lock change", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ key_event_type: "key_issued", lock_changed_after_loss: false }),
        ]);
        const a = alerts.find((x) => x.type === "lost_no_lock_change");
        expect(a).toBeUndefined();
      });
    });

    describe("audit_discrepancy alert", () => {
      it("fires for 1 discrepancy", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ audit_result: "discrepancy_found" }),
        ]);
        const a = alerts.find((x) => x.type === "audit_discrepancy");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("1 key audit has");
      });

      it("uses plural for 2+", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ audit_result: "discrepancy_found" }),
          makeRecord({ audit_result: "discrepancy_found" }),
        ]);
        const a = alerts.find((x) => x.type === "audit_discrepancy");
        expect(a!.message).toContain("2 key audits have");
      });

      it("does not fire for keys_missing", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ audit_result: "keys_missing" }),
        ]);
        const a = alerts.find((x) => x.type === "audit_discrepancy");
        expect(a).toBeUndefined();
      });
    });

    describe("medication_keys_not_separate alert", () => {
      it("does not fire for 1 not separate", () => {
        const alerts = identifyKeyHoldingAlerts([makeRecord({ medication_keys_separate: false })]);
        const a = alerts.find((x) => x.type === "medication_keys_not_separate");
        expect(a).toBeUndefined();
      });

      it("fires for 2 not separate", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ medication_keys_separate: false }),
          makeRecord({ medication_keys_separate: false }),
        ]);
        const a = alerts.find((x) => x.type === "medication_keys_not_separate");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("medium");
        expect(a!.message).toContain("2 records");
      });
    });

    describe("register_not_updated alert", () => {
      it("does not fire for 2 not updated", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ register_updated: false }),
          makeRecord({ register_updated: false }),
        ]);
        const a = alerts.find((x) => x.type === "register_not_updated");
        expect(a).toBeUndefined();
      });

      it("fires for 3 not updated", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ register_updated: false }),
          makeRecord({ register_updated: false }),
          makeRecord({ register_updated: false }),
        ]);
        const a = alerts.find((x) => x.type === "register_not_updated");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("medium");
        expect(a!.message).toContain("3 key events without register updated");
      });
    });

    describe("multiple alerts", () => {
      it("fires all applicable alerts at once", () => {
        const alerts = identifyKeyHoldingAlerts([
          makeRecord({ key_event_type: "key_stolen", key_type: "back_door", medication_keys_separate: false, register_updated: false }),
          makeRecord({ key_event_type: "key_lost", lock_changed_after_loss: false, audit_result: "discrepancy_found", medication_keys_separate: false, register_updated: false }),
          makeRecord({ register_updated: false }),
        ]);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("key_stolen");
        expect(types).toContain("lost_no_lock_change");
        expect(types).toContain("audit_discrepancy");
        expect(types).toContain("medication_keys_not_separate");
        expect(types).toContain("register_not_updated");
      });
    });
  });
});
