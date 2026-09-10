// ══════════════════════════════════════════════════════════════════════════════
// CARA — LANGUAGE & COMMUNICATION SERVICE TESTS
// Pure-function unit tests for language/communication metrics computation,
// alert identification, constant validation.
// CHR 2015 Reg 6 (quality and purpose of care),
// Reg 7 (children's views — ensuring every child can communicate),
// Equality Act 2010 (reasonable adjustments).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";
import {
  _testing,
  COMMUNICATION_NEEDS,
  SUPPORT_TYPES,
  SUPPORT_STATUSES,
  PROGRESS_RATINGS,
} from "../language-communication-service";

import type {
  LanguageRecord,
} from "../language-communication-service";

const { computeLanguageMetrics, identifyLanguageAlerts } = _testing;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

let recordCounter = 0;

/** Build a minimal LanguageRecord with sensible defaults. */
function makeRecord(overrides: Partial<LanguageRecord> = {}): LanguageRecord {
  recordCounter += 1;
  return {
    id: `rec-${recordCounter}`,
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    first_language: "English",
    additional_languages: [],
    communication_need: "speech_language_delay",
    support_type: "speech_therapy",
    support_status: "in_place",
    progress_rating: "good",
    communication_passport_in_place: true,
    interpreter_required: false,
    interpreter_arranged: false,
    specialist_involved: false,
    specialist_name: null,
    staff_aware: true,
    staff_trained: true,
    child_views_captured: true,
    reasonable_adjustments: [],
    review_date: null,
    last_assessment_date: null,
    notes: null,
    created_at: daysAgoISO(10),
    updated_at: daysAgoISO(10),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("COMMUNICATION_NEEDS", () => {
  it("has exactly 12 items", () => {
    expect(COMMUNICATION_NEEDS).toHaveLength(12);
  });

  it("every entry has a need and label", () => {
    for (const entry of COMMUNICATION_NEEDS) {
      expect(entry.need).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });

  it("contains english_additional_language", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "english_additional_language")).toBe(true);
  });

  it("contains speech_language_delay", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "speech_language_delay")).toBe(true);
  });

  it("contains hearing_impairment", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "hearing_impairment")).toBe(true);
  });

  it("contains visual_impairment", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "visual_impairment")).toBe(true);
  });

  it("contains autism_related", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "autism_related")).toBe(true);
  });

  it("contains learning_disability", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "learning_disability")).toBe(true);
  });

  it("contains selective_mutism", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "selective_mutism")).toBe(true);
  });

  it("contains stammering", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "stammering")).toBe(true);
  });

  it("contains nonverbal", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "nonverbal")).toBe(true);
  });

  it("contains limited_verbal", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "limited_verbal")).toBe(true);
  });

  it("contains trauma_related", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "trauma_related")).toBe(true);
  });

  it("contains other", () => {
    expect(COMMUNICATION_NEEDS.some((c) => c.need === "other")).toBe(true);
  });

  it("has no duplicate need values", () => {
    const needs = COMMUNICATION_NEEDS.map((c) => c.need);
    expect(new Set(needs).size).toBe(needs.length);
  });
});

describe("SUPPORT_TYPES", () => {
  it("has exactly 14 items", () => {
    expect(SUPPORT_TYPES).toHaveLength(14);
  });

  it("every entry has a type and label", () => {
    for (const entry of SUPPORT_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });

  it("contains interpreter", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "interpreter")).toBe(true);
  });

  it("contains speech_therapy", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "speech_therapy")).toBe(true);
  });

  it("contains communication_passport", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "communication_passport")).toBe(true);
  });

  it("contains makaton", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "makaton")).toBe(true);
  });

  it("contains pecs", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "pecs")).toBe(true);
  });

  it("contains bsl", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "bsl")).toBe(true);
  });

  it("contains augmentative_device", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "augmentative_device")).toBe(true);
  });

  it("contains visual_schedule", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "visual_schedule")).toBe(true);
  });

  it("contains social_stories", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "social_stories")).toBe(true);
  });

  it("contains easy_read", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "easy_read")).toBe(true);
  });

  it("contains picture_exchange", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "picture_exchange")).toBe(true);
  });

  it("contains staff_training", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "staff_training")).toBe(true);
  });

  it("contains specialist_assessment", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "specialist_assessment")).toBe(true);
  });

  it("contains other", () => {
    expect(SUPPORT_TYPES.some((s) => s.type === "other")).toBe(true);
  });

  it("has no duplicate type values", () => {
    const types = SUPPORT_TYPES.map((s) => s.type);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe("SUPPORT_STATUSES", () => {
  it("has exactly 6 items", () => {
    expect(SUPPORT_STATUSES).toHaveLength(6);
  });

  it("every entry has a status and label", () => {
    for (const entry of SUPPORT_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });

  it("contains in_place", () => {
    expect(SUPPORT_STATUSES.some((s) => s.status === "in_place")).toBe(true);
  });

  it("contains requested", () => {
    expect(SUPPORT_STATUSES.some((s) => s.status === "requested")).toBe(true);
  });

  it("contains awaiting_assessment", () => {
    expect(SUPPORT_STATUSES.some((s) => s.status === "awaiting_assessment")).toBe(true);
  });

  it("contains not_needed", () => {
    expect(SUPPORT_STATUSES.some((s) => s.status === "not_needed")).toBe(true);
  });

  it("contains refused", () => {
    expect(SUPPORT_STATUSES.some((s) => s.status === "refused")).toBe(true);
  });

  it("contains under_review", () => {
    expect(SUPPORT_STATUSES.some((s) => s.status === "under_review")).toBe(true);
  });

  it("has no duplicate status values", () => {
    const statuses = SUPPORT_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });
});

describe("PROGRESS_RATINGS", () => {
  it("has exactly 5 items", () => {
    expect(PROGRESS_RATINGS).toHaveLength(5);
  });

  it("every entry has a rating and label", () => {
    for (const entry of PROGRESS_RATINGS) {
      expect(entry.rating).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });

  it("contains excellent", () => {
    expect(PROGRESS_RATINGS.some((p) => p.rating === "excellent")).toBe(true);
  });

  it("contains good", () => {
    expect(PROGRESS_RATINGS.some((p) => p.rating === "good")).toBe(true);
  });

  it("contains satisfactory", () => {
    expect(PROGRESS_RATINGS.some((p) => p.rating === "satisfactory")).toBe(true);
  });

  it("contains needs_improvement", () => {
    expect(PROGRESS_RATINGS.some((p) => p.rating === "needs_improvement")).toBe(true);
  });

  it("contains not_assessed", () => {
    expect(PROGRESS_RATINGS.some((p) => p.rating === "not_assessed")).toBe(true);
  });

  it("has no duplicate rating values", () => {
    const ratings = PROGRESS_RATINGS.map((p) => p.rating);
    expect(new Set(ratings).size).toBe(ratings.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeLanguageMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeLanguageMetrics", () => {
  // ── Empty array ────────────────────────────────────────────────────────

  describe("empty records", () => {
    it("returns zero total_records", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.total_records).toBe(0);
    });

    it("returns zero children_with_needs", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.children_with_needs).toBe(0);
    });

    it("returns zero needs_coverage", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.needs_coverage).toBe(0);
    });

    it("returns zero support_in_place_count", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.support_in_place_count).toBe(0);
    });

    it("returns zero support_requested_count", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.support_requested_count).toBe(0);
    });

    it("returns zero awaiting_assessment_count", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.awaiting_assessment_count).toBe(0);
    });

    it("returns zero passport_in_place_rate", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.passport_in_place_rate).toBeNull(); // fab-0.
    });

    it("returns zero interpreter_required_count", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.interpreter_required_count).toBe(0);
    });

    it("returns zero interpreter_arranged_rate", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.interpreter_arranged_rate).toBeNull(); // fab-0.
    });

    it("returns zero specialist_involved_rate", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.specialist_involved_rate).toBeNull(); // fab-0.
    });

    it("returns zero staff_aware_rate", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.staff_aware_rate).toBeNull(); // fab-0.
    });

    it("returns zero staff_trained_rate", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.staff_trained_rate).toBeNull(); // fab-0.
    });

    it("returns zero child_views_rate", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.child_views_rate).toBeNull(); // fab-0.
    });

    it("returns zero excellent_progress_count", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.excellent_progress_count).toBe(0);
    });

    it("returns zero needs_improvement_count", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.needs_improvement_count).toBe(0);
    });

    it("returns zero review_overdue_count", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.review_overdue_count).toBe(0);
    });

    it("returns zero average_adjustments_per_child", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.average_adjustments_per_child).toBeNull(); // fab-0.
    });

    it("returns empty by_communication_need", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.by_communication_need).toEqual({});
    });

    it("returns empty by_support_type", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.by_support_type).toEqual({});
    });

    it("returns empty by_support_status", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.by_support_status).toEqual({});
    });

    it("returns empty by_progress", () => {
      const m = computeLanguageMetrics([], 10);
      expect(m.by_progress).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────────

  describe("single record", () => {
    const record = makeRecord({
      id: "single-1",
      child_id: "child-single",
      support_status: "in_place",
      communication_passport_in_place: true,
      interpreter_required: true,
      interpreter_arranged: true,
      specialist_involved: true,
      staff_aware: true,
      staff_trained: true,
      child_views_captured: true,
      progress_rating: "excellent",
      reasonable_adjustments: ["visual aids", "quiet space"],
      communication_need: "autism_related",
      support_type: "visual_schedule",
      review_date: daysAgo(30),
    });

    it("returns total_records of 1", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.total_records).toBe(1);
    });

    it("returns children_with_needs of 1", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.children_with_needs).toBe(1);
    });

    it("computes needs_coverage correctly", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.needs_coverage).toBe(20);
    });

    it("counts support_in_place_count as 1", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.support_in_place_count).toBe(1);
    });

    it("counts support_requested_count as 0", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.support_requested_count).toBe(0);
    });

    it("counts awaiting_assessment_count as 0", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.awaiting_assessment_count).toBe(0);
    });

    it("computes passport_in_place_rate at 100", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.passport_in_place_rate).toBe(100);
    });

    it("counts interpreter_required_count as 1", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.interpreter_required_count).toBe(1);
    });

    it("computes interpreter_arranged_rate at 100", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.interpreter_arranged_rate).toBe(100);
    });

    it("computes specialist_involved_rate at 100", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.specialist_involved_rate).toBe(100);
    });

    it("computes staff_aware_rate at 100", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.staff_aware_rate).toBe(100);
    });

    it("computes staff_trained_rate at 100", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.staff_trained_rate).toBe(100);
    });

    it("computes child_views_rate at 100", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.child_views_rate).toBe(100);
    });

    it("counts excellent_progress_count as 1", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.excellent_progress_count).toBe(1);
    });

    it("counts needs_improvement_count as 0", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.needs_improvement_count).toBe(0);
    });

    it("counts review_overdue_count as 1 when review_date in the past", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("computes average_adjustments_per_child correctly", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.average_adjustments_per_child).toBe(2);
    });

    it("populates by_communication_need with single entry", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.by_communication_need).toEqual({ autism_related: 1 });
    });

    it("populates by_support_type with single entry", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.by_support_type).toEqual({ visual_schedule: 1 });
    });

    it("populates by_support_status with single entry", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.by_support_status).toEqual({ in_place: 1 });
    });

    it("populates by_progress with single entry", () => {
      const m = computeLanguageMetrics([record], 5);
      expect(m.by_progress).toEqual({ excellent: 1 });
    });
  });

  // ── Multiple records ───────────────────────────────────────────────────

  describe("multiple records", () => {
    const records = [
      makeRecord({
        id: "m-1",
        child_id: "child-a",
        child_name: "Alice",
        support_status: "in_place",
        communication_passport_in_place: true,
        interpreter_required: true,
        interpreter_arranged: true,
        specialist_involved: true,
        staff_aware: true,
        staff_trained: true,
        child_views_captured: true,
        progress_rating: "excellent",
        communication_need: "english_additional_language",
        support_type: "interpreter",
        reasonable_adjustments: ["translated materials"],
        review_date: daysFromNow(10),
      }),
      makeRecord({
        id: "m-2",
        child_id: "child-b",
        child_name: "Bob",
        support_status: "requested",
        communication_passport_in_place: false,
        interpreter_required: true,
        interpreter_arranged: false,
        specialist_involved: false,
        staff_aware: true,
        staff_trained: false,
        child_views_captured: false,
        progress_rating: "needs_improvement",
        communication_need: "speech_language_delay",
        support_type: "speech_therapy",
        reasonable_adjustments: [],
        review_date: daysAgo(5),
      }),
      makeRecord({
        id: "m-3",
        child_id: "child-c",
        child_name: "Charlie",
        support_status: "awaiting_assessment",
        communication_passport_in_place: false,
        interpreter_required: false,
        interpreter_arranged: false,
        specialist_involved: false,
        staff_aware: false,
        staff_trained: false,
        child_views_captured: true,
        progress_rating: "satisfactory",
        communication_need: "hearing_impairment",
        support_type: "bsl",
        reasonable_adjustments: ["front seating", "visual alerts", "written instructions"],
        review_date: null,
      }),
      makeRecord({
        id: "m-4",
        child_id: "child-a",
        child_name: "Alice",
        support_status: "in_place",
        communication_passport_in_place: true,
        interpreter_required: false,
        interpreter_arranged: false,
        specialist_involved: true,
        staff_aware: true,
        staff_trained: true,
        child_views_captured: true,
        progress_rating: "good",
        communication_need: "english_additional_language",
        support_type: "easy_read",
        reasonable_adjustments: ["simplified language"],
        review_date: daysFromNow(5),
      }),
    ];

    it("returns total_records of 4", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.total_records).toBe(4);
    });

    it("counts unique children_with_needs (child-a counted once)", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.children_with_needs).toBe(3);
    });

    it("computes needs_coverage as 30%", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.needs_coverage).toBe(30);
    });

    it("counts support_in_place_count correctly", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.support_in_place_count).toBe(2);
    });

    it("counts support_requested_count correctly", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.support_requested_count).toBe(1);
    });

    it("counts awaiting_assessment_count correctly", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.awaiting_assessment_count).toBe(1);
    });

    it("computes passport_in_place_rate correctly (2/4 = 50%)", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.passport_in_place_rate).toBe(50);
    });

    it("counts interpreter_required_count correctly", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.interpreter_required_count).toBe(2);
    });

    it("computes interpreter_arranged_rate (1 arranged / 2 required = 50%)", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.interpreter_arranged_rate).toBe(50);
    });

    it("computes specialist_involved_rate (2/4 = 50%)", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.specialist_involved_rate).toBe(50);
    });

    it("computes staff_aware_rate (3/4 = 75%)", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.staff_aware_rate).toBe(75);
    });

    it("computes staff_trained_rate (2/4 = 50%)", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.staff_trained_rate).toBe(50);
    });

    it("computes child_views_rate (3/4 = 75%)", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.child_views_rate).toBe(75);
    });

    it("counts excellent_progress_count correctly", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.excellent_progress_count).toBe(1);
    });

    it("counts needs_improvement_count correctly", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.needs_improvement_count).toBe(1);
    });

    it("counts review_overdue_count (only past dates and non-not_needed)", () => {
      const m = computeLanguageMetrics(records, 10);
      // m-2 has review_date in past and status=requested (not not_needed)
      expect(m.review_overdue_count).toBe(1);
    });

    it("computes average_adjustments_per_child (5 total / 3 unique children)", () => {
      const m = computeLanguageMetrics(records, 10);
      // total adjustments: 1 + 0 + 3 + 1 = 5; unique children: 3
      expect(m.average_adjustments_per_child).toBe(1.7);
    });

    it("groups by_communication_need correctly", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.by_communication_need).toEqual({
        english_additional_language: 2,
        speech_language_delay: 1,
        hearing_impairment: 1,
      });
    });

    it("groups by_support_type correctly", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.by_support_type).toEqual({
        interpreter: 1,
        speech_therapy: 1,
        bsl: 1,
        easy_read: 1,
      });
    });

    it("groups by_support_status correctly", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.by_support_status).toEqual({
        in_place: 2,
        requested: 1,
        awaiting_assessment: 1,
      });
    });

    it("groups by_progress correctly", () => {
      const m = computeLanguageMetrics(records, 10);
      expect(m.by_progress).toEqual({
        excellent: 1,
        needs_improvement: 1,
        satisfactory: 1,
        good: 1,
      });
    });
  });

  // ── needs_coverage edge cases ──────────────────────────────────────────

  describe("needs_coverage", () => {
    it("returns 0 when totalChildren is 0", () => {
      const m = computeLanguageMetrics([makeRecord()], 0);
      expect(m.needs_coverage).toBeNull(); // fab-0.
    });

    it("returns 100 when all children have records", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const m = computeLanguageMetrics(records, 2);
      expect(m.needs_coverage).toBe(100);
    });

    it("handles fractional percentages with rounding", () => {
      const records = [makeRecord({ child_id: "c1" })];
      const m = computeLanguageMetrics(records, 3);
      // 1/3 = 33.33...% rounds to 33.3
      expect(m.needs_coverage).toBe(33.3);
    });
  });

  // ── passport_in_place_rate edge cases ──────────────────────────────────

  describe("passport_in_place_rate", () => {
    it("returns 0 when no passports in place", () => {
      const r = makeRecord({ communication_passport_in_place: false });
      const m = computeLanguageMetrics([r], 5);
      expect(m.passport_in_place_rate).toBe(0);
    });

    it("returns 100 when all passports in place", () => {
      const records = [
        makeRecord({ communication_passport_in_place: true, child_id: "c1" }),
        makeRecord({ communication_passport_in_place: true, child_id: "c2" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.passport_in_place_rate).toBe(100);
    });
  });

  // ── interpreter_arranged_rate edge cases ───────────────────────────────

  describe("interpreter_arranged_rate", () => {
    it("returns 0 when no interpreter required", () => {
      const r = makeRecord({ interpreter_required: false });
      const m = computeLanguageMetrics([r], 5);
      expect(m.interpreter_arranged_rate).toBeNull(); // fab-0.
    });

    it("returns 0 when interpreter required but none arranged", () => {
      const r = makeRecord({ interpreter_required: true, interpreter_arranged: false });
      const m = computeLanguageMetrics([r], 5);
      expect(m.interpreter_arranged_rate).toBe(0);
    });

    it("returns 100 when all interpreters arranged", () => {
      const records = [
        makeRecord({ interpreter_required: true, interpreter_arranged: true, child_id: "c1" }),
        makeRecord({ interpreter_required: true, interpreter_arranged: true, child_id: "c2" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.interpreter_arranged_rate).toBe(100);
    });

    it("only counts records where interpreter_required is true for denominator", () => {
      const records = [
        makeRecord({ interpreter_required: true, interpreter_arranged: true, child_id: "c1" }),
        makeRecord({ interpreter_required: false, interpreter_arranged: false, child_id: "c2" }),
        makeRecord({ interpreter_required: true, interpreter_arranged: false, child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      // 1 arranged / 2 required = 50%
      expect(m.interpreter_arranged_rate).toBe(50);
    });

    it("handles fractional interpreter rates", () => {
      const records = [
        makeRecord({ interpreter_required: true, interpreter_arranged: true, child_id: "c1" }),
        makeRecord({ interpreter_required: true, interpreter_arranged: false, child_id: "c2" }),
        makeRecord({ interpreter_required: true, interpreter_arranged: false, child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      // 1/3 = 33.3%
      expect(m.interpreter_arranged_rate).toBe(33.3);
    });
  });

  // ── specialist_involved_rate edge cases ────────────────────────────────

  describe("specialist_involved_rate", () => {
    it("returns 0 when no specialist involved", () => {
      const r = makeRecord({ specialist_involved: false });
      const m = computeLanguageMetrics([r], 5);
      expect(m.specialist_involved_rate).toBe(0);
    });

    it("handles mixed specialist involvement", () => {
      const records = [
        makeRecord({ specialist_involved: true, child_id: "c1" }),
        makeRecord({ specialist_involved: false, child_id: "c2" }),
        makeRecord({ specialist_involved: true, child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      // 2/3 = 66.7%
      expect(m.specialist_involved_rate).toBe(66.7);
    });
  });

  // ── review_overdue_count edge cases ────────────────────────────────────

  describe("review_overdue_count", () => {
    it("does not count records with null review_date", () => {
      const r = makeRecord({ review_date: null, support_status: "in_place" });
      const m = computeLanguageMetrics([r], 5);
      expect(m.review_overdue_count).toBe(0);
    });

    it("does not count records with future review_date", () => {
      const r = makeRecord({ review_date: daysFromNow(30), support_status: "in_place" });
      const m = computeLanguageMetrics([r], 5);
      expect(m.review_overdue_count).toBe(0);
    });

    it("counts records with far-past review_date", () => {
      const r = makeRecord({ review_date: "2020-01-01", support_status: "in_place" });
      const m = computeLanguageMetrics([r], 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("excludes not_needed status from review overdue", () => {
      const r = makeRecord({ review_date: "2020-01-01", support_status: "not_needed" });
      const m = computeLanguageMetrics([r], 5);
      expect(m.review_overdue_count).toBe(0);
    });

    it("counts overdue for refused status", () => {
      const r = makeRecord({ review_date: "2020-01-01", support_status: "refused" });
      const m = computeLanguageMetrics([r], 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("counts overdue for under_review status", () => {
      const r = makeRecord({ review_date: "2020-01-01", support_status: "under_review" });
      const m = computeLanguageMetrics([r], 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("counts overdue for requested status", () => {
      const r = makeRecord({ review_date: "2020-01-01", support_status: "requested" });
      const m = computeLanguageMetrics([r], 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("counts overdue for awaiting_assessment status", () => {
      const r = makeRecord({ review_date: "2020-01-01", support_status: "awaiting_assessment" });
      const m = computeLanguageMetrics([r], 5);
      expect(m.review_overdue_count).toBe(1);
    });

    it("counts multiple overdue records", () => {
      const records = [
        makeRecord({ review_date: "2019-06-01", support_status: "in_place", child_id: "c1" }),
        makeRecord({ review_date: "2018-03-15", support_status: "requested", child_id: "c2" }),
        makeRecord({ review_date: daysFromNow(10), support_status: "in_place", child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.review_overdue_count).toBe(2);
    });
  });

  // ── average_adjustments_per_child edge cases ───────────────────────────

  describe("average_adjustments_per_child", () => {
    it("returns 0 when no adjustments and no children", () => {
      const m = computeLanguageMetrics([], 5);
      expect(m.average_adjustments_per_child).toBeNull(); // fab-0.
    });

    it("sums adjustments across all records for same child", () => {
      const records = [
        makeRecord({ child_id: "c1", reasonable_adjustments: ["a", "b"] }),
        makeRecord({ child_id: "c1", reasonable_adjustments: ["c"] }),
      ];
      const m = computeLanguageMetrics(records, 5);
      // 3 adjustments / 1 unique child = 3.0
      expect(m.average_adjustments_per_child).toBe(3);
    });

    it("averages across multiple unique children", () => {
      const records = [
        makeRecord({ child_id: "c1", reasonable_adjustments: ["a", "b", "c"] }),
        makeRecord({ child_id: "c2", reasonable_adjustments: ["d"] }),
      ];
      const m = computeLanguageMetrics(records, 5);
      // 4 adjustments / 2 unique children = 2.0
      expect(m.average_adjustments_per_child).toBe(2);
    });

    it("handles zero adjustments across records", () => {
      const records = [
        makeRecord({ child_id: "c1", reasonable_adjustments: [] }),
        makeRecord({ child_id: "c2", reasonable_adjustments: [] }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.average_adjustments_per_child).toBe(0);
    });

    it("rounds to one decimal place", () => {
      const records = [
        makeRecord({ child_id: "c1", reasonable_adjustments: ["a"] }),
        makeRecord({ child_id: "c2", reasonable_adjustments: ["b", "c"] }),
        makeRecord({ child_id: "c3", reasonable_adjustments: [] }),
      ];
      const m = computeLanguageMetrics(records, 5);
      // 3 adjustments / 3 children = 1.0
      expect(m.average_adjustments_per_child).toBe(1);
    });
  });

  // ── progress counting ──────────────────────────────────────────────────

  describe("progress counts", () => {
    it("counts only excellent records for excellent_progress_count", () => {
      const records = [
        makeRecord({ progress_rating: "excellent", child_id: "c1" }),
        makeRecord({ progress_rating: "excellent", child_id: "c2" }),
        makeRecord({ progress_rating: "good", child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.excellent_progress_count).toBe(2);
    });

    it("counts only needs_improvement records for needs_improvement_count", () => {
      const records = [
        makeRecord({ progress_rating: "needs_improvement", child_id: "c1" }),
        makeRecord({ progress_rating: "satisfactory", child_id: "c2" }),
        makeRecord({ progress_rating: "needs_improvement", child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.needs_improvement_count).toBe(2);
    });

    it("does not count not_assessed in excellent or needs_improvement", () => {
      const records = [
        makeRecord({ progress_rating: "not_assessed", child_id: "c1" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.excellent_progress_count).toBe(0);
      expect(m.needs_improvement_count).toBe(0);
    });
  });

  // ── by_communication_need breakdown ────────────────────────────────────

  describe("by_communication_need", () => {
    it("tallies multiple need types", () => {
      const records = [
        makeRecord({ communication_need: "nonverbal", child_id: "c1" }),
        makeRecord({ communication_need: "nonverbal", child_id: "c2" }),
        makeRecord({ communication_need: "stammering", child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.by_communication_need).toEqual({
        nonverbal: 2,
        stammering: 1,
      });
    });

    it("handles a single need type", () => {
      const records = [
        makeRecord({ communication_need: "other" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.by_communication_need).toEqual({ other: 1 });
    });
  });

  // ── by_support_type breakdown ──────────────────────────────────────────

  describe("by_support_type", () => {
    it("tallies multiple support types", () => {
      const records = [
        makeRecord({ support_type: "makaton", child_id: "c1" }),
        makeRecord({ support_type: "pecs", child_id: "c2" }),
        makeRecord({ support_type: "makaton", child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.by_support_type).toEqual({
        makaton: 2,
        pecs: 1,
      });
    });
  });

  // ── by_support_status breakdown ────────────────────────────────────────

  describe("by_support_status", () => {
    it("tallies all statuses present", () => {
      const records = [
        makeRecord({ support_status: "in_place", child_id: "c1" }),
        makeRecord({ support_status: "not_needed", child_id: "c2" }),
        makeRecord({ support_status: "refused", child_id: "c3" }),
        makeRecord({ support_status: "in_place", child_id: "c4" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.by_support_status).toEqual({
        in_place: 2,
        not_needed: 1,
        refused: 1,
      });
    });
  });

  // ── by_progress breakdown ──────────────────────────────────────────────

  describe("by_progress", () => {
    it("tallies all progress ratings present", () => {
      const records = [
        makeRecord({ progress_rating: "excellent", child_id: "c1" }),
        makeRecord({ progress_rating: "good", child_id: "c2" }),
        makeRecord({ progress_rating: "satisfactory", child_id: "c3" }),
        makeRecord({ progress_rating: "needs_improvement", child_id: "c4" }),
        makeRecord({ progress_rating: "not_assessed", child_id: "c5" }),
      ];
      const m = computeLanguageMetrics(records, 10);
      expect(m.by_progress).toEqual({
        excellent: 1,
        good: 1,
        satisfactory: 1,
        needs_improvement: 1,
        not_assessed: 1,
      });
    });
  });

  // ── rate rounding ──────────────────────────────────────────────────────

  describe("rate rounding", () => {
    it("rounds staff_aware_rate to one decimal", () => {
      const records = [
        makeRecord({ staff_aware: true, child_id: "c1" }),
        makeRecord({ staff_aware: true, child_id: "c2" }),
        makeRecord({ staff_aware: false, child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      // 2/3 = 66.666... rounded to 66.7
      expect(m.staff_aware_rate).toBe(66.7);
    });

    it("rounds staff_trained_rate to one decimal", () => {
      const records = [
        makeRecord({ staff_trained: true, child_id: "c1" }),
        makeRecord({ staff_trained: false, child_id: "c2" }),
        makeRecord({ staff_trained: false, child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      // 1/3 = 33.333... rounded to 33.3
      expect(m.staff_trained_rate).toBe(33.3);
    });

    it("rounds child_views_rate to one decimal", () => {
      const records = [
        makeRecord({ child_views_captured: true, child_id: "c1" }),
        makeRecord({ child_views_captured: false, child_id: "c2" }),
        makeRecord({ child_views_captured: false, child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.child_views_rate).toBe(33.3);
    });

    it("rounds passport_in_place_rate to one decimal", () => {
      const records = [
        makeRecord({ communication_passport_in_place: true, child_id: "c1" }),
        makeRecord({ communication_passport_in_place: false, child_id: "c2" }),
        makeRecord({ communication_passport_in_place: false, child_id: "c3" }),
      ];
      const m = computeLanguageMetrics(records, 5);
      expect(m.passport_in_place_rate).toBe(33.3);
    });
  });

  // ── totalChildren = 0 edge case ────────────────────────────────────────

  describe("totalChildren zero", () => {
    it("returns needs_coverage 0 even with records", () => {
      const m = computeLanguageMetrics([makeRecord()], 0);
      expect(m.needs_coverage).toBeNull(); // fab-0.
    });
  });

  // ── children_with_needs deduplication ──────────────────────────────────

  describe("children_with_needs deduplication", () => {
    it("counts each child_id only once even with multiple records", () => {
      const records = [
        makeRecord({ child_id: "child-x" }),
        makeRecord({ child_id: "child-x" }),
        makeRecord({ child_id: "child-x" }),
        makeRecord({ child_id: "child-y" }),
      ];
      const m = computeLanguageMetrics(records, 10);
      expect(m.children_with_needs).toBe(2);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyLanguageAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyLanguageAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────────

  describe("no alerts scenario", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyLanguageAlerts([], 10);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all conditions are fine", () => {
      const records = [
        makeRecord({
          interpreter_required: false,
          support_status: "in_place",
          staff_trained: true,
          progress_rating: "good",
          specialist_involved: true,
          child_views_captured: true,
        }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      expect(alerts).toEqual([]);
    });
  });

  // ── interpreter_not_arranged ───────────────────────────────────────────

  describe("interpreter_not_arranged alert", () => {
    it("fires when interpreter_required=true and interpreter_arranged=false", () => {
      const r = makeRecord({
        id: "alert-1",
        interpreter_required: true,
        interpreter_arranged: false,
        child_name: "Sam",
        first_language: "Arabic",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "interpreter_not_arranged");
      expect(found).toBeDefined();
    });

    it("has severity critical", () => {
      const r = makeRecord({
        id: "alert-sev",
        interpreter_required: true,
        interpreter_arranged: false,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "interpreter_not_arranged");
      expect(found!.severity).toBe("critical");
    });

    it("includes child_name in message", () => {
      const r = makeRecord({
        id: "alert-msg",
        interpreter_required: true,
        interpreter_arranged: false,
        child_name: "Eva",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "interpreter_not_arranged");
      expect(found!.message).toContain("Eva");
    });

    it("includes first_language in message", () => {
      const r = makeRecord({
        id: "alert-lang",
        interpreter_required: true,
        interpreter_arranged: false,
        first_language: "Polish",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "interpreter_not_arranged");
      expect(found!.message).toContain("Polish");
    });

    it("uses the record id as alert id", () => {
      const r = makeRecord({
        id: "rec-xyz",
        interpreter_required: true,
        interpreter_arranged: false,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "interpreter_not_arranged");
      expect(found!.id).toBe("rec-xyz");
    });

    it("does not fire when interpreter is arranged", () => {
      const r = makeRecord({
        interpreter_required: true,
        interpreter_arranged: true,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "interpreter_not_arranged");
      expect(found).toBeUndefined();
    });

    it("does not fire when interpreter is not required", () => {
      const r = makeRecord({
        interpreter_required: false,
        interpreter_arranged: false,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "interpreter_not_arranged");
      expect(found).toBeUndefined();
    });

    it("fires for each record missing an interpreter", () => {
      const records = [
        makeRecord({ id: "int-1", interpreter_required: true, interpreter_arranged: false, child_id: "c1" }),
        makeRecord({ id: "int-2", interpreter_required: true, interpreter_arranged: false, child_id: "c2" }),
        makeRecord({ id: "int-3", interpreter_required: true, interpreter_arranged: true, child_id: "c3" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const interpreterAlerts = alerts.filter((a) => a.type === "interpreter_not_arranged");
      expect(interpreterAlerts).toHaveLength(2);
    });
  });

  // ── awaiting_assessment ────────────────────────────────────────────────

  describe("awaiting_assessment alert", () => {
    it("fires when 2 or more records have awaiting_assessment status", () => {
      const records = [
        makeRecord({ id: "aw-1", support_status: "awaiting_assessment", child_id: "c1" }),
        makeRecord({ id: "aw-2", support_status: "awaiting_assessment", child_id: "c2" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "awaiting_assessment");
      expect(found).toBeDefined();
    });

    it("has severity high", () => {
      const records = [
        makeRecord({ support_status: "awaiting_assessment", child_id: "c1" }),
        makeRecord({ support_status: "awaiting_assessment", child_id: "c2" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "awaiting_assessment");
      expect(found!.severity).toBe("high");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ support_status: "awaiting_assessment", child_id: "c1" }),
        makeRecord({ support_status: "awaiting_assessment", child_id: "c2" }),
        makeRecord({ support_status: "awaiting_assessment", child_id: "c3" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "awaiting_assessment");
      expect(found!.message).toContain("3");
    });

    it("uses awaiting_assessment as alert id", () => {
      const records = [
        makeRecord({ support_status: "awaiting_assessment", child_id: "c1" }),
        makeRecord({ support_status: "awaiting_assessment", child_id: "c2" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "awaiting_assessment");
      expect(found!.id).toBe("awaiting_assessment");
    });

    it("does not fire when only 1 record awaiting assessment", () => {
      const records = [
        makeRecord({ support_status: "awaiting_assessment", child_id: "c1" }),
        makeRecord({ support_status: "in_place", child_id: "c2" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "awaiting_assessment");
      expect(found).toBeUndefined();
    });

    it("does not fire when zero records awaiting assessment", () => {
      const records = [
        makeRecord({ support_status: "in_place", child_id: "c1" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "awaiting_assessment");
      expect(found).toBeUndefined();
    });

    it("fires exactly once even with many awaiting", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeRecord({ support_status: "awaiting_assessment", child_id: `c${i}` }),
      );
      const alerts = identifyLanguageAlerts(records, 10);
      const awaitingAlerts = alerts.filter((a) => a.type === "awaiting_assessment");
      expect(awaitingAlerts).toHaveLength(1);
    });
  });

  // ── staff_not_trained ──────────────────────────────────────────────────

  describe("staff_not_trained alert", () => {
    it("fires when staff_trained=false and support_status=in_place", () => {
      const r = makeRecord({
        id: "train-1",
        staff_trained: false,
        support_status: "in_place",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "staff_not_trained");
      expect(found).toBeDefined();
    });

    it("has severity high", () => {
      const r = makeRecord({
        id: "train-sev",
        staff_trained: false,
        support_status: "in_place",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "staff_not_trained");
      expect(found!.severity).toBe("high");
    });

    it("includes child_name in message", () => {
      const r = makeRecord({
        id: "train-msg",
        staff_trained: false,
        support_status: "in_place",
        child_name: "Zara",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "staff_not_trained");
      expect(found!.message).toContain("Zara");
    });

    it("includes support_type in message (formatted)", () => {
      const r = makeRecord({
        id: "train-type",
        staff_trained: false,
        support_status: "in_place",
        support_type: "visual_schedule",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "staff_not_trained");
      expect(found!.message).toContain("visual schedule");
    });

    it("uses the record id as alert id", () => {
      const r = makeRecord({
        id: "train-id-check",
        staff_trained: false,
        support_status: "in_place",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "staff_not_trained");
      expect(found!.id).toBe("train-id-check");
    });

    it("does not fire when staff_trained=true", () => {
      const r = makeRecord({
        staff_trained: true,
        support_status: "in_place",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "staff_not_trained");
      expect(found).toBeUndefined();
    });

    it("does not fire when support_status is not in_place", () => {
      const r = makeRecord({
        staff_trained: false,
        support_status: "requested",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "staff_not_trained");
      expect(found).toBeUndefined();
    });

    it("does not fire for awaiting_assessment status even when untrained", () => {
      const r = makeRecord({
        staff_trained: false,
        support_status: "awaiting_assessment",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "staff_not_trained");
      expect(found).toBeUndefined();
    });

    it("fires for each untrained in_place record", () => {
      const records = [
        makeRecord({ id: "ut-1", staff_trained: false, support_status: "in_place", child_id: "c1" }),
        makeRecord({ id: "ut-2", staff_trained: false, support_status: "in_place", child_id: "c2" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const trainAlerts = alerts.filter((a) => a.type === "staff_not_trained");
      expect(trainAlerts).toHaveLength(2);
    });
  });

  // ── needs_specialist ───────────────────────────────────────────────────

  describe("needs_specialist alert", () => {
    it("fires when progress=needs_improvement and specialist_involved=false", () => {
      const r = makeRecord({
        id: "spec-1",
        progress_rating: "needs_improvement",
        specialist_involved: false,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "needs_specialist");
      expect(found).toBeDefined();
    });

    it("has severity medium", () => {
      const r = makeRecord({
        id: "spec-sev",
        progress_rating: "needs_improvement",
        specialist_involved: false,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "needs_specialist");
      expect(found!.severity).toBe("medium");
    });

    it("includes child_name in message", () => {
      const r = makeRecord({
        id: "spec-msg",
        progress_rating: "needs_improvement",
        specialist_involved: false,
        child_name: "Marcus",
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "needs_specialist");
      expect(found!.message).toContain("Marcus");
    });

    it("uses the record id as alert id", () => {
      const r = makeRecord({
        id: "spec-id-test",
        progress_rating: "needs_improvement",
        specialist_involved: false,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "needs_specialist");
      expect(found!.id).toBe("spec-id-test");
    });

    it("does not fire when specialist is involved", () => {
      const r = makeRecord({
        progress_rating: "needs_improvement",
        specialist_involved: true,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "needs_specialist");
      expect(found).toBeUndefined();
    });

    it("does not fire when progress is not needs_improvement", () => {
      const r = makeRecord({
        progress_rating: "good",
        specialist_involved: false,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "needs_specialist");
      expect(found).toBeUndefined();
    });

    it("does not fire for excellent progress without specialist", () => {
      const r = makeRecord({
        progress_rating: "excellent",
        specialist_involved: false,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "needs_specialist");
      expect(found).toBeUndefined();
    });

    it("does not fire for satisfactory progress without specialist", () => {
      const r = makeRecord({
        progress_rating: "satisfactory",
        specialist_involved: false,
      });
      const alerts = identifyLanguageAlerts([r], 10);
      const found = alerts.find((a) => a.type === "needs_specialist");
      expect(found).toBeUndefined();
    });

    it("fires for each matching record", () => {
      const records = [
        makeRecord({ id: "ns-1", progress_rating: "needs_improvement", specialist_involved: false, child_id: "c1" }),
        makeRecord({ id: "ns-2", progress_rating: "needs_improvement", specialist_involved: false, child_id: "c2" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const specialistAlerts = alerts.filter((a) => a.type === "needs_specialist");
      expect(specialistAlerts).toHaveLength(2);
    });
  });

  // ── child_views_missing ────────────────────────────────────────────────

  describe("child_views_missing alert", () => {
    it("fires when 3 or more records lack child views (excluding not_needed)", () => {
      const records = [
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c1" }),
        makeRecord({ child_views_captured: false, support_status: "requested", child_id: "c2" }),
        makeRecord({ child_views_captured: false, support_status: "awaiting_assessment", child_id: "c3" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "child_views_missing");
      expect(found).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c1" }),
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c2" }),
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c3" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "child_views_missing");
      expect(found!.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c1" }),
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c2" }),
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c3" }),
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c4" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "child_views_missing");
      expect(found!.message).toContain("4");
    });

    it("uses views_missing as alert id", () => {
      const records = [
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c1" }),
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c2" }),
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c3" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "child_views_missing");
      expect(found!.id).toBe("views_missing");
    });

    it("does not fire with only 2 missing views", () => {
      const records = [
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c1" }),
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c2" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "child_views_missing");
      expect(found).toBeUndefined();
    });

    it("does not fire with 0 missing views", () => {
      const records = [
        makeRecord({ child_views_captured: true, child_id: "c1" }),
        makeRecord({ child_views_captured: true, child_id: "c2" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "child_views_missing");
      expect(found).toBeUndefined();
    });

    it("excludes not_needed status from count", () => {
      const records = [
        makeRecord({ child_views_captured: false, support_status: "not_needed", child_id: "c1" }),
        makeRecord({ child_views_captured: false, support_status: "not_needed", child_id: "c2" }),
        makeRecord({ child_views_captured: false, support_status: "not_needed", child_id: "c3" }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "child_views_missing");
      expect(found).toBeUndefined();
    });

    it("counts not_needed exclusion precisely", () => {
      const records = [
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c1" }),
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: "c2" }),
        makeRecord({ child_views_captured: false, support_status: "not_needed", child_id: "c3" }),
      ];
      // Only 2 non-not_needed missing views, threshold is 3
      const alerts = identifyLanguageAlerts(records, 10);
      const found = alerts.find((a) => a.type === "child_views_missing");
      expect(found).toBeUndefined();
    });

    it("fires exactly once even with many missing", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeRecord({ child_views_captured: false, support_status: "in_place", child_id: `c${i}` }),
      );
      const alerts = identifyLanguageAlerts(records, 20);
      const viewsAlerts = alerts.filter((a) => a.type === "child_views_missing");
      expect(viewsAlerts).toHaveLength(1);
    });
  });

  // ── Combined alerts ────────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can return multiple alert types simultaneously", () => {
      const records = [
        // Trigger interpreter_not_arranged (critical)
        makeRecord({
          id: "combo-1",
          child_id: "c1",
          interpreter_required: true,
          interpreter_arranged: false,
          support_status: "in_place",
          staff_trained: false,
          progress_rating: "needs_improvement",
          specialist_involved: false,
          child_views_captured: false,
        }),
        // More awaiting_assessment to trigger that alert
        makeRecord({
          id: "combo-2",
          child_id: "c2",
          support_status: "awaiting_assessment",
          child_views_captured: false,
        }),
        makeRecord({
          id: "combo-3",
          child_id: "c3",
          support_status: "awaiting_assessment",
          child_views_captured: false,
        }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);

      const types = new Set(alerts.map((a) => a.type));
      expect(types.has("interpreter_not_arranged")).toBe(true);
      expect(types.has("awaiting_assessment")).toBe(true);
      expect(types.has("staff_not_trained")).toBe(true);
      expect(types.has("needs_specialist")).toBe(true);
      expect(types.has("child_views_missing")).toBe(true);
    });

    it("returns alerts in expected order (critical first)", () => {
      const records = [
        makeRecord({
          id: "order-1",
          child_id: "c1",
          interpreter_required: true,
          interpreter_arranged: false,
          support_status: "in_place",
          staff_trained: false,
          progress_rating: "needs_improvement",
          specialist_involved: false,
          child_views_captured: false,
        }),
        makeRecord({
          id: "order-2",
          child_id: "c2",
          support_status: "awaiting_assessment",
          child_views_captured: false,
        }),
        makeRecord({
          id: "order-3",
          child_id: "c3",
          support_status: "awaiting_assessment",
          child_views_captured: false,
        }),
      ];
      const alerts = identifyLanguageAlerts(records, 10);
      // First alert should be critical (interpreter)
      expect(alerts[0].severity).toBe("critical");
    });
  });

  // ── Edge: totalChildren parameter not used by alerts ───────────────────

  describe("totalChildren parameter", () => {
    it("does not affect alert generation (totalChildren=0)", () => {
      const r = makeRecord({
        id: "tc-1",
        interpreter_required: true,
        interpreter_arranged: false,
      });
      const alerts = identifyLanguageAlerts([r], 0);
      expect(alerts.find((a) => a.type === "interpreter_not_arranged")).toBeDefined();
    });

    it("does not affect alert generation (large totalChildren)", () => {
      const r = makeRecord({
        id: "tc-2",
        interpreter_required: true,
        interpreter_arranged: false,
      });
      const alerts = identifyLanguageAlerts([r], 1000);
      expect(alerts.find((a) => a.type === "interpreter_not_arranged")).toBeDefined();
    });
  });
});
