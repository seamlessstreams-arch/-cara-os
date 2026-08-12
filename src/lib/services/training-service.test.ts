import { describe, it, expect } from "vitest";
import { daysFromNow } from "@/lib/utils";
import {
  computeTrainingCompliance,
  computeStaffTrainingProfile,
  computeDBSCompliance,
  identifyTrainingAlerts,
  MANDATORY_TRAINING,
  type TrainingRecord,
  type StaffDBS,
  type StaffQualification,
} from "./training-service";

// ── Factories ────────────────────────────────────────────────────────────

function makeTrainingRecord(overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  return {
    id: "t1",
    home_id: "h1",
    staff_id: "s1",
    staff_name: "Staff A",
    training_type: "safeguarding",
    completed_date: "2025-01-01",
    expiry_date: "2026-01-01",
    provider: "Provider X",
    status: "current",
    created_at: "2025-01-01",
    ...overrides,
  };
}

function makeDBS(overrides: Partial<StaffDBS> = {}): StaffDBS {
  return {
    id: "d1",
    home_id: "h1",
    staff_id: "s1",
    staff_name: "Staff A",
    dbs_number: "DBS123",
    issue_date: "2024-01-01",
    dbs_type: "enhanced_barred",
    status: "cleared",
    renewal_due: "2027-01-01",
    update_service_registered: true,
    created_at: "2024-01-01",
    ...overrides,
  };
}

function makeQualification(overrides: Partial<StaffQualification> = {}): StaffQualification {
  return {
    id: "q1",
    home_id: "h1",
    staff_id: "s1",
    staff_name: "Staff A",
    qualification_type: "level_3_diploma",
    title: "Level 3 Diploma",
    awarding_body: "CACHE",
    date_achieved: "2023-06-01",
    status: "achieved",
    created_at: "2023-06-01",
    ...overrides,
  };
}

// ── computeTrainingCompliance ────────────────────────────────────────────

describe("computeTrainingCompliance", () => {
  it("returns zero compliance for no records and no staff", () => {
    const result = computeTrainingCompliance([], 0);
    expect(result.overall_compliance_rate).toBeNull();;
    expect(result.fully_compliant_staff).toBe(0);
    expect(result.expired_count).toBe(0);
    expect(result.expiring_within_30_days).toEqual([]);
  });

  it("calculates compliance rate based on mandatory slots", () => {
    const mandatoryTypes = MANDATORY_TRAINING.filter((t) => t.level === "mandatory");
    // Give staff 1 all mandatory training as current
    const records = mandatoryTypes.map((mt, i) =>
      makeTrainingRecord({
        id: `t${i}`,
        staff_id: "s1",
        training_type: mt.type,
        status: "current",
      }),
    );
    const result = computeTrainingCompliance(records, 1);
    expect(result.overall_compliance_rate).toBe(100);
    expect(result.fully_compliant_staff).toBe(1);
  });

  it("counts expired records", () => {
    const records = [
      makeTrainingRecord({ status: "expired" }),
    ];
    const result = computeTrainingCompliance(records, 1);
    expect(result.expired_count).toBe(1);
  });

  it("identifies expiring within 30 days", () => {
    const soon = daysFromNow(15);
    const records = [
      makeTrainingRecord({ expiry_date: soon, status: "expiring" }),
    ];
    const result = computeTrainingCompliance(records, 1);
    expect(result.expiring_within_30_days).toHaveLength(1);
  });
});

// ── computeStaffTrainingProfile ──────────────────────────────────────────

describe("computeStaffTrainingProfile", () => {
  it("returns full profile with missing training when none present", () => {
    const result = computeStaffTrainingProfile([], [], null, "s1");
    expect(result.mandatory_complete).toBe(0);
    expect(result.compliance_rate).toBe(0);
    expect(result.missing_training.length).toBe(result.mandatory_total);
    expect(result.has_level_3).toBe(false);
    expect(result.dbs_status).toBeNull();
  });

  it("counts mandatory training that is current or expiring", () => {
    const records = [
      makeTrainingRecord({ training_type: "safeguarding", status: "current" }),
      makeTrainingRecord({ id: "t2", training_type: "first_aid", status: "expiring" }),
    ];
    const result = computeStaffTrainingProfile(records, [], null, "s1");
    expect(result.mandatory_complete).toBe(2);
  });

  it("identifies Level 3 qualification", () => {
    const quals = [
      makeQualification({ qualification_type: "level_3_diploma", status: "achieved" }),
    ];
    const result = computeStaffTrainingProfile([], quals, null, "s1");
    expect(result.has_level_3).toBe(true);
  });

  it("reports DBS status from provided DBS record", () => {
    const dbs = makeDBS({ status: "cleared", renewal_due: "2027-01-01" });
    const result = computeStaffTrainingProfile([], [], dbs, "s1");
    expect(result.dbs_status).toBe("cleared");
    expect(result.dbs_renewal_due).toBe("2027-01-01");
  });
});

// ── computeDBSCompliance ─────────────────────────────────────────────────

describe("computeDBSCompliance", () => {
  it("returns zeroes for empty records", () => {
    const result = computeDBSCompliance([]);
    expect(result.total_staff).toBe(0);
    expect(result.cleared_count).toBe(0);
    expect(result.compliance_rate).toBeNull();;
  });

  it("calculates compliance as percentage of cleared", () => {
    const records = [
      makeDBS({ status: "cleared" }),
      makeDBS({ id: "d2", staff_id: "s2", status: "pending" }),
    ];
    const result = computeDBSCompliance(records);
    expect(result.total_staff).toBe(2);
    expect(result.cleared_count).toBe(1);
    expect(result.pending_count).toBe(1);
    expect(result.compliance_rate).toBe(50);
  });

  it("counts update service registrations", () => {
    const records = [
      makeDBS({ update_service_registered: true }),
      makeDBS({ id: "d2", staff_id: "s2", update_service_registered: false }),
    ];
    const result = computeDBSCompliance(records);
    expect(result.update_service_count).toBe(1);
  });
});

// ── identifyTrainingAlerts ───────────────────────────────────────────────

describe("identifyTrainingAlerts", () => {
  it("returns empty for no records", () => {
    expect(identifyTrainingAlerts([], [], [])).toEqual([]);
  });

  it("triggers critical alert for expired DBS", () => {
    const dbs = [makeDBS({ status: "expired" })];
    const alerts = identifyTrainingAlerts([], dbs, []);
    expect(alerts.some((a) => a.type === "dbs_expired" && a.severity === "critical")).toBe(true);
  });

  it("triggers high alert for DBS expiring within 30 days", () => {
    const soon = daysFromNow(15);
    const dbs = [makeDBS({ renewal_due: soon })];
    const alerts = identifyTrainingAlerts([], dbs, []);
    expect(alerts.some((a) => a.type === "dbs_expiring_30_days" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for expired mandatory training", () => {
    const records = [
      makeTrainingRecord({ training_type: "safeguarding", status: "expired" }),
    ];
    const alerts = identifyTrainingAlerts(records, [], []);
    expect(alerts.some((a) => a.type === "mandatory_training_expired" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for Level 3 past expected completion", () => {
    const quals = [
      makeQualification({
        qualification_type: "level_3_diploma",
        status: "in_progress",
        expected_completion: "2024-01-01",
      }),
    ];
    const alerts = identifyTrainingAlerts([], [], quals);
    expect(alerts.some((a) => a.type === "no_level_3_after_2_years" && a.severity === "high")).toBe(true);
  });
});
