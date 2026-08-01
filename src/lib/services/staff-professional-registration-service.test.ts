import { describe, it, expect } from "vitest";
import {
  computeRegistrationMetrics,
  computeRegistrationAlerts,
} from "./staff-professional-registration-service";
import type { StaffProfessionalRegistrationRow } from "./staff-professional-registration-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StaffProfessionalRegistrationRow> = {}): StaffProfessionalRegistrationRow {
  return {
    id: "row-1",
    home_id: "home-1",
    staff_name: "Alice Smith",
    professional_body: "Social Work England",
    registration_number: "SWE-12345",
    registration_status: "Active",
    registration_date: "2024-01-01",
    expiry_date: "2027-01-01",
    pin_verified: true,
    pin_verification_date: "2024-01-15",
    cpd_hours_completed: 30,
    cpd_hours_required: 30,
    fitness_to_practise_clear: true,
    conditions_on_registration: false,
    renewal_submitted: true,
    renewal_date: "2027-01-01",
    notes: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeRegistrationMetrics -----------------------------------------------

describe("computeRegistrationMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeRegistrationMetrics([]);
    expect(m.total_registrations).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.lapsed_count).toBe(0);
    expect(m.suspended_count).toBe(0);
    expect(m.pin_verified_rate).toBeNull();;
    expect(m.cpd_compliance_rate).toBeNull();;
    expect(m.fitness_to_practise_rate).toBeNull();;
    expect(m.conditions_count).toBe(0);
    expect(m.renewal_submitted_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
    expect(m.unique_bodies).toBe(0);
  });

  it("counts registration statuses correctly", () => {
    const rows = [
      makeRow({ id: "1", registration_status: "Active" }),
      makeRow({ id: "2", registration_status: "Expired" }),
      makeRow({ id: "3", registration_status: "Lapsed" }),
      makeRow({ id: "4", registration_status: "Suspended" }),
      makeRow({ id: "5", registration_status: "Pending" }),
    ];
    const m = computeRegistrationMetrics(rows);
    expect(m.total_registrations).toBe(5);
    expect(m.active_count).toBe(1);
    expect(m.expired_count).toBe(1);
    expect(m.lapsed_count).toBe(1);
    expect(m.suspended_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", pin_verified: true, fitness_to_practise_clear: true }),
      makeRow({ id: "2", pin_verified: false, fitness_to_practise_clear: false }),
    ];
    const m = computeRegistrationMetrics(rows);
    expect(m.pin_verified_rate).toBe(50);
    expect(m.fitness_to_practise_rate).toBe(50);
  });

  it("calculates CPD compliance rate correctly", () => {
    const rows = [
      makeRow({ id: "1", cpd_hours_completed: 30, cpd_hours_required: 30 }),
      makeRow({ id: "2", cpd_hours_completed: 10, cpd_hours_required: 30 }),
    ];
    const m = computeRegistrationMetrics(rows);
    expect(m.cpd_compliance_rate).toBe(50);
  });

  it("counts conditions on registration", () => {
    const rows = [
      makeRow({ id: "1", conditions_on_registration: true }),
      makeRow({ id: "2", conditions_on_registration: false }),
      makeRow({ id: "3", conditions_on_registration: true }),
    ];
    const m = computeRegistrationMetrics(rows);
    expect(m.conditions_count).toBe(2);
  });

  it("counts unique staff and bodies", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Alice", professional_body: "Social Work England" }),
      makeRow({ id: "2", staff_name: "Bob", professional_body: "Social Work England" }),
      makeRow({ id: "3", staff_name: "Alice", professional_body: "HCPC" }),
    ];
    const m = computeRegistrationMetrics(rows);
    expect(m.unique_staff).toBe(2);
    expect(m.unique_bodies).toBe(2);
  });

  it("returns 100% rates when all conditions met", () => {
    const rows = [makeRow(), makeRow({ id: "2" })];
    const m = computeRegistrationMetrics(rows);
    expect(m.pin_verified_rate).toBe(100);
    expect(m.cpd_compliance_rate).toBe(100);
    expect(m.fitness_to_practise_rate).toBe(100);
    expect(m.renewal_submitted_rate).toBe(100);
  });
});

// -- computeRegistrationAlerts ------------------------------------------------

describe("computeRegistrationAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(computeRegistrationAlerts([])).toEqual([]);
  });

  it("returns no alerts for fully compliant active records", () => {
    const alerts = computeRegistrationAlerts([makeRow()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical for expired registration", () => {
    const rows = [makeRow({ id: "r1", registration_status: "Expired", staff_name: "Alice" })];
    const alerts = computeRegistrationAlerts(rows);
    const critical = alerts.filter((a) => a.type === "registration_expired");
    expect(critical.length).toBe(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("fires critical for revoked registration", () => {
    const rows = [makeRow({ id: "r1", registration_status: "Revoked" })];
    const alerts = computeRegistrationAlerts(rows);
    const critical = alerts.filter((a) => a.type === "registration_revoked");
    expect(critical.length).toBe(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("fires critical for fitness to practise not clear", () => {
    const rows = [makeRow({ id: "r1", fitness_to_practise_clear: false })];
    const alerts = computeRegistrationAlerts(rows);
    const match = alerts.filter((a) => a.type === "fitness_to_practise_concern");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("critical");
  });

  it("fires high for suspended registration", () => {
    const rows = [makeRow({ id: "r1", registration_status: "Suspended" })];
    const alerts = computeRegistrationAlerts(rows);
    const match = alerts.filter((a) => a.type === "registration_suspended");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires high for lapsed registration", () => {
    const rows = [makeRow({ id: "r1", registration_status: "Lapsed" })];
    const alerts = computeRegistrationAlerts(rows);
    const match = alerts.filter((a) => a.type === "registration_lapsed");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires high for PIN not verified", () => {
    const rows = [makeRow({ id: "r1", pin_verified: false })];
    const alerts = computeRegistrationAlerts(rows);
    const match = alerts.filter((a) => a.type === "pin_not_verified");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires medium for CPD hours incomplete", () => {
    const rows = [makeRow({ id: "r1", cpd_hours_completed: 10, cpd_hours_required: 30 })];
    const alerts = computeRegistrationAlerts(rows);
    const match = alerts.filter((a) => a.type === "cpd_hours_incomplete");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("does NOT fire CPD alert when hours met", () => {
    const rows = [makeRow({ id: "r1", cpd_hours_completed: 30, cpd_hours_required: 30 })];
    const alerts = computeRegistrationAlerts(rows);
    expect(alerts.filter((a) => a.type === "cpd_hours_incomplete").length).toBe(0);
  });
});
