import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateStayingArrangement,
} from "./staying-arrangements-service";
import type { StayingArrangementsRow } from "./staying-arrangements-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StayingArrangementsRow> = {}): StayingArrangementsRow {
  return {
    id: "sa-1",
    home_id: "home-1",
    young_person_name: "Alex",
    arrangement_type: "Staying Put",
    start_date: "2025-06-01",
    planned_end_date: "2026-12-01",
    actual_end_date: null,
    previous_placement_type: "Foster Care",
    current_accommodation: "Former foster home",
    support_level: "Regular",
    personal_adviser_name: "PA Smith",
    pathway_plan_in_place: true,
    pathway_plan_review_date: "2026-08-01",
    financial_arrangement: "Local Authority Funded",
    weekly_support_hours: 10,
    education_training_status: "In Education",
    health_needs_met: true,
    mental_health_support: true,
    independent_living_skills_progress: "Developing",
    social_network_maintained: true,
    young_person_satisfied: true,
    regular_contact_maintained: true,
    review_frequency: "Monthly",
    last_review_date: "2026-05-01",
    risk_of_breakdown: false,
    early_termination_risk: null,
    status: "Active",
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty array", () => {
    const r = computeMetrics([]);
    expect(r.total_arrangements).toBe(0);
    expect(r.pathway_plan_rate).toBeNull();
    expect(r.satisfaction_rate).toBeNull();
    expect(r.breakdown_risk_count).toBe(0);
    expect(r.neet_count).toBe(0);
    expect(r.successful_completion_rate).toBeNull();; expect(r.average_duration_days).toBeNull();; expect(r.active_arrangements).toBe(0);
    expect(r.unique_young_people).toBe(0);
    expect(r.extended_count).toBe(0);
  });

  it("counts active (Active + Extended) arrangements", () => {
    const rows = [
      makeRow({ id: "1", status: "Active" }),
      makeRow({ id: "2", status: "Extended" }),
      makeRow({ id: "3", status: "Ended Successfully" }),
    ];
    const r = computeMetrics(rows);
    expect(r.active_arrangements).toBe(2);
    expect(r.extended_count).toBe(1);
  });

  it("counts NEET in active arrangements only", () => {
    const rows = [
      makeRow({ id: "1", status: "Active", education_training_status: "NEET" }),
      makeRow({ id: "2", status: "Ended Successfully", education_training_status: "NEET" }),
    ];
    expect(computeMetrics(rows).neet_count).toBe(1);
  });

  it("counts breakdown risk in active arrangements only", () => {
    const rows = [
      makeRow({ id: "1", status: "Active", risk_of_breakdown: true }),
      makeRow({ id: "2", status: "Ended Prematurely", risk_of_breakdown: true }),
    ];
    expect(computeMetrics(rows).breakdown_risk_count).toBe(1);
  });

  it("calculates successful completion rate from ended arrangements", () => {
    const rows = [
      makeRow({ id: "1", status: "Ended Successfully" }),
      makeRow({ id: "2", status: "Transitioned" }),
      makeRow({ id: "3", status: "Ended Prematurely" }),
    ];
    // (2 successes / 3 ended) = 66.7%
    expect(computeMetrics(rows).successful_completion_rate).toBe(66.7);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", pathway_plan_in_place: true, health_needs_met: true }),
      makeRow({ id: "2", pathway_plan_in_place: false, health_needs_met: false }),
    ];
    const r = computeMetrics(rows);
    expect(r.pathway_plan_rate).toBe(50);
    expect(r.health_needs_met_rate).toBe(50);
  });

  it("calculates average duration for arrangements with actual_end_date", () => {
    const rows = [
      makeRow({ id: "1", start_date: "2025-01-01", actual_end_date: "2025-04-01" }), // ~90 days
    ];
    const r = computeMetrics(rows);
    expect(r.average_duration_days).toBe(90);
  });

  it("counts unique young people", () => {
    const rows = [
      makeRow({ id: "1", young_person_name: "Alex" }),
      makeRow({ id: "2", young_person_name: "Jordan" }),
      makeRow({ id: "3", young_person_name: "Alex" }),
    ];
    expect(computeMetrics(rows).unique_young_people).toBe(2);
  });

  it("populates breakdown maps", () => {
    const rows = [
      makeRow({ id: "1", arrangement_type: "Staying Put", support_level: "Intensive", status: "Active" }),
      makeRow({ id: "2", arrangement_type: "Staying Close", support_level: "Regular", status: "Extended" }),
    ];
    const r = computeMetrics(rows);
    expect(r.by_arrangement_type["Staying Put"]).toBe(1);
    expect(r.by_arrangement_type["Staying Close"]).toBe(1);
    expect(r.by_support_level["Intensive"]).toBe(1);
    expect(r.by_status["Active"]).toBe(1);
    expect(r.by_status["Extended"]).toBe(1);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires breakdown_risk_no_detail for active breakdown risk without detail", () => {
    const rows = [
      makeRow({ status: "Active", risk_of_breakdown: true, early_termination_risk: null }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "breakdown_risk_no_detail");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("fires no_pathway_plan for active arrangement without pathway plan", () => {
    const rows = [makeRow({ status: "Active", pathway_plan_in_place: false })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "no_pathway_plan");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("fires neet_status for NEET active arrangement", () => {
    const rows = [makeRow({ status: "Active", education_training_status: "NEET" })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((x) => x.type === "neet_status")).toHaveLength(1);
  });

  it("fires health_needs_not_met for active arrangement", () => {
    const rows = [makeRow({ status: "Active", health_needs_met: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((x) => x.type === "health_needs_not_met")).toHaveLength(1);
  });

  it("fires not_satisfied for active arrangement", () => {
    const rows = [makeRow({ status: "Active", young_person_satisfied: false })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "not_satisfied");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("medium");
  });

  it("does NOT fire alerts for ended arrangements", () => {
    const rows = [
      makeRow({ status: "Ended Successfully", risk_of_breakdown: true, pathway_plan_in_place: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((x) => x.type === "breakdown_risk_no_detail")).toHaveLength(0);
    expect(alerts.filter((x) => x.type === "no_pathway_plan")).toHaveLength(0);
  });
});

// -- validateStayingArrangement -----------------------------------------------

describe("validateStayingArrangement", () => {
  it("returns valid for correct input", () => {
    const result = validateStayingArrangement({
      youngPersonName: "Alex",
      arrangementType: "Staying Put",
      startDate: "2025-06-01",
      previousPlacementType: "Foster Care",
      currentAccommodation: "Former foster home",
      supportLevel: "Regular",
      personalAdviserName: "PA Smith",
      financialArrangement: "Local Authority Funded",
      educationTrainingStatus: "In Education",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing required fields", () => {
    const result = validateStayingArrangement({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects invalid arrangement type", () => {
    const result = validateStayingArrangement({
      youngPersonName: "Alex",
      arrangementType: "Invalid",
      startDate: "2025-06-01",
      previousPlacementType: "Foster Care",
      currentAccommodation: "Home",
      supportLevel: "Regular",
      personalAdviserName: "PA",
      financialArrangement: "Local Authority Funded",
      educationTrainingStatus: "In Education",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Arrangement type"))).toBe(true);
  });

  it("rejects planned end date before start date", () => {
    const result = validateStayingArrangement({
      youngPersonName: "Alex",
      arrangementType: "Staying Put",
      startDate: "2025-06-01",
      plannedEndDate: "2025-01-01",
      previousPlacementType: "Foster Care",
      currentAccommodation: "Home",
      supportLevel: "Regular",
      personalAdviserName: "PA",
      financialArrangement: "Local Authority Funded",
      educationTrainingStatus: "In Education",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Planned end date"))).toBe(true);
  });

  it("rejects Staying Put with non-Foster Care placement", () => {
    const result = validateStayingArrangement({
      youngPersonName: "Alex",
      arrangementType: "Staying Put",
      startDate: "2025-06-01",
      previousPlacementType: "Residential",
      currentAccommodation: "Home",
      supportLevel: "Regular",
      personalAdviserName: "PA",
      financialArrangement: "Local Authority Funded",
      educationTrainingStatus: "In Education",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Staying Put"))).toBe(true);
  });

  it("rejects negative weekly support hours", () => {
    const result = validateStayingArrangement({
      youngPersonName: "Alex",
      arrangementType: "Staying Put",
      startDate: "2025-06-01",
      previousPlacementType: "Foster Care",
      currentAccommodation: "Home",
      supportLevel: "Regular",
      personalAdviserName: "PA",
      financialArrangement: "Local Authority Funded",
      educationTrainingStatus: "In Education",
      weeklySupportHours: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("negative"))).toBe(true);
  });
});
