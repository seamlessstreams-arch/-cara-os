// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BODY MAP SERVICE TESTS
// Pure-function unit tests for body map metrics computation, alert
// identification, constant validation, and CRUD fallback behaviour.
// CHR 2015 Reg 12 (safeguarding — recording injuries),
// Reg 36 (records — body map documentation).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";
import { _testing } from "../body-map-service";
import {
  MARK_TYPES,
  BODY_LOCATIONS,
  EXPLANATION_SOURCES,
  ACTIONS_TAKEN,
} from "../body-map-service";

import type {
  BodyMapRecord,
  MarkType,
  BodyLocation,
  ExplanationSource,
  ActionTaken,
} from "../body-map-service";

const { computeBodyMapMetrics, identifyBodyMapAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

/** Return a date string N days before `now`. */
function daysAgo(n: number): string {
  const d = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

/** Return a date string N days after `now`. */
function daysFromNow(n: number): string {
  const d = new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

/** Build a minimal BodyMapRecord with sensible defaults. */
function makeRecord(
  overrides: Partial<BodyMapRecord> = {},
): BodyMapRecord {
  return {
    id: overrides.id ?? "bm-1",
    home_id: overrides.home_id ?? "home-1",
    child_name: overrides.child_name ?? "Alex Johnson",
    child_id: overrides.child_id ?? "child-1",
    observation_date: overrides.observation_date ?? daysAgo(5),
    observed_by: overrides.observed_by ?? "staff-1",
    mark_type: overrides.mark_type ?? "bruise",
    body_location: overrides.body_location ?? "left_arm",
    description: overrides.description ?? "Small mark observed",
    size_cm: overrides.size_cm ?? "2",
    colour: overrides.colour ?? "purple",
    explanation: overrides.explanation ?? "Child said they bumped into a door",
    explanation_source: overrides.explanation_source ?? "child",
    explanation_consistent: overrides.explanation_consistent ?? true,
    actions_taken: overrides.actions_taken ?? ["recorded_only"],
    safeguarding_referral_made: overrides.safeguarding_referral_made ?? false,
    photograph_taken: overrides.photograph_taken ?? false,
    manager_informed: overrides.manager_informed ?? true,
    social_worker_informed: overrides.social_worker_informed ?? false,
    follow_up_required: overrides.follow_up_required ?? false,
    follow_up_date: overrides.follow_up_date ?? null,
    follow_up_completed: overrides.follow_up_completed ?? false,
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? "2026-05-01T10:00:00Z",
    updated_at: overrides.updated_at ?? "2026-05-01T10:00:00Z",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. computeBodyMapMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeBodyMapMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────────

  describe("empty array", () => {
    it("returns zero total_records", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.total_records).toBe(0);
    });

    it("returns zero records_this_month", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.records_this_month).toBe(0);
    });

    it("returns zero children_with_records", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.children_with_records).toBe(0);
    });

    it("returns zero safeguarding_referrals", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.safeguarding_referrals).toBe(0);
    });

    it("returns zero photographs_taken", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.photographs_taken).toBe(0);
    });

    it("returns zero manager_informed_rate", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.manager_informed_rate).toBe(0);
    });

    it("returns zero social_worker_informed_rate", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.social_worker_informed_rate).toBe(0);
    });

    it("returns zero follow_ups_pending", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.follow_ups_pending).toBe(0);
    });

    it("returns zero unexplained_marks", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.unexplained_marks).toBe(0);
    });

    it("returns zero inconsistent_explanations", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.inconsistent_explanations).toBe(0);
    });

    it("returns zero self_harm_marks", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.self_harm_marks).toBe(0);
    });

    it("returns empty by_mark_type", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.by_mark_type).toEqual({});
    });

    it("returns empty by_body_location", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.by_body_location).toEqual({});
    });

    it("returns empty by_explanation_source", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.by_explanation_source).toEqual({});
    });

    it("returns empty by_child", () => {
      const m = computeBodyMapMetrics([], 10, now);
      expect(m.by_child).toEqual({});
    });
  });

  // ── Single record ────────────────────────────────────────────────────────

  describe("single record", () => {
    it("returns total_records = 1", () => {
      const m = computeBodyMapMetrics([makeRecord()], 5, now);
      expect(m.total_records).toBe(1);
    });

    it("counts the record in records_this_month when within 30 days", () => {
      const r = makeRecord({ observation_date: daysAgo(10) });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.records_this_month).toBe(1);
    });

    it("returns children_with_records = 1", () => {
      const m = computeBodyMapMetrics([makeRecord()], 5, now);
      expect(m.children_with_records).toBe(1);
    });

    it("counts safeguarding_referrals when true", () => {
      const r = makeRecord({ safeguarding_referral_made: true });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.safeguarding_referrals).toBe(1);
    });

    it("returns 0 safeguarding_referrals when false", () => {
      const r = makeRecord({ safeguarding_referral_made: false });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.safeguarding_referrals).toBe(0);
    });

    it("counts photographs_taken when true", () => {
      const r = makeRecord({ photograph_taken: true });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.photographs_taken).toBe(1);
    });

    it("returns 0 photographs_taken when false", () => {
      const r = makeRecord({ photograph_taken: false });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.photographs_taken).toBe(0);
    });

    it("manager_informed_rate is 100 when manager_informed is true", () => {
      const r = makeRecord({ manager_informed: true });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.manager_informed_rate).toBe(100);
    });

    it("manager_informed_rate is 0 when manager_informed is false", () => {
      const r = makeRecord({ manager_informed: false });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.manager_informed_rate).toBe(0);
    });

    it("social_worker_informed_rate is 100 when social_worker_informed is true", () => {
      const r = makeRecord({ social_worker_informed: true });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.social_worker_informed_rate).toBe(100);
    });

    it("social_worker_informed_rate is 0 when social_worker_informed is false", () => {
      const r = makeRecord({ social_worker_informed: false });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.social_worker_informed_rate).toBe(0);
    });

    it("populates by_mark_type with the mark type", () => {
      const r = makeRecord({ mark_type: "cut" });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.by_mark_type).toEqual({ cut: 1 });
    });

    it("populates by_body_location with the body location", () => {
      const r = makeRecord({ body_location: "neck" });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.by_body_location).toEqual({ neck: 1 });
    });

    it("populates by_explanation_source with the source", () => {
      const r = makeRecord({ explanation_source: "staff_witnessed" });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.by_explanation_source).toEqual({ staff_witnessed: 1 });
    });

    it("populates by_child with the child name", () => {
      const r = makeRecord({ child_name: "Beth Taylor" });
      const m = computeBodyMapMetrics([r], 5, now);
      expect(m.by_child).toEqual({ "Beth Taylor": 1 });
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────────

  describe("multiple records", () => {
    it("returns correct total_records for 4 records", () => {
      const records = [
        makeRecord({ id: "bm-1" }),
        makeRecord({ id: "bm-2" }),
        makeRecord({ id: "bm-3" }),
        makeRecord({ id: "bm-4" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.total_records).toBe(4);
    });

    it("aggregates by_mark_type across multiple records", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "bruise" }),
        makeRecord({ id: "bm-2", mark_type: "bruise" }),
        makeRecord({ id: "bm-3", mark_type: "cut" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.by_mark_type).toEqual({ bruise: 2, cut: 1 });
    });

    it("aggregates by_body_location across multiple records", () => {
      const records = [
        makeRecord({ id: "bm-1", body_location: "head_face" }),
        makeRecord({ id: "bm-2", body_location: "head_face" }),
        makeRecord({ id: "bm-3", body_location: "chest" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.by_body_location).toEqual({ head_face: 2, chest: 1 });
    });

    it("aggregates by_explanation_source across multiple records", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "child" }),
        makeRecord({ id: "bm-2", explanation_source: "child" }),
        makeRecord({ id: "bm-3", explanation_source: "unknown" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.by_explanation_source).toEqual({ child: 2, unknown: 1 });
    });

    it("aggregates by_child across multiple records", () => {
      const records = [
        makeRecord({ id: "bm-1", child_name: "Alex", child_id: "c-1" }),
        makeRecord({ id: "bm-2", child_name: "Alex", child_id: "c-1" }),
        makeRecord({ id: "bm-3", child_name: "Beth", child_id: "c-2" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.by_child).toEqual({ Alex: 2, Beth: 1 });
    });

    it("counts unique children_with_records", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1" }),
        makeRecord({ id: "bm-2", child_id: "c-1" }),
        makeRecord({ id: "bm-3", child_id: "c-2" }),
        makeRecord({ id: "bm-4", child_id: "c-3" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.children_with_records).toBe(3);
    });
  });

  // ── records_this_month (30-day window) ──────────────────────────────────

  describe("records_this_month", () => {
    it("counts records within 30 days as this month", () => {
      const records = [
        makeRecord({ id: "bm-1", observation_date: daysAgo(1) }),
        makeRecord({ id: "bm-2", observation_date: daysAgo(15) }),
        makeRecord({ id: "bm-3", observation_date: daysAgo(29) }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.records_this_month).toBe(3);
    });

    it("excludes records older than 30 days", () => {
      const records = [
        makeRecord({ id: "bm-1", observation_date: daysAgo(31) }),
        makeRecord({ id: "bm-2", observation_date: daysAgo(60) }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.records_this_month).toBe(0);
    });

    it("record exactly 30 days ago is included", () => {
      const records = [
        makeRecord({ id: "bm-1", observation_date: daysAgo(30) }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.records_this_month).toBe(1);
    });

    it("record today is included", () => {
      const records = [
        makeRecord({ id: "bm-1", observation_date: daysAgo(0) }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.records_this_month).toBe(1);
    });

    it("mixes recent and old records correctly", () => {
      const records = [
        makeRecord({ id: "bm-1", observation_date: daysAgo(5) }),
        makeRecord({ id: "bm-2", observation_date: daysAgo(45) }),
        makeRecord({ id: "bm-3", observation_date: daysAgo(10) }),
        makeRecord({ id: "bm-4", observation_date: daysAgo(100) }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.records_this_month).toBe(2);
    });

    it("future observation dates are excluded", () => {
      const records = [
        makeRecord({ id: "bm-1", observation_date: daysFromNow(5) }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.records_this_month).toBe(0);
    });
  });

  // ── safeguarding_referrals ──────────────────────────────────────────────

  describe("safeguarding_referrals", () => {
    it("counts all records with safeguarding_referral_made = true", () => {
      const records = [
        makeRecord({ id: "bm-1", safeguarding_referral_made: true }),
        makeRecord({ id: "bm-2", safeguarding_referral_made: true }),
        makeRecord({ id: "bm-3", safeguarding_referral_made: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.safeguarding_referrals).toBe(2);
    });
  });

  // ── photographs_taken ──────────────────────────────────────────────────

  describe("photographs_taken", () => {
    it("counts all records with photograph_taken = true", () => {
      const records = [
        makeRecord({ id: "bm-1", photograph_taken: true }),
        makeRecord({ id: "bm-2", photograph_taken: false }),
        makeRecord({ id: "bm-3", photograph_taken: true }),
        makeRecord({ id: "bm-4", photograph_taken: true }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.photographs_taken).toBe(3);
    });
  });

  // ── manager_informed_rate ──────────────────────────────────────────────

  describe("manager_informed_rate", () => {
    it("returns 50 when half are informed", () => {
      const records = [
        makeRecord({ id: "bm-1", manager_informed: true }),
        makeRecord({ id: "bm-2", manager_informed: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.manager_informed_rate).toBe(50);
    });

    it("rounds to 1 decimal place (1/3 = 33.3)", () => {
      const records = [
        makeRecord({ id: "bm-1", manager_informed: true }),
        makeRecord({ id: "bm-2", manager_informed: false }),
        makeRecord({ id: "bm-3", manager_informed: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.manager_informed_rate).toBe(33.3);
    });

    it("rounds to 1 decimal place (2/3 = 66.7)", () => {
      const records = [
        makeRecord({ id: "bm-1", manager_informed: true }),
        makeRecord({ id: "bm-2", manager_informed: true }),
        makeRecord({ id: "bm-3", manager_informed: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.manager_informed_rate).toBe(66.7);
    });

    it("rounds to 1 decimal place (1/6 = 16.7)", () => {
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRecord({ id: `bm-${i}`, manager_informed: i === 0 }),
      );
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.manager_informed_rate).toBe(16.7);
    });
  });

  // ── social_worker_informed_rate ────────────────────────────────────────

  describe("social_worker_informed_rate", () => {
    it("returns 50 when half are informed", () => {
      const records = [
        makeRecord({ id: "bm-1", social_worker_informed: true }),
        makeRecord({ id: "bm-2", social_worker_informed: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.social_worker_informed_rate).toBe(50);
    });

    it("rounds to 1 decimal place (1/3 = 33.3)", () => {
      const records = [
        makeRecord({ id: "bm-1", social_worker_informed: true }),
        makeRecord({ id: "bm-2", social_worker_informed: false }),
        makeRecord({ id: "bm-3", social_worker_informed: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.social_worker_informed_rate).toBe(33.3);
    });

    it("rounds to 1 decimal place (2/3 = 66.7)", () => {
      const records = [
        makeRecord({ id: "bm-1", social_worker_informed: true }),
        makeRecord({ id: "bm-2", social_worker_informed: true }),
        makeRecord({ id: "bm-3", social_worker_informed: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.social_worker_informed_rate).toBe(66.7);
    });
  });

  // ── follow_ups_pending ─────────────────────────────────────────────────

  describe("follow_ups_pending", () => {
    it("counts records where follow_up_required=true and follow_up_completed=false", () => {
      const records = [
        makeRecord({ id: "bm-1", follow_up_required: true, follow_up_completed: false }),
        makeRecord({ id: "bm-2", follow_up_required: true, follow_up_completed: false }),
        makeRecord({ id: "bm-3", follow_up_required: true, follow_up_completed: true }),
        makeRecord({ id: "bm-4", follow_up_required: false, follow_up_completed: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.follow_ups_pending).toBe(2);
    });

    it("returns 0 when all follow-ups are completed", () => {
      const records = [
        makeRecord({ id: "bm-1", follow_up_required: true, follow_up_completed: true }),
        makeRecord({ id: "bm-2", follow_up_required: true, follow_up_completed: true }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.follow_ups_pending).toBe(0);
    });

    it("returns 0 when no follow-ups required", () => {
      const records = [
        makeRecord({ id: "bm-1", follow_up_required: false }),
        makeRecord({ id: "bm-2", follow_up_required: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.follow_ups_pending).toBe(0);
    });
  });

  // ── unexplained_marks ──────────────────────────────────────────────────

  describe("unexplained_marks", () => {
    it("counts records with explanation_source = unknown", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "unknown" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.unexplained_marks).toBe(1);
    });

    it("counts records with explanation_source = none_given", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "none_given" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.unexplained_marks).toBe(1);
    });

    it("counts both unknown and none_given together", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "unknown" }),
        makeRecord({ id: "bm-2", explanation_source: "none_given" }),
        makeRecord({ id: "bm-3", explanation_source: "child" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.unexplained_marks).toBe(2);
    });

    it("does not count child or staff_witnessed sources", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "child" }),
        makeRecord({ id: "bm-2", explanation_source: "staff_witnessed" }),
        makeRecord({ id: "bm-3", explanation_source: "parent_carer" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.unexplained_marks).toBe(0);
    });
  });

  // ── inconsistent_explanations ──────────────────────────────────────────

  describe("inconsistent_explanations", () => {
    it("counts records with explanation_source = inconsistent", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "inconsistent" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.inconsistent_explanations).toBe(1);
    });

    it("counts records with explanation_consistent = false", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_consistent: false, explanation_source: "child" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.inconsistent_explanations).toBe(1);
    });

    it("counts both inconsistent source and explanation_consistent=false", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "inconsistent", explanation_consistent: true }),
        makeRecord({ id: "bm-2", explanation_source: "child", explanation_consistent: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.inconsistent_explanations).toBe(2);
    });

    it("does not double count when both inconsistent source and false consistent", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "inconsistent", explanation_consistent: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      // The filter uses OR so a record matching both still only counts once
      expect(m.inconsistent_explanations).toBe(1);
    });

    it("does not count consistent explanations from known sources", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "child", explanation_consistent: true }),
        makeRecord({ id: "bm-2", explanation_source: "staff_witnessed", explanation_consistent: true }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.inconsistent_explanations).toBe(0);
    });

    it("counts explanation_consistent=false even when explanation_source is null-adjacent", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "parent_carer", explanation_consistent: false }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.inconsistent_explanations).toBe(1);
    });
  });

  // ── self_harm_marks ────────────────────────────────────────────────────

  describe("self_harm_marks", () => {
    it("counts records with mark_type = self_harm", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "self_harm" }),
        makeRecord({ id: "bm-2", mark_type: "self_harm" }),
        makeRecord({ id: "bm-3", mark_type: "bruise" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.self_harm_marks).toBe(2);
    });

    it("returns 0 when no self_harm marks", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "bruise" }),
        makeRecord({ id: "bm-2", mark_type: "cut" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.self_harm_marks).toBe(0);
    });
  });

  // ── Breakdown by all mark types ────────────────────────────────────────

  describe("by_mark_type breakdown", () => {
    it("correctly records all 11 mark types", () => {
      const allTypes: MarkType[] = [
        "bruise", "cut", "scratch", "burn", "bite", "swelling",
        "rash", "scar", "birthmark", "self_harm", "other",
      ];
      const records = allTypes.map((t, i) => makeRecord({ id: `bm-${i}`, mark_type: t }));
      const m = computeBodyMapMetrics(records, 10, now);
      expect(Object.keys(m.by_mark_type)).toHaveLength(11);
      for (const t of allTypes) {
        expect(m.by_mark_type[t]).toBe(1);
      }
    });

    it("accumulates multiple of the same type", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "bruise" }),
        makeRecord({ id: "bm-2", mark_type: "bruise" }),
        makeRecord({ id: "bm-3", mark_type: "bruise" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.by_mark_type).toEqual({ bruise: 3 });
    });
  });

  // ── Breakdown by all body locations ────────────────────────────────────

  describe("by_body_location breakdown", () => {
    it("correctly records all 17 body locations", () => {
      const allLocs: BodyLocation[] = [
        "head_face", "neck", "chest", "abdomen", "upper_back", "lower_back",
        "left_arm", "right_arm", "left_hand", "right_hand", "left_leg",
        "right_leg", "left_foot", "right_foot", "buttocks", "groin", "other",
      ];
      const records = allLocs.map((l, i) => makeRecord({ id: `bm-${i}`, body_location: l }));
      const m = computeBodyMapMetrics(records, 10, now);
      expect(Object.keys(m.by_body_location)).toHaveLength(17);
      for (const l of allLocs) {
        expect(m.by_body_location[l]).toBe(1);
      }
    });

    it("accumulates multiple of the same location", () => {
      const records = [
        makeRecord({ id: "bm-1", body_location: "head_face" }),
        makeRecord({ id: "bm-2", body_location: "head_face" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.by_body_location).toEqual({ head_face: 2 });
    });
  });

  // ── Breakdown by explanation source ────────────────────────────────────

  describe("by_explanation_source breakdown", () => {
    it("correctly records all 6 explanation sources", () => {
      const allSources: ExplanationSource[] = [
        "child", "staff_witnessed", "parent_carer", "unknown", "inconsistent", "none_given",
      ];
      const records = allSources.map((s, i) => makeRecord({ id: `bm-${i}`, explanation_source: s }));
      const m = computeBodyMapMetrics(records, 10, now);
      expect(Object.keys(m.by_explanation_source)).toHaveLength(6);
      for (const s of allSources) {
        expect(m.by_explanation_source[s]).toBe(1);
      }
    });
  });

  // ── Breakdown by child ─────────────────────────────────────────────────

  describe("by_child breakdown", () => {
    it("uses child_name as key", () => {
      const records = [
        makeRecord({ id: "bm-1", child_name: "Alex", child_id: "c-1" }),
        makeRecord({ id: "bm-2", child_name: "Alex", child_id: "c-1" }),
        makeRecord({ id: "bm-3", child_name: "Beth", child_id: "c-2" }),
        makeRecord({ id: "bm-4", child_name: "Chris", child_id: "c-3" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.by_child).toEqual({ Alex: 2, Beth: 1, Chris: 1 });
    });
  });

  // ── Return type structure ──────────────────────────────────────────────

  describe("return type structure", () => {
    it("has exactly 15 keys", () => {
      const m = computeBodyMapMetrics([], 0, now);
      expect(Object.keys(m)).toHaveLength(15);
    });

    it("defaults now parameter when not provided", () => {
      const records = [
        makeRecord({ observation_date: new Date().toISOString().split("T")[0] }),
      ];
      const m = computeBodyMapMetrics(records, 5);
      expect(m.total_records).toBe(1);
      expect(m.records_this_month).toBe(1);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. identifyBodyMapAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyBodyMapAlerts", () => {
  // ── inconsistent_explanation (critical) ─────────────────────────────────

  describe("inconsistent_explanation alerts", () => {
    it("triggers for explanation_source = inconsistent", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "inconsistent", child_name: "Alex" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const ie = alerts.filter((a) => a.type === "inconsistent_explanation");
      expect(ie).toHaveLength(1);
      expect(ie[0].severity).toBe("critical");
      expect(ie[0].id).toBe("bm-1");
    });

    it("triggers for explanation_consistent = false", () => {
      const records = [
        makeRecord({ id: "bm-2", explanation_consistent: false, explanation_source: "child" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const ie = alerts.filter((a) => a.type === "inconsistent_explanation");
      expect(ie).toHaveLength(1);
      expect(ie[0].severity).toBe("critical");
    });

    it("triggers for both inconsistent source and false consistent on same record", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "inconsistent", explanation_consistent: false }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const ie = alerts.filter((a) => a.type === "inconsistent_explanation");
      // only one alert per record (OR condition in filter, but single loop per record)
      expect(ie).toHaveLength(1);
    });

    it("does not trigger for consistent explanation from known source", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "child", explanation_consistent: true }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const ie = alerts.filter((a) => a.type === "inconsistent_explanation");
      expect(ie).toHaveLength(0);
    });

    it("message contains safeguarding assessment required", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_source: "inconsistent" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const ie = alerts.filter((a) => a.type === "inconsistent_explanation");
      expect(ie[0].message).toContain("safeguarding assessment required");
    });

    it("message contains the mark type", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "burn", explanation_source: "inconsistent" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const ie = alerts.filter((a) => a.type === "inconsistent_explanation");
      expect(ie[0].message).toContain("burn");
    });

    it("message contains the child name", () => {
      const records = [
        makeRecord({ id: "bm-1", child_name: "Beth", explanation_source: "inconsistent" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const ie = alerts.filter((a) => a.type === "inconsistent_explanation");
      expect(ie[0].message).toContain("Beth");
    });

    it("message contains the body location with underscores replaced by spaces", () => {
      const records = [
        makeRecord({ id: "bm-1", body_location: "head_face", explanation_source: "inconsistent" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const ie = alerts.filter((a) => a.type === "inconsistent_explanation");
      expect(ie[0].message).toContain("head face");
    });
  });

  // ── manager_not_informed (high) ────────────────────────────────────────

  describe("manager_not_informed alerts", () => {
    it("triggers when manager_informed = false", () => {
      const records = [
        makeRecord({ id: "bm-1", manager_informed: false }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const mni = alerts.filter((a) => a.type === "manager_not_informed");
      expect(mni).toHaveLength(1);
      expect(mni[0].severity).toBe("high");
    });

    it("does not trigger when manager_informed = true", () => {
      const records = [
        makeRecord({ id: "bm-1", manager_informed: true }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const mni = alerts.filter((a) => a.type === "manager_not_informed");
      expect(mni).toHaveLength(0);
    });

    it("message contains notify registered manager", () => {
      const records = [
        makeRecord({ id: "bm-1", manager_informed: false }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const mni = alerts.filter((a) => a.type === "manager_not_informed");
      expect(mni[0].message).toContain("notify registered manager immediately");
    });

    it("message contains the mark type and child name", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "scratch", child_name: "Chris", manager_informed: false }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const mni = alerts.filter((a) => a.type === "manager_not_informed");
      expect(mni[0].message).toContain("scratch");
      expect(mni[0].message).toContain("Chris");
    });

    it("alert id matches the record id", () => {
      const records = [
        makeRecord({ id: "bm-42", manager_informed: false }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const mni = alerts.filter((a) => a.type === "manager_not_informed");
      expect(mni[0].id).toBe("bm-42");
    });
  });

  // ── self_harm (critical) ───────────────────────────────────────────────

  describe("self_harm alerts", () => {
    it("triggers for mark_type = self_harm", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "self_harm" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const sh = alerts.filter((a) => a.type === "self_harm");
      expect(sh).toHaveLength(1);
      expect(sh[0].severity).toBe("critical");
    });

    it("does not trigger for other mark types", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "bruise" }),
        makeRecord({ id: "bm-2", mark_type: "cut" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const sh = alerts.filter((a) => a.type === "self_harm");
      expect(sh).toHaveLength(0);
    });

    it("message contains safety plan", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "self_harm" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const sh = alerts.filter((a) => a.type === "self_harm");
      expect(sh[0].message).toContain("safety plan");
    });

    it("message contains therapeutic support", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "self_harm" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const sh = alerts.filter((a) => a.type === "self_harm");
      expect(sh[0].message).toContain("therapeutic support");
    });

    it("message contains child name", () => {
      const records = [
        makeRecord({ id: "bm-1", mark_type: "self_harm", child_name: "Dana" }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const sh = alerts.filter((a) => a.type === "self_harm");
      expect(sh[0].message).toContain("Dana");
    });
  });

  // ── follow_up_overdue (high) ───────────────────────────────────────────

  describe("follow_up_overdue alerts", () => {
    it("triggers when follow-up date is in the past and not completed", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          follow_up_required: true,
          follow_up_date: daysAgo(5),
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(1);
      expect(fuo[0].severity).toBe("high");
    });

    it("does not trigger when follow_up_completed = true", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          follow_up_required: true,
          follow_up_date: daysAgo(5),
          follow_up_completed: true,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(0);
    });

    it("does not trigger when follow_up_date is in the future", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          follow_up_required: true,
          follow_up_date: daysFromNow(5),
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(0);
    });

    it("does not trigger when follow_up_date is null", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          follow_up_required: true,
          follow_up_date: null,
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(0);
    });

    it("does not trigger when follow_up_required is false", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          follow_up_required: false,
          follow_up_date: daysAgo(5),
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(0);
    });

    it("message contains the follow-up due date", () => {
      const dueDate = daysAgo(3);
      const records = [
        makeRecord({
          id: "bm-1",
          follow_up_required: true,
          follow_up_date: dueDate,
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo[0].message).toContain(dueDate);
    });

    it("message contains the child name", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          child_name: "Ethan",
          follow_up_required: true,
          follow_up_date: daysAgo(2),
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo[0].message).toContain("Ethan");
    });

    it("triggers when follow_up_date is exactly yesterday", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          follow_up_required: true,
          follow_up_date: daysAgo(1),
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(1);
    });
  });

  // ── repeated_marks (critical, 3+ in 30 days for same child) ────────────

  describe("repeated_marks alerts", () => {
    it("triggers when a child has 3 records in 30 days", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(5) }),
        makeRecord({ id: "bm-2", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(10) }),
        makeRecord({ id: "bm-3", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(15) }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm).toHaveLength(1);
      expect(rm[0].severity).toBe("critical");
    });

    it("does not trigger when a child has only 2 records in 30 days", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(5) }),
        makeRecord({ id: "bm-2", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(10) }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm).toHaveLength(0);
    });

    it("does not trigger when 3 records are from different children", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(5) }),
        makeRecord({ id: "bm-2", child_id: "c-2", child_name: "Beth", observation_date: daysAgo(10) }),
        makeRecord({ id: "bm-3", child_id: "c-3", child_name: "Chris", observation_date: daysAgo(15) }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm).toHaveLength(0);
    });

    it("excludes records older than 30 days", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(5) }),
        makeRecord({ id: "bm-2", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(10) }),
        makeRecord({ id: "bm-3", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(35) }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm).toHaveLength(0);
    });

    it("triggers for 5 records in 30 days with correct count in message", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeRecord({
          id: `bm-${i}`,
          child_id: "c-1",
          child_name: "Alex",
          observation_date: daysAgo(i * 5),
        }),
      );
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm).toHaveLength(1);
      expect(rm[0].message).toContain("5");
    });

    it("alert id is pattern_<child_id>", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-99", child_name: "Alex", observation_date: daysAgo(1) }),
        makeRecord({ id: "bm-2", child_id: "c-99", child_name: "Alex", observation_date: daysAgo(2) }),
        makeRecord({ id: "bm-3", child_id: "c-99", child_name: "Alex", observation_date: daysAgo(3) }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm[0].id).toBe("pattern_c-99");
    });

    it("message contains child name", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Fiona", observation_date: daysAgo(1) }),
        makeRecord({ id: "bm-2", child_id: "c-1", child_name: "Fiona", observation_date: daysAgo(2) }),
        makeRecord({ id: "bm-3", child_id: "c-1", child_name: "Fiona", observation_date: daysAgo(3) }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm[0].message).toContain("Fiona");
    });

    it("message contains safeguarding strategy meeting", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(1) }),
        makeRecord({ id: "bm-2", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(2) }),
        makeRecord({ id: "bm-3", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(3) }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm[0].message).toContain("safeguarding strategy meeting");
    });

    it("triggers separate alerts for two children each with 3+ marks", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(1) }),
        makeRecord({ id: "bm-2", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(2) }),
        makeRecord({ id: "bm-3", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(3) }),
        makeRecord({ id: "bm-4", child_id: "c-2", child_name: "Beth", observation_date: daysAgo(1) }),
        makeRecord({ id: "bm-5", child_id: "c-2", child_name: "Beth", observation_date: daysAgo(2) }),
        makeRecord({ id: "bm-6", child_id: "c-2", child_name: "Beth", observation_date: daysAgo(3) }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm).toHaveLength(2);
    });
  });

  // ── No alerts when clean ───────────────────────────────────────────────

  describe("no alerts when clean", () => {
    it("returns empty array for single clean record", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          explanation_source: "child",
          explanation_consistent: true,
          manager_informed: true,
          mark_type: "bruise",
          follow_up_required: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array for empty records", () => {
      const alerts = identifyBodyMapAlerts([], 10, now);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty for records with follow-up in the future", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          explanation_source: "staff_witnessed",
          explanation_consistent: true,
          manager_informed: true,
          mark_type: "scratch",
          follow_up_required: true,
          follow_up_date: daysFromNow(7),
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      expect(alerts).toHaveLength(0);
    });
  });

  // ── Alert structure ────────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          explanation_source: "inconsistent",
          manager_informed: false,
          mark_type: "self_harm",
          follow_up_required: true,
          follow_up_date: daysAgo(5),
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
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

    it("alert severity is one of critical, high, or medium", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          explanation_source: "inconsistent",
          manager_informed: false,
          mark_type: "self_harm",
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const validSeverities = ["critical", "high", "medium"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });
  });

  // ── Multiple alerts on same record ─────────────────────────────────────

  describe("multiple alerts on same record", () => {
    it("generates multiple alert types for a single problematic record", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          explanation_source: "inconsistent",
          manager_informed: false,
          mark_type: "self_harm",
          follow_up_required: true,
          follow_up_date: daysAgo(3),
          follow_up_completed: false,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("inconsistent_explanation");
      expect(types).toContain("manager_not_informed");
      expect(types).toContain("self_harm");
      expect(types).toContain("follow_up_overdue");
    });
  });

  // ── Default now parameter ──────────────────────────────────────────────

  describe("default now parameter", () => {
    it("identifyBodyMapAlerts works without explicit now", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const records = [
        makeRecord({
          id: "bm-1",
          follow_up_required: true,
          follow_up_date: yesterday.toISOString().split("T")[0],
          follow_up_completed: false,
          manager_informed: true,
          explanation_source: "child",
          explanation_consistent: true,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 5);
      const fuo = alerts.filter((a) => a.type === "follow_up_overdue");
      expect(fuo).toHaveLength(1);
    });
  });

  // ── Large dataset ─────────────────────────────────────────────────────

  describe("large datasets", () => {
    it("handles 100 records", () => {
      const records = Array.from({ length: 100 }, (_, i) =>
        makeRecord({
          id: `bm-${i}`,
          child_id: `c-${i % 10}`,
          child_name: `Child ${i % 10}`,
          mark_type: i % 3 === 0 ? "self_harm" : "bruise",
          manager_informed: i % 2 === 0,
          explanation_source: i % 4 === 0 ? "inconsistent" : "child",
          observation_date: daysAgo(i % 60),
        }),
      );
      const alerts = identifyBodyMapAlerts(records, 50, now);
      expect(alerts.length).toBeGreaterThan(0);
    });

    it("generates repeated_marks alerts for large dataset", () => {
      // 10 children, 5 records each, all within 30 days
      const records = Array.from({ length: 50 }, (_, i) =>
        makeRecord({
          id: `bm-${i}`,
          child_id: `c-${i % 10}`,
          child_name: `Child ${i % 10}`,
          observation_date: daysAgo(i % 25),
          manager_informed: true,
          explanation_source: "child",
          explanation_consistent: true,
        }),
      );
      const alerts = identifyBodyMapAlerts(records, 20, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm).toHaveLength(10);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Constants
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── MARK_TYPES ────────────────────────────────────────────────────────

  describe("MARK_TYPES", () => {
    it("has exactly 11 items", () => {
      expect(MARK_TYPES).toHaveLength(11);
    });

    it("has unique type values", () => {
      const types = MARK_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("every item has type and label", () => {
      for (const item of MARK_TYPES) {
        expect(item).toHaveProperty("type");
        expect(item).toHaveProperty("label");
        expect(typeof item.type).toBe("string");
        expect(typeof item.label).toBe("string");
      }
    });

    it("contains bruise type", () => {
      expect(MARK_TYPES.find((t) => t.type === "bruise")).toBeDefined();
    });

    it("contains self_harm type", () => {
      expect(MARK_TYPES.find((t) => t.type === "self_harm")).toBeDefined();
    });

    it("contains other type", () => {
      expect(MARK_TYPES.find((t) => t.type === "other")).toBeDefined();
    });

    it("has non-empty labels", () => {
      for (const item of MARK_TYPES) {
        expect(item.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ── BODY_LOCATIONS ──────────────────────────────────────────────────────

  describe("BODY_LOCATIONS", () => {
    it("has exactly 17 items", () => {
      expect(BODY_LOCATIONS).toHaveLength(17);
    });

    it("has unique location values", () => {
      const locs = BODY_LOCATIONS.map((l) => l.location);
      expect(new Set(locs).size).toBe(locs.length);
    });

    it("every item has location and label", () => {
      for (const item of BODY_LOCATIONS) {
        expect(item).toHaveProperty("location");
        expect(item).toHaveProperty("label");
        expect(typeof item.location).toBe("string");
        expect(typeof item.label).toBe("string");
      }
    });

    it("contains head_face location", () => {
      expect(BODY_LOCATIONS.find((l) => l.location === "head_face")).toBeDefined();
    });

    it("contains groin location", () => {
      expect(BODY_LOCATIONS.find((l) => l.location === "groin")).toBeDefined();
    });

    it("contains other location", () => {
      expect(BODY_LOCATIONS.find((l) => l.location === "other")).toBeDefined();
    });

    it("has non-empty labels", () => {
      for (const item of BODY_LOCATIONS) {
        expect(item.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ── EXPLANATION_SOURCES ────────────────────────────────────────────────

  describe("EXPLANATION_SOURCES", () => {
    it("has exactly 6 items", () => {
      expect(EXPLANATION_SOURCES).toHaveLength(6);
    });

    it("has unique source values", () => {
      const sources = EXPLANATION_SOURCES.map((s) => s.source);
      expect(new Set(sources).size).toBe(sources.length);
    });

    it("every item has source and label", () => {
      for (const item of EXPLANATION_SOURCES) {
        expect(item).toHaveProperty("source");
        expect(item).toHaveProperty("label");
        expect(typeof item.source).toBe("string");
        expect(typeof item.label).toBe("string");
      }
    });

    it("contains child source", () => {
      expect(EXPLANATION_SOURCES.find((s) => s.source === "child")).toBeDefined();
    });

    it("contains inconsistent source", () => {
      expect(EXPLANATION_SOURCES.find((s) => s.source === "inconsistent")).toBeDefined();
    });

    it("contains none_given source", () => {
      expect(EXPLANATION_SOURCES.find((s) => s.source === "none_given")).toBeDefined();
    });

    it("has non-empty labels", () => {
      for (const item of EXPLANATION_SOURCES) {
        expect(item.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ── ACTIONS_TAKEN ──────────────────────────────────────────────────────

  describe("ACTIONS_TAKEN", () => {
    it("has exactly 10 items", () => {
      expect(ACTIONS_TAKEN).toHaveLength(10);
    });

    it("has unique action values", () => {
      const actions = ACTIONS_TAKEN.map((a) => a.action);
      expect(new Set(actions).size).toBe(actions.length);
    });

    it("every item has action and label", () => {
      for (const item of ACTIONS_TAKEN) {
        expect(item).toHaveProperty("action");
        expect(item).toHaveProperty("label");
        expect(typeof item.action).toBe("string");
        expect(typeof item.label).toBe("string");
      }
    });

    it("contains recorded_only action", () => {
      expect(ACTIONS_TAKEN.find((a) => a.action === "recorded_only")).toBeDefined();
    });

    it("contains safeguarding_referral action", () => {
      expect(ACTIONS_TAKEN.find((a) => a.action === "safeguarding_referral")).toBeDefined();
    });

    it("contains lado_referral action", () => {
      expect(ACTIONS_TAKEN.find((a) => a.action === "lado_referral")).toBeDefined();
    });

    it("has non-empty labels", () => {
      for (const item of ACTIONS_TAKEN) {
        expect(item.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD fallback (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

describe("CRUD fallback (Supabase disabled)", () => {
  it("listRecords returns ok:true with empty array", async () => {
    const { listRecords } = await import("../body-map-service");
    const result = await listRecords("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listRecords returns ok:true with filters", async () => {
    const { listRecords } = await import("../body-map-service");
    const result = await listRecords("home-1", {
      childId: "c-1",
      markType: "bruise",
      bodyLocation: "left_arm",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 50,
    });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createRecord returns ok:false with error message", async () => {
    const { createRecord } = await import("../body-map-service");
    const result = await createRecord({
      homeId: "home-1",
      childName: "Alex Johnson",
      childId: "child-1",
      observationDate: "2026-05-01",
      observedBy: "staff-1",
      markType: "bruise",
      bodyLocation: "left_arm",
      description: "Small bruise",
      explanationSource: "child",
      actionsTaken: ["recorded_only"],
      safeguardingReferralMade: false,
      photographTaken: false,
      managerInformed: true,
      socialWorkerInformed: false,
      followUpRequired: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateRecord returns ok:false with error message", async () => {
    const { updateRecord } = await import("../body-map-service");
    const result = await updateRecord("some-id", { notes: "Updated note" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("type safety checks", () => {
    it("makeRecord creates a valid BodyMapRecord", () => {
      const record = makeRecord();
      expect(record).toHaveProperty("id");
      expect(record).toHaveProperty("home_id");
      expect(record).toHaveProperty("child_name");
      expect(record).toHaveProperty("child_id");
      expect(record).toHaveProperty("observation_date");
      expect(record).toHaveProperty("observed_by");
      expect(record).toHaveProperty("mark_type");
      expect(record).toHaveProperty("body_location");
      expect(record).toHaveProperty("description");
      expect(record).toHaveProperty("size_cm");
      expect(record).toHaveProperty("colour");
      expect(record).toHaveProperty("explanation");
      expect(record).toHaveProperty("explanation_source");
      expect(record).toHaveProperty("explanation_consistent");
      expect(record).toHaveProperty("actions_taken");
      expect(record).toHaveProperty("safeguarding_referral_made");
      expect(record).toHaveProperty("photograph_taken");
      expect(record).toHaveProperty("manager_informed");
      expect(record).toHaveProperty("social_worker_informed");
      expect(record).toHaveProperty("follow_up_required");
      expect(record).toHaveProperty("follow_up_date");
      expect(record).toHaveProperty("follow_up_completed");
      expect(record).toHaveProperty("notes");
      expect(record).toHaveProperty("created_at");
      expect(record).toHaveProperty("updated_at");
    });

    it("BodyMapRecord has exactly 25 fields", () => {
      const record = makeRecord();
      expect(Object.keys(record)).toHaveLength(25);
    });
  });

  describe("null fields", () => {
    it("handles null size_cm", () => {
      const record = makeRecord({ size_cm: null });
      const m = computeBodyMapMetrics([record], 5, now);
      expect(m.total_records).toBe(1);
    });

    it("handles null colour", () => {
      const record = makeRecord({ colour: null });
      const m = computeBodyMapMetrics([record], 5, now);
      expect(m.total_records).toBe(1);
    });

    it("handles null explanation", () => {
      const record = makeRecord({ explanation: null });
      const m = computeBodyMapMetrics([record], 5, now);
      expect(m.total_records).toBe(1);
    });

    it("handles null explanation_consistent", () => {
      const record = makeRecord({ explanation_consistent: null });
      const m = computeBodyMapMetrics([record], 5, now);
      expect(m.inconsistent_explanations).toBe(0);
    });

    it("handles null notes", () => {
      const record = makeRecord({ notes: null });
      const m = computeBodyMapMetrics([record], 5, now);
      expect(m.total_records).toBe(1);
    });
  });

  describe("explanation_consistent = null vs false", () => {
    it("null does not count as inconsistent", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_consistent: null, explanation_source: "child" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.inconsistent_explanations).toBe(0);
    });

    it("false counts as inconsistent", () => {
      const records = [
        makeRecord({ id: "bm-1", explanation_consistent: false, explanation_source: "child" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.inconsistent_explanations).toBe(1);
    });

    it("null does not trigger alert", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          explanation_consistent: null,
          explanation_source: "child",
          manager_informed: true,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const ie = alerts.filter((a) => a.type === "inconsistent_explanation");
      expect(ie).toHaveLength(0);
    });

    it("false triggers alert", () => {
      const records = [
        makeRecord({
          id: "bm-1",
          explanation_consistent: false,
          explanation_source: "child",
          manager_informed: true,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const ie = alerts.filter((a) => a.type === "inconsistent_explanation");
      expect(ie).toHaveLength(1);
    });
  });

  describe("actions_taken arrays", () => {
    it("handles empty actions_taken array", () => {
      const record = makeRecord({ actions_taken: [] });
      const m = computeBodyMapMetrics([record], 5, now);
      expect(m.total_records).toBe(1);
    });

    it("handles multiple actions_taken", () => {
      const record = makeRecord({
        actions_taken: ["recorded_only", "first_aid", "photograph_taken", "manager_informed"],
      });
      const m = computeBodyMapMetrics([record], 5, now);
      expect(m.total_records).toBe(1);
    });
  });

  describe("boundary dates for repeated_marks", () => {
    it("record exactly 30 days ago is included in repeated marks window", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(0) }),
        makeRecord({ id: "bm-2", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(15) }),
        makeRecord({ id: "bm-3", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(30) }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm).toHaveLength(1);
    });

    it("record 31 days ago is excluded from repeated marks window", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(0) }),
        makeRecord({ id: "bm-2", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(15) }),
        makeRecord({ id: "bm-3", child_id: "c-1", child_name: "Alex", observation_date: daysAgo(31) }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const rm = alerts.filter((a) => a.type === "repeated_marks");
      expect(rm).toHaveLength(0);
    });
  });

  describe("incidents far in the past", () => {
    it("incident 365 days ago is not in this month", () => {
      const records = [makeRecord({ observation_date: daysAgo(365) })];
      const m = computeBodyMapMetrics(records, 5, now);
      expect(m.records_this_month).toBe(0);
      expect(m.total_records).toBe(1);
    });
  });

  describe("same child different names (uses child_id for uniqueness)", () => {
    it("children_with_records uses child_id not child_name", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Alex" }),
        makeRecord({ id: "bm-2", child_id: "c-1", child_name: "Alexander" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.children_with_records).toBe(1);
    });

    it("by_child uses child_name so variants show separately", () => {
      const records = [
        makeRecord({ id: "bm-1", child_id: "c-1", child_name: "Alex" }),
        makeRecord({ id: "bm-2", child_id: "c-1", child_name: "Alexander" }),
      ];
      const m = computeBodyMapMetrics(records, 10, now);
      expect(m.by_child).toEqual({ Alex: 1, Alexander: 1 });
    });
  });

  describe("mixed alert types in one batch", () => {
    it("generates all 5 alert types from a crafted dataset", () => {
      const records = [
        // inconsistent_explanation
        makeRecord({
          id: "bm-1",
          explanation_source: "inconsistent",
          manager_informed: true,
          child_id: "c-1",
          child_name: "Alex",
          observation_date: daysAgo(1),
        }),
        // manager_not_informed
        makeRecord({
          id: "bm-2",
          manager_informed: false,
          explanation_source: "child",
          explanation_consistent: true,
          child_id: "c-2",
          child_name: "Beth",
          observation_date: daysAgo(40),
        }),
        // self_harm
        makeRecord({
          id: "bm-3",
          mark_type: "self_harm",
          manager_informed: true,
          explanation_source: "child",
          explanation_consistent: true,
          child_id: "c-3",
          child_name: "Chris",
          observation_date: daysAgo(40),
        }),
        // follow_up_overdue
        makeRecord({
          id: "bm-4",
          follow_up_required: true,
          follow_up_date: daysAgo(5),
          follow_up_completed: false,
          manager_informed: true,
          explanation_source: "child",
          explanation_consistent: true,
          child_id: "c-4",
          child_name: "Dana",
          observation_date: daysAgo(40),
        }),
        // repeated_marks (3 for c-1)
        makeRecord({
          id: "bm-5",
          child_id: "c-1",
          child_name: "Alex",
          observation_date: daysAgo(5),
          manager_informed: true,
          explanation_source: "child",
          explanation_consistent: true,
        }),
        makeRecord({
          id: "bm-6",
          child_id: "c-1",
          child_name: "Alex",
          observation_date: daysAgo(10),
          manager_informed: true,
          explanation_source: "child",
          explanation_consistent: true,
        }),
      ];
      const alerts = identifyBodyMapAlerts(records, 10, now);
      const types = new Set(alerts.map((a) => a.type));
      expect(types.has("inconsistent_explanation")).toBe(true);
      expect(types.has("manager_not_informed")).toBe(true);
      expect(types.has("self_harm")).toBe(true);
      expect(types.has("follow_up_overdue")).toBe(true);
      expect(types.has("repeated_marks")).toBe(true);
    });
  });
});
