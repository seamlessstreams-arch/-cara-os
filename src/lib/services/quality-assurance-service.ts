// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUALITY ASSURANCE & INTERNAL AUDIT SERVICE
// Manages internal quality audits, regulatory self-assessments, improvement
// plans, and quality monitoring schedules. Evidence base for Reg 45
// (review of quality of care) and SCCIF Leadership & Management judgment.
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

export interface QualityAudit {
  id: string;
  home_id: string;
  audit_type: string;
  audit_date: string;
  auditor: string;
  areas_audited: AuditArea[];
  overall_rating: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: AuditRecommendation[];
  previous_actions_reviewed: boolean;
  previous_actions_status: string;
  next_audit_date?: string | null;
  status: "planned" | "in_progress" | "completed" | "overdue";
  created_at: string;
  updated_at: string;
}

export interface AuditArea {
  area: string;
  rating: string;
  findings: string;
  evidence_reviewed: string[];
}

export interface AuditRecommendation {
  description: string;
  priority: string;
  assigned_to: string;
  target_date: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
}

export interface ImprovementPlan {
  id: string;
  home_id: string;
  title: string;
  source: string;
  created_date: string;
  target_completion: string;
  actions: ImprovementAction[];
  status: "active" | "completed" | "overdue" | "superseded";
  progress_percentage: number;
  review_date?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImprovementAction {
  description: string;
  responsible: string;
  target_date: string;
  status: "not_started" | "in_progress" | "completed" | "overdue";
  evidence?: string;
  completion_date?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const AUDIT_TYPES: { type: string; label: string; frequency: string; regulation: string }[] = [
  { type: "reg45_quality", label: "Reg 45 Quality of Care Review", frequency: "6-monthly", regulation: "Reg 45" },
  { type: "safeguarding", label: "Safeguarding Audit", frequency: "Quarterly", regulation: "Reg 12" },
  { type: "medication", label: "Medication Audit", frequency: "Monthly", regulation: "Reg 23" },
  { type: "records_management", label: "Records Management Audit", frequency: "Quarterly", regulation: "Reg 36" },
  { type: "health_safety", label: "Health & Safety Audit", frequency: "Monthly", regulation: "Reg 25" },
  { type: "care_planning", label: "Care Planning Audit", frequency: "Quarterly", regulation: "Reg 14" },
  { type: "daily_recording", label: "Daily Recording Quality Audit", frequency: "Monthly", regulation: "Reg 36" },
  { type: "staff_files", label: "Staff Files & Recruitment Audit", frequency: "6-monthly", regulation: "Reg 32/33" },
  { type: "children_participation", label: "Children's Participation Audit", frequency: "Quarterly", regulation: "Reg 7/16" },
  { type: "complaints", label: "Complaints & Representations Audit", frequency: "Quarterly", regulation: "Reg 39" },
];

export const AUDIT_RATINGS: { rating: string; label: string; value: number }[] = [
  { rating: "outstanding", label: "Outstanding", value: 4 },
  { rating: "good", label: "Good", value: 3 },
  { rating: "requires_improvement", label: "Requires Improvement", value: 2 },
  { rating: "inadequate", label: "Inadequate", value: 1 },
];

export const IMPROVEMENT_SOURCES: string[] = [
  "Reg 45 review",
  "Internal audit",
  "Ofsted inspection",
  "Reg 44 visit",
  "Complaint investigation",
  "Serious incident review",
  "Staff feedback",
  "Children's feedback",
  "External consultation",
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute quality assurance metrics.
 */
function computeQAMetrics(
  audits: QualityAudit[],
  plans: ImprovementPlan[],
): {
  total_audits: number;
  completed: number;
  overdue: number;
  avg_rating: number;
  by_type: Record<string, { count: number; avg_rating: number }>;
  total_recommendations: number;
  recommendations_completed: number;
  recommendations_overdue: number;
  recommendation_completion_rate: number;
  improvement_plans_active: number;
  improvement_plans_completed: number;
  avg_plan_progress: number;
} {
  const completed = audits.filter((a) => a.status === "completed");
  const overdue = audits.filter((a) => a.status === "overdue");

  // Average rating
  let ratingSum = 0;
  let ratingCount = 0;
  for (const a of completed) {
    const scale = AUDIT_RATINGS.find((r) => r.rating === a.overall_rating);
    if (scale) {
      ratingSum += scale.value;
      ratingCount++;
    }
  }
  const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : 0;

  // By type
  const byType: Record<string, { count: number; avg_rating: number }> = {};
  for (const a of audits) {
    if (!byType[a.audit_type]) {
      byType[a.audit_type] = { count: 0, avg_rating: 0 };
    }
    byType[a.audit_type].count++;
  }
  // Compute avg rating per type from completed audits
  for (const type of Object.keys(byType)) {
    const typeCompleted = completed.filter((a) => a.audit_type === type);
    let sum = 0;
    let cnt = 0;
    for (const a of typeCompleted) {
      const scale = AUDIT_RATINGS.find((r) => r.rating === a.overall_rating);
      if (scale) { sum += scale.value; cnt++; }
    }
    byType[type].avg_rating = cnt > 0 ? Math.round((sum / cnt) * 100) / 100 : 0;
  }

  // Recommendations
  const allRecs = audits.flatMap((a) => a.recommendations);
  const recsCompleted = allRecs.filter((r) => r.status === "completed").length;
  const recsOverdue = allRecs.filter((r) => r.status === "overdue").length;
  const recCompletionRate = allRecs.length > 0
    ? Math.round((recsCompleted / allRecs.length) * 100)
    : 0;

  // Improvement plans
  const activePlans = plans.filter((p) => p.status === "active");
  const completedPlans = plans.filter((p) => p.status === "completed");
  const avgProgress = activePlans.length > 0
    ? Math.round(activePlans.reduce((s, p) => s + p.progress_percentage, 0) / activePlans.length)
    : 0;

  return {
    total_audits: audits.length,
    completed: completed.length,
    overdue: overdue.length,
    avg_rating: avgRating,
    by_type: byType,
    total_recommendations: allRecs.length,
    recommendations_completed: recsCompleted,
    recommendations_overdue: recsOverdue,
    recommendation_completion_rate: recCompletionRate,
    improvement_plans_active: activePlans.length,
    improvement_plans_completed: completedPlans.length,
    avg_plan_progress: avgProgress,
  };
}

/**
 * Identify quality assurance alerts.
 */
function identifyQAAlerts(
  audits: QualityAudit[],
  plans: ImprovementPlan[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [];

  // Overdue audits
  const overdueAudits = audits.filter((a) => a.status === "overdue");
  if (overdueAudits.length > 0) {
    alerts.push({
      type: "overdue_audit",
      severity: "high",
      message: `${overdueAudits.length} quality audit${overdueAudits.length > 1 ? "s" : ""} overdue — Reg 45 requires systematic review of the quality of care.`,
    });
  }

  // Inadequate ratings
  const inadequate = audits.filter(
    (a) => a.status === "completed" && a.overall_rating === "inadequate",
  );
  for (const a of inadequate) {
    alerts.push({
      type: "inadequate_audit",
      severity: "critical",
      message: `${AUDIT_TYPES.find((t) => t.type === a.audit_type)?.label ?? a.audit_type} rated 'Inadequate' on ${a.audit_date}. Immediate improvement plan required.`,
    });
  }

  // Overdue recommendations
  const overdueRecs = audits.flatMap((a) => a.recommendations).filter((r) => r.status === "overdue");
  if (overdueRecs.length > 0) {
    alerts.push({
      type: "overdue_recommendations",
      severity: "medium",
      message: `${overdueRecs.length} audit recommendation${overdueRecs.length > 1 ? "s" : ""} overdue — review and update action plans.`,
    });
  }

  // Overdue improvement plans
  const overduePlans = plans.filter((p) => p.status === "overdue");
  if (overduePlans.length > 0) {
    alerts.push({
      type: "overdue_plan",
      severity: "high",
      message: `${overduePlans.length} improvement plan${overduePlans.length > 1 ? "s" : ""} overdue — escalate to responsible individual.`,
    });
  }

  // Stalled improvement plans (active but < 25% progress)
  const stalledPlans = plans.filter(
    (p) => p.status === "active" && p.progress_percentage < 25,
  );
  if (stalledPlans.length > 0) {
    alerts.push({
      type: "stalled_plan",
      severity: "medium",
      message: `${stalledPlans.length} active improvement plan${stalledPlans.length > 1 ? "s" : ""} below 25% progress — may need additional resources or timeline adjustment.`,
    });
  }

  // Previous actions not reviewed
  const notReviewed = audits.filter(
    (a) => a.status === "completed" && !a.previous_actions_reviewed,
  );
  if (notReviewed.length > 0) {
    alerts.push({
      type: "actions_not_reviewed",
      severity: "low",
      message: `${notReviewed.length} completed audit${notReviewed.length > 1 ? "s" : ""} did not review previous actions. This weakens the audit cycle.`,
    });
  }

  return alerts;
}

// ── CRUD — Quality Audits ───────────────────────────────────────────────────

export async function listAudits(
  homeId: string,
  filters?: {
    auditType?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<QualityAudit[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<QualityAudit[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<QualityAudit[]>;

  let q = (s.from("cs_quality_audits") as SB).select("*").eq("home_id", homeId);
  if (filters?.auditType) q = q.eq("audit_type", filters.auditType);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("audit_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("audit_date", filters.dateTo);
  q = q.order("audit_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAudit(
  input: Omit<QualityAudit, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<QualityAudit>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_quality_audits") as SB)
    .insert({
      home_id: input.home_id,
      audit_type: input.audit_type,
      audit_date: input.audit_date,
      auditor: input.auditor,
      areas_audited: input.areas_audited,
      overall_rating: input.overall_rating,
      strengths: input.strengths,
      areas_for_improvement: input.areas_for_improvement,
      recommendations: input.recommendations,
      previous_actions_reviewed: input.previous_actions_reviewed,
      previous_actions_status: input.previous_actions_status,
      next_audit_date: input.next_audit_date ?? null,
      status: input.status,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAudit(
  id: string,
  updates: Partial<QualityAudit>,
): Promise<ServiceResult<QualityAudit>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_quality_audits") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Improvement Plans ────────────────────────────────────────────────

export async function listImprovementPlans(
  homeId: string,
  filters?: {
    status?: string;
    source?: string;
    limit?: number;
  },
): Promise<ServiceResult<ImprovementPlan[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<ImprovementPlan[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<ImprovementPlan[]>;

  let q = (s.from("cs_improvement_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.source) q = q.eq("source", filters.source);
  q = q.order("created_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createImprovementPlan(
  input: Omit<ImprovementPlan, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<ImprovementPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_improvement_plans") as SB)
    .insert({
      home_id: input.home_id,
      title: input.title,
      source: input.source,
      created_date: input.created_date,
      target_completion: input.target_completion,
      actions: input.actions,
      status: input.status,
      progress_percentage: input.progress_percentage,
      review_date: input.review_date ?? null,
      reviewed_by: input.reviewed_by ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateImprovementPlan(
  id: string,
  updates: Partial<ImprovementPlan>,
): Promise<ServiceResult<ImprovementPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_improvement_plans") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeQAMetrics,
  identifyQAAlerts,
};
