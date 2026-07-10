// ══════════════════════════════════════════════════════════════════════════════
// CARA — LAC HEALTH ASSESSMENT SERVICE
// Manages Looked After Child (LAC) Health Assessments — initial and review
// health assessments, statutory health review compliance, health action plans,
// and specialist referral tracking.
// CHR 2015 Reg 10 (health — regular screening and health assessment),
// Promoting the Health and Well-being of Looked After Children (DfE/DoH 2015).
//
// Covers: initial health assessments (IHA within 20 working days),
// review health assessments (RHA annually under 5, 6-monthly under 5),
// health action plans, specialist referrals, and compliance tracking.
//
// SCCIF: Health — "Children's health needs are identified and met promptly."
// "Health assessments are timely and lead to effective health action plans."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const ASSESSMENT_TYPES = [
  "initial_health_assessment",
  "review_health_assessment",
  "dental_check",
  "optical_check",
  "developmental_check",
  "mental_health_screening",
  "sexual_health_review",
  "substance_misuse_screening",
  "immunisation_review",
  "specialist_referral",
] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

export const HEALTH_OUTCOMES = [
  "all_actions_met",
  "actions_outstanding",
  "referral_required",
  "urgent_concern",
  "not_completed",
] as const;
export type HealthOutcome = (typeof HEALTH_OUTCOMES)[number];

export const COMPLIANCE_STATUSES = [
  "within_timescale",
  "overdue",
  "significantly_overdue",
  "not_due",
  "exempt",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const HEALTH_DOMAINS = [
  "physical_health",
  "emotional_wellbeing",
  "dental_health",
  "optical_health",
  "immunisations",
  "sexual_health",
  "substance_misuse",
  "nutrition_growth",
  "developmental",
  "mental_health",
] as const;
export type HealthDomain = (typeof HEALTH_DOMAINS)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface LacHealthAssessmentRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  assessment_date: string;
  assessment_type: string;
  health_outcome: string;
  compliance_status: string;
  health_domain: string;
  clinician_name: string | null;
  clinic_location: string | null;
  health_action_plan_created: boolean;
  actions_completed: boolean;
  child_attended: boolean;
  child_views_captured: boolean;
  carer_attended: boolean;
  shared_with_social_worker: boolean;
  next_assessment_due: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeLacHealthAssessmentMetrics(
  rows: LacHealthAssessmentRow[],
): {
  total_assessments: number;
  overdue_count: number;
  urgent_concern_count: number;
  not_completed_count: number;
  referral_required_count: number;
  child_attended_rate: number;
  child_views_rate: number;
  action_plan_rate: number;
  actions_completed_rate: number;
  shared_with_sw_rate: number;
  type_breakdown: Record<string, number>;
  outcome_breakdown: Record<string, number>;
  unique_children: number;
} {
  const overdueCount = rows.filter(
    (r) =>
      r.compliance_status === "overdue" ||
      r.compliance_status === "significantly_overdue",
  ).length;
  const urgentConcernCount = rows.filter(
    (r) => r.health_outcome === "urgent_concern",
  ).length;
  const notCompletedCount = rows.filter(
    (r) => r.health_outcome === "not_completed",
  ).length;
  const referralRequiredCount = rows.filter(
    (r) => r.health_outcome === "referral_required",
  ).length;

  const boolRate = (field: keyof LacHealthAssessmentRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const typeBreakdown: Record<string, number> = {};
  for (const r of rows)
    typeBreakdown[r.assessment_type] =
      (typeBreakdown[r.assessment_type] ?? 0) + 1;

  const outcomeBreakdown: Record<string, number> = {};
  for (const r of rows)
    outcomeBreakdown[r.health_outcome] =
      (outcomeBreakdown[r.health_outcome] ?? 0) + 1;

  return {
    total_assessments: rows.length,
    overdue_count: overdueCount,
    urgent_concern_count: urgentConcernCount,
    not_completed_count: notCompletedCount,
    referral_required_count: referralRequiredCount,
    child_attended_rate: boolRate("child_attended"),
    child_views_rate: boolRate("child_views_captured"),
    action_plan_rate: boolRate("health_action_plan_created"),
    actions_completed_rate: boolRate("actions_completed"),
    shared_with_sw_rate: boolRate("shared_with_social_worker"),
    type_breakdown: typeBreakdown,
    outcome_breakdown: outcomeBreakdown,
    unique_children: new Set(rows.map((r) => r.child_name)).size,
  };
}

export function computeLacHealthAssessmentAlerts(
  rows: LacHealthAssessmentRow[],
): {
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

  // Critical: urgent_concern + not shared with social worker
  for (const r of rows) {
    if (
      r.health_outcome === "urgent_concern" &&
      !r.shared_with_social_worker
    ) {
      alerts.push({
        type: "urgent_concern_not_shared",
        severity: "critical",
        message: `${r.child_name} has urgent health concern from ${r.assessment_type.replace(/_/g, " ")} not shared with social worker — immediate escalation required`,
        record_id: r.id,
      });
    }
  }

  // High: significantly_overdue compliance
  for (const r of rows) {
    if (r.compliance_status === "significantly_overdue") {
      alerts.push({
        type: "significantly_overdue",
        severity: "high",
        message: `${r.child_name} has significantly overdue ${r.assessment_type.replace(/_/g, " ")} — arrange assessment urgently`,
        record_id: r.id,
      });
    }
  }

  // High: child views not captured for multiple assessments
  const noChildViews = rows.filter((r) => !r.child_views_captured).length;
  if (noChildViews >= 2) {
    alerts.push({
      type: "child_views_not_captured",
      severity: "high",
      message: `${noChildViews} health assessments completed without capturing child views — ensure child participation in health reviews`,
    });
  }

  // Medium: health action plans not created for multiple assessments
  const noActionPlans = rows.filter(
    (r) => !r.health_action_plan_created,
  ).length;
  if (noActionPlans >= 2) {
    alerts.push({
      type: "action_plans_not_created",
      severity: "medium",
      message: `${noActionPlans} health assessments without health action plans created — ensure assessments lead to actionable plans`,
    });
  }

  return alerts;
}

export function generateLacHealthAssessmentCaraInsights(
  metrics: ReturnType<typeof computeLacHealthAssessmentMetrics>,
  alerts: ReturnType<typeof computeLacHealthAssessmentAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats
  const overduePct =
    metrics.total_assessments > 0
      ? Math.round(
          (metrics.overdue_count / metrics.total_assessments) * 1000,
        ) / 10
      : 0;
  insights.push(
    `[pink] ${metrics.total_assessments} LAC health assessments recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.overdue_count} (${overduePct}%) overdue. ` +
      `${metrics.urgent_concern_count} urgent concerns, ${metrics.referral_required_count} referrals required. ` +
      `Child attendance rate: ${metrics.child_attended_rate}%.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Child views captured rate: ${metrics.child_views_rate}%. ` +
        `Action plan rate: ${metrics.action_plan_rate}%. ` +
        `Shared with social worker rate: ${metrics.shared_with_sw_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns. ` +
        `Child views captured rate: ${metrics.child_views_rate}%. ` +
        `Action plan rate: ${metrics.action_plan_rate}%. ` +
        `Shared with social worker rate: ${metrics.shared_with_sw_rate}%.`,
    );
  }

  // Insight 3: Reflective question
  insights.push(
    `[reflect] Are LAC health assessments being completed within statutory timescales, ` +
      `and are health action plans leading to measurable improvements in each child's health outcomes?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listLacHealthAssessments(
  homeId: string,
): Promise<ServiceResult<LacHealthAssessmentRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = (await createServerClient()) as unknown as SB;
  if (!s) return { ok: true, data: [] };

  let q = (s as any)
    .from("cs_lac_health_assessments")
    .select("*")
    .eq("home_id", homeId);
  q = q.order("assessment_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createLacHealthAssessment(payload: {
  homeId: string;
  childName: string;
  childId?: string | null;
  assessmentDate: string;
  assessmentType: AssessmentType;
  healthOutcome: HealthOutcome;
  complianceStatus: ComplianceStatus;
  healthDomain: HealthDomain;
  clinicianName?: string | null;
  clinicLocation?: string | null;
  healthActionPlanCreated?: boolean;
  actionsCompleted?: boolean;
  childAttended?: boolean;
  childViewsCaptured?: boolean;
  carerAttended?: boolean;
  sharedWithSocialWorker?: boolean;
  nextAssessmentDue?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<LacHealthAssessmentRow>> {
  if (!isSupabaseEnabled())
    return { ok: false, error: "Supabase not configured" };

  const s = (await createServerClient()) as unknown as SB;
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s as any)
    .from("cs_lac_health_assessments")
    .insert({
      home_id: payload.homeId,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      assessment_date: payload.assessmentDate,
      assessment_type: payload.assessmentType,
      health_outcome: payload.healthOutcome,
      compliance_status: payload.complianceStatus,
      health_domain: payload.healthDomain,
      clinician_name: payload.clinicianName ?? null,
      clinic_location: payload.clinicLocation ?? null,
      health_action_plan_created: payload.healthActionPlanCreated ?? true,
      actions_completed: payload.actionsCompleted ?? false,
      child_attended: payload.childAttended ?? true,
      child_views_captured: payload.childViewsCaptured ?? true,
      carer_attended: payload.carerAttended ?? true,
      shared_with_social_worker: payload.sharedWithSocialWorker ?? true,
      next_assessment_due: payload.nextAssessmentDue ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeLacHealthAssessmentMetrics,
  computeLacHealthAssessmentAlerts,
  generateLacHealthAssessmentCaraInsights,
};
