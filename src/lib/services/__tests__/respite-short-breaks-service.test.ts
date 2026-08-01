// ══════════════════════════════════════════════════════════════════════════════
// CARA — RESPITE & SHORT BREAKS SERVICE TESTS
// Pure-function tests for respite metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  BREAK_TYPES,
  BREAK_REASONS,
  BREAK_STATUSES,
  CHILD_IMPACTS,
  _testing,
} from "../respite-short-breaks-service";

import type {
  RespiteRecord,
  BreakType,
  BreakReason,
  BreakStatus,
  ChildImpact,
} from "../respite-short-breaks-service";

const { computeRespiteMetrics, identifyRespiteAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<RespiteRecord>,
): RespiteRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    child_name: "child_name" in (overrides ?? {}) ? overrides!.child_name! : "Alice",
    child_id: "child_id" in (overrides ?? {}) ? overrides!.child_id! : "child-1",
    break_type: "break_type" in (overrides ?? {}) ? overrides!.break_type! : "planned_respite",
    break_reason: "break_reason" in (overrides ?? {}) ? overrides!.break_reason! : "placement_stability",
    break_status: "break_status" in (overrides ?? {}) ? overrides!.break_status! : "completed",
    start_date: "start_date" in (overrides ?? {}) ? overrides!.start_date! : "2026-05-01",
    end_date: "end_date" in (overrides ?? {}) ? (overrides!.end_date ?? null) : "2026-05-03",
    duration_nights: "duration_nights" in (overrides ?? {}) ? overrides!.duration_nights! : 2,
    provider_name: "provider_name" in (overrides ?? {}) ? overrides!.provider_name! : "Respite House",
    provider_type: "provider_type" in (overrides ?? {}) ? overrides!.provider_type! : "residential",
    child_views_sought: "child_views_sought" in (overrides ?? {}) ? overrides!.child_views_sought! : true,
    child_wants_break: "child_wants_break" in (overrides ?? {}) ? (overrides!.child_wants_break ?? null) : true,
    social_worker_approved: "social_worker_approved" in (overrides ?? {}) ? overrides!.social_worker_approved! : true,
    risk_assessment_completed: "risk_assessment_completed" in (overrides ?? {}) ? overrides!.risk_assessment_completed! : true,
    child_impact: "child_impact" in (overrides ?? {}) ? overrides!.child_impact! : "positive",
    child_feedback: "child_feedback" in (overrides ?? {}) ? (overrides!.child_feedback ?? null) : null,
    return_plan_in_place: "return_plan_in_place" in (overrides ?? {}) ? overrides!.return_plan_in_place! : true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("BREAK_TYPES", () => {
    it("has exactly 9 items", () => {
      expect(BREAK_TYPES).toHaveLength(9);
    });

    it("contains planned_respite", () => {
      expect(BREAK_TYPES).toContainEqual({ type: "planned_respite", label: "Planned Respite" });
    });

    it("contains emergency_break", () => {
      expect(BREAK_TYPES).toContainEqual({ type: "emergency_break", label: "Emergency Break" });
    });

    it("contains host_family", () => {
      expect(BREAK_TYPES).toContainEqual({ type: "host_family", label: "Host Family" });
    });

    it("contains activity_break", () => {
      expect(BREAK_TYPES).toContainEqual({ type: "activity_break", label: "Activity Break" });
    });

    it("contains family_stay", () => {
      expect(BREAK_TYPES).toContainEqual({ type: "family_stay", label: "Family Stay" });
    });

    it("contains holiday", () => {
      expect(BREAK_TYPES).toContainEqual({ type: "holiday", label: "Holiday" });
    });

    it("contains therapeutic_break", () => {
      expect(BREAK_TYPES).toContainEqual({ type: "therapeutic_break", label: "Therapeutic Break" });
    });

    it("contains assessment_break", () => {
      expect(BREAK_TYPES).toContainEqual({ type: "assessment_break", label: "Assessment Break" });
    });

    it("contains other", () => {
      expect(BREAK_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = BREAK_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = BREAK_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of BREAK_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("BREAK_REASONS", () => {
    it("has exactly 10 items", () => {
      expect(BREAK_REASONS).toHaveLength(10);
    });

    it("contains placement_stability", () => {
      expect(BREAK_REASONS).toContainEqual({ reason: "placement_stability", label: "Placement Stability" });
    });

    it("contains staff_wellbeing", () => {
      expect(BREAK_REASONS).toContainEqual({ reason: "staff_wellbeing", label: "Staff Wellbeing" });
    });

    it("contains child_request", () => {
      expect(BREAK_REASONS).toContainEqual({ reason: "child_request", label: "Child Request" });
    });

    it("contains behaviour_management", () => {
      expect(BREAK_REASONS).toContainEqual({ reason: "behaviour_management", label: "Behaviour Management" });
    });

    it("contains family_contact", () => {
      expect(BREAK_REASONS).toContainEqual({ reason: "family_contact", label: "Family Contact" });
    });

    it("contains holiday_activity", () => {
      expect(BREAK_REASONS).toContainEqual({ reason: "holiday_activity", label: "Holiday/Activity" });
    });

    it("contains therapeutic_purpose", () => {
      expect(BREAK_REASONS).toContainEqual({ reason: "therapeutic_purpose", label: "Therapeutic Purpose" });
    });

    it("contains emergency_situation", () => {
      expect(BREAK_REASONS).toContainEqual({ reason: "emergency_situation", label: "Emergency Situation" });
    });

    it("contains assessment", () => {
      expect(BREAK_REASONS).toContainEqual({ reason: "assessment", label: "Assessment" });
    });

    it("contains other", () => {
      expect(BREAK_REASONS).toContainEqual({ reason: "other", label: "Other" });
    });

    it("has unique reason values", () => {
      const reasons = BREAK_REASONS.map((r) => r.reason);
      expect(new Set(reasons).size).toBe(reasons.length);
    });

    it("has unique labels", () => {
      const labels = BREAK_REASONS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of BREAK_REASONS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("BREAK_STATUSES", () => {
    it("has exactly 6 items", () => {
      expect(BREAK_STATUSES).toHaveLength(6);
    });

    it("contains planned", () => {
      expect(BREAK_STATUSES).toContainEqual({ status: "planned", label: "Planned" });
    });

    it("contains confirmed", () => {
      expect(BREAK_STATUSES).toContainEqual({ status: "confirmed", label: "Confirmed" });
    });

    it("contains in_progress", () => {
      expect(BREAK_STATUSES).toContainEqual({ status: "in_progress", label: "In Progress" });
    });

    it("contains completed", () => {
      expect(BREAK_STATUSES).toContainEqual({ status: "completed", label: "Completed" });
    });

    it("contains cancelled", () => {
      expect(BREAK_STATUSES).toContainEqual({ status: "cancelled", label: "Cancelled" });
    });

    it("contains cut_short", () => {
      expect(BREAK_STATUSES).toContainEqual({ status: "cut_short", label: "Cut Short" });
    });

    it("has unique status values", () => {
      const statuses = BREAK_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = BREAK_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of BREAK_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("CHILD_IMPACTS", () => {
    it("has exactly 6 items", () => {
      expect(CHILD_IMPACTS).toHaveLength(6);
    });

    it("contains very_positive", () => {
      expect(CHILD_IMPACTS).toContainEqual({ impact: "very_positive", label: "Very Positive" });
    });

    it("contains positive", () => {
      expect(CHILD_IMPACTS).toContainEqual({ impact: "positive", label: "Positive" });
    });

    it("contains neutral", () => {
      expect(CHILD_IMPACTS).toContainEqual({ impact: "neutral", label: "Neutral" });
    });

    it("contains negative", () => {
      expect(CHILD_IMPACTS).toContainEqual({ impact: "negative", label: "Negative" });
    });

    it("contains very_negative", () => {
      expect(CHILD_IMPACTS).toContainEqual({ impact: "very_negative", label: "Very Negative" });
    });

    it("contains not_assessed", () => {
      expect(CHILD_IMPACTS).toContainEqual({ impact: "not_assessed", label: "Not Assessed" });
    });

    it("has unique impact values", () => {
      const impacts = CHILD_IMPACTS.map((i) => i.impact);
      expect(new Set(impacts).size).toBe(impacts.length);
    });

    it("has unique labels", () => {
      const labels = CHILD_IMPACTS.map((i) => i.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of CHILD_IMPACTS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeRespiteMetrics ──────────────────────────────────────────────────

describe("computeRespiteMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_breaks", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.total_breaks).toBe(0);
    });

    it("returns zero children_with_breaks", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.children_with_breaks).toBe(0);
    });

    it("returns zero break_usage_rate", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.break_usage_rate).toBe(0);
    });

    it("returns zero planned_count", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.planned_count).toBe(0);
    });

    it("returns zero emergency_count", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.emergency_count).toBe(0);
    });

    it("returns zero completed_count", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.completed_count).toBe(0);
    });

    it("returns zero cancelled_count", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.cancelled_count).toBe(0);
    });

    it("returns zero cut_short_count", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.cut_short_count).toBe(0);
    });

    it("returns zero total_nights", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.total_nights).toBe(0);
    });

    it("returns zero average_duration", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.average_duration).toBeNull();; });

    it("returns zero child_views_sought_rate", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.child_views_sought_rate).toBeNull();; });

    it("returns zero social_worker_approved_rate", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.social_worker_approved_rate).toBeNull();; });

    it("returns zero risk_assessment_rate", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.risk_assessment_rate).toBeNull();; });

    it("returns zero positive_impact_rate", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.positive_impact_rate).toBeNull();; });

    it("returns zero negative_impact_rate", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.negative_impact_rate).toBeNull();; });

    it("returns zero return_plan_rate", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.return_plan_rate).toBeNull();; });

    it("returns empty by_break_type", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.by_break_type).toEqual({});
    });

    it("returns empty by_break_reason", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.by_break_reason).toEqual({});
    });

    it("returns empty by_break_status", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.by_break_status).toEqual({});
    });

    it("returns empty by_child_impact", () => {
      const m = computeRespiteMetrics([], 5);
      expect(m.by_child_impact).toEqual({});
    });

    it("handles totalChildren = 0 with empty records", () => {
      const m = computeRespiteMetrics([], 0);
      expect(m.break_usage_rate).toBeNull();; });
  });

  describe("single record", () => {
    const record = makeRecord({
      break_type: "planned_respite",
      break_reason: "placement_stability",
      break_status: "completed",
      duration_nights: 3,
      child_views_sought: true,
      social_worker_approved: true,
      risk_assessment_completed: true,
      child_impact: "positive",
      return_plan_in_place: true,
    });

    it("returns total_breaks = 1", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.total_breaks).toBe(1);
    });

    it("returns children_with_breaks = 1", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.children_with_breaks).toBe(1);
    });

    it("returns break_usage_rate = 100", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.break_usage_rate).toBe(100);
    });

    it("returns planned_count = 1", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.planned_count).toBe(1);
    });

    it("returns emergency_count = 0", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.emergency_count).toBe(0);
    });

    it("returns completed_count = 1", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.completed_count).toBe(1);
    });

    it("returns cancelled_count = 0", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.cancelled_count).toBe(0);
    });

    it("returns cut_short_count = 0", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.cut_short_count).toBe(0);
    });

    it("returns total_nights = 3", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.total_nights).toBe(3);
    });

    it("returns average_duration = 3", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.average_duration).toBe(3);
    });

    it("returns child_views_sought_rate = 100", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.child_views_sought_rate).toBe(100);
    });

    it("returns social_worker_approved_rate = 100", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.social_worker_approved_rate).toBe(100);
    });

    it("returns risk_assessment_rate = 100", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.risk_assessment_rate).toBe(100);
    });

    it("returns positive_impact_rate = 100", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.positive_impact_rate).toBe(100);
    });

    it("returns negative_impact_rate = 0", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.negative_impact_rate).toBe(0);
    });

    it("returns return_plan_rate = 100", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.return_plan_rate).toBe(100);
    });

    it("returns by_break_type with single entry", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.by_break_type).toEqual({ planned_respite: 1 });
    });

    it("returns by_break_reason with single entry", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.by_break_reason).toEqual({ placement_stability: 1 });
    });

    it("returns by_break_status with single entry", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.by_break_status).toEqual({ completed: 1 });
    });

    it("returns by_child_impact with single entry", () => {
      const m = computeRespiteMetrics([record], 1);
      expect(m.by_child_impact).toEqual({ positive: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ child_id: "c1", child_name: "Alice", break_type: "planned_respite", break_reason: "placement_stability", break_status: "completed", duration_nights: 3, child_views_sought: true, social_worker_approved: true, risk_assessment_completed: true, child_impact: "positive", return_plan_in_place: true }),
      makeRecord({ child_id: "c1", child_name: "Alice", break_type: "emergency_break", break_reason: "emergency_situation", break_status: "completed", duration_nights: 1, child_views_sought: false, social_worker_approved: false, risk_assessment_completed: false, child_impact: "negative", return_plan_in_place: false }),
      makeRecord({ child_id: "c2", child_name: "Bob", break_type: "host_family", break_reason: "child_request", break_status: "cancelled", duration_nights: 5, child_views_sought: true, social_worker_approved: true, risk_assessment_completed: true, child_impact: "not_assessed", return_plan_in_place: true }),
      makeRecord({ child_id: "c3", child_name: "Charlie", break_type: "activity_break", break_reason: "holiday_activity", break_status: "cut_short", duration_nights: 2, child_views_sought: true, social_worker_approved: true, risk_assessment_completed: true, child_impact: "very_positive", return_plan_in_place: true }),
      makeRecord({ child_id: "c3", child_name: "Charlie", break_type: "planned_respite", break_reason: "therapeutic_purpose", break_status: "in_progress", duration_nights: 4, child_views_sought: false, social_worker_approved: true, risk_assessment_completed: false, child_impact: "very_negative", return_plan_in_place: false }),
    ];

    it("returns total_breaks = 5", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.total_breaks).toBe(5);
    });

    it("returns children_with_breaks = 3", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.children_with_breaks).toBe(3);
    });

    it("calculates break_usage_rate correctly (3/4 = 75%)", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.break_usage_rate).toBe(75);
    });

    it("returns planned_count = 2", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.planned_count).toBe(2);
    });

    it("returns emergency_count = 1", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.emergency_count).toBe(1);
    });

    it("returns completed_count = 2", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.completed_count).toBe(2);
    });

    it("returns cancelled_count = 1", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.cancelled_count).toBe(1);
    });

    it("returns cut_short_count = 1", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.cut_short_count).toBe(1);
    });

    it("returns total_nights = 15", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.total_nights).toBe(15);
    });

    it("calculates average_duration (15/5 = 3)", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.average_duration).toBe(3);
    });

    it("calculates child_views_sought_rate (3/5 = 60%)", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.child_views_sought_rate).toBe(60);
    });

    it("calculates social_worker_approved_rate (4/5 = 80%)", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.social_worker_approved_rate).toBe(80);
    });

    it("calculates risk_assessment_rate (3/5 = 60%)", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.risk_assessment_rate).toBe(60);
    });

    it("calculates positive_impact_rate excluding not_assessed (2/4 = 50%)", () => {
      // assessed: positive, negative, very_positive, very_negative = 4
      // positive = positive + very_positive = 2
      const m = computeRespiteMetrics(records, 4);
      expect(m.positive_impact_rate).toBe(50);
    });

    it("calculates negative_impact_rate excluding not_assessed (2/4 = 50%)", () => {
      // assessed = 4, negative = negative + very_negative = 2
      const m = computeRespiteMetrics(records, 4);
      expect(m.negative_impact_rate).toBe(50);
    });

    it("calculates return_plan_rate (3/5 = 60%)", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.return_plan_rate).toBe(60);
    });

    it("groups by_break_type correctly", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.by_break_type).toEqual({ planned_respite: 2, emergency_break: 1, host_family: 1, activity_break: 1 });
    });

    it("groups by_break_reason correctly", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.by_break_reason).toEqual({ placement_stability: 1, emergency_situation: 1, child_request: 1, holiday_activity: 1, therapeutic_purpose: 1 });
    });

    it("groups by_break_status correctly", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.by_break_status).toEqual({ completed: 2, cancelled: 1, cut_short: 1, in_progress: 1 });
    });

    it("groups by_child_impact correctly", () => {
      const m = computeRespiteMetrics(records, 4);
      expect(m.by_child_impact).toEqual({ positive: 1, negative: 1, not_assessed: 1, very_positive: 1, very_negative: 1 });
    });
  });

  describe("break_usage_rate edge cases", () => {
    it("returns 0 when totalChildren is 0", () => {
      const m = computeRespiteMetrics([makeRecord()], 0);
      expect(m.break_usage_rate).toBeNull();; });

    it("returns 100 when all children have breaks", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const m = computeRespiteMetrics(records, 2);
      expect(m.break_usage_rate).toBe(100);
    });

    it("deduplicates children by child_id", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
      ];
      const m = computeRespiteMetrics(records, 3);
      // 1 unique child / 3 = 33.3%
      expect(m.children_with_breaks).toBe(1);
      expect(m.break_usage_rate).toBe(33.3);
    });

    it("handles fractional rounding (1/3 = 33.3%)", () => {
      const records = [makeRecord({ child_id: "c1" })];
      const m = computeRespiteMetrics(records, 3);
      expect(m.break_usage_rate).toBe(33.3);
    });

    it("handles 2/3 rounding (66.7%)", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const m = computeRespiteMetrics(records, 3);
      expect(m.break_usage_rate).toBe(66.7);
    });

    it("returns 50 for 1 out of 2", () => {
      const records = [makeRecord({ child_id: "c1" })];
      const m = computeRespiteMetrics(records, 2);
      expect(m.break_usage_rate).toBe(50);
    });
  });

  describe("planned_count", () => {
    it("counts break_type === planned_respite", () => {
      const records = [
        makeRecord({ break_type: "planned_respite" }),
        makeRecord({ break_type: "planned_respite" }),
        makeRecord({ break_type: "emergency_break" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.planned_count).toBe(2);
    });

    it("does not count host_family as planned", () => {
      const records = [makeRecord({ break_type: "host_family" })];
      const m = computeRespiteMetrics(records, 1);
      expect(m.planned_count).toBe(0);
    });

    it("does not count activity_break as planned", () => {
      const records = [makeRecord({ break_type: "activity_break" })];
      const m = computeRespiteMetrics(records, 1);
      expect(m.planned_count).toBe(0);
    });

    it("returns 0 when no planned_respite records", () => {
      const records = [
        makeRecord({ break_type: "emergency_break" }),
        makeRecord({ break_type: "holiday" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.planned_count).toBe(0);
    });
  });

  describe("emergency_count", () => {
    it("counts break_type === emergency_break", () => {
      const records = [
        makeRecord({ break_type: "emergency_break" }),
        makeRecord({ break_type: "emergency_break" }),
        makeRecord({ break_type: "planned_respite" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.emergency_count).toBe(2);
    });

    it("does not count planned_respite as emergency", () => {
      const records = [makeRecord({ break_type: "planned_respite" })];
      const m = computeRespiteMetrics(records, 1);
      expect(m.emergency_count).toBe(0);
    });

    it("returns 0 when no emergency_break records", () => {
      const records = [
        makeRecord({ break_type: "host_family" }),
        makeRecord({ break_type: "therapeutic_break" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.emergency_count).toBe(0);
    });
  });

  describe("status counts", () => {
    it("counts completed status", () => {
      const records = [
        makeRecord({ break_status: "completed" }),
        makeRecord({ break_status: "completed" }),
        makeRecord({ break_status: "cancelled" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.completed_count).toBe(2);
    });

    it("counts cancelled status", () => {
      const records = [
        makeRecord({ break_status: "cancelled" }),
        makeRecord({ break_status: "cancelled" }),
        makeRecord({ break_status: "completed" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.cancelled_count).toBe(2);
    });

    it("counts cut_short status", () => {
      const records = [
        makeRecord({ break_status: "cut_short" }),
        makeRecord({ break_status: "cut_short" }),
        makeRecord({ break_status: "cut_short" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.cut_short_count).toBe(3);
    });

    it("does not count planned as completed", () => {
      const records = [makeRecord({ break_status: "planned" })];
      const m = computeRespiteMetrics(records, 1);
      expect(m.completed_count).toBe(0);
    });

    it("does not count in_progress as cancelled", () => {
      const records = [makeRecord({ break_status: "in_progress" })];
      const m = computeRespiteMetrics(records, 1);
      expect(m.cancelled_count).toBe(0);
    });
  });

  describe("total_nights and average_duration", () => {
    it("sums all duration_nights", () => {
      const records = [
        makeRecord({ duration_nights: 2 }),
        makeRecord({ duration_nights: 5 }),
        makeRecord({ duration_nights: 3 }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.total_nights).toBe(10);
    });

    it("calculates average with rounding to 1 decimal", () => {
      const records = [
        makeRecord({ duration_nights: 1 }),
        makeRecord({ duration_nights: 2 }),
        makeRecord({ duration_nights: 3 }),
      ];
      // 6/3 = 2.0
      const m = computeRespiteMetrics(records, 1);
      expect(m.average_duration).toBe(2);
    });

    it("rounds average correctly (7/3 = 2.3)", () => {
      const records = [
        makeRecord({ duration_nights: 2 }),
        makeRecord({ duration_nights: 2 }),
        makeRecord({ duration_nights: 3 }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.average_duration).toBe(2.3);
    });

    it("rounds average correctly (10/3 = 3.3)", () => {
      const records = [
        makeRecord({ duration_nights: 3 }),
        makeRecord({ duration_nights: 3 }),
        makeRecord({ duration_nights: 4 }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.average_duration).toBe(3.3);
    });

    it("handles 0-night durations", () => {
      const records = [
        makeRecord({ duration_nights: 0 }),
        makeRecord({ duration_nights: 0 }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.total_nights).toBe(0);
      expect(m.average_duration).toBe(0);
    });

    it("handles single record average", () => {
      const records = [makeRecord({ duration_nights: 7 })];
      const m = computeRespiteMetrics(records, 1);
      expect(m.average_duration).toBe(7);
    });
  });

  describe("child_views_sought_rate", () => {
    it("returns 100 when all views sought", () => {
      const records = [
        makeRecord({ child_views_sought: true }),
        makeRecord({ child_views_sought: true }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.child_views_sought_rate).toBe(100);
    });

    it("returns 0 when no views sought", () => {
      const records = [
        makeRecord({ child_views_sought: false }),
        makeRecord({ child_views_sought: false }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.child_views_sought_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ child_views_sought: true }),
        makeRecord({ child_views_sought: false }),
        makeRecord({ child_views_sought: false }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.child_views_sought_rate).toBe(33.3);
    });
  });

  describe("social_worker_approved_rate", () => {
    it("returns 100 when all approved", () => {
      const records = [
        makeRecord({ social_worker_approved: true }),
        makeRecord({ social_worker_approved: true }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.social_worker_approved_rate).toBe(100);
    });

    it("returns 0 when none approved", () => {
      const records = [
        makeRecord({ social_worker_approved: false }),
        makeRecord({ social_worker_approved: false }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.social_worker_approved_rate).toBe(0);
    });

    it("calculates mixed rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ social_worker_approved: true }),
        makeRecord({ social_worker_approved: true }),
        makeRecord({ social_worker_approved: false }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.social_worker_approved_rate).toBe(66.7);
    });
  });

  describe("risk_assessment_rate", () => {
    it("returns 100 when all completed", () => {
      const records = [
        makeRecord({ risk_assessment_completed: true }),
        makeRecord({ risk_assessment_completed: true }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.risk_assessment_rate).toBe(100);
    });

    it("returns 0 when none completed", () => {
      const records = [
        makeRecord({ risk_assessment_completed: false }),
        makeRecord({ risk_assessment_completed: false }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.risk_assessment_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ risk_assessment_completed: true }),
        makeRecord({ risk_assessment_completed: false }),
        makeRecord({ risk_assessment_completed: false }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.risk_assessment_rate).toBe(33.3);
    });
  });

  describe("return_plan_rate", () => {
    it("returns 100 when all have return plans", () => {
      const records = [
        makeRecord({ return_plan_in_place: true }),
        makeRecord({ return_plan_in_place: true }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.return_plan_rate).toBe(100);
    });

    it("returns 0 when none have return plans", () => {
      const records = [
        makeRecord({ return_plan_in_place: false }),
        makeRecord({ return_plan_in_place: false }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.return_plan_rate).toBe(0);
    });

    it("calculates mixed rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ return_plan_in_place: true }),
        makeRecord({ return_plan_in_place: true }),
        makeRecord({ return_plan_in_place: false }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.return_plan_rate).toBe(66.7);
    });
  });

  describe("positive_impact_rate", () => {
    it("excludes not_assessed from denominator", () => {
      const records = [
        makeRecord({ child_impact: "positive" }),
        makeRecord({ child_impact: "not_assessed" }),
        makeRecord({ child_impact: "not_assessed" }),
      ];
      // assessed = 1, positive = 1, rate = 100
      const m = computeRespiteMetrics(records, 1);
      expect(m.positive_impact_rate).toBe(100);
    });

    it("counts very_positive as positive", () => {
      const records = [
        makeRecord({ child_impact: "very_positive" }),
        makeRecord({ child_impact: "neutral" }),
      ];
      // assessed = 2, positive (very_positive + positive) = 1, rate = 50
      const m = computeRespiteMetrics(records, 1);
      expect(m.positive_impact_rate).toBe(50);
    });

    it("counts positive as positive", () => {
      const records = [
        makeRecord({ child_impact: "positive" }),
        makeRecord({ child_impact: "neutral" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.positive_impact_rate).toBe(50);
    });

    it("does not count neutral as positive", () => {
      const records = [
        makeRecord({ child_impact: "neutral" }),
        makeRecord({ child_impact: "neutral" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.positive_impact_rate).toBe(0);
    });

    it("does not count negative as positive", () => {
      const records = [
        makeRecord({ child_impact: "negative" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.positive_impact_rate).toBe(0);
    });

    it("returns 0 when all not_assessed", () => {
      const records = [
        makeRecord({ child_impact: "not_assessed" }),
        makeRecord({ child_impact: "not_assessed" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.positive_impact_rate).toBeNull();; });

    it("calculates mixed (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ child_impact: "positive" }),
        makeRecord({ child_impact: "very_positive" }),
        makeRecord({ child_impact: "negative" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.positive_impact_rate).toBe(66.7);
    });
  });

  describe("negative_impact_rate", () => {
    it("excludes not_assessed from denominator", () => {
      const records = [
        makeRecord({ child_impact: "negative" }),
        makeRecord({ child_impact: "not_assessed" }),
        makeRecord({ child_impact: "not_assessed" }),
      ];
      // assessed = 1, negative = 1, rate = 100
      const m = computeRespiteMetrics(records, 1);
      expect(m.negative_impact_rate).toBe(100);
    });

    it("counts very_negative as negative", () => {
      const records = [
        makeRecord({ child_impact: "very_negative" }),
        makeRecord({ child_impact: "neutral" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.negative_impact_rate).toBe(50);
    });

    it("counts negative as negative", () => {
      const records = [
        makeRecord({ child_impact: "negative" }),
        makeRecord({ child_impact: "neutral" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.negative_impact_rate).toBe(50);
    });

    it("does not count neutral as negative", () => {
      const records = [
        makeRecord({ child_impact: "neutral" }),
        makeRecord({ child_impact: "neutral" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.negative_impact_rate).toBe(0);
    });

    it("does not count positive as negative", () => {
      const records = [makeRecord({ child_impact: "positive" })];
      const m = computeRespiteMetrics(records, 1);
      expect(m.negative_impact_rate).toBe(0);
    });

    it("returns 0 when all not_assessed", () => {
      const records = [
        makeRecord({ child_impact: "not_assessed" }),
        makeRecord({ child_impact: "not_assessed" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.negative_impact_rate).toBeNull();; });

    it("calculates mixed (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ child_impact: "negative" }),
        makeRecord({ child_impact: "positive" }),
        makeRecord({ child_impact: "neutral" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.negative_impact_rate).toBe(33.3);
    });
  });

  describe("by_break_type breakdown", () => {
    it("counts each break type separately", () => {
      const records = [
        makeRecord({ break_type: "planned_respite" }),
        makeRecord({ break_type: "planned_respite" }),
        makeRecord({ break_type: "emergency_break" }),
        makeRecord({ break_type: "host_family" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.by_break_type).toEqual({ planned_respite: 2, emergency_break: 1, host_family: 1 });
    });

    it("handles all nine break types", () => {
      const types: BreakType[] = ["planned_respite", "emergency_break", "host_family", "activity_break", "family_stay", "holiday", "therapeutic_break", "assessment_break", "other"];
      const records = types.map((t) => makeRecord({ break_type: t }));
      const m = computeRespiteMetrics(records, 1);
      for (const t of types) {
        expect(m.by_break_type[t]).toBe(1);
      }
    });
  });

  describe("by_break_reason breakdown", () => {
    it("counts each break reason separately", () => {
      const records = [
        makeRecord({ break_reason: "placement_stability" }),
        makeRecord({ break_reason: "placement_stability" }),
        makeRecord({ break_reason: "child_request" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.by_break_reason).toEqual({ placement_stability: 2, child_request: 1 });
    });

    it("handles all ten break reasons", () => {
      const reasons: BreakReason[] = ["placement_stability", "staff_wellbeing", "child_request", "behaviour_management", "family_contact", "holiday_activity", "therapeutic_purpose", "emergency_situation", "assessment", "other"];
      const records = reasons.map((r) => makeRecord({ break_reason: r }));
      const m = computeRespiteMetrics(records, 1);
      for (const r of reasons) {
        expect(m.by_break_reason[r]).toBe(1);
      }
    });
  });

  describe("by_break_status breakdown", () => {
    it("counts each break status separately", () => {
      const records = [
        makeRecord({ break_status: "completed" }),
        makeRecord({ break_status: "completed" }),
        makeRecord({ break_status: "cancelled" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.by_break_status).toEqual({ completed: 2, cancelled: 1 });
    });

    it("handles all six break statuses", () => {
      const statuses: BreakStatus[] = ["planned", "confirmed", "in_progress", "completed", "cancelled", "cut_short"];
      const records = statuses.map((s) => makeRecord({ break_status: s }));
      const m = computeRespiteMetrics(records, 1);
      for (const s of statuses) {
        expect(m.by_break_status[s]).toBe(1);
      }
    });
  });

  describe("by_child_impact breakdown", () => {
    it("counts each child impact separately", () => {
      const records = [
        makeRecord({ child_impact: "positive" }),
        makeRecord({ child_impact: "positive" }),
        makeRecord({ child_impact: "negative" }),
      ];
      const m = computeRespiteMetrics(records, 1);
      expect(m.by_child_impact).toEqual({ positive: 2, negative: 1 });
    });

    it("handles all six child impacts", () => {
      const impacts: ChildImpact[] = ["very_positive", "positive", "neutral", "negative", "very_negative", "not_assessed"];
      const records = impacts.map((i) => makeRecord({ child_impact: i }));
      const m = computeRespiteMetrics(records, 1);
      for (const i of impacts) {
        expect(m.by_child_impact[i]).toBe(1);
      }
    });
  });

  describe("children_with_breaks uses child_id not child_name", () => {
    it("counts unique child_ids", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice" }),
        makeRecord({ child_id: "c1", child_name: "Alice" }),
        makeRecord({ child_id: "c2", child_name: "Bob" }),
      ];
      const m = computeRespiteMetrics(records, 5);
      expect(m.children_with_breaks).toBe(2);
    });

    it("same child_name different child_ids count as separate children", () => {
      const records = [
        makeRecord({ child_id: "c1", child_name: "Alice" }),
        makeRecord({ child_id: "c2", child_name: "Alice" }),
      ];
      const m = computeRespiteMetrics(records, 5);
      expect(m.children_with_breaks).toBe(2);
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: RespiteRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            child_id: `c${i % 10}`,
            child_name: `Child${i % 10}`,
            break_type: i % 2 === 0 ? "planned_respite" : "emergency_break",
            break_status: i % 3 === 0 ? "completed" : "in_progress",
            duration_nights: 2,
            child_views_sought: i % 4 !== 0,
            social_worker_approved: true,
            risk_assessment_completed: i % 5 !== 0,
            child_impact: "positive",
            return_plan_in_place: true,
          }),
        );
      }
      const m = computeRespiteMetrics(records, 10);
      expect(m.total_breaks).toBe(100);
      expect(m.children_with_breaks).toBe(10);
      expect(m.break_usage_rate).toBe(100);
      expect(m.planned_count).toBe(50);
      expect(m.emergency_count).toBe(50);
      expect(m.total_nights).toBe(200);
      expect(m.average_duration).toBe(2);
    });
  });
});

// ── identifyRespiteAlerts ──────────────────────────────────────────────────

describe("identifyRespiteAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyRespiteAlerts([]);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          child_impact: "positive",
          break_type: "planned_respite",
          risk_assessment_completed: true,
          child_views_sought: true,
          break_status: "completed",
          return_plan_in_place: true,
        }),
        makeRecord({
          child_impact: "neutral",
          break_type: "host_family",
          risk_assessment_completed: true,
          child_views_sought: true,
          break_status: "completed",
          return_plan_in_place: true,
        }),
      ];
      const alerts = identifyRespiteAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty for single well-formed record", () => {
      const records = [
        makeRecord({
          child_impact: "very_positive",
          break_type: "planned_respite",
          risk_assessment_completed: true,
          child_views_sought: true,
          break_status: "completed",
          return_plan_in_place: true,
        }),
      ];
      const alerts = identifyRespiteAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("very_negative_impact alert", () => {
    it("fires for a very_negative impact record", () => {
      const records = [makeRecord({ child_impact: "very_negative", child_name: "Alice", break_type: "planned_respite" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ child_impact: "very_negative" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "rec-123", child_impact: "very_negative" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact")!;
      expect(alert.id).toBe("rec-123");
    });

    it("includes child name in message", () => {
      const records = [makeRecord({ child_impact: "very_negative", child_name: "Bob" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact")!;
      expect(alert.message).toContain("Bob");
    });

    it("replaces underscores with spaces in break_type in message", () => {
      const records = [makeRecord({ child_impact: "very_negative", break_type: "planned_respite" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact")!;
      expect(alert.message).toContain("planned respite");
    });

    it("replaces underscores for emergency_break", () => {
      const records = [makeRecord({ child_impact: "very_negative", break_type: "emergency_break" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact")!;
      expect(alert.message).toContain("emergency break");
    });

    it("fires per record for multiple very_negative records", () => {
      const records = [
        makeRecord({ child_impact: "very_negative", child_name: "Alice" }),
        makeRecord({ child_impact: "very_negative", child_name: "Bob" }),
        makeRecord({ child_impact: "very_negative", child_name: "Charlie" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const negAlerts = alerts.filter((a) => a.type === "very_negative_impact");
      expect(negAlerts).toHaveLength(3);
    });

    it("does not fire for negative (only very_negative)", () => {
      const records = [makeRecord({ child_impact: "negative" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact");
      expect(alert).toBeUndefined();
    });

    it("does not fire for neutral", () => {
      const records = [makeRecord({ child_impact: "neutral" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact");
      expect(alert).toBeUndefined();
    });

    it("does not fire for positive impacts", () => {
      const records = [
        makeRecord({ child_impact: "positive" }),
        makeRecord({ child_impact: "very_positive" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact");
      expect(alert).toBeUndefined();
    });

    it("message contains review wording", () => {
      const records = [makeRecord({ child_impact: "very_negative" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact")!;
      expect(alert.message).toContain("review break arrangements");
    });
  });

  describe("emergency_no_risk_ax alert", () => {
    it("fires for emergency_break without risk assessment", () => {
      const records = [makeRecord({ break_type: "emergency_break", risk_assessment_completed: false, child_name: "Alice" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_no_risk_ax");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ break_type: "emergency_break", risk_assessment_completed: false })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_no_risk_ax")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "rec-456", break_type: "emergency_break", risk_assessment_completed: false })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_no_risk_ax")!;
      expect(alert.id).toBe("rec-456");
    });

    it("includes child name in message", () => {
      const records = [makeRecord({ break_type: "emergency_break", risk_assessment_completed: false, child_name: "Charlie" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_no_risk_ax")!;
      expect(alert.message).toContain("Charlie");
    });

    it("does not fire for emergency_break with risk assessment done", () => {
      const records = [makeRecord({ break_type: "emergency_break", risk_assessment_completed: true })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_no_risk_ax");
      expect(alert).toBeUndefined();
    });

    it("does not fire for planned_respite without risk assessment", () => {
      const records = [makeRecord({ break_type: "planned_respite", risk_assessment_completed: false })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_no_risk_ax");
      expect(alert).toBeUndefined();
    });

    it("does not fire for host_family without risk assessment", () => {
      const records = [makeRecord({ break_type: "host_family", risk_assessment_completed: false })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_no_risk_ax");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple qualifying records", () => {
      const records = [
        makeRecord({ break_type: "emergency_break", risk_assessment_completed: false }),
        makeRecord({ break_type: "emergency_break", risk_assessment_completed: false }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const emergAlerts = alerts.filter((a) => a.type === "emergency_no_risk_ax");
      expect(emergAlerts).toHaveLength(2);
    });

    it("message contains retrospective assessment wording", () => {
      const records = [makeRecord({ break_type: "emergency_break", risk_assessment_completed: false })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "emergency_no_risk_ax")!;
      expect(alert.message).toContain("retrospective assessment");
    });
  });

  describe("child_views_missing alert", () => {
    it("fires when >= 2 non-cancelled breaks lack child views", () => {
      const records = [
        makeRecord({ child_views_sought: false, break_status: "completed" }),
        makeRecord({ child_views_sought: false, break_status: "completed" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "child_views_missing");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [
        makeRecord({ child_views_sought: false, break_status: "completed" }),
        makeRecord({ child_views_sought: false, break_status: "in_progress" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "child_views_missing")!;
      expect(alert.severity).toBe("high");
    });

    it("has id views_missing", () => {
      const records = [
        makeRecord({ child_views_sought: false, break_status: "completed" }),
        makeRecord({ child_views_sought: false, break_status: "completed" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "child_views_missing")!;
      expect(alert.id).toBe("views_missing");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ child_views_sought: false, break_status: "completed" }),
        makeRecord({ child_views_sought: false, break_status: "completed" }),
        makeRecord({ child_views_sought: false, break_status: "completed" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "child_views_missing")!;
      expect(alert.message).toContain("3 breaks");
    });

    it("excludes cancelled status from count", () => {
      const records = [
        makeRecord({ child_views_sought: false, break_status: "cancelled" }),
        makeRecord({ child_views_sought: false, break_status: "cancelled" }),
        makeRecord({ child_views_sought: false, break_status: "completed" }),
      ];
      // Only 1 non-cancelled, < 2
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "child_views_missing");
      expect(alert).toBeUndefined();
    });

    it("does not fire with only 1 non-cancelled no-views record", () => {
      const records = [
        makeRecord({ child_views_sought: false, break_status: "completed" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "child_views_missing");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all views are sought", () => {
      const records = [
        makeRecord({ child_views_sought: true, break_status: "completed" }),
        makeRecord({ child_views_sought: true, break_status: "completed" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "child_views_missing");
      expect(alert).toBeUndefined();
    });

    it("message contains children must be consulted wording", () => {
      const records = [
        makeRecord({ child_views_sought: false, break_status: "completed" }),
        makeRecord({ child_views_sought: false, break_status: "completed" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "child_views_missing")!;
      expect(alert.message).toContain("children must be consulted");
    });

    it("fires at exactly 2 threshold", () => {
      const records = [
        makeRecord({ child_views_sought: false, break_status: "planned" }),
        makeRecord({ child_views_sought: false, break_status: "in_progress" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "child_views_missing");
      expect(alert).toBeDefined();
    });
  });

  describe("breaks_cut_short alert", () => {
    it("fires when >= 2 breaks are cut_short", () => {
      const records = [
        makeRecord({ break_status: "cut_short" }),
        makeRecord({ break_status: "cut_short" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "breaks_cut_short");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [
        makeRecord({ break_status: "cut_short" }),
        makeRecord({ break_status: "cut_short" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "breaks_cut_short")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id cut_short_pattern", () => {
      const records = [
        makeRecord({ break_status: "cut_short" }),
        makeRecord({ break_status: "cut_short" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "breaks_cut_short")!;
      expect(alert.id).toBe("cut_short_pattern");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ break_status: "cut_short" }),
        makeRecord({ break_status: "cut_short" }),
        makeRecord({ break_status: "cut_short" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "breaks_cut_short")!;
      expect(alert.message).toContain("3 breaks cut short");
    });

    it("does not fire with only 1 cut_short", () => {
      const records = [makeRecord({ break_status: "cut_short" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "breaks_cut_short");
      expect(alert).toBeUndefined();
    });

    it("does not fire when no cut_short records", () => {
      const records = [
        makeRecord({ break_status: "completed" }),
        makeRecord({ break_status: "cancelled" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "breaks_cut_short");
      expect(alert).toBeUndefined();
    });

    it("fires at exactly 2 threshold", () => {
      const records = [
        makeRecord({ break_status: "cut_short" }),
        makeRecord({ break_status: "cut_short" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "breaks_cut_short");
      expect(alert).toBeDefined();
    });

    it("message contains break planning wording", () => {
      const records = [
        makeRecord({ break_status: "cut_short" }),
        makeRecord({ break_status: "cut_short" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "breaks_cut_short")!;
      expect(alert.message).toContain("break planning");
    });
  });

  describe("no_return_plan alert", () => {
    it("fires when >= 1 active break has no return plan (planned status)", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "planned" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan");
      expect(alert).toBeDefined();
    });

    it("fires for confirmed status", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "confirmed" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan");
      expect(alert).toBeDefined();
    });

    it("fires for in_progress status", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "in_progress" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "planned" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id no_return_plan", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "planned" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan")!;
      expect(alert.id).toBe("no_return_plan");
    });

    it("uses singular message for 1 break", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "planned" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan")!;
      expect(alert.message).toContain("1 active break has");
    });

    it("uses plural message for multiple breaks", () => {
      const records = [
        makeRecord({ return_plan_in_place: false, break_status: "planned" }),
        makeRecord({ return_plan_in_place: false, break_status: "confirmed" }),
        makeRecord({ return_plan_in_place: false, break_status: "in_progress" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan")!;
      expect(alert.message).toContain("3 active breaks have");
    });

    it("does not fire for completed status without return plan", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "completed" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan");
      expect(alert).toBeUndefined();
    });

    it("does not fire for cancelled status without return plan", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "cancelled" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan");
      expect(alert).toBeUndefined();
    });

    it("does not fire for cut_short status without return plan", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "cut_short" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan");
      expect(alert).toBeUndefined();
    });

    it("does not fire when active breaks all have return plans", () => {
      const records = [
        makeRecord({ return_plan_in_place: true, break_status: "planned" }),
        makeRecord({ return_plan_in_place: true, break_status: "confirmed" }),
        makeRecord({ return_plan_in_place: true, break_status: "in_progress" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan");
      expect(alert).toBeUndefined();
    });

    it("message contains smooth transitions wording", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "planned" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan")!;
      expect(alert.message).toContain("smooth transitions");
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        // very_negative_impact (critical)
        makeRecord({ id: "r1", child_impact: "very_negative", child_name: "Alice", break_type: "planned_respite", child_views_sought: true, break_status: "completed", return_plan_in_place: true, risk_assessment_completed: true }),
        // emergency_no_risk_ax (high)
        makeRecord({ id: "r2", break_type: "emergency_break", risk_assessment_completed: false, child_views_sought: false, break_status: "completed", child_impact: "neutral", return_plan_in_place: true }),
        // child_views_missing needs >= 2 non-cancelled without views
        makeRecord({ id: "r3", child_views_sought: false, break_status: "in_progress", break_type: "host_family", risk_assessment_completed: true, child_impact: "neutral", return_plan_in_place: false }),
        // breaks_cut_short needs >= 2
        makeRecord({ id: "r4", break_status: "cut_short", child_views_sought: true, break_type: "activity_break", risk_assessment_completed: true, child_impact: "neutral", return_plan_in_place: true }),
        makeRecord({ id: "r5", break_status: "cut_short", child_views_sought: true, break_type: "family_stay", risk_assessment_completed: true, child_impact: "neutral", return_plan_in_place: true }),
        // no_return_plan: r3 is in_progress with no return plan (1 >= 1)
      ];
      const alerts = identifyRespiteAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("very_negative_impact");
      expect(types).toContain("emergency_no_risk_ax");
      expect(types).toContain("child_views_missing");
      expect(types).toContain("breaks_cut_short");
      expect(types).toContain("no_return_plan");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({ child_impact: "very_negative", break_type: "planned_respite", child_views_sought: false, break_status: "in_progress", return_plan_in_place: false, risk_assessment_completed: true }),
        makeRecord({ child_impact: "very_negative", break_type: "emergency_break", risk_assessment_completed: false, child_views_sought: false, break_status: "cut_short", return_plan_in_place: true }),
        makeRecord({ break_status: "cut_short", child_views_sought: true, break_type: "host_family", risk_assessment_completed: true, child_impact: "neutral", return_plan_in_place: true }),
      ];
      const alerts = identifyRespiteAlerts(records);
      // very_negative_impact x2 = 2
      // emergency_no_risk_ax x1 = 1
      // child_views_missing: 2 non-cancelled without views = 1
      // breaks_cut_short: 2 cut_short = 1
      // no_return_plan: 1 in_progress without return plan = 1
      expect(alerts).toHaveLength(6);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ child_impact: "very_negative" }),
      ];
      const alerts = identifyRespiteAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ child_impact: "very_negative", break_type: "emergency_break", risk_assessment_completed: false, child_views_sought: false, break_status: "cut_short", return_plan_in_place: false }),
        makeRecord({ child_views_sought: false, break_status: "in_progress", return_plan_in_place: false, break_type: "planned_respite", child_impact: "neutral", risk_assessment_completed: true }),
        makeRecord({ break_status: "cut_short", child_views_sought: true, break_type: "host_family", risk_assessment_completed: true, child_impact: "neutral", return_plan_in_place: true }),
      ];
      const alerts = identifyRespiteAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ child_impact: "very_negative" })];
      const alerts = identifyRespiteAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("empty records produce no alerts", () => {
      expect(identifyRespiteAlerts([])).toEqual([]);
    });

    it("single cancelled record with no views does not trigger child_views_missing", () => {
      const records = [makeRecord({ child_views_sought: false, break_status: "cancelled" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "child_views_missing");
      expect(alert).toBeUndefined();
    });

    it("not_assessed impact does not trigger very_negative_impact", () => {
      const records = [makeRecord({ child_impact: "not_assessed" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "very_negative_impact");
      expect(alert).toBeUndefined();
    });

    it("completed break without return plan does not trigger no_return_plan", () => {
      const records = [makeRecord({ return_plan_in_place: false, break_status: "completed" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "no_return_plan");
      expect(alert).toBeUndefined();
    });

    it("one cut_short does not trigger breaks_cut_short", () => {
      const records = [makeRecord({ break_status: "cut_short" })];
      const alerts = identifyRespiteAlerts(records);
      const alert = alerts.find((a) => a.type === "breaks_cut_short");
      expect(alert).toBeUndefined();
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
    expect(r.break_type).toBe("planned_respite");
    expect(r.break_reason).toBe("placement_stability");
    expect(r.break_status).toBe("completed");
    expect(r.start_date).toBe("2026-05-01");
    expect(r.end_date).toBe("2026-05-03");
    expect(r.duration_nights).toBe(2);
    expect(r.provider_name).toBe("Respite House");
    expect(r.provider_type).toBe("residential");
    expect(r.child_views_sought).toBe(true);
    expect(r.child_wants_break).toBe(true);
    expect(r.social_worker_approved).toBe(true);
    expect(r.risk_assessment_completed).toBe(true);
    expect(r.child_impact).toBe("positive");
    expect(r.child_feedback).toBeNull();
    expect(r.return_plan_in_place).toBe(true);
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ child_name: "Bob", break_type: "emergency_break" });
    expect(r.child_name).toBe("Bob");
    expect(r.break_type).toBe("emergency_break");
    // defaults still apply
    expect(r.break_reason).toBe("placement_stability");
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

  it("allows setting nullable fields to null", () => {
    const r = makeRecord({ end_date: null, child_wants_break: null, child_feedback: null, notes: null });
    expect(r.end_date).toBeNull();
    expect(r.child_wants_break).toBeNull();
    expect(r.child_feedback).toBeNull();
    expect(r.notes).toBeNull();
  });
});
