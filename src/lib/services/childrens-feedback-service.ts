// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S FEEDBACK SERVICE
// Tracks satisfaction surveys, feedback forms, suggestions, and outcomes
// to ensure children's voices shape the home's development.
// CHR 2015 Reg 7 (quality of care — responsive to views),
// Reg 10 (children's views — consultation and feedback),
// Reg 45 (review of quality — child-informed improvement).
//
// Covers: satisfaction surveys, feedback sessions, suggestion boxes,
// response tracking, outcome monitoring, and trend analysis.
//
// SCCIF: Overall Experiences — "Children's views are actively sought."
// "Feedback leads to tangible improvements in the home."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type FeedbackType =
  | "satisfaction_survey"
  | "feedback_session"
  | "suggestion_box"
  | "exit_interview"
  | "house_meeting_feedback"
  | "complaints_feedback"
  | "activity_feedback"
  | "food_feedback"
  | "environment_feedback"
  | "other";

export type SatisfactionRating =
  | "very_happy"
  | "happy"
  | "neutral"
  | "unhappy"
  | "very_unhappy";

export type ResponseStatus =
  | "pending"
  | "acknowledged"
  | "in_progress"
  | "completed"
  | "not_actioned";

export type FeedbackCategory =
  | "care_quality"
  | "food_mealtimes"
  | "activities"
  | "bedroom_space"
  | "staff_relationships"
  | "safety_feeling"
  | "education_support"
  | "contact_family"
  | "rules_boundaries"
  | "general";

export interface ChildrensFeedbackRecord {
  id: string;
  home_id: string;
  feedback_type: FeedbackType;
  feedback_date: string;
  satisfaction_rating: SatisfactionRating;
  response_status: ResponseStatus;
  feedback_category: FeedbackCategory;
  child_name: string;
  child_id: string | null;
  child_chose_method: boolean;
  child_comfortable_sharing: boolean;
  anonymous_option_offered: boolean;
  feedback_discussed_with_child: boolean;
  changes_implemented: boolean;
  child_informed_of_outcome: boolean;
  child_satisfied_with_response: boolean;
  staff_responsive: boolean;
  themes_identified: string[];
  improvements_suggested: string[];
  actions_taken: string[];
  issues_found: string[];
  collected_by: string;
  response_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const FEEDBACK_TYPES: { type: FeedbackType; label: string }[] = [
  { type: "satisfaction_survey", label: "Satisfaction Survey" },
  { type: "feedback_session", label: "Feedback Session" },
  { type: "suggestion_box", label: "Suggestion Box" },
  { type: "exit_interview", label: "Exit Interview" },
  { type: "house_meeting_feedback", label: "House Meeting Feedback" },
  { type: "complaints_feedback", label: "Complaints Feedback" },
  { type: "activity_feedback", label: "Activity Feedback" },
  { type: "food_feedback", label: "Food Feedback" },
  { type: "environment_feedback", label: "Environment Feedback" },
  { type: "other", label: "Other" },
];

export const SATISFACTION_RATINGS: { rating: SatisfactionRating; label: string }[] = [
  { rating: "very_happy", label: "Very Happy" },
  { rating: "happy", label: "Happy" },
  { rating: "neutral", label: "Neutral" },
  { rating: "unhappy", label: "Unhappy" },
  { rating: "very_unhappy", label: "Very Unhappy" },
];

export const RESPONSE_STATUSES: { status: ResponseStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "acknowledged", label: "Acknowledged" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "not_actioned", label: "Not Actioned" },
];

export const FEEDBACK_CATEGORIES: { category: FeedbackCategory; label: string }[] = [
  { category: "care_quality", label: "Care Quality" },
  { category: "food_mealtimes", label: "Food & Mealtimes" },
  { category: "activities", label: "Activities" },
  { category: "bedroom_space", label: "Bedroom & Space" },
  { category: "staff_relationships", label: "Staff Relationships" },
  { category: "safety_feeling", label: "Feeling Safe" },
  { category: "education_support", label: "Education Support" },
  { category: "contact_family", label: "Contact with Family" },
  { category: "rules_boundaries", label: "Rules & Boundaries" },
  { category: "general", label: "General" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeFeedbackMetrics(
  records: ChildrensFeedbackRecord[],
): {
  total_feedback: number;
  survey_count: number;
  session_count: number;
  suggestion_count: number;
  positive_rate: number | null;
  negative_rate: number | null;
  neutral_count: number;
  completed_rate: number | null;
  pending_count: number;
  not_actioned_count: number;
  child_chose_method_rate: number | null;
  child_comfortable_rate: number | null;
  anonymous_offered_rate: number | null;
  feedback_discussed_rate: number | null;
  changes_implemented_rate: number | null;
  child_informed_rate: number | null;
  child_satisfied_rate: number | null;
  staff_responsive_rate: number | null;
  unique_children: number;
  by_feedback_type: Record<string, number>;
  by_satisfaction_rating: Record<string, number>;
  by_response_status: Record<string, number>;
  by_feedback_category: Record<string, number>;
} {
  const survey = records.filter((r) => r.feedback_type === "satisfaction_survey").length;
  const session = records.filter((r) => r.feedback_type === "feedback_session").length;
  const suggestion = records.filter((r) => r.feedback_type === "suggestion_box").length;

  const positive = records.filter(
    (r) => r.satisfaction_rating === "very_happy" || r.satisfaction_rating === "happy",
  ).length;
  const positiveRate =
    records.length > 0
      ? Math.round((positive / records.length) * 1000) / 10
      : null;

  const negative = records.filter(
    (r) => r.satisfaction_rating === "unhappy" || r.satisfaction_rating === "very_unhappy",
  ).length;
  const negativeRate =
    records.length > 0
      ? Math.round((negative / records.length) * 1000) / 10
      : null;

  const neutralCount = records.filter((r) => r.satisfaction_rating === "neutral").length;

  const completed = records.filter((r) => r.response_status === "completed").length;
  const completedRate =
    records.length > 0
      ? Math.round((completed / records.length) * 1000) / 10
      : null;

  const pending = records.filter((r) => r.response_status === "pending").length;
  const notActioned = records.filter((r) => r.response_status === "not_actioned").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof ChildrensFeedbackRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.feedback_type] = (byType[r.feedback_type] ?? 0) + 1;

  const byRating: Record<string, number> = {};
  for (const r of records) byRating[r.satisfaction_rating] = (byRating[r.satisfaction_rating] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.response_status] = (byStatus[r.response_status] ?? 0) + 1;

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.feedback_category] = (byCategory[r.feedback_category] ?? 0) + 1;

  return {
    total_feedback: records.length,
    survey_count: survey,
    session_count: session,
    suggestion_count: suggestion,
    positive_rate: positiveRate,
    negative_rate: negativeRate,
    neutral_count: neutralCount,
    completed_rate: completedRate,
    pending_count: pending,
    not_actioned_count: notActioned,
    child_chose_method_rate: boolRate("child_chose_method"),
    child_comfortable_rate: boolRate("child_comfortable_sharing"),
    anonymous_offered_rate: boolRate("anonymous_option_offered"),
    feedback_discussed_rate: boolRate("feedback_discussed_with_child"),
    changes_implemented_rate: boolRate("changes_implemented"),
    child_informed_rate: boolRate("child_informed_of_outcome"),
    child_satisfied_rate: boolRate("child_satisfied_with_response"),
    staff_responsive_rate: boolRate("staff_responsive"),
    unique_children: uniqueChildren,
    by_feedback_type: byType,
    by_satisfaction_rating: byRating,
    by_response_status: byStatus,
    by_feedback_category: byCategory,
  };
}

export function identifyFeedbackAlerts(
  records: ChildrensFeedbackRecord[],
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

  // Very unhappy feedback
  for (const r of records) {
    if (r.satisfaction_rating === "very_unhappy") {
      alerts.push({
        type: "very_unhappy",
        severity: "critical",
        message: `${r.child_name} reported very unhappy feedback on ${r.feedback_date} about ${r.feedback_category.replace(/_/g, " ")} — respond urgently`,
        id: r.id,
      });
    }
  }

  // Not actioned feedback
  const notActioned = records.filter((r) => r.response_status === "not_actioned").length;
  if (notActioned >= 1) {
    alerts.push({
      type: "not_actioned",
      severity: "high",
      message: `${notActioned} ${notActioned === 1 ? "feedback item has" : "feedback items have"} not been actioned — respond to children's views`,
      id: "not_actioned",
    });
  }

  // Pending responses
  const pending = records.filter((r) => r.response_status === "pending").length;
  if (pending >= 3) {
    alerts.push({
      type: "pending_responses",
      severity: "high",
      message: `${pending} feedback responses are pending — acknowledge children's input promptly`,
      id: "pending_responses",
    });
  }

  // Child not informed of outcome
  const notInformed = records.filter(
    (r) => !r.child_informed_of_outcome && r.response_status === "completed",
  ).length;
  if (notInformed >= 1) {
    alerts.push({
      type: "child_not_informed",
      severity: "medium",
      message: `${notInformed} completed ${notInformed === 1 ? "response" : "responses"} where child not informed of outcome — close the feedback loop`,
      id: "child_not_informed",
    });
  }

  // Low child comfort
  const notComfortable = records.filter((r) => !r.child_comfortable_sharing).length;
  if (notComfortable >= 3) {
    alerts.push({
      type: "low_comfort",
      severity: "medium",
      message: `${notComfortable} children not comfortable sharing feedback — review feedback methods`,
      id: "low_comfort",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    feedbackType?: FeedbackType;
    satisfactionRating?: SatisfactionRating;
    responseStatus?: ResponseStatus;
    limit?: number;
  },
): Promise<ServiceResult<ChildrensFeedbackRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_childrens_feedback") as SB).select("*").eq("home_id", homeId);
  if (filters?.feedbackType) q = q.eq("feedback_type", filters.feedbackType);
  if (filters?.satisfactionRating) q = q.eq("satisfaction_rating", filters.satisfactionRating);
  if (filters?.responseStatus) q = q.eq("response_status", filters.responseStatus);
  q = q.order("feedback_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    feedbackType: FeedbackType;
    feedbackDate: string;
    satisfactionRating: SatisfactionRating;
    responseStatus: ResponseStatus;
    feedbackCategory: FeedbackCategory;
    childName: string;
    childId?: string;
    childChoseMethod: boolean;
    childComfortableSharing: boolean;
    anonymousOptionOffered: boolean;
    feedbackDiscussedWithChild: boolean;
    changesImplemented: boolean;
    childInformedOfOutcome: boolean;
    childSatisfiedWithResponse: boolean;
    staffResponsive: boolean;
    themesIdentified: string[];
    improvementsSuggested: string[];
    actionsTaken: string[];
    issuesFound: string[];
    collectedBy: string;
    responseDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<ChildrensFeedbackRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_feedback") as SB)
    .insert({
      home_id: input.homeId,
      feedback_type: input.feedbackType,
      feedback_date: input.feedbackDate,
      satisfaction_rating: input.satisfactionRating,
      response_status: input.responseStatus,
      feedback_category: input.feedbackCategory,
      child_name: input.childName,
      child_id: input.childId ?? null,
      child_chose_method: input.childChoseMethod,
      child_comfortable_sharing: input.childComfortableSharing,
      anonymous_option_offered: input.anonymousOptionOffered,
      feedback_discussed_with_child: input.feedbackDiscussedWithChild,
      changes_implemented: input.changesImplemented,
      child_informed_of_outcome: input.childInformedOfOutcome,
      child_satisfied_with_response: input.childSatisfiedWithResponse,
      staff_responsive: input.staffResponsive,
      themes_identified: input.themesIdentified,
      improvements_suggested: input.improvementsSuggested,
      actions_taken: input.actionsTaken,
      issues_found: input.issuesFound,
      collected_by: input.collectedBy,
      response_date: input.responseDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ChildrensFeedbackRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_feedback") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeFeedbackMetrics,
  identifyFeedbackAlerts,
};
