import { describe, expect, it } from "vitest";
import {
  computeAlerts,
  type StayingArrangementsRow,
} from "../staying-arrangements-service";

function makeRow(
  overrides: Partial<StayingArrangementsRow> = {},
): StayingArrangementsRow {
  return {
    id: "r-1",
    home_id: "home_oak",
    young_person_name: "Jamie",
    arrangement_type: "Staying Put",
    start_date: "2026-01-05",
    planned_end_date: null,
    actual_end_date: null,
    previous_placement_type: "Residential",
    current_accommodation: "Former placement address",
    support_level: "Regular",
    personal_adviser_name: "Alex Morgan",
    pathway_plan_in_place: true,
    pathway_plan_review_date: null,
    financial_arrangement: "Local Authority Funded",
    weekly_support_hours: 4,
    education_training_status: "In Education",
    health_needs_met: true,
    mental_health_support: false,
    independent_living_skills_progress: "Developing",
    social_network_maintained: true,
    young_person_satisfied: true,
    regular_contact_maintained: true,
    review_frequency: "Monthly",
    last_review_date: null,
    risk_of_breakdown: false,
    early_termination_risk: null,
    status: "Active",
    notes: null,
    created_at: "2026-05-04T10:00:00Z",
    updated_at: "2026-05-04T10:00:00Z",
    ...overrides,
  };
}

describe("tri-state judgements", () => {
  it("splits the health-needs alert between recorded not-met and unrecorded", () => {
    const nullAlert = computeAlerts([makeRow({ health_needs_met: null })])
      .find((a) => a.type === "health_needs_not_met");
    const falseAlert = computeAlerts([makeRow({ health_needs_met: false })])
      .find((a) => a.type === "health_needs_not_met");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });

  it("splits the satisfaction alert the same way", () => {
    const nullAlert = computeAlerts([makeRow({ young_person_satisfied: null })])
      .find((a) => a.type === "not_satisfied");
    const falseAlert = computeAlerts([makeRow({ young_person_satisfied: false })])
      .find((a) => a.type === "not_satisfied");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });

  it("raises no gap alerts when the judgements are recorded as positive", () => {
    const alerts = computeAlerts([makeRow()]);
    expect(alerts.some((a) => a.type === "health_needs_not_met")).toBe(false);
    expect(alerts.some((a) => a.type === "not_satisfied")).toBe(false);
    expect(alerts.some((a) => a.type === "no_regular_contact")).toBe(false);
  });
});
