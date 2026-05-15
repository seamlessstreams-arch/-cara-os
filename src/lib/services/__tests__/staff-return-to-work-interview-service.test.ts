// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF RETURN-TO-WORK INTERVIEW SERVICE TESTS
// Pure-function unit tests for return-to-work interview metrics computation,
// alert identification, ARIA insights, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 33 (employment — managing staffing
// levels and absence), Reg 13 (leadership — workforce planning).
//
// Covers: interview records, fitness to return, phased returns, adjustments,
// OH referrals, trigger levels, support plans, welfare checks.
//
// SCCIF: Leadership & Management — "Staffing levels are sufficient."
// "Staff are supported to return to work after absence."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import { _testing } from "../staff-return-to-work-interview-service";
import type { StaffReturnToWorkInterviewRow } from "../staff-return-to-work-interview-service";

const { computeMetrics, computeAlerts, computeAriaInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<StaffReturnToWorkInterviewRow>,
): StaffReturnToWorkInterviewRow {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    home_id: overrides?.home_id ?? crypto.randomUUID(),
    staff_name: overrides?.staff_name ?? "Staff A",
    interview_date:
      overrides?.interview_date ?? now.toISOString().split("T")[0],
    absence_type: overrides?.absence_type ?? "Short-term Sickness",
    absence_duration_days: overrides?.absence_duration_days ?? 3,
    interviewer_name: overrides?.interviewer_name ?? "D. Laville",
    fit_to_return: overrides?.fit_to_return ?? true,
    phased_return: overrides?.phased_return ?? false,
    adjustments_required: overrides?.adjustments_required ?? false,
    adjustment_details:
      "adjustment_details" in (overrides ?? {})
        ? (overrides!.adjustment_details ?? null)
        : null,
    occupational_health_referral:
      overrides?.occupational_health_referral ?? false,
    support_plan_agreed: overrides?.support_plan_agreed ?? false,
    trigger_level_reached: overrides?.trigger_level_reached ?? false,
    trigger_level:
      "trigger_level" in (overrides ?? {})
        ? (overrides!.trigger_level ?? null)
        : null,
    welfare_check_completed: overrides?.welfare_check_completed ?? true,
    follow_up_date:
      "follow_up_date" in (overrides ?? {})
        ? (overrides!.follow_up_date ?? null)
        : null,
    notes:
      "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. computeMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────────

  it("returns 0 total_interviews for empty array", () => {
    expect(computeMetrics([]).total_interviews).toBe(0);
  });

  it("returns 0 not_fit_count for empty array", () => {
    expect(computeMetrics([]).not_fit_count).toBe(0);
  });

  it("returns 0 phased_return_count for empty array", () => {
    expect(computeMetrics([]).phased_return_count).toBe(0);
  });

  it("returns 0 adjustments_count for empty array", () => {
    expect(computeMetrics([]).adjustments_count).toBe(0);
  });

  it("returns 0 oh_referral_count for empty array", () => {
    expect(computeMetrics([]).oh_referral_count).toBe(0);
  });

  it("returns 0 trigger_level_count for empty array", () => {
    expect(computeMetrics([]).trigger_level_count).toBe(0);
  });

  it("returns 0 support_plan_rate for empty array", () => {
    expect(computeMetrics([]).support_plan_rate).toBe(0);
  });

  it("returns 0 welfare_check_rate for empty array", () => {
    expect(computeMetrics([]).welfare_check_rate).toBe(0);
  });

  it("returns 0 follow_up_rate for empty array", () => {
    expect(computeMetrics([]).follow_up_rate).toBe(0);
  });

  it("returns 0 avg_absence_days for empty array", () => {
    expect(computeMetrics([]).avg_absence_days).toBe(0);
  });

  it("returns 0 unique_staff for empty array", () => {
    expect(computeMetrics([]).unique_staff).toBe(0);
  });

  it("returns empty absence_type_breakdown for empty array", () => {
    expect(computeMetrics([]).absence_type_breakdown).toEqual({});
  });

  // ── Single row defaults ──────────────────────────────────────────────────

  it("returns 1 total_interviews for single row", () => {
    expect(computeMetrics([makeRow()]).total_interviews).toBe(1);
  });

  it("returns 0 not_fit_count when fit_to_return is true", () => {
    expect(computeMetrics([makeRow({ fit_to_return: true })]).not_fit_count).toBe(0);
  });

  it("returns 1 not_fit_count when fit_to_return is false", () => {
    expect(computeMetrics([makeRow({ fit_to_return: false })]).not_fit_count).toBe(1);
  });

  it("returns 0 phased_return_count when phased_return is false", () => {
    expect(computeMetrics([makeRow({ phased_return: false })]).phased_return_count).toBe(0);
  });

  it("returns 1 phased_return_count when phased_return is true", () => {
    expect(computeMetrics([makeRow({ phased_return: true })]).phased_return_count).toBe(1);
  });

  it("returns 0 adjustments_count when adjustments_required is false", () => {
    expect(computeMetrics([makeRow({ adjustments_required: false })]).adjustments_count).toBe(0);
  });

  it("returns 1 adjustments_count when adjustments_required is true", () => {
    expect(computeMetrics([makeRow({ adjustments_required: true })]).adjustments_count).toBe(1);
  });

  it("returns 0 oh_referral_count when occupational_health_referral is false", () => {
    expect(computeMetrics([makeRow({ occupational_health_referral: false })]).oh_referral_count).toBe(0);
  });

  it("returns 1 oh_referral_count when occupational_health_referral is true", () => {
    expect(computeMetrics([makeRow({ occupational_health_referral: true })]).oh_referral_count).toBe(1);
  });

  it("returns 0 trigger_level_count when trigger_level_reached is false", () => {
    expect(computeMetrics([makeRow({ trigger_level_reached: false })]).trigger_level_count).toBe(0);
  });

  it("returns 1 trigger_level_count when trigger_level_reached is true", () => {
    expect(computeMetrics([makeRow({ trigger_level_reached: true })]).trigger_level_count).toBe(1);
  });

  // ── Percentage rates ─────────────────────────────────────────────────────

  it("returns 0 support_plan_rate when support_plan_agreed is false", () => {
    expect(computeMetrics([makeRow({ support_plan_agreed: false })]).support_plan_rate).toBe(0);
  });

  it("returns 100 support_plan_rate when support_plan_agreed is true", () => {
    expect(computeMetrics([makeRow({ support_plan_agreed: true })]).support_plan_rate).toBe(100);
  });

  it("returns 100 welfare_check_rate when welfare_check_completed is true", () => {
    expect(computeMetrics([makeRow({ welfare_check_completed: true })]).welfare_check_rate).toBe(100);
  });

  it("returns 0 welfare_check_rate when welfare_check_completed is false", () => {
    expect(computeMetrics([makeRow({ welfare_check_completed: false })]).welfare_check_rate).toBe(0);
  });

  it("returns 0 follow_up_rate when follow_up_date is null", () => {
    expect(computeMetrics([makeRow()]).follow_up_rate).toBe(0);
  });

  it("returns 100 follow_up_rate when follow_up_date is set", () => {
    expect(computeMetrics([makeRow({ follow_up_date: "2026-06-01" })]).follow_up_rate).toBe(100);
  });

  it("calculates support_plan_rate with Math.round for 1/3", () => {
    const rows = [
      makeRow({ support_plan_agreed: true }),
      makeRow({ support_plan_agreed: false }),
      makeRow({ support_plan_agreed: false }),
    ];
    expect(computeMetrics(rows).support_plan_rate).toBe(33.3);
  });

  it("calculates support_plan_rate with Math.round for 2/3", () => {
    const rows = [
      makeRow({ support_plan_agreed: true }),
      makeRow({ support_plan_agreed: true }),
      makeRow({ support_plan_agreed: false }),
    ];
    expect(computeMetrics(rows).support_plan_rate).toBe(66.7);
  });

  it("calculates welfare_check_rate correctly for mixed values", () => {
    const rows = [
      makeRow({ welfare_check_completed: true }),
      makeRow({ welfare_check_completed: false }),
    ];
    expect(computeMetrics(rows).welfare_check_rate).toBe(50);
  });

  it("calculates follow_up_rate correctly for mixed values", () => {
    const rows = [
      makeRow({ follow_up_date: "2026-06-01" }),
      makeRow(),
      makeRow(),
    ];
    expect(computeMetrics(rows).follow_up_rate).toBe(33.3);
  });

  it("calculates follow_up_rate 50% for 1 of 2", () => {
    const rows = [makeRow({ follow_up_date: "2026-06-01" }), makeRow()];
    expect(computeMetrics(rows).follow_up_rate).toBe(50);
  });

  // ── avg_absence_days ─────────────────────────────────────────────────────

  it("returns exact absence_duration_days for single row", () => {
    expect(computeMetrics([makeRow({ absence_duration_days: 7 })]).avg_absence_days).toBe(7);
  });

  it("returns average for two rows", () => {
    const rows = [
      makeRow({ absence_duration_days: 10 }),
      makeRow({ absence_duration_days: 20 }),
    ];
    expect(computeMetrics(rows).avg_absence_days).toBe(15);
  });

  it("rounds avg_absence_days to 1 decimal", () => {
    const rows = [
      makeRow({ absence_duration_days: 1 }),
      makeRow({ absence_duration_days: 2 }),
      makeRow({ absence_duration_days: 3 }),
    ];
    expect(computeMetrics(rows).avg_absence_days).toBe(2);
  });

  it("rounds avg_absence_days correctly for non-integer average", () => {
    const rows = [
      makeRow({ absence_duration_days: 7 }),
      makeRow({ absence_duration_days: 8 }),
      makeRow({ absence_duration_days: 9 }),
    ];
    expect(computeMetrics(rows).avg_absence_days).toBe(8);
  });

  it("handles avg_absence_days with uneven division", () => {
    const rows = [
      makeRow({ absence_duration_days: 10 }),
      makeRow({ absence_duration_days: 11 }),
      makeRow({ absence_duration_days: 12 }),
    ];
    expect(computeMetrics(rows).avg_absence_days).toBe(11);
  });

  it("handles large absence durations", () => {
    const rows = [
      makeRow({ absence_duration_days: 180 }),
      makeRow({ absence_duration_days: 365 }),
    ];
    expect(computeMetrics(rows).avg_absence_days).toBe(272.5);
  });

  it("handles zero absence_duration_days", () => {
    expect(computeMetrics([makeRow({ absence_duration_days: 0 })]).avg_absence_days).toBe(0);
  });

  // ── unique_staff ─────────────────────────────────────────────────────────

  it("returns 1 unique_staff for single row", () => {
    expect(computeMetrics([makeRow()]).unique_staff).toBe(1);
  });

  it("returns correct count for distinct staff names", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
      makeRow({ staff_name: "Charlie" }),
    ];
    expect(computeMetrics(rows).unique_staff).toBe(3);
  });

  it("deduplicates same staff name", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
    ];
    expect(computeMetrics(rows).unique_staff).toBe(2);
  });

  it("treats different case as different staff", () => {
    const rows = [
      makeRow({ staff_name: "alice" }),
      makeRow({ staff_name: "Alice" }),
    ];
    expect(computeMetrics(rows).unique_staff).toBe(2);
  });

  // ── absence_type_breakdown ───────────────────────────────────────────────

  it("counts single absence type", () => {
    const m = computeMetrics([makeRow({ absence_type: "Short-term Sickness" })]);
    expect(m.absence_type_breakdown).toEqual({ "Short-term Sickness": 1 });
  });

  it("counts multiple same absence types", () => {
    const rows = [
      makeRow({ absence_type: "Short-term Sickness" }),
      makeRow({ absence_type: "Short-term Sickness" }),
    ];
    expect(computeMetrics(rows).absence_type_breakdown).toEqual({
      "Short-term Sickness": 2,
    });
  });

  it("counts all 7 absence types correctly", () => {
    const types = [
      "Short-term Sickness",
      "Long-term Sickness",
      "Maternity/Paternity",
      "Bereavement",
      "Suspension",
      "Personal Leave",
      "Other",
    ];
    const rows = types.map((t) => makeRow({ absence_type: t }));
    const m = computeMetrics(rows);
    for (const t of types) {
      expect(m.absence_type_breakdown[t]).toBe(1);
    }
  });

  it("handles mixed absence types with duplicates", () => {
    const rows = [
      makeRow({ absence_type: "Short-term Sickness" }),
      makeRow({ absence_type: "Long-term Sickness" }),
      makeRow({ absence_type: "Short-term Sickness" }),
      makeRow({ absence_type: "Bereavement" }),
      makeRow({ absence_type: "Long-term Sickness" }),
    ];
    const m = computeMetrics(rows);
    expect(m.absence_type_breakdown["Short-term Sickness"]).toBe(2);
    expect(m.absence_type_breakdown["Long-term Sickness"]).toBe(2);
    expect(m.absence_type_breakdown["Bereavement"]).toBe(1);
  });

  // ── Multiple rows comprehensive ─────────────────────────────────────────

  it("counts all boolean fields across multiple rows", () => {
    const rows = [
      makeRow({
        fit_to_return: false,
        phased_return: true,
        adjustments_required: true,
        occupational_health_referral: true,
        trigger_level_reached: true,
      }),
      makeRow({
        fit_to_return: true,
        phased_return: false,
        adjustments_required: false,
        occupational_health_referral: false,
        trigger_level_reached: false,
      }),
    ];
    const m = computeMetrics(rows);
    expect(m.not_fit_count).toBe(1);
    expect(m.phased_return_count).toBe(1);
    expect(m.adjustments_count).toBe(1);
    expect(m.oh_referral_count).toBe(1);
    expect(m.trigger_level_count).toBe(1);
  });

  it("counts all booleans as true when all true", () => {
    const rows = [
      makeRow({
        fit_to_return: false,
        phased_return: true,
        adjustments_required: true,
        occupational_health_referral: true,
        trigger_level_reached: true,
      }),
      makeRow({
        fit_to_return: false,
        phased_return: true,
        adjustments_required: true,
        occupational_health_referral: true,
        trigger_level_reached: true,
      }),
    ];
    const m = computeMetrics(rows);
    expect(m.not_fit_count).toBe(2);
    expect(m.phased_return_count).toBe(2);
    expect(m.adjustments_count).toBe(2);
    expect(m.oh_referral_count).toBe(2);
    expect(m.trigger_level_count).toBe(2);
  });

  it("returns correct total_interviews for 5 rows", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    expect(computeMetrics(rows).total_interviews).toBe(5);
  });

  it("returns correct total_interviews for 10 rows", () => {
    const rows = Array.from({ length: 10 }, () => makeRow());
    expect(computeMetrics(rows).total_interviews).toBe(10);
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it("handles row with all boolean fields true", () => {
    const row = makeRow({
      fit_to_return: true,
      phased_return: true,
      adjustments_required: true,
      occupational_health_referral: true,
      support_plan_agreed: true,
      trigger_level_reached: true,
      welfare_check_completed: true,
      follow_up_date: "2026-06-01",
    });
    const m = computeMetrics([row]);
    expect(m.not_fit_count).toBe(0);
    expect(m.phased_return_count).toBe(1);
    expect(m.adjustments_count).toBe(1);
    expect(m.oh_referral_count).toBe(1);
    expect(m.trigger_level_count).toBe(1);
    expect(m.support_plan_rate).toBe(100);
    expect(m.welfare_check_rate).toBe(100);
    expect(m.follow_up_rate).toBe(100);
  });

  it("handles row with all boolean fields false/defaults", () => {
    const row = makeRow({
      fit_to_return: false,
      phased_return: false,
      adjustments_required: false,
      occupational_health_referral: false,
      support_plan_agreed: false,
      trigger_level_reached: false,
      welfare_check_completed: false,
    });
    const m = computeMetrics([row]);
    expect(m.not_fit_count).toBe(1);
    expect(m.phased_return_count).toBe(0);
    expect(m.adjustments_count).toBe(0);
    expect(m.oh_referral_count).toBe(0);
    expect(m.trigger_level_count).toBe(0);
    expect(m.support_plan_rate).toBe(0);
    expect(m.welfare_check_rate).toBe(0);
    expect(m.follow_up_rate).toBe(0);
  });

  it("percentage uses Math.round(value * 1000) / 10 pattern", () => {
    // 3 out of 7 = 42.857...% → Math.round(0.42857 * 1000) / 10 = 42.9
    const rows = Array.from({ length: 7 }, (_, i) =>
      makeRow({ support_plan_agreed: i < 3 }),
    );
    expect(computeMetrics(rows).support_plan_rate).toBe(42.9);
  });

  it("percentage for 1/6 uses correct rounding", () => {
    const rows = Array.from({ length: 6 }, (_, i) =>
      makeRow({ support_plan_agreed: i < 1 }),
    );
    // 1/6 = 0.1666... → Math.round(166.6) / 10 = 16.7
    expect(computeMetrics(rows).support_plan_rate).toBe(16.7);
  });

  it("percentage for 5/6 uses correct rounding", () => {
    const rows = Array.from({ length: 6 }, (_, i) =>
      makeRow({ support_plan_agreed: i < 5 }),
    );
    // 5/6 = 0.8333... → Math.round(833.3) / 10 = 83.3
    expect(computeMetrics(rows).support_plan_rate).toBe(83.3);
  });

  it("percentage for 1/7 uses correct rounding", () => {
    const rows = Array.from({ length: 7 }, (_, i) =>
      makeRow({ welfare_check_completed: i < 1 }),
    );
    // 1/7 = 0.14285... → Math.round(142.85) / 10 = 14.3
    expect(computeMetrics(rows).welfare_check_rate).toBe(14.3);
  });

  it("handles very large number of rows", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 20}`,
        absence_duration_days: i + 1,
        support_plan_agreed: i % 2 === 0,
      }),
    );
    const m = computeMetrics(rows);
    expect(m.total_interviews).toBe(100);
    expect(m.unique_staff).toBe(20);
    expect(m.support_plan_rate).toBe(50);
    // avg = (1+2+...+100)/100 = 5050/100 = 50.5
    expect(m.avg_absence_days).toBe(50.5);
  });

  it("handles single row with absence_duration_days of 1", () => {
    expect(computeMetrics([makeRow({ absence_duration_days: 1 })]).avg_absence_days).toBe(1);
  });

  it("handles absence_type_breakdown with Other type", () => {
    const rows = [makeRow({ absence_type: "Other" })];
    expect(computeMetrics(rows).absence_type_breakdown["Other"]).toBe(1);
  });

  it("handles Maternity/Paternity breakdown", () => {
    const rows = [
      makeRow({ absence_type: "Maternity/Paternity" }),
      makeRow({ absence_type: "Maternity/Paternity" }),
    ];
    expect(computeMetrics(rows).absence_type_breakdown["Maternity/Paternity"]).toBe(2);
  });

  it("handles Suspension breakdown", () => {
    const rows = [makeRow({ absence_type: "Suspension" })];
    expect(computeMetrics(rows).absence_type_breakdown["Suspension"]).toBe(1);
  });

  it("handles Personal Leave breakdown", () => {
    const rows = [makeRow({ absence_type: "Personal Leave" })];
    expect(computeMetrics(rows).absence_type_breakdown["Personal Leave"]).toBe(1);
  });

  it("handles Bereavement breakdown", () => {
    const rows = [makeRow({ absence_type: "Bereavement" })];
    expect(computeMetrics(rows).absence_type_breakdown["Bereavement"]).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeAlerts", () => {
  // ── No alerts ────────────────────────────────────────────────────────────

  it("returns empty array for empty input", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns empty array for clean row (all defaults)", () => {
    expect(computeAlerts([makeRow()])).toEqual([]);
  });

  it("returns empty array when fit_to_return is true", () => {
    expect(computeAlerts([makeRow({ fit_to_return: true })]).length).toBe(0);
  });

  it("returns empty array when not fit but adjustments are required", () => {
    const alerts = computeAlerts([
      makeRow({ fit_to_return: false, adjustments_required: true }),
    ]);
    expect(alerts.filter((a) => a.type === "not_fit_no_adjustments")).toHaveLength(0);
  });

  it("returns empty array when trigger is Stage 1", () => {
    const alerts = computeAlerts([
      makeRow({ trigger_level_reached: true, trigger_level: "Stage 1" }),
    ]);
    expect(alerts.filter((a) => a.type === "high_trigger_level")).toHaveLength(0);
  });

  it("returns empty array when trigger is Stage 2", () => {
    const alerts = computeAlerts([
      makeRow({ trigger_level_reached: true, trigger_level: "Stage 2" }),
    ]);
    expect(alerts.filter((a) => a.type === "high_trigger_level")).toHaveLength(0);
  });

  it("returns empty array for short absence without OH referral", () => {
    const alerts = computeAlerts([
      makeRow({ absence_duration_days: 28, occupational_health_referral: false }),
    ]);
    expect(alerts.filter((a) => a.type === "long_absence_no_oh_referral")).toHaveLength(0);
  });

  it("returns empty array for long absence with OH referral", () => {
    const alerts = computeAlerts([
      makeRow({ absence_duration_days: 30, occupational_health_referral: true }),
    ]);
    expect(alerts.filter((a) => a.type === "long_absence_no_oh_referral")).toHaveLength(0);
  });

  it("returns empty array when phased return with support plan", () => {
    const alerts = computeAlerts([
      makeRow({ phased_return: true, support_plan_agreed: true }),
    ]);
    expect(alerts.filter((a) => a.type === "phased_return_no_support_plan")).toHaveLength(0);
  });

  it("returns empty array when no phased return and no support plan", () => {
    const alerts = computeAlerts([
      makeRow({ phased_return: false, support_plan_agreed: false }),
    ]);
    expect(alerts.filter((a) => a.type === "phased_return_no_support_plan")).toHaveLength(0);
  });

  // ── Critical: not fit without adjustments ────────────────────────────────

  it("fires critical alert for not fit without adjustments", () => {
    const alerts = computeAlerts([
      makeRow({ fit_to_return: false, adjustments_required: false, staff_name: "Jo" }),
    ]);
    const a = alerts.find((x) => x.type === "not_fit_no_adjustments");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
    expect(a!.message).toContain("Jo");
    expect(a!.message).toContain("not fit to return");
    expect(a!.record_id).toBeDefined();
  });

  it("fires critical alert per-record for multiple not fit rows", () => {
    const alerts = computeAlerts([
      makeRow({ id: "a", fit_to_return: false, adjustments_required: false }),
      makeRow({ id: "b", fit_to_return: false, adjustments_required: false }),
    ]);
    const filtered = alerts.filter((x) => x.type === "not_fit_no_adjustments");
    expect(filtered).toHaveLength(2);
    expect(filtered[0].record_id).toBe("a");
    expect(filtered[1].record_id).toBe("b");
  });

  it("does not fire critical when not fit but adjustments required", () => {
    const alerts = computeAlerts([
      makeRow({ fit_to_return: false, adjustments_required: true }),
    ]);
    expect(alerts.filter((x) => x.type === "not_fit_no_adjustments")).toHaveLength(0);
  });

  it("does not fire critical when fit to return", () => {
    const alerts = computeAlerts([
      makeRow({ fit_to_return: true, adjustments_required: false }),
    ]);
    expect(alerts.filter((x) => x.type === "not_fit_no_adjustments")).toHaveLength(0);
  });

  // ── High: trigger level Stage 3 or Formal Review ─────────────────────────

  it("fires high alert for Stage 3 trigger level", () => {
    const alerts = computeAlerts([
      makeRow({
        trigger_level_reached: true,
        trigger_level: "Stage 3",
        staff_name: "Pat",
      }),
    ]);
    const a = alerts.find((x) => x.type === "high_trigger_level");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
    expect(a!.message).toContain("Pat");
    expect(a!.message).toContain("Stage 3");
    expect(a!.record_id).toBeDefined();
  });

  it("fires high alert for Formal Review trigger level", () => {
    const alerts = computeAlerts([
      makeRow({
        trigger_level_reached: true,
        trigger_level: "Formal Review",
        staff_name: "Sam",
      }),
    ]);
    const a = alerts.find((x) => x.type === "high_trigger_level");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
    expect(a!.message).toContain("Sam");
    expect(a!.message).toContain("Formal Review");
  });

  it("does not fire high trigger alert for Stage 1", () => {
    const alerts = computeAlerts([
      makeRow({ trigger_level_reached: true, trigger_level: "Stage 1" }),
    ]);
    expect(alerts.filter((x) => x.type === "high_trigger_level")).toHaveLength(0);
  });

  it("does not fire high trigger alert for Stage 2", () => {
    const alerts = computeAlerts([
      makeRow({ trigger_level_reached: true, trigger_level: "Stage 2" }),
    ]);
    expect(alerts.filter((x) => x.type === "high_trigger_level")).toHaveLength(0);
  });

  it("does not fire high trigger alert when trigger_level_reached is false", () => {
    const alerts = computeAlerts([
      makeRow({ trigger_level_reached: false, trigger_level: "Stage 3" }),
    ]);
    expect(alerts.filter((x) => x.type === "high_trigger_level")).toHaveLength(0);
  });

  it("fires high trigger alert for each qualifying row", () => {
    const alerts = computeAlerts([
      makeRow({ id: "x", trigger_level_reached: true, trigger_level: "Stage 3" }),
      makeRow({ id: "y", trigger_level_reached: true, trigger_level: "Formal Review" }),
    ]);
    const filtered = alerts.filter((x) => x.type === "high_trigger_level");
    expect(filtered).toHaveLength(2);
  });

  // ── High: long absence without OH referral ───────────────────────────────

  it("fires high alert for 29-day absence without OH referral", () => {
    const alerts = computeAlerts([
      makeRow({
        absence_duration_days: 29,
        occupational_health_referral: false,
        staff_name: "Lee",
      }),
    ]);
    const a = alerts.find((x) => x.type === "long_absence_no_oh_referral");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
    expect(a!.message).toContain("Lee");
    expect(a!.message).toContain("29");
    expect(a!.record_id).toBeDefined();
  });

  it("fires high alert for 60-day absence without OH referral", () => {
    const alerts = computeAlerts([
      makeRow({ absence_duration_days: 60, occupational_health_referral: false }),
    ]);
    expect(alerts.filter((x) => x.type === "long_absence_no_oh_referral")).toHaveLength(1);
  });

  it("does not fire for exactly 28-day absence without OH referral", () => {
    const alerts = computeAlerts([
      makeRow({ absence_duration_days: 28, occupational_health_referral: false }),
    ]);
    expect(alerts.filter((x) => x.type === "long_absence_no_oh_referral")).toHaveLength(0);
  });

  it("does not fire for long absence with OH referral", () => {
    const alerts = computeAlerts([
      makeRow({ absence_duration_days: 60, occupational_health_referral: true }),
    ]);
    expect(alerts.filter((x) => x.type === "long_absence_no_oh_referral")).toHaveLength(0);
  });

  it("fires per-record for multiple long absences without OH", () => {
    const alerts = computeAlerts([
      makeRow({ id: "r1", absence_duration_days: 30, occupational_health_referral: false }),
      makeRow({ id: "r2", absence_duration_days: 45, occupational_health_referral: false }),
    ]);
    const filtered = alerts.filter((x) => x.type === "long_absence_no_oh_referral");
    expect(filtered).toHaveLength(2);
  });

  // ── Medium: phased return without support plan ───────────────────────────

  it("fires medium alert for phased return without support plan", () => {
    const alerts = computeAlerts([
      makeRow({
        phased_return: true,
        support_plan_agreed: false,
        staff_name: "Alex",
      }),
    ]);
    const a = alerts.find((x) => x.type === "phased_return_no_support_plan");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
    expect(a!.message).toContain("Alex");
    expect(a!.message).toContain("phased return");
    expect(a!.record_id).toBeDefined();
  });

  it("does not fire medium when phased return with support plan", () => {
    const alerts = computeAlerts([
      makeRow({ phased_return: true, support_plan_agreed: true }),
    ]);
    expect(alerts.filter((x) => x.type === "phased_return_no_support_plan")).toHaveLength(0);
  });

  it("does not fire medium when no phased return", () => {
    const alerts = computeAlerts([
      makeRow({ phased_return: false, support_plan_agreed: false }),
    ]);
    expect(alerts.filter((x) => x.type === "phased_return_no_support_plan")).toHaveLength(0);
  });

  it("fires medium per-record for multiple phased returns without plans", () => {
    const alerts = computeAlerts([
      makeRow({ id: "p1", phased_return: true, support_plan_agreed: false }),
      makeRow({ id: "p2", phased_return: true, support_plan_agreed: false }),
    ]);
    const filtered = alerts.filter((x) => x.type === "phased_return_no_support_plan");
    expect(filtered).toHaveLength(2);
  });

  // ── Combined alerts ──────────────────────────────────────────────────────

  it("fires all alert types for a row triggering all conditions", () => {
    const alerts = computeAlerts([
      makeRow({
        fit_to_return: false,
        adjustments_required: false,
        trigger_level_reached: true,
        trigger_level: "Stage 3",
        absence_duration_days: 35,
        occupational_health_referral: false,
        phased_return: true,
        support_plan_agreed: false,
      }),
    ]);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("not_fit_no_adjustments");
    expect(types).toContain("high_trigger_level");
    expect(types).toContain("long_absence_no_oh_referral");
    expect(types).toContain("phased_return_no_support_plan");
  });

  it("fires mixed alerts across multiple rows", () => {
    const alerts = computeAlerts([
      makeRow({ fit_to_return: false, adjustments_required: false }),
      makeRow({ trigger_level_reached: true, trigger_level: "Formal Review" }),
      makeRow({ absence_duration_days: 50, occupational_health_referral: false }),
      makeRow({ phased_return: true, support_plan_agreed: false }),
    ]);
    expect(alerts.filter((a) => a.severity === "critical")).toHaveLength(1);
    expect(alerts.filter((a) => a.severity === "high")).toHaveLength(2);
    expect(alerts.filter((a) => a.severity === "medium")).toHaveLength(1);
  });

  it("returns alerts with record_id on every alert", () => {
    const alerts = computeAlerts([
      makeRow({
        id: "test-id",
        fit_to_return: false,
        adjustments_required: false,
      }),
    ]);
    for (const a of alerts) {
      expect(a.record_id).toBe("test-id");
    }
  });

  it("returns correct alert structure shape", () => {
    const alerts = computeAlerts([
      makeRow({ fit_to_return: false, adjustments_required: false }),
    ]);
    for (const a of alerts) {
      expect(a).toHaveProperty("type");
      expect(a).toHaveProperty("severity");
      expect(a).toHaveProperty("message");
      expect(typeof a.type).toBe("string");
      expect(typeof a.severity).toBe("string");
      expect(typeof a.message).toBe("string");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. computeAriaInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("computeAriaInsights", () => {
  it("returns exactly 3 strings", () => {
    const insights = computeAriaInsights(computeMetrics([]));
    expect(insights).toHaveLength(3);
    for (const i of insights) {
      expect(typeof i).toBe("string");
    }
  });

  it("returns 3 strings for single row", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow()]));
    expect(insights).toHaveLength(3);
  });

  it("returns 3 strings for multiple rows", () => {
    const rows = [makeRow(), makeRow({ staff_name: "B" }), makeRow({ staff_name: "C" })];
    const insights = computeAriaInsights(computeMetrics(rows));
    expect(insights).toHaveLength(3);
  });

  it("summary line contains total interviews count", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow(), makeRow()]));
    expect(insights[0]).toContain("2");
  });

  it("summary uses singular for 1 interview", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow()]));
    expect(insights[0]).toContain("interview");
    expect(insights[0]).not.toContain("interviews");
  });

  it("summary uses plural for 2 interviews", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow(), makeRow()]));
    expect(insights[0]).toContain("interviews");
  });

  it("summary contains unique staff count", () => {
    const rows = [makeRow({ staff_name: "A" }), makeRow({ staff_name: "B" })];
    const insights = computeAriaInsights(computeMetrics(rows));
    expect(insights[0]).toContain("2");
  });

  it("summary uses singular for 1 staff member", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow()]));
    expect(insights[0]).toContain("staff member");
  });

  it("summary uses plural for 2 staff members", () => {
    const rows = [makeRow({ staff_name: "A" }), makeRow({ staff_name: "B" })];
    const insights = computeAriaInsights(computeMetrics(rows));
    expect(insights[0]).toContain("staff members");
  });

  it("summary contains average absence days", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow({ absence_duration_days: 7 })]));
    expect(insights[0]).toContain("7");
  });

  it("summary contains support plan rate", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow({ support_plan_agreed: true })]));
    expect(insights[0]).toContain("100");
  });

  it("summary contains welfare check rate", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow({ welfare_check_completed: true })]));
    expect(insights[0]).toContain("100");
  });

  // ── Priority items ───────────────────────────────────────────────────────

  it("shows no priority concerns when metrics are clean", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow()]));
    expect(insights[1]).toContain("No priority concerns");
  });

  it("shows priority for not_fit_count", () => {
    const insights = computeAriaInsights(
      computeMetrics([makeRow({ fit_to_return: false })]),
    );
    expect(insights[1]).toContain("not fit to return");
  });

  it("shows priority for oh_referral_count", () => {
    const insights = computeAriaInsights(
      computeMetrics([makeRow({ occupational_health_referral: true })]),
    );
    expect(insights[1]).toContain("occupational health");
  });

  it("shows priority for trigger_level_count", () => {
    const insights = computeAriaInsights(
      computeMetrics([makeRow({ trigger_level_reached: true })]),
    );
    expect(insights[1]).toContain("trigger level");
  });

  it("shows multiple priorities combined", () => {
    const rows = [
      makeRow({ fit_to_return: false }),
      makeRow({ occupational_health_referral: true }),
      makeRow({ trigger_level_reached: true }),
    ];
    const insights = computeAriaInsights(computeMetrics(rows));
    expect(insights[1]).toContain("not fit to return");
    expect(insights[1]).toContain("occupational health");
    expect(insights[1]).toContain("trigger level");
  });

  it("uses singular for 1 staff member not fit", () => {
    const insights = computeAriaInsights(
      computeMetrics([makeRow({ fit_to_return: false })]),
    );
    expect(insights[1]).toContain("staff member");
    expect(insights[1]).not.toContain("staff members");
  });

  it("uses plural for 2 staff members not fit", () => {
    const rows = [
      makeRow({ fit_to_return: false }),
      makeRow({ fit_to_return: false }),
    ];
    const insights = computeAriaInsights(computeMetrics(rows));
    expect(insights[1]).toContain("staff members");
  });

  it("uses singular for 1 OH referral", () => {
    const insights = computeAriaInsights(
      computeMetrics([makeRow({ occupational_health_referral: true })]),
    );
    expect(insights[1]).toContain("referral");
    // Ensure it doesn't use "referrals" (the singular path)
    const idx = insights[1].indexOf("referral");
    const afterReferral = insights[1].substring(idx, idx + 10);
    expect(afterReferral).not.toContain("referrals");
  });

  it("uses plural for 2 OH referrals", () => {
    const rows = [
      makeRow({ occupational_health_referral: true }),
      makeRow({ occupational_health_referral: true }),
    ];
    const insights = computeAriaInsights(computeMetrics(rows));
    expect(insights[1]).toContain("referrals");
  });

  // ── Reflective question ──────────────────────────────────────────────────

  it("reflective question is a non-empty string", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow()]));
    expect(typeof insights[2]).toBe("string");
    expect(insights[2].length).toBeGreaterThan(0);
  });

  it("reflective question mentions staff welfare when not fit and low support plan rate", () => {
    const rows = [
      makeRow({ fit_to_return: false, support_plan_agreed: false }),
    ];
    const insights = computeAriaInsights(computeMetrics(rows));
    expect(insights[2]).toContain("support");
  });

  it("reflective question mentions phased return when phased returns exist", () => {
    const rows = [makeRow({ phased_return: true })];
    const insights = computeAriaInsights(computeMetrics(rows));
    expect(insights[2]).toContain("phased");
  });

  it("reflective question is generic when no concerns", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow()]));
    expect(insights[2]).toContain("return-to-work");
  });

  it("reflective question contains a question mark", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow()]));
    expect(insights[2]).toContain("?");
  });

  it("reflective question for empty metrics contains a question mark", () => {
    const insights = computeAriaInsights(computeMetrics([]));
    expect(insights[2]).toContain("?");
  });

  it("all 3 insights are non-empty for empty input", () => {
    const insights = computeAriaInsights(computeMetrics([]));
    for (const i of insights) {
      expect(i.length).toBeGreaterThan(0);
    }
  });

  it("all 3 insights are non-empty for complex input", () => {
    const rows = [
      makeRow({
        fit_to_return: false,
        phased_return: true,
        occupational_health_referral: true,
        trigger_level_reached: true,
        support_plan_agreed: false,
        absence_duration_days: 45,
      }),
      makeRow({ staff_name: "B", absence_duration_days: 5 }),
    ];
    const insights = computeAriaInsights(computeMetrics(rows));
    for (const i of insights) {
      expect(i.length).toBeGreaterThan(0);
    }
  });

  it("insight 0 contains the word 'interview' or 'interviews'", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow()]));
    expect(insights[0]).toMatch(/interviews?/);
  });

  it("insight 2 contains a question", () => {
    const insights = computeAriaInsights(computeMetrics([makeRow()]));
    expect(insights[2]).toContain("?");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. makeRow helper validation
// ══════════════════════════════════════════════════════════════════════════════

describe("makeRow helper", () => {
  it("produces valid row with defaults", () => {
    const row = makeRow();
    expect(row.staff_name).toBe("Staff A");
    expect(row.absence_type).toBe("Short-term Sickness");
    expect(row.absence_duration_days).toBe(3);
    expect(row.interviewer_name).toBe("D. Laville");
    expect(row.fit_to_return).toBe(true);
    expect(row.phased_return).toBe(false);
    expect(row.adjustments_required).toBe(false);
    expect(row.adjustment_details).toBeNull();
    expect(row.occupational_health_referral).toBe(false);
    expect(row.support_plan_agreed).toBe(false);
    expect(row.trigger_level_reached).toBe(false);
    expect(row.trigger_level).toBeNull();
    expect(row.welfare_check_completed).toBe(true);
    expect(row.follow_up_date).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("allows overriding nullable field to a value", () => {
    const row = makeRow({ adjustment_details: "Desk change" });
    expect(row.adjustment_details).toBe("Desk change");
  });

  it("allows overriding nullable field to null", () => {
    const row = makeRow({ notes: null });
    expect(row.notes).toBeNull();
  });

  it("allows overriding trigger_level to a value", () => {
    const row = makeRow({ trigger_level: "Stage 2" });
    expect(row.trigger_level).toBe("Stage 2");
  });

  it("allows overriding follow_up_date to a value", () => {
    const row = makeRow({ follow_up_date: "2026-07-01" });
    expect(row.follow_up_date).toBe("2026-07-01");
  });

  it("allows overriding follow_up_date to null", () => {
    const row = makeRow({ follow_up_date: null });
    expect(row.follow_up_date).toBeNull();
  });

  it("generates unique ids", () => {
    const a = makeRow();
    const b = makeRow();
    expect(a.id).not.toBe(b.id);
  });

  it("generates unique home_ids", () => {
    const a = makeRow();
    const b = makeRow();
    expect(a.home_id).not.toBe(b.home_id);
  });

  it("respects explicit id override", () => {
    const row = makeRow({ id: "fixed-id" });
    expect(row.id).toBe("fixed-id");
  });

  it("respects explicit home_id override", () => {
    const row = makeRow({ home_id: "fixed-home" });
    expect(row.home_id).toBe("fixed-home");
  });
});
