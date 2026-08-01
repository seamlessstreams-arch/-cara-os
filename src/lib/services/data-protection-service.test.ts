import { describe, it, expect } from "vitest";
import {
  computeDataProtectionMetrics,
  identifyDataProtectionAlerts,
  DataProtectionRecord,
} from "./data-protection-service";

function makeRecord(overrides: Partial<DataProtectionRecord> = {}): DataProtectionRecord {
  return {
    id: "dp-1",
    home_id: "home-1",
    event_type: "dsar_received",
    event_date: "2026-05-21",
    compliance_status: "compliant",
    breach_severity: "not_applicable",
    response_timeliness: "within_deadline",
    requester_name: "Jane Doe",
    child_involved: false,
    staff_involved: false,
    ico_notified: false,
    dpo_consulted: true,
    deadline_date: null,
    completed_date: null,
    data_categories_affected: [],
    remedial_actions: [],
    issues_found: [],
    actions_taken: [],
    handled_by: "DPO",
    approved_by: null,
    notes: null,
    created_at: "2026-05-21T09:00:00Z",
    updated_at: "2026-05-21T09:00:00Z",
    ...overrides,
  };
}

// ── computeDataProtectionMetrics ───────────────────────────────────────

describe("computeDataProtectionMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeDataProtectionMetrics([]);
    expect(m.total_events).toBe(0);
    expect(m.dsar_received_count).toBe(0);
    expect(m.compliant_rate).toBeNull();;
    expect(m.within_deadline_rate).toBeNull();;
    expect(m.dpo_consulted_rate).toBeNull();;
  });

  it("calculates correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ event_type: "dsar_received", compliance_status: "compliant" }),
      makeRecord({ id: "dp-2", event_type: "dsar_completed", compliance_status: "non_compliant", response_timeliness: "overdue" }),
      makeRecord({ id: "dp-3", event_type: "data_breach", breach_severity: "high", compliance_status: "compliant", dpo_consulted: false }),
    ];
    const m = computeDataProtectionMetrics(records);
    expect(m.total_events).toBe(3);
    expect(m.dsar_received_count).toBe(1);
    expect(m.dsar_completed_count).toBe(1);
    expect(m.data_breach_count).toBe(1);
    expect(m.non_compliant_count).toBe(1);
    expect(m.high_breach_count).toBe(1);
    expect(m.overdue_count).toBe(1);
    expect(m.compliant_rate).toBe(66.7); // 2/3
    expect(m.dpo_consulted_rate).toBe(66.7);
    expect(m.by_event_type["dsar_received"]).toBe(1);
  });

  it("counts child and staff involvement", () => {
    const records = [
      makeRecord({ child_involved: true, staff_involved: true }),
      makeRecord({ id: "dp-2", child_involved: true }),
    ];
    const m = computeDataProtectionMetrics(records);
    expect(m.child_involved_count).toBe(2);
    expect(m.staff_involved_count).toBe(1);
  });
});

// ── identifyDataProtectionAlerts ───────────────────────────────────────

describe("identifyDataProtectionAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyDataProtectionAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("alerts critical for high severity data breach", () => {
    const records = [
      makeRecord({ event_type: "data_breach", breach_severity: "high" }),
    ];
    const alerts = identifyDataProtectionAlerts(records);
    const breach = alerts.find((a) => a.type === "high_severity_breach");
    expect(breach).toBeDefined();
    expect(breach!.severity).toBe("critical");
  });

  it("alerts high for non-compliant events (>=1)", () => {
    const records = [
      makeRecord({ compliance_status: "non_compliant" }),
    ];
    const alerts = identifyDataProtectionAlerts(records);
    expect(alerts.find((a) => a.type === "non_compliant")).toBeDefined();
  });

  it("alerts high for significantly overdue responses (>=1)", () => {
    const records = [
      makeRecord({ response_timeliness: "significantly_overdue" }),
    ];
    const alerts = identifyDataProtectionAlerts(records);
    expect(alerts.find((a) => a.type === "significantly_overdue")).toBeDefined();
  });

  it("alerts medium for >=3 events without DPO consultation (excluding training)", () => {
    const records = [
      makeRecord({ dpo_consulted: false, event_type: "dsar_received" }),
      makeRecord({ id: "dp-2", dpo_consulted: false, event_type: "data_breach" }),
      makeRecord({ id: "dp-3", dpo_consulted: false, event_type: "retention_review" }),
    ];
    const alerts = identifyDataProtectionAlerts(records);
    const noDpo = alerts.find((a) => a.type === "dpo_not_consulted");
    expect(noDpo).toBeDefined();
    expect(noDpo!.severity).toBe("medium");
  });

  it("does not count training_completed towards DPO alert", () => {
    const records = [
      makeRecord({ dpo_consulted: false, event_type: "training_completed" }),
      makeRecord({ id: "dp-2", dpo_consulted: false, event_type: "training_completed" }),
      makeRecord({ id: "dp-3", dpo_consulted: false, event_type: "training_completed" }),
    ];
    const alerts = identifyDataProtectionAlerts(records);
    expect(alerts.find((a) => a.type === "dpo_not_consulted")).toBeUndefined();
  });

  it("alerts high for overdue deadlines (incomplete with past deadline)", () => {
    const records = [
      makeRecord({ deadline_date: "2026-01-01", completed_date: null }),
    ];
    const alerts = identifyDataProtectionAlerts(records);
    expect(alerts.find((a) => a.type === "deadline_overdue")).toBeDefined();
  });
});
