import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
} from "./child-substance-misuse-screening-service";
import type { ChildSubstanceMisuseScreeningRow } from "./child-substance-misuse-screening-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<ChildSubstanceMisuseScreeningRow> = {}): ChildSubstanceMisuseScreeningRow {
  return {
    id: "sms-1",
    home_id: "home-1",
    child_name: "Alex",
    screening_date: "2026-05-20",
    substance_type: "Alcohol",
    screening_outcome: "No Concern",
    intervention_type: "None Required",
    referral_made: false,
    referral_agency: null,
    risk_assessment_completed: true,
    safety_plan_in_place: true,
    parental_notification: true,
    social_worker_notified: true,
    follow_up_date: null,
    assessor_name: "Staff A",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics ------------------------------------------------------------

describe("computeMetrics (substance misuse)", () => {
  it("returns zeroed metrics for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_screenings).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.immediate_intervention_count).toBe(0);
    expect(m.no_concern_count).toBe(0);
    expect(m.referral_rate).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.unique_assessors).toBe(0);
  });

  it("counts screening outcomes correctly", () => {
    const rows = [
      makeRow({ id: "1", screening_outcome: "High Risk" }),
      makeRow({ id: "2", screening_outcome: "Immediate Intervention" }),
      makeRow({ id: "3", screening_outcome: "No Concern" }),
      makeRow({ id: "4", screening_outcome: "Low Risk" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_screenings).toBe(4);
    expect(m.high_risk_count).toBe(1);
    expect(m.immediate_intervention_count).toBe(1);
    expect(m.no_concern_count).toBe(1);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", referral_made: true, risk_assessment_completed: true }),
      makeRow({ id: "2", referral_made: false, risk_assessment_completed: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.referral_rate).toBe(50);
    expect(m.risk_assessment_rate).toBe(50);
  });

  it("builds substance type and intervention breakdowns", () => {
    const rows = [
      makeRow({ id: "1", substance_type: "Cannabis", intervention_type: "Counselling" }),
      makeRow({ id: "2", substance_type: "Cannabis", intervention_type: "CAMHS Referral" }),
      makeRow({ id: "3", substance_type: "Alcohol", intervention_type: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.substance_type_breakdown).toEqual({ Cannabis: 2, Alcohol: 1 });
    expect(m.intervention_type_breakdown).toEqual({ Counselling: 1, "CAMHS Referral": 1 });
  });

  it("counts unique children and assessors", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", assessor_name: "Staff A" }),
      makeRow({ id: "2", child_name: "Alex", assessor_name: "Staff B" }),
      makeRow({ id: "3", child_name: "Jordan", assessor_name: "Staff A" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
    expect(m.unique_assessors).toBe(2);
  });
});

// -- computeAlerts -------------------------------------------------------------

describe("computeAlerts (substance misuse)", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("critical: immediate intervention without safety plan", () => {
    const row = makeRow({
      id: "c1",
      screening_outcome: "Immediate Intervention",
      safety_plan_in_place: false,
    });
    const alerts = computeAlerts([row]);
    const matched = alerts.filter((a) => a.type === "immediate_intervention_no_safety_plan");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("critical");
  });

  it("high: high risk without referral", () => {
    const row = makeRow({
      id: "h1",
      screening_outcome: "High Risk",
      referral_made: false,
    });
    const alerts = computeAlerts([row]);
    const matched = alerts.filter((a) => a.type === "high_risk_no_referral");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("medium: no risk assessment completed", () => {
    const row = makeRow({ id: "m1", risk_assessment_completed: false });
    const alerts = computeAlerts([row]);
    const matched = alerts.filter((a) => a.type === "no_risk_assessment");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });

  it("medium: social worker not notified when outcome is not No Concern", () => {
    const row = makeRow({
      id: "s1",
      screening_outcome: "Low Risk",
      social_worker_notified: false,
    });
    const alerts = computeAlerts([row]);
    const matched = alerts.filter((a) => a.type === "social_worker_not_notified");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });

  it("no social worker alert when outcome is No Concern", () => {
    const row = makeRow({
      id: "nc1",
      screening_outcome: "No Concern",
      social_worker_notified: false,
    });
    const alerts = computeAlerts([row]);
    const matched = alerts.filter((a) => a.type === "social_worker_not_notified");
    expect(matched).toHaveLength(0);
  });
});

// -- computeCaraInsights -------------------------------------------------------

describe("computeCaraInsights (substance misuse)", () => {
  it("returns 3 insights for empty metrics", () => {
    const metrics = computeMetrics([]);
    const insights = computeCaraInsights(metrics);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("includes alert counts when alerts are passed", () => {
    const rows = [
      makeRow({ id: "1", screening_outcome: "Immediate Intervention", safety_plan_in_place: false }),
    ];
    const metrics = computeMetrics(rows);
    const alerts = computeAlerts(rows);
    const insights = computeCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("[amber]");
    expect(insights[1]).toMatch(/\d+ critical/);
  });
});
