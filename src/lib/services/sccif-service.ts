// ==============================================================================
// CORNERSTONE -- SCCIF SELF-EVALUATION SERVICE
// Social Care Common Inspection Framework self-evaluation tooling. Manages
// self-evaluations, evidence entries, judgment grading, and inspection readiness
// alerts aligned to Ofsted's three key judgments.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// -- Constants ----------------------------------------------------------------

export const SCCIF_JUDGMENTS = [
  { key: "overall_experiences", label: "Overall experiences and progress of children and young people", order: 1 },
  { key: "helped_and_protected", label: "How well children and young people are helped and protected", order: 2 },
  { key: "leadership_and_management", label: "The effectiveness of leaders and managers", order: 3 },
];

export const JUDGMENT_GRADES = [
  "outstanding",
  "good",
  "requires_improvement",
  "inadequate",
];

export const SCCIF_EVIDENCE_AREAS: { area: string; judgment: string; regulation: string }[] = [
  { area: "care_planning", judgment: "overall_experiences", regulation: "Reg 14" },
  { area: "education_progress", judgment: "overall_experiences", regulation: "Reg 8/23" },
  { area: "health_wellbeing", judgment: "overall_experiences", regulation: "Reg 10" },
  { area: "positive_relationships", judgment: "overall_experiences", regulation: "Reg 11" },
  { area: "independence_skills", judgment: "overall_experiences", regulation: "Reg 8/9" },
  { area: "enjoyment_achievement", judgment: "overall_experiences", regulation: "Reg 8" },
  { area: "child_voice", judgment: "overall_experiences", regulation: "Reg 7" },
  { area: "safeguarding", judgment: "helped_and_protected", regulation: "Reg 12/34" },
  { area: "risk_management", judgment: "helped_and_protected", regulation: "Reg 12" },
  { area: "behaviour_management", judgment: "helped_and_protected", regulation: "Reg 19/20" },
  { area: "missing_exploitation", judgment: "helped_and_protected", regulation: "Reg 12/34" },
  { area: "medication_management", judgment: "helped_and_protected", regulation: "Reg 23" },
  { area: "notifications", judgment: "helped_and_protected", regulation: "Reg 40" },
  { area: "staffing_supervision", judgment: "leadership_and_management", regulation: "Reg 33/34" },
  { area: "training_development", judgment: "leadership_and_management", regulation: "Reg 33" },
  { area: "quality_of_care_review", judgment: "leadership_and_management", regulation: "Reg 45" },
  { area: "independent_visits", judgment: "leadership_and_management", regulation: "Reg 44" },
  { area: "complaints_management", judgment: "leadership_and_management", regulation: "Reg 39/40" },
  { area: "recording_quality", judgment: "leadership_and_management", regulation: "Reg 36" },
  { area: "premises_safety", judgment: "leadership_and_management", regulation: "Reg 25" },
];

// -- Types --------------------------------------------------------------------

export interface SelfEvaluation {
  id: string;
  home_id: string;
  period_from: string;
  period_to: string;
  status: "draft" | "in_review" | "final";
  overall_grade?: string | null;
  helped_protected_grade?: string | null;
  leadership_grade?: string | null;
  strengths: string[];
  areas_for_improvement: string[];
  created_by: string;
  approved_by?: string | null;
  approved_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceEntry {
  id: string;
  home_id: string;
  evaluation_id: string;
  evidence_area: string;
  description: string;
  data_source?: string | null;
  metric_value?: number | null;
  metric_label?: string | null;
  grade_indicator: "strength" | "area_for_development" | "neutral";
  regulation_reference?: string | null;
  created_at: string;
}

// -- Pure functions -----------------------------------------------------------

export interface SelfEvaluationSummary {
  total_evidence: number;
  by_judgment: Record<string, { strengths: number; developments: number; neutral: number; total: number }>;
  by_area: Record<string, { strengths: number; developments: number; total: number }>;
  strength_percentage: number;
  coverage: number;
  uncovered_areas: string[];
}

export function computeSelfEvaluationSummary(
  evidenceEntries: EvidenceEntry[],
): SelfEvaluationSummary {
  // Build judgment lookup: evidence_area -> judgment key
  const areaToJudgment: Record<string, string> = {};
  for (const ea of SCCIF_EVIDENCE_AREAS) {
    areaToJudgment[ea.area] = ea.judgment;
  }

  const byJudgment: Record<string, { strengths: number; developments: number; neutral: number; total: number }> = {};
  const byArea: Record<string, { strengths: number; developments: number; total: number }> = {};

  // Initialise judgment buckets
  for (const j of SCCIF_JUDGMENTS) {
    byJudgment[j.key] = { strengths: 0, developments: 0, neutral: 0, total: 0 };
  }

  // Tally
  let strengthCount = 0;
  for (const entry of evidenceEntries) {
    const judgment = areaToJudgment[entry.evidence_area];

    // by_area
    if (!byArea[entry.evidence_area]) {
      byArea[entry.evidence_area] = { strengths: 0, developments: 0, total: 0 };
    }
    byArea[entry.evidence_area].total += 1;

    if (entry.grade_indicator === "strength") {
      strengthCount += 1;
      byArea[entry.evidence_area].strengths += 1;
      if (judgment && byJudgment[judgment]) {
        byJudgment[judgment].strengths += 1;
      }
    } else if (entry.grade_indicator === "area_for_development") {
      byArea[entry.evidence_area].developments += 1;
      if (judgment && byJudgment[judgment]) {
        byJudgment[judgment].developments += 1;
      }
    } else {
      if (judgment && byJudgment[judgment]) {
        byJudgment[judgment].neutral += 1;
      }
    }

    if (judgment && byJudgment[judgment]) {
      byJudgment[judgment].total += 1;
    }
  }

  // Coverage: % of SCCIF_EVIDENCE_AREAS with at least 1 evidence entry
  const coveredAreas = new Set(evidenceEntries.map((e) => e.evidence_area));
  const allAreas = SCCIF_EVIDENCE_AREAS.map((ea) => ea.area);
  const uncoveredAreas = allAreas.filter((a) => !coveredAreas.has(a));
  const coverage = allAreas.length > 0
    ? Math.round((((allAreas.length - uncoveredAreas.length) / allAreas.length) * 100) * 10) / 10
    : 0;

  const total = evidenceEntries.length;
  const strengthPercentage = total > 0
    ? Math.round(((strengthCount / total) * 100) * 10) / 10
    : 0;

  return {
    total_evidence: total,
    by_judgment: byJudgment,
    by_area: byArea,
    strength_percentage: strengthPercentage,
    coverage,
    uncovered_areas: uncoveredAreas,
  };
}

export interface JudgmentGradeSuggestion {
  suggested_grade: string;
  strength_ratio: number;
  evidence_count: number;
  confidence: "high" | "medium" | "low";
}

export function suggestJudgmentGrade(
  evidenceEntries: EvidenceEntry[],
  judgmentKey: string,
): JudgmentGradeSuggestion {
  // Find which evidence areas belong to this judgment
  const areasForJudgment = new Set(
    SCCIF_EVIDENCE_AREAS
      .filter((ea) => ea.judgment === judgmentKey)
      .map((ea) => ea.area),
  );

  // Filter evidence to only entries in this judgment's areas
  const relevant = evidenceEntries.filter((e) => areasForJudgment.has(e.evidence_area));
  const evidenceCount = relevant.length;
  const strengthCount = relevant.filter((e) => e.grade_indicator === "strength").length;
  const strengthRatio = evidenceCount > 0
    ? Math.round(((strengthCount / evidenceCount) * 100) * 10) / 10
    : 0;

  let suggestedGrade: string;
  if (strengthRatio >= 80) {
    suggestedGrade = "outstanding";
  } else if (strengthRatio >= 60) {
    suggestedGrade = "good";
  } else if (strengthRatio >= 40) {
    suggestedGrade = "requires_improvement";
  } else {
    suggestedGrade = "inadequate";
  }

  let confidence: "high" | "medium" | "low";
  if (evidenceCount >= 10) {
    confidence = "high";
  } else if (evidenceCount >= 5) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    suggested_grade: suggestedGrade,
    strength_ratio: strengthRatio,
    evidence_count: evidenceCount,
    confidence,
  };
}

export interface SCCIFAlert {
  type: string;
  severity: "high" | "medium" | "low";
  message: string;
}

export function identifySCCIFAlerts(
  evidenceEntries: EvidenceEntry[],
  evaluations: SelfEvaluation[],
): SCCIFAlert[] {
  const alerts: SCCIFAlert[] = [];
  const now = new Date();

  // 1. no_current_evaluation: no evaluation whose period covers the current date
  const hasCurrent = evaluations.some((ev) => {
    const from = new Date(ev.period_from);
    const to = new Date(ev.period_to);
    return from <= now && to >= now;
  });
  if (!hasCurrent) {
    alerts.push({
      type: "no_current_evaluation",
      severity: "high",
      message: "No self-evaluation covers the current period. Create one to ensure inspection readiness.",
    });
  }

  // Compute summary for coverage/judgment checks
  const summary = computeSelfEvaluationSummary(evidenceEntries);

  // 2. low_coverage: evidence coverage below 75%
  if (summary.coverage < 75) {
    alerts.push({
      type: "low_coverage",
      severity: "medium",
      message: `Evidence coverage is ${summary.coverage}%, below the recommended 75% threshold. ${summary.uncovered_areas.length} area(s) have no evidence.`,
    });
  }

  // 3. weak_judgment: any judgment with strength_ratio below 40%
  for (const j of SCCIF_JUDGMENTS) {
    const grade = suggestJudgmentGrade(evidenceEntries, j.key);
    if (grade.evidence_count > 0 && grade.strength_ratio < 40) {
      alerts.push({
        type: "weak_judgment",
        severity: "high",
        message: `"${j.label}" has a strength ratio of ${grade.strength_ratio}%, suggesting an inadequate grade. Review evidence and practice in this area.`,
      });
    }
  }

  // 4. uncovered_area: specific evidence area with 0 entries
  for (const area of summary.uncovered_areas) {
    const eaConfig = SCCIF_EVIDENCE_AREAS.find((ea) => ea.area === area);
    const label = area.replace(/_/g, " ");
    alerts.push({
      type: "uncovered_area",
      severity: "medium",
      message: `No evidence recorded for "${label}"${eaConfig ? ` (${eaConfig.regulation})` : ""}. Add evidence to strengthen your self-evaluation.`,
    });
  }

  // 5. draft_too_long: draft evaluation older than 30 days
  for (const ev of evaluations) {
    if (ev.status === "draft") {
      const created = new Date(ev.created_at);
      const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreation > 30) {
        alerts.push({
          type: "draft_too_long",
          severity: "medium",
          message: `Draft self-evaluation created ${daysSinceCreation} days ago has not been finalised. Review and progress to "in_review" or "final".`,
        });
      }
    }
  }

  return alerts;
}

// -- CRUD: Self-Evaluations ---------------------------------------------------

export async function listSelfEvaluations(
  homeId: string,
  filters?: { status?: string; limit?: number },
): Promise<ServiceResult<SelfEvaluation[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_self_evaluations") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSelfEvaluation(input: {
  homeId: string;
  periodFrom: string;
  periodTo: string;
  status?: "draft" | "in_review" | "final";
  overallGrade?: string;
  helpedProtectedGrade?: string;
  leadershipGrade?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  createdBy: string;
}): Promise<ServiceResult<SelfEvaluation>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_self_evaluations") as SB)
    .insert({
      home_id: input.homeId,
      period_from: input.periodFrom,
      period_to: input.periodTo,
      status: input.status ?? "draft",
      overall_grade: input.overallGrade ?? null,
      helped_protected_grade: input.helpedProtectedGrade ?? null,
      leadership_grade: input.leadershipGrade ?? null,
      strengths: input.strengths ?? [],
      areas_for_improvement: input.areasForImprovement ?? [],
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSelfEvaluation(
  id: string,
  updates: {
    status?: "draft" | "in_review" | "final";
    overallGrade?: string;
    helpedProtectedGrade?: string;
    leadershipGrade?: string;
    strengths?: string[];
    areasForImprovement?: string[];
    approvedBy?: string;
    approvedDate?: string;
  },
): Promise<ServiceResult<SelfEvaluation>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const row: Record<string, unknown> = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.overallGrade !== undefined) row.overall_grade = updates.overallGrade;
  if (updates.helpedProtectedGrade !== undefined) row.helped_protected_grade = updates.helpedProtectedGrade;
  if (updates.leadershipGrade !== undefined) row.leadership_grade = updates.leadershipGrade;
  if (updates.strengths !== undefined) row.strengths = updates.strengths;
  if (updates.areasForImprovement !== undefined) row.areas_for_improvement = updates.areasForImprovement;
  if (updates.approvedBy !== undefined) row.approved_by = updates.approvedBy;
  if (updates.approvedDate !== undefined) row.approved_date = updates.approvedDate;

  const { data, error } = await (s.from("cs_self_evaluations") as SB)
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// -- CRUD: Evidence Entries ---------------------------------------------------

export async function listEvidenceEntries(
  homeId: string,
  filters?: {
    evaluationId?: string;
    evidenceArea?: string;
    gradeIndicator?: string;
    limit?: number;
  },
): Promise<ServiceResult<EvidenceEntry[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_evaluation_evidence") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.evaluationId) q = q.eq("evaluation_id", filters.evaluationId);
  if (filters?.evidenceArea) q = q.eq("evidence_area", filters.evidenceArea);
  if (filters?.gradeIndicator) q = q.eq("grade_indicator", filters.gradeIndicator);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createEvidenceEntry(input: {
  homeId: string;
  evaluationId: string;
  evidenceArea: string;
  description: string;
  dataSource?: string;
  metricValue?: number;
  metricLabel?: string;
  gradeIndicator: "strength" | "area_for_development" | "neutral";
  regulationReference?: string;
}): Promise<ServiceResult<EvidenceEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_evaluation_evidence") as SB)
    .insert({
      home_id: input.homeId,
      evaluation_id: input.evaluationId,
      evidence_area: input.evidenceArea,
      description: input.description,
      data_source: input.dataSource ?? null,
      metric_value: input.metricValue ?? null,
      metric_label: input.metricLabel ?? null,
      grade_indicator: input.gradeIndicator,
      regulation_reference: input.regulationReference ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// -- Testing exports ----------------------------------------------------------

export const _testing = {
  computeSelfEvaluationSummary,
  suggestJudgmentGrade,
  identifySCCIFAlerts,
};
