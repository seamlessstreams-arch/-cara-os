// ══════════════════════════════════════════════════════════════════════════════
// CARA — OUTCOMES TRACKING SERVICE
// Tracks young person outcomes against the Every Child Matters framework and
// SCCIF inspection domains. Manages individual outcome targets, periodic
// reviews, progress ratings, and home-level outcome analytics.
// Linked regulations: CHR 2015 Reg 7–14, SCCIF Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface OutcomeTarget {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  domain: string;
  target_description: string;
  baseline_rating: string;
  current_rating: string;
  target_rating: string;
  set_date: string;
  review_date: string;
  reviewed_by?: string | null;
  status: "active" | "achieved" | "revised" | "discontinued";
  evidence?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutcomeReview {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  review_date: string;
  reviewer: string;
  domain_ratings: { domain: string; rating: string; notes: string }[];
  overall_progress: string;
  key_achievements: string[];
  areas_of_concern: string[];
  actions: string[];
  next_review_date: string;
  created_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const OUTCOME_DOMAINS: {
  domain: string;
  label: string;
  description: string;
  regulation: string;
}[] = [
  { domain: "be_healthy", label: "Be Healthy", description: "Physical and emotional health, healthy lifestyles", regulation: "Reg 10" },
  { domain: "stay_safe", label: "Stay Safe", description: "Protection from harm, stable placement", regulation: "Reg 12" },
  { domain: "enjoy_achieve", label: "Enjoy & Achieve", description: "Education, activities, personal development", regulation: "Reg 8/23" },
  { domain: "positive_contribution", label: "Make a Positive Contribution", description: "Community involvement, positive relationships, behaviour", regulation: "Reg 7/11" },
  { domain: "economic_wellbeing", label: "Achieve Economic Wellbeing", description: "Financial skills, employment readiness, housing preparation", regulation: "Reg 9/14" },
];

export const PROGRESS_RATINGS: string[] = [
  "declining", "no_change", "some_progress", "good_progress", "achieved",
];

export const REVIEW_FREQUENCY: string[] = [
  "monthly", "quarterly", "six_monthly", "annual",
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Map a progress rating string to a numeric index (0–4). */
function ratingToNumeric(rating: string): number {
  const idx = PROGRESS_RATINGS.indexOf(rating);
  return idx >= 0 ? idx : 0;
}

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute outcome metrics for a single child.
 */
export function computeChildOutcomes(
  targets: OutcomeTarget[],
  reviews: OutcomeReview[],
  childId: string,
): {
  active_targets: number;
  achieved_targets: number;
  by_domain: Record<string, { targets: number; achieved: number; avg_rating_numeric: number }>;
  overall_progress: number | null;
  improving_count: number;
  declining_count: number;
  latest_review_date: string | null;
} {
  const childTargets = targets.filter((t) => t.child_id === childId);
  const childReviews = reviews.filter((r) => r.child_id === childId);

  const activeTargets = childTargets.filter((t) => t.status === "active");
  const achievedTargets = childTargets.filter((t) => t.status === "achieved");

  // By domain
  const byDomain: Record<string, { targets: number; achieved: number; avg_rating_numeric: number }> = {};
  for (const d of OUTCOME_DOMAINS) {
    const domainTargets = childTargets.filter((t) => t.domain === d.domain);
    const domainActive = domainTargets.filter((t) => t.status === "active");
    const domainAchieved = domainTargets.filter((t) => t.status === "achieved");

    const ratingSum = domainActive.reduce((sum, t) => sum + ratingToNumeric(t.current_rating), 0);
    const avgRating = domainActive.length > 0 ? ratingSum / domainActive.length : 0;

    byDomain[d.domain] = {
      targets: domainTargets.length,
      achieved: domainAchieved.length,
      avg_rating_numeric: Math.round(avgRating * 100) / 100,
    };
  }

  // Overall progress: % of active targets where current_rating >= target_rating
  let metTargetCount = 0;
  for (const t of activeTargets) {
    if (ratingToNumeric(t.current_rating) >= ratingToNumeric(t.target_rating)) {
      metTargetCount++;
    }
  }
  const overallProgress =
    activeTargets.length > 0
      ? Math.round((metTargetCount / activeTargets.length) * 100)
      : null;

  // Improving: current > baseline
  let improvingCount = 0;
  let decliningCount = 0;
  for (const t of activeTargets) {
    const current = ratingToNumeric(t.current_rating);
    const baseline = ratingToNumeric(t.baseline_rating);
    if (current > baseline) improvingCount++;
    if (current < baseline) decliningCount++;
  }

  // Latest review date
  let latestReviewDate: string | null = null;
  if (childReviews.length > 0) {
    const sorted = [...childReviews].sort((a, b) => b.review_date.localeCompare(a.review_date));
    latestReviewDate = sorted[0].review_date;
  }

  return {
    active_targets: activeTargets.length,
    achieved_targets: achievedTargets.length,
    by_domain: byDomain,
    overall_progress: overallProgress,
    improving_count: improvingCount,
    declining_count: decliningCount,
    latest_review_date: latestReviewDate,
  };
}

/**
 * Compute aggregated outcome metrics across all children in a home.
 */
export function computeHomeOutcomes(
  targets: OutcomeTarget[],
  reviews: OutcomeReview[],
): {
  total_children: number;
  total_active_targets: number;
  total_achieved: number;
  by_domain: Record<string, { avg_progress: number | null; total_targets: number }>;
  overall_achievement_rate: number | null;
  children_improving: number;
  children_stable: number;
  children_declining: number;
} {
  const activeTargets = targets.filter((t) => t.status === "active");
  const achievedTargets = targets.filter((t) => t.status === "achieved");

  // Unique children from targets
  const childIds = [...new Set(targets.map((t) => t.child_id))];

  // By domain
  const byDomain: Record<string, { avg_progress: number | null; total_targets: number }> = {};
  for (const d of OUTCOME_DOMAINS) {
    const domainTargets = activeTargets.filter((t) => t.domain === d.domain);
    let metCount = 0;
    for (const t of domainTargets) {
      if (ratingToNumeric(t.current_rating) >= ratingToNumeric(t.target_rating)) {
        metCount++;
      }
    }
    const avgProgress =
      domainTargets.length > 0
        ? Math.round((metCount / domainTargets.length) * 100)
        : null;

    byDomain[d.domain] = {
      avg_progress: avgProgress,
      total_targets: domainTargets.length,
    };
  }

  // Overall achievement rate
  const totalActiveAndAchieved = activeTargets.length + achievedTargets.length;
  const overallAchievementRate =
    totalActiveAndAchieved > 0
      ? Math.round((achievedTargets.length / totalActiveAndAchieved) * 100)
      : null;

  // Per-child classification
  let childrenImproving = 0;
  let childrenStable = 0;
  let childrenDeclining = 0;

  for (const childId of childIds) {
    const childOutcomes = computeChildOutcomes(targets, reviews, childId);
    if (childOutcomes.improving_count > childOutcomes.declining_count) {
      childrenImproving++;
    } else if (childOutcomes.declining_count > childOutcomes.improving_count) {
      childrenDeclining++;
    } else {
      childrenStable++;
    }
  }

  return {
    total_children: childIds.length,
    total_active_targets: activeTargets.length,
    total_achieved: achievedTargets.length,
    by_domain: byDomain,
    overall_achievement_rate: overallAchievementRate,
    children_improving: childrenImproving,
    children_stable: childrenStable,
    children_declining: childrenDeclining,
  };
}

/**
 * Identify outcome-related alerts requiring attention.
 */
export function identifyOutcomeAlerts(
  targets: OutcomeTarget[],
  reviews: OutcomeReview[],
): { type: string; severity: "high" | "medium" | "low"; message: string; child_name?: string }[] {
  const alerts: { type: string; severity: "high" | "medium" | "low"; message: string; child_name?: string }[] = [];
  const now = new Date();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  const activeTargets = targets.filter((t) => t.status === "active");

  // ── declining_outcomes: child with current < baseline in any active target ─
  const childIds = [...new Set(activeTargets.map((t) => t.child_id))];
  for (const childId of childIds) {
    const childActive = activeTargets.filter((t) => t.child_id === childId);
    const declining = childActive.filter(
      (t) => ratingToNumeric(t.current_rating) < ratingToNumeric(t.baseline_rating),
    );
    if (declining.length > 0) {
      const childName = childActive[0].child_name;
      alerts.push({
        type: "declining_outcomes",
        severity: "high",
        message: `${childName} has ${declining.length} outcome${declining.length > 1 ? "s" : ""} declining below baseline — urgent review recommended`,
        child_name: childName,
      });
    }
  }

  // ── overdue_review: review_date in the past for active target ─────────
  for (const t of activeTargets) {
    const reviewDate = new Date(t.review_date);
    if (reviewDate.getTime() < now.getTime()) {
      alerts.push({
        type: "overdue_review",
        severity: "medium",
        message: `Outcome target "${t.target_description}" for ${t.child_name} was due for review on ${t.review_date}`,
        child_name: t.child_name,
      });
    }
  }

  // ── no_targets: child appears in reviews but has no active targets ────
  const reviewChildIds = [...new Set(reviews.map((r) => r.child_id))];
  const activeChildIds = new Set(activeTargets.map((t) => t.child_id));
  for (const childId of reviewChildIds) {
    if (!activeChildIds.has(childId)) {
      const childReview = reviews.find((r) => r.child_id === childId);
      const childName = childReview?.child_name ?? childId;
      alerts.push({
        type: "no_targets",
        severity: "medium",
        message: `${childName} has outcome reviews but no active targets — targets may need setting`,
        child_name: childName,
      });
    }
  }

  // ── low_achievement: domain with 0% achievement rate ──────────────────
  for (const d of OUTCOME_DOMAINS) {
    const domainActive = activeTargets.filter((t) => t.domain === d.domain);
    if (domainActive.length === 0) continue;

    const metCount = domainActive.filter(
      (t) => ratingToNumeric(t.current_rating) >= ratingToNumeric(t.target_rating),
    ).length;

    if (metCount === 0) {
      alerts.push({
        type: "low_achievement",
        severity: "medium",
        message: `${d.label} domain has 0% achievement rate across ${domainActive.length} active target${domainActive.length > 1 ? "s" : ""}`,
      });
    }
  }

  // ── stale_review: latest review for child > 90 days ago ───────────────
  for (const childId of childIds) {
    const childReviews = reviews.filter((r) => r.child_id === childId);
    if (childReviews.length === 0) continue;

    const sorted = [...childReviews].sort((a, b) => b.review_date.localeCompare(a.review_date));
    const latestDate = new Date(sorted[0].review_date);
    if (now.getTime() - latestDate.getTime() > ninetyDaysMs) {
      const childName = sorted[0].child_name;
      alerts.push({
        type: "stale_review",
        severity: "low",
        message: `${childName}'s latest outcome review is over 90 days old (${sorted[0].review_date}) — consider scheduling a review`,
        child_name: childName,
      });
    }
  }

  return alerts;
}

// ── CRUD — Outcome Targets ────────────────────────────────────────────────

export async function listOutcomeTargets(
  homeId: string,
  filters?: {
    childId?: string;
    domain?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<OutcomeTarget[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<OutcomeTarget[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<OutcomeTarget[]>;

  let q = (s.from("cs_outcome_targets") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.domain) q = q.eq("domain", filters.domain);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("set_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createOutcomeTarget(
  input: Omit<OutcomeTarget, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<OutcomeTarget>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_outcome_targets") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      domain: input.domain,
      target_description: input.target_description,
      baseline_rating: input.baseline_rating,
      current_rating: input.current_rating,
      target_rating: input.target_rating,
      set_date: input.set_date,
      review_date: input.review_date,
      reviewed_by: input.reviewed_by ?? null,
      status: input.status,
      evidence: input.evidence ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateOutcomeTarget(
  id: string,
  updates: Partial<OutcomeTarget>,
): Promise<ServiceResult<OutcomeTarget>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_outcome_targets") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Outcome Reviews ────────────────────────────────────────────────

export async function listOutcomeReviews(
  homeId: string,
  filters?: {
    childId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<OutcomeReview[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<OutcomeReview[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<OutcomeReview[]>;

  let q = (s.from("cs_outcome_reviews") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.dateFrom) q = q.gte("review_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("review_date", filters.dateTo);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createOutcomeReview(
  input: Omit<OutcomeReview, "id" | "created_at">,
): Promise<ServiceResult<OutcomeReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_outcome_reviews") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      review_date: input.review_date,
      reviewer: input.reviewer,
      domain_ratings: input.domain_ratings,
      overall_progress: input.overall_progress,
      key_achievements: input.key_achievements,
      areas_of_concern: input.areas_of_concern,
      actions: input.actions,
      next_review_date: input.next_review_date,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  computeChildOutcomes,
  computeHomeOutcomes,
  identifyOutcomeAlerts,
};
