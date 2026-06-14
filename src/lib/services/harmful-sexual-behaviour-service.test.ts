import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateHarmfulSexualBehaviour,
  generateCaraInsights,
  type HarmfulSexualBehaviourRow,
} from "./harmful-sexual-behaviour-service";

function makeRow(overrides: Partial<HarmfulSexualBehaviourRow> = {}): HarmfulSexualBehaviourRow {
  return {
    id: "hsb-1",
    home_id: "home-1",
    child_name: "Alex",
    incident_date: "2026-05-01",
    assessor_name: "Staff A",
    referral_source: "Staff Observation",
    behaviour_category: "Inappropriate",
    behaviour_description: "Low-level inappropriate behaviour observed",
    victim_involved: false,
    victim_support_provided: false,
    aim_assessment_completed: true,
    brook_traffic_light_used: true,
    specialist_referral_made: false,
    specialist_service: null,
    safety_plan_in_place: true,
    environmental_risk_assessment: true,
    sleeping_arrangements_reviewed: true,
    supervision_level_adjusted: false,
    police_notified: false,
    social_worker_informed: true,
    parents_carers_informed: true,
    multi_agency_meeting_held: false,
    child_views_obtained: true,
    therapeutic_support: false,
    risk_level: "Low",
    review_date: "2026-06-01",
    outcome: "Monitoring",
    status: "Active",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

// ── computeMetrics ──────────────────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeMetrics([]);
    expect(result.total_records).toBe(0);
    expect(result.active_cases).toBe(0);
    expect(result.unique_children).toBe(0);
    expect(result.victim_rate).toBe(0);
    expect(result.overdue_reviews).toBe(0);
  });

  it("computes counts, breakdowns, and rates correctly", () => {
    const rows = [
      makeRow({ id: "h1", child_name: "Alex", behaviour_category: "Abusive", risk_level: "High", status: "Active", victim_involved: true, aim_assessment_completed: true, safety_plan_in_place: true }),
      makeRow({ id: "h2", child_name: "Ben", behaviour_category: "Violent", risk_level: "Critical", status: "Active", victim_involved: false, aim_assessment_completed: false, safety_plan_in_place: false }),
      makeRow({ id: "h3", child_name: "Alex", behaviour_category: "Normal/Expected", risk_level: "Low", status: "Archived", victim_involved: false, aim_assessment_completed: true, safety_plan_in_place: true }),
    ];
    const result = computeMetrics(rows);

    expect(result.total_records).toBe(3);
    expect(result.active_cases).toBe(2);
    expect(result.unique_children).toBe(2);
    // 1/3 victim = 33.3%
    expect(result.victim_rate).toBe(33.3);
    // 2/3 aim = 66.7%
    expect(result.aim_assessment_rate).toBe(66.7);
    expect(result.by_behaviour_category["Abusive"]).toBe(1);
    expect(result.by_behaviour_category["Violent"]).toBe(1);
    expect(result.by_behaviour_category["Normal/Expected"]).toBe(1);
    expect(result.by_risk_level["High"]).toBe(1);
    expect(result.by_risk_level["Critical"]).toBe(1);
  });

  it("counts overdue reviews for active cases", () => {
    const rows = [
      makeRow({ id: "h1", review_date: "2025-01-01", status: "Active" }),
      makeRow({ id: "h2", review_date: "2099-01-01", status: "Active" }),
      makeRow({ id: "h3", review_date: "2025-01-01", status: "Archived" }), // not counted
    ];
    const result = computeMetrics(rows);
    expect(result.overdue_reviews).toBe(1);
  });
});

// ── computeAlerts ───────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("triggers violent_no_police critical alert", () => {
    const rows = [makeRow({ behaviour_category: "Violent", police_notified: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "violent_no_police");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers victim_no_support critical alert for Abusive with victim", () => {
    const rows = [makeRow({ behaviour_category: "Abusive", victim_involved: true, victim_support_provided: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "victim_no_support");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers critical_no_safety_plan critical alert", () => {
    const rows = [makeRow({ risk_level: "Critical", safety_plan_in_place: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "critical_no_safety_plan");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers serious_no_aim high alert for Abusive without AIM3", () => {
    const rows = [makeRow({ behaviour_category: "Abusive", aim_assessment_completed: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "serious_no_aim");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers high_risk_no_specialist high alert", () => {
    const rows = [makeRow({ risk_level: "High", specialist_referral_made: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "high_risk_no_specialist");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers no_child_views medium alert", () => {
    const rows = [makeRow({ child_views_obtained: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "no_child_views");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("triggers overdue_review medium alert", () => {
    const rows = [makeRow({ review_date: "2025-01-01", status: "Active" })];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "overdue_review");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });
});

// ── validateHarmfulSexualBehaviour ──────────────────────────────────────

describe("validateHarmfulSexualBehaviour", () => {
  it("returns valid for correct input", () => {
    const result = validateHarmfulSexualBehaviour({
      childName: "Alex",
      incidentDate: "2026-05-01",
      assessorName: "Staff A",
      referralSource: "Staff Observation",
      behaviourCategory: "Inappropriate",
      behaviourDescription: "Low-level inappropriate behaviour observed",
      riskLevel: "Low",
      outcome: "Monitoring",
      status: "Active",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns errors for missing required fields", () => {
    const result = validateHarmfulSexualBehaviour({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes("Child name"))).toBe(true);
    expect(result.errors.some((e) => e.includes("Incident date"))).toBe(true);
    expect(result.errors.some((e) => e.includes("Assessor name"))).toBe(true);
  });

  it("rejects Abusive category with Low risk level", () => {
    const result = validateHarmfulSexualBehaviour({
      childName: "Alex",
      incidentDate: "2026-05-01",
      assessorName: "Staff A",
      referralSource: "Staff Observation",
      behaviourCategory: "Abusive",
      behaviourDescription: "Detailed description of abusive behaviour observed",
      riskLevel: "Low",
      outcome: "Monitoring",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Abusive or Violent"))).toBe(true);
  });

  it("requires victim support when victim is involved", () => {
    const result = validateHarmfulSexualBehaviour({
      childName: "Alex",
      incidentDate: "2026-05-01",
      assessorName: "Staff A",
      referralSource: "Staff Observation",
      behaviourCategory: "Inappropriate",
      behaviourDescription: "Detailed description of the behaviour observed",
      riskLevel: "Low",
      outcome: "Monitoring",
      victimInvolved: true,
      victimSupportProvided: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Victim support"))).toBe(true);
  });
});

// ── generateCaraInsights ────────────────────────────────────────────────

describe("generateCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [
      makeRow({ id: "h1", behaviour_category: "Inappropriate", risk_level: "Low" }),
    ];
    const insights = generateCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[sky]");
  });

  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
  });
});
