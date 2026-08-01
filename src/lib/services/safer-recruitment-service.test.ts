import { describe, it, expect } from "vitest";
import {
  computeRecruitmentCompliance,
  identifyRecruitmentAlerts,
} from "./safer-recruitment-service";
import type {
  DBSCheck,
  StaffReference,
  PreEmploymentCheck,
} from "./safer-recruitment-service";

// -- Factory Functions --------------------------------------------------------

function makeDBS(overrides: Partial<DBSCheck> = {}): DBSCheck {
  return {
    id: "dbs-1",
    staff_id: "staff-1",
    staff_name: "Jane Smith",
    home_id: "home-1",
    dbs_type: "enhanced",
    certificate_number: "CERT001",
    issue_date: "2025-01-01",
    expiry_date: "2028-01-01",
    update_service_registered: true,
    update_service_id: "US001",
    status: "valid",
    checked_by: "manager-1",
    checked_date: "2025-01-15",
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeReference(overrides: Partial<StaffReference> = {}): StaffReference {
  return {
    id: "ref-1",
    staff_id: "staff-1",
    staff_name: "Jane Smith",
    home_id: "home-1",
    reference_type: "employer",
    referee_name: "John Doe",
    referee_role: "Manager",
    referee_organisation: "Care Co",
    referee_email: "john@example.com",
    referee_phone: null,
    date_requested: "2025-01-01",
    date_received: "2025-01-10",
    satisfactory: true,
    concerns_noted: null,
    verified_by: "manager-1",
    verified_date: "2025-01-12",
    status: "verified",
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeCheck(overrides: Partial<PreEmploymentCheck> = {}): PreEmploymentCheck {
  return {
    id: "check-1",
    staff_id: "staff-1",
    staff_name: "Jane Smith",
    home_id: "home-1",
    check_type: "dbs_check",
    completed: true,
    completed_date: "2025-01-05",
    completed_by: "manager-1",
    notes: null,
    document_reference: null,
    status: "completed",
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeRecruitmentCompliance ---------------------------------------------

describe("computeRecruitmentCompliance", () => {
  it("returns zeroes for empty arrays", () => {
    const r = computeRecruitmentCompliance([], [], [], 5);
    expect(r.total_staff).toBe(5);
    expect(r.dbs_valid_count).toBe(0);
    expect(r.dbs_expiring_count).toBe(0);
    expect(r.dbs_expired_count).toBe(0);
    expect(r.dbs_pending_count).toBe(0);
    expect(r.dbs_flagged_count).toBe(0);
    expect(r.dbs_validity_rate).toBeNull();
    expect(r.references_verified_count).toBe(0);
    expect(r.references_outstanding_count).toBe(0);
    expect(r.references_unsatisfactory_count).toBe(0);
    expect(r.reference_completion_rate).toBeNull();
    expect(r.checks_completed_count).toBe(0);
    expect(r.checks_pending_count).toBe(0);
    expect(r.checks_concern_count).toBe(0);
    expect(r.check_completion_rate).toBeNull(); // fab-0.;
    expect(r.overall_compliance_rate).toBeNull(); // fab-0.;
  });

  it("counts DBS statuses correctly", () => {
    const dbs = [
      makeDBS({ id: "d1", status: "valid" }),
      makeDBS({ id: "d2", status: "valid" }),
      makeDBS({ id: "d3", status: "expiring" }),
      makeDBS({ id: "d4", status: "expired" }),
      makeDBS({ id: "d5", status: "pending" }),
      makeDBS({ id: "d6", status: "flagged" }),
    ];
    const r = computeRecruitmentCompliance(dbs, [], [], 6);
    expect(r.dbs_valid_count).toBe(2);
    expect(r.dbs_expiring_count).toBe(1);
    expect(r.dbs_expired_count).toBe(1);
    expect(r.dbs_pending_count).toBe(1);
    expect(r.dbs_flagged_count).toBe(1);
    // validity rate = (valid + expiring) / total = 3/6 = 50%
    expect(r.dbs_validity_rate).toBe(50);
  });

  it("computes reference completion rate from verified count", () => {
    const refs = [
      makeReference({ id: "r1", status: "verified" }),
      makeReference({ id: "r2", status: "verified" }),
      makeReference({ id: "r3", status: "outstanding" }),
      makeReference({ id: "r4", status: "unsatisfactory" }),
    ];
    const r = computeRecruitmentCompliance([], refs, [], 4);
    expect(r.references_verified_count).toBe(2);
    expect(r.references_outstanding_count).toBe(1);
    expect(r.references_unsatisfactory_count).toBe(1);
    // reference completion = verified / total = 2/4 = 50%
    expect(r.reference_completion_rate).toBe(50);
  });

  it("computes check completion rate including na status", () => {
    const checks = [
      makeCheck({ id: "c1", status: "completed" }),
      makeCheck({ id: "c2", status: "na" }),
      makeCheck({ id: "c3", status: "pending" }),
      makeCheck({ id: "c4", status: "concern" }),
    ];
    const r = computeRecruitmentCompliance([], [], checks, 4);
    expect(r.checks_completed_count).toBe(2);
    expect(r.checks_pending_count).toBe(1);
    expect(r.checks_concern_count).toBe(1);
    // check completion = (completed + na) / total = 2/4 = 50%
    expect(r.check_completion_rate).toBe(50);
  });

  it("computes overall compliance as average of three rates", () => {
    const dbs = [makeDBS({ status: "valid" })]; // 100%
    const refs = [makeReference({ status: "verified" })]; // 100%
    const checks = [makeCheck({ status: "completed" })]; // 100%
    const r = computeRecruitmentCompliance(dbs, refs, checks, 1);
    expect(r.overall_compliance_rate).toBe(100);
  });
});

// -- identifyRecruitmentAlerts ------------------------------------------------

describe("identifyRecruitmentAlerts", () => {
  it("returns empty array when no data", () => {
    const alerts = identifyRecruitmentAlerts([], [], []);
    expect(alerts).toEqual([]);
  });

  it("flags expired DBS as critical", () => {
    const dbs = [makeDBS({ status: "expired" })];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const expired = alerts.filter((a) => a.type === "dbs_expired");
    expect(expired).toHaveLength(1);
    expect(expired[0].severity).toBe("critical");
  });

  it("flags flagged DBS as critical", () => {
    const dbs = [makeDBS({ status: "flagged" })];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const flagged = alerts.filter((a) => a.type === "dbs_flagged");
    expect(flagged).toHaveLength(1);
    expect(flagged[0].severity).toBe("critical");
  });

  it("flags pending DBS as medium", () => {
    const dbs = [makeDBS({ status: "pending" })];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const pending = alerts.filter((a) => a.type === "dbs_pending");
    expect(pending).toHaveLength(1);
    expect(pending[0].severity).toBe("medium");
  });

  it("flags DBS expiring within 30 days as high", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    const dbs = [makeDBS({ status: "valid", expiry_date: soon.toISOString().slice(0, 10) })];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const expiring = alerts.filter((a) => a.type === "dbs_expiring_30_days");
    expect(expiring).toHaveLength(1);
    expect(expiring[0].severity).toBe("high");
  });

  it("flags enhanced DBS without update service as low", () => {
    const dbs = [makeDBS({ dbs_type: "enhanced", update_service_registered: false, status: "valid" })];
    const alerts = identifyRecruitmentAlerts(dbs, [], []);
    const noUpdate = alerts.filter((a) => a.type === "no_update_service");
    expect(noUpdate).toHaveLength(1);
    expect(noUpdate[0].severity).toBe("low");
  });

  it("flags unsatisfactory reference as critical", () => {
    const refs = [makeReference({ status: "unsatisfactory" })];
    const alerts = identifyRecruitmentAlerts([], refs, []);
    const unsat = alerts.filter((a) => a.type === "reference_unsatisfactory");
    expect(unsat).toHaveLength(1);
    expect(unsat[0].severity).toBe("critical");
  });

  it("flags outstanding reference as high", () => {
    const refs = [makeReference({ status: "outstanding" })];
    const alerts = identifyRecruitmentAlerts([], refs, []);
    const outstanding = alerts.filter((a) => a.type === "reference_outstanding");
    expect(outstanding).toHaveLength(1);
    expect(outstanding[0].severity).toBe("high");
  });

  it("flags pre-employment check concern as high", () => {
    const checks = [makeCheck({ status: "concern", check_type: "dbs_check" })];
    const alerts = identifyRecruitmentAlerts([], [], checks);
    const concern = alerts.filter((a) => a.type === "check_concern");
    expect(concern).toHaveLength(1);
    expect(concern[0].severity).toBe("high");
  });

  it("flags incomplete pre-employment check as medium", () => {
    const checks = [makeCheck({ status: "pending", check_type: "right_to_work" })];
    const alerts = identifyRecruitmentAlerts([], [], checks);
    const incomplete = alerts.filter((a) => a.type === "check_incomplete");
    expect(incomplete).toHaveLength(1);
    expect(incomplete[0].severity).toBe("medium");
  });
});
