// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ATMOSPHERE ASSESSMENT SERVICE
// Manages regular assessments of home warmth, belonging, relationships,
// sense of home, children feeling safe and cared for, and overall
// environment quality within the residential setting.
// CHR 2015 Reg 6 (quality of care — homely environment),
// Reg 10 (enjoyment and achievement — positive relationships),
// Reg 11 (positive relationships — warmth and belonging).
//
// Covers: atmosphere dimensions (warmth, belonging, relationships,
// safety feeling, personalisation, noise/calm, privacy, routines,
// fun/enjoyment), multi-source assessment methods, action tracking,
// and child/staff/visitor view inclusion.
//
// SCCIF: Experiences — "Children feel safe, valued, and cared for."
// "The home atmosphere is warm, welcoming, and child-centred."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const ATMOSPHERE_DIMENSIONS = [
  "warmth_welcome",
  "sense_of_belonging",
  "child_relationships",
  "staff_child_rapport",
  "safety_feeling",
  "personalisation",
  "noise_calm",
  "privacy_respect",
  "routine_predictability",
  "fun_enjoyment",
] as const;
export type AtmosphereDimension = (typeof ATMOSPHERE_DIMENSIONS)[number];

export const ATMOSPHERE_RATINGS = [
  "excellent",
  "good",
  "adequate",
  "requires_improvement",
  "inadequate",
] as const;
export type AtmosphereRating = (typeof ATMOSPHERE_RATINGS)[number];

export const ASSESSMENT_METHODS = [
  "child_interview",
  "staff_observation",
  "reg44_visitor",
  "social_worker_visit",
  "manager_walkthrough",
  "peer_feedback",
  "family_feedback",
  "multi_agency_view",
  "ofsted_feedback",
  "self_assessment",
] as const;
export type AssessmentMethod = (typeof ASSESSMENT_METHODS)[number];

export const ACTIONS_REQUIRED = [
  "none",
  "monitor",
  "minor_action",
  "significant_action",
  "urgent_action",
] as const;
export type ActionRequired = (typeof ACTIONS_REQUIRED)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface HomeAtmosphereAssessmentRow {
  id: string;
  home_id: string;
  assessment_date: string;
  atmosphere_dimension: AtmosphereDimension;
  atmosphere_rating: AtmosphereRating;
  assessment_method: AssessmentMethod;
  action_required: ActionRequired;
  assessor_name: string;
  child_views_included: boolean;
  staff_views_included: boolean;
  visitor_views_included: boolean;
  improvement_actions_identified: boolean;
  actions_implemented: boolean;
  shared_with_children: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listHomeAtmosphereAssessments(
  homeId: string,
): Promise<ServiceResult<HomeAtmosphereAssessmentRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_home_atmosphere_assessments") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("assessment_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeAtmosphereAssessment(input: {
  homeId: string;
  assessmentDate: string;
  atmosphereDimension: AtmosphereDimension;
  atmosphereRating: AtmosphereRating;
  assessmentMethod: AssessmentMethod;
  actionRequired: ActionRequired;
  assessorName: string;
  childViewsIncluded: boolean;
  staffViewsIncluded: boolean;
  visitorViewsIncluded: boolean;
  improvementActionsIdentified: boolean;
  actionsImplemented: boolean;
  sharedWithChildren: boolean;
  notes?: string | null;
}): Promise<ServiceResult<HomeAtmosphereAssessmentRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_atmosphere_assessments") as any)
    .insert({
      home_id: input.homeId,
      assessment_date: input.assessmentDate,
      atmosphere_dimension: input.atmosphereDimension,
      atmosphere_rating: input.atmosphereRating,
      assessment_method: input.assessmentMethod,
      action_required: input.actionRequired,
      assessor_name: input.assessorName,
      child_views_included: input.childViewsIncluded,
      staff_views_included: input.staffViewsIncluded,
      visitor_views_included: input.visitorViewsIncluded,
      improvement_actions_identified: input.improvementActionsIdentified,
      actions_implemented: input.actionsImplemented,
      shared_with_children: input.sharedWithChildren,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeHomeAtmosphereMetrics(
  rows: HomeAtmosphereAssessmentRow[],
): {
  total_assessments: number;
  inadequate_count: number;
  requires_improvement_count: number;
  urgent_action_count: number;
  actions_not_implemented_count: number;
  child_views_rate: number;
  staff_views_rate: number;
  visitor_views_rate: number;
  actions_implemented_rate: number;
  shared_with_children_rate: number;
  dimension_breakdown: Record<string, number>;
  rating_breakdown: Record<string, number>;
  unique_assessors: number;
} {
  const total = rows.length;

  const inadequate = rows.filter((r) => r.atmosphere_rating === "inadequate").length;
  const requiresImprovement = rows.filter((r) => r.atmosphere_rating === "requires_improvement").length;
  const urgentAction = rows.filter((r) => r.action_required === "urgent_action").length;
  const actionsNotImplemented = rows.filter((r) => r.improvement_actions_identified && !r.actions_implemented).length;

  const boolRate = (field: keyof HomeAtmosphereAssessmentRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  const dimensionBreakdown: Record<string, number> = {};
  for (const r of rows) dimensionBreakdown[r.atmosphere_dimension] = (dimensionBreakdown[r.atmosphere_dimension] ?? 0) + 1;

  const ratingBreakdown: Record<string, number> = {};
  for (const r of rows) ratingBreakdown[r.atmosphere_rating] = (ratingBreakdown[r.atmosphere_rating] ?? 0) + 1;

  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  return {
    total_assessments: total,
    inadequate_count: inadequate,
    requires_improvement_count: requiresImprovement,
    urgent_action_count: urgentAction,
    actions_not_implemented_count: actionsNotImplemented,
    child_views_rate: boolRate("child_views_included"),
    staff_views_rate: boolRate("staff_views_included"),
    visitor_views_rate: boolRate("visitor_views_included"),
    actions_implemented_rate: boolRate("actions_implemented"),
    shared_with_children_rate: boolRate("shared_with_children"),
    dimension_breakdown: dimensionBreakdown,
    rating_breakdown: ratingBreakdown,
    unique_assessors: uniqueAssessors,
  };
}

export function computeHomeAtmosphereAlerts(
  rows: HomeAtmosphereAssessmentRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: inadequate rating + urgent action required
  for (const r of rows) {
    if (r.atmosphere_rating === "inadequate" && r.action_required === "urgent_action") {
      alerts.push({
        type: "inadequate_urgent",
        severity: "critical",
        message: `Inadequate atmosphere rating for ${r.atmosphere_dimension.replace(/_/g, " ")} with urgent action required — address immediately to safeguard children's wellbeing`,
        record_id: r.id,
      });
    }
  }

  // High: requires_improvement + actions not implemented
  for (const r of rows) {
    if (r.atmosphere_rating === "requires_improvement" && r.improvement_actions_identified && !r.actions_implemented) {
      alerts.push({
        type: "improvement_actions_outstanding",
        severity: "high",
        message: `${r.atmosphere_dimension.replace(/_/g, " ")} requires improvement and identified actions have not been implemented — follow up to ensure progress`,
        record_id: r.id,
      });
    }
  }

  // High: child views not included in multiple assessments
  const noChildViews = rows.filter((r) => !r.child_views_included).length;
  if (noChildViews >= 2) {
    alerts.push({
      type: "child_views_missing",
      severity: "high",
      message: `${noChildViews} assessments do not include child views — children's voices must inform atmosphere assessments`,
    });
  }

  // Medium: improvement actions identified but not implemented
  const actionsNotImpl = rows.filter((r) => r.improvement_actions_identified && !r.actions_implemented).length;
  if (actionsNotImpl >= 2) {
    alerts.push({
      type: "actions_not_implemented",
      severity: "medium",
      message: `${actionsNotImpl} assessments have improvement actions identified but not yet implemented — review action plan progress`,
    });
  }

  return alerts;
}

export function generateHomeAtmosphereCaraInsights(
  metrics: ReturnType<typeof computeHomeAtmosphereMetrics>,
  alerts: ReturnType<typeof computeHomeAtmosphereAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (cyan-themed)
  insights.push(
    `[cyan] ${metrics.total_assessments} home atmosphere assessments recorded across ${metrics.unique_assessors} ${metrics.unique_assessors === 1 ? "assessor" : "assessors"}. ` +
      `Child views included in ${metrics.child_views_rate}% of assessments, staff views in ${metrics.staff_views_rate}%, ` +
      `and visitor views in ${metrics.visitor_views_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.inadequate_count} inadequate ratings, ${metrics.requires_improvement_count} requiring improvement, ` +
        `and ${metrics.actions_not_implemented_count} assessments with actions not yet implemented.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.inadequate_count} inadequate and ${metrics.requires_improvement_count} requiring improvement. ` +
        `Continue regular atmosphere assessments to maintain a warm and welcoming home.`,
    );
  }

  // Insight 3: Reflective question about atmosphere and children's experience
  if (metrics.inadequate_count > 0) {
    insights.push(
      `[reflect] ${metrics.inadequate_count} ${metrics.inadequate_count === 1 ? "assessment has" : "assessments have"} rated the atmosphere as inadequate. ` +
        `What underlying factors might be contributing to this, and how can the home team work together ` +
        `to create a warmer, more welcoming environment where every child feels they belong?`,
    );
  } else if (metrics.child_views_rate < 100) {
    insights.push(
      `[reflect] Child views are included in ${metrics.child_views_rate}% of atmosphere assessments. ` +
        `How can the home ensure every child has the opportunity to share their experience of the home atmosphere, ` +
        `and are there creative ways to capture the views of children who find formal feedback difficult?`,
    );
  } else {
    insights.push(
      `[reflect] All atmosphere assessments include child views and no inadequate ratings have been recorded. ` +
        `How can the home build on this positive foundation to continually strengthen the sense of belonging, ` +
        `warmth, and enjoyment that children experience in their daily lives?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeHomeAtmosphereMetrics,
  computeHomeAtmosphereAlerts,
  generateHomeAtmosphereCaraInsights,
};
