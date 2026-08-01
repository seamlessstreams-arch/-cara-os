import { describe, it, expect } from "vitest";
import {
  computeFeedbackMetrics,
  identifyFeedbackAlerts,
} from "./childrens-feedback-service";
import type { ChildrensFeedbackRecord } from "./childrens-feedback-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<ChildrensFeedbackRecord> = {}): ChildrensFeedbackRecord {
  return {
    id: "fb-1",
    home_id: "home-1",
    feedback_type: "satisfaction_survey",
    feedback_date: "2026-05-20",
    satisfaction_rating: "happy",
    response_status: "completed",
    feedback_category: "care_quality",
    child_name: "Alex",
    child_id: "child-1",
    child_chose_method: true,
    child_comfortable_sharing: true,
    anonymous_option_offered: true,
    feedback_discussed_with_child: true,
    changes_implemented: true,
    child_informed_of_outcome: true,
    child_satisfied_with_response: true,
    staff_responsive: true,
    themes_identified: [],
    improvements_suggested: [],
    actions_taken: [],
    issues_found: [],
    collected_by: "Staff A",
    response_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeFeedbackMetrics ----------------------------------------------------

describe("computeFeedbackMetrics", () => {
  it("returns zeroed metrics for empty data", () => {
    const m = computeFeedbackMetrics([]);
    expect(m.total_feedback).toBe(0);
    expect(m.positive_rate).toBeNull();;
    expect(m.negative_rate).toBeNull();;
    expect(m.neutral_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts feedback types", () => {
    const rows = [
      makeRecord({ id: "1", feedback_type: "satisfaction_survey" }),
      makeRecord({ id: "2", feedback_type: "feedback_session" }),
      makeRecord({ id: "3", feedback_type: "suggestion_box" }),
    ];
    const m = computeFeedbackMetrics(rows);
    expect(m.survey_count).toBe(1);
    expect(m.session_count).toBe(1);
    expect(m.suggestion_count).toBe(1);
  });

  it("calculates positive, negative, and neutral counts", () => {
    const rows = [
      makeRecord({ id: "1", satisfaction_rating: "very_happy" }),
      makeRecord({ id: "2", satisfaction_rating: "happy" }),
      makeRecord({ id: "3", satisfaction_rating: "neutral" }),
      makeRecord({ id: "4", satisfaction_rating: "unhappy" }),
      makeRecord({ id: "5", satisfaction_rating: "very_unhappy" }),
    ];
    const m = computeFeedbackMetrics(rows);
    expect(m.positive_rate).toBe(40);
    expect(m.negative_rate).toBe(40);
    expect(m.neutral_count).toBe(1);
  });

  it("calculates response status counts", () => {
    const rows = [
      makeRecord({ id: "1", response_status: "completed" }),
      makeRecord({ id: "2", response_status: "pending" }),
      makeRecord({ id: "3", response_status: "not_actioned" }),
      makeRecord({ id: "4", response_status: "pending" }),
    ];
    const m = computeFeedbackMetrics(rows);
    expect(m.completed_rate).toBe(25);
    expect(m.pending_count).toBe(2);
    expect(m.not_actioned_count).toBe(1);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRecord({ id: "1", child_chose_method: true, staff_responsive: true }),
      makeRecord({ id: "2", child_chose_method: false, staff_responsive: false }),
    ];
    const m = computeFeedbackMetrics(rows);
    expect(m.child_chose_method_rate).toBe(50);
    expect(m.staff_responsive_rate).toBe(50);
  });

  it("builds breakdowns", () => {
    const rows = [
      makeRecord({ id: "1", feedback_type: "satisfaction_survey", satisfaction_rating: "happy", response_status: "completed", feedback_category: "care_quality" }),
      makeRecord({ id: "2", feedback_type: "suggestion_box", satisfaction_rating: "unhappy", response_status: "pending", feedback_category: "food_mealtimes" }),
    ];
    const m = computeFeedbackMetrics(rows);
    expect(m.by_feedback_type).toEqual({ satisfaction_survey: 1, suggestion_box: 1 });
    expect(m.by_satisfaction_rating).toEqual({ happy: 1, unhappy: 1 });
    expect(m.by_response_status).toEqual({ completed: 1, pending: 1 });
    expect(m.by_feedback_category).toEqual({ care_quality: 1, food_mealtimes: 1 });
  });
});

// -- identifyFeedbackAlerts ----------------------------------------------------

describe("identifyFeedbackAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyFeedbackAlerts([])).toEqual([]);
  });

  it("critical: very unhappy feedback (per-record)", () => {
    const row = makeRecord({ id: "vu1", satisfaction_rating: "very_unhappy" });
    const alerts = identifyFeedbackAlerts([row]);
    const matched = alerts.filter((a) => a.type === "very_unhappy");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("critical");
    expect(matched[0].id).toBe("vu1");
  });

  it("high: not actioned feedback (threshold >= 1)", () => {
    const row = makeRecord({ id: "na1", response_status: "not_actioned" });
    const alerts = identifyFeedbackAlerts([row]);
    const matched = alerts.filter((a) => a.type === "not_actioned");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("high: pending responses (threshold >= 3)", () => {
    // 2 — should NOT trigger
    const alerts2 = identifyFeedbackAlerts([
      makeRecord({ id: "1", response_status: "pending" }),
      makeRecord({ id: "2", response_status: "pending" }),
    ]);
    expect(alerts2.filter((a) => a.type === "pending_responses")).toHaveLength(0);

    // 3 — should trigger
    const alerts3 = identifyFeedbackAlerts([
      makeRecord({ id: "1", response_status: "pending" }),
      makeRecord({ id: "2", response_status: "pending" }),
      makeRecord({ id: "3", response_status: "pending" }),
    ]);
    expect(alerts3.filter((a) => a.type === "pending_responses")).toHaveLength(1);
    expect(alerts3.filter((a) => a.type === "pending_responses")[0].severity).toBe("high");
  });

  it("medium: child not informed of outcome when completed (threshold >= 1)", () => {
    const row = makeRecord({
      id: "ci1",
      response_status: "completed",
      child_informed_of_outcome: false,
    });
    const alerts = identifyFeedbackAlerts([row]);
    const matched = alerts.filter((a) => a.type === "child_not_informed");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });

  it("no child_not_informed alert when status is not completed", () => {
    const row = makeRecord({
      id: "ci2",
      response_status: "pending",
      child_informed_of_outcome: false,
    });
    const alerts = identifyFeedbackAlerts([row]);
    expect(alerts.filter((a) => a.type === "child_not_informed")).toHaveLength(0);
  });

  it("medium: low comfort (threshold >= 3)", () => {
    const alerts = identifyFeedbackAlerts([
      makeRecord({ id: "1", child_comfortable_sharing: false }),
      makeRecord({ id: "2", child_comfortable_sharing: false }),
      makeRecord({ id: "3", child_comfortable_sharing: false }),
    ]);
    const matched = alerts.filter((a) => a.type === "low_comfort");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });
});
