import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
} from "./child-honour-based-abuse-risk-service";
import type { ChildHonourBasedAbuseRiskRow } from "./child-honour-based-abuse-risk-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<ChildHonourBasedAbuseRiskRow> = {}): ChildHonourBasedAbuseRiskRow {
  return {
    id: "hba-1",
    home_id: "home-1",
    assessment_date: "2026-05-01",
    assessor_name: "Assessor 1",
    child_name: "Child A",
    risk_level: "No Identified Risk",
    abuse_type: "Not Determined",
    perpetrator_relationship: "Unknown",
    safety_plan_in_place: true,
    multi_agency_referral: true,
    police_notification: true,
    specialist_service_engaged: true,
    safe_accommodation_secured: true,
    one_chance_rule_applied: true,
    next_review_date: null,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics (honour-based abuse)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.immediate_count).toBe(0);
    expect(m.safety_plan_rate).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts high and immediate risk", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "High" }),
      makeRow({ id: "2", risk_level: "Immediate" }),
      makeRow({ id: "3", risk_level: "Medium" }),
    ];
    const m = computeMetrics(rows);
    expect(m.high_risk_count).toBe(2);
    expect(m.immediate_count).toBe(1);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", one_chance_rule_applied: true, safe_accommodation_secured: false }),
      makeRow({ id: "2", one_chance_rule_applied: false, safe_accommodation_secured: true }),
    ];
    const m = computeMetrics(rows);
    expect(m.one_chance_rule_rate).toBe(50);
    expect(m.safe_accommodation_rate).toBe(50);
  });

  it("counts unique children and assessors", () => {
    const rows = [
      makeRow({ id: "1", child_name: "A", assessor_name: "X" }),
      makeRow({ id: "2", child_name: "B", assessor_name: "X" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
    expect(m.unique_assessors).toBe(1);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts (honour-based abuse)", () => {
  it("returns empty for empty input", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for Immediate risk without safety plan", () => {
    const rows = [makeRow({ risk_level: "Immediate", safety_plan_in_place: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "immediate_no_safety_plan");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical alert for High/Immediate risk without multi-agency referral", () => {
    const rows = [makeRow({ risk_level: "High", multi_agency_referral: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "high_risk_no_multi_agency");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high alert for High/Immediate without police notification", () => {
    const rows = [makeRow({ risk_level: "Immediate", police_notification: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_police_high_risk");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium alert for High/Immediate without specialist service", () => {
    const rows = [makeRow({ risk_level: "High", specialist_service_engaged: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_specialist_high_risk");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("returns no alerts when all safeguards in place", () => {
    const rows = [makeRow({
      risk_level: "Immediate",
      safety_plan_in_place: true,
      multi_agency_referral: true,
      police_notification: true,
      specialist_service_engaged: true,
    })];
    expect(computeAlerts(rows)).toEqual([]);
  });

  it("does NOT fire specialist alert for Low risk without specialist", () => {
    const rows = [makeRow({ risk_level: "Low", specialist_service_engaged: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_specialist_high_risk");
    expect(found).toBeUndefined();
  });
});

// -- generateCaraInsights -----------------------------------------------------

describe("generateCaraInsights (honour-based abuse)", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("shows critical/high alert counts when present", () => {
    const rows = [makeRow({ risk_level: "Immediate", safety_plan_in_place: false })];
    const insights = generateCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });
});
