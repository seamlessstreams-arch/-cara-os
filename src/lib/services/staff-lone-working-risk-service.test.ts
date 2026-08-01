import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
} from "./staff-lone-working-risk-service";
import type { StaffLoneWorkingRiskRow } from "./staff-lone-working-risk-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<StaffLoneWorkingRiskRow> = {}): StaffLoneWorkingRiskRow {
  return {
    id: "lwr-1",
    home_id: "home-1",
    assessment_date: "2026-05-01",
    assessor_name: "Assessor A",
    staff_name: "Staff A",
    lone_working_type: "Night Shift",
    risk_level: "Low",
    risk_assessment_completed: true,
    check_in_protocol_agreed: true,
    check_in_frequency: "Hourly",
    personal_alarm_issued: true,
    mobile_phone_available: true,
    emergency_procedures_known: true,
    training_completed: true,
    incident_during_lone_work: false,
    near_miss_reported: false,
    next_review_date: "2026-11-01",
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics (lone working risk)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.unacceptable_count).toBe(0);
    expect(m.risk_assessment_rate).toBeNull();;
    expect(m.training_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts risk levels correctly", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "High" }),
      makeRow({ id: "2", risk_level: "Unacceptable" }),
      makeRow({ id: "3", risk_level: "Low" }),
    ];
    const m = computeMetrics(rows);
    expect(m.high_risk_count).toBe(1);
    expect(m.unacceptable_count).toBe(1);
  });

  it("counts incidents and near misses", () => {
    const rows = [
      makeRow({ id: "1", incident_during_lone_work: true, near_miss_reported: true }),
      makeRow({ id: "2", incident_during_lone_work: false, near_miss_reported: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.incident_count).toBe(1);
    expect(m.near_miss_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", risk_assessment_completed: true, training_completed: true }),
      makeRow({ id: "2", risk_assessment_completed: false, training_completed: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.risk_assessment_rate).toBe(50);
    expect(m.training_rate).toBe(50);
  });

  it("counts non-compliant and unique staff/assessors", () => {
    const rows = [
      makeRow({ id: "1", compliance_status: "Non-Compliant", staff_name: "Alice", assessor_name: "Bob" }),
      makeRow({ id: "2", compliance_status: "Compliant", staff_name: "Alice", assessor_name: "Carol" }),
    ];
    const m = computeMetrics(rows);
    expect(m.non_compliant_count).toBe(1);
    expect(m.unique_staff).toBe(1);
    expect(m.unique_assessors).toBe(2);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts (lone working risk)", () => {
  it("returns empty alerts for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns empty alerts when all records compliant", () => {
    expect(computeAlerts([makeRow()])).toEqual([]);
  });

  it("fires critical alert for unacceptable risk level", () => {
    const rows = [makeRow({ id: "lwr-x", risk_level: "Unacceptable" })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "unacceptable_risk_level");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
  });

  it("fires critical alert for high risk without assessment completed", () => {
    const rows = [makeRow({ id: "1", risk_level: "High", risk_assessment_completed: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "high_risk_no_assessment");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("critical");
  });

  it("fires high alert for high risk without check-in protocol", () => {
    const rows = [makeRow({ id: "1", risk_level: "High", check_in_protocol_agreed: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "high_risk_no_check_in")).toHaveLength(1);
  });

  it("fires high alert for incident during lone work", () => {
    const rows = [makeRow({ id: "1", incident_during_lone_work: true })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "incident_during_lone_work");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("high");
  });

  it("fires medium alert for high risk without personal alarm", () => {
    const rows = [makeRow({ id: "1", risk_level: "High", personal_alarm_issued: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "high_risk_no_alarm")).toHaveLength(1);
  });

  it("fires medium alert for training not completed", () => {
    const rows = [makeRow({ id: "1", training_completed: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "training_not_completed");
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("medium");
  });
});
