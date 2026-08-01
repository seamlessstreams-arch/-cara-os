import { describe, it, expect } from "vitest";
import {
  computeChildrensProgressMetrics,
  identifyChildrensProgressAlerts,
} from "./childrens-progress-tracking-service";
import type { ChildrensProgressTrackingRecord } from "./childrens-progress-tracking-service";

// -- Factory Function ---------------------------------------------------------

function makeRecord(overrides: Partial<ChildrensProgressTrackingRecord> = {}): ChildrensProgressTrackingRecord {
  return {
    id: "prog-1",
    home_id: "home-1",
    outcome_domain: "education_learning",
    progress_rating: "good_progress",
    assessment_tool: "observation",
    review_period: "monthly",
    assessment_date: "2026-05-10",
    child_name: "Alex",
    child_id: "c1",
    baseline_established: true,
    targets_set: true,
    targets_smart: true,
    child_involved: true,
    social_worker_informed: true,
    parent_informed: true,
    evidence_documented: true,
    care_plan_updated: true,
    celebration_planned: false,
    barriers_identified: false,
    support_in_place: true,
    multi_agency_input: false,
    issues_found: [],
    actions_taken: [],
    assessed_by: "staff-1",
    current_score: 7,
    previous_score: 5,
    next_review_date: "2026-06-10",
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeChildrensProgressMetrics ------------------------------------------

describe("computeChildrensProgressMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeChildrensProgressMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.significant_progress_count).toBe(0);
    expect(m.regression_count).toBe(0);
    expect(m.positive_progress_rate).toBeNull();;
    expect(m.baseline_established_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes populated metrics correctly", () => {
    const records = [
      makeRecord({ progress_rating: "significant_progress", child_name: "Alex" }),
      makeRecord({ id: "p2", progress_rating: "good_progress", child_name: "Beth" }),
      makeRecord({ id: "p3", progress_rating: "some_progress", child_name: "Chris" }),
      makeRecord({
        id: "p4",
        progress_rating: "regression",
        child_name: "Dana",
        baseline_established: false,
        child_involved: false,
        evidence_documented: false,
      }),
    ];
    const m = computeChildrensProgressMetrics(records);

    expect(m.total_assessments).toBe(4);
    expect(m.significant_progress_count).toBe(1);
    expect(m.good_progress_count).toBe(1);
    expect(m.some_progress_count).toBe(1);
    expect(m.regression_count).toBe(1);
    expect(m.no_change_count).toBe(0);
    // 3/4 positive = 75%
    expect(m.positive_progress_rate).toBe(75);
    // 3/4 baseline established
    expect(m.baseline_established_rate).toBe(75);
    // 3/4 child involved
    expect(m.child_involved_rate).toBe(75);
    // 3/4 evidence documented
    expect(m.evidence_documented_rate).toBe(75);
    expect(m.unique_children).toBe(4);
    expect(m.by_progress_rating).toEqual({
      significant_progress: 1,
      good_progress: 1,
      some_progress: 1,
      regression: 1,
    });
  });

  it("computes breakdowns by domain and tool", () => {
    const records = [
      makeRecord({ outcome_domain: "education_learning", assessment_tool: "sdq" }),
      makeRecord({ id: "p2", outcome_domain: "emotional_wellbeing", assessment_tool: "sdq" }),
      makeRecord({ id: "p3", outcome_domain: "education_learning", assessment_tool: "observation" }),
    ];
    const m = computeChildrensProgressMetrics(records);
    expect(m.by_outcome_domain).toEqual({ education_learning: 2, emotional_wellbeing: 1 });
    expect(m.by_assessment_tool).toEqual({ sdq: 2, observation: 1 });
  });
});

// -- identifyChildrensProgressAlerts ------------------------------------------

describe("identifyChildrensProgressAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyChildrensProgressAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("fires regression_detected for regression rating", () => {
    const records = [makeRecord({ progress_rating: "regression" })];
    const alerts = identifyChildrensProgressAlerts(records);
    expect(alerts.some((a) => a.type === "regression_detected" && a.severity === "critical")).toBe(true);
  });

  it("fires no_baseline when >= 1 assessment has no baseline", () => {
    const records = [makeRecord({ baseline_established: false })];
    const alerts = identifyChildrensProgressAlerts(records);
    expect(alerts.some((a) => a.type === "no_baseline" && a.severity === "high")).toBe(true);
  });

  it("fires child_not_involved when >= 2 assessments without child involvement", () => {
    const records = [
      makeRecord({ id: "p1", child_involved: false }),
      makeRecord({ id: "p2", child_involved: false }),
    ];
    const alerts = identifyChildrensProgressAlerts(records);
    expect(alerts.some((a) => a.type === "child_not_involved" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire child_not_involved when only 1 assessment without child involvement", () => {
    const records = [makeRecord({ child_involved: false })];
    const alerts = identifyChildrensProgressAlerts(records);
    expect(alerts.some((a) => a.type === "child_not_involved")).toBe(false);
  });

  it("fires evidence_not_documented when >= 2 without evidence", () => {
    const records = [
      makeRecord({ id: "p1", evidence_documented: false }),
      makeRecord({ id: "p2", evidence_documented: false }),
    ];
    const alerts = identifyChildrensProgressAlerts(records);
    expect(alerts.some((a) => a.type === "evidence_not_documented" && a.severity === "medium")).toBe(true);
  });

  it("fires targets_not_smart when >= 3 assessments with targets_set but not SMART", () => {
    const records = [
      makeRecord({ id: "p1", targets_set: true, targets_smart: false }),
      makeRecord({ id: "p2", targets_set: true, targets_smart: false }),
      makeRecord({ id: "p3", targets_set: true, targets_smart: false }),
    ];
    const alerts = identifyChildrensProgressAlerts(records);
    expect(alerts.some((a) => a.type === "targets_not_smart" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire targets_not_smart when only 2 assessments with non-SMART targets", () => {
    const records = [
      makeRecord({ id: "p1", targets_set: true, targets_smart: false }),
      makeRecord({ id: "p2", targets_set: true, targets_smart: false }),
    ];
    const alerts = identifyChildrensProgressAlerts(records);
    expect(alerts.some((a) => a.type === "targets_not_smart")).toBe(false);
  });
});
