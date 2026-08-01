import { describe, it, expect } from "vitest";
import {
  computeSecureStorageMetrics,
  identifySecureStorageAlerts,
} from "./secure-storage-service";
import type { SecureStorageRecord } from "./secure-storage-service";

// -- Factory Function ---------------------------------------------------------

function makeRecord(overrides: Partial<SecureStorageRecord> = {}): SecureStorageRecord {
  return {
    id: "ss-1",
    home_id: "home-1",
    event_type: "storage_audit",
    event_date: "2026-05-01",
    storage_location: "locked_cabinet",
    compliance_rating: "fully_compliant",
    access_decision: "not_applicable",
    requested_by: null,
    authorised_by: "manager-1",
    records_affected: 10,
    gdpr_compliant: true,
    encryption_verified: true,
    retention_schedule_followed: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: "2026-11-01",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeSecureStorageMetrics ----------------------------------------------

describe("computeSecureStorageMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSecureStorageMetrics([]);
    expect(m.total_events).toBe(0);
    expect(m.storage_audits).toBe(0);
    expect(m.access_logs).toBe(0);
    expect(m.subject_access_requests).toBe(0);
    expect(m.data_breaches).toBe(0);
    expect(m.fully_compliant_rate).toBeNull();;
    expect(m.non_compliant_count).toBe(0);
    expect(m.gdpr_compliant_rate).toBeNull();;
    expect(m.encryption_verified_rate).toBeNull();;
    expect(m.retention_followed_rate).toBeNull();;
    expect(m.access_granted_count).toBe(0);
    expect(m.access_denied_count).toBe(0);
    expect(m.total_records_affected).toBe(0);
    expect(m.review_overdue_count).toBe(0);
  });

  it("counts event types correctly", () => {
    const records = [
      makeRecord({ id: "r1", event_type: "storage_audit" }),
      makeRecord({ id: "r2", event_type: "access_log" }),
      makeRecord({ id: "r3", event_type: "subject_access_request" }),
      makeRecord({ id: "r4", event_type: "data_breach" }),
    ];
    const m = computeSecureStorageMetrics(records);
    expect(m.storage_audits).toBe(1);
    expect(m.access_logs).toBe(1);
    expect(m.subject_access_requests).toBe(1);
    expect(m.data_breaches).toBe(1);
    expect(m.total_events).toBe(4);
  });

  it("computes compliance and GDPR rates", () => {
    const records = [
      makeRecord({ id: "r1", compliance_rating: "fully_compliant", gdpr_compliant: true }),
      makeRecord({ id: "r2", compliance_rating: "non_compliant", gdpr_compliant: false }),
    ];
    const m = computeSecureStorageMetrics(records);
    expect(m.fully_compliant_rate).toBe(50);
    expect(m.non_compliant_count).toBe(1);
    expect(m.gdpr_compliant_rate).toBe(50);
  });

  it("computes encryption and retention rates", () => {
    const records = [
      makeRecord({ id: "r1", encryption_verified: true, retention_schedule_followed: true }),
      makeRecord({ id: "r2", encryption_verified: false, retention_schedule_followed: false }),
    ];
    const m = computeSecureStorageMetrics(records);
    expect(m.encryption_verified_rate).toBe(50);
    expect(m.retention_followed_rate).toBe(50);
  });

  it("counts access decisions", () => {
    const records = [
      makeRecord({ id: "r1", access_decision: "granted" }),
      makeRecord({ id: "r2", access_decision: "granted" }),
      makeRecord({ id: "r3", access_decision: "denied" }),
    ];
    const m = computeSecureStorageMetrics(records);
    expect(m.access_granted_count).toBe(2);
    expect(m.access_denied_count).toBe(1);
  });

  it("sums total records affected", () => {
    const records = [
      makeRecord({ id: "r1", records_affected: 10 }),
      makeRecord({ id: "r2", records_affected: 25 }),
    ];
    const m = computeSecureStorageMetrics(records);
    expect(m.total_records_affected).toBe(35);
  });

  it("counts overdue reviews", () => {
    const records = [
      makeRecord({ id: "r1", next_review_date: "2020-01-01" }), // past
      makeRecord({ id: "r2", next_review_date: "2030-01-01" }), // future
    ];
    const m = computeSecureStorageMetrics(records);
    expect(m.review_overdue_count).toBe(1);
  });
});

// -- identifySecureStorageAlerts ----------------------------------------------

describe("identifySecureStorageAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifySecureStorageAlerts([])).toEqual([]);
  });

  it("flags data breach as critical", () => {
    const records = [makeRecord({ event_type: "data_breach", records_affected: 5 })];
    const alerts = identifySecureStorageAlerts(records);
    const breach = alerts.filter((a) => a.type === "data_breach");
    expect(breach).toHaveLength(1);
    expect(breach[0].severity).toBe("critical");
  });

  it("flags non-compliant finding as high", () => {
    const records = [makeRecord({ compliance_rating: "non_compliant" })];
    const alerts = identifySecureStorageAlerts(records);
    const nc = alerts.filter((a) => a.type === "non_compliant");
    expect(nc).toHaveLength(1);
    expect(nc[0].severity).toBe("high");
  });

  it("flags 2+ GDPR non-compliant records as high", () => {
    const records = [
      makeRecord({ id: "r1", gdpr_compliant: false }),
      makeRecord({ id: "r2", gdpr_compliant: false }),
    ];
    const alerts = identifySecureStorageAlerts(records);
    const gdpr = alerts.filter((a) => a.type === "gdpr_non_compliant");
    expect(gdpr).toHaveLength(1);
    expect(gdpr[0].severity).toBe("high");
  });

  it("does not flag single GDPR non-compliant record", () => {
    const records = [makeRecord({ gdpr_compliant: false })];
    const alerts = identifySecureStorageAlerts(records);
    const gdpr = alerts.filter((a) => a.type === "gdpr_non_compliant");
    expect(gdpr).toHaveLength(0);
  });

  it("flags unverified encryption on digital/cloud storage as medium", () => {
    const records = [
      makeRecord({ id: "r1", storage_location: "encrypted_digital", encryption_verified: false }),
    ];
    const alerts = identifySecureStorageAlerts(records);
    const enc = alerts.filter((a) => a.type === "encryption_not_verified");
    expect(enc).toHaveLength(1);
    expect(enc[0].severity).toBe("medium");
  });

  it("flags overdue review as medium", () => {
    const records = [makeRecord({ next_review_date: "2020-01-01" })];
    const alerts = identifySecureStorageAlerts(records);
    const overdue = alerts.filter((a) => a.type === "review_overdue");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("medium");
  });

  it("does not flag future review dates", () => {
    const records = [makeRecord({ next_review_date: "2030-01-01" })];
    const alerts = identifySecureStorageAlerts(records);
    const overdue = alerts.filter((a) => a.type === "review_overdue");
    expect(overdue).toHaveLength(0);
  });
});
