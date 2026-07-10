// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF SICKNESS MANAGEMENT SERVICE
// Sickness absence tracking, return-to-work interviews, occupational health
// referrals, Bradford Factor, trigger point management, pattern analysis.
// CHR 2015 Reg 33 (employment — managing staffing levels and absence),
// Reg 13 (leadership — workforce planning).
// Employment Rights Act 1996 (SSP, absence management).
//
// SCCIF: Leadership & Management — "Staffing levels are sufficient."
// Ofsted expects proactive sickness absence management to ensure
// children receive consistent, high-quality care from stable staff teams.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Enums ─────────────────────────────────────────────────────────────────

export const ABSENCE_TYPES = [
  "short_term",
  "long_term",
  "intermittent",
  "work_related",
  "covid",
  "mental_health",
  "physical_injury",
  "chronic_condition",
] as const;
export type AbsenceType = (typeof ABSENCE_TYPES)[number];

export const MANAGEMENT_STATUSES = [
  "reported",
  "return_to_work_pending",
  "return_to_work_completed",
  "occupational_health_referral",
  "formal_review",
  "resolved",
  "ongoing",
] as const;
export type ManagementStatus = (typeof MANAGEMENT_STATUSES)[number];

export const TRIGGER_LEVELS = [
  "none",
  "informal",
  "stage_1",
  "stage_2",
  "stage_3",
  "dismissal_consideration",
] as const;
export type TriggerLevel = (typeof TRIGGER_LEVELS)[number];

export const FIT_NOTE_STATUSES = [
  "not_required",
  "fit_note_received",
  "fit_note_expired",
  "awaiting_fit_note",
  "phased_return",
] as const;
export type FitNoteStatus = (typeof FIT_NOTE_STATUSES)[number];

// ── Row interface ─────────────────────────────────────────────────────────

export interface StaffSicknessManagementRow {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  absence_start_date: string;
  absence_end_date: string | null;
  absence_type: AbsenceType;
  management_status: ManagementStatus;
  trigger_level: TriggerLevel;
  fit_note_status: FitNoteStatus;
  days_absent: number;
  return_to_work_completed: boolean;
  occupational_health_referred: boolean;
  reasonable_adjustments_made: boolean;
  phased_return_agreed: boolean;
  manager_informed: boolean;
  cover_arranged: boolean;
  impact_on_children_assessed: boolean;
  wellbeing_check_completed: boolean;
  managing_officer: string | null;
  absence_reason_detail: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute sickness management metrics from a list of rows.
 */
export function computeSicknessMetrics(rows: StaffSicknessManagementRow[]): {
  total_absences: number;
  long_term_count: number;
  mental_health_count: number;
  work_related_count: number;
  ongoing_count: number;
  return_to_work_rate: number;
  occupational_health_rate: number;
  reasonable_adjustments_rate: number;
  cover_arranged_rate: number;
  impact_assessed_rate: number;
  wellbeing_check_rate: number;
  manager_informed_rate: number;
  phased_return_rate: number;
  total_days_absent: number;
  average_days_absent: number;
  absence_type_breakdown: Record<string, number>;
  trigger_breakdown: Record<string, number>;
  unique_staff: number;
} {
  const longTermCount = rows.filter((r) => r.absence_type === "long_term").length;
  const mentalHealthCount = rows.filter((r) => r.absence_type === "mental_health").length;
  const workRelatedCount = rows.filter((r) => r.absence_type === "work_related").length;
  const ongoingCount = rows.filter((r) => r.management_status === "ongoing").length;

  const boolRate = (field: keyof StaffSicknessManagementRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0 ? Math.round((count / rows.length) * 1000) / 10 : 0;
  };

  const totalDaysAbsent = rows.reduce((sum, r) => sum + r.days_absent, 0);
  const averageDaysAbsent =
    rows.length > 0
      ? Math.round((totalDaysAbsent / rows.length) * 10) / 10
      : 0;

  const absenceTypeBreakdown: Record<string, number> = {};
  for (const r of rows)
    absenceTypeBreakdown[r.absence_type] = (absenceTypeBreakdown[r.absence_type] ?? 0) + 1;

  const triggerBreakdown: Record<string, number> = {};
  for (const r of rows)
    triggerBreakdown[r.trigger_level] = (triggerBreakdown[r.trigger_level] ?? 0) + 1;

  const uniqueStaff = new Set(rows.map((r) => r.staff_name)).size;

  return {
    total_absences: rows.length,
    long_term_count: longTermCount,
    mental_health_count: mentalHealthCount,
    work_related_count: workRelatedCount,
    ongoing_count: ongoingCount,
    return_to_work_rate: boolRate("return_to_work_completed"),
    occupational_health_rate: boolRate("occupational_health_referred"),
    reasonable_adjustments_rate: boolRate("reasonable_adjustments_made"),
    cover_arranged_rate: boolRate("cover_arranged"),
    impact_assessed_rate: boolRate("impact_on_children_assessed"),
    wellbeing_check_rate: boolRate("wellbeing_check_completed"),
    manager_informed_rate: boolRate("manager_informed"),
    phased_return_rate: boolRate("phased_return_agreed"),
    total_days_absent: totalDaysAbsent,
    average_days_absent: averageDaysAbsent,
    absence_type_breakdown: absenceTypeBreakdown,
    trigger_breakdown: triggerBreakdown,
    unique_staff: uniqueStaff,
  };
}

/**
 * Identify sickness management alerts.
 */
export function computeSicknessAlerts(rows: StaffSicknessManagementRow[]): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: stage_3 or dismissal_consideration trigger without formal review
  for (const r of rows) {
    if (
      (r.trigger_level === "stage_3" || r.trigger_level === "dismissal_consideration") &&
      r.management_status !== "formal_review"
    ) {
      alerts.push({
        type: "high_trigger_no_formal_review",
        severity: "critical",
        message: `${r.staff_name} is at ${r.trigger_level.replace(/_/g, " ")} trigger level without formal review — immediate action required`,
        record_id: r.id,
      });
    }
  }

  // High: long_term absence without occupational health referral
  for (const r of rows) {
    if (r.absence_type === "long_term" && !r.occupational_health_referred) {
      alerts.push({
        type: "long_term_no_oh_referral",
        severity: "high",
        message: `${r.staff_name} has long-term absence since ${r.absence_start_date} without occupational health referral — consider referral`,
        record_id: r.id,
      });
    }
  }

  // High: cover not arranged and impact on children not assessed
  for (const r of rows) {
    if (!r.cover_arranged && !r.impact_on_children_assessed) {
      alerts.push({
        type: "no_cover_no_impact_assessment",
        severity: "high",
        message: `${r.staff_name} absence has no cover arranged and impact on children not assessed — staffing levels may be affected`,
        record_id: r.id,
      });
    }
  }

  // Medium: return to work not completed for resolved absence
  for (const r of rows) {
    if (r.management_status === "resolved" && !r.return_to_work_completed) {
      alerts.push({
        type: "resolved_no_rtw",
        severity: "medium",
        message: `${r.staff_name} absence marked resolved without return-to-work interview — complete before closing`,
        record_id: r.id,
      });
    }
  }

  // Medium: mental health absence without wellbeing check
  for (const r of rows) {
    if (r.absence_type === "mental_health" && !r.wellbeing_check_completed) {
      alerts.push({
        type: "mental_health_no_wellbeing_check",
        severity: "medium",
        message: `${r.staff_name} has mental health absence without wellbeing check — ensure staff welfare is addressed`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

/**
 * Generate Cara intelligence insights for sickness management.
 * Returns 3 strings: summary (cyan), priority concerns (amber), reflective question (reflect).
 */
export function generateSicknessCaraInsights(
  rows: StaffSicknessManagementRow[],
): string[] {
  const metrics = computeSicknessMetrics(rows);
  const alerts = computeSicknessAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats (cyan-themed)
  insights.push(
    `[cyan] ${metrics.total_absences} sickness absence ${metrics.total_absences === 1 ? "record" : "records"} across ${metrics.unique_staff} ${metrics.unique_staff === 1 ? "staff member" : "staff members"}. ` +
      `Total days absent: ${metrics.total_days_absent}, average: ${metrics.average_days_absent}. ` +
      `Return-to-work rate ${metrics.return_to_work_rate}%, cover arranged ${metrics.cover_arranged_rate}%, ` +
      `manager informed ${metrics.manager_informed_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.long_term_count} long-term, ${metrics.mental_health_count} mental health, ` +
        `and ${metrics.work_related_count} work-related absences require attention.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority sickness alerts currently active. ` +
        `${metrics.ongoing_count} ongoing absences being managed. ` +
        `Continue proactive absence management to maintain staffing sufficiency per Reg 33.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.mental_health_count > 0 && metrics.wellbeing_check_rate < 100) {
    insights.push(
      `[reflect] ${metrics.mental_health_count} mental health ${metrics.mental_health_count === 1 ? "absence has" : "absences have"} been recorded with a wellbeing check rate of ${metrics.wellbeing_check_rate}%. ` +
        `How is the home supporting staff mental health and ensuring early intervention prevents prolonged absence?`,
    );
  } else if (metrics.total_absences > 0 && metrics.return_to_work_rate < 100) {
    insights.push(
      `[reflect] Return-to-work completion stands at ${metrics.return_to_work_rate}%. ` +
        `Are return-to-work interviews being used effectively to identify underlying causes and ` +
        `prevent repeat absences while supporting staff welfare?`,
    );
  } else {
    insights.push(
      `[reflect] Sickness absence management is well maintained. ` +
        `How can the home build on strong absence management practices to promote staff wellbeing ` +
        `and ensure children benefit from a consistent, stable workforce?`,
    );
  }

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listStaffSicknessManagement(
  homeId: string,
  filters?: {
    absenceType?: AbsenceType;
    managementStatus?: ManagementStatus;
    triggerLevel?: TriggerLevel;
    staffName?: string;
    limit?: number;
  },
): Promise<ServiceResult<StaffSicknessManagementRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_sickness_management") as SB).select("*").eq("home_id", homeId);
  if (filters?.absenceType) q = q.eq("absence_type", filters.absenceType);
  if (filters?.managementStatus) q = q.eq("management_status", filters.managementStatus);
  if (filters?.triggerLevel) q = q.eq("trigger_level", filters.triggerLevel);
  if (filters?.staffName) q = q.eq("staff_name", filters.staffName);
  q = q.order("absence_start_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createStaffSicknessManagement(
  input: {
    homeId: string;
    staffName: string;
    staffId?: string | null;
    absenceStartDate: string;
    absenceEndDate?: string | null;
    absenceType: AbsenceType;
    managementStatus?: ManagementStatus;
    triggerLevel?: TriggerLevel;
    fitNoteStatus?: FitNoteStatus;
    daysAbsent: number;
    returnToWorkCompleted?: boolean;
    occupationalHealthReferred?: boolean;
    reasonableAdjustmentsMade?: boolean;
    phasedReturnAgreed?: boolean;
    managerInformed?: boolean;
    coverArranged?: boolean;
    impactOnChildrenAssessed?: boolean;
    wellbeingCheckCompleted?: boolean;
    managingOfficer?: string | null;
    absenceReasonDetail?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffSicknessManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_sickness_management") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      absence_start_date: input.absenceStartDate,
      absence_end_date: input.absenceEndDate ?? null,
      absence_type: input.absenceType,
      management_status: input.managementStatus ?? "reported",
      trigger_level: input.triggerLevel ?? "none",
      fit_note_status: input.fitNoteStatus ?? "not_required",
      days_absent: input.daysAbsent,
      return_to_work_completed: input.returnToWorkCompleted ?? false,
      occupational_health_referred: input.occupationalHealthReferred ?? false,
      reasonable_adjustments_made: input.reasonableAdjustmentsMade ?? false,
      phased_return_agreed: input.phasedReturnAgreed ?? false,
      manager_informed: input.managerInformed ?? false,
      cover_arranged: input.coverArranged ?? false,
      impact_on_children_assessed: input.impactOnChildrenAssessed ?? false,
      wellbeing_check_completed: input.wellbeingCheckCompleted ?? false,
      managing_officer: input.managingOfficer ?? null,
      absence_reason_detail: input.absenceReasonDetail ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateStaffSicknessManagement(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<StaffSicknessManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_sickness_management") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSicknessMetrics,
  computeSicknessAlerts,
  generateSicknessCaraInsights,
};
