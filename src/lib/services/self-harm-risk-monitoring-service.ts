// ══════════════════════════════════════════════════════════════════════════════
// CARA — SELF-HARM RISK MONITORING SERVICE
// Tracks self-harm risk indicators, interventions, safety plans,
// and therapeutic support for children at risk of self-harm.
// CHR 2015 Reg 12 (health and wellbeing — mental health),
// Reg 34 (safeguarding — protecting from harm).
//
// Covers: risk level, intervention type, safety plan status,
// therapeutic engagement, and multi-agency involvement.
//
// SCCIF: Experiences — "Children at risk of self-harm receive timely support."
// "Safety plans are robust and regularly reviewed."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type RiskLevel =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "resolved";

export type InterventionType =
  | "therapeutic_conversation"
  | "safety_plan_review"
  | "camhs_referral"
  | "crisis_team_contact"
  | "one_to_one_support"
  | "environmental_safety"
  | "medication_review"
  | "distraction_technique"
  | "peer_support"
  | "other";

export type SafetyPlanStatus =
  | "active_reviewed"
  | "active_needs_review"
  | "being_developed"
  | "not_in_place"
  | "not_required";

export type TriggerType =
  | "family_contact"
  | "peer_conflict"
  | "school_pressure"
  | "anniversary_date"
  | "placement_change"
  | "trauma_reminder"
  | "social_media"
  | "unknown"
  | "multiple_triggers"
  | "other";

export interface SelfHarmRiskMonitoringRecord {
  id: string;
  home_id: string;
  risk_level: RiskLevel;
  intervention_type: InterventionType;
  safety_plan_status: SafetyPlanStatus;
  trigger_type: TriggerType;
  monitoring_date: string;
  child_name: string;
  child_id: string | null;
  monitored_by: string;
  child_engaged: boolean;
  safety_plan_shared: boolean;
  camhs_involved: boolean;
  gp_informed: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  environment_checked: boolean;
  means_restriction_applied: boolean;
  observation_level_set: boolean;
  staff_trained: boolean;
  care_plan_updated: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const RISK_LEVELS: { level: RiskLevel; label: string }[] = [
  { level: "critical", label: "Critical" },
  { level: "high", label: "High" },
  { level: "medium", label: "Medium" },
  { level: "low", label: "Low" },
  { level: "resolved", label: "Resolved" },
];

export const INTERVENTION_TYPES: { type: InterventionType; label: string }[] = [
  { type: "therapeutic_conversation", label: "Therapeutic Conversation" },
  { type: "safety_plan_review", label: "Safety Plan Review" },
  { type: "camhs_referral", label: "CAMHS Referral" },
  { type: "crisis_team_contact", label: "Crisis Team Contact" },
  { type: "one_to_one_support", label: "One-to-One Support" },
  { type: "environmental_safety", label: "Environmental Safety" },
  { type: "medication_review", label: "Medication Review" },
  { type: "distraction_technique", label: "Distraction Technique" },
  { type: "peer_support", label: "Peer Support" },
  { type: "other", label: "Other" },
];

export const SAFETY_PLAN_STATUSES: { status: SafetyPlanStatus; label: string }[] = [
  { status: "active_reviewed", label: "Active & Reviewed" },
  { status: "active_needs_review", label: "Active — Needs Review" },
  { status: "being_developed", label: "Being Developed" },
  { status: "not_in_place", label: "Not in Place" },
  { status: "not_required", label: "Not Required" },
];

export const TRIGGER_TYPES: { trigger: TriggerType; label: string }[] = [
  { trigger: "family_contact", label: "Family Contact" },
  { trigger: "peer_conflict", label: "Peer Conflict" },
  { trigger: "school_pressure", label: "School Pressure" },
  { trigger: "anniversary_date", label: "Anniversary Date" },
  { trigger: "placement_change", label: "Placement Change" },
  { trigger: "trauma_reminder", label: "Trauma Reminder" },
  { trigger: "social_media", label: "Social Media" },
  { trigger: "unknown", label: "Unknown" },
  { trigger: "multiple_triggers", label: "Multiple Triggers" },
  { trigger: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeSelfHarmRiskMetrics(
  records: SelfHarmRiskMonitoringRecord[],
): {
  total_records: number;
  critical_count: number;
  high_count: number;
  no_safety_plan_count: number;
  needs_review_count: number;
  child_engaged_rate: number | null;
  safety_plan_shared_rate: number | null;
  camhs_involved_rate: number | null;
  gp_informed_rate: number | null;
  social_worker_informed_rate: number | null;
  parent_informed_rate: number | null;
  environment_checked_rate: number | null;
  means_restriction_rate: number | null;
  observation_level_rate: number | null;
  staff_trained_rate: number | null;
  care_plan_updated_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_risk_level: Record<string, number>;
  by_intervention_type: Record<string, number>;
  by_safety_plan_status: Record<string, number>;
  by_trigger_type: Record<string, number>;
} {
  const critical = records.filter((r) => r.risk_level === "critical").length;
  const high = records.filter((r) => r.risk_level === "high").length;
  const noSafetyPlan = records.filter((r) => r.safety_plan_status === "not_in_place").length;
  const needsReview = records.filter((r) => r.safety_plan_status === "active_needs_review").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof SelfHarmRiskMonitoringRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.risk_level] = (byLevel[r.risk_level] ?? 0) + 1;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.intervention_type] = (byType[r.intervention_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.safety_plan_status] = (byStatus[r.safety_plan_status] ?? 0) + 1;

  const byTrigger: Record<string, number> = {};
  for (const r of records) byTrigger[r.trigger_type] = (byTrigger[r.trigger_type] ?? 0) + 1;

  return {
    total_records: records.length,
    critical_count: critical,
    high_count: high,
    no_safety_plan_count: noSafetyPlan,
    needs_review_count: needsReview,
    child_engaged_rate: boolRate("child_engaged"),
    safety_plan_shared_rate: boolRate("safety_plan_shared"),
    camhs_involved_rate: boolRate("camhs_involved"),
    gp_informed_rate: boolRate("gp_informed"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    environment_checked_rate: boolRate("environment_checked"),
    means_restriction_rate: boolRate("means_restriction_applied"),
    observation_level_rate: boolRate("observation_level_set"),
    staff_trained_rate: boolRate("staff_trained"),
    care_plan_updated_rate: boolRate("care_plan_updated"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_risk_level: byLevel,
    by_intervention_type: byType,
    by_safety_plan_status: byStatus,
    by_trigger_type: byTrigger,
  };
}

export function identifySelfHarmRiskAlerts(
  records: SelfHarmRiskMonitoringRecord[],
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

  // Critical risk without safety plan
  for (const r of records) {
    if (r.risk_level === "critical" && r.safety_plan_status === "not_in_place") {
      alerts.push({
        type: "critical_no_safety_plan",
        severity: "critical",
        message: `${r.child_name} at critical self-harm risk without safety plan in place — urgent action required`,
        id: r.id,
      });
    }
  }

  // CAMHS not involved for high/critical
  const noCamhs = records.filter((r) => (r.risk_level === "critical" || r.risk_level === "high") && !r.camhs_involved).length;
  if (noCamhs >= 1) {
    alerts.push({
      type: "camhs_not_involved",
      severity: "high",
      message: `${noCamhs} high/critical risk ${noCamhs === 1 ? "record has" : "records have"} CAMHS not involved — ensure specialist input`,
      id: "camhs_not_involved",
    });
  }

  // Staff not trained
  const noTrained = records.filter((r) => !r.staff_trained).length;
  if (noTrained >= 1) {
    alerts.push({
      type: "staff_not_trained",
      severity: "high",
      message: `${noTrained} ${noTrained === 1 ? "monitoring record shows" : "monitoring records show"} staff not trained in self-harm support — arrange training urgently`,
      id: "staff_not_trained",
    });
  }

  // Environment not checked
  const noEnvCheck = records.filter((r) => !r.environment_checked).length;
  if (noEnvCheck >= 2) {
    alerts.push({
      type: "environment_not_checked",
      severity: "medium",
      message: `${noEnvCheck} records without environmental safety check — review ligature and hazard assessments`,
      id: "environment_not_checked",
    });
  }

  // Means restriction not applied
  const noMeans = records.filter((r) => !r.means_restriction_applied).length;
  if (noMeans >= 2) {
    alerts.push({
      type: "no_means_restriction",
      severity: "medium",
      message: `${noMeans} records without means restriction applied — review environmental safety`,
      id: "no_means_restriction",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    riskLevel?: RiskLevel;
    interventionType?: InterventionType;
    safetyPlanStatus?: SafetyPlanStatus;
    triggerType?: TriggerType;
    limit?: number;
  },
): Promise<ServiceResult<SelfHarmRiskMonitoringRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_self_harm_risk_monitoring") as SB).select("*").eq("home_id", homeId);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.interventionType) q = q.eq("intervention_type", filters.interventionType);
  if (filters?.safetyPlanStatus) q = q.eq("safety_plan_status", filters.safetyPlanStatus);
  if (filters?.triggerType) q = q.eq("trigger_type", filters.triggerType);
  q = q.order("monitoring_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    riskLevel: RiskLevel;
    interventionType: InterventionType;
    safetyPlanStatus: SafetyPlanStatus;
    triggerType: TriggerType;
    monitoringDate: string;
    childName: string;
    childId?: string | null;
    monitoredBy: string;
    childEngaged?: boolean;
    safetyPlanShared?: boolean;
    camhsInvolved?: boolean;
    gpInformed?: boolean;
    socialWorkerInformed?: boolean;
    parentInformed?: boolean;
    environmentChecked?: boolean;
    meansRestrictionApplied?: boolean;
    observationLevelSet?: boolean;
    staffTrained?: boolean;
    carePlanUpdated?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<SelfHarmRiskMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_self_harm_risk_monitoring") as SB)
    .insert({
      home_id: payload.homeId,
      risk_level: payload.riskLevel,
      intervention_type: payload.interventionType,
      safety_plan_status: payload.safetyPlanStatus,
      trigger_type: payload.triggerType,
      monitoring_date: payload.monitoringDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      monitored_by: payload.monitoredBy,
      child_engaged: payload.childEngaged ?? true,
      safety_plan_shared: payload.safetyPlanShared ?? true,
      camhs_involved: payload.camhsInvolved ?? false,
      gp_informed: payload.gpInformed ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? false,
      environment_checked: payload.environmentChecked ?? true,
      means_restriction_applied: payload.meansRestrictionApplied ?? true,
      observation_level_set: payload.observationLevelSet ?? true,
      staff_trained: payload.staffTrained ?? true,
      care_plan_updated: payload.carePlanUpdated ?? true,
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

export async function updateRecord(
  id: string,
  updates: Partial<{
    riskLevel: RiskLevel;
    interventionType: InterventionType;
    safetyPlanStatus: SafetyPlanStatus;
    triggerType: TriggerType;
    monitoringDate: string;
    childName: string;
    childId: string | null;
    monitoredBy: string;
    childEngaged: boolean;
    safetyPlanShared: boolean;
    camhsInvolved: boolean;
    gpInformed: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    environmentChecked: boolean;
    meansRestrictionApplied: boolean;
    observationLevelSet: boolean;
    staffTrained: boolean;
    carePlanUpdated: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<SelfHarmRiskMonitoringRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.interventionType !== undefined) mapped.intervention_type = updates.interventionType;
  if (updates.safetyPlanStatus !== undefined) mapped.safety_plan_status = updates.safetyPlanStatus;
  if (updates.triggerType !== undefined) mapped.trigger_type = updates.triggerType;
  if (updates.monitoringDate !== undefined) mapped.monitoring_date = updates.monitoringDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.monitoredBy !== undefined) mapped.monitored_by = updates.monitoredBy;
  if (updates.childEngaged !== undefined) mapped.child_engaged = updates.childEngaged;
  if (updates.safetyPlanShared !== undefined) mapped.safety_plan_shared = updates.safetyPlanShared;
  if (updates.camhsInvolved !== undefined) mapped.camhs_involved = updates.camhsInvolved;
  if (updates.gpInformed !== undefined) mapped.gp_informed = updates.gpInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.environmentChecked !== undefined) mapped.environment_checked = updates.environmentChecked;
  if (updates.meansRestrictionApplied !== undefined) mapped.means_restriction_applied = updates.meansRestrictionApplied;
  if (updates.observationLevelSet !== undefined) mapped.observation_level_set = updates.observationLevelSet;
  if (updates.staffTrained !== undefined) mapped.staff_trained = updates.staffTrained;
  if (updates.carePlanUpdated !== undefined) mapped.care_plan_updated = updates.carePlanUpdated;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_self_harm_risk_monitoring") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSelfHarmRiskMetrics,
  identifySelfHarmRiskAlerts,
};
