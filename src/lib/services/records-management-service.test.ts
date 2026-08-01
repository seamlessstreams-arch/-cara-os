import { describe, it, expect } from "vitest";
import {
  computeRecordsMetrics,
  identifyRecordsAlerts,
  type RecordAudit,
  type AccessRequest,
} from "./records-management-service";

// ── Factories ────────────────────────────────────────────────────────────

function makeAudit(overrides: Partial<RecordAudit> = {}): RecordAudit {
  return {
    id: "audit-1",
    home_id: "home-1",
    audit_date: "2025-03-01",
    audited_by: "Staff A",
    child_id: "child-1",
    child_name: "Child A",
    records_reviewed: 10,
    records_complete: 8,
    records_incomplete: 2,
    missing_records: [],
    data_quality_rating: "good",
    chronology_up_to_date: true,
    sensitive_data_secure: true,
    third_party_data_redacted: true,
    findings: null,
    actions_required: null,
    next_audit_date: null,
    created_at: "2025-03-01T00:00:00Z",
    ...overrides,
  };
}

function makeAccessRequest(overrides: Partial<AccessRequest> = {}): AccessRequest {
  return {
    id: "req-1",
    home_id: "home-1",
    request_date: "2025-01-01",
    requester_name: "Parent A",
    requester_relationship: "parent",
    child_id: "child-1",
    child_name: "Child A",
    request_type: "subject_access",
    status: "completed",
    records_requested: "All records",
    date_acknowledged: "2025-01-02",
    date_due: "2025-02-01",
    date_completed: "2025-01-20",
    redaction_required: false,
    redaction_notes: null,
    outcome: "provided",
    handled_by: "Staff A",
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-20T00:00:00Z",
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("computeRecordsMetrics", () => {
  it("returns zeroes for empty inputs", () => {
    const m = computeRecordsMetrics([], [], 0);
    expect(m.children_audited).toBe(0);
    expect(m.avg_completeness_rate).toBeNull();
    expect(m.avg_data_quality).toBeNull();
    expect(m.children_with_poor_quality).toBe(0);
    expect(m.total_access_requests).toBe(0);
    expect(m.open_access_requests).toBe(0);
    expect(m.avg_response_days).toBeNull(); // fab-0.
    expect(m.overdue_access_requests).toBe(0);
    expect(m.overdue_audits).toBe(0);
    expect(m.chronology_compliance).toBeNull(); // fab-0.
  });

  it("counts unique children audited", () => {
    const audits = [
      makeAudit({ child_id: "c1" }),
      makeAudit({ child_id: "c1", id: "audit-2" }),
      makeAudit({ child_id: "c2", id: "audit-3" }),
    ];
    const m = computeRecordsMetrics(audits, [], 3);
    expect(m.children_audited).toBe(2);
  });

  it("calculates average completeness rate", () => {
    const audits = [
      makeAudit({ records_reviewed: 10, records_complete: 8 }),
      makeAudit({ id: "audit-2", records_reviewed: 10, records_complete: 10 }),
    ];
    const m = computeRecordsMetrics(audits, [], 2);
    // 18/20 = 90%
    expect(m.avg_completeness_rate).toBe(90);
  });

  it("calculates average data quality score", () => {
    const audits = [
      makeAudit({ data_quality_rating: "excellent" }), // 5
      makeAudit({ id: "audit-2", data_quality_rating: "poor" }), // 2
    ];
    const m = computeRecordsMetrics(audits, [], 2);
    // (5+2)/2 = 3.5
    expect(m.avg_data_quality).toBe(3.5);
  });

  it("counts poor quality and quality breakdown", () => {
    const audits = [
      makeAudit({ data_quality_rating: "poor" }),
      makeAudit({ id: "a2", data_quality_rating: "poor" }),
      makeAudit({ id: "a3", data_quality_rating: "good" }),
    ];
    const m = computeRecordsMetrics(audits, [], 3);
    expect(m.children_with_poor_quality).toBe(2);
    expect(m.by_quality_rating).toEqual({ poor: 2, good: 1 });
  });

  it("counts open and overdue access requests", () => {
    const requests = [
      makeAccessRequest({ status: "received", date_due: "2020-01-01", date_completed: null }),
      makeAccessRequest({ id: "req-2", status: "in_progress", date_due: "2099-01-01", date_completed: null }),
      makeAccessRequest({ id: "req-3", status: "completed" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.total_access_requests).toBe(3);
    expect(m.open_access_requests).toBe(2);
    expect(m.overdue_access_requests).toBe(1);
  });

  it("calculates avg response days for completed requests", () => {
    const requests = [
      makeAccessRequest({ request_date: "2025-01-01", date_completed: "2025-01-11" }), // 10 days
      makeAccessRequest({ id: "r2", request_date: "2025-01-01", date_completed: "2025-01-21" }), // 20 days
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.avg_response_days).toBe(15);
  });

  it("calculates chronology compliance", () => {
    const audits = [
      makeAudit({ chronology_up_to_date: true }),
      makeAudit({ id: "a2", chronology_up_to_date: false }),
    ];
    const m = computeRecordsMetrics(audits, [], 2);
    expect(m.chronology_compliance).toBe(50);
  });
});

describe("identifyRecordsAlerts", () => {
  const now = new Date("2025-06-01T00:00:00Z");

  it("returns empty array for no data", () => {
    const alerts = identifyRecordsAlerts([], [], 0, now);
    expect(alerts).toEqual([]);
  });

  it("alerts on poor data quality", () => {
    const audits = [makeAudit({ data_quality_rating: "poor" })];
    const alerts = identifyRecordsAlerts(audits, [], 1, now);
    expect(alerts.some((a) => a.type === "poor_data_quality" && a.severity === "high")).toBe(true);
  });

  it("alerts on high incompleteness (>20%)", () => {
    const audits = [makeAudit({ records_reviewed: 10, records_incomplete: 3 })];
    const alerts = identifyRecordsAlerts(audits, [], 1, now);
    expect(alerts.some((a) => a.type === "high_incompleteness")).toBe(true);
  });

  it("does not alert when incompleteness is exactly 20%", () => {
    const audits = [makeAudit({ records_reviewed: 10, records_incomplete: 2 })];
    const alerts = identifyRecordsAlerts(audits, [], 1, now);
    expect(alerts.some((a) => a.type === "high_incompleteness")).toBe(false);
  });

  it("alerts when sensitive data is not secure (critical)", () => {
    const audits = [makeAudit({ sensitive_data_secure: false })];
    const alerts = identifyRecordsAlerts(audits, [], 1, now);
    expect(alerts.some((a) => a.type === "sensitive_data_insecure" && a.severity === "critical")).toBe(true);
  });

  it("alerts on overdue audit", () => {
    const audits = [makeAudit({ next_audit_date: "2025-01-01" })];
    const alerts = identifyRecordsAlerts(audits, [], 1, now);
    expect(alerts.some((a) => a.type === "audit_overdue")).toBe(true);
  });

  it("alerts on overdue access requests (critical >30 days)", () => {
    const req = makeAccessRequest({
      status: "in_progress",
      date_due: "2025-01-01",
      date_completed: null,
    });
    const alerts = identifyRecordsAlerts([], [req], 0, now);
    const overdue = alerts.find((a) => a.type === "access_request_overdue");
    expect(overdue).toBeDefined();
    expect(overdue!.severity).toBe("critical");
  });

  it("alerts when access request not acknowledged after 2 days", () => {
    const req = makeAccessRequest({
      status: "received",
      request_date: "2025-05-20",
      date_acknowledged: null,
      date_due: "2025-07-01",
      date_completed: null,
    });
    const alerts = identifyRecordsAlerts([], [req], 0, new Date("2025-05-25T00:00:00Z"));
    expect(alerts.some((a) => a.type === "access_request_not_acknowledged")).toBe(true);
  });

  it("alerts when children not audited", () => {
    const audits = [makeAudit({ child_id: "c1" })];
    const alerts = identifyRecordsAlerts(audits, [], 3, now);
    const a = alerts.find((x) => x.type === "children_not_audited");
    expect(a).toBeDefined();
    expect(a!.message).toContain("2 child(ren)");
  });
});
