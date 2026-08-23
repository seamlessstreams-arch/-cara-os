// ══════════════════════════════════════════════════════════════════════════════
// CARA — ROOM TEMPERATURE MONITORING SERVICE
// Tracks temperature readings, heating compliance, and comfort levels
// across all rooms in the children's home.
// CHR 2015 Reg 25 (premises — adequate heating),
// Reg 36 (fitness of premises — comfortable temperature),
// Reg 15 (quality standards — suitable environment).
//
// Covers: daily temperature checks, heating system status, comfort
// assessments, cold weather protocols, and summer cooling.
//
// SCCIF: Overall Experiences — "The home is warm and comfortable."
// "Temperature is monitored and maintained appropriately."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type RoomType =
  | "bedroom"
  | "lounge"
  | "kitchen"
  | "dining_room"
  | "bathroom"
  | "hallway"
  | "office"
  | "sensory_room"
  | "garden"
  | "other";

export type TemperatureStatus =
  | "comfortable"
  | "too_cold"
  | "too_hot"
  | "borderline_cold"
  | "borderline_hot";

export type HeatingSystem =
  | "central_heating"
  | "electric_radiator"
  | "underfloor"
  | "air_conditioning"
  | "portable_heater"
  | "heat_pump"
  | "log_burner"
  | "none"
  | "mixed"
  | "other";

export type CheckTime =
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "random";

export interface TemperatureRecord {
  id: string;
  home_id: string;
  room_type: RoomType;
  temperature_status: TemperatureStatus;
  heating_system: HeatingSystem;
  check_time: CheckTime;
  check_date: string;
  temperature_celsius: number;
  target_temperature: number;
  room_name: string;
  heating_working: boolean;
  thermostat_set_correctly: boolean;
  windows_appropriate: boolean;
  draught_free: boolean;
  child_comfortable: boolean;
  child_consulted: boolean;
  bedding_appropriate: boolean;
  clothing_appropriate: boolean;
  cold_weather_protocol_active: boolean;
  hot_weather_protocol_active: boolean;
  issues_found: string[];
  actions_taken: string[];
  checked_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ROOM_TYPES: { type: RoomType; label: string }[] = [
  { type: "bedroom", label: "Bedroom" },
  { type: "lounge", label: "Lounge" },
  { type: "kitchen", label: "Kitchen" },
  { type: "dining_room", label: "Dining Room" },
  { type: "bathroom", label: "Bathroom" },
  { type: "hallway", label: "Hallway" },
  { type: "office", label: "Office" },
  { type: "sensory_room", label: "Sensory Room" },
  { type: "garden", label: "Garden" },
  { type: "other", label: "Other" },
];

export const TEMPERATURE_STATUSES: { status: TemperatureStatus; label: string }[] = [
  { status: "comfortable", label: "Comfortable" },
  { status: "too_cold", label: "Too Cold" },
  { status: "too_hot", label: "Too Hot" },
  { status: "borderline_cold", label: "Borderline Cold" },
  { status: "borderline_hot", label: "Borderline Hot" },
];

export const HEATING_SYSTEMS: { system: HeatingSystem; label: string }[] = [
  { system: "central_heating", label: "Central Heating" },
  { system: "electric_radiator", label: "Electric Radiator" },
  { system: "underfloor", label: "Underfloor Heating" },
  { system: "air_conditioning", label: "Air Conditioning" },
  { system: "portable_heater", label: "Portable Heater" },
  { system: "heat_pump", label: "Heat Pump" },
  { system: "log_burner", label: "Log Burner" },
  { system: "none", label: "None" },
  { system: "mixed", label: "Mixed" },
  { system: "other", label: "Other" },
];

export const CHECK_TIMES: { time: CheckTime; label: string }[] = [
  { time: "morning", label: "Morning" },
  { time: "afternoon", label: "Afternoon" },
  { time: "evening", label: "Evening" },
  { time: "night", label: "Night" },
  { time: "random", label: "Random" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeTemperatureMetrics(
  records: TemperatureRecord[],
): {
  total_checks: number;
  comfortable_rate: number | null;
  too_cold_count: number;
  too_hot_count: number;
  borderline_count: number;
  average_temperature: number | null;
  min_temperature: number | null;
  max_temperature: number | null;
  heating_working_rate: number | null;
  thermostat_correct_rate: number | null;
  windows_appropriate_rate: number | null;
  draught_free_rate: number | null;
  child_comfortable_rate: number | null;
  child_consulted_rate: number | null;
  bedding_appropriate_rate: number | null;
  cold_protocol_active_count: number;
  hot_protocol_active_count: number;
  unique_rooms: number;
  by_room_type: Record<string, number>;
  by_temperature_status: Record<string, number>;
  by_heating_system: Record<string, number>;
  by_check_time: Record<string, number>;
} {
  const comfortable = records.filter((r) => r.temperature_status === "comfortable").length;
  const comfortableRate =
    records.length > 0
      ? Math.round((comfortable / records.length) * 1000) / 10
      : null;

  const tooCold = records.filter((r) => r.temperature_status === "too_cold").length;
  const tooHot = records.filter((r) => r.temperature_status === "too_hot").length;
  const borderline = records.filter(
    (r) => r.temperature_status === "borderline_cold" || r.temperature_status === "borderline_hot",
  ).length;

  const temps = records.map((r) => r.temperature_celsius);
  const avgTemp =
    temps.length > 0
      ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
      : null;
  const minTemp = temps.length > 0 ? Math.min(...temps) : null;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : null;

  const boolRate = (field: keyof TemperatureRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const coldProtocol = records.filter((r) => r.cold_weather_protocol_active).length;
  const hotProtocol = records.filter((r) => r.hot_weather_protocol_active).length;

  const uniqueRooms = new Set(records.map((r) => r.room_name)).size;

  const byRoom: Record<string, number> = {};
  for (const r of records) byRoom[r.room_type] = (byRoom[r.room_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.temperature_status] = (byStatus[r.temperature_status] ?? 0) + 1;

  const byHeating: Record<string, number> = {};
  for (const r of records) byHeating[r.heating_system] = (byHeating[r.heating_system] ?? 0) + 1;

  const byTime: Record<string, number> = {};
  for (const r of records) byTime[r.check_time] = (byTime[r.check_time] ?? 0) + 1;

  return {
    total_checks: records.length,
    comfortable_rate: comfortableRate,
    too_cold_count: tooCold,
    too_hot_count: tooHot,
    borderline_count: borderline,
    average_temperature: avgTemp,
    min_temperature: minTemp,
    max_temperature: maxTemp,
    heating_working_rate: boolRate("heating_working"),
    thermostat_correct_rate: boolRate("thermostat_set_correctly"),
    windows_appropriate_rate: boolRate("windows_appropriate"),
    draught_free_rate: boolRate("draught_free"),
    child_comfortable_rate: boolRate("child_comfortable"),
    child_consulted_rate: boolRate("child_consulted"),
    bedding_appropriate_rate: boolRate("bedding_appropriate"),
    cold_protocol_active_count: coldProtocol,
    hot_protocol_active_count: hotProtocol,
    unique_rooms: uniqueRooms,
    by_room_type: byRoom,
    by_temperature_status: byStatus,
    by_heating_system: byHeating,
    by_check_time: byTime,
  };
}

export function identifyTemperatureAlerts(
  records: TemperatureRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Too cold room
  for (const r of records) {
    if (r.temperature_status === "too_cold") {
      alerts.push({
        type: "too_cold",
        severity: "critical",
        message: `${r.room_name} is too cold at ${r.temperature_celsius}°C on ${r.check_date} — ensure adequate heating`,
        id: r.id,
      });
    }
  }

  // Heating not working
  const heatingBroken = records.filter((r) => !r.heating_working).length;
  if (heatingBroken >= 1) {
    alerts.push({
      type: "heating_broken",
      severity: "high",
      message: `${heatingBroken} ${heatingBroken === 1 ? "room has" : "rooms have"} non-working heating — repair urgently`,
      id: "heating_broken",
    });
  }

  // Too hot room
  const tooHot = records.filter((r) => r.temperature_status === "too_hot").length;
  if (tooHot >= 1) {
    alerts.push({
      type: "too_hot",
      severity: "high",
      message: `${tooHot} ${tooHot === 1 ? "room is" : "rooms are"} too hot — improve ventilation`,
      id: "too_hot",
    });
  }

  // Child not comfortable
  const notComfortable = records.filter((r) => !r.child_comfortable).length;
  if (notComfortable >= 2) {
    alerts.push({
      type: "child_uncomfortable",
      severity: "medium",
      message: `${notComfortable} checks where child not comfortable — adjust temperature to preference`,
      id: "child_uncomfortable",
    });
  }

  // Child not consulted
  const notConsulted = records.filter((r) => !r.child_consulted).length;
  if (notConsulted >= 3) {
    alerts.push({
      type: "child_not_consulted",
      severity: "medium",
      message: `${notConsulted} checks without consulting child — involve children in comfort decisions`,
      id: "child_not_consulted",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    roomType?: RoomType;
    temperatureStatus?: TemperatureStatus;
    checkTime?: CheckTime;
    limit?: number;
  },
): Promise<ServiceResult<TemperatureRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_temperature_checks") as SB).select("*").eq("home_id", homeId);
  if (filters?.roomType) q = q.eq("room_type", filters.roomType);
  if (filters?.temperatureStatus) q = q.eq("temperature_status", filters.temperatureStatus);
  if (filters?.checkTime) q = q.eq("check_time", filters.checkTime);
  q = q.order("check_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    roomType: RoomType;
    temperatureStatus: TemperatureStatus;
    heatingSystem: HeatingSystem;
    checkTime: CheckTime;
    checkDate: string;
    temperatureCelsius: number;
    targetTemperature: number;
    roomName: string;
    heatingWorking: boolean;
    thermostatSetCorrectly: boolean;
    windowsAppropriate: boolean;
    draughtFree: boolean;
    childComfortable: boolean;
    childConsulted: boolean;
    beddingAppropriate: boolean;
    clothingAppropriate: boolean;
    coldWeatherProtocolActive: boolean;
    hotWeatherProtocolActive: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    checkedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<TemperatureRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_temperature_checks") as SB)
    .insert({
      home_id: input.homeId,
      room_type: input.roomType,
      temperature_status: input.temperatureStatus,
      heating_system: input.heatingSystem,
      check_time: input.checkTime,
      check_date: input.checkDate,
      temperature_celsius: input.temperatureCelsius,
      target_temperature: input.targetTemperature,
      room_name: input.roomName,
      heating_working: input.heatingWorking,
      thermostat_set_correctly: input.thermostatSetCorrectly,
      windows_appropriate: input.windowsAppropriate,
      draught_free: input.draughtFree,
      child_comfortable: input.childComfortable,
      child_consulted: input.childConsulted,
      bedding_appropriate: input.beddingAppropriate,
      clothing_appropriate: input.clothingAppropriate,
      cold_weather_protocol_active: input.coldWeatherProtocolActive,
      hot_weather_protocol_active: input.hotWeatherProtocolActive,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      checked_by: input.checkedBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<TemperatureRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_temperature_checks") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeTemperatureMetrics,
  identifyTemperatureAlerts,
};
