import { describe, it, expect } from "vitest";
import {
  computeNvqMetrics,
  computeNvqAlerts,
} from "./staff-nvq-qualification-tracking-service";
import type { StaffNvqQualificationTrackingRow } from "./staff-nvq-qualification-tracking-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StaffNvqQualificationTrackingRow> = {}): StaffNvqQualificationTrackingRow {
  return {
    id: "row-1",
    home_id: "home-1",
    staff_name: "Alice Smith",
    staff_id: null,
    review_date: "2026-04-01",
    qualification_level: "level_3",
    qualification_status: "completed",
    qualification_type: "diploma_residential_childcare",
    registration_status: "registered",
    start_date: "2024-06-01",
    expected_completion_date: "2026-06-01",
    actual_completion_date: "2026-03-01",
    reg32_compliant: true,
    within_two_year_deadline: true,
    assessor_assigned: true,
    portfolio_progressing: true,
    employer_funded: true,
    study_time_allocated: true,
    mentor_assigned: true,
    registration_current: true,
    training_provider: "Provider X",
    assessor_name: "Assessor Y",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeNvqMetrics --------------------------------------------------------

describe("computeNvqMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeNvqMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.in_progress_count).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.reg32_compliant_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts qualification statuses correctly", () => {
    const rows = [
      makeRow({ id: "1", qualification_status: "completed" }),
      makeRow({ id: "2", qualification_status: "in_progress" }),
      makeRow({ id: "3", qualification_status: "not_started" }),
      makeRow({ id: "4", qualification_status: "expired" }),
      makeRow({ id: "5", qualification_status: "enrolled" }),
    ];
    const m = computeNvqMetrics(rows);
    expect(m.total_records).toBe(5);
    expect(m.completed_count).toBe(1);
    expect(m.in_progress_count).toBe(1);
    expect(m.not_started_count).toBe(1);
    expect(m.expired_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", reg32_compliant: true, assessor_assigned: true }),
      makeRow({ id: "2", reg32_compliant: false, assessor_assigned: false }),
    ];
    const m = computeNvqMetrics(rows);
    expect(m.reg32_compliant_rate).toBe(50);
    expect(m.assessor_assigned_rate).toBe(50);
  });

  it("counts unique staff", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Alice" }),
      makeRow({ id: "2", staff_name: "Bob" }),
      makeRow({ id: "3", staff_name: "Alice" }),
    ];
    const m = computeNvqMetrics(rows);
    expect(m.unique_staff).toBe(2);
  });

  it("builds level and status breakdowns", () => {
    const rows = [
      makeRow({ id: "1", qualification_level: "level_3", qualification_status: "completed" }),
      makeRow({ id: "2", qualification_level: "level_3", qualification_status: "in_progress" }),
      makeRow({ id: "3", qualification_level: "level_5", qualification_status: "completed" }),
    ];
    const m = computeNvqMetrics(rows);
    expect(m.level_breakdown).toEqual({ level_3: 2, level_5: 1 });
    expect(m.status_breakdown).toEqual({ completed: 2, in_progress: 1 });
  });

  it("returns 100% rates when all booleans true", () => {
    const rows = [makeRow({ id: "1" }), makeRow({ id: "2" })];
    const m = computeNvqMetrics(rows);
    expect(m.within_deadline_rate).toBe(100);
    expect(m.portfolio_rate).toBe(100);
    expect(m.employer_funded_rate).toBe(100);
    expect(m.study_time_rate).toBe(100);
    expect(m.mentor_rate).toBe(100);
    expect(m.registration_current_rate).toBe(100);
  });
});

// -- computeNvqAlerts ---------------------------------------------------------

describe("computeNvqAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(computeNvqAlerts([])).toEqual([]);
  });

  it("returns no alerts for compliant completed records", () => {
    const alerts = computeNvqAlerts([makeRow()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical when not reg32 compliant and not in progress/enrolled", () => {
    const rows = [
      makeRow({ id: "r1", reg32_compliant: false, qualification_status: "not_started", staff_name: "Alice" }),
    ];
    const alerts = computeNvqAlerts(rows);
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].type).toBe("reg32_non_compliant_not_progressing");
  });

  it("does NOT fire critical when not reg32 compliant but in_progress", () => {
    const rows = [
      makeRow({ id: "r1", reg32_compliant: false, qualification_status: "in_progress" }),
    ];
    const alerts = computeNvqAlerts(rows);
    expect(alerts.filter((a) => a.type === "reg32_non_compliant_not_progressing").length).toBe(0);
  });

  it("fires high for overdue completion (past expected date, not completed)", () => {
    const rows = [
      makeRow({
        id: "r1",
        expected_completion_date: "2020-01-01",
        actual_completion_date: null,
        qualification_status: "in_progress",
        staff_name: "Bob",
      }),
    ];
    const alerts = computeNvqAlerts(rows);
    const match = alerts.filter((a) => a.type === "overdue_completion");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires high for not_started outside two year deadline", () => {
    const rows = [
      makeRow({ id: "r1", qualification_status: "not_started", within_two_year_deadline: false }),
    ];
    const alerts = computeNvqAlerts(rows);
    const match = alerts.filter((a) => a.type === "not_started_deadline_risk");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires medium for in_progress without assessor", () => {
    const rows = [
      makeRow({ id: "r1", qualification_status: "in_progress", assessor_assigned: false }),
    ];
    const alerts = computeNvqAlerts(rows);
    const match = alerts.filter((a) => a.type === "no_assessor_in_progress");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("fires medium for completed but registration not current", () => {
    const rows = [
      makeRow({ id: "r1", qualification_status: "completed", registration_current: false }),
    ];
    const alerts = computeNvqAlerts(rows);
    const match = alerts.filter((a) => a.type === "registration_lapsed_completed");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });
});
