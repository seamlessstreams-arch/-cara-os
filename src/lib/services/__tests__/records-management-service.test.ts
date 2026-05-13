// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDS MANAGEMENT SERVICE TESTS
// Pure-function unit tests for records management metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 39 (records — maintenance and availability),
// Reg 40 (retention and destruction), Reg 36 (notification),
// Data Protection Act 2018, UK GDPR.
// SCCIF: Well-Led — "Records are clear, up to date, and stored securely."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  RECORD_CATEGORIES,
  RECORD_STATUSES,
  ACCESS_REQUEST_STATUSES,
  RETENTION_PERIODS,
  DATA_QUALITY_RATINGS,
  listAudits,
  createAudit,
  listAccessRequests,
  createAccessRequest,
  updateAccessRequest,
} from "../records-management-service";

import type {
  RecordAudit,
  AccessRequest,
} from "../records-management-service";

const { computeRecordsMetrics, identifyRecordsAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal RecordAudit with sensible defaults. */
function makeAudit(overrides: Partial<RecordAudit> = {}): RecordAudit {
  return {
    id: "audit-1",
    home_id: "home-1",
    audit_date: daysAgo(7),
    audited_by: "staff-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    records_reviewed: 10,
    records_complete: 9,
    records_incomplete: 1,
    missing_records: [],
    data_quality_rating: "good",
    chronology_up_to_date: true,
    sensitive_data_secure: true,
    third_party_data_redacted: true,
    findings: null,
    actions_required: null,
    next_audit_date: daysFromNow(90),
    created_at: daysAgoISO(7),
    ...overrides,
  };
}

/** Build a minimal AccessRequest with sensible defaults. */
function makeRequest(overrides: Partial<AccessRequest> = {}): AccessRequest {
  return {
    id: "req-1",
    home_id: "home-1",
    request_date: daysAgo(14),
    requester_name: "Jane Doe",
    requester_relationship: "Parent",
    child_id: "child-1",
    child_name: "Alice Smith",
    request_type: "subject_access",
    status: "completed",
    records_requested: "All placement records",
    date_acknowledged: daysAgo(13),
    date_due: daysAgo(1),
    date_completed: daysAgo(2),
    redaction_required: false,
    redaction_notes: null,
    outcome: "Provided in full",
    handled_by: "staff-1",
    notes: null,
    created_at: daysAgoISO(14),
    updated_at: daysAgoISO(2),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// ── RECORD_CATEGORIES ────────────────────────────────────────────────────

describe("RECORD_CATEGORIES", () => {
  it("has exactly 15 categories", () => {
    expect(RECORD_CATEGORIES).toHaveLength(15);
  });

  it("contains unique category values", () => {
    const values = RECORD_CATEGORIES.map((c) => c.category);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = RECORD_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes placement_plan", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "placement_plan")).toBeTruthy();
  });

  it("includes care_plan", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "care_plan")).toBeTruthy();
  });

  it("includes risk_assessment", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "risk_assessment")).toBeTruthy();
  });

  it("includes health_record", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "health_record")).toBeTruthy();
  });

  it("includes education_record", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "education_record")).toBeTruthy();
  });

  it("includes contact_record", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "contact_record")).toBeTruthy();
  });

  it("includes safeguarding", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "safeguarding")).toBeTruthy();
  });

  it("includes incident_record", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "incident_record")).toBeTruthy();
  });

  it("includes daily_record", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "daily_record")).toBeTruthy();
  });

  it("includes key_work_session", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "key_work_session")).toBeTruthy();
  });

  it("includes medication_record", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "medication_record")).toBeTruthy();
  });

  it("includes financial_record", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "financial_record")).toBeTruthy();
  });

  it("includes correspondence", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "correspondence")).toBeTruthy();
  });

  it("includes legal_document", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "legal_document")).toBeTruthy();
  });

  it("includes other", () => {
    expect(RECORD_CATEGORIES.find((c) => c.category === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const c of RECORD_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

// ── RECORD_STATUSES ─────────────────────────────────────────────────────

describe("RECORD_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(RECORD_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = RECORD_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("includes active", () => {
    expect(RECORD_STATUSES.find((s) => s.status === "active")).toBeTruthy();
  });

  it("includes archived", () => {
    expect(RECORD_STATUSES.find((s) => s.status === "archived")).toBeTruthy();
  });

  it("includes pending_review", () => {
    expect(RECORD_STATUSES.find((s) => s.status === "pending_review")).toBeTruthy();
  });

  it("includes pending_destruction", () => {
    expect(RECORD_STATUSES.find((s) => s.status === "pending_destruction")).toBeTruthy();
  });

  it("includes destroyed", () => {
    expect(RECORD_STATUSES.find((s) => s.status === "destroyed")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of RECORD_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

// ── ACCESS_REQUEST_STATUSES ─────────────────────────────────────────────

describe("ACCESS_REQUEST_STATUSES", () => {
  it("has exactly 6 statuses", () => {
    expect(ACCESS_REQUEST_STATUSES).toHaveLength(6);
  });

  it("contains unique status values", () => {
    const values = ACCESS_REQUEST_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("includes received", () => {
    expect(ACCESS_REQUEST_STATUSES.find((s) => s.status === "received")).toBeTruthy();
  });

  it("includes acknowledged", () => {
    expect(ACCESS_REQUEST_STATUSES.find((s) => s.status === "acknowledged")).toBeTruthy();
  });

  it("includes in_progress", () => {
    expect(ACCESS_REQUEST_STATUSES.find((s) => s.status === "in_progress")).toBeTruthy();
  });

  it("includes redacting", () => {
    expect(ACCESS_REQUEST_STATUSES.find((s) => s.status === "redacting")).toBeTruthy();
  });

  it("includes completed", () => {
    expect(ACCESS_REQUEST_STATUSES.find((s) => s.status === "completed")).toBeTruthy();
  });

  it("includes refused", () => {
    expect(ACCESS_REQUEST_STATUSES.find((s) => s.status === "refused")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of ACCESS_REQUEST_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("contains unique labels", () => {
    const labels = ACCESS_REQUEST_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

// ── RETENTION_PERIODS ───────────────────────────────────────────────────

describe("RETENTION_PERIODS", () => {
  it("has exactly 8 periods", () => {
    expect(RETENTION_PERIODS).toHaveLength(8);
  });

  it("contains unique period values", () => {
    const values = RETENTION_PERIODS.map((p) => p.period);
    expect(new Set(values).size).toBe(values.length);
  });

  it("includes until_25th_birthday", () => {
    expect(RETENTION_PERIODS.find((p) => p.period === "until_25th_birthday")).toBeTruthy();
  });

  it("includes until_75th_birthday", () => {
    expect(RETENTION_PERIODS.find((p) => p.period === "until_75th_birthday")).toBeTruthy();
  });

  it("includes 35_years_from_closure", () => {
    expect(RETENTION_PERIODS.find((p) => p.period === "35_years_from_closure")).toBeTruthy();
  });

  it("includes 75_years_from_closure", () => {
    expect(RETENTION_PERIODS.find((p) => p.period === "75_years_from_closure")).toBeTruthy();
  });

  it("includes permanent", () => {
    expect(RETENTION_PERIODS.find((p) => p.period === "permanent")).toBeTruthy();
  });

  it("includes 7_years", () => {
    expect(RETENTION_PERIODS.find((p) => p.period === "7_years")).toBeTruthy();
  });

  it("includes 3_years", () => {
    expect(RETENTION_PERIODS.find((p) => p.period === "3_years")).toBeTruthy();
  });

  it("includes other", () => {
    expect(RETENTION_PERIODS.find((p) => p.period === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const p of RETENTION_PERIODS) {
      expect(p.label.length).toBeGreaterThan(0);
    }
  });

  it("contains unique labels", () => {
    const labels = RETENTION_PERIODS.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

// ── DATA_QUALITY_RATINGS ────────────────────────────────────────────────

describe("DATA_QUALITY_RATINGS", () => {
  it("has exactly 5 ratings", () => {
    expect(DATA_QUALITY_RATINGS).toHaveLength(5);
  });

  it("contains unique rating values", () => {
    const values = DATA_QUALITY_RATINGS.map((r) => r.rating);
    expect(new Set(values).size).toBe(values.length);
  });

  it("includes excellent", () => {
    expect(DATA_QUALITY_RATINGS.find((r) => r.rating === "excellent")).toBeTruthy();
  });

  it("includes good", () => {
    expect(DATA_QUALITY_RATINGS.find((r) => r.rating === "good")).toBeTruthy();
  });

  it("includes adequate", () => {
    expect(DATA_QUALITY_RATINGS.find((r) => r.rating === "adequate")).toBeTruthy();
  });

  it("includes poor", () => {
    expect(DATA_QUALITY_RATINGS.find((r) => r.rating === "poor")).toBeTruthy();
  });

  it("includes not_assessed", () => {
    expect(DATA_QUALITY_RATINGS.find((r) => r.rating === "not_assessed")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const r of DATA_QUALITY_RATINGS) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });

  it("contains unique labels", () => {
    const labels = DATA_QUALITY_RATINGS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeRecordsMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeRecordsMetrics", () => {
  it("returns zeroed metrics for empty arrays", () => {
    const m = computeRecordsMetrics([], [], 0);
    expect(m.children_audited).toBe(0);
    expect(m.avg_completeness_rate).toBe(0);
    expect(m.avg_data_quality).toBe(0);
    expect(m.children_with_poor_quality).toBe(0);
    expect(m.total_access_requests).toBe(0);
    expect(m.open_access_requests).toBe(0);
    expect(m.avg_response_days).toBe(0);
    expect(m.overdue_access_requests).toBe(0);
    expect(m.overdue_audits).toBe(0);
    expect(Object.keys(m.by_quality_rating)).toHaveLength(0);
    expect(Object.keys(m.by_request_type)).toHaveLength(0);
    expect(m.chronology_compliance).toBe(0);
  });

  // ── children_audited ──────────────────────────────────────────────────

  it("counts unique children audited", () => {
    const audits = [
      makeAudit({ id: "a1", child_id: "c1" }),
      makeAudit({ id: "a2", child_id: "c2" }),
      makeAudit({ id: "a3", child_id: "c3" }),
    ];
    const m = computeRecordsMetrics(audits, [], 5);
    expect(m.children_audited).toBe(3);
  });

  it("does not double-count the same child_id", () => {
    const audits = [
      makeAudit({ id: "a1", child_id: "c1" }),
      makeAudit({ id: "a2", child_id: "c1" }),
      makeAudit({ id: "a3", child_id: "c2" }),
    ];
    const m = computeRecordsMetrics(audits, [], 3);
    expect(m.children_audited).toBe(2);
  });

  it("returns 0 children audited when no audits", () => {
    const m = computeRecordsMetrics([], [], 5);
    expect(m.children_audited).toBe(0);
  });

  it("counts 1 child audited with a single audit", () => {
    const m = computeRecordsMetrics([makeAudit()], [], 1);
    expect(m.children_audited).toBe(1);
  });

  // ── avg_completeness_rate ─────────────────────────────────────────────

  it("calculates avg_completeness_rate with perfect records", () => {
    const audits = [
      makeAudit({ records_reviewed: 10, records_complete: 10 }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.avg_completeness_rate).toBe(100);
  });

  it("calculates avg_completeness_rate across multiple audits", () => {
    const audits = [
      makeAudit({ id: "a1", records_reviewed: 10, records_complete: 8 }),
      makeAudit({ id: "a2", records_reviewed: 10, records_complete: 6 }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    // total_complete=14, total_reviewed=20 => 14/20=70%
    expect(m.avg_completeness_rate).toBe(70);
  });

  it("returns 0 avg_completeness_rate when no records reviewed", () => {
    const audits = [
      makeAudit({ records_reviewed: 0, records_complete: 0 }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.avg_completeness_rate).toBe(0);
  });

  it("rounds avg_completeness_rate to one decimal place", () => {
    const audits = [
      makeAudit({ id: "a1", records_reviewed: 3, records_complete: 1 }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    // 1/3 = 33.333... => 33.3
    expect(m.avg_completeness_rate).toBe(33.3);
  });

  it("calculates avg_completeness_rate with mixed completeness", () => {
    const audits = [
      makeAudit({ id: "a1", records_reviewed: 10, records_complete: 10 }),
      makeAudit({ id: "a2", records_reviewed: 10, records_complete: 5 }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    // 15/20 = 75%
    expect(m.avg_completeness_rate).toBe(75);
  });

  // ── avg_data_quality ──────────────────────────────────────────────────

  it("calculates avg_data_quality for excellent=5", () => {
    const audits = [
      makeAudit({ data_quality_rating: "excellent" }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.avg_data_quality).toBe(5);
  });

  it("calculates avg_data_quality for good=4", () => {
    const audits = [
      makeAudit({ data_quality_rating: "good" }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.avg_data_quality).toBe(4);
  });

  it("calculates avg_data_quality for adequate=3", () => {
    const audits = [
      makeAudit({ data_quality_rating: "adequate" }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.avg_data_quality).toBe(3);
  });

  it("calculates avg_data_quality for poor=2", () => {
    const audits = [
      makeAudit({ data_quality_rating: "poor" }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.avg_data_quality).toBe(2);
  });

  it("excludes not_assessed from avg_data_quality calculation", () => {
    const audits = [
      makeAudit({ id: "a1", data_quality_rating: "excellent" }),
      makeAudit({ id: "a2", data_quality_rating: "not_assessed" }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    // Only excellent=5 counted, not_assessed excluded => 5/1 = 5.0
    expect(m.avg_data_quality).toBe(5);
  });

  it("returns 0 avg_data_quality when all are not_assessed", () => {
    const audits = [
      makeAudit({ id: "a1", data_quality_rating: "not_assessed" }),
      makeAudit({ id: "a2", data_quality_rating: "not_assessed" }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.avg_data_quality).toBe(0);
  });

  it("calculates avg_data_quality for mixed ratings", () => {
    const audits = [
      makeAudit({ id: "a1", data_quality_rating: "excellent" }), // 5
      makeAudit({ id: "a2", data_quality_rating: "good" }),      // 4
      makeAudit({ id: "a3", data_quality_rating: "poor" }),      // 2
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    // (5+4+2)/3 = 3.666... => 3.7
    expect(m.avg_data_quality).toBe(3.7);
  });

  it("rounds avg_data_quality to one decimal place", () => {
    const audits = [
      makeAudit({ id: "a1", data_quality_rating: "excellent" }), // 5
      makeAudit({ id: "a2", data_quality_rating: "adequate" }),   // 3
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    // (5+3)/2 = 4.0
    expect(m.avg_data_quality).toBe(4);
  });

  // ── children_with_poor_quality ────────────────────────────────────────

  it("counts children with poor data quality", () => {
    const audits = [
      makeAudit({ id: "a1", child_id: "c1", data_quality_rating: "poor" }),
      makeAudit({ id: "a2", child_id: "c2", data_quality_rating: "good" }),
      makeAudit({ id: "a3", child_id: "c3", data_quality_rating: "poor" }),
    ];
    const m = computeRecordsMetrics(audits, [], 3);
    expect(m.children_with_poor_quality).toBe(2);
  });

  it("returns 0 children_with_poor_quality when none are poor", () => {
    const audits = [
      makeAudit({ id: "a1", data_quality_rating: "excellent" }),
      makeAudit({ id: "a2", data_quality_rating: "good" }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.children_with_poor_quality).toBe(0);
  });

  // ── total_access_requests ─────────────────────────────────────────────

  it("counts total access requests", () => {
    const requests = [
      makeRequest({ id: "r1" }),
      makeRequest({ id: "r2" }),
      makeRequest({ id: "r3" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.total_access_requests).toBe(3);
  });

  it("returns 0 total_access_requests when none exist", () => {
    const m = computeRecordsMetrics([], [], 0);
    expect(m.total_access_requests).toBe(0);
  });

  // ── open_access_requests ──────────────────────────────────────────────

  it("counts open requests with received status", () => {
    const requests = [
      makeRequest({ id: "r1", status: "received" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.open_access_requests).toBe(1);
  });

  it("counts open requests with acknowledged status", () => {
    const requests = [
      makeRequest({ id: "r1", status: "acknowledged" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.open_access_requests).toBe(1);
  });

  it("counts open requests with in_progress status", () => {
    const requests = [
      makeRequest({ id: "r1", status: "in_progress" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.open_access_requests).toBe(1);
  });

  it("counts open requests with redacting status", () => {
    const requests = [
      makeRequest({ id: "r1", status: "redacting" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.open_access_requests).toBe(1);
  });

  it("does not count completed as open", () => {
    const requests = [
      makeRequest({ id: "r1", status: "completed" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.open_access_requests).toBe(0);
  });

  it("does not count refused as open", () => {
    const requests = [
      makeRequest({ id: "r1", status: "refused" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.open_access_requests).toBe(0);
  });

  it("counts multiple open statuses together", () => {
    const requests = [
      makeRequest({ id: "r1", status: "received" }),
      makeRequest({ id: "r2", status: "in_progress" }),
      makeRequest({ id: "r3", status: "completed" }),
      makeRequest({ id: "r4", status: "redacting" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.open_access_requests).toBe(3);
  });

  // ── avg_response_days ─────────────────────────────────────────────────

  it("calculates avg_response_days for completed requests", () => {
    const requests = [
      makeRequest({
        id: "r1",
        request_date: daysAgo(20),
        date_completed: daysAgo(10),
      }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.avg_response_days).toBe(10);
  });

  it("averages response days across multiple completed requests", () => {
    const requests = [
      makeRequest({
        id: "r1",
        request_date: daysAgo(30),
        date_completed: daysAgo(20),
      }), // 10 days
      makeRequest({
        id: "r2",
        request_date: daysAgo(20),
        date_completed: daysAgo(0),
      }), // 20 days
    ];
    const m = computeRecordsMetrics([], requests, 0);
    // (10+20)/2 = 15
    expect(m.avg_response_days).toBe(15);
  });

  it("returns 0 avg_response_days when no completed requests", () => {
    const requests = [
      makeRequest({ id: "r1", status: "received", date_completed: null }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.avg_response_days).toBe(0);
  });

  it("ignores requests without date_completed for avg_response_days", () => {
    const requests = [
      makeRequest({
        id: "r1",
        request_date: daysAgo(10),
        date_completed: daysAgo(0),
      }), // 10 days
      makeRequest({
        id: "r2",
        request_date: daysAgo(5),
        date_completed: null,
      }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.avg_response_days).toBe(10);
  });

  // ── overdue_access_requests ───────────────────────────────────────────

  it("counts overdue open requests", () => {
    const requests = [
      makeRequest({
        id: "r1",
        status: "in_progress",
        date_due: daysAgo(5),
      }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.overdue_access_requests).toBe(1);
  });

  it("does not count completed requests as overdue", () => {
    const requests = [
      makeRequest({
        id: "r1",
        status: "completed",
        date_due: daysAgo(5),
      }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.overdue_access_requests).toBe(0);
  });

  it("does not count future-due open requests as overdue", () => {
    const requests = [
      makeRequest({
        id: "r1",
        status: "in_progress",
        date_due: daysFromNow(10),
      }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.overdue_access_requests).toBe(0);
  });

  it("does not count requests without date_due as overdue", () => {
    const requests = [
      makeRequest({
        id: "r1",
        status: "received",
        date_due: null,
      }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.overdue_access_requests).toBe(0);
  });

  // ── overdue_audits ────────────────────────────────────────────────────

  it("counts overdue audits", () => {
    const audits = [
      makeAudit({ id: "a1", next_audit_date: daysAgo(10) }),
      makeAudit({ id: "a2", next_audit_date: daysFromNow(30) }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.overdue_audits).toBe(1);
  });

  it("does not count audits with future next_audit_date", () => {
    const audits = [
      makeAudit({ next_audit_date: daysFromNow(60) }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.overdue_audits).toBe(0);
  });

  it("does not count audits with null next_audit_date", () => {
    const audits = [
      makeAudit({ next_audit_date: null }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.overdue_audits).toBe(0);
  });

  it("counts multiple overdue audits", () => {
    const audits = [
      makeAudit({ id: "a1", next_audit_date: daysAgo(5) }),
      makeAudit({ id: "a2", next_audit_date: daysAgo(20) }),
      makeAudit({ id: "a3", next_audit_date: daysAgo(1) }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.overdue_audits).toBe(3);
  });

  // ── by_quality_rating ─────────────────────────────────────────────────

  it("tallies by_quality_rating correctly", () => {
    const audits = [
      makeAudit({ id: "a1", data_quality_rating: "excellent" }),
      makeAudit({ id: "a2", data_quality_rating: "good" }),
      makeAudit({ id: "a3", data_quality_rating: "good" }),
      makeAudit({ id: "a4", data_quality_rating: "poor" }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.by_quality_rating["excellent"]).toBe(1);
    expect(m.by_quality_rating["good"]).toBe(2);
    expect(m.by_quality_rating["poor"]).toBe(1);
  });

  it("by_quality_rating is empty when no audits", () => {
    const m = computeRecordsMetrics([], [], 0);
    expect(Object.keys(m.by_quality_rating)).toHaveLength(0);
  });

  it("by_quality_rating only includes ratings that exist in data", () => {
    const audits = [
      makeAudit({ id: "a1", data_quality_rating: "adequate" }),
      makeAudit({ id: "a2", data_quality_rating: "adequate" }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.by_quality_rating["adequate"]).toBe(2);
    expect(m.by_quality_rating["excellent"]).toBeUndefined();
    expect(m.by_quality_rating["poor"]).toBeUndefined();
  });

  // ── by_request_type ───────────────────────────────────────────────────

  it("tallies by_request_type correctly", () => {
    const requests = [
      makeRequest({ id: "r1", request_type: "subject_access" }),
      makeRequest({ id: "r2", request_type: "subject_access" }),
      makeRequest({ id: "r3", request_type: "court_order" }),
      makeRequest({ id: "r4", request_type: "ofsted" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.by_request_type["subject_access"]).toBe(2);
    expect(m.by_request_type["court_order"]).toBe(1);
    expect(m.by_request_type["ofsted"]).toBe(1);
  });

  it("by_request_type is empty when no requests", () => {
    const m = computeRecordsMetrics([], [], 0);
    expect(Object.keys(m.by_request_type)).toHaveLength(0);
  });

  it("by_request_type includes third_party and social_worker types", () => {
    const requests = [
      makeRequest({ id: "r1", request_type: "third_party" }),
      makeRequest({ id: "r2", request_type: "social_worker" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.by_request_type["third_party"]).toBe(1);
    expect(m.by_request_type["social_worker"]).toBe(1);
  });

  // ── chronology_compliance ─────────────────────────────────────────────

  it("calculates chronology_compliance at 100% when all up to date", () => {
    const audits = [
      makeAudit({ id: "a1", chronology_up_to_date: true }),
      makeAudit({ id: "a2", chronology_up_to_date: true }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.chronology_compliance).toBe(100);
  });

  it("calculates chronology_compliance at 0% when none up to date", () => {
    const audits = [
      makeAudit({ id: "a1", chronology_up_to_date: false }),
      makeAudit({ id: "a2", chronology_up_to_date: false }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    expect(m.chronology_compliance).toBe(0);
  });

  it("calculates chronology_compliance with mixed values", () => {
    const audits = [
      makeAudit({ id: "a1", chronology_up_to_date: true }),
      makeAudit({ id: "a2", chronology_up_to_date: false }),
      makeAudit({ id: "a3", chronology_up_to_date: true }),
    ];
    const m = computeRecordsMetrics(audits, [], 0);
    // 2/3 = 66.7%
    expect(m.chronology_compliance).toBe(66.7);
  });

  it("returns 0 chronology_compliance when no audits", () => {
    const m = computeRecordsMetrics([], [], 0);
    expect(m.chronology_compliance).toBe(0);
  });

  // ── Combined scenario ─────────────────────────────────────────────────

  it("handles a full scenario with audits and requests together", () => {
    const audits = [
      makeAudit({
        id: "a1",
        child_id: "c1",
        records_reviewed: 10,
        records_complete: 8,
        data_quality_rating: "good",
        chronology_up_to_date: true,
        next_audit_date: daysFromNow(30),
      }),
      makeAudit({
        id: "a2",
        child_id: "c2",
        records_reviewed: 10,
        records_complete: 10,
        data_quality_rating: "excellent",
        chronology_up_to_date: true,
        next_audit_date: daysAgo(5),
      }),
    ];
    const requests = [
      makeRequest({
        id: "r1",
        status: "completed",
        request_type: "subject_access",
        request_date: daysAgo(20),
        date_completed: daysAgo(5),
        date_due: daysAgo(1),
      }),
      makeRequest({
        id: "r2",
        status: "in_progress",
        request_type: "ofsted",
        date_due: daysFromNow(10),
        date_completed: null,
      }),
    ];
    const m = computeRecordsMetrics(audits, requests, 3);
    expect(m.children_audited).toBe(2);
    expect(m.avg_completeness_rate).toBe(90); // 18/20
    expect(m.total_access_requests).toBe(2);
    expect(m.open_access_requests).toBe(1);
    expect(m.overdue_audits).toBe(1);
    expect(m.chronology_compliance).toBe(100);
    expect(m.by_quality_rating["good"]).toBe(1);
    expect(m.by_quality_rating["excellent"]).toBe(1);
    expect(m.by_request_type["subject_access"]).toBe(1);
    expect(m.by_request_type["ofsted"]).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyRecordsAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyRecordsAlerts", () => {
  const now = new Date(new Date().toISOString().split("T")[0]);

  it("returns no alerts for a fully compliant setup", () => {
    const audit = makeAudit({
      data_quality_rating: "good",
      chronology_up_to_date: true,
      sensitive_data_secure: true,
      records_reviewed: 10,
      records_incomplete: 1,
      next_audit_date: daysFromNow(30),
    });
    const request = makeRequest({
      status: "completed",
      date_due: daysAgo(1),
      date_completed: daysAgo(2),
    });
    const alerts = identifyRecordsAlerts([audit], [request], 1, now);
    expect(alerts).toHaveLength(0);
  });

  // ── poor_data_quality ─────────────────────────────────────────────────

  it("raises high alert for poor data quality", () => {
    const audit = makeAudit({
      id: "a1",
      child_name: "Alice",
      data_quality_rating: "poor",
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "poor_data_quality");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("a1");
  });

  it("includes child name in poor_data_quality message", () => {
    const audit = makeAudit({
      child_name: "Bob Jones",
      data_quality_rating: "poor",
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "poor_data_quality");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("mentions Reg 39 in poor_data_quality message", () => {
    const audit = makeAudit({ data_quality_rating: "poor" });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "poor_data_quality");
    expect(alert!.message).toContain("Reg 39");
  });

  it("does not raise poor_data_quality for good rating", () => {
    const audit = makeAudit({ data_quality_rating: "good" });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "poor_data_quality");
    expect(alert).toBeUndefined();
  });

  it("does not raise poor_data_quality for excellent rating", () => {
    const audit = makeAudit({ data_quality_rating: "excellent" });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "poor_data_quality");
    expect(alert).toBeUndefined();
  });

  it("does not raise poor_data_quality for adequate rating", () => {
    const audit = makeAudit({ data_quality_rating: "adequate" });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "poor_data_quality");
    expect(alert).toBeUndefined();
  });

  it("does not raise poor_data_quality for not_assessed rating", () => {
    const audit = makeAudit({ data_quality_rating: "not_assessed" });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "poor_data_quality");
    expect(alert).toBeUndefined();
  });

  it("raises poor_data_quality for multiple poor audits", () => {
    const audits = [
      makeAudit({ id: "a1", child_id: "c1", data_quality_rating: "poor" }),
      makeAudit({ id: "a2", child_id: "c2", data_quality_rating: "poor" }),
    ];
    const alerts = identifyRecordsAlerts(audits, [], 2, now);
    const poorAlerts = alerts.filter((a) => a.type === "poor_data_quality");
    expect(poorAlerts).toHaveLength(2);
  });

  // ── high_incompleteness ───────────────────────────────────────────────

  it("raises high alert when incompleteness > 20%", () => {
    const audit = makeAudit({
      id: "a1",
      child_name: "Charlie",
      records_reviewed: 10,
      records_incomplete: 3, // 30%
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "high_incompleteness");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("a1");
  });

  it("includes percentage in high_incompleteness message", () => {
    const audit = makeAudit({
      child_name: "Charlie",
      records_reviewed: 10,
      records_incomplete: 5, // 50%
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "high_incompleteness");
    expect(alert!.message).toContain("50%");
  });

  it("does not raise high_incompleteness at exactly 20%", () => {
    const audit = makeAudit({
      records_reviewed: 10,
      records_incomplete: 2, // exactly 20%
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "high_incompleteness");
    expect(alert).toBeUndefined();
  });

  it("does not raise high_incompleteness at 10%", () => {
    const audit = makeAudit({
      records_reviewed: 10,
      records_incomplete: 1, // 10%
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "high_incompleteness");
    expect(alert).toBeUndefined();
  });

  it("does not raise high_incompleteness when records_reviewed is 0", () => {
    const audit = makeAudit({
      records_reviewed: 0,
      records_incomplete: 0,
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "high_incompleteness");
    expect(alert).toBeUndefined();
  });

  it("does not raise high_incompleteness when records_incomplete is 0", () => {
    const audit = makeAudit({
      records_reviewed: 10,
      records_incomplete: 0,
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "high_incompleteness");
    expect(alert).toBeUndefined();
  });

  // ── chronology_outdated ───────────────────────────────────────────────

  it("raises medium alert when chronology is not up to date", () => {
    const audit = makeAudit({
      id: "a1",
      child_name: "Diana",
      chronology_up_to_date: false,
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "chronology_outdated");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("medium");
    expect(alert!.id).toBe("a1");
  });

  it("includes child name in chronology_outdated message", () => {
    const audit = makeAudit({
      child_name: "Diana Prince",
      chronology_up_to_date: false,
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "chronology_outdated");
    expect(alert!.message).toContain("Diana Prince");
  });

  it("does not raise chronology_outdated when up to date", () => {
    const audit = makeAudit({ chronology_up_to_date: true });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "chronology_outdated");
    expect(alert).toBeUndefined();
  });

  // ── sensitive_data_insecure ───────────────────────────────────────────

  it("raises critical alert when sensitive data is not secure", () => {
    const audit = makeAudit({
      id: "a1",
      child_name: "Eve",
      sensitive_data_secure: false,
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "sensitive_data_insecure");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("critical");
    expect(alert!.id).toBe("a1");
  });

  it("includes child name in sensitive_data_insecure message", () => {
    const audit = makeAudit({
      child_name: "Eve Adams",
      sensitive_data_secure: false,
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "sensitive_data_insecure");
    expect(alert!.message).toContain("Eve Adams");
  });

  it("mentions Data Protection Act in sensitive_data_insecure message", () => {
    const audit = makeAudit({ sensitive_data_secure: false });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "sensitive_data_insecure");
    expect(alert!.message).toContain("Data Protection Act");
  });

  it("does not raise sensitive_data_insecure when secure", () => {
    const audit = makeAudit({ sensitive_data_secure: true });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "sensitive_data_insecure");
    expect(alert).toBeUndefined();
  });

  // ── audit_overdue ─────────────────────────────────────────────────────

  it("raises medium alert when audit is overdue", () => {
    const audit = makeAudit({
      id: "a1",
      child_name: "Frank",
      next_audit_date: daysAgo(10),
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "audit_overdue");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("medium");
    expect(alert!.id).toBe("a1");
  });

  it("includes child name in audit_overdue message", () => {
    const audit = makeAudit({
      child_name: "Frank Miller",
      next_audit_date: daysAgo(5),
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "audit_overdue");
    expect(alert!.message).toContain("Frank Miller");
  });

  it("does not raise audit_overdue for future audit date", () => {
    const audit = makeAudit({ next_audit_date: daysFromNow(30) });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "audit_overdue");
    expect(alert).toBeUndefined();
  });

  it("does not raise audit_overdue when next_audit_date is null", () => {
    const audit = makeAudit({ next_audit_date: null });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const alert = alerts.find((a) => a.type === "audit_overdue");
    expect(alert).toBeUndefined();
  });

  // ── access_request_overdue ────────────────────────────────────────────

  it("raises high alert when access request is overdue", () => {
    const request = makeRequest({
      id: "r1",
      requester_name: "Jane Doe",
      child_name: "Alice",
      status: "in_progress",
      date_due: daysAgo(5),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("r1");
  });

  it("raises critical alert when access request is > 30 days overdue", () => {
    const request = makeRequest({
      id: "r1",
      status: "in_progress",
      date_due: daysAgo(35),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("critical");
  });

  it("includes days overdue in access_request_overdue message", () => {
    const request = makeRequest({
      id: "r1",
      requester_name: "Jane Doe",
      child_name: "Alice",
      status: "received",
      date_due: daysAgo(10),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert!.message).toContain("10");
  });

  it("does not raise access_request_overdue for completed requests", () => {
    const request = makeRequest({
      status: "completed",
      date_due: daysAgo(10),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeUndefined();
  });

  it("does not raise access_request_overdue for refused requests", () => {
    const request = makeRequest({
      status: "refused",
      date_due: daysAgo(10),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeUndefined();
  });

  it("does not raise access_request_overdue when date_due is null", () => {
    const request = makeRequest({
      status: "in_progress",
      date_due: null,
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeUndefined();
  });

  it("does not raise access_request_overdue when date_due is in the future", () => {
    const request = makeRequest({
      status: "in_progress",
      date_due: daysFromNow(10),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeUndefined();
  });

  it("raises overdue for received status with past date_due", () => {
    const request = makeRequest({
      status: "received",
      date_due: daysAgo(3),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeTruthy();
  });

  it("raises overdue for acknowledged status with past date_due", () => {
    const request = makeRequest({
      status: "acknowledged",
      date_due: daysAgo(3),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeTruthy();
  });

  it("raises overdue for redacting status with past date_due", () => {
    const request = makeRequest({
      status: "redacting",
      date_due: daysAgo(3),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeTruthy();
  });

  it("access_request_overdue at exactly 30 days is high not critical", () => {
    const request = makeRequest({
      status: "in_progress",
      date_due: daysAgo(30),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
  });

  it("access_request_overdue at 31 days is critical", () => {
    const request = makeRequest({
      status: "in_progress",
      date_due: daysAgo(31),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_overdue");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("critical");
  });

  // ── access_request_not_acknowledged ───────────────────────────────────

  it("raises medium alert when request not acknowledged after > 2 days", () => {
    const request = makeRequest({
      id: "r1",
      requester_name: "John Smith",
      status: "received",
      request_date: daysAgo(5),
      date_acknowledged: null,
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_not_acknowledged");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("medium");
    expect(alert!.id).toBe("r1");
  });

  it("includes requester name in not_acknowledged message", () => {
    const request = makeRequest({
      requester_name: "John Smith",
      status: "received",
      request_date: daysAgo(5),
      date_acknowledged: null,
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_not_acknowledged");
    expect(alert!.message).toContain("John Smith");
  });

  it("includes days since request in not_acknowledged message", () => {
    const request = makeRequest({
      requester_name: "John Smith",
      status: "received",
      request_date: daysAgo(7),
      date_acknowledged: null,
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_not_acknowledged");
    expect(alert!.message).toContain("7");
  });

  it("does not raise not_acknowledged at exactly 2 days", () => {
    const request = makeRequest({
      status: "received",
      request_date: daysAgo(2),
      date_acknowledged: null,
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_not_acknowledged");
    expect(alert).toBeUndefined();
  });

  it("does not raise not_acknowledged at 1 day", () => {
    const request = makeRequest({
      status: "received",
      request_date: daysAgo(1),
      date_acknowledged: null,
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_not_acknowledged");
    expect(alert).toBeUndefined();
  });

  it("does not raise not_acknowledged when already acknowledged", () => {
    const request = makeRequest({
      status: "received",
      request_date: daysAgo(5),
      date_acknowledged: daysAgo(4),
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_not_acknowledged");
    expect(alert).toBeUndefined();
  });

  it("does not raise not_acknowledged for non-received status", () => {
    const request = makeRequest({
      status: "in_progress",
      request_date: daysAgo(5),
      date_acknowledged: null,
    });
    const alerts = identifyRecordsAlerts([], [request], 0, now);
    const alert = alerts.find((a) => a.type === "access_request_not_acknowledged");
    expect(alert).toBeUndefined();
  });

  // ── children_not_audited ──────────────────────────────────────────────

  it("raises medium alert when some children are not audited", () => {
    const audit = makeAudit({ child_id: "c1" });
    const alerts = identifyRecordsAlerts([audit], [], 3, now);
    const alert = alerts.find((a) => a.type === "children_not_audited");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("medium");
  });

  it("includes missing count in children_not_audited message", () => {
    const audit = makeAudit({ child_id: "c1" });
    const alerts = identifyRecordsAlerts([audit], [], 4, now);
    const alert = alerts.find((a) => a.type === "children_not_audited");
    expect(alert!.message).toContain("3");
  });

  it("does not raise children_not_audited when all children are audited", () => {
    const audits = [
      makeAudit({ id: "a1", child_id: "c1" }),
      makeAudit({ id: "a2", child_id: "c2" }),
    ];
    const alerts = identifyRecordsAlerts(audits, [], 2, now);
    const alert = alerts.find((a) => a.type === "children_not_audited");
    expect(alert).toBeUndefined();
  });

  it("does not raise children_not_audited when totalChildren is 0", () => {
    const alerts = identifyRecordsAlerts([], [], 0, now);
    const alert = alerts.find((a) => a.type === "children_not_audited");
    expect(alert).toBeUndefined();
  });

  it("children_not_audited uses first audit id when available", () => {
    const audit = makeAudit({ id: "first-audit", child_id: "c1" });
    const alerts = identifyRecordsAlerts([audit], [], 3, now);
    const alert = alerts.find((a) => a.type === "children_not_audited");
    expect(alert!.id).toBe("first-audit");
  });

  it("children_not_audited uses 'system' when no audits", () => {
    const alerts = identifyRecordsAlerts([], [], 2, now);
    const alert = alerts.find((a) => a.type === "children_not_audited");
    expect(alert!.id).toBe("system");
  });

  // ── now parameter ─────────────────────────────────────────────────────

  it("now parameter defaults correctly (does not throw without it)", () => {
    const audit = makeAudit({ next_audit_date: daysAgo(5) });
    const alerts = identifyRecordsAlerts([audit], [], 1);
    const overdue = alerts.find((a) => a.type === "audit_overdue");
    expect(overdue).toBeTruthy();
  });

  it("now parameter shifts overdue detection for audits", () => {
    const pastNow = new Date();
    pastNow.setDate(pastNow.getDate() - 100);
    const audit = makeAudit({ next_audit_date: daysAgo(5) });
    // next_audit_date is 5 days ago from real now, but pastNow is 100 days ago
    // so next_audit_date is 95 days in the future relative to pastNow
    const alerts = identifyRecordsAlerts([audit], [], 1, pastNow);
    const overdue = alerts.find((a) => a.type === "audit_overdue");
    expect(overdue).toBeUndefined();
  });

  it("now parameter shifts overdue detection for access requests", () => {
    const pastNow = new Date();
    pastNow.setDate(pastNow.getDate() - 100);
    const request = makeRequest({
      status: "in_progress",
      date_due: daysAgo(5),
    });
    // date_due is 5 days ago from real now, but pastNow is 100 days ago
    const alerts = identifyRecordsAlerts([], [request], 0, pastNow);
    const overdue = alerts.find((a) => a.type === "access_request_overdue");
    expect(overdue).toBeUndefined();
  });

  // ── Multiple alert types ──────────────────────────────────────────────

  it("raises multiple alerts for a single audit with many issues", () => {
    const audit = makeAudit({
      id: "a1",
      data_quality_rating: "poor",
      records_reviewed: 10,
      records_incomplete: 5,
      chronology_up_to_date: false,
      sensitive_data_secure: false,
      next_audit_date: daysAgo(10),
    });
    const alerts = identifyRecordsAlerts([audit], [], 1, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("poor_data_quality");
    expect(types).toContain("high_incompleteness");
    expect(types).toContain("chronology_outdated");
    expect(types).toContain("sensitive_data_insecure");
    expect(types).toContain("audit_overdue");
  });

  it("raises combined alerts from audits and access requests", () => {
    const audit = makeAudit({
      id: "a1",
      data_quality_rating: "poor",
      next_audit_date: daysAgo(5),
    });
    const request = makeRequest({
      id: "r1",
      status: "received",
      date_due: daysAgo(10),
      request_date: daysAgo(15),
      date_acknowledged: null,
    });
    const alerts = identifyRecordsAlerts([audit], [request], 3, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("poor_data_quality");
    expect(types).toContain("audit_overdue");
    expect(types).toContain("access_request_overdue");
    expect(types).toContain("access_request_not_acknowledged");
    expect(types).toContain("children_not_audited");
  });

  it("raises alerts for multiple audits independently", () => {
    const audits = [
      makeAudit({ id: "a1", child_id: "c1", data_quality_rating: "poor" }),
      makeAudit({ id: "a2", child_id: "c2", sensitive_data_secure: false }),
    ];
    const alerts = identifyRecordsAlerts(audits, [], 2, now);
    const poor = alerts.filter((a) => a.type === "poor_data_quality");
    const insecure = alerts.filter((a) => a.type === "sensitive_data_insecure");
    expect(poor).toHaveLength(1);
    expect(poor[0].id).toBe("a1");
    expect(insecure).toHaveLength(1);
    expect(insecure[0].id).toBe("a2");
  });

  it("each alert has required fields: type, severity, message, id", () => {
    const audit = makeAudit({
      data_quality_rating: "poor",
      chronology_up_to_date: false,
      sensitive_data_secure: false,
      next_audit_date: daysAgo(5),
    });
    const alerts = identifyRecordsAlerts([audit], [], 2, now);
    for (const a of alerts) {
      expect(a).toHaveProperty("type");
      expect(a).toHaveProperty("severity");
      expect(a).toHaveProperty("message");
      expect(a).toHaveProperty("id");
      expect(typeof a.type).toBe("string");
      expect(["critical", "high", "medium"]).toContain(a.severity);
      expect(a.message.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listAudits ────────────────────────────────────────────────────────

  it("listAudits returns ok: true with empty array", async () => {
    const result = await listAudits("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAudits returns ok: true with childId filter", async () => {
    const result = await listAudits("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAudits returns ok: true with qualityRating filter", async () => {
    const result = await listAudits("home-1", { qualityRating: "good" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAudits returns ok: true with limit filter", async () => {
    const result = await listAudits("home-1", { limit: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAudits result data is an array type", async () => {
    const result = await listAudits("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  // ── createAudit ───────────────────────────────────────────────────────

  it("createAudit returns ok: false with error message", async () => {
    const result = await createAudit({
      homeId: "home-1",
      auditDate: daysAgo(1),
      auditedBy: "staff-1",
      childId: "child-1",
      childName: "Alice Smith",
      recordsReviewed: 10,
      recordsComplete: 9,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createAudit returns error with full input", async () => {
    const result = await createAudit({
      homeId: "home-1",
      auditDate: daysAgo(1),
      auditedBy: "staff-1",
      childId: "child-1",
      childName: "Alice Smith",
      recordsReviewed: 10,
      recordsComplete: 8,
      recordsIncomplete: 2,
      missingRecords: ["care_plan"],
      dataQualityRating: "good",
      chronologyUpToDate: true,
      sensitiveDataSecure: true,
      thirdPartyDataRedacted: true,
      findings: "Some findings",
      actionsRequired: "Follow up needed",
      nextAuditDate: daysFromNow(90),
    });
    expect(result.ok).toBe(false);
  });

  it("createAudit error message is a string", async () => {
    const result = await createAudit({
      homeId: "home-1",
      auditDate: daysAgo(1),
      auditedBy: "staff-1",
      childId: "child-1",
      childName: "Test",
      recordsReviewed: 5,
      recordsComplete: 5,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── listAccessRequests ────────────────────────────────────────────────

  it("listAccessRequests returns ok: true with empty array", async () => {
    const result = await listAccessRequests("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAccessRequests returns ok: true with childId filter", async () => {
    const result = await listAccessRequests("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAccessRequests returns ok: true with status filter", async () => {
    const result = await listAccessRequests("home-1", { status: "received" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listAccessRequests result data is an array type", async () => {
    const result = await listAccessRequests("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  // ── createAccessRequest ───────────────────────────────────────────────

  it("createAccessRequest returns ok: false with error message", async () => {
    const result = await createAccessRequest({
      homeId: "home-1",
      requestDate: daysAgo(1),
      requesterName: "Jane Doe",
      requesterRelationship: "Parent",
      childId: "child-1",
      childName: "Alice Smith",
      requestType: "subject_access",
      recordsRequested: "All records",
      handledBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createAccessRequest returns error with full input", async () => {
    const result = await createAccessRequest({
      homeId: "home-1",
      requestDate: daysAgo(1),
      requesterName: "Jane Doe",
      requesterRelationship: "Parent",
      childId: "child-1",
      childName: "Alice Smith",
      requestType: "third_party",
      recordsRequested: "Health records only",
      dateDue: daysFromNow(30),
      redactionRequired: true,
      handledBy: "staff-1",
      notes: "Third party request",
    });
    expect(result.ok).toBe(false);
  });

  it("createAccessRequest error message is a string", async () => {
    const result = await createAccessRequest({
      homeId: "home-1",
      requestDate: daysAgo(1),
      requesterName: "Test",
      requesterRelationship: "Social Worker",
      childId: "child-1",
      childName: "Test",
      requestType: "social_worker",
      recordsRequested: "Case notes",
      handledBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateAccessRequest ───────────────────────────────────────────────

  it("updateAccessRequest returns ok: false with error message", async () => {
    const result = await updateAccessRequest("req-1", { status: "acknowledged" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateAccessRequest returns error for any update payload", async () => {
    const result = await updateAccessRequest("req-1", {
      status: "completed",
      date_completed: daysAgo(0),
      outcome: "Provided in full",
    });
    expect(result.ok).toBe(false);
  });

  it("updateAccessRequest error message is a string", async () => {
    const result = await updateAccessRequest("req-1", { status: "in_progress" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("computeRecordsMetrics with a single audit and no requests", () => {
    const audit = makeAudit({
      records_reviewed: 5,
      records_complete: 5,
      data_quality_rating: "excellent",
      chronology_up_to_date: true,
    });
    const m = computeRecordsMetrics([audit], [], 1);
    expect(m.children_audited).toBe(1);
    expect(m.avg_completeness_rate).toBe(100);
    expect(m.avg_data_quality).toBe(5);
    expect(m.total_access_requests).toBe(0);
    expect(m.chronology_compliance).toBe(100);
  });

  it("computeRecordsMetrics with no audits and several requests", () => {
    const requests = [
      makeRequest({ id: "r1", status: "completed", request_type: "subject_access" }),
      makeRequest({ id: "r2", status: "received", request_type: "ofsted" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(m.children_audited).toBe(0);
    expect(m.total_access_requests).toBe(2);
    expect(m.open_access_requests).toBe(1);
  });

  it("identifyRecordsAlerts returns empty array for empty inputs", () => {
    const alerts = identifyRecordsAlerts([], [], 0);
    expect(alerts).toHaveLength(0);
  });

  it("computeRecordsMetrics handles large number of audits", () => {
    const audits: RecordAudit[] = [];
    for (let i = 0; i < 100; i++) {
      audits.push(
        makeAudit({
          id: `a${i}`,
          child_id: `c${i}`,
          records_reviewed: 10,
          records_complete: 8,
          data_quality_rating: "good",
          chronology_up_to_date: true,
        }),
      );
    }
    const m = computeRecordsMetrics(audits, [], 100);
    expect(m.children_audited).toBe(100);
    expect(m.avg_completeness_rate).toBe(80);
    expect(m.chronology_compliance).toBe(100);
  });

  it("computeRecordsMetrics handles duplicate child audits correctly for quality count", () => {
    const audits = [
      makeAudit({ id: "a1", child_id: "c1", data_quality_rating: "poor" }),
      makeAudit({ id: "a2", child_id: "c1", data_quality_rating: "good" }),
    ];
    const m = computeRecordsMetrics(audits, [], 1);
    // children_audited deduplicates, but poor count is per audit row
    expect(m.children_audited).toBe(1);
    expect(m.children_with_poor_quality).toBe(1);
  });

  it("identifyRecordsAlerts with totalChildren equal to audited children does not raise children_not_audited", () => {
    const audits = [
      makeAudit({ id: "a1", child_id: "c1" }),
      makeAudit({ id: "a2", child_id: "c2" }),
      makeAudit({ id: "a3", child_id: "c2" }), // duplicate child
    ];
    const alerts = identifyRecordsAlerts(audits, [], 2);
    const alert = alerts.find((a) => a.type === "children_not_audited");
    expect(alert).toBeUndefined();
  });

  it("computeRecordsMetrics avg_response_days rounds to nearest integer", () => {
    const requests = [
      makeRequest({
        id: "r1",
        request_date: daysAgo(10),
        date_completed: daysAgo(0),
      }), // 10 days
      makeRequest({
        id: "r2",
        request_date: daysAgo(7),
        date_completed: daysAgo(0),
      }), // 7 days
    ];
    const m = computeRecordsMetrics([], requests, 0);
    // (10+7)/2 = 8.5 => rounded to 9
    expect(m.avg_response_days).toBe(9);
  });

  it("identifyRecordsAlerts does not produce duplicate alert types for separate issues", () => {
    const audit = makeAudit({
      id: "a1",
      data_quality_rating: "good",
      chronology_up_to_date: true,
      sensitive_data_secure: true,
      records_reviewed: 10,
      records_incomplete: 0,
      next_audit_date: daysFromNow(30),
    });
    const alerts = identifyRecordsAlerts([audit], [], 1);
    expect(alerts).toHaveLength(0);
  });

  it("computeRecordsMetrics handles all five request types in by_request_type", () => {
    const requests = [
      makeRequest({ id: "r1", request_type: "subject_access" }),
      makeRequest({ id: "r2", request_type: "third_party" }),
      makeRequest({ id: "r3", request_type: "court_order" }),
      makeRequest({ id: "r4", request_type: "ofsted" }),
      makeRequest({ id: "r5", request_type: "social_worker" }),
    ];
    const m = computeRecordsMetrics([], requests, 0);
    expect(Object.keys(m.by_request_type)).toHaveLength(5);
    expect(m.by_request_type["subject_access"]).toBe(1);
    expect(m.by_request_type["third_party"]).toBe(1);
    expect(m.by_request_type["court_order"]).toBe(1);
    expect(m.by_request_type["ofsted"]).toBe(1);
    expect(m.by_request_type["social_worker"]).toBe(1);
  });
});
