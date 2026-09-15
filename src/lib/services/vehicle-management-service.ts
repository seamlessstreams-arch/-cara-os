// ══════════════════════════════════════════════════════════════════════════════
// CARA — VEHICLE MANAGEMENT SERVICE
// Tracks home vehicles, MOT status, insurance, daily checks, mileage,
// incidents, and driver authorisation for safe transport of children.
// CHR 2015 Reg 25 (premises and safety — transport),
// Reg 36 (fitness of premises — vehicle maintenance),
// Reg 12 (protection — safeguarding during transport).
//
// Covers: vehicle inventory, MOT/service schedules, daily pre-use checks,
// mileage tracking, driver authorisation, incident recording, insurance.
//
// SCCIF: Helped & Protected — "Children are transported safely."
// "Vehicles are well-maintained and properly insured."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type CheckType =
  | "daily_pre_use"
  | "weekly_inspection"
  | "monthly_service"
  | "mot_test"
  | "annual_service"
  | "insurance_renewal"
  | "breakdown_repair"
  | "accident_damage"
  | "tyre_replacement"
  | "other";

export type CheckOutcome =
  | "pass"
  | "pass_with_advisory"
  | "fail"
  | "deferred"
  | "not_applicable";

export type VehicleCondition =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "unroadworthy";

export type DriverAuthorisation =
  | "fully_authorised"
  | "provisional"
  | "expired"
  | "suspended"
  | "not_authorised";

export interface VehicleCheckRecord {
  id: string;
  home_id: string;
  check_type: CheckType;
  check_date: string;
  check_outcome: CheckOutcome;
  vehicle_condition: VehicleCondition;
  driver_authorisation: DriverAuthorisation;
  vehicle_registration: string;
  vehicle_make_model: string;
  mileage_reading: number;
  mot_expiry_date: string | null;
  insurance_expiry_date: string | null;
  tyres_adequate: boolean;
  brakes_working: boolean;
  lights_working: boolean;
  mirrors_clean: boolean;
  seatbelts_functional: boolean;
  child_locks_working: boolean;
  first_aid_kit_present: boolean;
  fire_extinguisher_present: boolean;
  breakdown_cover_valid: boolean;
  incident_during_journey: boolean;
  children_transported: number;
  staff_driver: string;
  defects_found: string[];
  actions_taken: string[];
  issues_found: string[];
  next_service_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CHECK_TYPES: { type: CheckType; label: string }[] = [
  { type: "daily_pre_use", label: "Daily Pre-Use" },
  { type: "weekly_inspection", label: "Weekly Inspection" },
  { type: "monthly_service", label: "Monthly Service" },
  { type: "mot_test", label: "MOT Test" },
  { type: "annual_service", label: "Annual Service" },
  { type: "insurance_renewal", label: "Insurance Renewal" },
  { type: "breakdown_repair", label: "Breakdown Repair" },
  { type: "accident_damage", label: "Accident Damage" },
  { type: "tyre_replacement", label: "Tyre Replacement" },
  { type: "other", label: "Other" },
];

export const CHECK_OUTCOMES: { outcome: CheckOutcome; label: string }[] = [
  { outcome: "pass", label: "Pass" },
  { outcome: "pass_with_advisory", label: "Pass with Advisory" },
  { outcome: "fail", label: "Fail" },
  { outcome: "deferred", label: "Deferred" },
  { outcome: "not_applicable", label: "Not Applicable" },
];

export const VEHICLE_CONDITIONS: { condition: VehicleCondition; label: string }[] = [
  { condition: "excellent", label: "Excellent" },
  { condition: "good", label: "Good" },
  { condition: "fair", label: "Fair" },
  { condition: "poor", label: "Poor" },
  { condition: "unroadworthy", label: "Unroadworthy" },
];

export const DRIVER_AUTHORISATIONS: { authorisation: DriverAuthorisation; label: string }[] = [
  { authorisation: "fully_authorised", label: "Fully Authorised" },
  { authorisation: "provisional", label: "Provisional" },
  { authorisation: "expired", label: "Expired" },
  { authorisation: "suspended", label: "Suspended" },
  { authorisation: "not_authorised", label: "Not Authorised" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeVehicleMetrics(
  records: VehicleCheckRecord[],
): {
  total_checks: number;
  daily_check_count: number;
  weekly_count: number;
  mot_count: number;
  service_count: number;
  pass_rate: number | null;
  fail_count: number;
  advisory_count: number;
  excellent_condition_rate: number | null;
  poor_condition_count: number;
  unroadworthy_count: number;
  fully_authorised_rate: number | null;
  unauthorised_driver_count: number;
  tyres_adequate_rate: number | null;
  brakes_working_rate: number | null;
  lights_working_rate: number | null;
  seatbelts_rate: number | null;
  child_locks_rate: number | null;
  first_aid_rate: number | null;
  fire_extinguisher_rate: number | null;
  breakdown_cover_rate: number | null;
  incident_count: number;
  total_children_transported: number;
  average_mileage: number | null;
  unique_vehicles: number;
  by_check_type: Record<string, number>;
  by_check_outcome: Record<string, number>;
  by_vehicle_condition: Record<string, number>;
  by_driver_authorisation: Record<string, number>;
} {
  const daily = records.filter((r) => r.check_type === "daily_pre_use").length;
  const weekly = records.filter((r) => r.check_type === "weekly_inspection").length;
  const mot = records.filter((r) => r.check_type === "mot_test").length;
  const service = records.filter(
    (r) => r.check_type === "monthly_service" || r.check_type === "annual_service",
  ).length;

  const pass = records.filter((r) => r.check_outcome === "pass").length;
  const passRate =
    records.length > 0
      ? Math.round((pass / records.length) * 1000) / 10
      : null;

  const fail = records.filter((r) => r.check_outcome === "fail").length;
  const advisory = records.filter((r) => r.check_outcome === "pass_with_advisory").length;

  const excellent = records.filter((r) => r.vehicle_condition === "excellent").length;
  const excellentRate =
    records.length > 0
      ? Math.round((excellent / records.length) * 1000) / 10
      : null;

  const poor = records.filter((r) => r.vehicle_condition === "poor").length;
  const unroadworthy = records.filter((r) => r.vehicle_condition === "unroadworthy").length;

  const fullyAuth = records.filter((r) => r.driver_authorisation === "fully_authorised").length;
  const fullyAuthRate =
    records.length > 0
      ? Math.round((fullyAuth / records.length) * 1000) / 10
      : null;

  const unauthorised = records.filter((r) => r.driver_authorisation === "not_authorised").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof VehicleCheckRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const incident = records.filter((r) => r.incident_during_journey).length;

  const totalChildren = records.reduce((a, r) => a + r.children_transported, 0);

  const mileages = records.map((r) => r.mileage_reading);
  const avgMileage =
    mileages.length > 0
      ? Math.round((mileages.reduce((a, b) => a + b, 0) / mileages.length) * 10) / 10
      : null;

  const uniqueVehicles = new Set(records.map((r) => r.vehicle_registration)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.check_type] = (byType[r.check_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.check_outcome] = (byOutcome[r.check_outcome] ?? 0) + 1;

  const byCondition: Record<string, number> = {};
  for (const r of records) byCondition[r.vehicle_condition] = (byCondition[r.vehicle_condition] ?? 0) + 1;

  const byAuth: Record<string, number> = {};
  for (const r of records) byAuth[r.driver_authorisation] = (byAuth[r.driver_authorisation] ?? 0) + 1;

  return {
    total_checks: records.length,
    daily_check_count: daily,
    weekly_count: weekly,
    mot_count: mot,
    service_count: service,
    pass_rate: passRate,
    fail_count: fail,
    advisory_count: advisory,
    excellent_condition_rate: excellentRate,
    poor_condition_count: poor,
    unroadworthy_count: unroadworthy,
    fully_authorised_rate: fullyAuthRate,
    unauthorised_driver_count: unauthorised,
    tyres_adequate_rate: boolRate("tyres_adequate"),
    brakes_working_rate: boolRate("brakes_working"),
    lights_working_rate: boolRate("lights_working"),
    seatbelts_rate: boolRate("seatbelts_functional"),
    child_locks_rate: boolRate("child_locks_working"),
    first_aid_rate: boolRate("first_aid_kit_present"),
    fire_extinguisher_rate: boolRate("fire_extinguisher_present"),
    breakdown_cover_rate: boolRate("breakdown_cover_valid"),
    incident_count: incident,
    total_children_transported: totalChildren,
    average_mileage: avgMileage,
    unique_vehicles: uniqueVehicles,
    by_check_type: byType,
    by_check_outcome: byOutcome,
    by_vehicle_condition: byCondition,
    by_driver_authorisation: byAuth,
  };
}

export function identifyVehicleAlerts(
  records: VehicleCheckRecord[],
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

  // Unroadworthy vehicle
  for (const r of records) {
    if (r.vehicle_condition === "unroadworthy") {
      alerts.push({
        type: "unroadworthy_vehicle",
        severity: "critical",
        message: `Vehicle ${r.vehicle_registration} is unroadworthy — do not use until repaired`,
        id: r.id,
      });
    }
  }

  // Unauthorised driver
  for (const r of records) {
    if (r.driver_authorisation === "not_authorised") {
      alerts.push({
        type: "unauthorised_driver",
        severity: "critical",
        message: `Unauthorised driver ${r.staff_driver} used vehicle ${r.vehicle_registration} on ${r.check_date} — investigate immediately`,
        id: r.id,
      });
    }
  }

  // Check failure
  const fails = records.filter((r) => r.check_outcome === "fail").length;
  if (fails >= 1) {
    alerts.push({
      type: "check_failure",
      severity: "high",
      message: `${fails} vehicle ${fails === 1 ? "check has" : "checks have"} failed — address defects before use`,
      id: "check_failure",
    });
  }

  // Incident during journey
  const incidents = records.filter((r) => r.incident_during_journey).length;
  if (incidents >= 1) {
    alerts.push({
      type: "journey_incident",
      severity: "high",
      message: `${incidents} ${incidents === 1 ? "incident" : "incidents"} during journeys — review and report`,
      id: "journey_incident",
    });
  }

  // Safety equipment missing
  const noFirstAid = records.filter((r) => !r.first_aid_kit_present).length;
  if (noFirstAid >= 2) {
    alerts.push({
      type: "safety_equipment_missing",
      severity: "medium",
      message: `${noFirstAid} checks without first aid kit present — ensure all vehicles are equipped`,
      id: "safety_equipment_missing",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    checkType?: CheckType;
    checkOutcome?: CheckOutcome;
    vehicleCondition?: VehicleCondition;
    limit?: number;
  },
): Promise<ServiceResult<VehicleCheckRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_vehicle_checks") as SB).select("*").eq("home_id", homeId);
  if (filters?.checkType) q = q.eq("check_type", filters.checkType);
  if (filters?.checkOutcome) q = q.eq("check_outcome", filters.checkOutcome);
  if (filters?.vehicleCondition) q = q.eq("vehicle_condition", filters.vehicleCondition);
  q = q.order("check_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    checkType: CheckType;
    checkDate: string;
    checkOutcome: CheckOutcome;
    vehicleCondition: VehicleCondition;
    driverAuthorisation: DriverAuthorisation;
    vehicleRegistration: string;
    vehicleMakeModel: string;
    mileageReading: number;
    motExpiryDate?: string;
    insuranceExpiryDate?: string;
    tyresAdequate: boolean;
    brakesWorking: boolean;
    lightsWorking: boolean;
    mirrorsClean: boolean;
    seatbeltsFunctional: boolean;
    childLocksWorking: boolean;
    firstAidKitPresent: boolean;
    fireExtinguisherPresent: boolean;
    breakdownCoverValid: boolean;
    incidentDuringJourney: boolean;
    childrenTransported: number;
    staffDriver: string;
    defectsFound: string[];
    actionsTaken: string[];
    issuesFound: string[];
    nextServiceDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<VehicleCheckRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_vehicle_checks") as SB)
    .insert({
      home_id: input.homeId,
      check_type: input.checkType,
      check_date: input.checkDate,
      check_outcome: input.checkOutcome,
      vehicle_condition: input.vehicleCondition,
      driver_authorisation: input.driverAuthorisation,
      vehicle_registration: input.vehicleRegistration,
      vehicle_make_model: input.vehicleMakeModel,
      mileage_reading: input.mileageReading,
      mot_expiry_date: input.motExpiryDate ?? null,
      insurance_expiry_date: input.insuranceExpiryDate ?? null,
      tyres_adequate: input.tyresAdequate,
      brakes_working: input.brakesWorking,
      lights_working: input.lightsWorking,
      mirrors_clean: input.mirrorsClean,
      seatbelts_functional: input.seatbeltsFunctional,
      child_locks_working: input.childLocksWorking,
      first_aid_kit_present: input.firstAidKitPresent,
      fire_extinguisher_present: input.fireExtinguisherPresent,
      breakdown_cover_valid: input.breakdownCoverValid,
      incident_during_journey: input.incidentDuringJourney,
      children_transported: input.childrenTransported,
      staff_driver: input.staffDriver,
      defects_found: input.defectsFound,
      actions_taken: input.actionsTaken,
      issues_found: input.issuesFound,
      next_service_date: input.nextServiceDate ?? null,
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
): Promise<ServiceResult<VehicleCheckRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_vehicle_checks") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeVehicleMetrics,
  identifyVehicleAlerts,
};
