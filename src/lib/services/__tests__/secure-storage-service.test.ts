// ══════════════════════════════════════════════════════════════════════════════
// CARA — SECURE STORAGE & RECORDS ACCESS SERVICE TESTS
// Pure-function tests for secure storage metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  RECORD_EVENT_TYPES,
  STORAGE_LOCATIONS,
  COMPLIANCE_RATINGS,
  ACCESS_DECISIONS,
  _testing,
} from "../secure-storage-service";

import type {
  SecureStorageRecord,
  RecordEventType,
  StorageLocation,
  ComplianceRating,
  AccessDecision,
} from "../secure-storage-service";

const { computeSecureStorageMetrics, identifySecureStorageAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<SecureStorageRecord>,
): SecureStorageRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    event_type: "event_type" in (overrides ?? {}) ? overrides!.event_type! : "storage_audit",
    event_date: "event_date" in (overrides ?? {}) ? overrides!.event_date! : "2026-05-01",
    storage_location: "storage_location" in (overrides ?? {}) ? overrides!.storage_location! : "locked_cabinet",
    compliance_rating: "compliance_rating" in (overrides ?? {}) ? overrides!.compliance_rating! : "fully_compliant",
    access_decision: "access_decision" in (overrides ?? {}) ? overrides!.access_decision! : "not_applicable",
    requested_by: "requested_by" in (overrides ?? {}) ? (overrides!.requested_by ?? null) : null,
    authorised_by: "authorised_by" in (overrides ?? {}) ? overrides!.authorised_by! : "Manager",
    records_affected: "records_affected" in (overrides ?? {}) ? overrides!.records_affected! : 10,
    gdpr_compliant: "gdpr_compliant" in (overrides ?? {}) ? overrides!.gdpr_compliant! : true,
    encryption_verified: "encryption_verified" in (overrides ?? {}) ? overrides!.encryption_verified! : true,
    retention_schedule_followed: "retention_schedule_followed" in (overrides ?? {}) ? overrides!.retention_schedule_followed! : true,
    issues_found: "issues_found" in (overrides ?? {}) ? overrides!.issues_found! : [],
    actions_taken: "actions_taken" in (overrides ?? {}) ? overrides!.actions_taken! : [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
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
  describe("RECORD_EVENT_TYPES", () => {
    it("has exactly 9 items", () => {
      expect(RECORD_EVENT_TYPES).toHaveLength(9);
    });

    it("contains storage_audit", () => {
      expect(RECORD_EVENT_TYPES).toContainEqual({ type: "storage_audit", label: "Storage Audit" });
    });

    it("contains access_log", () => {
      expect(RECORD_EVENT_TYPES).toContainEqual({ type: "access_log", label: "Access Log" });
    });

    it("contains retention_review", () => {
      expect(RECORD_EVENT_TYPES).toContainEqual({ type: "retention_review", label: "Retention Review" });
    });

    it("contains subject_access_request", () => {
      expect(RECORD_EVENT_TYPES).toContainEqual({ type: "subject_access_request", label: "Subject Access Request" });
    });

    it("contains data_breach", () => {
      expect(RECORD_EVENT_TYPES).toContainEqual({ type: "data_breach", label: "Data Breach" });
    });

    it("contains destruction", () => {
      expect(RECORD_EVENT_TYPES).toContainEqual({ type: "destruction", label: "Destruction" });
    });

    it("contains transfer", () => {
      expect(RECORD_EVENT_TYPES).toContainEqual({ type: "transfer", label: "Transfer" });
    });

    it("contains backup_check", () => {
      expect(RECORD_EVENT_TYPES).toContainEqual({ type: "backup_check", label: "Backup Check" });
    });

    it("contains other", () => {
      expect(RECORD_EVENT_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = RECORD_EVENT_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = RECORD_EVENT_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of RECORD_EVENT_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("STORAGE_LOCATIONS", () => {
    it("has exactly 6 items", () => {
      expect(STORAGE_LOCATIONS).toHaveLength(6);
    });

    it("contains locked_cabinet", () => {
      expect(STORAGE_LOCATIONS).toContainEqual({ location: "locked_cabinet", label: "Locked Cabinet" });
    });

    it("contains secure_room", () => {
      expect(STORAGE_LOCATIONS).toContainEqual({ location: "secure_room", label: "Secure Room" });
    });

    it("contains encrypted_digital", () => {
      expect(STORAGE_LOCATIONS).toContainEqual({ location: "encrypted_digital", label: "Encrypted Digital" });
    });

    it("contains cloud_storage", () => {
      expect(STORAGE_LOCATIONS).toContainEqual({ location: "cloud_storage", label: "Cloud Storage" });
    });

    it("contains offsite_storage", () => {
      expect(STORAGE_LOCATIONS).toContainEqual({ location: "offsite_storage", label: "Offsite Storage" });
    });

    it("contains other", () => {
      expect(STORAGE_LOCATIONS).toContainEqual({ location: "other", label: "Other" });
    });

    it("has unique location values", () => {
      const locations = STORAGE_LOCATIONS.map((l) => l.location);
      expect(new Set(locations).size).toBe(locations.length);
    });

    it("has unique labels", () => {
      const labels = STORAGE_LOCATIONS.map((l) => l.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of STORAGE_LOCATIONS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("COMPLIANCE_RATINGS", () => {
    it("has exactly 4 items", () => {
      expect(COMPLIANCE_RATINGS).toHaveLength(4);
    });

    it("contains fully_compliant", () => {
      expect(COMPLIANCE_RATINGS).toContainEqual({ rating: "fully_compliant", label: "Fully Compliant" });
    });

    it("contains mostly_compliant", () => {
      expect(COMPLIANCE_RATINGS).toContainEqual({ rating: "mostly_compliant", label: "Mostly Compliant" });
    });

    it("contains partially_compliant", () => {
      expect(COMPLIANCE_RATINGS).toContainEqual({ rating: "partially_compliant", label: "Partially Compliant" });
    });

    it("contains non_compliant", () => {
      expect(COMPLIANCE_RATINGS).toContainEqual({ rating: "non_compliant", label: "Non-Compliant" });
    });

    it("has unique rating values", () => {
      const ratings = COMPLIANCE_RATINGS.map((r) => r.rating);
      expect(new Set(ratings).size).toBe(ratings.length);
    });

    it("has unique labels", () => {
      const labels = COMPLIANCE_RATINGS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of COMPLIANCE_RATINGS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("ACCESS_DECISIONS", () => {
    it("has exactly 5 items", () => {
      expect(ACCESS_DECISIONS).toHaveLength(5);
    });

    it("contains granted", () => {
      expect(ACCESS_DECISIONS).toContainEqual({ decision: "granted", label: "Granted" });
    });

    it("contains denied", () => {
      expect(ACCESS_DECISIONS).toContainEqual({ decision: "denied", label: "Denied" });
    });

    it("contains partial", () => {
      expect(ACCESS_DECISIONS).toContainEqual({ decision: "partial", label: "Partial" });
    });

    it("contains referred", () => {
      expect(ACCESS_DECISIONS).toContainEqual({ decision: "referred", label: "Referred" });
    });

    it("contains not_applicable", () => {
      expect(ACCESS_DECISIONS).toContainEqual({ decision: "not_applicable", label: "Not Applicable" });
    });

    it("has unique decision values", () => {
      const decisions = ACCESS_DECISIONS.map((d) => d.decision);
      expect(new Set(decisions).size).toBe(decisions.length);
    });

    it("has unique labels", () => {
      const labels = ACCESS_DECISIONS.map((d) => d.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of ACCESS_DECISIONS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeSecureStorageMetrics ────────────────────────────────────────────

describe("computeSecureStorageMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_events", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.total_events).toBe(0);
    });

    it("returns zero storage_audits", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.storage_audits).toBe(0);
    });

    it("returns zero access_logs", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.access_logs).toBe(0);
    });

    it("returns zero subject_access_requests", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.subject_access_requests).toBe(0);
    });

    it("returns zero data_breaches", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.data_breaches).toBe(0);
    });

    it("returns zero fully_compliant_rate", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.fully_compliant_rate).toBeNull();;
    });

    it("returns zero non_compliant_count", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero gdpr_compliant_rate", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.gdpr_compliant_rate).toBeNull();;
    });

    it("returns zero encryption_verified_rate", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.encryption_verified_rate).toBeNull();;
    });

    it("returns zero retention_followed_rate", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.retention_followed_rate).toBeNull();;
    });

    it("returns zero access_granted_count", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.access_granted_count).toBe(0);
    });

    it("returns zero access_denied_count", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.access_denied_count).toBe(0);
    });

    it("returns zero total_records_affected", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.total_records_affected).toBe(0);
    });

    it("returns zero review_overdue_count", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.review_overdue_count).toBe(0);
    });

    it("returns empty by_event_type", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.by_event_type).toEqual({});
    });

    it("returns empty by_storage_location", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.by_storage_location).toEqual({});
    });

    it("returns empty by_compliance_rating", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.by_compliance_rating).toEqual({});
    });

    it("returns empty by_access_decision", () => {
      const m = computeSecureStorageMetrics([]);
      expect(m.by_access_decision).toEqual({});
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      event_type: "storage_audit",
      event_date: "2026-05-01",
      storage_location: "locked_cabinet",
      compliance_rating: "fully_compliant",
      access_decision: "granted",
      records_affected: 25,
      gdpr_compliant: true,
      encryption_verified: true,
      retention_schedule_followed: true,
    });

    it("returns total_events = 1", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.total_events).toBe(1);
    });

    it("returns storage_audits = 1", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.storage_audits).toBe(1);
    });

    it("returns access_logs = 0", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.access_logs).toBe(0);
    });

    it("returns subject_access_requests = 0", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.subject_access_requests).toBe(0);
    });

    it("returns data_breaches = 0", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.data_breaches).toBe(0);
    });

    it("returns fully_compliant_rate = 100", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.fully_compliant_rate).toBe(100);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns gdpr_compliant_rate = 100", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.gdpr_compliant_rate).toBe(100);
    });

    it("returns encryption_verified_rate = 100", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.encryption_verified_rate).toBe(100);
    });

    it("returns retention_followed_rate = 100", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.retention_followed_rate).toBe(100);
    });

    it("returns access_granted_count = 1", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.access_granted_count).toBe(1);
    });

    it("returns access_denied_count = 0", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.access_denied_count).toBe(0);
    });

    it("returns total_records_affected = 25", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.total_records_affected).toBe(25);
    });

    it("returns by_event_type with single entry", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.by_event_type).toEqual({ storage_audit: 1 });
    });

    it("returns by_storage_location with single entry", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.by_storage_location).toEqual({ locked_cabinet: 1 });
    });

    it("returns by_compliance_rating with single entry", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.by_compliance_rating).toEqual({ fully_compliant: 1 });
    });

    it("returns by_access_decision with single entry", () => {
      const m = computeSecureStorageMetrics([record]);
      expect(m.by_access_decision).toEqual({ granted: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ event_type: "storage_audit", storage_location: "locked_cabinet", compliance_rating: "fully_compliant", access_decision: "granted", records_affected: 10, gdpr_compliant: true, encryption_verified: true, retention_schedule_followed: true }),
      makeRecord({ event_type: "access_log", storage_location: "encrypted_digital", compliance_rating: "mostly_compliant", access_decision: "denied", records_affected: 5, gdpr_compliant: false, encryption_verified: false, retention_schedule_followed: false }),
      makeRecord({ event_type: "subject_access_request", storage_location: "cloud_storage", compliance_rating: "non_compliant", access_decision: "partial", records_affected: 20, gdpr_compliant: true, encryption_verified: true, retention_schedule_followed: true }),
      makeRecord({ event_type: "data_breach", storage_location: "secure_room", compliance_rating: "partially_compliant", access_decision: "referred", records_affected: 100, gdpr_compliant: false, encryption_verified: false, retention_schedule_followed: false }),
      makeRecord({ event_type: "retention_review", storage_location: "offsite_storage", compliance_rating: "fully_compliant", access_decision: "not_applicable", records_affected: 15, gdpr_compliant: true, encryption_verified: true, retention_schedule_followed: true }),
    ];

    it("returns total_events = 5", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.total_events).toBe(5);
    });

    it("returns storage_audits = 1", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.storage_audits).toBe(1);
    });

    it("returns access_logs = 1", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.access_logs).toBe(1);
    });

    it("returns subject_access_requests = 1", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.subject_access_requests).toBe(1);
    });

    it("returns data_breaches = 1", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.data_breaches).toBe(1);
    });

    it("calculates fully_compliant_rate correctly (2/5 = 40%)", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.fully_compliant_rate).toBe(40);
    });

    it("returns non_compliant_count = 1", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("calculates gdpr_compliant_rate correctly (3/5 = 60%)", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.gdpr_compliant_rate).toBe(60);
    });

    it("calculates encryption_verified_rate correctly (3/5 = 60%)", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.encryption_verified_rate).toBe(60);
    });

    it("calculates retention_followed_rate correctly (3/5 = 60%)", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.retention_followed_rate).toBe(60);
    });

    it("returns access_granted_count = 1", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.access_granted_count).toBe(1);
    });

    it("returns access_denied_count = 1", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.access_denied_count).toBe(1);
    });

    it("returns total_records_affected = 150", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.total_records_affected).toBe(150);
    });

    it("groups by_event_type correctly", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.by_event_type).toEqual({ storage_audit: 1, access_log: 1, subject_access_request: 1, data_breach: 1, retention_review: 1 });
    });

    it("groups by_storage_location correctly", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.by_storage_location).toEqual({ locked_cabinet: 1, encrypted_digital: 1, cloud_storage: 1, secure_room: 1, offsite_storage: 1 });
    });

    it("groups by_compliance_rating correctly", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.by_compliance_rating).toEqual({ fully_compliant: 2, mostly_compliant: 1, non_compliant: 1, partially_compliant: 1 });
    });

    it("groups by_access_decision correctly", () => {
      const m = computeSecureStorageMetrics(records);
      expect(m.by_access_decision).toEqual({ granted: 1, denied: 1, partial: 1, referred: 1, not_applicable: 1 });
    });
  });

  describe("event type counts", () => {
    it("counts storage_audit events", () => {
      const records = [
        makeRecord({ event_type: "storage_audit" }),
        makeRecord({ event_type: "storage_audit" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.storage_audits).toBe(2);
    });

    it("counts access_log events", () => {
      const records = [
        makeRecord({ event_type: "access_log" }),
        makeRecord({ event_type: "access_log" }),
        makeRecord({ event_type: "access_log" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.access_logs).toBe(3);
    });

    it("counts subject_access_request events", () => {
      const records = [makeRecord({ event_type: "subject_access_request" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.subject_access_requests).toBe(1);
    });

    it("counts data_breach events", () => {
      const records = [
        makeRecord({ event_type: "data_breach" }),
        makeRecord({ event_type: "data_breach" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.data_breaches).toBe(2);
    });

    it("does not count retention_review as storage_audit", () => {
      const records = [makeRecord({ event_type: "retention_review" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.storage_audits).toBe(0);
    });

    it("does not count destruction as data_breach", () => {
      const records = [makeRecord({ event_type: "destruction" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.data_breaches).toBe(0);
    });

    it("does not count transfer as access_log", () => {
      const records = [makeRecord({ event_type: "transfer" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.access_logs).toBe(0);
    });

    it("does not count backup_check as subject_access_request", () => {
      const records = [makeRecord({ event_type: "backup_check" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.subject_access_requests).toBe(0);
    });

    it("does not count other as any specific type", () => {
      const records = [makeRecord({ event_type: "other" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.storage_audits).toBe(0);
      expect(m.access_logs).toBe(0);
      expect(m.subject_access_requests).toBe(0);
      expect(m.data_breaches).toBe(0);
    });
  });

  describe("fully_compliant_rate", () => {
    it("returns 100 when all fully_compliant", () => {
      const records = [
        makeRecord({ compliance_rating: "fully_compliant" }),
        makeRecord({ compliance_rating: "fully_compliant" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.fully_compliant_rate).toBe(100);
    });

    it("returns 0 when none fully_compliant", () => {
      const records = [
        makeRecord({ compliance_rating: "non_compliant" }),
        makeRecord({ compliance_rating: "mostly_compliant" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.fully_compliant_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ compliance_rating: "fully_compliant" }),
        makeRecord({ compliance_rating: "mostly_compliant" }),
        makeRecord({ compliance_rating: "non_compliant" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.fully_compliant_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ compliance_rating: "fully_compliant" }),
        makeRecord({ compliance_rating: "fully_compliant" }),
        makeRecord({ compliance_rating: "non_compliant" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.fully_compliant_rate).toBe(66.7);
    });

    it("uses all records as denominator", () => {
      const records = [
        makeRecord({ compliance_rating: "fully_compliant" }),
        makeRecord({ compliance_rating: "partially_compliant" }),
      ];
      // 1/2 = 50%
      const m = computeSecureStorageMetrics(records);
      expect(m.fully_compliant_rate).toBe(50);
    });
  });

  describe("non_compliant_count", () => {
    it("counts non_compliant records accurately", () => {
      const records = [
        makeRecord({ compliance_rating: "non_compliant" }),
        makeRecord({ compliance_rating: "non_compliant" }),
        makeRecord({ compliance_rating: "fully_compliant" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });

    it("does not count mostly_compliant as non_compliant", () => {
      const records = [makeRecord({ compliance_rating: "mostly_compliant" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count partially_compliant as non_compliant", () => {
      const records = [makeRecord({ compliance_rating: "partially_compliant" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count fully_compliant as non_compliant", () => {
      const records = [makeRecord({ compliance_rating: "fully_compliant" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });
  });

  describe("gdpr_compliant_rate", () => {
    it("returns 100 when all gdpr_compliant", () => {
      const records = [
        makeRecord({ gdpr_compliant: true }),
        makeRecord({ gdpr_compliant: true }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.gdpr_compliant_rate).toBe(100);
    });

    it("returns 0 when none gdpr_compliant", () => {
      const records = [
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.gdpr_compliant_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ gdpr_compliant: true }),
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.gdpr_compliant_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ gdpr_compliant: true }),
        makeRecord({ gdpr_compliant: true }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.gdpr_compliant_rate).toBe(66.7);
    });

    it("uses all records as denominator", () => {
      const records = [
        makeRecord({ gdpr_compliant: true }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.gdpr_compliant_rate).toBe(50);
    });
  });

  describe("encryption_verified_rate", () => {
    it("returns 100 when all encryption_verified", () => {
      const records = [
        makeRecord({ encryption_verified: true }),
        makeRecord({ encryption_verified: true }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.encryption_verified_rate).toBe(100);
    });

    it("returns 0 when none encryption_verified", () => {
      const records = [
        makeRecord({ encryption_verified: false }),
        makeRecord({ encryption_verified: false }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.encryption_verified_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ encryption_verified: true }),
        makeRecord({ encryption_verified: false }),
        makeRecord({ encryption_verified: false }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.encryption_verified_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ encryption_verified: true }),
        makeRecord({ encryption_verified: true }),
        makeRecord({ encryption_verified: false }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.encryption_verified_rate).toBe(66.7);
    });
  });

  describe("retention_followed_rate", () => {
    it("returns 100 when all retention_schedule_followed", () => {
      const records = [
        makeRecord({ retention_schedule_followed: true }),
        makeRecord({ retention_schedule_followed: true }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.retention_followed_rate).toBe(100);
    });

    it("returns 0 when none retention_schedule_followed", () => {
      const records = [
        makeRecord({ retention_schedule_followed: false }),
        makeRecord({ retention_schedule_followed: false }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.retention_followed_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ retention_schedule_followed: true }),
        makeRecord({ retention_schedule_followed: false }),
        makeRecord({ retention_schedule_followed: false }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.retention_followed_rate).toBe(33.3);
    });

    it("calculates (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ retention_schedule_followed: true }),
        makeRecord({ retention_schedule_followed: true }),
        makeRecord({ retention_schedule_followed: false }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.retention_followed_rate).toBe(66.7);
    });
  });

  describe("access_granted_count and access_denied_count", () => {
    it("counts granted decisions", () => {
      const records = [
        makeRecord({ access_decision: "granted" }),
        makeRecord({ access_decision: "granted" }),
        makeRecord({ access_decision: "denied" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.access_granted_count).toBe(2);
    });

    it("counts denied decisions", () => {
      const records = [
        makeRecord({ access_decision: "denied" }),
        makeRecord({ access_decision: "denied" }),
        makeRecord({ access_decision: "granted" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.access_denied_count).toBe(2);
    });

    it("does not count partial as granted", () => {
      const records = [makeRecord({ access_decision: "partial" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.access_granted_count).toBe(0);
    });

    it("does not count referred as denied", () => {
      const records = [makeRecord({ access_decision: "referred" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.access_denied_count).toBe(0);
    });

    it("does not count not_applicable as granted or denied", () => {
      const records = [makeRecord({ access_decision: "not_applicable" })];
      const m = computeSecureStorageMetrics(records);
      expect(m.access_granted_count).toBe(0);
      expect(m.access_denied_count).toBe(0);
    });
  });

  describe("total_records_affected", () => {
    it("sums records_affected across all records", () => {
      const records = [
        makeRecord({ records_affected: 10 }),
        makeRecord({ records_affected: 20 }),
        makeRecord({ records_affected: 30 }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.total_records_affected).toBe(60);
    });

    it("handles zero records_affected", () => {
      const records = [
        makeRecord({ records_affected: 0 }),
        makeRecord({ records_affected: 0 }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.total_records_affected).toBe(0);
    });

    it("handles single record", () => {
      const records = [makeRecord({ records_affected: 42 })];
      const m = computeSecureStorageMetrics(records);
      expect(m.total_records_affected).toBe(42);
    });
  });

  describe("review_overdue_count", () => {
    it("counts records with past next_review_date", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(5) }),
        makeRecord({ next_review_date: daysAgo(10) }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.review_overdue_count).toBe(2);
    });

    it("does not count records with future next_review_date", () => {
      const records = [
        makeRecord({ next_review_date: daysFromNow(10) }),
        makeRecord({ next_review_date: daysFromNow(20) }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.review_overdue_count).toBe(0);
    });

    it("does not count records with null next_review_date", () => {
      const records = [
        makeRecord({ next_review_date: null }),
        makeRecord({ next_review_date: null }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.review_overdue_count).toBe(0);
    });

    it("counts mixed past/future/null correctly", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(5) }),
        makeRecord({ next_review_date: daysFromNow(5) }),
        makeRecord({ next_review_date: null }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.review_overdue_count).toBe(1);
    });
  });

  describe("by_event_type breakdown", () => {
    it("counts each event type separately", () => {
      const records = [
        makeRecord({ event_type: "storage_audit" }),
        makeRecord({ event_type: "storage_audit" }),
        makeRecord({ event_type: "data_breach" }),
        makeRecord({ event_type: "transfer" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.by_event_type).toEqual({ storage_audit: 2, data_breach: 1, transfer: 1 });
    });

    it("handles all nine event types", () => {
      const types: RecordEventType[] = ["storage_audit", "access_log", "retention_review", "subject_access_request", "data_breach", "destruction", "transfer", "backup_check", "other"];
      const records = types.map((t) => makeRecord({ event_type: t }));
      const m = computeSecureStorageMetrics(records);
      for (const t of types) {
        expect(m.by_event_type[t]).toBe(1);
      }
    });
  });

  describe("by_storage_location breakdown", () => {
    it("counts each storage location separately", () => {
      const records = [
        makeRecord({ storage_location: "locked_cabinet" }),
        makeRecord({ storage_location: "locked_cabinet" }),
        makeRecord({ storage_location: "cloud_storage" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.by_storage_location).toEqual({ locked_cabinet: 2, cloud_storage: 1 });
    });

    it("handles all six storage locations", () => {
      const locations: StorageLocation[] = ["locked_cabinet", "secure_room", "encrypted_digital", "cloud_storage", "offsite_storage", "other"];
      const records = locations.map((l) => makeRecord({ storage_location: l }));
      const m = computeSecureStorageMetrics(records);
      for (const l of locations) {
        expect(m.by_storage_location[l]).toBe(1);
      }
    });
  });

  describe("by_compliance_rating breakdown", () => {
    it("counts each compliance rating separately", () => {
      const records = [
        makeRecord({ compliance_rating: "fully_compliant" }),
        makeRecord({ compliance_rating: "fully_compliant" }),
        makeRecord({ compliance_rating: "non_compliant" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.by_compliance_rating).toEqual({ fully_compliant: 2, non_compliant: 1 });
    });

    it("handles all four compliance ratings", () => {
      const ratings: ComplianceRating[] = ["fully_compliant", "mostly_compliant", "partially_compliant", "non_compliant"];
      const records = ratings.map((r) => makeRecord({ compliance_rating: r }));
      const m = computeSecureStorageMetrics(records);
      for (const r of ratings) {
        expect(m.by_compliance_rating[r]).toBe(1);
      }
    });
  });

  describe("by_access_decision breakdown", () => {
    it("counts each access decision separately", () => {
      const records = [
        makeRecord({ access_decision: "granted" }),
        makeRecord({ access_decision: "granted" }),
        makeRecord({ access_decision: "denied" }),
      ];
      const m = computeSecureStorageMetrics(records);
      expect(m.by_access_decision).toEqual({ granted: 2, denied: 1 });
    });

    it("handles all five access decisions", () => {
      const decisions: AccessDecision[] = ["granted", "denied", "partial", "referred", "not_applicable"];
      const records = decisions.map((d) => makeRecord({ access_decision: d }));
      const m = computeSecureStorageMetrics(records);
      for (const d of decisions) {
        expect(m.by_access_decision[d]).toBe(1);
      }
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: SecureStorageRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            event_type: i % 3 === 0 ? "storage_audit" : i % 3 === 1 ? "access_log" : "data_breach",
            storage_location: i % 2 === 0 ? "locked_cabinet" : "cloud_storage",
            compliance_rating: "fully_compliant",
            access_decision: i % 4 === 0 ? "granted" : "denied",
            records_affected: 10,
            gdpr_compliant: true,
            encryption_verified: true,
            retention_schedule_followed: true,
          }),
        );
      }
      const m = computeSecureStorageMetrics(records);
      expect(m.total_events).toBe(100);
      expect(m.fully_compliant_rate).toBe(100);
      expect(m.gdpr_compliant_rate).toBe(100);
      expect(m.encryption_verified_rate).toBe(100);
      expect(m.retention_followed_rate).toBe(100);
      expect(m.total_records_affected).toBe(1000);
      // storage_audit: i%3===0 => 34, access_log: i%3===1 => 33, data_breach: i%3===2 => 33
      expect(m.storage_audits).toBe(34);
      expect(m.access_logs).toBe(33);
      expect(m.data_breaches).toBe(33);
    });
  });
});

// ── identifySecureStorageAlerts ────────────────────────────────────────────

describe("identifySecureStorageAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifySecureStorageAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          event_type: "storage_audit",
          compliance_rating: "fully_compliant",
          gdpr_compliant: true,
          encryption_verified: true,
          storage_location: "locked_cabinet",
          next_review_date: daysFromNow(30),
        }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty for single well-formed record with future review", () => {
      const records = [
        makeRecord({
          event_type: "access_log",
          compliance_rating: "mostly_compliant",
          gdpr_compliant: true,
          encryption_verified: true,
          storage_location: "encrypted_digital",
          next_review_date: daysFromNow(10),
        }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("data_breach alert", () => {
    it("fires for a data_breach event_type", () => {
      const records = [makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 50 })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 50 })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "breach-1", event_type: "data_breach", event_date: "2026-05-01", records_affected: 50 })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach")!;
      expect(alert.id).toBe("breach-1");
    });

    it("includes event_date in message", () => {
      const records = [makeRecord({ event_type: "data_breach", event_date: "2026-04-15", records_affected: 10 })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach")!;
      expect(alert.message).toContain("2026-04-15");
    });

    it("includes records_affected in message", () => {
      const records = [makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 75 })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach")!;
      expect(alert.message).toContain("75");
    });

    it("uses singular 'record' for 1 records_affected", () => {
      const records = [makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 1 })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach")!;
      expect(alert.message).toContain("1 record");
      expect(alert.message).not.toContain("1 records");
    });

    it("uses plural 'records' for multiple records_affected", () => {
      const records = [makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 5 })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach")!;
      expect(alert.message).toContain("5 records");
    });

    it("fires per record for multiple data breaches", () => {
      const records = [
        makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 10 }),
        makeRecord({ event_type: "data_breach", event_date: "2026-04-01", records_affected: 20 }),
        makeRecord({ event_type: "data_breach", event_date: "2026-03-01", records_affected: 30 }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const breachAlerts = alerts.filter((a) => a.type === "data_breach");
      expect(breachAlerts).toHaveLength(3);
    });

    it("does not fire for storage_audit", () => {
      const records = [makeRecord({ event_type: "storage_audit" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach");
      expect(alert).toBeUndefined();
    });

    it("does not fire for access_log", () => {
      const records = [makeRecord({ event_type: "access_log" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach");
      expect(alert).toBeUndefined();
    });

    it("does not fire for retention_review", () => {
      const records = [makeRecord({ event_type: "retention_review" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach");
      expect(alert).toBeUndefined();
    });

    it("message contains ICO notification wording", () => {
      const records = [makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 10 })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "data_breach")!;
      expect(alert.message).toContain("ICO notification and remediation");
    });
  });

  describe("non_compliant alert", () => {
    it("fires for non_compliant compliance_rating", () => {
      const records = [makeRecord({ compliance_rating: "non_compliant", event_type: "storage_audit", event_date: "2026-05-01" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ compliance_rating: "non_compliant", event_type: "storage_audit", event_date: "2026-05-01" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "nc-1", compliance_rating: "non_compliant", event_type: "storage_audit", event_date: "2026-05-01" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.id).toBe("nc-1");
    });

    it("includes event_date in message", () => {
      const records = [makeRecord({ compliance_rating: "non_compliant", event_type: "storage_audit", event_date: "2026-03-20" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("2026-03-20");
    });

    it("replaces underscores with spaces in event_type in message", () => {
      const records = [makeRecord({ compliance_rating: "non_compliant", event_type: "storage_audit", event_date: "2026-05-01" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("storage audit");
    });

    it("replaces underscores for subject_access_request", () => {
      const records = [makeRecord({ compliance_rating: "non_compliant", event_type: "subject_access_request", event_date: "2026-05-01" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("subject access request");
    });

    it("replaces underscores for retention_review", () => {
      const records = [makeRecord({ compliance_rating: "non_compliant", event_type: "retention_review", event_date: "2026-05-01" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("retention review");
    });

    it("replaces underscores for backup_check", () => {
      const records = [makeRecord({ compliance_rating: "non_compliant", event_type: "backup_check", event_date: "2026-05-01" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("backup check");
    });

    it("fires per record for multiple non_compliant records", () => {
      const records = [
        makeRecord({ compliance_rating: "non_compliant", event_type: "storage_audit", event_date: "2026-05-01" }),
        makeRecord({ compliance_rating: "non_compliant", event_type: "access_log", event_date: "2026-04-01" }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant");
      expect(ncAlerts).toHaveLength(2);
    });

    it("does not fire for fully_compliant", () => {
      const records = [makeRecord({ compliance_rating: "fully_compliant" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for mostly_compliant", () => {
      const records = [makeRecord({ compliance_rating: "mostly_compliant" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire for partially_compliant", () => {
      const records = [makeRecord({ compliance_rating: "partially_compliant" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant");
      expect(alert).toBeUndefined();
    });

    it("message contains address immediately wording", () => {
      const records = [makeRecord({ compliance_rating: "non_compliant", event_type: "storage_audit", event_date: "2026-05-01" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant")!;
      expect(alert.message).toContain("address immediately per Reg 39");
    });
  });

  describe("gdpr_non_compliant alert", () => {
    it("fires when >= 2 records are not gdpr_compliant", () => {
      const records = [
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "gdpr_non_compliant");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "gdpr_non_compliant")!;
      expect(alert.severity).toBe("high");
    });

    it("has id gdpr_non_compliant", () => {
      const records = [
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "gdpr_non_compliant")!;
      expect(alert.id).toBe("gdpr_non_compliant");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "gdpr_non_compliant")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 record is not gdpr_compliant", () => {
      const records = [
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: true }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "gdpr_non_compliant");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all records are gdpr_compliant", () => {
      const records = [
        makeRecord({ gdpr_compliant: true }),
        makeRecord({ gdpr_compliant: true }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "gdpr_non_compliant");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const gdprAlerts = alerts.filter((a) => a.type === "gdpr_non_compliant");
      expect(gdprAlerts).toHaveLength(1);
    });

    it("message contains review data protection practices wording", () => {
      const records = [
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "gdpr_non_compliant")!;
      expect(alert.message).toContain("review data protection practices");
    });

    it("fires at exactly threshold of 2", () => {
      const records = [
        makeRecord({ gdpr_compliant: false }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "gdpr_non_compliant");
      expect(alert).toBeDefined();
    });
  });

  describe("encryption_not_verified alert", () => {
    it("fires when >= 1 encrypted_digital record has unverified encryption", () => {
      const records = [makeRecord({ encryption_verified: false, storage_location: "encrypted_digital" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified");
      expect(alert).toBeDefined();
    });

    it("fires when >= 1 cloud_storage record has unverified encryption", () => {
      const records = [makeRecord({ encryption_verified: false, storage_location: "cloud_storage" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ encryption_verified: false, storage_location: "encrypted_digital" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id encryption_not_verified", () => {
      const records = [makeRecord({ encryption_verified: false, storage_location: "encrypted_digital" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified")!;
      expect(alert.id).toBe("encryption_not_verified");
    });

    it("uses singular 'record has' for 1 unverified", () => {
      const records = [makeRecord({ encryption_verified: false, storage_location: "encrypted_digital" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified")!;
      expect(alert.message).toContain("1 digital/cloud storage record has unverified encryption");
    });

    it("uses plural 'records have' for multiple unverified", () => {
      const records = [
        makeRecord({ encryption_verified: false, storage_location: "encrypted_digital" }),
        makeRecord({ encryption_verified: false, storage_location: "cloud_storage" }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified")!;
      expect(alert.message).toContain("2 digital/cloud storage records have unverified encryption");
    });

    it("does not fire for locked_cabinet with unverified encryption", () => {
      const records = [makeRecord({ encryption_verified: false, storage_location: "locked_cabinet" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified");
      expect(alert).toBeUndefined();
    });

    it("does not fire for secure_room with unverified encryption", () => {
      const records = [makeRecord({ encryption_verified: false, storage_location: "secure_room" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified");
      expect(alert).toBeUndefined();
    });

    it("does not fire for offsite_storage with unverified encryption", () => {
      const records = [makeRecord({ encryption_verified: false, storage_location: "offsite_storage" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified");
      expect(alert).toBeUndefined();
    });

    it("does not fire for other location with unverified encryption", () => {
      const records = [makeRecord({ encryption_verified: false, storage_location: "other" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified");
      expect(alert).toBeUndefined();
    });

    it("does not fire when encryption is verified for digital/cloud", () => {
      const records = [
        makeRecord({ encryption_verified: true, storage_location: "encrypted_digital" }),
        makeRecord({ encryption_verified: true, storage_location: "cloud_storage" }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ encryption_verified: false, storage_location: "encrypted_digital" }),
        makeRecord({ encryption_verified: false, storage_location: "cloud_storage" }),
        makeRecord({ encryption_verified: false, storage_location: "encrypted_digital" }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const encAlerts = alerts.filter((a) => a.type === "encryption_not_verified");
      expect(encAlerts).toHaveLength(1);
    });

    it("message contains verify encryption status wording", () => {
      const records = [makeRecord({ encryption_verified: false, storage_location: "cloud_storage" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified")!;
      expect(alert.message).toContain("verify encryption status");
    });

    it("counts only digital/cloud records in the message count", () => {
      const records = [
        makeRecord({ encryption_verified: false, storage_location: "encrypted_digital" }),
        makeRecord({ encryption_verified: false, storage_location: "locked_cabinet" }),
        makeRecord({ encryption_verified: false, storage_location: "cloud_storage" }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified")!;
      expect(alert.message).toContain("2 digital/cloud storage records have");
    });
  });

  describe("review_overdue alert", () => {
    it("fires when >= 1 review is overdue", () => {
      const records = [makeRecord({ next_review_date: daysAgo(5) })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ next_review_date: daysAgo(5) })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id review_overdue", () => {
      const records = [makeRecord({ next_review_date: daysAgo(5) })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.id).toBe("review_overdue");
    });

    it("uses singular 'review is' for 1 overdue", () => {
      const records = [makeRecord({ next_review_date: daysAgo(5) })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("1 records storage review is overdue");
    });

    it("uses plural 'reviews are' for multiple overdue", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(5) }),
        makeRecord({ next_review_date: daysAgo(10) }),
        makeRecord({ next_review_date: daysAgo(15) }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("3 records storage reviews are overdue");
    });

    it("does not fire when all reviews are in the future", () => {
      const records = [
        makeRecord({ next_review_date: daysFromNow(10) }),
        makeRecord({ next_review_date: daysFromNow(20) }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all next_review_date are null", () => {
      const records = [
        makeRecord({ next_review_date: null }),
        makeRecord({ next_review_date: null }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires as a single aggregate alert, not per record", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(5) }),
        makeRecord({ next_review_date: daysAgo(10) }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const reviewAlerts = alerts.filter((a) => a.type === "review_overdue");
      expect(reviewAlerts).toHaveLength(1);
    });

    it("message contains schedule review wording", () => {
      const records = [makeRecord({ next_review_date: daysAgo(5) })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("schedule review");
    });

    it("counts only overdue reviews, not future or null", () => {
      const records = [
        makeRecord({ next_review_date: daysAgo(5) }),
        makeRecord({ next_review_date: daysFromNow(10) }),
        makeRecord({ next_review_date: null }),
        makeRecord({ next_review_date: daysAgo(15) }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "review_overdue")!;
      expect(alert.message).toContain("2 records storage reviews are overdue");
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        makeRecord({ id: "r1", event_type: "data_breach", event_date: "2026-05-01", records_affected: 50, compliance_rating: "non_compliant", gdpr_compliant: false, encryption_verified: false, storage_location: "encrypted_digital", next_review_date: daysAgo(5) }),
        makeRecord({ id: "r2", event_type: "storage_audit", gdpr_compliant: false, next_review_date: daysAgo(10) }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("data_breach");
      expect(types).toContain("non_compliant");
      expect(types).toContain("gdpr_non_compliant");
      expect(types).toContain("encryption_not_verified");
      expect(types).toContain("review_overdue");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 50, compliance_rating: "non_compliant", gdpr_compliant: false, encryption_verified: false, storage_location: "encrypted_digital", next_review_date: daysAgo(5) }),
        makeRecord({ gdpr_compliant: false, next_review_date: daysAgo(10) }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      // data_breach=1, non_compliant=1, gdpr_non_compliant=1, encryption_not_verified=1, review_overdue=1
      expect(alerts).toHaveLength(5);
    });

    it("per-record alerts multiply while threshold alerts stay singular", () => {
      const records = [
        makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 10, compliance_rating: "non_compliant", gdpr_compliant: false, encryption_verified: false, storage_location: "encrypted_digital", next_review_date: daysAgo(5) }),
        makeRecord({ event_type: "data_breach", event_date: "2026-04-01", records_affected: 20, compliance_rating: "non_compliant", gdpr_compliant: false, encryption_verified: false, storage_location: "cloud_storage", next_review_date: daysAgo(10) }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      expect(alerts.filter((a) => a.type === "data_breach")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "non_compliant")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "gdpr_non_compliant")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "encryption_not_verified")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "review_overdue")).toHaveLength(1);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 10 }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 10, compliance_rating: "non_compliant", gdpr_compliant: false, encryption_verified: false, storage_location: "encrypted_digital", next_review_date: daysAgo(5) }),
        makeRecord({ gdpr_compliant: false }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ event_type: "data_breach", event_date: "2026-05-01", records_affected: 10 })];
      const alerts = identifySecureStorageAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("encryption_verified=true on digital storage does not trigger encryption alert", () => {
      const records = [makeRecord({ encryption_verified: true, storage_location: "encrypted_digital" })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "encryption_not_verified");
      expect(alert).toBeUndefined();
    });

    it("single gdpr non-compliant does not trigger gdpr alert", () => {
      const records = [makeRecord({ gdpr_compliant: false })];
      const alerts = identifySecureStorageAlerts(records);
      const alert = alerts.find((a) => a.type === "gdpr_non_compliant");
      expect(alert).toBeUndefined();
    });

    it("fully compliant records trigger no alerts", () => {
      const records = [
        makeRecord({
          event_type: "storage_audit",
          compliance_rating: "fully_compliant",
          gdpr_compliant: true,
          encryption_verified: true,
          storage_location: "encrypted_digital",
          next_review_date: daysFromNow(30),
        }),
      ];
      const alerts = identifySecureStorageAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("multiple event types in event_type get underscores replaced properly in non_compliant alert", () => {
      const types: RecordEventType[] = ["storage_audit", "access_log", "retention_review", "subject_access_request", "data_breach", "destruction", "transfer", "backup_check"];
      for (const t of types) {
        const records = [makeRecord({ compliance_rating: "non_compliant", event_type: t, event_date: "2026-05-01" })];
        const alerts = identifySecureStorageAlerts(records);
        const alert = alerts.find((a) => a.type === "non_compliant")!;
        expect(alert.message).toContain(t.replace(/_/g, " "));
      }
    });
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRecord factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRecord();
    expect(r.home_id).toBe("home-1");
    expect(r.event_type).toBe("storage_audit");
    expect(r.event_date).toBe("2026-05-01");
    expect(r.storage_location).toBe("locked_cabinet");
    expect(r.compliance_rating).toBe("fully_compliant");
    expect(r.access_decision).toBe("not_applicable");
    expect(r.requested_by).toBeNull();
    expect(r.authorised_by).toBe("Manager");
    expect(r.records_affected).toBe(10);
    expect(r.gdpr_compliant).toBe(true);
    expect(r.encryption_verified).toBe(true);
    expect(r.retention_schedule_followed).toBe(true);
    expect(r.issues_found).toEqual([]);
    expect(r.actions_taken).toEqual([]);
    expect(r.next_review_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ event_type: "data_breach", compliance_rating: "non_compliant" });
    expect(r.event_type).toBe("data_breach");
    expect(r.compliance_rating).toBe("non_compliant");
    // defaults still apply
    expect(r.storage_location).toBe("locked_cabinet");
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
    const r = makeRecord({ requested_by: null, next_review_date: null, notes: null });
    expect(r.requested_by).toBeNull();
    expect(r.next_review_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting requested_by to a string", () => {
    const r = makeRecord({ requested_by: "John Smith" });
    expect(r.requested_by).toBe("John Smith");
  });

  it("allows setting notes to a string", () => {
    const r = makeRecord({ notes: "Test note" });
    expect(r.notes).toBe("Test note");
  });

  it("allows setting next_review_date to a date string", () => {
    const r = makeRecord({ next_review_date: "2026-12-31" });
    expect(r.next_review_date).toBe("2026-12-31");
  });
});
