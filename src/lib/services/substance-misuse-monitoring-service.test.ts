import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateSubstanceMisuseMonitoring,
} from "./substance-misuse-monitoring-service";
import type { SubstanceMisuseMonitoringRow } from "./substance-misuse-monitoring-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<SubstanceMisuseMonitoringRow> = {}): SubstanceMisuseMonitoringRow {
  return {
    id: "smm-1",
    home_id: "home-1",
    child_name: "Child A",
    assessment_date: "2026-05-01",
    assessor_name: "Staff A",
    substance_type: "Cannabis",
    usage_frequency: "Occasional",
    risk_level: "Medium",
    referral_to_specialist: false,
    specialist_service_name: null,
    harm_reduction_plan: false,
    young_person_engaged: true,
    parental_carer_informed: true,
    social_worker_informed: true,
    police_involvement: false,
    drug_testing_consent: false,
    support_plan_in_place: true,
    next_review_date: null,
    outcome: "Ongoing Support",
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty array", () => {
    const r = computeMetrics([]);
    expect(r.total_assessments).toBe(0);
    expect(r.high_risk_count).toBe(0);
    expect(r.critical_count).toBe(0);
    expect(r.specialist_referral_rate).toBeNull();;
    expect(r.engagement_rate).toBeNull();;
    expect(r.support_plan_rate).toBeNull();;
    expect(r.harm_reduction_rate).toBeNull();;
    expect(r.positive_outcome_rate).toBeNull();;
    expect(r.disengagement_rate).toBeNull();;
    expect(r.unique_children).toBe(0);
    expect(r.unique_assessors).toBe(0);
  });

  it("counts high and critical risk assessments", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "High" }),
      makeRow({ id: "2", risk_level: "Critical" }),
      makeRow({ id: "3", risk_level: "Low" }),
    ];
    const r = computeMetrics(rows);
    expect(r.high_risk_count).toBe(1);
    expect(r.critical_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", referral_to_specialist: true, young_person_engaged: true, support_plan_in_place: true, harm_reduction_plan: true }),
      makeRow({ id: "2", referral_to_specialist: false, young_person_engaged: false, support_plan_in_place: false, harm_reduction_plan: false }),
    ];
    const r = computeMetrics(rows);
    expect(r.specialist_referral_rate).toBe(50);
    expect(r.engagement_rate).toBe(50);
    expect(r.support_plan_rate).toBe(50);
    expect(r.harm_reduction_rate).toBe(50);
  });

  it("calculates positive outcome rate (Reduced Usage + Abstinent)", () => {
    const rows = [
      makeRow({ id: "1", outcome: "Reduced Usage" }),
      makeRow({ id: "2", outcome: "Abstinent" }),
      makeRow({ id: "3", outcome: "Ongoing Support" }),
      makeRow({ id: "4", outcome: "Disengaged" }),
    ];
    // 2/4 = 50%
    const r = computeMetrics(rows);
    expect(r.positive_outcome_rate).toBe(50);
    expect(r.disengagement_rate).toBe(25);
  });

  it("counts unique children and assessors", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex", assessor_name: "Staff A" }),
      makeRow({ id: "2", child_name: "Jordan", assessor_name: "Staff A" }),
      makeRow({ id: "3", child_name: "Alex", assessor_name: "Staff B" }),
    ];
    const r = computeMetrics(rows);
    expect(r.unique_children).toBe(2);
    expect(r.unique_assessors).toBe(2);
  });

  it("populates substance, outcome, risk level, and frequency breakdowns", () => {
    const rows = [
      makeRow({ id: "1", substance_type: "Cannabis", risk_level: "High", usage_frequency: "Regular", outcome: "Ongoing Support" }),
      makeRow({ id: "2", substance_type: "Alcohol", risk_level: "Low", usage_frequency: "Occasional", outcome: "Abstinent" }),
    ];
    const r = computeMetrics(rows);
    expect(r.by_substance["Cannabis"]).toBe(1);
    expect(r.by_substance["Alcohol"]).toBe(1);
    expect(r.by_risk_level["High"]).toBe(1);
    expect(r.by_risk_level["Low"]).toBe(1);
    expect(r.by_frequency["Regular"]).toBe(1);
    expect(r.by_outcome["Abstinent"]).toBe(1);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical_no_support_plan for Critical risk without support plan", () => {
    const rows = [makeRow({ risk_level: "Critical", support_plan_in_place: false })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "critical_no_support_plan");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("fires daily_class_a_no_referral for daily Cocaine without referral", () => {
    const rows = [
      makeRow({ usage_frequency: "Daily", substance_type: "Cocaine", referral_to_specialist: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((x) => x.type === "daily_class_a_no_referral")).toHaveLength(1);
  });

  it("fires daily_class_a_no_referral for daily MDMA without referral", () => {
    const rows = [
      makeRow({ substance_type: "MDMA", usage_frequency: "Daily", referral_to_specialist: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((x) => x.type === "daily_class_a_no_referral")).toHaveLength(1);
  });

  it("fires high_risk_not_engaged for High/Critical risk not engaged", () => {
    const rows = [makeRow({ risk_level: "High", young_person_engaged: false })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "high_risk_not_engaged");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("high");
  });

  it("fires high_risk_sw_not_informed for High risk without SW notification", () => {
    const rows = [makeRow({ risk_level: "High", social_worker_informed: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((x) => x.type === "high_risk_sw_not_informed")).toHaveLength(1);
  });

  it("fires regular_use_no_harm_reduction for Regular usage without harm reduction", () => {
    const rows = [makeRow({ usage_frequency: "Regular", harm_reduction_plan: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((x) => x.type === "regular_use_no_harm_reduction")).toHaveLength(1);
  });

  it("fires disengaged_outcome for Disengaged outcome", () => {
    const rows = [makeRow({ outcome: "Disengaged" })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "disengaged_outcome");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("medium");
  });

  it("fires parent_not_informed_high_risk for High risk without parental notification", () => {
    const rows = [makeRow({ risk_level: "High", parental_carer_informed: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((x) => x.type === "parent_not_informed_high_risk")).toHaveLength(1);
  });
});

// -- validateSubstanceMisuseMonitoring ----------------------------------------

describe("validateSubstanceMisuseMonitoring", () => {
  it("returns valid for correct input", () => {
    const result = validateSubstanceMisuseMonitoring({
      childName: "Alex",
      assessmentDate: "2026-05-01",
      assessorName: "Staff A",
      substanceType: "Cannabis",
      usageFrequency: "Occasional",
      riskLevel: "Medium",
      outcome: "Ongoing Support",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing required fields", () => {
    const result = validateSubstanceMisuseMonitoring({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects future assessment date", () => {
    const result = validateSubstanceMisuseMonitoring({
      childName: "Alex",
      assessmentDate: "2030-01-01",
      assessorName: "Staff A",
      substanceType: "Cannabis",
      usageFrequency: "Occasional",
      riskLevel: "Medium",
      outcome: "Ongoing Support",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("future"))).toBe(true);
  });

  it("rejects referral to specialist without specialist service name", () => {
    const result = validateSubstanceMisuseMonitoring({
      childName: "Alex",
      assessmentDate: "2026-05-01",
      assessorName: "Staff A",
      substanceType: "Cannabis",
      usageFrequency: "Occasional",
      riskLevel: "Medium",
      outcome: "Ongoing Support",
      referralToSpecialist: true,
      specialistServiceName: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Specialist service name"))).toBe(true);
  });

  it("rejects invalid substance type", () => {
    const result = validateSubstanceMisuseMonitoring({
      childName: "Alex",
      assessmentDate: "2026-05-01",
      assessorName: "Staff A",
      substanceType: "InvalidSubstance",
      usageFrequency: "Occasional",
      riskLevel: "Medium",
      outcome: "Ongoing Support",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Substance type"))).toBe(true);
  });
});
