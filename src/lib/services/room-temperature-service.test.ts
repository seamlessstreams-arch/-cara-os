import { describe, it, expect } from "vitest";
import {
  computeTemperatureMetrics,
  identifyTemperatureAlerts,
} from "./room-temperature-service";
import type { TemperatureRecord } from "./room-temperature-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<TemperatureRecord> = {}): TemperatureRecord {
  return {
    id: "tr-1",
    home_id: "home-1",
    room_type: "bedroom",
    temperature_status: "comfortable",
    heating_system: "central_heating",
    check_time: "morning",
    check_date: "2026-05-10",
    temperature_celsius: 20,
    target_temperature: 21,
    room_name: "Bedroom 1",
    heating_working: true,
    thermostat_set_correctly: true,
    windows_appropriate: true,
    draught_free: true,
    child_comfortable: true,
    child_consulted: true,
    bedding_appropriate: true,
    clothing_appropriate: true,
    cold_weather_protocol_active: false,
    hot_weather_protocol_active: false,
    issues_found: [],
    actions_taken: [],
    checked_by: "Staff A",
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeTemperatureMetrics ------------------------------------------------

describe("computeTemperatureMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeTemperatureMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.comfortable_rate).toBeNull();;
    expect(m.too_cold_count).toBe(0);
    expect(m.too_hot_count).toBe(0);
    expect(m.borderline_count).toBe(0);
    expect(m.average_temperature).toBeNull();;
    expect(m.min_temperature).toBeNull();;
    expect(m.max_temperature).toBeNull();;
    expect(m.unique_rooms).toBe(0);
  });

  it("computes comfortable rate and status counts", () => {
    const records = [
      makeRecord({ id: "1", temperature_status: "comfortable" }),
      makeRecord({ id: "2", temperature_status: "too_cold" }),
      makeRecord({ id: "3", temperature_status: "too_hot" }),
      makeRecord({ id: "4", temperature_status: "borderline_cold" }),
    ];
    const m = computeTemperatureMetrics(records);
    expect(m.comfortable_rate).toBe(25);
    expect(m.too_cold_count).toBe(1);
    expect(m.too_hot_count).toBe(1);
    expect(m.borderline_count).toBe(1);
  });

  it("computes average, min, max temperature", () => {
    const records = [
      makeRecord({ id: "1", temperature_celsius: 18 }),
      makeRecord({ id: "2", temperature_celsius: 22 }),
    ];
    const m = computeTemperatureMetrics(records);
    expect(m.average_temperature).toBe(20);
    expect(m.min_temperature).toBe(18);
    expect(m.max_temperature).toBe(22);
  });

  it("computes boolean rates", () => {
    const records = [
      makeRecord({ id: "1", heating_working: true }),
      makeRecord({ id: "2", heating_working: false }),
    ];
    const m = computeTemperatureMetrics(records);
    expect(m.heating_working_rate).toBe(50);
  });

  it("counts protocol active records", () => {
    const records = [
      makeRecord({ id: "1", cold_weather_protocol_active: true }),
      makeRecord({ id: "2", hot_weather_protocol_active: true }),
      makeRecord({ id: "3" }),
    ];
    const m = computeTemperatureMetrics(records);
    expect(m.cold_protocol_active_count).toBe(1);
    expect(m.hot_protocol_active_count).toBe(1);
  });

  it("counts unique rooms", () => {
    const records = [
      makeRecord({ id: "1", room_name: "Bedroom 1" }),
      makeRecord({ id: "2", room_name: "Lounge" }),
      makeRecord({ id: "3", room_name: "Bedroom 1" }),
    ];
    const m = computeTemperatureMetrics(records);
    expect(m.unique_rooms).toBe(2);
  });

  it("populates breakdown maps", () => {
    const records = [makeRecord({ room_type: "kitchen", temperature_status: "too_cold", heating_system: "underfloor", check_time: "evening" })];
    const m = computeTemperatureMetrics(records);
    expect(m.by_room_type["kitchen"]).toBe(1);
    expect(m.by_temperature_status["too_cold"]).toBe(1);
    expect(m.by_heating_system["underfloor"]).toBe(1);
    expect(m.by_check_time["evening"]).toBe(1);
  });
});

// -- identifyTemperatureAlerts ------------------------------------------------

describe("identifyTemperatureAlerts", () => {
  it("returns empty for empty array", () => {
    expect(identifyTemperatureAlerts([])).toEqual([]);
  });

  it("fires critical alert for too_cold room", () => {
    const records = [makeRecord({ temperature_status: "too_cold", temperature_celsius: 14 })];
    const alerts = identifyTemperatureAlerts(records);
    const hit = alerts.find((a) => a.type === "too_cold");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("fires high alert for heating not working (>= 1)", () => {
    const records = [makeRecord({ heating_working: false })];
    const alerts = identifyTemperatureAlerts(records);
    const hit = alerts.find((a) => a.type === "heating_broken");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires high alert for too_hot room (>= 1)", () => {
    const records = [makeRecord({ temperature_status: "too_hot" })];
    const alerts = identifyTemperatureAlerts(records);
    const hit = alerts.find((a) => a.type === "too_hot");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires medium alert for child not comfortable (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", child_comfortable: false }),
      makeRecord({ id: "2", child_comfortable: false }),
    ];
    const alerts = identifyTemperatureAlerts(records);
    const hit = alerts.find((a) => a.type === "child_uncomfortable");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("does NOT fire child_uncomfortable for only 1 record", () => {
    const records = [makeRecord({ child_comfortable: false })];
    const alerts = identifyTemperatureAlerts(records);
    expect(alerts.find((a) => a.type === "child_uncomfortable")).toBeUndefined();
  });

  it("fires medium alert for child not consulted (>= 3)", () => {
    const records = [
      makeRecord({ id: "1", child_consulted: false }),
      makeRecord({ id: "2", child_consulted: false }),
      makeRecord({ id: "3", child_consulted: false }),
    ];
    const alerts = identifyTemperatureAlerts(records);
    const hit = alerts.find((a) => a.type === "child_not_consulted");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("does NOT fire child_not_consulted for only 2 records", () => {
    const records = [
      makeRecord({ id: "1", child_consulted: false }),
      makeRecord({ id: "2", child_consulted: false }),
    ];
    const alerts = identifyTemperatureAlerts(records);
    expect(alerts.find((a) => a.type === "child_not_consulted")).toBeUndefined();
  });
});
