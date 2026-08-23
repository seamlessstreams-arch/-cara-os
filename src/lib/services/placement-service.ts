// ══════════════════════════════════════════════════════════════════════════════
// CARA — PLACEMENT & CARE PLANNING SERVICE
// Manages placement plans, care plans, pathway plans, and LAC reviews for
// looked-after children under CHR 2015 Reg 11, 12, 14.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface PlacementPlan {
  id: string;
  home_id: string;
  child_id: string;
  plan_type: string;
  title: string;
  status: string;
  version: number;
  sections: { section: string; content: string; completed: boolean; last_updated?: string }[];
  objectives: { objective: string; target_date?: string; status: string; progress_notes?: string }[];
  placing_authority: string;
  social_worker_name?: string | null;
  iro_name?: string | null;
  created_by: string;
  approved_by?: string | null;
  approved_date?: string | null;
  review_date?: string | null;
  next_review_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LACReview {
  id: string;
  home_id: string;
  child_id: string;
  review_type: string;
  review_date: string;
  chaired_by: string;
  attendees: string[];
  outcomes: string[];
  actions: { action: string; responsible: string; due_date: string; completed: boolean }[];
  child_participated: boolean;
  child_views_recorded: boolean;
  plan_changes: string[];
  next_review_date?: string | null;
  minutes_recorded: boolean;
  status: string; // "scheduled", "completed", "cancelled"
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PLAN_TYPES = [
  { type: "placement_plan", label: "Placement Plan", statutory: true, review_weeks: 6 },
  { type: "care_plan", label: "Care Plan", statutory: true, review_weeks: 26 },
  { type: "pathway_plan", label: "Pathway Plan (16+)", statutory: true, review_weeks: 26 },
  { type: "behaviour_support_plan", label: "Behaviour Support Plan", statutory: false, review_weeks: 12 },
  { type: "risk_management_plan", label: "Risk Management Plan", statutory: false, review_weeks: 8 },
  { type: "education_plan", label: "Education Support Plan", statutory: false, review_weeks: 12 },
  { type: "health_plan", label: "Health Care Plan", statutory: false, review_weeks: 12 },
  { type: "missing_protocol", label: "Missing from Care Protocol", statutory: false, review_weeks: 12 },
] as const;

export const PLAN_SECTIONS = [
  "personal_details", "placement_objectives", "education", "health",
  "emotional_wellbeing", "identity_culture", "family_contact",
  "social_development", "self_care_skills", "behaviour_management",
  "safeguarding", "leaving_care_preparation", "wishes_feelings",
] as const;

export const LAC_REVIEW_TYPES = ["initial", "first_review", "subsequent"] as const;

export const PLAN_STATUSES = ["draft", "active", "under_review", "superseded", "archived"] as const;

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute compliance metrics across all placement plans.
 */
export function computePlanCompliance(plans: PlacementPlan[]): {
  total_plans: number;
  active_plans: number;
  draft_plans: number;
  overdue_reviews: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  completion_rate: number | null;
  objectives_met_rate: number | null;
  avg_sections_complete: number;
} {
  const now = new Date();

  const activePlans = plans.filter((p) => p.status === "active");
  const draftPlans = plans.filter((p) => p.status === "draft");

  // Overdue reviews: active plans where next_review_date < now
  const overdueReviews = activePlans.filter((p) => {
    if (!p.next_review_date) return false;
    return new Date(p.next_review_date).getTime() < now.getTime();
  }).length;

  // By type
  const byType: Record<string, number> = {};
  for (const p of plans) {
    byType[p.plan_type] = (byType[p.plan_type] ?? 0) + 1;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const p of plans) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  // Completion rate: plans where all sections completed / active plans * 100
  const fullyCompleted = activePlans.filter((p) =>
    p.sections.length > 0 && p.sections.every((s) => s.completed),
  ).length;
  const completionRate = activePlans.length > 0
    ? Math.round((fullyCompleted / activePlans.length) * 100 * 10) / 10
    : null;

  // Objectives met rate: objectives with status "achieved" / all objectives * 100
  const allObjectives = plans.flatMap((p) => p.objectives);
  const achievedObjectives = allObjectives.filter((o) => o.status === "achieved").length;
  const objectivesMetRate = allObjectives.length > 0
    ? Math.round((achievedObjectives / allObjectives.length) * 100 * 10) / 10
    : null;

  // Average sections complete per active plan (1 decimal)
  let avgSectionsComplete = 0;
  if (activePlans.length > 0) {
    const percentages = activePlans.map((p) => {
      if (p.sections.length === 0) return 0;
      const completed = p.sections.filter((s) => s.completed).length;
      return (completed / p.sections.length) * 100;
    });
    const sum = percentages.reduce((acc, v) => acc + v, 0);
    avgSectionsComplete = Math.round((sum / activePlans.length) * 10) / 10;
  }

  return {
    total_plans: plans.length,
    active_plans: activePlans.length,
    draft_plans: draftPlans.length,
    overdue_reviews: overdueReviews,
    by_type: byType,
    by_status: byStatus,
    completion_rate: completionRate,
    objectives_met_rate: objectivesMetRate,
    avg_sections_complete: avgSectionsComplete,
  };
}

/**
 * Compute a plan profile for a specific child across plans and LAC reviews.
 */
export function computeChildPlanProfile(
  childId: string,
  plans: PlacementPlan[],
  reviews: LACReview[],
): {
  child_id: string;
  active_plans: { type: string; status: string; next_review: string | null; sections_complete: number; sections_total: number }[];
  total_objectives: number;
  objectives_achieved: number;
  objectives_in_progress: number;
  last_lac_review: string | null;
  next_lac_review: string | null;
  lac_reviews_count: number;
  child_participation_rate: number | null;
  missing_plans: string[];
} {
  const childPlans = plans.filter((p) => p.child_id === childId);
  const childReviews = reviews.filter((r) => r.child_id === childId);

  const activePlans = childPlans.filter((p) => p.status === "active");

  const activePlanSummaries = activePlans.map((p) => ({
    type: p.plan_type,
    status: p.status,
    next_review: p.next_review_date ?? null,
    sections_complete: p.sections.filter((s) => s.completed).length,
    sections_total: p.sections.length,
  }));

  // Objectives across all child plans
  const allObjectives = childPlans.flatMap((p) => p.objectives);
  const totalObjectives = allObjectives.length;
  const objectivesAchieved = allObjectives.filter((o) => o.status === "achieved").length;
  const objectivesInProgress = allObjectives.filter((o) => o.status === "in_progress").length;

  // LAC review data
  const completedReviews = childReviews.filter((r) => r.status === "completed");
  const scheduledReviews = childReviews.filter((r) => r.status === "scheduled");

  // Sort completed reviews by date descending
  const sortedCompleted = [...completedReviews].sort(
    (a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime(),
  );
  const lastLACReview = sortedCompleted.length > 0 ? sortedCompleted[0].review_date : null;

  // Next LAC review: earliest scheduled review, or next_review_date from last completed
  const sortedScheduled = [...scheduledReviews].sort(
    (a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime(),
  );
  let nextLACReview: string | null = null;
  if (sortedScheduled.length > 0) {
    nextLACReview = sortedScheduled[0].review_date;
  } else if (sortedCompleted.length > 0 && sortedCompleted[0].next_review_date) {
    nextLACReview = sortedCompleted[0].next_review_date;
  }

  // Child participation rate
  const participationRate = completedReviews.length > 0
    ? Math.round((completedReviews.filter((r) => r.child_participated).length / completedReviews.length) * 100 * 10) / 10
    : null;

  // Missing statutory plans: statutory plan types not present as active
  const activePlanTypes = new Set(activePlans.map((p) => p.plan_type));
  const missingPlans = PLAN_TYPES
    .filter((pt) => pt.statutory && !activePlanTypes.has(pt.type))
    .map((pt) => pt.type);

  return {
    child_id: childId,
    active_plans: activePlanSummaries,
    total_objectives: totalObjectives,
    objectives_achieved: objectivesAchieved,
    objectives_in_progress: objectivesInProgress,
    last_lac_review: lastLACReview,
    next_lac_review: nextLACReview,
    lac_reviews_count: childReviews.length,
    child_participation_rate: participationRate,
    missing_plans: missingPlans,
  };
}

/**
 * Compute compliance metrics for LAC reviews.
 */
export function computeLACReviewCompliance(reviews: LACReview[]): {
  total_reviews: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  child_participation_rate: number | null;
  child_views_rate: number | null;
  minutes_recorded_rate: number | null;
  overdue_actions: number;
  total_actions: number;
  action_completion_rate: number | null;
} {
  const now = new Date();

  const completed = reviews.filter((r) => r.status === "completed");
  const scheduled = reviews.filter((r) => r.status === "scheduled");
  const cancelled = reviews.filter((r) => r.status === "cancelled");

  const completedCount = completed.length;

  // Participation and views rates — only from completed reviews
  const childParticipationRate = completedCount > 0
    ? Math.round((completed.filter((r) => r.child_participated).length / completedCount) * 100 * 10) / 10
    : null;

  const childViewsRate = completedCount > 0
    ? Math.round((completed.filter((r) => r.child_views_recorded).length / completedCount) * 100 * 10) / 10
    : null;

  const minutesRecordedRate = completedCount > 0
    ? Math.round((completed.filter((r) => r.minutes_recorded).length / completedCount) * 100 * 10) / 10
    : null;

  // Actions across all reviews
  const allActions = reviews.flatMap((r) => r.actions);
  const totalActions = allActions.length;
  const completedActions = allActions.filter((a) => a.completed).length;
  const overdueActions = allActions.filter(
    (a) => !a.completed && new Date(a.due_date).getTime() < now.getTime(),
  ).length;

  const actionCompletionRate = totalActions > 0
    ? Math.round((completedActions / totalActions) * 100 * 10) / 10
    : null;

  return {
    total_reviews: reviews.length,
    completed: completedCount,
    scheduled: scheduled.length,
    cancelled: cancelled.length,
    child_participation_rate: childParticipationRate,
    child_views_rate: childViewsRate,
    minutes_recorded_rate: minutesRecordedRate,
    overdue_actions: overdueActions,
    total_actions: totalActions,
    action_completion_rate: actionCompletionRate,
  };
}

/**
 * Identify alerts across plans and LAC reviews for all children.
 */
export function identifyPlanAlerts(
  plans: PlacementPlan[],
  reviews: LACReview[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string; child_id: string }[] {
  const now = new Date();
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string; child_id: string }[] = [];

  // Collect unique child IDs from both plans and reviews
  const childIds = new Set<string>();
  for (const p of plans) childIds.add(p.child_id);
  for (const r of reviews) childIds.add(r.child_id);

  for (const childId of childIds) {
    const childPlans = plans.filter((p) => p.child_id === childId);
    const childReviews = reviews.filter((r) => r.child_id === childId);
    const activePlans = childPlans.filter((p) => p.status === "active");
    const activePlanTypes = new Set(activePlans.map((p) => p.plan_type));

    // missing_placement_plan: no active placement_plan → critical
    if (!activePlanTypes.has("placement_plan")) {
      alerts.push({
        type: "missing_placement_plan",
        severity: "critical",
        message: "Child has no active placement plan",
        child_id: childId,
      });
    }

    // missing_care_plan: no active care_plan → high
    if (!activePlanTypes.has("care_plan")) {
      alerts.push({
        type: "missing_care_plan",
        severity: "high",
        message: "Child has no active care plan",
        child_id: childId,
      });
    }

    // review_overdue: active plan with next_review_date past → high
    for (const p of activePlans) {
      if (p.next_review_date && new Date(p.next_review_date).getTime() < now.getTime()) {
        alerts.push({
          type: "review_overdue",
          severity: "high",
          message: `${p.plan_type} review is overdue (was due ${p.next_review_date})`,
          child_id: childId,
        });
      }
    }

    // plan_in_draft: plan stuck in draft for > 14 days → medium
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    for (const p of childPlans) {
      if (p.status === "draft") {
        const createdAt = new Date(p.created_at).getTime();
        if (now.getTime() - createdAt > fourteenDaysMs) {
          alerts.push({
            type: "plan_in_draft",
            severity: "medium",
            message: `${p.plan_type} has been in draft for over 14 days`,
            child_id: childId,
          });
        }
      }
    }

    // lac_review_overdue: last completed LAC review > 26 weeks ago, or no review ever → high
    const completedReviews = childReviews.filter((r) => r.status === "completed");
    const twentySixWeeksMs = 26 * 7 * 24 * 60 * 60 * 1000;
    if (completedReviews.length === 0) {
      alerts.push({
        type: "lac_review_overdue",
        severity: "high",
        message: "Child has never had a LAC review",
        child_id: childId,
      });
    } else {
      const sortedCompleted = [...completedReviews].sort(
        (a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime(),
      );
      const lastReviewDate = new Date(sortedCompleted[0].review_date).getTime();
      if (now.getTime() - lastReviewDate > twentySixWeeksMs) {
        alerts.push({
          type: "lac_review_overdue",
          severity: "high",
          message: `LAC review overdue — last review was ${sortedCompleted[0].review_date}`,
          child_id: childId,
        });
      }
    }

    // action_overdue: LAC review action past due_date and not completed → medium
    for (const r of childReviews) {
      for (const a of r.actions) {
        if (!a.completed && new Date(a.due_date).getTime() < now.getTime()) {
          alerts.push({
            type: "action_overdue",
            severity: "medium",
            message: `LAC review action overdue: "${a.action}" (due ${a.due_date})`,
            child_id: childId,
          });
        }
      }
    }

    // low_completion: active plan with < 50% sections completed → medium
    for (const p of activePlans) {
      if (p.sections.length > 0) {
        const completedSections = p.sections.filter((s) => s.completed).length;
        const pct = (completedSections / p.sections.length) * 100;
        if (pct < 50) {
          alerts.push({
            type: "low_completion",
            severity: "medium",
            message: `${p.plan_type} has less than 50% sections completed (${Math.round(pct)}%)`,
            child_id: childId,
          });
        }
      }
    }
  }

  return alerts;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listPlans(
  homeId: string,
  filters?: { childId?: string; planType?: string; status?: string },
): Promise<ServiceResult<PlacementPlan[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<PlacementPlan[]>;

  let q = (s.from("cs_placement_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.planType) q = q.eq("plan_type", filters.planType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getPlan(
  id: string,
): Promise<ServiceResult<PlacementPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_placement_plans") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createPlan(
  input: Omit<PlacementPlan, "id" | "version" | "status" | "created_at" | "updated_at">,
): Promise<ServiceResult<PlacementPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_placement_plans") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      plan_type: input.plan_type,
      title: input.title,
      version: 1,
      status: "draft",
      sections: input.sections,
      objectives: input.objectives,
      placing_authority: input.placing_authority,
      social_worker_name: input.social_worker_name ?? null,
      iro_name: input.iro_name ?? null,
      created_by: input.created_by,
      approved_by: input.approved_by ?? null,
      approved_date: input.approved_date ?? null,
      review_date: input.review_date ?? null,
      next_review_date: input.next_review_date ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePlan(
  id: string,
  updates: Partial<PlacementPlan>,
): Promise<ServiceResult<PlacementPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_placement_plans") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function approvePlan(
  id: string,
  approvedBy: string,
): Promise<ServiceResult<PlacementPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_placement_plans") as SB)
    .update({
      status: "active",
      approved_by: approvedBy,
      approved_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listLACReviews(
  homeId: string,
  filters?: { childId?: string; status?: string; limit?: number },
): Promise<ServiceResult<LACReview[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<LACReview[]>;

  let q = (s.from("cs_lac_reviews") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createLACReview(
  input: Omit<LACReview, "id" | "status" | "created_at" | "updated_at">,
): Promise<ServiceResult<LACReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_lac_reviews") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      review_type: input.review_type,
      review_date: input.review_date,
      chaired_by: input.chaired_by,
      attendees: input.attendees,
      outcomes: input.outcomes,
      actions: input.actions,
      child_participated: input.child_participated,
      child_views_recorded: input.child_views_recorded,
      plan_changes: input.plan_changes,
      next_review_date: input.next_review_date ?? null,
      minutes_recorded: input.minutes_recorded,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function completeLACReview(
  id: string,
  data: {
    outcomes: string[];
    actions: LACReview["actions"];
    child_participated: boolean;
    child_views_recorded: boolean;
    plan_changes: string[];
    next_review_date?: string;
    minutes_recorded: boolean;
  },
): Promise<ServiceResult<LACReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data: result, error } = await (s.from("cs_lac_reviews") as SB)
    .update({
      status: "completed",
      outcomes: data.outcomes,
      actions: data.actions,
      child_participated: data.child_participated,
      child_views_recorded: data.child_views_recorded,
      plan_changes: data.plan_changes,
      next_review_date: data.next_review_date ?? null,
      minutes_recorded: data.minutes_recorded,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: result };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePlanCompliance,
  computeChildPlanProfile,
  computeLACReviewCompliance,
  identifyPlanAlerts,
};
