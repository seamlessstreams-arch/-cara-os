import { describe, it, expect } from "vitest";
import {
  computeSicknessMetrics,
  computeSicknessAlerts,
} from "./staff-sickness-management-service";
import type { StaffSicknessManagementRow } from "./staff-sickness-management-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StaffSicknessManagementRow> = {}): StaffSicknessManagementRow {
  return {
    id: "sick-1",
    home_id: "home-1",
    staff_name: "Emma Wilson",
    staff_id: "s-1",
    absence_start_date: "2026-03-01",
    absence_end_date: "2026-03-05",
    absence_type: "short_term",
    management_status: "resolved",
    trigger_level: "none",
    fit_note_status: "not_required",
    days_absent: 5,
    return_to_work_completed: true,
    occupational_health_referred: false,
    reasonable_adjustments_made: false,
    phased_return_agreed: false,
    manager_informed: true,
    cover_arranged: true,
    impact_on_children_assessed: true,
    wellbeing_check_completed: true,
    managing_officer: null,
    absence_reason_detail: null,
    notes: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeSicknessMetrics ---------------------------------------------------

describe("computeSicknessMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeSicknessMetrics([]);
    expect(m.total_absences).toBe(0);
    expect(m.long_term_count).toBe(0);
    expect(m.mental_health_count).toBe(0);
    expect(m.work_related_count).toBe(0);
    expect(m.ongoing_count).toBe(0);
    expect(m.return_to_work_rate).toBeNull();;
    expect(m.total_days_absent).toBe(0);
    expect(m.average_days_absent).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts absence types correctly", () => {
    const rows = [
      makeRow({ id: "1", absence_type: "long_term" }),
      makeRow({ id: "2", absence_type: "mental_health" }),
      makeRow({ id: "3", absence_type: "work_related" }),
      makeRow({ id: "4", absence_type: "short_term" }),
    ];
    const m = computeSicknessMetrics(rows);
    expect(m.long_term_count).toBe(1);
    expect(m.mental_health_count).toBe(1);
    expect(m.work_related_count).toBe(1);
  });

  it("counts ongoing management status", () => {
    const rows = [
      makeRow({ id: "1", management_status: "ongoing" }),
      makeRow({ id: "2", management_status: "resolved" }),
    ];
    const m = computeSicknessMetrics(rows);
    expect(m.ongoing_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", return_to_work_completed: true, manager_informed: true, cover_arranged: false }),
      makeRow({ id: "2", return_to_work_completed: false, manager_informed: false, cover_arranged: false }),
    ];
    const m = computeSicknessMetrics(rows);
    expect(m.return_to_work_rate).toBe(50);
    expect(m.manager_informed_rate).toBe(50);
    expect(m.cover_arranged_rate).toBe(0);
  });

  it("computes total and average days absent", () => {
    const rows = [
      makeRow({ id: "1", days_absent: 10 }),
      makeRow({ id: "2", days_absent: 30 }),
    ];
    const m = computeSicknessMetrics(rows);
    expect(m.total_days_absent).toBe(40);
    expect(m.average_days_absent).toBe(20);
  });

  it("builds absence_type_breakdown and trigger_breakdown", () => {
    const rows = [
      makeRow({ id: "1", absence_type: "mental_health", trigger_level: "stage_1" }),
      makeRow({ id: "2", absence_type: "mental_health", trigger_level: "stage_2" }),
      makeRow({ id: "3", absence_type: "short_term", trigger_level: "stage_1" }),
    ];
    const m = computeSicknessMetrics(rows);
    expect(m.absence_type_breakdown).toEqual({ mental_health: 2, short_term: 1 });
    expect(m.trigger_breakdown).toEqual({ stage_1: 2, stage_2: 1 });
  });

  it("counts unique staff", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Emma" }),
      makeRow({ id: "2", staff_name: "Frank" }),
      makeRow({ id: "3", staff_name: "Emma" }),
    ];
    const m = computeSicknessMetrics(rows);
    expect(m.unique_staff).toBe(2);
  });
});

// -- computeSicknessAlerts ----------------------------------------------------

describe("computeSicknessAlerts", () => {
  it("returns empty array for empty rows", () => {
    expect(computeSicknessAlerts([])).toEqual([]);
  });

  it("fires critical alert for stage_3 trigger without formal review", () => {
    const rows = [makeRow({ trigger_level: "stage_3", management_status: "ongoing" })];
    const alerts = computeSicknessAlerts(rows);
    const critical = alerts.filter((a) => a.type === "high_trigger_no_formal_review");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("fires critical alert for dismissal_consideration without formal review", () => {
    const rows = [makeRow({ trigger_level: "dismissal_consideration", management_status: "reported" })];
    const alerts = computeSicknessAlerts(rows);
    expect(alerts.some((a) => a.type === "high_trigger_no_formal_review")).toBe(true);
  });

  it("does NOT fire critical alert when management_status is formal_review", () => {
    const rows = [makeRow({ trigger_level: "stage_3", management_status: "formal_review" })];
    const alerts = computeSicknessAlerts(rows);
    expect(alerts.filter((a) => a.type === "high_trigger_no_formal_review")).toHaveLength(0);
  });

  it("fires high alert for long_term absence without OH referral", () => {
    const rows = [makeRow({ absence_type: "long_term", occupational_health_referred: false })];
    const alerts = computeSicknessAlerts(rows);
    expect(alerts.some((a) => a.type === "long_term_no_oh_referral" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for no cover and no impact assessment", () => {
    const rows = [makeRow({ cover_arranged: false, impact_on_children_assessed: false })];
    const alerts = computeSicknessAlerts(rows);
    expect(alerts.some((a) => a.type === "no_cover_no_impact_assessment" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for resolved without return to work", () => {
    const rows = [makeRow({ management_status: "resolved", return_to_work_completed: false })];
    const alerts = computeSicknessAlerts(rows);
    expect(alerts.some((a) => a.type === "resolved_no_rtw" && a.severity === "medium")).toBe(true);
  });

  it("fires medium alert for mental health absence without wellbeing check", () => {
    const rows = [makeRow({ absence_type: "mental_health", wellbeing_check_completed: false })];
    const alerts = computeSicknessAlerts(rows);
    expect(alerts.some((a) => a.type === "mental_health_no_wellbeing_check" && a.severity === "medium")).toBe(true);
  });
});
