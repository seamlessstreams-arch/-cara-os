import { describe, it, expect } from "vitest";
import {
  computePlacementMatchingMetrics,
  identifyPlacementMatchingAlerts,
} from "./placement-matching-assessment-service";
import type { PlacementMatchingAssessmentRecord } from "./placement-matching-assessment-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PlacementMatchingAssessmentRecord> = {}): PlacementMatchingAssessmentRecord {
  return {
    id: "pma-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    matching_domain: "peer_dynamics",
    match_quality: "good_match",
    assessment_timing: "pre_admission",
    impact_level: "positive",
    session_date: "2026-05-01",
    assessed_by: "staff-1",
    matching_rationale: "Good peer match",
    evidence_summary: "Evidence gathered",
    peer_group_analysis: null,
    risk_assessment_summary: null,
    child_views_on_placement: null,
    existing_children_views: null,
    staff_views: null,
    improvements_needed: null,
    contingency_plan: null,
    escalation_notes: null,
    approved_by: null,
    approved_at: null,
    next_review_date: null,
    notes: null,
    child_views_sought: true,
    existing_children_consulted: true,
    staff_consulted: true,
    risk_assessment_completed: true,
    impact_on_others_assessed: true,
    cultural_needs_considered: true,
    education_access_confirmed: true,
    health_access_confirmed: true,
    family_contact_feasible: true,
    matching_panel_agreed: true,
    contingency_planned: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePlacementMatchingMetrics ------------------------------------------

describe("computePlacementMatchingMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePlacementMatchingMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.poor_match_count).toBe(0);
    expect(m.negative_impact_count).toBe(0);
    expect(m.unsuitable_count).toBe(0);
    expect(m.pre_admission_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts poor match, unsuitable, and negative impact correctly", () => {
    const records = [
      makeRecord({ id: "1", match_quality: "poor_match", impact_level: "negative" }),
      makeRecord({ id: "2", match_quality: "unsuitable", impact_level: "very_negative" }),
      makeRecord({ id: "3", match_quality: "good_match", impact_level: "positive" }),
    ];
    const m = computePlacementMatchingMetrics(records);
    expect(m.poor_match_count).toBe(2); // poor_match + unsuitable
    expect(m.unsuitable_count).toBe(1);
    expect(m.negative_impact_count).toBe(2); // negative + very_negative
  });

  it("counts pre_admission assessments", () => {
    const records = [
      makeRecord({ id: "1", assessment_timing: "pre_admission" }),
      makeRecord({ id: "2", assessment_timing: "monthly_review" }),
    ];
    const m = computePlacementMatchingMetrics(records);
    expect(m.pre_admission_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", child_views_sought: true, contingency_planned: true }),
      makeRecord({ id: "2", child_views_sought: false, contingency_planned: false }),
    ];
    const m = computePlacementMatchingMetrics(records);
    expect(m.child_views_rate).toBe(50);
    expect(m.contingency_rate).toBe(50);
  });

  it("counts unique children and builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex", matching_domain: "peer_dynamics" }),
      makeRecord({ id: "2", child_name: "Alex", matching_domain: "cultural_match" }),
      makeRecord({ id: "3", child_name: "Beth", matching_domain: "peer_dynamics" }),
    ];
    const m = computePlacementMatchingMetrics(records);
    expect(m.unique_children).toBe(2);
    expect(m.by_matching_domain).toEqual({ peer_dynamics: 2, cultural_match: 1 });
  });
});

// -- identifyPlacementMatchingAlerts ------------------------------------------

describe("identifyPlacementMatchingAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyPlacementMatchingAlerts([])).toEqual([]);
  });

  it("returns no alerts for clean records", () => {
    expect(identifyPlacementMatchingAlerts([makeRecord()])).toEqual([]);
  });

  it("fires unsuitable_negative critical per-record for unsuitable + negative impact", () => {
    const records = [
      makeRecord({ match_quality: "unsuitable", impact_level: "negative" }),
    ];
    const alerts = identifyPlacementMatchingAlerts(records);
    expect(alerts.some((a) => a.type === "unsuitable_negative" && a.severity === "critical")).toBe(true);
  });

  it("fires unsuitable_negative for very_negative impact too", () => {
    const records = [
      makeRecord({ match_quality: "unsuitable", impact_level: "very_negative" }),
    ];
    const alerts = identifyPlacementMatchingAlerts(records);
    expect(alerts.some((a) => a.type === "unsuitable_negative" && a.severity === "critical")).toBe(true);
  });

  it("fires child_views_not_sought high alert when >= 1", () => {
    const records = [makeRecord({ child_views_sought: false })];
    const alerts = identifyPlacementMatchingAlerts(records);
    expect(alerts.some((a) => a.type === "child_views_not_sought" && a.severity === "high")).toBe(true);
  });

  it("fires existing_children_not_consulted high alert when >= 1", () => {
    const records = [makeRecord({ existing_children_consulted: false })];
    const alerts = identifyPlacementMatchingAlerts(records);
    expect(alerts.some((a) => a.type === "existing_children_not_consulted" && a.severity === "high")).toBe(true);
  });

  it("fires no_contingency_planned medium alert only when >= 2", () => {
    const one = [makeRecord({ contingency_planned: false })];
    expect(identifyPlacementMatchingAlerts(one).some((a) => a.type === "no_contingency_planned")).toBe(false);

    const two = [
      makeRecord({ id: "1", contingency_planned: false }),
      makeRecord({ id: "2", contingency_planned: false }),
    ];
    expect(identifyPlacementMatchingAlerts(two).some((a) => a.type === "no_contingency_planned" && a.severity === "medium")).toBe(true);
  });

  it("fires no_risk_assessment medium alert only when >= 2", () => {
    const one = [makeRecord({ risk_assessment_completed: false })];
    expect(identifyPlacementMatchingAlerts(one).some((a) => a.type === "no_risk_assessment")).toBe(false);

    const two = [
      makeRecord({ id: "1", risk_assessment_completed: false }),
      makeRecord({ id: "2", risk_assessment_completed: false }),
    ];
    expect(identifyPlacementMatchingAlerts(two).some((a) => a.type === "no_risk_assessment" && a.severity === "medium")).toBe(true);
  });
});
