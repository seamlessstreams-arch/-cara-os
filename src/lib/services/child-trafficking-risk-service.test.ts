import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
} from "./child-trafficking-risk-service";
import type { ChildTraffickingRiskRow } from "./child-trafficking-risk-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<ChildTraffickingRiskRow> = {}): ChildTraffickingRiskRow {
  return {
    id: "trf-1",
    home_id: "home-1",
    assessment_date: "2026-05-20",
    assessor_name: "Staff A",
    child_name: "Alex",
    risk_level: "Low",
    trafficking_type: "Not Determined",
    country_of_origin: null,
    nrm_referral_made: true,
    nrm_decision: null,
    first_responder_notified: true,
    safety_plan_in_place: true,
    safe_accommodation: true,
    multi_agency_referral: true,
    police_notification: true,
    independent_advocate: true,
    next_review_date: null,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics ------------------------------------------------------------

describe("computeMetrics (trafficking)", () => {
  it("returns zeroed metrics for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.immediate_count).toBe(0);
    expect(m.nrm_referral_rate).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.unique_assessors).toBe(0);
  });

  it("counts high/immediate risk correctly (High + Immediate)", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "High" }),
      makeRow({ id: "2", risk_level: "Immediate" }),
      makeRow({ id: "3", risk_level: "Low" }),
    ];
    const m = computeMetrics(rows);
    expect(m.high_risk_count).toBe(2);
    expect(m.immediate_count).toBe(1);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", nrm_referral_made: true, safety_plan_in_place: true }),
      makeRow({ id: "2", nrm_referral_made: false, safety_plan_in_place: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.nrm_referral_rate).toBe(50);
    expect(m.safety_plan_rate).toBe(50);
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

describe("computeAlerts (trafficking)", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("critical: High/Immediate risk without NRM referral", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "High", nrm_referral_made: false }),
      makeRow({ id: "2", risk_level: "Immediate", nrm_referral_made: false }),
      makeRow({ id: "3", risk_level: "Low", nrm_referral_made: false }),
    ];
    const alerts = computeAlerts(rows);
    const matched = alerts.filter((a) => a.type === "high_risk_no_nrm_referral");
    expect(matched).toHaveLength(2);
    expect(matched[0].severity).toBe("critical");
  });

  it("critical: Immediate risk without safety plan", () => {
    const row = makeRow({ id: "ip1", risk_level: "Immediate", safety_plan_in_place: false });
    const alerts = computeAlerts([row]);
    const matched = alerts.filter((a) => a.type === "immediate_no_safety_plan");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("critical");
  });

  it("high: no first responder for High/Immediate risk", () => {
    const row = makeRow({ id: "fr1", risk_level: "High", first_responder_notified: false });
    const alerts = computeAlerts([row]);
    const matched = alerts.filter((a) => a.type === "no_first_responder_high_risk");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("high: no police notification for High/Immediate risk", () => {
    const row = makeRow({ id: "pn1", risk_level: "Immediate", police_notification: false });
    const alerts = computeAlerts([row]);
    const matched = alerts.filter((a) => a.type === "no_police_high_risk");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
  });

  it("medium: no independent advocate for High/Immediate risk", () => {
    const row = makeRow({ id: "ia1", risk_level: "High", independent_advocate: false });
    const alerts = computeAlerts([row]);
    const matched = alerts.filter((a) => a.type === "no_advocate_high_risk");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });

  it("no alerts for Low risk row with all flags false", () => {
    const row = makeRow({
      id: "safe",
      risk_level: "Low",
      nrm_referral_made: false,
      first_responder_notified: false,
      police_notification: false,
      independent_advocate: false,
      safety_plan_in_place: false,
    });
    const alerts = computeAlerts([row]);
    // Low risk should not trigger any of the High/Immediate alerts
    expect(alerts.filter((a) => a.type === "high_risk_no_nrm_referral")).toHaveLength(0);
    expect(alerts.filter((a) => a.type === "immediate_no_safety_plan")).toHaveLength(0);
    expect(alerts.filter((a) => a.type === "no_first_responder_high_risk")).toHaveLength(0);
    expect(alerts.filter((a) => a.type === "no_police_high_risk")).toHaveLength(0);
    expect(alerts.filter((a) => a.type === "no_advocate_high_risk")).toHaveLength(0);
  });
});

// -- generateCaraInsights ------------------------------------------------------

describe("generateCaraInsights (trafficking)", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[fuchsia]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("includes critical/high alert counts when alerts exist", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "Immediate", nrm_referral_made: false }),
    ];
    const insights = generateCaraInsights(rows);
    expect(insights[1]).toContain("[amber]");
    expect(insights[1]).toMatch(/\d+ critical and \d+ high-priority/);
  });
});
