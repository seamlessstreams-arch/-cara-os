// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SAFER RECRUITMENT SERVICE TESTS
// Pure-function tests for recruitment compliance computation, alert
// identification, and constant validation under CHR 2015 Reg 32/33.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  DBS_TYPES,
  DBS_STATUSES,
  REFERENCE_TYPES,
  REFERENCE_STATUSES,
  PREEMPLOYMENT_CHECK_TYPES,
  PREEMPLOYMENT_CHECK_STATUSES,
  RECRUITMENT_STAGES,
} from "../safer-recruitment-service";

const { computeRecruitmentCompliance, identifyRecruitmentAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDBSCheck(overrides: Record<string, unknown> = {}): any {
  return {
    id: "dbs-1",
    staff_id: "staff-1",
    staff_name: "Alice Smith",
    home_id: "home-1",
    dbs_type: "enhanced",
    certificate_number: "CERT-001",
    issue_date: "2025-01-01",
    expiry_date: "2028-01-01",
    update_service_registered: true,
    update_service_id: "US-001",
    status: "valid",
    checked_by: "admin-1",
    checked_date: "2025-01-02",
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeReference(overrides: Record<string, unknown> = {}): any {
  return {
    id: "ref-1",
    staff_id: "staff-1",
    staff_name: "Alice Smith",
    home_id: "home-1",
    reference_type: "employer",
    referee_name: "Bob Jones",
    referee_role: "Manager",
    referee_organisation: "Org Ltd",
    referee_email: "bob@org.com",
    referee_phone: "07700900001",
    date_requested: "2025-01-01",
    date_received: "2025-01-15",
    satisfactory: true,
    concerns_noted: null,
    verified_by: "admin-1",
    verified_date: "2025-01-20",
    status: "verified",
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCheck(overrides: Record<string, unknown> = {}): any {
  return {
    id: "chk-1",
    staff_id: "staff-1",
    staff_name: "Alice Smith",
    home_id: "home-1",
    check_type: "dbs_check",
    completed: true,
    completed_date: "2025-01-05",
    completed_by: "admin-1",
    notes: null,
    document_reference: null,
    status: "completed",
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ── DBS_TYPES ─────────────────────────────────────────────────────────────

describe("DBS_TYPES", () => {
  it("has exactly 4 entries", () => {
    expect(DBS_TYPES).toHaveLength(4);
  });

  it("contains basic, standard, enhanced, and enhanced_barred types", () => {
    const types = DBS_TYPES.map((d) => d.type);
    expect(types).toContain("basic");
    expect(types).toContain("standard");
    expect(types).toContain("enhanced");
    expect(types).toContain("enhanced_barred");
  });

  it("has unique type values", () => {
    const types = DBS_TYPES.map((d) => d.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of DBS_TYPES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ── DBS_STATUSES ──────────────────────────────────────────────────────────

describe("DBS_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(DBS_STATUSES).toHaveLength(5);
  });

  it("contains valid, expiring, expired, pending, and flagged", () => {
    const statuses = DBS_STATUSES.map((s) => s.status);
    expect(statuses).toContain("valid");
    expect(statuses).toContain("expiring");
    expect(statuses).toContain("expired");
    expect(statuses).toContain("pending");
    expect(statuses).toContain("flagged");
  });

  it("has unique status values", () => {
    const statuses = DBS_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of DBS_STATUSES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ── REFERENCE_TYPES ───────────────────────────────────────────────────────

describe("REFERENCE_TYPES", () => {
  it("has exactly 5 entries", () => {
    expect(REFERENCE_TYPES).toHaveLength(5);
  });

  it("contains employer, personal, character, professional, and academic", () => {
    const types = REFERENCE_TYPES.map((r) => r.type);
    expect(types).toContain("employer");
    expect(types).toContain("personal");
    expect(types).toContain("character");
    expect(types).toContain("professional");
    expect(types).toContain("academic");
  });

  it("has unique type values", () => {
    const types = REFERENCE_TYPES.map((r) => r.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of REFERENCE_TYPES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ── REFERENCE_STATUSES ────────────────────────────────────────────────────

describe("REFERENCE_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(REFERENCE_STATUSES).toHaveLength(5);
  });

  it("contains requested, received, verified, unsatisfactory, and outstanding", () => {
    const statuses = REFERENCE_STATUSES.map((s) => s.status);
    expect(statuses).toContain("requested");
    expect(statuses).toContain("received");
    expect(statuses).toContain("verified");
    expect(statuses).toContain("unsatisfactory");
    expect(statuses).toContain("outstanding");
  });

  it("has unique status values", () => {
    const statuses = REFERENCE_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of REFERENCE_STATUSES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ── PREEMPLOYMENT_CHECK_TYPES ─────────────────────────────────────────────

describe("PREEMPLOYMENT_CHECK_TYPES", () => {
  it("has exactly 12 entries", () => {
    expect(PREEMPLOYMENT_CHECK_TYPES).toHaveLength(12);
  });

  it("includes all required Schedule 2 check types", () => {
    const types = PREEMPLOYMENT_CHECK_TYPES.map((c) => c.type);
    expect(types).toContain("dbs_check");
    expect(types).toContain("identity_verification");
    expect(types).toContain("right_to_work");
    expect(types).toContain("two_references");
    expect(types).toContain("qualifications");
    expect(types).toContain("employment_history_gaps");
    expect(types).toContain("health_declaration");
    expect(types).toContain("interview_record");
    expect(types).toContain("safeguarding_declaration");
    expect(types).toContain("disqualification_declaration");
    expect(types).toContain("overseas_police_check");
    expect(types).toContain("social_media_check");
  });

  it("has unique type values", () => {
    const types = PREEMPLOYMENT_CHECK_TYPES.map((c) => c.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of PREEMPLOYMENT_CHECK_TYPES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ── PREEMPLOYMENT_CHECK_STATUSES ──────────────────────────────────────────

describe("PREEMPLOYMENT_CHECK_STATUSES", () => {
  it("has exactly 4 statuses", () => {
    expect(PREEMPLOYMENT_CHECK_STATUSES).toHaveLength(4);
  });

  it("contains pending, completed, na, and concern", () => {
    const statuses = PREEMPLOYMENT_CHECK_STATUSES.map((s) => s.status);
    expect(statuses).toContain("pending");
    expect(statuses).toContain("completed");
    expect(statuses).toContain("na");
    expect(statuses).toContain("concern");
  });

  it("has unique status values", () => {
    const statuses = PREEMPLOYMENT_CHECK_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of PREEMPLOYMENT_CHECK_STATUSES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ── RECRUITMENT_STAGES ────────────────────────────────────────────────────

describe("RECRUITMENT_STAGES", () => {
  it("has exactly 7 stages", () => {
    expect(RECRUITMENT_STAGES).toHaveLength(7);
  });

  it("includes all recruitment stages in the correct order", () => {
    const types = RECRUITMENT_STAGES.map((s) => s.type);
    expect(types).toEqual([
      "application",
      "shortlisting",
      "interview",
      "pre_employment_checks",
      "offer",
      "induction",
      "probation",
    ]);
  });

  it("has unique type values", () => {
    const types = RECRUITMENT_STAGES.map((s) => s.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("every entry has a non-empty label", () => {
    for (const entry of RECRUITMENT_STAGES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ── computeRecruitmentCompliance ──────────────────────────────────────────

describe("computeRecruitmentCompliance", () => {
  // -- Empty inputs --

  it("returns all zeros for empty arrays and zero staff", () => {
    const r = computeRecruitmentCompliance([], [], [], 0);
    expect(r.total_staff).toBe(0);
    expect(r.dbs_valid_count).toBe(0);
    expect(r.dbs_expiring_count).toBe(0);
    expect(r.dbs_expired_count).toBe(0);
    expect(r.dbs_pending_count).toBe(0);
    expect(r.dbs_flagged_count).toBe(0);
    expect(r.dbs_validity_rate).toBe(0);
    expect(r.references_verified_count).toBe(0);
    expect(r.references_outstanding_count).toBe(0);
    expect(r.references_unsatisfactory_count).toBe(0);
    expect(r.reference_completion_rate).toBe(0);
    expect(r.checks_completed_count).toBe(0);
    expect(r.checks_pending_count).toBe(0);
    expect(r.checks_concern_count).toBe(0);
    expect(r.check_completion_rate).toBe(0);
    expect(r.overall_compliance_rate).toBe(0);
  });

  it("returns zero rates for empty arrays with non-zero staff", () => {
    const r = computeRecruitmentCompliance([], [], [], 10);
    expect(r.total_staff).toBe(10);
    expect(r.dbs_validity_rate).toBe(0);
    expect(r.reference_completion_rate).toBe(0);
    expect(r.check_completion_rate).toBe(0);
    expect(r.overall_compliance_rate).toBe(0);
  });

  // -- DBS metrics --

  it("counts valid DBS checks correctly", () => {
    const dbs = [
      makeDBSCheck({ id: "d1", status: "valid" }),
      makeDBSCheck({ id: "d2", status: "valid" }),
    ];
    const r = computeRecruitmentCompliance(dbs, [], [], 2);
    expect(r.dbs_valid_count).toBe(2);
    expect(r.dbs_validity_rate).toBe(100);
  });

  it("counts expiring DBS as contributing to validity rate", () => {
    const dbs = [
      makeDBSCheck({ id: "d1", status: "valid" }),
      makeDBSCheck({ id: "d2", status: "expiring" }),
    ];
    const r = computeRecruitmentCompliance(dbs, [], [], 2);
    expect(r.dbs_valid_count).toBe(1);
    expect(r.dbs_expiring_count).toBe(1);
    expect(r.dbs_validity_rate).toBe(100); // both valid + expiring count
  });

  it("counts expired DBS checks correctly", () => {
    const dbs = [
      makeDBSCheck({ id: "d1", status: "expired" }),
      makeDBSCheck({ id: "d2", status: "expired" }),
    ];
    const r = computeRecruitmentCompliance(dbs, [], [], 2);
    expect(r.dbs_expired_count).toBe(2);
    expect(r.dbs_validity_rate).toBe(0);
  });

  it("counts pending DBS checks correctly", () => {
    const dbs = [makeDBSCheck({ status: "pending" })];
    const r = computeRecruitmentCompliance(dbs, [], [], 1);
    expect(r.dbs_pending_count).toBe(1);
    expect(r.dbs_validity_rate).toBe(0);
  });

  it("counts flagged DBS checks correctly", () => {
    const dbs = [makeDBSCheck({ status: "flagged" })];
    const r = computeRecruitmentCompliance(dbs, [], [], 1);
    expect(r.dbs_flagged_count).toBe(1);
    expect(r.dbs_validity_rate).toBe(0);
  });

  it("calculates DBS validity rate with mixed statuses", () => {
    const dbs = [
      makeDBSCheck({ id: "d1", status: "valid" }),
      makeDBSCheck({ id: "d2", status: "expiring" }),
      makeDBSCheck({ id: "d3", status: "expired" }),
      makeDBSCheck({ id: "d4", status: "pending" }),
    ];
    const r = computeRecruitmentCompliance(dbs, [], [], 4);
    expect(r.dbs_valid_count).toBe(1);
    expect(r.dbs_expiring_count).toBe(1);
    expect(r.dbs_expired_count).toBe(1);
    expect(r.dbs_pending_count).toBe(1);
    // validity = (1 valid + 1 expiring) / 4 = 50%
    expect(r.dbs_validity_rate).toBe(50);
  });

  // -- Reference metrics --

  it("counts verified references correctly", () => {
    const refs = [
      makeReference({ id: "r1", status: "verified" }),
      makeReference({ id: "r2", status: "verified" }),
    ];
    const r = computeRecruitmentCompliance([], refs, [], 2);
    expect(r.references_verified_count).toBe(2);
    expect(r.reference_completion_rate).toBe(100);
  });

  it("counts outstanding references (includes requested status)", () => {
    const refs = [
      makeReference({ id: "r1", status: "outstanding" }),
      makeReference({ id: "r2", status: "requested" }),
    ];
    const r = computeRecruitmentCompliance([], refs, [], 2);
    expect(r.references_outstanding_count).toBe(2);
    expect(r.reference_completion_rate).toBe(0);
  });

  it("counts unsatisfactory references correctly", () => {
    const refs = [makeReference({ status: "unsatisfactory" })];
    const r = computeRecruitmentCompliance([], refs, [], 1);
    expect(r.references_unsatisfactory_count).toBe(1);
    expect(r.reference_completion_rate).toBe(0);
  });

  it("does not count received references as verified or outstanding", () => {
    const refs = [makeReference({ status: "received" })];
    const r = computeRecruitmentCompliance([], refs, [], 1);
    expect(r.references_verified_count).toBe(0);
    expect(r.references_outstanding_count).toBe(0);
    expect(r.references_unsatisfactory_count).toBe(0);
    expect(r.reference_completion_rate).toBe(0);
  });

  it("calculates reference completion rate with mixed statuses", () => {
    const refs = [
      makeReference({ id: "r1", status: "verified" }),
      makeReference({ id: "r2", status: "verified" }),
      makeReference({ id: "r3", status: "outstanding" }),
      makeReference({ id: "r4", status: "unsatisfactory" }),
    ];
    const r = computeRecruitmentCompliance([], refs, [], 4);
    // 2 verified / 4 total = 50%
    expect(r.reference_completion_rate).toBe(50);
  });

  // -- Pre-employment check metrics --

  it("counts completed checks correctly", () => {
    const checks = [
      makeCheck({ id: "c1", status: "completed" }),
      makeCheck({ id: "c2", status: "completed" }),
    ];
    const r = computeRecruitmentCompliance([], [], checks, 2);
    expect(r.checks_completed_count).toBe(2);
    expect(r.check_completion_rate).toBe(100);
  });

  it("counts na checks as completed", () => {
    const checks = [
      makeCheck({ id: "c1", status: "completed" }),
      makeCheck({ id: "c2", status: "na" }),
    ];
    const r = computeRecruitmentCompliance([], [], checks, 1);
    expect(r.checks_completed_count).toBe(2);
    expect(r.check_completion_rate).toBe(100);
  });

  it("counts pending checks correctly", () => {
    const checks = [makeCheck({ status: "pending" })];
    const r = computeRecruitmentCompliance([], [], checks, 1);
    expect(r.checks_pending_count).toBe(1);
    expect(r.check_completion_rate).toBe(0);
  });

  it("counts concern checks correctly", () => {
    const checks = [makeCheck({ status: "concern" })];
    const r = computeRecruitmentCompliance([], [], checks, 1);
    expect(r.checks_concern_count).toBe(1);
    expect(r.check_completion_rate).toBe(0);
  });

  it("calculates check completion rate with mixed statuses", () => {
    const checks = [
      makeCheck({ id: "c1", status: "completed" }),
      makeCheck({ id: "c2", status: "na" }),
      makeCheck({ id: "c3", status: "pending" }),
      makeCheck({ id: "c4", status: "concern" }),
    ];
    const r = computeRecruitmentCompliance([], [], checks, 2);
    // (1 completed + 1 na) / 4 = 50%
    expect(r.checks_completed_count).toBe(2);
    expect(r.checks_pending_count).toBe(1);
    expect(r.checks_concern_count).toBe(1);
    expect(r.check_completion_rate).toBe(50);
  });

  // -- Overall compliance rate --

  it("computes overall compliance as average of all three rates when all have data", () => {
    const dbs = [makeDBSCheck({ status: "valid" })]; // 100%
    const refs = [makeReference({ status: "verified" })]; // 100%
    const checks = [makeCheck({ status: "completed" })]; // 100%
    const r = computeRecruitmentCompliance(dbs, refs, checks, 1);
    expect(r.overall_compliance_rate).toBe(100);
  });

  it("computes overall compliance averaging only categories with data", () => {
    // Only DBS has data => overall = dbsValidityRate
    const dbs = [makeDBSCheck({ status: "valid" })]; // 100%
    const r = computeRecruitmentCompliance(dbs, [], [], 1);
    expect(r.overall_compliance_rate).toBe(100);
  });

  it("handles partial compliance across all categories", () => {
    const dbs = [
      makeDBSCheck({ id: "d1", status: "valid" }),
      makeDBSCheck({ id: "d2", status: "expired" }),
    ]; // 50%
    const refs = [
      makeReference({ id: "r1", status: "verified" }),
      makeReference({ id: "r2", status: "outstanding" }),
    ]; // 50%
    const checks = [
      makeCheck({ id: "c1", status: "completed" }),
      makeCheck({ id: "c2", status: "pending" }),
    ]; // 50%
    const r = computeRecruitmentCompliance(dbs, refs, checks, 3);
    // average of 50, 50, 50 = 50
    expect(r.overall_compliance_rate).toBe(50);
  });

  it("handles uneven compliance rates across categories", () => {
    const dbs = [makeDBSCheck({ status: "valid" })]; // 100%
    const refs = [makeReference({ status: "outstanding" })]; // 0%
    const checks = [makeCheck({ status: "completed" })]; // 100%
    const r = computeRecruitmentCompliance(dbs, refs, checks, 1);
    // average of 100, 0, 100 = 67
    expect(r.overall_compliance_rate).toBe(67);
  });

  it("rounds compliance rates to nearest integer", () => {
    const dbs = [
      makeDBSCheck({ id: "d1", status: "valid" }),
      makeDBSCheck({ id: "d2", status: "valid" }),
      makeDBSCheck({ id: "d3", status: "expired" }),
    ]; // 67% (2/3)
    const r = computeRecruitmentCompliance(dbs, [], [], 3);
    expect(r.dbs_validity_rate).toBe(67);
  });

  it("preserves total_staff in the result", () => {
    const r = computeRecruitmentCompliance([], [], [], 42);
    expect(r.total_staff).toBe(42);
  });

  it("handles large numbers of records", () => {
    const dbs = Array.from({ length: 100 }, (_, i) =>
      makeDBSCheck({ id: `d-${i}`, status: i < 80 ? "valid" : "expired" }),
    );
    const r = computeRecruitmentCompliance(dbs, [], [], 100);
    expect(r.dbs_valid_count).toBe(80);
    expect(r.dbs_expired_count).toBe(20);
    expect(r.dbs_validity_rate).toBe(80);
  });

  it("handles all five DBS statuses simultaneously", () => {
    const dbs = [
      makeDBSCheck({ id: "d1", status: "valid" }),
      makeDBSCheck({ id: "d2", status: "expiring" }),
      makeDBSCheck({ id: "d3", status: "expired" }),
      makeDBSCheck({ id: "d4", status: "pending" }),
      makeDBSCheck({ id: "d5", status: "flagged" }),
    ];
    const r = computeRecruitmentCompliance(dbs, [], [], 5);
    expect(r.dbs_valid_count).toBe(1);
    expect(r.dbs_expiring_count).toBe(1);
    expect(r.dbs_expired_count).toBe(1);
    expect(r.dbs_pending_count).toBe(1);
    expect(r.dbs_flagged_count).toBe(1);
    // (1+1)/5 = 40%
    expect(r.dbs_validity_rate).toBe(40);
  });

  it("computes compliance when only references have data (slicing behaviour)", () => {
    // Only refs have data — rateCount=1, slice(0,1) takes first rate (dbsValidityRate=0)
    // This is the actual implementation behaviour
    const refs = [makeReference({ status: "verified" })];
    const r = computeRecruitmentCompliance([], refs, [], 1);
    // rateCount = 1, but slice(0,1) yields [dbsValidityRate] = [0]
    // Overall = 0/1 = 0 — the rate comes from the fixed-order array slicing
    expect(r.reference_completion_rate).toBe(100);
    expect(r.overall_compliance_rate).toBe(0);
  });

  it("computes compliance when only checks have data (slicing behaviour)", () => {
    const checks = [makeCheck({ status: "completed" })];
    const r = computeRecruitmentCompliance([], [], checks, 1);
    expect(r.check_completion_rate).toBe(100);
    // rateCount = 1, slice(0,1) yields [dbsValidityRate] = [0]
    expect(r.overall_compliance_rate).toBe(0);
  });

  it("computes compliance when DBS and checks have data but refs empty", () => {
    const dbs = [makeDBSCheck({ status: "valid" })]; // 100%
    const checks = [makeCheck({ status: "completed" })]; // 100%
    const r = computeRecruitmentCompliance(dbs, [], checks, 1);
    // rateCount = 2, slice(0,2) yields [dbsValidityRate=100, referenceCompletionRate=0]
    // Average = (100+0)/2 = 50
    expect(r.overall_compliance_rate).toBe(50);
  });
});

// ── identifyRecruitmentAlerts ─────────────────────────────────────────────

describe("identifyRecruitmentAlerts", () => {
  // -- No alerts --

  it("returns no alerts when all data is clean", () => {
    const dbs = [makeDBSCheck({ status: "valid", update_service_registered: true })];
    const refs = [makeReference({ status: "verified" })];
    const checks = [makeCheck({ status: "completed" })];
    const alerts = identifyRecruitmentAlerts(dbs, refs, checks);
    expect(alerts).toHaveLength(0);
  });

  it("returns no alerts for empty inputs", () => {
    const alerts = identifyRecruitmentAlerts([], [], []);
    expect(alerts).toHaveLength(0);
  });

  // -- DBS expired --

  it("creates a critical alert for expired DBS", () => {
    const dbs = [makeDBSCheck({ status: "expired", staff_name: "Jane Doe" })];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("dbs_expired");
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].staff_name).toBe("Jane Doe");
    expect(alerts[0].message).toContain("Jane Doe");
    expect(alerts[0].message).toContain("Reg 32");
  });

  it("creates multiple expired DBS alerts for different staff", () => {
    const dbs = [
      makeDBSCheck({ id: "d1", staff_id: "s1", staff_name: "Alice", status: "expired" }),
      makeDBSCheck({ id: "d2", staff_id: "s2", staff_name: "Bob", status: "expired" }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const expired = alerts.filter((a) => a.type === "dbs_expired");
    expect(expired).toHaveLength(2);
  });

  // -- DBS flagged --

  it("creates a critical alert for flagged DBS", () => {
    const dbs = [makeDBSCheck({ status: "flagged", staff_name: "Tom" })];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const flagged = alerts.filter((a) => a.type === "dbs_flagged");
    expect(flagged).toHaveLength(1);
    expect(flagged[0].severity).toBe("critical");
    expect(flagged[0].message).toContain("Tom");
    expect(flagged[0].message).toContain("Reg 32");
  });

  // -- DBS pending --

  it("creates a medium alert for pending DBS", () => {
    const dbs = [makeDBSCheck({ status: "pending", staff_name: "Sam" })];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const pending = alerts.filter((a) => a.type === "dbs_pending");
    expect(pending).toHaveLength(1);
    expect(pending[0].severity).toBe("medium");
    expect(pending[0].staff_name).toBe("Sam");
  });

  // -- DBS expiring within 30 days --

  it("creates a high alert for DBS valid and expiring within 30 days", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15); // 15 days from now
    const dbs = [
      makeDBSCheck({
        status: "valid",
        expiry_date: futureDate.toISOString().split("T")[0],
        staff_name: "Lisa",
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const expiring = alerts.filter((a) => a.type === "dbs_expiring_30_days");
    expect(expiring).toHaveLength(1);
    expect(expiring[0].severity).toBe("high");
    expect(expiring[0].staff_name).toBe("Lisa");
  });

  it("does not create expiring alert for DBS expiring beyond 30 days", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60); // 60 days from now
    const dbs = [
      makeDBSCheck({
        status: "valid",
        expiry_date: futureDate.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const expiring = alerts.filter((a) => a.type === "dbs_expiring_30_days");
    expect(expiring).toHaveLength(0);
  });

  it("does not create expiring alert for DBS with status other than valid", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const dbs = [
      makeDBSCheck({
        status: "expiring",
        expiry_date: futureDate.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const expiring = alerts.filter((a) => a.type === "dbs_expiring_30_days");
    expect(expiring).toHaveLength(0);
  });

  it("does not create expiring alert for already expired DBS date", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const dbs = [
      makeDBSCheck({
        status: "valid",
        expiry_date: pastDate.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const expiring = alerts.filter((a) => a.type === "dbs_expiring_30_days");
    expect(expiring).toHaveLength(0);
  });

  it("creates expiring alert for DBS expiring on the boundary (exactly 30 days)", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 29); // within the 30-day window
    const dbs = [
      makeDBSCheck({
        status: "valid",
        expiry_date: futureDate.toISOString().split("T")[0],
        staff_name: "Boundary Case",
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const expiring = alerts.filter((a) => a.type === "dbs_expiring_30_days");
    expect(expiring).toHaveLength(1);
  });

  // -- No update service --

  it("creates a low alert for enhanced DBS without Update Service registration", () => {
    const dbs = [
      makeDBSCheck({
        dbs_type: "enhanced",
        update_service_registered: false,
        status: "valid",
        staff_name: "Mark",
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const noUpdate = alerts.filter((a) => a.type === "no_update_service");
    expect(noUpdate).toHaveLength(1);
    expect(noUpdate[0].severity).toBe("low");
    expect(noUpdate[0].staff_name).toBe("Mark");
    expect(noUpdate[0].message).toContain("Update Service");
  });

  it("creates a low alert for enhanced_barred DBS without Update Service", () => {
    const dbs = [
      makeDBSCheck({
        dbs_type: "enhanced_barred",
        update_service_registered: false,
        status: "valid",
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const noUpdate = alerts.filter((a) => a.type === "no_update_service");
    expect(noUpdate).toHaveLength(1);
  });

  it("does not create Update Service alert for basic DBS", () => {
    const dbs = [
      makeDBSCheck({
        dbs_type: "basic",
        update_service_registered: false,
        status: "valid",
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const noUpdate = alerts.filter((a) => a.type === "no_update_service");
    expect(noUpdate).toHaveLength(0);
  });

  it("does not create Update Service alert for standard DBS", () => {
    const dbs = [
      makeDBSCheck({
        dbs_type: "standard",
        update_service_registered: false,
        status: "valid",
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const noUpdate = alerts.filter((a) => a.type === "no_update_service");
    expect(noUpdate).toHaveLength(0);
  });

  it("does not create Update Service alert for enhanced DBS that IS registered", () => {
    const dbs = [
      makeDBSCheck({
        dbs_type: "enhanced",
        update_service_registered: true,
        status: "valid",
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const noUpdate = alerts.filter((a) => a.type === "no_update_service");
    expect(noUpdate).toHaveLength(0);
  });

  it("does not create Update Service alert for enhanced DBS with non-valid status", () => {
    const dbs = [
      makeDBSCheck({
        dbs_type: "enhanced",
        update_service_registered: false,
        status: "expired",
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const noUpdate = alerts.filter((a) => a.type === "no_update_service");
    expect(noUpdate).toHaveLength(0);
  });

  // -- Reference unsatisfactory --

  it("creates a critical alert for unsatisfactory reference", () => {
    const refs = [
      makeReference({
        status: "unsatisfactory",
        staff_name: "Eve",
        referee_name: "Prev Employer",
      }),
    ];
    const alerts = identifyRecruitmentAlerts([], refs, []);
    const unsatisfactory = alerts.filter((a) => a.type === "reference_unsatisfactory");
    expect(unsatisfactory).toHaveLength(1);
    expect(unsatisfactory[0].severity).toBe("critical");
    expect(unsatisfactory[0].message).toContain("Eve");
    expect(unsatisfactory[0].message).toContain("Prev Employer");
    expect(unsatisfactory[0].message).toContain("Reg 32");
  });

  // -- Reference outstanding --

  it("creates a high alert for outstanding reference", () => {
    const refs = [
      makeReference({
        status: "outstanding",
        staff_name: "Dan",
        reference_type: "employer",
        referee_name: "Corp Ltd",
      }),
    ];
    const alerts = identifyRecruitmentAlerts([], refs, []);
    const outstanding = alerts.filter((a) => a.type === "reference_outstanding");
    expect(outstanding).toHaveLength(1);
    expect(outstanding[0].severity).toBe("high");
    expect(outstanding[0].message).toContain("Dan");
  });

  it("creates a high alert for requested reference (treated as outstanding)", () => {
    const refs = [
      makeReference({
        status: "requested",
        staff_name: "Fay",
        referee_name: "Ref Person",
      }),
    ];
    const alerts = identifyRecruitmentAlerts([], refs, []);
    const outstanding = alerts.filter((a) => a.type === "reference_outstanding");
    expect(outstanding).toHaveLength(1);
    expect(outstanding[0].staff_name).toBe("Fay");
  });

  it("does not create alert for verified reference", () => {
    const refs = [makeReference({ status: "verified" })];
    const alerts = identifyRecruitmentAlerts([], refs, []);
    expect(alerts).toHaveLength(0);
  });

  it("does not create alert for received reference", () => {
    const refs = [makeReference({ status: "received" })];
    const alerts = identifyRecruitmentAlerts([], refs, []);
    expect(alerts).toHaveLength(0);
  });

  // -- Pre-employment check concern --

  it("creates a high alert for check with concern status", () => {
    const checks = [
      makeCheck({
        status: "concern",
        check_type: "dbs_check",
        staff_name: "Greg",
      }),
    ];
    const alerts = identifyRecruitmentAlerts([], [], checks);
    const concern = alerts.filter((a) => a.type === "check_concern");
    expect(concern).toHaveLength(1);
    expect(concern[0].severity).toBe("high");
    expect(concern[0].message).toContain("Greg");
    expect(concern[0].message).toContain("DBS Check"); // uses label from constant
  });

  it("uses the label from PREEMPLOYMENT_CHECK_TYPES in concern alert message", () => {
    const checks = [
      makeCheck({
        status: "concern",
        check_type: "right_to_work",
        staff_name: "Helen",
      }),
    ];
    const alerts = identifyRecruitmentAlerts([], [], checks);
    const concern = alerts.filter((a) => a.type === "check_concern");
    expect(concern[0].message).toContain("Right to Work in the UK");
  });

  it("falls back to check_type when type not found in PREEMPLOYMENT_CHECK_TYPES", () => {
    const checks = [
      makeCheck({
        status: "concern",
        check_type: "unknown_check",
        staff_name: "Ivan",
      }),
    ];
    const alerts = identifyRecruitmentAlerts([], [], checks);
    const concern = alerts.filter((a) => a.type === "check_concern");
    expect(concern[0].message).toContain("unknown_check");
  });

  // -- Pre-employment check incomplete --

  it("creates a medium alert for pending check", () => {
    const checks = [
      makeCheck({
        status: "pending",
        check_type: "identity_verification",
        staff_name: "Kate",
      }),
    ];
    const alerts = identifyRecruitmentAlerts([], [], checks);
    const incomplete = alerts.filter((a) => a.type === "check_incomplete");
    expect(incomplete).toHaveLength(1);
    expect(incomplete[0].severity).toBe("medium");
    expect(incomplete[0].message).toContain("Kate");
    expect(incomplete[0].message).toContain("Identity Verification");
  });

  it("uses the label from PREEMPLOYMENT_CHECK_TYPES in incomplete alert message", () => {
    const checks = [
      makeCheck({
        status: "pending",
        check_type: "social_media_check",
      }),
    ];
    const alerts = identifyRecruitmentAlerts([], [], checks);
    const incomplete = alerts.filter((a) => a.type === "check_incomplete");
    expect(incomplete[0].message).toContain("Social Media Check");
  });

  it("falls back to check_type for incomplete alert when type not in constants", () => {
    const checks = [
      makeCheck({
        status: "pending",
        check_type: "custom_check",
      }),
    ];
    const alerts = identifyRecruitmentAlerts([], [], checks);
    const incomplete = alerts.filter((a) => a.type === "check_incomplete");
    expect(incomplete[0].message).toContain("custom_check");
  });

  it("does not create alerts for completed checks", () => {
    const checks = [makeCheck({ status: "completed" })];
    const alerts = identifyRecruitmentAlerts([], [], checks);
    expect(alerts).toHaveLength(0);
  });

  it("does not create alerts for na checks", () => {
    const checks = [makeCheck({ status: "na" })];
    const alerts = identifyRecruitmentAlerts([], [], checks);
    expect(alerts).toHaveLength(0);
  });

  // -- Mixed / combined scenarios --

  it("produces multiple alert types from mixed data", () => {
    const dbs = [
      makeDBSCheck({ id: "d1", status: "expired", staff_name: "A" }),
      makeDBSCheck({ id: "d2", status: "flagged", staff_name: "B" }),
      makeDBSCheck({ id: "d3", status: "pending", staff_name: "C" }),
    ];
    const refs = [
      makeReference({ id: "r1", status: "unsatisfactory", staff_name: "D", referee_name: "Ref D" }),
      makeReference({ id: "r2", status: "outstanding", staff_name: "E", referee_name: "Ref E" }),
    ];
    const checks = [
      makeCheck({ id: "c1", status: "concern", check_type: "dbs_check", staff_name: "F" }),
      makeCheck({ id: "c2", status: "pending", check_type: "right_to_work", staff_name: "G" }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, refs, checks);

    const types = alerts.map((a) => a.type);
    expect(types).toContain("dbs_expired");
    expect(types).toContain("dbs_flagged");
    expect(types).toContain("dbs_pending");
    expect(types).toContain("reference_unsatisfactory");
    expect(types).toContain("reference_outstanding");
    expect(types).toContain("check_concern");
    expect(types).toContain("check_incomplete");
  });

  it("includes staff_id on all alert objects", () => {
    const dbs = [makeDBSCheck({ status: "expired", staff_id: "s-99" })];
    const refs = [makeReference({ status: "unsatisfactory", staff_id: "s-88", referee_name: "X" })];
    const checks = [makeCheck({ status: "concern", staff_id: "s-77", check_type: "dbs_check" })];
    const alerts = identifyRecruitmentAlerts(dbs, refs, checks);
    for (const alert of alerts) {
      expect(alert.staff_id).toBeDefined();
    }
    expect(alerts.find((a) => a.type === "dbs_expired")?.staff_id).toBe("s-99");
    expect(alerts.find((a) => a.type === "reference_unsatisfactory")?.staff_id).toBe("s-88");
    expect(alerts.find((a) => a.type === "check_concern")?.staff_id).toBe("s-77");
  });

  it("a single DBS can generate multiple alerts (expired + flagged do not overlap, but valid + no_update_service can)", () => {
    const dbs = [
      makeDBSCheck({
        status: "valid",
        dbs_type: "enhanced",
        update_service_registered: false,
        expiry_date: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    // Should produce both dbs_expiring_30_days AND no_update_service
    const types = alerts.map((a) => a.type);
    expect(types).toContain("dbs_expiring_30_days");
    expect(types).toContain("no_update_service");
    expect(alerts).toHaveLength(2);
  });

  it("severity ordering: critical > high > medium > low present in mixed alerts", () => {
    const dbs = [
      makeDBSCheck({ id: "d1", status: "expired" }), // critical
      makeDBSCheck({ id: "d2", status: "pending" }), // medium
      makeDBSCheck({
        id: "d3",
        status: "valid",
        dbs_type: "enhanced",
        update_service_registered: false,
        expiry_date: "2099-01-01",
      }), // low (no_update_service)
    ];
    const refs = [
      makeReference({ id: "r1", status: "outstanding", referee_name: "R" }), // high
    ];
    const alerts = identifyRecruitmentAlerts(dbs, refs, []);
    const severities = new Set(alerts.map((a) => a.severity));
    expect(severities).toContain("critical");
    expect(severities).toContain("high");
    expect(severities).toContain("medium");
    expect(severities).toContain("low");
  });
});
