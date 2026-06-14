import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
} from "./child-gangs-affiliation-risk-service";
import type { ChildGangsAffiliationRiskRow } from "./child-gangs-affiliation-risk-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<ChildGangsAffiliationRiskRow> = {}): ChildGangsAffiliationRiskRow {
  return {
    id: "gang-1",
    home_id: "home-1",
    child_name: "Child A",
    assessment_date: "2026-05-01",
    risk_level: "No Identified Risk",
    gang_involvement_indicators: 0,
    county_lines_risk: false,
    nrm_referral_made: false,
    police_notified: false,
    social_worker_notified: true,
    disruption_strategy: null,
    multi_agency_meeting_held: false,
    safety_plan_in_place: true,
    exploitation_screening_completed: true,
    missing_episodes_linked: 0,
    review_date: null,
    assessor_name: "Assessor 1",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics (gangs)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.county_lines_count).toBe(0);
    expect(m.avg_indicators).toBe(0);
    expect(m.avg_missing_episodes).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts High and Significant risk", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "High" }),
      makeRow({ id: "2", risk_level: "Significant" }),
      makeRow({ id: "3", risk_level: "Medium" }),
    ];
    const m = computeMetrics(rows);
    expect(m.high_risk_count).toBe(2);
  });

  it("counts county lines and NRM referrals", () => {
    const rows = [
      makeRow({ id: "1", county_lines_risk: true, nrm_referral_made: true }),
      makeRow({ id: "2", county_lines_risk: true, nrm_referral_made: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.county_lines_count).toBe(2);
    expect(m.nrm_referral_count).toBe(1);
  });

  it("calculates average indicators and missing episodes", () => {
    const rows = [
      makeRow({ id: "1", gang_involvement_indicators: 4, missing_episodes_linked: 2 }),
      makeRow({ id: "2", gang_involvement_indicators: 6, missing_episodes_linked: 8 }),
    ];
    const m = computeMetrics(rows);
    expect(m.avg_indicators).toBe(5);
    expect(m.avg_missing_episodes).toBe(5);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", safety_plan_in_place: true, exploitation_screening_completed: true }),
      makeRow({ id: "2", safety_plan_in_place: false, exploitation_screening_completed: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.safety_plan_rate).toBe(50);
    expect(m.exploitation_screening_rate).toBe(50);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts (gangs)", () => {
  it("returns empty array for empty input", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for Significant risk without safety plan", () => {
    const rows = [makeRow({ risk_level: "Significant", safety_plan_in_place: false, exploitation_screening_completed: true })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "significant_risk_no_safety_plan");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical alert for county lines risk without NRM referral", () => {
    const rows = [makeRow({ county_lines_risk: true, nrm_referral_made: false, exploitation_screening_completed: true })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "county_lines_no_nrm");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high alert for High risk without multi-agency meeting", () => {
    const rows = [makeRow({ risk_level: "High", multi_agency_meeting_held: false, exploitation_screening_completed: true })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "high_risk_no_multi_agency");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium alert for non-'No Identified Risk' without exploitation screening", () => {
    const rows = [makeRow({ risk_level: "Low", exploitation_screening_completed: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_exploitation_screening");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does NOT fire exploitation screening alert for 'No Identified Risk'", () => {
    const rows = [makeRow({ risk_level: "No Identified Risk", exploitation_screening_completed: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_exploitation_screening");
    expect(found).toBeUndefined();
  });
});

// -- computeCaraInsights ------------------------------------------------------

describe("computeCaraInsights (gangs)", () => {
  it("returns 3 insights for empty data", () => {
    const metrics = computeMetrics([]);
    const insights = computeCaraInsights(metrics);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("includes alert counts when alerts provided", () => {
    const rows = [makeRow({ risk_level: "Significant", safety_plan_in_place: false })];
    const metrics = computeMetrics(rows);
    const alerts = computeAlerts(rows);
    const insights = computeCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("critical");
  });
});
