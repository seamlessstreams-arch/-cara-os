import { describe, it, expect } from "vitest";
import {
  computeDisciplinaryMetrics,
  identifyDisciplinaryAlerts,
} from "./staff-disciplinary-service";
import type {
  DisciplinaryRecord,
  GrievanceRecord,
} from "./staff-disciplinary-service";

// -- Factories ----------------------------------------------------------------

function makeDisciplinary(overrides: Partial<DisciplinaryRecord> = {}): DisciplinaryRecord {
  return {
    id: "disc-1",
    home_id: "home-1",
    staff_id: "s-1",
    staff_name: "Jane Doe",
    category: "conduct",
    description: "Late attendance",
    date_of_incident: "2026-04-01",
    reported_by: "manager-1",
    reported_date: "2026-04-02",
    investigation_required: false,
    investigating_officer: null,
    investigation_started_date: null,
    investigation_completed_date: null,
    hearing_date: null,
    hearing_outcome: null,
    outcome_type: null,
    outcome_date: null,
    outcome_expiry_date: null,
    appeal_submitted: false,
    appeal_date: null,
    appeal_outcome: null,
    lado_referral_required: false,
    lado_referral_date: null,
    dbs_referral_required: false,
    dbs_referral_date: null,
    ofsted_notification_required: false,
    ofsted_notification_date: null,
    status: "closed",
    notes: null,
    supporting_documents: [],
    created_at: "2026-04-02T00:00:00Z",
    updated_at: "2026-04-02T00:00:00Z",
    ...overrides,
  };
}

function makeGrievance(overrides: Partial<GrievanceRecord> = {}): GrievanceRecord {
  return {
    id: "grv-1",
    home_id: "home-1",
    staff_id: "s-2",
    staff_name: "John Doe",
    grievance_type: "working_conditions",
    description: "Office temperature",
    date_raised: "2026-04-10",
    informal_resolution_attempted: false,
    informal_resolution_date: null,
    informal_outcome: null,
    formal_stage: null,
    hearing_date: null,
    hearing_officer: null,
    outcome: null,
    outcome_date: null,
    appeal_submitted: false,
    appeal_date: null,
    appeal_outcome: null,
    status: "resolved",
    created_at: "2026-04-10T00:00:00Z",
    updated_at: "2026-04-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeDisciplinaryMetrics ------------------------------------------------

describe("computeDisciplinaryMetrics", () => {
  it("returns zeroes for empty arrays", () => {
    const m = computeDisciplinaryMetrics([], []);
    expect(m.total_disciplinary).toBe(0);
    expect(m.total_grievances).toBe(0);
    expect(m.active_disciplinary_cases).toBe(0);
    expect(m.active_grievance_cases).toBe(0);
    expect(m.avg_investigation_days).toBeNull();; expect(m.lado_referral_rate).toBeNull();; expect(m.informal_resolution_rate).toBeNull();; });

  it("counts active disciplinary cases (all statuses except closed)", () => {
    const discs = [
      makeDisciplinary({ id: "1", status: "reported" }),
      makeDisciplinary({ id: "2", status: "under_investigation" }),
      makeDisciplinary({ id: "3", status: "closed" }),
    ];
    const m = computeDisciplinaryMetrics(discs, []);
    expect(m.active_disciplinary_cases).toBe(2);
    expect(m.total_disciplinary).toBe(3);
  });

  it("counts active grievance cases (all statuses except resolved/withdrawn)", () => {
    const grvs = [
      makeGrievance({ id: "1", status: "raised" }),
      makeGrievance({ id: "2", status: "resolved" }),
      makeGrievance({ id: "3", status: "withdrawn" }),
      makeGrievance({ id: "4", status: "formal_stage_1" }),
    ];
    const m = computeDisciplinaryMetrics([], grvs);
    expect(m.active_grievance_cases).toBe(2);
    expect(m.total_grievances).toBe(4);
  });

  it("computes average investigation days correctly", () => {
    const discs = [
      makeDisciplinary({
        id: "1",
        investigation_started_date: "2026-04-01",
        investigation_completed_date: "2026-04-11",
      }),
      makeDisciplinary({
        id: "2",
        investigation_started_date: "2026-04-01",
        investigation_completed_date: "2026-04-21",
      }),
    ];
    const m = computeDisciplinaryMetrics(discs, []);
    expect(m.avg_investigation_days).toBe(15);
  });

  it("computes referral rates correctly", () => {
    const discs = [
      makeDisciplinary({ id: "1", lado_referral_required: true, dbs_referral_required: true, ofsted_notification_required: false }),
      makeDisciplinary({ id: "2", lado_referral_required: false, dbs_referral_required: false, ofsted_notification_required: true }),
    ];
    const m = computeDisciplinaryMetrics(discs, []);
    expect(m.lado_referral_rate).toBe(50);
    expect(m.dbs_referral_rate).toBe(50);
    expect(m.ofsted_notification_rate).toBe(50);
  });

  it("computes informal resolution rate (only resolved grievances)", () => {
    const grvs = [
      makeGrievance({ id: "1", status: "resolved", informal_resolution_attempted: true, informal_outcome: "Resolved informally" }),
      makeGrievance({ id: "2", status: "resolved", informal_resolution_attempted: false, informal_outcome: null }),
      makeGrievance({ id: "3", status: "raised" }),
    ];
    const m = computeDisciplinaryMetrics([], grvs);
    expect(m.informal_resolution_rate).toBe(50);
  });

  it("builds by_category and by_grievance_type maps", () => {
    const discs = [
      makeDisciplinary({ id: "1", category: "conduct" }),
      makeDisciplinary({ id: "2", category: "conduct" }),
      makeDisciplinary({ id: "3", category: "gross_misconduct" }),
    ];
    const grvs = [
      makeGrievance({ id: "1", grievance_type: "bullying_harassment" }),
      makeGrievance({ id: "2", grievance_type: "bullying_harassment" }),
    ];
    const m = computeDisciplinaryMetrics(discs, grvs);
    expect(m.by_category).toEqual({ conduct: 2, gross_misconduct: 1 });
    expect(m.by_grievance_type).toEqual({ bullying_harassment: 2 });
  });
});

// -- identifyDisciplinaryAlerts ------------------------------------------------

describe("identifyDisciplinaryAlerts", () => {
  it("returns empty alerts for empty arrays", () => {
    expect(identifyDisciplinaryAlerts([], [])).toEqual([]);
  });

  it("fires critical alert for active safeguarding concern", () => {
    const discs = [makeDisciplinary({ id: "1", category: "safeguarding_concern", status: "reported" })];
    const alerts = identifyDisciplinaryAlerts(discs, []);
    const found = alerts.filter((a) => a.type === "safeguarding_concern");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
  });

  it("does not fire safeguarding alert when case is closed", () => {
    const discs = [makeDisciplinary({ id: "1", category: "safeguarding_concern", status: "closed" })];
    const alerts = identifyDisciplinaryAlerts(discs, []);
    expect(alerts.filter((a) => a.type === "safeguarding_concern")).toHaveLength(0);
  });

  it("fires critical alert for LADO referral required but not made", () => {
    const discs = [makeDisciplinary({ id: "1", lado_referral_required: true, lado_referral_date: null, status: "reported" })];
    const alerts = identifyDisciplinaryAlerts(discs, []);
    expect(alerts.filter((a) => a.type === "lado_referral_pending")).toHaveLength(1);
  });

  it("fires critical alert for gross misconduct reported", () => {
    const discs = [makeDisciplinary({ id: "1", category: "gross_misconduct", status: "reported" })];
    const alerts = identifyDisciplinaryAlerts(discs, []);
    expect(alerts.filter((a) => a.type === "gross_misconduct_reported")).toHaveLength(1);
  });

  it("fires high alert for sensitive grievance (bullying/discrimination)", () => {
    const grvs = [
      makeGrievance({ id: "1", grievance_type: "bullying_harassment", status: "raised" }),
      makeGrievance({ id: "2", grievance_type: "discrimination", status: "formal_stage_1" }),
    ];
    const alerts = identifyDisciplinaryAlerts([], grvs);
    const found = alerts.filter((a) => a.type === "sensitive_grievance");
    expect(found).toHaveLength(2);
    expect(found[0].severity).toBe("high");
  });

  it("fires high alert for repeat disciplinary (>= 2 active cases for same staff)", () => {
    const discs = [
      makeDisciplinary({ id: "1", staff_id: "s-1", status: "reported" }),
      makeDisciplinary({ id: "2", staff_id: "s-1", status: "under_investigation" }),
    ];
    const alerts = identifyDisciplinaryAlerts(discs, []);
    const found = alerts.filter((a) => a.type === "repeat_disciplinary");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires medium alert for grievance at appeal stage", () => {
    const grvs = [makeGrievance({ id: "1", status: "appeal" })];
    const alerts = identifyDisciplinaryAlerts([], grvs);
    expect(alerts.filter((a) => a.type === "grievance_appeal")).toHaveLength(1);
  });
});
