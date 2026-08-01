// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF REVIEW OUTCOME SERVICE
// Records outcomes of formal and informal staff reviews — supervision
// sessions, probation reviews, annual appraisals, return-to-work meetings,
// and performance conversations. Part of the Cara Staff Development,
// Support and Risk Intelligence layer.
//
// CHR 2015 Reg 33 (employment of staff — review and development),
// Reg 34 (fitness of workers — ongoing assessment),
// Reg 13 (leadership and management — effective oversight).
//
// Strengths-based, fair, contextual, evidence-led.
//
// SCCIF: Well-Led — "Leaders ensure staff receive regular reviews that
// support professional development." "Staff feel valued and are helped
// to improve their practice."
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
  | "supervision"
  | "probation_review"
  | "annual_appraisal"
  | "return_to_work"
  | "performance_conversation"
  | "informal_check_in"
  | "capability_review"
  | "sickness_review"
  | "team_review"
  | "other";

export type ReviewOutcome =
  | "excellent"
  | "good"
  | "satisfactory"
  | "needs_improvement"
  | "unsatisfactory";

export type OutcomeStatus =
  | "draft"
  | "agreed"
  | "disputed"
  | "under_appeal"
  | "finalised";

export type FollowUpUrgency =
  | "immediate"
  | "within_week"
  | "within_month"
  | "next_review"
  | "none_required";

export interface StaffReviewOutcomeRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  review_type: ReviewType;
  review_outcome: ReviewOutcome;
  outcome_status: OutcomeStatus;
  follow_up_urgency: FollowUpUrgency;
  session_date: string;
  reviewed_by: string;
  strengths_discussed: string;
  areas_for_development: string;
  agreed_actions: string | null;
  staff_response: string | null;
  support_identified: string | null;
  training_needs: string | null;
  concerns_raised: string | null;
  previous_actions_progress: string | null;
  manager_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  next_review_date: string | null;
  notes: string | null;
  strengths_acknowledged: boolean;
  development_discussed: boolean;
  actions_agreed: boolean;
  staff_views_recorded: boolean;
  wellbeing_discussed: boolean;
  training_needs_identified: boolean;
  previous_actions_reviewed: boolean;
  support_offered: boolean;
  safeguarding_discussed: boolean;
  record_shared_with_staff: boolean;
  approved_by_senior: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REVIEW_TYPES: { type: ReviewType; label: string }[] = [
  { type: "supervision", label: "Supervision" },
  { type: "probation_review", label: "Probation Review" },
  { type: "annual_appraisal", label: "Annual Appraisal" },
  { type: "return_to_work", label: "Return to Work" },
  { type: "performance_conversation", label: "Performance Conversation" },
  { type: "informal_check_in", label: "Informal Check-In" },
  { type: "capability_review", label: "Capability Review" },
  { type: "sickness_review", label: "Sickness Review" },
  { type: "team_review", label: "Team Review" },
  { type: "other", label: "Other" },
];

export const REVIEW_OUTCOMES: { outcome: ReviewOutcome; label: string }[] = [
  { outcome: "excellent", label: "Excellent" },
  { outcome: "good", label: "Good" },
  { outcome: "satisfactory", label: "Satisfactory" },
  { outcome: "needs_improvement", label: "Needs Improvement" },
  { outcome: "unsatisfactory", label: "Unsatisfactory" },
];

export const OUTCOME_STATUSES: { status: OutcomeStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "agreed", label: "Agreed" },
  { status: "disputed", label: "Disputed" },
  { status: "under_appeal", label: "Under Appeal" },
  { status: "finalised", label: "Finalised" },
];

export const FOLLOW_UP_URGENCIES: { urgency: FollowUpUrgency; label: string }[] = [
  { urgency: "immediate", label: "Immediate" },
  { urgency: "within_week", label: "Within Week" },
  { urgency: "within_month", label: "Within Month" },
  { urgency: "next_review", label: "Next Review" },
  { urgency: "none_required", label: "None Required" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute review outcome metrics across all records.
 */
export function computeReviewOutcomeMetrics(
  records: StaffReviewOutcomeRecord[],
): {
  total_reviews: number;
  needs_improvement_count: number;
  immediate_followup_count: number;
  disputed_count: number;
  finalised_count: number;
  strengths_acknowledged_rate: number | null;
  development_discussed_rate: number | null;
  actions_agreed_rate: number | null;
  staff_views_rate: number | null;
  wellbeing_discussed_rate: number | null;
  training_needs_rate: number | null;
  previous_actions_rate: number | null;
  support_offered_rate: number | null;
  safeguarding_discussed_rate: number | null;
  record_shared_rate: number | null;
  approved_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_review_type: Record<string, number>;
  by_review_outcome: Record<string, number>;
  by_outcome_status: Record<string, number>;
  by_follow_up_urgency: Record<string, number>;
} {
  const needsImprovementCount = records.filter(
    (r) => r.review_outcome === "needs_improvement" || r.review_outcome === "unsatisfactory",
  ).length;

  const immediateFollowupCount = records.filter(
    (r) => r.follow_up_urgency === "immediate",
  ).length;

  const disputedCount = records.filter(
    (r) => r.outcome_status === "disputed" || r.outcome_status === "under_appeal",
  ).length;

  const finalisedCount = records.filter(
    (r) => r.outcome_status === "finalised",
  ).length;

  const boolRate = (field: keyof StaffReviewOutcomeRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byReviewType: Record<string, number> = {};
  for (const r of records) byReviewType[r.review_type] = (byReviewType[r.review_type] ?? 0) + 1;

  const byReviewOutcome: Record<string, number> = {};
  for (const r of records) byReviewOutcome[r.review_outcome] = (byReviewOutcome[r.review_outcome] ?? 0) + 1;

  const byOutcomeStatus: Record<string, number> = {};
  for (const r of records) byOutcomeStatus[r.outcome_status] = (byOutcomeStatus[r.outcome_status] ?? 0) + 1;

  const byFollowUpUrgency: Record<string, number> = {};
  for (const r of records) byFollowUpUrgency[r.follow_up_urgency] = (byFollowUpUrgency[r.follow_up_urgency] ?? 0) + 1;

  return {
    total_reviews: records.length,
    needs_improvement_count: needsImprovementCount,
    immediate_followup_count: immediateFollowupCount,
    disputed_count: disputedCount,
    finalised_count: finalisedCount,
    strengths_acknowledged_rate: boolRate("strengths_acknowledged"),
    development_discussed_rate: boolRate("development_discussed"),
    actions_agreed_rate: boolRate("actions_agreed"),
    staff_views_rate: boolRate("staff_views_recorded"),
    wellbeing_discussed_rate: boolRate("wellbeing_discussed"),
    training_needs_rate: boolRate("training_needs_identified"),
    previous_actions_rate: boolRate("previous_actions_reviewed"),
    support_offered_rate: boolRate("support_offered"),
    safeguarding_discussed_rate: boolRate("safeguarding_discussed"),
    record_shared_rate: boolRate("record_shared_with_staff"),
    approved_rate: boolRate("approved_by_senior"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: uniqueStaff,
    by_review_type: byReviewType,
    by_review_outcome: byReviewOutcome,
    by_outcome_status: byOutcomeStatus,
    by_follow_up_urgency: byFollowUpUrgency,
  };
}

/**
 * Identify review outcome alerts requiring management attention.
 */
export function identifyReviewOutcomeAlerts(
  records: StaffReviewOutcomeRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical per-record: immediate follow-up AND unsatisfactory/needs_improvement
  for (const r of records) {
    if (
      r.follow_up_urgency === "immediate" &&
      (r.review_outcome === "needs_improvement" || r.review_outcome === "unsatisfactory")
    ) {
      alerts.push({
        type: "immediate_unsatisfactory",
        severity: "critical",
        message: `${r.staff_name} has an unsatisfactory review requiring immediate follow-up — manager action needed.`,
        record_id: r.id,
      });
    }
  }

  // High: staff views not recorded (>= 1)
  const staffViewsNotRecordedCount = records.filter((r) => r.staff_views_recorded === false).length;
  if (staffViewsNotRecordedCount >= 1) {
    alerts.push({
      type: "staff_views_not_recorded",
      severity: "high",
      message: `${staffViewsNotRecordedCount} review${staffViewsNotRecordedCount === 1 ? " has" : "s have"} staff views not recorded.`,
    });
  }

  // High: no strengths acknowledged (>= 1)
  const noStrengthsCount = records.filter((r) => r.strengths_acknowledged === false).length;
  if (noStrengthsCount >= 1) {
    alerts.push({
      type: "no_strengths_acknowledged",
      severity: "high",
      message: `${noStrengthsCount} review${noStrengthsCount === 1 ? " has" : "s have"} no strengths acknowledged.`,
    });
  }

  // Medium: no wellbeing discussed (>= 2)
  const noWellbeingCount = records.filter((r) => r.wellbeing_discussed === false).length;
  if (noWellbeingCount >= 2) {
    alerts.push({
      type: "no_wellbeing_discussed",
      severity: "medium",
      message: `${noWellbeingCount} review${noWellbeingCount === 1 ? " has" : "s have"} no wellbeing discussed.`,
    });
  }

  // Medium: no safeguarding discussed (>= 2)
  const noSafeguardingCount = records.filter((r) => r.safeguarding_discussed === false).length;
  if (noSafeguardingCount >= 2) {
    alerts.push({
      type: "no_safeguarding_discussed",
      severity: "medium",
      message: `${noSafeguardingCount} review${noSafeguardingCount === 1 ? " has" : "s have"} no safeguarding discussed.`,
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listReviewOutcomes(
  homeId: string,
): Promise<ServiceResult<StaffReviewOutcomeRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_staff_review_outcomes") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReviewOutcome(
  input: {
    homeId: string;
    staffName: string;
    staffId?: string | null;
    reviewType: ReviewType;
    reviewOutcome: ReviewOutcome;
    outcomeStatus: OutcomeStatus;
    followUpUrgency: FollowUpUrgency;
    sessionDate: string;
    reviewedBy: string;
    strengthsDiscussed: string;
    areasForDevelopment: string;
    agreedActions?: string;
    staffResponse?: string;
    supportIdentified?: string;
    trainingNeeds?: string;
    concernsRaised?: string;
    previousActionsProgress?: string;
    managerNotes?: string;
    approvedBy?: string;
    approvedAt?: string;
    nextReviewDate?: string;
    notes?: string;
    strengthsAcknowledged: boolean;
    developmentDiscussed: boolean;
    actionsAgreed: boolean;
    staffViewsRecorded: boolean;
    wellbeingDiscussed: boolean;
    trainingNeedsIdentified: boolean;
    previousActionsReviewed: boolean;
    supportOffered: boolean;
    safeguardingDiscussed: boolean;
    recordSharedWithStaff: boolean;
    approvedBySenior: boolean;
    recordedPromptly: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
  },
): Promise<ServiceResult<StaffReviewOutcomeRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_review_outcomes") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      review_type: input.reviewType,
      review_outcome: input.reviewOutcome,
      outcome_status: input.outcomeStatus,
      follow_up_urgency: input.followUpUrgency,
      session_date: input.sessionDate,
      reviewed_by: input.reviewedBy,
      strengths_discussed: input.strengthsDiscussed,
      areas_for_development: input.areasForDevelopment,
      agreed_actions: input.agreedActions ?? null,
      staff_response: input.staffResponse ?? null,
      support_identified: input.supportIdentified ?? null,
      training_needs: input.trainingNeeds ?? null,
      concerns_raised: input.concernsRaised ?? null,
      previous_actions_progress: input.previousActionsProgress ?? null,
      manager_notes: input.managerNotes ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
      strengths_acknowledged: input.strengthsAcknowledged,
      development_discussed: input.developmentDiscussed,
      actions_agreed: input.actionsAgreed,
      staff_views_recorded: input.staffViewsRecorded,
      wellbeing_discussed: input.wellbeingDiscussed,
      training_needs_identified: input.trainingNeedsIdentified,
      previous_actions_reviewed: input.previousActionsReviewed,
      support_offered: input.supportOffered,
      safeguarding_discussed: input.safeguardingDiscussed,
      record_shared_with_staff: input.recordSharedWithStaff,
      approved_by_senior: input.approvedBySenior,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReviewOutcome(
  id: string,
  updates: Partial<Omit<StaffReviewOutcomeRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffReviewOutcomeRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_review_outcomes") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeReviewOutcomeMetrics,
  identifyReviewOutcomeAlerts,
};
