// ══════════════════════════════════════════════════════════════════════════════
// CARA — RESPITE & SHORT BREAKS SERVICE
// Tracks planned respite care, short breaks, emergency breaks,
// and their impact on children and placements.
// CHR 2015 Reg 14 (care planning — break arrangements),
// Reg 36 (fitness of premises — alternative provision),
// Children Act 1989 Sch 2 para 6 (provision of services for children).
//
// Covers: planned respite, emergency breaks, host family stays,
// activity breaks, and impact on the child's wellbeing.
//
// SCCIF: Overall Experiences — "Short breaks are planned around
// children's needs." "Respite is used positively and not punitively."
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

export type BreakType =
  | "planned_respite"
  | "emergency_break"
  | "host_family"
  | "activity_break"
  | "family_stay"
  | "holiday"
  | "therapeutic_break"
  | "assessment_break"
  | "other";

export type BreakReason =
  | "placement_stability"
  | "staff_wellbeing"
  | "child_request"
  | "behaviour_management"
  | "family_contact"
  | "holiday_activity"
  | "therapeutic_purpose"
  | "emergency_situation"
  | "assessment"
  | "other";

export type BreakStatus =
  | "planned"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "cut_short";

export type ChildImpact =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative"
  | "not_assessed";

export interface RespiteRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  break_type: BreakType;
  break_reason: BreakReason;
  break_status: BreakStatus;
  start_date: string;
  end_date: string | null;
  duration_nights: number;
  provider_name: string;
  provider_type: string;
  child_views_sought: boolean;
  child_wants_break: boolean | null;
  social_worker_approved: boolean;
  risk_assessment_completed: boolean;
  child_impact: ChildImpact;
  child_feedback: string | null;
  return_plan_in_place: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const BREAK_TYPES: { type: BreakType; label: string }[] = [
  { type: "planned_respite", label: "Planned Respite" },
  { type: "emergency_break", label: "Emergency Break" },
  { type: "host_family", label: "Host Family" },
  { type: "activity_break", label: "Activity Break" },
  { type: "family_stay", label: "Family Stay" },
  { type: "holiday", label: "Holiday" },
  { type: "therapeutic_break", label: "Therapeutic Break" },
  { type: "assessment_break", label: "Assessment Break" },
  { type: "other", label: "Other" },
];

export const BREAK_REASONS: { reason: BreakReason; label: string }[] = [
  { reason: "placement_stability", label: "Placement Stability" },
  { reason: "staff_wellbeing", label: "Staff Wellbeing" },
  { reason: "child_request", label: "Child Request" },
  { reason: "behaviour_management", label: "Behaviour Management" },
  { reason: "family_contact", label: "Family Contact" },
  { reason: "holiday_activity", label: "Holiday/Activity" },
  { reason: "therapeutic_purpose", label: "Therapeutic Purpose" },
  { reason: "emergency_situation", label: "Emergency Situation" },
  { reason: "assessment", label: "Assessment" },
  { reason: "other", label: "Other" },
];

export const BREAK_STATUSES: { status: BreakStatus; label: string }[] = [
  { status: "planned", label: "Planned" },
  { status: "confirmed", label: "Confirmed" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
  { status: "cut_short", label: "Cut Short" },
];

export const CHILD_IMPACTS: { impact: ChildImpact; label: string }[] = [
  { impact: "very_positive", label: "Very Positive" },
  { impact: "positive", label: "Positive" },
  { impact: "neutral", label: "Neutral" },
  { impact: "negative", label: "Negative" },
  { impact: "very_negative", label: "Very Negative" },
  { impact: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeRespiteMetrics(
  records: RespiteRecord[],
  totalChildren: number,
): {
  total_breaks: number;
  children_with_breaks: number;
  break_usage_rate: number | null;
  planned_count: number;
  emergency_count: number;
  completed_count: number;
  cancelled_count: number;
  cut_short_count: number;
  total_nights: number;
  average_duration: number | null;
  child_views_sought_rate: number | null;
  social_worker_approved_rate: number | null;
  risk_assessment_rate: number | null;
  positive_impact_rate: number | null;
  negative_impact_rate: number | null;
  return_plan_rate: number | null;
  by_break_type: Record<string, number>;
  by_break_reason: Record<string, number>;
  by_break_status: Record<string, number>;
  by_child_impact: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const usageRate =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const planned = records.filter((r) => r.break_type === "planned_respite").length;
  const emergency = records.filter((r) => r.break_type === "emergency_break").length;
  const completed = records.filter((r) => r.break_status === "completed").length;
  const cancelled = records.filter((r) => r.break_status === "cancelled").length;
  const cutShort = records.filter((r) => r.break_status === "cut_short").length;

  const totalNights = records.reduce((sum, r) => sum + r.duration_nights, 0);
  const avgDuration =
    records.length > 0
      ? Math.round((totalNights / records.length) * 10) / 10
      : null;

  const viewsSought = records.filter((r) => r.child_views_sought).length;
  const viewsRate =
    records.length > 0
      ? Math.round((viewsSought / records.length) * 1000) / 10
      : null;

  const swApproved = records.filter((r) => r.social_worker_approved).length;
  const swRate =
    records.length > 0
      ? Math.round((swApproved / records.length) * 1000) / 10
      : null;

  const riskDone = records.filter((r) => r.risk_assessment_completed).length;
  const riskRate =
    records.length > 0
      ? Math.round((riskDone / records.length) * 1000) / 10
      : null;

  const assessed = records.filter((r) => r.child_impact !== "not_assessed");
  const positiveImpact = assessed.filter(
    (r) => r.child_impact === "very_positive" || r.child_impact === "positive",
  ).length;
  const positiveRate =
    assessed.length > 0
      ? Math.round((positiveImpact / assessed.length) * 1000) / 10
      : null;

  const negativeImpact = assessed.filter(
    (r) => r.child_impact === "negative" || r.child_impact === "very_negative",
  ).length;
  const negativeRate =
    assessed.length > 0
      ? Math.round((negativeImpact / assessed.length) * 1000) / 10
      : null;

  const returnPlan = records.filter((r) => r.return_plan_in_place).length;
  const returnRate =
    records.length > 0
      ? Math.round((returnPlan / records.length) * 1000) / 10
      : null;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.break_type] = (byType[r.break_type] ?? 0) + 1;

  const byReason: Record<string, number> = {};
  for (const r of records) byReason[r.break_reason] = (byReason[r.break_reason] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.break_status] = (byStatus[r.break_status] ?? 0) + 1;

  const byImpact: Record<string, number> = {};
  for (const r of records) byImpact[r.child_impact] = (byImpact[r.child_impact] ?? 0) + 1;

  return {
    total_breaks: records.length,
    children_with_breaks: uniqueChildren,
    break_usage_rate: usageRate,
    planned_count: planned,
    emergency_count: emergency,
    completed_count: completed,
    cancelled_count: cancelled,
    cut_short_count: cutShort,
    total_nights: totalNights,
    average_duration: avgDuration,
    child_views_sought_rate: viewsRate,
    social_worker_approved_rate: swRate,
    risk_assessment_rate: riskRate,
    positive_impact_rate: positiveRate,
    negative_impact_rate: negativeRate,
    return_plan_rate: returnRate,
    by_break_type: byType,
    by_break_reason: byReason,
    by_break_status: byStatus,
    by_child_impact: byImpact,
  };
}

export function identifyRespiteAlerts(
  records: RespiteRecord[],
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

  // Negative impact from breaks
  for (const r of records) {
    if (r.child_impact === "very_negative") {
      alerts.push({
        type: "very_negative_impact",
        severity: "critical",
        message: `Very negative impact from ${r.break_type.replace(/_/g, " ")} for ${r.child_name} — review break arrangements and child's needs`,
        id: r.id,
      });
    }
  }

  // Emergency breaks without risk assessment
  for (const r of records) {
    if (r.break_type === "emergency_break" && !r.risk_assessment_completed) {
      alerts.push({
        type: "emergency_no_risk_ax",
        severity: "high",
        message: `Emergency break for ${r.child_name} without completed risk assessment — conduct retrospective assessment`,
        id: r.id,
      });
    }
  }

  // Breaks without child views
  const noViews = records.filter((r) => !r.child_views_sought && r.break_status !== "cancelled").length;
  if (noViews >= 2) {
    alerts.push({
      type: "child_views_missing",
      severity: "high",
      message: `${noViews} breaks arranged without seeking the child's views — children must be consulted about respite arrangements`,
      id: "views_missing",
    });
  }

  // Cut short breaks — pattern concern
  const cutShort = records.filter((r) => r.break_status === "cut_short").length;
  if (cutShort >= 2) {
    alerts.push({
      type: "breaks_cut_short",
      severity: "medium",
      message: `${cutShort} breaks cut short — review whether break planning adequately considers children's needs and preferences`,
      id: "cut_short_pattern",
    });
  }

  // No return plan
  const noReturnPlan = records.filter(
    (r) => !r.return_plan_in_place && (r.break_status === "planned" || r.break_status === "confirmed" || r.break_status === "in_progress"),
  ).length;
  if (noReturnPlan >= 1) {
    alerts.push({
      type: "no_return_plan",
      severity: "medium",
      message: `${noReturnPlan} active ${noReturnPlan === 1 ? "break has" : "breaks have"} no return plan — ensure smooth transitions back`,
      id: "no_return_plan",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    breakType?: BreakType;
    breakStatus?: BreakStatus;
    limit?: number;
  },
): Promise<ServiceResult<RespiteRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_respite_breaks") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.breakType) q = q.eq("break_type", filters.breakType);
  if (filters?.breakStatus) q = q.eq("break_status", filters.breakStatus);
  q = q.order("start_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    breakType: BreakType;
    breakReason: BreakReason;
    breakStatus: BreakStatus;
    startDate: string;
    endDate?: string;
    durationNights: number;
    providerName: string;
    providerType: string;
    childViewsSought: boolean;
    childWantsBreak?: boolean;
    socialWorkerApproved: boolean;
    riskAssessmentCompleted: boolean;
    childImpact: ChildImpact;
    childFeedback?: string;
    returnPlanInPlace: boolean;
    notes?: string;
  },
): Promise<ServiceResult<RespiteRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_respite_breaks") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      break_type: input.breakType,
      break_reason: input.breakReason,
      break_status: input.breakStatus,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      duration_nights: input.durationNights,
      provider_name: input.providerName,
      provider_type: input.providerType,
      child_views_sought: input.childViewsSought,
      child_wants_break: input.childWantsBreak ?? null,
      social_worker_approved: input.socialWorkerApproved,
      risk_assessment_completed: input.riskAssessmentCompleted,
      child_impact: input.childImpact,
      child_feedback: input.childFeedback ?? null,
      return_plan_in_place: input.returnPlanInPlace,
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
): Promise<ServiceResult<RespiteRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_respite_breaks") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeRespiteMetrics,
  identifyRespiteAlerts,
};
