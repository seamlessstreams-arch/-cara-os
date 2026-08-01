import { describe, it, expect } from "vitest";
import {
  computeTripMetrics,
  identifyTripAlerts,
  type HolidayTripRecord,
} from "./holiday-trips-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<HolidayTripRecord> = {}): HolidayTripRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    trip_type: "day_trip",
    trip_date: "2026-05-01",
    return_date: null,
    trip_status: "completed",
    risk_assessment_status: "completed",
    child_enjoyment: "enjoyed",
    destination: "Beach",
    children_attending: 3,
    staff_attending: 2,
    child_chose_activity: true,
    consent_obtained: true,
    social_worker_informed: true,
    parent_carer_informed: true,
    delegated_authority_used: false,
    emergency_contacts_carried: true,
    medication_taken: true,
    first_aid_kit_carried: true,
    incident_during_trip: false,
    cost: 50,
    budget_approved: true,
    children_names: ["Alice", "Bob", "Charlie"],
    learning_outcomes: ["Teamwork"],
    issues_found: [],
    actions_taken: [],
    organised_by: "Staff A",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeTripMetrics ───────────────────────────────────────────────────

describe("computeTripMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeTripMetrics([]);
    expect(result.total_trips).toBe(0);
    expect(result.day_trip_count).toBe(0);
    expect(result.overnight_count).toBe(0);
    expect(result.completed_count).toBe(0);
    expect(result.loved_it_rate).toBeNull();;
    expect(result.total_cost).toBe(0);
    expect(result.average_cost).toBeNull();;
    expect(result.unique_children).toBe(0);
    expect(result.incident_count).toBe(0);
  });

  it("computes correct counts with populated data", () => {
    const records = [
      makeRecord({ trip_type: "day_trip", child_enjoyment: "loved_it", trip_status: "completed" }),
      makeRecord({ id: "rec-2", trip_type: "overnight_stay", child_enjoyment: "did_not_enjoy", trip_status: "planned" }),
      makeRecord({ id: "rec-3", trip_type: "holiday", child_enjoyment: "enjoyed", trip_status: "cancelled", risk_assessment_status: "overdue" }),
      makeRecord({ id: "rec-4", trip_type: "educational_visit", trip_status: "completed", incident_during_trip: true }),
    ];
    const result = computeTripMetrics(records);
    expect(result.total_trips).toBe(4);
    expect(result.day_trip_count).toBe(1);
    expect(result.overnight_count).toBe(1);
    expect(result.holiday_count).toBe(1);
    expect(result.educational_count).toBe(1);
    expect(result.completed_count).toBe(2);
    expect(result.cancelled_count).toBe(1);
    expect(result.planned_count).toBe(1);
    expect(result.did_not_enjoy_count).toBe(1);
    expect(result.risk_assessment_overdue_count).toBe(1);
    expect(result.incident_count).toBe(1);
    // loved_it_rate: 1/4 = 25%
    expect(result.loved_it_rate).toBe(25);
  });

  it("computes unique_children from children_names", () => {
    const records = [
      makeRecord({ children_names: ["Alice", "Bob"] }),
      makeRecord({ id: "rec-2", children_names: ["Bob", "Charlie"] }),
    ];
    const result = computeTripMetrics(records);
    expect(result.unique_children).toBe(3); // Alice, Bob, Charlie
  });

  it("computes cost metrics", () => {
    const records = [
      makeRecord({ cost: 100 }),
      makeRecord({ id: "rec-2", cost: 200 }),
      makeRecord({ id: "rec-3", cost: null }),
    ];
    const result = computeTripMetrics(records);
    expect(result.total_cost).toBe(300);
    expect(result.average_cost).toBe(150);
  });
});

// ── identifyTripAlerts ───────────────────────────────────────────────────

describe("identifyTripAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyTripAlerts([])).toHaveLength(0);
  });

  it("raises critical alert for incident during trip", () => {
    const records = [makeRecord({ incident_during_trip: true })];
    const alerts = identifyTripAlerts(records);
    const match = alerts.filter((a) => a.type === "incident_during_trip");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises high alert for risk assessment overdue (>= 1)", () => {
    const records = [makeRecord({ risk_assessment_status: "overdue" })];
    const alerts = identifyTripAlerts(records);
    const match = alerts.filter((a) => a.type === "risk_assessment_overdue");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises high alert for no consent obtained (>= 1, not cancelled)", () => {
    const records = [makeRecord({ consent_obtained: false, trip_status: "completed" })];
    const alerts = identifyTripAlerts(records);
    const match = alerts.filter((a) => a.type === "no_consent");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("does NOT raise consent alert for cancelled trips", () => {
    const records = [makeRecord({ consent_obtained: false, trip_status: "cancelled" })];
    const alerts = identifyTripAlerts(records);
    expect(alerts.filter((a) => a.type === "no_consent")).toHaveLength(0);
  });

  it("raises medium alert for child did not enjoy (>= 1)", () => {
    const records = [makeRecord({ child_enjoyment: "did_not_enjoy" })];
    const alerts = identifyTripAlerts(records);
    const match = alerts.filter((a) => a.type === "child_did_not_enjoy");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });

  it("raises medium alert for child not choosing activity (>= 3, not cancelled)", () => {
    const records = [
      makeRecord({ child_chose_activity: false }),
      makeRecord({ id: "rec-2", child_chose_activity: false }),
      makeRecord({ id: "rec-3", child_chose_activity: false }),
    ];
    const alerts = identifyTripAlerts(records);
    const match = alerts.filter((a) => a.type === "child_not_choosing");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });

  it("does NOT raise child_not_choosing alert with only 2 records", () => {
    const records = [
      makeRecord({ child_chose_activity: false }),
      makeRecord({ id: "rec-2", child_chose_activity: false }),
    ];
    const alerts = identifyTripAlerts(records);
    expect(alerts.filter((a) => a.type === "child_not_choosing")).toHaveLength(0);
  });
});
