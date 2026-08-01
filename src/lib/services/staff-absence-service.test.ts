import { describe, it, expect } from "vitest";
import {
  computeAbsenceMetrics,
  identifyAbsenceAlerts,
  type StaffAbsence,
} from "./staff-absence-service";

function makeAbsence(
  overrides: Partial<StaffAbsence> = {},
): StaffAbsence {
  return {
    id: overrides.id ?? "abs-1",
    home_id: "home-1",
    staff_name: "Alice",
    staff_role: "RSW",
    absence_type: "annual_leave",
    sickness_reason: null,
    start_date: "2025-06-01",
    end_date: "2025-06-05",
    days_lost: 5,
    status: "returned",
    covered_by: null,
    agency_cover_used: false,
    return_to_work_status: "not_required",
    return_to_work_date: null,
    return_to_work_notes: null,
    occupational_health_referral: false,
    impact_on_children: null,
    fit_note_received: false,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

// ── Metrics ──────────────────────────────────────────────────────────────

describe("computeAbsenceMetrics", () => {
  const now = new Date("2025-06-15T12:00:00Z");

  it("returns zeroes for empty array", () => {
    const m = computeAbsenceMetrics([], 10, now);
    expect(m.total_absences).toBe(0);
    expect(m.current_absences).toBe(0);
    expect(m.sickness_absences).toBe(0);
    expect(m.total_days_lost).toBe(0);
    expect(m.avg_days_per_absence).toBeNull();;
    expect(m.absence_rate).toBe(0);
    expect(m.agency_cover_count).toBe(0);
    expect(m.return_to_work_pending).toBe(0);
    expect(m.return_to_work_overdue).toBe(0);
    expect(m.unauthorised_absences).toBe(0);
    expect(m.long_term_sickness).toBe(0);
    expect(m.stress_related).toBe(0);
  });

  it("counts sickness absences correctly", () => {
    const absences = [
      makeAbsence({ absence_type: "sickness_short_term" }),
      makeAbsence({ absence_type: "sickness_long_term" }),
      makeAbsence({ absence_type: "annual_leave" }),
    ];
    const m = computeAbsenceMetrics(absences, 10, now);
    expect(m.sickness_absences).toBe(2);
  });

  it("computes total days lost and average", () => {
    const absences = [
      makeAbsence({ days_lost: 3 }),
      makeAbsence({ days_lost: 7 }),
    ];
    const m = computeAbsenceMetrics(absences, 10, now);
    expect(m.total_days_lost).toBe(10);
    expect(m.avg_days_per_absence).toBe(5);
  });

  it("excludes cancelled absences from avg calculation", () => {
    const absences = [
      makeAbsence({ days_lost: 10, status: "returned" }),
      makeAbsence({ days_lost: 0, status: "cancelled" }),
    ];
    const m = computeAbsenceMetrics(absences, 10, now);
    // active = 1 (returned), total days = 10
    expect(m.avg_days_per_absence).toBe(10);
  });

  it("counts stress-related absences", () => {
    const absences = [
      makeAbsence({ sickness_reason: "stress_anxiety" }),
      makeAbsence({ sickness_reason: "mental_health" }),
      makeAbsence({ sickness_reason: "cold_flu" }),
    ];
    const m = computeAbsenceMetrics(absences, 10, now);
    expect(m.stress_related).toBe(2);
  });

  it("counts agency cover and RTW statuses", () => {
    const absences = [
      makeAbsence({ agency_cover_used: true, return_to_work_status: "pending" }),
      makeAbsence({ agency_cover_used: true, return_to_work_status: "overdue" }),
      makeAbsence({ agency_cover_used: false, return_to_work_status: "completed" }),
    ];
    const m = computeAbsenceMetrics(absences, 10, now);
    expect(m.agency_cover_count).toBe(2);
    expect(m.return_to_work_pending).toBe(1);
    expect(m.return_to_work_overdue).toBe(1);
  });

  it("builds by_staff breakdown tracking days lost", () => {
    const absences = [
      makeAbsence({ staff_name: "Alice", days_lost: 3 }),
      makeAbsence({ staff_name: "Alice", days_lost: 5 }),
      makeAbsence({ staff_name: "Bob", days_lost: 2 }),
    ];
    const m = computeAbsenceMetrics(absences, 10, now);
    expect(m.by_staff["Alice"]).toBe(8);
    expect(m.by_staff["Bob"]).toBe(2);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────

describe("identifyAbsenceAlerts", () => {
  const now = new Date("2025-06-15T12:00:00Z");

  it("returns no alerts for empty array", () => {
    expect(identifyAbsenceAlerts([], 10, now)).toEqual([]);
  });

  it("fires high alert for unauthorised current absence", () => {
    const abs = makeAbsence({
      absence_type: "unauthorised",
      status: "current",
    });
    const alerts = identifyAbsenceAlerts([abs], 10, now);
    expect(alerts.some((a) => a.type === "unauthorised_absence" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire unauthorised alert if status is returned", () => {
    const abs = makeAbsence({
      absence_type: "unauthorised",
      status: "returned",
    });
    const alerts = identifyAbsenceAlerts([abs], 10, now);
    expect(alerts.some((a) => a.type === "unauthorised_absence")).toBe(false);
  });

  it("fires medium alert for RTW overdue", () => {
    const abs = makeAbsence({ return_to_work_status: "overdue" });
    const alerts = identifyAbsenceAlerts([abs], 10, now);
    expect(alerts.some((a) => a.type === "rtw_overdue" && a.severity === "medium")).toBe(true);
  });

  it("fires high alert for long-term sickness without OH referral", () => {
    const abs = makeAbsence({
      absence_type: "sickness_long_term",
      occupational_health_referral: false,
      status: "current",
    });
    const alerts = identifyAbsenceAlerts([abs], 10, now);
    expect(alerts.some((a) => a.type === "no_oh_referral" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for no fit note when > 7 days sick", () => {
    const abs = makeAbsence({
      absence_type: "sickness_short_term",
      status: "current",
      fit_note_received: false,
      days_lost: 8,
    });
    const alerts = identifyAbsenceAlerts([abs], 10, now);
    expect(alerts.some((a) => a.type === "no_fit_note" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire no_fit_note when days <= 7", () => {
    const abs = makeAbsence({
      absence_type: "sickness_short_term",
      status: "current",
      fit_note_received: false,
      days_lost: 7,
    });
    const alerts = identifyAbsenceAlerts([abs], 10, now);
    expect(alerts.some((a) => a.type === "no_fit_note")).toBe(false);
  });

  it("fires critical for high absence rate (>= 25% of staff)", () => {
    // 4 staff, 1 currently absent = 25% => triggers
    const abs = makeAbsence({ status: "current" });
    const alerts = identifyAbsenceAlerts([abs], 4, now);
    expect(alerts.some((a) => a.type === "high_absence_rate" && a.severity === "critical")).toBe(true);
  });

  it("does NOT fire high_absence_rate when below 25%", () => {
    // 5 staff, 1 currently absent = 20% => does NOT trigger
    const abs = makeAbsence({ status: "current" });
    const alerts = identifyAbsenceAlerts([abs], 5, now);
    expect(alerts.some((a) => a.type === "high_absence_rate")).toBe(false);
  });
});
