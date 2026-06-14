import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
} from "./staff-agency-worker-compliance-service";
import type { StaffAgencyWorkerComplianceRow } from "./staff-agency-worker-compliance-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<StaffAgencyWorkerComplianceRow> = {}): StaffAgencyWorkerComplianceRow {
  return {
    id: "row-1",
    home_id: "home-1",
    staff_name: "Jane Doe",
    agency_name: "Care Agency Ltd",
    start_date: "2026-01-10",
    end_date: null,
    compliance_status: "Compliant",
    dbs_verified: true,
    references_verified: true,
    qualifications_verified: true,
    induction_completed: true,
    safeguarding_training_confirmed: true,
    mandatory_training_confirmed: true,
    id_verified: true,
    right_to_work_verified: true,
    supervision_arranged: true,
    shift_count: 10,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics ------------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.partially_compliant_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.dbs_verified_rate).toBe(0);
    expect(m.references_rate).toBe(0);
    expect(m.qualifications_rate).toBe(0);
    expect(m.induction_rate).toBe(0);
    expect(m.safeguarding_rate).toBe(0);
    expect(m.mandatory_training_rate).toBe(0);
    expect(m.supervision_rate).toBe(0);
    expect(m.avg_shifts).toBe(0);
    expect(m.unique_staff).toBe(0);
    expect(m.unique_agencies).toBe(0);
  });

  it("counts status categories correctly", () => {
    const rows = [
      makeRow({ id: "1", compliance_status: "Non-Compliant" }),
      makeRow({ id: "2", compliance_status: "Non-Compliant" }),
      makeRow({ id: "3", compliance_status: "Partially Compliant" }),
      makeRow({ id: "4", compliance_status: "Pending Review" }),
      makeRow({ id: "5", compliance_status: "Compliant" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(5);
    expect(m.non_compliant_count).toBe(2);
    expect(m.partially_compliant_count).toBe(1);
    expect(m.pending_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", dbs_verified: true, supervision_arranged: true }),
      makeRow({ id: "2", dbs_verified: false, supervision_arranged: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.dbs_verified_rate).toBe(50);
    expect(m.supervision_rate).toBe(50);
  });

  it("calculates avg_shifts correctly", () => {
    const rows = [
      makeRow({ id: "1", shift_count: 10 }),
      makeRow({ id: "2", shift_count: 20 }),
    ];
    const m = computeMetrics(rows);
    expect(m.avg_shifts).toBe(15);
  });

  it("counts unique staff and agencies", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Alice", agency_name: "Agency A" }),
      makeRow({ id: "2", staff_name: "Alice", agency_name: "Agency B" }),
      makeRow({ id: "3", staff_name: "Bob", agency_name: "Agency A" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(2);
    expect(m.unique_agencies).toBe(2);
  });
});

// -- computeAlerts -------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty array for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns empty array for fully compliant rows", () => {
    const rows = [makeRow()];
    expect(computeAlerts(rows)).toEqual([]);
  });

  it("fires critical alert for Non-Compliant status", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "non_compliant_agency_worker");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert when dbs_verified is false", () => {
    const rows = [makeRow({ dbs_verified: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "dbs_not_verified");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert when induction_completed is false", () => {
    const rows = [makeRow({ induction_completed: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "induction_not_completed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert when safeguarding_training_confirmed is false", () => {
    const rows = [makeRow({ safeguarding_training_confirmed: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "safeguarding_training_not_confirmed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert when supervision_arranged is false", () => {
    const rows = [makeRow({ supervision_arranged: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.find((a) => a.type === "supervision_not_arranged");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

// -- computeCaraInsights -------------------------------------------------------

describe("computeCaraInsights", () => {
  it("returns 3 insights for empty rows", () => {
    const insights = computeCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("includes reflect insight about non-compliant workers when present", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("[reflect]");
    expect(insights[2]).toContain("non-compliant");
  });

  it("includes reflect insight about supervision when all compliant but supervision < 100%", () => {
    const rows = [makeRow({ supervision_arranged: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("[reflect]");
    expect(insights[2]).toContain("supervision");
  });
});
