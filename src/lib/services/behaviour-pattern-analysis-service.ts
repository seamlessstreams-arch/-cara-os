// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR PATTERN ANALYSIS SERVICE
// Monitors behaviour trends, triggers, de-escalation effectiveness,
// and proactive intervention strategies.
// CHR 2015 Reg 19 (behaviour management — positive strategies),
// Reg 20 (restraint — as last resort only).
//
// Covers: behaviour category, trigger type, intervention outcome,
// severity level, and de-escalation effectiveness.
//
// SCCIF: Safety — "Behaviour is understood and responded to positively."
// "Patterns are identified and proactively managed."
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

export type BehaviourCategory =
  | "verbal_aggression"
  | "physical_aggression"
  | "self_harm"
  | "property_damage"
  | "absconding"
  | "substance_use"
  | "sexualised_behaviour"
  | "withdrawal"
  | "defiance"
  | "other";

export type TriggerType =
  | "contact_related"
  | "peer_conflict"
  | "staff_interaction"
  | "routine_change"
  | "sensory_overload"
  | "anxiety"
  | "trauma_response"
  | "unmet_need"
  | "unknown"
  | "other";

export type InterventionOutcome =
  | "de_escalated"
  | "partially_resolved"
  | "required_restraint"
  | "required_separation"
  | "self_resolved";

export type BehaviourSeverity =
  | "low"
  | "moderate"
  | "high"
  | "severe"
  | "critical";

export interface BehaviourPatternAnalysisRecord {
  id: string;
  home_id: string;
  behaviour_category: BehaviourCategory;
  trigger_type: TriggerType;
  intervention_outcome: InterventionOutcome;
  behaviour_severity: BehaviourSeverity;
  incident_date: string;
  child_name: string;
  child_id: string | null;
  staff_involved: string;
  trigger_identified: boolean;
  de_escalation_attempted: boolean;
  child_views_sought: boolean;
  debrief_completed: boolean;
  pattern_identified: boolean;
  care_plan_updated: boolean;
  risk_assessment_updated: boolean;
  positive_strategies_used: boolean;
  therapeutic_input_considered: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const BEHAVIOUR_CATEGORIES: { category: BehaviourCategory; label: string }[] = [
  { category: "verbal_aggression", label: "Verbal Aggression" },
  { category: "physical_aggression", label: "Physical Aggression" },
  { category: "self_harm", label: "Self-Harm" },
  { category: "property_damage", label: "Property Damage" },
  { category: "absconding", label: "Absconding" },
  { category: "substance_use", label: "Substance Use" },
  { category: "sexualised_behaviour", label: "Sexualised Behaviour" },
  { category: "withdrawal", label: "Withdrawal" },
  { category: "defiance", label: "Defiance" },
  { category: "other", label: "Other" },
];

export const TRIGGER_TYPES: { trigger: TriggerType; label: string }[] = [
  { trigger: "contact_related", label: "Contact Related" },
  { trigger: "peer_conflict", label: "Peer Conflict" },
  { trigger: "staff_interaction", label: "Staff Interaction" },
  { trigger: "routine_change", label: "Routine Change" },
  { trigger: "sensory_overload", label: "Sensory Overload" },
  { trigger: "anxiety", label: "Anxiety" },
  { trigger: "trauma_response", label: "Trauma Response" },
  { trigger: "unmet_need", label: "Unmet Need" },
  { trigger: "unknown", label: "Unknown" },
  { trigger: "other", label: "Other" },
];

export const INTERVENTION_OUTCOMES: { outcome: InterventionOutcome; label: string }[] = [
  { outcome: "de_escalated", label: "De-Escalated" },
  { outcome: "partially_resolved", label: "Partially Resolved" },
  { outcome: "required_restraint", label: "Required Restraint" },
  { outcome: "required_separation", label: "Required Separation" },
  { outcome: "self_resolved", label: "Self-Resolved" },
];

export const BEHAVIOUR_SEVERITIES: { severity: BehaviourSeverity; label: string }[] = [
  { severity: "low", label: "Low" },
  { severity: "moderate", label: "Moderate" },
  { severity: "high", label: "High" },
  { severity: "severe", label: "Severe" },
  { severity: "critical", label: "Critical" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeBehaviourPatternMetrics(
  records: BehaviourPatternAnalysisRecord[],
): {
  total_incidents: number;
  severe_count: number;
  critical_count: number;
  restraint_count: number;
  unknown_trigger_count: number;
  trigger_identified_rate: number;
  de_escalation_rate: number;
  child_views_rate: number;
  debrief_rate: number;
  pattern_identified_rate: number;
  care_plan_rate: number;
  risk_assessment_rate: number;
  positive_strategies_rate: number;
  therapeutic_input_rate: number;
  social_worker_rate: number;
  parent_informed_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_behaviour_category: Record<string, number>;
  by_trigger_type: Record<string, number>;
  by_intervention_outcome: Record<string, number>;
  by_behaviour_severity: Record<string, number>;
} {
  const severe = records.filter((r) => r.behaviour_severity === "severe").length;
  const critical = records.filter((r) => r.behaviour_severity === "critical").length;
  const restraint = records.filter((r) => r.intervention_outcome === "required_restraint").length;
  const unknownTrigger = records.filter((r) => r.trigger_type === "unknown").length;

  const boolRate = (field: keyof BehaviourPatternAnalysisRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.behaviour_category] = (byCategory[r.behaviour_category] ?? 0) + 1;

  const byTrigger: Record<string, number> = {};
  for (const r of records) byTrigger[r.trigger_type] = (byTrigger[r.trigger_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.intervention_outcome] = (byOutcome[r.intervention_outcome] ?? 0) + 1;

  const bySeverity: Record<string, number> = {};
  for (const r of records) bySeverity[r.behaviour_severity] = (bySeverity[r.behaviour_severity] ?? 0) + 1;

  return {
    total_incidents: records.length,
    severe_count: severe,
    critical_count: critical,
    restraint_count: restraint,
    unknown_trigger_count: unknownTrigger,
    trigger_identified_rate: boolRate("trigger_identified"),
    de_escalation_rate: boolRate("de_escalation_attempted"),
    child_views_rate: boolRate("child_views_sought"),
    debrief_rate: boolRate("debrief_completed"),
    pattern_identified_rate: boolRate("pattern_identified"),
    care_plan_rate: boolRate("care_plan_updated"),
    risk_assessment_rate: boolRate("risk_assessment_updated"),
    positive_strategies_rate: boolRate("positive_strategies_used"),
    therapeutic_input_rate: boolRate("therapeutic_input_considered"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_behaviour_category: byCategory,
    by_trigger_type: byTrigger,
    by_intervention_outcome: byOutcome,
    by_behaviour_severity: bySeverity,
  };
}

export function identifyBehaviourPatternAlerts(
  records: BehaviourPatternAnalysisRecord[],
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

  // Restraint without de-escalation attempt — per-record
  for (const r of records) {
    if (r.intervention_outcome === "required_restraint" && !r.de_escalation_attempted) {
      alerts.push({
        type: "restraint_no_deescalation",
        severity: "critical",
        message: `${r.child_name} restrained without de-escalation attempt on ${r.incident_date} — review Reg 20 compliance`,
        id: r.id,
      });
    }
  }

  // Child not debriefed
  const noDebrief = records.filter((r) => !r.debrief_completed).length;
  if (noDebrief >= 1) {
    alerts.push({
      type: "debrief_not_completed",
      severity: "high",
      message: `${noDebrief} ${noDebrief === 1 ? "incident has" : "incidents have"} no debrief completed — ensure emotional support`,
      id: "debrief_not_completed",
    });
  }

  // Positive strategies not used
  const noPositive = records.filter((r) => !r.positive_strategies_used).length;
  if (noPositive >= 1) {
    alerts.push({
      type: "positive_strategies_not_used",
      severity: "high",
      message: `${noPositive} ${noPositive === 1 ? "incident has" : "incidents have"} no positive strategies used — review behaviour management approach`,
      id: "positive_strategies_not_used",
    });
  }

  // Pattern not identified
  const noPattern = records.filter((r) => !r.pattern_identified).length;
  if (noPattern >= 2) {
    alerts.push({
      type: "pattern_not_identified",
      severity: "medium",
      message: `${noPattern} incidents without pattern identification — strengthen proactive analysis`,
      id: "pattern_not_identified",
    });
  }

  // Risk assessment not updated
  const noRisk = records.filter((r) => !r.risk_assessment_updated).length;
  if (noRisk >= 2) {
    alerts.push({
      type: "risk_not_updated",
      severity: "medium",
      message: `${noRisk} incidents without risk assessment update — ensure dynamic assessment`,
      id: "risk_not_updated",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    behaviourCategory?: BehaviourCategory;
    triggerType?: TriggerType;
    interventionOutcome?: InterventionOutcome;
    behaviourSeverity?: BehaviourSeverity;
    limit?: number;
  },
): Promise<ServiceResult<BehaviourPatternAnalysisRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_behaviour_pattern_analysis") as SB).select("*").eq("home_id", homeId);
  if (filters?.behaviourCategory) q = q.eq("behaviour_category", filters.behaviourCategory);
  if (filters?.triggerType) q = q.eq("trigger_type", filters.triggerType);
  if (filters?.interventionOutcome) q = q.eq("intervention_outcome", filters.interventionOutcome);
  if (filters?.behaviourSeverity) q = q.eq("behaviour_severity", filters.behaviourSeverity);
  q = q.order("incident_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    behaviourCategory: BehaviourCategory;
    triggerType: TriggerType;
    interventionOutcome: InterventionOutcome;
    behaviourSeverity: BehaviourSeverity;
    incidentDate: string;
    childName: string;
    childId?: string | null;
    staffInvolved: string;
    triggerIdentified?: boolean;
    deEscalationAttempted?: boolean;
    childViewsSought?: boolean;
    debriefCompleted?: boolean;
    patternIdentified?: boolean;
    carePlanUpdated?: boolean;
    riskAssessmentUpdated?: boolean;
    positiveStrategiesUsed?: boolean;
    therapeuticInputConsidered?: boolean;
    socialWorkerInformed?: boolean;
    parentInformed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<BehaviourPatternAnalysisRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_behaviour_pattern_analysis") as SB)
    .insert({
      home_id: payload.homeId,
      behaviour_category: payload.behaviourCategory,
      trigger_type: payload.triggerType,
      intervention_outcome: payload.interventionOutcome,
      behaviour_severity: payload.behaviourSeverity,
      incident_date: payload.incidentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      staff_involved: payload.staffInvolved,
      trigger_identified: payload.triggerIdentified ?? true,
      de_escalation_attempted: payload.deEscalationAttempted ?? true,
      child_views_sought: payload.childViewsSought ?? true,
      debrief_completed: payload.debriefCompleted ?? true,
      pattern_identified: payload.patternIdentified ?? true,
      care_plan_updated: payload.carePlanUpdated ?? true,
      risk_assessment_updated: payload.riskAssessmentUpdated ?? true,
      positive_strategies_used: payload.positiveStrategiesUsed ?? true,
      therapeutic_input_considered: payload.therapeuticInputConsidered ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? true,
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
    behaviourCategory: BehaviourCategory;
    triggerType: TriggerType;
    interventionOutcome: InterventionOutcome;
    behaviourSeverity: BehaviourSeverity;
    incidentDate: string;
    childName: string;
    childId: string | null;
    staffInvolved: string;
    triggerIdentified: boolean;
    deEscalationAttempted: boolean;
    childViewsSought: boolean;
    debriefCompleted: boolean;
    patternIdentified: boolean;
    carePlanUpdated: boolean;
    riskAssessmentUpdated: boolean;
    positiveStrategiesUsed: boolean;
    therapeuticInputConsidered: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<BehaviourPatternAnalysisRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.behaviourCategory !== undefined) mapped.behaviour_category = updates.behaviourCategory;
  if (updates.triggerType !== undefined) mapped.trigger_type = updates.triggerType;
  if (updates.interventionOutcome !== undefined) mapped.intervention_outcome = updates.interventionOutcome;
  if (updates.behaviourSeverity !== undefined) mapped.behaviour_severity = updates.behaviourSeverity;
  if (updates.incidentDate !== undefined) mapped.incident_date = updates.incidentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.staffInvolved !== undefined) mapped.staff_involved = updates.staffInvolved;
  if (updates.triggerIdentified !== undefined) mapped.trigger_identified = updates.triggerIdentified;
  if (updates.deEscalationAttempted !== undefined) mapped.de_escalation_attempted = updates.deEscalationAttempted;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.debriefCompleted !== undefined) mapped.debrief_completed = updates.debriefCompleted;
  if (updates.patternIdentified !== undefined) mapped.pattern_identified = updates.patternIdentified;
  if (updates.carePlanUpdated !== undefined) mapped.care_plan_updated = updates.carePlanUpdated;
  if (updates.riskAssessmentUpdated !== undefined) mapped.risk_assessment_updated = updates.riskAssessmentUpdated;
  if (updates.positiveStrategiesUsed !== undefined) mapped.positive_strategies_used = updates.positiveStrategiesUsed;
  if (updates.therapeuticInputConsidered !== undefined) mapped.therapeutic_input_considered = updates.therapeuticInputConsidered;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_behaviour_pattern_analysis") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeBehaviourPatternMetrics,
  identifyBehaviourPatternAlerts,
};
