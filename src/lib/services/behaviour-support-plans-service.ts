// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR SUPPORT PLANS SERVICE
// Manages formal behaviour support plans (BSPs) for children, tracking
// strategies, triggers, de-escalation approaches, positive reinforcement,
// and plan reviews. Distinct from behaviour-service (incident recording).
// CHR 2015 Reg 19 (behaviour management — positive strategies),
// Reg 20 (restraint — proportionate responses),
// Reg 6 (quality and purpose of care — individual planning).
//
// Tracks BSP creation, strategies, review dates, child involvement,
// and effectiveness of behaviour support approaches.
//
// SCCIF: Overall Experiences — "Children are supported to manage
// their behaviour." "Behaviour support plans are individualised."
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

export type BspStatus =
  | "active"
  | "under_review"
  | "expired"
  | "draft"
  | "superseded";

export type StrategyCategory =
  | "preventive"
  | "de_escalation"
  | "positive_reinforcement"
  | "environmental_adjustment"
  | "communication_support"
  | "sensory_regulation"
  | "therapeutic"
  | "routine_structure"
  | "relationship_based"
  | "other";

export type TriggerCategory =
  | "transitions"
  | "sensory_overload"
  | "peer_conflict"
  | "contact_related"
  | "anxiety"
  | "frustration"
  | "unmet_need"
  | "change_of_routine"
  | "specific_time"
  | "unknown"
  | "other";

export type EffectivenessRating =
  | "highly_effective"
  | "effective"
  | "partially_effective"
  | "not_effective"
  | "not_yet_evaluated";

export interface BehaviourSupportPlan {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  bsp_status: BspStatus;
  created_date: string;
  review_date: string | null;
  next_review_date: string | null;
  created_by: string;
  reviewed_by: string | null;
  triggers: TriggerCategory[];
  trigger_details: string | null;
  strategies: StrategyCategory[];
  strategy_details: string | null;
  positive_reinforcements: string[];
  de_escalation_steps: string[];
  effectiveness_rating: EffectivenessRating;
  incidents_since_last_review: number;
  child_involved_in_plan: boolean;
  child_views: string | null;
  parent_informed: boolean;
  social_worker_approved: boolean;
  psychologist_input: boolean;
  staff_briefed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const BSP_STATUSES: { status: BspStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "under_review", label: "Under Review" },
  { status: "expired", label: "Expired" },
  { status: "draft", label: "Draft" },
  { status: "superseded", label: "Superseded" },
];

export const STRATEGY_CATEGORIES: { category: StrategyCategory; label: string }[] = [
  { category: "preventive", label: "Preventive" },
  { category: "de_escalation", label: "De-escalation" },
  { category: "positive_reinforcement", label: "Positive Reinforcement" },
  { category: "environmental_adjustment", label: "Environmental Adjustment" },
  { category: "communication_support", label: "Communication Support" },
  { category: "sensory_regulation", label: "Sensory Regulation" },
  { category: "therapeutic", label: "Therapeutic" },
  { category: "routine_structure", label: "Routine & Structure" },
  { category: "relationship_based", label: "Relationship-Based" },
  { category: "other", label: "Other" },
];

export const TRIGGER_CATEGORIES: { category: TriggerCategory; label: string }[] = [
  { category: "transitions", label: "Transitions" },
  { category: "sensory_overload", label: "Sensory Overload" },
  { category: "peer_conflict", label: "Peer Conflict" },
  { category: "contact_related", label: "Contact Related" },
  { category: "anxiety", label: "Anxiety" },
  { category: "frustration", label: "Frustration" },
  { category: "unmet_need", label: "Unmet Need" },
  { category: "change_of_routine", label: "Change of Routine" },
  { category: "specific_time", label: "Specific Time" },
  { category: "unknown", label: "Unknown" },
  { category: "other", label: "Other" },
];

export const EFFECTIVENESS_RATINGS: { rating: EffectivenessRating; label: string }[] = [
  { rating: "highly_effective", label: "Highly Effective" },
  { rating: "effective", label: "Effective" },
  { rating: "partially_effective", label: "Partially Effective" },
  { rating: "not_effective", label: "Not Effective" },
  { rating: "not_yet_evaluated", label: "Not Yet Evaluated" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeBspMetrics(
  plans: BehaviourSupportPlan[],
  totalChildren: number,
): {
  total_plans: number;
  active_plans: number;
  expired_plans: number;
  draft_plans: number;
  children_with_bsp: number;
  bsp_coverage: number;
  highly_effective_count: number;
  effective_count: number;
  not_effective_count: number;
  not_evaluated_count: number;
  child_involvement_rate: number;
  social_worker_approved_rate: number;
  psychologist_input_rate: number;
  staff_briefed_rate: number;
  parent_informed_rate: number;
  child_views_rate: number;
  average_incidents: number;
  by_bsp_status: Record<string, number>;
  by_strategy: Record<string, number>;
  by_trigger: Record<string, number>;
  by_effectiveness: Record<string, number>;
} {
  const activePlans = plans.filter((p) => p.bsp_status === "active").length;
  const expired = plans.filter((p) => p.bsp_status === "expired").length;
  const draft = plans.filter((p) => p.bsp_status === "draft").length;

  const uniqueChildren = new Set(plans.map((p) => p.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : 0;

  const highlyEffective = plans.filter((p) => p.effectiveness_rating === "highly_effective").length;
  const effective = plans.filter((p) => p.effectiveness_rating === "effective").length;
  const notEffective = plans.filter((p) => p.effectiveness_rating === "not_effective").length;
  const notEvaluated = plans.filter((p) => p.effectiveness_rating === "not_yet_evaluated").length;

  const childInvolved = plans.filter((p) => p.child_involved_in_plan).length;
  const childRate =
    plans.length > 0
      ? Math.round((childInvolved / plans.length) * 1000) / 10
      : 0;

  const swApproved = plans.filter((p) => p.social_worker_approved).length;
  const swRate =
    plans.length > 0
      ? Math.round((swApproved / plans.length) * 1000) / 10
      : 0;

  const psychInput = plans.filter((p) => p.psychologist_input).length;
  const psychRate =
    plans.length > 0
      ? Math.round((psychInput / plans.length) * 1000) / 10
      : 0;

  const staffBriefed = plans.filter((p) => p.staff_briefed).length;
  const staffRate =
    plans.length > 0
      ? Math.round((staffBriefed / plans.length) * 1000) / 10
      : 0;

  const parentInformed = plans.filter((p) => p.parent_informed).length;
  const parentRate =
    plans.length > 0
      ? Math.round((parentInformed / plans.length) * 1000) / 10
      : 0;

  const childViews = plans.filter((p) => p.child_views !== null).length;
  const viewsRate =
    plans.length > 0
      ? Math.round((childViews / plans.length) * 1000) / 10
      : 0;

  const totalIncidents = plans.reduce((sum, p) => sum + p.incidents_since_last_review, 0);
  const avgIncidents =
    plans.length > 0
      ? Math.round((totalIncidents / plans.length) * 10) / 10
      : 0;

  const byStatus: Record<string, number> = {};
  for (const p of plans) byStatus[p.bsp_status] = (byStatus[p.bsp_status] ?? 0) + 1;

  const byStrategy: Record<string, number> = {};
  for (const p of plans) {
    for (const s of p.strategies) byStrategy[s] = (byStrategy[s] ?? 0) + 1;
  }

  const byTrigger: Record<string, number> = {};
  for (const p of plans) {
    for (const t of p.triggers) byTrigger[t] = (byTrigger[t] ?? 0) + 1;
  }

  const byEffectiveness: Record<string, number> = {};
  for (const p of plans) byEffectiveness[p.effectiveness_rating] = (byEffectiveness[p.effectiveness_rating] ?? 0) + 1;

  return {
    total_plans: plans.length,
    active_plans: activePlans,
    expired_plans: expired,
    draft_plans: draft,
    children_with_bsp: uniqueChildren,
    bsp_coverage: coverage,
    highly_effective_count: highlyEffective,
    effective_count: effective,
    not_effective_count: notEffective,
    not_evaluated_count: notEvaluated,
    child_involvement_rate: childRate,
    social_worker_approved_rate: swRate,
    psychologist_input_rate: psychRate,
    staff_briefed_rate: staffRate,
    parent_informed_rate: parentRate,
    child_views_rate: viewsRate,
    average_incidents: avgIncidents,
    by_bsp_status: byStatus,
    by_strategy: byStrategy,
    by_trigger: byTrigger,
    by_effectiveness: byEffectiveness,
  };
}

export function identifyBspAlerts(
  plans: BehaviourSupportPlan[],
  totalChildren: number,
  now: Date = new Date(),
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

  // Not effective BSPs
  for (const p of plans) {
    if (p.effectiveness_rating === "not_effective" && p.bsp_status === "active") {
      alerts.push({
        type: "bsp_not_effective",
        severity: "critical",
        message: `${p.child_name}'s behaviour support plan rated not effective — urgent review and revision needed with specialist input`,
        id: p.id,
      });
    }
  }

  // Expired BSPs
  for (const p of plans) {
    if (p.bsp_status === "expired") {
      alerts.push({
        type: "bsp_expired",
        severity: "high",
        message: `${p.child_name}'s behaviour support plan has expired — review and renew or create updated plan`,
        id: p.id,
      });
    }
  }

  // Staff not briefed on active plan
  for (const p of plans) {
    if (!p.staff_briefed && p.bsp_status === "active") {
      alerts.push({
        type: "staff_not_briefed",
        severity: "high",
        message: `Staff not briefed on ${p.child_name}'s active behaviour support plan — brief all staff immediately`,
        id: p.id,
      });
    }
  }

  // Review overdue
  for (const p of plans) {
    if (p.next_review_date && new Date(p.next_review_date) < now && p.bsp_status === "active") {
      alerts.push({
        type: "review_overdue",
        severity: "medium",
        message: `Behaviour support plan review for ${p.child_name} overdue since ${p.next_review_date}`,
        id: p.id,
      });
    }
  }

  // Child not involved in plan
  for (const p of plans) {
    if (!p.child_involved_in_plan && p.bsp_status === "active") {
      alerts.push({
        type: "child_not_involved",
        severity: "medium",
        message: `${p.child_name} not involved in creating their behaviour support plan — Reg 7 requires children's participation`,
        id: p.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listPlans(
  homeId: string,
  filters?: {
    childId?: string;
    bspStatus?: BspStatus;
    effectivenessRating?: EffectivenessRating;
    limit?: number;
  },
): Promise<ServiceResult<BehaviourSupportPlan[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_behaviour_support_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.bspStatus) q = q.eq("bsp_status", filters.bspStatus);
  if (filters?.effectivenessRating) q = q.eq("effectiveness_rating", filters.effectivenessRating);
  q = q.order("created_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPlan(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    bspStatus: BspStatus;
    createdDate: string;
    reviewDate?: string;
    nextReviewDate?: string;
    createdBy: string;
    reviewedBy?: string;
    triggers: TriggerCategory[];
    triggerDetails?: string;
    strategies: StrategyCategory[];
    strategyDetails?: string;
    positiveReinforcements: string[];
    deEscalationSteps: string[];
    effectivenessRating: EffectivenessRating;
    incidentsSinceLastReview: number;
    childInvolvedInPlan: boolean;
    childViews?: string;
    parentInformed: boolean;
    socialWorkerApproved: boolean;
    psychologistInput: boolean;
    staffBriefed: boolean;
    notes?: string;
  },
): Promise<ServiceResult<BehaviourSupportPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_behaviour_support_plans") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      bsp_status: input.bspStatus,
      created_date: input.createdDate,
      review_date: input.reviewDate ?? null,
      next_review_date: input.nextReviewDate ?? null,
      created_by: input.createdBy,
      reviewed_by: input.reviewedBy ?? null,
      triggers: input.triggers,
      trigger_details: input.triggerDetails ?? null,
      strategies: input.strategies,
      strategy_details: input.strategyDetails ?? null,
      positive_reinforcements: input.positiveReinforcements,
      de_escalation_steps: input.deEscalationSteps,
      effectiveness_rating: input.effectivenessRating,
      incidents_since_last_review: input.incidentsSinceLastReview,
      child_involved_in_plan: input.childInvolvedInPlan,
      child_views: input.childViews ?? null,
      parent_informed: input.parentInformed,
      social_worker_approved: input.socialWorkerApproved,
      psychologist_input: input.psychologistInput,
      staff_briefed: input.staffBriefed,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePlan(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<BehaviourSupportPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_behaviour_support_plans") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeBspMetrics,
  identifyBspAlerts,
};
