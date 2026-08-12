import { describe, it, expect } from "vitest";
import { _testing, type TemperatureRecord } from "../room-temperature-service";
import { todayStr } from "@/lib/utils";

const { computeTemperatureMetrics, identifyTemperatureAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<TemperatureRecord>): TemperatureRecord {
  return {
    id: overrides?.id ?? "t-1",
    home_id: overrides?.home_id ?? "home-1",
    room_type: overrides?.room_type ?? "bedroom",
    temperature_status: overrides?.temperature_status ?? "comfortable",
    heating_system: overrides?.heating_system ?? "central_heating",
    check_time: overrides?.check_time ?? "morning",
    check_date: overrides?.check_date ?? todayStr(),
    temperature_celsius: overrides?.temperature_celsius ?? 21,
    target_temperature: overrides?.target_temperature ?? 21,
    room_name: overrides?.room_name ?? "Bedroom 1",
    heating_working: overrides?.heating_working ?? true,
    thermostat_set_correctly: overrides?.thermostat_set_correctly ?? true,
    windows_appropriate: overrides?.windows_appropriate ?? true,
    draught_free: overrides?.draught_free ?? true,
    child_comfortable: overrides?.child_comfortable ?? true,
    child_consulted: overrides?.child_consulted ?? true,
    bedding_appropriate: overrides?.bedding_appropriate ?? true,
    clothing_appropriate: overrides?.clothing_appropriate ?? true,
    cold_weather_protocol_active: overrides?.cold_weather_protocol_active ?? false,
    hot_weather_protocol_active: overrides?.hot_weather_protocol_active ?? false,
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    checked_by: overrides?.checked_by ?? "Staff A",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("room-temperature-service", () => {
  // ── computeTemperatureMetrics ───────────────────────────────────────

  describe("computeTemperatureMetrics", () => {
    describe("empty records", () => {
      it("returns zeros for all fields", () => {
        const m = computeTemperatureMetrics([]);
        expect(m.total_checks).toBe(0);
        expect(m.comfortable_rate).toBeNull();;
        expect(m.too_cold_count).toBe(0);
        expect(m.too_hot_count).toBe(0);
        expect(m.borderline_count).toBe(0);
        expect(m.average_temperature).toBeNull();;
        expect(m.min_temperature).toBeNull();;
        expect(m.max_temperature).toBeNull();;
        expect(m.heating_working_rate).toBeNull();;
        expect(m.thermostat_correct_rate).toBeNull();;
        expect(m.windows_appropriate_rate).toBeNull();;
        expect(m.draught_free_rate).toBeNull();;
        expect(m.child_comfortable_rate).toBeNull();;
        expect(m.child_consulted_rate).toBeNull();;
        expect(m.bedding_appropriate_rate).toBeNull();;
        expect(m.cold_protocol_active_count).toBe(0);
        expect(m.hot_protocol_active_count).toBe(0);
        expect(m.unique_rooms).toBe(0);
      });

      it("returns empty breakdowns", () => {
        const m = computeTemperatureMetrics([]);
        expect(m.by_room_type).toEqual({});
        expect(m.by_temperature_status).toEqual({});
        expect(m.by_heating_system).toEqual({});
        expect(m.by_check_time).toEqual({});
      });
    });

    describe("single record defaults", () => {
      it("returns correct basic counts", () => {
        const m = computeTemperatureMetrics([makeRecord()]);
        expect(m.total_checks).toBe(1);
        expect(m.too_cold_count).toBe(0);
        expect(m.too_hot_count).toBe(0);
        expect(m.borderline_count).toBe(0);
      });

      it("returns 100% comfortable_rate", () => {
        const m = computeTemperatureMetrics([makeRecord()]);
        expect(m.comfortable_rate).toBe(100);
      });

      it("returns correct temperature values", () => {
        const m = computeTemperatureMetrics([makeRecord()]);
        expect(m.average_temperature).toBe(21);
        expect(m.min_temperature).toBe(21);
        expect(m.max_temperature).toBe(21);
      });

      it("returns 100% for all boolean rates", () => {
        const m = computeTemperatureMetrics([makeRecord()]);
        expect(m.heating_working_rate).toBe(100);
        expect(m.thermostat_correct_rate).toBe(100);
        expect(m.windows_appropriate_rate).toBe(100);
        expect(m.draught_free_rate).toBe(100);
        expect(m.child_comfortable_rate).toBe(100);
        expect(m.child_consulted_rate).toBe(100);
        expect(m.bedding_appropriate_rate).toBe(100);
      });

      it("returns 0 protocol counts by default", () => {
        const m = computeTemperatureMetrics([makeRecord()]);
        expect(m.cold_protocol_active_count).toBe(0);
        expect(m.hot_protocol_active_count).toBe(0);
      });

      it("returns 1 unique room", () => {
        const m = computeTemperatureMetrics([makeRecord()]);
        expect(m.unique_rooms).toBe(1);
      });
    });

    describe("temperature status counting", () => {
      it("counts comfortable", () => {
        const m = computeTemperatureMetrics([makeRecord({ temperature_status: "comfortable" })]);
        expect(m.comfortable_rate).toBe(100);
        expect(m.too_cold_count).toBe(0);
      });

      it("counts too_cold", () => {
        const m = computeTemperatureMetrics([makeRecord({ temperature_status: "too_cold" })]);
        expect(m.too_cold_count).toBe(1);
        expect(m.comfortable_rate).toBe(0);
      });

      it("counts too_hot", () => {
        const m = computeTemperatureMetrics([makeRecord({ temperature_status: "too_hot" })]);
        expect(m.too_hot_count).toBe(1);
      });

      it("counts borderline_cold as borderline", () => {
        const m = computeTemperatureMetrics([makeRecord({ temperature_status: "borderline_cold" })]);
        expect(m.borderline_count).toBe(1);
      });

      it("counts borderline_hot as borderline", () => {
        const m = computeTemperatureMetrics([makeRecord({ temperature_status: "borderline_hot" })]);
        expect(m.borderline_count).toBe(1);
      });

      it("combines both borderline types", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", temperature_status: "borderline_cold" }),
          makeRecord({ id: "2", temperature_status: "borderline_hot" }),
        ]);
        expect(m.borderline_count).toBe(2);
      });

      it("calculates comfortable_rate with rounding", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", temperature_status: "comfortable" }),
          makeRecord({ id: "2", temperature_status: "comfortable" }),
          makeRecord({ id: "3", temperature_status: "too_cold" }),
        ]);
        expect(m.comfortable_rate).toBe(66.7);
      });

      it("builds by_temperature_status breakdown", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", temperature_status: "comfortable" }),
          makeRecord({ id: "2", temperature_status: "too_cold" }),
          makeRecord({ id: "3", temperature_status: "too_hot" }),
          makeRecord({ id: "4", temperature_status: "borderline_cold" }),
          makeRecord({ id: "5", temperature_status: "borderline_hot" }),
        ]);
        expect(m.by_temperature_status).toEqual({
          comfortable: 1,
          too_cold: 1,
          too_hot: 1,
          borderline_cold: 1,
          borderline_hot: 1,
        });
      });
    });

    describe("temperature calculations", () => {
      it("calculates average temperature", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", temperature_celsius: 20 }),
          makeRecord({ id: "2", temperature_celsius: 22 }),
        ]);
        expect(m.average_temperature).toBe(21);
      });

      it("rounds average to 1 decimal", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", temperature_celsius: 20 }),
          makeRecord({ id: "2", temperature_celsius: 21 }),
          makeRecord({ id: "3", temperature_celsius: 22 }),
        ]);
        expect(m.average_temperature).toBe(21);
      });

      it("rounds average with non-trivial precision", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", temperature_celsius: 19 }),
          makeRecord({ id: "2", temperature_celsius: 20 }),
          makeRecord({ id: "3", temperature_celsius: 21 }),
        ]);
        expect(m.average_temperature).toBe(20);
      });

      it("calculates min temperature", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", temperature_celsius: 15 }),
          makeRecord({ id: "2", temperature_celsius: 22 }),
          makeRecord({ id: "3", temperature_celsius: 18 }),
        ]);
        expect(m.min_temperature).toBe(15);
      });

      it("calculates max temperature", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", temperature_celsius: 15 }),
          makeRecord({ id: "2", temperature_celsius: 28 }),
          makeRecord({ id: "3", temperature_celsius: 18 }),
        ]);
        expect(m.max_temperature).toBe(28);
      });

      it("handles single record for min/max", () => {
        const m = computeTemperatureMetrics([makeRecord({ temperature_celsius: 19 })]);
        expect(m.min_temperature).toBe(19);
        expect(m.max_temperature).toBe(19);
      });

      it("handles decimal temperatures", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", temperature_celsius: 20.5 }),
          makeRecord({ id: "2", temperature_celsius: 21.5 }),
        ]);
        expect(m.average_temperature).toBe(21);
      });

      it("rounds 1/3 average correctly", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", temperature_celsius: 10 }),
          makeRecord({ id: "2", temperature_celsius: 10 }),
          makeRecord({ id: "3", temperature_celsius: 11 }),
        ]);
        expect(m.average_temperature).toBe(10.3);
      });
    });

    describe("boolean rates", () => {
      it("calculates heating_working_rate", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", heating_working: true }),
          makeRecord({ id: "2", heating_working: false }),
        ]);
        expect(m.heating_working_rate).toBe(50);
      });

      it("calculates thermostat_correct_rate", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", thermostat_set_correctly: true }),
          makeRecord({ id: "2", thermostat_set_correctly: false }),
          makeRecord({ id: "3", thermostat_set_correctly: false }),
        ]);
        expect(m.thermostat_correct_rate).toBe(33.3);
      });

      it("calculates windows_appropriate_rate", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", windows_appropriate: false }),
        ]);
        expect(m.windows_appropriate_rate).toBe(0);
      });

      it("calculates draught_free_rate", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", draught_free: true }),
          makeRecord({ id: "2", draught_free: true }),
          makeRecord({ id: "3", draught_free: false }),
        ]);
        expect(m.draught_free_rate).toBe(66.7);
      });

      it("calculates child_comfortable_rate", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", child_comfortable: true }),
        ]);
        expect(m.child_comfortable_rate).toBe(100);
      });

      it("calculates child_consulted_rate", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", child_consulted: false }),
          makeRecord({ id: "2", child_consulted: false }),
        ]);
        expect(m.child_consulted_rate).toBe(0);
      });

      it("calculates bedding_appropriate_rate", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", bedding_appropriate: true }),
          makeRecord({ id: "2", bedding_appropriate: true }),
          makeRecord({ id: "3", bedding_appropriate: true }),
          makeRecord({ id: "4", bedding_appropriate: true }),
          makeRecord({ id: "5", bedding_appropriate: false }),
          makeRecord({ id: "6", bedding_appropriate: false }),
        ]);
        expect(m.bedding_appropriate_rate).toBe(66.7);
      });

      it("handles all false booleans", () => {
        const m = computeTemperatureMetrics([makeRecord({
          heating_working: false,
          thermostat_set_correctly: false,
          windows_appropriate: false,
          draught_free: false,
          child_comfortable: false,
          child_consulted: false,
          bedding_appropriate: false,
        })]);
        expect(m.heating_working_rate).toBe(0);
        expect(m.thermostat_correct_rate).toBe(0);
        expect(m.windows_appropriate_rate).toBe(0);
        expect(m.draught_free_rate).toBe(0);
        expect(m.child_comfortable_rate).toBe(0);
        expect(m.child_consulted_rate).toBe(0);
        expect(m.bedding_appropriate_rate).toBe(0);
      });

      it("rounds 1/7 rate correctly", () => {
        const recs = Array.from({ length: 7 }, (_, i) =>
          makeRecord({ id: `t-${i}`, heating_working: i === 0 }),
        );
        const m = computeTemperatureMetrics(recs);
        expect(m.heating_working_rate).toBe(14.3);
      });
    });

    describe("protocol counts", () => {
      it("counts cold_weather_protocol_active", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", cold_weather_protocol_active: true }),
          makeRecord({ id: "2", cold_weather_protocol_active: false }),
          makeRecord({ id: "3", cold_weather_protocol_active: true }),
        ]);
        expect(m.cold_protocol_active_count).toBe(2);
      });

      it("counts hot_weather_protocol_active", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", hot_weather_protocol_active: true }),
          makeRecord({ id: "2", hot_weather_protocol_active: true }),
        ]);
        expect(m.hot_protocol_active_count).toBe(2);
      });

      it("handles no active protocols", () => {
        const m = computeTemperatureMetrics([makeRecord()]);
        expect(m.cold_protocol_active_count).toBe(0);
        expect(m.hot_protocol_active_count).toBe(0);
      });
    });

    describe("unique_rooms", () => {
      it("counts unique room names", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", room_name: "Bedroom 1" }),
          makeRecord({ id: "2", room_name: "Bedroom 2" }),
          makeRecord({ id: "3", room_name: "Lounge" }),
        ]);
        expect(m.unique_rooms).toBe(3);
      });

      it("deduplicates same room names", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", room_name: "Bedroom 1" }),
          makeRecord({ id: "2", room_name: "Bedroom 1" }),
        ]);
        expect(m.unique_rooms).toBe(1);
      });

      it("is case-sensitive", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", room_name: "bedroom 1" }),
          makeRecord({ id: "2", room_name: "Bedroom 1" }),
        ]);
        expect(m.unique_rooms).toBe(2);
      });
    });

    describe("room type breakdown", () => {
      it("counts bedroom", () => {
        const m = computeTemperatureMetrics([makeRecord({ room_type: "bedroom" })]);
        expect(m.by_room_type).toEqual({ bedroom: 1 });
      });

      it("counts lounge", () => {
        const m = computeTemperatureMetrics([makeRecord({ room_type: "lounge" })]);
        expect(m.by_room_type).toEqual({ lounge: 1 });
      });

      it("counts kitchen", () => {
        const m = computeTemperatureMetrics([makeRecord({ room_type: "kitchen" })]);
        expect(m.by_room_type).toEqual({ kitchen: 1 });
      });

      it("counts dining_room", () => {
        const m = computeTemperatureMetrics([makeRecord({ room_type: "dining_room" })]);
        expect(m.by_room_type).toEqual({ dining_room: 1 });
      });

      it("counts bathroom", () => {
        const m = computeTemperatureMetrics([makeRecord({ room_type: "bathroom" })]);
        expect(m.by_room_type).toEqual({ bathroom: 1 });
      });

      it("counts hallway", () => {
        const m = computeTemperatureMetrics([makeRecord({ room_type: "hallway" })]);
        expect(m.by_room_type).toEqual({ hallway: 1 });
      });

      it("counts office", () => {
        const m = computeTemperatureMetrics([makeRecord({ room_type: "office" })]);
        expect(m.by_room_type).toEqual({ office: 1 });
      });

      it("counts sensory_room", () => {
        const m = computeTemperatureMetrics([makeRecord({ room_type: "sensory_room" })]);
        expect(m.by_room_type).toEqual({ sensory_room: 1 });
      });

      it("counts garden", () => {
        const m = computeTemperatureMetrics([makeRecord({ room_type: "garden" })]);
        expect(m.by_room_type).toEqual({ garden: 1 });
      });

      it("counts other", () => {
        const m = computeTemperatureMetrics([makeRecord({ room_type: "other" })]);
        expect(m.by_room_type).toEqual({ other: 1 });
      });

      it("aggregates multiple room types", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", room_type: "bedroom" }),
          makeRecord({ id: "2", room_type: "bedroom" }),
          makeRecord({ id: "3", room_type: "kitchen" }),
        ]);
        expect(m.by_room_type).toEqual({ bedroom: 2, kitchen: 1 });
      });
    });

    describe("heating system breakdown", () => {
      it("counts central_heating", () => {
        const m = computeTemperatureMetrics([makeRecord({ heating_system: "central_heating" })]);
        expect(m.by_heating_system).toEqual({ central_heating: 1 });
      });

      it("counts electric_radiator", () => {
        const m = computeTemperatureMetrics([makeRecord({ heating_system: "electric_radiator" })]);
        expect(m.by_heating_system).toEqual({ electric_radiator: 1 });
      });

      it("counts underfloor", () => {
        const m = computeTemperatureMetrics([makeRecord({ heating_system: "underfloor" })]);
        expect(m.by_heating_system).toEqual({ underfloor: 1 });
      });

      it("counts air_conditioning", () => {
        const m = computeTemperatureMetrics([makeRecord({ heating_system: "air_conditioning" })]);
        expect(m.by_heating_system).toEqual({ air_conditioning: 1 });
      });

      it("counts portable_heater", () => {
        const m = computeTemperatureMetrics([makeRecord({ heating_system: "portable_heater" })]);
        expect(m.by_heating_system).toEqual({ portable_heater: 1 });
      });

      it("counts heat_pump", () => {
        const m = computeTemperatureMetrics([makeRecord({ heating_system: "heat_pump" })]);
        expect(m.by_heating_system).toEqual({ heat_pump: 1 });
      });

      it("counts log_burner", () => {
        const m = computeTemperatureMetrics([makeRecord({ heating_system: "log_burner" })]);
        expect(m.by_heating_system).toEqual({ log_burner: 1 });
      });

      it("counts none", () => {
        const m = computeTemperatureMetrics([makeRecord({ heating_system: "none" })]);
        expect(m.by_heating_system).toEqual({ none: 1 });
      });

      it("counts mixed", () => {
        const m = computeTemperatureMetrics([makeRecord({ heating_system: "mixed" })]);
        expect(m.by_heating_system).toEqual({ mixed: 1 });
      });

      it("counts other heating", () => {
        const m = computeTemperatureMetrics([makeRecord({ heating_system: "other" })]);
        expect(m.by_heating_system).toEqual({ other: 1 });
      });
    });

    describe("check time breakdown", () => {
      it("counts morning", () => {
        const m = computeTemperatureMetrics([makeRecord({ check_time: "morning" })]);
        expect(m.by_check_time).toEqual({ morning: 1 });
      });

      it("counts afternoon", () => {
        const m = computeTemperatureMetrics([makeRecord({ check_time: "afternoon" })]);
        expect(m.by_check_time).toEqual({ afternoon: 1 });
      });

      it("counts evening", () => {
        const m = computeTemperatureMetrics([makeRecord({ check_time: "evening" })]);
        expect(m.by_check_time).toEqual({ evening: 1 });
      });

      it("counts night", () => {
        const m = computeTemperatureMetrics([makeRecord({ check_time: "night" })]);
        expect(m.by_check_time).toEqual({ night: 1 });
      });

      it("counts random", () => {
        const m = computeTemperatureMetrics([makeRecord({ check_time: "random" })]);
        expect(m.by_check_time).toEqual({ random: 1 });
      });

      it("aggregates multiple check times", () => {
        const m = computeTemperatureMetrics([
          makeRecord({ id: "1", check_time: "morning" }),
          makeRecord({ id: "2", check_time: "morning" }),
          makeRecord({ id: "3", check_time: "evening" }),
        ]);
        expect(m.by_check_time).toEqual({ morning: 2, evening: 1 });
      });
    });
  });

  // ── identifyTemperatureAlerts ───────────────────────────────────────

  describe("identifyTemperatureAlerts", () => {
    describe("no alerts from clean records", () => {
      it("returns empty for clean records", () => {
        const alerts = identifyTemperatureAlerts([makeRecord()]);
        expect(alerts).toEqual([]);
      });

      it("returns empty for empty records", () => {
        const alerts = identifyTemperatureAlerts([]);
        expect(alerts).toEqual([]);
      });

      it("returns empty for multiple clean records", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1" }),
          makeRecord({ id: "2" }),
        ]);
        expect(alerts).toEqual([]);
      });
    });

    describe("too_cold — critical per-record", () => {
      it("generates alert for too cold room", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({
            id: "t-1",
            temperature_status: "too_cold",
            room_name: "Bedroom 2",
            temperature_celsius: 14,
            check_date: "2026-05-14",
          }),
        ]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe("too_cold");
        expect(alerts[0].severity).toBe("critical");
        expect(alerts[0].id).toBe("t-1");
      });

      it("includes room_name in message", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({
            id: "t-1",
            temperature_status: "too_cold",
            room_name: "Bedroom 2",
            temperature_celsius: 14,
            check_date: "2026-05-14",
          }),
        ]);
        expect(alerts[0].message).toContain("Bedroom 2");
      });

      it("includes temperature in message", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({
            id: "t-1",
            temperature_status: "too_cold",
            room_name: "Bedroom 2",
            temperature_celsius: 14,
            check_date: "2026-05-14",
          }),
        ]);
        expect(alerts[0].message).toContain("14°C");
      });

      it("includes check_date in message", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({
            id: "t-1",
            temperature_status: "too_cold",
            room_name: "Bedroom 2",
            temperature_celsius: 14,
            check_date: "2026-05-14",
          }),
        ]);
        expect(alerts[0].message).toContain("2026-05-14");
      });

      it("formats full message correctly", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({
            id: "t-1",
            temperature_status: "too_cold",
            room_name: "Kitchen",
            temperature_celsius: 12,
            check_date: "2026-01-15",
          }),
        ]);
        expect(alerts[0].message).toBe("Kitchen is too cold at 12°C on 2026-01-15 — ensure adequate heating");
      });

      it("generates separate alerts for each too-cold room", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "t-1", temperature_status: "too_cold", room_name: "Bedroom 1", temperature_celsius: 14 }),
          makeRecord({ id: "t-2", temperature_status: "too_cold", room_name: "Bedroom 2", temperature_celsius: 13 }),
        ]);
        const cold = alerts.filter((a) => a.type === "too_cold");
        expect(cold).toHaveLength(2);
        expect(cold[0].id).toBe("t-1");
        expect(cold[1].id).toBe("t-2");
      });

      it("does not alert for comfortable status", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ temperature_status: "comfortable" }),
        ]);
        expect(alerts.filter((a) => a.type === "too_cold")).toHaveLength(0);
      });

      it("does not alert for borderline_cold", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ temperature_status: "borderline_cold" }),
        ]);
        expect(alerts.filter((a) => a.type === "too_cold")).toHaveLength(0);
      });
    });

    describe("heating_broken — high", () => {
      it("generates alert for 1 broken (singular)", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", heating_working: false }),
        ]);
        const a = alerts.find((x) => x.type === "heating_broken")!;
        expect(a.severity).toBe("high");
        expect(a.message).toBe("1 room has non-working heating — repair urgently");
        expect(a.id).toBe("heating_broken");
      });

      it("generates alert for 2 broken (plural)", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", heating_working: false }),
          makeRecord({ id: "2", heating_working: false }),
        ]);
        const a = alerts.find((x) => x.type === "heating_broken")!;
        expect(a.message).toBe("2 rooms have non-working heating — repair urgently");
      });

      it("generates alert for 5 broken", () => {
        const recs = Array.from({ length: 5 }, (_, i) =>
          makeRecord({ id: `t-${i}`, heating_working: false }),
        );
        const alerts = identifyTemperatureAlerts(recs);
        const a = alerts.find((x) => x.type === "heating_broken")!;
        expect(a.message).toContain("5 rooms have");
      });

      it("does not alert when all heating working", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ heating_working: true }),
        ]);
        expect(alerts.filter((a) => a.type === "heating_broken")).toHaveLength(0);
      });
    });

    describe("too_hot — high", () => {
      it("generates alert for 1 too hot (singular)", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", temperature_status: "too_hot" }),
        ]);
        const a = alerts.find((x) => x.type === "too_hot")!;
        expect(a.severity).toBe("high");
        expect(a.message).toBe("1 room is too hot — improve ventilation");
        expect(a.id).toBe("too_hot");
      });

      it("generates alert for 3 too hot (plural)", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", temperature_status: "too_hot" }),
          makeRecord({ id: "2", temperature_status: "too_hot" }),
          makeRecord({ id: "3", temperature_status: "too_hot" }),
        ]);
        const a = alerts.find((x) => x.type === "too_hot")!;
        expect(a.message).toBe("3 rooms are too hot — improve ventilation");
      });

      it("does not alert for borderline_hot", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ temperature_status: "borderline_hot" }),
        ]);
        expect(alerts.filter((a) => a.type === "too_hot")).toHaveLength(0);
      });
    });

    describe("child_uncomfortable — medium, >=2 threshold", () => {
      it("does not alert for 1 uncomfortable", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", child_comfortable: false }),
        ]);
        expect(alerts.filter((a) => a.type === "child_uncomfortable")).toHaveLength(0);
      });

      it("alerts for 2 uncomfortable", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", child_comfortable: false }),
          makeRecord({ id: "2", child_comfortable: false }),
        ]);
        const a = alerts.find((x) => x.type === "child_uncomfortable")!;
        expect(a.severity).toBe("medium");
        expect(a.message).toBe("2 checks where child not comfortable — adjust temperature to preference");
        expect(a.id).toBe("child_uncomfortable");
      });

      it("alerts for 5 uncomfortable", () => {
        const recs = Array.from({ length: 5 }, (_, i) =>
          makeRecord({ id: `t-${i}`, child_comfortable: false }),
        );
        const alerts = identifyTemperatureAlerts(recs);
        const a = alerts.find((x) => x.type === "child_uncomfortable")!;
        expect(a.message).toContain("5 checks");
      });
    });

    describe("child_not_consulted — medium, >=3 threshold", () => {
      it("does not alert for 1 not consulted", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", child_consulted: false }),
        ]);
        expect(alerts.filter((a) => a.type === "child_not_consulted")).toHaveLength(0);
      });

      it("does not alert for 2 not consulted", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", child_consulted: false }),
          makeRecord({ id: "2", child_consulted: false }),
        ]);
        expect(alerts.filter((a) => a.type === "child_not_consulted")).toHaveLength(0);
      });

      it("alerts for 3 not consulted", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", child_consulted: false }),
          makeRecord({ id: "2", child_consulted: false }),
          makeRecord({ id: "3", child_consulted: false }),
        ]);
        const a = alerts.find((x) => x.type === "child_not_consulted")!;
        expect(a.severity).toBe("medium");
        expect(a.message).toBe("3 checks without consulting child — involve children in comfort decisions");
        expect(a.id).toBe("child_not_consulted");
      });

      it("alerts for 6 not consulted", () => {
        const recs = Array.from({ length: 6 }, (_, i) =>
          makeRecord({ id: `t-${i}`, child_consulted: false }),
        );
        const alerts = identifyTemperatureAlerts(recs);
        const a = alerts.find((x) => x.type === "child_not_consulted")!;
        expect(a.message).toContain("6 checks");
      });
    });

    describe("multiple alert types simultaneously", () => {
      it("generates all alert types together", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", temperature_status: "too_cold", room_name: "R1", temperature_celsius: 12 }),
          makeRecord({ id: "2", heating_working: false }),
          makeRecord({ id: "3", temperature_status: "too_hot" }),
          makeRecord({ id: "4", child_comfortable: false }),
          makeRecord({ id: "5", child_comfortable: false }),
          makeRecord({ id: "6", child_consulted: false }),
          makeRecord({ id: "7", child_consulted: false }),
          makeRecord({ id: "8", child_consulted: false }),
        ]);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("too_cold");
        expect(types).toContain("heating_broken");
        expect(types).toContain("too_hot");
        expect(types).toContain("child_uncomfortable");
        expect(types).toContain("child_not_consulted");
      });

      it("critical alerts appear first", () => {
        const alerts = identifyTemperatureAlerts([
          makeRecord({ id: "1", temperature_status: "too_cold", room_name: "R1", temperature_celsius: 12 }),
          makeRecord({ id: "2", temperature_status: "too_hot" }),
        ]);
        expect(alerts[0].severity).toBe("critical");
      });
    });
  });
});
