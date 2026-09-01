// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMERGENCY DRILL SERVICE TESTS
// Pure-function tests for drill metrics computation, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import { _testing } from "../emergency-drill-service";

import type { EmergencyDrillRecord } from "../emergency-drill-service";
import { todayStr } from "@/lib/utils";

const { computeDrillMetrics, identifyDrillAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<EmergencyDrillRecord>,
): EmergencyDrillRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    drill_type: "drill_type" in (overrides ?? {}) ? overrides!.drill_type! : "fire_evacuation",
    drill_date: "drill_date" in (overrides ?? {}) ? overrides!.drill_date! : "2026-05-01",
    drill_outcome: "drill_outcome" in (overrides ?? {}) ? overrides!.drill_outcome! : "successful",
    time_of_day: "time_of_day" in (overrides ?? {}) ? overrides!.time_of_day! : "day_shift",
    staff_readiness: "staff_readiness" in (overrides ?? {}) ? overrides!.staff_readiness! : "fully_prepared",
    evacuation_time_seconds: "evacuation_time_seconds" in (overrides ?? {}) ? (overrides!.evacuation_time_seconds ?? null) : null,
    all_children_accounted: "all_children_accounted" in (overrides ?? {}) ? overrides!.all_children_accounted! : true,
    all_staff_participated: "all_staff_participated" in (overrides ?? {}) ? overrides!.all_staff_participated! : true,
    assembly_point_used: "assembly_point_used" in (overrides ?? {}) ? overrides!.assembly_point_used! : true,
    equipment_working: "equipment_working" in (overrides ?? {}) ? overrides!.equipment_working! : true,
    children_informed_beforehand: "children_informed_beforehand" in (overrides ?? {}) ? overrides!.children_informed_beforehand! : false,
    children_distressed: "children_distressed" in (overrides ?? {}) ? overrides!.children_distressed! : false,
    learning_points: "learning_points" in (overrides ?? {}) ? overrides!.learning_points! : [],
    actions_required: "actions_required" in (overrides ?? {}) ? overrides!.actions_required! : [],
    staff_present: "staff_present" in (overrides ?? {}) ? overrides!.staff_present! : 5,
    children_present: "children_present" in (overrides ?? {}) ? overrides!.children_present! : 4,
    conducted_by: "conducted_by" in (overrides ?? {}) ? overrides!.conducted_by! : "Darren Laville",
    next_drill_date: "next_drill_date" in (overrides ?? {}) ? (overrides!.next_drill_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

/** Return an ISO date string for N days ago from now */
function daysAgo(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Return an ISO date string for N days from now (future) */
function daysFromNow(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// ══════════════════════════════════════════════════════════════════════════════
// computeDrillMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("emergency-drill-service", () => {
  describe("computeDrillMetrics", () => {
    // ── Empty array ──────────────────────────────────────────────────────

    describe("empty array", () => {
      it("returns total_drills = 0", () => {
        expect(computeDrillMetrics([]).total_drills).toBe(0);
      });

      it("returns fire_evacuation_count = 0", () => {
        expect(computeDrillMetrics([]).fire_evacuation_count).toBe(0);
      });

      it("returns lockdown_count = 0", () => {
        expect(computeDrillMetrics([]).lockdown_count).toBe(0);
      });

      it("returns missing_child_count = 0", () => {
        expect(computeDrillMetrics([]).missing_child_count).toBe(0);
      });

      it("returns successful_rate = 0", () => {
        expect(computeDrillMetrics([]).successful_rate).toBeNull();;
      });

      it("returns failed_count = 0", () => {
        expect(computeDrillMetrics([]).failed_count).toBe(0);
      });

      it("returns cancelled_count = 0", () => {
        expect(computeDrillMetrics([]).cancelled_count).toBe(0);
      });

      it("returns all_children_accounted_rate = 0", () => {
        expect(computeDrillMetrics([]).all_children_accounted_rate).toBeNull();;
      });

      it("returns all_staff_participated_rate = 0", () => {
        expect(computeDrillMetrics([]).all_staff_participated_rate).toBeNull();;
      });

      it("returns assembly_point_used_rate = 0", () => {
        expect(computeDrillMetrics([]).assembly_point_used_rate).toBeNull();;
      });

      it("returns equipment_working_rate = 0", () => {
        expect(computeDrillMetrics([]).equipment_working_rate).toBeNull();;
      });

      it("returns children_distressed_count = 0", () => {
        expect(computeDrillMetrics([]).children_distressed_count).toBe(0);
      });

      it("returns average_evacuation_time = 0", () => {
        expect(computeDrillMetrics([]).average_evacuation_time).toBeNull();;
      });

      it("returns fully_prepared_rate = 0", () => {
        expect(computeDrillMetrics([]).fully_prepared_rate).toBeNull();;
      });

      it("returns unprepared_count = 0", () => {
        expect(computeDrillMetrics([]).unprepared_count).toBe(0);
      });

      it("returns drill_overdue_count = 0", () => {
        expect(computeDrillMetrics([]).drill_overdue_count).toBe(0);
      });

      it("returns empty by_drill_type", () => {
        expect(computeDrillMetrics([]).by_drill_type).toEqual({});
      });

      it("returns empty by_drill_outcome", () => {
        expect(computeDrillMetrics([]).by_drill_outcome).toEqual({});
      });

      it("returns empty by_time_of_day", () => {
        expect(computeDrillMetrics([]).by_time_of_day).toEqual({});
      });

      it("returns empty by_staff_readiness", () => {
        expect(computeDrillMetrics([]).by_staff_readiness).toEqual({});
      });
    });

    // ── total_drills ─────────────────────────────────────────────────────

    describe("total_drills", () => {
      it("counts a single record", () => {
        const m = computeDrillMetrics([makeRecord()]);
        expect(m.total_drills).toBe(1);
      });

      it("counts multiple records", () => {
        const m = computeDrillMetrics([makeRecord(), makeRecord(), makeRecord()]);
        expect(m.total_drills).toBe(3);
      });
    });

    // ── drill type counts ────────────────────────────────────────────────

    describe("fire_evacuation_count", () => {
      it("counts fire_evacuation drills", () => {
        const records = [
          makeRecord({ drill_type: "fire_evacuation" }),
          makeRecord({ drill_type: "fire_evacuation" }),
          makeRecord({ drill_type: "lockdown" }),
        ];
        expect(computeDrillMetrics(records).fire_evacuation_count).toBe(2);
      });

      it("returns 0 when no fire_evacuation drills exist", () => {
        const records = [makeRecord({ drill_type: "lockdown" })];
        expect(computeDrillMetrics(records).fire_evacuation_count).toBe(0);
      });
    });

    describe("lockdown_count", () => {
      it("counts lockdown drills", () => {
        const records = [
          makeRecord({ drill_type: "lockdown" }),
          makeRecord({ drill_type: "lockdown" }),
          makeRecord({ drill_type: "fire_evacuation" }),
        ];
        expect(computeDrillMetrics(records).lockdown_count).toBe(2);
      });

      it("returns 0 when no lockdown drills exist", () => {
        const records = [makeRecord({ drill_type: "fire_evacuation" })];
        expect(computeDrillMetrics(records).lockdown_count).toBe(0);
      });
    });

    describe("missing_child_count", () => {
      it("counts missing_child drills", () => {
        const records = [
          makeRecord({ drill_type: "missing_child" }),
          makeRecord({ drill_type: "fire_evacuation" }),
          makeRecord({ drill_type: "missing_child" }),
        ];
        expect(computeDrillMetrics(records).missing_child_count).toBe(2);
      });

      it("returns 0 when no missing_child drills exist", () => {
        const records = [makeRecord({ drill_type: "fire_evacuation" })];
        expect(computeDrillMetrics(records).missing_child_count).toBe(0);
      });
    });

    // ── successful_rate ──────────────────────────────────────────────────

    describe("successful_rate", () => {
      it("returns 100 when all drills are successful", () => {
        const records = [
          makeRecord({ drill_outcome: "successful" }),
          makeRecord({ drill_outcome: "successful" }),
        ];
        expect(computeDrillMetrics(records).successful_rate).toBe(100);
      });

      it("returns 0 when no drills are successful", () => {
        const records = [
          makeRecord({ drill_outcome: "failed" }),
          makeRecord({ drill_outcome: "cancelled" }),
        ];
        expect(computeDrillMetrics(records).successful_rate).toBe(0);
      });

      it("returns 50 when half are successful", () => {
        const records = [
          makeRecord({ drill_outcome: "successful" }),
          makeRecord({ drill_outcome: "failed" }),
        ];
        expect(computeDrillMetrics(records).successful_rate).toBe(50);
      });

      it("rounds to one decimal place correctly", () => {
        // 1 of 3 = 33.333... => Math.round(0.3333 * 1000) / 10 = 33.3
        const records = [
          makeRecord({ drill_outcome: "successful" }),
          makeRecord({ drill_outcome: "failed" }),
          makeRecord({ drill_outcome: "failed" }),
        ];
        expect(computeDrillMetrics(records).successful_rate).toBe(33.3);
      });

      it("rounds 2 of 3 correctly", () => {
        // 2 of 3 = 66.666... => Math.round(0.6666 * 1000) / 10 = 66.7
        const records = [
          makeRecord({ drill_outcome: "successful" }),
          makeRecord({ drill_outcome: "successful" }),
          makeRecord({ drill_outcome: "failed" }),
        ];
        expect(computeDrillMetrics(records).successful_rate).toBe(66.7);
      });
    });

    // ── failed_count ─────────────────────────────────────────────────────

    describe("failed_count", () => {
      it("counts failed drills", () => {
        const records = [
          makeRecord({ drill_outcome: "failed" }),
          makeRecord({ drill_outcome: "failed" }),
          makeRecord({ drill_outcome: "successful" }),
        ];
        expect(computeDrillMetrics(records).failed_count).toBe(2);
      });

      it("returns 0 when none failed", () => {
        const records = [makeRecord({ drill_outcome: "successful" })];
        expect(computeDrillMetrics(records).failed_count).toBe(0);
      });
    });

    // ── cancelled_count ──────────────────────────────────────────────────

    describe("cancelled_count", () => {
      it("counts cancelled drills", () => {
        const records = [
          makeRecord({ drill_outcome: "cancelled" }),
          makeRecord({ drill_outcome: "cancelled" }),
          makeRecord({ drill_outcome: "successful" }),
        ];
        expect(computeDrillMetrics(records).cancelled_count).toBe(2);
      });

      it("returns 0 when none cancelled", () => {
        const records = [makeRecord({ drill_outcome: "successful" })];
        expect(computeDrillMetrics(records).cancelled_count).toBe(0);
      });
    });

    // ── all_children_accounted_rate ───────────────────────────────────────

    describe("all_children_accounted_rate", () => {
      it("returns 100 when all accounted", () => {
        const records = [
          makeRecord({ all_children_accounted: true }),
          makeRecord({ all_children_accounted: true }),
        ];
        expect(computeDrillMetrics(records).all_children_accounted_rate).toBe(100);
      });

      it("returns 0 when none accounted", () => {
        const records = [
          makeRecord({ all_children_accounted: false }),
          makeRecord({ all_children_accounted: false }),
        ];
        expect(computeDrillMetrics(records).all_children_accounted_rate).toBe(0);
      });

      it("returns 50 when half accounted", () => {
        const records = [
          makeRecord({ all_children_accounted: true }),
          makeRecord({ all_children_accounted: false }),
        ];
        expect(computeDrillMetrics(records).all_children_accounted_rate).toBe(50);
      });

      it("rounds to one decimal place", () => {
        const records = [
          makeRecord({ all_children_accounted: true }),
          makeRecord({ all_children_accounted: false }),
          makeRecord({ all_children_accounted: false }),
        ];
        expect(computeDrillMetrics(records).all_children_accounted_rate).toBe(33.3);
      });
    });

    // ── all_staff_participated_rate ──────────────────────────────────────

    describe("all_staff_participated_rate", () => {
      it("returns 100 when all participated", () => {
        const records = [
          makeRecord({ all_staff_participated: true }),
          makeRecord({ all_staff_participated: true }),
        ];
        expect(computeDrillMetrics(records).all_staff_participated_rate).toBe(100);
      });

      it("returns 0 when none participated", () => {
        const records = [
          makeRecord({ all_staff_participated: false }),
          makeRecord({ all_staff_participated: false }),
        ];
        expect(computeDrillMetrics(records).all_staff_participated_rate).toBe(0);
      });

      it("returns 50 when half participated", () => {
        const records = [
          makeRecord({ all_staff_participated: true }),
          makeRecord({ all_staff_participated: false }),
        ];
        expect(computeDrillMetrics(records).all_staff_participated_rate).toBe(50);
      });
    });

    // ── assembly_point_used_rate ─────────────────────────────────────────

    describe("assembly_point_used_rate", () => {
      it("returns 100 when always used", () => {
        const records = [
          makeRecord({ assembly_point_used: true }),
          makeRecord({ assembly_point_used: true }),
        ];
        expect(computeDrillMetrics(records).assembly_point_used_rate).toBe(100);
      });

      it("returns 0 when never used", () => {
        const records = [
          makeRecord({ assembly_point_used: false }),
          makeRecord({ assembly_point_used: false }),
        ];
        expect(computeDrillMetrics(records).assembly_point_used_rate).toBe(0);
      });

      it("handles mixed usage", () => {
        const records = [
          makeRecord({ assembly_point_used: true }),
          makeRecord({ assembly_point_used: false }),
          makeRecord({ assembly_point_used: true }),
        ];
        expect(computeDrillMetrics(records).assembly_point_used_rate).toBe(66.7);
      });
    });

    // ── equipment_working_rate ───────────────────────────────────────────

    describe("equipment_working_rate", () => {
      it("returns 100 when all equipment working", () => {
        const records = [
          makeRecord({ equipment_working: true }),
          makeRecord({ equipment_working: true }),
        ];
        expect(computeDrillMetrics(records).equipment_working_rate).toBe(100);
      });

      it("returns 0 when no equipment working", () => {
        const records = [
          makeRecord({ equipment_working: false }),
          makeRecord({ equipment_working: false }),
        ];
        expect(computeDrillMetrics(records).equipment_working_rate).toBe(0);
      });

      it("returns 50 when half working", () => {
        const records = [
          makeRecord({ equipment_working: true }),
          makeRecord({ equipment_working: false }),
        ];
        expect(computeDrillMetrics(records).equipment_working_rate).toBe(50);
      });
    });

    // ── children_distressed_count ────────────────────────────────────────

    describe("children_distressed_count", () => {
      it("counts drills where children were distressed", () => {
        const records = [
          makeRecord({ children_distressed: true }),
          makeRecord({ children_distressed: true }),
          makeRecord({ children_distressed: false }),
        ];
        expect(computeDrillMetrics(records).children_distressed_count).toBe(2);
      });

      it("returns 0 when no children distressed", () => {
        const records = [
          makeRecord({ children_distressed: false }),
          makeRecord({ children_distressed: false }),
        ];
        expect(computeDrillMetrics(records).children_distressed_count).toBe(0);
      });
    });

    // ── average_evacuation_time ──────────────────────────────────────────

    describe("average_evacuation_time", () => {
      it("returns 0 when no evacuation times recorded", () => {
        const records = [
          makeRecord({ evacuation_time_seconds: null }),
          makeRecord({ evacuation_time_seconds: null }),
        ];
        expect(computeDrillMetrics(records).average_evacuation_time).toBeNull();;
      });

      it("returns the single time when only one recorded", () => {
        const records = [makeRecord({ evacuation_time_seconds: 120 })];
        expect(computeDrillMetrics(records).average_evacuation_time).toBe(120);
      });

      it("averages multiple evacuation times", () => {
        const records = [
          makeRecord({ evacuation_time_seconds: 100 }),
          makeRecord({ evacuation_time_seconds: 200 }),
        ];
        expect(computeDrillMetrics(records).average_evacuation_time).toBe(150);
      });

      it("ignores null evacuation times in average", () => {
        const records = [
          makeRecord({ evacuation_time_seconds: 100 }),
          makeRecord({ evacuation_time_seconds: null }),
          makeRecord({ evacuation_time_seconds: 200 }),
        ];
        expect(computeDrillMetrics(records).average_evacuation_time).toBe(150);
      });

      it("rounds to one decimal place", () => {
        // (100 + 200 + 300) / 3 = 200.0
        const records = [
          makeRecord({ evacuation_time_seconds: 100 }),
          makeRecord({ evacuation_time_seconds: 200 }),
          makeRecord({ evacuation_time_seconds: 300 }),
        ];
        expect(computeDrillMetrics(records).average_evacuation_time).toBe(200);
      });

      it("rounds non-integer average correctly", () => {
        // (90 + 110) / 2 = 100.0
        const records = [
          makeRecord({ evacuation_time_seconds: 90 }),
          makeRecord({ evacuation_time_seconds: 110 }),
        ];
        expect(computeDrillMetrics(records).average_evacuation_time).toBe(100);
      });

      it("rounds fractional average to one decimal", () => {
        // (100 + 101 + 102) / 3 = 101.0
        const records = [
          makeRecord({ evacuation_time_seconds: 100 }),
          makeRecord({ evacuation_time_seconds: 101 }),
          makeRecord({ evacuation_time_seconds: 102 }),
        ];
        expect(computeDrillMetrics(records).average_evacuation_time).toBe(101);
      });

      it("handles all null evacuation times returning 0", () => {
        const records = [
          makeRecord({ evacuation_time_seconds: null }),
        ];
        expect(computeDrillMetrics(records).average_evacuation_time).toBeNull();;
      });
    });

    // ── fully_prepared_rate ──────────────────────────────────────────────

    describe("fully_prepared_rate", () => {
      it("returns 100 when all fully prepared", () => {
        const records = [
          makeRecord({ staff_readiness: "fully_prepared" }),
          makeRecord({ staff_readiness: "fully_prepared" }),
        ];
        expect(computeDrillMetrics(records).fully_prepared_rate).toBe(100);
      });

      it("returns 0 when none fully prepared", () => {
        const records = [
          makeRecord({ staff_readiness: "unprepared" }),
          makeRecord({ staff_readiness: "mostly_prepared" }),
        ];
        expect(computeDrillMetrics(records).fully_prepared_rate).toBe(0);
      });

      it("returns 50 when half fully prepared", () => {
        const records = [
          makeRecord({ staff_readiness: "fully_prepared" }),
          makeRecord({ staff_readiness: "mostly_prepared" }),
        ];
        expect(computeDrillMetrics(records).fully_prepared_rate).toBe(50);
      });

      it("rounds to one decimal place", () => {
        const records = [
          makeRecord({ staff_readiness: "fully_prepared" }),
          makeRecord({ staff_readiness: "unprepared" }),
          makeRecord({ staff_readiness: "unprepared" }),
        ];
        expect(computeDrillMetrics(records).fully_prepared_rate).toBe(33.3);
      });
    });

    // ── unprepared_count ─────────────────────────────────────────────────

    describe("unprepared_count", () => {
      it("counts unprepared drills", () => {
        const records = [
          makeRecord({ staff_readiness: "unprepared" }),
          makeRecord({ staff_readiness: "unprepared" }),
          makeRecord({ staff_readiness: "fully_prepared" }),
        ];
        expect(computeDrillMetrics(records).unprepared_count).toBe(2);
      });

      it("returns 0 when none unprepared", () => {
        const records = [
          makeRecord({ staff_readiness: "fully_prepared" }),
          makeRecord({ staff_readiness: "mostly_prepared" }),
        ];
        expect(computeDrillMetrics(records).unprepared_count).toBe(0);
      });

      it("does not count partially_prepared as unprepared", () => {
        const records = [
          makeRecord({ staff_readiness: "partially_prepared" }),
        ];
        expect(computeDrillMetrics(records).unprepared_count).toBe(0);
      });
    });

    // ── drill_overdue_count ──────────────────────────────────────────────

    describe("drill_overdue_count", () => {
      it("counts records with past next_drill_date", () => {
        const records = [
          makeRecord({ next_drill_date: daysAgo(10) }),
          makeRecord({ next_drill_date: daysAgo(5) }),
        ];
        expect(computeDrillMetrics(records).drill_overdue_count).toBe(2);
      });

      it("does not count records with future next_drill_date", () => {
        const records = [
          makeRecord({ next_drill_date: daysFromNow(10) }),
          makeRecord({ next_drill_date: daysFromNow(30) }),
        ];
        expect(computeDrillMetrics(records).drill_overdue_count).toBe(0);
      });

      it("does not count records with null next_drill_date", () => {
        const records = [
          makeRecord({ next_drill_date: null }),
          makeRecord({ next_drill_date: null }),
        ];
        expect(computeDrillMetrics(records).drill_overdue_count).toBe(0);
      });

      it("counts mixed past and future dates correctly", () => {
        const records = [
          makeRecord({ next_drill_date: daysAgo(10) }),
          makeRecord({ next_drill_date: daysFromNow(10) }),
          makeRecord({ next_drill_date: null }),
        ];
        expect(computeDrillMetrics(records).drill_overdue_count).toBe(1);
      });

      it("counts a date far in the past as overdue", () => {
        const records = [
          makeRecord({ next_drill_date: "2020-01-01" }),
        ];
        expect(computeDrillMetrics(records).drill_overdue_count).toBe(1);
      });
    });

    // ── by_drill_type ────────────────────────────────────────────────────

    describe("by_drill_type", () => {
      it("groups by drill type", () => {
        const records = [
          makeRecord({ drill_type: "fire_evacuation" }),
          makeRecord({ drill_type: "fire_evacuation" }),
          makeRecord({ drill_type: "lockdown" }),
          makeRecord({ drill_type: "missing_child" }),
        ];
        const m = computeDrillMetrics(records);
        expect(m.by_drill_type).toEqual({
          fire_evacuation: 2,
          lockdown: 1,
          missing_child: 1,
        });
      });

      it("handles a single drill type", () => {
        const records = [makeRecord({ drill_type: "bomb_threat" })];
        const m = computeDrillMetrics(records);
        expect(m.by_drill_type).toEqual({ bomb_threat: 1 });
      });

      it("handles all drill types", () => {
        const records = [
          makeRecord({ drill_type: "fire_evacuation" }),
          makeRecord({ drill_type: "lockdown" }),
          makeRecord({ drill_type: "missing_child" }),
          makeRecord({ drill_type: "bomb_threat" }),
          makeRecord({ drill_type: "intruder" }),
          makeRecord({ drill_type: "flood" }),
          makeRecord({ drill_type: "power_failure" }),
          makeRecord({ drill_type: "gas_leak" }),
          makeRecord({ drill_type: "other" }),
        ];
        const m = computeDrillMetrics(records);
        expect(Object.keys(m.by_drill_type)).toHaveLength(9);
      });
    });

    // ── by_drill_outcome ─────────────────────────────────────────────────

    describe("by_drill_outcome", () => {
      it("groups by drill outcome", () => {
        const records = [
          makeRecord({ drill_outcome: "successful" }),
          makeRecord({ drill_outcome: "successful" }),
          makeRecord({ drill_outcome: "failed" }),
          makeRecord({ drill_outcome: "cancelled" }),
        ];
        const m = computeDrillMetrics(records);
        expect(m.by_drill_outcome).toEqual({
          successful: 2,
          failed: 1,
          cancelled: 1,
        });
      });

      it("handles all outcomes", () => {
        const records = [
          makeRecord({ drill_outcome: "successful" }),
          makeRecord({ drill_outcome: "partial_success" }),
          makeRecord({ drill_outcome: "failed" }),
          makeRecord({ drill_outcome: "cancelled" }),
          makeRecord({ drill_outcome: "not_assessed" }),
        ];
        const m = computeDrillMetrics(records);
        expect(Object.keys(m.by_drill_outcome)).toHaveLength(5);
      });
    });

    // ── by_time_of_day ───────────────────────────────────────────────────

    describe("by_time_of_day", () => {
      it("groups by time of day", () => {
        const records = [
          makeRecord({ time_of_day: "day_shift" }),
          makeRecord({ time_of_day: "day_shift" }),
          makeRecord({ time_of_day: "evening_shift" }),
          makeRecord({ time_of_day: "night_shift" }),
        ];
        const m = computeDrillMetrics(records);
        expect(m.by_time_of_day).toEqual({
          day_shift: 2,
          evening_shift: 1,
          night_shift: 1,
        });
      });

      it("handles all time-of-day values", () => {
        const records = [
          makeRecord({ time_of_day: "day_shift" }),
          makeRecord({ time_of_day: "evening_shift" }),
          makeRecord({ time_of_day: "night_shift" }),
          makeRecord({ time_of_day: "waking_night" }),
          makeRecord({ time_of_day: "weekend" }),
        ];
        const m = computeDrillMetrics(records);
        expect(Object.keys(m.by_time_of_day)).toHaveLength(5);
      });
    });

    // ── by_staff_readiness ───────────────────────────────────────────────

    describe("by_staff_readiness", () => {
      it("groups by staff readiness", () => {
        const records = [
          makeRecord({ staff_readiness: "fully_prepared" }),
          makeRecord({ staff_readiness: "fully_prepared" }),
          makeRecord({ staff_readiness: "unprepared" }),
        ];
        const m = computeDrillMetrics(records);
        expect(m.by_staff_readiness).toEqual({
          fully_prepared: 2,
          unprepared: 1,
        });
      });

      it("handles all readiness levels", () => {
        const records = [
          makeRecord({ staff_readiness: "fully_prepared" }),
          makeRecord({ staff_readiness: "mostly_prepared" }),
          makeRecord({ staff_readiness: "partially_prepared" }),
          makeRecord({ staff_readiness: "unprepared" }),
          makeRecord({ staff_readiness: "not_assessed" }),
        ];
        const m = computeDrillMetrics(records);
        expect(Object.keys(m.by_staff_readiness)).toHaveLength(5);
      });
    });

    // ── Mixed dataset ────────────────────────────────────────────────────

    describe("mixed dataset", () => {
      const records = [
        makeRecord({
          drill_type: "fire_evacuation",
          drill_outcome: "successful",
          all_children_accounted: true,
          all_staff_participated: true,
          assembly_point_used: true,
          equipment_working: true,
          children_distressed: false,
          evacuation_time_seconds: 120,
          staff_readiness: "fully_prepared",
          time_of_day: "day_shift",
          next_drill_date: daysFromNow(30),
        }),
        makeRecord({
          drill_type: "lockdown",
          drill_outcome: "failed",
          all_children_accounted: false,
          all_staff_participated: false,
          assembly_point_used: false,
          equipment_working: false,
          children_distressed: true,
          evacuation_time_seconds: 300,
          staff_readiness: "unprepared",
          time_of_day: "night_shift",
          next_drill_date: daysAgo(10),
        }),
        makeRecord({
          drill_type: "missing_child",
          drill_outcome: "cancelled",
          all_children_accounted: true,
          all_staff_participated: true,
          assembly_point_used: true,
          equipment_working: true,
          children_distressed: false,
          evacuation_time_seconds: null,
          staff_readiness: "mostly_prepared",
          time_of_day: "evening_shift",
          next_drill_date: null,
        }),
        makeRecord({
          drill_type: "fire_evacuation",
          drill_outcome: "successful",
          all_children_accounted: true,
          all_staff_participated: false,
          assembly_point_used: true,
          equipment_working: true,
          children_distressed: false,
          evacuation_time_seconds: 90,
          staff_readiness: "fully_prepared",
          time_of_day: "day_shift",
          next_drill_date: daysFromNow(60),
        }),
      ];

      it("total_drills is 4", () => {
        expect(computeDrillMetrics(records).total_drills).toBe(4);
      });

      it("fire_evacuation_count is 2", () => {
        expect(computeDrillMetrics(records).fire_evacuation_count).toBe(2);
      });

      it("lockdown_count is 1", () => {
        expect(computeDrillMetrics(records).lockdown_count).toBe(1);
      });

      it("missing_child_count is 1", () => {
        expect(computeDrillMetrics(records).missing_child_count).toBe(1);
      });

      it("successful_rate is 50", () => {
        // 2 / 4 = 50%
        expect(computeDrillMetrics(records).successful_rate).toBe(50);
      });

      it("failed_count is 1", () => {
        expect(computeDrillMetrics(records).failed_count).toBe(1);
      });

      it("cancelled_count is 1", () => {
        expect(computeDrillMetrics(records).cancelled_count).toBe(1);
      });

      it("all_children_accounted_rate is 75", () => {
        // 3 / 4 = 75%
        expect(computeDrillMetrics(records).all_children_accounted_rate).toBe(75);
      });

      it("all_staff_participated_rate is 50", () => {
        // 2 / 4 = 50%
        expect(computeDrillMetrics(records).all_staff_participated_rate).toBe(50);
      });

      it("assembly_point_used_rate is 75", () => {
        // 3 / 4 = 75%
        expect(computeDrillMetrics(records).assembly_point_used_rate).toBe(75);
      });

      it("equipment_working_rate is 75", () => {
        // 3 / 4 = 75%
        expect(computeDrillMetrics(records).equipment_working_rate).toBe(75);
      });

      it("children_distressed_count is 1", () => {
        expect(computeDrillMetrics(records).children_distressed_count).toBe(1);
      });

      it("average_evacuation_time is 170", () => {
        // (120 + 300 + 90) / 3 = 170
        expect(computeDrillMetrics(records).average_evacuation_time).toBe(170);
      });

      it("fully_prepared_rate is 50", () => {
        // 2 / 4 = 50%
        expect(computeDrillMetrics(records).fully_prepared_rate).toBe(50);
      });

      it("unprepared_count is 1", () => {
        expect(computeDrillMetrics(records).unprepared_count).toBe(1);
      });

      it("drill_overdue_count is 1", () => {
        expect(computeDrillMetrics(records).drill_overdue_count).toBe(1);
      });

      it("by_drill_type groups correctly", () => {
        expect(computeDrillMetrics(records).by_drill_type).toEqual({
          fire_evacuation: 2,
          lockdown: 1,
          missing_child: 1,
        });
      });

      it("by_drill_outcome groups correctly", () => {
        expect(computeDrillMetrics(records).by_drill_outcome).toEqual({
          successful: 2,
          failed: 1,
          cancelled: 1,
        });
      });

      it("by_time_of_day groups correctly", () => {
        expect(computeDrillMetrics(records).by_time_of_day).toEqual({
          day_shift: 2,
          night_shift: 1,
          evening_shift: 1,
        });
      });

      it("by_staff_readiness groups correctly", () => {
        expect(computeDrillMetrics(records).by_staff_readiness).toEqual({
          fully_prepared: 2,
          unprepared: 1,
          mostly_prepared: 1,
        });
      });
    });

    // ── Single record metrics ────────────────────────────────────────────

    describe("single record metrics", () => {
      it("all rates are 100 for single successful record", () => {
        const records = [
          makeRecord({
            drill_outcome: "successful",
            all_children_accounted: true,
            all_staff_participated: true,
            assembly_point_used: true,
            equipment_working: true,
            staff_readiness: "fully_prepared",
          }),
        ];
        const m = computeDrillMetrics(records);
        expect(m.successful_rate).toBe(100);
        expect(m.all_children_accounted_rate).toBe(100);
        expect(m.all_staff_participated_rate).toBe(100);
        expect(m.assembly_point_used_rate).toBe(100);
        expect(m.equipment_working_rate).toBe(100);
        expect(m.fully_prepared_rate).toBe(100);
      });

      it("all rates are 0 for single failed record with all false booleans", () => {
        const records = [
          makeRecord({
            drill_outcome: "failed",
            all_children_accounted: false,
            all_staff_participated: false,
            assembly_point_used: false,
            equipment_working: false,
            staff_readiness: "unprepared",
          }),
        ];
        const m = computeDrillMetrics(records);
        expect(m.successful_rate).toBe(0);
        expect(m.all_children_accounted_rate).toBe(0);
        expect(m.all_staff_participated_rate).toBe(0);
        expect(m.assembly_point_used_rate).toBe(0);
        expect(m.equipment_working_rate).toBe(0);
        expect(m.fully_prepared_rate).toBe(0);
      });

      it("evacuation time is exact value for single record", () => {
        const records = [makeRecord({ evacuation_time_seconds: 87 })];
        expect(computeDrillMetrics(records).average_evacuation_time).toBe(87);
      });
    });

    // ── Large dataset ────────────────────────────────────────────────────

    describe("large dataset (20+ records)", () => {
      const largeRecords: EmergencyDrillRecord[] = [];
      for (let i = 0; i < 25; i++) {
        largeRecords.push(
          makeRecord({
            drill_type: i % 3 === 0 ? "fire_evacuation" : i % 3 === 1 ? "lockdown" : "missing_child",
            drill_outcome: i % 5 === 0 ? "failed" : "successful",
            all_children_accounted: i % 7 !== 0,
            all_staff_participated: i % 4 !== 0,
            assembly_point_used: i % 6 !== 0,
            equipment_working: i % 8 !== 0,
            children_distressed: i % 10 === 0,
            evacuation_time_seconds: i % 2 === 0 ? 100 + i * 10 : null,
            staff_readiness: i % 5 === 0 ? "unprepared" : "fully_prepared",
            time_of_day: i % 2 === 0 ? "day_shift" : "night_shift",
            next_drill_date: i % 3 === 0 ? daysAgo(5) : daysFromNow(30),
          }),
        );
      }

      it("total_drills equals 25", () => {
        expect(computeDrillMetrics(largeRecords).total_drills).toBe(25);
      });

      it("fire_evacuation_count equals 9", () => {
        // i % 3 === 0: indices 0,3,6,9,12,15,18,21,24 = 9
        expect(computeDrillMetrics(largeRecords).fire_evacuation_count).toBe(9);
      });

      it("lockdown_count equals 8", () => {
        // i % 3 === 1: indices 1,4,7,10,13,16,19,22 = 8
        expect(computeDrillMetrics(largeRecords).lockdown_count).toBe(8);
      });

      it("missing_child_count equals 8", () => {
        // i % 3 === 2: indices 2,5,8,11,14,17,20,23 = 8
        expect(computeDrillMetrics(largeRecords).missing_child_count).toBe(8);
      });

      it("failed_count equals 5", () => {
        // i % 5 === 0: indices 0,5,10,15,20 = 5
        expect(computeDrillMetrics(largeRecords).failed_count).toBe(5);
      });

      it("unprepared_count equals 5", () => {
        // i % 5 === 0: indices 0,5,10,15,20 = 5
        expect(computeDrillMetrics(largeRecords).unprepared_count).toBe(5);
      });

      it("by_drill_type has correct keys", () => {
        const m = computeDrillMetrics(largeRecords);
        expect(Object.keys(m.by_drill_type).sort()).toEqual(["fire_evacuation", "lockdown", "missing_child"]);
      });

      it("by_time_of_day sums to total", () => {
        const m = computeDrillMetrics(largeRecords);
        const sum = Object.values(m.by_time_of_day).reduce((a, b) => a + b, 0);
        expect(sum).toBe(25);
      });

      it("by_drill_outcome sums to total", () => {
        const m = computeDrillMetrics(largeRecords);
        const sum = Object.values(m.by_drill_outcome).reduce((a, b) => a + b, 0);
        expect(sum).toBe(25);
      });

      it("by_staff_readiness sums to total", () => {
        const m = computeDrillMetrics(largeRecords);
        const sum = Object.values(m.by_staff_readiness).reduce((a, b) => a + b, 0);
        expect(sum).toBe(25);
      });

      it("children_distressed_count equals 3", () => {
        // i % 10 === 0: indices 0,10,20 = 3
        expect(computeDrillMetrics(largeRecords).children_distressed_count).toBe(3);
      });

      it("average_evacuation_time is computed from non-null entries only", () => {
        const m = computeDrillMetrics(largeRecords);
        // i % 2 === 0: indices 0,2,4,6,8,10,12,14,16,18,20,22,24 = 13 values
        // values: 100,120,140,160,180,200,220,240,260,280,300,320,340
        const expected = (100 + 120 + 140 + 160 + 180 + 200 + 220 + 240 + 260 + 280 + 300 + 320 + 340) / 13;
        expect(m.average_evacuation_time).toBe(Math.round(expected * 10) / 10);
      });
    });

    // ── Edge cases ───────────────────────────────────────────────────────

    describe("edge cases", () => {
      it("handles 1 of 7 successful for rate rounding", () => {
        // 1/7 = 14.285... => Math.round(142.857) / 10 = 14.3
        const records = [
          makeRecord({ drill_outcome: "successful" }),
          ...Array.from({ length: 6 }, () => makeRecord({ drill_outcome: "failed" })),
        ];
        expect(computeDrillMetrics(records).successful_rate).toBe(14.3);
      });

      it("handles 3 of 7 successful for rate rounding", () => {
        // 3/7 = 42.857... => Math.round(428.57) / 10 = 42.9
        const records = [
          ...Array.from({ length: 3 }, () => makeRecord({ drill_outcome: "successful" })),
          ...Array.from({ length: 4 }, () => makeRecord({ drill_outcome: "failed" })),
        ];
        expect(computeDrillMetrics(records).successful_rate).toBe(42.9);
      });

      it("handles 5 of 6 successful for rate rounding", () => {
        // 5/6 = 83.333... => Math.round(833.33) / 10 = 83.3
        const records = [
          ...Array.from({ length: 5 }, () => makeRecord({ drill_outcome: "successful" })),
          makeRecord({ drill_outcome: "failed" }),
        ];
        expect(computeDrillMetrics(records).successful_rate).toBe(83.3);
      });

      it("only fire_evacuation, lockdown, missing_child have dedicated counts", () => {
        const records = [
          makeRecord({ drill_type: "bomb_threat" }),
          makeRecord({ drill_type: "intruder" }),
          makeRecord({ drill_type: "flood" }),
        ];
        const m = computeDrillMetrics(records);
        expect(m.fire_evacuation_count).toBe(0);
        expect(m.lockdown_count).toBe(0);
        expect(m.missing_child_count).toBe(0);
        expect(m.by_drill_type).toEqual({ bomb_threat: 1, intruder: 1, flood: 1 });
      });

      it("evacuation time average with single 0 value", () => {
        const records = [makeRecord({ evacuation_time_seconds: 0 })];
        expect(computeDrillMetrics(records).average_evacuation_time).toBe(0);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // identifyDrillAlerts
  // ══════════════════════════════════════════════════════════════════════════

  describe("identifyDrillAlerts", () => {
    // ── No alerts ────────────────────────────────────────────────────────

    describe("no alerts", () => {
      it("returns empty array when no records", () => {
        const alerts = identifyDrillAlerts([]);
        expect(alerts).toHaveLength(0);
      });

      it("returns empty array when all conditions are good", () => {
        const records = [
          makeRecord({
            all_children_accounted: true,
            drill_outcome: "successful",
            staff_readiness: "fully_prepared",
            equipment_working: true,
            next_drill_date: daysFromNow(30),
          }),
        ];
        const alerts = identifyDrillAlerts(records);
        expect(alerts).toEqual([]);
      });

      it("returns empty when single record is clean with future drill date", () => {
        const records = [
          makeRecord({
            all_children_accounted: true,
            drill_outcome: "successful",
            staff_readiness: "fully_prepared",
            equipment_working: true,
            next_drill_date: daysFromNow(10),
          }),
        ];
        const alerts = identifyDrillAlerts(records);
        expect(alerts).toEqual([]);
      });

      it("returns empty when cancelled drill has all_children_accounted false (excluded)", () => {
        const records = [
          makeRecord({
            all_children_accounted: false,
            drill_outcome: "cancelled",
            staff_readiness: "fully_prepared",
            equipment_working: true,
          }),
        ];
        const alerts = identifyDrillAlerts(records);
        const childAlerts = alerts.filter((a) => a.type === "children_not_accounted");
        expect(childAlerts).toHaveLength(0);
      });

      it("returns empty for mostly_prepared readiness (not unprepared)", () => {
        const records = [
          makeRecord({
            all_children_accounted: true,
            drill_outcome: "successful",
            staff_readiness: "mostly_prepared",
            equipment_working: true,
          }),
        ];
        const alerts = identifyDrillAlerts(records);
        expect(alerts).toEqual([]);
      });

      it("returns empty for partially_prepared readiness (not unprepared)", () => {
        const records = [
          makeRecord({
            all_children_accounted: true,
            drill_outcome: "successful",
            staff_readiness: "partially_prepared",
            equipment_working: true,
          }),
        ];
        const alerts = identifyDrillAlerts(records);
        expect(alerts).toEqual([]);
      });

      it("returns empty when next_drill_date is null (not overdue)", () => {
        const records = [
          makeRecord({
            all_children_accounted: true,
            drill_outcome: "successful",
            staff_readiness: "fully_prepared",
            equipment_working: true,
            next_drill_date: null,
          }),
        ];
        const alerts = identifyDrillAlerts(records);
        expect(alerts).toEqual([]);
      });
    });

    // ── children_not_accounted alert ─────────────────────────────────────

    describe("children_not_accounted alert", () => {
      it("fires when all_children_accounted is false", () => {
        const records = [makeRecord({ all_children_accounted: false, drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted");
        expect(alert).toBeDefined();
      });

      it("has severity critical", () => {
        const records = [makeRecord({ all_children_accounted: false, drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted")!;
        expect(alert.severity).toBe("critical");
      });

      it("uses the record id as alert id", () => {
        const records = [makeRecord({ id: "child-miss-1", all_children_accounted: false, drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted")!;
        expect(alert.id).toBe("child-miss-1");
      });

      it("includes drill_date in message", () => {
        const records = [makeRecord({ all_children_accounted: false, drill_date: "2026-04-15" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted")!;
        expect(alert.message).toContain("2026-04-15");
      });

      it("includes drill type in message with underscores replaced by spaces", () => {
        const records = [makeRecord({ all_children_accounted: false, drill_type: "fire_evacuation", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted")!;
        expect(alert.message).toContain("fire evacuation");
      });

      it("fires per record for multiple unaccounted records", () => {
        const records = [
          makeRecord({ all_children_accounted: false, drill_date: "2026-05-01" }),
          makeRecord({ all_children_accounted: false, drill_date: "2026-04-01" }),
          makeRecord({ all_children_accounted: false, drill_date: "2026-03-01" }),
        ];
        const alerts = identifyDrillAlerts(records);
        const childAlerts = alerts.filter((a) => a.type === "children_not_accounted");
        expect(childAlerts).toHaveLength(3);
      });

      it("does not fire when all_children_accounted is true", () => {
        const records = [makeRecord({ all_children_accounted: true })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted");
        expect(alert).toBeUndefined();
      });

      it("excludes cancelled drills", () => {
        const records = [makeRecord({ all_children_accounted: false, drill_outcome: "cancelled" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted");
        expect(alert).toBeUndefined();
      });

      it("includes non-cancelled drills with failed outcome", () => {
        const records = [makeRecord({ all_children_accounted: false, drill_outcome: "failed", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted");
        expect(alert).toBeDefined();
      });

      it("includes non-cancelled drills with partial_success outcome", () => {
        const records = [makeRecord({ all_children_accounted: false, drill_outcome: "partial_success", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted");
        expect(alert).toBeDefined();
      });

      it("message contains review procedures immediately wording", () => {
        const records = [makeRecord({ all_children_accounted: false, drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted")!;
        expect(alert.message).toContain("review procedures immediately");
      });
    });

    // ── drill_failed alert ───────────────────────────────────────────────

    describe("drill_failed alert", () => {
      it("fires for drill_outcome = failed", () => {
        const records = [makeRecord({ drill_outcome: "failed", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed");
        expect(alert).toBeDefined();
      });

      it("has severity high", () => {
        const records = [makeRecord({ drill_outcome: "failed", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed")!;
        expect(alert.severity).toBe("high");
      });

      it("uses the record id as alert id", () => {
        const records = [makeRecord({ id: "fail-1", drill_outcome: "failed", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed")!;
        expect(alert.id).toBe("fail-1");
      });

      it("includes drill_date in message", () => {
        const records = [makeRecord({ drill_outcome: "failed", drill_date: "2026-03-20" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed")!;
        expect(alert.message).toContain("2026-03-20");
      });

      it("includes drill_type in message with underscores replaced by spaces", () => {
        const records = [makeRecord({ drill_outcome: "failed", drill_type: "missing_child", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed")!;
        expect(alert.message).toContain("missing child");
      });

      it("fires per record for multiple failed drills", () => {
        const records = [
          makeRecord({ drill_outcome: "failed", drill_date: "2026-05-01" }),
          makeRecord({ drill_outcome: "failed", drill_date: "2026-04-01" }),
        ];
        const alerts = identifyDrillAlerts(records);
        const failAlerts = alerts.filter((a) => a.type === "drill_failed");
        expect(failAlerts).toHaveLength(2);
      });

      it("does not fire for successful outcome", () => {
        const records = [makeRecord({ drill_outcome: "successful" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed");
        expect(alert).toBeUndefined();
      });

      it("does not fire for partial_success outcome", () => {
        const records = [makeRecord({ drill_outcome: "partial_success" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed");
        expect(alert).toBeUndefined();
      });

      it("does not fire for cancelled outcome", () => {
        const records = [makeRecord({ drill_outcome: "cancelled" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed");
        expect(alert).toBeUndefined();
      });

      it("does not fire for not_assessed outcome", () => {
        const records = [makeRecord({ drill_outcome: "not_assessed" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed");
        expect(alert).toBeUndefined();
      });

      it("message contains retrain staff and repeat drill wording", () => {
        const records = [makeRecord({ drill_outcome: "failed", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed")!;
        expect(alert.message).toContain("retrain staff and repeat drill");
      });
    });

    // ── staff_unprepared alert ───────────────────────────────────────────

    describe("staff_unprepared alert", () => {
      it("fires when 1 drill has unprepared staff", () => {
        const records = [makeRecord({ staff_readiness: "unprepared" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared");
        expect(alert).toBeDefined();
      });

      it("has severity high", () => {
        const records = [makeRecord({ staff_readiness: "unprepared" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared")!;
        expect(alert.severity).toBe("high");
      });

      it("has id staff_unprepared", () => {
        const records = [makeRecord({ staff_readiness: "unprepared" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared")!;
        expect(alert.id).toBe("staff_unprepared");
      });

      it("uses singular wording for 1 drill", () => {
        const records = [makeRecord({ staff_readiness: "unprepared" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared")!;
        expect(alert.message).toContain("1 drill shows");
      });

      it("uses plural wording for 2 drills", () => {
        const records = [
          makeRecord({ staff_readiness: "unprepared" }),
          makeRecord({ staff_readiness: "unprepared" }),
        ];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared")!;
        expect(alert.message).toContain("2 drills show");
      });

      it("uses plural wording for 5 drills", () => {
        const records = Array.from({ length: 5 }, () => makeRecord({ staff_readiness: "unprepared" }));
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared")!;
        expect(alert.message).toContain("5 drills show");
      });

      it("does not fire when staff are fully_prepared", () => {
        const records = [makeRecord({ staff_readiness: "fully_prepared" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared");
        expect(alert).toBeUndefined();
      });

      it("does not fire when staff are mostly_prepared", () => {
        const records = [makeRecord({ staff_readiness: "mostly_prepared" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared");
        expect(alert).toBeUndefined();
      });

      it("does not fire when staff are partially_prepared", () => {
        const records = [makeRecord({ staff_readiness: "partially_prepared" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared");
        expect(alert).toBeUndefined();
      });

      it("does not fire when staff readiness is not_assessed", () => {
        const records = [makeRecord({ staff_readiness: "not_assessed" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared");
        expect(alert).toBeUndefined();
      });

      it("message contains arrange refresher training wording", () => {
        const records = [makeRecord({ staff_readiness: "unprepared" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "staff_unprepared")!;
        expect(alert.message).toContain("arrange refresher training");
      });

      it("fires only one aggregate alert even with multiple unprepared records", () => {
        const records = [
          makeRecord({ staff_readiness: "unprepared" }),
          makeRecord({ staff_readiness: "unprepared" }),
          makeRecord({ staff_readiness: "unprepared" }),
        ];
        const alerts = identifyDrillAlerts(records);
        const staffAlerts = alerts.filter((a) => a.type === "staff_unprepared");
        expect(staffAlerts).toHaveLength(1);
      });
    });

    // ── equipment_fault alert ────────────────────────────────────────────

    describe("equipment_fault alert", () => {
      it("fires when 1 drill has equipment not working", () => {
        const records = [makeRecord({ equipment_working: false })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "equipment_fault");
        expect(alert).toBeDefined();
      });

      it("has severity high", () => {
        const records = [makeRecord({ equipment_working: false })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "equipment_fault")!;
        expect(alert.severity).toBe("high");
      });

      it("has id equipment_fault", () => {
        const records = [makeRecord({ equipment_working: false })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "equipment_fault")!;
        expect(alert.id).toBe("equipment_fault");
      });

      it("uses singular wording for 1 drill", () => {
        const records = [makeRecord({ equipment_working: false })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "equipment_fault")!;
        expect(alert.message).toContain("1 drill");
      });

      it("uses plural wording for 3 drills", () => {
        const records = [
          makeRecord({ equipment_working: false }),
          makeRecord({ equipment_working: false }),
          makeRecord({ equipment_working: false }),
        ];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "equipment_fault")!;
        expect(alert.message).toContain("3 drills");
      });

      it("excludes cancelled drills from equipment fault count", () => {
        const records = [
          makeRecord({ equipment_working: false, drill_outcome: "cancelled" }),
        ];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "equipment_fault");
        expect(alert).toBeUndefined();
      });

      it("includes non-cancelled drills with equipment not working", () => {
        const records = [
          makeRecord({ equipment_working: false, drill_outcome: "successful" }),
          makeRecord({ equipment_working: false, drill_outcome: "cancelled" }),
        ];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "equipment_fault")!;
        expect(alert.message).toContain("1 drill");
      });

      it("does not fire when all equipment is working", () => {
        const records = [makeRecord({ equipment_working: true })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "equipment_fault");
        expect(alert).toBeUndefined();
      });

      it("message contains repair or replace immediately wording", () => {
        const records = [makeRecord({ equipment_working: false })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "equipment_fault")!;
        expect(alert.message).toContain("repair or replace immediately");
      });

      it("fires only one aggregate alert even with multiple equipment faults", () => {
        const records = [
          makeRecord({ equipment_working: false }),
          makeRecord({ equipment_working: false }),
        ];
        const alerts = identifyDrillAlerts(records);
        const equipAlerts = alerts.filter((a) => a.type === "equipment_fault");
        expect(equipAlerts).toHaveLength(1);
      });
    });

    // ── drill_overdue alert ──────────────────────────────────────────────

    describe("drill_overdue alert", () => {
      it("fires when 1 drill is overdue", () => {
        const records = [makeRecord({ next_drill_date: daysAgo(5) })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue");
        expect(alert).toBeDefined();
      });

      it("has severity medium", () => {
        const records = [makeRecord({ next_drill_date: daysAgo(5) })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue")!;
        expect(alert.severity).toBe("medium");
      });

      it("has id drill_overdue", () => {
        const records = [makeRecord({ next_drill_date: daysAgo(5) })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue")!;
        expect(alert.id).toBe("drill_overdue");
      });

      it("uses singular wording for 1 overdue drill", () => {
        const records = [makeRecord({ next_drill_date: daysAgo(5) })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue")!;
        expect(alert.message).toContain("1 drill is");
      });

      it("uses plural wording for 2 overdue drills", () => {
        const records = [
          makeRecord({ next_drill_date: daysAgo(5) }),
          makeRecord({ next_drill_date: daysAgo(10) }),
        ];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue")!;
        expect(alert.message).toContain("2 drills are");
      });

      it("uses plural wording for 4 overdue drills", () => {
        const records = Array.from({ length: 4 }, () => makeRecord({ next_drill_date: daysAgo(5) }));
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue")!;
        expect(alert.message).toContain("4 drills are");
      });

      it("does not fire when next_drill_date is in the future", () => {
        const records = [makeRecord({ next_drill_date: daysFromNow(30) })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue");
        expect(alert).toBeUndefined();
      });

      it("does not fire when next_drill_date is null", () => {
        const records = [makeRecord({ next_drill_date: null })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue");
        expect(alert).toBeUndefined();
      });

      it("counts only overdue drills, not future or null", () => {
        const records = [
          makeRecord({ next_drill_date: daysAgo(5) }),
          makeRecord({ next_drill_date: daysFromNow(30) }),
          makeRecord({ next_drill_date: null }),
          makeRecord({ next_drill_date: daysAgo(15) }),
        ];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue")!;
        expect(alert.message).toContain("2 drills are");
      });

      it("message contains schedule promptly wording", () => {
        const records = [makeRecord({ next_drill_date: daysAgo(5) })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue")!;
        expect(alert.message).toContain("schedule promptly");
      });

      it("fires only one aggregate alert even with multiple overdue records", () => {
        const records = [
          makeRecord({ next_drill_date: daysAgo(5) }),
          makeRecord({ next_drill_date: daysAgo(10) }),
          makeRecord({ next_drill_date: daysAgo(20) }),
        ];
        const alerts = identifyDrillAlerts(records);
        const overdueAlerts = alerts.filter((a) => a.type === "drill_overdue");
        expect(overdueAlerts).toHaveLength(1);
      });

      it("detects far-past date as overdue", () => {
        const records = [makeRecord({ next_drill_date: "2020-01-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_overdue");
        expect(alert).toBeDefined();
      });
    });

    // ── Multiple alert types simultaneously ──────────────────────────────

    describe("multiple alert types simultaneously", () => {
      it("returns alerts of different types at the same time", () => {
        const records = [
          makeRecord({
            all_children_accounted: false,
            drill_outcome: "failed",
            staff_readiness: "unprepared",
            equipment_working: false,
            next_drill_date: daysAgo(10),
            drill_date: "2026-05-01",
          }),
        ];
        const alerts = identifyDrillAlerts(records);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("children_not_accounted");
        expect(types).toContain("drill_failed");
        expect(types).toContain("staff_unprepared");
        expect(types).toContain("equipment_fault");
        expect(types).toContain("drill_overdue");
      });

      it("returns correct total number of alerts for worst-case record", () => {
        const records = [
          makeRecord({
            all_children_accounted: false,
            drill_outcome: "failed",
            staff_readiness: "unprepared",
            equipment_working: false,
            next_drill_date: daysAgo(10),
            drill_date: "2026-05-01",
          }),
        ];
        const alerts = identifyDrillAlerts(records);
        // children_not_accounted (per record) + drill_failed (per record) +
        // staff_unprepared (aggregate) + equipment_fault (aggregate) +
        // drill_overdue (aggregate) = 5
        expect(alerts).toHaveLength(5);
      });

      it("returns alerts from multiple records combined", () => {
        const records = [
          makeRecord({ all_children_accounted: false, drill_date: "2026-05-01" }),
          makeRecord({ drill_outcome: "failed", drill_date: "2026-04-01" }),
          makeRecord({ staff_readiness: "unprepared" }),
          makeRecord({ equipment_working: false }),
          makeRecord({ next_drill_date: daysAgo(5) }),
        ];
        const alerts = identifyDrillAlerts(records);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("children_not_accounted");
        expect(types).toContain("drill_failed");
        expect(types).toContain("staff_unprepared");
        expect(types).toContain("equipment_fault");
        expect(types).toContain("drill_overdue");
      });
    });

    // ── Edge cases ───────────────────────────────────────────────────────

    describe("edge cases", () => {
      it("cancelled drill with equipment not working does not trigger equipment_fault", () => {
        const records = [
          makeRecord({ equipment_working: false, drill_outcome: "cancelled" }),
        ];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "equipment_fault");
        expect(alert).toBeUndefined();
      });

      it("cancelled drill with all_children_accounted false does not trigger children_not_accounted", () => {
        const records = [
          makeRecord({ all_children_accounted: false, drill_outcome: "cancelled" }),
        ];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted");
        expect(alert).toBeUndefined();
      });

      it("cancelled drill with failed outcome does not exist (cancelled takes precedence in data)", () => {
        // This tests that cancelled is its own distinct outcome
        const records = [makeRecord({ drill_outcome: "cancelled" })];
        const alerts = identifyDrillAlerts(records);
        const failedAlert = alerts.find((a) => a.type === "drill_failed");
        expect(failedAlert).toBeUndefined();
      });

      it("per-record alerts have unique IDs from each record", () => {
        const records = [
          makeRecord({ id: "rec-1", all_children_accounted: false, drill_date: "2026-05-01" }),
          makeRecord({ id: "rec-2", all_children_accounted: false, drill_date: "2026-04-01" }),
        ];
        const alerts = identifyDrillAlerts(records);
        const childAlerts = alerts.filter((a) => a.type === "children_not_accounted");
        expect(childAlerts[0].id).toBe("rec-1");
        expect(childAlerts[1].id).toBe("rec-2");
      });

      it("aggregate alerts use type name as id", () => {
        const records = [
          makeRecord({ staff_readiness: "unprepared", equipment_working: false, next_drill_date: daysAgo(5) }),
        ];
        const alerts = identifyDrillAlerts(records);
        const staffAlert = alerts.find((a) => a.type === "staff_unprepared");
        const equipAlert = alerts.find((a) => a.type === "equipment_fault");
        const overdueAlert = alerts.find((a) => a.type === "drill_overdue");
        expect(staffAlert!.id).toBe("staff_unprepared");
        expect(equipAlert!.id).toBe("equipment_fault");
        expect(overdueAlert!.id).toBe("drill_overdue");
      });

      it("drill_type with underscores is displayed with spaces in message", () => {
        const records = [makeRecord({ drill_outcome: "failed", drill_type: "power_failure", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed")!;
        expect(alert.message).toContain("power failure");
        expect(alert.message).not.toContain("power_failure");
      });

      it("drill_type with no underscores stays as-is in message", () => {
        const records = [makeRecord({ drill_outcome: "failed", drill_type: "lockdown", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "drill_failed")!;
        expect(alert.message).toContain("lockdown");
      });

      it("children_not_accounted message uses drill_type with spaces", () => {
        const records = [makeRecord({ all_children_accounted: false, drill_type: "gas_leak", drill_date: "2026-05-01" })];
        const alerts = identifyDrillAlerts(records);
        const alert = alerts.find((a) => a.type === "children_not_accounted")!;
        expect(alert.message).toContain("gas leak");
      });

      it("mixed cancelled and non-cancelled drills correctly filter", () => {
        const records = [
          makeRecord({ all_children_accounted: false, drill_outcome: "cancelled" }),
          makeRecord({ all_children_accounted: false, drill_outcome: "successful", drill_date: "2026-05-01" }),
          makeRecord({ equipment_working: false, drill_outcome: "cancelled" }),
          makeRecord({ equipment_working: false, drill_outcome: "failed", drill_date: "2026-04-01" }),
        ];
        const alerts = identifyDrillAlerts(records);
        const childAlerts = alerts.filter((a) => a.type === "children_not_accounted");
        const equipAlerts = alerts.filter((a) => a.type === "equipment_fault");
        expect(childAlerts).toHaveLength(1);
        expect(equipAlerts).toHaveLength(1);
      });
    });
  });
});
