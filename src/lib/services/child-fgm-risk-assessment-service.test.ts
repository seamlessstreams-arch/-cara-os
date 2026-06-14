import { describe, it, expect } from "vitest";
import {
  computeFgmRiskMetrics,
  computeFgmRiskAlerts,
  generateFgmRiskCaraInsights,
} from "./child-fgm-risk-assessment-service";
import type { ChildFgmRiskAssessmentRow } from "./child-fgm-risk-assessment-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<ChildFgmRiskAssessmentRow> = {}): ChildFgmRiskAssessmentRow {
  return {
    id: "fgm-1",
    home_id: "home-1",
    child_name: "Child A",
    assessment_date: "2026-05-01",
    risk_level: "No Identified Risk",
    risk_indicators_count: 0,
    mandatory_report_made: false,
    police_notified: false,
    social_worker_notified: true,
    fgm_protection_order: false,
    multi_agency_referral: false,
    safety_plan_in_place: true,
    cultural_sensitivity_considered: true,
    specialist_service_involved: false,
    specialist_service_name: null,
    review_date: null,
    assessor_name: "Assessor 1",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeFgmRiskMetrics ----------------------------------------------------

describe("computeFgmRiskMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeFgmRiskMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.mandatory_report_count).toBe(0);
    expect(m.fgm_protection_order_count).toBe(0);
    expect(m.safety_plan_rate).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.unique_assessors).toBe(0);
  });

  it("counts high and immediate risk correctly", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "High" }),
      makeRow({ id: "2", risk_level: "Immediate" }),
      makeRow({ id: "3", risk_level: "Low" }),
      makeRow({ id: "4", risk_level: "Medium" }),
    ];
    const m = computeFgmRiskMetrics(rows);
    expect(m.total_assessments).toBe(4);
    expect(m.high_risk_count).toBe(2);
  });

  it("counts mandatory reports and FGM protection orders", () => {
    const rows = [
      makeRow({ id: "1", mandatory_report_made: true, fgm_protection_order: true }),
      makeRow({ id: "2", mandatory_report_made: true, fgm_protection_order: false }),
      makeRow({ id: "3", mandatory_report_made: false, fgm_protection_order: false }),
    ];
    const m = computeFgmRiskMetrics(rows);
    expect(m.mandatory_report_count).toBe(2);
    expect(m.fgm_protection_order_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", safety_plan_in_place: true, cultural_sensitivity_considered: true }),
      makeRow({ id: "2", safety_plan_in_place: false, cultural_sensitivity_considered: true }),
    ];
    const m = computeFgmRiskMetrics(rows);
    expect(m.safety_plan_rate).toBe(50);
    expect(m.cultural_sensitivity_rate).toBe(100);
  });

  it("calculates review_scheduled_rate", () => {
    const rows = [
      makeRow({ id: "1", review_date: "2026-06-01" }),
      makeRow({ id: "2", review_date: null }),
    ];
    const m = computeFgmRiskMetrics(rows);
    expect(m.review_scheduled_rate).toBe(50);
  });

  it("counts unique children and assessors", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Child A", assessor_name: "Assessor 1" }),
      makeRow({ id: "2", child_name: "Child A", assessor_name: "Assessor 2" }),
      makeRow({ id: "3", child_name: "Child B", assessor_name: "Assessor 1" }),
    ];
    const m = computeFgmRiskMetrics(rows);
    expect(m.unique_children).toBe(2);
    expect(m.unique_assessors).toBe(2);
  });
});

// -- computeFgmRiskAlerts -----------------------------------------------------

describe("computeFgmRiskAlerts", () => {
  it("returns empty array for empty input", () => {
    expect(computeFgmRiskAlerts([])).toEqual([]);
  });

  it("returns no alerts when all safeguards are in place", () => {
    const rows = [
      makeRow({
        risk_level: "Immediate",
        mandatory_report_made: true,
        safety_plan_in_place: true,
        multi_agency_referral: true,
        cultural_sensitivity_considered: true,
      }),
    ];
    const alerts = computeFgmRiskAlerts(rows);
    expect(alerts).toEqual([]);
  });

  it("fires critical alert for Immediate risk without mandatory report", () => {
    const rows = [makeRow({ risk_level: "Immediate", mandatory_report_made: false })];
    const alerts = computeFgmRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "immediate_risk_no_mandatory_report");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical alert for High risk without safety plan", () => {
    const rows = [makeRow({ risk_level: "High", safety_plan_in_place: false, multi_agency_referral: true })];
    const alerts = computeFgmRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "high_risk_no_safety_plan");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high alert for non-'No Identified Risk' without multi-agency referral", () => {
    const rows = [
      makeRow({ risk_level: "Low", multi_agency_referral: false }),
    ];
    const alerts = computeFgmRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "risk_no_multi_agency_referral");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium alert for cultural sensitivity not considered", () => {
    const rows = [makeRow({ cultural_sensitivity_considered: false })];
    const alerts = computeFgmRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "cultural_sensitivity_not_considered");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does NOT fire multi-agency alert for 'No Identified Risk'", () => {
    const rows = [makeRow({ risk_level: "No Identified Risk", multi_agency_referral: false })];
    const alerts = computeFgmRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "risk_no_multi_agency_referral");
    expect(found).toBeUndefined();
  });
});

// -- generateFgmRiskCaraInsights ----------------------------------------------

describe("generateFgmRiskCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateFgmRiskCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("returns 3 insights for populated data with alerts", () => {
    const rows = [
      makeRow({ risk_level: "Immediate", mandatory_report_made: false }),
    ];
    const insights = generateFgmRiskCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("1 FGM risk assessments");
    expect(insights[1]).toContain("critical");
  });
});
