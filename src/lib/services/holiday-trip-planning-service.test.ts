import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateHolidayTripPlanning,
  generateCaraInsights,
  type HolidayTripPlanningRow,
} from "./holiday-trip-planning-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<HolidayTripPlanningRow> = {}): HolidayTripPlanningRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Alice",
    trip_date: "2026-05-01",
    return_date: null,
    organiser_name: "Staff A",
    trip_type: "Day Trip",
    destination: "London Zoo",
    risk_assessment_completed: true,
    parental_consent: true,
    social_worker_consent: null,
    passport_checked: null,
    insurance_arranged: true,
    emergency_contacts_provided: true,
    medication_packed: null,
    dietary_needs_catered: true,
    staffing_ratio_met: true,
    transport_arranged: "Minibus",
    budget: 100,
    actual_cost: 90,
    child_choice: true,
    child_enjoyment_rating: "Enjoyed",
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
    expect(result.total_trips).toBe(0);
    expect(result.unique_children).toBe(0);
    expect(result.risk_assessment_rate).toBe(0);
    expect(result.positive_enjoyment_rate).toBe(0);
    expect(result.total_budget).toBe(0);
    expect(result.average_trip_cost).toBe(0);
  });

  it("computes correct counts with populated data", () => {
    const rows = [
      makeRow({ child_name: "Alice", trip_type: "Day Trip", child_enjoyment_rating: "Really Enjoyed" }),
      makeRow({ id: "row-2", child_name: "Bob", trip_type: "UK Holiday", child_enjoyment_rating: "Didn't Enjoy" }),
      makeRow({ id: "row-3", child_name: "Alice", trip_type: "Educational Visit", child_enjoyment_rating: null }),
    ];
    const result = computeMetrics(rows);
    expect(result.total_trips).toBe(3);
    expect(result.unique_children).toBe(2);
    expect(result.overnight_count).toBe(1); // UK Holiday
    expect(result.educational_count).toBe(1);
    expect(result.leisure_count).toBe(1); // Day Trip
    // positive enjoyment: 1 out of 2 rated = 50%
    expect(result.positive_enjoyment_rate).toBe(50);
    // negative enjoyment: 1 out of 2 rated = 50%
    expect(result.negative_enjoyment_rate).toBe(50);
    expect(result.average_trips_per_child).toBe(1.5);
  });

  it("computes financial metrics", () => {
    const rows = [
      makeRow({ budget: 200, actual_cost: 180 }),
      makeRow({ id: "row-2", budget: 100, actual_cost: 130 }),
    ];
    const result = computeMetrics(rows);
    expect(result.total_budget).toBe(300);
    expect(result.total_actual_cost).toBe(310);
    expect(result.average_trip_cost).toBe(155);
    // budget_variance: (310 - 300) / 300 * 100 = 3.3%
    expect(result.budget_variance).toBe(3.3);
  });
});

// ── computeAlerts ────────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toHaveLength(0);
  });

  it("raises critical alert for no risk assessment", () => {
    const rows = [makeRow({ risk_assessment_completed: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "no_risk_assessment");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises critical alert for international trip without SW consent", () => {
    const rows = [
      makeRow({ trip_type: "International Holiday", social_worker_consent: false }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "international_no_sw_consent");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises critical alert for international trip without passport", () => {
    const rows = [
      makeRow({ trip_type: "International Holiday", passport_checked: null }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "international_no_passport");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises critical alert for staffing ratio not met", () => {
    const rows = [makeRow({ staffing_ratio_met: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "staffing_ratio_not_met");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises high alert for overnight without emergency contacts", () => {
    const rows = [
      makeRow({ trip_type: "UK Holiday", emergency_contacts_provided: false }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "overnight_no_emergency_contacts");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises high alert for child repeatedly not enjoying trips (>= 2)", () => {
    const rows = [
      makeRow({ child_name: "Alice", child_enjoyment_rating: "Didn't Enjoy" }),
      makeRow({ id: "row-2", child_name: "Alice", child_enjoyment_rating: "Refused to Go" }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "child_not_enjoying_trips");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises medium alert for low child choice rate (>= 5 trips, < 40%)", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `row-${i}`, child_choice: false }),
    );
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "low_child_choice");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });
});

// ── validateHolidayTripPlanning ──────────────────────────────────────────

describe("validateHolidayTripPlanning", () => {
  it("validates a correct input", () => {
    const result = validateHolidayTripPlanning({
      childName: "Alice",
      tripDate: "2026-05-01",
      organiserName: "Staff A",
      tripType: "Day Trip",
      destination: "London Zoo",
      riskAssessmentCompleted: true,
      staffingRatioMet: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing required fields", () => {
    const result = validateHolidayTripPlanning({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects return date before trip date", () => {
    const result = validateHolidayTripPlanning({
      childName: "Alice",
      tripDate: "2026-05-10",
      returnDate: "2026-05-05",
      organiserName: "Staff A",
      tripType: "Day Trip",
      destination: "Park",
      riskAssessmentCompleted: true,
      staffingRatioMet: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("before trip date"))).toBe(true);
  });

  it("rejects negative budget", () => {
    const result = validateHolidayTripPlanning({
      childName: "Alice",
      tripDate: "2026-05-01",
      organiserName: "Staff A",
      tripType: "Day Trip",
      destination: "Park",
      riskAssessmentCompleted: true,
      staffingRatioMet: true,
      budget: -50,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Budget cannot be negative"))).toBe(true);
  });
});

// ── generateCaraInsights ─────────────────────────────────────────────────

describe("generateCaraInsights", () => {
  it("returns 3 insights", () => {
    const insights = generateCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });
});
