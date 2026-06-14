import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
  type HomeAsbestosManagementRow,
} from "./home-asbestos-management-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<HomeAsbestosManagementRow> = {}): HomeAsbestosManagementRow {
  return {
    id: "row-1",
    home_id: "home-1",
    survey_date: "2026-05-01",
    surveyor_name: "Surveyor A",
    location: "Boiler Room",
    asbestos_type: "Chrysotile",
    condition_rating: "Good",
    risk_score: 5,
    management_action: "Monitor",
    management_plan_in_place: true,
    register_updated: true,
    staff_awareness_confirmed: true,
    labelling_in_place: true,
    reinspection_date: "2027-05-01",
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeMetrics ───────────────────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeMetrics([]);
    expect(result.total_surveys).toBe(0);
    expect(result.damaged_count).toBe(0);
    expect(result.removal_required_count).toBe(0);
    expect(result.non_compliant_count).toBe(0);
    expect(result.management_plan_rate).toBe(0);
    expect(result.avg_risk_score).toBe(0);
    expect(result.unique_surveyors).toBe(0);
  });

  it("computes correct counts with populated data", () => {
    const rows = [
      makeRow({ condition_rating: "Poor", management_action: "Remove", compliance_status: "Major Non-Compliance", risk_score: 10 }),
      makeRow({ id: "row-2", condition_rating: "Severely Damaged", compliance_status: "Critical Non-Compliance", risk_score: 15 }),
      makeRow({ id: "row-3", condition_rating: "Good", surveyor_name: "Surveyor B", risk_score: 2, reinspection_date: null }),
    ];
    const result = computeMetrics(rows);
    expect(result.total_surveys).toBe(3);
    // damaged_count: Poor + Damaged + Severely Damaged = 2
    expect(result.damaged_count).toBe(2);
    expect(result.removal_required_count).toBe(1);
    expect(result.non_compliant_count).toBe(2);
    expect(result.unique_surveyors).toBe(2);
    // avg_risk_score: (10+15+2)/3 = 9.0
    expect(result.avg_risk_score).toBe(9);
    // reinspection_scheduled_rate: 2/3 = 66.7%
    expect(result.reinspection_scheduled_rate).toBe(66.7);
  });

  it("computes boolean rates at 100% when all true", () => {
    const rows = [makeRow(), makeRow({ id: "row-2" })];
    const result = computeMetrics(rows);
    expect(result.management_plan_rate).toBe(100);
    expect(result.register_update_rate).toBe(100);
    expect(result.staff_awareness_rate).toBe(100);
    expect(result.labelling_rate).toBe(100);
  });
});

// ── computeAlerts ────────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toHaveLength(0);
  });

  it("raises critical alert for Severely Damaged condition", () => {
    const rows = [makeRow({ condition_rating: "Severely Damaged" })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "severely_damaged_asbestos");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises high alert for Damaged without Remove action", () => {
    const rows = [makeRow({ condition_rating: "Damaged", management_action: "Monitor" })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "damaged_not_removal");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("does NOT raise damaged_not_removal if action is Remove", () => {
    const rows = [makeRow({ condition_rating: "Damaged", management_action: "Remove" })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "damaged_not_removal")).toHaveLength(0);
  });

  it("raises high alert for no management plan when asbestos found", () => {
    const rows = [makeRow({ asbestos_type: "Amosite", management_plan_in_place: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "no_management_plan");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("does NOT raise management plan alert for No Asbestos Found", () => {
    const rows = [makeRow({ asbestos_type: "No Asbestos Found", management_plan_in_place: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "no_management_plan")).toHaveLength(0);
  });

  it("raises medium alert for staff not aware", () => {
    const rows = [makeRow({ staff_awareness_confirmed: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "staff_not_aware");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });

  it("raises medium alert for no labelling when asbestos found", () => {
    const rows = [makeRow({ asbestos_type: "Chrysotile", labelling_in_place: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "no_labelling");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });
});

// ── computeCaraInsights ──────────────────────────────────────────────────

describe("computeCaraInsights", () => {
  it("returns 3 insights", () => {
    const metrics = computeMetrics([makeRow()]);
    const insights = computeCaraInsights(metrics);
    expect(insights).toHaveLength(3);
  });
});
