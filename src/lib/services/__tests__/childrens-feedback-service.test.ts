// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S FEEDBACK SERVICE TESTS
// Pure-function unit tests for feedback metrics computation, alert
// identification, constant validation. CHR 2015 Reg 7 (quality of care —
// responsive to views), Reg 10 (children's views — consultation and feedback),
// Reg 45 (review of quality — child-informed improvement).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  FEEDBACK_TYPES,
  SATISFACTION_RATINGS,
  RESPONSE_STATUSES,
  FEEDBACK_CATEGORIES,
} from "../childrens-feedback-service";

import type { ChildrensFeedbackRecord } from "../childrens-feedback-service";

const { computeFeedbackMetrics, identifyFeedbackAlerts } = _testing;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<ChildrensFeedbackRecord>,
): ChildrensFeedbackRecord {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    feedback_type: overrides?.feedback_type ?? "satisfaction_survey",
    feedback_date: overrides?.feedback_date ?? "2025-06-01",
    satisfaction_rating: overrides?.satisfaction_rating ?? "happy",
    response_status: overrides?.response_status ?? "completed",
    feedback_category: overrides?.feedback_category ?? "general",
    child_name: overrides?.child_name ?? "Child A",
    child_id:
      "child_id" in (overrides ?? {})
        ? (overrides!.child_id ?? null)
        : null,
    child_chose_method: overrides?.child_chose_method ?? true,
    child_comfortable_sharing: overrides?.child_comfortable_sharing ?? true,
    anonymous_option_offered: overrides?.anonymous_option_offered ?? true,
    feedback_discussed_with_child:
      overrides?.feedback_discussed_with_child ?? true,
    changes_implemented: overrides?.changes_implemented ?? false,
    child_informed_of_outcome: overrides?.child_informed_of_outcome ?? false,
    child_satisfied_with_response:
      overrides?.child_satisfied_with_response ?? false,
    staff_responsive: overrides?.staff_responsive ?? true,
    themes_identified: overrides?.themes_identified ?? [],
    improvements_suggested: overrides?.improvements_suggested ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    issues_found: overrides?.issues_found ?? [],
    collected_by: overrides?.collected_by ?? "Staff A",
    response_date:
      "response_date" in (overrides ?? {})
        ? (overrides!.response_date ?? null)
        : null,
    notes:
      "notes" in (overrides ?? {})
        ? (overrides!.notes ?? null)
        : null,
    created_at: overrides?.created_at ?? "2025-06-01T10:00:00.000Z",
    updated_at: overrides?.updated_at ?? "2025-06-01T10:00:00.000Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── FEEDBACK_TYPES ───────────────────────────────────────────────────────

  describe("FEEDBACK_TYPES", () => {
    it("contains exactly 10 items", () => {
      expect(FEEDBACK_TYPES).toHaveLength(10);
    });

    it("has unique type values", () => {
      const values = FEEDBACK_TYPES.map((f) => f.type);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const entry of FEEDBACK_TYPES) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      "satisfaction_survey",
      "feedback_session",
      "suggestion_box",
      "exit_interview",
      "house_meeting_feedback",
      "complaints_feedback",
      "activity_feedback",
      "food_feedback",
      "environment_feedback",
      "other",
    ] as const)("includes type %s", (type) => {
      expect(FEEDBACK_TYPES.find((f) => f.type === type)).toBeDefined();
    });

    it("maps satisfaction_survey to 'Satisfaction Survey'", () => {
      const found = FEEDBACK_TYPES.find(
        (f) => f.type === "satisfaction_survey",
      );
      expect(found?.label).toBe("Satisfaction Survey");
    });

    it("maps house_meeting_feedback to 'House Meeting Feedback'", () => {
      const found = FEEDBACK_TYPES.find(
        (f) => f.type === "house_meeting_feedback",
      );
      expect(found?.label).toBe("House Meeting Feedback");
    });

    it("maps environment_feedback to 'Environment Feedback'", () => {
      const found = FEEDBACK_TYPES.find(
        (f) => f.type === "environment_feedback",
      );
      expect(found?.label).toBe("Environment Feedback");
    });
  });

  // ── SATISFACTION_RATINGS ─────────────────────────────────────────────────

  describe("SATISFACTION_RATINGS", () => {
    it("contains exactly 5 items", () => {
      expect(SATISFACTION_RATINGS).toHaveLength(5);
    });

    it("has unique rating values", () => {
      const values = SATISFACTION_RATINGS.map((r) => r.rating);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const entry of SATISFACTION_RATINGS) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      "very_happy",
      "happy",
      "neutral",
      "unhappy",
      "very_unhappy",
    ] as const)("includes rating %s", (rating) => {
      expect(
        SATISFACTION_RATINGS.find((r) => r.rating === rating),
      ).toBeDefined();
    });

    it("maps very_happy to 'Very Happy'", () => {
      const found = SATISFACTION_RATINGS.find(
        (r) => r.rating === "very_happy",
      );
      expect(found?.label).toBe("Very Happy");
    });

    it("maps very_unhappy to 'Very Unhappy'", () => {
      const found = SATISFACTION_RATINGS.find(
        (r) => r.rating === "very_unhappy",
      );
      expect(found?.label).toBe("Very Unhappy");
    });
  });

  // ── RESPONSE_STATUSES ────────────────────────────────────────────────────

  describe("RESPONSE_STATUSES", () => {
    it("contains exactly 5 items", () => {
      expect(RESPONSE_STATUSES).toHaveLength(5);
    });

    it("has unique status values", () => {
      const values = RESPONSE_STATUSES.map((s) => s.status);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const entry of RESPONSE_STATUSES) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      "pending",
      "acknowledged",
      "in_progress",
      "completed",
      "not_actioned",
    ] as const)("includes status %s", (status) => {
      expect(
        RESPONSE_STATUSES.find((s) => s.status === status),
      ).toBeDefined();
    });

    it("maps in_progress to 'In Progress'", () => {
      const found = RESPONSE_STATUSES.find(
        (s) => s.status === "in_progress",
      );
      expect(found?.label).toBe("In Progress");
    });

    it("maps not_actioned to 'Not Actioned'", () => {
      const found = RESPONSE_STATUSES.find(
        (s) => s.status === "not_actioned",
      );
      expect(found?.label).toBe("Not Actioned");
    });
  });

  // ── FEEDBACK_CATEGORIES ──────────────────────────────────────────────────

  describe("FEEDBACK_CATEGORIES", () => {
    it("contains exactly 10 items", () => {
      expect(FEEDBACK_CATEGORIES).toHaveLength(10);
    });

    it("has unique category values", () => {
      const values = FEEDBACK_CATEGORIES.map((c) => c.category);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const entry of FEEDBACK_CATEGORIES) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      "care_quality",
      "food_mealtimes",
      "activities",
      "bedroom_space",
      "staff_relationships",
      "safety_feeling",
      "education_support",
      "contact_family",
      "rules_boundaries",
      "general",
    ] as const)("includes category %s", (cat) => {
      expect(
        FEEDBACK_CATEGORIES.find((c) => c.category === cat),
      ).toBeDefined();
    });

    it("maps food_mealtimes to 'Food & Mealtimes'", () => {
      const found = FEEDBACK_CATEGORIES.find(
        (c) => c.category === "food_mealtimes",
      );
      expect(found?.label).toBe("Food & Mealtimes");
    });

    it("maps bedroom_space to 'Bedroom & Space'", () => {
      const found = FEEDBACK_CATEGORIES.find(
        (c) => c.category === "bedroom_space",
      );
      expect(found?.label).toBe("Bedroom & Space");
    });

    it("maps safety_feeling to 'Feeling Safe'", () => {
      const found = FEEDBACK_CATEGORIES.find(
        (c) => c.category === "safety_feeling",
      );
      expect(found?.label).toBe("Feeling Safe");
    });

    it("maps contact_family to 'Contact with Family'", () => {
      const found = FEEDBACK_CATEGORIES.find(
        (c) => c.category === "contact_family",
      );
      expect(found?.label).toBe("Contact with Family");
    });

    it("maps rules_boundaries to 'Rules & Boundaries'", () => {
      const found = FEEDBACK_CATEGORIES.find(
        (c) => c.category === "rules_boundaries",
      );
      expect(found?.label).toBe("Rules & Boundaries");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeFeedbackMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeFeedbackMetrics", () => {
  // ── Empty array ────────────────────────────────────────────────────────

  it("returns all zeros for an empty array", () => {
    const m = computeFeedbackMetrics([]);
    expect(m.total_feedback).toBe(0);
    expect(m.survey_count).toBe(0);
    expect(m.session_count).toBe(0);
    expect(m.suggestion_count).toBe(0);
    expect(m.positive_rate).toBeNull();;
    expect(m.negative_rate).toBeNull();;
    expect(m.neutral_count).toBe(0);
    expect(m.completed_rate).toBeNull();;
    expect(m.pending_count).toBe(0);
    expect(m.not_actioned_count).toBe(0);
    expect(m.child_chose_method_rate).toBeNull();;
    expect(m.child_comfortable_rate).toBeNull();;
    expect(m.anonymous_offered_rate).toBeNull();;
    expect(m.feedback_discussed_rate).toBeNull();;
    expect(m.changes_implemented_rate).toBeNull();;
    expect(m.child_informed_rate).toBeNull();;
    expect(m.child_satisfied_rate).toBeNull();;
    expect(m.staff_responsive_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("returns empty breakdown maps for empty array", () => {
    const m = computeFeedbackMetrics([]);
    expect(m.by_feedback_type).toEqual({});
    expect(m.by_satisfaction_rating).toEqual({});
    expect(m.by_response_status).toEqual({});
    expect(m.by_feedback_category).toEqual({});
  });

  // ── total_feedback ─────────────────────────────────────────────────────

  it("counts a single record", () => {
    const m = computeFeedbackMetrics([makeRecord()]);
    expect(m.total_feedback).toBe(1);
  });

  it("counts multiple records", () => {
    const m = computeFeedbackMetrics([
      makeRecord(),
      makeRecord(),
      makeRecord(),
    ]);
    expect(m.total_feedback).toBe(3);
  });

  // ── survey_count ───────────────────────────────────────────────────────

  it("counts satisfaction_survey records", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_type: "satisfaction_survey" }),
      makeRecord({ feedback_type: "satisfaction_survey" }),
      makeRecord({ feedback_type: "feedback_session" }),
    ]);
    expect(m.survey_count).toBe(2);
  });

  it("returns 0 surveys when none present", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_type: "suggestion_box" }),
    ]);
    expect(m.survey_count).toBe(0);
  });

  // ── session_count ──────────────────────────────────────────────────────

  it("counts feedback_session records", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_type: "feedback_session" }),
      makeRecord({ feedback_type: "feedback_session" }),
      makeRecord({ feedback_type: "satisfaction_survey" }),
    ]);
    expect(m.session_count).toBe(2);
  });

  it("returns 0 sessions when none present", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_type: "suggestion_box" }),
    ]);
    expect(m.session_count).toBe(0);
  });

  // ── suggestion_count ───────────────────────────────────────────────────

  it("counts suggestion_box records", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_type: "suggestion_box" }),
      makeRecord({ feedback_type: "suggestion_box" }),
      makeRecord({ feedback_type: "suggestion_box" }),
    ]);
    expect(m.suggestion_count).toBe(3);
  });

  it("returns 0 suggestions when none present", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_type: "feedback_session" }),
    ]);
    expect(m.suggestion_count).toBe(0);
  });

  // ── positive_rate ──────────────────────────────────────────────────────

  it("returns 100% when all records are happy", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "happy" }),
      makeRecord({ satisfaction_rating: "happy" }),
    ]);
    expect(m.positive_rate).toBe(100);
  });

  it("returns 100% when all records are very_happy", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "very_happy" }),
    ]);
    expect(m.positive_rate).toBe(100);
  });

  it("counts both very_happy and happy as positive", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "very_happy" }),
      makeRecord({ satisfaction_rating: "happy" }),
      makeRecord({ satisfaction_rating: "neutral" }),
    ]);
    // 2/3 = 66.7%
    expect(m.positive_rate).toBe(66.7);
  });

  it("returns 0 positive_rate when no positive ratings", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "neutral" }),
      makeRecord({ satisfaction_rating: "unhappy" }),
    ]);
    expect(m.positive_rate).toBe(0);
  });

  it("uses Math.round(v*1000)/10 rounding for positive_rate", () => {
    // 1/3 => 0.33333... => 33.3
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "happy" }),
      makeRecord({ satisfaction_rating: "neutral" }),
      makeRecord({ satisfaction_rating: "unhappy" }),
    ]);
    expect(m.positive_rate).toBe(33.3);
  });

  // ── negative_rate ──────────────────────────────────────────────────────

  it("returns 100% when all records are unhappy", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "unhappy" }),
    ]);
    expect(m.negative_rate).toBe(100);
  });

  it("returns 100% when all records are very_unhappy", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "very_unhappy" }),
    ]);
    expect(m.negative_rate).toBe(100);
  });

  it("counts both unhappy and very_unhappy as negative", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "unhappy" }),
      makeRecord({ satisfaction_rating: "very_unhappy" }),
      makeRecord({ satisfaction_rating: "happy" }),
    ]);
    // 2/3 = 66.7%
    expect(m.negative_rate).toBe(66.7);
  });

  it("returns 0 negative_rate when no negative ratings", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "happy" }),
      makeRecord({ satisfaction_rating: "neutral" }),
    ]);
    expect(m.negative_rate).toBe(0);
  });

  it("uses Math.round(v*1000)/10 rounding for negative_rate", () => {
    // 1/3 => 33.3
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "unhappy" }),
      makeRecord({ satisfaction_rating: "happy" }),
      makeRecord({ satisfaction_rating: "happy" }),
    ]);
    expect(m.negative_rate).toBe(33.3);
  });

  // ── neutral_count ──────────────────────────────────────────────────────

  it("counts neutral ratings", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "neutral" }),
      makeRecord({ satisfaction_rating: "neutral" }),
      makeRecord({ satisfaction_rating: "happy" }),
    ]);
    expect(m.neutral_count).toBe(2);
  });

  it("returns 0 neutral when none present", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "happy" }),
    ]);
    expect(m.neutral_count).toBe(0);
  });

  // ── completed_rate ─────────────────────────────────────────────────────

  it("returns 100% when all completed", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ response_status: "completed" }),
      makeRecord({ response_status: "completed" }),
    ]);
    expect(m.completed_rate).toBe(100);
  });

  it("returns 0 when none completed", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ response_status: "pending" }),
    ]);
    expect(m.completed_rate).toBe(0);
  });

  it("computes completed_rate with rounding", () => {
    // 1/3 = 33.3%
    const m = computeFeedbackMetrics([
      makeRecord({ response_status: "completed" }),
      makeRecord({ response_status: "pending" }),
      makeRecord({ response_status: "in_progress" }),
    ]);
    expect(m.completed_rate).toBe(33.3);
  });

  // ── pending_count ──────────────────────────────────────────────────────

  it("counts pending responses", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ response_status: "pending" }),
      makeRecord({ response_status: "pending" }),
      makeRecord({ response_status: "completed" }),
    ]);
    expect(m.pending_count).toBe(2);
  });

  it("returns 0 pending when none present", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ response_status: "completed" }),
    ]);
    expect(m.pending_count).toBe(0);
  });

  // ── not_actioned_count ─────────────────────────────────────────────────

  it("counts not_actioned responses", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ response_status: "not_actioned" }),
      makeRecord({ response_status: "not_actioned" }),
      makeRecord({ response_status: "completed" }),
    ]);
    expect(m.not_actioned_count).toBe(2);
  });

  it("returns 0 not_actioned when none present", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ response_status: "completed" }),
    ]);
    expect(m.not_actioned_count).toBe(0);
  });

  // ── child_chose_method_rate ────────────────────────────────────────────

  it("returns 100% when all chose method", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_chose_method: true }),
      makeRecord({ child_chose_method: true }),
    ]);
    expect(m.child_chose_method_rate).toBe(100);
  });

  it("returns 0 when none chose method", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_chose_method: false }),
    ]);
    expect(m.child_chose_method_rate).toBe(0);
  });

  it("computes partial child_chose_method_rate", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_chose_method: true }),
      makeRecord({ child_chose_method: false }),
      makeRecord({ child_chose_method: false }),
    ]);
    // 1/3 = 33.3%
    expect(m.child_chose_method_rate).toBe(33.3);
  });

  // ── child_comfortable_rate ─────────────────────────────────────────────

  it("returns 100% when all comfortable", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_comfortable_sharing: true }),
    ]);
    expect(m.child_comfortable_rate).toBe(100);
  });

  it("returns 0 when none comfortable", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_comfortable_sharing: false }),
    ]);
    expect(m.child_comfortable_rate).toBe(0);
  });

  it("computes partial child_comfortable_rate", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_comfortable_sharing: true }),
      makeRecord({ child_comfortable_sharing: true }),
      makeRecord({ child_comfortable_sharing: false }),
    ]);
    // 2/3 = 66.7%
    expect(m.child_comfortable_rate).toBe(66.7);
  });

  // ── anonymous_offered_rate ─────────────────────────────────────────────

  it("returns 100% when all offered anonymity", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ anonymous_option_offered: true }),
    ]);
    expect(m.anonymous_offered_rate).toBe(100);
  });

  it("returns 0 when none offered anonymity", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ anonymous_option_offered: false }),
    ]);
    expect(m.anonymous_offered_rate).toBe(0);
  });

  it("computes partial anonymous_offered_rate", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ anonymous_option_offered: true }),
      makeRecord({ anonymous_option_offered: false }),
    ]);
    expect(m.anonymous_offered_rate).toBe(50);
  });

  // ── feedback_discussed_rate ────────────────────────────────────────────

  it("returns 100% when all discussed", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_discussed_with_child: true }),
    ]);
    expect(m.feedback_discussed_rate).toBe(100);
  });

  it("returns 0 when none discussed", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_discussed_with_child: false }),
    ]);
    expect(m.feedback_discussed_rate).toBe(0);
  });

  it("computes partial feedback_discussed_rate", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_discussed_with_child: true }),
      makeRecord({ feedback_discussed_with_child: true }),
      makeRecord({ feedback_discussed_with_child: false }),
    ]);
    expect(m.feedback_discussed_rate).toBe(66.7);
  });

  // ── changes_implemented_rate ───────────────────────────────────────────

  it("returns 100% when all changes implemented", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ changes_implemented: true }),
      makeRecord({ changes_implemented: true }),
    ]);
    expect(m.changes_implemented_rate).toBe(100);
  });

  it("returns 0 when no changes implemented (default)", () => {
    const m = computeFeedbackMetrics([makeRecord()]);
    expect(m.changes_implemented_rate).toBe(0);
  });

  it("computes partial changes_implemented_rate", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ changes_implemented: true }),
      makeRecord({ changes_implemented: false }),
    ]);
    expect(m.changes_implemented_rate).toBe(50);
  });

  // ── child_informed_rate ────────────────────────────────────────────────

  it("returns 100% when all informed", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_informed_of_outcome: true }),
      makeRecord({ child_informed_of_outcome: true }),
    ]);
    expect(m.child_informed_rate).toBe(100);
  });

  it("returns 0 when none informed (default)", () => {
    const m = computeFeedbackMetrics([makeRecord()]);
    expect(m.child_informed_rate).toBe(0);
  });

  it("computes partial child_informed_rate", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_informed_of_outcome: true }),
      makeRecord({ child_informed_of_outcome: false }),
      makeRecord({ child_informed_of_outcome: false }),
    ]);
    expect(m.child_informed_rate).toBe(33.3);
  });

  // ── child_satisfied_rate ───────────────────────────────────────────────

  it("returns 100% when all satisfied", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_satisfied_with_response: true }),
    ]);
    expect(m.child_satisfied_rate).toBe(100);
  });

  it("returns 0 when none satisfied (default)", () => {
    const m = computeFeedbackMetrics([makeRecord()]);
    expect(m.child_satisfied_rate).toBe(0);
  });

  it("computes partial child_satisfied_rate", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_satisfied_with_response: true }),
      makeRecord({ child_satisfied_with_response: false }),
    ]);
    expect(m.child_satisfied_rate).toBe(50);
  });

  // ── staff_responsive_rate ──────────────────────────────────────────────

  it("returns 100% when all staff responsive (default)", () => {
    const m = computeFeedbackMetrics([makeRecord()]);
    expect(m.staff_responsive_rate).toBe(100);
  });

  it("returns 0 when no staff responsive", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ staff_responsive: false }),
    ]);
    expect(m.staff_responsive_rate).toBe(0);
  });

  it("computes partial staff_responsive_rate", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ staff_responsive: true }),
      makeRecord({ staff_responsive: true }),
      makeRecord({ staff_responsive: false }),
    ]);
    expect(m.staff_responsive_rate).toBe(66.7);
  });

  // ── unique_children ────────────────────────────────────────────────────

  it("counts 1 unique child for single record", () => {
    const m = computeFeedbackMetrics([makeRecord({ child_name: "Alice" })]);
    expect(m.unique_children).toBe(1);
  });

  it("deduplicates same child_name", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Alice" }),
    ]);
    expect(m.unique_children).toBe(1);
  });

  it("counts distinct child names", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Bob" }),
      makeRecord({ child_name: "Charlie" }),
    ]);
    expect(m.unique_children).toBe(3);
  });

  it("returns 0 unique children for empty array", () => {
    const m = computeFeedbackMetrics([]);
    expect(m.unique_children).toBe(0);
  });

  it("treats different spellings as different children", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "alice" }),
    ]);
    expect(m.unique_children).toBe(2);
  });

  // ── by_feedback_type ───────────────────────────────────────────────────

  it("groups by feedback_type", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_type: "satisfaction_survey" }),
      makeRecord({ feedback_type: "satisfaction_survey" }),
      makeRecord({ feedback_type: "feedback_session" }),
      makeRecord({ feedback_type: "suggestion_box" }),
    ]);
    expect(m.by_feedback_type).toEqual({
      satisfaction_survey: 2,
      feedback_session: 1,
      suggestion_box: 1,
    });
  });

  it("returns empty object for no records", () => {
    const m = computeFeedbackMetrics([]);
    expect(m.by_feedback_type).toEqual({});
  });

  it("handles single feedback type", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_type: "exit_interview" }),
    ]);
    expect(m.by_feedback_type).toEqual({ exit_interview: 1 });
  });

  // ── by_satisfaction_rating ─────────────────────────────────────────────

  it("groups by satisfaction_rating", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "very_happy" }),
      makeRecord({ satisfaction_rating: "happy" }),
      makeRecord({ satisfaction_rating: "happy" }),
      makeRecord({ satisfaction_rating: "neutral" }),
      makeRecord({ satisfaction_rating: "unhappy" }),
    ]);
    expect(m.by_satisfaction_rating).toEqual({
      very_happy: 1,
      happy: 2,
      neutral: 1,
      unhappy: 1,
    });
  });

  it("omits ratings not present", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "happy" }),
    ]);
    expect(m.by_satisfaction_rating).toEqual({ happy: 1 });
    expect(m.by_satisfaction_rating.very_unhappy).toBeUndefined();
  });

  // ── by_response_status ─────────────────────────────────────────────────

  it("groups by response_status", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ response_status: "completed" }),
      makeRecord({ response_status: "completed" }),
      makeRecord({ response_status: "pending" }),
      makeRecord({ response_status: "not_actioned" }),
    ]);
    expect(m.by_response_status).toEqual({
      completed: 2,
      pending: 1,
      not_actioned: 1,
    });
  });

  it("omits statuses not present", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ response_status: "in_progress" }),
    ]);
    expect(m.by_response_status).toEqual({ in_progress: 1 });
    expect(m.by_response_status.pending).toBeUndefined();
  });

  // ── by_feedback_category ───────────────────────────────────────────────

  it("groups by feedback_category", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_category: "care_quality" }),
      makeRecord({ feedback_category: "care_quality" }),
      makeRecord({ feedback_category: "food_mealtimes" }),
      makeRecord({ feedback_category: "activities" }),
    ]);
    expect(m.by_feedback_category).toEqual({
      care_quality: 2,
      food_mealtimes: 1,
      activities: 1,
    });
  });

  it("omits categories not present", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_category: "general" }),
    ]);
    expect(m.by_feedback_category).toEqual({ general: 1 });
    expect(m.by_feedback_category.activities).toBeUndefined();
  });

  // ── Rounding edge cases ────────────────────────────────────────────────

  it("returns 50 for 1 of 2 positive", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "happy" }),
      makeRecord({ satisfaction_rating: "neutral" }),
    ]);
    expect(m.positive_rate).toBe(50);
  });

  it("returns 25 for 1 of 4 positive", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ satisfaction_rating: "happy" }),
      makeRecord({ satisfaction_rating: "neutral" }),
      makeRecord({ satisfaction_rating: "neutral" }),
      makeRecord({ satisfaction_rating: "neutral" }),
    ]);
    expect(m.positive_rate).toBe(25);
  });

  it("returns 16.7 for 1 of 6 positive", () => {
    const recs = [
      makeRecord({ satisfaction_rating: "very_happy" }),
      ...Array.from({ length: 5 }, () =>
        makeRecord({ satisfaction_rating: "neutral" }),
      ),
    ];
    const m = computeFeedbackMetrics(recs);
    // 1/6 = 0.16666 => Math.round(166.66) = 167 => 16.7
    expect(m.positive_rate).toBe(16.7);
  });

  // ── Mixed scenario ────────────────────────────────────────────────────

  it("correctly computes all fields for a mixed dataset", () => {
    const records = [
      makeRecord({
        child_name: "Alice",
        feedback_type: "satisfaction_survey",
        satisfaction_rating: "very_happy",
        response_status: "completed",
        feedback_category: "care_quality",
        child_chose_method: true,
        child_comfortable_sharing: true,
        anonymous_option_offered: true,
        feedback_discussed_with_child: true,
        changes_implemented: true,
        child_informed_of_outcome: true,
        child_satisfied_with_response: true,
        staff_responsive: true,
      }),
      makeRecord({
        child_name: "Bob",
        feedback_type: "feedback_session",
        satisfaction_rating: "neutral",
        response_status: "pending",
        feedback_category: "food_mealtimes",
        child_chose_method: false,
        child_comfortable_sharing: false,
        anonymous_option_offered: false,
        feedback_discussed_with_child: false,
        changes_implemented: false,
        child_informed_of_outcome: false,
        child_satisfied_with_response: false,
        staff_responsive: false,
      }),
    ];
    const m = computeFeedbackMetrics(records);

    expect(m.total_feedback).toBe(2);
    expect(m.survey_count).toBe(1);
    expect(m.session_count).toBe(1);
    expect(m.suggestion_count).toBe(0);
    expect(m.positive_rate).toBe(50);
    expect(m.negative_rate).toBe(0);
    expect(m.neutral_count).toBe(1);
    expect(m.completed_rate).toBe(50);
    expect(m.pending_count).toBe(1);
    expect(m.not_actioned_count).toBe(0);
    expect(m.child_chose_method_rate).toBe(50);
    expect(m.child_comfortable_rate).toBe(50);
    expect(m.anonymous_offered_rate).toBe(50);
    expect(m.feedback_discussed_rate).toBe(50);
    expect(m.changes_implemented_rate).toBe(50);
    expect(m.child_informed_rate).toBe(50);
    expect(m.child_satisfied_rate).toBe(50);
    expect(m.staff_responsive_rate).toBe(50);
    expect(m.unique_children).toBe(2);
  });

  // ── All feedback types counted correctly ───────────────────────────────

  it("only counts satisfaction_survey for survey_count", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_type: "exit_interview" }),
      makeRecord({ feedback_type: "house_meeting_feedback" }),
      makeRecord({ feedback_type: "other" }),
    ]);
    expect(m.survey_count).toBe(0);
    expect(m.session_count).toBe(0);
    expect(m.suggestion_count).toBe(0);
  });

  it("counts all three named types simultaneously", () => {
    const m = computeFeedbackMetrics([
      makeRecord({ feedback_type: "satisfaction_survey" }),
      makeRecord({ feedback_type: "feedback_session" }),
      makeRecord({ feedback_type: "suggestion_box" }),
    ]);
    expect(m.survey_count).toBe(1);
    expect(m.session_count).toBe(1);
    expect(m.suggestion_count).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyFeedbackAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyFeedbackAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────────

  it("returns no alerts for empty array", () => {
    expect(identifyFeedbackAlerts([])).toEqual([]);
  });

  it("returns no alerts when all records are ideal", () => {
    const alerts = identifyFeedbackAlerts([
      makeRecord({
        satisfaction_rating: "happy",
        response_status: "completed",
        child_informed_of_outcome: true,
        child_comfortable_sharing: true,
      }),
    ]);
    expect(alerts).toEqual([]);
  });

  // ── very_unhappy (critical, per-record) ────────────────────────────────

  describe("very_unhappy alert", () => {
    it("fires for a very_unhappy record", () => {
      const id = "rec-vu-1";
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          id,
          satisfaction_rating: "very_unhappy",
          child_name: "Alice",
          feedback_date: "2025-07-01",
          feedback_category: "care_quality",
        }),
      ]);
      const vu = alerts.filter((a) => a.type === "very_unhappy");
      expect(vu).toHaveLength(1);
      expect(vu[0].severity).toBe("critical");
      expect(vu[0].id).toBe(id);
    });

    it("includes child_name in message", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          satisfaction_rating: "very_unhappy",
          child_name: "Bob",
          feedback_date: "2025-08-01",
          feedback_category: "general",
        }),
      ]);
      expect(alerts[0].message).toContain("Bob");
    });

    it("includes feedback_date in message", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          satisfaction_rating: "very_unhappy",
          child_name: "Alice",
          feedback_date: "2025-09-15",
          feedback_category: "general",
        }),
      ]);
      expect(alerts[0].message).toContain("2025-09-15");
    });

    it("includes feedback_category with underscores replaced by spaces", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          satisfaction_rating: "very_unhappy",
          child_name: "Alice",
          feedback_date: "2025-07-01",
          feedback_category: "food_mealtimes",
        }),
      ]);
      expect(alerts[0].message).toContain("food mealtimes");
      expect(alerts[0].message).not.toContain("food_mealtimes");
    });

    it("replaces multiple underscores in category", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          satisfaction_rating: "very_unhappy",
          child_name: "Alice",
          feedback_date: "2025-07-01",
          feedback_category: "rules_boundaries",
        }),
      ]);
      expect(alerts[0].message).toContain("rules boundaries");
    });

    it("includes 'respond urgently' in message", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          satisfaction_rating: "very_unhappy",
          child_name: "Alice",
          feedback_date: "2025-07-01",
          feedback_category: "general",
        }),
      ]);
      expect(alerts[0].message).toContain("respond urgently");
    });

    it("fires one alert per very_unhappy record", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({ satisfaction_rating: "very_unhappy", child_name: "A" }),
        makeRecord({ satisfaction_rating: "very_unhappy", child_name: "B" }),
        makeRecord({ satisfaction_rating: "very_unhappy", child_name: "C" }),
      ]);
      const vu = alerts.filter((a) => a.type === "very_unhappy");
      expect(vu).toHaveLength(3);
    });

    it("uses the record id as alert id", () => {
      const id = "specific-record-id";
      const alerts = identifyFeedbackAlerts([
        makeRecord({ id, satisfaction_rating: "very_unhappy" }),
      ]);
      const vu = alerts.find((a) => a.type === "very_unhappy");
      expect(vu?.id).toBe(id);
    });

    it("does not fire for unhappy (only very_unhappy)", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({ satisfaction_rating: "unhappy" }),
      ]);
      const vu = alerts.filter((a) => a.type === "very_unhappy");
      expect(vu).toHaveLength(0);
    });

    it("does not fire for neutral", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({ satisfaction_rating: "neutral" }),
      ]);
      expect(alerts.filter((a) => a.type === "very_unhappy")).toHaveLength(0);
    });

    it("does not fire for happy or very_happy", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({ satisfaction_rating: "happy" }),
        makeRecord({ satisfaction_rating: "very_happy" }),
      ]);
      expect(alerts.filter((a) => a.type === "very_unhappy")).toHaveLength(0);
    });

    it("correctly formats general category (no underscores to replace)", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          satisfaction_rating: "very_unhappy",
          feedback_category: "general",
          child_name: "Eve",
          feedback_date: "2025-07-01",
        }),
      ]);
      expect(alerts[0].message).toContain("general");
    });
  });

  // ── not_actioned (high, aggregate) ─────────────────────────────────────

  describe("not_actioned alert", () => {
    it("fires when 1 record is not_actioned", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: true,
        }),
      ]);
      const na = alerts.find((a) => a.type === "not_actioned");
      expect(na).toBeDefined();
      expect(na!.severity).toBe("high");
    });

    it("uses singular 'feedback item has' for count of 1", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: true,
        }),
      ]);
      const na = alerts.find((a) => a.type === "not_actioned");
      expect(na!.message).toContain("1 feedback item has");
    });

    it("uses plural 'feedback items have' for count > 1", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: true,
        }),
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: true,
        }),
      ]);
      const na = alerts.find((a) => a.type === "not_actioned");
      expect(na!.message).toContain("2 feedback items have");
    });

    it("includes 'not been actioned' in message", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: true,
        }),
      ]);
      const na = alerts.find((a) => a.type === "not_actioned");
      expect(na!.message).toContain("not been actioned");
    });

    it("includes 'respond to children's views' in message", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: true,
        }),
      ]);
      const na = alerts.find((a) => a.type === "not_actioned");
      expect(na!.message).toContain("respond to children's views");
    });

    it("has id 'not_actioned'", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: true,
        }),
      ]);
      const na = alerts.find((a) => a.type === "not_actioned");
      expect(na!.id).toBe("not_actioned");
    });

    it("fires as single aggregate alert (not per-record)", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: true,
        }),
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: true,
        }),
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: true,
        }),
      ]);
      const na = alerts.filter((a) => a.type === "not_actioned");
      expect(na).toHaveLength(1);
      expect(na[0].message).toContain("3 feedback items have");
    });

    it("does not fire when all records are completed", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "not_actioned")).toHaveLength(0);
    });

    it("does not fire for pending status", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "not_actioned")).toHaveLength(0);
    });
  });

  // ── pending_responses (high, threshold=3) ──────────────────────────────

  describe("pending_responses alert", () => {
    it("does not fire for 1 pending record", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      ]);
      expect(
        alerts.filter((a) => a.type === "pending_responses"),
      ).toHaveLength(0);
    });

    it("does not fire for 2 pending records", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      ]);
      expect(
        alerts.filter((a) => a.type === "pending_responses"),
      ).toHaveLength(0);
    });

    it("fires at exactly 3 pending records", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      ]);
      const pr = alerts.find((a) => a.type === "pending_responses");
      expect(pr).toBeDefined();
      expect(pr!.severity).toBe("high");
    });

    it("fires for more than 3 pending records", () => {
      const recs = Array.from({ length: 5 }, () =>
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      const pr = alerts.find((a) => a.type === "pending_responses");
      expect(pr).toBeDefined();
      expect(pr!.message).toContain("5");
    });

    it("includes 'feedback responses are pending' in message", () => {
      const recs = Array.from({ length: 3 }, () =>
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      const pr = alerts.find((a) => a.type === "pending_responses");
      expect(pr!.message).toContain("feedback responses are pending");
    });

    it("includes 'acknowledge children's input promptly' in message", () => {
      const recs = Array.from({ length: 3 }, () =>
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      const pr = alerts.find((a) => a.type === "pending_responses");
      expect(pr!.message).toContain(
        "acknowledge children's input promptly",
      );
    });

    it("has id 'pending_responses'", () => {
      const recs = Array.from({ length: 3 }, () =>
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      const pr = alerts.find((a) => a.type === "pending_responses");
      expect(pr!.id).toBe("pending_responses");
    });

    it("fires as single aggregate alert", () => {
      const recs = Array.from({ length: 4 }, () =>
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      expect(
        alerts.filter((a) => a.type === "pending_responses"),
      ).toHaveLength(1);
    });

    it("does not count non-pending statuses", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
        makeRecord({
          response_status: "acknowledged",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      ]);
      expect(
        alerts.filter((a) => a.type === "pending_responses"),
      ).toHaveLength(0);
    });
  });

  // ── child_not_informed (medium, >=1) ───────────────────────────────────

  describe("child_not_informed alert", () => {
    it("fires when 1 completed record has child not informed", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      ]);
      const cni = alerts.find((a) => a.type === "child_not_informed");
      expect(cni).toBeDefined();
      expect(cni!.severity).toBe("medium");
    });

    it("uses singular 'response' for count of 1", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      ]);
      const cni = alerts.find((a) => a.type === "child_not_informed");
      expect(cni!.message).toContain("1 completed response where");
    });

    it("uses plural 'responses' for count > 1", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      ]);
      const cni = alerts.find((a) => a.type === "child_not_informed");
      expect(cni!.message).toContain("2 completed responses where");
    });

    it("includes 'close the feedback loop' in message", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      ]);
      const cni = alerts.find((a) => a.type === "child_not_informed");
      expect(cni!.message).toContain("close the feedback loop");
    });

    it("has id 'child_not_informed'", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      ]);
      const cni = alerts.find((a) => a.type === "child_not_informed");
      expect(cni!.id).toBe("child_not_informed");
    });

    it("does not fire when child IS informed on completed records", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: true,
          child_comfortable_sharing: true,
        }),
      ]);
      expect(
        alerts.filter((a) => a.type === "child_not_informed"),
      ).toHaveLength(0);
    });

    it("does not fire for pending records where child not informed", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      ]);
      expect(
        alerts.filter((a) => a.type === "child_not_informed"),
      ).toHaveLength(0);
    });

    it("does not fire for in_progress records where child not informed", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "in_progress",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      ]);
      expect(
        alerts.filter((a) => a.type === "child_not_informed"),
      ).toHaveLength(0);
    });

    it("does not fire for not_actioned records where child not informed", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "not_actioned",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      ]);
      expect(
        alerts.filter((a) => a.type === "child_not_informed"),
      ).toHaveLength(0);
    });

    it("does not fire for acknowledged records where child not informed", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "acknowledged",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      ]);
      expect(
        alerts.filter((a) => a.type === "child_not_informed"),
      ).toHaveLength(0);
    });

    it("only counts completed records in total", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
        makeRecord({
          response_status: "pending",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      ]);
      const cni = alerts.find((a) => a.type === "child_not_informed");
      expect(cni!.message).toContain("2 completed responses");
    });

    it("fires as single aggregate alert", () => {
      const recs = Array.from({ length: 4 }, () =>
        makeRecord({
          response_status: "completed",
          child_informed_of_outcome: false,
          child_comfortable_sharing: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      expect(
        alerts.filter((a) => a.type === "child_not_informed"),
      ).toHaveLength(1);
    });
  });

  // ── low_comfort (medium, threshold=3) ──────────────────────────────────

  describe("low_comfort alert", () => {
    it("does not fire for 1 uncomfortable child", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "low_comfort")).toHaveLength(0);
    });

    it("does not fire for 2 uncomfortable children", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "low_comfort")).toHaveLength(0);
    });

    it("fires at exactly 3 uncomfortable children", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
      ]);
      const lc = alerts.find((a) => a.type === "low_comfort");
      expect(lc).toBeDefined();
      expect(lc!.severity).toBe("medium");
    });

    it("fires for more than 3 uncomfortable children", () => {
      const recs = Array.from({ length: 5 }, () =>
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      const lc = alerts.find((a) => a.type === "low_comfort");
      expect(lc).toBeDefined();
      expect(lc!.message).toContain("5");
    });

    it("includes 'children not comfortable sharing feedback' in message", () => {
      const recs = Array.from({ length: 3 }, () =>
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      const lc = alerts.find((a) => a.type === "low_comfort");
      expect(lc!.message).toContain(
        "children not comfortable sharing feedback",
      );
    });

    it("includes 'review feedback methods' in message", () => {
      const recs = Array.from({ length: 3 }, () =>
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      const lc = alerts.find((a) => a.type === "low_comfort");
      expect(lc!.message).toContain("review feedback methods");
    });

    it("has id 'low_comfort'", () => {
      const recs = Array.from({ length: 3 }, () =>
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      const lc = alerts.find((a) => a.type === "low_comfort");
      expect(lc!.id).toBe("low_comfort");
    });

    it("fires as single aggregate alert", () => {
      const recs = Array.from({ length: 6 }, () =>
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
      );
      const alerts = identifyFeedbackAlerts(recs);
      expect(alerts.filter((a) => a.type === "low_comfort")).toHaveLength(1);
    });

    it("does not count comfortable children", () => {
      const alerts = identifyFeedbackAlerts([
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
        makeRecord({
          child_comfortable_sharing: false,
          child_informed_of_outcome: true,
        }),
        makeRecord({
          child_comfortable_sharing: true,
          child_informed_of_outcome: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "low_comfort")).toHaveLength(0);
    });
  });

  // ── Alert ordering ────────────────────────────────────────────────────

  it("critical alerts appear before high alerts", () => {
    const alerts = identifyFeedbackAlerts([
      makeRecord({
        satisfaction_rating: "very_unhappy",
        response_status: "not_actioned",
        child_informed_of_outcome: true,
        child_comfortable_sharing: true,
      }),
    ]);
    const types = alerts.map((a) => a.type);
    const vuIdx = types.indexOf("very_unhappy");
    const naIdx = types.indexOf("not_actioned");
    expect(vuIdx).toBeLessThan(naIdx);
  });

  it("high alerts appear before medium alerts", () => {
    const alerts = identifyFeedbackAlerts([
      makeRecord({
        response_status: "not_actioned",
        child_informed_of_outcome: false,
        child_comfortable_sharing: false,
      }),
      makeRecord({
        response_status: "completed",
        child_informed_of_outcome: false,
        child_comfortable_sharing: false,
      }),
      makeRecord({
        child_comfortable_sharing: false,
        child_informed_of_outcome: true,
      }),
    ]);
    const types = alerts.map((a) => a.type);
    const naIdx = types.indexOf("not_actioned");
    const cniIdx = types.indexOf("child_not_informed");
    expect(naIdx).toBeLessThan(cniIdx);
  });

  // ── Multiple alert types simultaneously ────────────────────────────────

  it("fires all five alert types when conditions met", () => {
    const records = [
      // very_unhappy (critical)
      makeRecord({
        satisfaction_rating: "very_unhappy",
        response_status: "pending",
        child_comfortable_sharing: false,
        child_informed_of_outcome: false,
      }),
      // not_actioned (high)
      makeRecord({
        response_status: "not_actioned",
        child_comfortable_sharing: false,
        child_informed_of_outcome: false,
      }),
      // pending (need 3 total)
      makeRecord({
        response_status: "pending",
        child_comfortable_sharing: false,
        child_informed_of_outcome: false,
      }),
      makeRecord({
        response_status: "pending",
        child_comfortable_sharing: false,
        child_informed_of_outcome: false,
      }),
      // completed not informed (child_not_informed)
      makeRecord({
        response_status: "completed",
        child_informed_of_outcome: false,
        child_comfortable_sharing: false,
      }),
    ];
    const alerts = identifyFeedbackAlerts(records);
    const types = alerts.map((a) => a.type);

    expect(types).toContain("very_unhappy");
    expect(types).toContain("not_actioned");
    expect(types).toContain("pending_responses");
    expect(types).toContain("child_not_informed");
    expect(types).toContain("low_comfort");
  });

  it("very_unhappy alert count matches very_unhappy record count", () => {
    const records = [
      makeRecord({ satisfaction_rating: "very_unhappy", child_name: "A" }),
      makeRecord({ satisfaction_rating: "very_unhappy", child_name: "B" }),
      makeRecord({ satisfaction_rating: "happy", child_name: "C" }),
    ];
    const alerts = identifyFeedbackAlerts(records);
    const vu = alerts.filter((a) => a.type === "very_unhappy");
    expect(vu).toHaveLength(2);
  });

  it("each very_unhappy alert references a different record id", () => {
    const id1 = "id-one";
    const id2 = "id-two";
    const records = [
      makeRecord({
        id: id1,
        satisfaction_rating: "very_unhappy",
        child_name: "A",
      }),
      makeRecord({
        id: id2,
        satisfaction_rating: "very_unhappy",
        child_name: "B",
      }),
    ];
    const alerts = identifyFeedbackAlerts(records);
    const vu = alerts.filter((a) => a.type === "very_unhappy");
    const ids = vu.map((a) => a.id);
    expect(ids).toContain(id1);
    expect(ids).toContain(id2);
  });

  // ── Edge: default record triggers child_not_informed ───────────────────

  it("default record (completed, not informed) triggers child_not_informed", () => {
    // Default: response_status=completed, child_informed_of_outcome=false
    const alerts = identifyFeedbackAlerts([makeRecord()]);
    const cni = alerts.find((a) => a.type === "child_not_informed");
    expect(cni).toBeDefined();
  });

  it("default record does not trigger very_unhappy", () => {
    const alerts = identifyFeedbackAlerts([makeRecord()]);
    expect(alerts.filter((a) => a.type === "very_unhappy")).toHaveLength(0);
  });

  it("default record does not trigger not_actioned", () => {
    const alerts = identifyFeedbackAlerts([makeRecord()]);
    expect(alerts.filter((a) => a.type === "not_actioned")).toHaveLength(0);
  });

  it("default record does not trigger pending_responses", () => {
    const alerts = identifyFeedbackAlerts([makeRecord()]);
    expect(
      alerts.filter((a) => a.type === "pending_responses"),
    ).toHaveLength(0);
  });

  it("default record does not trigger low_comfort", () => {
    const alerts = identifyFeedbackAlerts([makeRecord()]);
    expect(alerts.filter((a) => a.type === "low_comfort")).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. makeRecord factory sanity
// ══════════════════════════════════════════════════════════════════════════════

describe("makeRecord factory", () => {
  it("produces a valid record with defaults", () => {
    const r = makeRecord();
    expect(r.feedback_type).toBe("satisfaction_survey");
    expect(r.satisfaction_rating).toBe("happy");
    expect(r.response_status).toBe("completed");
    expect(r.feedback_category).toBe("general");
    expect(r.child_name).toBe("Child A");
    expect(r.collected_by).toBe("Staff A");
  });

  it("defaults nullable fields to null", () => {
    const r = makeRecord();
    expect(r.child_id).toBeNull();
    expect(r.response_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding child_id to a value", () => {
    const r = makeRecord({ child_id: "child-123" });
    expect(r.child_id).toBe("child-123");
  });

  it("allows overriding child_id to null explicitly", () => {
    const r = makeRecord({ child_id: null });
    expect(r.child_id).toBeNull();
  });

  it("allows overriding response_date", () => {
    const r = makeRecord({ response_date: "2025-07-01" });
    expect(r.response_date).toBe("2025-07-01");
  });

  it("allows overriding notes", () => {
    const r = makeRecord({ notes: "Some note" });
    expect(r.notes).toBe("Some note");
  });

  it("defaults boolean fields correctly", () => {
    const r = makeRecord();
    expect(r.child_chose_method).toBe(true);
    expect(r.child_comfortable_sharing).toBe(true);
    expect(r.anonymous_option_offered).toBe(true);
    expect(r.feedback_discussed_with_child).toBe(true);
    expect(r.changes_implemented).toBe(false);
    expect(r.child_informed_of_outcome).toBe(false);
    expect(r.child_satisfied_with_response).toBe(false);
    expect(r.staff_responsive).toBe(true);
  });

  it("defaults array fields to empty arrays", () => {
    const r = makeRecord();
    expect(r.themes_identified).toEqual([]);
    expect(r.improvements_suggested).toEqual([]);
    expect(r.actions_taken).toEqual([]);
    expect(r.issues_found).toEqual([]);
  });

  it("generates unique ids", () => {
    const r1 = makeRecord();
    const r2 = makeRecord();
    expect(r1.id).not.toBe(r2.id);
  });
});
