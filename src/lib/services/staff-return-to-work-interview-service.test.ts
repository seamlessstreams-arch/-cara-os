import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
} from "./staff-return-to-work-interview-service";
import type { StaffReturnToWorkInterviewRow } from "./staff-return-to-work-interview-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StaffReturnToWorkInterviewRow> = {}): StaffReturnToWorkInterviewRow {
  return {
    id: "rtw-1",
    home_id: "home-1",
    staff_name: "Jane Doe",
    interview_date: "2026-04-15",
    absence_type: "short_term",
    absence_duration_days: 5,
    interviewer_name: "Manager A",
    fit_to_return: true,
    phased_return: false,
    adjustments_required: false,
    adjustment_details: null,
    occupational_health_referral: false,
    support_plan_agreed: true,
    trigger_level_reached: false,
    trigger_level: null,
    welfare_check_completed: true,
    follow_up_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics (return-to-work)", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_interviews).toBe(0);
    expect(m.not_fit_count).toBe(0);
    expect(m.phased_return_count).toBe(0);
    expect(m.adjustments_count).toBe(0);
    expect(m.oh_referral_count).toBe(0);
    expect(m.trigger_level_count).toBe(0);
    expect(m.support_plan_rate).toBeNull();;
    expect(m.welfare_check_rate).toBeNull();;
    expect(m.follow_up_rate).toBeNull();;
    expect(m.avg_absence_days).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts boolean fields correctly", () => {
    const rows = [
      makeRow({ id: "1", fit_to_return: false, phased_return: true, adjustments_required: true, occupational_health_referral: true, trigger_level_reached: true }),
      makeRow({ id: "2", fit_to_return: true, phased_return: false, adjustments_required: false, occupational_health_referral: false, trigger_level_reached: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.not_fit_count).toBe(1);
    expect(m.phased_return_count).toBe(1);
    expect(m.adjustments_count).toBe(1);
    expect(m.oh_referral_count).toBe(1);
    expect(m.trigger_level_count).toBe(1);
  });

  it("computes rates correctly", () => {
    const rows = [
      makeRow({ id: "1", support_plan_agreed: true, welfare_check_completed: true, follow_up_date: "2026-05-01" }),
      makeRow({ id: "2", support_plan_agreed: false, welfare_check_completed: false, follow_up_date: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.support_plan_rate).toBe(50);
    expect(m.welfare_check_rate).toBe(50);
    expect(m.follow_up_rate).toBe(50);
  });

  it("computes average absence days", () => {
    const rows = [
      makeRow({ id: "1", absence_duration_days: 10 }),
      makeRow({ id: "2", absence_duration_days: 20 }),
    ];
    const m = computeMetrics(rows);
    expect(m.avg_absence_days).toBe(15);
  });

  it("builds absence_type_breakdown", () => {
    const rows = [
      makeRow({ id: "1", absence_type: "long_term" }),
      makeRow({ id: "2", absence_type: "long_term" }),
      makeRow({ id: "3", absence_type: "mental_health" }),
    ];
    const m = computeMetrics(rows);
    expect(m.absence_type_breakdown).toEqual({ long_term: 2, mental_health: 1 });
  });

  it("counts unique staff", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Jane" }),
      makeRow({ id: "2", staff_name: "John" }),
      makeRow({ id: "3", staff_name: "Jane" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(2);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts (return-to-work)", () => {
  it("returns empty array for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for not fit without adjustments", () => {
    const rows = [makeRow({ fit_to_return: false, adjustments_required: false })];
    const alerts = computeAlerts(rows);
    const critical = alerts.filter((a) => a.type === "not_fit_no_adjustments");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("does NOT fire critical alert when adjustments are required", () => {
    const rows = [makeRow({ fit_to_return: false, adjustments_required: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "not_fit_no_adjustments")).toHaveLength(0);
  });

  it("fires high alert for Stage 3 trigger level", () => {
    const rows = [makeRow({ trigger_level_reached: true, trigger_level: "Stage 3" })];
    const alerts = computeAlerts(rows);
    const high = alerts.filter((a) => a.type === "high_trigger_level");
    expect(high).toHaveLength(1);
    expect(high[0].severity).toBe("high");
  });

  it("fires high alert for Formal Review trigger level", () => {
    const rows = [makeRow({ trigger_level_reached: true, trigger_level: "Formal Review" })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "high_trigger_level")).toHaveLength(1);
  });

  it("fires high alert for long absence >28 days without OH referral", () => {
    const rows = [makeRow({ absence_duration_days: 30, occupational_health_referral: false })];
    const alerts = computeAlerts(rows);
    const high = alerts.filter((a) => a.type === "long_absence_no_oh_referral");
    expect(high).toHaveLength(1);
    expect(high[0].severity).toBe("high");
  });

  it("does NOT fire long absence alert at exactly 28 days", () => {
    const rows = [makeRow({ absence_duration_days: 28, occupational_health_referral: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "long_absence_no_oh_referral")).toHaveLength(0);
  });

  it("fires medium alert for phased return without support plan", () => {
    const rows = [makeRow({ phased_return: true, support_plan_agreed: false })];
    const alerts = computeAlerts(rows);
    const medium = alerts.filter((a) => a.type === "phased_return_no_support_plan");
    expect(medium).toHaveLength(1);
    expect(medium[0].severity).toBe("medium");
  });
});
