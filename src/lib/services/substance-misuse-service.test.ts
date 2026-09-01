import { describe, it, expect } from "vitest";
import {
  computeSubstanceMisuseMetrics,
  identifySubstanceMisuseAlerts,
} from "./substance-misuse-service";
import type {
  SubstanceAssessment,
  SubstanceIncident,
} from "./substance-misuse-service";

// -- Factories ----------------------------------------------------------------

/** Date string n days ahead — UTC end to end, floating with the clock. */
function daysFromNow(n: number): string {
  const [y, m, d] = new Date().toISOString().slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function makeAssessment(overrides: Partial<SubstanceAssessment> = {}): SubstanceAssessment {
  return {
    id: "sa-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    assessment_date: "2026-05-01",
    assessed_by: "Staff A",
    substance_type: "cannabis",
    risk_level: "moderate",
    frequency: "occasional",
    context: "peer_pressure",
    impact_on_health: null,
    impact_on_behaviour: null,
    impact_on_education: null,
    referral_made: false,
    referral_to: null,
    referral_date: null,
    intervention_plan: "Supportive counselling",
    next_assessment_date: "2026-08-01",
    status: "active",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeIncident(overrides: Partial<SubstanceIncident> = {}): SubstanceIncident {
  return {
    id: "si-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    incident_date: "2026-05-10",
    reported_by: "Staff B",
    substance_type: "cannabis",
    incident_type: "found_substance",
    description: "Found in room",
    location: "Bedroom",
    immediate_action: "Confiscated",
    medical_attention: false,
    police_involved: false,
    social_worker_notified: true,
    parent_notified: true,
    ofsted_notified: false,
    follow_up_actions: [],
    follow_up_date: null,
    follow_up_completed: false,
    created_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeSubstanceMisuseMetrics --------------------------------------------

describe("computeSubstanceMisuseMetrics", () => {
  it("returns zeroes for empty data", () => {
    const r = computeSubstanceMisuseMetrics([], []);
    expect(r.children_assessed).toBe(0);
    expect(r.active_referrals).toBe(0);
    expect(r.incidents_this_quarter).toBe(0);
    expect(r.children_with_intervention_plans).toBe(0);
    expect(r.overdue_assessments).toBe(0);
    expect(r.escalated_count).toBe(0);
  });

  it("counts unique children assessed by child_id", () => {
    const assessments = [
      makeAssessment({ id: "1", child_id: "c1" }),
      makeAssessment({ id: "2", child_id: "c2" }),
      makeAssessment({ id: "3", child_id: "c1" }),
    ];
    expect(computeSubstanceMisuseMetrics(assessments, []).children_assessed).toBe(2);
  });

  it("counts active referrals (referral_made + active/monitoring status)", () => {
    const assessments = [
      makeAssessment({ id: "1", referral_made: true, status: "active" }),
      makeAssessment({ id: "2", referral_made: true, status: "resolved" }),
      makeAssessment({ id: "3", referral_made: false, status: "active" }),
    ];
    expect(computeSubstanceMisuseMetrics(assessments, []).active_referrals).toBe(1);
  });

  it("counts children with intervention plans (active/monitoring with plan)", () => {
    const assessments = [
      makeAssessment({ id: "1", child_id: "c1", intervention_plan: "Plan A", status: "active" }),
      makeAssessment({ id: "2", child_id: "c2", intervention_plan: null, status: "active" }),
      makeAssessment({ id: "3", child_id: "c3", intervention_plan: "Plan C", status: "resolved" }),
    ];
    expect(computeSubstanceMisuseMetrics(assessments, []).children_with_intervention_plans).toBe(1);
  });

  it("counts overdue assessments (past next_assessment_date + active/monitoring)", () => {
    const assessments = [
      makeAssessment({ id: "1", status: "active", next_assessment_date: "2026-01-01" }),
      makeAssessment({ id: "2", status: "active", next_assessment_date: daysFromNow(120) }),
      makeAssessment({ id: "3", status: "resolved", next_assessment_date: "2026-01-01" }),
    ];
    expect(computeSubstanceMisuseMetrics(assessments, []).overdue_assessments).toBe(1);
  });

  it("counts escalated assessments", () => {
    const assessments = [
      makeAssessment({ id: "1", status: "escalated" }),
      makeAssessment({ id: "2", status: "active" }),
    ];
    expect(computeSubstanceMisuseMetrics(assessments, []).escalated_count).toBe(1);
  });

  it("populates by_risk_level, by_substance_type, by_incident_type", () => {
    const assessments = [
      makeAssessment({ id: "1", risk_level: "serious", substance_type: "cannabis" }),
      makeAssessment({ id: "2", risk_level: "low", substance_type: "alcohol" }),
    ];
    const incidents = [
      makeIncident({ id: "i1", incident_type: "found_substance" }),
      makeIncident({ id: "i2", incident_type: "overdose" }),
    ];
    const r = computeSubstanceMisuseMetrics(assessments, incidents);
    expect(r.by_risk_level).toEqual({ serious: 1, low: 1 });
    expect(r.by_substance_type).toEqual({ cannabis: 1, alcohol: 1 });
    expect(r.by_incident_type).toEqual({ found_substance: 1, overdose: 1 });
  });
});

// -- identifySubstanceMisuseAlerts --------------------------------------------

describe("identifySubstanceMisuseAlerts", () => {
  it("returns empty for empty data", () => {
    expect(identifySubstanceMisuseAlerts([], [])).toEqual([]);
  });

  it("fires serious_risk_child for serious + active assessment", () => {
    const assessments = [makeAssessment({ risk_level: "serious", status: "active" })];
    const alerts = identifySubstanceMisuseAlerts(assessments, []);
    const a = alerts.filter((x) => x.type === "serious_risk_child");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("fires significant_risk_child for significant + active assessment", () => {
    const assessments = [makeAssessment({ risk_level: "significant", status: "active" })];
    const alerts = identifySubstanceMisuseAlerts(assessments, []);
    expect(alerts.filter((x) => x.type === "significant_risk_child")).toHaveLength(1);
  });

  it("fires overdue_assessment for active assessment with past next_assessment_date", () => {
    const assessments = [
      makeAssessment({ status: "active", next_assessment_date: "2026-01-01" }),
    ];
    const alerts = identifySubstanceMisuseAlerts(assessments, []);
    const a = alerts.filter((x) => x.type === "overdue_assessment");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("high");
  });

  it("fires no_intervention_plan for moderate+ risk without plan", () => {
    const assessments = [
      makeAssessment({ risk_level: "moderate", intervention_plan: null, status: "active" }),
    ];
    const alerts = identifySubstanceMisuseAlerts(assessments, []);
    expect(alerts.filter((x) => x.type === "no_intervention_plan")).toHaveLength(1);
  });

  it("fires overdose_incident for overdose incident type", () => {
    const incidents = [makeIncident({ incident_type: "overdose" })];
    const alerts = identifySubstanceMisuseAlerts([], incidents);
    const a = alerts.filter((x) => x.type === "overdose_incident");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("fires incident_no_follow_up for overdue follow-up on incident", () => {
    const incidents = [
      makeIncident({ follow_up_date: "2026-01-01", follow_up_completed: false }),
    ];
    const alerts = identifySubstanceMisuseAlerts([], incidents);
    expect(alerts.filter((x) => x.type === "incident_no_follow_up")).toHaveLength(1);
  });

  it("fires police_not_recorded for suspected_dealing without police", () => {
    const incidents = [
      makeIncident({ incident_type: "suspected_dealing", police_involved: false }),
    ];
    const alerts = identifySubstanceMisuseAlerts([], incidents);
    expect(alerts.filter((x) => x.type === "police_not_recorded")).toHaveLength(1);
  });

  it("fires ofsted_not_notified for overdose without Ofsted notification", () => {
    const incidents = [
      makeIncident({ incident_type: "overdose", ofsted_notified: false }),
    ];
    const alerts = identifySubstanceMisuseAlerts([], incidents);
    const a = alerts.filter((x) => x.type === "ofsted_not_notified");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("fires social_worker_not_notified for under_influence without SW notification", () => {
    const incidents = [
      makeIncident({ incident_type: "under_influence", social_worker_notified: false }),
    ];
    const alerts = identifySubstanceMisuseAlerts([], incidents);
    expect(alerts.filter((x) => x.type === "social_worker_not_notified")).toHaveLength(1);
  });
});
