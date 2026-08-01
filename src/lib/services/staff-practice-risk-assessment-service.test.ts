import { describe, it, expect } from "vitest";
import {
  computePracticeRiskMetrics,
  identifyPracticeRiskAlerts,
} from "./staff-practice-risk-assessment-service";
import type { StaffPracticeRiskAssessmentRecord } from "./staff-practice-risk-assessment-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffPracticeRiskAssessmentRecord> = {}): StaffPracticeRiskAssessmentRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    staff_name: "Alice Smith",
    staff_id: null,
    risk_area: "lone_working",
    likelihood: "unlikely",
    impact_severity: "minor",
    assessment_status: "active",
    session_date: "2026-04-01",
    assessed_by: "Manager A",
    identified_concern: "Lone working during evenings",
    evidence_summary: "Rota shows single cover Tues/Thurs evenings",
    children_affected: null,
    protective_factors: null,
    support_controls: null,
    management_controls: null,
    restrictions: null,
    decision_rationale: null,
    staff_comment: null,
    approved_by: null,
    approved_at: null,
    evidence_verified: true,
    staff_notified: true,
    staff_commented: true,
    protective_factors_identified: true,
    support_controls_set: true,
    management_controls_set: true,
    review_date_set: true,
    approved_by_senior: true,
    children_safeguarded: true,
    alternative_explanations_considered: true,
    proportionate_response: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePracticeRiskMetrics -----------------------------------------------

describe("computePracticeRiskMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computePracticeRiskMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.severe_impact_count).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.unapproved_count).toBe(0);
    expect(m.evidence_verified_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts risk levels correctly", () => {
    const records = [
      makeRecord({ id: "1", likelihood: "likely", impact_severity: "major" }),
      makeRecord({ id: "2", likelihood: "very_likely", impact_severity: "severe" }),
      makeRecord({ id: "3", likelihood: "unlikely", impact_severity: "minor" }),
      makeRecord({ id: "4", likelihood: "possible", impact_severity: "moderate", assessment_status: "draft", approved_by_senior: false }),
    ];
    const m = computePracticeRiskMetrics(records);
    expect(m.total_assessments).toBe(4);
    expect(m.high_risk_count).toBe(2); // likely + very_likely
    expect(m.severe_impact_count).toBe(2); // major + severe
    expect(m.unapproved_count).toBe(1);
  });

  it("counts active assessments", () => {
    const records = [
      makeRecord({ id: "1", assessment_status: "active" }),
      makeRecord({ id: "2", assessment_status: "closed" }),
      makeRecord({ id: "3", assessment_status: "active" }),
    ];
    const m = computePracticeRiskMetrics(records);
    expect(m.active_count).toBe(2);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", evidence_verified: true, staff_notified: true }),
      makeRecord({ id: "2", evidence_verified: false, staff_notified: false }),
    ];
    const m = computePracticeRiskMetrics(records);
    expect(m.evidence_verified_rate).toBe(50);
    expect(m.staff_notified_rate).toBe(50);
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Alice" }),
      makeRecord({ id: "2", staff_name: "Bob" }),
      makeRecord({ id: "3", staff_name: "Alice" }),
    ];
    const m = computePracticeRiskMetrics(records);
    expect(m.unique_staff).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", risk_area: "lone_working", likelihood: "likely" }),
      makeRecord({ id: "2", risk_area: "medication", likelihood: "likely" }),
      makeRecord({ id: "3", risk_area: "lone_working", likelihood: "unlikely" }),
    ];
    const m = computePracticeRiskMetrics(records);
    expect(m.by_risk_area).toEqual({ lone_working: 2, medication: 1 });
    expect(m.by_likelihood).toEqual({ likely: 2, unlikely: 1 });
  });

  it("returns 100% rates when all booleans true", () => {
    const records = [makeRecord(), makeRecord({ id: "2" })];
    const m = computePracticeRiskMetrics(records);
    expect(m.staff_commented_rate).toBe(100);
    expect(m.protective_factors_rate).toBe(100);
    expect(m.support_controls_rate).toBe(100);
    expect(m.management_controls_rate).toBe(100);
    expect(m.review_date_rate).toBe(100);
    expect(m.approved_rate).toBe(100);
    expect(m.children_safeguarded_rate).toBe(100);
    expect(m.alternatives_considered_rate).toBe(100);
    expect(m.proportionate_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });
});

// -- identifyPracticeRiskAlerts -----------------------------------------------

describe("identifyPracticeRiskAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(identifyPracticeRiskAlerts([])).toEqual([]);
  });

  it("returns no alerts for low-risk fully-handled records", () => {
    const alerts = identifyPracticeRiskAlerts([makeRecord()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical for high likelihood + severe impact", () => {
    const records = [
      makeRecord({ id: "r1", likelihood: "likely", impact_severity: "major", staff_name: "Alice" }),
    ];
    const alerts = identifyPracticeRiskAlerts(records);
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].type).toBe("high_risk_severe_impact");
  });

  it("fires critical for very_likely + severe impact", () => {
    const records = [
      makeRecord({ id: "r1", likelihood: "very_likely", impact_severity: "severe" }),
    ];
    const alerts = identifyPracticeRiskAlerts(records);
    expect(alerts.filter((a) => a.type === "high_risk_severe_impact").length).toBe(1);
  });

  it("does NOT fire critical for likely + moderate impact", () => {
    const records = [
      makeRecord({ id: "r1", likelihood: "likely", impact_severity: "moderate" }),
    ];
    const alerts = identifyPracticeRiskAlerts(records);
    expect(alerts.filter((a) => a.type === "high_risk_severe_impact").length).toBe(0);
  });

  it("fires high for staff not notified (>= 1)", () => {
    const records = [makeRecord({ id: "r1", staff_notified: false })];
    const alerts = identifyPracticeRiskAlerts(records);
    const match = alerts.filter((a) => a.type === "staff_not_notified");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires high for children not safeguarded (>= 1)", () => {
    const records = [makeRecord({ id: "r1", children_safeguarded: false })];
    const alerts = identifyPracticeRiskAlerts(records);
    const match = alerts.filter((a) => a.type === "children_not_safeguarded");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires medium for no protective factors only when >= 2", () => {
    const one = [makeRecord({ id: "r1", protective_factors_identified: false })];
    expect(identifyPracticeRiskAlerts(one).filter((a) => a.type === "no_protective_factors").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", protective_factors_identified: false }),
      makeRecord({ id: "r2", protective_factors_identified: false }),
    ];
    const alerts = identifyPracticeRiskAlerts(two);
    const match = alerts.filter((a) => a.type === "no_protective_factors");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("fires medium for not proportionate only when >= 2", () => {
    const one = [makeRecord({ id: "r1", proportionate_response: false })];
    expect(identifyPracticeRiskAlerts(one).filter((a) => a.type === "not_proportionate").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", proportionate_response: false }),
      makeRecord({ id: "r2", proportionate_response: false }),
    ];
    const alerts = identifyPracticeRiskAlerts(two);
    const match = alerts.filter((a) => a.type === "not_proportionate");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });
});
