// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LAC REVIEW SERVICE TESTS
// Pure-function unit tests for LAC review metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 45 (review of quality of care),
// Care Planning Regs 2010, IRO Handbook.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import {
  _testing,
  REVIEW_TYPES,
  REVIEW_OUTCOMES,
  CHILD_PARTICIPATIONS,
  REVIEW_STATUSES,
} from "../lac-review-service";

import type {
  LacReview,
  ReviewType,
  ReviewOutcome,
  ChildParticipation,
  ReviewStatus,
} from "../lac-review-service";

const { computeReviewMetrics, identifyReviewAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const NOW = new Date("2026-05-13");

function makeLacReview(overrides: Partial<LacReview> = {}): LacReview {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    review_type: "subsequent",
    review_date: "2026-04-20",
    next_review_due: "2026-10-20",
    status: "completed",
    iro_name: "Jane Doe",
    child_participation: "attended_spoke",
    child_views_recorded: true,
    parent_attended: true,
    social_worker_attended: true,
    key_worker_attended: true,
    outcome: "plan_endorsed",
    recommendations: ["Continue current placement"],
    actions_agreed: ["Review education plan"],
    placement_stability_discussed: true,
    permanence_plan_reviewed: true,
    health_reviewed: true,
    education_reviewed: true,
    within_timescale: true,
    notes: null,
    created_at: "2026-04-20T10:00:00.000Z",
    updated_at: "2026-04-20T10:00:00.000Z",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("REVIEW_TYPES", () => {
  it("has exactly 6 items", () => {
    expect(REVIEW_TYPES).toHaveLength(6);
  });

  it("contains all expected type values", () => {
    const types = REVIEW_TYPES.map((r) => r.type);
    expect(types).toContain("initial");
    expect(types).toContain("second");
    expect(types).toContain("subsequent");
    expect(types).toContain("additional");
    expect(types).toContain("disruption");
    expect(types).toContain("pre_discharge");
  });

  it("has unique type values", () => {
    const types = REVIEW_TYPES.map((r) => r.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("has non-empty labels for every entry", () => {
    for (const rt of REVIEW_TYPES) {
      expect(rt.label.length).toBeGreaterThan(0);
    }
  });

  it("maps 'initial' to the correct label", () => {
    const found = REVIEW_TYPES.find((r) => r.type === "initial");
    expect(found?.label).toBe("Initial (within 20 working days)");
  });

  it("maps 'disruption' to the correct label", () => {
    const found = REVIEW_TYPES.find((r) => r.type === "disruption");
    expect(found?.label).toBe("Disruption Meeting");
  });

  it("maps 'pre_discharge' to the correct label", () => {
    const found = REVIEW_TYPES.find((r) => r.type === "pre_discharge");
    expect(found?.label).toBe("Pre-Discharge");
  });
});

describe("REVIEW_OUTCOMES", () => {
  it("has exactly 8 items", () => {
    expect(REVIEW_OUTCOMES).toHaveLength(8);
  });

  it("contains all expected outcome values", () => {
    const outcomes = REVIEW_OUTCOMES.map((r) => r.outcome);
    expect(outcomes).toContain("plan_endorsed");
    expect(outcomes).toContain("plan_amended");
    expect(outcomes).toContain("placement_change");
    expect(outcomes).toContain("permanence_confirmed");
    expect(outcomes).toContain("return_home");
    expect(outcomes).toContain("escalation_required");
    expect(outcomes).toContain("further_assessment");
    expect(outcomes).toContain("no_change");
  });

  it("has unique outcome values", () => {
    const outcomes = REVIEW_OUTCOMES.map((r) => r.outcome);
    expect(new Set(outcomes).size).toBe(outcomes.length);
  });

  it("has non-empty labels for every entry", () => {
    for (const ro of REVIEW_OUTCOMES) {
      expect(ro.label.length).toBeGreaterThan(0);
    }
  });

  it("maps 'plan_endorsed' to 'Plan Endorsed'", () => {
    const found = REVIEW_OUTCOMES.find((r) => r.outcome === "plan_endorsed");
    expect(found?.label).toBe("Plan Endorsed");
  });

  it("maps 'escalation_required' to 'Escalation Required'", () => {
    const found = REVIEW_OUTCOMES.find((r) => r.outcome === "escalation_required");
    expect(found?.label).toBe("Escalation Required");
  });

  it("maps 'no_change' to 'No Change'", () => {
    const found = REVIEW_OUTCOMES.find((r) => r.outcome === "no_change");
    expect(found?.label).toBe("No Change");
  });
});

describe("CHILD_PARTICIPATIONS", () => {
  it("has exactly 6 items", () => {
    expect(CHILD_PARTICIPATIONS).toHaveLength(6);
  });

  it("contains all expected participation values", () => {
    const parts = CHILD_PARTICIPATIONS.map((r) => r.participation);
    expect(parts).toContain("attended_spoke");
    expect(parts).toContain("attended_advocate");
    expect(parts).toContain("written_views");
    expect(parts).toContain("views_via_worker");
    expect(parts).toContain("did_not_participate");
    expect(parts).toContain("too_young");
  });

  it("has unique participation values", () => {
    const parts = CHILD_PARTICIPATIONS.map((r) => r.participation);
    expect(new Set(parts).size).toBe(parts.length);
  });

  it("has non-empty labels for every entry", () => {
    for (const cp of CHILD_PARTICIPATIONS) {
      expect(cp.label.length).toBeGreaterThan(0);
    }
  });

  it("maps 'attended_spoke' to 'Attended & Spoke'", () => {
    const found = CHILD_PARTICIPATIONS.find((r) => r.participation === "attended_spoke");
    expect(found?.label).toBe("Attended & Spoke");
  });

  it("maps 'too_young' to 'Too Young'", () => {
    const found = CHILD_PARTICIPATIONS.find((r) => r.participation === "too_young");
    expect(found?.label).toBe("Too Young");
  });
});

describe("REVIEW_STATUSES", () => {
  it("has exactly 5 items", () => {
    expect(REVIEW_STATUSES).toHaveLength(5);
  });

  it("contains all expected status values", () => {
    const statuses = REVIEW_STATUSES.map((r) => r.status);
    expect(statuses).toContain("scheduled");
    expect(statuses).toContain("completed");
    expect(statuses).toContain("overdue");
    expect(statuses).toContain("cancelled");
    expect(statuses).toContain("rescheduled");
  });

  it("has unique status values", () => {
    const statuses = REVIEW_STATUSES.map((r) => r.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("has non-empty labels for every entry", () => {
    for (const rs of REVIEW_STATUSES) {
      expect(rs.label.length).toBeGreaterThan(0);
    }
  });

  it("maps 'completed' to 'Completed'", () => {
    const found = REVIEW_STATUSES.find((r) => r.status === "completed");
    expect(found?.label).toBe("Completed");
  });

  it("maps 'rescheduled' to 'Rescheduled'", () => {
    const found = REVIEW_STATUSES.find((r) => r.status === "rescheduled");
    expect(found?.label).toBe("Rescheduled");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeReviewMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeReviewMetrics", () => {
  describe("empty inputs", () => {
    it("returns all zeros for empty reviews array", () => {
      const m = computeReviewMetrics([], 10, NOW);
      expect(m.total_reviews).toBe(0);
      expect(m.completed_reviews).toBe(0);
      expect(m.overdue_reviews).toBe(0);
      expect(m.scheduled_reviews).toBe(0);
      expect(m.within_timescale_rate).toBe(0);
      expect(m.child_participation_rate).toBe(0);
      expect(m.child_views_recorded_rate).toBe(0);
      expect(m.parent_attendance_rate).toBe(0);
      expect(m.plan_endorsed_count).toBe(0);
      expect(m.plan_amended_count).toBe(0);
      expect(m.escalation_count).toBe(0);
      expect(m.children_reviewed).toBe(0);
      expect(m.review_coverage).toBe(0);
      expect(m.placement_stability_rate).toBe(0);
      expect(m.health_reviewed_rate).toBe(0);
      expect(m.education_reviewed_rate).toBe(0);
    });

    it("returns empty objects for by_type, by_outcome, by_participation, by_status", () => {
      const m = computeReviewMetrics([], 5, NOW);
      expect(m.by_type).toEqual({});
      expect(m.by_outcome).toEqual({});
      expect(m.by_participation).toEqual({});
      expect(m.by_status).toEqual({});
    });
  });

  describe("total_reviews", () => {
    it("counts all reviews regardless of status", () => {
      const reviews = [
        makeLacReview({ status: "completed" }),
        makeLacReview({ status: "scheduled" }),
        makeLacReview({ status: "overdue" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).total_reviews).toBe(3);
    });

    it("returns 1 for a single review", () => {
      expect(computeReviewMetrics([makeLacReview()], 5, NOW).total_reviews).toBe(1);
    });
  });

  describe("completed_reviews", () => {
    it("counts only reviews with status completed", () => {
      const reviews = [
        makeLacReview({ status: "completed" }),
        makeLacReview({ status: "completed" }),
        makeLacReview({ status: "overdue" }),
        makeLacReview({ status: "scheduled" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).completed_reviews).toBe(2);
    });

    it("returns 0 when no reviews are completed", () => {
      const reviews = [makeLacReview({ status: "scheduled" })];
      expect(computeReviewMetrics(reviews, 5, NOW).completed_reviews).toBe(0);
    });
  });

  describe("overdue_reviews", () => {
    it("counts only reviews with status overdue", () => {
      const reviews = [
        makeLacReview({ status: "overdue" }),
        makeLacReview({ status: "overdue" }),
        makeLacReview({ status: "completed" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).overdue_reviews).toBe(2);
    });

    it("returns 0 when none are overdue", () => {
      const reviews = [makeLacReview({ status: "completed" })];
      expect(computeReviewMetrics(reviews, 5, NOW).overdue_reviews).toBe(0);
    });
  });

  describe("scheduled_reviews", () => {
    it("counts only reviews with status scheduled", () => {
      const reviews = [
        makeLacReview({ status: "scheduled", review_date: "2026-06-01" }),
        makeLacReview({ status: "completed" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).scheduled_reviews).toBe(1);
    });

    it("returns 0 when none are scheduled", () => {
      const reviews = [makeLacReview({ status: "completed" })];
      expect(computeReviewMetrics(reviews, 5, NOW).scheduled_reviews).toBe(0);
    });
  });

  describe("within_timescale_rate", () => {
    it("returns 100 when all completed reviews are within timescale", () => {
      const reviews = [
        makeLacReview({ status: "completed", within_timescale: true }),
        makeLacReview({ status: "completed", within_timescale: true }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).within_timescale_rate).toBe(100);
    });

    it("returns 0 when no completed reviews are within timescale", () => {
      const reviews = [
        makeLacReview({ status: "completed", within_timescale: false }),
        makeLacReview({ status: "completed", within_timescale: false }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).within_timescale_rate).toBe(0);
    });

    it("returns 50 when half are within timescale", () => {
      const reviews = [
        makeLacReview({ status: "completed", within_timescale: true }),
        makeLacReview({ status: "completed", within_timescale: false }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).within_timescale_rate).toBe(50);
    });

    it("ignores non-completed reviews for rate calculation", () => {
      const reviews = [
        makeLacReview({ status: "completed", within_timescale: true }),
        makeLacReview({ status: "scheduled", within_timescale: false }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).within_timescale_rate).toBe(100);
    });

    it("returns 0 when there are no completed reviews", () => {
      const reviews = [makeLacReview({ status: "scheduled" })];
      expect(computeReviewMetrics(reviews, 5, NOW).within_timescale_rate).toBe(0);
    });
  });

  describe("child_participation_rate", () => {
    it("counts attended_spoke as participated", () => {
      const reviews = [makeLacReview({ status: "completed", child_participation: "attended_spoke" })];
      expect(computeReviewMetrics(reviews, 5, NOW).child_participation_rate).toBe(100);
    });

    it("counts attended_advocate as participated", () => {
      const reviews = [makeLacReview({ status: "completed", child_participation: "attended_advocate" })];
      expect(computeReviewMetrics(reviews, 5, NOW).child_participation_rate).toBe(100);
    });

    it("counts written_views as participated", () => {
      const reviews = [makeLacReview({ status: "completed", child_participation: "written_views" })];
      expect(computeReviewMetrics(reviews, 5, NOW).child_participation_rate).toBe(100);
    });

    it("counts views_via_worker as participated", () => {
      const reviews = [makeLacReview({ status: "completed", child_participation: "views_via_worker" })];
      expect(computeReviewMetrics(reviews, 5, NOW).child_participation_rate).toBe(100);
    });

    it("does not count did_not_participate", () => {
      const reviews = [makeLacReview({ status: "completed", child_participation: "did_not_participate" })];
      expect(computeReviewMetrics(reviews, 5, NOW).child_participation_rate).toBe(0);
    });

    it("does not count too_young", () => {
      const reviews = [makeLacReview({ status: "completed", child_participation: "too_young" })];
      expect(computeReviewMetrics(reviews, 5, NOW).child_participation_rate).toBe(0);
    });

    it("calculates mixed participation correctly", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_participation: "attended_spoke" }),
        makeLacReview({ status: "completed", child_participation: "did_not_participate" }),
        makeLacReview({ status: "completed", child_participation: "written_views" }),
      ];
      // 2/3 = 66.7%
      expect(computeReviewMetrics(reviews, 5, NOW).child_participation_rate).toBe(66.7);
    });

    it("only counts completed reviews", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_participation: "attended_spoke" }),
        makeLacReview({ status: "scheduled", child_participation: "did_not_participate" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).child_participation_rate).toBe(100);
    });

    it("returns 0 when no completed reviews exist", () => {
      const reviews = [makeLacReview({ status: "scheduled" })];
      expect(computeReviewMetrics(reviews, 5, NOW).child_participation_rate).toBe(0);
    });
  });

  describe("child_views_recorded_rate", () => {
    it("returns 100 when all completed reviews have views recorded", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_views_recorded: true }),
        makeLacReview({ status: "completed", child_views_recorded: true }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).child_views_recorded_rate).toBe(100);
    });

    it("returns 0 when no completed reviews have views recorded", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_views_recorded: false }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).child_views_recorded_rate).toBe(0);
    });

    it("returns 0 when no completed reviews exist", () => {
      const reviews = [makeLacReview({ status: "overdue" })];
      expect(computeReviewMetrics(reviews, 5, NOW).child_views_recorded_rate).toBe(0);
    });
  });

  describe("parent_attendance_rate", () => {
    it("returns 100 when all completed reviews have parent attended", () => {
      const reviews = [
        makeLacReview({ status: "completed", parent_attended: true }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).parent_attendance_rate).toBe(100);
    });

    it("returns 0 when no parents attended", () => {
      const reviews = [
        makeLacReview({ status: "completed", parent_attended: false }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).parent_attendance_rate).toBe(0);
    });

    it("calculates mixed attendance correctly", () => {
      const reviews = [
        makeLacReview({ status: "completed", parent_attended: true }),
        makeLacReview({ status: "completed", parent_attended: false }),
        makeLacReview({ status: "completed", parent_attended: true }),
        makeLacReview({ status: "completed", parent_attended: true }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).parent_attendance_rate).toBe(75);
    });
  });

  describe("plan_endorsed_count", () => {
    it("counts completed reviews with plan_endorsed outcome", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: "plan_endorsed" }),
        makeLacReview({ status: "completed", outcome: "plan_endorsed" }),
        makeLacReview({ status: "completed", outcome: "plan_amended" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).plan_endorsed_count).toBe(2);
    });

    it("returns 0 when no plans are endorsed", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: "plan_amended" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).plan_endorsed_count).toBe(0);
    });
  });

  describe("plan_amended_count", () => {
    it("counts completed reviews with plan_amended outcome", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: "plan_amended" }),
        makeLacReview({ status: "completed", outcome: "plan_amended" }),
        makeLacReview({ status: "completed", outcome: "plan_endorsed" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).plan_amended_count).toBe(2);
    });

    it("returns 0 when no plans are amended", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: "plan_endorsed" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).plan_amended_count).toBe(0);
    });
  });

  describe("escalation_count", () => {
    it("counts completed reviews with escalation_required outcome", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: "escalation_required" }),
        makeLacReview({ status: "completed", outcome: "plan_endorsed" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).escalation_count).toBe(1);
    });

    it("returns 0 when no escalations", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: "plan_endorsed" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).escalation_count).toBe(0);
    });
  });

  describe("children_reviewed", () => {
    it("counts unique child_ids from completed reviews", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_id: "child-1" }),
        makeLacReview({ status: "completed", child_id: "child-1" }),
        makeLacReview({ status: "completed", child_id: "child-2" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).children_reviewed).toBe(2);
    });

    it("ignores non-completed reviews", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_id: "child-1" }),
        makeLacReview({ status: "scheduled", child_id: "child-2" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).children_reviewed).toBe(1);
    });

    it("returns 0 when no completed reviews", () => {
      const reviews = [makeLacReview({ status: "scheduled" })];
      expect(computeReviewMetrics(reviews, 5, NOW).children_reviewed).toBe(0);
    });
  });

  describe("review_coverage", () => {
    it("returns 100 when all children have been reviewed", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_id: "child-1" }),
        makeLacReview({ status: "completed", child_id: "child-2" }),
      ];
      expect(computeReviewMetrics(reviews, 2, NOW).review_coverage).toBe(100);
    });

    it("returns 50 when half the children have been reviewed", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_id: "child-1" }),
      ];
      expect(computeReviewMetrics(reviews, 2, NOW).review_coverage).toBe(50);
    });

    it("returns 0 when totalChildren is 0", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_id: "child-1" }),
      ];
      expect(computeReviewMetrics(reviews, 0, NOW).review_coverage).toBe(0);
    });

    it("returns 0 when there are no completed reviews", () => {
      expect(computeReviewMetrics([], 5, NOW).review_coverage).toBe(0);
    });
  });

  describe("placement_stability_rate", () => {
    it("returns 100 when all completed reviews discussed stability", () => {
      const reviews = [
        makeLacReview({ status: "completed", placement_stability_discussed: true }),
        makeLacReview({ status: "completed", placement_stability_discussed: true }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).placement_stability_rate).toBe(100);
    });

    it("returns 0 when no completed reviews discussed stability", () => {
      const reviews = [
        makeLacReview({ status: "completed", placement_stability_discussed: false }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).placement_stability_rate).toBe(0);
    });

    it("returns 0 when there are no completed reviews", () => {
      const reviews = [makeLacReview({ status: "scheduled" })];
      expect(computeReviewMetrics(reviews, 5, NOW).placement_stability_rate).toBe(0);
    });
  });

  describe("health_reviewed_rate", () => {
    it("returns 100 when all completed reviews include health", () => {
      const reviews = [
        makeLacReview({ status: "completed", health_reviewed: true }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).health_reviewed_rate).toBe(100);
    });

    it("returns 0 when no completed reviews include health", () => {
      const reviews = [
        makeLacReview({ status: "completed", health_reviewed: false }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).health_reviewed_rate).toBe(0);
    });

    it("calculates mixed correctly", () => {
      const reviews = [
        makeLacReview({ status: "completed", health_reviewed: true }),
        makeLacReview({ status: "completed", health_reviewed: false }),
        makeLacReview({ status: "completed", health_reviewed: true }),
      ];
      // 2/3 = 66.7%
      expect(computeReviewMetrics(reviews, 5, NOW).health_reviewed_rate).toBe(66.7);
    });
  });

  describe("education_reviewed_rate", () => {
    it("returns 100 when all completed reviews include education", () => {
      const reviews = [
        makeLacReview({ status: "completed", education_reviewed: true }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).education_reviewed_rate).toBe(100);
    });

    it("returns 0 when no completed reviews include education", () => {
      const reviews = [
        makeLacReview({ status: "completed", education_reviewed: false }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).education_reviewed_rate).toBe(0);
    });

    it("returns 0 when no completed reviews exist", () => {
      const reviews = [makeLacReview({ status: "overdue" })];
      expect(computeReviewMetrics(reviews, 5, NOW).education_reviewed_rate).toBe(0);
    });
  });

  describe("by_type", () => {
    it("groups all reviews by review_type", () => {
      const reviews = [
        makeLacReview({ review_type: "initial" }),
        makeLacReview({ review_type: "initial" }),
        makeLacReview({ review_type: "subsequent" }),
      ];
      const m = computeReviewMetrics(reviews, 5, NOW);
      expect(m.by_type).toEqual({ initial: 2, subsequent: 1 });
    });

    it("includes non-completed reviews in by_type", () => {
      const reviews = [
        makeLacReview({ review_type: "second", status: "scheduled" }),
        makeLacReview({ review_type: "second", status: "completed" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).by_type).toEqual({ second: 2 });
    });

    it("returns empty object for empty input", () => {
      expect(computeReviewMetrics([], 5, NOW).by_type).toEqual({});
    });
  });

  describe("by_outcome", () => {
    it("groups completed reviews by outcome", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: "plan_endorsed" }),
        makeLacReview({ status: "completed", outcome: "plan_endorsed" }),
        makeLacReview({ status: "completed", outcome: "plan_amended" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).by_outcome).toEqual({
        plan_endorsed: 2,
        plan_amended: 1,
      });
    });

    it("excludes reviews with null outcome", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: null }),
        makeLacReview({ status: "completed", outcome: "plan_endorsed" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).by_outcome).toEqual({
        plan_endorsed: 1,
      });
    });

    it("excludes non-completed reviews", () => {
      const reviews = [
        makeLacReview({ status: "scheduled", outcome: "plan_endorsed" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).by_outcome).toEqual({});
    });

    it("returns empty object when no completed reviews have outcomes", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: null }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).by_outcome).toEqual({});
    });
  });

  describe("by_participation", () => {
    it("groups completed reviews by child_participation", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_participation: "attended_spoke" }),
        makeLacReview({ status: "completed", child_participation: "attended_spoke" }),
        makeLacReview({ status: "completed", child_participation: "too_young" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).by_participation).toEqual({
        attended_spoke: 2,
        too_young: 1,
      });
    });

    it("excludes non-completed reviews", () => {
      const reviews = [
        makeLacReview({ status: "scheduled", child_participation: "attended_spoke" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).by_participation).toEqual({});
    });
  });

  describe("by_status", () => {
    it("groups all reviews by status", () => {
      const reviews = [
        makeLacReview({ status: "completed" }),
        makeLacReview({ status: "completed" }),
        makeLacReview({ status: "overdue" }),
        makeLacReview({ status: "scheduled" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).by_status).toEqual({
        completed: 2,
        overdue: 1,
        scheduled: 1,
      });
    });

    it("handles all same status", () => {
      const reviews = [
        makeLacReview({ status: "completed" }),
        makeLacReview({ status: "completed" }),
        makeLacReview({ status: "completed" }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).by_status).toEqual({
        completed: 3,
      });
    });
  });

  describe("rounding precision", () => {
    it("rounds to one decimal place", () => {
      // 1/3 = 33.333... → should be 33.3
      const reviews = [
        makeLacReview({ status: "completed", within_timescale: true }),
        makeLacReview({ status: "completed", within_timescale: false }),
        makeLacReview({ status: "completed", within_timescale: false }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).within_timescale_rate).toBe(33.3);
    });
  });

  describe("default now parameter", () => {
    it("works without explicit now date", () => {
      const reviews = [makeLacReview({ status: "completed" })];
      const m = computeReviewMetrics(reviews, 5);
      expect(m.total_reviews).toBe(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyReviewAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyReviewAlerts", () => {
  describe("empty inputs", () => {
    it("returns no alerts for empty reviews", () => {
      const alerts = identifyReviewAlerts([], 5, NOW);
      expect(alerts).toEqual([]);
    });
  });

  describe("review_overdue alert", () => {
    it("generates alert for overdue status", () => {
      const review = makeLacReview({ status: "overdue", review_date: "2026-04-01" });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const overdueAlerts = alerts.filter((a) => a.type === "review_overdue");
      expect(overdueAlerts).toHaveLength(1);
    });

    it("has critical severity", () => {
      const review = makeLacReview({ status: "overdue" });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const overdueAlert = alerts.find((a) => a.type === "review_overdue");
      expect(overdueAlert?.severity).toBe("critical");
    });

    it("includes child name in message", () => {
      const review = makeLacReview({ status: "overdue", child_name: "Bob Jones" });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const overdueAlert = alerts.find((a) => a.type === "review_overdue");
      expect(overdueAlert?.message).toContain("Bob Jones");
    });

    it("includes IRO name in message", () => {
      const review = makeLacReview({ status: "overdue", iro_name: "Sarah IRO" });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const overdueAlert = alerts.find((a) => a.type === "review_overdue");
      expect(overdueAlert?.message).toContain("Sarah IRO");
    });

    it("includes review id", () => {
      const review = makeLacReview({ id: "rev-123", status: "overdue" });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const overdueAlert = alerts.find((a) => a.type === "review_overdue");
      expect(overdueAlert?.id).toBe("rev-123");
    });

    it("generates multiple alerts for multiple overdue reviews", () => {
      const reviews = [
        makeLacReview({ status: "overdue" }),
        makeLacReview({ status: "overdue" }),
      ];
      const alerts = identifyReviewAlerts(reviews, 5, NOW);
      const overdueAlerts = alerts.filter((a) => a.type === "review_overdue");
      expect(overdueAlerts).toHaveLength(2);
    });

    it("does not trigger for completed status", () => {
      const review = makeLacReview({ status: "completed" });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "review_overdue")).toHaveLength(0);
    });
  });

  describe("review_past_date alert", () => {
    it("generates alert for scheduled review with past date", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-01", // before NOW (2026-05-13)
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const pastAlerts = alerts.filter((a) => a.type === "review_past_date");
      expect(pastAlerts).toHaveLength(1);
    });

    it("has high severity", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-01",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const pastAlert = alerts.find((a) => a.type === "review_past_date");
      expect(pastAlert?.severity).toBe("high");
    });

    it("includes child name in message", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-01",
        child_name: "Charlie Brown",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const pastAlert = alerts.find((a) => a.type === "review_past_date");
      expect(pastAlert?.message).toContain("Charlie Brown");
    });

    it("does not trigger for future scheduled review", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-06-01",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "review_past_date")).toHaveLength(0);
    });

    it("does not trigger for completed review with past date", () => {
      const review = makeLacReview({
        status: "completed",
        review_date: "2026-05-01",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "review_past_date")).toHaveLength(0);
    });
  });

  describe("review_upcoming alert", () => {
    it("generates alert for scheduled review within 14 days", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-20", // 7 days from NOW
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const upcomingAlerts = alerts.filter((a) => a.type === "review_upcoming");
      expect(upcomingAlerts).toHaveLength(1);
    });

    it("has medium severity", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-20",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const upcomingAlert = alerts.find((a) => a.type === "review_upcoming");
      expect(upcomingAlert?.severity).toBe("medium");
    });

    it("includes child name in message", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-20",
        child_name: "Eve Adams",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const upcomingAlert = alerts.find((a) => a.type === "review_upcoming");
      expect(upcomingAlert?.message).toContain("Eve Adams");
    });

    it("triggers for review on exactly NOW date", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-13", // same day as NOW
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const upcomingAlerts = alerts.filter((a) => a.type === "review_upcoming");
      expect(upcomingAlerts).toHaveLength(1);
    });

    it("triggers for review exactly 14 days from now", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-27", // exactly 14 days
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const upcomingAlerts = alerts.filter((a) => a.type === "review_upcoming");
      expect(upcomingAlerts).toHaveLength(1);
    });

    it("does not trigger for review 15 days from now", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-28", // 15 days
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "review_upcoming")).toHaveLength(0);
    });

    it("does not trigger for past scheduled review (handled by review_past_date)", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-01", // past
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "review_upcoming")).toHaveLength(0);
    });

    it("does not trigger for completed review within 14 days", () => {
      const review = makeLacReview({
        status: "completed",
        review_date: "2026-05-20",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "review_upcoming")).toHaveLength(0);
    });
  });

  describe("no_child_participation alert", () => {
    it("generates alert for completed review with did_not_participate", () => {
      const review = makeLacReview({
        status: "completed",
        child_participation: "did_not_participate",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const noPartAlerts = alerts.filter((a) => a.type === "no_child_participation");
      expect(noPartAlerts).toHaveLength(1);
    });

    it("has high severity", () => {
      const review = makeLacReview({
        status: "completed",
        child_participation: "did_not_participate",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const noPartAlert = alerts.find((a) => a.type === "no_child_participation");
      expect(noPartAlert?.severity).toBe("high");
    });

    it("includes child name in message", () => {
      const review = makeLacReview({
        status: "completed",
        child_participation: "did_not_participate",
        child_name: "Frank White",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const noPartAlert = alerts.find((a) => a.type === "no_child_participation");
      expect(noPartAlert?.message).toContain("Frank White");
    });

    it("does not trigger for too_young participation", () => {
      const review = makeLacReview({
        status: "completed",
        child_participation: "too_young",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "no_child_participation")).toHaveLength(0);
    });

    it("does not trigger for attended_spoke participation", () => {
      const review = makeLacReview({
        status: "completed",
        child_participation: "attended_spoke",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "no_child_participation")).toHaveLength(0);
    });

    it("does not trigger for non-completed review with did_not_participate", () => {
      const review = makeLacReview({
        status: "scheduled",
        child_participation: "did_not_participate",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "no_child_participation")).toHaveLength(0);
    });
  });

  describe("escalation_required alert", () => {
    it("generates alert for completed review with escalation_required outcome", () => {
      const review = makeLacReview({
        status: "completed",
        outcome: "escalation_required",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const escAlerts = alerts.filter((a) => a.type === "escalation_required");
      expect(escAlerts).toHaveLength(1);
    });

    it("has critical severity", () => {
      const review = makeLacReview({
        status: "completed",
        outcome: "escalation_required",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const escAlert = alerts.find((a) => a.type === "escalation_required");
      expect(escAlert?.severity).toBe("critical");
    });

    it("includes child name in message", () => {
      const review = makeLacReview({
        status: "completed",
        outcome: "escalation_required",
        child_name: "Grace Lee",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const escAlert = alerts.find((a) => a.type === "escalation_required");
      expect(escAlert?.message).toContain("Grace Lee");
    });

    it("includes IRO name in message", () => {
      const review = makeLacReview({
        status: "completed",
        outcome: "escalation_required",
        iro_name: "Dr. IRO Smith",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      const escAlert = alerts.find((a) => a.type === "escalation_required");
      expect(escAlert?.message).toContain("Dr. IRO Smith");
    });

    it("does not trigger for non-completed review with escalation_required", () => {
      const review = makeLacReview({
        status: "scheduled",
        outcome: "escalation_required",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "escalation_required")).toHaveLength(0);
    });

    it("does not trigger for completed review with different outcome", () => {
      const review = makeLacReview({
        status: "completed",
        outcome: "plan_endorsed",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "escalation_required")).toHaveLength(0);
    });
  });

  describe("combined scenarios", () => {
    it("generates multiple alert types from a single review set", () => {
      const reviews = [
        makeLacReview({ status: "overdue", review_date: "2026-04-01" }),
        makeLacReview({
          status: "scheduled",
          review_date: "2026-05-01", // past date
        }),
        makeLacReview({
          status: "scheduled",
          review_date: "2026-05-20", // upcoming
        }),
        makeLacReview({
          status: "completed",
          child_participation: "did_not_participate",
        }),
        makeLacReview({
          status: "completed",
          outcome: "escalation_required",
        }),
      ];
      const alerts = identifyReviewAlerts(reviews, 5, NOW);
      const types = new Set(alerts.map((a) => a.type));
      expect(types.has("review_overdue")).toBe(true);
      expect(types.has("review_past_date")).toBe(true);
      expect(types.has("review_upcoming")).toBe(true);
      expect(types.has("no_child_participation")).toBe(true);
      expect(types.has("escalation_required")).toBe(true);
    });

    it("generates no alerts for a benign set of reviews", () => {
      const reviews = [
        makeLacReview({
          status: "completed",
          child_participation: "attended_spoke",
          outcome: "plan_endorsed",
        }),
        makeLacReview({
          status: "scheduled",
          review_date: "2026-06-15", // beyond 14 days
        }),
      ];
      const alerts = identifyReviewAlerts(reviews, 5, NOW);
      expect(alerts).toHaveLength(0);
    });

    it("a single review can trigger multiple alerts (escalation + no participation)", () => {
      const review = makeLacReview({
        status: "completed",
        child_participation: "did_not_participate",
        outcome: "escalation_required",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.length).toBeGreaterThanOrEqual(2);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_child_participation");
      expect(types).toContain("escalation_required");
    });
  });

  describe("non-triggering conditions", () => {
    it("cancelled review does not trigger any alerts", () => {
      const review = makeLacReview({ status: "cancelled" });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts).toHaveLength(0);
    });

    it("rescheduled review does not trigger alerts", () => {
      const review = makeLacReview({ status: "rescheduled" });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts).toHaveLength(0);
    });

    it("completed review with attended_advocate does not trigger participation alert", () => {
      const review = makeLacReview({
        status: "completed",
        child_participation: "attended_advocate",
        outcome: "plan_endorsed",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.filter((a) => a.type === "no_child_participation")).toHaveLength(0);
    });
  });

  describe("default now parameter", () => {
    it("works without explicit now date", () => {
      const review = makeLacReview({ status: "overdue" });
      const alerts = identifyReviewAlerts([review], 5);
      expect(alerts.some((a) => a.type === "review_overdue")).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

// Re-import after mock to ensure mock is applied
import {
  listReviews,
  createReview,
  updateReview,
} from "../lac-review-service";

describe("CRUD fallback (Supabase disabled)", () => {
  it("listReviews returns ok with empty data", async () => {
    const result = await listReviews("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listReviews returns ok with filters provided", async () => {
    const result = await listReviews("home-1", {
      childId: "child-1",
      reviewType: "initial",
      status: "completed",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("createReview returns error when Supabase not configured", async () => {
    const result = await createReview({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      reviewType: "initial",
      reviewDate: "2026-05-01",
      iroName: "Jane Doe",
      childParticipation: "attended_spoke",
      childViewsRecorded: true,
      parentAttended: true,
      socialWorkerAttended: true,
      keyWorkerAttended: true,
      recommendations: ["Continue placement"],
      actionsAgreed: ["Review in 3 months"],
      placementStabilityDiscussed: true,
      permanencePlanReviewed: true,
      healthReviewed: true,
      educationReviewed: true,
      withinTimescale: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateReview returns error when Supabase not configured", async () => {
    const result = await updateReview("rev-123", { status: "completed" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("single item inputs", () => {
    it("computeReviewMetrics handles a single completed review", () => {
      const review = makeLacReview({ status: "completed", child_id: "child-1" });
      const m = computeReviewMetrics([review], 1, NOW);
      expect(m.total_reviews).toBe(1);
      expect(m.completed_reviews).toBe(1);
      expect(m.children_reviewed).toBe(1);
      expect(m.review_coverage).toBe(100);
    });

    it("identifyReviewAlerts handles a single overdue review", () => {
      const review = makeLacReview({ status: "overdue" });
      const alerts = identifyReviewAlerts([review], 1, NOW);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("review_overdue");
    });
  });

  describe("large datasets", () => {
    it("computeReviewMetrics handles 500 reviews", () => {
      const reviews: LacReview[] = [];
      for (let i = 0; i < 500; i++) {
        reviews.push(
          makeLacReview({
            child_id: `child-${i % 50}`,
            status: i % 3 === 0 ? "completed" : "scheduled",
            review_type: i % 2 === 0 ? "subsequent" : "initial",
          }),
        );
      }
      const m = computeReviewMetrics(reviews, 50, NOW);
      expect(m.total_reviews).toBe(500);
      expect(m.children_reviewed).toBeGreaterThan(0);
      expect(m.children_reviewed).toBeLessThanOrEqual(50);
    });

    it("identifyReviewAlerts handles many overdue reviews", () => {
      const reviews: LacReview[] = [];
      for (let i = 0; i < 100; i++) {
        reviews.push(makeLacReview({ status: "overdue" }));
      }
      const alerts = identifyReviewAlerts(reviews, 100, NOW);
      expect(alerts).toHaveLength(100);
    });
  });

  describe("totalChildren = 0", () => {
    it("review_coverage returns 0 when totalChildren is 0", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_id: "child-1" }),
      ];
      const m = computeReviewMetrics(reviews, 0, NOW);
      expect(m.review_coverage).toBe(0);
    });

    it("does not throw with totalChildren = 0", () => {
      expect(() =>
        computeReviewMetrics([makeLacReview()], 0, NOW),
      ).not.toThrow();
    });
  });

  describe("empty recommendations and actions_agreed arrays", () => {
    it("computeReviewMetrics works with empty recommendations", () => {
      const review = makeLacReview({
        status: "completed",
        recommendations: [],
        actions_agreed: [],
      });
      const m = computeReviewMetrics([review], 5, NOW);
      expect(m.total_reviews).toBe(1);
      expect(m.completed_reviews).toBe(1);
    });

    it("identifyReviewAlerts works with empty recommendations", () => {
      const review = makeLacReview({
        status: "overdue",
        recommendations: [],
        actions_agreed: [],
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.some((a) => a.type === "review_overdue")).toBe(true);
    });
  });

  describe("date boundary precision for 14-day window", () => {
    it("review exactly on day 13 from now is within window", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-26", // 13 days from NOW
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.some((a) => a.type === "review_upcoming")).toBe(true);
    });

    it("review on day 1 from now is within window", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-14", // 1 day from NOW
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.some((a) => a.type === "review_upcoming")).toBe(true);
    });

    it("review exactly on NOW date is within window (>= now)", () => {
      const review = makeLacReview({
        status: "scheduled",
        review_date: "2026-05-13",
      });
      const alerts = identifyReviewAlerts([review], 5, NOW);
      expect(alerts.some((a) => a.type === "review_upcoming")).toBe(true);
    });
  });

  describe("type safety checks", () => {
    it("makeLacReview factory produces valid LacReview", () => {
      const review = makeLacReview();
      expect(review.id).toBeDefined();
      expect(typeof review.id).toBe("string");
      expect(review.home_id).toBe("home-1");
      expect(review.child_name).toBe("Alice Smith");
      expect(review.child_id).toBe("child-1");
      expect(typeof review.review_date).toBe("string");
      expect(typeof review.within_timescale).toBe("boolean");
      expect(typeof review.child_views_recorded).toBe("boolean");
      expect(typeof review.parent_attended).toBe("boolean");
      expect(typeof review.social_worker_attended).toBe("boolean");
      expect(typeof review.key_worker_attended).toBe("boolean");
      expect(typeof review.placement_stability_discussed).toBe("boolean");
      expect(typeof review.permanence_plan_reviewed).toBe("boolean");
      expect(typeof review.health_reviewed).toBe("boolean");
      expect(typeof review.education_reviewed).toBe("boolean");
      expect(Array.isArray(review.recommendations)).toBe(true);
      expect(Array.isArray(review.actions_agreed)).toBe(true);
    });

    it("each factory call produces a unique id", () => {
      const a = makeLacReview();
      const b = makeLacReview();
      expect(a.id).not.toBe(b.id);
    });

    it("computeReviewMetrics returns all 20 expected fields", () => {
      const m = computeReviewMetrics([], 0, NOW);
      const keys = Object.keys(m);
      expect(keys).toHaveLength(20);
      expect(keys).toContain("total_reviews");
      expect(keys).toContain("completed_reviews");
      expect(keys).toContain("overdue_reviews");
      expect(keys).toContain("scheduled_reviews");
      expect(keys).toContain("within_timescale_rate");
      expect(keys).toContain("child_participation_rate");
      expect(keys).toContain("child_views_recorded_rate");
      expect(keys).toContain("parent_attendance_rate");
      expect(keys).toContain("plan_endorsed_count");
      expect(keys).toContain("plan_amended_count");
      expect(keys).toContain("escalation_count");
      expect(keys).toContain("children_reviewed");
      expect(keys).toContain("review_coverage");
      expect(keys).toContain("placement_stability_rate");
      expect(keys).toContain("health_reviewed_rate");
      expect(keys).toContain("education_reviewed_rate");
      expect(keys).toContain("by_type");
      expect(keys).toContain("by_outcome");
      expect(keys).toContain("by_participation");
      expect(keys).toContain("by_status");
    });

    it("identifyReviewAlerts returns array of objects with required fields", () => {
      const review = makeLacReview({ status: "overdue" });
      const alerts = identifyReviewAlerts([review], 5, NOW);
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
  });

  describe("all same status scenarios", () => {
    it("all completed reviews: by_status has only completed key", () => {
      const reviews = [
        makeLacReview({ status: "completed" }),
        makeLacReview({ status: "completed" }),
      ];
      const m = computeReviewMetrics(reviews, 5, NOW);
      expect(Object.keys(m.by_status)).toEqual(["completed"]);
      expect(m.by_status.completed).toBe(2);
    });

    it("all overdue reviews: overdue_reviews equals total_reviews", () => {
      const reviews = [
        makeLacReview({ status: "overdue" }),
        makeLacReview({ status: "overdue" }),
        makeLacReview({ status: "overdue" }),
      ];
      const m = computeReviewMetrics(reviews, 5, NOW);
      expect(m.overdue_reviews).toBe(m.total_reviews);
    });

    it("all scheduled reviews: completed_reviews is 0", () => {
      const reviews = [
        makeLacReview({ status: "scheduled", review_date: "2026-06-01" }),
        makeLacReview({ status: "scheduled", review_date: "2026-06-15" }),
      ];
      const m = computeReviewMetrics(reviews, 5, NOW);
      expect(m.completed_reviews).toBe(0);
      expect(m.within_timescale_rate).toBe(0);
      expect(m.child_participation_rate).toBe(0);
    });
  });

  describe("null outcome handling", () => {
    it("null outcome is excluded from by_outcome", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: null }),
      ];
      const m = computeReviewMetrics(reviews, 5, NOW);
      expect(m.by_outcome).toEqual({});
    });

    it("null outcome does not count toward plan_endorsed_count", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: null }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).plan_endorsed_count).toBe(0);
    });

    it("null outcome does not count toward plan_amended_count", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: null }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).plan_amended_count).toBe(0);
    });

    it("null outcome does not count toward escalation_count", () => {
      const reviews = [
        makeLacReview({ status: "completed", outcome: null }),
      ];
      expect(computeReviewMetrics(reviews, 5, NOW).escalation_count).toBe(0);
    });
  });

  describe("mixed review types in by_type", () => {
    it("counts all 6 review types correctly", () => {
      const reviews = [
        makeLacReview({ review_type: "initial" }),
        makeLacReview({ review_type: "second" }),
        makeLacReview({ review_type: "subsequent" }),
        makeLacReview({ review_type: "additional" }),
        makeLacReview({ review_type: "disruption" }),
        makeLacReview({ review_type: "pre_discharge" }),
      ];
      const m = computeReviewMetrics(reviews, 5, NOW);
      expect(Object.keys(m.by_type).length).toBe(6);
      expect(m.by_type.initial).toBe(1);
      expect(m.by_type.second).toBe(1);
      expect(m.by_type.subsequent).toBe(1);
      expect(m.by_type.additional).toBe(1);
      expect(m.by_type.disruption).toBe(1);
      expect(m.by_type.pre_discharge).toBe(1);
    });
  });

  describe("coverage exceeding 100%", () => {
    it("review_coverage can exceed 100 if more unique children reviewed than totalChildren", () => {
      const reviews = [
        makeLacReview({ status: "completed", child_id: "child-1" }),
        makeLacReview({ status: "completed", child_id: "child-2" }),
        makeLacReview({ status: "completed", child_id: "child-3" }),
      ];
      const m = computeReviewMetrics(reviews, 2, NOW);
      expect(m.review_coverage).toBe(150);
    });
  });
});
