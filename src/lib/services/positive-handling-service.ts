// ══════════════════════════════════════════════════════════════════════════════
// CARA — POSITIVE HANDLING SERVICE
// Tracks positive handling plans and de-escalation strategies for children
// requiring physical intervention support. Ensures proportionate,
// planned approaches to managing challenging behaviour safely.
// CHR 2015 Reg 19 (behaviour management — positive handling plans),
// Reg 20 (restraint — planned interventions),
// Reg 12 (health and wellbeing — emotional safety).
//
// Covers: positive handling plans, de-escalation strategies, trigger
// identification, calming techniques, physical intervention thresholds,
// post-incident support, and regular plan reviews.
//
// SCCIF: Safety — "Positive handling plans are individualised."
// "De-escalation is prioritised over physical intervention."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type PlanType =
  | "positive_handling_plan"
  | "de_escalation_strategy"
  | "behaviour_support_plan"
  | "crisis_intervention_plan"
  | "risk_reduction_plan"
  | "calming_strategy"
  | "sensory_regulation"
  | "communication_passport"
  | "transition_support"
  | "other";

export type ReviewOutcome =
  | "plan_effective"
  | "plan_partially_effective"
  | "plan_needs_revision"
  | "plan_no_longer_needed"
  | "escalation_required";

export type TriggerCategory =
  | "environmental"
  | "emotional"
  | "social"
  | "sensory"
  | "communication"
  | "transition"
  | "demand"
  | "health_related"
  | "trauma_related"
  | "other";

export type InterventionLevel =
  | "verbal_de_escalation"
  | "distraction_redirect"
  | "planned_ignoring"
  | "physical_proximity"
  | "guided_away";

export interface PositiveHandlingRecord {
  id: string;
  home_id: string;
  plan_type: PlanType;
  review_outcome: ReviewOutcome;
  trigger_category: TriggerCategory;
  intervention_level: InterventionLevel;
  review_date: string;
  child_name: string;
  child_id: string | null;
  /** Tri-state judgements/observations: null = not recorded. Absence is never
   *  an answer. */
  triggers_identified: boolean | null;
  early_warning_signs: boolean | null;
  de_escalation_steps: boolean | null;
  calming_strategies: boolean | null;
  staff_trained: boolean | null;
  child_consulted: boolean | null;
  parent_informed: boolean | null;
  social_worker_informed: boolean | null;
  plan_accessible: boolean | null;
  regularly_reviewed: boolean | null;
  post_incident_support: boolean | null;
  medication_considered: boolean;
  issues_found: string[];
  actions_taken: string[];
  reviewed_by: string;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PLAN_TYPES: { type: PlanType; label: string }[] = [
  { type: "positive_handling_plan", label: "Positive Handling Plan" },
  { type: "de_escalation_strategy", label: "De-Escalation Strategy" },
  { type: "behaviour_support_plan", label: "Behaviour Support Plan" },
  { type: "crisis_intervention_plan", label: "Crisis Intervention Plan" },
  { type: "risk_reduction_plan", label: "Risk Reduction Plan" },
  { type: "calming_strategy", label: "Calming Strategy" },
  { type: "sensory_regulation", label: "Sensory Regulation" },
  { type: "communication_passport", label: "Communication Passport" },
  { type: "transition_support", label: "Transition Support" },
  { type: "other", label: "Other" },
];

export const REVIEW_OUTCOMES: { outcome: ReviewOutcome; label: string }[] = [
  { outcome: "plan_effective", label: "Plan Effective" },
  { outcome: "plan_partially_effective", label: "Partially Effective" },
  { outcome: "plan_needs_revision", label: "Needs Revision" },
  { outcome: "plan_no_longer_needed", label: "No Longer Needed" },
  { outcome: "escalation_required", label: "Escalation Required" },
];

export const TRIGGER_CATEGORIES: { category: TriggerCategory; label: string }[] = [
  { category: "environmental", label: "Environmental" },
  { category: "emotional", label: "Emotional" },
  { category: "social", label: "Social" },
  { category: "sensory", label: "Sensory" },
  { category: "communication", label: "Communication" },
  { category: "transition", label: "Transition" },
  { category: "demand", label: "Demand" },
  { category: "health_related", label: "Health Related" },
  { category: "trauma_related", label: "Trauma Related" },
  { category: "other", label: "Other" },
];

export const INTERVENTION_LEVELS: { level: InterventionLevel; label: string }[] = [
  { level: "verbal_de_escalation", label: "Verbal De-Escalation" },
  { level: "distraction_redirect", label: "Distraction/Redirect" },
  { level: "planned_ignoring", label: "Planned Ignoring" },
  { level: "physical_proximity", label: "Physical Proximity" },
  { level: "guided_away", label: "Guided Away" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePositiveHandlingMetrics(
  records: PositiveHandlingRecord[],
): {
  total_reviews: number;
  effective_count: number;
  needs_revision_count: number;
  escalation_required_count: number;
  triggers_identified_rate: number | null;
  early_warning_rate: number | null;
  de_escalation_rate: number | null;
  calming_strategies_rate: number | null;
  staff_trained_rate: number | null;
  child_consulted_rate: number | null;
  parent_informed_rate: number | null;
  social_worker_informed_rate: number | null;
  plan_accessible_rate: number | null;
  regularly_reviewed_rate: number | null;
  post_incident_support_rate: number | null;
  unique_children: number;
  by_plan_type: Record<string, number>;
  by_review_outcome: Record<string, number>;
  by_trigger_category: Record<string, number>;
  by_intervention_level: Record<string, number>;
} {
  const effective = records.filter((r) => r.review_outcome === "plan_effective").length;
  const needsRevision = records.filter((r) => r.review_outcome === "plan_needs_revision").length;
  const escalation = records.filter((r) => r.review_outcome === "escalation_required").length;

  const boolRate = (field: keyof PositiveHandlingRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.plan_type] = (byType[r.plan_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.review_outcome] = (byOutcome[r.review_outcome] ?? 0) + 1;

  const byTrigger: Record<string, number> = {};
  for (const r of records) byTrigger[r.trigger_category] = (byTrigger[r.trigger_category] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.intervention_level] = (byLevel[r.intervention_level] ?? 0) + 1;

  return {
    total_reviews: records.length,
    effective_count: effective,
    needs_revision_count: needsRevision,
    escalation_required_count: escalation,
    triggers_identified_rate: boolRate("triggers_identified"),
    early_warning_rate: boolRate("early_warning_signs"),
    de_escalation_rate: boolRate("de_escalation_steps"),
    calming_strategies_rate: boolRate("calming_strategies"),
    staff_trained_rate: boolRate("staff_trained"),
    child_consulted_rate: boolRate("child_consulted"),
    parent_informed_rate: boolRate("parent_informed"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    plan_accessible_rate: boolRate("plan_accessible"),
    regularly_reviewed_rate: boolRate("regularly_reviewed"),
    post_incident_support_rate: boolRate("post_incident_support"),
    unique_children: uniqueChildren,
    by_plan_type: byType,
    by_review_outcome: byOutcome,
    by_trigger_category: byTrigger,
    by_intervention_level: byLevel,
  };
}

export function identifyPositiveHandlingAlerts(
  records: PositiveHandlingRecord[],
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

  // Escalation required without staff trained
  for (const r of records) {
    // When escalation is required, unrecorded training is itself the critical
    // gap — worded as a gap, not an asserted failure.
    if (r.review_outcome === "escalation_required" && r.staff_trained !== true) {
      alerts.push({
        type: "escalation_untrained",
        severity: "critical",
        message: r.staff_trained === false
          ? `Escalation required for ${r.child_name} on ${r.review_date} — staff not trained on plan`
          : `Escalation required for ${r.child_name} on ${r.review_date} — no training status recorded, evidence it now`,
        id: r.id,
      });
    }
  }

  // De-escalation steps not documented
  const noDeEsc = records.filter((r) => r.de_escalation_steps === false).length;
  if (noDeEsc >= 1) {
    alerts.push({
      type: "no_de_escalation",
      severity: "high",
      message: `${noDeEsc} ${noDeEsc === 1 ? "plan has" : "plans have"} no de-escalation steps documented — essential for safe practice`,
      id: "no_de_escalation",
    });
  }

  // Child not consulted
  const notConsulted = records.filter((r) => r.child_consulted === false).length;
  if (notConsulted >= 1) {
    alerts.push({
      type: "child_not_consulted",
      severity: "high",
      message: `${notConsulted} ${notConsulted === 1 ? "plan has" : "plans have"} child not consulted — involve children in their plans`,
      id: "child_not_consulted",
    });
  }

  // Plan not accessible
  const notAccessible = records.filter((r) => r.plan_accessible === false).length;
  if (notAccessible >= 2) {
    alerts.push({
      type: "plan_not_accessible",
      severity: "medium",
      message: `${notAccessible} plans not accessible to staff — ensure availability`,
      id: "plan_not_accessible",
    });
  }

  // Not regularly reviewed
  const notReviewed = records.filter((r) => r.regularly_reviewed === false).length;
  if (notReviewed >= 2) {
    alerts.push({
      type: "not_regularly_reviewed",
      severity: "medium",
      message: `${notReviewed} plans not regularly reviewed — schedule reviews`,
      id: "not_regularly_reviewed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    planType?: PlanType;
    reviewOutcome?: ReviewOutcome;
    triggerCategory?: TriggerCategory;
    interventionLevel?: InterventionLevel;
    limit?: number;
  },
): Promise<ServiceResult<PositiveHandlingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_positive_handling") as SB).select("*").eq("home_id", homeId);
  if (filters?.planType) q = q.eq("plan_type", filters.planType);
  if (filters?.reviewOutcome) q = q.eq("review_outcome", filters.reviewOutcome);
  if (filters?.triggerCategory) q = q.eq("trigger_category", filters.triggerCategory);
  if (filters?.interventionLevel) q = q.eq("intervention_level", filters.interventionLevel);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    planType: PlanType;
    reviewOutcome: ReviewOutcome;
    triggerCategory: TriggerCategory;
    interventionLevel: InterventionLevel;
    reviewDate: string;
    childName: string;
    childId?: string | null;
    triggersIdentified?: boolean;
    earlyWarningSigns?: boolean;
    deEscalationSteps?: boolean;
    calmingStrategies?: boolean;
    staffTrained?: boolean;
    childConsulted?: boolean;
    parentInformed?: boolean;
    socialWorkerInformed?: boolean;
    planAccessible?: boolean;
    regularlyReviewed?: boolean;
    postIncidentSupport?: boolean;
    medicationConsidered?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    reviewedBy: string;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<PositiveHandlingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_positive_handling") as SB)
    .insert({
      home_id: payload.homeId,
      plan_type: payload.planType,
      review_outcome: payload.reviewOutcome,
      trigger_category: payload.triggerCategory,
      intervention_level: payload.interventionLevel,
      review_date: payload.reviewDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      triggers_identified: payload.triggersIdentified ?? null,
      early_warning_signs: payload.earlyWarningSigns ?? null,
      de_escalation_steps: payload.deEscalationSteps ?? null,
      calming_strategies: payload.calmingStrategies ?? null,
      staff_trained: payload.staffTrained ?? null,
      child_consulted: payload.childConsulted ?? null,
      parent_informed: payload.parentInformed ?? null,
      social_worker_informed: payload.socialWorkerInformed ?? null,
      plan_accessible: payload.planAccessible ?? null,
      regularly_reviewed: payload.regularlyReviewed ?? null,
      post_incident_support: payload.postIncidentSupport ?? null,
      medication_considered: payload.medicationConsidered ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      reviewed_by: payload.reviewedBy,
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
    planType: PlanType;
    reviewOutcome: ReviewOutcome;
    triggerCategory: TriggerCategory;
    interventionLevel: InterventionLevel;
    reviewDate: string;
    childName: string;
    childId: string | null;
    triggersIdentified: boolean;
    earlyWarningSigns: boolean;
    deEscalationSteps: boolean;
    calmingStrategies: boolean;
    staffTrained: boolean;
    childConsulted: boolean;
    parentInformed: boolean;
    socialWorkerInformed: boolean;
    planAccessible: boolean;
    regularlyReviewed: boolean;
    postIncidentSupport: boolean;
    medicationConsidered: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    reviewedBy: string;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<PositiveHandlingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.planType !== undefined) mapped.plan_type = updates.planType;
  if (updates.reviewOutcome !== undefined) mapped.review_outcome = updates.reviewOutcome;
  if (updates.triggerCategory !== undefined) mapped.trigger_category = updates.triggerCategory;
  if (updates.interventionLevel !== undefined) mapped.intervention_level = updates.interventionLevel;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.triggersIdentified !== undefined) mapped.triggers_identified = updates.triggersIdentified;
  if (updates.earlyWarningSigns !== undefined) mapped.early_warning_signs = updates.earlyWarningSigns;
  if (updates.deEscalationSteps !== undefined) mapped.de_escalation_steps = updates.deEscalationSteps;
  if (updates.calmingStrategies !== undefined) mapped.calming_strategies = updates.calmingStrategies;
  if (updates.staffTrained !== undefined) mapped.staff_trained = updates.staffTrained;
  if (updates.childConsulted !== undefined) mapped.child_consulted = updates.childConsulted;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.planAccessible !== undefined) mapped.plan_accessible = updates.planAccessible;
  if (updates.regularlyReviewed !== undefined) mapped.regularly_reviewed = updates.regularlyReviewed;
  if (updates.postIncidentSupport !== undefined) mapped.post_incident_support = updates.postIncidentSupport;
  if (updates.medicationConsidered !== undefined) mapped.medication_considered = updates.medicationConsidered;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.reviewedBy !== undefined) mapped.reviewed_by = updates.reviewedBy;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_positive_handling") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePositiveHandlingMetrics,
  identifyPositiveHandlingAlerts,
};
