import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
} from "./child-radicalisation-risk-service";
import type { ChildRadicalisationRiskRow } from "./child-radicalisation-risk-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<ChildRadicalisationRiskRow> = {}): ChildRadicalisationRiskRow {
  return {
    id: "rad-1",
    home_id: "home-1",
    assessment_date: "2026-05-01",
    assessor_name: "Assessor 1",
    child_name: "Child A",
    risk_level: "No Identified Risk",
    extremism_type: "Not Determined",
    indicator_type: "Not Determined",
    prevent_referral_made: false,
    channel_programme: false,
    police_notification: false,
    safety_plan_in_place: true,
    multi_agency_referral: true,
    internet_monitoring: false,
    next_review_date: null,
    compliance_status: "Under Review",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics (radicalisation risk)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.immediate_count).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.unique_assessors).toBe(0);
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
      makeRow({ id: "1", prevent_referral_made: true, channel_programme: true }),
      makeRow({ id: "2", prevent_referral_made: false, channel_programme: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.prevent_referral_rate).toBe(50);
    expect(m.channel_rate).toBe(50);
  });

  it("counts unique children and assessors", () => {
    const rows = [
      makeRow({ id: "1", child_name: "A", assessor_name: "X" }),
      makeRow({ id: "2", child_name: "A", assessor_name: "Y" }),
      makeRow({ id: "3", child_name: "B", assessor_name: "X" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
    expect(m.unique_assessors).toBe(2);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts (radicalisation risk)", () => {
  it("returns empty for empty input", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for High/Immediate without Prevent referral", () => {
    const rows = [makeRow({ risk_level: "High", prevent_referral_made: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "high_risk_no_prevent_referral");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical alert for Immediate without safety plan", () => {
    const rows = [makeRow({ risk_level: "Immediate", safety_plan_in_place: false, prevent_referral_made: true })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "immediate_no_safety_plan");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high alert for High/Immediate without police notification", () => {
    const rows = [makeRow({ risk_level: "Immediate", police_notification: false, prevent_referral_made: true })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_police_high_risk");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium alert for High/Immediate without Channel programme", () => {
    const rows = [makeRow({ risk_level: "High", channel_programme: false, prevent_referral_made: true })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_channel_high_risk");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does NOT fire Prevent referral alert for Low risk", () => {
    const rows = [makeRow({ risk_level: "Low", prevent_referral_made: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "high_risk_no_prevent_referral");
    expect(found).toBeUndefined();
  });

  it("does NOT fire channel alert for Low risk", () => {
    const rows = [makeRow({ risk_level: "Low", channel_programme: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "no_channel_high_risk");
    expect(found).toBeUndefined();
  });

  it("returns no alerts when all safeguards in place for Immediate risk", () => {
    const rows = [makeRow({
      risk_level: "Immediate",
      prevent_referral_made: true,
      safety_plan_in_place: true,
      police_notification: true,
      channel_programme: true,
    })];
    expect(computeAlerts(rows)).toEqual([]);
  });
});

// -- generateCaraInsights -----------------------------------------------------

describe("generateCaraInsights (radicalisation risk)", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("shows critical/high counts when alerts present", () => {
    const rows = [makeRow({ risk_level: "Immediate", prevent_referral_made: false })];
    const insights = generateCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });
});
