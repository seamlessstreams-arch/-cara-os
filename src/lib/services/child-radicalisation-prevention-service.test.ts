import { describe, it, expect } from "vitest";
import {
  computeRadicalisationMetrics,
  computeRadicalisationAlerts,
  generateRadicalisationCaraInsights,
} from "./child-radicalisation-prevention-service";
import type { ChildRadicalisationPreventionRow } from "./child-radicalisation-prevention-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<ChildRadicalisationPreventionRow> = {}): ChildRadicalisationPreventionRow {
  return {
    id: "rad-prev-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: null,
    assessment_date: "2026-05-01",
    vulnerability_level: "no_identified_risk",
    referral_outcome: "no_referral_needed",
    assessment_status: "initial_screening",
    concern_type: "far_right",
    prevent_training_completed: true,
    online_activity_monitored: true,
    channel_referral_made: false,
    multi_agency_involved: false,
    child_views_obtained: true,
    family_engaged: true,
    safety_plan_in_place: true,
    ideology_challenged: false,
    assessor_name: "Assessor 1",
    vulnerability_indicators: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeRadicalisationMetrics ---------------------------------------------

describe("computeRadicalisationMetrics (prevention)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeRadicalisationMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.significant_risk_count).toBe(0);
    expect(m.channel_active_count).toBe(0);
    expect(m.monitoring_count).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts high and significant vulnerability", () => {
    const rows = [
      makeRow({ id: "1", vulnerability_level: "high" }),
      makeRow({ id: "2", vulnerability_level: "significant" }),
      makeRow({ id: "3", vulnerability_level: "low" }),
    ];
    const m = computeRadicalisationMetrics(rows);
    expect(m.high_risk_count).toBe(1);
    expect(m.significant_risk_count).toBe(1);
  });

  it("counts channel_active and monitoring statuses", () => {
    const rows = [
      makeRow({ id: "1", assessment_status: "channel_active" }),
      makeRow({ id: "2", assessment_status: "monitoring" }),
      makeRow({ id: "3", assessment_status: "monitoring" }),
    ];
    const m = computeRadicalisationMetrics(rows);
    expect(m.channel_active_count).toBe(1);
    expect(m.monitoring_count).toBe(2);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", prevent_training_completed: true, ideology_challenged: true }),
      makeRow({ id: "2", prevent_training_completed: false, ideology_challenged: false }),
    ];
    const m = computeRadicalisationMetrics(rows);
    expect(m.prevent_training_rate).toBe(50);
    expect(m.ideology_challenged_rate).toBe(50);
  });

  it("builds concern type and vulnerability breakdowns", () => {
    const rows = [
      makeRow({ id: "1", concern_type: "far_right", vulnerability_level: "high" }),
      makeRow({ id: "2", concern_type: "far_right", vulnerability_level: "low" }),
      makeRow({ id: "3", concern_type: "islamist", vulnerability_level: "high" }),
    ];
    const m = computeRadicalisationMetrics(rows);
    expect(m.concern_type_breakdown["far_right"]).toBe(2);
    expect(m.concern_type_breakdown["islamist"]).toBe(1);
    expect(m.vulnerability_breakdown["high"]).toBe(2);
    expect(m.vulnerability_breakdown["low"]).toBe(1);
  });
});

// -- computeRadicalisationAlerts ----------------------------------------------

describe("computeRadicalisationAlerts (prevention)", () => {
  it("returns empty for empty input", () => {
    expect(computeRadicalisationAlerts([])).toEqual([]);
  });

  it("fires critical alert for high vulnerability without safety plan", () => {
    const rows = [makeRow({ vulnerability_level: "high", safety_plan_in_place: false, channel_referral_made: true, child_views_obtained: true, prevent_training_completed: true })];
    const alerts = computeRadicalisationAlerts(rows);
    const found = alerts.find((a) => a.type === "high_vulnerability_no_safety_plan");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical alert for high vulnerability without Channel referral", () => {
    const rows = [makeRow({ vulnerability_level: "high", channel_referral_made: false, child_views_obtained: true, prevent_training_completed: true })];
    const alerts = computeRadicalisationAlerts(rows);
    const found = alerts.find((a) => a.type === "high_vulnerability_no_channel_referral");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high alert for significant vulnerability without multi-agency", () => {
    const rows = [makeRow({ vulnerability_level: "significant", multi_agency_involved: false, child_views_obtained: true, prevent_training_completed: true })];
    const alerts = computeRadicalisationAlerts(rows);
    const found = alerts.find((a) => a.type === "significant_no_multi_agency");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires high alert for online_radicalisation concern without monitoring", () => {
    const rows = [makeRow({ concern_type: "online_radicalisation", online_activity_monitored: false, child_views_obtained: true, prevent_training_completed: true })];
    const alerts = computeRadicalisationAlerts(rows);
    const found = alerts.find((a) => a.type === "online_concern_no_monitoring");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium alert for child views not obtained", () => {
    const rows = [makeRow({ child_views_obtained: false, prevent_training_completed: true })];
    const alerts = computeRadicalisationAlerts(rows);
    const found = alerts.find((a) => a.type === "child_views_not_obtained");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("fires medium alert for prevent training not completed", () => {
    const rows = [makeRow({ prevent_training_completed: false, child_views_obtained: true })];
    const alerts = computeRadicalisationAlerts(rows);
    const found = alerts.find((a) => a.type === "prevent_training_not_completed");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });
});

// -- generateRadicalisationCaraInsights ---------------------------------------

describe("generateRadicalisationCaraInsights (prevention)", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateRadicalisationCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("shows critical/high counts when alerts present", () => {
    const rows = [makeRow({ vulnerability_level: "high", safety_plan_in_place: false })];
    const insights = generateRadicalisationCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });
});
