// ══════════════════════════════════════════════════════════════════════════════
// CARA — TRAINING & DEVELOPMENT SERVICE TESTS
// Pure-function unit tests for training compliance computation, staff training
// profiles, DBS compliance, alert identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../training-service";

import type {
  TrainingRecord,
  StaffDBS,
  StaffQualification,
} from "../training-service";

const {
  computeTrainingCompliance,
  computeStaffTrainingProfile,
  computeDBSCompliance,
  identifyTrainingAlerts,
  MANDATORY_TRAINING,
  DBS_STATUS,
  QUALIFICATION_TYPES,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** All mandatory training types (level === "mandatory"). */
const MANDATORY_TYPES: string[] = MANDATORY_TRAINING
  .filter((t) => t.level === "mandatory")
  .map((t) => t.type);

/** Build a minimal TrainingRecord with sensible defaults. */
function makeTrainingRecord(
  overrides: Partial<TrainingRecord> = {},
): TrainingRecord {
  return {
    id: "id" in overrides ? overrides.id! : "tr-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    staff_id: "staff_id" in overrides ? overrides.staff_id! : "staff-1",
    staff_name: "staff_name" in overrides ? overrides.staff_name! : "Jane Doe",
    training_type: "training_type" in overrides ? overrides.training_type! : "safeguarding",
    completed_date: "completed_date" in overrides ? overrides.completed_date! : "2026-01-01",
    expiry_date: "expiry_date" in overrides ? overrides.expiry_date! : "2030-01-01",
    provider: "provider" in overrides ? overrides.provider! : "Training Co",
    certificate_reference: "certificate_reference" in overrides ? overrides.certificate_reference! : undefined,
    status: "status" in overrides ? overrides.status! : "current",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
  };
}

/** Build a minimal StaffDBS with sensible defaults. */
function makeStaffDBS(
  overrides: Partial<StaffDBS> = {},
): StaffDBS {
  return {
    id: "id" in overrides ? overrides.id! : "dbs-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    staff_id: "staff_id" in overrides ? overrides.staff_id! : "staff-1",
    staff_name: "staff_name" in overrides ? overrides.staff_name! : "Jane Doe",
    dbs_number: "dbs_number" in overrides ? overrides.dbs_number! : "DBS-001",
    issue_date: "issue_date" in overrides ? overrides.issue_date! : "2025-01-01",
    dbs_type: "dbs_type" in overrides ? overrides.dbs_type! : "enhanced",
    status: "status" in overrides ? overrides.status! : "cleared",
    renewal_due: "renewal_due" in overrides ? overrides.renewal_due! : "2030-01-01",
    update_service_registered: "update_service_registered" in overrides ? overrides.update_service_registered! : false,
    created_at: "created_at" in overrides ? overrides.created_at! : "2025-01-01T00:00:00Z",
  };
}

/** Build a minimal StaffQualification with sensible defaults. */
function makeStaffQualification(
  overrides: Partial<StaffQualification> = {},
): StaffQualification {
  return {
    id: "id" in overrides ? overrides.id! : "qual-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    staff_id: "staff_id" in overrides ? overrides.staff_id! : "staff-1",
    staff_name: "staff_name" in overrides ? overrides.staff_name! : "Jane Doe",
    qualification_type: "qualification_type" in overrides ? overrides.qualification_type! : "level_3_diploma",
    title: "title" in overrides ? overrides.title! : "Level 3 Diploma",
    awarding_body: "awarding_body" in overrides ? overrides.awarding_body! : "NCFE",
    date_achieved: "date_achieved" in overrides ? overrides.date_achieved! : undefined,
    expected_completion: "expected_completion" in overrides ? overrides.expected_completion! : undefined,
    status: "status" in overrides ? overrides.status! : "achieved",
    created_at: "created_at" in overrides ? overrides.created_at! : "2025-01-01T00:00:00Z",
  };
}

/** Create current training records for all mandatory types for a given staff member. */
function makeFullyCompliantRecords(staffId: string): TrainingRecord[] {
  return MANDATORY_TYPES.map((type, i) =>
    makeTrainingRecord({
      id: `tr-${staffId}-${i}`,
      staff_id: staffId,
      training_type: type,
      status: "current",
      expiry_date: "2030-01-01",
    }),
  );
}

// ── computeTrainingCompliance ───────────────────────────────────────────────

describe("computeTrainingCompliance", () => {
  it("returns zero compliance for empty records with zero staff", () => {
    const result = computeTrainingCompliance([], 0);
    expect(result.overall_compliance_rate).toBeNull();;
    expect(result.fully_compliant_staff).toBe(0);
    expect(result.expired_count).toBe(0);
    expect(result.expiring_within_30_days).toEqual([]);
  });

  it("returns zero compliance for empty records with non-zero staff", () => {
    const result = computeTrainingCompliance([], 5);
    expect(result.overall_compliance_rate).toBe(0);
    expect(result.fully_compliant_staff).toBe(0);
    // All mandatory types should have not_done = staffCount
    for (const mt of MANDATORY_TYPES) {
      expect(result.by_training_type[mt].not_done).toBe(5);
      expect(result.by_training_type[mt].current).toBe(0);
    }
  });

  it("initialises by_training_type with all mandatory types", () => {
    const result = computeTrainingCompliance([], 1);
    for (const mt of MANDATORY_TYPES) {
      expect(result.by_training_type[mt]).toBeDefined();
      expect(result.by_training_type[mt]).toEqual({
        current: 0, expiring: 0, expired: 0, not_done: 1,
      });
    }
  });

  it("counts current records toward compliance", () => {
    const records = makeFullyCompliantRecords("s1");
    const result = computeTrainingCompliance(records, 1);
    expect(result.overall_compliance_rate).toBe(100);
    expect(result.fully_compliant_staff).toBe(1);
  });

  it("counts expiring records toward compliance", () => {
    const records = MANDATORY_TYPES.map((type, i) =>
      makeTrainingRecord({
        id: `tr-${i}`,
        staff_id: "s1",
        training_type: type,
        status: "expiring",
        expiry_date: "2030-06-01",
      }),
    );
    const result = computeTrainingCompliance(records, 1);
    expect(result.overall_compliance_rate).toBe(100);
    expect(result.fully_compliant_staff).toBe(1);
  });

  it("does not count expired records toward compliance", () => {
    const records = [
      makeTrainingRecord({ staff_id: "s1", training_type: "safeguarding", status: "expired" }),
    ];
    const result = computeTrainingCompliance(records, 1);
    expect(result.by_training_type["safeguarding"].expired).toBe(1);
    expect(result.by_training_type["safeguarding"].current).toBe(0);
    expect(result.expired_count).toBe(1);
  });

  it("decreases not_done when a staff record exists for a mandatory type", () => {
    const records = [
      makeTrainingRecord({ staff_id: "s1", training_type: "safeguarding", status: "current" }),
    ];
    const result = computeTrainingCompliance(records, 3);
    expect(result.by_training_type["safeguarding"].not_done).toBe(2);
    expect(result.by_training_type["safeguarding"].current).toBe(1);
  });

  it("counts fully compliant staff only when all mandatory types are covered", () => {
    // s1 has all mandatory types current, s2 is missing one
    const s1Records = makeFullyCompliantRecords("s1");
    const s2Records = MANDATORY_TYPES.slice(1).map((type, i) =>
      makeTrainingRecord({
        id: `tr-s2-${i}`,
        staff_id: "s2",
        training_type: type,
        status: "current",
      }),
    );
    const result = computeTrainingCompliance([...s1Records, ...s2Records], 2);
    expect(result.fully_compliant_staff).toBe(1);
  });

  it("calculates compliance rate across multiple staff", () => {
    // 2 staff, each with all mandatory types current → 100%
    const records = [
      ...makeFullyCompliantRecords("s1"),
      ...makeFullyCompliantRecords("s2"),
    ];
    const result = computeTrainingCompliance(records, 2);
    expect(result.overall_compliance_rate).toBe(100);
    expect(result.fully_compliant_staff).toBe(2);
  });

  it("identifies records expiring within 30 days", () => {
    // Use a date about 15 days from now
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    const soonStr = soon.toISOString().split("T")[0];

    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        training_type: "safeguarding",
        status: "expiring",
        expiry_date: soonStr,
      }),
    ];
    const result = computeTrainingCompliance(records, 1);
    expect(result.expiring_within_30_days).toHaveLength(1);
    expect(result.expiring_within_30_days[0].staff_id).toBe("s1");
  });

  it("does not include records expiring beyond 30 days in expiring_within_30_days", () => {
    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        training_type: "safeguarding",
        status: "current",
        expiry_date: "2030-01-01",
      }),
    ];
    const result = computeTrainingCompliance(records, 1);
    expect(result.expiring_within_30_days).toHaveLength(0);
  });

  it("does not include already-expired records in expiring_within_30_days", () => {
    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        training_type: "safeguarding",
        status: "expired",
        expiry_date: "2020-01-01",
      }),
    ];
    const result = computeTrainingCompliance(records, 1);
    expect(result.expiring_within_30_days).toHaveLength(0);
  });

  it("counts expired non-mandatory records in expired_count", () => {
    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        training_type: "attachment_trauma", // recommended, not mandatory
        status: "expired",
      }),
    ];
    const result = computeTrainingCompliance(records, 1);
    expect(result.expired_count).toBe(1);
  });
});

// ── computeStaffTrainingProfile ─────────────────────────────────────────────

describe("computeStaffTrainingProfile", () => {
  it("returns zero completion for empty records", () => {
    const result = computeStaffTrainingProfile([], [], null, "s1");
    expect(result.mandatory_complete).toBe(0);
    expect(result.mandatory_total).toBe(MANDATORY_TYPES.length);
    expect(result.compliance_rate).toBe(0);
    expect(result.missing_training).toEqual(MANDATORY_TYPES);
    expect(result.expiring_soon).toEqual([]);
    expect(result.has_level_3).toBe(false);
    expect(result.dbs_status).toBeNull();
    expect(result.dbs_renewal_due).toBeNull();
  });

  it("counts current mandatory records toward completion", () => {
    const records = [
      makeTrainingRecord({ staff_id: "s1", training_type: "safeguarding", status: "current" }),
      makeTrainingRecord({ staff_id: "s1", training_type: "first_aid", status: "current", id: "tr-2" }),
    ];
    const result = computeStaffTrainingProfile(records, [], null, "s1");
    expect(result.mandatory_complete).toBe(2);
    expect(result.missing_training).not.toContain("safeguarding");
    expect(result.missing_training).not.toContain("first_aid");
  });

  it("counts expiring mandatory records toward completion", () => {
    const records = [
      makeTrainingRecord({ staff_id: "s1", training_type: "safeguarding", status: "expiring" }),
    ];
    const result = computeStaffTrainingProfile(records, [], null, "s1");
    expect(result.mandatory_complete).toBe(1);
    expect(result.missing_training).not.toContain("safeguarding");
  });

  it("does not count expired mandatory records toward completion", () => {
    const records = [
      makeTrainingRecord({ staff_id: "s1", training_type: "safeguarding", status: "expired" }),
    ];
    const result = computeStaffTrainingProfile(records, [], null, "s1");
    expect(result.mandatory_complete).toBe(0);
    expect(result.missing_training).toContain("safeguarding");
  });

  it("filters records by staffId", () => {
    const records = [
      makeTrainingRecord({ staff_id: "s1", training_type: "safeguarding", status: "current" }),
      makeTrainingRecord({ staff_id: "s2", training_type: "first_aid", status: "current", id: "tr-2" }),
    ];
    const result = computeStaffTrainingProfile(records, [], null, "s1");
    expect(result.mandatory_complete).toBe(1);
    expect(result.missing_training).not.toContain("safeguarding");
    expect(result.missing_training).toContain("first_aid");
  });

  it("calculates compliance_rate as a rounded percentage", () => {
    // 1 out of 12 mandatory types (the mandatory count)
    const records = [
      makeTrainingRecord({ staff_id: "s1", training_type: "safeguarding", status: "current" }),
    ];
    const result = computeStaffTrainingProfile(records, [], null, "s1");
    const expected = Math.round((1 / MANDATORY_TYPES.length) * 100);
    expect(result.compliance_rate).toBe(expected);
  });

  it("returns 100% compliance when all mandatory types are completed", () => {
    const records = makeFullyCompliantRecords("s1");
    const result = computeStaffTrainingProfile(records, [], null, "s1");
    expect(result.compliance_rate).toBe(100);
    expect(result.mandatory_complete).toBe(MANDATORY_TYPES.length);
    expect(result.missing_training).toEqual([]);
  });

  it("identifies records expiring within 30 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    const soonStr = soon.toISOString().split("T")[0];

    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        training_type: "safeguarding",
        status: "expiring",
        expiry_date: soonStr,
      }),
    ];
    const result = computeStaffTrainingProfile(records, [], null, "s1");
    expect(result.expiring_soon).toHaveLength(1);
  });

  it("does not include far-future records in expiring_soon", () => {
    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        training_type: "safeguarding",
        status: "current",
        expiry_date: "2030-01-01",
      }),
    ];
    const result = computeStaffTrainingProfile(records, [], null, "s1");
    expect(result.expiring_soon).toHaveLength(0);
  });

  it("detects Level 3 Diploma when achieved", () => {
    const quals = [
      makeStaffQualification({
        staff_id: "s1",
        qualification_type: "level_3_diploma",
        status: "achieved",
      }),
    ];
    const result = computeStaffTrainingProfile([], quals, null, "s1");
    expect(result.has_level_3).toBe(true);
  });

  it("does not detect Level 3 Diploma when in_progress", () => {
    const quals = [
      makeStaffQualification({
        staff_id: "s1",
        qualification_type: "level_3_diploma",
        status: "in_progress",
      }),
    ];
    const result = computeStaffTrainingProfile([], quals, null, "s1");
    expect(result.has_level_3).toBe(false);
  });

  it("returns DBS status and renewal_due when DBS record is provided", () => {
    const dbs = makeStaffDBS({ staff_id: "s1", status: "cleared", renewal_due: "2028-06-01" });
    const result = computeStaffTrainingProfile([], [], dbs, "s1");
    expect(result.dbs_status).toBe("cleared");
    expect(result.dbs_renewal_due).toBe("2028-06-01");
  });

  it("returns null DBS fields when DBS record is null", () => {
    const result = computeStaffTrainingProfile([], [], null, "s1");
    expect(result.dbs_status).toBeNull();
    expect(result.dbs_renewal_due).toBeNull();
  });
});

// ── computeDBSCompliance ────────────────────────────────────────────────────

describe("computeDBSCompliance", () => {
  it("returns zero stats for empty records", () => {
    const result = computeDBSCompliance([]);
    expect(result.total_staff).toBe(0);
    expect(result.cleared_count).toBe(0);
    expect(result.pending_count).toBe(0);
    expect(result.expired_count).toBe(0);
    expect(result.update_service_count).toBe(0);
    expect(result.compliance_rate).toBeNull();;
  });

  it("counts cleared records correctly", () => {
    const records = [
      makeStaffDBS({ id: "dbs-1", staff_id: "s1", status: "cleared" }),
      makeStaffDBS({ id: "dbs-2", staff_id: "s2", status: "cleared" }),
    ];
    const result = computeDBSCompliance(records);
    expect(result.total_staff).toBe(2);
    expect(result.cleared_count).toBe(2);
    expect(result.compliance_rate).toBe(100);
  });

  it("counts pending records correctly", () => {
    const records = [
      makeStaffDBS({ id: "dbs-1", staff_id: "s1", status: "pending" }),
    ];
    const result = computeDBSCompliance(records);
    expect(result.pending_count).toBe(1);
    expect(result.cleared_count).toBe(0);
    expect(result.compliance_rate).toBe(0);
  });

  it("counts expired records correctly", () => {
    const records = [
      makeStaffDBS({ id: "dbs-1", staff_id: "s1", status: "expired" }),
    ];
    const result = computeDBSCompliance(records);
    expect(result.expired_count).toBe(1);
    expect(result.compliance_rate).toBe(0);
  });

  it("counts update_service_registered across all statuses", () => {
    const records = [
      makeStaffDBS({ id: "dbs-1", staff_id: "s1", status: "cleared", update_service_registered: true }),
      makeStaffDBS({ id: "dbs-2", staff_id: "s2", status: "pending", update_service_registered: true }),
      makeStaffDBS({ id: "dbs-3", staff_id: "s3", status: "expired", update_service_registered: false }),
    ];
    const result = computeDBSCompliance(records);
    expect(result.update_service_count).toBe(2);
  });

  it("calculates compliance_rate as percentage of cleared records", () => {
    const records = [
      makeStaffDBS({ id: "dbs-1", staff_id: "s1", status: "cleared" }),
      makeStaffDBS({ id: "dbs-2", staff_id: "s2", status: "pending" }),
      makeStaffDBS({ id: "dbs-3", staff_id: "s3", status: "expired" }),
    ];
    const result = computeDBSCompliance(records);
    expect(result.compliance_rate).toBe(33); // Math.round(1/3 * 100)
  });

  it("handles mix of all statuses correctly", () => {
    const records = [
      makeStaffDBS({ id: "dbs-1", staff_id: "s1", status: "cleared" }),
      makeStaffDBS({ id: "dbs-2", staff_id: "s2", status: "cleared" }),
      makeStaffDBS({ id: "dbs-3", staff_id: "s3", status: "pending" }),
      makeStaffDBS({ id: "dbs-4", staff_id: "s4", status: "expired" }),
    ];
    const result = computeDBSCompliance(records);
    expect(result.total_staff).toBe(4);
    expect(result.cleared_count).toBe(2);
    expect(result.pending_count).toBe(1);
    expect(result.expired_count).toBe(1);
    expect(result.compliance_rate).toBe(50);
  });

  it("does not count statuses other than cleared/pending/expired", () => {
    const records = [
      makeStaffDBS({ id: "dbs-1", staff_id: "s1", status: "not_applied" }),
      makeStaffDBS({ id: "dbs-2", staff_id: "s2", status: "barred" }),
    ];
    const result = computeDBSCompliance(records);
    expect(result.total_staff).toBe(2);
    expect(result.cleared_count).toBe(0);
    expect(result.pending_count).toBe(0);
    expect(result.expired_count).toBe(0);
    expect(result.compliance_rate).toBe(0);
  });

  it("rounds compliance_rate to nearest integer", () => {
    const records = [
      makeStaffDBS({ id: "dbs-1", staff_id: "s1", status: "cleared" }),
      makeStaffDBS({ id: "dbs-2", staff_id: "s2", status: "cleared" }),
      makeStaffDBS({ id: "dbs-3", staff_id: "s3", status: "pending" }),
    ];
    const result = computeDBSCompliance(records);
    expect(result.compliance_rate).toBe(67); // Math.round(2/3 * 100)
  });
});

// ── identifyTrainingAlerts ──────────────────────────────────────────────────

describe("identifyTrainingAlerts", () => {
  it("returns no alerts for empty inputs", () => {
    const alerts = identifyTrainingAlerts([], [], []);
    expect(alerts).toEqual([]);
  });

  it("raises critical alert for expired DBS", () => {
    const dbsRecords = [
      makeStaffDBS({ staff_id: "s1", staff_name: "Alice", status: "expired" }),
    ];
    const alerts = identifyTrainingAlerts([], dbsRecords, []);
    const dbsExpired = alerts.filter((a) => a.type === "dbs_expired");
    expect(dbsExpired).toHaveLength(1);
    expect(dbsExpired[0].severity).toBe("critical");
    expect(dbsExpired[0].staff_name).toBe("Alice");
  });

  it("raises high alert for DBS renewal due within 30 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    const soonStr = soon.toISOString().split("T")[0];

    const dbsRecords = [
      makeStaffDBS({
        staff_id: "s1",
        staff_name: "Bob",
        status: "cleared",
        renewal_due: soonStr,
      }),
    ];
    const alerts = identifyTrainingAlerts([], dbsRecords, []);
    const dbsExpiring = alerts.filter((a) => a.type === "dbs_expiring_30_days");
    expect(dbsExpiring).toHaveLength(1);
    expect(dbsExpiring[0].severity).toBe("high");
    expect(dbsExpiring[0].staff_name).toBe("Bob");
  });

  it("does not raise DBS renewal alert when renewal_due is far away", () => {
    const dbsRecords = [
      makeStaffDBS({ staff_id: "s1", status: "cleared", renewal_due: "2030-01-01" }),
    ];
    const alerts = identifyTrainingAlerts([], dbsRecords, []);
    const dbsExpiring = alerts.filter((a) => a.type === "dbs_expiring_30_days");
    expect(dbsExpiring).toHaveLength(0);
  });

  it("raises high alert for expired mandatory training", () => {
    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        staff_name: "Charlie",
        training_type: "safeguarding",
        status: "expired",
      }),
    ];
    const alerts = identifyTrainingAlerts(records, [], []);
    const expired = alerts.filter((a) => a.type === "mandatory_training_expired");
    expect(expired).toHaveLength(1);
    expect(expired[0].severity).toBe("high");
    expect(expired[0].staff_name).toBe("Charlie");
    expect(expired[0].message).toContain("Safeguarding Children");
  });

  it("does not raise expired alert for non-mandatory training", () => {
    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        training_type: "attachment_trauma", // recommended, not mandatory
        status: "expired",
      }),
    ];
    const alerts = identifyTrainingAlerts(records, [], []);
    const expired = alerts.filter((a) => a.type === "mandatory_training_expired");
    expect(expired).toHaveLength(0);
  });

  it("raises medium alert for mandatory training expiring within 30 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    const soonStr = soon.toISOString().split("T")[0];

    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        staff_name: "Diana",
        training_type: "first_aid",
        status: "expiring",
        expiry_date: soonStr,
      }),
    ];
    const alerts = identifyTrainingAlerts(records, [], []);
    const expiring = alerts.filter((a) => a.type === "training_expiring_30_days");
    expect(expiring).toHaveLength(1);
    expect(expiring[0].severity).toBe("medium");
    expect(expiring[0].staff_name).toBe("Diana");
  });

  it("does not raise training expiring alert when expiry is far away", () => {
    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        training_type: "safeguarding",
        status: "current",
        expiry_date: "2030-01-01",
      }),
    ];
    const alerts = identifyTrainingAlerts(records, [], []);
    const expiring = alerts.filter((a) => a.type === "training_expiring_30_days");
    expect(expiring).toHaveLength(0);
  });

  it("raises high alert when Level 3 Diploma expected completion date has passed", () => {
    const qualifications = [
      makeStaffQualification({
        staff_id: "s1",
        staff_name: "Eve",
        qualification_type: "level_3_diploma",
        status: "in_progress",
        expected_completion: "2024-01-01", // far in the past
      }),
    ];
    const alerts = identifyTrainingAlerts([], [], qualifications);
    const level3 = alerts.filter((a) => a.type === "no_level_3_after_2_years");
    expect(level3).toHaveLength(1);
    expect(level3[0].severity).toBe("high");
    expect(level3[0].staff_name).toBe("Eve");
  });

  it("does not raise Level 3 alert when status is achieved", () => {
    const qualifications = [
      makeStaffQualification({
        staff_id: "s1",
        qualification_type: "level_3_diploma",
        status: "achieved",
        expected_completion: "2024-01-01",
      }),
    ];
    const alerts = identifyTrainingAlerts([], [], qualifications);
    const level3 = alerts.filter((a) => a.type === "no_level_3_after_2_years");
    expect(level3).toHaveLength(0);
  });

  it("does not raise Level 3 alert when expected_completion is in the future", () => {
    const qualifications = [
      makeStaffQualification({
        staff_id: "s1",
        qualification_type: "level_3_diploma",
        status: "in_progress",
        expected_completion: "2030-01-01",
      }),
    ];
    const alerts = identifyTrainingAlerts([], [], qualifications);
    const level3 = alerts.filter((a) => a.type === "no_level_3_after_2_years");
    expect(level3).toHaveLength(0);
  });

  it("raises high alert when overall compliance is below 80%", () => {
    // Single staff member with only 1 out of 12 mandatory types current
    const records = [
      makeTrainingRecord({
        staff_id: "s1",
        training_type: "safeguarding",
        status: "current",
        expiry_date: "2030-01-01",
      }),
    ];
    const alerts = identifyTrainingAlerts(records, [], []);
    const lowCompliance = alerts.filter((a) => a.type === "low_compliance");
    expect(lowCompliance).toHaveLength(1);
    expect(lowCompliance[0].severity).toBe("high");
    expect(lowCompliance[0].message).toContain("below the 80% threshold");
  });

  it("does not raise low compliance alert when compliance is 100%", () => {
    const records = makeFullyCompliantRecords("s1");
    const alerts = identifyTrainingAlerts(records, [], []);
    const lowCompliance = alerts.filter((a) => a.type === "low_compliance");
    expect(lowCompliance).toHaveLength(0);
  });

  it("can raise multiple alert types simultaneously", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 10);
    const soonStr = soon.toISOString().split("T")[0];

    const records = [
      makeTrainingRecord({
        id: "tr-expired",
        staff_id: "s1",
        staff_name: "Frank",
        training_type: "fire_safety",
        status: "expired",
        expiry_date: "2020-01-01",
      }),
      makeTrainingRecord({
        id: "tr-expiring",
        staff_id: "s1",
        staff_name: "Frank",
        training_type: "safeguarding",
        status: "expiring",
        expiry_date: soonStr,
      }),
    ];
    const dbsRecords = [
      makeStaffDBS({ staff_id: "s1", staff_name: "Frank", status: "expired" }),
    ];
    const alerts = identifyTrainingAlerts(records, dbsRecords, []);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("dbs_expired")).toBe(true);
    expect(types.has("mandatory_training_expired")).toBe(true);
    expect(types.has("training_expiring_30_days")).toBe(true);
    expect(types.has("low_compliance")).toBe(true);
  });
});

// ── Constants ──────────────────────────────────────────────────────────────

describe("MANDATORY_TRAINING", () => {
  it("has exactly 14 entries", () => {
    expect(MANDATORY_TRAINING).toHaveLength(14);
  });

  it("each entry has the required shape", () => {
    for (const entry of MANDATORY_TRAINING) {
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.renewal_months).toBe("number");
      expect(entry.renewal_months).toBeGreaterThan(0);
      expect(["mandatory", "recommended"]).toContain(entry.level);
    }
  });

  it("has 12 mandatory-level entries", () => {
    const mandatory = MANDATORY_TRAINING.filter((t) => t.level === "mandatory");
    expect(mandatory).toHaveLength(12);
  });

  it("has 2 recommended-level entries", () => {
    const recommended = MANDATORY_TRAINING.filter((t) => t.level === "recommended");
    expect(recommended).toHaveLength(2);
  });

  it("includes safeguarding with 12-month renewal", () => {
    const sg = MANDATORY_TRAINING.find((t) => t.type === "safeguarding");
    expect(sg).toBeDefined();
    expect(sg!.label).toBe("Safeguarding Children");
    expect(sg!.renewal_months).toBe(12);
    expect(sg!.level).toBe("mandatory");
  });

  it("includes first_aid with 36-month renewal", () => {
    const fa = MANDATORY_TRAINING.find((t) => t.type === "first_aid");
    expect(fa).toBeDefined();
    expect(fa!.renewal_months).toBe(36);
  });

  it("has unique type values", () => {
    const types = MANDATORY_TRAINING.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe("DBS_STATUS", () => {
  it("has exactly 5 statuses", () => {
    expect(DBS_STATUS).toHaveLength(5);
  });

  it("includes key statuses", () => {
    expect(DBS_STATUS).toContain("not_applied");
    expect(DBS_STATUS).toContain("pending");
    expect(DBS_STATUS).toContain("cleared");
    expect(DBS_STATUS).toContain("barred");
    expect(DBS_STATUS).toContain("expired");
  });
});

describe("QUALIFICATION_TYPES", () => {
  it("has exactly 8 types", () => {
    expect(QUALIFICATION_TYPES).toHaveLength(8);
  });

  it("includes level_3_diploma and level_5_diploma", () => {
    expect(QUALIFICATION_TYPES).toContain("level_3_diploma");
    expect(QUALIFICATION_TYPES).toContain("level_5_diploma");
  });

  it("includes social_work_degree", () => {
    expect(QUALIFICATION_TYPES).toContain("social_work_degree");
  });

  it("all entries are non-empty strings", () => {
    for (const qt of QUALIFICATION_TYPES) {
      expect(typeof qt).toBe("string");
      expect(qt.length).toBeGreaterThan(0);
    }
  });
});
