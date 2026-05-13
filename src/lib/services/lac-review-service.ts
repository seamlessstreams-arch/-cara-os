// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LAC REVIEW SERVICE
// Manages Looked After Children (LAC) review tracking, IRO engagement,
// statutory timescales, and review outcomes.
// CHR 2015 Reg 45 (review of quality of care),
// Care Planning Regs 2010, IRO Handbook.
//
// Tracks LAC review dates, ensures statutory timescales are met,
// records IRO recommendations, child participation, and outcomes.
//
// SCCIF: Well-Led — "Reviews are timely and effective."
// "Children's views are central to review processes."
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

export type ReviewType =
  | "initial"
  | "second"
  | "subsequent"
  | "additional"
  | "disruption"
  | "pre_discharge";

export type ReviewOutcome =
  | "plan_endorsed"
  | "plan_amended"
  | "placement_change"
  | "permanence_confirmed"
  | "return_home"
  | "escalation_required"
  | "further_assessment"
  | "no_change";

export type ChildParticipation =
  | "attended_spoke"
  | "attended_advocate"
  | "written_views"
  | "views_via_worker"
  | "did_not_participate"
  | "too_young";

export type ReviewStatus =
  | "scheduled"
  | "completed"
  | "overdue"
  | "cancelled"
  | "rescheduled";

export interface LacReview {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  review_type: ReviewType;
  review_date: string;
  next_review_due: string | null;
  status: ReviewStatus;
  iro_name: string;
  child_participation: ChildParticipation;
  child_views_recorded: boolean;
  parent_attended: boolean;
  social_worker_attended: boolean;
  key_worker_attended: boolean;
  outcome: ReviewOutcome | null;
  recommendations: string[];
  actions_agreed: string[];
  placement_stability_discussed: boolean;
  permanence_plan_reviewed: boolean;
  health_reviewed: boolean;
  education_reviewed: boolean;
  within_timescale: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REVIEW_TYPES: { type: ReviewType; label: string }[] = [
  { type: "initial", label: "Initial (within 20 working days)" },
  { type: "second", label: "Second (within 3 months)" },
  { type: "subsequent", label: "Subsequent (every 6 months)" },
  { type: "additional", label: "Additional" },
  { type: "disruption", label: "Disruption Meeting" },
  { type: "pre_discharge", label: "Pre-Discharge" },
];

export const REVIEW_OUTCOMES: { outcome: ReviewOutcome; label: string }[] = [
  { outcome: "plan_endorsed", label: "Plan Endorsed" },
  { outcome: "plan_amended", label: "Plan Amended" },
  { outcome: "placement_change", label: "Placement Change" },
  { outcome: "permanence_confirmed", label: "Permanence Confirmed" },
  { outcome: "return_home", label: "Return Home" },
  { outcome: "escalation_required", label: "Escalation Required" },
  { outcome: "further_assessment", label: "Further Assessment" },
  { outcome: "no_change", label: "No Change" },
];

export const CHILD_PARTICIPATIONS: { participation: ChildParticipation; label: string }[] = [
  { participation: "attended_spoke", label: "Attended & Spoke" },
  { participation: "attended_advocate", label: "Attended via Advocate" },
  { participation: "written_views", label: "Written Views" },
  { participation: "views_via_worker", label: "Views via Worker" },
  { participation: "did_not_participate", label: "Did Not Participate" },
  { participation: "too_young", label: "Too Young" },
];

export const REVIEW_STATUSES: { status: ReviewStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "completed", label: "Completed" },
  { status: "overdue", label: "Overdue" },
  { status: "cancelled", label: "Cancelled" },
  { status: "rescheduled", label: "Rescheduled" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute LAC review metrics.
 */
export function computeReviewMetrics(
  reviews: LacReview[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_reviews: number;
  completed_reviews: number;
  overdue_reviews: number;
  scheduled_reviews: number;
  within_timescale_rate: number;
  child_participation_rate: number;
  child_views_recorded_rate: number;
  parent_attendance_rate: number;
  plan_endorsed_count: number;
  plan_amended_count: number;
  escalation_count: number;
  children_reviewed: number;
  review_coverage: number;
  placement_stability_rate: number;
  health_reviewed_rate: number;
  education_reviewed_rate: number;
  by_type: Record<string, number>;
  by_outcome: Record<string, number>;
  by_participation: Record<string, number>;
  by_status: Record<string, number>;
} {
  const completed = reviews.filter((r) => r.status === "completed").length;
  const overdue = reviews.filter((r) => r.status === "overdue").length;
  const scheduled = reviews.filter((r) => r.status === "scheduled").length;

  // Also check scheduled reviews past their date
  for (const r of reviews) {
    if (r.status === "scheduled" && new Date(r.review_date) < now) {
      // count as implicitly overdue
    }
  }

  const completedReviews = reviews.filter((r) => r.status === "completed");

  const withinTimescale = completedReviews.filter((r) => r.within_timescale).length;
  const withinRate =
    completedReviews.length > 0
      ? Math.round((withinTimescale / completedReviews.length) * 1000) / 10
      : 0;

  // Child participation (attended_spoke + attended_advocate + written_views + views_via_worker)
  const participated = completedReviews.filter(
    (r) =>
      r.child_participation === "attended_spoke" ||
      r.child_participation === "attended_advocate" ||
      r.child_participation === "written_views" ||
      r.child_participation === "views_via_worker",
  ).length;
  const participationRate =
    completedReviews.length > 0
      ? Math.round((participated / completedReviews.length) * 1000) / 10
      : 0;

  const viewsRecorded = completedReviews.filter((r) => r.child_views_recorded).length;
  const viewsRate =
    completedReviews.length > 0
      ? Math.round((viewsRecorded / completedReviews.length) * 1000) / 10
      : 0;

  const parentAttended = completedReviews.filter((r) => r.parent_attended).length;
  const parentRate =
    completedReviews.length > 0
      ? Math.round((parentAttended / completedReviews.length) * 1000) / 10
      : 0;

  const planEndorsed = completedReviews.filter((r) => r.outcome === "plan_endorsed").length;
  const planAmended = completedReviews.filter((r) => r.outcome === "plan_amended").length;
  const escalation = completedReviews.filter((r) => r.outcome === "escalation_required").length;

  // Unique children reviewed
  const uniqueChildren = new Set(completedReviews.map((r) => r.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : 0;

  // Placement stability discussed
  const stabilityDiscussed = completedReviews.filter((r) => r.placement_stability_discussed).length;
  const stabilityRate =
    completedReviews.length > 0
      ? Math.round((stabilityDiscussed / completedReviews.length) * 1000) / 10
      : 0;

  // Health/education reviewed
  const healthReviewed = completedReviews.filter((r) => r.health_reviewed).length;
  const healthRate =
    completedReviews.length > 0
      ? Math.round((healthReviewed / completedReviews.length) * 1000) / 10
      : 0;

  const educationReviewed = completedReviews.filter((r) => r.education_reviewed).length;
  const educationRate =
    completedReviews.length > 0
      ? Math.round((educationReviewed / completedReviews.length) * 1000) / 10
      : 0;

  // By type
  const byType: Record<string, number> = {};
  for (const r of reviews) {
    byType[r.review_type] = (byType[r.review_type] ?? 0) + 1;
  }

  // By outcome
  const byOutcome: Record<string, number> = {};
  for (const r of completedReviews) {
    if (r.outcome) {
      byOutcome[r.outcome] = (byOutcome[r.outcome] ?? 0) + 1;
    }
  }

  // By participation
  const byParticipation: Record<string, number> = {};
  for (const r of completedReviews) {
    byParticipation[r.child_participation] = (byParticipation[r.child_participation] ?? 0) + 1;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const r of reviews) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }

  return {
    total_reviews: reviews.length,
    completed_reviews: completed,
    overdue_reviews: overdue,
    scheduled_reviews: scheduled,
    within_timescale_rate: withinRate,
    child_participation_rate: participationRate,
    child_views_recorded_rate: viewsRate,
    parent_attendance_rate: parentRate,
    plan_endorsed_count: planEndorsed,
    plan_amended_count: planAmended,
    escalation_count: escalation,
    children_reviewed: uniqueChildren,
    review_coverage: coverage,
    placement_stability_rate: stabilityRate,
    health_reviewed_rate: healthRate,
    education_reviewed_rate: educationRate,
    by_type: byType,
    by_outcome: byOutcome,
    by_participation: byParticipation,
    by_status: byStatus,
  };
}

/**
 * Identify LAC review alerts.
 */
export function identifyReviewAlerts(
  reviews: LacReview[],
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

  // Overdue reviews
  for (const r of reviews) {
    if (r.status === "overdue") {
      alerts.push({
        type: "review_overdue",
        severity: "critical",
        message: `LAC review for ${r.child_name} is overdue — was due ${r.review_date}. Contact IRO (${r.iro_name}) immediately`,
        id: r.id,
      });
    }
  }

  // Scheduled reviews past their date
  for (const r of reviews) {
    if (r.status === "scheduled" && new Date(r.review_date) < now) {
      alerts.push({
        type: "review_past_date",
        severity: "high",
        message: `LAC review for ${r.child_name} was scheduled for ${r.review_date} but not marked complete or overdue — update status`,
        id: r.id,
      });
    }
  }

  // Upcoming reviews in next 14 days
  const fourteenDaysAhead = new Date(now);
  fourteenDaysAhead.setDate(fourteenDaysAhead.getDate() + 14);
  for (const r of reviews) {
    if (
      r.status === "scheduled" &&
      new Date(r.review_date) >= now &&
      new Date(r.review_date) <= fourteenDaysAhead
    ) {
      alerts.push({
        type: "review_upcoming",
        severity: "medium",
        message: `LAC review for ${r.child_name} due ${r.review_date} — ensure preparation is complete and all parties are invited`,
        id: r.id,
      });
    }
  }

  // Child did not participate in completed review
  for (const r of reviews) {
    if (r.status === "completed" && r.child_participation === "did_not_participate") {
      alerts.push({
        type: "no_child_participation",
        severity: "high",
        message: `${r.child_name} did not participate in their LAC review on ${r.review_date} — ensure child's voice is heard at next review`,
        id: r.id,
      });
    }
  }

  // Escalation required
  for (const r of reviews) {
    if (r.status === "completed" && r.outcome === "escalation_required") {
      alerts.push({
        type: "escalation_required",
        severity: "critical",
        message: `LAC review for ${r.child_name} on ${r.review_date} requires escalation — IRO ${r.iro_name} has recommended further action`,
        id: r.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listReviews(
  homeId: string,
  filters?: {
    childId?: string;
    reviewType?: ReviewType;
    status?: ReviewStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<LacReview[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_lac_reviews") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.reviewType) q = q.eq("review_type", filters.reviewType);
  if (filters?.status) q = q.eq("status", filters.status);
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
    childName: string;
    childId: string;
    reviewType: ReviewType;
    reviewDate: string;
    nextReviewDue?: string;
    iroName: string;
    childParticipation: ChildParticipation;
    childViewsRecorded: boolean;
    parentAttended: boolean;
    socialWorkerAttended: boolean;
    keyWorkerAttended: boolean;
    outcome?: ReviewOutcome;
    recommendations: string[];
    actionsAgreed: string[];
    placementStabilityDiscussed: boolean;
    permanencePlanReviewed: boolean;
    healthReviewed: boolean;
    educationReviewed: boolean;
    withinTimescale: boolean;
    notes?: string;
  },
): Promise<ServiceResult<LacReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_lac_reviews") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      review_type: input.reviewType,
      review_date: input.reviewDate,
      next_review_due: input.nextReviewDue ?? null,
      status: "completed",
      iro_name: input.iroName,
      child_participation: input.childParticipation,
      child_views_recorded: input.childViewsRecorded,
      parent_attended: input.parentAttended,
      social_worker_attended: input.socialWorkerAttended,
      key_worker_attended: input.keyWorkerAttended,
      outcome: input.outcome ?? null,
      recommendations: input.recommendations,
      actions_agreed: input.actionsAgreed,
      placement_stability_discussed: input.placementStabilityDiscussed,
      permanence_plan_reviewed: input.permanencePlanReviewed,
      health_reviewed: input.healthReviewed,
      education_reviewed: input.educationReviewed,
      within_timescale: input.withinTimescale,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReview(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<LacReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_lac_reviews") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeReviewMetrics,
  identifyReviewAlerts,
};
