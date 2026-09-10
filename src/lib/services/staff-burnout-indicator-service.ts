// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF BURNOUT INDICATOR SERVICE
// Tracks staff burnout indicators as part of the Cara Staff Development,
// Support and Risk Intelligence layer. This is SUPPORTIVE and PROTECTIVE,
// not punitive.
// CHR 2015 Reg 33 (employment of staff — support and welfare),
// Reg 34 (employment policies), Health and Safety at Work Act 1974.
//
// Covers: emotional exhaustion, depersonalisation, reduced accomplishment,
// absence patterns, quality decline, withdrawal, cynicism, physical symptoms,
// workload overwhelm, and compassion fatigue.
//
// SCCIF: Well-Led — "Staff are well supported, feel valued, and are able
// to fulfil their roles effectively." "Staff wellbeing is prioritised."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type IndicatorType =
  | "emotional_exhaustion"
  | "depersonalisation"
  | "reduced_accomplishment"
  | "increased_absence"
  | "quality_decline"
  | "withdrawal"
  | "cynicism"
  | "physical_symptoms"
  | "workload_overwhelm"
  | "compassion_fatigue";

export type BurnoutSeverity =
  | "early_sign"
  | "developing"
  | "concerning"
  | "critical"
  | "resolved";

export type SupportStatus =
  | "monitoring"
  | "supporting"
  | "improving"
  | "escalated"
  | "resolved";

export type ImpactLevel =
  | "minimal"
  | "low"
  | "moderate"
  | "high"
  | "severe";

export interface StaffBurnoutIndicatorRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  indicator_type: IndicatorType;
  burnout_severity: BurnoutSeverity;
  support_status: SupportStatus;
  impact_level: ImpactLevel;
  session_date: string;
  observed_by: string;
  description: string;
  evidence_summary: string;
  possible_causes: string | null;
  support_offered_detail: string | null;
  staff_response: string | null;
  staff_aware: boolean;
  manager_aware: boolean;
  support_offered: boolean;
  wellbeing_check_done: boolean;
  supervision_adjusted: boolean;
  workload_reviewed: boolean;
  leave_offered: boolean;
  occupational_health_referred: boolean;
  peer_support_arranged: boolean;
  care_plan_reflects: boolean;
  team_informed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const INDICATOR_TYPES: { type: IndicatorType; label: string }[] = [
  { type: "emotional_exhaustion", label: "Emotional Exhaustion" },
  { type: "depersonalisation", label: "Depersonalisation" },
  { type: "reduced_accomplishment", label: "Reduced Accomplishment" },
  { type: "increased_absence", label: "Increased Absence" },
  { type: "quality_decline", label: "Quality Decline" },
  { type: "withdrawal", label: "Withdrawal" },
  { type: "cynicism", label: "Cynicism" },
  { type: "physical_symptoms", label: "Physical Symptoms" },
  { type: "workload_overwhelm", label: "Workload Overwhelm" },
  { type: "compassion_fatigue", label: "Compassion Fatigue" },
];

export const BURNOUT_SEVERITIES: { severity: BurnoutSeverity; label: string }[] = [
  { severity: "early_sign", label: "Early Sign" },
  { severity: "developing", label: "Developing" },
  { severity: "concerning", label: "Concerning" },
  { severity: "critical", label: "Critical" },
  { severity: "resolved", label: "Resolved" },
];

export const SUPPORT_STATUSES: { status: SupportStatus; label: string }[] = [
  { status: "monitoring", label: "Monitoring" },
  { status: "supporting", label: "Supporting" },
  { status: "improving", label: "Improving" },
  { status: "escalated", label: "Escalated" },
  { status: "resolved", label: "Resolved" },
];

export const IMPACT_LEVELS: { level: ImpactLevel; label: string }[] = [
  { level: "minimal", label: "Minimal" },
  { level: "low", label: "Low" },
  { level: "moderate", label: "Moderate" },
  { level: "high", label: "High" },
  { level: "severe", label: "Severe" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeBurnoutMetrics(
  records: StaffBurnoutIndicatorRecord[],
): {
  total_indicators: number;
  critical_count: number;
  concerning_count: number;
  unresolved_count: number;
  escalated_count: number;
  staff_aware_rate: number | null;
  manager_aware_rate: number | null;
  support_offered_rate: number | null;
  wellbeing_check_rate: number | null;
  supervision_adjusted_rate: number | null;
  workload_reviewed_rate: number | null;
  leave_offered_rate: number | null;
  occupational_health_rate: number | null;
  peer_support_rate: number | null;
  care_plan_rate: number | null;
  team_informed_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_indicator_type: Record<string, number>;
  by_burnout_severity: Record<string, number>;
  by_support_status: Record<string, number>;
  by_impact_level: Record<string, number>;
} {
  const criticalCount = records.filter((r) => r.burnout_severity === "critical").length;
  const concerningCount = records.filter(
    (r) => r.burnout_severity === "concerning" || r.burnout_severity === "critical",
  ).length;
  const unresolvedCount = records.filter(
    (r) =>
      r.support_status === "monitoring" ||
      r.support_status === "supporting" ||
      r.support_status === "escalated",
  ).length;
  const escalatedCount = records.filter((r) => r.support_status === "escalated").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof StaffBurnoutIndicatorRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byIndicatorType: Record<string, number> = {};
  for (const r of records) byIndicatorType[r.indicator_type] = (byIndicatorType[r.indicator_type] ?? 0) + 1;

  const byBurnoutSeverity: Record<string, number> = {};
  for (const r of records) byBurnoutSeverity[r.burnout_severity] = (byBurnoutSeverity[r.burnout_severity] ?? 0) + 1;

  const bySupportStatus: Record<string, number> = {};
  for (const r of records) bySupportStatus[r.support_status] = (bySupportStatus[r.support_status] ?? 0) + 1;

  const byImpactLevel: Record<string, number> = {};
  for (const r of records) byImpactLevel[r.impact_level] = (byImpactLevel[r.impact_level] ?? 0) + 1;

  return {
    total_indicators: records.length,
    critical_count: criticalCount,
    concerning_count: concerningCount,
    unresolved_count: unresolvedCount,
    escalated_count: escalatedCount,
    staff_aware_rate: boolRate("staff_aware"),
    manager_aware_rate: boolRate("manager_aware"),
    support_offered_rate: boolRate("support_offered"),
    wellbeing_check_rate: boolRate("wellbeing_check_done"),
    supervision_adjusted_rate: boolRate("supervision_adjusted"),
    workload_reviewed_rate: boolRate("workload_reviewed"),
    leave_offered_rate: boolRate("leave_offered"),
    occupational_health_rate: boolRate("occupational_health_referred"),
    peer_support_rate: boolRate("peer_support_arranged"),
    care_plan_rate: boolRate("care_plan_reflects"),
    team_informed_rate: boolRate("team_informed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: uniqueStaff,
    by_indicator_type: byIndicatorType,
    by_burnout_severity: byBurnoutSeverity,
    by_support_status: bySupportStatus,
    by_impact_level: byImpactLevel,
  };
}

export function identifyBurnoutAlerts(
  records: StaffBurnoutIndicatorRecord[],
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

  // Critical unsupported — per-record
  for (const r of records) {
    if (r.burnout_severity === "critical" && r.support_status === "monitoring") {
      alerts.push({
        type: "critical_unsupported",
        severity: "critical",
        message: `${r.staff_name} shows critical burnout signs with only monitoring — immediate support needed.`,
        id: r.id,
      });
    }
  }

  // Staff not aware
  const staffNotAware = records.filter((r) => r.staff_aware === false).length;
  if (staffNotAware >= 1) {
    alerts.push({
      type: "staff_not_aware",
      severity: "high",
      message: `${staffNotAware} ${staffNotAware === 1 ? "indicator has" : "indicators have"} staff not yet aware of concern.`,
      id: "staff_not_aware",
    });
  }

  // No wellbeing check
  const noWellbeingCheck = records.filter((r) => r.wellbeing_check_done === false).length;
  if (noWellbeingCheck >= 1) {
    alerts.push({
      type: "no_wellbeing_check",
      severity: "high",
      message: `${noWellbeingCheck} ${noWellbeingCheck === 1 ? "indicator has" : "indicators have"} no wellbeing check completed.`,
      id: "no_wellbeing_check",
    });
  }

  // No workload review
  const noWorkloadReview = records.filter((r) => r.workload_reviewed === false).length;
  if (noWorkloadReview >= 2) {
    alerts.push({
      type: "no_workload_review",
      severity: "medium",
      message: `${noWorkloadReview} indicators have no workload review completed.`,
      id: "no_workload_review",
    });
  }

  // No peer support
  const noPeerSupport = records.filter((r) => r.peer_support_arranged === false).length;
  if (noPeerSupport >= 2) {
    alerts.push({
      type: "no_peer_support",
      severity: "medium",
      message: `${noPeerSupport} indicators have no peer support arranged.`,
      id: "no_peer_support",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listBurnoutIndicators(
  homeId: string,
  filters?: {
    indicatorType?: IndicatorType;
    burnoutSeverity?: BurnoutSeverity;
    supportStatus?: SupportStatus;
    impactLevel?: ImpactLevel;
    limit?: number;
  },
): Promise<ServiceResult<StaffBurnoutIndicatorRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_burnout_indicators") as SB).select("*").eq("home_id", homeId);
  if (filters?.indicatorType) q = q.eq("indicator_type", filters.indicatorType);
  if (filters?.burnoutSeverity) q = q.eq("burnout_severity", filters.burnoutSeverity);
  if (filters?.supportStatus) q = q.eq("support_status", filters.supportStatus);
  if (filters?.impactLevel) q = q.eq("impact_level", filters.impactLevel);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createBurnoutIndicator(
  payload: {
    homeId: string;
    staffName: string;
    staffId?: string | null;
    indicatorType: IndicatorType;
    burnoutSeverity: BurnoutSeverity;
    supportStatus: SupportStatus;
    impactLevel: ImpactLevel;
    sessionDate: string;
    observedBy: string;
    description: string;
    evidenceSummary: string;
    possibleCauses?: string | null;
    supportOfferedDetail?: string | null;
    staffResponse?: string | null;
    staffAware?: boolean;
    managerAware?: boolean;
    supportOffered?: boolean;
    wellbeingCheckDone?: boolean;
    supervisionAdjusted?: boolean;
    workloadReviewed?: boolean;
    leaveOffered?: boolean;
    occupationalHealthReferred?: boolean;
    peerSupportArranged?: boolean;
    carePlanReflects?: boolean;
    teamInformed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffBurnoutIndicatorRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_burnout_indicators") as SB)
    .insert({
      home_id: payload.homeId,
      staff_name: payload.staffName,
      staff_id: payload.staffId ?? null,
      indicator_type: payload.indicatorType,
      burnout_severity: payload.burnoutSeverity,
      support_status: payload.supportStatus,
      impact_level: payload.impactLevel,
      session_date: payload.sessionDate,
      observed_by: payload.observedBy,
      description: payload.description,
      evidence_summary: payload.evidenceSummary,
      possible_causes: payload.possibleCauses ?? null,
      support_offered_detail: payload.supportOfferedDetail ?? null,
      staff_response: payload.staffResponse ?? null,
      staff_aware: payload.staffAware ?? false,
      manager_aware: payload.managerAware ?? false,
      support_offered: payload.supportOffered ?? false,
      wellbeing_check_done: payload.wellbeingCheckDone ?? false,
      supervision_adjusted: payload.supervisionAdjusted ?? false,
      workload_reviewed: payload.workloadReviewed ?? false,
      leave_offered: payload.leaveOffered ?? false,
      occupational_health_referred: payload.occupationalHealthReferred ?? false,
      peer_support_arranged: payload.peerSupportArranged ?? false,
      care_plan_reflects: payload.carePlanReflects ?? false,
      team_informed: payload.teamInformed ?? false,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateBurnoutIndicator(
  id: string,
  updates: Partial<{
    staffName: string;
    staffId: string | null;
    indicatorType: IndicatorType;
    burnoutSeverity: BurnoutSeverity;
    supportStatus: SupportStatus;
    impactLevel: ImpactLevel;
    sessionDate: string;
    observedBy: string;
    description: string;
    evidenceSummary: string;
    possibleCauses: string | null;
    supportOfferedDetail: string | null;
    staffResponse: string | null;
    staffAware: boolean;
    managerAware: boolean;
    supportOffered: boolean;
    wellbeingCheckDone: boolean;
    supervisionAdjusted: boolean;
    workloadReviewed: boolean;
    leaveOffered: boolean;
    occupationalHealthReferred: boolean;
    peerSupportArranged: boolean;
    carePlanReflects: boolean;
    teamInformed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffBurnoutIndicatorRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.staffId !== undefined) mapped.staff_id = updates.staffId;
  if (updates.indicatorType !== undefined) mapped.indicator_type = updates.indicatorType;
  if (updates.burnoutSeverity !== undefined) mapped.burnout_severity = updates.burnoutSeverity;
  if (updates.supportStatus !== undefined) mapped.support_status = updates.supportStatus;
  if (updates.impactLevel !== undefined) mapped.impact_level = updates.impactLevel;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.observedBy !== undefined) mapped.observed_by = updates.observedBy;
  if (updates.description !== undefined) mapped.description = updates.description;
  if (updates.evidenceSummary !== undefined) mapped.evidence_summary = updates.evidenceSummary;
  if (updates.possibleCauses !== undefined) mapped.possible_causes = updates.possibleCauses;
  if (updates.supportOfferedDetail !== undefined) mapped.support_offered_detail = updates.supportOfferedDetail;
  if (updates.staffResponse !== undefined) mapped.staff_response = updates.staffResponse;
  if (updates.staffAware !== undefined) mapped.staff_aware = updates.staffAware;
  if (updates.managerAware !== undefined) mapped.manager_aware = updates.managerAware;
  if (updates.supportOffered !== undefined) mapped.support_offered = updates.supportOffered;
  if (updates.wellbeingCheckDone !== undefined) mapped.wellbeing_check_done = updates.wellbeingCheckDone;
  if (updates.supervisionAdjusted !== undefined) mapped.supervision_adjusted = updates.supervisionAdjusted;
  if (updates.workloadReviewed !== undefined) mapped.workload_reviewed = updates.workloadReviewed;
  if (updates.leaveOffered !== undefined) mapped.leave_offered = updates.leaveOffered;
  if (updates.occupationalHealthReferred !== undefined) mapped.occupational_health_referred = updates.occupationalHealthReferred;
  if (updates.peerSupportArranged !== undefined) mapped.peer_support_arranged = updates.peerSupportArranged;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.teamInformed !== undefined) mapped.team_informed = updates.teamInformed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_burnout_indicators") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeBurnoutMetrics,
  identifyBurnoutAlerts,
};
