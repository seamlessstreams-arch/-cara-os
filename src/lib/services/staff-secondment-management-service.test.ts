import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
} from "./staff-secondment-management-service";
import type { StaffSecondmentManagementRow } from "./staff-secondment-management-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StaffSecondmentManagementRow> = {}): StaffSecondmentManagementRow {
  return {
    id: "sec-1",
    home_id: "home-1",
    staff_name: "Claire Brown",
    secondment_type: "Incoming",
    sending_organisation: "Org A",
    receiving_organisation: "Org B",
    start_date: "2026-01-10",
    end_date: "2026-06-10",
    status: "Active",
    agreement_signed: true,
    dbs_transferred: true,
    induction_completed: true,
    supervision_arranged: true,
    objectives_agreed: true,
    review_date: "2026-04-10",
    extension_requested: false,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics (secondment)", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_secondments).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.agreement_rate).toBeNull();;
    expect(m.dbs_transfer_rate).toBeNull();;
    expect(m.induction_rate).toBeNull();;
    expect(m.supervision_rate).toBeNull();;
    expect(m.objectives_rate).toBeNull();;
    expect(m.review_scheduled_rate).toBeNull();;
    expect(m.extension_count).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("counts statuses correctly", () => {
    const rows = [
      makeRow({ id: "1", status: "Active" }),
      makeRow({ id: "2", status: "Completed" }),
      makeRow({ id: "3", status: "Pending" }),
      makeRow({ id: "4", status: "Active" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_secondments).toBe(4);
    expect(m.active_count).toBe(2);
    expect(m.completed_count).toBe(1);
    expect(m.pending_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", agreement_signed: true, dbs_transferred: false, induction_completed: true }),
      makeRow({ id: "2", agreement_signed: false, dbs_transferred: false, induction_completed: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.agreement_rate).toBe(50);
    expect(m.dbs_transfer_rate).toBe(0);
    expect(m.induction_rate).toBe(50);
  });

  it("computes review_scheduled_rate from non-null review_date", () => {
    const rows = [
      makeRow({ id: "1", review_date: "2026-04-10" }),
      makeRow({ id: "2", review_date: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.review_scheduled_rate).toBe(50);
  });

  it("counts extensions requested", () => {
    const rows = [
      makeRow({ id: "1", extension_requested: true }),
      makeRow({ id: "2", extension_requested: false }),
      makeRow({ id: "3", extension_requested: true }),
    ];
    const m = computeMetrics(rows);
    expect(m.extension_count).toBe(2);
  });

  it("counts unique staff", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Claire" }),
      makeRow({ id: "2", staff_name: "Dan" }),
      makeRow({ id: "3", staff_name: "Claire" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(2);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts (secondment)", () => {
  it("returns empty array for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for active secondment without agreement", () => {
    const rows = [makeRow({ status: "Active", agreement_signed: false })];
    const alerts = computeAlerts(rows);
    const critical = alerts.filter((a) => a.type === "active_without_agreement");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("fires critical alert for active secondment without DBS transferred", () => {
    const rows = [makeRow({ status: "Active", dbs_transferred: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "active_without_dbs" && a.severity === "critical")).toBe(true);
  });

  it("does NOT fire alerts for non-active secondments missing agreement/DBS", () => {
    const rows = [makeRow({ status: "Completed", agreement_signed: false, dbs_transferred: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "active_without_agreement")).toHaveLength(0);
    expect(alerts.filter((a) => a.type === "active_without_dbs")).toHaveLength(0);
  });

  it("fires high alert for active secondment without induction", () => {
    const rows = [makeRow({ status: "Active", induction_completed: false })];
    const alerts = computeAlerts(rows);
    const high = alerts.filter((a) => a.type === "active_without_induction");
    expect(high).toHaveLength(1);
    expect(high[0].severity).toBe("high");
  });

  it("fires medium alert for active secondment without supervision", () => {
    const rows = [makeRow({ status: "Active", supervision_arranged: false })];
    const alerts = computeAlerts(rows);
    const medium = alerts.filter((a) => a.type === "active_without_supervision");
    expect(medium).toHaveLength(1);
    expect(medium[0].severity).toBe("medium");
  });

  it("returns no alerts for fully compliant active secondment", () => {
    const rows = [makeRow()];
    const alerts = computeAlerts(rows);
    expect(alerts).toHaveLength(0);
  });
});
