import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateFamilyReunification,
  type FamilyReunificationRow,
} from "./family-reunification-service";

function makeRow(overrides: Partial<FamilyReunificationRow> = {}): FamilyReunificationRow {
  return {
    id: "fr-1",
    home_id: "home-1",
    child_name: "Child A",
    record_date: "2026-05-01",
    social_worker_name: "SW Smith",
    planning_stage: "Initial Assessment",
    family_member: "Mother",
    relationship: "Mother",
    risk_assessment_current: true,
    safeguarding_cleared: true,
    child_views_obtained: true,
    child_wishes_to_return: true,
    family_support_services: true,
    parenting_assessment_completed: true,
    home_suitable: true,
    local_authority_support_plan: true,
    school_transition_planned: true,
    health_services_transferred: false,
    independent_reviewing_officer_consulted: true,
    legal_advice_obtained: false,
    court_order_status: null,
    estimated_return_date: null,
    actual_return_date: null,
    post_return_monitoring_weeks: null,
    status: "Active Planning",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.risk_assessment_rate).toBeNull(); // fab-0.
    expect(m.safeguarding_cleared_rate).toBeNull(); // fab-0.
    expect(m.child_views_rate).toBeNull(); // fab-0.
    expect(m.successful_reunification_count).toBe(0);
    expect(m.failed_reunification_count).toBe(0);
    expect(m.success_rate).toBeNull(); // fab-0.
    expect(m.active_planning_count).toBe(0);
    expect(m.on_hold_count).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const rows: FamilyReunificationRow[] = [
      makeRow({ id: "r1", status: "Reunification Successful", actual_return_date: "2026-05-15", post_return_monitoring_weeks: 12, planning_stage: "Post-Reunification Support" }),
      makeRow({ id: "r2", status: "Reunification Failed", child_name: "Child B", relationship: "Father" }),
      makeRow({ id: "r3", status: "Active Planning", child_views_obtained: false }),
      makeRow({ id: "r4", status: "On Hold", relationship: "Grandparent" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(4);
    expect(m.successful_reunification_count).toBe(1);
    expect(m.failed_reunification_count).toBe(1);
    // success_rate: 1 / (1+1) = 50%
    expect(m.success_rate).toBe(50);
    expect(m.active_planning_count).toBe(1);
    expect(m.on_hold_count).toBe(1);
    // unique_children: "Child A" (3 rows) + "Child B" (1 row) = 2
    expect(m.unique_children).toBe(2);
    // risk_assessment_rate: 4/4 = 100%
    expect(m.risk_assessment_rate).toBe(100);
    // child_views_rate: 3/4 = 75%
    expect(m.child_views_rate).toBe(75);
    // parent_return_count: Mother(3) + Father(1) = 4 (of parent relationships)
    expect(m.parent_return_count).toBe(3); // Mother x3
    // extended_family_return_count: Grandparent x1
    expect(m.extended_family_return_count).toBe(1);
    // post_return_monitoring_rate: r1 has monitoring / 1 post-return row = 100%
    expect(m.post_return_monitoring_rate).toBe(100);
    // by_status
    expect(m.by_status["Reunification Successful"]).toBe(1);
    expect(m.by_status["Active Planning"]).toBe(1);
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("generates critical alert for trial stage without risk assessment", () => {
    const rows = [makeRow({ planning_stage: "Overnight Stay Trial", risk_assessment_current: false })];
    const alerts = computeAlerts(rows);
    const noRisk = alerts.filter((a) => a.type === "no_risk_assessment_trial_decision");
    expect(noRisk).toHaveLength(1);
    expect(noRisk[0].severity).toBe("critical");
  });

  it("generates critical alert for decision stage without safeguarding clearance", () => {
    const rows = [makeRow({ planning_stage: "Reunification Decision", safeguarding_cleared: false })];
    const alerts = computeAlerts(rows);
    const noSafeguarding = alerts.filter((a) => a.type === "no_safeguarding_clearance");
    expect(noSafeguarding).toHaveLength(1);
    expect(noSafeguarding[0].severity).toBe("critical");
  });

  it("generates critical alert for breakdown — return to care", () => {
    const rows = [makeRow({ planning_stage: "Breakdown — Return to Care" })];
    const alerts = computeAlerts(rows);
    const breakdown = alerts.filter((a) => a.type === "reunification_breakdown");
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].severity).toBe("critical");
  });

  it("generates critical alert for decision stage without child views", () => {
    const rows = [makeRow({ planning_stage: "Transition Plan", child_views_obtained: false })];
    const alerts = computeAlerts(rows);
    const noViews = alerts.filter((a) => a.type === "no_child_views_decision");
    expect(noViews).toHaveLength(1);
    expect(noViews[0].severity).toBe("critical");
  });

  it("generates high alert for decision stage without IRO consultation", () => {
    const rows = [makeRow({ planning_stage: "Reunification Decision", independent_reviewing_officer_consulted: false })];
    const alerts = computeAlerts(rows);
    const noIro = alerts.filter((a) => a.type === "no_iro_decision");
    expect(noIro).toHaveLength(1);
    expect(noIro[0].severity).toBe("high");
  });

  it("generates high alert for trial stage without parenting assessment", () => {
    const rows = [makeRow({ planning_stage: "Extended Stay Trial", parenting_assessment_completed: false })];
    const alerts = computeAlerts(rows);
    const noPa = alerts.filter((a) => a.type === "no_parenting_assessment");
    expect(noPa).toHaveLength(1);
    expect(noPa[0].severity).toBe("high");
  });

  it("generates high alert for court order without legal advice", () => {
    const rows = [makeRow({ court_order_status: "Full Care Order", legal_advice_obtained: false })];
    const alerts = computeAlerts(rows);
    const noLegal = alerts.filter((a) => a.type === "court_order_no_legal_advice");
    expect(noLegal).toHaveLength(1);
    expect(noLegal[0].severity).toBe("high");
  });

  it("generates medium alert for successful reunification with no monitoring", () => {
    const rows = [makeRow({ status: "Reunification Successful", post_return_monitoring_weeks: null })];
    const alerts = computeAlerts(rows);
    const noMonitoring = alerts.filter((a) => a.type === "no_post_return_monitoring");
    expect(noMonitoring).toHaveLength(1);
    expect(noMonitoring[0].severity).toBe("medium");
  });
});

describe("validateFamilyReunification", () => {
  it("validates a correct input", () => {
    const result = validateFamilyReunification({
      childName: "Child A",
      recordDate: "2026-05-01",
      socialWorkerName: "SW Smith",
      planningStage: "Initial Assessment",
      familyMember: "Mother",
      relationship: "Mother",
      status: "Active Planning",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails with missing required fields", () => {
    const result = validateFamilyReunification({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("fails for trial stage without risk assessment and safeguarding", () => {
    const result = validateFamilyReunification({
      childName: "Child A",
      recordDate: "2026-05-01",
      socialWorkerName: "SW Smith",
      planningStage: "Overnight Stay Trial",
      familyMember: "Mother",
      relationship: "Mother",
      riskAssessmentCurrent: false,
      safeguardingCleared: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("risk assessment") || e.includes("safeguarding"))).toBe(true);
  });

  it("fails for reunification decision without child views", () => {
    const result = validateFamilyReunification({
      childName: "Child A",
      recordDate: "2026-05-01",
      socialWorkerName: "SW Smith",
      planningStage: "Reunification Decision",
      familyMember: "Mother",
      relationship: "Mother",
      childViewsObtained: false,
      homeSuitable: true,
      independentReviewingOfficerConsulted: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("child's views"))).toBe(true);
  });
});
