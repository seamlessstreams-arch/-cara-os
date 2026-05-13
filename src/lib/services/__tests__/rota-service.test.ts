// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF ROTA & WORKFORCE SERVICE TESTS
// Pure-function unit tests for rota summary computation, staffing compliance,
// absence profile aggregation, alert identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../rota-service";
import {
  SHIFT_TYPES,
  ABSENCE_TYPES,
  STAFF_ROLES,
} from "../rota-service";

import type { RotaEntry, AbsenceRecord } from "../rota-service";

const {
  computeRotaSummary,
  computeStaffingCompliance,
  computeAbsenceProfile,
  identifyRotaAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal RotaEntry with sensible defaults. */
function makeRotaEntry(
  overrides: Partial<RotaEntry> = {},
): RotaEntry {
  return {
    id: "id" in overrides ? overrides.id! : "rota-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    staff_id: "staff_id" in overrides ? overrides.staff_id! : "staff-1",
    staff_name: "staff_name" in overrides ? overrides.staff_name! : "Jane Doe",
    role: "role" in overrides ? overrides.role! : "residential_carer",
    date: "date" in overrides ? overrides.date! : "2026-05-10",
    shift_type: "shift_type" in overrides ? overrides.shift_type! : "early",
    start_time: "start_time" in overrides ? overrides.start_time! : "07:00",
    end_time: "end_time" in overrides ? overrides.end_time! : "15:00",
    hours: "hours" in overrides ? overrides.hours! : 8,
    is_agency: "is_agency" in overrides ? overrides.is_agency! : false,
    is_overtime: "is_overtime" in overrides ? overrides.is_overtime! : false,
    notes: "notes" in overrides ? overrides.notes! : null,
    status: "status" in overrides ? overrides.status! : "confirmed",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-05-01T08:00:00Z",
  };
}

/** Build a minimal AbsenceRecord with sensible defaults. */
function makeAbsenceRecord(
  overrides: Partial<AbsenceRecord> = {},
): AbsenceRecord {
  return {
    id: "id" in overrides ? overrides.id! : "abs-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    staff_id: "staff_id" in overrides ? overrides.staff_id! : "staff-1",
    staff_name: "staff_name" in overrides ? overrides.staff_name! : "Jane Doe",
    absence_type: "absence_type" in overrides ? overrides.absence_type! : "sick",
    start_date: "start_date" in overrides ? overrides.start_date! : "2026-05-01",
    end_date: "end_date" in overrides ? overrides.end_date! : "2026-05-03",
    days: "days" in overrides ? overrides.days! : 3,
    reason: "reason" in overrides ? overrides.reason! : null,
    approved_by: "approved_by" in overrides ? overrides.approved_by! : null,
    status: "status" in overrides ? overrides.status! : "approved",
    return_to_work_completed: "return_to_work_completed" in overrides ? overrides.return_to_work_completed! : false,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T08:00:00Z",
  };
}

// ── computeRotaSummary ─────────────────────────────────────────────────────

describe("computeRotaSummary", () => {
  it("returns zeroed stats for empty entries", () => {
    const result = computeRotaSummary([], "2026-05-10");
    expect(result.date).toBe("2026-05-10");
    expect(result.total_staff).toBe(0);
    expect(result.by_shift).toEqual({});
    expect(result.by_role).toEqual({});
    expect(result.agency_count).toBe(0);
    expect(result.agency_percentage).toBe(0);
    expect(result.total_hours).toBe(0);
    expect(result.overtime_hours).toBe(0);
    expect(result.gaps).toEqual(["early", "late", "long_day", "waking_night", "sleep_in"]);
  });

  it("filters entries by date", () => {
    const entries = [
      makeRotaEntry({ date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", date: "2026-05-11" }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.total_staff).toBe(1);
  });

  it("excludes cancelled entries", () => {
    const entries = [
      makeRotaEntry({ status: "confirmed" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", status: "cancelled" }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.total_staff).toBe(1);
  });

  it("counts unique staff correctly (same staff_id counted once)", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-1", shift_type: "late" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-2", shift_type: "early" }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.total_staff).toBe(2);
  });

  it("counts by shift type", () => {
    const entries = [
      makeRotaEntry({ shift_type: "early" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "early" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "late" }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.by_shift).toEqual({ early: 2, late: 1 });
  });

  it("counts by role", () => {
    const entries = [
      makeRotaEntry({ role: "residential_carer" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", role: "senior_carer" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", role: "residential_carer" }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.by_role).toEqual({ residential_carer: 2, senior_carer: 1 });
  });

  it("calculates agency count and percentage", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", is_agency: true }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", is_agency: false }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", is_agency: false }),
      makeRotaEntry({ id: "rota-4", staff_id: "staff-4", is_agency: false }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.agency_count).toBe(1);
    expect(result.agency_percentage).toBe(25);
  });

  it("sums total hours and overtime hours", () => {
    const entries = [
      makeRotaEntry({ hours: 8, is_overtime: false }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", hours: 10, is_overtime: true }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", hours: 14, is_overtime: false }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.total_hours).toBe(32);
    expect(result.overtime_hours).toBe(10);
  });

  it("identifies gaps for care shift types not covered", () => {
    const entries = [
      makeRotaEntry({ shift_type: "early" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "waking_night" }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.gaps).toContain("late");
    expect(result.gaps).toContain("long_day");
    expect(result.gaps).toContain("sleep_in");
    expect(result.gaps).not.toContain("early");
    expect(result.gaps).not.toContain("waking_night");
  });

  it("returns empty gaps when all care shift types are covered", () => {
    const entries = [
      makeRotaEntry({ shift_type: "early" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "late" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "long_day" }),
      makeRotaEntry({ id: "rota-4", staff_id: "staff-4", shift_type: "waking_night" }),
      makeRotaEntry({ id: "rota-5", staff_id: "staff-5", shift_type: "sleep_in" }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.gaps).toEqual([]);
  });

  it("does not count office as a gap (only care shift types)", () => {
    // No office shift present, but office should not appear in gaps
    const entries = [
      makeRotaEntry({ shift_type: "early" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "late" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "long_day" }),
      makeRotaEntry({ id: "rota-4", staff_id: "staff-4", shift_type: "waking_night" }),
      makeRotaEntry({ id: "rota-5", staff_id: "staff-5", shift_type: "sleep_in" }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.gaps).not.toContain("office");
  });

  it("returns 0 agency percentage when no staff", () => {
    const result = computeRotaSummary([], "2026-05-10");
    expect(result.agency_percentage).toBe(0);
  });

  it("handles rounding of agency percentage to 1 decimal", () => {
    // 1 agency out of 3 staff = 33.3%
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", is_agency: true }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", is_agency: false }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", is_agency: false }),
    ];
    const result = computeRotaSummary(entries, "2026-05-10");
    expect(result.agency_percentage).toBe(33.3);
  });
});

// ── computeStaffingCompliance ──────────────────────────────────────────────

describe("computeStaffingCompliance", () => {
  it("returns zeroed stats for empty entries", () => {
    const result = computeStaffingCompliance([], 2, 1);
    expect(result.total_days_checked).toBe(0);
    expect(result.compliant_days).toBe(0);
    expect(result.non_compliant_days).toEqual([]);
    expect(result.agency_reliance_rate).toBe(0);
    expect(result.avg_staff_per_day).toBe(0);
    expect(result.lone_working_incidents).toBe(0);
  });

  it("marks a day compliant when staffing meets minimums", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "waking_night", date: "2026-05-10" }),
    ];
    const result = computeStaffingCompliance(entries, 2, 1);
    expect(result.total_days_checked).toBe(1);
    expect(result.compliant_days).toBe(1);
    expect(result.non_compliant_days).toHaveLength(0);
  });

  it("marks a day non-compliant when day staff below minimum", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "waking_night", date: "2026-05-10" }),
    ];
    const result = computeStaffingCompliance(entries, 3, 1);
    expect(result.non_compliant_days).toHaveLength(1);
    expect(result.non_compliant_days[0].day_staff).toBe(1);
    expect(result.non_compliant_days[0].shortfall).toContain("day: 1/3");
  });

  it("marks a day non-compliant when night staff below minimum", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "late", date: "2026-05-10" }),
    ];
    const result = computeStaffingCompliance(entries, 1, 1);
    expect(result.non_compliant_days).toHaveLength(1);
    expect(result.non_compliant_days[0].night_staff).toBe(0);
    expect(result.non_compliant_days[0].shortfall).toContain("night: 0/1");
  });

  it("reports both day and night shortfall when both below minimum", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
    ];
    const result = computeStaffingCompliance(entries, 3, 2);
    expect(result.non_compliant_days).toHaveLength(1);
    expect(result.non_compliant_days[0].shortfall).toContain("day: 1/3");
    expect(result.non_compliant_days[0].shortfall).toContain("night: 0/2");
  });

  it("excludes cancelled entries from compliance checks", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "early", date: "2026-05-10", status: "cancelled" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "waking_night", date: "2026-05-10" }),
    ];
    const result = computeStaffingCompliance(entries, 2, 1);
    // Only staff-1 on day, staff-3 on night — day below min of 2
    expect(result.non_compliant_days).toHaveLength(1);
    expect(result.non_compliant_days[0].day_staff).toBe(1);
  });

  it("calculates agency reliance rate", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", is_agency: true, shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", is_agency: false, shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", is_agency: false, shift_type: "waking_night", date: "2026-05-10" }),
    ];
    const result = computeStaffingCompliance(entries, 1, 1);
    // 1 agency out of 3 entries = 33.3%
    expect(result.agency_reliance_rate).toBe(33.3);
  });

  it("calculates average staff per day", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "waking_night", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-4", staff_id: "staff-4", shift_type: "early", date: "2026-05-11" }),
    ];
    const result = computeStaffingCompliance(entries, 1, 0);
    // Day 1: 3 unique staff, Day 2: 1 unique staff => avg = 2.0
    expect(result.avg_staff_per_day).toBe(2);
  });

  it("detects lone working incidents (1 staff on a shift type)", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "waking_night", date: "2026-05-10" }),
    ];
    const result = computeStaffingCompliance(entries, 1, 1);
    // waking_night has only 1 staff => lone working
    expect(result.lone_working_incidents).toBe(1);
  });

  it("counts lone working at most once per day", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "waking_night", date: "2026-05-10" }),
    ];
    const result = computeStaffingCompliance(entries, 1, 1);
    // Both early and waking_night have 1 staff each, but only counted once per day
    expect(result.lone_working_incidents).toBe(1);
  });

  it("does not flag lone working when all shift types have 2+ staff", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "waking_night", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-4", staff_id: "staff-4", shift_type: "waking_night", date: "2026-05-10" }),
    ];
    const result = computeStaffingCompliance(entries, 1, 1);
    expect(result.lone_working_incidents).toBe(0);
  });

  it("checks compliance across multiple dates independently", () => {
    const entries = [
      // Day 1: compliant (2 day, 1 night)
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "late", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "waking_night", date: "2026-05-10" }),
      // Day 2: non-compliant (1 day, 0 night)
      makeRotaEntry({ id: "rota-4", staff_id: "staff-4", shift_type: "early", date: "2026-05-11" }),
    ];
    const result = computeStaffingCompliance(entries, 2, 1);
    expect(result.total_days_checked).toBe(2);
    expect(result.compliant_days).toBe(1);
    expect(result.non_compliant_days).toHaveLength(1);
    expect(result.non_compliant_days[0].date).toBe("2026-05-11");
  });
});

// ── computeAbsenceProfile ──────────────────────────────────────────────────

describe("computeAbsenceProfile", () => {
  it("returns zeroed stats for empty absences", () => {
    const result = computeAbsenceProfile([]);
    expect(result.total_absences).toBe(0);
    expect(result.total_days_lost).toBe(0);
    expect(result.by_type).toEqual({});
    expect(result.sick_days).toBe(0);
    expect(result.avg_absence_duration).toBe(0);
    expect(result.return_to_work_rate).toBe(0);
    expect(result.current_absences).toBe(0);
    expect(result.staff_with_high_absence).toEqual([]);
  });

  it("counts total absences", () => {
    const absences = [
      makeAbsenceRecord(),
      makeAbsenceRecord({ id: "abs-2", staff_id: "staff-2" }),
      makeAbsenceRecord({ id: "abs-3", staff_id: "staff-3" }),
    ];
    const result = computeAbsenceProfile(absences);
    expect(result.total_absences).toBe(3);
  });

  it("sums total days lost", () => {
    const absences = [
      makeAbsenceRecord({ days: 3 }),
      makeAbsenceRecord({ id: "abs-2", staff_id: "staff-2", days: 5 }),
    ];
    const result = computeAbsenceProfile(absences);
    expect(result.total_days_lost).toBe(8);
  });

  it("counts absences by type", () => {
    const absences = [
      makeAbsenceRecord({ absence_type: "sick" }),
      makeAbsenceRecord({ id: "abs-2", absence_type: "sick" }),
      makeAbsenceRecord({ id: "abs-3", absence_type: "annual_leave" }),
      makeAbsenceRecord({ id: "abs-4", absence_type: "training" }),
    ];
    const result = computeAbsenceProfile(absences);
    expect(result.by_type).toEqual({ sick: 2, annual_leave: 1, training: 1 });
  });

  it("accumulates sick days separately", () => {
    const absences = [
      makeAbsenceRecord({ absence_type: "sick", days: 3 }),
      makeAbsenceRecord({ id: "abs-2", absence_type: "sick", days: 5 }),
      makeAbsenceRecord({ id: "abs-3", absence_type: "annual_leave", days: 7 }),
    ];
    const result = computeAbsenceProfile(absences);
    expect(result.sick_days).toBe(8);
  });

  it("calculates average absence duration with 1 decimal", () => {
    const absences = [
      makeAbsenceRecord({ days: 3 }),
      makeAbsenceRecord({ id: "abs-2", days: 4 }),
    ];
    const result = computeAbsenceProfile(absences);
    // (3+4)/2 = 3.5
    expect(result.avg_absence_duration).toBe(3.5);
  });

  it("calculates return to work rate for sick absences", () => {
    const absences = [
      makeAbsenceRecord({ absence_type: "sick", return_to_work_completed: true }),
      makeAbsenceRecord({ id: "abs-2", absence_type: "sick", return_to_work_completed: false }),
      makeAbsenceRecord({ id: "abs-3", absence_type: "sick", return_to_work_completed: true }),
    ];
    const result = computeAbsenceProfile(absences);
    // 2 out of 3 sick absences have RTW completed = 66.7%
    expect(result.return_to_work_rate).toBe(66.7);
  });

  it("returns 0 return to work rate when no sick absences", () => {
    const absences = [
      makeAbsenceRecord({ absence_type: "annual_leave" }),
    ];
    const result = computeAbsenceProfile(absences);
    expect(result.return_to_work_rate).toBe(0);
  });

  it("counts current absences (approved and spanning today)", () => {
    const today = new Date().toISOString().slice(0, 10);
    const absences = [
      makeAbsenceRecord({
        status: "approved",
        start_date: "2020-01-01",
        end_date: "2030-12-31",
      }),
      makeAbsenceRecord({
        id: "abs-2",
        status: "approved",
        start_date: "2020-01-01",
        end_date: "2020-01-05",
      }),
      makeAbsenceRecord({
        id: "abs-3",
        status: "requested",
        start_date: "2020-01-01",
        end_date: "2030-12-31",
      }),
    ];
    const result = computeAbsenceProfile(absences);
    // Only first one spans today and is approved
    expect(result.current_absences).toBe(1);
  });

  it("identifies staff with high absence (10+ sick days)", () => {
    const absences = [
      makeAbsenceRecord({ staff_id: "staff-1", staff_name: "Jane Doe", absence_type: "sick", days: 7 }),
      makeAbsenceRecord({ id: "abs-2", staff_id: "staff-1", staff_name: "Jane Doe", absence_type: "sick", days: 5 }),
      makeAbsenceRecord({ id: "abs-3", staff_id: "staff-2", staff_name: "John Smith", absence_type: "sick", days: 4 }),
    ];
    const result = computeAbsenceProfile(absences);
    // staff-1 has 12 sick days (>= 10), staff-2 has 4 (< 10)
    expect(result.staff_with_high_absence).toHaveLength(1);
    expect(result.staff_with_high_absence[0].staff_id).toBe("staff-1");
    expect(result.staff_with_high_absence[0].days).toBe(12);
  });

  it("sorts staff with high absence descending by days", () => {
    const absences = [
      makeAbsenceRecord({ staff_id: "staff-1", staff_name: "Jane Doe", absence_type: "sick", days: 11 }),
      makeAbsenceRecord({ id: "abs-2", staff_id: "staff-2", staff_name: "John Smith", absence_type: "sick", days: 15 }),
      makeAbsenceRecord({ id: "abs-3", staff_id: "staff-3", staff_name: "Mary Jones", absence_type: "sick", days: 13 }),
    ];
    const result = computeAbsenceProfile(absences);
    expect(result.staff_with_high_absence).toHaveLength(3);
    expect(result.staff_with_high_absence[0].days).toBe(15);
    expect(result.staff_with_high_absence[1].days).toBe(13);
    expect(result.staff_with_high_absence[2].days).toBe(11);
  });

  it("excludes non-sick absences from high absence tracking", () => {
    const absences = [
      makeAbsenceRecord({ staff_id: "staff-1", absence_type: "annual_leave", days: 20 }),
    ];
    const result = computeAbsenceProfile(absences);
    expect(result.staff_with_high_absence).toEqual([]);
  });

  it("does not count staff with exactly 9 sick days as high absence", () => {
    const absences = [
      makeAbsenceRecord({ staff_id: "staff-1", staff_name: "Jane Doe", absence_type: "sick", days: 9 }),
    ];
    const result = computeAbsenceProfile(absences);
    expect(result.staff_with_high_absence).toEqual([]);
  });

  it("counts staff with exactly 10 sick days as high absence", () => {
    const absences = [
      makeAbsenceRecord({ staff_id: "staff-1", staff_name: "Jane Doe", absence_type: "sick", days: 10 }),
    ];
    const result = computeAbsenceProfile(absences);
    expect(result.staff_with_high_absence).toHaveLength(1);
    expect(result.staff_with_high_absence[0].days).toBe(10);
  });
});

// ── identifyRotaAlerts ─────────────────────────────────────────────────────

describe("identifyRotaAlerts", () => {
  it("returns empty alerts for empty inputs", () => {
    const result = identifyRotaAlerts([], [], 2, 1);
    expect(result).toEqual([]);
  });

  it("alerts when day shift is understaffed", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "waking_night", date: "2026-05-10" }),
    ];
    const result = identifyRotaAlerts(entries, [], 3, 1);
    const understaffed = result.filter((a) => a.type === "understaffed" && a.message.includes("Day shift"));
    expect(understaffed).toHaveLength(1);
    expect(understaffed[0].severity).toBe("critical");
    expect(understaffed[0].date).toBe("2026-05-10");
  });

  it("alerts when night shift is understaffed", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "early", date: "2026-05-10" }),
    ];
    const result = identifyRotaAlerts(entries, [], 2, 1);
    const understaffed = result.filter((a) => a.type === "understaffed" && a.message.includes("Night shift"));
    expect(understaffed).toHaveLength(1);
    expect(understaffed[0].severity).toBe("critical");
  });

  it("alerts for no night cover", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "late", date: "2026-05-10" }),
    ];
    const result = identifyRotaAlerts(entries, [], 1, 0);
    const noNight = result.filter((a) => a.type === "no_night_cover");
    expect(noNight).toHaveLength(1);
    expect(noNight[0].severity).toBe("critical");
    expect(noNight[0].message).toContain("No waking night or sleep-in cover");
  });

  it("does not alert for no night cover when sleep_in is present", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "sleep_in", date: "2026-05-10" }),
    ];
    const result = identifyRotaAlerts(entries, [], 1, 1);
    const noNight = result.filter((a) => a.type === "no_night_cover");
    expect(noNight).toHaveLength(0);
  });

  it("alerts for high agency usage (>30%)", () => {
    // 2 agency out of 3 staff = 66.7%
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", is_agency: true, shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", is_agency: true, shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", is_agency: false, shift_type: "waking_night", date: "2026-05-10" }),
    ];
    const result = identifyRotaAlerts(entries, [], 1, 1);
    const highAgency = result.filter((a) => a.type === "high_agency");
    expect(highAgency).toHaveLength(1);
    expect(highAgency[0].severity).toBe("high");
    expect(highAgency[0].message).toContain("66.7%");
  });

  it("does not alert for agency usage at exactly 30%", () => {
    // 3 agency out of 10 staff = 30% (not > 30%)
    const entries: RotaEntry[] = [];
    for (let i = 0; i < 10; i++) {
      entries.push(makeRotaEntry({
        id: `rota-${i}`,
        staff_id: `staff-${i}`,
        shift_type: "early",
        date: "2026-05-10",
        is_agency: i < 3,
      }));
    }
    const result = identifyRotaAlerts(entries, [], 1, 0);
    const highAgency = result.filter((a) => a.type === "high_agency");
    expect(highAgency).toHaveLength(0);
  });

  it("alerts for lone working (1 staff on a shift type)", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "early", date: "2026-05-10" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "waking_night", date: "2026-05-10" }),
    ];
    const result = identifyRotaAlerts(entries, [], 1, 1);
    const loneWorking = result.filter((a) => a.type === "lone_working");
    expect(loneWorking).toHaveLength(1);
    expect(loneWorking[0].severity).toBe("high");
    expect(loneWorking[0].message).toContain("Waking Night");
  });

  it("alerts for unfilled shifts (cancelled with no replacement)", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10", status: "cancelled", staff_name: "Jane Doe" }),
    ];
    const result = identifyRotaAlerts(entries, [], 0, 0);
    const unfilled = result.filter((a) => a.type === "unfilled_shift");
    expect(unfilled).toHaveLength(1);
    expect(unfilled[0].severity).toBe("medium");
    expect(unfilled[0].message).toContain("Jane Doe");
    expect(unfilled[0].message).toContain("Early (7am-3pm)");
  });

  it("does not alert for unfilled shift when replacement exists", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10", status: "cancelled" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "early", date: "2026-05-10", status: "confirmed" }),
    ];
    const result = identifyRotaAlerts(entries, [], 0, 0);
    const unfilled = result.filter((a) => a.type === "unfilled_shift");
    expect(unfilled).toHaveLength(0);
  });

  it("alerts for high sickness (staff with 10+ sick days)", () => {
    const absences = [
      makeAbsenceRecord({ staff_id: "staff-1", staff_name: "Jane Doe", absence_type: "sick", days: 12 }),
    ];
    const result = identifyRotaAlerts([], absences, 0, 0);
    const highSickness = result.filter((a) => a.type === "high_sickness");
    expect(highSickness).toHaveLength(1);
    expect(highSickness[0].severity).toBe("medium");
    expect(highSickness[0].message).toContain("Jane Doe");
    expect(highSickness[0].message).toContain("12 sick days");
    expect(highSickness[0].message).toContain("welfare check");
  });

  it("aggregates sick days across multiple absence records for same staff", () => {
    const absences = [
      makeAbsenceRecord({ staff_id: "staff-1", staff_name: "Jane Doe", absence_type: "sick", days: 6 }),
      makeAbsenceRecord({ id: "abs-2", staff_id: "staff-1", staff_name: "Jane Doe", absence_type: "sick", days: 5 }),
    ];
    const result = identifyRotaAlerts([], absences, 0, 0);
    const highSickness = result.filter((a) => a.type === "high_sickness");
    expect(highSickness).toHaveLength(1);
    expect(highSickness[0].message).toContain("11 sick days");
  });

  it("does not alert for high sickness when below threshold", () => {
    const absences = [
      makeAbsenceRecord({ staff_id: "staff-1", absence_type: "sick", days: 9 }),
    ];
    const result = identifyRotaAlerts([], absences, 0, 0);
    const highSickness = result.filter((a) => a.type === "high_sickness");
    expect(highSickness).toHaveLength(0);
  });

  it("excludes cancelled entries from staffing checks", () => {
    const entries = [
      makeRotaEntry({ staff_id: "staff-1", shift_type: "early", date: "2026-05-10", status: "cancelled" }),
      makeRotaEntry({ id: "rota-2", staff_id: "staff-2", shift_type: "early", date: "2026-05-10", status: "confirmed" }),
      makeRotaEntry({ id: "rota-3", staff_id: "staff-3", shift_type: "waking_night", date: "2026-05-10", status: "confirmed" }),
    ];
    const result = identifyRotaAlerts(entries, [], 2, 1);
    // Only staff-2 on day (cancelled staff-1 excluded), so day understaffed
    const understaffed = result.filter((a) => a.type === "understaffed" && a.message.includes("Day shift"));
    expect(understaffed).toHaveLength(1);
    expect(understaffed[0].message).toContain("1 staff rostered");
  });
});

// ── Constants ──────────────────────────────────────────────────────────────

describe("SHIFT_TYPES", () => {
  it("has exactly 6 entries", () => {
    expect(SHIFT_TYPES).toHaveLength(6);
  });

  it("each entry has type, label, start, end, and hours", () => {
    for (const shift of SHIFT_TYPES) {
      expect(typeof shift.type).toBe("string");
      expect(typeof shift.label).toBe("string");
      expect(typeof shift.start).toBe("string");
      expect(typeof shift.end).toBe("string");
      expect(typeof shift.hours).toBe("number");
    }
  });

  it("includes early and waking_night shift types", () => {
    const types = SHIFT_TYPES.map((s) => s.type);
    expect(types).toContain("early");
    expect(types).toContain("waking_night");
  });

  it("includes long_day and sleep_in shift types", () => {
    const types = SHIFT_TYPES.map((s) => s.type);
    expect(types).toContain("long_day");
    expect(types).toContain("sleep_in");
  });

  it("has correct hours for early (8) and long_day (14)", () => {
    const early = SHIFT_TYPES.find((s) => s.type === "early");
    const longDay = SHIFT_TYPES.find((s) => s.type === "long_day");
    expect(early!.hours).toBe(8);
    expect(longDay!.hours).toBe(14);
  });
});

describe("ABSENCE_TYPES", () => {
  it("has exactly 9 entries", () => {
    expect(ABSENCE_TYPES).toHaveLength(9);
  });

  it("each entry is a string", () => {
    for (const t of ABSENCE_TYPES) {
      expect(typeof t).toBe("string");
    }
  });

  it("includes sick and annual_leave", () => {
    expect(ABSENCE_TYPES).toContain("sick");
    expect(ABSENCE_TYPES).toContain("annual_leave");
  });

  it("includes maternity and paternity", () => {
    expect(ABSENCE_TYPES).toContain("maternity");
    expect(ABSENCE_TYPES).toContain("paternity");
  });
});

describe("STAFF_ROLES", () => {
  it("has exactly 7 entries", () => {
    expect(STAFF_ROLES).toHaveLength(7);
  });

  it("each entry is a string", () => {
    for (const r of STAFF_ROLES) {
      expect(typeof r).toBe("string");
    }
  });

  it("includes registered_manager and deputy_manager", () => {
    expect(STAFF_ROLES).toContain("registered_manager");
    expect(STAFF_ROLES).toContain("deputy_manager");
  });

  it("includes residential_carer and agency", () => {
    expect(STAFF_ROLES).toContain("residential_carer");
    expect(STAFF_ROLES).toContain("agency");
  });
});
