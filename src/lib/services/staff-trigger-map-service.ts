// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF TRIGGER MAP SERVICE
// Maps situations, contexts, or stressors that trigger concerning patterns
// in staff practice — enabling proactive support before incidents occur.
//
// CHR 2015 Reg 33 (employment of staff), Reg 34 (fitness of workers),
// Reg 13 (leadership and management), Reg 35 (supervision and training).
//
// STRENGTHS-BASED, FAIR, CONTEXTUAL, EVIDENCE-LED.
// Trigger maps identify what environments or circumstances affect staff
// practice — this is about understanding, not blame. What support does
// this person need? What reasonable adjustments prevent recurrence?
//
// SCCIF: Well-Led — "Leaders understand the impact of the environment
// on staff and take proactive steps to support wellbeing."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TriggerCategory =
  | "environmental"
  | "interpersonal"
  | "workload"
  | "child_behaviour"
  | "team_conflict"
  | "personal_stress"
  | "organisational_change"
  | "shift_pattern"
  | "safeguarding_pressure"
  | "other";

export type TriggerSeverity =
  | "mild"
  | "moderate"
  | "significant"
  | "severe"
  | "overwhelming";

export type CopingEffectiveness =
  | "very_effective"
  | "effective"
  | "partially_effective"
  | "ineffective"
  | "counterproductive";

export type MapStatus =
  | "draft"
  | "active"
  | "under_review"
  | "resolved"
  | "archived";

export interface StaffTriggerMapRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  trigger_category: TriggerCategory;
  trigger_severity: TriggerSeverity;
  coping_effectiveness: CopingEffectiveness;
  map_status: MapStatus;
  session_date: string;
  identified_by: string;
  trigger_description: string;
  context_when_triggered: string;
  observable_response: string;
  impact_on_practice: string | null;
  current_coping_strategies: string | null;
  support_strategies: string | null;
  environmental_adjustments: string | null;
  supervision_response: string | null;
  staff_self_awareness: string | null;
  staff_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  evidence_documented: boolean;
  staff_involved: boolean;
  triggers_explored: boolean;
  coping_strategies_identified: boolean;
  support_plan_linked: boolean;
  environmental_factors_considered: boolean;
  supervision_adjusted: boolean;
  wellbeing_checked: boolean;
  manager_reviewed: boolean;
  team_aware_if_appropriate: boolean;
  follow_up_scheduled: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TRIGGER_CATEGORIES: { category: TriggerCategory; label: string }[] = [
  { category: "environmental", label: "Environmental" },
  { category: "interpersonal", label: "Interpersonal" },
  { category: "workload", label: "Workload" },
  { category: "child_behaviour", label: "Child Behaviour" },
  { category: "team_conflict", label: "Team Conflict" },
  { category: "personal_stress", label: "Personal Stress" },
  { category: "organisational_change", label: "Organisational Change" },
  { category: "shift_pattern", label: "Shift Pattern" },
  { category: "safeguarding_pressure", label: "Safeguarding Pressure" },
  { category: "other", label: "Other" },
];

export const TRIGGER_SEVERITIES: { severity: TriggerSeverity; label: string }[] = [
  { severity: "mild", label: "Mild" },
  { severity: "moderate", label: "Moderate" },
  { severity: "significant", label: "Significant" },
  { severity: "severe", label: "Severe" },
  { severity: "overwhelming", label: "Overwhelming" },
];

export const COPING_EFFECTIVENESS_LEVELS: { effectiveness: CopingEffectiveness; label: string }[] = [
  { effectiveness: "very_effective", label: "Very Effective" },
  { effectiveness: "effective", label: "Effective" },
  { effectiveness: "partially_effective", label: "Partially Effective" },
  { effectiveness: "ineffective", label: "Ineffective" },
  { effectiveness: "counterproductive", label: "Counterproductive" },
];

export const MAP_STATUSES: { status: MapStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "active", label: "Active" },
  { status: "under_review", label: "Under Review" },
  { status: "resolved", label: "Resolved" },
  { status: "archived", label: "Archived" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computeTriggerMapMetrics(records: StaffTriggerMapRecord[]): {
  total_maps: number;
  severe_count: number;
  ineffective_coping_count: number;
  active_count: number;
  unreviewed_count: number;
  evidence_documented_rate: number | null;
  staff_involved_rate: number | null;
  triggers_explored_rate: number | null;
  coping_strategies_rate: number | null;
  support_plan_linked_rate: number | null;
  environmental_factors_rate: number | null;
  supervision_adjusted_rate: number | null;
  wellbeing_checked_rate: number | null;
  manager_reviewed_rate: number | null;
  team_aware_rate: number | null;
  follow_up_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_trigger_category: Record<string, number>;
  by_trigger_severity: Record<string, number>;
  by_coping_effectiveness: Record<string, number>;
  by_map_status: Record<string, number>;
} {
  const severeCount = records.filter(
    (r) => r.trigger_severity === "severe" || r.trigger_severity === "overwhelming",
  ).length;
  const ineffectiveCopingCount = records.filter(
    (r) => r.coping_effectiveness === "ineffective" || r.coping_effectiveness === "counterproductive",
  ).length;
  const activeCount = records.filter((r) => r.map_status === "active").length;
  const unreviewedCount = records.filter(
    (r) => r.map_status === "draft" || r.map_status === "under_review",
  ).length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof StaffTriggerMapRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.trigger_category] = (byCategory[r.trigger_category] ?? 0) + 1;

  const bySeverity: Record<string, number> = {};
  for (const r of records) bySeverity[r.trigger_severity] = (bySeverity[r.trigger_severity] ?? 0) + 1;

  const byCoping: Record<string, number> = {};
  for (const r of records) byCoping[r.coping_effectiveness] = (byCoping[r.coping_effectiveness] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.map_status] = (byStatus[r.map_status] ?? 0) + 1;

  return {
    total_maps: records.length,
    severe_count: severeCount,
    ineffective_coping_count: ineffectiveCopingCount,
    active_count: activeCount,
    unreviewed_count: unreviewedCount,
    evidence_documented_rate: boolRate("evidence_documented"),
    staff_involved_rate: boolRate("staff_involved"),
    triggers_explored_rate: boolRate("triggers_explored"),
    coping_strategies_rate: boolRate("coping_strategies_identified"),
    support_plan_linked_rate: boolRate("support_plan_linked"),
    environmental_factors_rate: boolRate("environmental_factors_considered"),
    supervision_adjusted_rate: boolRate("supervision_adjusted"),
    wellbeing_checked_rate: boolRate("wellbeing_checked"),
    manager_reviewed_rate: boolRate("manager_reviewed"),
    team_aware_rate: boolRate("team_aware_if_appropriate"),
    follow_up_rate: boolRate("follow_up_scheduled"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: new Set(records.map((r) => r.staff_name)).size,
    by_trigger_category: byCategory,
    by_trigger_severity: bySeverity,
    by_coping_effectiveness: byCoping,
    by_map_status: byStatus,
  };
}

// ── Alerts ──────────────────────────────────────────────────────────────

export function identifyTriggerMapAlerts(
  records: StaffTriggerMapRecord[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: severe/overwhelming + ineffective/counterproductive coping (per-record)
  for (const r of records) {
    if (
      (r.trigger_severity === "severe" || r.trigger_severity === "overwhelming") &&
      (r.coping_effectiveness === "ineffective" || r.coping_effectiveness === "counterproductive")
    ) {
      alerts.push({
        type: "severe_ineffective_coping",
        severity: "critical",
        message: `${r.staff_name} has a severe trigger with ineffective coping in ${r.trigger_category.replace(/_/g, " ")} — immediate support needed.`,
        record_id: r.id,
      });
    }
  }

  // High: staff not involved (>= 1)
  const notInvolved = records.filter((r) => r.staff_involved === false).length;
  if (notInvolved > 0) {
    alerts.push({
      type: "staff_not_involved",
      severity: "high",
      message: `${notInvolved} trigger map${notInvolved === 1 ? " has" : "s have"} staff not involved in the process.`,
    });
  }

  // High: no coping strategies (>= 1)
  const noCoping = records.filter((r) => r.coping_strategies_identified === false).length;
  if (noCoping > 0) {
    alerts.push({
      type: "no_coping_strategies",
      severity: "high",
      message: `${noCoping} trigger map${noCoping === 1 ? " has" : "s have"} no coping strategies identified.`,
    });
  }

  // Medium: no environmental factors considered (>= 2)
  const noEnvironmental = records.filter((r) => r.environmental_factors_considered === false).length;
  if (noEnvironmental >= 2) {
    alerts.push({
      type: "no_environmental_factors",
      severity: "medium",
      message: `${noEnvironmental} trigger maps have environmental factors not considered.`,
    });
  }

  // Medium: no wellbeing checked (>= 2)
  const noWellbeing = records.filter((r) => r.wellbeing_checked === false).length;
  if (noWellbeing >= 2) {
    alerts.push({
      type: "no_wellbeing_check",
      severity: "medium",
      message: `${noWellbeing} trigger maps have wellbeing not checked.`,
    });
  }

  return alerts;
}

// ── CRUD ────────────────────────────────────────────────────────────────

export async function listTriggerMaps(
  homeId: string,
): Promise<ServiceResult<StaffTriggerMapRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_trigger_maps") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffTriggerMapRecord[] };
}

export async function createTriggerMap(input: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  triggerCategory: TriggerCategory;
  triggerSeverity: TriggerSeverity;
  copingEffectiveness: CopingEffectiveness;
  mapStatus: MapStatus;
  sessionDate: string;
  identifiedBy: string;
  triggerDescription: string;
  contextWhenTriggered: string;
  observableResponse: string;
  impactOnPractice?: string | null;
  currentCopingStrategies?: string | null;
  supportStrategies?: string | null;
  environmentalAdjustments?: string | null;
  supervisionResponse?: string | null;
  staffSelfAwareness?: string | null;
  staffComment?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  evidenceDocumented: boolean;
  staffInvolved: boolean;
  triggersExplored: boolean;
  copingStrategiesIdentified: boolean;
  supportPlanLinked: boolean;
  environmentalFactorsConsidered: boolean;
  supervisionAdjusted: boolean;
  wellbeingChecked: boolean;
  managerReviewed: boolean;
  teamAwareIfAppropriate: boolean;
  followUpScheduled: boolean;
  recordedPromptly: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffTriggerMapRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_trigger_maps") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      trigger_category: input.triggerCategory,
      trigger_severity: input.triggerSeverity,
      coping_effectiveness: input.copingEffectiveness,
      map_status: input.mapStatus,
      session_date: input.sessionDate,
      identified_by: input.identifiedBy,
      trigger_description: input.triggerDescription,
      context_when_triggered: input.contextWhenTriggered,
      observable_response: input.observableResponse,
      impact_on_practice: input.impactOnPractice ?? null,
      current_coping_strategies: input.currentCopingStrategies ?? null,
      support_strategies: input.supportStrategies ?? null,
      environmental_adjustments: input.environmentalAdjustments ?? null,
      supervision_response: input.supervisionResponse ?? null,
      staff_self_awareness: input.staffSelfAwareness ?? null,
      staff_comment: input.staffComment ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      evidence_documented: input.evidenceDocumented,
      staff_involved: input.staffInvolved,
      triggers_explored: input.triggersExplored,
      coping_strategies_identified: input.copingStrategiesIdentified,
      support_plan_linked: input.supportPlanLinked,
      environmental_factors_considered: input.environmentalFactorsConsidered,
      supervision_adjusted: input.supervisionAdjusted,
      wellbeing_checked: input.wellbeingChecked,
      manager_reviewed: input.managerReviewed,
      team_aware_if_appropriate: input.teamAwareIfAppropriate,
      follow_up_scheduled: input.followUpScheduled,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffTriggerMapRecord };
}

export async function updateTriggerMap(
  id: string,
  updates: Partial<Omit<StaffTriggerMapRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffTriggerMapRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_trigger_maps") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffTriggerMapRecord };
}

// ── Testing export ─────────────────────────────────────────────────────

export const _testing = { computeTriggerMapMetrics, identifyTriggerMapAlerts };
