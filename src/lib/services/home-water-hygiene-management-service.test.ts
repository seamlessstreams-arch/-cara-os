import { describe, it, expect } from "vitest";
import {
  computeWaterHygieneManagementMetrics,
  identifyWaterHygieneManagementAlerts,
  generateWaterHygieneManagementCaraInsights,
  type HomeWaterHygieneManagementRow,
} from "./home-water-hygiene-management-service";

function makeRow(overrides: Partial<HomeWaterHygieneManagementRow> = {}): HomeWaterHygieneManagementRow {
  return {
    id: "row-1",
    home_id: "home-1",
    check_date: "2026-05-01",
    checker_name: "Checker A",
    check_type: "Temperature Monitoring",
    location: "Bathroom 1",
    hot_water_temp: 60,
    cold_water_temp: 15,
    return_temp: 55,
    hot_temp_compliant: true,
    cold_temp_compliant: true,
    flushing_completed: true,
    tmv_functioning: true,
    showerhead_descaled: true,
    dead_legs_identified: false,
    sample_taken: false,
    sample_result: null,
    next_check_date: "2026-06-01",
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeWaterHygieneManagementMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeWaterHygieneManagementMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.hot_temp_compliant_rate).toBe(0);
    expect(m.cold_temp_compliant_rate).toBe(0);
    expect(m.flushing_rate).toBe(0);
    expect(m.sample_taken_rate).toBe(0);
    expect(m.legionella_detected_count).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.avg_hot_temp).toBe(0);
    expect(m.avg_cold_temp).toBe(0);
    expect(m.unique_locations).toBe(0);
    expect(m.unique_checkers).toBe(0);
  });

  it("calculates rates and averages correctly", () => {
    const rows = [
      makeRow({ id: "r1", hot_water_temp: 60, cold_water_temp: 10, hot_temp_compliant: true, cold_temp_compliant: true, flushing_completed: true, sample_taken: true, sample_result: "Clear" }),
      makeRow({ id: "r2", hot_water_temp: 40, cold_water_temp: 25, hot_temp_compliant: false, cold_temp_compliant: false, flushing_completed: false, dead_legs_identified: true, compliance_status: "Non-Compliant", checker_name: "Checker B", location: "Kitchen" }),
      makeRow({ id: "r3", sample_taken: true, sample_result: "Legionella Detected", compliance_status: "Action Required" }),
    ];
    const m = computeWaterHygieneManagementMetrics(rows);
    expect(m.total_checks).toBe(3);
    // hot compliant: 2/3
    expect(m.hot_temp_compliant_rate).toBe(66.7);
    // cold compliant: 2/3
    expect(m.cold_temp_compliant_rate).toBe(66.7);
    // flushing: 2/3
    expect(m.flushing_rate).toBe(66.7);
    // sample taken: 2/3
    expect(m.sample_taken_rate).toBe(66.7);
    expect(m.legionella_detected_count).toBe(1);
    expect(m.non_compliant_count).toBe(1);
    expect(m.action_required_count).toBe(1);
    expect(m.dead_legs_count).toBe(1);
    // avg hot: (60+40+60)/3 ≈ 53.3
    expect(m.avg_hot_temp).toBe(53.3);
    // avg cold: (10+25+15)/3 ≈ 16.7
    expect(m.avg_cold_temp).toBe(16.7);
    expect(m.unique_locations).toBe(2);
    expect(m.unique_checkers).toBe(2);
  });
});

describe("identifyWaterHygieneManagementAlerts", () => {
  it("returns empty for empty data", () => {
    expect(identifyWaterHygieneManagementAlerts([])).toEqual([]);
  });

  it("returns no alerts for compliant data", () => {
    expect(identifyWaterHygieneManagementAlerts([makeRow()])).toEqual([]);
  });

  it("fires critical legionella_detected alert", () => {
    const rows = [makeRow({ sample_result: "Legionella Detected" })];
    const alerts = identifyWaterHygieneManagementAlerts(rows);
    const found = alerts.find((a) => a.type === "legionella_detected");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical hot_water_low when below 50C", () => {
    const rows = [makeRow({ hot_water_temp: 45 })];
    const alerts = identifyWaterHygieneManagementAlerts(rows);
    const found = alerts.find((a) => a.type === "hot_water_low");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
    expect(found!.message).toContain("45°C");
    expect(found!.message).toContain("below 50°C");
  });

  it("does NOT fire hot_water_low when at exactly 50C", () => {
    const rows = [makeRow({ hot_water_temp: 50 })];
    const alerts = identifyWaterHygieneManagementAlerts(rows);
    expect(alerts.find((a) => a.type === "hot_water_low")).toBeUndefined();
  });

  it("fires high cold_water_high when above 20C", () => {
    const rows = [makeRow({ cold_water_temp: 22 })];
    const alerts = identifyWaterHygieneManagementAlerts(rows);
    const found = alerts.find((a) => a.type === "cold_water_high");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("does NOT fire cold_water_high when at exactly 20C", () => {
    const rows = [makeRow({ cold_water_temp: 20 })];
    const alerts = identifyWaterHygieneManagementAlerts(rows);
    expect(alerts.find((a) => a.type === "cold_water_high")).toBeUndefined();
  });

  it("fires high non_compliant alert", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const alerts = identifyWaterHygieneManagementAlerts(rows);
    expect(alerts.find((a) => a.type === "non_compliant")).toBeDefined();
  });

  it("fires medium flushing_incomplete alert", () => {
    const rows = [makeRow({ flushing_completed: false })];
    const alerts = identifyWaterHygieneManagementAlerts(rows);
    expect(alerts.find((a) => a.type === "flushing_incomplete")!.severity).toBe("medium");
  });

  it("fires medium dead_legs_found alert", () => {
    const rows = [makeRow({ dead_legs_identified: true })];
    const alerts = identifyWaterHygieneManagementAlerts(rows);
    expect(alerts.find((a) => a.type === "dead_legs_found")!.severity).toBe("medium");
  });
});

describe("generateWaterHygieneManagementCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateWaterHygieneManagementCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights with correct tags for data with alerts", () => {
    const rows = [makeRow({ sample_result: "Legionella Detected" })];
    const insights = generateWaterHygieneManagementCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[cyan]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });
});
