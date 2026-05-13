// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF ROTA & WORKFORCE SERVICE
// Manages shift rotas (CHR 2015 Reg 16), absence tracking, staffing compliance,
// agency usage monitoring, and lone working detection.
// Powers ARIA's workforce intelligence and regulatory compliance.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface RotaEntry {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  role: string;
  date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  hours: number;
  is_agency: boolean;
  is_overtime: boolean;
  notes?: string | null;
  status: string; // "planned", "confirmed", "worked", "cancelled", "no_show"
  created_at: string;
  updated_at: string;
}

export interface AbsenceRecord {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason?: string | null;
  approved_by?: string | null;
  status: string; // "requested", "approved", "declined", "cancelled"
  return_to_work_completed: boolean;
  created_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const SHIFT_TYPES: {
  type: string;
  label: string;
  start: string;
  end: string;
  hours: number;
}[] = [
  { type: "early", label: "Early (7am-3pm)", start: "07:00", end: "15:00", hours: 8 },
  { type: "late", label: "Late (2pm-10pm)", start: "14:00", end: "22:00", hours: 8 },
  { type: "long_day", label: "Long Day (8am-10pm)", start: "08:00", end: "22:00", hours: 14 },
  { type: "waking_night", label: "Waking Night (10pm-8am)", start: "22:00", end: "08:00", hours: 10 },
  { type: "sleep_in", label: "Sleep-In", start: "22:00", end: "08:00", hours: 10 },
  { type: "office", label: "Office/Admin (9am-5pm)", start: "09:00", end: "17:00", hours: 8 },
];

export const ABSENCE_TYPES: string[] = [
  "annual_leave", "sick", "compassionate", "training", "toil",
  "unpaid", "maternity", "paternity", "suspension",
];

export const STAFF_ROLES: string[] = [
  "registered_manager", "deputy_manager", "senior_carer",
  "residential_carer", "waking_night", "bank_staff", "agency",
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

const DAY_SHIFT_TYPES = ["early", "late", "long_day", "office"];
const NIGHT_SHIFT_TYPES = ["waking_night", "sleep_in"];
const CARE_SHIFT_TYPES = ["early", "late", "long_day", "waking_night", "sleep_in"];

/**
 * Compute summary for a single date from a set of rota entries.
 */
function computeRotaSummary(
  entries: RotaEntry[],
  date: string,
): {
  date: string;
  total_staff: number;
  by_shift: Record<string, number>;
  by_role: Record<string, number>;
  agency_count: number;
  agency_percentage: number;
  total_hours: number;
  overtime_hours: number;
  gaps: string[];
} {
  const dayEntries = entries.filter(
    (e) => e.date === date && e.status !== "cancelled",
  );

  // Unique staff
  const uniqueStaff = new Set(dayEntries.map((e) => e.staff_id));
  const totalStaff = uniqueStaff.size;

  // By shift type
  const byShift: Record<string, number> = {};
  for (const e of dayEntries) {
    byShift[e.shift_type] = (byShift[e.shift_type] ?? 0) + 1;
  }

  // By role
  const byRole: Record<string, number> = {};
  for (const e of dayEntries) {
    byRole[e.role] = (byRole[e.role] ?? 0) + 1;
  }

  // Agency
  const agencyCount = dayEntries.filter((e) => e.is_agency).length;
  const agencyPercentage =
    totalStaff > 0
      ? Math.round((agencyCount / totalStaff) * 1000) / 10
      : 0;

  // Hours
  const totalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
  const overtimeHours = dayEntries
    .filter((e) => e.is_overtime)
    .reduce((sum, e) => sum + e.hours, 0);

  // Gaps: care shift types with 0 staff (exclude office)
  const gaps: string[] = [];
  for (const shiftType of CARE_SHIFT_TYPES) {
    if (!byShift[shiftType] || byShift[shiftType] === 0) {
      gaps.push(shiftType);
    }
  }

  return {
    date,
    total_staff: totalStaff,
    by_shift: byShift,
    by_role: byRole,
    agency_count: agencyCount,
    agency_percentage: agencyPercentage,
    total_hours: totalHours,
    overtime_hours: overtimeHours,
    gaps,
  };
}

/**
 * Check staffing compliance across multiple dates.
 */
function computeStaffingCompliance(
  entries: RotaEntry[],
  minStaffDay: number,
  minStaffNight: number,
): {
  total_days_checked: number;
  compliant_days: number;
  non_compliant_days: {
    date: string;
    day_staff: number;
    night_staff: number;
    shortfall: string;
  }[];
  agency_reliance_rate: number;
  avg_staff_per_day: number;
  lone_working_incidents: number;
} {
  // Only consider active entries (not cancelled)
  const active = entries.filter((e) => e.status !== "cancelled");

  // Group by date
  const byDate = new Map<string, RotaEntry[]>();
  for (const e of active) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }

  const dates = Array.from(byDate.keys()).sort();
  const totalDaysChecked = dates.length;

  const nonCompliantDays: {
    date: string;
    day_staff: number;
    night_staff: number;
    shortfall: string;
  }[] = [];

  let totalUniqueStaff = 0;
  let loneWorkingIncidents = 0;

  for (const date of dates) {
    const dayEntries = byDate.get(date)!;

    // Unique staff for the day
    const uniqueStaff = new Set(dayEntries.map((e) => e.staff_id));
    totalUniqueStaff += uniqueStaff.size;

    // Day shift staff: unique staff_ids on day shift types
    const dayStaffIds = new Set(
      dayEntries
        .filter((e) => DAY_SHIFT_TYPES.includes(e.shift_type))
        .map((e) => e.staff_id),
    );
    const dayStaff = dayStaffIds.size;

    // Night shift staff: unique staff_ids on night shift types
    const nightStaffIds = new Set(
      dayEntries
        .filter((e) => NIGHT_SHIFT_TYPES.includes(e.shift_type))
        .map((e) => e.staff_id),
    );
    const nightStaff = nightStaffIds.size;

    // Compliance check
    const shortfalls: string[] = [];
    if (dayStaff < minStaffDay) {
      shortfalls.push(`day: ${dayStaff}/${minStaffDay}`);
    }
    if (nightStaff < minStaffNight) {
      shortfalls.push(`night: ${nightStaff}/${minStaffNight}`);
    }

    if (shortfalls.length > 0) {
      nonCompliantDays.push({
        date,
        day_staff: dayStaff,
        night_staff: nightStaff,
        shortfall: shortfalls.join(", "),
      });
    }

    // Lone working: check each shift type — if only 1 staff on any shift type
    const shiftTypeCounts = new Map<string, Set<string>>();
    for (const e of dayEntries) {
      const staff = shiftTypeCounts.get(e.shift_type) ?? new Set<string>();
      staff.add(e.staff_id);
      shiftTypeCounts.set(e.shift_type, staff);
    }

    for (const [, staffIds] of shiftTypeCounts) {
      if (staffIds.size === 1) {
        loneWorkingIncidents++;
        break; // Only count once per day
      }
    }
  }

  // Agency reliance rate
  const totalEntries = active.length;
  const agencyEntries = active.filter((e) => e.is_agency).length;
  const agencyRelianceRate =
    totalEntries > 0
      ? Math.round((agencyEntries / totalEntries) * 1000) / 10
      : 0;

  // Average staff per day (1 decimal)
  const avgStaffPerDay =
    totalDaysChecked > 0
      ? Math.round((totalUniqueStaff / totalDaysChecked) * 10) / 10
      : 0;

  const compliantDays = totalDaysChecked - nonCompliantDays.length;

  return {
    total_days_checked: totalDaysChecked,
    compliant_days: compliantDays,
    non_compliant_days: nonCompliantDays,
    agency_reliance_rate: agencyRelianceRate,
    avg_staff_per_day: avgStaffPerDay,
    lone_working_incidents: loneWorkingIncidents,
  };
}

/**
 * Compute absence profile statistics.
 */
function computeAbsenceProfile(absences: AbsenceRecord[]): {
  total_absences: number;
  total_days_lost: number;
  by_type: Record<string, number>;
  sick_days: number;
  avg_absence_duration: number;
  return_to_work_rate: number;
  current_absences: number;
  staff_with_high_absence: { staff_id: string; staff_name: string; days: number }[];
} {
  const byType: Record<string, number> = {};
  let totalDaysLost = 0;
  let sickDays = 0;
  let currentAbsences = 0;
  let sickAbsenceCount = 0;
  let returnToWorkCompleted = 0;

  const today = new Date().toISOString().slice(0, 10);

  // Per-staff sick days accumulator
  const staffSickDays = new Map<string, { staff_name: string; days: number }>();

  for (const a of absences) {
    // Count by type
    byType[a.absence_type] = (byType[a.absence_type] ?? 0) + 1;

    // Total days lost
    totalDaysLost += a.days;

    // Sick days
    if (a.absence_type === "sick") {
      sickDays += a.days;
      sickAbsenceCount++;
      if (a.return_to_work_completed) {
        returnToWorkCompleted++;
      }

      // Track per-staff sick days
      const existing = staffSickDays.get(a.staff_id);
      if (existing) {
        existing.days += a.days;
      } else {
        staffSickDays.set(a.staff_id, {
          staff_name: a.staff_name,
          days: a.days,
        });
      }
    }

    // Current absences: approved and date range spans today
    if (a.status === "approved" && a.start_date <= today && a.end_date >= today) {
      currentAbsences++;
    }
  }

  // Average absence duration (1 decimal)
  const totalAbsences = absences.length;
  const avgAbsenceDuration =
    totalAbsences > 0
      ? Math.round((totalDaysLost / totalAbsences) * 10) / 10
      : 0;

  // Return to work rate (percentage of sick absences with RTW completed)
  const returnToWorkRate =
    sickAbsenceCount > 0
      ? Math.round((returnToWorkCompleted / sickAbsenceCount) * 1000) / 10
      : 0;

  // Staff with high absence: 10+ sick days, sorted descending
  const staffWithHighAbsence = Array.from(staffSickDays.entries())
    .filter(([, v]) => v.days >= 10)
    .map(([staff_id, v]) => ({
      staff_id,
      staff_name: v.staff_name,
      days: v.days,
    }))
    .sort((a, b) => b.days - a.days);

  return {
    total_absences: totalAbsences,
    total_days_lost: totalDaysLost,
    by_type: byType,
    sick_days: sickDays,
    avg_absence_duration: avgAbsenceDuration,
    return_to_work_rate: returnToWorkRate,
    current_absences: currentAbsences,
    staff_with_high_absence: staffWithHighAbsence,
  };
}

/**
 * Identify rota and workforce alerts.
 */
function identifyRotaAlerts(
  entries: RotaEntry[],
  absences: AbsenceRecord[],
  minStaffDay: number,
  minStaffNight: number,
): {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  date?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium" | "low";
    message: string;
    date?: string;
  }[] = [];

  // Only consider active entries
  const active = entries.filter((e) => e.status !== "cancelled");

  // Group by date
  const byDate = new Map<string, RotaEntry[]>();
  for (const e of active) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }

  for (const [date, dayEntries] of byDate) {
    // Day shift staff count
    const dayStaffIds = new Set(
      dayEntries
        .filter((e) => DAY_SHIFT_TYPES.includes(e.shift_type))
        .map((e) => e.staff_id),
    );
    const dayStaff = dayStaffIds.size;

    // Night shift staff count
    const nightStaffIds = new Set(
      dayEntries
        .filter((e) => NIGHT_SHIFT_TYPES.includes(e.shift_type))
        .map((e) => e.staff_id),
    );
    const nightStaff = nightStaffIds.size;

    // Understaffed — day below minimum
    if (dayStaff < minStaffDay) {
      alerts.push({
        type: "understaffed",
        severity: "critical",
        message: `Day shift understaffed on ${date}: ${dayStaff} staff rostered, minimum ${minStaffDay} required`,
        date,
      });
    }

    // Understaffed — night below minimum
    if (nightStaff < minStaffNight) {
      alerts.push({
        type: "understaffed",
        severity: "critical",
        message: `Night shift understaffed on ${date}: ${nightStaff} staff rostered, minimum ${minStaffNight} required`,
        date,
      });
    }

    // No night cover
    if (nightStaffIds.size === 0) {
      alerts.push({
        type: "no_night_cover",
        severity: "critical",
        message: `No waking night or sleep-in cover on ${date}`,
        date,
      });
    }

    // High agency usage (>30% on a day)
    const totalStaff = new Set(dayEntries.map((e) => e.staff_id)).size;
    const agencyCount = dayEntries.filter((e) => e.is_agency).length;
    if (totalStaff > 0 && (agencyCount / totalStaff) * 100 > 30) {
      const pct = Math.round((agencyCount / totalStaff) * 1000) / 10;
      alerts.push({
        type: "high_agency",
        severity: "high",
        message: `High agency reliance on ${date}: ${pct}% agency staff (${agencyCount}/${totalStaff})`,
        date,
      });
    }

    // Lone working: only 1 staff on any shift type
    const shiftTypeCounts = new Map<string, Set<string>>();
    for (const e of dayEntries) {
      const staff = shiftTypeCounts.get(e.shift_type) ?? new Set<string>();
      staff.add(e.staff_id);
      shiftTypeCounts.set(e.shift_type, staff);
    }

    for (const [shiftType, staffIds] of shiftTypeCounts) {
      if (staffIds.size === 1) {
        const shiftConfig = SHIFT_TYPES.find((s) => s.type === shiftType);
        const label = shiftConfig?.label ?? shiftType;
        alerts.push({
          type: "lone_working",
          severity: "high",
          message: `Lone working on ${date}: only 1 staff on ${label}`,
          date,
        });
      }
    }
  }

  // Unfilled shifts: cancelled entries with no replacement on same date/shift_type
  const cancelled = entries.filter((e) => e.status === "cancelled");
  for (const c of cancelled) {
    const replacement = active.find(
      (e) =>
        e.date === c.date &&
        e.shift_type === c.shift_type &&
        e.staff_id !== c.staff_id,
    );
    if (!replacement) {
      const shiftConfig = SHIFT_TYPES.find((s) => s.type === c.shift_type);
      const label = shiftConfig?.label ?? c.shift_type;
      alerts.push({
        type: "unfilled_shift",
        severity: "medium",
        message: `Unfilled ${label} shift on ${c.date} — ${c.staff_name}'s shift was cancelled with no replacement`,
        date: c.date,
      });
    }
  }

  // High sickness: staff with 10+ sick days
  const staffSickDays = new Map<string, { name: string; days: number }>();
  for (const a of absences) {
    if (a.absence_type === "sick") {
      const existing = staffSickDays.get(a.staff_id);
      if (existing) {
        existing.days += a.days;
      } else {
        staffSickDays.set(a.staff_id, { name: a.staff_name, days: a.days });
      }
    }
  }

  for (const [, v] of staffSickDays) {
    if (v.days >= 10) {
      alerts.push({
        type: "high_sickness",
        severity: "medium",
        message: `${v.name} has ${v.days} sick days in the current period — consider welfare check`,
      });
    }
  }

  return alerts;
}

// ── CRUD — Rota Entries ─────────────────────────────────────────────────────

export async function listRotaEntries(
  homeId: string,
  filters?: {
    staffId?: string;
    dateFrom?: string;
    dateTo?: string;
    shiftType?: string;
    limit?: number;
  },
): Promise<ServiceResult<RotaEntry[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_rota_entries") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.dateFrom) q = q.gte("date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("date", filters.dateTo);
  if (filters?.shiftType) q = q.eq("shift_type", filters.shiftType);
  q = q.order("date", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRotaEntry(
  id: string,
): Promise<ServiceResult<RotaEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_rota_entries") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRotaEntry(
  input: Omit<RotaEntry, "id" | "status" | "created_at" | "updated_at">,
): Promise<ServiceResult<RotaEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_rota_entries") as SB)
    .insert({
      home_id: input.home_id,
      staff_id: input.staff_id,
      staff_name: input.staff_name,
      role: input.role,
      date: input.date,
      shift_type: input.shift_type,
      start_time: input.start_time,
      end_time: input.end_time,
      hours: input.hours,
      is_agency: input.is_agency,
      is_overtime: input.is_overtime,
      notes: input.notes ?? null,
      status: "planned",
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRotaEntry(
  id: string,
  updates: Partial<RotaEntry>,
): Promise<ServiceResult<RotaEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_rota_entries") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Absences ─────────────────────────────────────────────────────────

export async function listAbsences(
  homeId: string,
  filters?: {
    staffId?: string;
    absenceType?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<AbsenceRecord[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_absence_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.absenceType) q = q.eq("absence_type", filters.absenceType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAbsence(
  input: Omit<AbsenceRecord, "id" | "status" | "return_to_work_completed" | "created_at">,
): Promise<ServiceResult<AbsenceRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_absence_records") as SB)
    .insert({
      home_id: input.home_id,
      staff_id: input.staff_id,
      staff_name: input.staff_name,
      absence_type: input.absence_type,
      start_date: input.start_date,
      end_date: input.end_date,
      days: input.days,
      reason: input.reason ?? null,
      approved_by: input.approved_by ?? null,
      status: "requested",
      return_to_work_completed: false,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function approveAbsence(
  id: string,
  approvedBy: string,
): Promise<ServiceResult<AbsenceRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_absence_records") as SB)
    .update({
      status: "approved",
      approved_by: approvedBy,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  computeRotaSummary,
  computeStaffingCompliance,
  computeAbsenceProfile,
  identifyRotaAlerts,
};
