// ══════════════════════════════════════════════════════════════════════════════
// CARA — VISITOR FEEDBACK COLLECTION SERVICE
// Captures feedback from visitors (parents, social workers,
// professionals, advocates) about the home environment and care.
// CHR 2015 Reg 44 (independent person — visits and reports),
// Reg 39 (complaints — learning from feedback).
//
// Covers: visitor type, feedback rating, visit purpose,
// satisfaction level, and improvement tracking.
//
// SCCIF: Leadership — "Feedback from stakeholders drives improvement."
// "Views of visitors are actively sought and valued."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type VisitorType =
  | "parent"
  | "social_worker"
  | "independent_visitor"
  | "advocate"
  | "therapist"
  | "education_professional"
  | "health_professional"
  | "ofsted_inspector"
  | "reg44_visitor"
  | "other";

export type FeedbackRating =
  | "excellent"
  | "good"
  | "satisfactory"
  | "poor"
  | "very_poor";

export type VisitPurpose =
  | "family_contact"
  | "professional_review"
  | "inspection"
  | "therapy_session"
  | "social_work_visit"
  | "advocacy_visit"
  | "health_appointment"
  | "education_meeting"
  | "reg44_visit"
  | "other";

export type SatisfactionLevel =
  | "very_satisfied"
  | "satisfied"
  | "neutral"
  | "dissatisfied"
  | "very_dissatisfied";

export interface VisitorFeedbackCollectionRecord {
  id: string;
  home_id: string;
  visitor_type: VisitorType;
  feedback_rating: FeedbackRating;
  visit_purpose: VisitPurpose;
  satisfaction_level: SatisfactionLevel;
  visit_date: string;
  visitor_name: string;
  collected_by: string;
  feedback_sought_proactively: boolean;
  child_views_included: boolean;
  environment_commented: boolean;
  staff_interaction_positive: boolean;
  concerns_raised: boolean;
  complaints_linked: boolean;
  action_plan_created: boolean;
  feedback_shared_with_team: boolean;
  improvement_identified: boolean;
  follow_up_arranged: boolean;
  anonymity_offered: boolean;
  manager_reviewed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const VISITOR_TYPES: { type: VisitorType; label: string }[] = [
  { type: "parent", label: "Parent" },
  { type: "social_worker", label: "Social Worker" },
  { type: "independent_visitor", label: "Independent Visitor" },
  { type: "advocate", label: "Advocate" },
  { type: "therapist", label: "Therapist" },
  { type: "education_professional", label: "Education Professional" },
  { type: "health_professional", label: "Health Professional" },
  { type: "ofsted_inspector", label: "Ofsted Inspector" },
  { type: "reg44_visitor", label: "Reg 44 Visitor" },
  { type: "other", label: "Other" },
];

export const FEEDBACK_RATINGS: { rating: FeedbackRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "satisfactory", label: "Satisfactory" },
  { rating: "poor", label: "Poor" },
  { rating: "very_poor", label: "Very Poor" },
];

export const VISIT_PURPOSES: { purpose: VisitPurpose; label: string }[] = [
  { purpose: "family_contact", label: "Family Contact" },
  { purpose: "professional_review", label: "Professional Review" },
  { purpose: "inspection", label: "Inspection" },
  { purpose: "therapy_session", label: "Therapy Session" },
  { purpose: "social_work_visit", label: "Social Work Visit" },
  { purpose: "advocacy_visit", label: "Advocacy Visit" },
  { purpose: "health_appointment", label: "Health Appointment" },
  { purpose: "education_meeting", label: "Education Meeting" },
  { purpose: "reg44_visit", label: "Reg 44 Visit" },
  { purpose: "other", label: "Other" },
];

export const SATISFACTION_LEVELS: { level: SatisfactionLevel; label: string }[] = [
  { level: "very_satisfied", label: "Very Satisfied" },
  { level: "satisfied", label: "Satisfied" },
  { level: "neutral", label: "Neutral" },
  { level: "dissatisfied", label: "Dissatisfied" },
  { level: "very_dissatisfied", label: "Very Dissatisfied" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeVisitorFeedbackMetrics(
  records: VisitorFeedbackCollectionRecord[],
): {
  total_feedback: number;
  poor_rating_count: number;
  very_poor_rating_count: number;
  dissatisfied_count: number;
  concerns_raised_count: number;
  feedback_sought_rate: number | null;
  child_views_rate: number | null;
  environment_commented_rate: number | null;
  staff_interaction_rate: number | null;
  action_plan_rate: number | null;
  feedback_shared_rate: number | null;
  improvement_rate: number | null;
  follow_up_rate: number | null;
  anonymity_rate: number | null;
  manager_reviewed_rate: number | null;
  recorded_promptly_rate: number | null;
  by_visitor_type: Record<string, number>;
  by_feedback_rating: Record<string, number>;
  by_visit_purpose: Record<string, number>;
  by_satisfaction_level: Record<string, number>;
} {
  const poorRating = records.filter((r) => r.feedback_rating === "poor").length;
  const veryPoorRating = records.filter((r) => r.feedback_rating === "very_poor").length;
  const dissatisfied = records.filter((r) => r.satisfaction_level === "dissatisfied" || r.satisfaction_level === "very_dissatisfied").length;
  const concernsRaised = records.filter((r) => r.concerns_raised).length;

  const boolRate = (field: keyof VisitorFeedbackCollectionRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.visitor_type] = (byType[r.visitor_type] ?? 0) + 1;

  const byRating: Record<string, number> = {};
  for (const r of records) byRating[r.feedback_rating] = (byRating[r.feedback_rating] ?? 0) + 1;

  const byPurpose: Record<string, number> = {};
  for (const r of records) byPurpose[r.visit_purpose] = (byPurpose[r.visit_purpose] ?? 0) + 1;

  const bySatisfaction: Record<string, number> = {};
  for (const r of records) bySatisfaction[r.satisfaction_level] = (bySatisfaction[r.satisfaction_level] ?? 0) + 1;

  return {
    total_feedback: records.length,
    poor_rating_count: poorRating,
    very_poor_rating_count: veryPoorRating,
    dissatisfied_count: dissatisfied,
    concerns_raised_count: concernsRaised,
    feedback_sought_rate: boolRate("feedback_sought_proactively"),
    child_views_rate: boolRate("child_views_included"),
    environment_commented_rate: boolRate("environment_commented"),
    staff_interaction_rate: boolRate("staff_interaction_positive"),
    action_plan_rate: boolRate("action_plan_created"),
    feedback_shared_rate: boolRate("feedback_shared_with_team"),
    improvement_rate: boolRate("improvement_identified"),
    follow_up_rate: boolRate("follow_up_arranged"),
    anonymity_rate: boolRate("anonymity_offered"),
    manager_reviewed_rate: boolRate("manager_reviewed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    by_visitor_type: byType,
    by_feedback_rating: byRating,
    by_visit_purpose: byPurpose,
    by_satisfaction_level: bySatisfaction,
  };
}

export function identifyVisitorFeedbackAlerts(
  records: VisitorFeedbackCollectionRecord[],
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

  // Very poor with concerns raised
  for (const r of records) {
    if (r.feedback_rating === "very_poor" && r.concerns_raised) {
      alerts.push({
        type: "very_poor_with_concerns",
        severity: "critical",
        message: `${r.visitor_name} (${r.visitor_type.replace(/_/g, " ")}) gave very poor feedback with concerns — investigate urgently`,
        id: r.id,
      });
    }
  }

  // Improvement not identified
  const noImprovement = records.filter((r) => !r.improvement_identified).length;
  if (noImprovement >= 1) {
    alerts.push({
      type: "no_improvement_identified",
      severity: "high",
      message: `${noImprovement} ${noImprovement === 1 ? "feedback has" : "feedbacks have"} no improvement identified — review learning opportunities`,
      id: "no_improvement_identified",
    });
  }

  // Feedback not shared with team
  const notShared = records.filter((r) => !r.feedback_shared_with_team).length;
  if (notShared >= 1) {
    alerts.push({
      type: "feedback_not_shared",
      severity: "high",
      message: `${notShared} ${notShared === 1 ? "feedback has" : "feedbacks have"} not been shared with team — ensure organisational learning`,
      id: "feedback_not_shared",
    });
  }

  // Follow-up not arranged
  const noFollowUp = records.filter((r) => !r.follow_up_arranged).length;
  if (noFollowUp >= 2) {
    alerts.push({
      type: "no_follow_up",
      severity: "medium",
      message: `${noFollowUp} feedbacks without follow-up arranged — strengthen feedback loop`,
      id: "no_follow_up",
    });
  }

  // Manager not reviewed
  const noManagerReview = records.filter((r) => !r.manager_reviewed).length;
  if (noManagerReview >= 2) {
    alerts.push({
      type: "manager_not_reviewed",
      severity: "medium",
      message: `${noManagerReview} feedbacks without manager review — ensure oversight`,
      id: "manager_not_reviewed",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    visitorType?: VisitorType;
    feedbackRating?: FeedbackRating;
    visitPurpose?: VisitPurpose;
    satisfactionLevel?: SatisfactionLevel;
    limit?: number;
  },
): Promise<ServiceResult<VisitorFeedbackCollectionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_visitor_feedback_collection") as SB).select("*").eq("home_id", homeId);
  if (filters?.visitorType) q = q.eq("visitor_type", filters.visitorType);
  if (filters?.feedbackRating) q = q.eq("feedback_rating", filters.feedbackRating);
  if (filters?.visitPurpose) q = q.eq("visit_purpose", filters.visitPurpose);
  if (filters?.satisfactionLevel) q = q.eq("satisfaction_level", filters.satisfactionLevel);
  q = q.order("visit_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    visitorType: VisitorType;
    feedbackRating: FeedbackRating;
    visitPurpose: VisitPurpose;
    satisfactionLevel: SatisfactionLevel;
    visitDate: string;
    visitorName: string;
    collectedBy: string;
    feedbackSoughtProactively?: boolean;
    childViewsIncluded?: boolean;
    environmentCommented?: boolean;
    staffInteractionPositive?: boolean;
    concernsRaised?: boolean;
    complaintsLinked?: boolean;
    actionPlanCreated?: boolean;
    feedbackSharedWithTeam?: boolean;
    improvementIdentified?: boolean;
    followUpArranged?: boolean;
    anonymityOffered?: boolean;
    managerReviewed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<VisitorFeedbackCollectionRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_visitor_feedback_collection") as SB)
    .insert({
      home_id: payload.homeId,
      visitor_type: payload.visitorType,
      feedback_rating: payload.feedbackRating,
      visit_purpose: payload.visitPurpose,
      satisfaction_level: payload.satisfactionLevel,
      visit_date: payload.visitDate,
      visitor_name: payload.visitorName,
      collected_by: payload.collectedBy,
      feedback_sought_proactively: payload.feedbackSoughtProactively ?? true,
      child_views_included: payload.childViewsIncluded ?? true,
      environment_commented: payload.environmentCommented ?? true,
      staff_interaction_positive: payload.staffInteractionPositive ?? true,
      concerns_raised: payload.concernsRaised ?? false,
      complaints_linked: payload.complaintsLinked ?? false,
      action_plan_created: payload.actionPlanCreated ?? true,
      feedback_shared_with_team: payload.feedbackSharedWithTeam ?? true,
      improvement_identified: payload.improvementIdentified ?? true,
      follow_up_arranged: payload.followUpArranged ?? true,
      anonymity_offered: payload.anonymityOffered ?? true,
      manager_reviewed: payload.managerReviewed ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
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
    visitorType: VisitorType;
    feedbackRating: FeedbackRating;
    visitPurpose: VisitPurpose;
    satisfactionLevel: SatisfactionLevel;
    visitDate: string;
    visitorName: string;
    collectedBy: string;
    feedbackSoughtProactively: boolean;
    childViewsIncluded: boolean;
    environmentCommented: boolean;
    staffInteractionPositive: boolean;
    concernsRaised: boolean;
    complaintsLinked: boolean;
    actionPlanCreated: boolean;
    feedbackSharedWithTeam: boolean;
    improvementIdentified: boolean;
    followUpArranged: boolean;
    anonymityOffered: boolean;
    managerReviewed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<VisitorFeedbackCollectionRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.visitorType !== undefined) mapped.visitor_type = updates.visitorType;
  if (updates.feedbackRating !== undefined) mapped.feedback_rating = updates.feedbackRating;
  if (updates.visitPurpose !== undefined) mapped.visit_purpose = updates.visitPurpose;
  if (updates.satisfactionLevel !== undefined) mapped.satisfaction_level = updates.satisfactionLevel;
  if (updates.visitDate !== undefined) mapped.visit_date = updates.visitDate;
  if (updates.visitorName !== undefined) mapped.visitor_name = updates.visitorName;
  if (updates.collectedBy !== undefined) mapped.collected_by = updates.collectedBy;
  if (updates.feedbackSoughtProactively !== undefined) mapped.feedback_sought_proactively = updates.feedbackSoughtProactively;
  if (updates.childViewsIncluded !== undefined) mapped.child_views_included = updates.childViewsIncluded;
  if (updates.environmentCommented !== undefined) mapped.environment_commented = updates.environmentCommented;
  if (updates.staffInteractionPositive !== undefined) mapped.staff_interaction_positive = updates.staffInteractionPositive;
  if (updates.concernsRaised !== undefined) mapped.concerns_raised = updates.concernsRaised;
  if (updates.complaintsLinked !== undefined) mapped.complaints_linked = updates.complaintsLinked;
  if (updates.actionPlanCreated !== undefined) mapped.action_plan_created = updates.actionPlanCreated;
  if (updates.feedbackSharedWithTeam !== undefined) mapped.feedback_shared_with_team = updates.feedbackSharedWithTeam;
  if (updates.improvementIdentified !== undefined) mapped.improvement_identified = updates.improvementIdentified;
  if (updates.followUpArranged !== undefined) mapped.follow_up_arranged = updates.followUpArranged;
  if (updates.anonymityOffered !== undefined) mapped.anonymity_offered = updates.anonymityOffered;
  if (updates.managerReviewed !== undefined) mapped.manager_reviewed = updates.managerReviewed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_visitor_feedback_collection") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeVisitorFeedbackMetrics,
  identifyVisitorFeedbackAlerts,
};
