// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE PLANNING SERVICE
// Manages care plans, statutory reviews, placement plans, and care plan
// objectives tracking for every child in the home.
// CHR 2015 Reg 14 (care planning — placement plan must address child's
// needs identified in the care plan).
// Reg 6 (quality and purpose of care — meeting needs set out in plans).
//
// Tracks care plan currency, review dates, objectives progress,
// and ensures all statutory timescales are met.
//
// SCCIF: Experiences and Progress — "Children's care plans are clear
// and effective." "Plans reflect children's individual needs and are
// reviewed regularly."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { londonDayDiff } from "@/lib/utils";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type PlanType =
  | "care_plan"
  | "placement_plan"
  | "pathway_plan"
  | "personal_education_plan"
  | "health_care_plan"
  | "behaviour_support_plan"
  | "risk_management_plan"
  | "missing_protocol"
  | "safe_care_plan"
  | "therapeutic_plan"
  | "other";

export type PlanStatus =
  | "current"
  | "under_review"
  | "overdue_review"
  | "draft"
  | "superseded"
  | "archived";

export type ObjectiveStatus =
  | "not_started"
  | "in_progress"
  | "on_track"
  | "at_risk"
  | "completed"
  | "not_achieved";

export type ReviewType =
  | "lac_review"
  | "placement_plan_review"
  | "pep_review"
  | "health_review"
  | "internal_review"
  | "other";

export type ReviewOutcome =
  | "plan_unchanged"
  | "plan_amended"
  | "plan_rewritten"
  | "placement_confirmed"
  | "placement_change"
  | "escalation_required";

export interface CarePlan {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  plan_type: PlanType;
  status: PlanStatus;
  start_date: string;
  next_review_date: string;
  last_reviewed_date: string | null;
  social_worker: string;
  key_worker: string;
  objectives_count: number;
  objectives_completed: number;
  objectives_at_risk: number;
  created_at: string;
  updated_at: string;
}

export interface PlanObjective {
  id: string;
  home_id: string;
  plan_id: string;
  child_id: string;
  child_name: string;
  objective: string;
  target_date: string;
  status: ObjectiveStatus;
  responsible_person: string;
  progress_notes: string[];
  evidence: string[];
  date_completed: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanReview {
  id: string;
  home_id: string;
  plan_id: string;
  child_id: string;
  child_name: string;
  review_type: ReviewType;
  review_date: string;
  chaired_by: string;
  attendees: string[];
  child_participated: boolean;
  child_views_recorded: boolean;
  outcome: ReviewOutcome;
  actions: string[];
  next_review_date: string;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PLAN_TYPES: { type: PlanType; label: string }[] = [
  { type: "care_plan", label: "Care Plan" },
  { type: "placement_plan", label: "Placement Plan" },
  { type: "pathway_plan", label: "Pathway Plan" },
  { type: "personal_education_plan", label: "Personal Education Plan" },
  { type: "health_care_plan", label: "Health Care Plan" },
  { type: "behaviour_support_plan", label: "Behaviour Support Plan" },
  { type: "risk_management_plan", label: "Risk Management Plan" },
  { type: "missing_protocol", label: "Missing Protocol" },
  { type: "safe_care_plan", label: "Safe Care Plan" },
  { type: "therapeutic_plan", label: "Therapeutic Plan" },
  { type: "other", label: "Other" },
];

export const PLAN_STATUSES: { status: PlanStatus; label: string }[] = [
  { status: "current", label: "Current" },
  { status: "under_review", label: "Under Review" },
  { status: "overdue_review", label: "Overdue Review" },
  { status: "draft", label: "Draft" },
  { status: "superseded", label: "Superseded" },
  { status: "archived", label: "Archived" },
];

export const OBJECTIVE_STATUSES: { status: ObjectiveStatus; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "on_track", label: "On Track" },
  { status: "at_risk", label: "At Risk" },
  { status: "completed", label: "Completed" },
  { status: "not_achieved", label: "Not Achieved" },
];

export const REVIEW_TYPES: { type: ReviewType; label: string }[] = [
  { type: "lac_review", label: "LAC Review" },
  { type: "placement_plan_review", label: "Placement Plan Review" },
  { type: "pep_review", label: "PEP Review" },
  { type: "health_review", label: "Health Review" },
  { type: "internal_review", label: "Internal Review" },
  { type: "other", label: "Other" },
];

export const REVIEW_OUTCOMES: { outcome: ReviewOutcome; label: string }[] = [
  { outcome: "plan_unchanged", label: "Plan Unchanged" },
  { outcome: "plan_amended", label: "Plan Amended" },
  { outcome: "plan_rewritten", label: "Plan Rewritten" },
  { outcome: "placement_confirmed", label: "Placement Confirmed" },
  { outcome: "placement_change", label: "Placement Change" },
  { outcome: "escalation_required", label: "Escalation Required" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute care planning metrics.
 */
export function computeCarePlanMetrics(
  plans: CarePlan[],
  objectives: PlanObjective[],
  reviews: PlanReview[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_plans: number;
  current_plans: number;
  overdue_reviews: number;
  reviews_due_soon: number;
  children_with_plans: number;
  plan_coverage_rate: number | null;
  total_objectives: number;
  objectives_completed: number;
  objectives_at_risk: number;
  objective_completion_rate: number | null;
  reviews_this_quarter: number;
  child_participation_rate: number | null;
  by_plan_type: Record<string, number>;
  by_plan_status: Record<string, number>;
  by_review_outcome: Record<string, number>;
} {
  const fourteenDaysFromNow = new Date(now);
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Active plans (current, under_review, overdue_review, draft)
  const activePlans = plans.filter(
    (p) => p.status !== "superseded" && p.status !== "archived",
  );
  const currentPlans = plans.filter((p) => p.status === "current").length;

  // Overdue reviews
  const overdueReviews = activePlans.filter(
    (p) => new Date(p.next_review_date) < now,
  ).length;

  // Reviews due in next 14 days
  const reviewsDueSoon = activePlans.filter(
    (p) => {
      const reviewDate = new Date(p.next_review_date);
      return reviewDate >= now && reviewDate <= fourteenDaysFromNow;
    },
  ).length;

  // Plan coverage
  const childrenWithPlans = new Set(activePlans.map((p) => p.child_id)).size;
  const planCoverageRate =
    totalChildren > 0
      ? Math.round((childrenWithPlans / totalChildren) * 1000) / 10
      : null;

  const completedObjectives = objectives.filter((o) => o.status === "completed").length;
  const atRiskObjectives = objectives.filter((o) => o.status === "at_risk").length;
  const objectiveCompletionRate =
    objectives.length > 0
      ? Math.round((completedObjectives / objectives.length) * 1000) / 10
      : null;

  // Reviews this quarter
  const reviewsThisQuarter = reviews.filter(
    (r) => new Date(r.review_date) >= ninetyDaysAgo && new Date(r.review_date) <= now,
  ).length;

  // Child participation
  const reviewsWithParticipation = reviews.filter(
    (r) => r.child_participated,
  ).length;
  const childParticipationRate =
    reviews.length > 0
      ? Math.round((reviewsWithParticipation / reviews.length) * 1000) / 10
      : null;

  // By type
  const byPlanType: Record<string, number> = {};
  for (const p of activePlans) {
    byPlanType[p.plan_type] = (byPlanType[p.plan_type] ?? 0) + 1;
  }

  // By status
  const byPlanStatus: Record<string, number> = {};
  for (const p of plans) {
    byPlanStatus[p.status] = (byPlanStatus[p.status] ?? 0) + 1;
  }

  // By review outcome
  const byReviewOutcome: Record<string, number> = {};
  for (const r of reviews) {
    byReviewOutcome[r.outcome] = (byReviewOutcome[r.outcome] ?? 0) + 1;
  }

  return {
    total_plans: plans.length,
    current_plans: currentPlans,
    overdue_reviews: overdueReviews,
    reviews_due_soon: reviewsDueSoon,
    children_with_plans: childrenWithPlans,
    plan_coverage_rate: planCoverageRate,
    total_objectives: objectives.length,
    objectives_completed: completedObjectives,
    objectives_at_risk: atRiskObjectives,
    objective_completion_rate: objectiveCompletionRate,
    reviews_this_quarter: reviewsThisQuarter,
    child_participation_rate: childParticipationRate,
    by_plan_type: byPlanType,
    by_plan_status: byPlanStatus,
    by_review_outcome: byReviewOutcome,
  };
}

/**
 * Identify care planning alerts.
 */
export function identifyCarePlanAlerts(
  plans: CarePlan[],
  objectives: PlanObjective[],
  reviews: PlanReview[],
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

  const fourteenDaysFromNow = new Date(now);
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const activePlans = plans.filter(
    (p) => p.status !== "superseded" && p.status !== "archived",
  );

  // Overdue reviews
  for (const p of activePlans) {
    if (new Date(p.next_review_date) < now) {
      const daysOverdue = Math.round(
-londonDayDiff(new Date(p.next_review_date), now),
      );
      const severity = daysOverdue > 14 ? "critical" as const : "high" as const;
      alerts.push({
        type: "review_overdue",
        severity,
        message: `${p.child_name}'s ${PLAN_TYPES.find((t) => t.type === p.plan_type)?.label ?? p.plan_type} review is ${daysOverdue} days overdue`,
        id: p.id,
      });
    }
  }

  // Reviews due soon
  for (const p of activePlans) {
    const reviewDate = new Date(p.next_review_date);
    if (reviewDate >= now && reviewDate <= fourteenDaysFromNow) {
      alerts.push({
        type: "review_due_soon",
        severity: "medium",
        message: `${p.child_name}'s ${PLAN_TYPES.find((t) => t.type === p.plan_type)?.label ?? p.plan_type} review due on ${p.next_review_date}`,
        id: p.id,
      });
    }
  }

  // Objectives at risk
  for (const o of objectives) {
    if (o.status === "at_risk") {
      alerts.push({
        type: "objective_at_risk",
        severity: "high",
        message: `${o.child_name}'s objective "${o.objective}" is at risk — target date: ${o.target_date}`,
        id: o.id,
      });
    }
  }

  // Overdue objectives
  for (const o of objectives) {
    if (
      (o.status === "not_started" || o.status === "in_progress") &&
      new Date(o.target_date) < now
    ) {
      alerts.push({
        type: "objective_overdue",
        severity: "medium",
        message: `${o.child_name}'s objective "${o.objective}" is overdue — was due ${o.target_date}`,
        id: o.id,
      });
    }
  }

  // Children without plans
  const childrenWithActivePlans = new Set(activePlans.map((p) => p.child_id));
  if (totalChildren > childrenWithActivePlans.size) {
    const missing = totalChildren - childrenWithActivePlans.size;
    alerts.push({
      type: "children_without_plans",
      severity: "critical",
      message: `${missing} child${missing > 1 ? "ren" : ""} without active care plans — ensure all placement plans are in place`,
      id: "coverage-gap",
    });
  }

  // Low child participation
  if (reviews.length >= 3) {
    const participationRate = reviews.filter((r) => r.child_participated).length / reviews.length;
    if (participationRate < 0.8) {
      alerts.push({
        type: "low_participation",
        severity: "medium",
        message: `Child participation in reviews is ${Math.round(participationRate * 100)}% — target is 80%. Ensure children's views are sought before each review`,
        id: "participation-rate",
      });
    }
  }

  return alerts;
}

// ── CRUD — Care Plans ────────────────────────────────────────────────────

export async function listPlans(
  homeId: string,
  filters?: {
    childId?: string;
    planType?: PlanType;
    status?: PlanStatus;
    limit?: number;
  },
): Promise<ServiceResult<CarePlan[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_care_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.planType) q = q.eq("plan_type", filters.planType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("next_review_date", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPlan(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    planType: PlanType;
    startDate: string;
    nextReviewDate: string;
    socialWorker: string;
    keyWorker: string;
  },
): Promise<ServiceResult<CarePlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_care_plans") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      plan_type: input.planType,
      status: "current",
      start_date: input.startDate,
      next_review_date: input.nextReviewDate,
      last_reviewed_date: null,
      social_worker: input.socialWorker,
      key_worker: input.keyWorker,
      objectives_count: 0,
      objectives_completed: 0,
      objectives_at_risk: 0,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePlan(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<CarePlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_care_plans") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Objectives ─────────────────────────────────────────────────────

export async function listObjectives(
  homeId: string,
  filters?: {
    planId?: string;
    childId?: string;
    status?: ObjectiveStatus;
    limit?: number;
  },
): Promise<ServiceResult<PlanObjective[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_plan_objectives") as SB).select("*").eq("home_id", homeId);
  if (filters?.planId) q = q.eq("plan_id", filters.planId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("target_date", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createObjective(
  input: {
    homeId: string;
    planId: string;
    childId: string;
    childName: string;
    objective: string;
    targetDate: string;
    responsiblePerson: string;
  },
): Promise<ServiceResult<PlanObjective>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_plan_objectives") as SB)
    .insert({
      home_id: input.homeId,
      plan_id: input.planId,
      child_id: input.childId,
      child_name: input.childName,
      objective: input.objective,
      target_date: input.targetDate,
      status: "not_started",
      responsible_person: input.responsiblePerson,
      progress_notes: [],
      evidence: [],
      date_completed: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateObjective(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<PlanObjective>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_plan_objectives") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Reviews ────────────────────────────────────────────────────────

export async function listReviews(
  homeId: string,
  filters?: {
    planId?: string;
    childId?: string;
    reviewType?: ReviewType;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<PlanReview[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_plan_reviews") as SB).select("*").eq("home_id", homeId);
  if (filters?.planId) q = q.eq("plan_id", filters.planId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.reviewType) q = q.eq("review_type", filters.reviewType);
  if (filters?.dateFrom) q = q.gte("review_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("review_date", filters.dateTo);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReview(
  input: {
    homeId: string;
    planId: string;
    childId: string;
    childName: string;
    reviewType: ReviewType;
    reviewDate: string;
    chairedBy: string;
    attendees: string[];
    childParticipated: boolean;
    childViewsRecorded: boolean;
    outcome: ReviewOutcome;
    actions: string[];
    nextReviewDate: string;
  },
): Promise<ServiceResult<PlanReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_plan_reviews") as SB)
    .insert({
      home_id: input.homeId,
      plan_id: input.planId,
      child_id: input.childId,
      child_name: input.childName,
      review_type: input.reviewType,
      review_date: input.reviewDate,
      chaired_by: input.chairedBy,
      attendees: input.attendees,
      child_participated: input.childParticipated,
      child_views_recorded: input.childViewsRecorded,
      outcome: input.outcome,
      actions: input.actions,
      next_review_date: input.nextReviewDate,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeCarePlanMetrics,
  identifyCarePlanAlerts,
};
