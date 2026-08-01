import { describe, it, expect } from "vitest";
import {
  computeTransportMetrics,
  identifyTransportAlerts,
  type TransportRecord,
} from "./transport-safety-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<TransportRecord> = {}): TransportRecord {
  return {
    id: "tr1",
    home_id: "h1",
    event_type: "journey_log",
    event_date: "2025-04-01",
    vehicle_registration: "AB12 CDE",
    vehicle_status: "roadworthy",
    journey_purpose: "school_run",
    driver_name: "Driver A",
    driver_compliance: "fully_compliant",
    children_transported: ["c1"],
    seatbelts_checked: true,
    child_locks_engaged: true,
    risk_assessment_completed: true,
    insurance_valid: true,
    mot_valid: true,
    mileage: 100,
    issues_identified: [],
    actions_taken: [],
    conducted_by: "Staff A",
    next_check_date: null,
    notes: null,
    created_at: "2025-04-01",
    updated_at: "2025-04-01",
    ...overrides,
  };
}

// ── computeTransportMetrics ──────────────────────────────────────────────

describe("computeTransportMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeTransportMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.journey_count).toBe(0);
    expect(m.inspection_count).toBe(0);
    expect(m.incident_count).toBe(0);
    expect(m.roadworthy_rate).toBeNull();;
    expect(m.driver_compliant_rate).toBeNull();;
    expect(m.seatbelts_checked_rate).toBeNull();;
    expect(m.children_transported_count).toBe(0);
    expect(m.check_overdue_count).toBe(0);
  });

  it("counts event types correctly", () => {
    const records = [
      makeRecord({ event_type: "journey_log" }),
      makeRecord({ id: "tr2", event_type: "journey_log" }),
      makeRecord({ id: "tr3", event_type: "vehicle_inspection" }),
      makeRecord({ id: "tr4", event_type: "incident" }),
    ];
    const m = computeTransportMetrics(records);
    expect(m.journey_count).toBe(2);
    expect(m.inspection_count).toBe(1);
    expect(m.incident_count).toBe(1);
  });

  it("calculates roadworthy rate", () => {
    const records = [
      makeRecord({ vehicle_status: "roadworthy" }),
      makeRecord({ id: "tr2", vehicle_status: "major_defects" }),
    ];
    const m = computeTransportMetrics(records);
    expect(m.roadworthy_rate).toBe(50);
    expect(m.major_defects_count).toBe(1);
  });

  it("calculates seatbelt rate only for journey_log records", () => {
    const records = [
      makeRecord({ event_type: "journey_log", seatbelts_checked: true }),
      makeRecord({ id: "tr2", event_type: "journey_log", seatbelts_checked: false }),
      makeRecord({ id: "tr3", event_type: "vehicle_inspection", seatbelts_checked: false }),
    ];
    const m = computeTransportMetrics(records);
    // 1 out of 2 journey_log records = 50%
    expect(m.seatbelts_checked_rate).toBe(50);
  });

  it("counts children transported across all records", () => {
    const records = [
      makeRecord({ children_transported: ["c1", "c2"] }),
      makeRecord({ id: "tr2", children_transported: ["c3"] }),
    ];
    const m = computeTransportMetrics(records);
    expect(m.children_transported_count).toBe(3);
  });

  it("counts overdue checks", () => {
    const records = [
      makeRecord({ next_check_date: "2020-01-01" }),
      makeRecord({ id: "tr2", next_check_date: "2099-12-31" }),
      makeRecord({ id: "tr3", next_check_date: null }),
    ];
    const m = computeTransportMetrics(records);
    expect(m.check_overdue_count).toBe(1);
  });

  it("calculates driver compliance rate", () => {
    const records = [
      makeRecord({ driver_compliance: "fully_compliant" }),
      makeRecord({ id: "tr2", driver_compliance: "non_compliant" }),
    ];
    const m = computeTransportMetrics(records);
    expect(m.driver_compliant_rate).toBe(50);
    expect(m.non_compliant_driver_count).toBe(1);
  });
});

// ── identifyTransportAlerts ──────────────────────────────────────────────

describe("identifyTransportAlerts", () => {
  it("returns empty for no records", () => {
    expect(identifyTransportAlerts([])).toEqual([]);
  });

  it("triggers critical alert for major defects", () => {
    const records = [makeRecord({ vehicle_status: "major_defects" })];
    const alerts = identifyTransportAlerts(records);
    expect(alerts.some((a) => a.type === "major_defects" && a.severity === "critical")).toBe(true);
  });

  it("triggers critical alert for non-compliant driver", () => {
    const records = [makeRecord({ driver_compliance: "non_compliant" })];
    const alerts = identifyTransportAlerts(records);
    expect(alerts.some((a) => a.type === "non_compliant_driver" && a.severity === "critical")).toBe(true);
  });

  it("triggers high alert for invalid insurance", () => {
    const records = [makeRecord({ insurance_valid: false })];
    const alerts = identifyTransportAlerts(records);
    expect(alerts.some((a) => a.type === "documentation_invalid" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for invalid MOT", () => {
    const records = [makeRecord({ mot_valid: false })];
    const alerts = identifyTransportAlerts(records);
    expect(alerts.some((a) => a.type === "documentation_invalid" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for transport incidents", () => {
    const records = [makeRecord({ event_type: "incident" })];
    const alerts = identifyTransportAlerts(records);
    expect(alerts.some((a) => a.type === "transport_incident" && a.severity === "high")).toBe(true);
  });

  it("triggers medium alert for overdue checks", () => {
    const records = [makeRecord({ next_check_date: "2020-01-01" })];
    const alerts = identifyTransportAlerts(records);
    expect(alerts.some((a) => a.type === "check_overdue" && a.severity === "medium")).toBe(true);
  });

  it("does NOT trigger documentation alert when both insurance and MOT valid", () => {
    const records = [makeRecord({ insurance_valid: true, mot_valid: true })];
    const alerts = identifyTransportAlerts(records);
    expect(alerts.some((a) => a.type === "documentation_invalid")).toBe(false);
  });
});
