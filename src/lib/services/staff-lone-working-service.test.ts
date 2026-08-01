import { describe, it, expect } from "vitest";
import {
  computeStaffLoneWorkingMetrics,
  identifyStaffLoneWorkingAlerts,
} from "./staff-lone-working-service";
import type { StaffLoneWorkingRecord } from "./staff-lone-working-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffLoneWorkingRecord> = {}): StaffLoneWorkingRecord {
  return {
    id: "lw-1",
    home_id: "home-1",
    lone_working_scenario: "night_shift_solo",
    risk_level: "low",
    check_in_frequency: "hourly",
    authorisation_level: "manager_approved",
    assessment_date: "2026-05-01",
    staff_name: "Staff A",
    risk_assessed: true,
    manager_authorised: true,
    communication_plan: true,
    emergency_contacts_available: true,
    phone_charged: true,
    check_in_protocol_agreed: true,
    buddy_system_available: false,
    panic_alarm_available: false,
    first_aid_trained: true,
    medication_trained: true,
    safeguarding_trained: true,
    lone_working_policy_read: true,
    issues_found: [],
    actions_taken: [],
    assessed_by: "Manager A",
    next_review_date: "2026-11-01",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffLoneWorkingMetrics -------------------------------------------

describe("computeStaffLoneWorkingMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeStaffLoneWorkingMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.very_high_count).toBe(0);
    expect(m.high_count).toBe(0);
    expect(m.emergency_only_count).toBe(0);
    expect(m.not_authorised_count).toBe(0);
    expect(m.risk_assessed_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts risk levels and authorisation correctly", () => {
    const records = [
      makeRecord({ id: "1", risk_level: "very_high", authorisation_level: "emergency_only", manager_authorised: false }),
      makeRecord({ id: "2", risk_level: "high", manager_authorised: true }),
      makeRecord({ id: "3", risk_level: "low", manager_authorised: true }),
    ];
    const m = computeStaffLoneWorkingMetrics(records);
    expect(m.very_high_count).toBe(1);
    expect(m.high_count).toBe(1);
    expect(m.emergency_only_count).toBe(1);
    expect(m.not_authorised_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", risk_assessed: true, communication_plan: true, lone_working_policy_read: true }),
      makeRecord({ id: "2", risk_assessed: false, communication_plan: false, lone_working_policy_read: false }),
    ];
    const m = computeStaffLoneWorkingMetrics(records);
    expect(m.risk_assessed_rate).toBe(50);
    expect(m.communication_plan_rate).toBe(50);
    expect(m.policy_read_rate).toBe(50);
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Alice" }),
      makeRecord({ id: "2", staff_name: "Bob" }),
      makeRecord({ id: "3", staff_name: "Alice" }),
    ];
    const m = computeStaffLoneWorkingMetrics(records);
    expect(m.unique_staff).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", lone_working_scenario: "night_shift_solo", risk_level: "low" }),
      makeRecord({ id: "2", lone_working_scenario: "night_shift_solo", risk_level: "high" }),
      makeRecord({ id: "3", lone_working_scenario: "community_activity", risk_level: "low" }),
    ];
    const m = computeStaffLoneWorkingMetrics(records);
    expect(m.by_scenario).toEqual({ night_shift_solo: 2, community_activity: 1 });
    expect(m.by_risk_level).toEqual({ low: 2, high: 1 });
  });
});

// -- identifyStaffLoneWorkingAlerts -------------------------------------------

describe("identifyStaffLoneWorkingAlerts", () => {
  it("returns empty alerts for empty array", () => {
    expect(identifyStaffLoneWorkingAlerts([])).toEqual([]);
  });

  it("returns empty alerts when all records compliant", () => {
    expect(identifyStaffLoneWorkingAlerts([makeRecord()])).toEqual([]);
  });

  it("fires critical alert for very_high risk without manager authorisation", () => {
    const records = [
      makeRecord({ id: "lw-x", risk_level: "very_high", manager_authorised: false, staff_name: "Tom" }),
    ];
    const alerts = identifyStaffLoneWorkingAlerts(records);
    const found = alerts.filter((a) => a.type === "very_high_not_authorised");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
  });

  it("fires high alert when >= 1 not risk assessed", () => {
    const records = [makeRecord({ id: "1", risk_assessed: false })];
    const alerts = identifyStaffLoneWorkingAlerts(records);
    expect(alerts.filter((a) => a.type === "not_risk_assessed")).toHaveLength(1);
  });

  it("fires high alert when >= 1 has no communication plan", () => {
    const records = [makeRecord({ id: "1", communication_plan: false })];
    const alerts = identifyStaffLoneWorkingAlerts(records);
    expect(alerts.filter((a) => a.type === "no_communication_plan")).toHaveLength(1);
  });

  it("fires medium alert when >= 2 have no check-in protocol", () => {
    const one = [makeRecord({ id: "1", check_in_protocol_agreed: false })];
    expect(identifyStaffLoneWorkingAlerts(one).filter((a) => a.type === "no_check_in_protocol")).toHaveLength(0);

    const two = [
      makeRecord({ id: "1", check_in_protocol_agreed: false }),
      makeRecord({ id: "2", check_in_protocol_agreed: false }),
    ];
    expect(identifyStaffLoneWorkingAlerts(two).filter((a) => a.type === "no_check_in_protocol")).toHaveLength(1);
  });

  it("fires medium alert when >= 2 have not read policy", () => {
    const one = [makeRecord({ id: "1", lone_working_policy_read: false })];
    expect(identifyStaffLoneWorkingAlerts(one).filter((a) => a.type === "policy_not_read")).toHaveLength(0);

    const two = [
      makeRecord({ id: "1", lone_working_policy_read: false }),
      makeRecord({ id: "2", lone_working_policy_read: false }),
    ];
    expect(identifyStaffLoneWorkingAlerts(two).filter((a) => a.type === "policy_not_read")).toHaveLength(1);
  });
});
