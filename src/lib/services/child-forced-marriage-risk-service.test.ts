import { describe, it, expect } from "vitest";
import {
  computeForcedMarriageRiskMetrics,
  computeForcedMarriageRiskAlerts,
  generateForcedMarriageRiskCaraInsights,
} from "./child-forced-marriage-risk-service";
import type { ChildForcedMarriageRiskRow } from "./child-forced-marriage-risk-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<ChildForcedMarriageRiskRow> = {}): ChildForcedMarriageRiskRow {
  return {
    id: "fm-1",
    home_id: "home-1",
    child_name: "Child A",
    assessment_date: "2026-05-01",
    risk_level: "No Identified Risk",
    risk_indicators_count: 0,
    fmpo_in_place: false,
    police_notified: false,
    social_worker_notified: true,
    forced_marriage_unit_contacted: false,
    multi_agency_referral: false,
    safety_plan_in_place: true,
    passport_secured: false,
    travel_restrictions: false,
    specialist_service_involved: false,
    review_date: null,
    assessor_name: "Assessor 1",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeForcedMarriageRiskMetrics -----------------------------------------

describe("computeForcedMarriageRiskMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeForcedMarriageRiskMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.fmpo_count).toBe(0);
    expect(m.fmu_contacted_count).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts high and immediate risk", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "High" }),
      makeRow({ id: "2", risk_level: "Immediate" }),
      makeRow({ id: "3", risk_level: "Low" }),
    ];
    const m = computeForcedMarriageRiskMetrics(rows);
    expect(m.high_risk_count).toBe(2);
  });

  it("counts FMPOs and FMU contacts", () => {
    const rows = [
      makeRow({ id: "1", fmpo_in_place: true, forced_marriage_unit_contacted: true }),
      makeRow({ id: "2", fmpo_in_place: false, forced_marriage_unit_contacted: true }),
    ];
    const m = computeForcedMarriageRiskMetrics(rows);
    expect(m.fmpo_count).toBe(1);
    expect(m.fmu_contacted_count).toBe(2);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", passport_secured: true, travel_restrictions: true }),
      makeRow({ id: "2", passport_secured: false, travel_restrictions: false }),
    ];
    const m = computeForcedMarriageRiskMetrics(rows);
    expect(m.passport_secured_rate).toBe(50);
    expect(m.travel_restriction_rate).toBe(50);
  });

  it("counts unique children and assessors", () => {
    const rows = [
      makeRow({ id: "1", child_name: "A", assessor_name: "X" }),
      makeRow({ id: "2", child_name: "A", assessor_name: "Y" }),
      makeRow({ id: "3", child_name: "B", assessor_name: "X" }),
    ];
    const m = computeForcedMarriageRiskMetrics(rows);
    expect(m.unique_children).toBe(2);
    expect(m.unique_assessors).toBe(2);
  });
});

// -- computeForcedMarriageRiskAlerts ------------------------------------------

describe("computeForcedMarriageRiskAlerts", () => {
  it("returns empty array for empty input", () => {
    expect(computeForcedMarriageRiskAlerts([])).toEqual([]);
  });

  it("fires critical alert for Immediate risk without FMPO", () => {
    const rows = [makeRow({ risk_level: "Immediate", fmpo_in_place: false, safety_plan_in_place: true, forced_marriage_unit_contacted: true, multi_agency_referral: true })];
    const alerts = computeForcedMarriageRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "immediate_risk_no_fmpo");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical alert for High risk without safety plan", () => {
    const rows = [makeRow({ risk_level: "High", safety_plan_in_place: false, forced_marriage_unit_contacted: true, multi_agency_referral: true })];
    const alerts = computeForcedMarriageRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "high_risk_no_safety_plan");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high alert for High/Immediate without FMU contact", () => {
    const rows = [makeRow({ risk_level: "High", forced_marriage_unit_contacted: false, multi_agency_referral: true })];
    const alerts = computeForcedMarriageRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "high_risk_no_fmu_contact");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium alert for non-'No Identified Risk' without multi-agency referral", () => {
    const rows = [makeRow({ risk_level: "Medium", multi_agency_referral: false })];
    const alerts = computeForcedMarriageRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "risk_no_multi_agency_referral");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does NOT fire multi-agency alert for 'No Identified Risk'", () => {
    const rows = [makeRow({ risk_level: "No Identified Risk", multi_agency_referral: false })];
    const alerts = computeForcedMarriageRiskAlerts(rows);
    const found = alerts.find((a) => a.type === "risk_no_multi_agency_referral");
    expect(found).toBeUndefined();
  });

  it("returns no alerts when all safeguards in place", () => {
    const rows = [makeRow({
      risk_level: "Immediate",
      fmpo_in_place: true,
      safety_plan_in_place: true,
      forced_marriage_unit_contacted: true,
      multi_agency_referral: true,
    })];
    expect(computeForcedMarriageRiskAlerts(rows)).toEqual([]);
  });
});

// -- generateForcedMarriageRiskCaraInsights -----------------------------------

describe("generateForcedMarriageRiskCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateForcedMarriageRiskCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("includes critical/high counts in amber insight when alerts exist", () => {
    const rows = [makeRow({ risk_level: "Immediate", fmpo_in_place: false })];
    const insights = generateForcedMarriageRiskCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });
});
