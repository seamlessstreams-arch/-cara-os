import { describe, it, expect } from "vitest";
import {
  computeSecurityMetrics,
  identifySecurityAlerts,
  type SecurityRecord,
} from "./building-security-service";

function makeRecord(overrides: Partial<SecurityRecord> = {}): SecurityRecord {
  return {
    id: "sec-1",
    home_id: "home-1",
    event_type: "routine_check",
    event_date: "2026-05-01",
    security_status: "secure",
    alarm_status: "operational",
    key_management: "all_accounted",
    all_doors_secure: true,
    all_windows_secure: true,
    external_lighting_working: true,
    perimeter_secure: true,
    visitors_log_checked: true,
    children_accounted_for: true,
    issues_found: [],
    actions_taken: [],
    checked_by: "Staff A",
    next_check_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeSecurityMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeSecurityMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.routine_check_count).toBe(0);
    expect(m.secure_rate).toBeNull();;
    expect(m.doors_secure_rate).toBeNull();;
  });

  it("counts event types and security statuses", () => {
    const records = [
      makeRecord({ id: "1", event_type: "routine_check", security_status: "secure" }),
      makeRecord({ id: "2", event_type: "routine_check", security_status: "breach" }),
      makeRecord({ id: "3", event_type: "security_incident", security_status: "major_issue" }),
    ];
    const m = computeSecurityMetrics(records);
    expect(m.total_records).toBe(3);
    expect(m.routine_check_count).toBe(2);
    expect(m.security_incident_count).toBe(1);
    expect(m.breach_count).toBe(1);
    expect(m.major_issue_count).toBe(1);
    expect(m.secure_rate).toBeCloseTo(33.3, 0);
  });

  it("computes alarm, key, and boolean rates", () => {
    const records = [
      makeRecord({ id: "1", alarm_status: "operational", key_management: "all_accounted", all_doors_secure: true }),
      makeRecord({ id: "2", alarm_status: "fault_detected", key_management: "key_missing", all_doors_secure: false }),
    ];
    const m = computeSecurityMetrics(records);
    expect(m.alarm_operational_rate).toBe(50);
    expect(m.alarm_fault_count).toBe(1);
    expect(m.keys_accounted_rate).toBe(50);
    expect(m.key_missing_count).toBe(1);
    expect(m.doors_secure_rate).toBe(50);
  });

  it("counts overdue checks", () => {
    const records = [
      makeRecord({ id: "1", next_check_date: "2020-01-01" }),
      makeRecord({ id: "2", next_check_date: "2099-01-01" }),
      makeRecord({ id: "3", next_check_date: null }),
    ];
    const m = computeSecurityMetrics(records);
    expect(m.check_overdue_count).toBe(1);
  });

  it("computes children_accounted_rate", () => {
    const records = [
      makeRecord({ id: "1", children_accounted_for: true }),
      makeRecord({ id: "2", children_accounted_for: false }),
    ];
    const m = computeSecurityMetrics(records);
    expect(m.children_accounted_rate).toBe(50);
  });
});

describe("identifySecurityAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifySecurityAlerts([])).toEqual([]);
  });

  it("fires critical alert for security breach", () => {
    const records = [makeRecord({ id: "s1", security_status: "breach" })];
    const alerts = identifySecurityAlerts(records);
    const a = alerts.find((a) => a.type === "security_breach");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
    expect(a!.id).toBe("s1");
  });

  it("fires critical alert for children not accounted for", () => {
    const records = [makeRecord({ id: "s2", children_accounted_for: false })];
    const alerts = identifySecurityAlerts(records);
    const a = alerts.find((a) => a.type === "children_not_accounted");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("fires high alert for key missing (>= 1)", () => {
    const records = [makeRecord({ key_management: "key_missing" })];
    const alerts = identifySecurityAlerts(records);
    expect(alerts.find((a) => a.type === "key_missing")).toBeDefined();
    expect(alerts.find((a) => a.type === "key_missing")!.severity).toBe("high");
  });

  it("fires high alert for alarm fault (>= 1)", () => {
    const records = [makeRecord({ alarm_status: "fault_detected" })];
    const alerts = identifySecurityAlerts(records);
    expect(alerts.find((a) => a.type === "alarm_fault")).toBeDefined();
    expect(alerts.find((a) => a.type === "alarm_fault")!.severity).toBe("high");
  });

  it("fires medium alert for check overdue (>= 1)", () => {
    const records = [makeRecord({ next_check_date: "2020-01-01" })];
    const alerts = identifySecurityAlerts(records);
    expect(alerts.find((a) => a.type === "check_overdue")).toBeDefined();
    expect(alerts.find((a) => a.type === "check_overdue")!.severity).toBe("medium");
  });

  it("returns no alerts for fully secure records", () => {
    const records = [makeRecord()];
    const alerts = identifySecurityAlerts(records);
    expect(alerts).toEqual([]);
  });
});
