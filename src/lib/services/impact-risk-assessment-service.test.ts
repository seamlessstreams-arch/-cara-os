import { describe, it, expect } from "vitest";
import {
  computeAssessmentMetrics,
  identifyAssessmentAlerts,
  type ImpactAssessment,
} from "./impact-risk-assessment-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeAssessment(overrides: Partial<ImpactAssessment> = {}): ImpactAssessment {
  return {
    id: "a-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    referral_date: "2026-04-01",
    assessment_date: "2026-04-15",
    assessed_by: "Manager A",
    status: "completed",
    overall_risk_level: "low",
    compatibility_factors: [],
    impact_areas: [],
    mitigations: [],
    existing_children_consulted: true,
    existing_children_views: "Positive",
    staff_consulted: true,
    staff_views: "Supportive",
    recommendation: "accept",
    conditions: null,
    approved_by: "Director A",
    approval_date: "2026-04-20",
    review_date: "2026-07-01",
    notes: null,
    created_at: "2026-04-15T10:00:00Z",
    updated_at: "2026-04-15T10:00:00Z",
    ...overrides,
  };
}

describe("computeAssessmentMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeAssessmentMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.completed_assessments).toBe(0);
    expect(m.pending_assessments).toBe(0);
    expect(m.accepted).toBe(0);
    expect(m.rejected).toBe(0);
    expect(m.avg_risk_level).toBeNull();;
    expect(m.high_risk_count).toBe(0);
    expect(m.children_consulted_rate).toBeNull();;
    expect(m.staff_consulted_rate).toBeNull();;
    expect(m.open_mitigations).toBe(0);
  });

  it("counts correctly for populated data", () => {
    const assessments = [
      makeAssessment({ id: "a1", overall_risk_level: "high", recommendation: "accept_with_conditions", status: "approved", mitigations: [{ risk: "R1", mitigation: "M1", responsible_person: "P1", status: "identified", review_date: "2026-06-01" }] }),
      makeAssessment({ id: "a2", overall_risk_level: "very_high", recommendation: "reject", status: "rejected", existing_children_consulted: false }),
      makeAssessment({ id: "a3", overall_risk_level: "low", recommendation: "accept", status: "draft", staff_consulted: false }),
    ];
    const m = computeAssessmentMetrics(assessments);
    expect(m.total_assessments).toBe(3);
    // completed: approved + rejected + completed = 2
    expect(m.completed_assessments).toBe(2);
    // pending: draft + in_progress = 1
    expect(m.pending_assessments).toBe(1);
    expect(m.accepted).toBe(1);
    expect(m.rejected).toBe(1);
    expect(m.accepted_with_conditions).toBe(1);
    // high risk: high + very_high = 2
    expect(m.high_risk_count).toBe(2);
    // avg risk: (4 + 5 + 2) / 3 = 3.7
    expect(m.avg_risk_level).toBe(3.7);
    // children consulted: 2/3
    expect(m.children_consulted_rate).toBe(66.7);
    // staff consulted: 2/3
    expect(m.staff_consulted_rate).toBe(66.7);
    // open mitigations: 1 (identified)
    expect(m.open_mitigations).toBe(1);
    expect(m.by_risk_level["high"]).toBe(1);
    expect(m.by_risk_level["very_high"]).toBe(1);
    expect(m.by_recommendation["accept"]).toBe(1);
    expect(m.by_recommendation["reject"]).toBe(1);
  });
});

describe("identifyAssessmentAlerts", () => {
  it("returns empty for empty data", () => {
    expect(identifyAssessmentAlerts([], NOW)).toEqual([]);
  });

  it("returns no alerts for compliant assessment", () => {
    expect(identifyAssessmentAlerts([makeAssessment()], NOW)).toEqual([]);
  });

  it("fires critical very_high_risk alert", () => {
    const assessments = [makeAssessment({ overall_risk_level: "very_high" })];
    const alerts = identifyAssessmentAlerts(assessments, NOW);
    const found = alerts.find((a) => a.type === "very_high_risk");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high high_risk alert", () => {
    const assessments = [makeAssessment({ overall_risk_level: "high" })];
    const alerts = identifyAssessmentAlerts(assessments, NOW);
    const found = alerts.find((a) => a.type === "high_risk");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires high children_not_consulted when not draft and children not consulted", () => {
    const assessments = [makeAssessment({ existing_children_consulted: false, status: "completed" })];
    const alerts = identifyAssessmentAlerts(assessments, NOW);
    const found = alerts.find((a) => a.type === "children_not_consulted");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("does NOT fire children_not_consulted for draft status", () => {
    const assessments = [makeAssessment({ existing_children_consulted: false, status: "draft" })];
    const alerts = identifyAssessmentAlerts(assessments, NOW);
    expect(alerts.find((a) => a.type === "children_not_consulted")).toBeUndefined();
  });

  it("fires medium staff_not_consulted", () => {
    const assessments = [makeAssessment({ staff_consulted: false, status: "completed" })];
    const alerts = identifyAssessmentAlerts(assessments, NOW);
    expect(alerts.find((a) => a.type === "staff_not_consulted")!.severity).toBe("medium");
  });

  it("fires medium review_overdue when review_date is past and not rejected", () => {
    const assessments = [makeAssessment({ review_date: "2026-01-01", status: "completed" })];
    const alerts = identifyAssessmentAlerts(assessments, NOW);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeDefined();
  });

  it("does NOT fire review_overdue for rejected assessments", () => {
    const assessments = [makeAssessment({ review_date: "2026-01-01", status: "rejected" })];
    const alerts = identifyAssessmentAlerts(assessments, NOW);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
  });

  it("fires high mitigations_outstanding for approved assessment with open mitigations", () => {
    const assessments = [makeAssessment({
      status: "approved",
      mitigations: [
        { risk: "R1", mitigation: "M1", responsible_person: "P1", status: "identified", review_date: "2026-06-01" },
      ],
    })];
    const alerts = identifyAssessmentAlerts(assessments, NOW);
    const found = alerts.find((a) => a.type === "mitigations_outstanding");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });
});
