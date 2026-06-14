// ══════════════════════════════════════════════════════════════════════════════
// CARA — QUALITY OF CARE REVIEW SERVICE
// Manages Quality of Care Reviews required by CHR 2015 Regulation 45.
// The registered person must review the quality of care provided at least
// every 6 months, producing a report assessing whether children are well
// cared for, safe, and making progress.
//
// CHR 2015 Reg 45 — review of quality of care: the registered person must
// review the quality of care provided for children, and improve the quality
// of care provided at the children's home.
//
// The review must cover:
//   (a) the quality and purpose of care standard (Reg 6)
//   (b) the children's views, wishes and feelings standard (Reg 7)
//   (c) education, enjoyment and achievement (Reg 8)
//   (d) health and wellbeing (Reg 10)
//   (e) positive relationships (Reg 11)
//   (f) protection of children (Reg 12)
//   (g) leadership and management (Reg 13)
//
// Reg 45(4) — the registered person must produce a written report setting
// out the conclusions of each review, including any actions taken or
// intended to improve quality.
//
// SCCIF: Leadership & Management — "Leaders and managers systematically
// review the quality of care provided." "Regulation 45 reports evidence
// a thorough understanding of the home's strengths and areas for
// development."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const REVIEW_DOMAINS = [
  "overall_experiences",
  "education_achievement",
  "health_wellbeing",
  "positive_relationships",
  "protection_of_children",
  "leadership_management",
  "care_planning",
  "behaviour_management",
  "physical_environment",
  "complaints_feedback",
] as const;
export type ReviewDomain = (typeof REVIEW_DOMAINS)[number];

export const DOMAIN_RATINGS = [
  "outstanding",
  "good",
  "requires_improvement",
  "inadequate",
  "not_assessed",
] as const;
export type DomainRating = (typeof DOMAIN_RATINGS)[number];

export const REVIEW_FREQUENCIES = [
  "six_monthly",
  "annual",
  "triggered",
  "post_incident",
  "ofsted_required",
] as const;
export type ReviewFrequency = (typeof REVIEW_FREQUENCIES)[number];

export const ACTION_PRIORITIES = [
  "immediate",
  "high",
  "medium",
  "low",
  "completed",
] as const;
export type ActionPriority = (typeof ACTION_PRIORITIES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface QualityOfCareReviewRow {
  id: string;
  home_id: string;
  review_date: string;
  review_period_start: string;
  review_period_end: string;
  review_domain: ReviewDomain;
  domain_rating: DomainRating;
  review_frequency: ReviewFrequency;
  action_priority: ActionPriority;
  reviewer_name: string;
  children_consulted: boolean;
  staff_consulted: boolean;
  external_feedback_included: boolean;
  reg44_reports_reviewed: boolean;
  improvement_actions_identified: boolean;
  actions_assigned: boolean;
  shared_with_ofsted: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listQualityOfCareReviews(
  homeId: string,
): Promise<ServiceResult<QualityOfCareReviewRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_quality_of_care_reviews") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("review_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createQualityOfCareReview(input: {
  homeId: string;
  reviewDate: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  reviewDomain: ReviewDomain;
  domainRating: DomainRating;
  reviewFrequency: ReviewFrequency;
  actionPriority: ActionPriority;
  reviewerName: string;
  childrenConsulted: boolean;
  staffConsulted: boolean;
  externalFeedbackIncluded: boolean;
  reg44ReportsReviewed: boolean;
  improvementActionsIdentified: boolean;
  actionsAssigned: boolean;
  sharedWithOfsted: boolean;
  notes?: string | null;
}): Promise<ServiceResult<QualityOfCareReviewRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_quality_of_care_reviews") as any)
    .insert({
      home_id: input.homeId,
      review_date: input.reviewDate,
      review_period_start: input.reviewPeriodStart,
      review_period_end: input.reviewPeriodEnd,
      review_domain: input.reviewDomain,
      domain_rating: input.domainRating,
      review_frequency: input.reviewFrequency,
      action_priority: input.actionPriority,
      reviewer_name: input.reviewerName,
      children_consulted: input.childrenConsulted,
      staff_consulted: input.staffConsulted,
      external_feedback_included: input.externalFeedbackIncluded,
      reg44_reports_reviewed: input.reg44ReportsReviewed,
      improvement_actions_identified: input.improvementActionsIdentified,
      actions_assigned: input.actionsAssigned,
      shared_with_ofsted: input.sharedWithOfsted,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeQualityOfCareMetrics(
  rows: QualityOfCareReviewRow[],
): {
  total_reviews: number;
  inadequate_count: number;
  requires_improvement_count: number;
  immediate_priority_count: number;
  actions_not_assigned_count: number;
  children_consulted_rate: number;
  staff_consulted_rate: number;
  external_feedback_rate: number;
  reg44_reviewed_rate: number;
  shared_with_ofsted_rate: number;
  domain_breakdown: Record<string, number>;
  rating_breakdown: Record<string, number>;
  unique_reviewers: number;
} {
  const total = rows.length;

  const inadequate = rows.filter((r) => r.domain_rating === "inadequate").length;
  const requiresImprovement = rows.filter((r) => r.domain_rating === "requires_improvement").length;
  const immediatePriority = rows.filter((r) => r.action_priority === "immediate").length;
  const actionsNotAssigned = rows.filter((r) => r.improvement_actions_identified && !r.actions_assigned).length;

  const childrenConsulted = rows.filter((r) => r.children_consulted).length;
  const childrenConsultedRate =
    total > 0
      ? Math.round((childrenConsulted / total) * 1000) / 10
      : 0;

  const staffConsulted = rows.filter((r) => r.staff_consulted).length;
  const staffConsultedRate =
    total > 0
      ? Math.round((staffConsulted / total) * 1000) / 10
      : 0;

  const externalFeedback = rows.filter((r) => r.external_feedback_included).length;
  const externalFeedbackRate =
    total > 0
      ? Math.round((externalFeedback / total) * 1000) / 10
      : 0;

  const reg44Reviewed = rows.filter((r) => r.reg44_reports_reviewed).length;
  const reg44ReviewedRate =
    total > 0
      ? Math.round((reg44Reviewed / total) * 1000) / 10
      : 0;

  const sharedWithOfsted = rows.filter((r) => r.shared_with_ofsted).length;
  const sharedWithOfstedRate =
    total > 0
      ? Math.round((sharedWithOfsted / total) * 1000) / 10
      : 0;

  const domainBreakdown: Record<string, number> = {};
  for (const r of rows) domainBreakdown[r.review_domain] = (domainBreakdown[r.review_domain] ?? 0) + 1;

  const ratingBreakdown: Record<string, number> = {};
  for (const r of rows) ratingBreakdown[r.domain_rating] = (ratingBreakdown[r.domain_rating] ?? 0) + 1;

  const uniqueReviewers = new Set(rows.map((r) => r.reviewer_name)).size;

  return {
    total_reviews: total,
    inadequate_count: inadequate,
    requires_improvement_count: requiresImprovement,
    immediate_priority_count: immediatePriority,
    actions_not_assigned_count: actionsNotAssigned,
    children_consulted_rate: childrenConsultedRate,
    staff_consulted_rate: staffConsultedRate,
    external_feedback_rate: externalFeedbackRate,
    reg44_reviewed_rate: reg44ReviewedRate,
    shared_with_ofsted_rate: sharedWithOfstedRate,
    domain_breakdown: domainBreakdown,
    rating_breakdown: ratingBreakdown,
    unique_reviewers: uniqueReviewers,
  };
}

export function computeQualityOfCareAlerts(
  rows: QualityOfCareReviewRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: inadequate rating with immediate priority
  for (const r of rows) {
    if (r.domain_rating === "inadequate" && r.action_priority === "immediate") {
      alerts.push({
        type: "inadequate_immediate",
        severity: "critical",
        message: `Quality of care review rated ${r.review_domain.replace(/_/g, " ")} as inadequate with immediate priority — urgent improvement action required to protect children's welfare`,
        record_id: r.id,
      });
    }
  }

  // High: requires_improvement with actions not assigned
  for (const r of rows) {
    if (r.domain_rating === "requires_improvement" && !r.actions_assigned) {
      alerts.push({
        type: "improvement_actions_not_assigned",
        severity: "high",
        message: `Quality of care review for ${r.review_domain.replace(/_/g, " ")} requires improvement but actions have not been assigned — allocate responsibility to drive improvement`,
        record_id: r.id,
      });
    }
  }

  // High: children not consulted in multiple reviews
  const notConsulted = rows.filter((r) => !r.children_consulted);
  if (notConsulted.length >= 2) {
    alerts.push({
      type: "children_not_consulted",
      severity: "high",
      message: `${notConsulted.length} quality of care reviews did not consult children — Reg 45 requires children's views to be sought as part of the review process`,
    });
  }

  // Medium: Reg 44 reports not reviewed
  const reg44NotReviewed = rows.filter((r) => !r.reg44_reports_reviewed);
  if (reg44NotReviewed.length >= 1) {
    alerts.push({
      type: "reg44_not_reviewed",
      severity: "medium",
      message: `${reg44NotReviewed.length} quality of care ${reg44NotReviewed.length === 1 ? "review has" : "reviews have"} not reviewed Reg 44 independent visitor reports — these reports should inform the quality of care assessment`,
    });
  }

  return alerts;
}

export function generateQualityOfCareCaraInsights(
  metrics: ReturnType<typeof computeQualityOfCareMetrics>,
  alerts: ReturnType<typeof computeQualityOfCareAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (cyan-themed)
  insights.push(
    `[cyan] ${metrics.total_reviews} quality of care reviews recorded across ${metrics.unique_reviewers} ${metrics.unique_reviewers === 1 ? "reviewer" : "reviewers"}. ` +
      `Children consulted in ${metrics.children_consulted_rate}% of reviews, staff consulted in ${metrics.staff_consulted_rate}%, ` +
      `and Reg 44 reports reviewed in ${metrics.reg44_reviewed_rate}% of reviews.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.inadequate_count} inadequate ratings, ${metrics.requires_improvement_count} requiring improvement, ` +
        `and ${metrics.actions_not_assigned_count} reviews with improvement actions not yet assigned.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.inadequate_count} inadequate and ${metrics.requires_improvement_count} requiring improvement. ` +
        `Continue systematic review to maintain quality of care standards across all domains.`,
    );
  }

  // Insight 3: Reflective question about quality of care
  if (metrics.inadequate_count > 0) {
    insights.push(
      `[reflect] ${metrics.inadequate_count} ${metrics.inadequate_count === 1 ? "domain has" : "domains have"} been rated inadequate. ` +
        `What systemic factors are contributing to these ratings, and how can the home mobilise ` +
        `resources to ensure children receive the quality of care they deserve?`,
    );
  } else if (metrics.children_consulted_rate < 100) {
    insights.push(
      `[reflect] Children were consulted in ${metrics.children_consulted_rate}% of reviews. ` +
        `Are there barriers to consulting children in every review, and could strengthening ` +
        `children's participation lead to more meaningful quality improvements?`,
    );
  } else {
    insights.push(
      `[reflect] All reviews have consulted children and no inadequate ratings have been recorded. ` +
        `How can the home build on this strong foundation to move from good to outstanding ` +
        `across all quality of care domains?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeQualityOfCareMetrics,
  computeQualityOfCareAlerts,
  generateQualityOfCareCaraInsights,
};
