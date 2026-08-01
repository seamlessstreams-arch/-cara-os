// ══════════════════════════════════════════════════════════════════════════════
// CARA — TRANSITION PLANNING SERVICE
// Manages children's transitions into, within, and out of the children's home.
// CHR 2015 Reg 12 (preparing children for adulthood and transitions),
// Reg 36 (notification on admission/leaving), Reg 14 (care planning),
// Children Act 1989 s23C (leaving care duties), Reg 37 (records).
//
// Tracks placement transitions (admission, internal moves, discharge),
// transition plans (goals, timelines, responsible persons), readiness
// assessments, and handover documentation — ensuring children experience
// well-planned, supported transitions with minimal disruption.
//
// SCCIF: Helped & Protected — "Children are well prepared for changes in
// their lives, including moves." Well-Led — "Admissions and transitions
// are carefully planned."
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

export type TransitionType =
  | "admission"
  | "internal_move"
  | "planned_discharge"
  | "emergency_discharge"
  | "step_down"
  | "step_up"
  | "reunification"
  | "foster_care"
  | "semi_independent"
  | "adult_services";

export type TransitionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "on_hold";

export type ReadinessArea =
  | "emotional_readiness"
  | "practical_skills"
  | "education_training"
  | "health_needs"
  | "social_networks"
  | "identity_belonging"
  | "financial_capability"
  | "independent_living"
  | "family_contact"
  | "professional_support";

export type ReadinessRating =
  | "not_ready"
  | "developing"
  | "mostly_ready"
  | "ready";

export type GoalStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "deferred"
  | "no_longer_applicable";

export interface TransitionPlan {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  transition_type: TransitionType;
  planned_date: string;
  actual_date: string | null;
  destination: string | null;
  destination_type: string | null;
  reason: string;
  status: TransitionStatus;
  social_worker_name: string | null;
  social_worker_notified: boolean;
  iro_notified: boolean;
  parent_notified: boolean;
  child_views_sought: boolean;
  child_views: string | null;
  readiness_assessment: {
    area: ReadinessArea;
    rating: ReadinessRating;
    notes: string;
  }[];
  goals: {
    goal: string;
    responsible_person: string;
    target_date: string;
    status: GoalStatus;
    completion_notes: string;
  }[];
  handover_completed: boolean;
  handover_date: string | null;
  handover_to: string | null;
  records_transferred: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  ofsted_notified: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransitionReview {
  id: string;
  home_id: string;
  plan_id: string;
  child_id: string;
  child_name: string;
  review_date: string;
  reviewer: string;
  progress_summary: string;
  goals_reviewed: number;
  goals_on_track: number;
  child_views: string | null;
  concerns: string | null;
  next_steps: string | null;
  next_review_date: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TRANSITION_TYPES: { type: TransitionType; label: string }[] = [
  { type: "admission", label: "Admission" },
  { type: "internal_move", label: "Internal Move" },
  { type: "planned_discharge", label: "Planned Discharge" },
  { type: "emergency_discharge", label: "Emergency Discharge" },
  { type: "step_down", label: "Step Down" },
  { type: "step_up", label: "Step Up" },
  { type: "reunification", label: "Reunification with Family" },
  { type: "foster_care", label: "Move to Foster Care" },
  { type: "semi_independent", label: "Semi-Independent Living" },
  { type: "adult_services", label: "Transfer to Adult Services" },
];

export const TRANSITION_STATUSES: { status: TransitionStatus; label: string }[] = [
  { status: "planned", label: "Planned" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
  { status: "on_hold", label: "On Hold" },
];

export const READINESS_AREAS: { area: ReadinessArea; label: string }[] = [
  { area: "emotional_readiness", label: "Emotional Readiness" },
  { area: "practical_skills", label: "Practical Skills" },
  { area: "education_training", label: "Education & Training" },
  { area: "health_needs", label: "Health Needs" },
  { area: "social_networks", label: "Social Networks" },
  { area: "identity_belonging", label: "Identity & Belonging" },
  { area: "financial_capability", label: "Financial Capability" },
  { area: "independent_living", label: "Independent Living" },
  { area: "family_contact", label: "Family Contact" },
  { area: "professional_support", label: "Professional Support" },
];

export const READINESS_RATINGS: { rating: ReadinessRating; label: string }[] = [
  { rating: "not_ready", label: "Not Ready" },
  { rating: "developing", label: "Developing" },
  { rating: "mostly_ready", label: "Mostly Ready" },
  { rating: "ready", label: "Ready" },
];

export const GOAL_STATUSES: { status: GoalStatus; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "deferred", label: "Deferred" },
  { status: "no_longer_applicable", label: "No Longer Applicable" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute transition planning metrics.
 */
export function computeTransitionMetrics(
  plans: TransitionPlan[],
  reviews: TransitionReview[],
): {
  active_transitions: number;
  planned_transitions: number;
  completed_this_year: number;
  by_transition_type: Record<string, number>;
  avg_readiness_score: number | null;
  goals_on_track_rate: number | null;
  child_views_sought_rate: number | null;
  overdue_follow_ups: number;
  reviews_this_quarter: number;
} {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  const activeTransitions = plans.filter(
    (p) => p.status === "in_progress",
  ).length;

  const plannedTransitions = plans.filter(
    (p) => p.status === "planned",
  ).length;

  const completedThisYear = plans.filter(
    (p) => p.status === "completed" && p.actual_date && new Date(p.actual_date) >= yearStart,
  ).length;

  // By transition type
  const byTransitionType: Record<string, number> = {};
  for (const p of plans) {
    byTransitionType[p.transition_type] = (byTransitionType[p.transition_type] ?? 0) + 1;
  }

  // Average readiness score across all active/planned transitions
  // not_ready=1, developing=2, mostly_ready=3, ready=4
  const ratingValues: Record<string, number> = {
    not_ready: 1,
    developing: 2,
    mostly_ready: 3,
    ready: 4,
  };
  let totalReadiness = 0;
  let readinessCount = 0;
  for (const p of plans) {
    if (p.status === "planned" || p.status === "in_progress") {
      for (const r of p.readiness_assessment) {
        if (ratingValues[r.rating] != null) {
          totalReadiness += ratingValues[r.rating];
          readinessCount++;
        }
      }
    }
  }
  const avgReadinessScore =
    readinessCount > 0
      ? Math.round((totalReadiness / readinessCount) * 10) / 10
      : null;

  // Goals on track rate (active/planned plans)
  let totalGoals = 0;
  let onTrackGoals = 0;
  for (const p of plans) {
    if (p.status === "planned" || p.status === "in_progress") {
      for (const g of p.goals) {
        totalGoals++;
        if (g.status === "completed" || g.status === "in_progress") {
          onTrackGoals++;
        }
      }
    }
  }
  const goalsOnTrackRate =
    totalGoals > 0
      ? Math.round((onTrackGoals / totalGoals) * 1000) / 10
      : null;

  // Child views sought rate
  const activeOrPlanned = plans.filter(
    (p) => p.status === "planned" || p.status === "in_progress" || p.status === "completed",
  );
  let viewsSought = 0;
  for (const p of activeOrPlanned) {
    if (p.child_views_sought) viewsSought++;
  }
  const childViewsSoughtRate =
    activeOrPlanned.length > 0
      ? Math.round((viewsSought / activeOrPlanned.length) * 1000) / 10
      : null;

  // Overdue follow-ups
  let overdueFollowUps = 0;
  for (const p of plans) {
    if (
      p.status === "completed" &&
      p.follow_up_date &&
      !p.follow_up_completed &&
      new Date(p.follow_up_date) < now
    ) {
      overdueFollowUps++;
    }
  }

  // Reviews this quarter
  const reviewsThisQuarter = reviews.filter(
    (r) => new Date(r.review_date) >= quarterStart,
  ).length;

  return {
    active_transitions: activeTransitions,
    planned_transitions: plannedTransitions,
    completed_this_year: completedThisYear,
    by_transition_type: byTransitionType,
    avg_readiness_score: avgReadinessScore,
    goals_on_track_rate: goalsOnTrackRate,
    child_views_sought_rate: childViewsSoughtRate,
    overdue_follow_ups: overdueFollowUps,
    reviews_this_quarter: reviewsThisQuarter,
  };
}

/**
 * Identify transition planning alerts requiring management attention.
 */
export function identifyTransitionAlerts(
  plans: TransitionPlan[],
  reviews: TransitionReview[],
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

  const fourteenDaysMs = 14 * 86400000;
  const thirtyDaysMs = 30 * 86400000;

  // Build map: plan_id -> reviews
  const reviewsByPlan = new Map<string, TransitionReview[]>();
  for (const r of reviews) {
    if (!reviewsByPlan.has(r.plan_id)) {
      reviewsByPlan.set(r.plan_id, []);
    }
    reviewsByPlan.get(r.plan_id)!.push(r);
  }

  for (const p of plans) {
    // Emergency discharge without child views — critical
    if (p.transition_type === "emergency_discharge" && !p.child_views_sought) {
      alerts.push({
        type: "emergency_no_child_views",
        severity: "critical",
        message: `Emergency discharge for ${p.child_name} — child's views not sought. Reg 7 requires children's wishes to be ascertained even in emergency moves`,
        id: p.id,
      });
    }

    // Transition planned but date approaching without readiness assessment
    if (
      p.status === "planned" &&
      p.readiness_assessment.length === 0 &&
      p.planned_date
    ) {
      const daysUntil = (new Date(p.planned_date).getTime() - now.getTime()) / 86400000;
      if (daysUntil <= 30 && daysUntil > 0) {
        alerts.push({
          type: "no_readiness_assessment",
          severity: "high",
          message: `Transition for ${p.child_name} planned in ${Math.round(daysUntil)} days but no readiness assessment completed — Reg 12 requires adequate preparation`,
          id: p.id,
        });
      }
    }

    // Transition overdue (planned date passed, still planned)
    if (
      p.status === "planned" &&
      p.planned_date &&
      new Date(p.planned_date) < now
    ) {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(p.planned_date).getTime()) / 86400000,
      );
      alerts.push({
        type: "transition_overdue",
        severity: "high",
        message: `Planned transition for ${p.child_name} is ${daysOverdue} days overdue — review plan and update timeline`,
        id: p.id,
      });
    }

    // Social worker not notified — high
    if (
      (p.status === "in_progress" || p.status === "completed") &&
      !p.social_worker_notified
    ) {
      alerts.push({
        type: "social_worker_not_notified",
        severity: "high",
        message: `Social worker not notified of ${p.child_name}'s ${p.transition_type.replace(/_/g, " ")} — Reg 36 requires notification`,
        id: p.id,
      });
    }

    // Ofsted not notified for completed transition — high
    if (p.status === "completed" && !p.ofsted_notified) {
      alerts.push({
        type: "ofsted_not_notified",
        severity: "high",
        message: `Ofsted not notified of ${p.child_name}'s completed ${p.transition_type.replace(/_/g, " ")} — Reg 36 requires notification`,
        id: p.id,
      });
    }

    // Completed transition without handover — high
    if (
      p.status === "completed" &&
      !p.handover_completed &&
      p.transition_type !== "internal_move"
    ) {
      alerts.push({
        type: "no_handover",
        severity: "high",
        message: `${p.child_name}'s transition completed but handover not documented — records transfer and handover required`,
        id: p.id,
      });
    }

    // Follow-up overdue — medium
    if (
      p.status === "completed" &&
      p.follow_up_date &&
      !p.follow_up_completed &&
      new Date(p.follow_up_date) < now
    ) {
      alerts.push({
        type: "follow_up_overdue",
        severity: "medium",
        message: `Post-transition follow-up for ${p.child_name} is overdue — check welfare and adjustment`,
        id: p.id,
      });
    }

    // Child views not sought — medium
    if (
      (p.status === "planned" || p.status === "in_progress") &&
      !p.child_views_sought
    ) {
      alerts.push({
        type: "child_views_not_sought",
        severity: "medium",
        message: `Child's views not recorded for ${p.child_name}'s transition — Reg 7 requires ascertaining children's wishes`,
        id: p.id,
      });
    }

    // Low readiness scores — medium
    if (p.status === "in_progress" && p.readiness_assessment.length > 0) {
      const notReadyCount = p.readiness_assessment.filter(
        (r) => r.rating === "not_ready",
      ).length;
      if (notReadyCount >= 3) {
        alerts.push({
          type: "low_readiness",
          severity: "medium",
          message: `${p.child_name} has ${notReadyCount} areas rated 'not ready' — review transition timeline and support needs`,
          id: p.id,
        });
      }
    }

    // No review for active transition in 30+ days
    if (p.status === "in_progress") {
      const planReviews = reviewsByPlan.get(p.id) ?? [];
      if (planReviews.length === 0) {
        const createdDate = new Date(p.created_at).getTime();
        if (now.getTime() - createdDate > thirtyDaysMs) {
          alerts.push({
            type: "no_review",
            severity: "medium",
            message: `No transition review recorded for ${p.child_name}'s in-progress transition — regular reviews required to track progress`,
            id: p.id,
          });
        }
      }
    }
  }

  return alerts;
}

// ── CRUD — Transition Plans ──────────────────────────────────────────────

export async function listPlans(
  homeId: string,
  filters?: {
    childId?: string;
    transitionType?: TransitionType;
    status?: TransitionStatus;
    limit?: number;
  },
): Promise<ServiceResult<TransitionPlan[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_transition_plans") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.transitionType) q = q.eq("transition_type", filters.transitionType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("planned_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPlan(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    transitionType: TransitionType;
    plannedDate: string;
    destination?: string;
    destinationType?: string;
    reason: string;
    socialWorkerName?: string;
    socialWorkerNotified?: boolean;
    iroNotified?: boolean;
    parentNotified?: boolean;
    childViewsSought?: boolean;
    childViews?: string;
    readinessAssessment?: { area: ReadinessArea; rating: ReadinessRating; notes: string }[];
    goals?: { goal: string; responsible_person: string; target_date: string; status: GoalStatus; completion_notes: string }[];
    followUpDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<TransitionPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_transition_plans") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      transition_type: input.transitionType,
      planned_date: input.plannedDate,
      actual_date: null,
      destination: input.destination ?? null,
      destination_type: input.destinationType ?? null,
      reason: input.reason,
      status: "planned",
      social_worker_name: input.socialWorkerName ?? null,
      social_worker_notified: input.socialWorkerNotified ?? false,
      iro_notified: input.iroNotified ?? false,
      parent_notified: input.parentNotified ?? false,
      child_views_sought: input.childViewsSought ?? false,
      child_views: input.childViews ?? null,
      readiness_assessment: input.readinessAssessment ?? [],
      goals: input.goals ?? [],
      handover_completed: false,
      handover_date: null,
      handover_to: null,
      records_transferred: false,
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: false,
      ofsted_notified: false,
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
): Promise<ServiceResult<TransitionPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_transition_plans") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Transition Reviews ────────────────────────────────────────────

export async function listReviews(
  homeId: string,
  filters?: {
    planId?: string;
    childId?: string;
    limit?: number;
  },
): Promise<ServiceResult<TransitionReview[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_transition_reviews") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.planId) q = q.eq("plan_id", filters.planId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 100);

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
    reviewDate?: string;
    reviewer: string;
    progressSummary: string;
    goalsReviewed?: number;
    goalsOnTrack?: number;
    childViews?: string;
    concerns?: string;
    nextSteps?: string;
    nextReviewDate?: string;
  },
): Promise<ServiceResult<TransitionReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_transition_reviews") as SB)
    .insert({
      home_id: input.homeId,
      plan_id: input.planId,
      child_id: input.childId,
      child_name: input.childName,
      review_date: input.reviewDate ?? new Date().toISOString().split("T")[0],
      reviewer: input.reviewer,
      progress_summary: input.progressSummary,
      goals_reviewed: input.goalsReviewed ?? 0,
      goals_on_track: input.goalsOnTrack ?? 0,
      child_views: input.childViews ?? null,
      concerns: input.concerns ?? null,
      next_steps: input.nextSteps ?? null,
      next_review_date: input.nextReviewDate ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeTransitionMetrics,
  identifyTransitionAlerts,
};
