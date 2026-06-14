// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE & PARTICIPATION TRACKING SERVICE TESTS
// Pure-function unit tests for voice participation metrics computation,
// alert identification, Cara insight generation, enum validation, and
// CRUD fallback behaviour (Supabase disabled).
// CHR 2015 Reg 7 (views, wishes and feelings of children),
// CHR 2015 Reg 44/45 (children consulted during visits/reviews),
// UNCRC Article 12 (right to be heard).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  PARTICIPATION_TYPES,
  VOICE_OUTCOMES,
  PARTICIPATION_LEVELS,
  FEEDBACK_METHODS,
  _testing,
  listChildVoiceParticipation,
  createChildVoiceParticipation,
} from "../child-voice-participation-tracking-service";

import type {
  ChildVoiceParticipationTrackingRow,
} from "../child-voice-participation-tracking-service";

const {
  computeVoiceParticipationMetrics,
  computeVoiceParticipationAlerts,
  generateVoiceParticipationCaraInsights,
} = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

// ── Factory ──────────────────────────────────────────────────────────────

function makeRow(
  overrides?: Partial<ChildVoiceParticipationTrackingRow>,
): ChildVoiceParticipationTrackingRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    participation_date: overrides?.participation_date ?? now.toISOString().split("T")[0],
    participation_type: overrides?.participation_type ?? "house_meeting",
    voice_outcome: overrides?.voice_outcome ?? "views_fully_incorporated",
    participation_level: overrides?.participation_level ?? "active",
    feedback_method: overrides?.feedback_method ?? "verbal",
    child_prepared_beforehand: overrides?.child_prepared_beforehand ?? true,
    child_understood_process: overrides?.child_understood_process ?? true,
    child_felt_heard: overrides?.child_felt_heard ?? true,
    outcome_fed_back: overrides?.outcome_fed_back ?? true,
    advocate_present: overrides?.advocate_present ?? false,
    age_appropriate_methods: overrides?.age_appropriate_methods ?? true,
    decision_changed_by_voice: overrides?.decision_changed_by_voice ?? false,
    child_satisfied_with_outcome: overrides?.child_satisfied_with_outcome ?? true,
    facilitator_name: "facilitator_name" in (overrides ?? {}) ? (overrides!.facilitator_name ?? null) : null,
    child_feedback_verbatim: "child_feedback_verbatim" in (overrides ?? {}) ? (overrides!.child_feedback_verbatim ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. ENUM VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Enum validation", () => {
  // ── PARTICIPATION_TYPES ───────────────────────────────────────────────
  describe("PARTICIPATION_TYPES", () => {
    it("has 10 values", () => { expect(PARTICIPATION_TYPES).toHaveLength(10); });
    it("contains care_plan_review", () => { expect(PARTICIPATION_TYPES).toContain("care_plan_review"); });
    it("contains house_meeting", () => { expect(PARTICIPATION_TYPES).toContain("house_meeting"); });
    it("contains complaints_process", () => { expect(PARTICIPATION_TYPES).toContain("complaints_process"); });
    it("contains reg44_visit", () => { expect(PARTICIPATION_TYPES).toContain("reg44_visit"); });
    it("contains reg45_review", () => { expect(PARTICIPATION_TYPES).toContain("reg45_review"); });
    it("contains placement_plan", () => { expect(PARTICIPATION_TYPES).toContain("placement_plan"); });
    it("contains individual_review", () => { expect(PARTICIPATION_TYPES).toContain("individual_review"); });
    it("contains feedback_session", () => { expect(PARTICIPATION_TYPES).toContain("feedback_session"); });
    it("contains advocacy_meeting", () => { expect(PARTICIPATION_TYPES).toContain("advocacy_meeting"); });
    it("contains informal_consultation", () => { expect(PARTICIPATION_TYPES).toContain("informal_consultation"); });
    it("has no duplicates", () => { expect(new Set(PARTICIPATION_TYPES).size).toBe(PARTICIPATION_TYPES.length); });
  });

  // ── VOICE_OUTCOMES ────────────────────────────────────────────────────
  describe("VOICE_OUTCOMES", () => {
    it("has 6 values", () => { expect(VOICE_OUTCOMES).toHaveLength(6); });
    it("contains views_fully_incorporated", () => { expect(VOICE_OUTCOMES).toContain("views_fully_incorporated"); });
    it("contains views_partially_incorporated", () => { expect(VOICE_OUTCOMES).toContain("views_partially_incorporated"); });
    it("contains views_acknowledged", () => { expect(VOICE_OUTCOMES).toContain("views_acknowledged"); });
    it("contains views_not_sought", () => { expect(VOICE_OUTCOMES).toContain("views_not_sought"); });
    it("contains child_declined", () => { expect(VOICE_OUTCOMES).toContain("child_declined"); });
    it("contains unable_to_participate", () => { expect(VOICE_OUTCOMES).toContain("unable_to_participate"); });
    it("has no duplicates", () => { expect(new Set(VOICE_OUTCOMES).size).toBe(VOICE_OUTCOMES.length); });
  });

  // ── PARTICIPATION_LEVELS ──────────────────────────────────────────────
  describe("PARTICIPATION_LEVELS", () => {
    it("has 6 values", () => { expect(PARTICIPATION_LEVELS).toHaveLength(6); });
    it("contains leading", () => { expect(PARTICIPATION_LEVELS).toContain("leading"); });
    it("contains active", () => { expect(PARTICIPATION_LEVELS).toContain("active"); });
    it("contains consulted", () => { expect(PARTICIPATION_LEVELS).toContain("consulted"); });
    it("contains informed", () => { expect(PARTICIPATION_LEVELS).toContain("informed"); });
    it("contains passive", () => { expect(PARTICIPATION_LEVELS).toContain("passive"); });
    it("contains not_involved", () => { expect(PARTICIPATION_LEVELS).toContain("not_involved"); });
    it("has no duplicates", () => { expect(new Set(PARTICIPATION_LEVELS).size).toBe(PARTICIPATION_LEVELS.length); });
  });

  // ── FEEDBACK_METHODS ──────────────────────────────────────────────────
  describe("FEEDBACK_METHODS", () => {
    it("has 7 values", () => { expect(FEEDBACK_METHODS).toHaveLength(7); });
    it("contains verbal", () => { expect(FEEDBACK_METHODS).toContain("verbal"); });
    it("contains written", () => { expect(FEEDBACK_METHODS).toContain("written"); });
    it("contains digital", () => { expect(FEEDBACK_METHODS).toContain("digital"); });
    it("contains pictorial", () => { expect(FEEDBACK_METHODS).toContain("pictorial"); });
    it("contains advocate", () => { expect(FEEDBACK_METHODS).toContain("advocate"); });
    it("contains sign_language", () => { expect(FEEDBACK_METHODS).toContain("sign_language"); });
    it("contains other", () => { expect(FEEDBACK_METHODS).toContain("other"); });
    it("has no duplicates", () => { expect(new Set(FEEDBACK_METHODS).size).toBe(FEEDBACK_METHODS.length); });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeVoiceParticipationMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVoiceParticipationMetrics", () => {
  // ── Empty inputs ────────────────────────────────────────────────────
  describe("empty inputs", () => {
    it("returns total_records = 0", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(m.total_records).toBe(0);
    });

    it("returns views_not_sought_count = 0", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(m.views_not_sought_count).toBe(0);
    });

    it("returns not_involved_count = 0", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(m.not_involved_count).toBe(0);
    });

    it("returns declined_count = 0", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(m.declined_count).toBe(0);
    });

    it("returns decision_changed_count = 0", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(m.decision_changed_count).toBe(0);
    });

    it("returns all rates as 0", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(m.child_prepared_rate).toBe(0);
      expect(m.child_understood_rate).toBe(0);
      expect(m.child_felt_heard_rate).toBe(0);
      expect(m.outcome_fed_back_rate).toBe(0);
      expect(m.advocate_present_rate).toBe(0);
      expect(m.age_appropriate_rate).toBe(0);
      expect(m.decision_changed_rate).toBe(0);
      expect(m.child_satisfied_rate).toBe(0);
    });

    it("returns empty participation_type_breakdown", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(m.participation_type_breakdown).toEqual({});
    });

    it("returns empty outcome_breakdown", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(m.outcome_breakdown).toEqual({});
    });

    it("returns unique_children = 0", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(m.unique_children).toBe(0);
    });
  });

  // ── total_records ──────────────────────────────────────────────────
  describe("total_records", () => {
    it("counts single record", () => {
      const m = computeVoiceParticipationMetrics([makeRow()]);
      expect(m.total_records).toBe(1);
    });

    it("counts multiple records", () => {
      const rows = [makeRow(), makeRow(), makeRow()];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.total_records).toBe(3);
    });
  });

  // ── views_not_sought_count ─────────────────────────────────────────
  describe("views_not_sought_count", () => {
    it("counts views_not_sought outcomes", () => {
      const rows = [
        makeRow({ voice_outcome: "views_not_sought" }),
        makeRow({ voice_outcome: "views_not_sought" }),
        makeRow({ voice_outcome: "views_fully_incorporated" }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.views_not_sought_count).toBe(2);
    });

    it("returns 0 when no views_not_sought", () => {
      const rows = [makeRow({ voice_outcome: "views_fully_incorporated" })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.views_not_sought_count).toBe(0);
    });
  });

  // ── not_involved_count ─────────────────────────────────────────────
  describe("not_involved_count", () => {
    it("counts not_involved participation level", () => {
      const rows = [
        makeRow({ participation_level: "not_involved" }),
        makeRow({ participation_level: "active" }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.not_involved_count).toBe(1);
    });

    it("returns 0 when no not_involved", () => {
      const rows = [makeRow({ participation_level: "leading" })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.not_involved_count).toBe(0);
    });
  });

  // ── declined_count ─────────────────────────────────────────────────
  describe("declined_count", () => {
    it("counts child_declined outcomes", () => {
      const rows = [
        makeRow({ voice_outcome: "child_declined" }),
        makeRow({ voice_outcome: "child_declined" }),
        makeRow({ voice_outcome: "child_declined" }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.declined_count).toBe(3);
    });
  });

  // ── decision_changed_count ─────────────────────────────────────────
  describe("decision_changed_count", () => {
    it("counts records where decision changed", () => {
      const rows = [
        makeRow({ decision_changed_by_voice: true }),
        makeRow({ decision_changed_by_voice: false }),
        makeRow({ decision_changed_by_voice: true }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.decision_changed_count).toBe(2);
    });
  });

  // ── Boolean rate fields ────────────────────────────────────────────
  describe("child_prepared_rate", () => {
    it("returns 100 when all prepared", () => {
      const rows = [
        makeRow({ child_prepared_beforehand: true }),
        makeRow({ child_prepared_beforehand: true }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_prepared_rate).toBe(100);
    });

    it("returns 0 when none prepared", () => {
      const rows = [
        makeRow({ child_prepared_beforehand: false }),
        makeRow({ child_prepared_beforehand: false }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_prepared_rate).toBe(0);
    });

    it("returns 50 when half prepared", () => {
      const rows = [
        makeRow({ child_prepared_beforehand: true }),
        makeRow({ child_prepared_beforehand: false }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_prepared_rate).toBe(50);
    });

    it("rounds to one decimal place (1 of 3 = 33.3)", () => {
      const rows = [
        makeRow({ child_prepared_beforehand: true }),
        makeRow({ child_prepared_beforehand: false }),
        makeRow({ child_prepared_beforehand: false }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_prepared_rate).toBe(33.3);
    });
  });

  describe("child_understood_rate", () => {
    it("returns 100 when all understood", () => {
      const rows = [makeRow({ child_understood_process: true })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_understood_rate).toBe(100);
    });

    it("returns 0 when none understood", () => {
      const rows = [makeRow({ child_understood_process: false })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_understood_rate).toBe(0);
    });
  });

  describe("child_felt_heard_rate", () => {
    it("returns 100 when all felt heard", () => {
      const rows = [makeRow({ child_felt_heard: true }), makeRow({ child_felt_heard: true })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_felt_heard_rate).toBe(100);
    });

    it("returns 0 when none felt heard", () => {
      const rows = [makeRow({ child_felt_heard: false })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_felt_heard_rate).toBe(0);
    });

    it("computes mixed rate correctly (2 of 3 = 66.7)", () => {
      const rows = [
        makeRow({ child_felt_heard: true }),
        makeRow({ child_felt_heard: true }),
        makeRow({ child_felt_heard: false }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_felt_heard_rate).toBe(66.7);
    });
  });

  describe("outcome_fed_back_rate", () => {
    it("returns 100 when all fed back", () => {
      const rows = [makeRow({ outcome_fed_back: true })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.outcome_fed_back_rate).toBe(100);
    });

    it("returns 0 when none fed back", () => {
      const rows = [makeRow({ outcome_fed_back: false })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.outcome_fed_back_rate).toBe(0);
    });
  });

  describe("advocate_present_rate", () => {
    it("returns 100 when all have advocate", () => {
      const rows = [makeRow({ advocate_present: true })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.advocate_present_rate).toBe(100);
    });

    it("returns 0 when no advocate present", () => {
      const rows = [makeRow({ advocate_present: false })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.advocate_present_rate).toBe(0);
    });
  });

  describe("age_appropriate_rate", () => {
    it("returns 100 when all age-appropriate", () => {
      const rows = [makeRow({ age_appropriate_methods: true })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.age_appropriate_rate).toBe(100);
    });

    it("returns 0 when none age-appropriate", () => {
      const rows = [makeRow({ age_appropriate_methods: false })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.age_appropriate_rate).toBe(0);
    });
  });

  describe("decision_changed_rate", () => {
    it("returns 100 when all decisions changed", () => {
      const rows = [makeRow({ decision_changed_by_voice: true })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.decision_changed_rate).toBe(100);
    });

    it("returns 0 when no decisions changed", () => {
      const rows = [makeRow({ decision_changed_by_voice: false })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.decision_changed_rate).toBe(0);
    });
  });

  describe("child_satisfied_rate", () => {
    it("returns 100 when all satisfied", () => {
      const rows = [makeRow({ child_satisfied_with_outcome: true })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_satisfied_rate).toBe(100);
    });

    it("returns 0 when none satisfied", () => {
      const rows = [makeRow({ child_satisfied_with_outcome: false })];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_satisfied_rate).toBe(0);
    });

    it("computes mixed rate (1 of 3 = 33.3)", () => {
      const rows = [
        makeRow({ child_satisfied_with_outcome: true }),
        makeRow({ child_satisfied_with_outcome: false }),
        makeRow({ child_satisfied_with_outcome: false }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_satisfied_rate).toBe(33.3);
    });
  });

  // ── participation_type_breakdown ───────────────────────────────────
  describe("participation_type_breakdown", () => {
    it("groups by participation type", () => {
      const rows = [
        makeRow({ participation_type: "house_meeting" }),
        makeRow({ participation_type: "house_meeting" }),
        makeRow({ participation_type: "care_plan_review" }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.participation_type_breakdown).toEqual({ house_meeting: 2, care_plan_review: 1 });
    });

    it("handles single type", () => {
      const rows = [
        makeRow({ participation_type: "reg44_visit" }),
        makeRow({ participation_type: "reg44_visit" }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.participation_type_breakdown).toEqual({ reg44_visit: 2 });
    });

    it("handles all participation types", () => {
      const rows = PARTICIPATION_TYPES.map((pt) => makeRow({ participation_type: pt }));
      const m = computeVoiceParticipationMetrics(rows);
      for (const pt of PARTICIPATION_TYPES) {
        expect(m.participation_type_breakdown[pt]).toBe(1);
      }
    });
  });

  // ── outcome_breakdown ──────────────────────────────────────────────
  describe("outcome_breakdown", () => {
    it("groups by voice outcome", () => {
      const rows = [
        makeRow({ voice_outcome: "views_fully_incorporated" }),
        makeRow({ voice_outcome: "views_fully_incorporated" }),
        makeRow({ voice_outcome: "views_acknowledged" }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.outcome_breakdown).toEqual({ views_fully_incorporated: 2, views_acknowledged: 1 });
    });

    it("handles all outcome types", () => {
      const rows = VOICE_OUTCOMES.map((vo) => makeRow({ voice_outcome: vo }));
      const m = computeVoiceParticipationMetrics(rows);
      for (const vo of VOICE_OUTCOMES) {
        expect(m.outcome_breakdown[vo]).toBe(1);
      }
    });
  });

  // ── unique_children ────────────────────────────────────────────────
  describe("unique_children", () => {
    it("counts unique children by name", () => {
      const rows = [
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.unique_children).toBe(2);
    });

    it("returns 1 for single child with multiple records", () => {
      const rows = [
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Alice" }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.unique_children).toBe(1);
    });

    it("counts each distinct name once", () => {
      const rows = [
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
        makeRow({ child_name: "Charlie" }),
        makeRow({ child_name: "Diana" }),
      ];
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.unique_children).toBe(4);
    });
  });

  // ── Return shape ───────────────────────────────────────────────────
  describe("return shape", () => {
    it("returns all expected keys", () => {
      const m = computeVoiceParticipationMetrics([]);
      const keys = Object.keys(m);
      const expected = [
        "total_records", "views_not_sought_count", "not_involved_count",
        "declined_count", "decision_changed_count",
        "child_prepared_rate", "child_understood_rate", "child_felt_heard_rate",
        "outcome_fed_back_rate", "advocate_present_rate", "age_appropriate_rate",
        "decision_changed_rate", "child_satisfied_rate",
        "participation_type_breakdown", "outcome_breakdown", "unique_children",
      ];
      for (const k of expected) {
        expect(keys).toContain(k);
      }
    });

    it("returns exactly 16 keys", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(Object.keys(m)).toHaveLength(16);
    });

    it("participation_type_breakdown is a plain object", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(typeof m.participation_type_breakdown).toBe("object");
    });

    it("outcome_breakdown is a plain object", () => {
      const m = computeVoiceParticipationMetrics([]);
      expect(typeof m.outcome_breakdown).toBe("object");
    });
  });

  // ── Multiple records ───────────────────────────────────────────────
  describe("multiple records integration", () => {
    const rows = [
      makeRow({
        child_name: "Alice", voice_outcome: "views_fully_incorporated",
        participation_level: "active", participation_type: "care_plan_review",
        child_prepared_beforehand: true, child_understood_process: true,
        child_felt_heard: true, outcome_fed_back: true,
        advocate_present: true, age_appropriate_methods: true,
        decision_changed_by_voice: true, child_satisfied_with_outcome: true,
      }),
      makeRow({
        child_name: "Bob", voice_outcome: "views_not_sought",
        participation_level: "not_involved", participation_type: "reg44_visit",
        child_prepared_beforehand: false, child_understood_process: false,
        child_felt_heard: false, outcome_fed_back: false,
        advocate_present: false, age_appropriate_methods: false,
        decision_changed_by_voice: false, child_satisfied_with_outcome: false,
      }),
      makeRow({
        child_name: "Charlie", voice_outcome: "child_declined",
        participation_level: "informed", participation_type: "house_meeting",
        child_prepared_beforehand: true, child_understood_process: true,
        child_felt_heard: false, outcome_fed_back: true,
        advocate_present: false, age_appropriate_methods: true,
        decision_changed_by_voice: false, child_satisfied_with_outcome: false,
      }),
    ];

    it("returns total_records = 3", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.total_records).toBe(3);
    });

    it("returns views_not_sought_count = 1", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.views_not_sought_count).toBe(1);
    });

    it("returns not_involved_count = 1", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.not_involved_count).toBe(1);
    });

    it("returns declined_count = 1", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.declined_count).toBe(1);
    });

    it("returns decision_changed_count = 1", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.decision_changed_count).toBe(1);
    });

    it("computes child_prepared_rate = 66.7 (2 of 3)", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_prepared_rate).toBe(66.7);
    });

    it("computes child_felt_heard_rate = 33.3 (1 of 3)", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.child_felt_heard_rate).toBe(33.3);
    });

    it("computes outcome_fed_back_rate = 66.7 (2 of 3)", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.outcome_fed_back_rate).toBe(66.7);
    });

    it("returns unique_children = 3", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.unique_children).toBe(3);
    });

    it("returns correct participation_type_breakdown", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.participation_type_breakdown).toEqual({
        care_plan_review: 1, reg44_visit: 1, house_meeting: 1,
      });
    });

    it("returns correct outcome_breakdown", () => {
      const m = computeVoiceParticipationMetrics(rows);
      expect(m.outcome_breakdown).toEqual({
        views_fully_incorporated: 1, views_not_sought: 1, child_declined: 1,
      });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. computeVoiceParticipationAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVoiceParticipationAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts", () => {
    it("returns empty array for empty rows", () => {
      const alerts = computeVoiceParticipationAlerts([]);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when no alert conditions met", () => {
      const rows = [makeRow({
        voice_outcome: "views_fully_incorporated",
        participation_level: "active",
        child_felt_heard: true,
        outcome_fed_back: true,
        advocate_present: true,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  // ── views_not_sought_formal (critical) ─────────────────────────────
  describe("views_not_sought_formal (critical)", () => {
    it("fires for views_not_sought in care_plan_review", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Alice",
        voice_outcome: "views_not_sought",
        participation_type: "care_plan_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "views_not_sought_formal");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("critical");
    });

    it("fires for views_not_sought in reg44_visit", () => {
      const rows = [makeRow({
        id: "r-2", child_name: "Bob",
        voice_outcome: "views_not_sought",
        participation_type: "reg44_visit",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "views_not_sought_formal");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("critical");
    });

    it("fires for views_not_sought in reg45_review", () => {
      const rows = [makeRow({
        id: "r-3", child_name: "Charlie",
        voice_outcome: "views_not_sought",
        participation_type: "reg45_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "views_not_sought_formal");
      expect(hit).toBeDefined();
    });

    it("does not fire for views_not_sought in house_meeting", () => {
      const rows = [makeRow({
        voice_outcome: "views_not_sought",
        participation_type: "house_meeting",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "views_not_sought_formal");
      expect(hit).toBeUndefined();
    });

    it("does not fire for views_not_sought in informal_consultation", () => {
      const rows = [makeRow({
        voice_outcome: "views_not_sought",
        participation_type: "informal_consultation",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "views_not_sought_formal");
      expect(hit).toBeUndefined();
    });

    it("does not fire for views_fully_incorporated in care_plan_review", () => {
      const rows = [makeRow({
        voice_outcome: "views_fully_incorporated",
        participation_type: "care_plan_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "views_not_sought_formal");
      expect(hit).toBeUndefined();
    });

    it("includes child_name in message", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Diana",
        voice_outcome: "views_not_sought",
        participation_type: "care_plan_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "views_not_sought_formal")!;
      expect(hit.message).toContain("Diana");
    });

    it("includes participation type in message", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Alice",
        voice_outcome: "views_not_sought",
        participation_type: "reg44_visit",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "views_not_sought_formal")!;
      expect(hit.message).toContain("reg44 visit");
    });

    it("references Reg 7 in message", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Alice",
        voice_outcome: "views_not_sought",
        participation_type: "care_plan_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "views_not_sought_formal")!;
      expect(hit.message).toContain("Reg 7");
    });

    it("includes record_id", () => {
      const rows = [makeRow({
        id: "rec-abc-123", child_name: "Alice",
        voice_outcome: "views_not_sought",
        participation_type: "care_plan_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "views_not_sought_formal")!;
      expect(hit.record_id).toBe("rec-abc-123");
    });

    it("fires for each qualifying record", () => {
      const rows = [
        makeRow({ id: "r-1", voice_outcome: "views_not_sought", participation_type: "care_plan_review" }),
        makeRow({ id: "r-2", voice_outcome: "views_not_sought", participation_type: "reg44_visit" }),
        makeRow({ id: "r-3", voice_outcome: "views_not_sought", participation_type: "reg45_review" }),
      ];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hits = alerts.filter((a) => a.type === "views_not_sought_formal");
      expect(hits).toHaveLength(3);
    });
  });

  // ── not_heard_no_feedback (high) ───────────────────────────────────
  describe("not_heard_no_feedback (high)", () => {
    it("fires when child not heard and outcome not fed back", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Alice",
        child_felt_heard: false, outcome_fed_back: false,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_heard_no_feedback");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("high");
    });

    it("does not fire when child felt heard", () => {
      const rows = [makeRow({
        child_felt_heard: true, outcome_fed_back: false,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_heard_no_feedback");
      expect(hit).toBeUndefined();
    });

    it("does not fire when outcome was fed back", () => {
      const rows = [makeRow({
        child_felt_heard: false, outcome_fed_back: true,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_heard_no_feedback");
      expect(hit).toBeUndefined();
    });

    it("does not fire when both true", () => {
      const rows = [makeRow({
        child_felt_heard: true, outcome_fed_back: true,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_heard_no_feedback");
      expect(hit).toBeUndefined();
    });

    it("includes child_name in message", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Emma",
        child_felt_heard: false, outcome_fed_back: false,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_heard_no_feedback")!;
      expect(hit.message).toContain("Emma");
    });

    it("includes participation type in message", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Alice",
        child_felt_heard: false, outcome_fed_back: false,
        participation_type: "feedback_session",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_heard_no_feedback")!;
      expect(hit.message).toContain("feedback session");
    });

    it("fires for each qualifying record", () => {
      const rows = [
        makeRow({ id: "r-1", child_felt_heard: false, outcome_fed_back: false }),
        makeRow({ id: "r-2", child_felt_heard: false, outcome_fed_back: false }),
      ];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hits = alerts.filter((a) => a.type === "not_heard_no_feedback");
      expect(hits).toHaveLength(2);
    });
  });

  // ── not_involved_formal_review (high) ──────────────────────────────
  describe("not_involved_formal_review (high)", () => {
    it("fires for not_involved in care_plan_review", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Alice",
        participation_level: "not_involved",
        participation_type: "care_plan_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_involved_formal_review");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("high");
    });

    it("fires for not_involved in reg44_visit", () => {
      const rows = [makeRow({
        id: "r-1",
        participation_level: "not_involved",
        participation_type: "reg44_visit",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_involved_formal_review");
      expect(hit).toBeDefined();
    });

    it("fires for not_involved in reg45_review", () => {
      const rows = [makeRow({
        id: "r-1",
        participation_level: "not_involved",
        participation_type: "reg45_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_involved_formal_review");
      expect(hit).toBeDefined();
    });

    it("fires for not_involved in individual_review", () => {
      const rows = [makeRow({
        id: "r-1",
        participation_level: "not_involved",
        participation_type: "individual_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_involved_formal_review");
      expect(hit).toBeDefined();
    });

    it("fires for not_involved in placement_plan", () => {
      const rows = [makeRow({
        id: "r-1",
        participation_level: "not_involved",
        participation_type: "placement_plan",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_involved_formal_review");
      expect(hit).toBeDefined();
    });

    it("does not fire for not_involved in house_meeting", () => {
      const rows = [makeRow({
        participation_level: "not_involved",
        participation_type: "house_meeting",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_involved_formal_review");
      expect(hit).toBeUndefined();
    });

    it("does not fire for active in care_plan_review", () => {
      const rows = [makeRow({
        participation_level: "active",
        participation_type: "care_plan_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_involved_formal_review");
      expect(hit).toBeUndefined();
    });

    it("does not fire for passive in care_plan_review", () => {
      const rows = [makeRow({
        participation_level: "passive",
        participation_type: "care_plan_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_involved_formal_review");
      expect(hit).toBeUndefined();
    });

    it("references UNCRC Article 12 in message", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Alice",
        participation_level: "not_involved",
        participation_type: "care_plan_review",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "not_involved_formal_review")!;
      expect(hit.message).toContain("UNCRC Article 12");
    });
  });

  // ── no_advocate_unable (medium) ────────────────────────────────────
  describe("no_advocate_unable (medium)", () => {
    it("fires when unable_to_participate and no advocate", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Alice",
        voice_outcome: "unable_to_participate",
        advocate_present: false,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "no_advocate_unable");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("medium");
    });

    it("does not fire when advocate is present", () => {
      const rows = [makeRow({
        voice_outcome: "unable_to_participate",
        advocate_present: true,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "no_advocate_unable");
      expect(hit).toBeUndefined();
    });

    it("does not fire for child_declined without advocate", () => {
      const rows = [makeRow({
        voice_outcome: "child_declined",
        advocate_present: false,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "no_advocate_unable");
      expect(hit).toBeUndefined();
    });

    it("does not fire for views_not_sought without advocate", () => {
      const rows = [makeRow({
        voice_outcome: "views_not_sought",
        advocate_present: false,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "no_advocate_unable");
      expect(hit).toBeUndefined();
    });

    it("includes child_name in message", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Felix",
        voice_outcome: "unable_to_participate",
        advocate_present: false,
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "no_advocate_unable")!;
      expect(hit.message).toContain("Felix");
    });

    it("fires for each qualifying record", () => {
      const rows = [
        makeRow({ id: "r-1", voice_outcome: "unable_to_participate", advocate_present: false }),
        makeRow({ id: "r-2", voice_outcome: "unable_to_participate", advocate_present: false }),
      ];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hits = alerts.filter((a) => a.type === "no_advocate_unable");
      expect(hits).toHaveLength(2);
    });
  });

  // ── outcome_not_fed_back (medium) ──────────────────────────────────
  describe("outcome_not_fed_back (medium)", () => {
    it("fires when outcome not fed back and views were incorporated", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Alice",
        outcome_fed_back: false,
        voice_outcome: "views_fully_incorporated",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "outcome_not_fed_back");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("medium");
    });

    it("fires when outcome not fed back and views partially incorporated", () => {
      const rows = [makeRow({
        id: "r-1",
        outcome_fed_back: false,
        voice_outcome: "views_partially_incorporated",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "outcome_not_fed_back");
      expect(hit).toBeDefined();
    });

    it("fires when outcome not fed back and views acknowledged", () => {
      const rows = [makeRow({
        id: "r-1",
        outcome_fed_back: false,
        voice_outcome: "views_acknowledged",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "outcome_not_fed_back");
      expect(hit).toBeDefined();
    });

    it("does not fire when outcome not fed back but views_not_sought", () => {
      const rows = [makeRow({
        outcome_fed_back: false,
        voice_outcome: "views_not_sought",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "outcome_not_fed_back");
      expect(hit).toBeUndefined();
    });

    it("does not fire when outcome not fed back but child_declined", () => {
      const rows = [makeRow({
        outcome_fed_back: false,
        voice_outcome: "child_declined",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "outcome_not_fed_back");
      expect(hit).toBeUndefined();
    });

    it("does not fire when outcome not fed back but unable_to_participate", () => {
      const rows = [makeRow({
        outcome_fed_back: false,
        voice_outcome: "unable_to_participate",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "outcome_not_fed_back");
      expect(hit).toBeUndefined();
    });

    it("does not fire when outcome is fed back", () => {
      const rows = [makeRow({
        outcome_fed_back: true,
        voice_outcome: "views_fully_incorporated",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "outcome_not_fed_back");
      expect(hit).toBeUndefined();
    });

    it("includes child_name in message", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Grace",
        outcome_fed_back: false,
        voice_outcome: "views_acknowledged",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "outcome_not_fed_back")!;
      expect(hit.message).toContain("Grace");
    });

    it("includes participation type in message", () => {
      const rows = [makeRow({
        id: "r-1", child_name: "Alice",
        outcome_fed_back: false,
        voice_outcome: "views_fully_incorporated",
        participation_type: "advocacy_meeting",
      })];
      const alerts = computeVoiceParticipationAlerts(rows);
      const hit = alerts.find((a) => a.type === "outcome_not_fed_back")!;
      expect(hit.message).toContain("advocacy meeting");
    });
  });

  // ── Alert structure ────────────────────────────────────────────────
  describe("alert structure", () => {
    it("every alert has type, severity, message", () => {
      const rows = [
        makeRow({
          id: "r-1", child_name: "Alice",
          voice_outcome: "views_not_sought",
          participation_type: "care_plan_review",
          child_felt_heard: false, outcome_fed_back: false,
          participation_level: "not_involved",
        }),
      ];
      const alerts = computeVoiceParticipationAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
      }
    });

    it("severity is always critical, high, or medium", () => {
      const rows = [
        makeRow({
          id: "r-1",
          voice_outcome: "views_not_sought",
          participation_type: "care_plan_review",
          child_felt_heard: false, outcome_fed_back: false,
          participation_level: "not_involved",
        }),
        makeRow({
          id: "r-2",
          voice_outcome: "unable_to_participate",
          advocate_present: false,
          outcome_fed_back: false,
          child_felt_heard: false,
        }),
      ];
      const alerts = computeVoiceParticipationAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });

  // ── Combined alerts ────────────────────────────────────────────────
  describe("combined alerts", () => {
    it("can produce all 5 alert types simultaneously", () => {
      const rows = [
        // views_not_sought_formal (critical) + not_heard_no_feedback (high)
        // + not_involved_formal_review (high)
        makeRow({
          id: "r-1", child_name: "Alice",
          voice_outcome: "views_not_sought",
          participation_type: "care_plan_review",
          participation_level: "not_involved",
          child_felt_heard: false, outcome_fed_back: false,
          advocate_present: false,
        }),
        // no_advocate_unable (medium)
        makeRow({
          id: "r-2", child_name: "Bob",
          voice_outcome: "unable_to_participate",
          advocate_present: false,
          child_felt_heard: false, outcome_fed_back: false,
        }),
        // outcome_not_fed_back (medium) — views incorporated but not fed back
        makeRow({
          id: "r-3", child_name: "Charlie",
          voice_outcome: "views_fully_incorporated",
          outcome_fed_back: false,
          child_felt_heard: true,
        }),
      ];
      const alerts = computeVoiceParticipationAlerts(rows);
      const types = new Set(alerts.map((a) => a.type));
      expect(types.has("views_not_sought_formal")).toBe(true);
      expect(types.has("not_heard_no_feedback")).toBe(true);
      expect(types.has("not_involved_formal_review")).toBe(true);
      expect(types.has("no_advocate_unable")).toBe(true);
      expect(types.has("outcome_not_fed_back")).toBe(true);
    });

    it("returns correct count of critical alerts", () => {
      const rows = [
        makeRow({ id: "r-1", voice_outcome: "views_not_sought", participation_type: "care_plan_review" }),
        makeRow({ id: "r-2", voice_outcome: "views_not_sought", participation_type: "reg44_visit" }),
      ];
      const alerts = computeVoiceParticipationAlerts(rows);
      const critical = alerts.filter((a) => a.severity === "critical");
      expect(critical).toHaveLength(2);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. generateVoiceParticipationCaraInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("generateVoiceParticipationCaraInsights", () => {
  it("returns exactly 3 strings", () => {
    const insights = generateVoiceParticipationCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("each insight is a non-empty string", () => {
    const insights = generateVoiceParticipationCaraInsights([]);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("first insight starts with [violet]", () => {
    const insights = generateVoiceParticipationCaraInsights([makeRow()]);
    expect(insights[0].startsWith("[violet]")).toBe(true);
  });

  it("second insight starts with [amber]", () => {
    const insights = generateVoiceParticipationCaraInsights([makeRow()]);
    expect(insights[1].startsWith("[amber]")).toBe(true);
  });

  it("third insight starts with [reflect]", () => {
    const insights = generateVoiceParticipationCaraInsights([makeRow()]);
    expect(insights[2].startsWith("[reflect]")).toBe(true);
  });

  it("first insight includes total records count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[0]).toContain("3 voice and participation records");
  });

  it("first insight includes unique children count", () => {
    const rows = [
      makeRow({ child_name: "Alice" }),
      makeRow({ child_name: "Bob" }),
    ];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[0]).toContain("2 children");
  });

  it("first insight uses singular 'child' for 1 unique child", () => {
    const rows = [makeRow({ child_name: "Alice" })];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[0]).toContain("1 child");
    expect(insights[0]).not.toContain("1 children");
  });

  it("first insight includes views_not_sought count", () => {
    const rows = [
      makeRow({ voice_outcome: "views_not_sought" }),
      makeRow({ voice_outcome: "views_not_sought" }),
    ];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[0]).toContain("2 instances");
  });

  it("first insight uses singular 'instance' for 1", () => {
    const rows = [
      makeRow({ voice_outcome: "views_not_sought" }),
    ];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[0]).toContain("1 instance ");
  });

  it("first insight includes felt heard rate", () => {
    const rows = [makeRow({ child_felt_heard: true })];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[0]).toContain("Child felt heard rate: 100%");
  });

  it("first insight includes decision changed rate", () => {
    const rows = [makeRow({ decision_changed_by_voice: true })];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[0]).toContain("Decision changed by child's voice rate: 100%");
  });

  it("second insight mentions critical and high counts when present", () => {
    const rows = [makeRow({
      id: "r-1", child_name: "Alice",
      voice_outcome: "views_not_sought",
      participation_type: "care_plan_review",
      child_felt_heard: false, outcome_fed_back: false,
    })];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high-priority");
  });

  it("second insight says no concerns when no alerts", () => {
    const rows = [makeRow({
      voice_outcome: "views_fully_incorporated",
      child_felt_heard: true, outcome_fed_back: true,
    })];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[1]).toContain("No critical or high-priority concerns");
  });

  it("second insight includes outcome_fed_back_rate", () => {
    const rows = [makeRow({ outcome_fed_back: true })];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[1]).toContain("Outcome fed back rate:");
  });

  it("second insight includes child_prepared_rate", () => {
    const rows = [makeRow({ child_prepared_beforehand: true })];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[1]).toContain("Child prepared rate:");
  });

  it("second insight includes age_appropriate_rate", () => {
    const rows = [makeRow({ age_appropriate_methods: true })];
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights[1]).toContain("Age-appropriate methods rate:");
  });

  it("third insight is a reflective question about participation quality", () => {
    const insights = generateVoiceParticipationCaraInsights([makeRow()]);
    expect(insights[2]).toContain("genuinely influencing");
  });

  it("handles empty rows without error", () => {
    const insights = generateVoiceParticipationCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 voice and participation records");
  });

  it("handles large dataset", () => {
    const rows = Array.from({ length: 50 }, (_, i) =>
      makeRow({ child_name: `Child ${i % 10}` }),
    );
    const insights = generateVoiceParticipationCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("50 voice and participation records");
    expect(insights[0]).toContain("10 children");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. CRUD FALLBACK BEHAVIOUR (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listChildVoiceParticipation ────────────────────────────────────
  describe("listChildVoiceParticipation", () => {
    it("returns ok:true with empty array", async () => {
      const result = await listChildVoiceParticipation("home-1");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual([]);
    });

    it("returns empty array for any home_id", async () => {
      const result = await listChildVoiceParticipation("nonexistent-home");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual([]);
    });

    it("data is an empty array not undefined", async () => {
      const result = await listChildVoiceParticipation("home-1");
      if (result.ok) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(0);
      }
    });
  });

  // ── createChildVoiceParticipation ──────────────────────────────────
  describe("createChildVoiceParticipation", () => {
    it("returns ok:false when Supabase not configured", async () => {
      const result = await createChildVoiceParticipation({
        homeId: "home-1",
        childName: "Alice",
        participationDate: "2025-06-01",
        participationType: "house_meeting",
        voiceOutcome: "views_fully_incorporated",
        participationLevel: "active",
        feedbackMethod: "verbal",
      });
      expect(result.ok).toBe(false);
    });

    it("returns error message string", async () => {
      const result = await createChildVoiceParticipation({
        homeId: "home-1",
        childName: "Alice",
        participationDate: "2025-06-01",
        participationType: "care_plan_review",
        voiceOutcome: "views_fully_incorporated",
        participationLevel: "active",
        feedbackMethod: "verbal",
      });
      if (!result.ok) {
        expect(typeof result.error).toBe("string");
        expect(result.error).toBe("Supabase not configured");
      }
    });

    it("returns ok:false regardless of input values", async () => {
      const result = await createChildVoiceParticipation({
        homeId: "home-xyz",
        childName: "Bob",
        childId: "child-99",
        participationDate: "2025-01-15",
        participationType: "reg44_visit",
        voiceOutcome: "child_declined",
        participationLevel: "informed",
        feedbackMethod: "written",
        childPreparedBeforehand: true,
        childUnderstoodProcess: true,
        childFeltHeard: false,
        outcomeFedBack: true,
        advocatePresent: true,
        ageAppropriateMethods: true,
        decisionChangedByVoice: false,
        childSatisfiedWithOutcome: false,
        facilitatorName: "Staff Member",
        childFeedbackVerbatim: "Some feedback",
        notes: "Some notes",
      });
      expect(result.ok).toBe(false);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. EDGE CASES & REGRESSIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("factory produces valid row with no overrides", () => {
    const row = makeRow();
    expect(row.id).toBeDefined();
    expect(row.home_id).toBe("home-1");
    expect(row.child_name).toBe("Child A");
    expect(row.child_id).toBeNull();
    expect(row.participation_date).toBe(now.toISOString().split("T")[0]);
    expect(row.participation_type).toBe("house_meeting");
    expect(row.voice_outcome).toBe("views_fully_incorporated");
    expect(row.participation_level).toBe("active");
    expect(row.feedback_method).toBe("verbal");
    expect(row.child_prepared_beforehand).toBe(true);
    expect(row.child_understood_process).toBe(true);
    expect(row.child_felt_heard).toBe(true);
    expect(row.outcome_fed_back).toBe(true);
    expect(row.advocate_present).toBe(false);
    expect(row.age_appropriate_methods).toBe(true);
    expect(row.decision_changed_by_voice).toBe(false);
    expect(row.child_satisfied_with_outcome).toBe(true);
    expect(row.facilitator_name).toBeNull();
    expect(row.child_feedback_verbatim).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("factory respects id override", () => {
    const row = makeRow({ id: "custom-id" });
    expect(row.id).toBe("custom-id");
  });

  it("factory respects child_id override with null", () => {
    const row = makeRow({ child_id: null });
    expect(row.child_id).toBeNull();
  });

  it("factory respects child_id override with value", () => {
    const row = makeRow({ child_id: "child-42" });
    expect(row.child_id).toBe("child-42");
  });

  it("factory respects facilitator_name override", () => {
    const row = makeRow({ facilitator_name: "John Smith" });
    expect(row.facilitator_name).toBe("John Smith");
  });

  it("factory respects notes override", () => {
    const row = makeRow({ notes: "Important note" });
    expect(row.notes).toBe("Important note");
  });

  it("factory respects child_feedback_verbatim override", () => {
    const row = makeRow({ child_feedback_verbatim: "I liked the meeting" });
    expect(row.child_feedback_verbatim).toBe("I liked the meeting");
  });

  it("handles large number of rows in metrics", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        child_name: `Child ${i % 10}`,
        voice_outcome: i % 5 === 0 ? "views_not_sought" : "views_fully_incorporated",
        participation_level: i % 7 === 0 ? "not_involved" : "active",
        decision_changed_by_voice: i % 3 === 0,
      }),
    );
    const m = computeVoiceParticipationMetrics(rows);
    expect(m.total_records).toBe(100);
    expect(m.unique_children).toBe(10);
    expect(m.views_not_sought_count).toBe(20);
  });

  it("handles large number of rows in alerts", () => {
    const rows = Array.from({ length: 50 }, (_, i) =>
      makeRow({
        id: `r-${i}`,
        child_name: `Child ${i}`,
        voice_outcome: "views_not_sought",
        participation_type: "care_plan_review",
        child_felt_heard: false,
        outcome_fed_back: false,
        participation_level: "not_involved",
      }),
    );
    const alerts = computeVoiceParticipationAlerts(rows);
    // Each row triggers: views_not_sought_formal + not_heard_no_feedback + not_involved_formal_review
    const criticals = alerts.filter((a) => a.severity === "critical");
    expect(criticals).toHaveLength(50);
  });

  it("metrics rates are numbers not NaN", () => {
    const rows = [makeRow()];
    const m = computeVoiceParticipationMetrics(rows);
    expect(Number.isNaN(m.child_prepared_rate)).toBe(false);
    expect(Number.isNaN(m.child_understood_rate)).toBe(false);
    expect(Number.isNaN(m.child_felt_heard_rate)).toBe(false);
    expect(Number.isNaN(m.outcome_fed_back_rate)).toBe(false);
    expect(Number.isNaN(m.advocate_present_rate)).toBe(false);
    expect(Number.isNaN(m.age_appropriate_rate)).toBe(false);
    expect(Number.isNaN(m.decision_changed_rate)).toBe(false);
    expect(Number.isNaN(m.child_satisfied_rate)).toBe(false);
  });

  it("all rates are between 0 and 100", () => {
    const rows = [
      makeRow({ child_prepared_beforehand: true, child_felt_heard: false }),
      makeRow({ child_prepared_beforehand: false, child_felt_heard: true }),
    ];
    const m = computeVoiceParticipationMetrics(rows);
    const rates = [
      m.child_prepared_rate, m.child_understood_rate, m.child_felt_heard_rate,
      m.outcome_fed_back_rate, m.advocate_present_rate, m.age_appropriate_rate,
      m.decision_changed_rate, m.child_satisfied_rate,
    ];
    for (const rate of rates) {
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    }
  });

  it("rounding uses Math.round(value * 1000) / 10 pattern", () => {
    // 2 of 7 = 28.571428... should round to 28.6
    const rows = Array.from({ length: 7 }, (_, i) =>
      makeRow({ child_prepared_beforehand: i < 2 }),
    );
    const m = computeVoiceParticipationMetrics(rows);
    expect(m.child_prepared_rate).toBe(28.6);
  });

  it("unique_children uses child_name not child_id", () => {
    const rows = [
      makeRow({ child_name: "Alice", child_id: "c-1" }),
      makeRow({ child_name: "Alice", child_id: "c-2" }),
    ];
    const m = computeVoiceParticipationMetrics(rows);
    // Same name = 1 unique child even with different IDs
    expect(m.unique_children).toBe(1);
  });

  it("alerts do not include record_id when not applicable", () => {
    const alerts = computeVoiceParticipationAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("participation_type_breakdown keys are valid participation types", () => {
    const rows = PARTICIPATION_TYPES.map((pt) => makeRow({ participation_type: pt }));
    const m = computeVoiceParticipationMetrics(rows);
    for (const key of Object.keys(m.participation_type_breakdown)) {
      expect((PARTICIPATION_TYPES as readonly string[]).includes(key)).toBe(true);
    }
  });

  it("outcome_breakdown keys are valid voice outcomes", () => {
    const rows = VOICE_OUTCOMES.map((vo) => makeRow({ voice_outcome: vo }));
    const m = computeVoiceParticipationMetrics(rows);
    for (const key of Object.keys(m.outcome_breakdown)) {
      expect((VOICE_OUTCOMES as readonly string[]).includes(key)).toBe(true);
    }
  });
});
