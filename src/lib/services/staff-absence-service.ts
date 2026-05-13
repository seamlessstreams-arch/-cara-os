// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF ABSENCE SERVICE
// Manages staff absence recording, return-to-work tracking, pattern
// identification, and impact on staffing levels.
// CHR 2015 Reg 34 (employment of staff — fitness to work),
// Reg 33 (employment of staff — sufficient and suitable),
// Reg 31 (fitness of premises — staffing ratios).
//
// Tracks sickness, planned absence, unauthorised absence,
// return-to-work interviews, and occupational health referrals.
//
// SCCIF: Well-Led — "The home has enough suitably qualified,
// competent and experienced staff." "Staff sickness absence is
// monitored and managed to minimise impact on children."
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

export type AbsenceType =
  | "sickness_short_term"
  | "sickness_long_term"
  | "annual_leave"
  | "compassionate_leave"
  | "parental_leave"
  | "maternity_paternity"
  | "training"
  | "unauthorised"
  | "unpaid_leave"
  | "jury_service"
  | "suspension"
  | "other";

export type SicknessReason =
  | "cold_flu"
  | "musculoskeletal"
  | "stress_anxiety"
  | "mental_health"
  | "gastric"
  | "migraine_headache"
  | "surgery_recovery"
  | "covid"
  | "injury_at_work"
  | "chronic_condition"
  | "hospital_appointment"
  | "other";

export type AbsenceStatus =
  | "planned"
  | "current"
  | "returned"
  | "cancelled";

export type ReturnToWorkStatus =
  | "not_required"
  | "pending"
  | "completed"
  | "overdue";

export interface StaffAbsence {
  id: string;
  home_id: string;
  staff_name: string;
  staff_role: string;
  absence_type: AbsenceType;
  sickness_reason: SicknessReason | null;
  start_date: string;
  end_date: string | null;
  days_lost: number;
  status: AbsenceStatus;
  covered_by: string | null;
  agency_cover_used: boolean;
  return_to_work_status: ReturnToWorkStatus;
  return_to_work_date: string | null;
  return_to_work_notes: string | null;
  occupational_health_referral: boolean;
  impact_on_children: string | null;
  fit_note_received: boolean;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ABSENCE_TYPES: { type: AbsenceType; label: string }[] = [
  { type: "sickness_short_term", label: "Sickness (Short-Term)" },
  { type: "sickness_long_term", label: "Sickness (Long-Term)" },
  { type: "annual_leave", label: "Annual Leave" },
  { type: "compassionate_leave", label: "Compassionate Leave" },
  { type: "parental_leave", label: "Parental Leave" },
  { type: "maternity_paternity", label: "Maternity/Paternity" },
  { type: "training", label: "Training" },
  { type: "unauthorised", label: "Unauthorised" },
  { type: "unpaid_leave", label: "Unpaid Leave" },
  { type: "jury_service", label: "Jury Service" },
  { type: "suspension", label: "Suspension" },
  { type: "other", label: "Other" },
];

export const SICKNESS_REASONS: { reason: SicknessReason; label: string }[] = [
  { reason: "cold_flu", label: "Cold/Flu" },
  { reason: "musculoskeletal", label: "Musculoskeletal" },
  { reason: "stress_anxiety", label: "Stress/Anxiety" },
  { reason: "mental_health", label: "Mental Health" },
  { reason: "gastric", label: "Gastric" },
  { reason: "migraine_headache", label: "Migraine/Headache" },
  { reason: "surgery_recovery", label: "Surgery/Recovery" },
  { reason: "covid", label: "COVID-19" },
  { reason: "injury_at_work", label: "Injury at Work" },
  { reason: "chronic_condition", label: "Chronic Condition" },
  { reason: "hospital_appointment", label: "Hospital Appointment" },
  { reason: "other", label: "Other" },
];

export const ABSENCE_STATUSES: { status: AbsenceStatus; label: string }[] = [
  { status: "planned", label: "Planned" },
  { status: "current", label: "Current" },
  { status: "returned", label: "Returned" },
  { status: "cancelled", label: "Cancelled" },
];

export const RETURN_TO_WORK_STATUSES: { status: ReturnToWorkStatus; label: string }[] = [
  { status: "not_required", label: "Not Required" },
  { status: "pending", label: "Pending" },
  { status: "completed", label: "Completed" },
  { status: "overdue", label: "Overdue" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute staff absence metrics.
 */
export function computeAbsenceMetrics(
  absences: StaffAbsence[],
  totalStaff: number,
  now: Date = new Date(),
): {
  total_absences: number;
  current_absences: number;
  sickness_absences: number;
  total_days_lost: number;
  avg_days_per_absence: number;
  absence_rate: number;
  agency_cover_count: number;
  return_to_work_pending: number;
  return_to_work_overdue: number;
  occupational_health_referrals: number;
  unauthorised_absences: number;
  long_term_sickness: number;
  stress_related: number;
  by_type: Record<string, number>;
  by_reason: Record<string, number>;
  by_status: Record<string, number>;
  by_staff: Record<string, number>;
} {
  const sicknessTypes: AbsenceType[] = ["sickness_short_term", "sickness_long_term"];

  const sicknessAbsences = absences.filter((a) => sicknessTypes.includes(a.absence_type)).length;
  const currentAbsences = absences.filter((a) => a.status === "current").length;
  const totalDaysLost = absences.reduce((sum, a) => sum + a.days_lost, 0);
  const activeAbsences = absences.filter((a) => a.status !== "cancelled").length;
  const avgDays =
    activeAbsences > 0
      ? Math.round((totalDaysLost / activeAbsences) * 10) / 10
      : 0;

  // Absence rate = (total sickness days / (total staff * 365)) * 100 — annualised
  const absenceRate =
    totalStaff > 0
      ? Math.round((totalDaysLost / (totalStaff * 365)) * 1000) / 10
      : 0;

  const agencyCover = absences.filter((a) => a.agency_cover_used).length;
  const rtwPending = absences.filter((a) => a.return_to_work_status === "pending").length;
  const rtwOverdue = absences.filter((a) => a.return_to_work_status === "overdue").length;
  const ohReferrals = absences.filter((a) => a.occupational_health_referral).length;
  const unauthorised = absences.filter((a) => a.absence_type === "unauthorised").length;
  const longTerm = absences.filter((a) => a.absence_type === "sickness_long_term").length;
  const stressRelated = absences.filter(
    (a) =>
      a.sickness_reason === "stress_anxiety" || a.sickness_reason === "mental_health",
  ).length;

  // By type
  const byType: Record<string, number> = {};
  for (const a of absences) {
    byType[a.absence_type] = (byType[a.absence_type] ?? 0) + 1;
  }

  // By sickness reason
  const byReason: Record<string, number> = {};
  for (const a of absences) {
    if (a.sickness_reason) {
      byReason[a.sickness_reason] = (byReason[a.sickness_reason] ?? 0) + 1;
    }
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const a of absences) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  }

  // By staff member (days lost)
  const byStaff: Record<string, number> = {};
  for (const a of absences) {
    byStaff[a.staff_name] = (byStaff[a.staff_name] ?? 0) + a.days_lost;
  }

  return {
    total_absences: absences.length,
    current_absences: currentAbsences,
    sickness_absences: sicknessAbsences,
    total_days_lost: totalDaysLost,
    avg_days_per_absence: avgDays,
    absence_rate: absenceRate,
    agency_cover_count: agencyCover,
    return_to_work_pending: rtwPending,
    return_to_work_overdue: rtwOverdue,
    occupational_health_referrals: ohReferrals,
    unauthorised_absences: unauthorised,
    long_term_sickness: longTerm,
    stress_related: stressRelated,
    by_type: byType,
    by_reason: byReason,
    by_status: byStatus,
    by_staff: byStaff,
  };
}

/**
 * Identify staff absence alerts.
 */
export function identifyAbsenceAlerts(
  absences: StaffAbsence[],
  totalStaff: number,
  now: Date = new Date(),
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

  // Unauthorised absences
  for (const a of absences) {
    if (a.absence_type === "unauthorised" && a.status === "current") {
      alerts.push({
        type: "unauthorised_absence",
        severity: "high",
        message: `${a.staff_name} (${a.staff_role}) has an unauthorised absence since ${a.start_date} — follow up immediately`,
        id: a.id,
      });
    }
  }

  // Return to work overdue
  for (const a of absences) {
    if (a.return_to_work_status === "overdue") {
      alerts.push({
        type: "rtw_overdue",
        severity: "medium",
        message: `Return-to-work interview overdue for ${a.staff_name} — returned ${a.return_to_work_date ?? "unknown date"}`,
        id: a.id,
      });
    }
  }

  // Long-term sickness without OH referral
  for (const a of absences) {
    if (
      a.absence_type === "sickness_long_term" &&
      !a.occupational_health_referral &&
      a.status === "current"
    ) {
      alerts.push({
        type: "no_oh_referral",
        severity: "high",
        message: `${a.staff_name} on long-term sickness since ${a.start_date} without occupational health referral — consider referral`,
        id: a.id,
      });
    }
  }

  // Current sickness without fit note (>7 days)
  for (const a of absences) {
    if (
      (a.absence_type === "sickness_short_term" || a.absence_type === "sickness_long_term") &&
      a.status === "current" &&
      !a.fit_note_received &&
      a.days_lost > 7
    ) {
      alerts.push({
        type: "no_fit_note",
        severity: "medium",
        message: `${a.staff_name} has been off sick for ${a.days_lost} days without a fit note — request from GP`,
        id: a.id,
      });
    }
  }

  // High current absence impacting staffing
  const currentCount = absences.filter((a) => a.status === "current").length;
  if (totalStaff > 0 && currentCount >= Math.ceil(totalStaff * 0.25)) {
    alerts.push({
      type: "high_absence_rate",
      severity: "critical",
      message: `${currentCount} of ${totalStaff} staff currently absent (${Math.round((currentCount / totalStaff) * 100)}%) — staffing levels may be critically impacted`,
      id: "staffing_alert",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listAbsences(
  homeId: string,
  filters?: {
    absenceType?: AbsenceType;
    status?: AbsenceStatus;
    staffName?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<StaffAbsence[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_absences") as SB).select("*").eq("home_id", homeId);
  if (filters?.absenceType) q = q.eq("absence_type", filters.absenceType);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.staffName) q = q.eq("staff_name", filters.staffName);
  if (filters?.dateFrom) q = q.gte("start_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("start_date", filters.dateTo);
  q = q.order("start_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAbsence(
  input: {
    homeId: string;
    staffName: string;
    staffRole: string;
    absenceType: AbsenceType;
    sicknessReason?: SicknessReason;
    startDate: string;
    endDate?: string;
    daysLost: number;
    coveredBy?: string;
    agencyCoverUsed: boolean;
    impactOnChildren?: string;
  },
): Promise<ServiceResult<StaffAbsence>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_absences") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_role: input.staffRole,
      absence_type: input.absenceType,
      sickness_reason: input.sicknessReason ?? null,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      days_lost: input.daysLost,
      status: "current",
      covered_by: input.coveredBy ?? null,
      agency_cover_used: input.agencyCoverUsed,
      return_to_work_status: "not_required",
      return_to_work_date: null,
      return_to_work_notes: null,
      occupational_health_referral: false,
      impact_on_children: input.impactOnChildren ?? null,
      fit_note_received: false,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAbsence(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<StaffAbsence>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_absences") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeAbsenceMetrics,
  identifyAbsenceAlerts,
};
