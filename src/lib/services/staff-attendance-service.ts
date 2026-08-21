// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF ATTENDANCE & TIMEKEEPING SERVICE
// Tracks staff attendance records, punctuality, shift patterns,
// overtime, and compliance with working time regulations.
// CHR 2015 Reg 33 (employment — staffing requirements),
// Reg 22 (contact and access — staff availability),
// Working Time Regulations 1998.
//
// Covers: attendance logging, lateness, early departures, overtime,
// shift compliance, and pattern analysis.
//
// SCCIF: Leadership & Management — "Staffing levels are maintained."
// "Staff attendance supports children's care needs."
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

export type AttendanceStatus =
  | "present"
  | "absent_sick"
  | "absent_unauthorised"
  | "absent_authorised"
  | "late_arrival"
  | "early_departure"
  | "annual_leave"
  | "training"
  | "suspended"
  | "other";

export type ShiftType =
  | "day_shift"
  | "night_shift"
  | "waking_night"
  | "sleep_in"
  | "split_shift"
  | "long_day"
  | "bank_holiday"
  | "overtime"
  | "on_call"
  | "other";

export type OvertimeReason =
  | "staff_shortage"
  | "emergency_cover"
  | "incident_response"
  | "planned_activity"
  | "handover_overrun"
  | "other";

export type ComplianceFlag =
  | "compliant"
  | "exceeded_48h_week"
  | "insufficient_rest"
  | "consecutive_days_exceeded"
  | "night_worker_limit"
  | "not_checked";

export interface AttendanceRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string;
  attendance_date: string;
  attendance_status: AttendanceStatus;
  shift_type: ShiftType;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  hours_worked: number | null;
  overtime_hours: number;
  overtime_reason: OvertimeReason | null;
  late_minutes: number;
  compliance_flag: ComplianceFlag;
  agency_staff_used: boolean;
  minimum_staffing_met: boolean;
  handover_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ATTENDANCE_STATUSES: { status: AttendanceStatus; label: string }[] = [
  { status: "present", label: "Present" },
  { status: "absent_sick", label: "Absent — Sick" },
  { status: "absent_unauthorised", label: "Absent — Unauthorised" },
  { status: "absent_authorised", label: "Absent — Authorised" },
  { status: "late_arrival", label: "Late Arrival" },
  { status: "early_departure", label: "Early Departure" },
  { status: "annual_leave", label: "Annual Leave" },
  { status: "training", label: "Training" },
  { status: "suspended", label: "Suspended" },
  { status: "other", label: "Other" },
];

export const SHIFT_TYPES: { type: ShiftType; label: string }[] = [
  { type: "day_shift", label: "Day Shift" },
  { type: "night_shift", label: "Night Shift" },
  { type: "waking_night", label: "Waking Night" },
  { type: "sleep_in", label: "Sleep In" },
  { type: "split_shift", label: "Split Shift" },
  { type: "long_day", label: "Long Day" },
  { type: "bank_holiday", label: "Bank Holiday" },
  { type: "overtime", label: "Overtime" },
  { type: "on_call", label: "On Call" },
  { type: "other", label: "Other" },
];

export const OVERTIME_REASONS: { reason: OvertimeReason; label: string }[] = [
  { reason: "staff_shortage", label: "Staff Shortage" },
  { reason: "emergency_cover", label: "Emergency Cover" },
  { reason: "incident_response", label: "Incident Response" },
  { reason: "planned_activity", label: "Planned Activity" },
  { reason: "handover_overrun", label: "Handover Overrun" },
  { reason: "other", label: "Other" },
];

export const COMPLIANCE_FLAGS: { flag: ComplianceFlag; label: string }[] = [
  { flag: "compliant", label: "Compliant" },
  { flag: "exceeded_48h_week", label: "Exceeded 48h Week" },
  { flag: "insufficient_rest", label: "Insufficient Rest" },
  { flag: "consecutive_days_exceeded", label: "Consecutive Days Exceeded" },
  { flag: "night_worker_limit", label: "Night Worker Limit" },
  { flag: "not_checked", label: "Not Checked" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeAttendanceMetrics(
  records: AttendanceRecord[],
  totalStaff: number,
): {
  total_records: number;
  present_count: number;
  absent_sick_count: number;
  absent_unauthorised_count: number;
  late_arrival_count: number;
  attendance_rate: number | null;
  punctuality_rate: number | null;
  average_late_minutes: number | null;
  total_overtime_hours: number;
  average_hours_worked: number;
  agency_staff_used_count: number;
  minimum_staffing_met_rate: number | null;
  handover_completed_rate: number | null;
  compliance_rate: number | null;
  non_compliant_count: number;
  staff_coverage: number | null;
  by_attendance_status: Record<string, number>;
  by_shift_type: Record<string, number>;
  by_compliance_flag: Record<string, number>;
  by_overtime_reason: Record<string, number>;
} {
  const present = records.filter((r) => r.attendance_status === "present").length;
  const absentSick = records.filter((r) => r.attendance_status === "absent_sick").length;
  const absentUnauth = records.filter((r) => r.attendance_status === "absent_unauthorised").length;
  const lateArrival = records.filter((r) => r.attendance_status === "late_arrival").length;

  const workingRecords = records.filter(
    (r) => r.attendance_status !== "annual_leave" && r.attendance_status !== "training" && r.attendance_status !== "suspended",
  );
  const attendedRecords = workingRecords.filter(
    (r) => r.attendance_status === "present" || r.attendance_status === "late_arrival" || r.attendance_status === "early_departure",
  );
  const attendanceRate =
    workingRecords.length > 0
      ? Math.round((attendedRecords.length / workingRecords.length) * 1000) / 10
      : null;

  const onTimeRecords = workingRecords.filter(
    (r) => r.attendance_status === "present" || r.attendance_status === "early_departure",
  );
  const punctualityRate =
    workingRecords.length > 0
      ? Math.round((onTimeRecords.length / workingRecords.length) * 1000) / 10
      : null;

  const lateRecords = records.filter((r) => r.late_minutes > 0);
  const avgLate =
    lateRecords.length > 0
      ? Math.round((lateRecords.reduce((sum, r) => sum + r.late_minutes, 0) / lateRecords.length) * 10) / 10
      : null;

  const totalOvertime = Math.round(records.reduce((sum, r) => sum + r.overtime_hours, 0) * 10) / 10;

  const withHours = records.filter((r) => r.hours_worked !== null);
  const avgHours =
    withHours.length > 0
      ? Math.round((withHours.reduce((sum, r) => sum + (r.hours_worked ?? 0), 0) / withHours.length) * 10) / 10
      : 0;

  const agencyUsed = records.filter((r) => r.agency_staff_used).length;

  const minStaffMet = records.filter((r) => r.minimum_staffing_met).length;
  const minStaffRate =
    records.length > 0
      ? Math.round((minStaffMet / records.length) * 1000) / 10
      : null;

  const handoverDone = records.filter((r) => r.handover_completed).length;
  const handoverRate =
    records.length > 0
      ? Math.round((handoverDone / records.length) * 1000) / 10
      : null;

  const compliant = records.filter((r) => r.compliance_flag === "compliant").length;
  const complianceRate =
    records.length > 0
      ? Math.round((compliant / records.length) * 1000) / 10
      : null;

  const nonCompliant = records.filter(
    (r) => r.compliance_flag !== "compliant" && r.compliance_flag !== "not_checked",
  ).length;

  const uniqueStaff = new Set(records.map((r) => r.staff_id)).size;
  const staffCoverage =
    totalStaff > 0
      ? Math.round((uniqueStaff / totalStaff) * 1000) / 10
      : null;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.attendance_status] = (byStatus[r.attendance_status] ?? 0) + 1;

  const byShift: Record<string, number> = {};
  for (const r of records) byShift[r.shift_type] = (byShift[r.shift_type] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.compliance_flag] = (byCompliance[r.compliance_flag] ?? 0) + 1;

  const byOvertime: Record<string, number> = {};
  for (const r of records) {
    if (r.overtime_reason) byOvertime[r.overtime_reason] = (byOvertime[r.overtime_reason] ?? 0) + 1;
  }

  return {
    total_records: records.length,
    present_count: present,
    absent_sick_count: absentSick,
    absent_unauthorised_count: absentUnauth,
    late_arrival_count: lateArrival,
    attendance_rate: attendanceRate,
    punctuality_rate: punctualityRate,
    average_late_minutes: avgLate,
    total_overtime_hours: totalOvertime,
    average_hours_worked: avgHours,
    agency_staff_used_count: agencyUsed,
    minimum_staffing_met_rate: minStaffRate,
    handover_completed_rate: handoverRate,
    compliance_rate: complianceRate,
    non_compliant_count: nonCompliant,
    staff_coverage: staffCoverage,
    by_attendance_status: byStatus,
    by_shift_type: byShift,
    by_compliance_flag: byCompliance,
    by_overtime_reason: byOvertime,
  };
}

export function identifyAttendanceAlerts(
  records: AttendanceRecord[],
  _totalStaff: number,
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

  // Minimum staffing not met
  for (const r of records) {
    if (!r.minimum_staffing_met) {
      alerts.push({
        type: "minimum_staffing_not_met",
        severity: "critical",
        message: `Minimum staffing not met on ${r.attendance_date} (${r.shift_type.replace(/_/g, " ")}) — children's safety may be compromised`,
        id: r.id,
      });
    }
  }

  // Working time non-compliance
  const nonCompliant = records.filter(
    (r) => r.compliance_flag !== "compliant" && r.compliance_flag !== "not_checked",
  );
  for (const r of nonCompliant) {
    alerts.push({
      type: "working_time_breach",
      severity: "high",
      message: `${r.staff_name} has ${r.compliance_flag.replace(/_/g, " ")} on ${r.attendance_date} — Working Time Regulations breach`,
      id: r.id,
    });
  }

  // Unauthorised absences
  const unauth = records.filter((r) => r.attendance_status === "absent_unauthorised").length;
  if (unauth >= 1) {
    alerts.push({
      type: "unauthorised_absence",
      severity: "high",
      message: `${unauth} unauthorised ${unauth === 1 ? "absence" : "absences"} recorded — investigate and address`,
      id: "unauthorised_absence",
    });
  }

  // Agency staff reliance
  const agencyCount = records.filter((r) => r.agency_staff_used).length;
  if (agencyCount >= 3) {
    alerts.push({
      type: "agency_reliance",
      severity: "medium",
      message: `Agency staff used on ${agencyCount} occasions — review recruitment and retention strategy`,
      id: "agency_reliance",
    });
  }

  // Poor punctuality pattern
  const lateRecords = records.filter((r) => r.late_minutes > 0);
  if (lateRecords.length >= 5) {
    alerts.push({
      type: "punctuality_concern",
      severity: "medium",
      message: `${lateRecords.length} late arrivals recorded — address punctuality patterns with staff`,
      id: "punctuality_concern",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    staffId?: string;
    attendanceStatus?: AttendanceStatus;
    shiftType?: ShiftType;
    limit?: number;
  },
): Promise<ServiceResult<AttendanceRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_attendance") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.attendanceStatus) q = q.eq("attendance_status", filters.attendanceStatus);
  if (filters?.shiftType) q = q.eq("shift_type", filters.shiftType);
  q = q.order("attendance_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    staffName: string;
    staffId: string;
    attendanceDate: string;
    attendanceStatus: AttendanceStatus;
    shiftType: ShiftType;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart?: string;
    actualEnd?: string;
    hoursWorked?: number;
    overtimeHours: number;
    overtimeReason?: OvertimeReason;
    lateMinutes: number;
    complianceFlag: ComplianceFlag;
    agencyStaffUsed: boolean;
    minimumStaffingMet: boolean;
    handoverCompleted: boolean;
    notes?: string;
  },
): Promise<ServiceResult<AttendanceRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_attendance") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId,
      attendance_date: input.attendanceDate,
      attendance_status: input.attendanceStatus,
      shift_type: input.shiftType,
      scheduled_start: input.scheduledStart,
      scheduled_end: input.scheduledEnd,
      actual_start: input.actualStart ?? null,
      actual_end: input.actualEnd ?? null,
      hours_worked: input.hoursWorked ?? null,
      overtime_hours: input.overtimeHours,
      overtime_reason: input.overtimeReason ?? null,
      late_minutes: input.lateMinutes,
      compliance_flag: input.complianceFlag,
      agency_staff_used: input.agencyStaffUsed,
      minimum_staffing_met: input.minimumStaffingMet,
      handover_completed: input.handoverCompleted,
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
): Promise<ServiceResult<AttendanceRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_attendance") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAttendanceMetrics,
  identifyAttendanceAlerts,
};
