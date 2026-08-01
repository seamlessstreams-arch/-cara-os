// ══════════════════════════════════════════════════════════════════════════════
// CARA — DAILY ROUTINE SERVICE TESTS
// Pure-function tests for routine metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  ROUTINE_TYPES,
  ROUTINE_SLOTS,
  COMPLIANCE_RATINGS,
  ADAPTATION_REASONS,
  _testing,
} from "../daily-routine-service";

import type {
  DailyRoutineRecord,
  RoutineType,
  RoutineSlot,
  ComplianceRating,
  AdaptationReason,
} from "../daily-routine-service";

const { computeRoutineMetrics, identifyRoutineAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides: Partial<DailyRoutineRecord> = {},
): DailyRoutineRecord {
  return {
    id: "id" in overrides ? overrides.id! : crypto.randomUUID(),
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alice",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    routine_date: "routine_date" in overrides ? overrides.routine_date! : "2026-05-10",
    routine_type: "routine_type" in overrides ? overrides.routine_type! : "weekday",
    routine_slot: "routine_slot" in overrides ? overrides.routine_slot! : "breakfast",
    scheduled_time: "scheduled_time" in overrides ? overrides.scheduled_time! : "08:00",
    actual_time: "actual_time" in overrides ? overrides.actual_time! : "08:05",
    compliance_rating: "compliance_rating" in overrides ? overrides.compliance_rating! : "fully_followed",
    adapted: "adapted" in overrides ? overrides.adapted! : false,
    adaptation_reason: "adaptation_reason" in overrides ? overrides.adaptation_reason! : null,
    child_engaged: "child_engaged" in overrides ? overrides.child_engaged! : true,
    child_mood: "child_mood" in overrides ? overrides.child_mood! : "happy",
    staff_supporting: "staff_supporting" in overrides ? overrides.staff_supporting! : "Staff A",
    notes: "notes" in overrides ? overrides.notes! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-10T08:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-05-10T08:00:00Z",
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("ROUTINE_TYPES", () => {
    it("has exactly 6 items", () => {
      expect(ROUTINE_TYPES).toHaveLength(6);
    });

    it("contains weekday", () => {
      expect(ROUTINE_TYPES).toContainEqual({ type: "weekday", label: "Weekday" });
    });

    it("contains weekend", () => {
      expect(ROUTINE_TYPES).toContainEqual({ type: "weekend", label: "Weekend" });
    });

    it("contains school_holiday", () => {
      expect(ROUTINE_TYPES).toContainEqual({ type: "school_holiday", label: "School Holiday" });
    });

    it("contains special_occasion", () => {
      expect(ROUTINE_TYPES).toContainEqual({ type: "special_occasion", label: "Special Occasion" });
    });

    it("contains contact_day", () => {
      expect(ROUTINE_TYPES).toContainEqual({ type: "contact_day", label: "Contact Day" });
    });

    it("contains transition_day", () => {
      expect(ROUTINE_TYPES).toContainEqual({ type: "transition_day", label: "Transition Day" });
    });

    it("has unique type values", () => {
      const types = ROUTINE_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of ROUTINE_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("ROUTINE_SLOTS", () => {
    it("has exactly 17 items", () => {
      expect(ROUTINE_SLOTS).toHaveLength(17);
    });

    const expectedSlots: [RoutineSlot, string][] = [
      ["wake_up", "Wake Up"],
      ["morning_care", "Morning Care"],
      ["breakfast", "Breakfast"],
      ["school_preparation", "School Preparation"],
      ["school_run", "School Run"],
      ["morning_activity", "Morning Activity"],
      ["lunch", "Lunch"],
      ["afternoon_activity", "Afternoon Activity"],
      ["homework", "Homework"],
      ["after_school", "After School"],
      ["dinner", "Dinner"],
      ["evening_activity", "Evening Activity"],
      ["free_time", "Free Time"],
      ["personal_care", "Personal Care"],
      ["wind_down", "Wind Down"],
      ["bedtime", "Bedtime"],
      ["night_check", "Night Check"],
    ];

    for (const [slot, label] of expectedSlots) {
      it(`contains ${slot}`, () => {
        expect(ROUTINE_SLOTS).toContainEqual({ slot, label });
      });
    }

    it("has unique slot values", () => {
      const slots = ROUTINE_SLOTS.map((s) => s.slot);
      expect(new Set(slots).size).toBe(slots.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of ROUTINE_SLOTS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("COMPLIANCE_RATINGS", () => {
    it("has exactly 5 items", () => {
      expect(COMPLIANCE_RATINGS).toHaveLength(5);
    });

    it("contains fully_followed", () => {
      expect(COMPLIANCE_RATINGS).toContainEqual({ rating: "fully_followed", label: "Fully Followed" });
    });

    it("contains mostly_followed", () => {
      expect(COMPLIANCE_RATINGS).toContainEqual({ rating: "mostly_followed", label: "Mostly Followed" });
    });

    it("contains partially_followed", () => {
      expect(COMPLIANCE_RATINGS).toContainEqual({ rating: "partially_followed", label: "Partially Followed" });
    });

    it("contains not_followed", () => {
      expect(COMPLIANCE_RATINGS).toContainEqual({ rating: "not_followed", label: "Not Followed" });
    });

    it("contains not_applicable", () => {
      expect(COMPLIANCE_RATINGS).toContainEqual({ rating: "not_applicable", label: "Not Applicable" });
    });

    it("has unique rating values", () => {
      const ratings = COMPLIANCE_RATINGS.map((c) => c.rating);
      expect(new Set(ratings).size).toBe(ratings.length);
    });
  });

  describe("ADAPTATION_REASONS", () => {
    it("has exactly 9 items", () => {
      expect(ADAPTATION_REASONS).toHaveLength(9);
    });

    const expectedReasons: [AdaptationReason, string][] = [
      ["child_request", "Child Request"],
      ["health_need", "Health Need"],
      ["contact_visit", "Contact Visit"],
      ["appointment", "Appointment"],
      ["activity", "Activity"],
      ["behaviour", "Behaviour"],
      ["staff_decision", "Staff Decision"],
      ["emergency", "Emergency"],
      ["other", "Other"],
    ];

    for (const [reason, label] of expectedReasons) {
      it(`contains ${reason}`, () => {
        expect(ADAPTATION_REASONS).toContainEqual({ reason, label });
      });
    }

    it("has unique reason values", () => {
      const reasons = ADAPTATION_REASONS.map((a) => a.reason);
      expect(new Set(reasons).size).toBe(reasons.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of ADAPTATION_REASONS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeRoutineMetrics ──────────────────────────────────────────────────

describe("computeRoutineMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_records", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.total_records).toBe(0);
    });

    it("returns zero children_with_routines", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.children_with_routines).toBe(0);
    });

    it("returns zero routine_coverage", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.routine_coverage).toBe(0); // records exist → real 0.
    });

    it("returns zero fully_followed_count", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.fully_followed_count).toBe(0);
    });

    it("returns zero mostly_followed_count", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.mostly_followed_count).toBe(0);
    });

    it("returns zero partially_followed_count", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.partially_followed_count).toBe(0);
    });

    it("returns zero not_followed_count", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.not_followed_count).toBe(0);
    });

    it("returns zero compliance_rate", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.compliance_rate).toBeNull();
    });

    it("returns zero adapted_count", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.adapted_count).toBe(0);
    });

    it("returns zero adaptation_rate", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.adaptation_rate).toBeNull();
    });

    it("returns zero child_engaged_rate", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.child_engaged_rate).toBeNull();
    });

    it("returns zero average_per_child", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.average_per_child).toBeNull(); // fab-0.
    });

    it("returns empty by_routine_type", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.by_routine_type).toEqual({});
    });

    it("returns empty by_routine_slot", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.by_routine_slot).toEqual({});
    });

    it("returns empty by_compliance", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.by_compliance).toEqual({});
    });

    it("returns empty by_adaptation_reason", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.by_adaptation_reason).toEqual({});
    });

    it("returns empty by_child", () => {
      const m = computeRoutineMetrics([], 5);
      expect(m.by_child).toEqual({});
    });

    it("handles totalChildren = 0 with empty records", () => {
      const m = computeRoutineMetrics([], 0);
      expect(m.routine_coverage).toBeNull(); // fab-0.
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      compliance_rating: "fully_followed",
      adapted: false,
      child_engaged: true,
      routine_type: "weekday",
      routine_slot: "breakfast",
      child_name: "Alice",
    });

    it("returns total_records = 1", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.total_records).toBe(1);
    });

    it("returns children_with_routines = 1", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.children_with_routines).toBe(1);
    });

    it("returns routine_coverage = 100", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.routine_coverage).toBe(100);
    });

    it("returns fully_followed_count = 1", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.fully_followed_count).toBe(1);
    });

    it("returns compliance_rate = 100 for single fully_followed", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.compliance_rate).toBe(100);
    });

    it("returns adapted_count = 0", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.adapted_count).toBe(0);
    });

    it("returns adaptation_rate = 0", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.adaptation_rate).toBe(0);
    });

    it("returns child_engaged_rate = 100", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.child_engaged_rate).toBe(100);
    });

    it("returns average_per_child = 1", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.average_per_child).toBe(1);
    });

    it("returns by_routine_type with single weekday entry", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.by_routine_type).toEqual({ weekday: 1 });
    });

    it("returns by_routine_slot with single breakfast entry", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.by_routine_slot).toEqual({ breakfast: 1 });
    });

    it("returns by_compliance with single fully_followed entry", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.by_compliance).toEqual({ fully_followed: 1 });
    });

    it("returns empty by_adaptation_reason when no adaptation", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.by_adaptation_reason).toEqual({});
    });

    it("returns by_child with single Alice entry", () => {
      const m = computeRoutineMetrics([record], 1);
      expect(m.by_child).toEqual({ Alice: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed", routine_type: "weekday", routine_slot: "breakfast", adapted: false, child_engaged: true }),
      makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "mostly_followed", routine_type: "weekday", routine_slot: "lunch", adapted: true, adaptation_reason: "child_request", child_engaged: true }),
      makeRecord({ child_id: "c2", child_name: "Bob", compliance_rating: "partially_followed", routine_type: "weekend", routine_slot: "dinner", adapted: false, child_engaged: false }),
      makeRecord({ child_id: "c2", child_name: "Bob", compliance_rating: "not_followed", routine_type: "weekend", routine_slot: "bedtime", adapted: true, adaptation_reason: "emergency", child_engaged: false }),
      makeRecord({ child_id: "c3", child_name: "Charlie", compliance_rating: "not_applicable", routine_type: "school_holiday", routine_slot: "homework", adapted: false, child_engaged: true }),
    ];

    it("returns total_records = 5", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.total_records).toBe(5);
    });

    it("returns children_with_routines = 3", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.children_with_routines).toBe(3);
    });

    it("calculates routine_coverage correctly (3/4 = 75%)", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.routine_coverage).toBe(75);
    });

    it("returns fully_followed_count = 1", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.fully_followed_count).toBe(1);
    });

    it("returns mostly_followed_count = 1", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.mostly_followed_count).toBe(1);
    });

    it("returns partially_followed_count = 1", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.partially_followed_count).toBe(1);
    });

    it("returns not_followed_count = 1", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.not_followed_count).toBe(1);
    });

    it("calculates compliance_rate excluding not_applicable (2/4 = 50%)", () => {
      const m = computeRoutineMetrics(records, 4);
      // applicable = 4 (excl not_applicable), compliant = fully + mostly = 2
      expect(m.compliance_rate).toBe(50);
    });

    it("returns adapted_count = 2", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.adapted_count).toBe(2);
    });

    it("calculates adaptation_rate (2/5 = 40%)", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.adaptation_rate).toBe(40);
    });

    it("calculates child_engaged_rate (3/5 = 60%)", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.child_engaged_rate).toBe(60);
    });

    it("calculates average_per_child (5/3 = 1.7)", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.average_per_child).toBe(1.7);
    });

    it("groups by_routine_type correctly", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.by_routine_type).toEqual({ weekday: 2, weekend: 2, school_holiday: 1 });
    });

    it("groups by_routine_slot correctly", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.by_routine_slot).toEqual({ breakfast: 1, lunch: 1, dinner: 1, bedtime: 1, homework: 1 });
    });

    it("groups by_compliance correctly", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.by_compliance).toEqual({
        fully_followed: 1,
        mostly_followed: 1,
        partially_followed: 1,
        not_followed: 1,
        not_applicable: 1,
      });
    });

    it("groups by_adaptation_reason only for non-null reasons", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.by_adaptation_reason).toEqual({ child_request: 1, emergency: 1 });
    });

    it("groups by_child using child_name", () => {
      const m = computeRoutineMetrics(records, 4);
      expect(m.by_child).toEqual({ Alice: 2, Bob: 2, Charlie: 1 });
    });
  });

  describe("routine_coverage edge cases", () => {
    it("returns 0 when totalChildren is 0", () => {
      const m = computeRoutineMetrics([makeRecord()], 0);
      expect(m.routine_coverage).toBeNull(); // fab-0.
    });

    it("returns 50 when 1 child covered out of 2", () => {
      const m = computeRoutineMetrics([makeRecord({ child_id: "c1" })], 2);
      expect(m.routine_coverage).toBe(50);
    });

    it("returns 100 when all children covered", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const m = computeRoutineMetrics(records, 2);
      expect(m.routine_coverage).toBe(100);
    });

    it("handles fractional coverage with rounding to 1 decimal", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
      ];
      // 1/3 = 33.333... -> rounds to 33.3
      const m = computeRoutineMetrics(records, 3);
      expect(m.routine_coverage).toBe(33.3);
    });

    it("handles 2/3 coverage rounding to 66.7", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const m = computeRoutineMetrics(records, 3);
      expect(m.routine_coverage).toBe(66.7);
    });
  });

  describe("compliance_rate edge cases", () => {
    it("returns 100 when all applicable records are fully_followed", () => {
      const records = [
        makeRecord({ compliance_rating: "fully_followed" }),
        makeRecord({ compliance_rating: "fully_followed" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.compliance_rate).toBe(100);
    });

    it("returns 100 when all applicable records are mostly_followed", () => {
      const records = [
        makeRecord({ compliance_rating: "mostly_followed" }),
        makeRecord({ compliance_rating: "mostly_followed" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.compliance_rate).toBe(100);
    });

    it("returns 0 when all applicable records are not_followed", () => {
      const records = [
        makeRecord({ compliance_rating: "not_followed" }),
        makeRecord({ compliance_rating: "not_followed" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.compliance_rate).toBe(0);
    });

    it("returns 0 when all applicable records are partially_followed", () => {
      const records = [
        makeRecord({ compliance_rating: "partially_followed" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.compliance_rate).toBe(0);
    });

    it("excludes not_applicable from compliance denominator", () => {
      const records = [
        makeRecord({ compliance_rating: "fully_followed" }),
        makeRecord({ compliance_rating: "not_applicable" }),
        makeRecord({ compliance_rating: "not_applicable" }),
      ];
      // applicable = 1, compliant = 1, rate = 100
      const m = computeRoutineMetrics(records, 1);
      expect(m.compliance_rate).toBe(100);
    });

    it("returns 0 when all records are not_applicable (no applicable records)", () => {
      const records = [
        makeRecord({ compliance_rating: "not_applicable" }),
        makeRecord({ compliance_rating: "not_applicable" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.compliance_rate).toBeNull();
    });

    it("mixes fully and mostly as compliant", () => {
      const records = [
        makeRecord({ compliance_rating: "fully_followed" }),
        makeRecord({ compliance_rating: "mostly_followed" }),
        makeRecord({ compliance_rating: "not_followed" }),
      ];
      // applicable = 3, compliant = 2, rate = 66.7
      const m = computeRoutineMetrics(records, 1);
      expect(m.compliance_rate).toBe(66.7);
    });
  });

  describe("adapted_count and adaptation_rate", () => {
    it("counts adapted records correctly", () => {
      const records = [
        makeRecord({ adapted: true }),
        makeRecord({ adapted: true }),
        makeRecord({ adapted: false }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.adapted_count).toBe(2);
    });

    it("calculates adaptation_rate as percentage", () => {
      const records = [
        makeRecord({ adapted: true }),
        makeRecord({ adapted: false }),
        makeRecord({ adapted: false }),
      ];
      // 1/3 = 33.3%
      const m = computeRoutineMetrics(records, 1);
      expect(m.adaptation_rate).toBe(33.3);
    });

    it("returns 100 when all records adapted", () => {
      const records = [
        makeRecord({ adapted: true }),
        makeRecord({ adapted: true }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.adaptation_rate).toBe(100);
    });

    it("returns 0 when no records adapted", () => {
      const records = [
        makeRecord({ adapted: false }),
        makeRecord({ adapted: false }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.adaptation_rate).toBe(0);
    });
  });

  describe("child_engaged_rate", () => {
    it("returns 100 when all children engaged", () => {
      const records = [
        makeRecord({ child_engaged: true }),
        makeRecord({ child_engaged: true }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.child_engaged_rate).toBe(100);
    });

    it("returns 0 when no children engaged", () => {
      const records = [
        makeRecord({ child_engaged: false }),
        makeRecord({ child_engaged: false }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.child_engaged_rate).toBe(0);
    });

    it("calculates mixed engagement correctly", () => {
      const records = [
        makeRecord({ child_engaged: true }),
        makeRecord({ child_engaged: false }),
        makeRecord({ child_engaged: true }),
      ];
      // 2/3 = 66.7%
      const m = computeRoutineMetrics(records, 1);
      expect(m.child_engaged_rate).toBe(66.7);
    });
  });

  describe("average_per_child", () => {
    it("returns records / unique children rounded to 1 decimal", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      // 4 records / 2 children = 2.0
      const m = computeRoutineMetrics(records, 2);
      expect(m.average_per_child).toBe(2);
    });

    it("rounds to 1 decimal place", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      // 3 records / 2 children = 1.5
      const m = computeRoutineMetrics(records, 2);
      expect(m.average_per_child).toBe(1.5);
    });

    it("returns 0 when no records and no children", () => {
      const m = computeRoutineMetrics([], 0);
      expect(m.average_per_child).toBeNull(); // fab-0.
    });

    it("handles non-trivial rounding (7/3 = 2.3)", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
        makeRecord({ child_id: "c2" }),
        makeRecord({ child_id: "c3" }),
        makeRecord({ child_id: "c3" }),
      ];
      // 7/3 = 2.333... -> 2.3
      const m = computeRoutineMetrics(records, 3);
      expect(m.average_per_child).toBe(2.3);
    });
  });

  describe("by_routine_type breakdown", () => {
    it("counts each routine type separately", () => {
      const records = [
        makeRecord({ routine_type: "weekday" }),
        makeRecord({ routine_type: "weekday" }),
        makeRecord({ routine_type: "weekend" }),
        makeRecord({ routine_type: "contact_day" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.by_routine_type).toEqual({ weekday: 2, weekend: 1, contact_day: 1 });
    });

    it("handles all six routine types", () => {
      const types: RoutineType[] = ["weekday", "weekend", "school_holiday", "special_occasion", "contact_day", "transition_day"];
      const records = types.map((t) => makeRecord({ routine_type: t }));
      const m = computeRoutineMetrics(records, 1);
      for (const t of types) {
        expect(m.by_routine_type[t]).toBe(1);
      }
    });
  });

  describe("by_routine_slot breakdown", () => {
    it("counts each routine slot separately", () => {
      const records = [
        makeRecord({ routine_slot: "breakfast" }),
        makeRecord({ routine_slot: "breakfast" }),
        makeRecord({ routine_slot: "lunch" }),
        makeRecord({ routine_slot: "bedtime" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.by_routine_slot).toEqual({ breakfast: 2, lunch: 1, bedtime: 1 });
    });

    it("handles all seventeen routine slots", () => {
      const slots: RoutineSlot[] = [
        "wake_up", "morning_care", "breakfast", "school_preparation", "school_run",
        "morning_activity", "lunch", "afternoon_activity", "homework", "after_school",
        "dinner", "evening_activity", "free_time", "personal_care", "wind_down",
        "bedtime", "night_check",
      ];
      const records = slots.map((s) => makeRecord({ routine_slot: s }));
      const m = computeRoutineMetrics(records, 1);
      for (const s of slots) {
        expect(m.by_routine_slot[s]).toBe(1);
      }
    });
  });

  describe("by_compliance breakdown", () => {
    it("counts each compliance rating", () => {
      const ratings: ComplianceRating[] = ["fully_followed", "mostly_followed", "partially_followed", "not_followed", "not_applicable"];
      const records = ratings.map((r) => makeRecord({ compliance_rating: r }));
      const m = computeRoutineMetrics(records, 1);
      expect(m.by_compliance).toEqual({
        fully_followed: 1,
        mostly_followed: 1,
        partially_followed: 1,
        not_followed: 1,
        not_applicable: 1,
      });
    });

    it("counts duplicates within same rating", () => {
      const records = [
        makeRecord({ compliance_rating: "fully_followed" }),
        makeRecord({ compliance_rating: "fully_followed" }),
        makeRecord({ compliance_rating: "fully_followed" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.by_compliance).toEqual({ fully_followed: 3 });
    });
  });

  describe("by_adaptation_reason breakdown", () => {
    it("only counts records where adaptation_reason is not null", () => {
      const records = [
        makeRecord({ adaptation_reason: "child_request" }),
        makeRecord({ adaptation_reason: null }),
        makeRecord({ adaptation_reason: "emergency" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.by_adaptation_reason).toEqual({ child_request: 1, emergency: 1 });
    });

    it("returns empty object when no adaptation reasons", () => {
      const records = [
        makeRecord({ adaptation_reason: null }),
        makeRecord({ adaptation_reason: null }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.by_adaptation_reason).toEqual({});
    });

    it("counts all nine adaptation reasons", () => {
      const reasons: AdaptationReason[] = ["child_request", "health_need", "contact_visit", "appointment", "activity", "behaviour", "staff_decision", "emergency", "other"];
      const records = reasons.map((r) => makeRecord({ adaptation_reason: r }));
      const m = computeRoutineMetrics(records, 1);
      for (const r of reasons) {
        expect(m.by_adaptation_reason[r]).toBe(1);
      }
    });

    it("counts duplicates within same reason", () => {
      const records = [
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "emergency" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(m.by_adaptation_reason).toEqual({ emergency: 3 });
    });
  });

  describe("by_child breakdown", () => {
    it("uses child_name as key", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice" }),
        makeRecord({ child_id: "c1", child_name: "Alice" }),
        makeRecord({ child_id: "c2", child_name: "Bob" }),
      ];
      const m = computeRoutineMetrics(records, 2);
      expect(m.by_child).toEqual({ Alice: 2, Bob: 1 });
    });

    it("returns one entry per unique child_name", () => {
      const records = [
        makeRecord({ child_name: "Alice" }),
      ];
      const m = computeRoutineMetrics(records, 1);
      expect(Object.keys(m.by_child)).toEqual(["Alice"]);
    });
  });

  describe("children_with_routines uses child_id not child_name", () => {
    it("counts unique child_ids", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice" }),
        makeRecord({ child_id: "c1", child_name: "Alice" }),
        makeRecord({ child_id: "c2", child_name: "Bob" }),
      ];
      const m = computeRoutineMetrics(records, 5);
      expect(m.children_with_routines).toBe(2);
    });

    it("same child_name different child_ids count as separate children", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice" }),
        makeRecord({ child_id: "c2", child_name: "Alice" }),
      ];
      const m = computeRoutineMetrics(records, 5);
      expect(m.children_with_routines).toBe(2);
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: DailyRoutineRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            child_id: `c${i % 10}`,
            child_name: `Child${i % 10}`,
            compliance_rating: i % 2 === 0 ? "fully_followed" : "not_followed",
            adapted: i % 3 === 0,
            child_engaged: i % 4 !== 0,
          }),
        );
      }
      const m = computeRoutineMetrics(records, 10);
      expect(m.total_records).toBe(100);
      expect(m.children_with_routines).toBe(10);
      expect(m.routine_coverage).toBe(100);
      expect(m.fully_followed_count).toBe(50);
      expect(m.not_followed_count).toBe(50);
      expect(m.compliance_rate).toBe(50);
      expect(m.average_per_child).toBe(10);
    });
  });
});

// ── identifyRoutineAlerts ──────────────────────────────────────────────────

describe("identifyRoutineAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records and totalChildren = 0", () => {
      const alerts = identifyRoutineAlerts([], 0);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all children covered and compliant", () => {
      const records = [
        makeRecord({ child_id: "c1", compliance_rating: "fully_followed", child_engaged: true, routine_slot: "breakfast" }),
        makeRecord({ child_id: "c2", compliance_rating: "fully_followed", child_engaged: true, routine_slot: "lunch" }),
      ];
      const alerts = identifyRoutineAlerts(records, 2);
      expect(alerts).toEqual([]);
    });

    it("returns empty array for well-behaved data set", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed", child_engaged: true }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "mostly_followed", child_engaged: true }),
        makeRecord({ child_id: "c2", child_name: "Bob", compliance_rating: "fully_followed", child_engaged: true }),
      ];
      const alerts = identifyRoutineAlerts(records, 2);
      expect(alerts).toEqual([]);
    });
  });

  describe("no_routine alert", () => {
    it("fires when totalChildren > childrenCovered", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
      ];
      const alerts = identifyRoutineAlerts(records, 3);
      const noRoutine = alerts.find((a) => a.type === "no_routine");
      expect(noRoutine).toBeDefined();
    });

    it("has severity high", () => {
      const alerts = identifyRoutineAlerts([makeRecord({ child_id: "c1" })], 3);
      const noRoutine = alerts.find((a) => a.type === "no_routine")!;
      expect(noRoutine.severity).toBe("high");
    });

    it("has id routine_gap", () => {
      const alerts = identifyRoutineAlerts([makeRecord({ child_id: "c1" })], 3);
      const noRoutine = alerts.find((a) => a.type === "no_routine")!;
      expect(noRoutine.id).toBe("routine_gap");
    });

    it("singular message for 1 child gap", () => {
      const alerts = identifyRoutineAlerts([makeRecord({ child_id: "c1" })], 2);
      const noRoutine = alerts.find((a) => a.type === "no_routine")!;
      expect(noRoutine.message).toContain("1 child has");
    });

    it("plural message for multiple children gap", () => {
      const alerts = identifyRoutineAlerts([makeRecord({ child_id: "c1" })], 4);
      const noRoutine = alerts.find((a) => a.type === "no_routine")!;
      expect(noRoutine.message).toContain("3 children have");
    });

    it("does not fire when all children covered", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const alerts = identifyRoutineAlerts(records, 2);
      const noRoutine = alerts.find((a) => a.type === "no_routine");
      expect(noRoutine).toBeUndefined();
    });

    it("does not fire when totalChildren is 0", () => {
      const alerts = identifyRoutineAlerts([], 0);
      const noRoutine = alerts.find((a) => a.type === "no_routine");
      expect(noRoutine).toBeUndefined();
    });

    it("does not fire when records empty but totalChildren is 0", () => {
      const alerts = identifyRoutineAlerts([], 0);
      expect(alerts.filter((a) => a.type === "no_routine")).toHaveLength(0);
    });

    it("fires when records empty but totalChildren > 0", () => {
      const alerts = identifyRoutineAlerts([], 5);
      const noRoutine = alerts.find((a) => a.type === "no_routine");
      expect(noRoutine).toBeDefined();
      expect(noRoutine!.message).toContain("5 children have");
    });

    it("message contains stability and wellbeing wording", () => {
      const alerts = identifyRoutineAlerts([], 2);
      const noRoutine = alerts.find((a) => a.type === "no_routine")!;
      expect(noRoutine.message).toContain("stability and wellbeing");
    });
  });

  describe("routine_not_followed alert", () => {
    it("fires when child has total >= 3 and notFollowed/total > 0.5", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
      ];
      // total applicable = 3, notFollowed = 2, 2/3 = 0.666 > 0.5
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed")!;
      expect(alert.severity).toBe("high");
    });

    it("uses child_id as alert id", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed")!;
      expect(alert.id).toBe("c1");
    });

    it("includes child name in message", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed")!;
      expect(alert.message).toContain("Alice");
    });

    it("includes count fraction in message", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed")!;
      expect(alert.message).toContain("2/3");
    });

    it("excludes not_applicable from counting", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_applicable" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_applicable" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_applicable" }),
      ];
      // applicable: 1 not_followed => total=1, notFollowed=1, 1/1 > 0.5 but total < 3
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when total < 3", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
      ];
      // total = 2, even though 100% not followed, total < 3
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when notFollowed/total <= 0.5", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
      ];
      // total = 4, notFollowed = 1, 1/4 = 0.25 <= 0.5
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed");
      expect(alert).toBeUndefined();
    });

    it("does not fire at exactly 0.5 ratio (boundary)", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
      ];
      // total = 4, notFollowed = 2, 2/4 = 0.5, NOT > 0.5
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed");
      expect(alert).toBeUndefined();
    });

    it("fires for multiple children independently", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
        makeRecord({ child_id: "c2", child_name: "Bob", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c2", child_name: "Bob", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c2", child_name: "Bob", compliance_rating: "mostly_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 2);
      const notFollowedAlerts = alerts.filter((a) => a.type === "routine_not_followed");
      expect(notFollowedAlerts).toHaveLength(2);
    });

    it("message contains review wording", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed")!;
      expect(alert.message).toContain("review routine suitability");
    });
  });

  describe("bedtime_disruption alert", () => {
    it("fires when >= 2 bedtime slots not_followed", () => {
      const records = [
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "bedtime_disruption");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "bedtime_disruption")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id bedtime_disruption", () => {
      const records = [
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "bedtime_disruption")!;
      expect(alert.id).toBe("bedtime_disruption");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "bedtime_disruption")!;
      expect(alert.message).toContain("3 bedtime routines");
    });

    it("does not fire with only 1 bedtime not_followed", () => {
      const records = [
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "bedtime_disruption");
      expect(alert).toBeUndefined();
    });

    it("does not fire for bedtime with other compliance ratings", () => {
      const records = [
        makeRecord({ routine_slot: "bedtime", compliance_rating: "fully_followed" }),
        makeRecord({ routine_slot: "bedtime", compliance_rating: "mostly_followed" }),
        makeRecord({ routine_slot: "bedtime", compliance_rating: "partially_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "bedtime_disruption");
      expect(alert).toBeUndefined();
    });

    it("does not fire for non-bedtime slots that are not_followed", () => {
      const records = [
        makeRecord({ routine_slot: "breakfast", compliance_rating: "not_followed" }),
        makeRecord({ routine_slot: "lunch", compliance_rating: "not_followed" }),
        makeRecord({ routine_slot: "dinner", compliance_rating: "not_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "bedtime_disruption");
      expect(alert).toBeUndefined();
    });

    it("only counts bedtime + not_followed combination", () => {
      const records = [
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ routine_slot: "bedtime", compliance_rating: "fully_followed" }),
        makeRecord({ routine_slot: "dinner", compliance_rating: "not_followed" }),
      ];
      // Only 1 bedtime + not_followed
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "bedtime_disruption");
      expect(alert).toBeUndefined();
    });

    it("message contains consistent bedtimes wording", () => {
      const records = [
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ routine_slot: "bedtime", compliance_rating: "not_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "bedtime_disruption")!;
      expect(alert.message).toContain("consistent bedtimes");
    });
  });

  describe("low_engagement alert", () => {
    it("fires when >= 5 records not engaged (excluding not_applicable)", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ child_engaged: false, compliance_rating: "fully_followed" }),
      );
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "low_engagement");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ child_engaged: false, compliance_rating: "fully_followed" }),
      );
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "low_engagement")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id low_engagement", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ child_engaged: false, compliance_rating: "fully_followed" }),
      );
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "low_engagement")!;
      expect(alert.id).toBe("low_engagement");
    });

    it("includes count in message", () => {
      const records = Array.from({ length: 7 }, () =>
        makeRecord({ child_engaged: false, compliance_rating: "fully_followed" }),
      );
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "low_engagement")!;
      expect(alert.message).toContain("7 routine activities");
    });

    it("does not fire with only 4 not-engaged records", () => {
      const records = Array.from({ length: 4 }, () =>
        makeRecord({ child_engaged: false, compliance_rating: "fully_followed" }),
      );
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "low_engagement");
      expect(alert).toBeUndefined();
    });

    it("excludes not_applicable from low engagement count", () => {
      const records = [
        ...Array.from({ length: 3 }, () =>
          makeRecord({ child_engaged: false, compliance_rating: "fully_followed" }),
        ),
        ...Array.from({ length: 3 }, () =>
          makeRecord({ child_engaged: false, compliance_rating: "not_applicable" }),
        ),
      ];
      // Only 3 qualify (not_applicable excluded), < 5
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "low_engagement");
      expect(alert).toBeUndefined();
    });

    it("does not count engaged records", () => {
      const records = [
        ...Array.from({ length: 4 }, () =>
          makeRecord({ child_engaged: false, compliance_rating: "fully_followed" }),
        ),
        ...Array.from({ length: 10 }, () =>
          makeRecord({ child_engaged: true, compliance_rating: "fully_followed" }),
        ),
      ];
      // Only 4 not engaged, < 5
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "low_engagement");
      expect(alert).toBeUndefined();
    });

    it("fires at exactly 5 not-engaged applicable records", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ child_engaged: false, compliance_rating: "partially_followed" }),
      );
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "low_engagement");
      expect(alert).toBeDefined();
    });

    it("message contains children's interests wording", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ child_engaged: false, compliance_rating: "fully_followed" }),
      );
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "low_engagement")!;
      expect(alert.message).toContain("children's interests");
    });
  });

  describe("emergency_adaptations alert", () => {
    it("fires when >= 2 records have adaptation_reason emergency", () => {
      const records = [
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "emergency" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "emergency_adaptations");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "emergency" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "emergency_adaptations")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id emergency_adaptations", () => {
      const records = [
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "emergency" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "emergency_adaptations")!;
      expect(alert.id).toBe("emergency_adaptations");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "emergency" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "emergency_adaptations")!;
      expect(alert.message).toContain("3 routine adaptations");
    });

    it("does not fire with only 1 emergency adaptation", () => {
      const records = [
        makeRecord({ adaptation_reason: "emergency" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "emergency_adaptations");
      expect(alert).toBeUndefined();
    });

    it("does not fire for non-emergency adaptation reasons", () => {
      const records = [
        makeRecord({ adaptation_reason: "child_request" }),
        makeRecord({ adaptation_reason: "health_need" }),
        makeRecord({ adaptation_reason: "behaviour" }),
        makeRecord({ adaptation_reason: "staff_decision" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "emergency_adaptations");
      expect(alert).toBeUndefined();
    });

    it("only counts emergency, not other reasons", () => {
      const records = [
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "child_request" }),
        makeRecord({ adaptation_reason: "health_need" }),
      ];
      // Only 1 emergency, < 2
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "emergency_adaptations");
      expect(alert).toBeUndefined();
    });

    it("message contains emergency planning wording", () => {
      const records = [
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "emergency" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "emergency_adaptations")!;
      expect(alert.message).toContain("emergency planning");
    });
  });

  describe("multiple alerts simultaneously", () => {
    it("can fire no_routine and bedtime_disruption together", () => {
      const records = [
        makeRecord({ child_id: "c1", routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", routine_slot: "bedtime", compliance_rating: "not_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 3);
      expect(alerts.find((a) => a.type === "no_routine")).toBeDefined();
      expect(alerts.find((a) => a.type === "bedtime_disruption")).toBeDefined();
    });

    it("can fire all five alert types at once", () => {
      const records = [
        // routine_not_followed for c1: 3 applicable, 2 not_followed (2/3 > 0.5)
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed", child_engaged: false, routine_slot: "bedtime" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed", child_engaged: false, routine_slot: "bedtime" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed", child_engaged: false, routine_slot: "breakfast" }),
        // more non-engaged for low_engagement (need 5 total not_engaged excl not_applicable)
        makeRecord({ child_id: "c2", child_name: "Bob", compliance_rating: "partially_followed", child_engaged: false, routine_slot: "lunch" }),
        makeRecord({ child_id: "c2", child_name: "Bob", compliance_rating: "partially_followed", child_engaged: false, routine_slot: "dinner" }),
        // emergency adaptations (need >= 2)
        makeRecord({ child_id: "c2", child_name: "Bob", compliance_rating: "fully_followed", child_engaged: true, adaptation_reason: "emergency" }),
        makeRecord({ child_id: "c2", child_name: "Bob", compliance_rating: "fully_followed", child_engaged: true, adaptation_reason: "emergency" }),
      ];
      // totalChildren = 5 -> no_routine (gap = 3)
      // c1: 3 applicable, 2 not_followed => 2/3 > 0.5 => routine_not_followed
      // 2 bedtime not_followed => bedtime_disruption
      // 5 not_engaged applicable => low_engagement
      // 2 emergency => emergency_adaptations
      const alerts = identifyRoutineAlerts(records, 5);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_routine");
      expect(types).toContain("routine_not_followed");
      expect(types).toContain("bedtime_disruption");
      expect(types).toContain("low_engagement");
      expect(types).toContain("emergency_adaptations");
    });

    it("returns correct count of alerts", () => {
      const records = [
        makeRecord({ child_id: "c1", routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "emergency" }),
      ];
      const alerts = identifyRoutineAlerts(records, 5);
      // no_routine (gap of 4) + bedtime_disruption + emergency_adaptations = 3
      expect(alerts.length).toBe(3);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ child_id: "c1", routine_slot: "bedtime", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", routine_slot: "bedtime", compliance_rating: "not_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 3);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed", routine_slot: "bedtime", child_engaged: false }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed", routine_slot: "bedtime", child_engaged: false }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed", child_engaged: false }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed", child_engaged: false }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed", child_engaged: false }),
        makeRecord({ adaptation_reason: "emergency" }),
        makeRecord({ adaptation_reason: "emergency" }),
      ];
      const alerts = identifyRoutineAlerts(records, 5);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const alerts = identifyRoutineAlerts([], 5);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("empty records with 0 totalChildren returns no alerts", () => {
      expect(identifyRoutineAlerts([], 0)).toEqual([]);
    });

    it("all not_applicable records produce no routine_not_followed alert", () => {
      const records = Array.from({ length: 10 }, () =>
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_applicable" }),
      );
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed");
      expect(alert).toBeUndefined();
    });

    it("not_applicable records with child_engaged false do not count for low_engagement", () => {
      const records = Array.from({ length: 10 }, () =>
        makeRecord({ child_engaged: false, compliance_rating: "not_applicable" }),
      );
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "low_engagement");
      expect(alert).toBeUndefined();
    });

    it("handles single child with exactly 3 not_followed out of 5 applicable", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
      ];
      // total = 5, notFollowed = 3, 3/5 = 0.6 > 0.5, total >= 3
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed");
      expect(alert).toBeDefined();
    });

    it("a child with exactly 3 applicable and 2 not_followed fires alert (2/3 > 0.5)", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "not_followed" }),
        makeRecord({ child_id: "c1", child_name: "Alice", compliance_rating: "fully_followed" }),
      ];
      const alerts = identifyRoutineAlerts(records, 1);
      const alert = alerts.find((a) => a.type === "routine_not_followed");
      expect(alert).toBeDefined();
    });
  });
});

// ── Factory helper validation ──────────────────────────────────────────────

describe("makeRecord factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRecord();
    expect(r.home_id).toBe("home-1");
    expect(r.child_name).toBe("Alice");
    expect(r.child_id).toBe("child-1");
    expect(r.routine_date).toBe("2026-05-10");
    expect(r.routine_type).toBe("weekday");
    expect(r.routine_slot).toBe("breakfast");
    expect(r.scheduled_time).toBe("08:00");
    expect(r.actual_time).toBe("08:05");
    expect(r.compliance_rating).toBe("fully_followed");
    expect(r.adapted).toBe(false);
    expect(r.adaptation_reason).toBeNull();
    expect(r.child_engaged).toBe(true);
    expect(r.child_mood).toBe("happy");
    expect(r.staff_supporting).toBe("Staff A");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ child_name: "Bob", compliance_rating: "not_followed" });
    expect(r.child_name).toBe("Bob");
    expect(r.compliance_rating).toBe("not_followed");
    // defaults still apply
    expect(r.routine_type).toBe("weekday");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRecord();
    const r2 = makeRecord();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRecord({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });
});
