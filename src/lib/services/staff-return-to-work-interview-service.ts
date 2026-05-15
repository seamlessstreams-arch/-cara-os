// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF RETURN-TO-WORK INTERVIEW SERVICE
// Tracks return-to-work interviews after staff absences, support plans,
// phased returns, adjustments, occupational health referrals, and trigger
// level management.
// CHR 2015 Reg 33 (employment — managing staffing levels and absence),
// Reg 13 (leadership — workforce planning, staff welfare).
// Employment Rights Act 1996 (SSP, absence management).
//
// Covers: return-to-work interviews, fitness to return, phased returns,
// adjustments, OH referrals, trigger levels, support plans, welfare checks.
//
// SCCIF: Leadership & Management — "Staffing levels are sufficient."
// "Staff are supported to return to work after absence."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Row interface ─────────────────────────────────────────────────────────

export interface StaffReturnToWorkInterviewRow {
  id: string;
  home_id: string;
  staff_name: string;
  interview_date: string;
  absence_type: string;
  absence_duration_days: number;
  interviewer_name: string;
  fit_to_return: boolean;
  phased_return: boolean;
  adjustments_required: boolean;
  adjustment_details: string | null;
  occupational_health_referral: boolean;
  support_plan_agreed: boolean;
  trigger_level_reached: boolean;
  trigger_level: string | null;
  welfare_check_completed: boolean;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Supabase helpers ─────────────────────────────────────────────────────

function isSupabaseEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Pure compute functions ───────────────────────────────────────────────

export function computeMetrics(rows: StaffReturnToWorkInterviewRow[]): {
  total_interviews: number;
  not_fit_count: number;
  phased_return_count: number;
  adjustments_count: number;
  oh_referral_count: number;
  trigger_level_count: number;
  support_plan_rate: number;
  welfare_check_rate: number;
  follow_up_rate: number;
  avg_absence_days: number;
  unique_staff: number;
  absence_type_breakdown: Record<string, number>;
} {
  const notFitCount = rows.filter((r) => !r.fit_to_return).length;
  const phasedReturnCount = rows.filter((r) => r.phased_return).length;
  const adjustmentsCount = rows.filter((r) => r.adjustments_required).length;
  const ohReferralCount = rows.filter(
    (r) => r.occupational_health_referral,
  ).length;
  const triggerLevelCount = rows.filter((r) => r.trigger_level_reached).length;

  const boolRate = (field: keyof StaffReturnToWorkInterviewRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const followUpRate =
    rows.length > 0
      ? Math.round(
          (rows.filter((r) => r.follow_up_date !== null).length / rows.length) *
            1000,
        ) / 10
      : 0;

  const totalDays = rows.reduce((sum, r) => sum + r.absence_duration_days, 0);
  const avgAbsenceDays =
    rows.length > 0 ? Math.round((totalDays / rows.length) * 10) / 10 : 0;

  const uniqueStaff = new Set(rows.map((r) => r.staff_name)).size;

  const absenceTypeBreakdown: Record<string, number> = {};
  for (const r of rows) {
    absenceTypeBreakdown[r.absence_type] =
      (absenceTypeBreakdown[r.absence_type] ?? 0) + 1;
  }

  return {
    total_interviews: rows.length,
    not_fit_count: notFitCount,
    phased_return_count: phasedReturnCount,
    adjustments_count: adjustmentsCount,
    oh_referral_count: ohReferralCount,
    trigger_level_count: triggerLevelCount,
    support_plan_rate: boolRate("support_plan_agreed"),
    welfare_check_rate: boolRate("welfare_check_completed"),
    follow_up_rate: followUpRate,
    avg_absence_days: avgAbsenceDays,
    unique_staff: uniqueStaff,
    absence_type_breakdown: absenceTypeBreakdown,
  };
}

/**
 * Identify return-to-work interview alerts.
 */
export function computeAlerts(rows: StaffReturnToWorkInterviewRow[]): {
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

  // Critical: not fit to return without adjustments required
  for (const r of rows) {
    if (!r.fit_to_return && !r.adjustments_required) {
      alerts.push({
        type: "not_fit_no_adjustments",
        severity: "critical",
        message: `${r.staff_name} is not fit to return without any adjustments recorded — immediate action required`,
        record_id: r.id,
      });
    }
  }

  // High: trigger level Stage 3 or Formal Review
  for (const r of rows) {
    if (
      r.trigger_level_reached &&
      (r.trigger_level === "Stage 3" || r.trigger_level === "Formal Review")
    ) {
      alerts.push({
        type: "high_trigger_level",
        severity: "high",
        message: `${r.staff_name} has reached ${r.trigger_level} trigger level — formal absence management action required`,
        record_id: r.id,
      });
    }
  }

  // High: long absence (>28 days) without occupational health referral
  for (const r of rows) {
    if (r.absence_duration_days > 28 && !r.occupational_health_referral) {
      alerts.push({
        type: "long_absence_no_oh_referral",
        severity: "high",
        message: `${r.staff_name} was absent for ${r.absence_duration_days} days without occupational health referral — consider referral`,
        record_id: r.id,
      });
    }
  }

  // Medium: phased return without support plan agreed
  for (const r of rows) {
    if (r.phased_return && !r.support_plan_agreed) {
      alerts.push({
        type: "phased_return_no_support_plan",
        severity: "medium",
        message: `${r.staff_name} has a phased return without an agreed support plan — ensure plan is documented`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

/**
 * Generate ARIA intelligence insights for return-to-work interviews.
 * Returns 3 strings: summary, priority items, reflective question.
 */
export function computeAriaInsights(
  metrics: ReturnType<typeof computeMetrics>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary line
  insights.push(
    `${metrics.total_interviews} return-to-work ${metrics.total_interviews === 1 ? "interview" : "interviews"} recorded across ${metrics.unique_staff} ${metrics.unique_staff === 1 ? "staff member" : "staff members"}. ` +
      `Average absence duration: ${metrics.avg_absence_days} days. ` +
      `Support plan rate: ${metrics.support_plan_rate}%, welfare check rate: ${metrics.welfare_check_rate}%.`,
  );

  // Insight 2: Priority items
  const priorities: string[] = [];
  if (metrics.not_fit_count > 0) {
    priorities.push(
      `${metrics.not_fit_count} ${metrics.not_fit_count === 1 ? "staff member" : "staff members"} not fit to return`,
    );
  }
  if (metrics.oh_referral_count > 0) {
    priorities.push(
      `${metrics.oh_referral_count} occupational health ${metrics.oh_referral_count === 1 ? "referral" : "referrals"}`,
    );
  }
  if (metrics.trigger_level_count > 0) {
    priorities.push(
      `${metrics.trigger_level_count} ${metrics.trigger_level_count === 1 ? "interview" : "interviews"} at trigger level`,
    );
  }
  if (priorities.length > 0) {
    insights.push(`Priority items: ${priorities.join(", ")}.`);
  } else {
    insights.push(
      "No priority concerns identified. Continue proactive absence management and timely return-to-work interviews.",
    );
  }

  // Insight 3: Reflective question about staff welfare
  if (metrics.not_fit_count > 0 && metrics.support_plan_rate < 100) {
    insights.push(
      `With ${metrics.not_fit_count} ${metrics.not_fit_count === 1 ? "staff member" : "staff members"} not fit to return and a support plan rate of ${metrics.support_plan_rate}%, how is the home ensuring returning staff receive the adjustments and support they need to sustain their return?`,
    );
  } else if (metrics.phased_return_count > 0) {
    insights.push(
      `${metrics.phased_return_count} phased ${metrics.phased_return_count === 1 ? "return is" : "returns are"} in progress. Are phased return arrangements being reviewed regularly to ensure staff welfare and adequate staffing for children's care?`,
    );
  } else {
    insights.push(
      "How can the home build on return-to-work practices to strengthen staff welfare, reduce repeat absences, and maintain consistent care for children?",
    );
  }

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listStaffReturnToWorkInterviews(
  homeId: string,
): Promise<ServiceResult<StaffReturnToWorkInterviewRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (
    s.from("cs_staff_return_to_work_interviews") as SB
  )
    .select("*")
    .eq("home_id", homeId)
    .order("interview_date", { ascending: false })
    .limit(200);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createStaffReturnToWorkInterview(input: {
  homeId: string;
  staffName: string;
  interviewDate: string;
  absenceType: string;
  absenceDurationDays: number;
  interviewerName: string;
  fitToReturn?: boolean;
  phasedReturn?: boolean;
  adjustmentsRequired?: boolean;
  adjustmentDetails?: string | null;
  occupationalHealthReferral?: boolean;
  supportPlanAgreed?: boolean;
  triggerLevelReached?: boolean;
  triggerLevel?: string | null;
  welfareCheckCompleted?: boolean;
  followUpDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffReturnToWorkInterviewRow>> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (
    s.from("cs_staff_return_to_work_interviews") as SB
  )
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      interview_date: input.interviewDate,
      absence_type: input.absenceType,
      absence_duration_days: input.absenceDurationDays,
      interviewer_name: input.interviewerName,
      fit_to_return: input.fitToReturn ?? true,
      phased_return: input.phasedReturn ?? false,
      adjustments_required: input.adjustmentsRequired ?? false,
      adjustment_details: input.adjustmentDetails ?? null,
      occupational_health_referral: input.occupationalHealthReferral ?? false,
      support_plan_agreed: input.supportPlanAgreed ?? false,
      trigger_level_reached: input.triggerLevelReached ?? false,
      trigger_level: input.triggerLevel ?? null,
      welfare_check_completed: input.welfareCheckCompleted ?? true,
      follow_up_date: input.followUpDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateStaffReturnToWorkInterview(
  id: string,
  homeId: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<StaffReturnToWorkInterviewRow>> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (
    s.from("cs_staff_return_to_work_interviews") as SB
  )
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("home_id", homeId)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMetrics,
  computeAlerts,
  computeAriaInsights,
};
