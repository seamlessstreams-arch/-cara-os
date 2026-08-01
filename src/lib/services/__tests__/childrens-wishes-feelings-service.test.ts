// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S WISHES & FEELINGS SERVICE TESTS
// Pure-function unit tests for wishes metrics computation,
// alert identification, constant validation.
// CHR 2015 Reg 7 (children's views, wishes and feelings),
// Reg 14 (care planning — incorporating child's wishes),
// Children Act 1989 s1(3)(a) (welfare checklist — child's wishes).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  WISHES_CATEGORIES,
  FEELING_RATINGS,
  CAPTURE_METHODS,
  RESPONSE_OUTCOMES,
} from "../childrens-wishes-feelings-service";

import type {
  WishesFeelingsRecord,
  WishesCategory,
  FeelingRating,
  CaptureMethod,
  ResponseOutcome,
} from "../childrens-wishes-feelings-service";

const { computeWishesMetrics, identifyWishesAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  return daysAgoISO(n).split("T")[0];
}

let _seq = 0;

/** Build a minimal WishesFeelingsRecord with sensible defaults. */
function makeRecord(
  overrides: Partial<WishesFeelingsRecord> = {},
): WishesFeelingsRecord {
  _seq += 1;
  return {
    id: `rec-${_seq}`,
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    recorded_date: daysAgo(5),
    wishes_category: "daily_life",
    feeling_rating: "okay",
    capture_method: "direct_conversation",
    what_child_said: "I said something",
    what_child_wants: null,
    response_outcome: "wish_granted",
    response_details: null,
    responded_by: null,
    response_date: null,
    child_informed_of_outcome: true,
    child_satisfied_with_response: null,
    influenced_care_plan: false,
    recorded_by: "staff-1",
    notes: null,
    created_at: daysAgoISO(5),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("WISHES_CATEGORIES", () => {
  it("contains exactly 12 entries", () => {
    expect(WISHES_CATEGORIES).toHaveLength(12);
  });

  it("every entry has a non-empty category string", () => {
    for (const c of WISHES_CATEGORIES) {
      expect(typeof c.category).toBe("string");
      expect(c.category.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const c of WISHES_CATEGORIES) {
      expect(typeof c.label).toBe("string");
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate categories", () => {
    const cats = WISHES_CATEGORIES.map((c) => c.category);
    expect(new Set(cats).size).toBe(cats.length);
  });

  it("includes all expected categories", () => {
    const cats = WISHES_CATEGORIES.map((c) => c.category);
    const expected: WishesCategory[] = [
      "placement", "contact", "education", "health",
      "daily_life", "identity", "friendships", "activities",
      "future_plans", "safety", "complaints", "other",
    ];
    for (const e of expected) {
      expect(cats).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const c of WISHES_CATEGORIES) {
      expect(c.label[0]).toBe(c.label[0].toUpperCase());
    }
  });
});

describe("FEELING_RATINGS", () => {
  it("contains exactly 7 entries", () => {
    expect(FEELING_RATINGS).toHaveLength(7);
  });

  it("every entry has a non-empty rating string", () => {
    for (const f of FEELING_RATINGS) {
      expect(typeof f.rating).toBe("string");
      expect(f.rating.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const f of FEELING_RATINGS) {
      expect(typeof f.label).toBe("string");
      expect(f.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate ratings", () => {
    const rats = FEELING_RATINGS.map((f) => f.rating);
    expect(new Set(rats).size).toBe(rats.length);
  });

  it("includes all expected ratings", () => {
    const rats = FEELING_RATINGS.map((f) => f.rating);
    const expected: FeelingRating[] = [
      "very_happy", "happy", "okay", "unhappy",
      "very_unhappy", "mixed", "not_expressed",
    ];
    for (const e of expected) {
      expect(rats).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const f of FEELING_RATINGS) {
      expect(f.label[0]).toBe(f.label[0].toUpperCase());
    }
  });

  it("contains positive feelings (very_happy, happy)", () => {
    const rats = FEELING_RATINGS.map((f) => f.rating);
    expect(rats).toContain("very_happy");
    expect(rats).toContain("happy");
  });

  it("contains negative feelings (unhappy, very_unhappy)", () => {
    const rats = FEELING_RATINGS.map((f) => f.rating);
    expect(rats).toContain("unhappy");
    expect(rats).toContain("very_unhappy");
  });
});

describe("CAPTURE_METHODS", () => {
  it("contains exactly 11 entries", () => {
    expect(CAPTURE_METHODS).toHaveLength(11);
  });

  it("every entry has a non-empty method string", () => {
    for (const m of CAPTURE_METHODS) {
      expect(typeof m.method).toBe("string");
      expect(m.method.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const m of CAPTURE_METHODS) {
      expect(typeof m.label).toBe("string");
      expect(m.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate methods", () => {
    const meths = CAPTURE_METHODS.map((m) => m.method);
    expect(new Set(meths).size).toBe(meths.length);
  });

  it("includes all expected methods", () => {
    const meths = CAPTURE_METHODS.map((m) => m.method);
    const expected: CaptureMethod[] = [
      "direct_conversation", "key_worker_session", "house_meeting",
      "written_form", "drawing_art", "advocate", "independent_visitor",
      "review_meeting", "informal_chat", "digital_tool", "other",
    ];
    for (const e of expected) {
      expect(meths).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const m of CAPTURE_METHODS) {
      expect(m.label[0]).toBe(m.label[0].toUpperCase());
    }
  });
});

describe("RESPONSE_OUTCOMES", () => {
  it("contains exactly 7 entries", () => {
    expect(RESPONSE_OUTCOMES).toHaveLength(7);
  });

  it("every entry has a non-empty outcome string", () => {
    for (const o of RESPONSE_OUTCOMES) {
      expect(typeof o.outcome).toBe("string");
      expect(o.outcome.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const o of RESPONSE_OUTCOMES) {
      expect(typeof o.label).toBe("string");
      expect(o.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate outcomes", () => {
    const outs = RESPONSE_OUTCOMES.map((o) => o.outcome);
    expect(new Set(outs).size).toBe(outs.length);
  });

  it("includes all expected outcomes", () => {
    const outs = RESPONSE_OUTCOMES.map((o) => o.outcome);
    const expected: ResponseOutcome[] = [
      "wish_granted", "wish_partially_met", "wish_not_possible",
      "under_consideration", "referred_to_sw", "awaiting_response",
      "no_action_needed",
    ];
    for (const e of expected) {
      expect(outs).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const o of RESPONSE_OUTCOMES) {
      expect(o.label[0]).toBe(o.label[0].toUpperCase());
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeWishesMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeWishesMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────────

  describe("empty records", () => {
    it("returns total_records = 0", () => {
      const m = computeWishesMetrics([], 5);
      expect(m.total_records).toBe(0);
    });

    it("returns children_with_records = 0", () => {
      const m = computeWishesMetrics([], 5);
      expect(m.children_with_records).toBe(0);
    });

    it("returns participation_rate = 0 when totalChildren > 0", () => {
      const m = computeWishesMetrics([], 5);
      expect(m.participation_rate).toBe(0); // records exist → real 0.
    });

    it("returns participation_rate = 0 when totalChildren = 0", () => {
      const m = computeWishesMetrics([], 0);
      expect(m.participation_rate).toBeNull(); // fab-0.
    });

    it("returns all outcome counts as 0", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.wish_granted_count).toBe(0);
      expect(m.wish_partially_met_count).toBe(0);
      expect(m.wish_not_possible_count).toBe(0);
      expect(m.awaiting_response_count).toBe(0);
    });

    it("returns child_informed_rate = 0", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.child_informed_rate).toBeNull(); // fab-0.
    });

    it("returns child_satisfied_rate = 0", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.child_satisfied_rate).toBeNull(); // fab-0.
    });

    it("returns influenced_care_plan_rate = 0", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.influenced_care_plan_rate).toBeNull(); // fab-0.
    });

    it("returns positive_feeling_rate = 0", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.positive_feeling_rate).toBeNull(); // fab-0.
    });

    it("returns negative_feeling_rate = 0", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.negative_feeling_rate).toBeNull(); // fab-0.
    });

    it("returns average_per_child = 0", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.average_per_child).toBeNull(); // fab-0.
    });

    it("returns empty by_category", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.by_category).toEqual({});
    });

    it("returns empty by_feeling", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.by_feeling).toEqual({});
    });

    it("returns empty by_capture_method", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.by_capture_method).toEqual({});
    });

    it("returns empty by_outcome", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.by_outcome).toEqual({});
    });

    it("returns empty by_child", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.by_child).toEqual({});
    });
  });

  // ── Single record ────────────────────────────────────────────────────────

  describe("single record", () => {
    const rec = makeRecord({
      child_id: "child-1",
      child_name: "Alice",
      wishes_category: "placement",
      feeling_rating: "happy",
      capture_method: "key_worker_session",
      response_outcome: "wish_granted",
      child_informed_of_outcome: true,
      child_satisfied_with_response: true,
      influenced_care_plan: true,
    });

    it("returns total_records = 1", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.total_records).toBe(1);
    });

    it("returns children_with_records = 1", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.children_with_records).toBe(1);
    });

    it("calculates participation_rate correctly (1 of 4 = 25%)", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.participation_rate).toBe(25);
    });

    it("counts wish_granted_count = 1", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.wish_granted_count).toBe(1);
    });

    it("counts wish_partially_met_count = 0", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.wish_partially_met_count).toBe(0);
    });

    it("counts wish_not_possible_count = 0", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.wish_not_possible_count).toBe(0);
    });

    it("counts awaiting_response_count = 0", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.awaiting_response_count).toBe(0);
    });

    it("calculates child_informed_rate = 100 when informed", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.child_informed_rate).toBe(100);
    });

    it("calculates child_satisfied_rate = 100 when satisfied is true", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.child_satisfied_rate).toBe(100);
    });

    it("calculates influenced_care_plan_rate = 100 when influenced", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.influenced_care_plan_rate).toBe(100);
    });

    it("calculates positive_feeling_rate = 100 when happy", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.positive_feeling_rate).toBe(100);
    });

    it("calculates negative_feeling_rate = 0 when happy", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.negative_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("calculates average_per_child = 1", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.average_per_child).toBe(1);
    });

    it("by_category has single entry for placement", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.by_category).toEqual({ placement: 1 });
    });

    it("by_feeling has single entry for happy", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.by_feeling).toEqual({ happy: 1 });
    });

    it("by_capture_method has single entry for key_worker_session", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.by_capture_method).toEqual({ key_worker_session: 1 });
    });

    it("by_outcome has single entry for wish_granted", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.by_outcome).toEqual({ wish_granted: 1 });
    });

    it("by_child uses child_name as key", () => {
      const m = computeWishesMetrics([rec], 4);
      expect(m.by_child).toEqual({ Alice: 1 });
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────────

  describe("multiple records", () => {
    const records = [
      makeRecord({
        child_id: "child-1", child_name: "Alice",
        wishes_category: "placement", feeling_rating: "very_happy",
        capture_method: "direct_conversation", response_outcome: "wish_granted",
        child_informed_of_outcome: true, child_satisfied_with_response: true,
        influenced_care_plan: true,
      }),
      makeRecord({
        child_id: "child-1", child_name: "Alice",
        wishes_category: "contact", feeling_rating: "happy",
        capture_method: "key_worker_session", response_outcome: "wish_partially_met",
        child_informed_of_outcome: true, child_satisfied_with_response: false,
        influenced_care_plan: true,
      }),
      makeRecord({
        child_id: "child-2", child_name: "Bob",
        wishes_category: "education", feeling_rating: "unhappy",
        capture_method: "review_meeting", response_outcome: "wish_not_possible",
        child_informed_of_outcome: false, child_satisfied_with_response: null,
        influenced_care_plan: false,
      }),
      makeRecord({
        child_id: "child-2", child_name: "Bob",
        wishes_category: "daily_life", feeling_rating: "very_unhappy",
        capture_method: "informal_chat", response_outcome: "awaiting_response",
        child_informed_of_outcome: false, child_satisfied_with_response: null,
        influenced_care_plan: false,
      }),
      makeRecord({
        child_id: "child-3", child_name: "Charlie",
        wishes_category: "activities", feeling_rating: "okay",
        capture_method: "house_meeting", response_outcome: "no_action_needed",
        child_informed_of_outcome: true, child_satisfied_with_response: true,
        influenced_care_plan: false,
      }),
    ];

    it("returns total_records = 5", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.total_records).toBe(5);
    });

    it("returns children_with_records = 3", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.children_with_records).toBe(3);
    });

    it("calculates participation_rate correctly (3 of 6 = 50%)", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.participation_rate).toBe(50);
    });

    it("counts wish_granted_count = 1", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.wish_granted_count).toBe(1);
    });

    it("counts wish_partially_met_count = 1", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.wish_partially_met_count).toBe(1);
    });

    it("counts wish_not_possible_count = 1", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.wish_not_possible_count).toBe(1);
    });

    it("counts awaiting_response_count = 1", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.awaiting_response_count).toBe(1);
    });

    it("calculates child_informed_rate (3 of 5 = 60%)", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.child_informed_rate).toBe(60);
    });

    it("calculates child_satisfied_rate based only on non-null records (2 satisfied of 3 non-null = 66.7%)", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.child_satisfied_rate).toBe(66.7);
    });

    it("calculates influenced_care_plan_rate (2 of 5 = 40%)", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.influenced_care_plan_rate).toBe(40);
    });

    it("calculates positive_feeling_rate (very_happy + happy = 2 of 5 = 40%)", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.positive_feeling_rate).toBe(40);
    });

    it("calculates negative_feeling_rate (unhappy + very_unhappy = 2 of 5 = 40%)", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.negative_feeling_rate).toBe(40);
    });

    it("calculates average_per_child (5 records / 3 children = 1.7)", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.average_per_child).toBe(1.7);
    });

    it("groups by_category correctly", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.by_category).toEqual({
        placement: 1, contact: 1, education: 1, daily_life: 1, activities: 1,
      });
    });

    it("groups by_feeling correctly", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.by_feeling).toEqual({
        very_happy: 1, happy: 1, unhappy: 1, very_unhappy: 1, okay: 1,
      });
    });

    it("groups by_capture_method correctly", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.by_capture_method).toEqual({
        direct_conversation: 1, key_worker_session: 1, review_meeting: 1,
        informal_chat: 1, house_meeting: 1,
      });
    });

    it("groups by_outcome correctly", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.by_outcome).toEqual({
        wish_granted: 1, wish_partially_met: 1, wish_not_possible: 1,
        awaiting_response: 1, no_action_needed: 1,
      });
    });

    it("groups by_child using child_name correctly", () => {
      const m = computeWishesMetrics(records, 6);
      expect(m.by_child).toEqual({ Alice: 2, Bob: 2, Charlie: 1 });
    });
  });

  // ── Participation rate edge cases ────────────────────────────────────────

  describe("participation_rate edge cases", () => {
    it("returns 100% when all children have records", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.participation_rate).toBe(100);
    });

    it("handles totalChildren = 0 gracefully", () => {
      const recs = [makeRecord()];
      const m = computeWishesMetrics(recs, 0);
      expect(m.participation_rate).toBeNull(); // fab-0.
    });

    it("counts each child once even with multiple records", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.children_with_records).toBe(1);
      expect(m.participation_rate).toBe(33.3);
    });

    it("rounds participation_rate to 1 decimal place", () => {
      // 1 of 3 = 33.333...% -> 33.3
      const recs = [makeRecord({ child_id: "c1" })];
      const m = computeWishesMetrics(recs, 3);
      expect(m.participation_rate).toBe(33.3);
    });
  });

  // ── Outcome counts ──────────────────────────────────────────────────────

  describe("outcome counts", () => {
    it("counts multiple wish_granted records", () => {
      const recs = [
        makeRecord({ response_outcome: "wish_granted" }),
        makeRecord({ response_outcome: "wish_granted" }),
        makeRecord({ response_outcome: "wish_partially_met" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.wish_granted_count).toBe(2);
    });

    it("counts multiple wish_partially_met records", () => {
      const recs = [
        makeRecord({ response_outcome: "wish_partially_met" }),
        makeRecord({ response_outcome: "wish_partially_met" }),
        makeRecord({ response_outcome: "wish_partially_met" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.wish_partially_met_count).toBe(3);
    });

    it("counts multiple wish_not_possible records", () => {
      const recs = [
        makeRecord({ response_outcome: "wish_not_possible" }),
        makeRecord({ response_outcome: "wish_not_possible" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.wish_not_possible_count).toBe(2);
    });

    it("counts multiple awaiting_response records", () => {
      const recs = [
        makeRecord({ response_outcome: "awaiting_response" }),
        makeRecord({ response_outcome: "awaiting_response" }),
        makeRecord({ response_outcome: "awaiting_response" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.awaiting_response_count).toBe(3);
    });

    it("ignores other outcomes for the four counted fields", () => {
      const recs = [
        makeRecord({ response_outcome: "under_consideration" }),
        makeRecord({ response_outcome: "referred_to_sw" }),
        makeRecord({ response_outcome: "no_action_needed" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.wish_granted_count).toBe(0);
      expect(m.wish_partially_met_count).toBe(0);
      expect(m.wish_not_possible_count).toBe(0);
      expect(m.awaiting_response_count).toBe(0);
    });
  });

  // ── child_informed_rate ──────────────────────────────────────────────────

  describe("child_informed_rate", () => {
    it("returns 0 when no children informed", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: false }),
        makeRecord({ child_informed_of_outcome: false }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.child_informed_rate).toBe(0); // records exist → real 0.
    });

    it("returns 100 when all children informed", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: true }),
        makeRecord({ child_informed_of_outcome: true }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.child_informed_rate).toBe(100);
    });

    it("rounds to 1 decimal place", () => {
      // 1 of 3 = 33.333...% -> 33.3
      const recs = [
        makeRecord({ child_informed_of_outcome: true }),
        makeRecord({ child_informed_of_outcome: false }),
        makeRecord({ child_informed_of_outcome: false }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.child_informed_rate).toBe(33.3);
    });
  });

  // ── child_satisfied_rate ─────────────────────────────────────────────────

  describe("child_satisfied_rate", () => {
    it("returns 0 when all non-null satisfaction records are false", () => {
      const recs = [
        makeRecord({ child_satisfied_with_response: false }),
        makeRecord({ child_satisfied_with_response: false }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.child_satisfied_rate).toBe(0); // records exist → real 0.
    });

    it("returns 100 when all non-null satisfaction records are true", () => {
      const recs = [
        makeRecord({ child_satisfied_with_response: true }),
        makeRecord({ child_satisfied_with_response: true }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.child_satisfied_rate).toBe(100);
    });

    it("excludes null values from the calculation", () => {
      const recs = [
        makeRecord({ child_satisfied_with_response: true }),
        makeRecord({ child_satisfied_with_response: null }),
        makeRecord({ child_satisfied_with_response: null }),
      ];
      const m = computeWishesMetrics(recs, 3);
      // 1 satisfied out of 1 non-null = 100%
      expect(m.child_satisfied_rate).toBe(100);
    });

    it("returns 0 when all satisfaction values are null", () => {
      const recs = [
        makeRecord({ child_satisfied_with_response: null }),
        makeRecord({ child_satisfied_with_response: null }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.child_satisfied_rate).toBeNull(); // fab-0.
    });

    it("calculates mixed satisfied/unsatisfied correctly (1 of 2 non-null = 50%)", () => {
      const recs = [
        makeRecord({ child_satisfied_with_response: true }),
        makeRecord({ child_satisfied_with_response: false }),
        makeRecord({ child_satisfied_with_response: null }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.child_satisfied_rate).toBe(50);
    });

    it("rounds to 1 decimal place", () => {
      // 2 of 3 non-null satisfied = 66.666...% -> 66.7
      const recs = [
        makeRecord({ child_satisfied_with_response: true }),
        makeRecord({ child_satisfied_with_response: true }),
        makeRecord({ child_satisfied_with_response: false }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.child_satisfied_rate).toBe(66.7);
    });
  });

  // ── influenced_care_plan_rate ────────────────────────────────────────────

  describe("influenced_care_plan_rate", () => {
    it("returns 0 when no records influenced care plans", () => {
      const recs = [
        makeRecord({ influenced_care_plan: false }),
        makeRecord({ influenced_care_plan: false }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.influenced_care_plan_rate).toBe(0); // records exist → real 0.
    });

    it("returns 100 when all records influenced care plans", () => {
      const recs = [
        makeRecord({ influenced_care_plan: true }),
        makeRecord({ influenced_care_plan: true }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.influenced_care_plan_rate).toBe(100);
    });

    it("rounds to 1 decimal place", () => {
      // 1 of 3 = 33.333...% -> 33.3
      const recs = [
        makeRecord({ influenced_care_plan: true }),
        makeRecord({ influenced_care_plan: false }),
        makeRecord({ influenced_care_plan: false }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.influenced_care_plan_rate).toBe(33.3);
    });
  });

  // ── positive_feeling_rate ────────────────────────────────────────────────

  describe("positive_feeling_rate", () => {
    it("counts very_happy as positive", () => {
      const recs = [makeRecord({ feeling_rating: "very_happy" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.positive_feeling_rate).toBe(100);
    });

    it("counts happy as positive", () => {
      const recs = [makeRecord({ feeling_rating: "happy" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.positive_feeling_rate).toBe(100);
    });

    it("does not count okay as positive", () => {
      const recs = [makeRecord({ feeling_rating: "okay" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.positive_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("does not count mixed as positive", () => {
      const recs = [makeRecord({ feeling_rating: "mixed" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.positive_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("does not count not_expressed as positive", () => {
      const recs = [makeRecord({ feeling_rating: "not_expressed" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.positive_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("does not count unhappy as positive", () => {
      const recs = [makeRecord({ feeling_rating: "unhappy" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.positive_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("does not count very_unhappy as positive", () => {
      const recs = [makeRecord({ feeling_rating: "very_unhappy" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.positive_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("calculates mixed positive/other correctly (2 of 4 = 50%)", () => {
      const recs = [
        makeRecord({ feeling_rating: "very_happy" }),
        makeRecord({ feeling_rating: "happy" }),
        makeRecord({ feeling_rating: "okay" }),
        makeRecord({ feeling_rating: "unhappy" }),
      ];
      const m = computeWishesMetrics(recs, 4);
      expect(m.positive_feeling_rate).toBe(50);
    });
  });

  // ── negative_feeling_rate ────────────────────────────────────────────────

  describe("negative_feeling_rate", () => {
    it("counts unhappy as negative", () => {
      const recs = [makeRecord({ feeling_rating: "unhappy" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.negative_feeling_rate).toBe(100);
    });

    it("counts very_unhappy as negative", () => {
      const recs = [makeRecord({ feeling_rating: "very_unhappy" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.negative_feeling_rate).toBe(100);
    });

    it("does not count okay as negative", () => {
      const recs = [makeRecord({ feeling_rating: "okay" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.negative_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("does not count mixed as negative", () => {
      const recs = [makeRecord({ feeling_rating: "mixed" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.negative_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("does not count not_expressed as negative", () => {
      const recs = [makeRecord({ feeling_rating: "not_expressed" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.negative_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("does not count happy as negative", () => {
      const recs = [makeRecord({ feeling_rating: "happy" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.negative_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("does not count very_happy as negative", () => {
      const recs = [makeRecord({ feeling_rating: "very_happy" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.negative_feeling_rate).toBe(0); // records exist → real 0.
    });

    it("calculates mixed negative/other correctly (2 of 5 = 40%)", () => {
      const recs = [
        makeRecord({ feeling_rating: "unhappy" }),
        makeRecord({ feeling_rating: "very_unhappy" }),
        makeRecord({ feeling_rating: "happy" }),
        makeRecord({ feeling_rating: "okay" }),
        makeRecord({ feeling_rating: "mixed" }),
      ];
      const m = computeWishesMetrics(recs, 5);
      expect(m.negative_feeling_rate).toBe(40);
    });
  });

  // ── average_per_child ────────────────────────────────────────────────────

  describe("average_per_child", () => {
    it("returns 0 when no unique children", () => {
      const m = computeWishesMetrics([], 3);
      expect(m.average_per_child).toBeNull(); // fab-0.
    });

    it("returns 1 for single record from one child", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const m = computeWishesMetrics(recs, 1);
      expect(m.average_per_child).toBe(1);
    });

    it("returns 3 for 3 records from one child", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
      ];
      const m = computeWishesMetrics(recs, 1);
      expect(m.average_per_child).toBe(3);
    });

    it("rounds to 1 decimal place (7 records / 3 children = 2.3)", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
        makeRecord({ child_id: "c2" }),
        makeRecord({ child_id: "c3" }),
        makeRecord({ child_id: "c3" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.average_per_child).toBe(2.3);
    });

    it("handles equal distribution (4 records / 2 children = 2)", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
        makeRecord({ child_id: "c2" }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.average_per_child).toBe(2);
    });
  });

  // ── by_category ──────────────────────────────────────────────────────────

  describe("by_category", () => {
    it("groups multiple categories correctly", () => {
      const recs = [
        makeRecord({ wishes_category: "health" }),
        makeRecord({ wishes_category: "health" }),
        makeRecord({ wishes_category: "safety" }),
        makeRecord({ wishes_category: "complaints" }),
        makeRecord({ wishes_category: "complaints" }),
        makeRecord({ wishes_category: "complaints" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.by_category).toEqual({ health: 2, safety: 1, complaints: 3 });
    });

    it("handles all records in one category", () => {
      const recs = [
        makeRecord({ wishes_category: "identity" }),
        makeRecord({ wishes_category: "identity" }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.by_category).toEqual({ identity: 2 });
    });
  });

  // ── by_feeling ──────────────────────────────────────────────────────────

  describe("by_feeling", () => {
    it("groups multiple feelings correctly", () => {
      const recs = [
        makeRecord({ feeling_rating: "very_happy" }),
        makeRecord({ feeling_rating: "very_happy" }),
        makeRecord({ feeling_rating: "mixed" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.by_feeling).toEqual({ very_happy: 2, mixed: 1 });
    });

    it("handles all records with same feeling", () => {
      const recs = [
        makeRecord({ feeling_rating: "not_expressed" }),
        makeRecord({ feeling_rating: "not_expressed" }),
        makeRecord({ feeling_rating: "not_expressed" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.by_feeling).toEqual({ not_expressed: 3 });
    });
  });

  // ── by_capture_method ────────────────────────────────────────────────────

  describe("by_capture_method", () => {
    it("groups multiple methods correctly", () => {
      const recs = [
        makeRecord({ capture_method: "advocate" }),
        makeRecord({ capture_method: "advocate" }),
        makeRecord({ capture_method: "digital_tool" }),
        makeRecord({ capture_method: "drawing_art" }),
      ];
      const m = computeWishesMetrics(recs, 4);
      expect(m.by_capture_method).toEqual({ advocate: 2, digital_tool: 1, drawing_art: 1 });
    });
  });

  // ── by_outcome ──────────────────────────────────────────────────────────

  describe("by_outcome", () => {
    it("groups multiple outcomes correctly", () => {
      const recs = [
        makeRecord({ response_outcome: "referred_to_sw" }),
        makeRecord({ response_outcome: "referred_to_sw" }),
        makeRecord({ response_outcome: "under_consideration" }),
      ];
      const m = computeWishesMetrics(recs, 3);
      expect(m.by_outcome).toEqual({ referred_to_sw: 2, under_consideration: 1 });
    });
  });

  // ── by_child ─────────────────────────────────────────────────────────────

  describe("by_child", () => {
    it("groups by child_name not child_id", () => {
      const recs = [
        makeRecord({ child_id: "c1", child_name: "Alice" }),
        makeRecord({ child_id: "c1", child_name: "Alice" }),
        makeRecord({ child_id: "c2", child_name: "Bob" }),
      ];
      const m = computeWishesMetrics(recs, 2);
      expect(m.by_child).toEqual({ Alice: 2, Bob: 1 });
    });

    it("handles single child with many records", () => {
      const recs = [
        makeRecord({ child_name: "Charlie" }),
        makeRecord({ child_name: "Charlie" }),
        makeRecord({ child_name: "Charlie" }),
        makeRecord({ child_name: "Charlie" }),
      ];
      const m = computeWishesMetrics(recs, 1);
      expect(m.by_child).toEqual({ Charlie: 4 });
    });
  });

  // ── Return shape ─────────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns exactly 18 keys", () => {
      const m = computeWishesMetrics([], 0);
      expect(Object.keys(m)).toHaveLength(18);
    });

    it("contains all expected keys", () => {
      const m = computeWishesMetrics([], 0);
      const keys = Object.keys(m);
      const expected = [
        "total_records", "children_with_records", "participation_rate",
        "wish_granted_count", "wish_partially_met_count", "wish_not_possible_count",
        "awaiting_response_count", "child_informed_rate", "child_satisfied_rate",
        "influenced_care_plan_rate", "positive_feeling_rate", "negative_feeling_rate",
        "average_per_child", "by_category", "by_feeling", "by_capture_method",
        "by_outcome", "by_child",
      ];
      for (const k of expected) {
        expect(keys).toContain(k);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyWishesAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyWishesAlerts", () => {
  // ── No alerts ────────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array when no records and no children", () => {
      const alerts = identifyWishesAlerts([], 0);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all conditions are met", () => {
      const recs = [
        makeRecord({
          child_id: "c1", child_name: "Alice",
          feeling_rating: "happy", response_outcome: "wish_granted",
          child_informed_of_outcome: true, influenced_care_plan: true,
          wishes_category: "placement",
        }),
        makeRecord({
          child_id: "c2", child_name: "Bob",
          feeling_rating: "okay", response_outcome: "wish_partially_met",
          child_informed_of_outcome: true, influenced_care_plan: true,
          wishes_category: "contact",
        }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      expect(alerts).toEqual([]);
    });
  });

  // ── no_wishes_captured alert ─────────────────────────────────────────────

  describe("no_wishes_captured alert", () => {
    it("fires when gap exists between totalChildren and recorded children", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "no_wishes_captured");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "no_wishes_captured")!;
      expect(alert.severity).toBe("high");
    });

    it("has id 'wishes_gap'", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "no_wishes_captured")!;
      expect(alert.id).toBe("wishes_gap");
    });

    it("uses singular 'child's' when gap is 1", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "no_wishes_captured")!;
      expect(alert.message).toContain("1 child's");
    });

    it("uses plural 'children's' when gap is > 1", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const alerts = identifyWishesAlerts(recs, 4);
      const alert = alerts.find((a) => a.type === "no_wishes_captured")!;
      expect(alert.message).toContain("3 children's");
    });

    it("does not fire when all children have records", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "no_wishes_captured");
      expect(alert).toBeUndefined();
    });

    it("does not fire when totalChildren is 0", () => {
      const alerts = identifyWishesAlerts([], 0);
      const alert = alerts.find((a) => a.type === "no_wishes_captured");
      expect(alert).toBeUndefined();
    });

    it("does not fire when no records but totalChildren is 0", () => {
      const alerts = identifyWishesAlerts([], 0);
      expect(alerts.filter((a) => a.type === "no_wishes_captured")).toHaveLength(0);
    });

    it("fires when no records and totalChildren > 0", () => {
      const alerts = identifyWishesAlerts([], 5);
      const alert = alerts.find((a) => a.type === "no_wishes_captured")!;
      expect(alert.message).toContain("5 children's");
    });

    it("correctly counts unique children when same child has multiple records", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "no_wishes_captured")!;
      expect(alert.message).toContain("2 children's");
    });
  });

  // ── wishes_awaiting alert ────────────────────────────────────────────────

  describe("wishes_awaiting alert", () => {
    it("fires when >= 2 records have awaiting_response", () => {
      const recs = [
        makeRecord({ response_outcome: "awaiting_response" }),
        makeRecord({ response_outcome: "awaiting_response" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "wishes_awaiting");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [
        makeRecord({ response_outcome: "awaiting_response" }),
        makeRecord({ response_outcome: "awaiting_response" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "wishes_awaiting")!;
      expect(alert.severity).toBe("high");
    });

    it("has id 'awaiting_responses'", () => {
      const recs = [
        makeRecord({ response_outcome: "awaiting_response" }),
        makeRecord({ response_outcome: "awaiting_response" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "wishes_awaiting")!;
      expect(alert.id).toBe("awaiting_responses");
    });

    it("includes count in message", () => {
      const recs = [
        makeRecord({ response_outcome: "awaiting_response" }),
        makeRecord({ response_outcome: "awaiting_response" }),
        makeRecord({ response_outcome: "awaiting_response" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "wishes_awaiting")!;
      expect(alert.message).toContain("3 wishes awaiting response");
    });

    it("does not fire when only 1 awaiting_response", () => {
      const recs = [
        makeRecord({ response_outcome: "awaiting_response" }),
        makeRecord({ response_outcome: "wish_granted" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "wishes_awaiting");
      expect(alert).toBeUndefined();
    });

    it("does not fire when 0 awaiting_response", () => {
      const recs = [
        makeRecord({ response_outcome: "wish_granted" }),
        makeRecord({ response_outcome: "wish_partially_met" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "wishes_awaiting");
      expect(alert).toBeUndefined();
    });

    it("fires at exact threshold of 2", () => {
      const recs = [
        makeRecord({ response_outcome: "awaiting_response" }),
        makeRecord({ response_outcome: "awaiting_response" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "wishes_awaiting")!;
      expect(alert.message).toContain("2 wishes awaiting response");
    });
  });

  // ── child_not_informed alert ─────────────────────────────────────────────

  describe("child_not_informed alert", () => {
    it("fires when >= 2 records not informed (excluding awaiting_response and under_consideration)", () => {
      const recs = [
        makeRecord({
          child_informed_of_outcome: false,
          response_outcome: "wish_granted",
        }),
        makeRecord({
          child_informed_of_outcome: false,
          response_outcome: "wish_not_possible",
        }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_granted" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_not_possible" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "child_not_informed")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'not_informed'", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_granted" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_not_possible" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "child_not_informed")!;
      expect(alert.id).toBe("not_informed");
    });

    it("includes count in message", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_granted" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_not_possible" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "referred_to_sw" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "child_not_informed")!;
      expect(alert.message).toContain("3 wishes");
    });

    it("excludes awaiting_response records from count", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: false, response_outcome: "awaiting_response" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "awaiting_response" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_granted" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      // Only 1 non-awaiting not informed, threshold is 2
      expect(alert).toBeUndefined();
    });

    it("excludes under_consideration records from count", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: false, response_outcome: "under_consideration" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "under_consideration" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_granted" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      // Only 1 non-excluded not informed, threshold is 2
      expect(alert).toBeUndefined();
    });

    it("excludes both awaiting_response and under_consideration from count", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: false, response_outcome: "awaiting_response" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "under_consideration" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_granted" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when only 1 non-excluded record not informed", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_granted" }),
        makeRecord({ child_informed_of_outcome: true, response_outcome: "wish_granted" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all children are informed", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: true, response_outcome: "wish_granted" }),
        makeRecord({ child_informed_of_outcome: true, response_outcome: "wish_partially_met" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      expect(alert).toBeUndefined();
    });

    it("fires at exact threshold of 2 non-excluded not-informed", () => {
      const recs = [
        makeRecord({ child_informed_of_outcome: false, response_outcome: "wish_granted" }),
        makeRecord({ child_informed_of_outcome: false, response_outcome: "no_action_needed" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "child_not_informed")!;
      expect(alert).toBeDefined();
      expect(alert.message).toContain("2 wishes");
    });
  });

  // ── very_unhappy alert ───────────────────────────────────────────────────

  describe("very_unhappy alert", () => {
    it("fires per-record for feeling_rating === very_unhappy", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", feeling_rating: "very_unhappy", wishes_category: "placement" }),
      ];
      const alerts = identifyWishesAlerts(recs, 1);
      const vAlerts = alerts.filter((a) => a.type === "very_unhappy");
      expect(vAlerts).toHaveLength(1);
    });

    it("creates one alert per very_unhappy record", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", feeling_rating: "very_unhappy", wishes_category: "placement" }),
        makeRecord({ id: "r2", child_name: "Bob", feeling_rating: "very_unhappy", wishes_category: "contact" }),
        makeRecord({ id: "r3", child_name: "Charlie", feeling_rating: "very_unhappy", wishes_category: "education" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const vAlerts = alerts.filter((a) => a.type === "very_unhappy");
      expect(vAlerts).toHaveLength(3);
    });

    it("has severity high", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", feeling_rating: "very_unhappy", wishes_category: "placement" }),
      ];
      const alerts = identifyWishesAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "very_unhappy")!;
      expect(alert.severity).toBe("high");
    });

    it("uses record id as alert id", () => {
      const recs = [
        makeRecord({ id: "rec-unique-123", child_name: "Alice", feeling_rating: "very_unhappy", wishes_category: "placement" }),
      ];
      const alerts = identifyWishesAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "very_unhappy")!;
      expect(alert.id).toBe("rec-unique-123");
    });

    it("includes child_name in message", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", feeling_rating: "very_unhappy", wishes_category: "placement" }),
      ];
      const alerts = identifyWishesAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "very_unhappy")!;
      expect(alert.message).toContain("Alice");
    });

    it("includes category (with underscores replaced by spaces) in message", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", feeling_rating: "very_unhappy", wishes_category: "daily_life" }),
      ];
      const alerts = identifyWishesAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "very_unhappy")!;
      expect(alert.message).toContain("daily life");
      expect(alert.message).not.toContain("daily_life");
    });

    it("does not fire for unhappy (only very_unhappy)", () => {
      const recs = [
        makeRecord({ feeling_rating: "unhappy" }),
      ];
      const alerts = identifyWishesAlerts(recs, 1);
      const vAlerts = alerts.filter((a) => a.type === "very_unhappy");
      expect(vAlerts).toHaveLength(0);
    });

    it("does not fire for other feeling ratings", () => {
      const ratings: FeelingRating[] = ["very_happy", "happy", "okay", "mixed", "not_expressed"];
      for (const rating of ratings) {
        const recs = [makeRecord({ feeling_rating: rating })];
        const alerts = identifyWishesAlerts(recs, 1);
        const vAlerts = alerts.filter((a) => a.type === "very_unhappy");
        expect(vAlerts).toHaveLength(0);
      }
    });

    it("handles category with no underscores", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", feeling_rating: "very_unhappy", wishes_category: "safety" }),
      ];
      const alerts = identifyWishesAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "very_unhappy")!;
      expect(alert.message).toContain("safety");
    });

    it("handles category with multiple underscores", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", feeling_rating: "very_unhappy", wishes_category: "future_plans" }),
      ];
      const alerts = identifyWishesAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "very_unhappy")!;
      expect(alert.message).toContain("future plans");
    });
  });

  // ── not_influencing_plans alert ──────────────────────────────────────────

  describe("not_influencing_plans alert", () => {
    it("fires when >= 3 placement/contact/education records are not influencing care plan", () => {
      const recs = [
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "contact" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "education" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "not_influencing_plans");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const recs = [
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "contact" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "education" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "not_influencing_plans")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'not_influencing'", () => {
      const recs = [
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "contact" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "education" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "not_influencing_plans")!;
      expect(alert.id).toBe("not_influencing");
    });

    it("includes count in message", () => {
      const recs = [
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "contact" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "education" }),
      ];
      const alerts = identifyWishesAlerts(recs, 4);
      const alert = alerts.find((a) => a.type === "not_influencing_plans")!;
      expect(alert.message).toContain("4 significant wishes");
    });

    it("only considers placement, contact, and education categories", () => {
      const recs = [
        makeRecord({ influenced_care_plan: false, wishes_category: "daily_life" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "health" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "safety" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "activities" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "identity" }),
      ];
      const alerts = identifyWishesAlerts(recs, 5);
      const alert = alerts.find((a) => a.type === "not_influencing_plans");
      expect(alert).toBeUndefined();
    });

    it("does not fire when only 2 significant category records not influencing", () => {
      const recs = [
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "contact" }),
      ];
      const alerts = identifyWishesAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "not_influencing_plans");
      expect(alert).toBeUndefined();
    });

    it("does not count records that do influence care plan", () => {
      const recs = [
        makeRecord({ influenced_care_plan: true, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: true, wishes_category: "contact" }),
        makeRecord({ influenced_care_plan: true, wishes_category: "education" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "contact" }),
      ];
      const alerts = identifyWishesAlerts(recs, 5);
      const alert = alerts.find((a) => a.type === "not_influencing_plans");
      // Only 2 not influencing in significant categories, threshold is 3
      expect(alert).toBeUndefined();
    });

    it("fires at exact threshold of 3", () => {
      const recs = [
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "contact" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "education" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "not_influencing_plans")!;
      expect(alert).toBeDefined();
      expect(alert.message).toContain("3 significant wishes");
    });

    it("counts all three qualifying categories", () => {
      // All placement
      const recs = [
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
      ];
      const alerts = identifyWishesAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "not_influencing_plans");
      expect(alert).toBeDefined();
    });

    it("mixes non-qualifying categories without triggering", () => {
      const recs = [
        makeRecord({ influenced_care_plan: false, wishes_category: "placement" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "contact" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "other" }),
        makeRecord({ influenced_care_plan: false, wishes_category: "complaints" }),
      ];
      const alerts = identifyWishesAlerts(recs, 4);
      const alert = alerts.find((a) => a.type === "not_influencing_plans");
      // Only 2 qualifying, threshold is 3
      expect(alert).toBeUndefined();
    });
  });

  // ── Multiple alerts simultaneously ───────────────────────────────────────

  describe("multiple alerts simultaneously", () => {
    it("can return all 5 alert types at once", () => {
      const recs = [
        // very_unhappy alert
        makeRecord({
          id: "r1", child_id: "c1", child_name: "Alice",
          feeling_rating: "very_unhappy", wishes_category: "placement",
          response_outcome: "awaiting_response",
          child_informed_of_outcome: false,
          influenced_care_plan: false,
        }),
        // more awaiting_response for wishes_awaiting alert
        makeRecord({
          id: "r2", child_id: "c1", child_name: "Alice",
          response_outcome: "awaiting_response",
          child_informed_of_outcome: false,
          wishes_category: "contact",
          influenced_care_plan: false,
        }),
        // not informed (non-excluded outcomes)
        makeRecord({
          id: "r3", child_id: "c1", child_name: "Alice",
          response_outcome: "wish_granted",
          child_informed_of_outcome: false,
          wishes_category: "education",
          influenced_care_plan: false,
        }),
        makeRecord({
          id: "r4", child_id: "c1", child_name: "Alice",
          response_outcome: "wish_not_possible",
          child_informed_of_outcome: false,
          wishes_category: "placement",
          influenced_care_plan: false,
        }),
      ];
      // totalChildren = 3 but only c1 has records, so gap = 2 => no_wishes_captured
      const alerts = identifyWishesAlerts(recs, 3);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_wishes_captured");
      expect(types).toContain("wishes_awaiting");
      expect(types).toContain("child_not_informed");
      expect(types).toContain("very_unhappy");
      expect(types).toContain("not_influencing_plans");
    });

    it("returns correct count when multiple very_unhappy alerts exist with other alerts", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", feeling_rating: "very_unhappy", wishes_category: "safety" }),
        makeRecord({ id: "r2", child_name: "Bob", feeling_rating: "very_unhappy", wishes_category: "health" }),
      ];
      const alerts = identifyWishesAlerts(recs, 4);
      const vAlerts = alerts.filter((a) => a.type === "very_unhappy");
      expect(vAlerts).toHaveLength(2);
      // Also has no_wishes_captured (gap of 2)
      expect(alerts.find((a) => a.type === "no_wishes_captured")).toBeDefined();
    });
  });

  // ── Alert structure ──────────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice", feeling_rating: "very_unhappy",
          wishes_category: "placement", response_outcome: "awaiting_response",
          child_informed_of_outcome: false, influenced_care_plan: false,
        }),
        makeRecord({
          id: "r2", response_outcome: "awaiting_response",
          child_informed_of_outcome: false,
          wishes_category: "contact", influenced_care_plan: false,
        }),
        makeRecord({
          id: "r3", response_outcome: "wish_granted",
          child_informed_of_outcome: false,
          wishes_category: "education", influenced_care_plan: false,
        }),
      ];
      const alerts = identifyWishesAlerts(recs, 5);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice", feeling_rating: "very_unhappy",
          wishes_category: "placement", response_outcome: "awaiting_response",
          child_informed_of_outcome: false, influenced_care_plan: false,
        }),
        makeRecord({
          id: "r2", response_outcome: "awaiting_response",
          child_informed_of_outcome: false,
          wishes_category: "contact", influenced_care_plan: false,
        }),
        makeRecord({
          id: "r3", response_outcome: "wish_granted",
          child_informed_of_outcome: false,
          wishes_category: "education", influenced_care_plan: false,
        }),
      ];
      const alerts = identifyWishesAlerts(recs, 5);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});
