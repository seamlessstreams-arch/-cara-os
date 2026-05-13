// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DISCHARGE & TRANSITION REVIEW SERVICE
// Manages discharge planning, transition readiness reviews, and move-on
// preparations for children leaving the home.
// CHR 2015 Reg 36 (fitness of premises — move planning),
// Reg 37 (fitness of workers — discharge support),
// Children Act 1989 s23C/23CZA (continuing care/support).
//
// Tracks discharge planning meetings, readiness assessments,
// move-on accommodation, support packages, and review outcomes.
//
// SCCIF: Overall Experiences — "Transitions are well planned."
// "Children are prepared for their next placement or independence."
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

export type DischargeReason =
  | "planned_move"
  | "reunification"
  | "foster_care"
  | "semi_independence"
  | "independence"
  | "adoption"
  | "special_guardianship"
  | "aged_out"
  | "unplanned_breakdown"
  | "transfer"
  | "other";

export type ReadinessLevel =
  | "fully_ready"
  | "mostly_ready"
  | "partially_ready"
  | "not_ready"
  | "not_assessed";

export type ReviewStatus =
  | "scheduled"
  | "completed"
  | "overdue"
  | "not_required"
  | "cancelled";

export type SupportPackage =
  | "pathway_plan"
  | "personal_adviser"
  | "supported_housing"
  | "financial_support"
  | "education_support"
  | "health_plan"
  | "mental_health"
  | "employment_support"
  | "family_mediation"
  | "peer_support"
  | "none_identified"
  | "other";

export interface DischargeReview {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  discharge_reason: DischargeReason;
  planned_date: string;
  actual_date: string | null;
  readiness_level: ReadinessLevel;
  review_status: ReviewStatus;
  review_date: string | null;
  reviewed_by: string | null;
  destination: string | null;
  support_packages: SupportPackage[];
  child_views_recorded: boolean;
  child_wants_to_leave: boolean | null;
  social_worker_involved: boolean;
  family_consulted: boolean;
  education_plan_in_place: boolean;
  health_needs_transferred: boolean;
  life_story_work_complete: boolean;
  goodbye_event_planned: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DISCHARGE_REASONS: { reason: DischargeReason; label: string }[] = [
  { reason: "planned_move", label: "Planned Move" },
  { reason: "reunification", label: "Reunification" },
  { reason: "foster_care", label: "Foster Care" },
  { reason: "semi_independence", label: "Semi-Independence" },
  { reason: "independence", label: "Independence" },
  { reason: "adoption", label: "Adoption" },
  { reason: "special_guardianship", label: "Special Guardianship" },
  { reason: "aged_out", label: "Aged Out" },
  { reason: "unplanned_breakdown", label: "Unplanned Breakdown" },
  { reason: "transfer", label: "Transfer" },
  { reason: "other", label: "Other" },
];

export const READINESS_LEVELS: { level: ReadinessLevel; label: string }[] = [
  { level: "fully_ready", label: "Fully Ready" },
  { level: "mostly_ready", label: "Mostly Ready" },
  { level: "partially_ready", label: "Partially Ready" },
  { level: "not_ready", label: "Not Ready" },
  { level: "not_assessed", label: "Not Assessed" },
];

export const REVIEW_STATUSES: { status: ReviewStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "completed", label: "Completed" },
  { status: "overdue", label: "Overdue" },
  { status: "not_required", label: "Not Required" },
  { status: "cancelled", label: "Cancelled" },
];

export const SUPPORT_PACKAGES: { pkg: SupportPackage; label: string }[] = [
  { pkg: "pathway_plan", label: "Pathway Plan" },
  { pkg: "personal_adviser", label: "Personal Adviser" },
  { pkg: "supported_housing", label: "Supported Housing" },
  { pkg: "financial_support", label: "Financial Support" },
  { pkg: "education_support", label: "Education Support" },
  { pkg: "health_plan", label: "Health Plan" },
  { pkg: "mental_health", label: "Mental Health" },
  { pkg: "employment_support", label: "Employment Support" },
  { pkg: "family_mediation", label: "Family Mediation" },
  { pkg: "peer_support", label: "Peer Support" },
  { pkg: "none_identified", label: "None Identified" },
  { pkg: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeDischargeMetrics(
  reviews: DischargeReview[],
): {
  total_reviews: number;
  fully_ready_count: number;
  not_ready_count: number;
  not_assessed_count: number;
  completed_reviews: number;
  overdue_reviews: number;
  child_views_rate: number;
  social_worker_involved_rate: number;
  family_consulted_rate: number;
  education_plan_rate: number;
  health_transferred_rate: number;
  life_story_rate: number;
  goodbye_event_rate: number;
  unplanned_breakdowns: number;
  by_discharge_reason: Record<string, number>;
  by_readiness_level: Record<string, number>;
  by_review_status: Record<string, number>;
  by_support_package: Record<string, number>;
} {
  const fullyReady = reviews.filter((r) => r.readiness_level === "fully_ready").length;
  const notReady = reviews.filter((r) => r.readiness_level === "not_ready").length;
  const notAssessed = reviews.filter((r) => r.readiness_level === "not_assessed").length;

  const completedReviews = reviews.filter((r) => r.review_status === "completed").length;
  const overdueReviews = reviews.filter((r) => r.review_status === "overdue").length;

  const childViews = reviews.filter((r) => r.child_views_recorded).length;
  const childRate =
    reviews.length > 0
      ? Math.round((childViews / reviews.length) * 1000) / 10
      : 0;

  const swInvolved = reviews.filter((r) => r.social_worker_involved).length;
  const swRate =
    reviews.length > 0
      ? Math.round((swInvolved / reviews.length) * 1000) / 10
      : 0;

  const familyConsulted = reviews.filter((r) => r.family_consulted).length;
  const familyRate =
    reviews.length > 0
      ? Math.round((familyConsulted / reviews.length) * 1000) / 10
      : 0;

  const educationPlan = reviews.filter((r) => r.education_plan_in_place).length;
  const eduRate =
    reviews.length > 0
      ? Math.round((educationPlan / reviews.length) * 1000) / 10
      : 0;

  const healthTransferred = reviews.filter((r) => r.health_needs_transferred).length;
  const healthRate =
    reviews.length > 0
      ? Math.round((healthTransferred / reviews.length) * 1000) / 10
      : 0;

  const lifeStory = reviews.filter((r) => r.life_story_work_complete).length;
  const lifeStoryRate =
    reviews.length > 0
      ? Math.round((lifeStory / reviews.length) * 1000) / 10
      : 0;

  const goodbye = reviews.filter((r) => r.goodbye_event_planned).length;
  const goodbyeRate =
    reviews.length > 0
      ? Math.round((goodbye / reviews.length) * 1000) / 10
      : 0;

  const breakdowns = reviews.filter((r) => r.discharge_reason === "unplanned_breakdown").length;

  const byReason: Record<string, number> = {};
  for (const r of reviews) byReason[r.discharge_reason] = (byReason[r.discharge_reason] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const r of reviews) byLevel[r.readiness_level] = (byLevel[r.readiness_level] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of reviews) byStatus[r.review_status] = (byStatus[r.review_status] ?? 0) + 1;

  const byPkg: Record<string, number> = {};
  for (const r of reviews) {
    for (const p of r.support_packages) byPkg[p] = (byPkg[p] ?? 0) + 1;
  }

  return {
    total_reviews: reviews.length,
    fully_ready_count: fullyReady,
    not_ready_count: notReady,
    not_assessed_count: notAssessed,
    completed_reviews: completedReviews,
    overdue_reviews: overdueReviews,
    child_views_rate: childRate,
    social_worker_involved_rate: swRate,
    family_consulted_rate: familyRate,
    education_plan_rate: eduRate,
    health_transferred_rate: healthRate,
    life_story_rate: lifeStoryRate,
    goodbye_event_rate: goodbyeRate,
    unplanned_breakdowns: breakdowns,
    by_discharge_reason: byReason,
    by_readiness_level: byLevel,
    by_review_status: byStatus,
    by_support_package: byPkg,
  };
}

export function identifyDischargeAlerts(
  reviews: DischargeReview[],
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

  // Not ready but discharge approaching
  for (const r of reviews) {
    if (r.readiness_level === "not_ready" && r.actual_date === null) {
      alerts.push({
        type: "not_ready",
        severity: "critical",
        message: `${r.child_name} is not ready for discharge (planned ${r.planned_date}) — review plan urgently`,
        id: r.id,
      });
    }
  }

  // Overdue reviews
  for (const r of reviews) {
    if (r.review_status === "overdue") {
      alerts.push({
        type: "review_overdue",
        severity: "high",
        message: `Discharge review for ${r.child_name} is overdue — complete review to ensure readiness`,
        id: r.id,
      });
    }
  }

  // Health needs not transferred
  for (const r of reviews) {
    if (!r.health_needs_transferred && r.actual_date !== null) {
      alerts.push({
        type: "health_not_transferred",
        severity: "high",
        message: `Health needs not transferred for ${r.child_name} who has already left — ensure continuity of healthcare`,
        id: r.id,
      });
    }
  }

  // Unplanned breakdowns
  for (const r of reviews) {
    if (r.discharge_reason === "unplanned_breakdown") {
      alerts.push({
        type: "unplanned_breakdown",
        severity: "high",
        message: `${r.child_name}'s placement ended as unplanned breakdown — conduct disruption review and identify learning`,
        id: r.id,
      });
    }
  }

  // Child views not recorded
  for (const r of reviews) {
    if (!r.child_views_recorded && r.actual_date === null) {
      alerts.push({
        type: "child_views_missing",
        severity: "medium",
        message: `${r.child_name}'s views not recorded for discharge planning — ensure participation in transition planning`,
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
    dischargeReason?: DischargeReason;
    readinessLevel?: ReadinessLevel;
    reviewStatus?: ReviewStatus;
    limit?: number;
  },
): Promise<ServiceResult<DischargeReview[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_discharge_reviews") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.dischargeReason) q = q.eq("discharge_reason", filters.dischargeReason);
  if (filters?.readinessLevel) q = q.eq("readiness_level", filters.readinessLevel);
  if (filters?.reviewStatus) q = q.eq("review_status", filters.reviewStatus);
  q = q.order("planned_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReview(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    dischargeReason: DischargeReason;
    plannedDate: string;
    actualDate?: string;
    readinessLevel: ReadinessLevel;
    reviewStatus: ReviewStatus;
    reviewDate?: string;
    reviewedBy?: string;
    destination?: string;
    supportPackages: SupportPackage[];
    childViewsRecorded: boolean;
    childWantsToLeave?: boolean;
    socialWorkerInvolved: boolean;
    familyConsulted: boolean;
    educationPlanInPlace: boolean;
    healthNeedsTransferred: boolean;
    lifeStoryWorkComplete: boolean;
    goodbyeEventPlanned: boolean;
    notes?: string;
  },
): Promise<ServiceResult<DischargeReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_discharge_reviews") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      discharge_reason: input.dischargeReason,
      planned_date: input.plannedDate,
      actual_date: input.actualDate ?? null,
      readiness_level: input.readinessLevel,
      review_status: input.reviewStatus,
      review_date: input.reviewDate ?? null,
      reviewed_by: input.reviewedBy ?? null,
      destination: input.destination ?? null,
      support_packages: input.supportPackages,
      child_views_recorded: input.childViewsRecorded,
      child_wants_to_leave: input.childWantsToLeave ?? null,
      social_worker_involved: input.socialWorkerInvolved,
      family_consulted: input.familyConsulted,
      education_plan_in_place: input.educationPlanInPlace,
      health_needs_transferred: input.healthNeedsTransferred,
      life_story_work_complete: input.lifeStoryWorkComplete,
      goodbye_event_planned: input.goodbyeEventPlanned,
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
): Promise<ServiceResult<DischargeReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_discharge_reviews") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeDischargeMetrics,
  identifyDischargeAlerts,
};
