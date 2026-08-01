import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
} from "./staff-mandatory-refresher-training-service";
import type { StaffMandatoryRefresherTrainingRow } from "./staff-mandatory-refresher-training-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<StaffMandatoryRefresherTrainingRow> = {}): StaffMandatoryRefresherTrainingRow {
  return {
    id: "mrt-1",
    home_id: "home-1",
    staff_name: "Staff A",
    training_type: "Safeguarding",
    completion_date: "2026-01-15",
    expiry_date: "2027-01-15",
    training_status: "Current",
    training_provider: "Training Co",
    certificate_held: true,
    assessed_competent: true,
    refresher_booked: true,
    refresher_date: "2026-12-01",
    training_hours: 8,
    delivery_method: "Classroom",
    notes: null,
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics (mandatory refresher training)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.current_count).toBe(0);
    expect(m.overdue_count).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.due_soon_count).toBe(0);
    expect(m.booked_count).toBe(0);
    expect(m.certificate_rate).toBeNull();;
    expect(m.avg_training_hours).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts training statuses correctly", () => {
    const rows = [
      makeRow({ id: "1", training_status: "Current" }),
      makeRow({ id: "2", training_status: "Overdue" }),
      makeRow({ id: "3", training_status: "Expired" }),
      makeRow({ id: "4", training_status: "Due Soon" }),
      makeRow({ id: "5", training_status: "Booked" }),
    ];
    const m = computeMetrics(rows);
    expect(m.current_count).toBe(1);
    expect(m.overdue_count).toBe(1);
    expect(m.expired_count).toBe(1);
    expect(m.due_soon_count).toBe(1);
    expect(m.booked_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", certificate_held: true, assessed_competent: true, refresher_booked: true }),
      makeRow({ id: "2", certificate_held: false, assessed_competent: false, refresher_booked: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.certificate_rate).toBe(50);
    expect(m.competency_rate).toBe(50);
    expect(m.refresher_booked_rate).toBe(50);
  });

  it("computes average training hours", () => {
    const rows = [
      makeRow({ id: "1", training_hours: 6 }),
      makeRow({ id: "2", training_hours: 10 }),
    ];
    const m = computeMetrics(rows);
    expect(m.avg_training_hours).toBe(8);
  });

  it("counts unique staff and builds training type breakdown", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Alice", training_type: "Safeguarding" }),
      makeRow({ id: "2", staff_name: "Bob", training_type: "First Aid" }),
      makeRow({ id: "3", staff_name: "Alice", training_type: "Safeguarding" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(2);
    expect(m.training_type_breakdown).toEqual({ Safeguarding: 2, "First Aid": 1 });
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts (mandatory refresher training)", () => {
  it("returns empty alerts for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns empty alerts when all records current and competent", () => {
    expect(computeAlerts([makeRow()])).toEqual([]);
  });

  it("fires critical alert for expired training", () => {
    const rows = [makeRow({ id: "mrt-x", training_status: "Expired", staff_name: "Tom" })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "expired_training");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
  });

  it("fires high alert for overdue training", () => {
    const rows = [makeRow({ id: "1", training_status: "Overdue" })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "overdue_training");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires medium alert for due soon without refresher booked", () => {
    const rows = [makeRow({ id: "1", training_status: "Due Soon", refresher_booked: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "due_soon_no_refresher");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("medium");
  });

  it("does not fire due_soon alert when refresher is already booked", () => {
    const rows = [makeRow({ id: "1", training_status: "Due Soon", refresher_booked: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "due_soon_no_refresher")).toHaveLength(0);
  });

  it("fires medium alert for not assessed competent", () => {
    const rows = [makeRow({ id: "1", assessed_competent: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "not_assessed_competent");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("medium");
  });

  it("generates multiple alerts for the same record if applicable", () => {
    const rows = [makeRow({ id: "1", training_status: "Expired", assessed_competent: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "expired_training")).toHaveLength(1);
    expect(alerts.filter((a) => a.type === "not_assessed_competent")).toHaveLength(1);
  });
});
