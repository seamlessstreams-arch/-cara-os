// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CLOSURE PLANNING SERVICE
// Manages Children's Home Closure Planning — planned and emergency closure
// procedures, child transfer arrangements, staff redeployment planning,
// regulatory notifications, and stakeholder communications required when
// a children's home is closing.
// CHR 2015 Reg 46 (notification of closure), Reg 12 (protection of
// children during transitions), Reg 36 (fitness of premises — wind-down).
//
// Covers: closure reason, closure phase, child transfer status, stakeholder
// notification, child views, staff consultation, transition planning, and
// risk assessment.
//
// SCCIF: Leadership & Management — "Closure is managed to minimise
// disruption to children." "Children's views are central to transition
// planning."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const CLOSURE_REASONS = [
  "financial_viability",
  "regulatory_action",
  "ofsted_enforcement",
  "provider_decision",
  "building_condition",
  "staffing_failure",
  "safeguarding_concerns",
  "merger_acquisition",
  "lease_expiry",
  "strategic_restructure",
] as const;
export type ClosureReason = (typeof CLOSURE_REASONS)[number];

export const CLOSURE_PHASES = [
  "pre_planning",
  "consultation",
  "active_transition",
  "final_closure",
  "post_closure",
] as const;
export type ClosurePhase = (typeof CLOSURE_PHASES)[number];

export const CHILD_TRANSFER_STATUSES = [
  "not_started",
  "matching_in_progress",
  "placement_identified",
  "transferred",
  "disrupted",
] as const;
export type ChildTransferStatus = (typeof CHILD_TRANSFER_STATUSES)[number];

export const STAKEHOLDER_NOTIFICATIONS = [
  "ofsted",
  "local_authority",
  "placing_authority",
  "parents_carers",
  "children",
  "staff_team",
  "irp_independent_visitor",
  "health_services",
  "education_providers",
  "legal_representatives",
] as const;
export type StakeholderNotification = (typeof STAKEHOLDER_NOTIFICATIONS)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface HomeClosurePlanningRow {
  id: string;
  home_id: string;
  closure_reason: string;
  closure_phase: string;
  planned_closure_date: string;
  actual_closure_date: string | null;
  child_name: string;
  child_id: string | null;
  child_transfer_status: string;
  receiving_home: string | null;
  stakeholder_notified: string;
  notification_date: string | null;
  child_views_sought: boolean;
  child_wishes_documented: boolean;
  staff_consultation_completed: boolean;
  regulatory_notification_sent: boolean;
  transition_plan_in_place: boolean;
  risk_assessment_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeHomeClosurePlanningMetrics(
  rows: HomeClosurePlanningRow[],
): {
  total_records: number;
  disrupted_count: number;
  not_started_count: number;
  children_without_plan_count: number;
  regulatory_not_sent_count: number;
  child_views_rate: number;
  transition_plan_rate: number;
  risk_assessment_rate: number;
  staff_consultation_rate: number;
  child_wishes_rate: number;
  phase_breakdown: Record<string, number>;
  transfer_status_breakdown: Record<string, number>;
  unique_children: number;
} {
  const disruptedCount = rows.filter((r) => r.child_transfer_status === "disrupted").length;
  const notStartedCount = rows.filter((r) => r.child_transfer_status === "not_started").length;
  const childrenWithoutPlan = rows.filter((r) => !r.transition_plan_in_place).length;
  const regulatoryNotSent = rows.filter((r) => !r.regulatory_notification_sent).length;

  const boolRate = (field: keyof HomeClosurePlanningRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const phaseBreakdown: Record<string, number> = {};
  for (const r of rows) phaseBreakdown[r.closure_phase] = (phaseBreakdown[r.closure_phase] ?? 0) + 1;

  const transferStatusBreakdown: Record<string, number> = {};
  for (const r of rows) transferStatusBreakdown[r.child_transfer_status] = (transferStatusBreakdown[r.child_transfer_status] ?? 0) + 1;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  return {
    total_records: rows.length,
    disrupted_count: disruptedCount,
    not_started_count: notStartedCount,
    children_without_plan_count: childrenWithoutPlan,
    regulatory_not_sent_count: regulatoryNotSent,
    child_views_rate: boolRate("child_views_sought"),
    transition_plan_rate: boolRate("transition_plan_in_place"),
    risk_assessment_rate: boolRate("risk_assessment_completed"),
    staff_consultation_rate: boolRate("staff_consultation_completed"),
    child_wishes_rate: boolRate("child_wishes_documented"),
    phase_breakdown: phaseBreakdown,
    transfer_status_breakdown: transferStatusBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computeHomeClosurePlanningAlerts(
  rows: HomeClosurePlanningRow[],
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

  // Critical: child transfer disrupted + no transition plan
  for (const r of rows) {
    if (r.child_transfer_status === "disrupted" && !r.transition_plan_in_place) {
      alerts.push({
        type: "disrupted_no_plan",
        severity: "critical",
        message: `${r.child_name}'s transfer has been disrupted with no transition plan in place — immediate review and alternative placement required`,
        record_id: r.id,
      });
    }
  }

  // High: regulatory notification not sent + active_transition phase
  const regulatoryNotSentActive = rows.filter(
    (r) => !r.regulatory_notification_sent && r.closure_phase === "active_transition",
  ).length;
  if (regulatoryNotSentActive >= 1) {
    alerts.push({
      type: "regulatory_not_sent_active",
      severity: "high",
      message: `${regulatoryNotSentActive} ${regulatoryNotSentActive === 1 ? "record is" : "records are"} in active transition phase without regulatory notification sent — notify Ofsted immediately`,
    });
  }

  // High: child views not sought for multiple children
  const childViewsNotSought = rows.filter((r) => !r.child_views_sought).length;
  if (childViewsNotSought >= 2) {
    alerts.push({
      type: "child_views_not_sought",
      severity: "high",
      message: `${childViewsNotSought} children have not had their views sought during closure planning — ensure child participation in transition decisions`,
    });
  }

  // Medium: staff consultation not completed
  const staffNotConsulted = rows.filter((r) => !r.staff_consultation_completed).length;
  if (staffNotConsulted >= 1) {
    alerts.push({
      type: "staff_consultation_incomplete",
      severity: "medium",
      message: `${staffNotConsulted} ${staffNotConsulted === 1 ? "record has" : "records have"} not completed staff consultation — ensure staff are consulted on redeployment and transition arrangements`,
    });
  }

  return alerts;
}

export function generateHomeClosurePlanningCaraInsights(
  metrics: ReturnType<typeof computeHomeClosurePlanningMetrics>,
  alerts: ReturnType<typeof computeHomeClosurePlanningAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (pink-themed)
  const disruptedPct =
    metrics.total_records > 0
      ? Math.round((metrics.disrupted_count / metrics.total_records) * 1000) / 10
      : 0;
  insights.push(
    `[pink] ${metrics.total_records} home closure planning records across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.disrupted_count} (${disruptedPct}%) transfers disrupted. ` +
      `Transition plan rate: ${metrics.transition_plan_rate}%. ` +
      `Child views sought rate: ${metrics.child_views_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Staff consultation rate: ${metrics.staff_consultation_rate}%. ` +
        `Regulatory not sent: ${metrics.regulatory_not_sent_count}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Staff consultation rate: ${metrics.staff_consultation_rate}%. ` +
        `Regulatory not sent: ${metrics.regulatory_not_sent_count}.`,
    );
  }

  // Insight 3: Reflective question
  insights.push(
    `[reflect] Is the closure process being managed to minimise disruption to each child, ` +
      `and are children's wishes and feelings genuinely shaping their transition plans?`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export function listHomeClosurePlanningRecords(
  homeId: string,
): Promise<ServiceResult<HomeClosurePlanningRow[]>> {
  if (!isSupabaseEnabled()) return Promise.resolve({ ok: true, data: [] });

  const q = (
    (createServerClient() as unknown as SB) as any
  ).from("cs_home_closure_planning").select("*").eq("home_id", homeId)
    .order("created_at", { ascending: false }).limit(200);

  return q.then(({ data, error }: { data: HomeClosurePlanningRow[] | null; error: { message: string } | null }) => {
    if (error) return { ok: false, error: error.message } as ServiceResult<HomeClosurePlanningRow[]>;
    return { ok: true, data: data ?? [] } as ServiceResult<HomeClosurePlanningRow[]>;
  });
}

export function createHomeClosurePlanningRecord(payload: {
  homeId: string;
  closureReason: ClosureReason;
  closurePhase: ClosurePhase;
  plannedClosureDate: string;
  actualClosureDate?: string | null;
  childName: string;
  childId?: string | null;
  childTransferStatus: ChildTransferStatus;
  receivingHome?: string | null;
  stakeholderNotified: StakeholderNotification;
  notificationDate?: string | null;
  childViewsSought?: boolean;
  childWishesDocumented?: boolean;
  staffConsultationCompleted?: boolean;
  regulatoryNotificationSent?: boolean;
  transitionPlanInPlace?: boolean;
  riskAssessmentCompleted?: boolean;
  notes?: string | null;
}): Promise<ServiceResult<HomeClosurePlanningRow>> {
  if (!isSupabaseEnabled()) return Promise.resolve({ ok: false, error: "Supabase not configured" });

  const s = createServerClient() as unknown as SB;

  return ((s as any).from("cs_home_closure_planning") as any)
    .insert({
      home_id: payload.homeId,
      closure_reason: payload.closureReason,
      closure_phase: payload.closurePhase,
      planned_closure_date: payload.plannedClosureDate,
      actual_closure_date: payload.actualClosureDate ?? null,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      child_transfer_status: payload.childTransferStatus,
      receiving_home: payload.receivingHome ?? null,
      stakeholder_notified: payload.stakeholderNotified,
      notification_date: payload.notificationDate ?? null,
      child_views_sought: payload.childViewsSought ?? false,
      child_wishes_documented: payload.childWishesDocumented ?? false,
      staff_consultation_completed: payload.staffConsultationCompleted ?? false,
      regulatory_notification_sent: payload.regulatoryNotificationSent ?? false,
      transition_plan_in_place: payload.transitionPlanInPlace ?? false,
      risk_assessment_completed: payload.riskAssessmentCompleted ?? false,
      notes: payload.notes ?? null,
    })
    .select()
    .single()
    .then(({ data, error }: { data: HomeClosurePlanningRow | null; error: { message: string } | null }) => {
      if (error) return { ok: false, error: error.message } as ServiceResult<HomeClosurePlanningRow>;
      return { ok: true, data: data! } as ServiceResult<HomeClosurePlanningRow>;
    });
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeHomeClosurePlanningMetrics,
  computeHomeClosurePlanningAlerts,
  generateHomeClosurePlanningCaraInsights,
};
