import { describe, it, expect } from "vitest";
import {
  computeModernSlaveryRiskMetrics,
  computeModernSlaveryRiskAlerts,
  generateModernSlaveryRiskCaraInsights,
} from "./child-modern-slavery-risk-service";
import type { ChildModernSlaveryRiskRow } from "./child-modern-slavery-risk-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<ChildModernSlaveryRiskRow> = {}): ChildModernSlaveryRiskRow {
  return {
    id: "ms-1",
    home_id: "home-1",
    child_name: "Child A",
    assessment_date: "2026-05-01",
    risk_level: "No Identified Risk",
    exploitation_type: "Not Determined",
    nrm_referral_made: false,
    nrm_decision: null,
    police_notified: false,
    social_worker_notified: true,
    multi_agency_referral: true,
    safety_plan_in_place: true,
    specialist_service_involved: false,
    independent_advocate_appointed: false,
    missing_episodes_linked: 0,
    review_date: null,
    assessor_name: "Assessor 1",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeModernSlaveryRiskMetrics ------------------------------------------

describe("computeModernSlaveryRiskMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeModernSlaveryRiskMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.nrm_referral_count).toBe(0);
    expect(m.avg_missing_episodes).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts high and immediate risk", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "High" }),
      makeRow({ id: "2", risk_level: "Immediate" }),
      makeRow({ id: "3", risk_level: "Low" }),
    ];
    const m = computeModernSlaveryRiskMetrics(rows);
    expect(m.high_risk_count).toBe(2);
  });

  it("counts NRM referrals", () => {
    const rows = [
      makeRow({ id: "1", nrm_referral_made: true }),
      makeRow({ id: "2", nrm_referral_made: true }),
      makeRow({ id: "3", nrm_referral_made: false }),
    ];
    const m = computeModernSlaveryRiskMetrics(rows);
    expect(m.nrm_referral_count).toBe(2);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", independent_advocate_appointed: true }),
      makeRow({ id: "2", independent_advocate_appointed: false }),
    ];
    const m = computeModernSlaveryRiskMetrics(rows);
    expect(m.advocate_rate).toBe(50);
  });

  it("calculates avg_missing_episodes", () => {
    const rows = [
      makeRow({ id: "1", missing_episodes_linked: 3 }),
      makeRow({ id: "2", missing_episodes_linked: 5 }),
    ];
    const m = computeModernSlaveryRiskMetrics(rows);
    expect(m.avg_missing_episodes).toBe(4);
  });
});

// -- computeModernSlaveryRiskAlerts -------------------------------------------

describe("computeModernSlaveryRiskAlerts", () => {
  it("returns empty for empty input", () => {
    expect(computeModernSlaveryRiskAlerts([])).toEqual([]);
  });

  it("fires critical alert for Immediate risk without NRM referral", () => {
    const rows = [makeRow({ risk_level: "Immediate", nrm_referral_made: false })];
    const alerts = computeModernSlaveryRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "immediate_no_nrm");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical alert for High/Immediate without safety plan", () => {
    const rows = [makeRow({ risk_level: "High", safety_plan_in_place: false })];
    const alerts = computeModernSlaveryRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "high_risk_no_safety_plan");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high alert for non-'No Identified Risk' without multi-agency referral", () => {
    const rows = [makeRow({ risk_level: "Low", multi_agency_referral: false })];
    const alerts = computeModernSlaveryRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "no_multi_agency_referral");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium alert for High/Immediate without independent advocate", () => {
    const rows = [makeRow({ risk_level: "Immediate", independent_advocate_appointed: false })];
    const alerts = computeModernSlaveryRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "no_advocate_high_risk");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does NOT fire advocate alert for Low risk", () => {
    const rows = [makeRow({ risk_level: "Low", independent_advocate_appointed: false })];
    const alerts = computeModernSlaveryRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "no_advocate_high_risk");
    expect(found).toBeUndefined();
  });

  it("returns no alerts when all safeguards in place", () => {
    const rows = [makeRow({
      risk_level: "Immediate",
      nrm_referral_made: true,
      safety_plan_in_place: true,
      multi_agency_referral: true,
      independent_advocate_appointed: true,
    })];
    expect(computeModernSlaveryRiskAlerts(rows)).toEqual([]);
  });
});

// -- generateModernSlaveryRiskCaraInsights ------------------------------------

describe("generateModernSlaveryRiskCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateModernSlaveryRiskCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("shows critical counts when alerts present", () => {
    const rows = [makeRow({ risk_level: "Immediate", nrm_referral_made: false })];
    const insights = generateModernSlaveryRiskCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });
});
