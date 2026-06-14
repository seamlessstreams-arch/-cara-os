// ══════════════════════════════════════════════════════════════════════════════
// CARA — OFSTED INSPECTION READINESS SERVICE
// Pre-inspection readiness checks, evidence gathering, action tracking,
// mock inspection outcomes, inspector focus areas. Helps managers prepare
// for inspections proactively.
// CHR 2015 all regulations (inspection readiness covers compliance with all),
// SCCIF (Social Care Common Inspection Framework) — all judgement areas,
// Ofsted inspection methodology, evidence requirements.
//
// Covers: readiness assessments, evidence status tracking, mock inspections,
// self-evaluation, regulatory compliance checks, improvement planning,
// and inspector focus area preparation.
//
// SCCIF: Leadership — "Leaders demonstrate a clear understanding of the
// strengths and areas for development." "Outstanding requires proactive
// self-evaluation and continuous improvement."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const READINESS_AREAS = [
  "overall_experiences_progress",
  "safety",
  "leadership_management",
  "education_skills_work",
  "health",
  "impact_of_leaders",
  "helping_children_make_progress",
] as const;
export type ReadinessArea = (typeof READINESS_AREAS)[number];

export const READINESS_RATINGS = [
  "outstanding",
  "good",
  "requires_improvement",
  "inadequate",
  "not_assessed",
] as const;
export type ReadinessRating = (typeof READINESS_RATINGS)[number];

export const EVIDENCE_STATUSES = [
  "evidence_gathered",
  "evidence_partial",
  "evidence_missing",
  "action_planned",
  "action_completed",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const INSPECTION_TYPES = [
  "full_inspection",
  "focused_visit",
  "monitoring_visit",
  "emergency_inspection",
  "mock_inspection",
] as const;
export type InspectionType = (typeof INSPECTION_TYPES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface OfstedInspectionReadinessRow {
  id: string;
  home_id: string;
  assessor_name: string;
  assessor_id: string | null;
  assessment_date: string;
  readiness_area: ReadinessArea;
  readiness_rating: ReadinessRating;
  evidence_status: EvidenceStatus;
  inspection_type: InspectionType;
  evidence_documented: boolean;
  staff_prepared: boolean;
  children_consulted: boolean;
  environment_ready: boolean;
  policies_up_to_date: boolean;
  records_accessible: boolean;
  improvement_actions_identified: boolean;
  improvement_actions_completed: boolean;
  manager_self_evaluation_done: boolean;
  regulatory_requirements_met: boolean;
  previous_recommendations_addressed: boolean;
  mock_inspection_completed: boolean;
  key_findings: string | null;
  improvement_plan_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listOfstedInspectionReadiness(
  homeId: string,
): Promise<ServiceResult<OfstedInspectionReadinessRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_ofsted_inspection_readiness") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("assessment_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createOfstedInspectionReadiness(input: {
  homeId: string;
  assessorName: string;
  assessorId?: string | null;
  assessmentDate: string;
  readinessArea: ReadinessArea;
  readinessRating: ReadinessRating;
  evidenceStatus: EvidenceStatus;
  inspectionType: InspectionType;
  evidenceDocumented?: boolean;
  staffPrepared?: boolean;
  childrenConsulted?: boolean;
  environmentReady?: boolean;
  policiesUpToDate?: boolean;
  recordsAccessible?: boolean;
  improvementActionsIdentified?: boolean;
  improvementActionsCompleted?: boolean;
  managerSelfEvaluationDone?: boolean;
  regulatoryRequirementsMet?: boolean;
  previousRecommendationsAddressed?: boolean;
  mockInspectionCompleted?: boolean;
  keyFindings?: string | null;
  improvementPlanNotes?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<OfstedInspectionReadinessRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_ofsted_inspection_readiness") as any)
    .insert({
      home_id: input.homeId,
      assessor_name: input.assessorName,
      assessor_id: input.assessorId ?? null,
      assessment_date: input.assessmentDate,
      readiness_area: input.readinessArea,
      readiness_rating: input.readinessRating,
      evidence_status: input.evidenceStatus,
      inspection_type: input.inspectionType,
      evidence_documented: input.evidenceDocumented ?? false,
      staff_prepared: input.staffPrepared ?? false,
      children_consulted: input.childrenConsulted ?? false,
      environment_ready: input.environmentReady ?? false,
      policies_up_to_date: input.policiesUpToDate ?? false,
      records_accessible: input.recordsAccessible ?? false,
      improvement_actions_identified: input.improvementActionsIdentified ?? false,
      improvement_actions_completed: input.improvementActionsCompleted ?? false,
      manager_self_evaluation_done: input.managerSelfEvaluationDone ?? false,
      regulatory_requirements_met: input.regulatoryRequirementsMet ?? false,
      previous_recommendations_addressed: input.previousRecommendationsAddressed ?? false,
      mock_inspection_completed: input.mockInspectionCompleted ?? false,
      key_findings: input.keyFindings ?? null,
      improvement_plan_notes: input.improvementPlanNotes ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeOfstedReadinessMetrics(
  rows: OfstedInspectionReadinessRow[],
): {
  total_assessments: number;
  inadequate_count: number;
  requires_improvement_count: number;
  outstanding_count: number;
  evidence_missing_count: number;
  evidence_documented_rate: number;
  staff_prepared_rate: number;
  children_consulted_rate: number;
  environment_ready_rate: number;
  policies_current_rate: number;
  records_accessible_rate: number;
  improvement_completed_rate: number;
  self_evaluation_rate: number;
  mock_inspection_rate: number;
  regulatory_met_rate: number;
  previous_recommendations_rate: number;
  area_breakdown: Record<string, number>;
  rating_breakdown: Record<string, number>;
  unique_assessors: number;
} {
  const total = rows.length;

  const inadequate = rows.filter((r) => r.readiness_rating === "inadequate").length;
  const reqImprovement = rows.filter((r) => r.readiness_rating === "requires_improvement").length;
  const outstanding = rows.filter((r) => r.readiness_rating === "outstanding").length;
  const evidenceMissing = rows.filter((r) => r.evidence_status === "evidence_missing").length;

  const boolRate = (field: keyof OfstedInspectionReadinessRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  const areaBreakdown: Record<string, number> = {};
  for (const r of rows) areaBreakdown[r.readiness_area] = (areaBreakdown[r.readiness_area] ?? 0) + 1;

  const ratingBreakdown: Record<string, number> = {};
  for (const r of rows) ratingBreakdown[r.readiness_rating] = (ratingBreakdown[r.readiness_rating] ?? 0) + 1;

  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  return {
    total_assessments: total,
    inadequate_count: inadequate,
    requires_improvement_count: reqImprovement,
    outstanding_count: outstanding,
    evidence_missing_count: evidenceMissing,
    evidence_documented_rate: boolRate("evidence_documented"),
    staff_prepared_rate: boolRate("staff_prepared"),
    children_consulted_rate: boolRate("children_consulted"),
    environment_ready_rate: boolRate("environment_ready"),
    policies_current_rate: boolRate("policies_up_to_date"),
    records_accessible_rate: boolRate("records_accessible"),
    improvement_completed_rate: boolRate("improvement_actions_completed"),
    self_evaluation_rate: boolRate("manager_self_evaluation_done"),
    mock_inspection_rate: boolRate("mock_inspection_completed"),
    regulatory_met_rate: boolRate("regulatory_requirements_met"),
    previous_recommendations_rate: boolRate("previous_recommendations_addressed"),
    area_breakdown: areaBreakdown,
    rating_breakdown: ratingBreakdown,
    unique_assessors: uniqueAssessors,
  };
}

export function computeOfstedReadinessAlerts(
  rows: OfstedInspectionReadinessRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: inadequate rating in any area
  for (const r of rows) {
    if (r.readiness_rating === "inadequate") {
      alerts.push({
        type: "inadequate_rating",
        severity: "critical",
        message: `Inadequate rating in ${r.readiness_area.replace(/_/g, " ")} — immediate action required to address deficiencies before inspection`,
        record_id: r.id,
      });
    }
  }

  // Critical: regulatory requirements not met
  for (const r of rows) {
    if (!r.regulatory_requirements_met) {
      alerts.push({
        type: "regulatory_not_met",
        severity: "critical",
        message: `Regulatory requirements not met for ${r.readiness_area.replace(/_/g, " ")} assessment — ensure compliance with CHR 2015 regulations`,
        record_id: r.id,
      });
    }
  }

  // High: requires_improvement with no improvement actions identified
  for (const r of rows) {
    if (r.readiness_rating === "requires_improvement" && !r.improvement_actions_identified) {
      alerts.push({
        type: "no_improvement_actions",
        severity: "high",
        message: `Requires improvement in ${r.readiness_area.replace(/_/g, " ")} but no improvement actions identified — develop an action plan`,
        record_id: r.id,
      });
    }
  }

  // High: evidence missing in safety or leadership areas
  for (const r of rows) {
    if (r.evidence_status === "evidence_missing" && (r.readiness_area === "safety" || r.readiness_area === "leadership_management")) {
      alerts.push({
        type: "evidence_missing_critical_area",
        severity: "high",
        message: `Evidence missing in ${r.readiness_area.replace(/_/g, " ")} — this is a key inspection focus area requiring documented evidence`,
        record_id: r.id,
      });
    }
  }

  // Medium: mock inspection not completed
  for (const r of rows) {
    if (!r.mock_inspection_completed) {
      alerts.push({
        type: "mock_inspection_not_completed",
        severity: "medium",
        message: `Mock inspection not completed for ${r.readiness_area.replace(/_/g, " ")} assessment — conduct a practice inspection to identify gaps`,
        record_id: r.id,
      });
    }
  }

  // Medium: previous recommendations not addressed
  for (const r of rows) {
    if (!r.previous_recommendations_addressed) {
      alerts.push({
        type: "previous_recommendations_not_addressed",
        severity: "medium",
        message: `Previous recommendations not addressed for ${r.readiness_area.replace(/_/g, " ")} — Ofsted will check progress on prior findings`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateOfstedReadinessCaraInsights(
  rows: OfstedInspectionReadinessRow[],
): string[] {
  const insights: string[] = [];
  const metrics = computeOfstedReadinessMetrics(rows);
  const alerts = computeOfstedReadinessAlerts(rows);

  // Insight 1: Summary counts
  insights.push(
    `[cyan] ${metrics.total_assessments} inspection readiness ${metrics.total_assessments === 1 ? "assessment" : "assessments"} recorded across ${metrics.unique_assessors} ${metrics.unique_assessors === 1 ? "assessor" : "assessors"}. ` +
      `${metrics.outstanding_count} rated outstanding, ${metrics.inadequate_count} inadequate, ` +
      `and ${metrics.evidence_missing_count} with evidence missing.`,
  );

  // Insight 2: Priority findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority ${highAlerts.length === 1 ? "alert" : "alerts"} identified. ` +
        `Self-evaluation completed in ${metrics.self_evaluation_rate}% of assessments, ` +
        `regulatory requirements met in ${metrics.regulatory_met_rate}%, ` +
        `and mock inspections completed in ${metrics.mock_inspection_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `Self-evaluation completed in ${metrics.self_evaluation_rate}% of assessments, ` +
        `regulatory requirements met in ${metrics.regulatory_met_rate}%, ` +
        `and mock inspections completed in ${metrics.mock_inspection_rate}%.`,
    );
  }

  // Insight 3: Reflective question about inspection preparedness
  if (metrics.inadequate_count > 0) {
    insights.push(
      `[reflect] ${metrics.inadequate_count} ${metrics.inadequate_count === 1 ? "area is" : "areas are"} rated inadequate. ` +
        `What systemic changes are needed to move these areas to at least good, ` +
        `and how can the team demonstrate sustained improvement to inspectors?`,
    );
  } else if (metrics.evidence_missing_count > 0) {
    insights.push(
      `[reflect] ${metrics.evidence_missing_count} ${metrics.evidence_missing_count === 1 ? "assessment has" : "assessments have"} evidence missing. ` +
        `Could a structured evidence portfolio for each SCCIF judgement area ` +
        `strengthen the home's position during an unannounced inspection?`,
    );
  } else {
    insights.push(
      `[reflect] All readiness areas have evidence gathered and no inadequate ratings. ` +
        `How can the home build on this strong foundation to demonstrate the continuous ` +
        `improvement and proactive self-evaluation that characterises outstanding provision?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeOfstedReadinessMetrics,
  computeOfstedReadinessAlerts,
  generateOfstedReadinessCaraInsights,
};
