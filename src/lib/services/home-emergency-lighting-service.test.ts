import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
  type HomeEmergencyLightingRow,
} from "./home-emergency-lighting-service";

function makeRow(
  overrides: Partial<HomeEmergencyLightingRow> = {},
): HomeEmergencyLightingRow {
  return {
    id: "row-1",
    home_id: "home-1",
    test_date: "2026-04-01",
    tester_name: "Tester A",
    test_type: "Monthly Function Test",
    location: "Hallway",
    luminaire_type: "Self-Contained",
    test_result: "Pass",
    battery_condition: "Good",
    duration_minutes: 60,
    illumination_adequate: true,
    escape_route_covered: true,
    signage_visible: true,
    fault_identified: false,
    fault_rectified: false,
    next_test_date: null,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_tests).toBe(0);
    expect(m.pass_count).toBe(0);
    expect(m.pass_rate).toBe(0);
    expect(m.avg_duration).toBe(0);
    expect(m.unique_locations).toBe(0);
  });

  it("computes populated data correctly", () => {
    const rows = [
      makeRow({ id: "r1", test_result: "Pass", battery_condition: "Good", location: "Hallway", tester_name: "A", duration_minutes: 60 }),
      makeRow({ id: "r2", test_result: "Fail", battery_condition: "Failed", location: "Kitchen", tester_name: "B", duration_minutes: 30, escape_route_covered: false, compliance_status: "Non-Compliant" }),
      makeRow({ id: "r3", test_result: "Partial", battery_condition: "Poor", location: "Hallway", tester_name: "A", duration_minutes: null, fault_identified: true, fault_rectified: true }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_tests).toBe(3);
    expect(m.pass_count).toBe(1);
    expect(m.fail_count).toBe(1);
    expect(m.partial_count).toBe(1);
    expect(m.pass_rate).toBe(33.3);
    expect(m.battery_good_rate).toBe(33.3); // only "Good" or "Fair" count
    expect(m.battery_poor_rate).toBe(66.7); // "Poor" + "Failed"
    expect(m.escape_route_rate).toBe(66.7);
    expect(m.fault_count).toBe(1);
    expect(m.fault_rectified_rate).toBe(100);
    expect(m.avg_duration).toBe(45); // (60+30)/2
    expect(m.non_compliant_count).toBe(1);
    expect(m.unique_locations).toBe(2);
    expect(m.unique_testers).toBe(2);
  });
});

describe("computeAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns empty for all-good rows", () => {
    expect(computeAlerts([makeRow()])).toEqual([]);
  });

  it("critical: fail_escape_route when Fail and escape_route_covered false", () => {
    const rows = [makeRow({ test_result: "Fail", escape_route_covered: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "fail_escape_route" && a.severity === "critical")).toBe(true);
  });

  it("critical: failed_battery when battery_condition is Failed", () => {
    const rows = [makeRow({ battery_condition: "Failed" })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "failed_battery" && a.severity === "critical")).toBe(true);
  });

  it("high: non_compliant_status when compliance_status is Non-Compliant", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "non_compliant_status" && a.severity === "high")).toBe(true);
  });

  it("high: fault_not_rectified when fault identified but not rectified", () => {
    const rows = [makeRow({ fault_identified: true, fault_rectified: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "fault_not_rectified" && a.severity === "high")).toBe(true);
  });

  it("medium: partial_result when test_result is Partial", () => {
    const rows = [makeRow({ test_result: "Partial" })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "partial_result" && a.severity === "medium")).toBe(true);
  });

  it("medium: illumination_inadequate when illumination_adequate is false", () => {
    const rows = [makeRow({ illumination_adequate: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "illumination_inadequate" && a.severity === "medium")).toBe(true);
  });
});

describe("generateCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [makeRow()];
    const insights = generateCaraInsights(rows);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty data", () => {
    expect(generateCaraInsights([])).toHaveLength(3);
  });
});
