import { describe, it, expect } from "vitest";
import {
  computeReviewOutcomeMetrics,
  identifyReviewOutcomeAlerts,
} from "./staff-review-outcome-service";
import type { StaffReviewOutcomeRecord } from "./staff-review-outcome-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffReviewOutcomeRecord> = {}): StaffReviewOutcomeRecord {
  return {
    id: "ro-1",
    home_id: "home-1",
    staff_name: "Sam Taylor",
    staff_id: "s-1",
    review_type: "supervision",
    review_outcome: "good",
    outcome_status: "finalised",
    follow_up_urgency: "none_required",
    session_date: "2026-04-10",
    reviewed_by: "Manager B",
    strengths_discussed: "Good rapport with children",
    areas_for_development: "Record keeping timeliness",
    agreed_actions: null,
    staff_response: null,
    support_identified: null,
    training_needs: null,
    concerns_raised: null,
    previous_actions_progress: null,
    manager_notes: null,
    approved_by: null,
    approved_at: null,
    next_review_date: null,
    notes: null,
    strengths_acknowledged: true,
    development_discussed: true,
    actions_agreed: true,
    staff_views_recorded: true,
    wellbeing_discussed: true,
    training_needs_identified: true,
    previous_actions_reviewed: true,
    support_offered: true,
    safeguarding_discussed: true,
    record_shared_with_staff: true,
    approved_by_senior: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeReviewOutcomeMetrics ----------------------------------------------

describe("computeReviewOutcomeMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeReviewOutcomeMetrics([]);
    expect(m.total_reviews).toBe(0);
    expect(m.needs_improvement_count).toBe(0);
    expect(m.immediate_followup_count).toBe(0);
    expect(m.disputed_count).toBe(0);
    expect(m.finalised_count).toBe(0);
    expect(m.strengths_acknowledged_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts needs_improvement and unsatisfactory together", () => {
    const records = [
      makeRecord({ id: "1", review_outcome: "needs_improvement" }),
      makeRecord({ id: "2", review_outcome: "unsatisfactory" }),
      makeRecord({ id: "3", review_outcome: "good" }),
    ];
    const m = computeReviewOutcomeMetrics(records);
    expect(m.needs_improvement_count).toBe(2);
  });

  it("counts immediate follow-up", () => {
    const records = [
      makeRecord({ id: "1", follow_up_urgency: "immediate" }),
      makeRecord({ id: "2", follow_up_urgency: "within_week" }),
    ];
    const m = computeReviewOutcomeMetrics(records);
    expect(m.immediate_followup_count).toBe(1);
  });

  it("counts disputed and under_appeal together", () => {
    const records = [
      makeRecord({ id: "1", outcome_status: "disputed" }),
      makeRecord({ id: "2", outcome_status: "under_appeal" }),
      makeRecord({ id: "3", outcome_status: "agreed" }),
    ];
    const m = computeReviewOutcomeMetrics(records);
    expect(m.disputed_count).toBe(2);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", strengths_acknowledged: true, staff_views_recorded: false }),
      makeRecord({ id: "2", strengths_acknowledged: false, staff_views_recorded: false }),
    ];
    const m = computeReviewOutcomeMetrics(records);
    expect(m.strengths_acknowledged_rate).toBe(50);
    expect(m.staff_views_rate).toBe(0);
  });

  it("builds breakdown records", () => {
    const records = [
      makeRecord({ id: "1", review_type: "supervision", review_outcome: "good", outcome_status: "finalised", follow_up_urgency: "none_required" }),
      makeRecord({ id: "2", review_type: "annual_appraisal", review_outcome: "excellent", outcome_status: "agreed", follow_up_urgency: "immediate" }),
    ];
    const m = computeReviewOutcomeMetrics(records);
    expect(m.by_review_type).toEqual({ supervision: 1, annual_appraisal: 1 });
    expect(m.by_review_outcome).toEqual({ good: 1, excellent: 1 });
    expect(m.by_outcome_status).toEqual({ finalised: 1, agreed: 1 });
    expect(m.by_follow_up_urgency).toEqual({ none_required: 1, immediate: 1 });
  });
});

// -- identifyReviewOutcomeAlerts ----------------------------------------------

describe("identifyReviewOutcomeAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifyReviewOutcomeAlerts([])).toEqual([]);
  });

  it("fires critical alert for immediate follow-up with unsatisfactory outcome", () => {
    const records = [makeRecord({ follow_up_urgency: "immediate", review_outcome: "unsatisfactory" })];
    const alerts = identifyReviewOutcomeAlerts(records);
    const critical = alerts.filter((a) => a.type === "immediate_unsatisfactory");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("fires critical alert for immediate follow-up with needs_improvement", () => {
    const records = [makeRecord({ follow_up_urgency: "immediate", review_outcome: "needs_improvement" })];
    const alerts = identifyReviewOutcomeAlerts(records);
    expect(alerts.filter((a) => a.type === "immediate_unsatisfactory")).toHaveLength(1);
  });

  it("fires high alert when staff views not recorded (>= 1)", () => {
    const records = [makeRecord({ staff_views_recorded: false })];
    const alerts = identifyReviewOutcomeAlerts(records);
    expect(alerts.some((a) => a.type === "staff_views_not_recorded" && a.severity === "high")).toBe(true);
  });

  it("fires high alert when strengths not acknowledged (>= 1)", () => {
    const records = [makeRecord({ strengths_acknowledged: false })];
    const alerts = identifyReviewOutcomeAlerts(records);
    expect(alerts.some((a) => a.type === "no_strengths_acknowledged" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert when no wellbeing discussed (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", wellbeing_discussed: false }),
      makeRecord({ id: "2", wellbeing_discussed: false }),
    ];
    const alerts = identifyReviewOutcomeAlerts(records);
    expect(alerts.some((a) => a.type === "no_wellbeing_discussed" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire no_wellbeing_discussed at 1 record", () => {
    const records = [makeRecord({ wellbeing_discussed: false })];
    const alerts = identifyReviewOutcomeAlerts(records);
    expect(alerts.some((a) => a.type === "no_wellbeing_discussed")).toBe(false);
  });

  it("fires medium alert when no safeguarding discussed (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", safeguarding_discussed: false }),
      makeRecord({ id: "2", safeguarding_discussed: false }),
    ];
    const alerts = identifyReviewOutcomeAlerts(records);
    expect(alerts.some((a) => a.type === "no_safeguarding_discussed" && a.severity === "medium")).toBe(true);
  });
});
