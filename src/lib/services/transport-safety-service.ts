// ══════════════════════════════════════════════════════════════════════════════
// CARA — TRANSPORT SAFETY SERVICE
// Tracks vehicle safety checks, driver qualifications, journey logs,
// risk assessments, and transport compliance.
// CHR 2015 Reg 25 (health and safety — transport),
// Reg 12 (protection — safe transport),
// Road Traffic Act 1988 (driver licensing).
//
// Covers: vehicle inspections, driver checks, journey records,
// child transport arrangements, and fleet management.
//
// SCCIF: Helped & Protected — "Transport arrangements are safe."
// "Children travel safely to activities and appointments."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TransportEventType =
  | "vehicle_inspection"
  | "journey_log"
  | "driver_check"
  | "risk_assessment"
  | "incident"
  | "maintenance"
  | "insurance_renewal"
  | "mot_check"
  | "other";

export type VehicleStatus =
  | "roadworthy"
  | "minor_defects"
  | "major_defects"
  | "off_road"
  | "not_checked";

export type JourneyPurpose =
  | "school_run"
  | "medical_appointment"
  | "contact_visit"
  | "activity_outing"
  | "court_hearing"
  | "emergency"
  | "shopping"
  | "other";

export type DriverCompliance =
  | "fully_compliant"
  | "licence_expiring"
  | "insurance_issue"
  | "not_checked"
  | "non_compliant";

export interface TransportRecord {
  id: string;
  home_id: string;
  event_type: TransportEventType;
  event_date: string;
  vehicle_registration: string;
  vehicle_status: VehicleStatus;
  journey_purpose: JourneyPurpose | null;
  driver_name: string;
  driver_compliance: DriverCompliance;
  children_transported: string[];
  seatbelts_checked: boolean;
  child_locks_engaged: boolean;
  risk_assessment_completed: boolean;
  insurance_valid: boolean;
  mot_valid: boolean;
  mileage: number | null;
  issues_identified: string[];
  actions_taken: string[];
  conducted_by: string;
  next_check_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TRANSPORT_EVENT_TYPES: { type: TransportEventType; label: string }[] = [
  { type: "vehicle_inspection", label: "Vehicle Inspection" },
  { type: "journey_log", label: "Journey Log" },
  { type: "driver_check", label: "Driver Check" },
  { type: "risk_assessment", label: "Risk Assessment" },
  { type: "incident", label: "Incident" },
  { type: "maintenance", label: "Maintenance" },
  { type: "insurance_renewal", label: "Insurance Renewal" },
  { type: "mot_check", label: "MOT Check" },
  { type: "other", label: "Other" },
];

export const VEHICLE_STATUSES: { status: VehicleStatus; label: string }[] = [
  { status: "roadworthy", label: "Roadworthy" },
  { status: "minor_defects", label: "Minor Defects" },
  { status: "major_defects", label: "Major Defects" },
  { status: "off_road", label: "Off Road" },
  { status: "not_checked", label: "Not Checked" },
];

export const JOURNEY_PURPOSES: { purpose: JourneyPurpose; label: string }[] = [
  { purpose: "school_run", label: "School Run" },
  { purpose: "medical_appointment", label: "Medical Appointment" },
  { purpose: "contact_visit", label: "Contact Visit" },
  { purpose: "activity_outing", label: "Activity/Outing" },
  { purpose: "court_hearing", label: "Court Hearing" },
  { purpose: "emergency", label: "Emergency" },
  { purpose: "shopping", label: "Shopping" },
  { purpose: "other", label: "Other" },
];

export const DRIVER_COMPLIANCE_STATUSES: { compliance: DriverCompliance; label: string }[] = [
  { compliance: "fully_compliant", label: "Fully Compliant" },
  { compliance: "licence_expiring", label: "Licence Expiring" },
  { compliance: "insurance_issue", label: "Insurance Issue" },
  { compliance: "not_checked", label: "Not Checked" },
  { compliance: "non_compliant", label: "Non-Compliant" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeTransportMetrics(
  records: TransportRecord[],
): {
  total_records: number;
  journey_count: number;
  inspection_count: number;
  incident_count: number;
  roadworthy_rate: number | null;
  major_defects_count: number;
  driver_compliant_rate: number | null;
  non_compliant_driver_count: number;
  seatbelts_checked_rate: number | null;
  child_locks_rate: number | null;
  risk_assessment_rate: number | null;
  insurance_valid_rate: number | null;
  mot_valid_rate: number | null;
  children_transported_count: number;
  check_overdue_count: number;
  by_event_type: Record<string, number>;
  by_vehicle_status: Record<string, number>;
  by_journey_purpose: Record<string, number>;
  by_driver_compliance: Record<string, number>;
} {
  const journeys = records.filter((r) => r.event_type === "journey_log").length;
  const inspections = records.filter((r) => r.event_type === "vehicle_inspection").length;
  const incidents = records.filter((r) => r.event_type === "incident").length;

  const roadworthy = records.filter((r) => r.vehicle_status === "roadworthy").length;
  const roadworthyRate =
    records.length > 0
      ? Math.round((roadworthy / records.length) * 1000) / 10
      : null;

  const majorDefects = records.filter((r) => r.vehicle_status === "major_defects").length;

  const driverCompliant = records.filter((r) => r.driver_compliance === "fully_compliant").length;
  const driverRate =
    records.length > 0
      ? Math.round((driverCompliant / records.length) * 1000) / 10
      : null;

  const nonCompliantDriver = records.filter((r) => r.driver_compliance === "non_compliant").length;

  const journeyRecords = records.filter((r) => r.event_type === "journey_log");
  const seatbelts = journeyRecords.filter((r) => r.seatbelts_checked).length;
  const seatbeltRate =
    journeyRecords.length > 0
      ? Math.round((seatbelts / journeyRecords.length) * 1000) / 10
      : null;

  const childLocks = journeyRecords.filter((r) => r.child_locks_engaged).length;
  const childLockRate =
    journeyRecords.length > 0
      ? Math.round((childLocks / journeyRecords.length) * 1000) / 10
      : null;

  const riskDone = records.filter((r) => r.risk_assessment_completed).length;
  const riskRate =
    records.length > 0
      ? Math.round((riskDone / records.length) * 1000) / 10
      : null;

  const insValid = records.filter((r) => r.insurance_valid).length;
  const insRate =
    records.length > 0
      ? Math.round((insValid / records.length) * 1000) / 10
      : null;

  const motValid = records.filter((r) => r.mot_valid).length;
  const motRate =
    records.length > 0
      ? Math.round((motValid / records.length) * 1000) / 10
      : null;

  const childrenCount = records.reduce((sum, r) => sum + r.children_transported.length, 0);

  const now = new Date();
  const checkOverdue = records.filter((r) => {
    if (!r.next_check_date) return false;
    return new Date(r.next_check_date) < now;
  }).length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;

  const byVehicle: Record<string, number> = {};
  for (const r of records) byVehicle[r.vehicle_status] = (byVehicle[r.vehicle_status] ?? 0) + 1;

  const byPurpose: Record<string, number> = {};
  for (const r of records) {
    if (r.journey_purpose) byPurpose[r.journey_purpose] = (byPurpose[r.journey_purpose] ?? 0) + 1;
  }

  const byDriver: Record<string, number> = {};
  for (const r of records) byDriver[r.driver_compliance] = (byDriver[r.driver_compliance] ?? 0) + 1;

  return {
    total_records: records.length,
    journey_count: journeys,
    inspection_count: inspections,
    incident_count: incidents,
    roadworthy_rate: roadworthyRate,
    major_defects_count: majorDefects,
    driver_compliant_rate: driverRate,
    non_compliant_driver_count: nonCompliantDriver,
    seatbelts_checked_rate: seatbeltRate,
    child_locks_rate: childLockRate,
    risk_assessment_rate: riskRate,
    insurance_valid_rate: insRate,
    mot_valid_rate: motRate,
    children_transported_count: childrenCount,
    check_overdue_count: checkOverdue,
    by_event_type: byType,
    by_vehicle_status: byVehicle,
    by_journey_purpose: byPurpose,
    by_driver_compliance: byDriver,
  };
}

export function identifyTransportAlerts(
  records: TransportRecord[],
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

  // Major defects
  for (const r of records) {
    if (r.vehicle_status === "major_defects") {
      alerts.push({
        type: "major_defects",
        severity: "critical",
        message: `Vehicle ${r.vehicle_registration} has major defects on ${r.event_date} — do not use until repaired`,
        id: r.id,
      });
    }
  }

  // Non-compliant driver
  for (const r of records) {
    if (r.driver_compliance === "non_compliant") {
      alerts.push({
        type: "non_compliant_driver",
        severity: "critical",
        message: `${r.driver_name} is non-compliant to drive on ${r.event_date} — do not permit driving`,
        id: r.id,
      });
    }
  }

  // Insurance or MOT invalid
  for (const r of records) {
    if (!r.insurance_valid || !r.mot_valid) {
      const issue = !r.insurance_valid && !r.mot_valid ? "insurance and MOT" : !r.insurance_valid ? "insurance" : "MOT";
      alerts.push({
        type: "documentation_invalid",
        severity: "high",
        message: `Vehicle ${r.vehicle_registration} has invalid ${issue} on ${r.event_date} — do not use`,
        id: r.id,
      });
    }
  }

  // Transport incidents
  const incidentCount = records.filter((r) => r.event_type === "incident").length;
  if (incidentCount >= 1) {
    alerts.push({
      type: "transport_incident",
      severity: "high",
      message: `${incidentCount} transport ${incidentCount === 1 ? "incident" : "incidents"} recorded — review and address`,
      id: "transport_incident",
    });
  }

  // Check overdue
  const now = new Date();
  const checkOverdue = records.filter((r) => {
    if (!r.next_check_date) return false;
    return new Date(r.next_check_date) < now;
  }).length;
  if (checkOverdue >= 1) {
    alerts.push({
      type: "check_overdue",
      severity: "medium",
      message: `${checkOverdue} vehicle ${checkOverdue === 1 ? "check is" : "checks are"} overdue — schedule promptly`,
      id: "check_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    eventType?: TransportEventType;
    vehicleStatus?: VehicleStatus;
    driverCompliance?: DriverCompliance;
    limit?: number;
  },
): Promise<ServiceResult<TransportRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_transport_safety") as SB).select("*").eq("home_id", homeId);
  if (filters?.eventType) q = q.eq("event_type", filters.eventType);
  if (filters?.vehicleStatus) q = q.eq("vehicle_status", filters.vehicleStatus);
  if (filters?.driverCompliance) q = q.eq("driver_compliance", filters.driverCompliance);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    eventType: TransportEventType;
    eventDate: string;
    vehicleRegistration: string;
    vehicleStatus: VehicleStatus;
    journeyPurpose?: JourneyPurpose;
    driverName: string;
    driverCompliance: DriverCompliance;
    childrenTransported: string[];
    seatbeltsChecked: boolean;
    childLocksEngaged: boolean;
    riskAssessmentCompleted: boolean;
    insuranceValid: boolean;
    motValid: boolean;
    mileage?: number;
    issuesIdentified: string[];
    actionsTaken: string[];
    conductedBy: string;
    nextCheckDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<TransportRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_transport_safety") as SB)
    .insert({
      home_id: input.homeId,
      event_type: input.eventType,
      event_date: input.eventDate,
      vehicle_registration: input.vehicleRegistration,
      vehicle_status: input.vehicleStatus,
      journey_purpose: input.journeyPurpose ?? null,
      driver_name: input.driverName,
      driver_compliance: input.driverCompliance,
      children_transported: input.childrenTransported,
      seatbelts_checked: input.seatbeltsChecked,
      child_locks_engaged: input.childLocksEngaged,
      risk_assessment_completed: input.riskAssessmentCompleted,
      insurance_valid: input.insuranceValid,
      mot_valid: input.motValid,
      mileage: input.mileage ?? null,
      issues_identified: input.issuesIdentified,
      actions_taken: input.actionsTaken,
      conducted_by: input.conductedBy,
      next_check_date: input.nextCheckDate ?? null,
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
): Promise<ServiceResult<TransportRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_transport_safety") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeTransportMetrics,
  identifyTransportAlerts,
};
